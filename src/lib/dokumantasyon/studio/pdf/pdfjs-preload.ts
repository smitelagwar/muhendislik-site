// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF.JS WORKER & CORE PRELOAD
// ============================================================================

let isPreloaded = false;

export function preloadPdfJsAssets(): void {
  if (isPreloaded || typeof window === "undefined") return;
  isPreloaded = true;

  try {
    const workerLink = document.createElement("link");
    workerLink.rel = "modulepreload";
    workerLink.href = "/vendor/pdfjs/pdf.worker.mjs";
    document.head.appendChild(workerLink);

    const coreLink = document.createElement("link");
    coreLink.rel = "modulepreload";
    coreLink.href = "/vendor/pdfjs/pdf.min.mjs";
    document.head.appendChild(coreLink);
  } catch (err) {
    console.warn("PDF.js preload failed:", err);
  }
}
