/**
 * ============================================================
 * MLS GO REGISTRATION
 * 02_Sheets.gs
 * ============================================================
 *
 * Shared spreadsheet utilities.
 *
 * Goals:
 * - locate everything by header NAME
 * - minimize Spreadsheet service calls
 * - write complete rows/ranges in batches
 * - prevent positional-header corruption
 * - safely format dates
 */


/* ============================================================
 * SPREADSHEET CACHE
 * ============================================================
 */

var MLSGO_SPREADSHEET_CACHE_ = null;


function getSpreadsheet_() {
  if (!MLSGO_SPREADSHEET_CACHE_) {
    MLSGO_SPREADSHEET_CACHE_ =
      SpreadsheetApp.openById(
        MLSGO_CONFIG.SHEET_ID
      );
  }

  return MLSGO_SPREADSHEET_CACHE_;
}


function getSheet_(sheetName) {
  const ss = getSpreadsheet_();

  let sheet =
    ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet =
      ss.insertSheet(sheetName);
  }

  return sheet;
}


/* ============================================================
 * LOCK UTILITY
 * ============================================================
 */

function withScriptLock_(callback) {
  const lock =
    LockService.getScriptLock();

  lock.waitLock(
    MLSGO_CONFIG.LOCK_TIMEOUT_MS
  );

  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}


/* ============================================================
 * HEADER HELPERS
 * ============================================================
 */

function normalizeHeaderKey_(value) {
  return normalizeValue_(value)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}


function readActualSheetHeaders_(sheet) {
  const width =
    Math.max(
      sheet.getLastColumn(),
      1
    );

  return sheet
    .getRange(1, 1, 1, width)
    .getValues()[0]
    .map(normalizeValue_);
}


function buildHeaderIndexByName_(headers) {
  return (headers || []).reduce(
    function(index, header, offset) {
      const key =
        normalizeHeaderKey_(header);

      if (key && !index[key]) {
        index[key] = offset + 1;
      }

      return index;
    },
    {}
  );
}


function getHeaderColumnByName_(
  headerIndex,
  header
) {
  return (
    headerIndex[
      normalizeHeaderKey_(header)
    ] || 0
  );
}


/**
 * Never moves or relabels existing columns.
 *
 * Missing required fields are appended to the RIGHT side.
 */
function ensureHeadersByName_(
  sheet,
  requiredHeaders
) {
  let headers =
    readActualSheetHeaders_(sheet);

  let index =
    buildHeaderIndexByName_(headers);

  const missing =
    (requiredHeaders || []).filter(
      function(header) {
        return !getHeaderColumnByName_(
          index,
          header
        );
      }
    );

  if (missing.length) {
    const startColumn =
      Math.max(
        sheet.getLastColumn(),
        0
      ) + 1;

    sheet
      .getRange(
        1,
        startColumn,
        1,
        missing.length
      )
      .setValues([missing]);

    headers =
      readActualSheetHeaders_(sheet);
  }

  if (sheet.getFrozenRows() !== 1) {
    sheet.setFrozenRows(1);
  }

  return headers;
}


/* ============================================================
 * ROW LOOKUP
 * ============================================================
 */

function findRowByHeaderValue_(
  sheet,
  headers,
  idHeader,
  idValue
) {
  const index =
    buildHeaderIndexByName_(headers);

  const column =
    getHeaderColumnByName_(
      index,
      idHeader
    );

  if (!column) {
    return -1;
  }

  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    return -1;
  }

  const expected =
    normalizeValue_(idValue);

  if (!expected) {
    return -1;
  }

  const values =
    sheet
      .getRange(
        2,
        column,
        lastRow - 1,
        1
      )
      .getValues();

  for (
    let offset = 0;
    offset < values.length;
    offset += 1
  ) {
    if (
      normalizeValue_(
        values[offset][0]
      ) === expected
    ) {
      return offset + 2;
    }
  }

  return -1;
}


/* ============================================================
 * RECORD READ / WRITE
 * ============================================================
 */

function readSheetRowRecordByHeader_(
  sheet,
  headers,
  rowNumber
) {
  const values =
    sheet
      .getRange(
        rowNumber,
        1,
        1,
        headers.length
      )
      .getValues()[0];

  const record = {};

  headers.forEach(
    function(header, offset) {
      if (!normalizeValue_(header)) {
        return;
      }

      record[header] =
        values[offset];
    }
  );

  return record;
}


function recordToRowValues_(
  headers,
  record
) {
  return headers.map(
    function(header) {
      return formatSheetValue_(
        header,
        getRecordValueByHeader_(
          record,
          header
        )
      );
    }
  );
}


function writeRecordToRow_(
  sheet,
  headers,
  rowNumber,
  record
) {
  const values =
    recordToRowValues_(
      headers,
      record
    );

  sheet
    .getRange(
      rowNumber,
      1,
      1,
      values.length
    )
    .setValues([values]);
}


function appendRecord_(
  sheet,
  headers,
  record
) {
  const rowNumber =
    Math.max(
      sheet.getLastRow() + 1,
      2
    );

  writeRecordToRow_(
    sheet,
    headers,
    rowNumber,
    record
  );

  return rowNumber;
}


/* ============================================================
 * RECORD FIELD HELPERS
 * ============================================================
 */

function getRecordValueByHeader_(
  record,
  header
) {
  const expected =
    normalizeHeaderKey_(header);

  const keys =
    Object.keys(
      record || {}
    );

  for (
    let i = 0;
    i < keys.length;
    i += 1
  ) {
    if (
      normalizeHeaderKey_(
        keys[i]
      ) === expected
    ) {
      return record[keys[i]];
    }
  }

  return '';
}


function setRecordValueByHeader_(
  record,
  header,
  value
) {
  const expected =
    normalizeHeaderKey_(header);

  const keys =
    Object.keys(
      record || {}
    );

  for (
    let i = 0;
    i < keys.length;
    i += 1
  ) {
    if (
      normalizeHeaderKey_(
        keys[i]
      ) === expected
    ) {
      record[keys[i]] = value;
      return;
    }
  }

  record[header] = value;
}


/* ============================================================
 * PAYLOAD → RECORD
 * ============================================================
 */

function buildRecordFromPayload_(
  actualHeaders,
  payload,
  existingRecord,
  writableHeaders
) {
  const writable = {};

  (writableHeaders || [])
    .forEach(
      function(header) {
        writable[
          normalizeHeaderKey_(header)
        ] = true;
      }
    );

  const record = {};

  actualHeaders.forEach(
    function(header) {
      const key =
        normalizeHeaderKey_(header);

      const existing =
        existingRecord
          ? getRecordValueByHeader_(
              existingRecord,
              header
            )
          : '';

      if (!writable[key]) {
        record[header] = existing;
        return;
      }

      const incoming =
        lookupPayloadValue_(
          payload,
          header
        );

      /*
       * Form payloads are incremental.
       *
       * An omitted/blank field does not wipe a previously
       * recorded value.
       */
      if (
        incoming !== undefined &&
        incoming !== null &&
        normalizeValue_(incoming) !== ''
      ) {
        record[header] = incoming;
      } else {
        record[header] = existing;
      }
    }
  );

  return record;
}


/* ============================================================
 * PAYLOAD ALIASES
 * ============================================================
 */

function lookupPayloadValue_(
  values,
  header
) {
  const candidates = [];

  const normalizedHeader =
    normalizeValue_(header);

  if (normalizedHeader) {
    candidates.push(
      normalizedHeader
    );

    candidates.push(
      normalizedHeader
        .replace(
          /([a-z0-9])([A-Z])/g,
          '$1_$2'
        )
        .replace(/\s+/g, '_')
        .toLowerCase()
    );

    candidates.push(
      normalizedHeader
        .replace(/\s+/g, '_')
        .toLowerCase()
    );

    candidates.push(
      normalizedHeader
        .replace(/_/g, '')
        .toLowerCase()
    );
  }


  const aliases = {
    firstName: [
      'first_name',
      'volFirstName',
      'vol_first_name',
      'volunteerFirstName',
      'volunteer_first_name',
    ],

    lastName: [
      'last_name',
      'volLastName',
      'vol_last_name',
      'volunteerLastName',
      'volunteer_last_name',
    ],

    email: [
      'emailAddress',
      'email_address',
      'volEmail',
      'vol_email',
      'volunteerEmail',
      'volunteer_email',
    ],

    phone: [
      'phoneNumber',
      'phone_number',
      'volPhone',
      'vol_phone',
      'volunteerPhone',
      'volunteer_phone',
    ],

    street: [
      'streetAddress',
      'street_address',
      'volStreet',
      'vol_street',
      'volunteerStreet',
      'volunteer_street',
    ],

    apt: [
      'apartment',
      'apartmentNumber',
      'apt_number',
      'volApt',
      'vol_apt',
      'volunteerApt',
      'volunteer_apt',
    ],

    city: [
      'volCity',
      'vol_city',
      'volunteerCity',
      'volunteer_city',
    ],

    state: [
      'volState',
      'vol_state',
      'volunteerState',
      'volunteer_state',
    ],

    zip: [
      'volZip',
      'vol_zip',
      'volunteerZip',
      'volunteer_zip',
    ],

    dob: [
      'dateOfBirth',
      'date_of_birth',
      'volDob',
      'vol_dob',
      'volunteerDob',
      'volunteer_dob',
    ],

    roles: [
      'volunteerRoles',
      'volunteer_roles',
    ],

    hasExperience: [
      'volHasExperience',
      'vol_has_experience',
      'volunteerHasExperience',
      'volunteer_has_experience',
    ],

    experienceSummary: [
      'volExperienceSummary',
      'vol_experience_summary',
      'volunteerExperienceSummary',
      'volunteer_experience_summary',
    ],

    availabilityNotes: [
      'volAvailabilityNotes',
      'vol_availability_notes',
      'volunteerAvailabilityNotes',
      'volunteer_availability_notes',
    ],

    agreement: [
      'agreeVolunteer',
      'agreeVolunteerAgreement',
      'volAgreement',
      'volunteerAgreement',
      'volunteer_agreement',
    ],

    signature: [
      'volSignature',
      'vol_signature',
      'volunteerSignature',
      'volunteer_signature',
    ],

    linkedParentEmail: [
      'linkedParentEmail',
      'linked_parent_email',
      'linkedParentEmailAddress',
      'linked_parent_email_address',
    ],
  };


  (
    aliases[
      normalizedHeader
    ] || []
  ).forEach(
    function(alias) {
      candidates.push(alias);
    }
  );


  const seen = {};

  for (
    let i = 0;
    i < candidates.length;
    i += 1
  ) {
    const candidate =
      candidates[i];

    if (
      !candidate ||
      seen[candidate]
    ) {
      continue;
    }

    seen[candidate] = true;

    if (
      values &&
      values[candidate] !== undefined &&
      values[candidate] !== null
    ) {
      return values[candidate];
    }
  }

  return values
    ? values[normalizedHeader]
    : undefined;
}


/* ============================================================
 * VALUE NORMALIZATION
 * ============================================================
 */

function normalizeValue_(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return '';
  }

  if (Array.isArray(value)) {
    return value
      .join(', ')
      .trim();
  }

  return String(value).trim();
}


function normalizeComparisonValue_(
  value
) {
  return normalizeValue_(value)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}


/* ============================================================
 * SHEET SANITIZATION
 * ============================================================
 */

function sanitizeForSheet_(value) {
  const normalized =
    normalizeValue_(value);

  if (!normalized) {
    return '';
  }

  /*
   * Prevent spreadsheet formula injection.
   */
  if (/^[=+\-@]/.test(normalized)) {
    return "'" + normalized;
  }

  return normalized;
}


/* ============================================================
 * DATE FORMATTING
 * ============================================================
 */

function isTimestampHeader_(header) {
  return TIMESTAMP_HEADERS
    .indexOf(
      String(header || '').trim()
    ) >= 0;
}


function isDobHeader_(header) {
  const normalized =
    String(header || '')
      .trim()
      .toLowerCase();

  return (
    normalized === 'dob' ||
    normalized === 'date_of_birth' ||
    normalized === 'dateofbirth' ||
    /(^|_)dob$/.test(normalized) ||
    /(^|_)date_of_birth$/.test(normalized) ||
    /(^|_)dateofbirth$/.test(normalized)
  );
}


/**
 * Important:
 *
 * YYYY-MM-DD is parsed manually so Google Apps Script
 * does not shift the date because of UTC/time-zone conversion.
 */
function formatDobValue_(value) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return '';
  }

  const normalized =
    normalizeValue_(value);

  if (
    /^\d{1,2}\/\d{1,2}\/\d{2,4}$/
      .test(normalized)
  ) {
    return normalized;
  }


  const isoMatch =
    normalized.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (isoMatch) {
    return (
      isoMatch[2] +
      '/' +
      isoMatch[3] +
      '/' +
      isoMatch[1]
    );
  }


  const parsed =
    new Date(normalized);

  if (
    isNaN(
      parsed.getTime()
    )
  ) {
    return sanitizeForSheet_(
      value
    );
  }

  return Utilities.formatDate(
    parsed,
    Session.getScriptTimeZone(),
    'MM/dd/yyyy'
  );
}


function formatSheetTimestamp_(value) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return '';
  }

  const parsed =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    isNaN(
      parsed.getTime()
    )
  ) {
    return sanitizeForSheet_(
      value
    );
  }

  return Utilities.formatDate(
    parsed,
    Session.getScriptTimeZone(),
    SHEET_TIMESTAMP_FORMAT
  );
}


function formatSheetValue_(
  header,
  value
) {
  if (isTimestampHeader_(header)) {
    return formatSheetTimestamp_(
      value
    );
  }

  if (isDobHeader_(header)) {
    return formatDobValue_(
      value
    );
  }

  return sanitizeForSheet_(
    value
  );
}


/* ============================================================
 * DATES THAT MUST NEVER BE INVENTED
 * ============================================================
 */

function normalizeHistoricalIsoDate_(value) {
  if (!value) {
    return '';
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  return date.toISOString();
}


/* ============================================================
 * GENERIC HELPERS
 * ============================================================
 */

function errorMessage_(error) {
  return String(
    error && error.message
      ? error.message
      : error || 'Unknown error'
  );
}


function safeStringify_(value) {
  try {
    return JSON.stringify(value);
  } catch (_error) {
    return String(value);
  }
}