(function () {
  const FORM_ACTION =
    "https://docs.google.com/forms/d/e/1FAIpQLScCUTOgeNb7shvYUrpjbNKn5kh_K_U3tEwks8aJ4zvbXFKWLw/formResponse";
  const FBZX = "-3891024944817654155";
  const GOOGLE_MAPS_API_KEY =
    document.querySelector('meta[name="google-maps-api-key"]')?.content.trim() || "";
  const GOOGLE_APPS_SCRIPT_URL =
    document.querySelector('meta[name="google-apps-script-url"]')?.content.trim() || "";

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

  const form = document.getElementById("registration-form");
  const sectionsRoot = document.getElementById("sections-root");
  const formMessage = document.getElementById("form-message");
  const submitBtn = document.getElementById("submit-btn");
  const successPanel = document.getElementById("success-panel");

  const sectionRefs = new Map();
  const playerToggleNames = ["addPlayer2", "addPlayer3", "addPlayer4"];

  buildPage();
  wireEvents();
  applyVisibility();
  initAddressAutocomplete();

  function buildPage() {
    sectionsRoot.className = "sections-grid";
    sectionsRoot.append(
      buildParentSection(),
      buildEmergencySection(),
      buildPlayerSection(1),
      buildPlayerSection(2),
      buildPlayerSection(3),
      buildPlayerSection(4),
      buildAgreementsSection(),
    );
  }

  function buildParentSection() {
    const section = createSection(
      "Parent or Legal Guardian",
      "Primary contact information for the household.",
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

    toggle.querySelector('input')?.addEventListener('change', (event) => {
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
      toggle.classList.add("section-divider");
      section.append(toggle);
    }

    return section;
  }

  function buildAgreementsSection() {
    const section = createSection(
      "MLS GO Agreements",
      "Review and accept the required program terms before submitting.",
    );

    const grid = createGrid([
      createCheckboxField({
        label: "MLS GO Player Registration Agreement and Waiver",
        name: "agreeWaiver",
        required: true,
        description:
          "I have read and understand the MLS GO Player Registration Agreement and Waiver, accept its terms for myself and every participant listed in this registration, and intend to be legally bound.",
      }),
      createCheckboxField({
        label: "MLS GO Privacy Policy and Terms of Service",
        name: "agreePrivacy",
        required: true,
        description:
          "I agree to the Terms of Service and consent to the use of my information in accordance with the Privacy Policy.",
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

  function createSection(title, description, muted, id) {
    const section = document.createElement("section");
    section.className = `form-section${muted ? " is-muted" : ""}`;
    if (id) section.id = id;

    const header = document.createElement("div");
    header.className = "section-header";

    const heading = document.createElement("h2");
    heading.textContent = title;

    const helper = document.createElement("p");
    helper.className = "section-helper";
    helper.textContent = description;

    header.append(heading, helper);
    section.append(header);
    sectionRefs.set(id || title, section);
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
    input.className = "text-input";

    if (addressField) {
      input.dataset.addressField = "true";
      input.dataset.autocompleteTarget = name;
    }

    if (conditionalOn && conditionalValue) {
      input.dataset.conditionalOn = conditionalOn;
      input.dataset.conditionalValue = conditionalValue;
      wrap.classList.add("hidden");
    }

    if (name.toLowerCase().includes("phone")) {
      input.dataset.phoneField = "true";
      input.inputMode = input.inputMode || "tel";
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
    select.className = "select-input";
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
    const { label, name, required = false, description } = options;
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
    form.addEventListener("submit", handleSubmit);

    form.addEventListener("input", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;

      if (target.dataset.phoneField === "true") {
        formatPhoneField(target);
      }

      if (target.name === "emergencySameAsParent") {
        const emergencyFields = form.querySelector('[data-emergency-fields="true"]');
        if (emergencyFields) emergencyFields.classList.toggle("hidden", target.checked);
      }

      if (target.name === "p1Race" || target.name === "p2Race" || target.name === "p3Race" || target.name === "p4Race") {
        syncConditionalFields(target.name, target.value);
      }

      if (playerToggleNames.includes(target.name)) {
        applyVisibility();
      }
    });

    form.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;

      if (playerToggleNames.includes(target.name)) {
        applyVisibility();
      }

      if (target.name === "emergencySameAsParent") {
        applyVisibility();
      }
    });
  }

  function applyVisibility() {
    const emergencySameAsParent = getFieldValue("emergencySameAsParent") !== false;
    const emergencyFields = form.querySelector('[data-emergency-fields="true"]');
    if (emergencyFields) emergencyFields.classList.toggle("hidden", emergencySameAsParent);

    const player2Visible = getFieldValue("addPlayer2") === "Yes";
    const player3Visible = player2Visible && getFieldValue("addPlayer3") === "Yes";
    const player4Visible = player3Visible && getFieldValue("addPlayer4") === "Yes";

    setSectionVisibility("player-section-2", player2Visible);
    setSectionVisibility("player-section-3", player3Visible);
    setSectionVisibility("player-section-4", player4Visible);

    syncConditionalFields("p1Race", getFieldValue("p1Race"));
    syncConditionalFields("p2Race", getFieldValue("p2Race"));
    syncConditionalFields("p3Race", getFieldValue("p3Race"));
    syncConditionalFields("p4Race", getFieldValue("p4Race"));
  }

  function setSectionVisibility(id, visible) {
    const section = document.getElementById(id);
    if (section) section.classList.toggle("hidden", !visible);
  }

  function syncConditionalFields(controllerName, controllerValue) {
    form.querySelectorAll(`[data-conditional-on="${controllerName}"]`).forEach((wrap) => {
      const expectedValue = wrap.querySelector("input")?.dataset.conditionalValue;
      const match = controllerValue === expectedValue;
      wrap.classList.toggle("hidden", !match);
      wrap.querySelector("input")?.toggleAttribute("required", false);
    });
  }

  function getFieldValue(name) {
    const element = form.elements.namedItem(name);
    if (!element) return "";
    if (element instanceof RadioNodeList) {
      const first = element[0];
      return first && first instanceof HTMLInputElement && first.type === "checkbox" ? first.checked : first?.value || "";
    }
    if (element instanceof HTMLInputElement && element.type === "checkbox") return element.checked;
    return element.value;
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

  function getRequiredFields() {
    return Array.from(form.querySelectorAll("[required]"));
  }

  function validateVisibleFields() {
    const requiredFields = getRequiredFields().filter((field) => {
      return !field.closest(".hidden");
    });

    for (const field of requiredFields) {
      if (field instanceof HTMLInputElement && field.type === "checkbox") {
        if (!field.checked) return field;
      } else if (!field.value || !String(field.value).trim()) {
        return field;
      }
    }
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    formMessage.textContent = "";

    const invalidField = validateVisibleFields();
    if (invalidField) {
      const label = invalidField.closest(".field-group")?.querySelector("label")?.textContent || "this field";
      formMessage.textContent = `Please complete ${label.replace(" *", "")}.`;
      invalidField.focus?.();
      return;
    }

    submitBtn.disabled = true;
    formMessage.textContent = "Submitting registration...";

    try {
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

      registrationData.players.forEach((player, playerIndex) => {
        const entryMap = PLAYER_ENTRY_MAP[playerIndex + 1];
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

        if (entryMap.addAnother) {
          appendIfPresent(params, entryMap.addAnother, player.addAnother || "No");
        }
      });

      appendIfPresent(params, AGREEMENT_ENTRY_MAP.waiver, registrationData.agreements.waiver ? "I have read and understand the MLS GO Player Registration Agreement and Waiver, accept its terms for myself and every participant listed in this registration, and intend to be legally bound." : "");
      appendIfPresent(params, AGREEMENT_ENTRY_MAP.privacy, registrationData.agreements.privacy ? "I agree to the Terms of Service and consent to the use of my information in accordance with the Privacy Policy." : "");
      appendIfPresent(params, AGREEMENT_ENTRY_MAP.marketing, registrationData.agreements.marketing ? "I agree that MLS GO, Major League Soccer, the MLS Clubs, Soccer United Marketing, MLS NEXT Pro, MLS NEXT and each of their respective clubs, affiliates and partners, can use my information to send me newsletters, offers, additional information and other communications about their products and initiatives in accordance with the Privacy Policy and Terms of Use." : "");
      appendIfPresent(params, AGREEMENT_ENTRY_MAP.signature, registrationData.signature);

      params.append("fvv", "1");
      params.append("draftResponse", "[]");
      params.append("pageHistory", "0");
      params.append("partialResponse", `[null,null,\"${FBZX}\"]`);
      params.append("fbzx", FBZX);

      const requests = [postFormResponse(params)];
      if (GOOGLE_APPS_SCRIPT_URL) {
        requests.push(postRegistrationCopy(registrationData));
      }

      await Promise.all(requests);

      form.hidden = true;
      successPanel.hidden = false;
      formMessage.textContent = "";
    } catch (error) {
      formMessage.textContent = "Submission failed. Please retry in a moment.";
    } finally {
      submitBtn.disabled = false;
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
      agreements: {
        waiver: getCheckboxValue("agreeWaiver"),
        privacy: getCheckboxValue("agreePrivacy"),
        marketing: getCheckboxValue("agreeMarketing"),
      },
      signature: getTextValue("signature"),
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

  function loadGooglePlacesScript() {
    if (!GOOGLE_MAPS_API_KEY || window.google?.maps?.places) return Promise.resolve(false);
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
      addressFields.forEach((field) => {
        const input = field;
        const autocomplete = new google.maps.places.Autocomplete(input, {
          types: ["address"],
          fields: ["address_components", "formatted_address", "geometry", "name"],
          componentRestrictions: { country: "us" },
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.address_components) return;

          const parsed = parsePlaceAddress(place.address_components);
          const prefix = input.name.startsWith("emergency") ? "emergency" : "parent";

          if (parsed.street) form.elements.namedItem(`${prefix}Street`).value = parsed.street;
          if (parsed.city) form.elements.namedItem(`${prefix}City`).value = parsed.city;
          if (parsed.state) form.elements.namedItem(`${prefix}State`).value = parsed.state;
          if (parsed.zip) form.elements.namedItem(`${prefix}Zip`).value = parsed.zip;
        });
      });
    } catch (error) {
      // Silent fallback to manual entry.
    }
  }

  function parsePlaceAddress(components) {
    const result = { street: "", city: "", state: "", zip: "" };
    const lookup = (type) => components.find((component) => component.types.includes(type));
    const streetNumber = lookup("street_number")?.long_name || "";
    const route = lookup("route")?.long_name || "";
    result.street = [streetNumber, route].filter(Boolean).join(" ");
    result.city = lookup("locality")?.long_name || lookup("postal_town")?.long_name || lookup("administrative_area_level_2")?.long_name || "";
    result.state = lookup("administrative_area_level_1")?.short_name || lookup("administrative_area_level_1")?.long_name || "";
    result.zip = lookup("postal_code")?.long_name || "";
    return result;
  }
})();
