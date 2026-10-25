import assert from "node:assert/strict";
import {
  buildExteriorJointDetailModel,
  D1_EXTERIOR_JOINT_SPEC,
} from "../../src/lib/simulations/scenes/joint-exterior";
import { evaluateColumnHorizontalSectionAtElevation } from "../../src/lib/simulations/core/section-geometry";
import {
  createInitialSimulationViewState,
  getColumnLearningSteps,
  simulationViewReducer,
} from "../../src/lib/simulations/state/view-reducer";
import { getLiveSimulations } from "../../src/lib/simulations/catalog";
import type { RebarPathPart } from "../../src/lib/simulations/core/types";

console.log("=== Simülasyon Kütüphanesi Aşama 06 Dış Birleşim (D1) Model Testleri ===");

// 1. Katalogda 3 sahnenin (kolon, kiriş, kolon-kiriş dış birleşimi) açık olması
const liveCatalog = getLiveSimulations();
assert.ok(liveCatalog.length >= 3);
assert.ok(liveCatalog.some((item) => item.slug === "kolon-kiris-birlesimi"));

// 2. D1 Dış Birleşim modelinin sayım ve geometri doğrulamaları
const jointModel = buildExteriorJointDetailModel(D1_EXTERIOR_JOINT_SPEC);
assert.equal(jointModel.slug, "kolon-kiris-birlesimi");
assert.equal(jointModel.presetId, "d1-dis-birlesim");
assert.equal(jointModel.primaryAxis, "z");
assert.equal(jointModel.dimensionsMm.widthX, 400);
assert.equal(jointModel.dimensionsMm.depthY, 400);
assert.equal(jointModel.dimensionsMm.concreteHeightZ, 3000);
assert.equal(jointModel.dimensionsMm.dowelLengthZ, 600);
assert.equal(jointModel.dimensionsMm.totalHeightZ, 3600);

// 2 beton hacmi (kolon + kiriş), 8Ø20 kolon boyuna, 6Ø16 kiriş ankrajlı boyuna, 29 kolon etriyesi (12+5+12), 12 kiriş etriyesi
assert.equal(jointModel.counts.concreteParts, 2);
assert.equal(jointModel.counts.longitudinalBars, 8);
assert.equal(jointModel.counts.dowels, 6);
assert.equal(jointModel.counts.stirrups, 29);
assert.equal(jointModel.counts.crossties, 12);

// 3. Sahne düzeyinde tüm partId değerleri tekil (benzersiz) olmalı
const partIds = jointModel.parts.map((part) => part.id);
const uniquePartIds = new Set(partIds);
assert.equal(
  uniquePartIds.size,
  partIds.length,
  "Dış birleşim sahnesindeki tüm partId kimlikleri benzersiz olmalıdır.",
);

// 4. Düğüm çekirdeği (Z = 1250..1750 mm) içinde 5 adet sürekli kolon etriyesi yer almalı
const jointCoreStirrups = jointModel.parts.filter(
  (p): p is RebarPathPart =>
    p.kind === "rebar" &&
    p.category === "stirrup" &&
    p.zoneId === "birlesim-cekirdegi",
);
assert.equal(jointCoreStirrups.length, 5);
assert.deepEqual(
  jointCoreStirrups.map((s) => s.elevationZMm),
  [1300, 1400, 1500, 1600, 1700],
);

// 5. Kiriş boyuna donatılarının 90° ankraj yayları ve düşey kolları kolon çekirdeği içinde kalmalı
// ve kolon boyuna donatılarıyla kasıtsız çakışmamalı
const columnLongitudinalBars = jointModel.parts.filter(
  (p): p is RebarPathPart => p.kind === "rebar" && p.category === "longitudinal",
);
const beamAnchoredBars = jointModel.parts.filter(
  (p): p is RebarPathPart => p.kind === "rebar" && p.category === "dowel",
);

const colXYPositions = columnLongitudinalBars.map((bar) => {
  const seg = bar.segments[0];
  assert.ok(seg && seg.kind === "line");
  return { id: bar.id, x: seg.start.x, y: seg.start.y, r: bar.diameterMm / 2 };
});

for (const beamBar of beamAnchoredBars) {
  assert.equal(beamBar.hookAngleDeg, 90);
  const arcSeg = beamBar.segments.find((s) => s.kind === "arc");
  const hookSeg = beamBar.segments.find(
    (s) => s.kind === "line" && s.role === "hook",
  );
  assert.ok(arcSeg && arcSeg.kind === "arc", `${beamBar.id} 90° büküm yayı içermeli`);
  assert.ok(hookSeg && hookSeg.kind === "line", `${beamBar.id} düşey ankraj kolu içermeli`);

  // Ankraj düşey kolu kolon çekirdeği sınırları (X in [-165, +165], Z in [1250, 1750]) içinde kalmalı
  assert.ok(hookSeg.start.x >= -155 && hookSeg.start.x <= 155);
  assert.ok(hookSeg.start.z >= 1270 && hookSeg.start.z <= 1730);
  assert.ok(hookSeg.end.z >= 1270 && hookSeg.end.z <= 1730);

  // Kiriş çubuğu Y düzlemi ile kolon düşey çubuklarının Y düzlemi arasında net temiz açıklık bulunmalı
  const beamY = hookSeg.start.y;
  const beamR = beamBar.diameterMm / 2;
  for (const colBar of colXYPositions) {
    // Eğer kolon çubuğu kirişin geçtiği X aralığındaysa (X >= -135), Y mesafesi > r_col + r_beam olmalı
    if (colBar.x >= -135) {
      const dy = Math.abs(colBar.y - beamY);
      assert.ok(
        dy > colBar.r + beamR + 10,
        `Kiriş çubuğu (${beamBar.id}, Y=${beamY}) ile kolon çubuğu (${colBar.id}, Y=${colBar.y}) çakışmamalı`,
      );
    }
  }
}

// 6. Düğüm çekirdeği yatay kesit analizi (Z = 1500 mm vs Z = 1450 mm)
const cutAt1500 = evaluateColumnHorizontalSectionAtElevation(jointModel, 1500);
assert.equal(cutAt1500.intersectedStirrupParts.length, 1);
assert.equal(
  cutAt1500.intersectedStirrupParts[0].id,
  "joint-col-stirrup-15-birlesim-cekirdegi-z1500",
);
assert.equal(cutAt1500.intersectedLongitudinalParts.length, 8);
assert.equal(cutAt1500.intersectedDowelParts.length, 6);

const cutAt1450 = evaluateColumnHorizontalSectionAtElevation(jointModel, 1450);
assert.equal(cutAt1450.intersectedStirrupParts.length, 0);
assert.equal(cutAt1450.intersectedLongitudinalParts.length, 8);
assert.equal(cutAt1450.intersectedDowelParts.length, 6);

// 7. Dış birleşim öğrenme adımları ve katman izolasyonu (kolon etriyeleri vs kiriş donatıları)
const jointSteps = getColumnLearningSteps("d1-dis-birlesim");
assert.equal(jointSteps.length, 5);

let state = createInitialSimulationViewState("d1-dis-birlesim");
assert.equal(state.section.elevationZMm, 1500);

// Kolon etriyeleri (stirrup) ve kiriş donatıları (dowel) bağımsız açılıp kapatılabilmeli
state = simulationViewReducer(state, {
  type: "SET_LAYER",
  layerId: "dowel",
  visible: false,
  model: jointModel,
});
assert.equal(state.layers.dowel, false);
assert.equal(state.layers.stirrup, true);

state = simulationViewReducer(state, {
  type: "SET_LAYER",
  layerId: "dowel",
  visible: true,
  model: jointModel,
});
state = simulationViewReducer(state, {
  type: "SET_LAYER",
  layerId: "stirrup",
  visible: false,
  model: jointModel,
});
assert.equal(state.layers.dowel, true);
assert.equal(state.layers.stirrup, false);

console.log("✅ Aşama 06 D1 kolon–kiriş dış birleşimi tekillik, çakışmasızlık, kesit ve izolasyon testleri geçti.");
