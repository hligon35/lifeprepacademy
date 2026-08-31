function CONTINUE_previewClusters() {
  assertSetup_();
  const result = buildClusterAnalysis_();
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function CONTINUE_buildOrRefreshCases() {
  assertSetup_();
  const analysis = buildClusterAnalysis_();
  const ss = SpreadsheetApp.openById(CONTINUE_CONFIG.SPREADSHEET_ID);
  const caseSheet = getOrCreateSheet_(ss, CONTINUE_CONFIG.CASES_SHEET);
  ensureHeaders_(caseSheet, CONTINUE_CASE_HEADERS);

  const existing = {};
  getSheetRecords_(CONTINUE_CONFIG.CASES_SHEET).forEach(function(record) {
    const key = normalize_(record.cluster_key);
    if (key) existing[key] = record;
  });

  const written = [];
  analysis.clusters.forEach(function(cluster) {
    const previous = existing[cluster.clusterKey];
    const caseId = previous ? normalize_(previous.case_id) : Utilities.getUuid();
    const row = previous ? previous._row : caseSheet.getLastRow() + 1;
    const now = timestamp_();
    const previousStatus = previous ? normalize_(previous.status) : '';
    const immutableStatus = /^(completed|manual review required)$/i.test(previousStatus);

    setFieldsByHeader_(caseSheet, row, {
      case_id: caseId,
      cluster_key: cluster.clusterKey,
      case_version: previous ? Math.max(1, Number(previous.case_version) || 1) : 1,
      created_at: previous ? normalize_(previous.created_at) || now : now,
      updated_at: now,
      status: immutableStatus ? previousStatus : (previousStatus || 'Identified'),
      member_registration_ids: cluster.registrationIds.join(','),
      candidate_child_names: cluster.childNames.join(' | '),
      candidate_child_keys: cluster.childKeys.join(' | '),
      recipient_emails: cluster.recipientEmails.join(' | '),
      recommended_canonical_registration_id: cluster.recommendedCanonicalRegistrationId,
      manual_review_reasons: cluster.manualReviewReasons.join(' | '),
    });

    markClusterRows_({ member_registration_ids: cluster.registrationIds.join(',') }, {
      'Continuation Case ID': caseId,
      'Continuation Status': immutableStatus ? previousStatus : 'Identified',
    });

    written.push({
      caseId: caseId,
      registrationIds: cluster.registrationIds,
      childNames: cluster.childNames,
      recipientEmails: cluster.recipientEmails,
      canonicalRegistrationId: cluster.recommendedCanonicalRegistrationId,
      manualReviewReasons: cluster.manualReviewReasons,
    });
  });

  return { ok: true, clusters: analysis.clusters.length, casesWritten: written.length, cases: written };
}

function buildClusterAnalysis_() {
  const players = getPlayers_().filter(function(record) { return !isExcludedPlayerRecord_(record); });
  const parent = {};
  players.forEach(function(record) { parent[record.registration_submission_id] = record.registration_submission_id; });

  function find(id) {
    if (parent[id] !== id) parent[id] = find(parent[id]);
    return parent[id];
  }
  function union(a, b) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  }

  for (let i = 0; i < players.length; i += 1) {
    for (let j = i + 1; j < players.length; j += 1) {
      const score = scorePlayerRows_(players[i], players[j]);
      if (score.score >= CONTINUE_CONFIG.CLUSTER_SCORE_THRESHOLD) {
        union(players[i].registration_submission_id, players[j].registration_submission_id);
      }
    }
  }

  const groups = {};
  players.forEach(function(record) {
    const root = find(record.registration_submission_id);
    if (!groups[root]) groups[root] = [];
    groups[root].push(record);
  });

  const clusters = Object.keys(groups).map(function(root) {
    return groups[root];
  }).filter(function(records) {
    return records.length > 1 || rowNeedsContinuation_(records[0]);
  }).map(summarizeCluster_).sort(function(a, b) {
    return Math.min.apply(null, a.memberRows) - Math.min.apply(null, b.memberRows);
  });

  return { ok: true, totalPlayerRows: players.length, clusters: clusters };
}

function scorePlayerRows_(a, b) {
  const ach = getPlayerChildren_(a);
  const bch = getPlayerChildren_(b);
  const aExact = new Set(ach.map(function(child) { return child.exactKey; }).filter(Boolean));
  const bExact = new Set(bch.map(function(child) { return child.exactKey; }).filter(Boolean));
  const aNames = new Set(ach.map(function(child) { return child.nameKey; }).filter(Boolean));
  const bNames = new Set(bch.map(function(child) { return child.nameKey; }).filter(Boolean));

  let score = 0;
  const reasons = [];

  const sameExactChild = setsIntersectLocal_(aExact, bExact);
  const sameNamedChild = setsIntersectLocal_(aNames, bNames);

  // Current-sheet rule: only correlate attempts that share at least one
  // participant name. Matching parent/contact data alone must never combine two
  // different children who were intentionally registered separately.
  if (!sameExactChild && !sameNamedChild) return { score: 0, reasons: [] };

  if (sameExactChild) {
    score += 10;
    reasons.push('same child name + DOB');
  } else {
    score += 5;
    reasons.push('same child name');
  }

  const aEmail = normalizeEmail_(a.parent_email);
  const bEmail = normalizeEmail_(b.parent_email);
  if (aEmail && aEmail === bEmail) {
    score += 4;
    reasons.push('same parent email');
  }

  const aPhone = normalizePhone_(a.parent_phone);
  const bPhone = normalizePhone_(b.parent_phone);
  if (aPhone && aPhone === bPhone) {
    score += 4;
    reasons.push('same parent phone');
  }

  const aAddress = normalizeAddressKey_(a);
  const bAddress = normalizeAddressKey_(b);
  if (aAddress && bAddress && aAddress === bAddress) {
    score += 3;
    reasons.push('same address');
  }

  const aParent = normalizeNameKey_(a.parent_first_name + ' ' + a.parent_last_name);
  const bParent = normalizeNameKey_(b.parent_first_name + ' ' + b.parent_last_name);
  if (aParent && aParent === bParent) {
    score += 2;
    reasons.push('same parent name');
  }

  // Same child name plus matching phone/address is intentionally enough to keep
  // a typo in DOB from splitting an obvious household (e.g. Kamila McCampbell).
  return { score: score, reasons: reasons };
}

function summarizeCluster_(records) {
  const childByName = {};
  records.forEach(function(record) {
    getPlayerChildren_(record).forEach(function(child) {
      if (!child.nameKey) return;
      if (!childByName[child.nameKey]) childByName[child.nameKey] = [];
      childByName[child.nameKey].push(child);
    });
  });

  const children = Object.keys(childByName).map(function(nameKey) {
    const occurrences = childByName[nameKey];
    const newest = occurrences.slice().sort(function(a, b) {
      const ar = findPlayerByRegistrationId_(a.registrationId);
      const br = findPlayerByRegistrationId_(b.registrationId);
      return dateMillis_(br && br.submitted_at) - dateMillis_(ar && ar.submitted_at);
    })[0];
    return { key: nameKey, displayName: newest.displayName };
  }).sort(function(a, b) { return a.displayName.localeCompare(b.displayName); });

  const canonical = chooseCanonicalRecord_(records);
  const contacts = buildContactCandidatesFromRecords_(records);
  const registrationIds = records.map(function(record) {
    return normalize_(record.registration_submission_id);
  }).filter(Boolean).sort();

  return {
    clusterKey: sha256Hex_(registrationIds.join('|')).slice(0, 28),
    memberRows: records.map(function(record) { return record._row; }).sort(function(a, b) { return a - b; }),
    registrationIds: registrationIds,
    childNames: children.map(function(child) { return child.displayName; }),
    childKeys: children.map(function(child) { return child.key; }),
    recipientEmails: contacts.map(function(contact) { return contact.email; }),
    recommendedCanonicalRegistrationId: normalize_(canonical.registration_submission_id),
    manualReviewReasons: identifyClusterConflicts_(records),
  };
}

function chooseCanonicalRecord_(records) {
  return records.slice().sort(function(a, b) {
    const scoreDiff = canonicalScore_(b) - canonicalScore_(a);
    if (scoreDiff) return scoreDiff;
    return dateMillis_(b.submitted_at) - dateMillis_(a.submitted_at);
  })[0];
}

function canonicalScore_(record) {
  let score = 0;
  const paymentStatus = normalize_(record['Player Payment Status']).toLowerCase();
  if (paymentStatus === 'paid' && normalize_(record['Player Payment Transaction ID'])) score += 1000;
  if (registrationHasAcceptedScholarship_(record.registration_submission_id)) score += 700;

  const agreementFile = normalize_(record['Player Agreement File ID']);
  const agreementTransaction = normalize_(record['Player Agreement Transaction ID']);
  if (agreementFile && agreementTransaction) score += 400;

  const ppfFile = normalize_(record['PPF Liability File ID']);
  if (ppfFile) score += 180;

  if (paymentStatus === 'pending scholarship') score += 100;
  if (normalize_(record['Volunteer Submission ID'])) score += 80;
  if (normalize_(record['Coach Submission ID'])) score += 80;

  score += Math.min(99, Math.floor(dateMillis_(record.submitted_at) / 100000000000));
  return score;
}

function identifyClusterConflicts_(records) {
  const reasons = [];
  const paidTransactions = unique_(records.map(function(record) {
    return normalize_(record['Player Payment Status']).toLowerCase() === 'paid'
      ? normalize_(record['Player Payment Transaction ID'])
      : '';
  }));
  if (paidTransactions.length > 1) reasons.push('Multiple verified payment transactions require manual review.');

  const byChild = {};
  records.forEach(function(record) {
    getPlayerChildren_(record).forEach(function(child) {
      if (!child.nameKey) return;
      if (!byChild[child.nameKey]) byChild[child.nameKey] = new Set();
      if (child.dob) byChild[child.nameKey].add(child.dob);
    });
  });
  Object.keys(byChild).forEach(function(key) {
    if (byChild[key].size > 1) reasons.push('Participant DOB differs across attempts; merged snapshot will use the strongest current value for parent review.');
  });

  return unique_(reasons);
}

function rowNeedsContinuation_(record) {
  if (!record || isExcludedPlayerRecord_(record)) return false;
  const agreementComplete = Boolean(
    normalize_(record['Player Agreement File ID']) &&
    normalize_(record['Player Agreement Transaction ID'])
  );
  const paymentStatus = normalize_(record['Player Payment Status']).toLowerCase();
  const paid = paymentStatus === 'paid';
  const scholarshipAccepted = registrationHasAcceptedScholarship_(record.registration_submission_id);
  return !agreementComplete || (!paid && !scholarshipAccepted);
}

function registrationHasAcceptedScholarship_(registrationId) {
  const target = normalize_(registrationId);
  if (!target) return false;
  return getScholarships_().some(function(record) {
    return normalize_(record.registration_submission_id) === target &&
      normalize_(record.scholarship_terms_status).toLowerCase() === 'accepted';
  });
}

function buildContactCandidatesFromRecords_(records) {
  const fakeCase = { member_registration_ids: records.map(function(record) {
    return normalize_(record.registration_submission_id);
  }).join(',') };
  return buildContactCandidatesForCase_(fakeCase);
}

function setsIntersectLocal_(a, b) {
  let intersects = false;
  a.forEach(function(value) { if (b.has(value)) intersects = true; });
  return intersects;
}
