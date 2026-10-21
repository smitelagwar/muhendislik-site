import assert from "node:assert/strict";
import { acceptsL11ProductionRelease } from "../document-studio/l11-release-acceptance";

const base = { executionMode: "production-release", performanceResult: "PASS" };
assert.equal(acceptsL11ProductionRelease({ ...base, qualityStatus: "degraded" }), false,
  "a degraded source scene must not be reported as an accepted production release");
assert.equal(acceptsL11ProductionRelease({ ...base, qualityStatus: "exact" }), true);
assert.equal(acceptsL11ProductionRelease({ ...base, executionMode: "diagnostic-high-heap", qualityStatus: "exact" }), false);
assert.equal(acceptsL11ProductionRelease({ ...base, performanceResult: "FAIL", qualityStatus: "exact" }), false);
console.log("PASS: L11 release report acceptance requires production mode, performance gates, and exact scene quality");
