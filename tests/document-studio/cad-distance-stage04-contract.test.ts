import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CadPressHoldDistanceMachine,
  CadPressHoldDistanceController,
  isValidCadDistance,
  type CadDistanceMeasurementResult,
} from "../../src/lib/dokumantasyon/cad-upstream/distance-measurement";
import type { CadSnapMode } from "../../src/lib/dokumantasyon/cad-upstream/snap-engine";
import { CadReviewStore } from "../../src/lib/dokumantasyon/cad-review/store";
import {
  cadReviewDocumentSchema,
  type CadReviewDocument,
  type CadReviewItem,
} from "../../src/lib/dokumantasyon/cad-review/schema";
import {
  sourceContextFromInsunits,
  captureMeasurementContext,
  formatCapturedDistance,
  formatDistance,
} from "../../src/lib/dokumantasyon/cad-review/units";

const now = "2026-11-02T00:00:00.000Z";
const id = "11111111-1111-4111-8111-111111111111";
const fileId = "22222222-2222-4222-8222-222222222222";
const p0 = { x: 0, y: 0 };
const p1 = { x: 3000, y: 4000 };
const ctx = captureMeasurementContext(sourceContextFromInsunits(4), { displayUnit: "m" });

function doc(items: CadReviewItem[] = []): CadReviewDocument {
  return {
    schemaVersion: 1,
    fileId,
    sourceVersionKey: "fixture.dxf",
    sourceSha256: "a".repeat(64),
    revision: 0,
    items,
    createdAt: now,
    updatedAt: now,
  };
}

function item(override?: Partial<Extract<CadReviewItem, { type: "distance" }>>):
  Extract<CadReviewItem, { type: "distance" }> {
  return {
    id,
    type: "distance",
    start: p0,
    end: p1,
    measuredLength: 5000,
    measurementContext: ctx,
    author: "Admin",
    comment: "",
    status: "open",
    style: { color: "#3b82f6", strokeWidth: 2, opacity: 1 },
    createdAt: now,
    updatedAt: now,
    ...override,
  };
}

function resolved(p: { x: number; y: number }) {
  return { point: p, snap: null };
}

test("3-4-5 distance remains raw world length 5000 and physical label is 5,00 m", () => {
  const machine = new CadPressHoldDistanceMachine();
  assert.equal(machine.start().phase, "awaiting-first");
  const first = machine.commitPoint(resolved(p0));
  assert.equal(first.snapshot.phase, "awaiting-second");
  assert.equal(first.result, null);
  assert.equal(machine.updateHoverPreview(resolved(p1))?.distance, 5000);
  const end = machine.commitPoint(resolved(p1));
  assert.equal(end.result?.distance, 5000);
  assert.deepEqual(end.result?.start, p0);
  assert.deepEqual(end.result?.end, p1);
  assert.equal(end.snapshot.phase, "complete");
  assert.equal(machine.commitPoint(resolved(p1)).result, null);
  assert.equal(formatCapturedDistance(5000, ctx), "5,00 m");
  assert.equal(formatDistance(5000, sourceContextFromInsunits(0), "m", 2), "5.000,00 çizim birimi");
});

test("invalid source points and zero length do not create committed measurements", () => {
  const machine = new CadPressHoldDistanceMachine();
  machine.start();
  machine.commitPoint(resolved(p0));
  assert.equal(machine.commitPoint(resolved(p0)).result, null);
  assert.equal(machine.phase, "awaiting-second");
  assert.equal(machine.commitPoint(resolved({ x: Number.NaN, y: 2 })).result, null);
  assert.equal(machine.commitPoint(resolved({ x: 1e9 + 1, y: 2 })).result, null);
  assert.equal(machine.commitPoint(resolved({ x: 1e-11, y: 0 })).result, null);
  assert.equal(machine.commitPoint(resolved(p1)).result?.distance, 5000);
  assert.equal(isValidCadDistance(p0, p0), false);
  assert.equal(isValidCadDistance(p0, p1), true);
  assert.equal(isValidCadDistance({ x: -1e9, y: 1e9 }, { x: 1e9, y: -1e9 }), true);
  assert.equal(isValidCadDistance({ x: -1e9, y: 1e9 }, { x: 1e9 + 1, y: 1e9 }), false);
});

test("hold-and-release follows original two-point tracking; premature release does not commit", () => {
  const machine = new CadPressHoldDistanceMachine();
  machine.start();
  assert.equal(machine.pointerDown(1), true);
  assert.equal(machine.pointerUp(1)?.snapshot.phase, "awaiting-first");
  assert.equal(machine.pointerDown(2), true);
  assert.equal(machine.activateHold(2, resolved(p0))?.phase, "tracking-first");
  assert.equal(machine.pointerUp(2, resolved(p0))?.snapshot.phase, "awaiting-second");
  assert.equal(machine.pointerDown(3), true);
  assert.equal(machine.activateHold(3, resolved({ x: 3000, y: 0 }))?.phase, "tracking-second");
  assert.equal(machine.move(3, resolved(p1))?.distance, 5000);
  const end = machine.pointerUp(3, resolved(p1));
  assert.equal(end?.result?.distance, 5000);
  assert.equal(machine.pointerUp(3, resolved(p1)), null); // no extra completion
});

class FakeSurface extends EventTarget {
  getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; }
}
function pointer(
  host: EventTarget,
  kind: string,
  x: number,
  y: number,
  type: "mouse" | "touch" = "mouse",
  pointerId = 1
) {
  const event = Object.assign(new Event(kind, { bubbles: true, cancelable: true }), {
    pointerId,
    pointerType: type,
    isPrimary: true,
    button: 0,
    clientX: x,
    clientY: y,
    shiftKey: false,
  });
  host.dispatchEvent(event);
}
function withFakeDom(run: (host: FakeSurface, win: FakeSurface) => void): void {
  const g = globalThis as unknown as { window?: Window; document?: Document };
  const formerWindow = g.window;
  const formerDocument = g.document;
  const host = new FakeSurface();
  const win = Object.assign(new FakeSurface(), {
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
  });
  const document = Object.assign(new FakeSurface(), { visibilityState: "visible" });
  g.window = win as unknown as Window;
  g.document = document as unknown as Document;
  try { run(host, win); }
  finally { g.window = formerWindow; g.document = formerDocument; }
}

test("desktop pan/drag with mouse held never commits first distance point", () => {
  withFakeDom((host) => {
    let completed = 0;
    const controller = new CadPressHoldDistanceController(host as unknown as HTMLElement, {
      resolvePoint: (p) => resolved(p),
      setCameraInteractionEnabled: () => {},
    });
    controller.start(new Set<CadSnapMode>(["endpoint"]), {
      onComplete: () => { completed += 1; },
    });
    pointer(host, "pointerdown", 30, 30);
    pointer(host, "pointermove", 200, 150);
    pointer(host, "pointerup", 200, 150);
    assert.equal(controller.phase, "awaiting-first");
    assert.equal(completed, 0);
    controller.destroy();
  });
});

test("desktop two intentional clicks commit once; pointer id mismatch is ignored", () => {
  withFakeDom((host) => {
    const completions: CadDistanceMeasurementResult[] = [];
    let panEnabled = false;
    const controller = new CadPressHoldDistanceController(host as unknown as HTMLElement, {
      resolvePoint: (p) => resolved(p),
      setCameraInteractionEnabled: value => { panEnabled = value; },
    });
    controller.start(new Set<CadSnapMode>(["endpoint"]), {
      onComplete: x => completions.push(x),
    });
    pointer(host, "pointerdown", 0, 0, "mouse", 11);
    pointer(host, "pointerup", 0, 0, "mouse", 12); // unrelated pointer
    assert.equal(controller.phase, "awaiting-first");
    pointer(host, "pointerup", 0, 0, "mouse", 11);
    assert.equal(controller.phase, "awaiting-second");
    pointer(host, "pointermove", 3000, 4000, "mouse", 11);
    pointer(host, "pointerdown", 3000, 4000, "mouse", 11);
    pointer(host, "pointerup", 3000, 4000, "mouse", 11);
    assert.equal(completions.length, 1);
    assert.equal(completions[0]?.distance, 5000);
    assert.equal(controller.phase, "complete");
    assert.equal(panEnabled, true);
    controller.destroy();
  });
});

test("short touch taps still commit two points, and blur cancels a pending long press", () => {
  withFakeDom((host, win) => {
    let completed = 0;
    let canceled = 0;
    let cameraOn = false;
    const controller = new CadPressHoldDistanceController(host as unknown as HTMLElement, {
      resolvePoint: p => resolved(p),
      setCameraInteractionEnabled: on => { cameraOn = on; },
    });
    controller.start(new Set<CadSnapMode>(["endpoint"]), {
      onComplete: x => {
        assert.equal(x.distance, 5000);
        completed += 1;
      },
      onCancel: () => { canceled += 1; },
    });
    pointer(host, "pointerdown", 0, 0, "touch", 1);
    pointer(host, "pointerup", 0, 0, "touch", 1);
    assert.equal(controller.phase, "awaiting-second");
    pointer(host, "pointerdown", 3000, 4000, "touch", 2);
    pointer(host, "pointerup", 3000, 4000, "touch", 2);
    assert.equal(completed, 1);
    controller.start(new Set<CadSnapMode>(["endpoint"]), {
      onCancel: () => { canceled += 1; },
    });
    pointer(host, "pointerdown", 400, 0, "touch", 3);
    win.dispatchEvent(new Event("blur"));
    assert.equal(controller.phase, "inactive");
    assert.equal(cameraOn, true);
    assert.equal(canceled, 1);
    controller.destroy();
  });
});

test("review store owns exactly one committed distance: undo, redo, source snapshot, JSON", () => {
  const store = new CadReviewStore(doc());
  let mutations = 0;
  store.subscribe(() => { mutations += 1; });
  assert.equal(store.addMeasuredItem(item(), ctx), true);
  assert.equal(store.getItems().length, 1);
  assert.equal(mutations, 1);
  assert.equal(store.addMeasuredItem(item(), ctx), false); // duplicate ID
  assert.equal(store.getItems().length, 1);
  assert.equal(store.canUndo(), true);
  assert.equal(store.undo(), true);
  assert.equal(store.getItems().length, 0);
  assert.equal(store.canRedo(), true);
  assert.equal(store.redo(), true);
  assert.equal(store.getItems().length, 1);
  const reloaded = cadReviewDocumentSchema.parse(JSON.parse(JSON.stringify(store.getDocument())));
  assert.equal(reloaded.items.length, 1);
  if (reloaded.items[0]?.type === "distance") {
    assert.deepEqual(reloaded.items[0].start, p0);
    assert.deepEqual(reloaded.items[0].end, p1);
    assert.equal(reloaded.items[0].measuredLength, 5000);
    assert.equal(formatCapturedDistance(reloaded.items[0].measuredLength, reloaded.items[0].measurementContext!), "5,00 m");
  } else {
    assert.fail("Expected persisted distance item");
  }
});

test("server hydration updates the same observed store; dirty local data wins", () => {
  const store = new CadReviewStore(doc());
  let notifications = 0;
  store.subscribe(() => { notifications += 1; });
  const server = doc([item()]);
  server.revision = 3;
  assert.equal(store.hydrateFromServerIfPristine(server), true);
  assert.equal(store.getItems().length, 1);
  assert.equal(store.getDocument().revision, 3);
  assert.equal(notifications, 1);
  assert.equal(store.hydrateFromServerIfPristine(doc([])), false); // never overwrite
  const local = new CadReviewStore(doc());
  assert.equal(local.addMeasuredItem(item(), ctx), true);
  assert.equal(local.hydrateFromServerIfPristine(server), false);
  assert.equal(local.getItems().length, 1);
  const invalid = doc([item({ measuredLength: Number.NaN })]);
  assert.equal(new CadReviewStore(doc()).hydrateFromServerIfPristine(invalid), false);
});

test("Clear Measurements is one undo step; pin remains untouched, order restored", () => {
  const pin: Extract<CadReviewItem, { type: "comment_pin" }> = {
    id: "33333333-3333-4333-8333-333333333333",
    type: "comment_pin",
    position: { x: 100, y: 100 },
    pinIndex: 1,
    title: "Not",
    author: "Admin",
    comment: "Annotation",
    status: "open",
    style: { color: "#ff3b30", strokeWidth: 2, opacity: 1 },
    createdAt: now,
    updatedAt: now,
  };
  const chain: Extract<CadReviewItem, { type: "chain_distance" }> = {
    id: "chain-1762070400000",
    type: "chain_distance",
    points: [p0, { x: 3000, y: 0 }, p1],
    segmentDistances: [3000, 4000],
    totalDistance: 7000,
    author: "Admin",
    comment: "",
    status: "open",
    style: { color: "#3b82f6", strokeWidth: 2, opacity: 1 },
    createdAt: now,
    updatedAt: now,
  };
  const store = new CadReviewStore(doc([pin, item(), chain]));
  assert.equal(store.clearMeasurements(), true);
  assert.deepEqual(store.getItems().map(x => x.type), ["comment_pin"]);
  assert.equal(store.canUndo(), true);
  assert.equal(store.clearMeasurements(), false);
  assert.equal(store.undo(), true);
  assert.deepEqual(store.getItems().map(x => x.type), ["comment_pin", "distance", "chain_distance"]);
  assert.equal(store.redo(), true);
  assert.deepEqual(store.getItems().map(x => x.type), ["comment_pin"]);
});

test.todo("ASAMA_08: DXF review export must not hardcode INSUNITS=6 for raw-mm geometry");
