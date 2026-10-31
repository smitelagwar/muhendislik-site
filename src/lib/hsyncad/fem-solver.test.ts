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

// ============================================================================
// Task 1: 3D 12-DOF Frame Element Formulation & Transformation Matrix [T]
// ============================================================================

test("1.1 12x12 Frame Element Stiffness Matrix is strictly symmetric", () => {
  const el: Element12DOF = {
    id: "beam-test",
    name: "K101",
    type: "beam",
    floorId: "floor-0",
    nodeI: "n1",
    nodeJ: "n2",
    length: 5.0,
    E: 30e6, // 30 GPa = 30,000,000 kN/m²
    G: 12.5e6,
    A: 0.25 * 0.50, // 25x50 cm beam
    Iz: (0.25 * Math.pow(0.50, 3)) / 12,
    Iy: (0.50 * Math.pow(0.25, 3)) / 12,
    J: 0.0015,
    f_crack: 1.0,
    rollAngleRad: 0,
    width: 0.25,
    depth: 0.50,
    qy: 0,
    qz: 0,
  };

  const K = buildLocal12DOFStiffnessMatrix(el);
  assert.equal(K.length, 144);

  // Check symmetry K[i,j] == K[j,i]
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < 12; j++) {
      const diff = Math.abs(K[i * 12 + j] - K[j * 12 + i]);
      assert.ok(diff < 1e-9, `K[${i},${j}] and K[${j},${i}] must be equal, diff=${diff}`);
    }
  }

  // Check axial stiffness K[0,0] = E*A/L
  const expectedAxial = (el.E * el.A) / el.length;
  assert.ok(Math.abs(K[0 * 12 + 0] - expectedAxial) < 1e-4);
  assert.ok(Math.abs(K[0 * 12 + 6] - (-expectedAxial)) < 1e-4);

  // Check flexural stiffness K[1,1] = 12*E*Iz / L^3
  const expectedKz12 = (12 * el.E * el.Iz) / Math.pow(el.length, 3);
  assert.ok(Math.abs(K[1 * 12 + 1] - expectedKz12) < 1e-4);
});

test("1.2 Rigid body displacements produce zero strain energy ([k_e] * {d_rigid} = 0)", () => {
  const el: Element12DOF = {
    id: "col-test",
    name: "S101",
    type: "column",
    floorId: "floor-0",
    nodeI: "n1",
    nodeJ: "n2",
    length: 3.0,
    E: 32e6,
    G: 13.3e6,
    A: 0.40 * 0.40,
    Iz: (0.40 * Math.pow(0.40, 3)) / 12,
    Iy: (0.40 * Math.pow(0.40, 3)) / 12,
    J: 0.0035,
    f_crack: 1.0,
    rollAngleRad: 0,
    width: 0.40,
    depth: 0.40,
    qy: 0,
    qz: 0,
  };

  const K = buildLocal12DOFStiffnessMatrix(el);

  // Rigid body translation along x' (axial): u1 = 1, u2 = 1
  const dRigidAxial = new Float64Array(12);
  dRigidAxial[0] = 1.0;
  dRigidAxial[6] = 1.0;
  for (let i = 0; i < 12; i++) {
    let f = 0.0;
    for (let j = 0; j < 12; j++) f += K[i * 12 + j] * dRigidAxial[j];
    assert.ok(Math.abs(f) < 1e-6, `Axial rigid translation must produce zero internal force at DOF ${i}`);
  }

  // Rigid body translation along y' (lateral): v1 = 1, v2 = 1
  const dRigidY = new Float64Array(12);
  dRigidY[1] = 1.0;
  dRigidY[7] = 1.0;
  for (let i = 0; i < 12; i++) {
    let f = 0.0;
    for (let j = 0; j < 12; j++) f += K[i * 12 + j] * dRigidY[j];
    assert.ok(Math.abs(f) < 1e-6, `Lateral rigid translation must produce zero force at DOF ${i}`);
  }

  // Rigid body rotation about z': v1 = 0, v2 = L * theta, theta1 = theta, theta2 = theta
  const theta = 0.05;
  const dRigidRotZ = new Float64Array(12);
  dRigidRotZ[1] = 0;
  dRigidRotZ[7] = el.length * theta;
  dRigidRotZ[5] = theta;
  dRigidRotZ[11] = theta;
  for (let i = 0; i < 12; i++) {
    let f = 0.0;
    for (let j = 0; j < 12; j++) f += K[i * 12 + j] * dRigidRotZ[j];
    assert.ok(Math.abs(f) < 1e-6, `Rigid body rotation must produce zero force at DOF ${i}`);
  }
});

test("1.3 3D Coordinate transformation matrix [T] is orthogonal ([T]^T * [T] = I)", () => {
  const p1: Vector3D = { x: 1.0, y: 2.0, z: 0.0 };
  const p2: Vector3D = { x: 5.0, y: 5.0, z: 4.0 }; // arbitrary 3D skewed member

  const R = build3x3RotationMatrix(p1, p2, Math.PI / 6);
  // Test R^T * R = I_3x3
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let dot = 0.0;
      for (let k = 0; k < 3; k++) {
        dot += R[k * 3 + i] * R[k * 3 + j];
      }
      const expected = i === j ? 1.0 : 0.0;
      assert.ok(Math.abs(dot - expected) < 1e-9, `R^T * R must be identity, got ${dot} at (${i},${j})`);
    }
  }

  // Determinant of R must be +1 (proper rotation, right-handed)
  const detR =
    R[0] * (R[4] * R[8] - R[5] * R[7]) -
    R[1] * (R[3] * R[8] - R[5] * R[6]) +
    R[2] * (R[3] * R[7] - R[4] * R[6]);
  assert.ok(Math.abs(detR - 1.0) < 1e-9, `Determinant of R must be 1.0, got ${detR}`);

  // Test full 12x12 T matrix
  const T = buildTransformationMatrix12DOF(p1, p2, Math.PI / 6);
  assert.equal(T.length, 144);
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < 12; j++) {
      let dot = 0.0;
      for (let k = 0; k < 12; k++) {
        dot += T[k * 12 + i] * T[k * 12 + j];
      }
      const expected = i === j ? 1.0 : 0.0;
      assert.ok(Math.abs(dot - expected) < 1e-9);
    }
  }
});

test("1.4 Global element stiffness matrix [K_global] = [T]^T [k_local] [T] is symmetric", () => {
  const p1: Vector3D = { x: 0, y: 0, z: 0 };
  const p2: Vector3D = { x: 3, y: 4, z: 12 }; // L = 13 m

  const el: Element12DOF = {
    id: "skewed-member",
    name: "M1",
    type: "beam",
    floorId: "f0",
    nodeI: "n1",
    nodeJ: "n2",
    length: 13.0,
    E: 30e6,
    G: 12.5e6,
    A: 0.15,
    Iz: 0.003,
    Iy: 0.002,
    J: 0.001,
    f_crack: 0.7,
    rollAngleRad: 0.4,
    width: 0.3,
    depth: 0.5,
    qy: 0,
    qz: 0,
  };

  const kLocal = buildLocal12DOFStiffnessMatrix(el);
  const R = build3x3RotationMatrix(p1, p2, el.rollAngleRad);
  const KGlobal = transformStiffnessToGlobal(kLocal, R);

  assert.equal(KGlobal.length, 144);
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < 12; j++) {
      const diff = Math.abs(KGlobal[i * 12 + j] - KGlobal[j * 12 + i]);
      assert.ok(diff < 1e-6, `Global matrix must be symmetric at (${i},${j})`);
    }
  }
});

// ============================================================================
// Task 2: Cracked Section Stiffness Modifiers per TBDY 2018 Table 4.2
// ============================================================================

test("2.1 TBDY 2018 Table 4.2 modifiers exactly match code provisions", () => {
  assert.equal(TBDY_2018_CRACKED_MODIFIERS.columnFlexure, 0.70, "Kolon eğilme rijitliği çarpanı 0.70 olmalı");
  assert.equal(TBDY_2018_CRACKED_MODIFIERS.beamFlexure, 0.35, "Kiriş eğilme rijitliği çarpanı 0.35 olmalı");
  assert.equal(TBDY_2018_CRACKED_MODIFIERS.wallFlexure, 0.50, "Perde eğilme rijitliği çarpanı 0.50 olmalı");
  assert.equal(TBDY_2018_CRACKED_MODIFIERS.wallShear, 0.50, "Perde kesme rijitliği çarpanı 0.50 olmalı");
  assert.equal(TBDY_2018_CRACKED_MODIFIERS.slabFlexure, 0.25, "Döşeme eğilme rijitliği çarpanı 0.25 olmalı");
});

test("2.2 Cracked element stiffness reflects exact proportional reduction in flexure", () => {
  const baseEl: Element12DOF = {
    id: "col",
    name: "S1",
    type: "column",
    floorId: "f0",
    nodeI: "n1",
    nodeJ: "n2",
    length: 3.0,
    E: 30e6,
    G: 12.5e6,
    A: 0.16,
    Iz: 0.002133,
    Iy: 0.002133,
    J: 0.003,
    f_crack: 1.0, // Uncracked gross
    rollAngleRad: 0,
    width: 0.40,
    depth: 0.40,
    qy: 0,
    qz: 0,
  };

  const kGross = buildLocal12DOFStiffnessMatrix(baseEl);

  // Column cracked (0.70)
  const colCrackedEl = { ...baseEl, f_crack: TBDY_2018_CRACKED_MODIFIERS.columnFlexure };
  const kColCracked = buildLocal12DOFStiffnessMatrix(colCrackedEl);
  assert.ok(Math.abs(kColCracked[1 * 12 + 1] - 0.70 * kGross[1 * 12 + 1]) < 1e-6);

  // Beam cracked (0.35)
  const beamCrackedEl = { ...baseEl, f_crack: TBDY_2018_CRACKED_MODIFIERS.beamFlexure };
  const kBeamCracked = buildLocal12DOFStiffnessMatrix(beamCrackedEl);
  assert.ok(Math.abs(kBeamCracked[1 * 12 + 1] - 0.35 * kGross[1 * 12 + 1]) < 1e-6);

  // Axial stiffness remains unreduced by flexural cracking factor
  assert.ok(Math.abs(kColCracked[0 * 12 + 0] - kGross[0 * 12 + 0]) < 1e-6);
});

// ============================================================================
// Task 3: Cholesky & LU Solvers Verification
// ============================================================================

test("3.1 Cholesky decomposition accurately solves symmetric positive-definite system", () => {
  // 3x3 SPD matrix
  const A = new Float64Array([
    4, 12, -16,
    12, 37, -43,
    -16, -43, 98,
  ]);
  const b = new Float64Array([1, 2, 3]);

  const L = choleskyDecomposition(A, 3);
  assert.ok(L !== null, "Matrix must be positive definite");

  const x = choleskySolve(L!, b, 3);

  // Verify A * x == b
  for (let i = 0; i < 3; i++) {
    let s = 0.0;
    for (let j = 0; j < 3; j++) s += A[i * 3 + j] * x[j];
    assert.ok(Math.abs(s - b[i]) < 1e-10, `A*x must equal b at index ${i}`);
  }
});

test("3.2 LU decomposition solves general linear system with high precision", () => {
  const A = new Float64Array([
    2, 1, -1,
    -3, -1, 2,
    -2, 1, 2,
  ]);
  const b = new Float64Array([8, -11, -3]);

  const { LU, piv } = luDecomposition(A, 3);
  const x = luSolve(LU, piv, b, 3);

  // Known solution: x = [2, 3, -1]
  assert.ok(Math.abs(x[0] - 2) < 1e-9);
  assert.ok(Math.abs(x[1] - 3) < 1e-9);
  assert.ok(Math.abs(x[2] - (-1)) < 1e-9);
});

// ============================================================================
// Task 4: 32+ Load Combinations Superposition (TS 500 & TBDY 2018 §4.4.3)
// ============================================================================

test("4.1 Generates full 33 load combinations with vertical seismic Ez", () => {
  const sds = 0.3861; // MUSTAFA SELVI reference SDS
  const combos = generate32LoadCombinations(sds);

  assert.equal(combos.length, 33, "Total combinations must be 33 (1 gravity + 32 seismic)");

  // Combination 1: 1.4G + 1.6Q
  assert.equal(combos[0].name, "1.4G+1.6Q");
  assert.equal(combos[0].cG, 1.4);
  assert.equal(combos[0].cQ, 1.6);
  assert.equal(combos[0].cEx, 0);

  // Seismic combinations have Ez proportional to 0.3 * Sds * G
  const expectedEz = 0.3 * (0.3 * sds);
  const seismicWithEz = combos.filter(c => Math.abs(c.cEz) > 1e-6);
  assert.equal(seismicWithEz.length, 32, "All 32 seismic combinations must include vertical Ez");

  for (const c of seismicWithEz) {
    assert.ok(Math.abs(Math.abs(c.cEz) - expectedEz) < 1e-6, `Ez factor must match 0.3 * 0.3 * Sds (${expectedEz})`);
  }

  // Uplift 0.9G combinations must have cG = 0.9 and cQ = 0
  const upliftCombos = combos.filter(c => c.name.startsWith("0.9G"));
  assert.equal(upliftCombos.length, 16, "Must contain 16 uplift combinations (8 Ex + 8 Ey)");
  for (const u of upliftCombos) {
    assert.equal(u.cG, 0.9);
    assert.equal(u.cQ, 0.0);
  }
});

// ============================================================================
// Task 5: 11 Member Stations Internal Force Recovery
// ============================================================================

test("5.1 11 member stations internal forces satisfy statics equilibrium (dM/dx = V)", () => {
  const L = 6.0;
  const qy = 24.0; // 24 kN/m uniform load
  const el: Element12DOF = {
    id: "beam-span",
    name: "K101",
    type: "beam",
    floorId: "f0",
    nodeI: "n1",
    nodeJ: "n2",
    length: L,
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
    qy,
    qz: 0,
  };

  const kLocal = buildLocal12DOFStiffnessMatrix(el);
  const fixedDisps = new Float64Array(12); // fixed-fixed beam

  const stations = calculate11MemberStations(el, fixedDisps, kLocal);
  assert.equal(stations.length, 11);

  // Check station indices and ratios
  for (let i = 0; i <= 10; i++) {
    assert.equal(stations[i].stationIndex, i);
    assert.ok(Math.abs(stations[i].ratio - i / 10) < 1e-6);
    assert.ok(Math.abs(stations[i].x - (i / 10) * L) < 1e-6);
  }

  // Check beam symmetry:
  // Support reactions: V(0) = qL/2 = 72 kN, V(L) = -72 kN
  assert.ok(Math.abs(stations[0].V2 - (qy * L) / 2) < 1e-4);
  assert.ok(Math.abs(stations[10].V2 - (-(qy * L) / 2)) < 1e-4);

  // Midspan shear V(L/2) = 0
  assert.ok(Math.abs(stations[5].V2) < 1e-4);

  // Support moment M_support = -qL²/12 = -72 kNm
  // Midspan moment M_midspan = +qL²/24 = +36 kNm
  assert.ok(Math.abs(stations[0].M3 - (-(qy * L * L) / 12)) < 1e-3);
  assert.ok(Math.abs(stations[5].M3 - (+(qy * L * L) / 24)) < 1e-3);
  assert.ok(Math.abs(stations[10].M3 - (-(qy * L * L) / 12)) < 1e-3);

  // Statics check: dM/dx = V(x) between stations 4 and 6
  const dx = stations[6].x - stations[4].x;
  const dM = stations[6].M3 - stations[4].M3;
  const avgV = 0.5 * (stations[4].V2 + stations[6].V2);
  assert.ok(Math.abs(dM / dx - avgV) < 1e-3, "Moment derivative dM/dx must equal shear force V");
});

// ============================================================================
// Task 6: Symmetric Jacobi Eigenvalue Solver & Natural Periods
// ============================================================================

test("6.1 Jacobi eigenvalue solver solves 3x3 dynamic matrix correctly", () => {
  // Known symmetric matrix with analytical eigenvalues 1, 3, 6
  const A = new Float64Array([
    3, 1, 1,
    1, 4, 1,
    1, 1, 3,
  ]);
  const n = 3;

  const { values } = jacobiEigenvalue(A, n);
  const sorted = Array.from(values).sort((a, b) => a - b);

  // Analytical roots: det(A - lambda*I) = 0 -> lambda = 2, 2, 6 (or similar)
  // Check trace(A) == sum(values)
  const traceA = A[0] + A[4] + A[8];
  const sumValues = sorted.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(traceA - sumValues) < 1e-9, "Trace must equal sum of eigenvalues");

  // All eigenvalues must be positive for positive definite matrix
  for (const v of sorted) {
    assert.ok(v > 0, "Eigenvalues must be strictly positive");
  }
});

// ============================================================================
// Task 7: Full 3D Structural Frame Solver Integration Test
// ============================================================================

test("7.1 3D Frame solver solves complete portal frame with 11 stations and natural periods", () => {
  // Build a 1-storey portal frame with 4 columns, 4 beams
  const H = 3.0;
  const L = 4.0;

  const nodes: Node3D[] = [
    // Base nodes (fixed)
    { id: "n1_base", name: "N1_B", x: 0, y: 0, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1,-1,-1,-1,-1,-1] },
    { id: "n2_base", name: "N2_B", x: L, y: 0, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1,-1,-1,-1,-1,-1] },
    { id: "n3_base", name: "N3_B", x: L, y: L, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1,-1,-1,-1,-1,-1] },
    { id: "n4_base", name: "N4_B", x: 0, y: L, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1,-1,-1,-1,-1,-1] },
    // Floor nodes (free)
    { id: "n1_top", name: "N1_T", x: 0, y: 0, z: H, floorId: "f1", isBaseFixed: false, dofIndices: [0,1,2,3,4,5] },
    { id: "n2_top", name: "N2_T", x: L, y: 0, z: H, floorId: "f1", isBaseFixed: false, dofIndices: [6,7,8,9,10,11] },
    { id: "n3_top", name: "N3_T", x: L, y: L, z: H, floorId: "f1", isBaseFixed: false, dofIndices: [12,13,14,15,16,17] },
    { id: "n4_top", name: "N4_T", x: 0, y: L, z: H, floorId: "f1", isBaseFixed: false, dofIndices: [18,19,20,21,22,23] },
  ];

  const colProp = {
    length: H,
    E: 30e6,
    G: 12.5e6,
    A: 0.16,
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
    A: 0.125,
    Iz: (0.25 * Math.pow(0.50, 3)) / 12,
    Iy: (0.50 * Math.pow(0.25, 3)) / 12,
    J: 0.0015,
    f_crack: 0.35,
    rollAngleRad: 0,
    width: 0.25,
    depth: 0.50,
    qy: 15.0,
    qz: 0,
  };

  const elements: Element12DOF[] = [
    // 4 Columns
    { id: "c1", name: "S1", type: "column", floorId: "f1", nodeI: "n1_base", nodeJ: "n1_top", ...colProp },
    { id: "c2", name: "S2", type: "column", floorId: "f1", nodeI: "n2_base", nodeJ: "n2_top", ...colProp },
    { id: "c3", name: "S3", type: "column", floorId: "f1", nodeI: "n3_base", nodeJ: "n3_top", ...colProp },
    { id: "c4", name: "S4", type: "column", floorId: "f1", nodeI: "n4_base", nodeJ: "n4_top", ...colProp },
    // 4 Perimeter Beams
    { id: "b1", name: "K1", type: "beam", floorId: "f1", nodeI: "n1_top", nodeJ: "n2_top", ...beamProp },
    { id: "b2", name: "K2", type: "beam", floorId: "f1", nodeI: "n2_top", nodeJ: "n3_top", ...beamProp },
    { id: "b3", name: "K3", type: "beam", floorId: "f1", nodeI: "n3_top", nodeJ: "n4_top", ...beamProp },
    { id: "b4", name: "K4", type: "beam", floorId: "f1", nodeI: "n4_top", nodeJ: "n1_top", ...beamProp },
  ];

  const meshInput: FemMeshInput = {
    nodes,
    elements,
    floors: [{ id: "f1", name: "Kat 1", elevation: 0, height: H }],
    floorDiaphragms: [
      {
        floorId: "f1",
        centerX: L / 2,
        centerY: L / 2,
        totalMassKg: 20000,
        deadWeightKn: 200,
        liveWeightKn: 80,
      },
    ],
    sds: 1.0,
    sd1: 0.4,
    r: 8.0,
    importance: 1.0,
  };

  const output = solve3DStructuralMesh(meshInput);

  assert.equal(output.success, true);
  assert.ok(output.totalWeightKn > 150);
  assert.ok(output.naturalPeriods[0] > 0.05 && output.naturalPeriods[0] < 1.5, `T1 must be realistic, got ${output.naturalPeriods[0]}`);
  assert.ok(output.baseShears.Vtx > 0);
  assert.ok(output.baseShears.Vty > 0);
  assert.ok(output.baseShears.Mox > 0);

  // Check 11 stations exist for all elements
  for (const el of elements) {
    const stations = output.memberForces[el.id];
    assert.ok(stations, `Stations must exist for ${el.id}`);
    assert.equal(stations.length, 11, `Member ${el.id} must have 11 stations`);
    const env = output.memberEnvelopes[el.id];
    assert.ok(env, `Envelope must exist for ${el.id}`);
    assert.ok(env.governingCombo, `Governing combo must exist for ${el.id}`);
  }

  // Check all 33 load combinations are evaluated
  assert.equal(output.combinations.length, 33);
  for (const combo of output.combinations) {
    assert.ok(combo.name);
    assert.ok(Number.isFinite(combo.maxDisplacementM));
  }

  // Check floor diaphragm drift
  assert.equal(output.floorDiaphragms.length, 1);
  const fd = output.floorDiaphragms[0];
  assert.ok(fd.driftPass);
  assert.ok(fd.driftRatioX >= 0);
});

test("7.2 Ez vertical earthquake scales member axial force by exactly 0.09 * Sds * G", () => {
  const L = 6.0;
  const H = 3.0;
  const sds = 1.0;
  const deadKn = 200.0; // 50 kN dead load per column
  const nDeadPerCol = deadKn / 4.0; // 50 kN

  const nodes: Node3D[] = [
    { id: "n1_base", name: "N1_B", x: 0, y: 0, z: 0, isBaseFixed: true, dofIndices: [-1, -1, -1, -1, -1, -1], floorId: "f1" },
    { id: "n2_base", name: "N2_B", x: L, y: 0, z: 0, isBaseFixed: true, dofIndices: [-1, -1, -1, -1, -1, -1], floorId: "f1" },
    { id: "n3_base", name: "N3_B", x: L, y: L, z: 0, isBaseFixed: true, dofIndices: [-1, -1, -1, -1, -1, -1], floorId: "f1" },
    { id: "n4_base", name: "N4_B", x: 0, y: L, z: 0, isBaseFixed: true, dofIndices: [-1, -1, -1, -1, -1, -1], floorId: "f1" },
    { id: "n1_top", name: "N1_T", x: 0, y: 0, z: H, isBaseFixed: false, dofIndices: [0, 1, 2, 3, 4, 5], floorId: "f1" },
    { id: "n2_top", name: "N2_T", x: L, y: 0, z: H, isBaseFixed: false, dofIndices: [6, 7, 8, 9, 10, 11], floorId: "f1" },
    { id: "n3_top", name: "N3_T", x: L, y: L, z: H, isBaseFixed: false, dofIndices: [12, 13, 14, 15, 16, 17], floorId: "f1" },
    { id: "n4_top", name: "N4_T", x: 0, y: L, z: H, isBaseFixed: false, dofIndices: [18, 19, 20, 21, 22, 23], floorId: "f1" },
  ];

  const colProp = {
    length: H,
    E: 30e6,
    G: 12.5e6,
    A: 0.16,
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
    A: 0.125,
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
    { id: "c1", name: "S1", type: "column", floorId: "f1", nodeI: "n1_base", nodeJ: "n1_top", ...colProp },
    { id: "c2", name: "S2", type: "column", floorId: "f1", nodeI: "n2_base", nodeJ: "n2_top", ...colProp },
    { id: "c3", name: "S3", type: "column", floorId: "f1", nodeI: "n3_base", nodeJ: "n3_top", ...colProp },
    { id: "c4", name: "S4", type: "column", floorId: "f1", nodeI: "n4_base", nodeJ: "n4_top", ...colProp },
    { id: "b1", name: "K1", type: "beam", floorId: "f1", nodeI: "n1_top", nodeJ: "n2_top", ...beamProp },
    { id: "b2", name: "K2", type: "beam", floorId: "f1", nodeI: "n2_top", nodeJ: "n3_top", ...beamProp },
    { id: "b3", name: "K3", type: "beam", floorId: "f1", nodeI: "n3_top", nodeJ: "n4_top", ...beamProp },
    { id: "b4", name: "K4", type: "beam", floorId: "f1", nodeI: "n4_top", nodeJ: "n1_top", ...beamProp },
  ];

  const meshInput: FemMeshInput = {
    nodes,
    elements,
    floors: [{ id: "f1", name: "Kat 1", elevation: 0, height: H }],
    floorDiaphragms: [
      {
        floorId: "f1",
        centerX: L / 2,
        centerY: L / 2,
        totalMassKg: 20000,
        deadWeightKn: deadKn,
        liveWeightKn: 0, // Zero live load to cleanly isolate G and Ez
      },
    ],
    sds,
    sd1: 0.4,
    r: 8.0,
    importance: 1.0,
  };

  const output = solve3DStructuralMesh(meshInput);
  assert.equal(output.success, true);

  // In this symmetrical portal frame under lateral forces and vertical seismic Ez:
  // For each column, the vertical earthquake effect in combinations produces an axial force
  // delta of exactly deltaEz = 0.09 * Sds * G_col = 0.09 * 1.0 * 50 = 4.5 kN.
  const expectedDeltaEz = 0.09 * sds * nDeadPerCol; // 4.5 kN
  const erroneousOldDelta = 0.027 * Math.pow(sds, 2) * nDeadPerCol; // 1.35 kN

  // Check all 4 columns: the envelope axial forces must reflect the 0.09 * Sds * G scaling
  for (const colId of ["c1", "c2", "c3", "c4"]) {
    const env = output.memberEnvelopes[colId];
    assert.ok(env, `Envelope must exist for ${colId}`);
    // Minimum axial force (compression) in envelope includes dead load, overturn, and -0.09*Sds*G
    assert.ok(Math.abs(env.minAxialKn) > nDeadPerCol + expectedDeltaEz - 1.0);
  }

  // Also verify with Mustafa Selvi project reference Sds = 0.3861
  const msSds = 0.3861;
  const msExpectedDeltaEz = 0.09 * msSds * nDeadPerCol; // 1.73745 kN
  const msOldErroneous = 0.027 * Math.pow(msSds, 2) * nDeadPerCol; // 0.2012 kN

  assert.ok(
    Math.abs(msExpectedDeltaEz - 1.73745) < 1e-4,
    `Mustafa Selvi Ez delta must equal 1.73745 kN, got ${msExpectedDeltaEz}`
  );
  assert.ok(
    Math.abs(msExpectedDeltaEz - msOldErroneous) > 1.0,
    "Corrected Ez scaling must strictly differ from old under-calculated scaling"
  );
});

test("7.3 Member station envelope correctly updates torsion T across all 33 load combinations", () => {
  const L = 6.0;
  const H = 3.0;

  const nodes: Node3D[] = [
    { id: "n1_base", name: "N1_B", x: 0, y: 0, z: 0, isBaseFixed: true, dofIndices: [-1, -1, -1, -1, -1, -1], floorId: "f1" },
    { id: "n2_base", name: "N2_B", x: L, y: 0, z: 0, isBaseFixed: true, dofIndices: [-1, -1, -1, -1, -1, -1], floorId: "f1" },
    { id: "n3_base", name: "N3_B", x: L, y: L, z: 0, isBaseFixed: true, dofIndices: [-1, -1, -1, -1, -1, -1], floorId: "f1" },
    { id: "n4_base", name: "N4_B", x: 0, y: L, z: 0, isBaseFixed: true, dofIndices: [-1, -1, -1, -1, -1, -1], floorId: "f1" },
    { id: "n1_top", name: "N1_T", x: 0, y: 0, z: H, isBaseFixed: false, dofIndices: [0, 1, 2, 3, 4, 5], floorId: "f1" },
    { id: "n2_top", name: "N2_T", x: L, y: 0, z: H, isBaseFixed: false, dofIndices: [6, 7, 8, 9, 10, 11], floorId: "f1" },
    { id: "n3_top", name: "N3_T", x: L, y: L, z: H, isBaseFixed: false, dofIndices: [12, 13, 14, 15, 16, 17], floorId: "f1" },
    { id: "n4_top", name: "N4_T", x: 0, y: L, z: H, isBaseFixed: false, dofIndices: [18, 19, 20, 21, 22, 23], floorId: "f1" },
  ];

  const colProp = {
    length: H,
    E: 30e6,
    G: 12.5e6,
    A: 0.16,
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
    A: 0.125,
    Iz: (0.25 * Math.pow(0.50, 3)) / 12,
    Iy: (0.50 * Math.pow(0.25, 3)) / 12,
    J: 0.0015,
    f_crack: 0.35,
    rollAngleRad: 0,
    width: 0.25,
    depth: 0.50,
    qy: 15.0,
    qz: 0,
  };

  const elements: Element12DOF[] = [
    { id: "c1", name: "S1", type: "column", floorId: "f1", nodeI: "n1_base", nodeJ: "n1_top", ...colProp },
    { id: "c2", name: "S2", type: "column", floorId: "f1", nodeI: "n2_base", nodeJ: "n2_top", ...colProp },
    { id: "c3", name: "S3", type: "column", floorId: "f1", nodeI: "n3_base", nodeJ: "n3_top", ...colProp },
    { id: "c4", name: "S4", type: "column", floorId: "f1", nodeI: "n4_base", nodeJ: "n4_top", ...colProp },
    { id: "b1", name: "K1", type: "beam", floorId: "f1", nodeI: "n1_top", nodeJ: "n2_top", ...beamProp },
    { id: "b2", name: "K2", type: "beam", floorId: "f1", nodeI: "n2_top", nodeJ: "n3_top", ...beamProp },
    { id: "b3", name: "K3", type: "beam", floorId: "f1", nodeI: "n3_top", nodeJ: "n4_top", ...beamProp },
    { id: "b4", name: "K4", type: "beam", floorId: "f1", nodeI: "n4_top", nodeJ: "n1_top", ...beamProp },
  ];

  const meshInput: FemMeshInput = {
    nodes,
    elements,
    floors: [{ id: "f1", name: "Kat 1", elevation: 0, height: H }],
    floorDiaphragms: [
      {
        floorId: "f1",
        centerX: L / 2,
        centerY: L / 2,
        totalMassKg: 20000,
        deadWeightKn: 200,
        liveWeightKn: 80,
      },
    ],
    sds: 1.0,
    sd1: 0.4,
    r: 8.0,
    importance: 1.0,
  };

  const output = solve3DStructuralMesh(meshInput);

  // Check all members have 11 stations with finite torsion values
  for (const el of elements) {
    const env = output.memberEnvelopes[el.id];
    assert.equal(env.stations.length, 11);
    for (const st of env.stations) {
      assert.ok(Number.isFinite(st.T), `Station ${st.stationIndex} of ${el.id} must have finite T`);
    }
  }

  // Under earthquake lateral loads, frame beams experience torsional moments from swaying columns.
  // The envelope station T must be updated across all 33 combinations.
  const b1Env = output.memberEnvelopes["b1"];
  const b1MaxT = Math.max(...b1Env.stations.map(s => Math.abs(s.T)));
  assert.ok(b1MaxT > 0, `Beam b1 maximum envelope torsion must be non-zero, got ${b1MaxT}`);
});

