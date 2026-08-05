(function () {
  const FORM_ACTION =
    "https://docs.google.com/forms/d/e/1FAIpQLScCUTOgeNb7shvYUrpjbNKn5kh_K_U3tEwks8aJ4zvbXFKWLw/formResponse";

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

  const playerEntryMap = {
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

  const parentEntryMap = {
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

  const agreementEntryMap = {
    waiver: "1522719395",
    privacy: "481619757",
    marketing: "1538615941",
    signature: "1611060751",
  };

  const state = {};

  const form = document.getElementById("wizard-form");
  const questionHost = document.getElementById("question-host");
  const errorMsg = document.getElementById("error-msg");
  const backBtn = document.getElementById("back-btn");
  const nextBtn = document.getElementById("next-btn");
  const progressFill = document.getElementById("progress-fill");
  const progressText = document.getElementById("progress-text");
  const resultPanel = document.getElementById("result-panel");

  let currentVisibleIndex = 0;
  let isSubmitting = false;

  const steps = buildSteps();

  function buildSteps() {
    const base = [
      textStep("parentFirstName", "Parent/guardian first name", true),
      textStep("parentLastName", "Parent/guardian last name", true),
      textStep("parentEmail", "Parent/guardian email", true, "email"),
      textStep("parentPhone", "Parent/guardian cell phone", true, "tel"),
      textStep("parentStreet", "Street address", true),
      textStep("parentApt", "Apartment, suite, or unit"),
      textStep("parentCity", "City", true),
      textStep("parentState", "State", true),
      textStep("parentZip", "ZIP code", true),
    ];

    base.push(...playerSteps(1));

    base.push(
      selectStep("addPlayer2", "Would you like to register another player?", [
        "Yes",
        "No",
      ], true),
    );

    base.push(...playerSteps(2, () => state.addPlayer2 === "Yes"));

    base.push(
      selectStep(
        "addPlayer3",
        "Would you like to register another player?",
        ["Yes", "No"],
        true,
        () => state.addPlayer2 === "Yes",
      ),
    );

    base.push(
      ...playerSteps(3, () => state.addPlayer2 === "Yes" && state.addPlayer3 === "Yes"),
    );

    base.push(
      selectStep(
        "addPlayer4",
        "Would you like to register another player?",
        ["Yes", "No"],
        true,
        () => state.addPlayer2 === "Yes" && state.addPlayer3 === "Yes",
      ),
    );

    base.push(
      ...playerSteps(
        4,
        () =>
          state.addPlayer2 === "Yes" &&
          state.addPlayer3 === "Yes" &&
          state.addPlayer4 === "Yes",
      ),
    );

    base.push(
      checkboxStep(
        "agreeWaiver",
        "MLS GO Player Registration Agreement and Waiver",
        "I have read and understand the MLS GO Player Registration Agreement and Waiver, accept its terms for myself and every participant listed in this registration, and intend to be legally bound.",
        true,
      ),
    );
    base.push(
      checkboxStep(
        "agreePrivacy",
        "MLS GO Privacy Policy and Terms of Service",
        "I agree to the Terms of Service and consent to the use of my information in accordance with the Privacy Policy.",
        true,
      ),
    );
    base.push(
      checkboxStep(
        "agreeMarketing",
        "MLS GO Marketing Opt-In",
        "I agree that MLS GO, Major League Soccer, the MLS Clubs, Soccer United Marketing, MLS NEXT Pro, MLS NEXT and each of their respective clubs, affiliates and partners, can use my information to send me newsletters, offers, additional information and other communications about their products and initiatives in accordance with the Privacy Policy and Terms of Use.",
        false,
      ),
    );
    base.push(
      textStep(
        "signature",
        "Electronic signature - parent/legal guardian full name",
        true,
      ),
    );

    return base;
  }

  function playerSteps(playerIndex, conditionFn) {
    const prefix = "p" + String(playerIndex);
    return [
      textStep(prefix + "FirstName", "Player " + playerIndex + " - first name", true, "text", conditionFn),
      textStep(prefix + "LastName", "Player " + playerIndex + " - last name", true, "text", conditionFn),
      textStep(prefix + "Dob", "Player " + playerIndex + " - date of birth", true, "date", conditionFn),
      selectStep(
        prefix + "Gender",
        "Player " + playerIndex + " - gender identity",
        ["Female", "Male", "Non-binary", "Prefer not to specify"],
        true,
        conditionFn,
      ),
      selectStep(
        prefix + "Grade",
        "Player " + playerIndex + " - grade",
        [
          "Pre-K",
          "Kindergarten",
          "1st",
          "2nd",
          "3rd",
          "4th",
          "5th",
          "6th",
          "7th",
          "8th",
        ],
        true,
        conditionFn,
      ),
      selectStep(
        prefix + "Jersey",
        "Player " + playerIndex + " - jersey size",
        ["YXXS", "YXS", "YS", "YM", "YL", "YXL/AS", "AM", "AL", "AXL"],
        true,
        conditionFn,
      ),
      selectStep(
        prefix + "Shorts",
        "Player " + playerIndex + " - shorts size",
        ["YXXS", "YXS", "YS", "YM", "YL", "YXL/AS", "AM", "AL", "AXL"],
        true,
        conditionFn,
      ),
      selectStep(
        prefix + "Socks",
        "Player " + playerIndex + " - sock size",
        ["YS/YM", "YL/YXL", "A"],
        true,
        conditionFn,
      ),
      selectStep(
        prefix + "Race",
        "Player " + playerIndex + " - race/ethnicity",
        [
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
        true,
        conditionFn,
      ),
      textStep(
        prefix + "RaceOther",
        "Player " + playerIndex + " - race/ethnicity - if Other, please specify",
        false,
        "text",
        function () {
          const visible = conditionFn ? conditionFn() : true;
          return visible && state[prefix + "Race"] === "Other (write in)";
        },
      ),
      selectStep(
        prefix + "FavoriteClub",
        "Player " + playerIndex + " - favorite MLS club",
        CLUB_OPTIONS,
        true,
        conditionFn,
      ),
      selectStep(
        prefix + "HearAbout",
        "Player " + playerIndex + " - how did you hear about MLS GO?",
        HEAR_ABOUT_OPTIONS,
        true,
        conditionFn,
      ),
    ];
  }

  function textStep(key, title, required, inputType, conditionFn) {
    return {
      key,
      title,
      type: "text",
      inputType: inputType || "text",
      required: Boolean(required),
      showIf: conditionFn || null,
    };
  }

  function selectStep(key, title, options, required, conditionFn) {
    return {
      key,
      title,
      type: "select",
      options,
      required: Boolean(required),
      showIf: conditionFn || null,
    };
  }

  function checkboxStep(key, title, label, required, conditionFn) {
    return {
      key,
      title,
      type: "checkbox",
      label,
      required: Boolean(required),
      showIf: conditionFn || null,
    };
  }

  function visibleSteps() {
    return steps.filter((step) => {
      if (typeof step.showIf !== "function") return true;
      return Boolean(step.showIf());
    });
  }

  function currentStep() {
    const list = visibleSteps();
    if (currentVisibleIndex < 0) currentVisibleIndex = 0;
    if (currentVisibleIndex > list.length - 1) currentVisibleIndex = list.length - 1;
    return { list, step: list[currentVisibleIndex] };
  }

  function render() {
    const current = currentStep();
    const list = current.list;
    const step = current.step;
    if (!step) return;

    const position = currentVisibleIndex + 1;
    const total = list.length;
    const percent = Math.max(1, Math.round((position / total) * 100));
    progressFill.style.width = String(percent) + "%";
    progressText.textContent = "Question " + position + " of " + total;

    backBtn.disabled = currentVisibleIndex === 0 || isSubmitting;
    nextBtn.textContent = position === total ? "Submit" : "Next";
    nextBtn.disabled = isSubmitting;

    questionHost.innerHTML = "";
    errorMsg.textContent = "";

    const wrapper = document.createElement("div");
    wrapper.className = "question";

    const title = document.createElement("h2");
    title.textContent = step.title;
    wrapper.appendChild(title);

    if (!step.required) {
      const helper = document.createElement("p");
      helper.textContent = "Optional";
      wrapper.appendChild(helper);
    }

    if (step.type === "text") {
      const input = document.createElement("input");
      input.className = "field";
      input.type = step.inputType;
      input.name = step.key;
      input.value = state[step.key] || "";
      input.autocomplete = "off";
      input.addEventListener("input", () => {
        state[step.key] = input.value;
      });
      wrapper.appendChild(input);
      setTimeout(() => input.focus(), 0);
    } else if (step.type === "select") {
      const select = document.createElement("select");
      select.className = "select";
      select.name = step.key;

      const optionPlaceholder = document.createElement("option");
      optionPlaceholder.value = "";
      optionPlaceholder.textContent = "Select an option";
      select.appendChild(optionPlaceholder);

      step.options.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt;
        select.appendChild(option);
      });

      select.value = state[step.key] || "";
      select.addEventListener("change", () => {
        state[step.key] = select.value;
      });

      wrapper.appendChild(select);
      setTimeout(() => select.focus(), 0);
    } else if (step.type === "checkbox") {
      const choices = document.createElement("div");
      choices.className = "choices";

      const choice = document.createElement("label");
      choice.className = "choice";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = step.key;
      checkbox.checked = Boolean(state[step.key]);
      checkbox.addEventListener("change", () => {
        state[step.key] = checkbox.checked;
      });

      const text = document.createElement("span");
      text.textContent = step.label;

      choice.appendChild(checkbox);
      choice.appendChild(text);
      choices.appendChild(choice);
      wrapper.appendChild(choices);
      setTimeout(() => checkbox.focus(), 0);
    }

    questionHost.appendChild(wrapper);
  }

  function validateStep(step) {
    const value = state[step.key];
    if (!step.required) return true;

    if (step.type === "checkbox") {
      return Boolean(value);
    }

    if (typeof value !== "string") return false;
    if (!value.trim()) return false;

    if (step.key === "parentEmail") {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    }

    if (step.key === "parentZip") {
      return /^\d{5}(?:-\d{4})?$/.test(value.trim());
    }

    return true;
  }

  function next() {
    const current = currentStep();
    const step = current.step;
    const list = current.list;
    if (!step || isSubmitting) return;

    if (!validateStep(step)) {
      errorMsg.textContent = "Please answer this question before continuing.";
      return;
    }

    errorMsg.textContent = "";
    if (currentVisibleIndex >= list.length - 1) {
      submitForm();
      return;
    }

    currentVisibleIndex += 1;
    render();
  }

  function previous() {
    if (isSubmitting) return;
    currentVisibleIndex -= 1;
    if (currentVisibleIndex < 0) currentVisibleIndex = 0;
    errorMsg.textContent = "";
    render();
  }

  function selectedPlayerCount() {
    if (state.addPlayer2 !== "Yes") return 1;
    if (state.addPlayer3 !== "Yes") return 2;
    if (state.addPlayer4 !== "Yes") return 3;
    return 4;
  }

  function appendIfPresent(params, entryId, value) {
    if (!entryId) return;
    if (value === undefined || value === null) return;
    if (typeof value === "string" && !value.trim()) return;
    params.append("entry." + entryId, String(value));
  }

  async function submitForm() {
    isSubmitting = true;
    nextBtn.disabled = true;
    backBtn.disabled = true;
    errorMsg.textContent = "Submitting...";

    try {
      const params = new URLSearchParams();

      appendIfPresent(params, parentEntryMap.firstName, state.parentFirstName);
      appendIfPresent(params, parentEntryMap.lastName, state.parentLastName);
      appendIfPresent(params, parentEntryMap.email, state.parentEmail);
      appendIfPresent(params, parentEntryMap.phone, state.parentPhone);
      appendIfPresent(params, parentEntryMap.street, state.parentStreet);
      appendIfPresent(params, parentEntryMap.apt, state.parentApt);
      appendIfPresent(params, parentEntryMap.city, state.parentCity);
      appendIfPresent(params, parentEntryMap.state, state.parentState);
      appendIfPresent(params, parentEntryMap.zip, state.parentZip);

      const players = selectedPlayerCount();

      for (let i = 1; i <= players; i += 1) {
        const map = playerEntryMap[i];
        const prefix = "p" + String(i);

        appendIfPresent(params, map.firstName, state[prefix + "FirstName"]);
        appendIfPresent(params, map.lastName, state[prefix + "LastName"]);
        appendIfPresent(params, map.dob, state[prefix + "Dob"]);
        appendIfPresent(params, map.gender, state[prefix + "Gender"]);
        appendIfPresent(params, map.grade, state[prefix + "Grade"]);
        appendIfPresent(params, map.jersey, state[prefix + "Jersey"]);
        appendIfPresent(params, map.shorts, state[prefix + "Shorts"]);
        appendIfPresent(params, map.socks, state[prefix + "Socks"]);
        appendIfPresent(params, map.race, state[prefix + "Race"]);
        appendIfPresent(params, map.raceOther, state[prefix + "RaceOther"]);
        appendIfPresent(params, map.favoriteClub, state[prefix + "FavoriteClub"]);
        appendIfPresent(params, map.hearAbout, state[prefix + "HearAbout"]);

        if (map.addAnother) {
          appendIfPresent(
            params,
            map.addAnother,
            state["addPlayer" + String(i + 1)] || "No",
          );
        }
      }

      if (state.agreeWaiver) {
        appendIfPresent(
          params,
          agreementEntryMap.waiver,
          "I have read and understand the MLS GO Player Registration Agreement and Waiver, accept its terms for myself and every participant listed in this registration, and intend to be legally bound.",
        );
      }

      if (state.agreePrivacy) {
        appendIfPresent(
          params,
          agreementEntryMap.privacy,
          "I agree to the Terms of Service and consent to the use of my information in accordance with the Privacy Policy.",
        );
      }

      if (state.agreeMarketing) {
        appendIfPresent(
          params,
          agreementEntryMap.marketing,
          "I agree that MLS GO, Major League Soccer, the MLS Clubs, Soccer United Marketing, MLS NEXT Pro, MLS NEXT and each of their respective clubs, affiliates and partners, can use my information to send me newsletters, offers, additional information and other communications about their products and initiatives in accordance with the Privacy Policy and Terms of Use.",
        );
      }

      appendIfPresent(params, agreementEntryMap.signature, state.signature);

      params.append("fvv", "1");
      params.append("draftResponse", "[]");
      params.append("pageHistory", "0");

      await fetch(FORM_ACTION, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: params.toString(),
      });

      form.hidden = true;
      resultPanel.hidden = false;
      errorMsg.textContent = "";
    } catch (error) {
      errorMsg.textContent =
        "Submission failed. Please retry, or use the backup Google Form link.";
      nextBtn.disabled = false;
      backBtn.disabled = false;
    } finally {
      isSubmitting = false;
    }
  }

  backBtn.addEventListener("click", previous);
  nextBtn.addEventListener("click", next);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    next();
  });

  render();
})();
