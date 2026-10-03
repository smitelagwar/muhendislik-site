import assert from "node:assert/strict";
import {
  foldTurkish,
  buildPageIndex,
  findInPage,
  TextItemLike,
  PageIndexCache,
  SearchProgress,
  searchPdfDocumentIncremental,
} from "../../src/lib/dokumantasyon/studio/pdf/pdf-search-engine";

console.log("=== FAZ E: PDF Search Engine Birim Testleri ===");

// ----------------------------------------------------------------------------
// 1. Türkçe Katlama ve Gevşek Arama (Loose Diacritics)
// ----------------------------------------------------------------------------
{
  // 1.1: Gevşek katlama: 'arastirma' ↔ 'araştırma'
  const fQuery = foldTurkish("arastirma").folded;
  const fTarget = foldTurkish("araştırma").folded;
  assert.equal(fQuery, "arastirma");
  assert.equal(fTarget, "arastirma");
  assert.equal(fQuery, fTarget);
  console.log("[PASS 1.1] Gevşek arama 'arastirma' ↔ 'araştırma'");

  // 1.2: ISPARTA ↔ ısparta ↔ isparta
  const fISPARTA = foldTurkish("ISPARTA").folded;
  const fIspartaLower = foldTurkish("ısparta").folded;
  const fIspartaAscii = foldTurkish("isparta").folded;
  assert.equal(fISPARTA, "isparta");
  assert.equal(fIspartaLower, "isparta");
  assert.equal(fIspartaAscii, "isparta");
  console.log("[PASS 1.2] 'ISPARTA' ↔ 'ısparta' ↔ 'isparta'");

  // 1.3: İzmir ↔ izmir
  assert.equal(foldTurkish("İzmir").folded, "izmir");
  assert.equal(foldTurkish("izmir").folded, "izmir");
  console.log("[PASS 1.3] 'İzmir' ↔ 'izmir'");

  // 1.4: ÇIĞ, ŞEKER, ÖĞRENCİ
  assert.equal(foldTurkish("ÇIĞ").folded, "cig");
  assert.equal(foldTurkish("ŞEKER").folded, "seker");
  assert.equal(foldTurkish("ÖĞRENCİ").folded, "ogrenci");
  console.log("[PASS 1.4] 'ÇIĞ', 'ŞEKER', 'ÖĞRENCİ'");
}

// ----------------------------------------------------------------------------
// 2. Türkçe Harflere Duyarlı Mod (matchDiacritics: true)
// ----------------------------------------------------------------------------
{
  const fStrictISPARTA = foldTurkish("ISPARTA", { diacritics: true }).folded;
  const fStrictIsparta = foldTurkish("ısparta", { diacritics: true }).folded;
  const fStrictIspartaAscii = foldTurkish("isparta", { diacritics: true }).folded;

  assert.equal(fStrictISPARTA, "ısparta");
  assert.equal(fStrictIsparta, "ısparta");
  assert.equal(fStrictIspartaAscii, "isparta");
  assert.notEqual(fStrictISPARTA, fStrictIspartaAscii, "Diakritik duyarlı modda 'ı' ile 'i' ayrılmalı");
  console.log("[PASS 2.1] Türkçe harflere duyarlı mod: 'ISPARTA' -> 'ısparta' != 'isparta'");
}

// ----------------------------------------------------------------------------
// 3. toOrig İndeks Geri Kazanımı ve Snippet Doğruluğu
// ----------------------------------------------------------------------------
{
  const sample = "Bu bir araştırma raporudur ve İSTANBUL ilinde hazırlanmıştır.";
  const { folded, toOrig } = foldTurkish(sample);

  assert.equal(folded.length, sample.length);
  assert.equal(toOrig.length, sample.length);

  const idx = folded.indexOf("istanbul");
  assert.ok(idx >= 0);
  const originalWord = sample.slice(toOrig[idx], toOrig[idx + "istanbul".length - 1] + 1);
  assert.equal(originalWord, "İSTANBUL");
  console.log("[PASS 3.1] toOrig 1:1 orijinal metin haritası: 'istanbul' -> 'İSTANBUL'");
}

// ----------------------------------------------------------------------------
// 3.2: NFC sonrası kaynak aralığı (ayrık Türkçe diakritikler)
// ----------------------------------------------------------------------------
{
  const decomposed = "Başlıkta sa" + "c\u0327" + " aranıyor.";
  const index = buildPageIndex([{ str: decomposed }], 1);
  const [match] = findInPage(index, "saç");

  assert.ok(match, "Ayrık cedilla içeren saç kelimesi bulunmalı");
  assert.equal(match.snippet.hit, "sac\u0327", "Eşleşme kaynak metindeki birleştirici işareti de kapsamalı");
  assert.equal(decomposed.slice(match.start, match.end), match.snippet.hit);

  const jamo = "\u1100\u1161";
  const normalizedJamo = foldTurkish(jamo);
  assert.equal(normalizedJamo.folded, "가");
  assert.equal(normalizedJamo.toOrig[0], 0);
  assert.equal(normalizedJamo.toOrigEnd[0], jamo.length);
  console.log("[PASS 3.2] NFC katlama birleştirilmiş karakterlerin UTF-16 kaynak aralığını koruyor");
}

// ----------------------------------------------------------------------------
// 4. Satır Sonu Tire Birleştirme (Hyphenation at Line Break)
// ----------------------------------------------------------------------------
{
  const items: TextItemLike[] = [
    { str: "Kapsamlı araştır-", hasEOL: true },
    { str: "ma faaliyetleri sürdürülmektedir.", hasEOL: false },
  ];

  const index = buildPageIndex(items, 1);
  assert.ok(index.folded.includes("arastirma"), "Satır sonu tire birleşerek 'arastirma' indekslenmeli");

  const matches = findInPage(index, "araştırma");
  assert.equal(matches.length, 1);
  assert.equal(matches[0].snippet.hit, "araştır-ma");
  assert.equal(matches[0].itemStartIndex, 0);
  assert.equal(matches[0].itemEndIndex, 1);
  console.log("[PASS 4.1] Satır sonu tire 'araştır-' + 'ma' birleşik bulundu: hit = 'araştır-ma'");
}

// ----------------------------------------------------------------------------
// 5. Span Sınırını Geçen Eşleşme (Multi-Span Match)
// ----------------------------------------------------------------------------
{
  const splitSpans: TextItemLike[] = [
    { str: "Gelişmiş araş", hasEOL: false },
    { str: "tırma yöntemleri", hasEOL: false },
  ];

  const index = buildPageIndex(splitSpans, 1);
  const matches = findInPage(index, "araştırma");
  assert.equal(matches.length, 1);
  assert.equal(matches[0].snippet.hit, "araştırma");
  assert.equal(matches[0].itemStartIndex, 0);
  assert.equal(matches[0].itemEndIndex, 1);
  console.log("[PASS 5.1] Span sınırını geçen kelime başarıyla eşleşti: spans [0, 1]");
}

// ----------------------------------------------------------------------------
// 6. LRU Önbellek (PageIndexCache)
// ----------------------------------------------------------------------------
{
  const cache = new PageIndexCache(3);
  const dummyIndex = (p: number) => buildPageIndex([{ str: `Sayfa ${p}` }], p);

  cache.set(1, dummyIndex(1));
  cache.set(2, dummyIndex(2));
  cache.set(3, dummyIndex(3));
  assert.ok(cache.get(1)); // 1'e erişildi -> en yeni oldu

  cache.set(4, dummyIndex(4)); // 2 en eskiydi, silinmeli
  assert.equal(cache.get(2), undefined, "LRU kapasite aşımında en eski sayfa silinmeli");
  assert.ok(cache.get(1), "Erişilen sayfa 1 önbellekte kalmalı");
  assert.ok(cache.get(3), "Sayfa 3 önbellekte kalmalı");
  assert.ok(cache.get(4), "Sayfa 4 önbellekte kalmalı");
  console.log("[PASS 6.1] PageIndexCache LRU tahliye mekanizması");
}

// ----------------------------------------------------------------------------
// 7. Incremental progress snapshots stay stable as later pages are scanned
// ----------------------------------------------------------------------------
async function verifyIncrementalProgressSnapshots() {
  const pages = ["hedef ilk sayfa", "eşleşme yok", "hedef son sayfa"];
  const progressSnapshots: SearchProgress[] = [];

  await searchPdfDocumentIncremental(
    {
      numPages: pages.length,
      getPage: async (pageNumber) => ({
        getTextContent: async () => ({ items: [{ str: pages[pageNumber - 1] }] }),
      }),
    },
    "hedef",
    1,
    {},
    new AbortController().signal,
    (progress) => progressSnapshots.push(progress),
    new PageIndexCache(10),
  );

  assert.equal(progressSnapshots[0].matches.length, 1, "ilk sayfa snapshot'ı sonraki eşleşmelerle değişmemeli");
  assert.equal(progressSnapshots.at(-1)?.matches.length, 2, "son snapshot iki sayfadaki eşleşmeleri içermeli");
  assert.notEqual(progressSnapshots[0].matches, progressSnapshots.at(-1)?.matches);
  assert.equal(progressSnapshots[0].pageMatchCounts[3], undefined, "önceki sayaç snapshot'ı sonraki sayfa bilgilerini almamalı");
  console.log("[PASS 7.1] Artımlı arama sonuçları sayfa ilerledikçe sabit snapshot'lar olarak aktarılıyor");
}

verifyIncrementalProgressSnapshots()
  .then(() => console.log("\n>>> Faz E PDF arama motoru birim testleri tamamlandı."))
  .catch((error) => {
    console.error("[FAIL 7.1] Artımlı arama snapshot testi başarısız:", error);
    process.exitCode = 1;
  });
