export const PLAYER_AGREEMENT_FIELD_MAP = {
  pageFromEnd: 1,
  defaultFontSize: 10,
  fields: {
    participantNames: { x: 75, y: 615, maxWidth: 380, fontSize: 9 },
    guardianName: { x: 135, y: 450, maxWidth: 300, fontSize: 12 },
    guardianDob: { x: 475, y: 450, maxWidth: 95, fontSize: 12 },
    guardianStreet: { x: 135, y: 423, maxWidth: 445, fontSize: 12 },
    guardianCity: { x: 135, y: 395, maxWidth: 178, fontSize: 12 },
    guardianState: { x: 340, y: 395, maxWidth: 74, fontSize: 12 },
    guardianZip: { x: 462, y: 395, maxWidth: 105, fontSize: 12 },
    guardianPhone: { x: 135, y: 367, maxWidth: 170, fontSize: 12 },
    guardianEmail: { x: 340, y: 367, maxWidth: 232, fontSize: 12 },
    signingDate: { x: 450, y: 339, maxWidth: 120, fontSize: 12 },
  },
  signatureBounds: {
    primary: { x: 135, y: 335, width: 238, height: 20 },
    parent: { x: 135, y: 335, width: 238, height: 20 },
  },
};

export const VOLUNTEER_AGREEMENT_FIELD_MAP = {
  pageFromEnd: 1,
  defaultFontSize: 10,
  fields: {
    signingDate: { x: 125, y: 503, maxWidth: 120, fontSize: 10 },
    legalName: { x: 125, y: 476, maxWidth: 250, fontSize: 10 },
  },
  signatureBounds: {
    primary: { x: 150, y: 440, width: 385, height: 34 },
  },
};
