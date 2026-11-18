import test from "node:test";
import assert from "node:assert/strict";
import {
  computeTS500PunchingContour,
  type TS500PunchingPerimeter,
  type SlabBoundary,
  type PunchingSupport,
  type InteriorPunchingAction,
} from "../../src/lib/hsyncad/structural/punching-shear";
import {
  checkSlabPunching,
  checkSlabPunchingBatch,
  reviewSlabDesign,
  type SlabPunchingCheckRequest,
  type SlabDesignPanel,
} from "../../src/lib/hsyncad/structural/slab-design";

type Pt = readonly [number, number];
type Box4 = readonly [number, number, number, number];
const box = ([x0, y0, x1, y1]: Box4) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] as const;
const bnd = (out: Box4, holes: Box4[] = []): SlabBoundary => ({ outer: box(out), openings: holes.map(box) });
const col = (b: Box4, orig?: Pt): PunchingSupport => ({
  id: "col-1",
  kind: "column",
  footprint: box(b),
  origin: orig ?? [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2],
});

const identity = { modelRevision: "rev-2026-11", stiffnessSet: "stiff-1", analysisStamp: "stamp-1" };
const materialC25 = { fctdMPa: 1.2, source: "TS 500 Table 3.2 (C25)", evidence: "verified standard C25 material" };

test("computeTS500PunchingContour entrypoint exists and returns verified TS500PunchingPerimeter contract", () => {
  assert.equal(typeof computeTS500PunchingContour, "function");
  const boundary = bnd([0, 0, 10, 10]);
  const support = col([4.8, 4.8, 5.2, 5.2], [5, 5]);
  const res = computeTS500PunchingContour({ boundary, support, effectiveDepthM: 0.2 });

  assert.equal(res.supportId, "col-1");
  assert.equal(res.effectiveDepthM, 0.2);
  assert.equal(res.classification, "interior");
  assert.equal(res.geometryStatus, "solved");
  assert.equal(res.method, "ts500-shortest-contour-shadow-v1");
  assert.equal(res.engineeringAcceptance, false);
  assert.ok(Array.isArray(res.segments));
  assert.ok(Math.abs(res.retainedLengthM - 2.4) < 1e-9);
  assert.ok(Math.abs(res.fullLengthM - 2.4) < 1e-9);
  assert.ok(Math.abs(res.clippedLengthM) < 1e-12);
  assert.equal(res.candidateEvidence.selectedCandidate, "interior_4side");
  assert.ok(res.candidateEvidence.candidates.length >= 1);
});

test("checkSlabPunching: pure geometry audit passes with reviewStatus 'onayli' for interior column", () => {
  const req: SlabPunchingCheckRequest = {
    id: "check-geom-int",
    boundary: bnd([0, 0, 10, 10]),
    support: col([4.8, 4.8, 5.2, 5.2], [5, 5]),
    effectiveDepthM: 0.2,
  };
  const res = checkSlabPunching(req);
  assert.equal(res.status, "passed");
  assert.equal(res.reviewStatus, "onayli");
  assert.equal(res.classification, "interior");
  assert.equal(res.engineeringAcceptance, false);
  assert.equal(res.diagnostics.length, 0);
  assert.ok(Math.abs(res.perimeter.retainedLengthM - 2.4) < 1e-9);
});

test("checkSlabPunching: interior rectangular column capacity passed vs failed physical capacity distinction", () => {
  const baseAction: InteriorPunchingAction = {
    ...identity,
    source: "verified FE column action",
    NaboveKn: 0,
    NbelowKn: 400,
    FaKn: 20,
    MxAdjacentKnM: [50, 50],
    MyAdjacentKnM: [0, 0],
  };

  // Case 1: Vpd (380 kN) <= Vpr (460.8 kN) -> PASSED, reviewStatus: "onayli"
  const passReq: SlabPunchingCheckRequest = {
    id: "check-cap-pass",
    boundary: bnd([0, 0, 10, 10]),
    support: col([4.8, 4.8, 5.2, 5.2], [5, 5]),
    effectiveDepthM: 0.2,
    action: baseAction,
    material: materialC25,
    expectedCurrent: identity,
  };
  const passRes = checkSlabPunching(passReq);
  assert.equal(passRes.status, "passed");
  assert.equal(passRes.reviewStatus, "onayli");
  assert.equal(passRes.passed, true);
  assert.ok(Math.abs(passRes.gamma! - 0.8) < 1e-9);
  assert.ok(Math.abs(passRes.VprKn! - 460.8) < 1e-6);
  assert.ok(Math.abs(passRes.VpdKn! - 380) < 1e-6);
  assert.ok(passRes.utilization! < 1.0);

  // Case 2: Vpd (600 kN) > Vpr (460.8 kN) -> FAILED physical capacity, reviewStatus: "reddedildi"!
  // Crucial distinction: must NEVER mark failed physical capacity as "unsupported" or "taslak".
  const failAction: InteriorPunchingAction = {
    ...baseAction,
    NbelowKn: 620, // nDiff = 620, Fa = 20 -> Vpd = 600 kN
  };
  const failReq: SlabPunchingCheckRequest = {
    id: "check-cap-fail",
    boundary: bnd([0, 0, 10, 10]),
    support: col([4.8, 4.8, 5.2, 5.2], [5, 5]),
    effectiveDepthM: 0.2,
    action: failAction,
    material: materialC25,
    expectedCurrent: identity,
  };
  const failRes = checkSlabPunching(failReq);
  assert.equal(failRes.status, "failed");
  assert.equal(failRes.reviewStatus, "reddedildi");
  assert.equal(failRes.passed, false);
  assert.ok(failRes.utilization! > 1.0);
  assert.match(failRes.reason!, /Zımbalama kapasitesi aşıldı/);
});

test("checkSlabPunching: edge and corner capacity check cleanly marks status 'unsupported' and reviewStatus 'taslak_muhendis_incelemesi_gerekli'", () => {
  // Edge column geometry is solved (1 side close to boundary)
  const edgeSupport = col([0.1, 4.8, 0.5, 5.2], [0.3, 5]);
  const action: InteriorPunchingAction = {
    ...identity,
    source: "edge column action",
    NaboveKn: 0,
    NbelowKn: 200,
    FaKn: 10,
    MxAdjacentKnM: [20, 20],
    MyAdjacentKnM: [0, 0],
  };

  const edgeReq: SlabPunchingCheckRequest = {
    id: "check-edge-cap",
    boundary: bnd([0, 0, 10, 10]),
    support: edgeSupport,
    effectiveDepthM: 0.2,
    action,
    material: materialC25,
    expectedCurrent: identity,
  };

  const edgeRes = checkSlabPunching(edgeReq);
  // TS 500 Eq. 8.21/8.24 only applies to interior columns. Edge column capacity is normatively unsupported!
  assert.equal(edgeRes.status, "unsupported");
  assert.equal(edgeRes.reviewStatus, "taslak_muhendis_incelemesi_gerekli");
  assert.equal(edgeRes.classification, "edge");
  assert.match(edgeRes.reason!, /yalnızca kesilmemiş iç dikdörtgen kolon/);
  assert.notEqual(edgeRes.status, "passed");
});

test("checkSlabPunching: irregular corner proximity (Terra02 both-above) propagates 'unsupported' and prevents silent pass", () => {
  // Terra02 concrete counterexample:
  // Column 0.40 x 0.40 m at [2, 2] to [2.4, 2.4], d = 0.20 m
  // Slab [0, 0] to [2.85, 2.85] -> dR = 0.45 m > 0.40 m, dT = 0.45 m > 0.40 m
  // In TS 500, corner eligibility outside unambiguous proximity is ambiguous -> unsupported
  const req: SlabPunchingCheckRequest = {
    id: "check-terra02-both-above",
    boundary: bnd([0, 0, 2.85, 2.85]),
    support: col([2, 2, 2.4, 2.4], [2.2, 2.2]),
    effectiveDepthM: 0.2,
  };

  const res = checkSlabPunching(req);
  assert.equal(res.status, "unsupported");
  assert.equal(res.reviewStatus, "taslak_muhendis_incelemesi_gerekli");
  assert.ok(res.diagnostics.some(d => d.includes("Corner candidate eligibility with clearances outside unambiguous proximity")));
  assert.match(res.reason!, /Corner candidate eligibility/);
  assert.notEqual(res.status, "passed");
});

test("checkSlabPunching: asymmetric clearance (Terra01 one-above) propagates 'unsupported'", () => {
  // dR = 0.10 m <= 0.40 m, dT = 0.50 m > 0.40 m
  const req: SlabPunchingCheckRequest = {
    id: "check-terra01-asym",
    boundary: bnd([0, 0, 2.5, 2.9]),
    support: col([2, 2, 2.4, 2.4]),
    effectiveDepthM: 0.2,
  };

  const res = checkSlabPunching(req);
  assert.equal(res.status, "unsupported");
  assert.equal(res.reviewStatus, "taslak_muhendis_incelemesi_gerekli");
  assert.ok(res.diagnostics.some(d => d.includes("Corner candidate eligibility with clearances outside unambiguous proximity")));
});

test("checkSlabPunching: differential hole shadow reversal propagates 'unsupported'", () => {
  // Reversal geometry from HYBRID_P12-CONTOUR.md:
  // Column [-0.2, -0.2] to [0.2, 0.2], d = 0.20 m, Slab [-5, -5] to [0.55, 5] (dR = 0.35 m)
  // Opening [0.35, -0.10] to [0.45, 0.10]
  const req: SlabPunchingCheckRequest = {
    id: "check-hole-reversal",
    boundary: { outer: box([-5, -5, 0.55, 5]), openings: [box([0.35, -0.1, 0.45, 0.1])] },
    support: col([-0.2, -0.2, 0.2, 0.2], [0, 0]),
    effectiveDepthM: 0.2,
  };

  const res = checkSlabPunching(req);
  assert.equal(res.status, "unsupported");
  assert.equal(res.reviewStatus, "taslak_muhendis_incelemesi_gerekli");
  assert.ok(res.diagnostics.some(d => d.includes("Competing critical perimeter candidates with differential opening shadow reductions")));
});

test("checkSlabPunchingBatch: aggregates multiple checks and determines overall reviewStatus", () => {
  const reqPass: SlabPunchingCheckRequest = {
    id: "P-PASS",
    boundary: bnd([0, 0, 10, 10]),
    support: col([4.8, 4.8, 5.2, 5.2], [5, 5]),
    effectiveDepthM: 0.2,
  };
  const reqUnsup: SlabPunchingCheckRequest = {
    id: "P-UNSUP",
    boundary: bnd([0, 0, 2.85, 2.85]),
    support: col([2, 2, 2.4, 2.4], [2.2, 2.2]),
    effectiveDepthM: 0.2,
  };

  const batchPass = checkSlabPunchingBatch({
    modelRevision: identity.modelRevision,
    checks: [reqPass],
  });
  assert.equal(batchPass.status, "checked");
  assert.equal(batchPass.reviewStatus, "onayli");
  assert.equal(batchPass.allPassed, true);

  const batchUnsup = checkSlabPunchingBatch({
    modelRevision: identity.modelRevision,
    checks: [reqPass, reqUnsup],
  });
  assert.equal(batchUnsup.status, "unsupported");
  assert.equal(batchUnsup.reviewStatus, "taslak_muhendis_incelemesi_gerekli");
  assert.equal(batchUnsup.allPassed, false);
  assert.equal(batchUnsup.unsupportedReasons.length, 1);
  assert.match(batchUnsup.unsupportedReasons[0], /P-UNSUP/);
});

test("reviewSlabDesign: propagates punching status to reviewStatus without breaking panel audit", () => {
  const dummyPanel: SlabDesignPanel = {
    geometry: {
      id: "P1",
      modelRevision: identity.modelRevision,
      thicknessM: 0.2,
      boundary: bnd([0, 0, 4, 8]),
      supports: [
        { edge: "left", condition: "simple", source: "wall" },
        { edge: "right", condition: "simple", source: "wall" },
        { edge: "bottom", condition: "simple", source: "beam" },
        { edge: "top", condition: "simple", source: "beam" },
      ],
      source: "actual panel geometry",
    },
    zones: [
      { id: "z1", panelId: "P1", zoneId: "z1", direction: "X", face: "bottom", diameterMm: 12, spacingM: 0.2, extra: false, source: "placed", evidence: "drawings" },
      { id: "z2", panelId: "P1", zoneId: "z2", direction: "X", face: "top", diameterMm: 12, spacingM: 0.2, extra: false, source: "placed", evidence: "drawings" },
      { id: "z3", panelId: "P1", zoneId: "z3", direction: "Y", face: "bottom", diameterMm: 12, spacingM: 0.2, extra: false, source: "placed", evidence: "drawings" },
      { id: "z4", panelId: "P1", zoneId: "z4", direction: "Y", face: "top", diameterMm: 12, spacingM: 0.2, extra: false, source: "placed", evidence: "drawings" },
    ],
  };

  // 1. Without punching checks -> scope_ready and onayli
  const baseReview = reviewSlabDesign({
    modelRevision: identity.modelRevision,
    expectedPanelIds: ["P1"],
    coverage: "complete",
    panels: [dummyPanel],
  });
  assert.equal(baseReview.status, "scope_ready");
  assert.equal(baseReview.reviewStatus, "onayli");

  // 2. With passing interior punching check -> scope_ready and onayli
  const passReview = reviewSlabDesign({
    modelRevision: identity.modelRevision,
    expectedPanelIds: ["P1"],
    coverage: "complete",
    panels: [dummyPanel],
    punchingChecks: [{
      id: "int-punch",
      boundary: bnd([0, 0, 10, 10]),
      support: col([4.8, 4.8, 5.2, 5.2], [5, 5]),
      effectiveDepthM: 0.2,
    }],
  });
  assert.equal(passReview.status, "scope_ready");
  assert.equal(passReview.reviewStatus, "onayli");
  assert.equal(passReview.punchingChecks?.length, 1);

  // 3. With irregular proximity punching check -> status: "unsupported", reviewStatus: "taslak_muhendis_incelemesi_gerekli"
  const unsupReview = reviewSlabDesign({
    modelRevision: identity.modelRevision,
    expectedPanelIds: ["P1"],
    coverage: "complete",
    panels: [dummyPanel],
    punchingChecks: [{
      id: "irregular-corner-punch",
      boundary: bnd([0, 0, 2.85, 2.85]),
      support: col([2, 2, 2.4, 2.4], [2.2, 2.2]),
      effectiveDepthM: 0.2,
    }],
  });
  assert.equal(unsupReview.status, "unsupported");
  assert.equal(unsupReview.reviewStatus, "taslak_muhendis_incelemesi_gerekli");
  assert.ok(unsupReview.unsupported.some(u => u.includes("irregular-corner-punch")));

  // 4. With failing physical capacity punching check -> status: "failed", reviewStatus: "reddedildi"
  const failReview = reviewSlabDesign({
    modelRevision: identity.modelRevision,
    expectedPanelIds: ["P1"],
    coverage: "complete",
    panels: [dummyPanel],
    expectedCurrent: identity,
    punchingChecks: [{
      id: "failing-capacity-punch",
      boundary: bnd([0, 0, 10, 10]),
      support: col([4.8, 4.8, 5.2, 5.2], [5, 5]),
      effectiveDepthM: 0.2,
      action: {
        ...identity,
        source: "overloaded column action",
        NaboveKn: 0,
        NbelowKn: 900,
        FaKn: 10,
        MxAdjacentKnM: [50, 50],
        MyAdjacentKnM: [0, 0],
      },
      material: materialC25,
      expectedCurrent: identity,
    }],
  });
  assert.equal(failReview.status, "failed");
  assert.equal(failReview.reviewStatus, "reddedildi");
});

test("checkSlabPunching: rejects false/null/nonfinite runtime inputs and enforces complete contract", () => {
  const validReq: SlabPunchingCheckRequest = {
    id: "valid-id",
    boundary: bnd([0, 0, 10, 10]),
    support: col([4.8, 4.8, 5.2, 5.2], [5, 5]),
    effectiveDepthM: 0.2,
    action: {
      ...identity,
      source: "verified",
      NaboveKn: 0,
      NbelowKn: 400,
      FaKn: 20,
      MxAdjacentKnM: [50, 50],
      MyAdjacentKnM: [0, 0],
    },
    material: materialC25,
    expectedCurrent: identity,
  };

  // Empty or invalid id
  assert.throws(() => checkSlabPunching({ ...validReq, id: "" }));
  assert.throws(() => checkSlabPunching({ ...validReq, id: "   " }));

  // Nonfinite or negative effective depth
  assert.throws(() => checkSlabPunching({ ...validReq, effectiveDepthM: 0 }));
  assert.throws(() => checkSlabPunching({ ...validReq, effectiveDepthM: -0.2 }));
  assert.throws(() => checkSlabPunching({ ...validReq, effectiveDepthM: NaN }));
  assert.throws(() => checkSlabPunching({ ...validReq, effectiveDepthM: Infinity }));

  // Non-finite origin
  assert.throws(() => checkSlabPunching({
    ...validReq,
    support: { ...validReq.support, origin: [NaN, 5] },
  }));

  // Non-column support kind
  assert.throws(() => checkSlabPunching({
    ...validReq,
    support: { ...validReq.support, kind: "wall_end" as unknown as "column" },
  }));

  // Non-finite material strength fctd
  assert.throws(() => checkSlabPunching({
    ...validReq,
    material: { ...materialC25, fctdMPa: 0 },
  }));
  assert.throws(() => checkSlabPunching({
    ...validReq,
    material: { ...materialC25, fctdMPa: NaN },
  }));

  // Non-finite axial forces in action
  assert.throws(() => checkSlabPunching({
    ...validReq,
    action: { ...validReq.action!, NbelowKn: NaN },
  }));

  // Zero axial difference (delta N = 0)
  assert.throws(() => checkSlabPunching({
    ...validReq,
    action: { ...validReq.action!, NaboveKn: 200, NbelowKn: 200 },
  }));

  // Non-finite adjacent moments
  assert.throws(() => checkSlabPunching({
    ...validReq,
    action: { ...validReq.action!, MxAdjacentKnM: [NaN, 0] },
  }));

  // Stale model revision
  assert.throws(() => checkSlabPunching({
    ...validReq,
    action: { ...validReq.action!, modelRevision: "old-stale-rev" },
  }));

  // Stale stiffness set
  assert.throws(() => checkSlabPunching({
    ...validReq,
    action: { ...validReq.action!, stiffnessSet: "stale-set" },
  }));
});
