# hsynCAD — inceleme ve tasarım notu

Tarih: 25 Ekim 2026. Kapsam: tarayıcıda kişisel 2B/3B yapı elemanı modelleme ve geometrik metraj MVP'si.

## REA ile ideCAD'den bulduklarım

**Gerçek araç çağrısı:** `mcp__rea__inspect_pe_resources`, `C:\Program Files\ideCAD\ideCAD Statik 11 Deneme\ideCAD_Statik_11_Deneme.exe` üzerinde çalıştırıldı (`max_file_bytes=268435456`, `max_entries=50000`). REA, 213.281.352 baytlık PE dosyasının 9.243 kaynak girdisini ve 4.613 kaynağını tam envanterledi. SHA-256: `a4dcabe8680507c1444a4cb40a2f908f9bf51120929a8f763b425b60ff2cbdd3`. Kanıt: `ev_5756763f7757b0a2a78bc84b5bdb5416294438729a347abee48618669981910b`.

REA kaynak içeriklerini opak veri olarak raporlar. Aşağıdaki UI bulguları, REA'nın verdiği sınırlandırılmış dosya konumlarından RT_STRING uzunluk alanları ve RT_DIALOG/DIALOGEX yapıları salt okunur çözümlenerek elde edildi; REA'nın bir UI otomasyonu yaptığı iddia edilmiyor. 743 diyalog şablonu okundu; ayrıştırma hatası oluşmadı. Seçili kaynak kimlikleri, konumları ve özetleri [kanıt kaydında](hsyncad-rea-kanit.json) bulunur. İkon, uygulama kodu veya ideCAD proje dosyası biçimi ürüne alınmadı; kurulum ve lisans dosyaları değiştirilmedi, hedef uygulama çalıştırılmadı.

| Soru | Yerel statik gözlem | Kanıt / sınır |
| --- | --- | --- |
| Arayüz hiyerarşisi | Ribbon, analiz, betonarme/çelik tasarım, rapor ve çizim grupları; ayrı koordinat kutusu ve yakalama komutları mevcut. | RT_STRING 15200–15206, 15000, 12605. Grupların varlığı doğrulandı; güncel ekran düzeni çalıştırılarak doğrulanmadı. |
| Aks | Ad/ek, kontur içi-dışı çizgi, uç uzatma ve tali aks alanları var. | RT_DIALOG 127. Yerel `idehelp.txt`, komut 1001'i resmî aks çizim yardımına bağlıyor. |
| Kolon | Ad, genişlik/yükseklik, X/Y kaçıklık, üst/alt kot ve materyal alanları var. | RT_DIALOG 132. Dikdörtgen, daire ve poligon seçenekleri resmî yardımda da ayrılıyor. |
| Kiriş / perde | Perde genişliği, kot/üst kot, kaçıklık ve materyal alanları var. Kiriş/perde yerleştirme komutları yerel yardım eşlemesinde ayrı. | RT_DIALOG 174; `idehelp.txt` 1016/1022 ve 1023/1024. İki noktalı çizim sırası aşağıdaki resmî yardım kaynağından öğrenildi. |
| Döşeme | Kalınlık, kot, açı ve dolgu görünümü alanları var. | RT_DIALOG 137. Kapalı alan iş akışının kaynağı resmî yardım; iç geometri algoritması bilinmiyor. |
| Koordinat / snap | Lokal X/Y, koordinat kutusu, orta nokta, gelişmiş yakalama; düğüm/ızgara kilidi, piksel cinsinden seçme uzaklığı ve Ortho seçenekleri var. | RT_STRING 11250, 11350, 11520/11530, 40232/40233; RT_DIALOG 604. Öncelik sırası ve tolerans algoritması çıkarılmadı. |
| Kat / katman | Kat yüksekliği, mimari/statik kot, yukarı/aşağı kat ekleme; katman aç/kapat/kilitle ve çizime/tüm katlara uygulama seçenekleri ayrı. | RT_DIALOG 10470 ve 106. Kat geometrik seviye, katman görünüm/seçim organizasyonu olarak ayrılıyor; bu son cümle UI'dan yapılan yorumdur. |
| Metraj | Beton/kalıp/donatı ve toplam seçimleri; kata, elemana veya ikisinin sırasına göre gruplama; eleman tipi filtreleri mevcut. | RT_DIALOG 593, 13740. Formüller, birleşim hacmi düşümleri ve kalıp temas yüzeyi kuralları doğrulanmadı. |

**Kullanıcının ekran görüntüsü — ayrı kanıt:** Üstte sekmeli Ribbon, solda dikey araç çubuğu, ortada yan yana plan ve perspektif, plan üstünde yüzen koordinat kutusu; altta komut/bilgi/mesaj satırları ile birim ve zoom gösterimi görülüyor. Bu yerleşim REA sonucu gibi sunulmuyor. Görsel yalnız iş akışı referansı olarak kullanılıyor.

**Yerel yardım eşlemesinden açılan resmî belgeler:** Aks, seçilen yatay/düşey/serbest modda yerleştiriliyor; [aks çizimi](https://help.idecad.com.tr/ideCAD/aks-cizimi). Kolon kesiti ve kaçıklığı yerleştirmeden önce belirlenebiliyor; [kolon oluşturma](https://help.idecad.com.tr/ideCAD/betonarme-kolon-olusturma). Kiriş ve perde başlangıç/bitiş noktaları ile, önizleme ve kaçıklık seçenekleri kullanılarak tanımlanıyor; [kiriş](https://help.idecad.com.tr/ideCAD/betonarme-kiris-olusturma), [perde](https://help.idecad.com.tr/ideCAD/perde-cizimi). Döşeme için kiriş/perde/döşeme kenarlarının kapattığı alan seçiliyor; [döşeme oluşturma](https://help.idecad.com.tr/ideCAD/doeseme-olusturma). Kotların taban/tavan anlamı mimari/statik seçimine bağlı; [kat ayarları](https://help.idecad.com.tr/ideCAD/kat-genel-ayarlari). Metraj mevcut projeden, seçilen tür/kat/eleman gruplamasıyla üretiliyor; [metraj](https://help.idecad.com.tr/ideCAD/donati-kalip-ve-beton-metraji). [Konumlandırma](https://help.idecad.com.tr/ideCAD/konumlandirma) belgesi koordinat, düğüm yakalama ve plan–perspektif ilişkisini açıklıyor. Bunlar dokümantasyon gözlemidir; kurulu deneme sürümünde canlı işlem yapılmış değildir.

**Açık kalanlar:** ideCAD'in aks kesişimi/uç/orta nokta aday sıralaması, yakalama toleransının ölçeğe göre hesabı, eleman bağlantı kısıtları, gerçek zamanlı 2B–3B güncelleme mekanizması ve birleşimlerde net metraj algoritması bilinmiyor. MVP bunlar için aşağıdaki özgün kuralları kullanır.

## Web için kendi kurguladığım mimari

Bu kararlar özgün web uygulamasına aittir; ideCAD algoritmaları olarak yorumlanmamalıdır.

- **Entegrasyon:** Next.js App Router'da `/kategori/araclar/hsyncad`. Araç katalog/registry/SEO/kanıt kayıtlarında ayrı araç. Var olan belge CAD/DWG görüntüleme motorundan bağımsızdır. Ek bağımlılık yok; mevcut React, TypeScript, Three.js ve lucide kullanılır. Stiller yalnız çalışma alanına kapsamlanır; açık/koyu tema desteklenir.
- **Tek model:** `src/lib/hsyncad/model.ts` içindeki sürümlü `CadModel` yalnız JSON değerleri taşır: `schemaVersion`, ad, katlar, malzemeler ve ayrıştırılmış eleman tipleri. Bütün geometri SI metre cinsindedir. Kat için taban kotu/yükseklik, her eleman için kalıcı kimlik/kat/malzeme/katman vardır. Gelecekteki statik-betonarme hesap modülleri bu kimlikleri ve geometriyi okuyabilir; model sürümüne uygun doğrulama ile genişletilebilir. MVP'de TBDY hesabı yoktur.
- **Yerleştirme:** Aks/kiriş/perde iki nokta; kolon kesit merkezinde tek nokta; döşeme en az üç köşeli basit kapalı poligon. Konkav döşeme desteklenir, kendiyle kesişen poligon reddedilir. Koordinat kutusu ve komut satırı mutlak X/Y metre kabul eder. Aks kesişimi → uç (kolon merkezi dahil) → orta nokta → ızgara sırası özgün bir tercihtir. Yakın aday toleransı ekranda 10 pikseldir; ölçeğe göre dünya birimine çevrilir. Yakalama kapatılabilir. Dik çizim seçeneği vardır.
- **Görünümler:** SVG plan yalnız aktif kattaki görünür katmanları çizer. Three.js perspektif bütün katlardaki görünür elemanları aynı `elementFootprint` / `elementVerticalRange` fonksiyonlarından üretir; üçgenlenmiş kapalı hacimler gerçek boyuttadır. Plan +Y, 3B dünyada −Z; yükseklik 3B +Y olur. 2B tekerlek/yakınlaştırma düğmeleri ve tek parmak Kaydır aracı; iki parmakla pan/pinch. 3B OrbitControls döndürme/yakınlaştırma/kaydırma. Mobilde görünümler alt alta gelir.
- **Düzenleme:** Seçim, özellik formu, iki referans noktasına göre taşıma, silme, 80 adımlık geri al/yinele. Katlar geometrik seviyedir; katmanlar yalnız görünürlüğü kontrol eder. Gizli katmanlar metrajdan çıkarılmaz. Kiriş/döşeme üstü kat üst kotuna, kolon/perde tabanı kat taban kotuna bağlıdır; kolon/perde yüksekliği bağımsız eleman özelliğidir.
- **Metraj:** Brüt hacim taban alanı × yükseklik. Tüm katılar eksenlere paralel dikdörtgense z/x kesitleri ve y aralık taramasıyla tam hacim birleşimi hesaplanır; çift/üçlü çakışmalar bir kez sayılır. Ortak hacim kolon → perde → kiriş → döşeme önceliğiyle sınıflandırılır. Eğik eleman/dikdörtgen olmayan döşeme veya işlem bütçesi aşımı halinde tüm model brüt hacme döner ve panel açık uyarı verir. Kalıp daima brüt: kolon/perde çevre × yükseklik; kiriş `(b+2h)L+2bh`; döşeme `alan+çevre×kalınlık`. Birleşim kalıp temas yüzeyleri düşülmez; boşluk/fire/donatı dahil değildir.
- **Kayıt ve doğrulama:** Model tarayıcı `localStorage` içinde `hsyncad.model.v1` anahtarında saklanır; JSON indir/aç ile taşınabilir. Girdi tümüyle doğrulanmadan mevcut model değiştirilmez. Sürüm, benzersiz kimlikler, kat/malzeme referansları, sonlu/pozitif boyutlar ve basit poligon şartları kontrol edilir. İçe aktarma 5 MB; model 1000 eleman, 100 kat ve 200 döşeme köşesiyle sınırlıdır. Bunlar tarayıcı MVP sınırlarıdır.

## İkinci Aşama REA İncelemesi: Aks Çizim Seçenekleri, Kotlar ve Birleşim Kesişimleri (26 Ekim 2026)

Kullanıcının geri bildirimi doğrultusunda ideCAD Statik 11 Deneme PE dosyasındaki Win32 diyalog (`RT_DIALOG` / `DIALOGEX`), menü ve string tabloları REA kaynak konumları üzerinden derinlemesine incelendi.

- **Kalıcı İnceleme Dosyaları:**
  - `C:\Users\hsyn\Desktop\hsyncad\incelemeler\idecad-rea\calisma-akisi-2026-10-26\aks-kot-birlesim-bulgular.json` (2.042 kaynak arasından filtrelenmiş aks, kot ve birleşim bulguları)
  - `C:\Users\hsyn\Desktop\hsyncad\incelemeler\idecad-rea\calisma-akisi-2026-10-26\tam-bulgular.json` (743 diyalog, menüler ve string kayıtlarının tam Win32 çözümü)
  - `C:\Users\hsyn\Desktop\hsyncad\incelemeler\idecad-rea\calisma-akisi-2026-10-26\parse-win32-ui.cjs` (Salt okunur Win32 kaynak ayrıştırıcı betik)
  - `C:\Users\hsyn\Desktop\hsyncad\incelemeler\idecad-rea\README.md` (İnceleme dizini kullanım rehberi)

### 1. ideCAD Aks Sistemi ve hsynCAD Çözümü
- **İncelenen ideCAD Mantığı:** ideCAD'de aks aracı tek tıklamayla yatay/düşey yönlendirme, ardışık açıklık girişiyle aks ağı (grid) oluşturma, mevcut akstan ofset mesafesiyle paralel aks türetme ve aks balonlarının uç uzantılarını (`extension`) bağımsız yönetme olanakları sunar.
- **hsynCAD Uygulaması (`src/lib/hsyncad/axes.ts` & `src/components/hsyncad/axis-options.tsx`):**
  - **Aks Yönü:** Yatay (─), Düşey (│) ve İki nokta serbest (╱) modları. Tek tıklamayla modele yayılan yatay/düşey aks yerleştirme; Boşluk tuşu (`Space`) ile modlar arası anında geçiş.
  - **Otomatik Adlandırma:** Düşey akslar `1, 2, 3...`, yatay akslar `A, B, C... AA, AB...` kuralıyla çakışmasız otomatik ad alır.
  - **Ölçülü Aks Ağı (Grid):** Noktalı virgülle ayrılan açıklıklarla (`4;4,5;3` gibi) X ve Y yönünde tek işlemde tam ölçekli aks sistemi üretimi ve SVG önizlemesi.
  - **Mesafeyle Paralel Aks:** Seçili veya son akstan istenen ofset mesafesiyle paralel yeni aks oluşturma.
  - **Uzantı ve Balonlar:** `extendedAxisEndpoints` fonksiyonu ile aks çizgileri plan ve 3B görünümde modelin dışına taşarak okunur; balonlar `labelSide` ("both" | "start" | "end") seçeneğine göre çizilir.

### 2. Eleman Kot Hiyerarşisi
- **İncelenen ideCAD Mantığı:** Kolon ve perdelerin alt kotu kat tabanına veya bağımsız alt kot farkına bağlanabilir; tavan kotu kat yüksekliğine göre otomatik kilitlenebilir (`story`). Kiriş ve döşemelerin üst kotu ise doğrudan kat tavan kotuna referanslıdır.
- **hsynCAD Uygulaması (`src/lib/hsyncad/model.ts` & `src/components/hsyncad/properties.tsx`):**
  - Kolon/Perde: `baseOffset` (alt kot farkı), `topOffset` (üst kot farkı), `heightMode` (`"fixed"` veya `"story"`).
  - Kiriş: `topOffset` (tavan kotuna göre kot farkı), `alignment` (`"center" | "left" | "right"`), `offset` (yanal kaçıklık).
  - Döşeme: `topOffset` (kat tavanına göre kot farkı).
  - Özellikler müfettişinden (`properties.tsx`) bu kot farkları ve geometrik özellikler doğrudan düzenlenebilir.

### 3. Kiriş-Kolon-Döşeme Birleşim Kesişimleri (Junctions)
- **Problem:** Önceki sürümde her eleman bağımsız birer tüm prizma olarak 3B sahneye gönderildiği için birleşim bölgelerinde elemanlar birbirinin içine giriyor, görsel z-fighting ve geometrik çakışma oluşuyordu.
- **hsynCAD Çözümü (`src/lib/hsyncad/junctions.ts` & `src/components/hsyncad/scene3d.tsx`):**
  - **Katı Parçalama Motoru (`resolveJunctions`):** Modeli tüm katlardaki Z düzlemlerine göre dilimler. Katı elemanlar arasındaki ortak hacim `kolon (0) > perde (1) > kiriş (2) > döşeme (3)` hiyerarşisiyle Boolean fark algoritması (`subtractConvex`) ile ayrıştırılır.
  - **Kesişimsiz 3B Parçalar (`SolidPart[]`):** 3B sahnede artık çakışan prizmalar değil, kesişimi düşülmüş ayrık katı parçalar render edilir. Kolon kirişi keser, kiriş döşemeyi keser.
  - **Metraj Tam Eşliği:** `calculateQuantities(model, junctions)` fonksiyonu 3B sahnede çizilen aynı katı parçaları kullanarak net hacmi hesaplar. Böylece 3B görünüm ile metraj tablosundaki m³ değerleri birebir örtüşür.

Uygulama sonlu eleman, deprem/dinamik analiz, pafta veya DWG aktarımı yapmaz. Geliştirme ve doğrulama yereldir; Vercel dağıtımı yapılmadı. Kullanım ve doğrulama kaydı: [hsyncad-test.md](hsyncad-test.md).
