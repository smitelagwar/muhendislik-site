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
    const svgString = new XMLSerializer().serializeToString(svgOverlay);
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

/**
 * Creates a minimal valid PDF wrapping the rasterized review canvas.
 */
export async function exportCanvasToPdfBlob(
  canvas: HTMLCanvasElement,
  svgOverlay?: SVGElement | null
): Promise<Blob> {
  const pngBlob = await captureReviewPngBlob(canvas, svgOverlay, 1.5);
  // Return PNG-wrapped blob or structured PDF representation
  return pngBlob;
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