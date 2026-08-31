/**
 * ============================================================
 * MLS GO REGISTRATION
 * 03_Registration.gs
 * ============================================================
 *
 * Handles:
 * - player registration upsert
 * - volunteer upsert
 * - coaching upsert
 * - player IDs
 * - division IDs
 *
 * Does NOT:
 * - generate PDFs
 * - send confirmation emails under a sheet lock
 * - process payment
 */


/* ============================================================
 * MAIN UPSERT ROUTER
 * ============================================================
 */

function handleSubmissionUpsert_(values) {
  const formType =
    normalizeValue_(
      values.form_type
    );

  const config =
    getFormConfig_(
      formType
    );

  if (!config) {
    safeWriteError_(
      formType,
      'Unknown form_type',
      {
        form_type: formType,
      }
    );

    return json_({
      ok: false,
      error: 'Unknown form_type',
    });
  }


  /*
   * Scholarship has its own workflow because document
   * generation is independent from the main registration.
   */
  if (
    formType ===
    'scholarship_application'
  ) {
    return handleScholarshipSubmissionUpsert_(
      values
    );
  }


  let result;

  try {
    result =
      withScriptLock_(
        function() {
          return upsertRegistrationRecordLocked_(
            formType,
            config,
            values
          );
        }
      );

  } catch (error) {
    safeWriteError_(
      formType,
      'Submission upsert failed',
      {
        submission_id:
          normalizeValue_(
            lookupPayloadValue_(
              values,
              config.idColumn
            )
          ),

        error:
          errorMessage_(error),
      }
    );

    return json_({
      ok: false,
      error:
        errorMessage_(error),
    });
  }


  /*
   * IMPORTANT:
   *
   * Email work is AFTER the lock has been released.
   *
   * This function will live in 08_Email.gs.
   */
  if (
    result &&
    result.ok &&
    result.created
  ) {
    try {
      sendInternalSubmissionNotification_(
        formType,
        result.record
      );
    } catch (emailError) {
      safeWriteError_(
        formType,
        'Internal submission notification failed',
        {
          submission_id:
            result.submissionId,

          error:
            errorMessage_(
              emailError
            ),
        }
      );
    }
  }


  return json_({
    ok: true,
    upserted: true,

    updatedExistingRow:
      !result.created,

    row:
      result.row,

    submissionId:
      result.submissionId,

    players:
      result.players || [],
  });
}


/* ============================================================
 * LOCKED SHEET UPSERT
 * ============================================================
 */

function upsertRegistrationRecordLocked_(
  formType,
  config,
  values
) {
  const sheet =
    getSheet_(
      config.sheetName
    );

  const actualHeaders =
    ensureHeadersByName_(
      sheet,
      config.headers
    );

  const submissionId =
    normalizeValue_(
      lookupPayloadValue_(
        values,
        config.idColumn
      )
    );

  if (!submissionId) {
    throw new Error(
      'Missing ' +
      config.idColumn
    );
  }


  const existingRow =
    findRowByHeaderValue_(
      sheet,
      actualHeaders,
      config.idColumn,
      submissionId
    );


  const existingRecord =
    existingRow > 0
      ? readSheetRowRecordByHeader_(
          sheet,
          actualHeaders,
          existingRow
        )
      : null;


  const writableHeaders =
    getClientWritableHeaders_(
      formType,
      config.headers
    );


  const record =
    buildRecordFromPayload_(
      actualHeaders,
      values,
      existingRecord,
      writableHeaders
    );


  /*
   * Ensure the authoritative IDs/form type remain present.
   */
  setRecordValueByHeader_(
    record,
    'form_type',
    formType
  );

  setRecordValueByHeader_(
    record,
    config.idColumn,
    submissionId
  );


  applyInitialSystemDefaults_(
    record,
    formType
  );


  let players = [];

  if (
    formType ===
    'mls_registration'
  ) {
    players =
      applyPlayerIdentityToRecord_(
        record
      );
  }


  let rowNumber;
  let created = false;

  if (existingRow > 0) {
    rowNumber =
      existingRow;

    writeRecordToRow_(
      sheet,
      actualHeaders,
      rowNumber,
      record
    );

  } else {
    created = true;

    rowNumber =
      appendRecord_(
        sheet,
        actualHeaders,
        record
      );
  }


  return {
    ok: true,
    created: created,
    row: rowNumber,
    submissionId: submissionId,
    players: players,
    record: record,
  };
}


/* ============================================================
 * CLIENT-WRITABLE HEADERS
 * ============================================================
 */

function getClientWritableHeaders_(
  formType,
  headers
) {
  const managed =
    SYSTEM_MANAGED_COLUMNS[
      formType
    ] || [];

  const managedMap = {};

  managed.forEach(
    function(header) {
      managedMap[
        normalizeHeaderKey_(header)
      ] = true;
    }
  );

  return (headers || []).filter(
    function(header) {
      return !managedMap[
        normalizeHeaderKey_(
          header
        )
      ];
    }
  );
}


/* ============================================================
 * INITIAL SYSTEM VALUES
 * ============================================================
 */

function applyInitialSystemDefaults_(
  record,
  formType
) {
  if (
    formType ===
    'mls_registration'
  ) {
    if (
      !normalizeValue_(
        getRecordValueByHeader_(
          record,
          'Player Agreement Status'
        )
      )
    ) {
      setRecordValueByHeader_(
        record,
        'Player Agreement Status',
        'Pending Signature'
      );
    }


    const existingPaymentStatus = normalizeValue_(
      getRecordValueByHeader_(
        record,
        'Player Payment Status'
      )
    );

    const scholarshipRequested = /^(yes|true|1)$/i.test(
      normalizeValue_(
        getRecordValueByHeader_(
          record,
          'scholarship_requested'
        )
      )
    );

    /*
     * Payment status precedence:
     * Paid is authoritative and can never be downgraded by a form save.
     * A scholarship request is tracked as Pending Scholarship immediately.
     * Existing Pending Scholarship is also preserved on later registration saves.
     */
    if (normalizeComparisonValue_(existingPaymentStatus) !== 'paid') {
      if (
        scholarshipRequested ||
        normalizeComparisonValue_(existingPaymentStatus) === 'pending scholarship'
      ) {
        setRecordValueByHeader_(
          record,
          'Player Payment Status',
          'Pending Scholarship'
        );
      } else if (!existingPaymentStatus) {
        setRecordValueByHeader_(
          record,
          'Player Payment Status',
          'Payment Pending'
        );
      }
    }


    if (
      !normalizeValue_(
        getRecordValueByHeader_(
          record,
          'PPF Liability Status'
        )
      )
    ) {
      setRecordValueByHeader_(
        record,
        'PPF Liability Status',
        'Pending'
      );
    }
  }


  if (
    formType ===
      'volunteer_application' ||
    formType ===
      'coaching_application'
  ) {
    if (
      !normalizeValue_(
        getRecordValueByHeader_(
          record,
          'Volunteer Agreement Status'
        )
      )
    ) {
      setRecordValueByHeader_(
        record,
        'Volunteer Agreement Status',
        'Pending Signature'
      );
    }
  }
}


/* ============================================================
 * PLAYER IDENTITIES
 *
 * Everything is calculated in memory and then written with
 * the rest of the row in one sheet operation.
 * ============================================================
 */

function applyPlayerIdentityToRecord_(
  record
) {
  const assigned = [];

  for (
    let playerNumber = 1;
    playerNumber <=
      MLSGO_CONFIG.MAX_PLAYERS;
    playerNumber += 1
  ) {
    const prefix =
      'player_' +
      playerNumber +
      '_';

    const firstName =
      normalizeValue_(
        getRecordValueByHeader_(
          record,
          prefix + 'first_name'
        )
      );

    const lastName =
      normalizeValue_(
        getRecordValueByHeader_(
          record,
          prefix + 'last_name'
        )
      );

    const dob =
      normalizeValue_(
        getRecordValueByHeader_(
          record,
          prefix + 'dob'
        )
      );

    const grade =
      normalizeValue_(
        getRecordValueByHeader_(
          record,
          prefix + 'grade'
        )
      );

    const gender =
      normalizeValue_(
        getRecordValueByHeader_(
          record,
          prefix + 'gender'
        )
      );


    const hasPlayer =
      Boolean(
        firstName ||
        lastName ||
        dob
      );


    if (!hasPlayer) {
      setRecordValueByHeader_(
        record,
        prefix + 'id',
        ''
      );

      setRecordValueByHeader_(
        record,
        prefix + 'division_id',
        ''
      );

      continue;
    }


    let playerId =
      normalizeValue_(
        getRecordValueByHeader_(
          record,
          prefix + 'id'
        )
      );

    if (!playerId) {
      playerId =
        createPlayerId_();

      setRecordValueByHeader_(
        record,
        prefix + 'id',
        playerId
      );
    }


    const divisionId =
      getDivisionId_(
        grade,
        gender
      );

    setRecordValueByHeader_(
      record,
      prefix + 'division_id',
      divisionId
    );


    assigned.push({
      playerNumber:
        playerNumber,

      playerId:
        playerId,

      divisionId:
        divisionId,

      name:
        (
          firstName +
          ' ' +
          lastName
        ).trim(),

      grade:
        grade,

      gender:
        gender,
    });
  }

  return assigned;
}


/* ============================================================
 * IDS
 * ============================================================
 */

function createPlayerId_() {
  return (
    'PGS-' +
    Utilities
      .getUuid()
      .replace(/-/g, '')
      .toUpperCase()
  );
}


/* ============================================================
 * DIVISION LOOKUP
 * ============================================================
 */

function getDivisionId_(
  grade,
  gender
) {
  const normalizedGrade =
    normalizeComparisonValue_(
      grade
    );

  const normalizedGender =
    normalizeComparisonValue_(
      gender
    );


  const isSecondThird =
    /(^|\D)(2|3)(\D|$)|2nd|3rd/
      .test(
        normalizedGrade
      );


  const isFourthFifth =
    /(^|\D)(4|5)(\D|$)|4th|5th/
      .test(
        normalizedGrade
      );


  let genderGroup = '';

  /*
   * Female MUST be checked before male because
   * the word "female" contains "male".
   */
  if (
    /female|girl/
      .test(
        normalizedGender
      )
  ) {
    genderGroup = 'GIRLS';

  } else if (
    /male|boy/
      .test(
        normalizedGender
      )
  ) {
    genderGroup = 'BOYS';
  }


  if (
    isSecondThird &&
    genderGroup === 'BOYS'
  ) {
    return DIVISION_IDS
      .SECOND_THIRD_BOYS;
  }


  if (
    isSecondThird &&
    genderGroup === 'GIRLS'
  ) {
    return DIVISION_IDS
      .SECOND_THIRD_GIRLS;
  }


  if (
    isFourthFifth &&
    genderGroup === 'BOYS'
  ) {
    return DIVISION_IDS
      .FOURTH_FIFTH_BOYS;
  }


  if (
    isFourthFifth &&
    genderGroup === 'GIRLS'
  ) {
    return DIVISION_IDS
      .FOURTH_FIFTH_GIRLS;
  }


  return '';
}


/* ============================================================
 * INITIALIZATION
 * ============================================================
 */

function MLSGO_initializeSheets() {
  withScriptLock_(
    function() {
      Object.keys(
        FORM_CONFIG
      ).forEach(
        function(formType) {
          const config =
            FORM_CONFIG[
              formType
            ];

          const sheet =
            getSheet_(
              config.sheetName
            );

          ensureHeadersByName_(
            sheet,
            config.headers
          );
        }
      );


      ensureHeadersByName_(
        getSheet_(
          SHEET_NAMES.ERRORS
        ),
        ERROR_HEADERS
      );


      ensureHeadersByName_(
        getSheet_(
          SHEET_NAMES.EMAIL_TRACKING
        ),
        EMAIL_TRACKING_HEADERS
      );
    }
  );


  return {
    ok: true,
    initialized: true,
    version:
      MLSGO_CONFIG.VERSION,
  };
}