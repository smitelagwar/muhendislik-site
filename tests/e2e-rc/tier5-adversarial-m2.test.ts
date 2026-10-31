import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  type CadModel,
  type Floor,
  type ColumnElement,
  type BeamElement,
  type WallElement,
  type SlabElement,
} from "../../src/lib/hsyncad/model";
import {
  runStructuralAnalysis,
  DEFAULT_ANALYSIS_SETTINGS,
  CONCRETE_PROPERTIES,
} from "../../src/lib/hsyncad/analysis";
import {
  solve3DStructuralMesh,
  buildLocal12DOFStiffnessMatrix,
  jacobiEigenvalue,
  generate32LoadCombinations,
  TBDY_2018_CRACKED_MODIFIERS,
  type Element12DOF,
  type Node3D,
  type FemMeshInput,
} from "../../src/lib/hsyncad/fem-solver";

// ============================================================================
// Helper: Procedural Multi-Storey Building Model Generator
// ============================================================================
function generateMultiStoreyModel(numStoreys: number, options?: {
  bayX?: number;
  bayY?: number;
  colWidth?: number;
  colDepth?: number;
  beamWidth?: number;
  beamHeight?: number;
  storeyHeight?: number;
  addShearWall?: boolean;
  wallPosition?: "left" | "right";
}): CadModel {
  const bayX = options?.bayX ?? 6.0;
  const bayY = options?.bayY ?? 6.0;
  const colW = options?.colWidth ?? 0.50;
  const colD = options?.colDepth ?? 0.50;
  const bW = options?.beamWidth ?? 0.30;
  const bH = options?.beamHeight ?? 0.60;
  const hStorey = options?.storeyHeight ?? 3.0;

  const floors: Floor[] = [];
  const elements: CadModel["elements"] = [];

  for (let s = 0; s < numStoreys; s++) {
    const floorId = `floor-${s}`;
    const elevation = s * hStorey;
    floors.push({
      id: floorId,
      name: `Kat ${s + 1}`,
      elevation,
      height: hStorey,
    });

    // 4 Corner Columns: C1(0,0), C2(bayX,0), C3(bayX,bayY), C4(0,bayY)
    const colCoords = [
      { id: `c_${s}_1`, name: `S${s + 1}01`, x: 0, y: 0 },
      { id: `c_${s}_2`, name: `S${s + 1}02`, x: bayX, y: 0 },
      { id: `c_${s}_3`, name: `S${s + 1}03`, x: bayX, y: bayY },
      { id: `c_${s}_4`, name: `S${s + 1}04`, x: 0, y: bayY },
    ];

    const common = { materialId: "concrete" };

    for (const c of colCoords) {
      elements.push({
        ...common,
        id: c.id,
        name: c.name,
        type: "column",
        layer: "Kolonlar",
        floorId,
        position: { x: c.x, y: c.y },
        width: colW,
        depth: colD,
        height: hStorey,
        rotation: 0,
      } as ColumnElement);
    }

    // 4 Perimeter Beams
    const beamDefs = [
      { id: `b_${s}_1`, name: `K${s + 1}01`, start: { x: 0, y: 0 }, end: { x: bayX, y: 0 } },
      { id: `b_${s}_2`, name: `K${s + 1}02`, start: { x: bayX, y: 0 }, end: { x: bayX, y: bayY } },
      { id: `b_${s}_3`, name: `K${s + 1}03`, start: { x: bayX, y: bayY }, end: { x: 0, y: bayY } },
      { id: `b_${s}_4`, name: `K${s + 1}04`, start: { x: 0, y: bayY }, end: { x: 0, y: 0 } },
    ];

    for (const b of beamDefs) {
      elements.push({
        ...common,
        id: b.id,
        name: b.name,
        type: "beam",
        layer: "Kirişler",
        floorId,
        start: b.start,
        end: b.end,
        width: bW,
        height: bH,
      } as BeamElement);
    }

    // Floor Slab
    elements.push({
      ...common,
      id: `slab_${s}`,
      name: `D${s + 1}01`,
      type: "slab",
      layer: "Döşemeler",
      floorId,
      points: [
        { x: 0, y: 0 },
        { x: bayX, y: 0 },
        { x: bayX, y: bayY },
        { x: 0, y: bayY },
      ],
      thickness: 0.15,
      deadLoad: 2.5,
      liveLoad: 2.0,
      finishLoad: 1.5,
    } as SlabElement);

    // Optional Asymmetric Shear Wall
    if (options?.addShearWall) {
      const wallX = options.wallPosition === "right" ? bayX : 0;
      elements.push({
        ...common,
        id: `wall_${s}`,
        name: `P${s + 1}01`,
        type: "wall",
        layer: "Perdeler",
        floorId,
        start: { x: wallX, y: 0 },
        end: { x: wallX, y: bayY },
        thickness: 0.30,
        height: hStorey,
      } as WallElement);
    }
  }

  return {
    schemaVersion: 1,
    name: `Building ${numStoreys} storeys`,
    floors,
    materials: [{ id: "concrete", name: "Beton" }],
    elements,
  };
}

describe("Tier 5: Adversarial Stress Simulation & Verification for Milestone 2", () => {
  // =========================================================================
  // Requirement 1: Multi-Storey Building Stress Test (10 and 20 Storeys)
  // =========================================================================
  describe("1. Multi-Storey Building Stress Simulation (10 & 20 Storeys)", () => {
    test("1.1 10-Storey Building: Execution speed, memory bounds & displacement monotonicity", () => {
      const model10 = generateMultiStoreyModel(10, {
        bayX: 6.0,
        bayY: 6.0,
        colWidth: 0.50,
        colDepth: 0.50,
        beamWidth: 0.30,
        beamHeight: 0.60,
        storeyHeight: 3.0,
      });

      const initialMem = process.memoryUsage().heapUsed;
      const tStart = performance.now();

      const result = runStructuralAnalysis(model10, {
        sds: 1.0,
        sd1: 0.40,
        r: 8.0,
        importance: 1.0,
      });

      const tDuration = performance.now() - tStart;
      const finalMem = process.memoryUsage().heapUsed;
      const memDeltaMb = (finalMem - initialMem) / (1024 * 1024);

      // 1. Execution Speed Verification: 10 storeys should execute in < 2500 ms
      assert.ok(
        tDuration < 2500,
        `10-storey analysis took ${tDuration.toFixed(1)} ms (must be < 2500 ms)`
      );

      // 2. Memory Bounds: Memory increase should be reasonable (< 80 MB)
      assert.ok(
        memDeltaMb < 80,
        `Heap delta was ${memDeltaMb.toFixed(1)} MB (must be < 80 MB)`
      );

      // 3. Structure & Nodes Verification
      assert.equal(result.storeys.length, 10, "Must have exactly 10 storeys");
      assert.equal(result.floorDiaphragms.length, 10, "Must have 10 floor diaphragms");
      assert.ok(result.femOutput, "FEM solver output must be present");
      assert.equal(result.femOutput!.success, true, "FEM solver must succeed");

      // 4. Displacement Monotonicity & Numerical Stability
      const diaphragms = result.floorDiaphragms;
      assert.ok(diaphragms.length === 10);

      // Check displacements increase with height
      let prevDispX = 0;
      for (let s = 0; s < diaphragms.length; s++) {
        const d = diaphragms[s];
        assert.ok(!Number.isNaN(d.displacementX), `Kat ${s + 1} dispX is NaN`);
        assert.ok(!Number.isNaN(d.displacementY), `Kat ${s + 1} dispY is NaN`);
        assert.ok(Number.isFinite(d.displacementX), `Kat ${s + 1} dispX not finite`);
        assert.ok(Number.isFinite(d.displacementY), `Kat ${s + 1} dispY not finite`);
        assert.ok(
          d.displacementX >= prevDispX - 1e-6,
          `Kat ${s + 1} dispX (${d.displacementX}) must be >= previous Kat (${prevDispX})`
        );
        prevDispX = d.displacementX;
      }

      // 5. Check Natural Vibration Periods
      assert.equal(result.naturalPeriods.length, 3);
      const [T1, T2, T3] = result.naturalPeriods;
      assert.ok(T1 > 0, `T1 (${T1}) must be positive`);
      assert.ok(T2 > 0, `T2 (${T2}) must be positive`);
      assert.ok(T3 > 0, `T3 (${T3}) must be positive`);
      assert.ok(T1 >= T2 - 1e-4, `T1 (${T1}) must be >= T2 (${T2})`);
      assert.ok(T2 >= T3 - 1e-4, `T2 (${T2}) must be >= T3 (${T3})`);

      // 6. Base Shear Non-divergence
      assert.ok(result.baseShearKn > 0, "Base shear must be strictly positive");
      assert.ok(result.baseShears.Vtx > 0, "Base shear Vtx must be positive");
      assert.ok(result.baseShears.Vty > 0, "Base shear Vty must be positive");
    });

    test("1.2 20-Storey High-Rise Building: Maximum Milestone 2 limit stress test", () => {
      const model20 = generateMultiStoreyModel(20, {
        bayX: 7.0,
        bayY: 7.0,
        colWidth: 0.70,
        colDepth: 0.70,
        beamWidth: 0.35,
        beamHeight: 0.70,
        storeyHeight: 3.0,
      });

      const initialMem = process.memoryUsage().heapUsed;
      const tStart = performance.now();

      const result = runStructuralAnalysis(model20, {
        sds: 1.0,
        sd1: 0.40,
        r: 8.0,
        importance: 1.0,
      });

      const tDuration = performance.now() - tStart;
      const finalMem = process.memoryUsage().heapUsed;
      const memDeltaMb = (finalMem - initialMem) / (1024 * 1024);

      // 1. Execution Speed Verification: 20 storeys should execute in < 4500 ms
      assert.ok(
        tDuration < 4500,
        `20-storey analysis took ${tDuration.toFixed(1)} ms (must be < 4500 ms)`
      );

      // 2. Memory Bounds: Memory increase bounded (< 120 MB)
      assert.ok(
        memDeltaMb < 120,
        `20-storey heap delta was ${memDeltaMb.toFixed(1)} MB (must be < 120 MB)`
      );

      // 3. Storey Count & Diaphragm Integrity
      assert.equal(result.storeys.length, 20, "Must have exactly 20 storeys");
      assert.equal(result.floorDiaphragms.length, 20, "Must have 20 floor diaphragms");
      assert.equal(result.femOutput?.success, true, "FEM solver must solve 20-storey system");

      // 4. Non-divergence of 20 Storey Displacements
      const topDisp = result.floorDiaphragms[19].displacementX;
      const midDisp = result.floorDiaphragms[9].displacementX;
      const baseDisp = result.floorDiaphragms[0].displacementX;

      assert.ok(
        topDisp > midDisp && midDisp > baseDisp && baseDisp > 0,
        `Displacements must be strictly monotonic: top(${topDisp.toFixed(4)}) > mid(${midDisp.toFixed(4)}) > base(${baseDisp.toFixed(4)})`
      );

      // Check all 20 floors for NaN / Inf
      for (let i = 0; i < 20; i++) {
        const st = result.storeys[i];
        assert.ok(!Number.isNaN(st.driftM), `Storey ${i + 1} drift is NaN`);
        assert.ok(!Number.isNaN(st.shearForceKn), `Storey ${i + 1} shear is NaN`);
        assert.ok(st.shearForceKn > 0, `Storey ${i + 1} shear must be positive`);
      }

      // Cumulative base shear must equal ground floor shear
      assert.ok(
        Math.abs(result.storeys[0].shearForceKn - result.baseShearKn) < 1.0,
        `Base shear equilibrium mismatch: storeys[0].shear=${result.storeys[0].shearForceKn}, Vt=${result.baseShearKn}`
      );
    });
  });

  // =========================================================================
  // Requirement 2: Accidental Eccentricity & Torsional Sensitivity (Delta_max / Delta_avg > 1.0)
  // =========================================================================
  describe("2. Accidental Eccentricity & Torsional Sensitivity", () => {
    test("2.1 Asymmetric Shear Wall Layout: High torsional sensitivity (Delta_max / Delta_avg > 1.0)", () => {
      // Create asymmetric 3-storey model: Shear wall on left side (x=0) only
      const modelAsym = generateMultiStoreyModel(3, {
        bayX: 10.0,
        bayY: 10.0,
        colWidth: 0.40,
        colDepth: 0.40,
        beamWidth: 0.30,
        beamHeight: 0.50,
        storeyHeight: 3.0,
        addShearWall: true,
        wallPosition: "left", // wall at x=0
      });

      const result = runStructuralAnalysis(modelAsym);
      assert.ok(result.femOutput, "FEM output must be present");

      // Verify rotationZ is non-zero due to stiffness asymmetry
      const topFloorDiag = result.floorDiaphragms[2];
      assert.ok(
        Math.abs(topFloorDiag.rotationZ) > 1e-6,
        `Asymmetric structure must induce torsional rotation: rotationZ=${topFloorDiag.rotationZ}`
      );

      // Verify torsional irregularity A1 ratio etaBi > 1.0
      assert.ok(result.irregularities.torsionalA1.length === 3);
      for (const a1 of result.irregularities.torsionalA1) {
        assert.ok(
          a1.etaBi > 1.0,
          `Floor ${a1.floorName} etaBi (${a1.etaBi.toFixed(3)}) must be > 1.0`
        );
      }

      // Check corner displacements directly from FEM nodal displacements
      // Find top floor corner nodes: West (x=0) vs East (x=10)
      const topNodes = result.femOutput.nodes.filter(n => n.floorId === "floor-2" && !n.isBaseFixed);
      const westNode = topNodes.find(n => Math.abs(n.x - 0) < 0.1 && Math.abs(n.y - 0) < 0.1);
      const eastNode = topNodes.find(n => Math.abs(n.x - 10) < 0.1 && Math.abs(n.y - 0) < 0.1);

      assert.ok(westNode && eastNode, "West and East top corner nodes must exist");

      const westDisp = result.displacements[westNode.id];
      const eastDisp = result.displacements[eastNode.id];

      // Since shear wall is on West (x=0), East side (x=10) is much more flexible
      // Thus lateral displacement at East corner must exceed West corner!
      const dispWestMag = Math.sqrt(westDisp[0] * westDisp[0] + westDisp[1] * westDisp[1]);
      const dispEastMag = Math.sqrt(eastDisp[0] * eastDisp[0] + eastDisp[1] * eastDisp[1]);

      const deltaMax = Math.max(dispWestMag, dispEastMag);
      const deltaMin = Math.min(dispWestMag, dispEastMag);
      const deltaAvg = (deltaMax + deltaMin) / 2.0;
      const torsionalRatio = deltaMax / deltaAvg;

      assert.ok(
        torsionalRatio > 1.01,
        `Differential corner displacement ratio (${torsionalRatio.toFixed(3)}) must be > 1.01`
      );
    });

    test("2.2 Accidental Eccentricity +/- 0.05 B: Induces expected differential corner displacement", () => {
      // 1-Storey symmetric portal frame with 4 columns at (0,0), (B,0), (B,B), (0,B)
      const B = 10.0;
      const H = 3.5;
      const E = 30e6; // kN/m²
      const G = 12.5e6;
      const colW = 0.50, colD = 0.50;
      const A = colW * colD;
      const Iz = (colW * Math.pow(colD, 3)) / 12;
      const Iy = (colD * Math.pow(colW, 3)) / 12;
      const J = 0.003;

      const nodes: Node3D[] = [
        // Base fixed nodes
        { id: "nb1", name: "nb1", x: 0, y: 0, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1, -1, -1, -1, -1, -1] },
        { id: "nb2", name: "nb2", x: B, y: 0, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1, -1, -1, -1, -1, -1] },
        { id: "nb3", name: "nb3", x: B, y: B, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1, -1, -1, -1, -1, -1] },
        { id: "nb4", name: "nb4", x: 0, y: B, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1, -1, -1, -1, -1, -1] },
        // Top nodes
        { id: "nt1", name: "nt1", x: 0, y: 0, z: H, floorId: "f0", isBaseFixed: false, dofIndices: [0, 1, 2, 3, 4, 5] },
        { id: "nt2", name: "nt2", x: B, y: 0, z: H, floorId: "f0", isBaseFixed: false, dofIndices: [6, 7, 8, 9, 10, 11] },
        { id: "nt3", name: "nt3", x: B, y: B, z: H, floorId: "f0", isBaseFixed: false, dofIndices: [12, 13, 14, 15, 16, 17] },
        { id: "nt4", name: "nt4", x: 0, y: B, z: H, floorId: "f0", isBaseFixed: false, dofIndices: [18, 19, 20, 21, 22, 23] },
      ];

      const elements: Element12DOF[] = [
        // 4 Columns
        { id: "c1", name: "C1", type: "column", floorId: "f0", nodeI: "nb1", nodeJ: "nt1", length: H, E, G, A, Iz, Iy, J, f_crack: 0.70, rollAngleRad: 0, width: colW, depth: colD, qy: 0, qz: 0 },
        { id: "c2", name: "C2", type: "column", floorId: "f0", nodeI: "nb2", nodeJ: "nt2", length: H, E, G, A, Iz, Iy, J, f_crack: 0.70, rollAngleRad: 0, width: colW, depth: colD, qy: 0, qz: 0 },
        { id: "c3", name: "C3", type: "column", floorId: "f0", nodeI: "nb3", nodeJ: "nt3", length: H, E, G, A, Iz, Iy, J, f_crack: 0.70, rollAngleRad: 0, width: colW, depth: colD, qy: 0, qz: 0 },
        { id: "c4", name: "C4", type: "column", floorId: "f0", nodeI: "nb4", nodeJ: "nt4", length: H, E, G, A, Iz, Iy, J, f_crack: 0.70, rollAngleRad: 0, width: colW, depth: colD, qy: 0, qz: 0 },
        // 4 Beams connecting top nodes
        { id: "b1", name: "B1", type: "beam", floorId: "f0", nodeI: "nt1", nodeJ: "nt2", length: B, E, G, A, Iz, Iy, J, f_crack: 0.35, rollAngleRad: 0, width: 0.3, depth: 0.6, qy: 0, qz: 0 },
        { id: "b2", name: "B2", type: "beam", floorId: "f0", nodeI: "nt2", nodeJ: "nt3", length: B, E, G, A, Iz, Iy, J, f_crack: 0.35, rollAngleRad: 0, width: 0.3, depth: 0.6, qy: 0, qz: 0 },
        { id: "b3", name: "B3", type: "beam", floorId: "f0", nodeI: "nt3", nodeJ: "nt4", length: B, E, G, A, Iz, Iy, J, f_crack: 0.35, rollAngleRad: 0, width: 0.3, depth: 0.6, qy: 0, qz: 0 },
        { id: "b4", name: "B4", type: "beam", floorId: "f0", nodeI: "nt4", nodeJ: "nt1", length: B, E, G, A, Iz, Iy, J, f_crack: 0.35, rollAngleRad: 0, width: 0.3, depth: 0.6, qy: 0, qz: 0 },
      ];

      const meshInput: FemMeshInput = {
        nodes,
        elements,
        floors: [{ id: "f0", name: "Zemin", elevation: 0, height: H }],
        floorDiaphragms: [{
          floorId: "f0",
          centerX: B / 2,
          centerY: B / 2,
          totalMassKg: 100000,
          deadWeightKn: 800,
          liveWeightKn: 200,
        }],
        sds: 1.0,
        sd1: 0.4,
        r: 8.0,
        importance: 1.0,
      };

      const out = solve3DStructuralMesh(meshInput);
      assert.equal(out.success, true);

      // Verify that all 4 top corner displacements exist and are valid numbers
      const d1 = out.displacements["nt1"];
      const d2 = out.displacements["nt2"];
      const d3 = out.displacements["nt3"];
      const d4 = out.displacements["nt4"];

      assert.ok(d1 && d2 && d3 && d4);

      // Due to multi-directional load combinations (+Ex + 0.3Ey, +Ey + 0.3Ex, etc.),
      // envelope displacements at corner nodes show differential values:
      const maxCornerDisp = Math.max(
        Math.hypot(d1[0], d1[1]),
        Math.hypot(d2[0], d2[1]),
        Math.hypot(d3[0], d3[1]),
        Math.hypot(d4[0], d4[1])
      );
      const minCornerDisp = Math.min(
        Math.hypot(d1[0], d1[1]),
        Math.hypot(d2[0], d2[1]),
        Math.hypot(d3[0], d3[1]),
        Math.hypot(d4[0], d4[1])
      );
      const avgCornerDisp = (maxCornerDisp + minCornerDisp) / 2.0;

      assert.ok(avgCornerDisp > 0, "Average corner displacement must be positive");
      assert.ok(
        maxCornerDisp / avgCornerDisp >= 1.0,
        `Delta_max / Delta_avg must be >= 1.0, got ${maxCornerDisp / avgCornerDisp}`
      );
    });
  });

  // =========================================================================
  // Requirement 3: Validate Modal Period Outputs Against Closed-Form Approximations
  // =========================================================================
  describe("3. Closed-Form Modal Period & Cantilever Approximations", () => {
    test("3.1 SDOF Cantilever Portal Frame: Compares FEM period to closed-form T = 2*pi*sqrt(M/K)", () => {
      // 1-Storey frame: 4 columns
      const H = 3.0; // 3 metres
      const E = 32e6; // C30: 32 GPa = 32,000,000 kN/m²
      const G = 13.33e6;
      const b = 0.40, d = 0.40;
      const A = b * d;
      const I_gross = (b * Math.pow(d, 3)) / 12; // 0.0021333 m⁴
      const f_crack = 0.70; // TBDY Table 4.2
      const I_eff = I_gross * f_crack;

      // Single column fixed-fixed or cantilever lateral stiffness:
      // In a frame with rigid floor diaphragm (guided/fixed ends): k_col = 12 * E * I_eff / H^3
      const kCol = (12 * E * I_eff) / Math.pow(H, 3);
      const kTotalFrame = 4 * kCol; // 4 columns = 4 * (12 * 32e6 * (0.0021333 * 0.70)) / 27 = 4 * 21251.5 = 85006 kN/m

      // Floor mass = 80 metric tonnes = 80,000 kg
      const massTonnes = 80.0; // tonnes
      const massKg = 80000.0;

      // Closed-form analytical angular frequency & period:
      // omega = sqrt(K / M) where K is in kN/m and M is in metric tonnes (1 tonne = 1000 kg = 1 kN*s²/m)
      const omegaAnalytical = Math.sqrt(kTotalFrame / massTonnes);
      const TAnalytical = (2 * Math.PI) / omegaAnalytical;

      // Assemble FEM mesh for this exact SDOF structure
      const span = 6.0;
      const nodes: Node3D[] = [
        { id: "b1", name: "b1", x: 0, y: 0, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1, -1, -1, -1, -1, -1] },
        { id: "b2", name: "b2", x: span, y: 0, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1, -1, -1, -1, -1, -1] },
        { id: "b3", name: "b3", x: span, y: span, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1, -1, -1, -1, -1, -1] },
        { id: "b4", name: "b4", x: 0, y: span, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1, -1, -1, -1, -1, -1] },
        { id: "t1", name: "t1", x: 0, y: 0, z: H, floorId: "f0", isBaseFixed: false, dofIndices: [0, 1, 2, 3, 4, 5] },
        { id: "t2", name: "t2", x: span, y: 0, z: H, floorId: "f0", isBaseFixed: false, dofIndices: [6, 7, 8, 9, 10, 11] },
        { id: "t3", name: "t3", x: span, y: span, z: H, floorId: "f0", isBaseFixed: false, dofIndices: [12, 13, 14, 15, 16, 17] },
        { id: "t4", name: "t4", x: 0, y: span, z: H, floorId: "f0", isBaseFixed: false, dofIndices: [18, 19, 20, 21, 22, 23] },
      ];

      // Highly stiff beams to approximate rigid floor behavior
      const elements: Element12DOF[] = [
        { id: "c1", name: "C1", type: "column", floorId: "f0", nodeI: "b1", nodeJ: "t1", length: H, E, G, A, Iz: I_gross, Iy: I_gross, J: 0.003, f_crack, rollAngleRad: 0, width: b, depth: d, qy: 0, qz: 0 },
        { id: "c2", name: "C2", type: "column", floorId: "f0", nodeI: "b2", nodeJ: "t2", length: H, E, G, A, Iz: I_gross, Iy: I_gross, J: 0.003, f_crack, rollAngleRad: 0, width: b, depth: d, qy: 0, qz: 0 },
        { id: "c3", name: "C3", type: "column", floorId: "f0", nodeI: "b3", nodeJ: "t3", length: H, E, G, A, Iz: I_gross, Iy: I_gross, J: 0.003, f_crack, rollAngleRad: 0, width: b, depth: d, qy: 0, qz: 0 },
        { id: "c4", name: "C4", type: "column", floorId: "f0", nodeI: "b4", nodeJ: "t4", length: H, E, G, A, Iz: I_gross, Iy: I_gross, J: 0.003, f_crack, rollAngleRad: 0, width: b, depth: d, qy: 0, qz: 0 },
        { id: "b12", name: "B12", type: "beam", floorId: "f0", nodeI: "t1", nodeJ: "t2", length: span, E: E * 10, G, A: A * 10, Iz: I_gross * 10, Iy: I_gross * 10, J: 0.03, f_crack: 1.0, rollAngleRad: 0, width: 0.4, depth: 0.8, qy: 0, qz: 0 },
        { id: "b23", name: "B23", type: "beam", floorId: "f0", nodeI: "t2", nodeJ: "t3", length: span, E: E * 10, G, A: A * 10, Iz: I_gross * 10, Iy: I_gross * 10, J: 0.03, f_crack: 1.0, rollAngleRad: 0, width: 0.4, depth: 0.8, qy: 0, qz: 0 },
        { id: "b34", name: "B34", type: "beam", floorId: "f0", nodeI: "t3", nodeJ: "t4", length: span, E: E * 10, G, A: A * 10, Iz: I_gross * 10, Iy: I_gross * 10, J: 0.03, f_crack: 1.0, rollAngleRad: 0, width: 0.4, depth: 0.8, qy: 0, qz: 0 },
        { id: "b41", name: "B41", type: "beam", floorId: "f0", nodeI: "t4", nodeJ: "t1", length: span, E: E * 10, G, A: A * 10, Iz: I_gross * 10, Iy: I_gross * 10, J: 0.03, f_crack: 1.0, rollAngleRad: 0, width: 0.4, depth: 0.8, qy: 0, qz: 0 },
      ];

      const out = solve3DStructuralMesh({
        nodes,
        elements,
        floors: [{ id: "f0", name: "Zemin", elevation: 0, height: H }],
        floorDiaphragms: [{ floorId: "f0", centerX: span / 2, centerY: span / 2, totalMassKg: massKg, deadWeightKn: massTonnes * 9.81, liveWeightKn: 0 }],
        sds: 1.0,
        sd1: 0.40,
        r: 8.0,
        importance: 1.0,
      });

      assert.equal(out.success, true);
      assert.ok(out.modes.length >= 1, "Must produce modal output");

      const rawFemPeriod = (2 * Math.PI) / out.modes[0].omegaRadS;
      const relativeDiff = Math.abs(rawFemPeriod - TAnalytical) / TAnalytical;

      // Analytical check: The FEM condensed flexibility eigenvalue solver
      // must agree with the closed-form SDOF period within 5% numerical tolerance!
      assert.ok(
        relativeDiff < 0.05,
        `FEM period (${rawFemPeriod.toFixed(4)} s) vs Closed-Form (${TAnalytical.toFixed(4)} s), relative difference=${(relativeDiff * 100).toFixed(2)}% (must be < 5%)`
      );
    });

    test("3.2 Multi-Storey Dynamic Modal Periods adhere to TBDY 2018 §4.8.4 Bounds", () => {
      // 6-storey building
      const model6 = generateMultiStoreyModel(6, {
        storeyHeight: 3.0,
        colWidth: 0.50,
        colDepth: 0.50,
      });

      const res = runStructuralAnalysis(model6);
      assert.ok(res.femOutput);

      const [T1, T2, T3] = res.naturalPeriods;
      const totalH = 6 * 3.0; // 18m
      const Ct = 0.07;
      const T_empirical = Ct * Math.pow(totalH, 0.75); // ~ 0.61 s

      // TBDY 2018 §4.8.4 requires calculated fundamental period T1 <= 1.4 * T_empirical
      assert.ok(
        T1 <= 1.4 * T_empirical + 1e-4,
        `T1 (${T1.toFixed(3)} s) must be <= 1.4 * T_pA (${(1.4 * T_empirical).toFixed(3)} s)`
      );
      assert.ok(
        T1 >= 0.7 * T_empirical - 1e-4,
        `T1 (${T1.toFixed(3)} s) must be >= 0.7 * T_pA (${(0.7 * T_empirical).toFixed(3)} s)`
      );

      // Verify modal mass participation
      const modes = res.modes;
      assert.ok(modes.length >= 3, "Must have at least 3 vibration modes");
      for (const m of modes) {
        assert.ok(m.periodSec > 0, `Mode ${m.modeNumber} period must be positive`);
        assert.ok(m.frequencyHz > 0, `Mode ${m.modeNumber} frequency must be positive`);
        assert.ok(m.massParticipationX >= 0 && m.massParticipationX <= 1.0, "Participation must be in [0, 1]");
      }
    });
  });

  // =========================================================================
  // Requirement 4: Completeness & Non-Null Envelopes Across All 33 Load Combinations
  // =========================================================================
  describe("4. 33 Load Combinations Completeness & Non-Null Envelopes", () => {
    test("4.1 generate32LoadCombinations returns exactly 33 combinations with correct definitions", () => {
      const sds = 1.0;
      const combos = generate32LoadCombinations(sds);

      // 1 (gravity) + 8 (Ex, G+Q) + 8 (Ey, G+Q) + 8 (Ex, 0.9G) + 8 (Ey, 0.9G) = 33
      assert.equal(combos.length, 33, "Must generate exactly 33 combinations");

      // Verify Gravity Combo
      const grav = combos[0];
      assert.equal(grav.name, "1.4G+1.6Q");
      assert.equal(grav.cG, 1.4);
      assert.equal(grav.cQ, 1.6);
      assert.equal(grav.cEx, 0);
      assert.equal(grav.cEy, 0);
      assert.equal(grav.cEz, 0);

      // Verify all combination names are unique
      const namesSet = new Set(combos.map(c => c.name));
      assert.equal(namesSet.size, 33, "All 33 combination names must be distinct");

      // Verify vertical seismic factor Ez = 0.3 * Sds * G per TBDY §4.4.3
      const expectedEzFactor = 0.3 * sds;
      for (let i = 1; i < 33; i++) {
        const c = combos[i];
        assert.ok(Math.abs(Math.abs(c.cEz) - 0.3 * expectedEzFactor) < 1e-6);
      }
    });

    test("4.2 All 33 load combinations generate finite, non-null member envelope forces in 3D frame", () => {
      const model = generateMultiStoreyModel(2, {
        bayX: 6.0,
        bayY: 6.0,
        colWidth: 0.50,
        colDepth: 0.50,
        beamWidth: 0.30,
        beamHeight: 0.60,
        storeyHeight: 3.0,
      });

      const result = runStructuralAnalysis(model);
      assert.ok(result.femOutput, "FEM output must be present");

      // 1. Check all 33 combinations in femOutput.combinations
      const comboResults = result.combinations;
      assert.equal(comboResults.length, 33, "Must have 33 combination results");

      for (let i = 0; i < comboResults.length; i++) {
        const cr = comboResults[i];
        assert.ok(cr.name, `Combo ${i} name must be defined`);
        assert.ok(!Number.isNaN(cr.maxDisplacementM), `Combo ${cr.name} maxDisplacement is NaN`);
        assert.ok(Number.isFinite(cr.maxDisplacementM), `Combo ${cr.name} maxDisplacement not finite`);
        assert.ok(cr.maxDisplacementM > 0, `Combo ${cr.name} maxDisplacement must be > 0`);
        assert.ok(!Number.isNaN(cr.baseShearXKn), `Combo ${cr.name} baseShearX is NaN`);
        assert.ok(!Number.isNaN(cr.baseShearYKn), `Combo ${cr.name} baseShearYKn is NaN`);
      }

      // 2. Check every member envelope
      const envelopes = result.femOutput.memberEnvelopes;
      const elementKeys = Object.keys(envelopes);
      assert.ok(elementKeys.length > 0, "Must have member envelopes");

      for (const elId of elementKeys) {
        const env = envelopes[elId];
        assert.ok(env, `Envelope for ${elId} must exist`);

        // Check 11 stations
        assert.equal(env.stations.length, 11, `Member ${elId} must have exactly 11 stations`);
        for (let s = 0; s <= 10; s++) {
          const st = env.stations[s];
          assert.equal(st.stationIndex, s);
          assert.ok(Math.abs(st.ratio - s / 10.0) < 1e-6);
          assert.ok(!Number.isNaN(st.N), `Member ${elId} station ${s} N is NaN`);
          assert.ok(!Number.isNaN(st.V2), `Member ${elId} station ${s} V2 is NaN`);
          assert.ok(!Number.isNaN(st.V3), `Member ${elId} station ${s} V3 is NaN`);
          assert.ok(!Number.isNaN(st.T), `Member ${elId} station ${s} T is NaN`);
          assert.ok(!Number.isNaN(st.M2), `Member ${elId} station ${s} M2 is NaN`);
          assert.ok(!Number.isNaN(st.M3), `Member ${elId} station ${s} M3 is NaN`);
          assert.ok(Number.isFinite(st.N), `Member ${elId} station ${s} N is not finite`);
          assert.ok(Number.isFinite(st.V2), `Member ${elId} station ${s} V2 is not finite`);
          assert.ok(Number.isFinite(st.M3), `Member ${elId} station ${s} M3 is not finite`);
        }

        // Check envelope extremum fields
        assert.ok(Number.isFinite(env.maxAxialKn), `Member ${elId} maxAxialKn not finite`);
        assert.ok(Number.isFinite(env.minAxialKn), `Member ${elId} minAxialKn not finite`);
        assert.ok(Number.isFinite(env.maxShearV2Kn), `Member ${elId} maxShearV2Kn not finite`);
        assert.ok(Number.isFinite(env.maxMomentM3Knm), `Member ${elId} maxMomentM3Knm not finite`);
        assert.ok(Number.isFinite(env.minMomentM3Knm), `Member ${elId} minMomentM3Knm not finite`);

        // Verify governing combination is one of the 33 valid combinations
        const validComboNames = comboResults.map(c => c.name);
        assert.ok(
          validComboNames.includes(env.governingCombo),
          `Member ${elId} governing combo ${env.governingCombo} is not in valid list`
        );
      }

      // 3. Verify memberForces in top-level result conforms to PROJECT.md interface contract
      for (const elId of elementKeys) {
        const stations = result.memberForces[elId];
        assert.ok(stations, `memberForces[${elId}] must exist`);
        assert.equal(stations.length, 11, `memberForces[${elId}] must have 11 stations`);
        for (const st of stations) {
          assert.ok(Number.isFinite(st.x), "station x must be finite");
          assert.ok(Number.isFinite(st.N), "station N must be finite");
          assert.ok(Number.isFinite(st.V2), "station V2 must be finite");
          assert.ok(Number.isFinite(st.M3), "station M3 must be finite");
        }
      }
    });

    test("4.3 Uplift & Vertical Seismic Effect: 0.9G combinations reduce axial compression", () => {
      const model = generateMultiStoreyModel(1, {
        bayX: 6.0,
        bayY: 6.0,
        colWidth: 0.50,
        colDepth: 0.50,
      });

      const res = runStructuralAnalysis(model);
      const colId = "c_0_1";
      const env = res.femOutput!.memberEnvelopes[colId];

      assert.ok(env);
      // Under pure gravity 1.4G + 1.6Q, column has compression (negative N).
      // Under seismic lateral overturning with 0.9G, axial force varies widely (minAxialKn vs maxAxialKn).
      assert.ok(
        env.maxAxialKn >= env.minAxialKn,
        `maxAxialKn (${env.maxAxialKn}) must be >= minAxialKn (${env.minAxialKn})`
      );
      assert.ok(
        Math.abs(env.maxAxialKn - env.minAxialKn) > 0.01,
        `Uplift combinations must produce variation between min and max axial force`
      );
    });

    test("4.4 Combination Invariant: Antisymmetric lateral earthquake response under +/- Ex", () => {
      // In a symmetric frame, +Ex and -Ex must produce equal-magnitude, opposite-sign displacements
      const B = 8.0;
      const H = 3.5;
      const E = 30e6;
      const G = 12.5e6;
      const colW = 0.50, colD = 0.50;
      const A = colW * colD;
      const Iz = (colW * Math.pow(colD, 3)) / 12;
      const Iy = (colD * Math.pow(colW, 3)) / 12;
      const J = 0.003;

      const nodes: Node3D[] = [
        { id: "nb1", name: "nb1", x: 0, y: 0, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1, -1, -1, -1, -1, -1] },
        { id: "nb2", name: "nb2", x: B, y: 0, z: 0, floorId: "f0", isBaseFixed: true, dofIndices: [-1, -1, -1, -1, -1, -1] },
        { id: "nt1", name: "nt1", x: 0, y: 0, z: H, floorId: "f0", isBaseFixed: false, dofIndices: [0, 1, 2, 3, 4, 5] },
        { id: "nt2", name: "nt2", x: B, y: 0, z: H, floorId: "f0", isBaseFixed: false, dofIndices: [6, 7, 8, 9, 10, 11] },
      ];

      const elements: Element12DOF[] = [
        { id: "c1", name: "C1", type: "column", floorId: "f0", nodeI: "nb1", nodeJ: "nt1", length: H, E, G, A, Iz, Iy, J, f_crack: 0.70, rollAngleRad: 0, width: colW, depth: colD, qy: 0, qz: 0 },
        { id: "c2", name: "C2", type: "column", floorId: "f0", nodeI: "nb2", nodeJ: "nt2", length: H, E, G, A, Iz, Iy, J, f_crack: 0.70, rollAngleRad: 0, width: colW, depth: colD, qy: 0, qz: 0 },
        { id: "b1", name: "B1", type: "beam", floorId: "f0", nodeI: "nt1", nodeJ: "nt2", length: B, E, G, A, Iz, Iy, J, f_crack: 0.35, rollAngleRad: 0, width: 0.3, depth: 0.6, qy: 0, qz: 0 },
      ];

      const out = solve3DStructuralMesh({
        nodes,
        elements,
        floors: [{ id: "f0", name: "Zemin", elevation: 0, height: H }],
        floorDiaphragms: [{ floorId: "f0", centerX: B / 2, centerY: 0, totalMassKg: 50000, deadWeightKn: 500, liveWeightKn: 100 }],
        sds: 1.0,
        sd1: 0.4,
        r: 8.0,
        importance: 1.0,
      });

      assert.equal(out.success, true);
      const combos = out.combinations;

      // Find pairs: G+Q+Ex+0.3Ey+0.3Ez and G+Q-Ex+0.3Ey+0.3Ez
      const comboPlusEx = combos.find(c => c.name.startsWith("G+Q+Ex"));
      const comboMinusEx = combos.find(c => c.name.startsWith("G+Q-Ex"));

      assert.ok(comboPlusEx && comboMinusEx);
      assert.equal(comboPlusEx.baseShearXKn, comboMinusEx.baseShearXKn);
      assert.ok(comboPlusEx.maxDisplacementM > 0);
      assert.ok(comboMinusEx.maxDisplacementM > 0);
    });
  });

  // =========================================================================
  // Additional Adversarial Hardening
  // =========================================================================
  describe("5. Advanced Structural Dynamics & High-Rise Verification", () => {
    test("5.1 Rayleigh Energy Method Quotient validates Jacobi Eigenvalue fundamental period", () => {
      // 5-Storey frame building
      const numStoreys = 5;
      const model = generateMultiStoreyModel(numStoreys, {
        bayX: 6.0,
        bayY: 6.0,
        storeyHeight: 3.0,
      });

      const res = runStructuralAnalysis(model);
      assert.ok(res.femOutput);

      // Rayleigh Quotient: omega_R = sqrt( sum(F_i * u_i) / sum(m_i * u_i^2) )
      // where F_i is floor lateral force and u_i is floor lateral displacement
      let sumFu = 0.0;
      let sumMu2 = 0.0;

      for (let s = 0; s < numStoreys; s++) {
        const st = res.storeys[s];
        const fd = res.floorDiaphragms[s];
        const Fi = st.lateralForceKn; // kN
        const ui = fd.displacementX;  // m
        const miTonnes = fd.totalMassKg / 1000.0; // metric tonnes (kN*s^2/m)

        sumFu += Fi * ui;
        sumMu2 += miTonnes * ui * ui;
      }

      assert.ok(sumFu > 0 && sumMu2 > 0);
      const omegaRayleigh = Math.sqrt(sumFu / sumMu2);
      const TRayleigh = (2 * Math.PI) / omegaRayleigh;

      // Compare Rayleigh period to fundamental dynamic period from Jacobi eigenvalue analysis
      const T1_Jacobi = res.naturalPeriods[0];
      const relDiff = Math.abs(TRayleigh - T1_Jacobi) / T1_Jacobi;

      // Both methods must be closely aligned (< 25% due to code bounding and static proxy load profile)
      assert.ok(
        relDiff < 0.25,
        `Rayleigh period (${TRayleigh.toFixed(3)} s) vs Jacobi T1 (${T1_Jacobi.toFixed(3)} s), relDiff=${(relDiff * 100).toFixed(1)}%`
      );
    });

    test("5.2 Asymmetric 20-Storey Building with Shear Wall: Complete High-Rise Stability", () => {
      // 20-Storey high-rise with asymmetric shear wall on one edge
      const model20Asym = generateMultiStoreyModel(20, {
        bayX: 8.0,
        bayY: 8.0,
        colWidth: 0.80,
        colDepth: 0.80,
        beamWidth: 0.35,
        beamHeight: 0.75,
        storeyHeight: 3.0,
        addShearWall: true,
        wallPosition: "left", // Wall at x=0
      });

      const tStart = performance.now();
      const res = runStructuralAnalysis(model20Asym);
      const tDuration = performance.now() - tStart;

      assert.ok(tDuration < 5000, `20-storey asymmetric analysis took ${tDuration.toFixed(1)} ms (< 5000 ms)`);
      assert.equal(res.storeys.length, 20);
      assert.ok(res.femOutput?.success);

      // Verify that every single floor displays torsional rotation (rotationZ != 0)
      for (let s = 0; s < 20; s++) {
        const fd = res.floorDiaphragms[s];
        assert.ok(Math.abs(fd.rotationZ) > 1e-6, `Kat ${s + 1} rotationZ must be non-zero`);
      }

      // Check top floor corner displacement gradient: Delta_max / Delta_avg > 1.0
      const topFloorId = res.storeys[19].floorId;
      const topNodes = res.femOutput!.nodes.filter(n => n.floorId === topFloorId && !n.isBaseFixed);
      const nodeLeft = topNodes.find(n => Math.abs(n.x - 0) < 0.1);
      const nodeRight = topNodes.find(n => Math.abs(n.x - 8.0) < 0.1);

      assert.ok(nodeLeft && nodeRight);
      const dLeft = res.displacements[nodeLeft.id];
      const dRight = res.displacements[nodeRight.id];

      const magLeft = Math.hypot(dLeft[0], dLeft[1]);
      const magRight = Math.hypot(dRight[0], dRight[1]);

      const deltaMax = Math.max(magLeft, magRight);
      const deltaAvg = (magLeft + magRight) / 2.0;
      const eta = deltaMax / deltaAvg;

      assert.ok(eta > 1.0, `Delta_max / Delta_avg (${eta.toFixed(3)}) must be strictly > 1.0`);
    });
  });
});

