"use client";

// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF.JS GÜVENLİ ÖN ISITMA (WARM-UP) VE SINGLETON WORKER
// ============================================================================

import { loadSecurePdfJs, getSharedPdfWorker } from "./pdfjs-loader";

let pdfCodePreloadPromise: Promise<unknown> | null = null;
let lastScrollTimestamp = 0;

if (typeof window !== "undefined") {
  window.addEventListener(
    "scroll",
    () => {
      lastScrollTimestamp = Date.now();
    },
    { passive: true }
  );
}

export function isActivelyScrolling(): boolean {
  if (typeof window === "undefined") return false;
  return Date.now() - lastScrollTimestamp < 400;
}

export function shouldAllowPdfPreload(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (document.visibilityState === "hidden") return false;

  const nav = navigator as unknown as {
    connection?: {
      saveData?: boolean;
      effectiveType?: string;
    };
  };

  // Veri tasarrufu modu açıksa veya bağlantı çok yavaşsa ön ısıtma yapma
  if (nav.connection?.saveData) return false;
  const effectiveType = nav.connection?.effectiveType;
  if (effectiveType === "slow-2g" || effectiveType === "2g") return false;

  return true;
}

/**
 * PDF.js çekirdek modülünü ve singleton worker örneğini arka planda ısıtır.
 */
export async function preloadPdfJsCode(): Promise<unknown> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!shouldAllowPdfPreload()) return Promise.resolve();

  if (!pdfCodePreloadPromise) {
    pdfCodePreloadPromise = (async () => {
      try {
        const pdfjs = await loadSecurePdfJs();
        if (pdfjs) {
          await getSharedPdfWorker(pdfjs);
        }
      } catch (err) {
        console.warn("PDF.js ön ısıtma sessizce iptal edildi:", err);
      }
    })();
  }

  return pdfCodePreloadPromise;
}

/**
 * Kullanıcı PDF öğesine yaklaştığında veya tıkladığında (intent) ısıtmayı tetikler.
 */
export function triggerPdfIntentPreload(extension?: string): void {
  if (!extension) return;
  const ext = extension.trim().toLowerCase().replace(/^\./, "");
  if (ext === "pdf") {
    void preloadPdfJsCode();
  }
}

/**
 * Tarayıcı boştayken (requestIdleCallback) arka plan ön ısıtmasını planlar.
 */
export function scheduleIdlePdfPreload(options?: { minDelayMs?: number }): () => void {
  if (!shouldAllowPdfPreload()) return () => {};

  let cancelled = false;
  let timeoutId: number | null = null;
  let idleId: number | null = null;

  const executePreload = async () => {
    if (cancelled || !shouldAllowPdfPreload()) return;
    if (isActivelyScrolling()) {
      timeoutId = window.setTimeout(executePreload, 500);
      return;
    }
    try {
      await preloadPdfJsCode();
    } catch {
      // Hatalar sessizce yutulur
    }
  };

  const delay = options?.minDelayMs ?? 1500;

  if (typeof window.requestIdleCallback === "function") {
    timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      idleId = window.requestIdleCallback(
        () => {
          void executePreload();
        },
        { timeout: 3000 }
      );
    }, delay);
  } else {
    timeoutId = window.setTimeout(() => {
      void executePreload();
    }, delay);
  }

  return () => {
    cancelled = true;
    if (timeoutId !== null) window.clearTimeout(timeoutId);
    if (idleId !== null && typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(idleId);
    }
  };
}

/**
 * Eski v1 uyumluluk köprüsü (deprecated) — modulepreload yerine scheduleIdlePdfPreload kullanır.
 */
export function preloadPdfJsAssets(): void {
  scheduleIdlePdfPreload({ minDelayMs: 1200 });
}
