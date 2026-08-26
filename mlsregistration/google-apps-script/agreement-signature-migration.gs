/**
 * One-time migration for existing non-scholarship agreements.
 *
 * Add this file to the SAME Apps Script project as Code.gs, then run:
 *   AGREEMENTS_migrateExistingSignatures()
 *
 * This covers:
 * - Player Agreements
 * - Volunteer Agreements
 * - Coach Volunteer Agreements
 * - PPF Liability Agreements
 *
 * Scholarships are handled separately by scholarship-migration.gs in the
 * standalone scholarship Apps Script project.
 */
function AGREEMENTS_migrateExistingSignatures() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const result = {
      players: migrateExistingSignedAgreementSheet_('Players', 'mls_registration', true),
      volunteers: migrateExistingSignedAgreementSheet_('Volunteers', 'volunteer_application', false),
      coaches: migrateExistingSignedAgreementSheet_('Coaches', 'coaching_application', false),
      ppf: migrateExistingPpfAgreements_(),
    };
    console.log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    lock.releaseLock();
  }
}

function migrateExistingSignedAgreementSheet_(sheetName, formType, isPlayer) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(sheetName);
  if (!sheet) throw new Error('Missing sheet: ' + sheetName);

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return { scanned: 0, migrated: 0, skipped: 0, failed: [] };

  const headers = values[0].map(String);
  const map = agreementMigrationHeaderMap_(headers);
  const columns = isPlayer ? PLAYER_AGREEMENT_COLUMNS : VOLUNTEER_AGREEMENT_COLUMNS;
  const idHeader = isPlayer ? 'registration_submission_id' : 'submission_id';
  const result = { scanned: 0, migrated: 0, skipped: 0, failed: [] };

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const rowNumber = r + 1;
    const submissionId = agreementMigrationValue_(row, map, idHeader);
    const signerName = agreementMigrationValue_(row, map, columns[3]);
    const fileId = agreementMigrationValue_(row, map, columns[4]);
    const pdfUrl = agreementMigrationValue_(row, map, columns[5]);

    if (!submissionId || !signerName || (!fileId && !pdfUrl)) {
      result.skipped++;
      continue;
    }

    result.scanned++;

    try {
      const signedAt = agreementMigrationIsoDate_(
        agreementMigrationRawValue_(row, map, columns[2]) ||
        agreementMigrationRawValue_(row, map, isPlayer ? 'submitted_at' : 'submittedAt')
      );

      const payload = isPlayer
        ? buildPlayerAgreementMigrationPayload_(row, map, submissionId, signerName, signedAt)
        : buildVolunteerAgreementMigrationPayload_(row, map, formType, submissionId, signerName, signedAt);

      const response = UrlFetchApp.fetch(
        'https://mlsregistration.lifeprepacademyfoundation.com/api/sign-agreement',
        {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify(payload),
          headers: {
            Origin: 'https://mlsregistration.lifeprepacademyfoundation.com'
          },
          muteHttpExceptions: true,
        }
      );

      const code = response.getResponseCode();
      const text = response.getContentText();
      let parsed = {};
      try { parsed = JSON.parse(text || '{}'); } catch (ignored) {}

      if (code < 200 || code >= 300 || parsed.ok !== true) {
        throw new Error(parsed.error || ('Signing endpoint returned HTTP ' + code));
      }

      result.migrated++;
    } catch (error) {
      result.failed.push({ row: rowNumber, submissionId: submissionId, error: String(error.message || error) });
    }
  }

  return result;
}

function buildPlayerAgreementMigrationPayload_(row, map, submissionId, signerName, signedAt) {
  const participantNames = [];
  for (let i = 1; i <= 4; i++) {
    const first = agreementMigrationValue_(row, map, 'player_' + i + '_first_name');
    const last = agreementMigrationValue_(row, map, 'player_' + i + '_last_name');
    const name = [first, last].filter(Boolean).join(' ').trim();
    if (name) participantNames.push(name);
  }

  return {
    agreementType: 'player',
    formType: 'mls_registration',
    submissionId: submissionId,
    transactionId: Utilities.getUuid(),
    signer: {
      printedName: signerName,
    },
    audit: {
      viewedAtUtc: signedAt,
      consentVersion: 'v1-2026-08-06',
    },
    fields: {
      participantNames: participantNames.join(', '),
      guardianName: signerName,
      guardianDob: agreementMigrationValue_(row, map, 'parent_guardian_dob'),
      guardianStreet: agreementMigrationValue_(row, map, 'parent_street'),
      guardianCity: agreementMigrationValue_(row, map, 'parent_city'),
      guardianState: agreementMigrationValue_(row, map, 'parent_state'),
      guardianZip: agreementMigrationValue_(row, map, 'parent_zip'),
      guardianPhone: agreementMigrationValue_(row, map, 'parent_phone'),
      guardianEmail: agreementMigrationValue_(row, map, 'parent_email'),
      signingDate: signedAt.slice(0, 10),
    },
  };
}

function buildVolunteerAgreementMigrationPayload_(row, map, formType, submissionId, signerName, signedAt) {
  return {
    agreementType: 'volunteer',
    formType: formType,
    submissionId: submissionId,
    transactionId: Utilities.getUuid(),
    signer: {
      printedName: signerName,
      ageYears: agreementMigrationAgeYears_(agreementMigrationRawValue_(row, map, 'dob')),
    },
    audit: {
      viewedAtUtc: signedAt,
      consentVersion: 'v1-2026-08-06',
    },
    fields: {
      legalName: signerName,
      signingDate: signedAt.slice(0, 10),
    },
  };
}

function migrateExistingPpfAgreements_() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Players');
  if (!sheet) throw new Error('Missing Players sheet.');

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return { scanned: 0, migrated: 0, skipped: 0, failed: [] };

  const headers = values[0].map(String);
  const map = agreementMigrationHeaderMap_(headers);
  const token = PropertiesService.getScriptProperties().getProperty('AGREEMENT_UPDATE_TOKEN') || '';
  if (!token) throw new Error('Missing AGREEMENT_UPDATE_TOKEN in Script Properties.');

  const result = { scanned: 0, migrated: 0, skipped: 0, failed: [] };
  const ppfFolder = DriveApp.getFolderById(AGREEMENT_ARCHIVE_FOLDERS.PPF);

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const rowNumber = r + 1;
    const submissionId = agreementMigrationValue_(row, map, 'registration_submission_id');
    const oldFileId = agreementMigrationValue_(row, map, 'PPF Liability File ID');

    if (!submissionId || !oldFileId) {
      result.skipped++;
      continue;
    }

    const parentName = [
      agreementMigrationValue_(row, map, 'parent_first_name'),
      agreementMigrationValue_(row, map, 'parent_last_name'),
    ].filter(Boolean).join(' ').trim();

    const participants = [];
    for (let i = 1; i <= 4; i++) {
      const first = agreementMigrationValue_(row, map, 'player_' + i + '_first_name');
      const last = agreementMigrationValue_(row, map, 'player_' + i + '_last_name');
      const name = [first, last].filter(Boolean).join(' ').trim();
      if (name) {
        participants.push({
          name: name,
          grade: agreementMigrationValue_(row, map, 'player_' + i + '_grade'),
        });
      }
    }

    if (!parentName || !participants.length) {
      result.skipped++;
      continue;
    }

    result.scanned++;

    try {
      let oldFileName = 'PPF Liability - ' + submissionId + '.pdf';
      try {
        oldFileName = DriveApp.getFileById(oldFileId).getName() || oldFileName;
      } catch (ignored) {}

      const signedAt = agreementMigrationIsoDate_(
        agreementMigrationRawValue_(row, map, 'Player Agreement Signed At') ||
        agreementMigrationRawValue_(row, map, 'submitted_at')
      );

      const response = UrlFetchApp.fetch(PPF_LIABILITY_RENDER_URL, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          submissionId: submissionId,
          parentName: parentName,
          signingDate: signedAt.slice(0, 10),
          participants: participants,
        }),
        headers: {
          Authorization: 'Bearer ' + token,
        },
        muteHttpExceptions: true,
      });

      const code = response.getResponseCode();
      if (code < 200 || code >= 300) {
        throw new Error('PPF endpoint returned HTTP ' + code + ': ' + response.getContentText());
      }

      const newFile = ppfFolder.createFile(response.getBlob().setName(oldFileName));

      try {
        DriveApp.getFileById(oldFileId).setTrashed(true);
      } catch (ignored) {}

      const fileIdCol = map['PPF Liability File ID'];
      const pdfUrlCol = map['PPF Liability PDF URL'];
      if (typeof fileIdCol === 'number') sheet.getRange(rowNumber, fileIdCol + 1).setValue(newFile.getId());
      if (typeof pdfUrlCol === 'number') sheet.getRange(rowNumber, pdfUrlCol + 1).setValue(newFile.getUrl());

      result.migrated++;
    } catch (error) {
      result.failed.push({ row: rowNumber, submissionId: submissionId, error: String(error.message || error) });
    }
  }

  return result;
}

function agreementMigrationHeaderMap_(headers) {
  return headers.reduce(function(map, header, index) {
    const key = String(header || '').trim();
    if (key) map[key] = index;
    return map;
  }, {});
}

function agreementMigrationRawValue_(row, map, header) {
  return typeof map[header] === 'number' ? row[map[header]] : '';
}

function agreementMigrationValue_(row, map, header) {
  const value = agreementMigrationRawValue_(row, map, header);
  return String(value === null || typeof value === 'undefined' ? '' : value).trim();
}

function agreementMigrationIsoDate_(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function agreementMigrationAgeYears_(value) {
  const dob = value instanceof Date ? value : new Date(value);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDelta = today.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}
