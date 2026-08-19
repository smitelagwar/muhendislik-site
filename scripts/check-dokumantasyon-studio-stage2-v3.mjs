// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — 3 AŞAMALI PLAN: AŞAMA 2/3 DOĞRULAMA TESTİ
// ============================================================================

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

function logStep(msg) {
  console.log(`\n▶ ${msg}`);
}

function logSuccess(msg) {
  console.log(`  ✓ [BAŞARILI] ${msg}`);
}

async function runStage2Tests() {
  console.log("======================================================================");
  console.log("DÖKÜMANTASYON MODÜLÜ — AŞAMA 2/3 (PROFESYONEL PDF.JS MOTORU) TESTİ");
  console.log("======================================================================");

  // -------------------------------------------------------------------
  // TEST 1: PDF.js Güvenlik Geçidi ve Self-Hosted Yükleyici
  // -------------------------------------------------------------------
  logStep("TEST 1: PDF.js Güvenlik Geçidi ve Self-Hosted Kütüphane Yükleyici");

  const loaderPath = path.join(
    ROOT,
    "src/lib/dokumantasyon/studio/pdf/pdfjs-loader.ts"
  );
  assert(fs.existsSync(loaderPath), "pdfjs-loader.ts mevcut olmalıdır.");
  const loaderContent = fs.readFileSync(loaderPath, "utf-8");

  assert(
    loaderContent.includes("/vendor/pdfjs/pdf.min.js"),
    "PDF.js /vendor/pdfjs yerel dizininden yüklenmelidir."
  );
  assert(
    !loaderContent.includes("cdnjs.cloudflare.com"),
    "PDF.js için CDN fallback YASAKTIR."
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

  const studioViewerPath = path.join(
    ROOT,
    "src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx"
  );
  assert(fs.existsSync(studioViewerPath), "pdfjs-studio.tsx mevcut olmalıdır.");
  const studioViewerContent = fs.readFileSync(studioViewerPath, "utf-8");

  assert(
    studioViewerContent.includes("Array.from({ length: numPages }"),
    "pdfjs-studio.tsx tüm sayfaları continuous dikey listede render etmelidir."
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

  const pageViewPath = path.join(
    ROOT,
    "src/components/dokumantasyon/studio/pdf/pdf-page-view.tsx"
  );
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

  const searchPath = path.join(
    ROOT,
    "src/lib/dokumantasyon/studio/pdf/pdf-search.ts"
  );
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

  // Mock PDF Doc üzerinde arama testi
  const mockPdfDoc = {
    numPages: 2,
    getPage: async (num) => ({
      getTextContent: async () => ({
        items: [
          {
            str:
              num === 1
                ? "1. KAT KALIP VE DONATI PLANI PB108 KİRİŞİ"
                : "2. KAT ASANSÖR KUYUSU DETAYI",
          },
        ],
      }),
    }),
  };

  const res1 = await searchModule.searchInPdfDocument(mockPdfDoc, "PB108");
  assert.strictEqual(res1.totalMatches, 1, "PB108 araması 1 eşleşme bulmalıdır.");
  assert.strictEqual(res1.matches[0].pageNumber, 1, "Eşleşme 1. sayfada olmalıdır.");

  const res2 = await searchModule.searchInPdfDocument(mockPdfDoc, "kirişi");
  assert.strictEqual(
    res2.totalMatches,
    1,
    "Türkçe karakter duyarlı 'kirişi' araması eşleşmelidir."
  );

  const res3 = await searchModule.searchInPdfDocument(mockPdfDoc, "bulunmayan_kelime");
  assert.strictEqual(res3.totalMatches, 0, "Olmayan kelime 0 eşleşme dönmelidir.");

  logSuccess("Türkçe karakter duyarlı PDF arama algoritması %100 doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 5: Sınırsız Sayfa Destekli Tembel Küçük Resimler (Thumbnails)
  // -------------------------------------------------------------------
  logStep("TEST 5: Sınırsız Sayfa Destekli Tembel Küçük Resimler");

  const thumbnailSidebarPath = path.join(
    ROOT,
    "src/components/dokumantasyon/studio/pdf/pdf-thumbnail-sidebar.tsx"
  );
  assert(fs.existsSync(thumbnailSidebarPath), "pdf-thumbnail-sidebar.tsx mevcut olmalıdır.");
  const thumbnailSidebarContent = fs.readFileSync(thumbnailSidebarPath, "utf-8");

  assert(
    !thumbnailSidebarContent.includes("Math.min(numPages, 30)"),
    "Küçük resimler 30 sayfa ile KISITLANMAMALIDIR."
  );
  assert(
    thumbnailSidebarContent.includes("IntersectionObserver"),
    "ThumbnailItem yalnızca viewport'a yaklaşınca render edilmelidir."
  );
  logSuccess("Sınırsız ve sanallaştırılmış thumbnail kenar çubuğu doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 6: Ctrl + Wheel Zoom Dinleyicisi ve Toolbar Komutları
  // -------------------------------------------------------------------
  logStep("TEST 6: Wheel Zoom ve PDF Toolbar Komut Eşleşmesi");

  assert(
    studioViewerContent.includes("addEventListener(\"wheel\", handleWheel, { passive: false })"),
    "pdfjs-studio.tsx passive: false ile wheel event dinleyicisi bağlamalıdır."
  );
  assert(
    studioViewerContent.includes("e.ctrlKey || e.metaKey") &&
    studioViewerContent.includes("e.preventDefault()"),
    "pdfjs-studio.tsx Ctrl+Wheel yakalayıp tarayıcı zoom'unu engelleyerek iç zoom yapmalıdır."
  );

  // Toolbar Komutları
  const toolbarPath = path.join(
    ROOT,
    "src/components/dokumantasyon/studio/pdf/pdf-viewer-toolbar.tsx"
  );
  const toolbarContent = fs.readFileSync(toolbarPath, "utf-8");

  const mandatoryCommands = [
    "pdf.sidebar.toggle",
    "pdf.page.first",
    "pdf.page.previous",
    "pdf.page.next",
    "pdf.page.last",
    "pdf.search.open",
    "pdf.tool.select",
    "pdf.tool.hand",
    "pdf.zoom.out",
    "pdf.zoom.100",
    "pdf.zoom.in",
    "pdf.zoom.fitWidth",
    "pdf.zoom.fitPage",
    "pdf.rotateView",
    "pdf.print",
  ];

  for (const cmd of mandatoryCommands) {
    assert(
      toolbarContent.includes(`commandId="${cmd}"`),
      `PDF Viewer Toolbar '${cmd}' komutunu içermelidir.`
    );
  }
  logSuccess("Tüm PDF stüdyo komutları ve klavye/fare dinleyicileri doğrulandı.");

  console.log("\n======================================================================");
  console.log("AŞAMA 2/3 TEST SONUCU: PDF VIEWER CORE TESTLERİ %100 BAŞARILI!");
  console.log("======================================================================\n");
}

runStage2Tests().catch((err) => {
  console.error("\n❌ AŞAMA 2/3 TEST HATASI:", err);
  process.exit(1);
});
