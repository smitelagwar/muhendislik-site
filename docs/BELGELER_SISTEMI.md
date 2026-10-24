# Belgeler & Canlı PDF Stüdyosu — Mimari & Deneyim Notları

> **ÖNEMLİ (Token Tasarrufu):**
> Bu doküman **SADECE** `/belgeler` sayfası, PDF motoru (`pdf-engine.ts`) veya resmi evrak stüdyoları ile ilgili bir işlem/geliştirme yapılacağı zaman okunmalıdır. Eğer göreviniz belgeler konusuyla ilgili **DEĞİLSE**, bu dokümanı okumanıza gerek yoktur; doğrudan atlayınız.

Bu doküman, Mühendis Mimar Portalı bünyesindeki **Belgeler (`/belgeler`)** modülünün ve interaktif PDF stüdyolarının çalışma prensiplerini, yaşanmış teknik deneyimleri, karşılaşılan problemleri ve önerilen çözüm pratiklerini özetler. Gelecekteki geliştirmelerde yol gösterici bir tecrübe kütüphanesi niteliğindedir.

---

## 1. Temel Mimari ve Çalışma Prensibi

Sistem, kullanıcıların belge şablonlarını tarayıcıda doldurmasına, **gerçek PDF üzerinde canlı önizlemesine** ve indirilebilir A4 PDF çıktısı almasına olanak tanır. Çıktının hukuki geçerliliği kullanılan şablona ve ilgili kurumun güncel gerekliliklerine bağlıdır.

```
┌────────────────────────────────────────────────────────┐
│                   /belgeler Sayfası                    │
│   (Arama + Belge Kartları)       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             /belgeler/[belge-adi] Sayfası              │
│               (Müstakil Tam Ekran Studio)              │
└───────────────────────────┬────────────────────────────┘
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                BelgeStudioUnifiedHeader (Tek Ortak Üst Bar)            │
│  ├─ Sol Bölge: Belgelere Dön Linki, Belge İkonu, Tek Başlık (h1/h2)    │
│  ├─ Orta Bölge: PDF Toolbar Portal Slotu (createPortal hedefi)         │
│  └─ Sağ Bölge: Ek Aksiyonlar, Kompakt Taslak Rozeti & Popover          │
├────────────────────────────────────────────────────────────────────────┤
│                        [Belge]Studio Bileşeni                          │
│  ├─ Sol Panel: Form Girdileri, Akordeon Bölümleri, Validasyonlar       │
│  ├─ Sağ Panel: PDF.js Canvas Önizleme (Toolbar'sız, +102px Canvas)     │
│  └─ Alt Footer: PDF İndir, Boş Form, Yazdır, Sıfırla, Temizle, Paylaş  │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      PDF Motoru (pdf-engine.ts)                        │
│  ├─ pdf-lib + @pdf-lib/fontkit ile AcroForm Alan Doldurma              │
│  ├─ Çift Font Desteği (Arial-Bold & Arial-Regular)                    │
│  ├─ Hayalet Yazı / Leke Temizleme (AP & DV Widget Sanitization)       │
│  └─ Metin Hizalama (Quadding - Q) ve Alan İçine Sığdırma              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. PDF Motoru ve AcroForm Yönetimi (Kritik Deneyimler & Hata Önleme)

PDF şablonları AcroForm alanları içerir. Geliştirme sürecinde karşılaşılan ve çözülen kritik sorunlar şunlardır:

### 2.1. Hayalet Yazı ve Leke (Ghost Stains / Pre-baked Artifacts) Sorunu
* **Sorunun Kaynağı:** PDF şablonları hazırlanırken veya dışarıdan aktarılırken form alanlarının içerisine statik görünüm akışları (`AP` - Appearance Streams) ve varsayılan değerler (`DV` - Default Values) gömülür. Özellikle kullanıcı **"Temizle"** butonuna basıp form alanlarını boşalttığında, PDF görüntüleyicisi yeni boş değer yerine widget'ın arkasında kalmış eski AP stream'ini göstererek ekranda nokta, çizgi veya silik harf lekeleri oluşturur.
* **Kesin Çözüm:** `pdf-engine.ts` içindeki `populateForm` fonksiyonunda her alan doldurulurken:
  1. `field.acroField.dict.delete(PDFName.of("AP"))` ve `delete(PDFName.of("DV"))` yapılmalıdır.
  2. **EN KRİTİK NOKTA:** AP akışları sadece field üzerinde değil, `field.acroField.getWidgets()` içindeki her bir **widget annotation** üzerinde yaşar. Dolayısıyla her widget için:
     ```ts
     const widgets = field.acroField.getWidgets();
     for (const widget of widgets) {
       widget.dict.delete(PDFName.of("AP"));
       widget.dict.delete(PDFName.of("DV"));
       widget.dict.set(PDFName.of("DA"), PDFString.of(`/${useFont.name} ${spec.size} Tf 0 0 0 rg`));
       if (spec.q !== undefined) {
         widget.dict.set(PDFName.of("Q"), PDFNumber.of(spec.q));
       }
     }
     ```

### 2.2. Font Kalınlığı (Bold vs. Regular) Ayrımı
* **Kural:** Resmi dilekçe ve tutanaklarda gövde metinleri (açıklama paragrafları, sonuç ve talep cümleleri, adres detayları vb.) **asla kalın (bold) yazılmamalıdır.** Sadece başlıklar, kurum isimleri ve imza/tarih gibi dikkat çekmesi gereken kısımlar kalın olmalıdır.
* **Uygulama:** `pdf-engine.ts` hem `Arial-Bold.ttf` hem `Arial-Regular.ttf` fontlarını belleğe yükler. `FIELD_SPECS` içinde her alan için `bold: true` veya `bold: false` açıkça belirtilmelidir:
  - `ana_paragraf` → `bold: false` (Regular)
  - `sonuc_cumlesi` → `bold: false` (Regular)
  - `hitap_1`, `hitap_2` → `bold: true` (Bold)
  - `ad_soyad` → `bold: true` (Bold)

### 2.3. Metin Hizalama (Quadding - `Q`)
* PDF standartlarında `Q` parametresi metin hizalamasını belirler:
  - `Q: 0` → Sola Yaslı (Paragraflar, adresler, açıklamalar)
  - `Q: 1` → Ortalanmış (Başlıklar, hitaplar, ad-soyad)
  - `Q: 2` → Sağa Yaslı (İmza blokları, sağ tarih alanları)
* Her alan için `FIELD_SPECS`'te `q` değeri tanımlanmalı ve hem field'a hem widget'larına set edilmelidir.

### Satır içi alanların punto ve taban hizası (18 Ekim 2026)
* Taahhütname alanları etiketlerle aynı **9 pt**, sözleşme alanları çevredeki gövdeyle aynı **9.5 pt** kullanır. Bu dar tek satırlarda `pdf-lib` otomatik paragraf ölçümü kullanılmaz; aksi halde kısa değerler dahi 5–8 pt'ye düşer.
* `updateInlineFieldAppearance`, gerçek fontkit glif sınırlarıyla yatay sığmayı ve Türkçe harflerin dikey sınırlarını hesaplar. Yalnız sığmayan girişler küçültülür; tam alan değeri korunur. `pdf-lib` özel font yüksekliğinde descender ölçeği tutarsız olduğu için glif sınırları doğrudan fontkit'ten alınır.
* Kaynak PDF dosyaları ve sayfa içerikleri değişmez. Üretilen PDF'de taahhütname widget'ları 10.2 pt yüksekliğe ve kaynak etiket tabanlarına kalibre edilir; imza unvanına 2 pt ek satır aralığı verilir. Sözleşmede taban, kaynak kutunun altından 2 pt yukarıda tutulur. Önizleme, indirme, yazdırma ve PDF üzerinde düzenleme aynı üretilen geometriyi kullanır.
* Regresyon kanıtı: `tests/belgeler/pdf-field-typography.test.ts`; mevcut okunabilirlik envanteri üretilen geometri/puntoyu izler. Diğer üç belgenin tipografisi ve çok satırlı sığdırma davranışı korunur.

### 2.4. Kullanıcı Dostu Dil (Yazılımsal Terimlerin Gizlenmesi)
* **Kural:** Arayüzde veya başlıklarda son kullanıcıyı ilgilendirmeyen `(AcroForm)`, `(PDF Form)`, `(Field Array)` gibi yazılımsal veya teknik terimler **kesinlikle yer almamalıdır.** Başlıklar her zaman `"Beton Döküm Tutanağı"`, `"Şantiye Şefi İstifa Dilekçesi"` gibi sade ve kurumsal olmalıdır.

### 2.5. Alan profilleri, gerçek ölçüm ve boş form
* `belgeler-pdf-profiles.ts`, mevcut alan sözleşmesindeki 56 düzenlenebilir alan ve üç sabit etiketin punto, kalınlık, hizalama, çok satırlılık, sayfa, kutu ve nominal tabanını tanımlar. Kaynak PDF dosyaları yeniden oluşturulmaz; üretilen widget geometrisi profile uygulanır.
* İstifa adresi 225×36 pt kalır; ilk satır `ADRES` etiketiyle aynı tabana sabitlenir. T.C. ve telefon etiket/değerleri 20 pt aşağı alınır. Diğer bölgeler mevcut tasarımı korur.
* `generateBelgeDocument` aynı üretimden `{ bytes, layouts }` döndürür. `layouts`, çizilen Tf/Tm/Tj işlemlerinden gerçek puntoyu, satır tabanlarını, glif sınırlarını ve taşmayı ölçer. Eski `generate…Pdf` API'leri byte döndürmeye devam eder. Snapshot PDF ve raporu aynı revizyonda tutar; eski ölçüm yeni girdiye uygulanmaz.
* Baskı rehberliği tahmini karakter eşiklerini kullanmaz: gerçek punto 7'nin altındaysa uyarı, nominalin %80'inin altındaysa bilgilendirme gösterilir. Boş/nötr değerler sessizdir; indirme engellenmez. Taslak popover aynı motorla tek alanı ölçer; ana form ve önizlemeyi değiştirmez.
* `Boş form indir`, `generateBlankBelgePdf` ile düzenlenebilir değerleri boşaltır; üç sabit etiket ve sayfa içerikleri korunur. Açık form ve geri alma kaydı değişmez. Ham şablon bağlantıları boş form olarak sunulmaz.
* Birleşik yerel kapı: `npm run check:belgeler-pdf`. Altı sayfanın kabul PNG'leri `tests/fixtures/belgeler-approved/` içindedir; otomatik güncellenmez. Görsel kapı Poppler `pdftoppm` kullanır ve istifa iletişim bloğu dışında piksel değişikliğini reddeder. Masaüstü/mobil kabulü `tests/site-audit/belgeler-pdf-quality.spec.ts` sağlar.

---

## 3. Kullanıcı Arayüzü & Stüdyo Standartları (UI / UX Kuralları)

Tüm belge stüdyoları (`*-studio.tsx`) standart bir kullanıcı deneyimi sunmalıdır:

### 3.1. Bağımsız Stüdyo Navigasyonu ve Başlığı
* `/belgeler` belge kataloğudur; arama/kartlar, genel site başlığı ve uygun ekranlarda ana navigasyon burada görünür.
* Beş belge stüdyosu katalogdan kendi rotasına açılır: `/belgeler/beton-dokum-tutanagi`, `/belgeler/insaat-ruhsati-dilekcesi`, `/belgeler/santiye-sefi-istifa-dilekcesi`, `/belgeler/santiye-sefi-sozlesmesi` ve `/belgeler/santiye-sefi-taahhutnamesi`. Bu rotalarda genel site header'ı gizlenir; masaüstünde (`lg+`) `BelgeStudioPageShell` tek satırlı belge başlığını ve `/belgeler` hedefine dönen erişilebilir bağlantıyı gösterir, mobilde (`< lg`) ise ekran alanını maksimum kullanmak için üst bar gizlenip `Belgelere dön` eylemi alt çubuktaki `⋯` (`Diğer belge işlemleri`) menüsü içine taşınır (`h1` başlığı ekran okuyucular ve SEO için `sr-only` olarak korunur). Rota eşlemesi `src/lib/belge-studio-routes.ts` içinde tutulur.
* Mobil görünümde form ve PDF önizlemesi tek ekranda üst üste bindirilmez. Eski üst `Form Alanları / Canlı PDF Önizle` sekmeleri kaldırılmıştır; stüdyo ilk açılışta **PDF önizlemesi** gösterir. Form ile PDF arasında yalnız alt belge eylemleri çubuğundaki **Formu Düzenle / Canlı PDF Önizle** düğmesiyle geçilir. Stüdyo içinde genel hamburger ve gereksiz yer kaplayan "Başlangıç alanları örnek veridir..." üst uyarı bandı bulunmaz. `Ctrl+K` komut paleti davranışı korunur.
* Belgeler kataloğu şu anda `StudioPreview` modalı kullanmaz. Kartlardaki stüdyo eylemleri bağımsız belge rotasına gider; yeni belge eklerken olmayan bir modalı `belgeler-hub.tsx` içine bağlamayın.

### 3.2. Dış Sayfa Kaydırmasız Düzen (Zero Outer Scroll / 100vh Fit)
* Masaüstü ekranlarda stüdyo açıldığında ana tarayıcı penceresinde **dış kaydırma çubuğu (outer scrollbar) kesinlikle çıkmamalıdır.**
* Stüdyo `h-[calc(100vh-...)]` veya tam ekran düzenine oturmalı; sol form paneli bağımsız olarak kendi içinde (`overflow-y-auto`) kaymalı, sağdaki canlı PDF önizleme paneli ise kullanılabilir alana orantılı biçimde sığmalıdır.

### 3.3. PDF Üretimi, Canlı Önizleme ve Yakınlaştırma
* Ortak `BelgeStudioPreviewToolbar`, **masaüstünde** yakınlaştırma grubunu önizleme panelinin yatay merkezinde tutar. **1023 px ve altı mobil/tablet ekranlarda** çok sayfalı PDF'nin sayfa gezinmesi ve zoom ± düğmeleri **44 px yüksekliğinde tek satırda** kalır. Mobilde **Sığdır** ve **PDF'yi yeni sekmede aç** eylemleri erişilebilir `Diğer PDF görünüm seçenekleri` menüsündedir; dar konteynerde gizlenen zoom yüzdesi menü başlığında okunur. Mobil tek sayfalı belgeler mevcut doğrudan Sığdır/dış bağlantı eylemlerini korur. **Masaüstünde** özel dar önizleme panelleri 560 px ve altında iki satıra geçebilir; normal masaüstünde merkez hizası korunur. Görünür araç hedefleri en az 44×44 px, menü öğeleri en az 48 px'tir. Çok sayfalı 320–414 px karşılaştırmasında toolbar 91 → 44 px ölçülmüştür (**47 CSS px** kazanım).
* Önizlemedeki `Koyu tema` switch'i yalnız masaüstünde (`lg+`) görünür. Mobil/tablette (`< lg`) tema geçişi mevcut `Diğer belge işlemleri` menüsündedir; form ve PDF görünümünde erişilebilir kalır. İki eylem ortak `next-themes` durumunu değiştirir; uygulama teması ve `aria-checked` birlikte güncellenir. Tema ve zoom PDF'i yeniden üretmez.
* Belge araçlarının özel SVG seti `src/components/belge-studio-icons.tsx` içinde tutulur; `currentColor` ile her iki temaya uyar, dekoratif SVG'ler `aria-hidden` kullanır. Eylemin Türkçe erişilebilir adı düğme/bağlantı üzerinde kalır.
* Beş stüdyo da `useBelgeStudioDocument` ortak hook'unu kullanır. Alan değişikliklerinden sonra üretim 150 ms geciktirilir; en yeni istek geçerli kalır, 20 saniyelik zaman aşımı uygulanır ve çıktı PDF imzası açısından doğrulanır. Önizleme, yazdırma ve indirme aynı güncel byte snapshot'ını kullanır. Yeni çıktı oluşana kadar eski PDF'in indirilmesi/yazdırılması engellenir; kullanılmayan blob URL'leri temizlenir.
* PDF.js belgesini yeniden kullanarak sayfa çizilir. Yakınlaştırma PDF'i yeniden üretmez; zoom değişince yalnızca önizleme sayfası tekrar çizilir. Sayfa numarası ve toplam sayfa sayısı PDF'den okunur, önceki/sonraki sayfa ve sığdırma kontrolleri gerçek sayfayı yönetir.
* Yakınlaştırma %50–%400 aralığındadır; düğmeler %25 adım, tekerlek ve pinch sürekli ölçek kullanır. Masaüstünde Ctrl/Cmd + tekerlek, önizleme yüzeyine bağlanan yerel `wheel` dinleyicisi ve `{ passive: false }` ile yakalanır. React `onWheel` bu iş için kullanılmaz; pasif olay tarayıcı zoom'unu durduramaz. Normal tekerlek paneli kaydırır. Ctrl/Cmd + artı/eksi/0 kısayolları önizleme odaktayken çalışır.
* Mobilde iki parmak hareketi yalnızca PDF önizleme yüzeyinde yakalanır; tek parmakla büyütülmüş sayfa kaydırılır. Ardışık zoom hareketleri son raster ölçeğine göre hesaplanır ve imleç/parmak çıpası panelin kaydırma koordinatlarıyla korunur. Canvas raster belleği en çok 8 milyon piksel ve kenar başına 4096 piksel ile sınırlandırılır. Form değişikliği, çok sayfalı belgedeki etkin sayfayı korur.
* Mobilde alttaki geçiş düğmesiyle form/PDF arasında gidip gelirken PDF belgesi hazır tutulur; önizleme ilk açılışta görünür ve geri dönüldüğünde boş canvas görülmemelidir. Canvas hazırlığı `opacity` ile yönetilir; `visibility: visible` kullanılmaz, çünkü bu değer gizli önizleme panelinin görünürlüğünü geçersiz kılıp canvas'ı formun üzerine çıkarabilir. Başarılı çizim, yüklenme ve hata durumları ayrı ayrı duyurulur; hata durumunda yeniden deneme sağlanır.

### 3.4. Alan Bazlı Yerel Sıfırlama Butonu (Per-Field Reset)
* Her form alanının başlığında, o alan varsayılan şablon değerinden farklı bir değere getirildiği anda beliren küçük bir `↺ Sıfırla` butonu yer alır.
* Kullanıcı alanı varsayılan değerine geri döndürdüğünde bu buton otomatik olarak kaybolmalıdır.

### 3.5. Esnek Doğrulama ve Uyarı Mantığı (Validations)
* **Altın Kural:** Bir alanda format veya hane kısıtı varsa (örneğin Yapı Denetim YİBF No için 7 hane kuralı), **kullanıcının yazması ASLA engellenmemelidir.**
* Belirlenen öneri aşıldığında alan engellenmez ve değeri kesilmez. Form üstündeki yumuşak uyarı özeti, alan adını, girilen karakter sayısını ve önerilen uzunluğu gösterir; varsayılan örnek değerler gereksiz uyarı üretmez. Kullanıcı değerini düzenleyebilir veya alanın yerel sıfırlama düğmesini kullanabilir.

### 3.6. Standart Aksiyon Butonları
Her stüdyoda şu 5 ana aksiyon bulunur:
1. **Sıfırla (`BelgeResetIcon`):** Formu resmi örnek değerlerle doldurur.
2. **Temizle (`BelgeClearIcon`):** Tüm form kutucuklarını boşaltır (bembeyaz boş şablon).
3. **Boş Form (`BelgeBlankFormIcon`):** Orijinal boş PDF şablonunu doğrudan indirir.
4. **Yazdır (`BelgePrintIcon`):** Önizleme blob'unu doğrudan tarayıcı yazdırma penceresine gönderir.
5. **Doldurulmuş PDF'i İndir (`BelgeDownloadPdfIcon` - Vurgulu Amber Buton):** Kullanıcının doldurduğu güncel verilerle PDF dosyasını indirir.

Bu eylemler beş stüdyoda `BelgeStudioActions` ortak bileşenindedir. Masaüstünde sabit alt çubuğun solunda sıfırlama/temizleme/geri alma, sağında boş form/yazdırma/PDF indirme bulunur; formun sonuna kaydırmak gerekmez. Mobilde aynı alt çubukta diğer işlemler menüsü (`Belgelere dön`, `Yazdır`, `Boş form indir`, `Örnek verilere sıfırla`, `Tüm alanları temizle`, `Son işlemi geri al`), form/önizleme geçişi ve PDF indirme bulunur. Menü klavye, odak geri dönüşü ve kullanılabilir yüksekliğe göre kaydırmayı Radix ile yönetir. Formdaki eski eylem kopyaları kaldırılmıştır.

Form genel olarak sıfırlandığında veya temizlendiğinde tek adımlık **Geri al** eylemi son işlemi geri yükler. Sonraki düzenleme, alan bazlı sıfırlama veya örnek veri seçimi bu eski kaydı geçersiz kılar. Alan bazlı sıfırlama normal düzenleme akışını kullanır: Sözleşme ve Taahhütname'deki bağlı imza alanları eşleşiyorsa birlikte güncellenir; elle özelleştirilmiş imzalar korunur. İndirme ve yazdırma, formdaki son değişiklik için yeni PDF hazırlanırken devre dışı kalır. PDF araçları tüm ekranlarda en az 44×44 px hedef kullanır; sayfa, zoom ve görünüm kontrolleri gruplanır. Çok sayfalı **mobil** belgelerde de tek araç satırı kullanılır; yalnız özel dar **masaüstü** panellerinde ikinci satır mümkündür. Tek sayfalı mobil belgeler doğrudan eylemlerini korur. Yatay/klavye ile daralan ekranda PDF alanı kalan yüksekliğe sığar.

### 3.7. Mobil Uyumluluk (PDF-Öncelikli Tek Alt Geçiş)
* Mobil/tablet ekranlarda (`< lg`, 1024 px altı) eski üst iki-sekmeli geçiş kontrolü **DOM'da bulunmaz**; stüdyo açıldığında PDF önizlemesi görünür. Beş stüdyoda aynı `activeTabMobile = "preview"` başlangıcı ve `BelgeStudioActions` kullanılır.
* Alt eylem çubuğundaki **Formu Düzenle** PDF'den form alanlarına, **Canlı PDF Önizle** formdan PDF'ye döndürür. Panel etiketleri `role="region"` ve açıklayıcı `aria-label` ile sunulur; kaldırılmış üst sekmelere bağlı `aria-labelledby` / `aria-controls` kalmamalıdır.
* PDF gösterilirken **Formu Düzenle** düğmesinde hafif amber ışık halkası 3,6 saniyede yavaşça nefes alır; form görünümünde bu animasyon yoktur. `prefers-reduced-motion: reduce` durumunda animasyon durur, statik halka kalır. Işıma `pointer-events: none` kullanır ve düğmenin 44 px hedefini/klavye odak halkasını değiştirmez.
* Üst sekme çubuğu önceden **52 px** yer kaplıyordu; çok sayfalı dar mobil toolbar ayrıca **47 px** kısaltıldı. Bu, yerleşim bütçesinde toplam **99 CSS px** serbest bırakır; gerçek canvas kullanılabilir alanı ayrıca cihazın safe-area ve viewport koşullarına bağlıdır.
* Form verisi, etkin PDF sayfası, yakınlaştırma, mevcut blob snapshot'ı ve indirme/yazdırma davranışı görünüm değişiminde korunur. Mobil alt sayfa düzenleyicisi ve masaüstü popover mekanizması birbirinden ayrıdır.

---

### 3.8. Belgeler Kataloğu Okyanus Yaşamı Ambiyansı

- `AmbientOceanCanvas` yalnız `/belgeler` kataloğunda arkaplan katmanı olarak çalışır: zengin 3B Okyanus Ekosistemi (balık sürüleri, farklı balık türleri, deniz canlıları ve deniz tabanı bitkileri) yer alır. Sahne yalnız `(min-width: 768px) and (hover: hover) and (pointer: fine)` koşulunda `next/dynamic` ile yüklenir. Telefon ve dokunmatik tabletlerde, yatay konum dahil, tuval/çizim motoru yüklenmez ve başlık düğmesi gizlidir. Dar ekrana geçiş sahneyi unmount ederek RAF ve gözlemcileri kapatır. Üst sağ başlıkta bağımsız kontrol düğmesi (**Okyanus Yaşamı** `muhendis_ocean_ambient_enabled`) yer alır. (Not: Önceki deneysel Blueprint Balina katmanı kullanıcı talebi doğrultusunda sistemden tamamen kaldırılmıştır.)
- `src/lib/ocean/*` (`ocean-types.ts`, `ocean-math.ts`, `ocean-flora.ts`, `ocean-creatures.ts`, `ocean-renderer.ts`) 3B Okyanus Ekosistemini oluşturur:
  - **Deniz Tabanı Bitkileri (`ocean-flora.ts`):** Alt sınır boyunca akıntıyla salınan 3B Dev Kelp ormanı (*Macrocystis pyrifera* — kök tutunma saçakları, pnömatosist hava keseleri ve 3B damarlı/kıvrımlı yaprak ayaları), tek gövdeden çatallanan 3B Yelpaze Mercanları (*Gorgonia ventalina*) ve Çatal Mercanlar (*Acropora*), *Posidonia* deniz çayırı şeritleri ve 3B kesit halkalı Boru Süngeri (*Aplysina*) kümeleri.
  - **Balık Sürüleri ve Farklı Türler (`ocean-creatures.ts`):** 4 bağımsız 3B pelajik sürü ve solo ikililer halinde toplam 70+ eklemli 3B balık; 6 farklı tür (*Sardina pilchardus* gümüş sardalya, *Caesio xanthonota* altın sırtlı fusilier, *Trachurus* istavrit, mercan *Anthias* sürüsü, uzun beyaz sırt flamalı *Zanclus cornutus* Moorish Idol çifti ve *Thunnus pelagicus* pelajik yüzücü).
  - **Deniz Canlıları (`ocean-creatures.ts`):** Rajiform 3B kanat çırpan Dev Okyanus Manta Vatozu (*Mobula birostris* — sefalik loblar, solungaç yarıkları, kanat ucu girdap izleri), asimetrik jet itkiyle nabız gibi kasılan 3B Yarı-Saydam Denizanaları (*Chrysaora noctiluca* — 16 radyal şemsiye kaburgası, 4 fırfırlı oral kol, 8 faz gecikmeli dokunaç), altıgen sırt plakaları (*scutes*) tek tek 3B Phong aydınlatmalı Yeşil Deniz Kaplumbağası (*Chelonia mydas*), yükselen mikro hava kabarcıkları ve hacimsel güneş ışık sütunları.
- `ocean-renderer.ts` 3B sırt-karın zıt renklenmesi (countershading), dikişsiz Phong/Fresnel dörtgen yüzey yamaları ve blueprint lider etiketleri kullanır. `data-whale-protect` ve `data-whale-card` ile işaretli kart/arama/başlık bölgeleri 4 kademeli eşmerkezli optik tüy (feather) maskesiyle yumuşakça sönümlenir.
- DPR tavanı 1.75; çizim tavanı geniş masaüstünde 60, dar masaüstünde 30 FPS'dir. Gizli sekmede RAF durur. Kapatma/açma kübik easing ile yumuşak geçiş yapar. `prefers-reduced-motion` sahneyi statik mimari kompozisyonda gösterir.
- Doğrulama: `tests/site-audit/whale-ambient.spec.ts` gerçek tuval piksellerinde iki yan koridorun doluluğunu, kart maskesini, `Okyanus Yaşamı` butonunun açma/kapama/kalıcılık davranışını, balinanın kesin yokluğunu, mobilde yokluğu ve masaüstü/dar ekran geçişini kontrol eder.

## 4. Yeni Belge Ekleme Adım Adım İş Akışı

Sisteme 4. veya yeni bir belge şablonu ekleneceği zaman izlenecek adımlar:

### Adım 1: PDF Şablonunu Hazırlama ve Temizleme
1. Belgenin doldurulabilir AcroForm alanlarına sahip resmi PDF dosyasını `public/belgeler/[belge-adi].pdf` olarak kaydedin.
2. `scripts/inspect-pdf-fields.mjs` benzeri bir script çalıştırarak PDF içindeki alan isimlerini (`fieldName`), `DA`, `AP` ve `DV` durumlarını analiz edin. Varsa gömülü çakışan metinleri temizleyin.

### Adım 2: `src/lib/pdf-engine.ts` Entegrasyonu
1. Belgeye ait TypeScript veri arayüzünü tanımlayın:
   ```ts
   export interface YeniBelgeData {
     alan_1?: string;
     alan_2?: string;
   }
   ```
2. Varsayılan örnek verileri `YENI_BELGE_DEFAULT_DATA` olarak tanımlayın.
3. Her alanın font boyutu, kalınlığı (`bold: true/false`) ve hizalamasını (`q: 0 | 1 | 2`) `YENI_BELGE_FIELD_SPECS` içinde belirtin.
4. `getPdfTemplateBytes` haritasına yeni belgeyi ekleyin.
5. `generateYeniBelgePdf` ve `downloadFilledYeniBelgePdf` fonksiyonlarını export edin.

### Adım 3: `src/lib/documents-data.ts` Kataloğuna Ekleme
`DOCUMENTS` dizisine yeni belge kaydını ekleyin:
- `id`, `slug`, `title`, `subtitle`, `category`, `description`, `fields`, `studioUrl`, `downloadUrl`, `tags` vb.

### Adım 4: Şablon Servis Endpoint'i (`src/app/api/document-template/[id]/route.ts`)
Yeni belgenin `id` değerini rota eşleştirmesine ekleyin, böylece istemci şablon byte'larını güvenle çekebilir.

Vercel serverless çıktısında bu endpoint dosyaları `fs` ile okuduğundan, dinamik dosya yolunu output tracing kendi başına bulamayabilir. `next.config.ts` içindeki `outputFileTracingIncludes` kuralı `public/belgeler/*.pdf` dosyalarını yalnız bu route'un fonksiyon paketine ekler; bu kural yoksa API `File not found on disk` 404 döndürür. İstemci PDF motorundaki statik PDF fallback'i bu endpoint'ten bağımsız olarak korunur.

### Adım 5: Stüdyo Bileşeni Oluşturma (`src/components/[belge]-studio.tsx`)
`beton-dokum-studio.tsx` veya `istifa-studio.tsx` bileşenini referans alarak:
- Form kontrolleri, canlı Canvas senkronizasyonu, zoom kontrolleri, yerel sıfırlama butonları ve mobil tab yapısını kurun.

### Adım 6: Sayfa Rotalarını Bağlama
1. `src/app/belgeler/[belge-slug]/page.tsx` rotasını oluşturup stüdyo bileşenini yerleştirin; sayfa başlığı ve katalog dönüşü için `BelgeStudioPageShell` kullanın.
2. Yeni rotayı `src/lib/belge-studio-routes.ts` içindeki tam rota listesine ekleyin ve `src/lib/documents-data.ts` kaydındaki katalog bağlantısını aynı rotaya yönlendirin.
3. Katalogda modal önizleme mevcut değildir. Modal giriş noktası ürün gereksinimiyle ayrıca eklenmedikçe `StudioPreview` bağlaması varsaymayın.

---

## 5. Doğrulama ve Test Kontrol Listesi

Yeni bir belge eklendiğinde veya mevcut belge düzenlendiğinde şu kontroller yapılmadan iş tamamlanmış sayılmaz:

- [ ] **Temizle Testi:** "Temizle" butonuna basıldığında PDF üzerinde hiçbir hayalet harf, nokta veya leke kalmadığı doğrulandı mı?
- [ ] **Font Ağırlığı Kontrolü:** Gövde metinlerinin Regular (ince), başlıkların Bold olduğu doğrulandı mı?
- [ ] **Zoom Testi:** Zoom butonları ve `Ctrl + Mouse Wheel` ile yakınlaştırma yapıldığında sayfanın kasmadığı ve "Derleniyor" ekranına düşmediği görüldü mü?
- [ ] **Yerel Sıfırlama:** Değiştirilen her alanın yanında `↺ Sıfırla` butonunun çıktığı ve basılınca eski haline döndüğü test edildi mi?
- [ ] **Sıfır Dış Kaydırma:** Masaüstünde tarayıcı dış kaydırma çubuğunun çıkmadığı (`100vh fit`) teyit edildi mi?
- [ ] **Mobil Görünüm:** 375px mobil genişlikte tab geçişinin ve PDF önizlemesinin kusursuz çalıştığı görüldü mü?
- [ ] **Build Kontrolü:** `npm run build` komutunun 0 hata ile başarıyla tamamlandığı doğrulandı mı?

---

## 6. 16 Ekim 2026 Kapsamlı Denetim & Sağlamlaştırma Notları

2026-10-16 tarihinde yürütülen 15 aşamalı kapsamlı stüdyo ve motor denetiminde sisteme eklenen mimari güvenceler:

1. **Erişilebilirlik ve Kontrast Standardı (WCAG AA):**
   - Vurgulu eylem butonlarında (`PDF İndir`) ve "Derleniyor" durum rozetlerinde açık tema zemininde kontrast yetersizliği (`amber-600` ~3.2:1) giderilmiş, `border-amber-700 bg-amber-700 text-white` (5.10:1) ile WCAG AA standardı eksiksiz sağlanmıştır.
   - Toolbar üzerindeki kontroller `role="toolbar"`, tema switch'i `role="switch"`, durum bildirimleri `role="status"` ve `aria-live="polite"` standartlarına bağlanmıştır.
2. **Sıfır PII Ağ Sızıntısı (Gizlilik ve KVKK/GDPR Uyumu):**
   - Kullanıcının form alanlarına girdiği hiçbir hassas veri (T.C. Kimlik No, Ad Soyad, Tebligat Adresi, Telefon Numarası, YİBF No) sunucuya, harici bir API'ye veya telemetri servisine iletilmez.
   - Ağ seviyesinde (Playwright route interception) denetlenmiş olup PDF üretimi %100 yerel tarayıcı belleğinde (`pdf-lib`) gerçekleşmektedir.
3. **Canvas Raster Bütçesi ve Bellek Tavanı (OOM Koruması):**
   - Retina ve yüksek DPI ekranlarda (`dpr: 2`, `dpr: 3`) canvas bellek patlamalarını önlemek için `BELGE_PREVIEW_MAX_RASTER_PIXELS = 8_000_000` (8M px) ve `BELGE_PREVIEW_MAX_RASTER_SIDE = 4096` px tavanı zorunludur.
4. **Çizim İptali ve Blob Temizliği Yaşam Döngüsü:**
   - Yeni bir form revision üretildiğinde eski Blob URL anında `URL.revokeObjectURL(previousUrl)` ile serbest bırakılır.
   - Hızlı ardışık çizimlerde (form/PDF görünümü geçişi, zoom, sayfa çevirme) önceki PDF.js `renderTask.cancel()` çağrılarak paralel/çakışan çizimler engellenir; bileşen unmount olduğunda `loadingTask.destroy()` çağrılır.

---

## 7. PDF Önizleme Üzerinde Doğrudan Düzenleme Katmanı (Inline Edit Layer)

2026-10-17 tarihinde sisteme kazandırılan opt-in canlı PDF düzenleme katmanının mimari sözleşmesi:

1. **Varsayılan OFF & Sıfır DOM Sızıntısı:**
   - Özellik varsayılan olarak kapalıdır (`isInlineEditingActive = false`).
   - Kapalı modda katman unmounted kalır, fazladan hiçbir DOM düğümü, listener veya annotation fetch işlemi üretmez (baseline eşdeğerliği).
2. **Korumalı Motor & Tek Gerçek Kaynak:**
   - Sol formdaki `formData` tek gerçek kaynaktır (single source of truth).
   - `pdf-engine.ts`, şablon PDF binary'leri ve `useBelgeStudioDocument` hook'u değiştirilmeden korunmuştur.
3. **İzole Taslak (Draft) Popover & Tek Onay:**
   - Hotspot tıklandığında veya mobilde kısa-tap (≤8px hareket, <500ms) yapıldığında izole popover açılır.
   - Yazılan her karakter yerel draft state'inde tutulur; "Uygula" denene kadar `formData` mutasyona uğramaz (0 ara derleme).
   - "Vazgeç", Escape veya dışarı tıklama taslağı sıfır veri kaybı veya yan etkiyle iptal eder.
4. **Mobil Web ve Gesture İzolasyonu:**
   - Mevcut pan, pinch ve zoom motoruna dokunulmamış; iki parmakla yakınlaştırma veya kaydırma sırasında katman otomatik olarak geçici pasif kalır.
   - 320px ultra-dar ekranlardan 1920px masaüstüne kadar sıfır yatay taşma (`scrollWidth <= innerWidth + 2`) ve 44px dokunmatik hedef standardı sağlanmıştır.

---

## 8. Saf Alan Rehberi ve Semantik Kalite Politikası (Field Guidance & Quality Engine)

2026-10-17 tarihinde sisteme entegre edilen semantik alan rehberliği ve format değerlendirme mimarisi:

1. **56/56 Alan Semantik Tipi ve Kural Defteri (`DOCUMENT_FIELD_POLICIES`):**
   - **F (Takvim Tarihi):** `GG.AA.YYYY`, `GG/AA/YYYY` formatı ve artık yıl (leap year) kontrolü (29 Şubat 2024 geçerli; artık yıl olmayan 2025/2026 ve 31 çeken 30 günlük aylar uyarılır).
   - **K (T.C. Kimlik No):** 11 hane, ilk hane 0 olamaz, 10. ve 11. hane algoritmik kontrol basamağı doğrulaması.
   - **T (Telefon):** 10 haneli ulusal (5XX...), 11 haneli (05XX...), 12 haneli (+90...) ve `Tel:` önekli biçimler geçerlidir.
   - **Y (YİBF No):** 7 haneli sistem kodları için yumuşak öneri (info); özel formatlar silinmez/engellenmez.
   - **P (Ücret / Para):** Türkçe para formatı (`40.000,00 TL`, `40000`, `40.000 TL`); negatif tutarlar ve çoklu virgül uyarılır.
   - **N (Nominal / Serbest Metin):** Kurum, kişi, unvan, ada, parsel gibi serbest metin alanlarında kısıtlayıcı regex veya keyfî biçim uyarısı **kesinlikle üretilmez** (sıfır yanlış alarm).
2. **Kullanıcı Yazarken Rahatsız Etmeme (TCKN Özel Davranışı):**
   - Kullanıcı TCKN yazarken henüz 11 haneyi tamamlamadan erken hata veya kontrol basamağı uyarısı verilmez.
   - Uyarı yalnız odak kaybı (`blur` / `isTouched`) veya onay (`isBlurOrSubmitted`) anında nazikçe gösterilir.
3. **Erişilebilirlik ve Çift Uyarı Koruması:**
   - Rehberlik mesajları `role="status"` ve `aria-live="polite"` erişilebilirlik öznitelikleriyle `BelgeFieldGuidanceView` üzerinden sunulur.
   - `BelgeFieldLengthWarnings` üst paneline `excludedFields` desteği eklenmiş olup, satır içi rehberliği olan alanlar üst özetten dışlanarak çift uyarı (duplicate warning) tamamen önlenmiştir.
4. **Sıfır İşlem Engellemesi (Kritik İlke):**
   - Hiçbir format veya rehberlik mesajı `Uygula`, `PDF İndir`, `Yazdır`, `Temizle`, `Sıfırla` veya `Geri Al` butonlarını devre dışı bırakmaz.
   - Kullanıcı girdisi asla otomatik olarak kesilmez, kısaltılmaz veya engellenmez.

---

## 9. Fiziksel PDF Baskı Okunabilirlik Motoru ve Şablon İyileştirmesi (Readability & AcroForm)

1. **Çalışma Zamanı Yüksüz Baskı Riski Öngörüsü (`assessFieldReadability`):**
   - Runtime'da her tuş vuruşunda pahalı PDF parse/canvas render maliyeti üretilmez.
   - Güncel sistemde geometri alan profillerinden türetilir; karakter sayısına dayalı offline tahmin kullanılmaz. Aynı PDF üretimindeki gerçek çizim raporundan `none`, `possible`, `serious` hesaplanır; güncel ölçüm henüz yoksa `unknown` döner. Ayrıntılar: Bölüm 2.5.
2. **Şantiye Şefi İstifa Dilekçesi Adres Alanı Fiziksel İyileştirmesi (`ASAMA_06B`):**
   - **Sorun:** Orijinal şablonda `adres_deger` alanı 192 × 18 pt dar tek satır idi ve uzun adreslerde yazı boyutu ~1.26 pt'ye kadar küçülüyordu.
   - **Kontrollü İstisna Çözümü:** Kullanıcı onayıyla `public/belgeler/santiye-sefi-istifa-dilekcesi.pdf` şablonundaki AcroForm widget'ı güvenli boşluk bölgesine doğru **225.0 × 36.0 pt** boyutuna genişletildi ve `Ff` bayrağına çok satırlılık biti (`multiline: true`, `4096`) eklendi.
   - **Ölçülebilir Başarı:** 84 ve 122 karakterlik uzun adreslerde nominal 8.0 pt font tam korundu (%100-%166 font büyümesi); 212 karakterlik ekstrem adreste font 7.0 pt seviyesinde tutuldu (%418 iyileşme).
   - **Kriptografik SHA-256 Sürüm Kaydı:**
     - Baseline v1 Hash: `3132D5617DF0AEF1366B1B680F385762743AE05375BE7F5EB5653F2A6915D83E`
     - Güncel v2 Hash: `95C0AA38DECBFBA0C4E61C3F1D99956F2D3BDD057EBC307C728D2527459F74DC`
     - Diğer 4 şablon orijinal baseline hash değerleriyle birebir korunmuştur.
3. **Sıfır Veri Kaybı Sözleşmesi (0 Silent Truncation):**
   - 220+ karakterlik adresler dahil hiçbir kullanıcı verisi sistem tarafından sessizce budanmaz veya kesilmez.
   - Alan değerinin saklanmasına ek olarak güncel kabul testleri gerçek glif sınırlarını ve görünür taşmayı denetler. Çok sayıda satır ve 1.000 karakterlik bölünmeyen metin de sınanır; fiziksel olarak küçük kalan yazıda baskı uyarısı verilir.

---

## 10. Geri Alma, Hata Toleransı ve Rollback Güvencesi

Olası bir regresyon veya geri alma durumunda:
- **Şablon Geri Alma:** İstifa dilekçesi orijinal tek satırlı baseline'a (`3132D561...`) döndürülmek istenirse `git checkout 14235bd4ff86f6d03f3a575d4650596cef57206e -- public/belgeler/santiye-sefi-istifa-dilekcesi.pdf` komutuyla tek işlemde restore edilebilir; `assessFieldReadability` ve inline layer yeni koordinatları dinamik okuduğu için sistem çökmez.
- **Opt-in İzolasyon:** Inline edit katmanı varsayılan olarak OFF olduğundan arayüzde herhangi bir bileşen hatası durumunda `isInlineEditingActive = false` bırakılarak standart baseline stüdyo deneyimi %100 kesintisiz devam eder.
- **Çekirdek Doğrulaması:** Inline edit çalışmasında çekirdek dosyalar korunmuştur. 18 Ekim 2026 punto/hiza düzeltmesi `pdf-engine.ts` içinde yapılmıştır; alan değerleri, kaynak sayfa içerikleri ve çizilmiş PDF taban hizası regresyon testleriyle doğrulanır. `use-belge-studio-document.ts` ve `document-field-contracts.ts` davranışları korunur.

---

## Mobil PDF Üzerinde Düzenleme (alt sayfa editör)

- 1023px ve altı ekranlarda "PDF Üzerinde Düzenle" seçili alanı popover yerine `document.body`'ye portal edilen non-modal alt sayfada (`src/components/belge-inline-edit-sheet.tsx`) düzenler. Masaüstü popover davranışı değişmez.
- Taslak, çakışma koruması ve tek-commit mantığı `src/hooks/use-belge-inline-draft.ts` içinde ortaktır.
- Dokunma hit-test'i `findInlineFieldAtPoint` (44px hedefe tamamlayan en fazla 14px tolerans), gezinme sırası `orderInlineFields`, klavye boşluğu `computeKeyboardInset`, otomatik kaydırma `getInlineFieldRevealDelta` (`src/lib/belge-inline-mobile.ts`).
- Alt sayfa açıkken önizleme fit ölçüsü dondurulur; klavye önizlemeyi yeniden ölçeklemez. Kirli taslak başka alana dokunma, sayfa değiştirme ve aşağı kaydırma ile silinmez.
- Kabul: `npx tsx --test tests/belgeler/inline-mobile.test.ts` ve `npm run check:belgeler-inline-mobile`.

---

## 11. Form Alanı Odak Vurgusu ↔ Canlı PDF Önizleme Eşleşmesi (Field Focus Highlight)

- **Temel Mimari:** Kullanıcı soldaki stüdyo formundaki bir alana (input, textarea, select) odaklandığında (`focusin`), sağdaki canlı PDF önizleme tuvali üzerinde ilgili AcroForm alanının koordinatlarına `BelgeStudioFieldFocusLayer` üzerinden saf bir DOM overlay çerçevesi yerleşir. Odak değişimi PDF üretmez; aynı sayfadaki alan değişimi canvas çizimi de üretmez. Başka sayfadaki alan seçilirse hedef sayfanın çizilmesi normaldir.
- **56/56 Alan Sözleşmesi:** Beş stüdyonun tamamında (`beton-dokum-tutanagi`, `insaat-ruhsati-dilekcesi`, `santiye-sefi-istifa-dilekcesi`, `santiye-sefi-sozlesmesi`, `santiye-sefi-taahhutnamesi`) `DOCUMENT_EDITABLE_FIELDS` allowlist'indeki 56 alan birebir `src/lib/belge-field-focus.ts` içinde DOM ID'leri ile eşlenmiştir. İstifa dilekçesindeki salt okunur (PDF-only) etiket alanları (`adres_etiket`, `tc_etiket`, `iletisim_etiket`) dışlanmıştır ve asla sahte vurgu üretmez.
- **Geometri Çıkarma, Hata Kurtarma ve Önbellekleme:** `extractFieldFocusRects`, widget koordinatlarını normalize eder ve sayfa sınırlarıyla gerçek kesişimini alır; belirsiz duplicate alanlar elenir. Önbellek stüdyo oturumuna aittir; belge ID'si değişince temizlenir. Yalnız allowlist'in tamamı bulunursa sonuç kalıcı başarıdır; kısmi sonuçta doğrulanmış alanlar gösterilebilir. Geçici hatada hemen bir ek deneme yapılır (toplam en fazla iki başarısız çıkarım); sonraki veri revizyonları bu bütçeyi yenilemez. Yeni PDF eski, iptal edilmiş annotation isteğini beklemez; stale sonuç güncel state/cache'i değiştiremez. Beş belgenin kısa/uzun içerikle ayrı üretilmiş PDF'leri sabit widget geometrisini test eder. Sağlam cache yolunda zoom, resize ve veri yazımı annotation taraması tekrarlamaz.
- **Klavye, İptal ve Temizleme Protokolü:** `Escape` tuşuna basıldığında, form sıfırlandığında veya temizlendiğinde `CLEAR_SELECTION` eylemi tetiklenir ve benzersiz bir `clearEventId` üretilir. `BelgeStudioPdfPreview` bileşenine aktarılan `onClearFieldFocus={clearFieldFocus}` prop kontratı ile önizleme katmanındaki aktif mobil vurgu, 2.5 sn zamanlayıcısı ve tüm bekleyen reveal işleri anında iptal edilir; gecikmiş render'ların vurguyu yeniden parlatması engellenir.
- **Çok Sayfalı Gezinti ve Kullanıcı Tercihi:** Sayfa 2'de yer alan bir form alanına odaklanıldığında önizleme otomatik ve kontrollü olarak 2. sayfaya geçer (`handlePageChange`) ve alan görünür değilse `getInlineFieldRevealDelta` ile minimal pürüzsüz kaydırma (`smooth reveal`) uygular. Kullanıcı önizlemede elle sayfa değiştirdiğinde (`userManualPageChoiceRef`) bu tercih aynı odak kapsamında korunur; formda yeni bir alana odaklanıldığında hedef sayfa tercihi otomatik olarak güncellenir.
- **Mobil 2.5 sn Yaşam Döngüsü ve Görünür Tuval Kontratı:** Mobil ekranda kullanıcı form sekmesinde bir alana odaklanıp "Canlı PDF Önizle" sekmesine geçtiğinde, sayaç yükleme/hata/sayfa uyuşmazlığı bittikten ve doğru tuval çizildikten sonra başlar. Vurgu 2.5 saniye sonra söner. Forma dönüş timer'ı iptal eder; yeni gerçek alan odağı olmadan tekrar önizlemeye dönmek tüketilmiş seçimi yeniden parlatmaz. İptal kimliği yeni alan seçimlerinde korunur; sonraki iptalde monoton artar.
- **İzolasyon ve Karşılıklı Dışlama:** "PDF Üzerinde Düzenle" (inline edit) modu açıkken form rehberi tamamen gizlenir; amber düzenleme hotspot'u ile mavi form çerçevesi asla çakışmaz. Inline edit kapatıldığında eski odak otomatik açılmaz (`suppressedFocusEventIdRef`), kullanıcının yeni bir alana tıklaması gerekir.
- **Yoğun Satır Geometrisi:** Taahhütname ve Sözleşme gibi kompakt metin bloklarında `1.5px` box-shadow ve `scale(1.005)` mikro animasyon kullanılır. `prefers-reduced-motion` altında animasyon ve yumuşak kaydırma kapanır. Form rehberi yüksek DPR, %50/%100/%200/%400 zoom, tema ve forced-colors ile test edilir. Zoom sınırında odaklı düğmenin disabled olması seçimi silmez.
- **Yeni Şablon Ekleme Kontratı:** Yeni bir belge stüdyosu eklendiğinde `DOCUMENT_EDITABLE_FIELDS` içerisine alanlar kaydedilir, form bileşeninde `useBelgeFieldFocus` hook'u başlatılır ve `BelgeStudioPdfPreview` bileşenine `fieldFocus={fieldFocus}` ve `onClearFieldFocus={clearFieldFocus}` aktarılır.
- **Test ve Doğrulama Komutları:**
  - Saf Geometri ve State Makinesi Birim Testleri: `npx tsx --test tests/belgeler/field-focus.test.ts`
  - Kırmızı/Yeşil Repro Doğrulama Testi: `npx tsx --test tests/belgeler/field-focus-repro.test.ts`
  - Canlı Smoke Doğrulama Scripti: `node scripts/verify-field-focus-live-smoke.mjs`
  - Çoklu Çözünürlük ve Görsel Odak E2E Paketi: `npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-field-focus.spec.ts`
  - Gerçek lifecycle/fault-injection/touch regresyonları: `npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-field-focus-regressions.spec.ts --project=chromium-desktop-1366`
  - 56 alanın hizası statik koordinat kopyasıyla değil, önizlemenin üretilmiş PDF blob'undaki bağımsız PDF.js ölçümüyle dört eksende ≤2 CSS px toleransla doğrulanır. Beklenmeyen tarayıcı/HTTP hataları odak testlerini düşürür.
  - Yerel smoke için `SMOKE_URL` kullanılabilir; `SMOKE_EVIDENCE_DIR` ile production ekran görüntülerinin üzerine yazılması önlenir. Script süre sınırı, nonzero hata çıkışı ve tarayıcı cleanup'ı uygular.
  - PDF Motoru ve Görsel Koruma Paketi: `npm run check:belgeler-pdf`

---

## 12. Belge Stüdyosu UX v3: Akıllı Bölümler, İzinli Otomatik Taslak ve PDF Odak Modu (23 Ekim 2026)

2026-10-23 tarihinde beş stüdyoya (`beton-dokum-tutanagi`, `insaat-ruhsati-dilekcesi`, `santiye-sefi-istifa-dilekcesi`, `santiye-sefi-sozlesmesi`, `santiye-sefi-taahhutnamesi`) entegre edilen ve F01–F20 denetim düzeltmeleriyle sağlamlaştırılan üç temel kullanıcı deneyimi geliştirmesi ve mimari sözleşmesi:

### 12.1. Akıllı Bölümler (Smart Accordion & Dolu Sayaçları)
- **56/56 Alan Eşleştirmesi:** `DOCUMENT_EDITABLE_FIELDS` sözleşmesindeki 56 alanın tamamı `src/lib/belge-studio-sections.ts` içinde (`BELGE_STUDIO_SECTIONS`) tam olarak tek bir bölüme haritalanmıştır. İstifa Dilekçesi'ndeki salt okunur PDF-only etiket alanları (`adres_etiket`, `tc_etiket`, `iletisim_etiket`) bölümlere sızdırılmaz.
- **Erişilebilir WAI-ARIA Başlıklar:** Tüm bölüm başlıkları `<h3><button>` yapısında, `aria-expanded` ve `aria-controls` özniteliklerine sahiptir. Başlıklar minimum 44px dokunma alanına (`min-h-[44px]`), belirgin `focus-visible:ring-2` halkasına ve animasyonsuz ikon yönüne sahiptir. Kapalı bölümler CSS `hidden` (`display: none`) ile gizlenir; form imleci (caret) veya Tab gezintisi gizli alanlara girmez.
- **Dolu Alan Sayaçları:** Her bölümde `${filledCount}/${totalCount} dolu` formatında ve ekran okuyucu uyumlu (`${filledCount} / ${totalCount} alan dolu`) anlık sayaç gösterilir. Sayım salt `value.trim().length > 0` kuralına dayanır; validasyon iddiası taşımaz.
- **Tümünü Aç / Diğerlerini Kapat (`closeOthers` Sözleşmesi):** `BelgeStudioSectionMasterControls` ile tek tıkla tüm bölümler açılabilir (`openAll`) veya aktif/seçilen bölüm açık tutularak diğerleri kapatılabilir (`closeOthers`). Bu ana eylem en az bir bölümü açık bırakır; başlıktan tek tek kapatma serbesttir.
- **Kalıcı Bölüm Tercihleri ve Şema Güvenliği:** Kapalı bölüm ID'leri `belgeler:ux:sections:v1:${documentId}` anahtarıyla `{ version: 1, closedSectionIds: [...] }` zarfı içinde `localStorage`'da saklanır. Tanımsız veya başka belgenin ID'leri allowlist ile ayıklanır; eski dizi formatındaki kayıtlar güvenle versiyon 1'e migrate edilir.
- **PDF Alan Odağında Geçici Bölüm Açma (`revealField`):** Programatik alan erişimi gerektiğinde `revealField` ilgili bölümü açar; PDF üzerinden ters navigasyon varsayılmaz. Bu yolda ilgili bölüm geçici olarak açılır; ancak kullanıcının kalıcı `localStorage` tercihleri asla ezilmez.
- **İnşaat Ruhsatı Başlık Numaralandırması:** Bölüm başlıkları 1, 2, 3, 4 olarak tutarlı ve hiyerarşik yapılandırılmıştır.

### 12.2. İzinli ve Dayanıklı Otomatik Taslak Kaydetme (Auto-Draft)
- **Sıfır PII Başlangıç İlkesi:** Kullanıcı açıkça onay vermeden (aktif kayıt izni olmadan), tarayıcı depolamasına hiçbir kullanıcı verisi yazılmaz. İlk form düzenlemesinde nazik izin şeridi (`BelgeStudioDraftControls`) belirir.
- **Cihaz ve Sekme İzolasyonu:**
  - `device`: `localStorage` üzerinde `belgeler:ux:draft:device:v1:${documentId}` anahtarıyla kalıcı saklama.
  - `session`: `sessionStorage` üzerinde `belgeler:ux:draft:session:v1:${documentId}` anahtarıyla yalnız mevcut sekmede saklama.
  - `none`: Ret/kapama `dismissed` kararıyla tutulur. Sekme tercihi `belgeler:ux:draft-consent:session:v1`, cihaz tercihi `belgeler:ux:draft-consent:device:v1` kullanır. Açık sekme seçimi önceliklidir; bir başka sekme izin vererek bunu değiştiremez.
  - Cihaz ve sekme storage/broadcast kanalları ayrıştırılmıştır; harici olaylar sekme modunu ezemez.
- **800ms Debounce & Tek Snapshot:** Kullanıcı tuş vuruşları 800ms duraksadıktan sonra tek bir atomik snapshot olarak kaydedilir; gereksiz disk I/O ve PDF derlemesi engellenir.
- **Fail-Closed Güvenlik ve Boyut Sınırları:**
  - 64 KiB tavan boyut sınırı (JSON ayrıştırma öncesi UTF-8 bayt kontrolü ile büyük veri enjeksiyonu ve çökme engellenir; aşırı büyük veya bozuk kayıtlar sessizce silinmez, fail-closed korunur).
  - Şema parmak izi (`fieldSchemaFingerprint`) ile alan sayısı ve şema uyuşmazlığında bozuk taslak reddi.
  - 30 gün yaş uyarısı (kullanıcıya eski taslak uyarısı verir fakat veriyi asla sessizce silmez).
  - Prototip zinciri ve `__proto__`, `constructor` kirliliği koruması.
- **Kontrollü Geri Yükleme (Restore) ve Sahte Çakışma Önleme:**
  - Sayfa yenilendiğinde taslak sessizce forma yazılmaz. Kullanıcıya `BelgeStudioDraftControls` sunulur:
    - "Taslağı Yükle": Tek snapshot olarak forma aktarır, kabul edilmiş ham kayıt sürümünü izleyerek reload sonrası sahte çakışmayı engeller ve PDF'yi günceller.
    - "Şimdilik Kapat": Kararı saklar, kaydı duraklatır; menüden karar tekrar açılabilir. "Bu Formla Devam Et": Açık ikinci onayla güncel kayıt sürümü kontrol edilir ve mevcut form kaydedilir. Onay iptal edilirse değerler değişmez.
    - "Taslağı Sil": Depodaki taslağı doğrulamalı siler, dirilme bayrağını kilitler ve form değerlerini değiştirmez.
- **Onay Kapıları (Confirmation Guards):** Beş stüdyonun tamamında "Temizle", "Sıfırla" ve Ruhsat "Rastgele Doldur" eylemleri `window.confirm` onay kapısıyla korunur. Kullanıcı iptal ettiğinde form verileri, undo geçmişi ve odak durumu eksiksiz korunur.
- **Tekil ve Kalıcı Durum Rozeti (`belge-studio-top-header`):**
  - Çift rozet yerleşimi kaldırılmış; beş stüdyoda formun ve PDF'in üstündeki ortak `data-testid="belge-studio-top-header"` şeridine taşınmıştır.
  - Rozet masaüstü, mobil (320px/390px) ve PDF odak modunda tekil, görünür ve tam erişilebilirdir.
  - Kapalı modda (none) 'Taslak (Kapalı)' gösterir; açılır menüden cihaz/sekme açma, duraklatma, kalıcı kapatma ve taslak silme yönetilir.
  - Kayıt duraklatıldığında (`isPaused === true`), kaydedildi durumunun önünde öncelikli olarak 'Kayıt Duraklatıldı' gösterilir.
- **Çoklu Sekme ve Yaşam Döngüsü:**
  - `BroadcastChannel` ve `storage` event'leri ile sekmeler arası çakışma tespiti (`BelgeStudioDraftControls`).
  - "Bu Sekmedekiyle Devam Et" açık onayından sonra güncel kayıt yeniden karşılaştırılır. Device modunda Web Locks read-check-write ve silmeyi aynı belge anahtarında sıralar. Kilit desteği yoksa yeniden okuma/conflict durdurması vardır; mutlak atomiklik iddiası yoktur.
  - Taslak silindiğinde dirty/generation kapısı sıfırlanarak silinmiş taslağın dirilmesi (`resurrection`) engellenir.
  - SPA unmount anında (`next/link` geçişleri) yalnız izinli, kararı çözülmüş ve çakışmasız dirty form için best-effort flush denenir; tarayıcı kapanışında kalıcılık garantisi verilmez.

### 12.3. Masaüstü PDF Odak Modu (Desktop PDF Focus Mode)
- **Masaüstü Özel (`lg >= 1024px`):** `useSyncExternalStore` ile SSR-safe masaüstü algılama. `< 1024px` mobilde buton görünmez.
- **Hata Kurtarma (Error Recovery - F11):** PDF üretim hatasında (`visibleError`), yükleme durumunda (`generationPending`) veya eksik snapshot durumunda layout toggle butonu ("Formu Göster" / "PDF Odak Modu") **asla kilitlenmez**. Kullanıcı hatalı PDF durumunda bile güvenle form görünümüne geri dönebilir.
- **CSS Tabanlı Sıfır Unmount:** Form paneli unmount edilmez; `pdfFocus.isPdfFocus ? 'hidden' : ...` ile CSS görünürlüğü yönetilir. Sağ PDF paneli `w-full` tam genişlik alır.
- **State ve Odak Restorasyonu:**
  - Odak moduna geçerken formun `scrollTop` değeri ve `document focusin` ile izlenen aktif girdi ID'si saklanır.
  - Çıkış yapıldığında `scrollTop` ve aktif girdi odağı güvenle geri yüklenir.
- **1280 → 900 → 1280 Sıfırlanma Güvencesi:** Ekran boyutu 1024px altına çekildiğinde odak modu otomatik sıfırlanır; ekran tekrar 1024px üzerine çıktığında kullanıcı tıklamadan odak modu otomatik açılmaz.
- **Sıfır PDF Yeniden Derlemesi:** Odak modu geçişi sırasında yeni `formData` mutasyonu veya PDF byte üretimi yapılmaz; mevcut `blobUrl` stabil kalır.

### 12.4. Feature Flag Mimarisi ve Geri Alma Güvencesi
- `src/lib/belge-ux-config.ts` altındaki `BELGE_UX_FLAGS` (`ACCORDION`, `DRAFT`, `FOCUS_MODE`) üretim davranışına bağlanmıştır:
  - `FOCUS_MODE: false`: Odak butonu gizlenir, `isPdfFocus` daima false kalır; form daima erişilebilirdir.
  - `ACCORDION: false`: Tüm bölümler daima açık tutulur (`isSectionOpen === true`), ana kontroller ve oklar gizlenir; form klasik düz form olarak çalışır.
  - `DRAFT: false`: Dinleyiciler, debounce zamanlayıcıları ve izin şeridi devre dışı kalır; depoya yazma yapılmaz ve **depodaki mevcut taslaklar ASLA silinmez**.

### 12.5. Yeni Belge Eklerken Entegrasyon Protokolü
Yeni bir resmi evrak stüdyosu sisteme eklenirken şu sıra izlenmelidir:
1. `src/lib/belge-studio-sections.ts`: Belge kimliğini `BELGE_STUDIO_SECTIONS` içerisine ekleyin ve tüm 56 alan sözleşmesini eksiksiz gruplayın.
2. `src/components/[belge]-studio.tsx`:
   - `const sectionsApi = useBelgeStudioSections({ documentId, formData });`
   - `const draft = useBelgeAutoDraft({ documentId, formData, setFormData, initialData, setUndoData });`
   - `const pdfFocus = useBelgeStudioPdfFocus({ scrollContainerRef: formView.scrollContainerRef, isModal });`
3. JSX Katmanı:
   - Üst şerit: `<div data-testid="belge-studio-top-header">...<BelgeStudioDraftStatusBadge draftApi={draft} />...</div>`
   - Form konteynerine: `className={`${BELGE_STUDIO_FORM_SCROLL_CLASS} ${pdfFocus.isPdfFocus ? "hidden" : activeTabMobile === "form" ? "block" : "hidden lg:block"}`}`
   - Önizleme paneline: `pdfFocus={pdfFocus}` aktarın.
   - Karar şeridini panel dışına `<BelgeStudioDraftControls draftApi={draft} />`, bölüm kontrollerini form içine `<BelgeStudioSectionMasterControls sectionsApi={sectionsApi} />` ekleyin.

### 12.5. Test ve Doğrulama Komutları
- **Birim ve Depolama Çekirdeği:** `npx tsx --test tests/belgeler/*.test.ts`
- **PDF Motoru ve Görsel Doğrulama:** `npm run check:belgeler-pdf`
- **Mobil Düzenleme E2E:** `npm run check:belgeler-inline-mobile`
- **Akordeon E2E Paketi:** `npx playwright test tests/site-audit/belgeler-accordion-rollout.spec.ts --config=playwright.site.config.ts --project=chromium-desktop-1366`
- **Otomatik Taslak E2E Paketi:** `npx playwright test tests/site-audit/belgeler-auto-draft-rollout.spec.ts --config=playwright.site.config.ts --project=chromium-desktop-1366`
- **PDF Odak Modu E2E Paketi:** `npx playwright test tests/site-audit/belgeler-pdf-focus-mode.spec.ts --config=playwright.site.config.ts --project=chromium-desktop-1366`
- **Entegre UX ve Stres Paketi:** `npx playwright test tests/site-audit/belgeler-studio-ux.spec.ts --config=playwright.site.config.ts --project=chromium-desktop-1366`
- **Next.js Tip Denetimi:** `npx tsc -p tsconfig.next.json --noEmit --incremental false`
- **Üretim Derlemesi:** `npm run build`


### 12.6. Son bağımsız kabul

23 Ekim 2026 yerel kapanış kaydı: `docs/belgeler-ux-v3-duzeltme-2026-10-23/FINAL_AUDIT.md`. Gerçek hook lifecycle kabulü `belgeler-draft-final-regressions.spec.ts`; beş belgenin 56 alanı için storage/restore/preview/indirilen PDF zinciri `belgeler-draft-pdf-roundtrip.spec.ts` ile sınanır. Önceki D02–D05 simülasyon testleri gerçek hook kabulü yerine kullanılmaz. Form görünümünün sunum API'si (`BelgeStudioFormViewControls`) DOM ref'lerinden ayrıdır. Form gizliyken son geçerli fit state korunur.

Cihaz kaydı aynı tarayıcı profiline açıktır, şifreli değildir ve bulut senkronizasyonu yapmaz. Session kaydının kapanış/yeniden açılışta devamı tarayıcı davranışına bağlıdır; sekme klonlama güvenlik sınırı değildir. Build-time feature flag değişikliği yeni testli derleme gerektirir.

---

## 13. Akıllı Dosya Adı ve 90 Günlük Paylaşım Mimarisi (V3)

### 13.1. Standart Akıllı Dosya Adı Sözleşmesi
İndirilen PDF'lerin dosya adları `src/lib/belge-filename.ts` modülü tarafından üretilir:
- **Beton Döküm Tutanağı:** `Beton-Tutanagi_YIBF-1234567_2026-10-23.pdf`
- **Şantiye Şefi Taahhütnamesi:** `Taahhutname_Ad-Soyad_2026-10-23.pdf`
- **Şantiye Şefliği İstifa Dilekçesi:** `Istifa-Dilekcesi_Ad-Soyad_2026-10-23.pdf`
- **İnşaat Ruhsatı Başvuru Dilekçesi:** `Ruhsat-Dilekcesi_Ad-Soyad_2026-10-23.pdf`
- **Şantiye Şefliği Hizmet Sözleşmesi:** `Hizmet-Sozlesmesi_Santiye-Sefi_Muteahhit_2026-10-23.pdf`
- **Özellikler:** Türkçe karakterler ASCII eşdeğerlerine normalize edilir (`İ/ı → I/i`), path traversal ve geçersiz karakterler temizlenir, tarih formdan alınır (geçersizse güncel tarih kullanılır).

### 13.2. 90 Günlük Salt-Okunur Paylaşım Bağlantısı (`/b/[token]`)
- **Tek Eylem:** Stüdyolardaki `Paylaş` düğmesi modal açar. `Bağlantı oluştur` dendiğinde o anki form verileri dondurulur (frozen snapshot) ve sunucuya gönderilir.
- **Kapsam Dışı (Strict Exclusion):** WhatsApp, `wa.me`, `navigator.share`, QR kod veya e-posta paylaşım düğmeleri **KESİNLİKLE YOKTUR**. Yalnızca bağlantı üretilir ve panoya kopyalanır (`Bağlantıyı Kopyala`).
- **Görüntüleyici Ekranı (`/b/[token]`):**
  - Next.js root layout'undaki genel Navbar, Footer ve GlobalOverlays bileşenleri middleware üzerinden tespit edilen `x-pathname` başlığı ile DOM'dan tamamen çıkarılır (`isIsolatedViewer = true`).
  - Sayfa salt-okunur PDF.js canvas'ı ile render edilir.
  - Viewer lifecycle, mobil fit/zoom ve canvas bütçesi ASAMA_10 sözleşmesiyle aşağıdaki 13.11 bölümünde tanımlıdır. Belge metni için erişilebilir text layer bulunmaz.
  - İndir, yazdır ve form düzenleme kontrolleri bulunmaz; `Ctrl+P` ve `Ctrl+S` engellenir.
  - Meta etiketleri `noindex, nofollow, nocache`; OpenGraph başlığı anonimdir (kişisel veri içermez).

### 13.3. Güvenlik, Kota ve İptal Mekanizması
- **Sunucu Taraflı PDF Üretimi:** Anonim keyfî PDF byte upload'u yoktur. Sunucu yalnızca allowlist'te bulunan 56 form alanını içeren küçük JSON (azami 64 KiB) kabul eder ve `flatten: true` ile AcroForm alanları sıfırlanmış PDF üretir.
- **Kriptografik Token:** Yeni kayıtlar `requestId` başına değil, DB'de kalıcı 256-bit rastgele reservation nonce ve `BELGE_SHARE_TOKEN_KEY_VERSION` ile ayrılmış HMAC-SHA256 V2 token üretir. DB'de yalnız SHA-256 token hash'leri ve nonce saklanır. Eski token hash'leri değiştirilmez; anahtar sürümü kendiliğinden döndürülmez.
- **Kota Sınırları:** Aynı anonim tarayıcı için İstanbul takvim gününde 50 başarılı benzersiz yeni link. Aynı IP'deki ayrı tarayıcılar birbirinin hakkını tüketmez. `reserved` işlemler `used` başarıdan ayrıdır; 50 günlük başarı hakkı sonradan iptalle geri verilmez. Eski 3/15 dakika, 10/24 saat ve 20 aktif/IP engelleri normal akıştan çıkarılmıştır.
- **Fiziksel byte kapasitesi:** Her Blob PUT öncesi 3 MiB üst sınırı kadar byte yükümlülüğü ayrılır. `committed`, `deletion_pending` ve `unknown` yükümlülükleri silme doğrulanmadan kapasitede kalır. Üretimde `BELGE_SHARE_GLOBAL_DAILY_LIMIT` ve `BELGE_SHARE_GLOBAL_MAX_STORAGE_BYTES` açıkça kapasite değerlendirmesiyle ayarlanır; eksik/bozuk sınır production'da 503 ile fail-closed olur. Yerel 200/gün ve 1 GiB değerleri yalnız test varsayımıdır, üretim kapasite kararı değildir.
- **İptal (Revocation):** Oluşturan cihazın tarayıcısında saklanan `manageToken` ile `DELETE /api/belgeler/paylasim/[token]` rotası üzerinden bağlantı anında iptal edilebilir. İptal anında veritabanında `status = 'revoked'` yapılır ve `/b/[token]` derhal HTTP 410 döndürür.

### 13.4. Depolama İzolasyonu ve Otomatik Temizlik (Cron)
- **Özel Blob Depolama:** `belge_paylasim/` önekiyle Vercel Private Blob üzerinde tutulur. Doğrudan genel URL verilmez; stream yalnız `/api/belgeler/paylasim/[token]/pdf` üzerinden sunulur.
- **Günlük Cron (`0 3 * * *`):** `/api/cron/belge-paylasim-temizlik` rotası Vercel tarafından günlük tetiklenir. Yalnızca `Authorization: Bearer <CRON_SECRET>` başlığıyla yetkilendirilir.
- **Purge ve GC:** Süresi dolan veya iptal edilen Blob'lar fiziksel silme kuyruğuna girer; yalnız 24 saatten eski yetimler taramaya alınır. Lease'i bitmiş `pending` attempt `failed/unknown` yapılır ve belirsiz upload byte'ı ek 24 saat kapasitede tutulur. 30 günlük mezar taşları temizlenir. Dokümantasyon (`dok_storage/`) veya CAD nesnelerine asla dokunulmaz.

### 13.5. V3 şema ve runtime geçişi — ASAMA_02
- `db/migrations/006_belge_paylasim_v3_runtime.sql`, 005'i değiştirmeden owner/proof/token sürümleri, attempt/lease, `ready_at`, günlük kota bucket'ı ve fiziksel Blob byte yükümlülüğü için eklemeli alanlar kurar. Legacy satırlara anonim tarayıcı sahibi atanmaz; eski token hash'leri ve `expires_at` korunur.
- Uygulama repository'si runtime'da tablo veya index oluşturmaz. Başlangıçtaki salt-okunur şema sürümü sorgusu migration 008 yoksa veya sürüm eskiyse güvenli `503` üretir. Migration dağıtımda ayrı ve yönetilen adım olarak çalıştırılmalıdır.
- Repository ve Blob fabrikaları yapılandırma yokken bellek adaptörüne düşmez. Memory adaptörleri yalnız test kodunun açık `set...ForTest` enjeksiyonuyla kullanılır; production ve Vercel runtime'ında bu enjeksiyon reddedilir.
- 006'nın kota/byte alanları sonraki V3 aşamalarının atomik yaşam döngüsü için veri sözleşmesidir; gerçek enforcement 008 ve ASAMA_05 ile eklenmiştir.

### 13.7. Replay kanıtı, V2 token ve attempt fencing — ASAMA_04
- Yeni create POST'u imzalı tarayıcı owner cookie'siyle birlikte `x-belge-share-replay-proof` başlığında ayrı 256-bit kanıt ister. DB yalnız owner/request kapsamlı HMAC proof hash'ini saklar; ham proof URL'ye veya loglara yazılmaz.
- Aynı owner + proof + payload ready işlemi 200 ile aynı sonucu verir; ilk başarı 201, geçerli pending işlem 202 döner. Yanlış owner/proof, request bulunamadı ile aynı 404 yanıtını alır. Eski proof alanı olmayan kayıtlarda `LEGACY_REPLAY_UNAVAILABLE` 409 döner ve eski yönetim anahtarı POST ile yeniden üretilmez.
- `GET /api/belgeler/paylasim/islem/[requestId]` aynı cookie ve replay-proof başlığını ister; proof query string'e konmaz. Ready yanıt link/token ve expiry döner; form alanları DB'ye yazılmaz veya yanıta eklenmez. Bütün sonuçlar `private, no-store` olarak işaretlenir.
- Retry ve süresi dolmuş pending takeover aynı logical record üzerinde yeni UUID attempt, artan `attempt_version`, yeni lease ve attempt'e özgü Blob yolu alır. Ready/failed DB geçişi yalnız tam attempt fence, geçerli lease ve `revoked_at IS NULL` koşuluyla yapılır; geç attempt ready/revoked durumu ezemez.
- Migration 007 yalnız `token_key_version` ekler; migration 008 kota/byte yaşam döngüsünü, migration 009 kalıcı cleanup kuyruğunu kurar ve gereken şema sürümünü 9'a taşır. Yapılandırılmış anahtar sürümü mevcut değilse token replay fail-closed 503 verir; hash veya anahtarlar otomatik dönüştürülmez.
- Owner başına atomik 50/gün enforcement ASAMA_05'te uygulanmıştır.

### 13.6. Anonim tarayıcı kimliği ve kota bootstrap — ASAMA_03
- `src/lib/belge-paylasim/browser-identity.ts`, sunucuda CSPRNG ile 256-bit kimlik üretir ve `BELGE_SHARE_SECRET` ile sürümlü HMAC imzalı cookie verir. Cookie `HttpOnly; SameSite=Lax; Path=/api/belgeler/paylasim`, host-only ve deployed/HTTPS ortamında `Secure` olur; gün ortası yenilemesi aynı kimlik hash'ini korur. Ham cookie/kimlik API JSON'una veya uygulama loglarına yazılmaz.
- `POST /api/belgeler/paylasim/kota` cookie bootstrap eder; `GET` imzalı cookie kimliğine göre anonim aggregate kota bilgisini döndürür. Aynı-origin tarayıcı `GET` isteğinde `Origin` başlığı yoksa rota yalnız `Host` istek URL'siyle aynı olduğunda devam eder; açık `Origin: null`, kaynak/Host uyuşmazlığı ve `Sec-Fetch-Site: cross-site` hâlâ reddedilir. Bu salt-okunur istisna create/revoke `POST`/`DELETE` isteklerine uygulanmaz. Neon sorgusu DB `NOW()` saatinden `Europe/Istanbul` gününü/reset anını alır ve yalnız o environment + owner + gün satırını okur. SELECT sonucu bucket boşsa sayaçlar sıfırdır; DB/şema yoksa bellek varsayılanı yerine kontrollü 503 döner. ASAMA_13’te bu Origin davranışı gerçek yerel production HTTP ile doğrulandı.
- `POST /api/belgeler/paylasim` same-origin kontrolünden sonra cookie imza/versiyon/expiry doğrular. Kimlik yok/bozuksa yeni kimlik oluşturmadan `428 BROWSER_ID_REQUIRED` verir.
- `browser-bootstrap.ts`, dialog entegrasyonu için Web Locks; desteklenmiyorsa BroadcastChannel kullanır, GET echo ile cookie kabulünü doğrular ve cookie engelinde en fazla iki bootstrap denemesinden sonra PDF İndir alternatifi içeren açıklamalı hata verir. Bu aşamada stüdyo düğmeleri/hook'ları yeni akışa bağlanmadı; görünür UI entegrasyonu ASAMA_07 kapsamındadır.
- Yerel PGlite testi quota SQL'inin gerçek PostgreSQL motorunda DB saatinden bucket okumasını, empty-row davranışını ve salt-okunur sorguyu doğrular. Testler production/Preview DB veya gerçek tarayıcı açmadı; iki sekme senaryosu BroadcastChannel API simülasyonuyla, iki ayrı browser aynı IP senaryosu izole route istekleriyle doğrulandı.

### 13.8. Atomik günlük kota ve Blob byte muhasebesi — ASAMA_05
- `src/lib/belge-paylasim/quota.ts` kota hatalarını ve 50/gün sözleşmesini tanımlar. Repository, tek PL/pgSQL fonksiyon çağrısıyla benzersiz request-id kontrolü, İstanbul günü tarayıcı rezervasyonu, sistem günlük rezervasyonu, byte bütçesi ve yeni attempt/blob obligation'ı birlikte commit eder. Kısa kota mutasyonları veritabanındaki guard satırında sıralanır; PDF render ve Blob PUT sırasında SQL kilidi tutulmaz.
- Başarıda `reserved → used` ve gerçek PDF boyutu aynı SQL geçişinde yazılır. Render/PUT failure günlük rezervasyonu bir kez bırakır. PUT varlığı belirsiz veya silme bekliyorsa Blob borcu `unknown/deletion_pending` durumunda kapasitede kalır. İptal/tombstone geçmişteki `used_links` değerini azaltmaz; Blob yükümlülüğü link satırından bağımsızdır.
- Migration 008, eski owner atanmış hazır kayıtların başarılı günlük ledger'ını ve mevcut Blob yollarının muhafazakâr byte borcunu backfill eder. Legacy sahibi bilinmeyen Blob'lar `legacy` ortamında kapasiteye katılır; release öncesi gerçek store/env reconciliation gerekir.
- Production'da global günlük ve byte sınırları ayrıca yapılandırılmalıdır. Yerel/Memory/PGlite testleri SQL sözleşmesini doğrular; Neon ayrı bağlantı concurrency, private Vercel Blob başarımı ve kapasite/fiyat kararı bu aşamada **NOT_RUN** dış release kapısıdır.

### 13.9. Kalıcı yönetim geçmişi ve IndexedDB depolama geçişi — ASAMA_08
- `src/lib/belge-paylasim/local-link-registry.ts`, cihaz yerel bağlantı geçmişini IndexedDB (`belge_paylasim_db`, store: `links`, keyPath: `viewToken`) üzerine taşır.
- `getSafeLocalStorage()` ve `getSafeIndexedDB()`, Safari gizli mod ve depolama kısıtlamalarında fırlatılan SecurityError/DOMException hatalarını getter seviyesinde yakalar (N06 koruması).
- Eski `MAX_STORED_LINKS = 20` kesme sınırı kaldırıldı; aktif yönetim anahtarları hiçbir sayısal sınırla sessizce atılmaz (F31). 4.500 aktif kayıt hafızada ve IndexedDB'de sorgulanabilir.
- `migrateLegacyLocalStorage`, `localStorage`'daki `belge_paylasim_user_registry_v1` verisini IndexedDB'ye taşır; kalıcı yazma doğrulanmadan eski localStorage verisi silinmez, kesintide güvenle tekrar çalıştırılabilir.
- Sekmeler arası `BroadcastChannel` eşitlemesi ve IndexedDB transaction seviyesinde var olan `revokedAt` damgası korunur; stale bir olay iptal edilmiş bağlantıyı asla tekrar aktif yapamaz.
- Arayüzde (`belge-share-dialog.tsx`) 4.500 kaydın DOM'a boğulmaması için 10'luk sayfalı görünüm (`pagedHistoryLinks`) ve sayfalama kontrolleri eklendi; sunucudan teyit edilmemiş kayıtlar yanıltıcı biçimde "Aktif" olarak etiketlenmez ("Cihazda kayıtlı", "Süresi doldu", "İptal edildi").
- Depolama hatası veya kota dolumu durumunda dahi oluşturulan aktif bağlantı (`activeLink`) React durumunda korunur ve kopyalanabilir; kullanıcıya önceden depolama uyarısı verilir. Kayıt defterinde ham form veya PDF baytı tutulmaz.

### 13.10. Kalıcı Blob cleanup kuyruğu, checkpoint ve gözlemlenebilirlik — ASAMA_09
- Migration 009 `belge_paylasim_cleanup_state` üzerinde global run owner/lease version, Blob cursor ve scan checkpoint'i saklar. Eski run hem checkpoint hem Blob obligation claim/complete/fail mutasyonlarında owner + fencing version ile reddedilir.
- Cleanup önce `belge_paylasim/` önekindeki Blob listesini sayfalayarak tamamen tarar; yalnız tam tarama sonrası due obligation silmeye başlar. Cursor kararsız/geçersizse tek güvenli baştan-tarama denemesi yapılır. Süre sonu veya ilerleme hatası `partial/failed` döndürür; cron HTTP 503 verir. Başka bir aktif run 409 alır.
- `deletion_pending`, `unknown` ve süresi dolmuş/iptal edilmiş `committed` byte yükümlülükleri fiziksel silme doğrulanana dek kapasitede tutulur. Fail silme lease'ini bırakır, hata kodunu maskeleyerek saklar ve artan 60 saniyelik retry backoff uygular (en çok 24 saat). Eski `pending` attempt lease reclaim edildiğinde byte borcu `unknown` olarak ek 24 saat korunur.
- Gözlem metrikleri pending/due/leased/failed silme sayısı, byte borcu, en eski cleanup istek zamanı, son başarılı cron zamanı ve kapasite kullanım oranını içerir. Due kayıt eski bir obligation lease'iyle engelleniyorsa çalışma `success` yerine `partial` raporlanır. Tamamlanmış Blob silimiyle ilgili günlük kullanılan link hakkı geri alınmaz.
- Yerel Memory adapter 120/500/1.000 yetim, ilk sayfada aktif kayıt, timeout sonrası checkpoint/restart, invalid cursor, iki cron yarışı, retry fairness, prefix koruması ve late finalize senaryolarını test eder. PGlite PostgreSQL motoru üzerinde Neon repository adapter'ı 1.000 yetimi 51 sayfada ölçülen süre içinde işler ve byte borcunu silimle kapatır; test raporu `ASAMA_09_tests.tap` içindeki tanılama satırında gerçek süreyi kaydeder.
- ASAMA_13’te izole Neon üzerinde iki gerçek PostgreSQL backend bağlantısı ve gerçek private Blob ile concurrency/failure-injection ve browser create/view/revoke kontrolleri geçti. Vercel production runtime’ı, günlük production üretim hacmi ve plan/bütçe hâlâ ASAMA_14/15 dış kapılarıdır; Memory/PGlite süreleri production throughput veya maliyet iddiası değildir.

### 13.11. Salt-okunur viewer kaynak sahipliği ve mobil geometri — ASAMA_10
- `belge-share-viewer.tsx`, bir belgeye ait `ShareViewerSession` kullanır. Oturum fetch AbortController, loadingTask, document transport ve sıralanmış render zincirinin sahibidir. Token/retry değişiminde önceki teardown tamamlanır; geç async `getPage` ve render sonuçları generation kontrolüyle elenir. Görünür hazır durumu yalnız güncel session/page/zoom/ölçü sonucuyla eşleşir.
- Kurulu PDF.js 6.3.289 `PDFDocumentProxy.destroy()` sağlamaz. Desteklenen `document.cleanup()` ve `loadingTask.destroy()` sırasıyla, render cancel promise'i settle olduktan sonra çalışır. Paylaşılan `pdfjs-client.ts` loader/worker kullanılır; dışarıdan verilmiş singleton worker belge oturumunca kapatılmaz. Canvas backing store unmount'ta sıfırlanır.
- `viewer-geometry.ts`, gerçek `getViewport({scale:1})` ölçüsünden genişlik/sayfa fit hesaplar; A4 sabiti yoktur. Fit manuel minimumun altına inebilir. CSS zoom boyutu ile backing DPR ayrı tutulur: üst sınır 8.000.000 piksel (RGBA yaklaşık 32 MB) ve her eksende 8.192 pikseldir; yüksek zoom'da CSS ölçüsü korunurken backing DPR düşer.
- Mobilde iki parmak zoom, tek parmak pan, tüm genişliklerde fit kontrolleri, 44px düğmeler ve klavye +/-/0 desteği vardır. İçerik wrapper'ı büyüdükçe scroll alanı da büyür; sol/üst kenarlar negatif flex merkezleme nedeniyle erişilemez kalmaz. ResizeObserver ve DPR değişimi geometriyi günceller; light/dark ve reduced-motion desteklenir.
- Hatalı render sessiz beyaz canvas olarak bırakılmaz; görünür retry sunulur. Son geçerlilik bilgisi gerçek `initialExpiresAt` tarihidir; sabit “90 Gün Geçerli” gösterilmez. Canvas yalnız görseldir; belge metninin ekran okuyucuya sunulmadığı açıklanır. Annotation layer, URI veya scripting başlatılmaz. İndir/yazdır kontrollerinin bulunmaması ve kısayol engeli bir kopyalama güvenlik sınırı değildir.
- İzole testler 23 birim/rota senaryosu ve gerçek yerel PDF.js ile 21 browser kontrolüdür. 320/390/768/1366 × DPR1/2/3, karma ölçülü iki sayfa, dokunma pinch/pan, 20 hızlı zoom/sayfa, 30 mount/unmount, HTTP/render retry, token değişimi ve fetch abort doğrulanır. Fiziksel Android/iOS ve Firefox/WebKit NOT_RUN; `/b` Next kabuk entegrasyonu ASAMA_11/13 kapısındadır.

### 13.12. Paylaşım kabuğu, HTTP erişim durumları ve metadata — ASAMA_11
- `SiteShell`, `usePathname()` ile `/b/` altında site Navbar/Footer/GlobalOverlays/Toaster'ını kaldırır; diğer rotalarda geri getirir. Server root layout korunmuş bir layout olduğu için ilk isteğin `x-pathname` header'ına göre kabuk seçimi istemci navigasyonunda eski kalıyordu (F07 iki yönde yeniden üretildi). Root `headers()` çağrısı ve yalnız bu header'ı taşıyan `middleware.ts` kaldırıldı; proxy veya geniş route-group taşıması eklenmedi. `children` server component olarak kalır, Footer server slot'udur.
- `/b/[token]` ready, bulunamadı, iptal, süre dolumu, henüz hazır değil ve hizmete erişilemiyor durumlarını açıkça gösterir. DB hatası “bulunamadı” sayılmaz. Pending/hizmet kesintisinde yeniden deneme; beklenmeyen render hatasında aynı izole kabuk içinde route error boundary vardır. `revokedAt`, purge ve expiry'den önce kontrol edilmeye devam eder.
- HTML durum ekranları bilinçli olarak HTTP 200'dür; iptal/süre dolumu JSX'i HTTP 410 iddiası değildir. PDF API unknown=404, revoked/expired=410, pending=425 + Retry-After, DB=503, başarısız Blob GET=502 (eksik Blob yapılandırması=503) döndürür. HEAD yalnız DB/lifecycle/size/type metadata'sını okur, Blob factory/GET/stream açmaz; dolayısıyla Blob kesintisinde DB kaydı ready ise HEAD 200 olabilir. Range varsayılan tam 200 akışıdır; 206, Content-Range veya Accept-Ranges vaat edilmez.
- `next.config.ts`, hem `/b/:path*` hem `/api/belgeler/paylasim/:path*` için private/no-store, no-referrer, noindex/noarchive ve nosniff başlıklarını korur. Genel site Referrer-Policy kuralı route handler başlığını ezebildiğinden API için de özel kural gerekir. Next dev Cache-Control'ü `no-store` olarak değiştirebilir; tam private sözleşmesi yerel production server üzerinde doğrulanır.
- Token rotasının layout metadata'sı canonical, OpenGraph ve Twitter alanlarını null ile bastırır; başlık geneldir, no-referrer ve noindex/nofollow/noarchive/nosnippet uygulanır. Token uygulama hata loglarına veya NavbarRouteTracker geçmişine taşınmaz. Platform erişim logları bu yerel testin kapsamı değildir.
- Gerçek Next 16.4.2 production HTTP/router ve kopyalanmış ürün kaynaklarıyla, geçici dizindeki izole read/Blob adaptörlerinde 39 entegrasyon kontrolü geçti; bu gerçek Neon/Blob testi değildir. Doğrudan ve istemci navigasyonu, prefetch, geri/ileri, reload, render fault, HTML 200/404/500, API 200/400/404/405/410/425/502/503, HEAD ve referer sınandı. Dar before/after build'de `/` ve `/stage11-normal` root headers kaldırılınca dynamic yerine static prerender oldu; bütün uygulamanın build/statik rota envanteri ASAMA_13 kapsamındadır.

### 13.13. Beş belge PDF parity ve dosya adı — ASAMA_12 (24 Ekim 2026)
- YİBF yalnız yedi ASCII rakam olarak dosya adına girer; baştaki sıfırlar korunur. Geçersiz veya ad sınırını aşan değer yalnız dosya adı parçasından çıkarılır, PDF form değeri ve kullanıcı düzenlemesi korunur. Takvim tarihi doğrulaması ay/gün/yılın sonlu tamsayı olmasını da şart koşar.
- Sunucu paylaşım PDF'si boyut/başlık kontrollerinden sonra `pdf-lib` ile parse edilir; belgeye göre beklenen sayfa sayısı ve sıfır AcroForm/widget aranır. Hata halinde hash üretilmez ve upload yoluna geçilmez. `pdf-engine.ts` flatten hatasını yutarak ilerlemez; eski şablonlarda flatten sonrası kalan bozuk annotation referanslarını temizler. Beyaz form widget'ı ile tümüyle kapatılan kırmızı FreeText yardım annotation'ları, yalnız kapsanan dikdörtgenler için editable ve flattened çıktılardan kaldırılır; şablon ve font değiştirilmedi.
- Beş belgenin boş/örnek/Türkçe-uzun fixture'ları editable ve shared olarak parse edilip ölçüldü. İçerik metni birebir eşleşti; shared PDF'de form/widget kalmadı. Gerçek Poppler render'ında 18 sayfa çifti karşılaştırıldı: en büyük fark 52 piksel / yaklaşık 2 milyon piksel (kanal eşiği 12 sonrası %0,0026; kabul sınırı %0,01), metin aynı. Altı approved sayfa ve altı blank-regeneration hayalet alan sayfası mevcut golden'lar değiştirilmeden karşılaştırıldı. İlk incelemede bulunan FreeText yardım metni hayaleti düzeltme sonrası temiz blank render ile yeniden kontrol edildi.
- Uzun sözleşme fixture'ında alanlardan biri yaklaşık 1,66 pt'ye küçülür; veri korunur ve geometri taşması raporlanmaz, ancak bu punto okunabilirlik garantisi değildir. Bu gözlem F09'u kapatmaz ve yeni bir okunabilirlik eşiği tanımlamaz. Gerçek Neon/private Blob ile yerel bütünleşik release kapısı ASAMA_13’te geçti; Vercel production runtime, kapasite/bütçe ve fiziksel cihaz/tarayıcı dış kapıları ASAMA_14/15 kapsamındadır.
- Kanıt: `docs/belgeler-paylasim-v3-uygulama/ASAMA_12.md`, `ASAMA_12_tests.json`, `ASAMA_12_browser.json`, `ASAMA_12_parity.json`, `ASAMA_12_visual-sheet.png` ve `ASAMA_12_pdfs/` altındaki 30 PDF/36 render.

### 13.14. Sürüm adayı kapasite ve Vercel hazırlığı — ASAMA_14 (24 Ekim 2026)
- Beş belge × üç sentetik fixture için üretilen 15 shared PDF ölçüldü: ortalama 1,244,593 byte, nearest-rank p95 1,284,386 byte, uygulama dosya üst sınırı 3 MiB. Bunlar üretim müşteri belgeleri/üretim hacmi ölçümü değildir. 1/5/10 aktif tarayıcı, 90 günlük retention, GET transfer ve nightly Blob list/PUT operasyonlarının hesap tablosu `docs/belgeler-paylasim-v3-uygulama/ASAMA_14_capacity_model.json` içindedir.
- Vercel takımı Hobby; mevcut private `iad1` Blob store aggregate'i 52,285,761 byte/58 nesnedir. Bu bütün store'dur; paylaşım prefix'i, production link/obligation/deletion backlog'u ayrıştırılmadı. Stage13 izole Development DB/Blob testi sonrası link/quota/obligation ve test nesnesi sıfırdır.
- Vercel env listesi `decrypt=false` ile Production ve Preview'in aynı DB ve Blob env kayıtlarını kullandığını gösterir. `BELGE_SHARE_GLOBAL_DAILY_LIMIT` ve `BELGE_SHARE_GLOBAL_MAX_STORAGE_BYTES` Production env'de yoktur; bu değerler girilmeden Production paylaşım kapasitesi fail-closed kalır. Production DB'ye bağlanılmadı ve Preview/RC, Production kaynakları paylaştığı için çalıştırılmadı.
- Hobby'de 1 GB Blob depolama, 10 GB Blob Data Transfer ve 2,000 Blob advanced operation sınırı, 50/gün tek tarayıcı varsayımında bile tahmini 5.60 GB 90-gün ortalama depolama ve 2,850 ileri operasyona karşı yetersizdir. 200/gün senaryosu 22.40 GB/90 gün ve yaklaşık 11,400 PUT+list operation/ay üretir. Pro için resmi fiyatla 200/gün + bir tam GET/link Blob tahmini yaklaşık $2.96/aydır; tüm Vercel projesi/Neon/vergiler hariçtir ve bütçe kararı değildir.
- SSO koruması `all_except_custom_domains` görünse de eski Production deployment yazma/cron rotalarının kapatıldığı kanıtlanmadı. Günlük cleanup 100 nesnelik listelerle 18,000 kayıt için teorik 180 liste sayfası/run gerektirir; gerçek Production backlog/throughput ve cron invocation **NOT_RUN**. Log redaction kaynak incelemesi PASS; Vercel runtime/asset-trace/izole Linux RC doğrulanmadı.
- Aşama sonucu **ENGELLI**; `YAYINA_HAZIR` değil. Üretim/Preview kaynak izolasyonu, açık kapasite ayarları, eski deployment yazma kısıtı, backlog/cleanup kanıtı ve izole RC dış kapıları sürüyor. Ayrıntı/fiyat kaynakları: `docs/belgeler-paylasim-v3-uygulama/ASAMA_14.md` ve `ASAMA_14_capacity_model.json`.

---

## 14. Paylaşılan Belgeler İçin Birleşik PDF Okuyucu V4 (PdfJsStudio Entegrasyonu)

V3 mimarisinde yer alan `/b/[token]` salt-okunur görüntüleyicisi (`belge-share-viewer.tsx`), tek canvas üzerine çizim yaptığı için metin seçimi yapılamıyor, PDF içi arama çalışmıyor ve kısayollar global capture ile engelleniyordu. V4 sürümünde dokümantasyon modülünde kendini kanıtlamış olan ortak `PdfJsStudio` altyapısı paylaşılan belgelere de entegre edildi:

### 14.1. Mimari Prensipler ve Değişmezler (Invariants)
1. **Tek Birleşik Okuyucu Çekirdeği:** `PdfJsStudio` bileşeni `variant?: "default" | "public-share"` desteği kazandı. Public share modunda form düzenleme, kaydetme, yeniden adlandırma, silme, paylaşım linki oluşturma ve tanılama (debug HUD) bileşenleri tamamen devreden çıkarılır.
2. **Metin Seçimi ve PDF İçi Arama:** Canvas arkasında `.textLayer` render edilerek fare ile tam metin seçme, kopyalama ve Türkçe karakter duyarlı (`İ/i`, `I/ı`) hızlı arama motoru etkinleştirildi.
3. **Güvenli ve Yetkilendirilmiş İndirme:** `src/lib/belge-paylasim/download-client.ts` istemci kütüphanesi oluşturuldu. `/api/belgeler/paylasim/[token]/pdf?download=1` uç noktası üzerinden `Content-Disposition: attachment; filename="<canonical>.pdf"` başlığıyla sunucudan bayt bayt tam eşleşen (SHA-256 parity) PDF indirmesi sağlandı. Çift indirmeleri engelleyen in-flight kilidi ve 60 saniyelik Blob URL temizliği uygulandı.
4. **Özgün Boyutlu Doğrudan Yazdırma:** `printPdfBytes` motoru ile tüm sayfaların vektörel/özgün boyutlarında doğrudan yazdırılması sağlandı; masaüstünde araç çubuğuna, mobilde ise `⋯` taşma menüsüne bağlandı. `Ctrl+P` ve `Ctrl+S` kısayolları `pdf-shortcuts-modal.tsx` içerisine eklendi.
5. **Geometri ve Viewport Koruma:** WCAG 1.4.4 gereğince viewport meta etiketlerinde büyütme kısıtlaması (`maximum-scale=1`, `user-scalable=no`) bulunmaz; masaüstünde %400'e kadar keskin PDF yakınlaştırma, dokunmatik cihazlarda bellek korumalı %300 tavanı ve 44px dokunmatik hedefler korunur. Toolbar, PDF zoom container'ının dışındadır ve yakınlaştırma sırasında sabit kalır.
6. **Salt-Okunur Rozeti ve Son Geçerlilik:** Paylaşılan ekranda sol üstte "Salt Okunur" rozeti ve linkin son geçerlilik tarihi (`formattedExpiry`) net olarak kullanıcıya gösterilir.

---

## 15. Belgeler Kataloğu ve Stüdyo Performans Optimizasyonları (V5 — 2026-10-24)

1. **Mobil Cam/Blur Optimizasyonu:** `belgeler-glass-bg.tsx` bileşeninde 4 adet 110px blur radial gradient içeren katmana `[contain:strict]` uygulandı ve aşırı GPU doku tahsisine yol açan `will-change: transform` kaldırılarak mobil kaydırma gecikmesi %44 azaltıldı.
2. **Kart Parlatma & Arama İndeksi:** `belgeler-hub.tsx` bileşeninde kart mousemove efektleri tek `requestAnimationFrame` altında koaleslendi; arama terimleri `PRECOMPUTED_DOCUMENTS` ile modül seviyesinde önceden normalize edilerek anlık tuş vuruşlarındaki dizi/regex tahsisleri elendi.
3. **Masaüstü Okyanus Sahnesi:** `ambient-ocean-scene.tsx` bileşeninde scroll ve mutation gözlemcileri `scheduleMeasure` (rAF) koaleslemesine alındı; `measure()` fonksiyonu ara dizi üretmeyen sıfır-tahsisli döngüye geçirildi.
4. **Stüdyo Kritik Yolu:** `use-belge-studio-document.ts` yüklenişinde arka plan `prewarmBrowserPdfJs()` tetiklendi ve ilk derlemedeki `setTimeout` gecikmesi kaldırılarak senkron effect'e alındı. 5 stüdyo rotasının açılış hızı ve V3 2000ms sessiz taslak sözleşmesi eksiksiz korundu.

