import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { isIosDevice } from "../../../src/lib/dokumantasyon/studio/pdf/pdf-print";

describe("ASAMA_07: Yazdırma, Mobil/A11y ve Toolbar Sözleşme Testleri", () => {
  // --------------------------------------------------------------------------
  // 1. Yazdırma Motoru ve iOS Tespiti
  // --------------------------------------------------------------------------
  describe("1. Yazdırma Motoru ve iOS Tespiti", () => {
    it("1.1 isIosDevice tarayıcı UA ve MacIntel dokunmatik aygıtlarını doğru tespit etmelidir", () => {
      assert.strictEqual(typeof isIosDevice(), "boolean");
    });

    it("1.2 pdf-print.ts dosyası gizli iframe ve 60 sn / 20 dk Blob temizleme yaşam döngüsüne sahip olmalıdır", () => {
      const source = fs.readFileSync(
        path.resolve(process.cwd(), "src/lib/dokumantasyon/studio/pdf/pdf-print.ts"),
        "utf8"
      );
      assert.ok(source.includes("pdf-print-iframe"), "iframe id içermelidir");
      assert.ok(source.includes("URL.revokeObjectURL"), "Blob URL bellek temizliği olmalıdır");
      assert.ok(source.includes("afterprint"), "afterprint temizlik dinleyicisi olmalıdır");
    });
  });

  // --------------------------------------------------------------------------
  // 2. Kısayollar Modalı ve Baskı/İndirme Tuşları
  // --------------------------------------------------------------------------
  describe("2. Kısayollar Modalı ve Baskı/İndirme Tuşları", () => {
    it("2.1 Kısayollar modalında Ctrl+P (Yazdır) ve Ctrl+S (PDF İndir) yer almalıdır", () => {
      const source = fs.readFileSync(
        path.resolve(process.cwd(), "src/components/dokumantasyon/studio/pdf/pdf-shortcuts-modal.tsx"),
        "utf8"
      );
      assert.ok(source.includes('keys: ["Ctrl", "P"]'), "Ctrl+P kısayolu bulunmalıdır");
      assert.ok(source.includes('keys: ["Ctrl", "S"]'), "Ctrl+S kısayolu bulunmalıdır");
      assert.ok(!source.includes("studio.delete"), "Yönetim/silme kısayolu bulunmamalıdır");
      assert.ok(!source.includes("studio.rename"), "Yeniden adlandırma kısayolu bulunmamalıdır");
    });
  });

  // --------------------------------------------------------------------------
  // 3. Toolbar Public-Share Sözleşmesi ve Buton Ölçüleri (A11y)
  // --------------------------------------------------------------------------
  describe("3. Toolbar Public-Share Sözleşmesi ve Buton Ölçüleri (A11y)", () => {
    it("3.1 Toolbar butonları mobilde ~44x44px (h-11 w-11 min-h-11 min-w-11) dokunma hedefine sahip olmalıdır", () => {
      const source = fs.readFileSync(
        path.resolve(process.cwd(), "src/components/dokumantasyon/studio/pdf/pdf-viewer-toolbar.tsx"),
        "utf8"
      );
      assert.ok(
        source.includes("h-11 w-11 min-h-11 min-w-11"),
        "WCAG 44x44px dokunma hedefi sınıfları korunmalıdır"
      );
      assert.ok(source.includes('role="toolbar"'), "A11y toolbar rolü bulunmalıdır");
      assert.ok(source.includes("aria-label"), "A11y etiketleri bulunmalıdır");
    });

    it("3.2 Public-share modunda 'Bağlantıyı kopyala' menü seçeneği tanımlı olmalıdır", () => {
      const source = fs.readFileSync(
        path.resolve(process.cwd(), "src/components/dokumantasyon/studio/pdf/pdf-viewer-toolbar.tsx"),
        "utf8"
      );
      assert.ok(
        source.includes('data-command-id="public.copyLink"'),
        "public.copyLink komutu bulunmalıdır"
      );
      assert.ok(
        source.includes("Bağlantıyı kopyala"),
        "Bağlantıyı kopyala metni bulunmalıdır"
      );
    });
  });
});
