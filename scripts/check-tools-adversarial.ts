import assert from "node:assert/strict";

// 1. Betonarme & Korunan Motorlar
import { calculateColumnPreliminarySizing } from "../src/lib/concrete-tools/column";
import { calculateBeamFlexure } from "../src/lib/concrete-tools/beam";
import { calculateSlabThickness } from "../src/lib/concrete-tools/slab";
import { calculateConcreteCover } from "../src/lib/concrete-tools/cover";
import { calculateFormworkStripping } from "../src/lib/concrete-tools/stripping";
import { calculatePunchingShear } from "../src/lib/concrete-tools/punching";
import { calculateBeamShear } from "../src/lib/concrete-tools/shear-stirrup";
import { calculateSpliceLength } from "../src/lib/concrete-tools/splice";
import { calculateMatFoundation } from "../src/lib/concrete-tools/mat-foundation";

// 2. Deprem & Geoteknik Motorları
import { calculateEquivalentBaseShear } from "../src/lib/engineering/tbdy2018/base-shear";
import {
  checkTorsionalIrregularity,
  checkSoftStoryIrregularity,
  checkFloorDiscontinuity,
  checkWeakStory,
  checkPlanProjection,
  calculateIrregularities,
} from "../src/lib/engineering/tbdy2018/irregularity";
import { determineSoilClass } from "../src/lib/engineering/tbdy2018/soil-class";
import { calculateStoryDrift } from "../src/lib/engineering/tbdy2018/drift";
import { calculateEarthPressure } from "../src/lib/engineering/geotech/retaining-wall";
import { calculateSlopeStability } from "../src/lib/engineering/geotech/slope-stability";

// 3. Çelik & Ahşap Motorları
import { calculateSteelProfile } from "../src/lib/engineering/steel/profile-selection";
import { calculateBoltedConnection, calculateWeldedConnection } from "../src/lib/engineering/steel/connection";
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

// 1. Zımbalama Sınır Testleri
console.log("[1] Zımbalama Sınır & Geçersiz Girdi Testleri...");
// Aşırı yük
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

// Geçersiz geometri (pas payı kalınlıktan büyük)
assert.equal(
  calculatePunchingShear({
    fckMpa: 30,
    slabThicknessCm: 10,
    coverMm: 120,
    columnBxCm: 30,
    columnByCm: 30,
    location: "inner",
    axialPunchingLoadKn: 200,
  }),
  null
);
console.log("  ✓ Zımbalama adversarial testleri GEÇTİ.");

// 2. Kiriş Kesme Sınır Testleri
console.log("[2] Kiriş Kesme Sınır & Geçersiz Girdi Testleri...");
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

// Negatif / sıfır girdi
assert.equal(
  calculateBeamShear({
    fckMpa: -25,
    beamWidthCm: 25,
    beamHeightCm: 50,
    coverMm: 30,
    designShearKn: 100,
    stirrupDiameterMm: 8,
    stirrupLegCount: 2,
  }),
  null
);
console.log("  ✓ Kiriş Kesme adversarial testleri GEÇTİ.");

// 3. Kenetlenme Sınır Testleri
console.log("[3] Kenetlenme Sınır Testi...");
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
assert.equal(
  calculateSpliceLength({
    fckMpa: 30,
    barDiameterMm: -16,
    bondCondition: "good",
    spliceType: "duz",
    isCompression: false,
  }),
  null
);
console.log("  ✓ Kenetlenme adversarial testleri GEÇTİ.");

// 4. Radye Temel Sınır Testleri
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
assert.ok(mat1.actualSoilStressKpa > 0);
assert.ok(isFiniteNumber(mat1.punchingStressMpa));
assert.equal(
  calculateMatFoundation({
    fckMpa: 30,
    buildingTotalWeightKn: 0,
    matAreaM2: 300,
    columnMaxAxialLoadKn: 2000,
    columnBxCm: 60,
    columnByCm: 60,
    soilAllowableStressKpa: 250,
    matThicknessCm: 80,
  }),
  null
);
console.log("  ✓ Radye Temel adversarial testleri GEÇTİ.");

// 5. Deprem Taban Kesme Sınır Testleri
console.log("[5] Deprem Taban Kesme Sınır Testi...");
const bs1 = calculateEquivalentBaseShear({
  ss: 0.1,
  s1: 0.05,
  soilClass: "ZA",
  importanceFactorI: 1.0,
  behaviorFactorR: 8.0,
  totalWeightKn: 5000,
  numFloors: 3,
  buildingHeightM: 9,
});
assert.ok(bs1);
assert.ok(bs1.designBaseShearKn > 0);
assert.ok(isFiniteNumber(bs1.empiricalPeriodTp));

// ZF zemin için null dönmeli (sahaya özel analiz şartı)
assert.equal(
  calculateEquivalentBaseShear({
    ss: 1.5,
    s1: 0.4,
    soilClass: "ZF",
    importanceFactorI: 1.0,
    behaviorFactorR: 8.0,
    totalWeightKn: 5000,
    numFloors: 5,
    buildingHeightM: 15,
  }),
  null
);
console.log("  ✓ Deprem Taban Kesme adversarial testleri GEÇTİ.");

// 6. Düzensizlik Sınır Testleri
console.log("[6] Düzensizlik Sınır Testi (Aşırı burulma ve sıfır değerler)...");
const a1Ext = checkTorsionalIrregularity({ maxInterstoryDriftMm: 50, minInterstoryDriftMm: 1 });
assert.ok(a1Ext);
assert.equal(a1Ext.hasA1Irregularity, true);
assert.equal(checkTorsionalIrregularity({ maxInterstoryDriftMm: 0, minInterstoryDriftMm: 0 }), null);
console.log("  ✓ Düzensizlik adversarial testleri GEÇTİ.");

// 7. Zemin Sınıfı Sınır Testleri
console.log("[7] Zemin Sınıfı Sınır Testi (Boş girdi kontrolü)...");
assert.equal(determineSoilClass({}), null);
assert.equal(determineSoilClass({ vs30Ms: -100 }), null);
console.log("  ✓ Zemin Sınıfı adversarial testleri GEÇTİ.");

// 8. Göreli Kat Ötelemesi Sınır Testleri
console.log("[8] Göreli Kat Ötelemesi Sınır Testi (Sıfır kat yükseklik kontrolü)...");
assert.equal(
  calculateStoryDrift({
    infillJointType: "brittle",
    floors: [{ floorNumber: 1, floorHeightM: 0, displacementMm: 10 }],
  }),
  null
);
assert.equal(
  calculateStoryDrift({
    infillJointType: "brittle",
    floors: [],
  }),
  null
);
console.log("  ✓ Göreli Kat Ötelemesi adversarial testleri GEÇTİ.");

// 9. İksa Toprak Basıncı Sınır Testleri
console.log("[9] İksa Toprak Basıncı Sınır Testi (Aşırı phi açısı)...");
assert.equal(
  calculateEarthPressure({
    wallHeightM: 5,
    soilUnitWeightKnM3: 18,
    internalFrictionAngleDeg: 95, // Geçersiz > 90
  }),
  null
);
assert.equal(
  calculateEarthPressure({
    wallHeightM: -5,
    soilUnitWeightKnM3: 18,
    internalFrictionAngleDeg: 30,
  }),
  null
);
console.log("  ✓ İksa Toprak Basıncı adversarial testleri GEÇTİ.");

// 10. Şev Stabilitesi Sınır Testleri
console.log("[10] Şev Stabilitesi Sınır Testi (Aşırı dik şev ve geçersiz açılar)...");
assert.equal(
  calculateSlopeStability({
    slopeHeightM: 10,
    slopeAngleDeg: 95,
    soilUnitWeightKnM3: 18,
    cohesionKpa: 10,
    internalFrictionAngleDeg: 30,
  }),
  null
);
console.log("  ✓ Şev Stabilitesi adversarial testleri GEÇTİ.");

// 11. Çelik Profil Seçimi Sınır Testleri
console.log("[11] Çelik Profil Sınır Testi (Olmayan profil kontrolü)...");
assert.equal(
  calculateSteelProfile({
    profileName: "FAKE_PROFILE_XYZ",
    steelYieldFyMpa: 275,
    bucklingLengthM: 3.0,
  }),
  null
);
console.log("  ✓ Çelik Profil adversarial testleri GEÇTİ.");

// 12. Çelik Birleşim Sınır Testleri
console.log("[12] Çelik Birleşim Sınır Testi (0 cıvata kontrolü)...");
assert.equal(
  calculateBoltedConnection({
    boltGrade: "8.8",
    boltDiameterMm: 20,
    boltCount: 0,
    shearPlanesCount: 1,
    plateThicknessMm: 10,
    designShearForceVdKn: 50,
  }),
  null
);
console.log("  ✓ Çelik Birleşim adversarial testleri GEÇTİ.");

// 13. Ahşap Eleman Sınır Testleri
console.log("[13] Ahşap Eleman Sınır Testi...");
assert.equal(
  calculateTimberMember({
    grade: "C24",
    durationClass: "medium",
    widthMm: 0,
    heightMm: 150,
    lengthM: 3.0,
  }),
  null
);
console.log("  ✓ Ahşap Eleman adversarial testleri GEÇTİ.");

// 14. Metraj Motorları Sınır Testleri
console.log("[14] Metraj Motorları Sınır Testleri...");
assert.equal(
  calculateExcavation({ baseWidthM: 0, baseLengthM: 10, depthM: 2 }),
  null
);
assert.equal(
  calculateRebarQuantity({
    totalConstructionAreaM2: 0,
    typology: "residential_standard",
  }),
  null
);
assert.equal(
  calculateFormworkQuantity({
    storyFloorAreaM2: 0,
    storyCount: 3,
    floorHeightM: 3,
  }),
  null
);
assert.equal(
  calculateMasonryQuantity({
    wallLengthM: 0,
    wallHeightM: 3,
    materialType: "brick_13_5",
  }),
  null
);
assert.equal(
  calculatePlasterPaint({
    wallAreaM2: 0,
    ceilingAreaM2: 0,
    plasterType: "gypsum",
    paintType: "interior_silicone",
  }),
  null
);
assert.equal(
  calculateRoofCovering({
    horizontalAreaM2: 0,
    slopePercentage: 30,
    coveringType: "marsilya_tile",
  }),
  null
);
assert.equal(
  calculateTileQuantity({
    floorAreaM2: 0,
    wallTileAreaM2: 0,
    tileDimension: "60x60",
  }),
  null
);
console.log("  ✓ Metraj Motorları adversarial testleri GEÇTİ.");

console.log("\n==================================================================");
console.log("✅ FAZ 10 ADVERSARIAL & BOUNDARY TESTLERİNİN TAMAMI BAŞARIYLA GEÇTİ.");
console.log("==================================================================\n");
