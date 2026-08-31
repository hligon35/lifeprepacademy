/**
 * ============================================================
 * MLS GO CURRENT DOCUMENT REFRESH - HARDENED V4
 * ============================================================
 *
 * PURPOSE
 * - Refresh current Player Agreement / PPF / Scholarship / Volunteer / Coach docs.
 * - Clean old Drive files and same-name duplicates safely.
 * - Preserve historical signer/status/hash/timestamps/transaction metadata.
 * - Update only document pointers (URL + matching File ID).
 * - Avoid long ScriptLocks and support resumable batched execution.
 *
 * INSTALL
 * - Replace the old AGREEMENTS_refreshCurrentDocuments.gs with this file
 *   in the SAME modular registration Apps Script project.
 *
 * SAFE ORDER
 * 1) AGREEMENTS_previewDocumentRefresh()
 * 2) AGREEMENTS_preflightDocumentRefresh()
 *    - ok:true means system configuration is safe.
 *    - warnings are row-level records that will be skipped, not destructive.
 * 3) AGREEMENTS_refreshCurrentDocuments()
 *    Re-run until remaining === 0.
 *
 * IMPORTANT
 * - Generation happens BEFORE old files are trashed.
 * - If generation/verification fails, old files are left in place.
 * - If cleanup fails after trashing, the script attempts to untrash old files
 *   and removes the newly generated replacement.
 */

const DOCUMENT_REFRESH_CONFIG = Object.freeze({
  SIGNING_ENDPOINT:
    'https://mlsregistration.lifeprepacademyfoundation.com/api/sign-agreement',

  AGREEMENT_UPDATE_TOKEN_PROPERTY:
    'AGREEMENT_UPDATE_TOKEN',

  SCHOLARSHIP_WEBHOOK_TOKEN_PROPERTY:
    (typeof SCHOLARSHIP_LIVE_AUTOMATION !== 'undefined' &&
     SCHOLARSHIP_LIVE_AUTOMATION &&
     SCHOLARSHIP_LIVE_AUTOMATION.TOKEN_PROPERTY)
      ? SCHOLARSHIP_LIVE_AUTOMATION.TOKEN_PROPERTY
      : 'SCHOLARSHIP_LIVE_WEBHOOK_TOKEN',

  SCHOLARSHIP_WEB_APP_URL:
    (typeof SCHOLARSHIP_LIVE_AUTOMATION !== 'undefined' &&
     SCHOLARSHIP_LIVE_AUTOMATION &&
     SCHOLARSHIP_LIVE_AUTOMATION.WEB_APP_URL)
      ? SCHOLARSHIP_LIVE_AUTOMATION.WEB_APP_URL
      : '',

  SCHOLARSHIP_ACTION:
    'archive_live_scholarship_application',

  CONSENT_VERSION:
    (typeof MLSGO_CONFIG !== 'undefined' &&
     MLSGO_CONFIG &&
     MLSGO_CONFIG.AGREEMENT_CONSENT_VERSION)
      ? MLSGO_CONFIG.AGREEMENT_CONSENT_VERSION
      : 'v1-2026-08-06',

  LOG_SHEET:
    'Document Refresh Log',

  MAX_ITEMS_PER_RUN:
    8,

  MAX_RUNTIME_MS:
    240000,
});


const REFRESH_PLAYER_META_HEADERS = Object.freeze([
  'Player Agreement Status',
  'Player Agreement Version',
  'Player Agreement Signed At',
  'Player Agreement Signer Name',
  'Player Agreement File ID',
  'Player Agreement PDF URL',
  'Player Agreement SHA-256',
  'Player Agreement Transaction ID',
  'PPF Liability Status',
  'PPF Liability File ID',
  'PPF Liability PDF URL',
  'PPF Liability Generated At',
  'PPF Liability Transaction ID',
  'PPF Liability Error',
]);


const REFRESH_VOLUNTEER_META_HEADERS = Object.freeze([
  'Volunteer Agreement Status',
  'Volunteer Agreement Version',
  'Volunteer Agreement Signed At',
  'Volunteer Agreement Signer Name',
  'Volunteer Agreement File ID',
  'Volunteer Agreement PDF URL',
  'Volunteer Agreement SHA-256',
  'Volunteer Agreement Transaction ID',
]);


const REFRESH_LOG_HEADERS = Object.freeze([
  'item_key',
  'group',
  'sheet_name',
  'row',
  'submission_id',
  'document_type',
  'status',
  'message',
  'started_at',
  'completed_at',
  'updated_pointers_json',
  'trashed_old_file_ids_json',
]);


/* ============================================================
 * PUBLIC ENTRY POINTS
 * ============================================================
 */

function AGREEMENTS_previewDocumentRefresh() {
  const plan = buildDocumentRefreshPlan_();
  const diagnostics = buildRefreshDiagnostics_(plan);

  console.log(JSON.stringify({
    mode: 'preview',
    totals: diagnostics.totals,
    skipped: diagnostics.skipped,
    missingCurrentDriveRefs: diagnostics.missingCurrentDriveRefs,
    inferredDriveRefs: diagnostics.inferredDriveRefs,
  }, null, 2));

  return {
    mode: 'preview',
    totals: diagnostics.totals,
    skipped: diagnostics.skipped,
    missingCurrentDriveRefs: diagnostics.missingCurrentDriveRefs,
    inferredDriveRefs: diagnostics.inferredDriveRefs,
    plan: plan,
  };
}


function AGREEMENTS_preflightDocumentRefresh() {
  const plan = buildDocumentRefreshPlan_();
  const diagnostics = buildRefreshDiagnostics_(plan);
  const checks = [];

  checks.push(checkRefreshConfig_(
    'MLSGO_CONFIG.SHEET_ID',
    typeof MLSGO_CONFIG !== 'undefined' &&
      MLSGO_CONFIG &&
      MLSGO_CONFIG.SHEET_ID
  ));

  checks.push(checkRefreshConfig_(
    'AGREEMENT_UPDATE_TOKEN',
    PropertiesService.getScriptProperties().getProperty(
      DOCUMENT_REFRESH_CONFIG.AGREEMENT_UPDATE_TOKEN_PROPERTY
    )
  ));

  checks.push(checkRefreshConfig_(
    'AGREEMENT_ARCHIVE_FOLDERS.PLAYER',
    typeof AGREEMENT_ARCHIVE_FOLDERS !== 'undefined' &&
      AGREEMENT_ARCHIVE_FOLDERS.PLAYER
  ));

  checks.push(checkRefreshConfig_(
    'AGREEMENT_ARCHIVE_FOLDERS.PPF',
    typeof AGREEMENT_ARCHIVE_FOLDERS !== 'undefined' &&
      AGREEMENT_ARCHIVE_FOLDERS.PPF
  ));

  checks.push(checkRefreshConfig_(
    'AGREEMENT_ARCHIVE_FOLDERS.VOLUNTEER',
    typeof AGREEMENT_ARCHIVE_FOLDERS !== 'undefined' &&
      AGREEMENT_ARCHIVE_FOLDERS.VOLUNTEER
  ));

  if (diagnostics.totals.scholarships > 0) {
    checks.push(checkRefreshConfig_(
      'SCHOLARSHIP_WEB_APP_URL',
      DOCUMENT_REFRESH_CONFIG.SCHOLARSHIP_WEB_APP_URL
    ));

    checks.push(checkRefreshConfig_(
      DOCUMENT_REFRESH_CONFIG.SCHOLARSHIP_WEBHOOK_TOKEN_PROPERTY,
      PropertiesService.getScriptProperties().getProperty(
        DOCUMENT_REFRESH_CONFIG.SCHOLARSHIP_WEBHOOK_TOKEN_PROPERTY
      )
    ));
  }

  [
    ['PLAYER', AGREEMENT_ARCHIVE_FOLDERS.PLAYER],
    ['PPF', AGREEMENT_ARCHIVE_FOLDERS.PPF],
    ['VOLUNTEER', AGREEMENT_ARCHIVE_FOLDERS.VOLUNTEER],
  ].forEach(function(entry) {
    try {
      DriveApp.getFolderById(entry[1]).getName();
      checks.push({
        check: 'Drive folder ' + entry[0],
        ok: true,
        detail: entry[1],
      });
    } catch (error) {
      checks.push({
        check: 'Drive folder ' + entry[0],
        ok: false,
        detail: errorMessageRefresh_(error),
      });
    }
  });

  const blockers = checks.filter(function(check) {
    return check.ok !== true;
  });

  /*
   * Row-level data problems are warnings, not global blockers.
   * They are excluded from execution by item.ready === false so the clean
   * records can still be refreshed safely.
   */
  const warnings = diagnostics.skipped.slice();

  const result = {
    ok: blockers.length === 0,
    totals: diagnostics.totals,
    checks: checks,
    blockers: blockers,
    warnings: warnings,
    missingCurrentDriveRefs: diagnostics.missingCurrentDriveRefs,
    inferredDriveRefs: diagnostics.inferredDriveRefs,
  };

  console.log(JSON.stringify(result, null, 2));
  return result;
}


/**
 * RESUMABLE EXECUTION.
 *
 * Processes up to MAX_ITEMS_PER_RUN or MAX_RUNTIME_MS, whichever comes first.
 * Re-run this same function until remaining === 0.
 */
function AGREEMENTS_refreshCurrentDocuments() {
  const preflight = AGREEMENTS_preflightDocumentRefresh();

  if (!preflight.ok) {
    throw new Error(
      'Document refresh preflight has blockers. Review the execution log.'
    );
  }

  const startedMs = Date.now();
  const plan = flattenRefreshPlan_(buildDocumentRefreshPlan_());
  const logSheet = getRefreshLogSheet_();
  const completedKeys = readCompletedRefreshKeys_(logSheet);

  let processed = 0;
  let refreshed = 0;
  let failed = 0;
  let skippedAlreadyDone = 0;
  const results = [];

  for (let index = 0; index < plan.length; index += 1) {
    const item = plan[index];

    if (!item.ready) {
      continue;
    }

    if (completedKeys[item.itemKey]) {
      skippedAlreadyDone++;
      continue;
    }

    if (
      processed >= DOCUMENT_REFRESH_CONFIG.MAX_ITEMS_PER_RUN ||
      Date.now() - startedMs >= DOCUMENT_REFRESH_CONFIG.MAX_RUNTIME_MS
    ) {
      break;
    }

    processed++;

    upsertRefreshLog_(logSheet, item, {
      status: 'running',
      message: '',
      startedAt: new Date().toISOString(),
      completedAt: '',
      pointers: {},
      trashedIds: [],
    });

    try {
      const result = executeDocumentRefreshItem_(item);

      refreshed++;

      upsertRefreshLog_(logSheet, item, {
        status: 'completed',
        message: 'Refresh completed.',
        startedAt: '',
        completedAt: new Date().toISOString(),
        pointers: result.updatedPointers || {},
        trashedIds: result.trashedOldFileIds || [],
      });

      results.push(result);
    } catch (error) {
      failed++;

      const message = errorMessageRefresh_(error);

      upsertRefreshLog_(logSheet, item, {
        status: 'failed',
        message: message,
        startedAt: '',
        completedAt: new Date().toISOString(),
        pointers: {},
        trashedIds: [],
      });

      results.push({
        itemKey: item.itemKey,
        status: 'failed',
        error: message,
      });
    }
  }

  const latestCompleted = readCompletedRefreshKeys_(logSheet);
  const readyKeys = plan
    .filter(function(item) { return item.ready; })
    .map(function(item) { return item.itemKey; });

  const remaining = readyKeys.filter(function(key) {
    return !latestCompleted[key];
  }).length;

  const summary = {
    ok: failed === 0,
    processed: processed,
    refreshed: refreshed,
    failed: failed,
    skippedAlreadyDone: skippedAlreadyDone,
    remaining: remaining,
    runAgain: remaining > 0,
    results: results,
  };

  console.log(JSON.stringify(summary, null, 2));
  return summary;
}


/**
 * Read-only status helper.
 */
function AGREEMENTS_refreshStatus() {
  const plan = flattenRefreshPlan_(buildDocumentRefreshPlan_());
  const logSheet = getRefreshLogSheet_();
  const completed = readCompletedRefreshKeys_(logSheet);

  const ready = plan.filter(function(item) {
    return item.ready;
  });

  const remaining = ready.filter(function(item) {
    return !completed[item.itemKey];
  });

  return {
    ready: ready.length,
    completed: ready.length - remaining.length,
    remaining: remaining.length,
    remainingItems: remaining.map(function(item) {
      return {
        itemKey: item.itemKey,
        sheetName: item.sheetName,
        row: item.row,
        submissionId: item.submissionId,
        documentType: item.documentType,
      };
    }),
  };
}


/**
 * Read-only detail for rows excluded from refresh.
 * Use this to see the exact historical fields that caused a row to be skipped.
 */
function AGREEMENTS_diagnoseSkippedDocumentRefresh() {
  const plan = flattenRefreshPlan_(buildDocumentRefreshPlan_());

  const skipped = plan
    .filter(function(item) {
      return !item.ready;
    })
    .map(function(item) {
      const sheet = getRefreshSheet_(item.sheetName);
      const record = readRefreshRowRecord_(sheet, item.row);

      const result = {
        sheetName: item.sheetName,
        row: item.row,
        submissionId: item.submissionId,
        documentType: item.documentType,
        reason: item.reason,
        resolvedOldRefs: item.oldRefs || [],
      };

      if (item.sheetName === 'Players') {
        result.parentName = [
          normalizeRefreshValue_(record.parent_first_name),
          normalizeRefreshValue_(record.parent_last_name),
        ].filter(Boolean).join(' ');

        result.playerAgreementSignedAt =
          normalizeRefreshValue_(record['Player Agreement Signed At']);

        result.playerAgreementFileId =
          normalizeRefreshValue_(record['Player Agreement File ID']);

        result.playerAgreementPdfUrl =
          normalizeRefreshValue_(record['Player Agreement PDF URL']);

        result.ppfFileId =
          normalizeRefreshValue_(record['PPF Liability File ID']);

        result.ppfPdfUrl =
          normalizeRefreshValue_(record['PPF Liability PDF URL']);

        result.participants = [];
        for (let i = 1; i <= 4; i += 1) {
          const name = [
            normalizeRefreshValue_(record['player_' + i + '_first_name']),
            normalizeRefreshValue_(record['player_' + i + '_last_name']),
          ].filter(Boolean).join(' ');

          if (name) {
            result.participants.push(name);
          }
        }
      }

      if (
        item.sheetName === 'Volunteers' ||
        item.sheetName === 'Coaches'
      ) {
        result.signerName = [
          normalizeRefreshValue_(record.firstName),
          normalizeRefreshValue_(record.lastName),
        ].filter(Boolean).join(' ');

        result.signedAt =
          normalizeRefreshValue_(record['Volunteer Agreement Signed At']);

        result.fileId =
          normalizeRefreshValue_(record['Volunteer Agreement File ID']);

        result.pdfUrl =
          normalizeRefreshValue_(record['Volunteer Agreement PDF URL']);

        result.transactionId =
          normalizeRefreshValue_(record['Volunteer Agreement Transaction ID']);

        result.dob =
          normalizeRefreshValue_(record.dob);
      }

      return result;
    });

  console.log(JSON.stringify({ skipped: skipped }, null, 2));
  return { skipped: skipped };
}


/**
 * Read-only archive cleanup preview.
 *
 * The registration sheets are treated as the authority for current Player,
 * PPF, Volunteer/Coach, and Scholarship files. Generated files in the
 * dedicated archive folders that are not referenced by a current row are
 * classified as orphan/duplicate candidates.
 */
function AGREEMENTS_previewDuplicateArchiveCleanup() {
  const plan = buildDuplicateArchiveCleanupPlan_();
  console.log(JSON.stringify({
    mode: 'duplicate-preview',
    totals: plan.totals,
    candidates: plan.candidates,
  }, null, 2));
  return plan;
}

/**
 * Repairs current Drive URLs and trashes unreferenced generated Player, PPF,
 * Volunteer/Coach, and Scholarship archive files. Run preview first.
 * Drive trash remains recoverable.
 */
function AGREEMENTS_cleanupDuplicateArchiveFiles() {
  const plan = buildDuplicateArchiveCleanupPlan_();
  const repaired = repairCurrentArchiveDocumentUrls_();
  const trashed = [];
  const failures = [];

  plan.candidates.forEach(function(candidate) {
    try {
      const file = DriveApp.getFileById(candidate.fileId);
      if (!file.isTrashed()) {
        file.setTrashed(true);
      }
      trashed.push(candidate.fileId);
    } catch (error) {
      failures.push({
        fileId: candidate.fileId,
        fileName: candidate.fileName,
        error: errorMessageRefresh_(error),
      });
    }
  });

  const result = {
    ok: failures.length === 0,
    repairedUrls: repaired,
    trashed: trashed.length,
    failed: failures.length,
    failures: failures,
  };

  console.log(JSON.stringify(result, null, 2));
  return result;
}

/* ============================================================
 * PLAN
 * ============================================================
 */

function buildDocumentRefreshPlan_() {
  return {
    players: buildPlayerRefreshPlan_(),
    scholarships: buildScholarshipRefreshPlan_(),
    volunteers: buildVolunteerCoachRefreshPlan_(
      'Volunteers',
      'volunteer_application'
    ),
    coaches: buildVolunteerCoachRefreshPlan_(
      'Coaches',
      'coaching_application'
    ),
  };
}


function buildPlayerRefreshPlan_() {
  const sheet = getRefreshSheet_('Players');
  const table = readRefreshTable_(sheet);
  const result = [];

  table.rows.forEach(function(row, index) {
    const rowNumber = index + 2;
    const submissionId =
      refreshValue_(row, table.map, 'registration_submission_id');

    if (!submissionId) return;

    const signerName =
      refreshValue_(row, table.map, 'Player Agreement Signer Name') ||
      [
        refreshValue_(row, table.map, 'parent_first_name'),
        refreshValue_(row, table.map, 'parent_last_name'),
      ].filter(Boolean).join(' ').trim();

    const signedAt = strictRefreshIsoDate_(
      refreshRawValue_(row, table.map, 'Player Agreement Signed At')
    );

    const playerPdfUrl =
      refreshValue_(row, table.map, 'Player Agreement PDF URL');

    const playerFileId =
      refreshValue_(row, table.map, 'Player Agreement File ID');

    const ppfPdfUrl =
      refreshValue_(row, table.map, 'PPF Liability PDF URL');

    const ppfFileId =
      refreshValue_(row, table.map, 'PPF Liability File ID');

    const hasPlayerAgreement = Boolean(playerPdfUrl || playerFileId);
    const hasPpf = Boolean(ppfPdfUrl || ppfFileId);

    if (hasPlayerAgreement) {
      const oldRefs = [];

      addRefreshRefs_(
        oldRefs,
        collectRefreshFileRefs_(
          row,
          table.map,
          ['Player Agreement File ID'],
          ['Player Agreement PDF URL']
        )
      );

      addRefreshRefs_(
        oldRefs,
        inferPlayerAgreementRefs_(row, table.map, submissionId)
      );

      if (hasPpf) {
        addRefreshRefs_(
          oldRefs,
          collectRefreshFileRefs_(
            row,
            table.map,
            ['PPF Liability File ID'],
            ['PPF Liability PDF URL']
          )
        );

        addRefreshRefs_(
          oldRefs,
          inferPpfRefs_(row, table.map, submissionId)
        );
      }

      const participants =
        buildRefreshParticipants_(row, table.map);

      result.push({
        itemKey:
          'Players|' + rowNumber + '|player_bundle|' + submissionId,
        group: 'players',
        sheetName: 'Players',
        row: rowNumber,
        submissionId: submissionId,
        documentType: 'player_bundle',
        formType: 'mls_registration',
        signerName: signerName,
        signedAt: signedAt,
        hadPpf: hasPpf,
        participants: participants,
        oldRefs: oldRefs,
        ready: Boolean(
          signerName &&
          signedAt &&
          participants.length &&
          oldRefs.length
        ),
        reason:
          !signerName
            ? 'Missing historical signer name.'
            : !signedAt
              ? 'Missing historical Player Agreement signing timestamp.'
              : !participants.length
                ? 'No participants were found.'
                : !oldRefs.length
                  ? 'Current Player Agreement/PPF Drive file could not be resolved safely.'
                  : '',
      });

      return;
    }

    if (hasPpf) {
      const parentName = [
        refreshValue_(row, table.map, 'parent_first_name'),
        refreshValue_(row, table.map, 'parent_last_name'),
      ].filter(Boolean).join(' ').trim();

      const participants =
        buildRefreshParticipants_(row, table.map);

      const oldRefs = [];

      addRefreshRefs_(
        oldRefs,
        collectRefreshFileRefs_(
          row,
          table.map,
          ['PPF Liability File ID'],
          ['PPF Liability PDF URL']
        )
      );

      addRefreshRefs_(
        oldRefs,
        inferPpfRefs_(row, table.map, submissionId)
      );

      result.push({
        itemKey:
          'Players|' + rowNumber + '|ppf_liability|' + submissionId,
        group: 'players',
        sheetName: 'Players',
        row: rowNumber,
        submissionId: submissionId,
        documentType: 'ppf_liability',
        parentName: parentName,
        signedAt: signedAt,
        participants: participants,
        oldRefs: oldRefs,
        ready: Boolean(
          parentName &&
          signedAt &&
          participants.length &&
          oldRefs.length
        ),
        reason:
          !parentName
            ? 'Missing parent/guardian name.'
            : !signedAt
              ? 'Missing historical Player Agreement signing timestamp.'
              : !participants.length
                ? 'No participants were found.'
                : !oldRefs.length
                  ? 'Current PPF Drive file could not be resolved safely.'
                  : '',
      });
    }
  });

  return result;
}


function buildVolunteerCoachRefreshPlan_(sheetName, formType) {
  const sheet = getRefreshSheet_(sheetName);
  const table = readRefreshTable_(sheet);
  const result = [];

  table.rows.forEach(function(row, index) {
    const rowNumber = index + 2;
    const submissionId =
      refreshValue_(row, table.map, 'submission_id');

    if (!submissionId) return;

    const pdfUrl =
      refreshValue_(row, table.map, 'Volunteer Agreement PDF URL');

    const fileId =
      refreshValue_(row, table.map, 'Volunteer Agreement File ID');

    if (!pdfUrl && !fileId) return;

    const signerName =
      refreshValue_(row, table.map, 'Volunteer Agreement Signer Name') ||
      [
        refreshValue_(row, table.map, 'firstName'),
        refreshValue_(row, table.map, 'lastName'),
      ].filter(Boolean).join(' ').trim();

    const signedAt = strictRefreshIsoDate_(
      refreshRawValue_(row, table.map, 'Volunteer Agreement Signed At')
    );

    const ageYears = refreshAgeYears_(
      refreshRawValue_(row, table.map, 'dob'),
      signedAt
    );

    const oldRefs = [];

    addRefreshRefs_(
      oldRefs,
      collectRefreshFileRefs_(
        row,
        table.map,
        ['Volunteer Agreement File ID'],
        ['Volunteer Agreement PDF URL']
      )
    );

    addRefreshRefs_(
      oldRefs,
      inferVolunteerAgreementRefs_(
        row,
        table.map,
        submissionId
      )
    );

    const documentType =
      formType === 'coaching_application'
        ? 'coach_volunteer_agreement'
        : 'volunteer_agreement';

    result.push({
      itemKey:
        sheetName + '|' + rowNumber + '|' + documentType + '|' + submissionId,
      group:
        formType === 'coaching_application'
          ? 'coaches'
          : 'volunteers',
      sheetName: sheetName,
      row: rowNumber,
      submissionId: submissionId,
      documentType: documentType,
      formType: formType,
      signerName: signerName,
      signedAt: signedAt,
      ageYears: ageYears,
      oldRefs: oldRefs,
      ready: Boolean(
        signerName &&
        signedAt &&
        Number.isFinite(ageYears) &&
        ageYears >= 18 &&
        oldRefs.length
      ),
      reason:
        !signerName
          ? 'Missing historical signer name.'
          : !signedAt
            ? 'Missing historical Volunteer Agreement signing timestamp.'
            : !Number.isFinite(ageYears)
              ? 'Missing or invalid volunteer DOB.'
              : ageYears < 18
                ? 'Volunteer was under 18 at the historical signing timestamp.'
                : !oldRefs.length
                  ? 'Current Volunteer Agreement Drive file could not be resolved safely.'
                  : '',
    });
  });

  return result;
}


function buildScholarshipRefreshPlan_() {
  const sheet = getRefreshSheet_('Scholarships');
  const table = readRefreshTable_(sheet);
  const result = [];

  table.rows.forEach(function(row, index) {
    const rowNumber = index + 2;
    const registrationId =
      refreshValue_(row, table.map, 'registration_submission_id');

    if (!registrationId) return;

    const status =
      refreshValue_(row, table.map, 'scholarship_terms_status')
        .toLowerCase();

    const acceptedAt = strictRefreshIsoDate_(
      refreshRawValue_(
        row,
        table.map,
        'scholarship_terms_accepted_at'
      )
    );

    const parentEmail =
      refreshValue_(row, table.map, 'parent_email');

    const parentName =
      refreshValue_(row, table.map, 'scholarship_terms_parent_name') ||
      [
        refreshValue_(row, table.map, 'parent_first_name'),
        refreshValue_(row, table.map, 'parent_last_name'),
      ].filter(Boolean).join(' ').trim();

    const participantNames =
      refreshValue_(
        row,
        table.map,
        'scholarship_terms_participant_names'
      ) ||
      refreshValue_(row, table.map, 'participant_names');

    const documentUrl =
      refreshValue_(row, table.map, 'scholarship_terms_document_url');

    const documentFileId =
      refreshValue_(row, table.map, 'scholarship_terms_document_file_id');

    const pdfUrl =
      refreshValue_(row, table.map, 'scholarship_terms_pdf_url');

    const pdfFileId =
      refreshValue_(row, table.map, 'scholarship_terms_pdf_file_id');

    if (
      !documentUrl &&
      !documentFileId &&
      !pdfUrl &&
      !pdfFileId
    ) {
      return;
    }

    const oldRefs = collectRefreshFileRefs_(
      row,
      table.map,
      [
        'scholarship_terms_document_file_id',
        'scholarship_terms_pdf_file_id',
      ],
      [
        'scholarship_terms_document_url',
        'scholarship_terms_pdf_url',
      ]
    );

    result.push({
      itemKey:
        'Scholarships|' + rowNumber + '|scholarship|' + registrationId,
      group: 'scholarships',
      sheetName: 'Scholarships',
      row: rowNumber,
      submissionId: registrationId,
      registrationId: registrationId,
      documentType: 'scholarship',
      parentEmail: parentEmail,
      parentName: parentName,
      participantNames: participantNames,
      acceptedAt: acceptedAt,
      oldRefs: oldRefs,
      ready: Boolean(
        status === 'accepted' &&
        acceptedAt &&
        parentEmail &&
        parentName &&
        participantNames &&
        DOCUMENT_REFRESH_CONFIG.SCHOLARSHIP_WEB_APP_URL &&
        oldRefs.length
      ),
      reason:
        status !== 'accepted'
          ? 'Scholarship has not been accepted.'
          : !acceptedAt
            ? 'Missing historical scholarship acceptance timestamp.'
            : !parentEmail || !parentName || !participantNames
              ? 'Missing scholarship parent or participant data.'
              : !DOCUMENT_REFRESH_CONFIG.SCHOLARSHIP_WEB_APP_URL
                ? 'Scholarship web-app URL is not configured.'
                : !oldRefs.length
                  ? 'Scholarship has document pointers but no resolvable Drive file reference.'
                  : '',
    });
  });

  return result;
}


/* ============================================================
 * EXECUTION
 * ============================================================
 */

function executeDocumentRefreshItem_(item) {
  if (item.documentType === 'player_bundle') {
    return executePlayerBundleRefresh_(item);
  }

  if (
    item.documentType === 'volunteer_agreement' ||
    item.documentType === 'coach_volunteer_agreement'
  ) {
    return executeVolunteerRefresh_(item);
  }

  if (item.documentType === 'ppf_liability') {
    return executePpfOnlyRefresh_(item);
  }

  if (item.documentType === 'scholarship') {
    return executeScholarshipRefresh_(item);
  }

  throw new Error(
    'Unsupported refresh document type: ' + item.documentType
  );
}


function executePlayerBundleRefresh_(item) {
  const sheet = getRefreshSheet_(item.sheetName);
  assertRefreshRowIdentity_(sheet, item);

  const snapshot = snapshotHeaders_(
    sheet,
    item.row,
    REFRESH_PLAYER_META_HEADERS
  );

  let newRefs = [];
  let trashedOld = [];

  try {
    const payload =
      buildRefreshPlayerAgreementPayload_(sheet, item);

    const response =
      postRefreshSigningPayload_(payload);

    SpreadsheetApp.flush();

    const newPlayer =
      readPointerPair_(
        sheet,
        item.row,
        'Player Agreement File ID',
        'Player Agreement PDF URL'
      );

    const newPpf =
      readPointerPair_(
        sheet,
        item.row,
        'PPF Liability File ID',
        'PPF Liability PDF URL'
      );

    assertNewPointerPair_(
      'Player Agreement',
      newPlayer,
      item.oldRefs
    );

    newRefs.push({
      fileId: newPlayer.fileId,
      sourceHeader: 'new Player Agreement',
    });

    if (item.hadPpf) {
      assertNewPointerPair_(
        'PPF Liability',
        newPpf,
        item.oldRefs
      );

      newRefs.push({
        fileId: newPpf.fileId,
        sourceHeader: 'new PPF Liability',
      });
    } else if (newPpf.fileId) {
      /*
       * Player callback always attempts PPF generation.
       * If the row did not previously have a PPF target, remove the newly
       * generated PPF so this refresh does not silently broaden scope.
       */
      safelyTrashFilesByIds_([newPpf.fileId]);
    }

    trashedOld =
      trashOldRefsWithRollbackInfo_(
        item.oldRefs,
        newRefs.map(function(ref) {
          return ref.fileId;
        })
      );

    restoreHeaders_(
      sheet,
      item.row,
      snapshot
    );

    setPointerPair_(
      sheet,
      item.row,
      'Player Agreement File ID',
      'Player Agreement PDF URL',
      newPlayer
    );

    const updatedPointers = {
      'Player Agreement File ID': newPlayer.fileId,
      'Player Agreement PDF URL': newPlayer.url,
    };

    if (item.hadPpf) {
      setPointerPair_(
        sheet,
        item.row,
        'PPF Liability File ID',
        'PPF Liability PDF URL',
        newPpf
      );

      updatedPointers['PPF Liability File ID'] =
        newPpf.fileId;
      updatedPointers['PPF Liability PDF URL'] =
        newPpf.url;
    }

    setDocumentRefreshUpdatedAt_(sheet, item.row);
    SpreadsheetApp.flush();

    return {
      itemKey: item.itemKey,
      status: 'refreshed',
      updatedPointers: updatedPointers,
      trashedOldFileIds: trashedOld,
    };

  } catch (error) {
    try {
      restoreHeaders_(sheet, item.row, snapshot);
      untrashFilesByIds_(trashedOld);
      safelyTrashFilesByIds_(
        newRefs.map(function(ref) {
          return ref.fileId;
        })
      );
    } catch (rollbackError) {
      throw new Error(
        errorMessageRefresh_(error) +
        ' | Rollback warning: ' +
        errorMessageRefresh_(rollbackError)
      );
    }

    throw error;
  }
}


function executeVolunteerRefresh_(item) {
  const sheet = getRefreshSheet_(item.sheetName);
  assertRefreshRowIdentity_(sheet, item);

  const snapshot = snapshotHeaders_(
    sheet,
    item.row,
    REFRESH_VOLUNTEER_META_HEADERS
  );

  let newRef = null;
  let trashedOld = [];

  try {
    const payload =
      buildRefreshVolunteerAgreementPayload_(sheet, item);

    postRefreshSigningPayload_(payload);

    SpreadsheetApp.flush();

    const pointer =
      readPointerPair_(
        sheet,
        item.row,
        'Volunteer Agreement File ID',
        'Volunteer Agreement PDF URL'
      );

    assertNewPointerPair_(
      'Volunteer Agreement',
      pointer,
      item.oldRefs
    );

    newRef = pointer;

    trashedOld =
      trashOldRefsWithRollbackInfo_(
        item.oldRefs,
        [pointer.fileId]
      );

    restoreHeaders_(
      sheet,
      item.row,
      snapshot
    );

    setPointerPair_(
      sheet,
      item.row,
      'Volunteer Agreement File ID',
      'Volunteer Agreement PDF URL',
      pointer
    );

    setDocumentRefreshUpdatedAt_(sheet, item.row);
    SpreadsheetApp.flush();

    return {
      itemKey: item.itemKey,
      status: 'refreshed',
      updatedPointers: {
        'Volunteer Agreement File ID': pointer.fileId,
        'Volunteer Agreement PDF URL': pointer.url,
      },
      trashedOldFileIds: trashedOld,
    };

  } catch (error) {
    try {
      restoreHeaders_(sheet, item.row, snapshot);
      untrashFilesByIds_(trashedOld);

      if (newRef && newRef.fileId) {
        safelyTrashFilesByIds_([newRef.fileId]);
      }
    } catch (rollbackError) {
      throw new Error(
        errorMessageRefresh_(error) +
        ' | Rollback warning: ' +
        errorMessageRefresh_(rollbackError)
      );
    }

    throw error;
  }
}


function executePpfOnlyRefresh_(item) {
  const sheet = getRefreshSheet_(item.sheetName);
  assertRefreshRowIdentity_(sheet, item);

  const rowRecord =
    readRefreshRowRecord_(sheet, item.row);

  const transactionId =
    Utilities.getUuid();

  let newFileId = '';
  let trashedOld = [];

  try {
    const generated =
      archivePpfLiabilityForRegistration_(
        item.submissionId,
        rowRecord,
        {
          signedAt: item.signedAt,
          transactionId: transactionId,
        }
      );

    if (
      !generated ||
      !generated.fileId ||
      !generated.url
    ) {
      throw new Error(
        'PPF archive helper did not return a permanent Drive file.'
      );
    }

    newFileId =
      normalizeRefreshDriveId_(generated.fileId);

    assertDriveFileExists_(newFileId);

    trashedOld =
      trashOldRefsWithRollbackInfo_(
        item.oldRefs,
        [newFileId]
      );

    setPointerPair_(
      sheet,
      item.row,
      'PPF Liability File ID',
      'PPF Liability PDF URL',
      {
        fileId: newFileId,
        url: generated.url,
      }
    );

    setDocumentRefreshUpdatedAt_(sheet, item.row);
    SpreadsheetApp.flush();

    return {
      itemKey: item.itemKey,
      status: 'refreshed',
      updatedPointers: {
        'PPF Liability File ID': newFileId,
        'PPF Liability PDF URL': generated.url,
      },
      trashedOldFileIds: trashedOld,
    };

  } catch (error) {
    untrashFilesByIds_(trashedOld);

    if (newFileId) {
      safelyTrashFilesByIds_([newFileId]);
    }

    throw error;
  }
}


function executeScholarshipRefresh_(item) {
  const sheet = getRefreshSheet_(item.sheetName);
  assertRefreshRowIdentity_(sheet, item);

  const scholarshipHeaders =
    getHeadersWithPrefix_(
      sheet,
      'scholarship_terms_'
    );

  const snapshot =
    snapshotHeaders_(
      sheet,
      item.row,
      scholarshipHeaders
    );

  let newRefs = [];
  let trashedOld = [];

  try {
    const parsed =
      callScholarshipRefreshEndpoint_(item);

    SpreadsheetApp.flush();

    if (parsed && parsed.alreadyAccepted === true) {
      throw new Error(
        'Scholarship endpoint returned alreadyAccepted and did not prove that a fresh replacement was created. No old files were deleted.'
      );
    }

    const documentPointer =
      readPointerPair_(
        sheet,
        item.row,
        'scholarship_terms_document_file_id',
        'scholarship_terms_document_url'
      );

    const pdfPointer =
      readPointerPair_(
        sheet,
        item.row,
        'scholarship_terms_pdf_file_id',
        'scholarship_terms_pdf_url'
      );

    if (!documentPointer.fileId && !pdfPointer.fileId) {
      throw new Error(
        'Scholarship endpoint did not write a new Drive document/PDF pointer.'
      );
    }

    if (documentPointer.fileId) {
      assertNewPointerPair_(
        'Scholarship document',
        documentPointer,
        item.oldRefs
      );

      newRefs.push({
        fileId: documentPointer.fileId,
        sourceHeader: 'new scholarship document',
      });
    }

    if (pdfPointer.fileId) {
      assertNewPointerPair_(
        'Scholarship PDF',
        pdfPointer,
        item.oldRefs
      );

      newRefs.push({
        fileId: pdfPointer.fileId,
        sourceHeader: 'new scholarship PDF',
      });
    }

    trashedOld =
      trashOldRefsWithRollbackInfo_(
        item.oldRefs,
        newRefs.map(function(ref) {
          return ref.fileId;
        })
      );

    restoreHeaders_(
      sheet,
      item.row,
      snapshot
    );

    const updatedPointers = {};

    if (documentPointer.fileId) {
      setPointerPair_(
        sheet,
        item.row,
        'scholarship_terms_document_file_id',
        'scholarship_terms_document_url',
        documentPointer
      );

      updatedPointers.scholarship_terms_document_file_id =
        documentPointer.fileId;
      updatedPointers.scholarship_terms_document_url =
        documentPointer.url;
    }

    if (pdfPointer.fileId) {
      setPointerPair_(
        sheet,
        item.row,
        'scholarship_terms_pdf_file_id',
        'scholarship_terms_pdf_url',
        pdfPointer
      );

      updatedPointers.scholarship_terms_pdf_file_id =
        pdfPointer.fileId;
      updatedPointers.scholarship_terms_pdf_url =
        pdfPointer.url;
    }

    setDocumentRefreshUpdatedAt_(sheet, item.row);
    SpreadsheetApp.flush();

    return {
      itemKey: item.itemKey,
      status: 'refreshed',
      updatedPointers: updatedPointers,
      trashedOldFileIds: trashedOld,
    };

  } catch (error) {
    try {
      restoreHeaders_(sheet, item.row, snapshot);
      untrashFilesByIds_(trashedOld);

      safelyTrashFilesByIds_(
        newRefs.map(function(ref) {
          return ref.fileId;
        })
      );
    } catch (rollbackError) {
      throw new Error(
        errorMessageRefresh_(error) +
        ' | Rollback warning: ' +
        errorMessageRefresh_(rollbackError)
      );
    }

    throw error;
  }
}


/* ============================================================
 * AGREEMENT PAYLOADS / ENDPOINTS
 * ============================================================
 */

function buildRefreshPlayerAgreementPayload_(sheet, item) {
  const record =
    readRefreshRowRecord_(sheet, item.row);

  const participantNames = [];

  for (let index = 1; index <= 4; index += 1) {
    const name = [
      record['player_' + index + '_first_name'],
      record['player_' + index + '_last_name'],
    ].map(normalizeRefreshValue_).filter(Boolean).join(' ');

    if (name) {
      participantNames.push(name);
    }
  }

  return {
    agreementType: 'player',
    formType: 'mls_registration',
    submissionId: item.submissionId,
    transactionId: Utilities.getUuid(),
    signer: {
      printedName: item.signerName,
    },
    signature: {
      method: 'checkbox-consent',
    },
    audit: {
      viewedAtUtc: item.signedAt,
      signedAtUtc: item.signedAt,
      consentAccepted: true,
      consentVersion: DOCUMENT_REFRESH_CONFIG.CONSENT_VERSION,
    },
    fields: {
      participantNames: participantNames.join(', '),
      guardianName: item.signerName,
      guardianDob: formatRefreshDateOnly_(record.parent_guardian_dob),
      guardianStreet: normalizeRefreshValue_(record.parent_street),
      guardianCity: normalizeRefreshValue_(record.parent_city),
      guardianState: normalizeRefreshValue_(record.parent_state),
      guardianZip: normalizeRefreshValue_(record.parent_zip),
      guardianPhone: normalizeRefreshValue_(record.parent_phone),
      guardianEmail: normalizeRefreshValue_(record.parent_email),
      signingDate: item.signedAt.slice(0, 10),
    },
  };
}


function buildRefreshVolunteerAgreementPayload_(sheet, item) {
  const record =
    readRefreshRowRecord_(sheet, item.row);

  return {
    agreementType: 'volunteer',
    formType: item.formType,
    submissionId: item.submissionId,
    transactionId: Utilities.getUuid(),
    signer: {
      printedName: item.signerName,
    },
    signature: {
      method: 'checkbox-consent',
    },
    audit: {
      viewedAtUtc: item.signedAt,
      signedAtUtc: item.signedAt,
      consentAccepted: true,
      consentVersion: DOCUMENT_REFRESH_CONFIG.CONSENT_VERSION,
    },
    fields: {
      volunteerName: item.signerName,
      volunteerDob: formatRefreshDateOnly_(record.dob),
      volunteerStreet: normalizeRefreshValue_(record.street),
      volunteerCity: normalizeRefreshValue_(record.city),
      volunteerState: normalizeRefreshValue_(record.state),
      volunteerZip: normalizeRefreshValue_(record.zip),
      volunteerPhone: normalizeRefreshValue_(record.phone),
      volunteerEmail: normalizeRefreshValue_(record.email),
      signingDate: item.signedAt.slice(0, 10),
    },
  };
}


function postRefreshSigningPayload_(payload) {
  const response = UrlFetchApp.fetch(
    DOCUMENT_REFRESH_CONFIG.SIGNING_ENDPOINT,
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      headers: {
        Origin:
          'https://mlsregistration.lifeprepacademyfoundation.com',
      },
      muteHttpExceptions: true,
    }
  );

  const code =
    response.getResponseCode();

  const text =
    response.getContentText();

  let parsed = {};

  try {
    parsed =
      JSON.parse(text || '{}');
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

  if (
    parsed.sheetUpdate &&
    parsed.sheetUpdate.ok === false
  ) {
    throw new Error(
      parsed.sheetUpdate.error ||
      'Agreement generated but permanent Drive archive callback failed.'
    );
  }

  return parsed;
}


function callScholarshipRefreshEndpoint_(item) {
  const token =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        DOCUMENT_REFRESH_CONFIG.SCHOLARSHIP_WEBHOOK_TOKEN_PROPERTY
      ) || '';

  if (!token) {
    throw new Error(
      'Missing ' +
      DOCUMENT_REFRESH_CONFIG.SCHOLARSHIP_WEBHOOK_TOKEN_PROPERTY +
      ' in Script Properties.'
    );
  }

  const response =
    UrlFetchApp.fetch(
      DOCUMENT_REFRESH_CONFIG.SCHOLARSHIP_WEB_APP_URL,
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          action:
            DOCUMENT_REFRESH_CONFIG.SCHOLARSHIP_ACTION,
          webhook_token:
            token,
          registration_submission_id:
            item.registrationId,
          parent_email:
            item.parentEmail,
          parent_name:
            item.parentName,
          participant_names:
            item.participantNames,
          accepted_at:
            item.acceptedAt,
          force_regenerate:
            true,
        }),
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
      JSON.parse(text || '{}');
  } catch (_error) {}

  if (
    code < 200 ||
    code >= 300 ||
    parsed.ok !== true
  ) {
    throw new Error(
      parsed.error ||
      (
        'Scholarship endpoint returned HTTP ' +
        code +
        ': ' +
        text
      )
    );
  }

  return parsed;
}


/* ============================================================
 * CURRENT FILE DISCOVERY
 * ============================================================
 */

function collectRefreshFileRefs_(
  row,
  map,
  fileIdHeaders,
  urlHeaders
) {
  const refs = [];

  (fileIdHeaders || []).forEach(function(header) {
    const fileId =
      normalizeRefreshDriveId_(
        refreshValue_(row, map, header)
      );

    if (fileId) {
      addRefreshRefs_(
        refs,
        [{
          fileId: fileId,
          sourceHeader: header,
          inferred: false,
        }]
      );
    }
  });

  (urlHeaders || []).forEach(function(header) {
    const fileId =
      extractRefreshDriveId_(
        refreshValue_(row, map, header)
      );

    if (fileId) {
      addRefreshRefs_(
        refs,
        [{
          fileId: fileId,
          sourceHeader: header,
          inferred: false,
        }]
      );
    }
  });

  return refs;
}


function inferPlayerAgreementRefs_(row, map, submissionId) {
  const transactionId =
    refreshValue_(
      row,
      map,
      'Player Agreement Transaction ID'
    ) || submissionId;

  const parentName = [
    refreshValue_(row, map, 'parent_first_name'),
    refreshValue_(row, map, 'parent_last_name'),
  ].filter(Boolean).join(' ').trim();

  const fileName = [
    safeRefreshFilePart_(parentName || 'Registrant'),
    'Player_Agreement',
    safeRefreshFilePart_(transactionId),
  ].join('_') + '.pdf';

  return findExactNameRefsInFolder_(
    AGREEMENT_ARCHIVE_FOLDERS.PLAYER,
    fileName,
    'inferred player filename'
  );
}


function inferVolunteerAgreementRefs_(row, map, submissionId) {
  const transactionId =
    refreshValue_(
      row,
      map,
      'Volunteer Agreement Transaction ID'
    ) || submissionId;

  const name = [
    refreshValue_(row, map, 'firstName'),
    refreshValue_(row, map, 'lastName'),
  ].filter(Boolean).join(' ').trim();

  const fileName = [
    safeRefreshFilePart_(name || 'Registrant'),
    'Volunteer_Agreement',
    safeRefreshFilePart_(transactionId),
  ].join('_') + '.pdf';

  return findExactNameRefsInFolder_(
    AGREEMENT_ARCHIVE_FOLDERS.VOLUNTEER,
    fileName,
    'inferred volunteer filename'
  );
}


function inferPpfRefs_(row, map, submissionId) {
  const transactionId =
    refreshValue_(
      row,
      map,
      'PPF Liability Transaction ID'
    ) ||
    refreshValue_(
      row,
      map,
      'Player Agreement Transaction ID'
    ) ||
    submissionId;

  const parentName = [
    refreshValue_(row, map, 'parent_first_name'),
    refreshValue_(row, map, 'parent_last_name'),
  ].filter(Boolean).join(' ').trim();

  const fileName = [
    safeRefreshFilePart_(parentName || 'Registrant'),
    'PPF_Liability',
    safeRefreshFilePart_(transactionId),
  ].join('_') + '.pdf';

  return findExactNameRefsInFolder_(
    AGREEMENT_ARCHIVE_FOLDERS.PPF,
    fileName,
    'inferred PPF filename'
  );
}


function findExactNameRefsInFolder_(
  folderId,
  fileName,
  sourceHeader
) {
  const refs = [];
  const folder =
    DriveApp.getFolderById(folderId);

  const files =
    folder.getFilesByName(fileName);

  while (files.hasNext()) {
    const file =
      files.next();

    refs.push({
      fileId: file.getId(),
      sourceHeader: sourceHeader,
      inferred: true,
      fileName: file.getName(),
    });
  }

  return refs;
}


function addRefreshRefs_(target, incoming) {
  const seen = {};

  target.forEach(function(ref) {
    seen[ref.fileId] = true;
  });

  (incoming || []).forEach(function(ref) {
    const fileId =
      normalizeRefreshDriveId_(ref.fileId);

    if (!fileId || seen[fileId]) {
      return;
    }

    seen[fileId] = true;

    target.push({
      fileId: fileId,
      sourceHeader: ref.sourceHeader || '',
      inferred: ref.inferred === true,
      fileName: ref.fileName || '',
    });
  });
}


/* ============================================================
 * SAFE DRIVE CLEANUP / ROLLBACK
 * ============================================================
 */

function trashOldRefsWithRollbackInfo_(
  refs,
  keepFileIds
) {
  const keep = {};

  (keepFileIds || []).forEach(function(id) {
    const normalized =
      normalizeRefreshDriveId_(id);

    if (normalized) {
      keep[normalized] = true;
    }
  });

  const trashed = [];
  const handled = {};

  (refs || []).forEach(function(ref) {
    const fileId =
      normalizeRefreshDriveId_(ref.fileId);

    if (
      !fileId ||
      keep[fileId] ||
      handled[fileId]
    ) {
      return;
    }

    handled[fileId] = true;

    let file;

    try {
      file =
        DriveApp.getFileById(fileId);
    } catch (_error) {
      return;
    }

    const fileName =
      safeFileNameRefresh_(file);

    const parents = [];

    try {
      const iterator =
        file.getParents();

      while (iterator.hasNext()) {
        parents.push(
          iterator.next()
        );
      }
    } catch (_error) {}

    if (fileName) {
      parents.forEach(function(folder) {
        const duplicates =
          folder.getFilesByName(fileName);

        while (duplicates.hasNext()) {
          const duplicate =
            duplicates.next();

          const duplicateId =
            duplicate.getId();

          if (
            keep[duplicateId] ||
            handled[duplicateId]
          ) {
            continue;
          }

          handled[duplicateId] = true;

          if (!duplicate.isTrashed()) {
            duplicate.setTrashed(true);
            trashed.push(duplicateId);
          }
        }
      });
    }

    if (!file.isTrashed()) {
      file.setTrashed(true);
      trashed.push(fileId);
    }
  });

  return uniqueRefreshValues_(trashed);
}


function untrashFilesByIds_(ids) {
  (ids || []).forEach(function(id) {
    const fileId =
      normalizeRefreshDriveId_(id);

    if (!fileId) return;

    try {
      const file =
        DriveApp.getFileById(fileId);

      if (file.isTrashed()) {
        file.setTrashed(false);
      }
    } catch (_error) {}
  });
}


function safelyTrashFilesByIds_(ids) {
  (ids || []).forEach(function(id) {
    const fileId =
      normalizeRefreshDriveId_(id);

    if (!fileId) return;

    try {
      const file =
        DriveApp.getFileById(fileId);

      if (!file.isTrashed()) {
        file.setTrashed(true);
      }
    } catch (_error) {}
  });
}


/* ============================================================
 * POINTER / SHEET HELPERS
 * ============================================================
 */

function getRefreshSheet_(sheetName) {
  const spreadsheetId =
    typeof MLSGO_CONFIG !== 'undefined' &&
    MLSGO_CONFIG &&
    MLSGO_CONFIG.SHEET_ID
      ? MLSGO_CONFIG.SHEET_ID
      : '';

  if (!spreadsheetId) {
    throw new Error(
      'Spreadsheet ID is not configured in MLSGO_CONFIG.SHEET_ID.'
    );
  }

  const sheet =
    SpreadsheetApp
      .openById(spreadsheetId)
      .getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(
      'Missing sheet: ' + sheetName
    );
  }

  return sheet;
}


function readRefreshTable_(sheet) {
  const values =
    sheet
      .getDataRange()
      .getValues();

  if (!values.length) {
    return {
      headers: [],
      rows: [],
      map: {},
    };
  }

  const headers =
    values[0].map(function(value) {
      return String(value || '').trim();
    });

  return {
    headers: headers,
    rows: values.slice(1),
    map: refreshHeaderMap_(headers),
  };
}


function refreshHeaderMap_(headers) {
  return headers.reduce(
    function(map, header, index) {
      const key =
        String(header || '').trim();

      if (
        key &&
        typeof map[key] === 'undefined'
      ) {
        map[key] = index;
      }

      return map;
    },
    {}
  );
}


function refreshRawValue_(
  row,
  map,
  header
) {
  return typeof map[header] === 'number'
    ? row[map[header]]
    : '';
}


function refreshValue_(
  row,
  map,
  header
) {
  return normalizeRefreshValue_(
    refreshRawValue_(
      row,
      map,
      header
    )
  );
}


function readRefreshRowRecord_(
  sheet,
  rowNumber
) {
  const table =
    readRefreshTable_(sheet);

  const values =
    sheet
      .getRange(
        rowNumber,
        1,
        1,
        table.headers.length
      )
      .getValues()[0];

  const record = {};

  table.headers.forEach(function(header, index) {
    record[header] = values[index];
  });

  return record;
}


function assertRefreshRowIdentity_(
  sheet,
  item
) {
  const table =
    readRefreshTable_(sheet);

  const idHeader =
    item.sheetName === 'Players' ||
    item.sheetName === 'Scholarships'
      ? 'registration_submission_id'
      : 'submission_id';

  const index =
    table.map[idHeader];

  if (typeof index !== 'number') {
    throw new Error(
      'Missing row identity header: ' + idHeader
    );
  }

  const actual =
    normalizeRefreshValue_(
      sheet
        .getRange(
          item.row,
          index + 1
        )
        .getValue()
    );

  if (actual !== item.submissionId) {
    throw new Error(
      'Row identity changed before refresh. Expected ' +
      item.submissionId +
      ' but found ' +
      actual +
      '.'
    );
  }
}


function snapshotHeaders_(
  sheet,
  rowNumber,
  headers
) {
  const table =
    readRefreshTable_(sheet);

  const snapshot = {};

  (headers || []).forEach(function(header) {
    const index =
      table.map[header];

    if (typeof index === 'number') {
      snapshot[header] =
        sheet
          .getRange(
            rowNumber,
            index + 1
          )
          .getValue();
    }
  });

  return snapshot;
}


function restoreHeaders_(
  sheet,
  rowNumber,
  snapshot
) {
  const table =
    readRefreshTable_(sheet);

  Object.keys(snapshot || {}).forEach(function(header) {
    const index =
      table.map[header];

    if (typeof index === 'number') {
      sheet
        .getRange(
          rowNumber,
          index + 1
        )
        .setValue(
          snapshot[header]
        );
    }
  });
}


function readPointerPair_(
  sheet,
  rowNumber,
  fileIdHeader,
  urlHeader
) {
  const table =
    readRefreshTable_(sheet);

  const fileIndex =
    table.map[fileIdHeader];

  const urlIndex =
    table.map[urlHeader];

  const fileId =
    typeof fileIndex === 'number'
      ? normalizeRefreshDriveId_(
          sheet
            .getRange(
              rowNumber,
              fileIndex + 1
            )
            .getDisplayValue()
        )
      : '';

  const rawUrl =
    typeof urlIndex === 'number'
      ? normalizeRefreshValue_(
          sheet
            .getRange(
              rowNumber,
              urlIndex + 1
            )
            .getDisplayValue()
        )
      : '';

  return {
    fileId: fileId,
    url: fileId
      ? canonicalRefreshDriveUrl_(fileId)
      : rawUrl,
  };
}


function setPointerPair_(
  sheet,
  rowNumber,
  fileIdHeader,
  urlHeader,
  pointer
) {
  const table =
    readRefreshTable_(sheet);

  const fileIndex =
    table.map[fileIdHeader];

  const urlIndex =
    table.map[urlHeader];

  if (
    typeof fileIndex !== 'number' ||
    typeof urlIndex !== 'number'
  ) {
    throw new Error(
      'Missing pointer header(s): ' +
      fileIdHeader +
      ' / ' +
      urlHeader
    );
  }

  sheet
    .getRange(
      rowNumber,
      fileIndex + 1
    )
    .setValue(
      pointer.fileId || ''
    );

  const canonicalUrl = pointer.fileId
    ? canonicalRefreshDriveUrl_(pointer.fileId)
    : (pointer.url || '');

  sheet
    .getRange(
      rowNumber,
      urlIndex + 1
    )
    .setValue(canonicalUrl);
}


function setRefreshCellByHeader_(sheet, rowNumber, header, value) {
  const table = readRefreshTable_(sheet);
  const index = table.map[header];
  if (typeof index !== 'number') {
    throw new Error('Missing header: ' + header);
  }
  sheet.getRange(rowNumber, index + 1).setValue(value);
}


function getHeadersWithPrefix_(
  sheet,
  prefix
) {
  const table =
    readRefreshTable_(sheet);

  return table.headers.filter(function(header) {
    return header.indexOf(prefix) === 0;
  });
}


/* ============================================================
 * VERIFICATION
 * ============================================================
 */

function assertNewPointerPair_(
  label,
  pointer,
  oldRefs
) {
  if (
    !pointer ||
    !pointer.fileId ||
    !pointer.url
  ) {
    throw new Error(
      label +
      ' did not produce both a permanent Drive File ID and URL.'
    );
  }

  assertDriveFileExists_(
    pointer.fileId
  );

  const oldIds = {};

  (oldRefs || []).forEach(function(ref) {
    oldIds[
      normalizeRefreshDriveId_(ref.fileId)
    ] = true;
  });

  if (oldIds[pointer.fileId]) {
    throw new Error(
      label +
      ' returned the same Drive file as the old document; refresh was not proven. Old files were not deleted.'
    );
  }
}


function assertDriveFileExists_(fileId) {
  const normalized =
    normalizeRefreshDriveId_(fileId);

  if (!normalized) {
    throw new Error(
      'Invalid Drive file ID.'
    );
  }

  const file =
    DriveApp.getFileById(normalized);

  if (file.isTrashed()) {
    throw new Error(
      'Generated Drive file is already trashed: ' +
      normalized
    );
  }

  return file;
}


function canonicalRefreshDriveUrl_(fileId) {
  const normalized = normalizeRefreshDriveId_(fileId);
  return normalized
    ? 'https://drive.google.com/file/d/' + normalized + '/view'
    : '';
}

function buildDuplicateArchiveCleanupPlan_() {
  const keep = collectAuthoritativeArchiveKeepSet_();
  const candidates = [];

  scanGeneratedArchiveFolder_(
    AGREEMENT_ARCHIVE_FOLDERS.PLAYER,
    '_Player_Agreement_',
    'player',
    keep.ids,
    keep.names,
    candidates
  );

  scanGeneratedArchiveFolder_(
    AGREEMENT_ARCHIVE_FOLDERS.PPF,
    '_PPF_Liability_',
    'ppf',
    keep.ids,
    keep.names,
    candidates
  );

  scanGeneratedArchiveFolder_(
    AGREEMENT_ARCHIVE_FOLDERS.VOLUNTEER,
    '_Volunteer_Agreement_',
    'volunteer',
    keep.ids,
    keep.names,
    candidates
  );

  const scholarshipAgreementFolder = getScholarshipAgreementFolderForCleanup_();
  if (scholarshipAgreementFolder) {
    scanGeneratedArchiveFolderObject_(
      scholarshipAgreementFolder,
      'Paducah GO Scholarship - ',
      'scholarship_document',
      keep.ids,
      keep.names,
      candidates,
      true
    );

    // Any TEMP copies left behind are never authoritative completed records.
    scanGeneratedArchiveFolderObject_(
      scholarshipAgreementFolder,
      'TEMP Scholarship - ',
      'scholarship_temp',
      {},
      {},
      candidates,
      true
    );
  }

  const scholarshipApplicationsFolderId = getScholarshipApplicationsFolderIdForCleanup_();
  if (scholarshipApplicationsFolderId) {
    scanGeneratedArchiveFolder_(
      scholarshipApplicationsFolderId,
      '_Scholarship_Application_',
      'scholarship_pdf',
      keep.ids,
      keep.names,
      candidates
    );
  }

  // A file may be discovered by more than one conservative scan. Deduplicate by ID.
  const uniqueCandidates = [];
  const seen = {};
  candidates.forEach(function(item) {
    if (!item.fileId || seen[item.fileId]) return;
    seen[item.fileId] = true;
    uniqueCandidates.push(item);
  });

  return {
    mode: 'duplicate-preview',
    totals: {
      protectedIds: Object.keys(keep.ids).length,
      protectedNames: Object.keys(keep.names).length,
      candidates: uniqueCandidates.length,
      playerCandidates: uniqueCandidates.filter(function(item) { return item.kind === 'player'; }).length,
      ppfCandidates: uniqueCandidates.filter(function(item) { return item.kind === 'ppf'; }).length,
      volunteerCandidates: uniqueCandidates.filter(function(item) { return item.kind === 'volunteer'; }).length,
      scholarshipDocumentCandidates: uniqueCandidates.filter(function(item) { return item.kind === 'scholarship_document'; }).length,
      scholarshipPdfCandidates: uniqueCandidates.filter(function(item) { return item.kind === 'scholarship_pdf'; }).length,
      scholarshipTempCandidates: uniqueCandidates.filter(function(item) { return item.kind === 'scholarship_temp'; }).length,
    },
    candidates: uniqueCandidates,
  };
}

function collectAuthoritativeArchiveKeepSet_() {
  const ids = {};
  const names = {};

  collectPlayerArchiveKeepSetInto_(ids, names);
  collectVolunteerArchiveKeepSetInto_('Volunteers', ids, names);
  collectVolunteerArchiveKeepSetInto_('Coaches', ids, names);
  collectScholarshipArchiveKeepSetInto_(ids, names);

  return { ids: ids, names: names };
}

function collectPlayerArchiveKeepSetInto_(ids, names) {
  const sheet = getRefreshSheet_('Players');
  const table = readRefreshTable_(sheet);

  table.rows.forEach(function(row) {
    [
      ['Player Agreement File ID', 'Player Agreement PDF URL'],
      ['PPF Liability File ID', 'PPF Liability PDF URL'],
    ].forEach(function(pair) {
      addPointerToKeepSet_(row, table.map, pair[0], pair[1], ids, names);
    });

    const submissionId = refreshValue_(row, table.map, 'registration_submission_id');
    if (!submissionId) return;

    addKeepRefs_(ids, names, inferPlayerAgreementRefs_(row, table.map, submissionId));
    addKeepRefs_(ids, names, inferPpfRefs_(row, table.map, submissionId));
  });
}

function collectVolunteerArchiveKeepSetInto_(sheetName, ids, names) {
  const sheet = getRefreshSheet_(sheetName);
  const table = readRefreshTable_(sheet);

  table.rows.forEach(function(row) {
    addPointerToKeepSet_(
      row,
      table.map,
      'Volunteer Agreement File ID',
      'Volunteer Agreement PDF URL',
      ids,
      names
    );

    const submissionId = refreshValue_(row, table.map, 'submission_id');
    if (!submissionId) return;

    addKeepRefs_(
      ids,
      names,
      inferVolunteerAgreementRefs_(row, table.map, submissionId)
    );
  });
}

function collectScholarshipArchiveKeepSetInto_(ids, names) {
  const sheet = getRefreshSheet_('Scholarships');
  const table = readRefreshTable_(sheet);

  table.rows.forEach(function(row) {
    addPointerToKeepSet_(
      row,
      table.map,
      'scholarship_terms_document_file_id',
      'scholarship_terms_document_url',
      ids,
      names
    );

    addPointerToKeepSet_(
      row,
      table.map,
      'scholarship_terms_pdf_file_id',
      'scholarship_terms_pdf_url',
      ids,
      names
    );
  });
}

function addPointerToKeepSet_(row, map, fileIdHeader, urlHeader, ids, names) {
  const fileId = normalizeRefreshDriveId_(refreshValue_(row, map, fileIdHeader));
  const urlValue = refreshValue_(row, map, urlHeader);
  const urlId = extractRefreshDriveId_(urlValue);

  if (fileId) {
    ids[fileId] = true;
    try {
      const file = DriveApp.getFileById(fileId);
      if (!file.isTrashed()) names[file.getName()] = true;
    } catch (_error) {}
  }

  if (urlId) {
    ids[urlId] = true;
    try {
      const file = DriveApp.getFileById(urlId);
      if (!file.isTrashed()) names[file.getName()] = true;
    } catch (_error) {}
  }

  const pointerName = extractRefreshFileNameFromPointer_(urlValue);
  if (pointerName) names[pointerName] = true;
}

function getScholarshipAgreementFolderForCleanup_() {
  const propertyId = PropertiesService.getScriptProperties().getProperty(
    'SCHOLARSHIP_AGREEMENT_FOLDER_ID'
  );

  if (propertyId) {
    try {
      return DriveApp.getFolderById(propertyId);
    } catch (_error) {}
  }

  const folders = DriveApp.getFoldersByName('Paducah GO Scholarship Agreements');
  return folders.hasNext() ? folders.next() : null;
}

function getScholarshipApplicationsFolderIdForCleanup_() {
  // Existing live Scholarship Applications folder.
  return '1Qg8e_tlphUmT17HBiaw3Onz3h3i7LKSX';
}

function addKeepRefs_(ids, names, refs) {
  (refs || []).forEach(function(ref) {
    const id = normalizeRefreshDriveId_(ref.fileId);
    if (id) ids[id] = true;
    if (ref.fileName) names[ref.fileName] = true;
  });
}

function scanGeneratedArchiveFolder_(folderId, marker, kind, keepIds, keepNames, output) {
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();

  while (files.hasNext()) {
    const file = files.next();
    const fileId = file.getId();
    const fileName = file.getName();

    if (file.isTrashed()) continue;
    if (fileName.indexOf(marker) < 0) continue;
    if (keepIds[fileId]) continue;
    if (keepNames[fileName]) continue;

    output.push({
      kind: kind,
      fileId: fileId,
      fileName: fileName,
      createdAt: file.getDateCreated().toISOString(),
    });
  }
}

function scanGeneratedArchiveFolderObject_(folder, marker, kind, keepIds, keepNames, output, prefixMatch) {
  const files = folder.getFiles();

  while (files.hasNext()) {
    const file = files.next();
    const fileId = file.getId();
    const fileName = file.getName();

    if (file.isTrashed()) continue;

    const matches = prefixMatch === true
      ? fileName.indexOf(marker) === 0
      : fileName.indexOf(marker) >= 0;

    if (!matches) continue;
    if (keepIds[fileId]) continue;
    if (keepNames[fileName]) continue;

    output.push({
      kind: kind,
      fileId: fileId,
      fileName: fileName,
      createdAt: file.getDateCreated().toISOString(),
    });
  }
}

function extractRefreshFileNameFromPointer_(value) {
  let text = normalizeRefreshValue_(value);
  if (!text) return '';

  if (text.charAt(0) === '@') {
    text = text.substring(1);
  }

  if (/^[^/]+\.pdf$/i.test(text)) {
    return text;
  }

  try {
    const decoded = decodeURIComponent(text);
    const match = decoded.match(/([^/?#]+\.pdf)(?:[?#]|$)/i);
    return match ? match[1] : '';
  } catch (_error) {
    return '';
  }
}

function repairCurrentArchiveDocumentUrls_() {
  let repaired = 0;

  repaired += repairPointerUrlsOnSheet_(
    'Players',
    [
      ['Player Agreement File ID', 'Player Agreement PDF URL'],
      ['PPF Liability File ID', 'PPF Liability PDF URL'],
    ]
  );

  repaired += repairPointerUrlsOnSheet_(
    'Volunteers',
    [['Volunteer Agreement File ID', 'Volunteer Agreement PDF URL']]
  );

  repaired += repairPointerUrlsOnSheet_(
    'Coaches',
    [['Volunteer Agreement File ID', 'Volunteer Agreement PDF URL']]
  );

  repaired += repairPointerUrlsOnSheet_(
    'Scholarships',
    [
      ['scholarship_terms_document_file_id', 'scholarship_terms_document_url'],
      ['scholarship_terms_pdf_file_id', 'scholarship_terms_pdf_url'],
    ]
  );

  SpreadsheetApp.flush();
  return repaired;
}

function repairPointerUrlsOnSheet_(sheetName, pairs) {
  const sheet = getRefreshSheet_(sheetName);
  const table = readRefreshTable_(sheet);
  let repaired = 0;

  table.rows.forEach(function(row, index) {
    const rowNumber = index + 2;

    (pairs || []).forEach(function(pair) {
      const fileId = normalizeRefreshDriveId_(refreshValue_(row, table.map, pair[0]));
      if (!fileId) return;

      let expected = '';
      try {
        const file = DriveApp.getFileById(fileId);
        if (file.isTrashed()) return;
        expected = file.getUrl();
      } catch (_error) {
        return;
      }

      const current = refreshValue_(row, table.map, pair[1]);
      if (expected && current !== expected) {
        setRefreshCellByHeader_(sheet, rowNumber, pair[1], expected);
        repaired++;
      }
    });
  });

  return repaired;
}

/* ============================================================
 * DIAGNOSTICS
 * ============================================================
 */

function buildRefreshDiagnostics_(plan) {
  const flat =
    flattenRefreshPlan_(plan);

  const totals = {
    total: flat.length,
    ready: 0,
    skipped: 0,
    players: (plan.players || []).length,
    scholarships: (plan.scholarships || []).length,
    volunteers: (plan.volunteers || []).length,
    coaches: (plan.coaches || []).length,
  };

  const skipped = [];
  const missingCurrentDriveRefs = [];
  const inferredDriveRefs = [];

  flat.forEach(function(item) {
    if (item.ready) {
      totals.ready++;
    } else {
      totals.skipped++;

      skipped.push({
        sheetName: item.sheetName,
        row: item.row,
        submissionId: item.submissionId,
        documentType: item.documentType,
        reason: item.reason,
      });
    }

    const refs =
      item.oldRefs || [];

    if (
      item.ready &&
      !refs.length
    ) {
      missingCurrentDriveRefs.push({
        sheetName: item.sheetName,
        row: item.row,
        submissionId: item.submissionId,
        documentType: item.documentType,
      });
    }

    refs.forEach(function(ref) {
      if (ref.inferred) {
        inferredDriveRefs.push({
          sheetName: item.sheetName,
          row: item.row,
          submissionId: item.submissionId,
          documentType: item.documentType,
          fileId: ref.fileId,
          fileName: ref.fileName || '',
          source: ref.sourceHeader,
        });
      }
    });
  });

  return {
    totals: totals,
    skipped: skipped,
    missingCurrentDriveRefs: missingCurrentDriveRefs,
    inferredDriveRefs: inferredDriveRefs,
  };
}


function checkRefreshConfig_(
  name,
  value
) {
  return {
    check: name,
    ok: Boolean(value),
    detail:
      value
        ? 'configured'
        : 'missing',
  };
}


function flattenRefreshPlan_(plan) {
  return []
    .concat(plan.players || [])
    .concat(plan.scholarships || [])
    .concat(plan.volunteers || [])
    .concat(plan.coaches || []);
}


/* ============================================================
 * RESUMABLE LOG
 * ============================================================
 */

function getRefreshLogSheet_() {
  const spreadsheetId =
    MLSGO_CONFIG.SHEET_ID;

  const ss =
    SpreadsheetApp.openById(
      spreadsheetId
    );

  let sheet =
    ss.getSheetByName(
      DOCUMENT_REFRESH_CONFIG.LOG_SHEET
    );

  if (!sheet) {
    sheet =
      ss.insertSheet(
        DOCUMENT_REFRESH_CONFIG.LOG_SHEET
      );
  }

  ensureRefreshLogHeaders_(sheet);
  return sheet;
}


function ensureRefreshLogHeaders_(sheet) {
  const current =
    sheet.getLastColumn() > 0
      ? sheet
          .getRange(
            1,
            1,
            1,
            Math.max(
              sheet.getLastColumn(),
              REFRESH_LOG_HEADERS.length
            )
          )
          .getDisplayValues()[0]
      : [];

  let changed = false;

  REFRESH_LOG_HEADERS.forEach(function(header, index) {
    if (
      normalizeRefreshValue_(
        current[index]
      ) !== header
    ) {
      sheet
        .getRange(
          1,
          index + 1
        )
        .setValue(header);

      changed = true;
    }
  });

  if (changed) {
    sheet
      .getRange(
        1,
        1,
        1,
        REFRESH_LOG_HEADERS.length
      )
      .setFontWeight('bold');

    sheet.setFrozenRows(1);
  }
}


function readCompletedRefreshKeys_(sheet) {
  const result = {};

  if (sheet.getLastRow() < 2) {
    return result;
  }

  const values =
    sheet
      .getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        REFRESH_LOG_HEADERS.length
      )
      .getDisplayValues();

  values.forEach(function(row) {
    if (
      normalizeRefreshValue_(row[6])
        .toLowerCase() === 'completed'
    ) {
      result[
        normalizeRefreshValue_(row[0])
      ] = true;
    }
  });

  return result;
}


function upsertRefreshLog_(
  sheet,
  item,
  state
) {
  const rowNumber =
    findRefreshLogRow_(
      sheet,
      item.itemKey
    );

  const values = [
    item.itemKey,
    item.group,
    item.sheetName,
    item.row,
    item.submissionId,
    item.documentType,
    state.status || '',
    state.message || '',
    state.startedAt || '',
    state.completedAt || '',
    JSON.stringify(
      state.pointers || {}
    ),
    JSON.stringify(
      state.trashedIds || []
    ),
  ];

  if (rowNumber > 0) {
    sheet
      .getRange(
        rowNumber,
        1,
        1,
        values.length
      )
      .setValues([values]);
  } else {
    sheet.appendRow(values);
  }
}


function findRefreshLogRow_(
  sheet,
  itemKey
) {
  if (sheet.getLastRow() < 2) {
    return 0;
  }

  const values =
    sheet
      .getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        1
      )
      .getDisplayValues();

  for (
    let index = 0;
    index < values.length;
    index += 1
  ) {
    if (
      normalizeRefreshValue_(
        values[index][0]
      ) === itemKey
    ) {
      return index + 2;
    }
  }

  return 0;
}


/* ============================================================
 * REFRESH DATE / AUDIT HELPERS
 * ============================================================
 */

/**
 * Render a Sheet date as a date only. This prevents Apps Script Date objects
 * from becoming strings such as:
 *   Mon Nov 09 1981 00:00:00 GMT-0500 (Eastern Standard Time)
 * in completed agreements.
 *
 * The spreadsheet's timezone is used so the date remains exactly the
 * calendar date recorded in the row.
 */
function formatRefreshDateOnly_(value) {
  if (
    value === null ||
    typeof value === 'undefined' ||
    value === ''
  ) {
    return '';
  }

  const timeZone = getRefreshSpreadsheetTimeZone_();

  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, timeZone, 'MM/dd/yyyy');
  }

  const text = normalizeRefreshValue_(value);
  if (!text) return '';

  let match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    return String(match[1]).padStart(2, '0') + '/' +
      String(match[2]).padStart(2, '0') + '/' + match[3];
  }

  match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|$)/);
  if (match) {
    return match[2] + '/' + match[3] + '/' + match[1];
  }

  const monthMap = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04',
    May: '05', Jun: '06', Jul: '07', Aug: '08',
    Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  };

  match = text.match(
    /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\s+(\d{4})\b/
  );
  if (match) {
    return monthMap[match[1]] + '/' +
      String(match[2]).padStart(2, '0') + '/' + match[3];
  }

  return text;
}


function getRefreshSpreadsheetTimeZone_() {
  try {
    if (
      typeof MLSGO_CONFIG !== 'undefined' &&
      MLSGO_CONFIG &&
      MLSGO_CONFIG.SHEET_ID
    ) {
      return SpreadsheetApp
        .openById(MLSGO_CONFIG.SHEET_ID)
        .getSpreadsheetTimeZone();
    }
  } catch (_error) {}

  try {
    return Session.getScriptTimeZone() || 'America/Chicago';
  } catch (_error) {
    return 'America/Chicago';
  }
}


/**
 * Store the actual document-refresh edit time on the source Sheet row.
 * This timestamp is never rendered into the PDF.
 */
function setDocumentRefreshUpdatedAt_(sheet, rowNumber) {
  const header = 'Document Refresh Updated At';
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet
    .getRange(1, 1, 1, lastColumn)
    .getDisplayValues()[0]
    .map(function(value) {
      return normalizeRefreshValue_(value);
    });

  let column = headers.indexOf(header) + 1;
  if (column < 1) {
    column = lastColumn + 1;
    sheet.getRange(1, column).setValue(header);
  }

  sheet
    .getRange(rowNumber, column)
    .setValue(new Date())
    .setNumberFormat('M/d/yyyy h:mm:ss AM/PM');
}


/**
 * One-time helper after installing the DOB fix.
 * It re-queues only completed Player Agreement bundles so the corrected
 * date-only DOB can be regenerated. Other completed document types remain
 * untouched.
 */
function AGREEMENTS_resetCompletedPlayerRefreshesForDobFix() {
  const sheet = getRefreshLogSheet_();
  if (sheet.getLastRow() < 2) {
    return { reset: 0 };
  }

  const values = sheet
    .getRange(
      2,
      1,
      sheet.getLastRow() - 1,
      REFRESH_LOG_HEADERS.length
    )
    .getValues();

  let reset = 0;

  values.forEach(function(row, index) {
    const documentType = normalizeRefreshValue_(row[5]);
    const status = normalizeRefreshValue_(row[6]).toLowerCase();

    if (
      documentType === 'player_bundle' &&
      status === 'completed'
    ) {
      const sheetRow = index + 2;
      sheet.getRange(sheetRow, 7).setValue('pending-dob-fix');
      sheet.getRange(sheetRow, 8).setValue(
        'Re-queued to regenerate Player Agreement with date-only DOB from Players sheet.'
      );
      sheet.getRange(sheetRow, 10).clearContent();
      reset++;
    }
  });

  SpreadsheetApp.flush();
  return { reset: reset };
}


/* ============================================================
 * DATE / ID / NAME HELPERS
 * ============================================================
 */

function strictRefreshIsoDate_(value) {
  if (
    value === null ||
    typeof value === 'undefined' ||
    value === ''
  ) {
    return '';
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString();
}


function refreshAgeYears_(
  dobValue,
  signedAtIso
) {
  const dob =
    dobValue instanceof Date
      ? dobValue
      : new Date(dobValue);

  const signedAt =
    signedAtIso
      ? new Date(signedAtIso)
      : null;

  if (
    isNaN(dob.getTime()) ||
    !signedAt ||
    isNaN(signedAt.getTime())
  ) {
    return NaN;
  }

  let age =
    signedAt.getFullYear() -
    dob.getFullYear();

  const monthDelta =
    signedAt.getMonth() -
    dob.getMonth();

  if (
    monthDelta < 0 ||
    (
      monthDelta === 0 &&
      signedAt.getDate() < dob.getDate()
    )
  ) {
    age--;
  }

  return age;
}


function buildRefreshParticipants_(row, map) {
  const participants = [];

  for (let index = 1; index <= 4; index += 1) {
    const first =
      refreshValue_(
        row,
        map,
        'player_' + index + '_first_name'
      );

    const last =
      refreshValue_(
        row,
        map,
        'player_' + index + '_last_name'
      );

    const name =
      [first, last]
        .filter(Boolean)
        .join(' ')
        .trim();

    if (!name) continue;

    let grade =
      refreshValue_(
        row,
        map,
        'player_' + index + '_grade'
      );

    const gender =
      refreshValue_(
        row,
        map,
        'player_' + index + '_gender'
      );

    if (
      grade &&
      !/\b(Boys|Girls)\b/i.test(grade)
    ) {
      if (/^(Male|Boy|Boys)$/i.test(gender)) {
        grade += ' Boys';
      } else if (/^(Female|Girl|Girls)$/i.test(gender)) {
        grade += ' Girls';
      }
    }

    participants.push({
      name: name,
      grade: grade,
    });
  }

  return participants;
}


function extractRefreshDriveId_(value) {
  const text =
    normalizeRefreshValue_(value);

  if (!text) {
    return '';
  }

  const pathMatch =
    text.match(
      /\/d\/([-\w]{20,})/
    );

  if (pathMatch) {
    return pathMatch[1];
  }

  const queryMatch =
    text.match(
      /[?&]id=([-\w]{20,})/
    );

  return queryMatch
    ? queryMatch[1]
    : '';
}


function normalizeRefreshDriveId_(value) {
  const text =
    normalizeRefreshValue_(value);

  return /^[-\w]{20,}$/.test(text)
    ? text
    : '';
}


function safeRefreshFilePart_(value) {
  const cleaned =
    normalizeRefreshValue_(value)
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


function normalizeRefreshValue_(value) {
  return String(
    value === null ||
    typeof value === 'undefined'
      ? ''
      : value
  ).trim();
}


function safeFileNameRefresh_(file) {
  try {
    return file.getName();
  } catch (_error) {
    return '';
  }
}


function uniqueRefreshValues_(values) {
  const seen = {};

  return (values || []).filter(function(value) {
    const key =
      normalizeRefreshValue_(value);

    if (!key || seen[key]) {
      return false;
    }

    seen[key] = true;
    return true;
  });
}


function errorMessageRefresh_(error) {
  return String(
    error &&
    error.message
      ? error.message
      : error
  );
}
