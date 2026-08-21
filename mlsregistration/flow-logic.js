(function initMlsRegistrationFlowLogic(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root && typeof root === "object") {
    root.MlsRegistrationFlowLogic = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function buildFlowLogic() {
  const STAGES = Object.freeze({
    PLAYER_REGISTRATION: "PLAYER_REGISTRATION",
    PLAYER_AGREEMENT: "PLAYER_AGREEMENT",
    SCHOLARSHIP_APPLICATION: "SCHOLARSHIP_APPLICATION",
    VOLUNTEER_APPLICATION: "VOLUNTEER_APPLICATION",
    COACHING_APPLICATION: "COACHING_APPLICATION",
    VOLUNTEER_AGREEMENT: "VOLUNTEER_AGREEMENT",
    FINAL_CONFIRMATION_EMAIL: "FINAL_CONFIRMATION_EMAIL",
    THANK_YOU: "THANK_YOU",
    PAYMENT: "PAYMENT",
  });

  const HELP_OPTION = Object.freeze({
    NO: "no",
    VOLUNTEER: "volunteer",
    COACH: "coach",
    BOTH: "both",
  });

  const STANDALONE_FLOW = Object.freeze({
    VOLUNTEER: "volunteer",
    COACH: "coach",
  });

  const EMAIL_TYPE = Object.freeze({
    REGISTRATION_PLAYER: "registration_player",
    REGISTRATION_PLAYER_VOLUNTEER: "registration_player_volunteer",
    REGISTRATION_PLAYER_COACH: "registration_player_coach",
    REGISTRATION_PLAYER_VOLUNTEER_COACH: "registration_player_volunteer_coach",
    SCHOLARSHIP_PLAYER: "scholarship_player",
    SCHOLARSHIP_PLAYER_VOLUNTEER: "scholarship_player_volunteer",
    SCHOLARSHIP_PLAYER_COACH: "scholarship_player_coach",
    SCHOLARSHIP_PLAYER_VOLUNTEER_COACH: "scholarship_player_volunteer_coach",
    STANDALONE_VOLUNTEER: "standalone_volunteer",
    STANDALONE_COACH: "standalone_coach",
  });

  function normalizeHelpChoice(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === HELP_OPTION.VOLUNTEER) return HELP_OPTION.VOLUNTEER;
    if (normalized === HELP_OPTION.COACH || normalized === "apply to coach") return HELP_OPTION.COACH;
    if (normalized === HELP_OPTION.BOTH || normalized === "volunteer and apply to coach") return HELP_OPTION.BOTH;
    if (normalized === "volunteer") return HELP_OPTION.VOLUNTEER;
    if (normalized === "no, finish my registration" || normalized === "no") return HELP_OPTION.NO;
    return HELP_OPTION.NO;
  }

  function isScholarshipRequested(value) {
    return String(value || "").trim().toLowerCase() === "yes";
  }

  function buildRequiredStages(options) {
    const standaloneFlow = normalizeStandaloneFlow(options && options.standaloneFlow);
    const scholarshipRequested = isScholarshipRequested(options && options.scholarshipRequested);
    const helpChoice = normalizeHelpChoice(options && options.helpChoice);
    const stages = [];

    if (standaloneFlow === STANDALONE_FLOW.VOLUNTEER) {
      stages.push(
        STAGES.VOLUNTEER_APPLICATION,
        STAGES.VOLUNTEER_AGREEMENT,
        STAGES.FINAL_CONFIRMATION_EMAIL,
        STAGES.THANK_YOU,
      );
      return stages;
    }

    if (standaloneFlow === STANDALONE_FLOW.COACH) {
      stages.push(
        STAGES.COACHING_APPLICATION,
        STAGES.VOLUNTEER_AGREEMENT,
        STAGES.FINAL_CONFIRMATION_EMAIL,
        STAGES.THANK_YOU,
      );
      return stages;
    }

    stages.push(STAGES.PLAYER_REGISTRATION, STAGES.PLAYER_AGREEMENT);

    if (scholarshipRequested) {
      stages.push(STAGES.SCHOLARSHIP_APPLICATION);
    }

    if (helpChoice === HELP_OPTION.VOLUNTEER || helpChoice === HELP_OPTION.BOTH) {
      stages.push(STAGES.VOLUNTEER_APPLICATION);
    }

    if (helpChoice === HELP_OPTION.COACH || helpChoice === HELP_OPTION.BOTH) {
      stages.push(STAGES.COACHING_APPLICATION);
    }

    if (helpChoice === HELP_OPTION.VOLUNTEER || helpChoice === HELP_OPTION.COACH || helpChoice === HELP_OPTION.BOTH) {
      stages.push(STAGES.VOLUNTEER_AGREEMENT);
    }

    stages.push(STAGES.FINAL_CONFIRMATION_EMAIL, STAGES.THANK_YOU);

    if (!scholarshipRequested) {
      stages.push(STAGES.PAYMENT);
    }

    return stages;
  }

  function normalizeStandaloneFlow(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === STANDALONE_FLOW.VOLUNTEER) return STANDALONE_FLOW.VOLUNTEER;
    if (normalized === STANDALONE_FLOW.COACH || normalized === "coaching") return STANDALONE_FLOW.COACH;
    return "";
  }

  function getFlowDescriptor(options) {
    const standaloneFlow = normalizeStandaloneFlow(options && options.standaloneFlow);
    const scholarshipRequested = isScholarshipRequested(options && options.scholarshipRequested);
    const helpChoice = normalizeHelpChoice(options && options.helpChoice);

    if (standaloneFlow === STANDALONE_FLOW.VOLUNTEER) {
      return {
        emailType: EMAIL_TYPE.STANDALONE_VOLUNTEER,
        paymentRequired: false,
        formsRecorded: ["Volunteer Application"],
        agreementsRecorded: ["Volunteer Agreement"],
        summaryKey: "standalone_volunteer",
      };
    }

    if (standaloneFlow === STANDALONE_FLOW.COACH) {
      return {
        emailType: EMAIL_TYPE.STANDALONE_COACH,
        paymentRequired: false,
        formsRecorded: ["Coaching Application"],
        agreementsRecorded: ["Volunteer Agreement"],
        summaryKey: "standalone_coach",
      };
    }

    const formsRecorded = ["Player Registration"];
    const agreementsRecorded = ["Player Agreement"];

    if (scholarshipRequested) {
      formsRecorded.push("Financial Hardship Scholarship Application");
    }
    if (helpChoice === HELP_OPTION.VOLUNTEER || helpChoice === HELP_OPTION.BOTH) {
      formsRecorded.push("Volunteer Application");
    }
    if (helpChoice === HELP_OPTION.COACH || helpChoice === HELP_OPTION.BOTH) {
      formsRecorded.push("Coaching Application");
    }
    if (helpChoice === HELP_OPTION.VOLUNTEER || helpChoice === HELP_OPTION.COACH || helpChoice === HELP_OPTION.BOTH) {
      agreementsRecorded.push("Volunteer Agreement");
    }

    return {
      emailType: resolvePlayerEmailType({ scholarshipRequested, helpChoice }),
      paymentRequired: !scholarshipRequested,
      formsRecorded,
      agreementsRecorded,
      summaryKey: resolveSummaryKey({ scholarshipRequested, helpChoice }),
    };
  }

  function resolvePlayerEmailType(options) {
    const scholarshipRequested = Boolean(options && options.scholarshipRequested);
    const helpChoice = normalizeHelpChoice(options && options.helpChoice);

    if (scholarshipRequested) {
      if (helpChoice === HELP_OPTION.VOLUNTEER) return EMAIL_TYPE.SCHOLARSHIP_PLAYER_VOLUNTEER;
      if (helpChoice === HELP_OPTION.COACH) return EMAIL_TYPE.SCHOLARSHIP_PLAYER_COACH;
      if (helpChoice === HELP_OPTION.BOTH) return EMAIL_TYPE.SCHOLARSHIP_PLAYER_VOLUNTEER_COACH;
      return EMAIL_TYPE.SCHOLARSHIP_PLAYER;
    }

    if (helpChoice === HELP_OPTION.VOLUNTEER) return EMAIL_TYPE.REGISTRATION_PLAYER_VOLUNTEER;
    if (helpChoice === HELP_OPTION.COACH) return EMAIL_TYPE.REGISTRATION_PLAYER_COACH;
    if (helpChoice === HELP_OPTION.BOTH) return EMAIL_TYPE.REGISTRATION_PLAYER_VOLUNTEER_COACH;
    return EMAIL_TYPE.REGISTRATION_PLAYER;
  }

  function resolveSummaryKey(options) {
    const scholarshipRequested = Boolean(options && options.scholarshipRequested);
    const helpChoice = normalizeHelpChoice(options && options.helpChoice);

    if (scholarshipRequested) {
      if (helpChoice === HELP_OPTION.VOLUNTEER) return "scholarship_volunteer";
      if (helpChoice === HELP_OPTION.COACH) return "scholarship_coach";
      if (helpChoice === HELP_OPTION.BOTH) return "scholarship_volunteer_coach";
      return "scholarship_only";
    }

    if (helpChoice === HELP_OPTION.VOLUNTEER) return "player_volunteer";
    if (helpChoice === HELP_OPTION.COACH) return "player_coach";
    if (helpChoice === HELP_OPTION.BOTH) return "player_volunteer_coach";
    return "player_only";
  }

  function buildThankYouContent(options) {
    const descriptor = getFlowDescriptor(options);
    const emailSent = options && options.emailSent !== false;
    const emailFailedMessage = "Your submission was recorded. Please contact info@lifeprepacademyfoundation.com if you need a copy.";

    if (descriptor.summaryKey === "player_only") {
      return {
        heading: "Your registration forms are complete",
        message: emailSent
          ? "Thank you for registering for the LifePrep Academy Foundation MLS GO youth program. Your player registration and Player Agreement have been recorded. A confirmation email has been sent to the address you provided. Continue to secure payment below to finish your player’s registration."
          : emailFailedMessage,
      };
    }

    if (descriptor.summaryKey === "player_volunteer") {
      return {
        heading: "Your registration forms are complete",
        message: emailSent
          ? "Thank you. Your player registration, volunteer application, Player Agreement, and Volunteer Agreement have been recorded. A confirmation email has been sent to the address provided. Continue to secure payment below to finish your player registration."
          : emailFailedMessage,
      };
    }

    if (descriptor.summaryKey === "player_coach") {
      return {
        heading: "Your registration forms are complete",
        message: emailSent
          ? "Thank you. Your player registration, coaching application, Player Agreement, and Volunteer Agreement have been recorded. A confirmation email has been sent to the address provided. Continue to secure payment below to finish your player registration."
          : emailFailedMessage,
      };
    }

    if (descriptor.summaryKey === "player_volunteer_coach") {
      return {
        heading: "Your registration forms are complete",
        message: emailSent
          ? "Thank you. Your player registration, volunteer application, coaching application, Player Agreement, and Volunteer Agreement have been recorded. A confirmation email has been sent to the address provided. Continue to secure payment below to finish your player registration."
          : emailFailedMessage,
      };
    }

    if (descriptor.summaryKey === "scholarship_only") {
      return {
        heading: "Your scholarship registration forms are complete",
        message: emailSent
          ? "Thank you. Your player registration, Player Agreement, and Financial Hardship Scholarship application have been received. No payment is required at this time. Our team will review the application and contact you with the next steps."
          : emailFailedMessage,
      };
    }

    if (descriptor.summaryKey === "scholarship_volunteer") {
      return {
        heading: "Your scholarship registration forms are complete",
        message: emailSent
          ? "Thank you. Your player registration, Player Agreement, Financial Hardship Scholarship application, volunteer application, and Volunteer Agreement have been recorded. No payment is required at this time. Our team will review the application and contact you with the next steps."
          : emailFailedMessage,
      };
    }

    if (descriptor.summaryKey === "scholarship_coach") {
      return {
        heading: "Your scholarship registration forms are complete",
        message: emailSent
          ? "Thank you. Your player registration, Player Agreement, Financial Hardship Scholarship application, coaching application, and Volunteer Agreement have been recorded. No payment is required at this time. Our team will review the application and contact you with the next steps."
          : emailFailedMessage,
      };
    }

    if (descriptor.summaryKey === "scholarship_volunteer_coach") {
      return {
        heading: "Your scholarship registration forms are complete",
        message: emailSent
          ? "Thank you. Your player registration, Player Agreement, Financial Hardship Scholarship application, volunteer application, coaching application, and Volunteer Agreement have been recorded. No payment is required at this time. Our team will review the application and contact you with the next steps."
          : emailFailedMessage,
      };
    }

    if (descriptor.summaryKey === "standalone_volunteer") {
      return {
        heading: "Your volunteer application is complete",
        message: emailSent
          ? "Thank you for applying to volunteer with the LifePrep Academy Foundation MLS GO youth program. Your Volunteer Application and Volunteer Agreement have been recorded. A confirmation email has been sent to the address provided."
          : emailFailedMessage,
      };
    }

    return {
      heading: "Your coaching application is complete",
      message: emailSent
        ? "Thank you for applying to coach with the LifePrep Academy Foundation MLS GO youth program. Your Coaching Application and Volunteer Agreement have been recorded. A confirmation email has been sent to the address provided."
        : emailFailedMessage,
    };
  }

  return {
    EMAIL_TYPE,
    HELP_OPTION,
    STAGES,
    STANDALONE_FLOW,
    buildRequiredStages,
    buildThankYouContent,
    getFlowDescriptor,
    isScholarshipRequested,
    normalizeHelpChoice,
    normalizeStandaloneFlow,
  };
});