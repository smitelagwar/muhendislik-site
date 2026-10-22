# Belgeler Modülü — Gerçek Baseline ve Geometri Ölçüm Raporu
## Aşama 01: Kaynak İncelemesi, Gerçek Ekran/Zoom Ölçümleri ve Kök Neden Analizi

> **Tarih:** 22.10.2026 (Europe/Istanbul)  
> **Test Edilen Git SHA:** `303bb442bef95ce323c963e9acd0249e4b4d06df` (main)  
> **Test Motoru:** Playwright Chromium (Headless + Gerçek CSS Viewport ve DPR Simülasyonu)  
> **Ölçüm Veri Kaynağı:** `docs/belgeler-form-view/evidence/baseline-metrics.json`  
> **Görsel Kanıtlar:** `docs/belgeler-form-view/evidence/*.png` (30 adet ekran görüntüsü)  

---

## 1. Yönetici Özeti ve Kök Neden Teşhisi

Kullanıcının ilettiği Chrome %150 zoom altında **Şantiye Şefi Hizmet Sözleşmesi** ekranındaki sıkışma ve imza alanlarının ekrandan taşması sorunu, yapılan derin DOM ölçümleri ve kaynak kod analizi sonucunda **üç bağımsız bileşenin kesişimi** olarak doğrulanmıştır:

### Kök Neden 1: Sabit Kolon Genişliği (`lg:w-[410px] xl:w-[450px]`)
- `src/lib/belge-studio-layout.ts` dosyasında `BELGE_STUDIO_FORM_SCROLL_CLASS` içinde form genişliği `lg:w-[410px] xl:w-[450px]` olarak katı şekilde sabitlenmiştir.
- Ekran genişliği 1920 CSS px iken sağ PDF'ye 1454 px kalırken; 1280 CSS px'e (%150 zoom) düştüğünde sol form yine 450 px kaplamakta, PDF alanı 814 px'e daralmaktadır.

### Kök Neden 2: Dikey Viewport Daralması ve Yükseklik Yetersizliği (Asıl Taşma Nedeni)
- Masaüstü 1920×1080 ekranda form görünür yüksekliği `clientHeight = 954 px` olup, 699 px'lik form içeriği (4 bölüm + imza alanı) rahatça tek ekrana sığmaktadır (`verticalOverflow = 0 px`).
- Kullanıcı Chrome'da %150 zoom yaptığında, CSS viewport `1280×720 px` seviyesine düşmekte ve formun kullanılabilir dikey yüksekliği `clientHeight = 594 px` olmaktadır.
- Formun doğal dikey yüksekliği `scrollHeight = 699 px` olduğundan, **105 px dikey taşma** oluşmakta ve 4. Bölümdeki İmza Alanının **90.5 px**'lik kısmı ekran altına taşmaktadır (`lastCardCutOff = 90.5 px`).
- Kullanıcının referans aldığı ~1640×922 (%150 zoom) pencerede kullanılabilir CSS viewport `1093×615 px` olmakta; form `clientHeight = 489 px`, `scrollHeight = 699 px` olmakta ve **210 px dikey taşma** ile imza alanı tamamen ekran dışına kaymaktadır (`lastCardCutOff = 195.5 px`).

### Kök Neden 3: 1366×768 Laptop Ekranında `lg (1024px)` Breakpoint Çöküşü
- Türkiye'de en yaygın laptop çözünürlüğü olan 1366×768 ekranda kullanıcı %150 zoom yaptığında, CSS genişliği `1366 / 1.5 = 910.67 px` (911 px) olmaktadır.
- Tailwind `lg` breakpoint'i **1024 px** olduğundan, 911 px genişlikte sistem masaüstü iki sütunlu görünümden çıkarak **mobil tek-panel sekme görünümüne** düşmektedir!
- `activeTabMobile` varsayılan olarak `"preview"` olduğu için, **sol form paneli tamamen DOM'da gizlenmekte (`hidden lg:block`)** ve kullanıcı form alanlarını görememektedir!
- Bu durum, planda P0 önceliği verilen kritik bir keşiftir.

---

## 2. Şantiye Şefi Hizmet Sözleşmesi — Ekran & Zoom Ölçüm Matrisi

| Senaryo / Çözünürlük | CSS Viewport | Form clientW / clientH | Form scrollH | Dikey Taşma (`overflowY`) | Son Eleman Durumu (`lastCardCutOff`) | PDF Preview Alanı | Toolbar Taşması |
|---|---|---|---|---|---|---|---|
| **1920×1080 (%100 Zoom)** | 1920×1080 | 449 × 954 px | 954 px | **0 px (TAM SIĞIYOR)** | 0 px (269 px serbest alan) | 1454 × 954 px | Yok |
| **1920×1080 (%125 Zoom)** | 1536×864 | 449 × 738 px | 738 px | **0 px (TAM SIĞIYOR)** | 0 px (53 px serbest alan) | 1070 × 738 px | Yok |
| **1920×1080 (%150 Zoom)** | 1280×720 | 449 × 594 px | 699 px | **105 px (TAŞIYOR)** | **90.5 px KESİK** | 814 × 594 px | Yok |
| **1640×922 (%150 Zoom - Ref)** | 1093×615 | 409 × 489 px | 699 px | **210 px (TAŞIYOR)** | **195.5 px KESİK** | 667 × 489 px | Yok |
| **1536×864 (%100 Zoom)** | 1536×864 | 449 × 738 px | 738 px | **0 px (TAM SIĞIYOR)** | 0 px (53 px serbest alan) | 1070 × 738 px | Yok |
| **1536×864 (%125 Zoom)** | 1229×691 | 409 × 565 px | 699 px | **134 px (TAŞIYOR)** | **119.5 px KESİK** | 804 × 565 px | Yok |
| **1536×864 (%150 Zoom)** | 1024×576 | 409 × 450 px | 699 px | **249 px (TAŞIYOR)** | **234.5 px KESİK** | 598 × 450 px | Yok |
| **1366×768 (%100 Zoom)** | 1366×768 | 449 × 642 px | 699 px | **57 px (TAŞIYOR)** | **42.5 px KESİK** | 900 × 642 px | Yok |
| **1366×768 (%125 Zoom)** | 1093×614 | 409 × 488 px | 699 px | **211 px (TAŞIYOR)** | **196.5 px KESİK** | 667 × 488 px | Yok |
| **1366×768 (%150 Zoom)** | 911×512 | 911 × 450 px (Mobil Tab) | 762 px | **312 px (TAŞIYOR)** | **297.0 px KESİK** | Mobil Tek Panel | Yok |
| **1280×720 (%100 Zoom)** | 1280×720 | 449 × 594 px | 699 px | **105 px (TAŞIYOR)** | **90.5 px KESİK** | 814 × 594 px | Yok |

---

## 3. Beş Belgenin Form Yüksekliği ve Dikey Taşma Karşılaştırması

Aynı ekranda (1920×1080 fiziksel ekran, %150 Chrome zoom = 1280×720 CSS viewport):

| Belge Adı | Bölüm Sayısı | Form Yüksekliği (`scrollHeight`) | Kullanılabilir Yükseklik (`clientHeight`) | Dikey Taşma | Dikey Sığma Oranı (`clientH / scrollH`) | Durum ve Değerlendirme |
|---|---|---|---|---|---|---|
| **Şantiye Şefi İstifa Dilekçesi** | 3 Bölüm | **623 px** | 594 px | **29 px** | **%95.3** | Çok az taşıyor; kompakt mod ile font küçültmeden sığabilir! |
| **İnşaat Ruhsatı Formu** | 3 Bölüm | **631 px** | 594 px | **37 px** | **%94.1** | Çok az taşıyor; kompakt mod ile font küçültmeden sığabilir! |
| **İşe Başlama Taahhütnamesi** | 3 Bölüm | **674 px** | 594 px | **80 px** | **%88.1** | Orta derecede taşıyor; kompakt + hafif ölçek (%95) ile sığar. |
| **Şantiye Şefi Hizmet Sözleşmesi** | 4 Bölüm | **699 px** | 594 px | **105 px** | **%85.0** | 105 px taşıyor; kompakt + %90-%92 ölçek ile tam sığar. |
| **Beton Döküm Tutanağı** | 4 Bölüm | **726 px** | 594 px | **132 px** | **%81.8** | En uzun form; kompakt + %90 ölçek veya sınırlı mod. |

---

## 4. Korunması Gereken Çalışan Sistem Davranışları

1. **PDF Üretim ve Rendering Motoru:**
   - `pdf-engine.ts`, `Arial-Bold.ttf`/`Arial-Regular.ttf` font eşleştirmeleri, widget seviyesinde `dict.delete('AP')` mantığı.
   - 89 adet `check:belgeler-pdf` testinin tamamı PASS durumdadır ve korunmalıdır.
2. **PDF Önizleme Araç Çubuğu:**
   - Mevcut zoom seviyesi (%50–%400), Sayfa gezintisi (`Önceki/Sonraki`), `Sığdır` butonu, `Tema Anahtarı` (Aydınlık/Koyu switch).
3. **Mobil Görünüm ve Dokunmatik Hedefler:**
   - 44px mobil buton yükseklikleri, `Formu Düzenle` sekmesi ve parıltı animasyonu, `useBelgeStudioMobileViewport` hook'u.
4. **Form Veri Bütünlüğü ve Validasyon:**
   - YİBF 7 hane kontrolü, TCKN algoritması, telefon ve tarih validasyonları.
   - Form görünümü tercihi (`mode`, `manualScale`, `density`) hiçbir koşulda PDF veri yapısına veya çıktı dosyasına sızdırılmayacaktır.

---

## 5. Aşama 01 Doğrulama ve Kabul Kararı

- [x] Git durumu temiz (`main` branch, SHA `303bb442bef95ce323c963e9acd0249e4b4d06df`).
- [x] Mevcut test altyapısı doğrulandı (`npm run check:belgeler-pdf` 89/89 PASS).
- [x] 11 farklı CSS viewport/zoom kombinasyonunda gerçek DOM ölçümleri alındı.
- [x] 5 belgenin tamamının form yükseklikleri ve dikey taşmaları sayısal olarak ölçüldü.
- [x] 30 adet PNG ekran görüntüsü ve 1 adet detaylı JSON geometri dosyası kaydedildi.
- [x] Kök nedenler (yatay panel oranı, dikey viewport daralması, 1366 laptop lg çöküşü) kanıtlandı.
- [x] Uygulamanın çalışan hiçbir kaynak kodu değiştirilmedi.

**Sonuç: ASAMA_01 KABUL KOŞULLARI EKSİKSİZ SAĞLANDI (TAMAMLANDI).**
