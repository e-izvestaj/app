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
    ocrStatus: "idle",
    ocrSuggestions: {},
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
    circumstances: defaultCircumstances(),
    note: "",
    selectedPhotoId: null,
    photoMarkers: [],
    annotatedPhotoDataUrl: null,
    sceneSketch: emptySceneSketch(),
    signatures: {
      a: null,
      b: null
    },
    signatureTimestamps: {
      a: null,
      b: null
    },
    pdfDataUrl: null
  };
}

export function normalizeReport(report: ReportDraft): ReportDraft {
  const empty = createEmptyReport();
  const next: ReportDraft = {
    ...empty,
    ...report,
    publicId: report.publicId || empty.publicId,
    status: (report.status === "completed" ? "locked" : report.status) || "draft",
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
      ocrSuggestions: {
        ...empty.vehicleA.ocrSuggestions,
        ...report.vehicleA?.ocrSuggestions
      },
      damageSuggestion: {
        ...empty.vehicleA.damageSuggestion,
        ...report.vehicleA?.damageSuggestion
      }
    },
    vehicleB: {
      ...empty.vehicleB,
      ...report.vehicleB,
      ocrSuggestions: {
        ...empty.vehicleB.ocrSuggestions,
        ...report.vehicleB?.ocrSuggestions
      },
      damageSuggestion: {
        ...empty.vehicleB.damageSuggestion,
        ...report.vehicleB?.damageSuggestion
      }
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
    }
  };

  if (next.status === "locked" && !next.lockedAt) {
    next.lockedAt = next.updatedAt || nowIso();
  }

  return next;
}

export function isReportReadyForSignature(report: ReportDraft) {
  const vehicles = [report.vehicleA, report.vehicleB];
  const vehiclesReady = vehicles.every((vehicle) => getVehicleMissingFields(vehicle).length === 0);

  return Boolean(
    report.location.date &&
      report.location.time &&
      report.location.address.trim() &&
      report.safety.injured !== null &&
      report.safety.damageOtherVehicles !== null &&
      report.safety.damageOtherObjects !== null &&
      report.safety.vehiclesInPosition !== null &&
      vehiclesReady &&
      (report.annotatedPhotoDataUrl || report.sceneSketch.svgDataUrl)
  );
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
  if (report.status === "locked" || report.lockedAt) {
    return "locked";
  }

  return isReportReadyForSignature(report) ? "ready_for_signature" : "draft";
}

export function getReportStatusLabel(
  status: ReportStatus,
  options?: {
    isLocking?: boolean;
  }
) {
  if (options?.isLocking) {
    return "Zakljucavanje u toku";
  }

  switch (status) {
    case "ready_for_signature":
      return "Spreman za potpise";
    case "locked":
    case "completed":
      return "Zakljucan";
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
