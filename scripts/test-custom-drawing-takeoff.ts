import { calculateFullTakeoff } from "../src/lib/hsyncad/quantities";
import { resolveJunctions } from "../src/lib/hsyncad/junctions";
import type { CadModel } from "../src/lib/hsyncad/model";

// Let's create an arbitrary user model:
// 3 storeys, 4 columns (40x60cm), 4 beams (25x50cm, 5m span), 1 slab (15cm, 5x5m), 1 raft (40cm, 6x6m)
const customModel: CadModel = {
  schemaVersion: 1,
  name: "Ahmet Bey Apartmanı (Örnek Özel Çizim)",
  materials: [
    { id: "concrete", name: "C30/37", unitWeight: 25, elasticity: 32000, color: "#94a3b8" }
  ],
  floors: [
    { id: "fl-0", name: "Zemin Kat", elevation: 0, height: 3.0 },
    { id: "fl-1", name: "1. Normal Kat", elevation: 3.0, height: 3.0 },
    { id: "fl-2", name: "2. Normal Kat", elevation: 6.0, height: 3.0 }
  ],
  toolDefaults: {} as any,
  elements: [
    // Raft on ground
    {
      id: "raft-1",
      name: "RAD-01",
      floorId: "fl-0",
      materialId: "concrete",
      layer: "Temeller",
      type: "slab",
      points: [{ x: -0.5, y: -0.5 }, { x: 5.5, y: -0.5 }, { x: 5.5, y: 5.5 }, { x: -0.5, y: 5.5 }],
      thickness: 0.40,
      topOffset: 0
    }
  ]
};

// Add 4 columns and 4 beams and 1 slab to each of the 3 floors
for (const fl of customModel.floors) {
  // 4 columns (0.40 x 0.60 m)
  const colCoords = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }, { x: 0, y: 5 }];
  colCoords.forEach((pt, idx) => {
    customModel.elements.push({
      id: `col-${fl.id}-${idx+1}`,
      name: `S0${idx+1}`,
      floorId: fl.id,
      materialId: "concrete",
      layer: "Kolonlar",
      type: "column",
      position: pt,
      width: 0.40,
      depth: 0.60,
      height: 3.0,
      heightMode: "story",
      rotation: 0,
      anchorMode: "center"
    } as any);
  });

  // 4 beams (0.25 x 0.50 m)
  const beamLines = [
    { s: { x: 0, y: 0 }, e: { x: 5, y: 0 }, name: "K101" },
    { s: { x: 5, y: 0 }, e: { x: 5, y: 5 }, name: "K102" },
    { s: { x: 5, y: 5 }, e: { x: 0, y: 5 }, name: "K103" },
    { s: { x: 0, y: 5 }, e: { x: 0, y: 0 }, name: "K104" },
  ];
  beamLines.forEach((b, idx) => {
    customModel.elements.push({
      id: `beam-${fl.id}-${idx+1}`,
      name: b.name,
      floorId: fl.id,
      materialId: "concrete",
      layer: "Kirişler",
      type: "beam",
      start: b.s,
      end: b.e,
      width: 0.25,
      height: 0.50
    } as any);
  });

  // 1 slab (15cm)
  customModel.elements.push({
    id: `slab-${fl.id}-1`,
    name: "D1",
    floorId: fl.id,
    materialId: "concrete",
    layer: "Döşemeler",
    type: "slab",
    points: [{ x: 0.2, y: 0.2 }, { x: 4.8, y: 0.2 }, { x: 4.8, y: 4.8 }, { x: 0.2, y: 4.8 }],
    thickness: 0.15,
    topOffset: 0
  } as any);
}

const junctions = resolveJunctions(customModel);
const takeoff = calculateFullTakeoff(customModel, undefined, junctions);

console.log("=== CUSTOM USER DRAWING TEST ===");
console.log(`Project: ${customModel.name}`);
console.log(`Floors: ${customModel.floors.length}`);
console.log(`Elements: ${customModel.elements.length}`);
console.log(`Total Concrete: ${takeoff.concreteVolumeM3.total.toFixed(3)} m³`);
console.log(`Total Formwork: ${takeoff.formworkAreaM2.total.toFixed(2)} m²`);
console.log(`Total Rebar: ${takeoff.rebarTonnage.totalKg.toFixed(2)} kg (${takeoff.rebarTonnage.totalTons.toFixed(3)} ton)`);
console.log(`Steel Density: ${takeoff.summary.steelDensityKgM3.toFixed(2)} kg/m³`);

console.log("\nConcrete By Element:");
for (const [k, v] of Object.entries(takeoff.concreteVolumeM3.byElement)) {
  if (v > 0) console.log(`  ${k}: ${v.toFixed(3)} m³`);
}

console.log("\nFormwork By Element:");
for (const [k, v] of Object.entries(takeoff.formworkAreaM2.byElement)) {
  if (v > 0) console.log(`  ${k}: ${v.toFixed(2)} m²`);
}

console.log("\nBy Floor:");
for (const [fl, st] of Object.entries(takeoff.rebarTonnage.byFloor)) {
  console.log(`  ${fl}: Concrete=${st.concreteM3.toFixed(3)} m³, Formwork=${st.formworkM2.toFixed(2)} m², Rebar=${st.rebarKg.toFixed(2)} kg`);
}
