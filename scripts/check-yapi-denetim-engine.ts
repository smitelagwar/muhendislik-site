import assert from "node:assert/strict";
import { formatCurrencyTL2 } from "../src/lib/calculations/core";
import {
  calculateYapiDenetimFee,
  tryCalculateYapiDenetimFee,
  validateYapiDenetimInput,
  type YapiDenetimInput,
} from "../src/lib/calculations/modules/yapi-denetim-ucreti";

console.log("--- AŞAMA 2: Saf Hesap Motoru ve Sınır Testleri Başlatılıyor ---");

const EPSILON = 1e-4;

function assertClose(actual: number, expected: number, message: string) {
  const diff = Math.abs(actual - expected);
  assert(
    diff < EPSILON,
    `${message} -> Beklenen: ${expected}, Alınan: ${actual}, Fark: ${diff}`
  );
}

// ------------------------------------------------------------
// 1. REFERANS HESAPLAR (R1 - R4)
// ------------------------------------------------------------

// R1 — 900 m² / III. Sınıf / 1 yıl / Normal
console.log("\n[1] Referans Hesap R1 Kontrolü (900 m² / III. Sınıf / 1 yıl / Normal):");
const r1Input: YapiDenetimInput = {
  area: 900,
  classBand: "III",
  durationYears: 1,
  region: "normal",
};
const r1Result = calculateYapiDenetimFee(r1Input);

assert.equal(r1Result.inspectionGroup, "Grup II");
assert.equal(r1Result.unitCost, 19392);
assert.equal(r1Result.areaBand, "upTo1000");
assert.equal(r1Result.serviceRate, 0.0175);
assert.equal(r1Result.discountRate, 0.0);
assertClose(r1Result.approximateCost, 17452800, "R1 Yaklaşık Maliyet");
assertClose(r1Result.baseServiceFee, 305424, "R1 İndirimsiz Hizmet Bedeli");
assertClose(r1Result.netServiceFee, 305424, "R1 Net Hizmet Bedeli");
assertClose(r1Result.vatAmount, 61084.8, "R1 KDV Tutarı");
assertClose(r1Result.grossTotal, 366508.8, "R1 Genel Toplam");
assert.equal(formatCurrencyTL2(r1Result.netServiceFee), "305.424,00 TL");
assert.equal(formatCurrencyTL2(r1Result.vatAmount), "61.084,80 TL");
assert.equal(formatCurrencyTL2(r1Result.grossTotal), "366.508,80 TL");
assert.equal(r1Result.smallBuilding.applies, false, "R1 için 500 m² kuralı uygulanmamalı");
console.log("✔ R1 hesaplaması ve kuruş formatı tam eşleşti (305.424,00 TL / 366.508,80 TL).");

// R2 — 1.800 m² / III. Sınıf / 2 yıl / Normal
console.log("\n[2] Referans Hesap R2 Kontrolü (1.800 m² / III. Sınıf / 2 yıl / Normal):");
const r2Input: YapiDenetimInput = {
  area: 1800,
  classBand: "III",
  durationYears: 2,
  region: "normal",
};
const r2Result = calculateYapiDenetimFee(r2Input);

assert.equal(r2Result.inspectionGroup, "Grup II");
assert.equal(r2Result.unitCost, 19392);
assert.equal(r2Result.areaBand, "from1000To50000");
assert.equal(r2Result.serviceRate, 0.0158);
assertClose(r2Result.approximateCost, 34905600, "R2 Yaklaşık Maliyet");
assertClose(r2Result.netServiceFee, 551508.48, "R2 Net Hizmet Bedeli");
assertClose(r2Result.vatAmount, 110301.696, "R2 Ham KDV Tutarı");
assertClose(r2Result.grossTotal, 661810.176, "R2 Ham Genel Toplam");
assert.equal(formatCurrencyTL2(r2Result.netServiceFee), "551.508,48 TL");
assert.equal(formatCurrencyTL2(r2Result.vatAmount), "110.301,70 TL");
assert.equal(formatCurrencyTL2(r2Result.grossTotal), "661.810,18 TL");
assert.equal(r2Result.flags.isMultiYear, true, "R2 çok yıllı olmalıdır");
console.log("✔ R2 hesaplaması ve yuvarlama ekran formatı tam eşleşti (110.301,70 TL / 661.810,18 TL).");

// R3 — 10.000 m² / IV–V. Sınıf / 3 yıl / OSB
console.log("\n[3] Referans Hesap R3 Kontrolü (10.000 m² / IV–V. Sınıf / 3 yıl / OSB):");
const r3Input: YapiDenetimInput = {
  area: 10000,
  classBand: "IV_V",
  durationYears: 3,
  region: "osb",
};
const r3Result = calculateYapiDenetimFee(r3Input);

assert.equal(r3Result.inspectionGroup, "Grup III");
assert.equal(r3Result.unitCost, 32320);
assert.equal(r3Result.areaBand, "from1000To50000");
assert.equal(r3Result.serviceRate, 0.0165);
assert.equal(r3Result.discountRate, 0.35);
assertClose(r3Result.approximateCost, 323200000, "R3 Yaklaşık Maliyet");
assertClose(r3Result.baseServiceFee, 5332800, "R3 İndirimsiz Hizmet Bedeli");
assertClose(r3Result.regionalDiscountAmount, 1866480, "R3 Bölgesel İndirim Tutarı");
assertClose(r3Result.netServiceFee, 3466320, "R3 Net Hizmet Bedeli");
assertClose(r3Result.vatAmount, 693264, "R3 KDV Tutarı");
assertClose(r3Result.grossTotal, 4159584, "R3 Genel Toplam");
assert.equal(formatCurrencyTL2(r3Result.netServiceFee), "3.466.320,00 TL");
assert.equal(formatCurrencyTL2(r3Result.grossTotal), "4.159.584,00 TL");
assert.equal(r3Result.flags.isOver3000, true, "10.000 m² için isOver3000 true olmalıdır");
console.log("✔ R3 hesaplaması (%35 OSB indirimi) tam eşleşti (Net: 3.466.320,00 TL / Toplam: 4.159.584,00 TL).");

// R4 — 400 m² / III. Sınıf / 1 yıl / Normal
console.log("\n[4] Referans Hesap R4 Kontrolü (400 m² / III. Sınıf / 1 yıl / Normal):");
const r4Input: YapiDenetimInput = {
  area: 400,
  classBand: "III",
  durationYears: 1,
  region: "normal",
};
const r4Result = calculateYapiDenetimFee(r4Input);

assert.equal(r4Result.inspectionGroup, "Grup II");
assertClose(r4Result.approximateCost, 7756800, "R4 Yaklaşık Maliyet");
assert.equal(r4Result.serviceRate, 0.0175);
assertClose(r4Result.netServiceFee, 135744, "R4 Standart Net Hizmet Bedeli");
assertClose(r4Result.vatAmount, 27148.8, "R4 Standart KDV Tutarı");
assertClose(r4Result.grossTotal, 162892.8, "R4 Standart Genel Toplam");
assert.equal(formatCurrencyTL2(r4Result.netServiceFee), "135.744,00 TL");
assert.equal(formatCurrencyTL2(r4Result.grossTotal), "162.892,80 TL");

// R4 Azami %3,50 alternatifi
assert.equal(r4Result.smallBuilding.applies, true, "400 m² için smallBuilding applies true olmalıdır");
assert.equal(r4Result.smallBuilding.maxRate, 0.035, "Azami oran %3,50 olmalıdır");
assertClose(r4Result.smallBuilding.maxNetServiceFee, 271488, "R4 Azami Net Hizmet Bedeli");
assertClose(r4Result.smallBuilding.maxVatAmount, 54297.6, "R4 Azami KDV Tutarı");
assertClose(r4Result.smallBuilding.maxGrossTotal, 325785.6, "R4 Azami Genel Toplam");
assert.equal(formatCurrencyTL2(r4Result.smallBuilding.maxNetServiceFee), "271.488,00 TL");
assert.equal(formatCurrencyTL2(r4Result.smallBuilding.maxGrossTotal), "325.785,60 TL");

// Ana sonuç 135.744,00 TL kalmalı; azami oran ana sonucu değiştirmemeli
assert.equal(r4Result.netServiceFee, 135744);
console.log("✔ R4 standart sonuç (135.744,00 TL) ve alternatif azami %3,50 tahmini (271.488,00 TL) doğrulandı.");

// ------------------------------------------------------------
// 2. KESİN SINIR TESTLERİ (500 / 1000 / 3000 / 50000 / 200 m²)
// ------------------------------------------------------------
console.log("\n[5] Sınır Testleri:");

// 500 m² Sınırı
const below500 = calculateYapiDenetimFee({ area: 499.99, classBand: "III", durationYears: 1, region: "normal" });
const exact500 = calculateYapiDenetimFee({ area: 500.00, classBand: "III", durationYears: 1, region: "normal" });
const above500 = calculateYapiDenetimFee({ area: 500.01, classBand: "III", durationYears: 1, region: "normal" });
assert.equal(below500.smallBuilding.applies, true, "499.99 m² için smallBuilding true olmalı");
assert.equal(exact500.smallBuilding.applies, true, "500.00 m² için smallBuilding true olmalı");
assert.equal(above500.smallBuilding.applies, false, "500.01 m² için smallBuilding false olmalı");
assert.equal(above500.smallBuilding.maxGrossTotal, 0, "500.01 m² için maxGrossTotal sıfır olmalı");
console.log("✔ 500 m² sınırı (499.99 / 500.00 / 500.01) doğrulandı.");

// 1.000 m² Sınırı
const below1000 = calculateYapiDenetimFee({ area: 999.99, classBand: "III", durationYears: 1, region: "normal" });
const exact1000 = calculateYapiDenetimFee({ area: 1000.00, classBand: "III", durationYears: 1, region: "normal" });
const above1000 = calculateYapiDenetimFee({ area: 1000.01, classBand: "III", durationYears: 1, region: "normal" });
assert.equal(below1000.areaBand, "upTo1000");
assert.equal(below1000.serviceRate, 0.0175);
assert.equal(exact1000.areaBand, "upTo1000");
assert.equal(exact1000.serviceRate, 0.0175);
assert.equal(above1000.areaBand, "from1000To50000");
assert.equal(above1000.serviceRate, 0.0150);
console.log("✔ 1.000 m² sınırı (999.99 / 1000.00 / 1000.01) doğrulandı.");

// 3.000 m² Hakediş / Taksit Sınırı
const below3000 = calculateYapiDenetimFee({ area: 2999.99, classBand: "III", durationYears: 1, region: "normal" });
const exact3000 = calculateYapiDenetimFee({ area: 3000.00, classBand: "III", durationYears: 1, region: "normal" });
const above3000 = calculateYapiDenetimFee({ area: 3000.01, classBand: "III", durationYears: 1, region: "normal" });
assert.equal(below3000.flags.isOver3000, false);
assert.equal(exact3000.flags.isOver3000, false);
assert.equal(above3000.flags.isOver3000, true);
console.log("✔ 3.000 m² hakediş/ödeme sınırı (2999.99 / 3000.00 / 3000.01) doğrulandı.");

// 50.000 m² Sınırı
const below50000 = calculateYapiDenetimFee({ area: 49999.99, classBand: "III", durationYears: 1, region: "normal" });
const exact50000 = calculateYapiDenetimFee({ area: 50000.00, classBand: "III", durationYears: 1, region: "normal" });
const above50000 = calculateYapiDenetimFee({ area: 50000.01, classBand: "III", durationYears: 1, region: "normal" });
assert.equal(below50000.areaBand, "from1000To50000");
assert.equal(below50000.serviceRate, 0.0150);
assert.equal(exact50000.areaBand, "from1000To50000");
assert.equal(exact50000.serviceRate, 0.0150);
assert.equal(above50000.areaBand, "over50000");
assert.equal(above50000.serviceRate, 0.0125);
console.log("✔ 50.000 m² sınırı (49999.99 / 50000.00 / 50000.01) doğrulandı.");

// 200 m² Kapsam İnceleme Sınırı
const below200 = calculateYapiDenetimFee({ area: 199.99, classBand: "III", durationYears: 1, region: "normal" });
const exact200 = calculateYapiDenetimFee({ area: 200.00, classBand: "III", durationYears: 1, region: "normal" });
const above200 = calculateYapiDenetimFee({ area: 200.01, classBand: "III", durationYears: 1, region: "normal" });
assert.equal(below200.flags.possibleScopeReview, true);
assert.equal(exact200.flags.possibleScopeReview, true);
assert.equal(above200.flags.possibleScopeReview, false);
console.log("✔ 200 m² kapsam inceleme uyarısı sınırı (199.99 / 200.00 / 200.01) doğrulandı.");

// ------------------------------------------------------------
// 3. EŞİK SÜREKSİZLİĞİ REGRESYON TESTİ (2.7)
// ------------------------------------------------------------
console.log("\n[6] Eşik Süreksizliği (Discontinuity) Regresyon Testi:");
// Grup II / 1 yıl için 1000 m² -> 1000.01 m² geçişinde oran %1,75'ten %1,50'ye düştüğü için
// toplam ücret yasal olarak düşer. Bu mevzuatın sonucudur, smooth yapılamaz.
const feeAt1000 = exact1000.netServiceFee;
const feeAt1000_01 = above1000.netServiceFee;
assert(
  feeAt1000_01 < feeAt1000,
  `Eşik süreksizliği korunmalıdır: fee(1000.01 m²) [${feeAt1000_01} TL] < fee(1000 m²) [${feeAt1000} TL]`
);
console.log(`✔ Yasal eşik süreksizliği korundu: 1.000 m² = ${feeAt1000.toFixed(2)} TL > 1.000,01 m² = ${feeAt1000_01.toFixed(2)} TL.`);

// ------------------------------------------------------------
// 4. TÜM BÖLGESEL İNDİRİMLERİN TESTİ (6 BÖLGE)
// ------------------------------------------------------------
console.log("\n[7] Tüm Bölgesel İndirim Türleri Testi:");
const testRegions = [
  { region: "normal" as const, expectedRate: 0.0 },
  { region: "endustri" as const, expectedRate: 0.20 },
  { region: "osb" as const, expectedRate: 0.35 },
  { region: "tgb" as const, expectedRate: 0.35 },
  { region: "serbest" as const, expectedRate: 0.35 },
  { region: "sanayi_sitesi" as const, expectedRate: 0.35 },
];

for (const { region, expectedRate } of testRegions) {
  const res = calculateYapiDenetimFee({ area: 2000, classBand: "III", durationYears: 1, region });
  assert.equal(res.discountRate, expectedRate, `${region} indirim oranı hatalı`);
  const expectedDiscount = res.baseServiceFee * expectedRate;
  assertClose(res.regionalDiscountAmount, expectedDiscount, `${region} indirim tutarı hatalı`);
  assertClose(res.netServiceFee, res.baseServiceFee - expectedDiscount, `${region} net tutar hatalı`);
}
console.log("✔ 6 bölgesel indirim seçeneğinin tamamı test edildi.");

// ------------------------------------------------------------
// 5. TÜM SÜRELERİN (1-5 YIL) VE TÜM ALAN BANTLARININ TESTİ
// ------------------------------------------------------------
console.log("\n[8] 1–5 Yıl x 3 Alan Bandı Matris Testi:");
const testDurations: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];
const testAreas = [
  { area: 500, band: "upTo1000" },
  { area: 5000, band: "from1000To50000" },
  { area: 75000, band: "over50000" },
];

for (const duration of testDurations) {
  for (const { area, band } of testAreas) {
    const res = calculateYapiDenetimFee({ area, classBand: "I_II", durationYears: duration, region: "normal" });
    assert.equal(res.areaBand, band);
    assert(res.serviceRate > 0 && res.serviceRate < 0.05, `Süre ${duration} yıl / alan ${area} m² oranı makul olmalı`);
    assert(res.grossTotal > res.netServiceFee, "Brüt toplam netten büyük olmalı");
  }
}
console.log("✔ 15 kombinasyonun tamamı başarıyla hesaplandı.");

// ------------------------------------------------------------
// 6. ADVERSARIAL VE GEÇERSİZ GİRDİ (INVALID INPUT) GÜVENLİK TESTLERİ
// ------------------------------------------------------------
console.log("\n[9] Geçersiz Girdi (Validation / Adversarial) Testleri:");

const invalidInputs = [
  null,
  undefined,
  {},
  { area: 0, classBand: "III", durationYears: 1, region: "normal" },
  { area: -100, classBand: "III", durationYears: 1, region: "normal" },
  { area: NaN, classBand: "III", durationYears: 1, region: "normal" },
  { area: Infinity, classBand: "III", durationYears: 1, region: "normal" },
  { area: "bin m2", classBand: "III", durationYears: 1, region: "normal" },
  { area: 1000, classBand: "VI", durationYears: 1, region: "normal" }, // geçersiz sınıf
  { area: 1000, classBand: "III", durationYears: 0, region: "normal" }, // geçersiz süre
  { area: 1000, classBand: "III", durationYears: 6, region: "normal" }, // geçersiz süre
  { area: 1000, classBand: "III", durationYears: 2.5, region: "normal" }, // ondalıklı yıl
  { area: 1000, classBand: "III", durationYears: 1, region: "ozel_bolge" }, // geçersiz bölge
  { area: 50_000_000, classBand: "III", durationYears: 1, region: "normal" }, // teknik limit aşımı
];

for (const invalid of invalidInputs) {
  // calculateYapiDenetimFee hata fırlatmalıdır
  assert.throws(
    () => calculateYapiDenetimFee(invalid as any),
    (err: Error) => err.message.length > 0,
    `Geçersiz girdi için hata fırlatılmalı: ${JSON.stringify(invalid)}`
  );

  // tryCalculateYapiDenetimFee null dönmelidir
  const safeRes = tryCalculateYapiDenetimFee(invalid);
  assert.equal(safeRes, null, `tryCalculateYapiDenetimFee null dönmeli: ${JSON.stringify(invalid)}`);

  // validateYapiDenetimInput isValid: false dönmelidir
  const valRes = validateYapiDenetimInput(invalid);
  assert.equal(valRes.isValid, false);
}
// [10] Ödeme Modeli ve 6 Etaplık Hakediş Dağılımı Testleri (Madde 27)
console.log("\n[10] Ödeme Modeli ve Hakediş Dağılımı Kontrolü (Madde 27):");
// 900 m² (<= 3000): Defaten ödeme
assert.equal(r1Result.paymentModel.isUpfrontMandatory, true, "900 m² için defaten zorunlu olmalıdır");
assert(r1Result.paymentModel.modalityBadge.includes("Defaten"), "Defaten badge içermelidir");
assert.equal(r1Result.paymentModel.installments.length, 6, "6 etap bulunmalıdır");

const sumPercentages = r1Result.paymentModel.installments.reduce((sum, inst) => sum + inst.percentage, 0);
assertClose(sumPercentages, 1.0, "Etap yüzdeleri toplamı %100 olmalıdır");

const sumGross = r1Result.paymentModel.installments.reduce((sum, inst) => sum + inst.grossAmount, 0);
assertClose(sumGross, r1Result.grossTotal, "Etap genel toplamları genel toplama eşit olmalıdır");

const sumNet = r1Result.paymentModel.installments.reduce((sum, inst) => sum + inst.netAmount, 0);
assertClose(sumNet, r1Result.netServiceFee, "Etap net toplamları net hizmet bedeline eşit olmalıdır");

// 10.000 m² (> 3000): Taksitli ödeme seçeneği
assert.equal(r3Result.paymentModel.isUpfrontMandatory, false, "10.000 m² için taksitli seçenek olmalıdır");
assert(r3Result.paymentModel.modalityBadge.includes("Taksitli"), "Taksitli badge içermelidir");

const r3SumGross = r3Result.paymentModel.installments.reduce((sum, inst) => sum + inst.grossAmount, 0);
assertClose(r3SumGross, r3Result.grossTotal, "R3 etap genel toplamları tam denkleşmelidir");
console.log("✔ 3.000 m² altı (defaten) ve üstü (taksitli) ödeme modelleri ve 6 etaplık kuruş denkliği doğrulandı.");

console.log("\n============================================================");
console.log("AŞAMA 2 TÜM KABUL KRİTERLERİ BAŞARIYLA GEÇTİ (PASS)");
console.log("============================================================");
