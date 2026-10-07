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
    const vp = page.viewportSize()!;
    const cx = Math.round(vp.width / 2), cy = Math.round(vp.height / 2);
    await page.mouse.move(cx, cy);
    const anchor = await anchorAt(page, cx, cy);

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
