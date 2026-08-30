import assert from "node:assert/strict";
import { calculatePunchingShear } from "../src/lib/concrete-tools/punching";
import { calculateBeamShear } from "../src/lib/concrete-tools/shear-stirrup";
import { calculateSpliceLength } from "../src/lib/concrete-tools/splice";
import { calculateMatFoundation } from "../src/lib/concrete-tools/mat-foundation";

console.log("==================================================================");
console.log("FAZ 4 — KISMİ / ADAPTASYON BETONARME MOTORLARI TEST PAKETİ");
console.log("==================================================================\n");

function approxEqual(actual: number, expected: number, tolerance = 0.1, label = "") {
  const diff = Math.abs(actual - expected);
  assert.ok(
    diff <= tolerance,
    `[${label}] Uyuşmazlık: Beklenen=${expected}, Hesaplanan=${actual}, Fark=${diff}`
  );
}

// 1. Zımbalama Kontrolü Motoru (TS 500 Madde 8.3)
console.log("[1] Döşeme Zımbalama Kontrolü (punching.ts) Test Ediliyor...");
const punchSafe = calculatePunchingShear({
  fckMpa: 30,
  fctdMpa: 1.35,
  slabThicknessCm: 25,
  coverMm: 30,
  columnBxCm: 40,
  columnByCm: 40,
  location: "inner",
  axialPunchingLoadKn: 480,
});
assert.ok(punchSafe);
approxEqual(punchSafe.effectiveDepthCm, 21.0, 0.01, "Faydalı derinlik d");
approxEqual(punchSafe.punchingPerimeterCm, 244.0, 0.01, "Zımbalama çevresi up");
approxEqual(punchSafe.punchingStressMpa, 0.937, 0.01, "Zımbalama gerilmesi vpd");
assert.equal(punchSafe.status, "safe", "480 kN yükte donatısız kurtarmalı");

// Zımbalama aşım senaryosu (yüksek köşe yükü)
const punchUnsafe = calculatePunchingShear({
  fckMpa: 25,
  fctdMpa: 1.20,
  slabThicknessCm: 18,
  coverMm: 25,
  columnBxCm: 30,
  columnByCm: 30,
  location: "corner",
  axialPunchingLoadKn: 600,
});
assert.ok(punchUnsafe);
assert.equal(punchUnsafe.status, "exceeded_capacity", "Aşırı yükte kesit aşımı uyarısı vermeli");

console.log("  ✓ Zımbalama Kontrolü motoru GEÇTİ.");

// 2. Kiriş Kesme ve Etriye Motoru (TS 500 Madde 8.1 & TBDY 2018)
console.log("[2] Kiriş Kesme & Etriye Hesabı (shear-stirrup.ts) Test Ediliyor...");
const beamShearRes = calculateBeamShear({
  fckMpa: 30,
  fctdMpa: 1.35,
  fcdMpa: 20.0,
  fywdMpa: 365,
  beamWidthCm: 25,
  beamHeightCm: 50,
  coverMm: 40,
  designShearKn: 160,
  stirrupDiameterMm: 8,
  stirrupLegCount: 2,
});
assert.ok(beamShearRes);
approxEqual(beamShearRes.effectiveDepthCm, 46.0, 0.01, "Kiriş d");
approxEqual(beamShearRes.concreteShearResistanceKn, 124.2, 0.1, "Vc");
approxEqual(beamShearRes.maxShearLimitKn, 506.0, 0.5, "Vmax");
assert.equal(beamShearRes.isVmaxSafe, true);
assert.equal(beamShearRes.recommendedConfinedSpacingCm, 10, "Sarılma bölgesi aralığı max 10cm");
assert.equal(beamShearRes.recommendedSpanSpacingCm, 20, "Orta bölge aralığı max 20cm");

console.log("  ✓ Kiriş Kesme ve Etriye motoru GEÇTİ.");

// 3. Donatı Kenetlenme & Ek Boyu Motoru (TS 500 Madde 9.1)
console.log("[3] Donatı Kenetlenme & Ek Boyu (splice.ts) Test Ediliyor...");
const spliceRes = calculateSpliceLength({
  fckMpa: 30,
  fctdMpa: 1.35,
  fydMpa: 365,
  barDiameterMm: 16,
  bondCondition: "good",
  spliceType: "duz",
  isCompression: false,
});
assert.ok(spliceRes);
approxEqual(spliceRes.basicAnchorageLengthLbMm, 270.37, 0.1, "lb");
assert.equal(spliceRes.basicAnchorageLengthLbCm, 28);
assert.equal(spliceRes.recommendedLapSpliceLengthCm, 36); // 1.3 * 27.03 = 35.14 -> 36 cm

// Kancalı ek
const hookSpliceRes = calculateSpliceLength({
  fckMpa: 30,
  fctdMpa: 1.35,
  fydMpa: 365,
  barDiameterMm: 16,
  bondCondition: "good",
  spliceType: "kancali",
  isCompression: false,
});
assert.ok(hookSpliceRes);
assert.equal(hookSpliceRes.designAnchorageLengthLbdCm, 19); // 0.7 * 27.03 = 18.9 -> 19 cm

console.log("  ✓ Donatı Kenetlenme ve Ek Boyu motoru GEÇTİ.");

// 4. Radye Temel Kalınlık & Zımbalama Motoru (TS 500 & TBDY 2018 Bölüm 16)
console.log("[4] Radye Temel Ön Boyutlandırma & Zımbalama (mat-foundation.ts) Test Ediliyor...");
const matRes = calculateMatFoundation({
  fckMpa: 30,
  buildingTotalWeightKn: 18000,
  matAreaM2: 300,
  columnMaxAxialLoadKn: 1400,
  columnBxCm: 50,
  columnByCm: 50,
  soilAllowableStressKpa: 150,
  matThicknessCm: 70,
  spanLengthM: 6.0,
});
assert.ok(matRes);
approxEqual(matRes.actualSoilStressKpa, 77.5, 0.1, "Ortalama taban zemin gerilmesi");
assert.equal(matRes.isSoilStressSafe, true);
approxEqual(matRes.punchingStressMpa, 0.415, 0.02, "Kolon zımbalama gerilmesi vpd");
assert.equal(matRes.isPunchingSafe, true);
assert.equal(matRes.isThicknessAdequate, true);
assert.equal(matRes.status, "safe");

console.log("  ✓ Radye Temel motoru GEÇTİ.");

console.log("\n==================================================================");
console.log("✅ FAZ 4 BETONARME MOTORLARI TESTLERİNİN TAMAMI BAŞARIYLA GEÇTİ.");
console.log("==================================================================\n");
