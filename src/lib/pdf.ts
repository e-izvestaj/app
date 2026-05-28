import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { PhotoAsset, ReportDraft } from "../types";

async function embedOptionalImage(pdfDoc: PDFDocument, dataUrl: string) {
  if (dataUrl.includes("image/png")) {
    return pdfDoc.embedPng(dataUrl);
  }

  return pdfDoc.embedJpg(dataUrl);
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

function drawText(page: PDFPage, font: PDFFont, text: string, x: number, y: number, size = 8) {
  if (!text.trim()) {
    return;
  }

  page.drawText(text, {
    x,
    y,
    size,
    font,
    color: rgb(0.12, 0.12, 0.16)
  });
}

function drawCheck(page: PDFPage, font: PDFFont, checked: boolean, x: number, y: number) {
  if (!checked) {
    return;
  }

  page.drawText("X", {
    x,
    y,
    size: 9,
    font,
    color: rgb(0.1, 0.1, 0.1)
  });
}

function findPhoto(report: ReportDraft, kind: PhotoAsset["kind"], fallbackIndex: number) {
  return (
    report.scenePhotos.find((photo) => photo.kind === kind) ||
    report.scenePhotos[fallbackIndex] ||
    null
  );
}

export async function generatePdf(report: ReportDraft) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const template = await loadTemplateImage(pdfDoc);
  const font = await loadUtfFont(pdfDoc);
  const boldFont = await loadUtfFont(pdfDoc, true);
  const page = pdfDoc.addPage([595, 842]);

  page.drawImage(template, {
    x: 0,
    y: 0,
    width: 595,
    height: 842
  });

  page.drawText("IZVEŠTAJ", {
    x: 236,
    y: 804,
    size: 15,
    font: boldFont,
    color: rgb(0.12, 0.12, 0.16)
  });

  drawText(page, font, report.location.date, 34, 775, 8);
  drawText(page, font, report.location.time, 145, 775, 8);
  drawText(page, font, report.location.city, 247, 775, 8);
  drawText(page, font, report.location.address, 335, 775, 8);
  drawText(page, font, report.location.country, 248, 759, 8);
  drawCheck(page, font, report.safety.injured === true, 515, 774);
  drawCheck(page, font, report.safety.injured === false, 556, 774);
  drawCheck(page, font, report.safety.damageOtherVehicles === true, 51, 716);
  drawCheck(page, font, report.safety.damageOtherVehicles === false, 116, 716);
  drawCheck(page, font, report.safety.damageOtherObjects === true, 187, 716);
  drawCheck(page, font, report.safety.damageOtherObjects === false, 252, 716);
  drawText(page, font, report.witnessInfo, 334, 727, 7);

  const left = report.vehicleA;
  const right = report.vehicleB;
  const leftOwnerLocation = [left.ownerPostalCode, left.ownerCity, left.ownerCountry]
    .filter(Boolean)
    .join(" ");
  const rightOwnerLocation = [right.ownerPostalCode, right.ownerCity, right.ownerCountry]
    .filter(Boolean)
    .join(" ");
  const leftOwnerContact = [left.ownerPhone, left.ownerEmail].filter(Boolean).join(" / ");
  const rightOwnerContact = [right.ownerPhone, right.ownerEmail].filter(Boolean).join(" / ");
  const leftInsuranceContact = [left.insurancePhone, left.insuranceEmail].filter(Boolean).join(" / ");
  const rightInsuranceContact = [right.insurancePhone, right.insuranceEmail].filter(Boolean).join(" / ");
  const leftDriverContact = [left.driverPhone, left.driverEmail].filter(Boolean).join(" / ");
  const rightDriverContact = [right.driverPhone, right.driverEmail].filter(Boolean).join(" / ");

  drawText(page, font, left.ownerLastName, 21, 640, 8);
  drawText(page, font, left.ownerFirstName, 21, 622, 8);
  drawText(page, font, left.ownerAddress, 21, 604, 8);
  drawText(page, font, leftOwnerLocation, 21, 584, 8);
  drawText(page, font, leftOwnerContact, 21, 566, 8);
  drawText(page, font, left.type || `${left.make} ${left.model}`.trim(), 21, 523, 8);
  drawText(page, font, left.plate, 21, 485, 8);
  drawText(page, font, left.registrationCountry, 21, 455, 7);
  drawText(page, font, left.trailerPlate, 118, 487, 8);
  drawText(page, font, left.insurer, 21, 405, 8);
  drawText(page, font, left.policyNumber, 21, 387, 8);
  drawText(page, font, left.greenCardNumber, 21, 370, 8);
  drawText(page, font, left.policyValidFrom, 21, 351, 8);
  drawText(page, font, left.policyValidUntil, 154, 351, 8);
  drawText(page, font, left.insuranceBranch, 21, 315, 8);
  drawText(page, font, [left.insuranceOfficeName, left.insuranceAddress].filter(Boolean).join(", "), 21, 280, 8);
  drawText(page, font, [left.insuranceCity, left.insuranceCountry].filter(Boolean).join(", "), 21, 262, 8);
  drawText(page, font, leftInsuranceContact, 21, 245, 8);
  drawCheck(page, font, left.coveredDamage === false, 61, 228);
  drawCheck(page, font, left.coveredDamage === true, 122, 228);
  drawText(page, font, left.driverLastName, 21, 193, 8);
  drawText(page, font, left.driverFirstName, 21, 175, 8);
  drawText(page, font, left.driverBirthDate, 21, 157, 8);
  drawText(page, font, [left.driverAddress, left.driverCity].filter(Boolean).join(", "), 21, 138, 8);
  drawText(page, font, left.driverCountry, 145, 120, 8);
  drawText(page, font, leftDriverContact, 21, 102, 8);
  drawText(page, font, left.driverLicenseNumber, 21, 84, 8);
  drawText(page, font, left.driverLicenseCategory, 21, 66, 8);
  drawText(page, font, left.driverLicenseValidUntil, 21, 48, 8);
  drawText(page, font, left.visibleDamage, 21, 140, 7);
  drawText(page, font, left.note, 21, 26, 7);

  drawText(page, font, right.ownerLastName, 385, 640, 8);
  drawText(page, font, right.ownerFirstName, 385, 622, 8);
  drawText(page, font, right.ownerAddress, 385, 604, 8);
  drawText(page, font, rightOwnerLocation, 385, 584, 8);
  drawText(page, font, rightOwnerContact, 385, 566, 8);
  drawText(page, font, right.type || `${right.make} ${right.model}`.trim(), 385, 523, 8);
  drawText(page, font, right.plate, 385, 485, 8);
  drawText(page, font, right.registrationCountry, 385, 455, 7);
  drawText(page, font, right.trailerPlate, 492, 487, 8);
  drawText(page, font, right.insurer, 385, 405, 8);
  drawText(page, font, right.policyNumber, 385, 387, 8);
  drawText(page, font, right.greenCardNumber, 385, 370, 8);
  drawText(page, font, right.policyValidFrom, 385, 351, 8);
  drawText(page, font, right.policyValidUntil, 518, 351, 8);
  drawText(page, font, right.insuranceBranch, 385, 315, 8);
  drawText(page, font, [right.insuranceOfficeName, right.insuranceAddress].filter(Boolean).join(", "), 385, 280, 8);
  drawText(page, font, [right.insuranceCity, right.insuranceCountry].filter(Boolean).join(", "), 385, 262, 8);
  drawText(page, font, rightInsuranceContact, 385, 245, 8);
  drawCheck(page, font, right.coveredDamage === false, 425, 228);
  drawCheck(page, font, right.coveredDamage === true, 486, 228);
  drawText(page, font, right.driverLastName, 385, 193, 8);
  drawText(page, font, right.driverFirstName, 385, 175, 8);
  drawText(page, font, right.driverBirthDate, 385, 157, 8);
  drawText(page, font, [right.driverAddress, right.driverCity].filter(Boolean).join(", "), 385, 138, 8);
  drawText(page, font, right.driverCountry, 508, 120, 8);
  drawText(page, font, rightDriverContact, 385, 102, 8);
  drawText(page, font, right.driverLicenseNumber, 385, 84, 8);
  drawText(page, font, right.driverLicenseCategory, 385, 66, 8);
  drawText(page, font, right.driverLicenseValidUntil, 385, 48, 8);
  drawText(page, font, right.visibleDamage, 386, 140, 7);
  drawText(page, font, right.note, 386, 26, 7);

  report.circumstances.forEach((item, index) => {
    if (!item.selected) {
      return;
    }

    const y = 615 - index * 28.7;
    drawCheck(page, font, true, 360, y);
    drawCheck(page, font, true, 545, y);
  });

  drawText(page, font, report.note, 214, 316, 7);

  if (report.signatures.a) {
    const signatureA = await pdfDoc.embedPng(report.signatures.a);
    page.drawImage(signatureA, {
      x: 198,
      y: 16,
      width: 80,
      height: 32
    });
  }

  if (report.signatures.b) {
    const signatureB = await pdfDoc.embedPng(report.signatures.b);
    page.drawImage(signatureB, {
      x: 320,
      y: 16,
      width: 80,
      height: 32
    });
  }

  const selectedPhotos = [
    report.annotatedPhotoDataUrl
      ? { dataUrl: report.annotatedPhotoDataUrl, label: "Skica i scena" }
      : findPhoto(report, "scene", 0)
        ? { dataUrl: findPhoto(report, "scene", 0)!.dataUrl, label: "Scena nezgode" }
        : null,
    findPhoto(report, "damage-a", 1)
      ? { dataUrl: findPhoto(report, "damage-a", 1)!.dataUrl, label: "Oštećenje vozila A" }
      : null,
    findPhoto(report, "damage-b", 2)
      ? { dataUrl: findPhoto(report, "damage-b", 2)!.dataUrl, label: "Oštećenje vozila B" }
      : null
  ].filter(Boolean) as Array<{ dataUrl: string; label: string }>;

  if (selectedPhotos.length) {
    const photoPage = pdfDoc.addPage([595, 842]);
    photoPage.drawRectangle({
      x: 0,
      y: 0,
      width: 595,
      height: 842,
      color: rgb(0.96, 0.97, 0.99)
    });
    photoPage.drawText(`Foto prilog - ${report.publicId}`, {
      x: 32,
      y: 792,
      size: 20,
      font: boldFont,
      color: rgb(0.08, 0.1, 0.16)
    });

    for (const [index, photo] of selectedPhotos.entries()) {
      const embedded = await embedOptionalImage(pdfDoc, photo.dataUrl);
      const y = 530 - index * 230;
      photoPage.drawText(photo.label, {
        x: 32,
        y: y + 150,
        size: 12,
        font,
        color: rgb(0.08, 0.1, 0.16)
      });
      photoPage.drawImage(embedded, {
        x: 32,
        y,
        width: 250,
        height: 140
      });
    }
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
