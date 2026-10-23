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
│                        [Belge]Studio Bileşeni                          │
│  ├─ Sol Panel: Form Girdileri, Yerel/Genel Sıfırlama, Validasyonlar   │
│  ├─ Sağ Panel: PDF.js Canvas Önizleme, Sayfa ve Yakınlaştırma Araçları│
│  └─ Alt/Üst: İndir, Boş Form İndir, Yazdır, Sıfırla, Temizle Aksiyonları│
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

### 3.8. Belgeler Kataloğu Balina ve Okyanus Yaşamı Ambiyansı

- `AmbientWhaleCanvas` ve `AmbientOceanCanvas` yalnız `/belgeler` kataloğunda iki bağımsız katman olarak çalışır: üst katmanda iki kambur balina (*Megaptera novaeangliae*), alt katmanda ise zengin 3B Okyanus Ekosistemi (balık sürüleri, farklı balık türleri, deniz canlıları ve deniz tabanı bitkileri) yer alır. Her iki sahne yalnız `(min-width: 768px) and (hover: hover) and (pointer: fine)` koşulunda `next/dynamic` ile yüklenir. Telefon ve dokunmatik tabletlerde, yatay konum dahil, tuval/çizim motoru yüklenmez ve başlık düğmeleri gizlidir. Dar ekrana geçiş sahneleri unmount ederek RAF ve gözlemcileri kapatır. Üst sağ başlıkta birbirinden bağımsız iki kontrol düğmesi (**Blueprint Balina** `muhendis_whale_ambient_enabled` ve **Okyanus Yaşamı** `muhendis_ocean_ambient_enabled`) yer alır.
- `src/lib/whale/whale-motion.ts` yay-boyu hız dengelemeli (`stabilizeSplineParameter`) iki farklı süre/faz içeren 3B kübik Catmull-Rom rota üretir. Yan boşluklar ve son kart satırının boş hücresi DOM yerleşiminden ölçülür. Bireyler 112 / 133,28 saniyelik turlarda sağ/sol kadrajdan tamamen çıkar ve karşı taraftan girer; koordinat sarılması bütün anatomi görünmezken gerçekleşir. Yaklaşma gerçek perspektifi, uzaklaşma ise derinlik opaklığını sürekli (kesintisiz) biçimde değiştirir. Modele kadraja sığdırma uygulanmaz.
- `whale-math.ts` eliptik burun kapağı, sürekli Hermite kesitleri, üç-çeyrek (3/4) Darboux Ekran-Şerit Çerçevesi (`camDir` + `inPlane`) ve kuyruk sapı (`peduncle`) 3B perspektif açılımı ile paralel taşınan omurga çatısı üretir. Sabit uzunluklu segmentlerin açısal integrali gövdeyi esnetirken boyunu matematiksel olarak sabit tutar. Dikey itiş dalgası baş dengeleme salınımıyla birlikte kuyruğa gecikerek yayılır; dönüş eğimi, gövde yatışı, bağımsız yüzgeç bükülmesi/burulması ve kuyruk loblarının esnemesi aynı yüzüş fazına bağlıdır.
- Ayrıntılı 3B balina anatomisi 64 kesit × 48 yüzey noktası, gerçek 3B dünya normalleri üzerinden hesaplanan Blinn-Phong ıslak deri speküler parlaması, 3B Fresnel siluet kenar aydınlatması (rim light), sualtı güneş kostikleri, 26 çift kenarlı kabartmalı karın oluğu, 3B kubbeli baş tüberkülleri, hava deliği tümseği (splashguard), kambur sırt yüzgeci kaidesi ve 3B yüzey yamaları, çift dudak/çene çizgisi, orbital gölgeli göz küresi, pektoral hidrofil yüzey/falanks/kesit geometrisi, 3B kuyruk yüzgeci yüzey yamaları ve hidrodinamik girdap/akış izleri (`wakeLines`) içerir.
- `src/lib/ocean/*` (`ocean-types.ts`, `ocean-math.ts`, `ocean-flora.ts`, `ocean-creatures.ts`, `ocean-renderer.ts`) 3B Okyanus Ekosistemini oluşturur:
  - **Deniz Tabanı Bitkileri (`ocean-flora.ts`):** Alt sınır boyunca akıntıyla salınan 3B Dev Kelp ormanı (*Macrocystis pyrifera* — kök tutunma saçakları, pnömatosist hava keseleri ve 3B damarlı/kıvrımlı yaprak ayaları), tek gövdeden çatallanan 3B Yelpaze Mercanları (*Gorgonia ventalina*) ve Çatal Mercanlar (*Acropora*), *Posidonia* deniz çayırı şeritleri ve 3B kesit halkalı Boru Süngeri (*Aplysina*) kümeleri.
  - **Balık Sürüleri ve Farklı Türler (`ocean-creatures.ts`):** 4 bağımsız 3B pelajik sürü ve solo ikililer halinde toplam 70+ eklemli 3B balık; 6 farklı tür (*Sardina pilchardus* gümüş sardalya, *Caesio xanthonota* altın sırtlı fusilier, *Trachurus* istavrit, mercan *Anthias* sürüsü, uzun beyaz sırt flamalı *Zanclus cornutus* Moorish Idol çifti ve *Thunnus pelagicus* pelajik yüzücü).
  - **Deniz Canlıları (`ocean-creatures.ts`):** Rajiform 3B kanat çırpan Dev Okyanus Manta Vatozu (*Mobula birostris* — sefalik loblar, solungaç yarıkları, kanat ucu girdap izleri), asimetrik jet itkiyle nabız gibi kasılan 3B Yarı-Saydam Denizanaları (*Chrysaora noctiluca* — 16 radyal şemsiye kaburgası, 4 fırfırlı oral kol, 8 faz gecikmeli dokunaç), altıgen sırt plakaları (*scutes*) tek tek 3B Phong aydınlatmalı Yeşil Deniz Kaplumbağası (*Chelonia mydas*), yükselen mikro hava kabarcıkları ve hacimsel güneş ışık sütunları.
- `whale-renderer.ts` ve `ocean-renderer.ts` 3B sırt-karın zıt renklenmesi (countershading), dikişsiz Phong/Fresnel dörtgen yüzey yamaları ve blueprint lider etiketleri kullanır. Balina katmanı `source-atop` atmosferik su sislemesiyle derinlik yumuşaklığını korurken arkasındaki okyanus bitkilerini ve balıkları gerçek 3B örtüşmeyle kapatır. `data-whale-protect` ile işaretli kart/arama/başlık bölgeleri her iki tuvalde de 4 kademeli eşmerkezli optik tüy (feather) maskesiyle yumuşakça sönümlenir.
- DPR tavanı 1.75; çizim tavanı geniş masaüstünde 60, dar masaüstünde 30 FPS'dir. Gizli sekmede RAF durur. Kapatma/açma kübik easing ile yumuşak geçiş yapar. `prefers-reduced-motion` her iki sahneyi de statik mimari kompozisyonda gösterir.
- Doğrulama: `npx tsx tests/whale/whale-math.test.ts` balina ve okyanus ekosisteminin tüm 3B geometrisini sınar. `tests/site-audit/whale-ambient.spec.ts` gerçek tuval piksellerinde iki yan koridorun doluluğunu, kart maskesini, her iki bağımsız butonun (`Blueprint Balina` ve `Okyanus Yaşamı`) açma/kapama/kalıcılık davranışını, mobilde yokluğu ve masaüstü/dar ekran geçişini kontrol eder.

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

## 13. Akıllı Dosya Adı ve 90 Günlük Güvenli Paylaşım Mimarisi (V2)

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
  - İndir, yazdır ve form düzenleme kontrolleri bulunmaz; `Ctrl+P` ve `Ctrl+S` engellenir.
  - Meta etiketleri `noindex, nofollow, nocache`; OpenGraph başlığı anonimdir (kişisel veri içermez).

### 13.3. Güvenlik, Kota ve İptal Mekanizması
- **Sunucu Taraflı PDF Üretimi:** Anonim keyfî PDF byte upload'u yoktur. Sunucu yalnızca allowlist'te bulunan 56 form alanını içeren küçük JSON (azami 64 KiB) kabul eder ve `flatten: true` ile AcroForm alanları sıfırlanmış PDF üretir.
- **Kriptografik Token:** `BELGE_SHARE_SECRET` kullanılarak `HMAC-SHA256` ile 256-bit entropili `viewToken` ve `manageToken` üretilir. DB'de yalnızca SHA-256 hash'leri saklanır.
- **Kota Sınırları:** IP başına 15 dakikada 3 bağlantı, 24 saatte 10 bağlantı, en fazla 20 aktif bağlantı; küresel günde 200 bağlantı ve 1 GiB depolama sınırı.
- **İptal (Revocation):** Oluşturan cihazın tarayıcısında saklanan `manageToken` ile `DELETE /api/belgeler/paylasim/[token]` rotası üzerinden bağlantı anında iptal edilebilir. İptal anında veritabanında `status = 'revoked'` yapılır ve `/b/[token]` derhal HTTP 410 döndürür.

### 13.4. Depolama İzolasyonu ve Otomatik Temizlik (Cron)
- **Özel Blob Depolama:** `belge_paylasim/` önekiyle Vercel Private Blob üzerinde tutulur. Doğrudan genel URL verilmez; stream yalnız `/api/belgeler/paylasim/[token]/pdf` üzerinden sunulur.
- **Günlük Cron (`0 3 * * *`):** `/api/cron/belge-paylasim-temizlik` rotası Vercel tarafından günlük tetiklenir. Yalnızca `Authorization: Bearer <CRON_SECRET>` başlığıyla yetkilendirilir.
- **Purge ve GC:** Süresi dolan veya iptal edilen Blob'lar fiziksel olarak silinir; 24 saatten eski yetim (orphan) nesneler ve 30 günlük mezar taşları temizlenir. Dokümantasyon (`dok_storage/`) veya CAD nesnelerine asla dokunulmaz.

