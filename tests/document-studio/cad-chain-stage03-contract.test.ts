import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CadChainDistanceMachine,
  CadChainDistanceController,
  type CadChainDistanceResult,
} from "../../src/lib/dokumantasyon/cad-upstream/chain-distance";
import {
  CadSnapEngine,
  type CadSnapMode,
  type CadSnapPrimitive,
  type CadSnapPoint,
} from "../../src/lib/dokumantasyon/cad-upstream/snap-engine";
import { buildCadSnapPrimitives } from "../../src/lib/dokumantasyon/cad-upstream/snap-catalog";
import { CadReviewStore } from "../../src/lib/dokumantasyon/cad-review/store";
import { cadReviewDocumentSchema, type CadReviewDocument } from "../../src/lib/dokumantasyon/cad-review/schema";
import { captureMeasurementContext, sourceContextFromInsunits } from "../../src/lib/dokumantasyon/cad-review/units";

const now = "2026-11-02T00:00:00.000Z";
function createDoc(): CadReviewDocument {
  return {
    schemaVersion: 1,
    fileId: "11111111-1111-4111-8111-111111111111",
    sourceVersionKey: "fixture.dxf",
    sourceSha256: "a".repeat(64),
    revision: 0,
    items: [],
    createdAt: now,
    updatedAt: now,
  };
}
function near(actual: number, expected: number, eps = 1e-9): void {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= eps, `${actual} != ${expected}`);
}
function snap(
  engine: CadSnapEngine,
  point: CadSnapPoint,
  mode: CadSnapMode,
  origin?: CadSnapPoint
) {
  return engine.query({
    point,
    tolerancePx: 2,
    worldUnitsPerPixel: 1,
    modes: new Set([mode]),
    origin,
  });
}

test("chain machine: 3+4=7 world units, Backspace and preview are transient", () => {
  const m = new CadChainDistanceMachine();
  m.start();
  m.addPoint({ x: 0, y: 0 });
  m.addPoint({ x: 3, y: 0 });
  m.addPoint({ x: 3, y: 4 });
  near(m.snapshot().totalDistance, 7);
  assert.deepEqual(m.snapshot().segmentDistances, [3, 4]);
  m.updatePreview({ point: { x: 6, y: 4 }, snap: null });
  near(m.snapshot().totalDistance, 7); // preview adds no completed segment
  m.removeLastPoint();
  assert.deepEqual(m.snapshot().segmentDistances, [3]);
  m.addPoint({ x: 3, y: 4 });
  const first = m.complete();
  assert.equal(first.result?.totalDistance, 7);
  assert.deepEqual(first.result?.segmentDistances, [3, 4]);
  assert.equal(m.complete().result, null); // one-shot
  m.cancel();
  assert.equal(m.snapshot().points.length, 0);
});

test("snap: endpoint, midpoint, intersection, center, nearest, perpendicular and tolerance in CSS px", () => {
  const engine = new CadSnapEngine();
  engine.rebuild([
    { kind: "line", id: "base", a: { x: 0, y: 0 }, b: { x: 10, y: 0 } },
    { kind: "line", id: "cross", a: { x: 5, y: -5 }, b: { x: 5, y: 5 } },
    { kind: "circle", id: "circle", center: { x: 25, y: 0 }, radius: 5 },
  ]);
  assert.deepEqual(snap(engine, { x: 0.2, y: 0.1 }, "endpoint")?.point, { x: 0, y: 0 });
  assert.deepEqual(snap(engine, { x: 5, y: 0.3 }, "midpoint")?.point, { x: 5, y: 0 });
  assert.deepEqual(snap(engine, { x: 5.3, y: 0.3 }, "intersection")?.point, { x: 5, y: 0 });
  assert.deepEqual(snap(engine, { x: 25.2, y: 0.1 }, "center")?.point, { x: 25, y: 0 });
  assert.deepEqual(snap(engine, { x: 3, y: 1 }, "nearest")?.point, { x: 3, y: 0 });
  assert.deepEqual(snap(engine, { x: 3.1, y: 0.2 }, "perpendicular", { x: 3, y: 4 })?.point, { x: 3, y: 0 });
  assert.equal(snap(engine, { x: 12, y: 0 }, "perpendicular", { x: 12, y: 4 }), null); // no extrapolated foot
  const scaled = engine.query({
    point: { x: 0.9, y: 0 },
    tolerancePx: 1,
    worldUnitsPerPixel: 0.5,
    modes: new Set<CadSnapMode>(["endpoint"]),
  });
  assert.equal(scaled, null);
});

test("snap spatial replacement removes stale cell entries; hidden/frozen filter yields no candidate", () => {
  const engine = new CadSnapEngine();
  const visible: CadSnapPrimitive = {
    kind: "line", id: "x", layer: "VISIBLE",
    a: { x: 0, y: 0 }, b: { x: 10, y: 0 },
  };
  const hidden: CadSnapPrimitive = {
    kind: "line", id: "h", layer: "HIDDEN",
    a: { x: 2, y: 2 }, b: { x: 8, y: 2 },
  };
  engine.rebuild([visible, hidden].filter(p => p.layer === "VISIBLE"));
  assert.equal(snap(engine, { x: 2, y: 2 }, "endpoint"), null);
  engine.add({
    kind: "line", id: "x", layer: "VISIBLE",
    a: { x: 1000, y: 1000 }, b: { x: 1010, y: 1000 },
  });
  assert.equal(engine.queryNearbyPrimitives({ x: 0, y: 0 }, 20).length, 0);
  assert.equal(engine.queryNearbyPrimitives({ x: 1000, y: 1000 }, 20).length, 1);
});

test("nested mirror + 37 degree INSERT transforms snap LINE into true world position", () => {
  const rad = 37 * Math.PI / 180;
  const c = Math.cos(rad), s = Math.sin(rad);
  const mirror = {
    elements: [-2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  };
  const rotate = {
    elements: [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 100, 200, 0, 1],
  };
  const lineBlock = { newIterator: () => [{
    type: "LINE", layer: "0", startPoint: { x: 0, y: 0 }, endPoint: { x: 3, y: 4 },
  }] };
  const mirroredBlock = { newIterator: () => [{
    type: "INSERT", blockName: "leaf", getFullInsertionTransform: () => mirror,
  }] };
  const db = {
    tables: { blockTable: {
      modelSpace: { newIterator: () => [{
        type: "INSERT", blockName: "outer", getFullInsertionTransform: () => rotate,
      }] },
      getAt: (name: string) => name === "outer" ? mirroredBlock : name === "leaf" ? lineBlock : undefined,
    } },
  };
  const entities = buildCadSnapPrimitives(db);
  assert.equal(entities.length, 1);
  const transformed = entities[0]!;
  assert.equal(transformed.kind, "line");
  if (transformed.kind !== "line") return;
  near(transformed.a.x, 100);
  near(transformed.a.y, 200);
  near(transformed.b.x, 100 - 6 * c - 4 * s);
  near(transformed.b.y, 200 - 6 * s + 4 * c);
  const engine = new CadSnapEngine();
  engine.rebuild(entities);
  assert.deepEqual(snap(engine, transformed.b, "endpoint")?.point, transformed.b);
});

test("rotated and mirrored ARC endpoints are world-angle correct, not local-angle remnants", () => {
  const rad = 37 * Math.PI / 180;
  const c = Math.cos(rad), s = Math.sin(rad);
  const transform = { elements: [-c, -s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 10, 20, 0, 1] };
  const arcBlock = { newIterator: () => [{
    type: "ARC", center: { x: 0, y: 0 }, radius: 10,
    startAngle: 0, endAngle: Math.PI / 2,
  }] };
  const db = { tables: { blockTable: {
    modelSpace: { newIterator: () => [{
      type: "INSERT", blockName: "arc", getFullInsertionTransform: () => transform,
    }] },
    getAt: () => arcBlock,
  } } };
  const primitives = buildCadSnapPrimitives(db);
  assert.equal(primitives.length, 1);
  assert.equal(primitives[0]?.kind, "arc");
  const engine = new CadSnapEngine();
  engine.rebuild(primitives);
  const start = { x: 10 - 10 * c, y: 20 - 10 * s };
  const end = { x: 10 - 10 * s, y: 20 + 10 * c };
  const startResult = snap(engine, start, "endpoint")?.point;
  const endResult = snap(engine, end, "endpoint")?.point;
  assert.ok(startResult && endResult);
  near(startResult.x, start.x);
  near(startResult.y, start.y);
  near(endResult.x, end.x);
  near(endResult.y, end.y);
});

test("LWPOLYLINE bulge is an ARC, not a falsely precise straight chord", () => {
  const model = { newIterator: () => [{
    type: "LWPOLYLINE", layer: "0",
    vertices: [{ x: 0, y: 0, bulge: 1 }, { x: 10, y: 0, bulge: 0 }],
  }] };
  const primitives = buildCadSnapPrimitives({ tables: { blockTable: { modelSpace: model } } });
  assert.equal(primitives.length, 1);
  assert.equal(primitives[0]?.kind, "arc");
  const engine = new CadSnapEngine();
  engine.rebuild(primitives);
  assert.equal(snap(engine, { x: 5, y: 0 }, "nearest"), null);
  assert.deepEqual(snap(engine, { x: 5, y: -5 }, "nearest")?.point, { x: 5, y: -5 });
});

class FakeSurface extends EventTarget {
  getBoundingClientRect() { return { left: 0, top: 0 }; }
}
function pointer(
  host: EventTarget,
  kind: string,
  x: number,
  y: number,
  pointerType = "mouse",
  pointerId = 1
) {
  const event = Object.assign(new Event(kind, { cancelable: true }), {
    pointerId, pointerType, button: 0, clientX: x, clientY: y,
  });
  host.dispatchEvent(event);
}
function mockWindowDocument<T>(callback: (win: FakeSurface, host: FakeSurface) => T): T {
  const g = globalThis as unknown as { window?: Window; document?: Document };
  const previousWindow = g.window, previousDoc = g.document;
  const win = new FakeSurface();
  const doc = new FakeSurface();
  const host = new FakeSurface();
  g.window = win as unknown as Window;
  g.document = Object.assign(doc, { hidden: false }) as unknown as Document;
  try { return callback(win, host); }
  finally { g.window = previousWindow; g.document = previousDoc; }
}

test("controller mouse double-click adds no phantom vertex, completes once, releases camera", () => {
  mockWindowDocument((_, host) => {
    const completed: CadChainDistanceResult[] = [];
    let commits = 0;
    let enabled = true;
    const controller = new CadChainDistanceController(host as unknown as HTMLElement, {
      resolvePoint: (p) => ({ point: p, snap: null }),
      setCameraInteractionEnabled: (on) => { enabled = on; },
    });
    controller.start(new Set<CadSnapMode>(["endpoint"]), {
      onComplete: (res) => { commits++; completed.push(res); },
    });
    assert.equal(enabled, false);
    pointer(host, "pointerdown", 0, 0);
    pointer(host, "pointerup", 0, 0);
    pointer(host, "pointerdown", 3000, 0);
    pointer(host, "pointerup", 3000, 0);
    pointer(host, "pointerdown", 3000, 0); // second click of the double click
    pointer(host, "dblclick", 3000, 0);
    assert.equal(commits, 1);
    assert.equal(completed[0]?.totalDistance, 3000);
    assert.equal(completed[0]?.points.length, 2);
    assert.equal(enabled, true);
    controller.finish();
    assert.equal(commits, 1);
    controller.destroy();
  });
});

test("controller first ESC clears draft; second ESC exits, no commit; normal lostcapture after up doesn't cancel", () => {
  mockWindowDocument((win, host) => {
    let committed = 0, canceled = 0;
    const controller = new CadChainDistanceController(host as unknown as HTMLElement, {
      resolvePoint: p => ({ point: p, snap: null }),
    });
    controller.start(new Set<CadSnapMode>(["endpoint"]), {
      onComplete: () => { committed++; },
      onCancel: () => { canceled++; },
    });
    pointer(host, "pointerdown", 0, 0);
    pointer(host, "pointerup", 0, 0);
    pointer(host, "lostpointercapture", 0, 0);
    assert.equal(controller.isActive, true);
    win.dispatchEvent(Object.assign(new Event("keydown", { cancelable: true }), { key: "Escape", isComposing: false }));
    assert.equal(controller.isActive, true);
    win.dispatchEvent(Object.assign(new Event("keydown", { cancelable: true }), { key: "Escape", isComposing: false }));
    assert.equal(controller.isActive, false);
    assert.equal(committed, 0);
    assert.equal(canceled, 1);
    controller.destroy();
  });
});

test("controller touch aims, then explicit confirmation commits points; cancel restores camera", () => {
  mockWindowDocument((_, host) => {
    const completed: CadChainDistanceResult[] = [];
    let cameraOn = true;
    const controller = new CadChainDistanceController(host as unknown as HTMLElement, {
      resolvePoint: p => ({ point: p, snap: null }),
      setCameraInteractionEnabled: (on) => { cameraOn = on; },
    });
    controller.start(new Set<CadSnapMode>(["endpoint"]), {
      onComplete: v => { completed.push(v); },
    });
    pointer(host, "pointerdown", 0, 0, "touch", 1);
    assert.equal(controller.confirmPreviewPoint(), true);
    pointer(host, "pointerup", 0, 0, "touch", 1);
    pointer(host, "pointerdown", 3000, 0, "touch", 2);
    assert.equal(controller.confirmPreviewPoint(), true);
    pointer(host, "pointerup", 3000, 0, "touch", 2);
    controller.finish();
    assert.equal(completed[0]?.points.length, 2);
    assert.equal(completed[0]?.totalDistance, 3000);
    assert.equal(cameraOn, true);
    controller.destroy();
  });
});

test("result -> one review transaction -> undo -> v1 JSON -> later reload", () => {
  const m = new CadChainDistanceMachine();
  m.start();
  m.addPoint({ x: 0, y: 0 });
  m.addPoint({ x: 3000, y: 0 });
  m.addPoint({ x: 3000, y: 4000 });
  const result = m.complete().result!;
  const store = new CadReviewStore(createDoc());
  const ctx = captureMeasurementContext(sourceContextFromInsunits(4), { displayUnit: "m" });
  const added = store.addMeasuredItem({
    id: "chain-1762070400000",
    type: "chain_distance",
    points: [...result.points],
    segmentDistances: [...result.segmentDistances],
    totalDistance: result.totalDistance,
    author: "Admin",
    status: "open",
    comment: "",
    createdAt: now,
    updatedAt: now,
    style: { color: "#007aff", strokeWidth: 2, opacity: 1 },
  }, ctx);
  assert.equal(added, true);
  assert.equal(store.getItems().length, 1);
  assert.equal(store.canUndo(), true);
  assert.equal(store.undo(), true);
  assert.equal(store.getItems().length, 0);
  assert.equal(store.redo(), true);
  const loaded = cadReviewDocumentSchema.parse(JSON.parse(JSON.stringify(store.getDocument())));
  assert.equal(loaded.items.length, 1);
  assert.equal(loaded.items[0]?.type, "chain_distance");
  if (loaded.items[0]?.type === "chain_distance") {
    assert.equal(loaded.items[0].totalDistance, 7000);
    assert.equal(loaded.items[0].measurementContext?.mmPerWorldUnit, 1);
  }
});
