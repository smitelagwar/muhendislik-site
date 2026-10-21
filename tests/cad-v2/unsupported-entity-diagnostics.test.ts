import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parseDxfToCanonical } from "../../src/lib/cad-v2/decode/dxf-adapter";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { createReachableMInsertArrayDiagnostics, createReachableUnsupportedBlockDiagnostics, evaluateDocumentQuality } from "../../src/lib/cad-v2/canonical/diagnostics";

async function run(): Promise<void> {
  const fixturePath = path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/known-geometry-measurements.dxf");
  const fixture = fs.readFileSync(fixturePath, "utf8");
  const inserted = [
    "0", "POINT", "5", "A01", "100", "AcDbEntity", "8", "GEOMETRY", "100", "AcDbPoint", "10", "125", "20", "250", "30", "0",
    "0", "SOLID", "5", "A02", "100", "AcDbEntity", "8", "GEOMETRY", "100", "AcDbTrace",
    "10", "50", "20", "50", "30", "0", "11", "150", "21", "50", "31", "0",
    "12", "150", "22", "150", "32", "0", "13", "50", "23", "150", "33", "0",
    "0", "3DFACE", "5", "A03", "100", "AcDbEntity", "8", "GEOMETRY", "100", "AcDbFace",
    "10", "0", "20", "0", "30", "0", "11", "100", "21", "0", "31", "0",
    "12", "100", "22", "100", "32", "0", "13", "0", "23", "100", "33", "0",
    "0", "TRACE", "5", "A04", "100", "AcDbEntity", "8", "GEOMETRY", "100", "AcDbTrace",
    "10", "200", "20", "0", "30", "0", "11", "300", "21", "0", "31", "0",
    "12", "300", "22", "100", "32", "0", "13", "200", "23", "100", "33", "0",
    "0", "OLE2FRAME", "5", "A05", "100", "AcDbEntity", "8", "GEOMETRY", "70", "3",
    "10", "400", "20", "0", "30", "0", "11", "500", "21", "0", "31", "0",
    "12", "500", "22", "100", "32", "0", "13", "400", "23", "100", "33", "0",
    "0", "XLINE", "5", "A06", "100", "AcDbEntity", "8", "GEOMETRY", "100", "AcDbXline",
    "10", "600", "20", "0", "30", "0", "11", "1", "21", "0", "31", "0",
    "0", "IMAGE", "5", "A07", "100", "AcDbEntity", "8", "GEOMETRY", "100", "AcDbRasterImage",
    "10", "700", "20", "0", "30", "0", "11", "10", "21", "0", "31", "0",
    "12", "0", "22", "10", "32", "0", "13", "10", "23", "0", "33", "0",
    "0", "PDFUNDERLAY", "5", "A08", "100", "AcDbEntity", "8", "GEOMETRY", "100", "AcDbPdfReference",
    "10", "800", "20", "0", "30", "0", "11", "1", "21", "0", "31", "0",
    "12", "0", "22", "1", "32", "0",
    "0", "DWFUNDERLAY", "5", "A09", "100", "AcDbEntity", "8", "GEOMETRY", "100", "AcDbDwfReference",
    "10", "900", "20", "0", "30", "0", "11", "1", "21", "0", "31", "0",
    "12", "0", "22", "1", "32", "0",
    "0", "DGNUNDERLAY", "5", "A0A", "100", "AcDbEntity", "8", "GEOMETRY", "100", "AcDbDgnReference",
    "10", "1000", "20", "0", "30", "0", "11", "1", "21", "0", "31", "0",
    "12", "0", "22", "1", "32", "0",
  ].join("\n");
  const enriched = fixture.replace(/0\r?\nENDSEC\r?\n0\r?\nEOF\s*$/, `${inserted}\n0\nENDSEC\n0\nEOF\n`);
  assert.notEqual(enriched, fixture, "fixture must have received the unsupported source entities");

  const document = await parseDxfToCanonical(Buffer.from(enriched, "utf8"), { sourceVersionKey: "unsupported-entity-regression" });
  const unsupported = document.diagnostics.filter((diagnostic) => diagnostic.code === "UNSUPPORTED_ENTITY_TYPE");
  assert.deepEqual(unsupported.map((diagnostic) => diagnostic.message.match(/DXF (POINT|SOLID|3DFACE|TRACE|OLE2FRAME|XLINE|IMAGE|PDFUNDERLAY|DWFUNDERLAY|DGNUNDERLAY) entity/)?.[1]).sort(),
    ["3DFACE", "DGNUNDERLAY", "DWFUNDERLAY", "IMAGE", "OLE2FRAME", "PDFUNDERLAY", "POINT", "SOLID", "TRACE", "XLINE"]);
  assert.deepEqual(unsupported.map((diagnostic) => diagnostic.entityHandle).sort(), ["A01", "A02", "A03", "A04", "A05", "A06", "A07", "A08", "A09", "A0A"],
    "unsupported top-level DXF entities must retain their raw source handles");
  assert(document.modelSpaceEntities.some((entity) => entity.type === "LINE"),
    "missing raster and underlay companions must not remove unrelated source geometry");

  const quality = evaluateDocumentQuality(document);
  assert.equal(quality.qualityStatus, "degraded", "a source entity omission must not remain exact");
  assert.equal(quality.provenance.unsupportedTypeCount, 10, "unsupported entity provenance must count each omitted handle");

  const scene = compileCanonicalToScene(document, { layoutId: "Model" });
  assert.equal(scene.manifest.diagnosticsSummary.unknownEntityCount, 10, "manifest must report the unsupported source entity count");
  assert(scene.manifest.chunks.some((chunk) => chunk.layoutId === "Model"),
    "the compiler must still publish available Model geometry when external companions are absent");

  const reachableBlockDiagnostics = createReachableUnsupportedBlockDiagnostics(
    [[{ type: "INSERT", handle: "ROOT-INSERT", layer: "0", order: 1n, blockName: "ROOT", insertionPoint: [0, 0], scale: [1, 1, 1], rotationRad: 0 }]],
    {
      ROOT: {
        name: "ROOT", basePoint: [0, 0],
        entities: [
          { type: "INSERT", handle: "NESTED-INSERT", layer: "0", order: 2n, blockName: "NESTED", insertionPoint: [0, 0], scale: [1, 1, 1], rotationRad: 0 },
          { type: "INSERT", handle: "HIDDEN-INSERT", layer: "0", order: 3n, blockName: "HIDDEN", insertionPoint: [0, 0], scale: [1, 1, 1], rotationRad: 0, visible: false },
        ],
      },
      NESTED: { name: "NESTED", basePoint: [0, 0], entities: [] },
      HIDDEN: { name: "HIDDEN", basePoint: [0, 0], entities: [] },
      UNUSED: { name: "UNUSED", basePoint: [0, 0], entities: [] },
    },
    [
      { blockName: "NESTED", entityType: "POINT", entityHandle: "NESTED-POINT" },
      { blockName: "NESTED", entityType: "SOLID", entityHandle: "INVISIBLE-CHILD", visible: false },
      { blockName: "UNUSED", entityType: "SOLID", entityHandle: "UNUSED-SOLID" },
      { blockName: "HIDDEN", entityType: "POINT", entityHandle: "HIDDEN-BLOCK-POINT" },
      { blockName: "*Paper_Space0", entityType: "3DFACE", entityHandle: "PAPER-FACE", isPaperSpace: true },
    ],
  );
  assert.deepEqual(reachableBlockDiagnostics.map((diagnostic) => diagnostic.entityHandle).sort(), ["NESTED-POINT", "PAPER-FACE"]);
  const withBlockDiagnostics = { ...document, diagnostics: [...document.diagnostics, ...reachableBlockDiagnostics] };
  const blockQuality = evaluateDocumentQuality(withBlockDiagnostics);
  assert.equal(blockQuality.qualityStatus, "degraded", "reachable unsupported block children must degrade quality");
  assert.equal(blockQuality.provenance.unsupportedTypeCount, 12, "reachable block and top-level unsupported handles must be counted");
  const blockScene = compileCanonicalToScene(withBlockDiagnostics, { layoutId: "Model" });
  assert.equal(blockScene.manifest.diagnosticsSummary.unknownEntityCount, 12, "manifest must report reachable unsupported block children");

  const arrayInsertDiagnostics = createReachableMInsertArrayDiagnostics(
    [[
      { type: "INSERT", handle: "ROOT-ARRAY", layer: "0", order: 10n, blockName: "ROOT", insertionPoint: [0, 0], scale: [1, 1, 1], rotationRad: 0, rowCount: 2 },
      { type: "INSERT", handle: "HIDDEN-ARRAY", layer: "0", order: 11n, blockName: "ROOT", insertionPoint: [0, 0], scale: [1, 1, 1], rotationRad: 0, columnCount: 4, visible: false },
      { type: "INSERT", handle: "ROOT-NORMAL", layer: "0", order: 12n, blockName: "ROOT", insertionPoint: [0, 0], scale: [1, 1, 1], rotationRad: 0 },
    ]],
    {
      ROOT: { name: "ROOT", basePoint: [0, 0], entities: [
        { type: "INSERT", handle: "NESTED-ARRAY", layer: "0", order: 13n, blockName: "NESTED", insertionPoint: [0, 0], scale: [1, 1, 1], rotationRad: 0, columnCount: 3 },
      ] },
      NESTED: { name: "NESTED", basePoint: [0, 0], entities: [] },
      UNUSED: { name: "UNUSED", basePoint: [0, 0], entities: [
        { type: "INSERT", handle: "UNUSED-ARRAY", layer: "0", order: 14n, blockName: "NESTED", insertionPoint: [0, 0], scale: [1, 1, 1], rotationRad: 0, rowCount: 5 },
      ] },
    },
    "DWG",
  );
  assert.deepEqual(arrayInsertDiagnostics.map((diagnostic) => diagnostic.entityHandle).sort(), ["NESTED-ARRAY", "ROOT-ARRAY"],
    "only visible root and reachable nested MINSERT arrays should be diagnosed");
  assert(arrayInsertDiagnostics.every((diagnostic) => diagnostic.code === "UNSUPPORTED_MINSERT_ARRAY"),
    "array limitations must use the dedicated MINSERT diagnostic code");
}

run().then(() => {
  console.log("unsupported-entity-diagnostics: PASS");
}).catch((error) => {
  console.error("unsupported-entity-diagnostics: FAIL", error);
  process.exitCode = 1;
});
