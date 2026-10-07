import { test } from "./helpers/test";
import { assertServerMode, recordAndGate } from "./helpers/budgets";
import { keyZoom } from "./helpers/gestures";
import { samplerStart, samplerStop } from "./helpers/sampler";
import { canvasStats, openPdf, readZoomPercent, sharpRatio, waitSharp, type Fixture } from "./helpers/viewer";

/** S7 — Büyük format (A0 pafta, A3 tarama): her zoom düzeyinde canvas ≤16 MP, bellek sınırlı, keskin. */
const FIXTURES: Fixture[] = ["a0-vektor", "tarama-a3"];

test.beforeAll(assertServerMode);

for (const fx of FIXTURES) {
  test(`S7 büyük format — ${fx}`, async ({ page, profile }, testInfo) => {
    await openPdf(page, fx);
    await waitSharp(page);
    const levels: { zoom: number; sharpMs: number; ratio: number; mp: number; mb: number }[] = [];
    let maxMP = 0, maxMB = 0, worstRatio = 10, worstSharpMs = 0;

    await samplerStart(page);
    let prev = -1;
    for (let i = 0; i < 14; i++) {
      const zoom = await readZoomPercent(page);
      if (zoom === prev) break; // üst sınıra ulaşıldı
      prev = zoom;
      const sharpMs = await waitSharp(page, 12_000);
      const ratio = await sharpRatio(page);
      const cv = await canvasStats(page);
      levels.push({ zoom, sharpMs, ratio, mp: cv.maxMP, mb: cv.bytesMB });
      maxMP = Math.max(maxMP, cv.maxMP); maxMB = Math.max(maxMB, cv.bytesMB);
      worstRatio = Math.min(worstRatio, ratio); worstSharpMs = Math.max(worstSharpMs, sharpMs);
      await keyZoom(page, "in", 1, 100);
    }
    const s = await samplerStop(page);
    await testInfo.attach("levels.json", { body: JSON.stringify(levels, null, 2), contentType: "application/json" });

    recordAndGate(testInfo, "S7", profile, fx, {
      canvasMaxMP: maxMP,
      canvasBytesMB: maxMB,
      sharpRatio: worstRatio,
      sharpMs: worstSharpMs,
      blankFrames: s.blankFrames,
      maxZoomPercent: prev,
      levels: JSON.stringify(levels),
    });
  });
}
