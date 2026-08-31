import { jsPDF } from "jspdf";

/**
 * Captures the current CAD WebGL canvas and optional SVG review overlay into a high-DPR PNG Blob.
 */
export async function captureReviewPngBlob(
  canvas: HTMLCanvasElement,
  svgOverlay?: SVGElement | null,
  scale = 1
): Promise<Blob> {
  const width = Math.round(canvas.width * Math.max(1, scale));
  const height = Math.round(canvas.height * Math.max(1, scale));

  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext("2d");
  if (!ctx) {
    throw new Error("Offscreen 2D canvas context alınamadı.");
  }

  ctx.drawImage(canvas, 0, 0, width, height);

  if (svgOverlay) {
    const svgString = new XMLSerializer().serializeToString(svgOverlay);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Review SVG katmanı PNG çıktısına eklenemedi."));
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

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("PNG verisi PDF için okunamadı."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("PNG verisi PDF için okunamadı."));
    reader.readAsDataURL(blob);
  });
}

/**
 * Creates a real A4 PDF review sheet containing the current CAD viewport + Review Layer.
 */
export async function exportCanvasToPdfBlob(
  canvas: HTMLCanvasElement,
  svgOverlay?: SVGElement | null
): Promise<Blob> {
  if (canvas.width <= 0 || canvas.height <= 0) {
    throw new Error("PDF için geçerli CAD canvas boyutu bulunamadı.");
  }
  const pngBlob = await captureReviewPngBlob(canvas, svgOverlay, 1.5);
  const dataUrl = await blobToDataUrl(pngBlob);
  const orientation = canvas.width >= canvas.height ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation, unit: "pt", format: "a4", compress: true });
  pdf.setProperties({ title: "CAD Review Sheet", subject: "CAD review viewport export" });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const headerHeight = 22;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2 - headerHeight;
  const sourceRatio = canvas.width / Math.max(1, canvas.height);
  const boxRatio = maxWidth / Math.max(1, maxHeight);
  const imageWidth = sourceRatio >= boxRatio ? maxWidth : maxHeight * sourceRatio;
  const imageHeight = sourceRatio >= boxRatio ? maxWidth / sourceRatio : maxHeight;
  const imageX = (pageWidth - imageWidth) / 2;
  const imageY = margin + headerHeight + (maxHeight - imageHeight) / 2;

  pdf.setFontSize(11);
  pdf.text("CAD Review Sheet", margin, margin + 10);
  pdf.addImage(dataUrl, "PNG", imageX, imageY, imageWidth, imageHeight, undefined, "FAST");

  const blob = pdf.output("blob");
  if (blob.type !== "application/pdf") {
    return new Blob([await blob.arrayBuffer()], { type: "application/pdf" });
  }
  return blob;
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
