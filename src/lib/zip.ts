import type { ReportDraft } from "../types";
import { generatePdf } from "./pdf";

type ZipEntry = {
  name: string;
  bytes: Uint8Array;
};

const encoder = new TextEncoder();

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(target: Uint8Array, offset: number, value: number) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32(target: Uint8Array, offset: number, value: number) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
  target[offset + 3] = (value >>> 24) & 0xff;
}

function concat(parts: Uint8Array[]) {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(size);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
}

async function dataUrlToBytes(dataUrl: string) {
  const response = await fetch(dataUrl);
  return new Uint8Array(await response.arrayBuffer());
}

function extensionFromDataUrl(dataUrl: string) {
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) {
    return "jpg";
  }
  if (dataUrl.startsWith("data:image/svg")) {
    return "svg";
  }
  return "png";
}

function safeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "file";
}

function createZip(entries: ZipEntry[]) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  entries.forEach((entry) => {
    const name = encoder.encode(entry.name);
    const crc = crc32(entry.bytes);
    const local = new Uint8Array(30 + name.length);
    writeUint32(local, 0, 0x04034b50);
    writeUint16(local, 4, 20);
    writeUint16(local, 6, 0x0800);
    writeUint16(local, 8, 0);
    writeUint32(local, 14, crc);
    writeUint32(local, 18, entry.bytes.length);
    writeUint32(local, 22, entry.bytes.length);
    writeUint16(local, 26, name.length);
    local.set(name, 30);
    localParts.push(local, entry.bytes);

    const central = new Uint8Array(46 + name.length);
    writeUint32(central, 0, 0x02014b50);
    writeUint16(central, 4, 20);
    writeUint16(central, 6, 20);
    writeUint16(central, 8, 0x0800);
    writeUint16(central, 10, 0);
    writeUint32(central, 16, crc);
    writeUint32(central, 20, entry.bytes.length);
    writeUint32(central, 24, entry.bytes.length);
    writeUint16(central, 28, name.length);
    writeUint32(central, 42, offset);
    central.set(name, 46);
    centralParts.push(central);

    offset += local.length + entry.bytes.length;
  });

  const central = concat(centralParts);
  const end = new Uint8Array(22);
  writeUint32(end, 0, 0x06054b50);
  writeUint16(end, 8, entries.length);
  writeUint16(end, 10, entries.length);
  writeUint32(end, 12, central.length);
  writeUint32(end, 16, offset);

  return new Blob([...localParts, central, end].map((part) => part.slice().buffer), {
    type: "application/zip"
  });
}

export async function generateReportZip(report: ReportDraft) {
  const pdf = await generatePdf(report);
  const pdfBytes = new Uint8Array(await pdf.blob.arrayBuffer());
  const entries: ZipEntry[] = [
    { name: `${report.publicId}/finalni-pdf.pdf`, bytes: pdfBytes },
    {
      name: `${report.publicId}/json-snapshot.json`,
      bytes: encoder.encode(JSON.stringify(report, null, 2))
    },
    {
      name: `${report.publicId}/metadata.json`,
      bytes: encoder.encode(
        JSON.stringify(
          {
            id: report.id,
            publicId: report.publicId,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
            location: report.location,
            status: report.status
          },
          null,
          2
        )
      )
    }
  ];

  await Promise.all(
    report.scenePhotos.map(async (photo, index) => {
      entries.push({
        name: `${report.publicId}/slike/${String(index + 1).padStart(2, "0")}-${photo.kind || "photo"}.${extensionFromDataUrl(photo.dataUrl)}`,
        bytes: await dataUrlToBytes(photo.dataUrl)
      });
    })
  );

  await Promise.all(
    ([
      ["A", report.vehicleA.documentPhotos],
      ["B", report.vehicleB.documentPhotos]
    ] as const).flatMap(([side, photos]) =>
      photos.map(async (photo, index) => {
        const documentType = safeName(photo.documentType || "dokument");
        const documentSide = safeName(photo.documentSide || "strana");
        entries.push({
          name: `${report.publicId}/dokumenti/vozilo-${side}/${String(index + 1).padStart(2, "0")}-${documentType}-${documentSide}.${extensionFromDataUrl(photo.dataUrl)}`,
          bytes: await dataUrlToBytes(photo.dataUrl)
        });
      })
    )
  );

  const sketch = report.annotatedPhotoDataUrl || report.sceneSketch.svgDataUrl;
  if (sketch) {
    entries.push({
      name: `${report.publicId}/skica/sketch.${extensionFromDataUrl(sketch)}`,
      bytes: await dataUrlToBytes(sketch)
    });
  }

  const blob = createZip(entries);
  return {
    blob,
    url: URL.createObjectURL(blob)
  };
}
