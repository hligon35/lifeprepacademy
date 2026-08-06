const SHEET_ID = '1EIG6F00-mVhT9ws0nS3pJBrp9Y2mPH87p6UyLkWtKT4';

const SHEET_NAMES = {
  PLAYERS: 'Players',
  VOLUNTEERS: 'Volunteers',
  COACHES: 'Coaches',
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
const REGISTRATION_PAYMENT_FALLBACK = 'If the registration fee is not prefilled on the payment page, select Other and enter $75.';

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

const FORM_CONFIG = {
  mls_registration: {
    sheetName: SHEET_NAMES.PLAYERS,
    headers: PLAYER_HEADERS,
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

function doPost(e) {
  if (!e || !e.parameter) {
    initializeSheets();
    return json_({ ok: true, initialized: true });
  }

  const action = normalizeValue_(e.parameter.action);
  if (action === 'update_agreement_metadata') {
    return handleAgreementMetadataUpdate_(e.parameter);
  }
  if (action === 'update_payment_metadata') {
    return handlePaymentMetadataUpdate_(e.parameter);
  }
  if (action === 'get_registration_context') {
    return handleRegistrationContextLookup_(e.parameter);
  }
  if (action === 'send_registration_receipt_email') {
    return handleRegistrationReceiptEmail_(e.parameter);
  }
  if (action === 'send_registration_paid_email') {
    return handleRegistrationPaidEmail_(e.parameter);
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

    const submissionId = normalizeValue_(values[config.idColumn]);
    if (!submissionId) {
      writeError_(formType, `Missing ${config.idColumn}`, values);
      return json_({ ok: false, error: `Missing ${config.idColumn}` }, 400);
    }

    const headerIndex = buildHeaderIndex_(config.headers);
    const rowValues = config.headers.map((header) => sanitizeForSheet_(values[header]));
    applyPendingAgreementDefaults_(rowValues, config.headers, formType);

    const existingRow = findRowBySubmissionId_(sheet, config.headers, config.idColumn, submissionId);
    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, config.headers.length).setValues([rowValues]);
      return json_({ ok: true, upserted: true, updatedExistingRow: true, row: existingRow });
    }

    sheet.appendRow(rowValues);
    const insertedRow = sheet.getLastRow();

    if (formType === 'volunteer_application' || formType === 'coaching_application') {
      try {
        sendVolunteerCoachConfirmationEmail_(formType, values);
      } catch (error) {
        writeError_(formType, 'Volunteer/Coach confirmation email failed', {
          submission_id: submissionId,
          error: String(error && error.message ? error.message : error),
        });
      }
    }

    return json_({ ok: true, upserted: true, updatedExistingRow: false, row: insertedRow });
  } finally {
    lock.releaseLock();
  }
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
      sheet.getRange(row, col).setValue(sanitizeForSheet_(agreementValues[header]));
    });

    return json_({ ok: true, updated: true, row });
  } finally {
    lock.releaseLock();
  }
}

function handleRegistrationPaidEmail_(values) {
  const expected = PropertiesService.getScriptProperties().getProperty('AGREEMENT_UPDATE_TOKEN') || '';
  const provided = normalizeValue_(values.update_token);
  if (!expected || provided !== expected) {
    return json_({ ok: false, error: 'Unauthorized update token' }, 403);
  }

  const parentEmail = normalizeValue_(values.parent_email).toLowerCase();
  if (!parentEmail || !isValidEmail_(parentEmail)) {
    return json_({ ok: false, error: 'Invalid parent_email' }, 400);
  }

  const payload = {
    registrationSubmissionId: normalizeValue_(values.registration_submission_id || values.submission_id),
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
  const provided = normalizeValue_(values.update_token);
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
      sheet.getRange(row, col).setValue(sanitizeForSheet_(paymentValues[header]));
    });

    return json_({ ok: true, updated: true, row });
  } finally {
    lock.releaseLock();
  }
}

function handleRegistrationContextLookup_(values) {
  const expected = PropertiesService.getScriptProperties().getProperty('AGREEMENT_UPDATE_TOKEN') || '';
  const provided = normalizeValue_(values.update_token);
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
    parentEmail: getValue('parent_email'),
    parentName: `${getValue('parent_first_name')} ${getValue('parent_last_name')}`.trim(),
    participantNames: playerNames.join(', '),
    transactionId: getValue('Player Agreement Transaction ID'),
    signedAt: getValue('Player Agreement Signed At'),
    paymentStatus: getValue('Player Payment Status'),
  });
}

function initializeSheets() {
  ensureHeaders_(getSheet_(SHEET_NAMES.PLAYERS), PLAYER_HEADERS);
  ensureHeaders_(getSheet_(SHEET_NAMES.VOLUNTEERS), VOLUNTEER_HEADERS);
  ensureHeaders_(getSheet_(SHEET_NAMES.COACHES), COACH_HEADERS);
  ensureHeaders_(getSheet_(SHEET_NAMES.ERRORS), ERROR_HEADERS);
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

function writeError_(formType, reason, payload) {
  const errorSheet = getSheet_(SHEET_NAMES.ERRORS);
  ensureHeaders_(errorSheet, ERROR_HEADERS);
  errorSheet.appendRow([
    new Date().toISOString(),
    formType || '',
    reason || '',
    safeStringify_(payload || {}),
  ]);
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

function safeStringify_(value) {
  try {
    return JSON.stringify(value);
  } catch (_error) {
    return String(value);
  }
}

function sendRegistrationEmailByStage_(payload, paymentConfirmed) {
  const subject = paymentConfirmed
    ? 'Thank you for completing your MLS GO registration'
    : 'Thank you for registering for MLS GO';
  const htmlBody = paymentConfirmed
    ? buildRegistrationPaidEmailHtml_(payload)
    : buildRegistrationSubmissionEmailHtml_(payload);
  const body = paymentConfirmed
    ? buildRegistrationPaidEmailText_(payload)
    : buildRegistrationSubmissionEmailText_(payload);

  MailApp.sendEmail({
    to: payload.parentEmail,
    subject,
    body,
    htmlBody,
    name: 'LifePrep Academy Foundation',
    replyTo: 'info@lifeprepacademyfoundation.com',
  });
}

function sendVolunteerCoachConfirmationEmail_(formType, values) {
  const email = normalizeValue_(values.email).toLowerCase();
  if (!email || !isValidEmail_(email)) {
    throw new Error('Invalid email for volunteer/coach confirmation');
  }

  const firstName = normalizeValue_(values.firstName);
  const lastName = normalizeValue_(values.lastName);
  const fullName = `${firstName} ${lastName}`.trim() || 'Applicant';
  const isCoach = formType === 'coaching_application';
  const programLabel = isCoach ? 'coaching' : 'volunteer';

  const subject = 'Thank you for your MLS GO application';
  const htmlBody = ''
    + '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
    + '<body style="margin:0;padding:0;background:#f5f2ea;font-family:Arial,sans-serif;color:#22313f">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#f5f2ea">'
    + '<tr><td style="padding:24px 12px">'
    + '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:720px;margin:0 auto;border-collapse:collapse">'
    + '<tr><td style="background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid rgba(34,49,63,0.12)">'
    + '<img src="' + REGISTRATION_BANNER_URL + '" alt="LifePrep Academy Foundation MLS GO" style="display:block;width:100%;height:auto">'
    + '<div style="padding:32px 30px 24px">'
    + '<div style="font-size:12px;line-height:1.2;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#c16a2b;margin:0 0 12px">MLS GO</div>'
    + '<h1 style="margin:0 0 16px;font-size:30px;line-height:1.1;color:#1d2f40">Thank you for applying</h1>'
    + '<p style="margin:0 0 16px;font-size:16px;line-height:1.7">Hello ' + escapeHtml_(fullName) + ',</p>'
    + '<p style="margin:0 0 16px;font-size:16px;line-height:1.7">Thank you for submitting your MLS GO ' + programLabel + ' application. We received your information successfully.</p>'
    + '<p style="margin:0 0 16px;font-size:16px;line-height:1.7">Please keep an eye on your email for updates and next steps from our team.</p>'
    + '<p style="margin:0;font-size:15px;line-height:1.7">If you have any questions, reply to this email or contact <a href="mailto:info@lifeprepacademyfoundation.com" style="color:#1d2f40;font-weight:700;text-decoration:none">info@lifeprepacademyfoundation.com</a>.</p>'
    + '</div>'
    + '</td></tr>'
    + '<tr><td style="padding:16px 8px 0;text-align:center;font-size:12px;line-height:1.6;color:#6b7280">'
    + '<a href="' + BRAND_URL + '" style="color:#1d2f40;font-weight:700;text-decoration:none">' + BRAND_DOMAIN + '</a>'
    + '</td></tr>'
    + '</table>'
    + '</td></tr>'
    + '</table>'
    + '</body></html>';

  const body = [
    'Thank you for your MLS GO application.',
    '',
    `Hello ${fullName},`,
    '',
    `Thank you for submitting your MLS GO ${programLabel} application. We received your information successfully.`,
    'Please keep an eye on your email for updates and next steps from our team.',
    '',
    BRAND_DOMAIN,
  ].join('\n');

  MailApp.sendEmail({
    to: email,
    subject,
    body,
    htmlBody,
    name: 'LifePrep Academy Foundation',
    replyTo: 'info@lifeprepacademyfoundation.com',
  });
}

function buildRegistrationSubmissionEmailHtml_(payload) {
  const parentName = escapeHtml_(payload.parentName || 'Parent/Guardian');
  const participantNames = escapeHtml_(payload.participantNames || 'Your registered participant(s)');
  const signedAt = escapeHtml_(payload.signedAt || '');
  const signedDocumentUrl = escapeHtml_(payload.signedDocumentUrl || BRAND_URL);
  const paymentUrl = escapeHtml_(payload.paymentUrl || BRAND_URL);
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
    + '<p style="margin:0 0 12px;font-size:15px;line-height:1.7">If you have not already paid your registration fee, please submit the program fee of $' + fee + '.</p>'
    + '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px"><tr>'
    + '<td style="border-radius:999px;background:#c16a2b">'
    + '<a href="' + paymentUrl + '" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:700;line-height:1.2;color:#ffffff;text-decoration:none">Pay Registration Fee</a>'
    + '</td></tr></table>'
    + '<p style="margin:0 0 12px;font-size:15px;line-height:1.7">LifePrep Academy Foundation is a nonprofit organization. Your payment may be tax-deductible to the extent permitted by law, and you will receive a payment receipt by email.</p>'
    + '<p style="margin:0;font-size:15px;line-height:1.7">If you have any questions, reply to this email or contact <a href="mailto:info@lifeprepacademyfoundation.com" style="color:#1d2f40;font-weight:700;text-decoration:none">info@lifeprepacademyfoundation.com</a>.</p>'
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
  lines.push('Download signed documents: ' + (payload.signedDocumentUrl || BRAND_URL));
  lines.push('If you have not already paid your registration fee, complete payment: ' + (payload.paymentUrl || BRAND_URL));
  lines.push('');
  lines.push('LifePrep Academy Foundation is a nonprofit organization. Your payment may be tax-deductible to the extent permitted by law, and you will receive a payment receipt by email.');
  lines.push('');
  lines.push(BRAND_DOMAIN);
  return lines.join('\n');
}

function buildRegistrationPaidEmailHtml_(payload) {
  const parentName = escapeHtml_(payload.parentName || 'Parent/Guardian');
  const participantNames = escapeHtml_(payload.participantNames || 'Your registered participant(s)');
  const signedAt = escapeHtml_(payload.signedAt || '');
  const signedDocumentUrl = escapeHtml_(payload.signedDocumentUrl || BRAND_URL);
  const paymentReceiptUrl = escapeHtml_(payload.paymentReceiptUrl || '');
  const paymentPaidAt = escapeHtml_(payload.paymentPaidAt || '');
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
    + '<p style="margin:0 0 12px;font-size:15px;line-height:1.7">We have recorded your registration fee payment of $' + fee + '. LifePrep Academy Foundation is a nonprofit organization, so your payment may be tax-deductible to the extent permitted by law.</p>'
    + '<p style="margin:0;font-size:15px;line-height:1.7">If you have any questions, reply to this email or contact <a href="mailto:info@lifeprepacademyfoundation.com" style="color:#1d2f40;font-weight:700;text-decoration:none">info@lifeprepacademyfoundation.com</a>.</p>'
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
  lines.push('Download signed documents: ' + (payload.signedDocumentUrl || BRAND_URL));
  if (payload.paymentReceiptUrl) {
    lines.push('Payment receipt: ' + payload.paymentReceiptUrl);
  }
  lines.push('');
  lines.push('We have recorded your registration fee payment of $' + (payload.registrationFeeAmount || '75') + '.');
  lines.push('LifePrep Academy Foundation is a nonprofit organization. Your payment may be tax-deductible to the extent permitted by law.');
  lines.push('');
  lines.push(BRAND_DOMAIN);
  return lines.join('\n');
}

function buildRegistrationResponseRows_(payload) {
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
