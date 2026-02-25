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
// Bump this when you paste/redeploy so you can verify you're hitting the latest deployment.
var SCRIPT_VERSION = '2026-02-25_email_palette';

// SendGrid (primary email delivery) configuration.
// Store your key in Apps Script: Project Settings -> Script properties.
// Required: SENDGRID_API_KEY
// Optional: SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME
var SENDGRID_ENABLED = true;
var SENDGRID_API_KEY_PROP = 'SENDGRID_API_KEY';
var SENDGRID_FROM_EMAIL_PROP = 'SENDGRID_FROM_EMAIL';
var SENDGRID_FROM_NAME_PROP = 'SENDGRID_FROM_NAME';
// Optional per-form SendGrid sender settings (used when a form submits form_type)
var SENDGRID_FROM_EMAIL_CONTACT_PROP = 'SENDGRID_FROM_EMAIL_CONTACT';
var SENDGRID_FROM_NAME_CONTACT_PROP = 'SENDGRID_FROM_NAME_CONTACT';
var SENDGRID_FROM_EMAIL_YOUTH_PROP = 'SENDGRID_FROM_EMAIL_YOUTH';
var SENDGRID_FROM_NAME_YOUTH_PROP = 'SENDGRID_FROM_NAME_YOUTH';

// Optional: send a confirmation copy (BCC) of each submission
// Can be a comma/semicolon separated list.
var FORM_CONFIRM_TO_PROP = 'FORM_CONFIRM_TO';
var FORM_CONFIRM_TO_CONTACT_PROP = 'FORM_CONFIRM_TO_CONTACT';
var FORM_CONFIRM_TO_YOUTH_PROP = 'FORM_CONFIRM_TO_YOUTH';

// Email/PDF palette (match style.css :root)
var EMAIL_PRIMARY = '#281156';   // --primary-color
var EMAIL_GOLD = '#f9b515';      // --secondary-color
var EMAIL_BG = '#f8f9fa';        // --background-light
var EMAIL_TEXT = '#292929';      // --text-dark
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
    var formType = detectFormType_(params, pageUrl);
    var submittedAt = sanitize_(params.submittedAt);
    var dwellMs = Number(params.dwellMs || 0);
    var typedChars = Number(params.typedChars || 0);
    var clientId = String(params.clientId || 'na');
    var tsToken = params['cf_turnstile_response'];

    // Capture all submitted fields (for email + attachments + optional logging)
    var allFields = buildAllFields_(params);

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

    // Check duplicates first: prevents double-clicks from showing a cooldown error.
    if (isDuplicateMessage_(email, message, formType)) {
      // Silently accept but do not re-send email/log to avoid floods
      recordSubmission_(email, clientId, message, formType);
      return jsonResponse_({ status: 'success', message: 'Submission received.' });
    }

    // Then enforce cooldowns (per email + per client)
    if (tooSoonByEmail_(email, EMAIL_WINDOW_MS, formType) || tooSoonByClient_(clientId, CLIENT_WINDOW_MS)) {
      return jsonResponse_({ status: 'error', message: 'Please wait a moment before submitting again.' }, 429);
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

    var sender = getSenderIdentity_(formType);
    var confirmationBcc = getConfirmationBcc_(formType);
    var emailSubject = (formType === 'youth' ? 'Youth Programs Form' : 'Contact Form') + ': ' + subjectField;
    var plainBody = buildPlainBody_(name, email, subjectField, message, pageUrl, userAgent, submittedAt, ip, allFields);
    var htmlBody = buildHtmlBody_(name, email, subjectField, message, pageUrl, userAgent, submittedAt, ip, allFields);

    // Youth Programs only: attach a full submission export (TXT + PDF)
    var attachments = null;
    if (formType === 'youth') {
      var ts = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm-ss');
      var exportTxt = buildExportText_(name, email, subjectField, message, pageUrl, userAgent, submittedAt, ip, allFields);
      var txtBlob = Utilities.newBlob(exportTxt, MimeType.PLAIN_TEXT, 'submission_' + ts + '.txt');
      var exportHtml = buildExportHtml_(name, email, subjectField, message, pageUrl, userAgent, submittedAt, ip, allFields);
      var pdfBlob;
      try {
        pdfBlob = HtmlService.createHtmlOutput(exportHtml).getBlob().getAs(MimeType.PDF).setName('submission_' + ts + '.pdf');
      } catch (pdfErr) {
        // If PDF conversion fails, still send TXT.
        pdfBlob = null;
      }
      attachments = pdfBlob ? [txtBlob, pdfBlob] : [txtBlob];
    }

    // Send email to primary to ensure INBOX delivery; BCC alias for record (avoid Gmail self-send suppression)
    // Try to send "From" the ALIAS_ADDRESS if it is configured as a Gmail alias on the sending account.
    var bccAddr = primary !== ALIAS_ADDRESS ? ALIAS_ADDRESS : undefined;
    var bccCombined = [bccAddr, confirmationBcc].filter(function(x){ return x && String(x).trim(); }).join(', ');
    sendMail_({
      to: primary,
      bcc: bccCombined || undefined,
      replyTo: email,
      subject: emailSubject,
      body: plainBody,
      htmlBody: htmlBody,
      attachments: attachments,
      name: sender.name,
      from: sender.email // SendGrid: From email; Gmail fallback: uses alias if available
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
            ip: ip,
            extraFields: JSON.stringify(allFields)
        });
      } catch (sheetErr) {
        return jsonResponse_({ status: 'partial', message: 'Email sent but sheet logging failed: ' + sheetErr.message });
      }
    }

    // Persistent cooldowns + duplicate guard
    recordSubmission_(email, clientId, message, formType);

    return jsonResponse_({ status: 'success', message: 'Submission received.', sheetRow: sheetRow, version: SCRIPT_VERSION });
  } catch (err) {
    return jsonResponse_({ status: 'error', message: err.message, version: SCRIPT_VERSION }, 500);
  }
}

// ---------- Helpers ----------
function parseParams_(e) {
  var params = {};
  // Prefer e.parameters to preserve multi-value fields (arrays).
  if (e.parameters && Object.keys(e.parameters).length) {
    Object.keys(e.parameters).forEach(function(k) {
      var v = e.parameters[k];
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) {
        params[k] = v.filter(function(x){ return x !== undefined && x !== null && String(x).trim() !== ''; }).map(function(x){ return String(x); }).join(', ');
      } else {
        params[k] = String(v);
      }
    });
    return params;
  }
  if (e.parameter && Object.keys(e.parameter).length) {
    params = e.parameter; // URL-encoded form fields
    return params;
  }
  if (e.postData) {
    if (e.postData.type === 'application/json') {
      try { params = JSON.parse(e.postData.contents) || {}; } catch (err) { throw new Error('Invalid JSON body.'); }
    } else if (e.postData.type === 'application/x-www-form-urlencoded') {
      params = e.parameter || {};
    }
  }
  return params;
}

function detectFormType_(params, pageUrl) {
  var raw = String((params && (params.form_type || params.formType || params.form || params.source)) || '').trim().toLowerCase();
  if (raw) {
    if (raw.indexOf('youth') !== -1) return 'youth';
    if (raw.indexOf('contact') !== -1) return 'contact';
  }
  var url = String(pageUrl || '').toLowerCase();
  if (url.indexOf('youth-programs') !== -1) return 'youth';
  return 'contact';
}

function getSenderIdentity_(formType) {
  var props = props_();
  var type = String(formType || '').trim().toLowerCase();

  var emailProp = SENDGRID_FROM_EMAIL_PROP;
  var nameProp = SENDGRID_FROM_NAME_PROP;
  var fallbackName = 'LPAF Contact Form';

  if (type === 'youth') {
    emailProp = SENDGRID_FROM_EMAIL_YOUTH_PROP;
    nameProp = SENDGRID_FROM_NAME_YOUTH_PROP;
    fallbackName = 'LPAF Youth Programs Form';
  } else if (type === 'contact') {
    emailProp = SENDGRID_FROM_EMAIL_CONTACT_PROP;
    nameProp = SENDGRID_FROM_NAME_CONTACT_PROP;
    fallbackName = 'LPAF Contact Form';
  }

  // Prefer per-form properties; fall back to defaults; fall back to ALIAS_ADDRESS for non-SendGrid mailers.
  var email = String((props.getProperty(emailProp) || props.getProperty(SENDGRID_FROM_EMAIL_PROP) || ALIAS_ADDRESS || '')).trim();
  var name = String((props.getProperty(nameProp) || props.getProperty(SENDGRID_FROM_NAME_PROP) || fallbackName || '')).trim();

  return { email: email, name: name };
}

function getConfirmationBcc_(formType) {
  var props = props_();
  var type = String(formType || '').trim().toLowerCase();
  var value = '';

  if (type === 'youth') {
    value = props.getProperty(FORM_CONFIRM_TO_YOUTH_PROP) || '';
  } else if (type === 'contact') {
    value = props.getProperty(FORM_CONFIRM_TO_CONTACT_PROP) || '';
  }

  if (!String(value || '').trim()) {
    value = props.getProperty(FORM_CONFIRM_TO_PROP) || '';
  }

  // Normalize to a comma-separated string; downstream mailers handle parsing.
  var list = parseEmailList_(value);
  return list.length ? list.join(', ') : '';
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

function buildFinePrintText_(pageUrl, userAgent, submittedAt, ip) {
  var lines = [];
  lines.push('---');
  lines.push('Script Version: ' + SCRIPT_VERSION);
  if (pageUrl) lines.push('Page: ' + pageUrl);
  if (submittedAt) lines.push('Client Submitted At: ' + submittedAt);
  if (ip) lines.push('IP: ' + ip);
  if (userAgent) lines.push('User-Agent: ' + userAgent);
  return lines.join('\n');
}

function buildFinePrintHtml_(pageUrl, userAgent, submittedAt, ip) {
  var parts = [];
  parts.push('<hr style="margin:20px 0;border:none;border-top:2px solid ' + EMAIL_GOLD + '">');
  parts.push('<div style="font-size:11px;line-height:1.4;color:#666">');
  parts.push('<div><strong style="color:' + EMAIL_PRIMARY + '">Script Version:</strong> ' + escapeHtml_(SCRIPT_VERSION) + '</div>');
  if (pageUrl) parts.push('<div><strong style="color:' + EMAIL_PRIMARY + '">Page:</strong> ' + escapeHtml_(pageUrl) + '</div>');
  if (submittedAt) parts.push('<div><strong style="color:' + EMAIL_PRIMARY + '">Client Submitted At:</strong> ' + escapeHtml_(submittedAt) + '</div>');
  if (ip) parts.push('<div><strong style="color:' + EMAIL_PRIMARY + '">IP:</strong> ' + escapeHtml_(ip) + '</div>');
  if (userAgent) parts.push('<div><strong style="color:' + EMAIL_PRIMARY + '">User-Agent:</strong> ' + escapeHtml_(userAgent) + '</div>');
  parts.push('</div>');
  return parts.join('');
}

function buildPlainBody_(name, email, subjectField, message, pageUrl, userAgent, submittedAt, ip, allFields) {
  var lines = [];
  lines.push('--- Contact Submission ---');
  lines.push('Name: ' + name);
  lines.push('Email: ' + email);
  lines.push('Subject: ' + subjectField);
  lines.push('');
  lines.push('Message:');
  lines.push(message);
  lines.push('');
  lines.push('All Fields:');
  lines = lines.concat(formatAllFieldsPlain_(allFields));
  lines.push('');
  lines.push(buildFinePrintText_(pageUrl, userAgent, submittedAt, ip));
  lines.push('---------------------------');
  return lines.join('\n');
}

function buildHtmlBody_(name, email, subjectField, message, pageUrl, userAgent, submittedAt, ip, allFields) {
  var title = 'New Website Contact Submission';
  return ''
    + '<div style="background:' + EMAIL_BG + ';padding:24px 12px">'
    +   '<div style="max-width:720px;margin:0 auto;border:1px solid ' + EMAIL_GOLD + ';background:#fff">'
    +     '<div style="background:' + EMAIL_PRIMARY + ';padding:16px 18px;border-bottom:4px solid ' + EMAIL_GOLD + '">'
    +       '<div style="margin:0;font-family:Arial,sans-serif;font-size:18px;line-height:1.2;font-weight:700;color:' + EMAIL_GOLD + '">' + escapeHtml_(title) + '</div>'
    +     '</div>'
    +     '<div style="padding:18px;font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:' + EMAIL_TEXT + '">'
    +       '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 14px">'
    +         '<tr><td style="padding:0 0 6px"><strong style="color:' + EMAIL_PRIMARY + '">Name:</strong> ' + escapeHtml_(name) + '</td></tr>'
    +         '<tr><td style="padding:0 0 6px"><strong style="color:' + EMAIL_PRIMARY + '">Email:</strong> ' + escapeHtml_(email) + '</td></tr>'
    +         '<tr><td style="padding:0 0 0"><strong style="color:' + EMAIL_PRIMARY + '">Subject:</strong> ' + escapeHtml_(subjectField) + '</td></tr>'
    +       '</table>'
    +       '<div style="height:2px;background:' + EMAIL_GOLD + ';margin:14px 0"></div>'
    +       '<div style="margin:0 0 8px;font-size:15px;font-weight:700;color:' + EMAIL_PRIMARY + '">Message</div>'
    +       '<div style="white-space:pre-line;margin:0 0 16px;border:1px solid ' + EMAIL_GOLD + ';padding:12px;border-radius:6px;background:#fff">' + escapeHtml_(message) + '</div>'
    +       '<div style="margin:0 0 8px;font-size:15px;font-weight:700;color:' + EMAIL_PRIMARY + '">All Fields</div>'
    +       buildAllFieldsTableHtml_(allFields)
    +       buildFinePrintHtml_(pageUrl, userAgent, submittedAt, ip)
    +     '</div>'
    +   '</div>'
    + '</div>';
}

function escapeHtml_(text) { return String(text || '').replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]); }); }

function logSubmission_(entry) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['Timestamp','Name','Email','Subject','Message','Page','UserAgent','Client Submitted At','IP','Extra Fields']);
  }
  // If sheet already exists but missing Extra Fields column, add it.
  try {
    var header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0] || [];
    if (header.indexOf('Extra Fields') === -1) {
      sh.insertColumnAfter(sh.getLastColumn());
      sh.getRange(1, sh.getLastColumn()).setValue('Extra Fields');
    }
  } catch (hdrErr) {
    // ignore
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
    entry.ip,
    entry.extraFields || ''
  ]);
  return sh.getLastRow();
}

// Build a stable, filtered map of all submitted fields suitable for email/logging.
function buildAllFields_(params) {
  var internalKeys = {
    hp_field: true,
    cf_turnstile_response: true,
    userAgent: true,
    page: true,
    submittedAt: true,
    dwellMs: true,
    typedChars: true,
    clientId: true
  };

  var out = {};
  Object.keys(params || {}).forEach(function(k) {
    if (!k) return;
    if (internalKeys[k]) return;
    var v = params[k];
    if (v === undefined || v === null) return;
    var s = String(v).trim();
    if (!s) return;
    // Avoid leaking captcha tokens and other hidden implementation details
    if (k.toLowerCase().indexOf('turnstile') !== -1) return;
    out[k] = s;
  });
  return out;
}

function formatKeyLabel_(k) {
  var s = String(k || '');
  s = s.replace(/[_\-]+/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s.replace(/\b\w/g, function(m){ return m.toUpperCase(); });
}

function formatAllFieldsPlain_(allFields) {
  var keys = Object.keys(allFields || {});
  keys.sort();
  return keys.map(function(k){
    return formatKeyLabel_(k) + ': ' + String(allFields[k]);
  });
}

function buildAllFieldsTableHtml_(allFields) {
  var keys = Object.keys(allFields || {});
  keys.sort();
  if (!keys.length) return '<p style="margin:0;color:#555">(No extra fields)</p>';

  var rows = keys.map(function(k){
    return '<tr>'
      + '<td style="padding:6px 10px;border:1px solid ' + EMAIL_GOLD + ';white-space:nowrap"><strong style="color:' + EMAIL_PRIMARY + '">' + escapeHtml_(formatKeyLabel_(k)) + '</strong></td>'
      + '<td style="padding:6px 10px;border:1px solid ' + EMAIL_GOLD + '">' + escapeHtml_(String(allFields[k])) + '</td>'
      + '</tr>';
  }).join('');
  return '<table style="border-collapse:collapse;width:100%;font-size:13px">'
    + '<tbody>' + rows + '</tbody>'
    + '</table>';
}

function buildExportText_(name, email, subjectField, message, pageUrl, userAgent, submittedAt, ip, allFields) {
  var lines = [];
  lines.push('Lifeprep Academy Foundation - Form Submission');
  lines.push('');
  lines.push('Name: ' + name);
  lines.push('Email: ' + email);
  lines.push('Subject: ' + subjectField);
  lines.push('');
  lines.push('Message:');
  lines.push(message);
  lines.push('');
  lines.push('All Fields:');
  lines = lines.concat(formatAllFieldsPlain_(allFields));
  lines.push('');
  lines.push(buildFinePrintText_(pageUrl, userAgent, submittedAt, ip));
  return lines.join('\n');
}

function buildExportHtml_(name, email, subjectField, message, pageUrl, userAgent, submittedAt, ip, allFields) {
  var meta = ''
    + '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 10px">'
    + '<tr><td style="padding:0 0 6px"><strong style="color:' + EMAIL_PRIMARY + '">Name:</strong> ' + escapeHtml_(name) + '</td></tr>'
    + '<tr><td style="padding:0 0 6px"><strong style="color:' + EMAIL_PRIMARY + '">Email:</strong> ' + escapeHtml_(email) + '</td></tr>'
    + '<tr><td style="padding:0"><strong style="color:' + EMAIL_PRIMARY + '">Subject:</strong> ' + escapeHtml_(subjectField) + '</td></tr>'
    + '</table>';
  return '<!doctype html><html><head><meta charset="utf-8"><title>Form Submission</title></head>'
    + '<body style="font-family:Arial,sans-serif;color:' + EMAIL_TEXT + ';font-size:13px;line-height:1.5;background:#fff;margin:0;padding:0">'
    +   '<div style="padding:18px">'
    +     '<div style="max-width:820px;margin:0 auto;border:1px solid ' + EMAIL_GOLD + ';background:#fff">'
    +       '<div style="background:' + EMAIL_PRIMARY + ';padding:14px 16px;border-bottom:4px solid ' + EMAIL_GOLD + '">'
    +         '<div style="margin:0;font-size:18px;font-weight:700;color:' + EMAIL_GOLD + '">Lifeprep Academy Foundation - Form Submission</div>'
    +       '</div>'
    +       '<div style="padding:16px">'
    +         meta
    +         '<div style="height:2px;background:' + EMAIL_GOLD + ';margin:12px 0"></div>'
    +         '<div style="margin:0 0 8px;font-size:15px;font-weight:700;color:' + EMAIL_PRIMARY + '">Message</div>'
    +         '<div style="white-space:pre-line;border:1px solid ' + EMAIL_GOLD + ';padding:12px;border-radius:6px;background:#fff">' + escapeHtml_(message) + '</div>'
    +         '<div style="margin:14px 0 8px;font-size:15px;font-weight:700;color:' + EMAIL_PRIMARY + '">All Fields</div>'
    +         buildAllFieldsTableHtml_(allFields)
    +         buildFinePrintHtml_(pageUrl, userAgent, submittedAt, ip)
    +       '</div>'
    +     '</div>'
    +   '</div>'
    + '</body></html>';
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

// Hash emails before using them in Script Properties keys (avoid PII in property names).
function emailKey_(email) {
  var normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return '';
  try {
    var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, normalized, Utilities.Charset.UTF_8);
    return bytes.map(function(b){
      var v = (b < 0 ? b + 256 : b);
      return (v < 16 ? '0' : '') + v.toString(16);
    }).join('');
  } catch (e) {
    // Best-effort fallback (still avoids raw email); only used if digest is unavailable.
    return Utilities.base64EncodeWebSafe(normalized).slice(0, 48);
  }
}
function emailBlocked_(email){
  var e = String(email||'').toLowerCase();
  return EMAIL_BLOCKLIST.some(function(rule){ var r=String(rule||'').toLowerCase(); return r.startsWith('@')? e.endsWith(r): e===r; });
}
function tooSoonByEmail_(email, windowMs, formType){
  if (!email) return false;
  var now=Date.now();

  // New (hashed) key
  var ek = emailKey_(email);
  if (ek) {
    var suffix = formType ? (':' + String(formType)) : '';
    var keyNew='lastEmailTS:'+ek+suffix;
    var lastNew=Number(props_().getProperty(keyNew)||'0');
    if (lastNew && now-lastNew<windowMs) return true;

    // If formType is provided, do not fall back to legacy/untyped keys.
    // This prevents Contact submissions from blocking Youth (and vice versa).
    if (formType) return false;

    // Backward-compatible untyped hashed key
    var keyNewUntyped='lastEmailTS:'+ek;
    var lastNewUntyped=Number(props_().getProperty(keyNewUntyped)||'0');
    if (lastNewUntyped && now-lastNewUntyped<windowMs) return true;
  }

  // Legacy key (raw email) for backward compatibility
  var keyOld='lastEmailTS:'+email;
  var lastOld=Number(props_().getProperty(keyOld)||'0');
  if (lastOld && now-lastOld<windowMs) return true;
  return false;
}
function tooSoonByClient_(clientId, windowMs){
  if (!clientId || clientId==='na') return false;
  var key='lastClientTS:'+clientId, now=Date.now(), last=Number(props_().getProperty(key)||'0');
  if (last && now-last<windowMs) return true; return false;
}
function recordSubmission_(email, clientId, message, formType){
  try{
    var now=Date.now();
    if (email) {
      var ek = emailKey_(email);
      if (ek) {
        var suffix = formType ? (':' + String(formType)) : '';
        props_().setProperty('lastEmailTS:'+ek+suffix, String(now));
        if (message) props_().setProperty('lastMsg:'+ek+suffix, normalizeMsg_(message));

        // Cleanup old untyped hashed keys once we start using typed keys.
        if (suffix) {
          props_().deleteProperty('lastEmailTS:'+ek);
          props_().deleteProperty('lastMsg:'+ek);
        }
      }

      // Remove legacy PII keys if they exist.
      props_().deleteProperty('lastEmailTS:'+email);
      props_().deleteProperty('lastMsg:'+email);
    }
    if (clientId && clientId!=='na') props_().setProperty('lastClientTS:'+clientId, String(now));
  }catch(e){}
}
function isDuplicateMessage_(email, message, formType){
  if (!email||!message) return false;
  var norm = normalizeMsg_(message);
  var ek = emailKey_(email);
  if (ek) {
    var suffix = formType ? (':' + String(formType)) : '';
    var lastNew = props_().getProperty('lastMsg:'+ek+suffix) || '';
    if (lastNew && norm === lastNew) return true;

    // If formType is provided, do not fall back to legacy/untyped keys.
    if (formType) return false;

    var lastNewUntyped = props_().getProperty('lastMsg:'+ek) || '';
    if (lastNewUntyped && norm === lastNewUntyped) return true;
  }
  // Legacy fallback
  var lastOld = props_().getProperty('lastMsg:'+email) || '';
  return lastOld && norm === lastOld;
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
 * sendMail_ sends through SendGrid (primary) if configured, with automatic
 * fallback to GmailApp/MailApp.
 *
 * opts: { to, subject, body, htmlBody?, name?, replyTo?, bcc?, from?, attachments? }
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
  var attachments = opts.attachments;

  // Primary: SendGrid
  if (SENDGRID_ENABLED) {
    try {
      var sent = sendViaSendGrid_({
        to: to,
        bcc: bcc,
        replyTo: replyTo,
        subject: subject,
        body: body,
        htmlBody: htmlBody,
        name: name,
        from: from,
        attachments: attachments
      });
      if (sent) return;
    } catch (sgErr) {
      // Fall through to Gmail/MailApp backup.
    }
  }

  // If possible, use GmailApp with alias.
  // Note: GmailApp respects aliases configured in Gmail settings (Send mail as).
  try {
    if (from && isAliasConfigured_(from)) {
      var adv = { name: name };
      if (htmlBody) adv.htmlBody = htmlBody;
      if (replyTo) adv.replyTo = replyTo;
      if (bcc) adv.bcc = bcc;
      if (attachments && attachments.length) adv.attachments = attachments;
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
      bcc: bcc,
      attachments: attachments
    });
  } catch (e2) {
    throw e2;
  }
}

function sendViaSendGrid_(opts) {
  var apiKey = String((props_().getProperty(SENDGRID_API_KEY_PROP) || '')).trim();
  if (!apiKey) return false;

  var to = parseEmailList_(opts.to);
  if (!to.length) throw new Error('SendGrid: missing "to" address.');

  var bcc = parseEmailList_(opts.bcc);
  var replyTo = String(opts.replyTo || '').trim();

  var fromEmail = String((opts.from || props_().getProperty(SENDGRID_FROM_EMAIL_PROP) || ALIAS_ADDRESS || '')).trim();
  if (!fromEmail) throw new Error('SendGrid: missing From email. Set Script Property SENDGRID_FROM_EMAIL.');
  var fromName = String((opts.name || props_().getProperty(SENDGRID_FROM_NAME_PROP) || 'LPAF Website') || '').trim();

  var subject = String(opts.subject || 'Website Contact');
  var textBody = String(opts.body || ' ');
  var htmlBody = opts.htmlBody ? String(opts.htmlBody) : '';

  var personalization = { to: to.map(function(e){ return { email: e }; }) };
  if (bcc.length) personalization.bcc = bcc.map(function(e){ return { email: e }; });

  var payload = {
    personalizations: [personalization],
    from: { email: fromEmail, name: fromName },
    subject: subject,
    content: []
  };

  if (replyTo && isValidEmail_(replyTo)) payload.reply_to = { email: replyTo };

  // Send both plain text and HTML when available.
  payload.content.push({ type: 'text/plain', value: textBody });
  if (htmlBody) payload.content.push({ type: 'text/html', value: htmlBody });

  // Attachments (base64)
  if (opts.attachments && opts.attachments.length) {
    payload.attachments = opts.attachments.map(function(blob){
      var safeBlob = blob;
      var filename = (safeBlob && safeBlob.getName && safeBlob.getName()) ? safeBlob.getName() : 'attachment';
      var mimeType = (safeBlob && safeBlob.getContentType && safeBlob.getContentType()) ? safeBlob.getContentType() : 'application/octet-stream';
      var bytes = safeBlob.getBytes ? safeBlob.getBytes() : [];
      return {
        content: Utilities.base64Encode(bytes),
        filename: filename,
        type: mimeType,
        disposition: 'attachment'
      };
    });
  }

  var res = UrlFetchApp.fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
    headers: {
      Authorization: 'Bearer ' + apiKey
    }
  });

  var code = Number(res.getResponseCode());
  if (code >= 200 && code < 300) return true; // 202 typical

  var errText = '';
  try { errText = res.getContentText(); } catch (e) {}
  throw new Error('SendGrid: request failed (' + code + '): ' + (errText || 'unknown error'));
}

function parseEmailList_(value) {
  if (!value) return [];
  var s = String(value);
  // Accept comma/semicolon separated.
  var parts = s.split(/[;,]/g).map(function(x){ return String(x || '').trim(); }).filter(Boolean);
  // Keep only plausible email strings.
  return parts.filter(function(x){ return isValidEmail_(x); });
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
        // Message keys: remove if corresponding timestamp is old or missing.
        // Suffix may be a legacy raw email OR a hashed identifier.
        var ident = k.slice('lastMsg:'.length);
        var ts = Number(all['lastEmailTS:' + ident] || '0');
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
      // Only applies to legacy keys that embed the raw email address.
      if (email.indexOf('@') === -1) return;
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
