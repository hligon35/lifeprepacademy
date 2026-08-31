function buildMergedRegistrationSnapshot_(caseRecord, tokenPayload) {
  const members = getCaseMemberPlayers_(caseRecord);
  if (!members.length) throw new Error('No registration attempts remain for this continuation case.');

  const claimedKeys = normalizeContinuationChildKeys_(tokenPayload.claimedChildKeys || []);
  if (!claimedKeys.length) throw new Error('No participant was claimed for continuation.');

  const primaryEmail = normalizeEmail_(tokenPayload.primaryEmail);
  const primaryRecord = getLatestPlayerForEmail_(caseRecord, primaryEmail) || resolveCanonicalPlayerForCase_(caseRecord) || members[0];
  const canonical = findPlayerByRegistrationId_(tokenPayload.canonicalRegistrationId) || resolveCanonicalPlayerForCase_(caseRecord);
  if (!canonical) throw new Error('The continuation registration could not be found.');

  const players = claimedKeys.map(function(childKey) {
    return mergeChildForSnapshot_(members, childKey);
  }).filter(Boolean).slice(0, 4);

  if (!players.length) throw new Error('No claimed participant information could be assembled.');

  const acceptedScholarship = caseHasAcceptedScholarship_(caseRecord, claimedKeys);
  const payment = buildAuthoritativePaymentSnapshot_(members, acceptedScholarship);

  return {
    registrationSubmissionId: normalize_(canonical.registration_submission_id),
    canonicalRow: canonical._row,
    parent: {
      firstName: normalize_(primaryRecord.parent_first_name),
      lastName: normalize_(primaryRecord.parent_last_name),
      email: primaryEmail || normalize_(primaryRecord.parent_email),
      phone: normalize_(primaryRecord.parent_phone),
      street: normalize_(primaryRecord.parent_street),
      apt: normalize_(primaryRecord.parent_apt),
      city: normalize_(primaryRecord.parent_city),
      state: normalize_(primaryRecord.parent_state),
      zip: normalize_(primaryRecord.parent_zip),
      dob: normalizeDateForForm_(primaryRecord.parent_guardian_dob),
    },
    emergency: {
      sameAsParent: normalize_(primaryRecord.emergency_same_as_parent),
      firstName: normalize_(primaryRecord.emergency_first_name),
      lastName: normalize_(primaryRecord.emergency_last_name),
      relationship: normalize_(primaryRecord.emergency_relationship),
      email: normalize_(primaryRecord.emergency_email),
      phone: normalize_(primaryRecord.emergency_phone),
      street: normalize_(primaryRecord.emergency_street),
      apt: normalize_(primaryRecord.emergency_apt),
      city: normalize_(primaryRecord.emergency_city),
      state: normalize_(primaryRecord.emergency_state),
      zip: normalize_(primaryRecord.emergency_zip),
    },
    players: players,
    helpChoice: strongestHelpChoice_(members),
    scholarshipRequested: acceptedScholarship || members.some(function(record) {
      return /^yes$/i.test(normalize_(record.scholarship_requested));
    }) ? 'Yes' : 'No',
    payment: payment,
    resume: {
      caseId: tokenPayload.caseId,
      tokenId: tokenPayload.tokenId,
      testMode: Boolean(tokenPayload.test),
      releasedChildKeys: tokenPayload.releasedChildKeys || [],
      duplicateChildKeys: tokenPayload.duplicateChildKeys || [],
      uncertainChildKeys: tokenPayload.uncertainChildKeys || [],
    },
  };
}

function mergeChildForSnapshot_(members, childNameKey) {
  const canonicalChildKey = canonicalContinuationChildKey_(childNameKey);
  const occurrences = [];
  members.forEach(function(record) {
    getPlayerChildren_(record).forEach(function(child) {
      if (canonicalContinuationChildKey_(child.nameKey) === canonicalChildKey) occurrences.push({ record: record, child: child });
    });
  });
  if (!occurrences.length) return null;

  occurrences.sort(function(a, b) {
    return dateMillis_(b.record.submitted_at) - dateMillis_(a.record.submitted_at);
  });

  const validDobs = occurrences.map(function(item) {
    return item.child.dob;
  }).filter(isPlausibleYouthDob_);
  const dobKey = modeValue_(validDobs) || modeValue_(occurrences.map(function(item) { return item.child.dob; }));

  const firstName = preferredChildText_(occurrences, 'first_name');
  const lastName = preferredChildText_(occurrences, 'last_name');
  const gender = modePlayerField_(occurrences, 'gender');
  const grade = modePlayerField_(occurrences, 'grade');

  return {
    firstName: firstName,
    lastName: lastName,
    dob: normalizeDateForForm_(dobKey),
    gender: gender,
    grade: grade,
    jersey: latestPlayerField_(occurrences, 'jersey'),
    shorts: latestPlayerField_(occurrences, 'shorts'),
    socks: latestPlayerField_(occurrences, 'socks'),
    race: latestPlayerField_(occurrences, 'race'),
    raceOther: latestPlayerField_(occurrences, 'race_other'),
    favoriteClub: latestPlayerField_(occurrences, 'favorite_club'),
    hearAbout: latestPlayerField_(occurrences, 'hear_about'),
  };
}

function preferredChildText_(occurrences, suffix) {
  const values = occurrences.map(function(item) {
    return normalize_(item.record['player_' + item.child.index + '_' + suffix]);
  }).filter(Boolean);
  return modeValue_(values) || (values[0] || '');
}

function modePlayerField_(occurrences, suffix) {
  return modeValue_(occurrences.map(function(item) {
    return normalize_(item.record['player_' + item.child.index + '_' + suffix]);
  }));
}

function latestPlayerField_(occurrences, suffix) {
  for (let i = 0; i < occurrences.length; i += 1) {
    const value = normalize_(occurrences[i].record['player_' + occurrences[i].child.index + '_' + suffix]);
    if (value) return value;
  }
  return '';
}

function isPlausibleYouthDob_(value) {
  const millis = Date.parse(normalize_(value));
  if (!Number.isFinite(millis)) return false;
  const year = new Date(millis).getFullYear();
  return year >= 2013 && year <= 2020;
}

function strongestHelpChoice_(members) {
  const choices = members.map(function(record) { return normalize_(record.help_choice); }).filter(Boolean);
  const coach = choices.find(function(value) { return /coach/i.test(value); });
  if (coach) return coach;
  const volunteer = choices.find(function(value) { return /volunteer/i.test(value); });
  if (volunteer) return volunteer;
  return choices.sort(function(a, b) { return b.length - a.length; })[0] || 'No, finish my registration';
}

function caseHasAcceptedScholarship_(caseRecord, claimedKeys) {
  const memberIds = new Set(splitCsv_(caseRecord.member_registration_ids));
  const claimedNames = new Set(normalizeContinuationChildKeys_(claimedKeys || []).map(function(key) { return key.replace(/^name:/, ''); }));

  return getScholarships_().some(function(record) {
    if (!memberIds.has(normalize_(record.registration_submission_id))) return false;
    if (normalize_(record.scholarship_terms_status).toLowerCase() !== 'accepted') return false;
    const participantNames = normalize_(record.scholarship_terms_participant_names || record.participant_names)
      .split(',').map(normalizeNameKey_).filter(Boolean);
    return !participantNames.length || participantNames.some(function(nameKey) { return claimedNames.has(nameKey); });
  });
}

function buildAuthoritativePaymentSnapshot_(members, acceptedScholarship) {
  const paid = members.filter(function(record) {
    return normalize_(record['Player Payment Status']).toLowerCase() === 'paid' &&
      normalize_(record['Player Payment Transaction ID']);
  }).sort(function(a, b) {
    return dateMillis_(b['Player Payment Paid At']) - dateMillis_(a['Player Payment Paid At']);
  });

  if (paid.length) {
    const record = paid[0];
    return {
      status: 'Paid',
      amount: normalize_(record['Player Payment Amount']),
      currency: normalize_(record['Player Payment Currency']) || 'USD',
      paidAt: normalize_(record['Player Payment Paid At']),
      transactionId: normalize_(record['Player Payment Transaction ID']),
      receiptUrl: normalize_(record['Player Payment Receipt URL']),
    };
  }

  if (acceptedScholarship) {
    return { status: 'Pending Scholarship', amount: '', currency: 'USD', paidAt: '', transactionId: '', receiptUrl: '' };
  }

  const latest = members.slice().sort(function(a, b) {
    return dateMillis_(b.submitted_at) - dateMillis_(a.submitted_at);
  })[0];
  return {
    status: normalize_(latest['Player Payment Status']) || 'Payment Pending',
    amount: normalize_(latest['Player Payment Amount']),
    currency: normalize_(latest['Player Payment Currency']) || 'USD',
    paidAt: normalize_(latest['Player Payment Paid At']),
    transactionId: normalize_(latest['Player Payment Transaction ID']),
    receiptUrl: normalize_(latest['Player Payment Receipt URL']),
  };
}

function finalizeContinuationCase_(caseRecord, tokenPayload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const freshCase = findCaseById_(caseRecord.case_id);
    if (!freshCase) return { ok: false, error: 'Continuation case not found.' };

    if (caseIsCompleted_(freshCase)) {
      if (normalize_(freshCase.completion_owner_token_id) === normalize_(tokenPayload.tokenId)) {
        return {
          ok: true,
          completed: true,
          duplicateCompletion: true,
          canonicalRegistrationId: normalize_(freshCase.canonical_registration_id || freshCase.completion_owner_registration_id),
        };
      }
      return alreadyCompletedResponse_();
    }

    if (Number(tokenPayload.caseVersion) !== (Number(freshCase.case_version) || 1)) {
      return { ok: false, code: 'CASE_CHANGED', error: 'This continuation case changed. Please reopen the secure email link.' };
    }

    const canonical = findPlayerByRegistrationId_(tokenPayload.canonicalRegistrationId);
    if (!canonical) return { ok: false, error: 'Canonical registration could not be found.' };

    const members = getCaseMemberPlayers_(freshCase);
    const distinctPaid = unique_(members.map(function(record) {
      return normalize_(record['Player Payment Status']).toLowerCase() === 'paid'
        ? normalize_(record['Player Payment Transaction ID'])
        : '';
    }));

    if (distinctPaid.length > 1) {
      updateCase_(freshCase._row, {
        status: 'Manual Review Required',
        notes: appendNote_(freshCase.notes, 'Multiple verified payment transactions detected after continuation. Duplicate rows were not consolidated.'),
      });
      audit_(freshCase.case_id, 'completion_blocked_multiple_paid', canonical, { paymentTransactionIds: distinctPaid }, false);
      return {
        ok: true,
        completed: true,
        manualReviewRequired: true,
        reason: 'Multiple verified payment transactions require manual review.',
      };
    }

    preserveAuthoritativeSystemFields_(canonical, members, freshCase, tokenPayload);

    const now = timestamp_();
    const canonicalId = normalize_(canonical.registration_submission_id);
    const claimed = new Set(normalizeContinuationChildKeys_(tokenPayload.claimedChildKeys || []));
    const supersededIds = [];
    const retainedIds = [];
    const duplicateRecordsToCache = [];
    const currentMembers = getCaseMemberPlayers_(freshCase);

    currentMembers.forEach(function(record) {
      const id = normalize_(record.registration_submission_id);
      if (id === canonicalId) {
        setPlayerFields_(record._row, {
          'Continuation Case ID': freshCase.case_id,
          'Continuation Status': 'Completed',
          'Continuation Completed At': now,
          'Canonical Registration ID': canonicalId,
          'Superseded By Registration ID': '',
          'Duplicate Resolution Status': 'Canonical',
          'Continuation Review Note': buildContinuationNote_(tokenPayload),
          'Dashboard Eligibility': 'Yes',
        });
        return;
      }

      const childKeys = normalizeContinuationChildKeys_(getPlayerChildren_(record).map(function(child) { return child.nameKey; }));
      const safeToSupersede = childKeys.length > 0 && childKeys.every(function(key) { return claimed.has(key); });

      if (safeToSupersede) {
        duplicateRecordsToCache.push(record);
        supersededIds.push(id);
      } else {
        retainedIds.push(id);
        setPlayerFields_(record._row, {
          'Continuation Case ID': freshCase.case_id,
          'Continuation Status': 'Manual Review Required',
          'Duplicate Resolution Status': 'Retained - Mixed/Uncertain Participants',
          'Continuation Review Note': buildContinuationNote_(tokenPayload),
        });
      }
    });

    if (duplicateRecordsToCache.length) {
      archivePlayerRecordsToCache_(duplicateRecordsToCache, {
        reason: 'Duplicate - Consolidated',
        caseId: freshCase.case_id,
        canonicalRegistrationId: canonicalId,
      });
    }

    updateCase_(freshCase._row, {
      status: retainedIds.length ? 'Completed - Review Retained Rows' : 'Completed',
      completion_locked_at: now,
      completion_owner_token_id: tokenPayload.tokenId,
      completion_owner_registration_id: canonicalId,
      continuation_completed_at: now,
      canonical_registration_id: canonicalId,
      superseded_registration_ids: supersededIds.join(','),
      notes: retainedIds.length
        ? appendNote_(freshCase.notes, 'Confirmed duplicate rows were moved to Cache. Some mixed/uncertain rows remain active for review: ' + retainedIds.join(', '))
        : appendNote_(freshCase.notes, supersededIds.length ? 'Confirmed duplicate registration rows moved to Cache: ' + supersededIds.join(', ') : ''),
    });

    audit_(freshCase.case_id, 'continuation_completed', canonical, {
      canonicalRegistrationId: canonicalId,
      supersededRegistrationIds: supersededIds,
      retainedRegistrationIds: retainedIds,
      claimed: tokenPayload.claimedChildKeys || [],
      released: tokenPayload.releasedChildKeys || [],
      uncertain: tokenPayload.uncertainChildKeys || [],
    }, false);

    return {
      ok: true,
      completed: true,
      canonicalRegistrationId: canonicalId,
      supersededRegistrationIds: supersededIds,
      retainedRegistrationIds: retainedIds,
    };
  } finally {
    lock.releaseLock();
  }
}

function preserveAuthoritativeSystemFields_(canonical, members, caseRecord, tokenPayload) {
  const updates = {};

  const paid = members.filter(function(record) {
    return normalize_(record['Player Payment Status']).toLowerCase() === 'paid' && normalize_(record['Player Payment Transaction ID']);
  }).sort(function(a, b) { return dateMillis_(b['Player Payment Paid At']) - dateMillis_(a['Player Payment Paid At']); })[0];

  if (paid) {
    [
      'Player Payment Status','Player Payment Amount','Player Payment Currency','Player Payment Paid At',
      'Player Payment Transaction ID','Player Payment Receipt URL','Payment Order Number','Payment Confirmation Submitted At',
    ].forEach(function(header) {
      if (normalize_(paid[header])) updates[header] = paid[header];
    });
    updates['Player Payment Status'] = 'Paid';
  } else if (caseHasAcceptedScholarship_(caseRecord, tokenPayload.claimedChildKeys || [])) {
    updates['Player Payment Status'] = 'Pending Scholarship';
    updates.scholarship_requested = 'Yes';
  }

  const agreement = chooseBestCompleteDocumentSource_(members, tokenPayload.claimedChildKeys || [], 'Player Agreement');
  if (agreement) {
    [
      'Player Agreement Status','Player Agreement Version','Player Agreement Signed At','Player Agreement Signer Name',
      'Player Agreement File ID','Player Agreement PDF URL','Player Agreement SHA-256','Player Agreement Transaction ID',
    ].forEach(function(header) {
      if (normalize_(agreement[header])) updates[header] = agreement[header];
    });
  }

  const ppf = chooseBestCompleteDocumentSource_(members, tokenPayload.claimedChildKeys || [], 'PPF Liability');
  if (ppf) {
    [
      'PPF Liability File ID','PPF Liability PDF URL','PPF Liability Status','PPF Liability Generated At',
      'PPF Liability Transaction ID','PPF Liability Error',
    ].forEach(function(header) {
      if (normalize_(ppf[header])) updates[header] = ppf[header];
    });
  }

  const volunteer = members.filter(function(record) { return normalize_(record['Volunteer Submission ID']); })
    .sort(function(a, b) { return dateMillis_(b['Volunteer Submitted At']) - dateMillis_(a['Volunteer Submitted At']); })[0];
  if (volunteer) {
    ['Volunteer Form Status','Volunteer Submission ID','Volunteer Submitted At','Volunteer Roles'].forEach(function(header) {
      if (normalize_(volunteer[header])) updates[header] = volunteer[header];
    });
  }

  const coach = members.filter(function(record) { return normalize_(record['Coach Submission ID']); })
    .sort(function(a, b) { return dateMillis_(b['Coach Submitted At']) - dateMillis_(a['Coach Submitted At']); })[0];
  if (coach) {
    ['Coach Form Status','Coach Submission ID','Coach Submitted At','Coach Roles'].forEach(function(header) {
      if (normalize_(coach[header])) updates[header] = coach[header];
    });
  }

  if (Object.keys(updates).length) setPlayerFields_(canonical._row, updates);
}

function chooseBestCompleteDocumentSource_(members, claimedKeys, prefix) {
  const claimed = new Set(normalizeContinuationChildKeys_(claimedKeys || []));
  const fileHeader = prefix + ' File ID';
  const transactionHeader = prefix + ' Transaction ID';

  return members.filter(function(record) {
    if (!normalize_(record[fileHeader])) return false;
    if (prefix === 'Player Agreement' && !normalize_(record[transactionHeader])) return false;
    const keys = normalizeContinuationChildKeys_(getPlayerChildren_(record).map(function(child) { return child.nameKey; }));
    return keys.length && keys.every(function(key) { return claimed.has(key); });
  }).sort(function(a, b) {
    const ad = dateMillis_(a[prefix + ' Signed At'] || a[prefix + ' Generated At'] || a.submitted_at);
    const bd = dateMillis_(b[prefix + ' Signed At'] || b[prefix + ' Generated At'] || b.submitted_at);
    return bd - ad;
  })[0] || null;
}

function buildContinuationNote_(tokenPayload) {
  const parts = [];
  if ((tokenPayload.claimedChildKeys || []).length) parts.push('Claimed: ' + tokenPayload.claimedChildKeys.join(', '));
  if ((tokenPayload.duplicateChildKeys || []).length) parts.push('Parent identified duplicate: ' + tokenPayload.duplicateChildKeys.join(', '));
  if ((tokenPayload.releasedChildKeys || []).length) parts.push('Released: ' + tokenPayload.releasedChildKeys.join(', '));
  if ((tokenPayload.uncertainChildKeys || []).length) parts.push('Uncertain: ' + tokenPayload.uncertainChildKeys.join(', '));
  if (normalize_(tokenPayload.primaryEmail)) parts.push('Primary contact: ' + normalize_(tokenPayload.primaryEmail));
  return parts.join(' | ');
}

function CONTINUE_deleteSafeSupersededRows(caseId) {
  const caseRecord = findCaseById_(caseId);
  if (!caseRecord) throw new Error('Continuation case was not found.');
  if (!caseIsCompleted_(caseRecord)) throw new Error('Complete the continuation before cleanup.');

  const ids = splitCsv_(caseRecord.superseded_registration_ids);
  const scholarshipIds = new Set(getScholarships_().map(function(record) { return normalize_(record.registration_submission_id); }).filter(Boolean));
  const volunteerEmails = new Set(getVolunteers_().map(function(record) { return normalizeEmail_(record.linkedParentEmail || record.email); }).filter(Boolean));
  const coachEmails = new Set(getCoaches_().map(function(record) { return normalizeEmail_(record.linkedParentEmail || record.email); }).filter(Boolean));

  const deletable = [];
  const retained = [];
  ids.forEach(function(id) {
    const record = findPlayerByRegistrationId_(id);
    if (!record) return;
    const hasPaid = normalize_(record['Player Payment Status']).toLowerCase() === 'paid' && normalize_(record['Player Payment Transaction ID']);
    const hasScholarship = scholarshipIds.has(id);
    const email = normalizeEmail_(record.parent_email);
    const hasRelatedApplication = volunteerEmails.has(email) || coachEmails.has(email);
    if (hasPaid || hasScholarship || hasRelatedApplication) retained.push(id);
    else deletable.push({ id: id, row: record._row });
  });

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = requireSheet_(SpreadsheetApp.openById(CONTINUE_CONFIG.SPREADSHEET_ID), CONTINUE_CONFIG.PLAYERS_SHEET);
    deletable.sort(function(a, b) { return b.row - a.row; }).forEach(function(item) {
      const fresh = findPlayerByRegistrationId_(item.id);
      if (fresh) sheet.deleteRow(fresh._row);
    });
  } finally {
    lock.releaseLock();
  }

  audit_(caseRecord.case_id, 'safe_cleanup_completed', null, {
    deletedRegistrationIds: deletable.map(function(item) { return item.id; }),
    retainedRegistrationIds: retained,
  }, false);

  return {
    ok: true,
    deletedRegistrationIds: deletable.map(function(item) { return item.id; }),
    retainedRegistrationIds: retained,
  };
}
