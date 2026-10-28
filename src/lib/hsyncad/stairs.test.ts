import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoModel } from "./model";
import { calculateStairGeometry, addStairToModel, DEFAULT_STAIR_PARAMS } from "./stairs";

test("Stair geometry calculates run, height, volume and Blondel comfort check", () => {
  const start = { x: 0, y: 0 };
  const end = { x: 4.8, y: 0 }; // 16 steps of 30cm = 4.8m run
  const calc = calculateStairGeometry(DEFAULT_STAIR_PARAMS, start, end);

  assert.equal(calc.totalRunM, 4.8);
  assert.equal(calc.totalHeightM, 16 * 0.175); // 2.80m height
  assert.equal(calc.treadDepthM, 0.30);
  assert.ok(calc.comfortFormulaCheck, "2s + a = 2*17.5 + 30 = 65cm olmalı");
  assert.ok(calc.concreteVolumeM3 > 0);
  assert.ok(calc.formworkAreaM2 > 0);
});

test("Stair is added to model as sloped slab in Merdivenler layer", () => {
  const model = createDemoModel();
  const next = addStairToModel(model, model.floors[0].id, { x: 1, y: 1 }, { x: 1, y: 4 });

  const stair = next.elements.find(e => e.layer === "Merdivenler");
  assert.ok(stair, "Merdiven elemanı eklenmiş olmalı");
  assert.equal(stair.type, "slab");
  if (stair.type === "slab") {
    assert.equal(stair.points.length, 4);
    assert.ok(stair.slopeY !== undefined && stair.slopeY !== 0);
  }
});
