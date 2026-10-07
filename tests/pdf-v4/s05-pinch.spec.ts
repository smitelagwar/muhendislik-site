import { test, expect } from "./helpers/test";
import { assertServerMode, recordAndGate } from "./helpers/budgets";
import { pinch } from "./helpers/gestures";
import { samplerStart, samplerStop } from "./helpers/sampler";
import { anchorAt, anchorDrift, browserZoom, openPdf, scrollToFraction, viewInfo, waitSharp, type Fixture } from "./helpers/viewer";

/** S5 — İki parmak pinch (mobil): çıpa sabit, tarayıcı zoom'u değişmez, ölçek oranı parmak oranını izler. */
const FIXTURES: Fixture[] = ["tr-metin", "karisik-60", "metin-1000"];
const CASES = [
  { name: "out",      d0: 40,  d1: 150, angle: 0,  dx: 0, dy: 0 },
  { name: "in",       d0: 150, d1: 60,  angle: 0,  dx: 0, dy: 0 },
  { name: "diag-pan", d0: 50,  d1: 140, angle: 30, dx: 0, dy: -60 },
] as const;

test.beforeAll(assertServerMode);

for (const fx of FIXTURES) {
  for (const c of CASES) {
    test(`S5 pinch ${c.name} — ${fx}`, async ({ page, cdp, profile }, testInfo) => {
      expect(cdp, "pinch testi Chromium + CDP ister (webkit projesinde çalıştırma)").not.toBeNull();
      await openPdf(page, fx);
      await waitSharp(page);
      if (fx !== "tr-metin") await scrollToFraction(page, 0.3);
      const pt = await page.evaluate(() => {
        const sc = document.querySelector('[data-testid="pdf-scroll-viewport"]');
        if (!sc) return null;
        const vr = sc.getBoundingClientRect();
        for (const p of sc.querySelectorAll<HTMLElement>("[data-page]")) {
          const r = p.getBoundingClientRect();
          const top = Math.max(r.top, vr.top), bottom = Math.min(r.bottom, vr.bottom);
          const left = Math.max(r.left, vr.left), right = Math.min(r.right, vr.right);
          if (bottom - top > 40 && right - left > 40) {
            const px = Math.round((left + right) / 2);
            const py = Math.round((top + bottom) / 2);
            return {
              page: Number(p.dataset.page),
              fx: (px - r.left) / r.width,
              fy: (py - r.top) / r.height,
              cx: px,
              cy: py,
            };
          }
        }
        return null;
      });
      if (!pt) throw new Error("Görünür sayfa bulunamadı");
      const { cx, cy } = pt;
      const before = await viewInfo(page);
      const a = { page: pt.page, fx: pt.fx, fy: pt.fy };
      const vv0 = await browserZoom(page);

      await samplerStart(page);
      await pinch(page, cdp!, { cx, cy, d0: c.d0, d1: c.d1, angleDeg: c.angle, driftX: c.dx, driftY: c.dy, steps: 18, stepMs: 16 });
      await page.waitForTimeout(250);
      const s = await samplerStop(page);
      const sharpMs = await waitSharp(page);
      const after = await viewInfo(page);

      const expected = c.d1 / c.d0;
      const actual = (after.widths[a.page] ?? 0) / (before.widths[a.page] ?? 1);
      recordAndGate(testInfo, "S5", profile, `${fx}:${c.name}`, {
        blankFrames: s.blankFrames,
        anchorDriftPx: await anchorDrift(page, a, cx + c.dx, cy + c.dy),
        browserZoomDelta: Math.abs((await browserZoom(page)) - vv0),
        scaleRatioError: Math.round(Math.abs(actual / expected - 1) * 1000) / 1000,
        longTaskMs: s.longTaskMs,
        gapMaxMs: s.gapMaxMs,
        sharpMs,
      });
    });
  }
}
