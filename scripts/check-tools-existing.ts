import assert from "node:assert/strict";
import { calculateEquivalentBaseShear } from "../src/lib/engineering/tbdy2018/base-shear";
import { calculateFormworkStripping } from "../src/lib/concrete-tools/stripping";
import { calculateRebarResult, buildEquivalentRebarRows, calculateRebarSpacing } from "../src/lib/rebar-calculations";
import { calculateEmpiricalPeriod } from "../src/lib/engineering/tbdy2018/period";
import { calculateImarValues } from "../src/lib/imar/calculator";

console.log("==================================================================");
console.log("FAZ 3 — MEVCUT ALTYAPI ARAÇLARI DOĞRULAMA PAKETİ");
console.log("==================================================================\n");

function approxEqual(actual: number, expected: number, tolerance = 0.1, label = "") {
  const diff = Math.abs(actual - expected);
  assert.ok(
    diff <= tolerance,
    `[${label}] Uyuşmazlık: Beklenen=${expected}, Hesaplanan=${actual}, Fark=${diff}`
  );
}

// 1. TBDY 2018 Eşdeğer Deprem Yükü / Taban Kesme Motoru
console.log("[1] TBDY 2018 Eşdeğer Deprem Yükü (base-shear.ts) Test Ediliyor...");

const baseShearNormal = calculateEquivalentBaseShear({
  ss: 0.85,
  s1: 0.25,
  soilClass: "ZC",
  importanceFactorI: 1.0,
  behaviorFactorR: 8,
  totalWeightKn: 5000,
  numFloors: 5,
  buildingHeightM: 15,
});

assert.ok(baseShearNormal, "Taban kesme sonucu null olamaz");
approxEqual(baseShearNormal.sds, 1.2325, 0.001, "SDs");
approxEqual(baseShearNormal.sd1, 0.40, 0.001, "SD1");
approxEqual(baseShearNormal.empiricalPeriodTp, 0.533, 0.01, "Tp");
approxEqual(baseShearNormal.calculatedBaseShearKn, 468.8, 1.0, "VtE");
assert.equal(baseShearNormal.isMinimumControlled, false, "Normal senaryoda min kesme kontrol etmemeli");
assert.equal(baseShearNormal.floorForces.length, 5, "5 kat için kuvvet dağılımı üretilmeli");

// Kat kuvvetleri toplamı taban kesmeye eşit olmalı
const totalFloorForces = baseShearNormal.floorForces.reduce((sum, f) => sum + f.lateralForceKn, 0);
approxEqual(totalFloorForces, baseShearNormal.designBaseShearKn, 0.05, "Kat kuvvetleri toplamı taban kesmeye eşit olmalı");

// Taban Kesme Min Sınır Tahkiki (R çok yüksek senaryo)
const baseShearMinControlled = calculateEquivalentBaseShear({
  ss: 1.5,
  s1: 0.1,
  soilClass: "ZD",
  importanceFactorI: 1.2,
  behaviorFactorR: 12,
  totalWeightKn: 10000,
  numFloors: 10,
  buildingHeightM: 30,
});
assert.ok(baseShearMinControlled);
assert.equal(baseShearMinControlled.isMinimumControlled, true, "Min taban kesme kontrol etmeli");
approxEqual(baseShearMinControlled.designBaseShearKn, baseShearMinControlled.minimumBaseShearKn, 0.01, "Tasarım taban kesme min kesmeye eşit olmalı");

console.log("  ✓ Eşdeğer Deprem Yükü ve Taban Kesme motoru GEÇTİ.");

// 2. Kalıp Söküm Süresi Motoru
console.log("[2] Kalıp Söküm Süresi (stripping.ts) Test Ediliyor...");
const stripRes = calculateFormworkStripping({
  concreteClassMpa: 30,
  cementType: "cem1r",
  elementType: "kiris",
  temperatureC: 20,
});
assert.ok(stripRes);
assert.equal(stripRes.minimumDays, 10);
assert.equal(stripRes.safeDays, 13);
assert.equal(stripRes.targetStrengthMpa, 22.5); // 30 * 0.75

assert.equal(calculateFormworkStripping({ concreteClassMpa: 30, cementType: "cem1r", elementType: "kiris", temperatureC: 2 })?.critical, true);
console.log("  ✓ Kalıp Söküm Süresi motoru GEÇTİ.");

// 3. Donatı Hesabı Motoru
console.log("[3] Donatı Hesabı (rebar-calculations.ts) Test Ediliyor...");
const rebarRes = calculateRebarResult(16, 6);
approxEqual(rebarRes.totalAreaMm2, 1206.37, 0.1, "6φ16 toplam As");
const eqRows = buildEquivalentRebarRows(rebarRes.totalAreaMm2);
assert.ok(eqRows.length > 0);
const spacingRes = calculateRebarSpacing({ quantity: 4, diameter: 16, widthCm: 30, coverMm: 30, stirrupDiameterMm: 8 });
assert.ok(spacingRes);
assert.equal(spacingRes.status, "ok");
console.log("  ✓ Donatı Hesabı motoru GEÇTİ.");

// 4. Deprem Periyot Motoru
console.log("[4] Deprem Periyodu (period.ts) Test Ediliyor...");
const periodSeconds = calculateEmpiricalPeriod(0.07, 24);
approxEqual(periodSeconds, 0.759, 0.01, "24m bina ampirik periyodu");
console.log("  ✓ Deprem Periyodu motoru GEÇTİ.");

// 5. İmar Hesaplayıcı Motoru
console.log("[5] İmar Hesaplayıcı (imar/calculator.ts) Test Ediliyor...");
const imarRes = calculateImarValues({
  grossParcelAreaM2: 1000,
  taks: 0.35,
  kaks: 1.75,
  basementCount: 1,
  frontSetbackM: 5,
  rearSetbackM: 3,
  sideSetbackM: 3,
  parcelWidthM: null,
  parcelDepthM: null,
});
assert.ok(imarRes);
approxEqual(imarRes.maxGroundAreaM2, 350, 0.1, "TAKS alanı");
approxEqual(imarRes.totalConstructionAreaM2, 1750, 0.1, "KAKS alanı");
console.log("  ✓ İmar Hesaplayıcı motoru GEÇTİ.");

console.log("\n==================================================================");
console.log("✅ FAZ 3 MEVCUT ALTYAPI TESTLERİNİN TAMAMI BAŞARIYLA GEÇTİ.");
console.log("==================================================================\n");
