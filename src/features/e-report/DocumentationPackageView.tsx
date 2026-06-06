import Button from "../../components/Button";
import Card from "../../components/Card";
import type { ReportDraft, VehicleDraft } from "../../types";

type DocumentAsset = {
  dataUrl: string;
  label: string;
};

type Props = {
  documents: DocumentAsset[];
  onClose: () => void;
  report: ReportDraft;
};

const empty = "-";

function value(text?: string | number | null) {
  return text === null || text === undefined || text === "" ? empty : String(text);
}

function fullName(vehicle: VehicleDraft) {
  return [vehicle.driverFirstName, vehicle.driverLastName].filter(Boolean).join(" ") || empty;
}

function vehicleRows(vehicle: VehicleDraft) {
  return [
    ["Vozac", fullName(vehicle)],
    ["Datum rodjenja", value(vehicle.driverBirthDate)],
    ["Adresa vozaca", value([vehicle.driverAddress, vehicle.driverPostalCode, vehicle.driverCity].filter(Boolean).join(", "))],
    ["Telefon / email", value([vehicle.driverPhone, vehicle.driverEmail].filter(Boolean).join(" / "))],
    ["Vozacka dozvola", value([vehicle.driverLicenseNumber, vehicle.driverLicenseCategory].filter(Boolean).join(" / "))],
    ["Vazi do", value(vehicle.driverLicenseValidUntil)],
    ["Registracija", value([vehicle.plate, vehicle.registrationCountry].filter(Boolean).join(" / "))],
    ["Vozilo", value([vehicle.make, vehicle.model, vehicle.type].filter(Boolean).join(" / "))],
    ["Osiguranje", value(vehicle.insurer)],
    ["Broj polise", value(vehicle.policyNumber)],
    ["Polisa od / do", value([vehicle.policyValidFrom, vehicle.policyValidUntil].filter(Boolean).join(" / "))],
    ["Grad osiguranja", value(vehicle.insuranceCity)],
    ["Vidljiva ostecenja", value(vehicle.visibleDamage)],
    ["Napomena", value(vehicle.note)]
  ];
}

function buildPackageData(report: ReportDraft, documents: DocumentAsset[]) {
  return {
    reportId: report.publicId,
    status: report.status,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    lockedAt: report.lockedAt,
    location: report.location,
    witnessInfo: report.witnessInfo,
    vehicleA: report.vehicleA,
    vehicleB: report.vehicleB,
    circumstancesA: report.circumstances.filter((item) => item.selectedByA).map((item) => item.label),
    circumstancesB: report.circumstances.filter((item) => item.selectedByB).map((item) => item.label),
    note: report.note,
    signatureTimestamps: report.signatureTimestamps,
    documents
  };
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHtmlRows(rows: string[][]) {
  return rows
    .map(
      ([label, rowValue]) =>
        `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(rowValue)}</td></tr>`
    )
    .join("");
}

export function buildDocumentationHtml(report: ReportDraft, documents: DocumentAsset[]) {
  const packageData = buildPackageData(report, documents);
  const packageJson = JSON.stringify(packageData);
  const locationRows = [
    ["Broj izvestaja", report.publicId],
    ["Status", report.status],
    ["Datum", value(report.location.date)],
    ["Vreme", value(report.location.time)],
    ["Mesto", value(report.location.address || [report.location.street, report.location.streetNumber, report.location.city].filter(Boolean).join(", "))],
    ["Latitude", value(report.location.latitude)],
    ["Longitude", value(report.location.longitude)],
    ["Svedoci", value(report.witnessInfo)]
  ];
  const circumstancesRows = [
    ["A", packageData.circumstancesA.join(", ") || empty],
    ["B", packageData.circumstancesB.join(", ") || empty]
  ];
  const imageHtml = documents
    .map(
      (document) => `
        <figure>
          <img alt="${escapeHtml(document.label)}" src="${document.dataUrl}" />
          <figcaption>${escapeHtml(document.label)}</figcaption>
        </figure>`
    )
    .join("");

  return `<!doctype html>
<html lang="sr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(report.publicId)} dokumentacija</title>
  <style>
    body { margin: 0; background: #f6f7fb; color: #111827; font-family: Arial, sans-serif; }
    main { max-width: 980px; margin: 0 auto; padding: 24px; }
    h1 { margin: 0 0 18px; font-size: 28px; }
    h2 { margin: 26px 0 10px; font-size: 18px; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #d1d5db; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; vertical-align: top; }
    th { width: 210px; background: #f3f4f6; color: #4b5563; }
    button { border: 0; border-radius: 8px; background: #2563eb; color: white; padding: 12px 16px; font-weight: 700; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
    figure { margin: 0; background: white; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden; }
    img { display: block; width: 100%; max-height: 520px; object-fit: contain; background: white; }
    figcaption { padding: 10px; color: #4b5563; font-size: 14px; }
  </style>
</head>
<body>
  <main>
    <h1>Paket dokumentacije ${escapeHtml(report.publicId)}</h1>
    <button type="button" onclick="downloadJson()">Preuzmi JSON</button>
    <h2>Izvestaj</h2>
    <table>${renderHtmlRows(locationRows)}</table>
    <h2>Vozilo A</h2>
    <table>${renderHtmlRows(vehicleRows(report.vehicleA))}</table>
    <h2>Vozilo B</h2>
    <table>${renderHtmlRows(vehicleRows(report.vehicleB))}</table>
    <h2>Okolnosti</h2>
    <table>${renderHtmlRows(circumstancesRows)}</table>
    <h2>Dokumentacija</h2>
    <div class="grid">${imageHtml}</div>
  </main>
  <script>
    const packageData = ${packageJson};
    function downloadJson() {
      const blob = new Blob([JSON.stringify(packageData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "${report.publicId}-dokumentacija.json";
      link.click();
      URL.revokeObjectURL(url);
    }
  </script>
</body>
</html>`;
}

export function createDocumentationHtmlFile(report: ReportDraft, documents: DocumentAsset[]) {
  return new File([buildDocumentationHtml(report, documents)], `${report.publicId}-dokumentacija.html`, {
    type: "text/html"
  });
}

export function downloadDocumentationHtml(report: ReportDraft, documents: DocumentAsset[]) {
  const file = createDocumentationHtmlFile(report, documents);
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(url);
}

export default function DocumentationPackageView({ documents, onClose, report }: Props) {
  const packageData = buildPackageData(report, documents);

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(packageData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.publicId}-dokumentacija.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-bg px-4 py-6">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-2xl font-semibold text-white">Paket dokumentacije</h3>
          <Button fullWidth={false} onClick={onClose} type="button" variant="secondary">
            Zatvori
          </Button>
        </div>

        <Card className="space-y-3">
          <div className="text-xs uppercase tracking-[0.28em] text-white/40">Izvestaj</div>
          <div className="grid gap-2 text-sm text-white/75 sm:grid-cols-2">
            <div>Broj: {report.publicId}</div>
            <div>Status: {report.status}</div>
            <div>Datum: {value(report.location.date)}</div>
            <div>Vreme: {value(report.location.time)}</div>
            <div className="sm:col-span-2">
              Mesto: {value(report.location.address || [report.location.street, report.location.streetNumber, report.location.city].filter(Boolean).join(", "))}
            </div>
            <div>Latitude: {value(report.location.latitude)}</div>
            <div>Longitude: {value(report.location.longitude)}</div>
          </div>
        </Card>

        {[
          ["Vozilo A", report.vehicleA],
          ["Vozilo B", report.vehicleB]
        ].map(([title, vehicle]) => (
          <Card className="space-y-3" key={title as string}>
            <div className="text-xs uppercase tracking-[0.28em] text-white/40">{title as string}</div>
            <div className="overflow-hidden rounded-[8px] border border-white/10">
              {(vehicleRows(vehicle as VehicleDraft)).map(([label, rowValue]) => (
                <div className="grid grid-cols-[130px_1fr] gap-3 border-b border-white/10 px-3 py-2 text-sm last:border-b-0">
                  <div className="text-white/45">{label}</div>
                  <div className="text-white/80">{rowValue}</div>
                </div>
              ))}
            </div>
          </Card>
        ))}

        <Card className="space-y-3">
          <div className="text-xs uppercase tracking-[0.28em] text-white/40">Okolnosti</div>
          <div className="grid gap-3 text-sm text-white/75 sm:grid-cols-2">
            <div>A: {packageData.circumstancesA.join(", ") || empty}</div>
            <div>B: {packageData.circumstancesB.join(", ") || empty}</div>
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="text-xs uppercase tracking-[0.28em] text-white/40">Dokumentacija</div>
          <div className="grid gap-4 sm:grid-cols-2">
            {documents.map((document) => (
              <div className="overflow-hidden rounded-[8px] border border-white/10 bg-white/5" key={`${document.label}-${document.dataUrl.slice(-16)}`}>
                <img alt={document.label} className="aspect-[4/3] w-full bg-white object-contain" src={document.dataUrl} />
                <div className="px-3 py-3 text-sm text-white/70">{document.label}</div>
              </div>
            ))}
          </div>
        </Card>

        <Button onClick={downloadJson} type="button" variant="secondary">
          Preuzmi JSON
        </Button>
      </div>
    </div>
  );
}
