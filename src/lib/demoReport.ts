import type { PhotoAsset, ReportDraft, VehicleDraft } from "../types";
import { createEmptyReport, normalizeReport } from "./utils";

export const DEMO_REPORT_ID = "demo-ei-34500";
export const DEMO_REPORT_PUBLIC_ID = "EI-34500";

type DemoDocument = {
  dataUrl: string;
  label: string;
};

type DemoPackageData = {
  reportId: string;
  status: ReportDraft["status"];
  createdAt: string;
  updatedAt: string;
  lockedAt: string | null;
  location: ReportDraft["location"];
  witnessInfo: string;
  vehicleA: VehicleDraft;
  vehicleB: VehicleDraft;
  circumstancesA: string[];
  circumstancesB: string[];
  note: string;
  signatureTimestamps: ReportDraft["signatureTimestamps"];
  documents: DemoDocument[];
};

let demoReportPromise: Promise<ReportDraft> | null = null;

function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path}`.replace(/\/{2,}/g, "/");
}

function extractPackageData(html: string): DemoPackageData {
  const marker = "const packageData = ";
  const start = html.indexOf(marker);
  const end = html.indexOf("function downloadJson", start);

  if (start < 0 || end < 0) {
    throw new Error("Demo dokumentacija nema packageData zapis.");
  }

  const rawJson = html
    .slice(start + marker.length, end)
    .trim()
    .replace(/;$/, "")
    .trim();

  return JSON.parse(rawJson) as DemoPackageData;
}

function mapDocument(
  document: DemoDocument,
  index: number,
  kind: PhotoAsset["kind"],
  documentSide?: PhotoAsset["documentSide"]
): PhotoAsset {
  return {
    id: `demo-doc-${index + 1}`,
    dataUrl: document.dataUrl,
    label: document.label,
    kind,
    documentType: documentSide ? "registration" : undefined,
    documentSide
  };
}

function mapDemoToReport(data: DemoPackageData): ReportDraft {
  const empty = createEmptyReport();
  const sceneDocuments = data.documents.filter((document) =>
    document.label.startsWith("Fotografija nezgode")
  );
  const vehicleADocuments = data.documents.filter((document) =>
    document.label.startsWith("Dokument vozila A")
  );
  const vehicleBDocuments = data.documents.filter((document) =>
    document.label.startsWith("Dokument vozila B")
  );
  const sketch = data.documents.find((document) => document.label === "Skica nezgode");
  const vehicleA = {
    ...empty.vehicleA,
    ...data.vehicleA,
    documentPhotos: vehicleADocuments.map((document, index) =>
      mapDocument(document, index, "document-a", index === 0 ? "front" : "back")
    )
  };
  const vehicleB = {
    ...empty.vehicleB,
    ...data.vehicleB,
    documentPhotos: vehicleBDocuments.map((document, index) =>
      mapDocument(document, index, "document-b", index === 0 ? "front" : "back")
    )
  };

  return normalizeReport({
    ...empty,
    id: DEMO_REPORT_ID,
    publicId: data.reportId || DEMO_REPORT_PUBLIC_ID,
    status: "completed",
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    readyForSignatureAt: data.lockedAt,
    lockedAt: data.lockedAt,
    safety: {
      injured: false,
      vehiclesInPosition: true,
      damageOtherVehicles: false,
      damageOtherObjects: false
    },
    witnessInfo: data.witnessInfo,
    location: data.location,
    vehicleA,
    vehicleB,
    partyA: vehicleA,
    partyB: vehicleB,
    circumstances: empty.circumstances.map((circumstance) => ({
      ...circumstance,
      selectedByA: data.circumstancesA.includes(circumstance.label),
      selectedByB: data.circumstancesB.includes(circumstance.label)
    })),
    note: data.note,
    scenePhotos: sceneDocuments.map((document, index) =>
      mapDocument(
        document,
        index,
        index === 1 ? "damage-a" : index === 2 ? "damage-b" : "scene"
      )
    ),
    annotatedPhotoDataUrl: sketch?.dataUrl || null,
    sceneSketch: {
      ...empty.sceneSketch,
      status: sketch ? "confirmed" : "idle",
      svgDataUrl: sketch?.dataUrl || null,
      confirmedAt: data.lockedAt
    },
    signatureTimestamps: data.signatureTimestamps,
    pdfDataUrl: assetUrl("demo/EI-34500.pdf"),
    programmaticPdfDataUrl: null
  });
}

export function isDemoReportId(reportId: string | undefined) {
  return reportId === DEMO_REPORT_ID;
}

export async function loadDemoReport() {
  if (!demoReportPromise) {
    demoReportPromise = fetch(assetUrl("demo/EI-34500-dokumentacija.html"))
      .then((response) => {
        if (!response.ok) {
          throw new Error("Demo dokumentacija nije dostupna.");
        }

        return response.text();
      })
      .then((html) => mapDemoToReport(extractPackageData(html)));
  }

  return demoReportPromise;
}
