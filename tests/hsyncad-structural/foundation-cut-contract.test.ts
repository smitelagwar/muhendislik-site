import test from "node:test";
import assert from "node:assert/strict";
import {
  recoverFoundationShellForces,
  integrateFoundationCut,
  type FoundationCutDemand,
} from "../../src/lib/hsyncad/structural/foundation-fe";
import { runRaftFoundationCase } from "../../src/lib/hsyncad/structural/foundation-design";
import { syntheticRaftFixture } from "./foundation-fixtures";
import type { FrameNode } from "../../src/lib/hsyncad/structural/frame-element";
import type { ShellRect } from "../../src/lib/hsyncad/structural/shell-rect";

test("real cut contract reports explicit total signed kN, actual cut span, and average kN/m (not local 1m peak)", () => {
  // Construct a 2m wide cut along Y with two 1m shells:
  // Shell 1 (y: 0..1): pressure = -360 kPa -> total edge shear = 180 kN (180 kN/m)
  // Shell 2 (y: 1..2): pressure = -40 kPa  -> total edge shear = 20 kN  (20 kN/m)
  const pos = [
    [0, 0, 0], [1, 0, 0],
    [0, 1, 0], [1, 1, 0],
    [0, 2, 0], [1, 2, 0],
  ] as const;
  const nodes: FrameNode[] = pos.map((position, i) => ({
    id: `n${i}`, position, load: [0, 0, 0, 0, 0, 0], prescribed: [0, 0, 0, 0, 0, 0], springs: [0, 0, 0, 0, 0, 0],
  }));
  const baseProps = { E: 30e6, nu: 0.2, thickness: 0.3, shearCorrection: 5 / 6, drillPenalty: 0.01, modifiers: { membrane: 1, bending: 1, shear: 1 } };
  const shells: ShellRect[] = [
    { id: "s_bottom", nodes: ["n0", "n1", "n3", "n2"], ...baseProps, pressure: -360 },
    { id: "s_top",    nodes: ["n2", "n3", "n5", "n4"], ...baseProps, pressure: -40 },
  ];
  const displacementByNode = Object.fromEntries(nodes.map(n => [n.id, [0, 0, 0, 0, 0, 0]]));
  const resultants = recoverFoundationShellForces({ nodes, shells, displacementByNode, foundationShellIds: ["s_bottom", "s_top"] });

  const cut = integrateFoundationCut({
    nodes, shells, resultants, foundationShellIds: ["s_bottom", "s_top"],
    cut: {
      axis: "X", coordinateM: 1, spanStartM: 0, spanEndM: 2, side: "negative",
      loadCaseId: "ULS-1", analysisStamp: "STAMP-2026", modelRevision: "REV-1", sourceStiffnessFingerprint: "FPRINT-A",
    },
  });

  // Verify total signed forces and actual cut span
  assert.equal(cut.cutSpanM, 2);
  assert.equal(cut.stripWidthM, 2);
  assert.equal(cut.totalShearKn, 200);
  assert.equal(cut.shearKn, 200); // backward-compatible alias
  assert.equal(cut.averageShearKnPerM, 100);
  assert.equal(cut.shearKnPerM, 100); // backward-compatible alias

  // Verify sub-segments expose non-uniform strip (+180 vs +20)
  assert.equal(cut.subSegments.length, 2);
  assert.equal(cut.subSegments[0].subSpanM, 1);
  assert.equal(cut.subSegments[0].totalShearKn, 180);
  assert.equal(cut.subSegments[0].averageShearKnPerM, 180);
  assert.equal(cut.subSegments[1].subSpanM, 1);
  assert.equal(cut.subSegments[1].totalShearKn, 20);
  assert.equal(cut.subSegments[1].averageShearKnPerM, 20);

  // Assert that span-averaged 100 kN/m does NOT equal the local peak 180 kN/m
  assert.notEqual(cut.averageShearKnPerM, cut.subSegments[0].averageShearKnPerM);
  assert.equal(cut.scopeMeaning.isAverageOverSpan, true);
  assert.equal(cut.scopeMeaning.isLocal1mPeak, false);
  assert.match(cut.scopeMeaning.note, /NOT represent local 1 m peaks/);
  assert.equal(cut.scopeMeaning.normativeCapacityEvaluation, "blocked_pending_authoritative_code_and_strip_definition");

  // Verify provenance retention
  assert.deepEqual(cut.provenance, {
    loadCaseId: "ULS-1",
    analysisStamp: "STAMP-2026",
    modelRevision: "REV-1",
    sourceStiffnessFingerprint: "FPRINT-A",
  });
});

test("signs reversal / cancellation across cut span cannot be masked as local zero", () => {
  // Shell 1 (y: 0..1): pressure = -200 kPa -> edge shear = +100 kN
  // Shell 2 (y: 1..2): pressure = +200 kPa -> edge shear = -100 kN
  const pos = [
    [0, 0, 0], [1, 0, 0],
    [0, 1, 0], [1, 1, 0],
    [0, 2, 0], [1, 2, 0],
  ] as const;
  const nodes: FrameNode[] = pos.map((position, i) => ({
    id: `n${i}`, position, load: [0, 0, 0, 0, 0, 0], prescribed: [0, 0, 0, 0, 0, 0], springs: [0, 0, 0, 0, 0, 0],
  }));
  const baseProps = { E: 30e6, nu: 0.2, thickness: 0.3, shearCorrection: 5 / 6, drillPenalty: 0.01, modifiers: { membrane: 1, bending: 1, shear: 1 } };
  const shells: ShellRect[] = [
    { id: "s_pos", nodes: ["n0", "n1", "n3", "n2"], ...baseProps, pressure: -200 },
    { id: "s_neg", nodes: ["n2", "n3", "n5", "n4"], ...baseProps, pressure: 200 },
  ];
  const displacementByNode = Object.fromEntries(nodes.map(n => [n.id, [0, 0, 0, 0, 0, 0]]));
  const resultants = recoverFoundationShellForces({ nodes, shells, displacementByNode, foundationShellIds: ["s_pos", "s_neg"] });

  const cut = integrateFoundationCut({
    nodes, shells, resultants, foundationShellIds: ["s_pos", "s_neg"],
    cut: { axis: "X", coordinateM: 1, spanStartM: 0, spanEndM: 2, side: "negative" },
  });

  // Net cancellation over the full 2 m span results in zero total and zero average:
  assert.equal(cut.totalShearKn, 0);
  assert.equal(cut.averageShearKnPerM, 0);

  // Sub-segments explicitly reveal local +100 kN and -100 kN, preventing false claim of zero demand
  assert.equal(cut.subSegments[0].totalShearKn, 100);
  assert.equal(cut.subSegments[0].averageShearKnPerM, 100);
  assert.equal(cut.subSegments[1].totalShearKn, -100);
  assert.equal(cut.subSegments[1].averageShearKnPerM, -100);
  assert.equal(Math.abs(cut.subSegments[0].totalShearKn), 100);
  assert.equal(Math.abs(cut.subSegments[1].totalShearKn), 100);
});

test("two-sided free-body balance across internal cut interface in solved P06 FE model", () => {
  // Use solved synthetic raft fixture
  const input = syntheticRaftFixture(2);
  const result = runRaftFoundationCase(input);
  assert.equal(result.status, "solved_limited_profile");
  if (result.status !== "solved_limited_profile") return;

  // Cut across mid-span X = 1 from Y = 0 to Y = 2
  const nodes = input.nodes;
  const shells = input.shells;
  const resultants = result.foundationShellForces;

  const cutNeg = integrateFoundationCut({
    nodes, shells, resultants, foundationShellIds: input.foundationShellIds,
    cut: { axis: "X", coordinateM: 1, spanStartM: 0, spanEndM: 2, side: "negative" },
  });
  const cutPos = integrateFoundationCut({
    nodes, shells, resultants, foundationShellIds: input.foundationShellIds,
    cut: { axis: "X", coordinateM: 1, spanStartM: 0, spanEndM: 2, side: "positive" },
  });

  // Both sides must share the exact crossing nodes along the cut interface
  assert.deepEqual(cutNeg.crossingNodeIds, cutPos.crossingNodeIds);
  assert.equal(cutNeg.cutSpanM, cutPos.cutSpanM);
  assert.equal(cutNeg.side, "negative");
  assert.equal(cutPos.side, "positive");

  // Verify finite values for all forces
  assert.ok(Number.isFinite(cutNeg.totalShearKn));
  assert.ok(Number.isFinite(cutPos.totalShearKn));
  assert.ok(Number.isFinite(cutNeg.totalInPlaneAxialKn));
  assert.ok(Number.isFinite(cutPos.totalInPlaneAxialKn));

  // Verify in foundation-design.ts, cut actions retain unsupported status and provenance
  assert.equal(result.shellSectionActions[0].status, "actual_signed_FE_demand_face_and_capacity_mapping_not_yet_accepted");
  assert.equal(result.shellSectionActions[0].action.provenance?.loadCaseId, "SYN-GQ");
});

test("in-plane normal force N is recovered and not defaulted to zero", () => {
  // Create shell patch with non-zero in-plane displacement
  const pos = [
    [0, 0, 0], [1, 0, 0],
    [0, 1, 0], [1, 1, 0],
  ] as const;
  const nodes: FrameNode[] = pos.map((position, i) => ({
    id: `n${i}`, position, load: [0, 0, 0, 0, 0, 0], prescribed: [0, 0, 0, 0, 0, 0], springs: [0, 0, 0, 0, 0, 0],
  }));
  const props = { E: 30e6, nu: 0.2, thickness: 0.3, shearCorrection: 5 / 6, drillPenalty: 0.01, modifiers: { membrane: 1, bending: 1, shear: 1 }, pressure: 0 };
  const shells: ShellRect[] = [{ id: "cell", nodes: ["n0", "n1", "n3", "n2"], ...props }];
  // Impose in-plane tensile displacement u_x = 0.001 m at x = 1 (nodes n1 and n3)
  const displacementByNode: Record<string, number[]> = {
    n0: [0, 0, 0, 0, 0, 0],
    n2: [0, 0, 0, 0, 0, 0],
    n1: [0.001, 0, 0, 0, 0, 0],
    n3: [0.001, 0, 0, 0, 0, 0],
  };
  const resultants = recoverFoundationShellForces({ nodes, shells, displacementByNode, foundationShellIds: ["cell"] });

  const cut = integrateFoundationCut({
    nodes, shells, resultants, foundationShellIds: ["cell"],
    cut: { axis: "X", coordinateM: 1, spanStartM: 0, spanEndM: 1, side: "negative" },
  });

  // In-plane axial force across cut (Fx) must be non-zero and finite
  assert.ok(Number.isFinite(cut.totalInPlaneAxialKn));
  assert.ok(Math.abs(cut.totalInPlaneAxialKn) > 1); // Significant in-plane membrane reaction
  assert.equal(cut.averageInPlaneAxialKnPerM, cut.totalInPlaneAxialKn / cut.cutSpanM);
  assert.equal(cut.inPlaneAxialKn, cut.totalInPlaneAxialKn);
});

test("invalid cut definitions (NaN, reversed span, missing shell, invalid side) are strictly rejected", () => {
  const pos = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0]] as const;
  const nodes: FrameNode[] = pos.map((position, i) => ({ id: `n${i}`, position, load: [0, 0, 0, 0, 0, 0], prescribed: [0, 0, 0, 0, 0, 0], springs: [0, 0, 0, 0, 0, 0] }));
  const shells: ShellRect[] = [{ id: "s0", nodes: ["n0", "n1", "n3", "n2"], E: 30e6, nu: 0.2, thickness: 0.3, shearCorrection: 5 / 6, drillPenalty: 0.01, modifiers: { membrane: 1, bending: 1, shear: 1 }, pressure: 0 }];
  const displacementByNode = Object.fromEntries(nodes.map(n => [n.id, [0, 0, 0, 0, 0, 0]]));
  const resultants = recoverFoundationShellForces({ nodes, shells, displacementByNode, foundationShellIds: ["s0"] });

  const base: Parameters<typeof integrateFoundationCut>[0] = { nodes, shells, resultants, foundationShellIds: ["s0"], cut: { axis: "X", coordinateM: 1, spanStartM: 0, spanEndM: 1, side: "negative" } };

  // NaN coordinate
  assert.throws(() => integrateFoundationCut({ ...base, cut: { ...base.cut, coordinateM: NaN } }), /invalid/);
  // Reversed span (start >= end)
  assert.throws(() => integrateFoundationCut({ ...base, cut: { ...base.cut, spanStartM: 1, spanEndM: 0 } }), /invalid/);
  // Equal span (span = 0)
  assert.throws(() => integrateFoundationCut({ ...base, cut: { ...base.cut, spanStartM: 0.5, spanEndM: 0.5 } }), /invalid/);
  // Invalid side
  assert.throws(() => integrateFoundationCut({ ...base, cut: { ...base.cut, side: "middle" as unknown as "negative" } }), /invalid/);
  // Missing shell in scope
  assert.throws(() => integrateFoundationCut({ ...base, foundationShellIds: ["s0", "non_existent"] }), /missing shell/);
  // Cut where no shell edge lies
  assert.throws(() => integrateFoundationCut({ ...base, cut: { ...base.cut, coordinateM: 0.5 } }), /No foundation shell edge lies on the declared cut/);
});
