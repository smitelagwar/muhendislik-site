import assert from "node:assert/strict";
import {
  buildPadFootingDetailModel,
  computeFootingGridCoordinatesMm,
  T1_PAD_FOOTING_SPEC,
} from "../../src/lib/simulations/scenes/footing-pad";
import { evaluateColumnHorizontalSectionAtElevation } from "../../src/lib/simulations/core/section-geometry";
import {
  createInitialSimulationViewState,
  getColumnLearningSteps,
  simulationViewReducer,
} from "../../src/lib/simulations/state/view-reducer";
import { getLiveSimulations } from "../../src/lib/simulations/catalog";
import type {
  ConcreteVolumePart,
  RebarPathPart,
} from "../../src/lib/simulations/core/types";

console.log("=== Simülasyon Kütüphanesi Aşama 07 Tekil Temel (T1) Model Testleri ===");

// 1. Katalogda 4 sahnenin açık olması
const liveCatalog = getLiveSimulations();
assert.ok(liveCatalog.length >= 4);
assert.ok(liveCatalog.some((item) => item.slug === "tekil-temel"));

// 2. Izgara koordinat üreticisi: 1800 mm genişlik, 50 mm yan paspayı, 200 mm aralık -> 9 çubuk (-800..+800 mm)
const gridCoords = computeFootingGridCoordinatesMm(1800, 50, 200);
assert.equal(gridCoords.length, 9);
assert.deepEqual(gridCoords, [-800, -600, -400, -200, 0, 200, 400, 600, 800]);

// 3. T1 Tekil Temel modeli ve iki doğrultunun gerçek Z kot farkı (Alt X: 58 mm, Alt Y: 74 mm -> ΔZ = 16 mm)
const footingModel = buildPadFootingDetailModel(T1_PAD_FOOTING_SPEC);
assert.equal(footingModel.slug, "tekil-temel");
assert.equal(footingModel.presetId, "t1-tekil-temel");
assert.equal(footingModel.dimensionsMm.widthX, 1800);
assert.equal(footingModel.dimensionsMm.depthY, 1800);
assert.equal(footingModel.dimensionsMm.clearCover, 50);

// 7 beton hacmi (temel + kolon boynu + grobeton + 4 paspayı takozu), 9 Alt X, 9 Alt Y, 8 L-filiz, 9 etriye
assert.equal(footingModel.counts.concreteParts, 7);
assert.equal(footingModel.counts.longitudinalBars, 9);
assert.equal(footingModel.counts.crossties, 9);
assert.equal(footingModel.counts.dowels, 8);
assert.equal(footingModel.counts.stirrups, 9);

const meshXParts = footingModel.parts.filter(
  (p): p is RebarPathPart => p.kind === "rebar" && p.category === "longitudinal",
);
const meshYParts = footingModel.parts.filter(
  (p): p is RebarPathPart => p.kind === "rebar" && p.category === "crosstie",
);
assert.equal(meshXParts.length, 9);
assert.equal(meshYParts.length, 9);

const zMeshX = meshXParts[0].elevationZMm ?? 0;
const zMeshY = meshYParts[0].elevationZMm ?? 0;
assert.equal(zMeshX, 58);
assert.equal(zMeshY, 74);
assert.equal(
  zMeshY - zMeshX,
  T1_PAD_FOOTING_SPEC.meshBarDiameterMm,
  "Alt X ve Alt Y ızgara katmanları arasında tam 1 çubuk çapı (16 mm) gerçek yükseklik farkı olmalıdır.",
);

// 4. Filiz bükümü düz çizgiyle sahte temsil edilmemeli; her filizde gerçek 90° yay (arc) + yatay ayak (hook) bulunmalı
// ve filiz ayakları temel beton sınırları (X, Y in [-850, +850], Z >= 50) içinde kalmalı
const dowelParts = footingModel.parts.filter(
  (p): p is RebarPathPart => p.kind === "rebar" && p.category === "dowel",
);
assert.equal(dowelParts.length, 8);

for (const dowel of dowelParts) {
  assert.equal(dowel.hookAngleDeg, 90);
  const arcSeg = dowel.segments.find((s) => s.kind === "arc");
  const footSeg = dowel.segments.find(
    (s) => s.kind === "line" && s.role === "hook",
  );
  const vertSeg = dowel.segments.find(
    (s) => s.kind === "line" && s.role === "leg",
  );
  assert.ok(arcSeg && arcSeg.kind === "arc", `${dowel.id} gerçek 90° büküm yayı (arc) içermeli`);
  assert.ok(footSeg && footSeg.kind === "line", `${dowel.id} yatay filiz ayağı içermeli`);
  assert.ok(vertSeg && vertSeg.kind === "line", `${dowel.id} düşey filiz gövdesi içermeli`);

  // Yatay filiz ayağı Z = 92 mm kotunda (alt Y ızgarasının üstünde) ve temel beton sınırları içinde olmalı
  assert.equal(footSeg.start.z, 92);
  assert.ok(Math.abs(footSeg.start.x) <= 850 && Math.abs(footSeg.end.x) <= 850);
  assert.ok(Math.abs(footSeg.start.y) <= 850 && Math.abs(footSeg.end.y) <= 850);
}

// 5. Grobeton ve paspayı takozlarının varlığı ve sınırları
const leanPart = footingModel.parts.find(
  (p): p is ConcreteVolumePart =>
    p.kind === "concrete" && p.id === "concrete-lean-layer",
);
assert.ok(leanPart);
assert.equal(leanPart.centerMm.z, -50);
assert.equal(leanPart.sizeMm.heightZ, 100);

const spacers = footingModel.parts.filter(
  (p): p is ConcreteVolumePart =>
    p.kind === "concrete" && p.id.startsWith("concrete-spacer-"),
);
assert.equal(spacers.length, 4);
for (const sp of spacers) {
  assert.equal(sp.sizeMm.heightZ, 50);
}

// 6. Kesit analizi: Z=58 mm (Alt X kesilir, Alt Y kesilmez) vs Z=74 mm (Alt Y kesilir, Alt X kesilmez)
const cutAt58 = evaluateColumnHorizontalSectionAtElevation(footingModel, 58);
assert.equal(cutAt58.intersectedLongitudinalParts.length, 9);
assert.equal(cutAt58.intersectedCrosstieParts.length, 0);

const cutAt74 = evaluateColumnHorizontalSectionAtElevation(footingModel, 74);
assert.equal(cutAt74.intersectedLongitudinalParts.length, 0);
assert.equal(cutAt74.intersectedCrosstieParts.length, 9);

// 7. 5 öğrenme adımı ve katman izolasyonu
const footingSteps = getColumnLearningSteps("t1-tekil-temel");
assert.equal(footingSteps.length, 5);

let state = createInitialSimulationViewState("t1-tekil-temel");
assert.equal(state.section.elevationZMm, 310);
state = simulationViewReducer(state, {
  type: "SET_LEARNING_STEP",
  stepIndex: 2,
  model: footingModel,
});
assert.equal(state.selectedPartId, "footing-mesh-y-5");

console.log("✅ Aşama 07 T1 tekil temel ızgara kot farkı, L-filiz yay bükümü, grobeton/takoz ve kesit testleri geçti.");
