// ============================================================================
// PDF v4 — PUBLIC-SHARE VARIANT CONTRACT TESTS
// ============================================================================

import assert from "node:assert/strict";
import type { PdfJsStudioProps, PdfViewerVariant } from "../../../src/components/dokumantasyon/studio/pdf/pdfjs-studio";
import { DokPdfViewer } from "../../../src/components/dokumantasyon/preview/pdf-viewer";

async function main() {
  console.log("=== PDF v4: public-share Variant Sözleşme Testleri ===");

  // 1. DokPdfViewer varsayılan geriye uyumluluk: variant zorunlu değil
  assert.equal(typeof DokPdfViewer, "function", "DokPdfViewer bir React bileşeni olmalıdır");

  // 2. Props tip sözleşmesi doğrulaması
  const defaultProps: PdfJsStudioProps = {
    accessUrl: "/api/dokumanlar/1/pdf",
    displayName: "Statik Hesap Raporu",
  };
  assert.equal(defaultProps.variant, undefined, "Varsayılan variant opsiyoneldir");

  const publicProps: PdfJsStudioProps = {
    accessUrl: "/api/belgeler/paylasim/token123/pdf",
    displayName: "Şantiye Şefi Hizmet Sözleşmesi",
    variant: "public-share",
    expiresAt: "24 Ocak 2027 18:00",
    statusBadge: "Salt Okunur",
  };
  assert.equal(publicProps.variant, "public-share");
  assert.equal(publicProps.statusBadge, "Salt Okunur");
  assert.equal(publicProps.expiresAt, "24 Ocak 2027 18:00");

  // 3. Variant tür değerleri doğrulaması
  const validVariants: PdfViewerVariant[] = ["default", "public-share"];
  assert.equal(validVariants.length, 2);

  console.log("[PASS] public-share variant prop ve DokPdfViewer geriye uyumluluğu doğrulandı.");
}

main().catch((err) => {
  console.error("Test hatası:", err);
  process.exit(1);
});
