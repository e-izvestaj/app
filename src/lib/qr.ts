import QRCode from "qrcode";
import type { VehicleDraft } from "../types";

export type ParticipantQrPayload = {
  type: "eizvestaj-participant";
  version: 2;
  role: "B";
  firstName: string;
  lastName: string;
  birthDate: string;
  address: string;
  phone: string;
  email: string;
  driverLicenseNumber: string;
  driverLicenseCategory: string;
  driverLicenseValidUntil: string;
  plate: string;
  make: string;
  vehicleType: string;
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
      version: 2,
      role: "B",
      firstName,
      lastName,
      birthDate: "",
      address: "",
      phone: parsed.phone || "",
      email: parsed.email || "",
      driverLicenseNumber: parsed.driverLicense || "",
      driverLicenseCategory: "",
      driverLicenseValidUntil: "",
      plate: parsed.plate || "",
      make: vehicleParts[0] || "",
      vehicleType: vehicleParts.slice(1).join(" "),
      signature: parsed.signature || "",
      createdAt: parsed.createdAt || new Date().toISOString()
    };
  }

  if (parsed.version !== 2) {
    throw new Error("QR kod nije podatak drugog ucesnika.");
  }

  return {
    type: "eizvestaj-participant",
    version: 2,
    role: "B",
    firstName: parsed.firstName || "",
    lastName: parsed.lastName || "",
    birthDate: parsed.birthDate || "",
    address: parsed.address || "",
    phone: parsed.phone || "",
    email: parsed.email || "",
    driverLicenseNumber: parsed.driverLicenseNumber || "",
    driverLicenseCategory: parsed.driverLicenseCategory || "",
    driverLicenseValidUntil: parsed.driverLicenseValidUntil || "",
    plate: parsed.plate || "",
    make: parsed.make || "",
    vehicleType: parsed.vehicleType || "",
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
    driverPhone: payload.phone,
    driverEmail: payload.email,
    driverLicenseNumber: payload.driverLicenseNumber,
    driverLicenseCategory: payload.driverLicenseCategory,
    driverLicenseValidUntil: payload.driverLicenseValidUntil,
    ownerFirstName: payload.firstName,
    ownerLastName: payload.lastName,
    ownerAddress: payload.address,
    ownerPhone: payload.phone,
    ownerEmail: payload.email,
    ownerSameAsDriver: true,
    plate: payload.plate,
    make: payload.make,
    type: payload.vehicleType
  };
}
