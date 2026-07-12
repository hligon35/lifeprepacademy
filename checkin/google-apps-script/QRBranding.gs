const FAST_PASS_SITE_URL = 'https://lifeprepacademyfoundation.com/checkin/';
const FAST_PASS_LOGO_URL = 'https://lifeprepacademyfoundation.com/checkin/fastpasslogo.png';

/**
 * Adds or refreshes branded family Fast Pass QR codes in Parent Check-In.
 * The QR opens staff mode and contains only the random family qr_id.
 */
function refreshBrandedFamilyQrCodes() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(PARENTS_TAB);
  if (!sheet) throw new Error('Run setupCheckInSystem() first to create Parent Check-In.');

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { ok: true, updated: 0 };

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const qrIdColumn = headers.indexOf('qr_id') + 1;
  if (!qrIdColumn) throw new Error('The qr_id column is missing from Parent Check-In.');

  let qrImageColumn = headers.indexOf('branded_qr_code') + 1;
  if (!qrImageColumn) {
    qrImageColumn = sheet.getLastColumn() + 1;
    sheet.getRange(1, qrImageColumn).setValue('branded_qr_code');
  }

  const formulas = [];
  for (let row = 2; row <= lastRow; row++) {
    const qrCell = sheet.getRange(row, qrIdColumn).getA1Notation();
    const passUrl = FAST_PASS_SITE_URL + '?staff=1&code=';
    const formula = '=IF(' + qrCell + '="","",IMAGE("https://quickchart.io/qr?text="&ENCODEURL("' + passUrl + '"&' + qrCell + ')&"&size=500&ecLevel=H&margin=2&centerImageUrl="&ENCODEURL("' + FAST_PASS_LOGO_URL + '")))';
    formulas.push([formula]);
  }

  sheet.getRange(2, qrImageColumn, formulas.length, 1).setFormulas(formulas);
  sheet.setColumnWidth(qrImageColumn, 180);
  sheet.setRowHeights(2, formulas.length, 180);

  return { ok: true, updated: formulas.length };
}

/**
 * Convenience setup for the complete parent table and branded QRs.
 */
function setupAndRefreshFastPasses() {
  const syncResult = setupCheckInSystem();
  const qrResult = refreshBrandedFamilyQrCodes();
  return { ok: true, parents: syncResult.parentCount, qrRows: qrResult.updated };
}
