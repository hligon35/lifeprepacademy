/**
 * ============================================================
 * MLS GO REGISTRATION
 * 07_Payments.gs
 * ============================================================
 *
 * Handles:
 * - payment metadata updates
 * - registration context lookup
 * - payment receipt pairing
 * - duplicate-safe paid status
 *
 * Rule:
 * Never guess if more than one registration is equally plausible.
 */


/* ============================================================
 * UPDATE PAYMENT METADATA
 * ============================================================
 */

function handlePaymentMetadataUpdate_(values) {
  const submissionId = normalizeValue_(
    values.registration_submission_id ||
    values.submission_id ||
    values.registrationSubmissionId ||
    values.submissionId
  );

  if (!submissionId) {
    return json_({
      ok: false,
      error: 'Missing submission_id',
    });
  }

  let result;

  try {
    result = withScriptLock_(function() {
      const sheet = getSheet_(
        SHEET_NAMES.PLAYERS
      );

      const headers = ensureHeadersByName_(
        sheet,
        PLAYER_HEADERS
      );

      const row = findRowByHeaderValue_(
        sheet,
        headers,
        'registration_submission_id',
        submissionId
      );

      if (row <= 0) {
        throw new Error(
          'Matching registration row not found'
        );
      }

      const record =
        readSheetRowRecordByHeader_(
          sheet,
          headers,
          row
        );

      const existingTransactionId =
        normalizeValue_(
          getRecordValueByHeader_(
            record,
            'Player Payment Transaction ID'
          )
        );

      const incomingTransactionId =
        normalizeValue_(
          values.payment_transaction_id ||
          values.transaction_id ||
          values.order_id ||
          values.receipt_id
        );

      /*
       * A paid row tied to one transaction must not silently
       * switch to a different transaction.
       */
      if (
        existingTransactionId &&
        incomingTransactionId &&
        existingTransactionId !== incomingTransactionId
      ) {
        throw new Error(
          'Registration is already paired with a different payment transaction.'
        );
      }

      const status =
        normalizeValue_(
          values.payment_status
        ) ||
        (
          incomingTransactionId
            ? 'Paid'
            : normalizeValue_(
                getRecordValueByHeader_(
                  record,
                  'Player Payment Status'
                )
              )
        ) ||
        'Payment Pending';

      const paidAt =
        normalizeHistoricalIsoDate_(
          values.payment_paid_at ||
          values.paid_at ||
          values.payment_timestamp
        ) ||
        (
          normalizeComparisonValue_(status) ===
          'paid'
            ? new Date().toISOString()
            : ''
        );

      setRecordValueByHeader_(
        record,
        'Player Payment Status',
        status
      );

      if (
        values.payment_amount !== undefined &&
        values.payment_amount !== null &&
        normalizeValue_(values.payment_amount) !== ''
      ) {
        setRecordValueByHeader_(
          record,
          'Player Payment Amount',
          normalizeMoneyValue_(
            values.payment_amount
          )
        );
      }

      if (
        normalizeValue_(
          values.payment_currency
        )
      ) {
        setRecordValueByHeader_(
          record,
          'Player Payment Currency',
          normalizeValue_(
            values.payment_currency
          ).toUpperCase()
        );
      }

      if (paidAt) {
        setRecordValueByHeader_(
          record,
          'Player Payment Paid At',
          paidAt
        );
      }

      if (incomingTransactionId) {
        setRecordValueByHeader_(
          record,
          'Player Payment Transaction ID',
          incomingTransactionId
        );
      }

      const receiptUrl =
        normalizeValue_(
          values.payment_receipt_url ||
          values.receipt_url
        );

      if (receiptUrl) {
        setRecordValueByHeader_(
          record,
          'Player Payment Receipt URL',
          receiptUrl
        );
      }

      writeRecordToRow_(
        sheet,
        headers,
        row,
        record
      );

      return {
        ok: true,
        row: row,
        submissionId: submissionId,
        paymentStatus: normalizeValue_(
          getRecordValueByHeader_(
            record,
            'Player Payment Status'
          )
        ),
        paymentTransactionId:
          normalizeValue_(
            getRecordValueByHeader_(
              record,
              'Player Payment Transaction ID'
            )
          ),
        parentEmail:
          normalizeValue_(
            getRecordValueByHeader_(
              record,
              'parent_email'
            )
          ),
      };
    });

  } catch (error) {
    safeWriteError_(
      'payment',
      'Payment metadata update failed',
      {
        registration_submission_id:
          submissionId,
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

  return json_(result);
}


/* ============================================================
 * REGISTRATION CONTEXT LOOKUP
 * ============================================================
 */

function handleRegistrationContextLookup_(values) {
  const submissionId =
    normalizeValue_(
      values.registration_submission_id ||
      values.submission_id ||
      values.registrationSubmissionId ||
      values.submissionId
    );

  const parentEmail =
    normalizeValue_(
      values.parent_email ||
      values.email
    ).toLowerCase();

  const sheet =
    getSheet_(
      SHEET_NAMES.PLAYERS
    );

  const headers =
    ensureHeadersByName_(
      sheet,
      PLAYER_HEADERS
    );

  let row = -1;

  if (submissionId) {
    row =
      findRowByHeaderValue_(
        sheet,
        headers,
        'registration_submission_id',
        submissionId
      );
  }

  if (
    row <= 0 &&
    parentEmail
  ) {
    row =
      findBestRegistrationRowByEmail_(
        sheet,
        headers,
        parentEmail
      );
  }

  if (row <= 0) {
    return json_({
      ok: false,
      error:
        'Matching registration not found',
    });
  }

  const record =
    readSheetRowRecordByHeader_(
      sheet,
      headers,
      row
    );

  const registrationSubmissionId =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        'registration_submission_id'
      )
    );

  const parentFirstName =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        'parent_first_name'
      )
    );

  const parentLastName =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        'parent_last_name'
      )
    );

  const parentEmailValue =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        'parent_email'
      )
    );

  const playerCount =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        'player_count'
      )
    );

  const paymentStatus =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        'Player Payment Status'
      )
    );

  const paymentTransactionId =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        'Player Payment Transaction ID'
      )
    );

  const transactionId =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        'Player Agreement Transaction ID'
      )
    );

  const signedAt =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        'Player Agreement Signed At'
      )
    );

  const participantNames =
    buildPaymentParticipantNames_(
      record
    );

  const parentName =
    [parentFirstName, parentLastName]
      .filter(Boolean)
      .join(' ')
      .trim();

  return json_({
    ok: true,
    row: row,

    /*
     * CamelCase keys are the current Worker contract.
     */
    submissionId:
      registrationSubmissionId,
    parentEmail:
      parentEmailValue,
    parentName:
      parentName,
    participantNames:
      participantNames,
    transactionId:
      transactionId,
    signedAt:
      signedAt,
    paymentStatus:
      paymentStatus,
    paymentTransactionId:
      paymentTransactionId,

    /*
     * Preserve the modular API aliases already introduced.
     */
    registration_submission_id:
      registrationSubmissionId,
    parent_email:
      parentEmailValue,
    parent_first_name:
      parentFirstName,
    parent_last_name:
      parentLastName,
    player_count:
      playerCount,
    payment_status:
      paymentStatus,
    payment_transaction_id:
      paymentTransactionId,
  });
}


/* ============================================================
 * PAYMENT RECEIPT LOOKUP / PAIRING
 * ============================================================
 */

function handlePaymentReceiptLookup_(values) {
  const criteria =
    buildPaymentReceiptCriteria_(values);

  if (
    !criteria.parentEmail &&
    !criteria.paymentTransactionId
  ) {
    return json_({
      ok: false,
      error:
        'parent_email or payment_transaction_id is required',
    });
  }

  const sheet =
    getSheet_(
      SHEET_NAMES.PLAYERS
    );

  const headers =
    ensureHeadersByName_(
      sheet,
      PLAYER_HEADERS
    );

  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    return json_({
      ok: false,
      error:
        'No registrations are available',
    });
  }

  const valuesGrid =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        headers.length
      )
      .getValues();

  const candidates = [];

  for (
    let offset = 0;
    offset < valuesGrid.length;
    offset += 1
  ) {
    const rowValues =
      valuesGrid[offset];

    const record = {};

    headers.forEach(
      function(header, index) {
        record[header] =
          rowValues[index];
      }
    );

    const recordEmail =
      normalizeValue_(
        getRecordValueByHeader_(
          record,
          'parent_email'
        )
      ).toLowerCase();

    if (
      criteria.parentEmail &&
      recordEmail !==
        criteria.parentEmail
    ) {
      continue;
    }

    const score =
      scorePaymentReceiptCandidate_(
        record,
        criteria
      );

    if (score < 0) {
      continue;
    }

    candidates.push({
      row: offset + 2,
      score: score,
      record: record,
    });
  }

  if (!candidates.length) {
    return json_({
      ok: false,
      error:
        'No matching registration was found',
    });
  }

  candidates.sort(
    function(a, b) {
      return b.score - a.score;
    }
  );

  const best =
    candidates[0];

  const second =
    candidates.length > 1
      ? candidates[1]
      : null;

  /*
   * Never guess on a tie.
   */
  if (
    second &&
    second.score === best.score
  ) {
    return json_({
      ok: false,
      ambiguous: true,
      error:
        'More than one registration matched the payment receipt equally well.',
    });
  }

  const record =
    best.record;

  const registrationSubmissionId =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        'registration_submission_id'
      )
    );

  const parentFirstName =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        'parent_first_name'
      )
    );

  const parentLastName =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        'parent_last_name'
      )
    );

  const parentEmailValue =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        'parent_email'
      )
    );

  const playerCount =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        'player_count'
      )
    );

  const paymentStatus =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        'Player Payment Status'
      )
    );

  const paymentTransactionId =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        'Player Payment Transaction ID'
      )
    );

  const transactionId =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        'Player Agreement Transaction ID'
      )
    );

  const signedAt =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        'Player Agreement Signed At'
      )
    );

  const participantNames =
    buildPaymentParticipantNames_(
      record
    );

  const parentName =
    [parentFirstName, parentLastName]
      .filter(Boolean)
      .join(' ')
      .trim();

  return json_({
    ok: true,
    matched: true,
    row: best.row,
    score: best.score,

    /*
     * CamelCase keys are the current Worker contract.
     */
    submissionId:
      registrationSubmissionId,
    parentEmail:
      parentEmailValue,
    parentName:
      parentName,
    participantNames:
      participantNames,
    transactionId:
      transactionId,
    signedAt:
      signedAt,
    paymentStatus:
      paymentStatus,
    paymentTransactionId:
      paymentTransactionId,

    /*
     * Preserve the modular API aliases already introduced.
     */
    registration_submission_id:
      registrationSubmissionId,
    parent_email:
      parentEmailValue,
    parent_first_name:
      parentFirstName,
    parent_last_name:
      parentLastName,
    player_count:
      playerCount,
    payment_status:
      paymentStatus,
    payment_transaction_id:
      paymentTransactionId,
  });
}


/* ============================================================
 * RECEIPT MATCHING
 * ============================================================
 */

function buildPaymentReceiptCriteria_(values) {
  return {
    parentEmail:
      normalizeValue_(
        values.parent_email ||
        values.email
      ).toLowerCase(),

    parentName:
      normalizeComparisonValue_(
        values.parent_name ||
        [
          values.parent_first_name,
          values.parent_last_name,
        ]
          .map(normalizeValue_)
          .filter(Boolean)
          .join(' ')
      ),

    playerCount:
      Number(
        normalizeValue_(
          values.player_count
        ) || 0
      ),

    paymentAmount:
      normalizeMoneyValue_(
        values.payment_amount ||
        values.amount
      ),

    paymentTransactionId:
      normalizeComparisonValue_(
        values.payment_transaction_id ||
        values.transaction_id ||
        values.order_id ||
        values.receipt_id
      ),

    paidAtMs:
      parseDateMs_(
        values.payment_paid_at ||
        values.paid_at ||
        values.payment_timestamp
      ),
  };
}


function scorePaymentReceiptCandidate_(record, criteria) {
  const status =
    normalizeComparisonValue_(
      getRecordValueByHeader_(
        record,
        'Player Payment Status'
      )
    );

  const existingTransactionId =
    normalizeComparisonValue_(
      getRecordValueByHeader_(
        record,
        'Player Payment Transaction ID'
      )
    );

  const existingAmount =
    normalizeMoneyValue_(
      getRecordValueByHeader_(
        record,
        'Player Payment Amount'
      )
    );

  const recordPlayerCount =
    Number(
      normalizeValue_(
        getRecordValueByHeader_(
          record,
          'player_count'
        )
      ) || 0
    );

  const expectedAmount =
    recordPlayerCount > 0
      ? (
          recordPlayerCount * 75
        ).toFixed(2)
      : '';

  const recordName =
    normalizeComparisonValue_(
      [
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
    );

  if (
    !normalizeValue_(
      getRecordValueByHeader_(
        record,
        'registration_submission_id'
      )
    )
  ) {
    return -1;
  }

  if (
    criteria.paymentTransactionId &&
    existingTransactionId &&
    criteria.paymentTransactionId !==
      existingTransactionId
  ) {
    return -1;
  }

  let score =
    status === 'paid'
      ? 10
      : 50;

  if (
    criteria.paymentTransactionId &&
    existingTransactionId &&
    criteria.paymentTransactionId ===
      existingTransactionId
  ) {
    score += 100;
  }

  if (criteria.parentName) {
    if (
      recordName ===
      criteria.parentName
    ) {
      score += 20;
    } else if (recordName) {
      score -= 10;
    }
  }

  if (
    criteria.playerCount > 0 &&
    recordPlayerCount > 0
  ) {
    if (
      criteria.playerCount ===
      recordPlayerCount
    ) {
      score += 20;
    } else {
      score -= 25;
    }
  }

  if (criteria.paymentAmount) {
    if (
      existingAmount &&
      existingAmount ===
        criteria.paymentAmount
    ) {
      score += 15;

    } else if (
      expectedAmount &&
      expectedAmount ===
        criteria.paymentAmount
    ) {
      score += 15;

    } else if (expectedAmount) {
      score -= 10;
    }
  }

  if (
    criteria.paidAtMs > 0
  ) {
    const submittedAtMs =
      parseDateMs_(
        getRecordValueByHeader_(
          record,
          'submitted_at'
        )
      );

    if (
      submittedAtMs > 0
    ) {
      const deltaHours =
        Math.abs(
          criteria.paidAtMs -
          submittedAtMs
        ) /
        (1000 * 60 * 60);

      if (deltaHours <= 72) {
        score += 10;

      } else if (
        deltaHours >
        24 * 30
      ) {
        score -= 15;
      }
    }
  }

  return score;
}


function buildPaymentParticipantNames_(record) {
  const names = [];

  for (
    let index = 1;
    index <= MLSGO_CONFIG.MAX_PLAYERS;
    index += 1
  ) {
    const name = [
      getRecordValueByHeader_(
        record,
        'player_' + index + '_first_name'
      ),
      getRecordValueByHeader_(
        record,
        'player_' + index + '_last_name'
      ),
    ]
      .map(normalizeValue_)
      .filter(Boolean)
      .join(' ')
      .trim();

    if (name) {
      names.push(name);
    }
  }

  return names.join(', ');
}


/* ============================================================
 * HELPERS
 * ============================================================
 */

function findBestRegistrationRowByEmail_(
  sheet,
  headers,
  parentEmail
) {
  const emailColumn =
    getHeaderColumnByName_(
      buildHeaderIndexByName_(
        headers
      ),
      'parent_email'
    );

  if (!emailColumn) {
    return -1;
  }

  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    return -1;
  }

  const values =
    sheet
      .getRange(
        2,
        emailColumn,
        lastRow - 1,
        1
      )
      .getValues();

  /*
   * Most recent matching registration wins when only email is
   * supplied for context lookup.
   */
  for (
    let offset =
      values.length - 1;
    offset >= 0;
    offset -= 1
  ) {
    if (
      normalizeValue_(
        values[offset][0]
      ).toLowerCase() ===
      parentEmail
    ) {
      return offset + 2;
    }
  }

  return -1;
}


function normalizeMoneyValue_(value) {
  const normalized =
    normalizeValue_(value)
      .replace(
        /[^0-9.]/g,
        ''
      );

  if (!normalized) {
    return '';
  }

  const parsed =
    Number(normalized);

  return Number.isFinite(parsed)
    ? parsed.toFixed(2)
    : '';
}


function parseDateMs_(value) {
  const normalized =
    normalizeValue_(value);

  if (!normalized) {
    return 0;
  }

  const parsed =
    new Date(normalized);

  return isNaN(
    parsed.getTime()
  )
    ? 0
    : parsed.getTime();
}
