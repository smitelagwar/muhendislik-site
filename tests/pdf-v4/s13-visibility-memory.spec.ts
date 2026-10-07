import { test } from "./helpers/test";
import { assertServerMode, recordAndGate } from "./helpers/budgets";
import { canvasStats, openPdf, waitSharp, type Fixture } from "./helpers/viewer";

/** S13 — Sekme gizlenince (visibilitychange) canvas belleği düşer. */
const FIXTURES: Fixture[] = ["karisik-60"];

test.beforeAll(assertServerMode);

for (const fx of FIXTURES) {
  test(`S13 sekme gizlenince bellek — ${fx}`, async ({ page, profile }, testInfo) => {
    await openPdf(page, fx);
    await waitSharp(page);

    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: true, writable: true, configurable: true });
      Object.defineProperty(document, "visibilityState", { value: "hidden", writable: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await page.waitForTimeout(1500);
    const cv = await canvasStats(page);

    recordAndGate(testInfo, "S13", profile, fx, {
      canvasBytesMBHidden: cv.bytesMB,
    });
  });
}
