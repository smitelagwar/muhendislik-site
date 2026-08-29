import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";

import {
  CadSnapEngine,
  type CadSnapPrimitive,
} from "../src/lib/dokumantasyon/cad-upstream/snap-engine";
import {
  resolveCadMagnifierCrop,
  resolveCadPrecisionLensPlacement,
} from "../src/lib/dokumantasyon/cad-upstream/precision-ux";

const REBUILD_BUDGET_MS = 3_000;
const QUERY_BUDGET_MS = 2_500;
const PRECISION_HELPER_BUDGET_MS = 1_000;

function buildGridPrimitives(): CadSnapPrimitive[] {
  const primitives: CadSnapPrimitive[] = [];
  let id = 0;
  for (let row = 0; row < 100; row += 1) {
    const y = row * 32;
    for (let column = 0; column < 100; column += 1) {
      const x = column * 32;
      primitives.push({
        kind: "line",
        id: `h-${id++}`,
        a: { x: x - 14, y },
        b: { x: x + 14, y },
      });
      primitives.push({
        kind: "line",
        id: `v-${id++}`,
        a: { x, y: y - 14 },
        b: { x, y: y + 14 },
      });
    }
  }
  return primitives;
}

const primitives = buildGridPrimitives();
const engine = new CadSnapEngine(64);
const rebuildStarted = performance.now();
engine.rebuild(primitives);
const rebuildMs = performance.now() - rebuildStarted;
assert.equal(engine.size, 20_000);
assert.ok(
  rebuildMs < REBUILD_BUDGET_MS,
  `20k snap primitive rebuild bütçeyi aştı: ${rebuildMs.toFixed(1)}ms`
);

let candidateCount = 0;
const queryStarted = performance.now();
for (let index = 0; index < 2_000; index += 1) {
  const column = index % 100;
  const row = Math.floor(index / 100) % 100;
  const candidate = engine.query({
    point: { x: column * 32 + 1.5, y: row * 32 + 1.5 },
    tolerancePx: 18,
    worldUnitsPerPixel: 1,
  });
  if (candidate) candidateCount += 1;
}
const queryMs = performance.now() - queryStarted;
assert.equal(candidateCount, 2_000, "Spatial snap benchmark tüm sorgularda aday bulmalı.");
assert.ok(
  queryMs < QUERY_BUDGET_MS,
  `2k spatial snap query bütçeyi aştı: ${queryMs.toFixed(1)}ms`
);

const precisionStarted = performance.now();
let checksum = 0;
for (let index = 0; index < 100_000; index += 1) {
  const pointer = { x: index % 412, y: (index * 7) % 915 };
  const placement = resolveCadPrecisionLensPlacement(pointer, { width: 412, height: 915 });
  const crop = resolveCadMagnifierCrop(
    pointer,
    { width: 412, height: 915 },
    { width: 1082, height: 2402 }
  );
  checksum += placement.left + placement.top + (crop?.targetX ?? 0) + (crop?.targetY ?? 0);
}
const precisionMs = performance.now() - precisionStarted;
assert.ok(Number.isFinite(checksum) && checksum > 0);
assert.ok(
  precisionMs < PRECISION_HELPER_BUDGET_MS,
  `100k precision helper iterasyonu bütçeyi aştı: ${precisionMs.toFixed(1)}ms`
);

const mobileSpec = readFileSync(
  "tests/document-studio/cad-mobile-stage8.spec.ts",
  "utf8"
);
const playwrightConfig = readFileSync("playwright.config.ts", "utf8");
const adapterSource = readFileSync(
  "src/lib/dokumantasyon/cad-upstream/adapter.ts",
  "utf8"
);
const stage7Overlay = readFileSync(
  "src/components/dokumantasyon/preview/cad-precision-overlay.tsx",
  "utf8"
);

for (const token of [
  "Input.dispatchTouchEvent",
  "cad-precision-magnifier",
  "data-cad-snap-label",
  "data-cad-distance-complete",
  "data-cad-offset-guide",
  "tracking-first",
  "tracking-second",
]) {
  assert.ok(mobileSpec.includes(token), `Stage 8 mobil kabul tokenı eksik: ${token}`);
}

assert.ok(playwrightConfig.includes('devices["Pixel 7"]'));
assert.ok(playwrightConfig.includes('devices["iPhone 13"]'));
assert.ok(playwrightConfig.includes("cad-mobile-stage8.spec.ts"));
assert.ok(
  adapterSource.includes("const CAD_MOBILE_PINCH_ZOOM_SPEED = 1;"),
  "Mobil pinch zoomSpeed doğal 1 değerinde kalmalı."
);
for (const token of [
  "data-cad-precision-magnifier",
  "data-cad-magnifier-side",
  "data-cad-snap-preview-mode",
  "data-cad-touch-anchor",
]) {
  assert.ok(stage7Overlay.includes(token), `Stage 7 precision runtime tokenı eksik: ${token}`);
}

const vercelConfig = JSON.parse(readFileSync("vercel.json", "utf8")) as {
  git?: { deploymentEnabled?: unknown };
};
assert.equal(
  vercelConfig.git?.deploymentEnabled,
  false,
  "Stage 8 push/PR Vercel deployment tetiklememeli."
);

console.log(
  `GATE: PASS — Stage 8 mobile acceptance contract and performance budgets passed. rebuild=${rebuildMs.toFixed(1)}ms query=${queryMs.toFixed(1)}ms precision=${precisionMs.toFixed(1)}ms`
);
