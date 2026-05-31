export const PDF_TEMPLATE_WIDTH = 960;
export const PDF_TEMPLATE_HEIGHT = 1358;
export const PDF_PAGE_WIDTH = 595.28;
export const PDF_PAGE_HEIGHT = 841.89;
export const PDF_PAGE_MARGIN = 18;
export const PDF_SCALE = Math.min(
  (PDF_PAGE_WIDTH - PDF_PAGE_MARGIN * 2) / PDF_TEMPLATE_WIDTH,
  (PDF_PAGE_HEIGHT - PDF_PAGE_MARGIN * 2) / PDF_TEMPLATE_HEIGHT
);
export const PDF_OFFSET_X = (PDF_PAGE_WIDTH - PDF_TEMPLATE_WIDTH * PDF_SCALE) / 2;
export const PDF_OFFSET_Y = (PDF_PAGE_HEIGHT - PDF_TEMPLATE_HEIGHT * PDF_SCALE) / 2;

export type ProgrammaticTextBox = {
  left: number;
  top: number;
  width: number;
  height: number;
  size?: number;
  maxLines?: number;
  align?: "left" | "center";
};

type Box = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const LEFT_COLUMN = { left: 44, top: 190, width: 282, height: 1124 } satisfies Box;
const CENTER_COLUMN = { left: 326, top: 190, width: 308, height: 1124 } satisfies Box;
const RIGHT_COLUMN = { left: 634, top: 190, width: 282, height: 1124 } satisfies Box;

const ownerTop = 234;
const ownerHeight = 150;
const vehicleTop = 384;
const vehicleHeight = 182;
const insuranceTop = 566;
const insuranceHeight = 274;
const driverTop = 840;
const driverHeight = 222;
const impactTop = 1062;
const impactHeight = 120;
const visibleTop = 1182;
const visibleHeight = 82;
const notesTop = 1264;
const notesHeight = 90;

export const PDF_LAYOUT = {
  page: {
    width: PDF_TEMPLATE_WIDTH,
    height: PDF_TEMPLATE_HEIGHT,
    margin: 44
  },
  header: {
    titleY: 42,
    topRowY: 74,
    topRowHeight: 42,
    secondRowY: 116,
    secondRowHeight: 70
  },
  topFields: {
    dateTime: { left: 44, top: 74, width: 280, height: 42 } satisfies Box,
    place: { left: 324, top: 74, width: 292, height: 42 } satisfies Box,
    injured: { left: 616, top: 74, width: 300, height: 42 } satisfies Box,
    damage: { left: 44, top: 116, width: 280, height: 70 } satisfies Box,
    witnesses: { left: 324, top: 116, width: 592, height: 70 } satisfies Box
  },
  columns: {
    left: LEFT_COLUMN,
    center: CENTER_COLUMN,
    right: RIGHT_COLUMN
  },
  leftSections: {
    owner: { left: LEFT_COLUMN.left, top: ownerTop, width: LEFT_COLUMN.width, height: ownerHeight } satisfies Box,
    vehicle: { left: LEFT_COLUMN.left, top: vehicleTop, width: LEFT_COLUMN.width, height: vehicleHeight } satisfies Box,
    insurance: { left: LEFT_COLUMN.left, top: insuranceTop, width: LEFT_COLUMN.width, height: insuranceHeight } satisfies Box,
    driver: { left: LEFT_COLUMN.left, top: driverTop, width: LEFT_COLUMN.width, height: driverHeight } satisfies Box,
    impact: { left: LEFT_COLUMN.left, top: impactTop, width: LEFT_COLUMN.width, height: impactHeight } satisfies Box,
    visible: { left: LEFT_COLUMN.left, top: visibleTop, width: LEFT_COLUMN.width, height: visibleHeight } satisfies Box,
    notes: { left: LEFT_COLUMN.left, top: notesTop, width: LEFT_COLUMN.width, height: notesHeight } satisfies Box
  },
  rightSections: {
    owner: { left: RIGHT_COLUMN.left, top: ownerTop, width: RIGHT_COLUMN.width, height: ownerHeight } satisfies Box,
    vehicle: { left: RIGHT_COLUMN.left, top: vehicleTop, width: RIGHT_COLUMN.width, height: vehicleHeight } satisfies Box,
    insurance: { left: RIGHT_COLUMN.left, top: insuranceTop, width: RIGHT_COLUMN.width, height: insuranceHeight } satisfies Box,
    driver: { left: RIGHT_COLUMN.left, top: driverTop, width: RIGHT_COLUMN.width, height: driverHeight } satisfies Box,
    impact: { left: RIGHT_COLUMN.left, top: impactTop, width: RIGHT_COLUMN.width, height: impactHeight } satisfies Box,
    visible: { left: RIGHT_COLUMN.left, top: visibleTop, width: RIGHT_COLUMN.width, height: visibleHeight } satisfies Box,
    notes: { left: RIGHT_COLUMN.left, top: notesTop, width: RIGHT_COLUMN.width, height: notesHeight } satisfies Box
  },
  centerSections: {
    circumstances: { left: CENTER_COLUMN.left, top: 190, width: CENTER_COLUMN.width, height: 430 } satisfies Box,
    sketch: { left: CENTER_COLUMN.left, top: 620, width: CENTER_COLUMN.width, height: 498 } satisfies Box,
    signatures: { left: CENTER_COLUMN.left, top: 1118, width: CENTER_COLUMN.width, height: 196 } satisfies Box
  },
  sketchImage: { left: 336, top: 654, width: 288, height: 448 } satisfies Box,
  signatures: {
    a: { left: 384, top: 1258, width: 114, height: 48 } satisfies Box,
    b: { left: 536, top: 1258, width: 114, height: 48 } satisfies Box
  },
  impactDiagrams: {
    a: { left: 58, top: 1094, width: 116, height: 74 } satisfies Box,
    b: { left: 742, top: 1094, width: 116, height: 74 } satisfies Box
  },
  impactText: {
    a: { left: 182, top: 1094, width: 132, height: 74 } satisfies Box,
    b: { left: 610, top: 1094, width: 122, height: 74 } satisfies Box
  },
  visibleText: {
    a: { left: 58, top: 1204, width: 254, height: 54 } satisfies Box,
    b: { left: 646, top: 1204, width: 254, height: 54 } satisfies Box
  },
  notesText: {
    a: { left: 58, top: 1286, width: 254, height: 62 } satisfies Box,
    b: { left: 646, top: 1286, width: 254, height: 62 } satisfies Box
  },
  circumstances: {
    leftCheckX: 336,
    labelX: 380,
    rightCheckX: 615,
    numberLeftX: 356,
    numberRightX: 595,
    startY: 258,
    step: 21,
    labelWidth: 210
  }
};

export const PDF_TEXT_FIELDS = {
  accidentDate: { left: 58, top: 88, width: 110, height: 16, size: 8 },
  accidentTime: { left: 216, top: 88, width: 64, height: 16, size: 8 },
  city: { left: 390, top: 88, width: 92, height: 16, size: 8 },
  street: { left: 490, top: 88, width: 112, height: 16, size: 7.4 },
  country: { left: 374, top: 107, width: 120, height: 14, size: 7.1 },
  witnesses: { left: 334, top: 136, width: 570, height: 42, size: 7.1, maxLines: 3 },

  leftOwnerLastName: { left: 60, top: 274, width: 248, height: 14, size: 7.8 },
  leftOwnerFirstName: { left: 60, top: 301, width: 248, height: 14, size: 7.8 },
  leftOwnerAddress: { left: 60, top: 328, width: 248, height: 18, size: 7.2, maxLines: 2 },
  leftOwnerPostal: { left: 118, top: 355, width: 84, height: 14, size: 7.1 },
  leftOwnerCountry: { left: 254, top: 355, width: 50, height: 14, size: 7.1 },
  leftOwnerContact: { left: 60, top: 372, width: 244, height: 12, size: 6.6 },

  rightOwnerLastName: { left: 650, top: 274, width: 248, height: 14, size: 7.8 },
  rightOwnerFirstName: { left: 650, top: 301, width: 248, height: 14, size: 7.8 },
  rightOwnerAddress: { left: 650, top: 328, width: 248, height: 18, size: 7.2, maxLines: 2 },
  rightOwnerPostal: { left: 708, top: 355, width: 84, height: 14, size: 7.1 },
  rightOwnerCountry: { left: 842, top: 355, width: 54, height: 14, size: 7.1 },
  rightOwnerContact: { left: 650, top: 372, width: 244, height: 12, size: 6.6 },

  leftVehicleMain: { left: 60, top: 446, width: 116, height: 34, size: 7.2, maxLines: 2 },
  leftPlate: { left: 60, top: 504, width: 118, height: 16, size: 7.6 },
  leftRegCountry: { left: 60, top: 560, width: 120, height: 18, size: 6.9, maxLines: 2 },
  leftTrailerPlate: { left: 206, top: 504, width: 106, height: 16, size: 7.2 },
  leftTrailerCountry: { left: 206, top: 560, width: 106, height: 18, size: 6.7, maxLines: 2 },

  rightVehicleMain: { left: 650, top: 446, width: 116, height: 34, size: 7.2, maxLines: 2 },
  rightPlate: { left: 650, top: 504, width: 118, height: 16, size: 7.6 },
  rightRegCountry: { left: 650, top: 560, width: 120, height: 18, size: 6.9, maxLines: 2 },
  rightTrailerPlate: { left: 796, top: 504, width: 106, height: 16, size: 7.2 },
  rightTrailerCountry: { left: 796, top: 560, width: 106, height: 18, size: 6.7, maxLines: 2 },

  leftInsurer: { left: 60, top: 610, width: 190, height: 14, size: 7.2 },
  leftPolicyNumber: { left: 112, top: 635, width: 156, height: 14, size: 7.1 },
  leftGreenCard: { left: 146, top: 660, width: 146, height: 14, size: 7.1 },
  leftPolicyFrom: { left: 72, top: 702, width: 64, height: 14, size: 6.8 },
  leftPolicyTo: { left: 252, top: 702, width: 56, height: 14, size: 6.8 },
  leftBranch: { left: 150, top: 744, width: 152, height: 14, size: 7 },
  leftOffice: { left: 60, top: 769, width: 190, height: 14, size: 7 },
  leftInsuranceAddress: { left: 60, top: 794, width: 242, height: 14, size: 7 },
  leftInsuranceCountry: { left: 254, top: 819, width: 48, height: 14, size: 7 },
  leftInsuranceContact: { left: 60, top: 844, width: 244, height: 14, size: 6.6 },

  rightInsurer: { left: 650, top: 610, width: 190, height: 14, size: 7.2 },
  rightPolicyNumber: { left: 702, top: 635, width: 156, height: 14, size: 7.1 },
  rightGreenCard: { left: 736, top: 660, width: 146, height: 14, size: 7.1 },
  rightPolicyFrom: { left: 662, top: 702, width: 64, height: 14, size: 6.8 },
  rightPolicyTo: { left: 842, top: 702, width: 56, height: 14, size: 6.8 },
  rightBranch: { left: 740, top: 744, width: 152, height: 14, size: 7 },
  rightOffice: { left: 650, top: 769, width: 190, height: 14, size: 7 },
  rightInsuranceAddress: { left: 650, top: 794, width: 242, height: 14, size: 7 },
  rightInsuranceCountry: { left: 844, top: 819, width: 48, height: 14, size: 7 },
  rightInsuranceContact: { left: 650, top: 844, width: 244, height: 14, size: 6.6 },

  leftDriverLastName: { left: 60, top: 884, width: 246, height: 14, size: 7.8 },
  leftDriverFirstName: { left: 60, top: 911, width: 246, height: 14, size: 7.8 },
  leftDriverBirthDate: { left: 116, top: 938, width: 100, height: 14, size: 7.1 },
  leftDriverAddress: { left: 60, top: 965, width: 244, height: 18, size: 7, maxLines: 2 },
  leftDriverCountry: { left: 250, top: 983, width: 54, height: 14, size: 7 },
  leftDriverContact: { left: 60, top: 1006, width: 244, height: 14, size: 6.6 },
  leftDriverLicenseNumber: { left: 118, top: 1032, width: 156, height: 14, size: 7.1 },
  leftDriverLicenseCategory: { left: 132, top: 1057, width: 142, height: 14, size: 6.8 },
  leftDriverLicenseUntil: { left: 148, top: 1082, width: 124, height: 14, size: 6.8 },

  rightDriverLastName: { left: 650, top: 884, width: 246, height: 14, size: 7.8 },
  rightDriverFirstName: { left: 650, top: 911, width: 246, height: 14, size: 7.8 },
  rightDriverBirthDate: { left: 706, top: 938, width: 100, height: 14, size: 7.1 },
  rightDriverAddress: { left: 650, top: 965, width: 244, height: 18, size: 7, maxLines: 2 },
  rightDriverCountry: { left: 840, top: 983, width: 54, height: 14, size: 7 },
  rightDriverContact: { left: 650, top: 1006, width: 244, height: 14, size: 6.6 },
  rightDriverLicenseNumber: { left: 708, top: 1032, width: 156, height: 14, size: 7.1 },
  rightDriverLicenseCategory: { left: 722, top: 1057, width: 142, height: 14, size: 6.8 },
  rightDriverLicenseUntil: { left: 738, top: 1082, width: 124, height: 14, size: 6.8 },

  leftVisibleDamage: { left: 58, top: 1204, width: 254, height: 54, size: 6.9, maxLines: 4 },
  rightVisibleDamage: { left: 646, top: 1204, width: 254, height: 54, size: 6.9, maxLines: 4 },
  leftNote: { left: 58, top: 1286, width: 254, height: 62, size: 6.9, maxLines: 4 },
  rightNote: { left: 646, top: 1286, width: 254, height: 62, size: 6.9, maxLines: 4 }
} satisfies Record<string, ProgrammaticTextBox>;
