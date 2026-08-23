import assert from "node:assert/strict";
import fs from "node:fs";
import {
  DXF_LINETYPE_MAX_RENDER_PRIMITIVES,
  DxfLinetypeExpansionLimitError,
  auditDxfLinetypeSource,
  collectDxfSimpleLinetypes,
  enrichParsedDxfLinetypes,
  expandDxfSimpleLinetypePath,
  resolveDxfLayerLinetype,
  resolveDxfLinetypeScale,
  type DxfLinetypeParsedDxf,
} from "../src/lib/dokumantasyon/dxf-linetype-rendering";

function approx(actual: number, expected: number, label: string): void {
  assert.ok(Math.abs(actual - expected) <= 1e-9, `${label}: ${actual} != ${expected}`);
}

function xRanges(vertices: Array<{ x: number; y: number }>): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  for (let index = 0; index + 1 < vertices.length; index += 2) {
    ranges.push([vertices[index].x, vertices[index + 1].x]);
  }
  return ranges;
}

function assertRanges(actual: Array<[number, number]>, expected: Array<[number, number]>): void {
  assert.equal(actual.length, expected.length);
  for (let index = 0; index < expected.length; index += 1) {
    approx(actual[index][0], expected[index][0], `range ${index} start`);
    approx(actual[index][1], expected[index][1], `range ${index} end`);
  }
}

const source = [
  "0", "SECTION", "2", "HEADER",
  "9", "$LTSCALE", "40", "2",
  "0", "ENDSEC",
  "0", "SECTION", "2", "TABLES",
  "0", "TABLE", "2", "LAYER", "70", "4",
  "0", "LAYER", "2", "0", "70", "0", "62", "7", "6", "CONTINUOUS",
  "0", "LAYER", "2", "AKS", "70", "0", "62", "1", "6", "CENTER",
  "0", "LAYER", "2", "GIZLI", "70", "0", "62", "2", "6", "HIDDEN",
  "0", "LAYER", "2", "KESIK", "70", "0", "62", "3", "6", "DASHED",
  "0", "ENDTAB",
  "0", "ENDSEC",
  "0", "EOF",
].join("\n");

const audit = auditDxfLinetypeSource(source);
assert.equal(audit.globalScale, 2);
assert.equal(audit.layerRecordCount, 4);
assert.equal(audit.layerLinetypeCount, 4);
assert.equal(audit.layers.AKS, "CENTER");
assert.equal(audit.layers.GIZLI, "HIDDEN");
assert.equal(resolveDxfLayerLinetype("aks", audit.layers), "CENTER");
assert.equal(resolveDxfLinetypeScale(audit.globalScale, 0.5), 1);

const parsed: DxfLinetypeParsedDxf = {
  tables: {
    layer: {
      layers: {
        "0": { name: "0" },
        AKS: { name: "AKS" },
        GIZLI: { name: "GIZLI" },
        KESIK: { name: "KESIK" },
      },
    },
    lineType: {
      lineTypes: {
        CONTINUOUS: { name: "CONTINUOUS", pattern: [], patternLength: 0 },
        DASHED: { name: "DASHED", pattern: [6, -3], patternLength: 9 },
        CENTER: { name: "CENTER", pattern: [12, -3, 3, -3], patternLength: 21 },
        HIDDEN: { name: "HIDDEN", pattern: [4, -2], patternLength: 6 },
        DOTMIX: { name: "DOTMIX", pattern: [6, -2, 0, -2], patternLength: 10 },
      },
    },
  },
};
enrichParsedDxfLinetypes(parsed, audit);
assert.equal(parsed.tables?.layer?.layers?.AKS.lineType, "CENTER");
assert.equal(parsed.__dxfLinetypeSourceAudit?.globalScale, 2);

const definitions = collectDxfSimpleLinetypes(parsed);
assert.deepEqual(definitions.DASHED.pattern, [6, -3]);
assert.deepEqual(definitions.CENTER.pattern, [12, -3, 3, -3]);
assert.deepEqual(definitions.HIDDEN.pattern, [4, -2]);
assert.equal(definitions.CONTINUOUS, undefined);

const dashed = expandDxfSimpleLinetypePath({
  vertices: [{ x: 0, y: 0 }, { x: 30, y: 0 }],
  pattern: [6, -3],
});
assertRanges(xRanges(dashed.lineVertices), [[0, 6], [9, 15], [18, 24], [27, 30]]);
assert.equal(dashed.dotVertices.length, 0);

const scaled = expandDxfSimpleLinetypePath({
  vertices: [{ x: 0, y: 0 }, { x: 30, y: 0 }],
  pattern: [6, -3],
  scale: 2,
});
assertRanges(xRanges(scaled.lineVertices), [[0, 12], [18, 30]]);

const continuousPhase = expandDxfSimpleLinetypePath({
  vertices: [{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 20, y: 0 }],
  pattern: [6, -3],
});
assertRanges(xRanges(continuousPhase.lineVertices), [[0, 6], [9, 15], [18, 20]]);
assert.equal(
  continuousPhase.lineVertices.some((point, index) => index % 2 === 0 && Math.abs(point.x - 8) < 1e-9),
  false,
  "Pattern must not restart at a polyline vertex"
);

const center = expandDxfSimpleLinetypePath({
  vertices: [{ x: 0, y: 0 }, { x: 30, y: 0 }],
  pattern: [12, -3, 3, -3],
});
assertRanges(xRanges(center.lineVertices), [[0, 12], [15, 18], [21, 30]]);

const hidden = expandDxfSimpleLinetypePath({
  vertices: [{ x: 0, y: 0 }, { x: 15, y: 0 }],
  pattern: [4, -2],
});
assertRanges(xRanges(hidden.lineVertices), [[0, 4], [6, 10], [12, 15]]);

const dotted = expandDxfSimpleLinetypePath({
  vertices: [{ x: 0, y: 0 }, { x: 25, y: 0 }],
  pattern: [6, -2, 0, -2],
});
assert.ok(dotted.dotVertices.length >= 2);
assert.ok(dotted.dotVertices.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y)));

const closed = expandDxfSimpleLinetypePath({
  vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }],
  closed: true,
  pattern: [5, -2],
});
assert.ok(closed.primitiveCount > 0);
assert.ok(closed.lineVertices.some((point) => point.x < 10 && point.y > 0), "Closed path must pattern the closing edge");

assert.throws(
  () => expandDxfSimpleLinetypePath({
    vertices: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
    pattern: [1, -1],
    maxPrimitives: 2,
  }),
  (error) => error instanceof DxfLinetypeExpansionLimitError && error.code === "DXF_LINETYPE_EXPANSION_LIMIT_EXCEEDED"
);
assert.equal(DXF_LINETYPE_MAX_RENDER_PRIMITIVES, 2_000_000);

const worker = fs.readFileSync("src/components/dokumantasyon/preview/dxf-viewer-worker.ts", "utf8");
assert.match(worker, /auditDxfLinetypeSource/);
assert.match(worker, /enrichParsedDxfLinetypes/);
assert.match(worker, /collectDxfSimpleLinetypes/);
assert.match(worker, /scenePrototype\._GetLineType = function/);
assert.match(worker, /scenePrototype\._ProcessLineSegments = function/);
assert.match(worker, /scenePrototype\._ProcessPolyline = function/);
assert.match(worker, /expandDxfSimpleLinetypePath/);
assert.match(worker, /DXF_LINETYPE_MAX_RENDER_PRIMITIVES/);
assert.match(worker, /BYBLOCK linetype inheritance is not resolved/);

console.log("DXF CAD Stage 2 linetype rendering: PASS");
console.log(JSON.stringify({
  sourceAudit: audit,
  definitions: Object.keys(definitions).sort(),
  dashedPrimitives: dashed.primitiveCount,
  centerPrimitives: center.primitiveCount,
  hiddenPrimitives: hidden.primitiveCount,
  dottedPrimitives: dotted.primitiveCount,
}, null, 2));
