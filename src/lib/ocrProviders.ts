import { recognize } from "tesseract.js";
import { INSURER_OPTIONS } from "./utils";
import type { DocumentType, ExtractedField, PhotoAsset } from "../types";

export type OcrProviderResult = {
  fields: ExtractedField[];
  rawText?: string;
};

export interface OcrProvider {
  id: string;
  supports(documentType: DocumentType): boolean;
  extract(photo: PhotoAsset | undefined): Promise<OcrProviderResult>;
}

function cleanup(value: string) {
  return value.replace(/\s+/g, " ").replace(/[|]/g, "I").trim();
}

function upper(value: string) {
  return cleanup(value).toUpperCase();
}

function normalizeDate(value: string) {
  const trimmed = cleanup(value);
  if (!trimmed) {
    return "";
  }

  const dotted = trimmed.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/);
  if (dotted) {
    const [, day, month, year] = dotted;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const iso = trimmed.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (iso) {
    const [, year, month, day] = iso;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return "";
}

function findLine(lines: string[], keywords: string[]) {
  return lines.find((line) => keywords.some((keyword) => upper(line).includes(keyword)));
}

function findValueAfterKeyword(lines: string[], keywords: string[]) {
  const matchIndex = lines.findIndex((line) => keywords.some((keyword) => upper(line).includes(keyword)));
  if (matchIndex === -1) {
    return "";
  }

  const line = cleanup(lines[matchIndex]);
  const withSeparator = line.split(/[:;-]/).slice(1).join(" ").trim();
  if (withSeparator) {
    return withSeparator;
  }

  return cleanup(lines[matchIndex + 1] || "");
}

function findDateNearKeyword(lines: string[], keywords: string[]) {
  const value = findValueAfterKeyword(lines, keywords);
  if (value) {
    return normalizeDate(value);
  }

  const line = findLine(lines, keywords);
  if (!line) {
    return "";
  }

  return normalizeDate(line);
}

function matchInsurer(textUpper: string) {
  return INSURER_OPTIONS.find((option) => textUpper.includes(option.toUpperCase())) || "";
}

function toFields(values: Record<string, string>, labels: Record<string, string>): ExtractedField[] {
  return Object.entries(labels).map(([key, label]) => ({
    key,
    label,
    value: values[key] || ""
  }));
}

async function tesseractText(photo: PhotoAsset | undefined) {
  const result = await recognize(photo?.dataUrl || "", "eng", {
    logger: () => undefined
  });

  return result.data.text || "";
}

export class DriverLicenseOcrProvider implements OcrProvider {
  id = "driver-license-tesseract-experimental";

  supports(documentType: DocumentType) {
    return documentType === "driver-license";
  }

  async extract(photo: PhotoAsset | undefined): Promise<OcrProviderResult> {
    const rawRecognizedText = await tesseractText(photo);
    const lines = rawRecognizedText.split(/\n+/).map(cleanup).filter(Boolean);
    const sourceText = lines.join("\n");
    const allDates = Array.from(sourceText.matchAll(/\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4}|\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}/g)).map(
      (match) => normalizeDate(match[0])
    );
    const licenseNumberMatch = sourceText.match(/[A-Z]{0,3}[- ]?\d{5,12}[A-Z0-9-]*/i);
    const categoriesMatch = findLine(lines, ["KATEG", "CATEG", "AM", "A1", "A2", "A ", "B ", "C ", "D "]);
    const nameLine = findLine(lines, ["PREZIME", "SURNAME"]);
    const firstNameLine = findLine(lines, ["IME", "GIVEN"]);

    return {
      rawText: sourceText,
      fields: toFields(
        {
          driverLastName: cleanup(findValueAfterKeyword(lines, ["PREZIME", "SURNAME"])) || cleanup(nameLine || ""),
          driverFirstName: cleanup(findValueAfterKeyword(lines, ["IME", "GIVEN"])) || cleanup(firstNameLine || ""),
          driverBirthDate: allDates[0] || findDateNearKeyword(lines, ["ROĐ", "RODJ", "BIRTH", "DATUM RO"]),
          driverAddress: findValueAfterKeyword(lines, ["ADRESA", "ADDRESS"]),
          driverCity: findValueAfterKeyword(lines, ["GRAD", "CITY", "MESTO"]),
          driverPhone: "",
          driverEmail: "",
          driverLicenseNumber:
            cleanup(findValueAfterKeyword(lines, ["BROJ VOZA", "LICENCE NO", "LICENSE NO"])) ||
            cleanup(licenseNumberMatch?.[0] || ""),
          driverLicenseCategory: cleanup(categoriesMatch || "").replace(/.*?(AM|A1|A2|A|B|C|D|BE|CE|DE).*/i, "$1"),
          driverLicenseValidUntil:
            allDates[1] || findDateNearKeyword(lines, ["VAŽI DO", "VAZI DO", "VALID UNTIL", "EXPIRY", "ISTEKA"])
        },
        {
          driverLastName: "Prezime",
          driverFirstName: "Ime",
          driverBirthDate: "Datum rođenja",
          driverAddress: "Adresa",
          driverCity: "Grad",
          driverPhone: "Telefon",
          driverEmail: "E-mail",
          driverLicenseNumber: "Broj vozačke dozvole",
          driverLicenseCategory: "Kategorija",
          driverLicenseValidUntil: "Vozačka dozvola važi do"
        }
      )
    };
  }
}

export class VehicleRegistrationOcrProvider implements OcrProvider {
  id = "vehicle-registration-tesseract-experimental";

  supports(documentType: DocumentType) {
    return documentType === "registration";
  }

  async extract(photo: PhotoAsset | undefined): Promise<OcrProviderResult> {
    const rawRecognizedText = await tesseractText(photo);
    const lines = rawRecognizedText.split(/\n+/).map(cleanup).filter(Boolean);
    const sourceText = lines.join("\n");
    const sourceUpper = upper(sourceText);
    const plateMatch = sourceUpper.match(/\b([A-ZŠĐČĆŽ]{2})[- ]?(\d{3,4})[- ]?([A-ZŠĐČĆŽ]{2})\b/u);
    const vinMatch = sourceUpper.match(/\b[A-HJ-NPR-Z0-9]{17}\b/);
    const makeMatch = findLine(lines, ["MARKA", "MAKE", "PROIZVOĐAČ", "PROIZVODJAC"]);
    const modelMatch = findLine(lines, ["MODEL", "TIP", "TYPE"]);
    const countryMatch = findLine(lines, ["DRŽAVA", "DRZAVA", "COUNTRY", "REGISTROVANO"]);

    return {
      rawText: sourceText,
      fields: toFields(
        {
          plate: plateMatch ? `${plateMatch[1]}-${plateMatch[2]}-${plateMatch[3]}` : "",
          make: cleanup(findValueAfterKeyword(lines, ["MARKA", "MAKE", "PROIZVOĐAČ", "PROIZVODJAC"])) || cleanup(makeMatch || ""),
          model: cleanup(findValueAfterKeyword(lines, ["MODEL"])) || "",
          type: cleanup(findValueAfterKeyword(lines, ["TIP", "TYPE"])) || cleanup(modelMatch || ""),
          vin: cleanup(vinMatch?.[0] || ""),
          registrationCountry:
            cleanup(findValueAfterKeyword(lines, ["DRŽAVA REGISTRACIJE", "DRZAVA REGISTRACIJE", "COUNTRY"])) ||
            (countryMatch && countryMatch.length < 40 ? cleanup(countryMatch) : "")
        },
        {
          plate: "Registarska oznaka",
          make: "Marka vozila",
          model: "Model",
          type: "Tip vozila",
          vin: "VIN",
          registrationCountry: "Država registracije"
        }
      )
    };
  }
}

export class InsurancePolicyOcrProvider implements OcrProvider {
  id = "insurance-policy-tesseract-experimental";

  supports(documentType: DocumentType) {
    return documentType === "policy";
  }

  async extract(photo: PhotoAsset | undefined): Promise<OcrProviderResult> {
    const rawRecognizedText = await tesseractText(photo);
    const lines = rawRecognizedText.split(/\n+/).map(cleanup).filter(Boolean);
    const sourceText = lines.join("\n");
    const sourceUpper = upper(sourceText);
    const allDates = Array.from(sourceText.matchAll(/\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4}|\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}/g)).map(
      (match) => normalizeDate(match[0])
    );

    return {
      rawText: sourceText,
      fields: toFields(
        {
          ownerLastName: cleanup(findValueAfterKeyword(lines, ["PREZIME", "UGOVARAČ", "UGOVARAC"])) || "",
          ownerFirstName: cleanup(findValueAfterKeyword(lines, ["IME"])) || "",
          ownerAddress: findValueAfterKeyword(lines, ["ADRESA", "ADDRESS"]),
          ownerCity: findValueAfterKeyword(lines, ["GRAD", "CITY", "MESTO"]),
          ownerPostalCode: cleanup(sourceText.match(/\b\d{5}\b/)?.[0] || ""),
          ownerCountry: findValueAfterKeyword(lines, ["DRŽAVA", "DRZAVA", "COUNTRY"]),
          insurer: matchInsurer(sourceUpper),
          policyNumber:
            cleanup(findValueAfterKeyword(lines, ["BROJ UGOVORA", "BROJ POLISE", "POLICY NO", "POLISA"])) ||
            cleanup(sourceText.match(/\b[A-Z0-9]{6,20}\b/)?.[0] || ""),
          greenCardNumber:
            cleanup(findValueAfterKeyword(lines, ["ZELENE KARTE", "ZELENOG KARTONA", "GREEN CARD"])) || "",
          policyValidFrom: allDates[0] || findDateNearKeyword(lines, ["VAŽI OD", "VAZI OD"]),
          policyValidUntil: allDates[1] || findDateNearKeyword(lines, ["VAŽI DO", "VAZI DO"]),
          insuranceBranch: findValueAfterKeyword(lines, ["FILIJALA", "POSREDNIK", "BRANCH"]),
          insuranceOfficeName: findValueAfterKeyword(lines, ["NAZIV", "OFFICE"]),
          insuranceAddress: findValueAfterKeyword(lines, ["ADRESA FILIJALE", "ADRESA", "ADDRESS"]),
          insuranceCity: findValueAfterKeyword(lines, ["GRAD FILIJALE", "GRAD", "CITY"]),
          insuranceCountry: findValueAfterKeyword(lines, ["DRŽAVA FILIJALE", "DRZAVA FILIJALE", "COUNTRY"])
        },
        {
          ownerLastName: "Prezime ugovarača",
          ownerFirstName: "Ime ugovarača",
          ownerAddress: "Adresa ugovarača",
          ownerCity: "Grad ugovarača",
          ownerPostalCode: "Poštanski broj",
          ownerCountry: "Država ugovarača",
          insurer: "Osiguravajuća kuća",
          policyNumber: "Broj ugovora",
          greenCardNumber: "Broj zelene karte",
          policyValidFrom: "Polisa važi od",
          policyValidUntil: "Polisa važi do",
          insuranceBranch: "Filijala / posrednik",
          insuranceOfficeName: "Naziv filijale",
          insuranceAddress: "Adresa filijale",
          insuranceCity: "Grad filijale",
          insuranceCountry: "Država filijale"
        }
      )
    };
  }
}

export const experimentalProviders: OcrProvider[] = [
  new DriverLicenseOcrProvider(),
  new VehicleRegistrationOcrProvider(),
  new InsurancePolicyOcrProvider()
];
