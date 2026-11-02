import { PDFDocument } from "pdf-lib";

/**
 * Captures the current CAD WebGL canvas and optional SVG review overlay into a high-DPR PNG Blob.
 */
export async function captureReviewPngBlob(
  canvas: HTMLCanvasElement,
  svgOverlay?: SVGElement | null,
  scale = 1,
  includedItemIds?: ReadonlySet<string>
): Promise<Blob> {
  const width = Math.round(canvas.width * Math.max(1, scale));
  const height = Math.round(canvas.height * Math.max(1, scale));


  // Create offscreen composite canvas
  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext("2d");
  if (!ctx) {
    throw new Error("Offscreen 2D canvas context alınamadı.");
  }

  // 1. Draw WebGL base CAD canvas
  ctx.drawImage(canvas, 0, 0, width, height);

  // 2. Draw SVG review overlay if present
  if (svgOverlay) {
    // Serialize only committed and currently included review items.
    const cleanSvg = svgOverlay.cloneNode(true) as SVGElement;
    cleanSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    cleanSvg.querySelectorAll("[data-cad-review-move-handle]").forEach((el) => el.remove());
    cleanSvg.querySelectorAll("[data-review-id]").forEach((el) => {
      const id = el.getAttribute("data-review-id");
      if (id === "draft-item" || (includedItemIds && (!id || !includedItemIds.has(id)))) {
        el.remove();
      }
    });
    const svgString = new XMLSerializer().serializeToString(cleanSvg);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });
      ctx.drawImage(img, 0, 0, width, height);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  return new Promise<Blob>((resolve, reject) => {
    offscreen.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("PNG blob dönüştürme başarısız oldu."));
      },
      "image/png",
      1.0
    );
  });
}

/** Construct a real one-page PDF embedding the captured PNG, preserving its aspect ratio. */
export async function pngToPdfBlob(pngBlob: Blob): Promise<Blob> {
  if (pngBlob.type && pngBlob.type !== "image/png") {
    throw new Error("PDF oluşturmak için geçerli PNG gerekiyor.");
  }
  const pdf = await PDFDocument.create();
  const image = await pdf.embedPng(new Uint8Array(await pngBlob.arrayBuffer()));
  const scale = Math.min(1, 14400 / Math.max(image.width, image.height));
  const width = Math.max(1, image.width * scale);
  const height = Math.max(1, image.height * scale);
  const page = pdf.addPage([width, height]);
  page.drawImage(image, { x: 0, y: 0, width, height });
  return new Blob([Uint8Array.from(await pdf.save())], { type: "application/pdf" });
}

export async function exportCanvasToPdfBlob(
  canvas: HTMLCanvasElement,
  svgOverlay?: SVGElement | null,
  includedItemIds?: ReadonlySet<string>
): Promise<Blob> {
  const pngBlob = await captureReviewPngBlob(canvas, svgOverlay, 2, includedItemIds);
  return pngToPdfBlob(pngBlob);
}

/**
 * Triggers a browser file download from a Blob.
 */
export function downloadFileBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}