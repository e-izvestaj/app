import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import type { PhotoAsset, ReportDraft, SceneSketchSuggestion } from "../types";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const TEMPLATE_WIDTH = 960;
const TEMPLATE_HEIGHT = 1358;
const SCALE_X = PAGE_WIDTH / TEMPLATE_WIDTH;
const SCALE_Y = PAGE_HEIGHT / TEMPLATE_HEIGHT;

type TextBox = {
  left: number;
  top: number;
  width: number;
  height: number;
  size?: number;
  align?: "left" | "center";
  maxLines?: number;
  lineHeight?: number;
};

function px(value: number) {
  return value * SCALE_X;
}

function pyFromTop(value: number) {
  return PAGE_HEIGHT - value * SCALE_Y;
}

async function rasterizeImageDataUrl(dataUrl: string) {
  if (!dataUrl.startsWith("data:image/svg+xml")) {
    return dataUrl;
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Neuspesno ucitavanje SVG skice."));
    img.src = dataUrl;
  });

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

async function embedOptionalImage(pdfDoc: PDFDocument, dataUrl: string) {
  const normalizedDataUrl = await rasterizeImageDataUrl(dataUrl);

  if (normalizedDataUrl.includes("image/png")) {
    return pdfDoc.embedPng(normalizedDataUrl);
  }

  return pdfDoc.embedJpg(normalizedDataUrl);
}

async function loadTemplateImage(pdfDoc: PDFDocument) {
  const response = await fetch(`${import.meta.env.BASE_URL}eu-report-template.png`);
  const bytes = await response.arrayBuffer();
  return pdfDoc.embedPng(bytes);
}

async function loadUtfFont(pdfDoc: PDFDocument, bold = false) {
  const fontUrl = bold
    ? `${import.meta.env.BASE_URL}fonts/arialbd.ttf`
    : `${import.meta.env.BASE_URL}fonts/arial.ttf`;
  const response = await fetch(fontUrl);
  const bytes = await response.arrayBuffer();
  return pdfDoc.embedFont(bytes, { subset: true });
}

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function fitSingleLine(font: PDFFont, text: string, width: number, desiredSize: number) {
  let size = desiredSize;
  const normalized = normalizeWhitespace(text);

  while (size > 6 && font.widthOfTextAtSize(normalized, size) > width) {
    size -= 0.25;
  }

  return size;
}

function wrapText(font: PDFFont, text: string, size: number, width: number, maxLines = 4) {
  const normalized = normalizeWhitespace(text);

  if (!normalized) {
    return [];
  }

  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width) {
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

  if (lines.length === maxLines && words.length > 0) {
    const last = lines[maxLines - 1];
    if (font.widthOfTextAtSize(last, size) > width) {
      let shortened = last;
      while (shortened.length > 3 && font.widthOfTextAtSize(`${shortened}…`, size) > width) {
        shortened = shortened.slice(0, -1);
      }
      lines[maxLines - 1] = `${shortened}…`;
    }
  }

  return lines;
}

function drawTextBox(page: PDFPage, font: PDFFont, text: string, box: TextBox) {
  const normalized = normalizeWhitespace(text);
  if (!normalized) {
    return;
  }

  const x = px(box.left);
  const yTop = pyFromTop(box.top);
  const width = px(box.width);
  const height = box.height * SCALE_Y;
  const desiredSize = box.size ?? 8;
  const lineHeight = (box.lineHeight ?? 1.18) * desiredSize;

  let lines = wrapText(font, normalized, desiredSize, width, box.maxLines ?? 4);
  let size = desiredSize;

  while (
    size > 6 &&
    lines.length * lineHeight > height &&
    lines.length > 0
  ) {
    size -= 0.25;
    lines = wrapText(font, normalized, size, width, box.maxLines ?? 4);
  }

  if (lines.length === 1) {
    size = fitSingleLine(font, lines[0], width, size);
  }

  lines.forEach((line, index) => {
    const lineWidth = font.widthOfTextAtSize(line, size);
    const lineX = box.align === "center" ? x + Math.max(0, (width - lineWidth) / 2) : x;
    const lineY = yTop - index * ((box.lineHeight ?? 1.18) * size) - size;
    page.drawText(line, {
      x: lineX,
      y: lineY,
      size,
      font,
      color: rgb(0.08, 0.1, 0.16)
    });
  });
}

function drawCheck(page: PDFPage, font: PDFFont, checked: boolean, left: number, top: number) {
  if (!checked) {
    return;
  }

  page.drawText("X", {
    x: px(left),
    y: pyFromTop(top),
    size: 9,
    font,
    color: rgb(0.08, 0.1, 0.16)
  });
}

function drawImageInBox(
  page: PDFPage,
  image: PDFImage,
  left: number,
  top: number,
  width: number,
  height: number,
  padding = 8
) {
  const boxX = px(left);
  const boxY = pyFromTop(top + height);
  const boxWidth = px(width);
  const boxHeight = height * SCALE_Y;
  const availableWidth = boxWidth - px(padding * 2);
  const availableHeight = boxHeight - padding * 2 * SCALE_Y;
  const ratio = Math.min(availableWidth / image.width, availableHeight / image.height);
  const drawWidth = image.width * ratio;
  const drawHeight = image.height * ratio;
  const x = boxX + (boxWidth - drawWidth) / 2;
  const y = boxY + (boxHeight - drawHeight) / 2;

  page.drawImage(image, {
    x,
    y,
    width: drawWidth,
    height: drawHeight
  });
}

function findPhoto(report: ReportDraft, kind: PhotoAsset["kind"], fallbackIndex: number) {
  return (
    report.scenePhotos.find((photo) => photo.kind === kind) ||
    report.scenePhotos[fallbackIndex] ||
    null
  );
}

async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Neuspesno ucitavanje mape za skicu."));
    image.src = src;
  });
}

function drawSketchArrow(
  context: CanvasRenderingContext2D,
  sketchState: SceneSketchSuggestion["vehicleAState"],
  color: string,
  scaleX: number,
  scaleY: number
) {
  const x = sketchState.x * scaleX;
  const y = (sketchState.y - 44) * scaleY;

  context.strokeStyle = color;
  context.lineWidth = 4 * scaleX;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();

  switch (sketchState.direction) {
    case "backward":
    case "parking":
      context.moveTo(x, y);
      context.lineTo(x, y + 42 * scaleY);
      break;
    case "left":
      context.moveTo(x, y);
      context.bezierCurveTo(
        x - 16 * scaleX,
        y - 6 * scaleY,
        x - 24 * scaleX,
        y - 24 * scaleY,
        x - 18 * scaleX,
        y - 40 * scaleY
      );
      break;
    case "right":
      context.moveTo(x, y);
      context.bezierCurveTo(
        x + 16 * scaleX,
        y - 6 * scaleY,
        x + 24 * scaleX,
        y - 24 * scaleY,
        x + 18 * scaleX,
        y - 40 * scaleY
      );
      break;
    case "uturn":
    case "merge":
      context.moveTo(x, y);
      context.bezierCurveTo(
        x + 24 * scaleX,
        y - 10 * scaleY,
        x + 28 * scaleX,
        y - 46 * scaleY,
        x,
        y - 54 * scaleY
      );
      context.bezierCurveTo(
        x - 20 * scaleX,
        y - 54 * scaleY,
        x - 22 * scaleX,
        y - 34 * scaleY,
        x - 8 * scaleX,
        y - 24 * scaleY
      );
      break;
    default:
      context.moveTo(x, y);
      context.lineTo(x, y - 42 * scaleY);
      break;
  }

  context.stroke();
}

function drawSketchVehicle(
  context: CanvasRenderingContext2D,
  label: "A" | "B",
  state: SceneSketchSuggestion["vehicleAState"],
  color: string,
  arrowColor: string,
  scaleX: number,
  scaleY: number
) {
  context.save();
  context.translate(state.x * scaleX, state.y * scaleY);
  context.rotate((state.rotation * Math.PI) / 180);
  context.fillStyle = color;
  context.beginPath();
  context.roundRect(-18 * scaleX, -34 * scaleY, 36 * scaleX, 68 * scaleY, 16 * scaleX);
  context.fill();
  context.fillStyle = "rgba(255,255,255,0.2)";
  context.beginPath();
  context.roundRect(-12 * scaleX, -22 * scaleY, 24 * scaleX, 26 * scaleY, 9 * scaleX);
  context.fill();
  context.restore();

  context.fillStyle = "#FFFFFF";
  context.font = `700 ${16 * scaleX}px Arial`;
  context.textAlign = "center";
  context.fillText(label, state.x * scaleX, state.y * scaleY + 52 * scaleY);

  drawSketchArrow(context, state, arrowColor, scaleX, scaleY);
}

async function buildSketchAttachmentDataUrl(report: ReportDraft) {
  const sketch = report.sceneSketch;
  const locationLabel = [report.location.street, report.location.streetNumber, report.location.city]
    .filter(Boolean)
    .join(", ");

  if (report.location.latitude && report.location.longitude) {
    const centerLat = sketch.mapCenterLatitude ?? report.location.latitude;
    const centerLon = sketch.mapCenterLongitude ?? report.location.longitude;
    const zoom = sketch.mapZoom ?? 20;

    try {
      const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${centerLat},${centerLon}&zoom=${zoom}&size=720x680&maptype=mapnik`;
      const mapImage = await loadImage(staticMapUrl);
      const canvas = document.createElement("canvas");
      canvas.width = 720;
      canvas.height = 680;
      const context = canvas.getContext("2d");

      if (!context) {
        return report.annotatedPhotoDataUrl || sketch.svgDataUrl || null;
      }

      const scaleX = canvas.width / 360;
      const scaleY = canvas.height / 340;

      context.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
      context.fillStyle = "rgba(11,13,18,0.12)";
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (sketch.decorations.crosswalk) {
        context.fillStyle = "rgba(255,255,255,0.72)";
        for (let index = 0; index < 6; index += 1) {
          context.fillRect((120 + index * 9) * scaleX, 214 * scaleY, 3 * scaleX, 14 * scaleY);
        }
      }

      drawSketchVehicle(context, "A", sketch.vehicleAState, "#FF5A5F", "#FF9A9D", scaleX, scaleY);
      drawSketchVehicle(context, "B", sketch.vehicleBState, "#2F80FF", "#7CB2FF", scaleX, scaleY);

      context.strokeStyle = "#FFD54A";
      context.lineWidth = 5 * scaleX;
      context.beginPath();
      context.moveTo((sketch.impactPoint.x - 10) * scaleX, (sketch.impactPoint.y - 10) * scaleY);
      context.lineTo((sketch.impactPoint.x + 10) * scaleX, (sketch.impactPoint.y + 10) * scaleY);
      context.moveTo((sketch.impactPoint.x - 10) * scaleX, (sketch.impactPoint.y + 10) * scaleY);
      context.lineTo((sketch.impactPoint.x + 10) * scaleX, (sketch.impactPoint.y - 10) * scaleY);
      context.stroke();

      context.strokeStyle = "#FFFFFF";
      context.lineWidth = 3 * scaleX;
      context.lineJoin = "round";
      context.lineCap = "round";
      sketch.drawPaths
        .filter((path) => path.points.length > 1)
        .forEach((path) => {
          context.beginPath();
          path.points.forEach((point, index) => {
            if (index === 0) {
              context.moveTo(point.x * scaleX, point.y * scaleY);
            } else {
              context.lineTo(point.x * scaleX, point.y * scaleY);
            }
          });
          context.stroke();
        });

      context.fillStyle = "rgba(255,255,255,0.78)";
      context.font = "24px Arial";
      context.textAlign = "left";
      context.fillText(locationLabel || "Skica nezgode", 20, 30);

      return canvas.toDataURL("image/png");
    } catch {
      // Fallback below.
    }
  }

  return report.annotatedPhotoDataUrl || sketch.svgDataUrl || null;
}

export async function generatePdf(report: ReportDraft) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const template = await loadTemplateImage(pdfDoc);
  const font = await loadUtfFont(pdfDoc);
  const boldFont = await loadUtfFont(pdfDoc, true);
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  page.drawImage(template, {
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT
  });

  const locationLine = [report.location.city, report.location.address].filter(Boolean).join(", ");
  const left = report.vehicleA;
  const right = report.vehicleB;
  const leftOwnerContact = [left.ownerPhone, left.ownerEmail].filter(Boolean).join(" / ");
  const rightOwnerContact = [right.ownerPhone, right.ownerEmail].filter(Boolean).join(" / ");
  const leftInsuranceContact = [left.insurancePhone, left.insuranceEmail].filter(Boolean).join(" / ");
  const rightInsuranceContact = [right.insurancePhone, right.insuranceEmail].filter(Boolean).join(" / ");
  const leftDriverContact = [left.driverPhone, left.driverEmail].filter(Boolean).join(" / ");
  const rightDriverContact = [right.driverPhone, right.driverEmail].filter(Boolean).join(" / ");
  const leftDriverAddress = [left.driverAddress, left.driverPostalCode, left.driverCity].filter(Boolean).join(", ");
  const rightDriverAddress = [right.driverAddress, right.driverPostalCode, right.driverCity].filter(Boolean).join(", ");

  drawTextBox(page, font, report.location.date, { left: 60, top: 78, width: 102, height: 16, size: 7.2 });
  drawTextBox(page, font, report.location.time, { left: 210, top: 78, width: 66, height: 16, size: 7.2 });
  drawTextBox(page, font, report.location.city, { left: 414, top: 78, width: 142, height: 16, size: 7.1 });
  drawTextBox(page, font, report.location.address, { left: 560, top: 78, width: 152, height: 16, size: 7 });
  drawTextBox(page, font, report.location.country, { left: 378, top: 103, width: 152, height: 16, size: 7.1 });
  drawCheck(page, font, report.safety.injured === true, 803, 83);
  drawCheck(page, font, report.safety.injured === false, 843, 83);
  drawCheck(page, font, report.safety.damageOtherVehicles === true, 59, 176);
  drawCheck(page, font, report.safety.damageOtherVehicles === false, 124, 176);
  drawCheck(page, font, report.safety.damageOtherObjects === true, 193, 176);
  drawCheck(page, font, report.safety.damageOtherObjects === false, 258, 176);
  drawTextBox(page, font, report.witnessInfo, {
    left: 640,
    top: 126,
    width: 282,
    height: 74,
    size: 7,
    maxLines: 4,
    lineHeight: 1.14
  });

  drawTextBox(page, font, left.ownerLastName, { left: 63, top: 246, width: 188, height: 18, size: 8 });
  drawTextBox(page, font, left.ownerFirstName, { left: 63, top: 274, width: 188, height: 18, size: 8 });
  drawTextBox(page, font, left.ownerAddress, { left: 63, top: 302, width: 235, height: 18, size: 7.2 });
  drawTextBox(page, font, left.ownerPostalCode, { left: 92, top: 336, width: 92, height: 16, size: 7.1 });
  drawTextBox(page, font, left.ownerCountry, { left: 238, top: 336, width: 73, height: 16, size: 7.1 });
  drawTextBox(page, font, leftOwnerContact, { left: 63, top: 366, width: 240, height: 16, size: 6.8 });

  drawTextBox(page, font, [left.make, left.model, left.type].filter(Boolean).join(" / "), {
    left: 63,
    top: 451,
    width: 130,
    height: 34,
    size: 7,
    maxLines: 2
  });
  drawTextBox(page, font, left.plate, { left: 63, top: 516, width: 130, height: 18, size: 8 });
  drawTextBox(page, font, left.registrationCountry, { left: 63, top: 574, width: 130, height: 18, size: 7.1 });
  drawTextBox(page, font, left.trailerPlate, { left: 215, top: 516, width: 108, height: 18, size: 7.6 });
  drawTextBox(page, font, left.trailerRegistrationCountry, { left: 215, top: 604, width: 108, height: 18, size: 6.7 });

  drawTextBox(page, font, left.insurer, { left: 63, top: 642, width: 190, height: 18, size: 7.5 });
  drawTextBox(page, font, left.policyNumber, { left: 100, top: 672, width: 138, height: 18, size: 7.4 });
  drawTextBox(page, font, left.greenCardNumber, { left: 121, top: 702, width: 140, height: 18, size: 7.2 });
  drawTextBox(page, font, left.policyValidFrom, { left: 72, top: 733, width: 70, height: 16, size: 7.1 });
  drawTextBox(page, font, left.policyValidUntil, { left: 238, top: 733, width: 70, height: 16, size: 7.1 });
  drawTextBox(page, font, left.insuranceBranch, { left: 64, top: 789, width: 170, height: 18, size: 7.1 });
  drawTextBox(page, font, left.insuranceOfficeName, { left: 63, top: 819, width: 190, height: 18, size: 7.1 });
  drawTextBox(page, font, left.insuranceAddress, { left: 63, top: 847, width: 200, height: 18, size: 7.1 });
  drawTextBox(page, font, left.insuranceCountry, { left: 238, top: 879, width: 73, height: 16, size: 7 });
  drawTextBox(page, font, leftInsuranceContact, { left: 63, top: 911, width: 240, height: 18, size: 6.7 });
  drawCheck(page, font, left.coveredDamage === false, 144, 948);
  drawCheck(page, font, left.coveredDamage === true, 206, 948);

  drawTextBox(page, font, left.driverLastName, { left: 63, top: 1002, width: 188, height: 18, size: 8 });
  drawTextBox(page, font, left.driverFirstName, { left: 63, top: 1031, width: 188, height: 18, size: 8 });
  drawTextBox(page, font, left.driverBirthDate, { left: 95, top: 1062, width: 124, height: 18, size: 7.1 });
  drawTextBox(page, font, leftDriverAddress, { left: 63, top: 1095, width: 190, height: 34, size: 7, maxLines: 2 });
  drawTextBox(page, font, left.driverCountry, { left: 239, top: 1127, width: 70, height: 18, size: 7.1 });
  drawTextBox(page, font, leftDriverContact, { left: 64, top: 1158, width: 239, height: 18, size: 6.7 });
  drawTextBox(page, font, left.driverLicenseNumber, { left: 106, top: 1187, width: 153, height: 18, size: 7.2 });
  drawTextBox(page, font, left.driverLicenseCategory, { left: 126, top: 1218, width: 124, height: 18, size: 7.1 });
  drawTextBox(page, font, left.driverLicenseValidUntil, { left: 141, top: 1247, width: 120, height: 18, size: 7.1 });

  drawTextBox(page, font, right.ownerLastName, { left: 662, top: 246, width: 188, height: 18, size: 8 });
  drawTextBox(page, font, right.ownerFirstName, { left: 662, top: 274, width: 188, height: 18, size: 8 });
  drawTextBox(page, font, right.ownerAddress, { left: 662, top: 302, width: 235, height: 18, size: 7.2 });
  drawTextBox(page, font, right.ownerPostalCode, { left: 693, top: 336, width: 92, height: 16, size: 7.1 });
  drawTextBox(page, font, right.ownerCountry, { left: 837, top: 336, width: 73, height: 16, size: 7.1 });
  drawTextBox(page, font, rightOwnerContact, { left: 662, top: 366, width: 240, height: 16, size: 6.8 });

  drawTextBox(page, font, [right.make, right.model, right.type].filter(Boolean).join(" / "), {
    left: 662,
    top: 451,
    width: 130,
    height: 34,
    size: 7,
    maxLines: 2
  });
  drawTextBox(page, font, right.plate, { left: 662, top: 516, width: 130, height: 18, size: 8 });
  drawTextBox(page, font, right.registrationCountry, { left: 662, top: 574, width: 130, height: 18, size: 7.1 });
  drawTextBox(page, font, right.trailerPlate, { left: 814, top: 516, width: 108, height: 18, size: 7.6 });
  drawTextBox(page, font, right.trailerRegistrationCountry, { left: 814, top: 604, width: 108, height: 18, size: 6.7 });

  drawTextBox(page, font, right.insurer, { left: 662, top: 642, width: 190, height: 18, size: 7.5 });
  drawTextBox(page, font, right.policyNumber, { left: 699, top: 672, width: 138, height: 18, size: 7.4 });
  drawTextBox(page, font, right.greenCardNumber, { left: 719, top: 702, width: 140, height: 18, size: 7.2 });
  drawTextBox(page, font, right.policyValidFrom, { left: 672, top: 733, width: 70, height: 16, size: 7.1 });
  drawTextBox(page, font, right.policyValidUntil, { left: 838, top: 733, width: 70, height: 16, size: 7.1 });
  drawTextBox(page, font, right.insuranceBranch, { left: 663, top: 789, width: 170, height: 18, size: 7.1 });
  drawTextBox(page, font, right.insuranceOfficeName, { left: 662, top: 819, width: 190, height: 18, size: 7.1 });
  drawTextBox(page, font, right.insuranceAddress, { left: 662, top: 847, width: 200, height: 18, size: 7.1 });
  drawTextBox(page, font, right.insuranceCountry, { left: 837, top: 879, width: 73, height: 16, size: 7 });
  drawTextBox(page, font, rightInsuranceContact, { left: 662, top: 911, width: 240, height: 18, size: 6.7 });
  drawCheck(page, font, right.coveredDamage === false, 743, 948);
  drawCheck(page, font, right.coveredDamage === true, 804, 948);

  drawTextBox(page, font, right.driverLastName, { left: 662, top: 1002, width: 188, height: 18, size: 8 });
  drawTextBox(page, font, right.driverFirstName, { left: 662, top: 1031, width: 188, height: 18, size: 8 });
  drawTextBox(page, font, right.driverBirthDate, { left: 694, top: 1062, width: 124, height: 18, size: 7.1 });
  drawTextBox(page, font, rightDriverAddress, { left: 662, top: 1095, width: 190, height: 34, size: 7, maxLines: 2 });
  drawTextBox(page, font, right.driverCountry, { left: 837, top: 1127, width: 70, height: 18, size: 7.1 });
  drawTextBox(page, font, rightDriverContact, { left: 663, top: 1158, width: 239, height: 18, size: 6.7 });
  drawTextBox(page, font, right.driverLicenseNumber, { left: 705, top: 1187, width: 153, height: 18, size: 7.2 });
  drawTextBox(page, font, right.driverLicenseCategory, { left: 725, top: 1218, width: 124, height: 18, size: 7.1 });
  drawTextBox(page, font, right.driverLicenseValidUntil, { left: 740, top: 1247, width: 120, height: 18, size: 7.1 });

  report.circumstances.forEach((item, index) => {
    const top = 472 + index * 56;
    drawCheck(page, font, item.selectedByA, 630, top);
    drawCheck(page, font, item.selectedByB, 847, top);
  });

  drawTextBox(page, font, left.impactZone, {
    left: 55,
    top: 949,
    width: 255,
    height: 30,
    size: 6.8,
    maxLines: 2
  });
  drawTextBox(page, font, right.impactZone, {
    left: 663,
    top: 949,
    width: 255,
    height: 30,
    size: 6.8,
    maxLines: 2
  });

  drawTextBox(page, font, left.visibleDamage, {
    left: 56,
    top: 1122,
    width: 257,
    height: 66,
    size: 7,
    maxLines: 4
  });
  drawTextBox(page, font, right.visibleDamage, {
    left: 663,
    top: 1122,
    width: 257,
    height: 66,
    size: 7,
    maxLines: 4
  });

  drawTextBox(page, font, left.note, {
    left: 56,
    top: 1267,
    width: 257,
    height: 72,
    size: 7,
    maxLines: 4
  });
  drawTextBox(page, font, right.note, {
    left: 663,
    top: 1267,
    width: 257,
    height: 72,
    size: 7,
    maxLines: 4
  });

  const sketchAttachment = await buildSketchAttachmentDataUrl(report);
  if (sketchAttachment) {
    const embeddedSketch = await embedOptionalImage(pdfDoc, sketchAttachment);
    drawImageInBox(page, embeddedSketch, 319, 951, 323, 253, 6);
  }

  if (report.signatures.a) {
    const signatureA = await pdfDoc.embedPng(report.signatures.a);
    page.drawImage(signatureA, {
      x: px(410),
      y: pyFromTop(1334),
      width: px(110),
      height: 26
    });
  }

  if (report.signatures.b) {
    const signatureB = await pdfDoc.embedPng(report.signatures.b);
    page.drawImage(signatureB, {
      x: px(585),
      y: pyFromTop(1334),
      width: px(110),
      height: 26
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
