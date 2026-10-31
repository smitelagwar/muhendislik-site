import fs from "node:fs";
import path from "node:path";
import { resolveJunctions } from "../src/lib/hsyncad/junctions";
import { runStructuralAnalysis } from "../src/lib/hsyncad/analysis";
import { runConcreteDesignChecks } from "../src/lib/hsyncad/design-engine";
import { calculateFullTakeoff } from "../src/lib/hsyncad/quantities";
import type { CadModel } from "../src/lib/hsyncad/model";

async function testHsyncadModel() {
  const hsyncadPath = "C:\\Users\\hsyn\\Desktop\\SON\\7_KAT_5000M2_BINA.hsyncad";
  const model: CadModel = JSON.parse(fs.readFileSync(hsyncadPath, "utf8"));

  console.log("=== Testing 7_KAT_5000M2_BINA.hsyncad with Engineering Engine ===");
  console.log("Model Name:", model.name);
  console.log("Floors:", model.floors.length);
  console.log("Elements:", model.elements.length);

  // 1. Resolve Junctions
  const junctions = resolveJunctions(model);
  console.log("Junctions Status:", junctions.status);
  console.log("Junction Nodes Count:", Object.keys(junctions.byElement).length);
  console.log("Junction Groups Count:", junctions.groups?.length ?? 0);

  // 2. Structural Analysis
  const t0 = performance.now();
  const analysis = runStructuralAnalysis(model);
  const t1 = performance.now();
  console.log(`Structural Analysis completed in ${(t1 - t0).toFixed(1)} ms`);
  console.log("Building Weight W (kN):", analysis.buildingWeightKn.toFixed(1));
  console.log("Base Shear Vt (kN):", analysis.baseShearVtKn.toFixed(1));
  console.log("Fundamental Period T1 (s):", analysis.fundamentalPeriodSec.toFixed(3));
  console.log("Storeys in Analysis:", analysis.storeys.length);

  // 3. Capacity Design Checks
  const design = runConcreteDesignChecks(model, analysis);
  console.log("Columns Checked:", design.columns.length);
  console.log("Beams Checked:", design.beams.length);
  console.log("Shear Walls Checked:", design.walls.length);
  console.log("Overall Model Safe?", design.isSafe);

  // 4. Quantity Takeoff
  const takeoff = calculateFullTakeoff(model);
  console.log("Concrete Volume (m3):", takeoff.totalConcreteM3.toFixed(2));
  console.log("Formwork Area (m2):", takeoff.totalFormworkM2.toFixed(2));
  console.log("Rebar Tonnage (ton):", takeoff.rebarTonnage.totalTons.toFixed(2));
}

testHsyncadModel().catch(console.error);
