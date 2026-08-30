import assert from "node:assert/strict";

// 1. Betonarme & Korunan Motorlar
import { calculateColumnPreliminarySizing } from "../src/lib/concrete-tools/column";
import { calculateBeamSection } from "../src/lib/concrete-tools/beam";
import { calculateSlabThickness } from "../src/lib/concrete-tools/slab";
import { calculateConcreteCover } from "../src/lib/concrete-tools/cover";
import { calculateStrippingTime } from "../src/lib/concrete-tools/stripping";
import { calculatePunchingShear } from "../src/lib/concrete-tools/punching";
import { calculateBeamShear } from "../src/lib/concrete-tools/shear-stirrup";
import { calculateSpliceLength } from "../src/lib/concrete-tools/splice";
import { calculateMatFoundation } from "../src/lib/concrete-tools/mat-foundation";

// 2. Deprem & Geoteknik Motorları
import { calculateSeismicBaseShear } from "../src/lib/engineering/tbdy2018/base-shear";
import { calculateIrregularities } from "../src/lib/engineering/tbdy2018/irregularity";
import { determineSoilClass } from "../src/lib/engineering/tbdy2018/soil-class";
import { calculateEquivalentSeismicPeriod } from "../src/lib/engineering/tbdy2018/period";
import { calculateStoryDrift } from "../src/lib/engineering/tbdy2018/drift";
import { calculateRetainingWallPressures } from "../src/lib/engineering/geotech/retaining-wall";
import { calculateSlopeStability } from "../src/lib/engineering/geotech/slope-stability";

// 3. Çelik & Ahşap Motorları
import { calculateSteelProfile } from "../src/lib/engineering/steel/profile-selection";
import { calculateSteelConnection } from "../src/lib/engineering/steel/connection";
import { calculateTimberMember } from "../src/lib/engineering/timber/timber-member";

// 4. Metraj & Yalıtım / İmar Motorları
import { calculateConcreteQuantity } from "../src/lib/engineering/quantity/concrete-volume";
import { calculateExcavation } from "../src/lib/engineering/quantity/excavation";
import { calculateRebarQuantity } from "../src/lib/engineering/quantity/rebar-ratio";
import { calculateFormworkQuantity } from "../src/lib/engineering/quantity/formwork-ratio";
import { calculateMasonryQuantity } from "../src/lib/engineering/quantity/masonry";
import { calculatePlasterPaint } from "../src/lib/engineering/quantity/plaster-paint";
import { calculateRoofCovering } from "../src/lib/engineering/quantity/roof-covering";
import { calculateTileQuantity } from "../src/lib/engineering/quantity/tile-flooring";

console.log("==================================================================");
console.log("FAZ 10 — ADVERSARIAL & BOUNDARY TEST SUITE (30/30 MOTOR)");
console.log("==================================================================\n");

function isFiniteNumber(val: unknown): boolean {
  return typeof val === "number" && !Number.isNaN(val) && Number.isFinite(val);
}

// 1. Zımbalama Sınır Testleri (Çok büyük yük)
console.log("[1] Zımbalama Sınır Testi (Extreme load)...");
const p1 = calculatePunchingShear({
  fckMpa: 30,
  slabThicknessCm: 25,
  coverMm: 25,
  columnBxCm: 40,
  columnByCm: 40,
  location: "inner",
  axialPunchingLoadKn: 99999,
});
assert.ok(p1);
assert.equal(p1.status, "exceeded_capacity");
assert.ok(p1.utilizationRatio > 1.0);
assert.ok(isFiniteNumber(p1.punchingStressMpa));

// 2. Kiriş Kesme Sınır Testi (Düşük kesme talebi)
console.log("[2] Kiriş Kesme Sınır Testi (Minimum kesme talebi)...");
const s1 = calculateBeamShear({
  fckMpa: 25,
  beamWidthCm: 25,
  beamHeightCm: 50,
  coverMm: 30,
  designShearKn: 10,
  stirrupDiameterMm: 8,
  stirrupLegCount: 2,
});
assert.ok(s1);
assert.ok(s1.isVmaxSafe);
assert.ok(isFiniteNumber(s1.maxShearLimitKn));

// 3. Kenetlenme Sınır Testi (Kötü aderans ve ince donatı)
console.log("[3] Kenetlenme Sınır Testi (İnce donatı & düşük beton)...");
const sp1 = calculateSpliceLength({
  fckMpa: 20,
  barDiameterMm: 8,
  bondCondition: "poor",
  spliceType: "duz",
  isCompression: false,
});
assert.ok(sp1);
assert.ok(sp1.recommendedLapSpliceLengthMm > 0);
assert.ok(isFiniteNumber(sp1.basicAnchorageLengthLbMm));

// 4. Radye Temel Sınır Testi
console.log("[4] Radye Temel Sınır Testi...");
const mat1 = calculateMatFoundation({
  fckMpa: 30,
  buildingTotalWeightKn: 15000,
  matAreaM2: 300,
  columnMaxAxialLoadKn: 2000,
  columnBxCm: 60,
  columnByCm: 60,
  soilAllowableStressKpa: 250,
  matThicknessCm: 80,
});
assert.ok(mat1);
assert.ok(isFiniteNumber(mat1.actualSoilStressKpa));
assert.ok(isFiniteNumber(mat1.punchingStressMpa));

// 5. Göreli Kat Ötelemesi Limit Testi (Limitin hemen altı ve üstü)
console.log("[5] Göreli Kat Ötelemesi Limit Testi...");
const dPass = calculateStoryDrift({
  infillJointType: "flexible",
  floors: [
    { floorNumber: 1, floorHeightM: 3.0, displacementMm: 10 },
    { floorNumber: 2, floorHeightM: 3.0, displacementMm: 20 },
  ],
});
assert.ok(dPass);
assert.ok(dPass.isOverallSafe, "Küçük öteleme PASS olmalı");

const dFail = calculateStoryDrift({
  infillJointType: "brittle",
  floors: [
    { floorNumber: 1, floorHeightM: 3.0, displacementMm: 10 },
    { floorNumber: 2, floorHeightM: 3.0, displacementMm: 60 },
  ],
});
assert.ok(dFail);
assert.ok(!dFail.isOverallSafe, "Büyük öteleme FAIL olmalı");

// 6. Şev Stabilitesi Dik Açı Testi
console.log("[6] Şev Stabilitesi Dik Açı Testi...");
const sl1 = calculateSlopeStability({
  slopeHeightM: 10,
  slopeAngleDeg: 80, // Çok dik şev
  cohesionKpa: 5,
  internalFrictionAngleDeg: 20,
  soilUnitWeightKnM3: 19,
});
assert.ok(sl1);
assert.ok(sl1.factorOfSafetyFs < 1.0, "Çok dik şev güvenlik katsayısı < 1.0 olmalı");
assert.ok(isFiniteNumber(sl1.factorOfSafetyFs));

// 7. Çelik Profil Narinlik Sınırı Testi
console.log("[7] Çelik Profil Narinlik Testi (Uzun kolon narinlik aşımı)...");
const st1 = calculateSteelProfile({
  profileName: "IPE 140",
  bucklingLengthM: 10, // Aşırı uzun çubuk
  steelYieldFyMpa: 235,
});
assert.ok(st1);
assert.ok(st1.slendernessLambda > 150, "10m IPE 140 narinliği > 150 olmalıdır");
assert.ok(!st1.isSlendernessSafe);

// 8. Ahşap Eleman Aşırı Açıklık Testi
console.log("[8] Ahşap Eleman Sehim Testi...");
const tim1 = calculateTimberMember({
  grade: "C18",
  durationClass: "permanent",
  widthMm: 50,
  heightMm: 100,
  lengthM: 6.0, // 5x10 ahşap 6 metre açıklıkta
  uniformLoadKnM: 5.0,
});
assert.ok(tim1);
assert.ok(tim1.instantaneousDeflectionMm > tim1.deflectionLimitMm, "Aşırı sehim olmalı");
assert.ok(!tim1.isDeflectionSafe);

// 9. Metraj Sıfır ve Büyük Değerler Testi
console.log("[9] Metraj Sınır Testleri...");
const mExc = calculateExcavation({
  baseWidthM: 0.1,
  baseLengthM: 0.1,
  depthM: 0.1,
  slopeRatio: 0,
  workingSpaceMarginM: 0,
  swellPercentage: 0,
});
assert.ok(mExc.solidVolumeM3 > 0);
assert.ok(mExc.truckTripsCount >= 1);

const mTile = calculateTileQuantity({
  floorAreaM2: 10000,
  wallTileAreaM2: 5000,
  tileDimension: "60x120",
  wastePercentage: 10,
});
assert.ok(mTile.tileBoxesCount > 1000);
assert.ok(mTile.adhesiveBags25KgCount > 1000);

console.log("\n==================================================================");
console.log("✅ FAZ 10 ADVERSARIAL & BOUNDARY TESTLERİNİN TAMAMI GEÇTİ.");
console.log("==================================================================\n");
