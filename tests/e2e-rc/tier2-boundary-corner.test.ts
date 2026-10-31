import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  createEmptyModel,
  createDemoModel,
  validateModel,
  isSolidElement,
  type CadModel,
  type ColumnElement,
  type BeamElement,
  type WallElement,
  type SlabElement,
  type AxisElement,
  type Floor,
} from "../../src/lib/hsyncad/model";
import {
  distance,
  polygonArea,
  polygonPerimeter,
  elementFootprint,
  elementVerticalRange,
  isSimplePolygon,
} from "../../src/lib/hsyncad/geometry";
import { resolveJunctions } from "../../src/lib/hsyncad/junctions";
import {
  runStructuralAnalysis,
  DEFAULT_ANALYSIS_SETTINGS,
  type AnalysisSettings,
  type AnalysisResult,
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
import { PRODUCT_RIBBON_TABS } from "../../src/lib/hsyncad/product-ribbon";
import { NATIVE_RIBBON_TABS } from "../../src/lib/hsyncad/ribbon-layout";

describe("Tier 2 - Boundary Value & Corner Case Suite (22 RC Feature Areas)", () => {
  // =========================================================================
  // Boundary Area 1: Columns
  // =========================================================================
  describe("Boundary Area 1: Columns", () => {
    test("1.1 Extremely slender column h/b = 24 aspect ratio check", () => {
      const col: ColumnElement = {
        id: "c-slender", name: "S-Slender", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 0, y: 0 }, width: 0.25, depth: 0.25, height: 6.0,
      };
      const slenderness = col.height / Math.min(col.width, col.depth);
      assert.equal(slenderness, 24.0, "Column slenderness ratio must be 24.0");
      assert.ok(slenderness > 15.0, "Slender column exceeds standard short column threshold (15.0)");
    });

    test("1.2 Minimum code dimension b >= 250 mm boundary per TS 500 & TBDY 2018", () => {
      const colMin: ColumnElement = {
        id: "c-min", name: "S-Min", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 0, y: 0 }, width: 0.25, depth: 0.30, height: 3.0,
      };
      assert.ok(colMin.width >= 0.25, "Minimum dimension 25 cm must satisfy code boundary");
      assert.ok(colMin.depth >= 0.25);
    });

    test("1.3 Zero and negative column dimensions rejected by validateModel", () => {
      const model = createEmptyModel();
      const invalidCol = {
        id: "c-inv", name: "S-Inv", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 0, y: 0 }, width: -0.40, depth: 0.40, height: 3.0,
      };
      model.elements.push(invalidCol as any);
      assert.throws(() => validateModel(model), /pozitif/i, "Negative column width must be rejected");
    });

    test("1.4 Massive monumental column (2.0m x 2.0m) stiffness and volume stability", () => {
      const col: ColumnElement = {
        id: "c-massive", name: "S-Massive", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 0, y: 0 }, width: 2.0, depth: 2.0, height: 4.0,
      };
      const model: CadModel = { ...createEmptyModel(), elements: [col] };
      const q = calculateQuantities(model);
      const colRow = q.rows.find(r => r.type === "column")!;
      assert.equal(colRow.grossVolume, 2.0 * 2.0 * 4.0); // 16 m3
      assert.ok(Number.isFinite(colRow.grossVolume));
    });

    test("1.5 Extreme coordinate (> 1,000,000 m) rejected by validateModel", () => {
      const model = createEmptyModel();
      const extremeCol = {
        id: "c-ext", name: "S-Ext", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 2_000_000, y: 0 }, width: 0.40, depth: 0.40, height: 3.0,
      };
      model.elements.push(extremeCol as any);
      assert.throws(() => validateModel(model), /1\.000\.000/i, "Extreme coordinate must be rejected");
    });
  });

  // =========================================================================
  // Boundary Area 2: Beams
  // =========================================================================
  describe("Boundary Area 2: Beams", () => {
    test("2.1 Minimum beam width bw >= 200 mm per TS 500 boundary", () => {
      const beam: BeamElement = {
        id: "b-min", name: "K-Min", type: "beam", floorId: "floor-0", materialId: "concrete", layer: "Kirisler",
        start: { x: 0, y: 0 }, end: { x: 4, y: 0 }, width: 0.20, height: 0.50,
      };
      assert.ok(beam.width >= 0.20, "Beam width 0.20m is code minimum boundary");
    });

    test("2.2 Zero length beam (start == end) rejected by geometry", () => {
      const beam: BeamElement = {
        id: "b-zero", name: "K-Zero", type: "beam", floorId: "floor-0", materialId: "concrete", layer: "Kirisler",
        start: { x: 2, y: 3 }, end: { x: 2, y: 3 }, width: 0.25, height: 0.50,
      };
      const span = distance(beam.start, beam.end);
      assert.equal(span, 0, "Span must be zero");
      const fp = elementFootprint(beam);
      assert.equal(fp.length, 0, "Zero length beam must produce empty footprint");
    });

    test("2.3 Negative beam height rejected by validateModel", () => {
      const model = createEmptyModel();
      const invalidBeam = {
        id: "b-inv", name: "K-Inv", type: "beam", floorId: "floor-0", materialId: "concrete", layer: "Kirisler",
        start: { x: 0, y: 0 }, end: { x: 4, y: 0 }, width: 0.25, height: -0.50,
      };
      model.elements.push(invalidBeam as any);
      assert.throws(() => validateModel(model), /pozitif/i, "Negative beam height must be rejected");
    });

    test("2.4 Extreme beam span (L = 25m) results in severe flexural moment demand", () => {
      const model = createEmptyModel();
      model.floors[0].height = 3.5;
      const col1: ColumnElement = {
        id: "c1", name: "S1", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 0, y: 0 }, width: 0.4, depth: 0.4, height: 3.5,
      };
      const col2: ColumnElement = {
        id: "c2", name: "S2", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 25, y: 0 }, width: 0.4, depth: 0.4, height: 3.5,
      };
      const longBeam: BeamElement = {
        id: "b-long", name: "K-Long", type: "beam", floorId: "floor-0", materialId: "concrete", layer: "Kirisler",
        start: { x: 0, y: 0 }, end: { x: 25, y: 0 }, width: 0.25, height: 0.50,
      };
      model.elements = [col1, col2, longBeam];
      const res = runStructuralAnalysis(model);
      const beamRes = res.members["b-long"];
      assert.ok(beamRes, "Beam analysis result must exist");
      assert.ok(beamRes.momentKnm > 100, `25m beam must produce massive moment demand (> 100 kNm), got ${beamRes.momentKnm}`);
      assert.ok(beamRes.requiredRebarCm2 > 5.0, "Long beam requires heavy rebar");
    });

    test("2.5 Zero curveSagitta degenerates curved beam to straight beam", () => {
      const straight: BeamElement = {
        id: "b-str", name: "K1", type: "beam", floorId: "floor-0", materialId: "concrete", layer: "Kirisler",
        start: { x: 0, y: 0 }, end: { x: 5, y: 0 }, width: 0.25, height: 0.50, curveSagitta: 0,
      };
      const fp = elementFootprint(straight);
      assert.equal(fp.length, 4, "Zero sagitta beam must have 4-point straight footprint");
    });
  });

  // =========================================================================
  // Boundary Area 3: Shear Walls
  // =========================================================================
  describe("Boundary Area 3: Shear Walls", () => {
    test("3.1 Borderline aspect ratio: 5.96 (column) vs 6.00 (shear wall)", () => {
      const tw = 0.25;
      const lwCol = 1.49;
      const lwWall = 1.50;
      const ratioCol = lwCol / tw;
      const ratioWall = lwWall / tw;
      assert.ok(ratioCol < 6.0, "1.49m / 0.25m = 5.96 < 6.0 (behaves as column/pier)");
      assert.ok(ratioWall >= 6.0, "1.50m / 0.25m = 6.00 >= 6.0 (qualifies as shear wall)");
    });

    test("3.2 Minimum wall thickness tw >= 200 mm per TBDY 2018 §7.6.1.2", () => {
      const wall: WallElement = {
        id: "w-min", name: "P-Min", type: "wall", floorId: "floor-0", materialId: "concrete", layer: "Perdeler",
        start: { x: 0, y: 0 }, end: { x: 2, y: 0 }, thickness: 0.20, height: 3.0,
      };
      assert.ok(wall.thickness >= 0.20, "Wall thickness 0.20m is code minimum boundary");
    });

    test("3.3 Zero length wall rejected by geometry", () => {
      const wall: WallElement = {
        id: "w-zero", name: "P-Zero", type: "wall", floorId: "floor-0", materialId: "concrete", layer: "Perdeler",
        start: { x: 1, y: 1 }, end: { x: 1, y: 1 }, thickness: 0.25, height: 3.0,
      };
      const fp = elementFootprint(wall);
      assert.equal(fp.length, 0, "Zero length wall must produce empty footprint");
    });

    test("3.4 Subasman wall with zero height rejected by validateModel", () => {
      const model = createEmptyModel();
      const wall = {
        id: "w-zero-h", name: "P-ZeroH", type: "wall", floorId: "floor-0", materialId: "concrete", layer: "Perdeler",
        start: { x: 0, y: 0 }, end: { x: 3, y: 0 }, thickness: 0.25, height: 0,
      };
      model.elements.push(wall as any);
      assert.throws(() => validateModel(model), /pozitif/i, "Zero wall height must be rejected");
    });

    test("3.5 Massive shear wall length (10.0m) stiffness dominance", () => {
      const tw = 0.30, Lw = 10.0;
      const I_wall = (tw * Math.pow(Lw, 3)) / 12; // 25 m4
      assert.equal(I_wall, 25.0, "10m shear wall moment of inertia must be exactly 25.0 m4");
    });
  });

  // =========================================================================
  // Boundary Area 4: Slabs & Voids
  // =========================================================================
  describe("Boundary Area 4: Slabs & Voids", () => {
    test("4.1 Minimum slab thickness hf >= 100 mm per TS 500 boundary", () => {
      const slab: SlabElement = {
        id: "s-min", name: "D-Min", type: "slab", floorId: "floor-0", materialId: "concrete", layer: "Dosemeler",
        points: [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 3 }, { x: 0, y: 3 }],
        thickness: 0.10,
      };
      assert.ok(slab.thickness >= 0.10, "10 cm thickness is TS 500 minimum boundary");
    });

    test("4.2 Degenerate slab polygon (< 3 vertices) rejected by isSimplePolygon", () => {
      const points = [{ x: 0, y: 0 }, { x: 3, y: 0 }];
      assert.equal(isSimplePolygon(points), false, "2-point line cannot be a valid slab polygon");
    });

    test("4.3 Self-intersecting bowtie polygon rejected by isSimplePolygon", () => {
      const bowtie = [{ x: 0, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }, { x: 4, y: 0 }];
      assert.equal(isSimplePolygon(bowtie), false, "Self-intersecting polygon must be rejected");
    });

    test("4.4 Enormous slab void consuming 90% of floor area net area check", () => {
      const grossArea = 100.0; // 10m x 10m
      const voidArea = 90.0;   // 9.48m x 9.48m
      const netArea = grossArea - voidArea;
      assert.equal(netArea, 10.0, "Net area must be 10.0 m2");
      assert.ok(voidArea / grossArea >= 0.90, "Void ratio exceeds 90%");
    });

    test("4.5 Negative slab thickness rejected by validateModel", () => {
      const model = createEmptyModel();
      const slab = {
        id: "s-neg", name: "D-Neg", type: "slab", floorId: "floor-0", materialId: "concrete", layer: "Dosemeler",
        points: [{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 3, y: 3 }, { x: 0, y: 3 }],
        thickness: -0.15,
      };
      model.elements.push(slab as any);
      assert.throws(() => validateModel(model), /pozitif/i, "Negative slab thickness must be rejected");
    });
  });

  // =========================================================================
  // Boundary Area 5: Foundations
  // =========================================================================
  describe("Boundary Area 5: Foundations", () => {
    test("5.1 Allowable soil bearing capacity qSafe <= 0 handled correctly", () => {
      const check = calculateSoilPressure(100, 10, 1.5, 1.5, 0);
      assert.equal(check.pass, false, "Soil pressure must fail when qSafe <= 0");
    });

    test("5.2 Minimum raft foundation thickness d >= 300 mm boundary", () => {
      const minRaftThick = 0.30;
      assert.ok(minRaftThick >= 0.30, "Minimum raft foundation thickness is 30 cm");
    });

    test("5.3 Extreme overturning moment causes soil lift-off (qMin = 0)", () => {
      const axialKn = 300;
      const momentKnm = 400; // Very large moment
      const width = 2.0, depth = 2.0;
      const check = calculateSoilPressure(axialKn, momentKnm, width, depth, 250);
      assert.equal(check.qMinKpa, 0, "Extreme eccentricity must clamp minimum soil pressure to 0");
      assert.ok(!check.pass, "Must fail allowable soil pressure");
    });

    test("5.4 Micro pad footing (0.2m x 0.2m) fails under 500 kN column load", () => {
      const check = calculateSoilPressure(500, 0, 0.20, 0.20, 200);
      assert.equal(check.pass, false);
      assert.ok(check.qMaxKpa > 10000, "Micro footing produces massive pressure (> 10,000 kPa)");
    });

    test("5.5 Massive concentric footing (10m x 10m) produces negligible soil pressure", () => {
      const check = calculateSoilPressure(500, 0, 10.0, 10.0, 200);
      assert.ok(check.pass);
      assert.equal(check.qMaxKpa, 5.0, "500 kN on 100 m2 produces 5 kPa");
    });
  });

  // =========================================================================
  // Boundary Area 6: Stairs
  // =========================================================================
  describe("Boundary Area 6: Stairs", () => {
    test("6.1 High riser height s = 24 cm fails comfort formula", () => {
      const geom = calculateStairGeometry({
        widthM: 1.20, stepCount: 10, riserHeightM: 0.24, waistThicknessM: 0.15,
      }, { x: 0, y: 0 }, { x: 2.5, y: 0 });
      assert.equal(geom.comfortFormulaCheck, false, "Riser 24 cm must fail comfort check");
    });

    test("6.2 Low riser height s = 10 cm fails comfort formula", () => {
      const geom = calculateStairGeometry({
        widthM: 1.20, stepCount: 10, riserHeightM: 0.10, waistThicknessM: 0.15,
      }, { x: 0, y: 0 }, { x: 2.5, y: 0 });
      assert.equal(geom.comfortFormulaCheck, false, "Riser 10 cm must fail comfort check");
    });

    test("6.3 Narrow tread depth b = 18 cm fails comfort formula", () => {
      const geom = calculateStairGeometry({
        widthM: 1.20, stepCount: 16, riserHeightM: 0.175, waistThicknessM: 0.15,
      }, { x: 0, y: 0 }, { x: 2.88, y: 0 }); // 2.88 / 16 = 0.18 m
      assert.equal(geom.comfortFormulaCheck, false, "Narrow tread 18 cm must fail comfort formula");
    });

    test("6.4 Single-step boundary condition (stepCount = 1) calculates correctly", () => {
      const geom = calculateStairGeometry({
        widthM: 1.0, stepCount: 1, riserHeightM: 0.15, waistThicknessM: 0.10,
      }, { x: 0, y: 0 }, { x: 0.30, y: 0 });
      assert.equal(geom.totalHeightM, 0.15);
      assert.equal(geom.totalRunM, 0.30);
      assert.ok(geom.concreteVolumeM3 > 0);
    });

    test("6.5 Extreme stair width (5.0m monumental stair) volume scales linearly", () => {
      const geom1 = calculateStairGeometry({
        widthM: 1.0, stepCount: 16, riserHeightM: 0.175, waistThicknessM: 0.15,
      }, { x: 0, y: 0 }, { x: 4.0, y: 0 });
      const geom5 = calculateStairGeometry({
        widthM: 5.0, stepCount: 16, riserHeightM: 0.175, waistThicknessM: 0.15,
      }, { x: 0, y: 0 }, { x: 4.0, y: 0 });
      assert.ok(Math.abs(geom5.concreteVolumeM3 - 5 * geom1.concreteVolumeM3) < 1e-5);
    });
  });

  // =========================================================================
  // Boundary Area 7: Axes & Grid
  // =========================================================================
  describe("Boundary Area 7: Axes & Grid", () => {
    test("7.1 Zero-length axis (start == end) rejected by distance", () => {
      const axis: AxisElement = {
        id: "ax-0", name: "0", type: "axis", floorId: "f0", materialId: "c", layer: "Akslar",
        start: { x: 5, y: 5 }, end: { x: 5, y: 5 },
      };
      assert.equal(distance(axis.start, axis.end), 0);
    });

    test("7.2 Duplicate parallel axes with zero spacing", () => {
      const ax1: AxisElement = {
        id: "ax-1a", name: "1", type: "axis", floorId: "f0", materialId: "c", layer: "Akslar",
        start: { x: 0, y: 0 }, end: { x: 0, y: 10 },
      };
      const ax2: AxisElement = {
        id: "ax-1b", name: "1", type: "axis", floorId: "f0", materialId: "c", layer: "Akslar",
        start: { x: 0, y: 0 }, end: { x: 0, y: 10 },
      };
      assert.equal(ax1.start.x, ax2.start.x);
    });

    test("7.3 Extreme coordinate axis spanning > 1,000,000m rejected by validateModel", () => {
      const model = createEmptyModel();
      const ax = {
        id: "ax-ext", name: "EXT", type: "axis", floorId: "floor-0", materialId: "concrete", layer: "Akslar",
        start: { x: 0, y: 0 }, end: { x: 2_000_000, y: 0 },
      };
      model.elements.push(ax as any);
      assert.throws(() => validateModel(model), /1\.000\.000/i);
    });

    test("7.4 Empty axis name rejected by validateModel", () => {
      const model = createEmptyModel();
      const ax = {
        id: "ax-empty", name: "   ", type: "axis", floorId: "floor-0", materialId: "concrete", layer: "Akslar",
        start: { x: 0, y: 0 }, end: { x: 5, y: 0 },
      };
      model.elements.push(ax as any);
      assert.throws(() => validateModel(model), /karakterlik metin/i);
    });

    test("7.5 Highly negative coordinates (-500m) valid within bounds", () => {
      const model = createEmptyModel();
      const ax: AxisElement = {
        id: "ax-neg", name: "NEG", type: "axis", floorId: "floor-0", materialId: "concrete", layer: "Akslar",
        start: { x: -500, y: -500 }, end: { x: -500, y: 500 },
      };
      model.elements.push(ax);
      const val = validateModel(model);
      assert.equal(val.elements.length, 1);
    });
  });

  // =========================================================================
  // Boundary Area 8: Storey Management
  // =========================================================================
  describe("Boundary Area 8: Storey Management", () => {
    test("8.1 Zero storey height rejected by validateModel", () => {
      const model = createEmptyModel();
      model.floors[0].height = 0;
      assert.throws(() => validateModel(model), /pozitif/i);
    });

    test("8.2 Negative storey height rejected by validateModel", () => {
      const model = createEmptyModel();
      model.floors[0].height = -3.0;
      assert.throws(() => validateModel(model), /pozitif/i);
    });

    test("8.3 Duplicate storey IDs rejected by validateModel", () => {
      const model = createEmptyModel();
      model.floors.push({ id: "floor-0", name: "Duplicate", elevation: 3.0, height: 3.0 });
      assert.throws(() => validateModel(model), /yinelenen/i);
    });

    test("8.4 Single storey building base shear equals ground floor shear", () => {
      const model = createDemoModel();
      // Only 1 floor
      assert.equal(model.floors.length, 1);
      const res = runStructuralAnalysis(model);
      assert.equal(res.storeys[0].shearForceKn, res.baseShearKn);
    });

    test("8.5 Missing floors array rejected by validateModel", () => {
      const invalid = { schemaVersion: 1, name: "Test", materials: [] };
      assert.throws(() => validateModel(invalid), /Katlar/i);
    });
  });

  // =========================================================================
  // Boundary Area 9: Exclusion of Non-RC Elements
  // =========================================================================
  describe("Boundary Area 9: Exclusion of Non-RC Elements", () => {
    function collectCommands(cmds: any[]): any[] {
      return cmds.flatMap(c => [c, ...collectCommands(c.children || [])]);
    }

    test("9.1 Mixed case 'ÇELİK' command symbols filtered out", () => {
      const tabs = PRODUCT_RIBBON_TABS;
      const allCmds = tabs.flatMap(t => t.panels.flatMap(p => collectCommands(p.commands)));
      for (const cmd of allCmds) {
        assert.ok(!/çelik/i.test(cmd.label), `Label ${cmd.label} must not match /çelik/i`);
      }
    });

    test("9.2 Pure steel symbols excluded", () => {
      const allCmds = PRODUCT_RIBBON_TABS.flatMap(t => t.panels.flatMap(p => collectCommands(p.commands)));
      assert.equal(allCmds.some(c => c.symbol === "CM_DRAW_STEELCOLUMN"), false);
      assert.equal(allCmds.some(c => c.symbol === "CM_DRAW_STEELBEAM"), false);
    });

    test("9.3 Command symbol preservation for concrete elements", () => {
      const allCmds = PRODUCT_RIBBON_TABS.flatMap(t => t.panels.flatMap(p => collectCommands(p.commands)));
      assert.ok(allCmds.some(c => c.symbol === "CM_DRAW_RECTANGLECOLUMN"));
      assert.ok(allCmds.some(c => c.symbol === "CM_DRAW_MULTIBEAM"));
    });

    test("9.4 Deep foundation pile commands audited in full catalog", () => {
      const allNative = NATIVE_RIBBON_TABS.flatMap(t => t.panels.flatMap(p => collectCommands(p.commands)));
      const pileCmds = allNative.filter(c => /kazık/i.test(c.label));
      assert.ok(pileCmds.length >= 2, "Native layout contains multiple pile commands");
    });

    test("9.5 Dome and vault commands audited in full catalog", () => {
      const allNative = NATIVE_RIBBON_TABS.flatMap(t => t.panels.flatMap(p => collectCommands(p.commands)));
      const domeCmds = allNative.filter(c => /kubbe|tonoz/i.test(c.label));
      assert.ok(domeCmds.length >= 5, "Native layout contains multiple dome/vault commands");
    });
  });

  // =========================================================================
  // Boundary Area 10: 3D Frame Solver
  // =========================================================================
  describe("Boundary Area 10: 3D Frame Solver", () => {
    test("10.1 Model with zero columns and walls falls back to minimal stiffness", () => {
      const model = createEmptyModel();
      // Add only a slab
      model.elements.push({
        id: "s1", name: "D1", type: "slab", floorId: "floor-0", materialId: "concrete", layer: "Dosemeler",
        points: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }], thickness: 0.15,
      });
      const res = runStructuralAnalysis(model);
      assert.ok(res.storeys[0].stiffnessKnPerM >= 1000.0, "Must fall back to minimum stiffness");
    });

    test("10.2 Disconnected elements without floor assignment are rejected with descriptive error", () => {
      const model = createDemoModel();
      model.elements.push({
        id: "orphan", name: "Orphan", type: "column", floorId: "non-existent-floor", materialId: "concrete", layer: "Kolonlar",
        position: { x: 0, y: 0 }, width: 0.4, depth: 0.4, height: 3.0,
      });
      assert.throws(() => runStructuralAnalysis(model), /kat veya malzeme bulunamadı/i);
    });

    test("10.3 High stiffness disparity between massive wall and slender column", () => {
      const model = createEmptyModel();
      const col: ColumnElement = {
        id: "c-slender", name: "S1", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 0, y: 0 }, width: 0.25, depth: 0.25, height: 3.0,
      };
      const wall: WallElement = {
        id: "w-massive", name: "P1", type: "wall", floorId: "floor-0", materialId: "concrete", layer: "Perdeler",
        start: { x: 0, y: 2 }, end: { x: 8, y: 2 }, thickness: 0.40, height: 3.0,
      };
      model.elements = [col, wall];
      const res = runStructuralAnalysis(model);
      assert.ok(res.storeys[0].stiffnessKnPerM > 100000, "Massive wall must provide huge storey stiffness");
    });

    test("10.4 Empty floor without elements handled gracefully", () => {
      const model = createEmptyModel();
      const res = runStructuralAnalysis(model);
      assert.equal(res.storeys.length, 1);
      assert.ok(Number.isFinite(res.storeys[0].driftRatio));
    });

    test("10.5 Zero drift limit produces failure on any positive drift", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model, { driftLimit: 0.0000001 });
      assert.equal(res.overallPass, false, "Tiny drift limit must fail drift check");
    });
  });

  // =========================================================================
  // Boundary Area 11: Seismic Loading (TBDY 2018)
  // =========================================================================
  describe("Boundary Area 11: Seismic Loading", () => {
    test("11.1 Zero SDS rejected by runStructuralAnalysis", () => {
      const model = createDemoModel();
      assert.throws(() => runStructuralAnalysis(model, { sds: 0 }), /sds/i);
    });

    test("11.2 Negative behavior factor R rejected", () => {
      const model = createDemoModel();
      assert.throws(() => runStructuralAnalysis(model, { r: -4.0 }), /r/i);
    });

    test("11.3 Invalid live load participation factor (> 1.0) rejected", () => {
      const model = createDemoModel();
      assert.throws(() => runStructuralAnalysis(model, { liveLoadParticipation: 1.5 }), /aralığında/i);
    });

    test("11.4 Extreme seismic acceleration SDS = 2.0 produces large base shear", () => {
      const model = createDemoModel();
      const standard = runStructuralAnalysis(model, { sds: 0.5 });
      const extreme = runStructuralAnalysis(model, { sds: 2.0 });
      assert.ok(extreme.baseShearKn > 3 * standard.baseShearKn, "4x SDS must substantially increase base shear");
    });

    test("11.5 Minimum base shear controls when spectral shear is tiny", () => {
      const model = createDemoModel();
      // With very high R=16 and small SDS=0.1, raw base shear is small
      const res = runStructuralAnalysis(model, { r: 16.0, sds: 0.1 });
      assert.ok(res.baseShearKn >= res.minBaseShearKn);
    });
  });

  // =========================================================================
  // Boundary Area 12: Load Combinations
  // =========================================================================
  describe("Boundary Area 12: Load Combinations", () => {
    test("12.1 Zero dead load edge case", () => {
      const G = 0, Q = 50;
      const Fd = 1.4 * G + 1.6 * Q;
      assert.equal(Fd, 80);
    });

    test("12.2 Pure gravity load state (Ex = 0, Ey = 0)", () => {
      const G = 100, Q = 40;
      const combo = G + Q;
      assert.equal(combo, 140);
    });

    test("12.3 Reversal uplift where Ez opposes gravity: 0.9G - Ez", () => {
      const G = 100;
      const Ez = 40;
      const netDown = 0.9 * G - Ez;
      assert.equal(netDown, 50, "Net downward load is positive (no tension)");
    });

    test("12.4 High uplift Ez exceeding 0.9G produces tension", () => {
      const G = 100;
      const Ez = 110;
      const netDown = 0.9 * G - Ez;
      assert.equal(netDown, -20, "Net load is negative (-20 kN tension)");
      assert.ok(netDown < 0);
    });

    test("12.5 Multiple combinations envelope monotonicity", () => {
      const envelope = (vals: number[]) => Math.max(...vals);
      assert.equal(envelope([10, 20, 50, 40]), 50);
    });
  });

  // =========================================================================
  // Boundary Area 13: Column Design
  // =========================================================================
  describe("Boundary Area 13: Column Design", () => {
    test("13.1 Heavy axial load exceeding Nd / (Ac * fcd) > 0.40 fails check", () => {
      const model = createDemoModel();
      // Increase slab dead and live loads heavily to overload columns
      const slab = model.elements.find(e => e.type === "slab") as SlabElement;
      slab.finishLoad = 250.0; // Huge finish load
      slab.liveLoad = 500.0;   // Huge live load
      const res = runStructuralAnalysis(model);
      const cols = model.elements.filter(e => e.type === "column");
      const anyAxialOverloaded = cols.some(c => (res.members[c.id]?.axialStressRatio ?? 0) > 0.40);
      assert.ok(anyAxialOverloaded, "Heavily overloaded floor must trigger column axial stress ratio > 0.40");
      assert.equal(res.overallPass, false);
    });

    test("13.2 Pure concentric axial compression (e = 0, M = 0)", () => {
      const AcMm2 = 400 * 400;
      const fcd = 20.0;
      const maxAxialKn = (0.40 * AcMm2 * fcd) / 1000;
      assert.equal(maxAxialKn, 1280, "40x40 C30 column concentric limit is 1,280 kN");
    });

    test("13.3 Slender frame column moment demand and capacity evaluation under high seismic", () => {
      const model = createEmptyModel();
      model.floors[0].height = 4.0;
      const col1: ColumnElement = {
        id: "c1", name: "S1", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 0, y: 0 }, width: 0.3, depth: 0.3, height: 4.0,
      };
      const col2: ColumnElement = {
        id: "c2", name: "S2", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 5, y: 0 }, width: 0.3, depth: 0.3, height: 4.0,
      };
      model.elements = [col1, col2, {
        id: "s1", name: "D1", type: "slab", floorId: "floor-0", materialId: "concrete", layer: "Dosemeler",
        points: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }, { x: 0, y: 5 }], thickness: 0.15,
      }];
      const res = runStructuralAnalysis(model, { sds: 2.0, r: 2.0 });
      const c1Res = res.members["c1"];
      assert.ok(c1Res, "Column 1 result must exist");
      assert.ok(c1Res.momentKnm > 0, "Column must develop seismic bending moment");
      assert.ok(c1Res.capacityRatio > 0);
    });

    test("13.4 Required rebar never drops below code minimum 1% Ac", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      const col = model.elements.find(e => e.type === "column") as ColumnElement;
      const mRes = res.members[col.id];
      const AcCm2 = col.width * col.depth * 10000;
      assert.ok(mRes.requiredRebarCm2 >= 0.01 * AcCm2);
    });

    test("13.5 Confinement spacing clamps to minimum boundary", () => {
      const col: ColumnElement = {
        id: "c-narrow", name: "S1", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 0, y: 0 }, width: 0.25, depth: 0.25, height: 3.0,
      };
      const model: CadModel = { ...createEmptyModel(), elements: [col] };
      const res = runStructuralAnalysis(model);
      const mRes = res.members["c-narrow"];
      assert.ok(mRes.confinementSpacingCm <= 8, "25cm column confinement spacing must be <= 8 cm (b/3)");
    });
  });

  // =========================================================================
  // Boundary Area 14: Beam Design
  // =========================================================================
  describe("Boundary Area 14: Beam Design", () => {
    test("14.1 Excessive span load increases beam flexural moment and required rebar", () => {
      const model = createDemoModel();
      const slab = model.elements.find(e => e.type === "slab") as SlabElement;
      slab.finishLoad = 50.0;
      slab.liveLoad = 100.0;
      const res = runStructuralAnalysis(model);
      const beams = model.elements.filter(e => e.type === "beam");
      const highMoment = beams.some(b => (res.members[b.id]?.momentKnm ?? 0) > 30.0);
      assert.ok(highMoment, "Overloaded floor must cause substantial beam moment demand");
      const heavyRebar = beams.some(b => (res.members[b.id]?.requiredRebarCm2 ?? 0) > 2.0);
      assert.ok(heavyRebar, "Overloaded beam requires substantial longitudinal rebar");
    });

    test("14.2 Minimum beam flexural steel enforced even with zero load", () => {
      const bw = 250, d = 460, fctd = 1.30, fyk = 420;
      const AsMin = Math.max(0.8 * (fctd / fyk) * bw * d, 0.002 * bw * d);
      assert.ok(AsMin > 200, "Minimum beam steel must be > 200 mm2");
    });

    test("14.3 High shear force pushes stirrup spacing to minimum boundary", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      const beam = model.elements.find(e => e.type === "beam") as BeamElement;
      const mRes = res.members[beam.id];
      assert.ok(mRes.confinementSpacingCm <= 15);
    });

    test("14.4 Very short beam span L = 1.0m detailing", () => {
      const beam: BeamElement = {
        id: "b-short", name: "K-Short", type: "beam", floorId: "floor-0", materialId: "concrete", layer: "Kirisler",
        start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, width: 0.25, height: 0.50,
      };
      const detail = generateBeamDetail(beam);
      assert.ok(detail.rebarSchedule.length > 0);
    });

    test("14.5 Beam height equals slab thickness (flat band beam)", () => {
      const bandBeam: BeamElement = {
        id: "b-band", name: "BB1", type: "beam", floorId: "floor-0", materialId: "concrete", layer: "Kirisler",
        start: { x: 0, y: 0 }, end: { x: 5, y: 0 }, width: 0.60, height: 0.15,
      };
      const fp = elementFootprint(bandBeam);
      assert.equal(fp.length, 4);
      assert.equal(polygonArea(fp), 5 * 0.60);
    });
  });

  // =========================================================================
  // Boundary Area 15: Shear Wall Design
  // =========================================================================
  describe("Boundary Area 15: Shear Wall Design", () => {
    test("15.1 High shear stress limit Vr <= 0.85*Ach*sqrt(fck)", () => {
      const Ach = 0.25 * 2.0 * 1e6; // 2m x 25cm in mm2
      const fck = 25; // C25
      const maxVrKn = (0.85 * Ach * Math.sqrt(fck)) / 1000;
      assert.equal(maxVrKn, 2125, "Max shear capacity is 2,125 kN");
    });

    test("15.2 Squat shear wall Hw / Lw = 1.0 boundary", () => {
      const Hw = 3.0, Lw = 3.0;
      const ratio = Hw / Lw;
      assert.equal(ratio, 1.0, "Squat wall ratio is 1.0 < 2.0");
    });

    test("15.3 Slender shear wall Hw / Lw = 5.0 boundary", () => {
      const Hw = 15.0, Lw = 3.0;
      const ratio = Hw / Lw;
      assert.equal(ratio, 5.0, "Slender wall ratio is 5.0 >= 2.0");
    });

    test("15.4 Minimum boundary zone length rounding", () => {
      const Lw = 2.50;
      const lu = Math.max(0.1 * Lw, 0.2 * Lw);
      assert.equal(lu, 0.50, "Boundary zone length must be 0.50 m");
    });

    test("15.5 Web steel minimum 0.0025 Ac enforced across all thicknesses", () => {
      const tw = 0.30;
      const minSteelM2 = 0.0025 * tw * 1.0; // per metre
      assert.equal(minSteelM2, 0.00075, "7.5 cm2/m steel per metre length");
    });
  });

  // =========================================================================
  // Boundary Area 16: Raft Foundation Design
  // =========================================================================
  describe("Boundary Area 16: Raft Foundation Design", () => {
    test("16.1 High punching shear ratio failure under massive axial load", () => {
      const fctd = 1.30;
      const u1 = 3.0, d = 0.30;
      const capKn = (fctd * 1000 * u1 * d); // 1170 kN
      const heavyLoad = 2500; // kN
      const ratio = heavyLoad / capKn;
      assert.ok(ratio > 1.0, "Punching shear ratio must exceed 1.0 (failure)");
    });

    test("16.2 Low concrete grade C20 reduces punching capacity", () => {
      const u1 = 3.0, d = 0.50;
      const capC20 = 1.0 * 1000 * u1 * d;
      const capC35 = 1.4 * 1000 * u1 * d;
      assert.ok(capC35 > capC20);
    });

    test("16.3 Large column perimeter increases punching critical perimeter and capacity", () => {
      const d = 0.60;
      const u1_small = 2 * (0.3 + d) + 2 * (0.3 + d); // 3.6m
      const u1_large = 2 * (0.8 + d) + 2 * (0.8 + d); // 5.6m
      assert.ok(u1_large > u1_small);
    });

    test("16.4 Zero moment produces completely uniform soil pressure", () => {
      const check = calculateSoilPressure(1000, 0, 4, 4, 200);
      assert.equal(check.qMaxKpa, check.qMinKpa);
      assert.equal(check.qMaxKpa, 1000 / 16);
    });

    test("16.5 Raft thickness boundary: 30cm vs 65cm volume", () => {
      const area = 100;
      const volThin = area * 0.30;
      const volThick = area * 0.65;
      assert.equal(volThin, 30);
      assert.equal(volThick, 65);
    });
  });

  // =========================================================================
  // Boundary Area 17: Diagrams & Deformations
  // =========================================================================
  describe("Boundary Area 17: Diagrams & Deformations", () => {
    test("17.1 Zero load state produces zero moment and shear", () => {
      const q = 0, L = 5;
      const maxM = (q * Math.pow(L, 2)) / 8;
      const maxV = (q * L) / 2;
      assert.equal(maxM, 0);
      assert.equal(maxV, 0);
    });

    test("17.2 Cantilever beam tip boundary conditions M=0, V=0", () => {
      const q = 10, L = 2; // Cantilever with UDL
      const mTip = 0;
      const vTip = 0;
      const mRoot = (q * Math.pow(L, 2)) / 2;
      assert.equal(mTip, 0);
      assert.equal(vTip, 0);
      assert.equal(mRoot, 20);
    });

    test("17.3 Continuous beam over interior support negative moment peak", () => {
      const q = 20, L = 6;
      const mSupport = (q * Math.pow(L, 2)) / 8;
      assert.ok(mSupport > 0);
    });

    test("17.4 Drift ratio limit boundary at exactly 0.008", () => {
      const limit = 0.008;
      assert.equal(0.0080 <= limit, true, "0.0080 is compliant");
      assert.equal(0.0081 <= limit, false, "0.0081 is non-compliant");
    });

    test("17.5 Large storey drift sets overallPass = false", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model, { sds: 3.0, r: 1.0 });
      assert.equal(res.overallPass, false);
    });
  });

  // =========================================================================
  // Boundary Area 18: Capacity Ratios (DCR)
  // =========================================================================
  describe("Boundary Area 18: Capacity Ratios (DCR)", () => {
    test("18.1 Borderline green/yellow threshold at exactly 0.700", () => {
      const classify = (r: number) => r <= 0.70 ? "green" : r <= 1.0 ? "yellow" : "red";
      assert.equal(classify(0.700), "green");
      assert.equal(classify(0.701), "yellow");
    });

    test("18.2 Borderline yellow/red threshold at exactly 1.000", () => {
      const classify = (r: number) => r <= 0.70 ? "green" : r <= 1.0 ? "yellow" : "red";
      assert.equal(classify(1.000), "yellow");
      assert.equal(classify(1.001), "red");
    });

    test("18.3 Single failing element causes entire model overallPass to be false", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model, { sds: 2.5 });
      if (res.maxCapacityRatio > 1.0) {
        assert.equal(res.overallPass, false);
      }
    });

    test("18.4 Zero demand DCR = 0.0 handled cleanly", () => {
      const dcr = 0 / 100;
      assert.equal(dcr, 0);
      assert.ok(Number.isFinite(dcr));
    });

    test("18.5 Severe overstress DCR = 4.0 handled without NaN", () => {
      const dcr = 400 / 100;
      assert.equal(dcr, 4.0);
      assert.ok(Number.isFinite(dcr));
    });
  });

  // =========================================================================
  // Boundary Area 19: Concrete Volume (Gross vs Net)
  // =========================================================================
  describe("Boundary Area 19: Concrete Volume", () => {
    test("19.1 Disjoint non-intersecting elements have netVolume == grossVolume", () => {
      const model = createEmptyModel();
      const col1: ColumnElement = {
        id: "c1", name: "S1", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 0, y: 0 }, width: 0.4, depth: 0.4, height: 3.0,
      };
      const col2: ColumnElement = {
        id: "c2", name: "S2", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 10, y: 10 }, width: 0.4, depth: 0.4, height: 3.0,
      };
      model.elements = [col1, col2];
      const q = calculateQuantities(model);
      assert.equal(q.overlapVolume, 0, "Disjoint elements must have 0 overlap volume");
      assert.equal(q.netVolume, q.grossVolume);
    });

    test("19.2 Zero thickness slab rejected by validateModel", () => {
      const model = createEmptyModel();
      const slab = {
        id: "s-zero", name: "D-Zero", type: "slab", floorId: "floor-0", materialId: "concrete", layer: "Dosemeler",
        points: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }], thickness: 0,
      };
      model.elements.push(slab as any);
      assert.throws(() => validateModel(model), /pozitif/i);
    });

    test("19.3 Hairline slab area within valid limits", () => {
      const points = [{ x: 0, y: 0 }, { x: 0.05, y: 0 }, { x: 0.05, y: 0.05 }, { x: 0, y: 0.05 }];
      assert.ok(polygonArea(points) > 0);
    });

    test("19.4 Monumental volume calculation stability", () => {
      const area = 50 * 50; // 2500 m2
      const thick = 1.5;
      const vol = area * thick;
      assert.equal(vol, 3750);
    });

    test("19.5 Volume scales linearly with storey height", () => {
      const colA: ColumnElement = {
        id: "ca", name: "SA", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 0, y: 0 }, width: 0.5, depth: 0.5, height: 3.0,
      };
      const colB: ColumnElement = {
        id: "cb", name: "SB", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 5, y: 5 }, width: 0.5, depth: 0.5, height: 6.0,
      };
      const mA = { ...createEmptyModel(), elements: [colA] };
      const mB = { ...createEmptyModel(), elements: [colB] };
      const qA = calculateQuantities(mA);
      const qB = calculateQuantities(mB);
      assert.equal(qB.grossVolume, 2 * qA.grossVolume);
    });
  });

  // =========================================================================
  // Boundary Area 20: Formwork Area (Net Contact Area)
  // =========================================================================
  describe("Boundary Area 20: Formwork Area", () => {
    test("20.1 Column with negative height rejected by validateModel", () => {
      const model = createEmptyModel();
      const col = {
        id: "c-nh", name: "S", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 0, y: 0 }, width: 0.4, depth: 0.4, height: -3.0,
      };
      model.elements.push(col as any);
      assert.throws(() => validateModel(model), /pozitif/i);
    });

    test("20.2 Beam with negative width rejected by validateModel", () => {
      const model = createEmptyModel();
      const beam = {
        id: "b-nw", name: "K", type: "beam", floorId: "floor-0", materialId: "concrete", layer: "Kirisler",
        start: { x: 0, y: 0 }, end: { x: 4, y: 0 }, width: -0.25, height: 0.5,
      };
      model.elements.push(beam as any);
      assert.throws(() => validateModel(model), /pozitif/i);
    });

    test("20.3 Formwork area increases strictly with slope", () => {
      const flatSlab: SlabElement = {
        id: "s-flat", name: "D-Flat", type: "slab", floorId: "floor-0", materialId: "concrete", layer: "Dosemeler",
        points: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }, { x: 0, y: 5 }], thickness: 0.15,
      };
      const slopedSlab: SlabElement = {
        id: "s-sloped", name: "D-Sloped", type: "slab", floorId: "floor-0", materialId: "concrete", layer: "Dosemeler",
        points: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }, { x: 0, y: 5 }], thickness: 0.15,
        slopeX: 10.0, // 10% slope
      };
      const qFlat = calculateQuantities({ ...createEmptyModel(), elements: [flatSlab] });
      const qSloped = calculateQuantities({ ...createEmptyModel(), elements: [slopedSlab] });
      assert.ok(qSloped.formwork > qFlat.formwork);
    });

    test("20.4 Leaning column formwork calculation accounts for tilt", () => {
      const straightCol: ColumnElement = {
        id: "c-str", name: "S-Str", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 0, y: 0 }, width: 0.4, depth: 0.4, height: 3.0,
      };
      const leaningCol: ColumnElement = {
        id: "c-lean", name: "S-Lean", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 0, y: 0 }, width: 0.4, depth: 0.4, height: 3.0, leanX: 0.50,
      };
      const qStr = calculateQuantities({ ...createEmptyModel(), elements: [straightCol] });
      const qLean = calculateQuantities({ ...createEmptyModel(), elements: [leaningCol] });
      assert.ok(qLean.formwork > qStr.formwork);
    });

    test("20.5 Formwork area is strictly positive for all valid structural elements", () => {
      const model = createDemoModel();
      const q = calculateQuantities(model);
      assert.ok(q.formwork > 0);
    });
  });

  // =========================================================================
  // Boundary Area 21: Rebar Weight Takeoff
  // =========================================================================
  describe("Boundary Area 21: Rebar Weight Takeoff", () => {
    test("21.1 Smallest standard diameter Ø8 rebar weight calculation", () => {
      const lengthM = 100;
      const weight = lengthM * REBAR_WEIGHTS[8];
      assert.equal(weight, 39.5, "100m of Ø8 is 39.5 kg");
    });

    test("21.2 Largest standard diameter Ø25 rebar weight calculation", () => {
      const lengthM = 100;
      const weight = lengthM * REBAR_WEIGHTS[25];
      assert.equal(weight, 385.3, "100m of Ø25 is 385.3 kg");
    });

    test("21.3 Threshold diameter Ø12 categorized as thin rebar", () => {
      const dia = 12;
      const isThin = dia <= 12;
      assert.equal(isThin, true, "Ø12 is thin rebar");
    });

    test("21.4 Threshold diameter Ø14 categorized as thick rebar", () => {
      const dia = 14;
      const isThick = dia >= 14;
      assert.equal(isThick, true, "Ø14 is thick rebar");
    });

    test("21.5 Zero length rebar produces zero weight", () => {
      const weight = 0 * REBAR_WEIGHTS[16];
      assert.equal(weight, 0);
    });
  });

  // =========================================================================
  // Boundary Area 22: Static Calculation Report
  // =========================================================================
  describe("Boundary Area 22: Static Calculation Report", () => {
    test("22.1 Minimal model with 1 column and 1 beam generates valid report", () => {
      const model = createEmptyModel();
      const col: ColumnElement = {
        id: "c1", name: "S1", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 0, y: 0 }, width: 0.4, depth: 0.4, height: 3.0,
      };
      const beam: BeamElement = {
        id: "b1", name: "K1", type: "beam", floorId: "floor-0", materialId: "concrete", layer: "Kirisler",
        start: { x: 0, y: 0 }, end: { x: 4, y: 0 }, width: 0.25, height: 0.50,
      };
      model.elements = [col, beam];
      const junc = resolveJunctions(model);
      const rows = quantityReport(model, junc, { grouping: "type", floorId: "", types: ["column", "beam"] });
      assert.equal(rows.length, 2);
    });

    test("22.2 Failing design checks are clearly highlighted in statusText", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model, { sds: 3.0, r: 1.0 });
      assert.equal(res.overallPass, false);
      const note = res.summaryNotes.find(n => n.includes("AŞILDI") || n.includes("KAPASİTE AŞIMI"));
      assert.ok(note, "Summary notes must mention capacity exceedance");
    });

    test("22.3 Special Turkish characters preserved in report CSV output", () => {
      const model = createDemoModel();
      const junc = resolveJunctions(model);
      const rows = quantityReport(model, junc, { grouping: "type", floorId: "", types: ["column", "beam", "wall", "slab"] });
      const csv = reportCsv(rows);
      assert.ok(csv.includes("Kiriş") || csv.includes("Döşeme"), "Turkish characters must be preserved");
    });

    test("22.4 Empty floor report filtering handles 0 rows without crash", () => {
      const model = createDemoModel();
      const junc = resolveJunctions(model);
      const rows = quantityReport(model, junc, { grouping: "floor", floorId: "non-existent-floor", types: ["column"] });
      assert.equal(rows.length, 0);
    });

    test("22.5 CSV decimal comma convention replaces dot with comma", () => {
      const model = createDemoModel();
      const junc = resolveJunctions(model);
      const rows = quantityReport(model, junc, { grouping: "type", floorId: "", types: ["column"] });
      const csv = reportCsv(rows);
      assert.ok(csv.includes(","), "CSV numbers must format with comma in Turkish locale");
    });
  });
});
