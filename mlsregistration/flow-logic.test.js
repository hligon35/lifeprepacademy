const test = require("node:test");
const assert = require("node:assert/strict");

const {
  EMAIL_TYPE,
  HELP_OPTION,
  STAGES,
  STANDALONE_FLOW,
  buildRequiredStages,
  buildThankYouContent,
  getFlowDescriptor,
  isScholarshipRequested,
} = require("./flow-logic.js");

test("all ten paths keep descriptor and thank-you output aligned", () => {
  const cases = [
    {
      name: "player only",
      options: { scholarshipRequested: "No", helpChoice: HELP_OPTION.NO },
      expectedEmailType: EMAIL_TYPE.REGISTRATION_PLAYER,
      expectedForms: ["Player Registration"],
      expectedAgreements: ["Player Agreement"],
      paymentRequired: true,
      thankYouIncludes: "Continue to secure payment below to finish your player’s registration.",
    },
    {
      name: "player volunteer",
      options: { scholarshipRequested: "No", helpChoice: HELP_OPTION.VOLUNTEER },
      expectedEmailType: EMAIL_TYPE.REGISTRATION_PLAYER_VOLUNTEER,
      expectedForms: ["Player Registration", "Volunteer Application"],
      expectedAgreements: ["Player Agreement", "Volunteer Agreement"],
      paymentRequired: true,
      thankYouIncludes: "volunteer application, Player Agreement, and Volunteer Agreement",
    },
    {
      name: "player coach",
      options: { scholarshipRequested: "No", helpChoice: HELP_OPTION.COACH },
      expectedEmailType: EMAIL_TYPE.REGISTRATION_PLAYER_COACH,
      expectedForms: ["Player Registration", "Coaching Application"],
      expectedAgreements: ["Player Agreement", "Volunteer Agreement"],
      paymentRequired: true,
      thankYouIncludes: "coaching application, Player Agreement, and Volunteer Agreement",
    },
    {
      name: "player volunteer coach",
      options: { scholarshipRequested: "No", helpChoice: HELP_OPTION.BOTH },
      expectedEmailType: EMAIL_TYPE.REGISTRATION_PLAYER_VOLUNTEER_COACH,
      expectedForms: ["Player Registration", "Volunteer Application", "Coaching Application"],
      expectedAgreements: ["Player Agreement", "Volunteer Agreement"],
      paymentRequired: true,
      thankYouIncludes: "volunteer application, coaching application, Player Agreement, and Volunteer Agreement",
    },
    {
      name: "scholarship only",
      options: { scholarshipRequested: "Yes", helpChoice: HELP_OPTION.NO },
      expectedEmailType: EMAIL_TYPE.SCHOLARSHIP_PLAYER,
      expectedForms: ["Player Registration", "Financial Hardship Scholarship Application"],
      expectedAgreements: ["Player Agreement"],
      paymentRequired: false,
      thankYouIncludes: "No payment is required at this time.",
    },
    {
      name: "scholarship volunteer",
      options: { scholarshipRequested: "Yes", helpChoice: HELP_OPTION.VOLUNTEER },
      expectedEmailType: EMAIL_TYPE.SCHOLARSHIP_PLAYER_VOLUNTEER,
      expectedForms: ["Player Registration", "Financial Hardship Scholarship Application", "Volunteer Application"],
      expectedAgreements: ["Player Agreement", "Volunteer Agreement"],
      paymentRequired: false,
      thankYouIncludes: "Financial Hardship Scholarship application, volunteer application, and Volunteer Agreement",
    },
    {
      name: "scholarship coach",
      options: { scholarshipRequested: "Yes", helpChoice: HELP_OPTION.COACH },
      expectedEmailType: EMAIL_TYPE.SCHOLARSHIP_PLAYER_COACH,
      expectedForms: ["Player Registration", "Financial Hardship Scholarship Application", "Coaching Application"],
      expectedAgreements: ["Player Agreement", "Volunteer Agreement"],
      paymentRequired: false,
      thankYouIncludes: "Financial Hardship Scholarship application, coaching application, and Volunteer Agreement",
    },
    {
      name: "scholarship volunteer coach",
      options: { scholarshipRequested: "Yes", helpChoice: HELP_OPTION.BOTH },
      expectedEmailType: EMAIL_TYPE.SCHOLARSHIP_PLAYER_VOLUNTEER_COACH,
      expectedForms: ["Player Registration", "Financial Hardship Scholarship Application", "Volunteer Application", "Coaching Application"],
      expectedAgreements: ["Player Agreement", "Volunteer Agreement"],
      paymentRequired: false,
      thankYouIncludes: "Financial Hardship Scholarship application, volunteer application, coaching application, and Volunteer Agreement",
    },
    {
      name: "standalone volunteer",
      options: { standaloneFlow: STANDALONE_FLOW.VOLUNTEER },
      expectedEmailType: EMAIL_TYPE.STANDALONE_VOLUNTEER,
      expectedForms: ["Volunteer Application"],
      expectedAgreements: ["Volunteer Agreement"],
      paymentRequired: false,
      thankYouIncludes: "Your Volunteer Application and Volunteer Agreement have been recorded",
    },
    {
      name: "standalone coach",
      options: { standaloneFlow: STANDALONE_FLOW.COACH },
      expectedEmailType: EMAIL_TYPE.STANDALONE_COACH,
      expectedForms: ["Coaching Application"],
      expectedAgreements: ["Volunteer Agreement"],
      paymentRequired: false,
      thankYouIncludes: "Your Coaching Application and Volunteer Agreement have been recorded",
    },
  ];

  cases.forEach((testCase) => {
    const descriptor = getFlowDescriptor(testCase.options);
    const thankYou = buildThankYouContent({ ...testCase.options, emailSent: true });
    const stages = buildRequiredStages(testCase.options);

    assert.equal(descriptor.emailType, testCase.expectedEmailType, `${testCase.name} email type`);
    assert.deepEqual(descriptor.formsRecorded, testCase.expectedForms, `${testCase.name} forms`);
    assert.deepEqual(descriptor.agreementsRecorded, testCase.expectedAgreements, `${testCase.name} agreements`);
    assert.equal(descriptor.paymentRequired, testCase.paymentRequired, `${testCase.name} payment visibility`);
    assert.equal(stages.includes(STAGES.PAYMENT), testCase.paymentRequired, `${testCase.name} payment stage`);
    assert.match(thankYou.message, new RegExp(testCase.thankYouIncludes.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${testCase.name} thank-you copy`);
  });
});

test("player-only non-scholarship path", () => {
  assert.deepEqual(buildRequiredStages({
    scholarshipRequested: "No",
    helpChoice: HELP_OPTION.NO,
  }), [
    STAGES.PLAYER_REGISTRATION,
    STAGES.PLAYER_AGREEMENT,
    STAGES.FINAL_CONFIRMATION_EMAIL,
    STAGES.THANK_YOU,
    STAGES.PAYMENT,
  ]);
});

test("player volunteer non-scholarship path", () => {
  assert.deepEqual(buildRequiredStages({
    scholarshipRequested: "No",
    helpChoice: HELP_OPTION.VOLUNTEER,
  }), [
    STAGES.PLAYER_REGISTRATION,
    STAGES.PLAYER_AGREEMENT,
    STAGES.VOLUNTEER_APPLICATION,
    STAGES.VOLUNTEER_AGREEMENT,
    STAGES.FINAL_CONFIRMATION_EMAIL,
    STAGES.THANK_YOU,
    STAGES.PAYMENT,
  ]);
});

test("player coach non-scholarship path", () => {
  assert.deepEqual(buildRequiredStages({
    scholarshipRequested: "No",
    helpChoice: HELP_OPTION.COACH,
  }), [
    STAGES.PLAYER_REGISTRATION,
    STAGES.PLAYER_AGREEMENT,
    STAGES.COACHING_APPLICATION,
    STAGES.VOLUNTEER_AGREEMENT,
    STAGES.FINAL_CONFIRMATION_EMAIL,
    STAGES.THANK_YOU,
    STAGES.PAYMENT,
  ]);
});

test("player volunteer and coach non-scholarship path", () => {
  assert.deepEqual(buildRequiredStages({
    scholarshipRequested: "No",
    helpChoice: HELP_OPTION.BOTH,
  }), [
    STAGES.PLAYER_REGISTRATION,
    STAGES.PLAYER_AGREEMENT,
    STAGES.VOLUNTEER_APPLICATION,
    STAGES.COACHING_APPLICATION,
    STAGES.VOLUNTEER_AGREEMENT,
    STAGES.FINAL_CONFIRMATION_EMAIL,
    STAGES.THANK_YOU,
    STAGES.PAYMENT,
  ]);
});

test("player-only scholarship path", () => {
  assert.deepEqual(buildRequiredStages({
    scholarshipRequested: "Yes",
    helpChoice: HELP_OPTION.NO,
  }), [
    STAGES.PLAYER_REGISTRATION,
    STAGES.PLAYER_AGREEMENT,
    STAGES.SCHOLARSHIP_APPLICATION,
    STAGES.FINAL_CONFIRMATION_EMAIL,
    STAGES.THANK_YOU,
  ]);
});

test("player volunteer scholarship path", () => {
  assert.deepEqual(buildRequiredStages({
    scholarshipRequested: "Yes",
    helpChoice: HELP_OPTION.VOLUNTEER,
  }), [
    STAGES.PLAYER_REGISTRATION,
    STAGES.PLAYER_AGREEMENT,
    STAGES.SCHOLARSHIP_APPLICATION,
    STAGES.VOLUNTEER_APPLICATION,
    STAGES.VOLUNTEER_AGREEMENT,
    STAGES.FINAL_CONFIRMATION_EMAIL,
    STAGES.THANK_YOU,
  ]);
});

test("player coach scholarship path", () => {
  assert.deepEqual(buildRequiredStages({
    scholarshipRequested: "Yes",
    helpChoice: HELP_OPTION.COACH,
  }), [
    STAGES.PLAYER_REGISTRATION,
    STAGES.PLAYER_AGREEMENT,
    STAGES.SCHOLARSHIP_APPLICATION,
    STAGES.COACHING_APPLICATION,
    STAGES.VOLUNTEER_AGREEMENT,
    STAGES.FINAL_CONFIRMATION_EMAIL,
    STAGES.THANK_YOU,
  ]);
});

test("player volunteer and coach scholarship path", () => {
  assert.deepEqual(buildRequiredStages({
    scholarshipRequested: "Yes",
    helpChoice: HELP_OPTION.BOTH,
  }), [
    STAGES.PLAYER_REGISTRATION,
    STAGES.PLAYER_AGREEMENT,
    STAGES.SCHOLARSHIP_APPLICATION,
    STAGES.VOLUNTEER_APPLICATION,
    STAGES.COACHING_APPLICATION,
    STAGES.VOLUNTEER_AGREEMENT,
    STAGES.FINAL_CONFIRMATION_EMAIL,
    STAGES.THANK_YOU,
  ]);
});

test("standalone volunteer path", () => {
  assert.deepEqual(buildRequiredStages({
    standaloneFlow: STANDALONE_FLOW.VOLUNTEER,
  }), [
    STAGES.VOLUNTEER_APPLICATION,
    STAGES.VOLUNTEER_AGREEMENT,
    STAGES.FINAL_CONFIRMATION_EMAIL,
    STAGES.THANK_YOU,
  ]);
});

test("standalone coach path", () => {
  assert.deepEqual(buildRequiredStages({
    standaloneFlow: STANDALONE_FLOW.COACH,
  }), [
    STAGES.COACHING_APPLICATION,
    STAGES.VOLUNTEER_AGREEMENT,
    STAGES.FINAL_CONFIRMATION_EMAIL,
    STAGES.THANK_YOU,
  ]);
});

test("scholarship detection trims and ignores case", () => {
  assert.equal(isScholarshipRequested(" Yes "), true);
  assert.equal(isScholarshipRequested("yes"), true);
  assert.equal(isScholarshipRequested("No"), false);
});

test("descriptor assigns payment correctly", () => {
  const scholarshipDescriptor = getFlowDescriptor({ scholarshipRequested: " yes ", helpChoice: HELP_OPTION.BOTH });
  const registrationDescriptor = getFlowDescriptor({ scholarshipRequested: "No", helpChoice: HELP_OPTION.BOTH });
  const volunteerDescriptor = getFlowDescriptor({ standaloneFlow: STANDALONE_FLOW.VOLUNTEER });

  assert.equal(scholarshipDescriptor.emailType, EMAIL_TYPE.SCHOLARSHIP_PLAYER_VOLUNTEER_COACH);
  assert.equal(scholarshipDescriptor.paymentRequired, false);
  assert.equal(registrationDescriptor.emailType, EMAIL_TYPE.REGISTRATION_PLAYER_VOLUNTEER_COACH);
  assert.equal(registrationDescriptor.paymentRequired, true);
  assert.equal(volunteerDescriptor.emailType, EMAIL_TYPE.STANDALONE_VOLUNTEER);
  assert.equal(volunteerDescriptor.paymentRequired, false);
});