/**
 * ============================================================
 * MLS GO REGISTRATION
 * 00_Config.gs
 * ============================================================
 *
 * Central configuration only.
 *
 * Do not place business logic in this file.
 * Do not duplicate these constants in other .gs files.
 */


/* ============================================================
 * CORE APPLICATION
 * ============================================================
 */

const MLSGO_CONFIG = Object.freeze({
  VERSION: '2026.08.modular-v1',

  SHEET_ID: '1EIG6F00-mVhT9ws0nS3pJBrp9Y2mPH87p6UyLkWtKT4',

  APP_ORIGIN:
    'https://mlsregistration.lifeprepacademyfoundation.com',

  SIGN_AGREEMENT_URL:
    'https://mlsregistration.lifeprepacademyfoundation.com/api/sign-agreement',

  PPF_RENDER_URL:
    'https://mlsregistration.lifeprepacademyfoundation.com/api/forms/ppf-pdf',

  PPF_FORM_URL:
    'https://mlsregistration.lifeprepacademyfoundation.com/documents/PPF%20Liability%20Form.pdf',

  AGREEMENT_CONSENT_VERSION:
    'v1-2026-08-06',

  LOCK_TIMEOUT_MS: 10000,

  MAX_PLAYERS: 4,
});


/* ============================================================
 * SCRIPT PROPERTIES
 * ============================================================
 */

const MLSGO_PROPERTY_KEYS = Object.freeze({
  AGREEMENT_UPDATE_TOKEN: 'AGREEMENT_UPDATE_TOKEN',
  SCHOLARSHIP_LIVE_WEBHOOK_TOKEN: 'SCHOLARSHIP_LIVE_WEBHOOK_TOKEN',
  EMAIL_TRACKING_BASE_URL: 'EMAIL_TRACKING_BASE_URL',
});


/* ============================================================
 * SHEETS
 * ============================================================
 */

const SHEET_NAMES = Object.freeze({
  PLAYERS: 'Players',
  VOLUNTEERS: 'Volunteers',
  COACHES: 'Coaches',
  SCHOLARSHIPS: 'Scholarships',
  ERRORS: 'Errors',
  EMAIL_TRACKING: 'Email Tracking',
  EMAIL_TRACKING_STATE: 'Email Tracking State',
});


/* ============================================================
 * DRIVE ARCHIVE FOLDERS
 * ============================================================
 */

const AGREEMENT_ARCHIVE_FOLDERS = Object.freeze({
  PLAYER: '1I5xbI9sihz7ALY78ul_SBjf-g-iJYZSA',
  PPF: '1gSkERsjVdSPtZTHArpRcHF9ixtosnc0h',
  VOLUNTEER: '1yV4m6ASbxAVtia7zi5A5uL1sx5N53cwC',
});


/* ============================================================
 * BRAND / EMAIL CONFIG
 * ============================================================
 */

const EMAIL_CONFIG = Object.freeze({
  BRAND_URL:
    'https://www.lifeprepacademyfoundation.com/',

  HEADER_IMAGE:
    'https://mlsregistration.lifeprepacademyfoundation.com/LPAFxPGS.PNG',

  FOOTER_IMAGE:
    'https://mlsregistration.lifeprepacademyfoundation.com/MLSGO_26_Email_Footer_2.jpg',

  HEADER_LINK:
    'https://lifeprepacademyfoundation.com',

  FOOTER_LINK:
    'https://lifeprepacademyfoundation.com/mls-go.html',

  SENDER_ALIAS:
    'youthprograms@lifeprepacademyfoundation.com',

  REPLY_TO:
    'info@lifeprepacademyfoundation.com',

  SENDER_NAME:
    'LifePrep Academy Foundation',

  INTERNAL_RECIPIENTS:
    'hligon@getsparqd.com,bhall@lifeprepacademyfoundation.com',

  TEST_RECIPIENT:
    'hligon@getsparqd.com',
});


/* ============================================================
 * DIVISIONS
 * ============================================================
 */

const DIVISION_IDS = Object.freeze({
  SECOND_THIRD_BOYS: 'PGS-23B',
  SECOND_THIRD_GIRLS: 'PGS-23G',
  FOURTH_FIFTH_BOYS: 'PGS-45B',
  FOURTH_FIFTH_GIRLS: 'PGS-45G',
});


/* ============================================================
 * AGREEMENT COLUMNS
 * ============================================================
 */

const PLAYER_AGREEMENT_COLUMNS = Object.freeze([
  'Player Agreement Status',
  'Player Agreement Version',
  'Player Agreement Signed At',
  'Player Agreement Signer Name',
  'Player Agreement File ID',
  'Player Agreement PDF URL',
  'Player Agreement SHA-256',
  'Player Agreement Transaction ID',
]);


const VOLUNTEER_AGREEMENT_COLUMNS = Object.freeze([
  'Volunteer Agreement Status',
  'Volunteer Agreement Version',
  'Volunteer Agreement Signed At',
  'Volunteer Agreement Signer Name',
  'Volunteer Agreement File ID',
  'Volunteer Agreement PDF URL',
  'Volunteer Agreement SHA-256',
  'Volunteer Agreement Transaction ID',
]);


/*
 * Expanded PPF metadata.
 *
 * The existing File ID and URL columns are preserved.
 * The additional fields give us proper retry / diagnostic state.
 */
const PPF_LIABILITY_COLUMNS = Object.freeze([
  'PPF Liability Status',
  'PPF Liability File ID',
  'PPF Liability PDF URL',
  'PPF Liability Generated At',
  'PPF Liability Transaction ID',
  'PPF Liability Error',
]);


/* ============================================================
 * PAYMENT COLUMNS
 * ============================================================
 */

const PLAYER_PAYMENT_COLUMNS = Object.freeze([
  'Player Payment Status',
  'Player Payment Amount',
  'Player Payment Currency',
  'Player Payment Paid At',
  'Player Payment Transaction ID',
  'Player Payment Receipt URL',
]);


/* ============================================================
 * PLAYER IDS
 * ============================================================
 */

const PLAYER_IDENTITY_COLUMNS = Object.freeze([
  'player_1_id',
  'player_1_division_id',
  'player_2_id',
  'player_2_division_id',
  'player_3_id',
  'player_3_division_id',
  'player_4_id',
  'player_4_division_id',
]);


/* ============================================================
 * PLAYER REGISTRATION HEADERS
 * ============================================================
 */

const PLAYER_HEADERS = Object.freeze([
  'submitted_at',
  'form_type',
  'registration_submission_id',
  'page_url',

  'parent_first_name',
  'parent_last_name',
  'parent_email',
  'parent_phone',
  'parent_street',
  'parent_apt',
  'parent_city',
  'parent_state',
  'parent_zip',
  'parent_guardian_dob',

  'emergency_same_as_parent',
  'emergency_first_name',
  'emergency_last_name',
  'emergency_relationship',
  'emergency_email',
  'emergency_phone',
  'emergency_street',
  'emergency_apt',
  'emergency_city',
  'emergency_state',
  'emergency_zip',

  'player_count',

  'player_1_first_name',
  'player_1_last_name',
  'player_1_dob',
  'player_1_gender',
  'player_1_grade',
  'player_1_jersey',
  'player_1_shorts',
  'player_1_socks',
  'player_1_race',
  'player_1_race_other',
  'player_1_favorite_club',
  'player_1_hear_about',
  'player_1_add_another',

  'player_2_first_name',
  'player_2_last_name',
  'player_2_dob',
  'player_2_gender',
  'player_2_grade',
  'player_2_jersey',
  'player_2_shorts',
  'player_2_socks',
  'player_2_race',
  'player_2_race_other',
  'player_2_favorite_club',
  'player_2_hear_about',
  'player_2_add_another',

  'player_3_first_name',
  'player_3_last_name',
  'player_3_dob',
  'player_3_gender',
  'player_3_grade',
  'player_3_jersey',
  'player_3_shorts',
  'player_3_socks',
  'player_3_race',
  'player_3_race_other',
  'player_3_favorite_club',
  'player_3_hear_about',
  'player_3_add_another',

  'player_4_first_name',
  'player_4_last_name',
  'player_4_dob',
  'player_4_gender',
  'player_4_grade',
  'player_4_jersey',
  'player_4_shorts',
  'player_4_socks',
  'player_4_race',
  'player_4_race_other',
  'player_4_favorite_club',
  'player_4_hear_about',

  'help_choice',
  'scholarship_requested',

  'agree_waiver',
  'agree_privacy',
  'agree_marketing',
  'signature',

  ...PLAYER_AGREEMENT_COLUMNS,
  ...PLAYER_PAYMENT_COLUMNS,
  ...PPF_LIABILITY_COLUMNS,
  ...PLAYER_IDENTITY_COLUMNS,
]);


/* ============================================================
 * VOLUNTEER HEADERS
 * ============================================================
 */

const VOLUNTEER_HEADERS = Object.freeze([
  'submittedAt',
  'form_type',
  'submission_id',
  'pageUrl',

  'firstName',
  'lastName',
  'email',
  'phone',
  'street',
  'apt',
  'city',
  'state',
  'zip',
  'dob',

  'roles',
  'hasExperience',
  'experienceSummary',
  'availabilityNotes',

  'agreement',
  'signature',
  'linkedParentEmail',

  ...VOLUNTEER_AGREEMENT_COLUMNS,
]);


/* ============================================================
 * COACH HEADERS
 * ============================================================
 */

const COACH_HEADERS = Object.freeze([
  'submittedAt',
  'form_type',
  'submission_id',
  'pageUrl',

  'firstName',
  'lastName',
  'email',
  'phone',
  'street',
  'apt',
  'city',
  'state',
  'zip',
  'dob',

  'roles',
  'hasExperience',
  'experienceSummary',
  'availabilityNotes',

  'agreement',
  'signature',
  'linkedParentEmail',

  'coachHasExperience',
  'coachExperienceSummary',
  'coachAvailability',

  'ref1Name',
  'ref1Relationship',
  'ref1Phone',
  'ref1Email',

  'coachCertifications',
  'coachBackgroundConsent',
  'coachSignature',

  ...VOLUNTEER_AGREEMENT_COLUMNS,
]);


/* ============================================================
 * SCHOLARSHIP HEADERS
 * ============================================================
 */

const SCHOLARSHIP_HEADERS = Object.freeze([
  'submitted_at',
  'form_type',
  'registration_submission_id',
  'page_url',

  'parent_first_name',
  'parent_last_name',
  'parent_email',
  'parent_phone',

  'scholarship_requested',
  'scholarship_level',
  'scholarship_household_size',
  'scholarship_household_income',
  'scholarship_eligibility',
  'scholarship_circumstances',
  'scholarship_contribution_amount',
  'scholarship_participation_commitment',
  'scholarship_parent_acknowledgement',
  'scholarship_guidelines_accepted',

  'participant_names',

  'Scholarship Document Status',
  'Scholarship Document File ID',
  'Scholarship Document PDF URL',
  'Scholarship Document Generated At',
  'Scholarship Document Error',
]);


/* ============================================================
 * ERROR / TRACKING HEADERS
 * ============================================================
 */

const ERROR_HEADERS = Object.freeze([
  'submitted_at',
  'form_type',
  'reason',
  'payload',
]);


const EMAIL_TRACKING_HEADERS = Object.freeze([
  'tracking_id',
  'event_type',
  'email_type',
  'submission_id',
  'recipient_email',
  'target_url',
  'link_label',
  'created_at',
  'user_agent',
  'ip_address',
  'source_url',
]);


/* ============================================================
 * TIMESTAMP FIELDS
 * ============================================================
 */

const SHEET_TIMESTAMP_FORMAT =
  'M/d/yyyy h:mm:ss a';


const TIMESTAMP_HEADERS = Object.freeze([
  'submitted_at',
  'submittedAt',

  'Player Agreement Signed At',
  'Volunteer Agreement Signed At',

  'PPF Liability Generated At',
  'Scholarship Document Generated At',

  'Player Payment Paid At',
]);


/* ============================================================
 * FORM CONFIGURATION
 * ============================================================
 */

const FORM_CONFIG = Object.freeze({
  mls_registration: Object.freeze({
    sheetName: SHEET_NAMES.PLAYERS,
    headers: PLAYER_HEADERS,
    idColumn: 'registration_submission_id',
  }),

  scholarship_application: Object.freeze({
    sheetName: SHEET_NAMES.SCHOLARSHIPS,
    headers: SCHOLARSHIP_HEADERS,
    idColumn: 'registration_submission_id',
  }),

  volunteer_application: Object.freeze({
    sheetName: SHEET_NAMES.VOLUNTEERS,
    headers: VOLUNTEER_HEADERS,
    idColumn: 'submission_id',
  }),

  coaching_application: Object.freeze({
    sheetName: SHEET_NAMES.COACHES,
    headers: COACH_HEADERS,
    idColumn: 'submission_id',
  }),
});


/* ============================================================
 * SYSTEM-MANAGED COLUMNS
 *
 * Browser/client form upserts must NEVER overwrite these.
 * ============================================================
 */

const SYSTEM_MANAGED_COLUMNS = Object.freeze({
  mls_registration: Object.freeze([
    ...PLAYER_AGREEMENT_COLUMNS,
    ...PLAYER_PAYMENT_COLUMNS,
    ...PPF_LIABILITY_COLUMNS,
    ...PLAYER_IDENTITY_COLUMNS,
  ]),

  volunteer_application: Object.freeze([
    ...VOLUNTEER_AGREEMENT_COLUMNS,
  ]),

  coaching_application: Object.freeze([
    ...VOLUNTEER_AGREEMENT_COLUMNS,
  ]),

  scholarship_application: Object.freeze([
    'Scholarship Document Status',
    'Scholarship Document File ID',
    'Scholarship Document PDF URL',
    'Scholarship Document Generated At',
    'Scholarship Document Error',
  ]),
});


/* ============================================================
 * SCHOLARSHIP AUTOMATION
 * ============================================================
 */

const SCHOLARSHIP_LIVE_AUTOMATION = Object.freeze({
  WEB_APP_URL:
    'https://script.google.com/macros/s/AKfycbwgDHY1w9kK9skUDwQy0494Wq2vZK10ALhkID0puZyRYJiVlV8GiXj1JisIRhO8yICLWg/exec',

  ACTION:
    'archive_live_scholarship_application',

  TOKEN_PROPERTY:
    MLSGO_PROPERTY_KEYS.SCHOLARSHIP_LIVE_WEBHOOK_TOKEN,
});