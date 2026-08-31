/**
 * ============================================================
 * MLS GO REGISTRATION
 * 91_Migrations.gs
 * ============================================================
 *
 * Historical agreement migration only.
 *
 * SAFETY RULES:
 * - never invent a signing timestamp
 * - never trash/delete old documents
 * - never regenerate rows without clear acceptance evidence
 * - deterministic transaction IDs make reruns idempotent
 * - main migration does NOT separately regenerate PPFs;
 *   Player Agreement callback creates/archives the PPF
 *
 * DO NOT run the bulk migration until live testing is complete.
 */


/* ============================================================
 * MIGRATION CONFIG
 * ============================================================
 */

const MIGRATION_VERSION_ =
  'agreement-backfill-v2';


/* ============================================================
 * SAFE ONE-ROW TESTS
 * ============================================================
 */

function MIGRATION_testPlayerSelectedRow() {
  return migrateSingleAgreementRow_(
    SHEET_NAMES.PLAYERS,
    'mls_registration',
    true,
    TEST_ROWS.PLAYER
  );
}


function MIGRATION_testVolunteerSelectedRow() {
  return migrateSingleAgreementRow_(
    SHEET_NAMES.VOLUNTEERS,
    'volunteer_application',
    false,
    TEST_ROWS.VOLUNTEER
  );
}


function MIGRATION_testCoachSelectedRow() {
  return migrateSingleAgreementRow_(
    SHEET_NAMES.COACHES,
    'coaching_application',
    false,
    TEST_ROWS.COACH
  );
}


/* ============================================================
 * BULK MIGRATION
 * ============================================================
 */

function MIGRATION_agreements_RunAll() {
  const result = {
    players:
      migrateExistingSignedAgreementSheet_(
        SHEET_NAMES.PLAYERS,
        'mls_registration',
        true
      ),

    volunteers:
      migrateExistingSignedAgreementSheet_(
        SHEET_NAMES.VOLUNTEERS,
        'volunteer_application',
        false
      ),

    coaches:
      migrateExistingSignedAgreementSheet_(
        SHEET_NAMES.COACHES,
        'coaching_application',
        false
      ),
  };

  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}


/* ============================================================
 * SHEET MIGRATION
 * ============================================================
 */

function migrateExistingSignedAgreementSheet_(
  sheetName,
  formType,
  isPlayer
) {
  const sheet =
    getSheet_(
      sheetName
    );

  const requiredHeaders =
    isPlayer
      ? PLAYER_HEADERS
      : (
          formType ===
          'coaching_application'
            ? COACH_HEADERS
            : VOLUNTEER_HEADERS
        );

  const headers =
    ensureHeadersByName_(
      sheet,
      requiredHeaders
    );

  const values =
    sheet
      .getDataRange()
      .getValues();

  if (
    values.length < 2
  ) {
    return {
      scanned: 0,
      migrated: 0,
      skipped: 0,
      failed: [],
    };
  }

  const result = {
    scanned: 0,
    migrated: 0,
    skipped: 0,
    failed: [],
  };

  for (
    let rowNumber = 2;
    rowNumber <= values.length;
    rowNumber += 1
  ) {
    try {
      const outcome =
        migrateSingleAgreementRow_(
          sheetName,
          formType,
          isPlayer,
          rowNumber
        );

      if (
        outcome &&
        outcome.migrated
      ) {
        result.migrated += 1;
        result.scanned += 1;

      } else {
        result.skipped += 1;
      }

    } catch (error) {
      result.scanned += 1;

      result.failed.push({
        row:
          rowNumber,

        error:
          errorMessage_(
            error
          ),
      });
    }
  }

  return result;
}


/* ============================================================
 * SINGLE AGREEMENT ROW
 * ============================================================
 */

function migrateSingleAgreementRow_(
  sheetName,
  formType,
  isPlayer,
  rowNumber
) {
  const sheet =
    getSheet_(
      sheetName
    );

  const requiredHeaders =
    isPlayer
      ? PLAYER_HEADERS
      : (
          formType ===
          'coaching_application'
            ? COACH_HEADERS
            : VOLUNTEER_HEADERS
        );

  const headers =
    ensureHeadersByName_(
      sheet,
      requiredHeaders
    );

  if (
    rowNumber < 2 ||
    rowNumber >
      sheet.getLastRow()
  ) {
    throw new Error(
      'Invalid ' +
      sheetName +
      ' row number: ' +
      rowNumber
    );
  }

  const record =
    readSheetRowRecordByHeader_(
      sheet,
      headers,
      rowNumber
    );

  const agreementColumns =
    isPlayer
      ? PLAYER_AGREEMENT_COLUMNS
      : VOLUNTEER_AGREEMENT_COLUMNS;

  const idHeader =
    isPlayer
      ? 'registration_submission_id'
      : 'submission_id';

  const submissionId =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        idHeader
      )
    );

  const signerName =
    getMigrationSignerName_(
      record,
      agreementColumns,
      isPlayer
    );

  if (
    !submissionId ||
    !signerName
  ) {
    return {
      migrated: false,
      skipped: true,
      reason:
        'Missing submission ID or signer name',
    };
  }

  if (
    !hasMigrationAcceptanceEvidence_(
      record,
      agreementColumns,
      isPlayer
    )
  ) {
    return {
      migrated: false,
      skipped: true,
      reason:
        'No valid agreement acceptance evidence',
    };
  }

  const signedAt =
    getMigrationSignedAt_(
      record,
      agreementColumns,
      isPlayer
    );

  if (!signedAt) {
    return {
      migrated: false,
      skipped: true,
      reason:
        'No valid historical signing/submission timestamp',
    };
  }

  const transactionId =
    buildMigrationTransactionId_(
      formType,
      submissionId
    );

  const payload =
    isPlayer
      ? buildPlayerAgreementMigrationPayload_(
          record,
          submissionId,
          signerName,
          signedAt,
          transactionId
        )
      : buildVolunteerAgreementMigrationPayload_(
          record,
          formType,
          submissionId,
          signerName,
          signedAt,
          transactionId
        );

  const response =
    UrlFetchApp.fetch(
      MLSGO_CONFIG.SIGN_AGREEMENT_URL,
      {
        method: 'post',
        contentType:
          'application/json',
        payload:
          JSON.stringify(
            payload
          ),
        headers: {
          Origin:
            MLSGO_CONFIG.APP_ORIGIN,
        },
        muteHttpExceptions:
          true,
      }
    );

  const code =
    response.getResponseCode();

  const text =
    response.getContentText();

  let parsed = {};

  try {
    parsed =
      JSON.parse(
        text || '{}'
      );
  } catch (_error) {}

  if (
    code < 200 ||
    code >= 300 ||
    parsed.ok !== true
  ) {
    throw new Error(
      parsed.error ||
      (
        'Signing endpoint returned HTTP ' +
        code +
        ': ' +
        text
      )
    );
  }

  /*
   * The Worker call is synchronous and should not return success
   * until Apps Script callback writeback has finished.
   *
   * No arbitrary sleep is used here.
   */
  const refreshedHeaders =
    ensureHeadersByName_(
      sheet,
      requiredHeaders
    );

  const refreshedRecord =
    readSheetRowRecordByHeader_(
      sheet,
      refreshedHeaders,
      rowNumber
    );

  const refreshedFileId =
    normalizeValue_(
      getRecordValueByHeader_(
        refreshedRecord,
        agreementColumns[4]
      )
    );

  const refreshedPdfUrl =
    normalizeValue_(
      getRecordValueByHeader_(
        refreshedRecord,
        agreementColumns[5]
      )
    );

  if (
    !refreshedFileId ||
    !/^https:\/\/drive\.google\.com\//i
      .test(
        refreshedPdfUrl
      )
  ) {
    throw new Error(
      'Replacement agreement was generated but permanent Google Drive metadata was not written.'
    );
  }

  return {
    migrated: true,
    row:
      rowNumber,
    submissionId:
      submissionId,
    signerName:
      signerName,
    transactionId:
      transactionId,
    fileId:
      refreshedFileId,
    pdfUrl:
      refreshedPdfUrl,
  };
}


/* ============================================================
 * ACCEPTANCE EVIDENCE
 * ============================================================
 */

function hasMigrationAcceptanceEvidence_(
  record,
  agreementColumns,
  isPlayer
) {
  const status =
    normalizeComparisonValue_(
      getRecordValueByHeader_(
        record,
        agreementColumns[0]
      )
    );

  const signedAt =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        agreementColumns[2]
      )
    );

  const fileId =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        agreementColumns[4]
      )
    );

  const pdfUrl =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        agreementColumns[5]
      )
    );

  const legacySignature =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        'signature'
      )
    );

  const legacyAgreement =
    normalizeComparisonValue_(
      getRecordValueByHeader_(
        record,
        isPlayer
          ? 'agree_waiver'
          : 'agreement'
      )
    );

  /*
   * Explicit positive historical states only.
   * Failure/error states do NOT count as acceptance.
   */
  const acceptedStatuses = {
    accepted: true,
    signed: true,
    viewed: true,
    completed: true,
    complete: true,
    archived: true,
  };

  if (
    signedAt ||
    fileId ||
    pdfUrl ||
    legacySignature
  ) {
    return true;
  }

  if (
    acceptedStatuses[
      status
    ]
  ) {
    return true;
  }

  return /^(yes|true|accepted|agree|agreed|i agree|1)$/i
    .test(
      legacyAgreement
    );
}


/* ============================================================
 * HISTORICAL DATE
 * ============================================================
 */

function getMigrationSignedAt_(
  record,
  agreementColumns,
  isPlayer
) {
  const direct =
    getRecordValueByHeader_(
      record,
      agreementColumns[2]
    );

  const fallback =
    getRecordValueByHeader_(
      record,
      isPlayer
        ? 'submitted_at'
        : 'submittedAt'
    );

  return (
    normalizeHistoricalIsoDate_(
      direct
    ) ||
    normalizeHistoricalIsoDate_(
      fallback
    )
  );
}


/* ============================================================
 * SIGNER
 * ============================================================
 */

function getMigrationSignerName_(
  record,
  agreementColumns,
  isPlayer
) {
  const recordedSigner =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        agreementColumns[3]
      )
    );

  if (recordedSigner) {
    return recordedSigner;
  }

  if (isPlayer) {
    return [
      getRecordValueByHeader_(
        record,
        'parent_first_name'
      ),

      getRecordValueByHeader_(
        record,
        'parent_last_name'
      ),
    ]
      .map(normalizeValue_)
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  return [
    getRecordValueByHeader_(
      record,
      'firstName'
    ),

    getRecordValueByHeader_(
      record,
      'lastName'
    ),
  ]
    .map(normalizeValue_)
    .filter(Boolean)
    .join(' ')
    .trim();
}


/* ============================================================
 * DETERMINISTIC MIGRATION TRANSACTION ID
 * ============================================================
 */

function buildMigrationTransactionId_(
  formType,
  submissionId
) {
  const raw = [
    MIGRATION_VERSION_,
    normalizeValue_(
      formType
    ),
    normalizeValue_(
      submissionId
    ),
  ].join('|');

  const digest =
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      raw,
      Utilities.Charset.UTF_8
    );

  const hex =
    digest
      .map(
        function(byte) {
          const normalized =
            (byte + 256) % 256;

          return (
            '0' +
            normalized.toString(16)
          ).slice(-2);
        }
      )
      .join('');

  return (
    'mig-' +
    hex.substring(
      0,
      32
    )
  );
}


/* ============================================================
 * PLAYER MIGRATION PAYLOAD
 * ============================================================
 */

function buildPlayerAgreementMigrationPayload_(
  record,
  submissionId,
  signerName,
  signedAt,
  transactionId
) {
  const participantNames = [];

  for (
    let i = 1;
    i <= MLSGO_CONFIG.MAX_PLAYERS;
    i += 1
  ) {
    const name = [
      getRecordValueByHeader_(
        record,
        'player_' +
        i +
        '_first_name'
      ),

      getRecordValueByHeader_(
        record,
        'player_' +
        i +
        '_last_name'
      ),
    ]
      .map(normalizeValue_)
      .filter(Boolean)
      .join(' ')
      .trim();

    if (name) {
      participantNames.push(
        name
      );
    }
  }

  return {
    agreementType:
      'player',

    formType:
      'mls_registration',

    submissionId:
      submissionId,

    transactionId:
      transactionId,

    signer: {
      printedName:
        signerName,
    },

    audit: {
      viewedAtUtc:
        signedAt,

      consentVersion:
        MLSGO_CONFIG
          .AGREEMENT_CONSENT_VERSION,
    },

    fields: {
      participantNames:
        participantNames.join(', '),

      guardianName:
        signerName,

      guardianDob:
        normalizeValue_(
          getRecordValueByHeader_(
            record,
            'parent_guardian_dob'
          )
        ),

      guardianStreet:
        normalizeValue_(
          getRecordValueByHeader_(
            record,
            'parent_street'
          )
        ),

      guardianCity:
        normalizeValue_(
          getRecordValueByHeader_(
            record,
            'parent_city'
          )
        ),

      guardianState:
        normalizeValue_(
          getRecordValueByHeader_(
            record,
            'parent_state'
          )
        ),

      guardianZip:
        normalizeValue_(
          getRecordValueByHeader_(
            record,
            'parent_zip'
          )
        ),

      guardianPhone:
        normalizeValue_(
          getRecordValueByHeader_(
            record,
            'parent_phone'
          )
        ),

      guardianEmail:
        normalizeValue_(
          getRecordValueByHeader_(
            record,
            'parent_email'
          )
        ),

      signingDate:
        signedAt.slice(
          0,
          10
        ),
    },
  };
}


/* ============================================================
 * VOLUNTEER / COACH MIGRATION PAYLOAD
 * ============================================================
 */

function buildVolunteerAgreementMigrationPayload_(
  record,
  formType,
  submissionId,
  signerName,
  signedAt,
  transactionId
) {
  return {
    agreementType:
      'volunteer',

    formType:
      formType,

    submissionId:
      submissionId,

    transactionId:
      transactionId,

    signer: {
      printedName:
        signerName,

      ageYears:
        migrationAgeYears_(
          getRecordValueByHeader_(
            record,
            'dob'
          )
        ),
    },

    audit: {
      viewedAtUtc:
        signedAt,

      consentVersion:
        MLSGO_CONFIG
          .AGREEMENT_CONSENT_VERSION,
    },

    fields: {
      legalName:
        signerName,

      signingDate:
        signedAt.slice(
          0,
          10
        ),
    },
  };
}


/* ============================================================
 * AGE
 * ============================================================
 */

function migrationAgeYears_(value) {
  const normalized =
    normalizeValue_(value);

  if (!normalized) {
    return null;
  }

  let dob;

  const iso =
    normalized.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (iso) {
    dob =
      new Date(
        Number(iso[1]),
        Number(iso[2]) - 1,
        Number(iso[3])
      );

  } else {
    dob =
      new Date(
        normalized
      );
  }

  if (
    isNaN(
      dob.getTime()
    )
  ) {
    return null;
  }

  const today =
    new Date();

  let age =
    today.getFullYear() -
    dob.getFullYear();

  const monthDelta =
    today.getMonth() -
    dob.getMonth();

  if (
    monthDelta < 0 ||
    (
      monthDelta === 0 &&
      today.getDate() <
      dob.getDate()
    )
  ) {
    age -= 1;
  }

  return age;
}


/* ============================================================
 * OLD MIGRATION SAFETY GUARD
 * ============================================================
 */

/**
 * Intentionally prevents the old standalone PPF migration pattern
 * from being accidentally reintroduced/run.
 */
function migrateExistingPpfAgreements_() {
  throw new Error(
    'Standalone PPF bulk migration is disabled. Player Agreement migration generates/reuses the PPF automatically.'
  );
}
