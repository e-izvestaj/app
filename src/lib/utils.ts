import type { ReportDraft, ScenarioOption, VehicleDraft } from "../types";

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
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

export function defaultVehicle(side: "A" | "B"): VehicleDraft {
  return {
    side,
    plate: "",
    make: "",
    model: "",
    policyNumber: "",
    insurer: "",
    documentPhotos: [],
    ocrStatus: "idle"
  };
}

export function defaultCircumstances(): ScenarioOption[] {
  return [
    "Parkirano vozilo",
    "Skretanje",
    "Prestrojavanje",
    "Ukljucivanje u saobracaj",
    "Udar od pozadi",
    "Izlazak sa parkinga"
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
    status: "draft",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    scenePhotos: [],
    safety: {
      injured: null,
      vehiclesInPosition: null
    },
    location: {
      date: formatDate(now),
      time: formatTime(now),
      address: ""
    },
    vehicleA: defaultVehicle("A"),
    vehicleB: defaultVehicle("B"),
    circumstances: defaultCircumstances(),
    note: "",
    selectedPhotoId: null,
    photoMarkers: [],
    annotatedPhotoDataUrl: null,
    signatures: {
      a: null,
      b: null
    },
    pdfDataUrl: null
  };
}

export function reportTitle(report: ReportDraft) {
  return `Izvestaj ${new Date(report.createdAt).toLocaleDateString("sr-RS")}`;
}
