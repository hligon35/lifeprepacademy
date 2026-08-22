/**
 * Paducah GO Soccer Scholarship Acceptance Web App
 *
 * IMPORTANT: Install this in its own standalone Apps Script project.
 * Do not add it to the existing registration project because that project
 * already defines doGet/doPost web-app entry points.
 *
 * INSTALLATION
 * 1. Create a new standalone Apps Script project and paste this entire file.
 * 2. Run SCHOLARSHIP_setup() once and approve permissions.
 * 3. Deploy > New deployment > Web app:
 *      Execute as: Me
 *      Who has access: Anyone
 * 4. Run RUN_UPDATED_SCHOLARSHIP_EMAIL_TEST_AUG20_2026().
 *    Its subject must begin: [AUG 20 UPDATED COPY PROOF]
 * 5. Run SCHOLARSHIP_generateCombinedDocumentPreviewFromRow() to inspect a
 *    filled copy of the real Google Doc using PREVIEW_SCHOLARSHIP_ROW. It does not edit the
 *    sheet and emails the preview URL only to TEST_EMAIL.
 * 6. Run SCHOLARSHIP_sendInitialTermsEmailsV3() to email unsent scholarship rows.
 *
 * LIVE ACCEPTANCE RECORDS
 * After a live parent submits the web agreement, the script creates one Google
 * Doc containing one complete filled template copy per participant. It saves the document in
 * the LifePrep account's Paducah GO Scholarship Agreements Drive folder and
 * writes its single URL to scholarship_terms_document_url on Scholarships.
 * Run SCHOLARSHIP_generateMissingAcceptedDocuments() once if older Accepted
 * rows need their document records generated.
 *
 * Re-running SCHOLARSHIP_sendInitialTermsEmails() will not duplicate messages
 * already marked Sent or Accepted. Use SCHOLARSHIP_resendUnacceptedTermsEmails()
 * only when you intentionally want to resend outstanding agreements.
 */

const SCHOLARSHIP_TERMS_CONFIG = Object.freeze({
  SPREADSHEET_ID: '1EIG6F00-mVhT9ws0nS3pJBrp9Y2mPH87p6UyLkWtKT4',
  SCHOLARSHIPS_SHEET: 'Scholarships',
  PLAYERS_SHEET: 'Players',
  TIME_ZONE: 'America/Indianapolis',
  DOCUMENT_VERSION: '1.0',
  EMAIL_COPY_VERSION: '2.0',
  TOKEN_VALID_DAYS: 60,
  TEST_EMAIL: 'hligon@getsparqd.com',
  PREVIEW_SCHOLARSHIP_ROW: 4,
  PROJECT_MARKER: 'standalone-scholarship-webapp',
  EXPECTED_WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbzBxSdQfWE6U155P0UtITHwj08rgJ2lZdpJcEkDAeG-zw_-piyMACm8SxMMXjTBo8wX/exec',
  TEMPLATE_DOCUMENT_ID: '1JW5mgQ9TPu5BSmYZnl8SHy4yT4_mWzu7jPN34csvJZo',
  AGREEMENT_FOLDER_NAME: 'Paducah GO Scholarship Agreements',
  EMAIL_SUBJECT: 'Paducah GO Soccer Scholarship Guidelines – Acceptance Required',
  SENDER_NAME: 'Paducah GO Soccer',
  BANNER_URL: 'https://mlsregistration.lifeprepacademyfoundation.com/LPAFxPGS.PNG',
  PROGRAM_URL: 'https://lifeprepacademyfoundation.com/mlsregistration/',
  REQUIRED_SOURCE_HEADERS: [
    'registration_submission_id',
    'parent_first_name',
    'parent_last_name',
    'parent_email',
    'participant_names'
  ],
  TRACKING_HEADERS: [
    'scholarship_terms_status',
    'scholarship_terms_sent_at',
    'scholarship_terms_accepted_at',
    'scholarship_terms_parent_name',
    'scholarship_terms_participant_names',
    'scholarship_terms_grades',
    'scholarship_terms_version',
    'scholarship_terms_acceptance_id',
    'scholarship_terms_document_url',
    'scholarship_terms_document_file_id',
    'scholarship_terms_document_created_at',
    'scholarship_terms_document_participant_count',
    'scholarship_terms_error'
  ]
});

/**
 * SELF-CONTAINED EMAIL PROOF TEST.
 *
 * This deliberately does not call any scholarship email renderer. That makes
 * it immune to an older helper function in another .gs file. If the message
 * sent by this exact function does not have the subject marker below, the
 * editor is running a different Apps Script project or an unsaved version.
 */
function RUN_UPDATED_SCHOLARSHIP_EMAIL_TEST_AUG20_2026() {
  const identity = SCHOLARSHIP_debugProjectIdentity();
  const publicWebAppUrl = scholarshipGetPublicWebAppUrl_();
  const recipient = 'hligon@getsparqd.com';
  const parentName = 'Test Parent';
  const participantNames = 'Jordan Sample and Taylor Sample';
  const testRecord = {
    registrationId: 'AUG20-PROOF-' + Utilities.getUuid(),
    parentName: parentName,
    parentEmail: recipient,
    participantNames: participantNames,
    grades: '2nd/3rd Grade and 4th/5th Grade',
    test: true
  };
  // A working review button requires the signed ?t= token. Pointing the
  // button at ScriptApp.getService().getUrl() alone only opens an invalid link.
  const reviewUrl = scholarshipBuildAcceptanceUrl_(testRecord);
  const subject = '[AUG 20 UPDATED COPY PROOF][' + SCHOLARSHIP_TERMS_CONFIG.PROJECT_MARKER + '] Paducah GO Soccer Scholarship Guidelines';

  const html = '<!doctype html><html><body style="margin:0;background:#f3f6f4;font-family:Arial,sans-serif;color:#18251f;">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6f4;padding:24px 10px;"><tr><td align="center">' +
    '<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;">' +
    '<tr><td><img src="https://mlsregistration.lifeprepacademyfoundation.com/LPAFxPGS.PNG" alt="Paducah GO Soccer" width="600" style="display:block;width:100%;height:auto;border:0;"></td></tr>' +
    '<tr><td style="padding:30px 34px 34px;">' +
    '<h1 style="margin:0 0 14px;font-size:25px;line-height:1.25;color:#173F7A;">Review your scholarship guidelines</h1>' +
    '<p style="margin:0 0 14px;line-height:1.6;">Hello ' + parentName + ',</p>' +
    '<p style="margin:0 0 14px;line-height:1.6;">Thank you for applying for a Paducah GO Soccer scholarship for <strong>' + participantNames + '</strong>.</p>' +
    '<p style="margin:0 0 14px;line-height:1.6;">To continue the scholarship process, please review and accept the Paducah GO Soccer Scholarship Guidelines. Your personalized agreement has already been completed with the parent/guardian and participant information provided in your scholarship application.</p>' +
    '<p style="margin:0 0 22px;line-height:1.6;">Please use the link below to review and accept the agreement at your earliest convenience:</p>' +
    '<table role="presentation" cellspacing="0" cellpadding="0"><tr><td bgcolor="#173F7A" style="border-radius:7px;">' +
    '<a href="' + reviewUrl + '" style="display:inline-block;padding:14px 23px;color:#fff;text-decoration:none;font-weight:bold;font-size:15px;">Review and Accept Scholarship Guidelines</a>' +
    '</td></tr></table>' +
    '<p style="margin:24px 0 0;line-height:1.6;">If you have any questions or need assistance, please contact us.</p>' +
    '<p style="margin:18px 0 0;line-height:1.6;">Thank you,<br><strong>Paducah GO Soccer</strong><br>LifePrep Academy Foundation</p>' +
    '</td></tr></table></td></tr></table></body></html>';

  const plain = [
    'Hello ' + parentName + ',',
    '',
    'Thank you for applying for a Paducah GO Soccer scholarship for ' + participantNames + '.',
    '',
    'To continue the scholarship process, please review and accept the Paducah GO Soccer Scholarship Guidelines. Your personalized agreement has already been completed with the parent/guardian and participant information provided in your scholarship application.',
    '',
    'Project marker: ' + SCHOLARSHIP_TERMS_CONFIG.PROJECT_MARKER,
    'Editor service URL: ' + identity.currentUrl,
    'Public web app URL: ' + publicWebAppUrl,
    '',
    'Please use the link below to review and accept the agreement at your earliest convenience:',
    reviewUrl,
    '',
    'If you have any questions or need assistance, please contact us.',
    '',
    'Thank you,',
    'Paducah GO Soccer',
    'LifePrep Academy Foundation'
  ].join('\n');

  GmailApp.sendEmail(recipient, subject, plain, {
    htmlBody: html,
    name: 'Paducah GO Soccer'
  });

  console.log('PROJECT MARKER: ' + SCHOLARSHIP_TERMS_CONFIG.PROJECT_MARKER);
  console.log('EDITOR SERVICE URL: ' + identity.currentUrl);
  console.log('PUBLIC WEB APP URL: ' + publicWebAppUrl);
  console.log('UPDATED COPY PROOF sent to ' + recipient + ' with subject: ' + subject);
  return subject;
}

function SCHOLARSHIP_debugProjectIdentity() {
  const currentUrl = String(ScriptApp.getService().getUrl() || '');
  const expectedUrl = scholarshipGetPublicWebAppUrl_();
  const currentDeploymentId = scholarshipExtractDeploymentId_(currentUrl);
  const expectedDeploymentId = scholarshipExtractDeploymentId_(expectedUrl);
  const payload = {
    projectMarker: SCHOLARSHIP_TERMS_CONFIG.PROJECT_MARKER,
    currentUrl: currentUrl,
    expectedUrl: expectedUrl,
    currentDeploymentId: currentDeploymentId,
    expectedDeploymentId: expectedDeploymentId,
    sameDeploymentId: Boolean(currentDeploymentId) && currentDeploymentId === expectedDeploymentId,
    editorUsesDevUrl: /\/dev(?:\?|$)/.test(currentUrl),
    publicUrlUsesExec: /\/exec(?:\?|$)/.test(expectedUrl),
  };
  console.log(JSON.stringify(payload, null, 2));
  return payload;
}

function scholarshipGetPublicWebAppUrl_() {
  const url = String(SCHOLARSHIP_TERMS_CONFIG.EXPECTED_WEBAPP_URL || '').trim();
  if (!url) {
    throw new Error('Set EXPECTED_WEBAPP_URL to the deployed scholarship Web app /exec URL.');
  }
  if (!/\/exec(?:\?|$)/.test(url)) {
    throw new Error('EXPECTED_WEBAPP_URL must be the deployed scholarship Web app /exec URL.');
  }
  return url;
}

function scholarshipExtractDeploymentId_(url) {
  const match = String(url || '').match(/\/macros\/s\/([^/]+)\//);
  return match ? match[1] : '';
}

/**
 * Sends a complete agreement preview using an actual Scholarships row.
 *
 * Change PREVIEW_SCHOLARSHIP_ROW in SCHOLARSHIP_TERMS_CONFIG to preview a
 * different parent. The email is sent only to TEST_EMAIL, and submitting the
 * preview cannot update the spreadsheet because its signed token is test-only.
 */
function SCHOLARSHIP_sendLiveDocumentPreviewFromRow() {
  const previewRow = Number(SCHOLARSHIP_TERMS_CONFIG.PREVIEW_SCHOLARSHIP_ROW);
  const previewRecipient = SCHOLARSHIP_TERMS_CONFIG.TEST_EMAIL ||
    Session.getActiveUser().getEmail();
  if (!previewRecipient) throw new Error('Set TEST_EMAIL in SCHOLARSHIP_TERMS_CONFIG.');
  if (!Number.isInteger(previewRow) || previewRow < 2) {
    throw new Error('PREVIEW_SCHOLARSHIP_ROW must be a sheet row number of 2 or greater.');
  }

  const sheet = scholarshipGetSheet_(SCHOLARSHIP_TERMS_CONFIG.SCHOLARSHIPS_SHEET);
  const table = scholarshipReadTable_(sheet);
  const map = scholarshipHeaderMap_(table.headers);
  scholarshipRequireHeaders_(map, SCHOLARSHIP_TERMS_CONFIG.REQUIRED_SOURCE_HEADERS);
  if (previewRow > sheet.getLastRow()) {
    throw new Error('Scholarships row ' + previewRow + ' does not contain a record.');
  }

  const row = table.rows[previewRow - 2];
  const registrationId = scholarshipNormalize_(row[map.registration_submission_id]);
  const parentEmail = scholarshipNormalize_(row[map.parent_email]).toLowerCase();
  const parentName = [row[map.parent_first_name], row[map.parent_last_name]]
    .map(scholarshipNormalize_).filter(Boolean).join(' ');
  const participantNames = scholarshipNormalize_(row[map.participant_names]);
  if (!registrationId || !parentEmail || !parentName || !participantNames) {
    throw new Error(
      'Scholarships row ' + previewRow +
      ' must contain registration ID, parent name, parent email, and participant names.'
    );
  }

  const linkRecord = {
    registrationId: registrationId,
    parentName: parentName,
    parentEmail: parentEmail,
    participantNames: participantNames,
    grades: scholarshipGetGradesForRegistration_(registrationId),
    test: true,
    previewRealRow: true
  };
  linkRecord.acceptanceUrl = scholarshipBuildAcceptanceUrl_(linkRecord);

  const emailRecord = Object.assign({}, linkRecord, {
    parentEmail: previewRecipient
  });
  scholarshipSendEmailCopyV3_(
    emailRecord,
    '[LIVE AGREEMENT PREVIEW — ROW ' + previewRow + '] ' +
      SCHOLARSHIP_TERMS_CONFIG.EMAIL_SUBJECT
  );

  return {
    ok: true,
    previewRow: previewRow,
    parentName: parentName,
    participantNames: participantNames,
    sentTo: previewRecipient,
    acceptanceUrl: linkRecord.acceptanceUrl,
    writesDisabled: true
  };
}

/**
 * Creates the actual combined Google Doc for PREVIEW_SCHOLARSHIP_ROW and
 * emails its Drive link only to TEST_EMAIL. It does not update the sheet.
 */
function SCHOLARSHIP_generateCombinedDocumentPreviewFromRow() {
  const previewRow = Number(SCHOLARSHIP_TERMS_CONFIG.PREVIEW_SCHOLARSHIP_ROW);
  const previewRecipient = SCHOLARSHIP_TERMS_CONFIG.TEST_EMAIL ||
    Session.getActiveUser().getEmail();
  if (!previewRecipient) throw new Error('Set TEST_EMAIL in SCHOLARSHIP_TERMS_CONFIG.');
  if (!Number.isInteger(previewRow) || previewRow < 2) {
    throw new Error('PREVIEW_SCHOLARSHIP_ROW must be a sheet row number of 2 or greater.');
  }

  const sheet = scholarshipGetSheet_(SCHOLARSHIP_TERMS_CONFIG.SCHOLARSHIPS_SHEET);
  const table = scholarshipReadTable_(sheet);
  const map = scholarshipHeaderMap_(table.headers);
  scholarshipRequireHeaders_(map, SCHOLARSHIP_TERMS_CONFIG.REQUIRED_SOURCE_HEADERS);
  if (previewRow > sheet.getLastRow()) {
    throw new Error('Scholarships row ' + previewRow + ' does not contain a record.');
  }

  const row = table.rows[previewRow - 2];
  const registrationId = scholarshipNormalize_(row[map.registration_submission_id]);
  const parentName = [row[map.parent_first_name], row[map.parent_last_name]]
    .map(scholarshipNormalize_).filter(Boolean).join(' ');
  const parentEmail = scholarshipNormalize_(row[map.parent_email]).toLowerCase();
  const parentPhone = typeof map.parent_phone === 'undefined'
    ? '' : scholarshipNormalize_(row[map.parent_phone]);
  const participantNames = scholarshipNormalize_(row[map.participant_names]);
  const participantRecords = scholarshipGetParticipantRecords_(registrationId, participantNames);
  if (!registrationId || !parentName || !parentEmail || !participantRecords.length) {
    throw new Error('The selected row does not have enough data to generate a preview.');
  }

  const documentRecord = scholarshipCreateCombinedTemplateDocument_({
    registrationId: registrationId,
    parentName: parentName,
    parentEmail: parentEmail,
    parentPhone: parentPhone,
    participantRecords: participantRecords,
    acceptedAt: new Date(),
    acceptanceId: 'PREVIEW-' + Utilities.getUuid(),
    clientInfo: {},
    preview: true
  });

  GmailApp.sendEmail(
    previewRecipient,
    '[PREVIEW DOCUMENT] Paducah GO Scholarship Record for ' + parentName,
    'A combined scholarship document preview was created for ' + parentName +
      '. It contains ' + participantRecords.length +
      ' filled template copy/copies.\n\nOpen the preview: ' + documentRecord.url,
    {name: SCHOLARSHIP_TERMS_CONFIG.SENDER_NAME}
  );

  return {
    ok: true,
    previewRow: previewRow,
    parentName: parentName,
    participantCount: participantRecords.length,
    documentUrl: documentRecord.url,
    sentTo: previewRecipient,
    sheetUpdated: false
  };
}

/** Creates missing combined Google Docs for rows already marked Accepted. */
function SCHOLARSHIP_generateMissingAcceptedDocuments() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = scholarshipGetSheet_(SCHOLARSHIP_TERMS_CONFIG.SCHOLARSHIPS_SHEET);
    scholarshipEnsureTrackingHeaders_(sheet);
    const table = scholarshipReadTable_(sheet);
    const map = scholarshipHeaderMap_(table.headers);
    scholarshipRequireHeaders_(map, SCHOLARSHIP_TERMS_CONFIG.REQUIRED_SOURCE_HEADERS);
    const result = {created: 0, skipped: 0, failed: []};

    table.rows.forEach(function(row, index) {
      const rowNumber = index + 2;
      const status = scholarshipNormalize_(row[map.scholarship_terms_status]).toLowerCase();
      const existingUrl = scholarshipNormalize_(row[map.scholarship_terms_document_url]);
      if (status !== 'accepted' || existingUrl) {
        result.skipped++;
        return;
      }

      try {
        const registrationId = scholarshipNormalize_(row[map.registration_submission_id]);
        const parentName = [row[map.parent_first_name], row[map.parent_last_name]]
          .map(scholarshipNormalize_).filter(Boolean).join(' ');
        const parentEmail = scholarshipNormalize_(row[map.parent_email]).toLowerCase();
        const parentPhone = typeof map.parent_phone === 'undefined'
          ? '' : scholarshipNormalize_(row[map.parent_phone]);
        const participantNames = scholarshipNormalize_(row[map.participant_names]);
        const participantRecords = scholarshipGetParticipantRecords_(registrationId, participantNames);
        let acceptedAt = row[map.scholarship_terms_accepted_at];
        if (!(acceptedAt instanceof Date) || isNaN(acceptedAt.getTime())) acceptedAt = new Date();
        const acceptanceId = scholarshipNormalize_(row[map.scholarship_terms_acceptance_id]) ||
          Utilities.getUuid();

        const documentRecord = scholarshipCreateCombinedTemplateDocument_({
          registrationId: registrationId,
          parentName: parentName,
          parentEmail: parentEmail,
          parentPhone: parentPhone,
          participantRecords: participantRecords,
          acceptedAt: acceptedAt,
          acceptanceId: acceptanceId,
          clientInfo: {},
          preview: false
        });

        scholarshipSetRowFields_(sheet, rowNumber, map, {
          scholarship_terms_acceptance_id: acceptanceId,
          scholarship_terms_document_url: documentRecord.url,
          scholarship_terms_document_file_id: documentRecord.fileId,
          scholarship_terms_document_created_at: documentRecord.createdAt,
          scholarship_terms_document_participant_count: participantRecords.length,
          scholarship_terms_error: ''
        });
        result.created++;
      } catch (error) {
        scholarshipSetRowFields_(sheet, rowNumber, map, {
          scholarship_terms_error: 'Document generation failed: ' + String(error.message || error)
        });
        result.failed.push({row: rowNumber, error: String(error.message || error)});
      }
    });

    console.log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    lock.releaseLock();
  }
}

/** Adds tracking columns and creates the private signing secret. */
function SCHOLARSHIP_setup() {
  const sheet = scholarshipGetSheet_(SCHOLARSHIP_TERMS_CONFIG.SCHOLARSHIPS_SHEET);
  scholarshipEnsureTrackingHeaders_(sheet);
  scholarshipGetSigningSecret_();
  SpreadsheetApp.openById(SCHOLARSHIP_TERMS_CONFIG.SPREADSHEET_ID).toast(
    'Scholarship acceptance tracking is ready.',
    'Paducah GO Soccer',
    8
  );
}

/** Sends one safe test message. Its acceptance page never writes to the sheet. */
function SCHOLARSHIP_sendTestToAdmin() {
  const email = SCHOLARSHIP_TERMS_CONFIG.TEST_EMAIL || Session.getActiveUser().getEmail();
  if (!email) throw new Error('Set TEST_EMAIL in SCHOLARSHIP_TERMS_CONFIG.');

  const record = {
    registrationId: 'TEST-' + Utilities.getUuid(),
    parentName: 'Test Parent',
    parentEmail: email,
    participantNames: 'Jordan Sample, Taylor Sample',
    grades: '2nd/3rd Grade, 4th/5th Grade',
    test: true
  };
  record.acceptanceUrl = scholarshipBuildAcceptanceUrl_(record);
  scholarshipSendEmailCopyV3_(record, '[TEST V3 RENDERER] ' + SCHOLARSHIP_TERMS_CONFIG.EMAIL_SUBJECT);
  return {ok: true, sentTo: email, acceptanceUrl: record.acceptanceUrl};
}

/** Unique test entry point for the revised email wording and blue headings. */
function SCHOLARSHIP_sendUpdatedEmailTestV3() {
  const email = SCHOLARSHIP_TERMS_CONFIG.TEST_EMAIL || Session.getActiveUser().getEmail();
  if (!email) throw new Error('Set TEST_EMAIL in SCHOLARSHIP_TERMS_CONFIG.');

  const record = {
    registrationId: 'UPDATED-COPY-V3-' + Utilities.getUuid(),
    parentName: 'Test Parent',
    parentEmail: email,
    participantNames: 'Jordan Sample and Taylor Sample',
    grades: '2nd/3rd Grade and 4th/5th Grade',
    test: true
  };
  record.acceptanceUrl = scholarshipBuildAcceptanceUrl_(record);
  scholarshipSendEmailCopyV3_(
    record,
    '[UPDATED EMAIL COPY V3 — NEW RENDERER] ' + SCHOLARSHIP_TERMS_CONFIG.EMAIL_SUBJECT
  );
  return {
    ok: true,
    emailCopyVersion: SCHOLARSHIP_TERMS_CONFIG.EMAIL_COPY_VERSION,
    sentTo: email,
    acceptanceUrl: record.acceptanceUrl
  };
}

/** Unique V3 initial-send entry point; cannot collide with an older sender. */
function SCHOLARSHIP_sendInitialTermsEmailsV3() {
  return scholarshipSendTermsEmailsCopyV3_({forceResend: false});
}

/** Unique V3 resend entry point for every outstanding agreement. */
function SCHOLARSHIP_resendUnacceptedTermsEmailsV3() {
  return scholarshipSendTermsEmailsCopyV3_({forceResend: true});
}

/** Sends only rows that have never been sent and have not been accepted. */
function SCHOLARSHIP_sendInitialTermsEmails() {
  return scholarshipSendTermsEmailsCopyV3_({forceResend: false});
}

/** Intentionally resends every outstanding (not accepted) scholarship agreement. */
function SCHOLARSHIP_resendUnacceptedTermsEmails() {
  return scholarshipSendTermsEmailsCopyV3_({forceResend: true});
}

/** Web-app page opened by the personalized email button. */
function doGet(e) {
  try {
    const token = String((e && e.parameter && e.parameter.t) || '');
    const payload = scholarshipVerifyToken_(token);
    const record = scholarshipGetAcceptanceRecord_(payload);
    return HtmlService.createHtmlOutput(scholarshipBuildTermsPageCopyV3_(token, record))
      .setTitle('Paducah GO Soccer Scholarship Guidelines')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
  } catch (error) {
    return HtmlService.createHtmlOutput(scholarshipBuildErrorPage_(error))
      .setTitle('Scholarship Link Error');
  }
}

/** Called by the acceptance page through google.script.run. */
function SCHOLARSHIP_submitAcceptance(token, accepted, clientInfo) {
  if (accepted !== true) {
    throw new Error('You must check the acceptance box before submitting.');
  }

  const payload = scholarshipVerifyToken_(String(token || ''));
  if (payload.test === true) {
    return {
      ok: true,
      test: true,
      message: 'Test successful. No scholarship row was changed.'
    };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = scholarshipGetSheet_(SCHOLARSHIP_TERMS_CONFIG.SCHOLARSHIPS_SHEET);
    scholarshipEnsureTrackingHeaders_(sheet);
    const table = scholarshipReadTable_(sheet);
    const map = scholarshipHeaderMap_(table.headers);
    const rowNumber = scholarshipFindRow_(table.rows, map, payload.registrationId, payload.email);
    if (rowNumber < 2) throw new Error('The matching scholarship record was not found.');

    const currentStatus = scholarshipNormalize_(
      sheet.getRange(rowNumber, map.scholarship_terms_status + 1).getValue()
    );
    const scholarshipRow = table.rows[rowNumber - 2];
    const parentName = [
      scholarshipRow[map.parent_first_name],
      scholarshipRow[map.parent_last_name]
    ].map(scholarshipNormalize_).filter(Boolean).join(' ');
    const participantNames = scholarshipNormalize_(
      scholarshipRow[map.participant_names]
    );
    const parentPhone = typeof map.parent_phone === 'undefined'
      ? ''
      : scholarshipNormalize_(scholarshipRow[map.parent_phone]);
    const participantRecords = scholarshipGetParticipantRecords_(
      payload.registrationId,
      participantNames
    );
    const grades = participantRecords.map(function(participant) {
      return participant.grade;
    }).filter(Boolean).join(', ');

    let acceptedAt = currentStatus.toLowerCase() === 'accepted'
      ? sheet.getRange(rowNumber, map.scholarship_terms_accepted_at + 1).getValue()
      : new Date();
    if (!(acceptedAt instanceof Date) || isNaN(acceptedAt.getTime())) acceptedAt = new Date();

    let acceptanceId = currentStatus.toLowerCase() === 'accepted'
      ? scholarshipNormalize_(
          sheet.getRange(rowNumber, map.scholarship_terms_acceptance_id + 1).getValue()
        )
      : '';
    if (!acceptanceId) acceptanceId = Utilities.getUuid();

    const existingDocumentUrl = scholarshipNormalize_(
      sheet.getRange(rowNumber, map.scholarship_terms_document_url + 1).getValue()
    );
    if (currentStatus.toLowerCase() === 'accepted' && existingDocumentUrl) {
      return {
        ok: true,
        alreadyAccepted: true,
        acceptedAt: Utilities.formatDate(
          acceptedAt,
          SCHOLARSHIP_TERMS_CONFIG.TIME_ZONE,
          'M/d/yyyy h:mm a'
        ),
        documentUrl: existingDocumentUrl
      };
    }

    let documentRecord;
    try {
      documentRecord = scholarshipCreateCombinedTemplateDocument_({
        registrationId: payload.registrationId,
        parentName: parentName,
        parentEmail: payload.email,
        parentPhone: parentPhone,
        participantRecords: participantRecords,
        acceptedAt: acceptedAt,
        acceptanceId: acceptanceId,
        clientInfo: clientInfo || {},
        preview: false
      });
    } catch (documentError) {
      scholarshipSetRowFields_(sheet, rowNumber, map, {
        scholarship_terms_error: 'Document generation failed: ' +
          String(documentError.message || documentError)
      });
      throw documentError;
    }

    scholarshipSetRowFields_(sheet, rowNumber, map, {
      scholarship_terms_status: 'Accepted',
      scholarship_terms_accepted_at: acceptedAt,
      scholarship_terms_parent_name: parentName,
      scholarship_terms_participant_names: participantNames,
      scholarship_terms_grades: grades,
      scholarship_terms_version: SCHOLARSHIP_TERMS_CONFIG.DOCUMENT_VERSION,
      scholarship_terms_acceptance_id: acceptanceId,
      scholarship_terms_document_url: documentRecord.url,
      scholarship_terms_document_file_id: documentRecord.fileId,
      scholarship_terms_document_created_at: documentRecord.createdAt,
      scholarship_terms_document_participant_count: participantRecords.length,
      scholarship_terms_error: ''
    });

    return {
      ok: true,
      acceptedAt: Utilities.formatDate(
        acceptedAt,
        SCHOLARSHIP_TERMS_CONFIG.TIME_ZONE,
        'M/d/yyyy h:mm a'
      ),
      acceptanceId: acceptanceId,
      documentUrl: documentRecord.url,
      participantDocumentCount: participantRecords.length
    };
  } finally {
    lock.releaseLock();
  }
}

function scholarshipSendTermsEmailsCopyV3_(options) {
  const sheet = scholarshipGetSheet_(SCHOLARSHIP_TERMS_CONFIG.SCHOLARSHIPS_SHEET);
  scholarshipEnsureTrackingHeaders_(sheet);
  const table = scholarshipReadTable_(sheet);
  const map = scholarshipHeaderMap_(table.headers);
  scholarshipRequireHeaders_(map, SCHOLARSHIP_TERMS_CONFIG.REQUIRED_SOURCE_HEADERS);

  scholarshipGetPublicWebAppUrl_();

  const result = {sent: 0, skipped: 0, failed: []};
  table.rows.forEach(function(row, index) {
    const rowNumber = index + 2;
    const registrationId = scholarshipNormalize_(row[map.registration_submission_id]);
    const parentEmail = scholarshipNormalize_(row[map.parent_email]).toLowerCase();
    const parentName = [row[map.parent_first_name], row[map.parent_last_name]]
      .map(scholarshipNormalize_).filter(Boolean).join(' ');
    const participantNames = scholarshipNormalize_(row[map.participant_names]);
    const status = scholarshipNormalize_(row[map.scholarship_terms_status]).toLowerCase();

    if (!registrationId || !parentEmail || !participantNames || status === 'accepted') {
      result.skipped++;
      return;
    }
    if (!options.forceResend && status === 'sent') {
      result.skipped++;
      return;
    }

    try {
      const record = {
        registrationId: registrationId,
        parentName: parentName || 'Parent/Guardian',
        parentEmail: parentEmail,
        participantNames: participantNames,
        grades: scholarshipGetGradesForRegistration_(registrationId),
        test: false
      };
      record.acceptanceUrl = scholarshipBuildAcceptanceUrl_(record);
      scholarshipSendEmailCopyV3_(record, SCHOLARSHIP_TERMS_CONFIG.EMAIL_SUBJECT);

      scholarshipSetRowFields_(sheet, rowNumber, map, {
        scholarship_terms_status: 'Sent',
        scholarship_terms_sent_at: new Date(),
        scholarship_terms_parent_name: record.parentName,
        scholarship_terms_participant_names: record.participantNames,
        scholarship_terms_grades: record.grades,
        scholarship_terms_version: SCHOLARSHIP_TERMS_CONFIG.DOCUMENT_VERSION,
        scholarship_terms_error: ''
      });
      result.sent++;
    } catch (error) {
      scholarshipSetRowFields_(sheet, rowNumber, map, {
        scholarship_terms_status: 'Email Error',
        scholarship_terms_error: String(error.message || error)
      });
      result.failed.push({row: rowNumber, email: parentEmail, error: String(error.message || error)});
    }
  });

  console.log(JSON.stringify(result, null, 2));
  return result;
}

function scholarshipBuildAcceptanceUrl_(record) {
  const serviceUrl = scholarshipGetPublicWebAppUrl_();
  const now = Date.now();
  const payload = {
    registrationId: record.registrationId,
    email: record.parentEmail,
    test: record.test === true,
    previewRealRow: record.previewRealRow === true,
    iat: now,
    exp: now + SCHOLARSHIP_TERMS_CONFIG.TOKEN_VALID_DAYS * 24 * 60 * 60 * 1000,
    nonce: Utilities.getUuid()
  };
  return serviceUrl + '?t=' + encodeURIComponent(scholarshipCreateToken_(payload));
}

function scholarshipGetAcceptanceRecord_(payload) {
  if (payload.test === true && payload.previewRealRow === true) {
    const previewSheet = scholarshipGetSheet_(SCHOLARSHIP_TERMS_CONFIG.SCHOLARSHIPS_SHEET);
    const previewTable = scholarshipReadTable_(previewSheet);
    const previewMap = scholarshipHeaderMap_(previewTable.headers);
    scholarshipRequireHeaders_(previewMap, SCHOLARSHIP_TERMS_CONFIG.REQUIRED_SOURCE_HEADERS);
    const previewRowNumber = scholarshipFindRow_(
      previewTable.rows,
      previewMap,
      payload.registrationId,
      payload.email
    );
    if (previewRowNumber < 2) {
      throw new Error('The scholarship record used for this preview was not found.');
    }
    const previewRow = previewTable.rows[previewRowNumber - 2];
    return {
      registrationId: payload.registrationId,
      parentName: [
        previewRow[previewMap.parent_first_name],
        previewRow[previewMap.parent_last_name]
      ].map(scholarshipNormalize_).filter(Boolean).join(' '),
      parentEmail: scholarshipNormalize_(previewRow[previewMap.parent_email]),
      participantNames: scholarshipNormalize_(previewRow[previewMap.participant_names]),
      grades: scholarshipGetGradesForRegistration_(payload.registrationId),
      status: 'Preview',
      acceptedAt: '',
      test: true
    };
  }

  if (payload.test === true) {
    return {
      registrationId: payload.registrationId,
      parentName: 'Test Parent',
      parentEmail: payload.email,
      participantNames: 'Jordan Sample and Taylor Sample',
      grades: '2nd/3rd Grade and 4th/5th Grade',
      status: 'Test',
      acceptedAt: '',
      test: true
    };
  }

  const sheet = scholarshipGetSheet_(SCHOLARSHIP_TERMS_CONFIG.SCHOLARSHIPS_SHEET);
  scholarshipEnsureTrackingHeaders_(sheet);
  const table = scholarshipReadTable_(sheet);
  const map = scholarshipHeaderMap_(table.headers);
  const rowNumber = scholarshipFindRow_(table.rows, map, payload.registrationId, payload.email);
  if (rowNumber < 2) throw new Error('The scholarship record associated with this link was not found.');

  const row = table.rows[rowNumber - 2];
  return {
    registrationId: payload.registrationId,
    parentName: [row[map.parent_first_name], row[map.parent_last_name]]
      .map(scholarshipNormalize_).filter(Boolean).join(' '),
    parentEmail: scholarshipNormalize_(row[map.parent_email]),
    participantNames: scholarshipNormalize_(row[map.participant_names]),
    grades: scholarshipGetGradesForRegistration_(payload.registrationId),
    status: scholarshipNormalize_(row[map.scholarship_terms_status]),
    acceptedAt: scholarshipDisplayDate_(row[map.scholarship_terms_accepted_at]),
    test: false
  };
}

function scholarshipSendEmailCopyV3_(record, subject) {
  const safeParentName = scholarshipEscapeHtml_(record.parentName || 'Parent/Guardian');
  const safeParticipants = scholarshipEscapeHtml_(record.participantNames);
  const safeUrl = scholarshipEscapeHtml_(record.acceptanceUrl);
  const html = '<!doctype html><html><body style="margin:0;background:#f3f6f4;font-family:Arial,sans-serif;color:#18251f;">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6f4;padding:24px 10px;"><tr><td align="center">' +
    '<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 5px 20px rgba(20,45,34,.10);">' +
    '<tr><td><img src="' + scholarshipEscapeHtml_(SCHOLARSHIP_TERMS_CONFIG.BANNER_URL) + '" alt="Paducah GO Soccer" width="600" style="display:block;width:100%;height:auto;border:0;"></td></tr>' +
    '<tr><td style="padding:30px 34px 34px;">' +
    '<h1 style="margin:0 0 14px;font-size:25px;line-height:1.25;color:#173F7A;">Review your scholarship guidelines</h1>' +
    '<p style="margin:0 0 14px;line-height:1.6;">Hello ' + safeParentName + ',</p>' +
    '<p style="margin:0 0 14px;line-height:1.6;">Thank you for applying for a Paducah GO Soccer scholarship for <strong>' + safeParticipants + '</strong>.</p>' +
    '<p style="margin:0 0 14px;line-height:1.6;">To continue the scholarship process, please review and accept the Paducah GO Soccer Scholarship Guidelines. Your personalized agreement has already been completed with the parent/guardian and participant information provided in your scholarship application.</p>' +
    '<p style="margin:0 0 22px;line-height:1.6;">Please use the link below to review and accept the agreement at your earliest convenience:</p>' +
    '<table role="presentation" cellspacing="0" cellpadding="0"><tr><td bgcolor="#0B5D3B" style="border-radius:7px;">' +
    '<a href="' + safeUrl + '" style="display:inline-block;padding:14px 23px;color:#fff;text-decoration:none;font-weight:bold;font-size:15px;">Review and Accept Scholarship Guidelines</a>' +
    '</td></tr></table>' +
    '<p style="margin:24px 0 0;line-height:1.6;">If you have any questions or need assistance, please contact us.</p>' +
    '<p style="margin:18px 0 0;line-height:1.6;">Thank you,<br><strong>Paducah GO Soccer</strong><br>LifePrep Academy Foundation</p>' +
    '</td></tr></table></td></tr></table></body></html>';

  const plain = [
    'Hello ' + (record.parentName || 'Parent/Guardian') + ',',
    '',
    'Thank you for applying for a Paducah GO Soccer scholarship for ' + record.participantNames + '.',
    '',
    'To continue the scholarship process, please review and accept the Paducah GO Soccer Scholarship Guidelines. Your personalized agreement has already been completed with the parent/guardian and participant information provided in your scholarship application.',
    '',
    'Please use the link below to review and accept the agreement at your earliest convenience:',
    '',
    'Review and accept: ' + record.acceptanceUrl,
    '',
    'If you have any questions or need assistance, please contact us.',
    '',
    'Thank you,',
    'Paducah GO Soccer',
    'LifePrep Academy Foundation'
  ].join('\n');

  GmailApp.sendEmail(record.parentEmail, subject, plain, {
    htmlBody: html,
    name: SCHOLARSHIP_TERMS_CONFIG.SENDER_NAME
  });
}

function scholarshipBuildTermsPageCopyV3_(token, record) {
  const accepted = scholarshipNormalize_(record.status).toLowerCase() === 'accepted';
  const parentName = scholarshipEscapeHtml_(record.parentName || 'Parent/Guardian');
  const participants = scholarshipEscapeHtml_(record.participantNames || 'Participant');
  const grades = scholarshipEscapeHtml_(record.grades || 'Not provided');
  const tokenJson = JSON.stringify(String(token || '')).replace(/</g, '\\u003c');
  const alreadyAccepted = accepted
    ? '<div class="success"><strong>Accepted.</strong> This agreement was accepted on ' + scholarshipEscapeHtml_(record.acceptedAt || 'a previous date') + '.</div>'
    : '';
  const submitArea = accepted
    ? ''
    : '<div class="acceptance"><label><input id="acceptBox" type="checkbox">' +
      '<span>I am <strong>' + parentName + '</strong>, the parent or guardian of <strong>' + participants + '</strong>. I have read, understand, and accept the Paducah GO Soccer Scholarship Guidelines.</span></label>' +
      '<button id="submitButton" type="button" disabled>Accept Scholarship Guidelines</button>' +
      '<div id="message" role="status" aria-live="polite"></div></div>';

  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *{box-sizing:border-box}body{margin:0;background:#eef3f0;color:#1d2f28;font-family:Arial,sans-serif;line-height:1.62}
    .page{max-width:820px;margin:28px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(20,45,34,.12)}
    .banner{display:block;width:100%;height:auto}.content{padding:34px 44px 42px}
    h1{margin:0 0 16px;color:#173f7a;font-size:30px;line-height:1.2}h2{margin:28px 0 10px;color:#173f7a;font-size:21px}
    p{margin:0 0 14px}.lead{font-size:16px}.coverage{padding:14px 16px;background:#f3f8f5;border-left:4px solid #0b5d3b;border-radius:6px}
    ul{margin:8px 0 16px;padding-left:24px}li{margin:0 0 11px}.identity{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:22px 0;padding:18px;background:#f7f8fa;border:1px solid #d9e0dc;border-radius:8px}
    .field span{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#66736d;font-weight:bold}.field strong{display:block;margin-top:4px;font-size:16px;color:#172c23}
    .acceptance{margin-top:28px;padding:20px;border:2px solid #0b5d3b;border-radius:10px;background:#f7fbf8}.acceptance label{display:flex;gap:12px;align-items:flex-start;cursor:pointer}.acceptance input{width:22px;height:22px;margin-top:2px;flex:none}
    button{margin-top:18px;padding:14px 22px;border:0;border-radius:7px;background:#0b5d3b;color:#fff;font-size:16px;font-weight:bold;cursor:pointer}button:disabled{background:#97aaa1;cursor:not-allowed}
    #message{margin-top:14px;font-weight:bold}.success{margin:20px 0;padding:16px;border-radius:8px;background:#e6f4ea;color:#175c2e;border:1px solid #a8d5b5}.error{color:#9b1c1c}
    .footer{margin-top:28px;padding-top:18px;border-top:1px solid #dfe6e2;color:#66736d;font-size:13px}
    @media(max-width:650px){.page{margin:0;border-radius:0}.content{padding:26px 20px 34px}.identity{grid-template-columns:1fr}h1{font-size:26px}}
  </style>
</head>
<body>
  <main class="page">
    <img class="banner" src="${scholarshipEscapeHtml_(SCHOLARSHIP_TERMS_CONFIG.BANNER_URL)}" alt="LifePrep Academy Foundation and Paducah GO Soccer">
    <div class="content">
      <h1>Paducah GO Soccer Scholarship Guidelines</h1>
      <p class="lead">We understand that families may face unexpected challenges, which is why Paducah GO Soccer offers this scholarship—to ensure that financial hardship does not prevent a child from participating. To keep the scholarship program fair and available to all children, recipients and their families are expected to follow the participation, school attendance, conduct, and communication guidelines outlined below. These expectations are intended to support each child’s success both on and off the field.</p>
      <p class="coverage"><strong>The scholarship covers the full $75 registration fee.</strong> It is intended for children who would otherwise be unable to participate because of the cost.</p>

      <h2>Who can receive a scholarship</h2>
      <ul>
        <li><strong>Grade and school:</strong> The child is enrolled in grade K-12 at a public school in Paducah or the surrounding area.</li>
        <li><strong>Financial need:</strong> A parent or guardian confirms that paying the $75 fee would be a hardship. No detailed financial records are required.</li>
        <li><strong>Registration:</strong> The family completes the scholarship request and all regular player registration forms.</li>
        <li><strong>Availability:</strong> Scholarships are awarded while scholarship funds and team spaces are available. One scholarship may be awarded per child, per season.</li>
      </ul>
      <p>Scholarships are not based on soccer ability, school grades, or prior playing experience.</p>

      <h2>Guidelines for continuing through the season</h2>
      <ul>
        <li><strong>School attendance:</strong> The child should maintain at least 80% attendance in school. Excused absences for illness, disability, family emergencies, or other approved reasons will not count against the child.</li>
        <li><strong>School conduct:</strong> The child should make a reasonable effort to learn without becoming an ongoing disruption to themselves or others. An isolated incident will not automatically affect the scholarship, but a continuing pattern identified by the school may require a family meeting and improvement plan.</li>
        <li><strong>Respect:</strong> The child should behave respectfully toward parents and guardians, teachers, coaches, officials, teammates, and other families.</li>
        <li><strong>Soccer participation:</strong> The player should attend practices and games regularly, with a goal of attending at least 75% of scheduled activities.</li>
        <li><strong>Communication:</strong> A parent or guardian should notify the coach when the player will be absent. If the player has two consecutive unexcused absences, the program will contact the family to see whether help is needed.</li>
        <li><strong>Inactive players:</strong> If the player stops attending and the family does not respond after reasonable contact attempts, the program may release the roster spot to another child.</li>
      </ul>
      <p>A scholarship will not be taken away because of an illness, emergency, transportation problem, disability-related need, or another reasonable hardship when the family communicates with the program.</p>

      <h2>Family acknowledgment</h2>
      <p>By accepting the scholarship, the family agrees to make a good-faith effort to help the player participate for the full season and to stay in contact with the coach.</p>

      <div class="identity">
        <div class="field"><span>Player(s)</span><strong>${participants}</strong></div>
        <div class="field"><span>Grade(s)</span><strong>${grades}</strong></div>
        <div class="field"><span>Parent/Guardian</span><strong>${parentName}</strong></div>
        <div class="field"><span>Document version</span><strong>${scholarshipEscapeHtml_(SCHOLARSHIP_TERMS_CONFIG.DOCUMENT_VERSION)}</strong></div>
      </div>
      ${alreadyAccepted}
      ${submitArea}
      <div class="footer">Paducah GO Soccer • LifePrep Academy Foundation</div>
    </div>
  </main>
  <script>
    (function(){
      var token=${tokenJson};
      var box=document.getElementById('acceptBox');
      var button=document.getElementById('submitButton');
      var message=document.getElementById('message');
      if(!box||!button)return;
      box.addEventListener('change',function(){button.disabled=!box.checked;});
      button.addEventListener('click',function(){
        if(!box.checked)return;
        button.disabled=true;button.textContent='Submitting…';message.textContent='';message.className='';
        var clientInfo={userAgent:navigator.userAgent,timeZone:(Intl.DateTimeFormat().resolvedOptions().timeZone||'')};
        google.script.run
          .withSuccessHandler(function(result){
            message.textContent=result.test?result.message:('Accepted successfully on '+result.acceptedAt+'.');
            message.className='success';box.disabled=true;button.style.display='none';
          })
          .withFailureHandler(function(error){
            message.textContent=(error&&error.message)?error.message:'The agreement could not be submitted.';
            message.className='error';button.disabled=false;button.textContent='Accept Scholarship Guidelines';
          })
          .SCHOLARSHIP_submitAcceptance(token,true,clientInfo);
      });
    })();
  </script>
</body>
</html>`;
}

function scholarshipBuildErrorPage_(error) {
  return '<!doctype html><html><body style="margin:0;background:#eef3f0;font-family:Arial,sans-serif;color:#1d2f28;">' +
    '<div style="max-width:650px;margin:50px auto;padding:30px;background:#fff;border-radius:12px;box-shadow:0 6px 24px rgba(20,45,34,.12);">' +
    '<h1 style="color:#9b1c1c;">This scholarship link cannot be opened</h1>' +
    '<p>' + scholarshipEscapeHtml_(String(error.message || error)) + '</p>' +
    '<p>Please contact Paducah GO Soccer for a new personalized link.</p></div></body></html>';
}

function scholarshipCreateToken_(payload) {
  const body = Utilities.base64EncodeWebSafe(
    JSON.stringify(payload),
    Utilities.Charset.UTF_8
  ).replace(/=+$/g, '');
  const signature = scholarshipSign_(body);
  return body + '.' + signature;
}

function scholarshipVerifyToken_(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) throw new Error('The link is incomplete.');
  const expected = scholarshipSign_(parts[0]);
  if (!scholarshipConstantTimeEquals_(expected, parts[1])) throw new Error('The link signature is invalid.');

  let payload;
  try {
    payload = JSON.parse(
      Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString()
    );
  } catch (error) {
    throw new Error('The link data is invalid.');
  }
  if (!payload.exp || Date.now() > Number(payload.exp)) throw new Error('This link has expired.');
  if (!payload.registrationId || !payload.email) throw new Error('This link is missing required information.');
  return payload;
}

function scholarshipSign_(value) {
  const bytes = Utilities.computeHmacSha256Signature(
    String(value),
    scholarshipGetSigningSecret_(),
    Utilities.Charset.UTF_8
  );
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/g, '');
}

function scholarshipConstantTimeEquals_(a, b) {
  a = String(a || ''); b = String(b || '');
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) {
    difference |= (a.charCodeAt(i % Math.max(a.length, 1)) || 0) ^
      (b.charCodeAt(i % Math.max(b.length, 1)) || 0);
  }
  return difference === 0;
}

function scholarshipGetSigningSecret_() {
  const properties = PropertiesService.getScriptProperties();
  let secret = properties.getProperty('SCHOLARSHIP_ACCEPTANCE_SECRET');
  if (!secret) {
    secret = Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid();
    properties.setProperty('SCHOLARSHIP_ACCEPTANCE_SECRET', secret);
  }
  return secret;
}

/**
 * Copies the real Paducah GO Scholarship Google Doc and fills only the four
 * Family Acknowledgment fields. For multiple children, a complete filled copy
 * of the template is appended for each additional participant. The result is
 * one Google Doc and one URL on the Scholarships row.
 */
function scholarshipCreateCombinedTemplateDocument_(record) {
  if (!record.participantRecords || !record.participantRecords.length) {
    throw new Error('No participants were found for the scholarship document.');
  }

  const templateFile = DriveApp.getFileById(SCHOLARSHIP_TERMS_CONFIG.TEMPLATE_DOCUMENT_ID);
  const folder = scholarshipGetAgreementFolder_();
  const dateStamp = Utilities.formatDate(
    record.acceptedAt,
    SCHOLARSHIP_TERMS_CONFIG.TIME_ZONE,
    'yyyy-MM-dd'
  );
  const safeParent = scholarshipSafeFilePart_(record.parentName || 'Parent');
  const safeRegistration = scholarshipSafeFilePart_(record.registrationId || 'Registration');
  const prefix = record.preview ? 'PREVIEW - ' : '';
  const outputName = prefix + 'Paducah GO Scholarship - ' + safeParent +
    ' - ' + safeRegistration + ' - ' + dateStamp;
  const outputFile = templateFile.makeCopy(outputName, folder);
  const outputDocument = DocumentApp.openById(outputFile.getId());

  try {
    const outputBody = outputDocument.getBody();
    scholarshipFillTemplateAcknowledgment_(
      outputBody,
      record.participantRecords[0],
      record.parentName,
      record.acceptedAt
    );

    for (let index = 1; index < record.participantRecords.length; index++) {
      const temporaryFile = templateFile.makeCopy(
        'TEMP Scholarship Template - ' + Utilities.getUuid(),
        folder
      );
      try {
        const temporaryDocument = DocumentApp.openById(temporaryFile.getId());
        const temporaryBody = temporaryDocument.getBody();
        scholarshipFillTemplateAcknowledgment_(
          temporaryBody,
          record.participantRecords[index],
          record.parentName,
          record.acceptedAt
        );

        outputBody.appendPageBreak();
        scholarshipAppendCopiedBody_(outputBody, temporaryBody);
        temporaryDocument.saveAndClose();
      } finally {
        temporaryFile.setTrashed(true);
      }
    }

    outputDocument.saveAndClose();
    outputFile.setDescription(
      'Completed Paducah GO Soccer scholarship guidelines for ' +
      record.parentName + ' and ' + record.participantRecords.length +
      ' participant(s).'
    );

    return {
      url: outputFile.getUrl(),
      fileId: outputFile.getId(),
      createdAt: new Date(),
      participantCount: record.participantRecords.length
    };
  } catch (error) {
    try {
      outputFile.setTrashed(true);
    } catch (cleanupError) {
      console.warn('Incomplete scholarship document could not be trashed: ' + cleanupError);
    }
    throw error;
  }
}

function scholarshipFillTemplateAcknowledgment_(body, participant, parentName, acceptedAt) {
  const dateText = Utilities.formatDate(
    acceptedAt,
    SCHOLARSHIP_TERMS_CONFIG.TIME_ZONE,
    'MMMM d, yyyy'
  );
  scholarshipWritePlayerLine_(
    body,
    participant.name || 'Not provided',
    participant.grade || 'Not provided'
  );
  scholarshipWriteParentLine_(body, parentName || 'Not provided', dateText);
}

/** Keeps the original line appearance and prints the values on the lines. */
function scholarshipWritePlayerLine_(body, playerName, grade) {
  const match = body.findText('Player:\\s*_{2,}');
  if (!match) throw new Error('The Player acknowledgment line was not found.');

  const text = match.getElement().asText();
  const normalizedPlayer = scholarshipLineValue_(playerName);
  const normalizedGrade = scholarshipLineValue_(grade);
  const playerField = scholarshipLineFieldText_(normalizedPlayer, 32);
  const gradeField = scholarshipLineFieldText_(normalizedGrade, 14);
  const playerPrefix = 'Player: ';
  const gradePrefix = '     Grade: ';
  const line = playerPrefix + playerField + gradePrefix + gradeField;
  const attributes = text.getText().length ? text.getAttributes(0) : {};

  text.setText(line);
  if (line.length) text.setAttributes(0, line.length - 1, attributes);
  text.setUnderline(0, line.length - 1, false);
  if (normalizedPlayer.length) {
    text.setUnderline(
      playerPrefix.length,
      playerPrefix.length + normalizedPlayer.length - 1,
      true
    );
  }
  const gradeStart = playerPrefix.length + playerField.length + gradePrefix.length;
  if (normalizedGrade.length) {
    text.setUnderline(gradeStart, gradeStart + normalizedGrade.length - 1, true);
  }
}

/** Keeps the original line appearance and prints the values on the lines. */
function scholarshipWriteParentLine_(body, parentName, dateText) {
  const match = body.findText('Parent/Guardian:\\s*_{2,}');
  if (!match) throw new Error('The Parent/Guardian acknowledgment line was not found.');

  const text = match.getElement().asText();
  const normalizedParent = scholarshipLineValue_(parentName);
  const normalizedDate = scholarshipLineValue_(dateText);
  const parentField = scholarshipLineFieldText_(normalizedParent, 30);
  const dateField = scholarshipLineFieldText_(normalizedDate, 18);
  const parentPrefix = 'Parent/Guardian: ';
  const datePrefix = '     Date: ';
  const line = parentPrefix + parentField + datePrefix + dateField;
  const attributes = text.getText().length ? text.getAttributes(0) : {};

  text.setText(line);
  if (line.length) text.setAttributes(0, line.length - 1, attributes);
  text.setUnderline(0, line.length - 1, false);
  if (normalizedParent.length) {
    text.setUnderline(
      parentPrefix.length,
      parentPrefix.length + normalizedParent.length - 1,
      true
    );
  }
  const dateStart = parentPrefix.length + parentField.length + datePrefix.length;
  if (normalizedDate.length) {
    text.setUnderline(dateStart, dateStart + normalizedDate.length - 1, true);
  }
}

function scholarshipLineValue_(value) {
  return scholarshipNormalize_(value).replace(/[\r\n]+/g, ' ');
}

function scholarshipLineFieldText_(normalizedValue, minimumWidth) {
  const paddingLength = Math.max(Number(minimumWidth) - normalizedValue.length, 2);
  return normalizedValue + '_'.repeat(paddingLength);
}

function scholarshipAppendCopiedBody_(destinationBody, sourceBody) {
  for (let index = 0; index < sourceBody.getNumChildren(); index++) {
    const child = sourceBody.getChild(index).copy();
    const type = child.getType();
    if (type === DocumentApp.ElementType.PARAGRAPH) {
      destinationBody.appendParagraph(child.asParagraph());
    } else if (type === DocumentApp.ElementType.LIST_ITEM) {
      destinationBody.appendListItem(child.asListItem());
    } else if (type === DocumentApp.ElementType.TABLE) {
      destinationBody.appendTable(child.asTable());
    } else if (type === DocumentApp.ElementType.PAGE_BREAK) {
      destinationBody.appendPageBreak();
    } else if (type === DocumentApp.ElementType.HORIZONTAL_RULE) {
      destinationBody.appendHorizontalRule();
    }
  }
}

function scholarshipGetParticipantRecords_(registrationId, fallbackNames) {
  const sheet = scholarshipGetSheet_(SCHOLARSHIP_TERMS_CONFIG.PLAYERS_SHEET);
  const table = scholarshipReadTable_(sheet);
  const map = scholarshipHeaderMap_(table.headers);
  let playerRow = null;
  if (typeof map.registration_submission_id !== 'undefined') {
    playerRow = table.rows.find(function(values) {
      return scholarshipNormalize_(values[map.registration_submission_id]) === registrationId;
    }) || null;
  }

  const participants = [];
  if (playerRow) {
    for (let index = 1; index <= 4; index++) {
      const firstKey = 'player_' + index + '_first_name';
      const lastKey = 'player_' + index + '_last_name';
      const gradeKey = 'player_' + index + '_grade';
      const firstName = typeof map[firstKey] === 'undefined'
        ? '' : scholarshipNormalize_(playerRow[map[firstKey]]);
      const lastName = typeof map[lastKey] === 'undefined'
        ? '' : scholarshipNormalize_(playerRow[map[lastKey]]);
      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      if (!fullName) continue;
      participants.push({
        name: fullName,
        grade: typeof map[gradeKey] === 'undefined'
          ? '' : scholarshipNormalize_(playerRow[map[gradeKey]])
      });
    }
  }

  if (participants.length) return participants;

  const fallbackGrades = scholarshipGetGradesForRegistration_(registrationId)
    .split(',').map(scholarshipNormalize_).filter(Boolean);
  return scholarshipSplitParticipantNames_(fallbackNames).map(function(name, index) {
    return {name: name, grade: fallbackGrades[index] || ''};
  });
}

function scholarshipSplitParticipantNames_(value) {
  const normalized = scholarshipNormalize_(value);
  if (!normalized) return [];
  return normalized
    .replace(/\s+(?:and|&)\s+/gi, '\n')
    .split(/[\n;,]+/)
    .map(scholarshipNormalize_)
    .filter(Boolean);
}

function scholarshipGetAgreementFolder_() {
  const properties = PropertiesService.getScriptProperties();
  const propertyKey = 'SCHOLARSHIP_AGREEMENT_FOLDER_ID';
  const savedId = properties.getProperty(propertyKey);
  if (savedId) {
    try {
      return DriveApp.getFolderById(savedId);
    } catch (savedFolderError) {
      properties.deleteProperty(propertyKey);
    }
  }

  const folders = DriveApp.getFoldersByName(SCHOLARSHIP_TERMS_CONFIG.AGREEMENT_FOLDER_NAME);
  const folder = folders.hasNext()
    ? folders.next()
    : DriveApp.createFolder(SCHOLARSHIP_TERMS_CONFIG.AGREEMENT_FOLDER_NAME);
  properties.setProperty(propertyKey, folder.getId());
  return folder;
}

function scholarshipSafeFilePart_(value) {
  const cleaned = String(value || '')
    .replace(/[\\/:*?"<>|#%{}~&]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.substring(0, 80) || 'Record';
}

function scholarshipGetGradesForRegistration_(registrationId) {
  const sheet = scholarshipGetSheet_(SCHOLARSHIP_TERMS_CONFIG.PLAYERS_SHEET);
  const table = scholarshipReadTable_(sheet);
  const map = scholarshipHeaderMap_(table.headers);
  if (typeof map.registration_submission_id === 'undefined') return '';
  const row = table.rows.find(function(values) {
    return scholarshipNormalize_(values[map.registration_submission_id]) === registrationId;
  });
  if (!row) return '';

  const grades = [];
  for (let i = 1; i <= 4; i++) {
    const key = 'player_' + i + '_grade';
    if (typeof map[key] === 'undefined') continue;
    const grade = scholarshipNormalize_(row[map[key]]);
    if (grade && grades.indexOf(grade) === -1) grades.push(grade);
  }
  return grades.join(', ');
}

function scholarshipEnsureTrackingHeaders_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  const existing = scholarshipHeaderMap_(headers);
  const missing = SCHOLARSHIP_TERMS_CONFIG.TRACKING_HEADERS.filter(function(header) {
    return typeof existing[header] === 'undefined';
  });
  if (!missing.length) return;
  sheet.getRange(1, lastColumn + 1, 1, missing.length).setValues([missing]);
  sheet.getRange(1, lastColumn + 1, 1, missing.length)
    .setFontWeight('bold')
    .setBackground('#d9ead3');
}

function scholarshipReadTable_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (!lastRow || !lastColumn) return {headers: [], rows: []};
  const values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
  return {headers: values[0].map(String), rows: values.slice(1)};
}

function scholarshipHeaderMap_(headers) {
  return headers.reduce(function(map, header, index) {
    const key = String(header || '').trim();
    if (key) map[key] = index;
    return map;
  }, {});
}

function scholarshipRequireHeaders_(map, required) {
  const missing = required.filter(function(header) {
    return typeof map[header] === 'undefined';
  });
  if (missing.length) throw new Error('Missing Scholarships header(s): ' + missing.join(', '));
}

function scholarshipFindRow_(rows, map, registrationId, email) {
  for (let i = 0; i < rows.length; i++) {
    const rowId = scholarshipNormalize_(rows[i][map.registration_submission_id]);
    const rowEmail = scholarshipNormalize_(rows[i][map.parent_email]).toLowerCase();
    if (rowId === registrationId && rowEmail === String(email || '').toLowerCase()) return i + 2;
  }
  return -1;
}

function scholarshipSetRowFields_(sheet, rowNumber, map, values) {
  Object.keys(values).forEach(function(header) {
    if (typeof map[header] === 'undefined') throw new Error('Missing tracking header: ' + header);
    sheet.getRange(rowNumber, map[header] + 1).setValue(values[header]);
  });
}

function scholarshipGetSheet_(name) {
  const sheet = SpreadsheetApp.openById(SCHOLARSHIP_TERMS_CONFIG.SPREADSHEET_ID)
    .getSheetByName(name);
  if (!sheet) throw new Error('Required sheet not found: ' + name);
  return sheet;
}

function scholarshipDisplayDate_(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return Utilities.formatDate(
    date,
    SCHOLARSHIP_TERMS_CONFIG.TIME_ZONE,
    'M/d/yyyy h:mm a'
  );
}

function scholarshipNormalize_(value) {
  return String(value === null || typeof value === 'undefined' ? '' : value).trim();
}

function scholarshipEscapeHtml_(value) {
  return String(value === null || typeof value === 'undefined' ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
