import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  auditDxfStage3,
  getDxfStage3BlockingIssues,
  getDxfStage3Warnings,
  normalizeDxfTextForStage3Rendering,
} from "../src/lib/dokumantasyon/dxf-stage3-fidelity";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readFixture(name: string) {
  return readFile(path.join(root, "tests", "fixtures", "dxf", name), "utf8");
}

async function main() {
  const textFixture = await readFixture("stage3-text-mtext.dxf");
  const textAudit = auditDxfStage3(textFixture);
  assert.equal(textAudit.textRecordCount, 3);
  assert.equal(textAudit.mtextCount, 1);
  assert.equal(textAudit.stackedFractionCount, 1);
  assert.equal(textAudit.rotatedTextCount, 1);
  assert.equal(textAudit.alignedTextCount, 2);
  assert.equal(textAudit.nonPositiveTextHeightCount, 1);
  assert.equal(textAudit.styleDefinitionCount, 2);
  assert.equal(textAudit.shxStyleCount, 1);
  assert.deepEqual(textAudit.shxStyles, ["SHXSTYLE"]);
  assert.equal(textAudit.missingTextStyleReferenceCount, 1);
  assert.deepEqual(textAudit.missingTextStyles, ["MISSING_STYLE"]);

  const normalized = normalizeDxfTextForStage3Rendering(textFixture);
  assert.equal(normalized.stackedFractionFallbackCount, 1);
  assert.match(normalized.text, /Kesit: 1\/2 m/);
  assert.match(normalized.text, /ÇĞİÖŞÜ çğıöşü/);
  assert.doesNotMatch(normalized.text, /\\S1\^2;/);

  const escapedMtext = [
    "0", "SECTION", "2", "ENTITIES",
    "0", "MTEXT", "8", "0", "10", "0", "20", "0", "40", "2.5", "1", String.raw`Literal: \\S1^2; gerçek: \S3^4;`,
    "0", "ENDSEC", "0", "EOF", "",
  ].join("\n");
  const escapedAudit = auditDxfStage3(escapedMtext);
  assert.equal(escapedAudit.stackedFractionCount, 1, "escaped literal \\S must not be audited as a stacked fraction");
  const escapedNormalized = normalizeDxfTextForStage3Rendering(escapedMtext);
  assert.equal(escapedNormalized.stackedFractionFallbackCount, 1);
  assert.ok(escapedNormalized.text.includes(String.raw`Literal: \\S1^2; gerçek: 3/4`));

  const textWarnings = getDxfStage3Warnings(textAudit).join("\n");
  assert.match(textWarnings, /stacked fraction/);
  assert.match(textWarnings, /SHX/);
  assert.match(textWarnings, /MISSING_STYLE/);
  assert.equal(getDxfStage3BlockingIssues(textAudit).length, 0);

  const dimensionFixture = await readFixture("stage3-dimensions.dxf");
  const dimensionAudit = auditDxfStage3(dimensionFixture);
  assert.equal(dimensionAudit.dimensionCount, 5);
  assert.equal(dimensionAudit.linearDimensionCount, 2);
  assert.equal(dimensionAudit.alignedDimensionCount, 1);
  assert.equal(dimensionAudit.unsupportedDimensionCount, 2);
  assert.equal(dimensionAudit.unsupportedDimensionWithoutBlockCount, 1);
  assert.deepEqual(dimensionAudit.unsupportedDimensionTypes, ["diameter", "radius"]);
  assert.equal(dimensionAudit.dimensionWithResolvedBlockCount, 1);
  assert.equal(dimensionAudit.missingDimensionBlockReferenceCount, 0);
  assert.equal(dimensionAudit.malformedSupportedDimensionCount, 1);
  assert.equal(dimensionAudit.dimensionStyleDefinitionCount, 1);
  assert.equal(dimensionAudit.missingDimensionStyleReferenceCount, 1);
  assert.deepEqual(dimensionAudit.missingDimensionStyles, ["MISSING_DIMSTYLE"]);

  const dimensionBlocking = getDxfStage3BlockingIssues(dimensionAudit).join("\n");
  assert.match(dimensionBlocking, /render edilebilir hazır block yok/);
  assert.match(dimensionBlocking, /zorunlu tanım noktalarını içermiyor/);

  const nestedDimensionOnly = [
    "0", "SECTION", "2", "BLOCKS",
    "0", "BLOCK", "8", "0", "2", "DETAIL_BLOCK", "70", "0", "10", "0", "20", "0", "30", "0", "3", "DETAIL_BLOCK", "1", "",
    "0", "DIMENSION", "8", "0", "3", "STANDARD", "70", "4", "10", "0", "20", "0",
    "0", "ENDBLK", "8", "0",
    "0", "ENDSEC",
    "0", "SECTION", "2", "ENTITIES",
    "0", "LINE", "8", "0", "10", "0", "20", "0", "11", "10", "21", "0",
    "0", "ENDSEC", "0", "EOF", "",
  ].join("\n");
  const nestedDimensionAudit = auditDxfStage3(nestedDimensionOnly);
  assert.equal(nestedDimensionAudit.dimensionCount, 0, "DIMENSION inside BLOCKS must not be double-counted as a top-level drawing dimension");
  assert.equal(getDxfStage3BlockingIssues(nestedDimensionAudit).length, 0);

  const viewerSource = await readFile(
    path.join(root, "src", "components", "dokumantasyon", "preview", "cad-viewer.tsx"),
    "utf8"
  );
  assert.match(viewerSource, /auditDxfStage3\(dxfText\)/);
  assert.match(viewerSource, /normalizeDxfTextForStage3Rendering\(dxfText\)/);
  assert.match(viewerSource, /getDxfStage3BlockingIssues\(stage3Audit\)/);
  assert.match(viewerSource, /normalizeDxfForStage4Rendering\(stage3Normalization\.text\)/);
  assert.match(viewerSource, /new Blob\(\[stage4Normalization\.text\]/);
  assert.match(viewerSource, /fileEncoding:\s*"utf-8"/);
  assert.doesNotMatch(viewerSource, /new Blob\(\[dxfBuffer\]/);

  console.log("DXF Stage 3 TEXT/MTEXT/DIMENSION fidelity checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
