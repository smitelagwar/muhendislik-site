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

  const entityCoverageText = await fixture("stage6-entity-coverage.dxf");
  const entityCoverage = auditDxfEntityCoverage(entityCoverageText);
  assert.deepEqual(entityCoverage.unclassifiedSupportedTypes, []);
  assert.deepEqual(entityCoverage.blockedTypes, []);
  assert.deepEqual(
    entityCoverage.verifiedTypes,
    ["3DFACE", "ARC", "CIRCLE", "ELLIPSE", "INSERT", "LINE", "LWPOLYLINE", "POINT", "POLYLINE", "SOLID"]
  );
  assert.deepEqual(entityCoverage.conditionalTypes, ["HATCH", "SPLINE"]);
  const entityCoverageStage4 = auditDxfStage4(entityCoverageText);
  assert.equal(entityCoverageStage4.visibleModelSpaceGeometryCount, 12);
  assert.equal(entityCoverageStage4.splineCount, 1);
  assert.equal(entityCoverageStage4.hatchCount, 1);
  assert.deepEqual(getDxfStage4BlockingIssues(entityCoverageStage4), []);
  assert.deepEqual(getDxfReleaseHardeningBlockingIssues(auditDxfReleaseHardening(entityCoverageText)), []);

  const unsupportedText = await fixture("unsupported-annotations.dxf");
  const unsupported = auditDxfReleaseHardening(unsupportedText);
  assert.equal(unsupported.visibleModelUnsupportedEntityCount, 2);
  assert.equal(unsupported.reachableBlockUnsupportedEntityCount, 0);
  assert.equal(unsupported.blockedUnsupportedEntityCount, 2);
  assert.deepEqual(unsupported.blockedUnsupportedTypes, ["LEADER", "MLEADER"]);
  assert.match(getDxfReleaseHardeningBlockingIssues(unsupported).join("\n"), /LEADER/);
  assert.deepEqual(auditDxfEntityCoverage(unsupportedText).blockedTypes, ["LEADER", "MLEADER"]);

  const missingBlock = auditDxfReleaseHardening(await fixture("missing-block-only.dxf"));
  assert.equal(missingBlock.blockedMissingBlockReferenceCount, 1);
  assert.deepEqual(missingBlock.blockedMissingBlockReferences, ["MISSING_DETAIL"]);
  assert.match(getDxfReleaseHardeningBlockingIssues(missingBlock).join("\n"), /MISSING_DETAIL/);

  const emptyDefinedBlock = auditDxfReleaseHardening([
    "0", "SECTION", "2", "HEADER", "9", "$ACADVER", "1", "AC1027", "0", "ENDSEC",
    "0", "SECTION", "2", "BLOCKS",
    "0", "BLOCK", "8", "0", "2", "EMPTY_OK", "70", "0", "10", "0", "20", "0", "30", "0", "3", "EMPTY_OK",
    "0", "ENDBLK", "0", "ENDSEC",
    "0", "SECTION", "2", "ENTITIES",
    "0", "INSERT", "8", "0", "2", "EMPTY_OK", "10", "0", "20", "0", "30", "0",
    "0", "ENDSEC", "0", "EOF", "",
  ].join("\n"));
  assert.equal(emptyDefinedBlock.blockedMissingBlockReferenceCount, 0, "defined empty BLOCK must not be mislabeled as missing");
  assert.equal(emptyDefinedBlock.reachableBlockCount, 1);

  const arbitraryOcs = auditDxfReleaseHardening(await fixture("ocs-arc-circle.dxf"));
  assert.equal(arbitraryOcs.unsafeOcsEntityCount, 2);
  assert.deepEqual(arbitraryOcs.unsafeOcsTypes, ["ARC", "CIRCLE"]);
  assert.match(getDxfReleaseHardeningBlockingIssues(arbitraryOcs).join("\n"), /OCS/);

  const suppressedText = await fixture("suppressed-unsupported.dxf");
  const suppressed = auditDxfReleaseHardening(suppressedText);
  assert.equal(suppressed.blockedUnsupportedEntityCount, 0);
  assert.equal(suppressed.blockedMissingBlockReferenceCount, 0);
  assert.equal(suppressed.unsafeOcsEntityCount, 0);
  assert.equal(suppressed.ignoredUnsupportedEntityCount, 3);
  assert.deepEqual(getDxfReleaseHardeningBlockingIssues(suppressed), []);
  assert.ok(
    auditDxfEntityCoverage(suppressedText).blockedTypeCount > 0,
    "raw entity coverage must still inventory suppressed unsupported records without false-positive blocking"
  );

  const largeCoordinates = auditDxfReleaseHardening(await fixture("stage7-large-coordinate-bulge.dxf"));
  assert.deepEqual(getDxfReleaseHardeningBlockingIssues(largeCoordinates), []);

  const colorHatch = auditDxfReleaseHardening(await fixture("stage7-color-hatch.dxf"));
  assert.deepEqual(getDxfReleaseHardeningBlockingIssues(colorHatch), []);
  assert.equal(colorHatch.reachableBlockCount, 1);

  const viewerSource = await readFile(
    path.join(root, "src", "components", "dokumantasyon", "preview", "cad-viewer.tsx"),
    "utf8"
  );
  assert.match(viewerSource, /auditDxfReleaseHardening\(dxfText\)/);
  assert.match(viewerSource, /getDxfReleaseHardeningBlockingIssues\(releaseHardeningAudit\)/);
  assert.match(viewerSource, /releaseHardening:\s*releaseHardeningAudit/);

  const layerBrowserSpec = await readFile(
    path.join(root, "tests", "document-studio", "dxf-layers.spec.ts"),
    "utf8"
  );
  assert.match(layerBrowserSpec, /stage6-entity-coverage\.dxf/);
  for (const layer of [
    "COV_LINE", "COV_LWPOLYLINE", "COV_POLYLINE", "COV_ARC", "COV_CIRCLE", "COV_ELLIPSE",
    "COV_POINT", "COV_SOLID", "COV_3DFACE", "COV_SPLINE", "COV_HATCH", "COV_INSERT",
  ]) {
    assert.match(layerBrowserSpec, new RegExp(layer));
  }

  console.log("DXF release hardening and entity compatibility coverage checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
