import assert from "node:assert/strict";

import { buildCadSnapPrimitives } from "../src/lib/dokumantasyon/cad-upstream/snap-catalog";
import { CadSnapEngine, type CadSnapMode } from "../src/lib/dokumantasyon/cad-upstream/snap-engine";

const allModes = new Set<CadSnapMode>(["endpoint", "midpoint", "intersection", "center", "nearest"]);
const engine = new CadSnapEngine(25);
engine.rebuild([
  { kind: "line", id: "h", a: { x: 0, y: 0 }, b: { x: 100, y: 0 } },
  { kind: "line", id: "v", a: { x: 50, y: -50 }, b: { x: 50, y: 50 } },
  { kind: "circle", id: "c", center: { x: 150, y: 0 }, radius: 25 },
  { kind: "arc", id: "a", center: { x: 220, y: 0 }, radius: 20, startAngle: 0, endAngle: Math.PI },
]);
assert.equal(engine.size, 4);

let snap = engine.query({ point: { x: 1, y: 1 }, tolerancePx: 12, worldUnitsPerPixel: 1, modes: allModes });
assert.equal(snap?.mode, "endpoint");
assert.deepEqual(snap?.point, { x: 0, y: 0 });

snap = engine.query({ point: { x: 50, y: 1 }, tolerancePx: 12, worldUnitsPerPixel: 1, modes: allModes });
assert.equal(snap?.mode, "intersection", "intersection wins when it is the closest meaningful point");
assert.deepEqual(snap?.point, { x: 50, y: 0 });

snap = engine.query({ point: { x: 150, y: 2 }, tolerancePx: 10, worldUnitsPerPixel: 1, modes: allModes });
assert.equal(snap?.mode, "center");

snap = engine.query({ point: { x: 176, y: 1 }, tolerancePx: 5, worldUnitsPerPixel: 1, modes: new Set(["nearest"]) });
assert.equal(snap?.mode, "nearest");
assert.ok(snap && Math.abs(snap.point.x - 175) < 0.1);

snap = engine.query({ point: { x: 220, y: 19 }, tolerancePx: 5, worldUnitsPerPixel: 1, modes: new Set(["midpoint"]) });
assert.equal(snap?.mode, "midpoint", "arc midpoint must be available");

const zoomedOut = engine.query({ point: { x: 0, y: 7.5 }, tolerancePx: 8, worldUnitsPerPixel: 1 });
const zoomedIn = engine.query({ point: { x: 0, y: 0.75 }, tolerancePx: 8, worldUnitsPerPixel: 0.1 });
assert.equal(zoomedOut?.mode, "endpoint");
assert.equal(zoomedIn?.mode, "endpoint");
assert.ok((zoomedOut?.distancePx ?? 99) <= 8 && (zoomedIn?.distancePx ?? 99) <= 8, "pixel tolerance must stay stable across zoom levels");

const childBlock = {
  *newIterator() {
    yield { type: "LINE", objectId: "block-line", layer: "B", startPoint: { x: 0, y: 0 }, endPoint: { x: 10, y: 0 } };
  },
};
const modelSpace = {
  *newIterator() {
    yield { type: "LINE", objectId: "line-1", layer: "A", startPoint: { x: 0, y: 0 }, endPoint: { x: 20, y: 0 } };
    yield { type: "CIRCLE", objectId: "circle-1", layer: "A", center: { x: 40, y: 10 }, radius: 5 };
    yield { type: "LWPOLYLINE", objectId: "poly-1", layer: "A", closed: false, vertices: [{ x: 0, y: 20 }, { x: 10, y: 20 }, { x: 10, y: 30 }] };
    yield {
      type: "INSERT",
      objectId: "insert-1",
      layer: "A",
      blockTableRecord: childBlock,
      getFullInsertionTransform() {
        return { elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 100, 50, 0, 1] };
      },
    };
  },
};
const primitives = buildCadSnapPrimitives({ tables: { blockTable: { modelSpace } } });
assert.ok(primitives.some((p) => p.id === "line-1" && p.kind === "line"));
assert.ok(primitives.some((p) => p.id === "circle-1" && p.kind === "circle"));
assert.equal(primitives.filter((p) => p.id.startsWith("poly-1:seg:")).length, 2);
const transformed = primitives.find((p) => p.id === "block-line");
assert.ok(transformed && transformed.kind === "line");
if (transformed?.kind === "line") {
  assert.deepEqual(transformed.a, { x: 100, y: 50 });
  assert.deepEqual(transformed.b, { x: 110, y: 50 });
}

console.log("GATE: PASS — Stage 4 CAD snap engine supports Endpoint, Midpoint, Intersection, Center and Nearest with screen-pixel tolerance and spatial indexing.");
