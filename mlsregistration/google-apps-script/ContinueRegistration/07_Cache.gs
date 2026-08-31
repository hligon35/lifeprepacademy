/**
 * Paducah GO Soccer - continuation cache/archive helpers.
 *
 * The Players sheet remains the active source of truth. Confirmed duplicate
 * attempts and parent-withdrawn registrations are copied to Cache first and
 * only then removed from Players.
 */
const CONTINUE_CACHE_SHEET_NAME = 'Cache';
const CONTINUE_CACHE_METADATA_HEADERS = Object.freeze([
  'Cache Reason',
  'Cached At',
  'Continuation Case ID',
  'Canonical Registration ID',
  'Withdrawal Verification Method',
  'Original Players Row',
]);

function getOrCreateContinuationCacheSheet_() {
  const ss = SpreadsheetApp.openById(CONTINUE_CONFIG.SPREADSHEET_ID);
  const players = requireSheet_(ss, CONTINUE_CONFIG.PLAYERS_SHEET);
  const cache = getOrCreateSheet_(ss, CONTINUE_CACHE_SHEET_NAME);

  const playerHeaders = players.getRange(1, 1, 1, Math.max(1, players.getLastColumn()))
    .getDisplayValues()[0]
    .map(normalize_)
    .filter(Boolean);
  const requiredHeaders = playerHeaders.concat(CONTINUE_CACHE_METADATA_HEADERS);
  const existingHeaders = cache.getLastColumn() > 0
    ? cache.getRange(1, 1, 1, cache.getLastColumn()).getDisplayValues()[0].map(normalize_).filter(Boolean)
    : [];
  if (!existingHeaders.length) {
    cache.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
  } else {
    ensureHeaders_(cache, requiredHeaders);
  }
  return cache;
}

function archivePlayerRecordsToCache_(records, metadata) {
  const safeRecords = (records || []).filter(function(record) {
    return record && Number(record._row) >= 2 && normalize_(record.registration_submission_id);
  });
  if (!safeRecords.length) return { archived: [], deletedRows: [] };

  const ss = SpreadsheetApp.openById(CONTINUE_CONFIG.SPREADSHEET_ID);
  const players = requireSheet_(ss, CONTINUE_CONFIG.PLAYERS_SHEET);
  const cache = getOrCreateContinuationCacheSheet_();
  const playersHeaders = players.getRange(1, 1, 1, players.getLastColumn()).getDisplayValues()[0].map(normalize_);
  const cacheHeaders = cache.getRange(1, 1, 1, cache.getLastColumn()).getDisplayValues()[0].map(normalize_);
  const now = timestamp_();
  const rowsToAppend = [];
  const archived = [];

  safeRecords.forEach(function(record) {
    const raw = players.getRange(record._row, 1, 1, players.getLastColumn()).getValues()[0];
    const byHeader = {};
    playersHeaders.forEach(function(header, index) {
      if (header) byHeader[header] = raw[index];
    });

    const cacheRow = cacheHeaders.map(function(header) {
      if (Object.prototype.hasOwnProperty.call(byHeader, header)) return byHeader[header];
      if (header === 'Cache Reason') return safeSheetValue_(metadata && metadata.reason || 'Archived');
      if (header === 'Cached At') return safeSheetValue_(metadata && metadata.cachedAt || now);
      if (header === 'Continuation Case ID') return safeSheetValue_(metadata && metadata.caseId || '');
      if (header === 'Canonical Registration ID') return safeSheetValue_(metadata && metadata.canonicalRegistrationId || '');
      if (header === 'Withdrawal Verification Method') return safeSheetValue_(metadata && metadata.verificationMethod || '');
      if (header === 'Original Players Row') return Number(record._row);
      return '';
    });

    rowsToAppend.push(cacheRow);
    archived.push({
      registrationId: normalize_(record.registration_submission_id),
      originalRow: Number(record._row),
    });
  });

  const startRow = Math.max(2, cache.getLastRow() + 1);
  cache.getRange(startRow, 1, rowsToAppend.length, cacheHeaders.length).setValues(rowsToAppend);
  SpreadsheetApp.flush();

  const cacheIds = cache.getRange(startRow, 1, rowsToAppend.length, cacheHeaders.length).getDisplayValues();
  const registrationIdIndex = cacheHeaders.indexOf('registration_submission_id');
  if (registrationIdIndex < 0) throw new Error('Cache is missing registration_submission_id.');

  archived.forEach(function(item, index) {
    if (normalize_(cacheIds[index][registrationIdIndex]) !== item.registrationId) {
      throw new Error('Cache verification failed for registration ' + item.registrationId + '. Players rows were not removed.');
    }
  });

  const rowsToDelete = archived.map(function(item) { return item.originalRow; })
    .sort(function(a, b) { return b - a; });
  rowsToDelete.forEach(function(rowNumber) {
    players.deleteRow(rowNumber);
  });

  return { archived: archived, deletedRows: rowsToDelete };
}

function buildWithdrawalVerificationOptions_(caseRecord, tokenPayload) {
  const snapshot = buildMergedRegistrationSnapshot_(caseRecord, tokenPayload);
  return {
    parentLabel: 'Parent/Guardian date of birth',
    players: (snapshot.players || []).map(function(player, index) {
      return {
        index: index,
        name: [normalize_(player.firstName), normalize_(player.lastName)].filter(Boolean).join(' '),
      };
    }),
  };
}

function verifyWithdrawalDob_(caseRecord, tokenPayload, request) {
  const snapshot = buildMergedRegistrationSnapshot_(caseRecord, tokenPayload);
  const enteredDob = normalizeDateKey_(request && request.dob);
  if (!enteredDob) return { ok: false, error: 'Enter a valid date of birth.' };

  const subjectType = normalize_(request && request.subjectType).toLowerCase();
  let expectedDob = '';
  let verifiedSubject = '';
  let verificationMethod = '';

  if (subjectType === 'parent') {
    expectedDob = normalizeDateKey_(snapshot.parent && snapshot.parent.dob);
    verifiedSubject = 'Parent/Guardian';
    verificationMethod = 'Parent DOB';
  } else if (subjectType === 'player') {
    const playerIndex = Number(request && request.playerIndex);
    const player = Array.isArray(snapshot.players) ? snapshot.players[playerIndex] : null;
    if (!player) return { ok: false, error: 'Choose a registered player to verify.' };
    expectedDob = normalizeDateKey_(player.dob);
    verifiedSubject = [normalize_(player.firstName), normalize_(player.lastName)].filter(Boolean).join(' ') || ('Player ' + (playerIndex + 1));
    verificationMethod = 'Player DOB';
  } else {
    return { ok: false, error: 'Choose whose date of birth you want to verify.' };
  }

  if (!expectedDob || enteredDob !== expectedDob) {
    return { ok: false, code: 'DOB_MISMATCH', error: 'The date of birth did not match the registration information.' };
  }

  const verificationToken = signToken_({
    typ: 'withdraw_verify',
    caseId: normalize_(caseRecord.case_id),
    caseVersion: Number(caseRecord.case_version) || 1,
    resumeTokenId: normalize_(tokenPayload.tokenId),
    canonicalRegistrationId: normalize_(tokenPayload.canonicalRegistrationId),
    verificationMethod: verificationMethod,
    verifiedSubject: verifiedSubject,
    test: Boolean(tokenPayload.test),
  }, 10 * 60 * 1000);

  return {
    ok: true,
    verified: true,
    verificationToken: verificationToken,
    verificationMethod: verificationMethod,
    verifiedSubject: verifiedSubject,
  };
}

function caseHasVerifiedPayment_(caseRecord) {
  return getCaseMemberPlayers_(caseRecord).some(function(record) {
    return normalize_(record['Player Payment Status']).toLowerCase() === 'paid' ||
      Boolean(normalize_(record['Player Payment Transaction ID']));
  });
}

function withdrawContinuationCase_(caseRecord, resumeTokenPayload, verificationToken) {
  const verified = verifyToken_(verificationToken, 'withdraw_verify');
  if (normalize_(verified.caseId) !== normalize_(caseRecord.case_id) ||
      normalize_(verified.resumeTokenId) !== normalize_(resumeTokenPayload.tokenId) ||
      Number(verified.caseVersion) !== (Number(caseRecord.case_version) || 1)) {
    return { ok: false, error: 'Withdrawal verification is no longer valid. Please verify the date of birth again.' };
  }

  if (resumeTokenPayload.test || verified.test) {
    return {
      ok: true,
      testMode: true,
      withdrawn: false,
      message: 'TEST MODE: withdrawal was verified, but no live registration rows were moved.',
    };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const freshCase = findCaseById_(caseRecord.case_id);
    if (!freshCase) return { ok: false, error: 'Continuation case not found.' };
    if (normalize_(freshCase.status).toLowerCase() === 'withdrawn') {
      return { ok: true, withdrawn: true, duplicateRequest: true };
    }
    if (caseHasVerifiedPayment_(freshCase)) {
      return {
        ok: false,
        code: 'PAYMENT_RECORDED',
        error: 'Payment has already been recorded for this registration. Please contact Paducah GO Soccer for assistance.',
      };
    }

    const members = getCaseMemberPlayers_(freshCase);
    if (!members.length) {
      return { ok: false, error: 'No active registration rows remain for this case.' };
    }

    const canonicalId = normalize_(
      freshCase.canonical_registration_id ||
      freshCase.completion_owner_registration_id ||
      freshCase.recommended_canonical_registration_id ||
      resumeTokenPayload.canonicalRegistrationId
    );

    const archiveResult = archivePlayerRecordsToCache_(members, {
      reason: 'Withdrawn by Parent',
      caseId: freshCase.case_id,
      canonicalRegistrationId: canonicalId,
      verificationMethod: normalize_(verified.verificationMethod),
    });

    const now = timestamp_();
    updateCase_(freshCase._row, {
      status: 'Withdrawn',
      withdrawn_at: now,
      withdrawal_verification_method: normalize_(verified.verificationMethod),
      withdrawal_verified_subject: normalize_(verified.verifiedSubject),
      withdrawal_archived_registration_ids: archiveResult.archived.map(function(item) { return item.registrationId; }).join(','),
      notes: appendNote_(freshCase.notes, 'Parent withdrew registration after DOB confirmation. Active Players rows moved to Cache.'),
    });

    audit_(freshCase.case_id, 'registration_withdrawn', null, {
      verificationMethod: normalize_(verified.verificationMethod),
      verifiedSubject: normalize_(verified.verifiedSubject),
      archivedRegistrationIds: archiveResult.archived.map(function(item) { return item.registrationId; }),
    }, false);

    return {
      ok: true,
      withdrawn: true,
      archivedRegistrationIds: archiveResult.archived.map(function(item) { return item.registrationId; }),
    };
  } finally {
    lock.releaseLock();
  }
}
