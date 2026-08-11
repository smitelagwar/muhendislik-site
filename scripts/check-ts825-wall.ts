import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { calculateExternalWallInsulation } from "../src/lib/ts825/calculator";
import { PROVINCE_CLIMATE_OPTIONS } from "../src/lib/ts825/climate-data";
import { INSULATION_MATERIALS } from "../src/lib/ts825/materials";
import { createTs825WallPdfDocument } from "../src/lib/ts825/reporting";
import { WALL_PRESETS } from "../src/lib/ts825/wall-presets";
import type { ThermalLayer } from "../src/lib/ts825/types";

const expectedProvinceCenters = {
  "1": ["Adana", "Antalya", "Mersin"],
  "2": [
    "Adıyaman", "Aydın", "Batman", "Denizli", "Gaziantep", "Hatay", "İzmir", "Kahramanmaraş",
    "Kilis", "Manisa", "Mardin", "Osmaniye", "Siirt", "Şanlıurfa",
  ],
  "3": [
    "Balıkesir", "Bursa", "Çanakkale", "Giresun", "İstanbul", "Kocaeli", "Muğla", "Ordu",
    "Rize", "Sakarya", "Samsun", "Sinop", "Tekirdağ", "Trabzon", "Yalova", "Zonguldak",
  ],
  "4": [
    "Afyonkarahisar", "Aksaray", "Amasya", "Ankara", "Artvin", "Bartın", "Bilecik", "Bingöl",
    "Bolu", "Burdur", "Çankırı", "Çorum", "Diyarbakır", "Düzce", "Edirne", "Elazığ",
    "Erzincan", "Eskişehir", "Iğdır", "Isparta", "Karabük", "Karaman", "Kayseri", "Kırıkkale",
    "Kırklareli", "Kırşehir", "Konya", "Kütahya", "Malatya", "Nevşehir", "Niğde", "Şırnak",
    "Tokat", "Tunceli", "Uşak",
  ],
  "5": ["Bayburt", "Bitlis", "Gümüşhane", "Hakkari", "Kastamonu", "Muş", "Sivas", "Van", "Yozgat"],
  "6": ["Ağrı", "Ardahan", "Erzurum", "Kars"],
} as const;

for (const [bucket, expected] of Object.entries(expectedProvinceCenters)) {
  const actual = PROVINCE_CLIMATE_OPTIONS
    .filter((province) => province.defaultBucket === bucket)
    .map((province) => province.name)
    .sort((left, right) => left.localeCompare(right, "tr-TR"));
  assert.deepEqual(
    actual,
    [...expected].sort((left, right) => left.localeCompare(right, "tr-TR")),
    `${bucket}. iklim bölgesi il merkezi listesi referansla uyuşmalı.`,
  );
}
assert.equal(PROVINCE_CLIMATE_OPTIONS.length, 81, "İklim bölgesi listesinde 81 il bulunmalı.");

const preset = WALL_PRESETS.find((item) => item.id === "brick-infill");
const xps = INSULATION_MATERIALS.find((item) => item.id === "xps-030");

assert(preset, "19 cm tuğla duvar kurgusu bulunamadı.");
assert(xps, "XPS malzemesi bulunamadı.");

const insulationLayerId = "akdagmadeni-xps";
const layers: ThermalLayer[] = preset.layers.map((layer, index) => ({
  ...layer,
  id: `report-layer-${index + 1}`,
}));
layers.splice(layers.length - 1, 0, {
  id: insulationLayerId,
  materialId: xps.id,
  label: xps.name,
  thicknessMeters: 0.13,
  conductivity: xps.conductivity,
  mu: xps.mu,
  isInsulation: true,
});

const result = calculateExternalWallInsulation("66", layers, insulationLayerId);
assert(result, "Akdağmadeni kontrol hesabı üretilemedi.");
assert.equal(result.location.bucket, "5", "TS 825:2024 Yozgat iklim bölgesi 5 olmalı.");
assert.equal(result.targetUValue, 0.25, "Yozgat dış duvar hedef U değeri 0,25 olmalı.");
assert(
  Math.abs(result.currentUValue - 0.19) <= 0.01,
  `Rapor kesiti U değeri 0,19'a yakın olmalı; hesaplanan ${result.currentUValue.toFixed(3)}.`,
);
assert.equal(result.recommendedThicknessMm, 100, "XPS ·030 için bileşen hedefi 10 cm ile sağlanmalı.");
assert(result.achievedUValue <= result.targetUValue, "Yuvarlanan uygulama kalınlığı hedef U değerini sağlamalı.");

const epsRow = result.materialComparison.find((row) => row.material.id === "eps-035");
assert(epsRow, "EPS karşılaştırma satırı bulunamadı.");
assert.equal(epsRow.recommendedThicknessMm, 120, "Aynı duvarda EPS ·035 için 12 cm sonucu bekleniyor.");

const pdf = createTs825WallPdfDocument({ calculation: result, wallPresetName: preset.name });
const pdfBuffer = pdf.output("arraybuffer");
const pdfBytes = pdfBuffer.byteLength;
assert(pdfBytes > 10_000, "PDF hesap föyü beklenen boyutta oluşmadı.");
if (process.env.TS825_PDF_OUT) {
  writeFileSync(process.env.TS825_PDF_OUT, new Uint8Array(pdfBuffer));
}

console.log(
  `TS 825 duvar kontrolü geçti: Yozgat bölge ${result.location.bucket}, U=${result.currentUValue.toFixed(3)}, XPS=${result.recommendedThicknessMm / 10} cm, PDF=${pdfBytes} bayt.`,
);
