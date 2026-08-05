const SHEET_ID = '1EIG6F00-mVhT9ws0nS3pJBrp9Y2mPH87p6UyLkWtKT4';
const SHEET_NAME = 'MLS Registration';

const HEADERS = [
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
  'agree_waiver',
  'agree_privacy',
  'agree_marketing',
  'signature',
];

function doPost(e) {
  const sheet = getSheet_();
  ensureHeaders_(sheet);

  const values = parseValues_(e);
  const row = HEADERS.map((header) => values[header] || '');
  sheet.appendRow(row);

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseValues_(e) {
  const source = (e && e.parameter) || {};
  const values = {};

  HEADERS.forEach((header) => {
    values[header] = normalizeValue_(source[header]);
  });

  return values;
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

function ensureHeaders_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn < HEADERS.length) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    return;
  }

  const current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0].map(String);
  const matches = HEADERS.every((header, index) => current[index] === header);
  if (!matches) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function normalizeValue_(value) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.join(', ');
  return String(value).trim();
}