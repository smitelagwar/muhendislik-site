// ============================================================================
// DWG/DXF MOTOR V2 — G16 GERÇEK MOTOR BAĞLI ARAYÜZÜN SON KALİTESİ TESTİ
// ============================================================================
// Sözleşme: motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md (G16),
// motor_v2/21_ARAYUZ_TASARIM_SISTEMI.md, motor_v2/22_ARAYUZ_SENARYOLARI_VE_KABUL.md
// Gereksinimler: R32–R35, R42 | Ekranlar: UI01–UI20

import fs from "node:fs";
import path from "node:path";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

async function runUiQualityAcceptanceTests() {
  console.log("=== DWG/DXF Motor V2 - G16 Gerçek Motor Arayüz Kalitesi Testi ===\n");

  const hostShellPath = path.join(process.cwd(), "src/components/dokumantasyon/cad-v2/cad-v2-host-shell.tsx");
  assert(fs.existsSync(hostShellPath), "CadV2HostShell bileşeni mevcut");
  const hostShellCode = fs.readFileSync(hostShellPath, "utf-8");

  // --------------------------------------------------------------------------
  // BÖLÜM 1: UI01 - UI20 Durum Makinesi ve Görünür Durumlar (R32, R33, R35)
  // --------------------------------------------------------------------------
  console.log("--- BÖLÜM 1: Durum Makinesi ve UI Senaryoları (UI01 - UI20) ---");

  const requiredPhases = [
    "authorizing",
    "preparing",
    "loading",
    "ready",
    "degraded",
    "cancelled",
    "context-lost",
    "error",
  ];
  for (const p of requiredPhases) {
    assert(hostShellCode.includes(`"${p}"`), `Host state machine durumu tanımlı: ${p}`);
  }

  // --------------------------------------------------------------------------
  // BÖLÜM 2: Mikro Metinler ve Türkçe Dil Bütünlüğü (motor_v2/22 sözleşmesi)
  // --------------------------------------------------------------------------
  console.log("\n--- BÖLÜM 2: Türkçe Mikro Metinler ve Kullanıcı İletişimi ---");

  const expectedMicroTexts = [
    "DWG Motor V2 Hazırlanıyor",
    "İptal Et",
    "Görüntü yeniden hazırlanıyor...",
    "Grafik bağlamı geçici olarak kaybedildi",
    "İşlem İptal Edildi",
    "Çizim hazırlama işlemi kullanıcı tarafından sonlandırıldı",
    "Geri Dön",
    "Görüntüleme Başarısız",
    "Mevcut Görüntüleyiciyle Aç",
    "Tekrar Dene",
  ];

  for (const text of expectedMicroTexts) {
    assert(hostShellCode.includes(text), `Türkçe mikro metin mevcut: "${text}"`);
  }

  // --------------------------------------------------------------------------
  // BÖLÜM 3: Mobil Dokunma Güvenliği ve Viewport İzolasyonu (N18, UI03, UI20)
  // --------------------------------------------------------------------------
  console.log("\n--- BÖLÜM 3: Mobil Dokunma Güvenliği ve Viewport Koruması ---");

  // Çizim yüzeyi canvas dokunma kuralı
  const canvasPath = path.join(process.cwd(), "src/components/dokumantasyon/cad-v2/cad-v2-canvas.tsx");
  assert(fs.existsSync(canvasPath), "CadV2Canvas bileşeni mevcut");
  const canvasCode = fs.readFileSync(canvasPath, "utf-8");

  assert(
    canvasCode.includes('touchAction: "none"') || canvasCode.includes("touch-none"),
    "Çizim kanvasında touch-action: none tanımlı (sayfa kayması önlenir)"
  );

  // Panel ve sheet dokunma kuralı
  assert(
    hostShellCode.includes('touchAction: "pan-y"'),
    "Katman ve ayar panellerinde touchAction: pan-y tanımlı (panel içi bağımsız kaydırma)"
  );

  // --------------------------------------------------------------------------
  // BÖLÜM 4: Tema ve Görünüm Ayarları Sözleşmesi (UI02, UI13)
  // --------------------------------------------------------------------------
  console.log("\n--- BÖLÜM 4: Tema ve Görünüm Ayarları ---");

  const settingsPanelPath = path.join(
    process.cwd(),
    "src/components/dokumantasyon/cad-v2/cad-v2-view-settings-panel.tsx"
  );
  assert(fs.existsSync(settingsPanelPath), "CadV2ViewSettingsPanel bileşeni mevcut");
  const settingsCode = fs.readFileSync(settingsPanelPath, "utf-8");

  assert(settingsCode.includes("monochrome"), "Tek renk (monokrom) görünüm ayarı mevcut");
  assert(settingsCode.includes("showLineweights"), "Çizgi kalınlığı (lineweight) görünüm ayarı mevcut");
  assert(settingsCode.includes("background"), "Arka plan renk seçimi (Siyah / Koyu Gri / Açık) mevcut");

  // --------------------------------------------------------------------------
  // BÖLÜM 5: Production Yolunda Mock / Sahte Veri Olmadığının Doğrulanması (R42)
  // --------------------------------------------------------------------------
  console.log("\n--- BÖLÜM 5: Sahte Veri (Fake Fixture / Mock) İzolasyonu ---");

  // CadV2HostShell gerçek API rotalarına bağlanmalı, mock fixture import etmemeli
  assert(!hostShellCode.includes("fixtures-manifest"), "Production host shell fixtures-manifest import etmiyor");
  assert(!hostShellCode.includes("syntheticFixtures"), "Production host shell sentetik fixture import etmiyor");
  assert(!hostShellCode.includes("setTimeout(r, 999999)"), "Production kodunda yapay takılı kalma yok");

  console.log("\n>>> G16 GERÇEK MOTOR ARAYÜZ KALİTESİ TESTLERİ BAŞARIYLA GEÇTİ (PASS) <<<");
}

runUiQualityAcceptanceTests().catch((err) => {
  console.error("Beklenmeyen hata:", err);
  process.exit(1);
});
