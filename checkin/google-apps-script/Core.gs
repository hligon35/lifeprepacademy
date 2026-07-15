function ss_(){ return SpreadsheetApp.openById(SHEET_ID); }
function now_(){ return new Date(); }
function formatLocalDateTime_(value){ return Utilities.formatDate(value, EVENT_TIME_ZONE, 'M/d/yyyy h:mm:ss a'); }
function sh_(name, create){
  const book = ss_();
  let sheet = book.getSheetByName(name);
  if (!sheet && create !== false) sheet = book.insertSheet(name);
  return sheet;
}
function normEmail_(value){ return String(value || '').trim().toLowerCase(); }
function normPhone_(value){
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 11 && digits[0] === '1' ? digits.slice(1) : digits;
}
function obj_(headers, row){
  const output = {};
  headers.forEach(function(header, index){
    if (header) output[String(header).trim()] = row[index];
  });
  return output;
}
function table_(name, create){
  const sheet = sh_(name, create);
  if (!sheet) return { sheet: null, headers: [], rows: [] };
  const values = sheet.getDataRange().getValues();
  if (!values.length) return { sheet: sheet, headers: [], rows: [] };
  const headers = values[0].map(function(value){ return String(value).trim(); });
  return {
    sheet: sheet,
    headers: headers,
    rows: values.slice(1).map(function(row, index){
      return { rowNumber: index + 2, obj: obj_(headers, row), values: row };
    })
  };
}
function val_(object, names){
  for (let index = 0; index < names.length; index += 1) {
    const value = object[names[index]];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return '';
}
function token_(){ return Utilities.getUuid().replace(/-/g, ''); }
function qr_(){ return 'LPAF-' + Utilities.getUuid().slice(0, 8).toUpperCase(); }
function parentDto_(object){
  return {
    parentKey: String(object.parent_token || ''),
    qrId: String(object.qr_id || ''),
    parentName: String(object.parent_name || ''),
    email: String(object.parent_email || ''),
    phone: String(object.parent_phone || ''),
    ticketCount: Number(object.ticket_count || 0),
    registeredChildCount: Number(object.registered_child_count || 0),
    availableTicketCount: Number(object.available_ticket_count || 0),
    childNames: String(object.registered_child_names || ''),
    registrationStatus: String(object.registration_status || ''),
    addChildEligible: Number(object.available_ticket_count || 0) > 0,
    preCheckStatus: String(object.precheck_status || ''),
    checkedIn: String(object.checked_in || ''),
    checkedInAt: String(object.checked_in_at || '')
  };
}
function childDto_(row){
  return {
    childKey: String(val_(row.obj, ['child_key']) || row.rowNumber),
    name: String(val_(row.obj, ["Child's Full Name", 'child_name'])),
    shirtSize: String(val_(row.obj, ['T-Shirt Size', 'Shirt Size', 'shirt_size'])),
    medicalInfo: String(val_(row.obj, ['Medical Conditions, Allergies, or Special Needs', 'Medical Notes', 'medical_info'])),
    medications: String(val_(row.obj, ['Current Medications', 'Medications', 'medications']))
  };
}
function clearFamilyCache_(){ CacheService.getScriptCache().remove(FAMILY_CACHE_KEY); }
