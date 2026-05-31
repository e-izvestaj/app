import type {
  DamageSuggestion,
  DamageZone,
  ReportDraft,
  ReportStatus,
  ScenarioOption,
  SceneSketchSuggestion,
  VehicleDraft
} from "../types";

export type VehicleSection = "driver" | "vehicle" | "policy";

export const INSURER_OPTIONS = [
  "Dunav",
  "DDOR",
  "Generali",
  "Uniqa",
  "Wiener",
  "Triglav",
  "Drugo"
] as const;

export const POSTAL_CODE_CITY_OPTIONS = [
  { postalCode: "11000", city: "Beograd" },
  { postalCode: "11010", city: "Beograd" },
  { postalCode: "11030", city: "Beograd" },
  { postalCode: "11040", city: "Beograd" },
  { postalCode: "11050", city: "Beograd" },
  { postalCode: "11070", city: "Novi Beograd" },
  { postalCode: "11080", city: "Zemun" },
  { postalCode: "11090", city: "Beograd" },
  { postalCode: "11210", city: "Beograd" },
  { postalCode: "11271", city: "Surcin" },
  { postalCode: "11300", city: "Smederevo" },
  { postalCode: "12000", city: "Pozarevac" },
  { postalCode: "14000", city: "Valjevo" },
  { postalCode: "15000", city: "Sabac" },
  { postalCode: "16000", city: "Leskovac" },
  { postalCode: "17500", city: "Vranje" },
  { postalCode: "18000", city: "Nis" },
  { postalCode: "21000", city: "Novi Sad" },
  { postalCode: "23000", city: "Zrenjanin" },
  { postalCode: "24000", city: "Subotica" },
  { postalCode: "25000", city: "Sombor" },
  { postalCode: "26000", city: "Pancevo" },
  { postalCode: "31000", city: "Uzice" },
  { postalCode: "32000", city: "Cacak" },
  { postalCode: "34000", city: "Kragujevac" },
  { postalCode: "35000", city: "Jagodina" },
  { postalCode: "36000", city: "Kraljevo" },
  { postalCode: "37000", city: "Krusevac" },
  { postalCode: "38000", city: "Pristina" },
  { postalCode: "38103", city: "Kosovska Mitrovica" },
  { postalCode: "38220", city: "Kosovo Polje" },
  { postalCode: "38227", city: "Zvecan" },
  { postalCode: "38228", city: "Zubin Potok" },
  { postalCode: "38230", city: "Kosovska Mitrovica" }
] as const;

export const DAMAGE_ZONE_OPTIONS: DamageZone[] = [
  "prednji branik",
  "zadnji branik",
  "prednji levi ugao",
  "prednji desni ugao",
  "zadnji levi ugao",
  "zadnji desni ugao",
  "leva strana",
  "desna strana",
  "vrata",
  "blatobran",
  "hauba",
  "gepek"
];

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function resolveCityFromPostalCode(postalCode: string) {
  const normalized = postalCode.replace(/\D/g, "");
  return POSTAL_CODE_CITY_OPTIONS.find((option) => option.postalCode === normalized)?.city || "";
}

export function createPublicReportId() {
  return `EI-${Math.floor(10000 + Math.random() * 90000)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function formatTime(date: Date) {
  return date.toTimeString().slice(0, 5);
}

export function emptyDamageSuggestion(): DamageSuggestion {
  return {
    status: "idle",
    sourcePhotoId: null,
    suggestedZone: "",
    manualZone: ""
  };
}

export function emptySceneSketch(): SceneSketchSuggestion {
  return {
    status: "idle",
    scenePhotoId: null,
    summary: "",
    svgDataUrl: null,
    mapZoom: 20,
    mapCenterLatitude: null,
    mapCenterLongitude: null,
    laneType: "straight",
    vehicleAPosition: "left",
    vehicleBPosition: "right",
    vehicleAState: {
      x: 96,
      y: 136,
      rotation: 0,
      direction: "forward"
    },
    vehicleBState: {
      x: 224,
      y: 220,
      rotation: 180,
      direction: "forward"
    },
    impactPoint: {
      x: 160,
      y: 178
    },
    decorations: {
      stop: false,
      trafficLight: false,
      crosswalk: false,
      priority: false,
      parkedVehicle: false,
      curb: false,
      centerLine: true
    },
    drawPaths: [],
    confirmedAt: null
  };
}

function normalizeSketchDirection(
  direction: string | undefined
): SceneSketchSuggestion["vehicleAState"]["direction"] {
  switch (direction) {
    case "forward":
    case "backward":
    case "left":
    case "right":
    case "uturn":
      return direction;
    case "straight":
      return "forward";
    case "parking":
      return "backward";
    case "merge":
      return "uturn";
    default:
      return "forward";
  }
}

export function defaultVehicle(side: "A" | "B"): VehicleDraft {
  return {
    side,
    source: null,
    plate: "",
    registrationCountry: "Srbija",
    make: "",
    model: "",
    type: "",
    vin: "",
    trailerPlate: "",
    trailerRegistrationCountry: "Srbija",
    insurer: "",
    policyNumber: "",
    greenCardNumber: "",
    policyValidFrom: "",
    policyValidUntil: "",
    insuranceBranch: "",
    insuranceOfficeName: "",
    insuranceAddress: "",
    insuranceCity: "",
    insuranceCountry: "Srbija",
    insurancePhone: "",
    insuranceEmail: "",
    coveredDamage: null,
    ownerFirstName: "",
    ownerLastName: "",
    ownerAddress: "",
    ownerCity: "",
    ownerPostalCode: "",
    ownerCountry: "Srbija",
    ownerPhone: "",
    ownerEmail: "",
    ownerSameAsDriver: false,
    driverFirstName: "",
    driverLastName: "",
    driverBirthDate: "",
    driverAddress: "",
    driverPostalCode: "",
    driverCity: "",
    driverCountry: "Srbija",
    driverPhone: "",
    driverEmail: "",
    driverLicenseNumber: "",
    driverLicenseCategory: "",
    driverLicenseValidUntil: "",
    impactZone: "",
    visibleDamage: "",
    note: "",
    documentPhotos: [],
    damageSuggestion: emptyDamageSuggestion()
  };
}

export function defaultCircumstances(): ScenarioOption[] {
  return [
    "parkiran / zaustavljen",
    "napustao parking / otvarao vrata",
    "parkirao",
    "napustao parking, privatni posed, put",
    "poceo da skrece na parking, privatni posed, put",
    "upravo ulazio u kruzni tok",
    "prolazio kroz kruzni tok",
    "naleteo u istoj traci pozadi",
    "vozio u istom smeru, u drugoj traci",
    "menjao traku",
    "preticao",
    "skretao udesno",
    "skretao ulevo",
    "vozio unazad",
    "presao u traku suprotnog smera",
    "nije postovao znak prvenstva / crveno"
  ].map((label) => ({
    id: createId("circ"),
    label,
    selectedByA: false,
    selectedByB: false
  }));
}

export function createEmptyReport(): ReportDraft {
  const now = new Date();

  return {
    id: createId("report"),
    publicId: createPublicReportId(),
    status: "draft",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    readyForSignatureAt: null,
    lockedAt: null,
    scenePhotos: [],
    safety: {
      injured: null,
      vehiclesInPosition: null,
      damageOtherVehicles: null,
      damageOtherObjects: null
    },
    witnessInfo: "",
    location: {
      date: formatDate(now),
      time: formatTime(now),
      address: "",
      street: "",
      streetNumber: "",
      city: "",
      country: "Srbija"
    },
    vehicleA: defaultVehicle("A"),
    vehicleB: defaultVehicle("B"),
    partyA: defaultVehicle("A"),
    partyB: defaultVehicle("B"),
    circumstances: defaultCircumstances(),
    note: "",
    selectedPhotoId: null,
    photoMarkers: [],
    annotatedPhotoDataUrl: null,
    sceneSketch: emptySceneSketch(),
    signatures: {
      a: null,
      b: null,
      partyA: null,
      partyB: null
    },
    signatureTimestamps: {
      a: null,
      b: null
    },
    pdfDataUrl: null,
    programmaticPdfDataUrl: null
  };
}

export function normalizeReport(report: ReportDraft): ReportDraft {
  const empty = createEmptyReport();
  const next: ReportDraft = {
    ...empty,
    ...report,
    publicId: report.publicId || empty.publicId,
    status: report.status || "draft",
    readyForSignatureAt: report.readyForSignatureAt || null,
    lockedAt: report.lockedAt || null,
    witnessInfo: report.witnessInfo || "",
    safety: {
      ...empty.safety,
      ...report.safety
    },
    location: {
      ...empty.location,
      ...report.location
    },
    vehicleA: {
      ...empty.vehicleA,
      ...report.vehicleA,
      damageSuggestion: {
        ...empty.vehicleA.damageSuggestion,
        ...report.vehicleA?.damageSuggestion
      }
    },
    vehicleB: {
      ...empty.vehicleB,
      ...report.vehicleB,
      damageSuggestion: {
        ...empty.vehicleB.damageSuggestion,
        ...report.vehicleB?.damageSuggestion
      }
    },
    partyA: {
      ...empty.vehicleA,
      ...report.vehicleA,
      ...report.partyA
    },
    partyB: {
      ...empty.vehicleB,
      ...report.vehicleB,
      ...report.partyB
    },
    sceneSketch: {
      ...empty.sceneSketch,
      ...report.sceneSketch,
      vehicleAState: {
        ...empty.sceneSketch.vehicleAState,
        ...report.sceneSketch?.vehicleAState,
        direction: normalizeSketchDirection(report.sceneSketch?.vehicleAState?.direction)
      },
      vehicleBState: {
        ...empty.sceneSketch.vehicleBState,
        ...report.sceneSketch?.vehicleBState,
        direction: normalizeSketchDirection(report.sceneSketch?.vehicleBState?.direction)
      },
      impactPoint: {
        ...empty.sceneSketch.impactPoint,
        ...report.sceneSketch?.impactPoint
      },
      decorations: {
        ...empty.sceneSketch.decorations,
        ...report.sceneSketch?.decorations
      },
      drawPaths: report.sceneSketch?.drawPaths || empty.sceneSketch.drawPaths
    },
    signatureTimestamps: {
      ...empty.signatureTimestamps,
      ...report.signatureTimestamps
    },
    programmaticPdfDataUrl: report.programmaticPdfDataUrl || null
  };

  next.partyA = next.vehicleA;
  next.partyB = next.vehicleB;
  next.signatures = {
    ...next.signatures,
    partyA: next.signatures.partyA ?? next.signatures.a,
    partyB: next.signatures.partyB ?? next.signatures.b
  };

  if ((next.status === "locked" || next.status === "completed") && !next.lockedAt) {
    next.lockedAt = next.updatedAt || nowIso();
  }

  return next;
}

export function isReportReadyForSignature(report: ReportDraft) {
  const vehicleAReady = getVehicleMissingFields(report.vehicleA).length === 0;
  const hasPartyB =
    Boolean(report.vehicleB.source) ||
    Boolean(
      report.vehicleB.driverFirstName ||
        report.vehicleB.driverLastName ||
        report.vehicleB.plate ||
        report.vehicleB.insurer ||
        report.vehicleB.policyNumber
    );
  const hasLocation =
    report.location.address.trim() ||
    report.location.street.trim() ||
    report.location.city.trim() ||
    (report.location.latitude && report.location.longitude);

  return Boolean(
    report.location.date &&
      report.location.time &&
      hasLocation &&
      report.safety.injured !== null &&
      report.safety.damageOtherVehicles !== null &&
      report.safety.damageOtherObjects !== null &&
      report.safety.vehiclesInPosition !== null &&
      vehicleAReady &&
      hasPartyB &&
      (report.annotatedPhotoDataUrl || report.sceneSketch.svgDataUrl)
  );
}

export function hasDocumentSide(
  vehicle: VehicleDraft,
  documentType: "driver-license" | "registration" | "policy",
  documentSide: "front" | "back"
) {
  return vehicle.documentPhotos.some(
    (photo) => photo.documentType === documentType && photo.documentSide === documentSide
  );
}

export function getDocumentationMissingFields(report: ReportDraft) {
  const missing: string[] = [];
  const requirements: Array<{
    label: string;
    vehicle: VehicleDraft;
    documentType: "driver-license" | "registration" | "policy";
    side: "front" | "back";
  }> = [
    { label: "Vozacka dozvola A - prednja", vehicle: report.vehicleA, documentType: "driver-license", side: "front" },
    { label: "Vozacka dozvola A - zadnja", vehicle: report.vehicleA, documentType: "driver-license", side: "back" },
    { label: "Vozacka dozvola B - prednja", vehicle: report.vehicleB, documentType: "driver-license", side: "front" },
    { label: "Vozacka dozvola B - zadnja", vehicle: report.vehicleB, documentType: "driver-license", side: "back" },
    { label: "Saobracajna dozvola A - prednja", vehicle: report.vehicleA, documentType: "registration", side: "front" },
    { label: "Saobracajna dozvola A - zadnja", vehicle: report.vehicleA, documentType: "registration", side: "back" },
    { label: "Saobracajna dozvola B - prednja", vehicle: report.vehicleB, documentType: "registration", side: "front" },
    { label: "Saobracajna dozvola B - zadnja", vehicle: report.vehicleB, documentType: "registration", side: "back" },
    { label: "Polisa A - prednja", vehicle: report.vehicleA, documentType: "policy", side: "front" },
    { label: "Polisa B - prednja", vehicle: report.vehicleB, documentType: "policy", side: "front" }
  ];

  requirements.forEach((item) => {
    if (!hasDocumentSide(item.vehicle, item.documentType, item.side)) {
      missing.push(item.label);
    }
  });

  return missing;
}

export function getVehicleMissingFields(vehicle: VehicleDraft) {
  const missing: string[] = [];
  const requireValue = (label: string, value: string) => {
    if (!value.trim()) {
      missing.push(label);
    }
  };
  const requireOneOf = (label: string, values: string[]) => {
    if (!values.some((value) => value.trim())) {
      missing.push(label);
    }
  };

  requireValue("Prezime vozaca", vehicle.driverLastName);
  requireValue("Ime vozaca", vehicle.driverFirstName);
  requireValue("Datum rodjenja", vehicle.driverBirthDate);
  requireValue("Adresa vozaca", vehicle.driverAddress);
  requireValue("Postanski broj vozaca", vehicle.driverPostalCode);
  requireValue("Grad vozaca", vehicle.driverCity);
  requireOneOf("Telefon ili e-mail vozaca", [vehicle.driverPhone, vehicle.driverEmail]);
  requireValue("Broj vozacke dozvole", vehicle.driverLicenseNumber);
  requireValue("Kategorija dozvole", vehicle.driverLicenseCategory);
  requireValue("Vazenje vozacke dozvole", vehicle.driverLicenseValidUntil);

  requireValue("Marka vozila", vehicle.make);
  requireValue("Model vozila", vehicle.model);
  requireValue("Tip vozila", vehicle.type);
  requireValue("Registarska oznaka", vehicle.plate);
  requireValue("Drzava registracije", vehicle.registrationCountry);

  requireValue("Prezime ugovaraca", vehicle.ownerLastName);
  requireValue("Ime ugovaraca", vehicle.ownerFirstName);
  requireValue("Adresa ugovaraca", vehicle.ownerAddress);
  requireValue("Grad ugovaraca", vehicle.ownerCity);
  requireValue("Postanski broj ugovaraca", vehicle.ownerPostalCode);
  requireValue("Drzava ugovaraca", vehicle.ownerCountry);
  requireOneOf("Telefon ili e-mail ugovaraca", [vehicle.ownerPhone, vehicle.ownerEmail]);

  requireValue("Osiguravajuca kuca", vehicle.insurer);
  requireValue("Broj ugovora", vehicle.policyNumber);
  requireValue("Polisa vazi od", vehicle.policyValidFrom);
  requireValue("Polisa vazi do", vehicle.policyValidUntil);
  requireValue("Filijala ili posrednik", vehicle.insuranceBranch);
  requireValue("Naziv filijale", vehicle.insuranceOfficeName);
  requireValue("Adresa osiguranja", vehicle.insuranceAddress);
  requireValue("Grad osiguranja", vehicle.insuranceCity);
  requireValue("Drzava osiguranja", vehicle.insuranceCountry);
  requireOneOf("Telefon ili e-mail osiguranja", [vehicle.insurancePhone, vehicle.insuranceEmail]);

  return missing;
}

export function getVehicleSectionMissingFields(vehicle: VehicleDraft, section: VehicleSection) {
  const missing = getVehicleMissingFields(vehicle);

  if (section === "driver") {
    return missing.filter((field) =>
      [
        "Prezime vozaca",
        "Ime vozaca",
        "Datum rodjenja",
        "Adresa vozaca",
        "Postanski broj vozaca",
        "Grad vozaca",
        "Telefon ili e-mail vozaca",
        "Broj vozacke dozvole",
        "Kategorija dozvole",
        "Vazenje vozacke dozvole"
      ].includes(field)
    );
  }

  if (section === "vehicle") {
    return missing.filter((field) =>
      [
        "Marka vozila",
        "Model vozila",
        "Tip vozila",
        "Registarska oznaka",
        "Drzava registracije"
      ].includes(field)
    );
  }

  return missing.filter((field) =>
    [
      "Prezime ugovaraca",
      "Ime ugovaraca",
      "Adresa ugovaraca",
      "Grad ugovaraca",
      "Postanski broj ugovaraca",
      "Drzava ugovaraca",
      "Telefon ili e-mail ugovaraca",
      "Osiguravajuca kuca",
      "Broj ugovora",
      "Polisa vazi od",
      "Polisa vazi do",
      "Filijala ili posrednik",
      "Naziv filijale",
      "Adresa osiguranja",
      "Grad osiguranja",
      "Drzava osiguranja",
      "Telefon ili e-mail osiguranja"
    ].includes(field)
  );
}

export function deriveReportStatus(report: ReportDraft): ReportStatus {
  if (report.status === "locked" || report.status === "completed" || report.lockedAt) {
    return "completed";
  }

  if (isReportReadyForSignature(report)) {
    return "ready_for_pdf";
  }

  const hasPartyB =
    Boolean(report.vehicleB.source) ||
    Boolean(report.vehicleB.driverFirstName || report.vehicleB.driverLastName || report.vehicleB.plate);

  return hasPartyB ? "draft" : "waiting_for_b";
}

export function getReportStatusLabel(
  status: ReportStatus,
  options?: {
    isLocking?: boolean;
  }
) {
  if (options?.isLocking) {
    return "Zaključavanje u toku";
  }

  switch (status) {
    case "ready_for_signature":
      return "Spreman za potpisivanje";
    case "locked":
    case "completed":
      return "Zaključan";
    default:
      return "U izradi";
  }
}

export function reportTitle(report: ReportDraft) {
  return `${report.publicId} · ${new Date(report.createdAt).toLocaleDateString("sr-RS")}`;
}

export function getFinalReportUrl(reportId: string) {
  return `${window.location.origin}${import.meta.env.BASE_URL}#/report/${reportId}?view=final`;
}
