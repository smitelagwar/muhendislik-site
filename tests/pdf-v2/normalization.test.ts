import assert from "node:assert/strict";
import { normalizeTurkishText } from "../../src/lib/dokumantasyon/studio/pdf/pdf-search";

/**
 * FAZ A1 — PDF Arama ve Normalizasyon Birim Testleri
 *
 * Bu testler:
 * 1. v1'deki mevcut normalizeTurkishText davranışını ve açık hatalarını test eder.
 * 2. Faz E'de uygulanacak PageSearchIndex / foldTurkishLoose sözleşmelerini tanımlar.
 */

// Faz E sözleşme tipleri (Skeleton)
export interface TextItemLike {
  str: string;
  hasEOL?: boolean;
}

export interface PageSearchIndex {
  text: string;
  folded: string;
  toOrig: Int32Array;
  items: { start: number; end: number; itemIndex: number }[];
}

export interface SearchMatch {
  start: number;
  end: number;
  hit: string;
}

/**
 * Faz E Referans Normalizasyon Sözleşmesi:
 * Karakter uzunluğunu 1:1 koruyan veya toOrig indeks eşleme tablosu üreten katlama.
 */
export function foldTurkishLooseContract(input: string): { folded: string; toOrig: Int32Array } {
  const toOrig = new Int32Array(input.length);
  let folded = "";

  for (let i = 0; i < input.length; i++) {
    toOrig[i] = i;
    const ch = input[i];

    // Gevşek diakritik ve Türkçe büyük/küçük harf katlama
    switch (ch) {
      case "İ":
      case "I":
      case "ı":
      case "i":
        folded += "i";
        break;
      case "Ş":
      case "ş":
        folded += "s";
        break;
      case "Ğ":
      case "ğ":
        folded += "g";
        break;
      case "Ü":
      case "ü":
        folded += "u";
        break;
      case "Ö":
      case "ö":
        folded += "o";
        break;
      case "Ç":
      case "ç":
        folded += "c";
        break;
      default:
        folded += ch.toLowerCase();
        break;
    }
  }

  return { folded, toOrig };
}

/**
 * Faz E Referans Arama İndeksi Oluşturma Sözleşmesi:
 * Kerning, tireleme ve span sınırlarını yöneten indeks oluşturucu iskeleti.
 */
export function buildPageIndexContract(items: TextItemLike[]): PageSearchIndex {
  let fullText = "";
  const itemMap: { start: number; end: number; itemIndex: number }[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const str = item.str || "";

    const start = fullText.length;
    fullText += str;
    const end = fullText.length;

    itemMap.push({ start, end, itemIndex: i });

    // Satır sonunda tire yoksa ve hasEOL varsa boşluk ekle
    const isHyphenated = str.endsWith("-") && i + 1 < items.length;
    if (item.hasEOL && !isHyphenated) {
      fullText += " ";
    }
  }

  // Folded text oluşturulurken satır sonu tireleri (örn. 'araştır-' + 'ma') birleştirilir
  // toOrig tablosu, folded'daki her harfin fullText içindeki gerçek indeksini gösterir
  const toOrigArray: number[] = [];
  let folded = "";

  for (let i = 0; i < fullText.length; i++) {
    const ch = fullText[i];
    // Satır sonu tire: '-' karakterinden sonra harf geliyorsa ve tire satır sonundaysa atlanır
    if (ch === "-" && i + 1 < fullText.length && /[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(fullText[i + 1])) {
      // Tireyi folded metne katma (böylece 'arastirma' aranabilir), toOrig haritası bir sonraki karaktere ilerler
      continue;
    }

    toOrigArray.push(i);

    switch (ch) {
      case "İ":
      case "I":
      case "ı":
      case "i":
        folded += "i";
        break;
      case "Ş":
      case "ş":
        folded += "s";
        break;
      case "Ğ":
      case "ğ":
        folded += "g";
        break;
      case "Ü":
      case "ü":
        folded += "u";
        break;
      case "Ö":
      case "ö":
        folded += "o";
        break;
      case "Ç":
      case "ç":
        folded += "c";
        break;
      default:
        folded += ch.toLowerCase();
        break;
    }
  }

  return {
    text: fullText,
    folded,
    toOrig: new Int32Array(toOrigArray),
    items: itemMap,
  };
}

// ----------------------------------------------------------------------------
// TEST GRUBU 1: Mevcut v1 Davranışı ve Kusurlarının Tespiti
// ----------------------------------------------------------------------------
console.log("=== FAZ A1: Normalizasyon Birim Testleri ===");

// 1.1: v1'de "İ" -> "i", "I" -> "ı"
const v1İzmir = normalizeTurkishText("İzmir");
assert.equal(v1İzmir, "izmir", "v1 'İzmir' normalizasyonunda 'izmir' üretmeli");

const v1Isparta = normalizeTurkishText("ISPARTA");
assert.equal(v1Isparta, "ısparta", "v1 'ISPARTA' normalizasyonunda 'ısparta' üretmeli");

// 1.2: v1 KUSURU 1 — Diakritik katlama yok (Gevşek arama başarısız):
// Kullanıcı Türkçe klavye olmadan "arastirma" aradığında, metindeki "araştırma" ile eşleşmez!
const v1QueryArastirma = normalizeTurkishText("arastirma");
const v1TargetArastirma = normalizeTurkishText("araştırma");
const v1LooseMatchSuccess = v1QueryArastirma === v1TargetArastirma;
console.log(`[V1 DEFECT 1] Diakritik katlama: 'arastirma' == 'araştırma'? ${v1LooseMatchSuccess ? "EVET" : "HAYIR (v1 hatası: gevşek arama yapılamıyor)"}`);
assert.equal(
  v1LooseMatchSuccess,
  false,
  "v1'de 'arastirma' ile 'araştırma' eşleşmez; bu v1'in bilinen eksikliğidir"
);

// 1.3: v1 KUSURU 2 — "isparta" sorgusu "ISPARTA" ile eşleşmez:
// Çünkü "isparta" -> "isparta", ama "ISPARTA" -> "ısparta" (noktasız ı).
const v1QueryIsparta = normalizeTurkishText("isparta");
const v1IspartaMatch = v1QueryIsparta === v1Isparta;
console.log(`[V1 DEFECT 2] 'isparta' == 'ISPARTA' normalizasyonu? ${v1IspartaMatch ? "EVET" : "HAYIR (v1 hatası: i ile ı ayrımı arama kaçırıyor)"}`);
assert.equal(
  v1IspartaMatch,
  false,
  "v1'de 'isparta' ile 'ISPARTA' eşleşmez; bu v1'in bilinen eksikliğidir"
);

// 1.4: v1 KUSURU 3 — Span sınırını geçen kelimeler bulunamaz:
// v1'de pdfDoc.getTextContent().items.map(item => item.str).join(" ") kullanıldığı için
// kelime iki span'a bölünmüşse ("araş", "tırma") araya boşluk girer ("araş tırma") ve bulunamaz.
const v1Spanned = ["araş", "tırma"].join(" ");
const v1SpanFound = v1Spanned.includes("araştırma");
console.log(`[V1 DEFECT 3] Span sınırını geçen kelime: ${v1SpanFound ? "BULUNDU" : "BULUNAMADI (v1 hatası: join(' ') span sınırını böler)"}`);
assert.equal(
  v1SpanFound,
  false,
  "v1'deki join(' ') mantığı span bölünmelerini bozar"
);

// ----------------------------------------------------------------------------
// TEST GRUBU 2: Faz E Sözleşme Doğrulaması (v2 İçin Beklenen Davranış)
// ----------------------------------------------------------------------------

// 2.1: Gevşek diakritik eşleşmesi
const { folded: foldedQuery } = foldTurkishLooseContract("arastirma");
const { folded: foldedTarget } = foldTurkishLooseContract("araştırma");
assert.equal(foldedQuery, "arastirma");
assert.equal(foldedTarget, "arastirma");
assert.equal(foldedQuery, foldedTarget, "Faz E sözleşmesinde 'arastirma' ile 'araştırma' katlanmış hâlde eşit olmalıdır");
console.log("[v2 CONTRACT 1] Gevşek arama 'arastirma' ↔ 'araştırma': DOĞRULANDI (PASS)");

// 2.2: ISPARTA ↔ ısparta ↔ isparta
const { folded: foldedISPARTA } = foldTurkishLooseContract("ISPARTA");
const { folded: foldedIspartaLower } = foldTurkishLooseContract("ısparta");
const { folded: foldedIspartaAscii } = foldTurkishLooseContract("isparta");
assert.equal(foldedISPARTA, "isparta");
assert.equal(foldedIspartaLower, "isparta");
assert.equal(foldedIspartaAscii, "isparta");
assert.equal(foldedISPARTA, foldedIspartaLower);
assert.equal(foldedISPARTA, foldedIspartaAscii);
console.log("[v2 CONTRACT 2] 'ISPARTA' ↔ 'ısparta' ↔ 'isparta': DOĞRULANDI (PASS)");

// 2.3: İzmir ↔ izmir
const { folded: foldedİzmir } = foldTurkishLooseContract("İzmir");
const { folded: foldedIzmir } = foldTurkishLooseContract("izmir");
assert.equal(foldedİzmir, "izmir");
assert.equal(foldedIzmir, "izmir");
assert.equal(foldedİzmir, foldedIzmir);
console.log("[v2 CONTRACT 3] 'İzmir' ↔ 'izmir': DOĞRULANDI (PASS)");

// 2.4: ÇIĞ ↔ cig, şeker ↔ seker
assert.equal(foldTurkishLooseContract("ÇIĞ").folded, "cig");
assert.equal(foldTurkishLooseContract("şeker").folded, "seker");
assert.equal(foldTurkishLooseContract("ÖĞRENCİ").folded, "ogrenci");
console.log("[v2 CONTRACT 4] Diğer Türkçe karakterler (ÇIĞ, şeker, ÖĞRENCİ): DOĞRULANDI (PASS)");

// 2.5: İndeks Haritası ve Uzunluk Korunumu (toOrig Sözleşmesi)
const sampleText = "Bilimsel araştırma araçları ve İSTANBUL teknik raporu.";
const { folded: sampleFolded, toOrig: sampleToOrig } = foldTurkishLooseContract(sampleText);
assert.equal(sampleFolded.length, sampleText.length, "Gevşek katlama karakter uzunluğunu 1:1 korumalı");
assert.equal(sampleToOrig.length, sampleText.length, "toOrig tablosu metinle eşit boyutta olmalı");

// Orijinal metindeki "İSTANBUL" kelimesi
const istanbulFoldedIdx = sampleFolded.indexOf("istanbul");
assert.ok(istanbulFoldedIdx >= 0);
const originalWord = sampleText.substring(
  sampleToOrig[istanbulFoldedIdx],
  sampleToOrig[istanbulFoldedIdx] + "istanbul".length
);
assert.equal(originalWord, "İSTANBUL", "toOrig haritası folded indeksi tam olarak orijinal kelimeye eşlemeli");
console.log("[v2 CONTRACT 5] toOrig 1:1 indeks geri kazanımı: DOĞRULANDI (PASS)");

// 2.6: Satır Sonu Tire Birleştirme Sözleşmesi
const splitItems: TextItemLike[] = [
  { str: "kapsamlı araştır-", hasEOL: true },
  { str: "ma faaliyetleri", hasEOL: false },
];
const pageIndex = buildPageIndexContract(splitItems);
assert.ok(pageIndex.folded.includes("arastirma"), "Satır sonu tire birleşerek 'arastirma' olarak indekslenmeli");
console.log("[v2 CONTRACT 6] Satır sonu tire birleştirme: DOĞRULANDI (PASS)");

console.log("\n>>> Faz A1 Normalizasyon Testleri Başarıyla Tamamlandı.");
console.log("    - 3 adet v1 kusuru kanıtlandı (Diakritik eksikliği, I/ı çakışması, Span bölünmesi).");
    console.log("    - 6 adet v2 sözleşme testi tanımlandı ve doğrulandı.");
