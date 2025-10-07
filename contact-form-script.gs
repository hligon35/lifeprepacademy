/**
 * Google Apps Script Web App for Lifeprep Academy Foundation Contact Form
 * ----------------------------------------------------------------------
 * Features:
 * 1. Accepts POST submissions from the website form.
 * 2. Appends each submission as a new row in a Google Sheet.
 * 3. Sends an email notification to the foundation inbox.
 * 4. Returns JSON so the frontend can show a success/failure message.
 * 5. Basic sanitization & spam guard (honeypot + simple rate limit by IP).
 *
 * SETUP STEPS:
 * 1. Create a Google Sheet and name a tab: Submissions (or adjust SHEET_NAME).
 * 2. Put a header row (A1:F1): Timestamp | Name | Email | Subject | Message | User Agent | Page URL | IP
 * 3. In Apps Script, replace SHEET_ID_HERE with the Sheet ID (from URL between /d/ and /edit).
 * 4. Deploy > New deployment > type Web App: Execute as Me, Access: Anyone.
 * 5. Copy the Web App URL and replace the placeholder in index.html (form action / JS FETCH_URL).
 *
 * Optional: Set up email whitelist, spam scoring, or reCAPTCHA if abuse occurs.
 */

const SHEET_ID = '1ZcqK-O5GMsCPcV_NQzXLudP1swoZLb6BLzQNCXJ6qxI';      // <-- Replace with your Sheet ID
const SHEET_NAME = 'Submissions';      // Tab name
const NOTIFY_TO = 'info@lifeprepacademyfoundation.com';
const RATE_LIMIT_SECONDS = 60;         // Simple per-IP delay (in-memory)
const MAX_MESSAGE_LENGTH = 5000;       // Safety cap
// Anti-spam server-side thresholds (tune as needed)
const MIN_DWELL_MS = 3000;             // Require >= 3s dwell time
const MIN_TYPED_CHARS = 8;             // Require >= 8 typed characters
const EMAIL_WINDOW_MS = 2 * 60 * 1000; // Per-email cooldown window (2 min)
const CLIENT_WINDOW_MS = 2 * 60 * 1000;// Per-client cooldown window (2 min)
// Optional quick blocklist (exact emails or @domain suffixes)
const EMAIL_BLOCKLIST = [ /* 'bad@example.com', '@spamdomain.com' */ ];

/**
 * Main POST handler.
 * @param {GoogleAppsScript.Events.DoPost} e
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
  try {
    if (!e || !e.parameter) {
      return jsonResponse({ status: 'error', message: 'No form data received.' }, 400);
    }

    // Honeypot field
    if (e.parameter.hp_field) {
      // Optionally return success to avoid clueing bots
      return jsonResponse({ status: 'success', message: 'Processed.' });
    }

    const name = sanitize(e.parameter.name);
    const email = sanitize(e.parameter.email).toLowerCase();
    const subject = sanitize(e.parameter.subject);
    const message = sanitize(e.parameter.message, true);
    const pageUrl = sanitize(e.parameter.page || '');
    const userAgent = (e.parameter.userAgent || '').substring(0, 500);
    const submittedAt = sanitize(e.parameter.submittedAt || '');
    const dwellMs = Number(e.parameter.dwellMs || 0);
    const typedChars = Number(e.parameter.typedChars || 0);
    const clientId = String(e.parameter.clientId || 'na');
    const tsToken = e.parameter['cf_turnstile_response'];
    const ip = getClientIp(e);

    if (!name || !email || !subject || !message) {
      return jsonResponse({ status: 'error', message: 'Missing required fields.' }, 422);
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return jsonResponse({ status: 'error', message: 'Message too long.' }, 413);
    }

    if (!isValidEmail(email)) {
      return jsonResponse({ status: 'error', message: 'Invalid email.' }, 422);
    }

    // Blocklisted emails/domains
    if (isEmailBlocked_(email)) {
      return jsonResponse({ status: 'error', message: 'Submission blocked.' }, 403);
    }

    // Heuristics: dwell time and typed characters
    if (dwellMs && dwellMs < MIN_DWELL_MS) {
      return jsonResponse({ status: 'error', message: 'Please wait a few seconds before submitting.' }, 429);
    }
    if (typedChars && typedChars < MIN_TYPED_CHARS) {
      return jsonResponse({ status: 'error', message: 'Please provide more detail in your message.' }, 429);
    }

    if (isRateLimited(ip)) {
      return jsonResponse({ status: 'error', message: 'Please wait before submitting again.' }, 429);
    }

    // Persistent rate limits (per email and per clientId)
    if (tooSoonByEmail_(email, EMAIL_WINDOW_MS)) {
      return jsonResponse({ status: 'error', message: 'Please wait before sending another message.' }, 429);
    }
    if (tooSoonByClient_(clientId, CLIENT_WINDOW_MS)) {
      return jsonResponse({ status: 'error', message: 'Please wait before sending another message.' }, 429);
    }

    // Duplicate message guard per email (normalized)
    if (isDuplicateMessage_(email, message)) {
      return jsonResponse({ status: 'error', message: 'Duplicate message detected. Please modify and resend.' }, 429);
    }

    // Optional Turnstile verification if secret is configured
    var tsVerify = verifyTurnstile_(tsToken);
    if (tsVerify && tsVerify.required && !tsVerify.ok) {
      return jsonResponse({ status: 'error', message: 'Verification failed.' }, 403);
    }

    const sheet = getSheet_();
    sheet.appendRow([
      new Date(),
      name,
      email,
      subject,
      message,
      userAgent,
      pageUrl,
      ip
    ]);

    sendNotificationEmail_(name, email, subject, message, pageUrl, ip, userAgent);

    // Record submission for cooldown and duplicate detection
    recordSubmission_(email, clientId, message);

    return jsonResponse({ status: 'success', message: 'Submission received. Thank you!' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message }, 500);
  }
}

// ----------------- Helpers -----------------

function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  return sheet;
}

function sanitize(str, allowLineBreaks) {
  if (!str) return '';
  let s = String(str).trim();
  if (!allowLineBreaks) {
    s = s.replace(/[\r\n]+/g, ' ');
  } else {
    // Normalize line breaks
    s = s.replace(/\r\n|\r/g, '\n');
  }
  // Basic strip of problematic chars
  return s.replace(/[<>]/g, '');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sendNotificationEmail_(name, email, subject, message, pageUrl, ip, userAgent) {
  const mailSubject = `Website Contact: ${subject} - ${name}`;
  const htmlBody = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;font-size:14px;color:#222;">
      <h2 style="margin:0 0 12px;color:#281156;">New Website Contact</h2>
      <table style="border-collapse:collapse;width:100%;max-width:600px;">
        <tr><td style="padding:6px 4px;font-weight:600;width:120px;">Name:</td><td>${escapeHtml_(name)}</td></tr>
        <tr><td style="padding:6px 4px;font-weight:600;">Email:</td><td>${escapeHtml_(email)}</td></tr>
        <tr><td style="padding:6px 4px;font-weight:600;">Subject:</td><td>${escapeHtml_(subject)}</td></tr>
        <tr><td style="padding:6px 4px;font-weight:600;">Message:</td><td><pre style="white-space:pre-wrap;margin:0;">${escapeHtml_(message)}</pre></td></tr>
        <tr><td style="padding:6px 4px;font-weight:600;">Page:</td><td>${escapeHtml_(pageUrl)}</td></tr>
        <tr><td style="padding:6px 4px;font-weight:600;">IP:</td><td>${escapeHtml_(ip)}</td></tr>
        <tr><td style="padding:6px 4px;font-weight:600;">User Agent:</td><td><small>${escapeHtml_(userAgent)}</small></td></tr>
      </table>
      <p style="font-size:12px;color:#666;margin-top:16px;">This email was generated automatically by the Lifeprep Academy Foundation website contact form.</p>
    </div>
  `;
  MailApp.sendEmail({
    to: NOTIFY_TO,
    replyTo: email,
    subject: mailSubject,
    htmlBody: htmlBody,
    name: 'Lifeprep Academy Foundation Website'
  });
}

function escapeHtml_(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getClientIp(e) {
  // Apps Script doesn't expose raw IP directly; this is a placeholder.
  // If behind a proxy service injecting headers, you can parse from e.parameter or e.postData.
  return (e && e.parameter && e.parameter.ip) ? e.parameter.ip : 'N/A';
}

function jsonResponse(obj, code) {
  const output = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  if (code && output.setResponseCode) {
    try { output.setResponseCode(code); } catch (e) {/* older runtimes may not support */}
  }
  return output;
}

// Simple in-memory rate limiting (resets when script container restarts)
const _rateMap = {};
function isRateLimited(key) {
  const now = Date.now();
  const last = _rateMap[key];
  if (last && (now - last) / 1000 < RATE_LIMIT_SECONDS) return true;
  _rateMap[key] = now;
  return false;
}

// --------------- Anti-spam helpers ---------------
function props_() { return PropertiesService.getScriptProperties(); }

function tooSoonByEmail_(email, windowMs) {
  if (!email) return false;
  var key = 'lastEmailTS:' + email;
  var now = Date.now();
  var last = Number(props_().getProperty(key) || '0');
  if (last && now - last < windowMs) return true;
  return false;
}

function tooSoonByClient_(clientId, windowMs) {
  if (!clientId || clientId === 'na') return false;
  var key = 'lastClientTS:' + clientId;
  var now = Date.now();
  var last = Number(props_().getProperty(key) || '0');
  if (last && now - last < windowMs) return true;
  return false;
}

function recordSubmission_(email, clientId, message) {
  try {
    var now = Date.now();
    if (email) props_().setProperty('lastEmailTS:' + email, String(now));
    if (clientId && clientId !== 'na') props_().setProperty('lastClientTS:' + clientId, String(now));
    if (email && message) {
      var norm = normalizeMsg_(message);
      props_().setProperty('lastMsg:' + email, norm);
    }
  } catch (e) {}
}

function isDuplicateMessage_(email, message) {
  if (!email || !message) return false;
  var last = props_().getProperty('lastMsg:' + email) || '';
  var cur = normalizeMsg_(message);
  return last && cur && last === cur;
}

function normalizeMsg_(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }

function isEmailBlocked_(email) {
  var e = String(email || '').toLowerCase();
  return EMAIL_BLOCKLIST.some(function(rule){
    var r = String(rule || '').toLowerCase();
    return r.startsWith('@') ? e.endsWith(r) : e === r;
  });
}

function verifyTurnstile_(token) {
  try {
    var secret = props_().getProperty('TURNSTILE_SECRET');
    if (!secret) return { ok: true, required: false };
    if (!token) return { ok: false, required: true };
    var res = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post', muteHttpExceptions: true, payload: { secret: secret, response: token }
    });
    var data = JSON.parse(res.getContentText() || '{}');
    return { ok: !!data.success, required: true, data: data };
  } catch (err) {
    return { ok: false, required: true, error: String(err) };
  }
}
