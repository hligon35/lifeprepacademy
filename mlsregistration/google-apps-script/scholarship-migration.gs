/**
 * One-time migration for scholarship agreements created before typed signatures
 * were styled with Great Vibes.
 *
 * Add this file to the same standalone Apps Script project as scholarship.gs,
 * then run SCHOLARSHIP_migrateExistingSignatures() manually once.
 *
 * What it does:
 * - Processes only rows whose scholarship_terms_status is Accepted.
 * - Opens the existing Google Doc recorded in scholarship_terms_document_file_id.
 * - Styles every Parent/Guardian name occurrence in that document as Great Vibes.
 * - Rebuilds the PDF from the updated Google Doc.
 * - Trashes the old PDF, if one exists, and writes the new PDF URL/ID/timestamp
 *   back to the same scholarship row.
 * - Does not resend emails, change acceptance IDs, change accepted timestamps,
 *   or alter participant/application data.
 */
function SCHOLARSHIP_migrateExistingSignatures() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const sheet = scholarshipGetSheet_(SCHOLARSHIP_CONFIG.SCHOLARSHIPS_SHEET);
    scholarshipEnsureTrackingHeaders_(sheet);

    const table = scholarshipReadTable_(sheet);
    const map = scholarshipHeaderMap_(table.headers);
    scholarshipRequireHeaders_(map, SCHOLARSHIP_CONFIG.REQUIRED_HEADERS);

    const requiredMigrationHeaders = [
      'scholarship_terms_status',
      'scholarship_terms_parent_name',
      'scholarship_terms_document_file_id',
      'scholarship_terms_pdf_url',
      'scholarship_terms_pdf_file_id',
      'scholarship_terms_pdf_created_at',
      'scholarship_terms_error'
    ];
    scholarshipRequireHeaders_(map, requiredMigrationHeaders);

    const result = {
      scanned: 0,
      migrated: 0,
      skipped: 0,
      failed: []
    };

    table.rows.forEach(function(row, index) {
      const rowNumber = index + 2;
      const status = scholarshipValue_(row, map, 'scholarship_terms_status').toLowerCase();
      if (status !== 'accepted') {
        result.skipped++;
        return;
      }

      result.scanned++;

      try {
        const parentName = scholarshipNormalize_(
          scholarshipValue_(row, map, 'scholarship_terms_parent_name') ||
          [
            scholarshipValue_(row, map, 'parent_first_name'),
            scholarshipValue_(row, map, 'parent_last_name')
          ].filter(Boolean).join(' ')
        );
        const documentFileId = scholarshipValue_(row, map, 'scholarship_terms_document_file_id');
        const oldPdfFileId = scholarshipValue_(row, map, 'scholarship_terms_pdf_file_id');
        const registrationId = scholarshipValue_(row, map, 'registration_submission_id');

        if (!parentName) throw new Error('Parent/guardian name is missing.');
        if (!documentFileId) throw new Error('Scholarship document file ID is missing.');

        const document = DocumentApp.openById(documentFileId);
        const body = document.getBody();
        const styledCount = scholarshipStyleExistingSignatureNames_(body, parentName);
        if (!styledCount) {
          throw new Error('No Parent/Guardian signature line was found in the existing document.');
        }
        document.saveAndClose();

        if (oldPdfFileId) {
          try {
            DriveApp.getFileById(oldPdfFileId).setTrashed(true);
          } catch (ignored) {}
        }

        const documentFile = DriveApp.getFileById(documentFileId);
        const newPdf = scholarshipCreateMigratedPdf_(documentFile, parentName, registrationId);

        scholarshipSetRowFields_(sheet, rowNumber, map, {
          scholarship_terms_pdf_url: newPdf.url,
          scholarship_terms_pdf_file_id: newPdf.fileId,
          scholarship_terms_pdf_created_at: newPdf.createdAt,
          scholarship_terms_error: ''
        });

        result.migrated++;
      } catch (error) {
        const message = scholarshipError_(error);
        result.failed.push({row: rowNumber, error: message});
        try {
          scholarshipSetRowFields_(sheet, rowNumber, map, {
            scholarship_terms_error: 'Signature migration failed: ' + message
          });
        } catch (ignored) {}
      }
    });

    console.log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    lock.releaseLock();
  }
}

function scholarshipStyleExistingSignatureNames_(body, parentName) {
  const normalizedName = scholarshipNormalize_(parentName).replace(/[\r\n]+/g, ' ');
  if (!normalizedName) return 0;

  const searchPattern = 'Parent\\/Guardian:\\s*';
  let from = null;
  let count = 0;

  while (true) {
    const match = from ? body.findText(searchPattern, from) : body.findText(searchPattern);
    if (!match) break;

    const text = match.getElement().asText();
    const fullText = text.getText();
    const labelIndex = fullText.indexOf('Parent/Guardian:');
    if (labelIndex !== -1) {
      const signatureStart = labelIndex + 'Parent/Guardian:'.length;
      let nameStart = signatureStart;
      while (nameStart < fullText.length && /\s/.test(fullText.charAt(nameStart))) nameStart++;

      const expectedEnd = nameStart + normalizedName.length - 1;
      if (expectedEnd < fullText.length &&
          fullText.substring(nameStart, expectedEnd + 1) === normalizedName) {
        text.setFontFamily(nameStart, expectedEnd, 'Great Vibes');
        text.setFontSize(nameStart, expectedEnd, 18);
        text.setBold(nameStart, expectedEnd, false);
        text.setItalic(nameStart, expectedEnd, false);
        count++;
      }
    }

    from = match;
  }

  return count;
}

function scholarshipCreateMigratedPdf_(documentFile, parentName, registrationId) {
  const folder = DriveApp.getFolderById(SCHOLARSHIP_CONFIG.APPLICATIONS_FOLDER_ID);
  const fileName = scholarshipPdfFileName_(parentName, registrationId);
  const pdfBlob = documentFile.getAs(MimeType.PDF).setName(fileName);
  const file = folder.createFile(pdfBlob);
  file.setDescription(
    'Paducah GO Soccer scholarship application for ' + parentName +
    '. Registration ID: ' + registrationId +
    '. Rebuilt by typed-signature migration.'
  );
  return {
    url: file.getUrl(),
    fileId: file.getId(),
    createdAt: new Date()
  };
}
