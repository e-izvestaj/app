import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ReportDraft } from "../types";

async function embedOptionalImage(pdfDoc: PDFDocument, dataUrl: string) {
  if (dataUrl.includes("image/png")) {
    return pdfDoc.embedPng(dataUrl);
  }

  return pdfDoc.embedJpg(dataUrl);
}

export async function generatePdf(report: ReportDraft) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { height } = page.getSize();
  let y = height - 44;

  page.drawRectangle({
    x: 24,
    y: height - 92,
    width: 547,
    height: 56,
    color: rgb(0.09, 0.11, 0.16)
  });

  page.drawText("e-Izvestaj", {
    x: 40,
    y: height - 60,
    size: 24,
    font: bold,
    color: rgb(1, 1, 1)
  });

  page.drawText("part of AutoPulse", {
    x: 42,
    y: height - 78,
    size: 10,
    font,
    color: rgb(0.7, 0.78, 0.95)
  });

  const lines = [
    `Datum: ${report.location.date} ${report.location.time}`,
    `Lokacija: ${report.location.address || "Nije uneta"}`,
    `Povredjeni: ${report.safety.injured ? "Da" : "Ne"}`,
    `Vozila u polozaju: ${report.safety.vehiclesInPosition ? "Da" : "Ne"}`,
    `Vozilo A: ${report.vehicleA.plate} ${report.vehicleA.make} ${report.vehicleA.model}`,
    `Vozilo B: ${report.vehicleB.plate} ${report.vehicleB.make} ${report.vehicleB.model}`,
    `Okolnosti: ${report.circumstances
      .filter((item) => item.selected)
      .map((item) => item.label)
      .join(", ") || "Nema izbora"}`,
    `Napomena: ${report.note || "Nema"}`
  ];

  y -= 86;

  lines.forEach((line) => {
    page.drawText(line, {
      x: 40,
      y,
      size: 11,
      font,
      color: rgb(0.12, 0.12, 0.16)
    });
    y -= 20;
  });

  if (report.annotatedPhotoDataUrl) {
    const image = await embedOptionalImage(pdfDoc, report.annotatedPhotoDataUrl);
    page.drawText("Oznacena fotografija", {
      x: 40,
      y: y - 10,
      size: 12,
      font: bold,
      color: rgb(0.12, 0.12, 0.16)
    });
    y -= 190;
    page.drawImage(image, {
      x: 40,
      y,
      width: 220,
      height: 160
    });
  }

  if (report.signatures.a) {
    const signature = await pdfDoc.embedPng(report.signatures.a);
    page.drawText("Potpis A", {
      x: 300,
      y: 240,
      size: 12,
      font: bold,
      color: rgb(0.12, 0.12, 0.16)
    });
    page.drawImage(signature, {
      x: 300,
      y: 170,
      width: 120,
      height: 60
    });
  }

  if (report.signatures.b) {
    const signature = await pdfDoc.embedPng(report.signatures.b);
    page.drawText("Potpis B", {
      x: 300,
      y: 135,
      size: 12,
      font: bold,
      color: rgb(0.12, 0.12, 0.16)
    });
    page.drawImage(signature, {
      x: 300,
      y: 65,
      width: 120,
      height: 60
    });
  }

  const bytes = await pdfDoc.save();
  const blobBytes = bytes.slice().buffer;
  const blob = new Blob([blobBytes], { type: "application/pdf" });
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

  return {
    blob,
    url: URL.createObjectURL(blob),
    dataUrl
  };
}
