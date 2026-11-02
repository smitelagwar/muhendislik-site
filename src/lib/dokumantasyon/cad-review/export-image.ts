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
    throw new Error("Offscreen 2D canvas context alÄ±namadÄ±.");
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
    const svgB¶»§q«^