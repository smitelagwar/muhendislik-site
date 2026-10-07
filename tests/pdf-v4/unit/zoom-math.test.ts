import assert from "node:assert/strict";
import {
  isWheelNotch,
  wheelZoomFactor,
  WHEEL_NOTCH_FACTOR,
} from "../../../src/lib/dokumantasyon/studio/pdf/pdf-zoom-math";

// Plan 04 A1 Birim Testleri:
// isWheelNotch({deltaY:100,deltaMode:0}) true, {deltaY:3.5} false
assert.equal(isWheelNotch({ deltaY: 100, deltaMode: 0 }), true);
assert.equal(isWheelNotch({ deltaY: -100, deltaMode: 0 }), true);
assert.equal(isWheelNotch({ deltaY: 3.5, deltaMode: 0 }), false);
assert.equal(isWheelNotch({ deltaY: -3, deltaMode: 1 }), true);

// {deltaY:100} -> faktör 1 / 1.1; {deltaY:-100} -> 1.1; {deltaY:-3, deltaMode:1} -> 1.1
const notchIn = wheelZoomFactor({ deltaY: -100, deltaMode: 0 });
assert.ok(Math.abs(notchIn - WHEEL_NOTCH_FACTOR) < 1e-6);

const notchOut = wheelZoomFactor({ deltaY: 100, deltaMode: 0 });
assert.ok(Math.abs(notchOut - (1 / WHEEL_NOTCH_FACTOR)) < 1e-6);

const lineIn = wheelZoomFactor({ deltaY: -3, deltaMode: 1 });
assert.ok(Math.abs(lineIn - WHEEL_NOTCH_FACTOR) < 1e-6);

// Trackpad pinch (küçük sürekli değer):
const trackpadIn = wheelZoomFactor({ deltaY: -1.7, deltaMode: 0 });
assert.ok(trackpadIn > 1.01 && trackpadIn < 1.03);

console.log("zoom-math: birim testleri (isWheelNotch, wheelZoomFactor) başarıyla geçti");
