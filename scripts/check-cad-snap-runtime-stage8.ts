import assert from "node:assert/strict";

import { buildCadSnapPrimitives } from "../src/lib/dokumantasyon/cad-upstream/snap-catalog";
import { CadSnapEngine } from "../src/lib/dokumantasyon/cad-upstream/snap-engine";

const modelSpace = {
  *newIterator() {
    yield {
      type: "LINE",
      objectId: "duplicate-runtime-id",
      layer: "KALIP",
      startPoint: { x: -100, y: 0 },
      endPoint: { x: 100, y: 0 },
    };
    yield {
      type: "LINE",
      objectId: "duplicate-runtime-id",
      layer: "KALIP",
      startPoint: { x: 0, y: -100 },
      endPoint: { x: 0, y: 100 },
    };
  },
};

const primitives = buildCadSnapPrimitives({
  tables: { blockTable: { modelSpace } },
});

assert.equal(primitives.length, 2, "duplicate runtime entity ids must not erase geometry");
assert.deepEqual(
  primitives.map((primitive) => primitive.id),
  ["duplicate-runtime-id", "duplicate-runtime-id#2"],
  "the first stable id stays unchanged and only later collisions are suffixed"
);

const engine = new CadSnapEngine(64);
engine.rebuild(primitives);
assert.equal(engine.size, 2, "both colliding runtime entities must reach the spatial index");

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
  "GATE: PASS — Stage 8 runtime snap catalog preserves duplicate entity ids and keeps Intersection candidates queryable."
);
