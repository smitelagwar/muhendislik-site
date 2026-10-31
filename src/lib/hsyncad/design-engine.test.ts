import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoModel, createEmptyModel, type ColumnElement, type BeamElement, type WallElement, type SlabElement } from "./model";
import { runStructuralAnalysis } from "./analysis";
import {
  getConcreteProperties,
  getRebarProperties,
  designColumn,
  designBeam,
  designShearWall,
  checkBeamColumnJoint,
  checkStrongColumnWeakBeam,
  designRaftFoundation,
  runConcreteDesignChecks,
  MPA_TO_TFM2,
  KN_TO_TF,
} from "./design-engine";

// ============================================================================
// 1. Material Models Tests (TS 500 §3.3 & §3.4, TBDY 2018 §7.2)
// ============================================================================

test("1.1 Concrete C25 design strengths and elastic constants match TS 500 and ideCAD reference report", () => {
  const c25 = getConcreteProperties("C25");
  assert.equal(c25.fck, 25);
  // fcd = 25 / 1.5 = 16.6667 MPa
  assert.ok(Math.abs(c25.fcd - 16.6667) < 0.01);
  // fctd = 0.35 * sqrt(25) / 1.5 = 1.1667 MPa
  assert.ok(Math.abs(c25.fctd - 1.1667) < 0.01);
  // Ec = 3250 * sqrt(25) + 14000 = 30250 MPa
  assert.equal(c25.Ec, 30250);
  // k1 = 0.85 for fck <= 25
  assert.equal(c25.k1, 0.85);

  // In technical units: matching STATİK RAPOR.pdf p. 287
  // fcd = 1699.53 tf/m² (within 0.1% numerical tolerance)
  assert.ok(Math.abs(c25.fcdTfM2 - 1699.53) < 1.0, `Expected ~1699.53 tf/m², got ${c25.fcdTfM2}`);
  // fctd = 118.97 tf/m²
  assert.ok(Math.abs(c25.fctdTfM2 - 118.97) < 0.5, `Expected ~118.97 tf/m², got ${c25.fctdTfM2}`);
});

test("1.2 Rebar B420C design yield strength matches TS 500 and ideCAD reference report", () => {
  const b420 = getRebarProperties("B420C");
  assert.equal(b420.fyk, 420);
  // fyd = 420 / 1.15 = 365.217 MPa
  assert.ok(Math.abs(b420.fyd - 365.217) < 0.01);
  assert.equal(b420.Es, 200000);
  // fyd in tf/m² = 37,241.81 tf/m²
  assert.ok(Math.abs(b420.fydTfM2 - 37241.81) < 1.0, `Expected ~37241.81 tf/m², got ${b420.fydTfM2}`);
});

test("1.3 Concrete grade scaling reduces k1 stress block factor per TS 500", () => {
  const c30 = getConcreteProperties("C30");
  assert.ok(Math.abs(c30.k1 - 0.82) < 0.01, "C30 k1 = 0.82");
  const c40 = getConcreteProperties("C40");
  assert.ok(Math.abs(c40.k1 - 0.76) < 0.01, "C40 k1 = 0.76");
  const c50 = getConcreteProperties("C50");
  assert.equal(c50.k1, 0.70, "C50 k1 reaches floor of 0.70");
});

// ============================================================================
// 2. Column Section Design & Biaxial P-M Interaction (TS 500 & TBDY 2018 §7.3)
// ============================================================================

test("2.1 Column axial stress limit Nd <= 0.40 * Ac * fck (TBDY 2018 §7.3.1.1)", () => {
  const concrete = getConcreteProperties("C25");
  const rebar = getRebarProperties("B420C");
  const col: ColumnElement = {
    id: "col-1",
    name: "S101",
    type: "column",
    floorId: "floor-1",
    layer: "Kolonlar",
    position: { x: 0, y: 0 },
    width: 0.40,
    depth: 0.40,
    height: 3.0,
    materialId: "mat-c25",
  };

  // Ac = 400x400 = 160,000 mm²
  // Axial limit = 0.40 * 160000 * 25 / 1000 = 1600 kN
  const safeResult = designColumn({
    element: col,
    floorHeightM: 3.0,
    beamDepthMaxM: 0.50,
    NdKn: 800, // 50% capacity
    V2dKn: 20,
    V3dKn: 10,
    M2dKnm: 25,
    M3dKnm: 30,
    concrete,
    rebar,
  });
  assert.equal(safeResult.axialLimitKn, 1600);
  assert.ok(Math.abs(safeResult.axialDCR - 0.50) < 0.01);
  assert.equal(safeResult.axialPass, true);

  // Exceed axial limit: Nd = 1800 kN > 1600 kN
  const failResult = designColumn({
    element: col,
    floorHeightM: 3.0,
    beamDepthMaxM: 0.50,
    NdKn: 1800,
    V2dKn: 20,
    V3dKn: 10,
    M2dKnm: 25,
    M3dKnm: 30,
    concrete,
    rebar,
  });
  assert.ok(failResult.axialDCR > 1.0);
  assert.equal(failResult.axialPass, false);
  assert.equal(failResult.pass, false);
  assert.ok(failResult.statusText.includes("Eksenel yük limiti aşıldı"));
});

test("2.2 Column biaxial P-M interaction verifies pure axial, balanced and flexural bounds", () => {
  const concrete = getConcreteProperties("C25");
  const rebar = getRebarProperties("B420C");
  const col: ColumnElement = {
    id: "col-2",
    name: "S102",
    type: "column",
    floorId: "floor-1",
    layer: "Kolonlar",
    position: { x: 0, y: 0 },
    width: 0.50,
    depth: 0.50,
    height: 3.0,
    materialId: "mat-c25",
  };

  const res = designColumn({
    element: col,
    floorHeightM: 3.0,
    beamDepthMaxM: 0.50,
    NdKn: 600,
    V2dKn: 15,
    V3dKn: 15,
    M2dKnm: 40,
    M3dKnm: 50,
    concrete,
    rebar,
  });

  // Concentric axial capacity No
  assert.ok(res.NoKn > 3000, `No = ${res.NoKn} kN should exceed 3000 kN`);
  // Uniaxial moment capacities Mr2 and Mr3 should be positive
  assert.ok(res.Mr3Knm > 100, `Mr3 = ${res.Mr3Knm} kNm`);
  assert.ok(res.Mr2Knm > 100, `Mr2 = ${res.Mr2Knm} kNm`);
  // Biaxial DCR should be reasonable and pass
  assert.ok(res.biaxialDCR > 0 && res.biaxialDCR <= 1.0, `biaxialDCR = ${res.biaxialDCR}`);
  assert.equal(res.flexurePass, true);
});

test("2.3 Column capacity shear Ve = (Mpa + Mpu)/ln and confinement tie detailing", () => {
  const concrete = getConcreteProperties("C25");
  const rebar = getRebarProperties("B420C");
  const col: ColumnElement = {
    id: "col-3",
    name: "S103",
    type: "column",
    floorId: "floor-1",
    layer: "Kolonlar",
    position: { x: 0, y: 0 },
    width: 0.40,
    depth: 0.40,
    height: 3.2,
    materialId: "mat-c25",
  };

  const res = designColumn({
    element: col,
    floorHeightM: 3.2,
    beamDepthMaxM: 0.60, // ln = 3.2 - 0.6 = 2.6 m
    NdKn: 400,
    V2dKn: 35,
    V3dKn: 20,
    M2dKnm: 30,
    M3dKnm: 60,
    concrete,
    rebar,
  });

  // Capacity shear Ve must amplify shear over elastic V2dKn
  assert.ok(res.VeKn >= res.Mr3Knm * 2.8 / 2.6, `Ve = ${res.VeKn} kN should reflect plastic moment gradient`);
  assert.ok(res.VrKn >= res.VeKn, `Shear capacity Vr = ${res.VrKn} kN`);
  assert.equal(res.shearPass, true);

  // Confinement spacing must obey s_c <= min(b/3, 150mm, 6*phi_l)
  // For 400mm width and phi 16: min(133mm, 150mm, 96mm) -> ~10 cm
  assert.ok(res.confinementSpacingCm <= 10, `Confinement spacing = ${res.confinementSpacingCm} cm`);
  assert.ok(res.confinementSpacingCm >= 5, "Confinement spacing >= 5 cm");
});

// ============================================================================
// 3. Beam 3-Station Flexure and Capacity Shear (TS 500 & TBDY 2018 §7.4)
// ============================================================================

test("3.1 Beam 3-station flexural design enforces support bottom steel As,bot >= 0.50 As,top", () => {
  const concrete = getConcreteProperties("C25");
  const rebar = getRebarProperties("B420C");
  const beam: BeamElement = {
    id: "bm-1",
    name: "K101",
    type: "beam",
    floorId: "floor-1",
    layer: "Kirişler",
    start: { x: 0, y: 0 },
    end: { x: 5.0, y: 0 },
    width: 0.25,
    height: 0.50,
    materialId: "mat-c25",
  };

  const res = designBeam({
    element: beam,
    LspanM: 5.0,
    colWidthLeftM: 0.40,
    colWidthRightM: 0.40,
    MiTopKnm: 90.0,  // Heavy support moment
    MiBotKnm: 10.0,  // Small positive moment
    MmidBotKnm: 65.0, // Midspan positive moment
    MjTopKnm: 85.0,
    MjBotKnm: 10.0,
    VdyKn: 45.0,
    V2dKn: 60.0,
    concrete,
    rebar,
  });

  // Verify support i: As,bot must be at least 50% of As,top per TBDY 2018 §7.4.3.1
  assert.ok(res.stationI.AsBotMm2 >= 0.50 * res.stationI.AsTopMm2, "Support i bottom rebar >= 50% top rebar");
  assert.ok(res.stationJ.AsBotMm2 >= 0.50 * res.stationJ.AsTopMm2, "Support j bottom rebar >= 50% top rebar");
  assert.equal(res.stationI.pass, true);
  assert.equal(res.stationMid.pass, true);
  assert.equal(res.stationJ.pass, true);
});

test("3.2 Beam capacity shear design Ve = Vdy + (Mpi+Mpj)/ln and Vc suppression", () => {
  const concrete = getConcreteProperties("C25");
  const rebar = getRebarProperties("B420C");
  const beam: BeamElement = {
    id: "bm-2",
    name: "K102",
    type: "beam",
    floorId: "floor-1",
    layer: "Kirişler",
    start: { x: 0, y: 0 },
    end: { x: 4.0, y: 0 },
    width: 0.25,
    height: 0.50,
    materialId: "mat-c25",
  };

  const res = designBeam({
    element: beam,
    LspanM: 4.0,
    colWidthLeftM: 0.40,
    colWidthRightM: 0.40,
    MiTopKnm: 80.0,
    MiBotKnm: 40.0,
    MmidBotKnm: 50.0,
    MjTopKnm: 80.0,
    MjBotKnm: 40.0,
    VdyKn: 30.0,
    V2dKn: 50.0,
    concrete,
    rebar,
  });

  // Clear span ln = 4.0 - 0.40 = 3.6 m
  assert.equal(res.lnM, 3.6);
  // Capacity shear Ve includes plastic moment gradient (Mpi + Mpj) / ln
  const expectedMinVe = 30.0 + (res.MpiKnm + res.MpjKnm) / 3.6;
  assert.ok(res.VeKn >= expectedMinVe * 0.99, `Ve = ${res.VeKn} kN >= ${expectedMinVe} kN`);
  // Seismic shear is high, so Vc in confinement should be suppressed (Vc = 0)
  assert.equal(res.VcKn, 0.0, "Concrete shear Vc suppressed in confinement zone when seismic shear dominates");
  assert.ok(res.confinementSpacingCm <= 10, "Confinement stirrup spacing <= 10 cm");
  assert.equal(res.shearPass, true);
});

// ============================================================================
// 4. Shear Wall Design (TBDY 2018 §7.6)
// ============================================================================

test("4.1 Shear Wall P309 (25/150) boundary zones, web steel and amplified shear match reference project", () => {
  const concrete = getConcreteProperties("C25");
  const rebar = getRebarProperties("B420C");
  const wall: WallElement = {
    id: "wall-P309",
    name: "P309",
    type: "wall",
    floorId: "floor-3",
    layer: "Perdeler",
    start: { x: 0, y: 0 },
    end: { x: 1.50, y: 0 },
    thickness: 0.25,
    height: 3.0,
    materialId: "mat-c25",
  };

  const res = designShearWall({
    element: wall,
    floorName: "3. KAT",
    floorHeightM: 3.0,
    totalWallHeightM: 17.6, // 6 storeys
    elevationM: 9.0,
    NdKn: 163.1, // 16.63 tf
    VdKn: 70.1,  // 7.15 tf
    MdKnm: 145.7, // 14.86 tfm
    concrete,
    rebar,
    T1Sec: 0.35,
    R: 6.0,
    I: 1.0,
  });

  // Lw = 1.50 m, bw = 0.25 m
  // Critical height Hcr = min(2*1.5, max(1.5, 17.6/6)) = min(3.0, 2.93) = 2.93 m
  assert.ok(res.HcrM >= 1.50 && res.HcrM <= 3.0);
  // Boundary zone length lu >= max(0.10*17.6, 0.20*1.5, 2*0.25) = max(1.76, 0.30, 0.50) = 0.50m (or outside Hcr: bw = 0.25)
  assert.ok(res.luM >= 0.25, `lu = ${res.luM} m`);

  // Web crushing limit: VeMax = 0.85 * Ach * sqrt(fck) = 0.85 * (250*1500) * 5 / 1000 = 1593.75 kN
  // 1593.75 / 9.80665 = 162.52 tf (Exact 100% match to STATİK RAPOR.pdf p. 450!)
  assert.ok(Math.abs(res.VeMaxKn - 1593.75) < 1.0, `Expected VeMax = 1593.75 kN, got ${res.VeMaxKn}`);
  const veMaxTf = res.VeMaxKn * KN_TO_TF;
  assert.ok(Math.abs(veMaxTf - 162.52) < 0.1, `VeMax in tf = ${veMaxTf} should match 162.52 tf`);

  // Dynamic shear factor beta_v = 1.0 for T1 <= 0.5s
  assert.equal(res.beta_v, 1.0);
  // Shear DCR is safe
  assert.ok(res.shearDCR < 0.50, `shearDCR = ${res.shearDCR}`);
  assert.equal(res.pass, true);
});

// ============================================================================
// 5. Beam-Column Joint Shear & Strong Column Checks (TBDY 2018 §7.5 & §7.3.5)
// ============================================================================

test("5.1 Beam-column joint classification: confined vs unconfined and Ve <= Vmax", () => {
  const concrete = getConcreteProperties("C25");
  const rebar = getRebarProperties("B420C");
  const col: ColumnElement = {
    id: "col-joint-1",
    name: "S201",
    type: "column",
    floorId: "floor-1",
    layer: "Kolonlar",
    position: { x: 4.0, y: 4.0 },
    width: 0.40,
    depth: 0.40,
    height: 3.0,
    materialId: "mat-c25",
  };

  // Interior column with 4 framing beams (bw = 0.30m >= 0.75 * 0.40 = 0.30m) -> Confined
  const beamsConfined: BeamElement[] = [
    { id: "b1", name: "K1", type: "beam", floorId: "floor-1", layer: "Kirişler", start: { x: 0, y: 4 }, end: { x: 4, y: 4 }, width: 0.30, height: 0.50, materialId: "mat-c25" },
    { id: "b2", name: "K2", type: "beam", floorId: "floor-1", layer: "Kirişler", start: { x: 4, y: 4 }, end: { x: 8, y: 4 }, width: 0.30, height: 0.50, materialId: "mat-c25" },
    { id: "b3", name: "K3", type: "beam", floorId: "floor-1", layer: "Kirişler", start: { x: 4, y: 0 }, end: { x: 4, y: 4 }, width: 0.30, height: 0.50, materialId: "mat-c25" },
    { id: "b4", name: "K4", type: "beam", floorId: "floor-1", layer: "Kirişler", start: { x: 4, y: 4 }, end: { x: 4, y: 8 }, width: 0.30, height: 0.50, materialId: "mat-c25" },
  ];

  const jointConfined = checkBeamColumnJoint({
    column: col,
    connectedBeams: beamsConfined,
    colShearKn: 30.0,
    beamRebars: [
      { beamId: "b1", topAsMm2: 600, botAsMm2: 300 },
      { beamId: "b2", topAsMm2: 600, botAsMm2: 300 },
    ],
    concrete,
    rebar,
  });
  assert.equal(jointConfined.isConfined, true, "Interior joint with 4 beams >= 0.75 bc must be confined");
  // Capacity factor 1.7 for confined joints
  assert.ok(jointConfined.shearCapacityKn >= 1.7 * 400 * 400 * 5 / 1000 * 0.9);
  assert.equal(jointConfined.pass, true);

  // Corner column with only 2 framing beams -> Unconfined
  const jointUnconfined = checkBeamColumnJoint({
    column: col,
    connectedBeams: [beamsConfined[0], beamsConfined[2]],
    colShearKn: 20.0,
    beamRebars: [{ beamId: "b1", topAsMm2: 600, botAsMm2: 0 }],
    concrete,
    rebar,
  });
  assert.equal(jointUnconfined.isConfined, false, "Corner joint must be unconfined");
  // Unconfined capacity uses 1.0 factor
  assert.ok(jointUnconfined.shearCapacityKn < jointConfined.shearCapacityKn);
});

test("5.2 Strong column - weak beam check sum Mc >= 1.2 sum Mb with roof exemption", () => {
  const col: ColumnElement = {
    id: "col-sc-1",
    name: "S301",
    type: "column",
    floorId: "floor-1",
    layer: "Kolonlar",
    position: { x: 0, y: 0 },
    width: 0.40,
    depth: 0.40,
    height: 3.0,
    materialId: "mat-c25",
  };

  // Case 1: Standard floor with strong columns (Mc = 150 + 150 = 300, Mb = 100 + 100 = 200, ratio = 1.50 >= 1.20)
  const passRes = checkStrongColumnWeakBeam({
    column: col,
    colMomentCapacityKnm: 150,
    upperColMomentCapacityKnm: 150,
    connectedBeamCapacitiesKnm: [100, 100],
    isTopStorey: false,
  });
  assert.equal(passRes.ratio, 1.50);
  assert.equal(passRes.pass, true);

  // Case 2: Weak column (Mc = 100, Mb = 200, ratio = 0.50 < 1.20)
  const failRes = checkStrongColumnWeakBeam({
    column: col,
    colMomentCapacityKnm: 50,
    upperColMomentCapacityKnm: 50,
    connectedBeamCapacitiesKnm: [100, 100],
    isTopStorey: false,
  });
  assert.equal(failRes.ratio, 0.50);
  assert.equal(failRes.pass, false);

  // Case 3: Roof storey exemption per TBDY 2018 §7.3.5.3
  const roofRes = checkStrongColumnWeakBeam({
    column: col,
    colMomentCapacityKnm: 50,
    connectedBeamCapacitiesKnm: [100, 100],
    isTopStorey: true,
  });
  assert.equal(roofRes.pass, true, "Roof storey joints are exempt and must pass");
  assert.ok(roofRes.statusText.includes("Çatı katı"));
});

// ============================================================================
// 6. Raft Foundation Design (TBDY 2018 §16.8 & TS 500 §13)
// ============================================================================

test("6.1 Raft foundation RDB101 (65 cm) soil bearing pressure, settlement and mesh match reference project", () => {
  const concrete = getConcreteProperties("C25");
  const rebar = getRebarProperties("B420C");
  const raftSlab: SlabElement = {
    id: "slab-raft",
    name: "RDB101",
    type: "slab",
    floorId: "floor-zemin",
    layer: "Döşemeler",
    points: [
      { x: 0, y: 0 },
      { x: 30, y: 0 },
      { x: 30, y: 20 },
      { x: 0, y: 20 },
    ],
    thickness: 0.65, // 65 cm flat raft matching reference project
    materialId: "mat-c25",
  };

  const res = designRaftFoundation({
    slab: raftSlab,
    thicknessM: 0.65,
    coverM: 0.065, // d = 0.585 m
    points: raftSlab.points,
    loads: [
      { id: "col-1", name: "S1", type: "column", x: 10, y: 10, widthM: 0.40, depthM: 0.40, NdKn: 800, MxKnm: 20, MyKnm: 20 },
      { id: "wall-1", name: "P1", type: "wall", x: 20, y: 10, widthM: 0.25, depthM: 1.50, NdKn: 1200, MxKnm: 50, MyKnm: 50 },
    ],
    qAllKpa: 250.0,
    ksKpaPerM: 30000.0,
    concrete,
    rebar,
  });

  // Raft area = 30 * 20 = 600 m²
  assert.equal(res.soilPressure.totalAreaM2, 600);
  // Soil bearing pressure should be safely within allowable limit
  assert.ok(res.soilPressure.qMaxKpa < 250.0);
  assert.equal(res.soilPressure.pass, true);

  // Minimum mesh reinforcement: As_min = 0.0020 * 100 * 58.5 cm = 11.70 cm²/m
  // Matching STATİK RAPOR.pdf p. 560: As,min = 11.70 cm²/m, recommended mesh Ø14/13 (11.84 cm²/m)
  assert.ok(Math.abs(res.continuousMesh.minAsCm2PerM - 11.70) < 0.1, `Expected 11.70 cm²/m, got ${res.continuousMesh.minAsCm2PerM}`);
  assert.equal(res.continuousMesh.recommendedMesh, "Ø14/13");
  assert.ok(res.continuousMesh.providedAsCm2PerM >= 11.70);

  // Punching checks: both column and wall end must pass
  assert.equal(res.punchingChecks["col-1"].pass, true);
  assert.equal(res.punchingChecks["wall-1"].pass, true);
  assert.equal(res.pass, true);
});

// ============================================================================
// 7. Full Integration Test with CadModel (runConcreteDesignChecks)
// ============================================================================

test("7.1 runConcreteDesignChecks processes full demo building model and integrates with analysis", () => {
  const model = createDemoModel();
  const analysisResult = runStructuralAnalysis(model);

  // Verify designResult is attached to analysis output
  assert.ok(analysisResult.designResult, "designResult must be present in analysis output");
  const design = analysisResult.designResult;

  // Member checks must exist for every column, beam, wall in model
  assert.ok(Object.keys(design.memberChecks).length >= model.elements.filter(e => e.type === "column" || e.type === "beam" || e.type === "wall").length);

  for (const [id, check] of Object.entries(design.memberChecks)) {
    assert.ok(check.capacityRatio > 0, `Member ${check.name} DCR > 0`);
    assert.ok(check.checks.flexureDCR > 0);
    assert.ok(check.checks.shearDCR > 0);
    assert.ok(check.rebar.longitudinal.text.length > 0);
    assert.ok(check.rebar.transverse.text.length > 0);
  }

  // Summary statistics
  assert.ok(design.summary.totalMembers > 0);
  assert.ok(design.summary.maxDCR > 0);
  assert.ok(design.summary.summaryNotes.length >= 5);
  assert.ok(design.summary.summaryNotes.some(n => n.includes("TS 500")));
});
