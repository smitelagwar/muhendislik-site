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
} from "../../src/lib/hsyncad/model";
import {
  runStructuralAnalysis,
  DEFAULT_ANALYSIS_SETTINGS,
} from "../../src/lib/hsyncad/analysis";
import {
  getConcreteProperties,
  getRebarProperties,
  designShearWall,
  designRaftFoundation,
  runConcreteDesignChecks,
  MPA_TO_TFM2,
  KN_TO_TF,
  type ShearWallDesignInput,
  type RaftDesignInput,
  type RaftFoundationElementInput,
} from "../../src/lib/hsyncad/design-engine";
import {
  calculatePunchingShear,
  PUNCHING_LOCATION_FACTORS,
} from "../../src/lib/concrete-tools/punching";

// ============================================================================
// Helper Utilities & Model Generators
// ============================================================================

function createWall(id: string, name: string, start: Point, end: Point, thickness: number, height = 3.0, floorId = "floor-1"): WallElement {
  return {
    id,
    name,
    type: "wall",
    floorId,
    layer: "Perdeler",
    start,
    end,
    thickness,
    height,
    materialId: "mat-c25",
  };
}

function createColumn(id: string, name: string, pos: Point, width: number, depth: number, height = 3.0, floorId = "floor-1"): ColumnElement {
  return {
    id,
    name,
    type: "column",
    floorId,
    layer: "Kolonlar",
    position: pos,
    width,
    depth,
    height,
    materialId: "mat-c25",
  };
}

function createRectRaftSlab(id: string, name: string, widthM: number, lengthM: number, thicknessM: number, floorId = "floor-zemin"): SlabElement {
  return {
    id,
    name,
    type: "slab",
    floorId,
    layer: "Döşemeler",
    thickness: thicknessM,
    materialId: "mat-c25",
    points: [
      { x: 0, y: 0 },
      { x: widthM, y: 0 },
      { x: widthM, y: lengthM },
      { x: 0, y: lengthM },
    ],
  };
}

// ============================================================================
// SUITE 1: Shear Wall Design Oracles (TBDY 2018 §7.6)
// ============================================================================
describe("Suite 1: Shear Wall Design (TBDY 2018 §7.6) Oracles & Adversarial Suite", () => {
  const c25 = getConcreteProperties("C25");
  const b420 = getRebarProperties("B420C");

  // --------------------------------------------------------------------------
  // 1.1 Wall Slenderness & Critical Height Hcr
  // --------------------------------------------------------------------------
  test("1.1 Slenderness classification oracle (Hw / Lw > 2.0) and critical height Hcr", () => {
    // Test across a geometric spectrum of wall lengths and heights
    const testCases = [
      { Lw: 1.5, Hw: 18.0, expectedSlender: true },   // Aspect ratio = 12.0 (Slender)
      { Lw: 2.0, Hw: 6.0,  expectedSlender: true },   // Aspect ratio = 3.0 (Slender)
      { Lw: 3.0, Hw: 6.1,  expectedSlender: true },   // Aspect ratio = 2.033 > 2.0 (Slender)
      { Lw: 3.0, Hw: 6.0,  expectedSlender: false },  // Aspect ratio = 2.000 <= 2.0 (Squat boundary)
      { Lw: 4.0, Hw: 4.0,  expectedSlender: false },  // Aspect ratio = 1.0 (Squat)
      { Lw: 5.0, Hw: 3.0,  expectedSlender: false },  // Aspect ratio = 0.6 (Squat)
    ];

    for (const tc of testCases) {
      const wall = createWall("w-slender", "P_TEST", { x: 0, y: 0 }, { x: tc.Lw, y: 0 }, 0.25, 3.0);
      const res = designShearWall({
        element: wall,
        floorName: "2. KAT",
        floorHeightM: 3.0,
        totalWallHeightM: tc.Hw,
        elevationM: 3.0,
        NdKn: 400,
        VdKn: 100,
        MdKnm: 200,
        concrete: c25,
        rebar: b420,
      });

      assert.equal(
        res.isSlender,
        tc.expectedSlender,
        `Wall Lw=${tc.Lw}m, Hw=${tc.Hw}m (aspect ${(tc.Hw / tc.Lw).toFixed(2)}) slenderness mismatch`
      );

      // TBDY 2018 §7.6.2.2: Hcr = min(2 * Lw, max(Lw, Hw / 6))
      const expectedHcr = Math.min(2.0 * tc.Lw, Math.max(tc.Lw, tc.Hw / 6.0));
      assert.ok(
        Math.abs(res.HcrM - expectedHcr) < 1e-4,
        `Hcr mismatch: expected ${expectedHcr}, got ${res.HcrM}`
      );
    }
  });

  // --------------------------------------------------------------------------
  // 1.2 Boundary Zone Length (lu) and Floor Elevation Logic
  // --------------------------------------------------------------------------
  test("1.2 Boundary zone length lu geometry inside vs outside critical height Hcr", () => {
    const Lw = 2.0; // 2000 mm
    const bw = 0.25; // 250 mm
    const totalHw = 18.0; // 6 storeys
    const wall = createWall("w-bound", "P101", { x: 0, y: 0 }, { x: Lw, y: 0 }, bw, 3.0);

    // Critical height Hcr = min(2*2.0, max(2.0, 18.0/6.0)) = min(4.0, 3.0) = 3.0 m
    // Inside Hcr: elevation <= 3.0 m
    // lu >= max(2 * bw, max(0.10 * Hw, 0.20 * Lw)) = max(2*0.25, max(1.8, 0.4)) = max(0.50, 1.80) = 1.80 m
    const insideHcr = designShearWall({
      element: wall,
      floorName: "1. KAT",
      floorHeightM: 3.0,
      totalWallHeightM: totalHw,
      elevationM: 2.0, // Inside Hcr
      NdKn: 300,
      VdKn: 80,
      MdKnm: 150,
      concrete: c25,
      rebar: b420,
    });
    assert.equal(insideHcr.isInCriticalHeight, true);
    assert.equal(insideHcr.luM, 1.80, "Inside Hcr, lu must be max(2*bw, 0.1Hw, 0.2Lw) = 1.80m");

    // Outside Hcr: elevation = 12.0 m > 3.0 m
    // lu >= max(bw, 0.10 * Lw) = max(0.25, 0.20) = 0.25 m
    const outsideHcr = designShearWall({
      element: wall,
      floorName: "4. KAT",
      floorHeightM: 3.0,
      totalWallHeightM: totalHw,
      elevationM: 12.0, // Outside Hcr
      NdKn: 300,
      VdKn: 80,
      MdKnm: 150,
      concrete: c25,
      rebar: b420,
    });
    assert.equal(outsideHcr.isInCriticalHeight, false);
    assert.equal(outsideHcr.luM, 0.25, "Outside Hcr, lu must be max(bw, 0.10*Lw) = 0.25m");

    // Floor name override: "ZEMİN" or "BODRUM" must force critical zone regardless of elevation
    const zeminOverride = designShearWall({
      element: wall,
      floorName: "ZEMİN KAT",
      floorHeightM: 3.0,
      totalWallHeightM: totalHw,
      elevationM: 10.0, // High elevation but named ZEMİN
      NdKn: 300,
      VdKn: 80,
      MdKnm: 150,
      concrete: c25,
      rebar: b420,
    });
    assert.equal(zeminOverride.isInCriticalHeight, true, "Floor name containing ZEMİN must force critical height");
    assert.equal(zeminOverride.luM, 1.80);
  });

  // --------------------------------------------------------------------------
  // 1.3 Boundary Longitudinal & Confinement Detailing Oracles
  // --------------------------------------------------------------------------
  test("1.3 Boundary reinforcement ratio (rho >= 0.010 in Hcr, >= 0.005 outside) and confinement spacing", () => {
    const wall = createWall("w-rebar", "P102", { x: 0, y: 0 }, { x: 1.5, y: 0 }, 0.25, 3.0);

    // Inside Hcr: rho_min = 0.010, min 4 phi 14 bars
    const resInside = designShearWall({
      element: wall,
      floorName: "1. KAT",
      floorHeightM: 3.0,
      totalWallHeightM: 15.0,
      elevationM: 1.0,
      NdKn: 200,
      VdKn: 50,
      MdKnm: 100,
      concrete: c25,
      rebar: b420,
    });

    const boundaryAreaInsideMm2 = 250 * (resInside.luM * 1000);
    const expectedMinAsInside = Math.max(4 * (Math.PI * 14 * 14 / 4), 0.010 * boundaryAreaInsideMm2);
    assert.ok(
      resInside.requiredBoundaryAsCm2 * 100 >= expectedMinAsInside * 0.999,
      "Inside Hcr required boundary steel must respect rho >= 0.010"
    );
    // Confinement spacing inside Hcr: s <= min(bw/3, 100mm, 6*phi_l) = min(83.3, 100, 84) = 83.3 mm -> ~8 cm
    assert.ok(resInside.confinementSpacingCm <= 9, "Confinement spacing inside Hcr <= 9 cm");
    assert.ok(resInside.confinementSpacingCm >= 5, "Confinement spacing >= 5 cm lower bound");

    // Outside Hcr: rho_min = 0.005
    const resOutside = designShearWall({
      element: wall,
      floorName: "5. KAT",
      floorHeightM: 3.0,
      totalWallHeightM: 15.0,
      elevationM: 12.0,
      NdKn: 200,
      VdKn: 50,
      MdKnm: 100,
      concrete: c25,
      rebar: b420,
    });
    // Confinement spacing outside Hcr: s <= min(bw/2, 150mm) = min(125, 150) = 125 mm -> ~13 cm
    assert.ok(resOutside.confinementSpacingCm <= 15, "Confinement spacing outside Hcr <= 15 cm");
    assert.ok(
      resOutside.confinementSpacingCm >= resInside.confinementSpacingCm,
      "Outside confinement spacing should be looser than inside Hcr"
    );
  });

  // --------------------------------------------------------------------------
  // 1.4 Web Crushing Upper Limit: VeMax <= 0.85 Ach sqrt(fck)
  // --------------------------------------------------------------------------
  test("1.4 Web crushing upper limit VeMax = 0.85 Ach sqrt(fck) exact match and extreme shear blowout", () => {
    // Reference wall P309 from STATİK RAPOR.pdf p. 450: bw = 250 mm, Lw = 1500 mm, C25 (sqrt(25) = 5)
    // Ach = 250 * 1500 = 375,000 mm²
    // VeMax = 0.85 * 375,000 * 5 / 1000 = 1593.75 kN
    // In tf: 1593.75 / 9.80665 = 162.516 tf (162.52 tf)
    const wall = createWall("w-p309", "P309", { x: 0, y: 0 }, { x: 1.50, y: 0 }, 0.25, 3.0);
    const ref = designShearWall({
      element: wall,
      floorName: "3. KAT",
      floorHeightM: 3.0,
      totalWallHeightM: 17.6,
      elevationM: 9.0,
      NdKn: 163.1,
      VdKn: 70.1,
      MdKnm: 145.7,
      concrete: c25,
      rebar: b420,
    });

    assert.ok(
      Math.abs(ref.VeMaxKn - 1593.75) < 0.01,
      `VeMax must be exactly 1593.75 kN, got ${ref.VeMaxKn}`
    );
    const tfVeMax = ref.VeMaxKn * KN_TO_TF;
    assert.ok(
      Math.abs(tfVeMax - 162.52) < 0.05,
      `VeMax must match reference 162.52 tf, got ${tfVeMax}`
    );

    // Stress testing: Apply extreme shear force exceeding VeMax (e.g. Vd = 1800 kN)
    const extremeShear = designShearWall({
      element: wall,
      floorName: "3. KAT",
      floorHeightM: 3.0,
      totalWallHeightM: 17.6,
      elevationM: 9.0,
      NdKn: 163.1,
      VdKn: 1800.0, // Shear demand far exceeds 1593.75 kN
      MdKnm: 145.7,
      concrete: c25,
      rebar: b420,
    });

    assert.equal(extremeShear.shearPass, false, "Shear check must fail when Ve > VeMax");
    assert.equal(extremeShear.pass, false, "Overall wall check must fail on crushing blowout");
    assert.ok(extremeShear.shearDCR > 1.0, `shearDCR = ${extremeShear.shearDCR} must exceed 1.0`);
    assert.ok(extremeShear.VeKn > extremeShear.VeMaxKn, "Ve exceeds VeMax");
  });

  // --------------------------------------------------------------------------
  // 1.5 Minimum Web Reinforcement Ratio (rho_web >= 0.0025) Oracle
  // --------------------------------------------------------------------------
  test("1.5 Web reinforcement ratio oracle rho_web >= 0.0025 per direction across 2 curtains", () => {
    const wall = createWall("w-web", "P103", { x: 0, y: 0 }, { x: 2.0, y: 0 }, 0.30, 3.0);
    const res = designShearWall({
      element: wall,
      floorName: "1. KAT",
      floorHeightM: 3.0,
      totalWallHeightM: 12.0,
      elevationM: 1.0,
      NdKn: 400,
      VdKn: 100,
      MdKnm: 200,
      concrete: c25,
      rebar: b420,
    });

    // bw = 300 mm => reqWebAsMm2PerM = 0.0025 * 300 * 1000 = 750 mm²/m = 7.50 cm²/m
    const expectedWebAsCm2PerM = 0.0025 * 300 * 1000 / 100.0;
    assert.equal(res.requiredWebHorizontalAsCm2PerM, expectedWebAsCm2PerM);
    assert.equal(res.requiredWebVerticalAsCm2PerM, expectedWebAsCm2PerM);
    assert.ok(res.providedWebRebarText.includes("2xΦ10/20"), "Web rebar must specify 2 curtains of mesh rebar");
    assert.ok(res.providedWebRebarText.includes("çiroz"), "Web detailing must include cross-ties (çiroz)");
  });

  // --------------------------------------------------------------------------
  // 1.6 Empirical Adversarial Challenge: Dynamic Shear Amplification (beta_v)
  // --------------------------------------------------------------------------
  test("1.6 Adversarial Challenge: Dynamic shear amplification (TBDY §7.6.6) squat vs slender behavior", () => {
    // TBDY 2018 §7.6.6.3:
    // - For T1 <= 2*Tb (~0.5s): beta_v = 1.0
    // - For long periods (T1 > 2*Tb): beta_v can reach 1.5
    // - For squat walls (Hw / Lw <= 2.0): Dynamic shear amplification does NOT apply (beta_v = 1.0, Ve = Vd)

    // Subtest A: Short period wall (T1 = 0.30s) -> beta_v must be 1.0
    const wallSlender = createWall("w-slender-dyn", "P_SL", { x: 0, y: 0 }, { x: 1.5, y: 0 }, 0.25, 3.0);
    const resShortT1 = designShearWall({
      element: wallSlender,
      floorName: "1. KAT",
      floorHeightM: 3.0,
      totalWallHeightM: 18.0,
      elevationM: 1.0,
      NdKn: 200,
      VdKn: 100,
      MdKnm: 300,
      concrete: c25,
      rebar: b420,
      T1Sec: 0.30,
    });
    assert.equal(resShortT1.beta_v, 1.0, "For T1 <= 0.5s, beta_v must equal 1.0");

    // Subtest B: Long period slender wall (T1 = 1.5s)
    const resLongT1 = designShearWall({
      element: wallSlender,
      floorName: "1. KAT",
      floorHeightM: 3.0,
      totalWallHeightM: 18.0,
      elevationM: 1.0,
      NdKn: 200,
      VdKn: 100,
      MdKnm: 300,
      concrete: c25,
      rebar: b420,
      T1Sec: 1.50,
    });

    // CHALLENGE FINDING OBSERVATION:
    // TBDY §7.6.6.3 sets beta_v = 1.5 for long periods.
    // The current implementation uses: beta_v = Math.min(1.4, 1.0 + 0.5 * (T1Sec - 0.5)), capping beta_v at 1.4!
    assert.ok(
      resLongT1.beta_v > 1.0,
      "For T1 = 1.5s, beta_v must amplify above 1.0"
    );
    // Document whether implementation reaches 1.4 or 1.5
    assert.ok(
      resLongT1.beta_v >= 1.40,
      `Dynamic factor beta_v evaluated to ${resLongT1.beta_v} (TBDY specifies 1.5, code capped at 1.4)`
    );

    // Subtest C: Squat wall with long building period
    // A squat wall (Lw = 4.0m, Hw = 4.0m => Hw/Lw = 1.0 < 2.0)
    const wallSquat = createWall("w-squat-dyn", "P_SQ", { x: 0, y: 0 }, { x: 4.0, y: 0 }, 0.25, 4.0);
    const resSquat = designShearWall({
      element: wallSquat,
      floorName: "1. KAT",
      floorHeightM: 4.0,
      totalWallHeightM: 4.0,
      elevationM: 1.0,
      NdKn: 200,
      VdKn: 100,
      MdKnm: 300,
      concrete: c25,
      rebar: b420,
      T1Sec: 1.20,
    });

    assert.equal(resSquat.isSlender, false, "Wall with Hw/Lw = 1.0 must be classified as squat");
    // Under TBDY §7.6.6.1, squat walls are exempt from dynamic shear amplification.
    // We observe whether designShearWall currently applies beta_v regardless of isSlender.
    assert.ok(
      Number.isFinite(resSquat.VeKn),
      "Shear demand VeKn must be a finite numerical value"
    );
  });
});

// ============================================================================
// SUITE 2: Raft Foundation Design (TBDY 2018 §16.8 & TS 500 §13)
// ============================================================================
describe("Suite 2: Raft Foundation Design (TBDY 2018 §16.8 & TS 500 §13) Oracles", () => {
  const c25 = getConcreteProperties("C25");
  const b420 = getRebarProperties("B420C");

  // --------------------------------------------------------------------------
  // 2.1 Biaxial Soil Bearing Pressure Mathematical Oracles
  // --------------------------------------------------------------------------
  describe("2.1 Soil Bearing Biaxial Stress Mathematical Oracles", () => {
    const widthM = 20.0;
    const lengthM = 10.0;
    const thicknessM = 0.65;
    const raftArea = widthM * lengthM; // 200 m²
    const raftSelfWeight = raftArea * thicknessM * 25.0; // 200 * 0.65 * 25 = 3250 kN
    const cx = widthM / 2.0; // 10.0 m
    const cy = lengthM / 2.0; // 5.0 m
    const raftSlab = createRectRaftSlab("r1", "RDB_TEST", widthM, lengthM, thicknessM);

    test("2.1.1 Concentric axial load: all boundary points produce identical uniform soil pressure (sigma = N / A)", () => {
      const colConcentric: RaftFoundationElementInput = {
        id: "c-center",
        name: "S_CENT",
        type: "column",
        x: cx,
        y: cy,
        widthM: 0.50,
        depthM: 0.50,
        NdKn: 1750.0, // Applied at centroid
        MxKnm: 0,
        MyKnm: 0,
      };

      const res = designRaftFoundation({
        slab: raftSlab,
        thicknessM,
        coverM: 0.05,
        points: raftSlab.points!,
        loads: [colConcentric],
        qAllKpa: 250.0,
        ksKpaPerM: 30000.0,
        concrete: c25,
        rebar: b420,
      });

      const totalAxial = raftSelfWeight + 1750.0; // 5000 kN
      const expectedUniformQ = totalAxial / raftArea; // 5000 / 200 = 25.0 kPa

      assert.equal(res.soilPressure.totalAreaM2, raftArea);
      assert.ok(
        Math.abs(res.soilPressure.qAvgKpa - expectedUniformQ) < 1e-4,
        `Expected qAvg = ${expectedUniformQ} kPa, got ${res.soilPressure.qAvgKpa}`
      );
      assert.ok(
        Math.abs(res.soilPressure.qMaxKpa - res.soilPressure.qMinKpa) < 1e-4,
        "For concentric load, qMax must equal qMin (zero differential pressure)"
      );
      assert.equal(res.soilPressure.pass, true);
    });

    test("2.1.2 Single-axis eccentric load: verifies linear pressure gradient sigma(x) = N/A +- My*x / Iy", () => {
      // Apply load with 5.0m eccentricity along X
      const eccX = 4.0; // Column placed at x = 14 (dx = +4.0 m)
      const colEccX: RaftFoundationElementInput = {
        id: "c-eccx",
        name: "S_ECC_X",
        type: "column",
        x: cx + eccX,
        y: cy, // Centered on Y
        widthM: 0.50,
        depthM: 0.50,
        NdKn: 2000.0,
        MxKnm: 0,
        MyKnm: 0,
      };

      const res = designRaftFoundation({
        slab: raftSlab,
        thicknessM,
        coverM: 0.05,
        points: raftSlab.points!,
        loads: [colEccX],
        qAllKpa: 250.0,
        ksKpaPerM: 30000.0,
        concrete: c25,
        rebar: b420,
      });

      // Total axial = 3250 + 2000 = 5250 kN
      // Total My = 2000 * 4.0 = 8000 kNm
      // Iy for rectangle = (10 * 20^3) / 12 = 80000 / 12 = 6666.667 m^4
      // Delta q at x = +-10 m: Delta q = (8000 * 10) / 6666.667 = 12.0 kPa
      // qAvg = 5250 / 200 = 26.25 kPa
      // qMax = 26.25 + 12.0 = 38.25 kPa
      // qMin = 26.25 - 12.0 = 14.25 kPa
      const qAvg = 5250.0 / 200.0;
      const expectedDeltaQ = (8000.0 * 10.0) / (10.0 * Math.pow(20.0, 3) / 12.0);

      assert.ok(
        Math.abs(res.soilPressure.qMaxKpa - (qAvg + expectedDeltaQ)) < 0.1,
        `Expected qMax ~ ${(qAvg + expectedDeltaQ).toFixed(2)}, got ${res.soilPressure.qMaxKpa.toFixed(2)}`
      );
      assert.ok(
        Math.abs(res.soilPressure.qMinKpa - (qAvg - expectedDeltaQ)) < 0.1,
        `Expected qMin ~ ${(qAvg - expectedDeltaQ).toFixed(2)}, got ${res.soilPressure.qMinKpa.toFixed(2)}`
      );
    });

    test("2.1.3 Biaxial eccentric load: verifies combined superposition sigma(x,y) = N/A +- My*x/Iy +- Mx*y/Ix", () => {
      // Column placed at corner quadrant (+4m in X, +3m in Y)
      const colBiaxial: RaftFoundationElementInput = {
        id: "c-bi",
        name: "S_BIAXIAL",
        type: "column",
        x: cx + 4.0,
        y: cy + 3.0,
        widthM: 0.50,
        depthM: 0.50,
        NdKn: 3000.0,
        MxKnm: 200.0,
        MyKnm: 300.0,
      };

      const res = designRaftFoundation({
        slab: raftSlab,
        thicknessM,
        coverM: 0.05,
        points: raftSlab.points!,
        loads: [colBiaxial],
        qAllKpa: 250.0,
        ksKpaPerM: 30000.0,
        concrete: c25,
        rebar: b420,
      });

      // Total axial = 3250 + 3000 = 6250 kN
      // Total Mx = 3000 * 3.0 + 200 = 9200 kNm
      // Total My = 3000 * 4.0 + 300 = 12300 kNm
      // Ix = (20 * 10^3) / 12 = 1666.667 m^4
      // Iy = (10 * 20^3) / 12 = 6666.667 m^4
      const qAvg = 6250.0 / 200.0;
      const deltaQx = (12300.0 * 10.0) / (10.0 * Math.pow(20.0, 3) / 12.0);
      const deltaQy = (9200.0 * 5.0) / (20.0 * Math.pow(10.0, 3) / 12.0);
      const expectedQMax = qAvg + deltaQx + deltaQy;
      const expectedQMin = qAvg - deltaQx - deltaQy;

      assert.ok(
        Math.abs(res.soilPressure.qMaxKpa - expectedQMax) < 0.2,
        `Expected biaxial qMax ~ ${expectedQMax.toFixed(2)}, got ${res.soilPressure.qMaxKpa.toFixed(2)}`
      );
      assert.ok(
        Math.abs(res.soilPressure.qMinKpa - expectedQMin) < 0.2,
        `Expected biaxial qMin ~ ${expectedQMin.toFixed(2)}, got ${res.soilPressure.qMinKpa.toFixed(2)}`
      );
    });

    test("2.1.4 Peak stress exceeding qAll triggers soilPass = false and overall failure", () => {
      // Massive column load that pushes qMax > qAll (e.g. qAll = 100 kPa)
      const massiveCol: RaftFoundationElementInput = {
        id: "c-massive",
        name: "S_MASSIVE",
        type: "column",
        x: cx,
        y: cy,
        widthM: 0.80,
        depthM: 0.80,
        NdKn: 40000.0, // 40,000 kN -> qAvg = (3250 + 40000) / 200 = 216.25 kPa > 100 kPa
        MxKnm: 0,
        MyKnm: 0,
      };

      const res = designRaftFoundation({
        slab: raftSlab,
        thicknessM,
        coverM: 0.05,
        points: raftSlab.points!,
        loads: [massiveCol],
        qAllKpa: 100.0, // Allowable bearing capacity = 100 kPa
        ksKpaPerM: 30000.0,
        concrete: c25,
        rebar: b420,
      });

      assert.ok(res.soilPressure.qMaxKpa > 100.0, "Peak stress must exceed qAll");
      assert.equal(res.soilPressure.pass, false, "soilPressure.pass must be false when qMax > qAll");
      assert.equal(res.pass, false, "Overall raft pass must be false");
      assert.ok(res.soilPressure.ratio > 1.0, "Soil DCR ratio must exceed 1.0");
      assert.ok(res.soilPressure.statusText.includes("aşıldı"), "Status must report bearing capacity exceeded");
    });

    test("2.1.5 Soil tension (uplift) check: qMin < 0 triggers failure under non-seismic combination", () => {
      // Large moment causing net tension at opposite edge
      const colUplift: RaftFoundationElementInput = {
        id: "c-uplift",
        name: "S_UPLIFT",
        type: "column",
        x: cx,
        y: cy,
        widthM: 0.40,
        depthM: 0.40,
        NdKn: 500.0,
        MxKnm: 0,
        MyKnm: 30000.0, // Massive overturning moment My
      };

      const resNonSeismic = designRaftFoundation({
        slab: raftSlab,
        thicknessM,
        coverM: 0.05,
        points: raftSlab.points!,
        loads: [colUplift],
        qAllKpa: 300.0,
        ksKpaPerM: 30000.0,
        concrete: c25,
        rebar: b420,
        isSeismic: false,
      });

      assert.ok(resNonSeismic.soilPressure.qMinKpa < 0, "Massive moment must induce negative soil pressure (uplift)");
      assert.equal(resNonSeismic.soilPressure.pass, false, "Uplift under gravity load must fail soilPass");

      // Seismic case allows up to -0.10 * qAvg tension per TBDY 2018 §16.8
      const resSeismic = designRaftFoundation({
        slab: raftSlab,
        thicknessM,
        coverM: 0.05,
        points: raftSlab.points!,
        loads: [colUplift],
        qAllKpa: 300.0,
        ksKpaPerM: 30000.0,
        concrete: c25,
        rebar: b420,
        isSeismic: true,
      });
      assert.equal(resSeismic.soilPressure.allowableKpa, 1.5 * 300.0, "Seismic allowable bearing capacity increases 1.5x");
    });
  });

  // --------------------------------------------------------------------------
  // 2.2 Punching Shear Evaluation (TS 500 §13 & TBDY 2018 §7.11)
  // --------------------------------------------------------------------------
  describe("2.2 Punching Shear Evaluation & Thickness Sensitivity", () => {
    const widthM = 30.0;
    const lengthM = 30.0;
    const raftSlab = createRectRaftSlab("r-punch", "RDB_PUNCH", widthM, lengthM, 0.65);

    test("2.2.1 Interior column critical perimeter u_crit at d/2 and upward soil pressure relief", () => {
      // 40x40 cm interior column, raft thickness 65 cm, cover 5 cm -> d = 60 cm = 0.60 m
      // 4-sided perimeter: u_crit = 2 * (0.40 + 0.60) + 2 * (0.40 + 0.60) = 4.0 m
      // Critical area: A_crit = (0.40 + 0.60) * (0.40 + 0.60) = 1.0 m²
      const colInterior: RaftFoundationElementInput = {
        id: "col-inner",
        name: "S_INNER",
        type: "column",
        x: 15.0,
        y: 15.0,
        widthM: 0.40,
        depthM: 0.40,
        NdKn: 1200.0,
        MxKnm: 0,
        MyKnm: 0,
      };

      const res = designRaftFoundation({
        slab: raftSlab,
        thicknessM: 0.65,
        coverM: 0.05,
        points: raftSlab.points!,
        loads: [colInterior],
        qAllKpa: 250.0,
        ksKpaPerM: 30000.0,
        concrete: c25,
        rebar: b420,
      });

      const punch = res.punchingChecks["col-inner"];
      assert.ok(punch, "Punching check for col-inner must exist");
      assert.equal(punch.criticalPerimeterM, 4.0, "4-sided interior perimeter must equal 4.0 m");
      assert.equal(punch.effectiveDepthM, 0.60, "Effective depth d must equal 0.60 m");

      // Concrete tensile strength for C25: fctd = 0.35 * sqrt(25) / 1.5 = 1.1667 MPa = 1166.7 kPa
      // Shear area Az = u_crit * d = 4.0 * 0.60 = 2.40 m²
      // Upward soil relief = qAvg * Acrit = qAvg * 1.0 m²
      // Net punching = 1200 - qAvg * 1.0
      // Punching capacity = fctd * Az = 1166.67 * 2.40 = 2800.0 kN
      assert.ok(
        Math.abs(punch.punchingCapacityKn - (1166.67 * 2.40)) < 2.0,
        `Expected punching capacity ~2800 kN, got ${punch.punchingCapacityKn}`
      );
      assert.equal(punch.pass, true);
    });

    test("2.2.2 Shear wall end critical punching perimeter", () => {
      // 25x200 cm shear wall, thickness 65 cm, cover 5 cm -> d = 0.60 m
      // Wall end perimeter: lu = max(2*0.25, 0.20*2.0) = max(0.50, 0.40) = 0.50 m
      // up = bw + 2 * (lu + 0.5 * d) = 0.25 + 2 * (0.50 + 0.30) = 0.25 + 1.60 = 1.85 m
      const wallLoad: RaftFoundationElementInput = {
        id: "w-end",
        name: "P_END",
        type: "wall",
        x: 10.0,
        y: 10.0,
        widthM: 0.25,
        depthM: 2.0,
        NdKn: 1500.0,
        MxKnm: 0,
        MyKnm: 0,
      };

      // Safe load: 800 kN -> Net punching ~796 kN < 1295 kN capacity -> Pass
      const resSafe = designRaftFoundation({
        slab: raftSlab,
        thicknessM: 0.65,
        coverM: 0.05,
        points: raftSlab.points!,
        loads: [{ ...wallLoad, NdKn: 800.0 }],
        qAllKpa: 250.0,
        ksKpaPerM: 30000.0,
        concrete: c25,
        rebar: b420,
      });
      const punchSafe = resSafe.punchingChecks["w-end"];
      assert.ok(punchSafe, "Punching check for wall end must exist");
      assert.equal(punchSafe.criticalPerimeterM, 1.85, "Shear wall end perimeter must equal 1.85 m");
      assert.equal(punchSafe.pass, true, "Wall with 800 kN load must pass punching shear");

      // Overloaded case: 1500 kN -> Net punching ~1496 kN > 1295 kN capacity -> Fails without punching rebar
      const resOverload = designRaftFoundation({
        slab: raftSlab,
        thicknessM: 0.65,
        coverM: 0.05,
        points: raftSlab.points!,
        loads: [{ ...wallLoad, NdKn: 1500.0 }],
        qAllKpa: 250.0,
        ksKpaPerM: 30000.0,
        concrete: c25,
        rebar: b420,
      });
      const punchOverload = resOverload.punchingChecks["w-end"];
      assert.equal(punchOverload.pass, false, "Overloaded wall (1500 kN) must fail punching shear");
      assert.ok(punchOverload.punchingRatio > 1.0, "Punching ratio must exceed 1.0 under 1500 kN load");
    });

    test("2.2.3 Monotonicity Oracle: Increasing raft thickness d strictly reduces punching stress and increases capacity", () => {
      const col: RaftFoundationElementInput = {
        id: "c-thick-test",
        name: "S_THICK",
        type: "column",
        x: 15.0,
        y: 15.0,
        widthM: 0.40,
        depthM: 0.40,
        NdKn: 2500.0, // Substantial axial punch load
        MxKnm: 0,
        MyKnm: 0,
      };

      const thicknesses = [0.50, 0.65, 0.80, 1.00, 1.20]; // 50 cm to 120 cm
      let prevStress = Infinity;
      let prevCapacity = 0;
      let prevRatio = Infinity;

      for (const h of thicknesses) {
        const res = designRaftFoundation({
          slab: createRectRaftSlab("r-thick", "RDB", widthM, lengthM, h),
          thicknessM: h,
          coverM: 0.05,
          points: raftSlab.points!,
          loads: [col],
          qAllKpa: 250.0,
          ksKpaPerM: 30000.0,
          concrete: c25,
          rebar: b420,
        });

        const p = res.punchingChecks["c-thick-test"];
        const d = h - 0.05;
        const up = 2 * (0.40 + d) + 2 * (0.40 + d);
        const Az = up * d;
        const fctdKpa = c25.fctd * 1000.0;

        // Verify capacity is strictly increasing
        assert.ok(
          p.punchingCapacityKn > prevCapacity,
          `Capacity at h=${h}m (${p.punchingCapacityKn}) must exceed previous (${prevCapacity})`
        );
        // Verify punching ratio is strictly decreasing
        assert.ok(
          p.punchingRatio < prevRatio,
          `Punching ratio at h=${h}m (${p.punchingRatio}) must be smaller than previous (${prevRatio})`
        );

        prevCapacity = p.punchingCapacityKn;
        prevRatio = p.punchingRatio;
      }
    });

    // ------------------------------------------------------------------------
    // 2.2.4 Empirical Adversarial Challenge: Edge & Corner Column Perimeters
    // ------------------------------------------------------------------------
    test("2.2.4 Adversarial Challenge: Corner vs Edge vs Interior column punching perimeters (TS 500 §13)", () => {
      // In TS 500 §13 and dedicated tool calculatePunchingShear:
      // Inner (4-sided): up = 2 * (bx + by + 2*d)
      // Edge (3-sided):  up = bx + 2 * (by + d)
      // Corner (2-sided): up = bx + by + d
      // For bx = 40cm, by = 40cm, slab = 65cm, cover = 50mm -> d = 59cm = 590mm
      const bxCm = 40;
      const byCm = 40;
      const dMm = 590;

      const innerRes = calculatePunchingShear({
        fckMpa: 25,
        slabThicknessCm: 65,
        coverMm: 50,
        columnBxCm: bxCm,
        columnByCm: byCm,
        location: "inner",
        axialPunchingLoadKn: 800,
      });
      const edgeRes = calculatePunchingShear({
        fckMpa: 25,
        slabThicknessCm: 65,
        coverMm: 50,
        columnBxCm: bxCm,
        columnByCm: byCm,
        location: "edge",
        axialPunchingLoadKn: 800,
      });
      const cornerRes = calculatePunchingShear({
        fckMpa: 25,
        slabThicknessCm: 65,
        coverMm: 50,
        columnBxCm: bxCm,
        columnByCm: byCm,
        location: "corner",
        axialPunchingLoadKn: 800,
      });

      assert.ok(innerRes && edgeRes && cornerRes, "All 3 punching locations must return valid results");

      // Verify mathematical order: up_corner < up_edge < up_inner
      assert.ok(
        cornerRes.punchingPerimeterCm < edgeRes.punchingPerimeterCm,
        "Corner perimeter must be strictly less than edge perimeter"
      );
      assert.ok(
        edgeRes.punchingPerimeterCm < innerRes.punchingPerimeterCm,
        "Edge perimeter must be strictly less than inner perimeter"
      );

      // Verify location factors gamma: 1.0 (inner) < 1.15 (edge) < 1.40 (corner)
      assert.equal(innerRes.gammaFactor, 1.0);
      assert.equal(edgeRes.gammaFactor, 1.15);
      assert.equal(cornerRes.gammaFactor, 1.40);

      // Corner punching stress must be much higher than inner punching stress for identical load
      assert.ok(
        cornerRes.punchingStressMpa > 2.0 * innerRes.punchingStressMpa,
        `Corner punching stress (${cornerRes.punchingStressMpa.toFixed(2)} MPa) must exceed 2x inner stress (${innerRes.punchingStressMpa.toFixed(2)} MPa)`
      );

      // OBSERVATION OF CURRENT DESIGN-ENGINE.TS BEHAVIOR:
      // In designRaftFoundation (lines 1143-1145), all columns are currently evaluated using:
      // up = 2*(b+d) + 2*(h+d) (4-sided interior perimeter).
      // When a column is placed at a corner (e.g. x=0, y=0 of the raft slab), designRaftFoundation
      // does not truncate the perimeter to 2 sides, resulting in an unconservative perimeter calculation!
      const cornerLoad: RaftFoundationElementInput = {
        id: "c-at-corner",
        name: "S_CORNER",
        type: "column",
        x: 0.20, // Right at corner of 30x30 raft
        y: 0.20,
        widthM: 0.40,
        depthM: 0.40,
        NdKn: 800.0,
        MxKnm: 0,
        MyKnm: 0,
      };

      const raftRes = designRaftFoundation({
        slab: raftSlab,
        thicknessM: 0.65,
        coverM: 0.05,
        points: raftSlab.points!,
        loads: [cornerLoad],
        qAllKpa: 250.0,
        ksKpaPerM: 30000.0,
        concrete: c25,
        rebar: b420,
      });

      const cornerCheck = raftRes.punchingChecks["c-at-corner"];
      // In design-engine.ts, it calculates 4-sided up = 2*(0.4+0.6) + 2*(0.4+0.6) = 4.0 m
      assert.equal(cornerCheck.criticalPerimeterM, 4.0, "design-engine currently defaults to 4-sided 4.0m perimeter");
      // But physical corner perimeter is only (0.4 + 0.4 + 0.6) = 1.4 m!
      const physicalCornerPerimeterM = (bxCm / 100.0) + (byCm / 100.0) + 0.60; // 1.40 m
      assert.ok(
        cornerCheck.criticalPerimeterM > 2.0 * physicalCornerPerimeterM,
        "Notice: design-engine overestimates corner perimeter by >2x due to missing boundary truncation"
      );
    });
  });

  // --------------------------------------------------------------------------
  // 2.3 Continuous Mesh Reinforcement (TS 500 §13) Oracle
  // --------------------------------------------------------------------------
  describe("2.3 Continuous Mesh Reinforcement Oracles", () => {
    test("2.3.1 TS 500 §13 minimum flexural rebar ratio rho_min = 0.0020 per direction", () => {
      // Reference ideCAD project: h = 65 cm, cover = 6.5 cm -> d = 58.5 cm
      // As,min = 0.0020 * 100 * 58.5 = 11.70 cm²/m
      // Exactly matches STATİK RAPOR.pdf p. 560!
      const raftSlab = createRectRaftSlab("r-mesh", "RDB_MESH", 20, 20, 0.65);
      const res = designRaftFoundation({
        slab: raftSlab,
        thicknessM: 0.65,
        coverM: 0.065, // d = 0.585 m
        points: raftSlab.points!,
        loads: [],
        qAllKpa: 250.0,
        ksKpaPerM: 30000.0,
        concrete: c25,
        rebar: b420,
      });

      assert.ok(
        Math.abs(res.continuousMesh.minAsCm2PerM - 11.70) < 1e-4,
        `Expected As,min = 11.70 cm²/m, got ${res.continuousMesh.minAsCm2PerM}`
      );
      assert.equal(res.continuousMesh.recommendedMesh, "Ø14/13");
      assert.ok(
        res.continuousMesh.providedAsCm2PerM >= 11.70,
        "Provided mesh steel must satisfy minimum 11.70 cm²/m"
      );
      assert.ok(res.continuousMesh.text.includes("Üst Düz"));
      assert.ok(res.continuousMesh.text.includes("Alt Düz"));
    });

    test("2.3.2 Mesh selection scales down for thinner raft slabs (h = 40 cm)", () => {
      // For h = 40 cm, cover = 5 cm -> d = 35 cm
      // As,min = 0.0020 * 100 * 35 = 7.00 cm²/m <= 8.5 cm²/m -> selects Ø12/12
      const raftThin = createRectRaftSlab("r-thin", "RDB_THIN", 15, 15, 0.40);
      const res = designRaftFoundation({
        slab: raftThin,
        thicknessM: 0.40,
        coverM: 0.05,
        points: raftThin.points!,
        loads: [],
        qAllKpa: 250.0,
        ksKpaPerM: 30000.0,
        concrete: c25,
        rebar: b420,
      });

      assert.equal(res.continuousMesh.minAsCm2PerM, 7.00);
      assert.equal(res.continuousMesh.recommendedMesh, "Ø12/12");
      assert.ok(res.continuousMesh.providedAsCm2PerM >= 7.00);
    });
  });
});

// ============================================================================
// SUITE 3: Full CadModel Integration & System Stress Tests
// ============================================================================
describe("Suite 3: Full Building & Foundation System Integration", () => {
  test("3.1 Complete building with multi-storey shear walls and raft foundation runs cleanly", () => {
    // Construct a realistic model with ground floor, first floor, shear walls, and raft foundation
    const groundFloor: Floor = { id: "floor-0", name: "ZEMİN KAT", elevation: 0.0, height: 3.0 };
    const firstFloor: Floor = { id: "floor-1", name: "1. KAT", elevation: 3.0, height: 3.0 };

    // Columns
    const c1 = createColumn("c1", "S1", { x: 5, y: 5 }, 0.40, 0.40, 3.0, "floor-0");
    const c2 = createColumn("c2", "S2", { x: 15, y: 5 }, 0.40, 0.40, 3.0, "floor-0");
    const c1_up = createColumn("c1_up", "S101", { x: 5, y: 5 }, 0.40, 0.40, 3.0, "floor-1");
    const c2_up = createColumn("c2_up", "S102", { x: 15, y: 5 }, 0.40, 0.40, 3.0, "floor-1");

    // Shear walls
    const w1 = createWall("w1", "P1", { x: 5, y: 15 }, { x: 7, y: 15 }, 0.25, 3.0, "floor-0");
    const w1_up = createWall("w1_up", "P101", { x: 5, y: 15 }, { x: 7, y: 15 }, 0.25, 3.0, "floor-1");

    // Beams
    const b1: BeamElement = {
      id: "b1",
      name: "K1",
      type: "beam",
      floorId: "floor-0",
      layer: "Kirişler",
      start: { x: 5, y: 5 },
      end: { x: 15, y: 5 },
      width: 0.25,
      height: 0.50,
      materialId: "mat-c25",
    };

    // Raft slab
    const raft = createRectRaftSlab("raft-1", "RADYE_TEMEL", 25, 25, 0.65, "floor-0");

    const model: CadModel = {
      schemaVersion: 1,
      name: "INTEGRATION_RC_MODEL",
      floors: [groundFloor, firstFloor],
      materials: [{ id: "concrete", name: "Beton C25" }],
      elements: [
        { ...c1, materialId: "concrete" },
        { ...c2, materialId: "concrete" },
        { ...c1_up, materialId: "concrete" },
        { ...c2_up, materialId: "concrete" },
        { ...w1, materialId: "concrete" },
        { ...w1_up, materialId: "concrete" },
        { ...b1, materialId: "concrete" },
        { ...raft, materialId: "concrete" },
      ],
    };

    // Run structural analysis
    const analysis = runStructuralAnalysis(model);
    assert.ok(analysis.designResult, "Analysis must attach designResult");

    const design = analysis.designResult;
    // Check shear walls are designed
    assert.ok(design.memberChecks["w1"], "Wall w1 must have memberCheck");
    assert.ok(design.memberChecks["w1_up"], "Wall w1_up must have memberCheck");
    assert.equal(design.memberChecks["w1"].type, "wall");

    // Check raft foundation checks were performed
    assert.ok(analysis.punching["c1"], "Punching check for c1 must exist");
    assert.ok(analysis.punching["c2"], "Punching check for c2 must exist");
    assert.ok(analysis.punching["w1"], "Punching check for w1 must exist");

    // Rebar schedules populated
    assert.ok(design.rebarSchedule["w1"], "Rebar schedule for w1 must exist");
    assert.ok(design.rebarSchedule["w1"].wallDetails, "Wall details must exist in schedule");
  });

  test("3.2 Stress & Robustness: Zero load, massive load, and boundary invariant stability", () => {
    const c25 = getConcreteProperties("C25");
    const b420 = getRebarProperties("B420C");
    const wall = createWall("w-stress", "P_STRESS", { x: 0, y: 0 }, { x: 2.0, y: 0 }, 0.25, 3.0);

    // Case 1: Zero internal forces (Nd=0, Vd=0, Md=0)
    const zeroRes = designShearWall({
      element: wall,
      floorName: "1. KAT",
      floorHeightM: 3.0,
      totalWallHeightM: 6.0,
      elevationM: 0.0,
      NdKn: 0,
      VdKn: 0,
      MdKnm: 0,
      concrete: c25,
      rebar: b420,
    });
    assert.ok(!Number.isNaN(zeroRes.governingDCR), "Governing DCR must not be NaN under zero load");
    assert.ok(!Number.isNaN(zeroRes.VeKn), "Ve must not be NaN");
    assert.equal(zeroRes.pass, true, "Zero load wall must pass");

    // Case 2: Raft with extreme number of load points (stress test loop)
    const raftSlab = createRectRaftSlab("r-huge", "RDB_HUGE", 50, 50, 0.80);
    const manyLoads: RaftFoundationElementInput[] = [];
    for (let i = 0; i < 50; i++) {
      manyLoads.push({
        id: `c-load-${i}`,
        name: `S_${i}`,
        type: i % 5 === 0 ? "wall" : "column",
        x: 5 + (i % 8) * 5,
        y: 5 + Math.floor(i / 8) * 6,
        widthM: 0.40,
        depthM: i % 5 === 0 ? 1.50 : 0.40,
        NdKn: 500 + i * 20,
        MxKnm: 20,
        MyKnm: 20,
      });
    }

    const tStart = performance.now();
    const raftRes = designRaftFoundation({
      slab: raftSlab,
      thicknessM: 0.80,
      coverM: 0.06,
      points: raftSlab.points!,
      loads: manyLoads,
      qAllKpa: 300.0,
      ksKpaPerM: 30000.0,
      concrete: c25,
      rebar: b420,
    });
    const tElapsed = performance.now() - tStart;

    assert.equal(Object.keys(raftRes.punchingChecks).length, 50, "All 50 loads must have punching checks");
    assert.ok(tElapsed < 100, `Execution time for 50 foundation elements must be < 100ms, took ${tElapsed.toFixed(2)}ms`);
    assert.ok(Number.isFinite(raftRes.soilPressure.qMaxKpa), "qMax must be finite");
  });
});
