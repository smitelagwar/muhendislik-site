import assert from "node:assert/strict";
import {
  buildColumnDetailModel,
  getDefaultColumnExperimentInput,
  validateAndBuildCustomColumnSpec,
} from "../../src/lib/simulations/scenes/column-c1";
import { buildBeamDetailModel } from "../../src/lib/simulations/scenes/beam-k1";
import {
  computeNormalizedSectionPosition,
  decodeLayerMaskBitstring,
  encodeLayerMaskBitstring,
  encodeSimulationShareUrl,
  MAX_SIMULATION_URL_LENGTH,
  parseAndApplySimulationUrlState,
  resolveElevationFromNormalizedPosition,
} from "../../src/lib/simulations/state/url-state";
import { createInitialSimulationViewState } from "../../src/lib/simulations/state/view-reducer";

console.log("=== Simülasyon Kütüphanesi Aşama 10 Kontrollü Parametre ve URL Durumu Testleri ===");

// 1. Geçerli özel kolon parametrelerinden 3B/2B uyumlu DetailModel üretimi
const validResult = validateAndBuildCustomColumnSpec({
  presetId: "c1-referans",
  sectionWidthMm: 450,
  sectionDepthMm: 350,
  longitudinalDiameterMm: 24,
  confinementSpacingMm: 100,
  middleSpacingMm: 150,
});
assert.equal(validResult.valid, true);
assert.equal(validResult.reason, null);
assert.ok(validResult.spec);

const customColModel = buildColumnDetailModel(validResult.spec);
assert.equal(customColModel.dimensionsMm.widthX, 450);
assert.equal(customColModel.dimensionsMm.depthY, 350);
assert.equal(customColModel.counts.longitudinalBars, 4);
assert.ok(customColModel.counts.stirrups > 20);
console.log("[PASS] Geçerli özel kolon parametrelerinden (450x350 mm, 4Ø24) DetailModel üretildi.");

// 2. Minimum etriye aralığı (75 mm) ve 8 çubuklu önayarda geometri bütçesinin aşılmaması
const minSpacingResult = validateAndBuildCustomColumnSpec({
  presetId: "c1-cirozlu-ogretim",
  sectionWidthMm: 450,
  sectionDepthMm: 450,
  longitudinalDiameterMm: 22,
  confinementSpacingMm: 75,
  middleSpacingMm: 75,
});
assert.equal(minSpacingResult.valid, true);
assert.ok(minSpacingResult.spec);
const denseColModel = buildColumnDetailModel(minSpacingResult.spec);
assert.ok(denseColModel.parts.length <= 400);
assert.equal(denseColModel.counts.longitudinalBars, 8);
assert.ok(denseColModel.counts.crossties > 0);
console.log("[PASS] Minimum etriye aralığı (75 mm) ile 8Ø22 + çirozlu kolon geometri bütçesi içinde kaldı.");

// 3. Geçersiz kesit boyutu, sarılma > orta bölge ve çubuk sıkışıklığı doğrulamaları
const tooNarrow = validateAndBuildCustomColumnSpec({
  presetId: "c1-referans",
  sectionWidthMm: 180,
  sectionDepthMm: 300,
  longitudinalDiameterMm: 20,
  confinementSpacingMm: 100,
  middleSpacingMm: 150,
});
assert.equal(tooNarrow.valid, false);
assert.ok(tooNarrow.reason?.includes("250–600 mm"));

const invalidConfinement = validateAndBuildCustomColumnSpec({
  presetId: "c1-referans",
  sectionWidthMm: 350,
  sectionDepthMm: 350,
  longitudinalDiameterMm: 20,
  confinementSpacingMm: 180,
  middleSpacingMm: 120,
});
assert.equal(invalidConfinement.valid, false);
assert.ok(invalidConfinement.reason?.includes("sarılma bölgesi etriye aralığı"));

const overcrowded = validateAndBuildCustomColumnSpec({
  presetId: "c1-cirozlu-ogretim",
  sectionWidthMm: 250,
  sectionDepthMm: 250,
  longitudinalDiameterMm: 32,
  confinementSpacingMm: 100,
  middleSpacingMm: 150,
});
assert.equal(overcrowded.valid, false);
assert.ok(overcrowded.reason?.includes("net temiz açıklık"));
console.log("[PASS] Geçersiz kolon parametreleri anlaşılır doğrulama mesajıyla reddedildi.");

// 4. URL durumu encode -> decode round-trip (parse -> validate -> model -> view sırası)
const initialModel = buildColumnDetailModel();
const roundTripValidation = validateAndBuildCustomColumnSpec({
  presetId: "c1-cirozlu-ogretim",
  sectionWidthMm: 480,
  sectionDepthMm: 420,
  longitudinalDiameterMm: 22,
  confinementSpacingMm: 90,
  middleSpacingMm: 140,
});
assert.ok(roundTripValidation.spec);
const roundTripModel = buildColumnDetailModel(roundTripValidation.spec);

const customView = createInitialSimulationViewState("c1-cirozlu-ogretim");
customView.cameraPreset = "top";
customView.viewTab = "2d";
customView.layers.concrete = false;
customView.section.enabled = true;
customView.section.elevationZMm = 900;
customView.selectedPartId = "longitudinal-bar-1-sw";
customView.learning = {
  mode: "guided",
  stepIndex: 2,
  isPlaying: false,
  layerProgressT: 1,
};

const shareUrl = encodeSimulationShareUrl({
  slug: "kolon-detayi",
  viewState: customView,
  model: roundTripModel,
  columnParams: roundTripValidation.normalizedParams,
  origin: "https://muhendismimar.com",
});
assert.ok(shareUrl.length <= MAX_SIMULATION_URL_LENGTH);
assert.ok(shareUrl.includes("v=1"));
assert.ok(shareUrl.includes("cw=480"));
assert.ok(shareUrl.includes("cd=420"));
assert.ok(shareUrl.includes("cb=22"));

const decoded = parseAndApplySimulationUrlState({
  slug: "kolon-detayi",
  searchOrUrl: shareUrl,
  initialModel,
});
assert.equal(decoded.fellBackToDefault, false);
assert.equal(decoded.reason, null);
assert.equal(decoded.model.dimensionsMm.widthX, 480);
assert.equal(decoded.model.dimensionsMm.depthY, 420);
assert.equal(decoded.columnParams.longitudinalDiameterMm, 22);
assert.equal(decoded.viewState.presetId, "c1-cirozlu-ogretim");
assert.equal(decoded.viewState.cameraPreset, "top");
assert.equal(decoded.viewState.viewTab, "2d");
assert.equal(decoded.viewState.layers.concrete, false);
assert.equal(decoded.viewState.section.enabled, true);
assert.equal(decoded.viewState.section.elevationZMm, 900);
assert.equal(decoded.viewState.selectedPartId, "longitudinal-bar-1-sw");
assert.equal(decoded.viewState.learning.mode, "guided");
assert.equal(decoded.viewState.learning.stepIndex, 2);
console.log("[PASS] URL encode -> decode round-trip parse -> validate -> model -> view sırasını korudu.");

// 5. Gizli katmandaki veya modelde olmayan partId değerinin URL yüklemesinde seçilmemesi
const resultHiddenLayer = parseAndApplySimulationUrlState({
  slug: "kolon-detayi",
  searchOrUrl: "?v=1&preset=c1-referans&layers=110111&part=stirrup-1-alt-sarilma-z50",
  initialModel,
});
assert.equal(resultHiddenLayer.fellBackToDefault, false);
assert.equal(resultHiddenLayer.viewState.layers.stirrup, false);
assert.equal(resultHiddenLayer.viewState.selectedPartId, null);

const resultUnknownPart = parseAndApplySimulationUrlState({
  slug: "kolon-detayi",
  searchOrUrl: "?v=1&preset=c1-referans&layers=111111&part=olmayan-hayali-parca-99",
  initialModel,
});
assert.equal(resultUnknownPart.fellBackToDefault, false);
assert.equal(resultUnknownPart.viewState.selectedPartId, null);
console.log("[PASS] Gizli katmandaki veya modelde olmayan partId seçilmedi.");

// 6. Bilinmeyen sürüm, aşırı uzun URL (> 2 KB), negatif değer, NaN ve Infinity durumlarında güvenli varsayılan
const badVersion = parseAndApplySimulationUrlState({
  slug: "kolon-detayi",
  searchOrUrl: "?v=99&cw=400",
  initialModel,
});
assert.equal(badVersion.fellBackToDefault, true);
assert.equal(badVersion.model.dimensionsMm.widthX, 300);

const negativeWidth = parseAndApplySimulationUrlState({
  slug: "kolon-detayi",
  searchOrUrl: "?v=1&cw=-450&cd=350",
  initialModel,
});
assert.equal(negativeWidth.fellBackToDefault, true);
assert.equal(negativeWidth.model.dimensionsMm.widthX, 300);

const nanParam = parseAndApplySimulationUrlState({
  slug: "kolon-detayi",
  searchOrUrl: "?v=1&cw=NaN&spos=Infinity",
  initialModel,
});
assert.equal(nanParam.fellBackToDefault, true);

const oversizedUrl = `?v=1&part=${"a".repeat(MAX_SIMULATION_URL_LENGTH + 100)}`;
const oversized = parseAndApplySimulationUrlState({
  slug: "kolon-detayi",
  searchOrUrl: oversizedUrl,
  initialModel,
});
assert.equal(oversized.fellBackToDefault, true);
assert.ok(oversized.reason?.includes("2 KB"));
console.log("[PASS] Bozuk sürüm, 2 KB üstü URL, negatif sayı, NaN ve Infinity güvenli varsayılana döndü.");

// 7. Kiriş (X ekseni) kesit normalize konumu ve katman bit dizisi dönüşümü
const beamModel = buildBeamDetailModel();
const ratio = computeNormalizedSectionPosition(2000, beamModel);
assert.ok(Math.abs(ratio - 0.5) < 0.01);
assert.equal(resolveElevationFromNormalizedPosition(ratio, beamModel), 2000);

const view = createInitialSimulationViewState("k1-referans");
assert.equal(encodeLayerMaskBitstring(view.layers), "111111");
assert.deepEqual(decodeLayerMaskBitstring("101010"), {
  concrete: true,
  longitudinal: false,
  stirrup: true,
  dowel: false,
  crosstie: true,
  dimensions: false,
});
assert.equal(decodeLayerMaskBitstring("bozuk"), null);
assert.equal(getDefaultColumnExperimentInput("c1-referans").sectionWidthMm, 300);
console.log("[PASS] Kesit normalize konumu (spos) ve katman bit dizisi doğru çalıştı.");
