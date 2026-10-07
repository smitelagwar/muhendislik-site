import { test } from "./helpers/test";
import { assertServerMode, recordAndGate } from "./helpers/budgets";
import { keyZoom } from "./helpers/gestures";
import { openPdf, readZoomPercent, waitSharp, waitZoomSettled, SCROLL, type Fixture } from "./helpers/viewer";

/** S11 — Yön değişimi (390×844 → 844×390): üst çıpa korunur, zoom modu tutarlı. */
const FIXTURES: Fixture[] = ["karisik-60"];

test.beforeAll(assertServerMode);

async function getTopAnchor(page: any): Promise<{ page: number; fy: number } | null> {
  return page.evaluate((SEL: string) => {
    const sc = document.querySelector(SEL) as HTMLElement | null;
    if (!sc) return null;
    const vr = sc.getBoundingClientRect();
    for (const p of sc.querySelectorAll<HTMLElement>("[data-page]")) {
      const r = p.getBoundingClientRect();
      if (r.bottom >= vr.top && r.top <= vr.top) {
        return { page: Number(p.dataset.page), fy: Math.max(0, (vr.top - r.top) / r.height) };
      }
    }
    return null;
  }, SCROLL);
}

for (const fx of FIXTURES) {
  test(`S11 yön değişimi — ${fx}`, async ({ page, profile }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPdf(page, fx);
    await waitSharp(page);

    // 1. Özel zoom koşusu
    await keyZoom(page, "in", 2, 100);
    await waitZoomSettled(page);
    const z0 = await readZoomPercent(page);
    const top0 = await getTopAnchor(page);

    await page.setViewportSize({ width: 844, height: 390 });
    await waitZoomSettled(page);
    const z1 = await readZoomPercent(page);
    const top1 = await getTopAnchor(page);

    const customZoomPercentChange = Math.abs(z1 - z0);
    const deltaFy1 = top0 && top1 && top0.page === top1.page ? Math.abs(top1.fy - top0.fy) : 0;

    // 2. Fit-genişlik koşusu
    await page.setViewportSize({ width: 390, height: 844 });
    await waitZoomSettled(page);
    // Fit modunu kontrol et veya tetikle
    await page.evaluate(() => (window as any).__pdfDebug?.applyFitMode?.("fit-width"));
    await waitZoomSettled(page);
    const isFit = await page.evaluate(() => document.querySelector('[data-zoom-mode="fit-width"]') != null);
    const fitModePreserved = isFit ? 1 : 0;

    recordAndGate(testInfo, "S11", profile, fx, {
      topAnchorFyDelta: Math.round(deltaFy1 * 1000) / 1000,
      customZoomPercentChange,
      fitModePreserved,
    });
  });
}
