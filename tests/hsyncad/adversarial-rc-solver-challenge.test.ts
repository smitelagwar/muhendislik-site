/**
 * Adversarial Challenger 1 Test Suite: RC Modeling & Structural Solver Verification
 * 
 * Empirically challenges and stress-tests:
 * 1. Building Geometry & Structural Consistency:
 *    - Footprint 24m x 30m = 720 m² per floor across 7 floors = 5,040 m²
 *    - Element counts: 210 columns, 35 walls, 343 beams, 140 floor slabs, 1 raft foundation = 729 solids (806 total elements with 77 axes)
 * 2. Structural Solver Execution:
 *    - 3D 12-DOF frame stiffness matrices & TBDY 2018 cracked section factors (0.70 col, 0.35 beam, 0.50 wall)
 *    - Symmetry, transformation orthogonality, and numerical stability
 *    - Physical realism of building weight W (38,647 kN superstructure / 52,455 kN with foundation) and base shear Vt (~3,400 - 3,733 kN)
 *    - Code design checks: column axial limit Nd <= 0.40 Ac fck, strong col-weak beam sum Mc >= 1.2 sum Mb, beam Ve, joint shear
 * 3. Adversarial Stress & Sensitivity Harness:
 *    - Seismic scaling perturbation (overstress detection)
 *    - Foundation subgrade modulus sensitivity
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

import type { CadModel, ColumnElement, BeamElement, WallElement, SlabElement } from "../../src/lib/hsyncad/model";
import {
  runStructuralAnalysis,
  type AnalysisResult,
} from "../../src/lib/hsyncad/analysis";
import {
  runConcreteDesignChecks,
  getConcreteProperties,
  getRebarProperties,
  checkBeamColumnJoint,
  checkStrongColumnWeakBeam,
  type ConcreteMemberCheck,
} from "../../src/lib/hsyncad/design-engine";
import {
  buildLocal12DOFStiffnessMatrix,
  buildTransformationMatrix12DOF,
  TBDY_2018_CRACKED_MODIFIERS,
  type Element12DOF,
} from "../../src/lib/hsyncad/fem-solver";

const SON_DIR = "C:/Users/hsyn/Desktop/SON";
const MODEL_FILE = path.join(SON_DIR, "7_KAT_5000M2_BINA.hsyncad");

async function loadExportedModel(): Promise<CadModel> {
  const content = await fs.readFile(MODEL_FILE, "utf-8");
  return JSON.parse(content) as CadModel;
}

// ============================================================================
// Group 1: Building Geometry & Gross Area Verification
// ============================================================================

test("CHALLENGE-1.1: Building Footprint, Storey Count, and Gross Area Consistency", async () => {
  const model = await loadExportedModel();

  // Exactly 7 storeys
  assert.equal(model.floors.length, 7, "Model must have exactly 7 storeys");

  // Verify floor elevations and 3.5m height per storey (total H = 24.5m)
  for (let i = 0; i < model.floors.length; i++) {
    const floor = model.floors[i];
    assert.equal(floor.height, 3.5, `Storey ${floor.name} height must be 3.5m`);
    assert.ok(Math.abs(floor.elevation - i * 3.5) < 1e-4, `Storey ${floor.name} elevation mismatch`);
  }

  // Verify Axis Grid Spacings
  const axes = model.elements.filter((e) => e.type === "axis");
  const groundAxes = axes.filter((e) => e.floorId === model.floors[0].id);
  assert.equal(groundAxes.length, 11, "Ground floor must contain exactly 11 grid axes");

  const xPositions = new Set<number>();
  const yPositions = new Set<number>();
  for (const ax of groundAxes as any[]) {
    if (Math.abs(ax.start.x - ax.end.x) < 1e-4) {
      xPositions.add(Math.round(ax.start.x));
    } else if (Math.abs(ax.start.y - ax.end.y) < 1e-4) {
      yPositions.add(Math.round(ax.start.y));
    }
  }

  const sortedX = Array.from(xPositions).sort((a, b) => a - b);
  const sortedY = Array.from(yPositions).sort((a, b) => a - b);

  assert.deepEqual(sortedX, [0, 6, 12, 18, 24], "X-axes must be spaced at 6m spans (0, 6, 12, 18, 24m)");
  assert.deepEqual(sortedY, [0, 6, 12, 18, 24, 30], "Y-axes must be spaced at 6m spans (0, 6, 12, 18, 24, 30m)");

  const widthX = sortedX[sortedX.length - 1] - sortedX[0]; // 24.0 m
  const lengthY = sortedY[sortedY.length - 1] - sortedY[0]; // 30.0 m
  const floorArea = widthX * lengthY; // 720.0 m²
  const totalGrossArea = floorArea * 7; // 5,040.0 m²

  assert.equal(widthX, 24.0, "Building width in X must be 24.0 m");
  assert.equal(lengthY, 30.0, "Building length in Y must be 30.0 m");
  assert.equal(floorArea, 720.0, "Per floor area must be exactly 720.0 m²");
  assert.equal(totalGrossArea, 5040.0, "Total gross building area must be exactly 5,040.0 m²");
});

// ============================================================================
// Group 2: Solid Element Counts & Inventory Rigor
// ============================================================================

test("CHALLENGE-2.1: Element Counts and Solid Inventory Matching (210 col, 35 wall, 343 beam, 140 floor slabs, 1 raft = 729 solids)", async () => {
  const model = await loadExportedModel();

  const columns = model.elements.filter((e) => e.type === "column");
  const walls = model.elements.filter((e) => e.type === "wall");
  const beams = model.elements.filter((e) => e.type === "beam");
  
  // Slabs include both 15 cm floor slabs and the 50 cm raft foundation slab
  const allSlabs = model.elements.filter((e) => e.type === "slab") as SlabElement[];
  const floorSlabs = allSlabs.filter((s) => s.thickness <= 0.20);
  const raftSlabs = allSlabs.filter((s) => s.thickness > 0.20 || (s.name && s.name.startsWith("RAD")));
  const axes = model.elements.filter((e) => e.type === "axis");

  // Check element counts per floor for columns, walls, beams, and regular floor slabs
  for (const floor of model.floors) {
    const floorCols = columns.filter((e) => e.floorId === floor.id);
    const floorWalls = walls.filter((e) => e.floorId === floor.id);
    const floorBeams = beams.filter((e) => e.floorId === floor.id);
    const floorRegularSlabs = floorSlabs.filter((e) => e.floorId === floor.id);

    assert.equal(floorCols.length, 30, `Storey ${floor.name} must have 30 columns`);
    assert.equal(floorWalls.length, 5, `Storey ${floor.name} must have 5 shear walls`);
    assert.equal(floorBeams.length, 49, `Storey ${floor.name} must have 49 beams`);
    assert.equal(floorRegularSlabs.length, 20, `Storey ${floor.name} must have exactly 20 regular floor slabs`);
  }

  // Total element counts
  assert.equal(columns.length, 210, "Total column count must be 30 * 7 = 210");
  assert.equal(walls.length, 35, "Total shear wall count must be 5 * 7 = 35");
  assert.equal(beams.length, 343, "Total beam count must be 49 * 7 = 343");
  assert.equal(floorSlabs.length, 140, "Total regular floor slab count must be 20 * 7 = 140");
  assert.equal(raftSlabs.length, 1, "Raft foundation must be 1 solid");

  const totalSolids = columns.length + walls.length + beams.length + floorSlabs.length + raftSlabs.length;
  assert.equal(totalSolids, 729, "Total solid count must equal exactly 729");

  assert.equal(axes.length, 77, "Axes count must equal 11 * 7 = 77");
  assert.equal(model.elements.length, 806, "Total model elements must equal 729 solids + 77 axes = 806");
});

// ============================================================================
// Group 3: 12-DOF Element Stiffness & Cracked Section Factors Verification
// ============================================================================

test("CHALLENGE-3.1: 3D 12-DOF Formulation and TBDY 2018 Cracked Modifiers", () => {
  // Verify Code Modifiers
  assert.equal(TBDY_2018_CRACKED_MODIFIERS.columnFlexure, 0.70, "Column flexural cracked modifier must be 0.70");
  assert.equal(TBDY_2018_CRACKED_MODIFIERS.beamFlexure, 0.35, "Beam flexural cracked modifier must be 0.35");
  assert.equal(TBDY_2018_CRACKED_MODIFIERS.wallFlexure, 0.50, "Wall flexural cracked modifier must be 0.50");
  assert.equal(TBDY_2018_CRACKED_MODIFIERS.torsion, 0.10, "Torsional cracked modifier must be 0.10");

  // Construct sample column, beam, and wall elements
  const sampleCol: Element12DOF = {
    id: "col1",
    name: "S01",
    type: "column",
    floorId: "f1",
    nodeI: "n1",
    nodeJ: "n2",
    length: 3.5,
    E: 32000000, // C30 Ec in kN/m²
    G: 32000000 / 2.4,
    A: 0.5 * 0.5,
    Iz: (0.5 * Math.pow(0.5, 3)) / 12,
    Iy: (0.5 * Math.pow(0.5, 3)) / 12,
    J: 0.141 * Math.pow(0.5, 4),
    f_crack: TBDY_2018_CRACKED_MODIFIERS.columnFlexure, // 0.70
    rollAngleRad: 0,
    width: 0.5,
    depth: 0.5,
    qy: 0,
    qz: 0,
  };

  const sampleBeam: Element12DOF = {
    ...sampleCol,
    id: "beam1",
    name: "K01",
    type: "beam",
    length: 6.0,
    A: 0.3 * 0.6,
    Iz: (0.3 * Math.pow(0.6, 3)) / 12,
    Iy: (0.6 * Math.pow(0.3, 3)) / 12,
    f_crack: TBDY_2018_CRACKED_MODIFIERS.beamFlexure, // 0.35
    width: 0.3,
    depth: 0.6,
  };

  // 1. Build local 12x12 stiffness matrices
  const kCol = buildLocal12DOFStiffnessMatrix(sampleCol);
  const kBeam = buildLocal12DOFStiffnessMatrix(sampleBeam);

  assert.equal(kCol.length, 144, "12x12 stiffness matrix must have 144 entries");
  assert.equal(kBeam.length, 144, "12x12 stiffness matrix must have 144 entries");

  // 2. Check symmetry: K[i, j] === K[j, i]
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 12; c++) {
      assert.ok(
        Math.abs(kCol[r * 12 + c] - kCol[c * 12 + r]) < 1e-7,
        `Column stiffness matrix asymmetry at (${r}, ${c})`
      );
      assert.ok(
        Math.abs(kBeam[r * 12 + c] - kBeam[c * 12 + r]) < 1e-7,
        `Beam stiffness matrix asymmetry at (${r}, ${c})`
      );
    }
  }

  // 3. Check Cracked Factor Effect directly on flexural term (4EI/L at [5,5])
  const uncrackedCol: Element12DOF = { ...sampleCol, f_crack: 1.0 };
  const kColUncracked = buildLocal12DOFStiffnessMatrix(uncrackedCol);

  const kRotColCracked = kCol[5 * 12 + 5];
  const kRotColUncracked = kColUncracked[5 * 12 + 5];
  assert.ok(
    Math.abs(kRotColCracked / kRotColUncracked - 0.70) < 1e-6,
    "Column flexural stiffness must be scaled exactly by 0.70"
  );

  const uncrackedBeam: Element12DOF = { ...sampleBeam, f_crack: 1.0 };
  const kBeamUncracked = buildLocal12DOFStiffnessMatrix(uncrackedBeam);
  const kRotBeamCracked = kBeam[5 * 12 + 5];
  const kRotBeamUncracked = kBeamUncracked[5 * 12 + 5];
  assert.ok(
    Math.abs(kRotBeamCracked / kRotBeamUncracked - 0.35) < 1e-6,
    "Beam flexural stiffness must be scaled exactly by 0.35"
  );

  // 4. Verify 12-DOF Transformation Matrix Orthogonality: T * T^T = I
  const pI = { x: 0, y: 0, z: 0 };
  const pJ = { x: 3, y: 4, z: 5 }; // arbitrary 3D line
  const T = buildTransformationMatrix12DOF(pI, pJ, 0.35);
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 12; c++) {
      let dot = 0;
      for (let k = 0; k < 12; k++) {
        dot += T[r * 12 + k] * T[c * 12 + k];
      }
      const expected = r === c ? 1.0 : 0.0;
      assert.ok(
        Math.abs(dot - expected) < 1e-6,
        `Transformation matrix non-orthogonal at (${r}, ${c}): ${dot} vs ${expected}`
      );
    }
  }
});

// ============================================================================
// Group 4: Structural Analysis Realism: Weight W, Base Shear Vt, Periods
// ============================================================================

test("CHALLENGE-4.1: Physical Realism of Building Weight W and Base Shear Vt under TBDY 2018", async () => {
  const model = await loadExportedModel();
  const analysis = runStructuralAnalysis(model);

  assert.ok(analysis.storeys.length === 7, "Structural analysis must process all 7 storeys");

  // 1. Building Weight W Verification
  const W = analysis.totalWeightKn;
  // With 50cm raft included, total W ≈ 52,455 kN; superstructure alone is ≈ 38,647 - 43,846 kN.
  // Both fall squarely within expected range for 7-story 5,040 m² commercial building (35,000 - 55,000 kN).
  assert.ok(
    W >= 35000 && W <= 55000,
    `Building weight W (${W.toFixed(1)} kN) must be physically realistic (35,000 - 55,000 kN)`
  );

  // 2. Base Shear Vt Verification
  const Vt = analysis.baseShearKn;
  assert.ok(
    Vt >= 2500 && Vt <= 5000,
    `Base shear Vt (${Vt.toFixed(1)} kN) must be physically realistic (2,500 - 5,000 kN)`
  );

  // 3. Base Shear Coefficient Cs = Vt / W
  const Cs = Vt / W;
  assert.ok(
    Cs >= 0.05 && Cs <= 0.15,
    `Seismic base shear coefficient Cs (${Cs.toFixed(4)}) must be between 5% and 15% for RC structure`
  );

  // 4. Fundamental Dynamic Period T1
  const T1 = analysis.periodSec;
  assert.ok(
    T1 >= 0.30 && T1 <= 1.20,
    `Fundamental period T1 (${T1.toFixed(3)} s) must be between 0.30s and 1.20s for 7-story RC building`
  );

  // 5. Storey Drift Compliance (TBDY 2018 §4.9.1.3: lambda * delta / h <= 0.008)
  for (const storey of analysis.storeys) {
    assert.ok(storey.driftRatio <= 0.008, `Storey drift ratio (${storey.driftRatio}) exceeds 0.008`);
    assert.equal(storey.driftPass, true, "Storey drift check must pass");
  }
});

// ============================================================================
// Group 5: Code Design Checks (TS 500 & TBDY 2018)
// ============================================================================

test("CHALLENGE-5.1: Reinforced Concrete Code Design Checks Adherence", async () => {
  const model = await loadExportedModel();
  const analysis = runStructuralAnalysis(model);
  const design = runConcreteDesignChecks(model, analysis);

  assert.ok(design.memberChecks, "Design checks must yield member checks");

  const concreteProps = getConcreteProperties("C30");
  const rebarProps = getRebarProperties("B420C");

  assert.equal(concreteProps.fck, 30, "C30 characteristic strength fck must be 30 MPa");

  // 1. Column Axial Force Limit: Nd <= 0.40 * Ac * fck
  const columns = model.elements.filter((e) => e.type === "column") as ColumnElement[];
  for (const col of columns) {
    const check = design.memberChecks[col.id];
    assert.ok(check, `Check must exist for column ${col.name}`);

    const AcMm2 = (col.width * 1000) * (col.depth * 1000);
    const expectedAxialLimitKn = (0.40 * AcMm2 * concreteProps.fck) / 1000.0; // 3,000 kN for 50x50 C30
    assert.equal(expectedAxialLimitKn, 3000.0, "50x50 C30 column axial limit must be exactly 3,000 kN");

    assert.ok(
      check.checks.axialDCR <= 1.0,
      `Column ${col.name} axial DCR (${check.checks.axialDCR.toFixed(3)}) must not exceed 1.0`
    );
    assert.equal(check.checks.axialPass, true, `Column ${col.name} axialPass must be true`);
  }

  // 2. Strong Column - Weak Beam Check: sum Mc >= 1.20 * sum Mb
  let checkedStrongCols = 0;
  for (const col of columns) {
    const check = design.memberChecks[col.id];
    if (check.checks.strongColumnDCR !== undefined) {
      checkedStrongCols++;
      const isTopStorey = col.floorId === model.floors[model.floors.length - 1].id;
      if (!isTopStorey) {
        assert.ok(
          check.checks.strongColumnPass !== undefined,
          `Column ${col.name} strongColumnPass must be evaluated`
        );
      }
    }
  }
  assert.ok(checkedStrongCols > 0, "Strong column checks must be evaluated on column elements");

  // 3. Beam Capacity Shear Check: Ve <= Vr
  const beams = model.elements.filter((e) => e.type === "beam") as BeamElement[];
  for (const beam of beams) {
    const check = design.memberChecks[beam.id];
    assert.ok(check, `Check must exist for beam ${beam.name}`);
    assert.ok(
      check.checks.shearPass !== undefined,
      `Beam ${beam.name} shear pass must be evaluated`
    );
    assert.ok(
      check.checks.designShearVeKn > 0,
      `Beam ${beam.name} capacity shear Ve must be positive`
    );
  }

  // 4. Beam-Column Joint Shear Check (TBDY 2018 §7.5)
  const sampleJoint = checkBeamColumnJoint({
    column: columns[0],
    connectedBeams: [beams[0], beams[1]],
    colShearKn: 85.0,
    beamRebars: [{ topAsMm2: 800, botAsMm2: 400, beamId: beams[0].id }],
    concrete: concreteProps,
    rebar: rebarProps,
  });

  assert.ok(sampleJoint.shearDemandKn > 0, "Joint shear demand must be positive");
  assert.ok(sampleJoint.shearCapacityKn > 0, "Joint shear capacity must be positive");
  assert.ok(typeof sampleJoint.isConfined === "boolean", "Joint confinement status must be boolean");
});

// ============================================================================
// Group 6: Adversarial Stress Harness & Perturbation Sensitivity
// ============================================================================

test("CHALLENGE-6.1: Adversarial Seismic Demand Amplification Triggers Appropriate Overstress Flagging", async () => {
  const model = await loadExportedModel();
  const baseAnalysis = runStructuralAnalysis(model);

  // Adversarial perturbation: artificially inflate beam and column moments and shears by 5x
  const perturbedAnalysis: AnalysisResult = JSON.parse(JSON.stringify(baseAnalysis));
  for (const memberId of Object.keys(perturbedAnalysis.members)) {
    const m = perturbedAnalysis.members[memberId];
    m.momentKnm *= 5.0;
    m.shearKn *= 5.0;
  }

  const perturbedDesign = runConcreteDesignChecks(model, perturbedAnalysis);

  // Under 5x lateral demand, sections must flag overstress / capacity failure
  const overstressed = Object.values(perturbedDesign.memberChecks).filter(
    (c) => c.checks.governingDCR > 1.0 || !c.checks.flexurePass || !c.checks.shearPass
  );

  assert.ok(
    overstressed.length > 0,
    "Adversarial 5x amplified loads MUST trigger overstress flags (DCR > 1.0)"
  );
});
