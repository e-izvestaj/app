export type ReportStatus = "draft" | "ready_for_signature" | "locked" | "completed";

export type PhotoKind =
  | "scene"
  | "vehicle-a"
  | "vehicle-b"
  | "damage-a"
  | "damage-b"
  | "document-a"
  | "document-b";

export type DocumentType = "driver-license" | "registration" | "policy";

export type DamageZone =
  | "prednji branik"
  | "zadnji branik"
  | "prednji levi ugao"
  | "prednji desni ugao"
  | "zadnji levi ugao"
  | "zadnji desni ugao"
  | "leva strana"
  | "desna strana"
  | "vrata"
  | "blatobran"
  | "hauba"
  | "gepek";

export type ExtractedField = {
  key: string;
  label: string;
  value: string;
};

export type DocumentSuggestion = {
  documentType: DocumentType;
  status: "idle" | "pending" | "confirmed";
  fields: ExtractedField[];
  sourcePhotoId: string | null;
  rawText?: string;
};

export type DamageSuggestion = {
  status: "idle" | "pending" | "confirmed";
  sourcePhotoId: string | null;
  suggestedZone: DamageZone | "";
  manualZone: DamageZone | "";
};

export type SceneSketchSuggestion = {
  status: "idle" | "pending" | "confirmed";
  scenePhotoId: string | null;
  summary: string;
  svgDataUrl: string | null;
  laneType: "straight" | "intersection" | "parking";
  vehicleAPosition: "left" | "center" | "right";
  vehicleBPosition: "left" | "center" | "right";
};

export type PhotoAsset = {
  id: string;
  dataUrl: string;
  label?: string;
  kind?: PhotoKind;
  documentType?: DocumentType;
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
  vin: string;
  trailerPlate: string;
  trailerRegistrationCountry: string;
  insurer: string;
  policyNumber: string;
  greenCardNumber: string;
  policyValidFrom: string;
  policyValidUntil: string;
  insuranceBranch: string;
  insuranceOfficeName: string;
  insuranceAddress: string;
  insuranceCity: string;
  insuranceCountry: string;
  insurancePhone: string;
  insuranceEmail: string;
  coveredDamage: boolean | null;
  ownerFirstName: string;
  ownerLastName: string;
  ownerAddress: string;
  ownerCity: string;
  ownerPostalCode: string;
  ownerCountry: string;
  ownerPhone: string;
  ownerEmail: string;
  driverFirstName: string;
  driverLastName: string;
  driverBirthDate: string;
  driverAddress: string;
  driverCity: string;
  driverCountry: string;
  driverPhone: string;
  driverEmail: string;
  driverLicenseNumber: string;
  driverLicenseCategory: string;
  driverLicenseValidUntil: string;
  impactZone: DamageZone | "";
  visibleDamage: string;
  note: string;
  documentPhotos: PhotoAsset[];
  ocrStatus: "idle" | "mocked" | "ready";
  ocrSuggestions: Partial<Record<DocumentType, DocumentSuggestion>>;
  damageSuggestion: DamageSuggestion;
};

export type ScenarioOption = {
  id: string;
  label: string;
  selectedByA: boolean;
  selectedByB: boolean;
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
  sceneSketch: SceneSketchSuggestion;
  signatures: {
    a: string | null;
    b: string | null;
  };
  pdfDataUrl: string | null;
};
