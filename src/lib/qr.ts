import QRCode from "qrcode";
import type { VehicleDraft } from "../types";

export type ParticipantQrPayload = {
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
  const parsed = JSON.parse(value) as Partial<ParticipantQrPayload>;

  if (
    parsed.type !== "eizvestaj-participant" ||
    parsed.version !== 1 ||
    parsed.role !== "B"
  ) {
    throw new Error("QR kod nije podatak drugog ucesnika.");
  }

  return {
    type: "eizvestaj-participant",
    version: 1,
    role: "B",
    fullName: parsed.fullName || "",
    phone: parsed.phone || "",
    email: parsed.email || "",
    plate: parsed.plate || "",
    vehicle: parsed.vehicle || "",
    insurance: parsed.insurance || "",
    policyNumber: parsed.policyNumber || "",
    driverLicense: parsed.driverLicense || "",
    note: parsed.note || "",
    signature: parsed.signature || "",
    createdAt: parsed.createdAt || new Date().toISOString()
  };
}

export function participantPayloadToVehicle(payload: ParticipantQrPayload, base: VehicleDraft) {
  const nameParts = payload.fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : payload.fullName;
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  const vehicleParts = payload.vehicle.split(/\s+/).filter(Boolean);

  return {
    ...base,
    source: "qr" as const,
    driverFirstName: firstName,
    driverLastName: lastName,
    driverPhone: payload.phone,
    driverEmail: payload.email,
    driverLicenseNumber: payload.driverLicense,
    ownerFirstName: firstName,
    ownerLastName: lastName,
    ownerPhone: payload.phone,
    ownerEmail: payload.email,
    plate: payload.plate,
    make: vehicleParts[0] || "",
    model: vehicleParts.slice(1).join(" "),
    insurer: payload.insurance,
    policyNumber: payload.policyNumber,
    note: payload.note
  };
}
