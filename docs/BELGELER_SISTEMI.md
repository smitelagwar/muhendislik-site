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

### 2.4. Kullanıcı Dostu Dil (Yazılımsal Terimlerin Gizlenmesi)
* **Kural:** Arayüzde veya başlıklarda son kullanıcıyı ilgilendirmeyen `(AcroForm)`, `(PDF Form)`, `(Field Array)` gibi yazılımsal veya teknik terimler **kesinlikle yer almamalıdır.** Başlıklar her zaman `"Beton Döküm Tutanağı"`, `"Şantiye Şefi İstifa Dilekçesi"` gibi sade ve kurumsal olmalıdır.

---

## 3. Kullanıcı Arayüzü & Stüdyo Standartları (UI / UX Kuralları)

Tüm belge stüdyoları (`*-studio.tsx`) standart bir kullanıcı deneyimi sunmalıdır:

### 3.1. Bağımsız Stüdyo Navigasyonu ve Başlığı
* `/belgeler` belge kataloğudur; arama/kartlar, genel site başlığı ve uygun ekranlarda ana navigasyon burada görünür.
* Beş belge stüdyosu katalogdan kendi rotasına açılır: `/belgeler/beton-dokum-tutanagi`, `/belgeler/insaat-ruhsati-dilekcesi`, `/belgeler/santiye-sefi-istifa-dilekcesi`, `/belgeler/santiye-sefi-sozlesmesi` ve `/belgeler/santiye-sefi-taahhutnamesi`. Bu rotalarda genel site header'ı gizlenir; masaüstünde (`lg+`) `BelgeStudioPageShell` tek satırlı belge başlığını ve `/belgeler` hedefine dönen erişilebilir bağlantıyı gösterir, mobilde (`< lg`) ise ekran alanını maksimum kullanmak için üst bar gizlenip `Belgelere dön` eylemi alt çubuktaki `⋯` (`Diğer belge işlemleri`) menüsü içine taşınır (`h1` başlığı ekran okuyucular ve SEO için `sr-only` olarak korunur). Rota eşlemesi `src/lib/belge-studio-routes.ts` içinde tutulur.
* Mobil görünümde form ve PDF önizlemesi tek ekranda üst üste bindirilmez; form/PDF sekmeleri ve alttaki belge eylemleri kullanılır. Stüdyo içinde genel hamburger ve gereksiz yer kaplayan "Başlangıç alanları örnek veridir..." üst uyarı bandı bulunmaz. `Ctrl+K` komut paleti davranışı korunur.
* Belgeler kataloğu şu anda `StudioPreview` modalı kullanmaz. Kartlardaki stüdyo eylemleri bağımsız belge rotasına gider; yeni belge eklerken olmayan bir modalı `belgeler-hub.tsx` içine bağlamayın.

### 3.2. Dış Sayfa Kaydırmasız Düzen (Zero Outer Scroll / 100vh Fit)
* Masaüstü ekranlarda stüdyo açıldığında ana tarayıcı penceresinde **dış kaydırma çubuğu (outer scrollbar) kesinlikle çıkmamalıdır.**
* Stüdyo `h-[calc(100vh-...)]` veya tam ekran düzenine oturmalı; sol form paneli bağımsız olarak kendi içinde (`overflow-y-auto`) kaymalı, sağdaki canlı PDF önizleme paneli ise kullanılabilir alana orantılı biçimde sığmalıdır.

### 3.3. PDF Üretimi, Canlı Önizleme ve Yakınlaştırma
* Ortak `BelgeStudioPreviewToolbar`, yakınlaştırma/sığdırma/dış bağlantı grubunu önizleme panelinin gerçek yatay merkezinde tutar. Geniş panelde eşit yan sütunlar; çok sayfalı belgelerde 560 px ve altında iki satır kullanılır. Mobilde tek sayfalı belgelerde araç çubuğu 44 px tek satırdır; tema kontrolü ek satır oluşturmaz. Masaüstündeki özel dar önizleme panellerinde 360 px ve altında iki satıra geçilebilir. Kontroller en az 44×44 px kalır.
* Önizlemedeki `Koyu tema` switch'i yalnız masaüstünde (`lg+`) görünür. Mobil/tablette (`< lg`) tema geçişi mevcut `Diğer belge işlemleri` menüsündedir; form ve önizleme sekmelerinde erişilebilir kalır. İki eylem ortak `next-themes` durumunu değiştirir; uygulama teması ve `aria-checked` birlikte güncellenir. Tema ve zoom PDF'i yeniden üretmez.
* Belge araçlarının özel SVG seti `src/components/belge-studio-icons.tsx` içinde tutulur; `currentColor` ile her iki temaya uyar, dekoratif SVG'ler `aria-hidden` kullanır. Eylemin Türkçe erişilebilir adı düğme/bağlantı üzerinde kalır.
* Beş stüdyo da `useBelgeStudioDocument` ortak hook'unu kullanır. Alan değişikliklerinden sonra üretim 150 ms geciktirilir; en yeni istek geçerli kalır, 20 saniyelik zaman aşımı uygulanır ve çıktı PDF imzası açısından doğrulanır. Önizleme, yazdırma ve indirme aynı güncel byte snapshot'ını kullanır. Yeni çıktı oluşana kadar eski PDF'in indirilmesi/yazdırılması engellenir; kullanılmayan blob URL'leri temizlenir.
* PDF.js belgesini yeniden kullanarak sayfa çizilir. Yakınlaştırma PDF'i yeniden üretmez; zoom değişince yalnızca önizleme sayfası tekrar çizilir. Sayfa numarası ve toplam sayfa sayısı PDF'den okunur, önceki/sonraki sayfa ve sığdırma kontrolleri gerçek sayfayı yönetir.
* Yakınlaştırma %50–%400 aralığındadır; düğmeler %25 adım, tekerlek ve pinch sürekli ölçek kullanır. Masaüstünde Ctrl/Cmd + tekerlek, önizleme yüzeyine bağlanan yerel `wheel` dinleyicisi ve `{ passive: false }` ile yakalanır. React `onWheel` bu iş için kullanılmaz; pasif olay tarayıcı zoom'unu durduramaz. Normal tekerlek paneli kaydırır. Ctrl/Cmd + artı/eksi/0 kısayolları önizleme odaktayken çalışır.
* Mobilde iki parmak hareketi yalnızca PDF önizleme yüzeyinde yakalanır; tek parmakla büyütülmüş sayfa kaydırılır. Ardışık zoom hareketleri son raster ölçeğine göre hesaplanır ve imleç/parmak çıpası panelin kaydırma koordinatlarıyla korunur. Canvas raster belleği en çok 8 milyon piksel ve kenar başına 4096 piksel ile sınırlandırılır. Form değişikliği, çok sayfalı belgedeki etkin sayfayı korur.
* Mobil form ve önizleme sekmeleri arasında geçerken PDF belgesi hazır tutulur; sekme ilk kez açıldığında boş canvas görülmemelidir. Canvas hazırlığı `opacity` ile yönetilir; `visibility: visible` kullanılmaz, çünkü bu değer gizli önizleme panelinin görünürlüğünü geçersiz kılıp canvas'ı formun üzerine çıkarabilir. Başarılı çizim, yüklenme ve hata durumları ayrı ayrı duyurulur; hata durumunda yeniden deneme sağlanır.

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

Form genel olarak sıfırlandığında veya temizlendiğinde tek adımlık **Geri al** eylemi son işlemi geri yükler. Sonraki düzenleme, alan bazlı sıfırlama veya örnek veri seçimi bu eski kaydı geçersiz kılar. Alan bazlı sıfırlama normal düzenleme akışını kullanır: Sözleşme ve Taahhütname'deki bağlı imza alanları eşleşiyorsa birlikte güncellenir; elle özelleştirilmiş imzalar korunur. İndirme ve yazdırma, formdaki son değişiklik için yeni PDF hazırlanırken devre dışı kalır. PDF araçları tüm ekranlarda en az 44×44 px hedef kullanır; sayfa, zoom ve görünüm kontrolleri gruplanır. Çok sayfalı belgelerde dar panel iki araç satırı kullanır; tek sayfalı mobil belgeler bir satırda kalır. Yatay/klavye ile daralan ekranda PDF alanı kalan yüksekliğe sığar.

### 3.7. Mobil Uyumluluk (Mobile Segmented Tab Switcher)
* Mobil ekranlarda (`< lg`) ekran ikiye bölünmez. Üstte iki sekmeli bir geçiş kontrolü bulunur:
  - **Form Alanları (`FileEdit`):** Inputların doldurulduğu alan (Kaç alanın dolu olduğu sayacıyla örn: `8/10`).
  - **Canlı PDF Önizle (`Eye`):** Sayfaya tam oturan mobil canvas önizlemesi.

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
   - Hızlı ardışık çizimlerde (sekme geçişi, zoom, sayfa çevirme) önceki PDF.js `renderTask.cancel()` çağrılarak paralel/çakışan çizimler engellenir; bileşen unmount olduğunda `loadingTask.destroy()` çağrılır.

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
   - Gerçek şablon AcroForm `rect`, `DA` ve `Ff` envanterine dayalı hafif offline kalibrasyon tablosu (`CRITICAL_READABILITY_GEOMETRIES`) ile anlık (< 1 ms) risk seviyesi (`none`, `possible`, `serious`) hesaplanır.
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
   - Gerçek üretilen PDF çıktısında girilen tüm karakterlerin AcroForm text alanında eksiksiz saklandığı testlerle kanıtlanmıştır.

---

## 10. Geri Alma, Hata Toleransı ve Rollback Güvencesi

Olası bir regresyon veya geri alma durumunda:
- **Şablon Geri Alma:** İstifa dilekçesi orijinal tek satırlı baseline'a (`3132D561...`) döndürülmek istenirse `git checkout 14235bd4ff86f6d03f3a575d4650596cef57206e -- public/belgeler/santiye-sefi-istifa-dilekcesi.pdf` komutuyla tek işlemde restore edilebilir; `assessFieldReadability` ve inline layer yeni koordinatları dinamik okuduğu için sistem çökmez.
- **Opt-in İzolasyon:** Inline edit katmanı varsayılan olarak OFF olduğundan arayüzde herhangi bir bileşen hatası durumunda `isInlineEditingActive = false` bırakılarak standart baseline stüdyo deneyimi %100 kesintisiz devam eder.
- **Korumalı Çekirdek:** `pdf-engine.ts`, `use-belge-studio-document.ts` ve `document-field-contracts.ts` dosyaları salt-okunur (read-only) korunduğu için üretim PDF pipeline'ı hiçbir mimari risk taşımamaktadır.
