import QRCode from "qrcode";
import type { VehicleDraft } from "../types";

export type ParticipantQrPayload = {
  type: "eizvestaj-participant";
  version: 3;
  role: "B";
  firstName: string;
  lastName: string;
  birthDate: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  driverLicenseNumber: string;
  driverLicenseCategory: string;
  driverLicenseValidUntil: string;
  plate: string;
  registrationCountry: string;
  make: string;
  model: string;
  vehicleType: string;
  vin: string;
  trailerPlate: string;
  trailerRegistrationCountry: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerAddress: string;
  ownerCity: string;
  ownerPostalCode: string;
  ownerCountry: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerSameAsDriver: boolean;
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
  signature: string;
  createdAt: string;
};

type LegacyParticipantQrPayload = {
  type: "eizvestaj-participant";
  version: 1;
  role: "B";
  fullName: string;
  phone: string;
  email: string;
  plate: string;
  vehicle: string;
  insurance: string;
  policyNumber: string;
  driverLicense: string;
  note: string;
  signature: string;
  createdAt: string;
};

export async function generateQrCodeDataUrl(value: string) {
  return QRCode.toDataURL(value, {
    margin: 1,
    width: 320,
    color: {
      dark: "#0B0D12",
      light: "#FFFFFF"
    }
  });
}

export function stringifyParticipantPayload(payload: ParticipantQrPayload) {
  return JSON.stringify(payload);
}

export function parseParticipantPayload(value: string): ParticipantQrPayload {
  const parsed = JSON.parse(value) as Partial<ParticipantQrPayload> & Partial<LegacyParticipantQrPayload>;

  if (parsed.type !== "eizvestaj-participant" || parsed.role !== "B") {
    throw new Error("QR kod nije podatak drugog ucesnika.");
  }

  if (parsed.version === 1) {
    const fullName = parsed.fullName || "";
    const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : fullName;
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
    const vehicleParts = (parsed.vehicle || "").split(/\s+/).filter(Boolean);

    return {
      type: "eizvestaj-participant",
      version: 3,
      role: "B",
      firstName,
      lastName,
      birthDate: "",
      address: "",
      postalCode: "",
      city: "",
      country: "Srbija",
      phone: parsed.phone || "",
      email: parsed.email || "",
      driverLicenseNumber: parsed.driverLicense || "",
      driverLicenseCategory: "",
      driverLicenseValidUntil: "",
      plate: parsed.plate || "",
      registrationCountry: "Srbija",
      make: vehicleParts[0] || "",
      model: "",
      vehicleType: vehicleParts.slice(1).join(" "),
      vin: "",
      trailerPlate: "",
      trailerRegistrationCountry: "",
      ownerFirstName: firstName,
      ownerLastName: lastName,
      ownerAddress: "",
      ownerCity: "",
      ownerPostalCode: "",
      ownerCountry: "Srbija",
      ownerPhone: parsed.phone || "",
      ownerEmail: parsed.email || "",
      ownerSameAsDriver: true,
      insurer: parsed.insurance || "",
      policyNumber: parsed.policyNumber || "",
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
      signature: parsed.signature || "",
      createdAt: parsed.createdAt || new Date().toISOString()
    };
  }

  if (parsed.version !== 2 && parsed.version !== 3) {
    throw new Error("QR kod nije podatak drugog ucesnika.");
  }

  return {
    type: "eizvestaj-participant",
    version: 3,
    role: "B",
    firstName: parsed.firstName || "",
    lastName: parsed.lastName || "",
    birthDate: parsed.birthDate || "",
    address: parsed.address || "",
    postalCode: parsed.postalCode || "",
    city: parsed.city || "",
    country: parsed.country || "Srbija",
    phone: parsed.phone || "",
    email: parsed.email || "",
    driverLicenseNumber: parsed.driverLicenseNumber || "",
    driverLicenseCategory: parsed.driverLicenseCategory || "",
    driverLicenseValidUntil: parsed.driverLicenseValidUntil || "",
    plate: parsed.plate || "",
    registrationCountry: parsed.registrationCountry || "Srbija",
    make: parsed.make || "",
    model: parsed.model || "",
    vehicleType: parsed.vehicleType || "",
    vin: parsed.vin || "",
    trailerPlate: parsed.trailerPlate || "",
    trailerRegistrationCountry: parsed.trailerRegistrationCountry || "",
    ownerFirstName: parsed.ownerFirstName || parsed.firstName || "",
    ownerLastName: parsed.ownerLastName || parsed.lastName || "",
    ownerAddress: parsed.ownerAddress || parsed.address || "",
    ownerCity: parsed.ownerCity || parsed.city || "",
    ownerPostalCode: parsed.ownerPostalCode || parsed.postalCode || "",
    ownerCountry: parsed.ownerCountry || parsed.country || "Srbija",
    ownerPhone: parsed.ownerPhone || parsed.phone || "",
    ownerEmail: parsed.ownerEmail || parsed.email || "",
    ownerSameAsDriver: parsed.ownerSameAsDriver ?? true,
    insurer: parsed.insurer || "",
    policyNumber: parsed.policyNumber || "",
    greenCardNumber: parsed.greenCardNumber || "",
    policyValidFrom: parsed.policyValidFrom || "",
    policyValidUntil: parsed.policyValidUntil || "",
    insuranceBranch: parsed.insuranceBranch || "",
    insuranceOfficeName: parsed.insuranceOfficeName || "",
    insuranceAddress: parsed.insuranceAddress || "",
    insuranceCity: parsed.insuranceCity || "",
    insuranceCountry: parsed.insuranceCountry || "Srbija",
    insurancePhone: parsed.insurancePhone || "",
    insuranceEmail: parsed.insuranceEmail || "",
    coveredDamage: parsed.coveredDamage ?? null,
    signature: parsed.signature || "",
    createdAt: parsed.createdAt || new Date().toISOString()
  };
}

export function participantPayloadToVehicle(payload: ParticipantQrPayload, base: VehicleDraft) {
  return {
    ...base,
    source: "qr" as const,
    driverFirstName: payload.firstName,
    driverLastName: payload.lastName,
    driverBirthDate: payload.birthDate,
    driverAddress: payload.address,
    driverPostalCode: payload.postalCode,
    driverCity: payload.city,
    driverCountry: payload.country,
    driverPhone: payload.phone,
    driverEmail: payload.email,
    driverLicenseNumber: payload.driverLicenseNumber,
    driverLicenseCategory: payload.driverLicenseCategory,
    driverLicenseValidUntil: payload.driverLicenseValidUntil,
    ownerFirstName: payload.ownerSameAsDriver ? payload.firstName : payload.ownerFirstName,
    ownerLastName: payload.ownerSameAsDriver ? payload.lastName : payload.ownerLastName,
    ownerAddress: payload.ownerSameAsDriver ? payload.address : payload.ownerAddress,
    ownerCity: payload.ownerSameAsDriver ? payload.city : payload.ownerCity,
    ownerPostalCode: payload.ownerSameAsDriver ? payload.postalCode : payload.ownerPostalCode,
    ownerCountry: payload.ownerSameAsDriver ? payload.country : payload.ownerCountry,
    ownerPhone: payload.ownerSameAsDriver ? payload.phone : payload.ownerPhone,
    ownerEmail: payload.ownerSameAsDriver ? payload.email : payload.ownerEmail,
    ownerSameAsDriver: payload.ownerSameAsDriver,
    plate: payload.plate,
    registrationCountry: payload.registrationCountry,
    make: payload.make,
    model: payload.model,
    type: payload.vehicleType,
    vin: payload.vin,
    trailerPlate: payload.trailerPlate,
    trailerRegistrationCountry: payload.trailerRegistrationCountry,
    insurer: payload.insurer,
    policyNumber: payload.policyNumber,
    greenCardNumber: payload.greenCardNumber,
    policyValidFrom: payload.policyValidFrom,
    policyValidUntil: payload.policyValidUntil,
    insuranceBranch: payload.insuranceBranch,
    insuranceOfficeName: payload.insuranceOfficeName,
    insuranceAddress: payload.insuranceAddress,
    insuranceCity: payload.insuranceCity,
    insuranceCountry: payload.insuranceCountry,
    insurancePhone: payload.insurancePhone,
    insuranceEmail: payload.insuranceEmail,
    coveredDamage: payload.coveredDamage
  };
}
