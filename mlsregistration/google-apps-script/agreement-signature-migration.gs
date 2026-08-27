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
 * It rebuilds agreements from the consent/name data already recorded in the
 * spreadsheet. It does not ask the signer to consent again.
 *
 * Scholarships are handled separately by scholarship-migration.gs in the
 * standalone scholarship Apps Script project.
 */
function AGREEMENTS_migrateExistingSignatures() {
  // Do NOT hold the Apps Script lock while calling the Worker. The Worker calls
  // this same Apps Script deployment back to update agreement metadata, and a
  // long-held lock here would block that callback.
  const result = {
    players: migrateExistingSignedAgreementSheet_('Players', 'mls_registration', true),
    volunteers: migrateExistingSignedAgreementSheet_('Volunteers', 'volunteer_application', false),
    coaches: migrateExistingSignedAgreementSheet_('Coaches', 'coaching_application', false),
    ppf: migrateExistingPpfAgreements_(),
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
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
    const oldFileId = agreementMigrationValue_(row, map, columns[4]);
    const oldPdfUrl = agreementMigrationValue_(row, map, columns[5]);
    const signerName = agreementMigrationSignerName_(row, map, columns, isPlayer);

    if (!submissionId || !signerName || !agreementMigrationHasAcceptanceEvidence_(row, map, columns, isPlayer)) {
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

      // The Worker callback updates the sheet with the newly archived Drive ID.
      // If the prior value was a Drive file, remove it only after the replacement
      // was generated successfully.
      SpreadsheetApp.flush();
      agreementMigrationTrashReplacedAgreementFile_(sheet, rowNumber, map, columns[4], oldFileId);

      result.migrated++;
    } catch (error) {
      result.failed.push({
        row: rowNumber,
        submissionId: submissionId,
        oldPdfUrl: oldPdfUrl,
        error: String(error.message || error),
      });
    }
  }

  return result;
}

function agreementMigrationSignerName_(row, map, columns, isPlayer) {
  const recordedSigner = agreementMigrationValue_(row, map, columns[3]);
  if (recordedSigner) return recordedSigner;

  if (isPlayer) {
    return [
      agreementMigrationValue_(row, map, 'parent_first_name'),
      agreementMigrationValue_(row, map, 'parent_last_name'),
    ].filter(Boolean).join(' ').trim();
  }

  return [
    agreementMigrationValue_(row, map, 'firstName'),
    agreementMigrationValue_(row, map, 'lastName'),
  ].filter(Boolean).join(' ').trim();
}

function agreementMigrationHasAcceptanceEvidence_(row, map, columns, isPlayer) {
  const status = agreementMigrationValue_(row, map, columns[0]).toLowerCase();
  const signedAt = agreementMigrationValue_(row, map, columns[2]);
  const fileId = agreementMigrationValue_(row, map, columns[4]);
  const pdfUrl = agreementMigrationValue_(row, map, columns[5]);
  const legacySignature = agreementMigrationValue_(row, map, isPlayer ? 'signature' : 'signature');
  const legacyAgreement = agreementMigrationValue_(row, map, isPlayer ? 'agree_waiver' : 'agreement').toLowerCase();

  if (fileId || pdfUrl || signedAt || legacySignature) return true;
  if (status && status !== 'pending signature' && status !== 'pending') return true;
  return /^(yes|true|accepted|agree|agreed|i agree|1)$/i.test(legacyAgreement);
}

function agreementMigrationTrashReplacedAgreementFile_(sheet, rowNumber, map, fileIdHeader, oldFileId) {
  if (!oldFileId || typeof map[fileIdHeader] !== 'number') return;

  const newFileId = String(sheet.getRange(rowNumber, map[fileIdHeader] + 1).getValue() || '').trim();
  if (!newFileId || newFileId === oldFileId) return;

  try {
    DriveApp.getFileById(oldFileId).setTrashed(true);
  } catch (ignored) {
    // The old value may be an R2 object key rather than a Drive file ID.
  }
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

  // Older deployments did not have these two columns. Add them without moving
  // or overwriting any existing columns before reading the data.
  ensureHeadersByName_(sheet, PPF_LIABILITY_COLUMNS);

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

    if (
      !submissionId ||
      !parentName ||
      !participants.length ||
      !agreementMigrationHasPpfAcceptanceEvidence_(row, map)
    ) {
      result.skipped++;
      continue;
    }

    result.scanned++;

    try {
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

      const safeParentName = agreementMigrationSafeDriveFilePart_(parentName || 'Parent');
      const safeSubmissionId = agreementMigrationSafeDriveFilePart_(submissionId);
      const fileName = safeParentName + '_PPF_Liability_' + safeSubmissionId + '.pdf';

      // Always create the replacement first. Only after it exists do we trash
      // the old/matching copies. That prevents a failed render from deleting a
      // previously available document.
      const newFile = ppfFolder.createFile(response.getBlob().setName(fileName));

      const oldMatchingFiles = ppfFolder.getFilesByName(fileName);
      while (oldMatchingFiles.hasNext()) {
        const oldMatchingFile = oldMatchingFiles.next();
        if (oldMatchingFile.getId() !== newFile.getId()) {
          try { oldMatchingFile.setTrashed(true); } catch (ignored) {}
        }
      }

      if (oldFileId && oldFileId !== newFile.getId()) {
        try { DriveApp.getFileById(oldFileId).setTrashed(true); } catch (ignored) {}
      }

      const fileIdCol = map['PPF Liability File ID'];
      const pdfUrlCol = map['PPF Liability PDF URL'];
      if (typeof fileIdCol === 'number') {
        sheet.getRange(rowNumber, fileIdCol + 1).setValue(newFile.getId());
      }
      if (typeof pdfUrlCol === 'number') {
        sheet.getRange(rowNumber, pdfUrlCol + 1).setValue(newFile.getUrl());
      }

      result.migrated++;
    } catch (error) {
      result.failed.push({
        row: rowNumber,
        submissionId: submissionId,
        error: String(error.message || error),
      });
    }
  }

  return result;
}

function agreementMigrationHasPpfAcceptanceEvidence_(row, map) {
  const signedAt = agreementMigrationValue_(row, map, 'Player Agreement Signed At');
  const playerAgreementStatus = agreementMigrationValue_(row, map, 'Player Agreement Status').toLowerCase();
  const legacySignature = agreementMigrationValue_(row, map, 'signature');
  const waiverAccepted = agreementMigrationValue_(row, map, 'agree_waiver').toLowerCase();
  const playerAgreementFileId = agreementMigrationValue_(row, map, 'Player Agreement File ID');
  const playerAgreementPdfUrl = agreementMigrationValue_(row, map, 'Player Agreement PDF URL');

  if (signedAt || legacySignature || playerAgreementFileId || playerAgreementPdfUrl) return true;
  if (playerAgreementStatus && playerAgreementStatus !== 'pending signature' && playerAgreementStatus !== 'pending') return true;
  return /^(yes|true|accepted|agree|agreed|i agree|1)$/i.test(waiverAccepted);
}

function agreementMigrationSafeDriveFilePart_(value) {
  const cleaned = String(value || '')
    .trim()
    .replace(/[\\/:*?"<>|#%{}~&]/g, '-')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_\-.]+|[_\-.]+$/g, '');
  return cleaned.substring(0, 80) || 'Record';
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
