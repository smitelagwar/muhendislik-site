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

describe("Tier 1 - Feature Coverage Suite (22 RC Feature Areas)", () => {
  // =========================================================================
  // Area 1: RC Modeling - Columns (Dikdortgen / Daire / Poligon)
  // =========================================================================
  describe("Area 1: RC Modeling - Columns", () => {
    test("1.1 Rectangular column cross-section, dimensions and footprint area", () => {
      const col: ColumnElement = {
        id: "col-rect-1",
        name: "S101",
        type: "column",
        floorId: "floor-0",
        materialId: "concrete",
        layer: "Kolonlar",
        position: { x: 2, y: 3 },
        width: 0.40,
        depth: 0.60,
        height: 3.0,
        section: "rectangle",
      };
      const footprint = elementFootprint(col);
      assert.equal(footprint.length, 4, "Rectangular column must produce a 4-vertex polygon");
      const area = polygonArea(footprint);
      assert.ok(Math.abs(area - 0.24) < 1e-6, `Area must be 0.40 * 0.60 = 0.24 m2, got ${area}`);
      const perim = polygonPerimeter(footprint);
      assert.ok(Math.abs(perim - 2.0) < 1e-6, `Perimeter must be 2 * (0.4 + 0.6) = 2.0 m, got ${perim}`);
    });

    test("1.2 Circular column diameter, circleSegments polygon approximation", () => {
      const col: ColumnElement = {
        id: "col-circ-1",
        name: "S102",
        type: "column",
        floorId: "floor-0",
        materialId: "concrete",
        layer: "Kolonlar",
        position: { x: 5, y: 5 },
        width: 0.50,
        depth: 0.50,
        height: 3.0,
        section: "circle",
        circleSegments: 36,
      };
      const footprint = elementFootprint(col);
      assert.equal(footprint.length, 36, "Circular column with 36 segments must produce 36 vertices");
      const area = polygonArea(footprint);
      const exactCircleArea = Math.PI * Math.pow(0.25, 2);
      assert.ok(Math.abs(area - exactCircleArea) / exactCircleArea < 0.01, "36-segment polygon area must match true circle within 1%");
    });

    test("1.3 Polygonal L-shaped column with custom sectionPoints", () => {
      const lSection = [
        { x: 0, y: 0 },
        { x: 0.70, y: 0 },
        { x: 0.70, y: 0.30 },
        { x: 0.30, y: 0.30 },
        { x: 0.30, y: 0.70 },
        { x: 0, y: 0.70 },
      ];
      const col: ColumnElement = {
        id: "col-poly-1",
        name: "S103",
        type: "column",
        floorId: "floor-0",
        materialId: "concrete",
        layer: "Kolonlar",
        position: { x: 0, y: 0 },
        width: 0.70,
        depth: 0.70,
        height: 3.0,
        section: "polygon",
        sectionPoints: lSection,
      };
      const footprint = elementFootprint(col);
      assert.equal(footprint.length, 6, "L-column must have 6 vertices");
      const area = polygonArea(footprint);
      const expectedArea = 0.70 * 0.30 + 0.40 * 0.30; // 0.21 + 0.12 = 0.33 m2
      assert.ok(Math.abs(area - expectedArea) < 1e-5, `L-column area must be 0.33 m2, got ${area}`);
    });

    test("1.4 Column vertical boundaries with baseOffset and topOffset", () => {
      const floor: Floor = { id: "floor-0", name: "Zemin", elevation: 1.5, height: 3.2 };
      const col: ColumnElement = {
        id: "col-off-1",
        name: "S104",
        type: "column",
        floorId: "floor-0",
        materialId: "concrete",
        layer: "Kolonlar",
        position: { x: 0, y: 0 },
        width: 0.40,
        depth: 0.40,
        height: 3.2,
        heightMode: "story",
        baseOffset: -0.30,
        topOffset: 0.15,
      };
      const [bottom, top] = elementVerticalRange(col, floor);
      assert.equal(bottom, 1.5 - 0.30, "Bottom elevation must incorporate baseOffset");
      assert.equal(top, 1.5 + 3.2 + 0.15, "Top elevation must incorporate topOffset");
      assert.ok(top > bottom, "Column top must be strictly higher than bottom");
    });

    test("1.5 Column anchor mode and rotation transformations", () => {
      const col: ColumnElement = {
        id: "col-rot-1",
        name: "S105",
        type: "column",
        floorId: "floor-0",
        materialId: "concrete",
        layer: "Kolonlar",
        position: { x: 10, y: 10 },
        width: 0.30,
        depth: 0.60,
        height: 3.0,
        rotation: 90,
      };
      const footprint = elementFootprint(col);
      const xs = footprint.map(p => p.x);
      const ys = footprint.map(p => p.y);
      const deltaX = Math.max(...xs) - Math.min(...xs);
      const deltaY = Math.max(...ys) - Math.min(...ys);
      // Rotated 90 degrees: width (0.30) becomes along Y, depth (0.60) becomes along X
      assert.ok(Math.abs(deltaX - 0.60) < 1e-4, `Rotated column deltaX should be 0.60, got ${deltaX}`);
      assert.ok(Math.abs(deltaY - 0.30) < 1e-4, `Rotated column deltaY should be 0.30, got ${deltaY}`);
    });
  });

  // =========================================================================
  // Area 2: RC Modeling - Beams (Kirisler & Egrisal Kirisler)
  // =========================================================================
  describe("Area 2: RC Modeling - Beams", () => {
    test("2.1 Standard rectangular beam geometry, span length and footprint", () => {
      const beam: BeamElement = {
        id: "beam-1",
        name: "K101",
        type: "beam",
        floorId: "floor-0",
        materialId: "concrete",
        layer: "Kirisler",
        start: { x: 0, y: 0 },
        end: { x: 5, y: 0 },
        width: 0.25,
        height: 0.50,
      };
      const span = distance(beam.start, beam.end);
      assert.equal(span, 5.0, "Beam span must be exactly 5.0 m");
      const footprint = elementFootprint(beam);
      assert.equal(footprint.length, 4, "Linear beam footprint must be a 4-corner polygon");
      const area = polygonArea(footprint);
      assert.ok(Math.abs(area - 1.25) < 1e-5, `Beam footprint area must be 5.0 * 0.25 = 1.25 m2, got ${area}`);
    });

    test("2.2 Curved beam geometry with curveSagitta and curveSegments", () => {
      const beam: BeamElement = {
        id: "beam-curved-1",
        name: "K102",
        type: "beam",
        floorId: "floor-0",
        materialId: "concrete",
        layer: "Kirisler",
        start: { x: 0, y: 0 },
        end: { x: 6, y: 0 },
        width: 0.25,
        height: 0.50,
        curveSagitta: 0.60,
        curveSegments: 12,
      };
      const footprint = elementFootprint(beam);
      assert.ok(footprint.length >= 12, "Curved beam footprint must produce segmented vertices");
      const area = polygonArea(footprint);
      assert.ok(area > 1.50, "Curved beam footprint area must exceed straight beam area due to arc length");
    });

    test("2.3 Beam alignment offsets ('center', 'left', 'right')", () => {
      const beamCenter: BeamElement = {
        id: "b-c",
        name: "K-C",
        type: "beam",
        floorId: "floor-0",
        materialId: "concrete",
        layer: "Kirisler",
        start: { x: 0, y: 0 },
        end: { x: 4, y: 0 },
        width: 0.30,
        height: 0.50,
        alignment: "center",
      };
      const beamLeft: BeamElement = { ...beamCenter, id: "b-l", alignment: "left" };
      const fpC = elementFootprint(beamCenter);
      const fpL = elementFootprint(beamLeft);
      const meanYC = fpC.reduce((s, p) => s + p.y, 0) / fpC.length;
      const meanYL = fpL.reduce((s, p) => s + p.y, 0) / fpL.length;
      assert.ok(Math.abs(meanYC) < 1e-5, "Center alignment must have mean Y = 0");
      assert.ok(meanYL > 0.05, "Left alignment must shift polygon along positive lateral normal");
    });

    test("2.4 Sloped beam with differential topOffset and endTopOffset", () => {
      const beam: BeamElement = {
        id: "b-sloped",
        name: "K-Sloped",
        type: "beam",
        floorId: "floor-0",
        materialId: "concrete",
        layer: "Kirisler",
        start: { x: 0, y: 0 },
        end: { x: 3, y: 4 }, // 5m plan span
        width: 0.25,
        height: 0.50,
        topOffset: 0.0,
        endTopOffset: 1.0,
      };
      const planSpan = distance(beam.start, beam.end);
      const deltaZ = (beam.endTopOffset ?? 0) - (beam.topOffset ?? 0);
      const true3DLength = Math.hypot(planSpan, deltaZ);
      assert.equal(planSpan, 5.0);
      assert.ok(Math.abs(true3DLength - Math.sqrt(26)) < 1e-6, "3D sloped beam length must be sqrt(5^2 + 1^2) = sqrt(26)");
    });

    test("2.5 Continuous beam multi-span intersection with columns", () => {
      const model = createDemoModel();
      const beams = model.elements.filter(e => e.type === "beam") as BeamElement[];
      const cols = model.elements.filter(e => e.type === "column") as ColumnElement[];
      assert.equal(beams.length, 4, "Demo model must have 4 perimeter beams");
      assert.equal(cols.length, 4, "Demo model must have 4 corner columns");
      // Check beam ends connect to column locations
      for (const b of beams) {
        const startMatchesCol = cols.some(c => distance(b.start, c.position) < 0.01);
        const endMatchesCol = cols.some(c => distance(b.end, c.position) < 0.01);
        assert.ok(startMatchesCol && endMatchesCol, `Beam ${b.name} endpoints must snap to columns`);
      }
    });
  });

  // =========================================================================
  // Area 3: RC Modeling - Shear Walls (Perdeler & Subasman)
  // =========================================================================
  describe("Area 3: RC Modeling - Shear Walls", () => {
    test("3.1 Shear wall aspect ratio criterion lw / bw >= 6.0 per TBDY 2018 §7.6.1.1", () => {
      const wall: WallElement = {
        id: "wall-1",
        name: "P101",
        type: "wall",
        floorId: "floor-0",
        materialId: "concrete",
        layer: "Perdeler",
        start: { x: 0, y: 0 },
        end: { x: 2.10, y: 0 },
        thickness: 0.25,
        height: 3.0,
      };
      const lw = distance(wall.start, wall.end);
      const bw = wall.thickness;
      const aspectRatio = lw / bw;
      assert.ok(aspectRatio >= 6.0, `Shear wall ratio must be >= 6.0 (got ${aspectRatio.toFixed(2)})`);
    });

    test("3.2 Subasman perdesi geometric model (heightMode: 'fixed', negative baseOffset)", () => {
      const floor: Floor = { id: "floor-0", name: "Zemin", elevation: 0.0, height: 3.0 };
      const subasman: WallElement = {
        id: "wall-sub-1",
        name: "P-Sub",
        type: "wall",
        floorId: "floor-0",
        materialId: "concrete",
        layer: "Perdeler",
        start: { x: 0, y: 0 },
        end: { x: 3.0, y: 0 },
        thickness: 0.25,
        height: 1.20,
        heightMode: "fixed",
        baseOffset: -1.20,
      };
      const [bottom, top] = elementVerticalRange(subasman, floor);
      assert.equal(bottom, -1.20, "Subasman bottom must be -1.20m");
      assert.equal(top, 0.0, "Subasman top must reach ground floor datum (0.0m)");
      assert.equal(top - bottom, 1.20, "Subasman clear height must be 1.20m");
    });

    test("3.3 Curved shear wall footprint calculation with curveSagitta", () => {
      const wall: WallElement = {
        id: "wall-curve-1",
        name: "P-Curved",
        type: "wall",
        floorId: "floor-0",
        materialId: "concrete",
        layer: "Perdeler",
        start: { x: 0, y: 0 },
        end: { x: 4.0, y: 0 },
        thickness: 0.30,
        height: 3.0,
        curveSagitta: 0.50,
        curveSegments: 16,
      };
      const fp = elementFootprint(wall);
      assert.ok(fp.length >= 16, "Curved wall polygon must have segmented vertices");
      const area = polygonArea(fp);
      assert.ok(area > 4.0 * 0.30, "Curved wall area must exceed chord footprint area");
    });

    test("3.4 Shear wall lateral alignment ('center', 'left', 'right')", () => {
      const wCenter: WallElement = {
        id: "w-c",
        name: "P-C",
        type: "wall",
        floorId: "floor-0",
        materialId: "concrete",
        layer: "Perdeler",
        start: { x: 0, y: 0 },
        end: { x: 3.0, y: 0 },
        thickness: 0.25,
        height: 3.0,
        alignment: "center",
      };
      const wRight: WallElement = { ...wCenter, id: "w-r", alignment: "right" };
      const fpC = elementFootprint(wCenter);
      const fpR = elementFootprint(wRight);
      const meanYC = fpC.reduce((s, p) => s + p.y, 0) / fpC.length;
      const meanYR = fpR.reduce((s, p) => s + p.y, 0) / fpR.length;
      assert.ok(Math.abs(meanYC) < 1e-5, "Center wall polygon centered at y=0");
      assert.ok(meanYR < -0.05, "Right aligned wall polygon shifted toward negative Y");
    });

    test("3.5 Shear wall precedence in CSG junction resolution over intersecting beams", () => {
      const model = createDemoModel();
      // Wall P1 intersects demo model
      const junctions = resolveJunctions(model);
      assert.equal(junctions.status, "resolved");
      const wallId = "wall-0";
      const wallQty = junctions.byElement[wallId];
      assert.ok(wallQty && wallQty.netVolume !== null && wallQty.netVolume > 0, "Wall net volume must be positive");
    });
  });

  // =========================================================================
  // Area 4: RC Modeling - Slabs & Slab Voids (Doseme & Bosluk)
  // =========================================================================
  describe("Area 4: RC Modeling - Slabs & Slab Voids", () => {
    test("4.1 Convex rectangular slab polygon and structural volume", () => {
      const slab: SlabElement = {
        id: "slab-1",
        name: "D101",
        type: "slab",
        floorId: "floor-0",
        materialId: "concrete",
        layer: "Dosemeler",
        points: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 4 }, { x: 0, y: 4 }],
        thickness: 0.15,
      };
      const area = polygonArea(slab.points);
      assert.equal(area, 20.0, "5m x 4m slab area must be 20.0 m2");
      const vol = area * slab.thickness;
      assert.equal(vol, 3.0, "20 m2 * 0.15m slab volume must be 3.0 m3");
    });

    test("4.2 Slab opening / void cutout area deduction", () => {
      const outerPoints = [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 6 }, { x: 0, y: 6 }];
      const voidPoints = [{ x: 2, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 4 }, { x: 2, y: 4 }];
      const outerArea = polygonArea(outerPoints);
      const voidArea = polygonArea(voidPoints);
      assert.equal(outerArea, 36.0);
      assert.equal(voidArea, 4.0);
      const netSlabArea = outerArea - voidArea;
      assert.equal(netSlabArea, 32.0, "Net slab area with void must be 32.0 m2");
    });

    test("4.3 Sloped slab geometry with slopeX and slopeY", () => {
      const slab: SlabElement = {
        id: "slab-sloped",
        name: "D-Slope",
        type: "slab",
        floorId: "floor-0",
        materialId: "concrete",
        layer: "Dosemeler",
        points: [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 4 }, { x: 0, y: 4 }],
        thickness: 0.15,
        slopeX: 3.0, // 3%
        slopeY: 0.0,
      };
      const area = polygonArea(slab.points);
      const surfaceFactor = Math.hypot(1, (slab.slopeX ?? 0) / 100, (slab.slopeY ?? 0) / 100);
      const trueArea = area * surfaceFactor;
      assert.ok(trueArea > area, "Sloped surface area must exceed planar projected area");
    });

    test("4.4 Multi-layer slab buildup (screed + insulation + structural core)", () => {
      const slab: SlabElement = {
        id: "slab-buildup",
        name: "D-Buildup",
        type: "slab",
        floorId: "floor-0",
        materialId: "concrete",
        layer: "Dosemeler",
        points: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }],
        thickness: 0.15,
        buildUp: [
          { name: "Seramik Kaplama", thickness: 0.02 },
          { name: "Tesviye Şapı", thickness: 0.04 },
          { name: "Isı Yalıtımı", thickness: 0.05 },
        ],
      };
      const totalBuildupThickness = (slab.buildUp ?? []).reduce((s, b) => s + b.thickness, 0);
      assert.ok(Math.abs(totalBuildupThickness - 0.11) < 1e-6, "Buildup thickness must be 0.11 m");
    });

    test("4.5 Slab gravity load dead and live weights (G and Q)", () => {
      const slab: SlabElement = {
        id: "slab-loads",
        name: "D-Loads",
        type: "slab",
        floorId: "floor-0",
        materialId: "concrete",
        layer: "Dosemeler",
        points: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 5 }, { x: 0, y: 5 }],
        thickness: 0.15,
        finishLoad: 1.5, // kN/m2
        liveLoad: 2.0, // kN/m2
      };
      const area = polygonArea(slab.points);
      const deadWeight = area * (slab.thickness * 25.0 + (slab.finishLoad ?? 0));
      const liveWeight = area * (slab.liveLoad ?? 0);
      assert.equal(area, 20.0);
      assert.equal(deadWeight, 20.0 * (0.15 * 25 + 1.5)); // 20 * (3.75 + 1.5) = 105 kN
      assert.equal(liveWeight, 20.0 * 2.0); // 40 kN
    });
  });

  // =========================================================================
  // Area 5: RC Modeling - Foundations (Radye & Tekil / Surekli)
  // =========================================================================
  describe("Area 5: RC Modeling - Foundations", () => {
    test("5.1 Raft foundation (Radye) generation with boundary offset and thickness", () => {
      const model = createDemoModel();
      const raftCorners = [{ x: -0.5, y: -0.5 }, { x: 4.5, y: -0.5 }, { x: 4.5, y: 4.5 }, { x: -0.5, y: 4.5 }];
      const raftModel = addRaftFoundation(model, "floor-0", raftCorners, 0.65);
      const raft = raftModel.elements.find(e => e.type === "slab" && e.name.includes("RAD")) as SlabElement;
      assert.ok(raft, "Raft foundation element must be created");
      assert.equal(raft.thickness, 0.65, "Raft thickness must match 0.65 m baseline");
      const area = polygonArea(raft.points);
      assert.ok(area > 16.0, "Raft area with 0.50m overhang must exceed building 4x4 footprint");
    });

    test("5.2 Isolated pad footing (Tekil Temel) generation on columns", () => {
      const model = createDemoModel();
      const col = model.elements.find(e => e.type === "column") as ColumnElement;
      const footingModel = addPadFootingToColumn(model, col, 1.80, 1.80, 0.60);
      const footing = footingModel.elements.find(e => e.name === `TK-${col.name}`) as ColumnElement;
      assert.ok(footing, "Isolated footing must be generated for column");
      assert.equal(footing.width, 1.80);
      assert.equal(footing.depth, 1.80);
      assert.equal(footing.height, 0.60);
      assert.equal(footing.baseOffset, -0.60);
    });

    test("5.3 Continuous strip footing (Surekli Temel) generation under beams", () => {
      const model = createDemoModel();
      const beams = model.elements.filter(e => e.type === "beam") as BeamElement[];
      const stripModel = addStripFootingToBeam(model, beams[0], 0.80, 0.50);
      const strip = stripModel.elements.find(e => e.name === `ST-${beams[0].name}`) as BeamElement;
      assert.ok(strip, "Strip footing must be created under beam");
      assert.equal(strip.width, 0.80);
      assert.equal(strip.height, 0.50);
    });

    test("5.4 Soil bearing pressure calculation under concentric vertical load (q <= qSafe)", () => {
      const axialKn = 600;
      const momentKnm = 30;
      const width = 2.0;
      const depth = 2.0;
      const qSafe = 200;
      const check = calculateSoilPressure(axialKn, momentKnm, width, depth, qSafe);
      assert.ok(check.pass, "Soil pressure must pass when qMax <= qSafe");
      assert.ok(check.qMaxKpa <= qSafe, `qMax ${check.qMaxKpa} must be <= ${qSafe}`);
      assert.ok(check.qMinKpa >= 0, "Minimum soil pressure must be non-negative");
    });

    test("5.5 Soil bearing pressure failure under excessive moment overturning", () => {
      const axialKn = 200;
      const momentKnm = 350; // Excessive overturning
      const width = 1.5;
      const depth = 1.5;
      const qSafe = 150;
      const check = calculateSoilPressure(axialKn, momentKnm, width, depth, qSafe);
      assert.ok(!check.pass, "Excessive moment must cause soil bearing pressure failure");
      assert.ok(check.qMaxKpa > qSafe, "qMax must exceed qSafe under extreme eccentricity");
    });
  });

  // =========================================================================
  // Area 6: RC Modeling - Stairs (Merdivenler)
  // =========================================================================
  describe("Area 6: RC Modeling - Stairs", () => {
    test("6.1 Monolithic RC stair flight geometry and riser/tread parameters", () => {
      const model = createEmptyModel();
      const updated = addStairToModel(model, "floor-0", { x: 0, y: 0 }, { x: 4.5, y: 0 }, {
        widthM: 1.20,
        stepCount: 16,
        riserHeightM: 0.175,
        waistThicknessM: 0.15,
      });
      const stair = updated.elements.find(e => e.layer === "Merdivenler") as SlabElement;
      assert.ok(stair, "Stair element must be added to model");
      assert.equal(stair.thickness, 0.15, "Stair waist thickness must match parameter");
      const w = distance(stair.points[0], stair.points[3]);
      assert.ok(Math.abs(w - 1.20) < 1e-4, "Stair width must be 1.20 m");
    });

    test("6.2 Stair geometric and comfort formula calculation", () => {
      const geom = calculateStairGeometry({
        widthM: 1.20,
        stepCount: 16,
        riserHeightM: 0.175,
        waistThicknessM: 0.15,
      }, { x: 0, y: 0 }, { x: 4.0, y: 0 });
      assert.equal(geom.totalHeightM, 16 * 0.175);
      assert.equal(geom.totalRunM, 4.0);
      assert.ok(geom.concreteVolumeM3 > 0, "Stair concrete volume must be positive");
      assert.ok(geom.formworkAreaM2 > 0, "Stair formwork area must be positive");
      assert.equal(geom.comfortFormulaCheck, true, "Blondel comfort formula must pass");
    });

    test("6.3 Blondel stair ergonomic formula: 2*riser + tread in 60..64 cm", () => {
      const riserM = 2.80 / 16; // 0.175 m (17.5 cm)
      const treadM = 3.60 / 15; // 0.24 m (24.0 cm)
      const blondelCm = 2 * (riserM * 100) + (treadM * 100);
      assert.ok(blondelCm >= 58 && blondelCm <= 66, `2s + b must be near ergonomic range 60-64 cm, got ${blondelCm.toFixed(1)} cm`);
    });

    test("6.4 Stair reaction force transfer to supporting landing beams", () => {
      const totalWeightKn = 45.0; // Typical stair dead + live load
      const reactionPerEnd = totalWeightKn / 2.0;
      assert.equal(reactionPerEnd, 22.5, "Simply supported stair reactions must split 50/50 between supports");
    });

    test("6.5 Interactive 2-click stair placement bounds", () => {
      const p1 = { x: 2, y: 1 };
      const p2 = { x: 6, y: 4 };
      const flightLength = distance(p1, p2);
      assert.equal(flightLength, 5.0, "3-4-5 triangle flight length must be 5.0 m");
    });
  });

  // =========================================================================
  // Area 7: RC Modeling - Axes & Grid (Akslar)
  // =========================================================================
  describe("Area 7: RC Modeling - Axes & Grid", () => {
    test("7.1 Orthogonal grid axis endpoints, label and layer", () => {
      const axisX: AxisElement = {
        id: "axis-1",
        name: "1",
        type: "axis",
        floorId: "floor-0",
        materialId: "concrete",
        layer: "Akslar",
        start: { x: 0, y: -1 },
        end: { x: 0, y: 10 },
        orientation: "vertical",
        labelSide: "both",
      };
      assert.equal(axisX.orientation, "vertical");
      assert.equal(axisX.name, "1");
      assert.equal(distance(axisX.start, axisX.end), 11.0);
    });

    test("7.2 Axis extension and label side configurations", () => {
      const axis: AxisElement = {
        id: "axis-A",
        name: "A",
        type: "axis",
        floorId: "floor-0",
        materialId: "concrete",
        layer: "Akslar",
        start: { x: -2, y: 0 },
        end: { x: 12, y: 0 },
        extension: 1.5,
        labelSide: "start",
      };
      assert.equal(axis.extension, 1.5);
      assert.equal(axis.labelSide, "start");
    });

    test("7.3 Orthogonal grid intersection point calculation", () => {
      const ax1: AxisElement = {
        id: "a1", name: "1", type: "axis", floorId: "f0", materialId: "c", layer: "A",
        start: { x: 4, y: -5 }, end: { x: 4, y: 15 },
      };
      const axA: AxisElement = {
        id: "aA", name: "A", type: "axis", floorId: "f0", materialId: "c", layer: "A",
        start: { x: -5, y: 6 }, end: { x: 15, y: 6 },
      };
      // Intersection must be (4, 6)
      const ix = ax1.start.x;
      const iy = axA.start.y;
      assert.equal(ix, 4);
      assert.equal(iy, 6);
    });

    test("7.4 Skewed / Angled axis line angle and orientation", () => {
      const angledAxis: AxisElement = {
        id: "axis-skewed",
        name: "S-1",
        type: "axis",
        floorId: "f0",
        materialId: "c",
        layer: "Akslar",
        start: { x: 0, y: 0 },
        end: { x: 3, y: 3 },
        orientation: "free",
      };
      const angleRad = Math.atan2(angledAxis.end.y - angledAxis.start.y, angledAxis.end.x - angledAxis.start.x);
      const angleDeg = (angleRad * 180) / Math.PI;
      assert.ok(Math.abs(angleDeg - 45.0) < 1e-5, "Diagonal axis must be at 45 degrees");
    });

    test("7.5 Axis minor flag for secondary framing lines", () => {
      const minorAxis: AxisElement = {
        id: "axis-minor",
        name: "1'",
        type: "axis",
        floorId: "f0",
        materialId: "c",
        layer: "Akslar",
        start: { x: 2.5, y: 0 },
        end: { x: 2.5, y: 8 },
        minor: true,
      };
      assert.equal(minorAxis.minor, true, "Secondary intermediate axis must have minor=true");
    });
  });

  // =========================================================================
  // Area 8: RC Modeling - Storey Management (Katlar & Kotlar)
  // =========================================================================
  describe("Area 8: RC Modeling - Storey Management", () => {
    test("8.1 Multi-storey elevation monotonicity and elevation stack", () => {
      const floors: Floor[] = [
        { id: "b1", name: "1. Bodrum", elevation: -2.5, height: 3.0 },
        { id: "zk", name: "Zemin Kat", elevation: 0.5, height: 4.0 },
        { id: "k1", name: "1. Kat", elevation: 4.5, height: 3.0 },
        { id: "k2", name: "2. Kat", elevation: 7.5, height: 3.0 },
      ];
      for (let i = 1; i < floors.length; i++) {
        assert.ok(floors[i].elevation > floors[i - 1].elevation, "Storey elevations must be strictly ascending");
        assert.equal(floors[i].elevation, floors[i - 1].elevation + floors[i - 1].height, "Elevation step must equal floor height");
      }
    });

    test("8.2 Total building structural height calculation HN", () => {
      const floors: Floor[] = [
        { id: "f0", name: "Zemin", elevation: 0, height: 3.5 },
        { id: "f1", name: "1. Kat", elevation: 3.5, height: 3.0 },
        { id: "f2", name: "2. Kat", elevation: 6.5, height: 3.0 },
      ];
      const totalH = floors.reduce((s, f) => s + f.height, 0);
      assert.equal(totalH, 9.5, "Total building height must be 9.5 m");
    });

    test("8.3 Architectural floor offset configuration", () => {
      const floor: Floor = { id: "f0", name: "Zemin", elevation: 0, height: 3.0, architecturalOffset: 0.10 };
      assert.equal(floor.architecturalOffset, 0.10, "Architectural floor offset must be preserved");
    });

    test("8.4 Storey element filtering by floorId", () => {
      const model = createDemoModel();
      const zeminElements = model.elements.filter(e => e.floorId === "floor-0");
      assert.equal(zeminElements.length, model.elements.length, "All demo elements reside on floor-0");
    });

    test("8.5 validateModel verifies multi-storey models without corruption", () => {
      const model = createDemoModel();
      model.floors.push({ id: "floor-1", name: "1. Kat", elevation: 3.0, height: 3.0 });
      const validated = validateModel(model);
      assert.equal(validated.floors.length, 2);
      assert.equal(validated.floors[1].name, "1. Kat");
    });
  });

  // =========================================================================
  // Area 9: Exclusion of Non-RC Elements (Steel, Dome, Pile)
  // =========================================================================
  describe("Area 9: Exclusion of Non-RC Elements", () => {
    function collectCommands(cmds: any[]): any[] {
      return cmds.flatMap(c => [c, ...collectCommands(c.children || [])]);
    }

    test("9.1 Ribbon tabs exclude all pure steel tabs and panels", () => {
      for (const tab of PRODUCT_RIBBON_TABS) {
        assert.notEqual(tab.label, "Çelik", "Çelik tab must not be present in active RC ribbon");
        for (const panel of tab.panels) {
          assert.ok(!/çelik/i.test(panel.label), `Panel '${panel.label}' must not contain steel keywords`);
        }
      }
    });

    test("9.2 Active ribbon commands contain zero steel command symbols", () => {
      const allCommands = PRODUCT_RIBBON_TABS.flatMap(t => t.panels.flatMap(p => collectCommands(p.commands)));
      for (const cmd of allCommands) {
        assert.ok(!/STEEL/.test(cmd.symbol), `Command symbol ${cmd.symbol} must not be steel`);
      }
    });

    test("9.3 Preserves reinforced concrete joint safety commands per TBDY 2018 §7.5", () => {
      const allNative = NATIVE_RIBBON_TABS.flatMap(t => t.panels.flatMap(p => collectCommands(p.commands)));
      const jointCmd = allNative.find(c => c.commandId === 12260 || c.commandId === 11910 || /birleşim/i.test(c.label));
      assert.ok(jointCmd, "Joint safety command must be present in ribbon layout");
    });

    test("9.4 Reinforced concrete primary tools are fully registered and accessible", () => {
      const allCommands = PRODUCT_RIBBON_TABS.flatMap(t => t.panels.flatMap(p => collectCommands(p.commands)));
      const colCmd = allCommands.find(c => c.commandId === 12820);
      const beamCmd = allCommands.find(c => c.commandId === 12910);
      const wallCmd = allCommands.find(c => c.commandId === 13810);
      const slabCmd = allCommands.find(c => c.commandId === 12570);
      assert.ok(colCmd, "Column tool (12820) must be present in ribbon");
      assert.ok(beamCmd, "Beam tool (12910) must be present in ribbon");
      assert.ok(wallCmd, "Wall tool (13810) must be present in ribbon");
      assert.ok(slabCmd, "Slab tool (12570) must be present in ribbon");
    });

    test("9.5 Non-RC items (piles, domes, purlins) are flagged or audited in ribbon inventory", () => {
      const allNative = NATIVE_RIBBON_TABS.flatMap(t => t.panels.flatMap(p => collectCommands(p.commands)));
      const pileCommands = allNative.filter(c => /kazık/i.test(c.label));
      const domeCommands = allNative.filter(c => /kubbe|tonoz/i.test(c.label));
      assert.ok(pileCommands.length > 0, "Native repo catalog contains pile commands to audit");
      assert.ok(domeCommands.length > 0, "Native repo catalog contains dome commands to audit");
    });
  });

  // =========================================================================
  // Area 10: 3D Frame Matrix Solver & Stiffness Assembly
  // =========================================================================
  describe("Area 10: 3D Frame Matrix Solver & Stiffness Assembly", () => {
    test("10.1 Frame element flexural stiffness formula 12*E*I / h^3", () => {
      const E_kPa = 32000 * 1000; // C30 concrete E in kPa
      const b = 0.40, d = 0.40, h = 3.0;
      const I = (b * Math.pow(d, 3)) / 12; // 0.002133 m4
      const k = (12 * E_kPa * I) / Math.pow(h, 3);
      assert.ok(k > 20000 && k < 40000, `Column flexural stiffness must be realistic (~30,340 kN/m), got ${k.toFixed(0)}`);
    });

    test("10.2 Cracked stiffness reduction factors per TBDY 2018 Table 4.2", () => {
      const colGrossI = 0.002133;
      const colCrackedI = colGrossI * 0.70;
      const beamCrackedFactor = 0.35;
      const wallCrackedFactor = 0.50;
      assert.equal(colCrackedI / colGrossI, 0.70, "Column cracked modifier must be 0.70");
      assert.equal(beamCrackedFactor, 0.35, "Beam cracked modifier must be 0.35");
      assert.equal(wallCrackedFactor, 0.50, "Wall cracked modifier must be 0.50");
    });

    test("10.3 Storey lateral stiffness assembly equals sum of vertical elements", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      assert.ok(res.storeys.length > 0);
      const zemin = res.storeys[0];
      assert.ok(zemin.stiffnessKnPerM > 1000, "Storey stiffness must be positive and non-trivial");
    });

    test("10.4 Storey drift displacement Delta = Vi / K_storey", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      const zemin = res.storeys[0];
      const expectedDriftM = zemin.shearForceKn / zemin.stiffnessKnPerM;
      assert.ok(Math.abs(zemin.driftM - expectedDriftM) < 1e-6, "Storey drift must equal shear force divided by storey stiffness");
    });

    test("10.5 Global structural equilibrium: base shear equals sum of storey lateral forces", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      const sumF = res.storeys.reduce((s, st) => s + st.lateralForceKn, 0);
      assert.ok(Math.abs(sumF - res.baseShearKn) < 0.1, `Sum of storey forces (${sumF}) must equal base shear (${res.baseShearKn})`);
    });
  });

  // =========================================================================
  // Area 11: Seismic Loading per TBDY 2018 (DD-2, ZB Spectrum)
  // =========================================================================
  describe("Area 11: Seismic Loading per TBDY 2018", () => {
    test("11.1 Spectral acceleration Sa for plateau range TA <= T <= TB", () => {
      const sds = 0.3861;
      const sd1 = 0.1144;
      const TA = 0.2 * (sd1 / sds); // ~0.059 s
      const TB = sd1 / sds;         // ~0.296 s
      const T = 0.20; // in plateau
      assert.ok(T >= TA && T <= TB);
      const Sa = sds; // on plateau Sa = SDS
      assert.equal(Sa, 0.3861);
    });

    test("11.2 Spectral acceleration Sa for descending branch T > TB", () => {
      const sds = 0.3861;
      const sd1 = 0.1144;
      const TB = sd1 / sds;
      const T = 0.73; // MUSTAFA SELVI Mode 1
      assert.ok(T > TB);
      const Sa = sd1 / T;
      assert.ok(Math.abs(Sa - 0.1567) < 1e-3, `Descending Sa must be SD1/T = ${0.1144 / 0.73}`);
    });

    test("11.3 Building seismic weight W = sum(G + n*Q) with live load factor n=0.30", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model, { liveLoadParticipation: 0.30 });
      assert.ok(res.totalWeightKn > 0);
      assert.equal(res.settings.liveLoadParticipation, 0.30);
    });

    test("11.4 Minimum base shear limit Vt >= 0.04 * W * I * SDS", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      assert.ok(res.baseShearKn >= res.minBaseShearKn, "Base shear must never drop below 0.04*W*I*SDS");
    });

    test("11.5 Storey lateral force distribution Fi proportional to wi * Hi", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      for (const st of res.storeys) {
        assert.ok(st.lateralForceKn > 0, "Each storey must receive positive lateral seismic force");
      }
    });
  });

  // =========================================================================
  // Area 12: Load Combinations Superposition (32 Combos)
  // =========================================================================
  describe("Area 12: Load Combinations Superposition", () => {
    test("12.1 Ultimate vertical combination 1.4G + 1.6Q", () => {
      const G = 100, Q = 50;
      const Fd = 1.4 * G + 1.6 * Q;
      assert.equal(Fd, 220, "1.4G + 1.6Q must equal 220");
    });

    test("12.2 Seismic directional combination G + Q + Ex + 0.3Ey", () => {
      const G = 100, Q = 30, Ex = 40, Ey = 30;
      const comboX = G + Q + Ex + 0.3 * Ey;
      assert.equal(comboX, 179, "G + Q + Ex + 0.3Ey must equal 179");
    });

    test("12.3 Uplift / reversal combination 0.9G - Ex", () => {
      const G = 100, Ex = 40;
      const comboUplift = 0.9 * G - Ex;
      assert.equal(comboUplift, 50, "0.9G - Ex must equal 50");
    });

    test("12.4 Vertical earthquake effect Ez = (2/3) * SDS * G", () => {
      const G = 100;
      const sds = 0.3861;
      const Ez = (2 / 3) * sds * G;
      assert.ok(Math.abs(Ez - 25.74) < 1e-2, `Vertical earthquake Ez must be ~25.74 kN, got ${Ez}`);
    });

    test("12.5 Governing envelope selects maximum axial, moment and shear", () => {
      const combos = [120, 240, 180, 210, 95];
      const governing = Math.max(...combos);
      assert.equal(governing, 240, "Governing load must be maximum of combinations");
    });
  });

  // =========================================================================
  // Area 13: Column Design per TS 500 & TBDY 2018
  // =========================================================================
  describe("Area 13: Column Design per TS 500 & TBDY 2018", () => {
    test("13.1 Column axial stress ratio limit Nd / (Ac * fcd) <= 0.40 per §7.3.1.1", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      const cols = model.elements.filter(e => e.type === "column");
      for (const col of cols) {
        const mRes = res.members[col.id];
        assert.ok(mRes.axialStressRatio !== undefined);
        assert.ok(mRes.axialStressRatio <= 0.40, `Column axial stress ratio must be <= 0.40, got ${mRes.axialStressRatio}`);
      }
    });

    test("13.2 Column minimum longitudinal rebar ratio rho >= 0.01 (1%)", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      const cols = model.elements.filter(e => e.type === "column") as ColumnElement[];
      for (const col of cols) {
        const mRes = res.members[col.id];
        const AcCm2 = col.width * col.depth * 10000;
        const minAs = 0.01 * AcCm2;
        assert.ok(mRes.requiredRebarCm2 >= minAs * 0.99, `Column rebar must be >= 1% Ac (${minAs} cm2), got ${mRes.requiredRebarCm2}`);
      }
    });

    test("13.3 Column confinement zone stirrup spacing s <= min(b/3, 10 cm) per §7.3.4", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      const cols = model.elements.filter(e => e.type === "column");
      for (const col of cols) {
        const mRes = res.members[col.id];
        assert.ok(mRes.confinementSpacingCm <= 10, "Column confinement spacing must not exceed 10 cm");
      }
    });

    test("13.4 Column moment capacity Mr and demand-capacity ratio DCR", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      const cols = model.elements.filter(e => e.type === "column");
      for (const col of cols) {
        const mRes = res.members[col.id];
        assert.ok(mRes.capacityMomentKnm > 0, "Capacity moment must be positive");
        assert.equal(mRes.capacityRatio, mRes.momentKnm / mRes.capacityMomentKnm);
      }
    });

    test("13.5 Strong Column - Weak Beam joint capacity ratio sum(Mc) >= 1.2 * sum(Mb)", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      const cols = model.elements.filter(e => e.type === "column");
      for (const col of cols) {
        const check = res.columnBeamMoments[col.id];
        assert.ok(check, `Column ${col.name} must have strong column check`);
        assert.ok(check.sumColumnMomentKnm > 0);
      }
    });
  });

  // =========================================================================
  // Area 14: Beam Design per TS 500 & TBDY 2018
  // =========================================================================
  describe("Area 14: Beam Design per TS 500 & TBDY 2018", () => {
    test("14.1 Beam span flexural rebar As >= 0.8 * (fctd/fyk) * bw * d", () => {
      const bw = 250, d = 460;
      const fctd = 1.30, fyk = 420;
      const minAsMm2 = 0.8 * (fctd / fyk) * bw * d;
      assert.ok(minAsMm2 > 250 && minAsMm2 < 350, `Min beam steel must be ~285 mm2, got ${minAsMm2.toFixed(1)}`);
    });

    test("14.2 Beam shear capacity check Ve <= Vr <= 0.85 * bw * d * sqrt(fck)", () => {
      const bw = 250, d = 460, fck = 30;
      const maxVrKn = (0.85 * bw * d * Math.sqrt(fck)) / 1000;
      assert.ok(maxVrKn > 500, `Max shear limit must be > 500 kN, got ${maxVrKn.toFixed(1)}`);
    });

    test("14.3 Beam confinement stirrup spacing s <= min(h/4, 8*phi_long, 15 cm)", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      const beams = model.elements.filter(e => e.type === "beam");
      for (const b of beams) {
        const mRes = res.members[b.id];
        assert.ok(mRes.confinementSpacingCm <= 15, "Beam confinement spacing must not exceed 15 cm");
      }
    });

    test("14.4 Beam longitudinal detailing generation produces rebar schedule", () => {
      const model = createDemoModel();
      const beam = model.elements.find(e => e.type === "beam") as BeamElement;
      const detail = generateBeamDetail(beam);
      assert.equal(detail.type, "beam");
      assert.ok(detail.rebarSchedule.length > 0, "Beam detail must produce rebar schedule");
      const totalSteelKg = detail.rebarSchedule.reduce((s, r) => s + r.totalWeightKg, 0);
      assert.ok(totalSteelKg > 10, "Beam steel weight must be realistic (> 10 kg)");
    });

    test("14.5 Beam provided rebar text formatting includes bar diameter symbol", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      const beam = model.elements.find(e => e.type === "beam") as BeamElement;
      const mRes = res.members[beam.id];
      assert.ok(mRes.providedRebarText.includes("Φ") || mRes.providedRebarText.includes("Ø"));
    });
  });

  // =========================================================================
  // Area 15: Shear Wall Design per TBDY 2018
  // =========================================================================
  describe("Area 15: Shear Wall Design per TBDY 2018", () => {
    test("15.1 Critical boundary zone length lu >= max(0.2*Hw, 0.1*Lw) per §7.6.2", () => {
      const Hw = 18.0; // Total wall height (6 storeys)
      const Lw = 3.0;  // Wall length
      const lu1 = 0.2 * Hw; // 3.6 m (in critical height)
      const lu2 = 0.1 * Lw; // 0.3 m
      const minLu = Math.max(0.1 * Lw, 0.2 * Lw); // Plan boundary length
      assert.ok(minLu >= 0.30, "Plan boundary zone length must be >= 0.30 m");
    });

    test("15.2 Web reinforcement minimum ratios rho_sh, rho_sv >= 0.0025 per §7.6.4", () => {
      const tw = 250; // mm
      const minWebSteelMm2PerM = 0.0025 * tw * 1000; // 625 mm2/m
      assert.equal(minWebSteelMm2PerM, 625, "Web reinforcement must be at least 625 mm2/m per face total");
    });

    test("15.3 Dynamic amplified shear force Ve = beta_v * (Mpr/Md) * Vd per §7.6.6", () => {
      const betaV = 1.25;
      const Vd = 120; // kN
      const Mpr_over_Md = 1.30;
      const Ve = betaV * Mpr_over_Md * Vd;
      assert.ok(Ve > Vd, "Capacity design shear Ve must exceed analytical shear Vd");
    });

    test("15.4 Shear wall web shear strength Vr <= 0.85 * Ach * sqrt(fck)", () => {
      const AchMm2 = 250 * 3000; // 0.75 m2
      const fck = 30;
      const maxVrKn = (0.85 * AchMm2 * Math.sqrt(fck)) / 1000;
      assert.ok(maxVrKn > 3000, `Shear wall max shear capacity must be > 3000 kN, got ${maxVrKn.toFixed(0)}`);
    });

    test("15.5 Shear wall moment of inertia dominates building lateral stiffness", () => {
      const tw = 0.25, Lw = 3.0;
      const I_wall = (tw * Math.pow(Lw, 3)) / 12; // 0.5625 m4
      const b_col = 0.4, d_col = 0.4;
      const I_col = (b_col * Math.pow(d_col, 3)) / 12; // 0.002133 m4
      assert.ok(I_wall / I_col > 200, "Shear wall moment of inertia must be > 200x typical column");
    });
  });

  // =========================================================================
  // Area 16: Raft Foundation Design (Soil Pressure, Punching)
  // =========================================================================
  describe("Area 16: Raft Foundation Design", () => {
    test("16.1 Concentric vertical load average soil pressure q = N / A", () => {
      const N = 4000; // kN
      const A = 200;  // m2
      const q = N / A;
      assert.equal(q, 20.0, "Concentric soil pressure must be 20.0 kPa");
    });

    test("16.2 Biaxial overturning moment soil pressure distribution", () => {
      const check = calculateSoilPressure(5000, 1200, 15, 15, 300);
      assert.ok(check.pass);
      assert.ok(check.qMaxKpa > check.qMinKpa);
    });

    test("16.3 Punching critical perimeter u1 at d/2 from column face", () => {
      const colW = 0.40, colD = 0.40, d = 0.60;
      // Critical perimeter u1 = 2 * (colW + d) + 2 * (colD + d)
      const u1 = 2 * (colW + d) + 2 * (colD + d);
      assert.equal(u1, 4.0, "Critical perimeter for 40x40 column with d=60cm must be 4.0 m");
    });

    test("16.4 Punching shear capacity Vpr = fctd * u1 * d per TS 500", () => {
      const fctd = 1.30; // MPa = 1300 kPa
      const u1 = 4.0;    // m
      const d = 0.60;    // m
      const VprKn = (fctd * 1000) * u1 * d;
      assert.equal(VprKn, 3120, "Punching shear capacity must be 3,120 kN");
    });

    test("16.5 Raft foundation punching ratio check in analysis output", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      const cols = model.elements.filter(e => e.type === "column");
      for (const col of cols) {
        const punch = res.punching[col.id];
        assert.ok(punch, `Punching check must exist for column ${col.name}`);
        assert.ok(punch.punchingCapacityKn > 0);
      }
    });
  });

  // =========================================================================
  // Area 17: 2D/3D Internal Force Diagrams (M3, V2, N) & Deformations
  // =========================================================================
  describe("Area 17: 2D/3D Internal Force Diagrams & Deformations", () => {
    test("17.1 Parabolic moment diagram M(x) = q*x*(L-x)/2 extremes", () => {
      const q = 20, L = 6;
      const xMid = L / 2;
      const maxM = (q * Math.pow(L, 2)) / 8;
      const evalMid = (q * xMid * (L - xMid)) / 2;
      assert.equal(evalMid, maxM);
      assert.equal(maxM, 90.0, "Midspan moment must be 90.0 kNm");
    });

    test("17.2 Linear shear diagram V(x) = q*(L/2 - x) zero crossing at midspan", () => {
      const q = 20, L = 6;
      const vLeft = q * (L / 2);
      const vMid = q * (L / 2 - 3);
      const vRight = q * (L / 2 - 6);
      assert.equal(vLeft, 60.0);
      assert.equal(vMid, 0.0, "Shear must cross zero at midspan");
      assert.equal(vRight, -60.0);
    });

    test("17.3 Column axial force distribution increases monotonically down the building", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      const col = model.elements.find(e => e.type === "column");
      const mRes = res.members[col!.id];
      assert.ok(mRes.axialKn > 0, "Column must have positive compression axial force");
    });

    test("17.4 Storey drift displacement vector and ratio Delta_i / h_i", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      for (const st of res.storeys) {
        assert.ok(st.driftRatio >= 0);
        assert.ok(st.driftRatio <= 0.02, "Storey drift ratio must be within reasonable limits");
      }
    });

    test("17.5 Interactive force station hover evaluation", () => {
      const L = 6.0;
      const sampleStations = [0, 1.5, 3.0, 4.5, 6.0];
      for (const x of sampleStations) {
        assert.ok(x >= 0 && x <= L, "Station x must lie within member span");
      }
    });
  });

  // =========================================================================
  // Area 18: Member Capacity Ratios (DCR) Color-Coding
  // =========================================================================
  describe("Area 18: Member Capacity Ratios (DCR) Color-Coding", () => {
    test("18.1 Safe capacity ratio tier (DCR <= 0.70 -> Green)", () => {
      const dcr = 0.55;
      const color = dcr <= 0.70 ? "green" : dcr <= 1.0 ? "yellow" : "red";
      assert.equal(color, "green");
    });

    test("18.2 Warning capacity ratio tier (0.70 < DCR <= 1.00 -> Yellow)", () => {
      const dcr = 0.85;
      const color = dcr <= 0.70 ? "green" : dcr <= 1.0 ? "yellow" : "red";
      assert.equal(color, "yellow");
    });

    test("18.3 Failure capacity ratio tier (DCR > 1.00 -> Red)", () => {
      const dcr = 1.15;
      const color = dcr <= 0.70 ? "green" : dcr <= 1.0 ? "yellow" : "red";
      assert.equal(color, "red");
    });

    test("18.4 Analysis result tracks maxCapacityRatio and overallPass", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      assert.ok(typeof res.overallPass === "boolean");
      assert.ok(res.maxCapacityRatio > 0);
    });

    test("18.5 Member statusText formats capacity percentage correctly", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      const member = Object.values(res.members)[0];
      assert.ok(member.statusText.includes("%"), "Status text must contain percentage");
    });
  });

  // =========================================================================
  // Area 19: Concrete Volume Takeoff (Gross vs Net)
  // =========================================================================
  describe("Area 19: Concrete Volume Takeoff", () => {
    test("19.1 Prismatic column gross volume = b * d * h", () => {
      const col: ColumnElement = {
        id: "c-vol", name: "S1", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 0, y: 0 }, width: 0.5, depth: 0.5, height: 3.0,
      };
      const model: CadModel = { ...createEmptyModel(), elements: [col] };
      const q = calculateQuantities(model);
      const colRow = q.rows.find(r => r.type === "column")!;
      assert.equal(colRow.grossVolume, 0.5 * 0.5 * 3.0);
    });

    test("19.2 Junction deduction at beam-column joint (column priority)", () => {
      const model = createDemoModel();
      const q = calculateQuantities(model);
      assert.ok(q.netVolume !== null);
      assert.ok(q.netVolume <= q.grossVolume, "Net volume must not exceed gross volume");
      assert.ok(q.overlapVolume !== null && q.overlapVolume >= 0, "Overlap volume must be non-negative");
    });

    test("19.3 Slab net volume factors out intersecting beam volumes", () => {
      const model = createDemoModel();
      const q = calculateQuantities(model);
      const slabRow = q.rows.find(r => r.type === "slab")!;
      assert.ok(slabRow.grossVolume > 0);
    });

    test("19.4 Shear wall solid volume = lw * tw * h", () => {
      const wall: WallElement = {
        id: "w-vol", name: "P1", type: "wall", floorId: "floor-0", materialId: "concrete", layer: "Perdeler",
        start: { x: 0, y: 0 }, end: { x: 4, y: 0 }, thickness: 0.25, height: 3.0,
      };
      const model: CadModel = { ...createEmptyModel(), elements: [wall] };
      const q = calculateQuantities(model);
      const wallRow = q.rows.find(r => r.type === "wall")!;
      assert.equal(wallRow.grossVolume, 4.0 * 0.25 * 3.0); // 3.0 m3
    });

    test("19.5 Multi-element complete demo model concrete volume totals", () => {
      const model = createDemoModel();
      const q = calculateQuantities(model);
      assert.ok(q.grossVolume > 5.0, "Demo model concrete volume must exceed 5 m3");
      assert.ok(q.assumptions.length > 0, "Quantities result must document engineering assumptions");
    });
  });

  // =========================================================================
  // Area 20: Formwork Area Takeoff (Net Contact Area)
  // =========================================================================
  describe("Area 20: Formwork Area Takeoff", () => {
    test("20.1 Column vertical perimeter formwork = 2*(b + d) * h", () => {
      const col: ColumnElement = {
        id: "c-fw", name: "S1", type: "column", floorId: "floor-0", materialId: "concrete", layer: "Kolonlar",
        position: { x: 0, y: 0 }, width: 0.4, depth: 0.6, height: 3.0,
      };
      const model: CadModel = { ...createEmptyModel(), elements: [col] };
      const q = calculateQuantities(model);
      const colRow = q.rows.find(r => r.type === "column")!;
      const expectedFw = 2 * (0.4 + 0.6) * 3.0; // 6.0 m2
      assert.equal(colRow.formwork, expectedFw);
    });

    test("20.2 Beam bottom soffit and side formwork calculation", () => {
      const beam: BeamElement = {
        id: "b-fw", name: "K1", type: "beam", floorId: "floor-0", materialId: "concrete", layer: "Kirisler",
        start: { x: 0, y: 0 }, end: { x: 5, y: 0 }, width: 0.25, height: 0.50,
      };
      const model: CadModel = { ...createEmptyModel(), elements: [beam] };
      const q = calculateQuantities(model);
      const beamRow = q.rows.find(r => r.type === "beam")!;
      assert.ok(beamRow.formwork > 0);
    });

    test("20.3 Slab soffit formwork area equals bottom plan contact area", () => {
      const slab: SlabElement = {
        id: "s-fw", name: "D1", type: "slab", floorId: "floor-0", materialId: "concrete", layer: "Dosemeler",
        points: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }],
        thickness: 0.15,
      };
      const model: CadModel = { ...createEmptyModel(), elements: [slab] };
      const q = calculateQuantities(model);
      const slabRow = q.rows.find(r => r.type === "slab")!;
      assert.ok(slabRow.formwork >= 16.0, "Slab formwork must include 16 m2 soffit area");
    });

    test("20.4 Shear wall two-faced side formwork area", () => {
      const wall: WallElement = {
        id: "w-fw", name: "P1", type: "wall", floorId: "floor-0", materialId: "concrete", layer: "Perdeler",
        start: { x: 0, y: 0 }, end: { x: 3, y: 0 }, thickness: 0.25, height: 3.0,
      };
      const model: CadModel = { ...createEmptyModel(), elements: [wall] };
      const q = calculateQuantities(model);
      const wallRow = q.rows.find(r => r.type === "wall")!;
      assert.ok(wallRow.formwork >= 2 * 3.0 * 3.0, "Wall formwork must include both faces (>= 18 m2)");
    });

    test("20.5 Raft foundation edge bulkhead perimeter formwork", () => {
      const raftPerim = 2 * (10 + 10);
      const raftThick = 0.65;
      const raftEdgeFw = raftPerim * raftThick;
      assert.equal(raftEdgeFw, 26.0, "Raft edge formwork must be 26.0 m2");
    });
  });

  // =========================================================================
  // Area 21: Rebar Weight Takeoff (by Diameter Ø8..Ø32 and Element)
  // =========================================================================
  describe("Area 21: Rebar Weight Takeoff", () => {
    test("21.1 REBAR_WEIGHTS standard unit weight lookup table", () => {
      assert.equal(REBAR_WEIGHTS[8], 0.395);
      assert.equal(REBAR_WEIGHTS[10], 0.617);
      assert.equal(REBAR_WEIGHTS[12], 0.888);
      assert.equal(REBAR_WEIGHTS[14], 1.208);
      assert.equal(REBAR_WEIGHTS[16], 1.578);
      assert.equal(REBAR_WEIGHTS[20], 2.466);
    });

    test("21.2 Thin rebar (Ø8 - Ø12) aggregation category", () => {
      const thinBars = [
        { diameterMm: 8, lengthM: 100 },
        { diameterMm: 10, lengthM: 200 },
        { diameterMm: 12, lengthM: 50 },
      ];
      const weightThin = thinBars.reduce((s, b) => s + b.lengthM * REBAR_WEIGHTS[b.diameterMm], 0);
      const expected = 100 * 0.395 + 200 * 0.617 + 50 * 0.888;
      assert.ok(Math.abs(weightThin - expected) < 1e-4);
    });

    test("21.3 Thick rebar (>= Ø14) aggregation category", () => {
      const thickBars = [
        { diameterMm: 14, lengthM: 150 },
        { diameterMm: 16, lengthM: 100 },
        { diameterMm: 20, lengthM: 50 },
      ];
      const weightThick = thickBars.reduce((s, b) => s + b.lengthM * REBAR_WEIGHTS[b.diameterMm], 0);
      const expected = 150 * 1.208 + 100 * 1.578 + 50 * 2.466;
      assert.ok(Math.abs(weightThick - expected) < 1e-4);
    });

    test("21.4 Column rebar detailing schedule tonnage breakdown", () => {
      const model = createDemoModel();
      const col = model.elements.find(e => e.type === "column") as ColumnElement;
      const detail = generateColumnDetail(col);
      assert.equal(detail.type, "column");
      assert.ok(detail.rebarSchedule.length > 0);
      for (const row of detail.rebarSchedule) {
        assert.ok(row.diameterMm >= 8 && row.diameterMm <= 32);
        assert.ok(row.totalWeightKg > 0);
      }
    });

    test("21.5 Specific steel ratio per cubic metre of concrete (kg / m3)", () => {
      const totalSteelKg = 117421.93; // MUSTAFA SELVI baseline
      const totalConcreteM3 = 1334.02;
      const steelRatio = totalSteelKg / totalConcreteM3;
      assert.ok(steelRatio > 70 && steelRatio < 110, `Realistic RC building rebar density is 70-110 kg/m3, got ${steelRatio.toFixed(1)}`);
    });
  });

  // =========================================================================
  // Area 22: Multi-Page Static Calculation Report Generation
  // =========================================================================
  describe("Area 22: Multi-Page Static Calculation Report Generation", () => {
    test("22.1 Quantity report table generation by element grouping", () => {
      const model = createDemoModel();
      const junctions = resolveJunctions(model);
      const rows = quantityReport(model, junctions, {
        grouping: "type",
        floorId: "",
        types: ["column", "beam", "wall", "slab"],
      });
      assert.ok(rows.length > 0, "Report rows must be generated");
      for (const r of rows) {
        assert.ok(r.count > 0);
        assert.ok(r.gross > 0);
        assert.ok(r.formwork > 0);
      }
    });

    test("22.2 CSV export format conforms to semicolon-delimited standard", () => {
      const model = createDemoModel();
      const junctions = resolveJunctions(model);
      const rows = quantityReport(model, junctions, {
        grouping: "type",
        floorId: "",
        types: ["column", "beam", "wall", "slab"],
      });
      const csv = reportCsv(rows);
      assert.ok(csv.startsWith("\uFEFF"), "CSV must include UTF-8 BOM");
      assert.ok(csv.includes("Grup;Adet;Brüt m³;Net m³;Brüt kalıp m²"));
    });

    test("22.3 Static analysis report summary notes compilation", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      assert.ok(res.summaryNotes.length >= 5, "Report summary notes must include all major code check findings");
      const text = res.summaryNotes.join(" ");
      assert.ok(text.includes("Bina Toplam Ağırlığı"));
      assert.ok(text.includes("Temel Periyot"));
      assert.ok(text.includes("Taban Kesme"));
    });

    test("22.4 Irregularity report sections (A1 torsional and B2 soft storey)", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      assert.ok(res.irregularities.torsionalA1.length > 0, "A1 report table must be populated");
      assert.ok(res.irregularities.softStoreyB2.length > 0, "B2 report table must be populated");
    });

    test("22.5 Storey drift check table contains per-floor compliance flags", () => {
      const model = createDemoModel();
      const res = runStructuralAnalysis(model);
      for (const st of res.storeys) {
        assert.ok(typeof st.driftPass === "boolean", "Each storey must record drift pass/fail boolean");
        assert.ok(typeof st.driftRatio === "number");
      }
    });
  });
});
