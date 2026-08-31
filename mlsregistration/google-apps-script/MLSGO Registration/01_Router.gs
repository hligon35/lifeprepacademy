/**
 * ============================================================
 * MLS GO REGISTRATION
 * 01_Router.gs
 * ============================================================
 *
 * Single entrance into the Apps Script web app.
 *
 * All Worker/private actions require authentication.
 * Email tracking GET requests remain handled separately.
 */


/* ============================================================
 * GET
 * ============================================================
 */

function doGet(e) {
  const params = e && e.parameter
    ? e.parameter
    : {};

  const action = normalizeValue_(params.action);

  if (action === 'track_email') {
    return handleEmailTrackingRequest_(e);
  }

  return json_({
    ok: true,
    service: 'MLS GO Registration',
    version: MLSGO_CONFIG.VERSION,
  });
}


/* ============================================================
 * POST
 * ============================================================
 */

function doPost(e) {
  try {
    if (!e || !e.parameter) {
      return json_({
        ok: false,
        error: 'Missing request parameters.',
      });
    }

    const params = e.parameter;
    const action = normalizeValue_(params.action);


    /*
     * Email tracking is intentionally outside Worker
     * authentication because email clients/browser clicks
     * must be able to reach it.
     */
    if (action === 'track_email') {
      return handleEmailTrackingRequest_(e);
    }


    /*
     * Everything else is a server-to-server operation.
     *
     * isAuthorizedWorkerRequest_() will be supplied by
     * 10_Security.gs.
     */
    if (!isAuthorizedWorkerRequest_(params)) {
      return json_({
        ok: false,
        error: 'Unauthorized update token',
      });
    }


    /* --------------------------------------------------------
     * SYSTEM ACTIONS
     * --------------------------------------------------------
     */

    switch (action) {
      case 'update_agreement_metadata':
        return handleAgreementMetadataUpdate_(params);

      case 'update_payment_metadata':
        return handlePaymentMetadataUpdate_(params);

      case 'get_registration_context':
        return handleRegistrationContextLookup_(params);

      case 'lookup_registration_for_payment_receipt':
        return handlePaymentReceiptLookup_(params);

      case 'send_registration_receipt_email':
        return handleRegistrationReceiptEmail_(params);

      case 'send_registration_paid_email':
        return handleRegistrationPaidEmail_(params);

      case 'send_scholarship_application_email':
        return handleScholarshipApplicationEmail_(params);

      case 'accept_scholarship_application':
        return handleScholarshipAcceptance_(params);

      case 'send_flow_confirmation_email':
        return handleFlowConfirmationEmail_(params);

      case 'send_volunteer_coach_confirmation_email':
        return handleVolunteerCoachConfirmationEmail_(params);
    }


    /* --------------------------------------------------------
     * FORM UPSERT
     * --------------------------------------------------------
     */

    const formType = normalizeValue_(params.form_type);

    if (!formType) {
      return json_({
        ok: false,
        error: 'Missing form_type',
      });
    }

    return handleSubmissionUpsert_(params);

  } catch (error) {
    const message = errorMessage_(error);

    safeWriteError_(
      'router',
      'Unhandled request failure',
      {
        action:
          e && e.parameter
            ? e.parameter.action
            : '',

        form_type:
          e && e.parameter
            ? e.parameter.form_type
            : '',

        error: message,
      }
    );

    return json_({
      ok: false,
      error: message,
    });
  }
}


/* ============================================================
 * JSON RESPONSE
 *
 * Apps Script ContentService does not reliably expose custom
 * HTTP status codes to web-app callers.
 *
 * The Worker should use:
 *
 *     parsed.ok === true / false
 *
 * as the application-level success signal.
 * ============================================================
 */

function json_(payload) {
  return ContentService
    .createTextOutput(
      JSON.stringify(payload || {})
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}


/* ============================================================
 * FORM CONFIG LOOKUP
 * ============================================================
 */

function getFormConfig_(formType) {
  return FORM_CONFIG[
    normalizeValue_(formType)
  ] || null;
}