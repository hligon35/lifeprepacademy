/**
 * ============================================================
 * MLS GO REGISTRATION
 * 04_Agreements.gs
 * ============================================================
 *
 * Handles:
 * - Worker -> Apps Script agreement metadata callback
 * - permanent Google Drive archive for Player / Volunteer agreements
 * - permanent File ID + Drive URL writes to the matching Sheet row
 * - preview Worker archive support
 * - Player Agreement -> PPF Liability archive handoff
 * - idempotent Drive file reuse
 *
 * IMPORTANT:
 * - This file never writes a temporary Worker URL into the spreadsheet.
 * - Network/Drive work is performed OUTSIDE the ScriptLock.
 * - ScriptLock is used only for short Sheet reads/writes.
 * - Existing permanent Drive records are not cleared by failed generations.
 *
 * Assumes:
 * - 00_Config.gs
 * - 02_Sheets.gs
 * - 05_PPF.gs
 *
 * Test preview Worker:
 *   https://mlsregistration-preview.hligon.workers.dev
 */


/* ============================================================
 * AGREEMENT METADATA CALLBACK
 * ============================================================
 */

function handleAgreementMetadataUpdate_(values) {
  values = values || {};

  const expectedToken = normalizeValue_(
    PropertiesService
      .getScriptProperties()
      .getProperty(
        typeof MLSGO_PROPERTY_KEYS !== 'undefined' &&
        MLSGO_PROPERTY_KEYS.AGREEMENT_UPDATE_TOKEN
          ? MLSGO_PROPERTY_KEYS.AGREEMENT_UPDATE_TOKEN
          : 'AGREEMENT_UPDATE_TOKEN'
      )
  );

  const providedToken = normalizeValue_(
    values.update_token ||
    values.token ||
    values.agreement_update_token
  );

  if (
    !expectedToken ||
    !providedToken ||
    providedToken !== expectedToken
  ) {
    return json_({
      ok: false,
      error: 'Unauthorized update token',
    });
  }

  const formType = normalizeValue_(values.form_type);
  const config = getFormConfig_(formType, true);

  if (
    !config ||
    (
      formType !== 'mls_registration' &&
      formType !== 'volunteer_application' &&
      formType !== 'coaching_application'
    )
  ) {
    return json_({
      ok: false,
      error: 'Unsupported agreement form_type',
    });
  }

  const submissionId = normalizeValue_(values.submission_id);

  if (!submissionId) {
    return json_({
      ok: false,
      error: 'Missing submission_id',
    });
  }

  const columnNames = getAgreementColumnNames_(formType);

  const incoming = {
    status: normalizeValue_(values.agreement_status),
    version: normalizeValue_(values.agreement_version),
    signedAt: normalizeValue_(values.agreement_signed_at),
    signerName: normalizeValue_(values.agreement_signer_name),
    fileId: normalizeValue_(values.agreement_file_id),
    pdfUrl: normalizeAgreementPdfUrl_(
      values.agreement_pdf_url
    ),
    sha256: normalizeValue_(values.agreement_sha256),
    transactionId: normalizeValue_(
      values.agreement_transaction_id
    ),
  };

  /*
   * Snapshot the matching row under a SHORT lock.
   * Do not hold the lock while Drive/UrlFetch work occurs.
   */
  const snapshot = withScriptLock_(function() {
    const sheet = getSheet_(config.sheetName);

    const headers = ensureHeadersByName_(
      sheet,
      getAgreementArchiveRequiredHeaders_(
        formType,
        config.idColumn,
        columnNames
      )
    );

    const row = findRowByHeaderValue_(
      sheet,
      headers,
      config.idColumn,
      submissionId
    );

    if (row <= 0) {
      return null;
    }

    return {
      row: row,
      headers: headers,
      record: readSheetRowRecordByHeader_(
        sheet,
        headers,
        row
      ),
    };
  });

  if (!snapshot) {
    return json_({
      ok: false,
      error: 'Matching row not found',
      submissionId: submissionId,
      sheetName: config.sheetName,
    });
  }

  const hasArchiveSource = Boolean(
    normalizeDriveFileId_(incoming.fileId) ||
    extractDriveFileId_(incoming.pdfUrl) ||
    isAllowedAgreementPdfUrl_(incoming.pdfUrl)
  );

  /*
   * Generation-failure callbacks intentionally have no PDF source.
   * Record the failure state without erasing any existing permanent
   * Drive File ID / URL from a prior successful archive.
   */
  if (!hasArchiveSource) {
    const nonArchiveStatus =
      incoming.status ||
      'Generation Failed';

    withScriptLock_(function() {
      const sheet = getSheet_(config.sheetName);

      const headers = ensureHeadersByName_(
        sheet,
        getAgreementArchiveRequiredHeaders_(
          formType,
          config.idColumn,
          columnNames
        )
      );

      const row = findRowByHeaderValue_(
        sheet,
        headers,
        config.idColumn,
        submissionId
      );

      if (row <= 0) {
        throw new Error(
          'Matching row disappeared before agreement failure metadata could be written.'
        );
      }

      const record = readSheetRowRecordByHeader_(
        sheet,
        headers,
        row
      );

      setRecordValueByHeader_(
        record,
        columnNames[0],
        nonArchiveStatus
      );

      if (incoming.version) {
        setRecordValueByHeader_(
          record,
          columnNames[1],
          incoming.version
        );
      }

      if (incoming.signedAt) {
        setRecordValueByHeader_(
          record,
          columnNames[2],
          incoming.signedAt
        );
      }

      if (incoming.signerName) {
        setRecordValueByHeader_(
          record,
          columnNames[3],
          incoming.signerName
        );
      }

      if (incoming.sha256) {
        setRecordValueByHeader_(
          record,
          columnNames[6],
          incoming.sha256
        );
      }

      if (incoming.transactionId) {
        setRecordValueByHeader_(
          record,
          columnNames[7],
          incoming.transactionId
        );
      }

      writeRecordToRow_(
        sheet,
        headers,
        row,
        record
      );
    });

    return json_({
      ok: true,
      updated: true,
      archived: false,
      row: snapshot.row,
      submissionId: submissionId,
      status: nonArchiveStatus,
    });
  }

  const signedAtIso = normalizeHistoricalIsoDate_(
    incoming.signedAt
  );

  if (!signedAtIso) {
    return json_({
      ok: false,
      error:
        'Agreement archive requires a valid signing/acceptance timestamp.',
      submissionId: submissionId,
    });
  }

  if (!incoming.signerName) {
    return json_({
      ok: false,
      error: 'Agreement archive requires signer name.',
      submissionId: submissionId,
    });
  }

  /*
   * Archive the generated agreement OUTSIDE the ScriptLock.
   */
  let archiveResult;

  try {
    archiveResult = archiveAgreementPdf_(
      formType,
      submissionId,
      snapshot.record,
      {
        fileId: incoming.fileId,
        pdfUrl: incoming.pdfUrl,
        signedAt: signedAtIso,
        transactionId: incoming.transactionId,
      }
    );

    if (!archiveResult || !archiveResult.ok) {
      throw new Error(
        archiveResult &&
        (archiveResult.error || archiveResult.reason)
          ? archiveResult.error || archiveResult.reason
          : 'Agreement PDF could not be archived to Google Drive.'
      );
    }
  } catch (archiveError) {
    const archiveMessage = errorMessage_(archiveError);

    try {
      writeError_(
        formType,
        'Agreement archive failed',
        {
          submission_id: submissionId,
          transaction_id: incoming.transactionId,
          error: archiveMessage,
        }
      );
    } catch (loggingError) {
      console.error(
        'Agreement archive error logging also failed: ' +
        errorMessage_(loggingError)
      );
    }

    return json_({
      ok: false,
      error:
        'Agreement PDF was generated but could not be archived to Google Drive.',
      archiveError: archiveMessage,
      submissionId: submissionId,
    });
  }

  /*
   * Player Agreement also generates/archives PPF Liability.
   * Keep this OUTSIDE the ScriptLock too.
   */
  let ppfResult = null;
  let ppfError = '';

  if (formType === 'mls_registration') {
    try {
      ppfResult = archivePpfLiabilityForRegistration_(
        submissionId,
        snapshot.record,
        {
          signedAt: signedAtIso,
          transactionId:
            incoming.transactionId ||
            submissionId,
        }
      );

      if (!ppfResult || !ppfResult.ok) {
        throw new Error(
          ppfResult &&
          (ppfResult.error || ppfResult.reason)
            ? ppfResult.error || ppfResult.reason
            : 'PPF Liability could not be archived.'
        );
      }
    } catch (ppfArchiveError) {
      ppfError = errorMessage_(ppfArchiveError);

      try {
        writeError_(
          formType,
          'PPF liability archive failed',
          {
            submission_id: submissionId,
            transaction_id: incoming.transactionId,
            error: ppfError,
          }
        );
      } catch (loggingError) {
        console.error(
          'PPF archive error logging also failed: ' +
          errorMessage_(loggingError)
        );
      }
    }
  }

  /*
   * Commit ONLY permanent Drive information under a SHORT lock.
   * Re-find the row by submission ID so we do not depend on a stale
   * row number if the Sheet changed during Drive/network work.
   */
  const committed = withScriptLock_(function() {
    const sheet = getSheet_(config.sheetName);

    const requiredHeaders =
      formType === 'mls_registration'
        ? getAgreementArchiveRequiredHeaders_(
            formType,
            config.idColumn,
            columnNames
          ).concat(
            typeof PPF_LIABILITY_COLUMNS !== 'undefined'
              ? PPF_LIABILITY_COLUMNS
              : [
                  'PPF Liability File ID',
                  'PPF Liability PDF URL',
                  'PPF Liability Status',
                  'PPF Liability Generated At',
                  'PPF Liability Transaction ID',
                  'PPF Liability Error',
                ]
          )
        : getAgreementArchiveRequiredHeaders_(
            formType,
            config.idColumn,
            columnNames
          );

    const headers = ensureHeadersByName_(
      sheet,
      requiredHeaders
    );

    const row = findRowByHeaderValue_(
      sheet,
      headers,
      config.idColumn,
      submissionId
    );

    if (row <= 0) {
      throw new Error(
        'Matching row disappeared before permanent agreement metadata could be written.'
      );
    }

    const record = readSheetRowRecordByHeader_(
      sheet,
      headers,
      row
    );

    setRecordValueByHeader_(
      record,
      columnNames[0],
      incoming.status || 'Accepted'
    );

    setRecordValueByHeader_(
      record,
      columnNames[1],
      incoming.version
    );

    setRecordValueByHeader_(
      record,
      columnNames[2],
      signedAtIso
    );

    setRecordValueByHeader_(
      record,
      columnNames[3],
      incoming.signerName
    );

    /*
     * CRITICAL:
     * Write the permanent Google Drive ID + URL, never the Worker
     * object key or temporary signer URL.
     */
    setRecordValueByHeader_(
      record,
      columnNames[4],
      archiveResult.fileId
    );

    setRecordValueByHeader_(
      record,
      columnNames[5],
      archiveResult.url
    );

    setRecordValueByHeader_(
      record,
      columnNames[6],
      incoming.sha256
    );

    setRecordValueByHeader_(
      record,
      columnNames[7],
      incoming.transactionId
    );

    if (formType === 'mls_registration') {
      if (ppfResult && ppfResult.ok) {
        setRecordValueByHeader_(
          record,
          'PPF Liability File ID',
          ppfResult.fileId
        );

        setRecordValueByHeader_(
          record,
          'PPF Liability PDF URL',
          ppfResult.url
        );

        setRecordValueByHeader_(
          record,
          'PPF Liability Status',
          'Archived'
        );

        setRecordValueByHeader_(
          record,
          'PPF Liability Generated At',
          ppfResult.generatedAt ||
          new Date().toISOString()
        );

        setRecordValueByHeader_(
          record,
          'PPF Liability Transaction ID',
          ppfResult.transactionId ||
          incoming.transactionId ||
          submissionId
        );

        setRecordValueByHeader_(
          record,
          'PPF Liability Error',
          ''
        );
      } else {
        setRecordValueByHeader_(
          record,
          'PPF Liability Status',
          'Retry Needed'
        );

        setRecordValueByHeader_(
          record,
          'PPF Liability Error',
          ppfError ||
          'PPF Liability archive did not complete.'
        );
      }
    }

    writeRecordToRow_(
      sheet,
      headers,
      row,
      record
    );

    SpreadsheetApp.flush();

    const verifiedRecord =
      readSheetRowRecordByHeader_(
        sheet,
        headers,
        row
      );

    const verifiedAgreementFileId =
      normalizeValue_(
        getRecordValueByHeader_(
          verifiedRecord,
          columnNames[4]
        )
      );

    const verifiedAgreementUrl =
      normalizeValue_(
        getRecordValueByHeader_(
          verifiedRecord,
          columnNames[5]
        )
      );

    if (
      verifiedAgreementFileId !==
        normalizeValue_(archiveResult.fileId) ||
      verifiedAgreementUrl !==
        normalizeValue_(archiveResult.url)
    ) {
      throw new Error(
        'Permanent agreement Drive metadata could not be verified after Sheet write.'
      );
    }

    return {
      row: row,
      agreementFileId: verifiedAgreementFileId,
      agreementUrl: verifiedAgreementUrl,
      ppfFileId:
        formType === 'mls_registration'
          ? normalizeValue_(
              getRecordValueByHeader_(
                verifiedRecord,
                'PPF Liability File ID'
              )
            )
          : '',
      ppfUrl:
        formType === 'mls_registration'
          ? normalizeValue_(
              getRecordValueByHeader_(
                verifiedRecord,
                'PPF Liability PDF URL'
              )
            )
          : '',
    };
  });

  /*
   * For player registrations, treat PPF as part of successful
   * document completion. The Player Agreement remains permanently
   * archived/written even when PPF needs retry.
   */
  if (
    formType === 'mls_registration' &&
    (!ppfResult || !ppfResult.ok)
  ) {
    return json_({
      ok: false,
      error:
        'Player Agreement was archived, but PPF Liability archive failed.',
      archiveError: ppfError,
      submissionId: submissionId,
      row: committed.row,
      agreementArchived: true,
      archivedPdfUrl: committed.agreementUrl,
      archivedFileId: committed.agreementFileId,
      ppfArchived: false,
    });
  }

  return json_({
    ok: true,
    updated: true,
    row: committed.row,
    submissionId: submissionId,
    pdfArchived: true,
    archivedPdfUrl: committed.agreementUrl,
    archivedFileId: committed.agreementFileId,
    ppfArchived:
      formType === 'mls_registration'
        ? Boolean(committed.ppfFileId && committed.ppfUrl)
        : false,
    archivedPpfPdfUrl:
      formType === 'mls_registration'
        ? committed.ppfUrl
        : '',
    archivedPpfFileId:
      formType === 'mls_registration'
        ? committed.ppfFileId
        : '',
  });
}


/* ============================================================
 * AGREEMENT COLUMN CONFIG
 * ============================================================
 */

function getAgreementColumnNames_(formType) {
  if (formType === 'mls_registration') {
    return PLAYER_AGREEMENT_COLUMNS;
  }

  if (
    formType === 'volunteer_application' ||
    formType === 'coaching_application'
  ) {
    return VOLUNTEER_AGREEMENT_COLUMNS;
  }

  throw new Error(
    'Unsupported agreement form_type: ' +
    formType
  );
}


function getAgreementArchiveRequiredHeaders_(
  formType,
  idHeader,
  agreementColumns
) {
  const nameHeaders =
    formType === 'mls_registration'
      ? [
          'parent_first_name',
          'parent_last_name',
        ]
      : [
          'firstName',
          'lastName',
        ];

  return [idHeader]
    .concat(nameHeaders)
    .concat(agreementColumns);
}


/* ============================================================
 * PERMANENT AGREEMENT ARCHIVE
 * ============================================================
 */

function archiveAgreementPdf_(
  formType,
  submissionId,
  rowRecord,
  agreement
) {
  const isPlayer =
    formType === 'mls_registration';

  const isVolunteer =
    formType === 'volunteer_application' ||
    formType === 'coaching_application';

  if (!isPlayer && !isVolunteer) {
    return {
      ok: false,
      reason:
        'This form type does not use an archived agreement PDF.',
    };
  }

  const sourcePdfUrl =
    normalizeAgreementPdfUrl_(
      agreement && agreement.pdfUrl
    );

  const sourceDriveFileId =
    extractDriveFileId_(sourcePdfUrl) ||
    normalizeDriveFileId_(
      agreement && agreement.fileId
    );

  if (
    !sourceDriveFileId &&
    !isAllowedAgreementPdfUrl_(sourcePdfUrl)
  ) {
    return {
      ok: false,
      reason:
        'No usable agreement PDF URL or Google Drive file ID was provided.',
    };
  }

  const folderId =
    isPlayer
      ? AGREEMENT_ARCHIVE_FOLDERS.PLAYER
      : AGREEMENT_ARCHIVE_FOLDERS.VOLUNTEER;

  const folder =
    DriveApp.getFolderById(folderId);

  const fileName =
    buildAgreementArchiveFileName_(
      formType,
      submissionId,
      rowRecord,
      agreement && agreement.transactionId,
      agreement && agreement.signedAt
    );

  /*
   * Idempotency:
   * same signer/form/transaction => same filename => reuse.
   */
  const existingFiles =
    folder.getFilesByName(fileName);

  if (existingFiles.hasNext()) {
    const existingFile =
      existingFiles.next();

    assertDrivePdfFile_(existingFile);

    return {
      ok: true,
      reused: true,
      fileId: existingFile.getId(),
      url: existingFile.getUrl(),
      name: existingFile.getName(),
      folderId: folderId,
    };
  }

  const sourceBlob =
    getAgreementPdfBlob_(
      sourcePdfUrl,
      sourceDriveFileId,
      agreement && agreement.transactionId
    );

  assertPdfBlob_(sourceBlob);
  sourceBlob.setName(fileName);
  sourceBlob.setContentType(
    'application/pdf'
  );

  const archivedFile =
    folder.createFile(sourceBlob);

  assertDrivePdfFile_(archivedFile);

  return {
    ok: true,
    reused: false,
    fileId: archivedFile.getId(),
    url: archivedFile.getUrl(),
    name: archivedFile.getName(),
    folderId: folderId,
  };
}


/* ============================================================
 * GET GENERATED AGREEMENT PDF
 * ============================================================
 */

function getAgreementPdfBlob_(
  pdfUrl,
  driveFileId,
  transactionId
) {
  const normalizedUrl =
    normalizeAgreementPdfUrl_(pdfUrl);

  /*
   * PREVIEW:
   * First try the private preview archive endpoint.
   * If it is unavailable/stale, fall back to the already-signed
   * preview signer URL supplied by the Worker.
   */
  if (
    /^https:\/\/mlsregistration-preview\.hligon\.workers\.dev\//i
      .test(normalizedUrl)
  ) {
    let privateError = null;

    try {
      return fetchPreviewAgreementPdfBlob_(
        transactionId
      );
    } catch (error) {
      privateError = error;
    }

    try {
      return fetchPdfBlobFromUrl_(
        normalizedUrl
      );
    } catch (signerError) {
      throw new Error(
        'Preview private PDF fetch failed: ' +
        errorMessage_(privateError) +
        ' | Preview signer URL fetch failed: ' +
        errorMessage_(signerError)
      );
    }
  }

  /*
   * PRODUCTION signed URL.
   */
  if (isAllowedAgreementPdfUrl_(normalizedUrl)) {
    try {
      return fetchPdfBlobFromUrl_(
        normalizedUrl
      );
    } catch (urlError) {
      /*
       * Only fall through to Drive when the supplied ID is an
       * actual Google Drive file ID.
       */
      if (!normalizeDriveFileId_(driveFileId)) {
        throw urlError;
      }
    }
  }

  /*
   * Existing permanent Google Drive source.
   */
  const safeDriveFileId =
    normalizeDriveFileId_(driveFileId);

  if (safeDriveFileId) {
    const sourceFile =
      DriveApp.getFileById(
        safeDriveFileId
      );

    const blob =
      sourceFile.getMimeType() ===
        'application/pdf'
        ? sourceFile.getBlob()
        : sourceFile.getAs(
            MimeType.PDF
          );

    assertPdfBlob_(blob);

    return blob;
  }

  throw new Error(
    'No usable agreement PDF source was found.'
  );
}


/* ============================================================
 * PREVIEW PRIVATE PDF FETCH
 * ============================================================
 */

function fetchPreviewAgreementPdfBlob_(
  transactionId
) {
  const txId =
    normalizeValue_(transactionId);

  if (!txId) {
    throw new Error(
      'Preview agreement archive requires transaction ID.'
    );
  }

  const token =
    normalizeValue_(
      PropertiesService
        .getScriptProperties()
        .getProperty(
          typeof MLSGO_PROPERTY_KEYS !== 'undefined' &&
          MLSGO_PROPERTY_KEYS.AGREEMENT_UPDATE_TOKEN
            ? MLSGO_PROPERTY_KEYS.AGREEMENT_UPDATE_TOKEN
            : 'AGREEMENT_UPDATE_TOKEN'
        )
    );

  if (!token) {
    throw new Error(
      'Missing Script Property: AGREEMENT_UPDATE_TOKEN'
    );
  }

  const response =
    UrlFetchApp.fetch(
      'https://mlsregistration-preview.hligon.workers.dev/api/forms/agreement-pdf',
      {
        method: 'post',
        contentType: 'application/json',
        muteHttpExceptions: true,
        headers: {
          Accept: 'application/pdf',
          Authorization:
            'Bearer ' + token,
        },
        payload: JSON.stringify({
          transactionId: txId,
        }),
      }
    );

  const responseCode =
    response.getResponseCode();

  if (
    responseCode < 200 ||
    responseCode >= 300
  ) {
    throw new Error(
      'Preview agreement PDF fetch returned HTTP ' +
      responseCode +
      ': ' +
      response.getContentText()
    );
  }

  const blob = response.getBlob();
  assertPdfBlob_(blob);
  blob.setContentType(
    'application/pdf'
  );

  return blob;
}


/* ============================================================
 * URL PDF FETCH
 * ============================================================
 */

function fetchPdfBlobFromUrl_(pdfUrl) {
  const safeUrl =
    normalizeAgreementPdfUrl_(pdfUrl);

  if (!isAllowedAgreementPdfUrl_(safeUrl)) {
    throw new Error(
      'Agreement PDF URL is not an allowed registration URL.'
    );
  }

  const response =
    UrlFetchApp.fetch(
      safeUrl,
      {
        method: 'get',
        followRedirects: true,
        muteHttpExceptions: true,
        headers: {
          Accept: 'application/pdf',
        },
      }
    );

  const responseCode =
    response.getResponseCode();

  if (
    responseCode < 200 ||
    responseCode >= 300
  ) {
    throw new Error(
      'Agreement PDF download returned HTTP ' +
      responseCode +
      ': ' +
      response.getContentText()
    );
  }

  const blob = response.getBlob();

  assertPdfBlob_(blob);

  blob.setContentType(
    'application/pdf'
  );

  return blob;
}


/* ============================================================
 * PDF VALIDATION
 * ============================================================
 */

function assertPdfBlob_(blob) {
  if (!blob) {
    throw new Error(
      'Expected PDF blob but received no file.'
    );
  }

  const bytes = blob.getBytes();

  const isPdf =
    bytes.length >= 5 &&
    bytes[0] === 37 &&
    bytes[1] === 80 &&
    bytes[2] === 68 &&
    bytes[3] === 70 &&
    bytes[4] === 45;

  if (!isPdf) {
    throw new Error(
      'The generated agreement source is not a valid PDF file.'
    );
  }

  return true;
}


function assertDrivePdfFile_(file) {
  if (!file) {
    throw new Error(
      'Drive archive did not return a file.'
    );
  }

  const blob =
    file.getMimeType() ===
      'application/pdf'
      ? file.getBlob()
      : file.getAs(MimeType.PDF);

  assertPdfBlob_(blob);

  return true;
}


/* ============================================================
 * AGREEMENT URL SAFETY
 * ============================================================
 */

function normalizeAgreementPdfUrl_(value) {
  const normalized =
    normalizeValue_(value);

  if (!normalized) {
    return '';
  }

  if (/^https:\/\//i.test(normalized)) {
    return normalized;
  }

  const relative =
    normalized.replace(/^\/+/, '');

  if (
    /^(?:player|volunteer)-agreements\//i
      .test(relative)
  ) {
    return (
      'https://mlsregistration.lifeprepacademyfoundation.com/' +
      relative
    );
  }

  return normalized;
}


function isAllowedAgreementPdfUrl_(value) {
  const normalized =
    normalizeAgreementPdfUrl_(value);

  if (!normalized) {
    return false;
  }

  /*
   * Production:
   * - signed download endpoint
   * - legacy direct agreement PDF path
   */
  const productionAllowed =
    /^https:\/\/mlsregistration\.lifeprepacademyfoundation\.com\/(?:api\/signer\/agreement\/[a-z0-9-]+|(?:player|volunteer)-agreements\/[a-z0-9_\-./]+\.pdf)(?:\?|$)/i
      .test(normalized);

  if (productionAllowed) {
    return true;
  }

  /*
   * Preview:
   * exact preview hostname only.
   * Do NOT allow arbitrary *.workers.dev hosts.
   */
  return /^https:\/\/mlsregistration-preview\.hligon\.workers\.dev\/api\/signer\/agreement\/[a-z0-9-]+(?:\?|$)/i
    .test(normalized);
}


/* ============================================================
 * ARCHIVE FILE NAME
 * ============================================================
 */

function buildAgreementArchiveFileName_(
  formType,
  submissionId,
  rowRecord,
  transactionId,
  signedAt
) {
  const isPlayer =
    formType === 'mls_registration';

  const personName =
    isPlayer
      ? [
          getRecordValueByHeader_(
            rowRecord,
            'parent_first_name'
          ),
          getRecordValueByHeader_(
            rowRecord,
            'parent_last_name'
          ),
        ]
          .map(normalizeValue_)
          .filter(Boolean)
          .join(' ')
      : [
          getRecordValueByHeader_(
            rowRecord,
            'firstName'
          ),
          getRecordValueByHeader_(
            rowRecord,
            'lastName'
          ),
        ]
          .map(normalizeValue_)
          .filter(Boolean)
          .join(' ');

  const agreementLabel =
    isPlayer
      ? 'Player_Agreement'
      : 'Volunteer_Agreement';

  const uniquePart =
    normalizeValue_(transactionId) ||
    normalizeValue_(submissionId) ||
    normalizeValue_(signedAt);

  if (!uniquePart) {
    throw new Error(
      'Agreement archive is missing a unique transaction/submission ID.'
    );
  }

  return [
    safeDriveFilePart_(
      personName || 'Registrant'
    ),
    agreementLabel,
    safeDriveFilePart_(uniquePart),
  ].join('_') + '.pdf';
}


/* ============================================================
 * GOOGLE DRIVE ID HELPERS
 * ============================================================
 */

function extractDriveFileId_(value) {
  const normalized =
    normalizeValue_(value);

  if (
    !/^https:\/\/(?:drive|docs)\.google\.com\//i
      .test(normalized)
  ) {
    return '';
  }

  const pathMatch =
    normalized.match(
      /\/d\/([-\w]{20,})/
    );

  if (pathMatch) {
    return pathMatch[1];
  }

  const queryMatch =
    normalized.match(
      /[?&]id=([-\w]{20,})/
    );

  return queryMatch
    ? queryMatch[1]
    : '';
}


function normalizeDriveFileId_(value) {
  const normalized =
    normalizeValue_(value);

  return /^[-\w]{20,}$/.test(normalized)
    ? normalized
    : '';
}


function safeDriveFilePart_(value) {
  const cleaned =
    normalizeValue_(value)
      .replace(
        /[\\/:*?"<>|#%{}~&]/g,
        '-'
      )
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(
        /^[_\-.]+|[_\-.]+$/g,
        ''
      );

  return (
    cleaned.substring(0, 80) ||
    'Record'
  );
}


/* ============================================================
 * READ-ONLY FOLDER CHECK
 * ============================================================
 */

function ARCHIVE_verifyAgreementFolders() {
  const result = {};

  Object.keys(
    AGREEMENT_ARCHIVE_FOLDERS
  ).forEach(function(key) {
    const folder =
      DriveApp.getFolderById(
        AGREEMENT_ARCHIVE_FOLDERS[key]
      );

    result[key.toLowerCase()] = {
      id: folder.getId(),
      name: folder.getName(),
      url: folder.getUrl(),
    };
  });

  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}


/*
 * Alias used by the modular test file.
 */
function TEST_archiveFolders() {
  return ARCHIVE_verifyAgreementFolders();
}
