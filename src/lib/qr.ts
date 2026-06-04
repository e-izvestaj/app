import QRCode from "qrcode";
import type { VehicleDraft } from "../types";

export type ParticipantQrPayload = {
  type: "eizvestaj-participant";
  version: 4;
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
  return JSON.stringify([
    "ei",
    4,
    payload.firstName,
    payload.lastName,
    payload.birthDate,
    payload.address,
    payload.postalCode,
    payload.city,
    payload.country === "Srbija" ? "" : payload.country,
    payload.phone,
    payload.email,
    payload.driverLicenseNumber,
    payload.driverLicenseCategory,
    payload.driverLicenseValidUntil,
    payload.plate,
    payload.registrationCountry === "Srbija" ? "" : payload.registrationCountry,
    payload.make,
    payload.model,
    payload.vehicleType,
    payload.vin,
    payload.trailerPlate,
    payload.trailerRegistrationCountry,
    payload.ownerSameAsDriver ? 1 : 0,
    payload.ownerFirstName,
    payload.ownerLastName,
    payload.ownerAddress,
    payload.ownerCity,
    payload.ownerPostalCode,
    payload.ownerCountry === "Srbija" ? "" : payload.ownerCountry,
    payload.ownerPhone,
    payload.ownerEmail,
    payload.insurer,
    payload.policyNumber,
    payload.greenCardNumber,
    payload.policyValidFrom,
    payload.policyValidUntil,
    payload.insuranceBranch,
    payload.insuranceOfficeName,
    payload.insuranceAddress,
    payload.insuranceCity,
    payload.insuranceCountry === "Srbija" ? "" : payload.insuranceCountry,
    payload.insurancePhone,
    payload.insuranceEmail,
    payload.coveredDamage === null ? "" : payload.coveredDamage ? 1 : 0,
    payload.createdAt
  ]);
}

export function parseParticipantPayload(value: string): ParticipantQrPayload {
  const parsedValue = JSON.parse(value) as unknown;

  if (Array.isArray(parsedValue) && parsedValue[0] === "ei" && parsedValue[1] === 4) {
    const stringValue = (index: number) =>
      typeof parsedValue[index] === "string" ? parsedValue[index] : "";
    const countryValue = (index: number) => stringValue(index) || "Srbija";
    const coveredDamageValue =
      parsedValue[43] === 1 ? true : parsedValue[43] === 0 ? false : null;

    return {
      type: "eizvestaj-participant",
      version: 4,
      role: "B",
      firstName: stringValue(2),
      lastName: stringValue(3),
      birthDate: stringValue(4),
      address: stringValue(5),
      postalCode: stringValue(6),
      city: stringValue(7),
      country: countryValue(8),
      phone: stringValue(9),
      email: stringValue(10),
      driverLicenseNumber: stringValue(11),
      driverLicenseCategory: stringValue(12),
      driverLicenseValidUntil: stringValue(13),
      plate: stringValue(14),
      registrationCountry: countryValue(15),
      make: stringValue(16),
      model: stringValue(17),
      vehicleType: stringValue(18),
      vin: stringValue(19),
      trailerPlate: stringValue(20),
      trailerRegistrationCountry: stringValue(21),
      ownerSameAsDriver: parsedValue[22] === 1,
      ownerFirstName: stringValue(23),
      ownerLastName: stringValue(24),
      ownerAddress: stringValue(25),
      ownerCity: stringValue(26),
      ownerPostalCode: stringValue(27),
      ownerCountry: countryValue(28),
      ownerPhone: stringValue(29),
      ownerEmail: stringValue(30),
      insurer: stringValue(31),
      policyNumber: stringValue(32),
      greenCardNumber: stringValue(33),
      policyValidFrom: stringValue(34),
      policyValidUntil: stringValue(35),
      insuranceBranch: stringValue(36),
      insuranceOfficeName: stringValue(37),
      insuranceAddress: stringValue(38),
      insuranceCity: stringValue(39),
      insuranceCountry: countryValue(40),
      insurancePhone: stringValue(41),
      insuranceEmail: stringValue(42),
      coveredDamage: coveredDamageValue,
      createdAt: stringValue(44) || new Date().toISOString()
    };
  }

  const parsed = parsedValue as Partial<ParticipantQrPayload> & Partial<LegacyParticipantQrPayload>;

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
      version: 4,
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
      createdAt: parsed.createdAt || new Date().toISOString()
    };
  }

  if (parsed.version !== 2 && parsed.version !== 3) {
    throw new Error("QR kod nije podatak drugog ucesnika.");
  }

  return {
    type: "eizvestaj-participant",
    version: 4,
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
