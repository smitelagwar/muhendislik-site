import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { auditDxfStage3, getDxfStage3BlockingIssues } from "../src/lib/dokumantasyon/dxf-stage3-fidelity";
import { normalizeParsedDxfTextStage2, type DxfTextStage2ParsedDxf } from "../src/lib/dokumantasyon/dxf-text-stage2";
import { auditParsedDxfTextStage3Layout } from "../src/lib/dokumantasyon/dxf-text-stage3-layout";

const FIXTURE_DIR = path.resolve(process.cwd(), "tests", "fixtures", "dxf");

async function main() {
  const supported: DxfTextStage2ParsedDxf = {
    entities: [
      {
        type: "TEXT",
        text: "NORMAL",
        textHeight: 10,
        xScale: 1,
        startPoint: { x: 10, y: 20 },
      },
      {
        type: "TEXT",
        text: "ROTATED",
        textHeight: 10,
        xScale: 1,
        startPoint: { x: 30, y: 40 },
        rotation: 90,
      },
      {
        type: "TEXT",
        text: "CENTER",
        textHeight: 10,
        xScale: 2,
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 100, y: 100 },
        halign: 1,
        valign: 2,
      },
      {
        type: "MTEXT",
        text: "Türkçe ÇĞİÖŞÜ çğıöşü\\Pİkinci satır \\U+011E %%p %%d",
        height: 8,
        position: { x: 0, y: 0 },
        attachmentPoint: 5,
        lineSpacing: 1,
        direction: { x: 1, y: 0 },
        width: 100,
      },
    ],
    blocks: {},
  };

  const supportedReport = auditParsedDxfTextStage3Layout(supported);
  assert.equal(supportedReport.singleLineTextCount, 3);
  assert.equal(supportedReport.mtextCount, 1);
  assert.equal(supportedReport.rotatedTextCount, 2);
  assert.equal(supportedReport.alignedTextCount, 1);
  assert.equal(supportedReport.nonUnitWidthFactorCount, 1);
  assert.equal(supportedReport.mtextParagraphBreakCount, 1);
  assert.equal(supportedReport.turkishTextEntityCount, 1);
  assert.equal(supportedReport.specialEscapeCount, 3);
  assert.deepEqual(supportedReport.blockingIssues, []);

  const attrib: DxfTextStage2ParsedDxf = {
    entities: [
      { type: "INSERT", handle: "A1", name: "TAGGED", startPoint: { x: 0, y: 0 } },
      {
        type: "ATTRIB",
        ownerHandle: "A1",
        text: "GENIS",
        textHeight: 4,
        scale: 2,
        startPoint: { x: 0, y: 0 },
      },
    ],
    blocks: { TAGGED: { entities: [] } },
  };
  normalizeParsedDxfTextStage2(attrib);
  const attribReport = auditParsedDxfTextStage3Layout(attrib);
  assert.equal(attribReport.nonUnitWidthFactorCount, 1);
  assert.equal(attribReport.invalidWidthFactorCount, 0);
  assert.deepEqual(attribReport.blockingIssues, []);

  const invalid: DxfTextStage2ParsedDxf = {
    entities: [
      {
        type: "TEXT",
        text: "OBLIQUE",
        textHeight: 5,
        startPoint: { x: 0, y: 0 },
        obliqueAngle: 15,
      },
      {
        type: "TEXT",
        text: "MIRROR",
        textHeight: 5,
        startPoint: { x: 0, y: 10 },
        backwards: true,
      },
      {
        type: "TEXT",
        text: "BAD ALIGN",
        textHeight: 5,
        startPoint: { x: 0, y: 20 },
        halign: 1,
        valign: 2,
      },
      {
        type: "TEXT",
        text: "BAD WIDTH",
        textHeight: 5,
        startPoint: { x: 0, y: 30 },
        xScale: 0,
      },
      {
        type: "MTEXT",
        text: "BAD MTEXT",
        height: 5,
        position: { x: 0, y: 40 },
        attachmentPoint: 10,
        direction: { x: 0, y: 0 },
        lineSpacing: 5,
      },
    ],
    blocks: {},
  };
  const invalidReport = auditParsedDxfTextStage3Layout(invalid);
  assert.equal(invalidReport.unsupportedObliqueCount, 1);
  assert.equal(invalidReport.unsupportedMirroredCount, 1);
  assert.equal(invalidReport.missingAlignmentPointCount, 1);
  assert.equal(invalidReport.invalidWidthFactorCount, 1);
  assert.equal(invalidReport.invalidMtextAttachmentCount, 1);
  assert.equal(invalidReport.invalidMtextDirectionCount, 1);
  assert.equal(invalidReport.invalidMtextLineSpacingCount, 1);
  assert.ok(invalidReport.blockingIssues.length >= 7);

  const rawInvalid = await readFile(path.join(FIXTURE_DIR, "stage3-layout-invalid.dxf"), "utf8");
  const rawAudit = auditDxfStage3(rawInvalid);
  assert.equal(rawAudit.unsupportedTextObliqueCount, 1);
  assert.equal(rawAudit.unsupportedTextGenerationFlagCount, 1);
  assert.equal(rawAudit.invalidMtextAttachmentCount, 1);
  assert.equal(rawAudit.invalidMtextDirectionCount, 1);
  assert.equal(rawAudit.invalidMtextLineSpacingCount, 1);
  const rawBlocking = getDxfStage3BlockingIssues(rawAudit);
  assert.ok(rawBlocking.some((issue) => issue.includes("oblique")));
  assert.ok(rawBlocking.some((issue) => issue.includes("generation flag")));
  assert.ok(rawBlocking.some((issue) => issue.includes("MTEXT")));

  console.log("DXF Text Stage 3 layout fidelity checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
