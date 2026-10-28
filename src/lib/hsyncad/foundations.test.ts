import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoModel } from "./model";
import { addPadFootingToColumn, addStripFootingToBeam, addRaftFoundation, calculateSoilPressure } from "./foundations";

test("Pad footing is created under column and soil pressure is calculated", () => {
  const model = createDemoModel();
  const column = model.elements.find(e => e.type === "column")!;
  assert.equal(column.type, "column");

  const next = addPadFootingToColumn(model, column, 1.6, 1.6, 0.5);
  const footing = next.elements.find(e => e.id === `footing-${column.id}`);

  assert.ok(footing, "Tekil temel modele eklenmeli");
  assert.equal(footing.layer, "Temeller");
  assert.equal(footing.type, "column");
  if (footing.type === "column") {
    assert.equal(footing.width, 1.6);
    assert.equal(footing.baseOffset, -0.5);
    assert.deepEqual(footing.position, column.position);
  }

  const soil = calculateSoilPressure(300, 20, 1.6, 1.6, 200);
  assert.ok(soil.qMaxKpa > 0);
  assert.ok(soil.pass);
});

test("Strip footing is created along beam", () => {
  const model = createDemoModel();
  const beam = model.elements.find(e => e.type === "beam")!;
  assert.equal(beam.type, "beam");

  const next = addStripFootingToBeam(model, beam, 0.8, 0.6);
  const footing = next.elements.find(e => e.id === `strip-${beam.id}`);

  assert.ok(footing, "Sürekli temel modele eklenmeli");
  assert.equal(footing.layer, "Temeller");
  if (footing.type === "beam") {
    assert.equal(footing.width, 0.8);
    assert.equal(footing.height, 0.6);
    assert.deepEqual(footing.start, beam.start);
    assert.deepEqual(footing.end, beam.end);
  }
});

test("Raft foundation creates a slab with foundation thickness", () => {
  const model = createDemoModel();
  const corners = [{ x: -1, y: -1 }, { x: 5, y: -1 }, { x: 5, y: 5 }, { x: -1, y: 5 }];
  const next = addRaftFoundation(model, model.floors[0].id, corners, 0.6);

  const raft = next.elements.find(e => e.name === "RAD-1");
  assert.ok(raft, "Radye temel modele eklenmeli");
  assert.equal(raft.layer, "Temeller");
  assert.equal(raft.type, "slab");
  if (raft.type === "slab") {
    assert.equal(raft.thickness, 0.6);
    assert.equal(raft.points.length, 4);
  }
});
