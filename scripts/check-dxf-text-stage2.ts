import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error dxf-viewer internal parser has no declaration file
import DxfParser from "dxf-viewer/src/parser/DxfParser.js";
import {
  normalizeParsedDxfTextStage2,
  originalDxfTextType,
  type DxfTextStage2Entity,
  type DxfTextStage2ParsedDxf,
} from "../src/lib/dokumantasyon/dxf-text-stage2";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureDir = path.join(root, "tests", "fixtures", "dxf");

async function parseFixture(name: string): Promise<DxfTextStage2ParsedDxf> {
  const text = await readFile(path.join(fixtureDir, name), "utf8");
  return new DxfParser().parseSync(text) as DxfTextStage2ParsedDxf;
}

function entitiesOfBlock(dxf: DxfTextStage2ParsedDxf, blockName: string): DxfTextStage2Entity[] {
  return dxf.blocks?.[blockName]?.entities ?? [];
}

async function main() {
  const constant = await parseFixture("stage2-constant-attdef.dxf");
  const constantBefore = entitiesOfBlock(constant, "CONST_LABEL").find((entity) => entity.type === "ATTDEF");
  assert.ok(constantBefore, "constant ATTDEF fixture should parse as ATTDEF before worker normalization");
  assert.equal(constantBefore.constant, true);

  const constantReport = normalizeParsedDxfTextStage2(constant);
  assert.equal(constantReport.constantAttdefCount, 1);
  assert.equal(constantReport.promotedConstantAttdefCount, 1);
  assert.equal(constantReport.variableAttdefCount, 0);
  assert.equal(constantReport.convertedAttribCount, 0);
  assert.equal(constantReport.blockingIssues.length, 0);
  const promoted = entitiesOfBlock(constant, "CONST_LABEL").find(
    (entity) => originalDxfTextType(entity) === "ATTDEF"
  );
  assert.ok(promoted, "constant ATTDEF should remain traceable to its source type");
  assert.equal(promoted.type, "TEXT", "constant ATTDEF should enter upstream TEXT render path");
  assert.equal(promoted.text, "SABIT-A1");
  assert.equal(promoted.textHeight, 5);
  assert.equal(promoted.xScale, 1);
  assert.equal(promoted.styleName, "STANDARD");

  const attributes = await parseFixture("stage2-attrib-width-owner.dxf");
  const topLevelBefore = attributes.entities ?? [];
  assert.equal(topLevelBefore.filter((entity) => entity.type === "ATTRIB").length, 2);
  assert.equal(topLevelBefore.filter((entity) => entity.type === "INSERT").length, 2);

  const attributeReport = normalizeParsedDxfTextStage2(attributes);
  assert.equal(attributeReport.convertedAttribCount, 2);
  assert.equal(attributeReport.repairedAttribOwnerCount, 2, "ownerless ATTRIBs should bind to their preceding INSERT");
  assert.equal(attributeReport.unresolvedAttribOwnerCount, 0);
  assert.equal(attributeReport.nonUnitAttributeWidthFactorCount, 2);
  assert.equal(attributeReport.variableAttdefCount, 1);
  assert.equal(attributeReport.promotedConstantAttdefCount, 0);
  assert.equal(attributeReport.blockingIssues.length, 0);

  const converted = (attributes.entities ?? []).filter((entity) => originalDxfTextType(entity) === "ATTRIB");
  assert.equal(converted.length, 2);
  assert.ok(converted.every((entity) => entity.type === "TEXT"), "ATTRIB should use upstream TEXT geometry path after normalization");
  assert.deepEqual(converted.map((entity) => entity.xScale), [0.5, 2]);
  assert.deepEqual(converted.map((entity) => entity.textHeight), [4, 4], "group 41 must not multiply text height");
  assert.deepEqual(converted.map((entity) => entity.layer), ["NARROW_LAYER", "WIDE_LAYER"]);
  assert.ok(converted.every((entity) => entity.ownerHandle !== undefined));

  const conflicting: DxfTextStage2ParsedDxf = {
    blocks: {
      B: { entities: [{ type: "ATTDEF", tag: "KOD", text: "CONST", constant: true, textHeight: 2 }] },
    },
    entities: [
      { type: "INSERT", handle: "10", name: "B", layer: "0" },
      { type: "ATTRIB", ownerHandle: "10", tag: "KOD", text: "INSTANCE", textHeight: 2, scale: 1 },
    ],
  };
  const conflictReport = normalizeParsedDxfTextStage2(conflicting);
  assert.equal(conflictReport.constantAttributeConflictCount, 1);
  assert.ok(conflictReport.blockingIssues.some((issue) => /constant ATTDEF/i.test(issue)));

  const unsupportedTransform: DxfTextStage2ParsedDxf = {
    entities: [{ type: "ATTRIB", text: "SKEW", textHeight: 2, scale: 1, obliqueAngle: 15 }],
  };
  const transformReport = normalizeParsedDxfTextStage2(unsupportedTransform);
  assert.equal(transformReport.unsupportedObliqueAttributeCount, 1);
  assert.ok(transformReport.blockingIssues.some((issue) => /oblique/i.test(issue)));

  const workerSource = await readFile(
    path.join(root, "src", "components", "dokumantasyon", "preview", "dxf-viewer-worker.ts"),
    "utf8"
  );
  assert.match(workerSource, /normalizeParsedDxfTextStage2\(dxf\)/);
  assert.match(workerSource, /DxfScene\.js/);
  assert.match(workerSource, /originalDxfTextType/);

  // Verify behavior-bearing structure rather than an implementation comment. The worker must keep a
  // clone-safe text census and both Stage 2/3 reports in the retained evidence returned to the main
  // thread. Comment wording is intentionally not part of the release contract.
  assert.match(workerSource, /function compactParsedTextEvidence\(/);
  assert.match(workerSource, /const stage2Report = dxf\[STAGE2_REPORT_KEY\]/);
  assert.match(workerSource, /const stage3Report = [\s\S]*\[STAGE3_LAYOUT_REPORT_KEY\]/);
  assert.match(workerSource, /__dxfTextStage2:\s*stage2Report/);
  assert.match(workerSource, /__dxfTextStage3Layout:\s*stage3Report/);
  assert.match(workerSource, /blocks,[\s\S]*\.\.\.\(stage2Report/);

  console.log("DXF Text Stage 2 ATTRIB/ATTDEF rendering checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
