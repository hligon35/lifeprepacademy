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

const SCHOLARSHIP_HEADERS = [
  'submitted_at',
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
  'participant_names',
  'scholarship_terms_status',
  'scholarship_terms_sent_at',
  'scholarship_terms_accepted_at',
  'scholarship_terms_parent_name',
  'scholarship_terms_participant_names',
  'scholarship_terms_grades',
  'scholarship_terms_version',
  'scholarship_terms_acceptance_id',
  'scholarship_terms_document_url',
  'scholarship_terms_document_file_id',
  'scholarship_terms_document_created_at',
  'scholarship_terms_document_participant_count',
  'scholarship_terms_error',
];

const SCHOLARSHIP_TRACKING_HEADERS = [
  'scholarship_terms_status',
  'scholarship_terms_sent_at',
  'scholarship_terms_accepted_at',
  'scholarship_terms_parent_name',
  'scholarship_terms_participant_names',
  'scholarship_terms_grades',
  'scholarship_terms_version',
  'scholarship_terms_acceptance_id',
  'scholarship_terms_document_url',
  'scholarship_terms_document_file_id',
  'scholarship_terms_document_created_at',
  'scholarship_terms_document_participant_count',
  'scholarship_terms_error',
];

const SCHOLARSHIP_TERMS_CONFIG = Object.freeze({
  SCHOLARSHIPS_SHEET: SHEET_NAMES.SCHOLARSHIPS,
  PLAYERS_SHEET: SHEET_NAMES.PLAYERS,
  TIME_ZONE: 'America/Indianapolis',
  DOCUMENT_VERSION: '1.0',
  EMAIL_COPY_VERSION: '3.0',
  TOKEN_VALID_DAYS: 60,
  TEST_EMAIL: TEST_SEND_RECIPIENT,
  PREVIEW_SCHOLARSHIP_ROW: 2,
  TEMPLATE_DOCUMENT_ID: '1JW5mgQ9TPu5BSmYZnl8SHy4yT4_mWzu7jPN34csvJZo',
  AGREEMENT_FOLDER_NAME: 'Paducah GO Scholarship Agreements',
  EMAIL_SUBJECT: 'Paducah GO Soccer Scholarship Guidelines - Acceptance Required',
  SENDER_NAME: 'Paducah GO Soccer',
  BANNER_URL: REGISTRATION_BANNER_URL,
  PROGRAM_URL: EMAIL_FOOTER_LINK_URL,
  REQUIRED_SOURCE_HEADERS: [
    'registration_submission_id',
    'parent_first_name',
    'parent_last_name',
    'parent_email',
    'participant_names',
  ],
});

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

  const scholarshipToken = normalizeValue_(e.parameter.t);
  if (scholarshipToken) {
    try {
      const payload = scholarshipVerifyToken_(scholarshipToken);
      const record = scholarshipGetAcceptanceRecord_(payload);
      return HtmlService.createHtmlOutput(scholarshipBuildTermsPageCopyV3_(scholarshipToken, record))
        .setTitle('Paducah GO Soccer Scholarship Guidelines')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
    } catch (error) {
      return HtmlService.createHtmlOutput(scholarshipBuildErrorPage_(error))
        .setTitle('Scholarship Link Error');
    }
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
  if (action === 'accept_scholarship_application') {
    return handleScholarshipAcceptance_(e.parameter);
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

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getSheet_(config.sheetName);
    ensureHeaders_(sheet, config.headers);

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
      return json_({ ok: true, upserted: true, updatedExistingRow: true, row: existingRow });
    }

    applyPendingAgreementDefaults_(rowValues, config.headers, formType);

    sheet.appendRow(rowValues);
    const insertedRow = sheet.getLastRow();
    sendInternalSubmissionNotification_(formType, config, values, rowValues);

    return json_({ ok: true, upserted: true, updatedExistingRow: false, row: insertedRow });
  } finally {
    lock.releaseLock();
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
    ensureHeaders_(sheet, config.headers);

    const row = findRowBySubmissionId_(sheet, config.headers, config.idColumn, submissionId);
    if (row <= 0) {
      return json_({ ok: false, error: 'Matching row not found' }, 404);
    }

    const headerIndex = buildHeaderIndex_(config.headers);
    const columnNames =
      formType === 'mls_registration' ? PLAYER_AGREEMENT_COLUMNS : VOLUNTEER_AGREEMENT_COLUMNS;

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

    Object.keys(agreementValues).forEach((header) => {
      const col = headerIndex[header];
      if (!col) return;
      sheet.getRange(row, col).setValue(formatSheetValue_(header, agreementValues[header]));
    });

    return json_({ ok: true, updated: true, row });
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

function handleScholarshipAcceptance_(values) {
  const expected = PropertiesService.getScriptProperties().getProperty('AGREEMENT_UPDATE_TOKEN') || '';
  const provided = normalizeValue_(values.update_token || values.token || values.agreement_update_token);
  if (!expected || provided !== expected) {
    return json_({ ok: false, error: 'Unauthorized update token' }, 403);
  }

  const registrationId = normalizeValue_(values.registration_submission_id || values.submission_id || values.registrationSubmissionId || values.submissionId);
  const parentEmail = normalizeValue_(values.parent_email || values.email).toLowerCase();
  if (!registrationId) {
    return json_({ ok: false, error: 'Missing registration_submission_id' }, 400);
  }
  if (!parentEmail || !isValidEmail_(parentEmail)) {
    return json_({ ok: false, error: 'Invalid parent_email' }, 400);
  }

  try {
    const result = acceptScholarshipSubmission_({
      registrationId: registrationId,
      parentEmail: parentEmail,
      parentName: normalizeValue_(values.parent_name),
      participantNames: normalizeValue_(values.participant_names),
      clientInfo: {
        source: 'registration-flow',
      },
    });

    return json_({
      ok: true,
      acceptedAt: result.acceptedAt,
      acceptanceId: result.acceptanceId,
      documentUrl: result.documentUrl,
      participantDocumentCount: result.participantDocumentCount,
      alreadyAccepted: result.alreadyAccepted === true,
    });
  } catch (error) {
    writeError_('scholarship_application', 'Scholarship acceptance failed', {
      registration_submission_id: registrationId,
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
  const submissionId = normalizeValue_(payload.registrationSubmissionId || payload.submissionId);
  const email = normalizeValue_(payload.parentEmail).toLowerCase();
  if (!submissionId) throw new Error('Missing registration submission id for scholarship email.');
  if (!email || !isValidEmail_(email)) throw new Error('Invalid scholarship recipient email.');

  const sheet = getSheet_(SHEET_NAMES.SCHOLARSHIPS);
  ensureHeaders_(sheet, SCHOLARSHIP_HEADERS);
  const row = findRowBySubmissionId_(sheet, SCHOLARSHIP_HEADERS, 'registration_submission_id', submissionId);
  if (row <= 0) throw new Error('Matching scholarship row not found.');

  const record = readSheetRowRecord_(sheet, SCHOLARSHIP_HEADERS, row);
  const map = scholarshipHeaderMap_(SCHOLARSHIP_HEADERS);
  const status = normalizeValue_(record.scholarship_terms_status).toLowerCase();
  if (status === 'accepted') {
    return { sent: false, accepted: true, duplicate: true };
  }
  if (status === 'sent') {
    return { sent: false, duplicate: true };
  }

  const emailRecord = {
    registrationId: submissionId,
    parentName: normalizeValue_(payload.parentName) || `${normalizeValue_(record.parent_first_name)} ${normalizeValue_(record.parent_last_name)}`.trim() || 'Parent/Guardian',
    parentEmail: email,
    participantNames: normalizeValue_(payload.participantNames) || normalizeValue_(record.participant_names),
    grades: scholarshipGetGradesForRegistration_(submissionId),
    test: false,
  };
  emailRecord.acceptanceUrl = scholarshipBuildAcceptanceUrl_(emailRecord);

  scholarshipSendEmailCopyV3_(emailRecord, SCHOLARSHIP_TERMS_CONFIG.EMAIL_SUBJECT);
  scholarshipSetRowFields_(sheet, row, map, {
    scholarship_terms_status: 'Sent',
    scholarship_terms_sent_at: new Date(),
    scholarship_terms_parent_name: emailRecord.parentName,
    scholarship_terms_participant_names: emailRecord.participantNames,
    scholarship_terms_grades: emailRecord.grades,
    scholarship_terms_version: SCHOLARSHIP_TERMS_CONFIG.DOCUMENT_VERSION,
    scholarship_terms_error: '',
  });

  return { sent: true, acceptanceUrl: emailRecord.acceptanceUrl };
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
  ensureHeaders_(getSheet_(SHEET_NAMES.PLAYERS), PLAYER_HEADERS);
  ensureHeaders_(getSheet_(SHEET_NAMES.SCHOLARSHIPS), SCHOLARSHIP_HEADERS);
  ensureHeaders_(getSheet_(SHEET_NAMES.VOLUNTEERS), VOLUNTEER_HEADERS);
  ensureHeaders_(getSheet_(SHEET_NAMES.COACHES), COACH_HEADERS);
  ensureHeaders_(getSheet_(SHEET_NAMES.ERRORS), ERROR_HEADERS);
  ensureHeaders_(getSheet_(EMAIL_TRACKING_SHEET_NAME), EMAIL_TRACKING_HEADERS);
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
  const scholarshipColumns = formType === 'scholarship_application' ? SCHOLARSHIP_TRACKING_HEADERS : [];

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

  scholarshipColumns.forEach((header) => {
    const col = index[header];
    if (!col) return;
    const existingValue = normalizeValue_(existingRecord && existingRecord[header]);
    const incomingValue = normalizeValue_(rowValues[col - 1]);
    if (!incomingValue && existingValue) {
      rowValues[col - 1] = existingValue;
    }
  });
}

function SCHOLARSHIP_setup() {
  const sheet = getSheet_(SHEET_NAMES.SCHOLARSHIPS);
  ensureHeaders_(sheet, SCHOLARSHIP_HEADERS);
  scholarshipGetSigningSecret_();
  SpreadsheetApp.openById(SHEET_ID).toast(
    'Scholarship acceptance tracking is ready.',
    'Paducah GO Soccer',
    8
  );
}

function SCHOLARSHIP_sendUpdatedEmailTestV3() {
  const email = SCHOLARSHIP_TERMS_CONFIG.TEST_EMAIL || Session.getActiveUser().getEmail();
  if (!email) throw new Error('Set TEST_EMAIL in SCHOLARSHIP_TERMS_CONFIG.');

  const record = {
    registrationId: 'UPDATED-COPY-V3-' + Utilities.getUuid(),
    parentName: 'Test Parent',
    parentEmail: email,
    participantNames: 'Jordan Sample and Taylor Sample',
    grades: '2nd/3rd Grade and 4th/5th Grade',
    test: true,
  };
  record.acceptanceUrl = scholarshipBuildAcceptanceUrl_(record);
  scholarshipSendEmailCopyV3_(
    record,
    '[UPDATED EMAIL COPY V3] ' + SCHOLARSHIP_TERMS_CONFIG.EMAIL_SUBJECT
  );
  return {
    ok: true,
    emailCopyVersion: SCHOLARSHIP_TERMS_CONFIG.EMAIL_COPY_VERSION,
    sentTo: email,
    acceptanceUrl: record.acceptanceUrl,
  };
}

function SCHOLARSHIP_generateCombinedDocumentPreviewFromRow() {
  const previewRow = Number(SCHOLARSHIP_TERMS_CONFIG.PREVIEW_SCHOLARSHIP_ROW);
  const previewRecipient = SCHOLARSHIP_TERMS_CONFIG.TEST_EMAIL || Session.getActiveUser().getEmail();
  if (!previewRecipient) throw new Error('Set TEST_EMAIL in SCHOLARSHIP_TERMS_CONFIG.');
  if (!Number.isInteger(previewRow) || previewRow < 2) {
    throw new Error('PREVIEW_SCHOLARSHIP_ROW must be a sheet row number of 2 or greater.');
  }

  const sheet = getSheet_(SHEET_NAMES.SCHOLARSHIPS);
  ensureHeaders_(sheet, SCHOLARSHIP_HEADERS);
  if (previewRow > sheet.getLastRow()) {
    throw new Error('Scholarships row ' + previewRow + ' does not contain a record.');
  }

  const row = readSheetRowRecord_(sheet, SCHOLARSHIP_HEADERS, previewRow);
  const registrationId = normalizeValue_(row.registration_submission_id);
  const parentName = `${normalizeValue_(row.parent_first_name)} ${normalizeValue_(row.parent_last_name)}`.trim();
  const parentEmail = normalizeValue_(row.parent_email).toLowerCase();
  const parentPhone = normalizeValue_(row.parent_phone);
  const participantNames = normalizeValue_(row.participant_names);
  const participantRecords = scholarshipGetParticipantRecords_(registrationId, participantNames);
  if (!registrationId || !parentName || !parentEmail || !participantRecords.length) {
    throw new Error('The selected row does not have enough data to generate a preview.');
  }

  const documentRecord = scholarshipCreateCombinedTemplateDocument_({
    registrationId: registrationId,
    parentName: parentName,
    parentEmail: parentEmail,
    parentPhone: parentPhone,
    participantRecords: participantRecords,
    acceptedAt: new Date(),
    acceptanceId: 'PREVIEW-' + Utilities.getUuid(),
    clientInfo: {},
    preview: true,
  });

  sendBrandedEmail_({
    to: previewRecipient,
    subject: '[PREVIEW DOCUMENT] Paducah GO Scholarship Record for ' + parentName,
    body: 'A combined scholarship document preview was created for ' + parentName +
      '. It contains ' + participantRecords.length +
      ' filled template copy/copies.\n\nOpen the preview: ' + documentRecord.url,
    htmlBody: buildBrandedSubmissionEmailHtml_({
      title: 'Scholarship Document Preview Ready',
      greeting: 'A combined scholarship document preview was created for ' + parentName + '.',
      message: 'Open the preview document: ' + documentRecord.url,
    }),
    name: SCHOLARSHIP_TERMS_CONFIG.SENDER_NAME,
    replyTo: EMAIL_REPLY_TO,
  });

  return {
    ok: true,
    previewRow: previewRow,
    parentName: parentName,
    participantCount: participantRecords.length,
    documentUrl: documentRecord.url,
    sentTo: previewRecipient,
    sheetUpdated: false,
  };
}

function SCHOLARSHIP_submitAcceptance(token, accepted, clientInfo) {
  if (accepted !== true) {
    throw new Error('You must check the acceptance box before submitting.');
  }

  const payload = scholarshipVerifyToken_(String(token || ''));
  if (payload.test === true) {
    return {
      ok: true,
      test: true,
      message: 'Test successful. No scholarship row was changed.',
    };
  }

  return acceptScholarshipSubmission_({
    registrationId: payload.registrationId,
    parentEmail: payload.email,
    clientInfo: clientInfo || {},
  });
}

function acceptScholarshipSubmission_(input) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getSheet_(SHEET_NAMES.SCHOLARSHIPS);
    ensureHeaders_(sheet, SCHOLARSHIP_HEADERS);
    const rowNumber = scholarshipFindRowByRegistrationAndEmail_(sheet, input.registrationId, input.parentEmail);
    if (rowNumber < 2) throw new Error('The matching scholarship record was not found.');

    const map = scholarshipHeaderMap_(SCHOLARSHIP_HEADERS);
    const scholarshipRow = readSheetRowRecord_(sheet, SCHOLARSHIP_HEADERS, rowNumber);
    const currentStatus = normalizeValue_(sheet.getRange(rowNumber, map.scholarship_terms_status + 1).getValue());
    const parentName = normalizeValue_(input.parentName) || `${normalizeValue_(scholarshipRow.parent_first_name)} ${normalizeValue_(scholarshipRow.parent_last_name)}`.trim();
    const participantNames = normalizeValue_(input.participantNames) || normalizeValue_(scholarshipRow.participant_names);
    const parentPhone = normalizeValue_(scholarshipRow.parent_phone);
    const participantRecords = scholarshipGetParticipantRecords_(input.registrationId, participantNames);
    const grades = participantRecords.map(function(participant) {
      return participant.grade;
    }).filter(Boolean).join(', ');

    let acceptedAt = currentStatus.toLowerCase() === 'accepted'
      ? sheet.getRange(rowNumber, map.scholarship_terms_accepted_at + 1).getValue()
      : new Date();
    if (!(acceptedAt instanceof Date) || isNaN(acceptedAt.getTime())) acceptedAt = new Date();

    let acceptanceId = currentStatus.toLowerCase() === 'accepted'
      ? normalizeValue_(sheet.getRange(rowNumber, map.scholarship_terms_acceptance_id + 1).getValue())
      : '';
    if (!acceptanceId) acceptanceId = Utilities.getUuid();

    const existingDocumentUrl = normalizeValue_(sheet.getRange(rowNumber, map.scholarship_terms_document_url + 1).getValue());
    if (currentStatus.toLowerCase() === 'accepted' && existingDocumentUrl) {
      return {
        ok: true,
        alreadyAccepted: true,
        acceptedAt: Utilities.formatDate(
          acceptedAt,
          SCHOLARSHIP_TERMS_CONFIG.TIME_ZONE,
          'M/d/yyyy h:mm a'
        ),
        acceptanceId: acceptanceId,
        documentUrl: existingDocumentUrl,
        participantDocumentCount: participantRecords.length,
      };
    }

    let documentRecord;
    try {
      documentRecord = scholarshipCreateCombinedTemplateDocument_({
        registrationId: input.registrationId,
        parentName: parentName,
        parentEmail: input.parentEmail,
        parentPhone: parentPhone,
        participantRecords: participantRecords,
        acceptedAt: acceptedAt,
        acceptanceId: acceptanceId,
        clientInfo: input.clientInfo || {},
        preview: false,
      });
    } catch (documentError) {
      scholarshipSetRowFields_(sheet, rowNumber, map, {
        scholarship_terms_error: 'Document generation failed: ' + String(documentError.message || documentError),
      });
      throw documentError;
    }

    scholarshipSetRowFields_(sheet, rowNumber, map, {
      scholarship_terms_status: 'Accepted',
      scholarship_terms_accepted_at: acceptedAt,
      scholarship_terms_parent_name: parentName,
      scholarship_terms_participant_names: participantNames,
      scholarship_terms_grades: grades,
      scholarship_terms_version: SCHOLARSHIP_TERMS_CONFIG.DOCUMENT_VERSION,
      scholarship_terms_acceptance_id: acceptanceId,
      scholarship_terms_document_url: documentRecord.url,
      scholarship_terms_document_file_id: documentRecord.fileId,
      scholarship_terms_document_created_at: documentRecord.createdAt,
      scholarship_terms_document_participant_count: participantRecords.length,
      scholarship_terms_error: '',
    });

    return {
      ok: true,
      acceptedAt: Utilities.formatDate(
        acceptedAt,
        SCHOLARSHIP_TERMS_CONFIG.TIME_ZONE,
        'M/d/yyyy h:mm a'
      ),
      acceptanceId: acceptanceId,
      documentUrl: documentRecord.url,
      participantDocumentCount: participantRecords.length,
    };
  } finally {
    lock.releaseLock();
  }
}

function scholarshipBuildAcceptanceUrl_(record) {
  const serviceUrl = normalizeValue_(ScriptApp.getService().getUrl());
  if (!serviceUrl) throw new Error('The Web app has not been deployed.');
  const now = Date.now();
  const payload = {
    registrationId: record.registrationId,
    email: record.parentEmail,
    test: record.test === true,
    previewRealRow: record.previewRealRow === true,
    iat: now,
    exp: now + SCHOLARSHIP_TERMS_CONFIG.TOKEN_VALID_DAYS * 24 * 60 * 60 * 1000,
    nonce: Utilities.getUuid(),
  };
  return serviceUrl + '?t=' + encodeURIComponent(scholarshipCreateToken_(payload));
}

function scholarshipGetAcceptanceRecord_(payload) {
  if (payload.test === true) {
    return {
      registrationId: payload.registrationId,
      parentName: 'Test Parent',
      parentEmail: payload.email,
      participantNames: 'Jordan Sample and Taylor Sample',
      grades: '2nd/3rd Grade and 4th/5th Grade',
      status: 'Test',
      acceptedAt: '',
      test: true,
    };
  }

  const sheet = getSheet_(SHEET_NAMES.SCHOLARSHIPS);
  ensureHeaders_(sheet, SCHOLARSHIP_HEADERS);
  const rowNumber = scholarshipFindRowByRegistrationAndEmail_(sheet, payload.registrationId, payload.email);
  if (rowNumber < 2) throw new Error('The scholarship record associated with this link was not found.');

  const row = readSheetRowRecord_(sheet, SCHOLARSHIP_HEADERS, rowNumber);
  return {
    registrationId: payload.registrationId,
    parentName: `${normalizeValue_(row.parent_first_name)} ${normalizeValue_(row.parent_last_name)}`.trim(),
    parentEmail: normalizeValue_(row.parent_email),
    participantNames: normalizeValue_(row.participant_names),
    grades: scholarshipGetGradesForRegistration_(payload.registrationId),
    status: normalizeValue_(row.scholarship_terms_status),
    acceptedAt: scholarshipDisplayDate_(sheet.getRange(rowNumber, scholarshipHeaderMap_(SCHOLARSHIP_HEADERS).scholarship_terms_accepted_at + 1).getValue()),
    test: false,
  };
}

function scholarshipSendEmailCopyV3_(record, subject) {
  const safeParentName = escapeHtml_(record.parentName || 'Parent/Guardian');
  const safeParticipants = escapeHtml_(record.participantNames);
  const safeUrl = escapeHtml_(record.acceptanceUrl);
  const html = '<!doctype html><html><body style="margin:0;background:#f3f6f4;font-family:Arial,sans-serif;color:#18251f;">'
    + '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6f4;padding:24px 10px;"><tr><td align="center">'
    + '<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 5px 20px rgba(20,45,34,.10);">'
    + '<tr><td><img src="' + escapeHtml_(SCHOLARSHIP_TERMS_CONFIG.BANNER_URL) + '" alt="Paducah GO Soccer" width="600" style="display:block;width:100%;height:auto;border:0;"></td></tr>'
    + '<tr><td style="padding:30px 34px 34px;">'
    + '<h1 style="margin:0 0 14px;font-size:25px;line-height:1.25;color:#173F7A;">Review your scholarship guidelines</h1>'
    + '<p style="margin:0 0 14px;line-height:1.6;">Hello ' + safeParentName + ',</p>'
    + '<p style="margin:0 0 14px;line-height:1.6;">Thank you for applying for a Paducah GO Soccer scholarship for <strong>' + safeParticipants + '</strong>.</p>'
    + '<p style="margin:0 0 14px;line-height:1.6;">To continue the scholarship process, please review and accept the Paducah GO Soccer Scholarship Guidelines. Your personalized agreement has already been completed with the parent or guardian and participant information provided in your scholarship application.</p>'
    + '<p style="margin:0 0 22px;line-height:1.6;">Please use the link below to review and accept the agreement at your earliest convenience:</p>'
    + '<table role="presentation" cellspacing="0" cellpadding="0"><tr><td bgcolor="#0B5D3B" style="border-radius:7px;">'
    + '<a href="' + safeUrl + '" style="display:inline-block;padding:14px 23px;color:#fff;text-decoration:none;font-weight:bold;font-size:15px;">Review and Accept Scholarship Guidelines</a>'
    + '</td></tr></table>'
    + '<p style="margin:24px 0 0;line-height:1.6;">If you have any questions or need assistance, please contact us.</p>'
    + '<p style="margin:18px 0 0;line-height:1.6;">Thank you,<br><strong>Paducah GO Soccer</strong><br>LifePrep Academy Foundation</p>'
    + '</td></tr></table></td></tr></table></body></html>';

  const plain = [
    'Hello ' + (record.parentName || 'Parent/Guardian') + ',',
    '',
    'Thank you for applying for a Paducah GO Soccer scholarship for ' + record.participantNames + '.',
    '',
    'To continue the scholarship process, please review and accept the Paducah GO Soccer Scholarship Guidelines. Your personalized agreement has already been completed with the parent or guardian and participant information provided in your scholarship application.',
    '',
    'Please use the link below to review and accept the agreement at your earliest convenience:',
    '',
    'Review and accept: ' + record.acceptanceUrl,
    '',
    'If you have any questions or need assistance, please contact us.',
    '',
    'Thank you,',
    'Paducah GO Soccer',
    'LifePrep Academy Foundation',
  ].join('\n');

  sendBrandedEmail_({
    to: record.parentEmail,
    subject: subject,
    body: plain,
    htmlBody: html,
    name: SCHOLARSHIP_TERMS_CONFIG.SENDER_NAME,
    replyTo: EMAIL_REPLY_TO,
  });
}

function scholarshipBuildTermsPageCopyV3_(token, record) {
  const accepted = normalizeValue_(record.status).toLowerCase() === 'accepted';
  const parentName = escapeHtml_(record.parentName || 'Parent/Guardian');
  const participants = escapeHtml_(record.participantNames || 'Participant');
  const grades = escapeHtml_(record.grades || 'Not provided');
  const tokenJson = JSON.stringify(String(token || '')).replace(/</g, '\\u003c');
  const alreadyAccepted = accepted
    ? '<div class="success"><strong>Accepted.</strong> This agreement was accepted on ' + escapeHtml_(record.acceptedAt || 'a previous date') + '.</div>'
    : '';
  const submitArea = accepted
    ? ''
    : '<div class="acceptance"><label><input id="acceptBox" type="checkbox">'
      + '<span>I am <strong>' + parentName + '</strong>, the parent or guardian of <strong>' + participants + '</strong>. I have read, understand, and accept the Paducah GO Soccer Scholarship Guidelines.</span></label>'
      + '<button id="submitButton" type="button" disabled>Accept Scholarship Guidelines</button>'
      + '<div id="message" role="status" aria-live="polite"></div></div>';

  return '<!doctype html>'
    + '<html><head><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<style>'
    + '*{box-sizing:border-box}body{margin:0;background:#eef3f0;color:#1d2f28;font-family:Arial,sans-serif;line-height:1.62}'
    + '.page{max-width:820px;margin:28px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(20,45,34,.12)}'
    + '.banner{display:block;width:100%;height:auto}.content{padding:34px 44px 42px}'
    + 'h1{margin:0 0 16px;color:#173f7a;font-size:30px;line-height:1.2}h2{margin:28px 0 10px;color:#173f7a;font-size:21px}'
    + 'p{margin:0 0 14px}.lead{font-size:16px}.coverage{padding:14px 16px;background:#f3f8f5;border-left:4px solid #0b5d3b;border-radius:6px}'
    + 'ul{margin:8px 0 16px;padding-left:24px}li{margin:0 0 11px}.identity{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:22px 0;padding:18px;background:#f7f8fa;border:1px solid #d9e0dc;border-radius:8px}'
    + '.field span{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#66736d;font-weight:bold}.field strong{display:block;margin-top:4px;font-size:16px;color:#172c23}'
    + '.acceptance{margin-top:28px;padding:20px;border:2px solid #0b5d3b;border-radius:10px;background:#f7fbf8}.acceptance label{display:flex;gap:12px;align-items:flex-start;cursor:pointer}.acceptance input{width:22px;height:22px;margin-top:2px;flex:none}'
    + 'button{margin-top:18px;padding:14px 22px;border:0;border-radius:7px;background:#0b5d3b;color:#fff;font-size:16px;font-weight:bold;cursor:pointer}button:disabled{background:#97aaa1;cursor:not-allowed}'
    + '#message{margin-top:14px;font-weight:bold}.success{margin:20px 0;padding:16px;border-radius:8px;background:#e6f4ea;color:#175c2e;border:1px solid #a8d5b5}.error{color:#9b1c1c}'
    + '.footer{margin-top:28px;padding-top:18px;border-top:1px solid #dfe6e2;color:#66736d;font-size:13px}'
    + '@media(max-width:650px){.page{margin:0;border-radius:0}.content{padding:26px 20px 34px}.identity{grid-template-columns:1fr}h1{font-size:26px}}'
    + '</style></head><body>'
    + '<main class="page">'
    + '<img class="banner" src="' + escapeHtml_(SCHOLARSHIP_TERMS_CONFIG.BANNER_URL) + '" alt="LifePrep Academy Foundation and Paducah GO Soccer">'
    + '<div class="content">'
    + '<h1>Paducah GO Soccer Scholarship Guidelines</h1>'
    + '<p class="lead">We understand that families may face unexpected challenges, which is why Paducah GO Soccer offers this scholarship to ensure that financial hardship does not prevent a child from participating. To keep the scholarship program fair and available to all children, recipients and their families are expected to follow the participation, school attendance, conduct, and communication guidelines outlined below.</p>'
    + '<p class="coverage"><strong>The scholarship covers the full $75 registration fee.</strong> It is intended for children who would otherwise be unable to participate because of the cost.</p>'
    + '<h2>Who can receive a scholarship</h2>'
    + '<ul>'
    + '<li><strong>Grade and school:</strong> The child is enrolled in grade K-12 at a public school in Paducah or the surrounding area.</li>'
    + '<li><strong>Financial need:</strong> A parent or guardian confirms that paying the $75 fee would be a hardship. No detailed financial records are required.</li>'
    + '<li><strong>Registration:</strong> The family completes the scholarship request and all regular player registration forms.</li>'
    + '<li><strong>Availability:</strong> Scholarships are awarded while scholarship funds and team spaces are available. One scholarship may be awarded per child, per season.</li>'
    + '</ul>'
    + '<p>Scholarships are not based on soccer ability, school grades, or prior playing experience.</p>'
    + '<h2>Guidelines for continuing through the season</h2>'
    + '<ul>'
    + '<li><strong>School attendance:</strong> The child should maintain at least 80% attendance in school. Excused absences for illness, disability, family emergencies, or other approved reasons will not count against the child.</li>'
    + '<li><strong>School conduct:</strong> The child should make a reasonable effort to learn without becoming an ongoing disruption to themselves or others.</li>'
    + '<li><strong>Respect:</strong> The child should behave respectfully toward parents and guardians, teachers, coaches, officials, teammates, and other families.</li>'
    + '<li><strong>Soccer participation:</strong> The player should attend practices and games regularly, with a goal of attending at least 75% of scheduled activities.</li>'
    + '<li><strong>Communication:</strong> A parent or guardian should notify the coach when the player will be absent.</li>'
    + '<li><strong>Inactive players:</strong> If the player stops attending and the family does not respond after reasonable contact attempts, the program may release the roster spot to another child.</li>'
    + '</ul>'
    + '<p>A scholarship will not be taken away because of an illness, emergency, transportation problem, disability-related need, or another reasonable hardship when the family communicates with the program.</p>'
    + '<h2>Family acknowledgment</h2>'
    + '<p>By accepting the scholarship, the family agrees to make a good-faith effort to help the player participate for the full season and to stay in contact with the coach.</p>'
    + '<div class="identity">'
    + '<div class="field"><span>Player(s)</span><strong>' + participants + '</strong></div>'
    + '<div class="field"><span>Grade(s)</span><strong>' + grades + '</strong></div>'
    + '<div class="field"><span>Parent or Guardian</span><strong>' + parentName + '</strong></div>'
    + '<div class="field"><span>Document version</span><strong>' + escapeHtml_(SCHOLARSHIP_TERMS_CONFIG.DOCUMENT_VERSION) + '</strong></div>'
    + '</div>'
    + alreadyAccepted
    + submitArea
    + '<div class="footer">Paducah GO Soccer - LifePrep Academy Foundation</div>'
    + '</div></main>'
    + '<script>(function(){var token=' + tokenJson + ';var box=document.getElementById("acceptBox");var button=document.getElementById("submitButton");var message=document.getElementById("message");if(!box||!button)return;box.addEventListener("change",function(){button.disabled=!box.checked;});button.addEventListener("click",function(){if(!box.checked)return;button.disabled=true;button.textContent="Submitting...";message.textContent="";message.className="";var clientInfo={userAgent:navigator.userAgent,timeZone:(Intl.DateTimeFormat().resolvedOptions().timeZone||"")};google.script.run.withSuccessHandler(function(result){message.textContent=result.test?result.message:("Accepted successfully on "+result.acceptedAt+".");message.className="success";box.disabled=true;button.style.display="none";}).withFailureHandler(function(error){message.textContent=(error&&error.message)?error.message:"The agreement could not be submitted.";message.className="error";button.disabled=false;button.textContent="Accept Scholarship Guidelines";}).SCHOLARSHIP_submitAcceptance(token,true,clientInfo);});})();</script>'
    + '</body></html>';
}

function scholarshipBuildErrorPage_(error) {
  return '<!doctype html><html><body style="margin:0;background:#eef3f0;font-family:Arial,sans-serif;color:#1d2f28;">'
    + '<div style="max-width:650px;margin:50px auto;padding:30px;background:#fff;border-radius:12px;box-shadow:0 6px 24px rgba(20,45,34,.12);">'
    + '<h1 style="color:#9b1c1c;">This scholarship link cannot be opened</h1>'
    + '<p>' + escapeHtml_(String(error.message || error)) + '</p>'
    + '<p>Please contact Paducah GO Soccer for a new personalized link.</p></div></body></html>';
}

function scholarshipCreateToken_(payload) {
  const body = Utilities.base64EncodeWebSafe(
    JSON.stringify(payload),
    Utilities.Charset.UTF_8
  ).replace(/=+$/g, '');
  const signature = scholarshipSign_(body);
  return body + '.' + signature;
}

function scholarshipVerifyToken_(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) throw new Error('The link is incomplete.');
  const expected = scholarshipSign_(parts[0]);
  if (!scholarshipConstantTimeEquals_(expected, parts[1])) throw new Error('The link signature is invalid.');

  let payload;
  try {
    payload = JSON.parse(
      Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString()
    );
  } catch (_error) {
    throw new Error('The link data is invalid.');
  }
  if (!payload.exp || Date.now() > Number(payload.exp)) throw new Error('This link has expired.');
  if (!payload.registrationId || !payload.email) throw new Error('This link is missing required information.');
  return payload;
}

function scholarshipSign_(value) {
  const bytes = Utilities.computeHmacSha256Signature(
    String(value),
    scholarshipGetSigningSecret_(),
    Utilities.Charset.UTF_8
  );
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/g, '');
}

function scholarshipConstantTimeEquals_(a, b) {
  a = String(a || '');
  b = String(b || '');
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    difference |= (a.charCodeAt(i % Math.max(a.length, 1)) || 0) ^ (b.charCodeAt(i % Math.max(b.length, 1)) || 0);
  }
  return difference === 0;
}

function scholarshipGetSigningSecret_() {
  const properties = PropertiesService.getScriptProperties();
  let secret = properties.getProperty('SCHOLARSHIP_ACCEPTANCE_SECRET');
  if (!secret) {
    secret = Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid();
    properties.setProperty('SCHOLARSHIP_ACCEPTANCE_SECRET', secret);
  }
  return secret;
}

function scholarshipCreateCombinedTemplateDocument_(record) {
  if (!record.participantRecords || !record.participantRecords.length) {
    throw new Error('No participants were found for the scholarship document.');
  }

  const templateFile = DriveApp.getFileById(SCHOLARSHIP_TERMS_CONFIG.TEMPLATE_DOCUMENT_ID);
  const folder = scholarshipGetAgreementFolder_();
  const dateStamp = Utilities.formatDate(
    record.acceptedAt,
    SCHOLARSHIP_TERMS_CONFIG.TIME_ZONE,
    'yyyy-MM-dd'
  );
  const safeParent = scholarshipSafeFilePart_(record.parentName || 'Parent');
  const safeRegistration = scholarshipSafeFilePart_(record.registrationId || 'Registration');
  const prefix = record.preview ? 'PREVIEW - ' : '';
  const outputName = prefix + 'Paducah GO Scholarship - ' + safeParent + ' - ' + safeRegistration + ' - ' + dateStamp;
  const outputFile = templateFile.makeCopy(outputName, folder);
  const outputDocument = DocumentApp.openById(outputFile.getId());

  try {
    const outputBody = outputDocument.getBody();
    scholarshipFillTemplateAcknowledgment_(
      outputBody,
      record.participantRecords[0],
      record.parentName,
      record.acceptedAt
    );

    for (let index = 1; index < record.participantRecords.length; index += 1) {
      const temporaryFile = templateFile.makeCopy(
        'TEMP Scholarship Template - ' + Utilities.getUuid(),
        folder
      );
      try {
        const temporaryDocument = DocumentApp.openById(temporaryFile.getId());
        const temporaryBody = temporaryDocument.getBody();
        scholarshipFillTemplateAcknowledgment_(
          temporaryBody,
          record.participantRecords[index],
          record.parentName,
          record.acceptedAt
        );

        outputBody.appendPageBreak();
        scholarshipAppendCopiedBody_(outputBody, temporaryBody);
        temporaryDocument.saveAndClose();
      } finally {
        temporaryFile.setTrashed(true);
      }
    }

    outputDocument.saveAndClose();
    outputFile.setDescription(
      'Completed Paducah GO Soccer scholarship guidelines for ' +
      record.parentName + ' and ' + record.participantRecords.length +
      ' participant(s).'
    );

    return {
      url: outputFile.getUrl(),
      fileId: outputFile.getId(),
      createdAt: new Date(),
      participantCount: record.participantRecords.length,
    };
  } catch (error) {
    try {
      outputFile.setTrashed(true);
    } catch (_cleanupError) {
      // Ignore cleanup failures for incomplete previews.
    }
    throw error;
  }
}

function scholarshipFillTemplateAcknowledgment_(body, participant, parentName, acceptedAt) {
  const dateText = Utilities.formatDate(
    acceptedAt,
    SCHOLARSHIP_TERMS_CONFIG.TIME_ZONE,
    'MMMM d, yyyy'
  );
  const divisionText = scholarshipDivisionLabel_(participant.grade, participant.gender);
  scholarshipWritePlayerLine_(
    body,
    participant.name || 'Not provided',
    divisionText || 'Not provided'
  );
  scholarshipWriteParentLine_(body, parentName || 'Not provided', dateText);
}

function scholarshipWritePlayerLine_(body, playerName, grade) {
  const match = body.findText('Player:\\s*_{2,}');
  if (!match) throw new Error('The Player acknowledgment line was not found.');

  const text = match.getElement().asText();
  const fieldWidths = scholarshipExtractLineFieldWidths_(
    text.getText(),
    /Player:\s*(_+)(\s+Grade:\s*)(_+)/,
    32,
    14
  );
  const normalizedPlayer = scholarshipLineValue_(playerName);
  const normalizedGrade = scholarshipLineValue_(grade);
  const playerField = scholarshipLineFieldText_(normalizedPlayer, fieldWidths.primary);
  const gradeField = scholarshipLineFieldText_(normalizedGrade, fieldWidths.secondary);
  const playerPrefix = 'Player: ';
  const gradePrefix = '     Grade: ';
  const line = playerPrefix + playerField + gradePrefix + gradeField;
  const attributes = text.getText().length ? text.getAttributes(0) : {};

  text.setText(line);
  if (line.length) text.setAttributes(0, line.length - 1, attributes);
  text.setUnderline(0, line.length - 1, false);
  if (normalizedPlayer.length) {
    text.setUnderline(
      playerPrefix.length,
      playerPrefix.length + normalizedPlayer.length - 1,
      true
    );
  }
  const gradeStart = playerPrefix.length + playerField.length + gradePrefix.length;
  if (normalizedGrade.length) {
    text.setUnderline(gradeStart, gradeStart + normalizedGrade.length - 1, true);
  }
}

function scholarshipWriteParentLine_(body, parentName, dateText) {
  const match = body.findText('Parent/Guardian:\\s*_{2,}');
  if (!match) throw new Error('The Parent/Guardian acknowledgment line was not found.');

  const text = match.getElement().asText();
  const fieldWidths = scholarshipExtractLineFieldWidths_(
    text.getText(),
    /Parent\/Guardian:\s*(_+)(\s+Date:\s*)(_+)/,
    30,
    18
  );
  const normalizedParent = scholarshipLineValue_(parentName);
  const normalizedDate = scholarshipLineValue_(dateText);
  const parentField = scholarshipLineFieldText_(normalizedParent, fieldWidths.primary);
  const dateField = scholarshipLineFieldText_(normalizedDate, fieldWidths.secondary);
  const parentPrefix = 'Parent/Guardian: ';
  const datePrefix = '     Date: ';
  const line = parentPrefix + parentField + datePrefix + dateField;
  const attributes = text.getText().length ? text.getAttributes(0) : {};

  text.setText(line);
  if (line.length) text.setAttributes(0, line.length - 1, attributes);
  text.setUnderline(0, line.length - 1, false);
  if (normalizedParent.length) {
    text.setUnderline(
      parentPrefix.length,
      parentPrefix.length + normalizedParent.length - 1,
      true
    );
  }
  const dateStart = parentPrefix.length + parentField.length + datePrefix.length;
  if (normalizedDate.length) {
    text.setUnderline(dateStart, dateStart + normalizedDate.length - 1, true);
  }
}

function scholarshipLineValue_(value) {
  return normalizeValue_(value).replace(/[\r\n]+/g, ' ');
}

function scholarshipDivisionLabel_(grade, gender) {
  const normalizedGrade = scholarshipLineValue_(grade);
  const normalizedGender = scholarshipLineValue_(gender);
  if (!normalizedGrade) return normalizedGender;
  if (/\b(boys|girls)\b/i.test(normalizedGrade)) return normalizedGrade;
  if (/^(male|boy|boys)$/i.test(normalizedGender)) return normalizedGrade + ' Boys';
  if (/^(female|girl|girls)$/i.test(normalizedGender)) return normalizedGrade + ' Girls';
  return normalizedGrade;
}

function scholarshipExtractLineFieldWidths_(line, pattern, fallbackPrimary, fallbackSecondary) {
  const match = String(line || '').match(pattern);
  return {
    primary: match && match[1] ? match[1].length : fallbackPrimary,
    secondary: match && match[3] ? match[3].length : fallbackSecondary,
  };
}

function scholarshipLineFieldText_(normalizedValue, minimumWidth) {
  const paddingLength = Math.max(Number(minimumWidth) - normalizedValue.length, 2);
  return normalizedValue + '_'.repeat(paddingLength);
}

function scholarshipAppendCopiedBody_(destinationBody, sourceBody) {
  for (let index = 0; index < sourceBody.getNumChildren(); index += 1) {
    const child = sourceBody.getChild(index).copy();
    const type = child.getType();
    if (type === DocumentApp.ElementType.PARAGRAPH) {
      destinationBody.appendParagraph(child.asParagraph());
    } else if (type === DocumentApp.ElementType.LIST_ITEM) {
      destinationBody.appendListItem(child.asListItem());
    } else if (type === DocumentApp.ElementType.TABLE) {
      destinationBody.appendTable(child.asTable());
    } else if (type === DocumentApp.ElementType.PAGE_BREAK) {
      destinationBody.appendPageBreak();
    } else if (type === DocumentApp.ElementType.HORIZONTAL_RULE) {
      destinationBody.appendHorizontalRule();
    }
  }
}

function scholarshipGetParticipantRecords_(registrationId, fallbackNames) {
  const sheet = getSheet_(SHEET_NAMES.PLAYERS);
  ensureHeaders_(sheet, PLAYER_HEADERS);
  const rowNumber = findRowBySubmissionId_(sheet, PLAYER_HEADERS, 'registration_submission_id', registrationId);
  const participants = [];

  if (rowNumber > 0) {
    const playerRow = readSheetRowRecord_(sheet, PLAYER_HEADERS, rowNumber);
    for (let index = 1; index <= 4; index += 1) {
      const firstName = normalizeValue_(playerRow['player_' + index + '_first_name']);
      const lastName = normalizeValue_(playerRow['player_' + index + '_last_name']);
      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      if (!fullName) continue;
      participants.push({
        name: fullName,
        grade: normalizeValue_(playerRow['player_' + index + '_grade']),
        gender: normalizeValue_(playerRow['player_' + index + '_gender']),
      });
    }
  }

  if (participants.length) return participants;

  const fallbackGrades = scholarshipGetGradesForRegistration_(registrationId)
    .split(',').map(function(value) {
      return normalizeValue_(value);
    }).filter(Boolean);
  return scholarshipSplitParticipantNames_(fallbackNames).map(function(name, index) {
    return { name: name, grade: fallbackGrades[index] || '' };
  });
}

function scholarshipSplitParticipantNames_(value) {
  const normalized = normalizeValue_(value);
  if (!normalized) return [];
  return normalized
    .replace(/\s+(?:and|&)\s+/gi, '\n')
    .split(/[\n;,]+/)
    .map(function(entry) {
      return normalizeValue_(entry);
    })
    .filter(Boolean);
}

function scholarshipGetAgreementFolder_() {
  const properties = PropertiesService.getScriptProperties();
  const propertyKey = 'SCHOLARSHIP_AGREEMENT_FOLDER_ID';
  const savedId = properties.getProperty(propertyKey);
  if (savedId) {
    try {
      return DriveApp.getFolderById(savedId);
    } catch (_savedFolderError) {
      properties.deleteProperty(propertyKey);
    }
  }

  const folders = DriveApp.getFoldersByName(SCHOLARSHIP_TERMS_CONFIG.AGREEMENT_FOLDER_NAME);
  const folder = folders.hasNext()
    ? folders.next()
    : DriveApp.createFolder(SCHOLARSHIP_TERMS_CONFIG.AGREEMENT_FOLDER_NAME);
  properties.setProperty(propertyKey, folder.getId());
  return folder;
}

function scholarshipSafeFilePart_(value) {
  const cleaned = String(value || '')
    .replace(/[\\/:*?"<>|#%{}~&]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.substring(0, 80) || 'Record';
}

function scholarshipGetGradesForRegistration_(registrationId) {
  const sheet = getSheet_(SHEET_NAMES.PLAYERS);
  ensureHeaders_(sheet, PLAYER_HEADERS);
  const rowNumber = findRowBySubmissionId_(sheet, PLAYER_HEADERS, 'registration_submission_id', registrationId);
  if (rowNumber < 2) return '';

  const row = readSheetRowRecord_(sheet, PLAYER_HEADERS, rowNumber);
  const grades = [];
  for (let i = 1; i <= 4; i += 1) {
    const grade = normalizeValue_(row['player_' + i + '_grade']);
    if (grade && grades.indexOf(grade) === -1) grades.push(grade);
  }
  return grades.join(', ');
}

function scholarshipFindRowByRegistrationAndEmail_(sheet, registrationId, email) {
  ensureHeaders_(sheet, SCHOLARSHIP_HEADERS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const values = sheet.getRange(2, 1, lastRow - 1, SCHOLARSHIP_HEADERS.length).getValues();
  for (let i = 0; i < values.length; i += 1) {
    const rowRecord = {};
    SCHOLARSHIP_HEADERS.forEach(function(header, columnIndex) {
      rowRecord[header] = normalizeValue_(values[i][columnIndex]);
    });
    if (
      normalizeValue_(rowRecord.registration_submission_id) === normalizeValue_(registrationId) &&
      normalizeValue_(rowRecord.parent_email).toLowerCase() === normalizeValue_(email).toLowerCase()
    ) {
      return i + 2;
    }
  }
  return -1;
}

function scholarshipHeaderMap_(headers) {
  return headers.reduce(function(map, header, index) {
    const key = String(header || '').trim();
    if (key) map[key] = index;
    return map;
  }, {});
}

function scholarshipSetRowFields_(sheet, rowNumber, map, values) {
  Object.keys(values).forEach(function(header) {
    if (typeof map[header] === 'undefined') throw new Error('Missing tracking header: ' + header);
    sheet.getRange(rowNumber, map[header] + 1).setValue(values[header]);
  });
}

function scholarshipDisplayDate_(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return Utilities.formatDate(
    date,
    SCHOLARSHIP_TERMS_CONFIG.TIME_ZONE,
    'M/d/yyyy h:mm a'
  );
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
    return HtmlService.createHtmlOutput('<html><head><meta http-equiv="refresh" content="0;url=' + escapeHtml_(targetUrl) + '"></head><body>Redirecting…</body></html>');
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
    const value = escapeHtml_(normalizeValue_(row.value) || '—');
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
