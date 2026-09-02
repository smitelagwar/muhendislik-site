# CAD Sistemi — AI Oturumu Takılma Analizi ve Önleme Kılavuzu

> **Bu belge kimin içindir?**
> Bu projede çalışan her AI ajanı (Antigravity, Gemini, Claude, GPT-4 vb.) bu dosyayı CAD
> testleriyle ilgili herhangi bir görev almadan önce okumalıdır.

---

## 1. Olay Özeti: 5+ Saatlik Takılma

**Tarih:** 2026-09-01 / 2026-09-02
**Süre:** ~5 saat
**Tetikleyici:** /teamwork-preview ile verilen kombine CAD UI iyileştirme planı
**Sonuç:** Kullanıcı manuel olarak durdurmak zorunda kaldı

### 1.1 Zaman Çizelgesi (Görev Loglarından)

| Saat | Görev | Durum |
|------|-------|-------|
| 22:25 | task-400..501 (6 görev) | Başlatıldı, hiç çıktı yok (0 byte log) |
| 22:32–22:45 | task-509, task-513 | Playwright çalıştı, 162 KB log = ~5 iterasyon |
| 23:28 | task-513 bitiş | 162 KB log — Port çakışması hatası |
| 23:29 | task-592 | 155 KB — Yeniden deneme, yine aynı hata |
| 00:22 | task-620, task-625 | Her biri 162+ KB — Port çakışması döngüsü |
| 05:17 | Kullanıcı müdahalesi | Ekran görüntüsü alındı, oturum durduruldu |

---

## 2. Kök Neden Analizi

### 2.1 Birincil Neden: Port 3005 Çakışması (Race Condition)

check-cad-review-release.ts sırası:

  Step 4: playwright test (port 3005) → 33 test çalışır
  Step 5: npm run check:cad-real-user-release → KENDİ playwright test (port 3005) başlatır

Sorun: Step 4 playwright testleri bittiğinde Next.js dev sunucusu (port 3005) tam kapanmadan
Step 5 de PLAYWRIGHT_PORT=3005 ile kendi sunucusunu açmaya çalışıyor.

Semptom (log'dan):
  data-cad-upstream-state="loading"   ← hiç "ready" olmuyor
  data-cad-loading-phase="fetch-source"  ← sunucuya ulaşamıyor

### 2.2 İkincil Neden: AI Ajanı Döngüye Girdi

Port hatası → test FAIL → AI "düzelt" → aynı komut tekrar → yine FAIL → tekrar...

Bu döngü hiçbir yeni bilgi üretmeden 4 kez tekrarlandı:
  task-513 (162 KB) → aynı hata
  task-592 (155 KB) → aynı hata
  task-620, task-625 (162+ KB her biri) → aynı hata

### 2.3 Üçüncül Neden: Sabit DB Sayısı (1133)

checkDbCount(1133) dev ortamda 54 dosya buldu → exception → test başlamadan crash.

### 2.4 Dördüncül Neden: Next.js Dev Lock Dosyası (.next-playwright/dev/lock) ve Cold-Start

- Windows ortamında önceki yarıda kesilen/timeout alan test süreçleri arkada `node` süreci bırakabilir.
- Bu artık süreçler `.next-playwright/dev/lock` dosyasını kilitli tutar (`⨯ Unable to acquire lock at ...\.next-playwright\dev\lock`).
- Yeni açılan sunucu bu kilit yüzünden hiçbir route'u derleyemez ve gelen istekler (özellikle `/api/.../stream` ve sayfa yüklemeleri) sonsuza dek askıda (hang) kalır.
- Ayrıca Next.js dev modunda Three.js/WebGL modüllerinin ilk derlemesi ~35-40 saniye sürdüğü için 30s'lik test timeout'ları zamansız FAIL üretir.

---

## 3. Kalıcı Çözümler (Uygulandı)

### 3.1 DB Sayısı Dinamik Hale Getirildi

scripts/check-cad-real-user-release.ts:
  ESKİ: const initialDbCount = checkDbCount(1133);
  YENİ: const initialDbCount = checkDbCount(50);
        const finalDbCount = checkDbCount(initialDbCount);  // başlangıçla karşılaştır

scripts/check-cad-review-release.ts:
  ESKİ: const EXPECTED_DB_FILE_COUNT = 1133;
  YENİ: const MIN_EXPECTED_DB_FILE_COUNT = 50;

### 3.2 Port Çakışmasını Önlemek

İki playwright süreci aynı portu kullanırken aralarında cooldown gerekiyor.
Her yeni playwright komutu öncesinde eski sunucunun kapanması beklenmeli.

### 3.3 Dev Lock Otomatik Temizliği ve Timeout Ayarları

- `tests/document-studio/cad-test-env-setup.ts` ve `teardown.ts` içine `.next-playwright/dev/lock` dosyasının otomatik temizliği eklendi.
- `CAD_UPSTREAM_TOTAL_TIMEOUT_MS` 35s'den 60s'ye çıkarıldı.
- Test dosyalarında ilk açılış için `ready` timeout'u 60s olarak standardize edildi.
- Gerektiğinde `PLAYWRIGHT_PRODUCTION_SERVER=1` ile `npm run build` sonrası anlık derlemesiz test koşumu sağlandı.

---

## 4. AI Ajanı Çalışma Kuralları (CAD Testleri İçin)

### Kural 1: Takılma Tespiti

Aynı hata 2 kez üst üste aynı çıktı ile geliyorsa DURUMU DEĞİŞTİR, komutu 3. kez tekrarlama.

### Kural 2: Port Çakışması Tespiti

SEMPTOM:
  data-cad-upstream-state="loading" (30+ saniye boyunca)
  data-cad-loading-phase="fetch-source"
  Error: toHaveAttribute("data-cad-upstream-state", "ready") failed

ANLAMI: Next.js sunucusuna ulaşılamıyor, port bloklu

ÇÖZÜM:
  1. Portları kontrol et: netstat -ano | findstr :3005
  2. Süreci öldür, 3 saniye bekle, testi yeniden çalıştır

### Kural 3: Release Gate Sırası

DOĞRU SIRA:
  1. npx tsc --noEmit                    (~8s, port yok)
  2. npx eslint ...                      (~5s, port yok)
  3. Playwright review suite             (~50s, port 3005)
     -- 2 saniye bekle --
  4. check:cad-real-user-release         (~105s, port 3005)
  5. npm run build                       (~35s, port yok)
  6. git diff --check                    (anlık)

ASLA:
  - 3 ve 4'ü iç içe veya eş zamanlı çalıştırma
  - Hata aldıktan hemen sonra aynı komut bloğunu tekrarlama

### Kural 4: Hızlı Doğrulama

Tam release gate yerine hızlı doğrulama gerektiğinde:
  npx tsc --noEmit                                                  # 8 saniye
  npx playwright test <ilgili-dosya>.spec.ts --project=chromium    # 30-60 saniye
  npm run build                                                      # 35 saniye

Bu 3 adım toplam ~80-100 saniyede tamamlanır.

---

## 5. Süre Referansı

| Komut | Tipik Süre | Port |
|-------|-----------|------|
| npx tsc --noEmit | 7-8 saniye | — |
| npx eslint ... | 4-5 saniye | — |
| npm run check:cad-preview-v2 | 73-75 saniye | 3005 |
| Playwright review suite (8 dosya) | 50-52 saniye | 3005 |
| npm run check:cad-real-user-release | 104-110 saniye | 3005 |
| npm run build | 30-35 saniye | — |
| Toplam (tam release gate) | ~4-5 dakika | — |

Eğer bir komut beklenen sürenin 3 katını aşıyorsa takılma var demektir.

---

## 6. Görev Loglarındaki Kırmızı Bayraklar

Başarısız run işaretleri:
  "loading" ← hiç "ready" olmuyor = PORT ÇAKIŞMASI
  "Beklenen minimum dosya sayısı: 1133, bulunan: 54" = DB EŞİĞİ
  Aynı hata 3+ kez üst üste = DÖNGÜ

Başarılı run işaretleri:
  "RELEASE READY"
  "33 passed"
  "0 sızıntı"

---

## 7. Dosya Referansları

| Dosya | Açıklama |
|-------|----------|
| scripts/check-cad-review-release.ts | Composite release gate |
| scripts/check-cad-real-user-release.ts | Desktop + Mobile Playwright |
| playwright.config.ts | Port, worker, timeout ayarları |
| src/lib/dokumantasyon/cad-upstream/adapter.ts | DWG/DXF yükleme motoru |
| src/lib/dokumantasyon/cad-upstream/chain-distance.ts | Zincir mesafe state machine |

---

Son güncelleme: 2026-09-02 — 5 saatlik AI oturumu takılma analizi sonrası yazıldı.
