const SHEET_ID = '1EIG6F00-mVhT9ws0nS3pJBrp9Y2mPH87p6UyLkWtKT4';

const SHEET_NAMES = {
  PLAYERS: 'Players',
  VOLUNTEERS: 'Volunteers',
  COACHES: 'Coaches',
  SCHOLARSHIPS: 'Scholarships',
  ERRORS: 'Errors',
};

const PLAYER_AGREEMENT_COLUMNS = [
  'Player Agreement Status',
  'Player Agreement Version',
  'Player Agreement Signed At',
  'Player Agreement Signer Name',
  'Player Agreement File ID',
  'Player Agreement PDF URL',
  'Player Agreement SHA-256',
  'Player Agreement Transaction ID',
];

const PLAYER_PAYMENT_COLUMNS = [
  'Player Payment Status',
  'Player Payment Amount',
  'Player Payment Currency',
  'Player Payment Paid At',
  'Player Payment Transaction ID',
  'Player Payment Receipt URL',
];

// These columns are appended to the far right of the Players sheet so the
// existing positional registration columns are never shifted or overwritten.
const PLAYER_IDENTITY_COLUMNS = [
  'player_1_id',
  'player_1_division_id',
  'player_2_id',
  'player_2_division_id',
  'player_3_id',
  'player_3_division_id',
  'player_4_id',
  'player_4_division_id',
];

// Replace only the values below if MLS GO gives you official division IDs.
const DIVISION_IDS = Object.freeze({
  SECOND_THIRD_BOYS: 'PGS-23B',
  SECOND_THIRD_GIRLS: 'PGS-23G',
  FOURTH_FIFTH_BOYS: 'PGS-45B',
  FOURTH_FIFTH_GIRLS: 'PGS-45G',
});

const VOLUNTEER_AGREEMENT_COLUMNS = [
  'Volunteer Agreement Status',
  'Volunteer Agreement Version',
  'Volunteer Agreement Signed At',
  'Volunteer Agreement Signer Name',
  'Volunteer Agreement File ID',
  'Volunteer Agreement PDF URL',
  'Volunteer Agreement SHA-256',
  'Volunteer Agreement Transaction ID',
];

const PPF_LIABILITY_COLUMNS = [
  'PPF Liability File ID',
  'PPF Liability PDF URL',
];

const BRAND_URL = 'https://www.lifeprepacademyfoundation.com/';
const BRAND_DOMAIN = 'lifeprepacademyfoundation.com';
const REGISTRATION_BANNER_URL = 'https://mlsregistration.lifeprepacademyfoundation.com/LPAFxPGS.PNG';
const REGISTRATION_FOOTER_URL = 'https://mlsregistration.lifeprepacademyfoundation.com/MLSGO_26_Email_Footer_2.jpg';
const EMAIL_HEADER_LINK_URL = 'https://lifeprepacademyfoundation.com';
const EMAIL_FOOTER_LINK_URL = 'https://lifeprepacademyfoundation.com/mls-go.html';
const INTERNAL_SUBMISSION_RECIPIENTS = 'hligon@getsparqd.com,bhall@lifeprepacademyfoundation.com';
const REGISTRATION_PAYMENT_FALLBACK = 'If the registration fee is not prefilled on the payment page, select Other and enter $75.';
const EMAIL_SENDER_ALIAS = 'youthprograms@lifeprepacademyfoundation.com';
const EMAIL_REPLY_TO = 'info@lifeprepacademyfoundation.com';
const DEFAULT_EMAIL_SENDER_NAME = 'LifePrep Academy Foundation';
const TEST_SEND_RECIPIENT = 'hligon@getsparqd.com';
const PPF_LIABILITY_FORM_URL = 'https://mlsregistration.lifeprepacademyfoundation.com/documents/PPF%20Liability%20Form.pdf';
const PPF_LIABILITY_RENDER_URL = 'https://mlsregistration.lifeprepacademyfoundation.com/api/forms/ppf-pdf';

const AGREEMENT_ARCHIVE_FOLDERS = Object.freeze({
  PLAYER: '1I5xbI9sihz7ALY78ul_SBjf-g-iJYZSA',
  PPF: '1gSkERsjVdSPtZTHArpRcHF9ixtosnc0h',
  VOLUNTEER: '1yV4m6ASbxAVtia7zi5A5uL1sx5N53cwC',
});

const SCHOLARSHIP_LIVE_AUTOMATION = Object.freeze({
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbxe5ObXXsACvVrIw5oYEGO0kf1Nc7-8OyjnmQQd7Y3A0pkHX70c2IK90HWboJkp-2EE/exec',
  ACTION: 'archive_live_scholarship_application',
  TOKEN_PROPERTY: 'SCHOLARSHIP_LIVE_WEBHOOK_TOKEN',
});

const SCHOLARSHIP_HEADERS = [
  'submitted_at',
  'form_type',
  'registration_submission_id',
  'page_url',
  'parent_first_name',
  'parent_last_name',
  'parent_email',
  'parent_phone',
  'scholarship_requested',
  'scholarship_level',
  'scholarship_household_size',
  'scholarship_household_income',
  'scholarship_eligibility',
  'scholarship_circumstances',
  'scholarship_contribution_amount',
  'scholarship_participation_commitment',
  'scholarship_parent_acknowledgement',
  'scholarship_guidelines_accepted',
  'participant_names',
];

const PLAYER_HEADERS = [
  'submitted_at',
  'form_type',
  'registration_submission_id',
  'page_url',
  'parent_first_name',
  'parent_last_name',
  'parent_email',
  'parent_phone',
  'parent_street',
  'parent_apt',
  'parent_city',
  'parent_state',
  'parent_zip',
  'parent_guardian_dob',
  'emergency_same_as_parent',
  'emergency_first_name',
  'emergency_last_name',
  'emergency_relationship',
  'emergency_email',
  'emergency_phone',
  'emergency_street',
  'emergency_apt',
  'emergency_city',
  'emergency_state',
  'emergency_zip',
  'player_count',
  'player_1_first_name',
  'player_1_last_name',
  'player_1_dob',
  'player_1_gender',
  'player_1_grade',
  'player_1_jersey',
  'player_1_shorts',
  'player_1_socks',
  'player_1_race',
  'player_1_race_other',
  'player_1_favorite_club',
  'player_1_hear_about',
  'player_1_add_another',
  'player_2_first_name',
  'player_2_last_name',
  'player_2_dob',
  'player_2_gender',
  'player_2_grade',
  'player_2_jersey',
  'player_2_shorts',
  'player_2_socks',
  'player_2_race',
  'player_2_race_other',
  'player_2_favorite_club',
  'player_2_hear_about',
  'player_2_add_another',
  'player_3_first_name',
  'player_3_last_name',
  'player_3_dob',
  'player_3_gender',
  'player_3_grade',
  'player_3_jersey',
  'player_3_shorts',
  'player_3_socks',
  'player_3_race',
  'player_3_race_other',
  'player_3_favorite_club',
  'player_3_hear_about',
  'player_3_add_another',
  'player_4_first_name',
  'player_4_last_name',
  'player_4_dob',
  'player_4_gender',
  'player_4_grade',
  'player_4_jersey',
  'player_4_shorts',
  'player_4_socks',
  'player_4_race',
  'player_4_race_other',
  'player_4_favorite_club',
  'player_4_hear_about',
  'help_choice',
  'scholarship_requested',
  'agree_waiver',
  'agree_privacy',
  'agree_marketing',
  'signature',
  ...PLAYER_AGREEMENT_COLUMNS,
  ...PLAYER_PAYMENT_COLUMNS,
];

const VOLUNTEER_HEADERS = [
  'submittedAt',
  'form_type',
  'submission_id',
  'pageUrl',
  'firstName',
  'lastName',
  'email',
  'phone',
  'street',
  'apt',
  'city',
  'state',
  'zip',
  'dob',
  'roles',
  'hasExperience',
  'experienceSummary',
  'availabilityNotes',
  'agreement',
  'signature',
  'linkedParentEmail',
  ...VOLUNTEER_AGREEMENT_COLUMNS,
];

const COACH_HEADERS = [
  'submittedAt',
  'form_type',
  'submission_id',
  'pageUrl',
  'firstName',
  'lastName',
  'email',
  'phone',
  'street',
  'apt',
  'city',
  'state',
  'zip',
  'dob',
  'roles',
  'hasExperience',
  'experienceSummary',
  'availabilityNotes',
  'agreement',
  'signature',
  'linkedParentEmail',
  'coachHasExperience',
  'coachExperienceSummary',
  'coachAvailability',
  'ref1Name',
  'ref1Relationship',
  'ref1Phone',
  'ref1Email',
  'coachCertifications',
  'coachBackgroundConsent',
  'coachSignature',
  ...VOLUNTEER_AGREEMENT_COLUMNS,
];

const ERROR_HEADERS = ['submitted_at', 'form_type', 'reason', 'payload'];
const EMAIL_TRACKING_SHEET_NAME = 'Email Tracking';
const EMAIL_TRACKING_HEADERS = ['tracking_id', 'event_type', 'email_type', 'submission_id', 'recipient_email', 'target_url', 'link_label', 'created_at', 'user_agent', 'ip_address', 'source_url'];
const SHEET_TIMESTAMP_FORMAT = 'M/d/yyyy h:mm:ss a';
const TIMESTAMP_HEADERS = [
  'submitted_at',
  'submittedAt',
  'Player Agreement Signed At',
  'Volunteer Agreement Signed At',
  'Player Payment Paid At',
];

const FORM_CONFIG = {
  mls_registration: {
    sheetName: SHEET_NAMES.PLAYERS,
    headers: PLAYER_HEADERS,
    idColumn: 'registration_submission_id',
  },
  scholarship_application: {
    sheetName: SHEET_NAMES.SCHOLARSHIPS,
    headers: SCHOLARSHIP_HEADERS,
    idColumn: 'registration_submission_id',
  },
  volunteer_application: {
    sheetName: SHEET_NAMES.VOLUNTEERS,
    headers: VOLUNTEER_HEADERS,
    idColumn: 'submission_id',
  },
  coaching_application: {
    sheetName: SHEET_NAMES.COACHES,
    headers: COACH_HEADERS,
    idColumn: 'submission_id',
  },
};

function sendBrandedEmail_(message) {
  const to = normalizeValue_(message && message.to);
  const subject = normalizeValue_(message && message.subject);
  const body = normalizeValue_((message && message.body) || '');
  const from = normalizeValue_((message && message.from) || EMAIL_SENDER_ALIAS).toLowerCase();
  const aliases = GmailApp.getAliases().map(function(alias) {
    return normalizeValue_(alias).toLowerCase();
  });

  if (!to) throw new Error('Email recipient is required.');
  if (!subject) throw new Error('Email subject is required.');
  if (!from) throw new Error('Email sender alias is required.');
  if (aliases.indexOf(from) === -1) {
    throw new Error('Configured sender alias is not available for this mailbox: ' + from);
  }

  GmailApp.sendEmail(to, subject, body, {
    htmlBody: message && message.htmlBody ? message.htmlBody : undefined,
    name: normalizeValue_((message && message.name) || DEFAULT_EMAIL_SENDER_NAME),
    replyTo: normalizeValue_((message && message.replyTo) || EMAIL_REPLY_TO),
    from: from,
  });
}

function testSendAliasEmail() {
  sendBrandedEmail_({
    to: TEST_SEND_RECIPIENT,
    subject: 'MLS GO Apps Script Alias Test',
    body: 'This is a direct alias-sender test from the MLS GO Apps Script project.',
    htmlBody: buildBrandedSubmissionEmailHtml_({
      title: 'MLS GO Apps Script Alias Test',
      greeting: 'This is a direct alias-sender test from the MLS GO Apps Script project.',
      message: 'If you received this, the script executed under bhall@lifeprepacademyfoundation.com and sent through youthprograms@lifeprepacademyfoundation.com.',
    }),
    name: DEFAULT_EMAIL_SENDER_NAME,
    replyTo: EMAIL_REPLY_TO,
  });
}

function testSendFlowConfirmationEmail() {
  return sendFlowConfirmationEmail_({
    emailType: 'registration_player',
    submissionId: 'TEST-' + new Date().getTime(),
    recipientEmail: TEST_SEND_RECIPIENT,
    applicantFirstName: 'Harold',
    applicantLastName: 'Ligon',
    participantNames: 'Test Player One',
    formsRecorded: ['MLS GO Registration'],
    agreementsRecorded: ['Player Agreement'],
    scholarshipRequested: 'No',
    paymentRequired: true,
    paymentAmount: '75',
    paymentUrl: 'https://example.com/payment-test',
    signedDocumentUrls: [],
    sourceUrl: BRAND_URL,
    trackingBaseUrl: ScriptApp.getService().getUrl(),
  });
}

function doGet(e) {
  if (!e || !e.parameter) {
    return HtmlService.createHtmlOutput('<p>Email tracking endpoint is active.</p>');
  }

  const action = normalizeValue_(e.parameter.action);
  if (action === 'track_email') {
    return handleEmailTrackingRequest_(e);
  }

  return HtmlService.createHtmlOutput('<p>Unknown request.</p>');
}

function doPost(e) {
  if (!e || !e.parameter) {
    initializeSheets();
    return json_({ ok: true, initialized: true });
  }

  const action = normalizeValue_(e.parameter.action);
  if (action === 'track_email') {
    return handleEmailTrackingRequest_(e);
  }
  if (action === 'update_agreement_metadata') {
    return handleAgreementMetadataUpdate_(e.parameter);
  }
  if (action === 'update_payment_metadata') {
    return handlePaymentMetadataUpdate_(e.parameter);
  }
  if (action === 'get_registration_context') {
    return handleRegistrationContextLookup_(e.parameter);
  }
  if (action === 'lookup_registration_for_payment_receipt') {
    return handlePaymentReceiptLookup_(e.parameter);
  }
  if (action === 'send_registration_receipt_email') {
    return handleRegistrationReceiptEmail_(e.parameter);
  }
  if (action === 'send_registration_paid_email') {
    return handleRegistrationPaidEmail_(e.parameter);
  }
  if (action === 'send_scholarship_application_email') {
    return handleScholarshipApplicationEmail_(e.parameter);
  }
  if (action === 'send_flow_confirmation_email') {
    return handleFlowConfirmationEmail_(e.parameter);
  }
  if (action === 'send_volunteer_coach_confirmation_email') {
    return handleVolunteerCoachConfirmationEmail_(e.parameter);
  }

  return handleSubmissionUpsert_(e.parameter);
}

function handleSubmissionUpsert_(values) {
  const formType = normalizeValue_(values.form_type);
  const config = getFormConfig_(formType, true);
  if (!config) {
    writeError_(formType, 'Unknown form_type', values);
    return json_({ ok: false, error: 'Unknown form_type' }, 400);
  }

  if (formType === 'scholarship_application') {
    return handleScholarshipSubmissionUpsert_(values, config);
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getSheet_(config.sheetName);
    ensureHeaders_(sheet, config.headers);
    if (formType === 'mls_registration') {
      ensurePlayerIdentityHeaders_(sheet);
    }

    const submissionId = normalizeValue_(lookupPayloadValue_(values, config.idColumn));
    if (!submissionId) {
      writeError_(formType, `Missing ${config.idColumn}`, values);
      return json_({ ok: false, error: `Missing ${config.idColumn}` }, 400);
    }

    const headerIndex = buildHeaderIndex_(config.headers);
    const rowValues = config.headers.map((header) => formatSheetValue_(header, lookupPayloadValue_(values, header)));

    const existingRow = findRowBySubmissionId_(sheet, config.headers, config.idColumn, submissionId);
    if (existingRow > 0) {
      const existingRecord = readSheetRowRecord_(sheet, config.headers, existingRow);
      preserveSystemManagedColumns_(rowValues, config.headers, existingRecord, formType);
      applyPendingAgreementDefaults_(rowValues, config.headers, formType);
      sheet.getRange(existingRow, 1, 1, config.headers.length).setValues([rowValues]);
      const players = formType === 'mls_registration'
        ? assignPlayerIdentityForRow_(sheet, existingRow)
        : [];
      SpreadsheetApp.flush();
      return json_({
        ok: true,
        upserted: true,
        updatedExistingRow: true,
        row: existingRow,
        players: players,
        scholarshipAutomation: null,
      });
    }

    applyPendingAgreementDefaults_(rowValues, config.headers, formType);

    sheet.appendRow(rowValues);
    const insertedRow = sheet.getLastRow();
    const players = formType === 'mls_registration'
      ? assignPlayerIdentityForRow_(sheet, insertedRow)
      : [];
    sendInternalSubmissionNotification_(formType, config, values, rowValues);
    SpreadsheetApp.flush();

    return json_({
      ok: true,
      upserted: true,
      updatedExistingRow: false,
      row: insertedRow,
      players: players,
      scholarshipAutomation: null,
    });
  } finally {
    lock.releaseLock();
  }
}

function handleScholarshipSubmissionUpsert_(values, config) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getSheet_(config.sheetName);
    const actualHeaders = ensureHeadersByName_(sheet, config.headers);
    const submissionId = normalizeValue_(lookupPayloadValue_(values, config.idColumn));
    if (!submissionId) {
      writeError_('scholarship_application', `Missing ${config.idColumn}`, values);
      return json_({ ok: false, error: `Missing ${config.idColumn}` }, 400);
    }

    const existingRow = findRowByHeaderValue_(sheet, actualHeaders, config.idColumn, submissionId);
    const existingRecord = existingRow > 0
      ? readSheetRowRecordByHeader_(sheet, actualHeaders, existingRow)
      : null;
    const rowValues = buildRowValuesByHeader_(actualHeaders, values, existingRecord, config.headers);

    let rowNumber = existingRow;
    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, actualHeaders.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
      rowNumber = sheet.getLastRow();
      const submissionValues = config.headers.map(function(header) {
        return formatSheetValue_(header, lookupPayloadValue_(values, header));
      });
      sendInternalSubmissionNotification_('scholarship_application', config, values, submissionValues);
    }

    SpreadsheetApp.flush();
    const scholarshipAutomation = finalizeScholarshipLiveApplication_(values, submissionId);

    return json_({
      ok: true,
      upserted: true,
      updatedExistingRow: existingRow > 0,
      row: rowNumber,
      scholarshipAutomation: scholarshipAutomation,
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Immediately asks the standalone scholarship app to generate and archive the
 * live scholarship document for the newly recorded registration row. A failure
 * is reported without undoing the form row.
 */
function finalizeScholarshipLiveApplication_(values, submissionId) {
  const token = normalizeValue_(
    PropertiesService.getScriptProperties().getProperty(
      SCHOLARSHIP_LIVE_AUTOMATION.TOKEN_PROPERTY
    )
  );
  if (!token) {
    const error = 'Missing Script Property: ' + SCHOLARSHIP_LIVE_AUTOMATION.TOKEN_PROPERTY;
    writeError_('scholarship_application', error, {
      registration_submission_id: submissionId
    });
    return {ok: false, configured: false, error: error};
  }

  const parentEmail = normalizeValue_(
    lookupPayloadValue_(values, 'parent_email') || lookupPayloadValue_(values, 'email')
  ).toLowerCase();
  if (!parentEmail || !isValidEmail_(parentEmail)) {
    const error = 'A valid parent_email is required for live scholarship automation.';
    writeError_('scholarship_application', error, {
      registration_submission_id: submissionId,
      parent_email: parentEmail
    });
    return {ok: false, error: error};
  }

  try {
    const response = UrlFetchApp.fetch(SCHOLARSHIP_LIVE_AUTOMATION.WEB_APP_URL, {
      method: 'post',
      followRedirects: true,
      muteHttpExceptions: true,
      payload: {
        action: SCHOLARSHIP_LIVE_AUTOMATION.ACTION,
        webhook_token: token,
        registration_submission_id: submissionId,
        parent_email: parentEmail,
        submitted_at: normalizeValue_(lookupPayloadValue_(values, 'submitted_at')),
      },
    });
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(
        'Scholarship automation returned HTTP ' + responseCode + ' with a non-JSON response.'
      );
    }
    if (responseCode < 200 || responseCode >= 300 || !result || result.ok !== true) {
      throw new Error(
        result && result.error
          ? result.error
          : 'Scholarship automation returned HTTP ' + responseCode + '.'
      );
    }
    return result;
  } catch (error) {
    const message = String(error && error.message ? error.message : error);
    writeError_('scholarship_application', 'Live scholarship automation failed', {
      registration_submission_id: submissionId,
      parent_email: parentEmail,
      error: message
    });
    return {ok: false, error: message};
  }
}

function sendInternalSubmissionNotification_(formType, config, values, rowValues) {
  const record = {};
  config.headers.forEach(function(header, index) {
    record[header] = normalizeValue_(rowValues[index]);
  });

  const submissionId = normalizeValue_(record[config.idColumn] || lookupPayloadValue_(values, config.idColumn));
  const submittedAt = normalizeValue_(record.submitted_at || record.submittedAt || lookupPayloadValue_(values, 'submitted_at'));
  const firstName = normalizeValue_(record.parent_first_name || record.firstName);
  const lastName = normalizeValue_(record.parent_last_name || record.lastName);
  const applicantName = `${firstName} ${lastName}`.trim();
  const applicantEmail = normalizeValue_(record.parent_email || record.email);
  const participantNames = getInternalParticipantNames_(record, formType);
  const paymentStatus = normalizeValue_(record['Player Payment Status']) || 'Payment Pending';
  const paymentTransactionId = normalizeValue_(record['Player Payment Transaction ID']) || 'Not available';
  const paymentAmount = normalizeValue_(record['Player Payment Amount']) || 'Not available';
  const paymentPaidAt = normalizeValue_(record['Player Payment Paid At']) || 'Not paid';
  const formLabel = getInternalFormLabel_(formType);
  const subject = `New ${formLabel} submission | ${submissionId || 'ID unavailable'}`;
  const body = [
    'A new LifePrep Academy Foundation MLS GO youth program form has been submitted.',
    '',
    `Submission type: ${formLabel}`,
    `Submission ID: ${submissionId || 'Unavailable'}`,
    `Submitted at: ${submittedAt || 'Unavailable'}`,
    `Applicant: ${applicantName || 'Unavailable'}`,
    `Email: ${applicantEmail || 'Unavailable'}`,
    `Participant(s): ${participantNames || 'Not applicable'}`,
    '',
    'Payment pairing information:',
    `Payment status: ${paymentStatus}`,
    `Payment transaction ID: ${paymentTransactionId}`,
    `Payment amount: ${paymentAmount}`,
    `Payment paid at: ${paymentPaidAt}`,
  ].join('\n');

  try {
    sendBrandedEmail_({
      to: INTERNAL_SUBMISSION_RECIPIENTS,
      subject,
      body,
      htmlBody: buildInternalSubmissionNotificationHtml_({
        formLabel,
        submissionId,
        submittedAt,
        applicantName,
        applicantEmail,
        participantNames,
        paymentStatus,
        paymentTransactionId,
        paymentAmount,
        paymentPaidAt,
      }),
      name: 'LifePrep Academy Foundation MLS GO',
      replyTo: EMAIL_REPLY_TO,
    });
  } catch (error) {
    writeError_(formType, 'Internal submission notification email failed', {
      submission_id: submissionId,
      recipient: INTERNAL_SUBMISSION_RECIPIENTS,
      error: String(error && error.message ? error.message : error),
    });
  }
}

function getInternalFormLabel_(formType) {
  const labels = {
    mls_registration: 'MLS GO Youth Program Registration',
    scholarship_application: 'Financial Hardship Scholarship Application',
    volunteer_application: 'MLS GO Youth Program Volunteer Application',
    coaching_application: 'MLS GO Youth Program Coaching Application',
  };
  return labels[formType] || 'MLS GO Youth Program Form';
}

function getInternalParticipantNames_(record, formType) {
  if (formType !== 'mls_registration') return '';
  const names = [];
  for (let index = 1; index <= 4; index += 1) {
    const name = `${normalizeValue_(record[`player_${index}_first_name`])} ${normalizeValue_(record[`player_${index}_last_name`])}`.trim();
    if (name) names.push(name);
  }
  return names.join(', ');
}

function buildInternalSubmissionNotificationHtml_(data) {
  const safe = function(value) { return escapeHtml_(value || 'Unavailable'); };
  const row = function(label, value) {
    return '<tr><td style="padding:9px 10px;border-bottom:1px solid #d9d2c7;font-weight:700;color:#1d2f40;vertical-align:top">'
      + escapeHtml_(label) + '</td><td style="padding:9px 10px;border-bottom:1px solid #d9d2c7;color:#22313f;vertical-align:top">'
      + safe(value) + '</td></tr>';
  };
  const headerUrl = escapeHtml_(REGISTRATION_BANNER_URL);
  const footerUrl = escapeHtml_(REGISTRATION_FOOTER_URL);
  const headerLink = escapeHtml_(EMAIL_HEADER_LINK_URL);
  const footerLink = escapeHtml_(EMAIL_FOOTER_LINK_URL);

  return '<!doctype html><html><body style="margin:0;padding:0;background:#f4f0e8;font-family:Arial,sans-serif;color:#1d2f40">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#f4f0e8"><tr><td style="padding:24px 12px">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:700px;margin:0 auto;background:#ffffff;border:1px solid #d9d2c7;border-collapse:collapse">'
    + '<tr><td><a href="' + headerLink + '"><img src="' + headerUrl + '" alt="LifePrep Academy Foundation MLS GO youth program" style="display:block;width:100%;height:auto;border:0"></a></td></tr>'
    + '<tr><td style="padding:28px 30px 30px"><p style="margin:0 0 8px;color:#c16a2b;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">Internal Notification</p>'
    + '<h1 style="margin:0 0 20px;font-size:26px;line-height:1.2;color:#1d2f40">New ' + safe(data.formLabel) + '</h1>'
    + '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">'
    + row('Submission ID', data.submissionId)
    + row('Submitted at', data.submittedAt)
    + row('Applicant', data.applicantName)
    + row('Email', data.applicantEmail)
    + row('Participant(s)', data.participantNames || 'Not applicable')
    + row('Payment status', data.paymentStatus)
    + row('Payment transaction ID', data.paymentTransactionId)
    + row('Payment amount', data.paymentAmount)
    + row('Payment paid at', data.paymentPaidAt)
    + '</table></td></tr>'
    + '<tr><td><a href="' + footerLink + '"><img src="' + footerUrl + '" alt="LifePrep Academy Foundation MLS GO youth program" style="display:block;width:100%;height:auto;border:0"></a></td></tr>'
    + '<tr><td style="padding:16px 30px 24px;text-align:center;color:#66727d;font-size:12px;line-height:1.5">LifePrep Academy Foundation<br>MLS GO youth program</td></tr>'
    + '</table></td></tr></table></body></html>';
}

function handleAgreementMetadataUpdate_(values) {
  const expected = PropertiesService.getScriptProperties().getProperty('AGREEMENT_UPDATE_TOKEN') || '';
  const provided = normalizeValue_(values.update_token);
  if (!expected || provided !== expected) {
    return json_({ ok: false, error: 'Unauthorized update token' }, 403);
  }

  const formType = normalizeValue_(values.form_type);
  const config = getFormConfig_(formType, true);
  if (!config) return json_({ ok: false, error: 'Unknown form_type' }, 400);

  const submissionId = normalizeValue_(values.submission_id);
  if (!submissionId) return json_({ ok: false, error: 'Missing submission_id' }, 400);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getSheet_(config.sheetName);
    const columnNames =
      formType === 'mls_registration' ? PLAYER_AGREEMENT_COLUMNS : VOLUNTEER_AGREEMENT_COLUMNS;
    const actualHeaders = ensureHeadersByName_(
      sheet,
      getAgreementArchiveRequiredHeaders_(formType, config.idColumn, columnNames)
    );

    const row = findRowByHeaderValue_(sheet, actualHeaders, config.idColumn, submissionId);
    if (row <= 0) {
      return json_({ ok: false, error: 'Matching row not found' }, 404);
    }

    const headerIndex = buildHeaderIndexByName_(actualHeaders);

    const agreementValues = {
      [columnNames[0]]: normalizeValue_(values.agreement_status),
      [columnNames[1]]: normalizeValue_(values.agreement_version),
      [columnNames[2]]: normalizeValue_(values.agreement_signed_at),
      [columnNames[3]]: normalizeValue_(values.agreement_signer_name),
      [columnNames[4]]: normalizeValue_(values.agreement_file_id),
      [columnNames[5]]: normalizeValue_(values.agreement_pdf_url),
      [columnNames[6]]: normalizeValue_(values.agreement_sha256),
      [columnNames[7]]: normalizeValue_(values.agreement_transaction_id),
    };

    const rowRecord = readSheetRowRecordByHeader_(sheet, actualHeaders, row);
    let archiveResult;
    try {
      archiveResult = archiveAgreementPdf_(formType, submissionId, rowRecord, {
        fileId: agreementValues[columnNames[4]],
        pdfUrl: agreementValues[columnNames[5]],
        signedAt: agreementValues[columnNames[2]],
        transactionId: agreementValues[columnNames[7]],
      });
      if (archiveResult.ok) {
        agreementValues[columnNames[4]] = archiveResult.fileId;
        agreementValues[columnNames[5]] = archiveResult.url;
      }
    } catch (archiveError) {
      archiveResult = {
        ok: false,
        error: String(archiveError && archiveError.message ? archiveError.message : archiveError),
      };
      console.error('Agreement PDF archive failed: ' + archiveResult.error);
    }

    let ppfArchiveResult;
    if (formType === 'mls_registration') {
      try {
        const ppfHeaders = ensureHeadersByName_(sheet, PPF_LIABILITY_COLUMNS);
        const ppfHeaderIndex = buildHeaderIndexByName_(ppfHeaders);
        ppfArchiveResult = archivePpfLiabilityPdf_(submissionId, rowRecord, {
          signedAt: agreementValues[columnNames[2]],
          transactionId: agreementValues[columnNames[7]],
        });

        if (ppfArchiveResult.ok) {
          const ppfValues = {
            [PPF_LIABILITY_COLUMNS[0]]: ppfArchiveResult.fileId,
            [PPF_LIABILITY_COLUMNS[1]]: ppfArchiveResult.url,
          };

          Object.keys(ppfValues).forEach((header) => {
            const col = getHeaderColumnByName_(ppfHeaderIndex, header);
            if (!col) return;
            sheet.getRange(row, col).setValue(formatSheetValue_(header, ppfValues[header]));
          });
        }
      } catch (ppfArchiveError) {
        ppfArchiveResult = {
          ok: false,
          error: String(ppfArchiveError && ppfArchiveError.message ? ppfArchiveError.message : ppfArchiveError),
        };
        console.error('PPF liability PDF archive failed: ' + ppfArchiveResult.error);
      }
    }

    Object.keys(agreementValues).forEach((header) => {
      const col = getHeaderColumnByName_(headerIndex, header);
      if (!col) return;
      sheet.getRange(row, col).setValue(formatSheetValue_(header, agreementValues[header]));
    });

    return json_({
      ok: true,
      updated: true,
      row,
      pdfArchived: Boolean(archiveResult && archiveResult.ok),
      archivedPdfUrl: archiveResult && archiveResult.ok ? archiveResult.url : '',
      ppfArchived: Boolean(ppfArchiveResult && ppfArchiveResult.ok),
      archivedPpfPdfUrl: ppfArchiveResult && ppfArchiveResult.ok ? ppfArchiveResult.url : '',
      archiveWarning: archiveResult && !archiveResult.ok
        ? normalizeValue_(archiveResult.error || archiveResult.reason)
        : '',
      ppfArchiveWarning: ppfArchiveResult && !ppfArchiveResult.ok
        ? normalizeValue_(ppfArchiveResult.error || ppfArchiveResult.reason)
        : '',
    });
  } finally {
    lock.releaseLock();
  }
}

function archiveAgreementPdf_(formType, submissionId, rowRecord, agreement) {
  const isPlayer = formType === 'mls_registration';
  const isVolunteer = formType === 'volunteer_application' || formType === 'coaching_application';
  if (!isPlayer && !isVolunteer) {
    return { ok: false, reason: 'This form type does not use an archived agreement PDF.' };
  }

  const sourcePdfUrl = normalizeAgreementPdfUrl_(agreement.pdfUrl);
  const sourceDriveFileId = extractDriveFileId_(sourcePdfUrl)
    || normalizeDriveFileId_(agreement.fileId);
  const hasSignedPdfUrl = isAllowedAgreementPdfUrl_(sourcePdfUrl);
  if (!sourceDriveFileId && !hasSignedPdfUrl) {
    return {
      ok: false,
      reason: 'No usable agreement PDF URL or Google Drive file ID was provided.',
    };
  }

  const folderId = isPlayer
    ? AGREEMENT_ARCHIVE_FOLDERS.PLAYER
    : AGREEMENT_ARCHIVE_FOLDERS.VOLUNTEER;
  const folder = DriveApp.getFolderById(folderId);
  const fileName = buildAgreementArchiveFileName_(
    formType,
    submissionId,
    rowRecord,
    agreement.transactionId,
    agreement.signedAt
  );

  const existingFiles = folder.getFilesByName(fileName);
  if (existingFiles.hasNext()) {
    const existingFile = existingFiles.next();
    return {
      ok: true,
      reused: true,
      fileId: existingFile.getId(),
      url: existingFile.getUrl(),
      name: existingFile.getName(),
      folderId,
    };
  }

  const sourceBlob = getAgreementPdfBlob_(sourcePdfUrl, sourceDriveFileId);
  sourceBlob.setName(fileName);
  const archivedFile = folder.createFile(sourceBlob);
  return {
    ok: true,
    reused: false,
    fileId: archivedFile.getId(),
    url: archivedFile.getUrl(),
    name: archivedFile.getName(),
    folderId,
  };
}

function archivePpfLiabilityPdf_(submissionId, rowRecord, context) {
  const folderId = AGREEMENT_ARCHIVE_FOLDERS.PPF;
  const folder = DriveApp.getFolderById(folderId);
  const fileName = buildPpfLiabilityArchiveFileName_(submissionId, rowRecord, context);

  const existingFiles = folder.getFilesByName(fileName);
  if (existingFiles.hasNext()) {
    const existingFile = existingFiles.next();
    return {
      ok: true,
      reused: true,
      fileId: existingFile.getId(),
      url: existingFile.getUrl(),
      name: existingFile.getName(),
      folderId,
    };
  }

  const sourceBlob = renderPpfLiabilityPdfBlob_(submissionId, rowRecord, context);
  sourceBlob.setName(fileName);
  const archivedFile = folder.createFile(sourceBlob);
  return {
    ok: true,
    reused: false,
    fileId: archivedFile.getId(),
    url: archivedFile.getUrl(),
    name: archivedFile.getName(),
    folderId,
  };
}

function renderPpfLiabilityPdfBlob_(submissionId, rowRecord, context) {
  const updateToken = normalizeValue_(
    PropertiesService.getScriptProperties().getProperty('AGREEMENT_UPDATE_TOKEN')
  );
  if (!updateToken) {
    throw new Error('Missing Script Property: AGREEMENT_UPDATE_TOKEN');
  }

  const parentName = [
    getRecordValueByHeader_(rowRecord, 'parent_first_name'),
    getRecordValueByHeader_(rowRecord, 'parent_last_name'),
  ].filter(Boolean).join(' ');
  const participants = buildPpfParticipantRecords_(rowRecord);
  if (!participants.length) {
    throw new Error('No participants were found for the PPF liability PDF.');
  }

  const response = UrlFetchApp.fetch(PPF_LIABILITY_RENDER_URL, {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: {
      Accept: 'application/pdf',
      Authorization: 'Bearer ' + updateToken,
    },
    payload: JSON.stringify({
      submissionId: submissionId,
      parentName: parentName || 'Parent/Guardian',
      signingDate: formatPpfSigningDate_(context && context.signedAt),
      participants: participants,
    }),
  });

  const responseCode = response.getResponseCode();
  if (responseCode < 200 || responseCode >= 300) {
    throw new Error('PPF PDF render returned HTTP ' + responseCode + ': ' + response.getContentText());
  }

  const blob = response.getBlob();
  const bytes = blob.getBytes();
  const isPdf = bytes.length >= 5
    && bytes[0] === 37
    && bytes[1] === 80
    && bytes[2] === 68
    && bytes[3] === 70
    && bytes[4] === 45;
  if (!isPdf) {
    throw new Error('The PPF liability renderer did not return a valid PDF file.');
  }
  blob.setContentType('application/pdf');
  return blob;
}

function buildPpfParticipantRecords_(rowRecord) {
  const participants = [];
  for (var index = 1; index <= 4; index += 1) {
    const firstName = getRecordValueByHeader_(rowRecord, 'player_' + index + '_first_name');
    const lastName = getRecordValueByHeader_(rowRecord, 'player_' + index + '_last_name');
    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    if (!fullName) continue;
    participants.push({
      name: fullName,
      grade: formatPpfParticipantDivisionLabel_(
        getRecordValueByHeader_(rowRecord, 'player_' + index + '_grade'),
        getRecordValueByHeader_(rowRecord, 'player_' + index + '_gender')
      ),
    });
  }
  return participants;
}

function formatPpfParticipantDivisionLabel_(grade, gender) {
  const normalizedGrade = normalizeValue_(grade);
  const normalizedGender = normalizeValue_(gender);
  if (!normalizedGrade) return normalizedGender;
  if (/\b(Boys|Girls)\b/i.test(normalizedGrade)) return normalizedGrade;
  if (/^(Male|Boy|Boys)$/i.test(normalizedGender)) return normalizedGrade + ' Boys';
  if (/^(Female|Girl|Girls)$/i.test(normalizedGender)) return normalizedGrade + ' Girls';
  return normalizedGrade;
}

function formatPpfSigningDate_(value) {
  const normalized = normalizeValue_(value);
  const date = normalized ? new Date(normalized) : new Date();
  const safeDate = isNaN(date.getTime()) ? new Date() : date;
  return Utilities.formatDate(safeDate, Session.getScriptTimeZone(), 'MM/dd/yyyy');
}

function getAgreementPdfBlob_(pdfUrl, driveFileId) {
  if (isAllowedAgreementPdfUrl_(pdfUrl)) {
    try {
      return fetchPdfBlobFromUrl_(pdfUrl);
    } catch (urlError) {
      if (!driveFileId) throw urlError;
    }
  }

  if (driveFileId) {
    const sourceFile = DriveApp.getFileById(driveFileId);
    return sourceFile.getMimeType() === 'application/pdf'
      ? sourceFile.getBlob()
      : sourceFile.getAs(MimeType.PDF);
  }

  throw new Error('No usable agreement PDF source was found.');
}

function fetchPdfBlobFromUrl_(pdfUrl) {
  const response = UrlFetchApp.fetch(pdfUrl, {
    method: 'get',
    followRedirects: true,
    muteHttpExceptions: true,
    headers: { Accept: 'application/pdf' },
  });
  const responseCode = response.getResponseCode();
  if (responseCode < 200 || responseCode >= 300) {
    throw new Error('Agreement PDF download returned HTTP ' + responseCode + '.');
  }
  const blob = response.getBlob();
  const bytes = blob.getBytes();
  const isPdf = bytes.length >= 5
    && bytes[0] === 37
    && bytes[1] === 80
    && bytes[2] === 68
    && bytes[3] === 70
    && bytes[4] === 45;
  if (!isPdf) {
    throw new Error('The agreement URL did not return a valid PDF file.');
  }
  blob.setContentType('application/pdf');
  return blob;
}

function normalizeAgreementPdfUrl_(value) {
  const normalized = normalizeValue_(value);
  if (!normalized) return '';
  if (/^https:\/\//i.test(normalized)) return normalized;

  const relative = normalized.replace(/^\/+/, '');
  if (/^(?:player|volunteer)-agreements\//i.test(relative)) {
    return 'https://mlsregistration.lifeprepacademyfoundation.com/' + relative;
  }
  return normalized;
}

function isAllowedAgreementPdfUrl_(value) {
  return /^https:\/\/mlsregistration\.lifeprepacademyfoundation\.com\/(?:api\/signer\/agreement\/[a-z0-9-]+|(?:player|volunteer)-agreements\/[a-z0-9_\-./]+\.pdf)(?:\?|$)/i
    .test(normalizeAgreementPdfUrl_(value));
}

function buildAgreementArchiveFileName_(formType, submissionId, rowRecord, transactionId, signedAt) {
  const isPlayer = formType === 'mls_registration';
  const personName = isPlayer
    ? [
        getRecordValueByHeader_(rowRecord, 'parent_first_name'),
        getRecordValueByHeader_(rowRecord, 'parent_last_name'),
      ].filter(Boolean).join(' ')
    : [
        getRecordValueByHeader_(rowRecord, 'firstName'),
        getRecordValueByHeader_(rowRecord, 'lastName'),
      ].filter(Boolean).join(' ');
  const agreementLabel = isPlayer ? 'Player_Agreement' : 'Volunteer_Agreement';
  const uniquePart = normalizeValue_(transactionId)
    || normalizeValue_(submissionId)
    || normalizeValue_(signedAt)
    || 'Signed';
  return [
    safeDriveFilePart_(personName || 'Registrant'),
    agreementLabel,
    safeDriveFilePart_(uniquePart),
  ].join('_') + '.pdf';
}

function buildPpfLiabilityArchiveFileName_(submissionId, rowRecord, context) {
  const personName = [
    getRecordValueByHeader_(rowRecord, 'parent_first_name'),
    getRecordValueByHeader_(rowRecord, 'parent_last_name'),
  ].filter(Boolean).join(' ');
  const uniquePart = normalizeValue_(context && context.transactionId)
    || normalizeValue_(submissionId)
    || normalizeValue_(context && context.signedAt)
    || 'Accepted';
  return [
    safeDriveFilePart_(personName || 'Registrant'),
    'PPF_Liability',
    safeDriveFilePart_(uniquePart),
  ].join('_') + '.pdf';
}

function extractDriveFileId_(value) {
  const normalized = normalizeValue_(value);
  if (!/^https:\/\/(?:drive|docs)\.google\.com\//i.test(normalized)) return '';
  const pathMatch = normalized.match(/\/d\/([-\w]{25,})/);
  if (pathMatch) return pathMatch[1];
  const queryMatch = normalized.match(/[?&]id=([-\w]{25,})/);
  return queryMatch ? queryMatch[1] : '';
}

function normalizeDriveFileId_(value) {
  const normalized = normalizeValue_(value);
  return /^[-\w]{25,}$/.test(normalized) ? normalized : '';
}

function safeDriveFilePart_(value) {
  const cleaned = normalizeValue_(value)
    .replace(/[\\/:*?"<>|#%{}~&]/g, '-')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_\-.]+|[_\-.]+$/g, '');
  return cleaned.substring(0, 80) || 'Record';
}

/**
 * Read-only setup check. Run this after authorizing the script to confirm that
 * the executing account can access every configured agreement archive folder.
 */
function ARCHIVE_verifyAgreementFolders() {
  const result = {};
  Object.keys(AGREEMENT_ARCHIVE_FOLDERS).forEach(function(key) {
    const folder = DriveApp.getFolderById(AGREEMENT_ARCHIVE_FOLDERS[key]);
    result[key.toLowerCase()] = {
      id: folder.getId(),
      name: folder.getName(),
      url: folder.getUrl(),
    };
  });
  console.log(JSON.stringify(result, null, 2));
  return result;
}

/**
 * One-time/backfill utility for agreements already recorded in the spreadsheet.
 * Safe to rerun: an existing target filename is reused instead of duplicated.
 */
function ARCHIVE_existingAgreementPdfs() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const targets = [
      { formType: 'mls_registration', config: FORM_CONFIG.mls_registration },
      { formType: 'volunteer_application', config: FORM_CONFIG.volunteer_application },
      { formType: 'coaching_application', config: FORM_CONFIG.coaching_application },
    ];
    const result = { archived: 0, reused: 0, skipped: 0, failed: [], ppfArchived: 0, ppfReused: 0 };

    targets.forEach(function(target) {
      const sheet = getSheet_(target.config.sheetName);
      const columns = target.formType === 'mls_registration'
        ? PLAYER_AGREEMENT_COLUMNS
        : VOLUNTEER_AGREEMENT_COLUMNS;
      const actualHeaders = ensureHeadersByName_(
        sheet,
        getAgreementArchiveRequiredHeaders_(target.formType, target.config.idColumn, columns)
      );
      const index = buildHeaderIndexByName_(actualHeaders);
      const ppfHeaders = target.formType === 'mls_registration'
        ? ensureHeadersByName_(sheet, PPF_LIABILITY_COLUMNS)
        : null;
      const ppfIndex = ppfHeaders ? buildHeaderIndexByName_(ppfHeaders) : null;

      for (let rowNumber = 2; rowNumber <= sheet.getLastRow(); rowNumber += 1) {
        const record = readSheetRowRecordByHeader_(sheet, actualHeaders, rowNumber);
        const fileId = getRecordValueByHeader_(record, columns[4]);
        const pdfUrl = getRecordValueByHeader_(record, columns[5]);
        if (!fileId && !pdfUrl) {
          result.skipped += 1;
          continue;
        }

        try {
          const submissionId = getRecordValueByHeader_(record, target.config.idColumn);
          const archived = archiveAgreementPdf_(target.formType, submissionId, record, {
            fileId,
            pdfUrl,
            signedAt: getRecordValueByHeader_(record, columns[2]),
            transactionId: getRecordValueByHeader_(record, columns[7]),
          });
          if (!archived.ok) {
            result.skipped += 1;
            continue;
          }
          sheet.getRange(rowNumber, getHeaderColumnByName_(index, columns[4])).setValue(archived.fileId);
          sheet.getRange(rowNumber, getHeaderColumnByName_(index, columns[5])).setValue(archived.url);
          if (archived.reused) result.reused += 1;
          else result.archived += 1;

          if (target.formType === 'mls_registration' && ppfIndex) {
            const ppfArchived = archivePpfLiabilityPdf_(submissionId, record, {
              signedAt: getRecordValueByHeader_(record, columns[2]),
              transactionId: getRecordValueByHeader_(record, columns[7]),
            });
            if (ppfArchived.ok) {
              sheet.getRange(rowNumber, getHeaderColumnByName_(ppfIndex, PPF_LIABILITY_COLUMNS[0])).setValue(ppfArchived.fileId);
              sheet.getRange(rowNumber, getHeaderColumnByName_(ppfIndex, PPF_LIABILITY_COLUMNS[1])).setValue(ppfArchived.url);
              if (ppfArchived.reused) result.ppfReused += 1;
              else result.ppfArchived += 1;
            }
          }
        } catch (error) {
          result.failed.push({
            sheet: target.config.sheetName,
            row: rowNumber,
            error: String(error && error.message ? error.message : error),
          });
        }
      }
    });

    console.log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    lock.releaseLock();
  }
}

function handleVolunteerCoachConfirmationEmail_(values) {
  const expected = PropertiesService.getScriptProperties().getProperty('AGREEMENT_UPDATE_TOKEN') || '';
  const provided = normalizeValue_(values.update_token || values.token || values.agreement_update_token);
  if (!expected || provided !== expected) {
    return json_({ ok: false, error: 'Unauthorized update token' }, 403);
  }

  const formType = normalizeValue_(values.form_type);
  if (formType !== 'volunteer_application' && formType !== 'coaching_application') {
    return json_({ ok: false, error: 'Unsupported form_type' }, 400);
  }

  const config = getFormConfig_(formType, true);
  if (!config) return json_({ ok: false, error: 'Unknown form_type' }, 400);

  const submissionId = normalizeValue_(values.submission_id || values.registration_submission_id || values.submissionId);
  if (!submissionId) return json_({ ok: false, error: 'Missing submission_id' }, 400);

  const sheet = getSheet_(config.sheetName);
  ensureHeaders_(sheet, config.headers);
  const row = findRowBySubmissionId_(sheet, config.headers, config.idColumn, submissionId);
  if (row <= 0) {
    return json_({ ok: false, error: 'Matching row not found' }, 404);
  }

  try {
    const rowRecord = readSheetRowRecord_(sheet, config.headers, row);
    sendVolunteerCoachConfirmationEmail_(formType, rowRecord);
    return json_({ ok: true, emailed: true, row });
  } catch (error) {
    writeError_(formType, 'Volunteer/Coach confirmation email failed', {
      submission_id: submissionId,
      row,
      error: String(error && error.message ? error.message : error),
    });
    return json_({ ok: false, error: String(error && error.message ? error.message : error) }, 500);
  }
}

function handleScholarshipApplicationEmail_(values) {
  const expected = PropertiesService.getScriptProperties().getProperty('AGREEMENT_UPDATE_TOKEN') || '';
  const provided = normalizeValue_(values.update_token || values.token || values.agreement_update_token);
  if (!expected || provided !== expected) {
    return json_({ ok: false, error: 'Unauthorized update token' }, 403);
  }

  const parentEmail = normalizeValue_(values.parent_email || values.email).toLowerCase();
  if (!parentEmail || !isValidEmail_(parentEmail)) {
    return json_({ ok: false, error: 'Invalid parent_email' }, 400);
  }

  const payload = {
    registrationSubmissionId: normalizeValue_(values.registration_submission_id || values.submission_id || values.registrationSubmissionId || values.submissionId),
    parentEmail,
    parentName: normalizeValue_(values.parent_name),
    participantNames: normalizeValue_(values.participant_names),
    submittedAt: normalizeValue_(values.submitted_at),
    requested: normalizeValue_(values.scholarship_requested || values.requested) || 'Yes',
  };

  try {
    sendScholarshipApplicationEmailByTemplate_(payload);
    return json_({ ok: true, emailed: true });
  } catch (error) {
    writeError_('mls_registration', 'Scholarship notification email failed', {
      parent_email: parentEmail,
      error: String(error && error.message ? error.message : error),
    });
    return json_({ ok: false, error: String(error && error.message ? error.message : error) }, 500);
  }
}

function handleFlowConfirmationEmail_(values) {
  const expected = PropertiesService.getScriptProperties().getProperty('AGREEMENT_UPDATE_TOKEN') || '';
  const provided = normalizeValue_(values.update_token || values.token || values.agreement_update_token);
  if (!expected || provided !== expected) {
    return json_({ ok: false, error: 'Unauthorized update token' }, 403);
  }

  const submissionId = normalizeValue_(values.submission_id || values.registration_submission_id || values.volunteer_submission_id || values.coaching_submission_id);
  const recipientEmail = normalizeValue_(values.recipient_email || values.parent_email || values.email).toLowerCase();
  const emailType = normalizeValue_(values.email_type);
  if (!submissionId || !recipientEmail || !emailType || !isValidEmail_(recipientEmail)) {
    return json_({ ok: false, error: 'Missing submission_id, recipient_email, or email_type' }, 400);
  }

  try {
    const payload = {
      submissionId: submissionId,
      registrationSubmissionId: normalizeValue_(values.registration_submission_id),
      volunteerSubmissionId: normalizeValue_(values.volunteer_submission_id),
      coachingSubmissionId: normalizeValue_(values.coaching_submission_id),
      emailType: emailType,
      recipientEmail: recipientEmail,
      applicantFirstName: normalizeValue_(values.applicant_first_name),
      applicantLastName: normalizeValue_(values.applicant_last_name),
      participantNames: normalizeValue_(values.participant_names),
      scholarshipRequested: normalizeValue_(values.scholarship_requested),
      paymentRequired: normalizeValue_(values.payment_required).toLowerCase() === 'yes',
      paymentUrl: normalizeValue_(values.payment_url),
      paymentAmount: normalizeValue_(values.payment_amount) || '75',
      sourceUrl: normalizeValue_(values.source_url),
      formsRecorded: parseJsonArrayOfStrings_(values.forms_recorded_json),
      agreementsRecorded: parseJsonArrayOfStrings_(values.agreements_recorded_json),
      signedDocumentUrls: parseJsonLinkArray_(values.signed_document_urls_json),
    };

    const result = sendFlowConfirmationEmail_(payload);
    return json_({ ok: true, sent: result.sent, duplicate: result.duplicate, tracking_id: result.trackingId || '' });
  } catch (error) {
    writeError_('flow_confirmation_email', 'Final flow confirmation email failed', {
      submission_id: submissionId,
      recipient_email: recipientEmail,
      email_type: emailType,
      error: String(error && error.message ? error.message : error),
    });
    return json_({ ok: false, error: String(error && error.message ? error.message : error) }, 500);
  }
}

function sendScholarshipApplicationEmailByTemplate_(payload) {
  const email = normalizeValue_(payload.parentEmail).toLowerCase();
  const subject = 'Financial Hardship Scholarship Application Received';
  const body = 'Thank you for submitting a Financial Hardship Scholarship application for LifePrep Academy Foundation\'s MLS GO youth program. We have successfully received your application. Please monitor your inbox for important information and next steps from our team.';

  sendBrandedEmail_({
    to: email,
    subject,
    body,
    htmlBody: buildBrandedSubmissionEmailHtml_({
      title: 'Financial Hardship Scholarship Application Received',
      greeting: 'Thank you for submitting a Financial Hardship Scholarship application for LifePrep Academy Foundation\'s MLS GO youth program.',
      message: 'We have successfully received your application. Please monitor your inbox for important information and next steps from our team.',
    }),
    name: DEFAULT_EMAIL_SENDER_NAME,
    replyTo: EMAIL_REPLY_TO,
  });
}

function handleRegistrationPaidEmail_(values) {
  const expected = PropertiesService.getScriptProperties().getProperty('AGREEMENT_UPDATE_TOKEN') || '';
  const provided = normalizeValue_(values.update_token || values.token || values.agreement_update_token);
  if (!expected || provided !== expected) {
    return json_({ ok: false, error: 'Unauthorized update token' }, 403);
  }

  const parentEmail = normalizeValue_(values.parent_email).toLowerCase();
  if (!parentEmail || !isValidEmail_(parentEmail)) {
    return json_({ ok: false, error: 'Invalid parent_email' }, 400);
  }

  const payload = {
    registrationSubmissionId: normalizeValue_(values.registration_submission_id || values.submission_id || values.registrationSubmissionId || values.submissionId),
    parentEmail,
    parentName: normalizeValue_(values.parent_name),
    participantNames: normalizeValue_(values.participant_names),
    relationshipToChild: normalizeValue_(values.relationship_to_child),
    primaryPhone: normalizeValue_(values.primary_phone),
    alternatePhone: normalizeValue_(values.alternate_phone),
    emergencyContactName: normalizeValue_(values.emergency_contact_name),
    emergencyRelationship: normalizeValue_(values.emergency_relationship),
    emergencyEmail: normalizeValue_(values.emergency_email),
    emergencyPhone: normalizeValue_(values.emergency_phone),
    emergencyStreet: normalizeValue_(values.emergency_street),
    emergencyCity: normalizeValue_(values.emergency_city),
    emergencyState: normalizeValue_(values.emergency_state),
    emergencyZip: normalizeValue_(values.emergency_zip),
    signedAt: normalizeValue_(values.signed_at),
    signedDocumentUrl: normalizeValue_(values.signed_document_url),
    paymentUrl: normalizeValue_(values.payment_url),
    paymentReceiptUrl: normalizeValue_(values.payment_receipt_url),
    paymentPaidAt: normalizeValue_(values.payment_paid_at),
    registrationFeeAmount: normalizeValue_(values.registration_fee_amount) || '75',
  };

  const parsedFormValues = parseRegistrationFormValues_(values);
  if (parsedFormValues.length) {
    payload.formValues = parsedFormValues;
  }

  if (payload.registrationSubmissionId) {
    try {
      const registrationSheet = getSheet_(SHEET_NAMES.PLAYERS);
      ensureHeaders_(registrationSheet, PLAYER_HEADERS);
      const registrationRow = findRowBySubmissionId_(
        registrationSheet,
        PLAYER_HEADERS,
        'registration_submission_id',
        payload.registrationSubmissionId,
      );
      if (registrationRow > 0) {
        const rowRecord = readSheetRowRecord_(registrationSheet, PLAYER_HEADERS, registrationRow);
        payload.allResponseRows = buildResponseRowsFromRecord_(rowRecord, PLAYER_HEADERS, {
          exclude: {
            form_type: true,
            page_url: true,
            signature: true,
          },
        });

        payload.parentName = payload.parentName || [rowRecord.parent_first_name, rowRecord.parent_last_name].filter(Boolean).join(' ').trim();
        payload.parentEmail = payload.parentEmail || normalizeValue_(rowRecord.parent_email).toLowerCase();
        payload.primaryPhone = payload.primaryPhone || rowRecord.parent_phone;
        payload.emergencyContactName = payload.emergencyContactName || [rowRecord.emergency_first_name, rowRecord.emergency_last_name].filter(Boolean).join(' ').trim();
        payload.emergencyRelationship = payload.emergencyRelationship || rowRecord.emergency_relationship;
        payload.emergencyEmail = payload.emergencyEmail || rowRecord.emergency_email;
        payload.emergencyPhone = payload.emergencyPhone || rowRecord.emergency_phone;
        payload.emergencyStreet = payload.emergencyStreet || rowRecord.emergency_street;
        payload.emergencyCity = payload.emergencyCity || rowRecord.emergency_city;
        payload.emergencyState = payload.emergencyState || rowRecord.emergency_state;
        payload.emergencyZip = payload.emergencyZip || rowRecord.emergency_zip;

        if (!payload.participantNames) {
          const playerNames = [];
          for (var i = 1; i <= 4; i += 1) {
            const first = normalizeValue_(rowRecord['player_' + i + '_first_name']);
            const last = normalizeValue_(rowRecord['player_' + i + '_last_name']);
            const full = (first + ' ' + last).trim();
            if (full) playerNames.push(full);
          }
          payload.participantNames = playerNames.join(', ');
        }
      }
    } catch (lookupError) {
      writeError_('mls_registration', 'Registration email row lookup failed', {
        registration_submission_id: payload.registrationSubmissionId,
        error: String(lookupError && lookupError.message ? lookupError.message : lookupError),
      });
    }
  }

  try {
    sendRegistrationEmailByStage_(payload, Boolean(payload.paymentPaidAt || payload.paymentReceiptUrl));
    return json_({ ok: true, emailed: true });
  } catch (error) {
    writeError_('mls_registration', 'Registration receipt email failed', {
      parent_email: parentEmail,
      error: String(error && error.message ? error.message : error),
    });
    return json_({ ok: false, error: String(error && error.message ? error.message : error) }, 500);
  }
}

function handleRegistrationReceiptEmail_(values) {
  return handleRegistrationPaidEmail_(values);
}

function handlePaymentMetadataUpdate_(values) {
  const expected = PropertiesService.getScriptProperties().getProperty('AGREEMENT_UPDATE_TOKEN') || '';
  const provided = normalizeValue_(values.update_token || values.token || values.agreement_update_token);
  if (!expected || provided !== expected) {
    return json_({ ok: false, error: 'Unauthorized update token' }, 403);
  }

  const formType = normalizeValue_(values.form_type);
  const config = getFormConfig_(formType, true);
  if (!config || formType !== 'mls_registration') {
    return json_({ ok: false, error: 'Unsupported form_type' }, 400);
  }

  const submissionId = normalizeValue_(values.submission_id);
  if (!submissionId) return json_({ ok: false, error: 'Missing submission_id' }, 400);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getSheet_(config.sheetName);
    ensureHeaders_(sheet, config.headers);

    const row = findRowBySubmissionId_(sheet, config.headers, config.idColumn, submissionId);
    if (row <= 0) {
      return json_({ ok: false, error: 'Matching row not found' }, 404);
    }

    const headerIndex = buildHeaderIndex_(config.headers);
    const paymentValues = {
      [PLAYER_PAYMENT_COLUMNS[0]]: normalizeValue_(values.payment_status),
      [PLAYER_PAYMENT_COLUMNS[1]]: normalizeValue_(values.payment_amount),
      [PLAYER_PAYMENT_COLUMNS[2]]: normalizeValue_(values.payment_currency),
      [PLAYER_PAYMENT_COLUMNS[3]]: normalizeValue_(values.payment_paid_at),
      [PLAYER_PAYMENT_COLUMNS[4]]: normalizeValue_(values.payment_transaction_id),
      [PLAYER_PAYMENT_COLUMNS[5]]: normalizeValue_(values.payment_receipt_url),
    };

    Object.keys(paymentValues).forEach((header) => {
      const col = headerIndex[header];
      if (!col) return;
      sheet.getRange(row, col).setValue(formatSheetValue_(header, paymentValues[header]));
    });

    return json_({ ok: true, updated: true, row });
  } finally {
    lock.releaseLock();
  }
}

function handleRegistrationContextLookup_(values) {
  const expected = PropertiesService.getScriptProperties().getProperty('AGREEMENT_UPDATE_TOKEN') || '';
  const provided = normalizeValue_(values.update_token || values.token || values.agreement_update_token);
  if (!expected || provided !== expected) {
    return json_({ ok: false, error: 'Unauthorized update token' }, 403);
  }

  const formType = normalizeValue_(values.form_type);
  const config = getFormConfig_(formType, true);
  if (!config || formType !== 'mls_registration') {
    return json_({ ok: false, error: 'Unsupported form_type' }, 400);
  }

  const submissionId = normalizeValue_(values.submission_id);
  if (!submissionId) return json_({ ok: false, error: 'Missing submission_id' }, 400);

  const sheet = getSheet_(config.sheetName);
  ensureHeaders_(sheet, config.headers);
  const row = findRowBySubmissionId_(sheet, config.headers, config.idColumn, submissionId);
  if (row <= 0) {
    return json_({ ok: false, error: 'Matching row not found' }, 404);
  }

  const headerIndex = buildHeaderIndex_(config.headers);
  const getValue = (header) => {
    const col = headerIndex[header];
    if (!col) return '';
    return normalizeValue_(sheet.getRange(row, col).getValue());
  };

  const playerNames = [];
  for (let i = 1; i <= 4; i += 1) {
    const first = getValue(`player_${i}_first_name`);
    const last = getValue(`player_${i}_last_name`);
    const full = `${first} ${last}`.trim();
    if (full) playerNames.push(full);
  }

  return json_({
    ok: true,
    submissionId: submissionId,
    parentEmail: getValue('parent_email'),
    parentName: `${getValue('parent_first_name')} ${getValue('parent_last_name')}`.trim(),
    participantNames: playerNames.join(', '),
    transactionId: getValue('Player Agreement Transaction ID'),
    signedAt: getValue('Player Agreement Signed At'),
    paymentStatus: getValue('Player Payment Status'),
    paymentTransactionId: getValue('Player Payment Transaction ID'),
  });
}

function handlePaymentReceiptLookup_(values) {
  const expected = PropertiesService.getScriptProperties().getProperty('AGREEMENT_UPDATE_TOKEN') || '';
  const provided = normalizeValue_(values.update_token || values.token || values.agreement_update_token);
  if (!expected || provided !== expected) {
    return json_({ ok: false, error: 'Unauthorized update token' }, 403);
  }

  const parentEmail = normalizeValue_(values.parent_email).toLowerCase();
  if (!parentEmail || !isValidEmail_(parentEmail)) {
    return json_({ ok: false, error: 'Invalid parent_email' }, 400);
  }

  const sheet = getSheet_(SHEET_NAMES.PLAYERS);
  ensureHeaders_(sheet, PLAYER_HEADERS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return json_({ ok: false, error: 'No registrations found' }, 404);
  }

  const amount = normalizeMoneyValue_(values.payment_amount);
  const playerCount = Number(normalizeValue_(values.player_count) || 0);
  const paidAtMs = parseDateMs_(values.payment_paid_at);
  const desiredName = normalizeComparisonValue_(values.parent_name);
  const desiredTransactionId = normalizeComparisonValue_(values.payment_transaction_id);
  const rows = sheet.getRange(2, 1, lastRow - 1, PLAYER_HEADERS.length).getValues();
  const candidates = [];

  rows.forEach(function(rowValues, index) {
    const record = {};
    PLAYER_HEADERS.forEach(function(header, columnIndex) {
      record[header] = normalizeValue_(rowValues[columnIndex]);
    });

    if (normalizeComparisonValue_(record.parent_email) !== normalizeComparisonValue_(parentEmail)) {
      return;
    }

    const score = scorePaymentReceiptCandidate_(record, {
      parentName: desiredName,
      paymentAmount: amount,
      playerCount: playerCount,
      paidAtMs: paidAtMs,
      paymentTransactionId: desiredTransactionId,
    });
    if (score < 0) return;

    candidates.push({
      row: index + 2,
      score: score,
      submittedAtMs: parseDateMs_(record.submitted_at),
      record: record,
    });
  });

  candidates.sort(function(a, b) {
    if (b.score !== a.score) return b.score - a.score;
    if (b.submittedAtMs !== a.submittedAtMs) return b.submittedAtMs - a.submittedAtMs;
    return a.row - b.row;
  });

  if (!candidates.length) {
    return json_({ ok: false, error: 'No matching registration row found for receipt email' }, 404);
  }

  if (candidates.length > 1 && candidates[0].score === candidates[1].score) {
    return json_({ ok: false, error: 'Multiple matching registration rows found for receipt email' }, 409);
  }

  const winner = candidates[0].record;
  const participantNames = [];
  for (var i = 1; i <= 4; i += 1) {
    const first = normalizeValue_(winner['player_' + i + '_first_name']);
    const last = normalizeValue_(winner['player_' + i + '_last_name']);
    const full = (first + ' ' + last).trim();
    if (full) participantNames.push(full);
  }

  return json_({
    ok: true,
    submissionId: normalizeValue_(winner.registration_submission_id),
    parentEmail: normalizeValue_(winner.parent_email),
    parentName: `${normalizeValue_(winner.parent_first_name)} ${normalizeValue_(winner.parent_last_name)}`.trim(),
    participantNames: participantNames.join(', '),
    transactionId: normalizeValue_(winner['Player Agreement Transaction ID']),
    signedAt: normalizeValue_(winner['Player Agreement Signed At']),
    paymentStatus: normalizeValue_(winner['Player Payment Status']),
    paymentTransactionId: normalizeValue_(winner['Player Payment Transaction ID']),
    row: candidates[0].row,
  });
}

function initializeSheets() {
  const playersSheet = getSheet_(SHEET_NAMES.PLAYERS);
  ensureHeaders_(playersSheet, PLAYER_HEADERS);
  ensurePlayerIdentityHeaders_(playersSheet);
  ensureHeadersByName_(getSheet_(SHEET_NAMES.SCHOLARSHIPS), SCHOLARSHIP_HEADERS);
  ensureHeaders_(getSheet_(SHEET_NAMES.VOLUNTEERS), VOLUNTEER_HEADERS);
  ensureHeaders_(getSheet_(SHEET_NAMES.COACHES), COACH_HEADERS);
  ensureHeaders_(getSheet_(SHEET_NAMES.ERRORS), ERROR_HEADERS);
  ensureHeaders_(getSheet_(EMAIL_TRACKING_SHEET_NAME), EMAIL_TRACKING_HEADERS);
}

/**
 * Run once after installing this version to assign IDs to registrations that
 * were already in the Players sheet. It is safe to run again: existing player
 * IDs are preserved and division IDs are refreshed from grade and gender.
 */
function MLS_GO_assignPlayerAndDivisionIds() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getSheet_(SHEET_NAMES.PLAYERS);
    ensureHeaders_(sheet, PLAYER_HEADERS);
    ensurePlayerIdentityHeaders_(sheet);

    const result = { rowsChecked: 0, playersAssigned: 0, rows: [] };
    for (let rowNumber = 2; rowNumber <= sheet.getLastRow(); rowNumber += 1) {
      const players = assignPlayerIdentityForRow_(sheet, rowNumber);
      result.rowsChecked += 1;
      result.playersAssigned += players.length;
      if (players.length) result.rows.push({ row: rowNumber, players: players });
    }
    console.log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    lock.releaseLock();
  }
}

function ensurePlayerIdentityHeaders_(sheet) {
  const width = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, width).getValues()[0].map(String);
  const existing = buildHeaderIndex_(headers);
  const missing = PLAYER_IDENTITY_COLUMNS.filter(function(header) {
    return !existing[header];
  });
  if (!missing.length) return;

  const startColumn = sheet.getLastColumn() + 1;
  sheet.getRange(1, startColumn, 1, missing.length)
    .setValues([missing])
    .setFontWeight('bold')
    .setBackground('#d9eaf7');
}

function assignPlayerIdentityForRow_(sheet, rowNumber) {
  const lastColumn = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  const index = buildHeaderIndex_(headers);
  const row = sheet.getRange(rowNumber, 1, 1, lastColumn).getValues()[0];
  const assigned = [];

  for (let playerNumber = 1; playerNumber <= 4; playerNumber += 1) {
    const prefix = 'player_' + playerNumber + '_';
    const firstName = valueAtHeader_(row, index, prefix + 'first_name');
    const lastName = valueAtHeader_(row, index, prefix + 'last_name');
    const dob = valueAtHeader_(row, index, prefix + 'dob');
    const gender = valueAtHeader_(row, index, prefix + 'gender');
    const grade = valueAtHeader_(row, index, prefix + 'grade');
    const playerIdColumn = index[prefix + 'id'];
    const divisionIdColumn = index[prefix + 'division_id'];
    const hasPlayer = Boolean(firstName || lastName || dob);

    if (!playerIdColumn || !divisionIdColumn) continue;
    if (!hasPlayer) {
      sheet.getRange(rowNumber, playerIdColumn).clearContent();
      sheet.getRange(rowNumber, divisionIdColumn).clearContent();
      continue;
    }

    let playerId = normalizeValue_(row[playerIdColumn - 1]);
    if (!playerId) {
      playerId = createPlayerId_();
      sheet.getRange(rowNumber, playerIdColumn).setValue(playerId);
    }

    const divisionId = getDivisionId_(grade, gender);
    if (divisionId !== normalizeValue_(row[divisionIdColumn - 1])) {
      sheet.getRange(rowNumber, divisionIdColumn).setValue(divisionId);
    }

    assigned.push({
      playerNumber: playerNumber,
      playerId: playerId,
      divisionId: divisionId,
      name: (firstName + ' ' + lastName).trim(),
      grade: grade,
      gender: gender,
    });
  }

  return assigned;
}

function valueAtHeader_(row, index, header) {
  const column = index[header];
  return column ? normalizeValue_(row[column - 1]) : '';
}

function createPlayerId_() {
  return 'PGS-' + Utilities.getUuid().replace(/-/g, '').toUpperCase();
}

function getDivisionId_(grade, gender) {
  const normalizedGrade = normalizeComparisonValue_(grade);
  const normalizedGender = normalizeComparisonValue_(gender);
  const isSecondThird = /(^|\D)(2|3)(\D|$)|2nd|3rd/.test(normalizedGrade);
  const isFourthFifth = /(^|\D)(4|5)(\D|$)|4th|5th/.test(normalizedGrade);

  // Check girls/female first because the word "female" contains "male".
  let genderGroup = '';
  if (/female|girl/.test(normalizedGender)) genderGroup = 'GIRLS';
  else if (/male|boy/.test(normalizedGender)) genderGroup = 'BOYS';

  if (isSecondThird && genderGroup === 'BOYS') return DIVISION_IDS.SECOND_THIRD_BOYS;
  if (isSecondThird && genderGroup === 'GIRLS') return DIVISION_IDS.SECOND_THIRD_GIRLS;
  if (isFourthFifth && genderGroup === 'BOYS') return DIVISION_IDS.FOURTH_FIFTH_BOYS;
  if (isFourthFifth && genderGroup === 'GIRLS') return DIVISION_IDS.FOURTH_FIFTH_GIRLS;
  return '';
}

function getFormConfig_(formType, strict) {
  if (FORM_CONFIG[formType]) return FORM_CONFIG[formType];
  if (strict) return null;
  return FORM_CONFIG.mls_registration;
}

function getSheet_(sheetName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  return ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
}

function ensureHeaders_(sheet, headers) {
  const currentWidth = Math.max(sheet.getLastColumn(), headers.length);
  const current = currentWidth > 0 ? sheet.getRange(1, 1, 1, currentWidth).getValues()[0].map(String) : [];

  let changed = false;
  headers.forEach((header, idx) => {
    if (current[idx] !== header) {
      current[idx] = header;
      changed = true;
    }
  });

  if (changed || sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  sheet.setFrozenRows(1);
}

/**
 * Returns a stable, case-insensitive key for a sheet header.
 * Spaces are normalized so moving a column never changes how it is found.
 */
function normalizeHeaderKey_(value) {
  return normalizeValue_(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

function readActualSheetHeaders_(sheet) {
  const width = Math.max(sheet.getLastColumn(), 1);
  return sheet.getRange(1, 1, 1, width).getValues()[0].map(normalizeValue_);
}

function buildHeaderIndexByName_(headers) {
  return headers.reduce(function(index, header, offset) {
    const key = normalizeHeaderKey_(header);
    if (key && !index[key]) index[key] = offset + 1;
    return index;
  }, {});
}

function getHeaderColumnByName_(headerIndex, header) {
  return headerIndex[normalizeHeaderKey_(header)] || 0;
}

/**
 * Preserves every existing column. Any genuinely missing required header is
 * appended at the right edge instead of overwriting or repositioning columns.
 */
function ensureHeadersByName_(sheet, requiredHeaders) {
  let headers = readActualSheetHeaders_(sheet);
  let index = buildHeaderIndexByName_(headers);
  const missing = requiredHeaders.filter(function(header) {
    return !getHeaderColumnByName_(index, header);
  });

  if (missing.length) {
    const startColumn = Math.max(sheet.getLastColumn(), 0) + 1;
    sheet.getRange(1, startColumn, 1, missing.length).setValues([missing]);
    headers = readActualSheetHeaders_(sheet);
    index = buildHeaderIndexByName_(headers);
  }

  sheet.setFrozenRows(1);
  return headers;
}

function findRowByHeaderValue_(sheet, headers, idHeader, idValue) {
  const index = buildHeaderIndexByName_(headers);
  const column = getHeaderColumnByName_(index, idHeader);
  if (!column) return -1;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const expected = normalizeValue_(idValue);
  const values = sheet.getRange(2, column, lastRow - 1, 1).getValues();
  for (let offset = 0; offset < values.length; offset += 1) {
    if (normalizeValue_(values[offset][0]) === expected) return offset + 2;
  }
  return -1;
}

function readSheetRowRecordByHeader_(sheet, headers, rowNumber) {
  const values = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  return headers.reduce(function(record, header, offset) {
    if (normalizeValue_(header)) record[header] = normalizeValue_(values[offset]);
    return record;
  }, {});
}

function buildRowValuesByHeader_(actualHeaders, payload, existingRecord, writableHeaders) {
  const writable = (writableHeaders || []).reduce(function(map, header) {
    map[normalizeHeaderKey_(header)] = true;
    return map;
  }, {});

  return actualHeaders.map(function(header) {
    const key = normalizeHeaderKey_(header);
    const existingValue = existingRecord ? getRecordValueByHeader_(existingRecord, header) : '';
    if (!writable[key]) return formatSheetValue_(header, existingValue);

    const incoming = lookupPayloadValue_(payload, header);
    if (incoming !== undefined && incoming !== null && normalizeValue_(incoming) !== '') {
      return formatSheetValue_(header, incoming);
    }

    return formatSheetValue_(header, existingValue);
  });
}

function getRecordValueByHeader_(record, header) {
  const expected = normalizeHeaderKey_(header);
  const keys = Object.keys(record || {});
  for (let i = 0; i < keys.length; i += 1) {
    if (normalizeHeaderKey_(keys[i]) === expected) {
      return normalizeValue_(record[keys[i]]);
    }
  }
  return '';
}

function getAgreementArchiveRequiredHeaders_(formType, idHeader, agreementColumns) {
  const nameHeaders = formType === 'mls_registration'
    ? ['parent_first_name', 'parent_last_name']
    : ['firstName', 'lastName'];
  return [idHeader].concat(nameHeaders, agreementColumns);
}

function findRowBySubmissionId_(sheet, headers, idHeader, submissionId) {
  const headerIndex = buildHeaderIndex_(headers);
  const col = headerIndex[idHeader];
  if (!col) return -1;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const values = sheet.getRange(2, col, lastRow - 1, 1).getValues();
  for (let i = 0; i < values.length; i += 1) {
    if (normalizeValue_(values[i][0]) === submissionId) {
      return i + 2;
    }
  }
  return -1;
}

function buildHeaderIndex_(headers) {
  const out = {};
  headers.forEach((h, idx) => {
    out[h] = idx + 1;
  });
  return out;
}

function applyPendingAgreementDefaults_(rowValues, headers, formType) {
  const index = buildHeaderIndex_(headers);
  const statusColumn =
    formType === 'mls_registration'
      ? index['Player Agreement Status']
      : index['Volunteer Agreement Status'];

  if (!statusColumn) return;
  const current = normalizeValue_(rowValues[statusColumn - 1]);
  if (!current) {
    rowValues[statusColumn - 1] = 'Pending Signature';
  }

  if (formType === 'mls_registration') {
    const paymentStatusColumn = index['Player Payment Status'];
    if (paymentStatusColumn) {
      const currentPayment = normalizeValue_(rowValues[paymentStatusColumn - 1]);
      if (!currentPayment) {
        rowValues[paymentStatusColumn - 1] = 'Payment Pending';
      }
    }
  }
}

function preserveSystemManagedColumns_(rowValues, headers, existingRecord, formType) {
  const index = buildHeaderIndex_(headers);
  const agreementColumns = formType === 'mls_registration' ? PLAYER_AGREEMENT_COLUMNS : VOLUNTEER_AGREEMENT_COLUMNS;
  const paymentColumns = formType === 'mls_registration' ? PLAYER_PAYMENT_COLUMNS : [];

  agreementColumns.forEach((header) => {
    const col = index[header];
    if (!col) return;
    const existingValue = normalizeValue_(existingRecord && existingRecord[header]);
    const incomingValue = normalizeValue_(rowValues[col - 1]);
    if (!incomingValue && existingValue) {
      rowValues[col - 1] = existingValue;
    }
  });

  paymentColumns.forEach((header) => {
    const col = index[header];
    if (!col) return;
    const existingValue = normalizeValue_(existingRecord && existingRecord[header]);
    const incomingValue = normalizeValue_(rowValues[col - 1]);
    if (!incomingValue && existingValue) {
      rowValues[col - 1] = existingValue;
    }
  });
}

function lookupPayloadValue_(values, header) {
  const candidates = [];
  const normalizedHeader = normalizeValue_(header);
  if (normalizedHeader) {
    candidates.push(normalizedHeader);
    candidates.push(normalizedHeader.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/\s+/g, '_').toLowerCase());
    candidates.push(normalizedHeader.replace(/\s+/g, '_').toLowerCase());
    candidates.push(normalizedHeader.replace(/_/g, '').toLowerCase());
  }

  const headerAliases = {
    firstName: ['first_name', 'volFirstName', 'vol_first_name', 'volunteerFirstName', 'volunteer_first_name'],
    lastName: ['last_name', 'volLastName', 'vol_last_name', 'volunteerLastName', 'volunteer_last_name'],
    email: ['emailAddress', 'email_address', 'volEmail', 'vol_email', 'volunteerEmail', 'volunteer_email'],
    phone: ['phoneNumber', 'phone_number', 'volPhone', 'vol_phone', 'volunteerPhone', 'volunteer_phone'],
    street: ['streetAddress', 'street_address', 'volStreet', 'vol_street', 'volunteerStreet', 'volunteer_street'],
    apt: ['apartment', 'apartmentNumber', 'apt_number', 'volApt', 'vol_apt', 'volunteerApt', 'volunteer_apt'],
    city: ['volCity', 'vol_city', 'volunteerCity', 'volunteer_city'],
    state: ['volState', 'vol_state', 'volunteerState', 'volunteer_state'],
    zip: ['volZip', 'vol_zip', 'volunteerZip', 'volunteer_zip'],
    dob: ['dateOfBirth', 'date_of_birth', 'volDob', 'vol_dob', 'volunteerDob', 'volunteer_dob'],
    roles: ['volunteerRoles', 'volunteer_roles'],
    hasExperience: ['volHasExperience', 'vol_has_experience', 'volunteerHasExperience', 'volunteer_has_experience'],
    experienceSummary: ['volExperienceSummary', 'vol_experience_summary', 'volunteerExperienceSummary', 'volunteer_experience_summary'],
    availabilityNotes: ['volAvailabilityNotes', 'vol_availability_notes', 'volunteerAvailabilityNotes', 'volunteer_availability_notes'],
    agreement: ['agreeVolunteer', 'agreeVolunteerAgreement', 'volAgreement', 'volunteerAgreement', 'volunteer_agreement'],
    signature: ['volSignature', 'vol_signature', 'volunteerSignature', 'volunteer_signature'],
    linkedParentEmail: ['linkedParentEmail', 'linked_parent_email', 'linkedParentEmailAddress', 'linked_parent_email_address'],
  };

  const aliasList = headerAliases[normalizedHeader] || [];
  aliasList.forEach(function(alias) {
    candidates.push(alias);
  });

  const seen = {};
  for (var i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    if (!candidate || seen[candidate]) continue;
    seen[candidate] = true;
    const direct = values && values[candidate];
    if (direct !== undefined && direct !== null) {
      return direct;
    }
  }

  return values && values[normalizedHeader];
}

function writeError_(formType, reason, payload) {
  const errorSheet = getSheet_(SHEET_NAMES.ERRORS);
  ensureHeaders_(errorSheet, ERROR_HEADERS);
  errorSheet.appendRow([
    formatSheetTimestamp_(new Date()),
    formType || '',
    reason || '',
    safeStringify_(payload || {}),
  ]);
}

function formatSheetValue_(header, value) {
  if (isTimestampHeader_(header)) {
    return formatSheetTimestamp_(value);
  }
  if (isDobHeader_(header)) {
    return formatDobValue_(value);
  }
  return sanitizeForSheet_(value);
}

function isTimestampHeader_(header) {
  return TIMESTAMP_HEADERS.indexOf(String(header || '').trim()) >= 0;
}

function isDobHeader_(header) {
  const normalized = String(header || '').trim().toLowerCase();
  return normalized === 'dob' || normalized === 'date_of_birth' || normalized === 'dateofbirth' || /(^|_)dob$/.test(normalized) || /(^|_)date_of_birth$/.test(normalized) || /(^|_)dateofbirth$/.test(normalized);
}

function formatDobValue_(value) {
  if (value === undefined || value === null || value === '') return '';

  const normalized = normalizeValue_(value);
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(normalized)) {
    return normalized;
  }

  const date = new Date(normalized);
  if (isNaN(date.getTime())) {
    return sanitizeForSheet_(value);
  }

  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'MM/dd/yyyy');
}

function formatSheetTimestamp_(value) {
  if (value === undefined || value === null || value === '') return '';

  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) {
    return sanitizeForSheet_(value);
  }

  return Utilities.formatDate(date, Session.getScriptTimeZone(), SHEET_TIMESTAMP_FORMAT);
}

function sanitizeForSheet_(value) {
  const normalized = normalizeValue_(value);
  if (!normalized) return '';
  if (/^[=+\-@]/.test(normalized)) return `'${normalized}`;
  return normalized;
}

function normalizeValue_(value) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.join(', ');
  return String(value).trim();
}

function normalizeComparisonValue_(value) {
  return normalizeValue_(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

function normalizeMoneyValue_(value) {
  const normalized = normalizeValue_(value).replace(/[^0-9.]/g, '');
  if (!normalized) return '';
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : '';
}

function parseDateMs_(value) {
  const normalized = normalizeValue_(value);
  if (!normalized) return 0;
  const parsed = new Date(normalized);
  return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function scorePaymentReceiptCandidate_(record, criteria) {
  const status = normalizeComparisonValue_(record['Player Payment Status']);
  const existingTransactionId = normalizeComparisonValue_(record['Player Payment Transaction ID']);
  const existingAmount = normalizeMoneyValue_(record['Player Payment Amount']);
  const recordPlayerCount = Number(normalizeValue_(record.player_count) || 0);
  const expectedAmount = recordPlayerCount > 0 ? (recordPlayerCount * 75).toFixed(2) : '';
  const recordName = normalizeComparisonValue_(`${record.parent_first_name} ${record.parent_last_name}`);

  if (!normalizeValue_(record.registration_submission_id)) {
    return -1;
  }

  if (criteria.paymentTransactionId && existingTransactionId && criteria.paymentTransactionId !== existingTransactionId) {
    return -1;
  }

  let score = status === 'paid' ? 10 : 50;

  if (criteria.paymentTransactionId && existingTransactionId && criteria.paymentTransactionId === existingTransactionId) {
    score += 100;
  }

  if (criteria.parentName) {
    if (recordName === criteria.parentName) {
      score += 20;
    } else if (recordName) {
      score -= 10;
    }
  }

  if (criteria.playerCount > 0 && recordPlayerCount > 0) {
    if (criteria.playerCount === recordPlayerCount) {
      score += 20;
    } else {
      score -= 25;
    }
  }

  if (criteria.paymentAmount) {
    if (existingAmount && existingAmount === criteria.paymentAmount) {
      score += 15;
    } else if (expectedAmount && expectedAmount === criteria.paymentAmount) {
      score += 15;
    } else if (expectedAmount) {
      score -= 10;
    }
  }

  if (criteria.paidAtMs > 0) {
    const submittedAtMs = parseDateMs_(record.submitted_at);
    if (submittedAtMs > 0) {
      const deltaHours = Math.abs(criteria.paidAtMs - submittedAtMs) / (1000 * 60 * 60);
      if (deltaHours <= 72) {
        score += 10;
      } else if (deltaHours > 24 * 30) {
        score -= 15;
      }
    }
  }

  return score;
}

function handleEmailTrackingRequest_(e) {
  const params = e && e.parameter ? e.parameter : {};
  const token = normalizeValue_(params.token);
  const eventType = normalizeValue_(params.event || 'opened');
  const emailType = normalizeValue_(params.email_type);
  const submissionId = normalizeValue_(params.submission_id);
  const recipientEmail = normalizeValue_(params.recipient_email);
  const targetUrl = normalizeValue_(params.target);
  const linkLabel = normalizeValue_(params.link_label);

  try {
    recordEmailTrackingEvent_(token, eventType, emailType, submissionId, recipientEmail, targetUrl, linkLabel, e && e.headers ? e.headers : null, params);
  } catch (error) {
    writeError_('email_tracking', 'Email tracking request failed', {
      token,
      eventType,
      emailType,
      submissionId,
      recipientEmail,
      targetUrl,
      linkLabel,
      error: String(error && error.message ? error.message : error),
    });
  }

  if (eventType === 'clicked' && targetUrl) {
    return HtmlService.createHtmlOutput('<html><head><meta http-equiv="refresh" content="0;url=' + escapeHtml_(targetUrl) + '"></head><body>Redirectingâ€¦</body></html>');
  }

  const pixel = Utilities.base64Decode('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==');
  return Utilities.newBlob(pixel, 'image/gif', 'pixel.gif');
}

function recordEmailTrackingEvent_(trackingId, eventType, emailType, submissionId, recipientEmail, targetUrl, linkLabel, headers, params) {
  const sheet = getSheet_(EMAIL_TRACKING_SHEET_NAME);
  ensureHeaders_(sheet, EMAIL_TRACKING_HEADERS);

  const userAgent = headers && headers['user-agent'] ? headers['user-agent'] : '';
  const ipAddress = headers && headers['x-forwarded-for']
    ? String(headers['x-forwarded-for']).split(',')[0].trim()
    : '';
  const sourceUrl = normalizeValue_(params && params.source_url ? params.source_url : '');

  try {
    sheet.appendRow([
      trackingId || '',
      eventType || '',
      emailType || '',
      submissionId || '',
      recipientEmail || '',
      targetUrl || '',
      linkLabel || '',
      formatSheetTimestamp_(new Date()),
      userAgent,
      ipAddress,
      sourceUrl,
    ]);
  } catch (error) {
    writeError_('email_tracking', 'Failed to append email tracking row', {
      trackingId: trackingId || '',
      eventType: eventType || '',
      emailType: emailType || '',
      submissionId: submissionId || '',
      recipientEmail: recipientEmail || '',
      targetUrl: targetUrl || '',
      linkLabel: linkLabel || '',
      userAgent,
      ipAddress,
      sourceUrl,
      error: String(error && error.message ? error.message : error),
    });
    throw error;
  }
}

function createEmailTrackingContext_(payload, emailType) {
  const submissionId = normalizeValue_(payload.registrationSubmissionId || payload.submissionId || payload.submission_id || payload.id || '');
  const recipientEmail = normalizeValue_(payload.parentEmail || payload.email || '').toLowerCase();
  const trackingToken = ['email', emailType, submissionId || 'anonymous', Date.now(), Utilities.getUuid()].filter(Boolean).join('-');
  const trackingBaseUrl = getEmailTrackingBaseUrl_(payload);

  const openUrl = buildEmailTrackingUrl_(trackingBaseUrl, trackingToken, 'opened', emailType, submissionId, recipientEmail, '', '');
  const makeTrackedUrl = function(targetUrl, linkLabel) {
    return buildEmailTrackingUrl_(trackingBaseUrl, trackingToken, 'clicked', emailType, submissionId, recipientEmail, targetUrl, linkLabel);
  };

  return {
    trackingToken: trackingToken,
    emailType: emailType,
    submissionId: submissionId,
    recipientEmail: recipientEmail,
    sourceUrl: normalizeValue_(payload.sourceUrl || ''),
    openUrl: openUrl,
    makeTrackedUrl: makeTrackedUrl,
  };
}

function hasSuccessfulSentTrackingEvent_(emailType, submissionId, recipientEmail) {
  const sheet = getSheet_(EMAIL_TRACKING_SHEET_NAME);
  ensureHeaders_(sheet, EMAIL_TRACKING_HEADERS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  const values = sheet.getRange(2, 1, lastRow - 1, EMAIL_TRACKING_HEADERS.length).getValues();
  const normalizedType = normalizeComparisonValue_(emailType);
  const normalizedSubmissionId = normalizeComparisonValue_(submissionId);
  const normalizedRecipient = normalizeComparisonValue_(recipientEmail);

  for (var i = 0; i < values.length; i += 1) {
    const row = values[i];
    if (
      normalizeComparisonValue_(row[1]) === 'sent' &&
      normalizeComparisonValue_(row[2]) === normalizedType &&
      normalizeComparisonValue_(row[3]) === normalizedSubmissionId &&
      normalizeComparisonValue_(row[4]) === normalizedRecipient
    ) {
      return true;
    }
  }

  return false;
}

function recordEmailSentEvent_(trackingContext) {
  recordEmailTrackingEvent_(
    trackingContext.trackingToken,
    'sent',
    trackingContext.emailType,
    trackingContext.submissionId,
    trackingContext.recipientEmail,
    '',
    '',
    null,
    { source_url: trackingContext.sourceUrl || '' }
  );
}

function sendFlowConfirmationEmail_(payload) {
  if (hasSuccessfulSentTrackingEvent_(payload.emailType, payload.submissionId, payload.recipientEmail)) {
    return { sent: false, duplicate: true, trackingId: '' };
  }

  const applicantName = `${payload.applicantFirstName || ''} ${payload.applicantLastName || ''}`.trim() || 'Applicant';
  const trackingContext = createEmailTrackingContext_({
    submissionId: payload.submissionId,
    parentEmail: payload.recipientEmail,
    sourceUrl: payload.sourceUrl,
  }, payload.emailType);
  const signedLinks = Array.isArray(payload.signedDocumentUrls) ? payload.signedDocumentUrls : [];
  const paymentUrl = payload.paymentRequired && payload.paymentUrl
    ? trackingContext.makeTrackedUrl(payload.paymentUrl, 'Continue to Secure Payment')
    : '';
  const trackedSignedLinks = signedLinks.map(function(link) {
    return {
      label: link.label,
      url: trackingContext.makeTrackedUrl(link.url, link.label || 'Signed Document'),
    };
  });

  const copy = buildFlowConfirmationEmailCopy_({
    emailType: payload.emailType,
    applicantName: applicantName,
    participantNames: payload.participantNames,
    submissionId: payload.submissionId,
    formsRecorded: payload.formsRecorded,
    agreementsRecorded: payload.agreementsRecorded,
    scholarshipRequested: payload.scholarshipRequested,
    paymentRequired: payload.paymentRequired,
    paymentAmount: payload.paymentAmount,
    paymentUrl: paymentUrl,
    signedDocumentUrls: trackedSignedLinks,
    openTrackingUrl: trackingContext.openUrl,
  });

  sendBrandedEmail_({
    to: payload.recipientEmail,
    subject: copy.subject,
    body: copy.text,
    htmlBody: copy.html,
    name: DEFAULT_EMAIL_SENDER_NAME,
    replyTo: EMAIL_REPLY_TO,
  });

  recordEmailSentEvent_(trackingContext);
  return { sent: true, duplicate: false, trackingId: trackingContext.trackingToken };
}

function buildFlowConfirmationEmailCopy_(payload) {
  const subjectMap = {
    registration_player: 'MLS GO Registration Received',
    registration_player_volunteer: 'MLS GO Registration and Volunteer Forms Received',
    registration_player_coach: 'MLS GO Registration and Coaching Forms Received',
    registration_player_volunteer_coach: 'MLS GO Registration, Volunteer, and Coaching Forms Received',
    scholarship_player: 'MLS GO Registration and Scholarship Application Received',
    scholarship_player_volunteer: 'MLS GO Registration, Scholarship, and Volunteer Forms Received',
    scholarship_player_coach: 'MLS GO Registration, Scholarship, and Coaching Forms Received',
    scholarship_player_volunteer_coach: 'MLS GO Registration, Scholarship, Volunteer, and Coaching Forms Received',
    standalone_volunteer: 'MLS GO Volunteer Application Received',
    standalone_coach: 'MLS GO Coaching Application Received',
  };

  const formsLine = payload.formsRecorded.length ? payload.formsRecorded.join(', ') : 'Your submitted forms';
  const agreementsLine = payload.agreementsRecorded.length ? payload.agreementsRecorded.join(', ') : 'No agreement links are available yet';
  const participantLine = payload.participantNames || 'Not applicable';
  const signedLinksHtml = payload.signedDocumentUrls.map(function(link) {
    return '<li style="margin:0 0 8px"><a href="' + escapeHtml_(link.url) + '" style="color:#1d2f40;font-weight:700;text-decoration:none">' + escapeHtml_(link.label) + '</a></li>';
  }).join('');
  const signedLinksText = payload.signedDocumentUrls.map(function(link) {
    return '- ' + link.label + ': ' + link.url;
  }).join('\n');

  const intro = getFlowConfirmationIntro_(payload.emailType);
  const paymentParagraph = payload.paymentRequired
    ? 'Payment is still required to finish the player registration. Use the secure payment link below.'
    : 'No payment is required at this time.';
  const scholarshipParagraph = String(payload.scholarshipRequested || '').trim().toLowerCase() === 'yes'
    ? 'Scholarship status: Financial Hardship Scholarship requested. Our team will review the application and contact you with the next steps.'
    : '';

  const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
    + '<body style="margin:0;padding:0;background:#f4f0e8;font-family:Arial,sans-serif;color:#1d2f40">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#f4f0e8"><tr><td style="padding:24px 12px">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:680px;margin:0 auto;border-collapse:collapse;background:#ffffff;border:1px solid #d9d2c7">'
    + '<tr><td><a href="' + escapeHtml_(EMAIL_HEADER_LINK_URL) + '" style="display:block"><img src="' + escapeHtml_(REGISTRATION_BANNER_URL) + '" alt="LifePrep Academy Foundation MLS GO youth program" style="display:block;width:100%;height:auto;border:0"></a></td></tr>'
    + '<tr><td style="padding:34px 30px 30px">'
    + '<p style="margin:0 0 10px;color:#c16a2b;font-size:12px;line-height:1.3;font-weight:700;letter-spacing:.12em;text-transform:uppercase">LifePrep Academy Foundation</p>'
    + '<h1 style="margin:0 0 18px;color:#1d2f40;font-size:28px;line-height:1.2">' + escapeHtml_(subjectMap[payload.emailType] || 'Submission Received') + '</h1>'
    + '<p style="margin:0 0 16px;color:#22313f;font-size:16px;line-height:1.7">Hello ' + escapeHtml_(payload.applicantName || 'Applicant') + ',</p>'
    + '<p style="margin:0 0 16px;color:#22313f;font-size:16px;line-height:1.7">' + escapeHtml_(intro) + '</p>'
    + '<p style="margin:0 0 12px;color:#22313f;font-size:15px;line-height:1.7"><strong>Submission ID:</strong> ' + escapeHtml_(payload.submissionId) + '</p>'
    + '<p style="margin:0 0 12px;color:#22313f;font-size:15px;line-height:1.7"><strong>Participant(s):</strong> ' + escapeHtml_(participantLine) + '</p>'
    + '<p style="margin:0 0 12px;color:#22313f;font-size:15px;line-height:1.7"><strong>Forms received:</strong> ' + escapeHtml_(formsLine) + '</p>'
    + '<p style="margin:0 0 16px;color:#22313f;font-size:15px;line-height:1.7"><strong>Agreements recorded:</strong> ' + escapeHtml_(agreementsLine) + '</p>'
    + (scholarshipParagraph ? '<p style="margin:0 0 16px;color:#22313f;font-size:15px;line-height:1.7">' + escapeHtml_(scholarshipParagraph) + '</p>' : '')
    + '<p style="margin:0 0 18px;color:#22313f;font-size:15px;line-height:1.7">' + escapeHtml_(paymentParagraph) + '</p>'
    + (payload.paymentRequired && payload.paymentUrl
      ? '<p style="margin:0 0 18px"><a href="' + escapeHtml_(payload.paymentUrl) + '" style="display:inline-block;padding:14px 24px;background:#1d2f40;border-radius:999px;color:#ffffff;font-size:15px;font-weight:700;line-height:1.2;text-decoration:none">Continue to Secure Payment</a></p>'
      : '')
    + (signedLinksHtml ? '<h2 style="margin:0 0 10px;color:#1d2f40;font-size:18px;line-height:1.3">Signed documents</h2><ul style="margin:0 0 18px 18px;padding:0;color:#22313f;font-size:15px;line-height:1.7">' + signedLinksHtml + '</ul>' : '')
    + '<p style="margin:0;color:#22313f;font-size:15px;line-height:1.7">If you have questions, contact <a href="mailto:info@lifeprepacademyfoundation.com" style="color:#1d2f40;font-weight:700;text-decoration:none">info@lifeprepacademyfoundation.com</a>.</p>'
    + (payload.openTrackingUrl ? '<img src="' + escapeHtml_(payload.openTrackingUrl) + '" alt="" width="1" height="1" style="display:block;border:0;width:1px;height:1px">' : '')
    + '</td></tr>'
    + '<tr><td><a href="' + escapeHtml_(EMAIL_FOOTER_LINK_URL) + '" style="display:block"><img src="' + escapeHtml_(REGISTRATION_FOOTER_URL) + '" alt="LifePrep Academy Foundation MLS GO youth program" style="display:block;width:100%;height:auto;border:0"></a></td></tr>'
    + '</table></td></tr></table></body></html>';

  const text = [
    intro,
    '',
    'Submission ID: ' + payload.submissionId,
    'Participant(s): ' + participantLine,
    'Forms received: ' + formsLine,
    'Agreements recorded: ' + agreementsLine,
    scholarshipParagraph,
    paymentParagraph,
    payload.paymentRequired && payload.paymentUrl ? 'Continue to Secure Payment: ' + payload.paymentUrl : '',
    signedLinksText ? 'Signed documents:\n' + signedLinksText : '',
    'Questions: info@lifeprepacademyfoundation.com',
  ].filter(Boolean).join('\n');

  return {
    subject: subjectMap[payload.emailType] || 'Submission Received',
    html: html,
    text: text,
  };
}

function getFlowConfirmationIntro_(emailType) {
  const introMap = {
    registration_player: 'Thank you for registering for the LifePrep Academy Foundation MLS GO youth program. We recorded your player registration and Player Agreement.',
    registration_player_volunteer: 'Thank you. We recorded your player registration, volunteer application, Player Agreement, and Volunteer Agreement.',
    registration_player_coach: 'Thank you. We recorded your player registration, coaching application, Player Agreement, and Volunteer Agreement.',
    registration_player_volunteer_coach: 'Thank you. We recorded your player registration, volunteer application, coaching application, Player Agreement, and Volunteer Agreement.',
    scholarship_player: 'Thank you. We received your player registration, Player Agreement, and Financial Hardship Scholarship application.',
    scholarship_player_volunteer: 'Thank you. We received your player registration, Player Agreement, Financial Hardship Scholarship application, volunteer application, and Volunteer Agreement.',
    scholarship_player_coach: 'Thank you. We received your player registration, Player Agreement, Financial Hardship Scholarship application, coaching application, and Volunteer Agreement.',
    scholarship_player_volunteer_coach: 'Thank you. We received your player registration, Player Agreement, Financial Hardship Scholarship application, volunteer application, coaching application, and Volunteer Agreement.',
    standalone_volunteer: 'Thank you for applying to volunteer with the LifePrep Academy Foundation MLS GO youth program. We recorded your Volunteer Application and Volunteer Agreement.',
    standalone_coach: 'Thank you for applying to coach with the LifePrep Academy Foundation MLS GO youth program. We recorded your Coaching Application and Volunteer Agreement.',
  };
  return introMap[emailType] || 'Thank you. We recorded your submission.';
}

function parseJsonArrayOfStrings_(value) {
  try {
    var parsed = JSON.parse(value || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map(function(entry) {
      return normalizeValue_(entry);
    }).filter(Boolean);
  } catch (_error) {
    return [];
  }
}

function parseJsonLinkArray_(value) {
  try {
    var parsed = JSON.parse(value || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map(function(entry) {
      return {
        label: normalizeValue_(entry && entry.label),
        url: normalizeValue_(entry && entry.url),
      };
    }).filter(function(entry) {
      return entry.label && entry.url;
    });
  } catch (_error) {
    return [];
  }
}

function getEmailTrackingBaseUrl_(payload) {
  const configured = normalizeValue_(payload && payload.trackingBaseUrl);
  if (configured) return configured;

  const scriptProperty = PropertiesService.getScriptProperties().getProperty('EMAIL_TRACKING_BASE_URL');
  if (scriptProperty) return normalizeValue_(scriptProperty);

  const serviceUrl = normalizeValue_(ScriptApp.getService().getUrl());
  return serviceUrl;
}

function isUsableTrackingBaseUrl_(value) {
  const normalized = normalizeValue_(value);
  if (!normalized) return false;
  if (!/^https?:\/\//i.test(normalized)) return false;
  if (/\/unknown\/exec(?:\?|$)/i.test(normalized)) return false;
  return true;
}

function buildEmailTrackingUrl_(trackingBaseUrl, trackingToken, eventType, emailType, submissionId, recipientEmail, targetUrl, linkLabel) {
  if (!isUsableTrackingBaseUrl_(trackingBaseUrl)) {
    return eventType === 'clicked' ? normalizeValue_(targetUrl) : '';
  }

  const params = [
    ['action', 'track_email'],
    ['token', trackingToken],
    ['event', eventType],
    ['email_type', emailType],
    ['submission_id', submissionId],
    ['recipient_email', recipientEmail],
    ['target', targetUrl || ''],
    ['link_label', linkLabel || ''],
  ];

  const query = params
    .filter(function(entry) {
      return entry[1] !== '';
    })
    .map(function(entry) {
      return encodeURIComponent(entry[0]) + '=' + encodeURIComponent(entry[1]);
    })
    .join('&');

  return trackingBaseUrl ? trackingBaseUrl + (trackingBaseUrl.indexOf('?') >= 0 ? '&' : '?') + query : '';
}

function safeStringify_(value) {
  try {
    return JSON.stringify(value);
  } catch (_error) {
    return String(value);
  }
}

function sendRegistrationEmailByStage_(payload, paymentConfirmed) {
  const subject = 'MLS GO Youth Program Registration Received';
  const body = 'Thank you for registering for LifePrep Academy Foundation\'s MLS GO youth program. We have successfully received your registration. Please monitor your inbox for important information and next steps from our team.';
  sendBrandedEmail_({
    to: payload.parentEmail,
    subject,
    body,
    htmlBody: buildBrandedSubmissionEmailHtml_({
      title: 'MLS GO Youth Program Registration Received',
      greeting: 'Thank you for registering for LifePrep Academy Foundation\'s MLS GO youth program.',
      message: 'We have successfully received your registration. Please monitor your inbox for important information and next steps from our team.',
    }),
    name: DEFAULT_EMAIL_SENDER_NAME,
    replyTo: EMAIL_REPLY_TO,
  });
}

function sendVolunteerCoachConfirmationEmail_(formType, values) {
  const email = normalizeValue_(values.email).toLowerCase();
  if (!email || !isValidEmail_(email)) {
    throw new Error('Invalid email for volunteer/coach confirmation');
  }
  const isCoach = formType === 'coaching_application';
  const submissionType = isCoach ? 'Coaching Application' : 'Volunteer Application';
  const action = isCoach ? 'applying to coach with' : 'applying to volunteer with';
  const subject = `MLS GO Youth Program ${submissionType} Received`;
  const body = `Thank you for ${action} LifePrep Academy Foundation's MLS GO youth program. We have successfully received your application. Please monitor your inbox for important information and next steps from our team.`;
  sendBrandedEmail_({
    to: email,
    subject,
    body,
    htmlBody: buildBrandedSubmissionEmailHtml_({
      title: `MLS GO Youth Program ${submissionType} Received`,
      greeting: `Thank you for ${action} LifePrep Academy Foundation's MLS GO youth program.`,
      message: 'We have successfully received your application. Please monitor your inbox for important information and next steps from our team.',
    }),
    name: DEFAULT_EMAIL_SENDER_NAME,
    replyTo: EMAIL_REPLY_TO,
  });
}

function buildBrandedSubmissionEmailHtml_(options) {
  const title = escapeHtml_(options.title || 'Submission Received');
  const greeting = escapeHtml_(options.greeting || 'Thank you for your submission.');
  const message = escapeHtml_(options.message || 'Please monitor your inbox for important information and next steps from our team.');
  const imageUrl = escapeHtml_(REGISTRATION_BANNER_URL);
  const footerImageUrl = escapeHtml_(REGISTRATION_FOOTER_URL);
  const headerLinkUrl = escapeHtml_(EMAIL_HEADER_LINK_URL);
  const footerLinkUrl = escapeHtml_(EMAIL_FOOTER_LINK_URL);

  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
    + '<body style="margin:0;padding:0;background:#f4f0e8;font-family:Arial,sans-serif;color:#1d2f40">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#f4f0e8">'
    + '<tr><td style="padding:24px 12px">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:680px;margin:0 auto;border-collapse:collapse;background:#ffffff;border:1px solid #d9d2c7">'
    + '<tr><td><a href="' + headerLinkUrl + '" style="display:block"><img src="' + imageUrl + '" alt="LifePrep Academy Foundation MLS GO youth program" style="display:block;width:100%;height:auto;border:0"></a></td></tr>'
    + '<tr><td style="padding:34px 30px 30px">'
    + '<p style="margin:0 0 10px;color:#c16a2b;font-size:12px;line-height:1.3;font-weight:700;letter-spacing:.12em;text-transform:uppercase">LifePrep Academy Foundation</p>'
    + '<h1 style="margin:0 0 22px;color:#1d2f40;font-size:28px;line-height:1.2">' + title + '</h1>'
    + '<p style="margin:0 0 16px;color:#22313f;font-size:16px;line-height:1.7">' + greeting + '</p>'
    + '<p style="margin:0;color:#22313f;font-size:16px;line-height:1.7">' + message + '</p>'
    + '</td></tr>'
    + '<tr><td style="padding:0 30px 24px"><div style="height:1px;background:#d9d2c7"></div></td></tr>'
    + '<tr><td><a href="' + footerLinkUrl + '" style="display:block"><img src="' + footerImageUrl + '" alt="LifePrep Academy Foundation MLS GO youth program" style="display:block;width:100%;height:auto;border:0"></a></td></tr>'
    + '<tr><td style="padding:18px 30px 26px;text-align:center;color:#66727d;font-size:12px;line-height:1.6">LifePrep Academy Foundation<br>MLS GO youth program<br><a href="https://www.lifeprepacademyfoundation.com/" style="color:#1d2f40;font-weight:700;text-decoration:none">lifeprepacademyfoundation.com</a></td></tr>'
    + '</table></td></tr></table></body></html>';
}

function buildRegistrationSubmissionEmailHtml_(payload) {
  const parentName = escapeHtml_(payload.parentName || 'Parent/Guardian');
  const participantNames = escapeHtml_(payload.participantNames || 'Your registered participant(s)');
  const signedAt = escapeHtml_(formatEmailTimestamp_(payload.signedAt));
  const signedDocumentUrl = escapeHtml_(payload.signedDocumentTrackingUrl || payload.signedDocumentUrl || BRAND_URL);
  const openTrackingUrl = escapeHtml_(payload.emailOpenTrackingUrl || '');
  const responseRows = buildRegistrationResponseRows_(payload);
  const responseRowsHtml = responseRows.map((row) => ''
    + '<tr>'
    + '<td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:700;color:#1d2f40;vertical-align:top">' + escapeHtml_(row.label) + '</td>'
    + '<td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#22313f;vertical-align:top">' + escapeHtml_(row.value) + '</td>'
    + '</tr>'
  ).join('');

  return ''
    + '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
    + '<body style="margin:0;padding:0;background:#f5f2ea;font-family:Arial,sans-serif;color:#22313f">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#f5f2ea">'
    + '<tr><td style="padding:24px 12px">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:720px;margin:0 auto;border-collapse:collapse">'
    + '<tr><td style="background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid rgba(34,49,63,0.12)">'
    + '<img src="' + REGISTRATION_BANNER_URL + '" alt="LifePrep Academy Foundation MLS GO" style="display:block;width:100%;height:auto">'
    + '<div style="padding:32px 30px 24px">'
    + '<div style="font-size:12px;line-height:1.2;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#c16a2b;margin:0 0 12px">MLS GO Registration</div>'
    + '<h1 style="margin:0 0 16px;font-size:30px;line-height:1.1;color:#1d2f40">Thank you for registering</h1>'
    + '<p style="margin:0 0 16px;font-size:16px;line-height:1.7">Hello ' + parentName + ',</p>'
    + '<p style="margin:0 0 16px;font-size:16px;line-height:1.7">We received your MLS GO registration for ' + participantNames + '. A signed document copy is available below.</p>'
    + (signedAt ? '<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#586574"><strong style="color:#1d2f40">Signed:</strong> ' + signedAt + '</p>' : '')
    + (responseRowsHtml
      ? '<h2 style="margin:0 0 10px;font-size:18px;line-height:1.3;color:#1d2f40">Submitted Responses</h2>'
        + '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 18px;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">'
        + responseRowsHtml
        + '</table>'
      : '')
    + '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px"><tr>'
    + '<td style="border-radius:999px;background:#1d2f40">'
    + '<a href="' + signedDocumentUrl + '" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:700;line-height:1.2;color:#ffffff;text-decoration:none">Download Signed Documents</a>'
    + '</td></tr></table>'
    + '<p style="margin:0;font-size:15px;line-height:1.7">If you have any questions, reply to this email or contact <a href="mailto:info@lifeprepacademyfoundation.com" style="color:#1d2f40;font-weight:700;text-decoration:none">info@lifeprepacademyfoundation.com</a>.</p>'
    + (openTrackingUrl ? '<img src="' + openTrackingUrl + '" alt="" width="1" height="1" style="display:block;border:0;width:1px;height:1px">' : '')
    + '</div>'
    + '</td></tr>'
    + '<tr><td style="padding:16px 8px 0;text-align:center;font-size:12px;line-height:1.6;color:#6b7280">'
    + '<a href="' + BRAND_URL + '" style="color:#1d2f40;font-weight:700;text-decoration:none">' + BRAND_DOMAIN + '</a>'
    + '</td></tr>'
    + '</table>'
    + '</td></tr>'
    + '</table>'
    + '</body></html>';
}

function buildRegistrationSubmissionEmailText_(payload) {
  const lines = [];
  lines.push('Thank you for registering for MLS GO.');
  lines.push('');
  if (payload.parentName) lines.push('Parent/Guardian: ' + payload.parentName);
  if (payload.participantNames) lines.push('Participant(s): ' + payload.participantNames);
  if (payload.signedAt) lines.push('Signed At: ' + payload.signedAt);
  const responseRows = buildRegistrationResponseRows_(payload);
  if (responseRows.length) {
    lines.push('');
    lines.push('Submitted Responses:');
    responseRows.forEach((row) => {
      lines.push('- ' + row.label + ': ' + row.value);
    });
  }
  lines.push('');
  lines.push('Download signed documents: ' + (payload.signedDocumentTrackingUrl || payload.signedDocumentUrl || BRAND_URL));
  lines.push('');
  lines.push(BRAND_DOMAIN);
  return lines.join('\n');
}

function buildRegistrationPaidEmailHtml_(payload) {
  const parentName = escapeHtml_(payload.parentName || 'Parent/Guardian');
  const participantNames = escapeHtml_(payload.participantNames || 'Your registered participant(s)');
  const signedAt = escapeHtml_(formatEmailTimestamp_(payload.signedAt));
  const signedDocumentUrl = escapeHtml_(payload.signedDocumentTrackingUrl || payload.signedDocumentUrl || BRAND_URL);
  const paymentReceiptUrl = escapeHtml_(payload.paymentReceiptTrackingUrl || payload.paymentReceiptUrl || '');
  const openTrackingUrl = escapeHtml_(payload.emailOpenTrackingUrl || '');
  const paymentPaidAt = escapeHtml_(formatEmailTimestamp_(payload.paymentPaidAt));
  const fee = escapeHtml_(payload.registrationFeeAmount || '75');
  const responseRows = buildRegistrationResponseRows_(payload);
  const responseRowsHtml = responseRows.map((row) => ''
    + '<tr>'
    + '<td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:700;color:#1d2f40;vertical-align:top">' + escapeHtml_(row.label) + '</td>'
    + '<td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#22313f;vertical-align:top">' + escapeHtml_(row.value) + '</td>'
    + '</tr>'
  ).join('');

  return ''
    + '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
    + '<body style="margin:0;padding:0;background:#f5f2ea;font-family:Arial,sans-serif;color:#22313f">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#f5f2ea">'
    + '<tr><td style="padding:24px 12px">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:720px;margin:0 auto;border-collapse:collapse">'
    + '<tr><td style="background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid rgba(34,49,63,0.12)">'
    + '<img src="' + REGISTRATION_BANNER_URL + '" alt="LifePrep Academy Foundation MLS GO" style="display:block;width:100%;height:auto">'
    + '<div style="padding:32px 30px 24px">'
    + '<div style="font-size:12px;line-height:1.2;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#c16a2b;margin:0 0 12px">MLS GO Registration</div>'
    + '<h1 style="margin:0 0 16px;font-size:30px;line-height:1.1;color:#1d2f40">Thank you for completing registration</h1>'
    + '<p style="margin:0 0 16px;font-size:16px;line-height:1.7">Hello ' + parentName + ',</p>'
    + '<p style="margin:0 0 16px;font-size:16px;line-height:1.7">We have confirmed payment for the MLS GO registration for ' + participantNames + '. Your signed registration document is ready to download below.</p>'
    + (signedAt ? '<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#586574"><strong style="color:#1d2f40">Signed:</strong> ' + signedAt + '</p>' : '')
    + (paymentPaidAt ? '<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#586574"><strong style="color:#1d2f40">Payment Confirmed:</strong> ' + paymentPaidAt + '</p>' : '')
    + (responseRowsHtml
      ? '<h2 style="margin:0 0 10px;font-size:18px;line-height:1.3;color:#1d2f40">Submitted Responses</h2>'
        + '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 18px;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">'
        + responseRowsHtml
        + '</table>'
      : '')
    + '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px"><tr>'
    + '<td style="border-radius:999px;background:#1d2f40">'
    + '<a href="' + signedDocumentUrl + '" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:700;line-height:1.2;color:#ffffff;text-decoration:none">Download Signed Documents</a>'
    + '</td></tr></table>'
    + (paymentReceiptUrl
      ? '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px"><tr>'
        + '<td style="border-radius:999px;background:#c16a2b">'
        + '<a href="' + paymentReceiptUrl + '" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:700;line-height:1.2;color:#ffffff;text-decoration:none">View Payment Receipt</a>'
        + '</td></tr></table>'
      : '')
    + '<p style="margin:0 0 12px;font-size:15px;line-height:1.7">We have recorded your registration fee payment of $' + fee + '.</p>'
    + '<p style="margin:0;font-size:15px;line-height:1.7">If you have any questions, reply to this email or contact <a href="mailto:info@lifeprepacademyfoundation.com" style="color:#1d2f40;font-weight:700;text-decoration:none">info@lifeprepacademyfoundation.com</a>.</p>'
    + (openTrackingUrl ? '<img src="' + openTrackingUrl + '" alt="" width="1" height="1" style="display:block;border:0;width:1px;height:1px">' : '')
    + '</div>'
    + '</td></tr>'
    + '<tr><td style="padding:16px 8px 0;text-align:center;font-size:12px;line-height:1.6;color:#6b7280">'
    + '<a href="' + BRAND_URL + '" style="color:#1d2f40;font-weight:700;text-decoration:none">' + BRAND_DOMAIN + '</a>'
    + '</td></tr>'
    + '</table>'
    + '</td></tr>'
    + '</table>'
    + '</body></html>';
}

function buildRegistrationPaidEmailText_(payload) {
  const lines = [];
  lines.push('Thank you for completing your MLS GO registration.');
  lines.push('');
  if (payload.parentName) lines.push('Parent/Guardian: ' + payload.parentName);
  if (payload.participantNames) lines.push('Participant(s): ' + payload.participantNames);
  if (payload.signedAt) lines.push('Signed At: ' + payload.signedAt);
  if (payload.paymentPaidAt) lines.push('Payment Confirmed: ' + payload.paymentPaidAt);
  const responseRows = buildRegistrationResponseRows_(payload);
  if (responseRows.length) {
    lines.push('');
    lines.push('Submitted Responses:');
    responseRows.forEach((row) => {
      lines.push('- ' + row.label + ': ' + row.value);
    });
  }
  lines.push('');
  lines.push('Download signed documents: ' + (payload.signedDocumentTrackingUrl || payload.signedDocumentUrl || BRAND_URL));
  if (payload.paymentReceiptTrackingUrl || payload.paymentReceiptUrl) {
    lines.push('Payment receipt: ' + (payload.paymentReceiptTrackingUrl || payload.paymentReceiptUrl));
  }
  lines.push('');
  lines.push('We have recorded your registration fee payment of $' + (payload.registrationFeeAmount || '75') + '.');
  lines.push('');
  lines.push('');
  lines.push(BRAND_DOMAIN);
  return lines.join('\n');
}

function buildRegistrationResponseRows_(payload) {
  if (payload && Array.isArray(payload.allResponseRows) && payload.allResponseRows.length) {
    return payload.allResponseRows.filter(function(row) {
      return normalizeValue_(row && row.value);
    });
  }

  const parsedFormValues = parseRegistrationFormValues_(payload || {});
  if (parsedFormValues.length) {
    return parsedFormValues;
  }

  if (payload && payload.formValues && Array.isArray(payload.formValues)) {
    return payload.formValues.filter(function(row) {
      return normalizeValue_(row && row.value);
    });
  }

  const emergencyAddress = [
    normalizeValue_(payload.emergencyStreet),
    normalizeValue_(payload.emergencyCity),
    normalizeValue_(payload.emergencyState),
    normalizeValue_(payload.emergencyZip),
  ].filter(Boolean).join(', ');

  const rows = [
    { label: 'Registration ID', value: normalizeValue_(payload.registrationSubmissionId) },
    { label: 'Parent/Guardian Full Name', value: normalizeValue_(payload.parentName) },
    { label: 'Relationship to Child', value: normalizeValue_(payload.relationshipToChild) },
    { label: 'Email Address', value: normalizeValue_(payload.parentEmail) },
    { label: 'Primary Phone Number', value: normalizeValue_(payload.primaryPhone) },
    { label: 'Alternate Phone Number', value: normalizeValue_(payload.alternatePhone) },
    { label: 'Emergency Contact Name', value: normalizeValue_(payload.emergencyContactName) },
    { label: 'Emergency Relationship', value: normalizeValue_(payload.emergencyRelationship) },
    { label: 'Emergency Contact Email', value: normalizeValue_(payload.emergencyEmail) },
    { label: 'Emergency Contact Phone', value: normalizeValue_(payload.emergencyPhone) },
    { label: 'Emergency Contact Address', value: emergencyAddress },
    { label: 'Participant(s)', value: normalizeValue_(payload.participantNames) },
  ];

  return rows.filter((row) => normalizeValue_(row.value));
}

function buildRegistrationResponseAttachment_(payload) {
  const responseRows = buildRegistrationResponseRows_(payload);
  if (!responseRows.length) return null;

  const parentName = normalizeValue_(payload.parentName) || 'Parent/Guardian';
  const participantNames = normalizeValue_(payload.participantNames) || 'Participant';
  const registrationId = normalizeValue_(payload.registrationSubmissionId) || 'N/A';
  const exportedAt = formatEmailTimestamp_(new Date());
  const responseTableHtml = responseRows.map(function(row) {
    const label = escapeHtml_(normalizeValue_(row.label) || 'Question');
    const value = escapeHtml_(normalizeValue_(row.value) || 'â€”');
    return '<tr>'
      + '<td style="padding:10px 12px;border-bottom:1px solid #e7e1d6;font-size:12px;font-weight:700;color:#1d2f40;vertical-align:top;">' + label + '</td>'
      + '<td style="padding:10px 12px;border-bottom:1px solid #e7e1d6;font-size:12px;color:#22313f;vertical-align:top;">' + value + '</td>'
      + '</tr>';
  }).join('');

  const html = ''
    + '<!doctype html><html><head><meta charset="utf-8"><title>MLS GO Registration Summary</title>'
    + '<style>'
    + 'body { font-family: Arial, sans-serif; margin: 0; background: #f7f4ef; color: #22313f; }'
    + '.page { width: 100%; margin: 0 auto; background: #ffffff; }'
    + '.header { background: linear-gradient(90deg, #1d2f40 0%, #3d5a72 100%); color: #ffffff; padding: 28px 32px; }'
    + '.brand { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 700; opacity: 0.9; }'
    + 'h1 { margin: 12px 0 6px; font-size: 28px; line-height: 1.2; color: #ffffff; }'
    + '.subhead { margin: 0; font-size: 13px; color: rgba(255,255,255,0.8); }'
    + '.content { padding: 24px 32px 18px; }'
    + '.meta { margin: 0 0 18px; padding: 14px 16px; border: 1px solid #e7e1d6; background: #faf7f1; border-radius: 10px; }'
    + '.meta-row { margin: 4px 0; font-size: 12px; color: #22313f; }'
    + '.meta-label { font-weight: 700; color: #1d2f40; }'
    + 'table { width: 100%; border-collapse: collapse; border: 1px solid #e7e1d6; border-radius: 10px; overflow: hidden; }'
    + 'th { text-align: left; background: #f3efe9; color: #1d2f40; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }'
    + 'td { border-bottom: 1px solid #e7e1d6; }'
    + '.footer { margin-top: 18px; padding-top: 12px; border-top: 1px solid #e7e1d6; font-size: 11px; color: #586574; }'
    + '</style></head><body>'
    + '<div class="page">'
    + '<div class="header">'
    + '<div class="brand">LifePrep Academy Foundation</div>'
    + '<h1>MLS GO Registration Summary</h1>'
    + '<p class="subhead">Prepared for ' + escapeHtml_(parentName) + '</p>'
    + '</div>'
    + '<div class="content">'
    + '<div class="meta">'
    + '<div class="meta-row"><span class="meta-label">Participant(s):</span> ' + escapeHtml_(participantNames) + '</div>'
    + '<div class="meta-row"><span class="meta-label">Registration ID:</span> ' + escapeHtml_(registrationId) + '</div>'
    + '<div class="meta-row"><span class="meta-label">Exported:</span> ' + escapeHtml_(exportedAt) + '</div>'
    + '</div>'
    + '<table>'
    + '<tr><th style="width: 38%;">Question</th><th style="width: 62%;">Response</th></tr>'
    + responseTableHtml
    + '</table>'
    + '<div class="footer">MLS GO registration summary generated by LifePrep Academy Foundation.</div>'
    + '</div>'
    + '</div>'
    + '</body></html>';

  const pdfBlob = HtmlService.createHtmlOutput(html)
    .setTitle('MLS GO Registration Summary')
    .getAs('application/pdf');
  pdfBlob.setName('MLS-GO-Registration-Summary.pdf');
  return pdfBlob;
}

function parseRegistrationFormValues_(values) {
  const candidates = [
    values && values.form_values_json,
    values && values.formValues,
    values && values.response_rows_json,
    values && values.all_response_rows_json,
    values && values.formValuesJson,
    values && values.form_values,
  ];

  for (var i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    if (!candidate) continue;

    if (Array.isArray(candidate)) {
      return candidate.filter(function(row) {
        return normalizeValue_(row && row.value);
      }).map(function(row) {
        return {
          label: normalizeValue_(row && row.label),
          value: normalizeValue_(row && row.value),
        };
      });
    }

    if (typeof candidate === 'string') {
      try {
        const parsed = JSON.parse(candidate);
        if (Array.isArray(parsed)) {
          return parsed.filter(function(row) {
            return normalizeValue_(row && row.value);
          }).map(function(row) {
            return {
              label: normalizeValue_(row && row.label),
              value: normalizeValue_(row && row.value),
            };
          });
        }
      } catch (error) {
        // Ignore malformed payloads and fall back to the default summary.
      }
    }
  }

  return [];
}

function readSheetRowRecord_(sheet, headers, row) {
  const values = sheet.getRange(row, 1, 1, headers.length).getValues()[0];
  const out = {};
  headers.forEach(function(header, index) {
    out[header] = normalizeValue_(values[index]);
  });
  return out;
}

function buildResponseRowsFromRecord_(record, headers, options) {
  const opts = options || {};
  const exclude = opts.exclude || {};
  const rows = [];

  headers.forEach(function(header) {
    if (exclude[header]) return;
    if (/^(Player|Volunteer) Agreement SHA-256$/i.test(header)) return;
    if (/^(Player|Volunteer) Agreement File ID$/i.test(header)) return;

    const value = normalizeValue_(record[header]);
    if (!value) return;
    rows.push({
      label: formatResponseLabel_(header),
      value: formatResponseValue_(header, value),
    });
  });

  return rows;
}

function formatResponseValue_(header, value) {
  if (!value) return '';
  if (isTimestampHeader_(header)) {
    return formatEmailTimestamp_(value);
  }
  if (isDobHeader_(header)) {
    return formatDobValue_(value);
  }
  return normalizeValue_(value);
}

function formatResponseLabel_(header) {
  const raw = String(header || '').trim();
  if (!raw) return '';

  const withSpaces = raw
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  return withSpaces.replace(/\b\w/g, function(ch) {
    return ch.toUpperCase();
  });
}

function formatEmailTimestamp_(value) {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return normalizeValue_(value);

  return Utilities.formatDate(date, Session.getScriptTimeZone(), SHEET_TIMESTAMP_FORMAT);
}

function escapeHtml_(value) {
  return String(value || '').replace(/[&<>"']/g, function(char) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char];
  });
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function json_(payload, status) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
