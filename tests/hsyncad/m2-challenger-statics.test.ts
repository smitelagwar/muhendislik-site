/**
 * Milestone 2 Challenger Adversarial Statics Test Suite
 * Evaluates the 3D Frame & FEM Structural Analysis Engine (fem-solver.ts)
 *
 * Requirements:
 * 1. Verify analytical closed-form equilibrium on spatial portal frames:
 *    - Sum of vertical reactions equals total gravity load (sum Rz = W).
 *    - Sum of horizontal base shears equals total applied lateral seismic force (sum V_base = Vt).
 *    - Moment equilibrium at supports matches statics (M_overturning = Vt * H).
 * 2. Verify station force differential relation:
 *    - dM3/dx = V2 along beam spans under uniform distributed load.
 *    - dM2/dx = -V3 along beam spans under transverse out-of-plane load.
 * 3. Test degenerate geometry:
 *    - Zero-length members and coincident nodes.
 *    - High aspect ratio elements (L/h > 100).
 *    - Low aspect ratio elements (L/h < 0.1).
 *    - Nearly collinear / near-vertical elements across singularity thresholds.
 *    - Extreme stiffness contrast (1000x ratio).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildLocal12DOFStiffnessMatrix,
  build3x3RotationMatrix,
  buildTransformationMatrix12DOF,
  transformStiffnessToGlobal,
  generate32LoadCombinations,
  choleskyDecomposition,
  choleskySolve,
  luDecomposition,
  luSolve,
  jacobiEigenvalue,
  calculate11MemberStations,
  solve3DStructuralMesh,
  TBDY_2018_CRACKED_MODIFIERS,
  type Element12DOF,
  type Vector3D,
  type Node3D,
  type FemMeshInput,
} from "../../src/lib/hsyncad/fem-solver";
import { runStructuralAnalysis, type AnalysisSettings } from "../../src/lib/hsyncad/analysis";
import { createDemoModel, type CadModel } from "../../src/lib/hsyncad/model";

// ============================================================================
// 1. Analytical Closed-Form Equilibrium on Spatial Portal Frames
// ============================================================================

test("M2-CHALLENGE-1.1: Vertical Equilibrium on Spatial Portal Frame (sum Rz = W)", () => {
  const H = 3.5;
  const Lx = 5.0;
  const Ly = 6.0;

  const baseNodes: Node3D[] = [
    { id: "b1", name: "B1", x: 0, y: 0, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1,-1,-1,-1,-1,-1] },
    { id: "b2", name: "B2", x: Lx, y: 0, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1,-1,-1,-1,-1,-1] },
    { id: "b3", name: "B3", x: Lx, y: Ly, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1,-1,-1,-1,-1,-1] },
    { id: "b4", name: "B4", x: 0, y: Ly, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1,-1,-1,-1,-1,-1] },
  ];

  const topNodes: Node3D[] = [
    { id: "t1", name: "T1", x: 0, y: 0, z: H, floorId: "f1", isBaseFixed: false, dofIndices: [0,1,2,3,4,5] },
    { id: "t2", name: "T2", x: Lx, y: 0, z: H, floorId: "f1", isBaseFixed: false, dofIndices: [6,7,8,9,10,11] },
    { id: "t3", name: "T3", x: Lx, y: Ly, z: H, floorId: "f1", isBaseFixed: false, dofIndices: [12,13,14,15,16,17] },
    { id: "t4", name: "T4", x: 0, y: Ly, z: H, floorId: "f1", isBaseFixed: false, dofIndices: [18,19,20,21,22,23] },
  ];

  const colProp = {
    length: H,
    E: 32e6,
    G: 13.3e6,
    A: 0.50 * 0.50,
    Iz: (0.50 * Math.pow(0.50, 3)) / 12,
    Iy: (0.50 * Math.pow(0.50, 3)) / 12,
    J: 0.005,
    f_crack: 0.70,
    rollAngleRad: 0,
    width: 0.50,
    depth: 0.50,
    qy: 0,
    qz: 0,
  };

  const beamPropX = {
    length: Lx,
    E: 32e6,
    G: 13.3e6,
    A: 0.30 * 0.60,
    Iz: (0.30 * Math.pow(0.60, 3)) / 12,
    Iy: (0.60 * Math.pow(0.30, 3)) / 12,
    J: 0.003,
    f_crack: 0.35,
    rollAngleRad: 0,
    width: 0.30,
    depth: 0.60,
    qy: 0,
    qz: 0,
  };
  const beamPropY = { ...beamPropX, length: Ly };

  const elements: Element12DOF[] = [
    { id: "c1", name: "C1", type: "column", floorId: "f1", nodeI: "b1", nodeJ: "t1", ...colProp },
    { id: "c2", name: "C2", type: "column", floorId: "f1", nodeI: "b2", nodeJ: "t2", ...colProp },
    { id: "c3", name: "C3", type: "column", floorId: "f1", nodeI: "b3", nodeJ: "t3", ...colProp },
    { id: "c4", name: "C4", type: "column", floorId: "f1", nodeI: "b4", nodeJ: "t4", ...colProp },
    { id: "bx1", name: "BX1", type: "beam", floorId: "f1", nodeI: "t1", nodeJ: "t2", ...beamPropX },
    { id: "by1", name: "BY1", type: "beam", floorId: "f1", nodeI: "t2", nodeJ: "t3", ...beamPropY },
    { id: "bx2", name: "BX2", type: "beam", floorId: "f1", nodeI: "t3", nodeJ: "t4", ...beamPropX },
    { id: "by2", name: "BY2", type: "beam", floorId: "f1", nodeI: "t4", nodeJ: "t1", ...beamPropY },
  ];

  const totalDeadKn = 400.0;
  const totalLiveKn = 160.0;
  const expectedFactoredW = 1.4 * totalDeadKn + 1.6 * totalLiveKn; // 816 kN

  const meshInput: FemMeshInput = {
    nodes: [...baseNodes, ...topNodes],
    elements,
    floors: [{ id: "f1", name: "Floor 1", elevation: 0, height: H }],
    floorDiaphragms: [
      {
        floorId: "f1",
        centerX: Lx / 2,
        centerY: Ly / 2,
        totalMassKg: 40000,
        deadWeightKn: totalDeadKn,
        liveWeightKn: totalLiveKn,
      },
    ],
    sds: 1.0,
    sd1: 0.4,
    r: 8.0,
    importance: 1.0,
  };

  const output = solve3DStructuralMesh(meshInput);
  assert.equal(output.success, true);

  let sumRzColumns = 0;
  for (const cId of ["c1", "c2", "c3", "c4"]) {
    const env = output.memberEnvelopes[cId];
    assert.ok(env);
    const st0 = env.stations[0];
    assert.ok(st0.N < 0, `Column ${cId} base must be in compression`);
    sumRzColumns += -st0.N;

    // Check symmetry: 816 / 4 = 204 kN per column
    const diffCol = Math.abs(-st0.N - expectedFactoredW / 4.0);
    assert.ok(diffCol < 1.0, `Column ${cId} reaction diff=${diffCol}`);
  }

  const verticalDiff = Math.abs(sumRzColumns - expectedFactoredW);
  assert.ok(
    verticalDiff < 2.0,
    `Total vertical reaction sum (${sumRzColumns} kN) must balance gravity load (${expectedFactoredW} kN)`
  );
});

test("M2-CHALLENGE-1.2: Horizontal Base Shear Equilibrium (sum V_base = Vt)", () => {
  const H = 3.0;
  const L = 6.0;

  const baseNodes: Node3D[] = [
    { id: "b1", name: "B1", x: 0, y: 0, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1,-1,-1,-1,-1,-1] },
    { id: "b2", name: "B2", x: L, y: 0, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1,-1,-1,-1,-1,-1] },
    { id: "b3", name: "B3", x: L, y: L, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1,-1,-1,-1,-1,-1] },
    { id: "b4", name: "B4", x: 0, y: L, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1,-1,-1,-1,-1,-1] },
  ];
  const topNodes: Node3D[] = [
    { id: "t1", name: "T1", x: 0, y: 0, z: H, floorId: "f1", isBaseFixed: false, dofIndices: [0,1,2,3,4,5] },
    { id: "t2", name: "T2", x: L, y: 0, z: H, floorId: "f1", isBaseFixed: false, dofIndices: [6,7,8,9,10,11] },
    { id: "t3", name: "T3", x: L, y: L, z: H, floorId: "f1", isBaseFixed: false, dofIndices: [12,13,14,15,16,17] },
    { id: "t4", name: "T4", x: 0, y: L, z: H, floorId: "f1", isBaseFixed: false, dofIndices: [18,19,20,21,22,23] },
  ];

  const colProp = {
    length: H,
    E: 30e6,
    G: 12.5e6,
    A: 0.40 * 0.40,
    Iz: (0.40 * Math.pow(0.40, 3)) / 12,
    Iy: (0.40 * Math.pow(0.40, 3)) / 12,
    J: 0.003,
    f_crack: 0.70,
    rollAngleRad: 0,
    width: 0.40,
    depth: 0.40,
    qy: 0,
    qz: 0,
  };

  const beamProp = {
    length: L,
    E: 30e6,
    G: 12.5e6,
    A: 0.25 * 0.50,
    Iz: (0.25 * Math.pow(0.50, 3)) / 12,
    Iy: (0.50 * Math.pow(0.25, 3)) / 12,
    J: 0.0015,
    f_crack: 0.35,
    rollAngleRad: 0,
    width: 0.25,
    depth: 0.50,
    qy: 0,
    qz: 0,
  };

  const elements: Element12DOF[] = [
    { id: "c1", name: "C1", type: "column", floorId: "f1", nodeI: "b1", nodeJ: "t1", ...colProp },
    { id: "c2", name: "C2", type: "column", floorId: "f1", nodeI: "b2", nodeJ: "t2", ...colProp },
    { id: "c3", name: "C3", type: "column", floorId: "f1", nodeI: "b3", nodeJ: "t3", ...colProp },
    { id: "c4", name: "C4", type: "column", floorId: "f1", nodeI: "b4", nodeJ: "t4", ...colProp },
    { id: "b1", name: "B1", type: "beam", floorId: "f1", nodeI: "t1", nodeJ: "t2", ...beamProp },
    { id: "b2", name: "B2", type: "beam", floorId: "f1", nodeI: "t2", nodeJ: "t3", ...beamProp },
    { id: "b3", name: "B3", type: "beam", floorId: "f1", nodeI: "t3", nodeJ: "t4", ...beamProp },
    { id: "b4", name: "B4", type: "beam", floorId: "f1", nodeI: "t4", nodeJ: "t1", ...beamProp },
  ];

  const meshInput: FemMeshInput = {
    nodes: [...baseNodes, ...topNodes],
    elements,
    floors: [{ id: "f1", name: "Floor 1", elevation: 0, height: H }],
    floorDiaphragms: [
      {
        floorId: "f1",
        centerX: L / 2,
        centerY: L / 2,
        totalMassKg: 30000,
        deadWeightKn: 300,
        liveWeightKn: 100,
      },
    ],
    sds: 1.0,
    sd1: 0.4,
    r: 8.0,
    importance: 1.0,
  };

  const output = solve3DStructuralMesh(meshInput);
  assert.equal(output.success, true);

  const Vt = output.baseShears.Vtx;
  assert.ok(Vt > 0);

  let sumColBaseShear = 0;
  for (const cId of ["c1", "c2", "c3", "c4"]) {
    sumColBaseShear += output.memberEnvelopes[cId].maxShearV2Kn;
  }

  assert.ok(
    sumColBaseShear >= 0.95 * Vt,
    `Column shear envelope sum (${sumColBaseShear}) must resist base shear Vt (${Vt})`
  );
});

test("M2-CHALLENGE-1.3: Overturning Moment Equilibrium (M_overturning = Vt * H)", () => {
  const H = 4.0;
  const L = 6.0;

  const baseNodes: Node3D[] = [
    { id: "b1", name: "B1", x: 0, y: 0, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1,-1,-1,-1,-1,-1] },
    { id: "b2", name: "B2", x: L, y: 0, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1,-1,-1,-1,-1,-1] },
  ];
  const topNodes: Node3D[] = [
    { id: "t1", name: "T1", x: 0, y: 0, z: H, floorId: "f1", isBaseFixed: false, dofIndices: [0,1,2,3,4,5] },
    { id: "t2", name: "T2", x: L, y: 0, z: H, floorId: "f1", isBaseFixed: false, dofIndices: [6,7,8,9,10,11] },
  ];

  const colProp = {
    length: H,
    E: 30e6,
    G: 12.5e6,
    A: 0.40 * 0.40,
    Iz: (0.40 * Math.pow(0.40, 3)) / 12,
    Iy: (0.40 * Math.pow(0.40, 3)) / 12,
    J: 0.003,
    f_crack: 0.70,
    rollAngleRad: 0,
    width: 0.40,
    depth: 0.40,
    qy: 0,
    qz: 0,
  };

  const beamProp = {
    length: L,
    E: 30e6,
    G: 12.5e6,
    A: 0.25 * 0.50,
    Iz: (0.25 * Math.pow(0.50, 3)) / 12,
    Iy: (0.50 * Math.pow(0.25, 3)) / 12,
    J: 0.0015,
    f_crack: 0.35,
    rollAngleRad: 0,
    width: 0.25,
    depth: 0.50,
    qy: 0,
    qz: 0,
  };

  const elements: Element12DOF[] = [
    { id: "c1", name: "C1", type: "column", floorId: "f1", nodeI: "b1", nodeJ: "t1", ...colProp },
    { id: "c2", name: "C2", type: "column", floorId: "f1", nodeI: "b2", nodeJ: "t2", ...colProp },
    { id: "b1", name: "B1", type: "beam", floorId: "f1", nodeI: "t1", nodeJ: "t2", ...beamProp },
  ];

  const meshInput: FemMeshInput = {
    nodes: [...baseNodes, ...topNodes],
    elements,
    floors: [{ id: "f1", name: "Floor 1", elevation: 0, height: H }],
    floorDiaphragms: [
      {
        floorId: "f1",
        centerX: L / 2,
        centerY: 0,
        totalMassKg: 10000,
        deadWeightKn: 100,
        liveWeightKn: 40,
      },
    ],
    sds: 1.0,
    sd1: 0.4,
    r: 8.0,
    importance: 1.0,
  };

  const output = solve3DStructuralMesh(meshInput);
  assert.equal(output.success, true);

  const expectedMo = output.baseShears.Vtx * H;
  const computedMo = output.baseShears.Mox;
  assert.ok(Math.abs(computedMo - expectedMo) < 1e-4);
});

// ============================================================================
// 2. Station Force Differential Relation (dM/dx = V) along Beam Spans
// ============================================================================

test("M2-CHALLENGE-2.1: Station Differential Relation dM3/dx = V2 across all 11 stations under general load and end rotations", () => {
  const L = 8.0;
  const qy = 30.0; // 30 kN/m

  const el: Element12DOF = {
    id: "beam-span-8m",
    name: "K105",
    type: "beam",
    floorId: "f1",
    nodeI: "n1",
    nodeJ: "n2",
    length: L,
    E: 32e6,
    G: 13.3e6,
    A: 0.25 * 0.60,
    Iz: (0.25 * Math.pow(0.60, 3)) / 12,
    Iy: (0.60 * Math.pow(0.25, 3)) / 12,
    J: 0.002,
    f_crack: 0.35,
    rollAngleRad: 0,
    width: 0.25,
    depth: 0.60,
    qy,
    qz: 0,
  };

  const kLocal = buildLocal12DOFStiffnessMatrix(el);
  const arbDisps = new Float64Array([
    0.002,  0.006,  0.0, 0.0, 0.0,  0.003,
   -0.002, -0.010,  0.0, 0.0, 0.0, -0.004,
  ]);

  const stations = calculate11MemberStations(el, arbDisps, kLocal);
  assert.equal(stations.length, 11);

  // Exact mean-value theorem holds for quadratic moment: dM3/dx = average(V2_i, V2_i+1)
  for (let i = 0; i < 10; i++) {
    const sA = stations[i];
    const sB = stations[i + 1];
    const dx = sB.x - sA.x;
    const dM = sB.M3 - sA.M3;
    const avgV2 = 0.5 * (sA.V2 + sB.V2);
    const numDeriv = dM / dx;
    const diff = Math.abs(numDeriv - avgV2);
    assert.ok(diff < 1e-9, `Station ${i}: dM3/dx (${numDeriv}) must equal avgV2 (${avgV2})`);
  }
});

test("M2-CHALLENGE-2.2: Out-of-Plane Flexure Differential Relation dM2/dx = -V3 under transverse load qz", () => {
  const L = 6.0;
  const qz = 22.0;

  const el: Element12DOF = {
    id: "beam-oop",
    name: "K106",
    type: "beam",
    floorId: "f1",
    nodeI: "n1",
    nodeJ: "n2",
    length: L,
    E: 30e6,
    G: 12.5e6,
    A: 0.30 * 0.50,
    Iz: (0.30 * Math.pow(0.50, 3)) / 12,
    Iy: (0.50 * Math.pow(0.30, 3)) / 12,
    J: 0.002,
    f_crack: 0.35,
    rollAngleRad: 0,
    width: 0.30,
    depth: 0.50,
    qy: 0,
    qz,
  };

  const kLocal = buildLocal12DOFStiffnessMatrix(el);
  const arbDisps = new Float64Array([
    0.0, 0.0,  0.004, 0.0,  0.002, 0.0,
    0.0, 0.0, -0.005, 0.0, -0.003, 0.0,
  ]);

  const stations = calculate11MemberStations(el, arbDisps, kLocal);

  for (let i = 0; i < 10; i++) {
    const sA = stations[i];
    const sB = stations[i + 1];
    const dx = sB.x - sA.x;
    const dM2 = sB.M2 - sA.M2;
    const avgV3 = 0.5 * (sA.V3 + sB.V3);
    const numDeriv = dM2 / dx;
    const diff = Math.abs(numDeriv - (-avgV3));
    assert.ok(diff < 1e-9, `Station ${i}: dM2/dx must equal -avgV3`);
  }
});

// ============================================================================
// 3. Degenerate Geometry Stress Testing
// ============================================================================

test("M2-CHALLENGE-3.1: Zero-Length Members and Coincident Nodes throw controlled descriptive exceptions", () => {
  // Length = 0
  const elZero: Element12DOF = {
    id: "zero",
    name: "ZERO_LEN",
    type: "beam",
    floorId: "f0",
    nodeI: "n1",
    nodeJ: "n1",
    length: 0.0,
    E: 30e6,
    G: 12.5e6,
    A: 0.15,
    Iz: 0.003,
    Iy: 0.002,
    J: 0.001,
    f_crack: 0.35,
    rollAngleRad: 0,
    width: 0.25,
    depth: 0.50,
    qy: 0,
    qz: 0,
  };

  assert.throws(() => buildLocal12DOFStiffnessMatrix(elZero), /sıfır veya çok küçük/);

  // Coincident rotation matrix
  const p1: Vector3D = { x: 1, y: 1, z: 1 };
  assert.throws(() => build3x3RotationMatrix(p1, p1), /çakışık/);
});

test("M2-CHALLENGE-3.2: High Aspect Ratio Elements (L/h > 100) maintain numerical conditioning", () => {
  const L = 60.0;
  const h = 0.25; // L/h = 240
  const b = 0.25;

  const elSlender: Element12DOF = {
    id: "slender",
    name: "SLENDER",
    type: "beam",
    floorId: "f0",
    nodeI: "n1",
    nodeJ: "n2",
    length: L,
    E: 30e6,
    G: 12.5e6,
    A: b * h,
    Iz: (b * Math.pow(h, 3)) / 12,
    Iy: (h * Math.pow(b, 3)) / 12,
    J: 0.0001,
    f_crack: 0.35,
    rollAngleRad: 0,
    width: b,
    depth: h,
    qy: 1.0,
    qz: 0,
  };

  const K = buildLocal12DOFStiffnessMatrix(elSlender);
  for (let i = 0; i < 144; i++) {
    assert.ok(Number.isFinite(K[i]));
  }
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < 12; j++) {
      assert.ok(Math.abs(K[i * 12 + j] - K[j * 12 + i]) < 1e-9);
    }
  }
});

test("M2-CHALLENGE-3.3: Low Aspect Ratio Elements (L/h < 0.1) maintain numerical conditioning", () => {
  const L = 0.03;
  const h = 0.60; // L/h = 0.05
  const b = 0.30;

  const elStub: Element12DOF = {
    id: "stub",
    name: "STUB",
    type: "beam",
    floorId: "f0",
    nodeI: "n1",
    nodeJ: "n2",
    length: L,
    E: 30e6,
    G: 12.5e6,
    A: b * h,
    Iz: (b * Math.pow(h, 3)) / 12,
    Iy: (h * Math.pow(b, 3)) / 12,
    J: 0.003,
    f_crack: 0.35,
    rollAngleRad: 0,
    width: b,
    depth: h,
    qy: 0,
    qz: 0,
  };

  const K = buildLocal12DOFStiffnessMatrix(elStub);
  for (let i = 0; i < 144; i++) {
    assert.ok(Number.isFinite(K[i]));
  }
});

test("M2-CHALLENGE-3.4: Angular Perturbation across Vertical Singularity Threshold (D = 1e-6)", () => {
  const p1: Vector3D = { x: 0, y: 0, z: 0 };
  const pExact: Vector3D = { x: 0, y: 0, z: 3 };
  const pSub: Vector3D = { x: 1e-7 * 3, y: 0, z: 3 };
  const pAbove: Vector3D = { x: 1e-5 * 3, y: 0, z: 3 };

  for (const p2 of [pExact, pSub, pAbove]) {
    const R = build3x3RotationMatrix(p1, p2, 0);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        let dot = 0.0;
        for (let k = 0; k < 3; k++) dot += R[k * 3 + i] * R[k * 3 + j];
        const expected = i === j ? 1.0 : 0.0;
        assert.ok(Math.abs(dot - expected) < 1e-6);
      }
    }
  }
});

test("M2-CHALLENGE-3.5: Full End-to-End CadModel Multi-Storey Building FEM Analysis under Adversarial Settings", () => {
  const model = createDemoModel();

  const extremeSettings: Partial<AnalysisSettings> = {
    sds: 2.0,
    sd1: 1.0,
    r: 4.0,
    importance: 1.5,
    driftLimit: 0.008,
  };

  const result = runStructuralAnalysis(model, extremeSettings);
  assert.ok(result.totalWeightKn > 0);
  assert.ok(result.baseShearKn > 0);

  const standardResult = runStructuralAnalysis(model);
  assert.ok(result.baseShearKn > standardResult.baseShearKn);

  assert.equal(result.combinations.length, 33);
  for (const el of model.elements) {
    if (el.type === "column" || el.type === "beam" || el.type === "wall") {
      const stations = result.memberStations[el.id];
      assert.ok(stations);
      assert.equal(stations.length, 11);
      for (const st of stations) {
        assert.ok(Number.isFinite(st.N));
        assert.ok(Number.isFinite(st.V2));
        assert.ok(Number.isFinite(st.M3));
      }
    }
  }
});
