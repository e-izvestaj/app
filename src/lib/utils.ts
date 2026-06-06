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
  "Grawe",
  "Uniqa",
  "Wiener",
  "Triglav",
  "Drugo"
] as const;

export const VEHICLE_MODELS_BY_MAKE: Record<string, readonly string[]> = {
  "Alfa Romeo": ["Giulia", "Giulietta", "Stelvio", "Tonale"],
  Audi: ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q5", "Q7", "Q8"],
  BMW: ["Serija 1", "Serija 2", "Serija 3", "Serija 4", "Serija 5", "Serija 7", "X1", "X3", "X5", "X6"],
  Chevrolet: ["Aveo", "Captiva", "Cruze", "Orlando", "Spark"],
  Citroen: ["C1", "C3", "C4", "C5", "Berlingo", "Jumper", "Jumpy"],
  Cupra: ["Ateca", "Born", "Formentor", "Leon"],
  Dacia: ["Duster", "Jogger", "Logan", "Sandero", "Spring"],
  Fiat: ["500", "500L", "500X", "Bravo", "Doblo", "Ducato", "Panda", "Punto", "Tipo"],
  Ford: ["C-Max", "Fiesta", "Focus", "Kuga", "Mondeo", "Ranger", "Transit"],
  Honda: ["Accord", "Civic", "CR-V", "HR-V", "Jazz"],
  Hyundai: ["Bayon", "i10", "i20", "i30", "Kona", "Santa Fe", "Tucson"],
  Iveco: ["Daily", "Eurocargo", "S-Way", "Stralis"],
  Jaguar: ["E-Pace", "F-Pace", "I-Pace", "XE", "XF"],
  Jeep: ["Cherokee", "Compass", "Grand Cherokee", "Renegade", "Wrangler"],
  Kia: ["Ceed", "Picanto", "Rio", "Sorento", "Sportage", "Stonic"],
  Lada: ["Niva", "Samara"],
  "Land Rover": ["Defender", "Discovery", "Evoque", "Range Rover", "Range Rover Sport"],
  Lexus: ["ES", "IS", "NX", "RX", "UX"],
  Mazda: ["2", "3", "6", "CX-3", "CX-30", "CX-5", "CX-60"],
  "Mercedes-Benz": ["A klasa", "B klasa", "C klasa", "E klasa", "S klasa", "CLA", "GLA", "GLC", "GLE", "Sprinter", "Vito"],
  Mini: ["Clubman", "Cooper", "Countryman"],
  Mitsubishi: ["ASX", "Colt", "Lancer", "Outlander", "Pajero"],
  Nissan: ["Juke", "Micra", "Navara", "Note", "Qashqai", "X-Trail"],
  Opel: ["Astra", "Corsa", "Crossland", "Insignia", "Mokka", "Vivaro", "Zafira"],
  Peugeot: ["107", "208", "308", "508", "2008", "3008", "5008", "Partner", "Boxer"],
  Porsche: ["911", "Cayenne", "Macan", "Panamera", "Taycan"],
  Renault: ["Captur", "Clio", "Kadjar", "Kangoo", "Megane", "Scenic", "Trafic"],
  Saab: ["9-3", "9-5"],
  Seat: ["Arona", "Ateca", "Ibiza", "Leon", "Tarraco"],
  Skoda: ["Fabia", "Karoq", "Kodiaq", "Octavia", "Rapid", "Scala", "Superb"],
  Smart: ["Forfour", "Fortwo"],
  Subaru: ["Forester", "Impreza", "Legacy", "Outback", "XV"],
  Suzuki: ["Baleno", "Ignis", "S-Cross", "Swift", "Vitara"],
  Tesla: ["Model 3", "Model S", "Model X", "Model Y"],
  Toyota: ["Auris", "Avensis", "C-HR", "Corolla", "Hilux", "Land Cruiser", "RAV4", "Yaris"],
  Volkswagen: ["Arteon", "Caddy", "Golf", "Jetta", "Passat", "Polo", "T-Cross", "T-Roc", "Tiguan", "Touareg", "Transporter"],
  Volvo: ["S60", "S90", "V40", "V60", "V90", "XC40", "XC60", "XC90"],
  Zastava: ["101", "128", "750", "Florida", "Yugo"]
};

export const VEHICLE_MAKE_OPTIONS = Object.keys(VEHICLE_MODELS_BY_MAKE);

export const VEHICLE_TYPE_OPTIONS = [
  "Putnicko",
  "Teretno"
] as const;

export const SERBIAN_REGISTRATION_AREA_OPTIONS = [
  { code: "BG", city: "Beograd" },
  { code: "NS", city: "Novi Sad" },
  { code: "NI", city: "Nis" },
  { code: "KG", city: "Kragujevac" },
  { code: "SU", city: "Subotica" },
  { code: "PA", city: "Pancevo" },
  { code: "ZR", city: "Zrenjanin" },
  { code: "SO", city: "Sombor" },
  { code: "SM", city: "Sremska Mitrovica" },
  { code: "KI", city: "Kikinda" },
  { code: "BP", city: "Backa Palanka" },
  { code: "BT", city: "Backa Topola" },
  { code: "BO", city: "Bor" },
  { code: "VA", city: "Valjevo" },
  { code: "ZA", city: "Zajecar" },
  { code: "JA", city: "Jagodina" },
  { code: "KV", city: "Kraljevo" },
  { code: "KS", city: "Krusevac" },
  { code: "LE", city: "Leskovac" },
  { code: "LO", city: "Loznica" },
  { code: "NP", city: "Novi Pazar" },
  { code: "PI", city: "Pirot" },
  { code: "PO", city: "Pozarevac" },
  { code: "SD", city: "Smederevo" },
  { code: "UE", city: "Uzice" },
  { code: "ČA", city: "Cacak" },
  { code: "ŠA", city: "Sabac" }
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

export function normalizePhone(value: string) {
  const trimmed = value.trimStart();
  const hasLeadingPlus = trimmed.startsWith("+");
  const digits = value.replace(/\D/g, "");
  return `${hasLeadingPlus ? "+" : ""}${digits}`;
}

export function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
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
    { label: "Saobracajna dozvola A - prednja", vehicle: report.vehicleA, documentType: "registration", side: "front" },
    { label: "Saobracajna dozvola A - zadnja", vehicle: report.vehicleA, documentType: "registration", side: "back" },
    { label: "Saobracajna dozvola B - prednja", vehicle: report.vehicleB, documentType: "registration", side: "front" },
    { label: "Saobracajna dozvola B - zadnja", vehicle: report.vehicleB, documentType: "registration", side: "back" }
  ];

  requirements.forEach((item) => {
    if (!hasDocumentSide(item.vehicle, item.documentType, item.side)) {
      missing.push(item.label);
    }
  });

  if (!report.scenePhotos.some((photo) => photo.kind === "damage-a")) {
    missing.push("Fotografija stete na vozilu A");
  }

  if (!report.scenePhotos.some((photo) => photo.kind === "damage-b")) {
    missing.push("Fotografija stete na vozilu B");
  }

  return missing;
}

export function getVehicleMissingFields(vehicle: VehicleDraft) {
  const missing: string[] = [];
  const today = new Date().toISOString().slice(0, 10);
  const [todayYear, todayMonth, todayDay] = today.split("-").map(Number);
  const minimumDriverBirthDate = new Date(todayYear - 16, todayMonth - 1, todayDay);
  const latestAllowedDriverBirthDate = [
    minimumDriverBirthDate.getFullYear(),
    String(minimumDriverBirthDate.getMonth() + 1).padStart(2, "0"),
    String(minimumDriverBirthDate.getDate()).padStart(2, "0")
  ].join("-");
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
  if (vehicle.driverBirthDate && vehicle.driverBirthDate > today) {
    missing.push("Datum rodjenja ne moze biti u buducnosti");
  }
  if (vehicle.driverBirthDate && vehicle.driverBirthDate > latestAllowedDriverBirthDate) {
    missing.push("Vozac mora imati najmanje 16 godina");
  }
  requireValue("Adresa vozaca", vehicle.driverAddress);
  requireValue("Postanski broj vozaca", vehicle.driverPostalCode);
  if (vehicle.driverPostalCode && !/^\d{5}$/.test(vehicle.driverPostalCode)) {
    missing.push("Ispravan postanski broj vozaca");
  }
  requireValue("Grad vozaca", vehicle.driverCity);
  requireOneOf("Telefon ili e-mail vozaca", [vehicle.driverPhone, vehicle.driverEmail]);
  if (vehicle.driverPhone && !isValidPhone(vehicle.driverPhone)) {
    missing.push("Ispravan telefon vozaca");
  }
  if (vehicle.driverEmail && !isValidEmail(vehicle.driverEmail)) {
    missing.push("Ispravan e-mail vozaca");
  }
  requireValue("Broj vozacke dozvole", vehicle.driverLicenseNumber);
  requireValue("Kategorija dozvole", vehicle.driverLicenseCategory);
  requireValue("Vazenje vozacke dozvole", vehicle.driverLicenseValidUntil);
  if (vehicle.driverLicenseValidUntil && vehicle.driverLicenseValidUntil < today) {
    missing.push("Vozacka dozvola je istekla");
  }

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
  if (vehicle.ownerPostalCode && !/^\d{5}$/.test(vehicle.ownerPostalCode)) {
    missing.push("Ispravan postanski broj ugovaraca");
  }
  requireValue("Drzava ugovaraca", vehicle.ownerCountry);
  requireOneOf("Telefon ili e-mail ugovaraca", [vehicle.ownerPhone, vehicle.ownerEmail]);
  if (vehicle.ownerPhone && !isValidPhone(vehicle.ownerPhone)) {
    missing.push("Ispravan telefon ugovaraca");
  }
  if (vehicle.ownerEmail && !isValidEmail(vehicle.ownerEmail)) {
    missing.push("Ispravan e-mail ugovaraca");
  }

  requireValue("Osiguravajuca kuca", vehicle.insurer);
  requireValue("Broj ugovora", vehicle.policyNumber);
  requireValue("Polisa vazi od", vehicle.policyValidFrom);
  if (vehicle.policyValidFrom && vehicle.policyValidFrom > today) {
    missing.push("Polisa vazi od ne moze biti u buducnosti");
  }
  requireValue("Polisa vazi do", vehicle.policyValidUntil);
  requireValue("Filijala ili posrednik", vehicle.insuranceBranch);
  requireValue("Naziv filijale", vehicle.insuranceOfficeName);
  requireValue("Adresa osiguranja", vehicle.insuranceAddress);
  requireValue("Grad osiguranja", vehicle.insuranceCity);
  requireValue("Drzava osiguranja", vehicle.insuranceCountry);
  requireOneOf("Telefon ili e-mail osiguranja", [vehicle.insurancePhone, vehicle.insuranceEmail]);
  if (vehicle.insurancePhone && !isValidPhone(vehicle.insurancePhone)) {
    missing.push("Ispravan telefon osiguranja");
  }
  if (vehicle.insuranceEmail && !isValidEmail(vehicle.insuranceEmail)) {
    missing.push("Ispravan e-mail osiguranja");
  }

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
        "Datum rodjenja ne moze biti u buducnosti",
        "Vozac mora imati najmanje 16 godina",
        "Adresa vozaca",
        "Postanski broj vozaca",
        "Ispravan postanski broj vozaca",
        "Grad vozaca",
        "Telefon ili e-mail vozaca",
        "Ispravan telefon vozaca",
        "Ispravan e-mail vozaca",
        "Broj vozacke dozvole",
        "Kategorija dozvole",
        "Vazenje vozacke dozvole",
        "Vozacka dozvola je istekla"
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
      "Ispravan postanski broj ugovaraca",
      "Drzava ugovaraca",
      "Telefon ili e-mail ugovaraca",
      "Ispravan telefon ugovaraca",
      "Ispravan e-mail ugovaraca",
      "Osiguravajuca kuca",
      "Broj ugovora",
      "Polisa vazi od",
      "Polisa vazi od ne moze biti u buducnosti",
      "Polisa vazi do",
      "Filijala ili posrednik",
      "Naziv filijale",
      "Adresa osiguranja",
      "Grad osiguranja",
      "Drzava osiguranja",
      "Telefon ili e-mail osiguranja",
      "Ispravan telefon osiguranja",
      "Ispravan e-mail osiguranja"
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
