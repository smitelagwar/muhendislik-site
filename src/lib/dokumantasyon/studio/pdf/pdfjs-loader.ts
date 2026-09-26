// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF.JS GÜVENLİ YÜKLEYİCİ VE YAŞAM DÖNGÜSÜ
// ============================================================================

import {
  loadBrowserPdfJs,
  type BrowserPdfJs,
} from "@/lib/pdfjs-client";

/** Loads the locally hosted PDF.js module without a CDN fallback. */
export async function loadSecurePdfJs(): Promise<BrowserPdfJs | null> {
  return loadBrowserPdfJs();
}

/** Uses the patched PDF.js core renderer; the separate viewer scripting bundle is not loaded. */
export async function createSecurePdfLoadingTask(
  url: string
): Promise<ReturnType<BrowserPdfJs["getDocument"]>> {
  const pdfjs = await loadSecurePdfJs();
  if (!pdfjs) throw new Error("PDF.js başlatılamadı.");

  return pdfjs.getDocument({
    url,
    cMapUrl: "/vendor/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/vendor/pdfjs/standard_fonts/",
  });
}
