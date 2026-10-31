/**
 * Empirical Challenger Verification Suite: Milestone 3 Beam & Column Design
 * 
 * Mathematical Oracles and Adversarial Stress Harness for:
 * 1. Column P-M Biaxial Interaction & Bresler Criterion (TS 500 §7.3, TBDY 2018 §7.3)
 * 2. Beam-Column Joint Shear Checks & Confinement Classification (TBDY 2018 §7.5)
 * 3. Strong Column - Weak Beam Check & Roof Exemption (TBDY 2018 §7.3.5)
 * 4. Beam 3-Station Flexure, Support Bottom Steel Rule & Capacity Shear (TS 500 §7.1, TBDY §7.4)
 * 5. Full End-to-End Building RC Design Check Integration
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
  createDemoModel,
  createEmptyModel,
} from "../../src/lib/hsyncad/model";
import {
  runStructuralAnalysis,
  DEFAULT_ANALYSIS_SETTINGS,
  type AnalysisSettings,
} from "../../src/lib/hsyncad/analysis";
import {
  getConcreteProperties,
  getRebarProperties,
  getBarAreaMm2,
  designColumn,
  designBeam,
  checkBeamColumnJoint,
  checkStrongColumnWeakBeam,
  runConcreteDesignChecks,
  type ColumnDesignInput,
  type BeamDesignInput,
  type JointCheckInput,
  type StrongColumnInput,
} from "../../src/lib/hsyncad/design-engine";

// Helper: generate a standard test column element
function createTestColumn(params: {
  id?: string;
  name?: string;
  width?: number;
  depth?: number;
  height?: number;
  floorId?: string;
}): ColumnElement {
  return {
    id: params.id ?? "col-c1",
    name: params.name ?? "S101",
    type: "column",
    floorId: params.floorId ?? "floor-1",
    layer: "Kolonlar",
    position: { x: 0, y: 0 },
    width: params.width ?? 0.40,
    depth: params.depth ?? 0.40,
    height: params.height ?? 3.0,
    materialId: "mat-c25",
  };
}

// Helper: generate a standard test beam element
function createTestBeam(params: {
  id?: string;
  name?: string;
  width?: number;
  height?: number;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  floorId?: string;
}): BeamElement {
  return {
    id: params.id ?? "beam-b1",
    name: params.name ?? "K101",
    type: "beam",
    floorId: params.floorId ?? "floor-1",
    layer: "Kirisler",
    start: params.start ?? { x: 0, y: 0 },
    end: params.end ?? { x: 5.0, y: 0 },
    width: params.width ?? 0.30,
    height: params.height ?? 0.50,
    materialId: "mat-c25",
  };
}

// ============================================================================
// SUITE 1: Column P-M Interaction & Bresler Criterion Oracles
// ============================================================================
describe("Suite 1: Column P-M Interaction & Bresler Criterion Oracles", () => {
  const concrete = getConcreteProperties("C25");
  const rebar = getRebarProperties("B420C");
  const col = createTestColumn({ width: 0.40, depth: 0.40 });
  const AcMm2 = col.width * 1000 * col.depth * 1000; // 160,000 mm²
  const AcFckKn = (AcMm2 * concrete.fck) / 1000.0;   // 4,000 kN
  const codeAxialLimitKn = 0.40 * AcFckKn;            // 1,600 kN

  test("1.1 Axial load range verification: Nd in [-0.1, 0, 0.2, 0.4, 0.401, 0.6] * Ac * fck", () => {
    const testCases = [
      { ratio: -0.10, expectedDCR: 0.25, expectedPass: true, label: "Net Tension (-0.10 Ac fck)" },
      { ratio: 0.00, expectedDCR: 0.00, expectedPass: true, label: "Pure Flexure (0.00 Ac fck)" },
      { ratio: 0.20, expectedDCR: 0.50, expectedPass: true, label: "Moderate Compression (0.20 Ac fck)" },
      { ratio: 0.40, expectedDCR: 1.00, expectedPass: true, label: "Exact Code Ceiling Limit (0.40 Ac fck)" },
      { ratio: 0.401, expectedDCR: 1.0025, expectedPass: false, label: "Infinitesimal Breach (0.401 Ac fck)" },
      { ratio: 0.60, expectedDCR: 1.50, expectedPass: false, label: "Heavy Overload (0.60 Ac fck)" },
    ];

    for (const tc of testCases) {
      const NdKn = tc.ratio * AcFckKn;
      const res = designColumn({
        element: col,
        floorHeightM: 3.0,
        beamDepthMaxM: 0.50,
        NdKn,
        V2dKn: 20,
        V3dKn: 20,
        M2dKnm: 20,
        M3dKnm: 20,
        concrete,
        rebar,
      });

      assert.equal(res.axialLimitKn, codeAxialLimitKn, `Axial limit must be 0.40 * Ac * fck = ${codeAxialLimitKn} kN`);
      assert.ok(
        Math.abs(res.axialDCR - tc.expectedDCR) < 1e-3,
        `Case '${tc.label}': Expected axialDCR ${tc.expectedDCR}, got ${res.axialDCR}`
      );
      assert.equal(res.axialPass, tc.expectedPass, `Case '${tc.label}': Expected axialPass = ${tc.expectedPass}`);

      if (!tc.expectedPass) {
        assert.equal(res.pass, false, "Over-limit axial load must cause overall column failure");
        assert.ok(
          res.statusText.includes("Eksenel yük limiti aşıldı"),
          `Status text must explicitly report axial overload: '${res.statusText}'`
        );
      }
    }
  });

  test("1.2 Strict mathematical boundary around Nd = 0.40 * Ac * fck", () => {
    // Exact limit: 1600.0 kN
    const resPass = designColumn({
      element: col,
      floorHeightM: 3.0,
      beamDepthMaxM: 0.50,
      NdKn: 1600.0,
      V2dKn: 10,
      V3dKn: 10,
      M2dKnm: 10,
      M3dKnm: 10,
      concrete,
      rebar,
    });
    assert.equal(resPass.axialPass, true, "Nd = 1600 kN (exact 40%) must pass");

    // Infinitesimal over limit: 1601.0 kN
    const resFail = designColumn({
      element: col,
      floorHeightM: 3.0,
      beamDepthMaxM: 0.50,
      NdKn: 1601.0,
      V2dKn: 10,
      V3dKn: 10,
      M2dKnm: 10,
      M3dKnm: 10,
      concrete,
      rebar,
    });
    assert.equal(resFail.axialPass, false, "Nd = 1601 kN (exceeding 40%) must fail");
    assert.equal(resFail.pass, false);
  });

  test("1.3 Biaxial moment monotonicity oracle: DCR increases strictly monotonically with (M2d, M3d)", () => {
    // Fix axial load at 0.20 * Ac * fck (800 kN)
    const NdKn = 800.0;
    const momentSteps = [0, 10, 25, 50, 75, 100, 130];

    // Check M3d monotonicity for fixed M2d
    for (const m2 of [0, 20, 50]) {
      let prevDcr = -1;
      for (const m3 of momentSteps) {
        const res = designColumn({
          element: col,
          floorHeightM: 3.0,
          beamDepthMaxM: 0.50,
          NdKn,
          V2dKn: 15,
          V3dKn: 15,
          M2dKnm: m2,
          M3dKnm: m3,
          concrete,
          rebar,
        });

        assert.ok(
          res.biaxialDCR > prevDcr,
          `Monotonicity violation: for M2=${m2}, M3=${m3}, DCR ${res.biaxialDCR} should be > previous ${prevDcr}`
        );
        prevDcr = res.biaxialDCR;
      }
    }

    // Check M2d monotonicity for fixed M3d
    for (const m3 of [0, 20, 50]) {
      let prevDcr = -1;
      for (const m2 of momentSteps) {
        const res = designColumn({
          element: col,
          floorHeightM: 3.0,
          beamDepthMaxM: 0.50,
          NdKn,
          V2dKn: 15,
          V3dKn: 15,
          M2dKnm: m2,
          M3dKnm: m3,
          concrete,
          rebar,
        });

        assert.ok(
          res.biaxialDCR > prevDcr,
          `Monotonicity violation: for M3=${m3}, M2=${m2}, DCR ${res.biaxialDCR} should be > previous ${prevDcr}`
        );
        prevDcr = res.biaxialDCR;
      }
    }
  });

  test("1.4 Bresler power law exponent (alpha = 1.20) and contour oracle", () => {
    const resRef = designColumn({
      element: col,
      floorHeightM: 3.0,
      beamDepthMaxM: 0.50,
      NdKn: 600,
      V2dKn: 10,
      V3dKn: 10,
      M2dKnm: 40,
      M3dKnm: 50,
      concrete,
      rebar,
    });

    const alpha = 1.20;
    const term2 = Math.pow(40.0 / resRef.Mr2Knm, alpha);
    const term3 = Math.pow(50.0 / resRef.Mr3Knm, alpha);
    const expectedDCR = Math.pow(term2 + term3, 1.0 / alpha);

    assert.ok(
      Math.abs(resRef.biaxialDCR - expectedDCR) < 1e-6,
      `Bresler DCR must match exact closed-form: expected ${expectedDCR}, got ${resRef.biaxialDCR}`
    );

    // Symmetric diagonal ray: M2 = M3 = M
    const Mdiag = 45.0;
    const resDiag = designColumn({
      element: col,
      floorHeightM: 3.0,
      beamDepthMaxM: 0.50,
      NdKn: 600,
      V2dKn: 10,
      V3dKn: 10,
      M2dKnm: Mdiag,
      M3dKnm: Mdiag,
      concrete,
      rebar,
    });
    // For a square column, Mr2 == Mr3
    assert.ok(Math.abs(resDiag.Mr2Knm - resDiag.Mr3Knm) < 1e-3, "Square column must have equal Mr2 and Mr3");
    const expectedDiagDCR = (Mdiag / resDiag.Mr3Knm) * Math.pow(2.0, 1.0 / alpha);
    assert.ok(
      Math.abs(resDiag.biaxialDCR - expectedDiagDCR) < 1e-4,
      `Diagonal Bresler DCR must scale by 2^(1/1.20): expected ${expectedDiagDCR}, got ${resDiag.biaxialDCR}`
    );
  });

  test("1.5 RC Column interaction curve mechanics: axial compression stiffening up to balanced point", () => {
    // In RC columns, as axial compression increases from 0 up to balanced axial load Nb,
    // flexural resistance Mr increases (concrete compression delays tension cracking).
    const resZeroAxial = designColumn({
      element: col,
      floorHeightM: 3.0,
      beamDepthMaxM: 0.50,
      NdKn: 0.0,
      V2dKn: 10,
      V3dKn: 10,
      M2dKnm: 0,
      M3dKnm: 50,
      concrete,
      rebar,
    });

    const resCompression = designColumn({
      element: col,
      floorHeightM: 3.0,
      beamDepthMaxM: 0.50,
      NdKn: 500.0,
      V2dKn: 10,
      V3dKn: 10,
      M2dKnm: 0,
      M3dKnm: 50,
      concrete,
      rebar,
    });

    assert.ok(
      resCompression.Mr3Knm > resZeroAxial.Mr3Knm,
      `Compression-stiffened Mr3 (${resCompression.Mr3Knm.toFixed(2)} kNm) must exceed zero-axial Mr3 (${resZeroAxial.Mr3Knm.toFixed(2)} kNm)`
    );
    assert.ok(
      resCompression.biaxialDCR < resZeroAxial.biaxialDCR,
      `For identical moment M3=50, axial compression must reduce DCR (increase capacity)`
    );
  });

  test("1.6 Column capacity shear Ve and confinement tie detailing per TBDY 2018 §7.3", () => {
    const res = designColumn({
      element: col,
      floorHeightM: 3.0,
      beamDepthMaxM: 0.50,
      NdKn: 800,
      V2dKn: 30,
      V3dKn: 20,
      M2dKnm: 30,
      M3dKnm: 40,
      concrete,
      rebar,
    });

    const lnM = 3.0 - 0.50; // 2.50 m
    const expectedMpa = 1.40 * res.Mr3Knm;
    const expectedVe = Math.max(30.0, (expectedMpa + expectedMpa) / lnM);

    assert.ok(Math.abs(res.VeKn - expectedVe) < 1e-3, `Capacity shear Ve must equal (Mpa+Mpu)/ln = ${expectedVe} kN`);
    // Confinement tie spacing: min(b/3 = 133mm, 150mm, 6 * barDia = 96mm) -> 9.6 cm -> rounded to 10 cm
    assert.ok(res.confinementSpacingCm <= 10, "Confinement tie spacing must be <= 10 cm");
    assert.ok(res.confinementLengthM >= 0.50, "Confinement length must be >= 0.50 m");
    assert.ok(res.rebarSchedule.transverse.text.includes("Φ8/"), "Transverse rebar schedule must specify Phi 8 ties");
  });

  test("1.7 Biaxial 4-quadrant symmetry: (+/-M2d, +/-M3d) produce identical DCR", () => {
    const signs = [
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ];

    const dcrValues = signs.map(([s2, s3]) => {
      const res = designColumn({
        element: col,
        floorHeightM: 3.0,
        beamDepthMaxM: 0.50,
        NdKn: 600,
        V2dKn: 20,
        V3dKn: 20,
        M2dKnm: s2 * 42.5,
        M3dKnm: s3 * 67.8,
        concrete,
        rebar,
      });
      return res.biaxialDCR;
    });

    for (let i = 1; i < dcrValues.length; i++) {
      assert.ok(
        Math.abs(dcrValues[i] - dcrValues[0]) < 1e-6,
        `Quadrant ${i} DCR (${dcrValues[i]}) must match Quadrant 0 DCR (${dcrValues[0]})`
      );
    }
  });

  test("1.8 Exact interaction boundary transition at DCR = 1.000 vs 1.001", () => {
    // Single axis M3: when M3d = Mr3, DCR = 1.000 -> pass
    const resBase = designColumn({
      element: col,
      floorHeightM: 3.0,
      beamDepthMaxM: 0.50,
      NdKn: 500,
      V2dKn: 10,
      V3dKn: 10,
      M2dKnm: 0,
      M3dKnm: 10,
      concrete,
      rebar,
    });

    const Mr3 = resBase.Mr3Knm;

    const resPass = designColumn({
      element: col,
      floorHeightM: 3.0,
      beamDepthMaxM: 0.50,
      NdKn: 500,
      V2dKn: 10,
      V3dKn: 10,
      M2dKnm: 0,
      M3dKnm: Mr3 * 0.9999, // just below boundary
      concrete,
      rebar,
    });
    assert.equal(resPass.flexurePass, true, "Moment at 99.99% of Mr must pass");

    const resFail = designColumn({
      element: col,
      floorHeightM: 3.0,
      beamDepthMaxM: 0.50,
      NdKn: 500,
      V2dKn: 10,
      V3dKn: 10,
      M2dKnm: 0,
      M3dKnm: Mr3 * 1.001, // just above boundary
      concrete,
      rebar,
    });
    assert.equal(resFail.flexurePass, false, "Moment at 100.1% of Mr must fail flexure");
    assert.equal(resFail.pass, false);
    assert.ok(resFail.statusText.includes("İki eksenli eğilme kapasitesi aşıldı"));
  });
});

// ============================================================================
// SUITE 2: Beam-Column Joint Shear Checks (TBDY 2018 §7.5) Oracles
// ============================================================================
describe("Suite 2: Beam-Column Joint Shear Checks (TBDY 2018 §7.5) Oracles", () => {
  const concrete = getConcreteProperties("C25");
  const rebar = getRebarProperties("B420C");
  const col = createTestColumn({ width: 0.40, depth: 0.40 });

  test("2.1 Confinement classification oracle: exhaustively tests all beam permutations", () => {
    // Column bc = 0.40 m, hc = 0.40 m. 0.75 * bc = 0.30 m.

    // Case 1: 4 wide beams (bw = 0.30 m >= 0.30 m) framing in X and Y directions -> Confined (factor 1.70)
    const beamsConfined: BeamElement[] = [
      createTestBeam({ id: "b-x1", width: 0.30, start: { x: -4, y: 0 }, end: { x: 0, y: 0 } }),
      createTestBeam({ id: "b-x2", width: 0.30, start: { x: 0, y: 0 }, end: { x: 4, y: 0 } }),
      createTestBeam({ id: "b-y1", width: 0.30, start: { x: 0, y: -4 }, end: { x: 0, y: 0 } }),
      createTestBeam({ id: "b-y2", width: 0.30, start: { x: 0, y: 0 }, end: { x: 0, y: 4 } }),
    ];
    const resConfined = checkBeamColumnJoint({
      column: col,
      connectedBeams: beamsConfined,
      colShearKn: 30,
      beamRebars: beamsConfined.map(b => ({ beamId: b.id, topAsMm2: 600, botAsMm2: 300 })),
      concrete,
      rebar,
    });
    assert.equal(resConfined.isConfined, true, "4 wide beams framing into all 4 faces must be CONFINED");

    // Case 2: 4 narrow beams (bw = 0.25 m < 0.30 m) -> Unconfined (factor 1.00)
    const beamsNarrow: BeamElement[] = [
      createTestBeam({ id: "b-x1", width: 0.25, start: { x: -4, y: 0 }, end: { x: 0, y: 0 } }),
      createTestBeam({ id: "b-x2", width: 0.25, start: { x: 0, y: 0 }, end: { x: 4, y: 0 } }),
      createTestBeam({ id: "b-y1", width: 0.25, start: { x: 0, y: -4 }, end: { x: 0, y: 0 } }),
      createTestBeam({ id: "b-y2", width: 0.25, start: { x: 0, y: 0 }, end: { x: 0, y: 4 } }),
    ];
    const resNarrow = checkBeamColumnJoint({
      column: col,
      connectedBeams: beamsNarrow,
      colShearKn: 30,
      beamRebars: beamsNarrow.map(b => ({ beamId: b.id, topAsMm2: 600, botAsMm2: 300 })),
      concrete,
      rebar,
    });
    assert.equal(resNarrow.isConfined, false, "Beams narrower than 0.75 bc must be UNCONFINED");

    // Case 3: 3 beams (T-junction edge column) -> Unconfined
    const beams3 = beamsConfined.slice(0, 3);
    const res3 = checkBeamColumnJoint({
      column: col,
      connectedBeams: beams3,
      colShearKn: 30,
      beamRebars: beams3.map(b => ({ beamId: b.id, topAsMm2: 600, botAsMm2: 300 })),
      concrete,
      rebar,
    });
    assert.equal(res3.isConfined, false, "3-beam junction (< 4 faces) must be UNCONFINED");

    // Case 4: 2 beams (L-junction corner column) -> Unconfined
    const beams2 = beamsConfined.slice(0, 2);
    const res2 = checkBeamColumnJoint({
      column: col,
      connectedBeams: beams2,
      colShearKn: 30,
      beamRebars: beams2.map(b => ({ beamId: b.id, topAsMm2: 600, botAsMm2: 300 })),
      concrete,
      rebar,
    });
    assert.equal(res2.isConfined, false, "2-beam corner junction must be UNCONFINED");

    // Case 5: 1 beam (cantilever or dead-end) -> Unconfined
    const beams1 = beamsConfined.slice(0, 1);
    const res1 = checkBeamColumnJoint({
      column: col,
      connectedBeams: beams1,
      colShearKn: 30,
      beamRebars: beams1.map(b => ({ beamId: b.id, topAsMm2: 600, botAsMm2: 300 })),
      concrete,
      rebar,
    });
    assert.equal(res1.isConfined, false, "1-beam junction must be UNCONFINED");
  });

  test("2.2 Confined vs Unconfined capacity ratio is exactly 1.7000", () => {
    // Create identical dimensions for both checks:
    // bc = 0.40, hc = 0.40, bw = 0.40
    const colTest = createTestColumn({ width: 0.40, depth: 0.40 });
    const beamWide = createTestBeam({ width: 0.40 });

    const beamsConfined: BeamElement[] = [
      createTestBeam({ width: 0.40, start: { x: -4, y: 0 }, end: { x: 0, y: 0 } }),
      createTestBeam({ width: 0.40, start: { x: 0, y: 0 }, end: { x: 4, y: 0 } }),
      createTestBeam({ width: 0.40, start: { x: 0, y: -4 }, end: { x: 0, y: 0 } }),
      createTestBeam({ width: 0.40, start: { x: 0, y: 0 }, end: { x: 0, y: 4 } }),
    ];

    // For unconfined, just take 2 beams of identical width
    const beamsUnconfined = beamsConfined.slice(0, 2);

    const resConfined = checkBeamColumnJoint({
      column: colTest,
      connectedBeams: beamsConfined,
      colShearKn: 20,
      beamRebars: beamsConfined.map(b => ({ beamId: b.id, topAsMm2: 500, botAsMm2: 250 })),
      concrete,
      rebar,
    });

    const resUnconfined = checkBeamColumnJoint({
      column: colTest,
      connectedBeams: beamsUnconfined,
      colShearKn: 20,
      beamRebars: beamsUnconfined.map(b => ({ beamId: b.id, topAsMm2: 500, botAsMm2: 250 })),
      concrete,
      rebar,
    });

    const capacityRatio = resConfined.shearCapacityKn / resUnconfined.shearCapacityKn;
    assert.ok(
      Math.abs(capacityRatio - 1.70) < 1e-4,
      `Capacity ratio confined/unconfined must be 1.70: got ${capacityRatio}`
    );
  });

  test("2.3 Effective joint width bj respects bj <= bc boundary", () => {
    const colTest = createTestColumn({ width: 0.40, depth: 0.50 });
    const testWidths = [0.25, 0.30, 0.35, 0.40, 0.50, 0.60];

    for (const bw of testWidths) {
      const beams = [createTestBeam({ width: bw })];
      const res = checkBeamColumnJoint({
        column: colTest,
        connectedBeams: beams,
        colShearKn: 20,
        beamRebars: [{ beamId: beams[0].id, topAsMm2: 500, botAsMm2: 250 }],
        concrete,
        rebar,
      });

      assert.ok(
        res.effectiveWidthM <= colTest.width + 1e-6,
        `Effective joint width bj (${res.effectiveWidthM}) must never exceed column width bc (${colTest.width})`
      );
    }
  });

  test("2.4 Joint shear demand Ve = 1.25 * fyk * (As1 + As2) - Vcol linearity & column shear relief", () => {
    const beam1 = createTestBeam({ width: 0.30 });
    const beam2 = createTestBeam({ width: 0.30, start: { x: 0, y: 0 }, end: { x: 5, y: 0 } });

    // Increasing beam rebar linearly increases Ve
    const rebarAreas = [400, 600, 1000, 1500]; // mm²
    let prevDemand = -1;

    for (const as1 of rebarAreas) {
      const res = checkBeamColumnJoint({
        column: col,
        connectedBeams: [beam1, beam2],
        colShearKn: 30,
        beamRebars: [
          { beamId: beam1.id, topAsMm2: as1, botAsMm2: as1 * 0.5 },
          { beamId: beam2.id, topAsMm2: as1, botAsMm2: as1 * 0.5 },
        ],
        concrete,
        rebar,
      });

      assert.ok(
        res.shearDemandKn > prevDemand,
        `Joint shear demand must increase with larger beam steel: As=${as1}, Ve=${res.shearDemandKn}`
      );
      prevDemand = res.shearDemandKn;

      // Closed form verification: Ve = 1.25 * 420 * (As1 + As2) / 1000 - Vcol
      const expectedVe = Math.max(10.0, (1.25 * 420.0 * (as1 + as1 * 0.5)) / 1000.0 - 30.0);
      assert.ok(
        Math.abs(res.shearDemandKn - expectedVe) < 1e-3,
        `Ve must match 1.25*fyk*(As1+As2) - Vcol: expected ${expectedVe}, got ${res.shearDemandKn}`
      );
    }

    // Increasing column shear Vcol reduces joint shear demand
    const vCols = [10, 50, 100, 200];
    let prevVcolDemand = 9999;
    for (const vc of vCols) {
      const res = checkBeamColumnJoint({
        column: col,
        connectedBeams: [beam1, beam2],
        colShearKn: vc,
        beamRebars: [
          { beamId: beam1.id, topAsMm2: 800, botAsMm2: 400 },
          { beamId: beam2.id, topAsMm2: 800, botAsMm2: 400 },
        ],
        concrete,
        rebar,
      });

      assert.ok(
        res.shearDemandKn <= prevVcolDemand,
        `Increasing Vcol (${vc} kN) must reduce or maintain joint shear demand (Ve=${res.shearDemandKn})`
      );
      prevVcolDemand = res.shearDemandKn;
    }
  });

  test("2.5 Excessive beam rebar triggers joint shear capacity failure", () => {
    // Unconfined joint with enormous beam top rebar (3000 mm² = 6 phi 25)
    const beam = createTestBeam({ width: 0.25 });
    const res = checkBeamColumnJoint({
      column: col,
      connectedBeams: [beam],
      colShearKn: 10,
      beamRebars: [{ beamId: beam.id, topAsMm2: 3000, botAsMm2: 1500 }],
      concrete,
      rebar,
    });

    assert.ok(res.shearDemandKn > res.shearCapacityKn, "Excessive rebar must push Ve above Vmax");
    assert.equal(res.pass, false, "Over-demand joint must fail");
    assert.ok(res.statusText.includes("Birleşim kesme güvenliği yetersiz"));
  });

  test("2.6 Effective joint width bj when beam equals column width (bw = bc) vs wide beam (bw > bc)", () => {
    const col40 = createTestColumn({ width: 0.40, depth: 0.40 });

    // Equal width: bw = 0.40, bc = 0.40 -> bj must be 0.40 m
    const beamEqual = [createTestBeam({ width: 0.40 })];
    const resEqual = checkBeamColumnJoint({
      column: col40,
      connectedBeams: beamEqual,
      colShearKn: 20,
      beamRebars: [{ beamId: beamEqual[0].id, topAsMm2: 500, botAsMm2: 250 }],
      concrete,
      rebar,
    });
    assert.ok(
      Math.abs(resEqual.effectiveWidthM - 0.40) < 1e-4,
      `When bw = bc, bj must equal bc (0.40 m), got ${resEqual.effectiveWidthM}`
    );

    // Wide beam: bw = 0.50, bc = 0.40 -> bj clamped at bc = 0.40 m
    const beamWide = [createTestBeam({ width: 0.50 })];
    const resWide = checkBeamColumnJoint({
      column: col40,
      connectedBeams: beamWide,
      colShearKn: 20,
      beamRebars: [{ beamId: beamWide[0].id, topAsMm2: 500, botAsMm2: 250 }],
      concrete,
      rebar,
    });
    assert.ok(
      Math.abs(resWide.effectiveWidthM - 0.40) < 1e-4,
      `When bw > bc, bj must be clamped at column width bc (0.40 m), got ${resWide.effectiveWidthM}`
    );
  });
});

// ============================================================================
// SUITE 3: Strong Column - Weak Beam Check (TBDY 2018 §7.3.5) Oracles
// ============================================================================
describe("Suite 3: Strong Column - Weak Beam Check (TBDY 2018 §7.3.5) Oracles", () => {
  const col = createTestColumn({ width: 0.40, depth: 0.40 });

  test("3.1 Strict 1.20 ratio threshold on intermediate storeys", () => {
    const testCases = [
      { sumCol: 100, sumBeam: 100, expectedRatio: 1.00, expectedPass: false },
      { sumCol: 119, sumBeam: 100, expectedRatio: 1.19, expectedPass: false },
      { sumCol: 120, sumBeam: 100, expectedRatio: 1.20, expectedPass: true },
      { sumCol: 150, sumBeam: 100, expectedRatio: 1.50, expectedPass: true },
      { sumCol: 200, sumBeam: 100, expectedRatio: 2.00, expectedPass: true },
    ];

    for (const tc of testCases) {
      const res = checkStrongColumnWeakBeam({
        column: col,
        colMomentCapacityKnm: tc.sumCol / 2.0,
        upperColMomentCapacityKnm: tc.sumCol / 2.0,
        connectedBeamCapacitiesKnm: [tc.sumBeam / 2.0, tc.sumBeam / 2.0],
        isTopStorey: false,
      });

      assert.ok(
        Math.abs(res.ratio - tc.expectedRatio) < 1e-3,
        `Expected ratio ${tc.expectedRatio}, got ${res.ratio}`
      );
      assert.equal(
        res.pass,
        tc.expectedPass,
        `Expected pass=${tc.expectedPass} for ratio ${tc.expectedRatio}`
      );

      if (tc.expectedPass) {
        assert.ok(res.statusText.includes("Güçlü kolon koşulu sağlandı"));
      } else {
        assert.ok(res.statusText.includes("Güçlü kolon koşulu yetersiz"));
      }
    }
  });

  test("3.2 Top storey (roof) exemption per TBDY §7.3.5.3", () => {
    // Column moment capacity is weaker than beams (ratio = 0.50 < 1.20)
    const res = checkStrongColumnWeakBeam({
      column: col,
      colMomentCapacityKnm: 25.0,
      connectedBeamCapacitiesKnm: [50.0, 50.0],
      isTopStorey: true, // Roof joint!
    });

    assert.ok(res.ratio < 1.20, "Ratio should be < 1.20 for weak column test");
    assert.equal(res.pass, true, "Top storey roof joints MUST pass per TBDY §7.3.5.3 exemption");
    assert.ok(
      res.statusText.includes("Çatı katı birleşimi: TBDY §7.3.5.3 uyarınca güçlü kolon tahkikinden muaftır"),
      `Status text must inform of roof exemption: '${res.statusText}'`
    );
  });

  test("3.3 Shear wall dominant building exemption", () => {
    const res = checkStrongColumnWeakBeam({
      column: col,
      colMomentCapacityKnm: 30.0,
      connectedBeamCapacitiesKnm: [50.0, 50.0],
      isTopStorey: false,
      isShearWallDominant: true, // Building is shear wall dominant
    });

    assert.equal(res.pass, true, "Shear wall dominant building joints are exempt and must pass");
  });

  test("3.4 Multi-storey column stack summation oracle", () => {
    // Ground floor column with upper column
    const upperCol = createTestColumn({ id: "col-c2", floorId: "floor-2" });
    const res = checkStrongColumnWeakBeam({
      column: col,
      upperColumn: upperCol,
      colMomentCapacityKnm: 70.0,
      upperColMomentCapacityKnm: 60.0,
      connectedBeamCapacitiesKnm: [40.0, 50.0],
      isTopStorey: false,
    });

    assert.equal(res.sumColumnMomentKnm, 130.0, "Sum of columns must be 70 + 60 = 130 kNm");
    assert.equal(res.sumBeamMomentKnm, 90.0, "Sum of beams must be 40 + 50 = 90 kNm");
    const expectedRatio = 130.0 / 90.0;
    assert.ok(Math.abs(res.ratio - expectedRatio) < 1e-4);
    assert.equal(res.pass, true, "130 / 90 = 1.44 >= 1.20 must pass");
  });

  test("3.5 Strong column check with 4 framing beams correctly sums all beam capacities", () => {
    const beamCaps = [35.0, 40.0, 25.0, 30.0]; // Total = 130 kNm
    // If sum of columns is 160 kNm: 160 / 130 = 1.23 >= 1.20 -> pass
    const resPass = checkStrongColumnWeakBeam({
      column: col,
      colMomentCapacityKnm: 80.0,
      upperColMomentCapacityKnm: 80.0,
      connectedBeamCapacitiesKnm: beamCaps,
      isTopStorey: false,
    });
    assert.equal(resPass.sumBeamMomentKnm, 130.0);
    assert.equal(resPass.sumColumnMomentKnm, 160.0);
    assert.ok(Math.abs(resPass.ratio - (160 / 130)) < 1e-4);
    assert.equal(resPass.pass, true);

    // If sum of columns is 150 kNm: 150 / 130 = 1.154 < 1.20 -> fail
    const resFail = checkStrongColumnWeakBeam({
      column: col,
      colMomentCapacityKnm: 75.0,
      upperColMomentCapacityKnm: 75.0,
      connectedBeamCapacitiesKnm: beamCaps,
      isTopStorey: false,
    });
    assert.ok(Math.abs(resFail.ratio - (150 / 130)) < 1e-4);
    assert.equal(resFail.pass, false);
  });
});

// ============================================================================
// SUITE 4: Beam Flexure & Capacity Shear Oracles (TS 500 §7.1 & TBDY §7.4)
// ============================================================================
describe("Suite 4: Beam Flexure & Capacity Shear Oracles", () => {
  const concrete = getConcreteProperties("C25");
  const rebar = getRebarProperties("B420C");
  const beam = createTestBeam({ width: 0.30, height: 0.50 });

  test("4.1 Support bottom steel ductility rule: As,bot >= 0.50 * As,top per TBDY §7.4.3.1", () => {
    // Large negative top moment (180 kNm), zero positive bottom moment (0 kNm)
    const res = designBeam({
      element: beam,
      LspanM: 6.0,
      colWidthLeftM: 0.40,
      colWidthRightM: 0.40,
      MiTopKnm: 180.0,
      MiBotKnm: 0.0,   // Zero bottom demand
      MmidBotKnm: 60.0,
      MjTopKnm: 180.0,
      MjBotKnm: 0.0,
      VdyKn: 50.0,
      V2dKn: 70.0,
      concrete,
      rebar,
    });

    // Check station i support bottom steel
    const asTop = res.stationI.AsTopMm2;
    const asBot = res.stationI.AsBotMm2;
    assert.ok(asTop > 800, `Top steel must be sized for 180 kNm (got ${asTop} mm²)`);
    assert.ok(
      asBot >= 0.50 * asTop - 1e-3,
      `Support bottom steel (${asBot} mm²) must be at least 50% of top steel (${asTop} mm²)`
    );

    // Also check station j
    assert.ok(
      res.stationJ.AsBotMm2 >= 0.50 * res.stationJ.AsTopMm2 - 1e-3,
      "Station j bottom steel must also satisfy 50% rule"
    );
  });

  test("4.2 Minimum tension steel ratio rho_min = max(0.002, 0.8 * fctd / fyd) per TS 500 Eq. 7.3", () => {
    // Very small moment (5 kNm) where As_req would be tiny without minimum steel
    const res = designBeam({
      element: beam,
      LspanM: 5.0,
      colWidthLeftM: 0.40,
      colWidthRightM: 0.40,
      MiTopKnm: 5.0,
      MiBotKnm: 2.0,
      MmidBotKnm: 5.0,
      MjTopKnm: 5.0,
      MjBotKnm: 2.0,
      VdyKn: 20.0,
      V2dKn: 25.0,
      concrete,
      rebar,
    });

    const dMm = 500 - 40; // 460 mm
    const rhoMin = Math.max(0.002, (0.8 * concrete.fctd) / rebar.fyd);
    const expectedAsMinMm2 = rhoMin * (300 * dMm);

    assert.ok(
      res.stationMid.AsBotMm2 >= expectedAsMinMm2 - 1e-3,
      `Provided midspan bottom steel (${res.stationMid.AsBotMm2} mm²) must satisfy As_min (${expectedAsMinMinMm2(expectedAsMinMm2)} mm²)`
    );

    function expectedAsMinMinMm2(v: number) { return v.toFixed(1); }
  });

  test("4.3 Capacity shear Ve inverse span sensitivity: shorter clear span ln induces higher capacity shear", () => {
    const spans = [6.0, 4.5, 3.0, 2.0];
    let prevVe = -1;

    for (const L of spans) {
      const res = designBeam({
        element: beam,
        LspanM: L,
        colWidthLeftM: 0.40,
        colWidthRightM: 0.40,
        MiTopKnm: 100.0,
        MiBotKnm: 50.0,
        MmidBotKnm: 70.0,
        MjTopKnm: 100.0,
        MjBotKnm: 50.0,
        VdyKn: 40.0,
        V2dKn: 40.0,
        concrete,
        rebar,
      });

      assert.ok(
        res.VeKn >= prevVe,
        `Shorter span L=${L}m (ln=${res.lnM}m) must produce larger or equal Ve (current ${res.VeKn} kN vs previous ${prevVe} kN)`
      );
      prevVe = res.VeKn;
    }
  });

  test("4.4 Confinement zone Vc = 0 suppression step function when seismic shear dominates", () => {
    // Case A: High seismic moment on short span -> Seismic shear strongly dominates
    const resSeismicDom = designBeam({
      element: beam,
      LspanM: 3.0,
      colWidthLeftM: 0.40,
      colWidthRightM: 0.40,
      MiTopKnm: 120.0,
      MiBotKnm: 60.0,
      MmidBotKnm: 80.0,
      MjTopKnm: 120.0,
      MjBotKnm: 60.0,
      VdyKn: 20.0, // Low gravity shear
      V2dKn: 40.0,
      concrete,
      rebar,
    });

    assert.equal(resSeismicDom.VcKn, 0.0, "Concrete shear contribution Vc must be 0 in confinement zone under seismic dominance");

    // Case B: Heavy gravity load on long span -> Gravity dominates
    const resGravityDom = designBeam({
      element: beam,
      LspanM: 8.0,
      colWidthLeftM: 0.40,
      colWidthRightM: 0.40,
      MiTopKnm: 40.0,
      MiBotKnm: 20.0,
      MmidBotKnm: 40.0,
      MjTopKnm: 40.0,
      MjBotKnm: 20.0,
      VdyKn: 180.0, // Very heavy gravity shear
      V2dKn: 180.0,
      concrete,
      rebar,
    });

    assert.ok(resGravityDom.VcKn > 0.0, `Concrete shear Vc (${resGravityDom.VcKn} kN) must be retained under gravity dominance`);
  });

  test("4.5 Web crushing failure limit: Vmax = min(0.85 bw d sqrt(fck), 0.22 fcd bw d)", () => {
    // Extremely high shear demand exceeding web crushing capacity
    const res = designBeam({
      element: beam,
      LspanM: 3.0,
      colWidthLeftM: 0.40,
      colWidthRightM: 0.40,
      MiTopKnm: 100.0,
      MiBotKnm: 50.0,
      MmidBotKnm: 50.0,
      MjTopKnm: 100.0,
      MjBotKnm: 50.0,
      VdyKn: 600.0,  // Exceeds Vmax
      V2dKn: 700.0,
      concrete,
      rebar,
    });

    assert.equal(res.shearPass, false, "Shear demand exceeding web crushing limit must fail");
    assert.equal(res.pass, false);
    assert.ok(res.statusText.includes("Kiriş kesme kapasitesi aşıldı"));
  });

  test("4.6 Beam capacity shear Ve exact scaling with (Mpi + Mpj) / ln", () => {
    // Hold moments fixed: Mri = 80 kNm -> Mpi = 112 kNm, Mrj = 80 kNm -> Mpj = 112 kNm
    // Sum Mpi + Mpj = 224 kNm
    // For clear span ln = 4.0 m: seismic shear = 224 / 4.0 = 56.0 kN
    // For clear span ln = 2.0 m: seismic shear = 224 / 2.0 = 112.0 kN
    const resL4 = designBeam({
      element: beam,
      LspanM: 4.80, // With two 0.40 m columns, ln = 4.80 - 0.40 = 4.40 m
      colWidthLeftM: 0.40,
      colWidthRightM: 0.40,
      MiTopKnm: 70.0,
      MiBotKnm: 35.0,
      MmidBotKnm: 50.0,
      MjTopKnm: 70.0,
      MjBotKnm: 35.0,
      VdyKn: 30.0,
      V2dKn: 30.0,
      concrete,
      rebar,
    });

    const resL2 = designBeam({
      element: beam,
      LspanM: 2.80, // With two 0.40 m columns, ln = 2.80 - 0.40 = 2.40 m
      colWidthLeftM: 0.40,
      colWidthRightM: 0.40,
      MiTopKnm: 70.0,
      MiBotKnm: 35.0,
      MmidBotKnm: 50.0,
      MjTopKnm: 70.0,
      MjBotKnm: 35.0,
      VdyKn: 30.0,
      V2dKn: 30.0,
      concrete,
      rebar,
    });

    // Ratio of seismic shears should equal inverse ratio of clear spans: ln1 / ln2
    const seismicShear1 = resL4.VeKn - 30.0;
    const seismicShear2 = resL2.VeKn - 30.0;
    const spanRatio = resL4.lnM / resL2.lnM; // 4.40 / 2.40 = 1.8333
    const shearRatio = seismicShear2 / seismicShear1;

    assert.ok(
      Math.abs(shearRatio - spanRatio) < 1e-3,
      `Seismic capacity shear must scale inversely with clear span: expected ${spanRatio.toFixed(3)}, got ${shearRatio.toFixed(3)}`
    );
  });
});

// ============================================================================
// SUITE 5: Full Building Model Integration & Adversarial Stress Tests
// ============================================================================
describe("Suite 5: Full Building Model Integration & Adversarial Stress Tests", () => {
  test("5.1 Standard demo building runs through complete pipeline with all checks populated", () => {
    const model = createDemoModel();
    const settings = DEFAULT_ANALYSIS_SETTINGS;
    const analysis = runStructuralAnalysis(model, settings);

    assert.ok(analysis.designResult, "designResult must be present on StructuralAnalysisResult");
    const dr = analysis.designResult;

    // Check members: columns (4), beams (4), walls (1)
    const colCount = model.elements.filter(e => e.type === "column").length;
    const beamCount = model.elements.filter(e => e.type === "beam").length;
    const wallCount = model.elements.filter(e => e.type === "wall").length;
    assert.equal(Object.keys(dr.memberChecks).length, colCount + beamCount + wallCount);

    // Check joints
    assert.equal(Object.keys(dr.joints).length, colCount);
    for (const joint of Object.values(dr.joints)) {
      assert.ok(typeof joint.isConfined === "boolean");
      assert.ok(joint.shearCapacityKn > 0);
      assert.ok(joint.shearDemandKn >= 10);
    }

    // Check strong column weak beam
    assert.equal(Object.keys(dr.columnBeamMoments).length, colCount);
    for (const sc of Object.values(dr.columnBeamMoments)) {
      assert.ok(sc.sumColumnMomentKnm > 0);
      assert.ok(sc.sumBeamMomentKnm > 0);
      assert.ok(sc.ratio > 0);
    }

    // Check summary notes
    assert.ok(dr.summary.summaryNotes.length >= 8);
    assert.ok(dr.summary.summaryNotes.some(n => n.includes("Kolon Eksenel Yük Limiti")));
    assert.ok(dr.summary.summaryNotes.some(n => n.includes("Kolon-Kiriş Birleşim Kesme Güvenliği")));
    assert.ok(dr.summary.summaryNotes.some(n => n.includes("Güçlü Kolon - Zayıf Kiriş")));
  });

  test("5.2 Adversarial stress: undersized column with oversized beams triggers joint and strong column failure", () => {
    const model = createEmptyModel();
    const floor1: Floor = { id: "f1", name: "Kat 1", elevation: 0, height: 3.0 };
    const floor2: Floor = { id: "f2", name: "Kat 2", elevation: 3.0, height: 3.0 };
    model.floors = [floor1, floor2];
    model.materials = [{ id: "concrete", name: "Beton" }];

    // Very tiny column: 25x25 cm
    const tinyCol: ColumnElement = {
      id: "col-tiny",
      name: "S_TINY",
      type: "column",
      floorId: "f1",
      layer: "Kolonlar",
      position: { x: 3.0, y: 3.0 },
      width: 0.25,
      depth: 0.25,
      height: 3.0,
      materialId: "concrete",
    };

    // Giant beams: 50x80 cm framing into tiny column
    const giantBeams: BeamElement[] = [
      {
        id: "b-g1",
        name: "K_GIANT1",
        type: "beam",
        floorId: "f1",
        layer: "Kirisler",
        start: { x: 0, y: 3.0 },
        end: { x: 3.0, y: 3.0 },
        width: 0.50,
        height: 0.80,
        materialId: "concrete",
      },
      {
        id: "b-g2",
        name: "K_GIANT2",
        type: "beam",
        floorId: "f1",
        layer: "Kirisler",
        start: { x: 3.0, y: 3.0 },
        end: { x: 6.0, y: 3.0 },
        width: 0.50,
        height: 0.80,
        materialId: "concrete",
      },
    ];

    model.elements = [tinyCol, ...giantBeams];

    // Intermediate storey test (has floor2 above)
    const upperCol: ColumnElement = {
      id: "col-tiny2",
      name: "S_TINY2",
      type: "column",
      floorId: "f2",
      layer: "Kolonlar",
      position: { x: 3.0, y: 3.0 },
      width: 0.25,
      depth: 0.25,
      height: 3.0,
      materialId: "concrete",
    };
    model.elements.push(upperCol);

    const res = runStructuralAnalysis(model, DEFAULT_ANALYSIS_SETTINGS);
    const dr = res.designResult!;

    // The joint or strong-column check on tiny column must catch this severe disproportion
    const colCheck = dr.memberChecks[tinyCol.id];
    assert.ok(colCheck, "Member check must exist for tiny column");
    const scCheck = dr.columnBeamMoments[tinyCol.id];
    assert.ok(scCheck, "Strong column check must exist");

    // Because beams are 50x80 cm and column is 25x25 cm, strong column ratio will fail
    assert.equal(scCheck.pass, false, "Disproportionate giant beam on tiny column must fail strong column check");
  });

  test("5.3 Symmetry invariant: symmetrical beam design produces identical support rebar and capacities", () => {
    const concrete = getConcreteProperties("C25");
    const rebar = getRebarProperties("B420C");
    const beamSym = createTestBeam({ width: 0.30, height: 0.50 });

    const beamDesign = designBeam({
      element: beamSym,
      LspanM: 6.0,
      colWidthLeftM: 0.40,
      colWidthRightM: 0.40,
      MiTopKnm: 120.0,
      MiBotKnm: 60.0,
      MmidBotKnm: 75.0,
      MjTopKnm: 120.0, // Identical to left
      MjBotKnm: 60.0,  // Identical to left
      VdyKn: 45.0,
      V2dKn: 50.0,
      concrete,
      rebar,
    });

    // Support i vs Support j symmetry
    assert.equal(
      beamDesign.stationI.AsTopMm2,
      beamDesign.stationJ.AsTopMm2,
      "Symmetric beam must have identical left/right top steel"
    );
    assert.equal(
      beamDesign.stationI.AsBotMm2,
      beamDesign.stationJ.AsBotMm2,
      "Symmetric beam must have identical left/right bottom steel"
    );
    assert.ok(
      Math.abs(beamDesign.stationI.MrTopKnm - beamDesign.stationJ.MrTopKnm) < 1e-4,
      "Symmetric beam must have identical left/right top moment capacity"
    );
    assert.equal(
      beamDesign.stationI.barTopText,
      beamDesign.stationJ.barTopText,
      "Symmetric beam must have identical left/right top rebar callout"
    );
    assert.equal(
      beamDesign.MpiKnm,
      beamDesign.MpjKnm,
      "Symmetric beam must have identical left/right plastic capacities Mpi == Mpj"
    );
  });
});
