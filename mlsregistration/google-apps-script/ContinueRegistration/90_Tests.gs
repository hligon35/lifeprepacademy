/**
 * Read-only / test-email utilities for the continuation project.
 * Change TEST_PLAYER_ROW only when you want to preview another case.
 */
const TEST_PLAYER_ROW = 27;

function TEST_setupAndPreview() {
  const setup = CONTINUE_setup();
  const preview = CONTINUE_previewClusters();
  return { setup: setup, preview: preview };
}

function TEST_previewRows26to56() {
  const clusters = buildClusterAnalysis_().clusters.filter(function(cluster) {
    return cluster.memberRows.some(function(row) { return row >= 26 && row <= 56; });
  });
  console.log(JSON.stringify(clusters, null, 2));
  return clusters;
}

function TEST_previewSelectedCase() {
  const caseRecord = findOrCreateCaseForPlayerRow_(TEST_PLAYER_ROW);
  return {
    caseId: caseRecord.case_id,
    children: splitPipe_(caseRecord.candidate_child_names),
    contacts: buildContactCandidatesForCase_(caseRecord),
    canonicalRegistrationId: caseRecord.recommended_canonical_registration_id,
    manualReviewReasons: splitPipe_(caseRecord.manual_review_reasons),
  };
}

function TEST_sendSelectedCaseToTestEmail() {
  return CONTINUE_sendTestForPlayerRow(TEST_PLAYER_ROW);
}

function TEST_previewMergedSnapshotForSelectedCase() {
  const caseRecord = findOrCreateCaseForPlayerRow_(TEST_PLAYER_ROW);
  const children = getCaseCandidateChildren_(caseRecord).map(function(child) { return child.key; });
  const contact = buildContactCandidatesForCase_(caseRecord)[0];
  if (!contact) throw new Error('The selected case has no valid contact candidate.');

  const fakeTokenPayload = {
    caseId: caseRecord.case_id,
    caseVersion: Number(caseRecord.case_version) || 1,
    canonicalRegistrationId: caseRecord.recommended_canonical_registration_id,
    claimedChildKeys: children,
    releasedChildKeys: [],
    duplicateChildKeys: [],
    uncertainChildKeys: [],
    primaryEmail: contact.email,
    primaryName: contact.name,
    tokenId: 'READ_ONLY_PREVIEW',
    test: true,
  };

  const snapshot = buildMergedRegistrationSnapshot_(caseRecord, fakeTokenPayload);
  console.log(JSON.stringify(snapshot, null, 2));
  return snapshot;
}

function TEST_verifyKnownExclusions() {
  const ids = new Set(getPlayers_().filter(isExcludedPlayerRecord_).map(function(record) {
    return normalize_(record.registration_submission_id);
  }));
  return {
    ok: CONTINUE_CONFIG.EXCLUDED_REGISTRATION_IDS.every(function(id) { return ids.has(id); }),
    excludedRegistrationIds: Array.from(ids),
  };
}

/**
 * Dry-run: shows which Players row would remain and which confirmed duplicate
 * rows would be moved to Cache if the selected case completed now.
 * This function does not write to the spreadsheet.
 */
function TEST_previewCachePlanForPlayerRow(rowNumber) {
  const targetRow = Number(rowNumber || TEST_PLAYER_ROW);
  const caseRecord = findOrCreateCaseForPlayerRow_(targetRow);
  const members = getCaseMemberPlayers_(caseRecord);
  const canonical = resolveCanonicalPlayerForCase_(caseRecord) || members[0];
  if (!canonical) throw new Error('No canonical registration could be resolved.');

  const canonicalId = normalize_(canonical.registration_submission_id);
  const candidate = members.filter(function(record) {
    return normalize_(record.registration_submission_id) !== canonicalId;
  }).map(function(record) {
    return {
      row: record._row,
      registrationId: normalize_(record.registration_submission_id),
      participants: getPlayerChildren_(record).map(function(child) { return child.displayName; }),
    };
  });

  const result = {
    caseId: normalize_(caseRecord.case_id),
    canonical: { row: canonical._row, registrationId: canonicalId },
    duplicateCandidates: candidate,
    note: 'Read-only preview. Actual consolidation only caches rows confirmed safe by the parent continuation token.',
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

/**
 * Read-only withdrawal preview. Shows every active Players row that belongs to
 * the selected continuation case. It does not perform DOB verification or move rows.
 */
function TEST_previewWithdrawalCachePlan(rowNumber) {
  const targetRow = Number(rowNumber || TEST_PLAYER_ROW);
  const caseRecord = findOrCreateCaseForPlayerRow_(targetRow);
  const members = getCaseMemberPlayers_(caseRecord);
  const result = {
    caseId: normalize_(caseRecord.case_id),
    blockedByPayment: caseHasVerifiedPayment_(caseRecord),
    rowsThatWouldMoveToCache: members.map(function(record) {
      return {
        row: record._row,
        registrationId: normalize_(record.registration_submission_id),
        participants: getPlayerChildren_(record).map(function(child) { return child.displayName; }),
      };
    }),
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}
