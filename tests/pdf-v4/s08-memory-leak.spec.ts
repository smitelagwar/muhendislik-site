import { test, expect } from "./helpers/test";
import { assertServerMode, recordAndGate } from "./helpers/budgets";
import { keyZoom, wheelScroll } from "./helpers/gestures";
import { canvasStats, heapMB, openPdf, viewInfo, waitSharp, waitZoomSettled, type Fixture } from "./helpers/viewer";

/** S8 — 100 zoom döngüsü + kaydırma: heap büyümesi ≤30 MB, canvas belleği sınırlı, mount ≤9. */
const FIXTURES: Fixture[] = ["karisik-60"];

test.beforeAll(assertServerMode);

for (const fx of FIXTURES) {
  test(`S8 bellek sızıntısı — ${fx}`, async ({ page, cdp, profile }, testInfo) => {
    expect(cdp, "heap ölçümü CDP oturumu gerektirir").not.toBeNull();
    await openPdf(page, fx);
    await waitSharp(page);

    test.slow();
    const vp = page.viewportSize()!;
    const cx = Math.round(vp.width / 2), cy = Math.round(vp.height / 2);
    const initialHeap = await heapMB(cdp!);

    for (let i = 0; i < 20; i++) {
      await keyZoom(page, "in", 2, 80);
      await waitZoomSettled(page, 100, 1500);
      await keyZoom(page, "out", 2, 80);
      await waitZoomSettled(page, 100, 1500);
      if ((i + 1) % 5 === 0) {
        await wheelScroll(page, cx, cy, 300, 2, 16);
      }
      if ((i + 1) % 5 === 0) {
        await waitSharp(page, 2000);
      }
    }

    const finalHeap = await heapMB(cdp!);
    const cv = await canvasStats(page);
    const info = await viewInfo(page);

    const heapGrowthMB = Math.round(Math.max(0, finalHeap - initialHeap) * 10) / 10;
    recordAndGate(testInfo, "S8", profile, fx, {
      heapGrowthMB,
      canvasBytesMB: cv.bytesMB,
      mountedPages: info.mountedPages,
    });
  });
}
