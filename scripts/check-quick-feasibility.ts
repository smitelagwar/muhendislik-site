import assert from "node:assert/strict";
import {
  calculateQuickFeasibility,
  calculateImpliedMinFloorPlates,
  calculateReverseUnitSizing,
  type TypologyCardResult,
} from "../src/lib/calculations/modules/ruhsat-on-fizibilite";

console.log("Quick Feasibility Aşama 2A & 2B testleri başlatılıyor...");

// Test 1: Temel 1000 / 0.30 / 1.50 (Kat yok)
const result1 = calculateQuickFeasibility({
  parcelAreaM2: 1000,
  taks: 0.30,
  kaks: 1.50,
});

assert.ok(result1 !== null, "Sonuç null olmamalı");
assert.equal(result1.legalRights.taksMaxM2, 300);
assert.equal(result1.legalRights.emsalMaxM2, 1500);
assert.equal(result1.scope, "QUICK_HEURISTIC");

// 4 tipoloji mevcut mu?
const types = ["1+1", "2+1", "3+1", "4+1"] as const;
for (const t of types) {
  const card: TypologyCardResult = result1.typologyCards[t];
  assert.ok(card, `${t} kartı üretilmeli`);
  assert.equal(card.unitType, t);
  assert.ok(card.candidateTotalUnits.min > 0, `${t} min aday > 0`);
  assert.ok(card.candidateTotalUnits.max >= card.candidateTotalUnits.min, `${t} max >= min`);
  assert.equal(card.candidateUnitsPerFloor, null, "Kat girilmediğinde kat başı null olmalı");
  assert.equal(card.provenance, "HEURISTIC");
  assert.equal(card.geometryVerified, false);
}

// 1+1 daire adedi 4+1'den belirgin şekilde fazla olmalı
assert.ok(
  result1.typologyCards["1+1"].candidateTotalUnits.max > result1.typologyCards["4+1"].candidateTotalUnits.max,
  "1+1 toplam adedi 4+1 toplam adedinden fazla olmalı"
);

// 2+1 ve 3+1 farklı profillere ve aralıklara sahip olmalı
assert.notDeepEqual(
  result1.typologyCards["2+1"].estimatedClosedGrossPerUnitM2,
  result1.typologyCards["3+1"].estimatedClosedGrossPerUnitM2,
  "2+1 ve 3+1 kapalı brüt aralıkları farklı olmalı"
);

// Test 2: Kat girildiğinde (kat = 5)
const result2 = calculateQuickFeasibility({
  parcelAreaM2: 1000,
  taks: 0.30,
  kaks: 1.50,
  optionalFloorCount: 5,
});

assert.ok(result2 !== null);
for (const t of types) {
  const card: TypologyCardResult = result2.typologyCards[t];
  assert.ok(card.candidateUnitsPerFloor !== null, `${t} için kat başına aralık üretilmeli`);
  assert.ok(card.candidateUnitsPerFloor!.min > 0);
  assert.ok(card.candidateUnitsPerFloor!.max >= card.candidateUnitsPerFloor!.min);

  // 5 kat girildiğinde asansör CHECK_REQUIRED olmalı (>= 4 kat)
  assert.equal(card.triggerSummary.lift, "CHECK_REQUIRED");
}

// Test 3: Sığınak tetik sinyali
// 1+1 toplam adedi >= 10 olacağı için CHECK_REQUIRED veya MAY_TRIGGER olmalı
assert.ok(
  result1.typologyCards["1+1"].triggerSummary.shelter === "CHECK_REQUIRED" ||
  result1.typologyCards["1+1"].triggerSummary.shelter === "MAY_TRIGGER"
);

// Test 4: Ters Hesap (Reverse Sizing)
// 1500 m² emsal, 10 daire isteniyor
const rev10 = calculateReverseUnitSizing(1500, 10, "3+1");
assert.ok(rev10 !== null);
assert.equal(rev10.theoreticalEmsalSharePerUnitM2, 150, "1500 / 10 = 150 emsal payı");
assert.ok(rev10.estimatedClosedGrossRangeM2.min > 0);
assert.ok(rev10.estimatedClosedGrossRangeM2.max > rev10.estimatedClosedGrossRangeM2.min);
assert.ok(rev10.estimatedNetRangeM2.min > 0);
assert.ok(rev10.estimatedNetRangeM2.max > rev10.estimatedNetRangeM2.min);
assert.equal(rev10.provenance, "HEURISTIC");

// 1500 m² emsalde 30 daire 3+1 TOO_TIGHT veya COMPACT çıkmalı
const rev30 = calculateReverseUnitSizing(1500, 30, "3+1");
assert.ok(rev30 !== null);
assert.equal(rev30.theoreticalEmsalSharePerUnitM2, 50);
assert.ok(rev30.fitClass === "TOO_TIGHT" || rev30.fitClass === "COMPACT");

// 1500 m² emsalde 2 daire VERY_LARGE çıkmalı
const rev2 = calculateReverseUnitSizing(1500, 2, "3+1");
assert.ok(rev2 !== null);
assert.equal(rev2.fitClass, "VERY_LARGE");

// ==========================================
// Aşama 5 Fixture ve Invariant Testleri
// ==========================================

// Fixture B: 850 m², TAKS 0.40, KAKS 1.60
const fixB = calculateQuickFeasibility({
  parcelAreaM2: 850,
  taks: 0.40,
  kaks: 1.60,
});
assert.ok(fixB !== null);
assert.equal(fixB.legalRights.taksMaxM2, 340);
assert.equal(fixB.legalRights.emsalMaxM2, 1360);
assert.equal(fixB.legalRights.impliedMinFloorPlates, 4);

// Fixture C: TAKS = 1.00, KAKS = 1.00
const fixC = calculateQuickFeasibility({
  parcelAreaM2: 600,
  taks: 1.00,
  kaks: 1.00,
});
assert.ok(fixC !== null);
assert.equal(fixC.legalRights.taksMaxM2, 600);
assert.equal(fixC.legalRights.emsalMaxM2, 600);
assert.equal(fixC.legalRights.impliedMinFloorPlates, 1);

// Fixture D: KAKS < TAKS (500 m², TAKS 0.40, KAKS 0.30)
const fixD = calculateQuickFeasibility({
  parcelAreaM2: 500,
  taks: 0.40,
  kaks: 0.30,
});
assert.ok(fixD !== null);
assert.equal(fixD.legalRights.taksMaxM2, 200);
assert.equal(fixD.legalRights.emsalMaxM2, 150);
assert.equal(fixD.legalRights.impliedMinFloorPlates, 1);

// Fixture E: Küçük ve büyük arsa edge cases (100 m² ve 10000 m²)
const fixSmall = calculateQuickFeasibility({ parcelAreaM2: 100, taks: 0.30, kaks: 1.20 });
assert.ok(fixSmall !== null);
assert.equal(fixSmall.legalRights.taksMaxM2, 30);
assert.equal(fixSmall.legalRights.emsalMaxM2, 120);

const fixBig = calculateQuickFeasibility({ parcelAreaM2: 10000, taks: 0.40, kaks: 2.00 });
assert.ok(fixBig !== null);
assert.equal(fixBig.legalRights.taksMaxM2, 4000);
assert.equal(fixBig.legalRights.emsalMaxM2, 20000);

// Invariant Testi: Arsa alanı arttıkça TAKS_MAX ve EMSAL_MAX monotonik artmalı
assert.ok(fixBig.legalRights.taksMaxM2 > fixSmall.legalRights.taksMaxM2);
assert.ok(fixBig.legalRights.emsalMaxM2 > fixSmall.legalRights.emsalMaxM2);

console.log("Tüm Quick Feasibility ve Aşama 5 Fixture Testleri BAŞARIYLA GEÇTİ.");
