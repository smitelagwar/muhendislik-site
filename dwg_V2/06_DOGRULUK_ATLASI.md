# 06 — 2D doğruluk atlası: geometri, metin, pafta ve görünüş

> **Araştırma katmanı:** Bu belgedeki alternatifler ve öneriler Gemini için seçim yetkisi değildir. Kullanıcının son talimatıyla [00 — EXEC-2](00_BAGLAYICI_UYGULAMA_KARARLARI.md) ve [19 — sabit uygulama sırası](19_GEMINI_ADIM_ADIM_UYGULAMA.md) geçerlidir. Çelişen seçim/scope ifadeleri tarihsel araştırma olarak kalır; Gemini uygulamaz.

[Dizin](README.md) · [Mimari](05_SISTEM_MIMARISI.md) · [Doğrulama programı](11_DOGRULAMA_PROGRAMI.md)

Bu atlas önerilen kapsamı ve doğrulama sorularını tanımlar; uygulanmış destek listesi değildir. Özellik sırası gerçek corpus'a göre değişebilir. **Bir özelliği parse etmek, doğru sahneye dönüştürmek ve doğru çizmek ayrı kanıtlar gerektirir.**

## Destek profilleri

- **Temel model:** LINE/ARC/CIRCLE/LWPOLYLINE, layer, blok ve TEXT. Yalnız geliştirici prototipi için yeterli olabilir.
- **2D mesleki çizim:** Öncekilere ek MTEXT/SHX, DIMENSION, HATCH, çizgi tipleri/kalınlıkları, attrib, spline, kaynak sıralaması, clipping ve kalite uyarıları.
- **2D pafta:** Model + paper space/layout, birden fazla viewport, viewport katmanları, XREF, raster/underlay ve annotation bağlamı.
- **Özel nesneli 2D:** AEC/proxy/OLE/table gibi içeriklerin doğrulanan görünüşü veya açık sınırlamaları.

Kullanıcının nihai mimari/statik hedefi yalnız “temel model” değildir. Bir dosyada özel nesne görünür ve önemliyse onu genel bir “kapsam dışı” etiketiyle sessizce saklamak yerine kısmi durumu gösterilir.

## Öncelikli özellik matrisi

`Çekirdek`, `mesleki`, `pafta` faz isimleridir; kullanıcı için önem derecesini düşürmez.

| Özellik | Önerilen faz | Kritik anlam | Bağımsız oracle |
|---|---|---|---|
| LINE / POINT | Çekirdek | Uç nokta, sıfır uzunluk, nokta görünümü | Sayısal koordinat ve ekran işareti |
| ARC / CIRCLE | Çekirdek | Açı yönü, normal, tam tur | Merkez/radyüs/uç nokta |
| LWPOLYLINE | Çekirdek | Bulge işareti, kapalı kenar, genişlik | Pozitif/negatif ve büyük bulge |
| 2D POLYLINE / VERTEX / SEQEND | Mesleki | Eski çizimler, fit/spline flagleri | Eski sürüm fixture |
| ELLIPSE / SPLINE | Mesleki | Parametreler, ağırlık, knot, kısmi yay | Analitik örnek ve adaptif hata |
| BLOCK / INSERT / MINSERT | Çekirdek → mesleki | Base point, nesting, aynalama, array | İç içe matris ve görünür instance |
| ATTDEF / ATTRIB | Mesleki | Sabit/değişken/gizli yazı, owner | Kaynak ile instance metni |
| TEXT / STYLE | Çekirdek → mesleki | Hizalama, baseline, font, width | Yazı ankrajı ve gerçek glyph |
| MTEXT | Mesleki | Format, stack, paragraf, mask, column | Metin span ve yerleşim |
| SHX / SHAPE / BIGFONT | Mesleki | Stroke, advance, sembol eşlemesi | Exact font hash'li küçük fixture |
| DIMENSION | Mesleki | Ölçü yazısı/override/style/anonim blok | Kaydedilmiş görünüş ve semantik |
| LEADER / MLEADER | Mesleki | Ok, landing, metin/ATTRIB bağlamı | Ok ucu ve metin bağlantısı |
| HATCH / SOLID / TRACE | Mesleki | Ada, delik, pattern/fill | İç/dış dolgu ve desen fazı |
| RAY / XLINE | Mesleki | Sonsuz doğru finite viewport'a kırpılır | Kamera değişiminde devamlılık |
| TABLE | Pafta | Hücre/satır metni ve sınırları | Kritik tablo içeriği karşılaştırması |
| LAYOUT / VIEWPORT | Pafta | Çizim → görünüm → kâğıt dönüşümü | Döndürülmüş ve kırpılmış pafta |
| LAYER / viewport override | Çekirdek → pafta | Off/frozen/locked/plot ayrımı | Görünürlük ve kaynak sıfırlama |
| XREF / XCLIP | Pafta | Bağımlılık, nesting, clip, insert | İki dosyalı referans paketi |
| IMAGE / IMAGEDEF | Pafta | Raster yolu, çözünürlük ve clip | Kontrollü görsel altında çizgi |
| WIPEOUT / draw order | Mesleki | Maske, alttaki verinin örtülmesi | Üst üste renkli geometri |
| PDF underlay | Pafta/uyumluluk | Dosya/sayfa/ölçek/clip | Bilinen sayfa köşe eşlemesi |
| OLE2FRAME | Corpus'a bağlı erken | Gömülü tablo/resim olabilir | Statik görünüş; aktif içerik çalışmaz |
| Proxy / AEC / dynamic block | Corpus'a bağlı erken | Kaydedilmiş görünür temsil | Referans uygulama ve coverage |

Bu tabloda yer almayan sınıflar sayılır ve raporlanır. Sadece bilinen entity listesi tutulup diğer sınıflar parse sırasında kaybedilmez.

## 2D'ye geçmeden koordinatı doğru anlamak

Önerilen yol: **entity'nin gerçek koordinat sistemi → blok/XREF dönüşümleri → WCS → seçilen 2D görünüm düzlemi → viewport/kâğıt → ekran**. Bütün entity'lere aynı OCS dönüşümünü uygulamak veya başta Z değerini sıfırlamak hatalıdır. Autodesk tablosu LINE/POINT, planar entity'ler, DIMENSION ve VIEWPORT için farklı koordinat yorumları verir. [OCS belgesi](https://help.autodesk.com/cloudhelp/2018/ENU/AutoCAD-DXF/files/GUID-D99F1509-E4E4-47A3-8691-92EA07DC88F5.htm).

Extrusion normal normalize edilir; sıfır/NaN normal diagnostic üretir. Autodesk'in arbitrary axis algoritması için bağımsız ±Z ve eğik normal fixture'ları kullanılabilir. [Algoritma](https://help.autodesk.com/cloudhelp/2015/ENU/AutoCAD-DXF/files/GUID-E19E5B42-0CC7-4EBA-B29F-5E1D595149EE.htm).

Kamera default'u modelde top view olabilir, ancak kaydedilmiş 2D görünüm veya layout tercihinin doğruluğu ayrı test edilir. Perspektif/3D viewport bulunduğunda tüm nesneleri zorla XY'ye basmak yerine destek sınıfı açıklanabilir. Ürün 3D orbit sağlamadan 3D koordinatlı planar geometriyi doğru 2D gösterebilir.

### Blok dönüşümü

Şematik sütun-vektör gösterimi: `parent × OCS × T(insert) × R(rotation) × S(scale) × T(-base) × point`. Gerçek decoder hangi alanları WCS'ye zaten çevirmişse buna göre uyarlanır; ikinci kez dönüşüm uygulanmaz. MINSERT satır/sütun aralığının hangi düzlemde/döndürme sırasıyla etkili olduğu fixture ile sabitlenir. [INSERT alanları](https://help.autodesk.com/cloudhelp/2021/ENU/AutoCAD-DXF/files/GUID-28FA4CFB-9D5E-4880-9F11-36C97578252F.htm).

Negatif scale winding ve yazı aynalamasını etkiler. Non-uniform scale altında circle/arc elipse dönüşebilir; yalnız radius'u tek sayıyla çarpmak doğru değildir. Açı, kalınlık, linetype ve clip dönüşümleri geometriyle tutarlı ilerler. ATTRIB konumu decoder tarafından yerleştirilmişse INSERT matrisini tekrar uygulamak kaçınılacak bir double-transform hatasıdır.

Nested block döngüsü veya aşırı derinlik toplam işi sınırlayabilir. Aynı block definition ortak kullanılsa da BYBLOCK/BYLAYER, layer 0 ve instance'a özel attribute değerleri ayrı çözümlenir.

### Hassasiyet ve ölçü

Canonical geometri ve kamera dünya merkezi Float64 kalabilir. GPU için `world - localOrigin` farkı Float64 hesaplanıp Float32'ye çevrilir; büyük iki Float32 değeri GPU'da çıkarmak kaybedilmiş hassasiyeti geri getirmez. Tek global origin çok büyük yayılımlı çizimlerde yetmeyebilir; chunk/blok bazlı origin + kamera göreli dönüşüm önerilir.

Sayısal tolerans `absError ≤ max(absoluteTolerance, relativeTolerance × localScale)` olarak tanımlanabilir. `localScale`, örneğin ölçülen boyut veya lokal geometri boyudur; 4 milyonluk harita koordinatını otomatik tolerans ölçeği seçmek küçük detay hatalarını saklayabilir. Görsel hata CSS pikseli ve DPR ile, ölçüm hatası kaynak birimiyle ayrı değerlendirilir.

`$INSUNITS`, blok birimi, dimension `DIMLFAC` ve kullanıcı kalibrasyonu birbirinin yerine kullanılmaz. Units belirsizse çizim birimi gösterilir. Paper space üzerinden ölçümde seçilen viewport ve ölçeğin kaynak koordinatına dönüşümü açık olur. V2 ölçümü sonraki faza bırakılabilir; bırakılırsa menüde yetenek varmış gibi gösterilmez.

## Eğriler ve geniş çizgiler

Bulge için klasik ilişki `theta = 4 × atan(b)`. Kiriş uzunluğu `c` ve `b != 0` için `r = c × (1+b²)/(4×|b|)`. `b=0` doğrusal kenardır. Negatif, büyük, çok küçük bulge, kapalı son kenar ve sıfır kiriş ayrı sınanabilir. Sweep yönü OCS normal/ayna ile birlikte taşınır; sadece `abs(b)` ile tessellation yapılmaz.

Çember/yay tessellation'ında düzlemdeki kiriş sapması başlangıç kontrolü olabilir: `r × (1-cos(deltaTheta/2)) ≤ epsilon`. Non-uniform transform ve projeksiyon sonrası ekran hatası ayrıca sınanır. Spline için degree, knot sırası, multiplicity, rational weight, periodic/closed ve tolerans birlikte değerlendirilir. Adaptif subdivision'a iş/segment sınırı ve görünür kalite uyarısı eklenebilir.

WebGL native line kalınlığını CAD lineweight çözümü saymak yerine quad/stroke mesh düşünülebilir. Lineweight'in kâğıt/fiziksel anlamı, polyline model-space genişliği ve antialias minimum ekran kalınlığı ayrı kavramlardır. Join/cap/miter limit, değişken başlangıç-bitiş genişliği ve self-overlap testleri gerekir.

Linetype kesikleri dünya ölçüsünde ilerler; segment veya tile sınırında pattern fazı sıfırlanmaz. `LTSCALE`, entity scale, `PSLTSCALE/MSLTSCALE`, polyline generation ve shape/text içeren karmaşık desenler aşamalı desteklenebilir. Dash render LOD'si gerçek kesikli eksen çizgisini sürekli çizgiye kalıcı çevirmemeli.

## Renk, katman ve sıralama

ACI, true color, transparency, BYLAYER/BYBLOCK ve layer 0 inheritance ayrı çözülür. Kilitli katman görünmez katman değildir. Frozen/off ve viewport-specific frozen katmanları ayırt edilir; plot flag ekran görünürlüğüyle eşitlenmez. [LAYER alanları](https://help.autodesk.com/cloudhelp/2018/ENU/AutoCAD-DXF/files/GUID-D94802B0-8BE8-4AC9-8054-17197688AFDB.htm).

Kaynak renk/monochrome ve background tercihleri kaynak renk değerini mutasyona uğratmadan render stili olabilir. ACI 7 gibi background'a bağlı renkler ile gerçek siyah/beyaz ayrımı referansla doğrulanır.

Draw order, SORTENTSTABLE/owner düzeni, maskeler ve transparan içerik dikkate alınır. “Tüm hatch önce, tüm text sonra” genel kural değildir. Wipeout, image, text background mask ve clip push/pop, batching'i kesebilen order sınırları oluşturur. Spatial index sorgu sırası kaynak çizim sırası yerine kullanılamaz. GPU instancing sadece görünüş ve sıralama eşdeğerliği korunabiliyorsa uygulanır.

## TEXT, MTEXT, Türkçe ve fontlar

Önerilen metin yolu: **byte kodlaması → DXF kontrol kodları → rich-text span → gerçek font çözümü → glyph metrics/shaping → CAD layout → dönüşüm → render**. Bir font adı eşlemesi gerçek glyph/advance eşitliğini kanıtlamaz.

Kontrol listesi: `ı/İ/ğ/Ğ/ş/Ş/ç/Ç/ö/Ö/ü/Ü`, derece, çap, ±, üst/alt çizgi, Unicode escape, satır sonu, çift yönlü içerik, width factor, oblique, align/fit, backward/upside-down flag, farklı ankrajlar, rotation, line spacing, paragraph width, fraction stacking ve mask.

MTEXT group 3 parçaları ve son group 1 doğru birleştirilir; rotation veya direction vector alanlarının anlamı ayrıca çözülür. Raw DXF substring'i HTML gibi işlenmez. [MTEXT referansı](https://help.autodesk.com/cloudhelp/2023/ENU/AutoCAD-DXF/files/GUID-5E5DB93B-F8D3-4433-ADF7-E92E250D2BAB.htm).

Font çözüm önerisi: exact dosya + hash → kullanıcı/proje için izinli eşleme → lisanslı fallback → görünür kalite kaydı. Exact SHX yoksa Arial seçmek açılmayı sağlayabilir, fakat aynı font bulundu denmez. SHX stroke kalınlığı, ascender/descender, advance ve özel sembolleri TTF dolu glyph gibi ele almak mimari görünüşü bozabilir. Glyph atlas cache anahtarı font byte hash'i, glyph ID, render yöntemi ve gerekiyorsa çözünürlük/variation içerir.

HarfBuzz kullanılacaksa CAD metninin kerning/ligature beklentileriyle eşleştirilir. HarfBuzz MTEXT'in paragraf, stacking ve CAD hizalama motoru değildir. Küçük yazıda MSDF, outline veya raster glyph seçenekleri aynı font ve zoom koşulunda karşılaştırılır. Cache font değişiminde text bounds/spatial index'i de yeniler.

R004 dosyası özel erken testtir: header ANSI_1254 demesine rağmen AC1021 ve tüm byte akışı geçerli UTF-8. “Header böyle dedi” diye zorla CP1254 decode etmek doğru değildir. Diğer bozuk/nonstandard dosyalarda kontrollü recovery ayrı kalite durumu taşır; metin sessizce değiştirilmez.

## Dimension ve annotation

DIMENSION yalnız mesafeyi hesaplayıp ortasına yazmak değildir. Kaydedilmiş anonim block görünüşü mevcutsa source semantics ile birlikte kullanılabilir; decoder bu temsili vermiyorsa style/override ile regeneration ayrı sorumluluktur. Kaydedilmiş görünüş ve semantik uyuşmazlığı rastgele birini seçerek saklanmaz.

Rotated/aligned/angular/radial/diameter/ordinate örnekleri; ok block'ları, extension offset, text override, prefix/suffix, alternate unit, tolerance, precision, dimscale ve annotation scale bağlamı sınanabilir. Çizimde “25” yazıyor diye world mesafenin 25 olduğu veya ölçü biriminin cm olduğu çıkarılmaz. Otomatik geometri regeneration kaynak metnini değiştirmez.

MLEADER, TABLE ve dynamic block display state, ordinary 2D projede bulunabilir. Dynamic block düzenlemesi ürün dışında; dosyaya kaydedilmiş görünür state/proxy yeterliyse görüntüleme desteklenebilir. Visibility state'i yanlış okuyup bütün alternatif kapı şekillerini birlikte çizmek kabul değildir.

## Hatch ve clipping

Hatch'te solid/pattern/gradient, loop tipi, winding, ada düzeyi, OCS/elevation ve associativity ayrı işlenir. Normal/outer/ignore stilleri farklı dolgu alanı oluşturur. [HATCH alanları](https://help.autodesk.com/cloudhelp/2023/ENU/AutoCAD-DXF/files/GUID-C6C71CED-CE0F-4184-82A5-07AD6241F15B.htm).

Pattern çizgisi açı, base point, offset ve dash dizisiyle tanımlanabilir. Pattern fazı kamera veya chunk origin değiştiğinde kaymamalı. Analitik shader iyi aday olsa da bütün karmaşık hatch biçimlerinin tek shader ile çözüldüğü varsayılmaz. Önce normalize edilmiş geçerli loop topolojisi; sonra üçgenleme veya stencil/clip ve pattern çizimi denenebilir.

Yoğun taramayı uzakta geçici sadeleştirmek etkileşim sırasında yararlı olabilir. Dinlenme anında kalite geri gelir; hazır durumu ve screenshot/export gerçek quality tier'ını taşır. Hatch henüz hazırlanmadığında alttaki geometri yanlış anlam üretebiliyorsa kısmi durum açık gösterilir.

XCLIP, viewport clip, image clip ve wipeout aynı primitive değildir. İç içe clip stack, ters clipping ve alpha sınırları ayrı test edilebilir. Parçalara bölünmüş çizimde maske birden çok tile'ı etkileyebilir; her tile kendi world alanında global order'a uygun komutları alır.

## Layout ve paper space

Kullanıcıya Model ve Paftalar listesi önerilir. Aktif pafta seçildiğinde kâğıt sınırı ve viewport'lar doğru ölçü/döndürme ile görünür. Viewport'un center, view target, direction, view height, twist, frozen layers ve polygon clip alanları birlikte yorumlanır. [VIEWPORT referansı](https://help.autodesk.com/cloudhelp/2025/ENU/AutoCAD-DXF/files/GUID-2602B0FB-02E4-4B9A-B03C-B1D904753D34.htm).

Ekrandaki pafta görünüşü ve CTB/STB kullanılmış baskı görünüşü farklı kabul profilleri olabilir. “AutoCAD'e benziyor” karşılaştırması hangi display/plot ayarına göre yapıldığını kaydeder. İlk V2'de yazdırma motoru şart değil; pafta görüntülemesi ise hedefe dahildir. CTB/STB desteği yoksa çıktı/plot paritesi ilan edilmez.

## Eksik ve özel içerik

XREF yüklenmediğinde dosya adı/izin durumu ve etkilenen bölge gösterilebilir; aynı isimli başka projedeki çizim kendiliğinden bağlanmaz. Raster eksikse yalnız çerçeve çizip tam hazır denmez. R004'teki OLE2FRAME'in gerçekten görünür ve önemli olup olmadığı referans incelemesiyle belirlenir; aktif Office içeriği çalıştırmak gerekmez.

Autodesk proxy grafiklerinin dosyaya kaydedilmesi ayara bağlıdır; proxy bulunmayan özel nesnenin tam görünüşü temel geometri reader'ından çıkmayabilir. [PROXYGRAPHICS](https://help.autodesk.com/cloudhelp/2023/ENU/AutoCAD-Core/files/GUID-4205F367-F234-4BE3-86D5-81234684385F.htm). Alternatif: sağlayıcı vectorizer/object-enabler desteği, dosya sahibinin tamamlanmış export'u veya dürüst kısmi görünüm. Veri tahmin edilmez.

Kalite kaydında yalnız entity adet oranı yoktur: kritik yazı/ölçü, alan kapsaması, render edilemeyen instance'lar ve hangi layer/layout'ın etkilendiği vardır. Yüz bin çizgiden tek bir kritik ölçünün eksik olması bile görünüş ve kullanım açısından belirleyici olabilir.
