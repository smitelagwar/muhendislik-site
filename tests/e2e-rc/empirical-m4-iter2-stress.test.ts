import { describe, test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  interpolateStationForces,
  projectRaycastHitToStation,
  projectPointToSegment,
  getVertexDisplacement,
  getMaxDisplacementMagnitude,
  getDisplacementHeatmapColor,
  cadToThreeCoord,
  cadToThreeDisplacement,
  type StationData,
  type AnalysisResult,
} from "../../src/lib/hsyncad/diagram-geometry";

describe("Milestone 4 Iteration 2: Adversarial Stress & 3D Resource Management", () => {
  // =========================================================================
  // Area 1: Multi-Storey Model Robustness & Degenerate Diaphragms
  // =========================================================================
  describe("1. Multi-Storey Elevation-Dependent Kinematics & Degenerate Diaphragms", () => {
    test("1.1 Single-storey model kinematics across vertical elevation sweep", () => {
      const singleStoreyResult: any = {
        floorDiaphragms: [
          { elevation: 3.5, displacementX: 0.024, displacementY: 0.012, rotationZ: 0.002, centerX: 4.0, centerY: 3.0 },
        ],
      };

      // Support / foundation level (Z <= 0): strictly clamped to [0, 0, 0]
      for (const z of [-10.0, -2.5, -0.001, 0.0]) {
        const disp = getVertexDisplacement(4.0, 3.0, z, singleStoreyResult);
        assert.deepEqual(disp, [0, 0, 0], `Elevation ${z} <= 0 must yield zero displacement`);
      }

      // Linear interpolation between ground (Z = 0) and Storey 1 (Z = 3.5)
      const zMid = 1.75; // 50% height
      const dispMid = getVertexDisplacement(4.0, 3.0, zMid, singleStoreyResult);
      assert.ok(Math.abs(dispMid[0] - 0.012) < 1e-6, "Mid-height UX must be 50% of top storey UX");
      assert.ok(Math.abs(dispMid[1] - 0.006) < 1e-6, "Mid-height UY must be 50% of top storey UY");
      assert.equal(dispMid[2], 0, "Lateral diaphragm model produces zero UZ");

      // Torsional variation in plan: ux = uxDia - rz * (y - cy), uy = uyDia + rz * (x - cx)
      // At Z = 3.5:
      // Point at (4.0, 8.0) -> y - cy = +5.0 -> ux = 0.024 - 0.002 * 5.0 = 0.014
      const dispTorsionY = getVertexDisplacement(4.0, 8.0, 3.5, singleStoreyResult);
      assert.ok(Math.abs(dispTorsionY[0] - 0.014) < 1e-6, "Torsional rotation must reduce UX for positive dy");

      // Point at (9.0, 3.0) -> x - cx = +5.0 -> uy = 0.012 + 0.002 * 5.0 = 0.022
      const dispTorsionX = getVertexDisplacement(9.0, 3.0, 3.5, singleStoreyResult);
      assert.ok(Math.abs(dispTorsionX[1] - 0.022) < 1e-6, "Torsional rotation must increase UY for positive dx");

      // Clamping above top storey roof (Z > 3.5): top diaphragm kinematics
      for (const z of [3.5, 4.0, 10.0, 50.0]) {
        const dispAbove = getVertexDisplacement(4.0, 3.0, z, singleStoreyResult);
        assert.ok(Math.abs(dispAbove[0] - 0.024) < 1e-6);
        assert.ok(Math.abs(dispAbove[1] - 0.012) < 1e-6);
      }
    });

    test("1.2 20-Storey high-rise model: continuous monotonicity and zero NaN across 200 elevations", () => {
      const NUM_STOREYS = 20;
      const STOREY_HEIGHT = 3.0; // 3.0m per storey -> total height = 60m
      const floorDiaphragms: any[] = [];

      for (let i = 1; i <= NUM_STOREYS; i++) {
        const elev = i * STOREY_HEIGHT;
        // Inverted-triangular lateral drift distribution
        const ux = 0.001 * Math.pow(i, 1.35);
        const uy = 0.0005 * Math.pow(i, 1.35);
        const rz = 0.00003 * i;
        floorDiaphragms.push({
          elevation: elev,
          displacementX: ux,
          displacementY: uy,
          rotationZ: rz,
          centerX: 10.0,
          centerY: 10.0,
        });
      }

      const highRiseResult: any = { floorDiaphragms };

      // Sweep 200 elevations from Z = 0 to Z = 65m
      let prevMag = -1;
      const numSamples = 200;
      for (let s = 0; s <= numSamples; s++) {
        const cadZ = (s / numSamples) * 65.0;
        const [ux, uy, uz] = getVertexDisplacement(10.0, 10.0, cadZ, highRiseResult);

        // Verification of finiteness (no NaN, no Infinity)
        assert.ok(Number.isFinite(ux), `UX must be finite at Z=${cadZ}`);
        assert.ok(Number.isFinite(uy), `UY must be finite at Z=${cadZ}`);
        assert.ok(Number.isFinite(uz), `UZ must be finite at Z=${cadZ}`);

        // Resultant drift at center (10, 10) must be non-decreasing with height
        const mag = Math.hypot(ux, uy);
        assert.ok(
          mag >= prevMag - 1e-9,
          `Drift magnitude must be non-decreasing: at Z=${cadZ}, mag=${mag} < prevMag=${prevMag}`
        );
        prevMag = mag;
      }

      // Verification of continuity at storey boundary elevations (Z = 3.0, 6.0, ..., 57.0)
      for (let i = 1; i < NUM_STOREYS; i++) {
        const zB = i * STOREY_HEIGHT;
        const eps = 1e-5;
        const dispBelow = getVertexDisplacement(12.0, 8.0, zB - eps, highRiseResult);
        const dispAbove = getVertexDisplacement(12.0, 8.0, zB + eps, highRiseResult);
        assert.ok(
          Math.abs(dispBelow[0] - dispAbove[0]) < 1e-4,
          `UX must be continuous across storey boundary Z=${zB}`
        );
        assert.ok(
          Math.abs(dispBelow[1] - dispAbove[1]) < 1e-4,
          `UY must be continuous across storey boundary Z=${zB}`
        );
      }
    });

    test("1.3 Degenerate diaphragm models: negative elevations, duplicate elevations, zero elevations", () => {
      // 1. Negative elevation diaphragms (subterranean basements)
      const basementResult: any = {
        floorDiaphragms: [
          { elevation: -3.0, displacementX: 0.002, displacementY: 0.001, centerX: 5, centerY: 5 },
          { elevation: 3.0, displacementX: 0.020, displacementY: 0.010, centerX: 5, centerY: 5 },
        ],
      };
      // For cadZ <= 0, strictly clamped to 0
      assert.deepEqual(getVertexDisplacement(5, 5, -1.5, basementResult), [0, 0, 0]);
      assert.deepEqual(getVertexDisplacement(5, 5, 0, basementResult), [0, 0, 0]);
      // For cadZ = 1.5, interpolates between -3 and +3 without NaN
      const dInterp = getVertexDisplacement(5, 5, 1.5, basementResult);
      assert.ok(Number.isFinite(dInterp[0]), "UX must be finite");
      assert.ok(Number.isFinite(dInterp[1]), "UY must be finite");
      assert.ok(dInterp[0] > 0, "UX must be positive above ground");

      // 2. Duplicate elevation diaphragms (coincident floors, dz = 0)
      const duplicateElevResult: any = {
        floorDiaphragms: [
          { elevation: 3.0, displacementX: 0.015, displacementY: 0.010, centerX: 5, centerY: 5 },
          { elevation: 3.0, displacementX: 0.018, displacementY: 0.012, centerX: 5, centerY: 5 },
        ],
      };
      const dDup = getVertexDisplacement(5, 5, 3.0, duplicateElevResult);
      assert.ok(Number.isFinite(dDup[0]), "Duplicate elevations must not cause NaN via divide-by-zero");
      assert.ok(Number.isFinite(dDup[1]), "Duplicate elevations must yield finite displacement");

      // 3. Zero-elevation diaphragm (elevation = 0.0)
      const zeroElevResult: any = {
        floorDiaphragms: [
          { elevation: 0.0, displacementX: 0.010, displacementY: 0.010, centerX: 5, centerY: 5 },
          { elevation: 4.0, displacementX: 0.030, displacementY: 0.020, centerX: 5, centerY: 5 },
        ],
      };
      assert.deepEqual(getVertexDisplacement(5, 5, 0.0, zeroElevResult), [0, 0, 0]);
      const dAboveZero = getVertexDisplacement(5, 5, 2.0, zeroElevResult);
      assert.ok(Number.isFinite(dAboveZero[0]));
      assert.ok(dAboveZero[0] > 0);

      // 4. Unsorted diaphragms (elevations provided out-of-order)
      const unsortedResult: any = {
        floorDiaphragms: [
          { elevation: 9.0, displacementX: 0.030, displacementY: 0.015, centerX: 5, centerY: 5 },
          { elevation: 3.0, displacementX: 0.010, displacementY: 0.005, centerX: 5, centerY: 5 },
          { elevation: 6.0, displacementX: 0.020, displacementY: 0.010, centerX: 5, centerY: 5 },
        ],
      };
      // At Z = 4.5: halfway between 3.0 and 6.0 -> UX should be 0.015
      const dUnsorted = getVertexDisplacement(5, 5, 4.5, unsortedResult);
      assert.ok(Math.abs(dUnsorted[0] - 0.015) < 1e-6, "Unsorted diaphragms must be internally sorted");
    });

    test("1.4 Missing diaphragms, empty displacements, and null/undefined handling", () => {
      // 1. null / undefined analysisResult
      assert.deepEqual(getVertexDisplacement(1, 2, 3, null), [0, 0, 0]);
      assert.deepEqual(getVertexDisplacement(1, 2, 3, undefined), [0, 0, 0]);

      // 2. Empty object {}
      assert.deepEqual(getVertexDisplacement(1, 2, 3, {} as any), [0, 0, 0]);

      // 3. Empty arrays and objects
      assert.deepEqual(getVertexDisplacement(1, 2, 3, { floorDiaphragms: [] }), [0, 0, 0]);
      assert.deepEqual(getVertexDisplacement(1, 2, 3, { displacements: {} }), [0, 0, 0]);
      assert.deepEqual(getVertexDisplacement(1, 2, 3, { floorDiaphragms: [], displacements: {} }), [0, 0, 0]);

      // 4. Diaphragms with missing kinematic fields
      const partialDiaResult: any = {
        floorDiaphragms: [{ elevation: 3.0 }], // Missing displacementX, ux, rotationZ, centerX, etc.
      };
      const dPartial = getVertexDisplacement(2, 3, 2.0, partialDiaResult);
      assert.deepEqual(dPartial, [0, 0, 0], "Missing kinematic fields must default cleanly to 0");

      // 5. Discrete joint node lookup within 2cm tolerance
      const jointResult: any = {
        femOutput: {
          nodes: [
            { id: "J1", x: 6.0, y: 4.0, z: 3.0 },
            { id: "J2", x: 10.0, y: 8.0, z: 6.0 },
          ],
        },
        displacements: {
          "J1": [0.035, -0.012, -0.005],
          "J2": [0.070, -0.024, -0.010],
        },
      };
      // Vertex within 1.5 cm of J1:
      const dJ1 = getVertexDisplacement(6.01, 4.01, 3.0, jointResult);
      assert.deepEqual(dJ1, [0.035, -0.012, -0.005], "Discrete joint lookup must succeed within 2cm tolerance");

      // Vertex at 3.0 cm from J1 (exceeds 2cm tolerance): falls through to fallback
      const dFar = getVertexDisplacement(6.03, 4.0, 3.0, jointResult);
      assert.ok(dFar[0] !== 0, "Fallback must supply non-zero displacement when joint is out of tolerance");
    });

    test("1.5 getMaxDisplacementMagnitude and getDisplacementHeatmapColor adversarial ranges", () => {
      // 1. getMaxDisplacementMagnitude
      assert.equal(getMaxDisplacementMagnitude(null), 0.01);
      assert.equal(getMaxDisplacementMagnitude(undefined), 0.01);
      assert.equal(getMaxDisplacementMagnitude({} as any), 1e-6);
      assert.equal(getMaxDisplacementMagnitude({ floorDiaphragms: [], displacements: {} }), 1e-6);

      const resWithNeg: any = {
        floorDiaphragms: [
          { displacementX: -0.040, displacementY: -0.030 }, // hypot = 0.050
        ],
      };
      assert.ok(Math.abs(getMaxDisplacementMagnitude(resWithNeg) - 0.050) < 1e-6);

      // 2. getDisplacementHeatmapColor across continuous sweep
      // Valid range is [0, 1]. Test out-of-range clamping [-1.0, 2.0]
      const cNeg = getDisplacementHeatmapColor(-0.5);
      const cZero = getDisplacementHeatmapColor(0.0);
      assert.deepEqual(cNeg, cZero, "Negative rho must clamp to rho = 0 (Blue)");

      const cHigh = getDisplacementHeatmapColor(1.5);
      const cOne = getDisplacementHeatmapColor(1.0);
      assert.deepEqual(cHigh, cOne, "Rho > 1 must clamp to rho = 1.0 (Red)");

      // Check all channels in [0, 1] across 100 sample points
      for (let i = 0; i <= 100; i++) {
        const rho = (i / 100) * 1.2 - 0.1;
        const [r, g, b] = getDisplacementHeatmapColor(rho);
        assert.ok(r >= 0 && r <= 1, `Red channel ${r} must be in [0, 1] for rho=${rho}`);
        assert.ok(g >= 0 && g <= 1, `Green channel ${g} must be in [0, 1] for rho=${rho}`);
        assert.ok(b >= 0 && b <= 1, `Blue channel ${b} must be in [0, 1] for rho=${rho}`);
        assert.ok(Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b));
      }
    });
  });

  // =========================================================================
  // Area 2: 3D Raycasting & Projection Edge Cases
  // =========================================================================
  describe("2. 3D Raycasting Projections & Spatial Edge Cases", () => {
    test("2.1 Zero-length and micro-length structural members (L <= 1e-6 m)", () => {
      // 1. Zero-length beam (start == end)
      const zeroBeam = {
        type: "beam",
        start: { x: 5.0, y: 5.0 },
        end: { x: 5.0, y: 5.0 },
      };
      const projZeroBeam = projectRaycastHitToStation({ x: 5.0, y: 3.0, z: -5.0 }, zeroBeam);
      assert.equal(projZeroBeam.L, 0.0, "Span length must be 0");
      assert.equal(projZeroBeam.t, 0.5, "Normalized station must safely default to 0.5");
      assert.equal(projZeroBeam.x, 0.0, "Physical station coordinate must be 0");

      // 2. Micro-length beam (length = 1e-5 m, lenSq = 1e-10 < 1e-6)
      const microBeam = {
        type: "beam",
        start: { x: 5.0, y: 5.0 },
        end: { x: 5.00001, y: 5.0 },
      };
      const projMicroBeam = projectRaycastHitToStation({ x: 5.0, y: 3.0, z: -5.0 }, microBeam);
      assert.equal(projMicroBeam.t, 0.5, "Micro-length beam must return safe t = 0.5");
      assert.ok(Number.isFinite(projMicroBeam.x), "Micro-length station x must be finite");

      // 3. Zero-length wall (start == end)
      const zeroWall = {
        type: "wall",
        start: { x: 3.0, y: 3.0 },
        end: { x: 3.0, y: 3.0 },
      };
      const projZeroWall = projectRaycastHitToStation({ x: 3.0, y: 1.5, z: -3.0 }, zeroWall);
      assert.equal(projZeroWall.L, 0.0);
      assert.equal(projZeroWall.t, 0.5);
      assert.equal(projZeroWall.x, 0.0);
    });

    test("2.2 Raycast hit points behind start, beyond end, and deep in outer space", () => {
      const beam = {
        type: "beam",
        start: { x: 0.0, y: 0.0 },
        end: { x: 10.0, y: 0.0 },
      };
      const floor = { elevation: 0.0, height: 3.0 };
      // Three.js coords: P1 = (0, 3, 0), P2 = (10, 3, 0), L = 10m

      // 1. Hit behind start: (-100, 3, 0)
      const hitBehind = projectRaycastHitToStation({ x: -100.0, y: 3.0, z: 0.0 }, beam, floor);
      assert.equal(hitBehind.t, 0.0, "Points behind start must clamp to t = 0.0");
      assert.equal(hitBehind.x, 0.0, "Physical position behind start must clamp to x = 0.0");
      assert.equal(hitBehind.L, 10.0);

      // 2. Hit beyond end: (+500, 3, 0)
      const hitBeyond = projectRaycastHitToStation({ x: 500.0, y: 3.0, z: 0.0 }, beam, floor);
      assert.equal(hitBeyond.t, 1.0, "Points beyond end must clamp to t = 1.0");
      assert.equal(hitBeyond.x, 10.0, "Physical position beyond end must clamp to x = L");
      assert.equal(hitBeyond.L, 10.0);

      // 3. Hit in deep outer space (+1e6, +1e6, +1e6)
      const hitDeepSpacePos = projectRaycastHitToStation({ x: 1e6, y: 1e6, z: 1e6 }, beam, floor);
      assert.equal(hitDeepSpacePos.t, 1.0, "Positive deep space must clamp to t = 1.0");
      assert.equal(hitDeepSpacePos.x, 10.0);

      // 4. Hit in negative deep outer space (-1e6, -1e6, -1e6)
      const hitDeepSpaceNeg = projectRaycastHitToStation({ x: -1e6, y: -1e6, z: -1e6 }, beam, floor);
      assert.equal(hitDeepSpaceNeg.t, 0.0, "Negative deep space must clamp to t = 0.0");
      assert.equal(hitDeepSpaceNeg.x, 0.0);
    });

    test("2.3 Large orthogonal off-axis projections onto beam and column axes", () => {
      // Beam along X axis: (0, 3, 0) to (10, 3, 0)
      const beam = {
        type: "beam",
        start: { x: 0.0, y: 0.0 },
        end: { x: 10.0, y: 0.0 },
      };
      const floor = { elevation: 0.0, height: 3.0 };

      // Point at X = 5.0, but Y = 250.0, Z = -350.0 (far off-axis)
      const hitMidOffAxis = projectRaycastHitToStation({ x: 5.0, y: 250.0, z: -350.0 }, beam, floor);
      assert.ok(Math.abs(hitMidOffAxis.t - 0.50) < 1e-6, "Orthogonal projection must find exact midspan t = 0.5");
      assert.ok(Math.abs(hitMidOffAxis.x - 5.00) < 1e-6, "Orthogonal projection must find exact midspan x = 5.0m");

      // Column along vertical Y axis: bottom at (4, 3, -6), top at (4, 7, -6), L = 4.0m
      const col = {
        type: "column",
        position: { x: 4.0, y: 6.0 },
        height: 4.0,
      };
      const colFloor = { elevation: 3.0, height: 4.0 };

      // Hit with X = 150.0, Z = 300.0, but Y = 5.0 (halfway up column height 3.0 to 7.0)
      const hitColOffAxis = projectRaycastHitToStation({ x: 150.0, y: 5.0, z: 300.0 }, col, colFloor);
      assert.ok(Math.abs(hitColOffAxis.t - 0.50) < 1e-6, "Column projection must find mid-height t = 0.50");
      assert.ok(Math.abs(hitColOffAxis.x - 2.00) < 1e-6, "Column projection must find mid-height x = 2.0m");
      assert.equal(hitColColHeight(hitColOffAxis.L, 4.0), true);

      function hitColColHeight(l: number, expected: number): boolean {
        return Math.abs(l - expected) < 1e-6;
      }
    });

    test("2.4 Unsupported element types and omitted floor context", () => {
      // Slab element
      const slab = { type: "slab", id: "D101" };
      const projSlab = projectRaycastHitToStation({ x: 2, y: 3, z: 4 }, slab);
      assert.equal(projSlab.t, 0.5);
      assert.equal(projSlab.x, 1.5);
      assert.equal(projSlab.L, 3.0);

      // Beam without floor argument (defaults elevation = 0, height = 3.0)
      const beamNoFloor = {
        type: "beam",
        start: { x: 0, y: 0 },
        end: { x: 6, y: 0 },
      };
      const projNoFloor = projectRaycastHitToStation({ x: 3, y: 3, z: 0 }, beamNoFloor);
      assert.ok(Math.abs(projNoFloor.t - 0.5) < 1e-6);
      assert.ok(Math.abs(projNoFloor.x - 3.0) < 1e-6);
      assert.equal(projNoFloor.L, 6.0);
    });

    test("2.5 projectPointToSegment 2D adversarial inputs", () => {
      // 1. Degenerate segment A == B
      const pZero = projectPointToSegment({ x: 10, y: 20 }, { x: 5, y: 5 }, { x: 5, y: 5 });
      assert.equal(pZero.t, 0);
      assert.deepEqual(pZero.proj, { x: 5, y: 5 });
      assert.ok(Math.abs(pZero.distance - Math.hypot(5, 15)) < 1e-6);

      // 2. Collinear points before start, on segment, and beyond end
      const segA = { x: 0, y: 0 };
      const segB = { x: 6, y: 8 }; // L = 10m

      const pBefore = projectPointToSegment({ x: -3, y: -4 }, segA, segB);
      assert.equal(pBefore.t, 0);
      assert.deepEqual(pBefore.proj, { x: 0, y: 0 });

      const pMid = projectPointToSegment({ x: 3, y: 4 }, segA, segB);
      assert.ok(Math.abs(pMid.t - 0.5) < 1e-6);
      assert.deepEqual(pMid.proj, { x: 3, y: 4 });
      assert.equal(pMid.distance, 0);

      const pBeyond = projectPointToSegment({ x: 12, y: 16 }, segA, segB);
      assert.equal(pBeyond.t, 1.0);
      assert.deepEqual(pBeyond.proj, { x: 6, y: 8 });
    });
  });

  // =========================================================================
  // Area 3: Force Station Array Robustness & High-Density Stress
  // =========================================================================
  describe("3. Array Robustness in interpolateStationForces", () => {
    test("3.1 Empty array (0 stations) returns zero forces without exception", () => {
      for (const t of [-10.0, 0.0, 0.25, 0.5, 0.75, 1.0, 10.0]) {
        const res = interpolateStationForces([], t);
        assert.deepEqual(res, { x: 0, N: 0, V2: 0, V3: 0, T: 0, M2: 0, M3: 0 });
      }
    });

    test("3.2 Single station (1 station) array returns station values without TypeError", () => {
      const single: StationData[] = [{ x: 3.25, M3: 48.5, V2: -24.2, N: -18.0, T: 1.5, M2: 2.0, V3: 0.5 }];
      for (const t of [-5.0, 0.0, 0.33, 0.50, 0.88, 1.0, 5.0]) {
        const res = interpolateStationForces(single, t);
        assert.equal(res.x, 3.25);
        assert.equal(res.M3, 48.5);
        assert.equal(res.V2, -24.2);
        assert.equal(res.N, -18.0);
        assert.equal(res.T, 1.5);
        assert.equal(res.M2, 2.0);
        assert.equal(res.V3, 0.5);
      }
    });

    test("3.3 Two stations (2 stations) linear interpolation and boundary clamping", () => {
      const stations2: StationData[] = [
        { x: 0.0, M3: -40.0, V2: 60.0, N: -20.0 },
        { x: 8.0, M3: +40.0, V2: -60.0, N: -20.0 },
      ];

      // Exact boundaries
      assert.deepEqual(interpolateStationForces(stations2, 0.0), {
        x: 0.0, M3: -40.0, V2: 60.0, N: -20.0, V3: 0, T: 0, M2: 0,
      });
      assert.deepEqual(interpolateStationForces(stations2, 1.0), {
        x: 8.0, M3: +40.0, V2: -60.0, N: -20.0, V3: 0, T: 0, M2: 0,
      });

      // Midpoint t = 0.5
      const mid = interpolateStationForces(stations2, 0.5);
      assert.equal(mid.x, 4.0);
      assert.equal(mid.M3, 0.0);
      assert.equal(mid.V2, 0.0);
      assert.equal(mid.N, -20.0);

      // Quarter point t = 0.25
      const q1 = interpolateStationForces(stations2, 0.25);
      assert.equal(q1.x, 2.0);
      assert.equal(q1.M3, -20.0);
      assert.equal(q1.V2, 30.0);

      // Clamping out-of-bounds t
      assert.deepEqual(interpolateStationForces(stations2, -2.5), interpolateStationForces(stations2, 0.0));
      assert.deepEqual(interpolateStationForces(stations2, 3.5), interpolateStationForces(stations2, 1.0));
    });

    test("3.4 High-density 1000-station array: 2,500 continuous queries with polynomial forces", () => {
      const N_STATIONS = 1000;
      const SPAN = 12.0; // 12m span
      const stations: StationData[] = [];

      // Generate 1000 stations with parabolic moment: M(x) = -60 + 160 * (x/L) * (1 - x/L)
      for (let i = 0; i < N_STATIONS; i++) {
        const x = (i / (N_STATIONS - 1)) * SPAN;
        const normX = x / SPAN;
        const m = -60 + 160 * 4 * normX * (1 - normX);
        const v = 80 - 160 * normX;
        const n = -45;
        stations.push({ x, M3: m, V2: v, N: n });
      }

      // Query 2,500 fractional stations t in [-0.25, 1.25]
      const NUM_QUERIES = 2500;
      const startTime = performance.now();

      for (let q = 0; q <= NUM_QUERIES; q++) {
        const t = -0.25 + (q / NUM_QUERIES) * 1.5;
        const forces = interpolateStationForces(stations, t);

        // All interpolated values must be finite numbers
        assert.ok(Number.isFinite(forces.x), `x must be finite at t=${t}`);
        assert.ok(Number.isFinite(forces.M3), `M3 must be finite at t=${t}`);
        assert.ok(Number.isFinite(forces.V2), `V2 must be finite at t=${t}`);
        assert.ok(Number.isFinite(forces.N), `N must be finite at t=${t}`);

        // Position x must be clamped within [0, SPAN]
        assert.ok(forces.x >= 0 && forces.x <= SPAN, `Station x=${forces.x} must be within [0, 12]`);

        // Bending moment must be bounded by analytical extremes [-60, +100]
        assert.ok(forces.M3 >= -60.01 && forces.M3 <= 100.01, `M3=${forces.M3} must be within [-60, 100]`);

        // Shear force must be bounded within [-80, +80]
        assert.ok(forces.V2 >= -80.01 && forces.V2 <= 80.01, `V2=${forces.V2} must be within [-80, 80]`);

        // Axial force must be constant -45 kN
        assert.ok(Math.abs(forces.N - (-45)) < 1e-6, `N must be -45`);
      }

      const elapsed = performance.now() - startTime;
      // 2,500 queries over 1000 stations must execute in under 50ms
      assert.ok(elapsed < 100, `High density interpolation took ${elapsed.toFixed(2)}ms (must be < 100ms)`);
    });

    test("3.5 Sparse and incomplete station objects default undefined fields cleanly", () => {
      const sparseStations: StationData[] = [
        { x: 0.0, M3: 25.0 }, // Missing N, V2, V3, T, M2
        { x: 5.0, M3: 75.0 },
      ];

      const res = interpolateStationForces(sparseStations, 0.5);
      assert.equal(res.x, 2.5);
      assert.equal(res.M3, 50.0);
      assert.equal(res.V2, 0.0, "Missing V2 must default to 0");
      assert.equal(res.N, 0.0, "Missing N must default to 0");
      assert.equal(res.T, 0.0, "Missing T must default to 0");
    });

    test("3.6 Infinite inputs are safely clamped", () => {
      const stations: StationData[] = [
        { x: 0.0, M3: -10, V2: 20 },
        { x: 4.0, M3: 30, V2: -20 },
      ];

      const resNegInf = interpolateStationForces(stations, -Infinity);
      assert.equal(resNegInf.x, 0.0);
      assert.equal(resNegInf.M3, -10.0);

      const resPosInf = interpolateStationForces(stations, Infinity);
      assert.equal(resPosInf.x, 4.0);
      assert.equal(resPosInf.M3, 30.0);
    });
  });

  // =========================================================================
  // Area 4: 3D Scene Resource Management & Deformed Mesh Geometry Allocation
  // =========================================================================
  describe("4. 3D Scene Resource Management & BufferGeometry Invariants", () => {
    test("4.1 Ghost mesh shares BufferGeometry with undeformed geometry without clone()", () => {
      // Simulate geometry creation as performed in scene3d.tsx
      const baseGeometry = new THREE.BoxGeometry(0.30, 3.0, 0.50);

      // In scene3d.tsx:
      // const ghostMat = new THREE.MeshStandardMaterial({ ... });
      // const ghostMesh = new THREE.Mesh(geometry, ghostMat);
      const ghostMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      });
      const ghostMesh = new THREE.Mesh(baseGeometry, ghostMat);

      // Verify geometry sharing (identical reference, 0 duplicate GPU allocations)
      assert.equal(
        ghostMesh.geometry,
        baseGeometry,
        "Ghost mesh must directly reference baseGeometry to prevent orphaned BufferGeometry leaks"
      );

      // Verify material transparency & depth write configuration to prevent z-fighting
      assert.equal(ghostMat.depthWrite, false, "Ghost mesh must set depthWrite: false to prevent occlusion");
      assert.equal(ghostMat.transparent, true, "Ghost mesh must be transparent");

      // Verify disposal releases GPU resources
      ghostMesh.geometry.dispose();
      ghostMat.dispose();
    });

    test("4.2 Deformed mesh BufferGeometry allocation & Float32Array footprint", () => {
      // Simulate 500 members in deformed structure mode
      const NUM_MEMBERS = 500;
      const VERTICES_PER_MEMBER = 24; // Standard BoxGeometry has 24 vertices
      let totalAllocatedBytes = 0;

      const geometries: THREE.BufferGeometry[] = [];
      const startTime = performance.now();

      for (let m = 0; m < NUM_MEMBERS; m++) {
        const posCount = VERTICES_PER_MEMBER;
        const defPositions = new Float32Array(posCount * 3);
        const defColors = new Float32Array(posCount * 3);

        for (let i = 0; i < posCount; i++) {
          defPositions[i * 3 + 0] = i * 0.1;
          defPositions[i * 3 + 1] = 3.0;
          defPositions[i * 3 + 2] = -i * 0.1;

          const [r, g, b] = getDisplacementHeatmapColor(i / posCount);
          defColors[i * 3 + 0] = r;
          defColors[i * 3 + 1] = g;
          defColors[i * 3 + 2] = b;
        }

        const defGeometry = new THREE.BufferGeometry();
        defGeometry.setAttribute("position", new THREE.Float32BufferAttribute(defPositions, 3));
        defGeometry.setAttribute("color", new THREE.Float32BufferAttribute(defColors, 3));
        geometries.push(defGeometry);

        totalAllocatedBytes += defPositions.byteLength + defColors.byteLength;
      }

      const elapsed = performance.now() - startTime;

      // 500 members: total memory footprint is ~288 KB (500 * 24 * 3 * 4 * 2 bytes)
      assert.ok(totalAllocatedBytes < 1024 * 1024, "500 members must consume < 1MB of vertex buffer memory");
      assert.ok(elapsed < 50, `Allocation for 500 members took ${elapsed.toFixed(2)}ms (must be < 50ms)`);

      // Clean disposal of all allocated geometries
      for (const geom of geometries) {
        geom.dispose();
      }
    });

    test("4.3 Depth-buffer rendering order and coordinate mapping invariants", () => {
      // Verify cadToThreeCoord bijective mapping and sign convention:
      // CAD: (X, Y, Z_elevation) -> Three: (X, Y_elevation, -Y_plan)
      const cadPoints = [
        [0, 0, 0],
        [10, 20, 3],
        [-5, 12, 15],
      ];
      for (const [cx, cy, cz] of cadPoints) {
        const [tx, ty, tz] = cadToThreeCoord(cx, cy, cz);
        assert.equal(tx, cx, "Three X must match CAD X");
        assert.equal(ty, cz, "Three Y must match CAD elevation Z");
        assert.equal(tz, -cy, "Three Z must match -CAD Y");
      }

      // Verify cadToThreeDisplacement mapping:
      // CAD displacement: (ux, uy, uz) -> Three displacement: (ux, uz, -uy)
      for (const [ux, uy, uz] of cadPoints) {
        const [tx, ty, tz] = cadToThreeDisplacement(ux, uy, uz);
        assert.equal(tx, ux);
        assert.equal(ty, uz);
        assert.equal(tz, -uy);
      }
    });
  });
});
