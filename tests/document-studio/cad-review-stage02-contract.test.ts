import { test } from "node:test";
import assert from "node:assert/strict";

import {
  cadReviewDocumentSchema,
  cadReviewItemSchema,
  type CadReviewDocument,
  type CadReviewItem,
} from "../../src/lib/dokumantasyon/cad-review/schema";
import { CadReviewStore } from "../../src/lib/dokumantasyon/cad-review/store";
import { CadMeasurementFacade } from "../../src/lib/dokumantasyon/cad-review/measurement-facade";
import {
  calculateCalibrationFromWorldDistance,
  captureMeasurementContext,
  convertArea,
  convertDistance,
  formatArea,
  formatCapturedArea,
  formatCapturedDistance,
  formatDistance,
  sourceContextFromInsunits,
} from "../../src/lib/dokumantasyon/cad-review/units";

const now = "2026-11-02T00:00:00.000Z";
const itemId = "11111111-1111-4111-8111-111111111111";

function makeDoc(items: CadReviewItem[] = []): CadReviewDocument {
  return {
    schemaVersion: 1,
    fileId: "22222222-2222-4222-8222-222222222222",
    sourceVersionKey: "fixture.dxf",
    sourceSha256: "a".repeat(64),
    revision: 0,
    items,
    createdAt: now,
    updatedAt: now,
  };
}
function distance(measuredLength = 5): Extract<CadReviewItem, { type: "distance" }> {
  return {
    type: "distance",
    id: itemId,
    author: "Engineer",
    createdAt: now,
    updatedAt: now,
    status: "open",
    comment: "",
    style: { color: "#ff3b30", strokeWidth: 2, opacity: 1 },
    start: { x: 0, y: 0 },
    end: { x: 3, y: 4 },
    measuredLength,
  };
}

test("legacy v1 payload round-trip with no synthetic measurement snapshot", () => {
  const before = makeDoc([distance()]);
  const parsed = cadReviewDocumentSchema.safeParse(JSON.parse(JSON.stringify(before)));
  assert.equal(parsed.success, true);
  if (!parsed.success) return;
  assert.deepEqual(parsed.data, before);
  assert.equal("measurementContext" in parsed.data.items[0]!, false);
  assert.equal(cadReviewDocumentSchema.safeParse({
    ...before, items: [{ ...distance(), measuredLength: Number.NaN }],
  }).success, false);
  assert.equal(cadReviewDocumentSchema.safeParse({
    ...before, items: [{ ...distance(), start: { x: 1e10, y: 0 } }],
  }).success, false);
  assert.equal(cadReviewDocumentSchema.safeParse({ ...before, schemaVersion: 2 }).success, false);
});

test("INSUNITS mm/cm/m vs unitless and unsupported: never invent metres", () => {
  assert.equal(sourceContextFromInsunits(4).sourceUnit, "mm");
  assert.equal(sourceContextFromInsunits(5).mmPerWorldUnit, 10);
  assert.equal(sourceContextFromInsunits(6).mmPerWorldUnit, 1000);
  assert.equal(sourceContextFromInsunits(0).mmPerWorldUnit, null);
  assert.equal(sourceContextFromInsunits(99).source, "unknown");
  assert.equal(convertDistance(2000, sourceContextFromInsunits(4), "m"), 2);
  assert.equal(convertDistance(2000, sourceContextFromInsunits(4), "cm"), 200);
  assert.equal(convertDistance(2000, sourceContextFromInsunits(4), "mm"), 2000);
  assert.equal(formatDistance(2000, sourceContextFromInsunits(4), "m", 2), "2,00 m");
  assert.equal(formatDistance(25, sourceContextFromInsunits(null), "m", 2), "25,00 çizim birimi");
  assert.equal(formatArea(100, sourceContextFromInsunits(0), "m2", 2), "100,00 çizim birimi²");
});

test("3-4-5 oracle, conversion, calibration 2x distance -> 4x area", () => {
  assert.equal(Math.hypot(3, 4), 5);
  assert.equal(convertArea(12, sourceContextFromInsunits(6), "m2"), 12);
  assert.ok(Math.abs((convertArea(12, sourceContextFromInsunits(4), "m2") ?? 0) - 12e-6) < 1e-12);
  const calibrated1 = calculateCalibrationFromWorldDistance(100, 50, "cm", 1);
  const calibrated2 = calculateCalibrationFromWorldDistance(100, 100, "cm", 2);
  assert.equal(calibrated1.mmPerWorldUnit, 5);
  assert.equal(convertDistance(400, calibrated1, "m"), 2);
  assert.equal(convertArea(400 * 600, calibrated1, "m2"), 6);
  assert.equal(convertDistance(400, calibrated2, "m"), 4);
  assert.equal(convertArea(400 * 600, calibrated2, "m2"), 24);
  const snap = captureMeasurementContext(calibrated1, { displayUnit: "m", precision: 2 });
  assert.equal(snap.calibrationRevision, 1);
  assert.equal(snap.areaDisplayUnit, "m2");
  assert.equal(formatCapturedDistance(400, snap), "2,00 m");
  assert.equal(formatCapturedArea(400 * 600, snap), "6,00 m²");
});

test("one valid measurement = one undo; invalid, duplicate, malformed chain = zero history", () => {
  const store = new CadReviewStore(makeDoc());
  const snap = captureMeasurementContext(sourceContextFromInsunits(6), { displayUnit: "m" });
  let notifications = 0;
  store.subscribe(() => notifications++);
  store.setDraft("distance", { type: "distance", start: { x: 0, y: 0 } });
  notifications = 0;
  assert.equal(store.addMeasuredItem(distance(), snap), true);
  assert.equal(notifications, 1);
  assert.equal(store.getDraft().draftItem, null);
  assert.equal(store.canUndo(), true);
  assert.equal(store.addMeasuredItem(distance(), snap), false);
  assert.equal(store.addItem({
    ...distance(), id: "33333333-3333-4333-8333-333333333333", measuredLength: -1,
  }), false);
  const malformedChain: Extract<CadReviewItem, { type: "chain_distance" }> = {
    ...distance(),
    id: "44444444-4444-4444-8444-444444444444",
    type: "chain_distance",
    points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
    totalDistance: 2,
    segmentDistances: [2],
  };
  assert.equal(store.addItem(malformedChain), false);
  assert.equal(store.getItems().length, 1);
  assert.equal(notifications, 1);
  assert.equal(store.undo(), true);
  assert.equal(store.canUndo(), false);
  assert.equal(store.canRedo(), true);
  assert.equal(store.addItem({
    ...distance(), id: "55555555-5555-4555-8555-555555555555", measuredLength: Infinity,
  }), false);
  assert.equal(store.canRedo(), true);
  assert.equal(store.redo(), true);
  assert.equal(store.getItems().length, 1);
});

test("snapshot survives session changes and JSON, and cannot be silently patched", () => {
  const store = new CadReviewStore(makeDoc());
  const captured = captureMeasurementContext(
    calculateCalibrationFromWorldDistance(100, 50, "cm", 3),
    { displayUnit: "m", areaDisplayUnit: "m2", precision: 2 }
  );
  assert.equal(store.addMeasuredItem(distance(), captured), true);
  const before = new CadMeasurementFacade(store, "mm", 0).listMeasurements()[0]!;
  assert.equal(before.formattedValue, "0,03 m");
  store.setMeasurementUnitSettings({ unit: "cm", precision: 3 });
  const after = new CadMeasurementFacade(store, "cm", 3).listMeasurements()[0]!;
  assert.equal(after.formattedValue, before.formattedValue);
  const reloaded = cadReviewDocumentSchema.parse(JSON.parse(JSON.stringify(store.getDocument())));
  assert.equal(reloaded.items[0]?.type === "distance" && reloaded.items[0].measurementContext?.calibrationRevision, 3);
  assert.equal(cadReviewItemSchema.safeParse({
    ...distance(), measurementContext: { ...captured, mmPerWorldUnit: -1 },
  }).success, false);
  assert.equal(store.updateItem(itemId, {
    measurementContext: captured,
  } as Partial<CadReviewItem>), false);
});

test("measurement color is one committed transaction; session settings never leak to other stores", () => {
  const first = new CadReviewStore(makeDoc([distance()]));
  const other = new CadReviewStore(makeDoc());
  assert.equal(first.getMeasurementUnitSettings().areaUnit, "m2");
  first.setMeasurementUnitSettings({ color: "#ef4444" });
  assert.equal(first.getItems()[0]?.style.color, "#ef4444");
  assert.equal(first.canUndo(), true);
  assert.equal(other.getMeasurementUnitSettings().color, "#3b82f6");
  assert.equal(first.undo(), true);
  assert.equal(first.getItems()[0]?.style.color, "#ff3b30");
  first.setMeasurementUnitSettings({ color: "#10b981" });
  const newItem = { ...distance(), id: "66666666-6666-4666-8666-666666666666" };
  assert.equal(first.addItem(newItem), true);
  assert.equal(first.getItems().at(-1)?.style.color, "#10b981");
  assert.equal(newItem.style.color, "#ff3b30");
});

test("legacy non-UUID ID stays unchanged across edit and undo", () => {
  const old = { ...distance(), id: "dist-1" };
  const store = new CadReviewStore(makeDoc([old]));
  const facade = new CadMeasurementFacade(store, "m", 2);
  facade.renameMeasurement("dist-1", "Eski ölçüm");
  assert.equal(store.getItems()[0]?.type === "distance" && store.getItems()[0].label, "Eski ölçüm");
  assert.equal(store.getItems()[0]?.id, "dist-1");
  assert.equal(store.undo(), true);
  assert.equal(store.getItems()[0]?.type === "distance" && store.getItems()[0].label, undefined);
});


test("existing host chain-epoch IDs remain accepted by the additive schema/store", () => {
  const store = new CadReviewStore(makeDoc());
  const chain: Extract<CadReviewItem, { type: "chain_distance" }> = {
    type: "chain_distance",
    id: "chain-1762070400000",
    points: [{ x: 0, y: 0 }, { x: 3000, y: 0 }, { x: 3000, y: 4000 }],
    segmentDistances: [3000, 4000],
    totalDistance: 7000,
    author: "Admin",
    status: "open",
    comment: "",
    style: { color: "#007aff", strokeWidth: 2, opacity: 1 },
    createdAt: now,
    updatedAt: now,
  };
  assert.equal(cadReviewItemSchema.safeParse(chain).success, true);
  assert.equal(store.addItem(chain), true);
  assert.equal(store.getItems()[0]?.id, chain.id);
  assert.equal(store.undo(), true);
  assert.equal(store.canRedo(), true);
  assert.equal(store.redo(), true);
  assert.equal(store.getItems()[0]?.id, chain.id);
  assert.equal(cadReviewDocumentSchema.safeParse(JSON.parse(JSON.stringify(store.getDocument()))).success, true);
});
