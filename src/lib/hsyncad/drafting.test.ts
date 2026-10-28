import test from "node:test";
import assert from "node:assert/strict";
import { createEmptyModel, validateModel } from "./model";
import { draftingValues, isDraftingTool, localToWorld, projectOnReference, referenceSnapCandidates, worldToLocal, type DraftingItem } from "./drafting";
import { calculateQuantities } from "./quantities";
const record = (kind: DraftingItem["kind"], points: DraftingItem["points"]): DraftingItem => ({ id: kind, name: kind, floorId: "floor-0", kind, points });
test("distance, projections, three-point angle and area match independent geometry", () => {
  assert.deepEqual(draftingValues(record("measureDistance", [{ x: 0, y: 0 }, { x: 3, y: 4 }])), { length: 5, dx: 3, dy: 4, angle: Math.atan2(4, 3) * 180 / Math.PI });
  assert.equal(draftingValues(record("measureAngle", [{ x: 4, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 3 }])).angle, 90);
  assert.deepEqual(draftingValues(record("measureArea", [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 }, { x: 0, y: 3 }])), { area: 12, perimeter: 14 });
});
test("rotated local coordinates round trip in metres without moving the structure", () => {
  const frame = { origin: { x: 10, y: 20 }, angle: 90, enabled: true };
  assert.deepEqual(localToWorld({ x: 2, y: 0 }, frame), { x: 10, y: 22 });
  const p = worldToLocal({ x: 10, y: 22 }, frame); assert.ok(Math.abs(p.x - 2) < 1e-9 && Math.abs(p.y) < 1e-9);
  assert.deepEqual(localToWorld({ x: 2, y: 3 }, { ...frame, enabled: false }), { x: 2, y: 3 });
});
test("reference intersections, midpoints and infinite-line projection support snapping", () => {
  const line = record("referenceLine", [{ x: 0, y: 1 }, { x: 4, y: 1 }]), other = { ...record("referenceLine", [{ x: 2, y: 0 }, { x: 2, y: 3 }]), id: "other" };
  const points = referenceSnapCandidates([], [line, other]); assert.deepEqual(points.intersection, [{ x: 2, y: 1 }]);
  assert.ok(points.midpoint.some(p => p.x === 2 && p.y === 1)); assert.deepEqual(projectOnReference({ x: 6, y: 1.02 }, [line], 0.1), { x: 6, y: 1 });
});
test("drafting JSON validates references and never contributes concrete or formwork", () => {
  const base = createEmptyModel(), item = record("referenceLine", [{ x: 0, y: 0 }, { x: 4, y: 0 }]);
  const m = validateModel({ ...base, drafting: { items: [item], frames: { "floor-0": { origin: { x: 0, y: 0 }, angle: 45, enabled: true } } } });
  assert.deepEqual(validateModel(JSON.parse(JSON.stringify(m))), m);
  assert.equal(calculateQuantities(m).grossVolume, 0); assert.equal(calculateQuantities(m).formwork, 0);
  assert.throws(() => validateModel({ ...m, drafting: { items: [{ ...item, floorId: "missing" }] } }));
  assert.throws(() => validateModel({ ...m, drafting: { items: [{ ...item, points: [item.points[0], item.points[0]] }] } }));
  assert.equal(isDraftingTool("constructor"), false); assert.equal(isDraftingTool("toString"), false);
});
