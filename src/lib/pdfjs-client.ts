import { PDFJS_MAIN, PDFJS_POLYFILLS, PDFJS_WORKER } from "@/lib/pdfjs-paths";

export type BrowserPdfJs = typeof import("pdfjs-dist");

declare global {
  interface Window {
    pdfjsLib?: BrowserPdfJs;
  }
}

let pdfJsPromise: Promise<BrowserPdfJs> | null = null;
let sharedPdfWorkerPromise: Promise<unknown> | null = null;

/** Load the locally hosted PDF.js module once for generated document previews. */
export async function loadBrowserPdfJs(): Promise<BrowserPdfJs | null> {
  if (typeof window === "undefined") return null;

  const current = window.pdfjsLib;
  if (current) return current;

  if (!pdfJsPromise) {
    pdfJsPromise = (async () => {
      await import(/* webpackIgnore: true */ PDFJS_POLYFILLS);
      const pdfjs = (await import(/* webpackIgnore: true */ PDFJS_MAIN)) as BrowserPdfJs;
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      window.pdfjsLib = pdfjs;
      return pdfjs;
    })().catch((error) => {
      pdfJsPromise = null;
      throw error;
    });
  }

  return pdfJsPromise;
}

/**
 * Returns a singleton PDFWorker instance shared across document loads so
 * mobile browsers do not re-spawn and re-parse the worker on every update.
 */
export async function getSharedBrowserPdfWorker(pdfjs: BrowserPdfJs): Promise<unknown> {
  if (typeof window === "undefined") return null;

  if (sharedPdfWorkerPromise) {
    const existing = await sharedPdfWorkerPromise;
    if (existing && !(existing as { destroyed?: boolean }).destroyed) {
      return existing;
    }
    sharedPdfWorkerPromise = null;
  }

  try {
    const worker = new pdfjs.PDFWorker();
    sharedPdfWorkerPromise = worker.promise
      .then(() => worker)
      .catch((err) => {
        console.warn("PDF.js singleton worker başlatılamadı, varsayılan worker kullanılacak:", err);
        sharedPdfWorkerPromise = null;
        return null;
      });
    return sharedPdfWorkerPromise;
  } catch (err) {
    console.warn("PDF.js worker örneği alınamadı:", err);
    return null;
  }
}

/** Pre-warm the locally hosted PDF.js module and shared worker in the background so preview is instant. */
export function prewarmBrowserPdfJs(): void {
  if (typeof window === "undefined") return;
  void loadBrowserPdfJs()
    .then((pdfjs) => {
      if (pdfjs) return getSharedBrowserPdfWorker(pdfjs);
      return null;
    })
    .catch(() => {});
}
