import assert from "node:assert/strict";
import { test } from "node:test";
import { historyReducer, initialHistory } from "../../src/components/hsyncad/editor-state";
import { createDemoModel, createEmptyModel } from "../../src/lib/hsyncad/model";

test("new/import/edit and undo/redo preserve complete independent model snapshots", () => {
  const initial = initialHistory();
  const demo = createDemoModel();
  const loaded = historyReducer(initial, { type: "commit", model: demo });
  const changed = { ...demo, elements: demo.elements.slice(1) };
  const edited = historyReducer(loaded, { type: "commit", model: changed });
  const undone = historyReducer(edited, { type: "undo" });
  assert.deepEqual(undone.present, demo);
  assert.deepEqual(historyReducer(undone, { type: "redo" }).present, changed);
  assert.equal(demo.elements.length, 14);
  const cleared = historyReducer(undone, { type: "commit", model: createEmptyModel() });
  assert.equal(cleared.future.length, 0);
  assert.deepEqual(historyReducer(cleared, { type: "undo" }).present, demo);
});

test("history is bounded and initial restore does not manufacture an undo action", () => {
  let state = initialHistory();
  for (let i = 0; i < 100; i++) state = historyReducer(state, { type: "commit", model: { ...createEmptyModel(), name: `Model ${i}` } });
  assert.equal(state.past.length, 80);
  const restored = historyReducer(state, { type: "restore", model: createDemoModel() });
  assert.equal(restored.past.length, 0);
  assert.equal(restored.future.length, 0);
  assert.equal(historyReducer(restored, { type: "undo" }), restored);
});
