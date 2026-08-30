import assert from "node:assert/strict";
import { calculateSteelProfile } from "../src/lib/engineering/steel/profile-selection";
import {
  calculateBoltedConnection,
  calculateWeldedConnection,
} from "../src/lib/engineering/steel/connection";
import { calculateTimberMember } from "../src/lib/engineering/timber/timber-member";

console.log("==================================================================");
console.log("FAZ 6 — ÇELİK VE AHŞAP YAPI MOTORLARI TEST PAKETİ");
console.log("==================================================================\n");

function approxEqual(actual: number, expected: number, tolerance = 0.1, label = "") {
  const diff = Math.abs(actual - expected);
  assert.ok(
    diff <= tolerance,
    `[${label}] Uyuşmazlık: Beklenen=${expected}, Hesaplanan=${actual}, Fark=${diff}`
  );
}

// 1. Çelik Profil Seçimi & Kapasite (ÇYTHYE 2018 / TS EN 1993-1-1)
console.log("[1] Çelik Profil Seçimi & Kapasite (profile-selection.ts) Test Ediliyor...");
const steelRes = calculateSteelProfile({
  profileName: "IPE 270",
  steelYieldFyMpa: 355,
  bucklingLengthM: 4.0,
  axialCompressionNdKn: 150,
  bendingMomentMdKnm: 50,
  shearForceVdKn: 70,
});
assert.ok(steelRes);
assert.equal(steelRes.isSlendernessSafe, true);
assert.ok(steelRes.compressionCapacityNbRdKn > 300, "Nb,Rd makul olmalı");
assert.ok(steelRes.bendingCapacityMcRdKnm > 100, "Mc,Rd makul olmalı");

// Bilinmeyen profil testi (null dönmeli)
assert.equal(calculateSteelProfile({ profileName: "UNKNOWN_999", steelYieldFyMpa: 235, bucklingLengthM: 3 }), null);
console.log("  ✓ Çelik Profil motoru GEÇTİ.");

// 2. Çelik Birleşimleri (Bulonlu ve Kaynaklı - ÇYTHYE 2018 Bölüm 13)
console.log("[2] Çelik Birleşimleri (connection.ts) Test Ediliyor...");
const boltRes = calculateBoltedConnection({
  boltGrade: "8.8",
  boltDiameterMm: 20,
  boltCount: 4,
  shearPlanesCount: 1,
  plateThicknessMm: 10,
  designShearForceVdKn: 120,
});
assert.ok(boltRes);
approxEqual(boltRes.singleBoltShearCapacityFvRdKn, 94.08, 1.0, "Tek cıvata Fv,Rd");
assert.ok(boltRes.totalConnectionShearCapacityKn > 300);
assert.equal(boltRes.isSafe, true);

const weldRes = calculateWeldedConnection({
  weldThicknessMm: 5,
  weldLengthMm: 150,
  steelGrade: "S355",
  designShearForceVdKn: 140,
});
assert.ok(weldRes);
approxEqual(weldRes.weldStrengthFvwDMpa, 261.7, 2.0, "Kaynak fvw,d");
assert.ok(weldRes.weldShearCapacityKn > 180);
assert.equal(weldRes.isSafe, true);
console.log("  ✓ Çelik Birleşimleri motoru GEÇTİ.");

// 3. Ahşap Eleman Hesabı (TS EN 1995-1-1 / TS 647)
console.log("[3] Ahşap Eleman Hesabı (timber-member.ts) Test Ediliyor...");
const timberRes = calculateTimberMember({
  grade: "C24",
  durationClass: "medium",
  widthMm: 100,
  heightMm: 200,
  lengthM: 3.5,
  uniformLoadKnM: 2.0,
});
assert.ok(timberRes);
approxEqual(timberRes.designBendingMomentMedKnm, 3.06, 0.1, "Eğilme momenti Med");
approxEqual(timberRes.sectionModulusWcm3, 666.67, 1.0, "Kesit mukavemet momenti W");
approxEqual(timberRes.fmdMpa, 14.77, 0.5, "Tasarım eğilme dayanımı fmd");
assert.equal(timberRes.isOverallSafe, true);

// Ahşap dikme/burkulma testi
const postRes = calculateTimberMember({
  grade: "C24",
  durationClass: "permanent",
  memberType: "post",
  widthMm: 120,
  heightMm: 120,
  lengthM: 3.0,
  axialLoadKn: 40,
});
assert.ok(postRes);
assert.ok(postRes.axialCompressionCapacityNcRdKn > 30, "Dikme taşıma kapasitesi makul olmalı");
console.log("  ✓ Ahşap Eleman motoru GEÇTİ.");

console.log("\n==================================================================");
console.log("✅ FAZ 6 ÇELİK VE AHŞAP MOTORLARI TESTLERİNİN TAMAMI BAŞARIYLA GEÇTİ.");
console.log("==================================================================\n");
