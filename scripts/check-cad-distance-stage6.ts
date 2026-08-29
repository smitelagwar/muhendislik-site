import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  CAD_DISTANCE_ARM_SLOP_PX,
  CAD_DISTANCE_LONG_PRESS_MS,
  CAD_DISTANCE_SNAP_TOLERANCE_PX,
  CadPressHoldDistanceMachine,
  type CadDistanceResolvedPoint,
} from "../src/lib/dokumantasyon/cad-upstream/distance-measurement";

function resolved(
  x: number,
  y: number,
  mode: "endpoint" | "midpoint" | "nearest" = "endpoint"
): CadDistanceResolvedPoint {
  return {
    point: { x, y },
    snap: {
      mode,
      point: { x, y },
      distancePx: 2,
      primitiveIds: ["fixture"],
    },
  };
}

assert.equal(CAD_DISTANCE_LONG_PRESS_MS, 500);
assert.equal(CAD_DISTANCE_ARM_SLOP_PX, 8);
assert.equal(CAD_DISTANCE_SNAP_TOLERANCE_PX, 18);

const machine = new CadPressHoldDistanceMachine();
assert.equal(machine.start().phase, "awaiting-first");

assert.equal(machine.pointerDown(1), true);
assert.equal(machine.snapshot().phase, "pressing-first");
const quickTap = machine.pointerUp(1, null);
assert.equal(quickTap?.snapshot.phase, "awaiting-first");
assert.equal(quickTap?.snapshot.firstPoint, null, "Kısa dokunma nokta commit etmemeli.");

assert.equal(machine.pointerDown(2), true);
assert.equal(machine.activateHold(2, resolved(10, 20))?.phase, "tracking-first");
assert.equal(machine.move(2, resolved(12, 20, "nearest"))?.previewPoint?.x, 12);
const firstCommit = machine.pointerUp(2, resolved(10, 20));
assert.equal(firstCommit?.snapshot.phase, "awaiting-second");
assert.deepEqual(firstCommit?.snapshot.firstPoint, { x: 10, y: 20 });
assert.equal(firstCommit?.result, null);

assert.equal(machine.pointerDown(3), true);
assert.equal(machine.snapshot().phase, "pressing-second");
const cancelledSecond = machine.cancelPointer(3);
assert.equal(cancelledSecond.phase, "awaiting-second");
assert.deepEqual(
  cancelledSecond.firstPoint,
  { x: 10, y: 20 },
  "İkinci parmak/pointercancel ilk commit edilen noktayı kaybetmemeli."
);

assert.equal(machine.pointerDown(4), true);
assert.equal(machine.activateHold(4, resolved(13, 24, "midpoint"))?.phase, "tracking-second");
const live = machine.move(4, resolved(16, 28));
assert.equal(live?.distance, 10, "Rubber-band mesafesi canlı hesaplanmalı.");
const complete = machine.pointerUp(4, resolved(16, 28));
assert.equal(complete?.snapshot.phase, "complete");
assert.deepEqual(complete?.result?.start, { x: 10, y: 20 });
assert.deepEqual(complete?.result?.end, { x: 16, y: 28 });
assert.equal(complete?.result?.distance, 10);

assert.equal(machine.start().phase, "awaiting-first", "Yeni ölçüm temiz başlamalı.");
assert.equal(machine.cancelMeasurement().phase, "inactive");

const adapterSource = readFileSync(
  "src/lib/dokumantasyon/cad-upstream/adapter.ts",
  "utf8"
);
const viewerSource = readFileSync(
  "src/components/dokumantasyon/preview/cad-upstream-viewer.tsx",
  "utf8"
);
const overlaySource = readFileSync(
  "src/components/dokumantasyon/preview/cad-distance-overlay.tsx",
  "utf8"
);
const runtimeSource = readFileSync(
  "src/lib/dokumantasyon/cad-upstream/distance-measurement.ts",
  "utf8"
);

for (const token of [
  "buildCadSnapPrimitives",
  "CadSnapEngine",
  "startDistanceMeasurement",
  "updateDistanceMeasurementSnapModes",
  "resolveDistancePoint",
  "worldUnitsPerPixel",
  "handleMultiTouchStart",
  "subscribeViewChanged",
]) {
  assert.ok(adapterSource.includes(token), `Adapter Stage 6 tokenı eksik: ${token}`);
}
assert.equal(
  adapterSource.includes('executeCommandString("measuredistance")'),
  false,
  "Mesafe ölçümü native measuredistance komutuna geri düşmemeli."
);

for (const token of [
  "getEnabledCadSnapModes",
  "CadDistanceOverlay",
  "data-cad-distance-phase",
  "onSnapshot",
  "onComplete",
  "projectWorldPoint",
]) {
  assert.ok(viewerSource.includes(token), `Viewer Stage 6 tokenı eksik: ${token}`);
}

for (const token of [
  "data-cad-distance-rubber-band",
  "cad-distance-status",
  "previewSnap",
]) {
  assert.ok(overlaySource.includes(token), `Overlay Stage 6 tokenı eksik: ${token}`);
}

for (const token of [
  "pointerdown",
  "pointermove",
  "pointerup",
  "pointercancel",
  "lostpointercapture",
  "contextmenu",
  "CAD_DISTANCE_LONG_PRESS_MS",
  "CAD_DISTANCE_ARM_SLOP_PX",
]) {
  assert.ok(runtimeSource.includes(token), `Gesture state tokenı eksik: ${token}`);
}

const vercelConfig = JSON.parse(readFileSync("vercel.json", "utf8")) as {
  git?: { deploymentEnabled?: unknown };
};
assert.equal(
  vercelConfig.git?.deploymentEnabled,
  false,
  "Stage 6 push/PR Vercel deployment tetiklememeli."
);

console.log(
  "GATE: PASS — Stage 6 press-hold distance measurement commits two snapped points, preserves pinch isolation and renders live rubber-band distance."
);
