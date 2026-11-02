import test from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

import { CadSnapEngine, type CadSnapLinePrimitive } from "../../src/lib/dokumantasyon/cad-upstream/snap-engine";
import { CadReviewStore } from "../../src/lib/dokumantasyon/cad-review/store";
import { exportReviewToJson, importReviewFromJson } from "../../src/lib/dokumantasyon/cad-review/export-json";
import type { CadReviewDocument } from "../../src/lib/dokumantasyon/cad-review/schema";

test("stage10: deterministic 6,400-primitive spatial query — bounded candidates and valid endpoint", () => {
  const geometry: CadSnapLinePrimitive[] = [];
  for (let x = 0; x < 80; x += 1) {
    for (let y = 0; y < 80; y += 1) {
      geometry.push({
        id: `line-${x}-${y}`, kind: "line", layer: "KALIP",
        a: { x: x * 100, y: y * 100 },
        b: { x: x * 100 + 14, y: y * 100 + 14 },
      });
    }
  }
  const engine = new CadSnapEngine();
  const startBuild = performance.now();
  engine.rebuild(geometry);
  const buildMs = performance.now() - startBuild;
  assert.equal(engine.size, 6400);
  const queries = 2000;
  const startQueries = performance.now();
  let resolved = 0;
  for (let n = 0; n < queries; n += 1) {
    const x = (n * 17) % 80;
    const y = (n * 41) % 80;
    const result = engine.query({
      point: { x: x * 100 + 1, y: y * 100 + 1 },
      tolerancePx: 18,
      worldUnitsPerPixel: 1,
      modes: new Set(["endpoint"]),
    });
    if (result) resolved += 1;
    assert.ok(result?.distancePx !== undefined && result.distancePx <= 18);
    assert.ok(result.primitiveIds.length <= 2);
  }
  const queriesMs = performance.now() - startQueries;
  assert.equal(resolved, queries);
  engine.rebuild([]);
  assert.equal(engine.size, 0);
  assert.equal(engine.query({
    point: { x: 1, y: 1 }, tolerancePx: 18, worldUnitsPerPixel: 1,
    modes: new Set(["endpoint"]),
  }), null);
  console.info(JSON.stringify({ metric: "stage10-snap-index", primitives: geometry.length,
    queries, buildMs: +buildMs.toFixed(2), queriesMs: +queriesMs.toFixed(2),
    averageQueryMs: +(queriesMs / queries).toFixed(5) }));
});

test("stage10: 300 concurrent review pins survive save, history and JSON re-read", () => {
  const date = "2026-11-02T00:00:00.000Z";
  const fileId = "11111111-1111-4111-8111-111111111111";
  const document: CadReviewDocument = {
    schemaVersion: 1, fileId, sourceVersionKey: "density-stage10",
    sourceSha256: "0".repeat(64), revision: 0, items: [],
    createdAt: date, updatedAt: date,
  };
  const store = new CadReviewStore(document);
  const start = performance.now();
  for (let n = 0; n < 300; n += 1) {
    store.addItem({
      id: `aaaa0000-aaaa-4aaa-8aaa-${String(n + 1).padStart(12,"0")}`,
      type: "comment_pin", position: { x: 400000 + n * 7, y: 5000000 + n * 3 },
      pinIndex: n + 1, title: "Revizyon denetimi", author: "Kontrol",
      status: "open", comment: `Türkçe not ${n}: çatı, ölçü, perde`,
      style: { color: "#ef4444", strokeWidth: 2, opacity: 1 },
      createdAt: date, updatedAt: date,
    });
  }
  const addMs = performance.now() - start;
  assert.equal(store.getItems().length, 300);
  const exportStart = performance.now();
  const json = exportReviewToJson(store.getDocument());
  const restored = importReviewFromJson(json);
  const exportMs = performance.now() - exportStart;
  assert.equal(restored?.items.length, 300);
  assert.ok(json.includes("çatı"));
  store.undo();
  assert.equal(store.getItems().length, 299);
  store.redo();
  assert.equal(store.getItems().length, 300);
  assert.equal(store.getDocument().fileId, fileId);
  console.info(JSON.stringify({ metric: "stage10-review-density", pins: 300,
    addMs: +addMs.toFixed(2), jsonRoundtripMs: +exportMs.toFixed(2),
    jsonBytes: Buffer.byteLength(json) }));
});
