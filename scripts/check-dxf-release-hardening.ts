import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  auditDxfReleaseHardening,
  getDxfReleaseHardeningBlockingIssues,
} from "../src/lib/dokumantasyon/dxf-release-hardening";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureDir = path.join(root, "tests", "fixtures", "dxf");

async function fixture(name: string) {
  return readFile(path.join(fixtureDir, name), "utf8");
}

async function main() {
  const unsupported = auditDxfReleaseHardening(await fixture("unsupported-annotations.dxf"));
  assert.equal(unsupported.visibleModelUnsupportedEntityCount, 2);
  assert.equal(unsupported.reachableBlockUnsupportedEntityCount, 0);
  assert.equal(unsupported.blockedUnsupportedEntityCount, 2);
  assert.deepEqual(unsupported.blockedUnsupportedTypes, ["LEADER", "MLEADER"]);
  assert.match(getDxfReleaseHardeningBlockingIssues(unsupported).join("\n"), /LEADER/);

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

  const suppressed = auditDxfReleaseHardening(await fixture("suppressed-unsupported.dxf"));
  assert.equal(suppressed.blockedUnsupportedEntityCount, 0);
  assert.equal(suppressed.blockedMissingBlockReferenceCount, 0);
  assert.equal(suppressed.unsafeOcsEntityCount, 0);
  assert.equal(suppressed.ignoredUnsupportedEntityCount, 3);
  assert.deepEqual(getDxfReleaseHardeningBlockingIssues(suppressed), []);

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

  console.log("DXF release hardening compatibility checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
