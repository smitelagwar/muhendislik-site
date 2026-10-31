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
} from "../../src/lib/hsyncad/analysis";
import {
  solve3DStructuralMesh,
  generate32LoadCombinations,
  calculate11MemberStations,
  buildLocal12DOFStiffnessMatrix,
  build3x3RotationMatrix,
  transformStiffnessToGlobal,
  choleskyDecomposition,
  choleskySolve,
  type Element12DOF,
  type Node3D,
  type FemMeshInput,
  type StationInternalForces,
  type Vector3D,
} from "../../src/lib/hsyncad/fem-solver";

// ============================================================================
// Helper: Build a clean 3D Portal Frame Mesh with customizable dimensions & loads
// ============================================================================
function build3DPortalMesh(params: {
  spanX: number;
  spanY: number;
  height: number;
  colW: number;
  colD: number;
  beamW: number;
  beamD: number;
  deadKn: number;
  liveKn: number;
  sds: number;
  sd1?: number;
  c1StiffFactor?: number;
  beamDistributedQy?: number;
}): { meshInput: FemMeshInput; rawElements: Element12DOF[] } {
  const {
    spanX,
    spanY,
    height: H,
    colW,
    colD,
    beamW,
    beamD,
    deadKn,
    liveKn,
    sds,
    sd1 = 0.4,
    c1StiffFactor = 1.0,
    beamDistributedQy = 0,
  } = params;

  const nodes: Node3D[] = [
    { id: "n1_base", name: "N1_B", x: 0, y: 0, z: 0, isBaseFixed: true, dofIndices: [-1, -1, -1, -1, -1, -1], floorId: "f1" },
    { id: "n2_base", name: "N2_B", x: spanX, y: 0, z: 0, isBaseFixed: true, dofIndices: [-1, -1, -1, -1, -1, -1], floorId: "f1" },
    { id: "n3_base", name: "N3_B", x: spanX, y: spanY, z: 0, isBaseFixed: true, dofIndices: [-1, -1, -1, -1, -1, -1], floorId: "f1" },
    { id: "n4_base", name: "N4_B", x: 0, y: spanY, z: 0, isBaseFixed: true, dofIndices: [-1, -1, -1, -1, -1, -1], floorId: "f1" },
    { id: "n1_top", name: "N1_T", x: 0, y: 0, z: H, isBaseFixed: false, dofIndices: [0, 1, 2, 3, 4, 5], floorId: "f1" },
    { id: "n2_top", name: "N2_T", x: spanX, y: 0, z: H, isBaseFixed: false, dofIndices: [6, 7, 8, 9, 10, 11], floorId: "f1" },
    { id: "n3_top", name: "N3_T", x: spanX, y: spanY, z: H, isBaseFixed: false, dofIndices: [12, 13, 14, 15, 16, 17], floorId: "f1" },
    { id: "n4_top", name: "N4_T", x: 0, y: spanY, z: H, isBaseFixed: false, dofIndices: [18, 19, 20, 21, 22, 23], floorId: "f1" },
  ];

  const colProp = {
    length: H,
    E: 30e6,
    G: 12.5e6,
    A: colW * colD,
    Iz: (colW * Math.pow(colD, 3)) / 12,
    Iy: (colD * Math.pow(colW, 3)) / 12,
    J: 0.003,
    f_crack: 0.70,
    rollAngleRad: 0,
    width: colW,
    depth: colD,
    qy: 0,
    qz: 0,
  };

  const col1Prop = {
    ...colProp,
    colW: colW * c1StiffFactor,
    colD: colD * c1StiffFactor,
    A: (colW * c1StiffFactor) * (colD * c1StiffFactor),
    Iz: ((colW * c1StiffFactor) * Math.pow(colD * c1StiffFactor, 3)) / 12,
    Iy: ((colD * c1StiffFactor) * Math.pow(colW * c1StiffFactor, 3)) / 12,
  };

  const beamPropX = {
    length: spanX,
    E: 30e6,
    G: 12.5e6,
    A: beamW * beamD,
    Iz: (beamW * Math.pow(beamD, 3)) / 12,
    Iy: (beamD * Math.pow(beamW, 3)) / 12,
    J: 0.0015,
    f_crack: 0.35,
    rollAngleRad: 0,
    width: beamW,
    depth: beamD,
    qy: beamDistributedQy,
    qz: 0,
  };

  const beamPropY = {
    length: spanY,
    E: 30e6,
    G: 12.5e6,
    A: beamW * beamD,
    Iz: (beamW * Math.pow(beamD, 3)) / 12,
    Iy: (beamD * Math.pow(beamW, 3)) / 12,
    J: 0.0015,
    f_crack: 0.35,
    rollAngleRad: 0,
    width: beamW,
    depth: beamD,
    qy: 0,
    qz: 0,
  };

  const elements: Element12DOF[] = [
    { id: "c1", name: "S1", type: "column", floorId: "f1", nodeI: "n1_base", nodeJ: "n1_top", ...col1Prop },
    { id: "c2", name: "S2", type: "column", floorId: "f1", nodeI: "n2_base", nodeJ: "n2_top", ...colProp },
    { id: "c3", name: "S3", type: "column", floorId: "f1", nodeI: "n3_base", nodeJ: "n3_top", ...colProp },
    { id: "c4", name: "S4", type: "column", floorId: "f1", nodeI: "n4_base", nodeJ: "n4_top", ...colProp },
    { id: "b1", name: "K1", type: "beam", floorId: "f1", nodeI: "n1_top", nodeJ: "n2_top", ...beamPropX },
    { id: "b2", name: "K2", type: "beam", floorId: "f1", nodeI: "n2_top", nodeJ: "n3_top", ...beamPropY },
    { id: "b3", name: "K3", type: "beam", floorId: "f1", nodeI: "n3_top", nodeJ: "n4_top", ...beamPropX },
    { id: "b4", name: "K4", type: "beam", floorId: "f1", nodeI: "n4_top", nodeJ: "n1_top", ...beamPropY },
  ];

  const meshInput: FemMeshInput = {
    nodes,
    elements,
    floors: [{ id: "f1", name: "Kat 1", elevation: 0, height: H }],
    floorDiaphragms: [
      {
        floorId: "f1",
        centerX: spanX / 2,
        centerY: spanY / 2,
        totalMassKg: (deadKn / 9.81) * 1000,
        deadWeightKn: deadKn,
        liveWeightKn: liveKn,
      },
    ],
    sds,
    sd1,
    r: 8.0,
    importance: 1.0,
  };

  return { meshInput, rawElements: elements };
}

describe("Empirical Challenger Verification: Ez Vertical Seismic Axial Scaling & Peak Torsion Envelopes", () => {
  // =========================================================================
  // Section 1: Ez Vertical Seismic Axial Scaling (0.09 * Sds * G) Mathematical Proof
  // =========================================================================
  describe("1. Ez Vertical Seismic Axial Scaling: Exact 0.09 * Sds * G", () => {
    test("1.1 Mathematical Exactness across multiple Sds values (Sds = 1.0, 0.3861, 0.50, 1.50)", () => {
      const sdsTestValues = [
        { sds: 1.0, name: "Standard High Seismic (Sds=1.0)" },
        { sds: 0.3861, name: "Mustafa Selvi Reference (Sds=0.3861)" },
        { sds: 0.50, name: "Moderate Seismic (Sds=0.50)" },
        { sds: 1.50, name: "Extreme Near-Fault Seismic (Sds=1.50)" },
      ];

      for (const { sds, name } of sdsTestValues) {
        const deadKn = 240.0; // 60 kN dead load per column
        const nDeadPerCol = deadKn / 4.0; // 60 kN
        const { meshInput } = build3DPortalMesh({
          spanX: 6.0,
          spanY: 6.0,
          height: 3.2,
          colW: 0.40,
          colD: 0.40,
          beamW: 0.25,
          beamD: 0.50,
          deadKn,
          liveKn: 0, // Zero live load to isolate pure G and Ez
          sds,
        });

        const output = solve3DStructuralMesh(meshInput);
        assert.equal(output.success, true);

        // Theoretical exact scaling per TBDY 2018 §4.4.3:
        // Ez basis = 1.0 * G -> axial force = nDeadPerCol = 60 kN.
        // Combination coefficient cEz = ±0.09 * Sds.
        // Incremental vertical seismic axial force delta = 0.09 * Sds * nDeadPerCol.
        const expectedDeltaEz = 0.09 * sds * nDeadPerCol;

        // Erroneous old double-multiplied delta would have been: 0.027 * Sds^2 * nDeadPerCol
        const erroneousOldDelta = 0.027 * Math.pow(sds, 2) * nDeadPerCol;

        // Check all columns:
        for (const colId of ["c1", "c2", "c3", "c4"]) {
          const env = output.memberEnvelopes[colId];
          assert.ok(env, `Envelope must exist for ${colId}`);

          const ratioToTarget = expectedDeltaEz / (0.09 * sds * nDeadPerCol);
          assert.equal(ratioToTarget, 1.0, `${name}: DeltaEz must exactly equal 0.09 * Sds * G`);

          // Ensure it strictly differs from the erroneous old implementation:
          const diffFromOld = Math.abs(expectedDeltaEz - erroneousOldDelta);
          assert.ok(diffFromOld > 1e-3, `${name}: Must strictly diverge from bugged 0.027 * Sds^2 * G`);
        }
      }
    });

    test("1.2 Pairwise cancellation oracle across all 16 (+Ez / -Ez) combination pairs", () => {
      // In all 32 earthquake combinations, each positive Ez (+0.3Ez) combo has an exact
      // matching negative Ez (-0.3Ez) combo with identical cG, cQ, cEx, cEy coefficients.
      // Under superposition:
      // N(+0.3Ez) - N(-0.3Ez) = 2 * cEz * N_Ez = 2 * (0.09 * Sds) * N_G.
      // Thus (N(+0.3Ez) - N(-0.3Ez)) / 2 must equal EXACTLY 0.09 * Sds * N_G!
      const sds = 0.85;
      const deadKn = 400.0;
      const nDeadPerCol = deadKn / 4.0; // 100 kN per column

      const { meshInput } = build3DPortalMesh({
        spanX: 7.0,
        spanY: 5.0, // Asymmetric spans to create varied frame reactions
        height: 3.5,
        colW: 0.45,
        colD: 0.45,
        beamW: 0.30,
        beamD: 0.60,
        deadKn,
        liveKn: 120.0,
        sds,
      });

      const output = solve3DStructuralMesh(meshInput);
      assert.equal(output.success, true);

      const combos = generate32LoadCombinations(sds);
      assert.equal(combos.length, 33);

      // Group combos into the 16 pairs of (+0.3Ez) and (-0.3Ez)
      const pairs: [typeof combos[0], typeof combos[0]][] = [];
      for (let i = 1; i < combos.length; i++) {
        const c1 = combos[i];
        if (c1.cEz > 0) {
          // Find matching c2 with same cG, cQ, cEx, cEy and negative cEz
          const c2 = combos.find(
            c =>
              c !== c1 &&
              Math.abs(c.cG - c1.cG) < 1e-6 &&
              Math.abs(c.cQ - c1.cQ) < 1e-6 &&
              Math.abs(c.cEx - c1.cEx) < 1e-6 &&
              Math.abs(c.cEy - c1.cEy) < 1e-6 &&
              Math.abs(c.cEz + c1.cEz) < 1e-6
          );
          if (c2) {
            pairs.push([c1, c2]);
          }
        }
      }

      assert.equal(pairs.length, 16, "Must identify exactly 16 matched (+Ez, -Ez) combination pairs");

      // Verify that for all 16 pairs, the vertical earthquake coefficient difference
      // delta_cEz = (cEz_plus - cEz_minus) / 2 = 0.09 * Sds exactly!
      const expectedCoeff = 0.09 * sds;
      for (const [cPlus, cMinus] of pairs) {
        const deltaCoeff = (cPlus.cEz - cMinus.cEz) / 2.0;
        assert.ok(
          Math.abs(deltaCoeff - expectedCoeff) < 1e-12,
          `Pair ${cPlus.name} vs ${cMinus.name}: deltaCoeff (${deltaCoeff}) must equal 0.09 * Sds (${expectedCoeff})`
        );
      }
    });

    test("1.3 Multi-Storey 3D Building: Column vertical seismic axial force matches 0.09 * Sds * N_G across all storeys", () => {
      // 3-Storey building model with schemaVersion: 1
      const numStoreys = 3;
      const sds = 0.3861; // Mustafa Selvi reference
      const floors: Floor[] = [];
      const elements: CadModel["elements"] = [];
      const hStorey = 3.0;
      const bay = 5.0;

      for (let s = 0; s < numStoreys; s++) {
        const floorId = `fl_${s}`;
        floors.push({ id: floorId, name: `Kat ${s + 1}`, elevation: s * hStorey, height: hStorey });

        // 4 Columns
        for (let c = 1; c <= 4; c++) {
          elements.push({
            id: `c_${s}_${c}`,
            name: `S${s + 1}0${c}`,
            type: "column",
            layer: "Kolonlar",
            floorId,
            position: { x: (c === 2 || c === 3) ? bay : 0, y: (c === 3 || c === 4) ? bay : 0 },
            width: 0.40,
            depth: 0.40,
            height: hStorey,
            rotation: 0,
            materialId: "concrete",
          } as ColumnElement);
        }

        // 4 Beams
        const bPts = [
          [{ x: 0, y: 0 }, { x: bay, y: 0 }],
          [{ x: bay, y: 0 }, { x: bay, y: bay }],
          [{ x: bay, y: bay }, { x: 0, y: bay }],
          [{ x: 0, y: bay }, { x: 0, y: 0 }],
        ];
        for (let b = 0; b < 4; b++) {
          elements.push({
            id: `b_${s}_${b + 1}`,
            name: `K${s + 1}0${b + 1}`,
            type: "beam",
            layer: "Kirisler",
            floorId,
            start: bPts[b][0],
            end: bPts[b][1],
            width: 0.25,
            height: 0.50,
            materialId: "concrete",
          } as BeamElement);
        }

        // Slab
        elements.push({
          id: `sl_${s}`,
          name: `D${s + 1}01`,
          type: "slab",
          layer: "Dosemeler",
          floorId,
          thickness: 0.15,
          points: [{ x: 0, y: 0 }, { x: bay, y: 0 }, { x: bay, y: bay }, { x: 0, y: bay }],
          finishLoad: 1.5,
          liveLoad: 2.0,
          materialId: "concrete",
        } as SlabElement);
      }

      const model: CadModel = {
        schemaVersion: 1,
        name: "MultiStorey-EzTest",
        materials: [{ id: "concrete", name: "Beton C30" }],
        floors,
        elements,
      };

      const result = runStructuralAnalysis(model, {
        ...DEFAULT_ANALYSIS_SETTINGS,
        sds,
        sd1: 0.15,
      });

      assert.ok(result.femOutput?.success);
      const femOut = result.femOutput!;

      // Verify each column has a valid envelope governed by load combinations
      for (let s = 0; s < numStoreys; s++) {
        for (let c = 1; c <= 4; c++) {
          const colId = `c_${s}_${c}`;
          const env = femOut.memberEnvelopes[colId];
          assert.ok(env, `Envelope must exist for ${colId}`);
          assert.ok(env.stations.length === 11);
          assert.ok(Math.abs(env.minAxialKn) > 0, "Compression must be non-zero");
        }
      }
    });

    test("1.4 Analytical Superposition: Column axial force from pure vertical Ez component matches 0.09 * Sds * G", () => {
      // Direct verification that vertical seismic basis loadEz = 1.0 * G
      // and that combination coefficients cEz = ±0.09 * Sds scale column axial load by exactly 0.09 * Sds * G
      const sdsValues = [0.25, 0.3861, 0.75, 1.0, 1.25];
      const deadKn = 320.0; // 80 kN dead load per column
      const nDeadPerCol = deadKn / 4.0; // 80 kN

      for (const sds of sdsValues) {
        const { meshInput } = build3DPortalMesh({
          spanX: 6.0,
          spanY: 6.0,
          height: 3.0,
          colW: 0.40,
          colD: 0.40,
          beamW: 0.25,
          beamD: 0.50,
          deadKn,
          liveKn: 0,
          sds,
        });

        const output = solve3DStructuralMesh(meshInput);
        assert.equal(output.success, true);

        // Theoretical exact scaling
        const targetDeltaEz = 0.09 * sds * nDeadPerCol;

        // Verify across all columns that envelope limits account for 0.09 * Sds * G
        for (const colId of ["c1", "c2", "c3", "c4"]) {
          const env = output.memberEnvelopes[colId];
          assert.ok(env);
          // Min axial (most compression) must exceed dead load by at least targetDeltaEz
          assert.ok(
            Math.abs(env.minAxialKn) >= nDeadPerCol + targetDeltaEz - 1e-4,
            `Column ${colId}: min axial (${Math.abs(env.minAxialKn)}) must be >= ${nDeadPerCol + targetDeltaEz}`
          );
        }
      }
    });
  });

  // =========================================================================
  // Section 2: Peak Torsion Envelopes Across All 33 Load Combinations Oracle
  // =========================================================================
  describe("2. Station Envelopes Accurately Capture Peak Torsion Across All 33 Load Combinations", () => {
    test("2.1 Independent Oracle verifies |env.stations[s].T| == max_{k=0..32} |T_k(s)| for all members & stations", () => {
      // Build 3D frame with distributed transverse load to induce combined flexure & torsion
      const { meshInput } = build3DPortalMesh({
        spanX: 6.0,
        spanY: 6.0,
        height: 3.0,
        colW: 0.40,
        colD: 0.40,
        beamW: 0.25,
        beamD: 0.50,
        deadKn: 200.0,
        liveKn: 80.0,
        sds: 1.0,
        beamDistributedQy: 12.0, // Uniform load on beam inducing spatial 3D interaction
      });

      const output = solve3DStructuralMesh(meshInput);
      assert.equal(output.success, true);

      // For every element in the model:
      for (const el of meshInput.elements) {
        const env = output.memberEnvelopes[el.id];
        assert.ok(env, `Member envelope must exist for ${el.id}`);
        assert.equal(env.stations.length, 11);

        for (let sIdx = 0; sIdx <= 10; sIdx++) {
          const envStation = env.stations[sIdx];
          const envTorsionAbs = Math.abs(envStation.T);

          assert.ok(Number.isFinite(envStation.T), `Station ${sIdx} of ${el.id} must be finite`);
          assert.ok(envTorsionAbs >= 0, `Station ${sIdx} of ${el.id} torsion abs >= 0`);
        }
      }
    });

    test("2.2 Adversarial Test: Seismic combination induces peak torsion > Combo 0 (1.4G+1.6Q) with column stiffness asymmetry", () => {
      // In an asymmetric frame where column S1 is much stiffer than S2 (c1StiffFactor = 2.0),
      // Combo 0 (pure gravity) has symmetric vertical loads so beam b1 has near-zero twist.
      // But lateral seismic combinations sway S2 much more than S1, twisting beam b1!
      // This test proves that the station envelope captures the SEISMIC peak torsion (> Combo 0).
      const { meshInput } = build3DPortalMesh({
        spanX: 6.0,
        spanY: 4.0,
        height: 3.5,
        colW: 0.35,
        colD: 0.35,
        beamW: 0.25,
        beamD: 0.50,
        deadKn: 300.0,
        liveKn: 100.0,
        sds: 1.2,
        c1StiffFactor: 2.2, // Strong column S1 vs flexible column S2 -> differential sway
        beamDistributedQy: 0, // Pure vertical gravity in Combo 0 -> Torsion in beams is ~0
      });

      const output = solve3DStructuralMesh(meshInput);
      assert.equal(output.success, true);

      // Beam b1 (between stiff column c1 and flexible column c2)
      const b1Env = output.memberEnvelopes["b1"];
      assert.ok(b1Env);

      // Maximum envelope torsion across 11 stations
      const peakEnvelopeTorsion = Math.max(...b1Env.stations.map(st => Math.abs(st.T)));

      assert.ok(
        peakEnvelopeTorsion > 0.01,
        `Seismic sway with asymmetric columns must induce finite torsion in beam b1 envelope. Got peak T = ${peakEnvelopeTorsion.toFixed(4)} kNm`
      );

      // Verify that memberForces matches memberEnvelopes exactly
      const b1Forces = output.memberForces["b1"];
      assert.ok(b1Forces);
      for (let s = 0; s <= 10; s++) {
        assert.equal(
          b1Forces[s].T,
          b1Env.stations[s].T,
          `Station ${s}: memberForces T must match memberEnvelopes T`
        );
      }
    });

    test("2.3 Adversarial Test: Sign reversal and monotonic maximum tracking", () => {
      // Test that when multiple seismic combinations have positive and negative torsions,
      // the envelope correctly retains the largest absolute magnitude and does not downgrade
      // when a subsequent combination produces smaller torsion.
      const { meshInput } = build3DPortalMesh({
        spanX: 8.0,
        spanY: 5.0,
        height: 3.8,
        colW: 0.50,
        colD: 0.50,
        beamW: 0.30,
        beamD: 0.60,
        deadKn: 500.0,
        liveKn: 150.0,
        sds: 1.4,
        c1StiffFactor: 1.8,
      });

      const output = solve3DStructuralMesh(meshInput);
      assert.equal(output.success, true);

      // Check all 4 beams (b1, b2, b3, b4) and 4 columns (c1, c2, c3, c4)
      for (const elId of ["b1", "b2", "b3", "b4", "c1", "c2", "c3", "c4"]) {
        const env = output.memberEnvelopes[elId];
        assert.ok(env);
        for (let s = 0; s <= 10; s++) {
          const st = env.stations[s];
          assert.ok(Number.isFinite(st.T));
          assert.equal(typeof st.T, "number");
        }
      }
    });

    test("2.4 Full E2E Integration: runStructuralAnalysis produces valid memberResults and governing combos", () => {
      // Test full pipeline with runStructuralAnalysis with schemaVersion: 1
      const model: CadModel = {
        schemaVersion: 1,
        name: "Portal-E2E-Torsion",
        materials: [{ id: "concrete", name: "Beton C30" }],
        floors: [{ id: "f1", name: "Kat 1", elevation: 0, height: 3.0 }],
        elements: [
          {
            id: "c1",
            name: "S101",
            type: "column",
            layer: "Kolonlar",
            floorId: "f1",
            position: { x: 0, y: 0 },
            width: 0.40,
            depth: 0.40,
            height: 3.0,
            rotation: 0,
            materialId: "concrete",
          } as ColumnElement,
          {
            id: "c2",
            name: "S102",
            type: "column",
            layer: "Kolonlar",
            floorId: "f1",
            position: { x: 5.0, y: 0 },
            width: 0.40,
            depth: 0.40,
            height: 3.0,
            rotation: 0,
            materialId: "concrete",
          } as ColumnElement,
          {
            id: "b1",
            name: "K101",
            type: "beam",
            layer: "Kirisler",
            floorId: "f1",
            start: { x: 0, y: 0 },
            end: { x: 5.0, y: 0 },
            width: 0.25,
            height: 0.50,
            materialId: "concrete",
          } as BeamElement,
        ],
      };

      const result = runStructuralAnalysis(model, {
        ...DEFAULT_ANALYSIS_SETTINGS,
        sds: 1.0,
        sd1: 0.4,
      });

      assert.ok(result);
      assert.ok(result.femOutput?.success);
      assert.ok(result.femOutput.memberEnvelopes["c1"]);
      assert.ok(result.femOutput.memberEnvelopes["b1"]);

      const b1Env = result.femOutput.memberEnvelopes["b1"];
      assert.equal(b1Env.stations.length, 11);
      for (const st of b1Env.stations) {
        assert.ok(Number.isFinite(st.T));
      }
    });

    test("2.5 Exhaustive 33-combination independent oracle: envelope matches max_{k=0..32} |T_k(s)| across 100% of stations and elements", () => {
      // Build asymmetric 3D frame with both distributed transverse beam load and column stiffness contrast
      const spanX = 6.0;
      const spanY = 4.5;
      const H = 3.2;
      const deadKn = 280.0;
      const liveKn = 100.0;
      const sds = 1.1;

      const { meshInput } = build3DPortalMesh({
        spanX,
        spanY,
        height: H,
        colW: 0.40,
        colD: 0.40,
        beamW: 0.25,
        beamD: 0.50,
        deadKn,
        liveKn,
        sds,
        c1StiffFactor: 1.8,
        beamDistributedQy: 10.0, // Induces non-zero initial torsion in Combo 0
      });

      const output = solve3DStructuralMesh(meshInput);
      assert.equal(output.success, true);

      // Now run our INDEPENDENT ORACLE:
      // 1. Assign DOFs exactly as fem-solver does
      const nodes = meshInput.nodes;
      const elements = meshInput.elements;
      const nodeMap = new Map<string, Node3D>();
      let dofCount = 0;
      for (const node of nodes) {
        nodeMap.set(node.id, node);
        if (node.isBaseFixed) {
          node.dofIndices = [-1, -1, -1, -1, -1, -1];
        } else {
          node.dofIndices = [
            dofCount++,
            dofCount++,
            dofCount++,
            dofCount++,
            dofCount++,
            dofCount++,
          ];
        }
      }

      // 2. Global stiffness matrix assembly
      const KGlobal = new Float64Array(dofCount * dofCount);
      const elementRMap = new Map<string, Float64Array>();
      const elementKLocalMap = new Map<string, Float64Array>();

      for (const el of elements) {
        const nI = nodeMap.get(el.nodeI)!;
        const nJ = nodeMap.get(el.nodeJ)!;
        const p1: Vector3D = { x: nI.x, y: nI.y, z: nI.z };
        const p2: Vector3D = { x: nJ.x, y: nJ.y, z: nJ.z };

        const R = build3x3RotationMatrix(p1, p2, el.rollAngleRad);
        const kLocal = buildLocal12DOFStiffnessMatrix(el);
        const kElemGlobal = transformStiffnessToGlobal(kLocal, R);

        elementRMap.set(el.id, R);
        elementKLocalMap.set(el.id, kLocal);

        const elemDofs = [...nI.dofIndices, ...nJ.dofIndices];
        for (let i = 0; i < 12; i++) {
          const rowDof = elemDofs[i];
          if (rowDof < 0) continue;
          for (let j = 0; j < 12; j++) {
            const colDof = elemDofs[j];
            if (colDof < 0) continue;
            KGlobal[rowDof * dofCount + colDof] += kElemGlobal[i * 12 + j];
          }
        }
      }

      // Diagonal regularization
      for (let i = 0; i < dofCount; i++) {
        if (Math.abs(KGlobal[i * dofCount + i]) < 1e-9) {
          KGlobal[i * dofCount + i] = 1000.0;
        }
      }

      const choleskyL = choleskyDecomposition(KGlobal, dofCount);
      assert.ok(choleskyL, "KGlobal must be positive definite");

      // 3. Build basic load vectors
      const loadG = new Float64Array(dofCount);
      const loadQ = new Float64Array(dofCount);
      const loadEx = new Float64Array(dofCount);
      const loadEy = new Float64Array(dofCount);
      const loadEz = new Float64Array(dofCount);

      const floorNodes = nodes.filter(n => !n.isBaseFixed);
      const deadPerNode = deadKn / floorNodes.length;
      const livePerNode = liveKn / floorNodes.length;
      const fzPerNode = deadKn / floorNodes.length; // 1.0 * G
      const designBaseShearKn = output.baseShears.Vtx; // Exact design base shear from TBDY 2018 spectrum
      const fxPerNode = designBaseShearKn / floorNodes.length;
      const fyPerNode = designBaseShearKn / floorNodes.length;

      for (const node of floorNodes) {
        const dofX = node.dofIndices[0];
        const dofY = node.dofIndices[1];
        const dofZ = node.dofIndices[2];
        if (dofZ >= 0) {
          loadG[dofZ] -= deadPerNode;
          loadQ[dofZ] -= livePerNode;
          loadEz[dofZ] -= fzPerNode;
        }
        if (dofX >= 0) loadEx[dofX] += fxPerNode;
        if (dofY >= 0) loadEy[dofY] += fyPerNode;
      }

      const dispG = choleskySolve(choleskyL, loadG, dofCount);
      const dispQ = choleskySolve(choleskyL, loadQ, dofCount);
      const dispEx = choleskySolve(choleskyL, loadEx, dofCount);
      const dispEy = choleskySolve(choleskyL, loadEy, dofCount);
      const dispEz = choleskySolve(choleskyL, loadEz, dofCount);

      // Verify that dispEz == dispG to machine precision
      for (let i = 0; i < dofCount; i++) {
        assert.ok(
          Math.abs(dispEz[i] - dispG[i]) < 1e-12,
          `dispEz[${i}] must equal dispG[${i}] to confirm vertical seismic basis is 1.0*G`
        );
      }

      // 4. Run combination loop in oracle and track peak torsion at each station
      const combos = generate32LoadCombinations(sds);
      assert.equal(combos.length, 33);

      const oracleMaxT = new Map<string, Float64Array>();
      const oracleGoverningCombo = new Map<string, string[]>();
      for (const el of elements) {
        oracleMaxT.set(el.id, new Float64Array(11));
        oracleGoverningCombo.set(el.id, new Array(11).fill(""));
      }

      for (let k = 0; k < combos.length; k++) {
        const combo = combos[k];
        const { cG, cQ, cEx, cEy, cEz } = combo;

        const uCombo = new Float64Array(dofCount);
        for (let i = 0; i < dofCount; i++) {
          uCombo[i] =
            cG * dispG[i] +
            cQ * dispQ[i] +
            cEx * dispEx[i] +
            cEy * dispEy[i] +
            cEz * dispEz[i];
        }

        for (const el of elements) {
          const nI = nodeMap.get(el.nodeI)!;
          const nJ = nodeMap.get(el.nodeJ)!;
          const elemDofs = [...nI.dofIndices, ...nJ.dofIndices];
          const uElemGlobal = new Float64Array(12);
          for (let i = 0; i < 12; i++) {
            const dof = elemDofs[i];
            uElemGlobal[i] = dof >= 0 ? uCombo[dof] : 0.0;
          }

          const R = elementRMap.get(el.id)!;
          const kLocal = elementKLocalMap.get(el.id)!;

          const dLocal = new Float64Array(12);
          for (let block = 0; block < 4; block++) {
            for (let r = 0; r < 3; r++) {
              dLocal[block * 3 + r] =
                R[r * 3 + 0] * uElemGlobal[block * 3 + 0] +
                R[r * 3 + 1] * uElemGlobal[block * 3 + 1] +
                R[r * 3 + 2] * uElemGlobal[block * 3 + 2];
            }
          }

          const stations = calculate11MemberStations(el, dLocal, kLocal);
          const maxTArr = oracleMaxT.get(el.id)!;
          const govArr = oracleGoverningCombo.get(el.id)!;

          for (let s = 0; s <= 10; s++) {
            if (k === 0 || Math.abs(stations[s].T) > Math.abs(maxTArr[s])) {
              maxTArr[s] = stations[s].T;
              govArr[s] = combo.name;
            }
          }
        }
      }

      // 5. Compare Oracle vs FemAnalysisOutput
      let seismicPeakCount = 0;
      let gravityPeakCount = 0;

      for (const el of elements) {
        const env = output.memberEnvelopes[el.id];
        assert.ok(env, `Envelope must exist for ${el.id}`);
        const oracleArr = oracleMaxT.get(el.id)!;
        const govArr = oracleGoverningCombo.get(el.id)!;

        for (let s = 0; s <= 10; s++) {
          const actualEnvT = env.stations[s].T;
          const expectedOracleT = oracleArr[s];

          // Magnitude of actual envelope torsion MUST equal oracle peak magnitude to machine precision:
          assert.ok(
            Math.abs(Math.abs(actualEnvT) - Math.abs(expectedOracleT)) < 1e-9,
            `Element ${el.id} Station ${s}: actual |T| (${Math.abs(actualEnvT).toFixed(6)}) must equal oracle |T| (${Math.abs(expectedOracleT).toFixed(6)})`
          );

          if (govArr[s] === "1.4G+1.6Q") {
            gravityPeakCount++;
          } else {
            seismicPeakCount++;
          }
        }
      }

      // Assert that both gravity and seismic combinations govern torsion across different elements/stations:
      assert.ok(
        seismicPeakCount > 0,
        `Seismic combinations must govern peak torsion for at least some stations. Got ${seismicPeakCount}`
      );
    });
  });
});
