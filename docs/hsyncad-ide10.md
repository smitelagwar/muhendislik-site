# IDE10 görüntüleyici — 29 Ekim 2026

hsynCAD'in sağ altındaki **IDE projeleri** kısayolu, dosya menüsündeki **Model aç** ve çalışma alanındaki **Ctrl+O** artık `.ide10` dosyası açabilir. JSON modelleme alanı ayrı kalır: IDE projesi salt okunur görüntüleyicide incelenir ve mevcut model/geri alma geçmişinin üzerine yazılmaz.

## Veri akışı

`workbench.tsx → ide-project-panel.tsx → ide-reader-client.ts → ide-reader.worker.ts → ide-import/index.ts`.

Dosya tarayıcıda okunur; ArrayBuffer worker'a aktarılır. Worker başarı, hata, süre aşımı, iptal ve panel kapanışında sonlandırılır. Dosya sınırı arayüzde 250 MiB; ayrıştırıcının bağımsız sınırı 512 MiB. Çözülen son görüntüleme verisi IndexedDB `hsyncad.ide-view.v5/projects/last` içinde tutulur. Özgün dosya sunucuya yüklenmez. Tarayıcı depolaması başarısızsa açık proje kullanılmaya devam eder.

Örnek menüsündeki üç kayıt `/api/hsyncad/ide-examples/[id]` üzerinden yalnız yerel bilgisayarda okunur. Kaynak eşlemesi Git dışında `.data/hsyncad/ide-examples.json` içindedir. API sadece sabit örnek kimliklerini kabul eder; farklı dosya yolu parametresi yoktur. `localhost`/`127.0.0.1`/`[::1]` dışında ve Vercel ortamında yanıt 404'tür. Proje dosyaları `public/` içine kopyalanmaz. Uzak sitede dosya seçme çalışır; bu bilgisayarın diskine bağlı örnekler otomatik erişilemez.

## Gözlenen destek

Okuyucu IDE Building Designer `Ver 4 / SubVer 00` içindeki ortak geometri kayıtlarını çözer. CP1254 Türkçe adlar; kat ad/kot/yükseklikleri; özgün çift hassasiyetli plan noktaları; kolon poligonları; kiriş/perde/duvar genişlik ve yanal kaçıklıkları; döşeme/radye sınırları; native kimliklerle bağlı döşeme boşlukları; akslar ve seçili yardımcı çizgiler korunur. Radye ayrımı ad önekinden değil native bayraktan yapılır.

2B görünüm metre ölçeğinde pan, imleç odaklı zoom, dokunmatik pinch, seçim ve ad etiketi sunar. 3B, kaynak plan poligonlarını ve açıklıkları korur; normal yapı elemanlarında katlardan türetilen düşey sınırları, merdivenlerde dosyadaki dünya XYZ noktalarını kullanır. Merdiven analiz yüzeyleri ayrıca kalınlaştırılmaz ve kotlarına ikinci kez kat yüksekliği eklenmez. 2B merdiven sınırları kaynak ağın sınır kenarlarından alınır. Tip bazında birleştirilmiş mesh/kenar tamponları ve yalnız gerektiğinde render kullanılır. Perspektif ile ortografik üst/ön/sağ görünüşler, görünür elemanlara sığdırma, kat/tip filtresi ve çift yönlü seçim vardır.

| Özgün kullanıcı dosyası | Kat | Görüntülenen geometri | Merdiven ağı | Bağlı boşluk | Çözümlenemeyen adlandırılmış kayıt |
| --- | ---: | ---: | ---: | ---: | ---: |
| Süheyla Kara / 218 ada 50 parsel STATİK | 7 | 2.171 | 9 | 107 | 0 |
| Mustafa Selvi 2. Kısım | 5 | 686 | 1 | 27 | 0 |
| Mustafa Selvi 1. Kısım | 6 | 1.273 | 7 | 76 | 0 |

Bant kirişleri (0/12/25) ve kesit çizgileri (14/5/6) native ortak gramer ve kaynak sınırlarıyla doğrulanarak planda gösterilir. Bu kayıtlar `planOnly: true` taşır; kaynakta kanıtlanmayan 3B yükseklik/kalınlık eklenmez.

Bu sayaçlar dosyanın bütün nesnelerinin envanteri değildir. Sınırsız isimsiz byte dizileri başarısız nesne sayılmaz; aday, çözülen geometri, boşluk, reddedilen aday ve desteklenmeyen kayıt hesapları ayrı tutulur. Testler sayaçların birbirini tutmasını doğrular.

## Kesin sınır ve açık işler

**Tam ideCAD eşdeğerliği sağlanmış değildir.** Merdivenlerin kayıtlı analiz yüzeyi çözüldü; ayrıntılı basamak/kaplama/korkuluk ve kapalı katı gövde eşdeğerliği doğrulanmadı. Ağın son model düzenlemesiyle güncelliği bilinmiyor. Donatı/ölçülendirme/pafta biçimi ve analiz sonuçlarının tamamı çözümlenmedi. Elemanların özel alt/üst kot farkları ve eğimli kiriş uç kotları byte alanlarıyla kanıtlanmadı. `verticalSource: 'storey-derived'` bu ayrımı taşır; arayüz bunu gizlemez. Kiriş yüksekliği native kesit etiketiyle doğrulanır; kolon/perde kat tabanı–tavanı aralığında, normal döşeme kat tavanında, radye kat tabanında gösterilir. Sıfır kot yerleşimi için resmî kaynaklar: [kolon](https://help.idecad.com/ideCAD/column-settings), [kiriş](https://help.idecad.com/ideCAD/beam-settings), [döşeme](https://help.idecad.com/ideCAD/slab-settings), [radye](https://help.idecad.com/ideCAD/raft-foundation-settings). Bu belgeler özel byte alanlarının anlamını veya dosyanın sıfır özel kot içerdiğini tek başına kanıtlamaz.

Mevcut REA PE/Ribbon JSON arşivleri özel proje formatını içermiyordu. Yeni okuyucu, kullanıcı tarafından seçilen üç dosyanın salt okunur byte incelemesinden üretildi. REA oturumunda Ghidra/IDA/Kuna sağlayıcısı yapılandırılmamıştı. Computer Use, açık Mustafa Selvi 1. Kısım projesinin başlığını okuyabildi; ekran yakalama `window capture timed out`, tıklama ise `coordinate input geometry is unavailable` verdi. Dolayısıyla ideCAD ile canlı piksel/katı karşılaştırması yapıldığı iddia edilmez. Kullanıcı doğrudan `.ide10` ile devam edilmesini seçti; merdiven grafiği ve saklanan analiz ağı özgün byte verilerinden ayrıca çözüldü. IFC dönüşümü gerekli değildir. Komşu Mustafa 2 PDF raporu farklı kat kotları içerdiğinden aynı revizyonun kesin doğrulaması olarak kullanılmadı.

## Doğrulama

- `node --import tsx --test src/lib/hsyncad/ide-import/index.test.ts`: **4/4**; üç özgün dosyanın SHA-256 kimliği, katlar, seçili elle incelenmiş koordinatlar, Türkçe adlar, 25/50 kesit, native boşluk bağlantıları, temel kotu, kimlik tekilliği, sayaç dengesi, bozuk geometri ve kaynak değişmezliği.
- `HSYNCAD_TEST_URL=http://127.0.0.1:3144 playwright test --config=playwright.hsyncad.config.ts tests/hsyncad/ide-projects.spec.ts tests/hsyncad/site-shell.spec.ts tests/hsyncad/viewport-compact.spec.ts`: **10/10**; üç gerçek dosyanın örnekten açılması, dosya seçimi, son proje geri yükleme, mevcut modelin korunması, hata sonrası devam, iptal, mobil 2B/3B ve 320–844 px çalışma alanı regresyonları.
- `stair-analysis-mesh.test.ts` ile birlikte okuyucu testleri **5/5**: üç dosyadaki 17 ağın XYZ/bağlantıları Node zlib ile bağımsız doğrulandı; checksum, boyut, kesilme, kayıt sınırı, düğüm sayısı, geçersiz bağlantı ve koordinat bozulmaları reddedildi. Merdiven geometri yardımcılarının **6/6** testi geçti.
- Görüntüleyici paketi yüklenemezse hata sınırı mevcut CAD çizimine dönüş ve sayfayı yenile seçenekleri sunar.
- Yeni ve değiştirilen görüntüleyici kaynaklarında ESLint ve uygulama TypeScript kontrolü geçti.
- 3B döşeme açıklığı kontrolü: 10×8 m dış sınır, 2×3 m boşluk ve 0,2 m kalınlık için 14,8 m³; dört dış/iç halka yönü kombinasyonunda boşlukta ray isabeti yok, dolu bölgede isabet var. Bu kontrol örnek proje native katı eşdeğerliği testi değildir.

Son üretim derlemesi başarılıdır: TypeScript ve **684/684** statik sayfa üretimi tamamlandı. Son `.next-ide-v3` üretim sürümünde gerçek üç dosyayı açma/merdiven ve plan filtreleri, geri yükleme, mobil hata/iptal ve eksik görüntüleyici paketi sonrası çizime dönüş testleri **3/3** geçti. Okuyucu, ağ ve geometri yardımcıları toplam **11/11** geçti; atlanan test yok. Çalışan yerel adres `http://127.0.0.1:3145/kategori/araclar/hsyncad`; Vercel yayını yapılmadı. 3144 geliştirme ve 3146 geçici kabul sunucuları kapatıldı; önceden var olan sunucular değiştirilmedi.

Kalıcı inceleme dizini: `../hsyncad/incelemeler/idecad-rea/ide10-2026-10-28/` (uygulama deposunun kardeşi). Özgün dosyaların hash'leri, byte grameri, parser raporu, düşey yerleşim incelemesi, build/test kayıtları ve son production ekran görüntüleri bu arşivdedir.

## 29 Ekim — native görsel karşılaştırma düzeltmesi

Kullanıcının sağladığı dört ideCAD görüntüsüyle tam plan, yakın plan ve perspektif ayrı karşılaştırıldı. Önceki sayımlar üç dosyanın da ilk katını atlıyordu. İlk kat, T01 tercih işaretine ek olarak native kat başlığı, tekrarlanan görünüm alanları ve aynı ad/kotu taşıyan pencere başlığıyla doğrulanır. Mustafa 1'de ASANSÖR MAK.DAİRESİ (taban13,5/yükseklik1,6), Süheyla'da ASANSÖR MAKİNA (15,4/2,2), Mustafa2'de3.KAT (10,5/3) artık okunur. Yukarıdaki sayılar düzeltilmiştir; eski inceleme JSON'ları tarihsel kanıttır.

Plan kat seçimi artık taban kotunu tavan kotu diye sunmaz: 1.BODRUM tabanı−2,5/yüksekliği3 ise **1.BODRUM TAVANI ·0,5m** gösterilir. Kalıp görünümünde radye ayrı `2B temeller` seçeneğindedir; 3B temel bu seçenekten etkilenmez.

2B beyaz zeminde çizilir: native aks uçlarına bağlı turuncu daire/adlar, kaynak poligonları içinde beton taraması, yeşil kirişler, kesit doğrultusuna hizalı uçtan başlayan etiketler, döşeme adı/kalınlık/G/Q ve kaynak hesap aksları. Yazı boyutu dünya ölçeğinde büyür; uzakta sabit boy yazı yığını oluşmaz. Dolgu içinden seçim boşlukları dışlar; kararlı hover kaynak bilgilerini gösterir. P2/P3/P4 etiketleri geometrik açıklıktan türetilmez; yinelenen native kesit metni doğrulanarak485/25,550/25,390/25 okunur. Yazı konumu ve font yüksekliği kaynak byte alanı olarak çözülmüş değildir; referanslara göre uygulanan yerleşimdir.

Mustafa1'de14 düz merdiven kolunun basamak çizgileri ve sayıları, açık native rıht adedi, üst basamak bayrağı ve mesh köşeleriyle doğrulanan parametrelerden türetilir (`planGeometrySource:parametric-derived`). Beş santimetrelik primary-node düzeltmeleri korunur. **Döner ara kollar ve otomatik rıht modu henüz tam çözümlenmedi**; paralel basamaklar uydurulmaz. Kapalı merdiven katısı/korkuluk/kaplama eşdeğerliği ayrıca tamamlanmış değildir.

Type2 dolgu duvar yüksekliği native119 etiketli ve çevre bayrakları doğrulanan alandan okunur (`verticalSource:native-wall-height`);3m kat için rastgele3m uzatılmaz. Bilinmeyen eğimli varyant planla sınırlıdır. Diğer taşıyıcıların özel düşey kotları konusunda önceki sınır geçerlidir.

3B beyaz zemin ve ızgarada gri beton, metre ölçeğinde turuncu dolgu duvarı, saydam/katı/gizli döşeme seçenekleri ve yalnız taban kattaki akslarla gösterilir. Malzeme ve saydamlık referansa göre tasarlanmıştır; native ideCAD shader/texture kodu kopyalanmış değildir.

Son kaynak kontrolü:20/20 okuyucu/ağ/merdiven/yerleşim/doku testi,0skip; TypeScript ve ilgili ESLint temiz. `ide-visual-reference.spec.ts`96 aks etiketi, dünya ölçeğiyle3kat yakınlaşma/yarıdan fazla uzaklaşma, taramanın dışarı taşmaması, D4 hover G/Q, kat tavanı ve malzeme modlarını denetler. Kanıtlar `visual-unit-tests.log`, `production-build-visual.log`, `production-browser-visual.log` ve `reference-2026-10-29/` altındadır.

Yerel runtime artık bu kullanıcının sınırlı yetkili `hsynCAD-IDE-Viewer-3145` zamanlanmış göreviyle başlatılır; localhost3145'e bağlıdır, kullanıcı oturumu açıldığında yeniden çalışır. Kaynak betik `.data/hsyncad/serve-ide.cjs`, günlükler `.data/hsyncad/ide-service.*.log`; Git dışında tutulur. Önizlemeyi durdurma: `Stop-ScheduledTask -TaskName hsynCAD-IDE-Viewer-3145`. Dış siteye deploy yapılmadı.

Son `.next-ide-visual-release` derlemesinde TypeScript ve684/684 sayfa başarılı; `ide-projects.spec.ts` +`ide-visual-reference.spec.ts` birlikte **4/4** geçti. Açık IAB sekmesinde yeni sürümden Mustafa1,1.BODRUM TAVANI0,5m,6kat/1.273kayıt ve tam2B görünüm ayrıca doğrulandı.

## 30 Ekim — IDE11 trial okuma ve dışa aktarma

Kullanıcının masaüstündeki `MUSTAFA SELVİ 1.KISIM.ide11trial` (146.683.236 byte, SHA-256 `8808af458b18f4300a28a33625db28b1f6401af596f579a2e82cd4eb410fc4d1`) doğrudan okunur. Yeni örnek kimliği `mustafa-selvi-1-trial`, sağ alttaki menüde **Mustafa Selvi · 1. Kısım · Son kayıt** olarak gösterilir. Örnek eşlemesi yalnız yerel, Git dışındaki yapılandırmadadır.

Kurulu deneme yürütülebilirinin salt okunur statik incelemesi, sayısal kayıtların sabit dosya-biçimi Blowfish kodlamasını doğruladı. Beş bağımsız bilinen sayı aynı byte sonuçlarını verir. `numeric-codec.ts`, yalnız doğrulanan 211220/encoded-flag1 taşıyıcısında float64 alanlarını çözer; integer, string, float32 ve kaynak byte'lar korunur. Ortak geometride Z/2, genişlik/3 ve ilk referans listesinden sonraki sabit16byte, native okuma/yazma rutinleriyle doğrulandı. Kat tercihlerinin ikinci u32 referansı sürüm211150'den itibaren vardır. Paketlenmiş hesap aksları raw float64 olduğundan bu alanlara ikinci kez kod çözme uygulanmaz.

Gerçek trial dosyasında **6 kat,1.273 geometri,7 merdiven ağı,76 bağlı boşluk,159 döşeme G/Q kaydı,303 hesap aksı,221 kaynak duvar yüksekliği ve357 kaynak kiriş kesiti** doğrulanır. Tanımlı geometri adaylarında desteklenmeyen kayıt0'dır; bu, dosyanın bütün içeriklerinin desteklendiği anlamına gelmez. Native XY ve kalınlık/genişlikler eski dosyayla1e−9m toleransta,7 merdivenin XYZ ve dört düğümlü bağlantıları birebir karşılaştırılır. Her iki özgün dosyanın SHA kimliği işlem sonunda korunur. Bilinmeyen kodlama sürümü ve eksik trial taşıyıcısı reddedilir; uzantı değişikliği codec seçimini etkilemez.

Trial kaydı bazı hazır gösterim metinlerini `XX` olarak saklar. Kiriş kesitleri, tip/alan/ölçek işaretleri doğrulanmış kaynak genişlik ve yüksekliğinden üretilir. Perdelerin birleşim uçlarını kapsayan brüt boy etiketleri için genel bir karşılık henüz doğrulanmadı; doğruymuş gibi çizgi açıklığı kullanılmaz. Diğer merdiven, özel kot, pafta ve donatı kapsam sınırları geçerlidir.

Görüntüleyicinin sol üstündeki **Dosya** menüsü şu gerçek çıktıları üretir:

- `.hsyncad`: çözümlenmiş görüntüleme projesi; aynı okuyucuda tekrar açılır. Native dosyanın bilinmeyen kayıtlarını içermez.
- **Özgün IDE dosyasının kopyası**: kaynak File nesnesinin byte'ları aynen indirilir; trial uzantısı/bilgisi korunur. Kaynak ve çözülen proje IndexedDB v5 içinde birlikte hatırlanır.
- **DXF / SVG**: aktif kat ve görünür katmanların metre cinsinden geometrisi, boşlukları ve etiketleri.
- **PNG**: o anda görünen2B plan.

**IDE10/IDE11 native sürüm dönüşümü tamamlanmış değildir.** Dosya uzantısını veya trial bayrağını değiştiren sahte bir dönüştürücü yoktur. Bilinmeyen native nesnelerin yeniden yazımı ve ideCAD'de tekrar açılma kabul testi yapılmadan bu seçenek sunulmaz. Bu sürüm, trial dosyasını doğrudan görüntüleme ve bağımsız dışa aktarma sağlar.

Kanıtlar: araştırma arşivindeki `trial-numeric-codec-findings-2026-10-30.md`, `trial-numeric-static-evidence.json`, `trial-common-record-static.json`, `trial-floor-header-static.json`, `trial-metadata-findings-2026-10-30.md` ve gerçek dosya kabul testleri. Geçici Frida gözlemi kapatıldı; program veya özgün proje dosyaları değiştirilmedi.

Son doğrulama: **30/30 birim testi**, TypeScript ve IDE kapsamındaki ESLint temiz. `.next-ide-trial-release`,684 sayfayla başarılı derlendi (build ID `a3tJ9EAZJT981Y5tIZl6g`). Üretim sürümündeki7 tarayıcı senaryosu geçti; eksik paket senaryosu build dizini belirtilerek ayrıca çalıştırıldı. 3145 zamanlanmış görevi bu sürüme geçirildi; açık kullanıcı sekmesinde trial dosyasının6kat/1.273kayıt/7ağ ile açıldığı ve Dosya menüsünün göründüğü ayrıca doğrulandı. Geçici3146 test sunucusu kapatıldı. Kullanıcının mevcut2kolonlu CAD modeli korunur. İncelenebilir ekran: `test-output/hsyncad-exports/trial-project-and-export-menu.png`.
