import assert from "node:assert/strict";
import { resolveAnchor } from "../../../src/lib/dokumantasyon/studio/pdf/engine/input-controller";
import { isWheelNotch, wheelZoomFactor } from "../../../src/lib/dokumantasyon/studio/pdf/pdf-zoom-math";
import { rubber } from "../../../src/lib/dokumantasyon/studio/pdf/engine/rubber";
import { computeLayout } from "../../../src/lib/dokumantasyon/studio/pdf/engine/layout";
import type { PdfEngine } from "../../../src/lib/dokumantasyon/studio/pdf/engine/engine";

// 1. Mock Scroller ve PdfEngine
const mockScroller = {
  scrollLeft: 0,
  scrollTop: 0,
  clientWidth: 1000,
  clientHeight: 800,
  getBoundingClientRect() {
    return { left: 100, top: 50, width: 1000, height: 800, right: 1100, bottom: 850 };
  },
};

const mockLayout = computeLayout({
  sizes: [{ w: 595, h: 842 }],
  scale: 1.0,
  gap: 16,
  padding: 24,
  viewportW: 1000,
});

const mockEngine = {
  scroller: mockScroller,
  getLayout: () => mockLayout,
} as unknown as PdfEngine;

// Test A: pointer anchor: vx = x - rect.left, vy = y - rect.top
const pAnchor = resolveAnchor(mockEngine, { kind: "pointer", x: 300, y: 250 });
assert.equal(pAnchor.vx, 300 - 100);
assert.equal(pAnchor.vy, 250 - 50);

// Test B: belge başında (scrollTop <= 1) viewport anchor: vy = 0 (üst çıpa)
mockScroller.scrollTop = 0;
const topAnchor = resolveAnchor(mockEngine, { kind: "viewport" });
assert.equal(topAnchor.vx, 500);
assert.equal(topAnchor.vy, 0);

// Test C: fit komutu her zaman üst çıpa: vy = 0
mockScroller.scrollTop = 500;
const fitAnchor = resolveAnchor(mockEngine, { kind: "fit" });
assert.equal(fitAnchor.vx, 500);
assert.equal(fitAnchor.vy, 0);

// Test D: belge ortasında (scrollTop > 1) viewport anchor: vy = height / 2 (merkez çıpa)
mockScroller.scrollTop = 500;
const centerAnchor = resolveAnchor(mockEngine, { kind: "viewport" });
assert.equal(centerAnchor.vx, 500);
assert.equal(centerAnchor.vy, 400);

// 2. Wheel Math Testleri
const notchEvent = { deltaY: 100, deltaMode: 0 } as WheelEvent;
const trackpadEvent = { deltaY: 1.7, deltaMode: 0 } as WheelEvent;

assert.equal(isWheelNotch(notchEvent), true);
assert.equal(isWheelNotch(trackpadEvent), false);

const fNotch = wheelZoomFactor(notchEvent);
assert.ok(Math.abs(fNotch - 1 / 1.1) < 0.05, `fNotch=${fNotch} ~ 0.909 olmalı`);

const fTrack = wheelZoomFactor(trackpadEvent);
assert.ok(fTrack < 1.0 && fTrack > 0.95, `fTrack=${fTrack} küçük oran olmalı`);

// 3. Rubber Math Testleri
assert.equal(rubber(1.5, 0.5, 3.0), 1.5);
assert.ok(rubber(4.0, 0.5, 3.0) > 3.0);
assert.ok(rubber(4.0, 0.5, 3.0) < 3.0 * Math.exp(0.2) + 1e-6);

console.log("input-math: birim testleri (resolveAnchor, isWheelNotch, wheelZoomFactor, rubber) başarıyla geçti");
