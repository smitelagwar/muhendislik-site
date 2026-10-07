// ============================================================================
// PDF v4 MOTOR — KADEMELİ SAYFA BOYUTU OKUYUCU (Plan 03 P3.2)
// ----------------------------------------------------------------------------
// Karışık boyutlu belgelerde kaydırma sırasında zıplamaları önler.
// Açılışta ilk 25 sayfa hızlıca okunur, kalanı arka planda (idle) tamamlanır.
// ============================================================================

import type { PageSizePt } from "./layout";

export interface SizeSource {
  numPages: number;
  getPage(n: number): Promise<{
    view?: number[];
    rotate?: number;
    getViewport?: (params: { scale: number; rotation?: number }) => { width: number; height: number };
    cleanup?: () => void;
  }>;
}

const idle = (signal: AbortSignal): Promise<void> =>
  new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const ric = typeof globalThis !== "undefined" ? (globalThis as any).requestIdleCallback : null;
    let timer: any = null;

    const onAbort = () => {
      if (timer) clearTimeout(timer);
      resolve();
    };

    signal.addEventListener("abort", onAbort, { once: true });

    if (ric) {
      ric(
        () => {
          signal.removeEventListener("abort", onAbort);
          resolve();
        },
        { timeout: 100 }
      );
    } else {
      timer = setTimeout(() => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      }, 0);
    }
  });

export async function readAllSizes(
  doc: SizeSource,
  signal: AbortSignal,
  onBatch: (from: number, sizes: PageSizePt[]) => void,
  opts: { batch?: number; firstBatchBlocking?: boolean } = {}
): Promise<void> {
  const n = doc.numPages;
  const batchSize = opts.batch ?? (n > 5000 ? 50 : 25);

  for (let from = 1; from <= n; from += batchSize) {
    if (signal.aborted) return;
    const to = Math.min(n, from + batchSize - 1);
    const count = to - from + 1;

    try {
      const pagePromises = Array.from({ length: count }, (_, k) => doc.getPage(from + k));
      const pages = await Promise.all(pagePromises);

      const sizes: PageSizePt[] = pages.map((p) => {
        let w = 595;
        let h = 842;

        if (Array.isArray(p.view) && p.view.length >= 4) {
          const [x0, y0, x1, y1] = p.view;
          const rot = (((p.rotate ?? 0) % 360) + 360) % 360;
          const rawW = Math.abs(x1 - x0) || 595;
          const rawH = Math.abs(y1 - y0) || 842;
          if (rot === 90 || rot === 270) {
            w = rawH;
            h = rawW;
          } else {
            w = rawW;
            h = rawH;
          }
        } else if (typeof p.getViewport === "function") {
          const vp = p.getViewport({ scale: 1.0, rotation: p.rotate ?? 0 });
          w = vp.width || 595;
          h = vp.height || 842;
        }

        try {
          p.cleanup?.();
        } catch {}

        return { w, h };
      });

      if (!signal.aborted) {
        onBatch(from, sizes);
      }
    } catch (err) {
      if (signal.aborted) return;
      console.warn(`[page-sizes] Sayfa ${from}..${to} boyutları okunamadı:`, err);
    }

    if (to < n) {
      await idle(signal);
    }
  }
}
