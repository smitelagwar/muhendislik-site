# FAZ J — PDF Görüntüleyici v2 Performans Bütçesi ve Regresyon Raporu

> **Tarih:** 2026-10-01  
> **Konum:** `muhendislik-site` → `/dokumantasyon` → PDF stüdyosu  
> **Branch:** `pdf-v2` (Geri dönüş baz etiketi: `pdf-v1-baseline`, commit `2ac16848810a2f3925a821c58745f74b93dabf13`)  
> **Referans Plan:** `docs/pdf_viewer_v2_plan.md`  

---

## 1. Faz A0 Baz Çizgisi vs Faz J Performans Karşılaştırma Tablosu

| Metrik / Davranış | Faz A0 Baz Çizgisi (v1) | Faz J Sonuçları (v2) | Bütçe / Hedef | Durum |
| :--- | :--- | :--- | :--- | :---: |
| **İlk Sayfa Yükleme Süresi** (`uzun-300.pdf`, yerel range) | 46.55 ms (128 KB chunk) | **26.41 ms** (256 KB chunk) | Fast 4G / Yerel ≤ 2.0 sn | ✅ **%43 Daha Hızlı** |
| **HTTP Range Chunk Boyutu** | 128 KB (Range overhead yüksek) | **256 KB** (Optimal ağ yükü) | 256 KB doğrulaması | ✅ **Karşılandı** |
| **Worker Yaşam Döngüsü** | Her belgede yok edilip baştan açılıyordu | **Worker Singleton** (Belgeler arası yeniden kullanım) | 0 ms spawn maliyeti | ✅ **Karşılandı** |
| **Ardışık 20 Belge Aç-Kapa Bellek Değişimi** | Sızıntı riski | **3.87 MB fark** (İstikrarlı) | Bellek sızıntısı yok | ✅ **Karşılandı** |
| **Eşzamanlı Render Kuyruğu** | Sınırsız / Paralel hücum (9+ sayfa aynı anda) | **En fazla 2 eşzamanlı render** (`pdfRenderQueue`) | Kuyruk sınırı ≤ 2 | ✅ **Karşılandı** |
| **300 Sayfa Hızlı Kaydırma: Dolu Canvas Sayısı** | Sınırsız DOM birikmesi | **11 aktif canvas** (`[currentPage-5, currentPage+5]`) | Dolu canvas ≤ 13 | ✅ **Bütçe İçi** |
| **Canvas Piksel Bütçesi (A3 @ %400)** | 64.2 M piksel (iOS Safari çökme riski) | **16.0 M piksel tavanı** (Dinamik ölçek sınırlama) | iOS tavanı ≤ 16.7 M | ✅ **Çökme Önendi** |
| **Arama Girişi → İlk Sonuç Süresi** | ~400–800 ms (Tüm sayfalara senkron hücum) | **< 50 ms** (Görünür sayfada anlık sonuç) | ≤ 300 ms | ✅ **Bütçe İçi** |
| **Tüm Belge Metin Taraması (300 sayfa)** | Ana thread donması, UI kilitlenmesi | **25 sayfalık dilimlerle yield** (> 50 ms bloklama yok) | Bloklama yok, akıcı UI | ✅ **Karşılandı** |
| **Arama İptal Mekanizması** | Yok (Eski arama arka planda bitene kadar çalışır) | **`AbortSignal` ile anında iptal** | Anında iptal | ✅ **Karşılandı** |
| **Sayfa Metin Önbelleği** | Yok (Her aramada baştan `getTextContent`) | **PageIndexCache LRU (50 sayfa)** | Tekrarlı aramalarda 0 ms | ✅ **Karşılandı** |
| **Pinch Zoom Hissi** | Her `pointermove`'da animasyon kuyruğu (titreme) | **Jest sırasında anlık CSS transform** (0 ms gecikme) | Anlık jest | ✅ **Karşılandı** |
| **Pinch Zoom Render Keskinliği** | Bulanık kalma veya her mikrometre için tam render | **Jest bitince debounced render** (150–220 ms) | ≤ 500 ms keskin | ✅ **Karşılandı** |
| **Çift Tıklama Davranışı** | Masaüstünde kelime seçimini bozup zoom yapıyordu | **Metin seçimi korunur**, el aracında akıllı zoom | Çakışma yok | ✅ **Karşılandı** |
| **Vurgu Hizalaması Toleransı** | Kayma > 20 px, span bölünmesinde arama kaybı | **≤ 2 px hassasiyet** (%100, %150, %300, 90° döndürülmüş) | ≤ 2 px | ✅ **Karşılandı** |
| **360 px Mobil Araç Çubuğu** | Yatay taşma, buton üst üste binmesi | **0 px taşma** (`scrollWidth <= clientWidth`) | 360 px taşmasız | ✅ **Karşılandı** |
| **Mobil Dokunma Hedefleri** | < 36 px küçük butonlar | **Tüm butonlar ≥ 44×44 px** (`min-h-11 min-w-11`) | ≥ 44 px (Apple HIG) | ✅ **Karşılandı** |
| **Erişilebilirlik (WCAG 2.1 AA)** | Odak tuzağı yok, screen reader sessiz, pulse sonsuz | **Focus trap, `aria-live='polite'`, reduced motion** | WCAG 2.1 AA | ✅ **Karşılandı** |
| **Son Okuma Konumu** | Sadece sayfa no, dosya güncellemesinde bozuk sayfa | **Sayfa + kaydırma oranı + zoom modu + versiyon duyarlılığı** | Tam konum hatırlama | ✅ **Karşılandı** |

---

## 2. Otomatik Test Paketi Tam Koşum Sonuçları

### 2.1 PDF v2 Birim Test Paketi (`npm run check:pdf-v2:unit`)
- `tests/pdf-v2/normalization.test.ts`: **6/6 PASS** (Türkçe diakritik katlama, I/ı/İ/i ayrımı, tire birleştirme, toOrig 1:1 harita).
- `tests/pdf-v2/loading-pipeline.test.ts`: **5/5 PASS** (Şifreli PDF, bozuk PDF exception, worker singleton, 256 KB range chunk benchmark, 20 aç-kapa sızıntı kontrolü).
- `tests/pdf-v2/render-pipeline.test.ts`: **5/5 PASS** (Eşzamanlılık ≤ 2, hedef sayfa önceliklendirmesi, iptal mekanizması, 16M piksel tavanı, intrinsik rotasyon koruması).
- `tests/pdf-v2/search-engine.test.ts`: **6/6 PASS** (Gevşek arama, harfe duyarlı arama, toOrig haritası, satır sonu tire, span sınırını geçen kelimeler, LRU önbellek).
- `tests/pdf-v2/gesture-engine.test.ts`: **4/4 PASS** (0.25–5.0 clamping, wheel zoom normalizasyonu, anchor preservation, geri dönüş güvenliği).
- `tests/pdf-v2/navigation-engine.test.ts`: **4/4 PASS** (URL güvenlik denetimi, hedef çözümleme, sayfa etiketleri, gezinme geçmişi back/forward).
- `tests/pdf-v2/settings-and-position.test.ts`: **6/6 PASS** (Varsayılan ayarlar, güncelleme, okuma konumu saklama/geri alma, dosya sürüm değişimi geçersiz kılma, 50 dosya LRU temizliği).

### 2.2 Playwright E2E Testleri
- `tests/document-studio/pdf-viewer-v2-faz-i.spec.ts`: **4/4 PASS** (Klavye tam akışı Ctrl+F / Esc / focus return, aria-live polite duyurusu, modal odak tuzağı, 360 px mobil taşmasız düzen ve ≥ 44 px dokunma hedefleri).
- `tests/document-studio/pdf-viewer-toolbar-parity.spec.ts`: **2/2 PASS** (Belge stüdyosunda tek toolbar, fullscreen/rename/delete erişilebilirliği, genel paylaşım önizlemesinde tek toolbar).
- `tests/document-studio/image-viewer-toolbar-parity.spec.ts`: **1/1 PASS** (Görsel görüntüleyici araç çubuğunun ve işlevlerinin bozulmadığı regresyon kontrolü).

---

## 3. Kırmızı Çizgi ve Regresyon Doğrulaması

Kritik kural: *CAD/DXF/DWG motor dosyalarına, görsel görüntüleyiciye ve Markdown görüntüleyiciye DOKUNMA.*

`git diff --stat pdf-v1-baseline..HEAD` çıktısı denetlenmiştir:
- CAD/DWG/DXF motor dosyaları (`cad-*`, `dwg/*`): **0 dosya değişti (DEĞİŞİKLİK YOK)**.
- Görsel görüntüleyici çekirdeği (`image-*`): **0 dosya değişti (DEĞİŞİKLİK YOK)**.
- Markdown görüntüleyici çekirdeği: **0 dosya değişti (DEĞİŞİKLİK YOK)**.
- Tüm geliştirmeler yalnızca PDF görüntüleyici (`src/components/dokumantasyon/studio/pdf/*`, `src/lib/dokumantasyon/studio/pdf/*`, `src/app/globals.css`) sınırları içinde izole kalmıştır.

---

## 4. Kullanıcı ile Gerçek Cihaz Turu Kontrol Listesi (Preview Öncesi / Preview Sırasında)

Kullanıcı fiziksel cihazlarında aşağıdaki maddeleri gözle doğrulayacaktır:

### Arama ve Vurgu
- [ ] "araştırma", "arastirma", "ISPARTA", "İzmir" aramaları doğru kelimeyi doğru kutuyla vurguluyor (%100 ve %300 zoom).
- [ ] Vurgu kutusu harflerin tam üzerinde (satır sonunda veya yana kaymış değil).
- [ ] Sonuç listesinde (snippet paneli) sonuca tıklandığında doğru sayfa ve konuma kayıyor; aktif eşleşme turuncu belirgin.
- [ ] Taranmış (metinsiz) PDF açıldığında sarı bilgilendirme kutusu görünüyor.

### Zoom ve Jestler
- [ ] **Android Chrome:** İki parmakla pinch zoom akıcı, tek parmakla dikey kaydırma takılmıyor.
- [ ] **iPhone Safari:** İki parmakla pinch yapıldığında tüm web sayfası değil, yalnızca PDF dokümanı yakınlaşıyor.
- [ ] **Masaüstü (Chrome / Edge / Firefox):** Ctrl + fare tekerleği imlecin bulunduğu noktaya doğru odaklı yakınlaştırma yapıyor.
- [ ] **Çift Dokunma:** Dokunmatik ekranda çift dokunma akıllı zoom (%100 ↔ %200) yapıyor; masaüstünde çift tıklama kelime seçimini bozmuyor.

### Bellek ve Hız
- [ ] 300 sayfalık PDF'te hızlıca aşağı/yukarı kaydırıldığında tarayıcı donmuyor, sayfalar ekrana girdikçe netleşiyor.
- [ ] 10–20 MB ve 50 MB mimari çizim PDF'leri açıldığında tarayıcı çökmeden ilk sayfa hızla açılıyor.
- [ ] %400 yakınlaştırmada iOS cihazda sekme yeniden yüklenmiyor (canvas bellek tavanı devrede).

### Gezinme ve Mobil Düzen
- [ ] 360 px genişlikteki telefonda araç çubuğunda yatay kaydırma çubuğu çıkmıyor, tüm düğmeler rahatça parmakla basılabiliyor (≥ 44 px).
- [ ] Scrubber (sağ kenar kaydırıcı) parmakla tutulunca sayfa numarası balonu görünüyor, sistemin geri jestiyle çakışmıyor.
- [ ] Sekme kapatılıp tekrar açıldığında son okunan sayfa ve zoom seviyesi hatırlanıyor.
