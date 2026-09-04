# CAD / DXF Engine — Measured Performance Baseline (Aşama 1)

> **Tarih:** 04 Eylül 2026  
> **Uygulayıcı:** Gemini 3.8 Flash (High) — Antigravity  
> **Referans Belge:** `C:\Users\hsyn\Downloads\DWG_DXF_NIHAI_Guvenli_Performans_Plani_Gemini38_Antigravity.md`  
> **Değişiklik Sınıfı:** `MEASUREMENT / DOCUMENTATION`  
> **Durum:** Aşama 1 Tamamlandı — STOP GATE  

---

## 1. Baseline Kimlikleri ve Git Durumu

| Parametre | Değer | Açıklama |
|---|---|---|
| **WORKING_BASELINE_COMMIT** | `74e56241359bb4136b46e58705fc55a41dfbc7d0` | Performans çalışmasının başlangıç referansı |
| **HISTORICAL_GOLDEN_COMMIT** | `909c59cb9dcac8e722b3bda4c66fd9d8a25755c8` | Tarihsel IGNORE2 acil durum geri dönüş referansı |
| **RESTORE_COMMIT** | `afbc121923f2de1313801f884f428535334a40cf` | IGNORE2'yi kuran restore commit'i |
| **Backup Ref** | `backup/pre-cad-perf-20260904-1340` | Git tag (kurtarma noktası) |
| **Çalışma Branch'i** | `internal-cad-perf-20260904` | AGENTS standardına uygun izole branch |

### Core Protected Blob Hash Durumu

| Dosya | Golden SHA (`909c59...`) | Working Baseline SHA (`74e562...`) | Durum |
|---|---|---|---|
| `cad-runtime-orchestrator.tsx` | `44d10674954b457d6fd74ba26bf7b7a390c73bf0` | `44d10674954b457d6fd74ba26bf7b7a390c73bf0` | Birebir Eşit |
| `cad-viewer.tsx` | `93c5e3db2ee3bd41eadc34f4f4f38600ca738d2c` | `93c5e3db2ee3bd41eadc34f4f4f38600ca738d2c` | Birebir Eşit |
| `dxf-viewer-worker.ts` | `4b43906928bfcb31d71038b01927d018022cad11` | `4b43906928bfcb31d71038b01927d018022cad11` | Birebir Eşit |
| `cad-view-settings-panel.tsx` | `bd25c149f3cc82a2546919d50f5f89a6277c1d07` | `bd25c149f3cc82a2546919d50f5f89a6277c1d07` | Birebir Eşit |
| `cad-upstream-viewer.tsx` | `1e3461f4499cfb7aba0fc1893c36325668376a4f` | `9796bd2d345a123010550f8b136fc111093bc5bc` | V2 Hardening (Release-ready) |
| `cad-studio-ribbon.tsx` | `1c771ce559855e99d1210c42286a140f547f01a2` | `39f7e92eff1cd0f9289c35c8f082b6c9262da872` | V2 Hardening (Release-ready) |

---

## 2. Bağımlılık ve Paket Snapshot'ı

- `@mlightcad/cad-simple-viewer`: `1.6.2`
- `@mlightcad/data-model`: `1.14.2`
- `@mlightcad/libredwg-converter`: `3.14.2`
- `@mlightcad/libredwg-web`: `0.7.10`
- `dxf-viewer`: `1.0.48`
- `next`: `16.1.6`
- `react`: `19.2.3`
- `typescript`: `^5`

---

## 3. Test Edilen Cihaz ve Ortam Matrisi

1. **Desktop Chromium (Headless / SwiftShader Angle WebGL2)**
   - Viewport: 1280 × 608 (Studio container: full-bleed)
   - DPR: 1.0
2. **Mobile Chromium (Pixel 7 Emulation)**
   - Viewport: 824 × 1454
   - Touch pointer: `coarse` (mobil gesture guard & pinch zoom devrede)
   - DPR: 2.625

---

## 4. Test Edilen Fixture Matrisi

| ID | Dosya Adı | Format | Boyut | Sınıf | Amaç |
|---|---|---|---|---|---|
| **CAD-A** | `known-geometry-measurements.dxf` | DXF | 747 B | Küçük | Temel geometri, ilk cold start ölçümü |
| **CAD-B** | `multi-layout-model-paperspace.dxf` | DXF | 1.419 B | Orta / Layout | Paper space ve model space layout değerlendirmesi |
| **CAD-E** | `cached-derivative.dwg` | DWG | 747 B (DXF) | Türev Hazır | Fast-cache HIT senaryosu |
| **CAD-F** | `kiris_acilimlari_tum_katlar.dwg` | DWG | 2.139.550 B | Gerçek Pafta | Fast-cache MISS / LibreDWG cold parse |
| **CAD-G** | `text-turkish-unicode.dxf` | DXF | 461 B | Metin / Font | Türkçe karakter ve MTEXT font parity doğrulaması |

---

## 5. Ölçülen Deterministik Runtime Waterfall

### A) Masaüstü (Desktop Chromium) Waterfall Aşamaları (ms)

| Aşama / Faz | CAD-A (Cold DXF) | CAD-B (Layout DXF) | CAD-E (DWG Cache HIT) | CAD-F (Cold DWG 2.1 MB) | CAD-G (Warm DXF) |
|---|---|---|---|---|---|
| `mlightcad-import` | 132.2 ms | 38.9 ms | 101.4 ms | 92.8 ms | 12.6 ms |
| `font-preload` | 89.5 ms | 65.6 ms | 108.6 ms | 89.4 ms | 77.1 ms |
| `engine-enhancements` | 139.0 ms | 78.0 ms | 144.7 ms | 151.7 ms | 81.4 ms |
| `libredwg-registration` | 32.5 ms | 6.2 ms | 38.4 ms | 41.3 ms | 3.3 ms |
| `worker-readiness` | 46.8 ms | 41.6 ms | 29.1 ms | 37.0 ms | 29.6 ms |
| `source-fetch` | 3,118.1 ms (cold) | 23.0 ms | 29.9 ms | 32.9 ms | 21.7 ms |
| `open-document` | 61.3 ms | 73.4 ms | 65.7 ms | **3,835.7 ms** | 55.0 ms |
| `wait-until-idle` | 32.7 ms | **2,576.6 ms** | 30.4 ms | **9,532.2 ms** | 417.6 ms |
| `layer-snapshot` | 0.3 ms | 0.1 ms | 0.1 ms | 0.2 ms | 0.0 ms |
| `snap-catalog` | 0.4 ms | 0.2 ms | 0.2 ms | **104.9 ms** | 0.1 ms |
| `text-catalog` | 0.2 ms | 0.1 ms | 0.0 ms | **23.4 ms** | 0.0 ms |
| **Toplam Ready Süresi** | **3,566.6 ms** | **2,839.3 ms** | **441.3 ms** | **13,854.2 ms** | **623.0 ms** |

### B) Mobil (Pixel 7 Emulation) Waterfall Aşamaları (ms)

| Aşama / Faz | CAD-A (Cold DXF) | CAD-B (Layout DXF) | CAD-E (DWG Cache HIT) | CAD-F (Cold DWG 2.1 MB) | CAD-G (Warm DXF) |
|---|---|---|---|---|---|
| `mlightcad-import` | 135.2 ms | 35.4 ms | 95.5 ms | 92.6 ms | 15.5 ms |
| `font-preload` | 95.2 ms | 67.3 ms | 104.3 ms | 132.0 ms | 62.5 ms |
| `engine-enhancements` | 141.8 ms | 78.3 ms | 146.4 ms | 199.5 ms | 69.9 ms |
| `libredwg-registration` | 33.8 ms | 8.6 ms | 42.7 ms | 31.7 ms | 2.3 ms |
| `worker-readiness` | 45.9 ms | 45.6 ms | 47.6 ms | 38.6 ms | 31.1 ms |
| `source-fetch` | 1,672.3 ms | 22.1 ms | 28.7 ms | 34.0 ms | 23.6 ms |
| `open-document` | 56.8 ms | 64.3 ms | 69.5 ms | **3,784.3 ms** | 58.9 ms |
| `wait-until-idle` | 23.5 ms | **2,448.7 ms** | 30.7 ms | **4,612.9 ms** | 433.4 ms |
| `snap-catalog` | 0.4 ms | 0.2 ms | 0.1 ms | **99.0 ms** | 0.0 ms |
| `text-catalog` | 0.1 ms | 0.0 ms | 0.0 ms | **22.4 ms** | 0.0 ms |
| **Toplam Ready Süresi** | **2,112.7 ms** | **2,704.9 ms** | **462.6 ms** | **8,917.4 ms** | **636.4 ms** |

---

## 6. Kritik Darboğaz Analizi (Bulgular)

1. **DWG Fast-Cache'in Gücü (CAD-E):**
   - Türevi hazır olan DWG dosyası **441 ms - 462 ms** içinde tamamen interaktif ve hazır hale gelmektedir.
   - Bu durum, Aşama 6'da ele alınacak olan DWG derivative altyapısının önemini doğrulamaktadır.
2. **Cold DWG Parsing Maliyeti (CAD-F):**
   - 2.14 MB gerçek kiriş açılımı DWG dosyasında `open-document` süresi ~3.8 saniyedir (WASM LibreDWG parser).
   - Sahne montajı ve idle bekleme (`wait-until-idle`) 4.6s - 9.5s arasında sürmektedir.
   - Ana iş parçacığında 9 adet >150 ms (biri 3.8s) uzun görev (long-task) tetiklenmektedir.
3. **Module ve Font Seri Yükleme Gecikmesi:**
   - Her yeni açılışta `mlightcad-import` (35-135 ms), `font-preload` (65-130 ms), `engine-enhancements` (70-199 ms) ve `worker-readiness` (30-47 ms) kritik tıklama yolunda toplam **300 - 500 ms** seri gecikme üretmektedir.
   - Aşama 2 (ön ısıtma) ve Aşama 5 (font paralelleştirme) için bu süre doğrudan kazanım potansiyelidir.
4. **Layout / Paper Space Render Süresi (CAD-B):**
   - Multi-layout dosyalarda `waitUntilIdle` süresi ~2.5 saniyeyi bulmaktadır (viewport hesaplamaları).

---

## 7. WebGL ve Teardown Stres Testi Sonuçları (10x Döngü)

Test senaryosu: İki farklı CAD dosyası arasında 10 kez ardışık açma, kapatma ve geri dönme döngüsü.

- **Döngü Sayısı:** 10 / 10 PASS
- **WebGL Context Kaybı (`webglcontextlost`):** 0 adet
- **Konsol WebGL Hatası:** 0 adet
- **Canvas Elementi DOM Birikimi / Sızıntısı:** 0 adet (her zaman tam olarak 1 aktif canvas)
- **Canvas Çizim Tamponu (Draw Buffer):** 10 döngünün tamamında geçerli WebGL context, genişlik ve yükseklik (>0).
- **Teardown Timeout:** 0 adet (tüm adapter'lar bounded zaman aşımı içinde temizlendi).

---

## 8. Mevcut Test ve Kalite Durumu

- `npx tsc --project tsconfig.next.json --noEmit`: **PASS (0 hata)**
- `npm run build`: **PASS (0 hata)**
- `tests/document-studio/cad-preview-v2-contract.spec.ts`: **PASS (4/4)**
- `tests/document-studio/cad-perf-baseline.spec.ts` (Desktop Chromium): **PASS (2/2)**
- `tests/document-studio/cad-perf-baseline.spec.ts` (Mobile Pixel 7): **PASS (2/2)**
- **Baseline İzolasyon Notu:** `.data/dok_db.json` içindeki dosya sayısının 1 olması sebebiyle `check:cad-real-user-release` scriptinin pre-flight kontrolü (>= 50 dosya şartı) repo baseline gerçeğidir; plana uygun olarak bu aşamada manipüle edilmemiştir.

---

## 9. Aşama 1 Kabul Kararı

- [x] WORKING_BASELINE_COMMIT kaydedildi (`74e56241359bb4136b46e58705fc55a41dfbc7d0`).
- [x] HISTORICAL_GOLDEN_COMMIT ayrı tutuldu (`909c59cb9dcac8e722b3bda4c66fd9d8a25755c8`).
- [x] Gerçek waterfall tablosu (desktop ve mobil) çıkarıldı.
- [x] 5+ fixture sınıfı ölçüldü (CAD-A, CAD-B, CAD-E, CAD-F, CAD-G).
- [x] 10x teardown/WebGL döngüsü doğrulandı.
- [x] CAD motoru davranışı, parser, renderer ve fallback sırasına dokunulmadı.
- [x] Karar: **KEEP (Aşama 1 Başarıyla Tamamlandı)**
