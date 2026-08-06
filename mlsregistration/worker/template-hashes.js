export const TEMPLATE_HASHES = {
  PLAYER: "f64fa9261ddf925208e918d100353335ab241ec6e30d2d2669e997d2fcaa5d29",
  VOLUNTEER: "0d7922d11776f943ec696bbfd8728d11bf86011e0bebaacd488f43b3d75552a8",
};

export const AGREEMENT_TEMPLATES = {
  player: {
    key: "/documents/MLS GO Player Registration Agreement.pdf",
    hash: TEMPLATE_HASHES.PLAYER,
    title: "MLS GO Player Registration Agreement",
    version: "2.1",
  },
  volunteer: {
    key: "/documents/MLS GO Volunteer Agreement.pdf",
    hash: TEMPLATE_HASHES.VOLUNTEER,
    title: "MLS GO Volunteer Agreement",
    version: "1.0",
  },
};
