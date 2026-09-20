# DWG/DXF Motor V2 — Gerçek Masaüstü DWG Yükleme, Açılış ve Deney Planı

**Tarih:** 20 Eylül 2026  
**Uygulayıcı Motor:** Gemini 3.8 Flash High  
**Amaç:** Kullanıcının masaüstünde yer alan 2 gerçek AutoCAD DWG projesini localhost Dokümantasyon sistemine yüklemek, DWG Motor V2'de açmak ve kullanıcı incelediğinde hiçbir sürprizle karşılaşmaması için tüm görsel, etkileşim, katman, performans ve kurtarma deneylerini uçtan uca doğrulamak.

---

## 1. HEDEF DOSYALAR VE ÖN BİLGİ

| Dosya Adı | Konum | Boyut | Mimari / Statik Tipi |
|---|---|---|---|
| `1 ve 2.kat dwg.dwg` | `C:\Users\hsyn\Desktop\1 ve 2.kat dwg.dwg` | ~3.44 MB (3.444.087 bayt) | Mimari / Kalıp Kat Planı (Çoklu blok, yazı, donatı detayları) |
| `SÜHEYLA KARA STATİK (HAFİF) - Kopya.dwg` | `C:\Users\hsyn\Desktop\SÜHEYLA KARA STATİK (HAFİF) - Kopya.dwg` | ~7.67 MB (7.671.482 bayt) | Komple Statik Proje (Yüksek varlık sayısı, kiriş açılımları, akslar) |

---

## 2. KORUNACAK SINIRLAR VE TEMEL İLKELER

1. **Legacy Motora Sıfır Müdahale (GEMINI.md Kuralı):**
   `src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx`, `cad-upstream-viewer.tsx`, `cad-viewer.tsx`, `dxf-viewer-worker.ts` ve `src/lib/dokumantasyon/cad-upstream/**` dosyalarına kesinlikle dokunulmayacaktır.
2. **Git & Vercel Koruması (AGENTS.md Kuralı):**
   `main` branch'e push yapılmayacak, Vercel build kotası tüketilmeyecektir. Tüm yükleme, veritabanı kaydı, derleme ve deneyler yerel (`localhost:3000`) ortamında yürütülecektir.
3. **Sıfır Sürpriz Garantisi (Zero-Surprise Contract):**
   Kullanıcı tarayıcıda URL'yi açtığında beyaz ekran, sonsuz dönen yükleme simgesi, donma, eksik katman, kayık kamera veya WebGL çökmesi yaşanmayacaktır.

---

## 3. ADIM ADIM UYGULAMA AŞAMALARI

```
┌─────────────────────────────────────────────────────────────────────────┐
│ FAZ 1: Dosya Alma, Hash Hesaplama ve Local Dokümantasyon Depolama        │
│ 1.1 Masaüstünden okuma & SHA-256 bütünlüğü                              │
│ 1.2 .data/dok_storage/ altına canonical kopyalama                       │
│ 1.3 .data/dok_db.json içine DokFile kayıtlarının eklenmesi              │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│ FAZ 2: CAD V2 Derleme ve İkili Sahne Pipeline'ı (Pipeline Validation)   │
│ 2.1 LibreDWG 0.7.10 ile DWG -> Canonical dönüşümü                       │
│ 2.2 DV2SCN01 ikili parça (chunks) & Manifest üretimi                    │
│ 2.3 Web Worker unpack & Transferable ArrayBuffer transfer doğrulaması   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│ FAZ 3: Uçtan Uca Kullanıcı Deneyleri (Zero-Surprise Suite)               │
│ 3.1 İlk Açılış & Warm Cache Benchmark (30 tekrar)                       │
│ 3.2 Fit View & Dünya BBox Doğruluğu (F tuşu & Padding)                 │
│ 3.3 Kamera Gezinme (Tekerlek Zoom, H Pan, Space+Drag, + / - butonları)  │
│ 3.4 Katman Açma/Kapama (Tek tek ve toplu görünürlük)                   │
│ 3.5 Görünüm Ayarları (Arka Plan: Siyah/Koyu/Açık, Lineweight, Monokrom) │
│ 3.6 Pafta/Model Space Geçişi (StatusBar Dropdown)                       │
│ 3.7 WebGL Context Loss Kurtarma (15s timeout testi)                    │
│ 3.8 20 Aç/Kapat Yaşam Döngüsü Bellek Sızıntısı (<50MB Plato)            │
│ 3.9 Mobil Dokunma & Viewport Koruması (touchAction: none / pan-y)       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│ FAZ 4: Tek Tuşla Otomasyon Scripti                                       │
│ 4.1 scripts/cad-v2/run-desktop-dwg-experiments.ts hazırlanması & koşturma│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│ FAZ 5: Canlı Kullanıcı İnceleme Kılavuzu & URL'ler                       │
│ 5.1 Localhost Next.js dev server ayağa kaldırma                         │
│ 5.2 Doğrudan erişim bağlantıları ve manuel doğrulama checklist'i        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### FAZ 1 — Dosyaları Localhost Dokümantasyona Yükleme

#### 1.1 Dosya Doğrulama ve Hash Çıkarma
- `C:\Users\hsyn\Desktop\1 ve 2.kat dwg.dwg` ve `C:\Users\hsyn\Desktop\SÜHEYLA KARA STATİK (HAFİF) - Kopya.dwg` dosyalarının varlığı, bayt boyutları ve SHA-256 özetleri çıkarılır.
- Dosya başlık imzaları (DWG Header: `AC1032`, `AC1027`, `AC1024` vb.) kontrol edilir.

#### 1.2 Yerel Depoya Aktarım (`.data/dok_storage/`)
- Yerel Dokümantasyon sisteminin `local-store.ts` sözleşmesine uygun olarak:
  - Dosyalar `.data/dok_storage/` klasörüne kopyalanır.
  - Dosya depolama adları çakışmayı önleyen benzersiz UUID formatında tanımlanır (`dok_storage/{uuid}.dwg`).

#### 1.3 Veritabanı Kaydı (`.data/dok_db.json`)
- `.data/dok_db.json` dosyası okunur.
- İki dosya için `DokFile` nesnesi oluşturulur:
  ```json
  {
    "id": "uuid-1",
    "display_name": "1 ve 2.kat dwg.dwg",
    "folder_id": null,
    "extension": ".dwg",
    "size_bytes": 3444087,
    "mime_type": "application/x-dwg",
    "blob_url": "local:uuid-1.dwg",
    "blob_pathname": "dok_storage/uuid-1.dwg",
    "created_at": "2026-09-20T...",
    "updated_at": "2026-09-20T...",
    "deleted_at": null,
    "is_starred": false
  }
  ```
- `.data/dok_db.json` atomik olarak güncellenir.
- Sonuç: Dosyalar localhost Dokümantasyon panelinde (`http://localhost:3000/dokumantasyon`) anında görünür hale gelir.

---

### FAZ 2 — CAD V2 Derleme ve İkili Sahne Pipeline'ı

#### 2.1 DWG -> Canonical Çözümleme
- Her iki dosya için `parseDwgToCanonical(dwgBuffer)` çalıştırılır.
- Varlık istatistikleri çıkarılır:
  - Katman sayıları ve katman renkleri (ACI & RGB)
  - Çizgi (`LINE`), Daire (`CIRCLE`), Yay (`ARC`), Polyline (`LWPOLYLINE`) sayıları
  - Yazı (`TEXT`, `MTEXT`) ve blok referansları (`INSERT`)
  - Çizim boyutları (BBox min/max koordinatları)

#### 2.2 Canonical -> DV2SCN01 İkili Sahne Derleme
- `compileCanonicalToScene(canonicalDoc)` çağrılır.
- Her parça (chunk) 2 MB bütçe sınırına göre bölünür.
- Float64 model koordinatları kamera-bağıl Float32 ofsetlere dönüştürülür.
- Manifest şeması (`schemaVersion: 1`, `renderAbi: three172-cad2d-v1`, `limits`, vb.) oluşturulur.
- Çıktılar `.data/cad-v2-scenes/{sceneId}/` altına kaydedilir.

#### 2.3 Web Worker Ayrıştırma Doğrulaması
- `cad-v2-scene-worker.ts` içindeki `unpackSceneChunk` fonksiyonu çalıştırılarak ikili parçaların `Transferable ArrayBuffer` olarak sıfır kopya ile ayrıştırılabildiği kanıtlanır.

---

### FAZ 3 — Uçtan Uca Kullanıcı Deneyleri (Sıfır Sürpriz Garantisi)

| # | Deney Adı | Uygulanacak Test Yöntemi | Başarı Kriteri |
|---|---|---|---|
| **D01** | **Cold vs Warm Açılış Hızı** | 1 ilk hazırlama (Cold) + 30 peş peşe çağırma (Warm Cache) zaman ölçümü. | Warm yanıt median süresi < 5 ms, iyileşme oranı >= %50. |
| **D02** | **Fit View & BBox Doğruluğu** | Çizimin model alanı BBox'ı hesaplanır; `F` kısayolu ve fit butonu çağrılır. | unitsPerCssPixel değeri ve kamera merkezi tam model merkezine oturmalı, %5 dolgu payı korunmalı. |
| **D03** | **Kamera & Gezinme Deneyleri** | Tekerlek zoom, sol tık Pan aracı (`H`), `Space + Drag`, klavye yön tuşları, `+`/`-` adımları. | İmleç referanslı zoomda dünya koordinatı sabit kalmalı, eksen yönleri doğru olmalı. |
| **D04** | **Katman Görünürlük Kontrolü** | Katmanlar tek tek açılıp kapatılır; "Tümünü Aç / Tümünü Kapat" tetiklenir. | Çizim üzerinde ilgili katmandaki çizgiler anında gizlenmeli/görünmeli, sahne yeniden derlenmemeli. |
| **D05** | **Görünüm Ayarları Deneyleri** | Siyah (`#050505`), Koyu Gri (`#18181b`), Açık (`#f4f4f5`) arka plan geçişi; Monokrom modu; Lineweight modu. | Çizgiler siyah fonda beyaz/renkli, açık fonda siyah kontrast almalı; monokromda tüm renkler tek tona dönmeli. |
| **D06** | **Çoklu Pafta (Layout) Değişimi** | Model Space ve Paper Space paftaları arasında geçiş yapılır. | Kamera yeni paftanın sınır kutusuna animasyonsuz ve doğru odaklanmalı. |
| **D07** | **WebGL Context Loss & Recovery** | `canvas.dispatchEvent(new Event('webglcontextlost'))` simüle edilir. | 15s içinde context-lost ekranı çıkmalı ve context restored olduğunda sayfa yenilenmeden sahne ayağa kalkmalı. |
| **D08** | **Yaşam Döngüsü & Bellek Sızıntısı** | 20 ardışık montaj/demontaj (aç/kapat) döngüsü çalıştırılır. | 20 döngü sonunda heap bellek farkı < 50 MB plato sınırında kalmalı. |
| **D09** | **Mobil Dokunma Güvenliği** | Çizim alanında touch-action incelenir. | Kanvasta `touchAction: none` (sayfa kayması/yenilenmesi engelli), panellerde `touchAction: pan-y` olmalı. |

---

### FAZ 4 — Tek Tuşla Otomasyon Scripti

Tüm bu işlemleri tek komutla koşturan `scripts/cad-v2/run-desktop-dwg-experiments.ts` scripti oluşturulacaktır.

**Çalıştırma Komutu:**
```bash
npx tsx scripts/cad-v2/run-desktop-dwg-experiments.ts
```

Script şu adımları otomatik tamamlayacaktır:
1. Masaüstündeki iki DWG dosyasını okur.
2. Local dokümantasyon veritabanına ve disk deposuna aktarır (`.data/dok_db.json`, `.data/dok_storage`).
3. Her iki dosya için CAD V2 decode + compile + worker unpack hattını yürütür.
4. D01 - D09 arasındaki tüm 9 deneyi iki dosya üzerinde sırayla çalıştırır.
5. Her dosya için üretilen dosya ID'lerini ve tarayıcıda doğrudan açılacak canlı localhost URL'lerini ekrana basar.

---

### FAZ 5 — Canlı Kullanıcı İnceleme ve Doğrulama Kılavuzu

Script çalıştırıldıktan sonra kullanıcı yerel sunucuyu açıp dosyaları bizzat inceleyebilir:

1. **Sunucuyu Başlat:**
   ```bash
   npm run dev
   ```
2. **Tarayıcıda Aç:**
   - **Dosya 1 (1 ve 2.kat):** `http://localhost:3000/dokumantasyon/dosya/{FILE_ID_1}?cadEngine=v2`
   - **Dosya 2 (Süheyla Kara):** `http://localhost:3000/dokumantasyon/dosya/{FILE_ID_2}?cadEngine=v2`
   - **Veya Dokümantasyon Dosya Yöneticisi:** `http://localhost:3000/dokumantasyon` (Dosyaların sağındaki 3 noktaya tıklayıp **"DWG Motor V2 ile aç"** seçeneği).
3. **Kullanıcı Kontrol Listesi:**
   - [ ] Çizim anında açıldı mı?
   - [ ] Fare tekerleğiyle yakınlaşıp uzaklaşırken akıcı mı?
   - [ ] `Space` veya orta tuşla kaydırma (Pan) çalışıyor mu?
   - [ ] Sol araç çubuğundan Katmanlar paneli açılıp katmanlar kapatılabiliyor mu?
   - [ ] Görünüm ayarlarından arka plan rengi ve monokrom modu değiştirilebiliyor mu?
   - [ ] Sağ üstteki "Mevcut Motorla Aç" butonuna basıldığında klasik motora geçilebiliyor mu?

---

## 4. ONAY VE GEÇİŞ

Bu plan dosyası hazırlandıktan sonra, kullanıcının onayı ile FAZ 1'den başlayarak script ve veritabanı entegrasyonu derhal uygulanabilir.
