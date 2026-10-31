import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoModel, createEmptyModel } from "./model";
import { runStructuralAnalysis } from "./analysis";
import { resolveJunctions } from "./junctions";
import { buildRebarSchedule, generateProjectPaftas } from "./pafta-engine";

test("preliminary self weight uses shared net solids and actual story height", () => {
  const model = createDemoModel();
  model.elements = model.elements.filter(e => e.type === "column").slice(0, 1);
  const column = model.elements[0];
  if (column.type !== "column") throw Error("column required");
  column.heightMode = "story";
  model.floors[0].height = 4;
  assert.ok(Math.abs(runStructuralAnalysis(model).totalWeightKn - .4 * .4 * 4 * 25) < 1e-8);
});

test("overlap concrete is not counted twice in analysis self weight", () => {
  const model = createDemoModel();
  model.elements = model.elements.filter(e => e.type === "column" || e.type === "beam");
  assert.ok(Math.abs(runStructuralAnalysis(model).totalWeightKn - resolveJunctions(model).netVolume! * 25) < 1e-8);
});

test("invalid preliminary settings reject rather than emit Infinity or NaN", () => {
  for (const settings of [{ r: 0 }, { sds: NaN }, { importance: -1 }, { liveLoadParticipation: 2 }]) {
    assert.throws(() => runStructuralAnalysis(createDemoModel(), settings));
  }
});

test("no invented rebar for empty models and no second multiplication by floor count", () => {
  assert.deepEqual(buildRebarSchedule(createEmptyModel()), []);
  const model = createDemoModel();
  const original = buildRebarSchedule(model);
  model.floors.push({ id: "empty-floor", name: "Boş", elevation: 3, height: 3 });
  assert.deepEqual(buildRebarSchedule(model), original);
  assert.ok(original.every(row => row.count > 0 && Math.abs(row.totalLengthM - row.count * row.lengthCm / 100) < 1e-8));
});

test("sheets have model title and geometry totals, never reference-owner credentials", () => {
  const model = createDemoModel();
  model.name = "Kendi projem";
  const sheet = generateProjectPaftas(model, "A0")[0];
  assert.equal(sheet.metadata.projectName, model.name);
  assert.equal(sheet.metadata.owner, "");
  assert.equal(sheet.metadata.engineerName, "");
  assert.equal(sheet.metadata.engineerChamberNo, "");
  assert.equal(sheet.metadata.totalFloors, 1);
  assert.equal(sheet.metadata.totalAreaM2, 16);
  assert.ok(sheet.notes.some(note => note.includes("TASLAK")));
});
