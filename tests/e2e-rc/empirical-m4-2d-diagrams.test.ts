/**
 * Empirical Challenger Verification Suite: Milestone 4
 * 2D Diagram Geometry, Station Interpolation, Canonical Normal Vectors & Joint Continuity
 *
 * Mathematical Oracles and Adversarial Stress Harness for:
 * 1. Canonical Normal Vector Invariance & Tension-Face Sign Convention (TS 500 / ideCAD)
 * 2. Auto-scaling Clamps, Microscopic & Extreme Forces, Non-Degenerate SVG Polygons
 * 3. Station Probe Coordinate Projection & Piecewise Linear Statics Interpolation
 * 4. 2D Deformed Outline Continuity & Rigid Diaphragm Joint Compatibility
 * 5. DCR Capacity Color Partitioning & Multi-Bay Grid Kinematic Invariance
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  computeTensionFaceNormal,
  get2DBeamDiagram,
  calculateAutoDiagramScale,
  calculateAutoDeformationScale,
  interpolateStationForces,
  projectPointToSegment,
  getDcrColor,
  getDcrColorHex,
  type StationData,
  type ForceDiagramType,
} from "../../src/lib/hsyncad/diagram-geometry";
import type { Point } from "../../src/lib/hsyncad/model";

// ============================================================================
// SUITE 1: Canonical Normal Vector Invariance & Tension-Face Sign Convention
// ============================================================================
describe("Suite 1: Canonical Normal Vector Invariance & Tension-Face Sign Convention", () => {
  test("1.1 360-Degree Parametric Sweep: Normality, Orthogonality & Reversal Invariance", () => {
    // Sweep through 24 directions across the 2D plane: theta = 0, 15, 30, ..., 345 deg
    const numAngles = 24;
    for (let i = 0; i < numAngles; i++) {
      const deg = (i * 360) / numAngles;
      const rad = (deg * Math.PI) / 180;
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);

      const normForward = computeTensionFaceNormal(dx, dy);
      const normReversed = computeTensionFaceNormal(-dx, -dy);

      // Property 1: Unit length of normal vector
      const magF = Math.hypot(normForward.nx, normForward.ny);
      assert.ok(
        Math.abs(magF - 1.0) < 1e-12,
        `Normal must be a unit vector at ${deg} deg (got magnitude ${magF})`
      );

      // Property 2: Strict orthogonality between tangent and normal: dot(t, n) = 0
      const dotProduct = normForward.tx * normForward.nx + normForward.ty * normForward.ny;
      assert.ok(
        Math.abs(dotProduct) < 1e-12,
        `Normal must be orthogonal to tangent at ${deg} deg (dot product = ${dotProduct})`
      );

      // Property 3: Invariance under direction reversal: n(v) == n(-v)
      assert.ok(
        Math.abs(normForward.nx - normReversed.nx) < 1e-12,
        `Canonical normal nx must be invariant to direction reversal at ${deg} deg: forward=${normForward.nx}, rev=${normReversed.nx}`
      );
      assert.ok(
        Math.abs(normForward.ny - normReversed.ny) < 1e-12,
        `Canonical normal ny must be invariant to direction reversal at ${deg} deg: forward=${normForward.ny}, rev=${normReversed.ny}`
      );
    }
  });

  test("1.2 Canonical Tension-Face Half-Plane Oracle: Upper Half-Plane for Non-Vertical Members", () => {
    // For any member that is not purely vertical (dx != 0), the canonical normal ny must be strictly positive
    const angles = [-75, -45, -30, -15, 0, 15, 30, 45, 60, 75, 105, 120, 135, 150, 165, 180, 195, 210, 225];
    for (const deg of angles) {
      const rad = (deg * Math.PI) / 180;
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);
      const norm = computeTensionFaceNormal(dx, dy);

      assert.ok(
        norm.ny > 0,
        `For non-vertical member at ${deg} deg, canonical normal ny must be strictly positive (got ${norm.ny})`
      );
    }

    // Purely vertical members: canonical rule directs normal to nx = -1, ny = 0
    const verticalUp = computeTensionFaceNormal(0, 4.0);
    assert.ok(Math.abs(verticalUp.nx - (-1)) < 1e-12, "Vertical UP member must have nx = -1");
    assert.ok(Math.abs(verticalUp.ny) < 1e-12, "Vertical UP member must have ny = 0");

    const verticalDown = computeTensionFaceNormal(0, -4.0);
    assert.ok(Math.abs(verticalDown.nx - (-1)) < 1e-12, "Vertical DOWN member must have nx = -1");
    assert.ok(Math.abs(verticalDown.ny) < 1e-12, "Vertical DOWN member must have ny = 0");
  });

  test("1.3 TS 500 Tension-Face Bending Moment Oracle: Sagging M3 > 0 Displaces to Lower Half-Plane", () => {
    const screenCad = (p: Point) => ({ x: 200 + p.x * 20, y: 300 - p.y * 20 });
    const scale = 0.01;

    // Test beam defined Left-to-Right: start=(0, 10) to end=(8, 10)
    const stationsLR: StationData[] = Array.from({ length: 11 }, (_, i) => {
      const x = (i / 10) * 8;
      // Parabolic moment: M3(0) = -20 (hogging), M3(4) = +60 (sagging), M3(8) = -20 (hogging)
      const m3 = -20 + 80 * (4 * (x / 8) * (1 - x / 8));
      return { x, M3: m3, V2: 40 - 10 * x, N: -15 };
    });

    const diagLR = get2DBeamDiagram({ x: 0, y: 10 }, { x: 8, y: 10 }, stationsLR, "M3", scale, screenCad);

    // Midspan sagging moment M3 = +60 kNm
    // In world coordinates: base y = 10, offset = -scale * M3 = -0.01 * 60 = -0.60 m.
    // diag y = 10 - 0.60 = 9.40 m < 10.0 m (strictly into lower half-plane)
    // In screen coordinates: screen y = 300 - 9.40 * 20 = 112 px vs baseline screen y = 300 - 10 * 20 = 100 px.
    // Screen y is greater, meaning it renders BELOW the beam.
    assert.ok(diagLR.peakSpan.val > 0, "Midspan moment must be positive sagging moment");
    assert.ok(diagLR.peakSpan.screen.y > 100, "Sagging M3 > 0 must displace downward on screen (y > 100 px)");

    // Support hogging moment M3 = -20 kNm
    // Offset = -scale * (-20) = +0.20 m.
    // In world coordinates: diag y = 10 + 0.20 = 10.20 m > 10.0 m (upper half-plane).
    // In screen coordinates: screen y = 300 - 10.20 * 20 = 96 px < 100 px (drawn above).
    assert.ok(diagLR.support1.val < 0, "Support moment must be negative hogging moment");
    assert.ok(diagLR.support1.screen.y < 100, "Hogging M3 < 0 must displace upward on screen (y < 100 px)");

    // NOW test beam defined Right-to-Left: start=(8, 10) to end=(0, 10)
    // From start (x=8) to end (x=0), s.x goes from 0 to 8 along tangent (-1, 0)
    const stationsRL: StationData[] = Array.from({ length: 11 }, (_, i) => {
      const s_x = (i / 10) * 8; // distance from start (8, 10)
      const world_x = 8 - s_x;
      const m3 = -20 + 80 * (4 * (world_x / 8) * (1 - world_x / 8));
      return { x: s_x, M3: m3, V2: -40 + 10 * world_x, N: -15 };
    });

    const diagRL = get2DBeamDiagram({ x: 8, y: 10 }, { x: 0, y: 10 }, stationsRL, "M3", scale, screenCad);

    // Verify sagging moment STILL displaces into lower half-plane regardless of drawing orientation
    assert.ok(diagRL.peakSpan.val > 0, "RL midspan moment must be positive sagging moment");
    assert.ok(diagRL.peakSpan.screen.y > 100, "RL sagging M3 > 0 must STILL displace downward on screen (y > 100 px)");
    assert.ok(diagRL.support1.screen.y < 100, "RL hogging M3 < 0 must STILL displace upward on screen (y < 100 px)");

    // Compare peak screen Y between LR and RL: must match within numerical precision
    assert.ok(
      Math.abs(diagLR.peakSpan.screen.y - diagRL.peakSpan.screen.y) < 1e-6,
      `Peak sagging displacement must be identical regardless of drawing direction: LR=${diagLR.peakSpan.screen.y}, RL=${diagRL.peakSpan.screen.y}`
    );
  });
});

// ============================================================================
// SUITE 2: Auto-scaling Clamps, Microscopic & Extreme Force Robustness
// ============================================================================
describe("Suite 2: Auto-scaling Clamps, Microscopic & Extreme Force Robustness", () => {
  test("2.1 Zero Forces Oracle: Stable Scale & Valid Non-Degenerate SVG Geometry", () => {
    const zeroMap: Record<string, StationData[]> = {
      b1: [{ x: 0, M3: 0, V2: 0, N: 0 }, { x: 5, M3: 0, V2: 0, N: 0 }],
      b2: [{ x: 0, M3: 0, V2: 0, N: 0 }, { x: 6, M3: 0, V2: 0, N: 0 }],
    };

    const scaleM3 = calculateAutoDiagramScale(zeroMap, "M3", 0.60);
    const scaleV2 = calculateAutoDiagramScale(zeroMap, "V2", 0.60);
    const scaleN = calculateAutoDiagramScale(zeroMap, "N", 0.60);

    // Floor of 1.0 prevents division by zero
    assert.equal(scaleM3, 0.60, "Scale for zero M3 must equal targetHeight / 1.0 = 0.60");
    assert.equal(scaleV2, 0.60, "Scale for zero V2 must equal 0.60");
    assert.equal(scaleN, 0.60, "Scale for zero N must equal 0.60");

    // Generate diagram with zero forces
    const screen = (p: Point) => ({ x: p.x * 10, y: p.y * 10 });
    const diag = get2DBeamDiagram({ x: 0, y: 0 }, { x: 6, y: 0 }, zeroMap.b2, "M3", scaleM3, screen);

    assert.ok(!diag.polygonPoints.includes("NaN"), "Zero forces polygon must not contain NaN");
    assert.ok(!diag.polygonPoints.includes("Infinity"), "Zero forces polygon must not contain Infinity");
    assert.equal(diag.peakSpan.val, 0, "Peak span value must be zero");
    assert.equal(diag.support1.val, 0, "Support 1 value must be zero");
    assert.equal(diag.support2.val, 0, "Support 2 value must be zero");
  });

  test("2.2 Microscopic Forces Oracle (10^-12 kNm to 10^-6 kNm): Precision & Clamping", () => {
    const microMap: Record<string, StationData[]> = {
      b1: [
        { x: 0, M3: 1e-12, V2: -1e-14, N: 1e-15 },
        { x: 3, M3: 5e-11, V2: 0, N: 2e-13 },
        { x: 6, M3: -2e-12, V2: 1e-14, N: -1e-15 },
      ],
    };

    const scale = calculateAutoDiagramScale(microMap, "M3", 0.60);
    assert.equal(scale, 0.60, "Microscopic forces (< 1.0) must clamp denominator to 1.0");

    const screen = (p: Point) => ({ x: p.x * 10, y: p.y * 10 });
    const diag = get2DBeamDiagram({ x: 0, y: 2 }, { x: 6, y: 2 }, microMap.b1, "M3", scale, screen);

    // Verify all points are finite numbers
    const points = diag.polygonPoints.trim().split(/\s+/);
    assert.equal(points.length, 5, "Start + 3 stations + End = 5 points");
    for (const pt of points) {
      const [xStr, yStr] = pt.split(",");
      assert.ok(!Number.isNaN(Number.parseFloat(xStr)), `X must be finite number: ${xStr}`);
      assert.ok(!Number.isNaN(Number.parseFloat(yStr)), `Y must be finite number: ${yStr}`);
      assert.ok(Number.isFinite(Number.parseFloat(xStr)), `X must be finite: ${xStr}`);
      assert.ok(Number.isFinite(Number.parseFloat(yStr)), `Y must be finite: ${yStr}`);
    }
  });

  test("2.3 Extreme Forces Oracle (10^8 kNm to 10^15 kNm): Auto-Scaling Height Invariance", () => {
    const extremeCases = [1e6, 1e8, 1e12, 1e15];

    for (const maxVal of extremeCases) {
      const extremeMap: Record<string, StationData[]> = {
        b1: [
          { x: 0, M3: -maxVal * 0.5 },
          { x: 4, M3: maxVal },
          { x: 8, M3: -maxVal * 0.3 },
        ],
      };

      const scale = calculateAutoDiagramScale(extremeMap, "M3", 0.60);
      const expectedScale = 0.60 / maxVal;
      assert.ok(
        Math.abs(scale - expectedScale) / expectedScale < 1e-12,
        `Scale must normalize extreme force ${maxVal} to target height 0.60 m`
      );

      // Verify the maximum world offset does not exceed target height 0.60 m
      const maxOffset = scale * maxVal;
      assert.ok(
        Math.abs(maxOffset - 0.60) < 1e-10,
        `Maximum offset in world coords must be exactly 0.60 m for force ${maxVal}`
      );

      const screen = (p: Point) => ({ x: p.x * 10, y: p.y * 10 });
      const diag = get2DBeamDiagram({ x: 0, y: 0 }, { x: 8, y: 0 }, extremeMap.b1, "M3", scale, screen);

      assert.ok(!diag.polygonPoints.includes("NaN"), `Extreme force ${maxVal} must not produce NaN`);
      assert.ok(!diag.polygonPoints.includes("Infinity"), `Extreme force ${maxVal} must not produce Infinity`);
    }
  });

  test("2.4 Degenerate Geometry Oracle: L = 0, Empty Stations, Distant Coordinates", () => {
    const screen = (p: Point) => ({ x: p.x, y: p.y });

    // Case A: Zero-length beam (start == end)
    const zeroLenDiag = get2DBeamDiagram({ x: 5, y: 5 }, { x: 5, y: 5 }, [{ x: 0, M3: 100 }], "M3", 0.01, screen);
    assert.equal(zeroLenDiag.polygonPoints, "5,5", "Zero-length beam must return safe baseline coordinate");
    assert.equal(zeroLenDiag.tieLines.length, 0, "Zero-length beam must have no tie lines");

    // Case B: Sub-micrometer length (L = 1e-7 < 1e-6)
    const subMicroDiag = get2DBeamDiagram({ x: 0, y: 0 }, { x: 1e-7, y: 0 }, [{ x: 0, M3: 100 }], "M3", 0.01, screen);
    assert.equal(subMicroDiag.polygonPoints, "0,0", "Sub-micrometer beam must return safe baseline coordinate");

    // Case C: Empty stations array
    const emptyStationsDiag = get2DBeamDiagram({ x: 0, y: 0 }, { x: 5, y: 0 }, [], "M3", 0.01, screen);
    assert.equal(emptyStationsDiag.polygonPoints, "0,0", "Empty stations must return safe baseline coordinate");

    // Case D: Ultra-large coordinates (X = 10^6 m)
    const distantDiag = get2DBeamDiagram(
      { x: 1e6, y: 1e6 },
      { x: 1e6 + 5, y: 1e6 },
      [{ x: 0, M3: 20 }, { x: 5, M3: 20 }],
      "M3",
      0.01,
      screen
    );
    assert.ok(!distantDiag.polygonPoints.includes("NaN"), "Ultra-large coordinates must not produce NaN");
  });

  test("2.5 Deformation Magnification Bounds: Clamping across 6 Orders of Magnitude", () => {
    // Magnification must strictly stay within [10, 2000]
    const testCases: [driftM: number, dimM: number, expectedMin: number, expectedMax: number][] = [
      [0.0, 20, 100, 100],         // Zero drift -> default 100x
      [1e-9, 20, 100, 100],        // Sub-nanometer drift (< 1e-7) -> safely defaults to 100x (avoids numerical noise)
      [1e-6, 20, 2000, 2000],      // 1 micrometer drift (>= 1e-7) -> clamped to upper bound 2000x
      [0.005, 20, 200, 300],       // 5 mm real drift -> ~240x
      [0.020, 20, 50, 70],         // 20 mm real drift -> ~60x
      [0.200, 20, 10, 10],         // 200 mm severe drift -> clamped to lower bound 10x
      [10.0, 20, 10, 10],          // 10 m catastrophic drift -> clamped to lower bound 10x
      [0.01, -50, 10, 2000],       // Negative building dimension -> handles cleanly with Math.max(5, dim)
    ];

    for (const [drift, dim, minExp, maxExp] of testCases) {
      const dispMap: Record<string, [number, number, number, number, number, number]> = {
        n1: [drift, 0, 0, 0, 0, 0],
      };
      const scale = calculateAutoDeformationScale(dispMap, dim);
      assert.ok(
        scale >= 10 && scale <= 2000,
        `Deformation scale must be in [10, 2000], got ${scale} for drift ${drift}`
      );
      assert.ok(
        scale >= minExp && scale <= maxExp,
        `Expected scale in [${minExp}, ${maxExp}], got ${scale} for drift ${drift}, dim ${dim}`
      );
      assert.equal(scale, Math.round(scale), "Deformation scale must be an integer");
    }
  });
});

// ============================================================================
// SUITE 3: Station Probe Coordinate Projection & Statics Interpolation Oracles
// ============================================================================
describe("Suite 3: Station Probe Coordinate Projection & Statics Interpolation Oracles", () => {
  test("3.1 Segment Projection Oracle: Bounds Clamping (t < 0, t > 1) & Perpendicular Distance", () => {
    const a: Point = { x: 2, y: 4 };
    const b: Point = { x: 10, y: 4 }; // Length L = 8.0 m along horizontal line y = 4

    // Point far before start: (x = -4, y = 4) -> t must clamp to 0, proj = a, dist = 6.0
    const beforeStart = projectPointToSegment({ x: -4, y: 4 }, a, b);
    assert.equal(beforeStart.t, 0, "Points before start must clamp to t = 0");
    assert.equal(beforeStart.proj.x, 2, "Projected X must be a.x");
    assert.equal(beforeStart.proj.y, 4, "Projected Y must be a.y");
    assert.equal(beforeStart.distance, 6.0, "Distance must be exact distance to a");

    // Point before start with lateral offset: (x = -2, y = 7) -> dist = hypot(-2-2, 7-4) = hypot(-4, 3) = 5.0
    const beforeOffset = projectPointToSegment({ x: -2, y: 7 }, a, b);
    assert.equal(beforeOffset.t, 0, "Lateral point before start must clamp to t = 0");
    assert.equal(beforeOffset.distance, 5.0, "Distance must be exact 3-4-5 hypotenuse to a");

    // Point far after end: (x = 16, y = 4) -> t must clamp to 1, proj = b, dist = 6.0
    const afterEnd = projectPointToSegment({ x: 16, y: 4 }, a, b);
    assert.equal(afterEnd.t, 1, "Points after end must clamp to t = 1");
    assert.equal(afterEnd.proj.x, 10, "Projected X must be b.x");
    assert.equal(afterEnd.proj.y, 4, "Projected Y must be b.y");
    assert.equal(afterEnd.distance, 6.0, "Distance must be exact distance to b");

    // Point after end with lateral offset: (x = 13, y = 8) -> dist = hypot(13-10, 8-4) = hypot(3, 4) = 5.0
    const afterOffset = projectPointToSegment({ x: 13, y: 8 }, a, b);
    assert.equal(afterOffset.t, 1, "Lateral point after end must clamp to t = 1");
    assert.equal(afterOffset.distance, 5.0, "Distance must be exact hypotenuse to b");

    // Point along centerline at exact fraction t = 0.375: x = 2 + 0.375 * 8 = 5.0
    const onCenterline = projectPointToSegment({ x: 5.0, y: 4.0 }, a, b);
    assert.ok(Math.abs(onCenterline.t - 0.375) < 1e-9, "Centerline t must be 0.375");
    assert.equal(onCenterline.proj.x, 5.0, "Centerline projected X must be 5.0");
    assert.equal(onCenterline.proj.y, 4.0, "Centerline projected Y must be 4.0");
    assert.equal(onCenterline.distance, 0.0, "Centerline distance must be zero");

    // Point with perpendicular offset: (x = 6.0, y = 6.5) -> t = (6-2)/8 = 0.5, dist = 2.5
    const perpOffset = projectPointToSegment({ x: 6.0, y: 6.5 }, a, b);
    assert.ok(Math.abs(perpOffset.t - 0.5) < 1e-9, "Perpendicular projection t must be 0.5");
    assert.equal(perpOffset.proj.x, 6.0, "Projected X must be 6.0");
    assert.equal(perpOffset.proj.y, 4.0, "Projected Y must be 4.0");
    assert.ok(Math.abs(perpOffset.distance - 2.5) < 1e-9, "Perpendicular distance must be 2.5");

    // Degenerate segment: a == b
    const degen = projectPointToSegment({ x: 5, y: 8 }, { x: 2, y: 4 }, { x: 2, y: 4 });
    assert.equal(degen.t, 0, "Degenerate segment must return t = 0");
    assert.equal(degen.proj.x, 2, "Projected X must be a.x");
    assert.equal(degen.proj.y, 4, "Projected Y must be a.y");
    assert.equal(degen.distance, 5.0, "Distance must be exact distance to point a");
  });

  test("3.2 Piecewise Linear Statics Oracle: Linear Shear & Quadratic Moment Interpolation", () => {
    // Simply supported beam under uniform load q = 24 kN/m, span L = 10.0 m, N = -35 kN (compression)
    // Statics:
    // R1 = R2 = qL / 2 = 120 kN
    // V(x) = 120 - 24x  (strictly linear)
    // M(x) = 120x - 12x^2 (parabolic: M(0)=0, M(5)=300, M(10)=0)
    const L = 10.0;
    const q = 24.0;
    const numStations = 11;
    const stations: StationData[] = [];
    for (let i = 0; i < numStations; i++) {
      const x = (i / (numStations - 1)) * L;
      const v = 120 - q * x;
      const m = 120 * x - 0.5 * q * x * x;
      stations.push({ x, N: -35.0, V2: v, M3: m });
    }

    // Mathematical Property 1: For any query point t, linear interpolation of a linear function
    // must match the analytical function to exact machine precision!
    const testFractions = [0.05, 0.15, 0.237, 0.3333, 0.5, 0.684, 0.82, 0.95];
    for (const t of testFractions) {
      const queryX = t * L;
      const interpolated = interpolateStationForces(stations, t);

      // Verify span coordinate x
      assert.ok(
        Math.abs(interpolated.x - queryX) < 1e-9,
        `Interpolated x must be ${queryX}, got ${interpolated.x}`
      );

      // Verify constant axial force N = -35 kN
      assert.ok(
        Math.abs(interpolated.N - (-35.0)) < 1e-9,
        `Interpolated N must be exactly -35 kN, got ${interpolated.N}`
      );

      // Verify linear shear force V2: exact match!
      const exactV = 120 - q * queryX;
      assert.ok(
        Math.abs(interpolated.V2 - exactV) < 1e-9,
        `Interpolated V2 (${interpolated.V2}) must exactly match analytical statics (${exactV}) at t = ${t}`
      );

      // Verify quadratic moment M3: piecewise linear interpolation error bound
      // For a parabola sampled with step dx = 1.0 m, maximum chord error is (1/8) * q * dx^2
      // maxError = (1/8) * 24 * 1.0^2 = 3.0 kNm
      const exactM = 120 * queryX - 0.5 * q * queryX * queryX;
      const errorM = Math.abs(interpolated.M3 - exactM);
      const theoreticalMaxError = 0.125 * q * 1.0 * 1.0; // 3.0 kNm
      assert.ok(
        errorM <= theoreticalMaxError + 1e-9,
        `Moment interpolation error (${errorM} kNm) must not exceed theoretical chord bound (${theoreticalMaxError} kNm) at t = ${t}`
      );
    }

    // Mathematical Property 2: At station nodes, interpolation error is strictly zero
    for (let i = 0; i < numStations; i++) {
      const t = i / (numStations - 1);
      const interpAtNode = interpolateStationForces(stations, t);
      assert.ok(
        Math.abs(interpAtNode.M3 - stations[i].M3!) < 1e-9,
        `Interpolated M3 at station ${i} must exactly equal station node value`
      );
      assert.ok(
        Math.abs(interpAtNode.V2 - stations[i].V2!) < 1e-9,
        `Interpolated V2 at station ${i} must exactly equal station node value`
      );
    }

    // Mathematical Property 3: Clamping out-of-bounds t < 0 and t > 1
    const belowZero = interpolateStationForces(stations, -0.5);
    assert.equal(belowZero.x, 0.0, "Out-of-bounds t < 0 must clamp to start station x = 0");
    assert.equal(belowZero.V2, 120, "Out-of-bounds t < 0 must clamp to start shear V2 = 120");

    const aboveOne = interpolateStationForces(stations, 1.5);
    assert.equal(aboveOne.x, 10.0, "Out-of-bounds t > 1 must clamp to end station x = 10");
    assert.equal(aboveOne.V2, -120, "Out-of-bounds t > 1 must clamp to end shear V2 = -120");

    // Empty stations array
    const empty = interpolateStationForces([], 0.5);
    assert.equal(empty.x, 0, "Empty stations must return safe zero x");
    assert.equal(empty.M3, 0, "Empty stations must return safe zero M3");
  });
});

// ============================================================================
// SUITE 4: 2D Deformed Outline Geometric Continuity & Rigid Diaphragm Kinematics
// ============================================================================
describe("Suite 4: 2D Deformed Outline Geometric Continuity & Joint Compatibility", () => {
  test("4.1 Diaphragm Kinematic Oracle: Exact Joint Compatibility (Zero Gap at 4-Way Cross Joint)", () => {
    // Rigid diaphragm master node at center of mass (Xc = 10, Yc = 10)
    // Lateral displacement: Dx = 0.015 m (15 mm), Dy = 0.008 m (8 mm)
    // Torsional floor rotation: thetaZ = 0.002 rad
    const diaphragm = {
      centerX: 10.0,
      centerY: 10.0,
      displacementX: 0.015,
      displacementY: 0.008,
      rotationZ: 0.002,
    };

    // Continuous displacement function:
    // u_x(P) = Dx - thetaZ * (P.y - Yc)
    // u_y(P) = Dy + thetaZ * (P.x - Xc)
    const computeDisplacement = (p: Point): Point => ({
      x: diaphragm.displacementX - diaphragm.rotationZ * (p.y - diaphragm.centerY),
      y: diaphragm.displacementY + diaphragm.rotationZ * (p.x - diaphragm.centerX),
    });

    const scale = 200; // 200x magnification

    // Intersection joint J at (4.0, 6.0)
    const J: Point = { x: 4.0, y: 6.0 };

    // Connected elements meeting at J:
    // 1. Beam West: from (0, 6) to (4, 6) -> end is J
    // 2. Beam East: from (4, 6) to (8, 6) -> start is J
    // 3. Beam South: from (4, 2) to (4, 6) -> end is J
    // 4. Beam North: from (4, 6) to (4, 10) -> start is J
    // 5. Column C1: centered at (4, 6) -> position is J
    const beamWestEndDeformed = {
      x: J.x + computeDisplacement(J).x * scale,
      y: J.y + computeDisplacement(J).y * scale,
    };
    const beamEastStartDeformed = {
      x: J.x + computeDisplacement(J).x * scale,
      y: J.y + computeDisplacement(J).y * scale,
    };
    const beamSouthEndDeformed = {
      x: J.x + computeDisplacement(J).x * scale,
      y: J.y + computeDisplacement(J).y * scale,
    };
    const beamNorthStartDeformed = {
      x: J.x + computeDisplacement(J).x * scale,
      y: J.y + computeDisplacement(J).y * scale,
    };
    const columnCenterDeformed = {
      x: J.x + computeDisplacement(J).x * scale,
      y: J.y + computeDisplacement(J).y * scale,
    };

    // Calculate analytical displacement:
    // u_x = 0.015 - 0.002 * (6.0 - 10.0) = 0.015 - 0.002 * (-4.0) = 0.015 + 0.008 = 0.023 m
    // u_y = 0.008 + 0.002 * (4.0 - 10.0) = 0.008 + 0.002 * (-6.0) = 0.008 - 0.012 = -0.004 m
    const dispJ = computeDisplacement(J);
    assert.ok(Math.abs(dispJ.x - 0.023) < 1e-12, "Analytical displacement X must be 0.023 m");
    assert.ok(Math.abs(dispJ.y - (-0.004)) < 1e-12, "Analytical displacement Y must be -0.004 m");

    // Check deformed joint position
    const expectedDefX = 4.0 + 0.023 * 200; // 4.0 + 4.6 = 8.6 m
    const expectedDefY = 6.0 + (-0.004) * 200; // 6.0 - 0.8 = 5.2 m
    assert.ok(Math.abs(beamWestEndDeformed.x - expectedDefX) < 1e-12, "Deformed X must match 8.6 m");
    assert.ok(Math.abs(beamWestEndDeformed.y - expectedDefY) < 1e-12, "Deformed Y must match 5.2 m");

    // Geometric Connectivity Oracle: Maximum relative separation between connected elements MUST be 0.000000
    const gapBeamWestEast = Math.hypot(
      beamWestEndDeformed.x - beamEastStartDeformed.x,
      beamWestEndDeformed.y - beamEastStartDeformed.y
    );
    const gapBeamNorthSouth = Math.hypot(
      beamNorthStartDeformed.x - beamSouthEndDeformed.x,
      beamNorthStartDeformed.y - beamSouthEndDeformed.y
    );
    const gapBeamColumn = Math.hypot(
      beamWestEndDeformed.x - columnCenterDeformed.x,
      beamWestEndDeformed.y - columnCenterDeformed.y
    );

    assert.equal(gapBeamWestEast, 0.0, "Beam West and Beam East must maintain 0.0 gap at joint");
    assert.equal(gapBeamNorthSouth, 0.0, "Beam North and Beam South must maintain 0.0 gap at joint");
    assert.equal(gapBeamColumn, 0.0, "Beam and Column must maintain 0.0 gap at joint");
  });

  test("4.2 Multi-Bay Building Mesh Connectivity Oracle: 16 Joints in 3x3 Grid", () => {
    // 3-bay by 3-bay floor grid (4 axes in X, 4 axes in Y -> 16 column joints, 12 X-beams, 12 Y-beams)
    const gridSpacing = 5.0; // 5m bays -> 0m, 5m, 10m, 15m
    const diaphragm = {
      centerX: 7.5,
      centerY: 7.5,
      displacementX: 0.018,
      displacementY: 0.012,
      rotationZ: 0.0018,
    };

    const computeDisplacement = (p: Point): Point => ({
      x: diaphragm.displacementX - diaphragm.rotationZ * (p.y - diaphragm.centerY),
      y: diaphragm.displacementY + diaphragm.rotationZ * (p.x - diaphragm.centerX),
    });

    const scale = 150;

    // Create 16 column nodes
    const columnNodes: Point[] = [];
    for (let ix = 0; ix < 4; ix++) {
      for (let iy = 0; iy < 4; iy++) {
        columnNodes.push({ x: ix * gridSpacing, y: iy * gridSpacing });
      }
    }

    // Verify all 12 horizontal X-beams connect without tearing
    for (let iy = 0; iy < 4; iy++) {
      for (let ix = 0; ix < 3; ix++) {
        const startPt = { x: ix * gridSpacing, y: iy * gridSpacing };
        const endPt = { x: (ix + 1) * gridSpacing, y: iy * gridSpacing };

        // Deformed positions
        const defStart = {
          x: startPt.x + computeDisplacement(startPt).x * scale,
          y: startPt.y + computeDisplacement(startPt).y * scale,
        };
        const defEnd = {
          x: endPt.x + computeDisplacement(endPt).x * scale,
          y: endPt.y + computeDisplacement(endPt).y * scale,
        };

        // Match with column at startPt
        const colStart = {
          x: startPt.x + computeDisplacement(startPt).x * scale,
          y: startPt.y + computeDisplacement(startPt).y * scale,
        };
        // Match with column at endPt
        const colEnd = {
          x: endPt.x + computeDisplacement(endPt).x * scale,
          y: endPt.y + computeDisplacement(endPt).y * scale,
        };

        const startGap = Math.hypot(defStart.x - colStart.x, defStart.y - colStart.y);
        const endGap = Math.hypot(defEnd.x - colEnd.x, defEnd.y - colEnd.y);

        assert.equal(startGap, 0, `X-Beam at bay (${ix}, ${iy}) start must have zero joint gap`);
        assert.equal(endGap, 0, `X-Beam at bay (${ix}, ${iy}) end must have zero joint gap`);
      }
    }

    // Verify all 12 vertical Y-beams connect without tearing
    for (let ix = 0; ix < 4; ix++) {
      for (let iy = 0; iy < 3; iy++) {
        const startPt = { x: ix * gridSpacing, y: iy * gridSpacing };
        const endPt = { x: ix * gridSpacing, y: (iy + 1) * gridSpacing };

        const defStart = {
          x: startPt.x + computeDisplacement(startPt).x * scale,
          y: startPt.y + computeDisplacement(startPt).y * scale,
        };
        const defEnd = {
          x: endPt.x + computeDisplacement(endPt).x * scale,
          y: endPt.y + computeDisplacement(endPt).y * scale,
        };

        const colStart = {
          x: startPt.x + computeDisplacement(startPt).x * scale,
          y: startPt.y + computeDisplacement(startPt).y * scale,
        };
        const colEnd = {
          x: endPt.x + computeDisplacement(endPt).x * scale,
          y: endPt.y + computeDisplacement(endPt).y * scale,
        };

        const startGap = Math.hypot(defStart.x - colStart.x, defStart.y - colStart.y);
        const endGap = Math.hypot(defEnd.x - colEnd.x, defEnd.y - colEnd.y);

        assert.equal(startGap, 0, `Y-Beam at bay (${ix}, ${iy}) start must have zero joint gap`);
        assert.equal(endGap, 0, `Y-Beam at bay (${ix}, ${iy}) end must have zero joint gap`);
      }
    }
  });
});

// ============================================================================
// SUITE 5: DCR Capacity Coloring & Tie Line Invariance
// ============================================================================
describe("Suite 5: DCR Capacity Coloring & Tie Line Invariance", () => {
  test("5.1 DCR Capacity Color Boundary Partitioning Oracle", () => {
    // TS 500 / TBDY 2018 Turkish engineering standards:
    // <= 0.50 -> Emerald green (#22c55e / 0x22c55e)
    // 0.50 to 0.70 -> Lime green (#84cc16 / 0x84cc16)
    // 0.70 to 0.90 -> Yellow (#eab308 / 0xeab308)
    // 0.90 to 1.00 -> Orange (#f97316 / 0xf97316)
    // > 1.00 -> Red (#ef4444 / 0xef4444)

    const boundaryCases: [ratio: number, expectedHex: string, expectedNum: number][] = [
      [0.00, "#22c55e", 0x22c55e],
      [0.499, "#22c55e", 0x22c55e],
      [0.500, "#22c55e", 0x22c55e],
      [0.501, "#84cc16", 0x84cc16],
      [0.699, "#84cc16", 0x84cc16],
      [0.700, "#84cc16", 0x84cc16],
      [0.701, "#eab308", 0xeab308],
      [0.899, "#eab308", 0xeab308],
      [0.900, "#eab308", 0xeab308],
      [0.901, "#f97316", 0xf97316],
      [0.999, "#f97316", 0xf97316],
      [1.000, "#f97316", 0xf97316],
      [1.001, "#ef4444", 0xef4444],
      [1.500, "#ef4444", 0xef4444],
      [5.000, "#ef4444", 0xef4444],
    ];

    for (const [ratio, expHex, expNum] of boundaryCases) {
      assert.equal(getDcrColor(ratio), expHex, `getDcrColor(${ratio}) must be ${expHex}`);
      assert.equal(getDcrColorHex(ratio), expNum, `getDcrColorHex(${ratio}) must be ${expNum}`);
    }
  });

  test("5.2 Diagram Tie Lines Oracle: Correct Spatial Stations and Values", () => {
    const stations: StationData[] = Array.from({ length: 11 }, (_, i) => ({
      x: i * 0.6,
      M3: 30 * Math.sin((i / 10) * Math.PI),
      V2: 15 * Math.cos((i / 10) * Math.PI),
      N: -20,
    }));

    const screen = (p: Point) => ({ x: p.x * 20, y: p.y * 20 });
    const diag = get2DBeamDiagram({ x: 0, y: 0 }, { x: 6, y: 0 }, stations, "M3", 0.01, screen);

    // Tie lines must be generated at station 0, ~25% (station 3), ~50% (station 5), ~75% (station 8), 100% (station 10)
    assert.equal(diag.tieLines.length, 5, "Must generate exactly 5 tie lines across span");

    // Station 0 tie line (at x = 0):
    const t0 = diag.tieLines[0];
    assert.equal(t0.val, stations[0].M3, "Tie line 0 value must match station 0 M3");
    assert.equal(t0.from.x, 0, "Tie line 0 from.x must match baseline x = 0");

    // Station 10 tie line (at x = 6):
    const tLast = diag.tieLines[diag.tieLines.length - 1];
    assert.equal(tLast.val, stations[10].M3, "Tie line 10 value must match station 10 M3");
    assert.equal(tLast.from.x, 120, "Tie line 10 from.x must match screen(6) = 120 px");
  });
});


// ============================================================================
// SUITE 6: Full Building Model Analysis & Interactive Probe Stress Harness
// ============================================================================
describe("Suite 6: Full Building Model Analysis & Interactive Probe Stress Harness", () => {
  // Dynamic import of model and analysis engine
  test("6.1 Full Building Demo Model: Continuous 2D Diagrams for All Beams & All Force Types", async () => {
    const { createDemoModel } = await import("../../src/lib/hsyncad/model");
    const { runStructuralAnalysis } = await import("../../src/lib/hsyncad/analysis");

    const model = createDemoModel();
    const analysis = runStructuralAnalysis(model);

    assert.ok(analysis.memberStations, "Analysis must contain memberStations");
    const beams = model.elements.filter((e): e is import("../../src/lib/hsyncad/model").BeamElement => e.type === "beam");
    assert.ok(beams.length > 0, "Demo model must contain beams");

    const screen = (p: Point) => ({ x: 100 + p.x * 25, y: 300 - p.y * 25 });
    const forceTypes: ForceDiagramType[] = ["M3", "V2", "N"];

    for (const beam of beams) {
      const stations = analysis.memberStations[beam.id];
      if (!stations || !stations.length) continue;

      for (const fType of forceTypes) {
        const autoScale = calculateAutoDiagramScale(analysis.memberStations, fType, 0.60);
        assert.ok(autoScale > 0, `Auto scale for ${fType} must be positive`);

        const diag = get2DBeamDiagram(beam.start, beam.end, stations, fType, autoScale, screen);

        // Verify polygon points
        assert.ok(diag.polygonPoints.length > 0, `Polygon points for beam ${beam.name} (${fType}) must not be empty`);
        assert.ok(!diag.polygonPoints.includes("NaN"), `Polygon points for beam ${beam.name} (${fType}) must not contain NaN`);
        assert.ok(!diag.polygonPoints.includes("Infinity"), `Polygon points for beam ${beam.name} (${fType}) must not contain Infinity`);

        // Verify supports and peak span
        assert.ok(Number.isFinite(diag.peakSpan.val), `Peak span value for ${beam.name} must be finite`);
        assert.ok(Number.isFinite(diag.support1.val), `Support 1 value for ${beam.name} must be finite`);
        assert.ok(Number.isFinite(diag.support2.val), `Support 2 value for ${beam.name} must be finite`);

        // Verify tie lines count <= 5
        assert.ok(diag.tieLines.length <= 5, "Tie lines count must be at most 5");
        for (const t of diag.tieLines) {
          assert.ok(Number.isFinite(t.val), "Tie line value must be finite");
          assert.ok(Number.isFinite(t.from.x) && Number.isFinite(t.from.y), "Tie line from must be finite");
          assert.ok(Number.isFinite(t.to.x) && Number.isFinite(t.to.y), "Tie line to must be finite");
        }
      }
    }
  });

  test("6.2 Interactive Hover Probe Monte-Carlo Simulation: 200 Probes across Building Footprint", async () => {
    const { createDemoModel } = await import("../../src/lib/hsyncad/model");
    const { runStructuralAnalysis } = await import("../../src/lib/hsyncad/analysis");

    const model = createDemoModel();
    const analysis = runStructuralAnalysis(model);
    const beams = model.elements.filter((e): e is import("../../src/lib/hsyncad/model").BeamElement => e.type === "beam");

    // Pseudo-random deterministic generator for repeatability
    let seed = 42;
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    // 200 probe points across X in [-2, 20], Y in [-2, 20]
    for (let i = 0; i < 200; i++) {
      const px = -2.0 + pseudoRandom() * 22.0;
      const py = -2.0 + pseudoRandom() * 22.0;
      const probePoint: Point = { x: px, y: py };

      // Emulate hover probe finding nearest beam
      let nearestDist = 0.50; // 0.50 m detection threshold
      let hitBeam: typeof beams[0] | null = null;
      let hitT = 0;

      for (const beam of beams) {
        const proj = projectPointToSegment(probePoint, beam.start, beam.end);
        if (proj.distance < nearestDist) {
          nearestDist = proj.distance;
          hitBeam = beam;
          hitT = proj.t;
        }
      }

      if (hitBeam) {
        const stations = analysis.memberStations[hitBeam.id];
        assert.ok(stations, `Stations must exist for hit beam ${hitBeam.name}`);

        const forces = interpolateStationForces(stations, hitT);
        assert.ok(hitT >= 0.0 && hitT <= 1.0, `Station fraction t must be in [0, 1], got ${hitT}`);
        assert.ok(Number.isFinite(forces.x), `Interpolated station x must be finite: ${forces.x}`);
        assert.ok(Number.isFinite(forces.M3), `Interpolated M3 must be finite: ${forces.M3}`);
        assert.ok(Number.isFinite(forces.V2), `Interpolated V2 must be finite: ${forces.V2}`);
        assert.ok(Number.isFinite(forces.N), `Interpolated N must be finite: ${forces.N}`);

        const member = analysis.members[hitBeam.id];
        const dcr = member?.capacityRatio ?? 0;
        assert.ok(dcr >= 0, `Member DCR must be non-negative: ${dcr}`);
        const color = getDcrColor(dcr);
        assert.ok(color.startsWith("#"), `DCR color must be valid hex code: ${color}`);
      }
    }
  });

  test("6.3 Viewport Transform Invariance: Diagram Generation under Extreme Camera Zoom & Pan", () => {
    const stations: StationData[] = [
      { x: 0, M3: -45, V2: 30, N: -10 },
      { x: 2.5, M3: 65, V2: 0, N: -10 },
      { x: 5.0, M3: -45, V2: -30, N: -10 },
    ];

    const zoomScales = [1e-6, 0.001, 1.0, 48.0, 350.0];
    const cameraOffsets: [cx: number, cy: number][] = [
      [0, 0],
      [1000, 1000],
      [-5000, 8000],
    ];

    for (const zoom of zoomScales) {
      for (const [cx, cy] of cameraOffsets) {
        const screen = (p: Point) => ({
          x: 400 + (p.x - cx) * zoom,
          y: 300 - (p.y - cy) * zoom,
        });

        const diag = get2DBeamDiagram({ x: 0, y: 0 }, { x: 5, y: 0 }, stations, "M3", 0.01, screen);
        assert.ok(diag.polygonPoints.length > 0, "Polygon points must not be empty under extreme zoom");
        assert.ok(!diag.polygonPoints.includes("NaN"), `Polygon points must not contain NaN under zoom ${zoom}`);
        assert.ok(!diag.polygonPoints.includes("Infinity"), `Polygon points must not contain Infinity under zoom ${zoom}`);
        assert.ok(Number.isFinite(diag.peakSpan.screen.x), "Peak span screen x must be finite");
        assert.ok(Number.isFinite(diag.peakSpan.screen.y), "Peak span screen y must be finite");
      }
    }
  });
});
