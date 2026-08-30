import assert from "node:assert/strict";
import { calculateStoryDrift } from "../src/lib/engineering/tbdy2018/drift";
import {
  checkTorsionalIrregularity,
  checkSoftStoryIrregularity,
  checkFloorDiscontinuity,
} from "../src/lib/engineering/tbdy2018/irregularity";
import { determineSoilClass } from "../src/lib/engineering/tbdy2018/soil-class";
import { calculateEarthPressure } from "../src/lib/engineering/geotech/retaining-wall";
import { calculateSlopeStability } from "../src/lib/engineering/geotech/slope-stability";

console.log("==================================================================");
console.log("FAZ 5 — DEPREM VE GEOTEKNİK MOTORLARI TEST PAKETİ");
console.log("==================================================================\n");

function approxEqual(actual: number, expected: number, tolerance = 0.1, label = "") {
  const diff = Math.abs(actual - expected);
  assert.ok(
    diff <= tolerance,
    `[${label}] Uyuşmazlık: Beklenen=${expected}, Hesaplanan=${actual}, Fark=${diff}`
  );
}

// 1. Göreli Kat Ötelemesi (TBDY 2018 Bölüm 4.9 & Tablo 4.3)
console.log("[1] Göreli Kat Ötelemesi (drift.ts) Test Ediliyor...");
const driftRes = calculateStoryDrift({
  infillJointType: "flexible",
  lambdaFactor: 1.0,
  floors: [
    { floorNumber: 1, floorHeightM: 3.0, displacementMm: 12 },
    { floorNumber: 2, floorHeightM: 3.0, displacementMm: 27 },
    { floorNumber: 3, floorHeightM: 3.0, displacementMm: 45 },
  ],
});
assert.ok(driftRes);
assert.equal(driftRes.limitRatio, 0.016);
assert.equal(driftRes.isOverallSafe, true);
approxEqual(driftRes.maxDriftRatio, 0.006, 0.001, "Maks kat ötelemesi");
console.log("  ✓ Göreli Kat Ötelemesi motoru GEÇTİ.");

// 2. Düzensizlik Kontrolleri (TBDY 2018 Tablo 3.6)
console.log("[2] Düzensizlik Kontrolleri (irregularity.ts) Test Ediliyor...");
// A1 Burulma
const a1Safe = checkTorsionalIrregularity({ maxInterstoryDriftMm: 11, minInterstoryDriftMm: 10 });
assert.ok(a1Safe);
assert.equal(a1Safe.hasA1Irregularity, false);

const a1Unsafe = checkTorsionalIrregularity({ maxInterstoryDriftMm: 18, minInterstoryDriftMm: 6 });
assert.ok(a1Unsafe);
assert.equal(a1Unsafe.hasA1Irregularity, true);
approxEqual(a1Unsafe.torsionalRatioEtaBi, 1.50, 0.01, "Burulma katsayısı eta_bi");

// B2 Yumuşak Kat
const b2Res = checkSoftStoryIrregularity({ currentStoryDriftRatio: 0.009, upperStoryDriftRatio: 0.004 });
assert.ok(b2Res);
assert.equal(b2Res.hasB2Irregularity, true); // 0.009 / 0.004 = 2.25 > 2.0

// A2 Döşeme Süreksizliği
const a2Res = checkFloorDiscontinuity({ totalFloorAreaM2: 500, totalOpeningAreaM2: 200 }); // 40% > 33%
assert.ok(a2Res);
assert.equal(a2Res.hasA2Irregularity, true);
console.log("  ✓ Düzensizlik Kontrolleri motoru GEÇTİ.");

// 3. Yerel Zemin Sınıfı Tayini (TBDY 2018 Tablo 16.1)
console.log("[3] Yerel Zemin Sınıfı (soil-class.ts) Test Ediliyor...");
const zcSoil = determineSoilClass({ vs30Ms: 450 });
assert.equal(zcSoil.soilClass, "ZC");
const zdSoil = determineSoilClass({ vs30Ms: 250 });
assert.equal(zdSoil.soilClass, "ZD");
const zeSoil = determineSoilClass({ sptN60: 8 });
assert.equal(zeSoil.soilClass, "ZE");
const zfSoil = determineSoilClass({ isSpecialSoilCondition: true });
assert.equal(zfSoil.soilClass, "ZF");
console.log("  ✓ Yerel Zemin Sınıfı motoru GEÇTİ.");

// 4. İksa & Toprak Basıncı Motoru (Rankine & Coulomb)
console.log("[4] İksa & Toprak Basıncı (retaining-wall.ts) Test Ediliyor...");
const earthRes = calculateEarthPressure({
  wallHeightM: 5,
  soilUnitWeightKnM3: 18,
  internalFrictionAngleDeg: 30,
  surchargeKpa: 10,
});
assert.ok(earthRes);
approxEqual(earthRes.ka, 0.333, 0.01, "Ka");
approxEqual(earthRes.kp, 3.000, 0.01, "Kp");
approxEqual(earthRes.k0, 0.500, 0.01, "K0");
approxEqual(earthRes.staticActiveThrustKnM, 75.0, 1.0, "Pa,soil");
approxEqual(earthRes.surchargeThrustKnM, 16.67, 0.5, "Pa,q");
console.log("  ✓ İksa & Toprak Basıncı motoru GEÇTİ.");

// 5. Şev Stabilitesi Motoru (Fellenius & Bishop)
console.log("[5] Şev Stabilitesi (slope-stability.ts) Test Ediliyor...");
const slopeRes = calculateSlopeStability({
  slopeHeightM: 6,
  slopeAngleDeg: 30,
  soilUnitWeightKnM3: 18,
  cohesionKpa: 15,
  internalFrictionAngleDeg: 25,
});
assert.ok(slopeRes);
assert.ok(slopeRes.factorOfSafetyFs > 1.2, "Güvenlik katsayısı makul sınırda olmalı");
console.log("  ✓ Şev Stabilitesi motoru GEÇTİ.");

console.log("\n==================================================================");
console.log("✅ FAZ 5 DEPREM VE GEOTEKNİK MOTORLARI TESTLERİNİN TAMAMI BAŞARIYLA GEÇTİ.");
console.log("==================================================================\n");
