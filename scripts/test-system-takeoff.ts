import fs from "fs";
import path from "path";
import { calculateFullTakeoff } from "../src/lib/hsyncad/quantities";
import { resolveJunctions } from "../src/lib/hsyncad/junctions";

const modelPath = "C:/Users/hsyn/Desktop/SON/7_KAT_5000M2_BINA.hsyncad";
const model = JSON.parse(fs.readFileSync(modelPath, "utf8"));

console.log("=== RUNNING SYSTEM calculateFullTakeoff ===");
console.log(`Model name: ${model.name}`);
console.log(`Floors: ${model.floors.length}`);
console.log(`Total elements in model: ${model.elements.length}`);

const junctions = resolveJunctions(model);
console.log(`Junction status: ${junctions.status}, junctions found: ${junctions.intersections?.length || 0}`);

const takeoff = calculateFullTakeoff(model, undefined, junctions);

console.log("\n--- SYSTEM TAKEOFF TOTALS ---");
console.log(`Total Concrete: ${takeoff.concreteVolumeM3.total.toFixed(3)} m³`);
console.log(`Total Formwork: ${takeoff.formworkAreaM2.total.toFixed(2)} m²`);
console.log(`Total Rebar: ${takeoff.rebarTonnage.totalKg.toFixed(2)} kg (${takeoff.rebarTonnage.totalTons.toFixed(3)} ton)`);
console.log(`Thin Rebar (<=Ø12): ${takeoff.rebarTonnage.thinKg.toFixed(2)} kg`);
console.log(`Thick Rebar (>=Ø14): ${takeoff.rebarTonnage.thickKg.toFixed(2)} kg`);
console.log(`Rebar density: ${takeoff.summary.steelDensityKgM3.toFixed(2)} kg/m³`);
console.log(`Formwork to concrete ratio: ${takeoff.summary.formworkToConcreteRatio.toFixed(2)} m²/m³`);

console.log("\n--- CONCRETE BY ELEMENT ---");
for (const [k, v] of Object.entries(takeoff.concreteVolumeM3.byElement)) {
  console.log(`  ${k}: ${v.toFixed(3)} m³`);
}

console.log("\n--- FORMWORK BY ELEMENT ---");
for (const [k, v] of Object.entries(takeoff.formworkAreaM2.byElement)) {
  console.log(`  ${k}: ${v.toFixed(2)} m²`);
}

console.log("\n--- CONCRETE BY FLOOR ---");
for (const [k, v] of Object.entries(takeoff.concreteVolumeM3.byFloor)) {
  console.log(`  ${k}: ${v.toFixed(3)} m³`);
}

console.log("\n--- FORMWORK BY FLOOR ---");
for (const [k, v] of Object.entries(takeoff.formworkAreaM2.byFloor)) {
  console.log(`  ${k}: ${v.toFixed(2)} m²`);
}

console.log("\n--- REBAR BY DIAMETER ---");
for (const [k, v] of Object.entries(takeoff.rebarTonnage.byDiameter)) {
  if (v > 0) console.log(`  Ø${k}: ${v.toFixed(2)} kg`);
}

fs.writeFileSync(
  "C:/Users/hsyn/.gemini/antigravity/brain/09b55ed4-e791-4058-942b-83efe39df9bc/scratch/system_takeoff_raw.json",
  JSON.stringify(takeoff, null, 2)
);
console.log("\nSaved system takeoff to scratch/system_takeoff_raw.json");
