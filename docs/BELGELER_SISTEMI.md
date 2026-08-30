# Belgeler & Canlı PDF Stüdyosu — Mimari & Deneyim Notları

> **ÖNEMLİ (Token Tasarrufu):**  
> Bu doküman **SADECE** `/belgeler` sayfası, PDF motoru (`pdf-engine.ts`) veya resmi evrak stüdyoları ile ilgili bir işlem/geliştirme yapılacağı zaman okunmalıdır. Eğer göreviniz belgeler konusuyla ilgili **DEĞİLSE**, bu dokümanı okumanıza gerek yoktur; doğrudan atlayınız.

Bu doküman, Mühendis Mimar Portalı bünyesindeki **Belgeler (`/belgeler`)** modülünün ve interaktif PDF stüdyolarının çalışma prensiplerini, yaşanmış teknik deneyimleri, karşılaşılan problemleri ve önerilen çözüm pratiklerini özetler. Gelecekteki geliştirmelerde yol gösterici bir tecrübe kütüphanesi niteliğindedir.

---

## 1. Temel Mimari ve Çalışma Prensibi

Sistem, kullanıcıların resmi mühendislik evraklarını tarayıcı üzerinden doldurmasına, **anlık olarak gerçek PDF üzerinde canlı önizlemesine** ve tek tıkla resmi geçerliliği olan A4 PDF çıktısı almasına olanak tanır.

```
┌────────────────────────────────────────────────────────┐
│                   /belgeler Sayfası                    │
│   (Kategori Filtreleme + Arama + Belge Kartları)       │
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
│  ├─ Sağ Panel: PDF.js Destekli Anlık 60fps Canvas Önizleme + Toolbar  │
│  └─ Alt/Üst: İndir, Boş Form İndir, Yazdır, Sıfırla, Temizle Aksiyonları│
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      PDF Motoru (pdf-engine.ts)                        │
│  ├─ pdf-lib + @pdf-lib/fontkit ile AcroForm Alan Doldurma              │
│  ├─ Çift Font Desteği (Arial-Bold & Arial-Regular)                    │
│  ├─ Hayalet Yazı / Leke Temizleme (AP & DV Widget Sanitization)       │
│  └─ Metin Hizalama (Quadding - Q) ve Boyut Optimizasyonu              │
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

### 3.1. Dış Sayfa Kaydırmasız Düzen (Zero Outer Scroll / 100vh Fit)
* Masaüstü ekranlarda stüdyo açıldığında ana tarayıcı penceresinde **dış kaydırma çubuğu (outer scrollbar) kesinlikle çıkmamalıdır.**
* Stüdyo `h-[calc(100vh-...)]` veya tam ekran düzenine oturmalı; sol form paneli bağımsız olarak kendi içinde (`overflow-y-auto`) kaymalı, sağdaki canlı PDF önizleme paneli ise dikeyde tam sayfaya otomatik sığmalıdır (`scaleToFit`).

### 3.2. Yüksek Performanslı Anlık Yakınlaştırma (Instant 60fps Zoom)
* **Önemli İlke:** Zoom seviyesi değiştirildiğinde (Zoom In/Out butonları, `Ctrl + Mouse Wheel`, `Ctrl + +`, `Ctrl + -`, `Ctrl + 0`) PDF motoru (`pdf-lib`) **kesinlikle yeniden derlenmemelidir** ve durum `"Derleniyor"` moduna düşmemelidir.
* **Uygulama:**
  - `formData` değiştiğinde PDF bir kez derlenir, `pdfjs.getDocument()` ile parse edilir ve `cachedPdfDocRef.current` içine kaydedilir.
  - Zoom değiştiğinde sadece `renderPdfPage(cachedPdfDocRef.current, newZoom)` çağrılarak canvas anında (<5ms) yeniden çizilir.
  - Zoom > %100 olduğunda PDF önizleme kapsayıcısında iç kaydırma (`overflow: auto`) devreye girmeli, dış sayfa asla oynamamalıdır.

### 3.3. Alan Bazlı Yerel Sıfırlama Butonu (Per-Field Reset)
* Her form alanının başlığında, o alan varsayılan şablon değerinden farklı bir değere getirildiği anda beliren küçük bir `↺ Sıfırla` butonu yer alır.
* Kullanıcı alanı varsayılan değerine geri döndürdüğünde bu buton otomatik olarak kaybolmalıdır.

### 3.4. Esnek Doğrulama ve Uyarı Mantığı (Validations)
* **Altın Kural:** Bir alanda format veya hane kısıtı varsa (örneğin Yapı Denetim YİBF No için 7 hane kuralı), **kullanıcının yazması ASLA engellenmemelidir.**
* Belirlenen kural aşıldığında:
  1. Input kenarlığı ve metin kırmızıya dönmeli (`border-red-500 text-red-600`),
  2. Başlığın hemen yanında açık ve anlaşılır bir uyarı metni belirmelidir: `(YİBF No normalde 7 hanelidir, kontrol ediniz)`.
  3. Kullanıcı isterse fazladan yazmaya devam edebilmeli veya `Sıfırla` butonuyla düzeltebilmelidir.

### 3.5. Standart Aksiyon Butonları
Her stüdyonun sol panelinin altında şu 5 aksiyon butonu standarttır:
1. **Sıfırla (`Undo2`):** Formu resmi örnek değerlerle doldurur.
2. **Temizle (`Trash2`):** Tüm form kutucuklarını boşaltır (bembeyaz boş şablon).
3. **Boş Form (`FileDown`):** Orijinal boş PDF şablonunu doğrudan indirir.
4. **Yazdır (`Printer`):** Önizleme blob'unu doğrudan tarayıcı yazdırma penceresine gönderir.
5. **Doldurulmuş PDF'i İndir (`FileDown` - Vurgulu Amber Buton):** Kullanıcının doldurduğu güncel verilerle PDF dosyasını indirir.

### 3.6. Mobil Uyumluluk (Mobile Segmented Tab Switcher)
* Mobil ekranlarda (`< lg`) ekran ikiye bölünmez. Üstte iki sekmeli bir geçiş kontrolü bulunur:
  - **Form Alanları (`FileEdit`):** Inputların doldurulduğu alan (Kaç alanın dolu olduğu sayacıyla örn: `8/10`).
  - **Canlı PDF Önizle (`Eye`):** Sayfaya tam oturan mobil canvas önizlemesi.

---

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

### Adım 5: Stüdyo Bileşeni Oluşturma (`src/components/[belge]-studio.tsx`)
`beton-dokum-studio.tsx` veya `istifa-studio.tsx` bileşenini referans alarak:
- Form kontrolleri, canlı Canvas senkronizasyonu, zoom kontrolleri, yerel sıfırlama butonları ve mobil tab yapısını kurun.

### Adım 6: Sayfa Rotalarını Bağlama
1. `src/app/belgeler/[belge-slug]/page.tsx` rotasını oluşturup stüdyo bileşenini yerleştirin.
2. `src/components/belgeler-hub.tsx` içindeki `StudioPreview` bileşenine yeni belgenin modal durumunu bağlayın.

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
