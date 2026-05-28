export type ReportStatus = "draft" | "ready_for_signature" | "locked" | "completed";

export type PhotoKind =
  | "scene"
  | "vehicle-a"
  | "vehicle-b"
  | "damage-a"
  | "damage-b"
  | "document-a"
  | "document-b";

export type PhotoAsset = {
  id: string;
  dataUrl: string;
  label?: string;
  kind?: PhotoKind;
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
  damageOtherVehicles: boolean | null;
  damageOtherObjects: boolean | null;
};

export type LocationDetails = {
  date: string;
  time: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
};

export type VehicleDraft = {
  side: "A" | "B";
  plate: string;
  registrationCountry: string;
  make: string;
  model: string;
  type: string;
  trailerPlate: string;
  insurer: string;
  policyNumber: string;
  greenCardNumber: string;
  policyValidFrom: string;
  policyValidUntil: string;
  insuranceBranch: string;
  insuranceAddress: string;
  insuranceContact: string;
  coveredDamage: boolean | null;
  ownerFirstName: string;
  ownerLastName: string;
  ownerAddress: string;
  ownerPostalCode: string;
  ownerCountry: string;
  ownerContact: string;
  driverFirstName: string;
  driverLastName: string;
  driverBirthDate: string;
  driverAddress: string;
  driverCountry: string;
  driverContact: string;
  driverLicenseNumber: string;
  driverLicenseCategory: string;
  driverLicenseValidUntil: string;
  visibleDamage: string;
  note: string;
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
  publicId: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  readyForSignatureAt: string | null;
  lockedAt: string | null;
  scenePhotos: PhotoAsset[];
  safety: SafetyAnswers;
  witnessInfo: string;
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
