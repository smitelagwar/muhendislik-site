// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — 3 AŞAMALI PLAN: AŞAMA 1/3 DOĞRULAMA TESTİ
// ============================================================================

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

function logStep(msg) {
  console.log(`\n▶ ${msg}`);
}

function logSuccess(msg) {
  console.log(`  ✓ [BAŞARILI] ${msg}`);
}

async function runStage1Tests() {
  console.log("======================================================================");
  console.log("DÖKÜMANTASYON MODÜLÜ — AŞAMA 1/3 (ACİL DÜZELTME & VIEWPORT) TESTİ");
  console.log("======================================================================");

  // -------------------------------------------------------------------
  // TEST 1: Navbar ve Footer İzolasyonu (/dokumantasyon/dosya/ Rotasında Gizleme)
  // -------------------------------------------------------------------
  logStep("TEST 1: Navbar ve Footer İzolasyonu");

  const navbarPath = path.join(ROOT, "src/components/navbar.tsx");
  assert(fs.existsSync(navbarPath), "navbar.tsx mevcut olmalıdır.");
  const navbarContent = fs.readFileSync(navbarPath, "utf-8");

  assert(
    navbarContent.includes("pathname?.startsWith(\"/dokumantasyon/dosya/\")") &&
    navbarContent.includes("return null"),
    "navbar.tsx /dokumantasyon/dosya/ rotasında null dönerek site navbar'ını gizlemelidir."
  );

  const footerPath = path.join(ROOT, "src/components/footer.tsx");
  assert(fs.existsSync(footerPath), "footer.tsx mevcut olmalıdır.");
  const footerContent = fs.readFileSync(footerPath, "utf-8");

  assert(
    footerContent.includes("pathname?.startsWith(\"/dokumantasyon/dosya/\")") &&
    footerContent.includes("return null"),
    "footer.tsx /dokumantasyon/dosya/ rotasında null dönerek footer'ı gizlemelidir."
  );
  logSuccess("Site Navbar ve Footer izolasyonu doğrulandı (Studio'da gizleniyor).");

  // -------------------------------------------------------------------
  // TEST 2: Full-Viewport Shell ve Z-Index Önceliği
  // -------------------------------------------------------------------
  logStep("TEST 2: DocumentStudioShell Viewport ve z-index Önceliği");

  const shellPath = path.join(
    ROOT,
    "src/components/dokumantasyon/studio/document-studio-shell.tsx"
  );
  assert(fs.existsSync(shellPath), "document-studio-shell.tsx mevcut olmalıdır.");
  const shellContent = fs.readFileSync(shellPath, "utf-8");

  assert(
    shellContent.includes("fixed inset-0") &&
    shellContent.includes("h-[100dvh]") &&
    shellContent.includes("w-[100dvw]") &&
    shellContent.includes("overflow-hidden"),
    "document-studio-shell.tsx 100dvw x 100dvh ve overflow-hidden tam ekran viewport kaplamalıdır."
  );

  assert(
    shellContent.includes("z-[200]"),
    "document-studio-shell.tsx navbar'ın (z-100) üzerinde kalması için z-[200] z-index'e sahip olmalıdır."
  );
  assert(
    shellContent.includes('data-testid="document-studio-shell"'),
    "document-studio-shell.tsx data-testid='document-studio-shell' test özniteliğini içermelidir."
  );
  logSuccess("Full-Viewport kabuk ve z-[200] önceliği doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 3: Studio Topbar ve PDF Toolbar data-testid Sözleşmesi
  // -------------------------------------------------------------------
  logStep("TEST 3: Studio Topbar ve PDF Toolbar Görünürlük Belirteçleri");

  const topbarPath = path.join(
    ROOT,
    "src/components/dokumantasyon/studio/studio-topbar.tsx"
  );
  assert(fs.existsSync(topbarPath), "studio-topbar.tsx mevcut olmalıdır.");
  const topbarContent = fs.readFileSync(topbarPath, "utf-8");

  assert(
    topbarContent.includes('data-testid="document-studio-topbar"'),
    "studio-topbar.tsx data-testid='document-studio-topbar' içermelidir."
  );

  const toolbarPath = path.join(
    ROOT,
    "src/components/dokumantasyon/studio/pdf/pdf-viewer-toolbar.tsx"
  );
  assert(fs.existsSync(toolbarPath), "pdf-viewer-toolbar.tsx mevcut olmalıdır.");
  const toolbarContent = fs.readFileSync(toolbarPath, "utf-8");

  assert(
    toolbarContent.includes('data-testid="pdf-viewer-toolbar"'),
    "pdf-viewer-toolbar.tsx data-testid='pdf-viewer-toolbar' içermelidir."
  );
  logSuccess("Topbar ve Toolbar test id sözleşmeleri doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 4: Dinamik Fit-Width ve Otomatik Ölçekleme Hesaplaması
  // -------------------------------------------------------------------
  logStep("TEST 4: PDF Otomatik Genişliğe Sığdırma (Fit-Width) Mimarisi");

  const studioViewerPath = path.join(
    ROOT,
    "src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx"
  );
  assert(fs.existsSync(studioViewerPath), "pdfjs-studio.tsx mevcut olmalıdır.");
  const studioViewerContent = fs.readFileSync(studioViewerPath, "utf-8");

  assert(
    studioViewerContent.includes("getViewport({ scale: 1.0 })") &&
    studioViewerContent.includes("computedScale"),
    "pdfjs-studio.tsx açılışta sayfa genişliğini hesaplayarak dinamik fit-width ölçeklemesi yapmalıdır."
  );

  assert(
    studioViewerContent.includes("handleFitWidth") &&
    studioViewerContent.includes("handleFitPage"),
    "pdfjs-studio.tsx handleFitWidth ve handleFitPage fonksiyonlarını barındırmalıdır."
  );
  logSuccess("PDF dinamik fit-width ve başlangıç ölçeklemesi doğrulandı.");

  console.log("\n======================================================================");
  console.log("AŞAMA 1/3 TEST SONUCU: TÜM ACİL DÜZELTME VE VIEWPORT TESTLERİ %100 BAŞARILI!");
  console.log("======================================================================\n");
}

runStage1Tests().catch((err) => {
  console.error("\n❌ AŞAMA 1/3 TEST HATASI:", err);
  process.exit(1);
});
