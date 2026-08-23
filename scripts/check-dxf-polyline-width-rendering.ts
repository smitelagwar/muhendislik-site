import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
// @ts-expect-error dxf-viewer internal parser has no declaration file
import DxfParser from "dxf-viewer/src/parser/DxfParser.js";
import {
  DXF_POLYLINE_WIDTH_MAX_TRIANGLES,
  DxfPolylineWidthTriangleLimitError,
  auditDxfPolylineWidthSource,
  buildDxfWidePolylineMesh,
  enrichParsedDxfPolylineWidths,
  normalizeParsedDxfWidePolylines,
  type DxfPolylineWidthEntity,
  type DxfPolylineWidthParsedDxf,
} from "../src/lib/dokumantasyon/dxf-polyline-width-rendering";

function approx(actual: number, expected: number, label: string, tolerance = 1e-8): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} != ${expected}`);
}

const fixturePath = path.resolve(process.cwd(), "tests", "fixtures", "dxf", "stage3-wide-polylines.dxf");
const source = fs.readFileSync(fixturePath, "utf8");
const sourceAudit = auditDxfPolylineWidthSource(source);

assert.equal(sourceAudit.widthPolylineCount, 3);
assert.equal(sourceAudit.constantWidthPolylineCount, 1);
assert.equal(sourceAudit.variableWidthPolylineCount, 2);
assert.equal(sourceAudit.legacyPolylineCount, 1);
assert.equal(sourceAudit.invalidWidthPolylineCount, 0);

const parser = new DxfParser();
const parsed = parser.parseSync(source) as DxfPolylineWidthParsedDxf;
enrichParsedDxfPolylineWidths(parsed, sourceAudit);
assert.equal(parsed.__dxfPolylineWidthSourceAudit?.unmatchedSourceCount, 0);

const byHandle = new Map(
  (parsed.entities ?? [])
    .filter((entity): entity is DxfPolylineWidthEntity & { handle: string } => typeof entity.handle === "string")
    .map((entity) => [entity.handle, entity])
);

const constant = byHandle.get("10");
assert.ok(constant?.vertices && constant.vertices.length === 2, "constant-width LWPOLYLINE must parse");
assert.equal(constant.vertices[0].startWidth, 2);
assert.equal(constant.vertices[0].endWidth, 2);

const varying = byHandle.get("11");
assert.ok(varying?.vertices && varying.vertices.length === 3, "varying-width LWPOLYLINE must parse");
assert.equal(varying.vertices[0].startWidth, 1);
assert.equal(varying.vertices[0].endWidth, 3);
approx(varying.vertices[0].bulge ?? 0, 0.41421356237309503, "bulge");

const legacy = byHandle.get("20");
assert.ok(legacy?.vertices && legacy.vertices.length === 2, "legacy POLYLINE vertices must parse");
assert.equal(legacy.vertices[0].startWidth, 2, "legacy VERTEX group 40 must be enriched");
assert.equal(legacy.vertices[0].endWidth, 4, "legacy VERTEX group 41 must be enriched");
assert.equal(legacy.vertices[1].startWidth, 2, "legacy entity default start width must inherit");
assert.equal(legacy.vertices[1].endWidth, 2, "legacy entity default end width must inherit");

const straight = buildDxfWidePolylineMesh({
  vertices: [
    { x: 0, y: 0, startWidth: 2, endWidth: 2 },
    { x: 10, y: 0, startWidth: 2, endWidth: 2 },
  ],
  closed: false,
});
assert.ok(straight);
assert.equal(straight.triangleCount, 2);
approx(Math.min(...straight.vertices.map((point) => point.y)), -1, "straight min y");
approx(Math.max(...straight.vertices.map((point) => point.y)), 1, "straight max y");

const tapered = buildDxfWidePolylineMesh({
  vertices: [
    { x: 0, y: 0, startWidth: 1, endWidth: 4 },
    { x: 10, y: 0, startWidth: 4, endWidth: 4 },
  ],
  closed: false,
});
assert.ok(tapered);
approx(Math.max(...tapered.vertices.filter((point) => Math.abs(point.x - 10) < 1e-8).map((point) => Math.abs(point.y))), 2, "taper end half-width");

const bulged = buildDxfWidePolylineMesh({
  vertices: [
    { x: 0, y: 0, startWidth: 1, endWidth: 3, bulge: 0.41421356237309503 },
    { x: 20, y: 0, startWidth: 3, endWidth: 3 },
  ],
  closed: false,
});
assert.ok(bulged);
assert.ok(bulged.tessellatedSegmentCount >= 8, "bulge must be tessellated as a physical-width arc");
assert.ok(bulged.triangleCount >= 16);

const closed = buildDxfWidePolylineMesh({
  vertices: [
    { x: 0, y: 0, startWidth: 2, endWidth: 2 },
    { x: 10, y: 0, startWidth: 2, endWidth: 2 },
    { x: 10, y: 10, startWidth: 2, endWidth: 2 },
  ],
  closed: true,
});
assert.ok(closed);
assert.equal(closed.sourceSegmentCount, 3, "closed polyline must include the closing edge");
assert.ok(closed.triangleCount >= 6);

assert.throws(
  () => buildDxfWidePolylineMesh({
    vertices: [
      { x: 0, y: 0, startWidth: 2, endWidth: 2 },
      { x: 10, y: 0, startWidth: 2, endWidth: 2 },
    ],
    closed: false,
    maxTriangles: 1,
  }),
  (error) => error instanceof DxfPolylineWidthTriangleLimitError &&
    error.code === "DXF_POLYLINE_WIDTH_TRIANGLE_LIMIT_EXCEEDED"
);
assert.equal(DXF_POLYLINE_WIDTH_MAX_TRIANGLES, 2_000_000);

const renderAudit = normalizeParsedDxfWidePolylines(parsed);
assert.equal(renderAudit.sourceWidthPolylineCount, 3);
assert.equal(renderAudit.renderedWidthPolylineCount, 3);
assert.equal(renderAudit.unsupported3dPolylineCount, 0);
assert.equal(renderAudit.unsupportedPatternedPolylineCount, 0);
assert.equal(renderAudit.unsupportedInheritanceCount, 0);
assert.equal(renderAudit.invalidWidthPolylineCount, 0);
assert.equal(renderAudit.unmatchedSourceCount, 0);
assert.ok(renderAudit.generatedTriangleCount >= 10);
assert.equal(renderAudit.generatedSolidCount, renderAudit.generatedTriangleCount);

const generatedSolids = (parsed.entities ?? []).filter((entity) => entity.type === "SOLID");
assert.equal(generatedSolids.length, renderAudit.generatedSolidCount);
assert.ok(generatedSolids.every((entity) => entity.points?.length === 3));
assert.ok(generatedSolids.every((entity) => !("lineweight" in entity)), "physical-width triangle fills must not inherit display lineweight");
assert.ok(generatedSolids.some((entity) => entity.color === 1), "source entity color must survive triangulation");
assert.ok(generatedSolids.some((entity) => entity.color === 3), "varying-width source color must survive triangulation");
assert.ok(generatedSolids.some((entity) => entity.color === 5), "legacy POLYLINE source color must survive triangulation");

const invalidSource = [
  "0", "SECTION", "2", "ENTITIES",
  "0", "LWPOLYLINE", "5", "BAD", "90", "2", "43", "-2",
  "10", "0", "20", "0", "10", "10", "20", "0",
  "0", "ENDSEC", "0", "EOF",
].join("\n");
const invalidAudit = auditDxfPolylineWidthSource(invalidSource);
assert.equal(invalidAudit.widthPolylineCount, 0);
assert.equal(invalidAudit.invalidWidthPolylineCount, 1, "negative-only width must not disappear from audit");

const worker = fs.readFileSync("src/components/dokumantasyon/preview/dxf-viewer-worker.ts", "utf8");
assert.match(worker, /auditDxfPolylineWidthSource/);
assert.match(worker, /enrichParsedDxfPolylineWidths/);
assert.match(worker, /normalizeParsedDxfWidePolylines/);
assert.match(worker, /polylineWidthRenderAudit/);
assert.match(worker, /physical model-space width and print\/display lineweight remain independent/);

console.log("DXF CAD Stage 3 physical polyline width rendering: PASS");
console.log(JSON.stringify({ sourceAudit, renderAudit }, null, 2));
