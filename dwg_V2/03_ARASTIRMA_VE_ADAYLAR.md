# 03 — Araştırma, SDK seçenekleri ve GitHub inceleme listesi

> **Araştırma katmanı:** Bu belgedeki alternatifler ve öneriler Gemini için seçim yetkisi değildir. Kullanıcının son talimatıyla [00 — EXEC-2](00_BAGLAYICI_UYGULAMA_KARARLARI.md) ve [19 — sabit uygulama sırası](19_GEMINI_ADIM_ADIM_UYGULAMA.md) geçerlidir. Çelişen seçim/scope ifadeleri tarihsel araştırma olarak kalır; Gemini uygulamaz.

[Dizin](README.md) · [Karar çerçevesi](04_KARAR_CERCEVESI.md) · [Kaynakça](16_KAYNAKCA.md)

**Yöntem:** 5 Eylül 2026'da birincil ürün belgeleri, depo README/lisans sayfaları, GitHub metadata ve sınırlı issue örnekleri incelendi. SDK'lar satın alınmadı, depolar derlenmedi, doğruluk/performans yarışması çalıştırılmadı. Aşağıdaki değerlendirmeler masa başı araştırması ve mühendislik çıkarımıdır. Bir sağlayıcının başarı iddiası bağımsız test sonucu olarak kullanılmadı.

## Güncel DWG ne demek?

Autodesk'in 27 Mayıs 2026 tarihli uyumluluk tablosu AutoCAD 2018–2027 ürünlerinin doğal dosya biçimini AutoCAD 2018 olarak gösteriyor. Dolayısıyla “R2018 okuyor” ifadesi otomatik olarak “2027 çizimini okuyamaz” anlamına gelmez. Aynı format ailesinde özel sınıflar ve uygulama davranışları yine farklılaşabilir. [Autodesk format tablosu](https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/AutoCAD-drawing-file-format.html).

Ürün desteği, uzantı veya ürün yılından fazlasını kapsamalı: **format ailesi + entity/nesne sınıfı + üretici uygulama + kaynak bağımlılıkları + görüntüleme profili**. Yerel üç DWG'nin AC1032 başlığı güncel aileyi deney başlangıcı için anlamlı kılıyor; bütün AC1032 dosyalarının uyumunu kanıtlamıyor.

## Ticari ve yerleşik SDK yolları

| Aday | Doğrulanan ürün bilgisi | Bu proje için değerlendirme ve deney |
|---|---|---|
| ODA Drawings SDK | DWG/DXF odaklı geliştirme SDK'sı. [Ürün](https://www.opendesign.com/products/drawings) | Kendi sunucumuzda scene hazırlayan decoder/vektörleştirici adayı. Hangi çizim özelliklerini entity verisi veya görünür primitive olarak verdiği denenebilir |
| ODA Drawings inWEB | Browser DWG/DXF API'si ve JS/WASM dağıtım örneği belgelenmiş. [Teknik belge](https://cloud.opendesign.com/docs/drawingapi/index.html) | Hazır görüntüleyici alternatifi ve uyumluluk karşılaştırması. WASM boyutu, telefon RAM'i, fontlar ve kendi renderer'ımıza veri çıkışı trial ile ölçülebilir |
| Autodesk RealDWG | C++/.NET geliştirme SDK'sı; resmi 2027 geliştirme gereksinimleri Windows 11 ve Visual Studio ortamı belirtiyor. [Resmi sayfa](https://forge.autodesk.com/developer/overview/realdwg-api) | Bağımsız native/server reader adayı. Browser WASM paketi veya hazır web görüntüleyici olduğu varsayılmaz; görselleştirme yolu ve host dağıtım hakkı ayrıca netleşebilir |
| APS Model Derivative + Viewer | Çizimlerin viewer için türevlere çevrilmesini sağlayan hizmet. [API](https://aps.autodesk.com/developer/overview/model-derivative-api) | Uyumluluk kontrolü veya hazır hizmet alternatifi. Ağ/dönüşüm kuyruğu/veri aktarımı maliyeti var; kendi renderer formatımızı veya anında ilk açılışı kendiliğinden sağlamaz |
| MLightCAD proprietary parser | Ayrı ticari DWG converter; kapalı npm paketi, mevcut data-model'e entegrasyon beyanı. [Açıklama](https://github.com/mlightcad/cad-viewer/blob/main/PROPRIETARY-PARSER.md) | Düşük entegrasyon maliyetli aday. Daha az RAM/daha yüksek doğruluk iddiası sağlayıcı beyanı; karşılaştırma henüz yapılmadı |

ODA üyelik sayfası web/SaaS kullanımını Sustaining düzeyinde gösteriyor. Core üyelik fiyatı ile seçilecek inWEB/ek modül, dağıtım ve abonelik sonrası haklar aynı şey sayılmamalı. İlgili paket için yazılı koşullar ve gerçek teklif gerekir; [üyelik açıklaması](https://www.opendesign.com/faq/question/how-can-i-join-open-design-alliance-and-use-your-sdks), [fiyatlandırma](https://www.opendesign.com/pricing?language=en).

MLightCAD'in ticari parser belgesi bireysel trial başvurularını kabul etmediğini, şirket/kuruluş trial'ı sunduğunu ve resmi SLA bulunmadığını belirtiyor. “realdwg-web” adını taşıyan ilişkili depoların adı, Autodesk RealDWG lisansı veya Autodesk onayı kanıtı olarak yorumlanmamalı. Satıcı kimliği, lisans zinciri ve teslim edilen kodun hakları ayrıca değerlendirilir. [Ticari parser koşulları](https://github.com/mlightcad/cad-viewer/blob/main/PROPRIETARY-PARSER.md).

APS'te XREF içeren dosya paketleri ayrıca ele alınır; kaynakları ilişkilendirmeden tek DWG yüklemek tam pafta sonucunu garanti etmez. [Autodesk XREF açıklaması](https://aps.autodesk.com/blog/setting-up-references-between-files). Bu oturum kullanıcı çizimlerini hiçbir harici demo veya hizmete yüklemedi.

## Öncelikli açık kaynak depoları

Snapshot'larda HEAD kaydı bulunması önerilen üretim sürümü olduğu anlamına gelmez. Uygulama aşamasında release/tag, lockfile, kaynak tarball ve alt bağımlılıklar birlikte sabitlenebilir.

| Depo / araştırma rolü | Lisans gözlemi | Araştırmada çıkan sonuç | Sonraki somut inceleme |
|---|---|---|---|
| [mlightcad/cad-viewer](https://github.com/mlightcad/cad-viewer) — mevcut karşılaştırma | Ana repo MIT; varsayılan DWG zinciri GPL bileşen içeriyor | Hazır CAD anlamlandırması ve viewer var; yeni özelliklerin kurulu 1.6.2'de bulunduğu varsayılmaz | Data-model → renderer sınırı, primitive üretimi, metin/blok yaşam süresi; salt-okunur paketin maliyeti |
| [mlightcad/libredwg-web](https://github.com/mlightcad/libredwg-web) — browser decoder | GPL-3.0 metadata | LibreDWG tabanlı browser/Node köprüsü; mevcut sisteme yakın karşılaştırma | WASM heap, native → JS çıktı kopyası, hata/finally cleanup ve doğrudan packed export |
| [LibreDWG/libredwg](https://github.com/LibreDWG/libredwg) — native decoder | GPLv3+ resmi açıklama | En geniş ücretsiz adaylardan biri; sürüm okuma beyanı render paritesi değil | Sürüm başlıkları, sınıf kapsaması, hatalı nesneler, SVG/JSON çıkışındaki kayıplar, fuzz altyapısı |
| [DomCR/ACadSharp](https://github.com/DomCR/ACadSharp) — bağımsız decoder | MIT | C#; ASCII/Binary DXF ve DWG reader. Tabloda DWG AC1014–AC1032 okuma desteği var | Linux/.NET servis prototipi, entity kapsamı, proxy/dynamic/layout/dimension extraction; browser .NET WASM varsayılan yapılmaz |
| [mozman/ezdxf](https://github.com/mozman/ezdxf) — referans ve fixture | MIT | Python DXF; ASCII/binary, farklı sürümler, audit ve drawing araçları | Bağımsız sayısal karşılaştırma, fixture üretimi, layout/text davranışı; doğrudan DWG decoder diye seçilmez |
| [vagran/dxf-viewer](https://github.com/vagran/dxf-viewer) — 2D render karşılaştırması | MPL-2.0 | Worker hazırlığı, batching ve instancing zaten var; upstream README metin/pafta/çizgi davranışlarında eksikler listeliyor | `DxfScene`, worker ve batching tasarımı; mevcut yerel yamalar ayrıca karşılaştırılır |
| [gdsestimating/dxf-parser](https://github.com/gdsestimating/dxf-parser) — basit parser kıyası | MIT | DXF metnini JS nesne modeline dönüştüren kütüphane | Entity modülleri, MTEXT/kodlama/binary sınırı; büyük veri için allocation profili |
| [LibreCAD/libdxfrw](https://github.com/LibreCAD/libdxfrw) — ikincil format referansı | GPLv2+ README; API metadata GPL-2.0 | C++ ASCII/binary DXF; DWG okuma yeteneği README'de sınırlı olarak tanımlanıyor | DXF davranışlarını karşılaştırmak; “güncel DWG için hazır tam çözüm” olarak seçmemek |

LibreDWG'nin resmi manual'i yaklaşık %99 format kapsamından söz ediyor; bu değer bu sitedeki gerçek dosyalarda %99 başarı veya AutoCAD'le %99 piksel eşitliği değildir. Manuelde deneme/eksik destek ayrımları da mevcut. [LibreDWG kapsam belgesi](https://www.gnu.org/software/libredwg/manual/html_node/Overview.html).

ezdxf drawing katmanı kendi metin yerleşiminin birebir piksel paritesi olmadığını ve bazı nesne sınırlamalarını açıklar. Bu nedenle tek başına nihai doğruluk hakemi sayılmaz. [Drawing sınırlamaları](https://ezdxf.readthedocs.io/en/stable/addons/drawing.html).

## Yardımcı geometri ve metin depoları

| Depo | Kullanım önerisi | Dikkat edilmesi gereken deney |
|---|---|---|
| [mlightcad/shx-parser](https://github.com/mlightcad/shx-parser) | SHX glyph/stroke çözümlemesi; MIT | Font motorunun lisansı font dosyasını dağıtma hakkı vermez. Türkçe glyph, baseline, advance, SHAPES/UNIFONT/BIGFONT örnekleri |
| [mourner/flatbush](https://github.com/mourner/flatbush) | Statik packed R-tree; ISC; tek buffer aktarımı | Salt-okunur sahneye uygun aday. Tüm çizim/bölge/blok instance indekslerini ayrı dene; sadece indeks kurmak draw order'ı korumaz |
| [mapbox/earcut](https://github.com/mapbox/earcut) | Polygon üçgenleme; ISC | Basit geçerli hatch sınırları için aday; self-intersection ve CAD hatch ada kurallarını çözen tam motor değildir |
| [AngusJohnson/Clipper2](https://github.com/AngusJohnson/Clipper2) | Kırpma/offset/triangulation; BSL-1.0 | Koordinat ölçeklemesi, integer taşması, dar boşluklar ve delik topolojisi kontrolü |
| [harfbuzz/harfbuzz](https://github.com/harfbuzz/harfbuzz) | TTF/OTF shaping adayı | MTEXT layout veya SHX parser yerine geçmez; CAD'in harf aralığına shaping/kerning etkisi golden ile karşılaştırılır |
| [Chlumsky/msdfgen](https://github.com/Chlumsky/msdfgen) | TTF glyph atlas hazırlığı; MIT | Yakın/uzak zoom, küçük yazı, ince stroke; glyph atlas metin anlamlandırma sorununu çözmez |
| [nical/lyon](https://github.com/nical/lyon) | Rust path fill/stroke tessellation adayı | Rust/WASM seçilirse denenebilir. CAD dünya koordinatlarını önce yerel orijine taşı; path float hassasiyetini kontrol et |

HarfBuzz ve lyon için GitHub lisans metadata'sı `NOASSERTION` döndü. Bu “lisanssız” veya “yasak” demek değil: HarfBuzz [COPYING](https://github.com/harfbuzz/harfbuzz/blob/main/COPYING) ana kod için Old MIT açıklıyor; lyon [MIT](https://github.com/nical/lyon/blob/main/LICENSE-MIT) ve [Apache](https://github.com/nical/lyon/blob/main/LICENSE-APACHE) dosyaları içeriyor. Tam dağıtım ağacı ayrıca incelenebilir.

## Bakım durumunu nasıl okuyabiliriz?

15 deponun repo URL'si, branch'i, HEAD SHA'sı, commit tarihi, pushedAt ve archived alanları [snapshot JSON'unda](arastirma/github-snapshot.json) kayıtlı. Bunlar tekrar üretilebilir başlangıç kimlikleri; star sayısı veya son commit tarihi kalite garantisi değildir. Native/WASM bridge'in upstream'e ne kadar geride olduğu, örnek dosyalara verilen yanıtlar, güvenlik düzeltme süresi ve kaynak derlemenin tekrar üretilebilirliği daha anlamlıdır.

Sınırlı açık issue örneklemi [ayrı JSON'da](arastirma/github-issue-ornekleri.json): MLightCAD'de [SHX yükleme konusu](https://github.com/mlightcad/cad-viewer/issues/571); dxf-viewer'da [parse sırasında takılma bildirimi](https://github.com/vagran/dxf-viewer/issues/166) ve [çok satırlı tablo metni bildirimi](https://github.com/vagran/dxf-viewer/issues/164) bulundu. Yalnız başlık/metadata incelendi; burada tekrar üretilmiş kusur veya bizim kurulu sürümümüzün hatası diye sunulmuyor. ACadSharp'ın örnek API sayfasında filtre sonrası sıfır issue kalması, projede açık issue olmadığı anlamına gelmiyor; sayfa PR'lar da içeriyordu.

## Lisansın mimariye etkisi

GPL kodunun tarayıcıya JS/WASM olarak gönderilmesi dağıtım değerlendirmesi gerektirir. Sadece sunucuda çalıştırmak ile tarayıcıya dağıtmak aynı durum değildir; FSF FAQ bu ayrımı açıklar. Worker, iframe, API veya ayrı repo sınırı tek başına bütün lisans sorularını çözen bir yöntem sayılmaz. Nihai paket ve sözleşmeler için uzman incelemesi gerekebilir. [GNU FAQ](https://www.gnu.org/licenses/gpl-faq.html.en#UnreleasedMods).

Mevcut repo zaten LibreDWG runtime'ı ve lisans notice'ı taşıyor. V2'ye ticari parser eklemek mevcut motorun GPL dağıtımını otomatik kaldırmaz; kullanıcı mevcut motoru korumak istiyor. Kaynak sunumu, değişikliklerin lisansı, MPL dosya yükümlülükleri, font/fixture hakları ve ticari SDK şartları ürünün bütün dağıtımı için değerlendirilir.

## Ön eleme önerim

İlk kısa yarışma: **mevcut decoder ile yeni sahne**, **ACadSharp ile server scene**, erişim sağlanırsa **ODA** ve **MLightCAD ticari converter**. DXF doğruluk/fixture için **ezdxf**; render karşılaştırması için mevcut motor ve **dxf-viewer**. RealDWG, Windows/native işletimi ve lisans bütçesi uygunsa ek yüksek uyumluluk adayı. Ham DWG Ar-Ge'si bu yarışmadan ayrı tutulabilir.

Bütün kütüphaneleri ürüne eklemek önerilmiyor. Her araç bir bilinmeyeni çözen küçük deney için var; test sonucunda gereksiz bağımlılık elenir.
