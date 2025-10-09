/**
 * Google Apps Script Web App: Contact Form Handler
 * Features:
 *  - Sanitizes & validates input (honeypot anti‑bot field supported)
 *  - Logs submissions to a Google Sheet (if SHEET_ID provided)
 *  - Sends email to PRIMARY inbox, BCC alias to ensure message lands in Inbox (avoids self-sent suppression)
 *  - Uses replyTo so you can directly reply to the site visitor
 *  - Returns JSON: {status, message, sheetRow}
 *  - Provides an HTML + plain text fallback body
 *  - Test harness (testDoPost_) for local simulation
 *
 * Deployment Instructions:
 * 1. Open Apps Script: Extensions > Apps Script (or https://script.google.com)
 * 2. Paste this file (replace existing).
 * 3. (Optional) Set SHEET_ID below after creating a Sheet with a tab named 'Submissions' (or let script create it).
 * 4. Deploy > New deployment > Type: Web app. Execute as: Me. Access: Anyone.
 * 5. Copy the Web App URL & set as the form action on the site.
 * 6. After updating: RE-DEPLOY (a new version) or users will hit an older deployment.
 */

// ================== CONFIGURATION ==================
// Provide a Sheet ID to enable logging (the long ID in the Sheet URL). Leave blank to disable.
var SHEET_ID = '1sdiiAAEhOBJIMYj2ZjMrIVABDRHSdV4yzI9t4F-t8VU'; // e.g. '1AbCdEfGhIjKlMnOpQr...'
var SHEET_NAME = 'ContactForm';

// Alias (public) address and primary inbox. If PRIMARY_INBOX left blank, will fallback to effective user.
var ALIAS_ADDRESS = 'info@lifeprepacademyfoundation.com';
var PRIMARY_INBOX = 'bhall@lifeprepacademyfoundation.com'; // Set to real login (e.g. 'yourname@domain.com'). Blank -> auto detect.

// Send acknowledgement email back to submitter?
var SEND_ACK = false; // disabled to stop auto-replies to submitters
var ACK_SUBJECT = 'We received your message';
var ACK_HTML = function(name){return '<p>Hi '+escapeHtml_(name||'there')+',</p><p>Thank you for contacting Lifeprep Academy Foundation. We\'ve received your message and will respond soon.</p><p><em>This is an automated confirmation.</em></p>';};
var ACK_TEXT = function(name){return 'Hi '+(name||'there')+'\n\nThank you for contacting Lifeprep Academy Foundation. We\'ve received your message and will respond soon.\n\n(This is an automated confirmation.)';};

// Basic rate limit (per IP) configuration (very lightweight / optional)
var RATE_LIMIT_PER_MIN = 15; // max submissions per IP per rolling minute window
// Anti-spam thresholds and options
var MIN_DWELL_MS = 8000;       // require >= 8s dwell time (server-enforced)
var MIN_TYPED_CHARS = 24;      // require >= 24 typed characters (server-enforced)
var EMAIL_WINDOW_MS = 12 * 60 * 60 * 1000;  // per-email cooldown (12 hours)
var CLIENT_WINDOW_MS = 10 * 60 * 1000;      // per-client cooldown (10 minutes)
var EMAIL_BLOCKLIST = [
  // Carrier SMS/MMS gateways (rarely valid for contact forms; heavily abused by bots)
  '@vtext.com',            // Verizon SMS
  '@vzwpix.com',           // Verizon MMS
  '@txt.att.net',          // AT&T SMS
  '@mms.att.net',          // AT&T MMS
  '@tmomail.net',          // T‑Mobile
  '@message.ting.com',     // Ting
  '@messaging.sprintpcs.com', '@pm.sprint.com', '@messaging.sprint.com', // Sprint legacy
  '@myboostmobile.com',    // Boost Mobile
  '@mymetropcs.com',       // MetroPCS
  '@mms.cricketwireless.net', // Cricket
  '@email.uscc.net',       // US Cellular
  // Disposable/temporary email providers (sample/common ones)
  '@mailinator.com', '@guerrillamail.com', '@sharklasers.com', '@yopmail.com', '@10minutemail.com', '@tempmail.'
];
// Additional content heuristics
var MAX_URLS_IN_MESSAGE = 1; // block if message contains more than this many URLs
var BLOCK_PHRASES = [
  'guest post', 'crypto', 'buy followers', 'seo package', 'backlink',
  'urgent action required', 'invoice attached', 'payment due', 'domain listing',
  'sponsored post', 'adult content'
];
// Optional Cloudflare Turnstile verification
var REQUIRE_CAPTCHA = true; // enabled: require CAPTCHA verification on server
// Store your secret in Apps Script: Script Properties -> key: TURNSTILE_SECRET, value: <secret>
var TURNSTILE_SECRET_PROP = 'TURNSTILE_SECRET';
// Debug logging for CAPTCHA verification (set true temporarily if you need to inspect Cloudflare responses in Logs)
var DEBUG_CAPTCHA = false;
// ===================================================

function doPost(e) {
  try {
    if (!e) return textResponse_('Missing event object. (Use HTTP POST not Run).', 400);

    var params = parseParams_(e);

    // Honeypot check
    if (params.hp_field) {
      return jsonResponse_({ status: 'success', message: 'Processed.' }); // silently accept
    }

    // Rate limiting (best-effort, in-memory)
    var ip = (e.context && e.context.clientIp) || params.ip || 'unknown';
    if (!rateLimitOkay_(ip)) {
      return jsonResponse_({ status: 'error', message: 'Rate limit exceeded. Try again shortly.' }, 429);
    }

    var name = sanitize_(params.name);
    var email = sanitize_(params.email).toLowerCase();
    var subjectField = sanitize_(params.subject) || 'Website Contact';
    var message = sanitize_(params.message, true);
    var userAgent = sanitize_(params.userAgent);
    var pageUrl = sanitize_(params.page);
    var submittedAt = sanitize_(params.submittedAt);
  var dwellMs = Number(params.dwellMs || 0);
  var typedChars = Number(params.typedChars || 0);
  var clientId = String(params.clientId || 'na');
  var tsToken = params['cf_turnstile_response'];

    if (!name || !email || !message) {
      return jsonResponse_({ status: 'error', message: 'Required fields missing.' }, 422);
    }
    if (!isValidEmail_(email)) {
      return jsonResponse_({ status: 'error', message: 'Invalid email address.' }, 422);
    }

    // Basic heuristics
    if (emailBlocked_(email)) {
      return jsonResponse_({ status: 'error', message: 'Submission blocked.' }, 403);
    }
    if (dwellMs && dwellMs < MIN_DWELL_MS) {
      return jsonResponse_({ status: 'error', message: 'Please wait a few seconds before submitting.' }, 429);
    }
    if (typedChars && typedChars < MIN_TYPED_CHARS) {
      return jsonResponse_({ status: 'error', message: 'Please provide more detail in your message.' }, 429);
    }
    // Content checks
    if (urlCount_(message) > MAX_URLS_IN_MESSAGE) {
      return jsonResponse_({ status: 'error', message: 'Submission blocked.' }, 403);
    }
    if (containsBlockedPhrases_(message)) {
      return jsonResponse_({ status: 'error', message: 'Submission blocked.' }, 403);
    }

    // Check persistent cooldowns and duplicates before any side-effects
    if (tooSoonByEmail_(email, EMAIL_WINDOW_MS) || tooSoonByClient_(clientId, CLIENT_WINDOW_MS)) {
      return jsonResponse_({ status: 'error', message: 'Please wait a moment before submitting again.' }, 429);
    }
    if (isDuplicateMessage_(email, message)) {
      // Silently accept but do not re-send email/log to avoid floods
      recordSubmission_(email, clientId, message);
      return jsonResponse_({ status: 'success', message: 'Submission received.' });
    }

    // Optional CAPTCHA verification
    if (REQUIRE_CAPTCHA) {
      if (!tsToken) {
        return jsonResponse_({ status: 'error', message: 'CAPTCHA required.' }, 400);
      }
      var ok = verifyTurnstile_(tsToken, ip);
      if (!ok) {
        return jsonResponse_({ status: 'error', message: 'CAPTCHA verification failed.' }, 403);
      }
    }

    var primary = PRIMARY_INBOX && PRIMARY_INBOX.trim() ? PRIMARY_INBOX.trim() : getPrimary_();
    if (!primary) {
      // Fallback: if we cannot determine primary, send to alias anyway
      primary = ALIAS_ADDRESS;
    }

    var emailSubject = 'Contact Form: ' + subjectField;
    var plainBody = buildPlainBody_(name, email, subjectField, message, pageUrl, userAgent, submittedAt, ip);
    var htmlBody = buildHtmlBody_(name, email, subjectField, message, pageUrl, userAgent, submittedAt, ip);

    // Send email to primary to ensure INBOX delivery; BCC alias for record (avoid Gmail self-send suppression)
    // Try to send "From" the ALIAS_ADDRESS if it is configured as a Gmail alias on the sending account.
    var bccAddr = primary !== ALIAS_ADDRESS ? ALIAS_ADDRESS : undefined;
    sendMail_({
      to: primary,
      bcc: bccAddr,
      replyTo: email,
      subject: emailSubject,
      body: plainBody,
      htmlBody: htmlBody,
      name: 'LPAF Contact Form',
      from: ALIAS_ADDRESS // Uses Gmail alias if available; otherwise falls back to default sender
    });

    // Optional acknowledgement
    if (SEND_ACK && isValidEmail_(email)) {
      try {
        sendMail_({
          to: email,
          subject: ACK_SUBJECT,
          body: ACK_TEXT(name),
          htmlBody: ACK_HTML(name),
          name: 'Lifeprep Academy Foundation'
        });
      } catch (ackErr) {
        // Do not fail overall if ack fails
      }
    }

    // Log to sheet
    var sheetRow = null;
    if (SHEET_ID && SHEET_ID !== 'PUT_GOOGLE_SHEET_ID_HERE') {
      try {
        sheetRow = logSubmission_({
          timestamp: new Date(),
            name: name,
            email: email,
            subject: subjectField,
            message: message,
            page: pageUrl,
            userAgent: userAgent,
            submittedAt: submittedAt,
            ip: ip
        });
      } catch (sheetErr) {
        return jsonResponse_({ status: 'partial', message: 'Email sent but sheet logging failed: ' + sheetErr.message });
      }
    }

    // Persistent cooldowns + duplicate guard
    recordSubmission_(email, clientId, message);

    return jsonResponse_({ status: 'success', message: 'Submission received.', sheetRow: sheetRow });
  } catch (err) {
    return jsonResponse_({ status: 'error', message: err.message }, 500);
  }
}

// ---------- Helpers ----------
function parseParams_(e) {
  var params = {};
  if (e.parameter && Object.keys(e.parameter).length) {
    params = e.parameter; // URL-encoded form fields
  } else if (e.postData) {
    if (e.postData.type === 'application/json') {
      try { params = JSON.parse(e.postData.contents) || {}; } catch (err) { throw new Error('Invalid JSON body.'); }
    } else if (e.postData.type === 'application/x-www-form-urlencoded') {
      // Already covered by e.parameter normally
      params = e.parameter || {};
    }
  }
  return params;
}

function sanitize_(val, allowBreaks) {
  if (!val) return '';
  var s = String(val).trim();
  if (!allowBreaks) {
    s = s.replace(/[\r\n]+/g, ' ');
  } else {
    s = s.replace(/\r\n|\r/g, '\n');
  }
  return s.replace(/[<>]/g, '');
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildPlainBody_(name, email, subjectField, message, pageUrl, userAgent, submittedAt, ip) {
  return '--- Contact Submission ---' +
    '\nName: ' + name +
    '\nEmail: ' + email +
    '\nSubject: ' + subjectField +
    (pageUrl ? '\nPage: ' + pageUrl : '') +
    (submittedAt ? '\nClient Submitted At: ' + submittedAt : '') +
    (ip ? '\nIP: ' + ip : '') +
    (userAgent ? '\nUser-Agent: ' + userAgent : '') +
    '\n\nMessage:\n' + message + '\n---------------------------';
}

function buildHtmlBody_(name, email, subjectField, message, pageUrl, userAgent, submittedAt, ip) {
  return '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#222">'
    + '<h2 style="margin:0 0 12px">New Website Contact Submission</h2>'
    + '<p><strong>Name:</strong> ' + escapeHtml_(name) + '<br>'
    + '<strong>Email:</strong> ' + escapeHtml_(email) + '<br>'
    + '<strong>Subject:</strong> ' + escapeHtml_(subjectField) + '<br>'
    + (pageUrl ? '<strong>Page:</strong> ' + escapeHtml_(pageUrl) + '<br>' : '')
    + (submittedAt ? '<strong>Client Submitted At:</strong> ' + escapeHtml_(submittedAt) + '<br>' : '')
    + (ip ? '<strong>IP:</strong> ' + escapeHtml_(ip) + '<br>' : '')
    + (userAgent ? '<strong>User-Agent:</strong> ' + escapeHtml_(userAgent) + '<br>' : '')
    + '</p>'
    + '<hr style="margin:20px 0;border:none;border-top:1px solid #ddd">'
    + '<p style="white-space:pre-line;margin:0 0 12px">' + escapeHtml_(message) + '</p>'
    + '<p style="font-size:12px;color:#666;margin-top:24px">Delivered by Lifeprep Academy Foundation Contact Form.</p>'
    + '</div>';
}

function escapeHtml_(text) { return String(text || '').replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]); }); }

function logSubmission_(entry) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Timestamp','Name','Email','Subject','Message','Page','UserAgent','Client Submitted At','IP']);
  }
  sh.appendRow([
    new Date(),
    entry.name,
    entry.email,
    entry.subject,
    entry.message,
    entry.page,
    entry.userAgent,
    entry.submittedAt,
    entry.ip
  ]);
  return sh.getLastRow();
}

// In-memory simplistic rate limiting (resets when script instance cold starts)
var __RATE_BUCKET = {};
function rateLimitOkay_(ip) {
  if (!ip) return true;
  var now = Date.now();
  var bucket = __RATE_BUCKET[ip] || { hits: [] };
  // keep only last 60s
  bucket.hits = bucket.hits.filter(function(ts){ return now - ts < 60000; });
  if (bucket.hits.length >= RATE_LIMIT_PER_MIN) {
    __RATE_BUCKET[ip] = bucket;
    return false;
  }
  bucket.hits.push(now);
  __RATE_BUCKET[ip] = bucket;
  return true;
}

// Additional anti-spam via ScriptProperties persistence
function props_(){ return PropertiesService.getScriptProperties(); }
function emailBlocked_(email){
  var e = String(email||'').toLowerCase();
  return EMAIL_BLOCKLIST.some(function(rule){ var r=String(rule||'').toLowerCase(); return r.startsWith('@')? e.endsWith(r): e===r; });
}
function tooSoonByEmail_(email, windowMs){
  if (!email) return false;
  var key='lastEmailTS:'+email, now=Date.now(), last=Number(props_().getProperty(key)||'0');
  if (last && now-last<windowMs) return true; return false;
}
function tooSoonByClient_(clientId, windowMs){
  if (!clientId || clientId==='na') return false;
  var key='lastClientTS:'+clientId, now=Date.now(), last=Number(props_().getProperty(key)||'0');
  if (last && now-last<windowMs) return true; return false;
}
function recordSubmission_(email, clientId, message){
  try{
    var now=Date.now();
    if (email) props_().setProperty('lastEmailTS:'+email, String(now));
    if (clientId && clientId!=='na') props_().setProperty('lastClientTS:'+clientId, String(now));
    if (email && message) props_().setProperty('lastMsg:'+email, normalizeMsg_(message));
  }catch(e){}
}
function isDuplicateMessage_(email, message){
  if (!email||!message) return false; var last=props_().getProperty('lastMsg:'+email)||''; return last && normalizeMsg_(message)===last;
}
function normalizeMsg_(s){ return String(s||'').trim().toLowerCase().replace(/\s+/g,' '); }

function urlCount_(text){
  try{
    var m = String(text||'').match(/https?:\/\/\S+/gi);
    return m ? m.length : 0;
  }catch(e){ return 0; }
}
function containsBlockedPhrases_(text){
  try{
    var s = String(text||'').toLowerCase();
    return BLOCK_PHRASES.some(function(p){ return p && s.indexOf(String(p).toLowerCase()) !== -1; });
  }catch(e){ return false; }
}

// Optional: Cloudflare Turnstile server-side verification
function verifyTurnstile_(token, ip) {
  try {
    var secret = PropertiesService.getScriptProperties().getProperty(TURNSTILE_SECRET_PROP);
    if (!secret) {
      if (DEBUG_CAPTCHA) Logger.log('[Turnstile] Missing TURNSTILE_SECRET Script Property');
      return false;
    }
    var payload = { secret: secret, response: token };
    if (isValidIp_(ip)) payload.remoteip = ip;
    var options = {
      method: 'post',
      payload: payload,
      contentType: 'application/x-www-form-urlencoded',
      muteHttpExceptions: true,
    };
    var resp = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', options);
    var text = resp.getContentText() || '{}';
    var json = JSON.parse(text);
    var ok = json && json.success === true;
    if (!ok && DEBUG_CAPTCHA) Logger.log('[Turnstile] Verification failed: ' + text);
    return ok;
  } catch (e) {
    if (DEBUG_CAPTCHA) Logger.log('[Turnstile] Verification error: ' + (e && e.message));
    return false;
  }
}

function isValidIp_(ip) {
  if (!ip || typeof ip !== 'string') return false;
  ip = ip.trim();
  // Basic IPv4 or IPv6 check (permissive)
  var ipv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
  var ipv6 = /^[a-fA-F0-9:]+$/;
  return ipv4.test(ip) || ipv6.test(ip);
}


function getPrimary_() {
  try {
    var user = Session.getEffectiveUser();
    return user && user.getEmail ? user.getEmail() : '';
  } catch (e) {
    return '';
  }
}

function jsonResponse_(obj, code) {
  var out = ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
  if (out.setResponseCode && code) {
    try { out.setResponseCode(code); } catch (e) {}
  }
  return out;
}

function textResponse_(msg, code) {
  var out = ContentService.createTextOutput(msg).setMimeType(ContentService.MimeType.TEXT);
  if (out.setResponseCode && code) {
    try { out.setResponseCode(code); } catch (e) {}
  }
  return out;
}

/**
 * sendMail_ tries to send using GmailApp with a configured alias so that
 * recipients see "From: alias". If the alias is unavailable or sending via
 * GmailApp fails (e.g., due to restricted scopes), it falls back to MailApp.
 *
 * opts: { to, subject, body, htmlBody?, name?, replyTo?, bcc?, from? }
 */
function sendMail_(opts) {
  var to = opts.to;
  var subject = opts.subject;
  var body = opts.body || '';
  var htmlBody = opts.htmlBody;
  var name = opts.name || 'Notification';
  var replyTo = opts.replyTo;
  var bcc = opts.bcc;
  var from = opts.from; // desired alias address

  // If possible, use GmailApp with alias.
  // Note: GmailApp respects aliases configured in Gmail settings (Send mail as).
  try {
    if (from && isAliasConfigured_(from)) {
      var adv = { name: name };
      if (htmlBody) adv.htmlBody = htmlBody;
      if (replyTo) adv.replyTo = replyTo;
      if (bcc) adv.bcc = bcc;
      // Ask Gmail to use this alias as the From address (must be configured/verified in Gmail settings)
      adv.from = from;
      // GmailApp does not accept a separate plain text body when htmlBody is present; body is always required
      GmailApp.sendEmail(to, subject, body || ' ', adv);
      return;
    }
  } catch (e) {
    // Fall through to MailApp
  }

  // Fallback to MailApp (cannot spoof From; will use script's account)
  try {
    MailApp.sendEmail({
      to: to,
      subject: subject,
      body: body || ' ',
      htmlBody: htmlBody,
      name: name,
      replyTo: replyTo,
      bcc: bcc
    });
  } catch (e2) {
    throw e2;
  }
}

// Check if a given email is configured as a Gmail alias on this account
function isAliasConfigured_(alias) {
  try {
    var aliases = GmailApp.getAliases();
    alias = String(alias || '').toLowerCase();
    return aliases.some(function(a){ return String(a || '').toLowerCase() === alias; });
  } catch (e) {
    return false;
  }
}

// --- Admin utilities (run these from the Apps Script editor as needed) ---
/**
 * Purge old cooldown/duplicate tracking entries from Script Properties.
 * Keeps the last N days; removes keys starting with lastEmailTS:, lastClientTS:, lastMsg:.
 * Adjust daysToKeep as desired.
 */
function admin_purgeOldCooldowns_(daysToKeep) {
  daysToKeep = Math.max(1, Number(daysToKeep || 7)); // default 7 days
  var cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
  var sp = props_();
  var all = sp.getProperties() || {};
  var prefixes = ['lastEmailTS:', 'lastClientTS:', 'lastMsg:'];
  var removed = 0;
  Object.keys(all).forEach(function(k){
    if (prefixes.some(function(p){ return k.indexOf(p) === 0; })) {
      var v = all[k];
      if (k.indexOf('lastMsg:') === 0) {
        // Message hashes: remove if corresponding timestamp is old or missing
        var email = k.slice('lastMsg:'.length);
        var ts = Number(all['lastEmailTS:' + email] || '0');
        if (!ts || ts < cutoff) { sp.deleteProperty(k); removed++; }
      } else {
        // Timestamp keys: remove if old
        var tsn = Number(v || '0');
        if (!tsn || tsn < cutoff) { sp.deleteProperty(k); removed++; }
      }
    }
  });
  Logger.log('Removed ' + removed + ' old cooldown/duplicate properties older than ' + daysToKeep + ' days.');
}

/**
 * Remove all stored cooldown entries for emails ending with known SMS/MMS gateways.
 * Use cautiously.
 */
function admin_clearSmsGatewayCooldowns_() {
  var smsDomains = ['@vtext.com','@vzwpix.com','@txt.att.net','@mms.att.net','@tmomail.net','@message.ting.com','@messaging.sprintpcs.com','@pm.sprint.com','@messaging.sprint.com','@myboostmobile.com','@mymetropcs.com','@mms.cricketwireless.net','@email.uscc.net'];
  var sp = props_();
  var all = sp.getProperties() || {};
  var removed = 0;
  Object.keys(all).forEach(function(k){
    if (k.indexOf('lastEmailTS:') === 0 || k.indexOf('lastMsg:') === 0) {
      var email = k.replace(/^lastEmailTS:|^lastMsg:/, '');
      var lower = String(email || '').toLowerCase();
      if (smsDomains.some(function(d){ return lower.endsWith(d); })) {
        sp.deleteProperty(k);
        removed++;
      }
    }
  });
  Logger.log('Removed ' + removed + ' SMS-gateway related properties.');
}

/**
 * Remove ALL cooldown/duplicate tracking properties regardless of age/domain.
 * This frees space so you can add new Script Properties (e.g., TURNSTILE_SECRET).
 */
function admin_clearAllCooldowns_() {
  var sp = props_();
  var all = sp.getProperties() || {};
  var prefixes = ['lastEmailTS:', 'lastClientTS:', 'lastMsg:'];
  var removed = 0;
  Object.keys(all).forEach(function(k){
    if (prefixes.some(function(p){ return k.indexOf(p) === 0; })) {
      sp.deleteProperty(k);
      removed++;
    }
  });
  Logger.log('Removed ' + removed + ' cooldown/duplicate properties (ALL).');
}

/**
 * Set a specific Script Property programmatically. Use as a last resort if the UI is blocked.
 * Example: admin_setScriptProperty('TURNSTILE_SECRET', 'your-secret-here')
 */
function admin_setScriptProperty(key, value) {
  if (!key) throw new Error('Key is required');
  props_().setProperty(String(key), String(value || ''));
  Logger.log('Set Script Property: ' + key + ' (length=' + String(value || '').length + ')');
}

// Wrappers (no underscores) so they appear in the Run menu
function adminPurgeCooldowns() { admin_purgeOldCooldowns_(7); } // change 7 to desired retention days
function adminClearSmsGatewayCooldowns() { admin_clearSmsGatewayCooldowns_(); }
function adminClearAllCooldowns() { admin_clearAllCooldowns_(); }

/**
 * Create a daily time-driven trigger to purge old cooldown properties automatically.
 * Run once to install the trigger. Adjust the retention days inside adminPurgeCooldowns if needed.
 */
function adminCreateDailyPurgeTrigger() {
  // Remove existing triggers for cleanliness
  var triggers = ScriptApp.getProjectTriggers() || [];
  triggers.forEach(function(t){
    if (t.getHandlerFunction && t.getHandlerFunction() === 'adminPurgeCooldowns') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('adminPurgeCooldowns').timeBased().everyDays(1).atHour(3).create();
  Logger.log('Created daily purge trigger for adminPurgeCooldowns at ~3am project timezone.');
}

// Test harness you can run inside the Apps Script editor without an HTTP request
function testDoPost_() {
  var fakeEvent = { parameter: { name: 'Test User', email: 'test@example.com', subject: 'Test', message: 'Hello world!', page: 'https://example.com/contact', userAgent: 'UnitTest', submittedAt: new Date().toISOString() } };
  var result = doPost(fakeEvent); Logger.log(result.getContent());
}
