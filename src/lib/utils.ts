import type {
  DamageSuggestion,
  DamageZone,
  ReportDraft,
  ReportStatus,
  ScenarioOption,
  SceneSketchSuggestion,
  VehicleDraft
} from "../types";

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
    laneType: "straight",
    vehicleAPosition: "left",
    vehicleBPosition: "right"
  };
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
    insurer: "",
    policyNumber: "",
    greenCardNumber: "",
    policyValidFrom: "",
    policyValidUntil: "",
    insuranceBranch: "",
    insuranceAddress: "",
    insuranceContact: "",
    coveredDamage: null,
    ownerFirstName: "",
    ownerLastName: "",
    ownerAddress: "",
    ownerPostalCode: "",
    ownerCountry: "Srbija",
    ownerContact: "",
    driverFirstName: "",
    driverLastName: "",
    driverBirthDate: "",
    driverAddress: "",
    driverCountry: "Srbija",
    driverContact: "",
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
    "napuštao parking / otvarao vrata",
    "parkirao",
    "napuštao parking, privatni posed, put",
    "počeo da skreće na parking, privatni posed, put",
    "upravo ulazio u kružni tok",
    "prolazio kroz kružni tok",
    "naleteo u istoj traci pozadi",
    "vozio u istom smeru, u drugoj traci",
    "menjao traku",
    "preticao",
    "skretao udesno",
    "skretao ulevo",
    "vozio unazad",
    "prešao u traku suprotnog smera",
    "nije poštovao znak prvenstva / crveno"
  ].map((label) => ({
    id: createId("circ"),
    label,
    selected: false
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
      ...report.sceneSketch
    }
  };

  if (next.status === "locked" && !next.lockedAt) {
    next.lockedAt = next.updatedAt || nowIso();
  }

  return next;
}

export function isReportReadyForSignature(report: ReportDraft) {
  const vehicles = [report.vehicleA, report.vehicleB];
  const vehiclesReady = vehicles.every(
    (vehicle) =>
      vehicle.plate.trim() &&
      vehicle.make.trim() &&
      vehicle.insurer.trim() &&
      vehicle.policyNumber.trim() &&
      vehicle.driverFirstName.trim() &&
      vehicle.driverLastName.trim() &&
      vehicle.driverLicenseNumber.trim()
  );

  return Boolean(
    report.location.date &&
      report.location.time &&
      report.location.address.trim() &&
      report.safety.injured !== null &&
      report.safety.damageOtherVehicles !== null &&
      report.safety.damageOtherObjects !== null &&
      report.safety.vehiclesInPosition !== null &&
      vehiclesReady
  );
}

export function deriveReportStatus(report: ReportDraft): ReportStatus {
  if (report.status === "locked" || report.lockedAt) {
    return "locked";
  }

  return isReportReadyForSignature(report) ? "ready_for_signature" : "draft";
}

export function reportTitle(report: ReportDraft) {
  return `${report.publicId} · ${new Date(report.createdAt).toLocaleDateString("sr-RS")}`;
}

export function getFinalReportUrl(reportId: string) {
  return `${window.location.origin}${import.meta.env.BASE_URL}#/report/${reportId}?view=final`;
}
