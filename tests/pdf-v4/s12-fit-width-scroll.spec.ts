import { test } from "./helpers/test";
import { assertServerMode, recordAndGate } from "./helpers/budgets";
import { wheelScroll } from "./helpers/gestures";
import { openPdf, readZoomPercent, waitSharp, type Fixture } from "./helpers/viewer";

/** S12 — Fit-genişlik modunda tüm belgeyi kaydır: araç çubuğundaki % hiç değişmez (D6). */
const FIXTURES: Fixture[] = ["karisik-60"];

test.beforeAll(assertServerMode);

for (const fx of FIXTURES) {
  test(`S12 fit-genişlik kaydırma — ${fx}`, async ({ page, profile }, testInfo) => {
    await openPdf(page, fx);
    await waitSharp(page);

    const vp = page.viewportSize()!;
    const cx = Math.round(vp.width / 2), cy = Math.round(vp.height / 2);

    let prevPercent = await readZoomPercent(page);
    let zoomPercentChanges = 0;

    for (let i = 0; i < 40; i++) {
      await wheelScroll(page, cx, cy, 300, 1, 16);
      const current = await readZoomPercent(page);
      if (current !== prevPercent) {
        zoomPercentChanges++;
        prevPercent = current;
      }
    }

    recordAndGate(testInfo, "S12", profile, fx, {
      zoomPercentChanges,
    });
  });
}
