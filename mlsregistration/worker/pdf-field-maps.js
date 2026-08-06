export const PLAYER_AGREEMENT_FIELD_MAP = {
  pageFromEnd: 1,
  defaultFontSize: 10,
  fields: {
    participantNames: { x: 190, y: 632, maxWidth: 380, fontSize: 9 },
    guardianName: { x: 150, y: 450, maxWidth: 300, fontSize: 10 },
    guardianDob: { x: 480, y: 450, maxWidth: 95, fontSize: 10 },
    guardianStreet: { x: 150, y: 423, maxWidth: 445, fontSize: 10 },
    guardianCity: { x: 150, y: 395, maxWidth: 178, fontSize: 10 },
    guardianState: { x: 340, y: 395, maxWidth: 74, fontSize: 10 },
    guardianZip: { x: 462, y: 395, maxWidth: 105, fontSize: 10 },
    guardianPhone: { x: 150, y: 367, maxWidth: 170, fontSize: 10 },
    guardianEmail: { x: 336, y: 367, maxWidth: 232, fontSize: 10 },
    signingDate: { x: 450, y: 339, maxWidth: 120, fontSize: 10 },
  },
  signatureBounds: {
    primary: { x: 148, y: 335, width: 238, height: 20 },
    parent: { x: 148, y: 335, width: 238, height: 20 },
  },
};

export const VOLUNTEER_AGREEMENT_FIELD_MAP = {
  pageFromEnd: 1,
  defaultFontSize: 10,
  fields: {
    signingDate: { x: 125, y: 505, maxWidth: 120, fontSize: 10 },
    legalName: { x: 125, y: 480, maxWidth: 250, fontSize: 10 },
  },
  signatureBounds: {
    primary: { x: 150, y: 445, width: 385, height: 34 },
  },
};
