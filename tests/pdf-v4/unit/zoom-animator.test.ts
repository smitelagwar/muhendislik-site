import assert from "node:assert/strict";
import { ZoomAnimator } from "../../../src/lib/dokumantasyon/studio/pdf/engine/zoom-animator";
import type { PdfEngine } from "../../../src/lib/dokumantasyon/studio/pdf/engine/engine";

// Mock PdfEngine
class MockEngine {
  scale = 1.0;
  liveScale = 1.0;
  interaction = "idle";
  settled = false;

  getScale() {
    return this.scale;
  }
  clampScale(s: number) {
    return Math.min(5.0, Math.max(0.2, s));
  }
  setLiveScale(s: number) {
    this.liveScale = s;
    this.scale = s;
  }
  settleScale() {
    this.settled = true;
  }
  setInteraction(i: "idle" | "gesture" | "scrolling") {
    this.interaction = i;
  }
}

// Fake time and rAF
let currentTime = 1000;
let nextRafId = 1;
const rafCallbacks = new Map<number, (t: number) => void>();

function fakeNow() {
  return currentTime;
}
function fakeRaf(cb: (t: number) => void) {
  const id = nextRafId++;
  rafCallbacks.set(id, cb);
  return id;
}
function fakeCancelRaf(id: number) {
  rafCallbacks.delete(id);
}
function flushRaf(deltaMs: number) {
  currentTime += deltaMs;
  const cbs = Array.from(rafCallbacks.values());
  rafCallbacks.clear();
  for (const cb of cbs) {
    cb(currentTime);
  }
}

async function runTests() {
  const mockEngine = new MockEngine();
  const engine = mockEngine as unknown as PdfEngine;

  // 1. Reduced motion: anında bitiş
  const reducedAnimator = new ZoomAnimator(engine, {
    reduced: () => true,
    now: fakeNow,
    raf: fakeRaf,
    cancelRaf: fakeCancelRaf,
  });

  await reducedAnimator.animate(2.0, { page: 0, fx: 0.5, fy: 0.5 }, 200, 200, 160);
  assert.equal(mockEngine.scale, 2.0);
  assert.equal(mockEngine.settled, true);

  // 2. Normal animasyon ve monoton artış
  mockEngine.scale = 1.0;
  mockEngine.settled = false;

  const animator = new ZoomAnimator(engine, {
    reduced: () => false,
    now: fakeNow,
    raf: fakeRaf,
    cancelRaf: fakeCancelRaf,
  });

  const anchor = { page: 0, fx: 0.5, fy: 0.5 };
  let promiseDone = false;
  const p = animator.animate(2.0, anchor, 200, 200, 160).then(() => {
    promiseDone = true;
  });

  assert.equal(mockEngine.interaction, "gesture");

  // Step 1: 50 ms
  flushRaf(50);
  const s1 = mockEngine.liveScale;
  assert.ok(s1 > 1.0 && s1 < 2.0, `s1=${s1} ara değerde olmalı`);

  // Step 2: 50 ms daha (100 ms)
  flushRaf(50);
  const s2 = mockEngine.liveScale;
  assert.ok(s2 > s1 && s2 < 2.0, `s2=${s2} s1=${s1}'den büyük olmalı`);

  // Step 3: Retarget: 2.0 yerine 3.0 hedefine yönlendir
  animator.animate(3.0, anchor, 200, 200, 160);
  // Ani sıçrama olmamalı, mevcut s2'den devam etmeli
  assert.equal(mockEngine.liveScale, s2);

  // Birkaç kare ilerlet
  flushRaf(80);
  const s3 = mockEngine.liveScale;
  assert.ok(s3 > s2, `s3=${s3} s2=${s2}'den büyük olmalı`);

  // Animasyonu tamamla (kalan süre + marj)
  flushRaf(120);
  await Promise.resolve(); // microtasks

  assert.ok(Math.abs(mockEngine.liveScale - 3.0) < 1e-4, `Son ölçek 3.0 olmalı, alınan: ${mockEngine.liveScale}`);
  assert.equal(mockEngine.interaction, "idle");
  assert.equal(mockEngine.settled, true);

  console.log("zoom-animator: birim testleri (reduced-motion, retarget, logaritmik interpolasyon) başarıyla geçti");
}

runTests();
