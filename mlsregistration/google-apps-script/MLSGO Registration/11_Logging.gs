/**
 * ============================================================
 * MLS GO REGISTRATION
 * 11_Logging.gs
 * ============================================================
 *
 * Handles:
 * - Errors sheet logging
 * - safe PII/token redaction
 * - structured console logging
 * - retry diagnostics
 */


/* ============================================================
 * SAFE ERROR LOGGING
 * ============================================================
 */

function safeWriteError_(
  formType,
  reason,
  payload
) {
  const safePayload =
    redactLogPayload_(
      payload || {}
    );

  try {
    withScriptLock_(
      function() {
        const sheet =
          getSheet_(
            SHEET_NAMES.ERRORS
          );

        const headers =
          ensureHeadersByName_(
            sheet,
            ERROR_HEADERS
          );

        const record = {};

        setRecordValueByHeader_(
          record,
          'submitted_at',
          new Date().toISOString()
        );

        setRecordValueByHeader_(
          record,
          'form_type',
          normalizeValue_(
            formType
          )
        );

        setRecordValueByHeader_(
          record,
          'reason',
          normalizeValue_(
            reason
          )
        );

        setRecordValueByHeader_(
          record,
          'payload',
          safeStringify_(
            safePayload
          )
        );

        appendRecord_(
          sheet,
          headers,
          record
        );
      }
    );

  } catch (loggingError) {
    /*
     * Logging must never become the failure that blocks the user.
     */
    console.error(
      JSON.stringify({
        type:
          'error_log_failure',

        originalReason:
          normalizeValue_(reason),

        loggingError:
          errorMessage_(
            loggingError
          ),
      })
    );
  }
}


/*
 * Backwards-compatible alias.
 *
 * Any old helper still calling writeError_() will receive the
 * redacted safe implementation.
 */
function writeError_(
  formType,
  reason,
  payload
) {
  safeWriteError_(
    formType,
    reason,
    payload
  );
}


/* ============================================================
 * STRUCTURED CONSOLE LOGS
 * ============================================================
 */

function logInfo_(
  eventName,
  payload
) {
  console.log(
    JSON.stringify({
      level: 'INFO',
      event:
        normalizeValue_(
          eventName
        ),
      timestamp:
        new Date().toISOString(),
      payload:
        redactLogPayload_(
          payload || {}
        ),
    })
  );
}


function logWarning_(
  eventName,
  payload
) {
  console.warn(
    JSON.stringify({
      level: 'WARN',
      event:
        normalizeValue_(
          eventName
        ),
      timestamp:
        new Date().toISOString(),
      payload:
        redactLogPayload_(
          payload || {}
        ),
    })
  );
}


function logError_(
  eventName,
  error,
  payload
) {
  console.error(
    JSON.stringify({
      level: 'ERROR',
      event:
        normalizeValue_(
          eventName
        ),
      timestamp:
        new Date().toISOString(),
      error:
        errorMessage_(
          error
        ),
      payload:
        redactLogPayload_(
          payload || {}
        ),
    })
  );
}


/* ============================================================
 * RECENT ERROR REVIEW
 * ============================================================
 */

function TEST_recentErrors() {
  const sheet =
    getSheet_(
      SHEET_NAMES.ERRORS
    );

  const headers =
    ensureHeadersByName_(
      sheet,
      ERROR_HEADERS
    );

  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    const emptyResult = {
      ok: true,
      errors: [],
    };

    console.log(
      JSON.stringify(
        emptyResult,
        null,
        2
      )
    );

    return emptyResult;
  }

  const startRow =
    Math.max(
      2,
      lastRow - 9
    );

  const count =
    lastRow -
    startRow +
    1;

  const values =
    sheet
      .getRange(
        startRow,
        1,
        count,
        headers.length
      )
      .getValues();

  const result =
    values.map(
      function(rowValues, index) {
        const record = {};

        headers.forEach(
          function(header, offset) {
            record[header] =
              rowValues[offset];
          }
        );

        return {
          row:
            startRow + index,

          submittedAt:
            normalizeValue_(
              getRecordValueByHeader_(
                record,
                'submitted_at'
              )
            ),

          formType:
            normalizeValue_(
              getRecordValueByHeader_(
                record,
                'form_type'
              )
            ),

          reason:
            normalizeValue_(
              getRecordValueByHeader_(
                record,
                'reason'
              )
            ),
        };
      }
    );

  const response = {
    ok: true,
    errors: result,
  };

  console.log(
    JSON.stringify(
      response,
      null,
      2
    )
  );

  return response;
}
