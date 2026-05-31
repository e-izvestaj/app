import fontkit from "@pdf-lib/fontkit";
import { PDFDocument } from "pdf-lib";
import type { ReportDraft } from "../../types";
import {
  PDF_OFFSET_X,
  PDF_OFFSET_Y,
  PDF_PAGE_HEIGHT,
  PDF_PAGE_WIDTH,
  PDF_SCALE,
  PDF_TEMPLATE_HEIGHT,
  PDF_TEMPLATE_WIDTH
} from "./fieldsMap";
import { drawProgrammaticContent } from "./renderer";

async function fetchAssetBytes(path: string) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Neuspešno učitavanje PDF asseta: ${path}`);
  }
  return response.arrayBuffer();
}

export async function generateProgrammaticPdf(report: ReportDraft) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const regularBytes = await fetchAssetBytes(`${import.meta.env.BASE_URL}fonts/arial.ttf`);
  const boldBytes = await fetchAssetBytes(`${import.meta.env.BASE_URL}fonts/arialbd.ttf`);
  const regularFont = await pdfDoc.embedFont(regularBytes, { subset: true });
  const boldFont = await pdfDoc.embedFont(boldBytes, { subset: true });
  const templateBytes = await fetchAssetBytes(`${import.meta.env.BASE_URL}eu-report-template.png`);
  const templateImage = await pdfDoc.embedPng(templateBytes);

  const page = pdfDoc.addPage([PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT]);
  page.drawImage(templateImage, {
    x: PDF_OFFSET_X,
    y: PDF_OFFSET_Y,
    width: PDF_TEMPLATE_WIDTH * PDF_SCALE,
    height: PDF_TEMPLATE_HEIGHT * PDF_SCALE
  });
  await drawProgrammaticContent(pdfDoc, page, report, { regular: regularFont, bold: boldFont });

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes.slice().buffer], { type: "application/pdf" });
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
