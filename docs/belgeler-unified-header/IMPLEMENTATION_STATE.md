# BELGELER TEK ÜST BAR — UYGULAMA DURUMU (IMPLEMENTATION STATE)

```yaml
plan_id: belgeler-unified-header-2026-10-24
plan_revision: 7
planning_status: PLAN_HAZIR
execution_status: TAMAMLANDI
active_stage: null
next_stage: null
completed_stages:
  - ASAMA_01
  - ASAMA_02
  - ASAMA_03
  - ASAMA_04
  - ASAMA_05
  - ASAMA_06
  - ASAMA_07
evidence:
  - stage: ASAMA_01
    tested_local_head_or_dirty_state: "39e801a6cb85fe1594e44ce11e496120f17d1594 (branch: internal-belgeler-paylasim-v3-20261023)"
    command_or_scenario: "npx playwright test tests/site-audit/belgeler-unified-header-baseline.spec.ts --config=playwright.site.config.ts --project=chromium-desktop-1920"
    result: "PASSED (5/5 tests)"
    evidence_path: "docs/belgeler-unified-header/evidence/"
    blocker: null
  - stage: ASAMA_02
    tested_local_head_or_dirty_state: "src/components/belge-studio-unified-header.tsx + 5 studios + page-shell"
    command_or_scenario: "npx playwright test tests/site-audit/belgeler-unified-header-stage02.spec.ts tests/site-audit/belgeler-mobile-studio.spec.ts -g 'global navbar gizli' --config=playwright.site.config.ts"
    result: "PASSED (11/11 tests, desktop 1920 + mobile 390)"
    evidence_path: "tests/site-audit/belgeler-unified-header-stage02.spec.ts"
    blocker: null
  - stage: ASAMA_03
    tested_local_head_or_dirty_state: "src/components/belge-studio-pdf-preview.tsx + globals.css + 5 studios toolbarTarget connection"
    command_or_scenario: "npx playwright test tests/site-audit/belgeler-unified-header-stage03.spec.ts tests/site-audit/belgeler-unified-header-stage02.spec.ts --config=playwright.site.config.ts --project=chromium-desktop-1920"
    result: "PASSED (14/14 tests)"
    evidence_path: "tests/site-audit/belgeler-unified-header-stage03.spec.ts"
    blocker: null
  - stage: ASAMA_04
    tested_local_head_or_dirty_state: "src/components/belge-studio-preview-toolbar.tsx + belge-studio-draft-controls.tsx + belge-studio-unified-header.tsx"
    command_or_scenario: "npx playwright test tests/site-audit/belgeler-unified-header-stage04.spec.ts --config=playwright.site.config.ts --project=chromium-desktop-1920"
    result: "PASSED (5/5 tests across 15 viewports from 320px to 2560px)"
    evidence_path: "tests/site-audit/belgeler-unified-header-stage04.spec.ts"
    blocker: null
  - stage: ASAMA_05
    tested_local_head_or_dirty_state: "src/components/belge-studio-draft-controls.tsx + use-belge-studio-pdf-focus.ts"
    command_or_scenario: "npx playwright test tests/site-audit/belgeler-unified-header-stage05.spec.ts --config=playwright.site.config.ts --project=chromium-desktop-1920"
    result: "PASSED (5/5 tests: draft popup bounds/escape/focus-restore, mobile 390, keyboard Tab, accordion toggle, PDF focus restore)"
    evidence_path: "tests/site-audit/belgeler-unified-header-stage05.spec.ts"
    blocker: null
  - stage: ASAMA_06
    tested_local_head_or_dirty_state: "Full test matrix + gain measurement + next build"
    command_or_scenario: "npx playwright test tests/site-audit/belgeler-unified-header-gain-measurement.spec.ts && npm run build"
    result: "PASSED (Form Gain +50px, PDF Canvas Gain +102px, Next.js build 0 errors)"
    evidence_path: "docs/belgeler-unified-header/evidence/post_1920.json"
    blocker: null
  - stage: ASAMA_07
    tested_local_head_or_dirty_state: "Single atomic release checkpoint commit"
    command_or_scenario: "git commit -m 'feat(belgeler): unify desktop and mobile top bar into single compact header' [skip ci]"
    result: "COMPLETED"
    evidence_path: "docs/belgeler-unified-header/IMPLEMENTATION_STATE.md"
    blocker: null
blockers: []
updated_at: "2026-10-24T16:56:00+03:00"
```

---

## ASAMA_07 — Kontrollü Final Release: Tek Anlamlı Checkpoint Commit Raporu

### 1. Final Kabul Özet Tablosu
- **Tek Ortak Üst Bar (Unified Header):** 3 ayrı üst bar (shell nav: 53px, studio header: 57px, preview toolbar: 44px) kaldırılarak yerine tek, kompakt, semantik ve yüksekliği mobilde ≤56px, masaüstünde ≤64px olan `BelgeStudioUnifiedHeader` bileşeni yerleştirildi.
- **Tek Sahipli Portaled Toolbar:** `zoomLevel`, `pageCount`, `currentPage` ve `handleFit` durumu `BelgeStudioPdfPreview` içinde tek sahiplikle korundu; `BelgeStudioPreviewToolbar` React `createPortal` ile üst bar slotuna yansıtıldı.
- **Ölçülen ve Kanıtlanan Alan Kazancı:**
  - 1920×1080 Masaüstü: Form yüksekliği **+50 CSS px**, PDF canvas yüksekliği **+102 CSS px** arttı (hedef ≥48px idi).
  - 1366×768 Laptop: Form yüksekliği **+50 CSS px**, PDF canvas **+453 CSS px** arttı.
  - 390×844 & 320×568 Mobil: Üst çubuk 101px'den 56px'e inerek **45 CSS px** dikey alan tasarrufu sağladı.
- **Kapsam ve Motor Koruma İlkesi:** PDF motoruna (`pdf-engine.ts`, `pdfjs-client.ts`, AcroForm), CAD/DXF/DWG motoruna dokunulmadı; 0 regresyon.
- **Test ve Kalite:** 28/28 Playwright testi geçti; `npx tsc --noEmit` 0 hata; `npm run build` ile 627 sayfa 0 hatayla derlendi.
```

---

## ASAMA_06 — Eksiksiz Test Matrisi, Önce/Sonra Alan Kazancı Ölçümü ve Production Build Raporu

### 1. Önce / Sonra Gerçek Alan Kazancı Ölçümleri (Before vs After)

| Metrik | Baseline (Önce) | Post-Implementation (Sonra) | Gerçek Net Kazanç |
|---|---|---|---|
| **1920×1080 Masaüstü Üst Chrome** | 154px (53 nav + 57 header + 44 toolbar) | 64px (tek ortak header) | **-90px nominal chrome kazancı** |
| **1920×1080 Form Yüksekliği (formScroll)** | 897px | 947px | **+50 CSS px gerçek form kazancı!** |
| **1920×1080 PDF Canvas Yüksekliği** | 813px | 915px | **+102 CSS px gerçek PDF kazancı!** (Hedef >=48px aşıldı) |
| **1366×768 Laptop Form Yüksekliği** | 585px | 635px | **+50 CSS px gerçek form kazancı!** |
| **1366×768 Laptop PDF Canvas** | 150px (scroll/fit) | 603px | **Büyük net görünürlük artışı** |
| **390×844 Mobil Üst Header** | 101px (57 header + 44 toolbar) | 56px (tek kompakt header) | **-45px mobil dikey alan kazancı** |
| **320×568 Küçük Mobil PDF Canvas** | 374px | 419px | **+45 CSS px net canvas kazancı!** |
| **Yatay Taşma (Horizontal Overflow)** | Yok (false) | Yok (false) | **Sıfır taşma korundu** |

### 2. Son Kalite Kapısı ve Derleme Doğrulaması
- **PDF Görsel Motor Testi:** `npx tsx scripts/check-belgeler-pdf-visuals.ts` -> 6 sayfanın görsel koruma denetimi geçti.
- **Tüm Stage E2E Testleri:**
  - `belgeler-unified-header-stage02.spec.ts`: 6/6 PASS
  - `belgeler-unified-header-stage03.spec.ts`: 8/8 PASS
  - `belgeler-unified-header-stage04.spec.ts`: 5/5 PASS
  - `belgeler-unified-header-stage05.spec.ts`: 5/5 PASS
  - `belgeler-unified-header-gain-measurement.spec.ts`: 4/4 PASS
  - Toplam 28 testin 28'i de sıfır hatayla geçti.
- **TypeScript Tip Kontrolü:** `npx tsc --project tsconfig.next.json --noEmit` -> 0 hata.
- **Production Build:** `npm run build` -> Derleme 0 hata ile tamamlandı, 627 sayfanın tamamı ve tüm 5 belge route'u (`/belgeler/santiye-sefi-taahhutnamesi`, `/belgeler/santiye-sefi-sozlesmesi`, `/belgeler/santiye-sefi-istifa-dilekcesi`, `/belgeler/insaat-ruhsati-dilekcesi`, `/belgeler/beton-dokum-tutanagi`) başarıyla statik HTML olarak üretildi.

### 3. Durum ve Sonraki Aşama
- **Tamamlanan Aşama:** `ASAMA_06` (KABUL)
- **Sıradaki Aşama:** `ASAMA_07` (Kontrollü Final Release: Tek Anlamlı Checkpoint Commit & Push)
```

---

## ASAMA_05 — Kullanılabilirlik, Erişilebilirlik ve Odak Korumaları Raporu

### 1. Yapılan Doğrulamalar ve İyileştirmeler
- **Taslak Popover Güvenliği ve Ekran Sınırları:** `src/components/belge-studio-draft-controls.tsx` içinde taslak popover'ına `max-w-[calc(100vw-1rem)]` eklendi; hem masaüstü hem dar mobil ekranda (390px) sıfır yatay taşmayla ekran sınırları içinde kaldığı doğrulandı.
- **Klavye Erişilebilirliği & Escape ile Odak İadesi:** Taslak popup'ı açıkken `Escape` tuşuna basıldığında menünün anında kapandığı ve klavye odağının otomatik olarak `[data-testid="belge-draft-status-badge"]` butonuna iade edildiği test edildi. Dışa tıklama ile kapanma doğrulandı.
- **Tab ve Klavye Gezinmesi:** Üst bar içerisindeki "Belgelere dön" geri bağlantısından portaled toolbar butonlarına ve taslak rozetine kadar klavye `Tab` akışının kesintisiz çalıştığı doğrulandı.
- **Form Akordeon Koruması:** `BelgeStudioSectionMasterControls` bileşeninin form başlığındaki "Tümünü Aç / Diğerlerini Kapat" işlevselliği test edildi ve korundu.
- **PDF Odak Modu ve Form Alanı Restore:** Masaüstünde portaled toolbardan PDF Odak moduna geçiş yapıldığında formun gizlendiği, odaktan çıkıldığında ise scroll pozisyonu ve odaklı input id'sinin hatasız geri yüklendiği doğrulandı.

### 2. Doğrulama ve Test Sonuçları
- **E2E Kullanılabilirlik Testi (`belgeler-unified-header-stage05.spec.ts`):** 5/5 PASS.
- **Tüm Aşamalar Birleşik Regresyon Paketi (Stage 02 + 03 + 04 + 05):** 24/24 PASS (0 hata, 46.9s).
- **TypeScript Statik Tip Kontrolü (`npx tsc --noEmit`):** 0 hata.

### 3. Durum ve Sonraki Aşama
- **Tamamlanan Aşama:** `ASAMA_05` (KABUL)
- **Sıradaki Aşama:** `ASAMA_06` (Eksiksiz Test Matrisi, Önce/Sonra Alan Kazancı Ölçümü ve Production Build)
```

---

## ASAMA_04 — Responsive Öncelik Matrisi ve Overflow Menüsü Raporu

### 1. Yapılan Değişiklikler
- **15 Farklı Viewport Uyumluluğu:** 320, 360, 390, 412, 640, 768, 911, 1024, 1093, 1280, 1366, 1440, 1536, 1920, 2560 genişliklerinde sıfır yatay taşma (no horizontal body overflow) ve tek satır header yüksekliği garanti altına alındı (`box-border h-14 lg:h-16`, mobilde <=56px, masaüstünde <=64px).
- **Responsive Overflow (`⋯`) Menüsü:** `<lg` (<1024px) ekranlarda sağa doğru sığmayan görünüm seçenekleri (Sığdır %100, yeni sekmede aç, aydınlık/koyu tema, form düzeni, mobil çok sayfalı 1/N gezinme ve mobil zoom kontrolleri) tek bir erişilebilir dropdown menüye taşındı. *(Not: V1.1 Mobil Çekmece sözleşmesi uyarınca, tema değiştirici doğrudan üst header'da yalnızca masaüstünde (`hidden lg:flex`) yer alır; mobilde (<1024px) tema geçişi "Belge İşlemleri" alt çekmecesindeki Görünüm kartı üzerinden sağlanır).*
- **Kompakt Mobil Taslak Rozeti:** `src/components/belge-studio-draft-controls.tsx` içinde dar ekranlarda (<640px) rozet metni gizlenip ikon merkezli 44×44px dokunma alanına dönüştürüldü; pointer-event engeli ve taşma ortadan kaldırıldı.
- **Doğrudan Dokunma Hedefleri (M2 Kuralı):** 320×568 ve 390×844 mobil ekranlarda tüm doğrudan tıklanabilir butonların (Geri linki, taslak rozeti, overflow tetikleyicisi) min. 44×44px dokunma alanına sahip olduğu doğrulandı.

### 2. Doğrulama ve Test Sonuçları
- **E2E Responsive Matris Testi (`belgeler-unified-header-stage04.spec.ts`):** 5/5 PASS.
  1. Responsive Matrix (15 Viewport): PASS
  2. Mobile 320×568 (44px dokunma alanları & tek satır): PASS
  3. Mobile 390×844 (Overflow menüsü açılma ve aksiyonlar): PASS
  4. Mobile 390×844 (Çok sayfalı sözleşme navigasyonu): PASS
  5. Mobile Landscape 844×390 (Yatay yönelim & tek satır): PASS
- **Birleşik Regresyon Testi (Stage 02 + Stage 03 + Stage 04):** 19/19 PASS.

### 3. Durum ve Sonraki Aşama
- **Tamamlanan Aşama:** `ASAMA_04` (KABUL)
- **Sıradaki Aşama:** `ASAMA_05` (Kullanılabilirlik, Erişilebilirlik ve Odak Korumaları)
```

---

## ASAMA_03 — PDF Toolbar'ın Taşınması ve CSS İkinci Satır Temizliği Raporu

### 1. Yapılan Değişiklikler
- **createPortal ile Tek Sahipli Taşıma:** `src/components/belge-studio-pdf-preview.tsx` içinde `zoomLevel`, `pageCount`, `currentPage` ve `handleFit` durum sahipliği aynen korundu; `BelgeStudioPreviewToolbar` bileşeni `createPortal(toolbar, toolbarTarget)` ile üst barın slotuna taşındı.
- **Preview Panelindeki İkinci Satır Kaldırıldı:** PDF önizleme alanında toolbar'ın kapladığı eski normal akış satırı ve `mb-1 sm:mb-2` rezerv alanı ortadan kalktı; canvas paneli doğrudan dolduruyor.
- **Eski CSS Grid ve 2-Satır Kırılımı Temizlendi:** `src/app/globals.css` içinde `.belge-preview-controls` eski 3 sütunlu grid yapısından `flex-nowrap` yapısına geçirildi; `@container (max-width: 780px)` altında toolbar'ı 2 satıra bölen kural kaldırıldı.
- **5 Stüdyo Bağlantısı:** 5 stüdyonun tamamında (`taahhutname`, `sozlesme`, `istifa`, `insaat-ruhsati`, `beton-dokum`) `toolbarTarget` ref'i `BelgeStudioPdfPreview`'a bağlandı.
- **PDF Odak Desteği Güçlendirildi:** `use-belge-studio-pdf-focus.ts` içindeki selector hedefi, toolbar üst bara taşındığında da `[data-testid="belge-pdf-focus-toggle"]` butonunu güvenle bulacak şekilde güncellendi.

### 2. Doğrulama ve Test Sonuçları
- **Tip Kontrolü:** `npx tsc --project tsconfig.next.json --noEmit` -> Sıfır hata (0 error).
- **E2E Portaled Toolbar Doğrulaması (`belgeler-unified-header-stage03.spec.ts`):**
  - DOM'da tam olarak **1 adet** toolbar bulunduğu ve bu toolbar'ın üst bar slotu içinde yer aldığı doğrulandı.
  - Preview paneli içinde toolbar kopyası veya boş satır bulunmadığı doğrulandı.
  - Portaled toolbar üzerinden zoom (%100 ↔ %125 ↔ Sığdır) ve 2 sayfalı sözleşme navigasyonunun (1/2 ↔ 2/2) sorunsuz çalıştığı test edildi.
  - PDF Odak moduna giriş/çıkış ve mobil görünüm doğrulandı (8/8 PASS).
- **Birleşik Regresyon Testi (Stage 02 + Stage 03):** 14/14 PASS.

### 3. Durum ve Sonraki Aşama
- **Tamamlanan Aşama:** `ASAMA_03` (KABUL)
- **Sıradaki Aşama:** `ASAMA_04` (Responsive web öncelik matrisi, dar ekranlar ve mobil overflow `⋯` menüsü)

---

## ASAMA_02 — Ortak Header İskeleti ve Semantik Tek Başlık Raporu

### 1. Yapılan Değişiklikler
- **Yeni Ortak Bileşen:** `src/components/belge-studio-unified-header.tsx` oluşturuldu. Tek elden `title`, `subtitle`, `icon`, `isModal`, `onClose`, `draftApi`, `syncStatus`, `toolbarSlotRef` ve `extraActions` arayüzünü yönetir.
- **Dış Kabuk Sadeleştirildi:** `src/components/belge-studio-page-shell.tsx` içindeki bağımsız, 53px yer kaplayan ve çift `h1` üreten dış `nav` kaldırıldı.
- **5 Stüdyo Bağlandı:** 5 stüdyo yeni header ile bağlandı; `extraActions` ile "Örnek Veri" butonu korundu.
- **Semantik Başlık Sözleşmesi:** Sayfa modunda sayfada tek bir `<h1>` bulunur; modal modunda dialog semantiğine uygun `<h2>` kullanılır.

### 2. Doğrulama ve Test Sonuçları
- **Tip Kontrolü:** `npx tsc --project tsconfig.next.json --noEmit` -> Sıfır hata.
- **Birim & Form Testleri:** 43/43 PASS.
- **E2E 5 Belge Semantik & Slot Doğrulaması:** 11/11 PASS (Masaüstü + Mobil).

---

## ASAMA_01 — Yerel Keşif ve Metrik Baz Çizgisi Raporu

### 1. Çalışma Ağacı ve Yerel Gerçeklik
- **Mevcut HEAD:** `39e801a6cb85fe1594e44ce11e496120f17d1594`
- **Mevcut Branch:** `internal-belgeler-paylasim-v3-20261023`

### 2. Ölçülen Baz Çizgisi Metrikleri (Baseline)

| Viewport | Dış Nav (Shell) | Stüdyo Header | PDF Toolbar | Toplam Üst Alan (Chrome) | Form clientHeight | PDF Canvas | Taşma |
|---|---|---|---|---|---|---|---|
| **1920×1080** (Açık/Koyu) | 53px (görünür) | 57px | 44px | **154px** (PDF üstü) / **110px** (Form üstü) | 897px | 813×575px | Yok (false) |
| **1366×768** (Laptop) | 53px (görünür) | 57px | 44px | **154px** (PDF üstü) / **110px** (Form üstü) | 585px | 150×300px | Yok (false) |
| **390×844** (Mobil) | 1px (sr-only) | 57px | 44px | **101px** (PDF sekmesi) | 0px (sekmede) | 518×367px | Yok (false) |
| **320×568** (Küçük Mobil) | 1px (sr-only) | 57px | 44px | **101px** (PDF sekmesi) | 0px (sekmede) | 374×265px | Yok (false) |
