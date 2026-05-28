import type { DocumentSuggestion, DocumentType, PhotoAsset } from "../types";

function seedFromPhoto(photo?: PhotoAsset) {
  return (photo?.id || "001").slice(-3).toUpperCase();
}

export async function mockOcrFromPhoto(
  photo: PhotoAsset | undefined,
  documentType: DocumentType
): Promise<DocumentSuggestion> {
  await new Promise((resolve) => window.setTimeout(resolve, 650));

  const seed = seedFromPhoto(photo);

  if (documentType === "driver-license") {
    return {
      documentType,
      status: "pending",
      sourcePhotoId: photo?.id || null,
      fields: [
        { key: "driverFirstName", label: "Ime", value: "Marko" },
        { key: "driverLastName", label: "Prezime", value: `Nikolic ${seed}` },
        { key: "driverBirthDate", label: "Datum rođenja", value: "1990-05-14" },
        { key: "driverLicenseNumber", label: "Broj vozačke dozvole", value: `DL-${seed}-2026` },
        { key: "driverAddress", label: "Adresa", value: "Bulevar oslobođenja 11, Novi Sad" }
      ]
    };
  }

  if (documentType === "registration") {
    return {
      documentType,
      status: "pending",
      sourcePhotoId: photo?.id || null,
      fields: [
        { key: "plate", label: "Registarska oznaka", value: `BG-${seed}` },
        { key: "make", label: "Marka vozila", value: "Volkswagen" },
        { key: "model", label: "Model / tip vozila", value: "Golf 8" },
        { key: "vin", label: "VIN", value: `WVWZZZ1KZ${seed}2026` },
        { key: "registrationCountry", label: "Država registracije", value: "Srbija" }
      ]
    };
  }

  return {
    documentType,
    status: "pending",
    sourcePhotoId: photo?.id || null,
    fields: [
      { key: "insurer", label: "Osiguravajuća kuća", value: "Dunav" },
      { key: "policyNumber", label: "Broj polise", value: `POL-${seed}-2026` },
      { key: "greenCardNumber", label: "Broj zelene karte", value: `GR-${seed}` },
      { key: "policyValidUntil", label: "Datum važenja", value: "2026-12-31" }
    ]
  };
}
