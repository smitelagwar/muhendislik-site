import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import YapiDenetimUcretiPage, { metadata } from "../src/app/hesaplamalar/yapi-denetim-ucreti/page";
import { YapiDenetimResultReport } from "../src/app/hesaplamalar/yapi-denetim-ucreti/components/yapi-denetim-result-report";
import {
  YapiDenetimTablesDialog,
  YapiDenetimTablesContent,
} from "../src/app/hesaplamalar/yapi-denetim-ucreti/components/yapi-denetim-tables-dialog";
import { calculateYapiDenetimFee } from "../src/lib/calculations/modules/yapi-denetim-ucreti";

console.log("--- AŞAMA 3: UI ve Komponent Doğrulama Testleri Başlatılıyor ---");

// 1. SEO Metadata Doğrulaması
assert(metadata.title, "SEO başlığı mevcut olmalı");
assert.equal(metadata.title, "Tahmini Yapı Denetim Ücreti 2026");
assert(metadata.description, "SEO açıklaması mevcut olmalı");
console.log("✔ Sayfa SEO ve metadata yapılandırması doğrulandı.");

// 2. Server Component SSR Render Testi
const serverHtml = renderToString(React.createElement(YapiDenetimUcretiPage));
assert(serverHtml.includes("Tahmini Yapı Denetim Ücreti"), "Sayfa başlığı SSR çıktısında bulunmalı");
assert(serverHtml.includes("Girdi Paneli"), "Girdi paneli SSR çıktısında bulunmalı");
assert(serverHtml.includes("Tahmin İçin Bilgileri Girin"), "Başlangıç yönlendirici placeholder SSR çıktısında bulunmalı");
assert(serverHtml.includes("2026 Tabloları ve Kurallar"), "Tablolar dialog butonu SSR çıktısında bulunmalı");
console.log("✔ Next.js Server Component SSR render başarıyla tamamlandı.");

// 3. YapiDenetimResultReport Render Testi (R1 ve Koşullu Durumlar)
// R1 Testi
const r1Result = calculateYapiDenetimFee({ area: 900, classBand: "III", durationYears: 1, region: "normal" });
const r1Html = renderToString(React.createElement(YapiDenetimResultReport, { result: r1Result }));
assert(r1Html.includes("305.424,00 TL"), "R1 KDV hariç bedel raporda yer almalı");
assert(r1Html.includes("61.084,80 TL"), "R1 KDV tutarı raporda yer almalı");
assert(r1Html.includes("366.508,80 TL"), "R1 KDV dahil toplam raporda yer almalı");
assert(r1Html.includes("Grup II"), "Denetim grubu raporda yer almalı");
assert(r1Html.includes("19.392") && r1Html.includes("TL/m²"), "Birim maliyet raporda yer almalı");
assert(!r1Html.includes("500 m² ve Altı"), "R1 için 500 m² uyarısı raporda OLMAMALI");
console.log("✔ YapiDenetimResultReport R1 çıktısı doğrulandı.");

// R4 Testi (<=500 m² koşullu bloğu)
const r4Result = calculateYapiDenetimFee({ area: 400, classBand: "III", durationYears: 1, region: "normal" });
const r4Html = renderToString(React.createElement(YapiDenetimResultReport, { result: r4Result }));
assert(r4Html.includes("135.744,00 TL"), "R4 ana sonuç standart oranla kalmalı");
assert(r4Html.includes("500 m² ve Altı Yapılarda Özel Hüküm"), "R4 için 500 m² özel hüküm bloğu görünmeli");
assert(r4Html.includes("271.488,00 TL"), "R4 azami net tahmin görünmeli");
assert(r4Html.includes("325.785,60 TL"), "R4 azami brüt tahmin görünmeli");
console.log("✔ YapiDenetimResultReport 500 m² ve altı azami tahmin bloğu doğrulandı.");

// Çok Yıllı (duration > 1) Testi
const multiYearResult = calculateYapiDenetimFee({ area: 1500, classBand: "III", durationYears: 3, region: "normal" });
const multiYearHtml = renderToString(React.createElement(YapiDenetimResultReport, { result: multiYearResult }));
assert(multiYearHtml.includes("2026 Fiyat Seviyesinde Tahmin"), "Çok yıllı uyarı bloğu görünmeli");
assert(multiYearHtml.includes("3") && multiYearHtml.includes("Yıllık Proje"), "Proje yılı görünmeli");
console.log("✔ YapiDenetimResultReport çok yıllı tahmin uyarısı doğrulandı.");

// Kapsam Uyarısı (area <= 200) Testi
const smallScopeResult = calculateYapiDenetimFee({ area: 150, classBand: "I_II", durationYears: 1, region: "normal" });
const smallScopeHtml = renderToString(React.createElement(YapiDenetimResultReport, { result: smallScopeResult }));
assert(smallScopeHtml.includes("Kapsamı Doğrulayın"), "≤200 m² kapsam inceleme uyarısı görünmeli");
console.log("✔ YapiDenetimResultReport ≤200 m² kapsam inceleme uyarısı doğrulandı.");

// Ödeme Modeli ve Hakediş Tablosu Render Testi
assert(r1Html.includes("Ödeme Esasları"), "Ödeme esasları başlığı raporda yer almalı");
assert(r1Html.includes("Defaten"), "900 m² için defaten rozeti raporda yer almalı");
assert(r1Html.includes("Emanet Hesabı"), "Emanet hesabı uyarısı raporda yer almalı");
assert(r1Html.includes("Etap"), "Hakediş etap satırı raporda yer almalı");

const over3000Result = calculateYapiDenetimFee({ area: 3500, classBand: "III", durationYears: 1, region: "normal" });
const over3000Html = renderToString(React.createElement(YapiDenetimResultReport, { result: over3000Result }));
assert(over3000Html.includes("Taksitli"), "3.500 m² için taksitli rozeti raporda yer almalı");
console.log("✔ YapiDenetimResultReport ödeme modeli ve hakediş tablosu doğrulandı.");

// 4. YapiDenetimTablesContent Render Testi
const tablesHtml = renderToString(React.createElement(YapiDenetimTablesContent));
assert(tablesHtml.includes("2026 Yapı Denetimi Tabloları"), "Dialog başlığı render edilmeli");
assert(tablesHtml.includes("Hizmet Bedeline Esas Oran Cetveli"), "Hizmet oranları tablosu render edilmeli");
console.log("✔ YapiDenetimTablesContent erişilebilir bileşen render'ı doğrulandı.");

console.log("\n============================================================");
console.log("AŞAMA 3 TÜM KABUL KRİTERLERİ BAŞARIYLA GEÇTİ (PASS)");
console.log("============================================================");
