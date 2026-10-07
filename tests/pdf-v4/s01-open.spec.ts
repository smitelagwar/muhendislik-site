import { test } from "./helpers/test";
import { assertServerMode, recordAndGate } from "./helpers/budgets";
import { canvasStats, longTasksSinceNavigation, openPdf, viewInfo, waitSharp, type Fixture } from "./helpers/viewer";

/** S1 — Açılış: belge sayfanın BAŞINDA açılır (D3), hızlı ve keskin. */
const FIXTURES: Fixture[] = ["tr-metin", "karisik-60", "metin-1000", "a0-vektor", "tarama-a3"];

test.beforeAll(assertServerMode);

for (const fx of FIXTURES) {
  test(`S1 açılış — ${fx}`, async ({ page, profile }, testInfo) => {
    const { ttfrMs } = await openPdf(page, fx);
    const sharpMs = await waitSharp(page);
    const info = await viewInfo(page);
    const cv = await canvasStats(page);
    const lt = await longTasksSinceNavigation(page);
    recordAndGate(testInfo, "S1", profile, fx, {
      scrollTopPx: info.scrollTop,
      ttfrMs,
      sharpMs,
      longTaskMs: Math.round(Math.max(0, ...lt)),
      canvasMaxMP: cv.maxMP,
      canvasBytesMB: cv.bytesMB,
      mountedPages: info.mountedPages,
      domNodes: info.domNodes,
    });
  });
}
