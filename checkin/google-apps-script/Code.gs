const SHEET_ID = '16xbM_ZXe4mEdfjABwPVfc6HqWhn-iW9DumoFfaQ9JTQ';
const CHILDREN_TAB = 'Child Registrations';
const TICKETS_TAB = 'Event Tickets';
const PARENTS_TAB = 'Parent Check-In';
const SCAN_LOG_TAB = 'Scan Log';
const WAITLIST_TAB = 'Waitlist';
const EVENT_TIME_ZONE = 'America/Chicago';
const FAMILY_CACHE_KEY = 'family_directory_v3';
const FAMILY_CACHE_SECONDS = 21600;

const PARENT_HEADERS = [
  'parent_token','parent_phone','parent_email','parent_name','ticket_count',
  'registered_child_count','available_ticket_count','registered_child_names',
  'registration_status','qr_id','precheck_status','precheck_time','checked_in',
  'checked_in_at','checked_in_by','email_status','sendgrid_message_id',
  'email_sent_at','last_synced_at','fast_pass_url','branded_qr_code'
];

function doGet(e) {
  const p = e && e.parameter ? e.parameter : {};
  const callback = String(p.callback || 'callback').replace(/[^a-zA-Z0-9_$]/g, '');
  let payload;
  try {
    payload = p.action ? handleAction_(p.action, p) : { ok: true, message: 'Check-in web app is running.' };
  } catch (err) {
    payload = { ok: false, error: err.message || String(err) };
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
  if (action === 'warmup') return warmup_();
  throw new Error('Unknown action: ' + action);
}
