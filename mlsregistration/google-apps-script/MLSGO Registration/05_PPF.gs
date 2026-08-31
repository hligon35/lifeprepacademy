/**
 * ============================================================
 * MLS GO REGISTRATION
 * 05_PPF.gs
 * ============================================================
 *
 * Handles:
 * - PPF Liability PDF generation
 * - permanent Drive archive
 * - idempotent retry/reuse
 * - one-row PPF retry helper
 *
 * Assumes:
 * - 00_Config.gs
 * - 02_Sheets.gs
 * - 04_Agreements.gs
 *
 * Logging helpers are supplied by 11_Logging.gs.
 */


/* ============================================================
 * ARCHIVE PPF FOR A PLAYER REGISTRATION
 * ============================================================
 */

function archivePpfLiabilityForRegistration_(submissionId, rowRecord, context) {
  const safeSubmissionId = normalizeValue_(submissionId);
  if (!safeSubmissionId) {
    throw new Error('PPF archive requires registration_submission_id.');
  }

  const signedAtIso = normalizeHistoricalIsoDate_(
    context && context.signedAt
  );

  if (!signedAtIso) {
    throw new Error(
      'PPF archive requires a valid historical agreement signing timestamp.'
    );
  }

  const transactionId =
    normalizeValue_(context && context.transactionId) ||
    safeSubmissionId;

  const folderId = AGREEMENT_ARCHIVE_FOLDERS.PPF;
  const folder = DriveApp.getFolderById(folderId);

  const fileName = buildPpfLiabilityArchiveFileName_(
    safeSubmissionId,
    rowRecord,
    transactionId
  );

  /*
   * Idempotency:
   * Same transaction/submission => same filename => reuse existing file.
   */
  const existingFiles = folder.getFilesByName(fileName);

  if (existingFiles.hasNext()) {
    const existingFile = existingFiles.next();

    return {
      ok: true,
      reused: true,
      fileId: existingFile.getId(),
      url: existingFile.getUrl(),
      name: existingFile.getName(),
      folderId: folderId,
      generatedAt: new Date().toISOString(),
      transactionId: transactionId,
    };
  }

  const blob = renderPpfLiabilityPdfBlob_(
    safeSubmissionId,
    rowRecord,
    {
      signedAt: signedAtIso,
      transactionId: transactionId,
    }
  );

  blob.setName(fileName);

  const archivedFile = folder.createFile(blob);

  return {
    ok: true,
    reused: false,
    fileId: archivedFile.getId(),
    url: archivedFile.getUrl(),
    name: archivedFile.getName(),
    folderId: folderId,
    generatedAt: new Date().toISOString(),
    transactionId: transactionId,
  };
}


/* ============================================================
 * RENDER PPF THROUGH THE WORKER
 * ============================================================
 */

function renderPpfLiabilityPdfBlob_(submissionId, rowRecord, context) {
  const token = normalizeValue_(
    PropertiesService
      .getScriptProperties()
      .getProperty(MLSGO_PROPERTY_KEYS.AGREEMENT_UPDATE_TOKEN)
  );

  if (!token) {
    throw new Error(
      'Missing Script Property: ' +
      MLSGO_PROPERTY_KEYS.AGREEMENT_UPDATE_TOKEN
    );
  }

  const signedAtIso = normalizeHistoricalIsoDate_(
    context && context.signedAt
  );

  if (!signedAtIso) {
    throw new Error(
      'Cannot generate PPF without a valid agreement signing timestamp.'
    );
  }

  const parentName = [
    getRecordValueByHeader_(rowRecord, 'parent_first_name'),
    getRecordValueByHeader_(rowRecord, 'parent_last_name'),
  ]
    .map(normalizeValue_)
    .filter(Boolean)
    .join(' ');

  if (!parentName) {
    throw new Error('PPF generation requires parent/guardian name.');
  }

  const participants = buildPpfParticipantRecords_(rowRecord);

  if (!participants.length) {
    throw new Error('No participants were found for the PPF Liability Form.');
  }

  const ppfRenderUrl = resolvePpfRenderUrl_(rowRecord);

  const response = UrlFetchApp.fetch(
    ppfRenderUrl,
    {
      method: 'post',
      contentType: 'application/json',
      muteHttpExceptions: true,
      headers: {
        Accept: 'application/pdf',
        Authorization: 'Bearer ' + token,
      },
      payload: JSON.stringify({
        submissionId: submissionId,
        parentName: parentName,
        signingDate: formatPpfSigningDateStrict_(signedAtIso),
        participants: participants,
      }),
    }
  );

  const responseCode = response.getResponseCode();

  if (responseCode < 200 || responseCode >= 300) {
    throw new Error(
      'PPF PDF render returned HTTP ' +
      responseCode +
      ': ' +
      response.getContentText()
    );
  }

  const blob = response.getBlob();
  assertPdfBlob_(blob);
  blob.setContentType('application/pdf');

  return blob;
}


/* ============================================================
 * PPF RENDER ORIGIN
 * ============================================================
 */

function resolvePpfRenderUrl_(rowRecord) {
  const sourceUrl = normalizeValue_(
    getRecordValueByHeader_(rowRecord, 'page_url') ||
    getRecordValueByHeader_(rowRecord, 'pageUrl')
  );

  /*
   * Preview registrations must never call the production Worker for PPF
   * rendering. Production registrations keep the normal configured URL.
   */
  if (
    /^https:\/\/mlsregistration-preview\.hligon\.workers\.dev(?:\/|$)/i
      .test(sourceUrl)
  ) {
    return 'https://mlsregistration-preview.hligon.workers.dev/api/forms/ppf-pdf';
  }

  return MLSGO_CONFIG.PPF_RENDER_URL;
}


/* ============================================================
 * PPF PARTICIPANTS
 * ============================================================
 */

function buildPpfParticipantRecords_(rowRecord) {
  const participants = [];

  for (
    let index = 1;
    index <= MLSGO_CONFIG.MAX_PLAYERS;
    index += 1
  ) {
    const firstName = normalizeValue_(
      getRecordValueByHeader_(
        rowRecord,
        'player_' + index + '_first_name'
      )
    );

    const lastName = normalizeValue_(
      getRecordValueByHeader_(
        rowRecord,
        'player_' + index + '_last_name'
      )
    );

    const fullName = [firstName, lastName]
      .filter(Boolean)
      .join(' ');

    if (!fullName) continue;

    participants.push({
      name: fullName,
      grade: formatPpfParticipantDivisionLabel_(
        getRecordValueByHeader_(
          rowRecord,
          'player_' + index + '_grade'
        ),
        getRecordValueByHeader_(
          rowRecord,
          'player_' + index + '_gender'
        )
      ),
    });
  }

  return participants;
}


function formatPpfParticipantDivisionLabel_(grade, gender) {
  const normalizedGrade = normalizeValue_(grade);
  const normalizedGender = normalizeValue_(gender);

  if (!normalizedGrade) {
    return normalizedGender;
  }

  if (/\b(Boys|Girls)\b/i.test(normalizedGrade)) {
    return normalizedGrade;
  }

  if (/^(Male|Boy|Boys)$/i.test(normalizedGender)) {
    return normalizedGrade + ' Boys';
  }

  if (/^(Female|Girl|Girls)$/i.test(normalizedGender)) {
    return normalizedGrade + ' Girls';
  }

  return normalizedGrade;
}


/* ============================================================
 * STRICT DATE FORMAT
 * ============================================================
 */

function formatPpfSigningDateStrict_(value) {
  const iso = normalizeHistoricalIsoDate_(value);

  if (!iso) {
    throw new Error(
      'PPF signing date is missing or invalid.'
    );
  }

  const date = new Date(iso);

  return Utilities.formatDate(
    date,
    Session.getScriptTimeZone(),
    'MM/dd/yyyy'
  );
}


/* ============================================================
 * PPF FILE NAME
 * ============================================================
 */

function buildPpfLiabilityArchiveFileName_(
  submissionId,
  rowRecord,
  transactionId
) {
  const personName = [
    getRecordValueByHeader_(rowRecord, 'parent_first_name'),
    getRecordValueByHeader_(rowRecord, 'parent_last_name'),
  ]
    .map(normalizeValue_)
    .filter(Boolean)
    .join(' ');

  const uniquePart =
    normalizeValue_(transactionId) ||
    normalizeValue_(submissionId);

  if (!uniquePart) {
    throw new Error(
      'PPF archive is missing a unique transaction/submission ID.'
    );
  }

  return [
    safeDriveFilePart_(personName || 'Registrant'),
    'PPF_Liability',
    safeDriveFilePart_(uniquePart),
  ].join('_') + '.pdf';
}


/* ============================================================
 * RETRY ONE PLAYER PPF
 * ============================================================
 */

function retryPpfForPlayerRow_(rowNumber) {
  const sheet = getSheet_(SHEET_NAMES.PLAYERS);

  const headers = ensureHeadersByName_(
    sheet,
    PLAYER_HEADERS
  );

  if (
    !rowNumber ||
    rowNumber < 2 ||
    rowNumber > sheet.getLastRow()
  ) {
    throw new Error('Invalid Players sheet row number.');
  }

  const record = readSheetRowRecordByHeader_(
    sheet,
    headers,
    rowNumber
  );

  const submissionId = normalizeValue_(
    getRecordValueByHeader_(
      record,
      'registration_submission_id'
    )
  );

  const signedAt = normalizeHistoricalIsoDate_(
    getRecordValueByHeader_(
      record,
      'Player Agreement Signed At'
    )
  );

  if (!submissionId) {
    throw new Error(
      'Selected row has no registration_submission_id.'
    );
  }

  if (!signedAt) {
    throw new Error(
      'Selected row has no valid Player Agreement Signed At timestamp.'
    );
  }

  const transactionId =
    normalizeValue_(
      getRecordValueByHeader_(
        record,
        'Player Agreement Transaction ID'
      )
    ) ||
    submissionId;

  let result;

  try {
    result = archivePpfLiabilityForRegistration_(
      submissionId,
      record,
      {
        signedAt: signedAt,
        transactionId: transactionId,
      }
    );
  } catch (error) {
    withScriptLock_(function() {
      const latestHeaders = ensureHeadersByName_(
        sheet,
        PLAYER_HEADERS
      );

      const latestRecord = readSheetRowRecordByHeader_(
        sheet,
        latestHeaders,
        rowNumber
      );

      setRecordValueByHeader_(
        latestRecord,
        'PPF Liability Status',
        'Retry Needed'
      );

      setRecordValueByHeader_(
        latestRecord,
        'PPF Liability Error',
        errorMessage_(error)
      );

      writeRecordToRow_(
        sheet,
        latestHeaders,
        rowNumber,
        latestRecord
      );
    });

    throw error;
  }

  withScriptLock_(function() {
    const latestHeaders = ensureHeadersByName_(
      sheet,
      PLAYER_HEADERS
    );

    const latestRecord = readSheetRowRecordByHeader_(
      sheet,
      latestHeaders,
      rowNumber
    );

    setRecordValueByHeader_(
      latestRecord,
      'PPF Liability Status',
      'Archived'
    );

    setRecordValueByHeader_(
      latestRecord,
      'PPF Liability File ID',
      result.fileId
    );

    setRecordValueByHeader_(
      latestRecord,
      'PPF Liability PDF URL',
      result.url
    );

    setRecordValueByHeader_(
      latestRecord,
      'PPF Liability Generated At',
      result.generatedAt
    );

    setRecordValueByHeader_(
      latestRecord,
      'PPF Liability Transaction ID',
      result.transactionId
    );

    setRecordValueByHeader_(
      latestRecord,
      'PPF Liability Error',
      ''
    );

    writeRecordToRow_(
      sheet,
      latestHeaders,
      rowNumber,
      latestRecord
    );
  });

  return result;
}
