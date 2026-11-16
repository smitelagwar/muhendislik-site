import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateLaboratuvarFee,
  estimateSteelTeamCount,
  resolveDailyConcreteSamples,
  tryCalculateLaboratuvarFee,
  validateLaboratuvarInput,
} from "../../src/lib/calculations/modules/laboratuvar-ucreti";

test("TS 13515 günlük numune tablosu hacim ve alan eşiklerini doğru uygular", () => {
  assert.equal(resolveDailyConcreteSamples(18, 100, "standard"), 8);
  assert.equal(resolveDailyConcreteSamples(45, 220, "standard"), 12);
  assert.equal(resolveDailyConcreteSamples(130, 300, "standard"), 16);
  // Alan kriteri hacimden yüksek numune gerektiriyorsa alan esas alınır
  assert.equal(resolveDailyConcreteSamples(60, 700, "standard"), 20);
  // C55+ yüksek dayanımlı betonda 2 katı numune
  assert.equal(resolveDailyConcreteSamples(45, 220, "high"), 24);
  // 600 m³ üstü her 200 m³ için +4 numune
  assert.equal(resolveDailyConcreteSamples(650, 1200, "standard"), 44);
});

test("TS 708 donatı çeliği takım sayısı tonaja göre doğru hesaplanır", () => {
  assert.equal(estimateSteelTeamCount(0), 0);
  assert.equal(estimateSteelTeamCount(10), 4);
  assert.equal(estimateSteelTeamCount(35), 5);
  assert.equal(estimateSteelTeamCount(75), 6);
  assert.equal(estimateSteelTeamCount(125), 8);
});

test("1.200 m2 5 katlı standart yapı için küp numune hesabı tutarlı ve KDV dahil doğru çıkar", () => {
  const result = calculateLaboratuvarFee({
    area: 1200,
    floors: 5,
    concreteGrade: "standard",
    sampleType: "cube",
  });

  assert.equal(result.pourCount, 11);
  assert.equal(result.sampleCount, 136);
  assert.equal(result.chipCount, 136);
  assert.equal(result.steelTeamCount, 6);
  assert.ok(result.totalGross > result.minGross);
  assert.ok(result.totalGross < result.maxGross);
  assert.equal(result.breakdown.length, 3);
  assert.equal(
    Math.round((result.subtotalNet + result.vatAmount) * 100) / 100,
    result.totalGross
  );
});

test("Silindir numune küpten, C55+ standart betondan daha yüksek maliyet üretir", () => {
  const cube = calculateLaboratuvarFee({
    area: 500,
    floors: 2,
    concreteGrade: "standard",
    sampleType: "cube",
  });
  const cylinder = calculateLaboratuvarFee({
    area: 500,
    floors: 2,
    concreteGrade: "standard",
    sampleType: "cylinder",
  });
  const highGrade = calculateLaboratuvarFee({
    area: 500,
    floors: 2,
    concreteGrade: "high",
    sampleType: "cube",
  });

  assert.ok(cylinder.totalGross > cube.totalGross);
  assert.equal(highGrade.sampleCount, cube.sampleCount * 2);
  assert.equal(highGrade.chipCount, cube.chipCount * 2);
  assert.ok(highGrade.totalGross > cube.totalGross);
});

test("Manuel metraj, çip fiyatı ve ek karot override değerleri hesaplamaya yansır", () => {
  const result = calculateLaboratuvarFee({
    area: 1000,
    floors: 4,
    concreteGrade: "standard",
    sampleType: "cube",
    concreteM3: 300,
    rebarTons: 30,
    pourCount: 6,
    karotCount: 4,
    chipUnitPrice: 115,
  });

  assert.equal(result.estimatedConcreteM3, 300);
  assert.equal(result.estimatedRebarTons, 30);
  assert.equal(result.pourCount, 6);
  assert.equal(result.karotCount, 4);
  assert.equal(result.chipUnitPriceNet, 115);
  assert.equal(result.breakdown.length, 4);
  assert.equal(result.karotCostNet, 7200);
});

test("Geçersiz girdiler reddedilir ve tryCalculateLaboratuvarFee null döner", () => {
  const v1 = validateLaboratuvarInput({
    area: 0,
    floors: 3,
    concreteGrade: "standard",
    sampleType: "cube",
  });
  assert.equal(v1.isValid, false);

  const v2 = validateLaboratuvarInput({
    area: 500,
    floors: 0,
    concreteGrade: "standard",
    sampleType: "cube",
  });
  assert.equal(v2.isValid, false);

  assert.equal(
    tryCalculateLaboratuvarFee({
      area: -100,
      floors: 3,
      concreteGrade: "standard",
      sampleType: "cube",
    }),
    null
  );
});
