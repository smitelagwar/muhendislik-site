import { test } from "./helpers/test";
import { assertServerMode, recordAndGate } from "./helpers/budgets";
import { wheelScroll } from "./helpers/gestures";
import { samplerStart, samplerStop } from "./helpers/sampler";
import { openPdf, waitSharp, type Fixture } from "./helpers/viewer";

/** S14 — Küçük resim paneli açıkken hızlı kaydırma (D15). */
const FIXTURES: Fixture[] = ["metin-1000"];

test.beforeAll(assertServerMode);

for (const fx of FIXTURES) {
  test(`S14 küçük resimler ile kaydırma — ${fx}`, async ({ page, profile }, testInfo) => {
    await openPdf(page, fx);
    await waitSharp(page);

    const toggleBtn = page.locator('[data-testid="pdf-outline-toggle-btn"]').first();
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await page.waitForTimeout(300);
    }

    const vp = page.viewportSize()!;
    await samplerStart(page);
    await wheelScroll(page, Math.round(vp.width / 2), Math.round(vp.height / 2), 900, 40, 16);
    const s = await samplerStop(page);

    recordAndGate(testInfo, "S14", profile, fx, {
      gapP95Ms: s.gapP95Ms,
      gapMaxMs: s.gapMaxMs,
    });
  });
}
