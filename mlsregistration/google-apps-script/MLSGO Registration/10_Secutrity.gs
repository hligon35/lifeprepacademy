/**
 * ============================================================
 * MLS GO REGISTRATION
 * 10_Security.gs
 * ============================================================
 *
 * Handles:
 * - Worker -> Apps Script authentication
 * - safe token comparison
 * - redaction of secrets / sensitive values before logging
 * - URL/domain validation helpers
 *
 * IMPORTANT:
 * The Worker must send AGREEMENT_UPDATE_TOKEN on every
 * server-to-server request handled by 01_Router.gs.
 */


/* ============================================================
 * WORKER AUTHENTICATION
 * ============================================================
 */

function isAuthorizedWorkerRequest_(values) {
  const expected = normalizeValue_(
    PropertiesService
      .getScriptProperties()
      .getProperty(
        MLSGO_PROPERTY_KEYS.AGREEMENT_UPDATE_TOKEN
      )
  );

  if (!expected) {
    safeWriteError_(
      'security',
      'Missing AGREEMENT_UPDATE_TOKEN Script Property',
      {}
    );

    return false;
  }

  const provided = normalizeValue_(
    values &&
    (
      values.update_token ||
      values.token ||
      values.agreement_update_token ||
      values.authorization_token
    )
  );

  if (!provided) {
    return false;
  }

  return constantTimeStringEquals_(
    expected,
    provided
  );
}


/**
 * Avoid direct short-circuit string comparison for secrets.
 *
 * Apps Script is not a cryptographic environment, but this avoids
 * the most obvious timing leak pattern.
 */
function constantTimeStringEquals_(a, b) {
  const left = String(a || '');
  const right = String(b || '');

  let mismatch =
    left.length ^ right.length;

  const maxLength =
    Math.max(
      left.length,
      right.length
    );

  for (
    let i = 0;
    i < maxLength;
    i += 1
  ) {
    const leftCode =
      i < left.length
        ? left.charCodeAt(i)
        : 0;

    const rightCode =
      i < right.length
        ? right.charCodeAt(i)
        : 0;

    mismatch |= (
      leftCode ^ rightCode
    );
  }

  return mismatch === 0;
}


/* ============================================================
 * SAFE / REDACTED LOGGING PAYLOADS
 * ============================================================
 */

const SENSITIVE_LOG_KEYS_ = Object.freeze([
  'update_token',
  'token',
  'agreement_update_token',
  'authorization',
  'authorization_token',
  'webhook_token',
  'password',
  'secret',
  'api_key',
  'apikey',
  'signature',
  'coachSignature',
  'coach_signature',
]);


const PARTIALLY_REDACTED_LOG_KEYS_ = Object.freeze([
  'parent_email',
  'email',
  'recipient_email',
  'ref1Email',
  'ref1_email',
  'parent_phone',
  'phone',
  'emergency_phone',
  'ref1Phone',
  'ref1_phone',
]);


const OMITTED_PII_LOG_KEYS_ = Object.freeze([
  'parent_guardian_dob',
  'dob',
  'date_of_birth',

  'parent_street',
  'parent_apt',
  'parent_city',
  'parent_state',
  'parent_zip',

  'emergency_street',
  'emergency_apt',
  'emergency_city',
  'emergency_state',
  'emergency_zip',

  'street',
  'apt',
  'city',
  'state',
  'zip',

  'scholarship_household_income',
  'scholarship_circumstances',
]);


function redactLogPayload_(payload) {
  if (
    payload === null ||
    payload === undefined
  ) {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.map(
      function(item) {
        return redactLogPayload_(
          item
        );
      }
    );
  }

  if (
    typeof payload !== 'object'
  ) {
    return payload;
  }

  const out = {};

  Object.keys(payload)
    .forEach(
      function(key) {
        const normalizedKey =
          String(key || '')
            .trim()
            .toLowerCase();

        if (
          keyMatchesAny_(
            normalizedKey,
            SENSITIVE_LOG_KEYS_
          )
        ) {
          out[key] = '[REDACTED]';
          return;
        }

        if (
          keyMatchesAny_(
            normalizedKey,
            OMITTED_PII_LOG_KEYS_
          )
        ) {
          out[key] = '[OMITTED]';
          return;
        }

        if (
          keyMatchesAny_(
            normalizedKey,
            PARTIALLY_REDACTED_LOG_KEYS_
          )
        ) {
          out[key] =
            partiallyRedactValue_(
              payload[key]
            );
          return;
        }

        out[key] =
          redactLogPayload_(
            payload[key]
          );
      }
    );

  return out;
}


function keyMatchesAny_(
  normalizedKey,
  keys
) {
  return (
    (keys || [])
      .some(
        function(candidate) {
          return (
            normalizedKey ===
            String(candidate)
              .trim()
              .toLowerCase()
          );
        }
      )
  );
}


function partiallyRedactValue_(value) {
  const normalized =
    normalizeValue_(value);

  if (!normalized) {
    return '';
  }

  if (
    normalized.indexOf('@') >= 0
  ) {
    const parts =
      normalized.split('@');

    const local =
      parts[0] || '';

    const domain =
      parts.slice(1).join('@');

    const localMasked =
      local.length <= 2
        ? local.charAt(0) + '*'
        : local.charAt(0) +
          '***' +
          local.charAt(
            local.length - 1
          );

    return (
      localMasked +
      '@' +
      domain
    );
  }

  const digits =
    normalized.replace(
      /\D/g,
      ''
    );

  if (digits.length >= 4) {
    return (
      '***-***-' +
      digits.slice(-4)
    );
  }

  return '[REDACTED]';
}


/* ============================================================
 * URL VALIDATION
 * ============================================================
 */

function isHttpsUrl_(value) {
  return /^https:\/\//i
    .test(
      normalizeValue_(value)
    );
}


function getUrlHost_(value) {
  const normalized =
    normalizeValue_(value);

  if (!isHttpsUrl_(normalized)) {
    return '';
  }

  try {
    return normalized
      .replace(
        /^https:\/\//i,
        ''
      )
      .split('/')[0]
      .split(':')[0]
      .toLowerCase();

  } catch (_error) {
    return '';
  }
}


function isAllowedFirstPartyUrl_(value) {
  const host =
    getUrlHost_(value);

  return (
    host ===
      'lifeprepacademyfoundation.com' ||
    host ===
      'www.lifeprepacademyfoundation.com' ||
    host ===
      'mlsregistration.lifeprepacademyfoundation.com'
  );
}


/* ============================================================
 * TEST
 * ============================================================
 */

function TEST_securityConfiguration() {
  const props =
    PropertiesService
      .getScriptProperties();

  const hasWorkerToken =
    Boolean(
      normalizeValue_(
        props.getProperty(
          MLSGO_PROPERTY_KEYS.AGREEMENT_UPDATE_TOKEN
        )
      )
    );

  const hasScholarshipToken =
    Boolean(
      normalizeValue_(
        props.getProperty(
          MLSGO_PROPERTY_KEYS.SCHOLARSHIP_LIVE_WEBHOOK_TOKEN
        )
      )
    );

  const result = {
    ok:
      hasWorkerToken &&
      hasScholarshipToken,

    agreementUpdateTokenConfigured:
      hasWorkerToken,

    scholarshipWebhookTokenConfigured:
      hasScholarshipToken,

    emailTrackingBaseUrl:
      normalizeValue_(
        props.getProperty(
          MLSGO_PROPERTY_KEYS.EMAIL_TRACKING_BASE_URL
        )
      ) ||
      normalizeValue_(
        ScriptApp
          .getService()
          .getUrl()
      ),
  };

  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}
