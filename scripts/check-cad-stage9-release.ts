import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { CAD_DEFAULT_MEASUREMENT_UNIT_SETTINGS } from "../src/lib/dokumantasyon/cad-review/store";
import {
  calculateCalibration,
  convertArea,
  convertDistance,
  formatArea,
  formatDistance,
  type CadSourceUnitContext,
} from "../src/lib/dokumantasyon/cad-review/units";

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

function pass(label: string) {
  console.log(`PASS  ${label}`);
}

function requireSource(relativePath: string, needles: readonly string[]) {
  const source = read(relativePath);
  for (const needle of needles) {
    assert.ok(source.includes(needle), `${relativePath} eksik release contract: ${needle}`);
  }
  pass(`${relativePath} source contract`);
}

function main() {
  console.log("\n========================================================");
  console.log("   CAD STAGE 9 — FINAL RELEASE BLOCKER GATE");
  console.log("========================================================\n");

  assert.equal(CAD_DEFAULT_MEASUREMENT_UNIT_SETTINGS.unit, "m");
  assert.equal(CAD_DEFAULT_MEASUREMENT_UNIT_SETTINGS.precision, 2);
  assert.equal(CAD_DEFAULT_MEASUREMENT_UNIT_SETTINGS.areaUnit, "m2");
  assert.equal(CAD_DEFAULT_MEASUREMENT_UNIT_SETTINGS.areaPrecision, 2);
  pass("Construction default = m / m² / precision 2");

  // Stage 9 area oracle: source drawing unit is cm and rectangle is 5 m x 4 m.
  const centimeterSource: CadSourceUnitContext = {
    sourceUnit: "cm",
    mmPerWorldUnit: 10,
    source: "manual",
  };
  const rectangleAreaWorld = 500 * 400;
  assert.equal(convertArea(rectangleAreaWorld, centimeterSource, "m2"), 20);
  assert.equal(convertArea(rectangleAreaWorld, centimeterSource, "cm2"), 200_000);
  assert.equal(formatArea(rectangleAreaWorld, centimeterSource, "m2", 2), "20,00 m²");
  assert.equal(formatArea(rectangleAreaWorld, centimeterSource, "cm2", 2), "200.000,00 cm²");
  pass("5 m × 4 m area oracle = 20,00 m² / 200.000,00 cm²");

  // Stage 9 calibration oracle: 100 drawing units are declared as 50 cm.
  const calibration = calculateCalibration({ x: 0, y: 0 }, { x: 100, y: 0 }, 50, "cm");
  assert.equal(calibration.mmPerWorldUnit, 5);
  const calibratedSource: CadSourceUnitContext = {
    sourceUnit: "unitless",
    mmPerWorldUnit: calibration.mmPerWorldUnit ?? null,
    source: "calibration",
  };
  assert.equal(convertDistance(400, calibratedSource, "m"), 2);
  assert.equal(convertArea(400 * 600, calibratedSource, "m2"), 6);
  assert.equal(formatDistance(400, calibratedSource, "m", 2), "2,00 m");
  assert.equal(formatArea(400 * 600, calibratedSource, "m2", 2), "6,00 m²");
  pass("Calibration oracle = 50 cm reference → 2,00 m / 6,00 m²");

  requireSource("src/components/dokumantasyon/preview/cad-ribbon/cad-unit-control.tsx", [
    "cad-source-unit-label",
    "Kalibre Et",
    "CAD_START_CALIBRATION_EVENT",
    "role=\"radiogroup\"",
  ]);
  requireSource("src/components/dokumantasyon/preview/cad-calibration-overlay.tsx", [
    "screenToWorldPoint",
    "calculateCalibration",
    "saveCadCalibration",
    "cad-calibration-distance",
    "cad-calibration-apply",
    "Kalibrasyon kaydedildi",
  ]);
  requireSource("src/components/dokumantasyon/preview/cad-ribbon/cad-tool-popover.tsx", [
    "CAD_CLOSE_TOOL_POPOVERS_EVENT",
    "data-cad-shortcut-scope=\"local\"",
  ]);
  requireSource("src/components/dokumantasyon/preview/cad-studio-ribbon.tsx", [
    "CadCalibrationOverlay",
    "CadBlankCanvasRecovery",
  ]);

  requireSource("src/lib/dokumantasyon/cad-review/units.ts", [
    "dxf-insunits",
    "cad-calibration:",
    "mmPerWorldUnit",
    "worldArea * source.mmPerWorldUnit * source.mmPerWorldUnit",
  ]);
  requireSource("src/lib/dokumantasyon/cad-review/export-contract.ts", ["review"]);
  requireSource("src/lib/dokumantasyon/cad-review/export-dxf.ts", ["DXF"]);
  requireSource("src/lib/dokumantasyon/cad-review/freehand-controller.ts", [
    "requestAnimationFrame",
    "simplifyPointsRdp",
  ]);
  requireSource("scripts/verify-cad-stage8-a11y-performance.mjs", ["Stage 8 gate"]);

  const reviewRelease = read("scripts/check-cad-review-release.ts");
  for (const contract of [
    "npx tsc --noEmit --incremental false",
    "cad-markup-tools.spec.ts",
    "cad-freehand-stroke.spec.ts",
    "cad-review-export.spec.ts",
    "check:cad-real-user-release",
    "npm run build",
    "git diff --check",
  ]) {
    assert.ok(reviewRelease.includes(contract), `Composite release runner eksik: ${contract}`);
  }
  pass("Composite review release runner covers TS/E2E/export/build/diff");

  console.log("\nStage 9 deterministic blocker gate: PASS\n");
}

main();
