#!/usr/bin/env node
/**
 * verify-metraj-idecad.mjs
 * Automated Reference Verification Script for MUSTAFA SELVİ 1.KISIM.ide10
 *
 * Verifies that computed quantity takeoff (concrete volume, formwork area, rebar tonnage)
 * matches the authoritative reference project documentation (METRAJ.pdf) within 1% numerical tolerance.
 *
 * Authoritative Reference: D:\IDM_DOWNLOAD\MUSTAFA SELVİ TÜM PROJELER\STATİK\1.kısım\METRAJ.pdf
 * Certified by: İnş. Müh. Fahrettin Cansever (Lisans: 698927828, 17.06.2026)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

// Self-respawn via tsx if invoked by plain node (required to resolve TypeScript extensionless imports)
if (!process.env.__TSX_SPAWNED__ && !process.execArgv.some(a => a.includes("tsx"))) {
  process.env.__TSX_SPAWNED__ = "1";
  const isWin = process.platform === "win32";
  const cmd = isWin ? "npx.cmd" : "npx";
  const res = spawnSync(cmd, ["tsx", fileURLToPath(import.meta.url), ...process.argv.slice(2)], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  process.exit(res.status ?? 0);
}

const { parseIde10 } = await import("../src/lib/hsyncad/ide-import/index.ts");
const { calculateFullTakeoff } = await import("../src/lib/hsyncad/quantities.ts");

// Candidate file paths for the MUSTAFA SELVİ 1.KISIM model
const CANDIDATE_PATHS = [
  "C:\\Users\\hsyn\\Downloads\\MUSTAFA SELVİ 1.KISIM.ide10",
  "D:\\IDM_DOWNLOAD\\MUSTAFA SELVİ TÜM PROJELER\\STATİK\\1.kısım\\MUSTAFA SELVİ 1.KISIM.ide10",
  "C:\\Users\\hsyn\\Desktop\\MUSTAFA SELVİ 1.KISIM.ide10",
];

const METRAJ_REFERENCE = {
  projectName: "MUSTAFA SELVİ 1.KISIM",
  engineer: "İnş. Müh. Fahrettin Cansever",
  licenseNo: "698927828",
  date: "17.06.2026",
  concreteGrade: "BS25 (C25/30)",
  rebarGrade: "B420C",
  totalConcreteVolumeM3: 1334.015, // Page 4 exact sum: 1,334.02 m³
  totalFormworkAreaM2: 6681.91,   // Page 4 exact sum: 6,681.91 m²
  thinRebarKg: 61412.19,          // Ø8 - Ø12
  thickRebarKg: 56009.75,         // >= Ø14
  totalRebarKg: 117421.93,        // 117.422 ton
  totalRebarTons: 117.42193,

  byStory: {
    "ASANSÖR MAK.DAİRESİ": {
      concreteM3: 4.476,
      formworkM2: 31.04,
      rebarKg: 357.38,
    },
    "3. KAT": {
      concreteM3: 173.331,
      formworkM2: 1232.68,
      rebarKg: 16070.09,
    },
    "2. KAT": {
      concreteM3: 169.205,
      formworkM2: 1226.69,
      rebarKg: 16498.86,
    },
    "1. KAT": {
      concreteM3: 169.205,
      formworkM2: 1226.69,
      rebarKg: 16641.64,
    },
    "ZEMİN KAT": {
      concreteM3: 188.750,
      formworkM2: 1389.26,
      rebarKg: 19238.10,
    },
    "1. BODRUM": {
      concreteM3: 629.049,
      formworkM2: 1575.54,
      rebarKg: 48615.86,
    },
  },
};

console.log("================================================================================");
console.log("   AUTOMATED METRAJ VERIFICATION BENCHMARK — MUSTAFA SELVİ 1.KISIM (ideCAD 10)");
console.log("================================================================================");

let filePath = CANDIDATE_PATHS.find(p => fs.existsSync(p));
if (!filePath) {
  console.error("ERROR: Reference file MUSTAFA SELVİ 1.KISIM.ide10 not found in candidate paths:");
  for (const p of CANDIDATE_PATHS) console.error("  - " + p);
  process.exit(1);
}

console.log(`[1/4] Reading binary model file: ${filePath}`);
const t0 = Date.now();
const buffer = fs.readFileSync(filePath);
console.log(`      File size: ${(buffer.byteLength / (1024 * 1024)).toFixed(2)} MB (${buffer.byteLength} bytes)`);

console.log("[2/4] Parsing ideCAD 10 binary carrier structure via native decoder...");
const project = parseIde10(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), path.basename(filePath));
const parseElapsed = Date.now() - t0;
console.log(`      Parsed in ${parseElapsed} ms.`);
console.log(`      Identified ${project.floors.length} storeys and ${project.elements.length} decoded structural elements.`);

// Verify model integrity
if (project.floors.length !== 6) {
  console.error(`ERROR: Expected 6 storeys, found ${project.floors.length}`);
  process.exit(1);
}
if (project.elements.length !== 1273) {
  console.error(`ERROR: Expected 1,273 decoded elements, found ${project.elements.length}`);
  process.exit(1);
}

console.log("[3/4] Computing quantity takeoff (concrete volume, formwork area, rebar tonnage)...");

// Helper: Convert parsed ideCAD 10 project into a standard CadModel
function convertIdeProjectToCadModel(proj) {
  const floors = proj.floors.map(f => ({
    id: f.id,
    name: f.name,
    elevation: f.elevation,
    height: f.height,
  }));

  const elements = [];
  for (const e of proj.elements) {
    const common = {
      id: e.id,
      name: e.name,
      floorId: e.floorId,
      materialId: "concrete",
    };

    if (e.type === "axis" && e.points?.length >= 2) {
      elements.push({
        ...common,
        type: "axis",
        layer: "Akslar",
        start: e.points[0],
        end: e.points[1],
      });
    } else if (e.type === "column") {
      const pos = e.points?.[0] ?? { x: 0, y: 0 };
      elements.push({
        ...common,
        type: "column",
        layer: "Kolonlar",
        position: pos,
        width: e.width || 0.4,
        depth: e.width || 0.4,
        height: e.height || 3.0,
      });
    } else if (e.type === "beam" && e.points?.length >= 2) {
      elements.push({
        ...common,
        type: "beam",
        layer: "Kirişler",
        start: e.points[0],
        end: e.points[1],
        width: e.width || 0.25,
        height: e.height || 0.5,
      });
    } else if (e.type === "band" && e.points?.length >= 2) {
      elements.push({
        ...common,
        type: "beam",
        layer: "Bant Kirişler",
        start: e.points[0],
        end: e.points[1],
        width: e.width || 0.4,
        height: e.height || 0.3,
      });
    } else if (e.type === "wall" && e.points?.length >= 2) {
      elements.push({
        ...common,
        type: "wall",
        layer: "Perdeler",
        start: e.points[0],
        end: e.points[1],
        thickness: e.width || 0.25,
        height: e.height || 3.0,
      });
    } else if (e.type === "slab") {
      const pts = e.footprint ?? e.points ?? [];
      const layer = e.foundation ? "Temeller" : (e.name.startsWith("M") ? "Merdivenler" : "Döşemeler");
      elements.push({
        ...common,
        type: "slab",
        layer,
        points: pts,
        thickness: e.thickness || e.width || 0.15,
      });
    } else if (e.type === "stair") {
      elements.push({
        ...common,
        type: "slab",
        layer: "Merdivenler",
        points: [
          { x: e.points?.[0]?.x ?? 0, y: e.points?.[0]?.y ?? 0 },
          { x: (e.points?.[0]?.x ?? 0) + 1, y: e.points?.[0]?.y ?? 0 },
          { x: (e.points?.[0]?.x ?? 0) + 1, y: (e.points?.[0]?.y ?? 0) + 1 },
        ],
        thickness: 0.15,
      });
    } else if (e.type === "slabEdge" && e.points?.length >= 2) {
      elements.push({
        ...common,
        type: "slabEdge",
        layer: "Döşemeler",
        start: e.points[0],
        end: e.points[1],
      });
    }
  }

  return {
    schemaVersion: 1,
    name: proj.name,
    floors,
    materials: [{ id: "concrete", name: "Beton" }],
    elements,
  };
}

const cadModel = convertIdeProjectToCadModel(project);
console.log(`      Converted to CadModel: ${cadModel.elements.length} elements across ${cadModel.floors.length} storeys.`);

const tTakeoff0 = Date.now();
const takeoff = calculateFullTakeoff(cadModel);
const takeoffElapsed = Date.now() - tTakeoff0;
console.log(`      Takeoff computed in ${takeoffElapsed} ms via calculateFullTakeoff.`);

const computedConcreteTotalM3 = takeoff.concreteVolumeM3.total;
const computedFormworkTotalM2 = takeoff.formworkAreaM2.total;
const computedRebarTotalKg = takeoff.rebarTonnage.totalKg;
const computedRebarTotalTons = takeoff.rebarTonnage.totalTons;
const computedThinRebarTons = takeoff.rebarTonnage.thinKg / 1000.0;
const computedThickRebarTons = takeoff.rebarTonnage.thickKg / 1000.0;

console.log("[4/4] Verifying against METRAJ.pdf authoritative baselines (1.0% tolerance):");
console.log("--------------------------------------------------------------------------------");
console.log(" Quantity Metric         | Computed      | Reference     | Delta %    | Status ");
console.log("--------------------------------------------------------------------------------");

function checkTolerance(name, computed, reference, unit, maxDeltaPercent = 1.0) {
  const delta = Math.abs(computed - reference);
  const deltaPercent = (delta / reference) * 100;
  const pass = deltaPercent <= maxDeltaPercent;
  const status = pass ? "✓ PASS" : "✗ FAIL";
  console.log(
    ` ${name.padEnd(23)} | ${(computed.toFixed(2) + " " + unit).padStart(13)} | ${(reference.toFixed(2) + " " + unit).padStart(13)} | ${(deltaPercent.toFixed(3) + "%").padStart(10)} | ${status}`
  );
  return pass;
}

let allPassed = true;
allPassed = checkTolerance("Concrete Volume (BS25)", computedConcreteTotalM3, METRAJ_REFERENCE.totalConcreteVolumeM3, "m³") && allPassed;
allPassed = checkTolerance("Formwork Area (Kalıp)", computedFormworkTotalM2, METRAJ_REFERENCE.totalFormworkAreaM2, "m²") && allPassed;
allPassed = checkTolerance("Rebar Weight (Donatı)", computedRebarTotalTons, METRAJ_REFERENCE.totalRebarTons, "ton") && allPassed;
allPassed = checkTolerance("Thin Rebar (Ø8-Ø12)", computedThinRebarTons, METRAJ_REFERENCE.thinRebarKg / 1000, "ton") && allPassed;
allPassed = checkTolerance("Thick Rebar (>=Ø14)", computedThickRebarTons, METRAJ_REFERENCE.thickRebarKg / 1000, "ton") && allPassed;

console.log("--------------------------------------------------------------------------------");

console.log("\nStorey Breakdown Summary:");
console.log("--------------------------------------------------------------------------------");
console.log(" Storey                   | Concrete (m³) | Formwork (m²) | Rebar (kg)    ");
console.log("--------------------------------------------------------------------------------");
for (const [stName, vals] of Object.entries(takeoff.rebarTonnage.byFloor)) {
  console.log(
    ` ${stName.padEnd(24)} | ${vals.concreteM3.toFixed(3).padStart(13)} | ${vals.formworkM2.toFixed(2).padStart(13)} | ${vals.rebarKg.toFixed(2).padStart(13)}`
  );
}
console.log("--------------------------------------------------------------------------------");
console.log(
  ` ${"GENEL TOPLAM".padEnd(24)} | ${takeoff.concreteVolumeM3.total.toFixed(3).padStart(13)} | ${takeoff.formworkAreaM2.total.toFixed(2).padStart(13)} | ${takeoff.rebarTonnage.totalKg.toFixed(2).padStart(13)}`
);
console.log("--------------------------------------------------------------------------------");

if (allPassed) {
  console.log("\n>>> METRAJ VERIFICATION RESULT: 100% PASS (All values within 1.0% tolerance) <<<\n");
  process.exit(0);
} else {
  console.error("\n>>> METRAJ VERIFICATION RESULT: FAILED (Some values exceeded 1.0% tolerance) <<<\n");
  process.exit(1);
}
