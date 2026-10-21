import assert from "node:assert/strict";
import fs from "node:fs";
import { parseDxfToCanonical } from "../../src/lib/cad-v2/decode/dxf-adapter";
import { CadDiagnosticCode, evaluateDocumentQuality } from "../../src/lib/cad-v2/canonical/diagnostics";

async function run() {
  const fixturePath = new URL("../fixtures/cad-preview-v2/known-geometry-measurements.dxf", import.meta.url);
  const fixture = fs.readFileSync(fixturePath, "utf8");
  const arrayInsert = [
    "0", "INSERT", "5", "A077", "100", "AcDbEntity", "8", "0", "100", "AcDbBlockReference",
    "2", "L07_ARRAY_BLOCK", "10", "100", "20", "200", "30", "0", "41", "1", "42", "1", "43", "1",
    "50", "0", "70", "2", "71", "3", "44", "7.5", "45", "11.25",
  ].join("\n");
  const source = fixture.replace(/0\r?\nENDSEC\r?\n0\r?\nEOF\s*$/, `${arrayInsert}\n0\nENDSEC\n0\nEOF\n`);
  assert.notEqual(source, fixture, "the test must inject a DXF MINSERT array record");

  const document = await parseDxfToCanonical(Buffer.from(source, "utf8"), { sourceVersionKey: "l07-dxf-minsert" });
  const insert = document.modelSpaceEntities.find((entity) => entity.type === "INSERT" && entity.sourceHandle === "A077");
  assert(insert && insert.type === "INSERT", "DXF MINSERT must retain its source INSERT identity");
  assert.equal(insert.columnCount, 2, "DXF group 70 MINSERT column count must survive decode");
  assert.equal(insert.rowCount, 3, "DXF group 71 MINSERT row count must survive decode");
  assert.equal(insert.columnSpacing, 7.5, "MINSERT column spacing must survive decode");
  assert.equal(insert.rowSpacing, 11.25, "MINSERT row spacing must survive decode");
  assert(document.diagnostics.some((diagnostic) => diagnostic.code === CadDiagnosticCode.UNSUPPORTED_MINSERT_ARRAY && diagnostic.entityHandle === "A077"),
    "until array expansion is implemented, MINSERT must be explicitly diagnosed");
  assert.equal(evaluateDocumentQuality(document).qualityStatus, "degraded", "unexpanded MINSERT cannot claim exact scene quality");
  process.stdout.write("L07 DXF MINSERT semantics: PASS\n");
}

run().catch((error) => { process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`); process.exitCode = 1; });
