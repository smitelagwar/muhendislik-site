import fs from "fs";
import path from "path";
import { calculateFullTakeoff } from "../src/lib/hsyncad/quantities";
import { resolveJunctions } from "../src/lib/hsyncad/junctions";
import { generateQuantityReportPDF } from "../src/lib/hsyncad/reports";
import type { CadModel } from "../src/lib/hsyncad/model";

async function run() {
  const modelPath = "C:/Users/hsyn/Desktop/SON/7_KAT_5000M2_BINA.hsyncad";
  const model: CadModel = JSON.parse(fs.readFileSync(modelPath, "utf8"));

  // 1. Run system calculation
  const junctions = resolveJunctions(model);
  const systemTakeoff = calculateFullTakeoff(model, undefined, junctions);

  // 2. Independent Engineering Calculation (First Principles)
  // Let's do an analytical element-by-element civil engineering calculation:
  // Floor count: 7
  // Columns: 30 per floor * 7 = 210 columns (50x50 cm, h=3.50m)
  // Walls: 5 per floor * 7 = 35 walls (30cm thick, 6m long, h=3.50m)
  // Beams: 49 per floor * 7 = 343 beams (30x60 cm, L=6m, web below 15cm slab = 30x45cm)
  // Slabs: 20 per floor * 7 = 140 slabs (15cm thick, net area per slab = 32.46 m2)
  // Raft: 1 slab on Zemin (50cm thick, area = 832 m2, perimeter = 116m)

  const indep = {
    concrete: {
      columns: 210 * (0.50 * 0.50 * 3.50), // 183.75 m3
      walls: 35 * (0.30 * 6.00 * 3.50),    // 220.50 m3
      beamsWeb: 343 * (0.30 * 0.45 * 6.00),// 277.83 m3 (effective web below slab)
      slabs: 140 * (32.4607 * 0.15),       // 681.67 m3
      raft: 832.0 * 0.50,                  // 416.00 m3
      total: 0,
    },
    formwork: {
      columns: 210 * (4 * 0.50 * 3.50),    // 1470.00 m2
      walls: 35 * (2 * (6.00 + 0.30) * 3.50), // 1543.50 m2
      beams: 343 * ((0.30 + 2 * 0.45) * 6.00), // 2469.60 m2
      slabs: 140 * 32.4607,                // 4544.50 m2
      raft: 116.0 * 0.50,                  // 58.00 m2 (perimeter edge only)
      total: 0,
    },
    rebarKg: {
      dia8: 0,
      dia10: 0,
      dia12: 0,
      dia14: 0,
      dia16: 0,
      dia18: 0,
      dia20: 0,
      thin: 0,
      thick: 0,
      total: 0,
    }
  };

  indep.concrete.total = indep.concrete.columns + indep.concrete.walls + indep.concrete.beamsWeb + indep.concrete.slabs + indep.concrete.raft;
  indep.formwork.total = indep.formwork.columns + indep.formwork.walls + indep.formwork.beams + indep.formwork.slabs + indep.formwork.raft;

  console.log("=== INDEPENDENT ANALYTICAL CHECK ===");
  console.log(`Independent Concrete Total: ${indep.concrete.total.toFixed(3)} m³`);
  console.log(`System Concrete Total:      ${systemTakeoff.concreteVolumeM3.total.toFixed(3)} m³`);
  console.log(`Delta: ${(systemTakeoff.concreteVolumeM3.total - indep.concrete.total).toFixed(3)} m³ (${((systemTakeoff.concreteVolumeM3.total - indep.concrete.total) / indep.concrete.total * 100).toFixed(3)}%)`);

  console.log(`\nIndependent Formwork Total: ${indep.formwork.total.toFixed(2)} m²`);
  console.log(`System Formwork Total:      ${systemTakeoff.formworkAreaM2.total.toFixed(2)} m²`);
  console.log(`Delta: ${(systemTakeoff.formworkAreaM2.total - indep.formwork.total).toFixed(2)} m² (${((systemTakeoff.formworkAreaM2.total - indep.formwork.total) / indep.formwork.total * 100).toFixed(3)}%)`);

  // Now generate genuine official PDF using generateQuantityReportPDF
  const pdfBytes = await generateQuantityReportPDF(model, systemTakeoff);
  const outPdfPath = "C:/Users/hsyn/Desktop/SON/METRAJ.pdf";
  fs.writeFileSync(outPdfPath, Buffer.from(pdfBytes));
  console.log(`\nSUCCESS: Generated genuine METRAJ.pdf at ${outPdfPath} (${pdfBytes.length} bytes)`);
}

run().catch(console.error);
