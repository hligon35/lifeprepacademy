function parentSheetContext_(){
  const table = table_(PARENTS_TAB, false);
  if (!table.sheet || !table.headers.length) throw new Error('Parent Check-In tab was not found.');
  const columns = {};
  table.headers.forEach(function(header, index){ columns[header] = index + 1; });
  return { sheet: table.sheet, headers: table.headers, columns: columns };
}

function updateParentRow_(rowNumber, values){
  const context = parentSheetContext_();
  Object.keys(values).forEach(function(name){
    const column = context.columns[name];
    if (!column) throw new Error('Missing Parent Check-In column: ' + name);
    context.sheet.getRange(rowNumber, column).setValue(values[name]);
  });
}

function lookupPass_(key){
  const family = findFamilyCached_(key);
  return { ok: true, parent: family.parent, children: family.children };
}

function staffLookup_(code){
  const family = findFamilyCached_(code);
  return { ok: true, parent: family.parent, children: family.children };
}

function verify_(key){
  const family = findFamilyCached_(key);
  const qrId = family.parent.qrId || qr_();
  updateParentRow_(family.rowNumber, {
    qr_id: qrId,
    precheck_status: 'Verified',
    precheck_time: now_()
  });
  clearFamilyCache_();
  const fresh = findFamilyCached_(family.parent.parentKey || qrId);
  return { ok: true, qrId: qrId, parent: fresh.parent, children: fresh.children };
}

function completeCheckin_(code, device){
  ss_().setSpreadsheetTimeZone(EVENT_TIME_ZONE);
  const family = findFamilyCached_(code);
  const before = family.parent.checkedIn || '';
  const timestamp = now_();

  updateParentRow_(family.rowNumber, {
    checked_in: 'Yes',
    checked_in_at: timestamp,
    checked_in_by: device || 'At The Gate'
  });

  const log = sh_(SCAN_LOG_TAB, true);
  if (log.getLastRow() === 0) {
    log.appendRow(['timestamp','parent_token','qr_id','parent_name','child_names','device','status_before_scan']);
  }
  log.appendRow([
    timestamp,
    family.parent.parentKey,
    family.parent.qrId || code,
    family.parent.parentName,
    family.parent.childNames,
    device || '',
    before
  ]);

  clearFamilyCache_();
  const fresh = findFamilyCached_(family.parent.parentKey || family.parent.qrId || code);
  return {
    ok: true,
    parent: fresh.parent,
    children: fresh.children,
    checkedInAt: formatLocalDateTime_(timestamp)
  };
}
