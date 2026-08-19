// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — AŞAMA 3/8 PDF VIEWER CORE DOĞRULAMA TESTİ
// ============================================================================

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

console.log("======================================================================");
console.log("DÖKÜMANTASYON MODÜLÜ — AŞAMA 3/8 PDF VIEWER CORE DOĞRULAMA TESTİ");
console.log("======================================================================\n");

function logStep(title) {
  console.log(`\n▶ ${title}`);
}

function logSuccess(msg) {
  console.log(`  ✓ [BAŞARILI] ${msg}`);
}

async function runStage3Tests() {
  // -------------------------------------------------------------------
  // TEST 1: PDF.js Güvenlik Geçidi ve CDN Fallback İptali
  // -------------------------------------------------------------------
  logStep("TEST 1: PDF.js Güvenlik Parametreleri ve Self-Hosted Yükleme");

  const loaderPath = path.join(ROOT, "src/lib/dokumantasyon/studio/pdf/pdfjs-loader.ts");
  assert(fs.existsSync(loaderPath), "pdfjs-loader.ts mevcut olmalıdır.");
  const loaderContent = fs.readFileSync(loaderPath, "utf-8");

  assert(
    !loaderContent.includes("cdnjs.cloudflare.com"),
    "pdfjs-loader.ts içinde savunmasız CDN fallback (cdnjs) BULUNMAMALIDIR."
  );
  assert(
    loaderContent.includes("/vendor/pdfjs/pdf.min.js"),
    "pdfjs-loader.ts self-hosted /vendor/pdfjs/pdf.min.js kullanmalıdır."
  );
  assert(
    loaderContent.includes("isEvalSupported: false"),
    "createSecurePdfLoadingTask isEvalSupported: false (CVE-2024-4367 koruması) içermelidir."
  );
  assert(
    loaderContent.includes("enableScripting: false"),
    "createSecurePdfLoadingTask enableScripting: false (Embedded JS koruması) içermelidir."
  );
  logSuccess("PDF.js güvenlik geçidi ve self-hosted yükleyici doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 2: Continuous Scroll (Sürekli Dikey Kaydırma) Mimarisi
  // -------------------------------------------------------------------
  logStep("TEST 2: Continuous Scroll Mimarisi ve Çoklu Sayfa Render");

  const studioViewerPath = path.join(ROOT, "src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx");
  assert(fs.existsSync(studioViewerPath), "pdfjs-studio.tsx mevcut olmalıdır.");
  const studioViewerContent = fs.readFileSync(studioViewerPath, "utf-8");

  assert(
    studioViewerContent.includes("Array.from({ length: numPages }"),
    "pdfjs-studio.tsx tek sayfa yerine tüm sayfaları continuous dikey listede render etmelidir."
  );
  assert(
    studioViewerContent.includes("<PdfPageView"),
    "pdfjs-studio.tsx her sayfa için PdfPageView bileşenini kullanmalıdır."
  );
  logSuccess("Sürekli dikey kaydırma (continuous scroll) mimarisi doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 3: Doğal Metin Katmanı (HTML TextLayer) ve Seçim Yeteneği
  // -------------------------------------------------------------------
  logStep("TEST 3: TextLayer ve Doğal Metin Seçim İmleci");

  const pageViewPath = path.join(ROOT, "src/components/dokumantasyon/studio/pdf/pdf-page-view.tsx");
  assert(fs.existsSync(pageViewPath), "pdf-page-view.tsx mevcut olmalıdır.");
  const pageViewContent = fs.readFileSync(pageViewPath, "utf-8");

  assert(
    pageViewContent.includes("getTextContent"),
    "PdfPageView text content katmanını PDF.js üzerinden çekmelidir."
  );
  assert(
    pageViewContent.includes("select-text") && pageViewContent.includes("cursor-text"),
    "PdfPageView TextLayer span'ları seçilebilir metin (select-text / cursor-text) sunmalıdır."
  );
  assert(
    pageViewContent.includes("<mark"),
    "PdfPageView arama eşleşmelerini TextLayer üzerinde <mark> ile vurgulamalıdır."
  );
  logSuccess("TextLayer doğal metin seçimi ve HTML span haritalaması doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 4: Türkçe Karakter Destekli Doküman İçi Arama Motoru
  // -------------------------------------------------------------------
  logStep("TEST 4: Türkçe Karakter Uyumlu PDF Arama Motoru");

  const searchPath = path.join(ROOT, "src/lib/dokumantasyon/studio/pdf/pdf-search.ts");
  assert(fs.existsSync(searchPath), "pdf-search.ts mevcut olmalıdır.");
  const searchModule = await import(pathToFileURL(searchPath).href);

  // Normalizasyon testleri
  assert.strictEqual(
    searchModule.normalizeTurkishText("İNŞAAT MÜHENDİSLİĞİ ÇĞİÖŞÜ"),
    "inşaat mühendisliği çğiöşü"
  );
  assert.strictEqual(
    searchModule.normalizeTurkishText("KİRİŞ VE DÖŞEME DONATISI Ø12"),
    "kiriş ve döşeme donatısı ø12"
  );

  // Mock PDF Doc üzerinde arama simülasyonu
  const mockPdfDoc = {
    numPages: 2,
    getPage: async (num) => ({
      getTextContent: async () => ({
        items: [
          { str: num === 1 ? "1. KAT KALIP VE DONATI PLANI PB108 KİRİŞİ" : "2. KAT ASANSÖR KUYUSU DETAYI" },
        ],
      }),
    }),
  };

  const res1 = await searchModule.searchInPdfDocument(mockPdfDoc, "PB108");
  assert.strictEqual(res1.totalMatches, 1, "PB108 araması 1 eşleşme bulmalıdır.");
  assert.strictEqual(res1.matches[0].pageNumber, 1, "Eşleşme 1. sayfada olmalıdır.");

  const res2 = await searchModule.searchInPdfDocument(mockPdfDoc, "asansör");
  assert.strictEqual(res2.totalMatches, 1, "Türkçe 'asansör' araması eşleşmelidir.");
  assert.strictEqual(res2.matches[0].pageNumber, 2, "Eşleşme 2. sayfada olmalıdır.");

  logSuccess("Türkçe karakter duyarlı PDF arama algoritması %100 doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 5: Sınırsız (100+ Sayfa) Tembel Küçük Resimler (Lazy Thumbnails)
  // -------------------------------------------------------------------
  logStep("TEST 5: Sınırsız Sayfa Destekli Tembel Küçük Resimler (Thumbnails)");

  const sidebarPath = path.join(ROOT, "src/components/dokumantasyon/studio/pdf/pdf-thumbnail-sidebar.tsx");
  assert(fs.existsSync(sidebarPath), "pdf-thumbnail-sidebar.tsx mevcut olmalıdır.");
  const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");

  assert(
    !sidebarContent.includes("Math.min(numPages, 30)"),
    "Thumbnail paneli 30 sayfa sert kısıtı İÇERMEMELİDİR."
  );
  assert(
    sidebarContent.includes("IntersectionObserver"),
    "Thumbnail paneli bellek koruması için IntersectionObserver lazy loading kullanmalıdır."
  );
  logSuccess("Sınırsız ve sanallaştırılmış thumbnail kenar çubuğu doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 6: Ctrl + Wheel İmleç Odaklı Zoom ve Klavye Kısayolları
  // -------------------------------------------------------------------
  logStep("TEST 6: Wheel Zoom Dinleyicisi ve Toolbar Komut Eşleşmesi");

  assert(
    studioViewerContent.includes('passive: false') && studioViewerContent.includes("e.ctrlKey"),
    "pdfjs-studio.tsx Ctrl+Wheel yakınlaştırma için { passive: false } wheel dinleyicisi içermelidir."
  );

  const toolbarPath = path.join(ROOT, "src/components/dokumantasyon/studio/pdf/pdf-viewer-toolbar.tsx");
  assert(fs.existsSync(toolbarPath), "pdf-viewer-toolbar.tsx mevcut olmalıdır.");
  const toolbarContent = fs.readFileSync(toolbarPath, "utf-8");

  const expectedPdfCommands = [
    "pdf.sidebar.toggle",
    "pdf.page.first",
    "pdf.page.previous",
    "pdf.page.next",
    "pdf.page.last",
    "pdf.zoom.out",
    "pdf.zoom.100",
    "pdf.zoom.in",
    "pdf.zoom.fitWidth",
    "pdf.zoom.fitPage",
    "pdf.rotateView",
    "pdf.tool.select",
    "pdf.tool.hand",
    "pdf.search.open",
    "pdf.print",
  ];

  for (const cmd of expectedPdfCommands) {
    assert(
      toolbarContent.includes(`commandId="${cmd}"`),
      `Toolbar '${cmd}' komutunu içermelidir.`
    );
  }
  logSuccess("Tüm PDF stüdyo komutları ve klavye/fare dinleyicileri doğrulandı.");

  console.log("\n======================================================================");
  console.log("AŞAMA 3/8 TEST SONUCU: PDF VIEWER CORE TESTLERİ %100 BAŞARILI!");
  console.log("======================================================================\n");
}

runStage3Tests().catch((err) => {
  console.error("\n❌ AŞAMA 3/8 DOĞRULAMA HATASI:", err);
  process.exit(1);
});
