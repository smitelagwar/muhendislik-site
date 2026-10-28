# hsynCAD — inceleme ve tasarım notu

**28 Ekim devamı:** [Gerçek Ribbon ve güncel kullanım](hsyncad-arayuz.md), [taze REA/Help kanıtı](hsyncad-rea-devam-2026-10-28.md), [bağlantı ve metraj düzeltmeleri](hsyncad-model-devam-2026-10-28.md). Eski Giriş/Görünüm/Proje/Katlar sekme tarifleri tarihsel kalmıştır: yapı elemanları Betonarme, görünüm Görüntü, kat ayarları Kat listesi/Kat Genel Ayarları, örnekler Dosya menüsündedir. Koordinat kutusunda Enter kilitler; ↵ noktayı ekler.

Tarih: 25 Ekim 2026. Kapsam: tarayıcıda kişisel 2B/3B yapı elemanı modelleme ve geometrik metraj MVP'si.

**26 Ekim arayüz düzenlemesi:** İlk satır çizim komutları, daraltılmış Ribbon, gruplu özellikler ve mobil yerleşim için [arayüz notuna](hsyncad-arayuz.md) bakın. REA bulguları ile özgün web tasarımı kararları burada ayrı belirtilmiştir; özgün kaynak haritası kalıcı yerel arşivde korunur.

**Güncel çalışan entegrasyon:** [REA seçeneklerinin modele/2B/3B/metraja bağlanması](hsyncad-rea-entegrasyon.md). Daire/poligon/eğik kolon, eğri/eğimli kiriş, eğrisel perde, eğimli katmanlı döşeme, katman kilidi, yakalama ayarları ve rapor gruplaması burada tanımlıdır. Aşağıdaki tarihsel ikinci aşama notları canlı ideCAD davranışının bütünüyle çözüldüğünü göstermez.

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
- **Tek model:** `model.ts` içindeki JSON `CadModel` sürüm 1'i korur; yeni eleman alanları, `layers`, `snap`, `toolDefaults` ve kat `layerStates` isteğe bağlı uzantılardır. Bütün geometri SI metredir. Kat/materyal/eleman kimlikleri ve bütün referanslar doğrulanır. Statik/TBDY hesap modülü yoktur.
- **Yerleştirme:** Aks yatay/düşey modda tek, serbest modda iki nokta; kiriş/perde iki nokta, kolon tek referans, döşeme basit kapalı poligondur. Koordinat kutusu mutlak/göreli/kutupsal giriş; komut satırı mutlak X/Y kabul eder. Yakalama önceliği kesişim→uç→orta→ızgara özgün bir tercihtir; türler ve piksel toleransı ayarlanır. Aks kesişimleri destek doğrularında hesaplanır. Ağ büyüdüğünde görünür aks çerçevesi genişler; paralel aks son oluşturulana ilerler.
- **Görünümler:** SVG aktif katı, Three.js bütün görünür katları aynı modelden çizer. Plan +Y, 3B −Z; yükseklik 3B +Y'dir. Mobilde 2B/3B anahtarı tek görünüm açar; metraj/özellikler çekme panelindedir. Dokunmatik pan/pinch ve OrbitControls korunur. Katman rengi/eleman rengi, plan çizgi/tarama seçenekleri ve düğüm gösterimi bağlanmıştır.
- **Düzenleme:** Kesit/kot/konum/malzeme/katman, oluşturma varsayılanları, taşıma, silme, 80 adımlık geçmiş. Yeni kolon/perdeler kat tavanına bağlı; eski mod belirtilmemiş dosyalar fixed kalır. Katlar üste/alta eklenir, kopyalanır, elemanlarıyla silinir. Katmanlar görünürlük ve kilit taşır; gizli/kilitli elemanlar metrajdan çıkarılmaz. Mimari kot farkı yalnız referans gösterimidir.
- **Metraj:** Yatay prizmalarda dışbükey çokgen farkı/Z dilimi; eğimli kiriş/döşeme ve eğik kolonda düzlemle çokyüzlü kırpma. Ortak hacim kolon→perde→kiriş→döşeme ve kimlik sırasıyla bir kez atanır. 3B aynı ayrık parçaları çizer. Hata halinde net `null`, katı model boş ve belirgin hata mesajı vardır; brüt katılara dönüş yoktur. Kalıp brüttür. Kat/tip/materyal/eleman raporları ve CSV; elle girilen donatı kg ve plan alanından yük toplamları ayrıca sunulur. Geometri/formül kabulleri güncel entegrasyon belgesindedir.
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
  - **Uzantı ve Balonlar:** `extendedAxisEndpoints` fonksiyonu ile aks çizgileri plan ve 3B görünümde modelin dışına taşarak okunur; balonlar `labelSide` ("both" | "start" | "end" | "none") seçeneğine göre çizilir.

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


## 27 Ekim 2026 — resmî Help ile çizim akışının tamamlanması

[Güncel kullanım, kaynak ayrımı, mimari ve kapsam](hsyncad-cizim-akisi.md). REA JSON’ları tekrar incelendi; kolon/kiriş/perde/döşeme yerleştirme sırası resmî Help üzerinden araştırıldı. Yeni ölçüm, lokal koordinat ve referans araçları aynı modele bağlandı. Kaynak arşivi `C:\Users\hsyn\Desktop\hsyncad\incelemeler\idecad-rea\help-cizim-akisi-2026-10-27` altındadır; özgün büyük JSON dosyaları korunur.


## Yeni REA Ribbon kanıtı — 27 Ekim

[Gerçek ana/alt komut hiyerarşisi, kapsam ve düzeltilen masaüstü hataları](hsyncad-rea-denetim.md). Eski seçilmiş haritada atlanan dört RT_RIBBON XML şablonu çözüldü: 917 benzersiz ID–sembol çifti, 3.885 komut yerleşimi. Kalıcı arşiv `denetim-2026-10-27` altındadır.

## Kalıcı kullanıcı tercihi — 28 Ekim 2026

Kullanıcı çelik yapılarla ve çelik birleşim işleriyle ilgilenmiyor. Çelik modelleme, çelik tasarım, çelik birleşim ve çelik detay/metraj geliştirmeleri hsynCAD ürün kapsamı dışındadır. Açık yeni talep olmadıkça bunlara zaman ayrılmayacak ve üstte Çelik/Birleşim sekmeleri yeniden eklenmeyecektir. Görünür ürün 10 sekmedir; diğer sekmelerde açıkça Çelik/STEEL olarak etiketlenen komutlar da süzülür. Arama ve klavye sekme geçişi aynı ürün kapsamını kullanır. REA'nın 12 sekmeli ham kaynak manifesti araştırma kanıtı olarak değiştirilmeden korunur; ürün görünümü `product-ribbon.ts` ile ayrılır.

## Kullanıcı kapsamı ve uçtan uca denetim — 28 Ekim 2026

Çelik ve Birleşim sekmeleri kaldırıldı; çelik işleri kalıcı olarak kapsam dışı. Ham REA manifesti korunur, ürün10sekme kullanır. [Komut bağlantı envanteri](hsyncad-komut-baglanti-denetimi.md) kaynakta bağlı/kısmi/pasif komutları ayırır. [Boş modelden gerçek kullanıcı denemesi](hsyncad-gercek-kullanici-denetimi.md) iki katlı yapının yalnız arayüzle çizilip düzenlenmesini, metraj ve gerçek JSON/CSV indirmelerini ve yeniden açılmasını belgeler. Başarılı geometrik modelleme akışı bütün komutların veya tam statik proje tesliminin tamamlandığı anlamına gelmez.

Yanlış12572bağlantısı kaldırıldı: Kontur Seçerek Döşeme Oluştur artık elle poligon modunu başlatmaz. Köşelerle çiz gerçek web çizim bandında kullanılabilir. Kat listesi/ızgara/lokal orijin/düğüm yakalama/döşeme kenarı ayarlarının kısmi web karşılıkları yıldız ve açıklama taşır. Diğer pasif komutların durumu değişmedi.
