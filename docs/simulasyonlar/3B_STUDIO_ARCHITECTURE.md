# 3B Simülasyon Sahne Öncelikli Stüdyo Mimarisi

> **Referans Belgesi:** `SIMULASYON_3B_SAHNE_NIHAI_BIRLESIK_PLAN_V2.md`  
> **Plan Kodu:** `SIM-STUDIO-2026-10-25`  
> **Uygulama Tarihi:** 25 Ekim 2026  
> **Durum:** TAMAMLANDI (10/10 Aşama)

---

## 1. Genel Bakış

Bu mimari güncelleme ile `/kategori/araclar/simulasyonlar/[slug]` rotalarındaki 6 adet betonarme donatı detay simülasyonu (`kolon-detayi`, `kiris-detayi`, `kolon-kiris-birlesimi`, `tekil-temel`, `perde-detayi`, `radye-temel`), dar ve kontrollerle boğulmuş klasik sayfa yapısından çıkarılarak **büyük ekranı dolduran, sahne öncelikli profesyonel bir mühendislik stüdyosu** deneyimine dönüştürülmüştür.

---

## 2. Ana Mimari İlkeler

### 2.1 Genişletilmiş ve Sınırlı Stüdyo Kabı
- Sayfa dış kapsayıcısı (`src/app/kategori/araclar/simulasyonlar/[slug]/page.tsx`), genel sitenin `max-w-7xl` (1280 px) sınırından bağımsızlaştırılarak `max-w-[2400px]` ölçüsüne genişletilmiştir.
- Yan padding'ler ve mobil uyumluluk korunmuş; 1920×1080 ve 2560×1440 monitörlerde yanlardaki devasa boşluklar ortadan kaldırılmıştır.

### 2.2 Fold-1 Görünürlük ve Dinamik Canvas Yüksekliği
- 3B görüntüleyici (`simulation-viewer.tsx`), öğrenme panelinin üzerine alınarak dikeyde Y ~210 px kotuna çekilmiştir. Kullanıcı sayfayı açtığında hiçbir kaydırma yapmadan 3B modeli ilk viewport'ta görür.
- Sabit `520 px` yüksekliği yerine CSS clamp tabanlı duyarlı yükseklik uygulanmıştır:
  `h-[clamp(360px,56dvh,520px)] sm:h-[clamp(440px,58dvh,620px)] lg:h-[clamp(520px,64dvh,740px)] 2xl:h-[clamp(580px,68dvh,860px)] min-h-[320px] max-h-[calc(100dvh-76px)]`
- 1080p ekranda canvas yüksekliği 520 px'den 734 px'e (+%41.2) çıkarken; yatay mobil (844×390) ekranlarda kilitlenme engellenmiştir.

### 2.3 Sahne Öncelikli Grid ve Akıllı Sağ Denetçi
- Yerleşim: `grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_clamp(320px,23vw,380px)]`.
- 1280 px altında sağ denetçi sahnenin altına akar; masaüstünde açıkken canvas genişliği ekranın %75.9'unu kaplar.
- Denetçi kapatıldığında (`simulation-inspector-toggle`), sahne %96.6 tam ekran genişliğe büyür. Bu işlem sırasında DOM unmount yapılmaz; WebGL context ve sahne sıfırlanmaz (`data-canvas-count=1`).

### 2.4 8-Köşe Bounding Box ve Yörünge Koruyan Kamera Sığdırma
- `three-column-viewer.ts` içinde `computeFitDistance`: 42° FOV, anlık aspect oranı ve modelin 8 köşe dünya koordinatı üzerinden kesin trigonometrik mesafe hesabı yapar.
- `fitToModel`: Kullanıcının serbest döndürdüğü kamera açısını (polar ve azimuth) sıfırlamadan sadece mesafeyi modele sığdırır.

### 2.5 Hibrit 2B / 3B Görünüm Modları
- `viewTab=3d`: Yalnız 3B sahne; 2B gizli.
- `viewTab=split`: Canlı senkronize 3B + 2B teknik çizim paneli.
- `viewTab=2d`: 2B tam genişlik birincil sahne; 3B WebGL motoru DOM'da `hidden` ile korunur.
- Tek `Drawing2DPreview` örneği ve tek `DetailModel` sözleşmesi korunur.

### 2.6 Odak Modu, Tam Ekran ve Mobil Çip
- **Odak Modu (`simulation-focus-mode-toggle`):** Denetçiyi gizleyip sahneyi %100 genişletir; `Escape` ile veya butona tekrar basılarak çıkılır (URL kirletmez).
- **Tam Ekran API:** `requestFullscreen` desteklenmeyen ortamlarda kesintisiz Odak Modu'na düşer (graceful fallback).
- **Mobil Parça Çipi (`mobile-selected-part-chip`):** Ekranı kapatan dev modallar yerine ekranın altında şık, kapatılabilir ve güvenli alan (`safe-area-inset-bottom`) uyumlu mikro çip (`z-[60]`) açılır.

### 2.7 Performans ve WebGL Dayanıklılığı
- `ResizeObserver` içinde `lastObservedW` ve `lastObservedH` kontrolü ile alt piksel reflow ve gereksiz render döngüleri engellenmiştir.
- Durağan sahnede 3 saniye boyunca sıfır yeni render karesi (on-demand RAF).
- WebGL bağlam kaybında 1. seferde otomatik kurtarma, 2. seferde 2B yedek görünüme geçiş.

---

## 3. Doğrulama ve Test Komutları

```powershell
# Model geometri ve sınır testleri (10 test)
npm run check:simulations:model

# Yeni stüdyo yerleşim kabul testi (1920/1366/390 px)
npx playwright test --config=playwright.site.config.ts tests/site-audit/simulations-studio-layout.spec.ts

# Bütünleşik simülasyon test süiti
npm run check:simulations
```
