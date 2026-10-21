import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parseDxfToCanonical } from "../../src/lib/cad-v2/decode/dxf-adapter";
import { evaluateDocumentQuality } from "../../src/lib/cad-v2/canonical/diagnostics";

async function run() {
  const fixturePath = path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/known-geometry-measurements.dxf");
  const fixture = fs.readFileSync(fixturePath, "utf8");
  const blocks = [
    "0", "SECTION", "2", "BLOCKS",
    "0", "BLOCK", "5", "B100", "100", "AcDbEntity", "8", "0", "100", "AcDbBlockBegin", "2", "ROOT", "70", "0", "10", "0", "20", "0", "30", "0",
    "0", "INSERT", "5", "I101", "100", "AcDbEntity", "8", "0", "100", "AcDbBlockReference", "2", "NESTED", "10", "0", "20", "0", "30", "0", "41", "1", "42", "1", "43", "1", "50", "0",
    "0", "ENDBLK", "5", "E100", "100", "AcDbEntity", "8", "0", "100", "AcDbBlockEnd",
    "0", "BLOCK", "5", "B101", "100", "AcDbEntity", "8", "0", "100", "AcDbBlockBegin", "2", "NESTED", "70", "0", "10", "0", "20", "0", "30", "0",
    "0", "SOLID", "5", "S101", "100", "AcDbEntity", "8", "GEOMETRY", "100", "AcDbTrace", "10", "0", "20", "0", "30", "0", "11", "10", "21", "0", "31", "0", "12", "10", "22", "10", "32", "0", "13", "0", "23", "10", "33", "0",
    "0", "ENDBLK", "5", "E101", "100", "AcDbEntity", "8", "0", "100", "AcDbBlockEnd",
    "0", "BLOCK", "5", "B102", "100", "AcDbEntity", "8", "0", "100", "AcDbBlockBegin", "2", "UNUSED", "70", "0", "10", "0", "20", "0", "30", "0",
    "0", "SOLID", "5", "S_UNUSED", "100", "AcDbEntity", "8", "GEOMETRY", "100", "AcDbTrace", "10", "0", "20", "0", "30", "0", "11", "10", "21", "0", "31", "0", "12", "10", "22", "10", "32", "0", "13", "0", "23", "10", "33", "0",
    "0", "ENDBLK", "5", "E102", "100", "AcDbEntity", "8", "0", "100", "AcDbBlockEnd",
    "0", "ENDSEC",
  ].join("\n");
  const rootInsert = ["0", "INSERT", "5", "I_ROOT", "100", "AcDbEntity", "8", "GEOMETRY", "100", "AcDbBlockReference", "2", "ROOT", "10", "0", "20", "0", "30", "0", "41", "1", "42", "1", "43", "1", "50", "0"].join("\n");
  const withBlocks = fixture.replace("0\nSECTION\n2\nENTITIES", `${blocks}\n0\nSECTION\n2\nENTITIES`);
  const source = withBlocks.replace(/0\r?\nENDSEC\r?\n0\r?\nEOF\s*$/, `${rootInsert}\n0\nENDSEC\n0\nEOF\n`);
  assert.notEqual(source, fixture, "the DXF fixture must contain the reachable nested SOLID and one unreachable control");

  const doc = await parseDxfToCanonical(Buffer.from(source, "utf8"), { sourceVersionKey: "l07-dxf-nested-unsupported" });
  const solidDiagnostics = doc.diagnostics.filter((diagnostic) => diagnostic.code === "UNSUPPORTED_ENTITY_TYPE" && /DXF SOLID entity/.test(diagnostic.message));
  assert.equal(solidDiagnostics.length, 1, "the reachable nested SOLID must receive one explicit diagnostic");
  assert.equal(solidDiagnostics[0]?.entityHandle, "S101", "the diagnostic must retain the source handle");
  assert(!solidDiagnostics.some((diagnostic) => diagnostic.entityHandle === "S_UNUSED"), "an unreachable block definition must not degrade this scene");
  assert.equal(evaluateDocumentQuality(doc).qualityStatus, "degraded", "visible unsupported block content cannot report exact quality");

  process.stdout.write("L07 nested DXF unsupported accounting: PASS\n");
}

run().catch((error) => { process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`); process.exitCode = 1; });
