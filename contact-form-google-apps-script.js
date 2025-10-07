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
var SEND_ACK = true; // set false to disable auto-response
var ACK_SUBJECT = 'We received your message';
var ACK_HTML = function(name){return '<p>Hi '+escapeHtml_(name||'there')+',</p><p>Thank you for contacting Lifeprep Academy Foundation. We\'ve received your message and will respond soon.</p><p><em>This is an automated confirmation.</em></p>';};
var ACK_TEXT = function(name){return 'Hi '+(name||'there')+'\n\nThank you for contacting Lifeprep Academy Foundation. We\'ve received your message and will respond soon.\n\n(This is an automated confirmation.)';};

// Basic rate limit (per IP) configuration (very lightweight / optional)
var RATE_LIMIT_PER_MIN = 15; // max submissions per IP per rolling minute window
// Anti-spam thresholds and options
var MIN_DWELL_MS = 3000;       // require >= 3s dwell time
var MIN_TYPED_CHARS = 8;       // require >= 8 typed characters
var EMAIL_WINDOW_MS = 2 * 60 * 1000;  // per-email cooldown (2 min)
var CLIENT_WINDOW_MS = 2 * 60 * 1000; // per-client cooldown (2 min)
var EMAIL_BLOCKLIST = [ /* 'bad@example.com','@spamdomain.com' */ ];
// Optional Cloudflare Turnstile verification
var REQUIRE_CAPTCHA = false; // set true to require CAPTCHA
// Store your secret in Apps Script: Script Properties -> key: TURNSTILE_SECRET, value: <secret>
var TURNSTILE_SECRET_PROP = 'TURNSTILE_SECRET';
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
    MailApp.sendEmail({
      to: primary,
      bcc: primary !== ALIAS_ADDRESS ? ALIAS_ADDRESS : undefined,
      replyTo: email,
      subject: emailSubject,
      body: plainBody,
      htmlBody: htmlBody,
      name: 'LPAF Contact Form'
    });

    // Optional acknowledgement
    if (SEND_ACK && isValidEmail_(email)) {
      try {
        MailApp.sendEmail({
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

// Optional: Cloudflare Turnstile server-side verification
function verifyTurnstile_(token, ip) {
  try {
    var secret = PropertiesService.getScriptProperties().getProperty(TURNSTILE_SECRET_PROP);
    if (!secret) return false;
    var options = {
      method: 'post',
      payload: { secret: secret, response: token, remoteip: ip },
      muteHttpExceptions: true,
    };
    var resp = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', options);
    var json = JSON.parse(resp.getContentText() || '{}');
    return json && json.success === true;
  } catch (e) {
    return false;
  }
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

// Test harness you can run inside the Apps Script editor without an HTTP request
function testDoPost_() {
  var fakeEvent = { parameter: { name: 'Test User', email: 'test@example.com', subject: 'Test', message: 'Hello world!', page: 'https://example.com/contact', userAgent: 'UnitTest', submittedAt: new Date().toISOString() } };
  var result = doPost(fakeEvent); Logger.log(result.getContent());
}
