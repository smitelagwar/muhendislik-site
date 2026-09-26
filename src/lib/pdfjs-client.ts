export type BrowserPdfJs = typeof import("pdfjs-dist");

declare global {
  interface Window {
    pdfjsLib?: BrowserPdfJs;
  }
}

let pdfJsPromise: Promise<BrowserPdfJs> | null = null;

/** Load the locally hosted PDF.js module once for generated document previews. */
export async function loadBrowserPdfJs(): Promise<BrowserPdfJs | null> {
  if (typeof window === "undefined") return null;

  const current = window.pdfjsLib;
  if (current) return current;

  if (!pdfJsPromise) {
    const moduleUrl = "/vendor/pdfjs/pdf.min.mjs";
    pdfJsPromise = (import(/* webpackIgnore: true */ moduleUrl) as Promise<BrowserPdfJs>)
      .then((pdfjs) => {
        pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.mjs";
        window.pdfjsLib = pdfjs;
        return pdfjs;
      })
      .catch((error) => {
        pdfJsPromise = null;
        throw error;
      });
  }

  return pdfJsPromise;
}
