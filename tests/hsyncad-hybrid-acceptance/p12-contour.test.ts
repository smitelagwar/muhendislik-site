import test from "node:test";
import assert from "node:assert/strict";
import {
  punchingPerimeter, computeTS500PunchingContour, punchingCapacityGate,
  type SlabBoundary, type PunchingSupport,
} from "../../src/lib/hsyncad/structural/punching-shear";

type Pt = readonly [number, number];
type Box4 = readonly [number, number, number, number];
const box = ([x0, y0, x1, y1]: Box4) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] as const;
const bnd = (out: Box4, holes: Box4[] = []): SlabBoundary => ({ outer: box(out), openings: holes.map(box) });
const col = (b: Box4, orig?: Pt): PunchingSupport => ({
  id: "col", kind: "column", footprint: box(b), origin: orig ?? [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2],
});

test("legacy punchingPerimeter preserves protected unsupported behavior", () => {
  const edge = punchingPerimeter({ boundary: bnd([0, 0, 4, 4]), support: { id: "edge", kind: "column", footprint: box([-.05, -.05, .25, .25]), origin: [.1, .1] }, effectiveDepthM: .2 });
  assert.equal(edge.classification, "corner");
  assert.equal(punchingCapacityGate(edge).status, "unsupported");
  const opening = punchingPerimeter({ boundary: { outer: box([0, 0, 4, 4]), openings: [box([1, 1, 1.2, 1.2])] }, support: col([1.5, 1.5, 1.9, 1.9], [1.7, 1.7]), effectiveDepthM: .2 });
  assert.equal(opening.geometryStatus, "unsupported");
  assert.match(opening.diagnostics.join(" "), /5d/);
});

test("TS 500 edge and corner contours across 4 orthogonal rotations", () => {
  const rot = (p: Pt, n: number): Pt => n === 0 ? p : n === 1 ? [-p[1], p[0]] : n === 2 ? [-p[0], -p[1]] : [p[1], -p[0]];
  for (let n = 0; n < 4; n++) {
    for (const [out, exp, cls] of [[[-5, -5, 0.3, 5], 2, "edge"], [[-5, -5, 0.3, 0.3], 1.3, "corner"]] as const) {
      const b: SlabBoundary = { outer: box(out).map(p => rot(p, n)), openings: [] };
      const res = computeTS500PunchingContour({ boundary: b, support: col([-0.2, -0.2, 0.2, 0.2]), effectiveDepthM: 0.3 });
      assert.equal(res.geometryStatus, "solved");
      assert.equal(res.classification, cls);
      assert.ok(Math.abs(res.retainedLengthM - exp) < 1e-6);
    }
  }
});

test("edge and corner contours under mutations match independent line-length oracle", () => {
  const d = 0.2, h = 0.1;
  for (const gap of [0.05, 0.15, 0.25, 0.35]) {
    const e = computeTS500PunchingContour({ boundary: bnd([0, 0, 2.4 + gap, 5]), support: col([2, 2, 2.4, 2.4]), effectiveDepthM: d });
    assert.equal(e.classification, "edge");
    assert.ok(Math.abs(e.retainedLengthM - ((0.4 + d) + 2 * (0.4 + h + gap))) < 1e-6);
    const c = computeTS500PunchingContour({ boundary: bnd([0, 0, 2.4 + gap, 2.4 + gap]), support: col([2, 2, 2.4, 2.4]), effectiveDepthM: d });
    assert.equal(c.classification, "corner");
    assert.ok(Math.abs(c.retainedLengthM - 2 * (0.4 + h + gap)) < 1e-6);
  }
});

test("corner candidate eligibility outside unambiguous proximity is marked unsupported with transitions and rotations", () => {
  const d = 0.2, c: Box4 = [2, 2, 2.4, 2.4];
  const rot = (p: Pt, n: number): Pt => n === 0 ? p : n === 1 ? [-p[1], p[0]] : n === 2 ? [-p[0], -p[1]] : [p[1], -p[0]];

  // 1. Terra02 concrete both-above counterexample:
  // dR = 0.45m > 0.40m, dT = 0.45m > 0.40m (both above single-edge threshold)
  // Corner = 1.90m < Interior = 2.40m, Edge = 2.50m
  // In TS 500, eligibility at both-above distances is unproven -> unsupported across all 4 rotations
  for (let n = 0; n < 4; n++) {
    const bBoth: SlabBoundary = { outer: box([0, 0, 2.85, 2.85]).map(p => rot(p, n)), openings: [] };
    const resBoth = computeTS500PunchingContour({
      boundary: bBoth,
      support: { id: "col", kind: "column", footprint: box(c).map(p => rot(p, n)), origin: rot([2.2, 2.2], n) },
      effectiveDepthM: d
    });
    assert.equal(resBoth.geometryStatus, "unsupported");
    assert.ok(resBoth.diagnostics.some(m => m.includes("Corner candidate eligibility with clearances outside unambiguous proximity")));
  }

  // 2. Terra01 one-above asymmetric clearance:
  // dR = 0.10m <= 0.40m, dT = 0.50m > 0.40m (Corner 1.60m < Edge 1.80m) -> unsupported
  const asym = computeTS500PunchingContour({ boundary: bnd([0, 0, 2.5, 2.9]), support: col(c), effectiveDepthM: d });
  assert.equal(asym.geometryStatus, "unsupported");
  assert.ok(asym.diagnostics.some(m => m.includes("Corner candidate eligibility with clearances outside unambiguous proximity")));

  // 3. Exact threshold transition / tie:
  // dR = 0.40m == thR, dT = 0.40m == thT (both within unambiguous near-corner threshold)
  // Corner = 1.80m < Interior = 2.40m, Edge = 2.40m -> solved corner!
  const trans = computeTS500PunchingContour({ boundary: bnd([0, 0, 2.8, 2.8]), support: col(c), effectiveDepthM: d });
  assert.equal(trans.geometryStatus, "solved");
  assert.equal(trans.classification, "corner");
  assert.ok(Math.abs(trans.retainedLengthM - 1.80) < 1e-6);

  // 4. Symmetric near corner:
  // dR = 0.10m <= 0.40m, dT = 0.10m <= 0.40m -> solved corner (1.20m)
  const sym = computeTS500PunchingContour({ boundary: bnd([0, 0, 2.5, 2.5]), support: col(c), effectiveDepthM: d });
  assert.equal(sym.geometryStatus, "solved");
  assert.equal(sym.classification, "corner");
  assert.ok(Math.abs(sym.retainedLengthM - 1.20) < 1e-6);

  // 5. Far edge where edge is strictly shorter than corner and interior:
  // dR = 0.10m, dT = 1.0m > 0.70m (Edge 1.80m < Corner 2.10m < Interior 2.40m) -> solved edge
  const edgeT = computeTS500PunchingContour({ boundary: bnd([0, 0, 2.5, 3.4]), support: col(c), effectiveDepthM: d });
  assert.equal(edgeT.geometryStatus, "solved");
  assert.equal(edgeT.classification, "edge");
  assert.ok(Math.abs(edgeT.retainedLengthM - 1.80) < 1e-6);
});

test("closed vs open candidate transition obeys TS 500 shortest-perimeter rule", () => {
  const d = 0.2;
  const near = computeTS500PunchingContour({ boundary: bnd([0, 0, 5, 5]), support: col([4.45, 2, 4.85, 2.4]), effectiveDepthM: d });
  assert.equal(near.classification, "edge");
  const far = computeTS500PunchingContour({ boundary: bnd([0, 0, 5, 5]), support: col([4.15, 2, 4.55, 2.4]), effectiveDepthM: d });
  assert.equal(far.classification, "interior");
});

test("exact closed-form radial tangent oracle on +X and negative-X wraparound branch", () => {
  const d = 0.2, c: Box4 = [2, 2, 2.4, 2.4], xc = 2.2, yc = 2.2;
  const resPos = computeTS500PunchingContour({ boundary: bnd([0, 0, 5, 5], [[2.8, 2.1, 3.0, 2.3]]), support: col(c), effectiveDepthM: d });
  assert.equal(resPos.geometryStatus, "solved");
  assert.ok(Math.abs(resPos.clippedLengthM - 0.10) < 1e-9);

  const hNeg: Box4 = [1.4, 2.1, 1.6, 2.3];
  const tMin = (2.1 - yc) / (1.6 - xc), tMax = (2.3 - yc) / (1.6 - xc);
  const shNeg = Math.abs(1.9 - xc) * Math.abs(tMax - tMin);
  const resNeg = computeTS500PunchingContour({ boundary: bnd([0, 0, 5, 5], [hNeg]), support: col(c), effectiveDepthM: d });
  assert.equal(resNeg.geometryStatus, "solved");
  assert.ok(Math.abs(resNeg.clippedLengthM - shNeg) < 1e-9);
  assert.ok(Math.abs(resNeg.retainedBySide.left - (0.6 - shNeg)) < 1e-9);
});

test("multi-direction support shadows on Y-axis (top and bottom) match analytic oracle", () => {
  const d = 0.2, c: Box4 = [2, 2, 2.4, 2.4];
  const resTop = computeTS500PunchingContour({ boundary: bnd([0, 0, 5, 5], [[2.1, 2.8, 2.3, 3.0]]), support: col(c), effectiveDepthM: d });
  assert.equal(resTop.geometryStatus, "solved");
  assert.ok(Math.abs(resTop.clippedLengthM - 0.10) < 1e-9);

  const resBot = computeTS500PunchingContour({ boundary: bnd([0, 0, 5, 5], [[2.1, 1.4, 2.3, 1.6]]), support: col(c), effectiveDepthM: d });
  assert.equal(resBot.geometryStatus, "solved");
  assert.ok(Math.abs(resBot.clippedLengthM - 0.10) < 1e-9);
});

test("5d opening threshold boundary: exact 5d cuts perimeter; beyond 5d does not", () => {
  const d = 0.2, c: Box4 = [2, 2, 2.4, 2.4];
  const exact = computeTS500PunchingContour({ boundary: bnd([0, 0, 5, 5], [[3.4, 2.1, 3.6, 2.3]]), support: col(c), effectiveDepthM: d });
  assert.ok(exact.clippedLengthM > 0);
  const beyond = computeTS500PunchingContour({ boundary: bnd([0, 0, 5, 5], [[3.45, 2.1, 3.65, 2.3]]), support: col(c), effectiveDepthM: d });
  assert.equal(beyond.clippedLengthM, 0);
});

test("opening directly intersecting critical contour has exact analytic retained length", () => {
  const res = computeTS500PunchingContour({ boundary: bnd([0, 0, 5, 5], [[2.45, 2.1, 2.6, 2.3]]), support: col([2, 2, 2.4, 2.4]), effectiveDepthM: 0.2 });
  assert.equal(res.geometryStatus, "solved");
  // Right side 0.6m reduced by 0.24m shadow -> retained 0.36m; other three sides 0.60m -> total 2.16m
  assert.ok(Math.abs(res.retainedLengthM - 2.16) < 1e-6);
  assert.ok(Math.abs(res.retainedBySide.right - 0.36) < 1e-6);
  assert.ok(Math.abs(res.clippedLengthM - 0.24) < 1e-6);
  assert.ok(res.segments.some(s => s.source === "opening"));
});

test("wide asymmetric opening cones in all rotations match independent ray oracle and eliminate defect", () => {
  // Concrete defect geometry: slab [-2, -11] to [2, 2], col [-.2, -.2, .2, .2], d = 0.2, hole [.21, -10, .22, 1]
  const rot = (p: Pt, n: number): Pt => n === 0 ? p : n === 1 ? [-p[1], p[0]] : n === 2 ? [-p[0], -p[1]] : [p[1], -p[0]];
  const baseOut: Box4 = [-2, -11, 2, 2];
  const baseHole: Box4 = [0.21, -10, 0.22, 1];
  for (let n = 0; n < 4; n++) {
    const b: SlabBoundary = {
      outer: box(baseOut).map(p => rot(p, n)),
      openings: [box(baseHole).map(p => rot(p, n))],
    };
    const res = computeTS500PunchingContour({ boundary: b, support: col([-0.2, -0.2, 0.2, 0.2]), effectiveDepthM: 0.2 });
    assert.equal(res.geometryStatus, "solved");
    assert.ok(Math.abs(res.retainedLengthM - 1.2693) < 1e-4);
    assert.ok(Math.abs(res.clippedLengthM - 1.1307) < 1e-4);
    // Point (0.15, 0.3) rotated by n must be clipped, not retained
    const testPt = rot([0.15, 0.3], n);
    const containsTestPt = res.segments.some(s => {
      const minX = Math.min(s.a[0], s.b[0]) - 1e-6, maxX = Math.max(s.a[0], s.b[0]) + 1e-6;
      const minY = Math.min(s.a[1], s.b[1]) - 1e-6, maxY = Math.max(s.a[1], s.b[1]) + 1e-6;
      return testPt[0] >= minX && testPt[0] <= maxX && testPt[1] >= minY && testPt[1] <= maxY;
    });
    assert.equal(containsTestPt, false, "Point (0.15, 0.3) in wide cone must be shadowed and clipped");
  }
});

test("competing critical perimeter candidates under differential opening reduction: reversal, non-reversal, and ties", () => {
  const d = 0.2;

  // 1. Concrete Ranking Reversal:
  // Column [-0.2, -0.2, 0.2, 0.2], d = 0.2
  // Slab [-5, -5, 0.55, 5] -> dR = 0.35m
  // Nominally:
  //   edge_right_3side: 0.60 + 2 * (0.50 + 0.35) = 2.30m
  //   interior_4side:   2 * (0.60 + 0.60) = 2.40m
  //   Nominal winner is Edge (2.30m < 2.40m)
  // Hole [0.35, -0.10, 0.45, 0.10]:
  //   Edge top/bottom are at y = +/- 0.30m; rays stay within |y| <= 0.1571m -> shadow on Edge is 0.00m!
  //   Interior right side is at x = 0.30m; shadow cut is 2 * (0.30 * 0.10 / 0.35) = 0.1714m -> net Interior is 2.2286m!
  //   Net winner is Interior (2.2286m < 2.3000m)!
  // Order reverses -> TS 500 contains no ranking precedence rule -> unsupported!
  const resRev = computeTS500PunchingContour({
    boundary: bnd([-5, -5, 0.55, 5], [[0.35, -0.10, 0.45, 0.10]]),
    support: col([-0.2, -0.2, 0.2, 0.2]),
    effectiveDepthM: d
  });
  assert.equal(resRev.geometryStatus, "unsupported");
  assert.ok(resRev.diagnostics.some(m => m.includes("Competing critical perimeter candidates with differential opening shadow reductions")));
  // Verify candidate evidence exposes nominal vs net lengths
  const edgeCand = resRev.candidateEvidence.candidates.find(c => c.name === "edge_right_3side");
  const intCand = resRev.candidateEvidence.candidates.find(c => c.name === "interior_4side");
  assert.ok(edgeCand && intCand);
  assert.ok(Math.abs(edgeCand.nominalLengthM - 2.30) < 1e-4);
  assert.ok(Math.abs(edgeCand.retainedLengthM - 2.30) < 1e-4);
  assert.ok(Math.abs(intCand.nominalLengthM - 2.40) < 1e-4);
  assert.ok(Math.abs(intCand.retainedLengthM - 2.2286) < 1e-3);

  // 2. Concrete Non-Reversal with Competing Paths:
  // Same slab [-5, -5, 0.55, 5] and column, but opening is on the left: [-0.60, -0.05, -0.50, 0.05]
  // Both candidates share identical left side at x = -0.30m -> both reduced by exact 0.06m:
  //   Edge net:     2.30 - 0.06 = 2.24m
  //   Interior net: 2.40 - 0.06 = 2.34m
  // Edge wins both nominally (2.30m < 2.40m) and net (2.24m < 2.34m) -> solved edge!
  const resNoRev = computeTS500PunchingContour({
    boundary: bnd([-5, -5, 0.55, 5], [[-0.60, -0.05, -0.50, 0.05]]),
    support: col([-0.2, -0.2, 0.2, 0.2]),
    effectiveDepthM: d
  });
  assert.equal(resNoRev.geometryStatus, "solved");
  assert.equal(resNoRev.classification, "edge");
  assert.equal(resNoRev.candidateEvidence.selectedCandidate, "edge_right_3side");
  assert.ok(Math.abs(resNoRev.retainedLengthM - 2.24) < 1e-3);

  // 3. Competing Nominal Tie Behavior:
  // Slab has ox1 = 0.60m (dR = 0.40m = transition threshold)
  //   edge_right_3side nominal: 0.60 + 2 * (0.50 + 0.40) = 2.40m
  //   interior_4side nominal:   2.40m
  // Deterministic tie-break chooses interior -> solved interior!
  const resTie = computeTS500PunchingContour({
    boundary: bnd([-5, -5, 0.60, 5]),
    support: col([-0.2, -0.2, 0.2, 0.2]),
    effectiveDepthM: d
  });
  assert.equal(resTie.geometryStatus, "solved");
  assert.equal(resTie.classification, "interior");
  assert.equal(resTie.candidateEvidence.selectedCandidate, "interior_4side");
  assert.ok(Math.abs(resTie.retainedLengthM - 2.40) < 1e-6);
});

test("union of overlapping shadows from disjoint holes prevents double-subtraction", () => {
  const d = 0.2, c: Box4 = [2, 2, 2.4, 2.4], h1: Box4 = [2.8, 2.05, 3.0, 2.25], h2: Box4 = [3.1, 2.15, 3.3, 2.35];
  const s1 = computeTS500PunchingContour({ boundary: bnd([0, 0, 5, 5], [h1]), support: col(c), effectiveDepthM: d });
  const s2 = computeTS500PunchingContour({ boundary: bnd([0, 0, 5, 5], [h2]), support: col(c), effectiveDepthM: d });
  const u = computeTS500PunchingContour({ boundary: bnd([0, 0, 5, 5], [h1, h2]), support: col(c), effectiveDepthM: d });
  assert.ok(u.clippedLengthM < s1.clippedLengthM + s2.clippedLengthM && u.clippedLengthM > s1.clippedLengthM);
});

test("invalid geometry rejection: concave opening, breach of outer boundary, or outside support", () => {
  const d = 0.2, c: Box4 = [2, 2, 2.4, 2.4];
  // 1. Concave L-shaped opening
  const concaveHole: Pt[] = [[2.8, 2.0], [3.2, 2.0], [3.2, 2.4], [3.0, 2.4], [3.0, 2.2], [2.8, 2.2]];
  const resConcave = computeTS500PunchingContour({
    boundary: { outer: box([0, 0, 5, 5]), openings: [concaveHole] }, support: col(c), effectiveDepthM: d,
  });
  assert.equal(resConcave.geometryStatus, "unsupported");
  assert.ok(resConcave.diagnostics.some(m => m.includes("convex") || m.includes("rectangular")));

  // 2. Opening breaching or lying outside slab boundary
  const resHoleOutside = computeTS500PunchingContour({
    boundary: bnd([0, 0, 5, 5], [[4.8, 2.0, 5.2, 2.4]]), support: col(c), effectiveDepthM: d,
  });
  assert.equal(resHoleOutside.geometryStatus, "unsupported");
  assert.ok(resHoleOutside.diagnostics.some(m => m.includes("strictly contained")));

  // 3. Support outside slab boundary
  const resColOutside = computeTS500PunchingContour({
    boundary: bnd([0, 0, 5, 5]), support: col([4.8, 2.0, 5.2, 2.4]), effectiveDepthM: d,
  });
  assert.equal(resColOutside.geometryStatus, "unsupported");
  assert.ok(resColOutside.diagnostics.some(m => m.includes("fully contained")));
});

test("origin invariance within footprint preserves geometry", () => {
  const d = 0.2, h: Box4 = [2.8, 2.1, 3.0, 2.3];
  const r1 = computeTS500PunchingContour({ boundary: bnd([0, 0, 5, 5], [h]), support: col([2, 2, 2.4, 2.4], [2.1, 2.1]), effectiveDepthM: d });
  const r2 = computeTS500PunchingContour({ boundary: bnd([0, 0, 5, 5], [h]), support: col([2, 2, 2.4, 2.4], [2.3, 2.3]), effectiveDepthM: d });
  assert.equal(r1.retainedLengthM, r2.retainedLengthM);
});
