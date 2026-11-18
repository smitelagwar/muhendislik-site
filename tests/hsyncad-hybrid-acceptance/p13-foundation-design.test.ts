import test from "node:test";
import assert from "node:assert/strict";
import { runRaftFoundationCase } from "../../src/lib/hsyncad/structural/foundation-design";
import { syntheticRaftFixture } from "../hsyncad-structural/foundation-fixtures";

test("P13 foundation design solves compression-only raft with valid support reactions and cuts", () => {
  const input = syntheticRaftFixture(2);
  const result = runRaftFoundationCase(input);
  assert.equal(result.status, "solved_limited_profile");
  if (result.status !== "solved_limited_profile") return;
  assert.equal(result.solver.status, "solved");
  assert.equal(result.analysisApproved, false);
  assert.equal(result.engineeringAcceptance, false);
  assert.ok(result.bearing.qmaxKpa! > 0);
  assert.ok(result.shellSectionActions.length >= 1);
});

test("P13 foundation design blocks missing support reactions or mismatched revision", () => {
  const input = syntheticRaftFixture(2);
  const blocked = runRaftFoundationCase({
    ...input,
    analysisIdentity: {
      ...input.analysisIdentity,
      projectRevision: input.project.revision + 99,
    },
    supportReactions: [],
  });
  assert.equal(blocked.status, "blocked");
  if (blocked.status === "blocked") {
    assert.ok(blocked.blockers.length >= 2);
  }
});
