const FAST_PASS_PARENT_URL = 'https://lifeprepacademyfoundation.com/checkin/';

function childSignature_(names){
  return (names || [])
    .map(function(name){ return String(name || '').trim().toLowerCase(); })
    .filter(Boolean)
    .sort()
    .join('|');
}

function joinedName_(obj, combined, first, middle, last){
  const full = String(val_(obj, combined) || '').trim();
  if (full) return full;
  return [
    String(val_(obj, first) || '').trim(),
    String(val_(obj, middle) || '').trim(),
    String(val_(obj, last) || '').trim()
  ].filter(Boolean).join(' ');
}

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
  const waitlist = table_(WAITLIST_TAB, false);
  const tickets = table_(TICKETS_TAB, false);
  const existing = table_(PARENTS_TAB, false);
  if (!children.sheet && !waitlist.sheet) {
    throw new Error('Neither Child Registrations nor Waitlist was found.');
  }
  if (!tickets.sheet) throw new Error('Event Tickets tab was not found.');

  const priorByToken = {};
  const priorByEmail = {};
  const priorByPhone = {};
  existing.rows.forEach(function(row){
    const token = String(row.obj.parent_token || '').trim();
    const email = normEmail_(row.obj.parent_email);
    const phone = normPhone_(row.obj.parent_phone);
    if (token) priorByToken[token] = row.obj;
    if (email) priorByEmail[email] = row.obj;
    if (phone) priorByPhone[phone] = row.obj;
  });

  const ticketCounts = {};
  tickets.rows.forEach(function(row){
    const email = normEmail_(val_(row.obj, ['Buyer email', 'Attendee email']));
    if (email) ticketCounts[email] = (ticketCounts[email] || 0) + 1;
  });

  const sourceRows = (children.rows || []).map(function(row){
    return { row: row, fromWaitlist: false };
  });

  (waitlist.rows || []).forEach(function(row){
    const registrationType = String(val_(row.obj, [
      'registration_type', 'Registration Type'
    ]) || '').trim().toLowerCase();
    const parentToken = String(val_(row.obj, [
      'parent_key', 'parent_token', 'Parent Key'
    ]) || '').trim();

    // The form writes every new submission to Waitlist. Only an explicitly
    // linked add-child submission may become part of an existing Fast Pass.
    // Ordinary waitlist registrations must stay out of confirmed families.
    if (registrationType !== 'add_child' || !parentToken || !priorByToken[parentToken]) return;
    sourceRows.push({ row: row, fromWaitlist: true });
  });

  const groups = [];
  sourceRows.forEach(function(source){
    const row = source.row;
    const parentToken = String(val_(row.obj, [
      'parent_key', 'parent_token', 'Parent Key'
    ]) || '').trim();
    const linkedParent = parentToken ? priorByToken[parentToken] : null;
    const email = normEmail_(val_(row.obj, [
      'Email Address', 'ticket_email', 'matched_ticket_email'
    ])) || normEmail_(linkedParent && linkedParent.parent_email);
    const phone = normPhone_(val_(row.obj, [
      'Primary Phone Number', 'Parent Phone'
    ])) || normPhone_(linkedParent && linkedParent.parent_phone);
    const parentName = joinedName_(
      row.obj,
      ['Parent/Guardian Full Name', 'Parent Name'],
      ['Parent/Guardian Full Name - First Name', 'Parent First Name'],
      ['Parent/Guardian Full Name - Middle Name', 'Parent Middle Name'],
      ['Parent/Guardian Full Name - Last Name', 'Parent Last Name']
    ) || String(linkedParent && linkedParent.parent_name || '').trim();
    const childName = joinedName_(
      row.obj,
      ["Child's Full Name", 'Child Full Name'],
      ["Child's Full Name - First Name", 'Child First Name'],
      ["Child's Full Name - Middle Name", 'Child Middle Name'],
      ["Child's Full Name - Last Name", 'Child Last Name']
    );
    if (!parentToken && !email && !phone) return;

    let group = groups.find(function(item){
      return (parentToken && item.parentTokens[parentToken]) ||
        (email && item.emails[email]) ||
        (phone && item.phones[phone]);
    });
    if (!group) {
      group = { parentTokens: {}, emails: {}, phones: {}, parentName: parentName, children: [] };
      if (source.fromWaitlist && linkedParent) {
        String(linkedParent.registered_child_names || '')
          .split(',')
          .map(function(name){ return name.trim(); })
          .filter(Boolean)
          .forEach(function(name){ group.children.push(name); });
      }
      groups.push(group);
    }
    if (parentToken) group.parentTokens[parentToken] = true;
    if (email) group.emails[email] = true;
    if (phone) group.phones[phone] = true;
    if (!group.parentName && parentName) group.parentName = parentName;
    if (childName && group.children.indexOf(childName) < 0) group.children.push(childName);

    groups.slice().forEach(function(other){
      if (other === group) return;
      const sameToken = Object.keys(other.parentTokens).some(function(key){ return group.parentTokens[key]; });
      const sameEmail = Object.keys(other.emails).some(function(key){ return group.emails[key]; });
      const samePhone = Object.keys(other.phones).some(function(key){ return group.phones[key]; });
      if (!sameToken && !sameEmail && !samePhone) return;
      Object.keys(other.parentTokens).forEach(function(key){ group.parentTokens[key] = true; });
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
    Object.keys(group.parentTokens).some(function(token){
      if (priorByToken[token]) { old = priorByToken[token]; return true; }
      return false;
    });
    if (!old.parent_token) emails.some(function(email){ if (priorByEmail[email]) { old = priorByEmail[email]; return true; } return false; });
    if (!old.parent_token) phones.some(function(phone){ if (priorByPhone[phone]) { old = priorByPhone[phone]; return true; } return false; });
    const email = normEmail_(old.parent_email) || emails[0] || '';
    const phone = normPhone_(old.parent_phone) || phones[0] || '';
    let ticketCount = 0;
    emails.forEach(function(value){ ticketCount = Math.max(ticketCount, ticketCounts[value] || 0); });
    ticketCount = Math.max(ticketCount, Number(old.ticket_count || 0), group.children.length);

    const parentToken = old.parent_token || Object.keys(group.parentTokens)[0] || token_();
    const qrId = old.qr_id || qr_();
    const priorChildren = String(old.registered_child_names || '')
      .split(',')
      .map(function(name){ return name.trim(); })
      .filter(Boolean);
    const childrenChanged = Boolean(old.parent_token) &&
      childSignature_(priorChildren) !== childSignature_(group.children);
    const alreadyCheckedIn = String(old.checked_in || '').toLowerCase() === 'yes';
    const requeueEmail = childrenChanged && !alreadyCheckedIn;

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
      precheck_status: childrenChanged ? '' : (old.precheck_status || ''),
      precheck_time: childrenChanged ? '' : (old.precheck_time || ''),
      checked_in: old.checked_in || '',
      checked_in_at: old.checked_in_at || '',
      checked_in_by: old.checked_in_by || '',
      email_status: requeueEmail ? 'Ready for Make' : (old.email_status || 'Ready for Make'),
      sendgrid_message_id: requeueEmail ? '' : (old.sendgrid_message_id || ''),
      email_sent_at: requeueEmail ? '' : (old.email_sent_at || ''),
      last_synced_at: now_(),
      fast_pass_url: FAST_PASS_PARENT_URL + '?k=' + encodeURIComponent(parentToken),
      branded_qr_code: ''
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
  const qrRefresh = refreshBrandedFamilyQrCodes();
  clearFamilyCache_();
  getFamilyDirectory_(true);
  return {
    ok: true,
    parentCount: rows.length,
    qrIdsGenerated: rows.length,
    brandedQrRows: qrRefresh.updated,
    emailsReady: rows.filter(function(row){ return row.email_status === 'Ready for Make'; }).length
  };
}

function setupCheckInSystem(){
  const result = syncParentCheckIn_();
  ss_().setSpreadsheetTimeZone(EVENT_TIME_ZONE);
  return result;
}


function refreshFastPassFamilies(){
  return syncParentCheckIn_();
}

function installFastPassSyncTrigger(){
  const handler = 'refreshFastPassFamilies';
  ScriptApp.getProjectTriggers().forEach(function(trigger){
    if (trigger.getHandlerFunction() === handler) ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger(handler).timeBased().everyMinutes(5).create();
  return { ok: true, handler: handler, intervalMinutes: 5 };
}
