// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF.JS GÜVENLİ YÜKLEYİCİ VE YAŞAM DÖNGÜSÜ (FAZ B)
// ============================================================================

import {
  loadBrowserPdfJs,
  type BrowserPdfJs,
} from "@/lib/pdfjs-client";

let sharedWorkerPromise: Promise<unknown> | null = null;

/**
 * PDFWorker tek örnek (singleton) olarak başlatılır ve belgeler arasında paylaşılır.
 * Bu sayede her PDF açılışında yeni worker iş parçacığı oluşturma (spawn/parse) maliyeti 0 ms'ye iner.
 * Unmount sırasında destroy EDİLMEZ.
 */
export async function getSharedPdfWorker(pdfjs: BrowserPdfJs): Promise<unknown> {
  if (typeof window === "undefined") return null;

  if (!sharedWorkerPromise) {
    try {
      const worker = new pdfjs.PDFWorker();
      sharedWorkerPromise = worker.promise
        .then(() => worker)
        .catch((err) => {
          console.warn("PDF.js singleton worker başlatılamadı, varsayılan worker kullanılacak:", err);
          sharedWorkerPromise = null;
          return null;
        });
    } catch (err) {
      console.warn("PDF.js worker örneği alınamadı:", err);
      return null;
    }
  }

  return sharedWorkerPromise;
}

export interface SecurePdfLoadingOptions {
  onPassword?: (callback: (password: string) => void, reason: number) => void;
  onProgress?: (progress: { loaded: number; total: number }) => void;
  disableAutoFetch?: boolean;
  rangeChunkSize?: number;
  useSharedWorker?: boolean;
}

/** Loads the locally hosted PDF.js module without a CDN fallback. */
export async function loadSecurePdfJs(): Promise<BrowserPdfJs | null> {
  return loadBrowserPdfJs();
}

/**
 * PDF dokümanını güvenli ve performanslı yükleme parametreleriyle başlatır.
 * - isEvalSupported: false (güvenlik sertleştirmesi)
 * - wasmUrl: /vendor/pdfjs/wasm/ (JPX/JBIG2 dekoderleri için)
 * - rangeChunkSize: 262144 (256 KB — ağ gecikmesi ve parça istek dengesi)
 * - onPassword ve onProgress kancaları
 */
export async function createSecurePdfLoadingTask(
  url: string,
  options?: SecurePdfLoadingOptions
): Promise<ReturnType<BrowserPdfJs["getDocument"]>> {
  const pdfjs = await loadSecurePdfJs();
  if (!pdfjs) throw new Error("PDF.js başlatılamadı.");

  let worker: unknown = undefined;
  if (options?.useSharedWorker !== false) {
    try {
      worker = await getSharedPdfWorker(pdfjs);
    } catch {
      worker = undefined;
    }
  }

  const docParams: Parameters<BrowserPdfJs["getDocument"]>[0] & { isEvalSupported?: boolean } = {
    url,
    cMapUrl: "/vendor/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/vendor/pdfjs/standard_fonts/",
    wasmUrl: "/vendor/pdfjs/wasm/",
    isEvalSupported: false,
    disableRange: false,
    disableStream: false,
    disableAutoFetch: options?.disableAutoFetch ?? true,
    rangeChunkSize: options?.rangeChunkSize ?? 262144, // 256 KB
  };

  if (worker) {
    (docParams as { worker?: unknown }).worker = worker;
  }

  const loadingTask = pdfjs.getDocument(docParams);

  if (options?.onPassword) {
    loadingTask.onPassword = options.onPassword;
  }

  if (options?.onProgress) {
    loadingTask.onProgress = options.onProgress;
  }

  return loadingTask;
}
