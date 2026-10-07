import { PDFJS_MAIN, PDFJS_POLYFILLS, PDFJS_WORKER } from "@/lib/pdfjs-paths";

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
