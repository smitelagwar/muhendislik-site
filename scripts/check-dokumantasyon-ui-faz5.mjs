/**
 * DÖKÜMANTASYON MODÜLÜ — UI-FAZ 5 DOĞRULAMA VE OTOMATİK TEST PAKETİ
 *
 * Bu test paketi UI-Faz 5 (Gerçek Document Studio + Public Preview Tasarım Sürekliliği)
 * kapsamındaki teknik şartname kriterlerini test eder:
 * 1. DocumentStudioShell ve StudioTopbar Warm Glass Hiyerarşisi
 * 2. Gezinti (Back/Navigation) ve FolderId Korunumu
 * 3. PDF, CAD, Görsel ve Metin Stüdyoları Araç Çubukları Sürekliliği
 * 4. Desteklenmeyen/İndirme Önizleme (UnsupportedPreview) Warm Glass Standartı
 * 5. Public Paylaşım, İndirme Sayfası ve Önizleme Modalı
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

const rootDir = process.cwd();

console.log("======================================================================");
console.log("DÖKÜMANTASYON MODÜLÜ — UI-FAZ 5 KABUL VE ENTEGRASYON TESTİ");
console.log("======================================================================\n");

let passedCount = 0;
let totalCount = 0;

function test(title, fn) {
  totalCount += 1;
  try {
    fn();
    console.log(`✓ [PASS] ${title}`);
    passedCount += 1;
  } catch (error) {
    console.error(`✗ [FAIL] ${title}`);
    console.error(`   Hata: ${error.message}\n`);
  }
}

// 1. DocumentStudioShell & StudioTopbar Testi
test("1. DocumentStudioShell ve StudioTopbar Warm Glass Yapısı", () => {
  const shell = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/studio/document-studio-shell.tsx"), "utf-8");
  const topbar = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/studio/studio-topbar.tsx"), "utf-8");

  assert.ok(shell.includes("data-testid=\"document-studio-shell\""), "Shell data-testid içermeli.");
  assert.ok(topbar.includes("data-testid=\"document-studio-topbar\""), "Topbar data-testid içermeli.");
  assert.ok(topbar.includes("v{versionNo}"), "Topbar sürüm rozeti içermeli.");
  assert.ok(topbar.includes("backdrop-blur-md"), "Topbar backdrop-blur içermeli.");
});

// 2. Gezinti ve Klasör ID Korunumu Testi
test("2. DocumentStudioShell Geri Dönüşte folderId Parametresi Korunumu", () => {
  const shell = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/studio/document-studio-shell.tsx"), "utf-8");

  assert.ok(shell.includes("folderId="), "Geri dönüş URL'inde folderId parametresi kullanılmalı.");
});

// 3. PDF Viewer Toolbar Testi
test("3. PdfViewerToolbar Warm Glass Araç Çubuğu ve Sayfa Kontrolleri", () => {
  const pdfToolbar = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/studio/pdf/pdf-viewer-toolbar.tsx"), "utf-8");

  assert.ok(pdfToolbar.includes("data-testid=\"pdf-viewer-toolbar\""), "PDF toolbar data-testid içermeli.");
  assert.ok(pdfToolbar.includes("backdrop-blur-md"), "PDF toolbar backdrop-blur içermeli.");
  assert.ok(pdfToolbar.includes("pdf.zoom.fitWidth"), "PDF toolbar genişliğe sığdır komutunu içermeli.");
});

// 4. Görsel, Markdown ve Metin Stüdyosu Testi
test("4. ImageViewer, MarkdownViewer ve TextViewer Araç Çubukları", () => {
  const imgViewer = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/preview/image-viewer.tsx"), "utf-8");
  const mdViewer = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/preview/markdown-viewer.tsx"), "utf-8");
  const txtViewer = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/preview/text-viewer.tsx"), "utf-8");

  assert.ok(imgViewer.includes("image.zoom.fit"), "ImageViewer sığdır komutu içermeli.");
  assert.ok(mdViewer.includes("text.copy"), "MarkdownViewer kopyalama komutu içermeli.");
  assert.ok(txtViewer.includes("text.copy"), "TextViewer kopyalama komutu içermeli.");
});

// 5. UnsupportedPreview Testi
test("5. UnsupportedPreview Bilgi Kartı ve İndirme CTA'sı", () => {
  const unsupp = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/preview/unsupported-preview.tsx"), "utf-8");

  assert.ok(unsupp.includes("rounded-2xl"), "UnsupportedPreview rounded-2xl kullanmalı.");
  assert.ok(unsupp.includes("bg-amber-500"), "UnsupportedPreview amber indirme butonu içermeli.");
});

// 6. Public Share & Download View Testi
test("6. PublicShareDownloadView, PublicPreviewModal ve PasswordScreen", () => {
  const downloadView = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/public/download-view.tsx"), "utf-8");
  const previewModal = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/public/public-preview-modal.tsx"), "utf-8");
  const passwordScreen = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/public/password-screen.tsx"), "utf-8");

  assert.ok(downloadView.includes("Tümünü İndir (.ZIP)"), "DownloadView ZIP indirme seçeneği sunmalı.");
  assert.ok(previewModal.includes("z-[90]"), "PublicPreviewModal z-[90] overlay kullanmalı.");
  assert.ok(passwordScreen.includes("Şifre Korumalı Paylaşım"), "PasswordScreen şifre başlığı içermeli.");
});

console.log("======================================================================");
console.log(`TEST SONUCU: ${passedCount}/${totalCount} TEST BAŞARIYLA GEÇTİ!`);
console.log("======================================================================\n");

if (passedCount !== totalCount) {
  process.exit(1);
}
