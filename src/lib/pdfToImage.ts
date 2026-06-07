import * as pdfjs from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Slika izvestaja nije kreirana."));
      },
      type,
      quality
    );
  });
}

export async function renderFirstPdfPageAsJpegFile(pdfUrl: string, fileName: string) {
  const response = await fetch(pdfUrl, { cache: "no-store" });
  const contentType = response.headers.get("content-type") || "";

  if (!response.ok || (contentType && !contentType.includes("pdf"))) {
    throw new Error("PDF fajl nije dostupan.");
  }

  const bytes = await response.arrayBuffer();
  const pdfDocument = await pdfjs.getDocument({ data: bytes }).promise;
  const page = await pdfDocument.getPage(1);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = Math.min(2.4, 1800 / baseViewport.width);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas nije dostupan.");
  }

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvas,
    canvasContext: context,
    viewport
  }).promise;

  const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);
  await pdfDocument.cleanup();

  return new File([blob], fileName, { type: "image/jpeg" });
}
