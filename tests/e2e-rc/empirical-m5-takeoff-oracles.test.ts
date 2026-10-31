/**
 * Empirical Adversarial Test Suite: Milestone 5 Metraj & Takeoff Mathematical Oracles
 * 
 * Verifies mathematical invariants:
 * 1. Volume conservation: Gross volume >= Net volume; Overlap volume = Gross - Net.
 * 2. Overlap deduction consistency: Column-beam and beam-slab overlap deductions are geometrically exact.
 * 3. Formwork physics: Raft foundation formwork strictly equals lateral perimeter shuttering (P * h_r);
 *    ground contact and top finish have zero formwork.
 * 4. Rebar density bounds: Analytical steel density (kg/m3) falls within code-prescribed ranges
 *    (70 - 130 kg/m3 for standard residential/commercial RC buildings).
 * 5. Diameter partition: sum(thinKg + thickKg) === totalKg strictly, where thin is <= Ø12 and thick is >= Ø14.
 * 6. Multi-storey scaling monotonicity: 1, 3, 5, 10, 20 storeys and asymmetric models calculate monotonically
 *    increasing quantities with zero NaNs, infinities, or negative values.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  type CadModel,
  type Floor,
  type ColumnElement,
  type BeamElement,
  type WallElement,
  type SlabElement,
  type Point,
  createEmptyModel,
  createDemoModel,
} from "../../src/lib/hsyncad/model";
import {
  calculateFullTakeoff,
  calculateQuantities,
  CERTIFIED_METRAJ_REFERENCE,
  isCertifiedReferenceModel,
  REBAR_UNIT_WEIGHTS,
  type ComprehensiveTakeoffResult,
} from "../../src/lib/hsyncad/quantities";
import { resolveJunctions } from "../../src/lib/hsyncad/junctions";
import { runStructuralAnalysis, DEFAULT_ANALYSIS_SETTINGS } from "../../src/lib/hsyncad/analysis";
import { runConcreteDesignChecks } from "../../src/lib/hsyncad/design-engine";
import { generateQuantityReportPDF, generateStaticReportPDF } from "../../src/lib/hsyncad/reports";

// ============================================================================
// Model Builders & Generators
// ============================================================================

function createFloor(id: string, name: string, elevation: number, height = 3.0): Floor {
  return { id, name, elevation, height };
}

function createColumn(
  id: string,
  floorId: string,
  pos: Point,
  width = 0.40,
  depth = 0.40,
  height = 3.0
): ColumnElement {
  return {
    id,
    name: `S-${id}`,
    type: "column",
    floorId,
    layer: "Kolonlar",
    materialId: "concrete",
    position: pos,
    width,
    depth,
    height,
  };
}

function createBeam(
  id: string,
  floorId: string,
  start: Point,
  end: Point,
  width = 0.25,
  height = 0.50
): BeamElement {
  return {
    id,
    name: `K-${id}`,
    type: "beam",
    floorId,
    layer: "Kirişler",
    materialId: "concrete",
    start,
    end,
    width,
    height,
  };
}

function createSlab(
  id: string,
  floorId: string,
  polygon: Point[],
  thickness = 0.15,
  layer = "Döşemeler"
): SlabElement {
  return {
    id,
    name: `D-${id}`,
    type: "slab",
    floorId,
    layer,
    materialId: "concrete",
    points: polygon.map(p => ({ ...p })),
    thickness,
    deadLoad: 2.0,
    liveLoad: 2.0,
  };
}

function createWall(
  id: string,
  floorId: string,
  start: Point,
  end: Point,
  thickness = 0.25,
  height = 3.0
): WallElement {
  return {
    id,
    name: `P-${id}`,
    type: "wall",
    floorId,
    layer: "Perdeler",
    materialId: "concrete",
    start,
    end,
    thickness,
    height,
  };
}

/**
 * Creates a parameterized regular multi-storey building model
 * Grid: nx x ny bays, spanLx x spanLy metres
 */
function createParametricBuilding(
  numFloors: number,
  nx = 2,
  ny = 2,
  spanLx = 5.0,
  spanLy = 5.0,
  floorHeight = 3.0
): CadModel {
  const model = createEmptyModel();
  model.name = `Test-Building-${numFloors}F`;

  for (let f = 0; f < numFloors; f++) {
    const floorId = `floor-${f + 1}`;
    const floorElevation = f * floorHeight;
    const floor = createFloor(floorId, `KAT ${f + 1}`, floorElevation, floorHeight);
    model.floors.push(floor);

    // Columns at grid intersections
    for (let ix = 0; ix <= nx; ix++) {
      for (let iy = 0; iy <= ny; iy++) {
        const col = createColumn(
          `c-f${f}-x${ix}y${iy}`,
          floorId,
          { x: ix * spanLx, y: iy * spanLy },
          0.40,
          0.40,
          floorHeight
        );
        model.elements.push(col);
      }
    }

    // Beams in X direction
    for (let iy = 0; iy <= ny; iy++) {
      for (let ix = 0; ix < nx; ix++) {
        const beam = createBeam(
          `bmx-f${f}-x${ix}y${iy}`,
          floorId,
          { x: ix * spanLx, y: iy * spanLy },
          { x: (ix + 1) * spanLx, y: iy * spanLy },
          0.25,
          0.50
        );
        model.elements.push(beam);
      }
    }

    // Beams in Y direction
    for (let ix = 0; ix <= nx; ix++) {
      for (let iy = 0; iy < ny; iy++) {
        const beam = createBeam(
          `bmy-f${f}-x${ix}y${iy}`,
          floorId,
          { x: ix * spanLx, y: iy * spanLy },
          { x: ix * spanLx, y: (iy + 1) * spanLy },
          0.25,
          0.50
        );
        model.elements.push(beam);
      }
    }

    // Slabs in each bay
    for (let ix = 0; ix < nx; ix++) {
      for (let iy = 0; iy < ny; iy++) {
        const slabPoly: Point[] = [
          { x: ix * spanLx, y: iy * spanLy },
          { x: (ix + 1) * spanLx, y: iy * spanLy },
          { x: (ix + 1) * spanLx, y: (iy + 1) * spanLy },
          { x: ix * spanLx, y: (iy + 1) * spanLy },
        ];
        const slab = createSlab(`sl-f${f}-x${ix}y${iy}`, floorId, slabPoly, 0.15);
        model.elements.push(slab);
      }
    }
  }

  return model;
}

describe("Milestone 5 Challenger — Empirical Metraj & Takeoff Mathematical Oracles", () => {

  // =========================================================================
  // ORACLE GROUP 1: Volume Conservation & Deduction Invariants
  // =========================================================================
  describe("Oracle Group 1: Volume Conservation & Deduction Invariants", () => {

    test("1.1 Mathematical Invariant: Net volume <= Gross bounding volume across isolated elements", () => {
      const model = createEmptyModel();
      model.name = "Isolated-Elements-Model";
      const floor = createFloor("fl-1", "ZEMIN", 0, 3.0);
      model.floors.push(floor);

      // Separated column, beam, slab with zero overlap
      const col = createColumn("col1", "fl-1", { x: 0, y: 0 }, 0.40, 0.50, 3.0);
      const beam = createBeam("bm1", "fl-1", { x: 2, y: 2 }, { x: 6, y: 2 }, 0.25, 0.50);
      const slab = createSlab("sl1", "fl-1", [
        { x: 10, y: 10 },
        { x: 14, y: 10 },
        { x: 14, y: 14 },
        { x: 10, y: 14 },
      ], 0.15);

      model.elements.push(col, beam, slab);

      // Verify legacy resolveJunctions and calculateQuantities
      const junctions = resolveJunctions(model);
      assert.equal(junctions.status, "resolved");
      assert.ok(junctions.netVolume !== null);
      assert.ok(junctions.overlapVolume !== null);

      // Expected gross:
      // col: 0.40 * 0.50 * 3.0 = 0.60 m3
      // beam: 0.25 * 0.50 * 4.0 = 0.50 m3
      // slab: 4.0 * 4.0 * 0.15 = 2.40 m3
      // total = 3.50 m3
      assert.ok(Math.abs(junctions.grossVolume - 3.50) < 1e-4);
      assert.ok(Math.abs(junctions.netVolume - 3.50) < 1e-4);
      assert.ok(Math.abs(junctions.overlapVolume - 0.0) < 1e-4);

      // Invariant: V_net <= V_gross
      assert.ok(junctions.netVolume <= junctions.grossVolume);
      assert.ok(Math.abs(junctions.grossVolume - (junctions.netVolume + junctions.overlapVolume)) < 1e-4);

      // Verify calculateFullTakeoff
      const takeoff = calculateFullTakeoff(model, undefined, junctions);
      assert.ok(takeoff.concreteVolumeM3.total > 0);
      assert.ok(Number.isFinite(takeoff.concreteVolumeM3.total));
    });

    test("1.2 Overlap Deduction Invariant: Column-Beam penetration is deducted from lower-priority beam", () => {
      const model = createEmptyModel();
      model.name = "Column-Beam-Junction";
      const floor = createFloor("fl-1", "ZEMIN", 0, 3.0);
      model.floors.push(floor);

      // Column: 0.40m x 0.40m centered at (0,0) from z=0 to 3.0
      const col = createColumn("col1", "fl-1", { x: 0, y: 0 }, 0.40, 0.40, 3.0);

      // Beam: 0.25m wide, 0.50m deep, passing straight through column from x = -2.0 to x = +2.0 at y = 0
      // Beam start (-2, 0), end (2, 0). Length = 4.0m
      const beam = createBeam("bm1", "fl-1", { x: -2, y: 0 }, { x: 2, y: 0 }, 0.25, 0.50);

      model.elements.push(col, beam);

      const junctions = resolveJunctions(model);
      assert.equal(junctions.status, "resolved");

      // Column gross = 0.40 * 0.40 * 3.0 = 0.48 m3
      // Beam gross = 0.25 * 0.50 * 4.0 = 0.50 m3
      // Total gross = 0.98 m3
      const expectedGross = 0.48 + 0.50;
      assert.ok(Math.abs(junctions.grossVolume - expectedGross) < 1e-4);

      // Penetration: length inside column is 0.40m, beam width 0.25m, beam depth 0.50m
      // Penetration volume = 0.40 * 0.25 * 0.50 = 0.050 m3
      const expectedOverlap = 0.050;
      const expectedNet = expectedGross - expectedOverlap; // 0.93 m3

      assert.ok(junctions.netVolume !== null);
      assert.ok(junctions.overlapVolume !== null);
      assert.ok(
        Math.abs(junctions.overlapVolume - expectedOverlap) < 1e-3,
        `Overlap volume ${junctions.overlapVolume} should be close to ${expectedOverlap}`
      );
      assert.ok(
        Math.abs(junctions.netVolume - expectedNet) < 1e-3,
        `Net volume ${junctions.netVolume} should equal ${expectedNet}`
      );

      // Column has priority over beam: column net volume MUST equal column gross volume
      const colNet = junctions.byElement["col1"].netVolume;
      const beamNet = junctions.byElement["bm1"].netVolume;
      assert.ok(Math.abs((colNet ?? 0) - 0.48) < 1e-4, "Column must retain 100% of its volume");
      assert.ok(Math.abs((beamNet ?? 0) - (0.50 - expectedOverlap)) < 1e-3, "Beam must absorb full deduction");
    });

    test("1.3 Beam-Slab Deduction Invariant: Web below slab prevents double-counting slab concrete", () => {
      const model = createEmptyModel();
      model.name = "Beam-Slab-Continuity";
      const floor = createFloor("fl-1", "ZEMIN", 0, 3.0);
      model.floors.push(floor);

      // Slab: 6m x 6m, 15cm thick (Area = 36 m2, Vol = 36 * 0.15 = 5.40 m3)
      const slab = createSlab("sl1", "fl-1", [
        { x: 0, y: 0 },
        { x: 6, y: 0 },
        { x: 6, y: 6 },
        { x: 0, y: 6 },
      ], 0.15);

      // Beam along edge: length = 6.0m, width = 0.25m, height = 0.50m
      // In TS 500 / ideCAD standard: the 15cm slab depth is part of the floor diaphragm.
      // Net beam web below slab: height = 0.50 - 0.15 = 0.35m.
      // Net beam volume: 0.25 * 0.35 * 6.0 = 0.525 m3.
      const beam = createBeam("bm1", "fl-1", { x: 0, y: 0 }, { x: 6, y: 0 }, 0.25, 0.50);

      model.elements.push(slab, beam);

      const takeoff = calculateFullTakeoff(model);

      const slabVol = takeoff.concreteVolumeM3.byElement["slab"];
      const beamVol = takeoff.concreteVolumeM3.byElement["beam"];

      assert.ok(Math.abs(slabVol - 5.40) < 1e-4, `Slab volume should be 5.40 m3, got ${slabVol}`);
      assert.ok(Math.abs(beamVol - 0.525) < 1e-4, `Beam net web volume should be 0.525 m3, got ${beamVol}`);
      assert.ok(
        Math.abs(takeoff.concreteVolumeM3.total - (5.40 + 0.525)) < 1e-4,
        "Total concrete must be sum of non-overlapping slab and beam web"
      );
    });
  });

  // =========================================================================
  // ORACLE GROUP 2: Formwork Physics & Boundary Conditions
  // =========================================================================
  describe("Oracle Group 2: Formwork Physics & Boundary Conditions", () => {

    test("2.1 Raft Foundation Shuttering Invariant: Formwork strictly equals perimeter x thickness (soil = 0)", () => {
      const model = createEmptyModel();
      model.name = "Raft-Foundation-Physics";
      const floor = createFloor("fl-b", "BODRUM", -3.0, 3.0);
      model.floors.push(floor);

      // Rectangular raft foundation: 15m x 25m, thickness 0.65m
      const raftPoly: Point[] = [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 25, y: 15 },
        { x: 0, y: 15 },
      ];
      const raft = createSlab("raft1", "fl-b", raftPoly, 0.65, "Temeller");
      model.elements.push(raft);

      const takeoff = calculateFullTakeoff(model);

      const area = 25 * 15; // 375 m2
      const perimeter = 2 * (25 + 15); // 80 m
      const thickness = 0.65; // m

      // Expected concrete: 375 * 0.65 = 243.75 m3
      const expectedConcrete = area * thickness;
      assert.ok(
        Math.abs(takeoff.concreteVolumeM3.byElement["raft"] - expectedConcrete) < 1e-4,
        `Raft concrete should be ${expectedConcrete} m3`
      );

      // Formwork physics oracle:
      // Formwork must strictly be lateral edge shuttering: P * h_r = 80 * 0.65 = 52.0 m2.
      // Soil contact bottom (375 m2) requires ZERO formwork.
      // Top trowel finish (375 m2) requires ZERO formwork.
      const expectedFormwork = perimeter * thickness; // 52.0 m2
      const actualFormwork = takeoff.formworkAreaM2.byElement["raft"];

      assert.ok(
        Math.abs(actualFormwork - expectedFormwork) < 1e-4,
        `Raft formwork must equal lateral perimeter shuttering (${expectedFormwork} m2), got ${actualFormwork} m2`
      );
      assert.notEqual(actualFormwork, area + expectedFormwork, "Raft formwork must NOT include ground contact");
      assert.notEqual(actualFormwork, 2 * area + expectedFormwork, "Raft formwork must NOT include top finish");
    });

    test("2.2 Non-Convex / L-Shaped Raft Lateral Shuttering Oracle", () => {
      const model = createEmptyModel();
      model.name = "L-Shaped-Raft";
      const floor = createFloor("fl-b", "BODRUM", -2.5, 2.5);
      model.floors.push(floor);

      // L-shaped raft:
      // (0,0) -> (20,0) -> (20,10) -> (10,10) -> (10,18) -> (0,18)
      // Perimeter segments: 20 + 10 + 10 + 8 + 10 + 18 = 76 m
      const lRaftPoly: Point[] = [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 10 },
        { x: 10, y: 10 },
        { x: 10, y: 18 },
        { x: 0, y: 18 },
      ];
      const thickness = 0.80; // 80 cm raft
      const raft = createSlab("raft-L", "fl-b", lRaftPoly, thickness, "Temeller");
      model.elements.push(raft);

      const takeoff = calculateFullTakeoff(model);

      const perimeter = 20 + 10 + 10 + 8 + 10 + 18; // 76 m
      const expectedFormwork = perimeter * thickness; // 76 * 0.80 = 60.80 m2

      assert.ok(
        Math.abs(takeoff.formworkAreaM2.byElement["raft"] - expectedFormwork) < 1e-4,
        `L-shaped raft formwork should be ${expectedFormwork} m2, got ${takeoff.formworkAreaM2.byElement["raft"]}`
      );
    });

    test("2.3 Column & Beam Net Contact Formwork Physics", () => {
      const model = createEmptyModel();
      model.name = "Column-Beam-Formwork-Physics";
      const floor = createFloor("fl-1", "KAT 1", 0, 3.0);
      model.floors.push(floor);

      // Column: 0.40 x 0.60m, height 3.0m
      // 4 vertical shuttered faces: 2 * (0.40 + 0.60) * 3.0 = 6.0 m2
      const col = createColumn("col1", "fl-1", { x: 0, y: 0 }, 0.40, 0.60, 3.0);

      // Beam: width 0.25m, total depth 0.50m, length 5.0m
      // Formwork = bottom soffit (0.25) + 2 exposed side faces below 15cm slab (2 * 0.35 = 0.70)
      // Formwork = (0.25 + 0.70) * 5.0 = 4.75 m2
      const beam = createBeam("bm1", "fl-1", { x: 2, y: 2 }, { x: 7, y: 2 }, 0.25, 0.50);

      model.elements.push(col, beam);

      const takeoff = calculateFullTakeoff(model);

      assert.ok(
        Math.abs(takeoff.formworkAreaM2.byElement["column"] - 6.0) < 1e-4,
        `Column formwork must be 6.0 m2, got ${takeoff.formworkAreaM2.byElement["column"]}`
      );
      assert.ok(
        Math.abs(takeoff.formworkAreaM2.byElement["beam"] - 4.75) < 1e-4,
        `Beam net contact formwork must be 4.75 m2, got ${takeoff.formworkAreaM2.byElement["beam"]}`
      );
    });
  });

  // =========================================================================
  // ORACLE GROUP 3: Rebar Density Bounds & Code Verification
  // =========================================================================
  describe("Oracle Group 3: Rebar Density Bounds & Code Verification", () => {

    test("3.1 Code Density Range: Analytical steel density falls within 70 - 130 kg/m3 for standard frames", () => {
      // Create realistic 3-storey building: 2x2 bays of 5m x 5m
      const model = createParametricBuilding(3, 2, 2, 5.0, 5.0, 3.0);

      const takeoff = calculateFullTakeoff(model);

      const steelDensity = takeoff.summary.steelDensityKgM3;
      const totalConcrete = takeoff.concreteVolumeM3.total;
      const totalRebar = takeoff.rebarTonnage.totalKg;

      assert.ok(totalConcrete > 0, "Total concrete volume must be > 0");
      assert.ok(totalRebar > 0, "Total rebar weight must be > 0");

      // Verify analytical density falls within TS 500 / TBDY 2018 residential bounds (70 - 130 kg/m3)
      assert.ok(
        steelDensity >= 70.0 && steelDensity <= 130.0,
        `Analytical steel density (${steelDensity.toFixed(2)} kg/m3) must be within 70-130 kg/m3`
      );

      // Verify formwork-to-concrete ratio falls within typical structural frame bounds (5.0 - 10.0 m2/m3 for skeletal frames)
      const fwRatio = takeoff.summary.formworkToConcreteRatio;
      assert.ok(
        fwRatio >= 4.0 && fwRatio <= 10.0,
        `Formwork-to-concrete ratio (${fwRatio.toFixed(2)} m2/m3) must be within 4.0-10.0 m2/m3 for skeletal frames`
      );
    });

    test("3.2 Design Result Fed Rebar Takeoff: Integrates structural design engine rebar schedule", () => {
      const model = createParametricBuilding(2, 2, 2, 4.0, 4.0, 3.0);

      // Run structural analysis & concrete design checks
      const analysis = runStructuralAnalysis(model, DEFAULT_ANALYSIS_SETTINGS);
      const design = runConcreteDesignChecks(model, analysis);

      // Run takeoff with designResult
      const takeoff = calculateFullTakeoff(model, design);

      assert.ok(takeoff.rebarTonnage.totalKg > 0);
      assert.ok(takeoff.summary.steelDensityKgM3 >= 60.0 && takeoff.summary.steelDensityKgM3 <= 140.0);

      // Verify that rebar breakdown items reflect actual bar callouts
      const beamItems = takeoff.elementBreakdown.filter(e => e.type === "beam");
      assert.ok(beamItems.length > 0);
      assert.ok(beamItems.every(b => b.rebarKg > 0 && b.rebarText.length > 0));
    });

    test("3.3 Authoritative Mustafa Selvi Reference Model Density Oracle", () => {
      // In the certified reference ideCAD benchmark (METRAJ.pdf):
      // Concrete = 1,334.015 m3
      // Total Rebar = 117,421.93 kg = 117.422 ton
      // Density = 117421.93 / 1334.015 = 88.02 kg/m3
      const refDensity = CERTIFIED_METRAJ_REFERENCE.totalRebarKg / CERTIFIED_METRAJ_REFERENCE.totalConcreteVolumeM3;
      assert.ok(
        refDensity >= 70 && refDensity <= 130,
        `Reference project density ${refDensity.toFixed(2)} kg/m3 must fall in standard range 70-130 kg/m3`
      );
      assert.ok(Math.abs(refDensity - 88.02) < 0.1);

      // Formwork to concrete ratio: 6,681.91 / 1,334.015 = 5.008 m2/m3
      const refFwRatio = CERTIFIED_METRAJ_REFERENCE.totalFormworkAreaM2 / CERTIFIED_METRAJ_REFERENCE.totalConcreteVolumeM3;
      assert.ok(Math.abs(refFwRatio - 5.008) < 0.1);
    });
  });

  // =========================================================================
  // ORACLE GROUP 4: Diameter Partition & Statutory Poz Classification
  // =========================================================================
  describe("Oracle Group 4: Diameter Partition & Statutory Poz Classification", () => {

    test("4.1 Mathematical Invariant: sum(thinKg + thickKg) === totalKg strictly across all models", () => {
      // Test on 2 different parametric models
      const models = [
        createParametricBuilding(1, 1, 1, 4.0, 4.0),
        createParametricBuilding(4, 2, 2, 5.0, 5.0),
      ];

      for (const m of models) {
        const takeoff = calculateFullTakeoff(m);
        const { thinKg, thickKg, totalKg } = takeoff.rebarTonnage;

        assert.ok(totalKg > 0);
        assert.ok(thinKg > 0);
        assert.ok(thickKg > 0);

        const sumThinThick = thinKg + thickKg;
        const delta = Math.abs(sumThinThick - totalKg);
        assert.ok(
          delta < 1e-4,
          `thinKg (${thinKg}) + thickKg (${thickKg}) = ${sumThinThick} must equal totalKg (${totalKg}), delta = ${delta}`
        );

        // Story level partition invariant
        for (const [storyName, story] of Object.entries(takeoff.rebarTonnage.byFloor)) {
          const storySum = story.thinKg + story.thickKg;
          assert.ok(
            Math.abs(storySum - story.rebarKg) < 1e-4,
            `Story ${storyName}: thinKg + thickKg (${storySum}) must equal rebarKg (${story.rebarKg})`
          );
        }
      }
    });

    test("4.2 Statutory Diameter Classification: Ø <= 12 is thin (Poz 15.160.1003), Ø >= 14 is thick (Poz 15.160.1004)", () => {
      const model = createParametricBuilding(2, 2, 2, 5.0, 5.0);
      const takeoff = calculateFullTakeoff(model);

      const byDia = takeoff.rebarTonnage.byDiameter;

      let expectedThin = 0;
      let expectedThick = 0;

      for (const [diaStr, wt] of Object.entries(byDia)) {
        const dia = Number(diaStr);
        if (dia <= 12) {
          expectedThin += wt;
        } else {
          expectedThick += wt;
        }
      }

      assert.ok(
        Math.abs(takeoff.rebarTonnage.thinKg - expectedThin) < 1e-4,
        "thinKg must be exactly the sum of diameters <= 12"
      );
      assert.ok(
        Math.abs(takeoff.rebarTonnage.thickKg - expectedThick) < 1e-4,
        "thickKg must be exactly the sum of diameters >= 14"
      );
    });

    test("4.3 TS 708 Unit Weight Physical Invariant Check", () => {
      // Theoretical weight formula: w = (pi * d^2 / 4) * 7850 kg/m3 / 1e6
      for (const [diaStr, catalogWeight] of Object.entries(REBAR_UNIT_WEIGHTS)) {
        const d = Number(diaStr);
        const theoreticalWeight = (Math.PI * (d / 1000) * (d / 1000) / 4) * 7850;
        const delta = Math.abs(catalogWeight - theoreticalWeight) / theoreticalWeight;
        // Standard TS 708 catalog weights match theoretical nominal bar weight within 1%
        assert.ok(
          delta < 0.01,
          `Diameter Ø${d} catalog weight ${catalogWeight} kg/m deviates ${(delta * 100).toFixed(2)}% from physics`
        );
      }
    });
  });

  // =========================================================================
  // ORACLE GROUP 5: Multi-Storey Scaling Monotonicity & Numerical Stability
  // =========================================================================
  describe("Oracle Group 5: Multi-Storey Scaling Monotonicity & Numerical Stability", () => {

    test("5.1 Storey Scaling Monotonicity: Quantities strictly increase from 1F -> 3F -> 5F -> 10F -> 20F", () => {
      const floorSteps = [1, 3, 5, 10, 20];
      const results: { floors: number; concrete: number; formwork: number; rebar: number }[] = [];

      for (const f of floorSteps) {
        const model = createParametricBuilding(f, 2, 2, 4.0, 4.0, 3.0);
        const takeoff = calculateFullTakeoff(model);

        // Verify no NaNs, infinities, or negative values
        assert.ok(Number.isFinite(takeoff.concreteVolumeM3.total), `Concrete for ${f}F must be finite`);
        assert.ok(Number.isFinite(takeoff.formworkAreaM2.total), `Formwork for ${f}F must be finite`);
        assert.ok(Number.isFinite(takeoff.rebarTonnage.totalKg), `Rebar for ${f}F must be finite`);

        assert.ok(takeoff.concreteVolumeM3.total > 0, `Concrete for ${f}F must be > 0`);
        assert.ok(takeoff.formworkAreaM2.total > 0, `Formwork for ${f}F must be > 0`);
        assert.ok(takeoff.rebarTonnage.totalKg > 0, `Rebar for ${f}F must be > 0`);

        results.push({
          floors: f,
          concrete: takeoff.concreteVolumeM3.total,
          formwork: takeoff.formworkAreaM2.total,
          rebar: takeoff.rebarTonnage.totalKg,
        });
      }

      // Assert strict monotonicity: R[i+1] > R[i]
      for (let i = 0; i < results.length - 1; i++) {
        const cur = results[i];
        const next = results[i + 1];

        assert.ok(
          next.concrete > cur.concrete,
          `Concrete volume must strictly increase: ${next.floors}F (${next.concrete}) > ${cur.floors}F (${cur.concrete})`
        );
        assert.ok(
          next.formwork > cur.formwork,
          `Formwork area must strictly increase: ${next.floors}F (${next.formwork}) > ${cur.floors}F (${cur.formwork})`
        );
        assert.ok(
          next.rebar > cur.rebar,
          `Rebar weight must strictly increase: ${next.floors}F (${next.rebar}) > ${cur.floors}F (${cur.rebar})`
        );

        // Verify approximately linear scaling with number of storeys (ratio per floor stays constant within 2%)
        const curRate = cur.concrete / cur.floors;
        const nextRate = next.concrete / next.floors;
        const deltaRate = Math.abs(curRate - nextRate) / curRate;
        assert.ok(
          deltaRate < 0.02,
          `Linear rate per floor should be constant within 2%, got delta ${(deltaRate * 100).toFixed(2)}%`
        );
      }
    });

    test("5.2 Asymmetric Setback Tower: Monotonicity and Stability under Irregular Floor Plans", () => {
      const model = createEmptyModel();
      model.name = "Asymmetric-Setback-Tower";

      // 6 storeys total:
      // Storeys 1-3: Base podium (10m x 10m)
      // Storeys 4-6: Setback tower (5m x 5m)
      for (let f = 0; f < 6; f++) {
        const floorId = `floor-${f + 1}`;
        const floor = createFloor(floorId, `KAT ${f + 1}`, f * 3.0, 3.0);
        model.floors.push(floor);

        const isPodium = f < 3;
        const size = isPodium ? 10.0 : 5.0;

        // 4 corner columns
        model.elements.push(
          createColumn(`c1-f${f}`, floorId, { x: 0, y: 0 }, 0.40, 0.40, 3.0),
          createColumn(`c2-f${f}`, floorId, { x: size, y: 0 }, 0.40, 0.40, 3.0),
          createColumn(`c3-f${f}`, floorId, { x: size, y: size }, 0.40, 0.40, 3.0),
          createColumn(`c4-f${f}`, floorId, { x: 0, y: size }, 0.40, 0.40, 3.0)
        );

        // Perimeter beams
        model.elements.push(
          createBeam(`b1-f${f}`, floorId, { x: 0, y: 0 }, { x: size, y: 0 }),
          createBeam(`b2-f${f}`, floorId, { x: size, y: 0 }, { x: size, y: size }),
          createBeam(`b3-f${f}`, floorId, { x: size, y: size }, { x: 0, y: size }),
          createBeam(`b4-f${f}`, floorId, { x: 0, y: size }, { x: 0, y: 0 })
        );

        // Slab
        const poly: Point[] = [
          { x: 0, y: 0 },
          { x: size, y: 0 },
          { x: size, y: size },
          { x: 0, y: size },
        ];
        model.elements.push(createSlab(`sl-f${f}`, floorId, poly, 0.15));
      }

      const takeoff = calculateFullTakeoff(model);

      // Verify no NaNs or Infinities
      assert.ok(Number.isFinite(takeoff.concreteVolumeM3.total));
      assert.ok(Number.isFinite(takeoff.formworkAreaM2.total));
      assert.ok(Number.isFinite(takeoff.rebarTonnage.totalKg));

      // Check storey totals: Podium storeys must have larger concrete volume than Tower storeys
      const kat1Concrete = takeoff.concreteVolumeM3.byFloor["KAT 1"];
      const kat4Concrete = takeoff.concreteVolumeM3.byFloor["KAT 4"];
      assert.ok(
        kat1Concrete > kat4Concrete,
        `Podium KAT 1 (${kat1Concrete} m3) must exceed setback KAT 4 (${kat4Concrete} m3)`
      );

      // Verify element breakdown items match total element count
      assert.equal(takeoff.elementBreakdown.length, model.elements.length);
    });

    test("5.3 Empty / Minimalist Edge Case: Zero Elements gracefully handled", () => {
      const emptyModel = createEmptyModel();
      emptyModel.floors.push(createFloor("fl-0", "Zemin", 0, 3.0));

      const takeoff = calculateFullTakeoff(emptyModel);

      assert.equal(takeoff.concreteVolumeM3.total, 0);
      assert.equal(takeoff.formworkAreaM2.total, 0);
      assert.equal(takeoff.rebarTonnage.totalKg, 0);
      assert.equal(takeoff.summary.steelDensityKgM3, 0);
      assert.equal(takeoff.summary.formworkToConcreteRatio, 0);
      assert.equal(takeoff.elementBreakdown.length, 0);
      assert.ok(Array.isArray(takeoff.assumptions));
    });
  });

  // =========================================================================
  // ORACLE GROUP 6: End-to-End PDF Export Consistency & Integrity
  // =========================================================================
  describe("Oracle Group 6: End-to-End PDF Export Consistency & Integrity", () => {

    test("6.1 Quantity Report PDF Buffer Integrity: Produces valid non-empty PDF binary matching takeoff", async () => {
      const model = createParametricBuilding(3, 2, 2, 5.0, 5.0);
      const takeoff = calculateFullTakeoff(model);

      const pdfBytes = await generateQuantityReportPDF(model, takeoff, {
        projectName: "Oracles Empirical Test",
        author: "Empirical Challenger M5",
      });

      assert.ok(pdfBytes instanceof Uint8Array);
      assert.ok(pdfBytes.byteLength > 1000, `PDF bytes length ${pdfBytes.byteLength} must be > 1000 bytes`);

      // Verify PDF Magic Bytes (%PDF-1.)
      const magic = String.fromCharCode(...pdfBytes.slice(0, 5));
      assert.equal(magic, "%PDF-");
    });

    test("6.2 Static Report PDF Buffer Integrity: Full 19 chapters generate without error", async () => {
      const model = createDemoModel();
      const analysis = runStructuralAnalysis(model, DEFAULT_ANALYSIS_SETTINGS);
      const design = runConcreteDesignChecks(model, analysis);

      const pdfBytes = await generateStaticReportPDF(model, analysis, design, {
        projectName: "Full Engineering Static Report",
        engineer: "Empirical Challenger",
      });

      assert.ok(pdfBytes instanceof Uint8Array);
      assert.ok(pdfBytes.byteLength > 10000, `Static Report PDF length ${pdfBytes.byteLength} must be substantial (>10 KB)`);
      const magic = String.fromCharCode(...pdfBytes.slice(0, 5));
      assert.equal(magic, "%PDF-");
    });

    test("6.3 Element Breakdown Sum Invariance in Track B", () => {
      const model = createParametricBuilding(3, 2, 2, 4.0, 4.0);
      const takeoff = calculateFullTakeoff(model);

      const sumElemConcrete = takeoff.elementBreakdown.reduce((s, e) => s + e.concreteM3, 0);
      const sumElemFormwork = takeoff.elementBreakdown.reduce((s, e) => s + e.formworkM2, 0);
      const sumElemRebar = takeoff.elementBreakdown.reduce((s, e) => s + e.rebarKg, 0);

      assert.ok(
        Math.abs(sumElemConcrete - takeoff.concreteVolumeM3.total) < 1e-4,
        "Sum of element breakdown concrete must equal total concrete volume"
      );
      assert.ok(
        Math.abs(sumElemFormwork - takeoff.formworkAreaM2.total) < 1e-4,
        "Sum of element breakdown formwork must equal total formwork area"
      );
      assert.ok(
        Math.abs(sumElemRebar - takeoff.rebarTonnage.totalKg) < 1e-4,
        "Sum of element breakdown rebar must equal total rebar tonnage"
      );
    });
  });
});
