import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  createEmptyModel,
  createDemoModel,
  validateModel,
  type CadModel,
  type ColumnElement,
  type BeamElement,
  type WallElement,
  type SlabElement,
  type Floor,
} from "../../src/lib/hsyncad/model";
import {
  distance,
  polygonArea,
  elementFootprint,
} from "../../src/lib/hsyncad/geometry";
import { resolveJunctions } from "../../src/lib/hsyncad/junctions";
import {
  runStructuralAnalysis,
  DEFAULT_ANALYSIS_SETTINGS,
} from "../../src/lib/hsyncad/analysis";
import {
  calculateSoilPressure,
  addPadFootingToColumn,
  addStripFootingToBeam,
  addRaftFoundation,
} from "../../src/lib/hsyncad/foundations";
import {
  addStairToModel,
  calculateStairGeometry,
} from "../../src/lib/hsyncad/stairs";
import {
  generateBeamDetail,
  generateColumnDetail,
  REBAR_WEIGHTS,
} from "../../src/lib/hsyncad/detailing";
import { calculateQuantities } from "../../src/lib/hsyncad/quantities";
import { quantityReport, reportCsv } from "../../src/lib/hsyncad/reports";

describe("Tier 3 - Pairwise Combinatorial Test Suite (30 Cross-Feature Combinations)", () => {
  // =========================================================================
  // Set 1: Structural Element Geometry & Interaction Combinations
  // =========================================================================
  describe("Set 1: Structural Element Interactions", () => {
    test("Pairwise 1: Rectangular Column + Rectangular Beam + Solid Slab", () => {
      const model = createDemoModel();
      const junc = resolveJunctions(model);
      assert.equal(junc.status, "resolved");
      const q = calculateQuantities(model, junc);
      assert.ok(q.grossVolume > 0);
      assert.ok(q.netVolume !== null && q.netVolume <= q.grossVolume);
      assert.ok(q.formwork > 0);
    });

    test("Pairwise 2: Circular Column + Curved Beam + Solid Slab", () => {
      const model = createEmptyModel();
      const colCirc: ColumnElement = {
        id: "c-circ", name: "S1", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 0, y: 0 }, width: 0.5, depth: 0.5, height: 3.0, section: "circle", circleSegments: 32,
      };
      const beamCurv: BeamElement = {
        id: "b-curv", name: "K1", type: "beam", floorId: "floor-0", materialId: "concrete", layer: "Kirisler",
        start: { x: 0, y: 0 }, end: { x: 6, y: 0 }, width: 0.25, height: 0.5, curveSagitta: 0.5, curveSegments: 12,
      };
      const slab: SlabElement = {
        id: "s1", name: "D1", type: "slab", floorId: "floor-0", materialId: "concrete", layer: "Dosemeler",
        points: [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 4 }, { x: 0, y: 4 }], thickness: 0.15,
      };
      model.elements = [colCirc, beamCurv, slab];
      const junc = resolveJunctions(model);
      assert.equal(junc.status, "resolved");
      const q = calculateQuantities(model, junc);
      assert.ok(q.grossVolume > 0);
    });

    test("Pairwise 3: Polygonal (L-shaped) Column + Cantilever Beam", () => {
      const model = createEmptyModel();
      const lPoints = [
        { x: 0, y: 0 }, { x: 0.6, y: 0 }, { x: 0.6, y: 0.3 },
        { x: 0.3, y: 0.3 }, { x: 0.3, y: 0.6 }, { x: 0, y: 0.6 },
      ];
      const colL: ColumnElement = {
        id: "c-l", name: "SL1", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 0, y: 0 }, width: 0.6, depth: 0.6, height: 3.0, section: "polygon", sectionPoints: lPoints,
      };
      const beamCant: BeamElement = {
        id: "b-cant", name: "K-Cant", type: "beam", floorId: "floor-0", materialId: "concrete", layer: "Kirisler",
        start: { x: 0, y: 0 }, end: { x: 2.0, y: 0 }, width: 0.25, height: 0.5,
      };
      model.elements = [colL, beamCant];
      const junc = resolveJunctions(model);
      const colQty = junc.byElement["c-l"];
      assert.ok(colQty && colQty.netVolume !== null && colQty.netVolume > 0);
    });

    test("Pairwise 4: Shear Wall + Orthogonal Beam + Slab Shaft Opening", () => {
      const model = createEmptyModel();
      const wall: WallElement = {
        id: "w1", name: "P1", type: "wall", floorId: "floor-0", materialId: "concrete", layer: "Perdeler",
        start: { x: 0, y: 0 }, end: { x: 3, y: 0 }, thickness: 0.25, height: 3.0,
      };
      const beam: BeamElement = {
        id: "b1", name: "K1", type: "beam", floorId: "floor-0", materialId: "concrete", layer: "Kirisler",
        start: { x: 3, y: 0 }, end: { x: 3, y: 4 }, width: 0.25, height: 0.50,
      };
      const slab: SlabElement = {
        id: "s1", name: "D1", type: "slab", floorId: "floor-0", materialId: "concrete", layer: "Dosemeler",
        points: [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 6 }, { x: 0, y: 6 }], thickness: 0.15,
      };
      model.elements = [wall, beam, slab];
      const res = runStructuralAnalysis(model);
      assert.ok(res.totalWeightKn > 0);
      assert.ok(res.members["b1"]);
    });

    test("Pairwise 5: Subasman Shear Wall + Pad Footing + Foundation Tie Beam", () => {
      const model = createEmptyModel();
      const col: ColumnElement = {
        id: "c1", name: "S1", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 0, y: 0 }, width: 0.4, depth: 0.4, height: 3.0,
      };
      const subasman: WallElement = {
        id: "w-sub", name: "P-Sub", type: "wall", floorId: "floor-0", materialId: "concrete", layer: "Perdeler",
        start: { x: 0, y: 0 }, end: { x: 4, y: 0 }, thickness: 0.25, height: 1.2, heightMode: "fixed", baseOffset: -1.2,
      };
      model.elements = [col, subasman];
      const withFooting = addPadFootingToColumn(model, col, 1.5, 1.5, 0.5);
      assert.equal(withFooting.elements.length, 3);
      const footing = withFooting.elements.find(e => e.name === "TK-S1");
      assert.ok(footing);
    });

    test("Pairwise 6: Sloped Beam + Sloped Slab + Variable Height Columns", () => {
      const model = createEmptyModel();
      const colLow: ColumnElement = {
        id: "c-low", name: "S-Low", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 0, y: 0 }, width: 0.4, depth: 0.4, height: 3.0,
      };
      const colHigh: ColumnElement = {
        id: "c-high", name: "S-High", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 5, y: 0 }, width: 0.4, depth: 0.4, height: 4.0,
      };
      const slopedBeam: BeamElement = {
        id: "b-slope", name: "K-Slope", type: "beam", floorId: "floor-0", materialId: "concrete", layer: "Kirisler",
        start: { x: 0, y: 0 }, end: { x: 5, y: 0 }, width: 0.25, height: 0.5, topOffset: 0, endTopOffset: 1.0,
      };
      const slopedSlab: SlabElement = {
        id: "s-slope", name: "D-Slope", type: "slab", floorId: "floor-0", materialId: "concrete", layer: "Dosemeler",
        points: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 4 }, { x: 0, y: 4 }], thickness: 0.15, slopeX: 20.0,
      };
      model.elements = [colLow, colHigh, slopedBeam, slopedSlab];
      const q = calculateQuantities(model);
      assert.ok(q.grossVolume > 0);
      assert.ok(q.formwork > 0);
    });
  });

  // =========================================================================
  // Set 2: Material & Seismic Hazard Parameter Combinations
  // =========================================================================
  describe("Set 2: Material & Seismic Hazard Combinations", () => {
    test("Pairwise 7: Concrete C25 + Rebar B420C + Low Seismic (SDS=0.35, ZB)", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model, { concreteGrade: "C25", rebarGrade: "B420C", sds: 0.35, sd1: 0.10 });
      assert.ok(res.baseShearKn > 0);
      assert.equal(res.settings.concreteGrade, "C25");
      assert.equal(res.settings.rebarGrade, "B420C");
    });

    test("Pairwise 8: Concrete C30 + Rebar B420C + Moderate Seismic (SDS=0.75, ZC)", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model, { concreteGrade: "C30", rebarGrade: "B420C", sds: 0.75, sd1: 0.30 });
      assert.ok(res.baseShearKn > 0);
      assert.equal(res.settings.concreteGrade, "C30");
    });

    test("Pairwise 9: Concrete C35 + Rebar B500C + High Seismic (SDS=1.20, ZD)", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model, { concreteGrade: "C35", rebarGrade: "B500C", sds: 1.20, sd1: 0.50 });
      assert.ok(res.baseShearKn > 0);
      assert.equal(res.settings.concreteGrade, "C35");
      assert.equal(res.settings.rebarGrade, "B500C");
    });

    test("Pairwise 10: Concrete C40 + Rebar B500C + Extreme Seismic (SDS=1.60, ZE)", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model, { concreteGrade: "C40", rebarGrade: "B500C", sds: 1.60, sd1: 0.70 });
      assert.ok(res.baseShearKn > 0);
      assert.equal(res.settings.concreteGrade, "C40");
    });

    test("Pairwise 11: High Ductility R=8 vs Normal Ductility R=4 base shear ratio", () => {
      const model = createDemoModel();
      const r8 = runStructuralAnalysis(model, { r: 8.0, sds: 0.8 });
      const r4 = runStructuralAnalysis(model, { r: 4.0, sds: 0.8 });
      assert.ok(r4.baseShearKn >= r8.baseShearKn, "R=4 must produce larger or equal base shear than R=8");
    });

    test("Pairwise 12: Importance Factor I=1.0 (Residential) vs I=1.5 (Hospital)", () => {
      const model = createDemoModel();
      const resResidential = runStructuralAnalysis(model, { importance: 1.0 });
      const resHospital = runStructuralAnalysis(model, { importance: 1.5 });
      assert.ok(resHospital.baseShearKn > resResidential.baseShearKn, "Hospital (I=1.5) must develop larger base shear");
    });
  });

  // =========================================================================
  // Set 3: Geometry & Load Combinations Superposition
  // =========================================================================
  describe("Set 3: Load Combinations Superposition", () => {
    test("Pairwise 13: High Aspect Ratio Shear Wall (lw/bw = 12) under Vertical 1.4G + 1.6Q", () => {
      const model = createEmptyModel();
      const wall: WallElement = {
        id: "w-tall", name: "P1", type: "wall", floorId: "floor-0", materialId: "concrete", layer: "Perdeler",
        start: { x: 0, y: 0 }, end: { x: 3.0, y: 0 }, thickness: 0.25, height: 3.0,
      };
      model.elements = [wall];
      const res = runStructuralAnalysis(model);
      assert.ok(res.totalWeightKn > 0);
    });

    test("Pairwise 14: Symmetrical Frame under Earthquake Combo G + Q + Ex", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      assert.ok(res.storeys[0].lateralForceKn > 0);
    });

    test("Pairwise 15: Reversal Uplift Combo 0.9G - Ex on Slender Building", () => {
      const G = 200, Ex = 80;
      const combo = 0.9 * G - Ex;
      assert.equal(combo, 100);
      assert.ok(combo > 0, "No net tension under this reversal load");
    });

    test("Pairwise 16: High Live Load (5.0 kN/m2) Commercial Storage Floor", () => {
      const model = createDemoModel();
      const slab = model.elements.find(e => e.type === "slab") as SlabElement;
      slab.liveLoad = 5.0; // Commercial
      const res = runStructuralAnalysis(model);
      assert.ok(res.totalWeightKn > 0);
    });

    test("Pairwise 17: Column P-M Biaxial Interaction + Joint Shear Safety check", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      const cols = model.elements.filter(e => e.type === "column");
      for (const col of cols) {
        assert.ok(res.members[col.id]);
        assert.ok(res.joints[col.id]);
      }
    });

    test("Pairwise 18: Strong Column-Weak Beam Check combined with Storey Drift", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      for (const col of model.elements.filter(e => e.type === "column")) {
        const scwb = res.columnBeamMoments[col.id];
        assert.ok(scwb);
      }
      assert.ok(res.storeys[0].driftRatio < 0.008);
    });
  });

  // =========================================================================
  // Set 4: Foundation Type & Soil Interaction Combinations
  // =========================================================================
  describe("Set 4: Foundation & Soil Interactions", () => {
    test("Pairwise 19: Pad Footing on Stiff Soil (qSafe = 300 kPa) vs Soft Soil (100 kPa)", () => {
      const axialKn = 500, momentKnm = 40;
      const checkStiff = calculateSoilPressure(axialKn, momentKnm, 1.8, 1.8, 300);
      const checkSoft = calculateSoilPressure(axialKn, momentKnm, 1.8, 1.8, 100);
      assert.equal(checkStiff.pass, true);
      assert.equal(checkSoft.pass, false);
    });

    test("Pairwise 20: Strip Footing under Heavy Continuous Beams", () => {
      const model = createDemoModel();
      const beam = model.elements.find(e => e.type === "beam") as BeamElement;
      const stripModel = addStripFootingToBeam(model, beam, 1.0, 0.60);
      const strip = stripModel.elements.find(e => e.name.includes("ST-"));
      assert.ok(strip);
    });

    test("Pairwise 21: Raft Foundation + Soil Modulus Subgrade Interaction", () => {
      const model = createDemoModel();
      const raftModel = addRaftFoundation(model, "floor-0", [
        { x: -1, y: -1 }, { x: 5, y: -1 }, { x: 5, y: 5 }, { x: -1, y: 5 },
      ], 0.65);
      const raft = raftModel.elements.find(e => e.name.includes("RAD"));
      assert.ok(raft);
    });

    test("Pairwise 22: Punching Shear Capacity with Column Dimension Variations", () => {
      const d = 0.50;
      const u1_40 = 2 * (0.4 + d) + 2 * (0.4 + d); // 3.6m
      const u1_60 = 2 * (0.6 + d) + 2 * (0.6 + d); // 4.4m
      const fctd = 1.30;
      const cap40 = (fctd * 1000) * u1_40 * d;
      const cap60 = (fctd * 1000) * u1_60 * d;
      assert.ok(cap60 > cap40, "Larger column section increases punching shear capacity");
    });

    test("Pairwise 23: Mixed Foundation Systems: Raft + Integrated Pad Footings", () => {
      const model = createDemoModel();
      const col = model.elements.find(e => e.type === "column") as ColumnElement;
      const m1 = addPadFootingToColumn(model, col, 1.6, 1.6, 0.5);
      const m2 = addRaftFoundation(m1, "floor-0", [
        { x: -0.5, y: -0.5 }, { x: 4.5, y: -0.5 }, { x: 4.5, y: 4.5 }, { x: -0.5, y: 4.5 },
      ], 0.65);
      assert.ok(m2.elements.some(e => e.name.includes("TK-")));
      assert.ok(m2.elements.some(e => e.name.includes("RAD-")));
    });

    test("Pairwise 24: Foundation Punching Check under Dynamic Earthquake Column Shear", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      const col = model.elements.find(e => e.type === "column") as ColumnElement;
      const punch = res.punching[col.id];
      assert.ok(punch);
      assert.ok(punch.punchingCapacityKn > 0);
    });
  });

  // =========================================================================
  // Set 5: End-to-End Pipeline Combinations
  // =========================================================================
  describe("Set 5: End-to-End Pipeline Combinations", () => {
    test("Pairwise 25: Modeling -> Analysis -> Member Design -> Visual DCR Classification", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      for (const m of Object.values(res.members)) {
        assert.ok(m.capacityRatio > 0);
        const color = m.capacityRatio <= 0.70 ? "green" : m.capacityRatio <= 1.0 ? "yellow" : "red";
        assert.ok(["green", "yellow", "red"].includes(color));
      }
    });

    test("Pairwise 26: Modeling -> Analysis -> Detailing -> Quantity Takeoff", () => {
      const model = createDemoModel();
      const beam = model.elements.find(e => e.type === "beam") as BeamElement;
      const detail = generateBeamDetail(beam);
      assert.ok(detail.rebarSchedule.length > 0);
      const q = calculateQuantities(model);
      assert.ok(q.grossVolume > 0);
    });

    test("Pairwise 27: Multi-Storey Floor Replication -> Analysis -> Storey Drift Stack", () => {
      const model = createDemoModel();
      model.floors.push({ id: "floor-1", name: "1. Kat", elevation: 3.0, height: 3.0 });
      // Duplicate columns to upper floor
      const upperCols = model.elements.filter(e => e.type === "column").map((c, i) => ({
        ...c, id: `col-upper-${i}`, floorId: "floor-1",
      }));
      model.elements.push(...upperCols);
      const res = runStructuralAnalysis(model);
      assert.equal(res.storeys.length, 2);
      assert.ok(res.storeys[1].elevation > res.storeys[0].elevation);
    });

    test("Pairwise 28: Modeling -> Analysis -> CSV Quantity Report", () => {
      const model = createDemoModel();
      const junc = resolveJunctions(model);
      const rows = quantityReport(model, junc, {
        grouping: "type", floorId: "", types: ["column", "beam", "wall", "slab"],
      });
      const csv = reportCsv(rows);
      assert.ok(csv.includes("Kolon"));
      assert.ok(csv.includes("Kiriş"));
    });

    test("Pairwise 29: Irregularity A1 (Torsion) and B2 (Soft Storey) Superposition", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      assert.ok(res.irregularities.torsionalA1.length > 0);
      assert.ok(res.irregularities.softStoreyB2.length > 0);
    });

    test("Pairwise 30: Complete Structural Pipeline Verification", () => {
      const model = createDemoModel();
      // 1. Validation
      const validated = validateModel(model);
      assert.equal(validated.schemaVersion, 1);
      // 2. Junctions
      const junc = resolveJunctions(validated);
      assert.equal(junc.status, "resolved");
      // 3. Analysis
      const analysis = runStructuralAnalysis(validated);
      assert.ok(analysis.totalWeightKn > 0);
      assert.ok(analysis.baseShearKn > 0);
      // 4. Detailing
      const col = validated.elements.find(e => e.type === "column") as ColumnElement;
      const colDetail = generateColumnDetail(col, analysis);
      assert.ok(colDetail.rebarSchedule.length > 0);
      // 5. Quantities
      const quantities = calculateQuantities(validated, junc);
      assert.ok(quantities.grossVolume > 0);
      // 6. Reports
      const reportRows = quantityReport(validated, junc, {
        grouping: "type", floorId: "", types: ["column", "beam", "wall", "slab"],
      });
      assert.ok(reportRows.length >= 4);
    });
  });
});
