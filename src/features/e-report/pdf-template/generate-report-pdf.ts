import fontkit from "@pdf-lib/fontkit";
import {
  PDFDocument,
  clip,
  closePath,
  endPath,
  lineTo,
  moveTo,
  popGraphicsState,
  pushGraphicsState,
} from "pdf-lib";
import type { ReportDraft } from "../../../types";

type GeneratedPdf = {
  blob: Blob;
  url: string;
  dataUrl: string;
};

type FillableValue = string | boolean;

type CheckboxFieldName =
  | "checkbox_7kmiz"
  | "checkbox_8lqyl"
  | "checkbox_9jemi"
  | "checkbox_10rfem"
  | "checkbox_11uxhn"
  | "checkbox_12gczq"
  | "checkbox_75hrwb"
  | "checkbox_76pbyu"
  | "checkbox_114tjp"
  | "checkbox_115vnqt"
  | "checkbox_13ygjn"
  | "checkbox_14yxvk"
  | "checkbox_15yxls"
  | "checkbox_16mjaj"
  | "checkbox_17ineh"
  | "checkbox_18vvhu"
  | "checkbox_19ibje"
  | "checkbox_20spbe"
  | "checkbox_21vpey"
  | "checkbox_22vwa"
  | "checkbox_23brpx"
  | "checkbox_24vpjb"
  | "checkbox_25qrvk"
  | "checkbox_26nmr"
  | "checkbox_27kpkz"
  | "checkbox_28lung"
  | "checkbox_29onpx"
  | "checkbox_30oyls"
  | "checkbox_31bwua"
  | "checkbox_32nmxa"
  | "checkbox_33zhec"
  | "checkbox_34qrdp"
  | "checkbox_35xuse"
  | "checkbox_36cqsq"
  | "checkbox_37hned"
  | "checkbox_39puot"
  | "checkbox_40wyxr"
  | "checkbox_41cnuy"
  | "checkbox_42bdzg"
  | "checkbox_43ldig"
  | "checkbox_44zwpg"
  | "checkbox_45ypyt"
  | "checkbox_46mvhr"
  | "checkbox_47sybk";

const TEMPLATE_PDF_PATH = `${import.meta.env.BASE_URL}Evropski_izvestaj_FILLABLE_TEMPLATE_skica.pdf`;

const TEXT_FIELD_BINDINGS: Record<string, (report: ReportDraft) => string> = {
  text_2mnvx: (report) => report.location.date || "",
  text_3muph: (report) => report.location.time || "",
  text_4nahz: (report) => report.location.country || "",
  text_5sdcg: (report) => report.location.city || "",
  text_6hhbd: (report) => joinNonEmpty([report.location.street, report.location.streetNumber], " "),
  text_51xtiv: (report) => witnessLines(report.witnessInfo)[0],
  text_52nlcz: (report) => witnessLines(report.witnessInfo)[1],

  text_53avxv: (report) => report.vehicleA.ownerLastName || "",
  text_54enmp: (report) => report.vehicleA.ownerFirstName || "",
  text_55fexg: (report) => joinNonEmpty([report.vehicleA.ownerAddress, report.vehicleA.ownerCity], ", "),
  text_56eoty: (report) => report.vehicleA.ownerPostalCode || "",
  text_57bcol: (report) => report.vehicleA.ownerCountry || "",
  text_58vwdz: (report) => preferredContact(report.vehicleA.ownerPhone, report.vehicleA.ownerEmail),

  text_59cthd: (report) => joinNonEmpty([report.vehicleA.make, report.vehicleA.model, report.vehicleA.type], " / "),
  text_60psjq: (report) => report.vehicleA.plate || "",
  text_61rccw: (report) => report.vehicleA.trailerPlate || "",
  text_62ylvt: (report) => report.vehicleA.registrationCountry || "",
  text_63crse: (report) => report.vehicleA.trailerRegistrationCountry || "",

  text_64rnrt: (report) => report.vehicleA.insurer || "",
  text_65ykwy: (report) => report.vehicleA.policyNumber || "",
  text_66rjjm: (report) => report.vehicleA.greenCardNumber || "",
  text_67rvgv: (report) => report.vehicleA.policyValidFrom || "",
  text_68wtt: (report) => report.vehicleA.policyValidUntil || "",
  text_69rkho: (report) => report.vehicleA.insuranceBranch || "",
  text_70uqz: (report) => report.vehicleA.insuranceOfficeName || "",
  text_71ctxa: (report) => report.vehicleA.insuranceAddress || "",
  text_72lrtk: (report) => report.vehicleA.insuranceCity || "",
  text_73cmuf: (report) => report.vehicleA.insuranceCountry || "",
  text_74deqk: (report) => preferredContact(report.vehicleA.insurancePhone, report.vehicleA.insuranceEmail),

  text_77dbtl: (report) => report.vehicleA.driverLastName || "",
  text_78qgte: (report) => report.vehicleA.driverFirstName || "",
  text_79rili: (report) => report.vehicleA.driverAddress || "",
  text_80ewsd: (report) => report.vehicleA.driverBirthDate || "",
  text_81zleo: (report) => report.vehicleA.driverCity || "",
  text_82tulj: (report) => report.vehicleA.driverCountry || "",
  text_83imne: (report) => preferredContact(report.vehicleA.driverPhone, report.vehicleA.driverEmail),
  text_84rlrz: (report) => report.vehicleA.driverLicenseNumber || "",
  text_85hrnw: (report) => report.vehicleA.driverLicenseCategory || "",
  text_86qfmr: (report) => report.vehicleA.driverLicenseValidUntil || "",

  textarea_90yddb: (report) => report.vehicleA.visibleDamage || "",
  textarea_91wvix: (report) => report.vehicleA.note || "",
  textarea_92njxu: (report) => report.vehicleB.note || "",
  textarea_93dtme: (report) => report.vehicleB.visibleDamage || "",

  text_94mmmi: (report) => report.vehicleB.ownerLastName || "",
  text_95qzpq: (report) => report.vehicleB.ownerFirstName || "",
  text_96gmrt: (report) => joinNonEmpty([report.vehicleB.ownerAddress, report.vehicleB.ownerCity], ", "),
  text_97iika: (report) => preferredContact(report.vehicleB.ownerPhone, report.vehicleB.ownerEmail),
  text_98splj: (report) => report.vehicleB.ownerPostalCode || "",
  text_99vnzh: (report) => report.vehicleB.ownerCountry || "",

  text_100iqrg: (report) => joinNonEmpty([report.vehicleB.make, report.vehicleB.model, report.vehicleB.type], " / "),
  text_101lhia: (report) => report.vehicleB.plate || "",
  text_102xhix: (report) => report.vehicleB.trailerPlate || "",
  text_103cxlo: (report) => report.vehicleB.insurer || "",
  text_104demr: (report) => report.vehicleB.policyNumber || "",
  text_105kgtq: (report) => report.vehicleB.greenCardNumber || "",
  text_106lvgm: (report) => report.vehicleB.policyValidFrom || "",
  text_107tbdu: (report) => report.vehicleB.policyValidUntil || "",
  text_108dozs: (report) => report.vehicleB.insuranceBranch || "",
  text_109bopa: (report) => report.vehicleB.insuranceOfficeName || "",
  text_110tuy: (report) => report.vehicleB.insuranceAddress || "",
  text_111xycb: (report) => report.vehicleB.insuranceCity || "",
  text_112glda: (report) => report.vehicleB.insuranceCountry || "",
  text_113tweo: (report) => preferredContact(report.vehicleB.insurancePhone, report.vehicleB.insuranceEmail),

  text_116uhlf: (report) => report.vehicleB.driverLastName || "",
  text_117uchs: (report) => report.vehicleB.driverFirstName || "",
  text_118inyk: (report) => report.vehicleB.driverBirthDate || "",
  text_119qjft: (report) => report.vehicleB.driverAddress || "",
  text_120ormn: (report) => report.vehicleB.driverCity || "",
  text_121flij: (report) => report.vehicleB.driverCountry || "",
  text_122jcme: (report) => preferredContact(report.vehicleB.driverPhone, report.vehicleB.driverEmail),
  text_123yboy: (report) => report.vehicleB.driverLicenseNumber || "",
  text_124aptq: (report) => report.vehicleB.driverLicenseCategory || "",
  text_125iajb: (report) => report.vehicleB.driverLicenseValidUntil || "",

  text_49lcae: (report) => String(report.circumstances.filter((item) => item.selectedByA).length || ""),
  text_50oto: (report) => String(report.circumstances.filter((item) => item.selectedByB).length || ""),
};

const CHECKBOX_BINDINGS: Record<CheckboxFieldName, (report: ReportDraft) => boolean> = {
  checkbox_7kmiz: (report) => report.safety.injured === true,
  checkbox_8lqyl: (report) => report.safety.injured === false,
  checkbox_9jemi: (report) => report.safety.damageOtherVehicles === true,
  checkbox_10rfem: (report) => report.safety.damageOtherVehicles === false,
  checkbox_11uxhn: (report) => report.safety.damageOtherObjects === true,
  checkbox_12gczq: (report) => report.safety.damageOtherObjects === false,
  checkbox_75hrwb: (report) => report.vehicleA.coveredDamage === false,
  checkbox_76pbyu: (report) => report.vehicleA.coveredDamage === true,
  checkbox_114tjp: (report) => report.vehicleB.coveredDamage === false,
  checkbox_115vnqt: (report) => report.vehicleB.coveredDamage === true,
  checkbox_13ygjn: (report) => Boolean(report.circumstances[0]?.selectedByA),
  checkbox_17ineh: (report) => Boolean(report.circumstances[0]?.selectedByB),
  checkbox_14yxvk: (report) => Boolean(report.circumstances[1]?.selectedByA),
  checkbox_18vvhu: (report) => Boolean(report.circumstances[1]?.selectedByB),
  checkbox_15yxls: (report) => Boolean(report.circumstances[2]?.selectedByA),
  checkbox_19ibje: (report) => Boolean(report.circumstances[2]?.selectedByB),
  checkbox_16mjaj: (report) => Boolean(report.circumstances[3]?.selectedByA),
  checkbox_20spbe: (report) => Boolean(report.circumstances[3]?.selectedByB),
  checkbox_22vwa: (report) => Boolean(report.circumstances[4]?.selectedByA),
  checkbox_21vpey: (report) => Boolean(report.circumstances[4]?.selectedByB),
  checkbox_23brpx: (report) => Boolean(report.circumstances[5]?.selectedByA),
  checkbox_24vpjb: (report) => Boolean(report.circumstances[5]?.selectedByB),
  checkbox_25qrvk: (report) => Boolean(report.circumstances[6]?.selectedByA),
  checkbox_26nmr: (report) => Boolean(report.circumstances[6]?.selectedByB),
  checkbox_27kpkz: (report) => Boolean(report.circumstances[7]?.selectedByA),
  checkbox_28lung: (report) => Boolean(report.circumstances[7]?.selectedByB),
  checkbox_29onpx: (report) => Boolean(report.circumstances[8]?.selectedByA),
  checkbox_39puot: (report) => Boolean(report.circumstances[8]?.selectedByB),
  checkbox_30oyls: (report) => Boolean(report.circumstances[9]?.selectedByA),
  checkbox_40wyxr: (report) => Boolean(report.circumstances[9]?.selectedByB),
  checkbox_31bwua: (report) => Boolean(report.circumstances[10]?.selectedByA),
  checkbox_41cnuy: (report) => Boolean(report.circumstances[10]?.selectedByB),
  checkbox_32nmxa: (report) => Boolean(report.circumstances[11]?.selectedByA),
  checkbox_42bdzg: (report) => Boolean(report.circumstances[11]?.selectedByB),
  checkbox_33zhec: (report) => Boolean(report.circumstances[12]?.selectedByA),
  checkbox_43ldig: (report) => Boolean(report.circumstances[12]?.selectedByB),
  checkbox_34qrdp: (report) => Boolean(report.circumstances[13]?.selectedByA),
  checkbox_44zwpg: (report) => Boolean(report.circumstances[13]?.selectedByB),
  checkbox_35xuse: (report) => Boolean(report.circumstances[14]?.selectedByA),
  checkbox_45ypyt: (report) => Boolean(report.circumstances[14]?.selectedByB),
  checkbox_36cqsq: (report) => Boolean(report.circumstances[15]?.selectedByA),
  checkbox_46mvhr: (report) => Boolean(report.circumstances[15]?.selectedByB),
  checkbox_37hned: () => false,
  checkbox_47sybk: () => false,
};

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function joinNonEmpty(parts: Array<string | null | undefined>, separator: string) {
  return normalizeWhitespace(parts.filter(Boolean).join(separator));
}

function preferredContact(phone?: string | null, email?: string | null) {
  if (phone && email) {
    return `${phone} / ${email}`;
  }

  return phone || email || "";
}

function witnessLines(text?: string | null) {
  const normalized = normalizeWhitespace(text ?? "");
  if (!normalized) {
    return ["", ""];
  }

  if (normalized.length <= 70) {
    return [normalized, ""];
  }

  const splitAt = normalized.lastIndexOf(",", 70);
  if (splitAt > 0) {
    return [normalized.slice(0, splitAt + 1).trim(), normalized.slice(splitAt + 1).trim()];
  }

  return [normalized.slice(0, 70).trim(), normalized.slice(70).trim()];
}

async function fetchAssetBytes(path: string) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Neuspesno ucitavanje PDF asseta: ${path}`);
  }
  return response.arrayBuffer();
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToImage(pdfDoc: PDFDocument, dataUrl: string) {
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
    element.onerror = () => reject(new Error("Neuspesno ucitavanje skice za PDF."));
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

function getFieldRect(form: any, fieldName: string) {
  const field = form.getField(fieldName);
  const widget = field.acroField.getWidgets()[0];
  const rect = widget.getRectangle();
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  };
}

async function drawImageInPdfRect(
  pdfDoc: PDFDocument,
  page: any,
  dataUrl: string,
  rect: { x: number; y: number; width: number; height: number },
  padding = 2
) {
  const normalized = await svgToPngDataUrl(dataUrl);
  const image = await dataUrlToImage(pdfDoc, normalized);
  const availableWidth = Math.max(1, rect.width - padding * 2);
  const availableHeight = Math.max(1, rect.height - padding * 2);
  const ratio = Math.min(availableWidth / image.width, availableHeight / image.height);
  const drawWidth = image.width * ratio;
  const drawHeight = image.height * ratio;
  const x = rect.x + (rect.width - drawWidth) / 2;
  const y = rect.y + (rect.height - drawHeight) / 2;

  page.pushOperators(
    pushGraphicsState(),
    moveTo(rect.x, rect.y),
    lineTo(rect.x + rect.width, rect.y),
    lineTo(rect.x + rect.width, rect.y + rect.height),
    lineTo(rect.x, rect.y + rect.height),
    closePath(),
    clip(),
    endPath()
  );

  page.drawImage(image, {
    x,
    y,
    width: drawWidth,
    height: drawHeight,
  });

  page.pushOperators(popGraphicsState());
}

function setTextFields(form: any, report: ReportDraft) {
  for (const [fieldName, resolver] of Object.entries(TEXT_FIELD_BINDINGS)) {
    const field = form.getTextField(fieldName);
    field.setText(resolver(report));
  }
}

function setCheckboxFields(form: any, report: ReportDraft) {
  for (const [fieldName, resolver] of Object.entries(CHECKBOX_BINDINGS) as Array<[CheckboxFieldName, (report: ReportDraft) => boolean]>) {
    const field = form.getCheckBox(fieldName);
    if (resolver(report)) {
      field.check();
    } else {
      field.uncheck();
    }
  }
}

export async function generateReportPdf(report: ReportDraft): Promise<GeneratedPdf> {
  const templateBytes = await fetchAssetBytes(TEMPLATE_PDF_PATH);
  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);

  const regularFontBytes = await fetchAssetBytes(`${import.meta.env.BASE_URL}fonts/arial.ttf`);
  const regularFont = await pdfDoc.embedFont(regularFontBytes, { subset: true });

  const form = pdfDoc.getForm();
  setTextFields(form, report);
  setCheckboxFields(form, report);
  form.getTextField("sketch_image").setText("");
  form.getTextField("signature A").setText("");
  form.getTextField("signature B").setText("");
  form.updateFieldAppearances(regularFont);

  const firstPage = pdfDoc.getPages()[0];
  if (report.annotatedPhotoDataUrl || report.sceneSketch.svgDataUrl) {
    await drawImageInPdfRect(
      pdfDoc,
      firstPage,
      report.annotatedPhotoDataUrl || report.sceneSketch.svgDataUrl || "",
      getFieldRect(form, "sketch_image"),
      4
    );
  }
  if (report.signatures.a) {
    await drawImageInPdfRect(pdfDoc, firstPage, report.signatures.a, getFieldRect(form, "signature A"), 1);
  }
  if (report.signatures.b) {
    await drawImageInPdfRect(pdfDoc, firstPage, report.signatures.b, getFieldRect(form, "signature B"), 1);
  }

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes.slice().buffer], { type: "application/pdf" });

  return {
    blob,
    url: URL.createObjectURL(blob),
    dataUrl: await blobToDataUrl(blob),
  };
}
