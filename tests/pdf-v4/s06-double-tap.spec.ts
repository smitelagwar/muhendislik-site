import { test } from "./helpers/test";
import { assertServerMode, recordAndGate } from "./helpers/budgets";
import { doubleTap } from "./helpers/gestures";
import { samplerStart, samplerStop } from "./helpers/sampler";
import { anchorAt, anchorDrift, openPdf, viewInfo, waitSharp, waitZoomSettled, type Fixture } from "./helpers/viewer";

/** S6 — Çift dokunma yakınlaştır, tekrar çift dokunma fit'e dön. */
const FIXTURES: Fixture[] = ["tr-metin"];

test.beforeAll(assertServerMode);

for (const fx of FIXTURES) {
  test(`S6 çift dokunma — ${fx}`, async ({ page, profile }, testInfo) => {
    await openPdf(page, fx);
    await waitSharp(page);
    const cx = 195, cy = 420;
    const before = await viewInfo(page);
    const anchor = await anchorAt(page, cx, cy);
    const initW = before.widths[anchor.page] ?? 1;

    await samplerStart(page);
    await doubleTap(page, cx, cy);
    await waitZoomSettled(page);
    const drift = await anchorDrift(page, anchor, cx, cy);

    await doubleTap(page, cx, cy);
    await waitZoomSettled(page);
    const s = await samplerStop(page);

    const after = await viewInfo(page);
    const finalW = after.widths[anchor.page] ?? 0;
    const fitReturnErrorPx = Math.abs(finalW - initW);

    recordAndGate(testInfo, "S6", profile, fx, {
      anchorDriftPx: drift,
      blankFrames: s.blankFrames,
      fitReturnErrorPx,
    });
  });
}
