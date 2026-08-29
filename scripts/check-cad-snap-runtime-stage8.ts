import assert from "node:assert/strict";

import { buildCadSnapPrimitives } from "../src/lib/dokumantasyon/cad-upstream/snap-catalog";
import { CadSnapEngine } from "../src/lib/dokumantasyon/cad-upstream/snap-engine";

function runtimePolyline(points: Array<{ x: number; y: number }>) {
  return {
    type: 17,
    dxfTypeName: "LWPOLYLINE",
    objectId: "duplicate-runtime-id",
    layer: "KALIP",
    closed: false,
    numberOfVertices: points.length,
    getPoint3dAt(index: number) {
      const value = points[index];
      if (!value) throw new Error("vertex out of range");
      return { ...value, z: 0 };
    },
  };
}

const modelSpace = {
  *newIterator() {
    yield runtimePolyline([
      { x: -100, y: 0 },
      { x: 100, y: 0 },
    ]);
    yield runtimePolyline([
      { x: 0, y: -100 },
      { x: 0, y: 100 },
    ]);
  },
};

const primitives = buildCadSnapPrimitives({
  tables: { blockTable: { modelSpace } },
});

assert.equal(
  primitives.length,
  2,
  "real MLightCAD numberOfVertices/getPoint3dAt polylines must reach the snap catalog"
);
assert.deepEqual(
  primitives.map((primitive) => primitive.id),
  ["duplicate-runtime-id:seg:0", "duplicate-runtime-id#2:seg:0"],
  "the first stable id stays unchanged and only later collisions are suffixed"
);

const engine = new CadSnapEngine(64);
engine.rebuild(primitives);
assert.equal(engine.size, 2, "both colliding runtime polyline segments must reach the spatial index");

const intersection = engine.query({
  point: { x: 0.2, y: -0.3 },
  tolerancePx: 12,
  worldUnitsPerPixel: 1,
  modes: new Set(["intersection"]),
});

assert.equal(intersection?.mode, "intersection");
assert.deepEqual(intersection?.point, { x: 0, y: 0 });
assert.equal(intersection?.primitiveIds.length, 2);

console.log(
  "GATE: PASS — Stage 8 runtime snap catalog reads real MLightCAD polyline APIs, preserves duplicate ids and keeps Intersection queryable."
);
