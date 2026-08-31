/**
 * Paducah GO Soccer - ContinueRegistration
 * FILE: 05_Email.gs
 * BUILD: 2026.08.31-payment-reminder-v1
 *
 * Routes cases that are otherwise complete but still owe registration fees
 * to a Quest payment reminder instead of the continuation claim flow.
 */

const CONTINUE_QUEST_PAYMENT_URL = 'https://quest.build/get-tickets/1598/71794/info?teamId=686';

function CONTINUE_sendTestForPlayerRow(rowNumber) {
  assertReadyToSend_();
  const caseRecord = findOrCreateCaseForPlayerRow_(Number(rowNumber));
  const route = getCaseEmailRoute_(caseRecord);
  if (route.route === 'payment_reminder') {
    return sendPaymentReminderEmailToRecipients_(caseRecord, [CONTINUE_CONFIG.TEST_EMAIL], true, route);
  }
  return sendContinuationEmailToRecipients_(caseRecord, [CONTINUE_CONFIG.TEST_EMAIL], true);
}

function CONTINUE_sendTestForRegistration(registrationId) {
  const record = findPlayerByRegistrationId_(registrationId);
  if (!record) throw new Error('Registration ID was not found.');
  return CONTINUE_sendTestForPlayerRow(record._row);
}

function CONTINUE_sendCase(caseId) {
  assertReadyToSend_();
  const caseRecord = findCaseById_(caseId);
  if (!caseRecord) throw new Error('Continuation case was not found.');

  const recipients = buildContactCandidatesForCase_(caseRecord)
    .map(function(contact) { return contact.email; })
    .filter(isEmail_);
  if (!recipients.length) throw new Error('No valid parent/guardian email was found for this case.');

  const route = getCaseEmailRoute_(caseRecord);
  if (route.route === 'payment_reminder') {
    return sendPaymentReminderEmailToRecipients_(caseRecord, recipients, false, route);
  }
  if (caseIsCompleted_(caseRecord)) throw new Error('This continuation case is already completed.');

  return sendContinuationEmailToRecipients_(caseRecord, recipients, false);
}

function CONTINUE_sendBatch() {
  assertReadyToSend_();
  const result = { sentCases: 0, skipped: 0, failed: [] };

  getSheetRecords_(CONTINUE_CONFIG.CASES_SHEET).forEach(function(caseRecord) {
    const route = getCaseEmailRoute_(caseRecord);
    if (caseIsCompleted_(caseRecord) && route.route !== 'payment_reminder') {
      result.skipped += 1;
      return;
    }
    const status = normalize_(caseRecord.status).toLowerCase();
    if (status && status !== 'identified' && status !== 'ready' && !(route.route === 'payment_reminder' && /^completed/.test(status))) {
      result.skipped += 1;
      return;
    }

    try {
      CONTINUE_sendCase(caseRecord.case_id);
      result.sentCases += 1;
    } catch (error) {
      result.failed.push({ caseId: caseRecord.case_id, error: errorMessage_(error) });
    }
  });

  return result;
}

function getCaseEmailRoute_(caseRecord) {
  const members = getCaseMemberPlayers_(caseRecord);
  const canonical = resolveCanonicalPlayerForCase_(caseRecord);
  if (!members.length || !canonical) {
    return { route: 'continuation', reason: 'No usable registration snapshot was found.' };
  }

  const paymentStatuses = members.map(function(record) {
    return normalize_(record['Player Payment Status']).toLowerCase();
  });
  const hasPaid = members.some(function(record) {
    return normalize_(record['Player Payment Status']).toLowerCase() === 'paid' ||
      Boolean(normalize_(record['Player Payment Transaction ID']));
  });
  if (hasPaid) {
    return { route: 'continuation', reason: 'A paid registration exists in this case.' };
  }

  const memberIds = new Set(members.map(function(record) {
    return normalize_(record.registration_submission_id);
  }).filter(Boolean));
  const scholarshipRequested = members.some(function(record) {
    return /^yes$/i.test(normalize_(record.scholarship_requested)) ||
      normalize_(record['Player Payment Status']).toLowerCase() === 'pending scholarship';
  }) || getScholarships_().some(function(record) {
    return memberIds.has(normalize_(record.registration_submission_id));
  });
  if (scholarshipRequested) {
    return { route: 'continuation', reason: 'Scholarship requested or pending; payment reminder suppressed.' };
  }

  const pendingPayment = paymentStatuses.some(function(status) {
    return !status || status === 'payment pending' || status === 'pending' || status === 'unpaid';
  });
  if (!pendingPayment) {
    return { route: 'continuation', reason: 'Payment status is not an eligible pending-payment value.' };
  }

  const participantNames = getCaseCandidateChildren_(caseRecord).map(function(child) {
    return child.displayName;
  }).filter(Boolean);
  if (!participantNames.length) {
    return { route: 'continuation', reason: 'No participant names are available.' };
  }

  const agreementComplete = members.some(function(record) {
    const status = normalize_(record['Player Agreement Status']).toLowerCase();
    const statusComplete = /^(viewed|signed|accepted|complete|completed)$/.test(status);
    const evidence = normalize_(record['Player Agreement Transaction ID']) ||
      normalize_(record['Player Agreement PDF URL']) ||
      normalize_(record['Player Agreement Signed At']);
    return statusComplete && Boolean(evidence);
  });
  if (!agreementComplete) {
    return { route: 'continuation', reason: 'Player Agreement is not complete.' };
  }

  const helpChoice = normalize_(canonical.help_choice || strongestHelpChoice_(members)).toLowerCase();
  const needsVolunteer = /volunteer/.test(helpChoice);
  const needsCoach = /coach/.test(helpChoice);
  const volunteerComplete = !needsVolunteer || members.some(function(record) {
    return Boolean(normalize_(record['Volunteer Submission ID'])) ||
      /^(submitted|complete|completed)$/.test(normalize_(record['Volunteer Form Status']).toLowerCase());
  });
  const coachComplete = !needsCoach || members.some(function(record) {
    return Boolean(normalize_(record['Coach Submission ID'])) ||
      /^(submitted|complete|completed)$/.test(normalize_(record['Coach Form Status']).toLowerCase());
  });
  if (!volunteerComplete || !coachComplete) {
    return {
      route: 'continuation',
      reason: !volunteerComplete ? 'Volunteer application is still incomplete.' : 'Coaching application is still incomplete.'
    };
  }

  const playerCount = participantNames.length;
  return {
    route: 'payment_reminder',
    reason: 'Registration is otherwise complete and payment is still pending.',
    canonicalRegistrationId: normalize_(canonical.registration_submission_id),
    participantNames: participantNames,
    playerCount: playerCount,
    paymentUrl: buildContinuationQuestPaymentUrl_(playerCount),
  };
}

function buildContinuationQuestPaymentUrl_(playerCount) {
  const quantity = Math.max(1, Number(playerCount) || 1);
  return CONTINUE_QUEST_PAYMENT_URL + '&quantity=' + encodeURIComponent(String(quantity));
}

function sendPaymentReminderEmailToRecipients_(caseRecord, recipients, testMode, routeInfo) {
  const route = routeInfo || getCaseEmailRoute_(caseRecord);
  if (route.route !== 'payment_reminder') {
    throw new Error('This case is not eligible for a payment reminder: ' + normalize_(route.reason));
  }

  const childNames = route.participantNames || getCaseCandidateChildren_(caseRecord).map(function(child) {
    return child.displayName;
  }).filter(Boolean);
  const paymentUrl = route.paymentUrl || buildContinuationQuestPaymentUrl_(childNames.length);
  const uniqueRecipients = unique_((recipients || []).map(normalizeEmail_).filter(isEmail_));
  const sent = [];
  const failures = [];

  uniqueRecipients.forEach(function(recipient) {
    try {
      const contact = findContactCandidate_(caseRecord, recipient);
      const parentName = contact && contact.name ? contact.name : 'Parent/Guardian';
      const subject = (testMode ? '[TEST] ' : '') + 'Complete your Paducah GO Soccer registration';
      const namesHtml = childNames.map(function(name) {
        return '<li style="margin:6px 0">' + escapeHtml_(name) + '</li>';
      }).join('');
      const testBanner = testMode
        ? '<div style="background:#fff3cd;color:#664d03;padding:12px 16px;font-weight:700;text-align:center">TEST EMAIL — NOT SENT TO THE PARENT</div>'
        : '';

      const html = [
        '<div style="margin:0;background:#f3f6f5;padding:28px 12px;font-family:Arial,sans-serif;color:#17233a">',
        '<div style="max-width:620px;margin:auto;background:#fff;border-radius:14px;overflow:hidden">',
        testBanner,
        '<img src="' + escapeHtml_(CONTINUE_CONFIG.BANNER_URL) + '" alt="Paducah GO Soccer" style="display:block;width:100%;height:auto">',
        '<div style="padding:30px">',
        '<h1 style="margin:0 0 18px;color:#214b86;font-size:26px">Complete your registration</h1>',
        '<p>Hello ' + escapeHtml_(parentName) + ',</p>',
        '<p>Your Paducah GO Soccer registration information and required agreement(s) are already on file. The remaining step is payment.</p>',
        '<p><strong>Participant(s):</strong></p>',
        '<ul style="padding-left:22px">' + namesHtml + '</ul>',
        '<p>The registration fee is <strong>$75 per player</strong>. Use the secure Quest payment link below to complete registration.</p>',
        '<p style="margin:24px 0"><a href="' + escapeHtml_(paymentUrl) + '" style="display:inline-block;background:#214b86;color:#fff;text-decoration:none;font-weight:bold;padding:14px 22px;border-radius:7px">Pay Registration Fee</a></p>',
        '<p style="font-size:13px;color:#5d6a66">After payment is received, our payment system will match the receipt to your registration and update your payment status.</p>',
        '<p>Thank you,<br><strong>Paducah GO Soccer</strong><br>LifePrep Academy Foundation</p>',
        '</div></div></div>',
      ].join('');

      GmailApp.sendEmail(recipient, subject, stripHtml_(html), {
        htmlBody: html,
        name: CONTINUE_CONFIG.SENDER_NAME,
        replyTo: CONTINUE_CONFIG.REPLY_TO,
      });

      sent.push(recipient);
      audit_(caseRecord.case_id, 'payment_reminder_sent', resolveCanonicalPlayerForCase_(caseRecord), {
        recipient: recipient,
        childNames: childNames,
        paymentUrl: paymentUrl,
      }, testMode);
    } catch (error) {
      failures.push({ recipient: recipient, error: errorMessage_(error) });
    }
  });

  if (!testMode) {
    const now = timestamp_();
    updateCase_(caseRecord._row, {
      status: sent.length ? 'Payment Reminder Sent' : 'Payment Reminder Failed',
      email_sent_at: sent.length ? now : normalize_(caseRecord.email_sent_at),
      email_recipients_sent: sent.join(' | '),
      email_send_errors: failures.length ? JSON.stringify(failures) : '',
    });
    if (sent.length) {
      markClusterRows_(caseRecord, {
        'Continuation Case ID': caseRecord.case_id,
        'Continuation Status': 'Payment Reminder Sent',
        'Continuation Sent At': now,
      });
    }
  } else {
    updateCase_(caseRecord._row, { test_reviewed_at: timestamp_() });
  }

  if (!sent.length) throw new Error('No payment reminder email could be sent.');
  return {
    ok: true,
    route: 'payment_reminder',
    testMode: Boolean(testMode),
    caseId: caseRecord.case_id,
    sent: sent,
    failures: failures,
    paymentUrl: paymentUrl,
  };
}

function sendContinuationEmailToRecipients_(caseRecord, recipients, testMode) {
  const childNames = getCaseCandidateChildren_(caseRecord).map(function(child) { return child.displayName; });
  if (!childNames.length) throw new Error('No participant names are available for this case.');

  const uniqueRecipients = unique_((recipients || []).map(normalizeEmail_).filter(isEmail_));
  const sent = [];
  const failures = [];

  uniqueRecipients.forEach(function(recipient) {
    try {
      const contact = findContactCandidate_(caseRecord, recipient);
      const parentName = contact && contact.name ? contact.name : 'Parent/Guardian';
      const claimToken = createClaimToken_(caseRecord, recipient, testMode);
      const claimUrl = getWebAppUrl_() + '?t=' + encodeURIComponent(claimToken);
      const subject = (testMode ? '[TEST] ' : '') + 'Continue your Paducah GO Soccer registration';

      const namesHtml = childNames.map(function(name) {
        return '<li style="margin:6px 0">' + escapeHtml_(name) + '</li>';
      }).join('');

      const testBanner = testMode
        ? '<div style="background:#fff3cd;color:#664d03;padding:12px 16px;font-weight:700;text-align:center">TEST EMAIL — NOT SENT TO THE PARENT</div>'
        : '';

      const html = [
        '<div style="margin:0;background:#f3f6f5;padding:28px 12px;font-family:Arial,sans-serif;color:#17233a">',
        '<div style="max-width:620px;margin:auto;background:#fff;border-radius:14px;overflow:hidden">',
        testBanner,
        '<img src="' + escapeHtml_(CONTINUE_CONFIG.BANNER_URL) + '" alt="Paducah GO Soccer" style="display:block;width:100%;height:auto">',
        '<div style="padding:30px">',
        '<h1 style="margin:0 0 18px;color:#214b86;font-size:26px">Continue your registration</h1>',
        '<p>Hello ' + escapeHtml_(parentName) + ',</p>',
        '<p>We found an unfinished or repeated Paducah GO Soccer registration that may belong to your household. We saved the information already entered so you can review it and finish the normal registration process.</p>',
        '<p>For privacy, we will first ask you to confirm which participant name(s) belong to your household:</p>',
        '<ul style="padding-left:22px">' + namesHtml + '</ul>',
        '<p>If more than one parent or guardian submitted an attempt, you may also be asked which contact information should be used going forward.</p>',
        '<p style="margin:24px 0"><a href="' + escapeHtml_(claimUrl) + '" style="display:inline-block;background:#214b86;color:#fff;text-decoration:none;font-weight:bold;padding:14px 22px;border-radius:7px">Continue Registration</a></p>',
        '<p style="font-size:13px;color:#5d6a66">This secure link expires in ' + CONTINUE_CONFIG.TOKEN_DAYS + ' days.</p>',
        '<p>Thank you,<br><strong>Paducah GO Soccer</strong><br>LifePrep Academy Foundation</p>',
        '</div></div></div>',
      ].join('');

      GmailApp.sendEmail(recipient, subject, stripHtml_(html), {
        htmlBody: html,
        name: CONTINUE_CONFIG.SENDER_NAME,
        replyTo: CONTINUE_CONFIG.REPLY_TO,
      });

      sent.push(recipient);
      audit_(caseRecord.case_id, 'email_sent', resolveCanonicalPlayerForCase_(caseRecord), {
        recipient: recipient,
        childNames: childNames,
      }, testMode);
    } catch (error) {
      failures.push({ recipient: recipient, error: errorMessage_(error) });
    }
  });

  if (!testMode) {
    const now = timestamp_();
    updateCase_(caseRecord._row, {
      status: sent.length ? 'Email Sent' : 'Email Send Failed',
      email_sent_at: sent.length ? now : normalize_(caseRecord.email_sent_at),
      email_recipients_sent: sent.join(' | '),
      email_send_errors: failures.length ? JSON.stringify(failures) : '',
    });
    if (sent.length) {
      markClusterRows_(caseRecord, {
        'Continuation Case ID': caseRecord.case_id,
        'Continuation Status': 'Email Sent',
        'Continuation Sent At': now,
      });
    }
  } else {
    updateCase_(caseRecord._row, { test_reviewed_at: timestamp_() });
  }

  if (!sent.length) throw new Error('No continuation email could be sent.');
  return { ok: true, testMode: Boolean(testMode), caseId: caseRecord.case_id, sent: sent, failures: failures };
}
