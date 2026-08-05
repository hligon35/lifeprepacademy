(function () {
  const FORM_ACTION =
    "https://docs.google.com/forms/d/e/1FAIpQLScCUTOgeNb7shvYUrpjbNKn5kh_K_U3tEwks8aJ4zvbXFKWLw/formResponse";
  const FBZX = "-3891024944817654155";
  const GOOGLE_MAPS_API_KEY =
    document.querySelector('meta[name="google-maps-api-key"]')?.content.trim() || "";
  const GOOGLE_APPS_SCRIPT_URL =
    document.querySelector('meta[name="google-apps-script-url"]')?.content.trim() || "";
  const AGREEMENT_PDF_PATH = "./documents/MLS-GO-Data-Requirements.pdf";

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
        "Complete player registration first. You can optionally continue into volunteer or coaching after submission.",
      progressLabel: "Player registration",
      submitLabel: "Submit Registration",
    },
    [FLOW.VOLUNTEER]: {
      title: "Volunteer Application",
      subtitle:
        "Complete the volunteer intake. Your previous registration data stays in memory only for this browser session.",
      progressLabel: "Volunteer application",
      submitLabel: "Submit Volunteer Application",
    },
    [FLOW.COACH]: {
      title: "Coaching Application",
      subtitle:
        "Complete volunteer intake and coaching supplements for coaching consideration.",
      progressLabel: "Coaching application",
      submitLabel: "Submit Coaching Application",
    },
    coachSupplement: {
      title: "Coaching Application",
      subtitle:
        "Volunteer intake is complete. Finish the coaching supplement.",
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
  const backBtn = document.getElementById("back-btn");
  const nextBtn = document.getElementById("next-btn");
  const skipBtn = document.getElementById("skip-btn");
  const progressFill = document.getElementById("progress-fill");
  const progressText = document.getElementById("progress-text");
  const successPanel = document.getElementById("success-panel");

  const playerToggleNames = ["addPlayer2", "addPlayer3", "addPlayer4"];
  const standaloneFlow = parseStandaloneFlow();

  let activeFlow = standaloneFlow || FLOW.PLAYER;
  let followUpPlan = "none";
  let activeSectionIndex = 0;
  let playerSubmitted = Boolean(standaloneFlow);
  let volunteerSubmitted = false;
  let coachingSubmitted = false;
  let completedRegistrationData = null;

  buildPage();
  wireEvents();
  updateFlowMeta();
  applyVisibility();
  renderWizard();
  initAddressAutocomplete();

  function parseStandaloneFlow() {
    const value = new URLSearchParams(window.location.search).get("flow");
    if (value === "volunteer") return FLOW.VOLUNTEER;
    if (value === "coach") return FLOW.COACH;
    return null;
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
      buildHelpSection(),
      buildAgreementsSection(),
      buildVolunteerContactSection(),
      buildVolunteerRoleSection(),
      buildVolunteerExperienceSection(),
      buildVolunteerAgreementSection(),
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
        createTextField({ label: "Parent/guardian first name", name: "parentFirstName", required: true }),
        createTextField({ label: "Parent/guardian last name", name: "parentLastName", required: true }),
        createTextField({ label: "Parent/guardian email", name: "parentEmail", required: true, type: "email", autocomplete: "email" }),
        createTextField({ label: "Parent/guardian cell phone", name: "parentPhone", required: true, type: "tel", inputMode: "tel", autocomplete: "tel" }),
        createTextField({ label: "Street address", name: "parentStreet", required: true, autocomplete: "street-address", addressField: true, placeholder: "Start typing the address" }),
        createTextField({ label: "Apartment, suite, or unit", name: "parentApt", autocomplete: "address-line2" }),
        createTextField({ label: "City", name: "parentCity", required: true, autocomplete: "address-level2" }),
        createTextField({ label: "State", name: "parentState", required: true, autocomplete: "address-level1" }),
        createTextField({ label: "ZIP code", name: "parentZip", required: true, inputMode: "numeric", autocomplete: "postal-code" }),
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
      label: "Emergency contact is the same as the parent/guardian",
      name: "emergencySameAsParent",
      checked: true,
    });

    const fields = document.createElement("div");
    fields.className = "hidden";
    fields.dataset.emergencyFields = "true";
    fields.append(
      createGrid([
        createTextField({ label: "Emergency contact first name", name: "emergencyFirstName" }),
        createTextField({ label: "Emergency contact last name", name: "emergencyLastName" }),
        createTextField({ label: "Relationship", name: "emergencyRelationship", placeholder: "Grandparent, aunt, coach, etc." }),
        createTextField({ label: "Emergency contact email", name: "emergencyEmail", type: "email", autocomplete: "email" }),
        createTextField({ label: "Emergency contact phone", name: "emergencyPhone", type: "tel", inputMode: "tel", autocomplete: "tel" }),
        createTextField({ label: "Street address", name: "emergencyStreet", autocomplete: "street-address", addressField: true, placeholder: "Start typing the address" }),
        createTextField({ label: "Apartment, suite, or unit", name: "emergencyApt", autocomplete: "address-line2" }),
        createTextField({ label: "City", name: "emergencyCity", autocomplete: "address-level2" }),
        createTextField({ label: "State", name: "emergencyState", autocomplete: "address-level1" }),
        createTextField({ label: "ZIP code", name: "emergencyZip", inputMode: "numeric", autocomplete: "postal-code" }),
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
      createTextField({ label: `Player ${playerIndex} - first name`, name: `p${playerIndex}FirstName`, required: true }),
      createTextField({ label: `Player ${playerIndex} - last name`, name: `p${playerIndex}LastName`, required: true }),
      createTextField({ label: `Player ${playerIndex} - date of birth`, name: `p${playerIndex}Dob`, required: true, type: "date" }),
      createSelectField({ label: `Player ${playerIndex} - gender identity`, name: `p${playerIndex}Gender`, required: true, options: ["Female", "Male", "Non-binary", "Prefer not to specify"] }),
      createSelectField({ label: `Player ${playerIndex} - grade`, name: `p${playerIndex}Grade`, required: true, options: ["Pre-K", "Kindergarten", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"] }),
      createSelectField({ label: `Player ${playerIndex} - jersey size`, name: `p${playerIndex}Jersey`, required: true, options: ["YXXS", "YXS", "YS", "YM", "YL", "YXL/AS", "AM", "AL", "AXL"] }),
      createSelectField({ label: `Player ${playerIndex} - shorts size`, name: `p${playerIndex}Shorts`, required: true, options: ["YXXS", "YXS", "YS", "YM", "YL", "YXL/AS", "AM", "AL", "AXL"] }),
      createSelectField({ label: `Player ${playerIndex} - sock size`, name: `p${playerIndex}Socks`, required: true, options: ["YS/YM", "YL/YXL", "A"] }),
      createSelectField({
        label: `Player ${playerIndex} - race/ethnicity`,
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
      createTextField({ label: `Player ${playerIndex} - race/ethnicity - if Other, please specify`, name: `p${playerIndex}RaceOther`, conditionalOn: `p${playerIndex}Race`, conditionalValue: "Other (write in)" }),
      createSelectField({ label: `Player ${playerIndex} - favorite MLS club`, name: `p${playerIndex}FavoriteClub`, required: true, options: CLUB_OPTIONS }),
      createSelectField({ label: `Player ${playerIndex} - how did you hear about MLS GO?`, name: `p${playerIndex}HearAbout`, required: true, options: HEAR_ABOUT_OPTIONS }),
    ]);

    section.append(grid);

    if (playerIndex < 4) {
      const toggleName = `addPlayer${playerIndex + 1}`;
      const toggle = createSelectField({
        label: "Would you like to register another player?",
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
        label: "Would you like to help with the program?",
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
      "Review and accept the required program terms before submitting.",
      false,
      "agreements-section",
      FLOW.PLAYER,
    );

    const grid = createGrid([
      createCheckboxField({
        label: "MLS GO Player Registration Agreement and Waiver",
        name: "agreeWaiver",
        required: true,
        description:
          "I have read and understand the MLS GO Player Registration Agreement and Waiver, accept its terms for myself and every participant listed in this registration, and intend to be legally bound.",
        links: [
          {
            href: AGREEMENT_PDF_PATH,
            text: "View official MLS GO Data Requirements (PDF)",
          },
        ],
      }),
      createCheckboxField({
        label: "MLS GO Privacy Policy and Terms of Service",
        name: "agreePrivacy",
        required: true,
        description:
          "I agree to the Terms of Service and consent to the use of my information in accordance with the Privacy Policy.",
        links: [
          {
            href: AGREEMENT_PDF_PATH,
            text: "Review required policy document (PDF)",
          },
        ],
      }),
      createCheckboxField({
        label: "MLS GO Marketing Opt-In",
        name: "agreeMarketing",
        description:
          "I agree that MLS GO, Major League Soccer, the MLS Clubs, Soccer United Marketing, MLS NEXT Pro, MLS NEXT and each of their respective clubs, affiliates and partners, can use my information to send me newsletters, offers, additional information and other communications about their products and initiatives in accordance with the Privacy Policy and Terms of Use.",
      }),
      createTextField({ label: "Electronic signature - parent/legal guardian full name", name: "signature", required: true }),
    ]);
    grid.classList.add("form-grid--one");
    section.append(grid);
    return section;
  }

  function buildVolunteerContactSection() {
    const section = createSection(
      "Volunteer Contact",
      "Tell us how to reach you about volunteer opportunities.",
      false,
      "volunteer-contact-section",
      FLOW.VOLUNTEER,
    );
    section.append(
      createGrid([
        createTextField({ label: "First name", name: "volFirstName", required: true, autocomplete: "given-name" }),
        createTextField({ label: "Last name", name: "volLastName", required: true, autocomplete: "family-name" }),
        createTextField({ label: "Email", name: "volEmail", required: true, type: "email", autocomplete: "email" }),
        createTextField({ label: "Phone", name: "volPhone", required: true, type: "tel", inputMode: "tel", autocomplete: "tel" }),
        createTextField({ label: "Street address", name: "volStreet", required: true, autocomplete: "street-address", addressField: true }),
        createTextField({ label: "Apartment, suite, or unit", name: "volApt", autocomplete: "address-line2" }),
        createTextField({ label: "City", name: "volCity", required: true, autocomplete: "address-level2" }),
        createTextField({ label: "State", name: "volState", required: true, autocomplete: "address-level1" }),
        createTextField({ label: "ZIP code", name: "volZip", required: true, inputMode: "numeric", autocomplete: "postal-code" }),
      ]),
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
        label: "Volunteer interests",
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
        label: "Have you volunteered with youth sports before?",
        name: "volHasExperience",
        required: true,
        options: ["Yes", "No"],
      }),
      createTextField({
        label: "Experience summary",
        name: "volExperienceSummary",
        required: true,
        placeholder: "Share clubs, roles, and years of experience",
      }),
      createTextField({
        label: "Best days/times",
        name: "volAvailabilityNotes",
        required: true,
        placeholder: "Weeknights, Saturday mornings, etc.",
      }),
    ]);

    section.append(grid);
    return section;
  }

  function buildVolunteerAgreementSection() {
    const section = createSection(
      "Volunteer Agreement",
      "Confirm your interest and submit your volunteer intake.",
      false,
      "volunteer-agreement-section",
      FLOW.VOLUNTEER,
    );

    const grid = createGrid([
      createCheckboxField({
        label: "Volunteer commitment acknowledgement",
        name: "volAgreement",
        required: true,
        description:
          "I understand volunteer placement is based on program needs and completion of required onboarding steps.",
      }),
      createTextField({
        label: "Volunteer signature (full name)",
        name: "volSignature",
        required: true,
      }),
    ]);
    grid.classList.add("form-grid--one");
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
          label: "Have you coached youth sports before?",
          name: "coachHasExperience",
          required: true,
          options: ["Yes", "No"],
        }),
        createTextField({
          label: "Coaching summary",
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
        label: "Available windows",
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
        createTextField({ label: "Reference 1 full name", name: "coachRef1Name", required: true }),
        createTextField({ label: "Reference 1 relationship", name: "coachRef1Relationship", required: true }),
        createTextField({ label: "Reference 1 phone", name: "coachRef1Phone", required: true, type: "tel", inputMode: "tel" }),
        createTextField({ label: "Reference 1 email", name: "coachRef1Email", required: true, type: "email" }),
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
        label: "Current certifications",
        name: "coachCertifications",
        options: [
          "First Aid / CPR",
          "Concussion training",
          "Safesport or equivalent",
          "None currently",
        ],
      }),
      createCheckboxField({
        label: "Background screening acknowledgement",
        name: "coachBackgroundConsent",
        required: true,
        description:
          "I understand coaching roles require background screening and compliance with program policies.",
      }),
      createTextField({
        label: "Coaching signature (full name)",
        name: "coachSignature",
        required: true,
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
    input.type = type;
    input.placeholder = placeholder || "";
    if (inputMode) input.inputMode = inputMode;
    if (autocomplete) input.autocomplete = autocomplete;
    if (required) input.required = true;

    if (addressField) input.dataset.addressField = "true";
    if (name.toLowerCase().includes("phone")) input.dataset.phoneField = "true";

    if (conditionalOn && conditionalValue) {
      input.dataset.conditionalOn = conditionalOn;
      input.dataset.conditionalValue = conditionalValue;
      wrap.classList.add("hidden");
    }

    wrap.appendChild(input);
    return wrap;
  }

  function createSelectField(options) {
    const { label, name, required = false, options: selectOptions } = options;
    const wrap = createFieldWrap(label, name, required);
    const select = document.createElement("select");
    select.id = name;
    select.name = name;
    if (required) select.required = true;

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
    const { label, name, required = false, description, links = [] } = options;
    const wrap = document.createElement("div");
    wrap.className = "field-group";

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

    const text = document.createElement("span");
    text.textContent = description || "I agree";

    choice.append(input, text);

    wrap.append(labelEl, choice);

    if (Array.isArray(links) && links.length > 0) {
      const linkRow = document.createElement("p");
      linkRow.className = "agreement-doc-links";

      links.forEach((linkData, index) => {
        const anchor = document.createElement("a");
        anchor.href = linkData.href;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.textContent = linkData.text;
        linkRow.appendChild(anchor);

        if (index < links.length - 1) {
          const separator = document.createElement("span");
          separator.textContent = " | ";
          linkRow.appendChild(separator);
        }
      });

      wrap.appendChild(linkRow);
    }

    return wrap;
  }

  function createCheckboxGroupField(options) {
    const { label, name, required = false, options: values } = options;
    const wrap = document.createElement("div");
    wrap.className = "field-group";
    if (required) wrap.dataset.requiredGroup = name;

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
    skipBtn?.addEventListener("click", skipAndFinish);

    form.addEventListener("input", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;

      if (target.dataset.phoneField === "true") formatPhoneField(target);

      if (target.name === "emergencySameAsParent") {
        const emergencyFields = form.querySelector('[data-emergency-fields="true"]');
        if (emergencyFields) emergencyFields.classList.toggle("hidden", target.checked);
      }

      if (target.name === "p1Race" || target.name === "p2Race" || target.name === "p3Race" || target.name === "p4Race") {
        syncConditionalFields(target.name, target.value);
      }

      if (playerToggleNames.includes(target.name)) {
        applyVisibility();
        renderWizard();
      }
    });

    form.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;
      if (playerToggleNames.includes(target.name) || target.name === "emergencySameAsParent") {
        applyVisibility();
        renderWizard();
      }
    });
  }

  function flowIncludes(sectionFlow) {
    const currentStage = getCurrentStageFlow();
    if (currentStage === FLOW.PLAYER) return sectionFlow === FLOW.PLAYER;
    if (currentStage === FLOW.VOLUNTEER) return sectionFlow === FLOW.VOLUNTEER;
    if (currentStage === FLOW.COACH) return sectionFlow === FLOW.VOLUNTEER || sectionFlow === FLOW.COACH;
    if (currentStage === "coachSupplement") return sectionFlow === FLOW.COACH;
    return false;
  }

  function getCurrentStageFlow() {
    if (activeFlow === FLOW.VOLUNTEER_AND_COACH) {
      return volunteerSubmitted ? "coachSupplement" : FLOW.VOLUNTEER;
    }
    return activeFlow;
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

  function getVisibleSections() {
    return Array.from(sectionsRoot.querySelectorAll(".form-section")).filter((section) => {
      const sectionFlow = section.dataset.flow;
      if (!flowIncludes(sectionFlow)) return false;
      if (sectionFlow === FLOW.PLAYER && !includePlayerSectionByCondition(section.id)) return false;
      if (section.classList.contains("hidden")) return false;
      return true;
    });
  }

  function getActiveSectionId() {
    const visible = getVisibleSections();
    return visible[activeSectionIndex]?.id || "";
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
    const pct = Math.max(1, Math.round((current / total) * 100));
    if (progressFill) progressFill.style.width = `${pct}%`;

    const stageFlow = getCurrentStageFlow();
    const meta = FLOW_META[stageFlow] || FLOW_META[FLOW.PLAYER];
    if (progressText) {
      progressText.textContent = `${meta.progressLabel} — Section ${current} of ${total}`;
    }

    if (backBtn) backBtn.disabled = activeSectionIndex === 0;
    if (nextBtn) {
      const isLast = activeSectionIndex === total - 1;
      nextBtn.textContent = isLast ? meta.submitLabel : "Next Section";
      nextBtn.disabled = false;
    }

    const allowSkip =
      !standaloneFlow &&
      (stageFlow === FLOW.VOLUNTEER || stageFlow === FLOW.COACH || stageFlow === "coachSupplement") &&
      !allSelectedFlowsCompleted();
    if (skipBtn) skipBtn.hidden = !allowSkip;
  }

  function updateFlowMeta() {
    const stageFlow = getCurrentStageFlow();
    const meta = FLOW_META[stageFlow] || FLOW_META[FLOW.PLAYER];
    if (formTitle) formTitle.textContent = meta.title;
    if (formSubtitle) formSubtitle.textContent = meta.subtitle;

    if (flowStatus) {
      const message = getFlowStatusMessage();
      flowStatus.hidden = !message;
      flowStatus.textContent = message;
    }
  }

  function getFlowStatusMessage() {
    const stageFlow = getCurrentStageFlow();
    if (stageFlow === FLOW.PLAYER) return "";
    if (standaloneFlow) return "Standalone application mode is active.";
    if (activeFlow === FLOW.VOLUNTEER_AND_COACH) {
      return volunteerSubmitted
        ? "Volunteer application submitted. Continue with the coaching supplement."
        : "Player registration is complete. Continue with optional volunteer intake first.";
    }
    if (stageFlow === FLOW.VOLUNTEER) {
      return playerSubmitted
        ? "Player registration is complete. You are now in optional volunteer follow-up."
        : "";
    }
    if (stageFlow === FLOW.COACH || stageFlow === "coachSupplement") {
      return playerSubmitted
        ? "Player registration is complete. You are now in optional coaching follow-up."
        : "";
    }
    return "";
  }

  function goBack() {
    if (activeSectionIndex > 0) {
      activeSectionIndex -= 1;
      formMessage.textContent = "";
      renderWizard();
    }
  }

  function goNext() {
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
      } else if (!field.value || !String(field.value).trim()) {
        return field;
      }
    }

    const groups = Array.from(section.querySelectorAll("[data-required-group]"));
    for (const group of groups) {
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
      if (backBtn) backBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      if (skipBtn) skipBtn.disabled = true;

      const stageFlow = getCurrentStageFlow();
      if (stageFlow === FLOW.PLAYER) {
        await submitPlayerRegistration();
      } else if (stageFlow === FLOW.VOLUNTEER) {
        await submitVolunteerApplication();
      } else if (stageFlow === FLOW.COACH || stageFlow === "coachSupplement") {
        await submitCoachingApplication();
      }
    } catch (error) {
      formMessage.textContent = "Submission failed. Please retry in a moment.";
    } finally {
      if (backBtn) backBtn.disabled = false;
      if (nextBtn) nextBtn.disabled = false;
      if (skipBtn) skipBtn.disabled = false;
      renderWizard();
    }
  }

  async function submitPlayerRegistration() {
    if (playerSubmitted) return;

    formMessage.textContent = "Submitting registration...";

    const registrationData = collectRegistrationData();
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
    appendIfPresent(params, AGREEMENT_ENTRY_MAP.signature, registrationData.signature);

    params.append("fvv", "1");
    params.append("draftResponse", "[]");
    params.append("pageHistory", "0");
    params.append("partialResponse", `[null,null,"${FBZX}"]`);
    params.append("fbzx", FBZX);

    const requests = [postFormResponse(params)];
    if (GOOGLE_APPS_SCRIPT_URL) requests.push(postRegistrationCopy(registrationData));
    await Promise.all(requests);

    completedRegistrationData = registrationData;
    playerSubmitted = true;

    const helpChoice = mapHelpChoice(getTextValue("helpChoice"));
    followUpPlan = helpChoice;

    if (helpChoice === HELP_OPTION.NO || standaloneFlow) {
      completeFlow("Registration received.");
      return;
    }

    if (helpChoice === HELP_OPTION.VOLUNTEER) {
      switchFlow(FLOW.VOLUNTEER, true);
      return;
    }

    if (helpChoice === HELP_OPTION.COACH) {
      switchFlow(FLOW.COACH, true);
      return;
    }

    if (helpChoice === HELP_OPTION.BOTH) {
      switchFlow(FLOW.VOLUNTEER_AND_COACH, true);
      return;
    }

    completeFlow("Registration received.");
  }

  async function submitVolunteerApplication() {
    if (volunteerSubmitted) {
      afterVolunteerSubmission();
      return;
    }

    formMessage.textContent = "Submitting volunteer application...";
    const data = collectVolunteerData();
    await postAuxFlow("volunteer_application", data);
    volunteerSubmitted = true;
    afterVolunteerSubmission();
  }

  function afterVolunteerSubmission() {
    if (activeFlow === FLOW.VOLUNTEER_AND_COACH && !coachingSubmitted) {
      activeSectionIndex = 0;
      updateFlowMeta();
      applyVisibility();
      renderWizard();
      formMessage.textContent = "";
      return;
    }
    completeFlow("Volunteer application received.");
  }

  async function submitCoachingApplication() {
    if (coachingSubmitted) {
      completeFlow("Coaching application received.");
      return;
    }

    formMessage.textContent = "Submitting coaching application...";
    const data = collectCoachingData();
    await postAuxFlow("coaching_application", data);
    coachingSubmitted = true;
    volunteerSubmitted = true;
    completeFlow("Coaching application received.");
  }

  function switchFlow(nextFlow, prefillVolunteer) {
    activeFlow = nextFlow;
    activeSectionIndex = 0;
    if (prefillVolunteer) prefillVolunteerContact();
    updateFlowMeta();
    applyVisibility();
    renderWizard();
    formMessage.textContent = "";
  }

  function skipAndFinish() {
    const stageFlow = getCurrentStageFlow();

    if (stageFlow === FLOW.VOLUNTEER) {
      completeFlow("Registration received. Volunteer step skipped.");
      return;
    }

    if (stageFlow === FLOW.COACH || stageFlow === "coachSupplement") {
      completeFlow("Registration received. Coaching step skipped.");
    }
  }

  function allSelectedFlowsCompleted() {
    if (activeFlow === FLOW.VOLUNTEER_AND_COACH) {
      return volunteerSubmitted && coachingSubmitted;
    }
    if (standaloneFlow === FLOW.VOLUNTEER) return volunteerSubmitted;
    if (standaloneFlow === FLOW.COACH) return coachingSubmitted;
    if (followUpPlan === HELP_OPTION.VOLUNTEER) return volunteerSubmitted;
    if (followUpPlan === HELP_OPTION.COACH) return coachingSubmitted;
    if (followUpPlan === HELP_OPTION.BOTH) return volunteerSubmitted && coachingSubmitted;
    return playerSubmitted;
  }

  function completeFlow(message) {
    activeFlow = FLOW.COMPLETE;
    Array.from(sectionsRoot.querySelectorAll(".form-section")).forEach((section) => {
      section.classList.remove("is-current");
    });

    if (progressFill) progressFill.style.width = "100%";
    if (progressText) progressText.textContent = "Complete";

    form.hidden = true;
    successPanel.hidden = false;
    formMessage.textContent = "";

    const heading = successPanel.querySelector("h2");
    const copy = successPanel.querySelector("p");
    if (heading) heading.textContent = "Submission Complete";
    if (copy) copy.textContent = message || "Thank you. Your submission was received.";
  }

  function prefillVolunteerContact() {
    const parent = completedRegistrationData?.parent;
    if (!parent) return;

    setIfEmpty("volFirstName", parent.firstName);
    setIfEmpty("volLastName", parent.lastName);
    setIfEmpty("volEmail", parent.email);
    setIfEmpty("volPhone", parent.phone);
    setIfEmpty("volStreet", parent.street);
    setIfEmpty("volApt", parent.apt);
    setIfEmpty("volCity", parent.city);
    setIfEmpty("volState", parent.state);
    setIfEmpty("volZip", parent.zip);
  }

  function setIfEmpty(name, value) {
    const field = form.elements.namedItem(name);
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
    if (field.value && field.value.trim()) return;
    field.value = value || "";
  }

  function mapHelpChoice(value) {
    if (value === "Volunteer") return HELP_OPTION.VOLUNTEER;
    if (value === "Apply to coach") return HELP_OPTION.COACH;
    if (value === "Volunteer and apply to coach") return HELP_OPTION.BOTH;
    return HELP_OPTION.NO;
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
      helpChoice: getTextValue("helpChoice"),
      agreements: {
        waiver: getCheckboxValue("agreeWaiver"),
        privacy: getCheckboxValue("agreePrivacy"),
        marketing: getCheckboxValue("agreeMarketing"),
      },
      signature: getTextValue("signature"),
    };
  }

  function collectVolunteerData() {
    return {
      submittedAt: new Date().toISOString(),
      pageUrl: window.location.href,
      firstName: getTextValue("volFirstName"),
      lastName: getTextValue("volLastName"),
      email: getTextValue("volEmail"),
      phone: getTextValue("volPhone"),
      street: getTextValue("volStreet"),
      apt: getTextValue("volApt"),
      city: getTextValue("volCity"),
      state: getTextValue("volState"),
      zip: getTextValue("volZip"),
      roles: getCheckedValues("volunteerRoles"),
      hasExperience: getTextValue("volHasExperience"),
      experienceSummary: getTextValue("volExperienceSummary"),
      availabilityNotes: getTextValue("volAvailabilityNotes"),
      agreement: getCheckboxValue("volAgreement"),
      signature: getTextValue("volSignature"),
      linkedParentEmail: completedRegistrationData?.parent?.email || "",
    };
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

  async function postFormResponse(params) {
    await fetch(FORM_ACTION, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: params.toString(),
    });
  }

  async function postRegistrationCopy(data) {
    const params = new URLSearchParams();
    params.append("form_type", "mls_registration");
    params.append("submitted_at", data.submittedAt);
    params.append("page_url", data.pageUrl);

    appendValue(params, "parent_first_name", data.parent.firstName);
    appendValue(params, "parent_last_name", data.parent.lastName);
    appendValue(params, "parent_email", data.parent.email);
    appendValue(params, "parent_phone", data.parent.phone);
    appendValue(params, "parent_street", data.parent.street);
    appendValue(params, "parent_apt", data.parent.apt);
    appendValue(params, "parent_city", data.parent.city);
    appendValue(params, "parent_state", data.parent.state);
    appendValue(params, "parent_zip", data.parent.zip);

    appendValue(params, "emergency_same_as_parent", data.emergency.sameAsParent ? "yes" : "no");
    appendValue(params, "emergency_first_name", data.emergency.firstName);
    appendValue(params, "emergency_last_name", data.emergency.lastName);
    appendValue(params, "emergency_relationship", data.emergency.relationship);
    appendValue(params, "emergency_email", data.emergency.email);
    appendValue(params, "emergency_phone", data.emergency.phone);
    appendValue(params, "emergency_street", data.emergency.street);
    appendValue(params, "emergency_apt", data.emergency.apt);
    appendValue(params, "emergency_city", data.emergency.city);
    appendValue(params, "emergency_state", data.emergency.state);
    appendValue(params, "emergency_zip", data.emergency.zip);

    appendValue(params, "player_count", String(data.players.length));
    data.players.forEach((player, index) => {
      const prefix = `player_${index + 1}`;
      appendValue(params, `${prefix}_first_name`, player.firstName);
      appendValue(params, `${prefix}_last_name`, player.lastName);
      appendValue(params, `${prefix}_dob`, player.dob);
      appendValue(params, `${prefix}_gender`, player.gender);
      appendValue(params, `${prefix}_grade`, player.grade);
      appendValue(params, `${prefix}_jersey`, player.jersey);
      appendValue(params, `${prefix}_shorts`, player.shorts);
      appendValue(params, `${prefix}_socks`, player.socks);
      appendValue(params, `${prefix}_race`, player.race);
      appendValue(params, `${prefix}_race_other`, player.raceOther);
      appendValue(params, `${prefix}_favorite_club`, player.favoriteClub);
      appendValue(params, `${prefix}_hear_about`, player.hearAbout);
      appendValue(params, `${prefix}_add_another`, player.addAnother);
    });

    appendValue(params, "help_choice", data.helpChoice);
    appendValue(params, "agree_waiver", data.agreements.waiver ? "yes" : "no");
    appendValue(params, "agree_privacy", data.agreements.privacy ? "yes" : "no");
    appendValue(params, "agree_marketing", data.agreements.marketing ? "yes" : "no");
    appendValue(params, "signature", data.signature);

    await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: params.toString(),
    });
  }

  async function postAuxFlow(formType, data) {
    if (!GOOGLE_APPS_SCRIPT_URL) {
      throw new Error("Google Apps Script URL is not configured.");
    }

    const params = new URLSearchParams();
    params.append("form_type", formType);
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length) params.append(key, value.join(", "));
      } else {
        appendValue(params, key, value);
      }
    });

    await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: params.toString(),
    });
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

  function loadGooglePlacesScript() {
    if (!GOOGLE_MAPS_API_KEY || window.google?.maps?.places) {
      return Promise.resolve(false);
    }

    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-google-places="true"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(true), { once: true });
        existing.addEventListener("error", () => reject(new Error("Google Places failed to load")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.dataset.googlePlaces = "true";
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&libraries=places`;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Google Places failed to load"));
      document.head.appendChild(script);
    });
  }

  async function initAddressAutocomplete() {
    try {
      const loaded = await loadGooglePlacesScript();
      if (!loaded || !window.google?.maps?.places) return;

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
    } catch (_error) {
      // Fallback to manual entry.
    }
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
