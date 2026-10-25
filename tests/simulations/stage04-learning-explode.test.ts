import assert from "node:assert/strict";
import {
  buildColumnDetailModel,
  getColumnSceneSpec,
} from "../../src/lib/simulations/scenes/column-c1";
import {
  createInitialSimulationViewState,
  deriveLayerVisibilityFromProgressT,
  getColumnLearningSteps,
  simulationViewReducer,
} from "../../src/lib/simulations/state/view-reducer";

console.log("=== Simülasyon Kütüphanesi Aşama 04 Öğrenme, Patlatma ve Zaman (t) Testleri ===");

const c1Model = buildColumnDetailModel(getColumnSceneSpec("c1-referans"));
const crosstieModel = buildColumnDetailModel(getColumnSceneSpec("c1-cirozlu-ogretim"));

// 1. 4–6 öğrenme adımı aralığı doğrulaması (5 adım)
const c1Steps = getColumnLearningSteps("c1-referans");
const crosstieSteps = getColumnLearningSteps("c1-cirozlu-ogretim");
assert.equal(c1Steps.length, 5);
assert.equal(crosstieSteps.length, 5);

// 2. t=0 ve t=1 sınır durumları + katman katman gösterim
const layersAtZero = deriveLayerVisibilityFromProgressT(0);
assert.equal(layersAtZero.concrete, false);
assert.equal(layersAtZero.longitudinal, false);
assert.equal(layersAtZero.stirrup, false);
assert.equal(layersAtZero.crosstie, false);
assert.equal(layersAtZero.dowel, false);

const layersAtOne = deriveLayerVisibilityFromProgressT(1);
assert.equal(layersAtOne.concrete, true);
assert.equal(layersAtOne.longitudinal, true);
assert.equal(layersAtOne.stirrup, true);
assert.equal(layersAtOne.crosstie, true);
assert.equal(layersAtOne.dowel, true);

// 3. İleri–geri öğrenme adımı tutarlılığı
let state = createInitialSimulationViewState("c1-referans");
assert.equal(state.learning.mode, "free");
assert.equal(state.learning.layerProgressT, 1);

// Adım 0'a geç
state = simulationViewReducer(state, {
  type: "SET_LEARNING_STEP",
  stepIndex: 0,
  model: c1Model,
});
assert.equal(state.learning.mode, "guided");
assert.equal(state.learning.stepIndex, 0);
assert.equal(state.selectedPartId, "concrete-column-body");
assert.equal(state.layers.concrete, true);
assert.equal(state.layers.stirrup, false);

const snapshotStep0 = structuredClone(state);

// İleri -> Adım 1 -> Adım 2 -> Geri -> Adım 1 -> Geri -> Adım 0
state = simulationViewReducer(state, {
  type: "NEXT_LEARNING_STEP",
  model: c1Model,
});
assert.equal(state.learning.stepIndex, 1);
assert.equal(state.selectedPartId, "longitudinal-bar-1-sw");

state = simulationViewReducer(state, {
  type: "NEXT_LEARNING_STEP",
  model: c1Model,
});
assert.equal(state.learning.stepIndex, 2);
assert.equal(state.selectedPartId, "stirrup-1-alt-sarilma-z50");

state = simulationViewReducer(state, {
  type: "PREV_LEARNING_STEP",
  model: c1Model,
});
assert.equal(state.learning.stepIndex, 1);
assert.equal(state.selectedPartId, "longitudinal-bar-1-sw");

state = simulationViewReducer(state, {
  type: "PREV_LEARNING_STEP",
  model: c1Model,
});
assert.deepEqual(state, snapshotStep0);

// 4. Patlatma (0–100) ve Kesit karşılıklı sıfırlama kuralları
state = simulationViewReducer(state, {
  type: "SET_EXPLODE_PERCENT",
  explodePercent: 70,
});
assert.equal(state.explodePercent, 70);
assert.equal(state.section.enabled, false);
// Patlatma gerçek model mm ölçülerini kesinlikle değiştirmez
assert.equal(c1Model.dimensionsMm.widthX, 300);
assert.equal(c1Model.dimensionsMm.totalHeightZ, 4280);

// Kesit açılırken patlatma otomatik 0'a sıfırlanır
state = simulationViewReducer(state, {
  type: "SET_SECTION_ENABLED",
  enabled: true,
});
assert.equal(state.section.enabled, true);
assert.equal(state.explodePercent, 0);

// Öğrenme oynatılırken çelişen serbest patlatma/kesit durur
state = simulationViewReducer(state, {
  type: "SET_EXPLODE_PERCENT",
  explodePercent: 45,
});
assert.equal(state.explodePercent, 45);
assert.equal(state.section.enabled, false);

state = simulationViewReducer(state, {
  type: "SET_LEARNING_PLAYING",
  isPlaying: true,
});
assert.equal(state.learning.isPlaying, true);
assert.equal(state.explodePercent, 0);
assert.equal(state.section.enabled, false);

// 5. Serbest moda dönüş ve Reset
state = simulationViewReducer(state, {
  type: "RETURN_TO_FREE_MODE",
});
assert.equal(state.learning.mode, "free");
assert.equal(state.learning.isPlaying, false);

state = simulationViewReducer(state, {
  type: "SET_LAYER_PROGRESS_T",
  progressT: 0,
  model: c1Model,
});
assert.equal(state.learning.layerProgressT, 0);
assert.equal(state.layers.concrete, false);
assert.equal(state.selectedPartId, null);

state = simulationViewReducer(state, {
  type: "SET_LAYER_PROGRESS_T",
  progressT: 1,
  model: crosstieModel,
});
assert.equal(state.learning.layerProgressT, 1);
assert.equal(state.layers.concrete, true);
assert.equal(state.layers.crosstie, true);

state = simulationViewReducer(state, { type: "RESET_VIEW" });
assert.equal(state.explodePercent, 0);
assert.equal(state.section.enabled, false);
assert.equal(state.learning.mode, "free");
assert.equal(state.learning.stepIndex, 0);
assert.equal(state.learning.layerProgressT, 1);

console.log("✅ Aşama 04 öğrenme adımları, ileri-geri tutarlılığı, t=0/1 ve patlatma/kesit kuralları geçti.");
