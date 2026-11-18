/** P02: sekiz mevcut diyagram geometrisi regresyonu korunur; donatı bilinmezliği ayrıca sınanır. */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createDemoModel } from "../../src/lib/hsyncad/model";
import type { AnalysisResult } from "../../src/lib/hsyncad/analysis";
import { calculateFullTakeoff } from "../../src/lib/hsyncad/quantities";
import {
  computeTensionFaceNormal, get2DBeamDiagram, interpolateStationForces,
  projectPointToSegment, getDcrColor, getDisplacementHeatmapColor,
  getVertexDisplacement, build3DRibbonData, projectRaycastHitToStation,
  type StationData,
} from "../../src/lib/hsyncad/diagram-geometry";

// ============================================================================
// SUITE 1: 2D & 3D Diagram, Heatmap & Visual Geometry Hardening
// ============================================================================
describe("Suite 1: 2D & 3D Diagram, Heatmap & Visual Geometry Hardening", () => {
  const screenDummy = (p: { x: number; y: number }) => ({ x: 300 + p.x * 20, y: 300 - p.y * 20 });

  test("1.1 Zero-Length Members: 2D Normal, 2D SVG Diagram & 3D Extrusion Fallbacks", () => {
    // Zero-length tangent vector
    const norm = computeTensionFaceNormal(0, 0);
    assert.strictEqual(norm.L, 0, "Length must be exactly 0 for zero-length vector");
    assert.strictEqual(norm.nx, 0, "Default normal nx must be 0");
    assert.strictEqual(norm.ny, 1, "Default normal ny must be 1");
    assert.strictEqual(norm.tx, 1, "Fallback tangent tx must be 1");
    assert.strictEqual(norm.ty, 0, "Fallback tangent ty must be 0");

    // 2D Beam diagram for zero-length member (start === end)
    const stations: StationData[] = [
      { x: 0, M3: 15.0, V2: 25.0, N: -100.0 },
      { x: 0, M3: 20.0, V2: 10.0, N: -100.0 },
    ];
    const diag = get2DBeamDiagram({ x: 5, y: 5 }, { x: 5, y: 5 }, stations, "M3", 0.05, screenDummy);
    assert.ok(diag.polygonPoints.length > 0, "Polygon points string must not be empty");
    assert.strictEqual(diag.tieLines.length, 0, "Tie lines must be empty for zero-length beam");
    assert.strictEqual(diag.curveScreenPoints.length, 1, "Must return single fallback screen point");

    // 3D Ribbon Extrusion for zero-length member
    const ribbon = build3DRibbonData(
      { x: 2, y: 2, z: 3 },
      { x: 2, y: 2, z: 3 },
      "beam",
      stations,
      "M3",
      0.05
    );
    assert.strictEqual(ribbon.meshPositions.length, 0, "3D ribbon mesh positions must be empty for L=0");
    assert.strictEqual(ribbon.crestPositions.length, 0, "3D crest positions must be empty for L=0");
    assert.strictEqual(ribbon.baselinePositions.length, 0, "3D baseline positions must be empty for L=0");
  });

  test("1.2 Co-Linear and Overlapping Members: Projection & Station Mapping Invariance", () => {
    // Two co-linear members sharing the same axis line
    const mem1 = { start: { x: 0, y: 0 }, end: { x: 4, y: 0 } };
    const mem2 = { start: { x: 2, y: 0 }, end: { x: 6, y: 0 } };

    // Point in overlap region (x=3, y=0.1)
    const pOverlap = { x: 3, y: 0.1 };
    const proj1 = projectPointToSegment(pOverlap, mem1.start, mem1.end);
    const proj2 = projectPointToSegment(pOverlap, mem2.start, mem2.end);

    assert.ok(Math.abs(proj1.distance - 0.1) < 1e-9, "Distance to mem1 axis must be 0.1m");
    assert.ok(Math.abs(proj2.distance - 0.1) < 1e-9, "Distance to mem2 axis must be 0.1m");
    assert.ok(Math.abs(proj1.t - 0.75) < 1e-9, "Normalized station on mem1 must be 3/4 = 0.75");
    assert.ok(Math.abs(proj2.t - 0.25) < 1e-9, "Normalized station on mem2 must be (3-2)/(6-2) = 0.25");
  });

  test("1.3 Raycast Hits on Member Endpoints: Boundary Clamping & Physical Station Calculation", () => {
    const beamElem = {
      type: "beam",
      start: { x: 0, y: 0 },
      end: { x: 6, y: 0 },
    };
    const floor = { elevation: 0, height: 3 };

    // 1. Hit precisely at start endpoint (Three.js coords: x=0, y=3, z=0)
    const hitStart = projectRaycastHitToStation({ x: 0, y: 3, z: 0 }, beamElem, floor);
    assert.strictEqual(hitStart.t, 0, "Start endpoint t must be exactly 0");
    assert.strictEqual(hitStart.x, 0, "Start endpoint x must be exactly 0m");
    assert.strictEqual(hitStart.L, 6, "Span length must be 6m");

    // 2. Hit precisely at end endpoint (Three.js coords: x=6, y=3, z=0)
    const hitEnd = projectRaycastHitToStation({ x: 6, y: 3, z: 0 }, beamElem, floor);
    assert.strictEqual(hitEnd.t, 1, "End endpoint t must be exactly 1");
    assert.strictEqual(hitEnd.x, 6, "End endpoint x must be exactly 6m");

    // 3. Hit beyond start endpoint (x = -2.5m)
    const hitBefore = projectRaycastHitToStation({ x: -2.5, y: 3, z: 0 }, beamElem, floor);
    assert.strictEqual(hitBefore.t, 0, "Negative station must clamp to t=0");
    assert.strictEqual(hitBefore.x, 0, "Negative station x must clamp to 0m");

    // 4. Hit beyond end endpoint (x = 8.5m)
    const hitAfter = projectRaycastHitToStation({ x: 8.5, y: 3, z: 0 }, beamElem, floor);
    assert.strictEqual(hitAfter.t, 1, "Overextended station must clamp to t=1");
    assert.strictEqual(hitAfter.x, 6, "Overextended station x must clamp to L=6m");
  });

  test("1.4 Inverted Station Bounds & Non-Monotonic Internal Force Sequences", () => {
    // Inverted stations: x decreasing from 4.0 to 0.0
    const invertedStations: StationData[] = [
      { x: 4.0, M3: 50.0, V2: 30.0, N: -100.0 },
      { x: 0.0, M3: -20.0, V2: -30.0, N: -100.0 },
    ];

    // Midpoint interpolation t=0.5
    const midForces = interpolateStationForces(invertedStations, 0.5);
    assert.ok(Math.abs(midForces.M3 - 15.0) < 1e-9, "M3 at mid must be (50 - 20)/2 = 15.0 kNm");
    assert.ok(Math.abs(midForces.V2 - 0.0) < 1e-9, "V2 at mid must be (30 - 30)/2 = 0.0 kN");
    assert.ok(Math.abs(midForces.x - 2.0) < 1e-9, "Interpolated station x must be (4 + 0)/2 = 2.0m");

    // Clamp check: t = -5.0 clamped to index 0, t = 10.0 clamped to index 1
    const clampedStart = interpolateStationForces(invertedStations, -5.0);
    assert.strictEqual(clampedStart.M3, 50.0, "Negative t must clamp to first station");
    const clampedEnd = interpolateStationForces(invertedStations, 10.0);
    assert.strictEqual(clampedEnd.M3, -20.0, "Over-limit t must clamp to last station");
  });

  test("1.5 Adversarial Vulnerability Probe: NaN Inputs in Station Interpolation", () => {
    const normalStations: StationData[] = [
      { x: 0.0, M3: 10.0 },
      { x: 4.0, M3: 20.0 },
    ];

    // White-box finding: Math.max(0, Math.min(1, NaN)) yields NaN.
    // In unhardened code, stations[Math.floor(NaN)] is undefined and throws TypeError.
    assert.throws(
      () => {
        interpolateStationForces(normalStations, NaN);
      },
      { name: "TypeError" },
      "Documenting white-box vulnerability: interpolateStationForces with NaN throws TypeError"
    );
  });

  test("1.6 3D Extruded Ribbon Quad Strip: Complete Vertex & Buffer Alignment across Rotations", () => {
    const start = { x: 2, y: 2, z: 0 };
    const end = { x: 2, y: 2, z: 3 };
    const stations: StationData[] = [
      { x: 0.0, M3: 0.0 },
      { x: 0.75, M3: 10.0 },
      { x: 1.5, M3: 20.0 },
      { x: 2.25, M3: 10.0 },
      { x: 3.0, M3: 0.0 },
    ];

    // Test across full 360-degree column orientations
    const angles = [0, 30, 45, 90, 135, 180, 270, 360];
    for (const rot of angles) {
      const ribbon = build3DRibbonData(start, end, "column", stations, "M3", 0.05, rot);

      // 5 stations -> 4 intervals -> 4 quads * 2 triangles * 3 vertices = 24 vertices -> 72 floats
      assert.strictEqual(
        ribbon.meshPositions.length,
        72,
        `Quad strip mesh positions must contain exactly 72 floats at ${rot} deg rotation`
      );
      assert.strictEqual(
        ribbon.crestPositions.length,
        15,
        "Crest line must contain 5 points * 3 = 15 floats"
      );
      assert.strictEqual(
        ribbon.baselinePositions.length,
        15,
        "Baseline line must contain 5 points * 3 = 15 floats"
      );
      assert.strictEqual(
        ribbon.endCapPositions.length,
        12,
        "End caps must contain 2 segments * 2 points * 3 = 12 floats"
      );

      // Verify no NaN or Infinite coordinates in generated buffers
      for (let j = 0; j < ribbon.meshPositions.length; j++) {
        assert.ok(
          Number.isFinite(ribbon.meshPositions[j]),
          `Mesh position index ${j} must be finite at ${rot} deg`
        );
      }
    }
  });

  test("1.7 Scientific Displacement Heatmap & DCR Color Boundary Oracles", () => {
    // Exact heatmap partition checks: [0, 0.25], (0.25, 0.50], (0.50, 0.75], (0.75, 1.0]
    const c0 = getDisplacementHeatmapColor(0.0);
    assert.deepStrictEqual(c0, [0.1, 0.4, 0.95], "rho=0 must be deep blue");

    const c25 = getDisplacementHeatmapColor(0.25);
    assert.ok(Math.abs(c25[0] - 0.1) < 1e-4 && Math.abs(c25[1] - 0.85) < 1e-4, "rho=0.25 must be cyan");

    const c50 = getDisplacementHeatmapColor(0.50);
    assert.ok(Math.abs(c50[0] - 0.2) < 1e-4 && Math.abs(c50[1] - 0.8) < 1e-4, "rho=0.50 must be green");

    const c75 = getDisplacementHeatmapColor(0.75);
    assert.ok(Math.abs(c75[0] - 0.9) < 1e-4 && Math.abs(c75[1] - 0.8) < 1e-4, "rho=0.75 must be yellow");

    const c100 = getDisplacementHeatmapColor(1.0);
    assert.ok(
      Math.abs(c100[0] - 0.9) < 1e-6 && Math.abs(c100[1] - 0.2) < 1e-6 && Math.abs(c100[2] - 0.1) < 1e-6,
      `rho=1.0 must be red [0.9, 0.2, 0.1] (got [${c100.join(", ")}])`
    );

    // Over-limit clamping
    const cOver = getDisplacementHeatmapColor(5.0);
    assert.ok(
      Math.abs(cOver[0] - 0.9) < 1e-6 && Math.abs(cOver[1] - 0.2) < 1e-6 && Math.abs(cOver[2] - 0.1) < 1e-6,
      "rho=5.0 must clamp to rho=1.0 (red)"
    );

    // DCR capacity color threshold transitions
    assert.strictEqual(getDcrColor(0.40), "#22c55e", "DCR 0.40 must be green");
    assert.strictEqual(getDcrColor(0.50), "#22c55e", "DCR 0.50 must be green");
    assert.strictEqual(getDcrColor(0.51), "#84cc16", "DCR 0.51 must be lime");
    assert.strictEqual(getDcrColor(0.70), "#84cc16", "DCR 0.70 must be lime");
    assert.strictEqual(getDcrColor(0.71), "#eab308", "DCR 0.71 must be yellow");
    assert.strictEqual(getDcrColor(0.90), "#eab308", "DCR 0.90 must be yellow");
    assert.strictEqual(getDcrColor(0.91), "#f97316", "DCR 0.91 must be orange");
    assert.strictEqual(getDcrColor(1.00), "#f97316", "DCR 1.00 must be orange");
    assert.strictEqual(getDcrColor(1.01), "#ef4444", "DCR 1.01 must be crimson (over capacity)");
    assert.strictEqual(getDcrColor(NaN), "#ef4444", "DCR NaN must fail-safe to crimson");
  });

  test("1.8 Multi-Storey Kinematics & Foundation Elevation Clamping", () => {
    const fakeAnalysis = {
      displacements: {},
      floorDiaphragms: [
        { elevation: 3.0, displacementX: 0.010, displacementY: 0.005, rotationZ: 0.0001, centerX: 5, centerY: 5 },
        { elevation: 6.0, displacementX: 0.025, displacementY: 0.012, rotationZ: 0.0002, centerX: 5, centerY: 5 },
      ],
    } as unknown as AnalysisResult;

    // 1. Below foundation / at ground level (Z <= 0) must be strictly 0 translation
    const dGround = getVertexDisplacement(5, 5, 0, fakeAnalysis);
    assert.deepStrictEqual(dGround, [0, 0, 0], "Ground level Z=0 must be clamped to 0 translation");
    const dSub = getVertexDisplacement(5, 5, -2.5, fakeAnalysis);
    assert.deepStrictEqual(dSub, [0, 0, 0], "Basement Z < 0 must be clamped to 0 translation");

    // 2. Linear interpolation between Z=0 and Z=3 (at Z=1.5, alpha = 0.5)
    const dMid1 = getVertexDisplacement(5, 5, 1.5, fakeAnalysis);
    assert.ok(Math.abs(dMid1[0] - 0.005) < 1e-6, "ux at mid 1st storey must be 0.005m");
    assert.ok(Math.abs(dMid1[1] - 0.0025) < 1e-6, "uy at mid 1st storey must be 0.0025m");

    // 3. Above top storey (Z=9m >= 6m) must follow roof diaphragm kinematics
    const dRoof = getVertexDisplacement(5, 5, 9.0, fakeAnalysis);
    assert.ok(Math.abs(dRoof[0] - 0.025) < 1e-6, "ux above top storey must match roof diaphragm");
    assert.ok(Math.abs(dRoof[1] - 0.012) < 1e-6, "uy above top storey must match roof diaphragm");
  });
});

// ============================================================================
// SUITE 2: Metraj (Quantity Takeoff) Edge Cases & Geometric Limits
// ============================================================================

// Eski tahmini donatı ve sabit rapor bölümü kabulleri P02 integrity testleriyle değiştirildi.
test("P02 legacy visual harness: unknown steel remains unknown", () => {
  const model = createDemoModel();
  assert.equal(calculateFullTakeoff(model).rebarTonnage.totalKg, null);
});
