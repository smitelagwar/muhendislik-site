import assert from "node:assert/strict";
import {
  clampImageCamera,
  computeImageFitScale,
  getImageViewerScaleLimits,
  getImageDisplaySize,
  getImagePointerDistance,
  getImagePointerMidpoint,
  zoomImageCameraBetweenPoints,
  type ImageViewerCamera,
} from "../src/components/dokumantasyon/preview/image-viewer-geometry";

function close(actual: number, expected: number, tolerance = 1e-6) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${actual} to be within ${tolerance} of ${expected}`
  );
}

const first = { x: 10, y: 20 };
const second = { x: 40, y: 60 };
close(getImagePointerDistance(first, second), 50);
assert.deepEqual(getImagePointerMidpoint(first, second), { x: 25, y: 40 });

const portrait = { width: 4344, height: 5792 };
const mobileViewport = { width: 390, height: 700 };
const fit0 = computeImageFitScale(mobileViewport, portrait, 0, 32);
close(fit0, 0.082, 0.001);
const portraitLimits = getImageViewerScaleLimits(fit0);
close(portraitLimits.minScale, fit0);
close(portraitLimits.maxScale, Math.min(5, fit0 * 8));

const fit90 = computeImageFitScale(mobileViewport, portrait, 90, 32);
close(fit90, 0.062, 0.001);

assert.deepEqual(getImageDisplaySize({ width: 1600, height: 900 }, 0.5, 90), {
  width: 450,
  height: 800,
});

const clamped = clampImageCamera(
  { scale: 0.1, offsetX: 100, offsetY: -100 },
  { width: 390, height: 700 },
  portrait,
  0
);
close(clamped.scale, 0.1);
close(clamped.offsetX, 22.2);
close(clamped.offsetY, 0);

const fitClamped = clampImageCamera(
  { scale: fit0 / 2, offsetX: 0, offsetY: 0 },
  mobileViewport,
  portrait,
  0,
  portraitLimits
);
close(fitClamped.scale, fit0);

const maxZoomClamped = clampImageCamera(
  { scale: portraitLimits.maxScale * 2, offsetX: 0, offsetY: 0 },
  mobileViewport,
  portrait,
  0,
  portraitLimits
);
close(maxZoomClamped.scale, portraitLimits.maxScale);

const viewport = { width: 390, height: 700 };
const natural = { width: 1600, height: 2400 };
const startCamera: ImageViewerCamera = {
  scale: 0.25,
  offsetX: 0,
  offsetY: 0,
};
const anchor = { x: 230, y: 310 };

const zoomed = zoomImageCameraBetweenPoints(
  startCamera,
  0.5,
  anchor,
  anchor,
  viewport,
  natural,
  0,
  getImageViewerScaleLimits(startCamera.scale)
);

const beforeVector = {
  x: (anchor.x - viewport.width / 2 - startCamera.offsetX) / startCamera.scale,
  y: (anchor.y - viewport.height / 2 - startCamera.offsetY) / startCamera.scale,
};
const afterVector = {
  x: (anchor.x - viewport.width / 2 - zoomed.offsetX) / zoomed.scale,
  y: (anchor.y - viewport.height / 2 - zoomed.offsetY) / zoomed.scale,
};
close(afterVector.x, beforeVector.x);
close(afterVector.y, beforeVector.y);

const movedTarget = { x: 250, y: 335 };
const pinchAndPan = zoomImageCameraBetweenPoints(
  startCamera,
  0.5,
  anchor,
  movedTarget,
  viewport,
  natural,
  0,
  getImageViewerScaleLimits(startCamera.scale)
);
const movedVector = {
  x:
    (movedTarget.x - viewport.width / 2 - pinchAndPan.offsetX) /
    pinchAndPan.scale,
  y:
    (movedTarget.y - viewport.height / 2 - pinchAndPan.offsetY) /
    pinchAndPan.scale,
};
close(movedVector.x, beforeVector.x);
close(movedVector.y, beforeVector.y);

const belowFit = zoomImageCameraBetweenPoints(
  startCamera,
  startCamera.scale / 2,
  anchor,
  anchor,
  viewport,
  natural,
  0,
  getImageViewerScaleLimits(startCamera.scale)
);
close(belowFit.scale, startCamera.scale);

const invalidFit = computeImageFitScale(
  { width: 0, height: 0 },
  { width: 0, height: Number.NaN },
  0,
  64
);
assert.ok(Number.isFinite(invalidFit));

const invalidCamera = clampImageCamera(
  { scale: Number.NaN, offsetX: Number.NaN, offsetY: Number.POSITIVE_INFINITY },
  viewport,
  natural,
  0
);
assert.ok(Number.isFinite(invalidCamera.scale));
assert.ok(Number.isFinite(invalidCamera.offsetX));
assert.ok(Number.isFinite(invalidCamera.offsetY));

console.log("✅ Image viewer geometry tests passed.");
