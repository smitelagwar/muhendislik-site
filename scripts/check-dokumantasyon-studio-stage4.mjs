// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — AŞAMA 4/8 CAD VE DİĞER GÖRÜNTÜLEYİCİLER DOĞRULAMA TESTİ
// ============================================================================

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

console.log("======================================================================");
console.log("DÖKÜMANTASYON MODÜLÜ — AŞAMA 4/8 CAD VE FORMAT STÜDYOLARI DOĞRULAMA");
console.log("======================================================================\n");

function logStep(title) {
  console.log(`\n▶ ${title}`);
}

function logSuccess(msg) {
  console.log(`  ✓ [BAŞARILI] ${msg}`);
}

async function runStage4Tests() {
  // -------------------------------------------------------------------
  // TEST 1: CAD Mock URN ve Katman Simülasyonunun Kaldırılması
  // -------------------------------------------------------------------
  logStep("TEST 1: CAD Dürüstlük Sözleşmesi ve Sahte URN / Mock Katman Denetimi");

  const cadApsPath = path.join(ROOT, "src/lib/dokumantasyon/cad-aps.ts");
  assert(fs.existsSync(cadApsPath), "cad-aps.ts mevcut olmalıdır.");
  const cadApsContent = fs.readFileSync(cadApsPath, "utf-8");

  assert(
    !cadApsContent.includes("mock_aps_client_token"),
    "cad-aps.ts içinde sahte token ('mock_aps_client_token') BULUNMAMALIDIR."
  );

  const cadViewerPath = path.join(ROOT, "src/components/dokumantasyon/preview/cad-viewer.tsx");
  assert(fs.existsSync(cadViewerPath), "cad-viewer.tsx mevcut olmalıdır.");
  const cadViewerContent = fs.readFileSync(cadViewerPath, "utf-8");

  assert(
    !cadViewerContent.includes("mockLayers"),
    "cad-viewer.tsx içinde sahte statik katmanlar ('mockLayers') BULUNMAMALIDIR."
  );
  assert(
    cadViewerContent.includes('commandId="cad.download"'),
    "cad-viewer.tsx cad.download komut butonunu içermelidir."
  );

  // APS Credentials Yokken Durum Denetimi
  const cadApsModule = await import(pathToFileURL(cadApsPath).href);
  const statusRes = await cadApsModule.resolveCadPreviewStatus("test-file-id", ".dwg");
  assert(
    statusRes.status === "unconfigured",
    "APS anahtarları yokken CAD durumu 'unconfigured' (BLOCKED_EXTERNAL_DEPENDENCY) olmalıdır."
  );
  assert(
    statusRes.isAvailable === false,
    "APS anahtarları yokken isAvailable = false olmalıdır."
  );
  assert(
    statusRes.urn === undefined,
    "APS anahtarları yokken sahte URN ÜRETİLMEMELİDİR."
  );

  logSuccess("CAD dürüst durum yönetimi ve sahte URN/katman izolasyonu doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 2: Görsel Görüntüleyici (Image Studio) Yetenekleri ve Komutları
  // -------------------------------------------------------------------
  logStep("TEST 2: Image Studio Zoom, Rotate, Flip, Checkerboard ve Komut Eşleşmesi");

  const imageViewerPath = path.join(ROOT, "src/components/dokumantasyon/preview/image-viewer.tsx");
  assert(fs.existsSync(imageViewerPath), "image-viewer.tsx mevcut olmalıdır.");
  const imageViewerContent = fs.readFileSync(imageViewerPath, "utf-8");

  const expectedImageCommands = [
    "image.zoom.out",
    "image.zoom.100",
    "image.zoom.in",
    "image.zoom.fit",
    "image.rotate.ccw",
    "image.rotate.cw",
    "image.flip.h",
    "image.flip.v",
    "image.checkerboard",
  ];

  for (const cmd of expectedImageCommands) {
    assert(
      imageViewerContent.includes(`commandId="${cmd}"`),
      `Image Studio '${cmd}' komutunu içermelidir.`
    );
  }

  assert(
    imageViewerContent.includes("passive: false") && imageViewerContent.includes("e.ctrlKey"),
    "Image Studio Ctrl+Wheel zoom için { passive: false } dinleyicisi içermelidir."
  );
  logSuccess("Image Studio tüm görsel manipülasyon komutları ve wheel zoom doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 3: Metin, Kod, JSON ve CSV Görüntüleyici
  // -------------------------------------------------------------------
  logStep("TEST 3: Metin, Kod, JSON ve CSV Tablo Görüntüleyici");

  const textViewerPath = path.join(ROOT, "src/components/dokumantasyon/preview/text-viewer.tsx");
  assert(fs.existsSync(textViewerPath), "text-viewer.tsx mevcut olmalıdır.");
  const textViewerContent = fs.readFileSync(textViewerPath, "utf-8");

  assert(
    textViewerContent.includes("linesCount") && textViewerContent.includes("lines.map"),
    "TextViewer satır numaralandırmasını desteklemelidir."
  );
  assert(
    textViewerContent.includes("csvData") && textViewerContent.includes("<table"),
    "TextViewer CSV dosyalarını veri tablosu olarak ayrıştırmalıdır."
  );
  assert(
    textViewerContent.includes("formatted_json") && textViewerContent.includes("JSON.stringify"),
    "TextViewer JSON dosyaları için biçimlendirilmiş görünüm sunmalıdır."
  );
  assert(
    textViewerContent.includes('commandId="text.copy"') && textViewerContent.includes('commandId="text.wrap"'),
    "TextViewer text.copy ve text.wrap komutlarını içermelidir."
  );
  logSuccess("Text, Code, JSON ve CSV stüdyo modları doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 4: Markdown Görüntüleyici ve XSS Güvenliği
  // -------------------------------------------------------------------
  logStep("TEST 4: Markdown Studio GFM ve XSS Sanitizasyonu");

  const mdViewerPath = path.join(ROOT, "src/components/dokumantasyon/preview/markdown-viewer.tsx");
  assert(fs.existsSync(mdViewerPath), "markdown-viewer.tsx mevcut olmalıdır.");
  const mdViewerContent = fs.readFileSync(mdViewerPath, "utf-8");

  assert(
    mdViewerContent.includes("ReactMarkdown") && mdViewerContent.includes("remarkGfm"),
    "MarkdownViewer ReactMarkdown ve remarkGfm eklentisi kullanmalıdır."
  );
  assert(
    mdViewerContent.includes("skipHtml={true}"),
    "MarkdownViewer XSS koruması için skipHtml={true} parametresi içermelidir."
  );
  assert(
    mdViewerContent.includes('mode === "preview"') && mdViewerContent.includes('mode === "raw"'),
    "MarkdownViewer Önizleme ve Ham Kaynak (Raw) çift modunu desteklemelidir."
  );
  logSuccess("Markdown Studio GFM render ve XSS koruması doğrulandı.");

  console.log("\n======================================================================");
  console.log("AŞAMA 4/8 TEST SONUCU: CAD VE FORMAT STÜDYOLARI TESTLERİ %100 BAŞARILI!");
  console.log("======================================================================\n");
}

runStage4Tests().catch((err) => {
  console.error("\n❌ AŞAMA 4/8 DOĞRULAMA HATASI:", err);
  process.exit(1);
});
