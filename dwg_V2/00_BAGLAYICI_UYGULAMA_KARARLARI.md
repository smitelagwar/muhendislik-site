# 00 — Bağlayıcı uygulama kararları

[Dizin](README.md) · [Gemini başlangıcı](18_GEMINI_UYGULAMA_REHBERI.md) · [Sıra](19_GEMINI_ADIM_ADIM_UYGULAMA.md) · [Denetim](23_ASTRA_DENETIM_VE_DUZELTME_DONGUSU.md)

**Sürüm: EXEC-2 · 06.09.2026 · Karar sahibi: Astra / kullanıcı · Uygulayıcı: Gemini.**

Kullanıcının son talimatı: **“Gemini'ye seçim hakkı bırakma. Sadece uygulayıcı olarak çalışacak.”** Bu nedenle ilk araştırma paketindeki alternatifler Gemini için seçim menüsü değildir. Bu belge, 18–32 numaralı uygulama belgeleri ve uygulama kayıtları geçerli çalışma hattıdır. 01–16 numaralı araştırma belgelerindeki teknik açıklamalar kullanılacak; bu kararlarla çelişen “seçilebilir / öneri / alternatif” cümleleri uygulanmayacaktır. Sol'un orijinali tarihsel girdidir.

Bu kararlar yeni motorun çalıştığını veya hızlı olduğunu kanıtlamaz. Gemini kararları uygular, doğrular ve eksikleri kaydeder. Başarısız bir yaklaşımı başka teknolojiyle değiştirme, kapsamı daraltıp tamamlandı deme veya kabul eşiğini gevşetme yetkisi yoktur. Değişiklik gerekiyorsa CR kaydı açılır; bağımlı iş bekler, bağımsız yetkili iş sürer. Kullanıcı veya Astra'nın sonraki açık karar revizyonu bu dosyayı değiştirebilir.

## Sabit ürün ve mimari

| Karar | Uygulanacak davranış |
|---|---|
| D01 — Ürün | Tek DWG/DXF dosyasından, internet üzerinden salt okunur 2D mimari/statik görüntüleme; ilk hedef AutoCAD düzeyinde görünüş. Model alanı ve 2D paftalar dahildir. 3D araç, CAD düzenleme, dosyaya geri yazma yok. |
| D02 — İki motor | Normal açılış mevcut görüntüleyicide kalır. Üç noktada DWG için “DWG Motor V2 ile aç”, DXF için “DXF Motor V2 ile aç”. V2 varsayılan yapılmaz. |
| D03 — Hazırlama | **Sunucuda bir kez hazırlanan sahne** bütün dosyalar için ana yoldur. İstek anında Vercel fonksiyonunda büyük CAD parse yapılmaz. Browser'da raw DWG/DXF decode ve otomatik ikinci decoder yok. |
| D04 — DWG okuyucusu | Kilitte mevcut **@mlightcad/libredwg-web 0.7.10** doğrudan ayrı Node hazırlama sürecinde kullanılacak. V2, legacy viewer veya converter registry üzerinden açılmayacak. |
| D05 — DXF okuyucusu | **@mlightcad/data-model 1.14.2** içindeki native DXF okuyucu/converter, ayrı hazırlama sürecinde kullanılacak. ASCII ve binary DXF ayrı doğrulanacak. LibreDwg.dwg_read_data(DXF) kullanılmayacak. |
| D06 — Kaynak anlamı | İki decoder ayrı adapter'dan ortak canonical şemaya alınacak. Katman, handle, block/instance, OCS, pafta, kaynak sürümü ve eksik içerik bilgisi korunacak. Geometri Float64; GPU verisi lokal orijinle Float32. |
| D07 — Renderer | V2 CAD render planı üzerinde **Three.js 0.172.0 WebGLRenderer + OrthographicCamera**. TypeScript retained 2D buffers/instancing; React yalnız UI. Ham WebGL altyapısı yeniden yazılmaz. Mevcut viewer sarılmaz. WebGPU, React Three Fiber, 3D kontroller ve Canvas2D ana renderer kapsam dışıdır. [29](29_RENDER_VE_YASAM_DONGUSU.md) bağlayıcıdır. |
| D08 — Browser iş bölümü | Fetch/manifest koordinasyonu host'ta; sahne doğrulama, unpack ve indeks hazırlığı ayrı Web Worker'da; WebGL2 çizim main thread'de. Transferable ArrayBuffer; SharedArrayBuffer/COOP/COEP/OffscreenCanvas yok. |
| D09 — Sunucu | Node.js **24.15.0**, TypeScript/esbuild ile paketlenmiş compiler; her parse işi ayrı child process. Supervisor bir anda bir compiler işi çalıştırır. Ayrı Linux container hizmeti; Vercel yalnız site, yetki ve küçük kontrol API'leri. |
| D10 — İş kuyruğu | Mevcut Neon/Postgres üzerinde V2'ye ait tablolar; lease, fencing token, en fazla iki otomatik transient retry, idempotent job. Yeni Redis/Kafka/queue SaaS yok. |
| D11 — Türev saklama | Mevcut private Blob sözleşmesinde ayrı cad-v2 prefix'i. Immutable manifest/chunk ve atomik ready pointer. Üretim kullanıcı storage'ı test alanı değildir. |
| D12 — Kimlik | Cache/derivative anahtarı tenant scope + immutable source revision/hash + decoder/compiler/schema/renderAbi sürümü + font/XREF/dependency hash manifesti + kalite profili içerir. Signed URL kimlik değildir. |
| D13 — Sahne | schemaVersion=1; UTF-8 JSON manifest + little-endian typed binary chunk dosyaları. Kimlik, manifest, index, protocol ve API [25](25_SABIT_VERI_VE_API_SOZLESMELERI.md) ve [31 numaralı tamamlamaya](31_SOZLESME_TAMAMLAMALARI.md) uyar. Gemini public sözleşme seçmez veya sessiz değiştirmez. |
| D14 — Önbellek | Hazır sahne sunucuda tekrar kullanılır. Browser RAM LRU vardır. Özel çizim chunk'ları EXEC-2'de IndexedDB/OPFS/Service Worker'a kalıcı yazılmaz; client disk cache işi kapsam dışıdır. Kaynak gizliliği için private/no-store teslim sözleşmesi uygulanır. |
| D15 — İlk açılış | Hazır türev varsa gerekli sahne parçaları alınır; yoksa job başlatılır ve gerçek faz gösterilir. Hazır olmayı bekleyen kullanıcı iptal edebilir. İlk soğuk hazırlık ikinci açılıştan ayrı ölçülür; hızlı olacağı varsayılmaz. |
| D16 — Etkileşim | **d3-zoom 3.0.0** tek 2D gesture motoru; [28](28_PAN_ZOOM_FIT_SOZLESMESI.md) sabit adapter/filter/anchor/fit/lifecycle. ±, pan, wheel/pinch, keyboard, katman ve pafta. MapControls/OrbitControls ve ikinci Pointer Events gesture sistemi yok. |
| D17 — Ölçüm kapsamı | Kaynaktaki DIMENSION/LEADER doğru gösterilir. Yeni kullanıcı mesafe/alan ölçüm aracı ve annotation/review yazma EXEC-2 dışında; düğmeleri hazırmış gibi çizilmeyecek. Mevcut motordaki araçlar korunur. |
| D18 — Entegrasyon | /dokumantasyon/dosya/[fileId]?cadEngine=v2. Server allowlist; mevcut erişim/lease. V2 host shell sınırından dynamic import. /v2 diye ikinci route ailesi kurulmaz. |
| D19 — Paylaşım | Admin dosya akışı ve mevcut public paylaşım izinleriyle V2 açılışı kapsamda. Public V2 admin API'sini kullanmaz. Oturum/izin/yetki süresi dolması yeni kaynak/türev erişimini keser. İndirilmiş byte'ları uzaktan silme garantisi verilmez. |
| D20 — Hata | Partial/degraded/unsupported/error/cancelled ayrımı görünür. Kullanıcı “Mevcut görüntüleyiciyle aç” seçer; gizli fallback ile V2 başarı kaydı üretilmez. |
| D21 — Tasarım | [21](21_ARAYUZ_TASARIM_SISTEMI.md) ve [22](22_ARAYUZ_SENARYOLARI_VE_KABUL.md) bağlayıcıdır: mevcut Dark Industrial kimlik, açık/koyu tema, ölçülü amber, temiz teknik çalışma yüzeyi. Gemini başka görsel yön seçmez. |
| D22 — Pratik kaynak kullanımı | Lisans evrakı/envanteri bütün geliştirmeyi veya yerel teknik kabulü durduran genel kapı değildir. Ayrı lisans UI'ı, kullanıcı onayı veya hukuk raporu şartı yok. Gerekli gerçek copyright/notice ve varsa kaynak sunumu koşulları ilgili dağıtım paketinde ele alınır. Somut dağıtım sorunu yalnız ilgili bileşen/artifact için kayıtlanır; bağımsız işler ilerler. Aşağıdaki U2 kuralı uygulanır. |
| D23 — Değişmeyen çekirdek | Önceki başlangıç kaydındaki dört core dosya ve legacy runtime davranışı korunur. Ortak menü/shell ekleri yalnız V2'yi bağlar. Legacy paketi yükseltmek/kaldırmak veya asset'ını üzerine yazmak yok. |
| D24 — Denetim | Her G paketi kod + davranış + test kanıtı + dosya farkı + kayıtla teslim edilir. Gemini “uygulayıcı doğruladı” diyebilir; “Astra denetiminden geçti” diyemez. |

## Bu seçimin dayanağı ve bilinen belirsizlik

Okunan yerel paket/API/tema dosyalarının sürüm ve hash kaydı: [gemini-karar-dayanaklari.json](arastirma/gemini-karar-dayanaklari.json).

Sunucuda hazırlama kararı, büyük çizimin decode/compile maliyetini cihazlardan ayırır ve başka cihazda aynı sonucu kullanmayı sağlar. Bu bir mimari karardır; ilk açılışta queue/ağ/compile gecikmesi yaratacağını da kabul eder. Bütün dosyalarda legacy'den hızlı olma garantisi yoktur.

Kurulu libredwg-web paketinin README'sinde Node desteği, .d.ts içinde convertEx/unknownEntityCount, pointer ve free API'leri var. Kaynakta dwg_read_data'nın DXF dalı yorumda; README'deki genel “DWG/DXF” ifadesine bakarak çalıştığı kabul edilemez. Aynı README'nin free örneğindeki db/pointer karışıklığı kopyalanmayacak: dwg_free, JSON veritabanını değil native Dwg_Data pointer'ını alır. Paket build scriptinde 1 GB başlangıç / 4 GB maksimum WASM memory ayarı görülüyor; bu, kurulu artifact'ın ölçülmüş RSS'i değildir. Browser decode'u kapsam dışı tutma kararını destekleyen bir risk işaretidir.

Native DXF reader public tipleri streaming section okuma ve unknownEntityCount/unknownObjectCount bildiriyor. Node'da tam import/okuma uyumu ve DWG'deki kapsam henüz test edilmedi. G02 bunları doğrular. Eksik Node bağımlılığına sahte global document/window eklemek veya gizlice headless browser decoder'ına geçmek yok. Adapter içindeki normal uyarlama yeterli değilse CR açılır. İlk seçimin testte başarısız olması saklanmayacak.

DWG wrapper'ın bazı error bit'lerini yalnız console.warn'a yazıp pointer döndürmesi tam başarı sayılmayacak. Adapter gerçek native status/error bitmask'ini ve conversion unknown sayılarını diagnostic'e taşıyacak; fatal/nonfatal sınıfları G02 testleriyle kayda bağlanacak. Native pointer ve JS database ayrı sahiplik taşır; process cleanup, free ve dosya unlink hata halinde de yapılır.

Bu sürümde ham DWG decoder'ını sıfırdan yazmak, SDK yarışı, browser/server arasında otomatik yol seçimi, alternatif queue/storage, kalıcı offline dosya ve WebGPU çalışması yapılmayacak. Araştırma belgelerindeki bu yollar yalnız Astra'nın ileride karar verebilmesi için saklıdır.

## Bağımlılık ve dosya sınırı

V2'nin doğrudan kullandığı ve bugün transitive olan paketler package.json'a **aynı kilitli sürümle** doğrudan eklenir; caret/latest kullanılmaz. Lockfile değişikliği yalnız bu ihtiyaç ve yeni V2 script tanımlarıyla sınırlı tutulur. Mevcut paket sürümlerinin toplu çözülmesine izin verilmez.

| İş | Sabit kaynak |
|---|---|
| DWG | @mlightcad/libredwg-web 0.7.10 |
| DXF | @mlightcad/data-model 1.14.2 |
| SHX glyph çözümü | @mlightcad/shx-parser 1.4.5 |
| MTEXT token çözümü | @mlightcad/mtext-parser 1.5.0 |
| TTF/OTF Latin/Türkçe glyph outline | opentype.js 1.3.4; kompleks shaping destek iddiası yok |
| Geçerli polygonların triangulation'ı | earcut 3.2.3; hatch topoloji çözümü yerine geçmez |
| GPU/kamera | three 0.172.0; dev @types/three 0.172.0 |
| 2D giriş | d3-zoom 3.0.0, d3-selection 3.0.0, d3-drag 3.0.0; [27](27_KAYNAK_KOD_VE_YENIDEN_KULLANIM.md) tip kilitleri |
| UI | Mevcut React, Tailwind, shadcn/Radix, Lucide ve next-themes kilidi |
| Test | Mevcut Playwright, axe, TS/Node araçları; ayrı V2 config ve izole data |

MTEXT, SHX, font seçimi ve line/hatch üretimi bize ait canonical/compile sözleşmesine bağlanır. Mevcut upstream renderer'ını sararak “yeni motor” adıyla teslim edilmez. Outline bulunamadığında sistem fontuna sessiz geçilmez; degraded kaydı gerekir. Daha kapsamlı shaping veya eksik reader işlevi için yeni kütüphane seçimini Gemini yapmaz.

Yeni kod sınırları: src/lib/cad-v2/{decode,canonical,scene,compile,protocol,cache}, src/components/dokumantasyon/cad-v2, src/workers/cad-v2, services/cad-v2-compiler, tests/cad-v2, scripts/cad-v2, public/cad-v2. Bunlar **ileride oluşturulacak** yollardır. Ortak dosyalarda yalnız entegrasyon, script/config ve yaşayan bağlam ekleri yapılır. Eski sync-cad-upstream-assets scripti değiştirilmez; V2 için ayrı asset manifest/builder eklenir. Global CSS tokenları değiştirilmez; V2 kendi scoped stillerini mevcut tokenlardan alır.

## Sabit başlangıç kaynak sınırları

Bu rakamlar EXEC-2 uygulama konfigürasyonudur, ölçülmüş cihaz limitleri değildir. Gemini test geçsin diye yükseltemez veya kaliteyi kalıcı azaltamaz; yetmezse CR kaydeder.

| Alan | EXEC-2 |
|---|---|
| Compiler | Tek concurrent job; child process başına 300 s outer timeout; container 8 GiB sınır / 2 vCPU yerel kabul profili |
| Girdi | Kullanım hedefi genelde ≤30 MB, en fazla 70 MB tek DWG/DXF. Teknik koruma tavanı 100 MiB kalır; source + gömülü/sağlanan platform kaynakları toplam 250 MiB. Kullanıcıdan ek dosya/klasör alınmaz; sınır aşımı parse öncesi ret |
| Graph | Block recursion 64; Dosyada gerçekten sağlanmış/gömülü graph için XREF depth 8 / node sayısı 64; harici XREF dosyası alınmaz; cycle detection her durumda |
| Sahne | Chunk saklama/HTTP payload üst sınır 2 MiB, decoded allocation savunma sınırı 8 MiB; root/index manifest 1 MiB; chunk sayısı 20.000; bütün türev decoded sınırı 512 MiB |
| Browser | En fazla 4 parallel chunk fetch; bütün cihazlarda 64 MiB CPU resident chunk/metadata/refinement/resource ve 64 MiB GPU tahmin bütçesi; pointer türü RAM sınıfı değildir |
| Transfer | Queue en fazla iki decoded chunk; görünür tile önceliği; eviction halinde kayıpsız geri yükleme |
| Kesinti | İptal UI ≤250 ms; worker/process kill ≤2 s; asset/source/chunk network timeout 45 s; job status polling 2 s, background 10 s |
| Retry | Geçici network/worker crash için en fazla iki otomatik tekrar; format/permission/limit hatasında sıfır otomatik tekrar |

Cache ve GPU bütçeleri browser toplam RAM'ini kesin ölçmez. Manifest/bbox ve metadata boyutları da hesabın içinde olur. Bütçeye sığmayan görünür çizim sessizce eksiltilmez; açık kaynak sınırı sonucu üretilir. İptal edilen izleyicinin ayrılması, başka izleyicisi olan ortak işi öldürmez. Jobs için ref-count/lease ve cancellation kuralları [10](10_GUVENLIK_VE_ISLETIM.md)'daki bütünlük koşullarını korur.

## Üretim ortamı ve bitiş sınırı

Gemini yerel Linux container tanımını, yerel compiler çalışmasını ve üretim bağlantı sözleşmesini hazırlayacak. Hedef production container host'u ve kimlik bilgileri bu çalışma alanında doğrulanmış değil; Gemini sağlayıcı seçmeyecek, hesap açmayacak veya satın alma yapmayacak. Dağıtım Astra/kullanıcının sonraki release işidir. Bu operasyon bağımlılığı kayıtta açık kalır; yerel uçtan uca geliştirme ve testlerin yapılmasını engellemez.

Kullanıcının hedefi web sitesinde cihazlar arası kullanımdır. Container'ın yalnız yerelde çalışması bu hedefin tamamen gerçekleştiği anlamına gelmez. Son rapor **yerel uygulama**, **bağımsız denetim**, **üretim doğrulaması** durumlarını ayrı tutacak. Production bağlantısı ve gerçek cihazlar kanıtlanmadan bütün sistem için “kusursuz / tamamlandı / production hazır” yazılmayacak.

## Karar değişikliği

CR-NNN şu bilgileri taşır: etkilenen D/R/G kimliği, tekrarlanabilir engel, başarısız test/ham kanıt, etkilenen dosyalar ve ilerleyebilen işler. Gemini çözüm adaylarını kanıt olarak raporlayabilir ama seçip uygulamaz. Astra'nın veya kullanıcının açık kararından sonra EXEC-3 gibi yeni sürüm kaydedilir; eski karar ve eski test sonucu silinmez. Salt hata düzeltmesi mevcut sözleşmeyi koruyorsa CR gerektirmez.

## EXEC-2 teknik denetim ekleri

[26 — Bulgu ve karar değişiklikleri](26_PLAN_DENETIMI_VE_EXEC2.md), [27 — Kesin kaynak kullanımı](27_KAYNAK_KOD_VE_YENIDEN_KULLANIM.md), [28 — Giriş/kamera](28_PAN_ZOOM_FIT_SOZLESMESI.md), [29 — Renderer](29_RENDER_VE_YASAM_DONGUSU.md), [30 — Özellik kapsamı](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md), [31 — Veri/lease ekleri](31_SOZLESME_TAMAMLAMALARI.md). D09–D15 sınırlarına 29 texture/refinement ve 31 heartbeat/TTL koşulları eklenir. 00/25 kısa özetinin eksik ayrıntısı bu eklerle tamamlanır; açık çelişki varsa Gemini CR kaydeder. EXEC-1 artık tarihsel arşivdir.

## Kullanıcı netleştirmesi U1

[32 — Kullanıcı hedefi ve gerçek kabul](32_KULLANICI_HEDEFI_VE_GERCEK_KABUL.md) bağlayıcıdır: AutoCAD/GstarCAD/ZWCAD görünüşü hedefi, eşlenmiş stil/font/pafta referansı, ilk gerçek kabulde kullanıcının bilgisayarı ve Poco X6 Pro. Diğer cihazlara erişim doğrulanmadı; kapsamları NOT_RUN kalır. Sunucu bütçesi belirlenmedi; önce yerel tüketim ölçümü, sonra Astra maliyet değerlendirmesi. Bu ek teknik paket seçimlerini değiştirmez.

## U2 — Geliştirmeyi durdurmayan lisans yaklaşımı

Kullanıcı lisans konusunun projenin ilerlemesini gereksiz engellemesini istemiyor. Önceki “lisans kanıtı eksik release hazır değildir” genel kapısı kaldırıldı. Lisans türüne dayalı peşin teknoloji elemesi, her paket için ayrı lisans raporu, zorunlu hukuk görüşü ve ürün içinde zorunlu lisans ekranı plan şartı değildir. Uygulama/doğruluk/hız/arayüz geliştirmesi devam eder.

Paketlerin mevcut LICENSE/NOTICE dosyaları korunur; bundler çıktısı için gerekiyorsa üçüncü taraf bildirimleri dağıtım dosyasına otomatik alınır. Aynı envanter tekrar tekrar elle yazılmaz. Yalnız gerçekten dağıtılan kod/WASM/font ve yapılan değişikliklerle ilgili koşullar ele alınır. Kaynak sunumu veya ticari kullanım koşulu varsa yalnız notice dosyasının yeterli olduğu varsayılmaz. Mevcut bildirimler silinmez; bu politika üçüncü taraf koşullarını ortadan kaldırmaz.

MIT/ISC metinlerinde kopyalara ilişkin bildirim koşulları bulunur; bunlar otomatik olarak uygulama içinde görünür modal/rozet gerektiren bir ürün şartına çevrilmez. Kaynaklar: [MIT](https://opensource.org/license/mit), [ISC](https://opensource.org/license/isc). Diğer bileşenler kendi gerçek metnine göre ele alınır.

Sadece envanterin eksik olması G02/G07/G15 teknik sonuçlarını FAIL veya BLOCKED yapmaz. Böyle bir eksik paketleme TODO'sudur. Somut çelişki saptanırsa kullanılan bileşen/sürüm, dağıtım şekli, ilgili koşul ve uygulanabilir işlem kısa kaydedilir; yalnız etkilenen dağıtım işi ayrılır. Genel “lisans riski olabilir” gerekçesiyle geliştirme durdurulmaz. Gerçek yükümlülük tamamlanmadıysa tamamlanmış gibi yazılmaz.

MPL/GPL/ticari gibi bir etiket tek başına kodun teknik değerlendirmesini engellemez. Seçilmiş mimari ve Gemini'nin uygulayıcı rolü korunur; yeni decoder/SDK/mimari kararı Astra'ya aittir. Ticari seçenek sırf ticari olduğu için kalıcı elenmez; satın alma/ücretli abonelik veya sağlayıcıya koşul kabulü için bu mesaj bütçe yetkisi oluşturmaz. Mevcut turda ücretli işlem başlatılmaz.

## U3 — Tek dosya, online kullanım ve öncelik

[32 U3](32_KULLANICI_HEDEFI_VE_GERCEK_KABUL.md) kullanıcının son yanıtını bağlar: ilk hedef CAD görünüş kalitesi; yeni ölçüm aracı sonraya kalır; çevrimdışı özellik yok; dosyalar genelde ≤30 MB, en fazla 70 MB. Tek DWG/DXF seçilir, eşlik eden klasör/XREF/font dosyası istenmez. Platform fontları otomatik çözülür; kaynakta olmayan harici içerik tahmin edilmez. Mevcut normal açılış legacy, V2 ayrı menü seçeneği kararı sürer.
