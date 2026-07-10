const SHEET_ID = '16xbM_ZXe4mEdfjABwPVfc6HqWhn-iW9DumoFfaQ9JTQ';
const CHILDREN_TAB = 'Child Registrations';
const TICKETS_TAB = 'Event Tickets';
const PARENTS_TAB = 'Parent Check-In';
const SCAN_LOG_TAB = 'Scan Log';

const PARENT_HEADERS = [
  'parent_token','parent_phone','parent_email','parent_name','ticket_count',
  'registered_child_count','available_ticket_count','registered_child_names',
  'registration_status','qr_id','precheck_status','precheck_time','checked_in',
  'checked_in_at','checked_in_by','sms_status','twilio_message_sid','last_synced_at',
  'branded_qr_code'
];

function doGet(e) {
  const p = (e && e.parameter) ? e.parameter : {};
  const callback = String(p.callback || 'callback').replace(/[^a-zA-Z0-9_$]/g, '');
  let payload;
  try {
    payload = p.action ? handleAction_(p.action, p) : {
      ok: true,
      message: 'Check-in web app is running. Use an action parameter from the website.'
    };
  } catch (err) {
    payload = { ok:false, error:err.message || String(err) };
  }
  return ContentService.createTextOutput(callback + '(' + JSON.stringify(payload) + ')')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function handleAction_(action, p) {
  if (action === 'lookupPass') return lookupPass_(p.parentKey);
  if (action === 'verify') return verify_(p.parentKey);
  if (action === 'staffLookup') return staffLookup_(p.code);
  if (action === 'completeCheckin') return completeCheckin_(p.code, p.device);
  if (action === 'syncParents') return syncParentCheckIn_();
  throw new Error('Unknown action: ' + action);
}

function ss_(){ return SpreadsheetApp.openById(SHEET_ID); }
function sh_(name, create){ let s=ss_().getSheetByName(name); if(!s && create!==false) s=ss_().insertSheet(name); return s; }
function normEmail_(v){ return String(v||'').trim().toLowerCase(); }
function normPhone_(v){ const d=String(v||'').replace(/\D/g,''); return d.length===11&&d[0]==='1'?d.slice(1):d; }
function obj_(headers,row){ const o={}; headers.forEach((h,i)=>{if(h)o[String(h).trim()]=row[i];}); return o; }
function table_(name,create){ const s=sh_(name,create); if(!s)return {sheet:null,headers:[],rows:[]}; const v=s.getDataRange().getValues(); if(!v.length)return {sheet:s,headers:[],rows:[]}; const h=v[0].map(x=>String(x).trim()); return {sheet:s,headers:h,rows:v.slice(1).map((r,i)=>({rowNumber:i+2,obj:obj_(h,r),values:r}))}; }
function val_(o,names){ for(const n of names) if(o[n]!==undefined && o[n]!==null && o[n]!=='') return o[n]; return ''; }
function token_(){ return Utilities.getUuid().replace(/-/g,''); }
function qr_(){ return 'LPAF-' + Utilities.getUuid().slice(0,8).toUpperCase(); }

function ensureParentSheet_(){
  const s=sh_(PARENTS_TAB,true);
  if(s.getMaxColumns()<PARENT_HEADERS.length) s.insertColumnsAfter(s.getMaxColumns(),PARENT_HEADERS.length-s.getMaxColumns());
  s.getRange(1,1,1,PARENT_HEADERS.length).setValues([PARENT_HEADERS]);
  s.setFrozenRows(1);
  return s;
}

function syncParentCheckIn_(){
  const children=table_(CHILDREN_TAB,false);
  const tickets=table_(TICKETS_TAB,false);
  if(!children.sheet) throw new Error('Child Registrations tab was not found.');
  if(!tickets.sheet) throw new Error('Event Tickets tab was not found.');

  const existing=table_(PARENTS_TAB,false);
  const prior={};
  existing.rows.forEach(r=>{ const p=normPhone_(r.obj.parent_phone); if(p) prior[p]=r.obj; });

  const ticketCounts={};
  tickets.rows.forEach(r=>{
    const email=normEmail_(val_(r.obj,['Buyer email','Attendee email']));
    if(email) ticketCounts[email]=(ticketCounts[email]||0)+1;
  });

  const groups={};
  children.rows.forEach(r=>{
    const phone=normPhone_(val_(r.obj,['Primary Phone Number']));
    if(!phone) return;
    const email=normEmail_(val_(r.obj,['Email Address']));
    const name=String(val_(r.obj,['Parent/Guardian Full Name'])).trim();
    const child=String(val_(r.obj,["Child's Full Name"])).trim();
    if(!groups[phone]) groups[phone]={phone,email,name,children:[]};
    if(child && !groups[phone].children.includes(child)) groups[phone].children.push(child);
  });

  const rows=Object.values(groups).map(g=>{
    const old=prior[g.phone]||{};
    const count=ticketCounts[g.email]||0;
    const registered=g.children.length;
    const available=Math.max(0,count-registered);
    let status='Confirmed';
    if(count===0) status='Waitlist Review';
    else if(registered>count) status='Partially Waitlisted';
    return {
      parent_token: old.parent_token || token_(), parent_phone:g.phone,
      parent_email:g.email, parent_name:g.name, ticket_count:count,
      registered_child_count:registered, available_ticket_count:available,
      registered_child_names:g.children.join(', '), registration_status:status,
      qr_id:old.qr_id || qr_(), precheck_status:old.precheck_status || '',
      precheck_time:old.precheck_time || '', checked_in:old.checked_in || '',
      checked_in_at:old.checked_in_at || '', checked_in_by:old.checked_in_by || '',
      sms_status:old.sms_status || 'Not Scheduled',
      twilio_message_sid:old.twilio_message_sid || '', last_synced_at:new Date(),
      branded_qr_code:''
    };
  });

  const s=ensureParentSheet_();
  if(s.getLastRow()>1) s.getRange(2,1,s.getLastRow()-1,PARENT_HEADERS.length).clearContent();
  if(rows.length) s.getRange(2,1,rows.length,PARENT_HEADERS.length).setValues(rows.map(o=>PARENT_HEADERS.map(h=>o[h]||'')));
  return {ok:true,parentCount:rows.length,qrIdsGenerated:rows.filter(r=>r.qr_id).length};
}

function findParent_(key){
  if(!key) throw new Error('Missing parent token or QR code.');
  let t=table_(PARENTS_TAB,false);
  if(!t.sheet || !t.rows.length){ syncParentCheckIn_(); t=table_(PARENTS_TAB,false); }
  const needle=String(key).trim();
  const row=t.rows.find(r=>String(r.obj.parent_token).trim()===needle || String(r.obj.qr_id).trim()===needle);
  if(!row) throw new Error('No matching family registration was found.');
  return {table:t,row};
}

function parentDto_(o){
  return {
    parentKey:String(o.parent_token||''), qrId:String(o.qr_id||''),
    parentName:String(o.parent_name||''), email:String(o.parent_email||''),
    phone:String(o.parent_phone||''), ticketCount:Number(o.ticket_count||0),
    registeredChildCount:Number(o.registered_child_count||0),
    availableTicketCount:Number(o.available_ticket_count||0),
    childNames:String(o.registered_child_names||''),
    registrationStatus:String(o.registration_status||''),
    addChildEligible:Number(o.available_ticket_count||0)>0,
    preCheckStatus:String(o.precheck_status||''), checkedIn:String(o.checked_in||''),
    checkedInAt:String(o.checked_in_at||'')
  };
}

function childrenForParent_(p){
  const t=table_(CHILDREN_TAB,false);
  return t.rows.filter(r=>{
    const phone=normPhone_(val_(r.obj,['Primary Phone Number']));
    const email=normEmail_(val_(r.obj,['Email Address']));
    return phone===normPhone_(p.phone) || (p.email && email===normEmail_(p.email));
  }).map(r=>({
    childKey:String(val_(r.obj,['child_key'])||r.rowNumber),
    name:String(val_(r.obj,["Child's Full Name"])),
    shirtSize:String(val_(r.obj,['T-Shirt Size'])),
    medicalInfo:String(val_(r.obj,['Medical Conditions, Allergies, or Special Needs'])),
    medications:String(val_(r.obj,['Current Medications']))
  }));
}

function lookupPass_(key){ const f=findParent_(key); const p=parentDto_(f.row.obj); return {ok:true,parent:p,children:childrenForParent_(p)}; }

function setParent_(found,values){
  const h=found.table.headers;
  Object.keys(values).forEach(name=>{ const i=h.indexOf(name); if(i<0) throw new Error('Missing Parent Check-In column: '+name); found.table.sheet.getRange(found.row.rowNumber,i+1).setValue(values[name]); });
}

function verify_(key){
  const f=findParent_(key); const p=parentDto_(f.row.obj);
  const id=p.qrId||qr_();
  setParent_(f,{qr_id:id,precheck_status:'Verified',precheck_time:new Date()});
  const fresh=findParent_(key); const dto=parentDto_(fresh.row.obj);
  return {ok:true,qrId:id,parent:dto,children:childrenForParent_(dto)};
}

function staffLookup_(code){ const f=findParent_(code); const p=parentDto_(f.row.obj); return {ok:true,parent:p,children:childrenForParent_(p)}; }

function completeCheckin_(code,device){
  const f=findParent_(code); const p=parentDto_(f.row.obj); const now=new Date();
  setParent_(f,{checked_in:'Yes',checked_in_at:now,checked_in_by:device||'At The Gate'});
  const log=sh_(SCAN_LOG_TAB,true);
  if(log.getLastRow()===0) log.appendRow(['timestamp','parent_token','qr_id','parent_name','child_names','device']);
  log.appendRow([now,p.parentKey,p.qrId||code,p.parentName,p.childNames,device||'']);
  const fresh=findParent_(p.parentKey); const dto=parentDto_(fresh.row.obj);
  return {ok:true,parent:dto,children:childrenForParent_(dto),checkedInAt:now.toLocaleString('en-US',{timeZone:'America/Chicago'})};
}

function setupCheckInSystem(){
  const result=syncParentCheckIn_();
  ss_().setSpreadsheetTimeZone('America/Chicago');
  return result;
}
