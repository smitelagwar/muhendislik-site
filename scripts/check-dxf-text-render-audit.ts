import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  auditDxfTextRenderSource,
  auditParsedDxfText,
  evaluateDxfTextRenderEvidence,
  type DxfFontProbe,
} from "../src/lib/dokumantasyon/dxf-text-render-audit";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureDir = path.join(root, "tests", "fixtures", "dxf");

async function fixture(name: string) {
  return readFile(path.join(fixtureDir, name), "utf8");
}

function goodFonts(): DxfFontProbe[] {
  return [
    { url: "/fonts/Arial-Regular.ttf", ok: true, status: 200, bytes: 120000, contentType: "font/ttf", error: null },
    { url: "/fonts/Arial-Bold.ttf", ok: true, status: 200, bytes: 130000, contentType: "font/ttf", error: null },
  ];
}

async function main() {
  const stage3 = auditDxfTextRenderSource(await fixture("stage3-text-mtext.dxf"));
  assert.equal(stage3.totalTextRecords, 3);
  assert.equal(stage3.topLevelTextRecords, 3);
  assert.equal(stage3.blockTextRecords, 0);
  assert.equal(stage3.renderCandidateTextRecords, 3);
  assert.equal(stage3.candidateByType.TEXT, 2);
  assert.equal(stage3.candidateByType.MTEXT, 1);
  assert.equal(stage3.nonPositiveHeightRecords, 1);
  assert.equal(stage3.minPositiveHeight, 2.5);
  assert.equal(stage3.maxPositiveHeight, 2.5);
  assert.ok(stage3.textStyles.includes("STANDARD"));
  assert.ok(stage3.textStyles.includes("SHXSTYLE"));
  assert.ok(stage3.textStyles.includes("MISSING_STYLE"));

  const blockText = auditDxfTextRenderSource(await fixture("blocks-attrib.dxf"));
  assert.equal(blockText.totalTextRecords, 2);
  assert.equal(blockText.visibleModelTextRecords, 1);
  assert.equal(blockText.reachableBlockTextRecords, 1);
  assert.equal(blockText.renderCandidateTextRecords, 2);
  assert.equal(blockText.candidateByType.ATTRIB, 1);
  assert.equal(blockText.candidateByType.ATTDEF, 1);
  assert.equal(blockText.visibleAttdefRecords, 1);
  assert.deepEqual(blockText.reachableBlocks, ["TAGGED_BLOCK"]);
  assert.ok(blockText.attributeTags.includes("KOD"));

  const parsed = auditParsedDxfText({
    entities: [
      { type: "TEXT" },
      { type: "MTEXT" },
      { type: "ATTRIB" },
      { type: "LINE" },
    ],
    blocks: {
      TAGGED_BLOCK: { entities: [{ type: "ATTDEF" }, { type: "LINE" }] },
    },
  });
  assert.equal(parsed.available, true);
  assert.equal(parsed.totalTextRecords, 4);
  assert.equal(parsed.topLevelTextRecords, 3);
  assert.equal(parsed.blockTextRecords, 1);
  assert.deepEqual(parsed.byType, { TEXT: 1, MTEXT: 1, ATTRIB: 1, ATTDEF: 1 });

  const healthyEvidence = evaluateDxfTextRenderEvidence({
    source: stage3,
    parsed: {
      available: true,
      totalTextRecords: 3,
      topLevelTextRecords: 3,
      blockTextRecords: 0,
      byType: { TEXT: 2, MTEXT: 1, ATTRIB: 0, ATTDEF: 0 },
    },
    fontProbes: goodFonts(),
    rendererMissingChars: false,
  });
  assert.equal(healthyEvidence.parserLossCount, 0);
  assert.equal(healthyEvidence.status, "warning", "zero-height source record should remain diagnosable");
  assert.ok(healthyEvidence.issues.some((issue) => /sıfır\/negatif/i.test(issue)));

  const parserLossEvidence = evaluateDxfTextRenderEvidence({
    source: blockText,
    parsed: {
      available: true,
      totalTextRecords: 1,
      topLevelTextRecords: 1,
      blockTextRecords: 0,
      byType: { TEXT: 0, MTEXT: 0, ATTRIB: 1, ATTDEF: 0 },
    },
    fontProbes: goodFonts(),
    rendererMissingChars: false,
  });
  assert.equal(parserLossEvidence.status, "blocking");
  assert.equal(parserLossEvidence.parserLossCount, 1);
  assert.ok(parserLossEvidence.issues.some((issue) => /parser arasında 1 text kaydı kayboldu/i.test(issue)));
  assert.ok(parserLossEvidence.issues.some((issue) => /ATTDEF/i.test(issue)));

  const fontFailureEvidence = evaluateDxfTextRenderEvidence({
    source: stage3,
    parsed: {
      available: true,
      totalTextRecords: 3,
      topLevelTextRecords: 3,
      blockTextRecords: 0,
      byType: { TEXT: 2, MTEXT: 1, ATTRIB: 0, ATTDEF: 0 },
    },
    fontProbes: goodFonts().map((font) => ({ ...font, ok: false, status: 404, bytes: 0, error: "not found" })),
    rendererMissingChars: true,
  });
  assert.equal(fontFailureEvidence.status, "blocking");
  assert.ok(fontFailureEvidence.issues.some((issue) => /fallback font/i.test(issue)));
  assert.ok(fontFailureEvidence.issues.some((issue) => /glyph/i.test(issue)));

  const viewerSource = await readFile(
    path.join(root, "src", "components", "dokumantasyon", "preview", "cad-viewer.tsx"),
    "utf8"
  );
  const workerSource = await readFile(
    path.join(root, "src", "components", "dokumantasyon", "preview", "dxf-viewer-worker.ts"),
    "utf8"
  );
  assert.match(viewerSource, /auditDxfTextRenderSource\(dxfText\)/);
  assert.match(viewerSource, /probeDxfFontUrls\(DXF_FONT_URLS/);
  assert.match(viewerSource, /retainParsedDxf:\s*textSourceAudit\.renderCandidateTextRecords > 0/);
  assert.match(viewerSource, /auditParsedDxfText\(parsedDxf\)/);
  assert.match(viewerSource, /viewer\.parsedDxf = undefined/);
  assert.match(viewerSource, /cad-dxf-text-evidence/);
  assert.match(viewerSource, /cad-dxf-text-render-evidence/);

  assert.match(workerSource, /dxf-viewer\/src\/DxfWorker\.js/);
  assert.match(workerSource, /compactParsedTextEvidence/);
  assert.match(workerSource, /TEXT_TYPES/);
  assert.match(workerSource, /options\.retainParsedDxf === true/);
  assert.match(workerSource, /result\.dxf = compactParsedTextEvidence\(result\.dxf\)/);
  assert.doesNotMatch(workerSource, /DxfViewer\.SetupWorker\(\)/);

  console.log("DXF text source→parser/font evidence checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});