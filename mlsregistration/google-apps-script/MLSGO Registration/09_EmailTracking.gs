/**
 * ============================================================
 * MLS GO REGISTRATION
 * 09_EmailTracking.gs
 * ============================================================
 *
 * Handles:
 * - email sent/open/click events
 * - opaque tracking tokens
 * - signed tracking URLs
 * - duplicate-send claims
 * - sheet-backed tracking state (instead of dynamic Script Properties)
 *
 * Runtime state is stored in the "Email Tracking State" sheet.
 * Script Properties remain reserved for true configuration/secrets.
 *
 * Security improvement:
 * recipient email and destination URLs are NOT placed directly
 * into externally visible tracking URLs.
 */


/* ============================================================
 * EMAIL TRACKING STATE SHEET
 * ============================================================
 */

const EMAIL_TRACKING_STATE_HEADERS = Object.freeze([
  'state_type',
  'state_key',
  'status',
  'email_type',
  'submission_id',
  'recipient_email',
  'tracking_token',
  'context_json',
  'created_at',
  'updated_at',
  'legacy_property_name',
]);


function getEmailTrackingStateSheetName_() {
  return (
    typeof SHEET_NAMES !== 'undefined' &&
    SHEET_NAMES &&
    SHEET_NAMES.EMAIL_TRACKING_STATE
  )
    ? SHEET_NAMES.EMAIL_TRACKING_STATE
    : 'Email Tracking State';
}


function getEmailTrackingStateSheet_() {
  const sheet =
    getSheet_(
      getEmailTrackingStateSheetName_()
    );

  ensureEmailTrackingStateHeaders_(
    sheet
  );

  return sheet;
}


function ensureEmailTrackingStateHeaders_(sheet) {
  const required =
    EMAIL_TRACKING_STATE_HEADERS.slice();

  const lastColumn =
    Math.max(
      sheet.getLastColumn(),
      required.length
    );

  const current =
    sheet
      .getRange(
        1,
        1,
        1,
        lastColumn
      )
      .getDisplayValues()[0]
      .map(function(value) {
        return normalizeValue_(value);
      });

  let changed = false;

  required.forEach(function(header, index) {
    if (
      normalizeValue_(
        current[index]
      ) !== header
    ) {
      sheet
        .getRange(
          1,
          index + 1
        )
        .setValue(header);

      changed = true;
    }
  });

  if (changed) {
    sheet
      .getRange(
        1,
        1,
        1,
        required.length
      )
      .setFontWeight('bold');
  }

  return required;
}


function emailTrackingStateHeaderMap_() {
  const map = {};

  EMAIL_TRACKING_STATE_HEADERS
    .forEach(function(header, index) {
      map[header] =
        index + 1;
    });

  return map;
}


function findEmailTrackingStateRowByKey_(
  sheet,
  stateKey
) {
  const normalizedKey =
    normalizeValue_(
      stateKey
    );

  if (!normalizedKey) {
    return 0;
  }

  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    return 0;
  }

  const map =
    emailTrackingStateHeaderMap_();

  const values =
    sheet
      .getRange(
        2,
        map.state_key,
        lastRow - 1,
        1
      )
      .getDisplayValues();

  for (
    let index = 0;
    index < values.length;
    index += 1
  ) {
    if (
      normalizeValue_(
        values[index][0]
      ) === normalizedKey
    ) {
      return index + 2;
    }
  }

  return 0;
}


function readEmailTrackingStateByKey_(
  stateKey
) {
  const sheet =
    getEmailTrackingStateSheet_();

  const row =
    findEmailTrackingStateRowByKey_(
      sheet,
      stateKey
    );

  if (row <= 0) {
    return null;
  }

  const values =
    sheet
      .getRange(
        row,
        1,
        1,
        EMAIL_TRACKING_STATE_HEADERS.length
      )
      .getValues()[0];

  const record = {};

  EMAIL_TRACKING_STATE_HEADERS
    .forEach(function(header, index) {
      record[header] =
        values[index];
    });

  record._row =
    row;

  return record;
}


function upsertEmailTrackingStateNoLock_(
  record
) {
  const sheet =
    getEmailTrackingStateSheet_();

  const stateKey =
    normalizeValue_(
      record &&
      record.state_key
    );

  if (!stateKey) {
    throw new Error(
      'Email tracking state_key is required.'
    );
  }

  const row =
    findEmailTrackingStateRowByKey_(
      sheet,
      stateKey
    );

  const now =
    new Date().toISOString();

  const existing =
    row > 0
      ? sheet
          .getRange(
            row,
            1,
            1,
            EMAIL_TRACKING_STATE_HEADERS.length
          )
          .getValues()[0]
      : [];

  const existingCreatedAt =
    row > 0
      ? normalizeValue_(
          existing[
            EMAIL_TRACKING_STATE_HEADERS
              .indexOf('created_at')
          ]
        )
      : '';

  const values =
    EMAIL_TRACKING_STATE_HEADERS
      .map(function(header) {
        if (
          header ===
          'created_at'
        ) {
          return (
            normalizeValue_(
              record[header]
            ) ||
            existingCreatedAt ||
            now
          );
        }

        if (
          header ===
          'updated_at'
        ) {
          return now;
        }

        return (
          record[header] ===
            undefined ||
          record[header] ===
            null
        )
          ? ''
          : record[header];
      });

  if (row > 0) {
    sheet
      .getRange(
        row,
        1,
        1,
        values.length
      )
      .setValues([
        values
      ]);

    return row;
  }

  sheet.appendRow(
    values
  );

  return sheet.getLastRow();
}


function deleteEmailTrackingStateByKeyNoLock_(
  stateKey
) {
  const sheet =
    getEmailTrackingStateSheet_();

  const row =
    findEmailTrackingStateRowByKey_(
      sheet,
      stateKey
    );

  if (row > 0) {
    sheet.deleteRow(row);
    return true;
  }

  return false;
}


/* ============================================================
 * EMAIL SEND IDEMPOTENCY
 * ============================================================
 */

function buildEmailIdempotencyKey_(
  emailType,
  submissionId,
  recipientEmail
) {
  return [
    'EMAILSEND',
    normalizeComparisonValue_(
      emailType
    ),
    normalizeComparisonValue_(
      submissionId
    ),
    normalizeComparisonValue_(
      recipientEmail
    ),
  ].join('|');
}


/**
 * Atomically reserves a send key.
 *
 * Script Properties are used because the reservation must survive
 * across executions. The lock is held only for this tiny operation.
 */
function emailClaimStateKey_(
  idempotencyKey
) {
  return (
    'EMAIL_CLAIM_' +
    hashTrackingValue_(
      idempotencyKey
    )
  );
}


function parseEmailIdempotencyKey_(
  idempotencyKey
) {
  const parts =
    String(
      idempotencyKey ||
      ''
    ).split('|');

  return {
    emailType:
      normalizeValue_(
        parts[1]
      ),
    submissionId:
      normalizeValue_(
        parts[2]
      ),
    recipientEmail:
      normalizeValue_(
        parts.slice(3).join('|')
      ),
  };
}


/**
 * Atomically reserves a send key in the Email Tracking State sheet.
 *
 * A legacy Script Property fallback is read during migration so previously
 * claimed/sent emails remain protected until migration is complete.
 */
function claimEmailSend_(
  idempotencyKey
) {
  return withScriptLock_(
    function() {
      const stateKey =
        emailClaimStateKey_(
          idempotencyKey
        );

      const existing =
        readEmailTrackingStateByKey_(
          stateKey
        );

      let existingState =
        existing
          ? normalizeValue_(
              existing.status
            )
          : '';

      /*
       * Migration-safe fallback:
       * read an existing legacy property if the sheet has not received it yet.
       */
      if (!existingState) {
        existingState =
          normalizeValue_(
            PropertiesService
              .getScriptProperties()
              .getProperty(
                stateKey
              )
          );
      }

      if (
        existingState === 'sent' ||
        existingState === 'sending'
      ) {
        return {
          claimed: false,
          state:
            existingState,
        };
      }

      const parts =
        parseEmailIdempotencyKey_(
          idempotencyKey
        );

      upsertEmailTrackingStateNoLock_({
        state_type:
          'CLAIM',
        state_key:
          stateKey,
        status:
          'sending',
        email_type:
          parts.emailType,
        submission_id:
          parts.submissionId,
        recipient_email:
          parts.recipientEmail,
        tracking_token:
          '',
        context_json:
          '',
        legacy_property_name:
          '',
      });

      return {
        claimed: true,
        state:
          'sending',
        propertyName:
          stateKey,
      };
    }
  );
}


function finalizeEmailSendClaim_(
  idempotencyKey,
  success
) {
  withScriptLock_(
    function() {
      const stateKey =
        emailClaimStateKey_(
          idempotencyKey
        );

      if (success) {
        const parts =
          parseEmailIdempotencyKey_(
            idempotencyKey
          );

        upsertEmailTrackingStateNoLock_({
          state_type:
            'CLAIM',
          state_key:
            stateKey,
          status:
            'sent',
          email_type:
            parts.emailType,
          submission_id:
            parts.submissionId,
          recipient_email:
            parts.recipientEmail,
          tracking_token:
            '',
          context_json:
            '',
          legacy_property_name:
            '',
        });
      } else {
        deleteEmailTrackingStateByKeyNoLock_(
          stateKey
        );
      }
    }
  );
}


/* ============================================================
 * TRACKING CONTEXT
 * ============================================================
 */

function createEmailTrackingContext_(
  payload,
  emailType
) {
  const submissionId =
    normalizeValue_(
      payload &&
      payload.submissionId
    );

  const recipientEmail =
    normalizeValue_(
      payload &&
      payload.parentEmail
    ).toLowerCase();

  const sourceUrl =
    normalizeValue_(
      payload &&
      payload.sourceUrl
    );

  const token =
    'trk_' +
    Utilities
      .getUuid()
      .replace(/-/g, '');

  const trackingBaseUrl =
    getEmailTrackingBaseUrl_(
      payload
    );

  /*
   * Store private tracking metadata server-side.
   */
  saveTrackingContext_(
    token,
    {
      emailType:
        emailType,
      submissionId:
        submissionId,
      recipientEmail:
        recipientEmail,
      sourceUrl:
        sourceUrl,
      createdAt:
        new Date().toISOString(),
      links: {},
    }
  );

  return {
    trackingToken:
      token,

    emailType:
      emailType,

    submissionId:
      submissionId,

    recipientEmail:
      recipientEmail,

    sourceUrl:
      sourceUrl,

    openUrl:
      buildOpaqueTrackingUrl_(
        trackingBaseUrl,
        token,
        'opened',
        ''
      ),

    makeTrackedUrl:
      function(targetUrl, linkLabel) {
        const linkId =
          'lnk_' +
          Utilities
            .getUuid()
            .replace(/-/g, '');

        addTrackingLink_(
          token,
          linkId,
          {
            url:
              normalizeValue_(
                targetUrl
              ),
            label:
              normalizeValue_(
                linkLabel
              ),
          }
        );

        return buildOpaqueTrackingUrl_(
          trackingBaseUrl,
          token,
          'clicked',
          linkId
        );
      },
  };
}


/* ============================================================
 * TRACKING REQUEST
 * ============================================================
 */

function handleEmailTrackingRequest_(e) {
  const params =
    e && e.parameter
      ? e.parameter
      : {};

  const token =
    normalizeValue_(
      params.token
    );

  const eventType =
    normalizeValue_(
      params.event ||
      'opened'
    );

  const linkId =
    normalizeValue_(
      params.link_id
    );

  if (!token) {
    return HtmlService
      .createHtmlOutput(
        '<p>Invalid tracking request.</p>'
      );
  }

  const context =
    loadTrackingContext_(
      token
    );

  if (!context) {
    return HtmlService
      .createHtmlOutput(
        '<p>Tracking request expired or invalid.</p>'
      );
  }

  let targetUrl = '';
  let linkLabel = '';

  if (
    eventType ===
    'clicked'
  ) {
    const link =
      context.links &&
      context.links[linkId]
        ? context.links[
            linkId
          ]
        : null;

    if (!link) {
      return HtmlService
        .createHtmlOutput(
          '<p>Invalid tracked link.</p>'
        );
    }

    targetUrl =
      normalizeValue_(
        link.url
      );

    linkLabel =
      normalizeValue_(
        link.label
      );

    if (
      !isAllowedTrackedDestination_(
        targetUrl
      )
    ) {
      safeWriteError_(
        'email_tracking',
        'Blocked unsafe tracked destination',
        {
          tracking_id:
            token,
          link_id:
            linkId,
        }
      );

      return HtmlService
        .createHtmlOutput(
          '<p>Tracked destination is not allowed.</p>'
        );
    }
  }

  try {
    recordEmailTrackingEvent_(
      token,
      eventType,
      context.emailType,
      context.submissionId,
      context.recipientEmail,
      targetUrl,
      linkLabel,
      e && e.headers
        ? e.headers
        : null,
      {
        source_url:
          context.sourceUrl,
      }
    );
  } catch (error) {
    safeWriteError_(
      'email_tracking',
      'Email tracking request failed',
      {
        tracking_id:
          token,
        event_type:
          eventType,
        error:
          errorMessage_(error),
      }
    );
  }

  if (
    eventType ===
    'clicked' &&
    targetUrl
  ) {
    return HtmlService
      .createHtmlOutput(
        '<!doctype html><html><head>' +
        '<meta http-equiv="refresh" content="0;url=' +
        escapeHtml_(
          targetUrl
        ) +
        '">' +
        '</head><body>Redirecting...</body></html>'
      );
  }

  const pixel =
    Utilities.base64Decode(
      'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
    );

  return Utilities.newBlob(
    pixel,
    'image/gif',
    'pixel.gif'
  );
}


/* ============================================================
 * TRACKING URL
 * ============================================================
 */

function getEmailTrackingBaseUrl_(payload) {
  const configured =
    normalizeValue_(
      payload &&
      payload.trackingBaseUrl
    );

  if (
    isUsableTrackingBaseUrl_(
      configured
    )
  ) {
    return configured;
  }

  const scriptProperty =
    normalizeValue_(
      PropertiesService
        .getScriptProperties()
        .getProperty(
          MLSGO_PROPERTY_KEYS.EMAIL_TRACKING_BASE_URL
        )
    );

  if (
    isUsableTrackingBaseUrl_(
      scriptProperty
    )
  ) {
    return scriptProperty;
  }

  const serviceUrl =
    normalizeValue_(
      ScriptApp
        .getService()
        .getUrl()
    );

  return isUsableTrackingBaseUrl_(
    serviceUrl
  )
    ? serviceUrl
    : '';
}


function isUsableTrackingBaseUrl_(value) {
  const normalized =
    normalizeValue_(value);

  if (!normalized) {
    return false;
  }

  if (
    !/^https?:\/\//i
      .test(normalized)
  ) {
    return false;
  }

  if (
    /\/unknown\/exec(?:\?|$)/i
      .test(normalized)
  ) {
    return false;
  }

  return true;
}


function buildOpaqueTrackingUrl_(
  baseUrl,
  token,
  eventType,
  linkId
) {
  if (!baseUrl) {
    return '';
  }

  const params = [
    ['action', 'track_email'],
    ['token', token],
    ['event', eventType],
  ];

  if (linkId) {
    params.push(
      ['link_id', linkId]
    );
  }

  const query =
    params
      .map(
        function(entry) {
          return (
            encodeURIComponent(
              entry[0]
            ) +
            '=' +
            encodeURIComponent(
              entry[1]
            )
          );
        }
      )
      .join('&');

  return (
    baseUrl +
    (
      baseUrl.indexOf('?') >= 0
        ? '&'
        : '?'
    ) +
    query
  );
}


/* ============================================================
 * TRACKING CONTEXT STORAGE
 * ============================================================
 */

function trackingPropertyName_(
  token
) {
  return (
    'TRACKCTX_' +
    hashTrackingValue_(
      token
    )
  );
}


function saveTrackingContext_(
  token,
  context
) {
  withScriptLock_(
    function() {
      saveTrackingContextNoLock_(
        token,
        context
      );
    }
  );
}


function saveTrackingContextNoLock_(
  token,
  context
) {
  const normalizedToken =
    normalizeValue_(
      token
    );

  if (!normalizedToken) {
    throw new Error(
      'Tracking token is required.'
    );
  }

  const safeContext =
    context &&
    typeof context === 'object'
      ? context
      : {};

  upsertEmailTrackingStateNoLock_({
    state_type:
      'CONTEXT',
    state_key:
      trackingPropertyName_(
        normalizedToken
      ),
    status:
      'active',
    email_type:
      normalizeValue_(
        safeContext.emailType
      ),
    submission_id:
      normalizeValue_(
        safeContext.submissionId
      ),
    recipient_email:
      normalizeValue_(
        safeContext.recipientEmail
      ).toLowerCase(),
    tracking_token:
      normalizedToken,
    context_json:
      JSON.stringify(
        safeContext
      ),
    created_at:
      normalizeValue_(
        safeContext.createdAt
      ),
    legacy_property_name:
      '',
  });
}


function loadTrackingContext_(
  token
) {
  const stateKey =
    trackingPropertyName_(
      token
    );

  const record =
    readEmailTrackingStateByKey_(
      stateKey
    );

  if (
    record &&
    normalizeValue_(
      record.context_json
    )
  ) {
    try {
      return JSON.parse(
        record.context_json
      );
    } catch (_error) {
      return null;
    }
  }

  /*
   * Migration-safe fallback for tracking links sent before the sheet-backed
   * version was deployed.
   */
  const legacyRaw =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        stateKey
      );

  if (!legacyRaw) {
    return null;
  }

  try {
    return JSON.parse(
      legacyRaw
    );
  } catch (_error) {
    return null;
  }
}


function addTrackingLink_(
  token,
  linkId,
  link
) {
  withScriptLock_(
    function() {
      const context =
        loadTrackingContext_(
          token
        );

      if (!context) {
        throw new Error(
          'Tracking context not found.'
        );
      }

      if (!context.links) {
        context.links = {};
      }

      context.links[
        linkId
      ] = {
        url:
          normalizeValue_(
            link &&
            link.url
          ),
        label:
          normalizeValue_(
            link &&
            link.label
          ),
      };

      saveTrackingContextNoLock_(
        token,
        context
      );
    }
  );
}


/* ============================================================
 * ONE-TIME LEGACY PROPERTY MIGRATION
 * ============================================================
 */

/**
 * Run this ONCE manually after replacing 09_EmailTracking.gs.
 *
 * It migrates only:
 * - EMAIL_CLAIM_*
 * - TRACKCTX_*
 *
 * Successfully verified entries are deleted from Script Properties.
 * Configuration/secrets such as AGREEMENT_UPDATE_TOKEN,
 * EMAIL_TRACKING_BASE_URL, and SCHOLARSHIP_LIVE_WEBHOOK_TOKEN are untouched.
 */
function EMAILTRACKING_migratePropertiesToSheet() {
  return withScriptLock_(
    function() {
      const props =
        PropertiesService
          .getScriptProperties();

      const all =
        props.getProperties();

      const names =
        Object.keys(
          all
        ).filter(
          function(name) {
            return (
              name.indexOf(
                'EMAIL_CLAIM_'
              ) === 0 ||
              name.indexOf(
                'TRACKCTX_'
              ) === 0
            );
          }
        );

      const result = {
        found:
          names.length,
        migrated:
          0,
        deleted:
          0,
        failed:
          0,
        failures:
          [],
      };

      names.forEach(
        function(name) {
          try {
            const raw =
              all[name];

            let record;

            if (
              name.indexOf(
                'EMAIL_CLAIM_'
              ) === 0
            ) {
              record = {
                state_type:
                  'CLAIM',
                state_key:
                  name,
                status:
                  normalizeValue_(
                    raw
                  ),
                email_type:
                  '',
                submission_id:
                  '',
                recipient_email:
                  '',
                tracking_token:
                  '',
                context_json:
                  '',
                legacy_property_name:
                  name,
              };
            } else {
              let context = {};

              try {
                context =
                  JSON.parse(
                    raw || '{}'
                  );
              } catch (_error) {
                throw new Error(
                  'Invalid TRACKCTX JSON.'
                );
              }

              record = {
                state_type:
                  'CONTEXT',
                state_key:
                  name,
                status:
                  'active',
                email_type:
                  normalizeValue_(
                    context.emailType
                  ),
                submission_id:
                  normalizeValue_(
                    context.submissionId
                  ),
                recipient_email:
                  normalizeValue_(
                    context.recipientEmail
                  ).toLowerCase(),
                tracking_token:
                  '',
                context_json:
                  JSON.stringify(
                    context
                  ),
                created_at:
                  normalizeValue_(
                    context.createdAt
                  ),
                legacy_property_name:
                  name,
              };
            }

            upsertEmailTrackingStateNoLock_(
              record
            );

            SpreadsheetApp.flush();

            const verify =
              readEmailTrackingStateByKey_(
                name
              );

            if (!verify) {
              throw new Error(
                'State row verification failed.'
              );
            }

            if (
              record.state_type ===
                'CONTEXT' &&
              normalizeValue_(
                verify.context_json
              ) !==
                normalizeValue_(
                  record.context_json
                )
            ) {
              throw new Error(
                'Tracking context verification failed.'
              );
            }

            if (
              record.state_type ===
                'CLAIM' &&
              normalizeValue_(
                verify.status
              ) !==
                normalizeValue_(
                  record.status
                )
            ) {
              throw new Error(
                'Email claim verification failed.'
              );
            }

            result.migrated++;

            props.deleteProperty(
              name
            );

            result.deleted++;
          } catch (error) {
            result.failed++;

            result.failures.push({
              property:
                name,
              error:
                String(
                  error &&
                  error.message
                    ? error.message
                    : error
                ),
            });
          }
        }
      );

      return result;
    }
  );
}


/* ============================================================
 * DESTINATION ALLOWLIST
 * ============================================================
 */

function isAllowedTrackedDestination_(value) {
  const normalized =
    normalizeValue_(value);

  if (
    !/^https:\/\//i
      .test(normalized)
  ) {
    return false;
  }

  try {
    const host =
      normalized
        .replace(
          /^https:\/\//i,
          ''
        )
        .split('/')[0]
        .split(':')[0]
        .toLowerCase();

    /*
     * First-party + Google Drive document links.
     *
     * Additional payment domains can be added in 00_Config.gs
     * once the exact production checkout host is confirmed.
     */
    return (
      host ===
        'lifeprepacademyfoundation.com' ||
      host ===
        'www.lifeprepacademyfoundation.com' ||
      host ===
        'mlsregistration.lifeprepacademyfoundation.com' ||
      host ===
        'drive.google.com' ||
      host ===
        'docs.google.com'
    );

  } catch (_error) {
    return false;
  }
}


/* ============================================================
 * RECORD TRACKING EVENTS
 * ============================================================
 */

function recordEmailTrackingEvent_(
  trackingId,
  eventType,
  emailType,
  submissionId,
  recipientEmail,
  targetUrl,
  linkLabel,
  headers,
  params
) {
  withScriptLock_(
    function() {
      const sheet =
        getSheet_(
          SHEET_NAMES.EMAIL_TRACKING
        );

      const actualHeaders =
        ensureHeadersByName_(
          sheet,
          EMAIL_TRACKING_HEADERS
        );

      const userAgent =
        headers &&
        headers['user-agent']
          ? String(
              headers['user-agent']
            )
          : '';

      const ipAddress =
        headers &&
        headers['x-forwarded-for']
          ? String(
              headers[
                'x-forwarded-for'
              ]
            )
              .split(',')[0]
              .trim()
          : '';

      const record = {};

      setRecordValueByHeader_(
        record,
        'tracking_id',
        trackingId || ''
      );

      setRecordValueByHeader_(
        record,
        'event_type',
        eventType || ''
      );

      setRecordValueByHeader_(
        record,
        'email_type',
        emailType || ''
      );

      setRecordValueByHeader_(
        record,
        'submission_id',
        submissionId || ''
      );

      setRecordValueByHeader_(
        record,
        'recipient_email',
        recipientEmail || ''
      );

      setRecordValueByHeader_(
        record,
        'target_url',
        targetUrl || ''
      );

      setRecordValueByHeader_(
        record,
        'link_label',
        linkLabel || ''
      );

      setRecordValueByHeader_(
        record,
        'created_at',
        new Date().toISOString()
      );

      setRecordValueByHeader_(
        record,
        'user_agent',
        userAgent
      );

      setRecordValueByHeader_(
        record,
        'ip_address',
        ipAddress
      );

      setRecordValueByHeader_(
        record,
        'source_url',
        normalizeValue_(
          params &&
          params.source_url
        )
      );

      appendRecord_(
        sheet,
        actualHeaders,
        record
      );
    }
  );
}


function recordEmailSentEvent_(
  trackingContext
) {
  recordEmailTrackingEvent_(
    trackingContext.trackingToken,
    'sent',
    trackingContext.emailType,
    trackingContext.submissionId,
    trackingContext.recipientEmail,
    '',
    '',
    null,
    {
      source_url:
        trackingContext.sourceUrl ||
        '',
    }
  );
}


/* ============================================================
 * HASH
 * ============================================================
 */

function hashTrackingValue_(value) {
  const bytes =
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      String(value || ''),
      Utilities.Charset.UTF_8
    );

  return bytes
    .map(
      function(byte) {
        const normalized =
          (byte + 256) % 256;

        return (
          '0' +
          normalized.toString(16)
        ).slice(-2);
      }
    )
    .join('');
}
