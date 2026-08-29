# CAD Önizleme V2 — Adım 1 Baseline Raporu

> **Tarih:** 29 Ağustos 2026  
> **Depo:** `muhendis-mimar-portali` (`main`)  
> **Commit HEAD:** `ca3f1e4a324a0be23126bcab7454781baa00114c`  
> **Node:** `v24.15.0` | **npm:** `11.12.1`  
> **Aşama:** ADIM 1/10 — Değiştirilemez baseline ve hedef dosya eşlemesi  
> **Durum:** PASS

---

## 1. Ortam ve Sürüm Özeti

### 1.1 Git ve Çalışma Ağacı
- **HEAD Commit:** `ca3f1e4a324a0be23126bcab7454781baa00114c`
- **Branch:** `main`
- **Git Durumu:** Temiz (Kaynak kodda beklenmeyen uncommitted değişiklik yoktur).

### 1.2 Paket Sürümleri
| Paket | Sürüm | Rol |
|---|---:|---|
| `@mlightcad/cad-simple-viewer` | `1.6.2` | Ana DXF/DWG çizim motoru ve yerel komutlar |
| `@mlightcad/data-model` | `1.14.2` | CAD veri modeli ve sistem değişkenleri |
| `@mlightcad/libredwg-converter` | `3.14.2` | Tarayıcı içi LibreDWG dönüşüm katmanı |
| `dxf-viewer` | `1.0.48` | Eski / degraded DXF fallback |
| `@node-projects/acad-ts` | `2.4.0` | Eski DWG→DXF dönüştürücü fallback |
| `framer-motion` | `12.34.3` | UI animasyonları ve taşınabilir pencere desteği |

---

## 2. Gerçek Corpus ve Kaynak Dosya / Hash Eşlemesi

### 2.1 Doğrulanan Örnek CAD Dosyaları
| Dosya Adı | Boyut | SHA-256 | Format | Rol |
|---|---:|---|:---:|---|
| `1 ve 2.kat dwg.dwg` | 3.44 MB (3,444,087 B) | `6fe1d7ea94576395b058eb75727926f29df5ec157a41da103d159ce988081691` | DWG | Küçük/Orta Proje DWG |
| `MUSTAFA SELVİ 1.KISIM STATİK.dwg` | 16.08 MB (16,084,252 B) | `18fbe9ebf0fc3459c381c81ef45507dc9703caee038933e498c1992985166687` | DWG | Büyük Proje DWG |
| `kiris_acilimlari_tum_katlar.dwg` | 2.14 MB (2,139,550 B) | `1fc6ec0ea29994c65306ec4a0c8b211a7a01d5dfdb552df9275cb6ee3b1dfec0` | DWG | Kiriş Detay DWG |
| `SÜHEYLA KARA STATİK (HAFİF).dxf` | 63.20 MB (63,196,648 B) | `226ebc8c93439e6a0d0a5e81d77a8286a6358356955a165b530dd04e432c7be0` | DXF | Büyük Proje DXF / 0° Kontrol |
| `kiris_acilimlari_tum_katlar.dwf` | 68.76 KB (68,762 B) | `318b76c8c49e757d5ee33e8b4e723525fe1f66d48ba19ecbfbe9c3a373ff255c` | DWF | DWF Formatı |
| `8e3e4ed0-22a3-4420-b6f0-86647b348ee6.dxf` | 4.44 MB (4,443,184 B) | `1611d2e5a40b30eece0cf3545b736b4122fa45e3f43477149a4214fe9d2983c2` | DXF | Hedef 90° KZ Fixture |

### 2.2 Veritabanı ve Depolama Eşlemesi
- **Hedef DXF DB Kaydı:**
  - `id`: `74c5cd26-9e54-4b86-b77b-1d54ff81c151`
  - `display_name`: `1_kisim_tum_kalip_planlari_FINAL_REFERANS_DUZENLI_DONATI_QA.dxf`
  - `blob_pathname`: `dok_storage/8e3e4ed0-22a3-4420-b6f0-86647b348ee6.dxf`
  - `size_bytes`: `4443184`
  - `cad_derivatives`: Mevcut durumda önbellek türevi `[]` (boş).

---

## 3. Hedef KZ49 / KZ50 Entity Teşhisi ve Oracle Tespiti

DXF entity ayrıştırması ile iki farklı dosya üzerindeki KZ entity'leri incelenmiş ve doğrulanmıştır:

### 3.1 Hedef Fixture (`8e3e4ed0-22a3-4420-b6f0-86647b348ee6.dxf`)
- **`KZ49 25/50`:**
  - **Handle (Group 5):** `102C`
  - **Owner (Group 330):** `B58`
  - **Layer (Group 8):** `03_KIRIS`
  - **Entity Tipi:** `TEXT` (AcDbText)
  - **Konum (10, 20, 30):** `(20.2332, 1262.1308, 0.0)`
  - **Yükseklik (40):** `20.9616`
  - **Açı (Group 50):** `90.0°` (DİKEY)
  - **Yazı Tipi (7):** `PDF_ARIAL`

- **`KZ50 25/50`:**
  - **Handle (Group 5):** `102D`
  - **Owner (Group 330):** `B58`
  - **Layer (Group 8):** `03_KIRIS`
  - **Entity Tipi:** `TEXT` (AcDbText)
  - **Konum (10, 20, 30):** `(20.2332, 1546.9200, 0.0)`
  - **Yükseklik (40):** `20.9616`
  - **Açı (Group 50):** `90.0°` (DİKEY)
  - **Yazı Tipi (7):** `PDF_ARIAL`

### 3.2 Kontrol Fixture'ı (`SÜHEYLA KARA STATİK (HAFİF).dxf`)
- **`KZ49 25/50`:**
  - **Handle (Group 5):** `E5C98`
  - **Owner (Group 330):** `1F`
  - **Layer (Group 8):** `Standart`
  - **Entity Tipi:** `TEXT`
  - **Açı (Group 50):** Mevcut değil (DXF varsayılanı `0.0°` — YATAY)
- **`KZ50 25/50`:**
  - **Handle (Group 5):** `E5CE0`
  - **Owner (Group 330):** `1F`
  - **Layer (Group 8):** `Standart`
  - **Entity Tipi:** `TEXT`
  - **Açı (Group 50):** Mevcut değil (DXF varsayılanı `0.0°` — YATAY)

> **Kritik Karar Teyidi:** KZ metinlerini isme bakarak döndürmek kesinlikle yanlıştır. `90°` olan handle'lar dikey, Group 50 içermeyen handle'lar yatay olarak render edilmelidir.

---

## 4. Mevcut CAD Çalışma Hattı ve Davranış Baseline'ı

### 4.1 Aktif Motor ve Routing
- `data-cad-engine`: `upstream` (MLightCAD `1.6.2`)
- **DXF Hattı:** `MLightCAD upstream` → (hata durumunda) `Legacy dxf-viewer`
- **DWG Hattı:** `Cached DXF Kontrolü` → `MLightCAD + LibreDWG` → `Legacy acad-ts` → `APS Terminal Fallback`

### 4.2 Mevcut UI ve Etkileşim Durumu
| Özellik | Mevcut Durum | Not |
|---|:---:|---|
| Pan / Zoom | **PASS** | Mouse wheel ile zoom ve drag ile pan çalışıyor |
| Çizime Sığdır (Fit) | **Kısmi** | Legacy viewer'da var; upstream adapter hostuna henüz React butonu bağlanmamış |
| Renk / Lineweight | **PASS** | `Gerçek Renk`, `Siyah-Beyaz`, `Lineweight` upstream hostunda mevcut |
| Entity Seçimi (Selection) | **FAIL (Hedefe göre)** | Normal tıklama/box seçimi default modda açık; Adım 3'te Read+PAN ile kilitlenecek |
| Command Line | **FAIL (Hedefe göre)** | MLightCAD command line varsayılan olarak mount oluyor; Adım 3'te gizlenecek |
| Mesafe Ölçümü | **Eksik** | Upstream native `measuredistance` komutu mevcut; React toolbar'a açılmamış (Adım 6) |
| Alan Ölçümü | **Eksik** | Upstream native `measurearea` komutu mevcut; React toolbar'a açılmamış (Adım 6) |
| Katman Paneli (Layers) | **Kısmi** | Legacy viewer'da `DxfLayerPanel` var; upstream adapter `layerStore` ile bağlanmamış (Adım 7) |

---

## 5. Doğrulama Komutları ve Sonuçları

```powershell
npm run prebuild
# [cad-upstream] synced workers/wasm/notices -> PASS

node scripts/check-cad-upstream-stage3.mjs  # PASS
node scripts/check-cad-upstream-stage5.mjs  # PASS
node scripts/check-cad-upstream-stage6.mjs  # PASS
node scripts/check-cad-upstream-stage7.mjs  # PASS
node scripts/check-cad-upstream-stage8.mjs  # PASS

npx playwright test --config=playwright.config.ts tests/document-studio/cad-dxf.spec.ts --project=chromium
# 5 passed (1 skipped / real project fixture ile 5/5 passed: 6.2s)
```

---

## 6. Sonuç ve Sonraki Adım

ADIM 1/10 başarıyla tamamlanmıştır. Baseline raporu ve entity eşleşmeleri eksiksiz kaydedilmiştir.

- **Kalan yaklaşık ana adım:** 9
- **Sıradaki tek adım:** ADIM 2/10 — Deterministik test corpus'u ve AutoCAD oracle'ı
