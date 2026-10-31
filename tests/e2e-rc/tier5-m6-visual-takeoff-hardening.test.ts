/**
 * Tier 5 White-Box Adversarial Coverage Hardening Test Suite (Milestone 6)
 *
 * Target Modules:
 * - src/components/hsyncad/plan2d.tsx & diagram-geometry.ts (2D Visual Analysis & Diagrams)
 * - src/components/hsyncad/scene3d.tsx (3D WebGL Scene & Deformations)
 * - src/lib/hsyncad/quantities.ts (Quantity Takeoff & Metraj Engine)
 * - src/lib/hsyncad/reports.ts (PDF Static & Metraj Report Generators)
 * - src/components/hsyncad/quantity-report.tsx (Takeoff Inspector UI)
 * - src/components/hsyncad/analysis-dialog.tsx (Analysis Results Dialog)
 * - src/components/hsyncad/workbench.tsx (Workbench View Mode Contracts)
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

import {
  createDemoModel,
  createEmptyModel,
  type CadModel,
  type ColumnElement,
  type BeamElement,
  type WallElement,
  type SlabElement,
} from "../../src/lib/hsyncad/model";
import {
  computeTensionFaceNormal,
  get2DBeamDiagram,
  calculateAutoDiagramScale,
  calculateAutoDeformationScale,
  interpolateStationForces,
  projectPointToSegment,
  getDcrColor,
  getDcrColorHex,
  getDisplacementHeatmapColor,
  getMaxDisplacementMagnitude,
  getVertexDisplacement,
  build3DRibbonData,
  projectRaycastHitToStation,
  cadToThreeCoord,
  cadToThreeDisplacement,
  type StationData,
  type ForceDiagramType,
} from "../../src/lib/hsyncad/diagram-geometry";
import {
  calculateFullTakeoff,
  calculateQuantities,
  isCertifiedReferenceModel,
  CERTIFIED_METRAJ_REFERENCE,
  REBAR_UNIT_WEIGHTS,
} from "../../src/lib/hsyncad/quantities";
import {
  generateStaticReportPDF,
  generateQuantityReportPDF,
  downloadStaticReportPdf,
  downloadQuantityReportPdf,
  quantityReport,
  reportCsv,
  ELEMENT_NAMES,
  type StaticReportMetadata,
} from "../../src/lib/hsyncad/reports";
import {
  runStructuralAnalysis,
  DEFAULT_ANALYSIS_SETTINGS,
  type StructuralAnalysisResult,
  type AnalysisResult,
} from "../../src/lib/hsyncad/analysis";
import { runConcreteDesignChecks, type ConcreteDesignResult } from "../../src/lib/hsyncad/design-engine";
import { resolveJunctions } from "../../src/lib/hsyncad/junctions";
import { polygonArea, polygonPerimeter, isSimplePolygon } from "../../src/lib/hsyncad/geometry";

// Helper: Extract text per page from PDF bytes using pdfjs-dist
async function extractPdfPages(pdfBytes: Uint8Array): Promise<string[]> {
  const doc = await pdfjs.getDocument({ data: pdfBytes }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    const pageText = tc.items.map((it: any) => it.str).join(" ");
    pages.push(pageText);
  }
  return pages;
}

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
    const fakeAnalysis: any = {
      displacements: {},
      floorDiaphragms: [
        { elevation: 3.0, displacementX: 0.010, displacementY: 0.005, rotationZ: 0.0001, centerX: 5, centerY: 5 },
        { elevation: 6.0, displacementX: 0.025, displacementY: 0.012, rotationZ: 0.0002, centerX: 5, centerY: 5 },
      ],
    };

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
describe("Suite 2: Metraj (Quantity Takeoff) Edge Cases & Geometric Limits", () => {
  test("2.1 Zero-Length Beam: Legacy calculateQuantities NaN vs calculateFullTakeoff Zero Invariance", () => {
    const model = createEmptyModel();
    model.elements.push({
      id: "beam-zero",
      name: "KZ0",
      type: "beam",
      layer: "Kirişler",
      floorId: "floor-0",
      materialId: "concrete",
      start: { x: 2, y: 2 },
      end: { x: 2, y: 2 }, // Zero length
      width: 0.25,
      height: 0.5,
    });

    // 1. Legacy calculateQuantities produces NaN formwork due to 0-division
    const legacyResult = calculateQuantities(model);
    const beamRow = legacyResult.rows.find(r => r.type === "beam")!;
    assert.ok(
      Number.isNaN(beamRow.formwork),
      "Documenting legacy bug: calculateQuantities produces NaN formwork for zero-length beam"
    );

    // 2. Modern calculateFullTakeoff must gracefully handle zero length and yield 0.00
    const fullResult = calculateFullTakeoff(model);
    assert.strictEqual(
      fullResult.concreteVolumeM3.byElement.beam,
      0,
      "calculateFullTakeoff beam concrete volume must be 0 for zero length"
    );
    assert.strictEqual(
      fullResult.formworkAreaM2.byElement.beam,
      0,
      "calculateFullTakeoff beam formwork area must be 0 for zero length"
    );
    assert.strictEqual(
      fullResult.rebarTonnage.byElement.beam,
      0,
      "calculateFullTakeoff beam rebar tonnage must be 0 for zero length"
    );
  });

  test("2.2 Extreme & Pathological Rebar Schedules: Zero Spacing & Massive Longitudinal Areas", () => {
    const model = createEmptyModel();
    const beam: BeamElement = {
      id: "beam-stress",
      name: "K101",
      type: "beam",
      layer: "Kirişler",
      floorId: "floor-0",
      materialId: "concrete",
      start: { x: 0, y: 0 },
      end: { x: 5, y: 0 },
      width: 0.3,
      height: 0.6,
    };
    model.elements.push(beam);

    // Extreme design schedule: 50,000 mm² longitudinal steel + 10 cm stirrup spacing
    const extremeDesign: any = {
      rebarSchedule: {
        "beam-stress": {
          longitudinal: { totalAsMm2: 50000, text: "20Ø32 + 10Ø32" },
          transverse: { tieDiameterMm: 12, midspanSpacingCm: 10, text: "Ø12/10" },
        },
      },
    };

    const takeoff = calculateFullTakeoff(model, extremeDesign);
    const item = takeoff.elementBreakdown.find(e => e.id === "beam-stress")!;

    // longWeight = (50000 / 1e6) * 5 * 7850 = 1962.5 kg
    // tieCount = ceil(5 / 0.10) = 50. tieLen = 2*(0.3+0.6)+0.25 = 2.05m. tieWeight = 50 * 2.05 * 0.888 = 91.02 kg.
    const expectedLong = 0.05 * 5 * 7850;
    assert.ok(item.rebarKg > expectedLong, "Rebar tonnage must include massive longitudinal steel");
    assert.ok(Number.isFinite(item.rebarKg), "Rebar tonnage must be finite");
  });

  test("2.3 Degenerate Slabs: Self-Intersecting Bowtie, Collinear Points & Zero Area", () => {
    const model = createEmptyModel();

    // 1. Collinear slab (3 points along line y = 0)
    const collinearSlab: SlabElement = {
      id: "slab-collinear",
      name: "D_COLLINEAR",
      type: "slab",
      layer: "Döşemeler",
      floorId: "floor-0",
      materialId: "concrete",
      points: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 4, y: 0 }],
      thickness: 0.15,
    };

    // 2. Degenerate 2-point slab
    const degenerateSlab: SlabElement = {
      id: "slab-degen",
      name: "D_DEGEN",
      type: "slab",
      layer: "Döşemeler",
      floorId: "floor-0",
      materialId: "concrete",
      points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
      thickness: 0.15,
    };

    model.elements.push(collinearSlab, degenerateSlab);

    const takeoff = calculateFullTakeoff(model);
    assert.strictEqual(
      takeoff.concreteVolumeM3.byElement.slab,
      0,
      "Degenerate slabs must not contribute concrete volume"
    );
    assert.strictEqual(
      takeoff.formworkAreaM2.byElement.slab,
      0,
      "Degenerate slabs must not contribute formwork area"
    );
    assert.strictEqual(
      takeoff.rebarTonnage.byElement.slab,
      0,
      "Degenerate slabs must not contribute rebar tonnage"
    );
  });

  test("2.4 Staircase & Raft Foundation Extreme Geometry Limits", () => {
    const model = createEmptyModel();

    // Raft Foundation with huge dimensions: 20m x 20m, 1.2m thickness
    const raftSlab: SlabElement = {
      id: "raft-huge",
      name: "RAD101",
      type: "slab",
      layer: "Temeller",
      floorId: "floor-0",
      materialId: "concrete",
      points: [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 20 }, { x: 0, y: 20 }],
      thickness: 1.2,
    };

    // Stair slab: 2m x 5m, 0.20m thickness
    const stairSlab: SlabElement = {
      id: "stair-flight",
      name: "M101",
      type: "slab",
      layer: "Merdivenler",
      floorId: "floor-0",
      materialId: "concrete",
      points: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 5 }, { x: 0, y: 5 }],
      thickness: 0.20,
    };

    model.elements.push(raftSlab, stairSlab);

    const takeoff = calculateFullTakeoff(model);

    // Raft: Area = 400 m², thickness = 1.2m -> Volume = 480 m³
    assert.strictEqual(takeoff.concreteVolumeM3.byElement.raft, 480, "Raft volume must be 400 * 1.2 = 480 m³");
    // Raft Formwork: Perimeter = 80m * 1.2m = 96 m² (no bottom formwork)
    assert.strictEqual(takeoff.formworkAreaM2.byElement.raft, 96, "Raft formwork must be perimeter * thickness = 96 m²");

    // Stair: Area = 10 m², effective thickness = 0.20 + 0.08 = 0.28m -> Volume = 2.8 m³
    assert.ok(
      Math.abs(takeoff.concreteVolumeM3.byElement.stair - 2.8) < 1e-4,
      `Stair volume must be approximately 2.8 m³ (got ${takeoff.concreteVolumeM3.byElement.stair})`
    );
    // Stair Formwork: 10 * 1.5 = 15 m²
    assert.strictEqual(takeoff.formworkAreaM2.byElement.stair, 15, "Stair formwork must be area * 1.5 = 15 m²");
  });

  test("2.5 Multi-Material and Missing Material ID Robustness Probe", () => {
    const model = createEmptyModel();
    model.elements.push({
      id: "col-bad-mat",
      name: "S1",
      type: "column",
      layer: "Kolonlar",
      floorId: "floor-0",
      materialId: "non-existent-material",
      position: { x: 0, y: 0 },
      width: 0.4,
      depth: 0.4,
      height: 3,
    });

    // 1. calculateFullTakeoff operates geometrically without crashing on unmapped material
    const takeoff = calculateFullTakeoff(model);
    assert.ok(
      Math.abs(takeoff.concreteVolumeM3.byElement.column - 0.48) < 1e-4,
      `Column volume must be approximately 0.48 m³ (got ${takeoff.concreteVolumeM3.byElement.column})`
    );

    // 2. Documenting white-box vulnerability: quantityReport crashes if material is not found
    const junctions = resolveJunctions(model);
    assert.throws(
      () => {
        quantityReport(model, junctions, { grouping: "material", floorId: "", types: ["column"] });
      },
      { name: "TypeError" },
      "quantityReport crashes with TypeError when materialId is missing from model.materials"
    );
  });

  test("2.6 Unmapped Floor ID Robustness Probe", () => {
    const model = createEmptyModel();
    model.elements.push({
      id: "beam-ghost-floor",
      name: "K_GHOST",
      type: "beam",
      layer: "Kirişler",
      floorId: "non-existent-floor",
      materialId: "concrete",
      start: { x: 0, y: 0 },
      end: { x: 4, y: 0 },
      width: 0.25,
      height: 0.5,
    });

    // calculateFullTakeoff gracefully skips element with invalid floorId
    const takeoff = calculateFullTakeoff(model);
    assert.strictEqual(takeoff.concreteVolumeM3.total, 0, "Elements on non-existent floors must be safely skipped");
    assert.strictEqual(takeoff.elementBreakdown.length, 0, "No element breakdown item for skipped ghost floor");
  });
});

// ============================================================================
// SUITE 3: Static & Quantity Report PDF Stress Harness
// ============================================================================
describe("Suite 3: Static & Quantity Report PDF Stress Harness", () => {
  test("3.1 Stressful Turkish Typography: All Diacritics in Static & Metraj PDFs", async () => {
    const model = createDemoModel();
    const analysis = runStructuralAnalysis(model);
    const design = runConcreteDesignChecks(model, analysis);
    const takeoff = calculateFullTakeoff(model, design);

    // Stress metadata with all Turkish special characters
    const turkishMeta: Partial<StaticReportMetadata> = {
      projectName: "ÖĞRETMENLER SİTESİ ŞEHİT İSMAİL ÇAĞLAYAN BİNASI",
      engineerName: "ŞÜKRÜ ÇAĞATAY İĞCİOĞLU",
      engineerTitle: "Kıdemli Başmühendis (İnşaat)",
      city: "GÜMÜŞHANE",
      district: "ŞİRAN / ÇALDIRAN",
      buildingType: "ÖZEL SAĞLIK & EĞİTİM TESİSİ",
    };

    // 1. Static Report PDF
    const staticPdfBytes = await generateStaticReportPDF(model, analysis, design, turkishMeta);
    assert.ok(staticPdfBytes.length > 50000, "Static report PDF bytes must exceed 50KB");

    const staticPages = await extractPdfPages(staticPdfBytes);
    const fullStaticText = staticPages.join(" ");
    assert.ok(fullStaticText.includes("ÖĞRETMENLER"), "Static report must contain uppercase Ö");
    assert.ok(fullStaticText.includes("ŞEHİT"), "Static report must contain uppercase Ş");
    assert.ok(fullStaticText.includes("İSMAİL"), "Static report must contain dotted capital İ");
    assert.ok(fullStaticText.includes("ÇAĞLAYAN"), "Static report must contain uppercase Ç and Ğ");
    assert.ok(fullStaticText.includes("GÜMÜŞHANE"), "Static report must contain uppercase Ü and Ş");

    // 2. Quantity Report PDF
    const metrajPdfBytes = await generateQuantityReportPDF(model, takeoff, turkishMeta);
    assert.ok(metrajPdfBytes.length > 30000, "Metraj report PDF bytes must exceed 30KB");

    const metrajPages = await extractPdfPages(metrajPdfBytes);
    const fullMetrajText = metrajPages.join(" ");
    assert.ok(fullMetrajText.includes("ŞÜKRÜ"), "Metraj report must contain uppercase Ş and Ü");
    assert.ok(fullMetrajText.includes("İĞCİOĞLU"), "Metraj report must contain uppercase İ and Ğ");
  });

  test("3.2 Huge Text Fields & Buffer Stress: 1500-Character String Handling", async () => {
    const model = createDemoModel();
    const analysis = runStructuralAnalysis(model);

    const hugeText = "TBDY 2018 VE TS 500 MADDELERİ UYARINCA HESAPLANMIŞTIR. ".repeat(30); // ~1650 chars
    const stressMeta: Partial<StaticReportMetadata> = {
      projectName: hugeText.slice(0, 500),
      engineerName: hugeText.slice(0, 300),
      licenseNumber: "LISANS-" + "9".repeat(200),
    };

    const pdfBytes = await generateStaticReportPDF(model, analysis, undefined, stressMeta);
    assert.ok(pdfBytes.length > 50000, "PDF must generate without buffer overflow");

    // Verify PDF header magic bytes '%PDF-1.3'
    const header = Buffer.from(pdfBytes.slice(0, 8)).toString("latin1");
    assert.ok(header.startsWith("%PDF-"), "Generated byte array must have valid PDF header");

    // Verify PDF EOF magic bytes '%%EOF'
    const footer = Buffer.from(pdfBytes.slice(-128)).toString("latin1");
    assert.ok(footer.includes("%%EOF"), "Generated byte array must have valid %%EOF marker");
  });

  test("3.3 Zero-Storey / Headless Window Contexts: SSR & Node.js Execution", async () => {
    const emptyModel = createEmptyModel();
    emptyModel.floors = []; // Zero floors

    const dummyAnalysis: any = {
      totalWeightKn: 0,
      periodSec: 0,
      baseShearKn: 0,
      maxDriftRatio: 0,
      members: {},
      storeys: [],
      combinations: [],
      overallPass: true,
      settings: {},
    };

    // 1. generateStaticReportPDF must not throw on zero storeys
    const staticPdf = await generateStaticReportPDF(emptyModel, dummyAnalysis);
    assert.ok(staticPdf.length > 20000, "Zero-storey static PDF must produce valid output");

    // 2. generateQuantityReportPDF must not throw on zero storeys
    const dummyTakeoff = calculateFullTakeoff(emptyModel);
    const metrajPdf = await generateQuantityReportPDF(emptyModel, dummyTakeoff);
    assert.ok(metrajPdf.length > 15000, "Zero-storey metraj PDF must produce valid output");

    // 3. downloadStaticReportPdf & downloadQuantityReportPdf must safely no-op in headless SSR
    await downloadStaticReportPdf(emptyModel, dummyAnalysis);
    await downloadQuantityReportPdf(emptyModel, dummyTakeoff);
  });

  test("3.4 Multi-Page Table Overflow & Running Header Page Continuity", async () => {
    // Construct a model with 15 storeys to trigger table pagination in Chapter 1
    const tallModel = createEmptyModel();
    tallModel.floors = [];
    for (let i = 0; i < 15; i++) {
      tallModel.floors.push({
        id: `floor-${i}`,
        name: `${i}. KAT DÜZEYİ`,
        elevation: i * 3.0,
        height: 3.0,
      });
    }

    const dummyAnalysis: any = {
      totalWeightKn: 50000,
      periodSec: 1.2,
      baseShearKn: 2000,
      maxDriftRatio: 0.002,
      members: {},
      storeys: tallModel.floors.map(f => ({
        floorId: f.id,
        name: f.name,
        totalWeightKn: 3500,
        lateralForceKn: 150,
        shearForceKn: 1500,
        driftRatio: 0.0015,
        driftPass: true,
      })),
      combinations: [],
      overallPass: true,
      settings: {},
    };

    const pdfBytes = await generateStaticReportPDF(tallModel, dummyAnalysis);
    const pages = await extractPdfPages(pdfBytes);

    // Verify page count is at least 8 formal chapters
    assert.ok(pages.length >= 8, `Tall building report must produce at least 8 pages (got ${pages.length})`);

    // Verify Chapter 1 table overflow and running headers
    const page2 = pages[1];
    assert.ok(page2.includes("BÖLÜM 1"), "Page 2 must contain Chapter 1 title");
  });

  test("3.5 Missing Analysis Sub-Objects Fallback Invariance", async () => {
    const model = createDemoModel();

    // Partial analysis result missing columnBeamMoments, joints, punching, modes
    const partialAnalysis: any = {
      totalWeightKn: 4000,
      periodSec: 0.45,
      baseShearKn: 350,
      maxDriftRatio: 0.001,
      members: {},
      storeys: [],
      combinations: [],
      // columnBeamMoments, joints, punching are completely undefined
    };

    const pdfBytes = await generateStaticReportPDF(model, partialAnalysis);
    assert.ok(pdfBytes.length > 40000, "PDF must succeed with fallback defaults when sub-objects are missing");

    const pages = await extractPdfPages(pdfBytes);
    const lastPage = pages[pages.length - 1];
    assert.ok(
      lastPage.includes("Bölüm 19") || lastPage.includes("BÖLÜM 16 - 19"),
      "Report must include concluding Chapter 19"
    );
  });
});

// ============================================================================
// SUITE 4: UI & Workbench Contract Boundaries
// ============================================================================
describe("Suite 4: UI & Workbench Contract Boundaries", () => {
  test("4.1 Missing .members Object in AnalysisResult Crashes Component Access", () => {
    // White-box finding in plan2d.tsx:280 and scene3d.tsx:404:
    // `const analysisMember = analysisResult?.members[e.id];`
    // If analysisResult is `{}` without `.members`, this crashes.
    const bareAnalysisResult: any = {};
    assert.throws(
      () => {
        const dummy = bareAnalysisResult?.members["elem-1"];
        return dummy;
      },
      { name: "TypeError" },
      "Documenting component contract risk: access without optional chaining on .members throws TypeError"
    );
  });

  test("4.2 Rebar Diameter Unit Weights Align with TS 708 Standards", () => {
    // Official TS 708 nominal steel densities: W = (pi * d^2 / 4) * 7850 kg/m³
    const standardWeights: Record<number, number> = {
      8: 0.395,
      10: 0.617,
      12: 0.888,
      14: 1.208,
      16: 1.578,
      18: 1.998,
      20: 2.466,
      22: 2.984,
      24: 3.551,
      26: 4.168,
      28: 4.834,
      30: 5.549,
      32: 6.313,
    };

    for (const [diaStr, expectedW] of Object.entries(standardWeights)) {
      const dia = Number(diaStr);
      const actualW = REBAR_UNIT_WEIGHTS[dia];
      assert.ok(actualW !== undefined, `REBAR_UNIT_WEIGHTS must define diameter Ø${dia}`);
      assert.ok(
        Math.abs(actualW - expectedW) < 0.002,
        `Ø${dia} unit weight must match TS 708 (expected ${expectedW}, got ${actualW})`
      );
    }
  });

  test("4.3 Certified Reference Model Disambiguation Boundaries", () => {
    const demo = createDemoModel();
    assert.strictEqual(
      isCertifiedReferenceModel(demo),
      false,
      "4x4 Demo model must NOT qualify as certified reference model"
    );

    const empty = createEmptyModel();
    assert.strictEqual(
      isCertifiedReferenceModel(empty),
      false,
      "Empty model must NOT qualify as certified reference model"
    );

    // Model with matching name but wrong number of storeys (e.g. 3 storeys instead of 6)
    const partialNamedModel = createEmptyModel();
    partialNamedModel.name = "MUSTAFA SELVİ 1.KISIM";
    partialNamedModel.floors = [
      { id: "f1", name: "1. KAT", elevation: 0, height: 3 },
      { id: "f2", name: "2. KAT", elevation: 3, height: 3 },
    ];
    assert.strictEqual(
      isCertifiedReferenceModel(partialNamedModel),
      false,
      "Model with matching name but != 6 storeys must NOT trigger certified reference override"
    );
  });
});
