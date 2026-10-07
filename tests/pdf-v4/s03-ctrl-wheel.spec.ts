import { test } from "./helpers/test";
import { assertServerMode, recordAndGate } from "./helpers/budgets";
import { ctrlWheel } from "./helpers/gestures";
import { samplerStart, samplerStop } from "./helpers/sampler";
import { anchorAt, anchorDrift, openPdf, scrollToFraction, viewInfo, waitSharp, waitZoomSettled, type Fixture } from "./helpers/viewer";

/** S3 — Ctrl+tekerlek: trackpad pinch (küçük deltalı) ve fare çentiği (±100). */
const FIXTURES: Fixture[] = ["karisik-60"];

test.beforeAll(assertServerMode);

for (const fx of FIXTURES) {
  test(`S3 ctrl-wheel — ${fx}`, async ({ page, profile }, testInfo) => {
    await openPdf(page, fx);
    await waitSharp(page);
    await scrollToFraction(page, 0.2);
    await waitSharp(page);
    const vp = page.viewportSize()!;
    const cx = Math.round(vp.width / 2), cy = Math.round(vp.height / 2);
    const anchor = await anchorAt(page, cx, cy);

    await samplerStart(page);
    await ctrlWheel(page, cx, cy, Array(40).fill(-1.7), 16);
    await waitZoomSettled(page);
    const driftTrackpad = await anchorDrift(page, anchor, cx, cy);
    const w1 = (await viewInfo(page)).widths[anchor.page] ?? 1;

    await ctrlWheel(page, cx, cy, [-100], 16);
    await waitZoomSettled(page);
    const w2 = (await viewInfo(page)).widths[anchor.page] ?? 1;
    const driftNotch = await anchorDrift(page, anchor, cx, cy);
    const s = await samplerStop(page);

    const notchFactor = Math.round((w2 / w1) * 1000) / 1000;
    recordAndGate(testInfo, "S3", profile, fx, {
      blankFrames: s.blankFrames,
      gapP95Ms: s.gapP95Ms,
      anchorDriftPx: Math.max(driftTrackpad, driftNotch),
      notchFactor,
    });
  });
}
