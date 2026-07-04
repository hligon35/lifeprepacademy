const SHEET_ID = '16xbM_ZXe4mEdfjABwPVfc6HqWhn-iW9DumoFfaQ9JTQ';
const PARENTS_TAB = 'Parents';
const PASSES_TAB = 'Check-In Passes';
const SCAN_LOG_TAB = 'Scan Log';

function doGet(e) {
  const p = e.parameter || {};
  const callback = p.callback || 'callback';
  let payload;
  try {
    payload = handleAction_(p.action, p);
  } catch (err) {
    payload = { ok: false, error: err.message || String(err) };
  }
  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(payload) + ')')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function handleAction_(action, p) {
  switch (action) {
    case 'lookupPass': return lookupPass_(p.parentKey);
    case 'verify': return verify_(p.parentKey);
    case 'staffLookup': return staffLookup_(p.code);
    case 'completeCheckin': return completeCheckin_(p.code, p.device);
    default: throw new Error('Unknown action: ' + action);
  }
}

function ss_() { return SpreadsheetApp.openById(SHEET_ID); }
function sheet_(name) {
  const ss = ss_();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

function readTable_(name) {
  const sh = sheet_(name);
  const values = sh.getDataRange().getValues();
  if (!values.length || values[0].every(v => !v)) return { sheet: sh, headers: [], rows: [] };
  const headers = values[0].map(h => String(h).trim());
  const rows = values.slice(1).map((r, i) => ({ rowNumber: i + 2, values: r, obj: objectFromRow_(headers, r) }));
  return { sheet: sh, headers, rows };
}

function objectFromRow_(headers, row) {
  const o = {};
  headers.forEach((h, i) => { if (h) o[h] = row[i]; });
  return o;
}

function getVal_(obj, names) {
  for (const n of names) if (obj[n] !== undefined && obj[n] !== '') return obj[n];
  return '';
}

function ensureHeaders_(sheetName, headers) {
  const sh = sheet_(sheetName);
  const existing = sh.getLastRow() ? sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0].map(String) : [];
  const merged = existing.filter(Boolean);
  headers.forEach(h => { if (!merged.includes(h)) merged.push(h); });
  sh.getRange(1, 1, 1, merged.length).setValues([merged]);
  return merged;
}

function findParent_(parentKeyOrQr) {
  const parents = readTable_(PARENTS_TAB);
  const needle = String(parentKeyOrQr || '').trim();
  if (!needle) throw new Error('Missing parent key or QR code.');
  const found = parents.rows.find(r => {
    const o = r.obj;
    return String(getVal_(o, ['parent_key', 'Parent Key', 'ParentKey'])).trim() === needle ||
      String(getVal_(o, ['qr_id', 'QR Code ID', 'QRCodeID'])).trim() === needle;
  });
  if (!found) throw new Error('No matching registration was found.');
  return { table: parents, row: found };
}

function normalizeParent_(row) {
  const o = row.obj;
  const key = String(getVal_(o, ['parent_key', 'Parent Key', 'ParentKey']));
  return {
    parentKey: key,
    qrId: String(getVal_(o, ['qr_id', 'QR Code ID', 'QRCodeID']) || key),
    parentName: String(getVal_(o, ['parent_name', 'Parent Name', 'Parent/Guardian Full Name', 'Parent/Guardian Full Name - First Name'])),
    email: String(getVal_(o, ['parent_email', 'Email Address', 'Email'])),
    phone: String(getVal_(o, ['parent_phone', 'Primary Phone Number', 'Phone'])),
    ticketCount: String(getVal_(o, ['ticket_count', 'Ticket Count'])),
    childNames: String(getVal_(o, ['registered_child_names', 'Registered Children', 'Child Names'])),
    preCheckStatus: String(getVal_(o, ['precheck_status', 'Pre-Check Status'])),
    checkedIn: String(getVal_(o, ['checked_in', 'Checked In'])),
    checkedInAt: String(getVal_(o, ['checked_in_at', 'Check-In Time']))
  };
}

function childrenFromParent_(parent) {
  if (!parent.childNames) return [];
  return parent.childNames.split(/,|\n|;/).map(s => s.trim()).filter(Boolean).map(name => ({ name }));
}

function lookupPass_(parentKey) {
  const found = findParent_(parentKey);
  const parent = normalizeParent_(found.row);
  return { ok: true, parent, children: childrenFromParent_(parent) };
}

function verify_(parentKey) {
  const found = findParent_(parentKey);
  const parent = normalizeParent_(found.row);
  const headers = ensureHeaders_(PARENTS_TAB, ['parent_key', 'qr_id', 'precheck_status', 'precheck_time']);
  const qrId = parent.qrId || parent.parentKey || Utilities.getUuid().slice(0, 8).toUpperCase();
  updateCell_(found.table.sheet, headers, found.row.rowNumber, 'qr_id', qrId);
  updateCell_(found.table.sheet, headers, found.row.rowNumber, 'precheck_status', 'Verified');
  updateCell_(found.table.sheet, headers, found.row.rowNumber, 'precheck_time', new Date());
  upsertPass_(parent.parentKey, qrId, 'Verified');
  const fresh = findParent_(parent.parentKey);
  const normalized = normalizeParent_(fresh.row);
  return { ok: true, qrId, parent: normalized, children: childrenFromParent_(normalized) };
}

function staffLookup_(code) {
  const found = findParent_(code);
  const parent = normalizeParent_(found.row);
  const medicalFlag = /yes|allergy|asthma|medical|special|condition|medication/i.test(JSON.stringify(found.row.obj));
  const shirts = String(getVal_(found.row.obj, ['shirt_sizes', 'Shirt Sizes', 'T-Shirt Size']));
  return { ok: true, parent, children: childrenFromParent_(parent), shirts, medicalFlag };
}

function completeCheckin_(code, device) {
  const found = findParent_(code);
  const parent = normalizeParent_(found.row);
  const now = new Date();
  const headers = ensureHeaders_(PARENTS_TAB, ['checked_in', 'checked_in_at', 'checked_in_by']);
  updateCell_(found.table.sheet, headers, found.row.rowNumber, 'checked_in', 'Yes');
  updateCell_(found.table.sheet, headers, found.row.rowNumber, 'checked_in_at', now);
  updateCell_(found.table.sheet, headers, found.row.rowNumber, 'checked_in_by', device || 'At The Gate');
  logScan_(parent.parentKey, parent.qrId || code, parent.parentName, now, device);
  const fresh = findParent_(parent.parentKey || code);
  const normalized = normalizeParent_(fresh.row);
  return { ok: true, parent: normalized, children: childrenFromParent_(normalized), checkedInAt: now.toLocaleString() };
}

function updateCell_(sh, headers, rowNumber, header, value) {
  let idx = headers.indexOf(header);
  if (idx === -1) {
    headers.push(header);
    sh.getRange(1, headers.length).setValue(header);
    idx = headers.length - 1;
  }
  sh.getRange(rowNumber, idx + 1).setValue(value);
}

function upsertPass_(parentKey, qrId, status) {
  const headers = ensureHeaders_(PASSES_TAB, ['parent_key', 'qr_id', 'status', 'updated_at']);
  const table = readTable_(PASSES_TAB);
  const row = table.rows.find(r => String(r.obj.parent_key) === String(parentKey));
  const values = headers.map(h => ({ parent_key: parentKey, qr_id: qrId, status, updated_at: new Date() })[h] || '');
  if (row) table.sheet.getRange(row.rowNumber, 1, 1, headers.length).setValues([values]);
  else table.sheet.appendRow(values);
}

function logScan_(parentKey, qrId, parentName, when, device) {
  ensureHeaders_(SCAN_LOG_TAB, ['timestamp', 'parent_key', 'qr_id', 'parent_name', 'device']);
  sheet_(SCAN_LOG_TAB).appendRow([when, parentKey, qrId, parentName, device || '']);
}
