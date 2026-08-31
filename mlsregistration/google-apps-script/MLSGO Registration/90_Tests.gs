/**
 * ============================================================
 * MLS GO REGISTRATION
 * 90_Tests.gs
 * ============================================================
 *
 * SAFE MANUAL TEST FUNCTIONS.
 *
 * IMPORTANT:
 * - Functions beginning TEST_ never bulk-migrate records.
 * - Row tests operate only on the explicitly selected row.
 * - Email tests send only to EMAIL_CONFIG.TEST_RECIPIENT.
 * - These functions are intended to be selected from the
 *   Apps Script Run dropdown.
 */


/* ============================================================
 * TEST CONFIG
 * ============================================================
 *
 * Change ONLY these row numbers when choosing a test record.
 */

const TEST_ROWS = Object.freeze({
  PLAYER: 2,
  SCHOLARSHIP: 2,
  VOLUNTEER: 2,
  COACH: 2,
});


/* ============================================================
 * BASIC HEALTH
 * ============================================================
 */

function TEST_systemHealth() {
  const result = {
    version:
      MLSGO_CONFIG.VERSION,

    sheets:
      TEST_sheetConfiguration_(),

    folders:
      TEST_archiveFolders(),

    security:
      TEST_securityConfiguration(),
  };

  result.ok =
    Boolean(
      result.sheets.ok &&
      result.security.ok
    );

  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}


function TEST_sheetConfiguration_() {
  const checks = {};

  Object.keys(
    FORM_CONFIG
  ).forEach(
    function(formType) {
      const config =
        FORM_CONFIG[
          formType
        ];

      const sheet =
        getSheet_(
          config.sheetName
        );

      const headers =
        ensureHeadersByName_(
          sheet,
          config.headers
        );

      checks[
        formType
      ] = {
        sheet:
          config.sheetName,

        lastRow:
          sheet.getLastRow(),

        lastColumn:
          sheet.getLastColumn(),

        idColumn:
          config.idColumn,

        idColumnFound:
          Boolean(
            getHeaderColumnByName_(
              buildHeaderIndexByName_(
                headers
              ),
              config.idColumn
            )
          ),
      };
    }
  );

  return {
    ok:
      Object.keys(
        checks
      ).every(
        function(key) {
          return checks[
            key
          ].idColumnFound;
        }
      ),

    checks:
      checks,
  };
}


/* ============================================================
 * ROW INSPECTION
 * ============================================================
 */

function TEST_playerRow() {
  return TEST_inspectRow_(
    SHEET_NAMES.PLAYERS,
    PLAYER_HEADERS,
    TEST_ROWS.PLAYER
  );
}


function TEST_scholarshipRow() {
  return TEST_inspectRow_(
    SHEET_NAMES.SCHOLARSHIPS,
    SCHOLARSHIP_HEADERS,
    TEST_ROWS.SCHOLARSHIP
  );
}


function TEST_volunteerRow() {
  return TEST_inspectRow_(
    SHEET_NAMES.VOLUNTEERS,
    VOLUNTEER_HEADERS,
    TEST_ROWS.VOLUNTEER
  );
}


function TEST_coachRow() {
  return TEST_inspectRow_(
    SHEET_NAMES.COACHES,
    COACH_HEADERS,
    TEST_ROWS.COACH
  );
}


function TEST_inspectRow_(
  sheetName,
  requiredHeaders,
  rowNumber
) {
  const sheet =
    getSheet_(
      sheetName
    );

  const headers =
    ensureHeadersByName_(
      sheet,
      requiredHeaders
    );

  if (
    rowNumber < 2 ||
    rowNumber >
      sheet.getLastRow()
  ) {
    throw new Error(
      'Invalid row ' +
      rowNumber +
      ' for ' +
      sheetName
    );
  }

  const record =
    readSheetRowRecordByHeader_(
      sheet,
      headers,
      rowNumber
    );

  const result = {
    ok: true,
    sheet:
      sheetName,
    row:
      rowNumber,
    record:
      redactLogPayload_(
        record
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


/* ============================================================
 * PPF / SCHOLARSHIP ONE-ROW TESTS
 * ============================================================
 */

function TEST_ppfSelectedPlayerRow() {
  return retryPpfForPlayerRow_(
    TEST_ROWS.PLAYER
  );
}


function TEST_scholarshipSelectedRow() {
  return retryScholarshipRow_(
    TEST_ROWS.SCHOLARSHIP
  );
}


/* ============================================================
 * EMAIL TESTS
 * ============================================================
 */

function TEST_emailAlias() {
  sendBrandedEmail_({
    to:
      EMAIL_CONFIG.TEST_RECIPIENT,

    subject:
      'MLS GO Apps Script Alias Test',

    body:
      'This is a test of the configured MLS GO sender alias.',

    htmlBody:
      buildSimpleBrandedEmailHtml_({
        title:
          'MLS GO Email Test',

        greeting:
          'Sender alias test',

        message:
          'If you received this message, the configured Gmail alias is working.',
      }),
  });

  return {
    ok: true,
    sentTo:
      EMAIL_CONFIG.TEST_RECIPIENT,
  };
}


function TEST_emailRegistration() {
  return TEST_sendFlowEmail_(
    'registration_player'
  );
}


function TEST_emailRegistrationVolunteer() {
  return TEST_sendFlowEmail_(
    'registration_player_volunteer'
  );
}


function TEST_emailRegistrationCoach() {
  return TEST_sendFlowEmail_(
    'registration_player_coach'
  );
}


function TEST_emailRegistrationVolunteerCoach() {
  return TEST_sendFlowEmail_(
    'registration_player_volunteer_coach'
  );
}


function TEST_emailScholarship() {
  return TEST_sendFlowEmail_(
    'scholarship_player'
  );
}


function TEST_emailScholarshipVolunteer() {
  return TEST_sendFlowEmail_(
    'scholarship_player_volunteer'
  );
}


function TEST_emailScholarshipCoach() {
  return TEST_sendFlowEmail_(
    'scholarship_player_coach'
  );
}


function TEST_emailScholarshipVolunteerCoach() {
  return TEST_sendFlowEmail_(
    'scholarship_player_volunteer_coach'
  );
}


function TEST_emailStandaloneVolunteer() {
  return TEST_sendFlowEmail_(
    'standalone_volunteer'
  );
}


function TEST_emailStandaloneCoach() {
  return TEST_sendFlowEmail_(
    'standalone_coach'
  );
}


function TEST_sendFlowEmail_(
  emailType
) {
  const testId =
    'TEST-' +
    emailType +
    '-' +
    new Date().getTime();

  return sendFlowConfirmationEmail_({
    emailType:
      emailType,

    submissionId:
      testId,

    recipientEmail:
      EMAIL_CONFIG.TEST_RECIPIENT,

    applicantFirstName:
      'Test',

    applicantLastName:
      'Registrant',

    participantNames:
      'Test Player One',

    formsRecorded: [
      'MLS GO Registration',
    ],

    agreementsRecorded: [
      'Player Agreement',
    ],

    scholarshipRequested:
      emailType.indexOf(
        'scholarship'
      ) === 0
        ? 'Yes'
        : 'No',

    paymentRequired:
      emailType.indexOf(
        'standalone'
      ) !== 0,

    paymentAmount:
      '75',

    paymentUrl:
      MLSGO_CONFIG.APP_ORIGIN +
      '/?testPayment=1',

    signedDocumentUrls: [],

    sourceUrl:
      MLSGO_CONFIG.APP_ORIGIN,
  });
}


function TEST_emailPaymentPaid() {
  return sendRegistrationPaymentEmail_(
    {
      parent_email:
        EMAIL_CONFIG.TEST_RECIPIENT,

      registration_submission_id:
        'TEST-PAYMENT-' +
        new Date().getTime(),

      payment_amount:
        '75.00',

      payment_transaction_id:
        'TEST-ORDER-12345',

      payment_receipt_url:
        'https://drive.google.com/',
    },
    'paid'
  );
}


function TEST_emailPaymentReceipt() {
  return sendRegistrationPaymentEmail_(
    {
      parent_email:
        EMAIL_CONFIG.TEST_RECIPIENT,

      registration_submission_id:
        'TEST-RECEIPT-' +
        new Date().getTime(),

      payment_amount:
        '75.00',

      payment_transaction_id:
        'TEST-ORDER-12345',

      payment_receipt_url:
        'https://drive.google.com/',
    },
    'receipt'
  );
}


function TEST_emailScholarshipApplication() {
  return handleScholarshipApplicationEmail_({
    parent_email:
      EMAIL_CONFIG.TEST_RECIPIENT,
  });
}


function TEST_emailVolunteerConfirmation() {
  return handleVolunteerCoachConfirmationEmail_({
    form_type:
      'volunteer_application',

    email:
      EMAIL_CONFIG.TEST_RECIPIENT,
  });
}


function TEST_emailCoachConfirmation() {
  return handleVolunteerCoachConfirmationEmail_({
    form_type:
      'coaching_application',

    email:
      EMAIL_CONFIG.TEST_RECIPIENT,
  });
}


/* ============================================================
 * PAYMENT MATCHING TEST
 * ============================================================
 *
 * Reads the selected Player row and runs the same receipt matcher
 * without marking the record paid.
 */

function TEST_paymentMatchingSelectedPlayerRow() {
  const sheet =
    getSheet_(
      SHEET_NAMES.PLAYERS
    );

  const headers =
    ensureHeadersByName_(
      sheet,
      PLAYER_HEADERS
    );

  const rowNumber =
    TEST_ROWS.PLAYER;

  if (
    rowNumber < 2 ||
    rowNumber >
      sheet.getLastRow()
  ) {
    throw new Error(
      'Invalid TEST_ROWS.PLAYER'
    );
  }

  const record =
    readSheetRowRecordByHeader_(
      sheet,
      headers,
      rowNumber
    );

  const response =
    handlePaymentReceiptLookup_({
      parent_email:
        getRecordValueByHeader_(
          record,
          'parent_email'
        ),

      parent_name:
        [
          getRecordValueByHeader_(
            record,
            'parent_first_name'
          ),

          getRecordValueByHeader_(
            record,
            'parent_last_name'
          ),
        ]
          .map(normalizeValue_)
          .filter(Boolean)
          .join(' '),

      player_count:
        getRecordValueByHeader_(
          record,
          'player_count'
        ),

      payment_amount:
        Number(
          normalizeValue_(
            getRecordValueByHeader_(
              record,
              'player_count'
            )
          ) || 1
        ) * 75,
    });

  console.log(
    response.getContent()
  );

  return response;
}


/* ============================================================
 * FULL TEST CHECKLIST
 * ============================================================
 */

function TEST_printChecklist() {
  const checklist = [
    '1. TEST_systemHealth',
    '2. TEST_playerRow',
    '3. TEST_volunteerRow',
    '4. TEST_coachRow',
    '5. TEST_scholarshipRow',
    '6. TEST_emailAlias',
    '7. Run each TEST_email... template',
    '8. TEST_paymentMatchingSelectedPlayerRow',
    '9. TEST_ppfSelectedPlayerRow on a safe test row',
    '10. TEST_scholarshipSelectedRow on a safe test row',
    '11. Complete a fresh Player-only browser registration',
    '12. Complete Player + Scholarship',
    '13. Complete Player + Volunteer',
    '14. Complete Player + Coach',
    '15. Complete standalone Volunteer',
    '16. Complete standalone Coach',
    '17. Verify Drive URLs + IDs in every relevant sheet',
    '18. Verify payment Worker pairs receipt and marks Paid',
    '19. Verify duplicate submit does not duplicate files',
    '20. Verify two simultaneous registrations do not block/corrupt each other',
  ];

  console.log(
    checklist.join('\n')
  );

  return checklist;
}
