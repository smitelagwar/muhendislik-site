import assert from "node:assert/strict";
import {
  buildMatFoundationDetailModel,
  R1_MAT_FOUNDATION_SPEC,
} from "../../src/lib/simulations/scenes/foundation-mat";
import { computeFootingGridCoordinatesMm } from "../../src/lib/simulations/scenes/footing-pad";
import { evaluateColumnHorizontalSectionAtElevation } from "../../src/lib/simulations/core/section-geometry";
import { estimateSceneProfileGeometryMetrics } from "../../src/lib/simulations/engine/three-column-viewer";
import {
  createInitialSimulationViewState,
  getColumnLearningSteps,
  simulationViewReducer,
} from "../../src/lib/simulations/state/view-reducer";
import { getLiveSimulations } from "../../src/lib/simulations/catalog";
import { loadSimulationSceneModel } from "../../src/lib/simulations/scene-loaders";
import type { RebarPathPart } from "../../src/lib/simulations/core/types";

console.log("=== Simülasyon Kütüphanesi Aşama 09 Radye Temel (R1) ve 6 Sahne Katalog Testleri ===");

// 1. Altı sahnelik ilk kütüphanenin katalogda eksiksiz tamamlanmış olması
const liveCatalog = getLiveSimulations();
assert.equal(liveCatalog.length, 6);
assert.deepEqual(
  liveCatalog.map((item) => item.slug),
  [
    "kolon-detayi",
    "kiris-detayi",
    "kolon-kiris-birlesimi",
    "tekil-temel",
    "perde-detayi",
    "radye-temel",
  ],
);

for (const item of liveCatalog) {
  assert.ok(item.learningFocus.length >= 3, `${item.slug} kısa öğrenme özeti içermeli`);
  assert.ok(item.description.length > 30);
}

// 2. Tekil temeldeki `computeFootingGridCoordinatesMm` üreticisinin yeniden kullanımı (11×11 ızgara)
const matGridCoords = computeFootingGridCoordinatesMm(
  R1_MAT_FOUNDATION_SPEC.matWidthXMm,
  R1_MAT_FOUNDATION_SPEC.clearCoverSideMm,
  R1_MAT_FOUNDATION_SPEC.meshSpacingMm,
);
assert.equal(matGridCoords.length, 11);
assert.deepEqual(matGridCoords, [
  -1000, -800, -600, -400, -200, 0, 200, 400, 600, 800, 1000,
]);

// 3. R1 Radye Temel modelinin sayım, katman kotları ve sehpa/filiz doğrulaması
const matModel = buildMatFoundationDetailModel(R1_MAT_FOUNDATION_SPEC);
assert.equal(matModel.slug, "radye-temel");
assert.equal(matModel.presetId, "r1-radye-temel");
assert.equal(matModel.dimensionsMm.widthX, 2200);
assert.equal(matModel.dimensionsMm.depthY, 2200);
assert.equal(matModel.dimensionsMm.concreteHeightZ, 600);
assert.equal(matModel.dimensionsMm.totalHeightZ, 1350);

// Mantıksal donatı sayısı performans uğruna eksiltilmez:
// 3 beton hacmi (radye + kolon boynu + grobeton), 22 alt ızgara (11X + 11Y), 22 üst ızgara (11X + 11Y), 19 stirrup (9 sehpa + 9 etriye), 8 kolon filizi
assert.equal(matModel.counts.concreteParts, 3);
assert.equal(matModel.counts.longitudinalBars, 22);
assert.equal(matModel.counts.crossties, 22);
assert.equal(matModel.counts.stirrups, 18);
assert.equal(matModel.counts.dowels, 8);
assert.equal(matModel.counts.totalParts, 73);

// Benzersiz partId kontrolü
const partIds = matModel.parts.map((p) => p.id);
assert.equal(new Set(partIds).size, partIds.length);

// 4. Alt ve Üst iki yönlü ızgara katman kotlarının doğrulanması (Z=58, Z=74, Z=526, Z=542 mm)
const bottomX = matModel.parts.filter(
  (p): p is RebarPathPart => p.kind === "rebar" && p.id.startsWith("mat-bottom-x-"),
);
const bottomY = matModel.parts.filter(
  (p): p is RebarPathPart => p.kind === "rebar" && p.id.startsWith("mat-bottom-y-"),
);
const topY = matModel.parts.filter(
  (p): p is RebarPathPart => p.kind === "rebar" && p.id.startsWith("mat-top-y-"),
);
const topX = matModel.parts.filter(
  (p): p is RebarPathPart => p.kind === "rebar" && p.id.startsWith("mat-top-x-"),
);

assert.equal(bottomX.length, 11);
assert.equal(bottomY.length, 11);
assert.equal(topY.length, 11);
assert.equal(topX.length, 11);

assert.ok(bottomX.every((b) => b.elevationZMm === 58 && b.layerId === "longitudinal"));
assert.ok(bottomY.every((b) => b.elevationZMm === 74 && b.layerId === "longitudinal"));
assert.ok(topY.every((b) => b.elevationZMm === 526 && b.layerId === "crosstie"));
assert.ok(topX.every((b) => b.elevationZMm === 542 && b.layerId === "crosstie"));

// 5. Sehpa (chair) donatılarının alt ızgara üstü (Z=89 mm) ile üst ızgara altı (Z=511 mm) arasında uzanması
const chairs = matModel.parts.filter(
  (p): p is RebarPathPart => p.kind === "rebar" && p.id.startsWith("mat-chair-"),
);
assert.equal(chairs.length, 9);
for (const ch of chairs) {
  const footSeg = ch.segments[0];
  const topDeckSeg = ch.segments[4];
  assert.ok(footSeg && footSeg.kind === "line" && footSeg.start.z === 89);
  assert.ok(topDeckSeg && topDeckSeg.kind === "line" && topDeckSeg.start.z === 511);
}

// 6. Hafif profil geometrisi ve bütçe kontrolü (mantıksal parça sayısı eksiltilmeden üçgen sayısı azalır ve <= 150.000 bütçesinde kalır)
const balancedMetrics = estimateSceneProfileGeometryMetrics(matModel, "balanced");
const lightMetrics = estimateSceneProfileGeometryMetrics(matModel, "light");

assert.equal(lightMetrics.logicalPartCount, balancedMetrics.logicalPartCount);
assert.equal(lightMetrics.logicalPartCount, 73);
assert.ok(lightMetrics.withinPartBudget);
assert.ok(lightMetrics.withinTriangleBudget);
assert.ok(lightMetrics.estimatedTriangles < balancedMetrics.estimatedTriangles);
assert.ok(lightMetrics.estimatedTriangles <= 150_000);

// 7. Yatay kesit analizi: Z=58 mm (Alt X), Z=74 mm (Alt Y), Z=526 mm (Üst Y), Z=542 mm (Üst X)
const cut58 = evaluateColumnHorizontalSectionAtElevation(matModel, 58);
assert.equal(cut58.intersectedLongitudinalParts.length, 11);
assert.equal(cut58.intersectedCrosstieParts.length, 0);

const cut74 = evaluateColumnHorizontalSectionAtElevation(matModel, 74);
assert.equal(cut74.intersectedLongitudinalParts.length, 11);

const cut526 = evaluateColumnHorizontalSectionAtElevation(matModel, 526);
assert.equal(cut526.intersectedCrosstieParts.length, 11);

const cut542 = evaluateColumnHorizontalSectionAtElevation(matModel, 542);
assert.equal(cut542.intersectedCrosstieParts.length, 11);

// 8. 5 öğrenme adımı ve 6 sahne loader doğrulaması
const matSteps = getColumnLearningSteps("r1-radye-temel");
assert.equal(matSteps.length, 5);

let state = createInitialSimulationViewState("r1-radye-temel");
assert.equal(state.section.elevationZMm, 340);
state = simulationViewReducer(state, {
  type: "SET_LEARNING_STEP",
  stepIndex: 3,
  model: matModel,
});
assert.equal(state.selectedPartId, "mat-chair-5-x0-y0");

async function verifyAllSixSceneLoaders() {
  for (const item of liveCatalog) {
    const loaded = await loadSimulationSceneModel(item.slug);
    assert.equal(loaded.slug, item.slug);
    assert.ok(loaded.parts.length > 0);
  }
  console.log("✅ Aşama 09 Radye temel ızgara/kot/sehpa/Hafif profil ve 6 sahne loader testleri geçti.");
}

verifyAllSixSceneLoaders().catch((err) => {
  console.error(err);
  process.exit(1);
});
