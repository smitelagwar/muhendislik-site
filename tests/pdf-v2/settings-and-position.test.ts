import assert from "node:assert/strict";
import {
  getPdfSettings,
  setPdfSettings,
  getPdfReadingPosition,
  savePdfReadingPosition,
  STORAGE_KEY_V2,
  SETTINGS_KEY_V2,
} from "../../src/lib/dokumantasyon/studio/pdf/pdf-reading-position";

// Mock localStorage for Node environment
const mockStorage = new Map<string, string>();
(global as any).window = {
  location: { hash: "" },
};
(global as any).localStorage = {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, val: string) => mockStorage.set(key, val),
  removeItem: (key: string) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

async function runTests() {
  console.log("==> PDF Ayarlar ve Okuma Konumu (Faz H) Birim Testleri Başlatılıyor...");

  mockStorage.clear();

  // 1. Varsayılan Ayarlar (Default Settings)
  const defaultSettings = getPdfSettings();
  assert.equal(defaultSettings.rememberPosition, true, "Varsayılan: son konum açık");
  assert.equal(defaultSettings.nightMode, false, "Varsayılan: gece modu kapalı");
  assert.equal(defaultSettings.defaultViewMode, "fit-width", "Varsayılan: genişliğe sığdır");
  assert.equal(defaultSettings.reduceMotion, "system", "Varsayılan: sistem hareketi");
  console.log("✓ Varsayılan Ayarlar Doğrulandı");

  // 2. Ayar Güncelleme ve Kalıcılık
  const updatedSettings = setPdfSettings({ nightMode: true, defaultViewMode: "fit-page" });
  assert.equal(updatedSettings.nightMode, true);
  assert.equal(updatedSettings.defaultViewMode, "fit-page");
  assert.equal(getPdfSettings().nightMode, true, "Gece modu kalıcı olmalı");
  assert.equal(getPdfSettings().defaultViewMode, "fit-page", "Görünüm modu kalıcı olmalı");
  console.log("✓ Ayar Güncelleme Doğrulandı");

  // 3. Okuma Konumu Kaydetme ve Geri Alma
  savePdfReadingPosition("file-123", {
    page: 10,
    offsetRatio: 0.5,
    scaleMode: "fit-width",
    scale: 1.25,
    fileVersion: "v1-1000",
  });

  const pos1 = getPdfReadingPosition("file-123", "v1-1000");
  assert.ok(pos1, "Konum kaydı bulunmalı");
  assert.equal(pos1.page, 10, "Sayfa 10 olmalı");
  assert.equal(pos1.offsetRatio, 0.5, "Offset ratio 0.5 (sayfa ortası) olmalı");
  assert.equal(pos1.scaleMode, "fit-width");
  assert.equal(pos1.scale, 1.25);
  console.log("✓ Okuma Konumu Kaydetme ve Geri Alma Doğrulandı");

  // 4. Dosya Sürümü Değiştiğinde Konum İptali (fileVersion Invalidated)
  const posMismatched = getPdfReadingPosition("file-123", "v2-2000");
  assert.equal(posMismatched, null, "Dosya sürümü değişince eski konum kullanılmamalı (null dönmeli)");
  console.log("✓ Dosya Sürüm Değişimi Geçersiz Kılma Doğrulandı");

  // 5. Ayar Kapalıyken Konum Hatırlanmamalı
  setPdfSettings({ rememberPosition: false });
  assert.equal(getPdfReadingPosition("file-123", "v1-1000"), null, "Ayar kapalıyken konum null dönmeli");

  setPdfSettings({ rememberPosition: true });
  assert.ok(getPdfReadingPosition("file-123", "v1-1000"), "Ayar açılınca konum tekrar okunabilmeli");
  console.log("✓ Son Konumdan Devam Et Aç/Kapa Doğrulandı");

  // 6. En Fazla 50 Dosya Tutma Sınırı (Trimming)
  for (let i = 1; i <= 60; i++) {
    savePdfReadingPosition(`file-${i}`, {
      page: i,
      offsetRatio: 0.1,
      updatedAt: 1000 + i,
    });
  }

  const rawStorage = JSON.parse(mockStorage.get(STORAGE_KEY_V2)!);
  const storedKeys = Object.keys(rawStorage);
  assert.equal(storedKeys.length, 50, "Depolamada tam 50 dosya kalmalı");
  assert.equal(storedKeys.includes("file-1"), false, "En eski file-1 silinmiş olmalı");
  assert.equal(storedKeys.includes("file-60"), true, "En yeni file-60 mevcut olmalı");
  console.log("✓ 50 Dosya Saklama ve Temizleme Sınırı Doğrulandı");

  console.log("==> TÜM AYARLAR VE OKUMA KONUMU TESTLERİ BAŞARIYLA TAMAMLANDI ✅");
}

runTests().catch((err) => {
  console.error("Test hatası:", err);
  process.exit(1);
});
