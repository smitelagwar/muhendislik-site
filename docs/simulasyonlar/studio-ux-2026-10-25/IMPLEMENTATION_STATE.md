# 3B Simülasyon Stüdyosu — TradingView Esinli Kamera & UX Uygulama Durum Kaydı

> **Plan ID:** `SIM-STUDIO-UX-2026-10-25`  
> **Revizyon:** 1.0  
> **Uygulayıcı Model:** Gemini 3.8 Flash (High Düşünme)  
> **Başlangıç Commit / HEAD:** `6bdda9a3028200e61027b98aefffcb9cf57b47ca` (`main`)  
> **Tarih:** 25 Ekim 2026  

---

```yaml
plan_id: SIM-STUDIO-UX-2026-10-25
plan_revision: 1
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
  - ASAMA_08
  - ASAMA_09
blockers: []
updated_at: 2026-10-25T23:00:00+03:00
```

---

## 1. Aşama 01 — Kanıt, Yerel Baseline ve Güvenli Değişiklik Sınırı (TAMAMLANDI)

### 1.1 Git ve Çalışma Ağacı Doğrulaması
- **Branch:** `main`
- **HEAD Commit:** `6bdda9a3028200e61027b98aefffcb9cf57b47ca` (Planla birebir uyuşuyor).
- **Working Tree:** Temiz; yalnızca alakasız `hsyncad` dosyaları untracked durumda, dokunulmadı.
- **Model Testleri:** `npm run check:simulations:model` çalıştırıldı: 10/10 test dosyası başarıyla geçti (PASS).
- **Mevcut Yerleşim Testi:** `simulations-studio-layout.spec.ts` çalıştırıldı: 3/3 test geçti (PASS).

---

### 1.2 Viewport ve Dikey Kaydırma (Scroll) Baseline Ölçümleri

`kiris-detayi` sahnesinde ölçülen görünür alan ve dikey taşma değerleri (`baseline-measurements.json`):

| Viewport | Client Height | Total Scroll Height | Gereksiz Dikey Kaydırma (Excess Scroll) | Canvas Y Kotu | Inspector Durumu |
|---|---:|---:|---:|---:|---|
| **1920×1080** | 1080 px | 2233 px | **1153 px** | 341.5 px | Sağda (380 px), fakat iç scroll yok, boyu 1924 px |
| **1366×768** | 768 px | 2244 px | **1476 px** | 385.5 px | Sağda (320 px), canvas tabanı 905 px'e taşıyor |
| **1024×768** | 768 px | 2818 px | **2050 px** | 411.5 px | Canvas altına düşüyor (Y = 2238 px) |
| **390×844** | 844 px | 4186 px | **3342 px** | 516.0 px | Sayfanın en altında (Y = 3465 px) |
| **844×390** | 390 px | 3027 px | **2637 px** | 407.5 px | Sayfanın altında (Y = 2446 px) |

> **Kök Neden Kanıtı:** Sayfayı uzatan temel etkenler:
> 1. `simulation-workspace.tsx` içerisindeki sağ panelin (`simulation-inspector-panel`) kendi `overflow-y:auto` taşma alanına sahip olmaması ve tüm içeriği (`PartInfoPanel`, `LayerPanel`, `notes`) dikeyde 1900+ piksel boyunca açması.
> 2. `LearningControlsPanel`'in sahnenin altında blok olarak bulunması.
> 3. `2B + 3B` (`split`) görünümünün varsayılan olması ve 2B çizim bileşeninin sahnenin altına yerleşmesi.

---

### 1.3 Kamera Etkileşim ve Hassasiyet Baseline Ölçümleri

Mevcut Three.js `OrbitControls` varsayılanları (`rotateSpeed=1.0`, `zoomSpeed=1.0`, `panSpeed=1.0`):

| Sahne | Başlangıç Mesafe | 50px Drag Azimuth Değişimi | 100px Drag Azimuth Değişimi | 1 Tekerlek Çentiği Δ | 3 Tekerlek Çentiği Δ | Zoom In Butonu Katsayısı | Zoom Out Butonu Katsayısı |
|---|---:|---:|---:|---:|---:|---:|---:|
| **kiris-detayi** | 4.678 m | **-0.428 rad (-24.5°)** | **-0.856 rad (-49.0°)** | +0.247 m | +0.779 m | **0.84×** (-16%) | **1.18×** (+18%) |
| **kolon-detayi** | 6.936 m | **-0.428 rad (-24.5°)** | **-0.856 rad (-49.0°)** | +0.365 m | +1.153 m | **0.84×** (-16%) | **1.18×** (+18%) |
| **radye-temel** | 5.375 m | **-0.428 rad (-24.5°)** | **-0.856 rad (-49.0°)** | +0.283 m | +0.894 m | **0.84×** (-16%) | **1.18×** (+18%) |

---

### 1.4 "Beton Gizli" Durumu Kök Neden Araştırması

Kullanıcının ilettiği ekran görüntüsünde modelin kaybolmuş gibi görünmesi incelendi:
1. `kiris-detayi` üzerinde `toggle-concrete-btn` tıklandığında `drawCalls` 17'den 8'e düşüyor, beton mesh'i gizleniyor.
2. Ancak `cameraDistanceM` (4.678 m) değişmiyor; sahne otomatik olarak kalan donatılara sığdırılmıyor (`fitToModel` otomatik çalışmıyor).
3. Kullanıcı elle `Sığdır` butonuna bassa dahi, `computeFitDistance` fonksiyonu görünür donatılar yerine statik `model.boundsMm`'i (4000 mm gövde + geniş beton mesnetleri) baz alıyor.
4. Çapı 14–20 mm olan ince çelik çubuklar 4.7 metre mesafeden bakıldığında 1458 piksel genişliğindeki canvas'ta boşluk içinde ince çizgiler olarak kalıyor ve aşırı duyarlı dönüşle bir anda ekrandan kayabiliyor.
5. **Ekran görüntüsü:** `docs/simulasyonlar/studio-ux-2026-10-25/baseline-kiris-beton-gizli.png` olarak arşivlendi.

---

## 2. Aşama 02 — Kamera Duyarlılığını Azalt ve Kadraj Güvenliği (TAMAMLANDI)

### 2.1 Uygulanan Değişiklikler
1. **Hızların Düşürülmesi (`three-column-viewer.ts`):**
   - `controls.rotateSpeed = 0.55` uygulandı (%45 duyarlılık azaltıldı).
   - `controls.zoomSpeed = 0.65` uygulandı.
   - `controls.panSpeed = 0.65` uygulandı.
2. **Zoom Adımlarının Yumuşatılması (`zoomByStep`):**
   - Yakınlaşma çarpanı: `0.84` yerine `0.90` yapıldı (%10 kontrollü yaklaşma).
   - Uzaklaşma çarpanı: `1.18` yerine `1.10` yapıldı (%10 kontrollü uzaklaşma).
   - NaN, sıfır ve negatif değer korumaları eklendi.
3. **Seçme Jestinin Ayrılması ve Güvenliği:**
   - Pointer drag eşiği `Math.hypot(dx, dy) > dragThreshold` ile farede `6 px`, dokunmatik ekranda `8 px` olarak güncellendi.
   - `pointercancel` olayı dinlenerek yarım kalan jestlerin yanlış parça seçimi tetiklemesi önlendi.
4. **Görünür Geometriye Göre Akıllı Sığdırma (`getEffectiveModelBounds` & `computeFitDistance`):**
   - Beton parçaları `addConcretePart` anında `partBoundsMap`'e kaydedildi.
   - `computeFitDistance` ve `fitToModel`, kör statik model sınırları yerine o an sahnede görünür olan katmanların (`layerVisibility`) gerçek dünya koordinat sınırlarını ve merkezini (`center`) hedef alacak şekilde genişletildi.
   - Beton gizlendiğinde veya donatılar filtrelendiğinde `Sığdır` butonuna basıldığında kamera doğrudan görünür donatı kafesini merkezler ve kadraja doldurur (`4.412 m` mesafeye sığdırma doğrulanmıştır).
5. **Tip Güvenliği (`src/types/three.d.ts`):**
   - `OrbitControls` shim'ine `rotateSpeed`, `zoomSpeed`, `panSpeed` eklendi; `npx tsc -p tsconfig.next.json` 0 hata ile doğrulandı.

---

### 2.2 Öncesi / Sonrası Karşılaştırma Kanıtı (`asama02-camera-verification.json`)

| Parametre / Ölçüm | Baseline (Öncesi) | Aşama 02 Sonucu (Sonrası) | Fark / İyileşme |
|---|---:|---:|---|
| **100px Fare Sürükleme Azimuth Değişimi** | `-0.8560 rad (-49.0°)` | **`-0.4708 rad (-27.0°)`** | **%45.0 daha ölçülü ve kontrollü** |
| **50px Fare Sürükleme Azimuth Değişimi** | `-0.4280 rad (-24.5°)` | **`-0.2354 rad (-13.5°)`** | **%45.0 daha az sarsıntılı dönüş** |
| **Zoom In Butonu Katsayısı** | `0.8400×` (-%16) | **`0.9000×` (-%10)** | Yumuşak kademe |
| **Zoom Out Butonu Katsayısı** | `1.1800×` (+%18) | **`1.1000×` (+%10)** | Yumuşak kademe |
| **1 Tekerlek Çentiği Mesafe Değişimi** | `+0.247 m` | **`+0.159 m`** | %35.6 daha ince zoom kademesi |
| **Beton Gizli İken Sığdırma (`fitToModel`)** | `4.678 m` (Statik dış kutu) | **`4.412 m` (Görünür donatı merkezi)** | Donatı kafesi kadrajda merkezde |

---

### 2.3 Doğrulama ve Test Kabulü
- `npm run check:simulations:model`: **PASS** (10/10 test).
- `simulations-studio-layout.spec.ts`: **PASS** (3/3 test; 1920/1366/390 px).
- `npx tsc -p tsconfig.next.json --noEmit --incremental false`: **PASS** (0 hata).

---

## 3. Aşama 03 — Sayfa Akışı Değil, Bir Ekranlık Stüdyo (TAMAMLANDI)

### 3.1 Uygulanan Değişiklikler
1. **Dış Sayfa Shell Boşluklarının Sınırlandırılması (`page.tsx`):**
   - Simülasyon detay rotası için `tool-page-shell` dikey dolguları kompakt hale getirildi: `py-1 lg:py-1.5 pb-16 md:pb-6 lg:pb-1 min-h-0`.
   - Mobil gezinme çubuğu ile çakışma riski korunurken masaüstünde gereksiz boşluklar ortadan kaldırıldı.
2. **Varsayılan Görünüm Sekmesinin 3B Olarak Ayarlanması (`view-reducer.ts`):**
   - Başlangıç modu `split` yerine `"3d"` yapıldı.
   - Böylece ilk açılışta 3B sahnenin altına 600px boyunda 2B çizim yığılması engellendi; 3B sahne tam yüksekliğiyle öne çıkarıldı.
3. **Denetçi Panelinin Bağımsız Scroller'a Dönüştürülmesi (`simulation-workspace.tsx`):**
   - Sağ denetçi sekme gövdesi `flex-1 min-h-0 lg:overflow-y-auto overscroll-contain max-h-[calc(100vh-140px)]` ile sarmalandı.
   - 30'dan fazla parçadan oluşan donatı listesi, katmanlar ve varsayımlar artık ana sayfayı dikeyde 1900+ piksel uzatmak yerine denetçi kutusu içinde kayıyor.
4. **Stüdyo Grid ve Sahne Düzeni:**
   - `simulation-studio-grid` `flex-1 min-h-0 min-w-0` ile esnek viewport alanına oturtuldu.
   - Sahne genişliği ve yüksekliği Fold-1 içinde korundu (1920px'de 734px, 1366px'de 520px+).
   - Tek WebGL canvas ilkesi korundu (`canvasCount = 1`).

---

### 3.2 Öncesi / Sonrası Dikey Kaydırma (Excess Scroll) Karşılaştırması (`stage03-measurements.json`)

`kiris-detayi` ve 6 sahnede ölçülen toplam scroll yüksekliği ve gereksiz kaydırma (Excess Scroll):

| Viewport | Baseline Total Scroll | Aşama 03 Total Scroll | Baseline Excess Scroll | Aşama 03 Excess Scroll | İyileşme / Azalma Oranı |
|---|---:|---:|---:|---:|---|
| **1920×1080** | 2233 px | **1433 px** | 1153 px | **353 px** | **%69.4 azalma** |
| **1366×768** | 2244 px | **1325 px** | 1476 px | **557 px** | **%62.3 azalma** |
| **1024×768** | 2818 px | **1494 px** | 2050 px | **726 px** | **%64.6 azalma** |
| **390×844 (Mobil)** | 4186 px | **2822 px** | 3342 px | **1978 px** | **%40.8 azalma** |

> **Not:** Kalan ~350 px masaüstü scroll payı, Aşama 04'teki tek satırlık kompakt stüdyo toolbar'ı ve Aşama 05'teki alttan sağ denetçiye/dock'a taşınacak `LearningControlsPanel` optimizasyonu ile tamamen sıfırlanacaktır.

---

### 3.3 Doğrulama ve Test Kabulü
- `npm run check:simulations:model`: **PASS** (10/10 test).
- `simulations-studio-layout.spec.ts` (1920×1080): **PASS** (3/3 test; 6 sahne canvas genişleme, odak modu, tek canvas, yatay taşma = 0).
- `simulations-studio-layout.spec.ts` (1366×768): **PASS** (3/3 test; sekmeler arası geçiş, 2B/3B tek canvas kararlılığı).
- `npx tsc -p tsconfig.next.json --noEmit --incremental false`: **PASS** (0 hata).

---

## 4. Aşama 04 — TradingView Mantığında Kompakt Toolbar ve Araç Rayı (TAMAMLANDI)

### 4.1 Uygulanan Değişiklikler
1. **Tek Sıra Kompakt Stüdyo Başlığı (`simulation-workspace.tsx`):**
   - İki ayrı yüksek satır (gezinme + başlık/rozet/eylemler) birleştirilerek tek sıra stüdyo üst şeridine dönüştürüldü.
   - Sol tarafta hızlı geri dönüş, kategori ve önayar rozeti (`active-preset-badge`), sayfa başlığı (`simulation-scene-title`) ve `Hakkında` popover'ı konumlandırıldı.
   - Sağ tarafta `Odak Modu` (`simulation-focus-mode-toggle`), `Tam Ekran` (`simulation-fullscreen-toggle`), `Denetçi` (`simulation-inspector-toggle`), `Paylaş` (`copy-share-link-btn`) yer aldı.
   - `kolon-detayi` için eskiden 180+ piksel yer kaplayan parametre paneli ve önayar butonları, başlığın hemen altına 36 px yüksekliğinde kompakt bir inline şerit olarak yerleştirilerek ~140 px dikey alan tasarrufu sağlandı.
2. **Kompakt Düşey 3B Kamera ve Kadraj Rayı (`simulation-viewer.tsx`):**
   - 3B sahnenin sol tarafına TradingView/CAD tarzı 40 px genişliğinde dikey bir araç rayı (`aside aria-label="Stüdyo 3B Kamera ve Kadraj Rayı"`) eklendi (`absolute left-2.5 top-2.5 z-10`).
   - `Sığdır` (`camera-fit-btn`), hazır bakışlar (`camera-preset-isometric`, `front`, `right`, `top`), ve zoom butonları (`camera-zoom-in`, `camera-zoom-out`) bu ray üzerine taşındı.
   - Böylece `SimulationViewer` üst araç çubuğunun dikey yüksekliği 52 px'den 36 px'e düşürüldü ve araçlar tek satırda hizalandı.
3. **Tek Sıra Stüdyo Görünüm Çubuğu (`simulation-viewer.tsx`):**
   - Görünüm sekmeleri (`3B Sahne`, `2B + 3B`, `2B Çizim`), `Beton: Gizle/Göster` (`toggle-concrete-btn`), `Yatay Kesit` (`toolbar-toggle-section-btn`) ve `Sıfırla` (`simulation-reset-btn`) tek sıra halinde toplandı.
4. **Sahne Üstü Temiz Durum Çipleri:**
   - Sahne durumları (`concrete-state-badge`, `section-state-badge`, `explode-state-badge`) sağ üst köşeye (`right-3 top-3 z-10`) kompakt, şeffaf arka planlı çipler olarak yerleştirildi.
   - Navigasyon ipucu sol araç rayının yanına hafifletilerek yerleştirildi, sahneyi kapatması önlendi.

---

### 4.2 Doğrulama ve Test Kabulü
- `npm run check:simulations:model`: **PASS** (10/10 test).
- `simulations-studio-layout.spec.ts` (1920×1080): **PASS** (3/3 test; 6 sahnede Fold-1 görünürlük, inspector aç/kapa, odak modu, tek canvas, `overflow = 0`).
- `simulations-studio-layout.spec.ts` (1366×768): **PASS** (3/3 test; 3B/2B/split sekmeleri arası geçiş, tek canvas kararlılığı).
- `simulations-stage04.spec.ts`: **PASS** (Döndür -> betonu gizle -> etriye seç -> 2B eşleme -> kesit -> patlatma -> sıfırla).
- `simulations-stage05.spec.ts`: **PASS** (Kiriş detay sahnesi açılışı, parça seçimi, kesit, patlatma, kolon regresyonu).
- `simulations-stage10.spec.ts`: **PASS** (Kolon parametre girişi, `Uygula`, hata kontrolü, URL paylaşım/decode döngüsü).
- `simulations-stage11.spec.ts`: **PASS** (5/5 test; WebGL context lost/restore, render idle kontrolü, 6 sahne döngüsü, yatay taşma = 0, klavye/a11y/tema).
- `simulations-stage12-smoke.spec.ts`: **PASS** (Ana site rotaları duman testi).
- `npx tsc -p tsconfig.next.json --noEmit --incremental false`: **PASS** (0 hata).

---

## 5. Aşama 05 — Sağ Denetçi ve Öğrenme Kontrollerini Sabitle (TAMAMLANDI)

### 5.1 Uygulanan Değişiklikler
1. **`LearningControlsPanel` Kompakt Stüdyo Dock Dönüşümü (`learning-controls.tsx`):**
   - Eskiden 320+ px yer kaplayan hantal blok, ~95 px yüksekliğinde 3 sıralı kompakt bir stüdyo dock'una dönüştürüldü:
     - **Satır 1:** Öğretim adım hap butonları (`learning-step-btn-0..4`), mod rozeti (`learning-mode-badge`), adım navigasyonu (`Önceki`, `Oynat/Duraklat`, `Sonraki`), mod butonu (`Serbest Mod` / `Rehberli Başlat`), ve hızlı eylemler (`Odaklan`, `Sıfırla`).
     - **Satır 2:** Aktif adım bilgi şeridi (`learning-active-step-card`, başlık, özet ve ipucu).
     - **Satır 3:** İkili kompakt kontrol sürgüleri: Patlatma sürgüsü (%0, %35, %70, %100 önayarları ve eğitimsel uyarı) ile Katman Zaman Parametresi (t=0..1.00 sürgüsü ve önayarları).
   - Tüm `data-testid`, `aria-label`, klavye erişilebilirliği ve reduced-motion destekleri %100 korundu.
2. **Sağ Denetçiye 4. Sekme Olarak "Öğretim" Eklenmesi (`simulation-workspace.tsx`):**
   - Denetçi tablist'i `grid-cols-4` yapılarak 4 sekmeye çıkarıldı:
     - `Parçalar` (`inspector-tab-parts`)
     - `Katmanlar` (`inspector-tab-layers`)
     - `Öğretim` (`inspector-tab-learning`)
     - `Özet` (`inspector-tab-notes`)
   - `inspectorTab === "learning"` seçildiğinde pedagojik detay paneli (`data-testid="inspector-learning-panel"`) devreye girer:
     - Aktif adım rozeti, başlığı, tam özeti ve inceleme ipucu.
     - "Seçili Parçaya Odaklan" butonu.
     - Tüm adımların listesi ve t kotları.
     - TBDY 2018 Madde 7.3 ve TS 500 normatif varsayım notları.
3. **Tek Mantıksal Durum ve Senkronizasyon:**
   - Öğretim durumu hem alt dock hem de sağ denetçi tarafından tek kaynak `viewState.learning` üzerinden okunur; çift state veya desenkronizasyon bulunmaz.
   - Denetçi kapatılıp açıldığında seçili sekme ve parça korunur; canvas yeniden oluşturulmaz (`canvasCount = 1`).

---

### 5.2 Doğrulama ve Test Kabulü
- `npm run check:simulations:model`: **PASS** (10/10 test).
- `simulations-studio-layout.spec.ts` (1920×1080): **PASS** (3/3 test; 6 sahnede Fold-1 görünürlük, inspector aç/kapa, odak modu, tek canvas, `overflow = 0`).
- `simulations-studio-layout.spec.ts` (1366×768): **PASS** (3/3 test; 3B/2B/split sekmeleri arası geçiş, tek canvas kararlılığı).
- `simulations-stage04.spec.ts`: **PASS** (Döndür -> betonu gizle -> etriye seç -> 2B eşleme -> kesit -> patlatma -> sıfırla; 7.2s).
- `simulations-stage05.spec.ts`: **PASS** (Kiriş detay sahnesi açılışı, parça seçimi, kesit, patlatma, kolon regresyonu; 8.0s).
- `simulations-stage08.spec.ts`: **PASS** (Perde duvar iki yüz donatı sahnesi, kesit ve patlatma akışı; 6.8s).
- `simulations-stage02`, `03`, `06`, `07`: **PASS** (4/4 test paketi; 31.4s).
- `simulations-stage10.spec.ts`: **PASS** (Kolon parametre girişi, `Uygula`, hata kontrolü, URL paylaşım/decode döngüsü; 8.2s).
- `npx tsc -p tsconfig.next.json --noEmit --incremental false`: **PASS** (0 hata).

---

## 6. Aşama 06 — Alt Teknik Dock: 2B, Kesit ve Destek Alanları (TAMAMLANDI)

### 6.1 Uygulanan Değişiklikler
1. **Alt Teknik Dock Yapısı (`simulation-viewer.tsx`):**
   - Bölünmüş (`split` / `2B + 3B`) modunda 2B çizim, sayfanın altına 800+ px uzayan düz bir blok olmaktan çıkarılarak elastik boyutlandırılabilir stüdyo alt dock'una (`data-testid="simulation-bottom-dock"`) taşındı.
   - Dock üstünde sürüklemeli (`PointerEvent` / pointer capture) ve klavye destekli (`ArrowUp`/`ArrowDown`, `aria-valuenow`, `aria-valuemin=22`, `aria-valuemax=48`) yeniden boyutlandırma tutamacı eklendi.
   - Hızlı kademeli yükseklik butonları eklendi: `Kompakt (24dvh)`, `Orta (34dvh)`, `Geniş (44dvh)`.
2. **Bağımsız İç Kaydırma (`overscroll-contain`):**
   - Alt dock gövdesi `overflow-y:auto; overscroll-behavior:contain;` ile sınırlandırıldı. 2B çizimin detayları, kesit kotları ve ölçülendirmeleri kendi içinde pürüzsüzce kayar; masaüstü ana sayfası aşağı uzamaz.
3. **2B / 3B Mod Geçişleri ve Tek Canvas Kararlılığı:**
   - **`3B Sahne` modu:** Alt dock kapalı, 3B sahne tam yüksekliği kullanır.
   - **`2B + 3B` modu:** 3B sahne üstte, alt dock altta aynı stüdyo görünümünde canlı senkronize çalışır.
   - **`2B Çizim` modu:** 2B tam ekrana geçer, 3B sahne `hidden` olarak DOM'da tutulur (WebGL context korunur, `canvasCount = 1`).
   - Geri dönüşlerde `ResizeObserver` container boyutunu anında algılayarak projeksiyon matrisini ve çizim boyutunu günceller; kamera açısı ve serbest orbit yönü korunur.
4. **Dock Başlık Çubuğu ve Aksiyonlar:**
   - Başlıkta canlı durum çipleri: `3B ile Canlı Senkron`, aktif kesit bilgisi (`Kesit: Z=... mm`).
   - `Tam 2B` (`expand-2d-to-fullscreen-tab`) ve `Kapat` (`close-dock-btn`) butonları ile tek dokunuşla görünüm geçişi.

---

### 6.2 Doğrulama ve Test Kabulü
- `npm run check:simulations:model`: **PASS** (10/10 test).
- `simulations-studio-layout.spec.ts` (1920×1080): **PASS** (3/3 test; 6 sahnede Fold-1 görünürlük, inspector aç/kapa, odak modu, tek canvas, `overflow = 0`; 28.3s).
- `simulations-studio-layout.spec.ts` (1366×768): **PASS** (3/3 test; 3B/2B/split sekmeleri arası geçiş, tek canvas kararlılığı; 28.2s).
- `simulations-stage03.spec.ts`: **PASS** (2B↔3B eşlemeli seçim, etriye merkezi vs boşluk kotu, beton kapak prizması, reset, yatay taşma kontrolü; 5.2s).
- `simulations-stage04.spec.ts`: **PASS** (Döndür -> betonu gizle -> etriye seç -> 2B karşılığı -> kesit kaydır -> patlat -> sıfırla; 4.9s).
- `simulations-stage05.spec.ts`: **PASS** (Kiriş detay sahnesi, mesnet/açıklık seçimi, katman, 2B eşleme, kesit X, patlatma; 7.8s).
- `simulations-stage06.spec.ts`: **PASS** (Dış birleşim 3 kamera açısı, kolon etriyeleri/kiriş ankraj izolasyonu, kesit ve patlatma; 3.7s).
- `simulations-stage07.spec.ts`: **PASS** (Tekil temel alt X/Y ızgarası, L-filiz ve beton, plan/kesit koordinat uyumu; 3.4s).
- `simulations-stage08.spec.ts`: **PASS** (Perde duvar iki yüz donatı sahnesi, uç bölgeler, çirozlar, kesit ve patlatma; 3.4s).
- `simulations-stage10.spec.ts`: **PASS** (Kolon parametre girişi, `Uygula`, 3B+2B eşzamanlı güncelleme, URL paylaşım/decode döngüsü; 5.5s).
- `simulations-stage11.spec.ts`: **PASS** (5/5 test; WebGL context lost/restore, render idle kontrolü, 6 sahne döngüsü, yatay taşma = 0, klavye/a11y/tema; 44.5s).
- `simulations-stage12-smoke.spec.ts`: **PASS** (Ana site rotaları duman testi; 29.2s).
- `npx tsc -p tsconfig.next.json --noEmit --incremental false`: **PASS** (0 hata).

---

## 7. Aşama 07 — Mobil, Tablet, Klavye, Odak ve Tam Ekran (TAMAMLANDI)

### 7.1 Uygulanan Değişiklikler
1. **Overlay Drawer (1024–1279px `lg:max-xl:` Çözümü):**
   - 1024–1279px ekran genişliğinde sağ denetçi panelinin canvas'ı sıkıştırmasını veya sayfa altına düşmesini önlemek amacıyla `lg:max-xl:fixed lg:max-xl:top-20 lg:max-xl:right-4 lg:max-xl:bottom-4 lg:max-xl:z-50 lg:max-xl:w-[350px]` overlay drawer düzeni uygulandı.
   - 1280px ve üzerinde (`xl:`) masaüstü yan yana grid korunurken, orta ekranlarda canvas genişliği maksimize edildi.
2. **Klavye Kısayolları ve Hiyerarşik ESC Çıkışı (`simulation-workspace.tsx`):**
   - **`1`:** 3B Sahne moduna geçiş.
   - **`2`:** 2B + 3B Bölünmüş moduna geçiş.
   - **`3`:** 2B Çizim moduna geçiş.
   - **`F`:** Odak Modunu aç/kapat (Focus Mode toggle).
   - **`?`:** Klavye kısayolları modalini aç (`simulation-shortcuts-modal`).
   - **`ESC` Hiyerarşik Çıkış Önceliği:**
     1. Kısayollar modali açıksa önce modali kapatır.
     2. Tarayıcı tam ekranındaysa tam ekrandan çıkar.
     3. Odak modundaysa (`focusMode === true`) odak modundan çıkar ve önceki panel durumunu geri yükler.
     4. Küçük ekranlarda açık olan drawer'ı kapatır.
3. **Klavye Kısayolları Yardım Modali (`simulation-shortcuts-modal`):**
   - Üst başlıkta `data-testid="simulation-shortcuts-toggle"` butonu eklendi.
   - `role="dialog"`, `aria-labelledby`, erişilebilir odak yakalama ve şık kbd etiketleri ile donatılmış kısayol rehberi sunuldu.
4. **Mobil ve Dokunmatik Ergonomisi:**
   - Mobil parça seçim mikro çipi (`data-testid="mobile-selected-part-chip"`) için minimum dokunma hedefi `min-h-[44px]` güvencesine alındı.
   - iOS/Android güvenli alanları için `bottom-[calc(5.5rem+env(safe-area-inset-bottom))]` dinamik boşluğu uygulandı.
   - `motion-reduce:transition-none` ile erişilebilirlik ve performans korundu.

---

### 7.2 Doğrulama ve Test Kabulü
- `npm run check:simulations:model`: **PASS** (10/10 test).
- `simulations-studio-layout.spec.ts` (1920×1080): **PASS** (3/3 test; 27.9s).
- `simulations-studio-layout.spec.ts` (1366×768): **PASS** (3/3 test; 26.0s).
- `simulations-studio-layout.spec.ts` (390×844): **PASS** (3/3 test; 25.5s).
- `simulations-stage03.spec.ts`: **PASS** (5.5s).
- `simulations-stage04.spec.ts`: **PASS** (5.0s).
- `simulations-stage05.spec.ts`: **PASS** (4.9s).
- `simulations-stage06.spec.ts`: **PASS** (4.1s).
- `simulations-stage07.spec.ts`: **PASS** (3.3s).
- `simulations-stage08.spec.ts`: **PASS** (3.5s).
- `simulations-stage10.spec.ts`: **PASS** (5.4s).
- `simulations-stage11.spec.ts`: **PASS** (5/5 test; WebGL context lost/restore, render idle kontrolü, 6 sahne döngüsü, yatay taşma = 0, klavye/a11y/tema; 44s).
- `simulations-stage12-smoke.spec.ts`: **PASS** (Ana site rotaları duman testi; 20.2s).
- `npx tsc -p tsconfig.next.json --noEmit`: **PASS** (0 hata).

---

## 8. Aşama 08 — Stüdyo Etkileşim, Kamera Hassasiyeti, Regresyon ve Kapsam Koruma (TAMAMLANDI)

### 8.1 Uygulanan Değişiklikler ve Test Otomasyonu
1. **Etkileşim Test Paketi (`simulations-studio-interactions.spec.ts`):**
   - **Kamera Azaltılmış Hassasiyet Doğrulaması:** 100 px fare sürüklemesinde azimuth değişimi baseline'daki 0.856 rad (-49.0°) değerinden %45 daha sakin hale gelerek `0.47 rad` seviyesinde ölçüldü (`0.35 rad <= diff <= 0.65 rad` sınırları PASS).
   - **Scroll İzolasyonu:** Sağ denetçi panelinde (`simulation-inspector-panel`) tekerlek kaydırması yapılırken 3B sahne kamerasının azimuth açısı ve mesafesi `0.000 rad / 0.000 m` sapma ile tam korundu (`wheel` izolasyonu doğrulandı).
   - **Klavye Kısayolları ve Hiyerarşik ESC Çıkışı:** `1` (3B), `2` (Split), `?` (Kısayollar Modalı), `ESC` (Modal kapatma), Odak Modu toggle ve `ESC` (Odak Modundan çıkış) adımları tam deterministik olarak doğrulandı.
   - **Altı Sahnede Viewport Görünürlüğü ve Çizim Çağrısı:** Altı sahnede (`kolon-detayi`, `kiris-detayi`, `kolon-kiris-birlesimi`, `tekil-temel`, `perde-detayi`, `radye-temel`) canvas'ın ilk ekranda (Fold-1, Y <= 450 px) görünür olduğu, `drawCalls > 3` ile geometrinin GPU'ya iletildiği ve yatay taşmanın 0 px olduğu kanıtlandı.
2. **CAD/DWG/DXF Koruma Sınırlarının Teyidi:**
   - `git diff --stat` ile doğrulanmıştır: Hiçbir CAD çekirdek dosyasına (`cad-runtime-orchestrator`, `cad-upstream-viewer`, `cad-viewer`, `dxf-viewer-worker` vb.) dokunulmamıştır. Değişiklikler yalnızca simülasyon stüdyosu bileşenleri ve viewer katmanıyla sınırlıdır.
3. **Mühendislik Araçları Baseline ve Canlılık Kontrolleri:**
   - `check:tools-registry`: 30/30 araç %100 senkron ve canlı (PASS).
   - `check:tools-baseline`: Faz 1 korumalı hesaplayıcılar 0 regresyon ile tamamlandı (PASS).

---

### 8.2 Doğrulama ve Test Kabulü
- `tests/site-audit/simulations-studio-interactions.spec.ts` (1920×1080): **4/4 PASS** (24.5s).
- `tests/site-audit/simulations-studio-interactions.spec.ts` (1366×768): **4/4 PASS** (24.7s).
- `tests/site-audit/simulations-stage01.spec.ts`: **PASS** (10.7s).
- `tests/site-audit/simulations-stage02.spec.ts`: **PASS** (11.6s).
- `tests/site-audit/simulations-stage09.spec.ts`: **PASS** (11.7s).
- `npm run check:simulations:model`: **PASS** (10/10 test paketi).
- `npx tsc -p tsconfig.next.json --noEmit`: **PASS** (0 hata).
- `npm run check:tools-registry`: **PASS** (30/30).
- `npm run check:tools-baseline`: **PASS** (0 regresyon).

---

## 9. Aşama 09 — Mimari Belge, Tek Kontrollü Release ve Final Doğrulama (TAMAMLANDI)

### 9.1 Uygulanan Final Adımlar
1. **Mimari Dokümantasyon (`3B_STUDIO_ARCHITECTURE.md`):**
   - Bölüm 4 ("TradingView Esinli Kamera, UX ve Sabit Çalışma Alanı Revizyonu") eklendi.
   - Azaltılmış kamera hassasiyeti (`rotateSpeed: 0.55`, `0.90x/1.10x` adımları), tek ekranlık sabit stüdyo düzeni (`overscroll-contain`), sol dikey araç rayı, 4. sekme "Öğretim", elastik 22–48 dvh alt dock, overlay drawer ve kısayol hiyerarşisi belgelendi.
2. **Proje Ana Dokümanı (`PROJECT.md`):**
   - Bölüm 7 (3B/2B İnteraktif Simülasyon Kütüphanesi) stüdyo mimarisi ve kalite kapıları yeni sözleşmeyle güncellendi.
3. **Üretim Derlemesi ve Kalite Kapıları:**
   - `git diff --check`: PASS (0 boşluk/satır sonu hatası).
   - `npx tsc -p tsconfig.next.json --noEmit --incremental false`: PASS (0 hata).
   - `npm run build`: PASS (634/634 statik/SSG sayfa başarıyla derlendi).
   - `npm run check:simulations:model`: PASS (10/10 test).
   - `tests/site-audit/simulations-studio-interactions.spec.ts`: PASS (4/4 test).
   - `tests/site-audit/simulations-studio-layout.spec.ts`: PASS (3/3 test, 1920/1366/390 px).
4. **Kapsam İzolasyonu ve Tek Release Commit:**
   - Alakasız çalışma alanı değişiklikleri ayrıldı.
   - Yalnız bu görevin 11 dosyası tek anlamlı atomik commit ile kaydedildi.
