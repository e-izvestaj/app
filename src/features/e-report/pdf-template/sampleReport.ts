import type { ReportDraft } from "../../../types";
import { createEmptyReport } from "../../../lib/utils";

function createSampleSketchDataUrl() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
      <rect width="1200" height="700" fill="#ffffff"/>
      <line x1="0" y1="350" x2="1200" y2="350" stroke="#cbd5e1" stroke-width="4"/>
      <line x1="600" y1="0" x2="600" y2="700" stroke="#cbd5e1" stroke-width="4"/>
      <line x1="0" y1="315" x2="1200" y2="315" stroke="#94a3b8" stroke-width="2" stroke-dasharray="14 10"/>
      <line x1="0" y1="385" x2="1200" y2="385" stroke="#94a3b8" stroke-width="2" stroke-dasharray="14 10"/>
      <line x1="565" y1="0" x2="565" y2="700" stroke="#94a3b8" stroke-width="2" stroke-dasharray="14 10"/>
      <line x1="635" y1="0" x2="635" y2="700" stroke="#94a3b8" stroke-width="2" stroke-dasharray="14 10"/>
      <rect x="250" y="250" width="170" height="80" rx="18" fill="#dbeafe" stroke="#1d4ed8" stroke-width="5"/>
      <rect x="760" y="370" width="170" height="80" rx="18" fill="#fef3c7" stroke="#d97706" stroke-width="5"/>
      <path d="M 150 290 C 240 290, 280 290, 360 290" fill="none" stroke="#1d4ed8" stroke-width="10" stroke-linecap="round"/>
      <polygon points="360,290 330,275 330,305" fill="#1d4ed8"/>
      <path d="M 1030 410 C 960 410, 920 410, 845 410" fill="none" stroke="#d97706" stroke-width="10" stroke-linecap="round"/>
      <polygon points="845,410 875,395 875,425" fill="#d97706"/>
      <circle cx="600" cy="350" r="16" fill="#dc2626"/>
      <text x="300" y="298" font-family="Arial" font-size="30" font-weight="700" fill="#1d4ed8">A</text>
      <text x="825" y="418" font-family="Arial" font-size="30" font-weight="700" fill="#d97706">B</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function createPdfTestReport(): ReportDraft {
  const report = createEmptyReport();

  report.publicId = "EI-29399";
  report.location = {
    ...report.location,
    date: "2026-06-01",
    time: "16:05",
    street: "Bulevar oslobodjenja",
    streetNumber: "145",
    city: "Beograd",
    country: "Srbija",
    address: "Bulevar oslobodjenja 145, Beograd"
  };
  report.safety = {
    ...report.safety,
    injured: false,
    damageOtherVehicles: false,
    damageOtherObjects: false,
    vehiclesInPosition: true
  };
  report.witnessInfo = "Milan Markovic, Beograd, 0641234567";

  report.vehicleA = {
    ...report.vehicleA,
    ownerLastName: "Petrovic",
    ownerFirstName: "Petar",
    ownerAddress: "Ljutice Bogdana 50",
    ownerCity: "Beograd",
    ownerPostalCode: "11000",
    ownerCountry: "Srbija",
    ownerPhone: "0641234567",
    ownerEmail: "petar@example.com",
    make: "Volkswagen",
    model: "Golf 7",
    type: "putnicko vozilo",
    plate: "BG123-AA",
    registrationCountry: "Srbija",
    insurer: "Dunav",
    policyNumber: "POL-A-12345",
    policyValidFrom: "2026-01-01",
    policyValidUntil: "2026-12-31",
    insuranceOfficeName: "Dunav osiguranje",
    insuranceAddress: "Makedonska 4",
    insuranceCity: "Beograd",
    insuranceCountry: "Srbija",
    insuranceBranch: "Dunav centar",
    driverLastName: "Petrovic",
    driverFirstName: "Petar",
    driverBirthDate: "1991-01-01",
    driverAddress: "Ljutice Bogdana 50",
    driverPostalCode: "11000",
    driverCity: "Beograd",
    driverCountry: "Srbija",
    driverPhone: "0641234567",
    driverEmail: "petar@example.com",
    driverLicenseNumber: "123456789",
    driverLicenseCategory: "B",
    driverLicenseValidUntil: "2031-01-01",
    impactZone: "prednji levi ugao",
    visibleDamage: "Levi far, branik i hauba.",
    note: "Vozilo A se kretalo pravo."
  };

  report.vehicleB = {
    ...report.vehicleB,
    ownerLastName: "Jovanovic",
    ownerFirstName: "Jovan",
    ownerAddress: "Cara Dusana 12",
    ownerCity: "Novi Sad",
    ownerPostalCode: "21000",
    ownerCountry: "Srbija",
    ownerPhone: "063555444",
    ownerEmail: "jovan@example.com",
    make: "Skoda",
    model: "Octavia",
    type: "putnicko vozilo",
    plate: "NS987-ZZ",
    registrationCountry: "Srbija",
    insurer: "DDOR",
    policyNumber: "POL-B-98765",
    policyValidFrom: "2026-02-01",
    policyValidUntil: "2027-01-31",
    insuranceOfficeName: "DDOR Novi Sad",
    insuranceAddress: "Bulevar Mihajla Pupina 8",
    insuranceCity: "Novi Sad",
    insuranceCountry: "Srbija",
    insuranceBranch: "DDOR centar",
    driverLastName: "Jovanovic",
    driverFirstName: "Jovan",
    driverBirthDate: "1987-09-14",
    driverAddress: "Cara Dusana 12",
    driverPostalCode: "21000",
    driverCity: "Novi Sad",
    driverCountry: "Srbija",
    driverPhone: "063555444",
    driverEmail: "jovan@example.com",
    driverLicenseNumber: "987654321",
    driverLicenseCategory: "B",
    driverLicenseValidUntil: "2030-09-14",
    impactZone: "zadnji desni ugao",
    visibleDamage: "Zadnji branik i desni blatobran.",
    note: "Vozilo B menjalo traku."
  };

  report.circumstances = report.circumstances.map((item, index) => ({
    ...item,
    selectedByA: index === 8,
    selectedByB: index === 9
  }));

  report.annotatedPhotoDataUrl = createSampleSketchDataUrl();

  return report;
}
