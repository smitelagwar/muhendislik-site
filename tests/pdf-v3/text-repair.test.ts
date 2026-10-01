import assert from "node:assert/strict";
import {
  detectBrokenMapping,
  repairExtractedText,
} from "../../src/lib/dokumantasyon/studio/pdf/pdf-text-repair";

console.log("=== FAZ R3: pdf-text-repair Birim Testleri ===\n");

// 1. Tespit İmzası Testleri
const brokenSample = "Aşağıda Korelasyonel Araştırma Ĝle Tek DeneklĜ (SĜngle-Subject / SĜngle-Case) Araştırmaların ne olduğunu; amaçlarını ve hangĜ durumlarda tercĜh edĜldĜğĜnĜ; benzerlĜk ve farklarını bulabĜlĜrsĜnĜz. 1. Korelasyonel Araştırma NedĜr? İkĜ ya da daha fazla değĜşken arasındakĜ ĜlĜşkĜnĜn yönünü ve gücünü Ĝnceleyen araştırmadır.";
const normalSample = "Bu metin normal bir Türkçe belgedir. İçinde bolca i harfi bulunmaktadır. Araştırma ve ilişkilerin analizi yapılmaktadır. Herhangi bir bozukluk taşımamaktadır.";
const shortSample = "Kısa metin Ĝle";

const brokenRules = detectBrokenMapping(brokenSample);
assert.equal(brokenRules.length, 1, "Bozuk belgede tam 1 kural tespit edilmelidir");
assert.equal(brokenRules[0].from, "\u011c", "Tespit edilen bozuk karakter Ĝ olmalıdır");
assert.equal(brokenRules[0].to, "i", "Hedef karakter i olmalıdır");
console.log("[PASS] Bozuk ToUnicode imzası başarıyla tespit edildi (Ĝ -> i).");

const normalRules = detectBrokenMapping(normalSample);
assert.equal(normalRules.length, 0, "Normal Türkçe metinde kural devreye GİRMEMELİDİR");
console.log("[PASS] Normal metinde yanlış pozitif (false positive) üretilmedi (kural boş).");

const shortRules = detectBrokenMapping(shortSample);
assert.equal(shortRules.length, 0, "Yetersiz uzunluktaki metinde kural devreye GİRMEMELİDİR");
console.log("[PASS] Kısa metin koruması başarılı.");

// 2. 1:1 Karakter Onarımı ve Uzunluk Değişmezi Testleri
const rawText = "ĜkĜ ya da daha fazla değĜşken arasındakĜ ĜlĜşkĜnĜn yönünü ve gücünü Ĝnceleyen";
const repairedText = repairExtractedText(rawText, brokenRules);

assert.equal(
  repairedText.length,
  rawText.length,
  "1:1 Değişmezi: Onarılmış metin uzunluğu orijinal metin uzunluğu ile TAM EŞİT olmalıdır!"
);
console.log("[PASS] 1:1 Uzunluk değişmezi doğrulandı (length korundu).");

assert.equal(
  repairedText,
  "iki ya da daha fazla değişken arasındaki ilişkinin yönünü ve gücünü inceleyen",
  "Metin kelime kelime doğru Türkçe 'i' harflerine dönüştürülmelidir"
);
console.log("[PASS] 'ĜlĜşkĜnĜn' -> 'ilişkinin' ve 'değĜşken' -> 'değişken' kelime kelime doğrulandı.");

// 3. Kural Olmadığında Dokunmama Testi
const untouched = repairExtractedText(normalSample, []);
assert.equal(untouched, normalSample, "Kural boşken metin asla değiştirilmemelidir");
console.log("[PASS] Kural yokken metin dokunulmadan iade edildi.");

console.log("\n>>> pdf-text-repair Tüm Birim Testleri Başarıyla Geçti.");
