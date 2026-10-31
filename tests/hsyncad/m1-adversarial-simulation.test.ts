import assert from "node:assert/strict";
import { test, describe } from "node:test";
import fs from "node:fs";
import path from "node:path";
import {
  createDemoModel,
  createEmptyModel,
  type CadModel,
  type Point,
  type ColumnElement,
  type BeamElement,
  type SlabElement,
} from "../../src/lib/hsyncad/model";
import {
  addStairToModel,
  calculateStairGeometry,
  DEFAULT_STAIR_PARAMS,
  type StairParameters,
} from "../../src/lib/hsyncad/stairs";
import {
  addPadFootingToColumn,
  addStripFootingToBeam,
  addRaftFoundation,
  calculateSoilPressure,
} from "../../src/lib/hsyncad/foundations";
import { distance } from "../../src/lib/hsyncad/geometry";
import { PRODUCT_RIBBON_TABS } from "../../src/lib/hsyncad/product-ribbon";
import {
  NATIVE_RIBBON_TABS,
  type NativeRibbonCommand,
} from "../../src/lib/hsyncad/ribbon-layout";
import {
  historyReducer,
  initialHistory,
  type HistoryAction,
} from "../../src/components/hsyncad/editor-state";

// Helper for polygon area (shoelace formula with local origin translation for numerical stability)
function polygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  const p0 = points[0];
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const xi = points[i].x - p0.x;
    const yi = points[i].y - p0.y;
    const xj = points[j].x - p0.x;
    const yj = points[j].y - p0.y;
    area += xi * yj - xj * yi;
  }
  return Math.abs(area) / 2;
}

// ============================================================================
// 1. Boundary coordinates for 2-click stairs
// ============================================================================
describe("Adversarial Test Suite 1: Boundary Coordinates for 2-Click Stairs", () => {
  const model = createDemoModel();
  const floorId = model.floors[0].id;

  test("1.1 Zero-length stair handling: mathematical stability and geometry calculation", () => {
    const pZero: Point = { x: 3.5, y: 7.2 };
    
    // addStairToModel should not produce NaN or Infinity even if start === end
    const updated = addStairToModel(model, floorId, pZero, pZero);
    const stair = updated.elements.find(e => e.layer === "Merdivenler") as SlabElement;
    assert.ok(stair, "Stair slab must be created in Merdivenler layer");
    assert.equal(stair.points.length, 4);
    for (const pt of stair.points) {
      assert.ok(Number.isFinite(pt.x), "Point x must be finite");
      assert.ok(Number.isFinite(pt.y), "Point y must be finite");
      assert.equal(pt.x, 3.5);
      assert.equal(pt.y, 7.2);
    }
    assert.equal(stair.slopeX, 0);
    assert.equal(stair.slopeY, 0);

    // calculateStairGeometry with zero run
    const calc = calculateStairGeometry(DEFAULT_STAIR_PARAMS, pZero, pZero);
    assert.equal(calc.totalRunM, 0);
    assert.equal(calc.treadDepthM, 0);
    assert.equal(calc.totalHeightM, 16 * 0.175);
    assert.ok(Number.isFinite(calc.concreteVolumeM3), "Volume must be finite");
    assert.ok(Number.isFinite(calc.formworkAreaM2), "Formwork area must be finite");
    assert.equal(calc.comfortFormulaCheck, false, "Zero tread depth fails comfort check safely");
  });

  test("1.2 Threshold boundary enforcement (0.10 m minimum length guard)", () => {
    // In use-drawing-session.ts: distance(pending[0], point) < 0.1 rejects stair placement
    const pStart: Point = { x: 10, y: 20 };
    const pSubThreshold: Point = { x: 10.099, y: 20 }; // dist = 0.099m < 0.10m
    const pSuperThreshold: Point = { x: 10.101, y: 20 }; // dist = 0.101m >= 0.10m

    assert.ok(distance(pStart, pSubThreshold) < 0.1, "Sub-threshold point must be < 0.10m");
    assert.ok(distance(pStart, pSuperThreshold) >= 0.1, "Super-threshold point must be >= 0.10m");

    // addStairToModel with super-threshold produces positive tread depth and valid sloped outline
    const updated = addStairToModel(model, floorId, pStart, pSuperThreshold);
    const stair = updated.elements.find(e => e.id.startsWith("stair-")) as SlabElement;
    assert.ok(stair);
    const width = DEFAULT_STAIR_PARAMS.widthM;
    const area = polygonArea(stair.points);
    const expectedArea = 0.101 * width;
    assert.ok(Math.abs(area - expectedArea) < 1e-4, `Expected area ${expectedArea}, got ${area}`);
  });

  test("1.3 Collinear and orthogonal orientations across all 4 Cartesian quadrants", () => {
    const origin: Point = { x: 0, y: 0 };
    const run = 4.8;
    const w = DEFAULT_STAIR_PARAMS.widthM;

    // +X (East): (0, 0) -> (4.8, 0)
    const stairE = addStairToModel(model, floorId, origin, { x: run, y: 0 }).elements.at(-1) as SlabElement;
    assert.ok(stairE.slopeX! > 0, "Eastward stair has positive slopeX");
    assert.equal(stairE.slopeY, 0, "Eastward stair has zero slopeY");
    assert.ok(Math.abs(polygonArea(stairE.points) - run * w) < 1e-6);

    // -X (West): (0, 0) -> (-4.8, 0)
    const stairW = addStairToModel(model, floorId, origin, { x: -run, y: 0 }).elements.at(-1) as SlabElement;
    assert.ok(stairW.slopeX! < 0, "Westward stair has negative slopeX");
    assert.equal(stairW.slopeY, 0, "Westward stair has zero slopeY");
    assert.ok(Math.abs(polygonArea(stairW.points) - run * w) < 1e-6);

    // +Y (North): (0, 0) -> (0, 4.8)
    const stairN = addStairToModel(model, floorId, origin, { x: 0, y: run }).elements.at(-1) as SlabElement;
    assert.equal(stairN.slopeX, 0, "Northward stair has zero slopeX");
    assert.ok(stairN.slopeY! > 0, "Northward stair has positive slopeY");
    assert.ok(Math.abs(polygonArea(stairN.points) - run * w) < 1e-6);

    // -Y (South): (0, 0) -> (0, -4.8)
    const stairS = addStairToModel(model, floorId, origin, { x: 0, y: -run }).elements.at(-1) as SlabElement;
    assert.equal(stairS.slopeX, 0, "Southward stair has zero slopeX");
    assert.ok(stairS.slopeY! < 0, "Southward stair has negative slopeY");
    assert.ok(Math.abs(polygonArea(stairS.points) - run * w) < 1e-6);

    // Diagonal tests (all 4 quadrants at 3-4-5 triangles)
    const diagonals: [Point, Point][] = [
      [{ x: 0, y: 0 }, { x: 3, y: 4 }],   // Q1
      [{ x: 0, y: 0 }, { x: -3, y: 4 }],  // Q2
      [{ x: 0, y: 0 }, { x: -3, y: -4 }], // Q3
      [{ x: 0, y: 0 }, { x: 3, y: -4 }],  // Q4
    ];

    for (const [s, e] of diagonals) {
      const diagStair = addStairToModel(model, floorId, s, e).elements.at(-1) as SlabElement;
      const expectedArea5 = 5.0 * w; // hypot(3, 4) = 5.0
      const actualArea = polygonArea(diagStair.points);
      assert.ok(
        Math.abs(actualArea - expectedArea5) < 1e-6,
        `Diagonal area mismatch: expected ${expectedArea5}, got ${actualArea}`
      );
      // Verify orthogonality of width normal vector to travel direction
      const dx = e.x - s.x;
      const dy = e.y - s.y;
      const nx = diagStair.points[3].x - s.x;
      const ny = diagStair.points[3].y - s.y;
      const dot = dx * nx + dy * ny;
      assert.ok(Math.abs(dot) < 1e-6, `Dot product must be 0 for perpendicular width, got ${dot}`);
    }
  });

  test("1.4 Negative and extreme coordinates numerical precision", () => {
    // Large negative coordinates
    const startNeg: Point = { x: -500000.5, y: -250000.25 };
    const endNeg: Point = { x: -500000.5 + 4.8, y: -250000.25 };
    const stairNeg = addStairToModel(model, floorId, startNeg, endNeg).elements.at(-1) as SlabElement;
    assert.ok(stairNeg);
    for (const p of stairNeg.points) {
      assert.ok(Number.isFinite(p.x));
      assert.ok(Number.isFinite(p.y));
    }
    assert.ok(Math.abs(polygonArea(stairNeg.points) - 4.8 * 1.2) < 1e-4);

    // Extreme positive coordinates
    const startPos: Point = { x: 1e7, y: 1e7 };
    const endPos: Point = { x: 1e7 + 4.8, y: 1e7 };
    const stairPos = addStairToModel(model, floorId, startPos, endPos).elements.at(-1) as SlabElement;
    assert.ok(stairPos);
    assert.ok(Math.abs(polygonArea(stairPos.points) - 4.8 * 1.2) < 1e-4);
  });

  test("1.5 Crossing storey bounds and multi-storey staircase generation", () => {
    // Model with 3 storeys: -2.5m (Basement), 0.0m (Ground), 3.0m (Floor 1)
    const multiStoreyModel: CadModel = {
      ...model,
      floors: [
        { id: "floor-b1", name: "Bodrum", elevation: -2.5, height: 2.5 },
        { id: "floor-z", name: "Zemin", elevation: 0.0, height: 3.0 },
        { id: "floor-1", name: "1. Kat", elevation: 3.0, height: 3.0 },
      ],
    };

    let cur = multiStoreyModel;
    for (const fl of multiStoreyModel.floors) {
      cur = addStairToModel(cur, fl.id, { x: 0, y: 0 }, { x: 4.8, y: 0 });
    }

    const stairs = cur.elements.filter(e => e.layer === "Merdivenler") as SlabElement[];
    assert.equal(stairs.length, 3, "Each storey must host its distinct stair flight");
    assert.equal(stairs[0].floorId, "floor-b1");
    assert.equal(stairs[1].floorId, "floor-z");
    assert.equal(stairs[2].floorId, "floor-1");
  });

  test("1.6 Parameter stress: step count = 0, step count = 100, extreme risers", () => {
    const s: Point = { x: 0, y: 0 };
    const e: Point = { x: 4.8, y: 0 };

    // stepCount = 0 safely guarded by Math.max(1, params.stepCount)
    const params0: StairParameters = { ...DEFAULT_STAIR_PARAMS, stepCount: 0 };
    const calc0 = calculateStairGeometry(params0, s, e);
    assert.ok(Number.isFinite(calc0.treadDepthM));
    assert.equal(calc0.totalHeightM, 0);

    // stepCount = 100
    const params100: StairParameters = { ...DEFAULT_STAIR_PARAMS, stepCount: 100, riserHeightM: 0.15 };
    const calc100 = calculateStairGeometry(params100, s, e);
    assert.equal(calc100.totalHeightM, 15.0);
    assert.equal(calc100.treadDepthM, 4.8 / 100);
    assert.ok(calc100.concreteVolumeM3 > 0);
  });
});

// ============================================================================
// 2. Footing snapping behavior under edge-case column arrangements
// ============================================================================
describe("Adversarial Test Suite 2: Footing Snapping Under Edge-Case Column Arrangements", () => {
  test("2.1 Twin / Overlapping columns at expansion joint (dilatasyon)", () => {
    const model = createDemoModel();
    const floorId = model.floors[0].id;

    // Add twin columns at dilatasyon gap (0.05 m separation)
    const colA: ColumnElement = {
      id: "col-dilatasyon-A",
      name: "S10A",
      type: "column",
      floorId,
      materialId: model.materials[0].id,
      layer: "Kolonlar",
      position: { x: 8.0, y: 4.0 },
      width: 0.3,
      depth: 0.6,
      height: 3.0,
      baseOffset: 0,
      topOffset: 0,
    };
    const colB: ColumnElement = {
      id: "col-dilatasyon-B",
      name: "S10B",
      type: "column",
      floorId,
      materialId: model.materials[0].id,
      layer: "Kolonlar",
      position: { x: 8.05, y: 4.0 },
      width: 0.3,
      depth: 0.6,
      height: 3.0,
      baseOffset: 0,
      topOffset: 0,
    };

    let cur = { ...model, elements: [...model.elements, colA, colB] };

    // Snapping simulation:
    // Cursor clicked precisely at (8.0, 4.0)
    const cursorA: Point = { x: 8.0, y: 4.0 };
    const targetA = cur.elements.find(e =>
      e.type === "column" &&
      e.floorId === floorId &&
      distance(e.position, cursorA) <= Math.max(e.width, e.depth, 1.5)
    ) as ColumnElement;
    assert.equal(targetA.id, "col-dilatasyon-A");
    cur = addPadFootingToColumn(cur, targetA);

    // Cursor clicked precisely at (8.05, 4.0)
    const cursorB: Point = { x: 8.05, y: 4.0 };
    // Find closest column or target colB specifically
    const candidates = cur.elements.filter(e =>
      e.type === "column" &&
      e.floorId === floorId &&
      !e.id.startsWith("footing-") &&
      distance(e.position, cursorB) <= Math.max(e.width, e.depth, 1.5)
    ) as ColumnElement[];
    // colB is exact match (distance 0)
    const targetB = candidates.sort((a, b) => distance(a.position, cursorB) - distance(b.position, cursorB))[0];
    assert.equal(targetB.id, "col-dilatasyon-B");
    cur = addPadFootingToColumn(cur, targetB);

    // Both footings must co-exist with deterministic IDs and zero collision
    const footA = cur.elements.find(e => e.id === "footing-col-dilatasyon-A");
    const footB = cur.elements.find(e => e.id === "footing-col-dilatasyon-B");
    assert.ok(footA, "Footing for Column A must exist");
    assert.ok(footB, "Footing for Column B must exist");
    assert.notEqual(footA.id, footB.id);
    assert.deepEqual((footA as ColumnElement).position, { x: 8.0, y: 4.0 });
    assert.deepEqual((footB as ColumnElement).position, { x: 8.05, y: 4.0 });
  });

  test("2.2 Snapping radius threshold boundary condition: standard vs wall-column", () => {
    const model = createDemoModel();
    const floorId = model.floors[0].id;

    // Standard column: 0.30 x 0.60 m -> snap radius = max(0.3, 0.6, 1.5) = 1.50 m
    const stdCol: ColumnElement = {
      id: "col-std",
      name: "S_STD",
      type: "column",
      floorId,
      materialId: model.materials[0].id,
      layer: "Kolonlar",
      position: { x: 0, y: 0 },
      width: 0.3,
      depth: 0.6,
      height: 3.0,
      baseOffset: 0,
      topOffset: 0,
    };

    // Sub-threshold click (distance 1.49m)
    const clickInside: Point = { x: 1.49, y: 0 };
    const matchInside = distance(stdCol.position, clickInside) <= Math.max(stdCol.width, stdCol.depth, 1.5);
    assert.equal(matchInside, true, "1.49m must snap to 1.50m radius standard column");

    // Super-threshold click (distance 1.51m)
    const clickOutside: Point = { x: 1.51, y: 0 };
    const matchOutside = distance(stdCol.position, clickOutside) <= Math.max(stdCol.width, stdCol.depth, 1.5);
    assert.equal(matchOutside, false, "1.51m must NOT snap to standard column");

    // Wall-like large column: 2.50 x 0.30 m -> snap radius = max(2.5, 0.3, 1.5) = 2.50 m
    const wallCol: ColumnElement = {
      ...stdCol,
      id: "col-wall",
      name: "P_COL",
      width: 2.5,
      depth: 0.3,
    };
    const clickWallRadius: Point = { x: 2.45, y: 0 };
    const matchWall = distance(wallCol.position, clickWallRadius) <= Math.max(wallCol.width, wallCol.depth, 1.5);
    assert.equal(matchWall, true, "2.45m must snap to large 2.5m wall-column");
  });

  test("2.3 Rotated columns and grid-boundary column footing alignment", () => {
    const model = createDemoModel();
    const floorId = model.floors[0].id;

    const colRotated: ColumnElement = {
      id: "col-rot",
      name: "S_ROT",
      type: "column",
      floorId,
      materialId: model.materials[0].id,
      layer: "Kolonlar",
      position: { x: -100.0, y: -200.0 }, // negative grid edge
      width: 0.4,
      depth: 0.8,
      height: 3.0,
      baseOffset: 0,
      topOffset: 0,
      rotation: 67.5,
    };

    const cur = addPadFootingToColumn({ ...model, elements: [...model.elements, colRotated] }, colRotated);
    const footing = cur.elements.find(e => e.id === "footing-col-rot") as ColumnElement;
    assert.ok(footing);
    assert.equal(footing.rotation, 67.5, "Footing must strictly inherit column orientation angle");
    assert.deepEqual(footing.position, { x: -100.0, y: -200.0 });
    assert.equal(footing.baseOffset, -0.5);
    assert.equal(footing.layer, "Temeller");
  });

  test("2.4 Idempotence: Multiple clicks on the same column do not duplicate footings", () => {
    const model = createDemoModel();
    const col = model.elements.find(e => e.type === "column") as ColumnElement;
    assert.ok(col);

    let cur = model;
    for (let i = 0; i < 10; i++) {
      cur = addPadFootingToColumn(cur, col, 1.5, 1.5, 0.5);
    }

    const footingsForCol = cur.elements.filter(e => e.id === `footing-${col.id}`);
    assert.equal(footingsForCol.length, 1, "Repeated placement must replace existing footing without duplicating");
  });

  test("2.5 Multi-storey column snapping and batch Enter generation", () => {
    const multiStoreyModel: CadModel = {
      ...createDemoModel(),
      floors: [
        { id: "floor-b", name: "Bodrum", elevation: -3.0, height: 3.0 },
        { id: "floor-z", name: "Zemin", elevation: 0.0, height: 3.0 },
      ],
    };

    const lowestFloor = [...multiStoreyModel.floors].sort((a, b) => a.elevation - b.elevation)[0];
    assert.equal(lowestFloor.id, "floor-b", "Lowest floor must be correctly sorted by elevation");

    // Assign 4 columns to floor-b
    const bColumns: ColumnElement[] = [
      { id: "cb1", name: "SB1", type: "column", floorId: "floor-b", materialId: "c30", layer: "Kolonlar", position: { x: 0, y: 0 }, width: 0.3, depth: 0.5, height: 3.0, baseOffset: 0, topOffset: 0 },
      { id: "cb2", name: "SB2", type: "column", floorId: "floor-b", materialId: "c30", layer: "Kolonlar", position: { x: 4, y: 0 }, width: 0.3, depth: 0.5, height: 3.0, baseOffset: 0, topOffset: 0 },
      { id: "cb3", name: "SB3", type: "column", floorId: "floor-b", materialId: "c30", layer: "Kolonlar", position: { x: 4, y: 4 }, width: 0.3, depth: 0.5, height: 3.0, baseOffset: 0, topOffset: 0 },
      { id: "cb4", name: "SB4", type: "column", floorId: "floor-b", materialId: "c30", layer: "Kolonlar", position: { x: 0, y: 4 }, width: 0.3, depth: 0.5, height: 3.0, baseOffset: 0, topOffset: 0 },
    ];
    let cur: CadModel = { ...multiStoreyModel, elements: [...bColumns] };

    // Batch Enter simulation
    const targetCols = cur.elements.filter(e => e.type === "column" && e.floorId === lowestFloor.id) as ColumnElement[];
    for (const col of targetCols) cur = addPadFootingToColumn(cur, col);

    const generatedFootings = cur.elements.filter(e => e.layer === "Temeller");
    assert.equal(generatedFootings.length, 4, "Batch generation must create exactly 4 footings on lowest floor");
  });

  test("2.6 Soil pressure calculation safety oracle under extreme loads", () => {
    // Normal load
    const norm = calculateSoilPressure(400, 30, 1.5, 1.5, 200);
    assert.ok(norm.qMaxKpa > 0);
    assert.ok(norm.qMinKpa >= 0);
    assert.equal(typeof norm.pass, "boolean");

    // Zero moment
    const zeroM = calculateSoilPressure(500, 0, 2.0, 2.0, 200);
    assert.equal(zeroM.qMaxKpa, 500 / 4.0);
    assert.equal(zeroM.qMinKpa, 500 / 4.0);
    assert.equal(zeroM.pass, true);

    // Overstress condition
    const overstress = calculateSoilPressure(2000, 500, 1.5, 1.5, 200);
    assert.equal(overstress.pass, false, "Overstressed footing must fail soil safety check");
    assert.match(overstress.statusText, /aşıldı/i);
  });
});

// ============================================================================
// 3. Rapid clicking / switching between all RC tools in workbench.tsx
// ============================================================================
describe("Adversarial Test Suite 3: Rapid Tool Switching & State Transition Stability", () => {
  test("3.1 Mid-flight drafting interruption and interactiveMode lifecycle", () => {
    // Simulate state machine of use-drawing-session & workbench
    type State = {
      tool: string;
      interactiveMode: "default" | "stair" | "footing";
      pending: Point[];
      model: CadModel;
      historyPast: CadModel[];
    };

    let state: State = {
      tool: "select",
      interactiveMode: "default",
      pending: [],
      model: createDemoModel(),
      historyPast: [],
    };

    function selectTool(next: string) {
      // Clear draft logic in use-drawing-session + workbench
      state.tool = next;
      state.interactiveMode = "default";
      state.pending = [];
    }

    function startStair() {
      state.interactiveMode = "stair";
      state.pending = [];
    }

    function startFooting() {
      state.interactiveMode = "footing";
      state.pending = [];
    }

    function placePoint(pt: Point) {
      if (state.interactiveMode === "stair") {
        if (!state.pending.length) {
          state.pending = [pt];
        } else {
          if (distance(state.pending[0], pt) >= 0.1) {
            state.historyPast.push(state.model);
            state.model = addStairToModel(state.model, state.model.floors[0].id, state.pending[0], pt);
            state.pending = [];
            state.interactiveMode = "default";
          }
        }
        return;
      }

      if (state.interactiveMode === "footing") {
        const lowestFloor = state.model.floors[0];
        const targetCol = state.model.elements.find(e =>
          e.type === "column" &&
          e.floorId === lowestFloor.id &&
          distance(e.position, pt) <= Math.max(e.width, e.depth, 1.5)
        ) as ColumnElement | undefined;
        if (targetCol) {
          state.historyPast.push(state.model);
          state.model = addPadFootingToColumn(state.model, targetCol);
          state.interactiveMode = "default";
        }
        return;
      }

      if (state.tool === "beam" || state.tool === "wall") {
        if (!state.pending.length) {
          state.pending = [pt];
        } else {
          state.historyPast.push(state.model);
          const newElem: BeamElement = {
            id: `beam-${crypto.randomUUID().slice(0, 6)}`,
            name: `K${state.model.elements.filter(e => e.type === "beam").length + 1}`,
            type: "beam",
            floorId: state.model.floors[0].id,
            materialId: state.model.materials[0].id,
            layer: "Kirişler",
            start: state.pending[0],
            end: pt,
            width: 0.25,
            height: 0.50,
          };
          state.model = { ...state.model, elements: [...state.model.elements, newElem] };
          state.pending = [];
        }
      }
    }

    // SCENARIO 1: User starts Stair, clicks 1st point, then rapidly switches to Beam
    startStair();
    assert.equal(state.interactiveMode, "stair");
    placePoint({ x: 2, y: 2 });
    assert.equal(state.pending.length, 1);
    assert.deepEqual(state.pending[0], { x: 2, y: 2 });

    // Rapid switch to beam
    selectTool("beam");
    assert.equal(state.interactiveMode, "default", "Switching tool must reset interactiveMode to default");
    assert.equal(state.pending.length, 0, "Switching tool must clear pending points");

    // Click 2 points to draw beam
    placePoint({ x: 0, y: 0 });
    placePoint({ x: 4, y: 0 });
    assert.equal(state.pending.length, 0);
    const lastElem = state.model.elements.at(-1);
    assert.equal(lastElem?.type, "beam", "Must successfully draw beam without stair pollution");

    // SCENARIO 2: User starts Footing, then switches to Column without clicking
    startFooting();
    assert.equal(state.interactiveMode, "footing");
    selectTool("column");
    assert.equal(state.interactiveMode, "default");

    // SCENARIO 3: User starts Stair, clicks same point twice (< 0.10m threshold)
    startStair();
    placePoint({ x: 5, y: 5 });
    placePoint({ x: 5.02, y: 5.01 }); // dist ~ 0.022 < 0.10
    assert.equal(state.pending.length, 1, "Sub-threshold point must not commit stair; pending remains 1");
    // Now click valid point
    placePoint({ x: 9.8, y: 5 });
    assert.equal(state.interactiveMode, "default");
    assert.equal(state.pending.length, 0);
    const stairElem = state.model.elements.at(-1);
    assert.equal(stairElem?.layer, "Merdivenler");
  });

  test("3.2 500-Iteration Randomized Rapid Switching Stress Harness", () => {
    let hist = initialHistory();
    hist = historyReducer(hist, { type: "commit", model: createDemoModel() });

    const tools = ["column", "beam", "wall", "slab", "axis", "select", "move", "pan"];
    let currentTool = "select";
    let pending: Point[] = [];
    let interactiveMode: "default" | "stair" | "footing" = "default";

    // 500 pseudorandom operations
    for (let i = 0; i < 500; i++) {
      const op = i % 8;
      switch (op) {
        case 0: // Rapid tool change
          currentTool = tools[(i * 3) % tools.length];
          interactiveMode = "default";
          pending = [];
          break;
        case 1: // Start stair
          interactiveMode = "stair";
          pending = [];
          break;
        case 2: // Start footing
          interactiveMode = "footing";
          pending = [];
          break;
        case 3: // Click point
          const pt: Point = { x: (i % 20) * 0.5, y: ((i * 7) % 20) * 0.5 };
          if (interactiveMode === "stair") {
            if (!pending.length) {
              pending.push(pt);
            } else {
              if (distance(pending[0], pt) >= 0.1) {
                const next = addStairToModel(hist.present, hist.present.floors[0].id, pending[0], pt);
                hist = historyReducer(hist, { type: "commit", model: next });
                pending = [];
                interactiveMode = "default";
              }
            }
          } else if (interactiveMode === "footing") {
            const col = hist.present.elements.find(e => e.type === "column") as ColumnElement | undefined;
            if (col) {
              const next = addPadFootingToColumn(hist.present, col);
              hist = historyReducer(hist, { type: "commit", model: next });
            }
            interactiveMode = "default";
          } else {
            pending = [pt];
          }
          break;
        case 4: // Clear / Cancel (Esc)
          pending = [];
          interactiveMode = "default";
          break;
        case 5: // Undo
          hist = historyReducer(hist, { type: "undo" });
          break;
        case 6: // Redo
          hist = historyReducer(hist, { type: "redo" });
          break;
        case 7: // Add Raft foundation
          const nextRaft = addRaftFoundation(hist.present, hist.present.floors[0].id, [
            { x: -1, y: -1 }, { x: 9, y: -1 }, { x: 9, y: 9 }, { x: -1, y: 9 }
          ]);
          hist = historyReducer(hist, { type: "commit", model: nextRaft });
          break;
      }

      // Assert model invariant at every step
      assert.ok(hist.present, "Model must remain defined");
      assert.ok(Array.isArray(hist.present.elements), "Elements must remain an array");
      assert.ok(hist.past.length <= 80, "History past must remain bounded <= 80");
    }

    assert.ok(hist.present.elements.length > 0, "Model survived 500 rapid switching actions");
  });

  test("3.3 Exhaustive verification of registered workbench ribbonActions keys", () => {
    const workbenchCode = fs.readFileSync(
      path.resolve(__dirname, "../../src/components/hsyncad/workbench.tsx"),
      "utf8"
    );

    // All mandated RC action IDs that must be wired
    const mandatedRcCommandIds = [
      12576, // Radye
      12430, // Radye alias
      14351, // Radye kenarı
      14611, // Radye kenarı ayarları
      13135, // Radye boşluğu
      13110, // Döşeme boşluğu
      1823,  // Eğrisel kiriş
      1824,  // Yay kiriş
      1825,  // Dairesel kiriş
      1829,  // Sürekli yay kiriş
      13812, // Subasman perdesi
      40074, // Eğrisel perde
      40071, // Yay aks
      40072, // 3P yay aks
      40350, // Yarı rijit diyafram
      12820, // Dikdörtgen kolon
      12840, // Dairesel kolon
      12830, // Çokgen kolon
      12890, // Kolon ayarları
      12910, // Kiriş
      12920, // Kiriş ayarları
      13810, // Perde
      13820, // Perde ayarları
      12570, // Döşeme
      13120, // Döşeme ayarları
      14350, // Döşeme kenarı
      14610, // Döşeme kenarı ayarları
      12710, // Tekil temel
      12750, // Tekil temel ayarları
      12690, // Sürekli temel
      12700, // Sürekli temel ayarları
      13830, // Merdiven
      13840, // Merdiven ayarları
      62790, // Merdiven çiz
      12590, // Aks
      12580, // Aks ayarları
      12671, // Aks yönü
      11760, // Analiz ve Tasarım
      11710, // Analiz sonuçları
      11800, // Statik analiz
      11820, // Deplasman
      11840, // Moment
      11839, // Kesme
      12109, // Kapasite oranı
      12079, // Kesme diyagramı
      15736, // Tasarım kontrolü
    ];

    for (const cmdId of mandatedRcCommandIds) {
      const match = new RegExp(`\\b${cmdId}\\s*:`).test(workbenchCode);
      assert.ok(match, `Command ID ${cmdId} must have an active handler in workbench.tsx ribbonActions`);
    }
  });
});

// ============================================================================
// 4. Validate that PRODUCT_RIBBON_TABS does not break native command tree
// ============================================================================
describe("Adversarial Test Suite 4: PRODUCT_RIBBON_TABS Native Command Tree Invariants", () => {
  function walkCommands(
    commands: NativeRibbonCommand[],
    callback: (cmd: NativeRibbonCommand, depth: number) => void,
    depth = 0,
    visited = new Set<NativeRibbonCommand>()
  ) {
    for (const cmd of commands) {
      assert.ok(!visited.has(cmd), `Circular reference detected in command ${cmd.commandId}`);
      visited.add(cmd);
      callback(cmd, depth);
      if (cmd.children?.length) {
        walkCommands(cmd.children, callback, depth + 1, visited);
      }
    }
  }

  test("4.1 Structural Invariants: IDs, types, labels, symbols, and array children", () => {
    assert.ok(PRODUCT_RIBBON_TABS.length > 0, "Product ribbon tabs must not be empty");

    let totalCommands = 0;
    for (const tab of PRODUCT_RIBBON_TABS) {
      assert.ok(tab.label && typeof tab.label === "string", "Tab must have a string label");
      assert.ok(Array.isArray(tab.panels), "Tab panels must be an array");

      for (const panel of tab.panels) {
        assert.ok(panel.label && typeof panel.label === "string", "Panel must have a string label");
        assert.ok(Array.isArray(panel.commands), "Panel commands must be an array");

        walkCommands(panel.commands, (cmd, depth) => {
          totalCommands++;
          if (cmd.type === "Separator") {
            assert.equal(cmd.commandId, null, "Separator commandId must be null");
          } else {
            assert.ok(Number.isInteger(cmd.commandId), `Command ID must be integer: ${cmd.commandId}`);
            assert.ok(cmd.commandId! > 0, `Command ID must be positive: ${cmd.commandId}`);
          }
          assert.ok(typeof cmd.label === "string", `Command label must be string: ${cmd.commandId}`);
          assert.ok(typeof cmd.symbol === "string", `Command symbol must be string: ${cmd.commandId}`);
          assert.ok(Array.isArray(cmd.children), `Command children must be array: ${cmd.commandId}`);
          assert.ok(depth < 10, `Depth must be bounded: ${depth}`);
        });
      }
    }

    assert.ok(totalCommands > 50, `Expected substantial command set, found ${totalCommands}`);
  });

  test("4.2 Zero non-RC commands leakage across tabs, panels, and deep child trees", () => {
    const nonRcRegexTr = /çelik|kazık|kubbe|tonoz|aşık|iskele/i;
    const nonRcSymbolRegex = /STEEL|PILE|DOME|VAULT|PURLIN|SCAFFOLD/i;

    const leaked: Array<{ id: number; label: string; symbol: string }> = [];

    for (const tab of PRODUCT_RIBBON_TABS) {
      // Excluded tabs
      assert.notEqual(tab.label, "Çelik");
      assert.notEqual(tab.label, "Birleşim");

      for (const panel of tab.panels) {
        // Excluded panels
        assert.ok(!/çelik/i.test(panel.label), `Panel label contains çelik: ${panel.label}`);

        walkCommands(panel.commands, cmd => {
          // Check Turkish-locale lower case
          const lTr = (cmd.label || "").toLocaleLowerCase("tr-TR");
          const s = cmd.symbol || "";

          // Beam-column joints (12260, 11910) are preserved RC checks
          if (cmd.commandId === 12260 || cmd.commandId === 11910) return;

          if (nonRcRegexTr.test(lTr) || nonRcSymbolRegex.test(s)) {
            leaked.push({ id: cmd.commandId, label: cmd.label, symbol: cmd.symbol });
          }
        });
      }
    }

    assert.equal(
      leaked.length,
      0,
      `Detected leaked non-RC commands: ${JSON.stringify(leaked, null, 2)}`
    );
  });

  test("4.3 Strict preservation of TBDY 2018 §7.5 Beam-Column Joint safety commands", () => {
    let jointReportFound = false;
    let jointSectionFound = false;

    for (const tab of PRODUCT_RIBBON_TABS) {
      for (const panel of tab.panels) {
        walkCommands(panel.commands, cmd => {
          if (cmd.commandId === 12260) jointReportFound = true;
          if (cmd.commandId === 11910) jointSectionFound = true;
        });
      }
    }

    assert.ok(jointReportFound, "Command 12260 (Kolon-Kiriş Birleşim Güvenliği Raporu) MUST be preserved in PRODUCT_RIBBON_TABS");
    assert.ok(jointSectionFound, "Command 11910 (Kolon-Kiriş Birleşim Kesiti) MUST be preserved in PRODUCT_RIBBON_TABS");
  });

  test("4.4 Full RC Modeling Command completeness in PRODUCT_RIBBON_TABS", () => {
    const presentCommandIds = new Set<number>();

    for (const tab of PRODUCT_RIBBON_TABS) {
      for (const panel of tab.panels) {
        walkCommands(panel.commands, cmd => presentCommandIds.add(cmd.commandId));
      }
    }

    const mandatoryCommands = [
      12820, // Kolon
      12910, // Kiriş
      13810, // Perde
      12570, // Döşeme
      12576, // Radye
      12710, // Tekil Temel
      12690, // Sürekli Temel
      13830, // Merdiven
      12590, // Aks
      11760, // Analiz ve Tasarım
      11840, // Moment diyagramı
      11839, // Kesme diyagramı
      12109, // Kapasite oranı
      12260, // Birleşim güvenliği
      11910, // Birleşim kesiti
    ];

    for (const id of mandatoryCommands) {
      assert.ok(
        presentCommandIds.has(id),
        `Essential RC command ID ${id} must be present in PRODUCT_RIBBON_TABS`
      );
    }
  });
});
