const SHEET_ID = '1EIG6F00-mVhT9ws0nS3pJBrp9Y2mPH87p6UyLkWtKT4';
const SHEET_NAMES = {
  PLAYERS: 'Players',
  VOLUNTEERS: 'Volunteers',
  COACHES: 'Coaches',
  ERRORS: 'Errors',
};

const PLAYER_HEADERS = [
  'submitted_at',
  'form_type',
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
];

const VOLUNTEER_HEADERS = [
  'submittedAt',
  'form_type',
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
  'roles',
  'hasExperience',
  'experienceSummary',
  'availabilityNotes',
  'agreement',
  'signature',
  'linkedParentEmail',
];

const COACH_HEADERS = [
  'submittedAt',
  'form_type',
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
];

const ERROR_HEADERS = [
  'submitted_at',
  'form_type',
  'reason',
  'payload',
];

const FORM_CONFIG = {
  mls_registration: {
    sheetName: SHEET_NAMES.PLAYERS,
    headers: PLAYER_HEADERS,
  },
  volunteer_application: {
    sheetName: SHEET_NAMES.VOLUNTEERS,
    headers: VOLUNTEER_HEADERS,
  },
  coaching_application: {
    sheetName: SHEET_NAMES.COACHES,
    headers: COACH_HEADERS,
  },
};

function doPost(e) {
  if (!e || !e.parameter) {
    initializeSheets();
    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, initialized: true, note: 'No POST payload provided; headers initialized.' }),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const values = parseValues_(e);
  const formType = normalizeValue_(values.form_type);
  const config = getFormConfig_(formType, true);

  if (!config) {
    const errorSheet = getSheet_(SHEET_NAMES.ERRORS);
    ensureHeaders_(errorSheet, ERROR_HEADERS);
    errorSheet.appendRow([
      new Date().toISOString(),
      formType,
      'Unknown form_type',
      safeStringify_(values),
    ]);

    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'Unknown form_type' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = getSheet_(config.sheetName);

  ensureHeaders_(sheet, config.headers);
  const row = config.headers.map((header) => normalizeValue_(values[header]));
  sheet.appendRow(row);

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseValues_(e) {
  const source = (e && e.parameter) || {};
  return source;
}

function getFormConfig_(formType, strict) {
  if (FORM_CONFIG[formType]) return FORM_CONFIG[formType];
  if (strict) return null;
  return FORM_CONFIG.mls_registration;
}

function initializeSheets() {
  const players = getSheet_(SHEET_NAMES.PLAYERS);
  ensureHeaders_(players, PLAYER_HEADERS);

  const volunteers = getSheet_(SHEET_NAMES.VOLUNTEERS);
  ensureHeaders_(volunteers, VOLUNTEER_HEADERS);

  const coaches = getSheet_(SHEET_NAMES.COACHES);
  ensureHeaders_(coaches, COACH_HEADERS);

  const errors = getSheet_(SHEET_NAMES.ERRORS);
  ensureHeaders_(errors, ERROR_HEADERS);
}

function getSheet_(sheetName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  return ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
}

function ensureHeaders_(sheet, headers) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < headers.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return;
  }

  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0].map(String);
  const matches = headers.every((header, index) => current[index] === header);
  if (!matches) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

function normalizeValue_(value) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.join(', ');
  return String(value).trim();
}

function safeStringify_(value) {
  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
}