import { test } from "./helpers/test";
import { assertServerMode, recordAndGate } from "./helpers/budgets";
import { wheelScroll } from "./helpers/gestures";
import { samplerStart, samplerStop } from "./helpers/sampler";
import { openPdf, viewInfo, waitNoBlank, waitSharp, type Fixture } from "./helpers/viewer";

/** S4 — Hızlı kaydırma: akıcı kare süresi, durunca kısa sürede içerik, sınırlı mount sayısı. */
const FIXTURES: Fixture[] = ["metin-1000", "karisik-60"];

test.beforeAll(assertServerMode);

for (const fx of FIXTURES) {
  test(`S4 hızlı kaydırma — ${fx}`, async ({ page, profile }, testInfo) => {
    await openPdf(page, fx);
    await waitSharp(page);
    const vp = page.viewportSize()!;
    await samplerStart(page);
    await wheelScroll(page, Math.round(vp.width / 2), Math.round(vp.height / 2), 900, 40, 16);
    const blankSettleMs = await waitNoBlank(page, 8000);
    const s = await samplerStop(page);
    const info = await viewInfo(page);
    recordAndGate(testInfo, "S4", profile, fx, {
      gapP95Ms: s.gapP95Ms,
      gapMaxMs: s.gapMaxMs,
      jank50: s.jank50,
      longTaskMs: s.longTaskMs,
      blankSettleMs,
      blankFramesDuringScroll: s.blankFrames, // bilgi: kaydırırken boş kare serbest, durunca bütçe
      mountedPages: info.mountedPages,
      domNodes: info.domNodes,
    });
  });
}
