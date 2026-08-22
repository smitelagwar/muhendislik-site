import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decodeDxfBytes, detectDxfEncoding } from "../src/lib/dokumantasyon/dxf-encoding";
import {
  auditDxfText,
  getDxfFidelityWarnings,
  getDxfStage2BlockingIssues,
} from "../src/lib/dokumantasyon/dxf-fidelity-audit";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const WINDOWS_1254_EXTRA = new Map<string, number>([
  ["Ç", 0xc7],
  ["Ğ", 0xd0],
  ["İ", 0xdd],
  ["Ö", 0xd6],
  ["Ş", 0xde],
  ["Ü", 0xdc],
  ["ç", 0xe7],
  ["ğ", 0xf0],
  ["ı", 0xfd],
  ["ö", 0xf6],
  ["ş", 0xfe],
  ["ü", 0xfc],
]);

function encodeWindows1254(text: string): Uint8Array {
  const bytes: number[] = [];
  for (const char of text) {
    const mapped = WINDOWS_1254_EXTRA.get(char);
    if (mapped !== undefined) {
      bytes.push(mapped);
      continue;
    }
    const codePoint = char.codePointAt(0) ?? 0x3f;
    if (codePoint > 0xff) throw new Error(`Test encoder cannot encode ${char}`);
    bytes.push(codePoint);
  }
  return Uint8Array.from(bytes);
}

const legacyText = [
  "0", "SECTION", "2", "HEADER",
  "9", "$ACADVER", "1", "AC1015",
  "9", "$DWGCODEPAGE", "3", "ANSI_1254",
  "0", "ENDSEC",
  "0", "SECTION", "2", "ENTITIES",
  "0", "TEXT", "8", "0", "10", "0", "20", "0", "40", "2.5", "1", "ÇĞİÖŞÜ çğıöşü",
  "0", "ENDSEC", "0", "EOF", "",
].join("\n");
const legacyBytes = encodeWindows1254(legacyText);
const legacyEncoding = detectDxfEncoding(legacyBytes);
assert.equal(legacyEncoding.encoding, "windows-1254");
assert.equal(legacyEncoding.source, "dwg-codepage");
assert.equal(legacyEncoding.codePage, "ANSI_1254");
assert.match(decodeDxfBytes(legacyBytes, legacyEncoding.encoding), /ÇĞİÖŞÜ çğıöşü/);

const modernText = legacyText.replace("AC1015", "AC1021");
const modernBytes = new TextEncoder().encode(modernText);
const modernEncoding = detectDxfEncoding(modernBytes);
assert.equal(modernEncoding.encoding, "utf-8");
assert.equal(modernEncoding.source, "acad-version");

const binaryBytes = new TextEncoder().encode("AutoCAD Binary DXF\r\n\u001a\u0000test");
assert.equal(detectDxfEncoding(binaryBytes).isBinary, true);

const fixture = await readFile(path.join(root, "tests", "fixtures", "dxf", "stage2-block-transforms.dxf"), "utf8");
const audit = auditDxfText(fixture);
assert.equal(audit.blockDefinitionCount, 2);
assert.equal(audit.nestedInsertCount, 1);
assert.equal(audit.transformedInsertCount, 2);
assert.equal(audit.mirroredInsertCount, 1);
assert.equal(audit.nonUniformScaleInsertCount, 1);
assert.equal(audit.arrayInsertCount, 1);
assert.equal(audit.zeroScaleInsertCount, 0);
assert.equal(audit.missingBlockReferenceCount, 1);
assert.deepEqual(audit.missingBlockReferences, ["MISSING_BLOCK"]);
assert.equal(audit.nonDefaultOcsEntityCount, 1);
assert.equal(audit.nonDefaultOcsInsertCount, 0);

const warnings = getDxfFidelityWarnings(audit).join("\n");
assert.match(warnings, /MISSING_BLOCK/);
assert.match(warnings, /nested INSERT/);
assert.match(warnings, /non-default extrusion\/OCS/);

const blocking = getDxfStage2BlockingIssues(audit).join("\n");
assert.match(blocking, /grid\/array INSERT/);

const ocsFixture = await readFile(path.join(root, "tests", "fixtures", "dxf", "stage2-ocs-insert.dxf"), "utf8");
const ocsAudit = auditDxfText(ocsFixture);
assert.equal(ocsAudit.nonDefaultOcsInsertCount, 1);
assert.match(getDxfStage2BlockingIssues(ocsAudit).join("\n"), /INSERT non-default extrusion\/OCS/);

const cycleText = [
  "0", "SECTION", "2", "BLOCKS",
  "0", "BLOCK", "8", "0", "2", "A", "70", "0", "10", "0", "20", "0", "30", "0", "3", "A", "1", "",
  "0", "INSERT", "8", "0", "2", "B", "10", "0", "20", "0", "30", "0",
  "0", "ENDBLK", "8", "0",
  "0", "BLOCK", "8", "0", "2", "B", "70", "0", "10", "0", "20", "0", "30", "0", "3", "B", "1", "",
  "0", "INSERT", "8", "0", "2", "A", "10", "0", "20", "0", "30", "0",
  "0", "ENDBLK", "8", "0",
  "0", "ENDSEC",
  "0", "SECTION", "2", "ENTITIES",
  "0", "INSERT", "8", "0", "2", "A", "10", "0", "20", "0", "30", "0",
  "0", "ENDSEC", "0", "EOF", "",
].join("\n");
const cycleAudit = auditDxfText(cycleText);
assert.equal(cycleAudit.blockCycleCount, 1);
assert.match(cycleAudit.blockCycles[0], /A → B → A|B → A → B/);
assert.match(getDxfStage2BlockingIssues(cycleAudit).join("\n"), /recursive BLOCK\/INSERT/);

const viewerSource = await readFile(
  path.join(root, "src", "components", "dokumantasyon", "preview", "cad-viewer.tsx"),
  "utf8"
);
assert.match(viewerSource, /response\.arrayBuffer\(\)/);
assert.match(viewerSource, /detectDxfEncoding\(dxfBytes\)/);
assert.match(viewerSource, /fileEncoding:\s*encoding\.encoding/);
assert.match(viewerSource, /new Blob\(\[dxfBuffer\]/);
assert.match(viewerSource, /getDxfStage2BlockingIssues\(audit\)/);
assert.doesNotMatch(viewerSource, /response\.text\(\)/);

console.log("DXF Stage 2 encoding/block hardening checks passed.");
