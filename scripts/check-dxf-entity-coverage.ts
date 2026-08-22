import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  auditDxfEntityCoverage,
  getDxfEntityCoveragePolicySummary,
} from "../src/lib/dokumantasyon/dxf-entity-coverage";
import {
  auditDxfReleaseHardening,
  getDxfReleaseHardeningBlockingIssues,
} from "../src/lib/dokumantasyon/dxf-release-hardening";
import { auditDxfStage4, getDxfStage4BlockingIssues } from "../src/lib/dokumantasyon/dxf-stage4-fidelity";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureDir = path.join(root, "tests", "fixtures", "dxf");

async function fixture(name: string) {
  return readFile(path.join(fixtureDir, name), "utf8");
}

async function main() {
  const policy = getDxfEntityCoveragePolicySummary();
  assert.deepEqual(
    [...policy.verified, ...policy.conditional].sort(),
    policy.rendererSupported,
    "every renderer-supported entity type must have an explicit verified/conditional fidelity contract"
  );

  const positiveText = await fixture("stage6-entity-coverage.dxf");
  const positive = auditDxfEntityCoverage(positiveText);
  assert.deepEqual(positive.unclassifiedSupportedTypes, []);
  assert.deepEqual(positive.blockedTypes, []);
  assert.deepEqual(
    positive.verifiedTypes,
    ["3DFACE", "ARC", "CIRCLE", "ELLIPSE", "INSERT", "LINE", "LWPOLYLINE", "POINT", "POLYLINE", "SOLID"]
  );
  assert.deepEqual(positive.conditionalTypes, ["HATCH", "SPLINE"]);

  const stage4 = auditDxfStage4(positiveText);
  assert.equal(stage4.visibleModelSpaceGeometryCount, 12);
  assert.equal(stage4.splineCount, 1);
  assert.equal(stage4.hatchCount, 1);
  assert.deepEqual(getDxfStage4BlockingIssues(stage4), []);
  assert.deepEqual(getDxfReleaseHardeningBlockingIssues(auditDxfReleaseHardening(positiveText)), []);

  const unsupportedText = await fixture("unsupported-annotations.dxf");
  const unsupportedCoverage = auditDxfEntityCoverage(unsupportedText);
  assert.deepEqual(unsupportedCoverage.blockedTypes, ["LEADER", "MLEADER"]);
  assert.equal(unsupportedCoverage.blockedTypeCount, 2);
  assert.match(
    getDxfReleaseHardeningBlockingIssues(auditDxfReleaseHardening(unsupportedText)).join("\n"),
    /LEADER|MLEADER/
  );

  const suppressedText = await fixture("suppressed-unsupported.dxf");
  const suppressedCoverage = auditDxfEntityCoverage(suppressedText);
  assert.ok(suppressedCoverage.blockedTypeCount > 0, "raw census must still classify suppressed unsupported records");
  assert.deepEqual(
    getDxfReleaseHardeningBlockingIssues(auditDxfReleaseHardening(suppressedText)),
    [],
    "source-hidden/paper/unreachable unsupported records must not false-positive block the model viewer"
  );

  const browserSpec = await readFile(
    path.join(root, "tests", "document-studio", "dxf-entity-coverage.spec.ts"),
    "utf8"
  );
  assert.match(browserSpec, /stage6-entity-coverage\.dxf/);
  for (const layer of [
    "COV_LINE",
    "COV_LWPOLYLINE",
    "COV_POLYLINE",
    "COV_ARC",
    "COV_CIRCLE",
    "COV_ELLIPSE",
    "COV_POINT",
    "COV_SOLID",
    "COV_3DFACE",
    "COV_SPLINE",
    "COV_HATCH",
    "COV_INSERT",
  ]) {
    assert.match(browserSpec, new RegExp(layer));
  }

  console.log("DXF Stage 6 entity compatibility/coverage checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
