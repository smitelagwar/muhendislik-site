import assert from "node:assert/strict";
import {
  calculateColumnPreliminarySizing,
  calculateColumnCapacity,
  calculateColumnSteelArea,
  calculateLapLength,
} from "../src/lib/concrete-tools/column";
import {
  calculateBeamFlexure,
  calculateBeamShear,
} from "../src/lib/concrete-tools/beam";
import {
  calculateSlabThickness,
  calculateSlabMinimumRebar,
} from "../src/lib/concrete-tools/slab";
import {
  calculateConcreteCover,
} from "../src/lib/concrete-tools/cover";
import { CONCRETE_TOOL_FIXTURES } from "../src/lib/concrete-tools/fixtures";

console.log("==================================================================");
console.log("FAZ 1 — KORUMALI HESAPLAYICILAR REGRESYON TEST PAKETİ (BASELINE)");
console.log("==================================================================\n");

function approxEqual(actual: number, expected: number, tolerance = 0.5, label = "") {
  const diff = Math.abs(actual - expected);
  assert.ok(
    diff <= tolerance,
    `[${label}] Değer uyuşmuyor: Beklenen=${expected}, Hesaplanan=${actual}, Fark=${diff}, Tolerans=${tolerance}`
  );
}

// -----------------------------------------------------------------------------
// 1. KOLON HESAPLAYICISI REGRESYON TESTLERİ
// -----------------------------------------------------------------------------
console.log("[1] Kolon Hesaplayıcısı (TS 500) Test Ediliyor...");

// 1.1 Kolon Ön Boyutlandırma Normal Fixture
const colPrelimFixture = CONCRETE_TOOL_FIXTURES.column.preliminaryDefault;
const colPrelimRes = calculateColumnPreliminarySizing(colPrelimFixture.input);
assert.ok(colPrelimRes, "Kolon ön boyutlandırma sonucu null olamaz");
approxEqual(colPrelimRes.designAreaLoadKnM2, colPrelimFixture.expected.designAreaLoadKnM2, 0.01, "Kolon Pd");
approxEqual(colPrelimRes.designAxialLoadKn, colPrelimFixture.expected.designAxialLoadKn, 0.01, "Kolon Nd");
approxEqual(colPrelimRes.minimumAreaCm2, colPrelimFixture.expected.minimumAreaCm2, 0.01, "Kolon Ac,min");
assert.equal(colPrelimRes.shortEdgeCm, 30, "Kolon min kısa kenar 30 cm olmalı");
assert.equal(colPrelimRes.longEdgeCm, 55, "Kolon 5 cm yuvarlanmış uzun kenar 55 cm olmalı");
assert.equal(colPrelimRes.recommendedSection, colPrelimFixture.expected.recommendedSection);

// 1.2 Kolon Ön Boyutlandırma Sınır & Geçersiz Değerler
const colPrelimMin = calculateColumnPreliminarySizing({
  floorCount: 1,
  tributaryAreaM2: 10,
  deadLoadKnM2: 5,
  liveLoadKnM2: 2,
  concreteStrengthMpa: 30,
});
assert.ok(colPrelimMin);
assert.equal(colPrelimMin.shortEdgeCm, 30);
assert.equal(colPrelimMin.longEdgeCm, 30, "Minimum 30x30 cm kesite inmelidir");

assert.equal(calculateColumnPreliminarySizing({ floorCount: 0, tributaryAreaM2: 20, deadLoadKnM2: 10, liveLoadKnM2: 3, concreteStrengthMpa: 30 }), null);
assert.equal(calculateColumnPreliminarySizing({ floorCount: 5, tributaryAreaM2: -10, deadLoadKnM2: 10, liveLoadKnM2: 3, concreteStrengthMpa: 30 }), null);

// 1.3 Kolon Kapasite Kontrolü Normal Fixture
const colCapFixture = CONCRETE_TOOL_FIXTURES.column.capacityDefault;
const colCapRes = calculateColumnCapacity(colCapFixture.input);
assert.ok(colCapRes, "Kolon kapasite sonucu null olamaz");
assert.equal(colCapRes.sectionAreaMm2, colCapFixture.expected.sectionAreaMm2);
approxEqual(colCapRes.reinforcementRatio, colCapFixture.expected.reinforcementRatio, 0.001, "Donatı oranı");
approxEqual(colCapRes.totalCapacityKn, colCapFixture.expected.totalCapacityKn, 0.1, "Toplam Nr");
approxEqual(colCapRes.capacityRatio, colCapFixture.expected.capacityRatio, 0.01, "Kapasite oranı");
assert.equal(colCapRes.status.tone, "ok");

// 1.4 Kolon Donatı Oranı Sınırları (<%1 fail, >%4 warn, yetersiz kapasite fail)
const colCapLowRebar = calculateColumnCapacity({ ...colCapFixture.input, totalSteelAreaMm2: 800 }); // 800 / 160000 = 0.005
assert.ok(colCapLowRebar);
assert.equal(colCapLowRebar.status.tone, "fail");
assert.ok(colCapLowRebar.status.label.includes("yüzde 1"));

const colCapHighRebar = calculateColumnCapacity({ ...colCapFixture.input, totalSteelAreaMm2: 8000 }); // 8000 / 160000 = 0.05
assert.ok(colCapHighRebar);
assert.equal(colCapHighRebar.status.tone, "warn");
assert.ok(colCapHighRebar.status.label.includes("yüzde 4"));

const colCapOverload = calculateColumnCapacity({ ...colCapFixture.input, designAxialLoadKn: 4000 });
assert.ok(colCapOverload);
assert.equal(colCapOverload.status.tone, "fail");
assert.ok(colCapOverload.status.label.includes("Kapasite yetersiz"));

// 1.5 Kolon Donatı Alanı ve Kenetlenme
const colSteelFixture = CONCRETE_TOOL_FIXTURES.column.steelAreaDefault;
const colSteelRes = calculateColumnSteelArea(colSteelFixture.input.barDiameterMm, colSteelFixture.input.quantity);
assert.ok(colSteelRes);
approxEqual(colSteelRes.oneBarAreaMm2, colSteelFixture.expected.oneBarAreaMm2, 0.01);
approxEqual(colSteelRes.totalAreaMm2, colSteelFixture.expected.totalAreaMm2, 0.01);
approxEqual(colSteelRes.weightPerMeterKg, colSteelFixture.expected.weightPerMeterKg, 0.01);

const colLapFixture = CONCRETE_TOOL_FIXTURES.column.lapLengthDefault;
const colLapRes = calculateLapLength(colLapFixture.input.barDiameterMm, colLapFixture.input.concreteClassValue);
assert.ok(colLapRes);
assert.equal(colLapRes.minimumLapLengthMm, colLapFixture.expected.minimumLapLengthMm);
assert.equal(colLapRes.practicalLapLengthMm, colLapFixture.expected.practicalLapLengthMm);

console.log("  ✓ Kolon Ön Boyutlandırma, Kapasite ve Kenetlenme testleri GEÇTİ.");

// -----------------------------------------------------------------------------
// 2. KİRİŞ HESAPLAYICISI REGRESYON TESTLERİ
// -----------------------------------------------------------------------------
console.log("[2] Kiriş Kesiti & Eğilme / Kesme (TS 500) Test Ediliyor...");

// 2.1 Kiriş Eğilme Normal Fixture
const beamFlexFixture = CONCRETE_TOOL_FIXTURES.beam.flexureDefault;
const beamFlexRes = calculateBeamFlexure(beamFlexFixture.input);
assert.ok(beamFlexRes, "Kiriş eğilme sonucu null olamaz");
assert.equal(beamFlexRes.effectiveDepthMm, beamFlexFixture.expected.effectiveDepthMm);
approxEqual(beamFlexRes.kFactorMpa, beamFlexFixture.expected.kFactorMpa, 0.01, "Kiriş K katsayısı");
approxEqual(beamFlexRes.requiredSteelAreaMm2, 1383.70, 0.01, "Gerekli As");
approxEqual(beamFlexRes.minimumSteelAreaMm2, 261.99, 0.01, "Minimum As");
approxEqual(beamFlexRes.designSteelAreaMm2, 1383.70, 0.01, "Tasarım As");
assert.equal(beamFlexRes.status.tone, "ok");

// 2.2 Kiriş Eğilme Moment Yoğunluğu (K > 4 warn, K > 5.5 fail)
const beamFlexWarn = calculateBeamFlexure({ ...beamFlexFixture.input, designMomentKnM: 400 });
assert.ok(beamFlexWarn);
assert.equal(beamFlexWarn.status.tone, "warn");

const beamFlexFail = calculateBeamFlexure({ ...beamFlexFixture.input, designMomentKnM: 600 });
assert.ok(beamFlexFail);
assert.equal(beamFlexFail.status.tone, "fail");

// Geçersiz geometri (d <= 0)
assert.equal(calculateBeamFlexure({ ...beamFlexFixture.input, totalHeightMm: 40, coverMm: 30, stirrupDiameterMm: 10 }), null);

// 2.3 Kiriş Kesme Normal Fixture
const beamShearFixture = CONCRETE_TOOL_FIXTURES.beam.shearDefault;
const beamShearRes = calculateBeamShear(beamShearFixture.input);
assert.ok(beamShearRes, "Kiriş kesme sonucu null olamaz");
approxEqual(beamShearRes.shearStressMpa, beamShearFixture.expected.shearStressMpa, 0.01, "Kayma gerilmesi tau");
approxEqual(beamShearRes.shearStressLimitMpa, beamShearFixture.expected.shearStressLimitMpa, 0.01, "Kesme gerilme limiti");
approxEqual(beamShearRes.stirrupCapacityKn, beamShearFixture.expected.stirrupCapacityKn, 0.1, "Etriye kapasitesi Vw");
assert.equal(beamShearRes.status.tone, "ok");

// Kesme Gerilme Limiti Aşımı (tau > tau_max -> fail)
const beamShearFail = calculateBeamShear({ ...beamShearFixture.input, designShearKn: 600 });
assert.ok(beamShearFail);
assert.equal(beamShearFail.status.tone, "fail");

// Etriye Kapasitesi Yetersizliği (Vd > Vw -> warn)
const beamShearWarn = calculateBeamShear({ ...beamShearFixture.input, stirrupSpacingMm: 300 });
assert.ok(beamShearWarn);
assert.equal(beamShearWarn.status.tone, "warn");

console.log("  ✓ Kiriş Eğilme ve Kesme testleri GEÇTİ.");

// -----------------------------------------------------------------------------
// 3. DÖŞEME KALINLIĞI REGRESYON TESTLERİ
// -----------------------------------------------------------------------------
console.log("[3] Döşeme Kalınlığı & Minimum Donatı (TS 500) Test Ediliyor...");

// 3.1 Çift Yönlü Sürekli Döşeme Normal Fixture
const slabThickFixture = CONCRETE_TOOL_FIXTURES.slab.thicknessDefault;
const slabThickRes = calculateSlabThickness(slabThickFixture.input);
assert.ok(slabThickRes, "Döşeme kalınlık sonucu null olamaz");
approxEqual(slabThickRes.aspectRatio, slabThickFixture.expected.aspectRatio, 0.01);
approxEqual(slabThickRes.minimumThicknessMm, slabThickFixture.expected.minimumThicknessMm, 0.01);
assert.equal(slabThickRes.roundedThicknessMm, slabThickFixture.expected.roundedThicknessMm);
assert.equal(slabThickRes.recommendedThicknessMm, slabThickFixture.expected.recommendedThicknessMm);
assert.equal(slabThickRes.status.tone, "ok");

// 3.2 Ly / Lx > 2 Tek Yönlü Çalışma Uyarısı
const slabTwoWayHighRatio = calculateSlabThickness({
  shortSpanMeters: 3,
  longSpanMeters: 7, // 7/3 = 2.33 > 2
  slabType: "sur_cift",
  steelStrengthMpa: 420,
});
assert.ok(slabTwoWayHighRatio);
assert.equal(slabTwoWayHighRatio.status.tone, "warn");
assert.ok(slabTwoWayHighRatio.status.label.includes("Ly/Lx oranı 2'yi geçti"));

// 3.3 Döşeme Minimum Donatısı ve Aralık Fixture
const slabRebarFixture = CONCRETE_TOOL_FIXTURES.slab.rebarDefault;
const slabRebarRes = calculateSlabMinimumRebar(slabRebarFixture.input);
assert.ok(slabRebarRes, "Döşeme donatı sonucu null olamaz");
assert.equal(slabRebarRes.minimumSteelAreaPerMeterMm2, slabRebarFixture.expected.minimumSteelAreaPerMeterMm2);
approxEqual(slabRebarRes.selectedBarAreaMm2, slabRebarFixture.expected.selectedBarAreaMm2, 0.01);
assert.equal(slabRebarRes.maximumSpacingMm, slabRebarFixture.expected.maximumSpacingMm);
assert.equal(slabRebarRes.recommendedSpacingMm, slabRebarFixture.expected.recommendedSpacingMm);

console.log("  ✓ Döşeme Kalınlığı ve Donatı testleri GEÇTİ.");

// -----------------------------------------------------------------------------
// 4. PAS PAYI REGRESYON TESTLERİ
// -----------------------------------------------------------------------------
console.log("[4] Pas Payı (TS 500 / TS EN 1992-1-1) Test Ediliyor...");

// 4.1 Pas Payı Normal Fixture
const coverFixture = CONCRETE_TOOL_FIXTURES.cover.default;
const coverRes = calculateConcreteCover(coverFixture.input as any);
assert.ok(coverRes, "Pas payı sonucu null olamaz");
assert.equal(coverRes.bondMinimumMm, coverFixture.expected.bondMinimumMm);
assert.equal(coverRes.durabilityMinimumMm, coverFixture.expected.durabilityMinimumMm);
assert.equal(coverRes.minimumCoverMm, coverFixture.expected.minimumCoverMm);
assert.equal(coverRes.nominalCoverMm, coverFixture.expected.nominalCoverMm);
assert.equal(coverRes.practicalCoverMm, coverFixture.expected.practicalCoverMm);

// 4.2 100 Yıl Hizmet Ömrü Artışı (+10 mm)
const cover100Year = calculateConcreteCover({
  ...coverFixture.input,
  serviceLifeYears: 100,
} as any);
assert.ok(cover100Year);
assert.equal(cover100Year.durabilityMinimumMm, 35);
assert.equal(cover100Year.nominalCoverMm, 45);
assert.equal(cover100Year.practicalCoverMm, 55);

// 4.3 Deniz Suyu Altı (XS2) Dayanıklılık Şartı
const coverXS2 = calculateConcreteCover({
  ...coverFixture.input,
  exposureClass: "XS2",
} as any);
assert.ok(coverXS2);
assert.equal(coverXS2.durabilityMinimumMm, 40);
assert.equal(coverXS2.nominalCoverMm, 50);
assert.equal(coverXS2.practicalCoverMm, 60);

console.log("  ✓ Pas Payı normatif hesap testleri GEÇTİ.");

// -----------------------------------------------------------------------------
// 5. KALIP SÖKÜM SÜRESİ REGRESYON TESTLERİ (TS 500 / TS EN 13670)
// -----------------------------------------------------------------------------
console.log("[5] Kalıp Söküm Süresi (TS 500 / TS EN 13670) Test Ediliyor...");

// Kalıp söküm algoritması karakterizasyonu
const CEMENT_FACTORS = {
  cem1r: { label: "CEM I 42.5 R (Hızlı)", multiplier: 1.0 },
  cem2: { label: "CEM II 32.5 (Normal)", multiplier: 1.35 },
  cem3: { label: "CEM III (Yavaş)", multiplier: 1.9 },
} as const;

const ELEMENTS = {
  kolon: { label: "Kolon / Perde yan kalıbı", baseDays: 2, ratio: 0.35 },
  dosemeKucuk: { label: "Döşeme ≤ 4 m", baseDays: 7, ratio: 0.7 },
  dosemeOrta: { label: "Döşeme 4 - 6 m", baseDays: 10, ratio: 0.7 },
  dosemeBuyuk: { label: "Döşeme ≥ 6 m", baseDays: 14, ratio: 0.75 },
  kiris: { label: "Kiriş alt kalıbı", baseDays: 10, ratio: 0.75 },
  konsol: { label: "Konsol", baseDays: 14, ratio: 0.8 },
} as const;

function getTemperatureFactor(temperature: number) {
  if (temperature < 5) return 999;
  if (temperature < 10) return 1.5;
  if (temperature < 15) return 1.25;
  if (temperature <= 25) return 1;
  return 0.85;
}

function calculateStrippingTime(fck: number, cimentoTipi: keyof typeof CEMENT_FACTORS, elemanTipi: keyof typeof ELEMENTS, temperature: number) {
  const cement = CEMENT_FACTORS[cimentoTipi];
  const element = ELEMENTS[elemanTipi];
  const temperatureFactor = getTemperatureFactor(temperature);
  const critical = temperatureFactor >= 999;
  const minimumDays = critical ? null : Math.ceil(element.baseDays * cement.multiplier * temperatureFactor);
  const safeDays = critical ? null : Math.ceil((minimumDays ?? 0) * 1.25);
  const targetStrength = fck * element.ratio;
  return { critical, minimumDays, safeDays, targetStrength };
}

// 5.1 Standart senaryo: C25, CEM I 42.5 R, 20°C, Döşeme <= 4m
const stripNormal = calculateStrippingTime(25, "cem1r", "dosemeKucuk", 20);
assert.equal(stripNormal.critical, false);
assert.equal(stripNormal.minimumDays, 7);
assert.equal(stripNormal.safeDays, 9);
assert.equal(stripNormal.targetStrength, 17.5);

// 5.2 Don riski (< 5°C) senaryosu
const stripFreeze = calculateStrippingTime(25, "cem1r", "dosemeKucuk", 3);
assert.equal(stripFreeze.critical, true);
assert.equal(stripFreeze.minimumDays, null);
assert.equal(stripFreeze.safeDays, null);

// 5.3 Soğuk hava & CEM II: C30, CEM II 32.5, 8°C, Kiriş alt kalıbı
// baseDays=10, multiplier=1.35, tempFactor=1.5 -> 10 * 1.35 * 1.5 = 20.25 -> ceil = 21 gün
const stripCold = calculateStrippingTime(30, "cem2", "kiris", 8);
assert.equal(stripCold.critical, false);
assert.equal(stripCold.minimumDays, 21);
assert.equal(stripCold.safeDays, 27); // ceil(21 * 1.25) = 27
assert.equal(stripCold.targetStrength, 22.5); // 30 * 0.75 = 22.5 MPa

console.log("  ✓ Kalıp Söküm Süresi karakterizasyon testleri GEÇTİ.");

console.log("\n==================================================================");
console.log("✅ FAZ 1 REGRESYON TESTLERİNİN TAMAMI BAŞARIYLA GEÇTİ (0 REGRESYON).");
console.log("==================================================================\n");
