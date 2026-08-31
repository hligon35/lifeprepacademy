/**
 * Paducah GO Soccer - Registration Continuation / Reconciliation
 * Current-sheet focused build, 2026-08-28.
 *
 * This project does not replace the normal registration system. It identifies
 * unfinished/repeated attempts, lets the household confirm the participant(s)
 * and preferred contact, then returns the parent to the existing registration
 * wizard with one merged snapshot.
 */
const CONTINUE_CONFIG = Object.freeze({
  VERSION: '2026.08.28-current-sheet-v1',
  SPREADSHEET_ID: '1EIG6F00-mVhT9ws0nS3pJBrp9Y2mPH87p6UyLkWtKT4',

  PLAYERS_SHEET: 'Players',
  SCHOLARSHIPS_SHEET: 'Scholarships',
  VOLUNTEERS_SHEET: 'Volunteers',
  COACHES_SHEET: 'Coaches',
  CASES_SHEET: 'Registration Continuation Cases',
  AUDIT_SHEET: 'Registration Continuation Audit',

  REGISTRATION_URL: 'https://mlsregistration.lifeprepacademyfoundation.com/',
  // Paste this standalone continuation Apps Script Web App /exec URL after deployment.
  // Example: https://script.google.com/macros/s/DEPLOYMENT_ID/exec
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycby2-9Q062MruTN9fiemWUatxlmTKfk5OzYbAWrUD41rLkJGGODOJBrkR_6xbwi8xS64/exec',
  BANNER_URL: 'https://mlsregistration.lifeprepacademyfoundation.com/LPAFxPGS.PNG',
  TEST_EMAIL: 'hligon@getsparqd.com',
  SENDER_NAME: 'Paducah GO Soccer',
  REPLY_TO: 'youthprograms@lifeprepacademyfoundation.com',

  TOKEN_DAYS: 14,
  CONTACT_TOKEN_MINUTES: 30,
  RESUME_TOKEN_MINUTES: 180,
  CLUSTER_SCORE_THRESHOLD: 8,

  // These three Allen Treece / Maya Duwe attempts were explicitly identified
  // as form troubleshooting runs and must not participate in live correlation.
  EXCLUDED_REGISTRATION_IDS: Object.freeze([
    'reg_627bf137-c14f-4521-a50b-cf9cedd38bce',
    'reg_4c388644-0e35-49d8-ba77-1170f5bb3c69',
    'reg_4d203dbd-1ebf-43ab-aee6-5ad0020d7790',
  ]),
});

const CONTINUE_PROPERTY_KEYS = Object.freeze({
  TOKEN_SECRET: 'CONTINUE_TOKEN_SECRET',
  WORKER_SHARED_SECRET: 'CONTINUE_WORKER_SHARED_SECRET',
  WEB_APP_URL: 'CONTINUE_WEB_APP_URL',
});

const CONTINUE_CASE_HEADERS = Object.freeze([
  'case_id',
  'cluster_key',
  'case_version',
  'created_at',
  'updated_at',
  'status',
  'member_registration_ids',
  'candidate_child_names',
  'candidate_child_keys',
  'recipient_emails',
  'recommended_canonical_registration_id',
  'manual_review_reasons',
  'test_reviewed_at',
  'email_sent_at',
  'email_recipients_sent',
  'email_send_errors',
  'link_opened_at',
  'claim_completed_at',
  'claimed_child_keys',
  'released_child_keys',
  'duplicate_child_keys',
  'uncertain_child_keys',
  'selected_primary_email',
  'selected_primary_name',
  'resume_token_id',
  'completion_locked_at',
  'completion_owner_token_id',
  'completion_owner_registration_id',
  'continuation_completed_at',
  'canonical_registration_id',
  'superseded_registration_ids',
  'notes',
]);

const CONTINUE_AUDIT_HEADERS = Object.freeze([
  'timestamp',
  'case_id',
  'event',
  'registration_id',
  'row_number',
  'email',
  'details',
  'test_mode',
]);

const CONTINUE_PLAYER_TRACKING_HEADERS = Object.freeze([
  'Continuation Case ID',
  'Continuation Status',
  'Continuation Sent At',
  'Continuation Opened At',
  'Continuation Claimed At',
  'Continuation Completed At',
  'Canonical Registration ID',
  'Superseded By Registration ID',
  'Duplicate Resolution Status',
  'Continuation Review Note',
]);

/**
 * Safe/idempotent setup. Existing secrets are never replaced.
 */
function CONTINUE_setup() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty(CONTINUE_PROPERTY_KEYS.TOKEN_SECRET)) {
    props.setProperty(
      CONTINUE_PROPERTY_KEYS.TOKEN_SECRET,
      Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid()
    );
  }
  if (!props.getProperty(CONTINUE_PROPERTY_KEYS.WORKER_SHARED_SECRET)) {
    props.setProperty(
      CONTINUE_PROPERTY_KEYS.WORKER_SHARED_SECRET,
      Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid()
    );
  }

  const ss = SpreadsheetApp.openById(CONTINUE_CONFIG.SPREADSHEET_ID);
  const cases = getOrCreateSheet_(ss, CONTINUE_CONFIG.CASES_SHEET);
  const audit = getOrCreateSheet_(ss, CONTINUE_CONFIG.AUDIT_SHEET);
  ensureHeaders_(cases, CONTINUE_CASE_HEADERS);
  ensureHeaders_(audit, CONTINUE_AUDIT_HEADERS);

  const players = requireSheet_(ss, CONTINUE_CONFIG.PLAYERS_SHEET);
  ensureHeaders_(players, CONTINUE_PLAYER_TRACKING_HEADERS);

  return {
    ok: true,
    version: CONTINUE_CONFIG.VERSION,
    webAppUrl: getWebAppUrl_(),
    casesSheet: CONTINUE_CONFIG.CASES_SHEET,
    auditSheet: CONTINUE_CONFIG.AUDIT_SHEET,
  };
}

function CONTINUE_getWorkerSharedSecret() {
  assertSetup_();
  return PropertiesService.getScriptProperties()
    .getProperty(CONTINUE_PROPERTY_KEYS.WORKER_SHARED_SECRET);
}

function CONTINUE_setWebAppUrl(url) {
  const value = String(url || CONTINUE_CONFIG.WEB_APP_URL || '').trim();
  if (!/^https:\/\/script\.google\.com\/(?:a\/[^/]+\/)?macros\/s\/[^/]+\/exec$/i.test(value)) {
    throw new Error('Enter the deployed Apps Script Web App URL ending in /exec.');
  }
  PropertiesService.getScriptProperties().setProperty(CONTINUE_PROPERTY_KEYS.WEB_APP_URL, value);
  return value;
}

function CONTINUE_getWebAppUrl() {
  return getWebAppUrl_();
}
