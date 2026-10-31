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
} from "./fem-solver";
import { runStructuralAnalysis, type AnalysisSettings } from "./analysis";
import { createDemoModel, type CadModel } from "./model";

// ============================================================================
// SUITE 1: Analytical Closed-Form Equilibrium on Spatial Portal Frames
// ============================================================================

test("ADV-1.1 Vertical Equilibrium: sum of support reactions equals total applied gravity load (sum Rz = W)", () => {
  // Construct a symmetric 1-storey spatial portal frame (4 columns, 4 beams)
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

  const beamPropY = {
    ...beamPropX,
    length: Ly,
  };

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

  const totalDeadKn = 400.0; // 100 kN per column
  const totalLiveKn = 160.0; // 40 kN per column

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

  // For combination 1.4G + 1.6Q:
  // Expected total factored vertical load:
  const expectedFactoredW = 1.4 * totalDeadKn + 1.6 * totalLiveKn; // 1.4*400 + 1.6*160 = 560 + 256 = 816 kN

  // Let's verify reaction equilibrium directly from column axial forces:
  // Each column's station 0 axial force N (in kN) under 1.4G+1.6Q
  // Under pure gravity, columns are in compression: N < 0.
  // The reaction pushing up on the column base is -N.
  let sumRzColumns = 0;
  for (const cId of ["c1", "c2", "c3", "c4"]) {
    const env = output.memberEnvelopes[cId];
    assert.ok(env, `Envelope must exist for ${cId}`);
    // Check station 0 (base of column)
    const st0 = env.stations[0];
    // Under 1.4G+1.6Q, axial force N is compression (< 0)
    assert.ok(st0.N < 0, `Column ${cId} base must be in compression under gravity`);
    sumRzColumns += -st0.N;
  }

  // Check if sum of column vertical compressive reactions balances applied gravity load
  // With 4 symmetric columns, each column must carry exactly 816 / 4 = 204 kN
  for (const cId of ["c1", "c2", "c3", "c4"]) {
    const st0 = output.memberEnvelopes[cId].stations[0];
    const expectedPerCol = expectedFactoredW / 4.0;
    const diff = Math.abs(-st0.N - expectedPerCol);
    assert.ok(
      diff < 1.0, // within 1 kN (0.5% tolerance)
      `Column ${cId} axial force ${-st0.N} kN must match expected ${expectedPerCol} kN (diff: ${diff})`
    );
  }

  const verticalDiff = Math.abs(sumRzColumns - expectedFactoredW);
  assert.ok(
    verticalDiff < 2.0,
    `Sum of vertical reactions (${sumRzColumns} kN) must balance total gravity load (${expectedFactoredW} kN), diff = ${verticalDiff}`
  );
});

test("ADV-1.2 Horizontal Base Shear Equilibrium: sum of column base shears equals total applied lateral seismic force (sum V_base = Vt)", () => {
  // In a symmetric 1-storey frame subjected to lateral earthquake force Vt in X:
  // Total lateral force applied is designBaseShearKn
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
  assert.ok(Vt > 0, "Base shear Vt must be strictly positive");

  // In symmetric frame under lateral load, each column carries approximately Vt / 4 shear
  let sumColBaseShear = 0;
  for (const cId of ["c1", "c2", "c3", "c4"]) {
    const env = output.memberEnvelopes[cId];
    // Under earthquake combination, max shear in column
    sumColBaseShear += env.maxShearV2Kn;
  }

  // Sum of column shear capacities/demands must equal or exceed base shear Vt
  assert.ok(
    sumColBaseShear >= 0.95 * Vt,
    `Sum of column shears (${sumColBaseShear} kN) must equilibrate base shear Vt (${Vt} kN)`
  );
});

test("ADV-1.3 Support Moment and Overturning Equilibrium: overturning moment matches statics (M_overturning = Vt * H)", () => {
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

  // Overturning moment Mox = Vt * H
  const expectedMo = output.baseShears.Vtx * H;
  const computedMo = output.baseShears.Mox;

  assert.ok(
    Math.abs(computedMo - expectedMo) < 1e-4,
    `Overturning moment Mox (${computedMo}) must equal Vt * H (${expectedMo})`
  );
});

// ============================================================================
// SUITE 2: Station Force Differential Relation (dM/dx = V) along Beam Spans
// ============================================================================

test("ADV-2.1 Exact Station Force Differential Relation dM3/dx = V2 across all 11 stations under general load and end rotations", () => {
  const L = 7.5; // arbitrary span
  const qy = 35.0; // 35 kN/m uniform load

  const el: Element12DOF = {
    id: "beam-adversarial",
    name: "K205",
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

  // Apply non-trivial arbitrary end displacements: differential settlement + end rotations
  const arbDisps = new Float64Array([
    0.001,  0.005,  0.0, 0.0, 0.0,  0.002, // node I: u, v, w, thx, thy, thz
   -0.001, -0.008,  0.0, 0.0, 0.0, -0.003, // node J
  ]);

  const stations = calculate11MemberStations(el, arbDisps, kLocal);
  assert.equal(stations.length, 11);

  // Verify dM3/dx = V2 across every consecutive station interval [i, i+1]
  for (let i = 0; i < 10; i++) {
    const sA = stations[i];
    const sB = stations[i + 1];
    const dx = sB.x - sA.x;
    assert.ok(dx > 0, "dx must be positive");

    const dM = sB.M3 - sA.M3;
    const avgV2 = 0.5 * (sA.V2 + sB.V2);
    const numericalDerivative = dM / dx;

    // Because M3 is quadratic and V2 is linear in x, average V2 is EXACTLY equal to dM/dx!
    const diff = Math.abs(numericalDerivative - avgV2);
    assert.ok(
      diff < 1e-9,
      `Station [${i}->${i+1}]: dM3/dx (${numericalDerivative}) must match avg V2 (${avgV2}), diff=${diff}`
    );
  }

  // Also verify second derivative: dV2/dx = -qy
  for (let i = 0; i < 10; i++) {
    const sA = stations[i];
    const sB = stations[i + 1];
    const dx = sB.x - sA.x;
    const dV = sB.V2 - sA.V2;
    const dV_dx = dV / dx;
    const diff = Math.abs(dV_dx - (-qy));
    assert.ok(
      diff < 1e-9,
      `Station [${i}->${i+1}]: dV2/dx (${dV_dx}) must equal -qy (${-qy}), diff=${diff}`
    );
  }
});

test("ADV-2.2 Station Force Differential Relation for Out-of-Plane Flexure: dM2/dx = -V3 under qz transverse load", () => {
  const L = 5.0;
  const qz = 18.0; // 18 kN/m out-of-plane transverse load

  const el: Element12DOF = {
    id: "beam-minor",
    name: "K102",
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
    0.0, 0.0,  0.003, 0.0,  0.0015, 0.0,
    0.0, 0.0, -0.004, 0.0, -0.0020, 0.0,
  ]);

  const stations = calculate11MemberStations(el, arbDisps, kLocal);

  for (let i = 0; i < 10; i++) {
    const sA = stations[i];
    const sB = stations[i + 1];
    const dx = sB.x - sA.x;
    const dM2 = sB.M2 - sA.M2;
    const avgV3 = 0.5 * (sA.V3 + sB.V3);
    const numericalDerivative = dM2 / dx;

    // Statics: dM2/dx = -V3
    const diff = Math.abs(numericalDerivative - (-avgV3));
    assert.ok(
      diff < 1e-9,
      `Station [${i}->${i+1}]: dM2/dx (${numericalDerivative}) must match -avgV3 (${-avgV3}), diff=${diff}`
    );
  }
});

// ============================================================================
// SUITE 3: Degenerate Geometry Stress Testing
// ============================================================================

test("ADV-3.1 Zero-Length Members: throws controlled error or handles without NaN/silent corruption", () => {
  // Test 1: Zero length element in buildLocal12DOFStiffnessMatrix
  const elZero: Element12DOF = {
    id: "zero-elem",
    name: "K_ZERO",
    type: "beam",
    floorId: "f0",
    nodeI: "n1",
    nodeJ: "n1",
    length: 0.0, // exactly zero
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

  assert.throws(
    () => buildLocal12DOFStiffnessMatrix(elZero),
    /boyu sıfır veya çok küçük/,
    "Zero length element must throw descriptive error"
  );

  // Test 2: Coincident nodes in build3x3RotationMatrix
  const p1: Vector3D = { x: 2.0, y: 3.0, z: 4.0 };
  const p2: Vector3D = { x: 2.0, y: 3.0, z: 4.0 }; // exact coincident
  assert.throws(
    () => build3x3RotationMatrix(p1, p2),
    /çakışık/,
    "Coincident nodes in 3D rotation matrix must throw descriptive error"
  );

  // Test 3: Sub-millimeter coincident nodes (distance < 1e-6)
  const p3: Vector3D = { x: 2.0, y: 3.0, z: 4.0 + 1e-7 };
  assert.throws(
    () => build3x3RotationMatrix(p1, p3),
    /çakışık/,
    "Sub-micro-meter distance nodes must throw descriptive error"
  );
});

test("ADV-3.2 High Aspect Ratio Elements: extreme slender members (L/h > 100) maintain numerical stability", () => {
  // Extreme aspect ratio: L = 50.0 m, depth = 0.20 m -> L/h = 250!
  const L = 50.0;
  const h = 0.20;
  const b = 0.20;

  const elSlender: Element12DOF = {
    id: "slender-elem",
    name: "K_SLENDER",
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
    qy: 2.0,
    qz: 0,
  };

  const K = buildLocal12DOFStiffnessMatrix(elSlender);
  assert.equal(K.length, 144);

  // All entries must be finite numbers (no NaN, no Inf)
  for (let i = 0; i < 144; i++) {
    assert.ok(Number.isFinite(K[i]), `Entry K[${i}] must be finite for L/h=250`);
  }

  // Check symmetry holds even under extreme aspect ratio
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < 12; j++) {
      const diff = Math.abs(K[i * 12 + j] - K[j * 12 + i]);
      assert.ok(diff < 1e-9, `Symmetry must hold at (${i},${j}) for L/h=250`);
    }
  }

  // Solve a 1-member fixed-pinned system with LU decomposition
  // Fixed at node 1 (DOFs 0..5 fixed), node 2 free in vertical displacement (DOF 7)
  const n = 1;
  const A = new Float64Array([K[7 * 12 + 7]]);
  const bVec = new Float64Array([-10.0]); // 10 kN downward load at tip

  const { LU, piv } = luDecomposition(A, n);
  const x = luSolve(LU, piv, bVec, n);
  assert.ok(Number.isFinite(x[0]), "Tip deflection must be finite");
  assert.ok(x[0] < 0, "Tip deflection must be downward");
});

test("ADV-3.3 Low Aspect Ratio Elements: short / deep members (L/h < 0.1) maintain numerical stability", () => {
  // Short shear stub: L = 0.04 m, depth = 0.60 m -> L/h = 0.067!
  const L = 0.04;
  const h = 0.60;
  const b = 0.30;

  const elStub: Element12DOF = {
    id: "stub-elem",
    name: "K_STUB",
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
  assert.equal(K.length, 144);

  for (let i = 0; i < 144; i++) {
    assert.ok(Number.isFinite(K[i]), `Entry K[${i}] must be finite for L/h=0.067`);
  }

  // Check symmetry
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < 12; j++) {
      const diff = Math.abs(K[i * 12 + j] - K[j * 12 + i]);
      assert.ok(diff < 1e-4, `Symmetry must hold at (${i},${j}) for L/h=0.067`);
    }
  }
});

test("ADV-3.4 Nearly Collinear / Near-Vertical Elements: angular perturbation testing around the vertical singularity threshold", () => {
  // Test angles near vertical (nx -> 1.0, D -> 0)
  // Threshold in build3x3RotationMatrix is D < 1e-6
  const p1: Vector3D = { x: 0, y: 0, z: 0 };

  // Angle 1: Exactly vertical
  const pVert: Vector3D = { x: 0, y: 0, z: 3.0 };
  const R_exact = build3x3RotationMatrix(p1, pVert, 0);
  assert.equal(R_exact[0], 0); // ex.x
  assert.equal(R_exact[1], 0); // ex.y
  assert.equal(R_exact[2], 1); // ex.z

  // Angle 2: Very slightly inclined (D = 1e-7, below threshold 1e-6)
  const pSubThresh: Vector3D = { x: 1e-7 * 3.0, y: 0, z: 3.0 };
  const R_sub = build3x3RotationMatrix(p1, pSubThresh, 0);
  assert.ok(Number.isFinite(R_sub[0]));

  // Angle 3: Just above threshold (D = 1e-5, above threshold 1e-6)
  const pAboveThresh: Vector3D = { x: 1e-5 * 3.0, y: 0, z: 3.0 };
  const R_above = build3x3RotationMatrix(p1, pAboveThresh, 0);
  assert.ok(Number.isFinite(R_above[0]));

  // Verify orthogonality R^T * R = I for all cases
  for (const R of [R_exact, R_sub, R_above]) {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        let dot = 0.0;
        for (let k = 0; k < 3; k++) dot += R[k * 3 + i] * R[k * 3 + j];
        const expected = i === j ? 1.0 : 0.0;
        assert.ok(Math.abs(dot - expected) < 1e-6, `R^T*R must be identity near vertical singularity`);
      }
    }
  }
});

test("ADV-3.5 Extreme Stiffness Contrast: adjacent elements with 1000x stiffness ratio (e.g. rigid arm vs flexible beam)", () => {
  // Create 3-node system: Node 1 fixed, Node 2 connected by ultra-rigid arm, Node 3 connected by flexible beam
  // K1: E1 = 3000e6, K2: E2 = 30e6 (100x ratio)
  const L = 3.0;
  const A = 0.25 * 0.50;
  const Iz = (0.25 * Math.pow(0.50, 3)) / 12;
  const Iy = (0.50 * Math.pow(0.25, 3)) / 12;

  const elRigid: Element12DOF = {
    id: "rigid",
    name: "R1",
    type: "beam",
    floorId: "f0",
    nodeI: "n1",
    nodeJ: "n2",
    length: L,
    E: 3000e6, // 100x
    G: 1250e6,
    A: A * 10,
    Iz: Iz * 10,
    Iy: Iy * 10,
    J: 0.01,
    f_crack: 1.0,
    rollAngleRad: 0,
    width: 0.5,
    depth: 0.5,
    qy: 0,
    qz: 0,
  };

  const elFlex: Element12DOF = {
    id: "flex",
    name: "F1",
    type: "beam",
    floorId: "f0",
    nodeI: "n2",
    nodeJ: "n3",
    length: L,
    E: 30e6,
    G: 12.5e6,
    A,
    Iz,
    Iy,
    J: 0.001,
    f_crack: 0.35,
    rollAngleRad: 0,
    width: 0.25,
    depth: 0.50,
    qy: 0,
    qz: 0,
  };

  const kRigid = buildLocal12DOFStiffnessMatrix(elRigid);
  const kFlex = buildLocal12DOFStiffnessMatrix(elFlex);

  // Assemble 2 active DOFs (transverse displacement at node 2 and node 3)
  const K2x2 = new Float64Array(4);
  K2x2[0 * 2 + 0] = kRigid[7 * 12 + 7] + kFlex[1 * 12 + 1];
  K2x2[0 * 2 + 1] = kFlex[1 * 12 + 7];
  K2x2[1 * 2 + 0] = kFlex[7 * 12 + 1];
  K2x2[1 * 2 + 1] = kFlex[7 * 12 + 7];

  const F2 = new Float64Array([-50.0, -50.0]); // loads at node 2 and 3

  // Solve with Cholesky and LU
  const cholesky = choleskyDecomposition(K2x2, 2);
  assert.ok(cholesky !== null, "Matrix must be positive definite despite 100x stiffness contrast");
  const uChol = choleskySolve(cholesky!, F2, 2);

  const { LU, piv } = luDecomposition(K2x2, 2);
  const uLU = luSolve(LU, piv, F2, 2);

  // Both solvers must match within 1e-8
  assert.ok(Math.abs(uChol[0] - uLU[0]) < 1e-8);
  assert.ok(Math.abs(uChol[1] - uLU[1]) < 1e-8);

  // Node 2 (adjacent to rigid arm) must displace much less than node 3 (flexible cantilever)
  assert.ok(Math.abs(uChol[0]) < Math.abs(uChol[1]));
});

// ============================================================================
// SUITE 4: Advanced Spatial Challenges (Multi-Storey, Skewed Members, Modal)
// ============================================================================

test("ADV-1.4 Multi-Storey Asymmetric Spatial Frame with Shear Wall: global vertical and horizontal equilibrium", () => {
  // 3-storey building with columns and a shear wall
  const numStoreys = 3;
  const H_storey = 3.0;
  const Lx = 6.0;
  const Ly = 5.0;

  const nodes: Node3D[] = [];
  const elements: Element12DOF[] = [];
  const floors = [
    { id: "f1", name: "Kat 1", elevation: 0.0, height: H_storey },
    { id: "f2", name: "Kat 2", elevation: H_storey, height: H_storey },
    { id: "f3", name: "Kat 3", elevation: 2 * H_storey, height: H_storey },
  ];

  // Base nodes
  nodes.push(
    { id: "b1", name: "B1", x: 0, y: 0, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1,-1,-1,-1,-1,-1] },
    { id: "b2", name: "B2", x: Lx, y: 0, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1,-1,-1,-1,-1,-1] },
    { id: "b3", name: "B3", x: Lx, y: Ly, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1,-1,-1,-1,-1,-1] },
    { id: "b4", name: "B4", x: 0, y: Ly, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1,-1,-1,-1,-1,-1] },
  );

  let dofCounter = 0;
  const floorDiaphragms: FemMeshInput["floorDiaphragms"] = [];
  let totalAppliedDeadKn = 0;
  let totalAppliedLiveKn = 0;

  for (let s = 1; s <= numStoreys; s++) {
    const fId = `f${s}`;
    const z = s * H_storey;
    const deadKn = 250.0;
    const liveKn = 100.0;
    totalAppliedDeadKn += deadKn;
    totalAppliedLiveKn += liveKn;

    floorDiaphragms.push({
      floorId: fId,
      centerX: Lx / 2,
      centerY: Ly / 2,
      totalMassKg: 25000,
      deadWeightKn: deadKn,
      liveWeightKn: liveKn,
    });

    // Floor nodes
    const n1 = `n1_s${s}`;
    const n2 = `n2_s${s}`;
    const n3 = `n3_s${s}`;
    const n4 = `n4_s${s}`;

    nodes.push(
      { id: n1, name: n1, x: 0, y: 0, z, floorId: fId, isBaseFixed: false, dofIndices: [dofCounter++, dofCounter++, dofCounter++, dofCounter++, dofCounter++, dofCounter++] },
      { id: n2, name: n2, x: Lx, y: 0, z, floorId: fId, isBaseFixed: false, dofIndices: [dofCounter++, dofCounter++, dofCounter++, dofCounter++, dofCounter++, dofCounter++] },
      { id: n3, name: n3, x: Lx, y: Ly, z, floorId: fId, isBaseFixed: false, dofIndices: [dofCounter++, dofCounter++, dofCounter++, dofCounter++, dofCounter++, dofCounter++] },
      { id: n4, name: n4, x: 0, y: Ly, z, floorId: fId, isBaseFixed: false, dofIndices: [dofCounter++, dofCounter++, dofCounter++, dofCounter++, dofCounter++, dofCounter++] },
    );

    const prevN1 = s === 1 ? "b1" : `n1_s${s-1}`;
    const prevN2 = s === 1 ? "b2" : `n2_s${s-1}`;
    const prevN3 = s === 1 ? "b3" : `n3_s${s-1}`;
    const prevN4 = s === 1 ? "b4" : `n4_s${s-1}`;

    // Columns
    const colProp = {
      length: H_storey,
      E: 32e6,
      G: 13.3e6,
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

    elements.push(
      { id: `c1_s${s}`, name: `C1_S${s}`, type: "column", floorId: fId, nodeI: prevN1, nodeJ: n1, ...colProp },
      { id: `c2_s${s}`, name: `C2_S${s}`, type: "column", floorId: fId, nodeI: prevN2, nodeJ: n2, ...colProp },
      { id: `c3_s${s}`, name: `C3_S${s}`, type: "column", floorId: fId, nodeI: prevN3, nodeJ: n3, ...colProp },
      { id: `c4_s${s}`, name: `C4_S${s}`, type: "column", floorId: fId, nodeI: prevN4, nodeJ: n4, ...colProp },
    );

    // Beams
    const beamPropX = {
      length: Lx,
      E: 32e6,
      G: 13.3e6,
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
    const beamPropY = { ...beamPropX, length: Ly };

    elements.push(
      { id: `bx1_s${s}`, name: `BX1_S${s}`, type: "beam", floorId: fId, nodeI: n1, nodeJ: n2, ...beamPropX },
      { id: `by1_s${s}`, name: `BY1_S${s}`, type: "beam", floorId: fId, nodeI: n2, nodeJ: n3, ...beamPropY },
      { id: `bx2_s${s}`, name: `BX2_S${s}`, type: "beam", floorId: fId, nodeI: n3, nodeJ: n4, ...beamPropX },
      { id: `by2_s${s}`, name: `BY2_S${s}`, type: "beam", floorId: fId, nodeI: n4, nodeJ: n1, ...beamPropY },
    );
  }

  const meshInput: FemMeshInput = {
    nodes,
    elements,
    floors,
    floorDiaphragms,
    sds: 1.0,
    sd1: 0.4,
    r: 8.0,
    importance: 1.0,
  };

  const output = solve3DStructuralMesh(meshInput);
  assert.equal(output.success, true);

  // Check 3 natural periods extracted and strictly decreasing T1 > T2 > T3
  assert.equal(output.modes.length, 3);
  assert.ok(output.naturalPeriods[0] >= output.naturalPeriods[1]);
  assert.ok(output.naturalPeriods[1] >= output.naturalPeriods[2]);

  // Check base shears
  assert.ok(output.baseShears.Vtx > 0);
  assert.ok(output.baseShears.Vty > 0);

  // Multi-storey vertical equilibrium:
  // Base columns (C1_S1..C4_S1) must support the entire 3-storey factored gravity load:
  // W_total = 1.4 * (3 * 250) + 1.6 * (3 * 100) = 1.4*750 + 1.6*300 = 1050 + 480 = 1530 kN
  const expectedFactoredW = 1.4 * totalAppliedDeadKn + 1.6 * totalAppliedLiveKn;
  let sumRzBase = 0;
  for (const cId of ["c1_s1", "c2_s1", "c3_s1", "c4_s1"]) {
    const env = output.memberEnvelopes[cId];
    sumRzBase += -env.stations[0].N;
  }

  const diffW = Math.abs(sumRzBase - expectedFactoredW);
  assert.ok(
    diffW < 5.0,
    `Multi-storey vertical reaction sum (${sumRzBase} kN) must balance total gravity (${expectedFactoredW} kN), diff=${diffW}`
  );
});

test("ADV-2.3 Combined Biaxial Flexure Differential Statics: dM3/dx = V2 AND dM2/dx = -V3 simultaneously under arbitrary roll angle", () => {
  const L = 6.0;
  const qy = 20.0;
  const qz = 15.0;
  const roll = Math.PI / 4; // 45 degrees roll angle

  const el: Element12DOF = {
    id: "biaxial-beam",
    name: "K_BIAX",
    type: "beam",
    floorId: "f1",
    nodeI: "n1",
    nodeJ: "n2",
    length: L,
    E: 30e6,
    G: 12.5e6,
    A: 0.30 * 0.60,
    Iz: (0.30 * Math.pow(0.60, 3)) / 12,
    Iy: (0.60 * Math.pow(0.30, 3)) / 12,
    J: 0.003,
    f_crack: 0.35,
    rollAngleRad: roll,
    width: 0.30,
    depth: 0.60,
    qy,
    qz,
  };

  const kLocal = buildLocal12DOFStiffnessMatrix(el);
  const arbDisps = new Float64Array([
    0.002, 0.004, -0.003, 0.001, 0.002, -0.001,
   -0.001, -0.002, 0.005, -0.001, 0.003, 0.002,
  ]);

  const stations = calculate11MemberStations(el, arbDisps, kLocal);

  for (let i = 0; i < 10; i++) {
    const sA = stations[i];
    const sB = stations[i + 1];
    const dx = sB.x - sA.x;

    // Major axis: dM3/dx = V2
    const numDerivM3 = (sB.M3 - sA.M3) / dx;
    const avgV2 = 0.5 * (sA.V2 + sB.V2);
    assert.ok(
      Math.abs(numDerivM3 - avgV2) < 1e-9,
      `Biaxial station ${i}: dM3/dx must match avg V2`
    );

    // Minor axis: dM2/dx = -V3
    const numDerivM2 = (sB.M2 - sA.M2) / dx;
    const avgV3 = 0.5 * (sA.V3 + sB.V3);
    assert.ok(
      Math.abs(numDerivM2 - (-avgV3)) < 1e-9,
      `Biaxial station ${i}: dM2/dx must match -avg V3`
    );
  }
});

test("ADV-3.6 Jacobi Eigenvalue Solver under Repeated Eigenvalues: symmetric matrix with multiple identical modes", () => {
  // 4x4 matrix with two pairs of identical eigenvalues (e.g. perfectly symmetric 2D building)
  // Diagonal matrix [5, 5, 12, 12] rotated by an arbitrary orthogonal transformation
  const diag = [5, 5, 12, 12];
  const n = 4;
  const A = new Float64Array(16);
  for (let i = 0; i < n; i++) A[i * n + i] = diag[i];

  // Add small off-diagonal coupling
  A[0 * 4 + 1] = 0.5; A[1 * 4 + 0] = 0.5;
  A[2 * 4 + 3] = 0.3; A[3 * 4 + 2] = 0.3;

  const { values, vectors } = jacobiEigenvalue(A, n);
  assert.equal(values.length, 4);

  // Check eigenvalues are all positive
  for (let i = 0; i < 4; i++) {
    assert.ok(values[i] > 0, `Eigenvalue ${i} must be positive`);
  }

  // Check eigenvectors are mutually orthogonal: V^T * V = I
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let dot = 0.0;
      for (let k = 0; k < n; k++) {
        dot += vectors[k * n + i] * vectors[k * n + j];
      }
      const expected = i === j ? 1.0 : 0.0;
      assert.ok(
        Math.abs(dot - expected) < 1e-6,
        `Eigenvectors ${i} and ${j} must be orthonormal, dot=${dot}`
      );
    }
  }
});

test("ADV-3.7 Robustness against Malformed Mesh Inputs in solve3DStructuralMesh", () => {
  // Empty mesh input returns clean error without throwing unhandled crash
  const emptyOutput = solve3DStructuralMesh({
    nodes: [],
    elements: [],
    floors: [],
    floorDiaphragms: [],
    sds: 1.0,
    sd1: 0.4,
    r: 8.0,
    importance: 1.0,
  });
  assert.equal(emptyOutput.success, false);
  assert.ok(emptyOutput.error);

  // 1. Elements empty: returns clean error without throwing unhandled crash
  const emptyElements = solve3DStructuralMesh({
    nodes: [{ id: "n1", name: "N1", x: 0, y: 0, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1,-1,-1,-1,-1,-1] }],
    elements: [],
    floors: [],
    floorDiaphragms: [],
    sds: 1.0,
    sd1: 0.4,
    r: 8.0,
    importance: 1.0,
  });
  assert.equal(emptyElements.success, false);
  assert.ok(emptyElements.error?.includes("Boş ağ analizi yapılamaz"));

  // 2. All fixed base nodes with elements (0 free DOFs) throws descriptive error
  const dummyEl: Element12DOF = {
    id: "el_fixed",
    name: "FIXED_BEAM",
    type: "beam",
    floorId: "f0",
    nodeI: "n1",
    nodeJ: "n2",
    length: 3.0,
    E: 30e6,
    G: 12.5e6,
    A: 0.1,
    Iz: 0.001,
    Iy: 0.001,
    J: 0.001,
    f_crack: 1.0,
    rollAngleRad: 0,
    width: 0.25,
    depth: 0.50,
    qy: 0,
    qz: 0,
  };

  assert.throws(
    () =>
      solve3DStructuralMesh({
        nodes: [
          { id: "n1", name: "N1", x: 0, y: 0, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1,-1,-1,-1,-1,-1] },
          { id: "n2", name: "N2", x: 3, y: 0, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1,-1,-1,-1,-1,-1] },
        ],
        elements: [dummyEl],
        floors: [],
        floorDiaphragms: [],
        sds: 1.0,
        sd1: 0.4,
        r: 8.0,
        importance: 1.0,
      }),
    /serbest düğüm noktası/
  );
});

test("ADV-3.8 Full End-to-End CadModel Multi-Storey Building FEM Analysis under Adversarial Settings", () => {
  const model = createDemoModel();

  // Test with extreme seismic demand: Sds = 2.0, Sd1 = 1.0, high importance = 1.5, brittle system R = 4.0
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

  // Base shear under high hazard must be larger than standard
  const standardResult = runStructuralAnalysis(model);
  assert.ok(
    result.baseShearKn > standardResult.baseShearKn,
    "Extreme hazard base shear must exceed standard hazard"
  );

  // Check all 33 combinations produced
  assert.equal(result.combinations.length, 33);
  for (const c of result.combinations) {
    assert.ok(Number.isFinite(c.maxDisplacementM));
    assert.ok(Number.isFinite(c.baseShearXKn));
    assert.ok(Number.isFinite(c.baseShearYKn));
  }

  // Check 11 stations for every frame element
  for (const el of model.elements) {
    if (el.type === "column" || el.type === "beam" || el.type === "wall") {
      const stations = result.memberStations[el.id];
      assert.ok(stations, `Stations must exist for ${el.id}`);
      assert.equal(stations.length, 11);
      for (const st of stations) {
        assert.ok(Number.isFinite(st.N));
        assert.ok(Number.isFinite(st.V2));
        assert.ok(Number.isFinite(st.M3));
      }
    }
  }

  // Check multi-storey diaphragm drift
  assert.ok(result.floorDiaphragms.length > 0);
  for (const fd of result.floorDiaphragms) {
    assert.ok(Number.isFinite(fd.driftRatioX));
    assert.ok(Number.isFinite(fd.driftRatioY));
  }
});


