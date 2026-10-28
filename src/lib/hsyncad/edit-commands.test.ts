import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoModel, validateModel } from "./model";
import { editElement } from "./edit-commands";
import { elementFootprint } from "./geometry";
import { reconcileConnections } from "./relationships";
test("copied geometry owns points and discards external bindings without changing source", () => {
  const model = createDemoModel(), beam = model.elements.find(e => e.type === "beam")!;
  const copy = editElement(beam, "copy", 10, 2, 0, 1)[0];
  assert.notEqual(copy.id, beam.id); assert.notEqual(copy, beam); assert.equal(copy.connections, undefined);
  const valid = validateModel({ ...model, elements: [...model.elements, copy] });
  assert.equal(valid.elements.length, model.elements.length + 1);
  assert.deepEqual(model.elements.find(e => e.id === beam.id), beam);
});
test("rotating a column footprint is a rigid physical rotation and mirror reflects Y", () => {
  const source = createDemoModel().elements.find(e => e.type === "column")!;
  if (source.type !== "column") throw Error();
  source.width = .3; source.depth = .7; source.offsetX = .2; source.offsetY = .1;
  const before = elementFootprint(source);
  const rotated = elementFootprint(editElement(source, "rotate", 0, 0, 90, 1)[0]);
  const mirrored = elementFootprint(editElement(source, "mirror", 0, 0, 0, 1)[0]);
  const contains = (points: typeof before, x: number, y: number) => points.some(p => Math.abs(p.x - x) < 1e-8 && Math.abs(p.y - y) < 1e-8);
  for (const p of before) { assert.ok(contains(rotated, -p.y, p.x)); assert.ok(contains(mirrored, p.x, -p.y)); }
});
test("array copies have independent IDs and remain valid through reconciliation", () => {
  const m = createDemoModel(), column = m.elements.find(e => e.type === "column")!;
  const copies = editElement(column, "array", 5, 0, 0, 3);
  const next = validateModel(reconcileConnections({ ...m, elements: [...m.elements, ...copies] }, m));
  assert.equal(new Set(next.elements.map(e => e.id)).size, m.elements.length + 3);
  assert.deepEqual(copies.map(e => e.type === "column" ? e.position.x : null), [5, 10, 15]);
});
test("unsupported sloping slab transform is rejected instead of silently changing its plane", () => {
  const slab = createDemoModel().elements.find(e => e.type === "slab")!;
  assert.throws(() => editElement({ ...slab, slopeX: 5 } as typeof slab, "rotate", 0, 0, 45, 1), /Eğimli/);
  assert.throws(() => editElement(slab, "array", 1, 0, 0, 500), /1–50/);
});
