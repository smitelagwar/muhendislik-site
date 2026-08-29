import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const adapter = readFileSync(
  "src/lib/dokumantasyon/cad-upstream/adapter.ts",
  "utf8"
);
const viewer = readFileSync(
  "src/components/dokumantasyon/preview/cad-upstream-viewer.tsx",
  "utf8"
);
const vercel = JSON.parse(readFileSync("vercel.json", "utf8")) as {
  git?: { deploymentEnabled?: unknown };
};

for (const token of [
  "CAD_MOBILE_PINCH_ZOOM_SPEED = 1",
  "CadPressHoldDistanceController",
  "startDistanceMeasurement",
  "updateDistanceMeasurementSnapModes",
  "configureMobileGestureGuard",
  "buildCadSnapPrimitives",
  "CAD_DISTANCE_SNAP_TOLERANCE_PX",
]) {
  assert.ok(adapter.includes(token), `Stage 8 adapter sözleşmesi eksik: ${token}`);
}

for (const token of [
  "CadDistanceOverlay",
  "CadSnapSettingsPanel",
  "cad-tool-snap-settings",
  "cad-tool-distance",
  "data-cad-distance-phase",
]) {
  assert.ok(viewer.includes(token), `Stage 8 viewer sözleşmesi eksik: ${token}`);
}

// main üzerinde Stage 8 hattından bağımsız eklenen CAD iyileştirmeleri final birleşimde kaybolmamalı.
for (const token of [
  "CAD_BACKGROUND_COLORS",
  "CadBackgroundColorOption",
  "setBackgroundColor",
  "initializeCadEngineEnhancements",
  "MEASUREMENT_LENGTH_FORMAT_OPTIONS",
  "FontManager",
  "getFillMaterial",
  "enforceCadMouseBindings(): void",
]) {
  assert.ok(adapter.includes(token), `main CAD iyileştirmesi final birleşimde eksik: ${token}`);
}

assert.ok(
  adapter.includes(
    "this.manager.curView.selectionSet?.clear();\n    // PAN mode changes upstream OrbitControls mouse mappings. Restore the\n    // desktop read-only contract afterwards without touching touch gestures.\n    this.enforceCadMouseBindings();"
  ),
  "restorePanMode sonrası masaüstü mouse binding sözleşmesi yeniden uygulanmalı."
);

for (const token of [
  "cad-bg-autocad",
  "cad-bg-black",
  "cad-bg-white",
  "data-cad-background-color",
]) {
  assert.ok(viewer.includes(token), `main viewer iyileştirmesi final birleşimde eksik: ${token}`);
}

assert.ok(existsSync(".vercelignore"), ".vercelignore final birleşimde bulunmalı.");
assert.equal(
  vercel.git?.deploymentEnabled,
  false,
  "Git tabanlı Vercel auto-deploy Stage 9 boyunca kapalı kalmalı."
);

console.log(
  "GATE: PASS — Stage 9 final integration preserves Stage 2–8 mobile CAD behavior, desktop read-only mouse bindings, main CAD enhancements and the Vercel Git deploy lock."
);
