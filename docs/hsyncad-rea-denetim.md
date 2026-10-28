# hsynCAD — REA Ribbon araştırması ve masaüstü düzeltmeleri

27 Ekim 2026. Bu belge, önceki arayüz haritasındaki boşluğu kapatan yeni REA incelemesini ve bundan ayrı yapılan web doğrulamasını kaydeder. Hedef masaüstü tarayıcıdır.

## Gerçek REA kanıtı

Kurulu `ideCAD_Statik_11_Deneme.exe` yeniden, salt okunur `inspect_pe_resources` çağrısıyla incelendi. Dosya 213.281.352 byte; SHA-256 değeri önceki kayıtla aynı: `a4dcabe8680507c1444a4cb40a2f908f9bf51120929a8f763b425b60ff2cbdd3`.

Yeni kanıt: `ev_9f35633090bc9cccb12487a0c5d6ca7477bea0b3714390ab98cc619d1d6677e2`. REA 9.243 dizin girdisi / 4.613 kaynak bildirdi. Tam Evidence paketi arşivlendi.

Önceki seçilmiş kaynak haritası `RT_MENU`, `RT_DIALOG`, `RT_STRING` ve stilleri içeriyordu; **RT_RIBBON (28) kaynaklarını içermiyordu**. Yeni envanterdeki 25950, 25951, 25955, 25956 ID'li dört `AFX_RIBBON` XML şablonu, özgün salt okunur ayrıştırıcıyla çözüldü. Her kaynak aralığı ve SHA-256 REA kanıtına karşı doğrulandı. İkon veya bitmap çıkarılmadı; ideCAD çalıştırılmadı, kurulum dosyaları değiştirilmedi.

- Dört şablonda toplam **3.885 komut yerleşimi**, **917 benzersiz ID–sembolik ad çifti**.
- Her komutta sekme/panel/ebeveyn düğme yolu, ID, sembol, XML ofseti ve mevcut RT_STRING açıklaması korunur.
- `ELEMENT` kapsam sayıları şablonlarda birebir: 931/931, 1047/1047, 1351/1351, 1085/1085. İki ayrıştırma çalışması aynı çıktı hash'ini verdi.
- Kullanıcının son ekranının sekme sırasına uyan **25955**, statik adaydır; çalışan uygulamada hangisinin seçildiği gözlenmedi.
- Modelleme için seçilen alt küme **141 yerleşim / 128 benzersiz çift**. Kaynak karşılaştırmasında 17 doğrudan, 27 kısmi, 97 uygulanmamış karşılık vardır; bu ideCAD'in tamamı için bir tamamlanma yüzdesi değildir.

## Amaç için önemli ayrımlar

| Native kaynak | Webdeki karşılık / sınır |
| --- | --- |
| Ana Aks `12590`; Kontur Hesapla `13980`, Kontur Çizgileri `12660`, Etiket Taşı `12673`, Ayarlar `12580` | Temel aks/ağ/ofset vardır; native kontur sistemi ve yay akslar tam uygulanmış değildir. Yay/üç nokta komutları bazı yerlerde alt menü yerine kardeş düğmedir. |
| Sürekli kiriş `CM_DRAW_MULTIBEAM=12910` | Sürekli kiriş varsayılanı Ribbon ve RT_STRING ile desteklenir. Yay türlerinin native bütün etkileşimleri eşdeğer değildir. |
| Uzaklık `13660`, Alan `13650`, Açı `40221` | Ölçüm/referans araçlarıdır; web sabit seçilen koordinatları saklar. |
| Serbest/iç/dış/kesişim ölçülendirme ve kot komutları | Ayrı kalıcı ölçülendirme ailesidir; webdeki ölçüm kayıtları bunun yerine geçmez. |
| Geçici Lokal Nokta `13060` | Kalıcı tek noktalı web lokal sistem orijini ile aynı yaşam döngüsü değildir. Native geçici nokta komutu henüz uygulanmadı. |
| Lokal koordinat sistemi `40232`, etkinleştirme `40233` | Webde orijin/dönük eksen/global dönüş vardır; native komut akışlarıyla tüm ayrıntılarda eşlik yoktur. |

Kaynak hiyerarşisinin çıkarılması, tüm düğmelerin webde uygulanması veya native handler'ların canlı gözlenmesi demek değildir. Dinamik yardımcı araç çubukları, etkin/pasif koşulları, tam snap önceliği ve native algoritmalar bilinmeyen olarak korunur. Aks ofseti 25955 Ribbon yerleşiminde bulunamadı; bu, native uygulamada olmadığına kanıt sayılmadı.

## Webde doğrulanıp düzeltilen sorunlar

1. **Ölçüm/referans sığdırma:** 100,100 → 103,104 ölçümü boş yapı modelinde görünüm dışında kalıyordu. Fit artık yapı, ölçüm, referansın sonlu tanım noktaları ve etkin lokal orijini kapsar. Fit/wheel/uzaklaştırma ölçek sınırları eşitlendi; büyük alana fit sonrası zoom sıçraması kaldırıldı.
2. **Geçersiz koordinat:** `X=abc` ölçümün ilk noktasını NaN yapıp sonraki geçerli girişleri de engelliyordu. Ortak giriş kapısında sonlu ve ±1.000.000 m kontrolü yapılır; geçersiz nokta taslağa veya son nokta kaydına yazılmaz.
3. **Kotları karışan otomatik döşeme sınırları:** Alan yalnız plan çizgilerinden üretiliyordu. `slabRegionsAtLevel`, yatay döşemenin gerçek üst/alt beton kot bandındaki eleman hacimlerini kullanır. Ayrı kottaki çerçeveler ve yardımcı kenarlar ayrılır. Eğimli kiriş/eğik kolon, mevcut özgün çokyüzlü motorunda yatay düzlemlerle kesilip plan izdüşümü alınarak değerlendirilir. Bu, native ideCAD algoritmasından alınmış değildir.
4. **Bağlı döşemede sessiz sınır eskimesi:** Yalnız eski sınırların plan konumu takip ediliyordu; kot değişikliği ve yeni ayırıcı eleman gözden kaçabiliyordu. Geometri/kot imzası değişince bağlı kapalı alan tekrar bulunur. Çevre açılır veya bölünürse düzenleme atomik reddedilir. Kullanıcı Özellikler'den **Otomatik çevre bağını ayır** seçip Uygula ile serbest poligona dönebilir.
5. **Yardımcı kenar kotu:** `slabEdge` başlangıç/bitiş kot farklarını JSON'da korur, doğru 3B kotta çizilir ve yalnız uyumlu kotta sınır oluşturur. Oluşturma kotu döşeme araç ayarından alınır; mevcut kenar kotları özelliklerden düzenlenir.

Kot kabulü resmî [Döşeme Ayarları](https://help.idecad.com.tr/ideCAD/doeseme-ayarlari) ile karşılaştırıldı: üst yüz kat tavanı + kot farkıdır; kalınlık aşağıya uzanır. [Aynı katta farklı kotlar](https://help.idecad.com.tr/ideCAD/ayn-katta-farkl-kotlarda-doseme-nasl-olusturabilir) rehberi, arakat kiriş/döşeme/kenar kotları ve katman ayrımının ayrı yönetildiğini gösterir. Webin kot bandı filtresi ve atomik ret politikası kendi modelleme kararımızdır.

## Ölçülü kontroller ve kapsam

- 4×4 m çevre, b=0,25 m kirişler ve 0,40×0,40 m köşe kolonları: iç döşeme **14,04 m²**.
- Çerçeve bir metre aşağıda, döşeme üst kotta: otomatik alan **yok**. Döşeme de −1 m: aynı **14,04 m²**.
- Üst üste iki ayrı çerçevede yalnız ilgili kotun sınır kimlikleri kullanılır.
- 4×3 m yardımcı kenar çevresi yalnız eşleşen kotta **12 m²** alan oluşturur; beton/kalıp miktarı üretmez.
- Eğimli kirişte yatay kot bandına giren kısmın plan alanı **0,075 m²**; 0,60 m eğik kolonun üst bandında X sınırları **0,37 / 0,80 m** ile karşılaştırıldı.
- Daha önce doğrulanan net beton örneği **8,0885 m³** korunur.

**Açık sınırlar:** Otomatik alan tanıma yatay döşeme kot bandı içindir. Eğimli döşemede yanlış otomatik alan üretmek yerine **Köşelerle çiz** istenir; manuel eğimli katı ve metraj desteklenir. Bantta kalan hacmin plan izdüşümü kullanılır; bu tüm geometriler için bir BIM temas/taşıyıcılık veya statik uygunluk denetimi değildir. Yeni bir ayırıcı eklenince bağlı döşemeler kendiliğinden iki nesneye bölünmez; kullanıcıya yeniden tanımlama/bağ ayırma gerekir. Gizli katmanlar veri modelinde ve metrajda kalır. Pafta, DWG, analiz/tasarım kapsamı değişmedi.

## Kalıcı arşiv ve tekrar kullanım

`C:\Users\hsyn\Desktop\hsyncad\incelemeler\idecad-rea\denetim-2026-10-27`

Ana dosyalar: `rea-evidence-bundle.json`, `ribbon-komut-hiyerarsisi.json`, `modelleme-komutlari.json`, `parse-ribbon-resources.cjs`, `filter-modelleme-komutlari.cjs`, `ribbon-ana-alt-tuslar.md`, `modelleme-kapsam-ozeti.md`, `desktop-audit.md`, `dogrulama-sonuclari.json`. Eski arşiv ve büyük JSON'lar korunur; araştırma dosyaları web istemci paketine eklenmez. Test sonucu güncellemeleri [hsyncad-test.md](hsyncad-test.md) içindedir.
