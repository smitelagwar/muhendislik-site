import assert from "node:assert/strict";
import {
  buildBeamDetailModel,
  computeBeamStirrupPositionsXMm,
  K1_BEAM_SPEC,
} from "../../src/lib/simulations/scenes/beam-k1";
import { evaluateColumnHorizontalSectionAtElevation } from "../../src/lib/simulations/core/section-geometry";
import {
  createInitialSimulationViewState,
  getColumnLearningSteps,
  simulationViewReducer,
} from "../../src/lib/simulations/state/view-reducer";
import { getLiveSimulations } from "../../src/lib/simulations/catalog";

console.log("=== Simülasyon Kütüphanesi Aşama 05 Kiriş Model ve Koordinat Testleri ===");

// 1. Katalogda kolon ve kiriş sahnelerinin açık olması
const liveCatalog = getLiveSimulations();
assert.ok(liveCatalog.length >= 2);
assert.equal(liveCatalog[0].slug, "kolon-detayi");
assert.equal(liveCatalog[1].slug, "kiris-detayi");

// 2. K1 Kiriş modelinin sayım ve geometri doğrulamaları
const beamModel = buildBeamDetailModel(K1_BEAM_SPEC);
assert.equal(beamModel.slug, "kiris-detayi");
assert.equal(beamModel.presetId, "k1-referans");
assert.equal(beamModel.primaryAxis, "x");
assert.equal(beamModel.dimensionsMm.widthX, 300);
assert.equal(beamModel.dimensionsMm.depthY, 500);
assert.equal(beamModel.dimensionsMm.concreteHeightZ, 4000);
assert.equal(beamModel.dimensionsMm.clearCover, 30);

// 3 beton hacmi (kiriş gövdesi + sol/sağ uç mesnet), 5 sürekli boyuna çubuk (3Ø16 alt + 2Ø14 üst), 2 mesnet üst ilavesi, 33 etriye
assert.equal(beamModel.counts.concreteParts, 3);
assert.equal(beamModel.counts.longitudinalBars, 5);
assert.equal(beamModel.counts.dowels, 2);
assert.equal(beamModel.counts.stirrups, 33);
assert.equal(beamModel.counts.crossties, 0);

// 3. Mesnet sarılma ve orta açıklık etriye koordinatları
const leftZoneX = computeBeamStirrupPositionsXMm(0, 1000, 100);
const midZoneX = computeBeamStirrupPositionsXMm(1000, 3000, 150);
const rightZoneX = computeBeamStirrupPositionsXMm(3000, 4000, 100);
assert.equal(leftZoneX.length, 10);
assert.equal(midZoneX.length, 13);
assert.equal(rightZoneX.length, 10);
assert.equal(leftZoneX[0], 50);
assert.equal(leftZoneX[9], 950);
assert.equal(midZoneX[0], 1100);
assert.equal(midZoneX[12], 2900);
assert.equal(rightZoneX[0], 3050);
assert.equal(rightZoneX[9], 3950);

// 4. Her kiriş etriyesinde köşe bükümü (arc) ve 135° deprem kancası bulunmalı; boyuna donatılarda 90° mesnet ankraj yayı bulunmalı
const stirrup1 = beamModel.parts.find(
  (p) => p.id === "beam-stirrup-1-sol-mesnet-sarilma-x50",
);
assert.ok(stirrup1 && stirrup1.kind === "rebar");
assert.equal(stirrup1.hookAngleDeg, 135);
assert.ok(stirrup1.segments.some((s) => s.kind === "arc"));

const bottomBar1 = beamModel.parts.find((p) => p.id === "beam-bottom-bar-1");
assert.ok(bottomBar1 && bottomBar1.kind === "rebar");
assert.equal(bottomBar1.hookAngleDeg, 90);
assert.ok(bottomBar1.segments.some((s) => s.kind === "arc"));

// 5. "Çekme her zaman alttadır" genellemesi yapılmadığının metinsel doğrulaması
const assumptionText = beamModel.assumptions.map((a) => a.description).join(" ");
assert.ok(
  assumptionText.includes("her kirişte veya konsolda daima alttadır genellemesi yapılmaz"),
);

// 6. Kiriş düşey kesit (X) değerlendirmesi:
// X=250 mm (sol mesnet etriyesi üstünde): 1 etriye + 5 boyuna + 1 sol mesnet üst ilavesi kesilir
const cutAt250 = evaluateColumnHorizontalSectionAtElevation(beamModel, 250);
assert.equal(cutAt250.intersectedStirrupParts.length, 1);
assert.equal(cutAt250.intersectedLongitudinalParts.length, 5);
assert.equal(cutAt250.intersectedDowelParts.length, 1);

// X=300 mm (sol mesnet iki etriye arası boşluk): 0 etriye + 5 boyuna + 1 sol mesnet üst ilavesi
const cutAt300 = evaluateColumnHorizontalSectionAtElevation(beamModel, 300);
assert.equal(cutAt300.intersectedStirrupParts.length, 0);
assert.equal(cutAt300.intersectedLongitudinalParts.length, 5);
assert.equal(cutAt300.intersectedDowelParts.length, 1);

// X=1950 mm (orta açıklık boşluğu): 0 etriye + 5 boyuna + 0 mesnet ilavesi (ilaveler X=1100 mm'de biter)
const cutAt1950 = evaluateColumnHorizontalSectionAtElevation(beamModel, 1950);
assert.equal(cutAt1950.intersectedStirrupParts.length, 0);
assert.equal(cutAt1950.intersectedLongitudinalParts.length, 5);
assert.equal(cutAt1950.intersectedDowelParts.length, 0);

// 7. Kiriş 5 öğrenme adımı ve reducer ileri-geri tutarlılığı
const beamSteps = getColumnLearningSteps("k1-referans");
assert.equal(beamSteps.length, 5);

let state = createInitialSimulationViewState("k1-referans");
state = simulationViewReducer(state, {
  type: "SET_LEARNING_STEP",
  stepIndex: 0,
  model: beamModel,
});
assert.equal(state.selectedPartId, "concrete-beam-body");

state = simulationViewReducer(state, {
  type: "NEXT_LEARNING_STEP",
  model: beamModel,
});
assert.equal(state.selectedPartId, "beam-bottom-bar-1");

state = simulationViewReducer(state, {
  type: "NEXT_LEARNING_STEP",
  model: beamModel,
});
assert.equal(state.selectedPartId, "beam-support-extra-left");

console.log("✅ Aşama 05 K1 kiriş sayım, koordinat, kesit (X) ve öğrenme adımı testleri geçti.");
