import assert from "node:assert/strict";
import {
  buildShearWallDetailModel,
  P1_SHEAR_WALL_SPEC,
} from "../../src/lib/simulations/scenes/wall-p1";
import { evaluateColumnHorizontalSectionAtElevation } from "../../src/lib/simulations/core/section-geometry";
import {
  createInitialSimulationViewState,
  getColumnLearningSteps,
  simulationViewReducer,
} from "../../src/lib/simulations/state/view-reducer";
import { getLiveSimulations } from "../../src/lib/simulations/catalog";
import type { RebarPathPart } from "../../src/lib/simulations/core/types";

console.log("=== Simülasyon Kütüphanesi Aşama 08 Perde Duvar (P1) Model Testleri ===");

// 1. Katalogda 5 sahnenin açık olması
const liveCatalog = getLiveSimulations();
assert.ok(liveCatalog.length >= 5);
assert.ok(liveCatalog.some((item) => item.slug === "perde-detayi"));

// 2. P1 Perde Duvar modelinin sayım ve geometri doğrulamaları
const wallModel = buildShearWallDetailModel(P1_SHEAR_WALL_SPEC);
assert.equal(wallModel.slug, "perde-detayi");
assert.equal(wallModel.presetId, "p1-perde");
assert.equal(wallModel.dimensionsMm.widthX, 2400);
assert.equal(wallModel.dimensionsMm.depthY, 300);
assert.equal(wallModel.dimensionsMm.concreteHeightZ, 3000);
assert.equal(wallModel.dimensionsMm.dowelLengthZ, 600);
assert.equal(wallModel.dimensionsMm.totalHeightZ, 3600);

// 1 beton hacmi, 30 gövde çubuğu (10 düşey + 20 yatay), 12 uç bölge boyuna (6+6), 28 uç etriyesi (14+14), 20 bağlayıcı çiroz
assert.equal(wallModel.counts.concreteParts, 1);
assert.equal(wallModel.counts.longitudinalBars, 30);
assert.equal(wallModel.counts.dowels, 12);
assert.equal(wallModel.counts.stirrups, 28);
assert.equal(wallModel.counts.crossties, 20);

// 3. Sahnedeki tüm partId değerleri tekil (benzersiz) olmalı
const partIds = wallModel.parts.map((p) => p.id);
assert.equal(new Set(partIds).size, partIds.length);

// 4. Ön ve arka iki yüz donatı konumlarının (Y < 0 vs Y > 0) doğrulanması: tek sıra donatı izlenimi yok
const frontWebVerts = wallModel.parts.filter(
  (p): p is RebarPathPart =>
    p.kind === "rebar" && p.id.startsWith("wall-web-vert-") && p.id.includes("-front-"),
);
const backWebVerts = wallModel.parts.filter(
  (p): p is RebarPathPart =>
    p.kind === "rebar" && p.id.startsWith("wall-web-vert-") && p.id.includes("-back-"),
);
assert.equal(frontWebVerts.length, 5);
assert.equal(backWebVerts.length, 5);

for (const fv of frontWebVerts) {
  const seg = fv.segments[0];
  assert.ok(seg && seg.kind === "line" && seg.start.y === -102);
}
for (const bv of backWebVerts) {
  const seg = bv.segments[0];
  assert.ok(seg && seg.kind === "line" && seg.start.y === 102);
}

// 5. Sol ve sağ uç bölgeleri ile yüzler arası bağlayıcı çirozların kimlikleri ve konumları
const crossties = wallModel.parts.filter(
  (p): p is RebarPathPart => p.kind === "rebar" && p.category === "crosstie",
);
assert.equal(crossties.length, 20);
for (const ct of crossties) {
  assert.ok(ct.id.startsWith("wall-crosstie-"));
  const legSeg = ct.segments.find((s) => s.kind === "line" && s.role === "leg");
  assert.ok(legSeg && legSeg.kind === "line");
  // Bağlayıcı çiroz ön yüz (Y < -90) ile arka yüz (Y > +90) arasında kalınlık boyunca uzanmalı
  assert.ok(legSeg.start.y < -90 && legSeg.end.y > 90);
}

// 6. "Bütün perdelerin bu ölçüyle yapılacağı" izleniminin verilmediğinin metinsel doğrulaması
const assumptionTexts = wallModel.assumptions.map((a) => a.description).join(" ");
assert.ok(
  assumptionTexts.includes(
    "Bütün betonarme perdelerin bu ölçü, uç bölgesi uzunluğu veya donatı oranıyla yapılacağı izlenimi çıkarılmamalıdır",
  ),
);

// 7. Yatay kesit analizi: Z=1500 mm (2 uç etriyesi + 4 çiroz + 10 gövde düşey + 12 uç boyuna kesilir)
const cutAt1500 = evaluateColumnHorizontalSectionAtElevation(wallModel, 1500);
assert.equal(cutAt1500.intersectedStirrupParts.length, 2);
assert.equal(cutAt1500.intersectedCrosstieParts.length, 4);
assert.equal(cutAt1500.intersectedLongitudinalParts.length, 10);
assert.equal(cutAt1500.intersectedDowelParts.length, 12);

// Z=650 mm (etriye arası boşluk: 0 uç etriyesi, 0 çiroz, 10 gövde düşey + 12 uç boyuna kesilir)
const cutAt650 = evaluateColumnHorizontalSectionAtElevation(wallModel, 650);
assert.equal(cutAt650.intersectedStirrupParts.length, 0);
assert.equal(cutAt650.intersectedCrosstieParts.length, 0);
assert.equal(cutAt650.intersectedLongitudinalParts.length, 10);
assert.equal(cutAt650.intersectedDowelParts.length, 12);

// 8. 5 öğrenme adımı ve reducer doğrulaması
const wallSteps = getColumnLearningSteps("p1-perde");
assert.equal(wallSteps.length, 5);

let state = createInitialSimulationViewState("p1-perde");
assert.equal(state.section.elevationZMm, 1500);
state = simulationViewReducer(state, {
  type: "SET_LEARNING_STEP",
  stepIndex: 1,
  model: wallModel,
});
assert.equal(state.selectedPartId, "wall-web-vert-1-front-x-500");

console.log("✅ Aşama 08 P1 perde duvar iki yüz konumları, uç bölgeler, bağlayıcı çirozlar ve kesit testleri geçti.");
