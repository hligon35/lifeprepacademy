function ensureParentSheet_(){
  const sheet = sh_(PARENTS_TAB, true);
  if (sheet.getMaxColumns() < PARENT_HEADERS.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), PARENT_HEADERS.length - sheet.getMaxColumns());
  }
  sheet.getRange(1, 1, 1, PARENT_HEADERS.length).setValues([PARENT_HEADERS]);
  sheet.setFrozenRows(1);
  return sheet;
}

function syncParentCheckIn_(){
  const book = ss_();
  book.setSpreadsheetTimeZone(EVENT_TIME_ZONE);
  const children = table_(CHILDREN_TAB, false);
  const tickets = table_(TICKETS_TAB, false);
  const existing = table_(PARENTS_TAB, false);
  if (!children.sheet) throw new Error('Child Registrations tab was not found.');
  if (!tickets.sheet) throw new Error('Event Tickets tab was not found.');

  const priorByEmail = {};
  const priorByPhone = {};
  existing.rows.forEach(function(row){
    const email = normEmail_(row.obj.parent_email);
    const phone = normPhone_(row.obj.parent_phone);
    if (email) priorByEmail[email] = row.obj;
    if (phone) priorByPhone[phone] = row.obj;
  });

  const ticketCounts = {};
  tickets.rows.forEach(function(row){
    const email = normEmail_(val_(row.obj, ['Buyer email', 'Attendee email']));
    if (email) ticketCounts[email] = (ticketCounts[email] || 0) + 1;
  });

  const groups = [];
  children.rows.forEach(function(row){
    const email = normEmail_(val_(row.obj, ['Email Address']));
    const phone = normPhone_(val_(row.obj, ['Primary Phone Number']));
    const parentName = String(val_(row.obj, ['Parent/Guardian Full Name'])).trim();
    const childName = String(val_(row.obj, ["Child's Full Name"])).trim();
    if (!email && !phone) return;

    let group = groups.find(function(item){
      return (email && item.emails[email]) || (phone && item.phones[phone]);
    });
    if (!group) {
      group = { emails: {}, phones: {}, parentName: parentName, children: [] };
      groups.push(group);
    }
    if (email) group.emails[email] = true;
    if (phone) group.phones[phone] = true;
    if (!group.parentName && parentName) group.parentName = parentName;
    if (childName && group.children.indexOf(childName) < 0) group.children.push(childName);

    groups.slice().forEach(function(other){
      if (other === group) return;
      const sameEmail = Object.keys(other.emails).some(function(key){ return group.emails[key]; });
      const samePhone = Object.keys(other.phones).some(function(key){ return group.phones[key]; });
      if (!sameEmail && !samePhone) return;
      Object.keys(other.emails).forEach(function(key){ group.emails[key] = true; });
      Object.keys(other.phones).forEach(function(key){ group.phones[key] = true; });
      other.children.forEach(function(name){ if (group.children.indexOf(name) < 0) group.children.push(name); });
      const index = groups.indexOf(other);
      if (index >= 0) groups.splice(index, 1);
    });
  });

  const rows = groups.map(function(group){
    const emails = Object.keys(group.emails);
    const phones = Object.keys(group.phones);
    let old = {};
    emails.some(function(email){ if (priorByEmail[email]) { old = priorByEmail[email]; return true; } return false; });
    if (!old.parent_token) phones.some(function(phone){ if (priorByPhone[phone]) { old = priorByPhone[phone]; return true; } return false; });
    const email = normEmail_(old.parent_email) || emails[0] || '';
    const phone = normPhone_(old.parent_phone) || phones[0] || '';
    let ticketCount = 0;
    emails.forEach(function(value){ ticketCount = Math.max(ticketCount, ticketCounts[value] || 0); });
    ticketCount = Math.max(ticketCount, Number(old.ticket_count || 0), group.children.length);

    const parentToken = old.parent_token || token_();
    const qrId = old.qr_id || qr_();
    const fastPassUrl = FAST_PASS_PARENT_URL + '?k=' + encodeURIComponent(parentToken);

    return {
      parent_token: parentToken,
      parent_phone: phone,
      parent_email: email,
      parent_name: old.parent_name || group.parentName || 'Parent / Guardian',
      ticket_count: ticketCount,
      registered_child_count: group.children.length,
      available_ticket_count: Math.max(0, ticketCount - group.children.length),
      registered_child_names: group.children.join(', '),
      registration_status: old.registration_status || 'Confirmed',
      qr_id: qrId,
      precheck_status: old.precheck_status || '',
      precheck_time: old.precheck_time || '',
      checked_in: old.checked_in || '',
      checked_in_at: old.checked_in_at || '',
      checked_in_by: old.checked_in_by || '',
      email_status: old.email_status || 'Ready for Make',
      sendgrid_message_id: old.sendgrid_message_id || '',
      email_sent_at: old.email_sent_at || '',
      last_synced_at: now_(),
      fast_pass_url: fastPassUrl,
      branded_qr_code: old.branded_qr_code || ''
    };
  });

  const sheet = ensureParentSheet_();
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, PARENT_HEADERS.length).clearContent();
  }
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, PARENT_HEADERS.length)
      .setValues(rows.map(function(row){ return PARENT_HEADERS.map(function(header){ return row[header] || ''; }); }));
  }
  clearFamilyCache_();
  getFamilyDirectory_(true);
  return { ok: true, parentCount: rows.length, qrIdsGenerated: rows.length, emailsReady: rows.filter(function(row){ return row.email_status === 'Ready for Make'; }).length };
}

function setupCheckInSystem(){
  const result = syncParentCheckIn_();
  ss_().setSpreadsheetTimeZone(EVENT_TIME_ZONE);
  return result;
}
