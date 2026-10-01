import assert from "node:assert/strict";
import {
  isSafePdfUrl,
  resolvePdfDestination,
  getPageFromLabel,
  pushNavigationHistory,
} from "../../src/lib/dokumantasyon/studio/pdf/pdf-navigation";

async function runTests() {
  console.log("==> PDF Navigation Engine Birim Testleri Başlatılıyor...");

  // 1. URL Güvenlik Doğrulaması (isSafePdfUrl)
  assert.equal(isSafePdfUrl("https://example.com/muhendislik"), true, "https geçerli olmalı");
  assert.equal(isSafePdfUrl("http://insaat.gov.tr/standartlar"), true, "http geçerli olmalı");
  assert.equal(isSafePdfUrl("mailto:destek@ornek.com"), true, "mailto geçerli olmalı");

  // XSS ve güvensiz protokoller reddedilmeli
  assert.equal(isSafePdfUrl("javascript:alert(1)"), false, "javascript reddedilmeli");
  assert.equal(isSafePdfUrl("JAVASCRIPT:void(0)"), false, "büyük harfli javascript reddedilmeli");
  assert.equal(isSafePdfUrl("data:text/html,<script>alert(1)</script>"), false, "data URL reddedilmeli");
  assert.equal(isSafePdfUrl("vbscript:msgbox(1)"), false, "vbscript reddedilmeli");
  assert.equal(isSafePdfUrl("file:///C:/Windows/system.ini"), false, "file URI reddedilmeli");
  assert.equal(isSafePdfUrl(""), false, "boş string reddedilmeli");
  assert.equal(isSafePdfUrl(null as any), false, "null reddedilmeli");
  assert.equal(isSafePdfUrl(undefined as any), false, "undefined reddedilmeli");
  assert.equal(isSafePdfUrl("not a valid url"), false, "geçersiz metin reddedilmeli");
  console.log("✓ URL Güvenlik Testleri Başarılı");

  // 2. Hedef Çözümleme (resolvePdfDestination)
  const mockDoc = {
    getDestination: async (name: string) => {
      if (name === "section1") return [{ num: 10, gen: 0 }, { name: "XYZ" }, null, null, null];
      if (name === "section2") return [4, { name: "XYZ" }]; // doğrudan sayfa indeksi 4
      return null;
    },
    getPageIndex: async (ref: any) => {
      if (ref && ref.num === 10) return 2; // 0-tabanlı indeks 2 -> Sayfa 3
      if (ref && ref.num === 20) return 0; // 0-tabanlı indeks 0 -> Sayfa 1
      throw new Error("Unknown ref");
    },
  };

  const destNamed = await resolvePdfDestination(mockDoc, "section1");
  assert.equal(destNamed, 3, "İsimlendirilmiş hedef (section1) Sayfa 3'e çözülmeli");

  const destArrayRef = await resolvePdfDestination(mockDoc, [{ num: 20, gen: 0 }, { name: "XYZ" }]);
  assert.equal(destArrayRef, 1, "Referans dizisi Sayfa 1'e çözülmeli");

  const destDirectNumber = await resolvePdfDestination(mockDoc, 5);
  assert.equal(destDirectNumber, 6, "Doğrudan sayı (5) Sayfa 6'ya çözülmeli");

  const destInvalid = await resolvePdfDestination(mockDoc, "nonexistent");
  assert.equal(destInvalid, null, "Bulunamayan hedef null dönmeli");
  console.log("✓ Hedef Çözümleme Testleri Başarılı");

  // 3. Sayfa Etiketleri Eşleme (getPageFromLabel)
  const labels = ["i", "ii", "iii", "iv", "1", "2", "A-1", "A-2"];
  assert.equal(getPageFromLabel(labels, "iv"), 4, "Romen rakamı iv -> 4");
  assert.equal(getPageFromLabel(labels, "IV"), 4, "Büyük harfli IV -> 4");
  assert.equal(getPageFromLabel(labels, "a-1"), 7, "A-1 etiketi -> 7");
  assert.equal(getPageFromLabel(labels, "1"), 5, "Etiket 1 -> 5");
  assert.equal(getPageFromLabel(labels, "B-99"), null, "Olmayan etiket null dönmeli");
  assert.equal(getPageFromLabel(null, "iv"), null, "Etiket yoksa null dönmeli");
  console.log("✓ Sayfa Etiketleri Testleri Başarılı");

  // 4. Gezinme Geçmişi (pushNavigationHistory)
  let history: any[] = [];
  history = pushNavigationHistory(history, { page: 1, scrollTop: 0 });
  assert.equal(history.length, 1);
  assert.equal(history[0].page, 1);

  // Aynı sayfa tekrar eklenmemeli
  history = pushNavigationHistory(history, { page: 1, scrollTop: 50 });
  assert.equal(history.length, 1, "Aynı sayfa tekrar eklenmemeli");

  history = pushNavigationHistory(history, { page: 10, scrollTop: 2500 });
  assert.equal(history.length, 2);
  assert.equal(history[1].page, 10);

  // Üst sınır (maxEntries = 3 testi)
  let capped: any[] = [];
  for (let p = 1; p <= 5; p++) {
    capped = pushNavigationHistory(capped, { page: p, scrollTop: p * 100 }, 3);
  }
  assert.equal(capped.length, 3, "Geçmiş en fazla maxEntries kadar tutulmalı");
  assert.equal(capped[0].page, 3);
  assert.equal(capped[2].page, 5);
  console.log("✓ Gezinme Geçmişi Testleri Başarılı");

  console.log("==> TÜM PDF NAVIGATION TESTLERİ BAŞARIYLA TAMAMLANDI ✅");
}

runTests().catch((err) => {
  console.error("Test hatası:", err);
  process.exit(1);
});
