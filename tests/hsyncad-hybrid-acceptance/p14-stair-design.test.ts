import test from "node:test";
import assert from "node:assert/strict";
import { designStair } from "../../src/lib/hsyncad/structural/stair-design";
import {
  doubleFlightWithLandingGeometry,
  landingBenchmarkGeometry,
  stairDesignInput,
} from "../hsyncad-structural/stair-fixtures";

test("P14 stair design evaluates landing equilibrium, ULS moment, and service deflection", () => {
  const input = stairDesignInput(landingBenchmarkGeometry());
  const result = designStair(input);
  assert.equal(result.status, "local_review_ready");
  assert.equal(result.engineeringAcceptance, false);
  assert.ok(Math.abs(result.equilibrium.appliedKn - 45) < 1e-8);
  assert.ok(Math.abs(result.equilibrium.supportVerticalKn - 45) < 1e-8);
  assert.ok(result.checks.length > 0);
});

test("P14 stair design evaluates double flight with intermediate landing", () => {
  const input = stairDesignInput(doubleFlightWithLandingGeometry());
  const result = designStair(input);
  assert.equal(result.physicalComponentCount, 3);
  assert.ok(Math.abs(result.equilibrium.residualKn) < 1e-8);
  assert.equal(result.checks.filter((c) => c.id.endsWith(":serviceability")).length, 3);
});
