import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

function drawText(page: any, text: string, x: number, y: number, size = 8) {
  if (!text.trim()) {
    return;
  }

  page.drawText(text, {
    x,
    y,
    size,
    color: rgb(0.12, 0.12, 0.16)
  });
}

function drawCheck(page: any, checked: boolean, x: number, y: number) {
  if (!checked) {
    return;
  }

  page.drawText("X", {
    x,
    y,
    size: 9,
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
  const template = await loadTemplateImage(pdfDoc);
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawImage(template, {
    x: 0,
    y: 0,
    width: 595,
    height: 842
  });

  page.setFont(font);

  drawText(page, report.location.date, 34, 775, 8);
  drawText(page, report.location.time, 145, 775, 8);
  drawText(page, report.location.city, 247, 775, 8);
  drawText(page, report.location.address, 335, 775, 8);
  drawText(page, report.location.country, 248, 759, 8);
  drawCheck(page, report.safety.injured === true, 515, 774);
  drawCheck(page, report.safety.injured === false, 556, 774);
  drawCheck(page, report.safety.damageOtherVehicles === true, 51, 716);
  drawCheck(page, report.safety.damageOtherVehicles === false, 116, 716);
  drawCheck(page, report.safety.damageOtherObjects === true, 187, 716);
  drawCheck(page, report.safety.damageOtherObjects === false, 252, 716);
  drawText(page, report.witnessInfo, 334, 727, 7);

  const left = report.vehicleA;
  const right = report.vehicleB;

  drawText(page, left.ownerLastName, 21, 640, 8);
  drawText(page, left.ownerFirstName, 21, 622, 8);
  drawText(page, left.ownerAddress, 21, 604, 8);
  drawText(page, `${left.ownerPostalCode} ${left.ownerCountry}`, 21, 584, 8);
  drawText(page, left.ownerContact, 21, 566, 8);
  drawText(page, left.type || `${left.make} ${left.model}`.trim(), 21, 523, 8);
  drawText(page, left.plate, 21, 485, 8);
  drawText(page, left.registrationCountry, 21, 455, 7);
  drawText(page, left.trailerPlate, 118, 487, 8);
  drawText(page, left.insurer, 21, 405, 8);
  drawText(page, left.policyNumber, 21, 387, 8);
  drawText(page, left.greenCardNumber, 21, 370, 8);
  drawText(page, left.policyValidFrom, 21, 351, 8);
  drawText(page, left.policyValidUntil, 154, 351, 8);
  drawText(page, left.insuranceBranch, 21, 315, 8);
  drawText(page, left.insuranceAddress, 21, 280, 8);
  drawText(page, left.insuranceContact, 21, 245, 8);
  drawCheck(page, left.coveredDamage === false, 61, 228);
  drawCheck(page, left.coveredDamage === true, 122, 228);
  drawText(page, left.driverLastName, 21, 193, 8);
  drawText(page, left.driverFirstName, 21, 175, 8);
  drawText(page, left.driverBirthDate, 21, 157, 8);
  drawText(page, left.driverAddress, 21, 138, 8);
  drawText(page, left.driverCountry, 145, 120, 8);
  drawText(page, left.driverContact, 21, 102, 8);
  drawText(page, left.driverLicenseNumber, 21, 84, 8);
  drawText(page, left.driverLicenseCategory, 21, 66, 8);
  drawText(page, left.driverLicenseValidUntil, 21, 48, 8);
  drawText(page, left.visibleDamage, 21, 140, 7);
  drawText(page, left.note, 21, 26, 7);

  drawText(page, right.ownerLastName, 385, 640, 8);
  drawText(page, right.ownerFirstName, 385, 622, 8);
  drawText(page, right.ownerAddress, 385, 604, 8);
  drawText(page, `${right.ownerPostalCode} ${right.ownerCountry}`, 385, 584, 8);
  drawText(page, right.ownerContact, 385, 566, 8);
  drawText(page, right.type || `${right.make} ${right.model}`.trim(), 385, 523, 8);
  drawText(page, right.plate, 385, 485, 8);
  drawText(page, right.registrationCountry, 385, 455, 7);
  drawText(page, right.trailerPlate, 492, 487, 8);
  drawText(page, right.insurer, 385, 405, 8);
  drawText(page, right.policyNumber, 385, 387, 8);
  drawText(page, right.greenCardNumber, 385, 370, 8);
  drawText(page, right.policyValidFrom, 385, 351, 8);
  drawText(page, right.policyValidUntil, 518, 351, 8);
  drawText(page, right.insuranceBranch, 385, 315, 8);
  drawText(page, right.insuranceAddress, 385, 280, 8);
  drawText(page, right.insuranceContact, 385, 245, 8);
  drawCheck(page, right.coveredDamage === false, 425, 228);
  drawCheck(page, right.coveredDamage === true, 486, 228);
  drawText(page, right.driverLastName, 385, 193, 8);
  drawText(page, right.driverFirstName, 385, 175, 8);
  drawText(page, right.driverBirthDate, 385, 157, 8);
  drawText(page, right.driverAddress, 385, 138, 8);
  drawText(page, right.driverCountry, 508, 120, 8);
  drawText(page, right.driverContact, 385, 102, 8);
  drawText(page, right.driverLicenseNumber, 385, 84, 8);
  drawText(page, right.driverLicenseCategory, 385, 66, 8);
  drawText(page, right.driverLicenseValidUntil, 385, 48, 8);
  drawText(page, right.visibleDamage, 386, 140, 7);
  drawText(page, right.note, 386, 26, 7);

  report.circumstances.forEach((item, index) => {
    if (!item.selected) {
      return;
    }

    const y = 615 - index * 28.7;
    drawCheck(page, true, 360, y);
    drawCheck(page, true, 545, y);
  });

  drawText(page, report.note, 214, 316, 7);

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
      ? { dataUrl: findPhoto(report, "damage-a", 1)!.dataUrl, label: "Ostecenje vozila A" }
      : null,
    findPhoto(report, "damage-b", 2)
      ? { dataUrl: findPhoto(report, "damage-b", 2)!.dataUrl, label: "Ostecenje vozila B" }
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
    photoPage.drawText(`Foto prilog · ${report.publicId}`, {
      x: 32,
      y: 792,
      size: 20,
      font,
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
