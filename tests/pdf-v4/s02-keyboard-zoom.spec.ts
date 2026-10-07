import { test } from "./helpers/test";
import { assertServerMode, recordAndGate } from "./helpers/budgets";
import { keyZoom } from "./helpers/gestures";
import { samplerStart, samplerStop } from "./helpers/sampler";
import { anchorAt, anchorDrift, openPdf, scrollToFraction, waitSharp, waitZoomSettled, type Fixture } from "./helpers/viewer";

/** S2 — Klavye zoom (Ctrl +/-): beyaz kare yok, takılma yok, merkez çıpası sabit, kısa sürede keskin. */
const FIXTURES: Fixture[] = ["karisik-60", "metin-1000"];

test.beforeAll(assertServerMode);

for (const fx of FIXTURES) {
  test(`S2 klavye zoom — ${fx}`, async ({ page, profile }, testInfo) => {
    await openPdf(page, fx);
    await waitSharp(page);
    await scrollToFraction(page, 0.2); // belge kenarından uzak: kenar kırpması çıpayı bozmasın
    await waitSharp(page);
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
    const anchor = { page: pt.page, fx: pt.fx, fy: pt.fy };
    await page.mouse.move(cx, cy);

    await samplerStart(page);
    const drifts: number[] = [];
    // Her fazdan sonra yerleşmeyi BEKLE: komutlar kuyruğa girer, ölçüm yarım animasyonda yapılmasın.
    for (const [dir, n] of [["in", 3], ["out", 6], ["in", 3]] as const) {
      await keyZoom(page, dir, n, 150);
      await waitZoomSettled(page);
      drifts.push(await anchorDrift(page, anchor, cx, cy));
    }
    const s = await samplerStop(page);
    const sharpMs = await waitSharp(page);

    recordAndGate(testInfo, "S2", profile, fx, {
      blankFrames: s.blankFrames,
      longTaskMs: s.longTaskMs,
      gapMaxMs: s.gapMaxMs,
      gapP95Ms: s.gapP95Ms,
      jank50: s.jank50,
      anchorDriftPx: Math.max(...drifts),
      sharpMs,
    });
  });
}
