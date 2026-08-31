function getPlayers_() { return getSheetRecords_(CONTINUE_CONFIG.PLAYERS_SHEET); }
function getScholarships_() { return getSheetRecords_(CONTINUE_CONFIG.SCHOLARSHIPS_SHEET); }
function getVolunteers_() { return getSheetRecords_(CONTINUE_CONFIG.VOLUNTEERS_SHEET); }
function getCoaches_() { return getSheetRecords_(CONTINUE_CONFIG.COACHES_SHEET); }

function getSheetRecords_(sheetName) {
  const ss = SpreadsheetApp.openById(CONTINUE_CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) return [];

  const values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getDisplayValues();
  const headers = values[0].map(normalize_);

  return values.slice(1).map(function(row, index) {
    if (!row.some(function(value) { return normalize_(value); })) return null;
    const record = { _row: index + 2, _sheet: sheetName };
    headers.forEach(function(header, column) {
      if (header) record[header] = row[column] || '';
    });
    return record;
  }).filter(Boolean);
}

function getPlayerChildren_(record) {
  const count = Math.max(1, Math.min(4, Number(record.player_count) || 1));
  const children = [];

  for (let index = 1; index <= count; index += 1) {
    const first = normalize_(record['player_' + index + '_first_name']);
    const last = normalize_(record['player_' + index + '_last_name']);
    if (!first && !last) continue;

    const dob = normalizeDateKey_(record['player_' + index + '_dob']);
    children.push({
      index: index,
      firstName: first,
      lastName: last,
      displayName: [first, last].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim(),
      dob: dob,
      nameKey: childNameKey_(first, last),
      exactKey: childExactKey_(first, last, dob),
      registrationId: normalize_(record.registration_submission_id),
      sourceRow: record._row,
    });
  }

  return children;
}

function isExcludedPlayerRecord_(record) {
  if (!record) return true;
  const id = normalize_(record.registration_submission_id);
  if (!id) return true;
  if (/^test_reg_/i.test(id)) return true;
  if (normalize_(record['Continuation Test Sandbox']).toUpperCase() === 'YES') return true;
  return CONTINUE_CONFIG.EXCLUDED_REGISTRATION_IDS.indexOf(id) >= 0;
}

function getCaseMemberPlayers_(caseRecord) {
  const ids = splitCsv_(caseRecord.member_registration_ids);
  const byId = {};
  getPlayers_().forEach(function(record) {
    byId[normalize_(record.registration_submission_id)] = record;
  });
  return ids.map(function(id) { return byId[id] || null; }).filter(Boolean);
}

function findOrCreateCaseForPlayerRow_(rowNumber) {
  const player = findPlayerByRow_(rowNumber);
  if (!player) throw new Error('Players row ' + rowNumber + ' does not exist.');
  if (isExcludedPlayerRecord_(player)) throw new Error('The selected row is excluded from live continuation.');

  const registrationId = normalize_(player.registration_submission_id);
  let found = getSheetRecords_(CONTINUE_CONFIG.CASES_SHEET).find(function(caseRecord) {
    return splitCsv_(caseRecord.member_registration_ids).indexOf(registrationId) >= 0;
  });
  if (found) return found;

  CONTINUE_buildOrRefreshCases();
  found = getSheetRecords_(CONTINUE_CONFIG.CASES_SHEET).find(function(caseRecord) {
    return splitCsv_(caseRecord.member_registration_ids).indexOf(registrationId) >= 0;
  });
  if (!found) throw new Error('No continuation case could be created for Players row ' + rowNumber + '.');
  return found;
}

function findCaseById_(caseId) {
  const target = normalize_(caseId);
  return getSheetRecords_(CONTINUE_CONFIG.CASES_SHEET).find(function(record) {
    return normalize_(record.case_id) === target;
  }) || null;
}

function findPlayerByRow_(rowNumber) {
  const target = Number(rowNumber);
  return getPlayers_().find(function(record) { return record._row === target; }) || null;
}

function findPlayerByRegistrationId_(registrationId) {
  const target = normalize_(registrationId);
  if (!target) return null;
  return getPlayers_().find(function(record) {
    return normalize_(record.registration_submission_id) === target;
  }) || null;
}

function resolveCanonicalPlayerForCase_(caseRecord) {
  const id = normalize_(
    caseRecord.completion_owner_registration_id ||
    caseRecord.canonical_registration_id ||
    caseRecord.recommended_canonical_registration_id
  );
  return id ? findPlayerByRegistrationId_(id) : null;
}

function caseIsCompleted_(caseRecord) {
  const status = normalize_(caseRecord.status).toLowerCase();
  return status === 'completed' ||
    status === 'withdrawn' ||
    Boolean(normalize_(caseRecord.completion_locked_at));
}

function updateCase_(rowNumber, updates) {
  const ss = SpreadsheetApp.openById(CONTINUE_CONFIG.SPREADSHEET_ID);
  const sheet = requireSheet_(ss, CONTINUE_CONFIG.CASES_SHEET);
  updates.updated_at = timestamp_();
  setFieldsByHeader_(sheet, rowNumber, updates);
}

function markClusterRows_(caseRecord, updates) {
  splitCsv_(caseRecord.member_registration_ids).forEach(function(registrationId) {
    const player = findPlayerByRegistrationId_(registrationId);
    if (player) setPlayerFields_(player._row, updates);
  });
}

function setPlayerFields_(rowNumber, updates) {
  const ss = SpreadsheetApp.openById(CONTINUE_CONFIG.SPREADSHEET_ID);
  const sheet = requireSheet_(ss, CONTINUE_CONFIG.PLAYERS_SHEET);
  ensureHeaders_(sheet, Object.keys(updates));
  setFieldsByHeader_(sheet, rowNumber, updates);
}

function setFieldsByHeader_(sheet, rowNumber, updates) {
  ensureHeaders_(sheet, Object.keys(updates));
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(normalize_);
  const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn());
  const values = row.getValues()[0];

  Object.keys(updates).forEach(function(header) {
    const index = headers.indexOf(header);
    if (index < 0) throw new Error('Missing header: ' + header);
    values[index] = safeSheetValue_(updates[header]);
  });
  row.setValues([values]);
}

function ensureHeaders_(sheet, needed) {
  let lastColumn = Math.max(1, sheet.getLastColumn());
  let headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].map(normalize_);
  let changed = false;

  needed.forEach(function(header) {
    if (headers.indexOf(header) < 0) {
      headers.push(header);
      changed = true;
    }
  });

  if (changed) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function getOrCreateSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function requireSheet_(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Required sheet not found: ' + name);
  return sheet;
}

function assertSetup_() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty(CONTINUE_PROPERTY_KEYS.TOKEN_SECRET) ||
      !props.getProperty(CONTINUE_PROPERTY_KEYS.WORKER_SHARED_SECRET)) {
    throw new Error('Run CONTINUE_setup() first.');
  }
}

function getWebAppUrl_() {
  const props = PropertiesService.getScriptProperties();
  const configured = normalize_(props.getProperty(CONTINUE_PROPERTY_KEYS.WEB_APP_URL));
  const sourceConfigured = normalize_(CONTINUE_CONFIG.WEB_APP_URL);
  const detected = normalize_(ScriptApp.getService().getUrl());
  const candidates = [configured, sourceConfigured, detected];

  for (let i = 0; i < candidates.length; i += 1) {
    const url = candidates[i];
    if (/^https:\/\/script\.google\.com\/(?:a\/[^/]+\/)?macros\/s\/[^/]+\/exec$/i.test(url)) {
      return url;
    }
  }
  return '';
}

function assertReadyToSend_() {
  assertSetup_();
  if (!getWebAppUrl_()) {
    throw new Error('Deploy this Apps Script project as a Web App before sending continuation emails.');
  }
}

function isJsonPost_(e) {
  return normalize_(e && e.postData && e.postData.type).toLowerCase().indexOf('application/json') >= 0;
}

function jsonOutput_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function audit_(caseId, event, record, details, testMode) {
  const ss = SpreadsheetApp.openById(CONTINUE_CONFIG.SPREADSHEET_ID);
  const sheet = getOrCreateSheet_(ss, CONTINUE_CONFIG.AUDIT_SHEET);
  ensureHeaders_(sheet, CONTINUE_AUDIT_HEADERS);
  sheet.appendRow([
    timestamp_(),
    caseId || '',
    event || '',
    record ? normalize_(record.registration_submission_id) : '',
    record ? record._row : '',
    record ? normalize_(record.parent_email) : '',
    JSON.stringify(details || {}),
    testMode ? 'TRUE' : 'FALSE',
  ]);
}

function buildContactCandidatesForCase_(caseRecord) {
  const raw = [];
  getCaseMemberPlayers_(caseRecord).forEach(function(record) {
    const email = normalizeEmail_(record.parent_email);
    if (!isEmail_(email)) return;
    raw.push({
      email: email,
      name: [record.parent_first_name, record.parent_last_name].map(normalize_).filter(Boolean).join(' '),
      nameKey: normalizeNameKey_(record.parent_first_name + ' ' + record.parent_last_name),
      count: 1,
      submittedAt: dateMillis_(record.submitted_at),
    });
  });

  const byEmail = {};
  raw.forEach(function(item) {
    if (!byEmail[item.email]) byEmail[item.email] = Object.assign({}, item);
    else {
      byEmail[item.email].count += 1;
      if (item.submittedAt > byEmail[item.email].submittedAt) {
        byEmail[item.email].submittedAt = item.submittedAt;
        if (item.name) byEmail[item.email].name = item.name;
      }
    }
  });

  let candidates = Object.keys(byEmail).map(function(email) { return byEmail[email]; });
  const removed = new Set();

  // Collapse an obvious one-character email typo when the parent name and domain
  // match and another spelling occurs more often in the same case.
  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const a = candidates[i];
      const b = candidates[j];
      if (!a.nameKey || a.nameKey !== b.nameKey) continue;
      const ap = splitEmail_(a.email);
      const bp = splitEmail_(b.email);
      if (!ap || !bp || ap.domain !== bp.domain) continue;
      if (levenshtein_(ap.local, bp.local) > 1) continue;

      const keep = a.count === b.count
        ? (a.submittedAt >= b.submittedAt ? a : b)
        : (a.count > b.count ? a : b);
      const drop = keep === a ? b : a;
      removed.add(drop.email);
    }
  }

  candidates = candidates.filter(function(item) { return !removed.has(item.email); });
  return candidates.sort(function(a, b) {
    if (b.count !== a.count) return b.count - a.count;
    return b.submittedAt - a.submittedAt;
  });
}

function findContactCandidate_(caseRecord, email) {
  const target = normalizeEmail_(email);
  return buildContactCandidatesForCase_(caseRecord).find(function(item) {
    return item.email === target;
  }) || null;
}

function getLatestPlayerForEmail_(caseRecord, email) {
  const target = normalizeEmail_(email);
  return getCaseMemberPlayers_(caseRecord)
    .filter(function(record) { return normalizeEmail_(record.parent_email) === target; })
    .sort(function(a, b) { return dateMillis_(b.submitted_at) - dateMillis_(a.submitted_at); })[0] || null;
}

function appendNote_(existing, note) {
  const current = normalize_(existing);
  const addition = normalize_(note);
  if (!addition) return current;
  if (!current) return addition;
  if (current.indexOf(addition) >= 0) return current;
  return current + ' | ' + addition;
}

function normalize_(value) { return value === undefined || value === null ? '' : String(value).trim(); }
function normalizeEmail_(value) { return normalize_(value).toLowerCase(); }
function normalizePhone_(value) {
  let digits = normalize_(value).replace(/\D/g, '');
  if (digits.length === 11 && digits.charAt(0) === '1') digits = digits.slice(1);
  return digits;
}
function normalizeNameKey_(value) { return normalize_(value).toLowerCase().replace(/[^a-z0-9]+/g, ''); }
function normalizeAddressKey_(record) {
  return [record.parent_street, record.parent_apt, record.parent_city, record.parent_state, record.parent_zip]
    .map(function(value) { return normalize_(value).toLowerCase().replace(/[^a-z0-9]+/g, ''); })
    .join('|');
}
function normalizeDateKey_(value) {
  const parts = parseDateParts_(value);
  if (!parts) return normalize_(value).replace(/\D/g, '');
  return parts.year + '-' + pad2_(parts.month) + '-' + pad2_(parts.day);
}
function normalizeDateForForm_(value) {
  const parts = parseDateParts_(value);
  if (!parts) return normalize_(value);
  return pad2_(parts.month) + '/' + pad2_(parts.day) + '/' + parts.year;
}
function parseDateParts_(value) {
  const text = normalize_(value);
  if (!text) return null;

  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  if (match) return validDateParts_(Number(match[1]), Number(match[2]), Number(match[3]));

  match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (match) return validDateParts_(Number(match[3]), Number(match[1]), Number(match[2]));

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return validDateParts_(date.getFullYear(), date.getMonth() + 1, date.getDate());
}
function validDateParts_(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) return null;
  return { year: year, month: month, day: day };
}
function pad2_(value) { return ('0' + Number(value)).slice(-2); }
function childNameKey_(first, last) {
  const key = normalizeNameKey_(first + ' ' + last);
  return key ? 'name:' + key : '';
}
function childExactKey_(first, last, dob) {
  const key = normalizeNameKey_(first + ' ' + last);
  return key ? 'child:' + key + ':' + normalize_(dob) : '';
}

function canonicalContinuationChildKey_(value) {
  const text = normalize_(value);
  if (!text) return '';

  if (/^name:/i.test(text)) {
    const normalized = normalizeNameKey_(text.replace(/^name:/i, ''));
    return normalized ? 'name:' + normalized : '';
  }

  if (/^child:/i.test(text)) {
    const body = text.replace(/^child:/i, '');
    const lastColon = body.lastIndexOf(':');
    const namePart = lastColon >= 0 ? body.slice(0, lastColon) : body;
    const normalized = normalizeNameKey_(namePart);
    return normalized ? 'name:' + normalized : '';
  }

  const normalized = normalizeNameKey_(text);
  return normalized ? 'name:' + normalized : '';
}

function normalizeContinuationChildKeys_(values) {
  return unique_((values || []).map(canonicalContinuationChildKey_).filter(Boolean));
}

function getCaseCandidateChildren_(caseRecord) {
  const byNameKey = {};
  getCaseMemberPlayers_(caseRecord).forEach(function(record) {
    getPlayerChildren_(record).forEach(function(child) {
      const key = canonicalContinuationChildKey_(child.nameKey);
      if (!key) return;
      const current = byNameKey[key];
      if (!current || dateMillis_(record.submitted_at) > current.submittedAt) {
        byNameKey[key] = {
          key: key,
          displayName: child.displayName,
          submittedAt: dateMillis_(record.submitted_at),
        };
      }
    });
  });

  return Object.keys(byNameKey).map(function(key) {
    return { key: key, displayName: byNameKey[key].displayName };
  }).sort(function(a, b) {
    return a.displayName.localeCompare(b.displayName);
  });
}

function splitCsv_(value) { return normalize_(value).split(',').map(normalize_).filter(Boolean); }
function splitPipe_(value) { return normalize_(value).split('|').map(normalize_).filter(Boolean); }
function unique_(values) { return Array.from(new Set((values || []).filter(Boolean))); }
function isEmail_(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalize_(value)); }
function safeSheetValue_(value) {
  if (value instanceof Date) return value;
  const text = normalize_(value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}
function timestamp_() { return Utilities.formatDate(new Date(), 'America/Indianapolis', 'M/d/yyyy h:mm:ss a'); }
function dateMillis_(value) {
  const millis = Date.parse(normalize_(value));
  return Number.isFinite(millis) ? millis : 0;
}
function sha256Hex_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.newBlob(String(value)).getBytes())
    .map(function(byte) {
      const number = byte < 0 ? byte + 256 : byte;
      return ('0' + number.toString(16)).slice(-2);
    }).join('');
}
function escapeHtml_(value) {
  return normalize_(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function stripHtml_(html) {
  return normalize_(html).replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}
function errorMessage_(error) { return String(error && error.message ? error.message : error || 'Unexpected error.'); }
function splitEmail_(email) {
  const match = normalizeEmail_(email).match(/^([^@]+)@(.+)$/);
  return match ? { local: match[1], domain: match[2] } : null;
}
function levenshtein_(a, b) {
  a = String(a || '');
  b = String(b || '');
  const matrix = [];
  for (let i = 0; i <= b.length; i += 1) matrix[i] = [i];
  for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}
function modeValue_(values) {
  const cleaned = (values || []).map(normalize_).filter(Boolean);
  if (!cleaned.length) return '';
  const counts = {};
  cleaned.forEach(function(value) {
    const key = value.toLowerCase();
    if (!counts[key]) counts[key] = { count: 0, latestValue: value };
    counts[key].count += 1;
    counts[key].latestValue = value;
  });
  return Object.keys(counts).sort(function(a, b) { return counts[b].count - counts[a].count; })[0]
    ? counts[Object.keys(counts).sort(function(a, b) { return counts[b].count - counts[a].count; })[0]].latestValue
    : '';
}
