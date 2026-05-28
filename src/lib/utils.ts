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
    driverFirstName: "",
    driverLastName: "",
    driverBirthDate: "",
    driverAddress: "",
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
      ...report.sceneSketch
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
      vehiclesReady
  );
}

export function getVehicleMissingFields(vehicle: VehicleDraft) {
  const missing: string[] = [];
  const requireValue = (label: string, value: string) => {
    if (!value.trim()) {
      missing.push(label);
    }
  };

  requireValue("Prezime vozača", vehicle.driverLastName);
  requireValue("Ime vozača", vehicle.driverFirstName);
  requireValue("Datum rođenja", vehicle.driverBirthDate);
  requireValue("Adresa vozača", vehicle.driverAddress);
  requireValue("Grad vozača", vehicle.driverCity);
  requireValue("Telefon vozača", vehicle.driverPhone);
  requireValue("E-mail vozača", vehicle.driverEmail);
  requireValue("Broj vozačke dozvole", vehicle.driverLicenseNumber);
  requireValue("Kategorija dozvole", vehicle.driverLicenseCategory);
  requireValue("Važenje vozačke dozvole", vehicle.driverLicenseValidUntil);

  requireValue("Marka vozila", vehicle.make);
  requireValue("Model vozila", vehicle.model);
  requireValue("Tip vozila", vehicle.type);
  requireValue("Registarska oznaka", vehicle.plate);
  requireValue("Država registracije", vehicle.registrationCountry);

  requireValue("Prezime ugovarača", vehicle.ownerLastName);
  requireValue("Ime ugovarača", vehicle.ownerFirstName);
  requireValue("Adresa ugovarača", vehicle.ownerAddress);
  requireValue("Grad ugovarača", vehicle.ownerCity);
  requireValue("Poštanski broj ugovarača", vehicle.ownerPostalCode);
  requireValue("Država ugovarača", vehicle.ownerCountry);

  requireValue("Osiguravajuća kuća", vehicle.insurer);
  requireValue("Broj ugovora", vehicle.policyNumber);
  requireValue("Polisa važi od", vehicle.policyValidFrom);
  requireValue("Polisa važi do", vehicle.policyValidUntil);
  requireValue("Filijala / posrednik", vehicle.insuranceBranch);
  requireValue("Naziv filijale", vehicle.insuranceOfficeName);
  requireValue("Adresa osiguranja", vehicle.insuranceAddress);
  requireValue("Grad osiguranja", vehicle.insuranceCity);
  requireValue("Država osiguranja", vehicle.insuranceCountry);

  return missing;
}

export function getVehicleSectionMissingFields(vehicle: VehicleDraft, section: VehicleSection) {
  const missing = getVehicleMissingFields(vehicle);

  if (section === "driver") {
    return missing.filter((field) =>
      [
        "Prezime vozaÄa",
        "Ime vozaÄa",
        "Datum roÄ‘enja",
        "Adresa vozaÄa",
        "Grad vozaÄa",
        "Telefon vozaÄa",
        "E-mail vozaÄa",
        "Broj vozaÄke dozvole",
        "Kategorija dozvole",
        "VaÅ¾enje vozaÄke dozvole"
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
        "DrÅ¾ava registracije"
      ].includes(field)
    );
  }

  return missing.filter((field) =>
    [
      "Prezime ugovaraÄa",
      "Ime ugovaraÄa",
      "Adresa ugovaraÄa",
      "Grad ugovaraÄa",
      "PoÅ¡tanski broj ugovaraÄa",
      "DrÅ¾ava ugovaraÄa",
      "OsiguravajuÄ‡a kuÄ‡a",
      "Broj ugovora",
      "Polisa vaÅ¾i od",
      "Polisa vaÅ¾i do",
      "Filijala / posrednik",
      "Naziv filijale",
      "Adresa osiguranja",
      "Grad osiguranja",
      "DrÅ¾ava osiguranja"
    ].includes(field)
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
