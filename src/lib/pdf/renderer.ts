import type { PDFFont, PDFPage, PDFDocument, PDFImage } from "pdf-lib";
import { rgb } from "pdf-lib";
import type { DamageZone, ReportDraft } from "../../types";
import {
  PDF_LAYOUT,
  PDF_OFFSET_X,
  PDF_OFFSET_Y,
  PDF_PAGE_HEIGHT,
  PDF_SCALE,
  PDF_TEXT_FIELDS,
  type ProgrammaticTextBox
} from "./fieldsMap";

type FontSet = { regular: PDFFont; bold: PDFFont };

const TEXT_COLOR = rgb(0.08, 0.10, 0.13);
const DAMAGE_COLOR = rgb(0.85, 0.16, 0.23);
const DEFAULT_TEXT_PADDING_X = 3;
const DEFAULT_TEXT_PADDING_TOP = 1.5;
const DEFAULT_LINE_GAP = 1.14;

function sx(value: number) {
  return PDF_OFFSET_X + value * PDF_SCALE;
}

function sy(top: number, height = 0) {
  return PDF_PAGE_HEIGHT - PDF_OFFSET_Y - (top + height) * PDF_SCALE;
}

function ss(value: number) {
  return value * PDF_SCALE;
}

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function textWidth(font: PDFFont, text: string, size: number) {
  return font.widthOfTextAtSize(text, ss(size));
}

function boxPaddingX(box: ProgrammaticTextBox) {
  return box.paddingX ?? DEFAULT_TEXT_PADDING_X;
}

function boxPaddingTop(box: ProgrammaticTextBox) {
  return box.paddingTop ?? DEFAULT_TEXT_PADDING_TOP;
}

function boxLineGap(box: ProgrammaticTextBox) {
  return box.lineGap ?? DEFAULT_LINE_GAP;
}

function availableBoxWidth(box: ProgrammaticTextBox) {
  return Math.max(8, box.width - boxPaddingX(box) * 2);
}

function measureTextHeight(font: PDFFont, size: number) {
  return font.heightAtSize(ss(size)) / PDF_SCALE;
}

function baselineFromGlyphTop(glyphTop: number, font: PDFFont, size: number) {
  return glyphTop + measureTextHeight(font, size) * 0.82;
}

function fitSingleLine(font: PDFFont, text: string, width: number, desiredSize: number) {
  let size = desiredSize;
  while (size > 5.5) {
    if (textWidth(font, text, size) <= ss(width)) {
      break;
    }
    size -= 0.2;
  }
  return size;
}

function wrapText(font: PDFFont, text: string, box: ProgrammaticTextBox, size: number) {
  const normalized = normalizeWhitespace(text);
  if (!normalized) {
    return [];
  }

  const maxLines = box.maxLines ?? 4;
  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (textWidth(font, candidate, size) <= ss(availableBoxWidth(box))) {
      current = candidate;
      continue;
    }
    if (current) {
      lines.push(current);
      current = word;
    } else {
      lines.push(word);
    }
    if (lines.length === maxLines) {
      break;
    }
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  return lines.slice(0, maxLines);
}

function drawTextBox(page: PDFPage, text: string, box: ProgrammaticTextBox, fonts: FontSet, bold = false) {
  const normalized = normalizeWhitespace(text);
  if (!normalized) {
    return;
  }

  const font = bold ? fonts.bold : fonts.regular;
  let size = box.size ?? 8;
  let lines = wrapText(font, normalized, box, size);
  const lineGap = boxLineGap(box);
  while (size > 5.5 && lines.length * size * lineGap > box.height - boxPaddingTop(box) * 2) {
    size -= 0.2;
    lines = wrapText(font, normalized, box, size);
  }
  if (lines.length === 1) {
    size = fitSingleLine(font, lines[0], availableBoxWidth(box), size);
  }

  const left = sx(box.left + boxPaddingX(box));
  const availableWidth = ss(availableBoxWidth(box));
  const glyphHeight = measureTextHeight(font, size);
  const startTop = box.top + boxPaddingTop(box);

  lines.forEach((line, index) => {
    const lineWidth = textWidth(font, line, size);
    const x =
      box.align === "center"
        ? left + Math.max(0, (availableWidth - lineWidth) / 2)
        : left;
    const glyphTop =
      lines.length === 1
        ? startTop + Math.max(0, (Math.max(glyphHeight, box.height - boxPaddingTop(box) * 2) - glyphHeight) / 2)
        : startTop + index * size * lineGap;
    const y = sy(baselineFromGlyphTop(glyphTop, font, size));
    page.drawText(line, {
      x,
      y,
      size: ss(size),
      font,
      color: TEXT_COLOR
    });
  });
}

function drawCheck(page: PDFPage, checked: boolean, x: number, y: number, fonts: FontSet) {
  if (!checked) {
    return;
  }

  page.drawText("X", {
    x: sx(x),
    y: sy(y, 10),
    size: ss(10),
    font: fonts.bold,
    color: TEXT_COLOR
  });
}

async function dataUrlToImage(pdfDoc: PDFDocument, dataUrl: string): Promise<PDFImage> {
  const response = await fetch(dataUrl);
  const bytes = await response.arrayBuffer();
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) {
    return pdfDoc.embedJpg(bytes);
  }
  return pdfDoc.embedPng(bytes);
}

async function svgToPngDataUrl(dataUrl: string) {
  if (!dataUrl.startsWith("data:image/svg+xml")) {
    return dataUrl;
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Neuspešno učitavanje skice za PDF."));
    element.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1024, image.naturalWidth || 1024);
  canvas.height = Math.max(768, image.naturalHeight || 768);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas nije dostupan za pripremu skice.");
  }
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

async function drawImageInBox(
  pdfDoc: PDFDocument,
  page: PDFPage,
  dataUrl: string,
  box: { left: number; top: number; width: number; height: number },
  padding = 4
) {
  const normalized = await svgToPngDataUrl(dataUrl);
  const image = await dataUrlToImage(pdfDoc, normalized);
  const availableWidth = ss(box.width - padding * 2);
  const availableHeight = ss(box.height - padding * 2);
  const ratio = Math.min(availableWidth / image.width, availableHeight / image.height);
  const drawWidth = image.width * ratio;
  const drawHeight = image.height * ratio;
  const x = sx(box.left) + (ss(box.width) - drawWidth) / 2;
  const y = sy(box.top, box.height) + (ss(box.height) - drawHeight) / 2;

  page.drawImage(image, {
    x,
    y,
    width: drawWidth,
    height: drawHeight
  });
}

function zoneToPoint(zone: DamageZone | "", box: { left: number; top: number; width: number; height: number }) {
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  const left = box.left + box.width * 0.28;
  const right = box.left + box.width * 0.72;
  const top = box.top + box.height * 0.22;
  const bottom = box.top + box.height * 0.78;

  switch (zone) {
    case "prednji branik":
      return { x: cx, y: top };
    case "zadnji branik":
      return { x: cx, y: bottom };
    case "prednji levi ugao":
      return { x: left, y: top + 4 };
    case "prednji desni ugao":
      return { x: right, y: top + 4 };
    case "zadnji levi ugao":
      return { x: left, y: bottom - 4 };
    case "zadnji desni ugao":
      return { x: right, y: bottom - 4 };
    case "leva strana":
      return { x: left - 4, y: cy };
    case "desna strana":
      return { x: right + 4, y: cy };
    case "vrata":
      return { x: cx, y: cy };
    case "blatobran":
      return { x: right, y: cy - 10 };
    case "hauba":
      return { x: cx, y: top + 10 };
    case "gepek":
      return { x: cx, y: bottom - 10 };
    default:
      return { x: cx, y: cy };
  }
}

function drawDamageMarkerDiagram(page: PDFPage, box: { left: number; top: number; width: number; height: number }, zone: DamageZone | "") {
  const carBody = {
    left: box.left + 34,
    top: box.top + 6,
    width: 46,
    height: 58
  };

  page.drawRectangle({
    x: sx(carBody.left),
    y: sy(carBody.top, carBody.height),
    width: ss(carBody.width),
    height: ss(carBody.height),
    borderColor: TEXT_COLOR,
    borderWidth: ss(1.5)
  });
  page.drawLine({
    start: { x: sx(carBody.left + 11), y: sy(carBody.top + 11) },
    end: { x: sx(carBody.left + 35), y: sy(carBody.top + 11) },
    thickness: ss(1),
    color: TEXT_COLOR
  });
  page.drawLine({
    start: { x: sx(carBody.left + 11), y: sy(carBody.top + 29) },
    end: { x: sx(carBody.left + 35), y: sy(carBody.top + 29) },
    thickness: ss(1),
    color: TEXT_COLOR
  });

  const marker = zoneToPoint(zone, carBody);
  page.drawLine({
    start: { x: sx(marker.x - 5), y: sy(marker.y - 5) },
    end: { x: sx(marker.x + 5), y: sy(marker.y + 5) },
    thickness: ss(2.2),
    color: DAMAGE_COLOR
  });
  page.drawLine({
    start: { x: sx(marker.x + 5), y: sy(marker.y - 5) },
    end: { x: sx(marker.x - 5), y: sy(marker.y + 5) },
    thickness: ss(2.2),
    color: DAMAGE_COLOR
  });
}

function drawCircumstances(page: PDFPage, report: ReportDraft, fonts: FontSet) {
  report.circumstances.forEach((item, index) => {
    const y = PDF_LAYOUT.circumstances.startY + index * PDF_LAYOUT.circumstances.step;
    drawCheck(page, item.selectedByA, PDF_LAYOUT.circumstances.leftCheckX + 1, y + 10, fonts);
    drawCheck(page, item.selectedByB, PDF_LAYOUT.circumstances.rightCheckX + 1, y + 10, fonts);
    drawTextBox(
      page,
      item.label,
      {
        left: PDF_LAYOUT.circumstances.labelX,
        top: y - 1,
        width: PDF_LAYOUT.circumstances.labelWidth,
        height: 18,
        size: 8.4,
        maxLines: 2,
        align: "center"
      },
      fonts
    );
  });

  const selectedA = report.circumstances.filter((item) => item.selectedByA).length;
  const selectedB = report.circumstances.filter((item) => item.selectedByB).length;
  drawTextBox(page, selectedA ? String(selectedA) : "", { left: 346, top: 582, width: 16, height: 16, size: 9, align: "center" }, fonts, true);
  drawTextBox(page, selectedB ? String(selectedB) : "", { left: 606, top: 582, width: 16, height: 16, size: 9, align: "center" }, fonts, true);
}

export async function drawProgrammaticContent(pdfDoc: PDFDocument, page: PDFPage, report: ReportDraft, fonts: FontSet) {
  const left = report.vehicleA;
  const right = report.vehicleB;
  const leftOwnerContact = [left.ownerPhone, left.ownerEmail].filter(Boolean).join(" / ");
  const rightOwnerContact = [right.ownerPhone, right.ownerEmail].filter(Boolean).join(" / ");
  const leftInsuranceContact = [left.insurancePhone, left.insuranceEmail].filter(Boolean).join(" / ");
  const rightInsuranceContact = [right.insurancePhone, right.insuranceEmail].filter(Boolean).join(" / ");
  const leftDriverContact = [left.driverPhone, left.driverEmail].filter(Boolean).join(" / ");
  const rightDriverContact = [right.driverPhone, right.driverEmail].filter(Boolean).join(" / ");
  const leftVehicleMain = [left.make, left.model, left.type].filter(Boolean).join(" / ");
  const rightVehicleMain = [right.make, right.model, right.type].filter(Boolean).join(" / ");
  const locationStreet = [report.location.street, report.location.streetNumber].filter(Boolean).join(" ");
  const leftDriverAddress = [left.driverAddress, left.driverPostalCode, left.driverCity].filter(Boolean).join(", ");
  const rightDriverAddress = [right.driverAddress, right.driverPostalCode, right.driverCity].filter(Boolean).join(", ");
  const leftOwnerAddress = [left.ownerAddress, left.ownerCity].filter(Boolean).join(", ");
  const rightOwnerAddress = [right.ownerAddress, right.ownerCity].filter(Boolean).join(", ");
  const leftInsuranceAddress = [left.insuranceAddress, left.insuranceCity].filter(Boolean).join(", ");
  const rightInsuranceAddress = [right.insuranceAddress, right.insuranceCity].filter(Boolean).join(", ");

  drawTextBox(page, report.location.date, PDF_TEXT_FIELDS.accidentDate, fonts);
  drawTextBox(page, report.location.time, PDF_TEXT_FIELDS.accidentTime, fonts);
  drawTextBox(page, report.location.city, PDF_TEXT_FIELDS.city, fonts);
  drawTextBox(page, locationStreet, PDF_TEXT_FIELDS.street, fonts);
  drawTextBox(page, report.location.country, PDF_TEXT_FIELDS.country, fonts);
  drawTextBox(page, report.witnessInfo, PDF_TEXT_FIELDS.witnesses, fonts);

  drawCheck(page, report.safety.injured === true, 748, 108, fonts);
  drawCheck(page, report.safety.injured === false, 784, 108, fonts);
  drawCheck(page, report.safety.damageOtherVehicles === true, 80, 166, fonts);
  drawCheck(page, report.safety.damageOtherVehicles === false, 116, 166, fonts);
  drawCheck(page, report.safety.damageOtherObjects === true, 220, 166, fonts);
  drawCheck(page, report.safety.damageOtherObjects === false, 258, 166, fonts);

  drawTextBox(page, left.ownerLastName, PDF_TEXT_FIELDS.leftOwnerLastName, fonts);
  drawTextBox(page, left.ownerFirstName, PDF_TEXT_FIELDS.leftOwnerFirstName, fonts);
  drawTextBox(page, leftOwnerAddress, PDF_TEXT_FIELDS.leftOwnerAddress, fonts);
  drawTextBox(page, left.ownerPostalCode, PDF_TEXT_FIELDS.leftOwnerPostal, fonts);
  drawTextBox(page, left.ownerCountry, PDF_TEXT_FIELDS.leftOwnerCountry, fonts);
  drawTextBox(page, leftOwnerContact, PDF_TEXT_FIELDS.leftOwnerContact, fonts);

  drawTextBox(page, right.ownerLastName, PDF_TEXT_FIELDS.rightOwnerLastName, fonts);
  drawTextBox(page, right.ownerFirstName, PDF_TEXT_FIELDS.rightOwnerFirstName, fonts);
  drawTextBox(page, rightOwnerAddress, PDF_TEXT_FIELDS.rightOwnerAddress, fonts);
  drawTextBox(page, right.ownerPostalCode, PDF_TEXT_FIELDS.rightOwnerPostal, fonts);
  drawTextBox(page, right.ownerCountry, PDF_TEXT_FIELDS.rightOwnerCountry, fonts);
  drawTextBox(page, rightOwnerContact, PDF_TEXT_FIELDS.rightOwnerContact, fonts);

  drawTextBox(page, leftVehicleMain, PDF_TEXT_FIELDS.leftVehicleMain, fonts);
  drawTextBox(page, left.plate, PDF_TEXT_FIELDS.leftPlate, fonts);
  drawTextBox(page, left.registrationCountry, PDF_TEXT_FIELDS.leftRegCountry, fonts);
  drawTextBox(page, left.trailerPlate, PDF_TEXT_FIELDS.leftTrailerPlate, fonts);
  drawTextBox(page, left.trailerRegistrationCountry, PDF_TEXT_FIELDS.leftTrailerCountry, fonts);

  drawTextBox(page, rightVehicleMain, PDF_TEXT_FIELDS.rightVehicleMain, fonts);
  drawTextBox(page, right.plate, PDF_TEXT_FIELDS.rightPlate, fonts);
  drawTextBox(page, right.registrationCountry, PDF_TEXT_FIELDS.rightRegCountry, fonts);
  drawTextBox(page, right.trailerPlate, PDF_TEXT_FIELDS.rightTrailerPlate, fonts);
  drawTextBox(page, right.trailerRegistrationCountry, PDF_TEXT_FIELDS.rightTrailerCountry, fonts);

  drawTextBox(page, left.insurer, PDF_TEXT_FIELDS.leftInsurer, fonts);
  drawTextBox(page, left.policyNumber, PDF_TEXT_FIELDS.leftPolicyNumber, fonts);
  drawTextBox(page, left.greenCardNumber, PDF_TEXT_FIELDS.leftGreenCard, fonts);
  drawTextBox(page, left.policyValidFrom, PDF_TEXT_FIELDS.leftPolicyFrom, fonts);
  drawTextBox(page, left.policyValidUntil, PDF_TEXT_FIELDS.leftPolicyTo, fonts);
  drawTextBox(page, left.insuranceBranch, PDF_TEXT_FIELDS.leftBranch, fonts);
  drawTextBox(page, left.insuranceOfficeName, PDF_TEXT_FIELDS.leftOffice, fonts);
  drawTextBox(page, leftInsuranceAddress, PDF_TEXT_FIELDS.leftInsuranceAddress, fonts);
  drawTextBox(page, left.insuranceCountry, PDF_TEXT_FIELDS.leftInsuranceCountry, fonts);
  drawTextBox(page, leftInsuranceContact, PDF_TEXT_FIELDS.leftInsuranceContact, fonts);
  drawCheck(page, left.coveredDamage === false, 118, 830, fonts);
  drawCheck(page, left.coveredDamage === true, 248, 830, fonts);

  drawTextBox(page, right.insurer, PDF_TEXT_FIELDS.rightInsurer, fonts);
  drawTextBox(page, right.policyNumber, PDF_TEXT_FIELDS.rightPolicyNumber, fonts);
  drawTextBox(page, right.greenCardNumber, PDF_TEXT_FIELDS.rightGreenCard, fonts);
  drawTextBox(page, right.policyValidFrom, PDF_TEXT_FIELDS.rightPolicyFrom, fonts);
  drawTextBox(page, right.policyValidUntil, PDF_TEXT_FIELDS.rightPolicyTo, fonts);
  drawTextBox(page, right.insuranceBranch, PDF_TEXT_FIELDS.rightBranch, fonts);
  drawTextBox(page, right.insuranceOfficeName, PDF_TEXT_FIELDS.rightOffice, fonts);
  drawTextBox(page, rightInsuranceAddress, PDF_TEXT_FIELDS.rightInsuranceAddress, fonts);
  drawTextBox(page, right.insuranceCountry, PDF_TEXT_FIELDS.rightInsuranceCountry, fonts);
  drawTextBox(page, rightInsuranceContact, PDF_TEXT_FIELDS.rightInsuranceContact, fonts);
  drawCheck(page, right.coveredDamage === false, 708, 830, fonts);
  drawCheck(page, right.coveredDamage === true, 840, 830, fonts);

  drawTextBox(page, left.driverLastName, PDF_TEXT_FIELDS.leftDriverLastName, fonts);
  drawTextBox(page, left.driverFirstName, PDF_TEXT_FIELDS.leftDriverFirstName, fonts);
  drawTextBox(page, left.driverBirthDate, PDF_TEXT_FIELDS.leftDriverBirthDate, fonts);
  drawTextBox(page, leftDriverAddress, PDF_TEXT_FIELDS.leftDriverAddress, fonts);
  drawTextBox(page, left.driverCountry, PDF_TEXT_FIELDS.leftDriverCountry, fonts);
  drawTextBox(page, leftDriverContact, PDF_TEXT_FIELDS.leftDriverContact, fonts);
  drawTextBox(page, left.driverLicenseNumber, PDF_TEXT_FIELDS.leftDriverLicenseNumber, fonts);
  drawTextBox(page, left.driverLicenseCategory, PDF_TEXT_FIELDS.leftDriverLicenseCategory, fonts);
  drawTextBox(page, left.driverLicenseValidUntil, PDF_TEXT_FIELDS.leftDriverLicenseUntil, fonts);

  drawTextBox(page, right.driverLastName, PDF_TEXT_FIELDS.rightDriverLastName, fonts);
  drawTextBox(page, right.driverFirstName, PDF_TEXT_FIELDS.rightDriverFirstName, fonts);
  drawTextBox(page, right.driverBirthDate, PDF_TEXT_FIELDS.rightDriverBirthDate, fonts);
  drawTextBox(page, rightDriverAddress, PDF_TEXT_FIELDS.rightDriverAddress, fonts);
  drawTextBox(page, right.driverCountry, PDF_TEXT_FIELDS.rightDriverCountry, fonts);
  drawTextBox(page, rightDriverContact, PDF_TEXT_FIELDS.rightDriverContact, fonts);
  drawTextBox(page, right.driverLicenseNumber, PDF_TEXT_FIELDS.rightDriverLicenseNumber, fonts);
  drawTextBox(page, right.driverLicenseCategory, PDF_TEXT_FIELDS.rightDriverLicenseCategory, fonts);
  drawTextBox(page, right.driverLicenseValidUntil, PDF_TEXT_FIELDS.rightDriverLicenseUntil, fonts);

  drawCircumstances(page, report, fonts);
  drawDamageMarkerDiagram(page, PDF_LAYOUT.impactDiagrams.a, left.impactZone);
  drawDamageMarkerDiagram(page, PDF_LAYOUT.impactDiagrams.b, right.impactZone);
  drawTextBox(page, left.impactZone, PDF_LAYOUT.impactText.a, fonts, true);
  drawTextBox(page, right.impactZone, PDF_LAYOUT.impactText.b, fonts, true);
  drawTextBox(page, left.visibleDamage, PDF_TEXT_FIELDS.leftVisibleDamage, fonts);
  drawTextBox(page, right.visibleDamage, PDF_TEXT_FIELDS.rightVisibleDamage, fonts);
  drawTextBox(page, left.note, PDF_TEXT_FIELDS.leftNote, fonts);
  drawTextBox(page, right.note, PDF_TEXT_FIELDS.rightNote, fonts);

  const sketchImage = report.sceneSketch.svgDataUrl || report.annotatedPhotoDataUrl;
  if (sketchImage) {
    await drawImageInBox(pdfDoc, page, sketchImage, PDF_LAYOUT.sketchImage, 4);
  }

  if (report.signatures.a) {
    await drawImageInBox(pdfDoc, page, report.signatures.a, PDF_LAYOUT.signatures.a, 2);
  }

  if (report.signatures.b) {
    await drawImageInBox(pdfDoc, page, report.signatures.b, PDF_LAYOUT.signatures.b, 2);
  }
}
