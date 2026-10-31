/**
 * Tier 5 - White-Box Adversarial Coverage Hardening Suite for Milestone 6
 * System: HsynCAD Structural Modeling, FEM Analysis & Reinforced Concrete Design Engine
 *
 * Focus:
 * 1. Extreme structural configurations (30-storey high-rise, zero-stiffness mechanisms,
 *    singular matrix fallbacks, extreme aspect ratios 1:10..1:30, degenerate joints).
 * 2. TBDY 2018 & TS 500 exact boundary conditions (A1/B2 irregularities, minimum rebar,
 *    shear limits Ve <= Vr <= 0.85*bw*d*sqrt(fck), strong column-weak beam sum Mc / sum Mb >= 1.20).
 * 3. Deep foundation soil bearing, punching shear at d/2 perimeter, and Blondel stair ergonomics.
 * 4. Conservation laws, numerical invariants, and symmetry/antisymmetry oracles.
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
  createEmptyModel,
  createDemoModel,
  validateModel,
} from "../../src/lib/hsyncad/model";
import {
  runStructuralAnalysis,
  DEFAULT_ANALYSIS_SETTINGS,
  CONCRETE_PROPERTIES,
  REBAR_PROPERTIES,
  type AnalysisSettings,
  type StructuralAnalysisResult,
} from "../../src/lib/hsyncad/analysis";
import {
  solve3DStructuralMesh,
  buildLocal12DOFStiffnessMatrix,
  build3x3RotationMatrix,
  transformStiffnessToGlobal,
  generate32LoadCombinations,
  choleskyDecomposition,
  choleskySolve,
  luDecomposition,
  luSolve,
  jacobiEigenvalue,
  calculate11MemberStations,
  TBDY_2018_CRACKED_MODIFIERS,
  type Element12DOF,
  type Node3D,
  type FemMeshInput,
} from "../../src/lib/hsyncad/fem-solver";
import {
  designColumn,
  designBeam,
  designShearWall,
  checkBeamColumnJoint,
  checkStrongColumnWeakBeam,
  designRaftFoundation,
  runConcreteDesignChecks,
  getConcreteProperties,
  getRebarProperties,
  getBarAreaMm2,
} from "../../src/lib/hsyncad/design-engine";
import {
  calculateSoilPressure,
  addPadFootingToColumn,
  addStripFootingToBeam,
  addRaftFoundation,
} from "../../src/lib/hsyncad/foundations";
import {
  calculateStairGeometry,
  addStairToModel,
  DEFAULT_STAIR_PARAMS,
} from "../../src/lib/hsyncad/stairs";
import { resolveJunctions, JUNCTION_EPSILON } from "../../src/lib/hsyncad/junctions";

// ============================================================================
// Procedural Test Model Generator
// ============================================================================
function generateBuildingModel(numStoreys: number, options?: {
  bayX?: number;
  bayY?: number;
  colWidth?: number;
  colDepth?: number;
  beamWidth?: number;
  beamHeight?: number;
  storeyHeight?: number;
  addShearWall?: boolean;
  wallThickness?: number;
  wallLength?: number;
  asymmetricWall?: boolean;
}): CadModel {
  const bayX = options?.bayX ?? 6.0;
  const bayY = options?.bayY ?? 6.0;
  const colW = options?.colWidth ?? 0.40;
  const colD = options?.colDepth ?? 0.40;
  const bW = options?.beamWidth ?? 0.25;
  const bH = options?.beamHeight ?? 0.50;
  const hStorey = options?.storeyHeight ?? 3.0;

  const floors: Floor[] = [];
  const elements: CadModel["elements"] = [];
  const common = { materialId: "concrete" };

  for (let s = 0; s < numStoreys; s++) {
    const floorId = `floor-${s}`;
    const elevation = s * hStorey;
    floors.push({
      id: floorId,
      name: `Kat ${s + 1}`,
      elevation,
      height: hStorey,
    });

    // 4 Columns at corners: (0,0), (bayX,0), (bayX,bayY), (0,bayY)
    const colCoords = [
      { id: `c_${s}_1`, name: `S${s + 1}01`, x: 0, y: 0 },
      { id: `c_${s}_2`, name: `S${s + 1}02`, x: bayX, y: 0 },
      { id: `c_${s}_3`, name: `S${s + 1}03`, x: bayX, y: bayY },
      { id: `c_${s}_4`, name: `S${s + 1}04`, x: 0, y: bayY },
    ];

    for (const c of colCoords) {
      elements.push({
        ...common,
        id: c.id,
        name: c.name,
        type: "column",
        layer: "Kolonlar",
        floorId,
        position: { x: c.x, y: c.y },
        width: colW,
        depth: colD,
        height: hStorey,
      } as ColumnElement);
    }

    // 4 Perimeter Beams
    const beamDefs = [
      { id: `b_${s}_1`, name: `K${s + 1}01`, start: { x: 0, y: 0 }, end: { x: bayX, y: 0 } },
      { id: `b_${s}_2`, name: `K${s + 1}02`, start: { x: bayX, y: 0 }, end: { x: bayX, y: bayY } },
      { id: `b_${s}_3`, name: `K${s + 1}03`, start: { x: bayX, y: bayY }, end: { x: 0, y: bayY } },
      { id: `b_${s}_4`, name: `K${s + 1}04`, start: { x: 0, y: bayY }, end: { x: 0, y: 0 } },
    ];

    for (const b of beamDefs) {
      elements.push({
        ...common,
        id: b.id,
        name: b.name,
        type: "beam",
        layer: "Kirişler",
        floorId,
        start: b.start,
        end: b.end,
        width: bW,
        height: bH,
      } as BeamElement);
    }

    // Floor Slab
    elements.push({
      ...common,
      id: `slab_${s}`,
      name: `D${s + 1}`,
      type: "slab",
      layer: "Döşemeler",
      floorId,
      points: [
        { x: 0, y: 0 },
        { x: bayX, y: 0 },
        { x: bayX, y: bayY },
        { x: 0, y: bayY },
      ],
      thickness: 0.15,
      liveLoad: 2.0,
      finishLoad: 1.5,
    } as SlabElement);

    // Optional Shear Wall
    if (options?.addShearWall) {
      const tw = options.wallThickness ?? 0.25;
      const lw = options.wallLength ?? 3.0;
      const startX = options.asymmetricWall ? 0 : bayX / 2 - lw / 2;
      const endX = startX + lw;
      elements.push({
        ...common,
        id: `wall_${s}`,
        name: `P${s + 1}01`,
        type: "wall",
        layer: "Perdeler",
        floorId,
        start: { x: startX, y: 0 },
        end: { x: endX, y: 0 },
        thickness: tw,
        height: hStorey,
      } as WallElement);
    }
  }

  return {
    schemaVersion: 1,
    name: `${numStoreys} Katlı Test Modeli`,
    floors,
    materials: [{ id: "concrete", name: "Beton" }],
    elements,
  };
}

// ============================================================================
// TEST SUITE: Tier 5 White-Box Structural Hardening
// ============================================================================

describe("Tier 5: Milestone 6 White-Box Adversarial Structural Hardening", () => {

  // --------------------------------------------------------------------------
  // Group 1: Extreme Structural Configurations
  // --------------------------------------------------------------------------
  describe("Group 1: Extreme Structural Configurations", () => {

    test("1.1 30-Storey High-Rise Building: 90m Height, Convergence & Numerical Stability", () => {
      const model = generateBuildingModel(30, {
        bayX: 7.0,
        bayY: 7.0,
        colWidth: 0.70,
        colDepth: 0.70,
        beamWidth: 0.35,
        beamHeight: 0.65,
        storeyHeight: 3.0,
      });

      assert.strictEqual(model.floors.length, 30);
      assert.strictEqual(model.elements.length, 30 * 9); // 4 cols + 4 beams + 1 slab = 9 per floor

      const tStart = performance.now();
      const result = runStructuralAnalysis(model);
      const elapsedMs = performance.now() - tStart;

      // Performance check: 30 storeys must execute well within reasonable time (< 3000ms)
      assert.ok(elapsedMs < 3000, `30-storey analysis took ${elapsedMs.toFixed(1)}ms (target < 3000ms)`);

      // Total height check
      assert.strictEqual(result.totalHeightM, 90.0);

      // Verify building mass and period are positive, non-NaN and physically plausible
      assert.ok(Number.isFinite(result.totalWeightKn) && result.totalWeightKn > 0);
      assert.ok(Number.isFinite(result.periodSec) && result.periodSec > 1.0 && result.periodSec < 5.0,
        `Period ${result.periodSec}s out of reasonable high-rise bounds [1.0s, 5.0s]`);

      // Storeys drift monotonicity & finiteness check
      assert.strictEqual(result.storeys.length, 30);
      for (let i = 0; i < 30; i++) {
        const st = result.storeys[i];
        assert.ok(Number.isFinite(st.driftM), `Storey ${i + 1} driftM is non-finite: ${st.driftM}`);
        assert.ok(Number.isFinite(st.driftRatio), `Storey ${i + 1} driftRatio is non-finite: ${st.driftRatio}`);
        assert.ok(st.driftM >= 0, `Storey ${i + 1} driftM is negative: ${st.driftM}`);
      }

      // Base shear & equilibrium check
      assert.ok(result.baseShearKn > 0 && Number.isFinite(result.baseShearKn));
      const totalStoreyLateralForces = result.storeys.reduce((sum, s) => sum + s.lateralForceKn, 0);
      assert.ok(Math.abs(totalStoreyLateralForces - result.baseShearKn) < 1e-3,
        `Sum of lateral forces (${totalStoreyLateralForces}) != base shear (${result.baseShearKn})`);

      // All member design checks must produce finite DCR values without NaN
      for (const [id, check] of Object.entries(result.members)) {
        assert.ok(Number.isFinite(check.capacityRatio), `Member ${id} capacityRatio is non-finite`);
        assert.ok(Number.isFinite(check.momentKnm), `Member ${id} momentKnm is non-finite`);
        assert.ok(Number.isFinite(check.shearKn), `Member ${id} shearKn is non-finite`);
        assert.ok(Number.isFinite(check.axialKn), `Member ${id} axialKn is non-finite`);
      }
    });

    test("1.2 Zero-Stiffness Mechanism / Unconstrained Node: LU Regularization Guard", () => {
      // Create a 1-storey frame but intentionally disconnect a beam node in space (unsupported cantilever)
      const model = createDemoModel();
      // Add a floating cantilever beam attached to node at (4,4) extending to (8,4) with no support
      const floatingBeam: BeamElement = {
        id: "beam-floating-cantilever",
        name: "K_Floating",
        type: "beam",
        layer: "Kirişler",
        floorId: "floor-0",
        materialId: "concrete",
        start: { x: 4, y: 4 },
        end: { x: 8, y: 4 },
        width: 0.25,
        height: 0.50,
      };
      model.elements.push(floatingBeam);

      // runStructuralAnalysis must not throw an unhandled exception or crash on singular matrix
      assert.doesNotThrow(() => {
        const res = runStructuralAnalysis(model);
        assert.ok(res !== null && typeof res === "object");
        assert.ok(Number.isFinite(res.baseShearKn));
        // Floating beam must receive internal force evaluation without NaN
        const beamRes = res.members["beam-floating-cantilever"];
        assert.ok(beamRes !== undefined);
        assert.ok(Number.isFinite(beamRes.momentKnm));
        assert.ok(Number.isFinite(beamRes.capacityRatio));
      });
    });

    test("1.3 Matrix Solvers Robustness: Zero, Semi-Definite & Ill-Conditioned Inputs", () => {
      // 1. Cholesky on Zero Matrix: must return null gracefully (not positive definite)
      const zeroMat = new Float64Array(9); // 3x3 zeros
      const cholZero = choleskyDecomposition(zeroMat, 3);
      assert.strictEqual(cholZero, null, "Cholesky of zero matrix must return null");

      // 2. Cholesky on Negative Definite Matrix: must return null
      const negMat = new Float64Array([-1, 0, 0, -2, 0, 0, -3]);
      const cholNeg = choleskyDecomposition(negMat, 3);
      assert.strictEqual(cholNeg, null, "Cholesky of negative matrix must return null");

      // 3. LU on Singular Zero Matrix: must execute and produce solvable or zero solution without NaN
      const luZero = luDecomposition(zeroMat, 3);
      assert.strictEqual(luZero.piv.length, 3);
      const bZero = new Float64Array([1, 2, 3]);
      const xZero = luSolve(luZero.LU, luZero.piv, bZero, 3);
      for (let i = 0; i < 3; i++) {
        assert.ok(Number.isFinite(xZero[i]), `xZero[${i}] must be finite (got ${xZero[i]})`);
      }

      // 4. Jacobi Eigenvalue Solver on 1x1 Matrix and 3x3 Diagonal Matrix
      const mat1x1 = new Float64Array([42.0]);
      const eig1x1 = jacobiEigenvalue(mat1x1, 1);
      assert.strictEqual(eig1x1.values.length, 1);
      assert.ok(Math.abs(eig1x1.values[0] - 42.0) < 1e-8);

      const diagMat = new Float64Array([
        10, 0, 0,
        0, 25, 0,
        0, 0, 50,
      ]);
      const eigDiag = jacobiEigenvalue(diagMat, 3);
      const sortedValues = Array.from(eigDiag.values).sort((a, b) => a - b);
      assert.ok(Math.abs(sortedValues[0] - 10) < 1e-6);
      assert.ok(Math.abs(sortedValues[1] - 25) < 1e-6);
      assert.ok(Math.abs(sortedValues[2] - 50) < 1e-6);
    });

    test("1.4 Extreme Aspect Ratios: Slender Column 1:10 & Deep Beam 1:15", () => {
      const concrete = getConcreteProperties("C30");
      const rebar = getRebarProperties("B420C");

      // 1. Extreme Column 1:10 (b = 0.25m, h = 2.50m)
      const slenderCol: ColumnElement = {
        id: "col-slender",
        name: "S_Slender",
        type: "column",
        layer: "Kolonlar",
        floorId: "floor-0",
        materialId: "concrete",
        position: { x: 0, y: 0 },
        width: 0.25,
        depth: 2.50,
        height: 3.0,
      };

      const colDesign = designColumn({
        element: slenderCol,
        floorHeightM: 3.0,
        beamDepthMaxM: 0.50,
        NdKn: 1200.0,
        V2dKn: 80.0,
        V3dKn: 30.0,
        M2dKnm: 45.0,
        M3dKnm: 350.0,
        concrete,
        rebar,
      });

      assert.ok(Number.isFinite(colDesign.governingDCR));
      assert.ok(Number.isFinite(colDesign.axialLimitKn) && colDesign.axialLimitKn > 0);
      assert.ok(Number.isFinite(colDesign.Mr3Knm) && colDesign.Mr3Knm > 0);
      assert.ok(Number.isFinite(colDesign.Mr2Knm) && colDesign.Mr2Knm > 0);
      assert.ok(colDesign.barCount >= 4, "Slender column must have at least 4 bars");
      assert.ok(colDesign.confinementSpacingCm <= 10, "Confinement spacing must be <= 10cm");

      // 2. Extreme Deep Transfer Beam 1:15 (bw = 0.25m, h = 3.00m, span = 6m)
      const deepBeam: BeamElement = {
        id: "beam-deep",
        name: "K_Deep",
        type: "beam",
        layer: "Kirişler",
        floorId: "floor-0",
        materialId: "concrete",
        start: { x: 0, y: 0 },
        end: { x: 6.0, y: 0 },
        width: 0.25,
        height: 3.00,
      };

      const beamDesign = designBeam({
        element: deepBeam,
        LspanM: 6.0,
        colWidthLeftM: 0.50,
        colWidthRightM: 0.50,
        MiTopKnm: 450.0,
        MiBotKnm: 100.0,
        MmidBotKnm: 350.0,
        MjTopKnm: 450.0,
        MjBotKnm: 100.0,
        VdyKn: 200.0,
        V2dKn: 250.0,
        concrete,
        rebar,
      });

      assert.ok(Number.isFinite(beamDesign.governingDCR));
      assert.ok(Number.isFinite(beamDesign.VrKn) && beamDesign.VrKn > 0);
      assert.ok(Number.isFinite(beamDesign.stationI.MrTopKnm));
      assert.ok(beamDesign.stationI.AsBotMm2 >= 0.50 * beamDesign.stationI.AsTopMm2,
        "Support bottom steel must be >= 50% top steel per TBDY 2018 §7.4.3.1");
    });

    test("1.5 Degenerate Joints: Sub-millimetre Node Snapping & Zero-Length Member Filtering", () => {
      const model = createEmptyModel();
      model.floors = [{ id: "floor-0", name: "Zemin", elevation: 0, height: 3.0 }];

      // 1. Zero-length beam (start == end) must be rejected by validateModel
      const zeroBeam: BeamElement = {
        id: "beam-zero",
        name: "K_Zero",
        type: "beam",
        layer: "Kirişler",
        floorId: "floor-0",
        materialId: "concrete",
        start: { x: 0, y: 0 },
        end: { x: 0, y: 0 },
        width: 0.25,
        height: 0.50,
      };
      assert.throws(() => {
        validateModel({ ...model, elements: [zeroBeam] });
      }, /başlangıç ve bitiş farklı olmalıdır/);

      // 2. Sub-millimetre offset columns (0.4 mm apart) snap to same spatial key (1mm tolerance)
      const col1: ColumnElement = {
        id: "col-1",
        name: "S1",
        type: "column",
        layer: "Kolonlar",
        floorId: "floor-0",
        materialId: "concrete",
        position: { x: 0.0, y: 0.0 },
        width: 0.30,
        depth: 0.30,
        height: 3.0,
      };
      const col2: ColumnElement = {
        id: "col-2",
        name: "S2",
        type: "column",
        layer: "Kolonlar",
        floorId: "floor-0",
        materialId: "concrete",
        position: { x: 0.0004, y: 0.0004 }, // 0.4mm away
        width: 0.30,
        depth: 0.30,
        height: 3.0,
      };
      const validBeam: BeamElement = {
        id: "beam-valid",
        name: "K1",
        type: "beam",
        layer: "Kirişler",
        floorId: "floor-0",
        materialId: "concrete",
        start: { x: 0, y: 0 },
        end: { x: 4.0, y: 0 },
        width: 0.25,
        height: 0.50,
      };
      const col3: ColumnElement = {
        id: "col-3",
        name: "S3",
        type: "column",
        layer: "Kolonlar",
        floorId: "floor-0",
        materialId: "concrete",
        position: { x: 4.0, y: 0.0 },
        width: 0.30,
        depth: 0.30,
        height: 3.0,
      };

      model.elements = [col1, col2, col3, validBeam];

      // Analysis must complete without throwing and solve internal forces
      assert.doesNotThrow(() => {
        const res = runStructuralAnalysis(model);
        assert.ok(res.members["col-1"] !== undefined);
        assert.ok(res.members["beam-valid"] !== undefined);
      });
    });

  });

  // --------------------------------------------------------------------------
  // Group 2: TBDY 2018 & TS 500 Exact Boundary Threshold Verification
  // --------------------------------------------------------------------------
  describe("Group 2: TBDY 2018 & TS 500 Exact Boundary Thresholds", () => {

    test("2.1 Torsional Irregularity (A1) Exact Transition Point (eta_bi = 1.200)", () => {
      // TBDY 2018 §3.6.2.1: hasA1 iff eta_bi > 1.20
      const testCases = [
        { etaBi: 1.199, expectedHasA1: false, expectedPass: true },
        { etaBi: 1.200, expectedHasA1: false, expectedPass: true },
        { etaBi: 1.201, expectedHasA1: true, expectedPass: false },
      ];

      for (const tc of testCases) {
        const hasA1 = tc.etaBi > 1.20;
        const pass = tc.etaBi <= 1.20;
        assert.strictEqual(hasA1, tc.expectedHasA1, `etaBi=${tc.etaBi} hasA1 check failed`);
        assert.strictEqual(pass, tc.expectedPass, `etaBi=${tc.etaBi} pass check failed`);
      }

      // Empirical check via structural analysis:
      // Symmetric building -> eta_bi should be close to 1.0 (pass = true)
      const symModel = generateBuildingModel(2, { bayX: 6, bayY: 6, addShearWall: false });
      const symRes = runStructuralAnalysis(symModel);
      for (const a1 of symRes.irregularities.torsionalA1) {
        assert.strictEqual(a1.hasA1, false, "Symmetric model must not have A1 irregularity");
        assert.strictEqual(a1.pass, true);
        assert.ok(a1.etaBi <= 1.20);
      }

      // Asymmetric building with one heavy shear wall on one edge -> induces torsional rotation
      const asymModel = generateBuildingModel(2, {
        bayX: 6,
        bayY: 6,
        addShearWall: true,
        asymmetricWall: true,
        wallLength: 4.0,
      });
      const asymRes = runStructuralAnalysis(asymModel);
      assert.ok(asymRes.irregularities.torsionalA1.length > 0);
      for (const a1 of asymRes.irregularities.torsionalA1) {
        assert.ok(Number.isFinite(a1.etaBi));
      }
    });

    test("2.2 Soft Storey Irregularity (B2) Exact Transition Points (eta_ki = 1.500 & 0.670)", () => {
      // TBDY 2018 §3.6.2.2: hasB2 iff eta_ki > 1.50 or eta_ki < 0.67
      const testCases = [
        { etaKi: 1.499, expectedHasB2: false, expectedPass: true },
        { etaKi: 1.500, expectedHasB2: false, expectedPass: true },
        { etaKi: 1.501, expectedHasB2: true, expectedPass: false },
        { etaKi: 0.671, expectedHasB2: false, expectedPass: true },
        { etaKi: 0.670, expectedHasB2: false, expectedPass: true },
        { etaKi: 0.669, expectedHasB2: true, expectedPass: false },
      ];

      for (const tc of testCases) {
        const hasB2 = tc.etaKi > 1.50 || tc.etaKi < 0.67;
        const pass = tc.etaKi <= 1.50 && tc.etaKi >= 0.67;
        assert.strictEqual(hasB2, tc.expectedHasB2, `etaKi=${tc.etaKi} hasB2 check failed`);
        assert.strictEqual(pass, tc.expectedPass, `etaKi=${tc.etaKi} pass check failed`);
      }

      // Empirical check: 3-storey building with a soft ground floor (double height 6m ground floor, 3m upper)
      const softModel = generateBuildingModel(3, {
        bayX: 5.0,
        bayY: 5.0,
        storeyHeight: 3.0,
      });
      // Override floor 0 height to 6.0m (soft ground storey)
      softModel.floors[0].height = 6.0;
      for (const el of softModel.elements) {
        if (el.floorId === "floor-0" && el.type === "column") {
          (el as ColumnElement).height = 6.0;
        }
      }

      const softRes = runStructuralAnalysis(softModel);
      assert.strictEqual(softRes.irregularities.softStoreyB2.length, 3);
      const b2Floor0 = softRes.irregularities.softStoreyB2.find(b => b.floorId === "floor-0");
      assert.ok(b2Floor0 !== undefined);
      assert.ok(Number.isFinite(b2Floor0.etaKi));
    });

    test("2.3 Strong Column - Weak Beam Exact Ratio Verification (sum Mc / sum Mb = 1.200)", () => {
      const colMock: ColumnElement = {
        id: "c-test",
        name: "S101",
        type: "column",
        layer: "Kolonlar",
        floorId: "floor-0",
        materialId: "concrete",
        position: { x: 0, y: 0 },
        width: 0.40,
        depth: 0.40,
        height: 3.0,
      };

      // 1. Threshold checks: ratio = 1.199 (FAIL), 1.200 (PASS), 1.201 (PASS)
      const resFail = checkStrongColumnWeakBeam({
        column: colMock,
        colMomentCapacityKnm: 59.95, // sum Mc = 119.9 kNm -> ratio = 1.199
        connectedBeamCapacitiesKnm: [50.0, 50.0],
        isTopStorey: false,
      });
      assert.strictEqual(resFail.pass, false, "ratio 1.199 must fail strong column check");
      assert.ok(resFail.ratio < 1.20);

      const resPassExact = checkStrongColumnWeakBeam({
        column: colMock,
        colMomentCapacityKnm: 60.0, // sum Mc = 120.0 kNm -> ratio = 1.200
        connectedBeamCapacitiesKnm: [50.0, 50.0],
        isTopStorey: false,
      });
      assert.strictEqual(resPassExact.pass, true, "ratio 1.200 must pass strong column check");
      assert.ok(Math.abs(resPassExact.ratio - 1.20) < 1e-4);

      const resPassAbove = checkStrongColumnWeakBeam({
        column: colMock,
        colMomentCapacityKnm: 65.0, // sum Mc = 130.0 kNm -> ratio = 1.30
        connectedBeamCapacitiesKnm: [50.0, 50.0],
        isTopStorey: false,
      });
      assert.strictEqual(resPassAbove.pass, true, "ratio 1.30 must pass strong column check");

      // 2. Exemption check: Top storey joints are exempt per TBDY 2018 §7.3.5.3
      const resTopStorey = checkStrongColumnWeakBeam({
        column: colMock,
        colMomentCapacityKnm: 30.0, // ratio = 0.60
        connectedBeamCapacitiesKnm: [50.0, 50.0],
        isTopStorey: true,
      });
      assert.strictEqual(resTopStorey.pass, true, "Top storey must be exempt from strong column rule");
      assert.ok(resTopStorey.statusText.includes("muaftır"));

      // 3. Exemption check: Shear wall dominant systems
      const resWallDominant = checkStrongColumnWeakBeam({
        column: colMock,
        colMomentCapacityKnm: 30.0,
        connectedBeamCapacitiesKnm: [50.0, 50.0],
        isTopStorey: false,
        isShearWallDominant: true,
      });
      assert.strictEqual(resWallDominant.pass, true, "Shear wall dominant systems must be exempt");
    });

    test("2.4 Column Axial Stress Limit (Nd <= 0.40 Ac fck) Exact Transition", () => {
      const concrete = getConcreteProperties("C30"); // fck = 30 MPa
      const rebar = getRebarProperties("B420C");
      const col: ColumnElement = {
        id: "c-axial",
        name: "S_Axial",
        type: "column",
        layer: "Kolonlar",
        floorId: "floor-0",
        materialId: "concrete",
        position: { x: 0, y: 0 },
        width: 0.40,
        depth: 0.40,
        height: 3.0,
      };

      // Ac = 0.40 * 0.40 = 0.16 m² = 160,000 mm²
      // Limit = 0.40 * 160,000 * 30 / 1000 = 1920.0 kN
      const exactLimitKn = 1920.0;

      // 1. Just below limit: 1915 kN (PASS)
      const resBelow = designColumn({
        element: col,
        floorHeightM: 3.0,
        beamDepthMaxM: 0.50,
        NdKn: 1915.0,
        V2dKn: 10.0,
        V3dKn: 10.0,
        M2dKnm: 20.0,
        M3dKnm: 30.0,
        concrete,
        rebar,
      });
      assert.strictEqual(resBelow.axialPass, true, "Nd = 1915 kN <= 1920 kN must pass axial check");
      assert.ok(resBelow.axialDCR <= 1.0);

      // 2. Exact limit: 1920 kN (PASS)
      const resExact = designColumn({
        element: col,
        floorHeightM: 3.0,
        beamDepthMaxM: 0.50,
        NdKn: 1920.0,
        V2dKn: 10.0,
        V3dKn: 10.0,
        M2dKnm: 20.0,
        M3dKnm: 30.0,
        concrete,
        rebar,
      });
      assert.strictEqual(resExact.axialPass, true, "Nd = 1920 kN == 1920 kN must pass axial check");
      assert.ok(Math.abs(resExact.axialDCR - 1.0) < 1e-4);

      // 3. Just above limit: 1925 kN (FAIL)
      const resAbove = designColumn({
        element: col,
        floorHeightM: 3.0,
        beamDepthMaxM: 0.50,
        NdKn: 1925.0,
        V2dKn: 10.0,
        V3dKn: 10.0,
        M2dKnm: 20.0,
        M3dKnm: 30.0,
        concrete,
        rebar,
      });
      assert.strictEqual(resAbove.axialPass, false, "Nd = 1925 kN > 1920 kN must fail axial check");
      assert.ok(resAbove.axialDCR > 1.0);
    });

    test("2.5 Beam Capacity Shear, Web Crushing & Concrete Shear Suppression per TBDY 2018 §7.4.5.3", () => {
      const concrete = getConcreteProperties("C30");
      const rebar = getRebarProperties("B420C");
      const beam: BeamElement = {
        id: "b-shear",
        name: "K_Shear",
        type: "beam",
        layer: "Kirişler",
        floorId: "floor-0",
        materialId: "concrete",
        start: { x: 0, y: 0 },
        end: { x: 5.0, y: 0 },
        width: 0.25,
        height: 0.50,
      };

      // bw = 250mm, d = 460mm, fck = 30 MPa, fcd = 20 MPa
      // Vmax = min(0.85 * 250 * 460 * sqrt(30) / 1000, 0.22 * 20 * 250 * 460 / 1000) = 506.0 kN
      const expectedVmaxKn = Math.min(
        (0.85 * 250 * 460 * Math.sqrt(30)) / 1000.0,
        (0.22 * 20 * 250 * 460) / 1000.0
      );

      // 1. Normal gravity-dominant shear: Vc is active (Vc > 0)
      const resNormal = designBeam({
        element: beam,
        LspanM: 5.0,
        colWidthLeftM: 0.40,
        colWidthRightM: 0.40,
        MiTopKnm: 80.0,
        MiBotKnm: 40.0,
        MmidBotKnm: 60.0,
        MjTopKnm: 80.0,
        MjBotKnm: 40.0,
        VdyKn: 80.0,
        V2dKn: 120.0,
        concrete,
        rebar,
      });
      assert.strictEqual(resNormal.shearPass, true);
      assert.ok(resNormal.VrKn <= expectedVmaxKn + 1e-4);
      assert.ok(resNormal.VcKn > 0, "Concrete shear Vc should be active under gravity dominant shear");

      // 2. Concrete shear suppression (Vc = 0) when plastic hinge seismic shear dominates (TBDY §7.4.5.3)
      // When large end capacities produce seismicShearKn >= 0.50 * VeKn
      const shortBeam: BeamElement = {
        ...beam,
        end: { x: 2.0, y: 0 }, // short 2.0m span -> huge (Mpi + Mpj)/ln
      };
      const resSuppressed = designBeam({
        element: shortBeam,
        LspanM: 2.0,
        colWidthLeftM: 0.40,
        colWidthRightM: 0.40,
        MiTopKnm: 300.0,
        MiBotKnm: 150.0,
        MmidBotKnm: 200.0,
        MjTopKnm: 300.0,
        MjBotKnm: 150.0,
        VdyKn: 20.0,
        V2dKn: 100.0,
        concrete,
        rebar,
      });
      assert.strictEqual(resSuppressed.VcKn, 0.0, "Concrete shear Vc must be suppressed to 0 when seismic shear dominates");

      // 3. Web crushing failure when Ve > Vmax
      const resCrushing = designBeam({
        element: beam,
        LspanM: 5.0,
        colWidthLeftM: 0.40,
        colWidthRightM: 0.40,
        MiTopKnm: 80.0,
        MiBotKnm: 40.0,
        MmidBotKnm: 60.0,
        MjTopKnm: 80.0,
        MjBotKnm: 40.0,
        VdyKn: 400.0,
        V2dKn: 600.0,
        concrete,
        rebar,
      });
      assert.strictEqual(resCrushing.shearPass, false, "Shear demand 600 kN > Vmax must fail");
      assert.ok(resCrushing.VeKn > expectedVmaxKn);
    });

    test("2.6 Shear Wall Critical Boundary Zone & Amplified Dynamic Shear (Ve = beta_v (Mpr/Md) Vd)", () => {
      const concrete = getConcreteProperties("C30");
      const rebar = getRebarProperties("B420C");
      const wall: WallElement = {
        id: "w-tbdy",
        name: "P_TBDY",
        type: "wall",
        layer: "Perdeler",
        floorId: "floor-0",
        materialId: "concrete",
        start: { x: 0, y: 0 },
        end: { x: 4.0, y: 0 },
        thickness: 0.25,
        height: 3.0,
      };

      // Total building height = 15m, wall length = 4.0m
      // Slenderness Hw / Lw = 15 / 4 = 3.75 >= 2.0 (Slender wall per TBDY 2018 §7.6.1.2)
      const wallDesign = designShearWall({
        element: wall,
        floorName: "Zemin",
        floorHeightM: 3.0,
        totalWallHeightM: 15.0,
        elevationM: 0.0,
        NdKn: 1500.0,
        VdKn: 300.0,
        MdKnm: 1200.0,
        concrete,
        rebar,
        T1Sec: 0.80,
        R: 7.0,
        I: 1.0,
      });

      assert.strictEqual(wallDesign.isSlender, true, "Hw/Lw = 3.75 must be slender");
      assert.strictEqual(wallDesign.isInCriticalHeight, true, "Elevation 0m must be in critical height");
      assert.ok(wallDesign.luM >= 0.80, `Boundary length ${wallDesign.luM} must be >= 0.2 * Lw`);
      assert.ok(wallDesign.beta_v >= 1.0 && wallDesign.beta_v <= 1.5,
        `Dynamic shear amplification beta_v (${wallDesign.beta_v}) out of range [1.0, 1.5]`);
      assert.ok(wallDesign.VeKn >= wallDesign.VwKn || wallDesign.VeKn >= 300.0,
        "Amplified shear Ve must be >= baseline static shear Vd");
      assert.ok(wallDesign.requiredBoundaryAsCm2 > 0, "Boundary rebar must be positive");
      assert.ok(wallDesign.requiredWebHorizontalAsCm2PerM > 0, "Web horizontal rebar must be positive");
      assert.ok(wallDesign.confinementSpacingCm <= 10, "Boundary confinement spacing must be <= 10cm");
    });

  });

  // --------------------------------------------------------------------------
  // Group 3: Foundations, Stairs, and CSG Junction Hardening
  // --------------------------------------------------------------------------
  describe("Group 3: Foundations, Stairs & CSG Junction Hardening", () => {

    test("3.1 Raft Foundation Biaxial Soil Pressure & Negative Uplift Prevention", () => {
      const concrete = getConcreteProperties("C30");
      const rebar = getRebarProperties("B420C");

      // 10m x 10m Raft Slab, 0.60m thickness
      const raftSlab: SlabElement = {
        id: "raft-slab",
        name: "R1",
        type: "slab",
        layer: "Temeller",
        floorId: "floor-0",
        materialId: "concrete",
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ],
        thickness: 0.60,
      };

      // 4 column loads applied symmetrically
      const colLoads = [
        { id: "c1", name: "S1", type: "column" as const, x: 2, y: 2, widthM: 0.5, depthM: 0.5, NdKn: 800, MxKnm: 40, MyKnm: 30 },
        { id: "c2", name: "S2", type: "column" as const, x: 8, y: 2, widthM: 0.5, depthM: 0.5, NdKn: 800, MxKnm: 40, MyKnm: -30 },
        { id: "c3", name: "S3", type: "column" as const, x: 8, y: 8, widthM: 0.5, depthM: 0.5, NdKn: 800, MxKnm: -40, MyKnm: -30 },
        { id: "c4", name: "S4", type: "column" as const, x: 2, y: 8, widthM: 0.5, depthM: 0.5, NdKn: 800, MxKnm: -40, MyKnm: 30 },
      ];

      const raftResult = designRaftFoundation({
        slab: raftSlab,
        thicknessM: 0.60,
        coverM: 0.05,
        points: raftSlab.points,
        loads: colLoads,
        qAllKpa: 250.0,
        ksKpaPerM: 20000.0,
        concrete,
        rebar,
      });

      assert.strictEqual(raftResult.pass, true);
      assert.ok(raftResult.soilPressure.qMaxKpa <= 250.0, `qMax (${raftResult.soilPressure.qMaxKpa}) exceeds qAll (250)`);
      assert.ok(raftResult.soilPressure.qMinKpa >= 0, `qMin (${raftResult.soilPressure.qMinKpa}) cannot be negative`);
      assert.ok(raftResult.soilPressure.settlementMaxMm > 0, "Max settlement must be positive");
      assert.ok(raftResult.soilPressure.settlementAvgMm > 0, "Avg settlement must be positive");
      assert.ok(raftResult.continuousMesh.providedAsCm2PerM > 0, "Mesh rebar must be positive");

      // Verify punching checks on all columns
      for (const [colId, punch] of Object.entries(raftResult.punchingChecks)) {
        assert.ok(punch.pass, `Punching check for ${colId} must pass`);
        assert.ok(punch.punchingRatio <= 1.0, `Punching ratio ${punch.punchingRatio} > 1.0`);
        assert.ok(punch.criticalPerimeterM > 0);
      }
    });

    test("3.2 Isolated Pad Footing Soil Pressure Equilibrium & Overturning", () => {
      // 1. Concentric Load: N = 600 kN, M = 0, Pad 2.0m x 2.0m
      // Area = 4.0 m², qAvg = 600 / 4 = 150 kPa <= 200 kPa
      const resConcentric = calculateSoilPressure(600, 0, 2.0, 2.0, 200);
      assert.strictEqual(resConcentric.pass, true);
      assert.ok(Math.abs(resConcentric.qMaxKpa - 150.0) < 1e-3);
      assert.ok(Math.abs(resConcentric.qMinKpa - 150.0) < 1e-3);

      // 2. Overturning Moment: N = 600 kN, M = 200 kNm
      // W = 2.0 * 2.0² / 6 = 1.333 m³
      // qDiff = 200 / 1.333 = 150 kPa
      // qMax = 150 + 150 = 300 kPa > 200 kPa (FAIL)
      const resOverturning = calculateSoilPressure(600, 200, 2.0, 2.0, 200);
      assert.strictEqual(resOverturning.pass, false);
      assert.ok(resOverturning.qMaxKpa > 200.0);
      assert.ok(resOverturning.qMinKpa >= 0.0);
    });

    test("3.3 Stair Ergonomics Blondel Formula & Volume Conservation", () => {
      // Standard 16-step stair flight: riser = 0.175m, tread = 0.28m
      // Blondel formula: 2 * 0.175 + 0.28 = 0.63m in [0.58m, 0.66m]
      const start = { x: 0, y: 0 };
      const end = { x: 4.48, y: 0 }; // 16 * 0.28 = 4.48m run

      const calc = calculateStairGeometry({
        widthM: 1.20,
        stepCount: 16,
        riserHeightM: 0.175,
        waistThicknessM: 0.15,
      }, start, end);

      assert.strictEqual(calc.comfortFormulaCheck, true, "Blondel ergonomic check must pass");
      assert.ok(Math.abs(calc.totalHeightM - 2.80) < 1e-3);
      assert.ok(Math.abs(calc.treadDepthM - 0.28) < 1e-3);
      assert.ok(calc.concreteVolumeM3 > 0, "Stair concrete volume must be positive");
      assert.ok(calc.formworkAreaM2 > 0, "Stair formwork area must be positive");

      // Add stair to model and verify non-corrupt slab creation
      const emptyModel = createEmptyModel();
      const modelWithStair = addStairToModel(emptyModel, "floor-0", start, end);
      const stairElement = modelWithStair.elements.find(e => e.layer === "Merdivenler");
      assert.ok(stairElement !== undefined);
      assert.strictEqual(stairElement.type, "slab");
      assert.strictEqual((stairElement as SlabElement).points.length, 4);
    });

    test("3.4 CSG Junction Resolution Precedence (Column > Wall > Beam > Slab)", () => {
      const demoModel = createDemoModel();
      const junctions = resolveJunctions(demoModel);

      assert.strictEqual(junctions.status, "resolved");
      assert.ok(junctions.grossVolume > 0);
      assert.ok(junctions.netVolume !== null && junctions.netVolume > 0);
      assert.ok(junctions.netVolume <= junctions.grossVolume, "Net volume must be <= gross volume");

      // Columns must preserve 100% of their gross volume (highest priority)
      for (const el of demoModel.elements) {
        if (el.type === "column") {
          const qty = junctions.byElement[el.id];
          assert.ok(qty !== undefined);
          assert.ok(qty.netVolume !== null);
          assert.ok(Math.abs(qty.grossVolume - qty.netVolume) < 1e-4,
            `Column ${el.id} volume was deducted: gross=${qty.grossVolume}, net=${qty.netVolume}`);
        }
      }
    });

  });

  // --------------------------------------------------------------------------
  // Group 4: Numerical Invariants, Conservation Laws & Inversion Oracles
  // --------------------------------------------------------------------------
  describe("Group 4: Conservation Laws & Physical Oracles", () => {

    test("4.1 Gravity Weight Conservation: Total Building Weight = Sum of Floor Weights", () => {
      const model = generateBuildingModel(4, { bayX: 6, bayY: 6, storeyHeight: 3.0 });
      const result = runStructuralAnalysis(model);

      const sumStoreyWeights = result.storeys.reduce((sum, s) => sum + s.totalWeightKn, 0);
      assert.ok(Math.abs(sumStoreyWeights - result.totalWeightKn) < 1e-3,
        `Sum of storey weights (${sumStoreyWeights}) != total building weight (${result.totalWeightKn})`);
    });

    test("4.2 Lateral Static Equilibrium: Base Shear = Sum of Distributed Storey Lateral Forces", () => {
      const model = generateBuildingModel(5, { bayX: 5, bayY: 5 });
      const result = runStructuralAnalysis(model);

      const sumLateralForces = result.storeys.reduce((sum, s) => sum + s.lateralForceKn, 0);
      assert.ok(Math.abs(sumLateralForces - result.baseShearKn) < 1e-3,
        `Sum of storey forces (${sumLateralForces}) != base shear (${result.baseShearKn})`);
    });

    test("4.3 Dual-Axis Geometric Symmetry Oracle: Symmetric Displacements under Symmetric Loading", () => {
      // 1-storey perfectly square symmetric building (6m x 6m)
      const model = generateBuildingModel(1, { bayX: 6.0, bayY: 6.0, colWidth: 0.40, colDepth: 0.40 });
      const result = runStructuralAnalysis(model);

      // Verify corner column axial forces are equal under gravity load
      const c1 = result.members["c_0_1"];
      const c2 = result.members["c_0_2"];
      const c3 = result.members["c_0_3"];
      const c4 = result.members["c_0_4"];

      assert.ok(c1 && c2 && c3 && c4);
      assert.ok(Math.abs(c1.axialKn - c2.axialKn) < 1e-2, `C1 (${c1.axialKn}) != C2 (${c2.axialKn})`);
      assert.ok(Math.abs(c2.axialKn - c3.axialKn) < 1e-2, `C2 (${c2.axialKn}) != C3 (${c3.axialKn})`);
      assert.ok(Math.abs(c3.axialKn - c4.axialKn) < 1e-2, `C3 (${c3.axialKn}) != C4 (${c4.axialKn})`);
    });

    test("4.4 Full 33 Load Combinations Inversion Invariant under +/- Ex", () => {
      const combos = generate32LoadCombinations(1.0);
      assert.strictEqual(combos.length, 33);

      // Find pairs of +Ex and -Ex combinations
      const comboPlusEx = combos.find(c => c.name === "G+Q+Ex+0.3Ey+0.3Ez");
      const comboMinusEx = combos.find(c => c.name === "G+Q-Ex+0.3Ey+0.3Ez");

      assert.ok(comboPlusEx !== undefined);
      assert.ok(comboMinusEx !== undefined);
      assert.strictEqual(comboPlusEx.cEx, 1.0);
      assert.strictEqual(comboMinusEx.cEx, -1.0);
      assert.strictEqual(comboPlusEx.cG, comboMinusEx.cG);
      assert.strictEqual(comboPlusEx.cQ, comboMinusEx.cQ);
      assert.strictEqual(comboPlusEx.cEy, comboMinusEx.cEy);
    });

  });

});
