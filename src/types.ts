export type PhotoAsset = {
  id: string;
  dataUrl: string;
  label?: string;
};

export type MarkerType = "arrow-a" | "arrow-b" | "impact" | "label-a" | "label-b";

export type PhotoMarker = {
  id: string;
  type: MarkerType;
  x: number;
  y: number;
};

export type SafetyAnswers = {
  injured: boolean | null;
  vehiclesInPosition: boolean | null;
};

export type LocationDetails = {
  date: string;
  time: string;
  address: string;
  latitude?: number;
  longitude?: number;
};

export type VehicleDraft = {
  side: "A" | "B";
  plate: string;
  make: string;
  model: string;
  policyNumber: string;
  insurer: string;
  documentPhotos: PhotoAsset[];
  ocrStatus: "idle" | "mocked" | "ready";
};

export type ScenarioOption = {
  id: string;
  label: string;
  selected: boolean;
};

export type ReportDraft = {
  id: string;
  status: "draft" | "completed";
  createdAt: string;
  updatedAt: string;
  scenePhotos: PhotoAsset[];
  safety: SafetyAnswers;
  location: LocationDetails;
  vehicleA: VehicleDraft;
  vehicleB: VehicleDraft;
  circumstances: ScenarioOption[];
  note: string;
  selectedPhotoId: string | null;
  photoMarkers: PhotoMarker[];
  annotatedPhotoDataUrl: string | null;
  signatures: {
    a: string | null;
    b: string | null;
  };
  pdfDataUrl: string | null;
};
