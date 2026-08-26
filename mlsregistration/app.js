(function () {
  const FORM_ACTION =
    "https://docs.google.com/forms/d/e/1FAIpQLScCUTOgeNb7shvYUrpjbNKn5kh_K_U3tEwks8aJ4zvbXFKWLw/formResponse";
  const FBZX = "-3891024944817654155";
  const GOOGLE_MAPS_API_KEY_META =
    document.querySelector('meta[name="google-maps-api-key"]')?.content.trim() || "";
  const APP_ORIGIN = window.location.origin;
  const API_ORIGIN =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? ""
      : "https://mlsregistration.lifeprepacademyfoundation.com";
  const FORM_UPSERT_ENDPOINT = `${API_ORIGIN}/api/forms/upsert`;
  const PUBLIC_CONFIG_ENDPOINT = `${API_ORIGIN}/api/public-config`;
  const FORM_UPSERT_ENDPOINT = `${API_ORIGIN}/api/forms/upsert`;
  const GOOGLE_APPS_SCRIPT_URL =
    document.querySelector('meta[name="google-apps-script-url"]')?.content.trim() || "";
  const MLS_PLAYER_WAIVER_URL =
    "https://cdn.mediavalet.com/usca/rcx/ViZqxKaKCkOG_lY1tHVXHQ/0NjqRSjMNUKvGw1yBUgd4Q/Original/2.1%20Player%20Registration%20Agreement%20-%20MLS%20GO.pdf";
  const MLS_PRIVACY_POLICY_URL =
    "https://www.mlssoccer.com/legal/privacy-policy";
  const MLS_TERMS_OF_SERVICE_URL =
    "https://www.mlssoccer.com/legal/terms-of-service";
  const PPF_LIABILITY_FORM_URL = `${APP_ORIGIN}/documents/PPF%20Liability%20Form.pdf`;
  const PLAYER_AGREEMENT_TEMPLATE_URL = `${APP_ORIGIN}/documents/MLS GO Player Registration Agreement.pdf`;
  const VOLUNTEER_AGREEMENT_TEMPLATE_URL = `${APP_ORIGIN}/documents/MLS GO Volunteer Agreement.pdf`;
  const SIGNING_ENDPOINT = `${API_ORIGIN}/api/sign-agreement`;
  const E_CONSENT_TEXT_VERSION = "v1-2026-08-06";
  const ELECTRONIC_CONSENT_TEXT =
    "I have reviewed the complete agreement, consent to conduct this transaction electronically, and adopt the signature entered below as my electronic signature. I understand that my electronic signature has the same intended effect as my handwritten signature.";
  const REGISTRATION_FEE_AMOUNT_PER_PLAYER = 75;
  const PAYMENT_MODE_QUERY_PARAM = "paymentMode";
  const PAYMENT_MODE_DEFAULT = "redirect";
  const PAYMENT_MODE = resolvePaymentMode();
  const PAYMENT_PROVIDER = PAYMENT_MODE === "redirect" ? "quest" : "none";
  const PAYMENT_PAUSED_MESSAGE = "Payment is temporarily paused while we transition to a new payment provider. Your registration is saved, and we will email a secure payment link when the service is available.";
  const PAYMENT_REDIRECT_URL = "https://quest.build/get-tickets/1598/71794/info?teamId=686";
  const PAYMENT_REDIRECT_DELAY_MS = 1200;
  const SCHOLARSHIP_GUIDELINES_DOCUMENT_VERSION = "1.0";
  let pendingPaymentRedirectTimeoutId = null;
  let lastPaymentRedirectUrl = "";
  const ENABLE_GOOGLE_FORM_MIRROR = false;
  const FORM_UPSERT_TIMEOUT_MS = 30000;
  const FINAL_CONFIRMATION_TIMEOUT_MS = 30000;

  const FLOW = {
    PLAYER: "player",
    VOLUNTEER: "volunteer",
    COACH: "coach",
    VOLUNTEER_AND_COACH: "volunteerAndCoach",
    COMPLETE: "complete",
  };

  const HELP_OPTION = {
    NO: "no",
    VOLUNTEER: "volunteer",
    COACH: "coach",
    BOTH: "both",
  };

  const FlowLogic = window.MlsRegistrationFlowLogic;
  if (!FlowLogic) {
    throw new Error("MLS registration flow logic failed to load.");
  }

  const {
    STAGES,
    buildRequiredStages,
    buildThankYouContent,
    getFlowDescriptor,
    isScholarshipRequested,
    normalizeHelpChoice,
    normalizeStandaloneFlow,
  } = FlowLogic;

  const FINAL_CONFIRMATION_ENDPOINT = `${API_ORIGIN}/api/forms/final-confirmation`;
  const STAGE_SECTION_IDS = Object.freeze({
    [STAGES.PLAYER_REGISTRATION]: [
      "parent-section",
      "emergency-section",
      "player-section-1",
      "player-section-2",
      "player-section-3",
      "player-section-4",
      "scholarship-section",
      "help-section",
    ],
    [STAGES.PLAYER_AGREEMENT]: ["agreements-section"],
    [STAGES.SCHOLARSHIP_APPLICATION]: ["scholarship-application-section"],
    [STAGES.VOLUNTEER_APPLICATION]: [
      "volunteer-contact-section",
      "volunteer-role-section",
      "volunteer-experience-section",
    ],
    [STAGES.COACHING_APPLICATION]: [
      "volunteer-contact-section",
      "coaching-experience-section",
      "coaching-availability-section",
      "coaching-references-section",
      "coaching-certification-section",
    ],
    [STAGES.VOLUNTEER_AGREEMENT]: ["volunteer-agreement-section"],
  });

  const STAGE_META = Object.freeze({
    [STAGES.PLAYER_REGISTRATION]: {
      title: "MLS GO Registration",
      subtitle:
        "Registration fee is <strong>$75 per player</strong>. You can register up to four players in a single submission.",
      progressLabel: "Player registration",
      submitLabel: "Save Registration",
    },
    [STAGES.PLAYER_AGREEMENT]: {
      title: "Player Agreement",
      subtitle: "Review the required documents. We will generate and record the Player Agreement after you confirm this stage.",
      progressLabel: "Player agreement",
      submitLabel: "Record Player Agreement",
    },
    [STAGES.SCHOLARSHIP_APPLICATION]: {
      title: "Scholarship Guidelines",
      subtitle: "Review the scholarship guidelines below. Your agreement is preloaded from your registration. Accepting this page records your acceptance of the agreement.",
      progressLabel: "Scholarship guidelines",
      submitLabel: "Accept Scholarship Guidelines",
    },
    [STAGES.VOLUNTEER_APPLICATION]: {
      title: "Volunteer Application",
      subtitle: "Complete the volunteer application. The Volunteer Agreement will be recorded in the next stage.",
      progressLabel: "Volunteer application",
      submitLabel: "Submit Volunteer Application",
    },
    [STAGES.COACHING_APPLICATION]: {
      title: "Coaching Application",
      subtitle: "Complete the coaching application. The Volunteer Agreement will be recorded after the coaching application is complete.",
      progressLabel: "Coaching application",
      submitLabel: "Submit Coaching Application",
    },
    [STAGES.VOLUNTEER_AGREEMENT]: {
      title: "Volunteer Agreement",
      subtitle: "Review the Volunteer Agreement before we generate and record it for your application.",
      progressLabel: "Volunteer agreement",
      submitLabel: "Record Volunteer Agreement",
    },
  });

  const CLUB_OPTIONS = [
    "Atlanta United",
    "Austin FC",
    "Charlotte FC",
    "Chicago Fire FC",
    "FC Cincinnati",
    "Colorado Rapids",
    "Columbus Crew",
    "D.C. United",
    "FC Dallas",
    "Houston Dynamo FC",
    "Sporting Kansas City",
    "LA Galaxy",
    "Los Angeles Football Club",
    "Inter Miami FC",
    "Minnesota United",
    "CF Montreal",
    "Nashville SC",
    "New England Revolution",
    "New York Red Bulls",
    "New York City Football Club",
    "Orlando City",
    "Philadelphia Union",
    "Portland Timbers",
    "Real Salt Lake",
    "San Jose Earthquakes",
    "Seattle Sounders FC",
    "St Louis CITY SC",
    "Toronto FC",
    "Vancouver Whitecaps FC",
    "Do not have a favorite MLS team",
  ];

  const HEAR_ABOUT_OPTIONS = [
    "MLS GO Website",
    "MLS GO Social Media Platform",
    "MLS Website",
    "MLS Social Media Platform",
    "MLS Game/Event",
    "MLS Game Broadcast",
    "MLS Club Email",
    "Commercial",
    "News/Media Outlet",
    "RCX Sports (Social, Email, Event)",
    "Flyer",
    "Local Operator Social Media Platform",
    "Local Operator Email",
    "Friend/Family",
  ];

  const STATE_ABBREVIATIONS = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
    "DC", "PR",
  ];

  const PLAYER_ENTRY_MAP = {
    1: {
      firstName: "925997673",
      lastName: "532782949",
      dob: "794964979",
      gender: "948988960",
      grade: "68551410",
      jersey: "96252862",
      shorts: "1653868038",
      socks: "606531095",
      race: "344887039",
      raceOther: "808819655",
      favoriteClub: "1383414731",
      hearAbout: "2134407522",
      addAnother: "132442608",
    },
    2: {
      firstName: "1352429219",
      lastName: "132205084",
      dob: "616106228",
      gender: "1017279017",
      grade: "492008333",
      jersey: "74117565",
      shorts: "2091822432",
      socks: "1277624888",
      race: "919396396",
      raceOther: "148933358",
      favoriteClub: "1501321341",
      hearAbout: "1052127738",
      addAnother: "287436182",
    },
    3: {
      firstName: "2087824710",
      lastName: "2110140915",
      dob: "1255070093",
      gender: "270070642",
      grade: "469937536",
      jersey: "839595072",
      shorts: "1118709557",
      socks: "653829530",
      race: "728187149",
      raceOther: "361075923",
      favoriteClub: "152390057",
      hearAbout: "2123216185",
      addAnother: "755902013",
    },
    4: {
      firstName: "1532414499",
      lastName: "1957523408",
      dob: "1725113999",
      gender: "1691185787",
      grade: "1650750414",
      jersey: "1359691308",
      shorts: "838505738",
      socks: "1868190364",
      race: "537384775",
      raceOther: "1820997950",
      favoriteClub: "1262218896",
      hearAbout: "865861505",
      addAnother: null,
    },
  };

  const PARENT_ENTRY_MAP = {
    firstName: "562145774",
    lastName: "1860068040",
    email: "1319950320",
    phone: "614132174",
    street: "1194206170",
    apt: "1158121566",
    city: "1446697066",
    state: "1759011168",
    zip: "212275520",
  };

  const AGREEMENT_ENTRY_MAP = {
    waiver: "1522719395",
    privacy: "481619757",
    marketing: "1538615941",
    signature: "1611060751",
  };

  const FLOW_META = {
    [FLOW.PLAYER]: {
      title: "MLS GO Registration",
      subtitle:
        "Registration fee is <strong>$75 per player</strong>. You can register up to four players in a single submission.",
      progressLabel: "Player registration",
      submitLabel: "Submit Registration",
    },
    [FLOW.VOLUNTEER]: {
      title: "Volunteer Application",
      subtitle:
        "Complete the volunteer form. Your registration details will stay in this browser while you finish.",
      progressLabel: "Volunteer application",
      submitLabel: "Submit Volunteer Application",
    },
    [FLOW.COACH]: {
      title: "Coaching Application",
      subtitle:
        "Complete the coaching form. We’ll ask for your contact details first, then a few coaching questions.",
      progressLabel: "Coaching application",
      submitLabel: "Submit Coaching Application",
    },
    coachSupplement: {
      title: "Coaching Application",
      subtitle:
        "You’ve finished the volunteer step. Please complete the coaching section.",
      progressLabel: "Coaching application",
      submitLabel: "Submit Coaching Application",
    },
  };

  const form = document.getElementById("registration-form");
  const sectionsRoot = document.getElementById("sections-root");
  const formTitle = document.getElementById("form-title");
  const formSubtitle = document.getElementById("form-subtitle");
  const formMessage = document.getElementById("form-message");
  const flowStatus = document.getElementById("flow-status");
  const paymentPageNote = document.getElementById("payment-page-note");
  const backBtn = document.getElementById("back-btn");
  const nextBtn = document.getElementById("next-btn");
  const skipBtn = document.getElementById("skip-btn");
  const progressFill = document.getElementById("progress-fill");
  const progressText = document.getElementById("progress-text");
  const successPanel = document.getElementById("success-panel");

  const playerToggleNames = ["addPlayer2", "addPlayer3", "addPlayer4"];
  const standaloneFlow = parseStandaloneFlow();
  const initialSectionId = parseInitialSectionId();

  let activeStageIndex = 0;
  let activeSectionIndex = 0;
  let lockedFlowOptions = standaloneFlow ? { standaloneFlow } : null;
  let playerSubmitted = false;
  let scholarshipSubmitted = false;
  let volunteerSubmitted = false;
  let coachingSubmitted = false;
  let completedRegistrationData = null;
  let completedVolunteerData = null;
  let completedCoachingData = null;
  let playerAgreementSigned = false;
  let volunteerAgreementSigned = false;
  let finalConfirmationEmailFailed = false;
  let registrationSubmissionId = "";
  let volunteerSubmissionId = "";
  let coachingSubmissionId = "";
  let playerAgreementTransactionId = "";
  let volunteerAgreementTransactionId = "";
  let playerAgreementDownloadUrl = "";
  let volunteerAgreementDownloadUrl = "";
  let scholarshipDocumentUrl = "";
  let registrationSyncWarning = "";
  let googleMapsApiKeyPromise;
  let isSubmittingStage = false;

  buildPage();
  updatePaymentPageNote();
  wireEvents();
  updateFlowMeta();
  applyVisibility();
  updateScholarshipAgreementPreview();
  setActiveSectionById(initialSectionId);
  renderWizard();
  initAddressAutocomplete();
  syncAgreementPrefills();
  updateExperienceSummaryRequirements();

  function parseStandaloneFlow() {
    const value = new URLSearchParams(window.location.search).get("flow");
    if (value === "volunteer") return FLOW.VOLUNTEER;
    if (value === "coach") return FLOW.COACH;
    return null;
  }

  function parseInitialSectionId() {
    const value = new URLSearchParams(window.location.search).get("section");
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized) return "";

    if (normalized === "agreements" || normalized === "agreement" || normalized === "waiver") {
      return "agreements-section";
    }

    return "";
  }

  function resolvePaymentMode() {
    const rawValue = new URLSearchParams(window.location.search).get(PAYMENT_MODE_QUERY_PARAM);
    const normalized = String(rawValue || PAYMENT_MODE_DEFAULT).trim().toLowerCase();
    if (normalized === "redirect") return "redirect";
    return "paused";
  }

  function updatePaymentPageNote() {
    if (!paymentPageNote) return;
    const descriptor = getFlowDescriptor(getFlowOptions());
    if (!descriptor.paymentRequired) {
      paymentPageNote.hidden = true;
      paymentPageNote.textContent = "";
      return;
    }

    paymentPageNote.hidden = false;
    paymentPageNote.textContent = PAYMENT_MODE === "redirect"
      ? "After submission, you will be redirected to our secure payment page to complete registration."
      : "Payments are temporarily paused while we update our payment system. Your registration is still saved, and we’ll email you a secure payment link when it’s ready.";
  }

  function buildPage() {
    sectionsRoot.className = "sections-grid";
    sectionsRoot.append(
      buildParentSection(),
      buildEmergencySection(),
      buildPlayerSection(1),
      buildPlayerSection(2),
      buildPlayerSection(3),
      buildPlayerSection(4),
      buildScholarshipSection(),
      buildHelpSection(),
      buildAgreementsSection(),
      buildScholarshipApplicationSection(),
      buildVolunteerAgreementSection(),
      buildVolunteerContactSection(),
      buildVolunteerRoleSection(),
      buildVolunteerExperienceSection(),
      buildCoachingExperienceSection(),
      buildCoachingAvailabilitySection(),
      buildCoachingReferencesSection(),
      buildCoachingCertificationSection(),
    );
  }

  function buildParentSection() {
    const section = createSection(
      "Parent or Legal Guardian",
      "Primary contact information for the household.",
      false,
      "parent-section",
      FLOW.PLAYER,
    );
    section.append(
      createGrid([
        createTextField({ label: "Parent/Guardian First Name", name: "parentFirstName", required: true }),
        createTextField({ label: "Parent/Guardian Last Name", name: "parentLastName", required: true }),
        createTextField({ label: "Parent/Guardian Email", name: "parentEmail", required: true, type: "email", autocomplete: "email" }),
        createTextField({ label: "Parent/Guardian Cell Phone", name: "parentPhone", required: true, type: "tel", inputMode: "tel", autocomplete: "tel" }),
        createTextField({ label: "Parent/Guardian Date of Birth", name: "parentGuardianDob", required: true, type: "date" }),
        createTextField({ label: "Street Address", name: "parentStreet", required: true, autocomplete: "street-address", addressField: true, placeholder: "Start typing the address" }),
        createTextField({ label: "Apartment, Suite, or Unit", name: "parentApt", autocomplete: "address-line2" }),
        createTextField({ label: "City", name: "parentCity", required: true, autocomplete: "address-level2" }),
        createSelectField({ label: "State", name: "parentState", required: true, options: STATE_ABBREVIATIONS }),
        createTextField({ label: "ZIP Code", name: "parentZip", required: true, inputMode: "numeric", autocomplete: "postal-code" }),
      ]),
    );
    return section;
  }

  function buildEmergencySection() {
    const section = createSection(
      "Emergency Contact",
      "Complete this section if the emergency contact is different from the parent or guardian.",
      true,
      "emergency-section",
      FLOW.PLAYER,
    );

    const toggle = createToggle({
      label: "Emergency Contact Is the Same as the Parent/Guardian",
      name: "emergencySameAsParent",
      checked: true,
    });

    const fields = document.createElement("div");
    fields.className = "hidden";
    fields.dataset.emergencyFields = "true";
    fields.append(
      createGrid([
        createTextField({ label: "Emergency Contact First Name", name: "emergencyFirstName" }),
        createTextField({ label: "Emergency Contact Last Name", name: "emergencyLastName" }),
        createTextField({ label: "Relationship", name: "emergencyRelationship", placeholder: "Grandparent, aunt, coach, etc." }),
        createTextField({ label: "Emergency Contact Email", name: "emergencyEmail", type: "email", autocomplete: "email" }),
        createTextField({ label: "Emergency Contact Phone", name: "emergencyPhone", type: "tel", inputMode: "tel", autocomplete: "tel" }),
        createTextField({ label: "Street Address", name: "emergencyStreet", autocomplete: "street-address", addressField: true, placeholder: "Start typing the address" }),
        createTextField({ label: "Apartment, Suite, or Unit", name: "emergencyApt", autocomplete: "address-line2" }),
        createTextField({ label: "City", name: "emergencyCity", autocomplete: "address-level2" }),
        createSelectField({ label: "State", name: "emergencyState", options: STATE_ABBREVIATIONS }),
        createTextField({ label: "ZIP Code", name: "emergencyZip", inputMode: "numeric", autocomplete: "postal-code" }),
      ]),
    );

    toggle.querySelector("input")?.addEventListener("change", (event) => {
      fields.classList.toggle("hidden", Boolean(event.target.checked));
    });

    section.append(toggle, fields);
    return section;
  }

  function buildPlayerSection(playerIndex) {
    const section = createSection(
      `Player ${playerIndex}`,
      playerIndex === 1
        ? "Enter the first player details. Use the toggle below to add another player if needed."
        : "Enter details for the additional player.",
      playerIndex > 1,
      `player-section-${playerIndex}`,
      FLOW.PLAYER,
    );

    const grid = createGrid([
      createTextField({ label: `Player ${playerIndex} - First Name`, name: `p${playerIndex}FirstName`, required: true }),
      createTextField({ label: `Player ${playerIndex} - Last Name`, name: `p${playerIndex}LastName`, required: true }),
      createTextField({ label: `Player ${playerIndex} - Date of Birth`, name: `p${playerIndex}Dob`, required: true, type: "date" }),
      createSelectField({ label: `Player ${playerIndex} - Gender Identity`, name: `p${playerIndex}Gender`, required: true, options: ["Female", "Male", "Non-binary", "Prefer not to specify"] }),
      createSelectField({ label: `Player ${playerIndex} - Division`, name: `p${playerIndex}Grade`, required: true, options: ["2nd/3rd Grade Boys", "2nd/3rd Grade Girls", "4th/5th Grade Boys", "4th/5th Grade Girls"] }),
      createSelectField({ label: `Player ${playerIndex} - Jersey Size`, name: `p${playerIndex}Jersey`, required: true, options: ["YXXS", "YXS", "YS", "YM", "YL", "YXL/AS", "AM", "AL", "AXL"] }),
      createSelectField({ label: `Player ${playerIndex} - Shorts Size`, name: `p${playerIndex}Shorts`, required: true, options: ["YXXS", "YXS", "YS", "YM", "YL", "YXL/AS", "AM", "AL", "AXL"] }),
      createSelectField({ label: `Player ${playerIndex} - Sock Size`, name: `p${playerIndex}Socks`, required: true, options: ["YS/YM", "YL/YXL", "A"] }),
      createSelectField({
        label: `Player ${playerIndex} - Race/Ethnicity`,
        name: `p${playerIndex}Race`,
        required: true,
        options: [
          "Black or African American",
          "Arab/Middle Eastern",
          "American Indian/Alaska Native",
          "Canadian Indigenous or First Nations",
          "Hawaiian/Pacific Islander",
          "Hispanic/Latino(a)",
          "White/European",
          "Other (write in)",
          "I do not wish to disclose",
        ],
      }),
      createTextField({ label: `Player ${playerIndex} - Race/Ethnicity - If Other, Please Specify`, name: `p${playerIndex}RaceOther`, conditionalOn: `p${playerIndex}Race`, conditionalValue: "Other (write in)" }),
      createSelectField({ label: `Player ${playerIndex} - Favorite MLS Club`, name: `p${playerIndex}FavoriteClub`, required: true, options: CLUB_OPTIONS }),
      createSelectField({ label: `Player ${playerIndex} - How Did You Hear About MLS GO?`, name: `p${playerIndex}HearAbout`, required: true, options: HEAR_ABOUT_OPTIONS }),
    ]);

    section.append(grid);

    if (playerIndex < 4) {
      const toggleName = `addPlayer${playerIndex + 1}`;
      const toggle = createSelectField({
        label: "Would You Like to Register Another Player?",
        name: toggleName,
        required: true,
        options: ["Yes", "No"],
      });
      const divider = document.createElement("div");
      divider.className = "section-divider";
      section.append(divider, toggle);
    }

    return section;
  }

  function buildScholarshipSection() {
    const section = createSection(
      "Financial Hardship Scholarship",
      "Tell us whether your family needs scholarship assistance. If you select Yes, you will fill out the scholarship application in the final step.",
      false,
      "scholarship-section",
      FLOW.PLAYER,
    );

    const scholarshipFields = createGrid([
      createSelectField({
        label: "Do you need assistance with registration fees?",
        name: "scholarshipRequested",
        required: true,
        options: ["Yes", "No"],
      }),
    ]);

    section.append(scholarshipFields);
    return section;
  }

  function buildScholarshipApplicationSection() {
    const section = createSection(
      "Review and Accept",
      "This is the web version of the scholarship application. If you wish to receive a copy for your records, you may request it via email at youthprograms@lifeprepacademy.com.",
      false,
      "scholarship-application-section",
      FLOW.PLAYER,
    );

    const agreementPreview = buildScholarshipAgreementDocumentPreview();

    const agreementAcceptance = createCheckboxField({
      label: "Accept Scholarship Guidelines",
      name: "scholarshipGuidelinesAccepted",
      required: true,
      descriptionHtml: 'I am <strong id="scholarship-acceptance-parent">Parent/Guardian</strong>, the parent or guardian of <strong id="scholarship-acceptance-participants">the listed participant(s)</strong>. I have read, understand, and accept the Paducah GO Soccer Scholarship Guidelines.',
    });

    section.append(
      agreementPreview,
      agreementAcceptance,
    );
    return section;
  }

  function buildScholarshipAgreementDocumentPreview() {
    const wrap = document.createElement("div");
    wrap.className = "scholarship-agreement-doc";

    const header = document.createElement("div");
    header.className = "scholarship-agreement-doc__header";

    const kicker = document.createElement("p");
    kicker.className = "scholarship-agreement-doc__kicker";
    kicker.textContent = "Agreement Preview";

    const title = document.createElement("h3");
    title.className = "scholarship-agreement-doc__title";
    title.textContent = "Paducah GO Soccer Scholarship Guidelines";

    const intro = document.createElement("p");
    intro.className = "scholarship-agreement-doc__intro";
    intro.textContent = "Your scholarship application is ready below for your review.";

    header.append(kicker, title, intro);

    const body = document.createElement("div");
    body.className = "scholarship-agreement-doc__body";
    body.innerHTML = [
      '<p class="scholarship-agreement-doc__lead">We understand that families may face unexpected challenges, which is why Paducah GO Soccer offers this scholarship to ensure that financial hardship does not prevent a child from participating. To keep the scholarship program fair and available to all children, recipients and their families are expected to follow the participation, school attendance, conduct, and communication guidelines outlined below. These expectations are intended to support each child’s success both on and off the field.</p>',
      '<p class="scholarship-agreement-doc__coverage"><strong>The scholarship covers the full $75 registration fee.</strong> It is intended for children who would otherwise be unable to participate because of the cost.</p>',
      '<h4>Who can receive a scholarship</h4>',
      '<ul>',
      '<li><strong>Grade and school:</strong> The child is enrolled in grade K-12 at a public school in Paducah or the surrounding area.</li>',
      '<li><strong>Financial need:</strong> A parent or guardian confirms that paying the $75 fee would be a hardship. No detailed financial records are required.</li>',
      '<li><strong>Registration:</strong> The family completes the scholarship request and all regular player registration forms.</li>',
      '<li><strong>Availability:</strong> Scholarships are awarded while scholarship funds and team spaces are available. One scholarship may be awarded per child, per season.</li>',
      '</ul>',
      '<p>Scholarships are not based on soccer ability, school grades, or prior playing experience.</p>',
      '<h4>Guidelines for continuing through the season</h4>',
      '<ul>',
      '<li><strong>School attendance:</strong> The child should maintain at least 80% attendance in school. Excused absences for illness, disability, family emergencies, or other approved reasons will not count against the child.</li>',
      '<li><strong>School conduct:</strong> The child should make a reasonable effort to learn without becoming an ongoing disruption to themselves or others. An isolated incident will not automatically affect the scholarship, but a continuing pattern identified by the school may require a family meeting and improvement plan.</li>',
      '<li><strong>Respect:</strong> The child should behave respectfully toward parents and guardians, teachers, coaches, officials, teammates, and other families.</li>',
      '<li><strong>Soccer participation:</strong> The player should attend practices and games regularly, with a goal of attending at least 75% of scheduled activities.</li>',
      '<li><strong>Communication:</strong> A parent or guardian should notify the coach when the player will be absent. If the player has two consecutive unexcused absences, the program will contact the family to see whether help is needed.</li>',
      '<li><strong>Inactive players:</strong> If the player stops attending and the family does not respond after reasonable contact attempts, the program may release the roster spot to another child.</li>',
      '</ul>',
      '<p>A scholarship will not be taken away because of an illness, emergency, transportation problem, disability-related need, or another reasonable hardship when the family communicates with the program.</p>',
      '<h4>Family acknowledgment</h4>',
      '<p>By accepting the scholarship, the family agrees to make a good-faith effort to help the player participate for the full season and to stay in contact with the coach.</p>',
    ].join("");

    const identity = document.createElement("div");
    identity.className = "scholarship-agreement-identity";
    identity.innerHTML = [
      '<div class="scholarship-agreement-identity__field"><span>Player(s)</span><strong id="scholarship-identity-participants">Participant</strong></div>',
      '<div class="scholarship-agreement-identity__field"><span>Grade(s)</span><strong id="scholarship-identity-grades">Not provided</strong></div>',
      '<div class="scholarship-agreement-identity__field"><span>Parent/Guardian</span><strong id="scholarship-identity-parent">Parent/Guardian</strong></div>',
      `<div class="scholarship-agreement-identity__field"><span>Document version</span><strong>${SCHOLARSHIP_GUIDELINES_DOCUMENT_VERSION}</strong></div>`,
    ].join("");

    const pages = document.createElement("div");
    pages.className = "scholarship-agreement-pages";
    pages.id = "scholarship-agreement-pages";

    wrap.append(header, body, identity, pages);
    return wrap;
  }

  function buildHelpSection() {
    const section = createSection(
      "Help With the Program",
      "Would you like to help with the program?",
      false,
      "help-section",
      FLOW.PLAYER,
    );

    section.append(
      createSelectField({
        label: "Would You Like to Help With the Program?",
        name: "helpChoice",
        required: true,
        options: [
          "No, finish my registration",
          "Volunteer",
          "Apply to coach",
          "Volunteer and apply to coach",
        ],
      }),
    );

    return section;
  }

  function buildAgreementsSection() {
    const section = createSection(
      "MLS GO Agreements",
      "Review each required document before accepting the program terms.",
      false,
      "agreements-section",
      FLOW.PLAYER,
    );

    const grid = createGrid([
      createCheckboxField({
        label: "PPF Liability Form",
        name: "agreePpfLiability",
        required: true,
        requireLinksViewed: true,
        description:
          "I have reviewed the PPF Liability Form, understand the coverage and responsibilities described within, and agree to the terms for the program participation described in this form.",
        links: [
          {
            href: PPF_LIABILITY_FORM_URL,
            text: "View PPF Liability Form (PDF)",
          },
        ],
      }),
      createCheckboxField({
        label: "MLS GO Player Registration Agreement and Waiver",
        name: "agreeWaiver",
        required: true,
        requireLinksViewed: true,
        description:
          "I have read and understand the MLS GO Player Registration Agreement and Waiver, accept its terms for myself and every participant listed in this registration, and intend to be legally bound.",
        links: [
          {
            href: MLS_PLAYER_WAIVER_URL,
            text: "View MLS GO Player Registration Agreement and Waiver (PDF)",
          },
        ],
      }),
      createCheckboxField({
        label: "MLS GO Privacy Policy and Terms of Service",
        name: "agreePrivacy",
        required: true,
        requireLinksViewed: true,
        descriptionHtml:
          'I agree that MLS GO, Major League Soccer, the MLS Clubs, Soccer United Marketing, MLS NEXT Pro, MLS NEXT and each of their respective clubs, affiliates and partners, can use my information to send me newsletters, offers, additional information and other communications about their products and initiatives in accordance with the <a href="' +
          MLS_PRIVACY_POLICY_URL +
          '" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and <a href="' +
          MLS_TERMS_OF_SERVICE_URL +
          '" target="_blank" rel="noopener noreferrer">Terms of Use</a>.',
      }),
    ]);
    grid.classList.add("form-grid--one");
    section.append(grid);
    return section;
  }

  function buildVolunteerContactSection() {
    const isStandaloneCoach = standaloneFlow === FLOW.COACH;
    const section = createSection(
      isStandaloneCoach ? "Coaching Contact" : "Volunteer Contact",
      isStandaloneCoach
        ? "Tell us how to reach you about coaching opportunities."
        : "Tell us how to reach you about volunteer opportunities.",
      false,
      "volunteer-contact-section",
      FLOW.VOLUNTEER,
    );
    section.append(
      createGrid([
        createTextField({ label: "First Name", name: "volFirstName", required: true, autocomplete: "given-name" }),
        createTextField({ label: "Last Name", name: "volLastName", required: true, autocomplete: "family-name" }),
        createTextField({ label: "Email", name: "volEmail", required: true, type: "email", autocomplete: "email" }),
        createTextField({ label: "Phone", name: "volPhone", required: true, type: "tel", inputMode: "tel", autocomplete: "tel" }),
        createTextField({ label: "Date of Birth", name: "volDob", required: true, type: "date" }),
        createTextField({ label: "Street Address", name: "volStreet", required: true, autocomplete: "street-address", addressField: true }),
        createTextField({ label: "Apartment, Suite, or Unit", name: "volApt", autocomplete: "address-line2" }),
        createTextField({ label: "City", name: "volCity", required: true, autocomplete: "address-level2" }),
        createSelectField({ label: "State", name: "volState", required: true, options: STATE_ABBREVIATIONS }),
        createTextField({ label: "ZIP Code", name: "volZip", required: true, inputMode: "numeric", autocomplete: "postal-code" }),
      ]),
    );
    return section;
  }

  function buildVolunteerAgreementSection() {
    const section = createSection(
      "Volunteer Agreement",
      "Review the agreement before accepting the terms for your application.",
      false,
      "volunteer-agreement-section",
      FLOW.VOLUNTEER,
    );
    section.append(
      createCheckboxField({
        label: "MLS GO Volunteer Agreement",
        name: "agreeVolunteerAgreement",
        required: true,
        requireLinksViewed: true,
        description: "I have reviewed the MLS GO Volunteer Agreement and agree to the terms for my application.",
        links: [
          {
            href: VOLUNTEER_AGREEMENT_TEMPLATE_URL,
            text: "View MLS GO Volunteer Agreement (PDF)",
          },
        ],
      }),
    );
    return section;
  }

  function buildVolunteerRoleSection() {
    const section = createSection(
      "Volunteer Role",
      "Select all roles that interest you.",
      false,
      "volunteer-role-section",
      FLOW.VOLUNTEER,
    );
    section.append(
      createCheckboxGroupField({
        label: "Volunteer Interests",
        name: "volunteerRoles",
        required: true,
        options: [
          "Game-day operations",
          "Team check-in and support",
          "Field setup and breakdown",
          "Communications and outreach",
          "Fundraising",
          "Other",
        ],
      }),
    );
    return section;
  }

  function buildVolunteerExperienceSection() {
    const section = createSection(
      "Volunteer Experience",
      "Share your relevant experience and availability notes.",
      false,
      "volunteer-experience-section",
      FLOW.VOLUNTEER,
    );

    const grid = createGrid([
      createSelectField({
        label: "Have You Volunteered With Youth Sports Before?",
        name: "volHasExperience",
        required: true,
        options: ["Yes", "No"],
      }),
      createTextField({
        label: "Experience Summary",
        name: "volExperienceSummary",
        required: true,
        placeholder: "Share clubs, roles, and years of experience",
      }),
      createTextField({
        label: "Best Days/Times",
        name: "volAvailabilityNotes",
        required: true,
        placeholder: "Weeknights, Saturday mornings, etc.",
      }),
    ]);

    section.append(grid);
    return section;
  }

  function buildCoachingExperienceSection() {
    const section = createSection(
      "Coaching Experience",
      "Tell us about your coaching or leadership background.",
      false,
      "coaching-experience-section",
      FLOW.COACH,
    );

    section.append(
      createGrid([
        createSelectField({
          label: "Have You Coached Youth Sports Before?",
          name: "coachHasExperience",
          required: true,
          options: ["Yes", "No"],
        }),
        createTextField({
          label: "Coaching Summary",
          name: "coachExperienceSummary",
          required: true,
          placeholder: "Teams, ages, and seasons coached",
        }),
      ]),
    );
    return section;
  }

  function buildCoachingAvailabilitySection() {
    const section = createSection(
      "Coaching Availability",
      "Select all times you can consistently support.",
      false,
      "coaching-availability-section",
      FLOW.COACH,
    );

    section.append(
      createCheckboxGroupField({
        label: "Available Windows",
        name: "coachAvailability",
        required: true,
        options: [
          "Weekday evenings",
          "Saturday mornings",
          "Saturday afternoons",
          "Sunday afternoons",
          "Flexible schedule",
        ],
      }),
    );

    return section;
  }

  function buildCoachingReferencesSection() {
    const section = createSection(
      "Coaching References",
      "Provide at least one reference we can contact.",
      false,
      "coaching-references-section",
      FLOW.COACH,
    );

    section.append(
      createGrid([
        createTextField({ label: "Reference 1 Full Name", name: "coachRef1Name", required: true }),
        createTextField({ label: "Reference 1 Relationship", name: "coachRef1Relationship", required: true }),
        createTextField({ label: "Reference 1 Phone", name: "coachRef1Phone", required: true, type: "tel", inputMode: "tel" }),
        createTextField({ label: "Reference 1 Email", name: "coachRef1Email", required: true, type: "email" }),
      ]),
    );

    return section;
  }

  function buildCoachingCertificationSection() {
    const section = createSection(
      "Coaching Certifications",
      "Share current certifications and acknowledge background screening requirements.",
      false,
      "coaching-certification-section",
      FLOW.COACH,
    );

    const grid = createGrid([
      createCheckboxGroupField({
        label: "Current Certifications",
        name: "coachCertifications",
        options: [
          "First Aid / CPR",
          "Concussion training",
          "Safesport or equivalent",
          "None currently",
        ],
      }),
      createCheckboxField({
        label: "Background Screening Acknowledgement",
        name: "coachBackgroundConsent",
        required: true,
        description:
          "I understand coaching roles require background screening and compliance with program policies.",
      }),
    ]);
    grid.classList.add("form-grid--one");
    section.append(grid);

    return section;
  }

  function createSection(title, description, muted, id, flow) {
    const section = document.createElement("section");
    section.className = `form-section${muted ? " is-muted" : ""}`;
    section.id = id;
    section.dataset.flow = flow;

    const header = document.createElement("div");
    header.className = "section-header";

    const heading = document.createElement("h2");
    heading.textContent = title;

    const helper = document.createElement("p");
    helper.className = "section-helper";
    helper.textContent = description;

    header.append(heading, helper);
    section.append(header);
    return section;
  }

  function createGrid(children) {
    const grid = document.createElement("div");
    grid.className = "form-grid";
    children.forEach((child) => grid.appendChild(child));
    return grid;
  }

  function createFieldWrap(labelText, name, required) {
    const wrap = document.createElement("div");
    wrap.className = "field-group";
    wrap.dataset.fieldWrap = name;

    const label = document.createElement("label");
    label.htmlFor = name;
    label.innerHTML = `${labelText}${required ? ' <span class="required">*</span>' : ""}`;
    wrap.appendChild(label);
    return wrap;
  }

  function createTextField(options) {
    const {
      label,
      name,
      required = false,
      type = "text",
      inputMode,
      autocomplete,
      placeholder,
      addressField = false,
      conditionalOn,
      conditionalValue,
    } = options;

    const wrap = createFieldWrap(label, name, required);
    const input = document.createElement("input");
    input.id = name;
    input.name = name;
    input.type = /dob/i.test(name) && type === "date" ? "text" : type;
    input.placeholder = placeholder || (/dob/i.test(name) ? "MM/DD/YYYY" : "");
    if (inputMode) input.inputMode = inputMode;
    if (autocomplete) input.autocomplete = autocomplete;
    if (required) input.required = true;

    if (addressField) input.dataset.addressField = "true";
    if (name.toLowerCase().includes("phone")) input.dataset.phoneField = "true";
    if (/dob/i.test(name)) {
      input.dataset.dobField = "true";
      input.maxLength = 10;
    }

    if (conditionalOn && conditionalValue) {
      input.dataset.conditionalOn = conditionalOn;
      input.dataset.conditionalValue = conditionalValue;
      wrap.classList.add("hidden");
    }

    wrap.appendChild(input);
    return wrap;
  }

  function createSelectField(options) {
    const { label, name, required = false, options: selectOptions, conditionalOn, conditionalValue } = options;
    const wrap = createFieldWrap(label, name, required);
    const select = document.createElement("select");
    select.id = name;
    select.name = name;
    if (required) select.required = true;
    if (conditionalOn && conditionalValue) {
      select.dataset.conditionalOn = conditionalOn;
      select.dataset.conditionalValue = conditionalValue;
      wrap.classList.add("hidden");
    }

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select an option";
    select.appendChild(placeholder);

    selectOptions.forEach((optionValue) => {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue;
      select.appendChild(option);
    });

    wrap.appendChild(select);
    return wrap;
  }

  function createCheckboxField(options) {
    const {
      label,
      name,
      required = false,
      description,
      descriptionHtml,
      links = [],
      requireLinksViewed = false,
      conditionalOn,
      conditionalValue,
    } = options;
    const wrap = document.createElement("div");
    wrap.className = "field-group";
    if (conditionalOn && conditionalValue) {
      wrap.dataset.conditionalOn = conditionalOn;
      wrap.dataset.conditionalValue = conditionalValue;
      wrap.classList.add("hidden");
    }

    const labelEl = document.createElement("label");
    labelEl.className = "toggle-label";
    labelEl.htmlFor = name;
    labelEl.textContent = label;

    const choice = document.createElement("label");
    choice.className = "inline-toggle";

    const input = document.createElement("input");
    input.id = name;
    input.name = name;
    input.type = "checkbox";
    if (required) input.required = true;

    let allLinksViewed = !requireLinksViewed;
    if (requireLinksViewed) {
      input.disabled = true;
      input.checked = false;
    }

    const text = document.createElement("span");
    if (descriptionHtml) {
      text.innerHTML = descriptionHtml;
    } else {
      text.textContent = description || "I agree";
    }

    choice.append(input, text);

    wrap.append(labelEl, choice);

    const trackedLinks = [];

    if (Array.isArray(links) && links.length > 0) {
      const linkRow = document.createElement("p");
      linkRow.className = "agreement-doc-links";

      links.forEach((linkData, index) => {
        const anchor = document.createElement("a");
        anchor.href = linkData.href;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.textContent = linkData.text;
        trackedLinks.push(anchor);

        linkRow.appendChild(anchor);

        if (index < links.length - 1) {
          const separator = document.createElement("span");
          separator.textContent = " | ";
          linkRow.appendChild(separator);
        }
      });

      wrap.appendChild(linkRow);
    }

    const inlineLinks = Array.from(text.querySelectorAll("a"));
    if (inlineLinks.length > 0) {
      trackedLinks.push(...inlineLinks);
    }

    if (requireLinksViewed && trackedLinks.length > 0) {
      const viewedState = new Array(trackedLinks.length).fill(false);
      const status = document.createElement("p");
      status.className = "agreement-doc-status";
      status.setAttribute("aria-live", "polite");
      status.textContent =
        trackedLinks.length === 1
          ? "Open the linked document to enable this checkbox."
          : "Open each linked document to enable this checkbox.";

      trackedLinks.forEach((anchor, index) => {
        anchor.addEventListener("click", () => {
          viewedState[index] = true;
          allLinksViewed = viewedState.every(Boolean);
          if (allLinksViewed) {
            input.disabled = false;
            status.textContent = "All required documents viewed. You can now check this box.";
          } else {
            const remaining = viewedState.filter((isViewed) => !isViewed).length;
            status.textContent =
              remaining === 1
                ? "Open the remaining document to enable this checkbox."
                : `Open ${remaining} more documents to enable this checkbox.`;
          }
        });
      });

      wrap.appendChild(status);
    }

    if (requireLinksViewed && trackedLinks.length === 0) {
      input.disabled = false;
    }

    return wrap;
  }

  function createCheckboxGroupField(options) {
    const { label, name, required = false, options: values, conditionalOn, conditionalValue } = options;
    const wrap = document.createElement("div");
    wrap.className = "field-group";
    if (required) wrap.dataset.requiredGroup = name;
    if (conditionalOn && conditionalValue) {
      wrap.dataset.conditionalOn = conditionalOn;
      wrap.dataset.conditionalValue = conditionalValue;
      wrap.classList.add("hidden");
    }

    const heading = document.createElement("label");
    heading.className = "toggle-label";
    heading.textContent = `${label}${required ? " *" : ""}`;
    wrap.appendChild(heading);

    const container = document.createElement("div");
    container.className = "checkbox-group";

    values.forEach((optionText, index) => {
      const option = document.createElement("label");
      option.className = "checkbox-group-option";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = `${name}[]`;
      input.value = optionText;
      input.id = `${name}-${index}`;
      const text = document.createElement("span");
      text.textContent = optionText;
      option.append(input, text);
      container.appendChild(option);
    });

    wrap.appendChild(container);
    return wrap;
  }

  function createAgreementSigningField(options) {
    const {
      prefix,
      title,
      agreementUrl,
      signerNameLabel,
      consentName,
      printedNameName,
      signatureDataName,
      signatureMethodName,
      typedSignatureName,
    } = options;

    const wrap = document.createElement("div");
    wrap.className = "field-group agreement-signing-block";

    const heading = document.createElement("h3");
    heading.className = "agreement-signing-title";
    heading.textContent = title;

    const controls = document.createElement("div");
    controls.className = "agreement-view-controls";
    controls.innerHTML = `
      <a href="${agreementUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm">View Complete Agreement</a>
      <a href="${agreementUrl}" download class="btn btn-ghost btn-sm">Download Original Agreement</a>
    `;

    const viewer = document.createElement("iframe");
    viewer.className = "agreement-viewer";
    viewer.src = agreementUrl;
    viewer.title = `${title} Viewer`;

    const printedNameWrap = createFieldWrap(signerNameLabel, printedNameName, true);
    const printedNameInput = document.createElement("input");
    printedNameInput.type = "text";
    printedNameInput.id = printedNameName;
    printedNameInput.name = printedNameName;
    printedNameInput.required = true;
    printedNameWrap.appendChild(printedNameInput);

    const consentWrap = document.createElement("div");
    consentWrap.className = "agreement-consent-wrap";
    const consentChoice = document.createElement("label");
    consentChoice.className = "inline-toggle";
    const consentInput = document.createElement("input");
    consentInput.type = "checkbox";
    consentInput.id = consentName;
    consentInput.name = consentName;
    consentInput.required = true;
    const consentText = document.createElement("span");
    consentText.textContent = ELECTRONIC_CONSENT_TEXT;
    consentChoice.append(consentInput, consentText);
    consentWrap.appendChild(consentChoice);

    const typedToggle = document.createElement("label");
    typedToggle.className = "inline-toggle";
    const typedToggleInput = document.createElement("input");
    typedToggleInput.type = "checkbox";
    typedToggleInput.name = `${prefix}UseTypedSignature`;
    typedToggleInput.id = `${prefix}UseTypedSignature`;
    const typedToggleText = document.createElement("span");
    typedToggleText.textContent = "Use typed signature accessibility alternative";
    typedToggle.append(typedToggleInput, typedToggleText);

    const typedInput = document.createElement("input");
    typedInput.type = "text";
    typedInput.name = typedSignatureName;
    typedInput.id = typedSignatureName;
    typedInput.className = "hidden";
    typedInput.placeholder = "Type full legal name as signature";

    const signatureStatus = document.createElement("p");
    signatureStatus.className = "agreement-doc-status";
    signatureStatus.textContent = "Signing status: Not signed";

    const signatureActionRow = document.createElement("div");
    signatureActionRow.className = "signature-action-row";
    const openSignBtn = document.createElement("button");
    openSignBtn.type = "button";
    openSignBtn.className = "btn btn-primary";
    openSignBtn.textContent = "Tap to Sign";

    const preview = document.createElement("img");
    preview.className = "signature-preview hidden";
    preview.alt = "Accepted signature preview";

    const signatureDataInput = document.createElement("input");
    signatureDataInput.type = "text";
    signatureDataInput.name = signatureDataName;
    signatureDataInput.id = signatureDataName;
    signatureDataInput.dataset.signatureRequired = "true";
    signatureDataInput.className = "visually-hidden";
    signatureDataInput.tabIndex = -1;

    const signatureMethodInput = document.createElement("input");
    signatureMethodInput.type = "hidden";
    signatureMethodInput.name = signatureMethodName;
    signatureMethodInput.id = signatureMethodName;

    const enableTypedFallback = (reason) => {
      typedToggleInput.checked = true;
      typedInput.classList.remove("hidden");
      openSignBtn.disabled = true;
      signatureDataInput.value = "";
      preview.src = "";
      preview.classList.add("hidden");
      signatureMethodInput.value = "typed";
      signatureStatus.textContent = reason
        ? `Signing status: ${reason} Type your full legal name to continue.`
        : "Signing status: Typed signature mode enabled.";
      typedInput.focus();
    };

    signatureActionRow.append(openSignBtn);

    const modal = buildSignatureModal({
      onAccept: (dataUrl) => {
        signatureDataInput.value = dataUrl;
        signatureMethodInput.value = "drawn";
        preview.src = dataUrl;
        preview.classList.remove("hidden");
        typedToggleInput.checked = false;
        typedInput.value = "";
        typedInput.classList.add("hidden");
        openSignBtn.disabled = false;
        signatureStatus.textContent = "Signing status: Drawn signature accepted.";
      },
      onClear: () => {
        signatureDataInput.value = "";
        signatureMethodInput.value = "";
        preview.src = "";
        preview.classList.add("hidden");
        signatureStatus.textContent = "Signing status: Not signed";
      },
    });

    openSignBtn.addEventListener("click", () => {
      const opened = modal.open();
      if (!opened) {
        enableTypedFallback("Draw signature is unavailable on this device.");
      }
    });

    typedToggleInput.addEventListener("change", () => {
      const typedMode = typedToggleInput.checked;
      typedInput.classList.toggle("hidden", !typedMode);
      openSignBtn.disabled = typedMode;
      if (typedMode) {
        signatureDataInput.value = "";
        preview.classList.add("hidden");
        signatureMethodInput.value = "typed";
        signatureStatus.textContent = "Signing status: Typed signature mode enabled.";
      } else {
        typedInput.value = "";
        signatureMethodInput.value = "";
        signatureStatus.textContent = "Signing status: Not signed";
      }
    });

    typedInput.addEventListener("input", () => {
      if (!typedToggleInput.checked) return;
      const value = typedInput.value.trim();
      signatureDataInput.value = value;
      signatureMethodInput.value = value ? "typed" : "";
      signatureStatus.textContent = value
        ? "Signing status: Typed signature accepted."
        : "Signing status: Typed signature required.";
    });

    wrap.append(
      heading,
      controls,
      viewer,
      printedNameWrap,
      consentWrap,
      typedToggle,
      typedInput,
      signatureActionRow,
      preview,
      signatureStatus,
      signatureDataInput,
      signatureMethodInput,
    );

    return wrap;
  }

  function buildSignatureModal({ onAccept, onClear }) {
    const overlay = document.createElement("div");
    overlay.className = "signature-modal signature-modal--draw hidden";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

    const panel = document.createElement("div");
    panel.className = "signature-modal-panel";
    const heading = document.createElement("h4");
    heading.textContent = "Draw Signature";

    const canvas = document.createElement("canvas");
    canvas.className = "signature-canvas";
    canvas.setAttribute("aria-label", "Signature drawing area");

    const controls = document.createElement("div");
    controls.className = "signature-modal-controls";

    const acceptBtn = document.createElement("button");
    acceptBtn.type = "button";
    acceptBtn.className = "btn btn-primary";
    acceptBtn.setAttribute("aria-label", "Accept Signature");
    acceptBtn.textContent = "✓";

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "btn btn-ghost";
    clearBtn.setAttribute("aria-label", "Clear Signature");
    clearBtn.textContent = "X";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn-ghost";
    cancelBtn.textContent = "Cancel";

    controls.append(acceptBtn, clearBtn, cancelBtn);
    panel.append(heading, canvas, controls);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    const ctx = canvas.getContext("2d");
    const canDraw = Boolean(ctx && typeof canvas.toDataURL === "function");
    let drawing = false;
    let hasStroke = false;

    const resizeCanvas = () => {
      if (!canDraw) return false;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      canvas.width = Math.floor(rect.width * ratio);
      canvas.height = Math.floor(rect.height * ratio);
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#111";
      return true;
    };

    const point = (ev) => {
      const rect = canvas.getBoundingClientRect();
      return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
    };

    canvas.addEventListener("pointerdown", (ev) => {
      if (!canDraw) return;
      ev.preventDefault();
      drawing = true;
      hasStroke = true;
      const p = point(ev);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      canvas.setPointerCapture(ev.pointerId);
      document.body.classList.add("signing-lock-scroll");
    });

    canvas.addEventListener("pointermove", (ev) => {
      if (!canDraw) return;
      if (!drawing) return;
      ev.preventDefault();
      const p = point(ev);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    });

    const endDraw = () => {
      drawing = false;
      document.body.classList.remove("signing-lock-scroll");
    };

    canvas.addEventListener("pointerup", endDraw);
    canvas.addEventListener("pointercancel", endDraw);

    clearBtn.addEventListener("click", () => {
      if (!canDraw) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasStroke = false;
      onClear();
    });

    acceptBtn.addEventListener("click", () => {
      if (!canDraw) return;
      if (!hasStroke || !hasMeaningfulInk(canvas)) {
        return;
      }
      onAccept(canvas.toDataURL("image/png"));
      overlay.classList.add("hidden");
    });

    cancelBtn.addEventListener("click", () => {
      overlay.classList.add("hidden");
      document.body.classList.remove("signing-lock-scroll");
    });

    return {
      open() {
        if (!canDraw) return false;
        // Move draw modal to the end of body so it always layers above agreement overlay.
        document.body.appendChild(overlay);
        overlay.classList.remove("hidden");
        const ready = resizeCanvas();
        if (!ready) {
          overlay.classList.add("hidden");
          return false;
        }
        return true;
      },
    };
  }

  function hasMeaningfulInk(canvas) {
    const ctx = canvas.getContext("2d");
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let nonTransparent = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) nonTransparent += 1;
      if (nonTransparent > 120) return true;
    }
    return false;
  }

  function createToggle(options) {
    const { label, name, checked = false } = options;
    const wrap = document.createElement("div");
    wrap.className = "field-group";

    const choice = document.createElement("label");
    choice.className = "inline-toggle";

    const input = document.createElement("input");
    input.id = name;
    input.name = name;
    input.type = "checkbox";
    input.checked = checked;

    const text = document.createElement("span");
    text.textContent = label;

    choice.append(input, text);
    wrap.append(choice);
    return wrap;
  }

  function wireEvents() {
    form.addEventListener("submit", handleFlowSubmit);
    backBtn?.addEventListener("click", goBack);
    nextBtn?.addEventListener("click", goNext);

    form.addEventListener("input", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;

      if (target.dataset.phoneField === "true") formatPhoneField(target);
      if (target.dataset.dobField === "true") formatDobField(target);

      if (target.name === "emergencySameAsParent") {
        const emergencyFields = form.querySelector('[data-emergency-fields="true"]');
        if (emergencyFields) emergencyFields.classList.toggle("hidden", target.checked);
      }

      if (target.name === "p1Race" || target.name === "p2Race" || target.name === "p3Race" || target.name === "p4Race") {
        syncConditionalFields(target.name, target.value);
      }

      if (target.name === "scholarshipRequested") {
        applyVisibility();
        updateFlowMeta();
        renderWizard();
      }

      if (target.name === "helpChoice") {
        updateFlowMeta();
        renderWizard();
      }

      if (playerToggleNames.includes(target.name)) {
        applyVisibility();
        renderWizard();
      }

      if (
        ["parentFirstName", "parentLastName", "volFirstName", "volLastName"].includes(target.name)
      ) {
        syncAgreementPrefills();
      }

      updateScholarshipAgreementPreview();

      if (["volHasExperience", "coachHasExperience"].includes(target.name)) {
        updateExperienceSummaryRequirements();
      }
    });

    form.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;
      if (playerToggleNames.includes(target.name) || target.name === "emergencySameAsParent") {
        applyVisibility();
        renderWizard();
      }
      if (["volHasExperience", "coachHasExperience"].includes(target.name)) {
        updateExperienceSummaryRequirements();
      }
      updateScholarshipAgreementPreview();
    });
  }

  function updateScholarshipAgreementPreview() {
    const pages = document.getElementById("scholarship-agreement-pages");
    const participantIdentity = document.getElementById("scholarship-identity-participants");
    const gradeIdentity = document.getElementById("scholarship-identity-grades");
    const parentIdentity = document.getElementById("scholarship-identity-parent");
    const acceptanceParent = document.getElementById("scholarship-acceptance-parent");
    const acceptanceParticipants = document.getElementById("scholarship-acceptance-participants");
    if (!pages) return;

    const parentName = [getTextValue("parentFirstName"), getTextValue("parentLastName")].filter(Boolean).join(" ").trim() || "Parent/Guardian";
    const participantCards = collectRegistrationPlayersPreview();
    const participantNames = participantCards.map((participant) => participant.name || "Participant");
    const participantGrades = participantCards
      .map((participant) => formatScholarshipDivisionLabel(participant.grade, participant.gender))
      .filter(Boolean);
    const acceptedDate = formatScholarshipAgreementPreviewDate(new Date());

    if (participantIdentity) participantIdentity.textContent = participantNames.join(", ") || "Participant";
    if (gradeIdentity) gradeIdentity.textContent = participantGrades.join(", ") || "Not provided";
    if (parentIdentity) parentIdentity.textContent = parentName;
    if (acceptanceParent) acceptanceParent.textContent = parentName;
    if (acceptanceParticipants) acceptanceParticipants.textContent = participantNames.join(", ") || "the listed participant(s)";

    if (!participantCards.length) {
      pages.innerHTML = '<div class="scholarship-agreement-page"><p class="scholarship-agreement-empty">Add at least one participant above to preview the completed scholarship document.</p></div>';
      return;
    }

    pages.innerHTML = participantCards.map((participant, index) => {
      const safeName = escapeInlineHtml(participant.name || "Participant");
      const safeGrade = escapeInlineHtml(formatScholarshipDivisionLabel(participant.grade, participant.gender) || "Not provided");
      const safeParent = escapeInlineHtml(parentName);
      const safeDate = escapeInlineHtml(acceptedDate);
      return [
        '<article class="scholarship-agreement-page">',
        `<div class="scholarship-agreement-page__label">Participant Copy ${index + 1}</div>`,
        '<div class="scholarship-agreement-page__ack">',
        '<p class="scholarship-agreement-page__line">Player: <span>' + safeName + '</span>     Grade: <span>' + safeGrade + '</span></p>',
        '<p class="scholarship-agreement-page__line">Parent/Guardian: <span>' + safeParent + '</span>     Date: <span>' + safeDate + '</span></p>',
        '</div>',
        '</article>',
      ].join("");
    }).join("");
  }

  function collectRegistrationPlayersPreview() {
    const players = [];
    for (let index = 1; index <= 4; index += 1) {
      const firstName = getTextValue(`p${index}FirstName`);
      const lastName = getTextValue(`p${index}LastName`);
      const grade = getTextValue(`p${index}Grade`);
      const gender = getTextValue(`p${index}Gender`);
      const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
      if (!fullName && !grade) continue;
      players.push({ name: fullName || `Player ${index}`, grade, gender });
    }
    return players;
  }

  function formatScholarshipDivisionLabel(grade, gender) {
    const normalizedGrade = String(grade || "").trim();
    const normalizedGender = String(gender || "").trim();
    if (!normalizedGrade) return normalizedGender;
    if (/\b(Boys|Girls)\b/i.test(normalizedGrade)) return normalizedGrade;
    if (/^(Male|Boy|Boys)$/i.test(normalizedGender)) return `${normalizedGrade} Boys`;
    if (/^(Female|Girl|Girls)$/i.test(normalizedGender)) return `${normalizedGrade} Girls`;
    return normalizedGrade;
  }

  function formatScholarshipAgreementPreviewDate(date) {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  }

  function escapeInlineHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function updateExperienceSummaryRequirements() {
    setConditionalRequired("volHasExperience", "volExperienceSummary");
    setConditionalRequired("coachHasExperience", "coachExperienceSummary");
  }

  function setConditionalRequired(controllerName, targetName) {
    const controller = form.elements.namedItem(controllerName);
    const target = form.elements.namedItem(targetName);
    if (!(controller instanceof HTMLInputElement || controller instanceof HTMLSelectElement)) return;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;

    const requiresSummary = controller.value === "Yes";
    target.required = requiresSummary;
    if (!requiresSummary) {
      target.setCustomValidity("");
    }
  }

  function getFlowOptions() {
    if (lockedFlowOptions) return lockedFlowOptions;
    return {
      standaloneFlow,
      scholarshipRequested: getTextValue("scholarshipRequested"),
      helpChoice: normalizeHelpChoice(getTextValue("helpChoice")),
    };
  }

  function lockFlowOptionsFromRegistration(registrationData) {
    lockedFlowOptions = {
      standaloneFlow,
      scholarshipRequested: registrationData?.scholarship?.requested || "No",
      helpChoice: normalizeHelpChoice(registrationData?.helpChoice || HELP_OPTION.NO),
    };
  }

  function getRequiredStagesForCurrentFlow() {
    return buildRequiredStages(getFlowOptions());
  }

  function getCurrentStage() {
    const stages = getRequiredStagesForCurrentFlow();
    return stages[activeStageIndex] || STAGES.THANK_YOU;
  }

  function getStageMeta(stage) {
    return STAGE_META[stage] || STAGE_META[STAGES.PLAYER_REGISTRATION];
  }

  function includePlayerSectionByCondition(sectionId) {
    if (sectionId === "player-section-2") return getTextValue("addPlayer2") === "Yes";
    if (sectionId === "player-section-3") return getTextValue("addPlayer2") === "Yes" && getTextValue("addPlayer3") === "Yes";
    if (sectionId === "player-section-4") {
      return (
        getTextValue("addPlayer2") === "Yes" &&
        getTextValue("addPlayer3") === "Yes" &&
        getTextValue("addPlayer4") === "Yes"
      );
    }
    return true;
  }

  function getSectionsForStage(stage) {
    const ids = STAGE_SECTION_IDS[stage] || [];
    return ids
      .map((sectionId) => document.getElementById(sectionId))
      .filter(Boolean)
      .filter((section) => {
        if (stage === STAGES.PLAYER_REGISTRATION && !includePlayerSectionByCondition(section.id)) {
          return false;
        }
        return !section.classList.contains("hidden");
      });
  }

  function getVisibleSections() {
    return getSectionsForStage(getCurrentStage());
  }

  function getActiveSectionId() {
    const visible = getVisibleSections();
    return visible[activeSectionIndex]?.id || "";
  }

  function setActiveSectionById(sectionId) {
    if (!sectionId) return;
    const visible = getVisibleSections();
    const index = visible.findIndex((section) => section.id === sectionId);
    if (index >= 0) {
      activeSectionIndex = index;
    }
  }

  function alignActiveSection(previousId) {
    const visible = getVisibleSections();
    if (!visible.length) {
      activeSectionIndex = 0;
      return;
    }

    if (previousId) {
      const sameIndex = visible.findIndex((section) => section.id === previousId);
      if (sameIndex >= 0) {
        activeSectionIndex = sameIndex;
        return;
      }
    }

    if (activeSectionIndex >= visible.length) activeSectionIndex = visible.length - 1;
    if (activeSectionIndex < 0) activeSectionIndex = 0;
  }

  function applyVisibility() {
    const previousId = getActiveSectionId();
    const emergencySameAsParent = getCheckboxValue("emergencySameAsParent");
    const emergencyFields = form.querySelector('[data-emergency-fields="true"]');
    if (emergencyFields) emergencyFields.classList.toggle("hidden", emergencySameAsParent);

    syncConditionalFields("p1Race", getTextValue("p1Race"));
    syncConditionalFields("p2Race", getTextValue("p2Race"));
    syncConditionalFields("p3Race", getTextValue("p3Race"));
    syncConditionalFields("p4Race", getTextValue("p4Race"));

    alignActiveSection(previousId);
  }

  function renderWizard() {
    const stage = getCurrentStage();
    if (stage === STAGES.THANK_YOU || (stage === STAGES.PAYMENT && !form.hidden)) {
      renderSuccessStage();
      return;
    }

    form.hidden = false;
    successPanel.hidden = true;

    const previousId = getActiveSectionId();
    const visible = getVisibleSections();
    Array.from(sectionsRoot.querySelectorAll(".form-section")).forEach((section) => {
      section.classList.remove("is-current");
    });

    if (!visible.length) return;
    alignActiveSection(previousId);

    const currentSection = visible[activeSectionIndex];
    currentSection.classList.add("is-current");

    const current = activeSectionIndex + 1;
    const total = visible.length;
    const stages = getRequiredStagesForCurrentFlow();
    const pct = Math.max(1, Math.round(((activeStageIndex + 1) / stages.length) * 100));
    if (progressFill) progressFill.style.width = `${pct}%`;

    const meta = getStageMeta(stage);
    if (progressText) {
      progressText.textContent = `${meta.progressLabel} — Step ${activeStageIndex + 1} of ${stages.length} · Section ${current} of ${total}`;
    }

    if (backBtn) backBtn.disabled = isSubmittingStage || activeSectionIndex === 0;
    if (nextBtn) {
      const isLast = activeSectionIndex === total - 1;
      nextBtn.textContent = isLast ? meta.submitLabel : "Next Section";
      nextBtn.disabled = isSubmittingStage;
    }
    if (skipBtn) {
      skipBtn.hidden = true;
      skipBtn.disabled = true;
    }
  }

  function updateFlowMeta() {
    const meta = getStageMeta(getCurrentStage());
    if (formTitle) formTitle.textContent = meta.title;
    if (formSubtitle) formSubtitle.innerHTML = meta.subtitle;
    updatePaymentPageNote();
  }

  function goBack() {
    if (isSubmittingStage) return;
    if (activeSectionIndex > 0) {
      activeSectionIndex -= 1;
      formMessage.textContent = "";
      renderWizard();
    }
  }

  function goNext() {
    if (isSubmittingStage) return;
    formMessage.textContent = "";
    const visible = getVisibleSections();
    if (!visible.length) return;

    const current = visible[activeSectionIndex];
    const invalid = validateSection(current);
    if (invalid) {
      const label =
        invalid.closest(".field-group")?.querySelector("label")?.textContent ||
        "this field";
      formMessage.textContent = `Please complete ${label.replace(" *", "")}.`;
      invalid.focus?.();
      return;
    }

    const onFinalSection = activeSectionIndex >= visible.length - 1;
    if (onFinalSection) {
      form.requestSubmit();
      return;
    }

    activeSectionIndex += 1;
    renderWizard();
  }

  function validateSection(section) {
    if (!section) return null;

    const requiredFields = Array.from(section.querySelectorAll("[required]")).filter(
      (field) => !field.closest(".hidden"),
    );

    for (const field of requiredFields) {
      if (field instanceof HTMLInputElement && field.type === "checkbox") {
        if (!field.checked) return field;
      } else if (field.dataset.dobField === "true") {
        if (!isValidDobValue(field.value)) return field;
      } else if (!field.value || !String(field.value).trim()) {
        return field;
      }
    }

    const groups = Array.from(section.querySelectorAll("[data-required-group]"));
    for (const group of groups) {
      if (group.closest(".hidden")) continue;
      const key = group.dataset.requiredGroup;
      if (!key) continue;
      const checked = group.querySelectorAll(`input[name="${key}[]"]:checked`).length;
      if (!checked) {
        return group.querySelector(`input[name="${key}[]"]`);
      }
    }

    return null;
  }

  async function handleFlowSubmit(event) {
    event.preventDefault();
    formMessage.textContent = "";

    try {
      isSubmittingStage = true;
      renderWizard();

      const stage = getCurrentStage();
      if (stage === STAGES.PLAYER_REGISTRATION) {
        await submitPlayerRegistrationStage();
      } else if (stage === STAGES.PLAYER_AGREEMENT) {
        await submitPlayerAgreementStage();
      } else if (stage === STAGES.SCHOLARSHIP_APPLICATION) {
        await submitScholarshipApplicationStage();
      } else if (stage === STAGES.VOLUNTEER_APPLICATION) {
        await submitVolunteerApplicationStage();
      } else if (stage === STAGES.COACHING_APPLICATION) {
        await submitCoachingApplicationStage();
      } else if (stage === STAGES.VOLUNTEER_AGREEMENT) {
        await submitVolunteerAgreementStage();
      }
    } catch (error) {
      const message = String(error?.message || "").trim();
      setSubmissionStatus(getCurrentStage(), "error", message || "Submission failed. Please retry in a moment.");
    } finally {
      isSubmittingStage = false;
      renderWizard();
    }
  }

  function setSubmissionStatus(stage, state, optionalError, details) {
    if (!flowStatus) return;

    if (state === "idle") {
      flowStatus.hidden = true;
      flowStatus.textContent = "";
      if (optionalError !== false) {
        formMessage.textContent = "";
      }
      return;
    }

    const playerNames = Array.isArray(details?.playerNames) ? details.playerNames : [];
    const currentIndex = Number(details?.currentIndex || 0);
    const totalCount = Number(details?.totalCount || 0);

    const runningMessages = {
      [STAGES.PLAYER_REGISTRATION]: "Submitting your player registration. Please don’t close this window.",
      [STAGES.PLAYER_AGREEMENT]: "Generating and recording your Player Agreement. Please don’t close this window.",
      [STAGES.SCHOLARSHIP_APPLICATION]: playerNames.length && currentIndex > 0 && totalCount > 0
        ? `Recording the scholarship application for ${playerNames[currentIndex - 1]} (${currentIndex} of ${totalCount}). Please don’t close this window.`
        : "Submitting your scholarship application. Please don’t close this window.",
      [STAGES.VOLUNTEER_APPLICATION]: "Submitting your volunteer application. Please don’t close this window.",
      [STAGES.COACHING_APPLICATION]: "Submitting your coaching application. Please don’t close this window.",
      [STAGES.VOLUNTEER_AGREEMENT]: "Generating and recording your Volunteer Agreement. Please don’t close this window.",
      [STAGES.FINAL_CONFIRMATION_EMAIL]: "Finalizing your submission and preparing your confirmation email. Please don’t close this window.",
      [STAGES.PAYMENT]: "Your forms have been submitted successfully. Continue to secure payment to finish the player registration.",
    };

    const stageLabels = {
      [STAGES.PLAYER_REGISTRATION]: "player registration",
      [STAGES.PLAYER_AGREEMENT]: "Player Agreement",
      [STAGES.SCHOLARSHIP_APPLICATION]: "scholarship application",
      [STAGES.VOLUNTEER_APPLICATION]: "volunteer application",
      [STAGES.COACHING_APPLICATION]: "coaching application",
      [STAGES.VOLUNTEER_AGREEMENT]: "Volunteer Agreement",
      [STAGES.FINAL_CONFIRMATION_EMAIL]: "confirmation email",
    };

    flowStatus.hidden = false;
    if (state === "submitting") {
      flowStatus.textContent = runningMessages[stage] || "Submitting your form. Please don’t close this window.";
      formMessage.textContent = "";
      return;
    }

    const stageLabel = stageLabels[stage] || "submission";
    const friendlyError = optionalError || `We couldn’t record your ${stageLabel}. Your previous information is saved. Please select Retry to continue.`;
    flowStatus.textContent = friendlyError;
    formMessage.textContent = friendlyError;
  }

  function advanceToStage(stage) {
    const stages = getRequiredStagesForCurrentFlow();
    const index = stages.indexOf(stage);
    if (index >= 0) {
      activeStageIndex = index;
      activeSectionIndex = 0;
      updateFlowMeta();
      applyVisibility();
    }
  }

  async function advanceAfterStageSuccess(stage) {
    if (stage === STAGES.PLAYER_REGISTRATION) {
      lockFlowOptionsFromRegistration(completedRegistrationData);
    }

    const stages = getRequiredStagesForCurrentFlow();
    const currentIndex = stages.indexOf(stage);
    const nextStage = stages[currentIndex + 1];

    if (!nextStage) {
      advanceToStage(STAGES.THANK_YOU);
      return;
    }

    if (nextStage === STAGES.FINAL_CONFIRMATION_EMAIL) {
      await finalizeFlowConfirmationStage();
      return;
    }

    advanceToStage(nextStage);
  }

  async function submitPlayerRegistrationStage() {
    if (playerSubmitted) return;

    setSubmissionStatus(STAGES.PLAYER_REGISTRATION, "submitting");
    registrationSyncWarning = "";

    const registrationData = collectRegistrationData();
    registrationSubmissionId = registrationSubmissionId || generateSubmissionId("reg");
    registrationData.registrationSubmissionId = registrationSubmissionId;
    const params = new URLSearchParams();

    appendIfPresent(params, PARENT_ENTRY_MAP.firstName, registrationData.parent.firstName);
    appendIfPresent(params, PARENT_ENTRY_MAP.lastName, registrationData.parent.lastName);
    appendIfPresent(params, PARENT_ENTRY_MAP.email, registrationData.parent.email);
    appendIfPresent(params, PARENT_ENTRY_MAP.phone, registrationData.parent.phone);
    appendIfPresent(params, PARENT_ENTRY_MAP.street, registrationData.parent.street);
    appendIfPresent(params, PARENT_ENTRY_MAP.apt, registrationData.parent.apt);
    appendIfPresent(params, PARENT_ENTRY_MAP.city, registrationData.parent.city);
    appendIfPresent(params, PARENT_ENTRY_MAP.state, registrationData.parent.state);
    appendIfPresent(params, PARENT_ENTRY_MAP.zip, registrationData.parent.zip);

    registrationData.players.forEach((player, idx) => {
      const entryMap = PLAYER_ENTRY_MAP[idx + 1];
      if (!entryMap) return;

      appendIfPresent(params, entryMap.firstName, player.firstName);
      appendIfPresent(params, entryMap.lastName, player.lastName);
      appendIfPresent(params, entryMap.dob, player.dob);
      appendIfPresent(params, entryMap.gender, player.gender);
      appendIfPresent(params, entryMap.grade, player.grade);
      appendIfPresent(params, entryMap.jersey, player.jersey);
      appendIfPresent(params, entryMap.shorts, player.shorts);
      appendIfPresent(params, entryMap.socks, player.socks);
      appendIfPresent(params, entryMap.race, player.race);
      appendIfPresent(params, entryMap.raceOther, player.raceOther);
      appendIfPresent(params, entryMap.favoriteClub, player.favoriteClub);
      appendIfPresent(params, entryMap.hearAbout, player.hearAbout);
      if (entryMap.addAnother) appendIfPresent(params, entryMap.addAnother, player.addAnother || "No");
    });

    appendIfPresent(
      params,
      AGREEMENT_ENTRY_MAP.waiver,
      registrationData.agreements.waiver
        ? "I have read and understand the MLS GO Player Registration Agreement and Waiver, accept its terms for myself and every participant listed in this registration, and intend to be legally bound."
        : "",
    );
    appendIfPresent(
      params,
      AGREEMENT_ENTRY_MAP.privacy,
      registrationData.agreements.privacy
        ? "I agree to the Terms of Service and consent to the use of my information in accordance with the Privacy Policy."
        : "",
    );
    appendIfPresent(
      params,
      AGREEMENT_ENTRY_MAP.marketing,
      registrationData.agreements.marketing
        ? "I agree that MLS GO, Major League Soccer, the MLS Clubs, Soccer United Marketing, MLS NEXT Pro, MLS NEXT and each of their respective clubs, affiliates and partners, can use my information to send me newsletters, offers, additional information and other communications about their products and initiatives in accordance with the Privacy Policy and Terms of Use."
        : "",
    );
    params.append("fvv", "1");
    params.append("draftResponse", "[]");
    params.append("pageHistory", "0");
    params.append("partialResponse", `[null,null,"${FBZX}"]`);
    params.append("fbzx", FBZX);

    await postRegistrationCopy(registrationData);
    registrationSyncWarning = "";

    if (ENABLE_GOOGLE_FORM_MIRROR) {
      // Mirror to Google Form as best-effort telemetry only.
      postFormResponse(params).catch((error) => {
        console.warn("Google Form mirror failed", error);
      });
    }

    completedRegistrationData = registrationData;
    playerSubmitted = true;
    prefillVolunteerContact();
    setSubmissionStatus(STAGES.PLAYER_REGISTRATION, "idle");
    await advanceAfterStageSuccess(STAGES.PLAYER_REGISTRATION);
  }

  async function submitPlayerAgreementStage() {
    if (playerAgreementSigned) {
      await advanceAfterStageSuccess(STAGES.PLAYER_AGREEMENT);
      return;
    }

    setSubmissionStatus(STAGES.PLAYER_AGREEMENT, "submitting");
    await generatePlayerAgreement(completedRegistrationData);
    playerAgreementSigned = true;
    setSubmissionStatus(STAGES.PLAYER_AGREEMENT, "idle");
    await advanceAfterStageSuccess(STAGES.PLAYER_AGREEMENT);
  }

  async function submitScholarshipApplicationStage() {
    if (scholarshipSubmitted) {
      await advanceAfterStageSuccess(STAGES.SCHOLARSHIP_APPLICATION);
      return;
    }

    setSubmissionStatus(STAGES.SCHOLARSHIP_APPLICATION, "submitting");

    completedRegistrationData.scholarship = collectScholarshipApplicationData();
    await postScholarshipCopy(completedRegistrationData);
    scholarshipSubmitted = true;
    setSubmissionStatus(STAGES.SCHOLARSHIP_APPLICATION, "idle");
    await advanceAfterStageSuccess(STAGES.SCHOLARSHIP_APPLICATION);
  }

  async function submitVolunteerApplicationStage() {
    if (volunteerSubmitted) {
      await advanceAfterStageSuccess(STAGES.VOLUNTEER_APPLICATION);
      return;
    }

    setSubmissionStatus(STAGES.VOLUNTEER_APPLICATION, "submitting");
    const data = collectVolunteerData();
    volunteerSubmissionId = volunteerSubmissionId || generateSubmissionId("vol");
    data.submission_id = volunteerSubmissionId;
    await postAuxFlow("volunteer_application", data);
    completedVolunteerData = data;
    volunteerSubmitted = true;
    setSubmissionStatus(STAGES.VOLUNTEER_APPLICATION, "idle");
    await advanceAfterStageSuccess(STAGES.VOLUNTEER_APPLICATION);
  }

  async function submitCoachingApplicationStage() {
    if (coachingSubmitted) {
      await advanceAfterStageSuccess(STAGES.COACHING_APPLICATION);
      return;
    }

    setSubmissionStatus(STAGES.COACHING_APPLICATION, "submitting");
    const data = collectCoachingData();
    coachingSubmissionId = coachingSubmissionId || generateSubmissionId("coach");
    data.submission_id = coachingSubmissionId;
    await postAuxFlow("coaching_application", data);
    completedCoachingData = data;
    coachingSubmitted = true;
    setSubmissionStatus(STAGES.COACHING_APPLICATION, "idle");
    await advanceAfterStageSuccess(STAGES.COACHING_APPLICATION);
  }

  async function submitVolunteerAgreementStage() {
    if (volunteerAgreementSigned) {
      await advanceAfterStageSuccess(STAGES.VOLUNTEER_AGREEMENT);
      return;
    }

    setSubmissionStatus(STAGES.VOLUNTEER_AGREEMENT, "submitting");
    const agreementSource = completedVolunteerData || completedCoachingData || collectVolunteerData();
    const agreementFormType = completedVolunteerData ? "volunteer_application" : "coaching_application";
    const agreementSubmissionId = completedVolunteerData ? volunteerSubmissionId : coachingSubmissionId;
    await generateVolunteerAgreement(agreementSource, agreementFormType, agreementSubmissionId);
    volunteerAgreementSigned = true;
    setSubmissionStatus(STAGES.VOLUNTEER_AGREEMENT, "idle");
    await advanceAfterStageSuccess(STAGES.VOLUNTEER_AGREEMENT);
  }

  async function finalizeFlowConfirmationStage() {
    setSubmissionStatus(STAGES.FINAL_CONFIRMATION_EMAIL, "submitting");
    try {
      const emailResult = await sendFinalConfirmationEmail();
      scholarshipDocumentUrl = String(emailResult?.scholarshipDocumentUrl || scholarshipDocumentUrl || "").trim();
      finalConfirmationEmailFailed = !Boolean(emailResult?.sent || emailResult?.duplicate);
    } catch (error) {
      finalConfirmationEmailFailed = true;
      console.warn("final-confirmation-email-failed", error);
    }

    setSubmissionStatus(STAGES.FINAL_CONFIRMATION_EMAIL, "idle", false);
    advanceToStage(STAGES.THANK_YOU);
  }

  function renderSuccessStage() {
    Array.from(sectionsRoot.querySelectorAll(".form-section")).forEach((section) => {
      section.classList.remove("is-current");
    });

    if (progressFill) progressFill.style.width = "100%";
    if (progressText) progressText.textContent = "Complete";

    form.hidden = true;
    successPanel.hidden = false;
    flowStatus.hidden = true;
    formMessage.textContent = "";

    const heading = successPanel.querySelector("h2");
    const copy = successPanel.querySelector("p");
    const thankYouContent = buildThankYouContent({
      ...getFlowOptions(),
      emailSent: !finalConfirmationEmailFailed,
    });

    if (heading) heading.textContent = thankYouContent.heading;
    if (copy) copy.textContent = thankYouContent.message;

    Array.from(successPanel.querySelectorAll("[data-dynamic-success='true']")).forEach((node) => node.remove());

    if (registrationSyncWarning) {
      const syncWarning = document.createElement("p");
      syncWarning.dataset.dynamicSuccess = "true";
      syncWarning.textContent = registrationSyncWarning;
      successPanel.appendChild(syncWarning);
    }

    if (scholarshipDocumentUrl) {
      const scholarshipLinkWrap = document.createElement("p");
      scholarshipLinkWrap.dataset.dynamicSuccess = "true";
      const scholarshipLink = document.createElement("a");
      scholarshipLink.href = scholarshipDocumentUrl;
      scholarshipLink.target = "_blank";
      scholarshipLink.rel = "noopener noreferrer";
      scholarshipLink.textContent = "Open your completed scholarship document";
      scholarshipLinkWrap.appendChild(scholarshipLink);
      successPanel.appendChild(scholarshipLinkWrap);
    }

    const descriptor = getFlowDescriptor(getFlowOptions());
    const paymentAllowed = descriptor.paymentRequired && getRequiredStagesForCurrentFlow().includes(STAGES.PAYMENT);
    if (!paymentAllowed) return;

    if (pendingPaymentRedirectTimeoutId) {
      window.clearTimeout(pendingPaymentRedirectTimeoutId);
      pendingPaymentRedirectTimeoutId = null;
    }

    const playerCount = selectedPlayerCount();
    const paymentAmount = calculateRegistrationFeeAmount();
    const registrationTotalMessage = formatRegistrationTotalMessage(playerCount, paymentAmount);
    const paymentMessage = document.createElement("p");
    paymentMessage.dataset.dynamicSuccess = "true";
    paymentMessage.textContent = PAYMENT_MODE === "redirect"
      ? `Your forms have been submitted successfully. Redirecting you to secure payment in a moment. Registration total: ${registrationTotalMessage}.`
      : `Your forms have been submitted successfully. Registration total: ${registrationTotalMessage}.`;
    successPanel.appendChild(paymentMessage);

    const paymentRedirectUrl = buildPaymentRedirectUrl(completedRegistrationData);
    const paymentButton = PAYMENT_MODE === "redirect"
      ? document.createElement("a")
      : document.createElement("p");
    paymentButton.dataset.dynamicSuccess = "true";
    paymentButton.className = "btn btn-primary";

    if (paymentButton instanceof HTMLAnchorElement) {
      paymentButton.href = paymentRedirectUrl || PAYMENT_REDIRECT_URL;
      paymentButton.rel = "noopener noreferrer";
      paymentButton.setAttribute("role", "button");
      paymentButton.style.display = "inline-block";
      paymentButton.style.textDecoration = "none";
      paymentButton.style.textAlign = "center";
      paymentButton.style.width = "100%";
      paymentButton.textContent = `Continue to Secure Payment - ${registrationTotalMessage}`;
    } else {
      paymentButton.textContent = `Payment temporarily paused - ${registrationTotalMessage}`;
    }

    successPanel.appendChild(paymentButton);

    const paymentHint = document.createElement("p");
    paymentHint.dataset.dynamicSuccess = "true";
    paymentHint.textContent = PAYMENT_MODE === "redirect"
      ? `If the payment page does not prefill the registration fee, select Other and enter ${registrationTotalMessage}. If you are not redirected automatically, use the button above.`
      : `${PAYMENT_PAUSED_MESSAGE} Your registration fee amount is ${registrationTotalMessage}.`;
    successPanel.appendChild(paymentHint);

    if (PAYMENT_MODE === "redirect" && paymentRedirectUrl) {
      const shouldRedirect = paymentRedirectUrl !== lastPaymentRedirectUrl;
      lastPaymentRedirectUrl = paymentRedirectUrl;

      if (shouldRedirect) {
        pendingPaymentRedirectTimeoutId = window.setTimeout(() => {
          pendingPaymentRedirectTimeoutId = null;
          window.location.assign(paymentRedirectUrl);
        }, PAYMENT_REDIRECT_DELAY_MS);
      }
    }
  }

  function prefillVolunteerContact() {
    const parent = completedRegistrationData?.parent;
    if (!parent) return;

    setIfEmpty("volFirstName", parent.firstName);
    setIfEmpty("volLastName", parent.lastName);
    setIfEmpty("volEmail", parent.email);
    setIfEmpty("volPhone", parent.phone);
    setIfEmpty("volDob", parent.dob);
    setIfEmpty("volStreet", parent.street);
    setIfEmpty("volApt", parent.apt);
    setIfEmpty("volCity", parent.city);
    setIfEmpty("volState", parent.state);
    setIfEmpty("volZip", parent.zip);
    syncAgreementPrefills();
  }

  function syncAgreementPrefills() {
    // Signature names are captured at final submit from live form values.
  }

  function setIfEmpty(name, value) {
    const field = form.elements.namedItem(name);
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
    if (field.value && field.value.trim()) return;
    field.value = value || "";
  }

  function mapHelpChoice(value) {
    return normalizeHelpChoice(value);
  }

  function calculateRegistrationFeeAmount() {
    const playerCount = selectedPlayerCount();
    return Math.max(0, playerCount * REGISTRATION_FEE_AMOUNT_PER_PLAYER);
  }

  function formatRegistrationTotalMessage(playerCount, paymentAmount) {
    const playerLabel = playerCount === 1 ? "1 player" : `${playerCount} players`;
    return `$${REGISTRATION_FEE_AMOUNT_PER_PLAYER} x ${playerLabel} = $${paymentAmount}`;
  }

  function buildDonateUrl() {
    return "";
  }

  function sanitizePaymentParam(value) {
    return String(value || "").trim();
  }

  function appendPaymentParamVariants(url, keys, value) {
    const normalized = sanitizePaymentParam(value);
    if (!normalized) return;
    keys.forEach((key) => {
      url.searchParams.set(key, normalized);
    });
  }

  function buildPaymentRedirectUrl(registrationData) {
    const baseUrl = sanitizePaymentParam(PAYMENT_REDIRECT_URL);
    if (!baseUrl) return "";

    try {
      const url = new URL(baseUrl);
      const parent = registrationData?.parent || {};
      const firstName = sanitizePaymentParam(parent.firstName);
      const lastName = sanitizePaymentParam(parent.lastName);
      const email = sanitizePaymentParam(parent.email);
      const zip = sanitizePaymentParam(parent.zip);
      const submissionId = sanitizePaymentParam(registrationData?.registrationSubmissionId);
      const paymentAmount = String(calculateRegistrationFeeAmount());

      appendPaymentParamVariants(url, ["firstName", "firstname", "first_name", "givenName", "given_name"], firstName);
      appendPaymentParamVariants(url, ["lastName", "lastname", "last_name", "familyName", "family_name"], lastName);
      appendPaymentParamVariants(url, ["fullName", "full_name", "name"], [firstName, lastName].filter(Boolean).join(" "));
      appendPaymentParamVariants(url, ["email", "emailAddress", "email_address", "customerEmail", "customer_email"], email);
      appendPaymentParamVariants(url, ["zip", "zipCode", "zipcode", "postalCode", "postal_code", "postal"], zip);
      appendPaymentParamVariants(url, ["registration_submission_id", "submission_id", "submissionId", "registrationId", "reference", "external_reference"], submissionId);
      appendPaymentParamVariants(url, ["payment_amount", "amount", "total"], paymentAmount);
      appendPaymentParamVariants(url, ["payment_currency", "currency"], "USD");

      return url.toString();
    } catch (_error) {
      return baseUrl;
    }
  }

  function collectRegistrationData() {
    const emergencySameAsParent = getCheckboxValue("emergencySameAsParent");
    const playerCount = selectedPlayerCount();
    const players = [];

    for (let playerIndex = 1; playerIndex <= playerCount; playerIndex += 1) {
      players.push({
        firstName: getTextValue(`p${playerIndex}FirstName`),
        lastName: getTextValue(`p${playerIndex}LastName`),
        dob: getTextValue(`p${playerIndex}Dob`),
        gender: getTextValue(`p${playerIndex}Gender`),
        grade: getTextValue(`p${playerIndex}Grade`),
        jersey: getTextValue(`p${playerIndex}Jersey`),
        shorts: getTextValue(`p${playerIndex}Shorts`),
        socks: getTextValue(`p${playerIndex}Socks`),
        race: getTextValue(`p${playerIndex}Race`),
        raceOther: getTextValue(`p${playerIndex}RaceOther`),
        favoriteClub: getTextValue(`p${playerIndex}FavoriteClub`),
        hearAbout: getTextValue(`p${playerIndex}HearAbout`),
        addAnother: getTextValue(`addPlayer${playerIndex + 1}`),
      });
    }

    return {
      submittedAt: new Date().toISOString(),
      pageUrl: window.location.href,
      parent: {
        firstName: getTextValue("parentFirstName"),
        lastName: getTextValue("parentLastName"),
        email: getTextValue("parentEmail"),
        phone: getTextValue("parentPhone"),
        dob: getTextValue("parentGuardianDob"),
        street: getTextValue("parentStreet"),
        apt: getTextValue("parentApt"),
        city: getTextValue("parentCity"),
        state: getTextValue("parentState"),
        zip: getTextValue("parentZip"),
      },
      emergency: emergencySameAsParent
        ? {
            sameAsParent: true,
            firstName: "",
            lastName: "",
            relationship: "",
            email: "",
            phone: "",
            street: "",
            apt: "",
            city: "",
            state: "",
            zip: "",
          }
        : {
            sameAsParent: false,
            firstName: getTextValue("emergencyFirstName"),
            lastName: getTextValue("emergencyLastName"),
            relationship: getTextValue("emergencyRelationship"),
            email: getTextValue("emergencyEmail"),
            phone: getTextValue("emergencyPhone"),
            street: getTextValue("emergencyStreet"),
            apt: getTextValue("emergencyApt"),
            city: getTextValue("emergencyCity"),
            state: getTextValue("emergencyState"),
            zip: getTextValue("emergencyZip"),
          },
      players,
      scholarship: {
        requested: getTextValue("scholarshipRequested"),
        level: getTextValue("scholarshipLevel"),
        householdSize: getTextValue("scholarshipHouseholdSize"),
        householdIncome: getTextValue("scholarshipHouseholdIncome"),
        eligibility: getCheckedValues("scholarshipEligibility"),
        circumstances: getTextValue("scholarshipCircumstances"),
        contributionAmount: getTextValue("scholarshipContributionAmount"),
        participationCommitment: getCheckboxValue("scholarshipParticipationCommitment"),
        parentAcknowledgement: getCheckboxValue("scholarshipParentAcknowledgement"),
        guidelinesAccepted: getCheckboxValue("scholarshipGuidelinesAccepted"),
      },
      helpChoice: getTextValue("helpChoice"),
      agreements: {
        waiver: getCheckboxValue("agreeWaiver"),
        liability: getCheckboxValue("agreePpfLiability"),
        privacy: getCheckboxValue("agreePrivacy"),
        marketing: getCheckboxValue("agreePrivacy"),
      },
      signature: "",
      agreementSigning: null,
    };
  }

  function toEmailResponseValue(value) {
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) {
      return value
        .map((entry) => String(entry || "").trim())
        .filter(Boolean)
        .join(", ");
    }
    return String(value || "").trim();
  }

  function pushEmailResponseRow(rows, label, value) {
    const normalized = toEmailResponseValue(value);
    if (!normalized) return;
    rows.push({ label, value: normalized });
  }

  function buildRegistrationEmailResponseRows(registrationData) {
    const rows = [];
    if (!registrationData) return rows;

    pushEmailResponseRow(rows, "Registration ID", registrationData.registrationSubmissionId || "");
    pushEmailResponseRow(rows, "Submitted At", registrationData.submittedAt);
    pushEmailResponseRow(rows, "Parent/Guardian First Name", registrationData.parent?.firstName);
    pushEmailResponseRow(rows, "Parent/Guardian Last Name", registrationData.parent?.lastName);
    pushEmailResponseRow(rows, "Parent/Guardian Email", registrationData.parent?.email);
    pushEmailResponseRow(rows, "Parent/Guardian Phone", registrationData.parent?.phone);
    pushEmailResponseRow(rows, "Parent/Guardian Date of Birth", registrationData.parent?.dob);
    pushEmailResponseRow(rows, "Parent/Guardian Street", registrationData.parent?.street);
    pushEmailResponseRow(rows, "Parent/Guardian Apt", registrationData.parent?.apt);
    pushEmailResponseRow(rows, "Parent/Guardian City", registrationData.parent?.city);
    pushEmailResponseRow(rows, "Parent/Guardian State", registrationData.parent?.state);
    pushEmailResponseRow(rows, "Parent/Guardian Zip", registrationData.parent?.zip);

    pushEmailResponseRow(rows, "Emergency Contact Same As Parent", registrationData.emergency?.sameAsParent);
    if (!registrationData.emergency?.sameAsParent) {
      pushEmailResponseRow(rows, "Emergency Contact First Name", registrationData.emergency?.firstName);
      pushEmailResponseRow(rows, "Emergency Contact Last Name", registrationData.emergency?.lastName);
      pushEmailResponseRow(rows, "Emergency Contact Relationship", registrationData.emergency?.relationship);
      pushEmailResponseRow(rows, "Emergency Contact Email", registrationData.emergency?.email);
      pushEmailResponseRow(rows, "Emergency Contact Phone", registrationData.emergency?.phone);
      pushEmailResponseRow(rows, "Emergency Contact Street", registrationData.emergency?.street);
      pushEmailResponseRow(rows, "Emergency Contact Apt", registrationData.emergency?.apt);
      pushEmailResponseRow(rows, "Emergency Contact City", registrationData.emergency?.city);
      pushEmailResponseRow(rows, "Emergency Contact State", registrationData.emergency?.state);
      pushEmailResponseRow(rows, "Emergency Contact Zip", registrationData.emergency?.zip);
    }

    const players = Array.isArray(registrationData.players) ? registrationData.players : [];
    pushEmailResponseRow(rows, "Player Count", players.length);
    players.forEach((player, index) => {
      const n = index + 1;
      pushEmailResponseRow(rows, `Player ${n} First Name`, player?.firstName);
      pushEmailResponseRow(rows, `Player ${n} Last Name`, player?.lastName);
      pushEmailResponseRow(rows, `Player ${n} Date of Birth`, player?.dob);
      pushEmailResponseRow(rows, `Player ${n} Gender`, player?.gender);
      pushEmailResponseRow(rows, `Player ${n} Grade`, player?.grade);
      pushEmailResponseRow(rows, `Player ${n} Jersey Size`, player?.jersey);
      pushEmailResponseRow(rows, `Player ${n} Shorts Size`, player?.shorts);
      pushEmailResponseRow(rows, `Player ${n} Socks Size`, player?.socks);
      pushEmailResponseRow(rows, `Player ${n} Race`, player?.race);
      pushEmailResponseRow(rows, `Player ${n} Race Other`, player?.raceOther);
      pushEmailResponseRow(rows, `Player ${n} Favorite Club`, player?.favoriteClub);
      pushEmailResponseRow(rows, `Player ${n} Heard About Program`, player?.hearAbout);
      pushEmailResponseRow(rows, `Player ${n} Add Another`, player?.addAnother);
    });

    pushEmailResponseRow(rows, "Help Choice", registrationData.helpChoice);
    pushEmailResponseRow(rows, "Scholarship Requested", registrationData.scholarship?.requested);
    pushEmailResponseRow(rows, "Scholarship Level", registrationData.scholarship?.level);
    pushEmailResponseRow(rows, "Scholarship Household Size", registrationData.scholarship?.householdSize);
    pushEmailResponseRow(rows, "Scholarship Household Income", registrationData.scholarship?.householdIncome);
    pushEmailResponseRow(rows, "Scholarship Eligibility", registrationData.scholarship?.eligibility);
    pushEmailResponseRow(rows, "Scholarship Circumstances", registrationData.scholarship?.circumstances);
    pushEmailResponseRow(rows, "Scholarship Contribution Amount", registrationData.scholarship?.contributionAmount);
    pushEmailResponseRow(rows, "Scholarship Participation Commitment", registrationData.scholarship?.participationCommitment);
    pushEmailResponseRow(rows, "Scholarship Parent Acknowledgement", registrationData.scholarship?.parentAcknowledgement);
    pushEmailResponseRow(rows, "Agree Waiver", registrationData.agreements?.waiver);
    pushEmailResponseRow(rows, "Agree PPF Liability", registrationData.agreements?.liability);
    pushEmailResponseRow(rows, "Agree Privacy", registrationData.agreements?.privacy);
    pushEmailResponseRow(rows, "Agree Marketing", registrationData.agreements?.marketing);

    return rows;
  }

  function collectVolunteerData() {
    return {
      submittedAt: new Date().toISOString(),
      pageUrl: window.location.href,
      firstName: getTextValue("volFirstName"),
      lastName: getTextValue("volLastName"),
      email: getTextValue("volEmail"),
      phone: getTextValue("volPhone"),
      dob: getTextValue("volDob"),
      street: getTextValue("volStreet"),
      apt: getTextValue("volApt"),
      city: getTextValue("volCity"),
      state: getTextValue("volState"),
      zip: getTextValue("volZip"),
      roles: getCheckedValues("volunteerRoles"),
      hasExperience: getTextValue("volHasExperience"),
      experienceSummary: getTextValue("volExperienceSummary"),
      availabilityNotes: getTextValue("volAvailabilityNotes"),
      agreement: false,
      signature: "",
      agreementSigning: null,
      linkedParentEmail: completedRegistrationData?.parent?.email || "",
    };
  }

  function collectScholarshipApplicationData() {
    return {
      requested: completedRegistrationData?.scholarship?.requested || getTextValue("scholarshipRequested") || "Yes",
      level: getTextValue("scholarshipLevel"),
      householdSize: getTextValue("scholarshipHouseholdSize"),
      householdIncome: getTextValue("scholarshipHouseholdIncome"),
      eligibility: getCheckedValues("scholarshipEligibility"),
      circumstances: getTextValue("scholarshipCircumstances"),
      contributionAmount: getTextValue("scholarshipContributionAmount"),
      participationCommitment: getCheckboxValue("scholarshipParticipationCommitment"),
      parentAcknowledgement: getCheckboxValue("scholarshipParentAcknowledgement"),
      guidelinesAccepted: getCheckboxValue("scholarshipGuidelinesAccepted"),
    };
  }

  function getParticipantNames(registrationData) {
    return Array.isArray(registrationData?.players)
      ? registrationData.players
        .map((player) => `${player?.firstName || ""} ${player?.lastName || ""}`.trim())
        .filter(Boolean)
      : [];
  }

  function requestAgreementSignature(options) {
    const {
      prefix,
      title,
      agreementUrl,
      signerNameLabel,
      defaultPrintedName,
    } = options;

    const printedNameName = `${prefix}PrintedName`;
    const consentName = `${prefix}Consent`;
    const signatureDataName = `${prefix}SignatureData`;
    const signatureMethodName = `${prefix}SignatureMethod`;
    const typedSignatureName = `${prefix}TypedSignature`;

    return new Promise((resolve, reject) => {
      const overlay = document.createElement("div");
      overlay.className = "signature-modal";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");

      const panel = document.createElement("div");
      panel.className = "signature-modal-panel signature-modal-panel--agreement";

      const heading = document.createElement("h4");
      heading.textContent = title;

      const block = createAgreementSigningField({
        prefix,
        title,
        agreementUrl,
        signerNameLabel,
        consentName,
        printedNameName,
        signatureDataName,
        signatureMethodName,
        typedSignatureName,
      });
      const blockHeading = block.querySelector(".agreement-signing-title");
      if (blockHeading) blockHeading.remove();

      const printedNameInput = block.querySelector(`[name="${printedNameName}"]`);
      if (printedNameInput instanceof HTMLInputElement) {
        printedNameInput.value = String(defaultPrintedName || "").trim();
      }

      const status = document.createElement("p");
      status.className = "agreement-doc-status";
      status.setAttribute("aria-live", "polite");

      const controls = document.createElement("div");
      controls.className = "signature-modal-controls";

      const submitBtn = document.createElement("button");
      submitBtn.type = "button";
      submitBtn.className = "btn btn-primary";
      submitBtn.textContent = "Sign and Continue";

      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "btn btn-ghost";
      cancelBtn.textContent = "Cancel";

      controls.append(submitBtn, cancelBtn);
      panel.append(heading, block, status, controls);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);

      const cleanup = () => {
        overlay.remove();
        document.body.classList.remove("signing-lock-scroll");
      };

      cancelBtn.addEventListener("click", () => {
        cleanup();
        reject(new Error("Signature is required to submit this form."));
      });

      submitBtn.addEventListener("click", () => {
        const printedName = String(block.querySelector(`[name="${printedNameName}"]`)?.value || "").trim();
        const consentAccepted = Boolean(block.querySelector(`[name="${consentName}"]`)?.checked);
        const signatureData = String(block.querySelector(`[name="${signatureDataName}"]`)?.value || "").trim();
        const signatureMethod = String(block.querySelector(`[name="${signatureMethodName}"]`)?.value || "").trim();
        const typedSignature = String(block.querySelector(`[name="${typedSignatureName}"]`)?.value || "").trim();

        if (!printedName) {
          status.textContent = "Printed name is required.";
          return;
        }
        if (!consentAccepted) {
          status.textContent = "You must accept electronic consent to continue.";
          return;
        }
        if (!signatureData || (signatureMethod !== "drawn" && signatureMethod !== "typed")) {
          status.textContent = "A typed or drawn signature is required.";
          return;
        }
        if (signatureMethod === "typed" && !typedSignature) {
          status.textContent = "Type your full legal name as your signature.";
          return;
        }

        cleanup();
        resolve({
          printedName,
          consentAccepted,
          signatureData,
          signatureMethod,
          typedSignature,
        });
      });
    });
  }

  function collectCoachingData() {
    return {
      ...collectVolunteerData(),
      coachHasExperience: getTextValue("coachHasExperience"),
      coachExperienceSummary: getTextValue("coachExperienceSummary"),
      coachAvailability: getCheckedValues("coachAvailability"),
      ref1Name: getTextValue("coachRef1Name"),
      ref1Relationship: getTextValue("coachRef1Relationship"),
      ref1Phone: getTextValue("coachRef1Phone"),
      ref1Email: getTextValue("coachRef1Email"),
      coachCertifications: getCheckedValues("coachCertifications"),
      coachBackgroundConsent: getCheckboxValue("coachBackgroundConsent"),
      coachSignature: getTextValue("coachSignature"),
    };
  }

  async function generatePlayerAgreement(registrationData) {
    if (playerAgreementSigned) return;

    const viewedAtUtc = new Date().toISOString();
    const printedName = `${registrationData.parent.firstName} ${registrationData.parent.lastName}`.trim();

    const payload = {
      agreementType: "player",
      formType: "mls_registration",
      submissionId: registrationData.registrationSubmissionId,
      transactionId: playerAgreementTransactionId || undefined,
      signer: {
        printedName,
      },
      audit: {
        viewedAtUtc,
        consentVersion: E_CONSENT_TEXT_VERSION,
      },
      fields: {
        registrationSubmissionId: registrationData.registrationSubmissionId,
        allResponseRows: buildRegistrationEmailResponseRows(registrationData),
        printedFullName: printedName,
        relationshipToChild: "Parent/Legal Guardian",
        participantNames: registrationData.players
          .map((p) => `${p.firstName} ${p.lastName}`.trim())
          .filter(Boolean)
          .join(", "),
        primaryPhone: registrationData.parent.phone,
        alternatePhone: registrationData.emergency?.sameAsParent ? "" : registrationData.emergency?.phone || "",
        parentStreet: registrationData.parent.street,
        parentCity: registrationData.parent.city,
        parentState: registrationData.parent.state,
        parentZip: registrationData.parent.zip,
        parentEmail: registrationData.parent.email,
        parentPhone: registrationData.parent.phone,
        guardianName: `${registrationData.parent.firstName} ${registrationData.parent.lastName}`.trim(),
        guardianDob: registrationData.parent.dob,
        guardianStreet: registrationData.parent.street,
        guardianCity: registrationData.parent.city,
        guardianState: registrationData.parent.state,
        guardianZip: registrationData.parent.zip,
        guardianPhone: registrationData.parent.phone,
        guardianEmail: registrationData.parent.email,
        emergencyContactName: registrationData.emergency?.sameAsParent
          ? `${registrationData.parent.firstName} ${registrationData.parent.lastName}`.trim()
          : `${registrationData.emergency?.firstName || ""} ${registrationData.emergency?.lastName || ""}`.trim(),
        emergencyRelationship: registrationData.emergency?.sameAsParent
          ? "Same as parent/guardian"
          : registrationData.emergency?.relationship || "",
        emergencyEmail: registrationData.emergency?.sameAsParent
          ? registrationData.parent.email
          : registrationData.emergency?.email || "",
        emergencyPhone: registrationData.emergency?.sameAsParent
          ? registrationData.parent.phone
          : registrationData.emergency?.phone || "",
        emergencyStreet: registrationData.emergency?.sameAsParent
          ? registrationData.parent.street
          : registrationData.emergency?.street || "",
        emergencyCity: registrationData.emergency?.sameAsParent
          ? registrationData.parent.city
          : registrationData.emergency?.city || "",
        emergencyState: registrationData.emergency?.sameAsParent
          ? registrationData.parent.state
          : registrationData.emergency?.state || "",
        emergencyZip: registrationData.emergency?.sameAsParent
          ? registrationData.parent.zip
          : registrationData.emergency?.zip || "",
        signingDate: viewedAtUtc.slice(0, 10),
      },
    };

    const res = await fetch(SIGNING_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(resolveAgreementRequestError(result, "Player agreement document generation failed."));
    }
    playerAgreementTransactionId = result.transactionId || playerAgreementTransactionId;
    playerAgreementDownloadUrl = result.emailDownloadUrl || result.signerDownloadUrl || playerAgreementDownloadUrl;
    if (result?.sheetUpdate && result.sheetUpdate.ok === false) {
      throw new Error("We couldn’t record your Player Agreement. Your previous information is saved. Please select Retry to continue.");
    }
    playerAgreementSigned = true;
  }

  async function generateVolunteerAgreement(data, formType, submissionId) {
    if (volunteerAgreementSigned) return;
    const viewedAtUtc = new Date().toISOString();
    const printedName = `${data.firstName} ${data.lastName}`.trim();

    const payload = {
      agreementType: "volunteer",
      formType,
      submissionId,
      transactionId: volunteerAgreementTransactionId || undefined,
      signer: {
        printedName,
        ageYears: calculateAgeYears(data.dob),
      },
      audit: {
        viewedAtUtc,
        consentVersion: E_CONSENT_TEXT_VERSION,
      },
      fields: {
        legalName: printedName,
        signingDate: viewedAtUtc.slice(0, 10),
      },
    };

    const res = await fetch(SIGNING_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(resolveAgreementRequestError(result, "Volunteer agreement document generation failed."));
    }
    volunteerAgreementTransactionId = result.transactionId || volunteerAgreementTransactionId;
    volunteerAgreementDownloadUrl = result.emailDownloadUrl || result.signerDownloadUrl || volunteerAgreementDownloadUrl;
    if (result?.sheetUpdate && result.sheetUpdate.ok === false) {
      throw new Error("We couldn’t record your Volunteer Agreement. Your previous information is saved. Please select Retry to continue.");
    }
    volunteerAgreementSigned = true;
  }

  function calculateAgeYears(isoDate) {
    if (!isoDate) return 0;
    const dob = new Date(isoDate);
    if (Number.isNaN(dob.getTime())) return 0;
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
    return age;
  }

  function resolveAgreementRequestError(payload, fallbackMessage) {
    const sheetUpdateError = String(payload?.sheetUpdate?.error || "").trim();
    const primaryError = String(payload?.error || "").trim();
    return sheetUpdateError || primaryError || fallbackMessage;
  }

  function generateSubmissionId(prefix) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  function splitLegalName(fullName) {
    const normalized = String(fullName || "").trim().replace(/\s+/g, " ");
    if (!normalized) return { firstName: "", lastName: "" };
    const parts = normalized.split(" ");
    if (parts.length === 1) return { firstName: parts[0], lastName: "" };
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(" "),
    };
  }

  function syncParentIdentityFromAgreement(registrationData) {
    const printed = registrationData?.agreementSigning?.printedName || "";
    if (!printed.trim()) return;
    const parsed = splitLegalName(printed);
    if (parsed.firstName) {
      registrationData.parent.firstName = parsed.firstName;
      setValue("parentFirstName", parsed.firstName);
    }
    if (parsed.lastName) {
      registrationData.parent.lastName = parsed.lastName;
      setValue("parentLastName", parsed.lastName);
    }
  }

  function syncVolunteerIdentityFromAgreement(data) {
    const printed = data?.agreementSigning?.printedName || "";
    if (!printed.trim()) return;
    const parsed = splitLegalName(printed);
    if (parsed.firstName) {
      data.firstName = parsed.firstName;
      setValue("volFirstName", parsed.firstName);
    }
    if (parsed.lastName) {
      data.lastName = parsed.lastName;
      setValue("volLastName", parsed.lastName);
    }
  }

  async function postFormResponse(params) {
    await fetchWithTimeout(FORM_ACTION, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: params.toString(),
    }, 6000);
  }

  async function sendFinalConfirmationEmail() {
    const descriptor = getFlowDescriptor(getFlowOptions());
    const participantNames = getParticipantNames(completedRegistrationData);
    const applicantFirstName = completedRegistrationData?.parent?.firstName || completedVolunteerData?.firstName || completedCoachingData?.firstName || "";
    const applicantLastName = completedRegistrationData?.parent?.lastName || completedVolunteerData?.lastName || completedCoachingData?.lastName || "";
    const recipientEmail = completedRegistrationData?.parent?.email || completedVolunteerData?.email || completedCoachingData?.email || "";
    const submissionId = registrationSubmissionId || volunteerSubmissionId || coachingSubmissionId;
    const paymentUrl = descriptor.paymentRequired ? buildPaymentRedirectUrl(completedRegistrationData) : "";
    const signedDocumentUrls = [];

    if (playerAgreementDownloadUrl) {
      signedDocumentUrls.push({ label: "Player Agreement", url: playerAgreementDownloadUrl });
    }
    if (volunteerAgreementDownloadUrl) {
      signedDocumentUrls.push({ label: "Volunteer Agreement", url: volunteerAgreementDownloadUrl });
    }

    const res = await fetchWithTimeout(FINAL_CONFIRMATION_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        submissionId,
        registrationSubmissionId,
        volunteerSubmissionId,
        coachingSubmissionId,
        emailType: descriptor.emailType,
        applicantFirstName,
        applicantLastName,
        recipientEmail,
        participantNames,
        formsRecorded: descriptor.formsRecorded,
        agreementsRecorded: descriptor.agreementsRecorded,
        scholarshipRequested: completedRegistrationData?.scholarship?.requested || "No",
        paymentRequired: descriptor.paymentRequired,
        paymentUrl,
        paymentAmount: descriptor.paymentRequired ? String(calculateRegistrationFeeAmount()) : "",
        signedDocumentUrls,
        sourceUrl: window.location.href,
      }),
    }, FINAL_CONFIRMATION_TIMEOUT_MS);

    const payload = await res.json().catch(() => null);
    if (!res.ok || !payload?.ok) {
      throw new Error(String(payload?.error || `Final confirmation email failed (${res.status})`).trim());
    }

    return payload.result || { sent: true };
  }

  async function postRegistrationCopy(data) {
    const values = {
      defer_confirmation_email: "yes",
      registration_submission_id: data.registrationSubmissionId || "",
      submitted_at: data.submittedAt,
      page_url: data.pageUrl,
      parent_first_name: data.parent.firstName,
      parent_last_name: data.parent.lastName,
      parent_email: data.parent.email,
      parent_phone: data.parent.phone,
      parent_guardian_dob: data.parent.dob,
      parent_street: data.parent.street,
      parent_apt: data.parent.apt,
      parent_city: data.parent.city,
      parent_state: data.parent.state,
      parent_zip: data.parent.zip,
      emergency_same_as_parent: data.emergency.sameAsParent ? "yes" : "no",
      emergency_first_name: data.emergency.firstName,
      emergency_last_name: data.emergency.lastName,
      emergency_relationship: data.emergency.relationship,
      emergency_email: data.emergency.email,
      emergency_phone: data.emergency.phone,
      emergency_street: data.emergency.street,
      emergency_apt: data.emergency.apt,
      emergency_city: data.emergency.city,
      emergency_state: data.emergency.state,
      emergency_zip: data.emergency.zip,
      player_count: String(data.players.length),
      scholarship_requested: String(data.scholarship?.requested || "No"),
      help_choice: data.helpChoice,
      agree_waiver: data.agreements.waiver ? "yes" : "no",
      agree_privacy: data.agreements.privacy ? "yes" : "no",
      agree_marketing: data.agreements.marketing ? "yes" : "no",
      signature: data.signature,
    };

    data.players.forEach((player, index) => {
      const prefix = `player_${index + 1}`;
      values[`${prefix}_first_name`] = player.firstName;
      values[`${prefix}_last_name`] = player.lastName;
      values[`${prefix}_dob`] = player.dob;
      values[`${prefix}_gender`] = player.gender;
      values[`${prefix}_grade`] = player.grade;
      values[`${prefix}_jersey`] = player.jersey;
      values[`${prefix}_shorts`] = player.shorts;
      values[`${prefix}_socks`] = player.socks;
      values[`${prefix}_race`] = player.race;
      values[`${prefix}_race_other`] = player.raceOther;
      values[`${prefix}_favorite_club`] = player.favoriteClub;
      values[`${prefix}_hear_about`] = player.hearAbout;
      values[`${prefix}_add_another`] = player.addAnother;
    });

    await postUpsertViaWorker("mls_registration", values);
  }

  async function postScholarshipCopy(registrationData) {
    const scholarship = registrationData?.scholarship || {};
    const requested = String(scholarship.requested || "No").trim();
    if (!isScholarshipRequested(requested)) {
      return;
    }

    const participantNames = getParticipantNames(registrationData);

    const values = {
      defer_confirmation_email: "yes",
      submitted_at: registrationData.submittedAt,
      registration_submission_id: registrationData.registrationSubmissionId || "",
      page_url: registrationData.pageUrl,
      parent_first_name: registrationData.parent?.firstName || "",
      parent_last_name: registrationData.parent?.lastName || "",
      parent_email: registrationData.parent?.email || "",
      parent_phone: registrationData.parent?.phone || "",
      scholarship_requested: requested,
      scholarship_level: scholarship.level || "",
      scholarship_household_size: scholarship.householdSize || "",
      scholarship_household_income: scholarship.householdIncome || "",
      scholarship_eligibility: Array.isArray(scholarship.eligibility) ? scholarship.eligibility.join(", ") : "",
      scholarship_circumstances: scholarship.circumstances || "",
      scholarship_contribution_amount: scholarship.contributionAmount || "",
      scholarship_participation_commitment: scholarship.participationCommitment ? "yes" : "no",
      scholarship_parent_acknowledgement: scholarship.parentAcknowledgement ? "yes" : "no",
      scholarship_guidelines_accepted: scholarship.guidelinesAccepted ? "yes" : "no",
      participant_names: participantNames.join(", "),
    };

    await postAuxFlow("scholarship_application", values);
  }

  async function postAuxFlow(formType, data) {
    await postUpsertViaWorker(formType, data);
  }

  async function postUpsertViaWorker(formType, values) {
    let res;
    let payload = null;
    let error = "";

    try {
      res = await fetchWithTimeout(FORM_UPSERT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          formType,
          values: {
            ...values,
            defer_confirmation_email: values?.defer_confirmation_email || "yes",
          },
        }),
      }, FORM_UPSERT_TIMEOUT_MS);
      payload = await res.json().catch(() => null);
      if (!res.ok || !payload?.ok) {
        error = String(payload?.error || `Form upsert failed (${res.status})`).trim();
      }
    } catch (err) {
      error = String(err?.message || err || "Form upsert request failed").trim();
    }

    if (!error) return;

    if (payload?.details) {
      console.warn("worker-upsert-failed", {
        formType,
        error,
        details: payload.details,
      });
    }

    throw new Error(error || "Form upsert failed");
  }

  async function postUpsertDirect(formType, values) {
    const params = new URLSearchParams();
    params.append("form_type", formType);

    Object.entries(values || {}).forEach(([key, value]) => {
      if (!key) return;
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        if (value.length) params.append(key, value.join(", "));
      return;
    }
      if (typeof value === "object") return;
      const text = String(value).trim();
      if (text) params.append(key, text);
    });

    await fetchWithTimeout(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: params.toString(),
    }, 5000);
  }

  async function fetchWithTimeout(url, init, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort("Request timeout"), timeoutMs);
    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function getCheckedValues(groupName) {
    return Array.from(form.querySelectorAll(`input[name="${groupName}[]"]:checked`)).map(
      (input) => input.value,
    );
  }

  function appendValue(params, key, value) {
    if (value === undefined || value === null) return;
    if (typeof value === "string" && !value.trim()) return;
    params.append(key, String(value));
  }

  function getTextValue(name) {
    const element = form.elements.namedItem(name);
    if (!element) return "";
    if (element instanceof RadioNodeList) return element[0]?.value || "";
    return element.value || "";
  }

  function getCheckboxValue(name) {
    const element = form.elements.namedItem(name);
    if (!element) return false;
    if (element instanceof RadioNodeList) return Boolean(element[0]?.checked);
    if (element instanceof HTMLInputElement) return Boolean(element.checked);
    return false;
  }

  function selectedPlayerCount() {
    if (getTextValue("addPlayer2") !== "Yes") return 1;
    if (getTextValue("addPlayer3") !== "Yes") return 2;
    if (getTextValue("addPlayer4") !== "Yes") return 3;
    return 4;
  }

  function appendIfPresent(params, entryId, value) {
    if (!entryId) return;
    if (value === undefined || value === null) return;
    if (typeof value === "string" && !value.trim()) return;
    params.append(`entry.${entryId}`, String(value));
  }

  function syncConditionalFields(controllerName, controllerValue) {
    form.querySelectorAll(`[data-conditional-on="${controllerName}"]`).forEach((field) => {
      const expectedValue = field.dataset.conditionalValue;
      const match = controllerValue === expectedValue;
      const fieldWrap = field.closest(".field-group");
      if (fieldWrap) fieldWrap.classList.toggle("hidden", !match);
    });
  }

  function formatPhoneField(input) {
    const digits = input.value.replace(/\D/g, "").slice(0, 10);
    let formatted = digits;
    if (digits.length > 6) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length > 3) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length > 0) {
      formatted = `(${digits}`;
    }
    input.value = formatted;
  }

  function isValidDobValue(value) {
    const text = String(value || "").trim();
    if (!text) return false;

    const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return false;

    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);

    if (!Number.isInteger(month) || !Number.isInteger(day) || !Number.isInteger(year)) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }

  function validateDobField(input) {
    if (!(input instanceof HTMLInputElement)) return;
    if (!input.value || !String(input.value).trim()) {
      input.setCustomValidity("");
      return;
    }

    if (!isValidDobValue(input.value)) {
      input.setCustomValidity("Please enter a valid date in MM/DD/YYYY format.");
      return;
    }

    input.setCustomValidity("");
  }

  function formatDobField(input) {
    const digits = input.value.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

    input.value = formatted;
    validateDobField(input);

    if (digits.length >= 8) {
      window.setTimeout(() => {
        const wrap = input.closest(".field-group");
        const nextField = wrap?.nextElementSibling?.querySelector("input, select, textarea");
        if (nextField && typeof nextField.focus === "function") nextField.focus();
      }, 0);
    }
  }

  function fetchGoogleMapsApiKey() {
    if (googleMapsApiKeyPromise) return googleMapsApiKeyPromise;

    googleMapsApiKeyPromise = (async () => {
      if (GOOGLE_MAPS_API_KEY_META) {
        return GOOGLE_MAPS_API_KEY_META;
      }

      try {
        const res = await fetch(PUBLIC_CONFIG_ENDPOINT, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "omit",
          cache: "no-store",
        });
        if (res.ok) {
          const payload = await res.json().catch(() => null);
          const key = typeof payload?.googleMapsApiKey === "string"
            ? payload.googleMapsApiKey.trim()
            : "";
          if (key) return key;
        }
      } catch (_error) {
        // Address autocomplete remains disabled when config lookup fails.
      }

      return "";
    })();

    return googleMapsApiKeyPromise;
  }

  async function loadGooglePlacesScript() {
    if (window.google?.maps?.places) {
      return true;
    }

    const key = await fetchGoogleMapsApiKey();
    if (!key) return false;

    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-google-places="true"]');
      if (existing) {
        if (window.google?.maps?.places || existing.dataset.loaded === "true") {
          resolve(true);
          return;
        }
        existing.addEventListener("load", () => resolve(true), { once: true });
        existing.addEventListener("error", () => reject(new Error("Google Places failed to load")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.dataset.googlePlaces = "true";
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&loading=async`;
      script.onload = () => {
        script.dataset.loaded = "true";
        resolve(true);
      };
      script.onerror = () => reject(new Error("Google Places failed to load"));
      document.head.appendChild(script);
    });
  }

  async function initAddressAutocomplete() {
    try {
      const loaded = await loadGooglePlacesScript();
      if (!loaded || !window.google?.maps?.places) return;

      const access = await checkPlacesAccess();
      if (!access.ok) {
        if (formMessage && !formMessage.textContent) {
          formMessage.textContent = access.message;
        }
        return;
      }

      const addressFields = Array.from(form.querySelectorAll('[data-address-field="true"]'));
      addressFields.forEach((input) => {
        const autocomplete = new google.maps.places.Autocomplete(input, {
          types: ["address"],
          fields: ["address_components"],
          componentRestrictions: { country: "us" },
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.address_components) return;

          const parsed = parsePlaceAddress(place.address_components);
          const prefix = input.name.startsWith("emergency")
            ? "emergency"
            : input.name.startsWith("vol")
              ? "vol"
              : "parent";

          if (parsed.street) setValue(`${prefix}Street`, parsed.street);
          if (parsed.city) setValue(`${prefix}City`, parsed.city);
          if (parsed.state) setValue(`${prefix}State`, parsed.state);
          if (parsed.zip) setValue(`${prefix}Zip`, parsed.zip);
        });
      });
    } catch (error) {
      console.warn("Address autocomplete unavailable", error);
      if (formMessage && !formMessage.textContent) {
        formMessage.textContent =
          "Address autocomplete is temporarily unavailable. Please enter address fields manually.";
      }
    }
  }

  async function checkPlacesAccess() {
    const deniedMessage =
      "Address autocomplete is unavailable because Google Maps billing is not enabled for the configured API key. Enable billing for that Google Cloud project, then refresh this page.";

    return new Promise((resolve) => {
      try {
        const svc = new google.maps.places.AutocompleteService();
        svc.getPlacePredictions(
          {
            input: "1600 Pennsylvania Ave NW",
            componentRestrictions: { country: "us" },
          },
          (_predictions, status) => {
            if (status === "OK" || status === "ZERO_RESULTS") {
              resolve({ ok: true, message: "" });
              return;
            }

            if (status === "REQUEST_DENIED") {
              resolve({ ok: false, message: deniedMessage });
              return;
            }

            resolve({
              ok: false,
              message:
                "Address autocomplete is temporarily unavailable. Please enter address fields manually.",
            });
          },
        );
      } catch (_error) {
        resolve({
          ok: false,
          message:
            "Address autocomplete is temporarily unavailable. Please enter address fields manually.",
        });
      }
    });
  }

  function setValue(name, value) {
    const field = form.elements.namedItem(name);
    if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
      field.value = value;
    }
  }

  function parsePlaceAddress(components) {
    const result = { street: "", city: "", state: "", zip: "" };
    const lookup = (type) => components.find((component) => component.types.includes(type));
    const streetNumber = lookup("street_number")?.long_name || "";
    const route = lookup("route")?.long_name || "";
    result.street = [streetNumber, route].filter(Boolean).join(" ");
    result.city =
      lookup("locality")?.long_name ||
      lookup("postal_town")?.long_name ||
      lookup("administrative_area_level_2")?.long_name ||
      "";
    result.state =
      lookup("administrative_area_level_1")?.short_name ||
      lookup("administrative_area_level_1")?.long_name ||
      "";
    result.zip = lookup("postal_code")?.long_name || "";
    return result;
  }
})();
