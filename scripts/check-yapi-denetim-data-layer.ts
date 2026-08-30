import assert from "node:assert/strict";
import { formatCurrencyTL2, formatTL } from "../src/lib/calculations/core";
import {
  YAPI_DENETIM_EFFECTIVE_YEAR,
  YAPI_DENETIM_VAT_RATE,
  SMALL_BUILDING_MAX_RATE,
  SMALL_BUILDING_AREA_THRESHOLD,
  SCOPE_REVIEW_AREA_THRESHOLD,
  INSTALLMENT_AREA_THRESHOLD,
  FIRST_AREA_BAND_MAX,
  SECOND_AREA_BAND_MAX,
  YAPI_DENETIM_UNIT_COSTS,
  INSPECTION_CLASS_GROUP_OPTIONS,
  YAPI_DENETIM_RATE_TABLE,
  REGIONAL_DISCOUNT_OPTIONS,
  INSTALLMENT_STAGES,
  YAPI_DENETIM_SOURCE_METADATA,
  mapOfficialClassToInspectionGroup,
  resolveAreaBand,
  getAreaBandLabel,
} from "../src/lib/calculations/modules/yapi-denetim-ucreti";
import { OFFICIAL_UNIT_COSTS_2026 } from "../src/lib/calculations/official-unit-costs/official-unit-costs-2026";

console.log("--- AŞAMA 1: 2026 Yapı Denetimi Veri Katmanı ve Doğrulama Kontrolleri Başlatılıyor ---");

// 1. Yıl ve Temel Oran Sabitleri
assert.equal(YAPI_DENETIM_EFFECTIVE_YEAR, 2026, "Veri yılı 2026 olmalıdır");
assert.equal(YAPI_DENETIM_VAT_RATE, 0.20, "KDV oranı %20 (0.20) olmalıdır");
assert.equal(SMALL_BUILDING_MAX_RATE, 0.035, "500 m² ve altı azami hizmet bedeli oranı %3,50 (0.035) olmalıdır");
assert.equal(SMALL_BUILDING_AREA_THRESHOLD, 500, "Küçük yapı alan eşiği 500 m² olmalıdır");
assert.equal(SCOPE_REVIEW_AREA_THRESHOLD, 200, "Kapsam inceleme alan eşiği 200 m² olmalıdır");
assert.equal(INSTALLMENT_AREA_THRESHOLD, 3000, "Hakediş taksit eşiği 3000 m² olmalıdır");
assert.equal(FIRST_AREA_BAND_MAX, 1000, "Birinci alan bandı üst sınırı 1000 m² olmalıdır");
assert.equal(SECOND_AREA_BAND_MAX, 50000, "İkinci alan bandı üst sınırı 50000 m² olmalıdır");
console.log("✔ Temel mevzuat ve oran sabitleri doğrulandı.");

// 2. 2026 Yapı Denetimi Birim Maliyetleri (Grup I, II, III)
assert.equal(YAPI_DENETIM_UNIT_COSTS.I_II, 6464, "Grup I birim maliyeti 6.464 TL/m² olmalıdır");
assert.equal(YAPI_DENETIM_UNIT_COSTS.III, 19392, "Grup II birim maliyeti 19.392 TL/m² olmalıdır");
assert.equal(YAPI_DENETIM_UNIT_COSTS.IV_V, 32320, "Grup III birim maliyeti 32.320 TL/m² olmalıdır");

assert.equal(INSPECTION_CLASS_GROUP_OPTIONS.length, 3, "3 adet denetim grubu seçeneği olmalıdır");
const group1 = INSPECTION_CLASS_GROUP_OPTIONS.find((g) => g.id === "I_II");
const group2 = INSPECTION_CLASS_GROUP_OPTIONS.find((g) => g.id === "III");
const group3 = INSPECTION_CLASS_GROUP_OPTIONS.find((g) => g.id === "IV_V");
assert(group1 && group1.unitCostTL === 6464, "Grup I seçeneği 6.464 TL olmalıdır");
assert(group2 && group2.unitCostTL === 19392, "Grup II seçeneği 19.392 TL olmalıdır");
assert(group3 && group3.unitCostTL === 32320, "Grup III seçeneği 32.320 TL olmalıdır");
console.log("✔ 3 denetim grubunun 2026 birim maliyetleri (6.464 / 19.392 / 32.320) doğrulandı.");

// 3. 15 Hücreli Hizmet Bedeli Oran Cetveli
const expectedRateTable = {
  1: { upTo1000: 0.0175, from1000To50000: 0.0150, over50000: 0.0125 },
  2: { upTo1000: 0.0184, from1000To50000: 0.0158, over50000: 0.0131 },
  3: { upTo1000: 0.0193, from1000To50000: 0.0165, over50000: 0.0138 },
  4: { upTo1000: 0.0203, from1000To50000: 0.0174, over50000: 0.0145 },
  5: { upTo1000: 0.0213, from1000To50000: 0.0182, over50000: 0.0152 },
} as const;

for (let y = 1; y <= 5; y++) {
  const duration = y as 1 | 2 | 3 | 4 | 5;
  const row = YAPI_DENETIM_RATE_TABLE[duration];
  const expected = expectedRateTable[duration];
  assert.equal(row.upTo1000, expected.upTo1000, `${duration} yıl için A<=1000 oranı hatalı`);
  assert.equal(row.from1000To50000, expected.from1000To50000, `${duration} yıl için 1000<A<=50000 oranı hatalı`);
  assert.equal(row.over50000, expected.over50000, `${duration} yıl için A>50000 oranı hatalı`);
}
console.log("✔ 15 hücreli hizmet oranı cetveli (1–5 yıl × 3 alan bandı) eksiksiz doğrulandı.");

// 4. Bölgesel İndirimler
assert.equal(REGIONAL_DISCOUNT_OPTIONS.length, 6, "6 adet bölgesel indirim seçeneği olmalıdır");
const discountMap = Object.fromEntries(REGIONAL_DISCOUNT_OPTIONS.map((d) => [d.id, d.discountRate]));
assert.equal(discountMap.normal, 0.0, "Normal bölge indirimi %0 olmalıdır");
assert.equal(discountMap.endustri, 0.20, "Endüstri bölgesi indirimi %20 olmalıdır");
assert.equal(discountMap.osb, 0.35, "OSB indirimi %35 olmalıdır");
assert.equal(discountMap.tgb, 0.35, "TGB indirimi %35 olmalıdır");
assert.equal(discountMap.serbest, 0.35, "Serbest bölge indirimi %35 olmalıdır");
assert.equal(discountMap.sanayi_sitesi, 0.35, "Sanayi sitesi indirimi %35 olmalıdır");
// %50 kanun tavanının indirim oranı olarak seçilmediğini doğrula
assert(
  !REGIONAL_DISCOUNT_OPTIONS.some((d) => d.discountRate === 0.5),
  "Kanundaki %50 yetki üst sınırı somut indirim oranı olarak yer almamalıdır"
);
console.log("✔ 6 bölgesel indirim seçeneği (%0, %20, %35) ve %50 koruması doğrulandı.");

// 5. Hakediş Etapları
assert.equal(INSTALLMENT_STAGES.length, 6, "6 hakediş etabı olmalıdır");
const totalPercentage = INSTALLMENT_STAGES.reduce((sum, s) => sum + s.percentage, 0);
assert.equal(Math.round(totalPercentage * 100) / 100, 1.0, "Hakediş etapları toplamı %100 olmalıdır");
assert.deepEqual(
  INSTALLMENT_STAGES.map((s) => s.percentage),
  [0.10, 0.10, 0.40, 0.20, 0.15, 0.05],
  "Hakediş etapları %10 + %10 + %40 + %20 + %15 + %5 oranlarına uymalıdır"
);
console.log("✔ Hakediş etapları (10/10/40/20/15/5) doğrulandı.");

// 6. Resmî 2026 Sınıflarının Eşlenmesi ve V-E Doğrulaması
assert(OFFICIAL_UNIT_COSTS_2026.length >= 18, "En az 18 adet resmî 2026 sınıfı bulunmalıdır");
const veRow = OFFICIAL_UNIT_COSTS_2026.find((r) => r.sinifKodu === "V-E");
assert(veRow, "V-E sınıfı OFFICIAL_UNIT_COSTS_2026 içinde mutlaka var olmalıdır");
assert.equal(veRow.m2BirimMaliyet, 103500, "V-E resmî birim maliyeti 103.500 TL olmalıdır");

// Her resmî sınıfın doğru denetim grubuna eşleştiğini doğrula:
for (const row of OFFICIAL_UNIT_COSTS_2026) {
  const mapped = mapOfficialClassToInspectionGroup(row.sinifKodu);
  if (row.anaGrupKodu === "I" || row.anaGrupKodu === "II") {
    assert.equal(
      mapped,
      "I_II",
      `${row.sinifKodu} (${row.anaGrupKodu}) Grup I (I_II) olarak eşleşmelidir`
    );
  } else if (row.anaGrupKodu === "III") {
    assert.equal(
      mapped,
      "III",
      `${row.sinifKodu} (${row.anaGrupKodu}) Grup II (III) olarak eşleşmelidir`
    );
  } else if (row.anaGrupKodu === "IV" || row.anaGrupKodu === "V") {
    assert.equal(
      mapped,
      "IV_V",
      `${row.sinifKodu} (${row.anaGrupKodu}) Grup III (IV_V) olarak eşleşmelidir`
    );
  }
}
console.log(`✔ Resmî 2026 sınıflarının tamamı (${OFFICIAL_UNIT_COSTS_2026.length} adet, V-E dahil) doğru denetim gruplarına eşleşti.`);

// 7. Alan Bandı Sınır Tespit Fonksiyonu
assert.equal(resolveAreaBand(500), "upTo1000");
assert.equal(resolveAreaBand(999.99), "upTo1000");
assert.equal(resolveAreaBand(1000.00), "upTo1000");
assert.equal(resolveAreaBand(1000.01), "from1000To50000");
assert.equal(resolveAreaBand(49999.99), "from1000To50000");
assert.equal(resolveAreaBand(50000.00), "from1000To50000");
assert.equal(resolveAreaBand(50000.01), "over50000");
assert.equal(getAreaBandLabel("upTo1000"), "A ≤ 1.000 m²");
assert.equal(getAreaBandLabel("from1000To50000"), "1.000 < A ≤ 50.000 m²");
assert.equal(getAreaBandLabel("over50000"), "A > 50.000 m²");
console.log("✔ Alan bandı sınır tespitleri (1.000 ve 50.000 m² eşikleri) doğrulandı.");

// 8. Para Formatlayıcı ve Kuruş Hassasiyeti (formatCurrencyTL2)
// Plan beklentileri:
// 305424       -> 305.424,00 TL
// 110301.696   -> 110.301,70 TL
assert.equal(formatCurrencyTL2(305424), "305.424,00 TL");
assert.equal(formatCurrencyTL2(110301.696), "110.301,70 TL");
assert.equal(formatCurrencyTL2(0), "0,00 TL");
assert.equal(formatCurrencyTL2(NaN), "0,00 TL");
assert.equal(formatCurrencyTL2(Infinity), "0,00 TL");
// Eski formatTL() helper'ının geriye dönük uyumluluğunu test et
assert.equal(formatTL(305424), "305.424 TL");
assert.equal(formatTL(110301.696), "110.302 TL");
console.log("✔ Yeni kuruş koruyan formatCurrencyTL2 ve mevcut formatTL regresyonsuz doğrulandı.");

// 9. Kaynak Metadatası
assert(YAPI_DENETIM_SOURCE_METADATA.lawNo === "4708", "Mevzuat no 4708 olmalıdır");
assert(YAPI_DENETIM_SOURCE_METADATA.effectiveYear === 2026, "Yıl 2026 olmalıdır");
assert(YAPI_DENETIM_SOURCE_METADATA.sourceUrl.includes("4708"), "Kaynak URL 4708 içermelidir");
assert(YAPI_DENETIM_SOURCE_METADATA.averageIncreasePercent === 29.28, "Artış oranı %29,28 olmalıdır");
assert(YAPI_DENETIM_SOURCE_METADATA.notes.length >= 5, "Mevzuat notları eksiksiz bulunmalıdır");
console.log("✔ Kaynak ve güncelleme metadatası doğrulandı.");

console.log("\n============================================================");
console.log("AŞAMA 1 TÜM KABUL KRİTERLERİ BAŞARIYLA GEÇTİ (PASS)");
console.log("============================================================");
