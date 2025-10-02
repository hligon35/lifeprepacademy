// Google Apps Script to handle contact form submissions and send them to info@lifeprepacademyfoundation.com
// Deployment Instructions:
// 1. Extensions > Apps Script (or script.google.com) and paste this file.
// 2. Deploy > New deployment > Type: Web app. Execute as: Me. Access: Anyone.
// 3. Copy Web App URL and set as the form action in your site.
// 4. When testing in the editor: DO NOT click the Run ▶ button on doPost directly (e is undefined there).
//    Instead use the test harness testDoPost_() or issue an HTTP POST with curl / fetch.

function doPost(e) {
  try {
    if (!e) {
      return textResponse_('Missing event object. (Did you click Run instead of sending an HTTP POST?)', 400);
    }

    var params = {};
    if (e.parameter && Object.keys(e.parameter).length) {
      params = e.parameter; // Form fields
    } else if (e.postData && e.postData.type === 'application/json') {
      try {
        params = JSON.parse(e.postData.contents) || {};
      } catch (err) {
        return jsonResponse_({ status: 'error', message: 'Invalid JSON body.' }, 400);
      }
    }

    var name = sanitize_(params.name);
    var email = sanitize_(params.email).toLowerCase();
    var subjectField = sanitize_(params.subject) || 'Website Contact';
    var message = sanitize_(params.message, true);

    if (!name || !email || !message) {
      return jsonResponse_({ status: 'error', message: 'Required fields missing.' }, 422);
    }
    if (!isValidEmail_(email)) {
      return jsonResponse_({ status: 'error', message: 'Invalid email address.' }, 422);
    }

    var emailSubject = 'New Message From LifePrepAcademyFoundation.com: ' + subjectField;
    var body = 'Name: ' + name + '\nEmail: ' + email + '\nSubject: ' + subjectField + '\n\nMessage:\n' + message;

    MailApp.sendEmail({
      to: 'info@lifeprepacademyfoundation.com',
      replyTo: email,
      subject: emailSubject,
      body: body
    });

    return jsonResponse_({ status: 'success', message: 'Submission received.' });
  } catch (err) {
    return jsonResponse_({ status: 'error', message: err.message }, 500);
  }
}

// ---------- Helpers ----------
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
  var fakeEvent = { parameter: { name: 'Test User', email: 'test@example.com', subject: 'Test', message: 'Hello world!' } };
  var result = doPost(fakeEvent);
  Logger.log(result.getContent());
}
