import { PDFDocument } from "pdf-lib";
import type { ReportDraft } from "../types";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const TEMPLATE_WIDTH = 960;
const TEMPLATE_HEIGHT = 1358;
const RENDER_SCALE = 2;
const TEXT_COLOR = "#151922";

type TextBox = {
  left: number;
  top: number;
  width: number;
  height: number;
  size?: number;
  align?: "left" | "center";
  maxLines?: number;
  lineHeight?: number;
  weight?: "400" | "700";
};

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function px(value: number) {
  return value * RENDER_SCALE;
}

async function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Neuspesno ucitavanje slike za PDF."));
    image.src = src;
  });
}

async function rasterizeImageDataUrl(dataUrl: string) {
  if (!dataUrl.startsWith("data:image/svg+xml")) {
    return dataUrl;
  }

  const image = await loadImageElement(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(720, image.naturalWidth || 720);
  canvas.height = Math.max(680, image.naturalHeight || 680);
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas nije dostupan za pripremu slike u PDF-u.");
  }

  context.fillStyle = "#0B0D12";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

function fitSingleLine(
  context: CanvasRenderingContext2D,
  text: string,
  width: number,
  desiredSize: number,
  weight: "400" | "700"
) {
  let size = desiredSize;
  const normalized = normalizeWhitespace(text);

  while (size > 6) {
    context.font = `${weight} ${px(size)}px Arial`;
    if (context.measureText(normalized).width <= px(width)) {
      break;
    }
    size -= 0.25;
  }

  return size;
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  size: number,
  width: number,
  maxLines = 4,
  weight: "400" | "700" = "400"
) {
  const normalized = normalizeWhitespace(text);
  if (!normalized) {
    return [];
  }

  context.font = `${weight} ${px(size)}px Arial`;
  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (context.measureText(candidate).width <= px(width)) {
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

  if (lines.length > maxLines) {
    lines.length = maxLines;
  }

  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (last.length > 3 && context.measureText(`${last}...`).width > px(width)) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = last === lines[maxLines - 1] ? last : `${last}...`;
  }

  return lines;
}

function drawTextBox(context: CanvasRenderingContext2D, text: string, box: TextBox) {
  const normalized = normalizeWhitespace(text);
  if (!normalized) {
    return;
  }

  const desiredSize = box.size ?? 8;
  const weight = box.weight ?? "400";
  let size = desiredSize;
  let lines = wrapText(context, normalized, size, box.width, box.maxLines ?? 4, weight);
  let lineHeight = (box.lineHeight ?? 1.18) * size;

  while (size > 6 && lines.length * px(lineHeight) > px(box.height)) {
    size -= 0.25;
    lineHeight = (box.lineHeight ?? 1.18) * size;
    lines = wrapText(context, normalized, size, box.width, box.maxLines ?? 4, weight);
  }

  if (lines.length === 1) {
    size = fitSingleLine(context, lines[0], box.width, size, weight);
    lineHeight = (box.lineHeight ?? 1.18) * size;
  }

  context.save();
  context.beginPath();
  context.rect(px(box.left), px(box.top), px(box.width), px(box.height));
  context.clip();
  context.fillStyle = TEXT_COLOR;
  context.textBaseline = "top";
  context.font = `${weight} ${px(size)}px Arial`;

  lines.forEach((line, index) => {
    const lineWidth = context.measureText(line).width;
    const x =
      box.align === "center"
        ? px(box.left) + Math.max(0, (px(box.width) - lineWidth) / 2)
        : px(box.left);
    const y = px(box.top) + index * px(lineHeight);
    context.fillText(line, x, y);
  });

  context.restore();
}

function drawCheck(context: CanvasRenderingContext2D, checked: boolean, left: number, top: number) {
  if (!checked) {
    return;
  }

  context.save();
  context.fillStyle = TEXT_COLOR;
  context.font = `700 ${px(10)}px Arial`;
  context.textBaseline = "alphabetic";
  context.fillText("X", px(left), px(top));
  context.restore();
}

async function drawImageInBox(
  context: CanvasRenderingContext2D,
  dataUrl: string,
  left: number,
  top: number,
  width: number,
  height: number,
  padding = 8
) {
  const normalizedDataUrl = await rasterizeImageDataUrl(dataUrl);
  const image = await loadImageElement(normalizedDataUrl);
  const boxX = px(left);
  const boxY = px(top);
  const boxWidth = px(width);
  const boxHeight = px(height);
  const availableWidth = boxWidth - px(padding * 2);
  const availableHeight = boxHeight - px(padding * 2);
  const ratio = Math.min(availableWidth / image.naturalWidth, availableHeight / image.naturalHeight);
  const drawWidth = image.naturalWidth * ratio;
  const drawHeight = image.naturalHeight * ratio;
  const drawX = boxX + (boxWidth - drawWidth) / 2;
  const drawY = boxY + (boxHeight - drawHeight) / 2;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

async function renderPaperForm(report: ReportDraft) {
  const canvas = document.createElement("canvas");
  canvas.width = px(TEMPLATE_WIDTH);
  canvas.height = px(TEMPLATE_HEIGHT);
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas nije dostupan za izradu PDF obrasca.");
  }

  const templateImage = await loadImageElement(`${import.meta.env.BASE_URL}eu-report-template.png`);
  context.drawImage(templateImage, 0, 0, canvas.width, canvas.height);

  const left = report.vehicleA;
  const right = report.vehicleB;
  const leftOwnerContact = [left.ownerPhone, left.ownerEmail].filter(Boolean).join(" / ");
  const rightOwnerContact = [right.ownerPhone, right.ownerEmail].filter(Boolean).join(" / ");
  const leftInsuranceContact = [left.insurancePhone, left.insuranceEmail].filter(Boolean).join(" / ");
  const rightInsuranceContact = [right.insurancePhone, right.insuranceEmail].filter(Boolean).join(" / ");
  const leftDriverContact = [left.driverPhone, left.driverEmail].filter(Boolean).join(" / ");
  const rightDriverContact = [right.driverPhone, right.driverEmail].filter(Boolean).join(" / ");
  const leftDriverAddress = [left.driverAddress, left.driverPostalCode, left.driverCity]
    .filter(Boolean)
    .join(", ");
  const rightDriverAddress = [right.driverAddress, right.driverPostalCode, right.driverCity]
    .filter(Boolean)
    .join(", ");
  const locationAddress = [report.location.street, report.location.streetNumber]
    .filter(Boolean)
    .join(" ");

  drawTextBox(context, report.location.date, { left: 60, top: 66, width: 102, height: 18, size: 8 });
  drawTextBox(context, report.location.time, { left: 210, top: 66, width: 66, height: 18, size: 8 });
  drawTextBox(context, report.location.city, { left: 414, top: 66, width: 142, height: 18, size: 8 });
  drawTextBox(context, locationAddress, { left: 560, top: 66, width: 152, height: 18, size: 7.6 });
  drawTextBox(context, report.location.country, { left: 378, top: 92, width: 152, height: 18, size: 7.5 });

  drawCheck(context, report.safety.injured === true, 806, 82);
  drawCheck(context, report.safety.injured === false, 846, 82);
  drawCheck(context, report.safety.damageOtherVehicles === true, 57, 177);
  drawCheck(context, report.safety.damageOtherVehicles === false, 121, 177);
  drawCheck(context, report.safety.damageOtherObjects === true, 193, 177);
  drawCheck(context, report.safety.damageOtherObjects === false, 257, 177);

  drawTextBox(context, report.witnessInfo, {
    left: 640,
    top: 119,
    width: 282,
    height: 74,
    size: 7.4,
    maxLines: 4,
    lineHeight: 1.16
  });

  drawTextBox(context, left.ownerLastName, { left: 63, top: 246, width: 188, height: 18, size: 8.2 });
  drawTextBox(context, left.ownerFirstName, { left: 63, top: 274, width: 188, height: 18, size: 8.2 });
  drawTextBox(context, left.ownerAddress, { left: 63, top: 302, width: 235, height: 18, size: 7.6 });
  drawTextBox(context, left.ownerPostalCode, { left: 91, top: 334, width: 92, height: 18, size: 7.3 });
  drawTextBox(context, left.ownerCountry, { left: 236, top: 334, width: 73, height: 18, size: 7.3 });
  drawTextBox(context, leftOwnerContact, { left: 63, top: 362, width: 240, height: 18, size: 7.1 });

  drawTextBox(context, [left.make, left.model, left.type].filter(Boolean).join(" / "), {
    left: 63,
    top: 447,
    width: 130,
    height: 36,
    size: 7.3,
    maxLines: 2
  });
  drawTextBox(context, left.plate, { left: 63, top: 511, width: 130, height: 18, size: 8.2 });
  drawTextBox(context, left.registrationCountry, { left: 63, top: 571, width: 130, height: 18, size: 7.3 });
  drawTextBox(context, left.trailerPlate, { left: 215, top: 511, width: 108, height: 18, size: 7.6 });
  drawTextBox(context, left.trailerRegistrationCountry, { left: 215, top: 602, width: 108, height: 18, size: 6.9 });

  drawTextBox(context, left.insurer, { left: 63, top: 638, width: 190, height: 18, size: 7.6 });
  drawTextBox(context, left.policyNumber, { left: 99, top: 668, width: 138, height: 18, size: 7.5 });
  drawTextBox(context, left.greenCardNumber, { left: 120, top: 698, width: 140, height: 18, size: 7.3 });
  drawTextBox(context, left.policyValidFrom, { left: 72, top: 731, width: 70, height: 16, size: 7.2 });
  drawTextBox(context, left.policyValidUntil, { left: 238, top: 731, width: 70, height: 16, size: 7.2 });
  drawTextBox(context, left.insuranceBranch, { left: 64, top: 785, width: 170, height: 18, size: 7.2 });
  drawTextBox(context, left.insuranceOfficeName, { left: 63, top: 815, width: 190, height: 18, size: 7.2 });
  drawTextBox(context, left.insuranceAddress, { left: 63, top: 843, width: 200, height: 18, size: 7.2 });
  drawTextBox(context, left.insuranceCountry, { left: 238, top: 875, width: 73, height: 16, size: 7.1 });
  drawTextBox(context, leftInsuranceContact, { left: 63, top: 906, width: 240, height: 18, size: 6.9 });
  drawCheck(context, left.coveredDamage === false, 143, 949);
  drawCheck(context, left.coveredDamage === true, 204, 949);

  drawTextBox(context, left.driverLastName, { left: 63, top: 999, width: 188, height: 18, size: 8.2 });
  drawTextBox(context, left.driverFirstName, { left: 63, top: 1027, width: 188, height: 18, size: 8.2 });
  drawTextBox(context, left.driverBirthDate, { left: 95, top: 1059, width: 124, height: 18, size: 7.3 });
  drawTextBox(context, leftDriverAddress, {
    left: 63,
    top: 1091,
    width: 190,
    height: 34,
    size: 7.1,
    maxLines: 2
  });
  drawTextBox(context, left.driverCountry, { left: 239, top: 1123, width: 70, height: 18, size: 7.2 });
  drawTextBox(context, leftDriverContact, { left: 64, top: 1154, width: 239, height: 18, size: 6.9 });
  drawTextBox(context, left.driverLicenseNumber, { left: 106, top: 1183, width: 153, height: 18, size: 7.3 });
  drawTextBox(context, left.driverLicenseCategory, { left: 126, top: 1214, width: 124, height: 18, size: 7.2 });
  drawTextBox(context, left.driverLicenseValidUntil, { left: 141, top: 1243, width: 120, height: 18, size: 7.2 });

  drawTextBox(context, right.ownerLastName, { left: 662, top: 246, width: 188, height: 18, size: 8.2 });
  drawTextBox(context, right.ownerFirstName, { left: 662, top: 274, width: 188, height: 18, size: 8.2 });
  drawTextBox(context, right.ownerAddress, { left: 662, top: 302, width: 235, height: 18, size: 7.6 });
  drawTextBox(context, right.ownerPostalCode, { left: 693, top: 334, width: 92, height: 18, size: 7.3 });
  drawTextBox(context, right.ownerCountry, { left: 837, top: 334, width: 73, height: 18, size: 7.3 });
  drawTextBox(context, rightOwnerContact, { left: 662, top: 362, width: 240, height: 18, size: 7.1 });

  drawTextBox(context, [right.make, right.model, right.type].filter(Boolean).join(" / "), {
    left: 662,
    top: 447,
    width: 130,
    height: 36,
    size: 7.3,
    maxLines: 2
  });
  drawTextBox(context, right.plate, { left: 662, top: 511, width: 130, height: 18, size: 8.2 });
  drawTextBox(context, right.registrationCountry, { left: 662, top: 571, width: 130, height: 18, size: 7.3 });
  drawTextBox(context, right.trailerPlate, { left: 814, top: 511, width: 108, height: 18, size: 7.6 });
  drawTextBox(context, right.trailerRegistrationCountry, { left: 814, top: 602, width: 108, height: 18, size: 6.9 });

  drawTextBox(context, right.insurer, { left: 662, top: 638, width: 190, height: 18, size: 7.6 });
  drawTextBox(context, right.policyNumber, { left: 699, top: 668, width: 138, height: 18, size: 7.5 });
  drawTextBox(context, right.greenCardNumber, { left: 719, top: 698, width: 140, height: 18, size: 7.3 });
  drawTextBox(context, right.policyValidFrom, { left: 672, top: 731, width: 70, height: 16, size: 7.2 });
  drawTextBox(context, right.policyValidUntil, { left: 838, top: 731, width: 70, height: 16, size: 7.2 });
  drawTextBox(context, right.insuranceBranch, { left: 663, top: 785, width: 170, height: 18, size: 7.2 });
  drawTextBox(context, right.insuranceOfficeName, { left: 662, top: 815, width: 190, height: 18, size: 7.2 });
  drawTextBox(context, right.insuranceAddress, { left: 662, top: 843, width: 200, height: 18, size: 7.2 });
  drawTextBox(context, right.insuranceCountry, { left: 837, top: 875, width: 73, height: 16, size: 7.1 });
  drawTextBox(context, rightInsuranceContact, { left: 662, top: 906, width: 240, height: 18, size: 6.9 });
  drawCheck(context, right.coveredDamage === false, 743, 949);
  drawCheck(context, right.coveredDamage === true, 804, 949);

  drawTextBox(context, right.driverLastName, { left: 662, top: 999, width: 188, height: 18, size: 8.2 });
  drawTextBox(context, right.driverFirstName, { left: 662, top: 1027, width: 188, height: 18, size: 8.2 });
  drawTextBox(context, right.driverBirthDate, { left: 694, top: 1059, width: 124, height: 18, size: 7.3 });
  drawTextBox(context, rightDriverAddress, {
    left: 662,
    top: 1091,
    width: 190,
    height: 34,
    size: 7.1,
    maxLines: 2
  });
  drawTextBox(context, right.driverCountry, { left: 837, top: 1123, width: 70, height: 18, size: 7.2 });
  drawTextBox(context, rightDriverContact, { left: 663, top: 1154, width: 239, height: 18, size: 6.9 });
  drawTextBox(context, right.driverLicenseNumber, { left: 705, top: 1183, width: 153, height: 18, size: 7.3 });
  drawTextBox(context, right.driverLicenseCategory, { left: 725, top: 1214, width: 124, height: 18, size: 7.2 });
  drawTextBox(context, right.driverLicenseValidUntil, { left: 740, top: 1243, width: 120, height: 18, size: 7.2 });

  report.circumstances.forEach((item, index) => {
    const top = 471 + index * 56;
    drawCheck(context, item.selectedByA, 632, top);
    drawCheck(context, item.selectedByB, 849, top);
  });

  drawTextBox(context, left.impactZone, {
    left: 55,
    top: 947,
    width: 255,
    height: 32,
    size: 7,
    maxLines: 2
  });
  drawTextBox(context, right.impactZone, {
    left: 663,
    top: 947,
    width: 255,
    height: 32,
    size: 7,
    maxLines: 2
  });

  drawTextBox(context, left.visibleDamage, {
    left: 56,
    top: 1120,
    width: 257,
    height: 66,
    size: 7.1,
    maxLines: 4
  });
  drawTextBox(context, right.visibleDamage, {
    left: 663,
    top: 1120,
    width: 257,
    height: 66,
    size: 7.1,
    maxLines: 4
  });

  drawTextBox(context, left.note, {
    left: 56,
    top: 1264,
    width: 257,
    height: 72,
    size: 7,
    maxLines: 4
  });
  drawTextBox(context, right.note, {
    left: 663,
    top: 1264,
    width: 257,
    height: 72,
    size: 7,
    maxLines: 4
  });

  const sketchImage = report.annotatedPhotoDataUrl || report.sceneSketch.svgDataUrl;
  if (sketchImage) {
    await drawImageInBox(context, sketchImage, 319, 951, 323, 253, 4);
  }

  if (report.signatures.a) {
    await drawImageInBox(context, report.signatures.a, 404, 1278, 124, 60, 2);
  }

  if (report.signatures.b) {
    await drawImageInBox(context, report.signatures.b, 575, 1278, 124, 60, 2);
  }

  return canvas.toDataURL("image/png");
}

export async function generatePdf(report: ReportDraft) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const paperFormDataUrl = await renderPaperForm(report);
  const paperFormImage = await pdfDoc.embedPng(paperFormDataUrl);

  page.drawImage(paperFormImage, {
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT
  });

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
