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
