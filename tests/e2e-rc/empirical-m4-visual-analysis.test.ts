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
  cadToThreeCoord,
  cadToThreeDisplacement,
  build3DRibbonData,
  getVertexDisplacement,
  getDisplacementHeatmapColor,
  getMaxDisplacementMagnitude,
  projectRaycastHitToStation,
  type StationData,
} from "../../src/lib/hsyncad/diagram-geometry";
import { PRODUCT_RIBBON_TABS, isAnalysisVisualizationCommand } from "../../src/lib/hsyncad/product-ribbon";
import { runStructuralAnalysis } from "../../src/lib/hsyncad/analysis";
import { createDemoModel } from "../../src/lib/hsyncad/model";

describe("Milestone 4: 2D & 3D Visual Analysis Output & Diagram Rendering", () => {
  // =========================================================================
  // Area 1: 2D Diagram Geometry & Turkish Tension-Face Convention (TS 500 / ideCAD)
  // =========================================================================
  describe("1. 2D Diagram Geometry & Tension-Face Sign Convention", () => {
    test("1.1 Canonical tension-face normal is invariant to drawing direction", () => {
      // Beam drawn Left-to-Right: (0, 0) to (5, 0)
      const normLR = computeTensionFaceNormal(5, 0);
      assert.ok(Math.abs(normLR.nx) < 1e-6, "nx should be ~0 for horizontal beam L->R");
      assert.ok(Math.abs(normLR.ny - 1.0) < 1e-6, "ny should be +1 (pointing up) for canonical normal");

      // Beam drawn Right-to-Left: (5, 0) to (0, 0)
      const normRL = computeTensionFaceNormal(-5, 0);
      assert.ok(Math.abs(normRL.nx) < 1e-6, "nx should be ~0 for horizontal beam R->L");
      assert.ok(Math.abs(normRL.ny - 1.0) < 1e-6, "ny should also be +1 (canonical normal points up)");
    });

    test("1.2 Tension-face moment rule: sagging (M3 > 0) draws below beam, hogging (M3 < 0) draws above", () => {
      const start = { x: 0, y: 5 };
      const end = { x: 6, y: 5 };

      // 11 stations with parabolic moment: negative at supports, positive at midspan
      // e.g. M(0) = -30 kNm, M(L/2) = +50 kNm, M(L) = -30 kNm
      const stations: StationData[] = [];
      for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * 6;
        // Parabola: -30 at ends, +50 at center
        const m = -30 + 80 * (4 * (x / 6) * (1 - x / 6));
        stations.push({ x, M3: m, V2: 10 - 20 * (x / 6), N: -15 });
      }

      // World-to-screen transform where plan +Y maps to screen -Y (standard CAD screen transform)
      const screen = (p: { x: number; y: number }) => ({ x: 100 + p.x * 20, y: 200 - p.y * 20 });
      const scale = 0.01; // 1 kNm = 0.01 m in world units

      const diag = get2DBeamDiagram(start, end, stations, "M3", scale, screen);

      // Support 1 (M3 = -30 kNm, hogging / top tension):
      // Offset formula: offset = -scale * M3 = -0.01 * (-30) = +0.30 m in direction of canonical normal ny (+1).
      // In world coords: y = 5 + 0.30 = 5.30 m (ABOVE beam).
      // In screen coords: y = 200 - 5.30 * 20 = 94 px (higher on screen than baseline y = 200 - 5*20 = 100 px).
      assert.ok(diag.support1.val < 0, "Support 1 moment must be negative (-30 kNm)");
      assert.ok(diag.support1.screen.y < 100, "Support 1 screen y must be above baseline (smaller y in SVG)");

      // Midspan (M3 = +50 kNm, sagging / bottom tension):
      // Offset formula: offset = -scale * M3 = -0.01 * (+50) = -0.50 m in direction of canonical normal ny (+1).
      // In world coords: y = 5 - 0.50 = 4.50 m (BELOW beam).
      // In screen coords: y = 200 - 4.50 * 20 = 110 px (lower on screen than baseline y = 100 px).
      assert.ok(diag.peakSpan.val > 0, "Midspan peak moment must be positive (+50 kNm)");
      assert.ok(diag.peakSpan.screen.y > 100, "Midspan screen y must be below baseline (greater y in SVG)");
    });

    test("1.3 Closed SVG polygon begins at start baseline and closes at end baseline", () => {
      const start = { x: 2, y: 3 };
      const end = { x: 8, y: 3 };
      const stations: StationData[] = Array.from({ length: 11 }, (_, i) => ({
        x: (i / 10) * 6,
        M3: 40 * Math.sin((i / 10) * Math.PI),
        V2: 25 * Math.cos((i / 10) * Math.PI),
        N: -10,
      }));
      const screen = (p: { x: number; y: number }) => ({ x: p.x * 10, y: p.y * 10 });

      const diag = get2DBeamDiagram(start, end, stations, "M3", 0.02, screen);
      assert.ok(diag.polygonPoints.length > 0, "Polygon points string must not be empty");

      const coords = diag.polygonPoints.trim().split(/\s+/);
      // Format: startScreen (1) + 11 station points + endScreen (1) = 13 points total
      assert.equal(coords.length, 13, "Must have exactly 13 point coordinates (start + 11 stations + end)");

      const sStart = screen(start);
      const sEnd = screen(end);
      assert.equal(coords[0], `${sStart.x},${sStart.y}`, "First point must match start baseline screen coordinate");
      assert.equal(coords[coords.length - 1], `${sEnd.x},${sEnd.y}`, "Last point must match end baseline screen coordinate");
    });
  });

  // =========================================================================
  // Area 2: Auto-scaling Calculations & Bounds
  // =========================================================================
  describe("2. Auto-scaling Calculations & Numerical Robustness", () => {
    test("2.1 Diagram auto-scale normalizes peak value to target height (0.60 m)", () => {
      const map: Record<string, StationData[]> = {
        beam1: [
          { x: 0, M3: -120 },
          { x: 2, M3: 150 },
          { x: 4, M3: -100 },
        ],
        beam2: [
          { x: 0, M3: -45 },
          { x: 3, M3: 60 },
        ],
      };
      const scale = calculateAutoDiagramScale(map, "M3", 0.60);
      // Peak absolute moment is 150 kNm.
      // Expected scale: 0.60 / 150 = 0.004 m/kNm.
      assert.ok(Math.abs(scale - 0.004) < 1e-6, `Auto scale must be 0.004, got ${scale}`);
      const peakHeightWorld = 150 * scale;
      assert.ok(Math.abs(peakHeightWorld - 0.60) < 1e-6, "Peak moment height in world must be 0.60 m");
    });

    test("2.2 Diagram auto-scale guards against zero forces with minimum denominator 1.0", () => {
      const map: Record<string, StationData[]> = {
        beam1: [{ x: 0, M3: 0 }, { x: 5, M3: 0 }],
      };
      const scale = calculateAutoDiagramScale(map, "M3", 0.60);
      assert.equal(scale, 0.60, "Scale for zero forces must be 0.60 / 1.0 = 0.60");
    });

    test("2.3 Deformation auto-scale clamps magnification factor between 10x and 2000x", () => {
      // Case A: Very large drift (0.50 m = 500 mm) on a 20 m building
      // raw = (0.06 * 20) / 0.50 = 2.4x -> clamps to 10x
      const scaleMin = calculateAutoDeformationScale({ n1: [0.50, 0, 0, 0, 0, 0] }, 20);
      assert.equal(scaleMin, 10, "Large drift must clamp to lower bound 10x");

      // Case B: Very tiny drift (0.0001 mm = 1e-7 m) on a 20 m building
      // raw = (0.06 * 20) / 1e-7 = 12,000,000x -> clamps to 2000x
      const scaleMax = calculateAutoDeformationScale({ n1: [1e-6, 0, 0, 0, 0, 0] }, 20);
      assert.equal(scaleMax, 2000, "Tiny drift must clamp to upper bound 2000x");

      // Case C: Typical real earthquake drift (8 mm = 0.008 m) on a 25 m tall building
      // raw = (0.06 * 25) / 0.008 = 1.5 / 0.008 = 187.5 -> round = 188x
      const scaleTypical = calculateAutoDeformationScale({ n1: [0.006, 0.005, 0.001, 0, 0, 0] }, 25);
      assert.ok(scaleTypical >= 100 && scaleTypical <= 300, `Typical scale must be ~188x, got ${scaleTypical}`);
    });
  });

  // =========================================================================
  // Area 3: Three.js 3D Coordinate Mapping & Deformed Kinematics
  // =========================================================================
  describe("3. 3D Coordinate Mapping & Deformed Kinematics", () => {
    test("3.1 CAD/FEM coordinates map to Three.js world axes (X -> X, Elevation Z -> Y, Plan Y -> -Z)", () => {
      const cadX = 12.5;
      const cadY = 8.0;
      const cadZ = 3.2; // Elevation

      const [threeX, threeY, threeZ] = cadToThreeCoord(cadX, cadY, cadZ);
      assert.equal(threeX, 12.5, "Three.js X must equal CAD X");
      assert.equal(threeY, 3.2, "Three.js Y must equal CAD Elevation Z");
      assert.equal(threeZ, -8.0, "Three.js Z must equal -CAD Y");
    });

    test("3.2 CAD displacements map correctly to Three.js axes", () => {
      const ux = 0.015; // lateral drift in X (15 mm)
      const uy = 0.020; // lateral drift in Y (20 mm)
      const uz = -0.003; // vertical settlement in Z (-3 mm)

      const [tuX, tuY, tuZ] = cadToThreeDisplacement(ux, uy, uz);
      assert.equal(tuX, 0.015, "Three displacement X must be ux");
      assert.equal(tuY, -0.003, "Three displacement Y must be uz (vertical)");
      assert.equal(tuZ, -0.020, "Three displacement Z must be -uy");
    });

    test("3.3 Scaled displaced vertex calculation matches analytical formula", () => {
      const origCad = { x: 10, y: 5, z: 3 };
      const disp = { ux: 0.01, uy: 0.02, uz: -0.005 };
      const scale = 100;

      const [origThreeX, origThreeY, origThreeZ] = cadToThreeCoord(origCad.x, origCad.y, origCad.z);
      const [duX, duY, duZ] = cadToThreeDisplacement(disp.ux, disp.uy, disp.uz);

      const finalThreeX = origThreeX + scale * duX;
      const finalThreeY = origThreeY + scale * duY;
      const finalThreeZ = origThreeZ + scale * duZ;

      assert.equal(finalThreeX, 10 + 100 * 0.01, "Displaced X = 11.0");
      assert.equal(finalThreeY, 3 + 100 * (-0.005), "Displaced Y = 2.5");
      assert.equal(finalThreeZ, -5 + 100 * (-0.02), "Displaced Z = -7.0");
    });
  });

  // =========================================================================
  // Area 4: 3D Extruded Ribbon Quad Strip Generation
  // =========================================================================
  describe("4. 3D Extruded Ribbon Diagrams", () => {
    test("4.1 Generates exactly 10 quads (20 triangles = 60 vertices) for 11 stations", () => {
      const startCad = { x: 0, y: 0, z: 3 };
      const endCad = { x: 5, y: 0, z: 3 };
      const stations: StationData[] = Array.from({ length: 11 }, (_, i) => ({
        x: (i / 10) * 5,
        M3: 40 * Math.sin((i / 10) * Math.PI),
        V2: 20 * Math.cos((i / 10) * Math.PI),
        N: -12,
      }));

      const ribbon = build3DRibbonData(startCad, endCad, "beam", stations, "M3", 0.01, 0);

      // 10 intervals * 18 floats per quad = 180 floats
      assert.equal(ribbon.meshPositions.length, 180, "Mesh positions must contain 180 floats (60 vertices * 3 coords)");
      // Crest line: 11 stations * 3 floats = 33 floats
      assert.equal(ribbon.crestPositions.length, 33, "Crest line must contain 33 floats (11 points)");
      // Baseline: 11 stations * 3 floats = 33 floats
      assert.equal(ribbon.baselinePositions.length, 33, "Baseline must contain 33 floats (11 points)");
      // End caps: 2 verticals * 2 points * 3 floats = 12 floats
      assert.equal(ribbon.endCapPositions.length, 12, "End caps must contain 12 floats (4 points)");
    });

    test("4.2 Column ribbon extrudes in horizontal plane along local bending axis", () => {
      const startCad = { x: 2, y: 2, z: 0 };
      const endCad = { x: 2, y: 2, z: 3 }; // Vertical column
      const stations: StationData[] = [
        { x: 0, M3: -40 },
        { x: 1.5, M3: 0 },
        { x: 3.0, M3: 40 },
      ];

      const ribbon = build3DRibbonData(startCad, endCad, "column", stations, "M3", 0.01, 0);
      assert.ok(ribbon.meshPositions.length > 0, "Column ribbon mesh must be generated");

      // Verify that extrusion for columns with rotation 0 occurs along local y' (Three.js X axis)
      // Check crest point 0 vs baseline point 0
      const bx = ribbon.baselinePositions[0];
      const by = ribbon.baselinePositions[1];
      const cx = ribbon.crestPositions[0];
      const cy = ribbon.crestPositions[1];

      // Elevation Y must remain unchanged at baseline level
      assert.ok(Math.abs(by - cy) < 1e-6, "Column ribbon extrusion must be in horizontal plane (equal Y)");
      // Horizontal X offset must reflect moment
      assert.ok(Math.abs(bx - cx) > 0.1, "Horizontal X position must be displaced by moment");
    });
  });

  // =========================================================================
  // Area 5: Station Linear Interpolation & Probing
  // =========================================================================
  describe("5. Force Station Linear Interpolation & Probing", () => {
    test("5.1 Interpolates exact midspan values at t = 0.50 from 11 stations", () => {
      const stations: StationData[] = Array.from({ length: 11 }, (_, i) => ({
        x: i * 0.5, // 0 to 5.0 m
        M3: i * 10,  // 0, 10, 20, ..., 100 kNm
        V2: 50 - i * 10,
        N: -20 + i * 2,
      }));

      const mid = interpolateStationForces(stations, 0.5);
      assert.equal(mid.x, 2.5, "Span distance at t = 0.5 must be 2.5 m");
      assert.equal(mid.M3, 50, "M3 at t = 0.5 must be 50 kNm");
      assert.equal(mid.V2, 0, "V2 at t = 0.5 must be 0 kN");
      assert.equal(mid.N, -10, "N at t = 0.5 must be -10 kN");
    });

    test("5.2 Project point to segment finds closest station fraction t", () => {
      const a = { x: 0, y: 0 };
      const b = { x: 10, y: 0 };
      const cursor = { x: 7.5, y: 0.2 }; // Near x = 7.5 m

      const result = projectPointToSegment(cursor, a, b);
      assert.ok(Math.abs(result.t - 0.75) < 1e-6, "Span fraction t must be 0.75");
      assert.ok(Math.abs(result.proj.x - 7.5) < 1e-6, "Projected X must be 7.5");
      assert.ok(Math.abs(result.proj.y - 0.0) < 1e-6, "Projected Y must be 0.0");
      assert.ok(Math.abs(result.distance - 0.2) < 1e-6, "Perpendicular distance must be 0.2 m");
    });
  });

  // =========================================================================
  // Area 6: DCR Color Grading & Capacity Ratio Standards
  // =========================================================================
  describe("6. DCR Capacity Heatmap Color Mapping", () => {
    test("6.1 Maps capacity ratios to standard Turkish civil engineering colors", () => {
      // Safe (DCR <= 0.50): Emerald green
      assert.equal(getDcrColor(0.35), "#22c55e");
      assert.equal(getDcrColorHex(0.35), 0x22c55e);

      // Safe (0.50 < DCR <= 0.70): Lime green
      assert.equal(getDcrColor(0.65), "#84cc16");
      assert.equal(getDcrColorHex(0.65), 0x84cc16);

      // Moderate (0.70 < DCR <= 0.90): Yellow
      assert.equal(getDcrColor(0.85), "#eab308");
      assert.equal(getDcrColorHex(0.85), 0xeab308);

      // Near limit (0.90 < DCR <= 1.00): Amber/Orange
      assert.equal(getDcrColor(0.95), "#f97316");
      assert.equal(getDcrColorHex(0.95), 0xf97316);

      // Over capacity (DCR > 1.00): Crimson red
      assert.equal(getDcrColor(1.05), "#ef4444");
      assert.equal(getDcrColorHex(1.05), 0xef4444);
    });
  });

  // =========================================================================
  // Area 7: Ribbon Command 11838 Preservation & Wiring
  // =========================================================================
  describe("7. Ribbon Command 11838 Preservation & Wiring", () => {
    test("7.1 Command 11838 is explicitly preserved in PRODUCT_RIBBON_TABS", () => {
      function collectCommands(cmds: any[]): any[] {
        return cmds.flatMap(c => [c, ...collectCommands(c.children || [])]);
      }
      const allCommands = PRODUCT_RIBBON_TABS.flatMap(t => t.panels.flatMap(p => collectCommands(p.commands)));
      const cmd11838 = allCommands.find(c => c.commandId === 11838);

      assert.ok(cmd11838, "Command 11838 (CM_VISUALIZATION_FRAME_AXIAL_FORCE) must exist in PRODUCT_RIBBON_TABS");
      assert.equal(cmd11838.symbol, "CM_VISUALIZATION_FRAME_AXIAL_FORCE");
      assert.equal(cmd11838.label, "Eksenel Kuvvet");
    });

    test("7.2 isAnalysisVisualizationCommand accurately classifies all M4 visualization command IDs", () => {
      assert.ok(isAnalysisVisualizationCommand(11838), "11838 must be recognized as visualization command");
      assert.ok(isAnalysisVisualizationCommand(11839), "11839 (Shear V2) must be recognized");
      assert.ok(isAnalysisVisualizationCommand(11840), "11840 (Moment M3) must be recognized");
      assert.ok(isAnalysisVisualizationCommand(11820), "11820 (Structure Wireframe) must be recognized");
      assert.ok(isAnalysisVisualizationCommand(12109), "12109 (DCR Capacity) must be recognized");
      assert.ok(!isAnalysisVisualizationCommand(99999), "Non-existent command must return false");
      assert.ok(!isAnalysisVisualizationCommand(null), "Null command must return false");
    });
  });

  // =========================================================================
  // Area 8: Full End-to-End Analysis to Visual Rendering Pipeline
  // =========================================================================
  describe("8. Full End-to-End Analysis to Visual Rendering Pipeline", () => {
    test("8.1 runStructuralAnalysis produces valid member stations, displacements, and 2D/3D visual output", () => {
      const model = createDemoModel();
      const analysis = runStructuralAnalysis(model);

      assert.ok(analysis.overallPass !== undefined, "Analysis must have overallPass");
      assert.ok(Object.keys(analysis.memberStations).length > 0, "Member stations must be populated");
      assert.ok(Object.keys(analysis.displacements).length > 0, "Displacements must be populated");

      // Verify at least one beam has 11 stations
      const firstBeamId = Object.keys(analysis.memberStations)[0];
      const stations = analysis.memberStations[firstBeamId];
      assert.equal(stations.length, 11, "Member must have exactly 11 stations (0..10)");

      // Test 2D diagram generation from real analysis stations
      const screen = (p: { x: number; y: number }) => ({ x: p.x * 20, y: p.y * 20 });
      const diag = get2DBeamDiagram({ x: 0, y: 0 }, { x: 4, y: 0 }, stations, "M3", 0.01, screen);
      assert.ok(diag.polygonPoints.length > 0, "Real analysis stations must generate non-empty SVG polygon points");

      // Test 3D ribbon generation from real analysis stations
      const ribbon = build3DRibbonData({ x: 0, y: 0, z: 3 }, { x: 4, y: 0, z: 3 }, "beam", stations, "M3", 0.01, 0);
      assert.ok(ribbon.meshPositions.length > 0, "Real analysis stations must generate non-empty 3D ribbon mesh");

      // Test DCR calculation
      const member = analysis.members[firstBeamId];
      assert.ok(member.capacityRatio >= 0, "Capacity ratio must be non-negative");
      const dcrColor = getDcrColor(member.capacityRatio);
      assert.ok(dcrColor.startsWith("#"), "DCR color must be a valid hex string");
    });
  });

  // =========================================================================
  // Area 9: Multi-Storey Elevation-Dependent Vertex Displacement Kinematics
  // =========================================================================
  describe("9. Multi-Storey Elevation-Dependent Vertex Displacement Kinematics", () => {
    const mockAnalysis: any = {
      floorDiaphragms: [
        {
          floorId: "F1",
          floorName: "Kat 1",
          elevation: 3.0,
          height: 3.0,
          centerX: 10.0,
          centerY: 8.0,
          displacementX: 0.012, // 12 mm
          displacementY: 0.004, // 4 mm
          rotationZ: 0.0003,    // 0.3 mrad
        },
        {
          floorId: "F2",
          floorName: "Kat 2",
          elevation: 6.0,
          height: 3.0,
          centerX: 10.0,
          centerY: 8.0,
          displacementX: 0.024, // 24 mm
          displacementY: 0.008, // 8 mm
          rotationZ: 0.0006,    // 0.6 mrad
        },
        {
          floorId: "F3",
          floorName: "Kat 3",
          elevation: 9.0,
          height: 3.0,
          centerX: 10.0,
          centerY: 8.0,
          displacementX: 0.032, // 32 mm
          displacementY: 0.011, // 11 mm
          rotationZ: 0.0008,    // 0.8 mrad
        },
      ],
      displacements: {
        "N_discrete_1": [0.015, 0.005, -0.002, 0, 0, 0],
      },
      femOutput: {
        nodes: [
          { id: "N_discrete_1", x: 5.0, y: 4.0, z: 3.0 },
        ],
      },
    };

    test("9.1 Ground and foundation level (Z <= 0) strictly yields zero displacement", () => {
      const atBase = getVertexDisplacement(10, 8, 0.0, mockAnalysis);
      assert.deepEqual(atBase, [0, 0, 0], "Ground level Z=0 must have zero displacement");

      const atSubBase = getVertexDisplacement(10, 8, -1.5, mockAnalysis);
      assert.deepEqual(atSubBase, [0, 0, 0], "Substructure Z < 0 must have zero displacement");
    });

    test("9.2 Intermediate elevation below storey 1 interpolates linearly from ground (Z=0) to storey 1", () => {
      // At Z = 1.5 m (halfway between 0 and 3.0 m, alpha = 0.5)
      // At center of rigidity (10, 8):
      // Storey 1 translation: ux = 0.012, uy = 0.004
      // Interpolated at alpha = 0.5: ux = 0.006, uy = 0.002
      const midGround = getVertexDisplacement(10.0, 8.0, 1.5, mockAnalysis);
      assert.ok(Math.abs(midGround[0] - 0.006) < 1e-6, "ux at Z=1.5 must be 0.006 m");
      assert.ok(Math.abs(midGround[1] - 0.002) < 1e-6, "uy at Z=1.5 must be 0.002 m");
      assert.equal(midGround[2], 0, "uz must be 0 for diaphragm translation");
    });

    test("9.3 Multi-storey elevation-dependent differential drift between Storey 1 and Storey 2", () => {
      // Storey 1 (Z = 3.0 m) at (10, 8):
      const dispF1 = getVertexDisplacement(10.0, 8.0, 3.0, mockAnalysis);
      assert.ok(Math.abs(dispF1[0] - 0.012) < 1e-6, "Storey 1 ux must be 0.012 m");

      // Mid-height between Storey 1 and Storey 2 (Z = 4.5 m, alpha = 0.5):
      // Interpolated translation: (0.012 + 0.024) / 2 = 0.018 m
      const dispMid = getVertexDisplacement(10.0, 8.0, 4.5, mockAnalysis);
      assert.ok(Math.abs(dispMid[0] - 0.018) < 1e-6, "Mid-storey ux must be 0.018 m");

      // Storey 2 (Z = 6.0 m) at (10, 8):
      const dispF2 = getVertexDisplacement(10.0, 8.0, 6.0, mockAnalysis);
      assert.ok(Math.abs(dispF2[0] - 0.024) < 1e-6, "Storey 2 ux must be 0.024 m");

      // Verify strictly increasing displacement with height (genuine multi-storey kinematics)
      assert.ok(dispF2[0] > dispMid[0] && dispMid[0] > dispF1[0], "Displacement must increase monotonically with elevation");
    });

    test("9.4 Diaphragm torsional rotation induces differential drift along floor plan", () => {
      // At Storey 2 (Z = 6.0 m), dia.ux = 0.024, dia.uy = 0.008, rz = 0.0006, center = (10, 8)
      // At point A = (10, 12) (offset dy = +4 m):
      // ux = 0.024 - 0.0006 * 4 = 0.0216 m
      const ptA = getVertexDisplacement(10.0, 12.0, 6.0, mockAnalysis);
      assert.ok(Math.abs(ptA[0] - 0.0216) < 1e-6, "Torsion must reduce ux at top edge (+Y offset)");

      // At point B = (10, 4) (offset dy = -4 m):
      // ux = 0.024 - 0.0006 * (-4) = 0.0264 m
      const ptB = getVertexDisplacement(10.0, 4.0, 6.0, mockAnalysis);
      assert.ok(Math.abs(ptB[0] - 0.0264) < 1e-6, "Torsion must increase ux at bottom edge (-Y offset)");
    });

    test("9.5 Discrete joint lookup takes precedence when within tolerance", () => {
      // Node N_discrete_1 at (5.0, 4.0, 3.0) with disp [0.015, 0.005, -0.002]
      const discrete = getVertexDisplacement(5.005, 4.005, 3.002, mockAnalysis);
      assert.deepEqual(discrete, [0.015, 0.005, -0.002], "Node-level displacement must be retrieved for matching joint");
    });
  });

  // =========================================================================
  // Area 10: Smooth Scientific Displacement Contour Heatmap Coloration
  // =========================================================================
  describe("10. Smooth Scientific Displacement Contour Heatmap Coloration", () => {
    test("10.1 Maps normalized displacement rho to scientific colors at key control points", () => {
      // rho = 0.00: Deep Blue [0.1, 0.4, 0.95]
      const c0 = getDisplacementHeatmapColor(0.0);
      assert.ok(Math.abs(c0[0] - 0.1) < 1e-4 && Math.abs(c0[1] - 0.4) < 1e-4 && Math.abs(c0[2] - 0.95) < 1e-4);

      // rho = 0.25: Cyan [0.1, 0.85, 0.95]
      const c25 = getDisplacementHeatmapColor(0.25);
      assert.ok(Math.abs(c25[0] - 0.1) < 1e-4 && Math.abs(c25[1] - 0.85) < 1e-4 && Math.abs(c25[2] - 0.95) < 1e-4);

      // rho = 0.50: Green [0.2, 0.8, 0.2]
      const c50 = getDisplacementHeatmapColor(0.50);
      assert.ok(Math.abs(c50[0] - 0.2) < 1e-4 && Math.abs(c50[1] - 0.8) < 1e-4 && Math.abs(c50[2] - 0.2) < 1e-4);

      // rho = 0.75: Yellow [0.9, 0.8, 0.1]
      const c75 = getDisplacementHeatmapColor(0.75);
      assert.ok(Math.abs(c75[0] - 0.9) < 1e-4 && Math.abs(c75[1] - 0.8) < 1e-4 && Math.abs(c75[2] - 0.1) < 1e-4);

      // rho = 1.00: Red [0.9, 0.2, 0.1]
      const c100 = getDisplacementHeatmapColor(1.0);
      assert.ok(Math.abs(c100[0] - 0.9) < 1e-4 && Math.abs(c100[1] - 0.2) < 1e-4 && Math.abs(c100[2] - 0.1) < 1e-4);
    });

    test("10.2 Continuous smooth transitions across interval boundaries without color step discontinuities", () => {
      // Test continuity at rho = 0.25 (Cyan)
      const c25Minus = getDisplacementHeatmapColor(0.24999);
      const c25Plus = getDisplacementHeatmapColor(0.25001);
      assert.ok(Math.abs(c25Minus[0] - c25Plus[0]) < 1e-3);
      assert.ok(Math.abs(c25Minus[1] - c25Plus[1]) < 1e-3);
      assert.ok(Math.abs(c25Minus[2] - c25Plus[2]) < 1e-3);

      // Test continuity at rho = 0.50 (Green)
      const c50Minus = getDisplacementHeatmapColor(0.49999);
      const c50Plus = getDisplacementHeatmapColor(0.50001);
      assert.ok(Math.abs(c50Minus[0] - c50Plus[0]) < 1e-3);
      assert.ok(Math.abs(c50Minus[1] - c50Plus[1]) < 1e-3);
      assert.ok(Math.abs(c50Minus[2] - c50Plus[2]) < 1e-3);

      // Test continuity at rho = 0.75 (Yellow)
      const c75Minus = getDisplacementHeatmapColor(0.74999);
      const c75Plus = getDisplacementHeatmapColor(0.75001);
      assert.ok(Math.abs(c75Minus[0] - c75Plus[0]) < 1e-3);
      assert.ok(Math.abs(c75Minus[1] - c75Plus[1]) < 1e-3);
      assert.ok(Math.abs(c75Minus[2] - c75Plus[2]) < 1e-3);
    });

    test("10.3 getMaxDisplacementMagnitude extracts maximum resultant drift across diaphragms and nodes", () => {
      const mockResult: any = {
        floorDiaphragms: [
          { displacementX: 0.015, displacementY: 0.020 }, // hypot = 0.025 m
        ],
        displacements: {
          "N1": [0.010, 0.010, 0.010], // hypot = ~0.0173 m
          "N2": [0.030, 0.040, 0.000], // hypot = 0.050 m
        },
      };
      const maxMag = getMaxDisplacementMagnitude(mockResult);
      assert.ok(Math.abs(maxMag - 0.050) < 1e-6, "Maximum displacement magnitude must be 0.050 m");
    });
  });

  // =========================================================================
  // Area 11: 3D Raycasting Continuous Station Probing along Member Axis
  // =========================================================================
  describe("11. 3D Raycasting Continuous Station Probing", () => {
    test("11.1 Beam axis raycast projection dynamically computes station fraction t in [0, 1] and coordinate x", () => {
      const beam = {
        type: "beam",
        start: { x: 0, y: 0 },
        end: { x: 8, y: 0 },
      };
      const floor = { elevation: 0, height: 3.0 };
      // Beam in Three.js coordinates runs from (0, 3, 0) to (8, 3, 0) along +X

      // Hit at 25% along span: (2.0, 3.0, 0)
      const hit25 = projectRaycastHitToStation({ x: 2.0, y: 3.0, z: 0 }, beam, floor);
      assert.ok(Math.abs(hit25.t - 0.25) < 1e-6, "t must be 0.25");
      assert.ok(Math.abs(hit25.x - 2.0) < 1e-6, "x must be 2.0 m");
      assert.equal(hit25.L, 8.0, "Beam span length must be 8.0 m");

      // Hit at 50% midspan: (4.0, 3.0, 0)
      const hit50 = projectRaycastHitToStation({ x: 4.0, y: 3.0, z: 0 }, beam, floor);
      assert.ok(Math.abs(hit50.t - 0.50) < 1e-6, "t must be 0.50");
      assert.ok(Math.abs(hit50.x - 4.0) < 1e-6, "x must be 4.0 m");

      // Hit at 75% along span: (6.0, 3.0, 0)
      const hit75 = projectRaycastHitToStation({ x: 6.0, y: 3.0, z: 0 }, beam, floor);
      assert.ok(Math.abs(hit75.t - 0.75) < 1e-6, "t must be 0.75");
      assert.ok(Math.abs(hit75.x - 6.0) < 1e-6, "x must be 6.0 m");
    });

    test("11.2 Column axis raycast projection computes height fraction from bottom to top", () => {
      const col = {
        type: "column",
        position: { x: 4, y: 5 },
        height: 3.5,
      };
      const floor = { elevation: 3.0, height: 3.5 };
      // Column bottom in Three.js: (4, 3.0, -5), top: (4, 6.5, -5)

      // Hit near bottom (Y = 3.0): t = 0
      const hitBottom = projectRaycastHitToStation({ x: 4, y: 3.0, z: -5 }, col, floor);
      assert.ok(Math.abs(hitBottom.t - 0.0) < 1e-6, "Bottom hit must yield t=0");
      assert.ok(Math.abs(hitBottom.x - 0.0) < 1e-6, "x must be 0 at bottom");

      // Hit at 70% height: Y = 3.0 + 0.70 * 3.5 = 5.45
      const hit70 = projectRaycastHitToStation({ x: 4, y: 5.45, z: -5 }, col, floor);
      assert.ok(Math.abs(hit70.t - 0.70) < 1e-6, "70% height hit must yield t=0.70");
      assert.ok(Math.abs(hit70.x - 2.45) < 1e-6, "x must be 2.45 m");
      assert.equal(hit70.L, 3.5, "Column length must be 3.5 m");
    });

    test("11.3 Raycast hit outside member extremities is clamped to [0, 1]", () => {
      const beam = {
        type: "beam",
        start: { x: 2, y: 0 },
        end: { x: 6, y: 0 },
      };
      const floor = { elevation: 0, height: 3.0 };

      // Hit before start: (-1.0, 3.0, 0)
      const hitBefore = projectRaycastHitToStation({ x: -1.0, y: 3.0, z: 0 }, beam, floor);
      assert.equal(hitBefore.t, 0.0, "Before-start hit must clamp to 0");
      assert.equal(hitBefore.x, 0.0, "x must clamp to 0");

      // Hit after end: (9.0, 3.0, 0)
      const hitAfter = projectRaycastHitToStation({ x: 9.0, y: 3.0, z: 0 }, beam, floor);
      assert.equal(hitAfter.t, 1.0, "After-end hit must clamp to 1");
      assert.equal(hitAfter.x, 4.0, "x must clamp to L = 4.0 m");
    });

    test("11.4 Continuous station probing emits distinct internal forces across span", () => {
      const stations: StationData[] = [
        { x: 0.0, M3: -45, V2: 60, N: -15 },
        { x: 2.0, M3: 15, V2: 30, N: -15 },
        { x: 4.0, M3: 45, V2: 0, N: -15 },
        { x: 6.0, M3: 15, V2: -30, N: -15 },
        { x: 8.0, M3: -45, V2: -60, N: -15 },
      ];
      const beam = { type: "beam", start: { x: 0, y: 0 }, end: { x: 8, y: 0 } };
      const floor = { elevation: 0, height: 3.0 };

      // Hover at left support (t = 0):
      const pSupport = projectRaycastHitToStation({ x: 0, y: 3, z: 0 }, beam, floor);
      const fSupport = interpolateStationForces(stations, pSupport.t);
      assert.equal(fSupport.M3, -45, "Support moment must be -45 kNm");
      assert.equal(fSupport.V2, 60, "Support shear must be 60 kN");

      // Hover at midspan (t = 0.5):
      const pMid = projectRaycastHitToStation({ x: 4, y: 3, z: 0 }, beam, floor);
      const fMid = interpolateStationForces(stations, pMid.t);
      assert.equal(fMid.M3, 45, "Midspan moment must be +45 kNm");
      assert.equal(fMid.V2, 0, "Midspan shear must be 0 kN");

      // Moments and shears must differ dynamically between support and midspan
      assert.notEqual(fSupport.M3, fMid.M3, "Probing forces must be continuous and dynamic along member");
      assert.notEqual(fSupport.V2, fMid.V2);
    });
  });

  // =========================================================================
  // Area 12: Single-Station & Edge-Case Defensive Robustness
  // =========================================================================
  describe("12. Single-Station & Edge-Case Defensive Robustness", () => {
    test("12.1 Empty station array returns all-zero forces without exception", () => {
      const res = interpolateStationForces([], 0.5);
      assert.deepEqual(res, { x: 0, N: 0, V2: 0, V3: 0, T: 0, M2: 0, M3: 0 });
    });

    test("12.2 Single-station array returns station values without TypeError", () => {
      const single: StationData[] = [{ x: 1.5, M3: 35.5, V2: 18.2, N: -8.0 }];
      const res = interpolateStationForces(single, 0.5);
      assert.equal(res.x, 1.5);
      assert.equal(res.M3, 35.5);
      assert.equal(res.V2, 18.2);
      assert.equal(res.N, -8.0);
    });
  });
});
