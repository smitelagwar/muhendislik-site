# 19 — Gemini'nin sabit uygulama sırası

[Dizin](README.md) · [Kararlar](00_BAGLAYICI_UYGULAMA_KARARLARI.md) · [Paket durumları](uygulama/PAKET_DURUMLARI.md) · [Gereksinimler](24_GEREKSINIM_KATALOGU.md)

**G00–G17 yürütülecek programdır.** Eski P/W/E numaraları araştırma izini korur; Gemini'ye alternatif yol seçtirmez. Giriş koşulu sağlanmadan bağımlı işe geçilmez. Bir paketin uygulaması bittikten sonra gerçek testler ve kayıt da tamamlanır. Her paketin bağımsız Astra denetim alanı başlangıçta NOT_REVIEWED kalır.

G03/G10/G11/G13/G14'ün veri ve erişim yolu [25 numaralı sözleşmeyle](25_SABIT_VERI_VE_API_SOZLESMELERI.md) sabittir. Chunk HTTP payload'ı en fazla 2 MiB; manifest/chunk her istekte yetkilendirilir. Eski araştırmadaki doğrudan signed scene URL ve daha büyük chunk seçenekleri uygulanmaz.

[26–31](26_PLAN_DENETIMI_VE_EXEC2.md) EXEC-2 teknik ekleri bağlayıcıdır. G04-A arayüz, G04-B erken D3/Three giriş-kamera kapısıdır; G04 tek paket olmaya devam eder. [30](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) özellik kapsamı ve [alt kabul tablosu](uygulama/ALT_KABUL_DURUMLARI.md) G/R kanıtlarına eklenir.

Paketler ayrı remote commit zorunluluğu değildir. Hiçbir pakette gereksiz kullanıcı onayı beklenmez. CR nedeniyle duran paket varsa yalnız aşağıda bağımsız olduğu belirtilen iş ilerletilir. Gemini bir paketi küçültüp “MVP yeterli” kararı veremez.

## G00 — Güncel repo, korunacak alan ve kayıt başlangıcı

**İz:** P0 / W01 / R01,R40,R41. **Girdi:** Repo talimatları, EXEC-2, araştırma envanteri. **Dosya alanı:** uygulama kayıtları ve tests/cad-v2 fixture manifesti; eski motor değişmez.

Yap: HEAD/status, mevcut untracked işlerin sahipliği, package/lock/assets/core hash'leri ve gerçek corpus varlığını doğrula. SNAP-0001 oluştur. İzole test data dizinini ve test kullanıcılarını kur; gerçek .data/dok_db.json ve kaynak dosyaları değiştirme. Geçerli plan revizyonunu ve Node/compiler/browser ortamını kaydet. Root GEMINI'deki tarihsel golden'a otomatik restore yapma; güncel çalışma korunur.

**Çıkış:** Snapshot, fixture manifesti, test izolasyonunun yazma sınırı, güncel R/G indeksleri. **Negatif kontrol:** Test ayarı yokken script gerçek storage'a düşmemeli; yanlış/eksik fixture hash'i kapıyı FAIL yapmalı. **Tamamlandı sayılmaz:** Araştırma snapshot'ını güncel uygulama başlangıcı diye kopyalamak.

## G01 — Mevcut motorun gerçek baseline'ı

**İz:** W02 / E01 / R29,R31. **Girdi:** G00. **Alan:** scripts/cad-v2 ve tests/cad-v2; production core'a instrumentation ekleme.

Yap: Açma niyetinden başlayan dış harness; R001–R004, cold/warm HTTP/warm SPA koşulları; gerçek engine path ve source hash. First-useful/full-ready, network gerçek transfer ve frame/bellek gözlemlerini [11](11_DOGRULAMA_PROGRAMI.md)'e göre kaydet. İlk elemede dosya/koşul başına 10 dönüşümlü tekrar; ölçülemeyen alan null + sebep. Aynı dosyanın görünüş ayarı ve kritik ROI'lerini kaydet.

**Çıkış:** Ham RUN'lar, baseline tablo ve oracle eksikleri. **Negatif:** Content-Length transfer değildir; cached DXF sonucu DWG decoder başarısı diye yazılmaz. **Engel:** Referans uygulama yoksa numeric/sentetik işler sürer; görsel fidelity NOT_RUN kalır. G02/G04 bu kanıt eksiğinden bağımsız başlayabilir; ürün kabulü başlayamaz.

## G02 — Seçilmiş DWG/DXF adapter'larının çalışması

**İz:** W03,W04,W22 / E02'nin seçilmiş okuyucu doğrulaması / R03,R04,R15,R39. **Girdi:** G00. **Alan:** services/cad-v2-compiler, src/lib/cad-v2/decode.

Yap: Node 24.15.0 ayrı child process içinde libredwg-web 0.7.10 DWG ve data-model 1.14.2 native DXF. Gerçek paket API'sini oku; hayalî method/deep import yazma. Dwg_Data pointer'ını finally içinde doğru free et; source/temporary bytes/process lifetime tek işe ait olsun. Worker/JS global singleton legacy ile paylaşılmaz. Sniff, encoding, ASCII/binary DXF, AC1032 ve unknown entity/object kayıtları üret. JSON örneğini varmış gibi DWG path'ine verme.

**Çıkış:** R001–R004 gerçek source → decoder invocation → semantik envanter, mevcut public API eşleme notu, pin/asset manifesti; lisans paketleme notları U2 kapsamında teknik kapıdan ayrı. **Negatif:** Yanlış uzantı, truncated bytes, UTF-8 + yanıltıcı codepage, timeout/OOM ve unknown types. **Karar engeli:** Seçilmiş paket Node'da/formatta yeterli değilse CR; başka parser, headless browser veya paket upgrade yok. G03 saf şema/fixture ve G04 UI çalışması bağımsız sürdürülebilir.

## G03 — Canonical veri ve scene v1 sözleşmesi

**İz:** W05,W06 / E03 / R05,R16,R17. **Girdi:** G02'nin veri tipleri; analitik fixture kısmı G00'dan başlayabilir. **Alan:** canonical, protocol, scene.

Yap: Handle string/BigInt sınırı, instance path, immutable source revision, units evidence; Float64 world coordinate ve OCS/block dönüşümü. Manifest/chunk formatını D13 sınırlarıyla yaz; encoder/decoder aynı schemaVersion ile. Bbox, layer/layout/order metadata ve diagnostics zorunlu. Büyük JSON entity dizisini browser'a taşıma. 8 MiB'den büyük decoded chunk ve geçersiz offset daha allocation olmadan reddedilir.

**Çıkış:** Tipli sözleşme, binary format belgesi, deterministik round-trip, bağımsız numeric oracle, malformed reader testleri. **Negatif:** NaN/Infinity, overflow, truncated/alignment/unknown schema/checksum mismatch, aynı handle farklı block instance. **Sınır:** Şema veya ortak API değişimi sonrası önceki sahne/testler version/hash ile ayrılır. Testi düzeltmek için tolerans büyütülmez.

## G04 — Arayüz durum prototipi

**İz:** UI01–UI20 / R32–R35. **Girdi:** G00 + 21/22; decoder sonucunu beklemez. **Alan:** Yeni V2 UI bileşenleri ve test-only durum fixture'ları.

Yap: 21'deki tek tasarım yönü, barlar/panel/sheet, açık/koyu tema ve gerçek Türkçe metinlerle tüm durumlar. Görsel prototip “temsilî veri” olarak test yüzeyinde çalışır; kullanıcı route'ında çalışan motor diye gösterilmez. Modernlik için yeni UI paketi, font veya marka yaratma. Mevcut primitive'leri motor bağımlılığı olmadan kullan.

**G04-B:** [28](28_PAN_ZOOM_FIT_SOZLESMESI.md) D3 adapter ve Three ortografik kamera/gerçek WebGL test yüzeyini [30](30_OZELLIK_KAPSAMI_VE_KALITE_KAPILARI.md) erken kapısına göre kur. ±/fit/pan/wheel/pinch/resize/cancel/teardown için N01–N23 otomasyon ve masaüstü kanıtını üret. Sentetik geometri gerçek CAD sonucu değildir. N24 fiziksel cihaz yoksa NOT_RUN; ilgili release kapısı açık kalır.

**Çıkış:** 22'deki zorunlu ekran seti, gerçek görsel inceleme notları, keyboard/focus/overflow/target testleri. **Negatif:** 320 px, uzun ad, %200 zoom, açık sheet, klavye, hata, empty ve partial. **Tamamlandı sayılmaz:** Tek geniş dark ekran veya yalnız JSX skeleton. Bu paket motor başarı kanıtı üretmez.

## G05 — İlk gerçek sahneden V2 frame'i

**İz:** W07 / E04 / R21,R22,R45. **Girdi:** G02,G03; G04-A kabuğu ve G04-B erken temel kapısı. **Alan:** compiler, worker, render backend ve izole host.

Yap: Yerel compiler CLI gerçek dosyadan manifest/chunk üretir. Browser worker bunları doğrular; Three.js 0.172.0 altyapılı V2 renderer LINE/ARC/LWPOLYLINE/CIRCLE ve fit/pan/zoom çizer. Kamera local origin, DPR/resize, görünür bbox doğru olur. R001/R002 ve büyük R004 ilk uçtan uca örnekleri kullanılır. Henüz tamamlanmayan text/hatch/pafta açık degraded olarak kaydedilir.

**Çıkış:** Raw source → seçilmiş decoder → canonical → packed scene → gerçek WebGL2 frame zinciri ve source revision kanıtı. **Negatif:** Yanlış checksum, görünür bbox dışındaki küçük detay, art arda 20 aç/kapat ve iptal. **Tamamlandı sayılmaz:** Thumbnail, sabit SVG veya legacy canvas'ı V2 host içine koymak. Ürün hazır etiketi henüz yok.

## G06 — Block, style ve katman semantiği

**İz:** W08 / E05 / R06,R12. **Girdi:** G05. **Alan:** canonical/compile/render layer index.

Yap: Nested INSERT/ATTRIB, negative/non-uniform scale, OCS, layer 0, BYBLOCK/BYLAYER, visibility/frozen/locked ayrımı, instance kimliği. Instancing yalnız görünüş/order/attrib eşliği korunarak yapılır. Katman UI gerçek sahneye bağlanır; toggle canonical geometriyi değiştirmez.

**Çıkış:** Analitik dönüşüm fixture'ları + gerçek çizim ROI; farklı instance aynı definition'ı güvenle paylaşır. **Negatif:** Cycle/depth, layer adı çakışması, gizli alt block, miras renk/lineweight ve büyük koordinat. Yanlışlığı çözmek için tüm blokları kontrolsüz expand ederek memory sınırı aşılmaz; CR/eksik kaydı gerekir.

## G07 — Yazı ve kaynak ölçülendirme doğruluğu

**İz:** W09,W10 / E06 / R08,R09. **Girdi:** G06. **Alan:** font resolver, MTEXT layout, glyph compile, dimension display.

Yap: Sabit decoder/SHX/MTEXT/OpenType paketleri; exact font hash, Türkçe, sembol, rotation, oblique, width factor, mirror, alignment, stacked fraction ve multiline. Kaynak dimension text override/anonymous block/stilini koru. Mesafe/alan kullanıcı aracı ekleme. Font bulunamazsa 32 U3'teki sabit platform-font/substitute yolunu uygula; kullanıcıdan font isteme, tahminle aynı font diye işaretleme.

**Çıkış:** Ana pafta ve donatı yazısı crop'ları, glyph/anchor/advance numeric oracle, font izin envanteri. **Negatif:** Eksik SHX, yanlış unicode/codepage, font sürümü değişimi, yanlış advance ve dimension override. Zor yazı örneği çıkarılarak suite PASS yapılamaz. Kompleks shaping eksikse ek library seçmeden CR.

## G08 — Eğri, hatch, çizgi ve çizim sırası

**İz:** W11 / E07 / R07,R10,R11,R45. **Girdi:** G06,G07. **Alan:** geometry compiler, stroke/hatch/order.

Yap: ARC/ELLIPSE/SPLINE, bulge ve polyline width; solid/pattern hatch, delik/ada; linetype phase ve lineweight; wipeout/clip/transparency. Earcut yalnız doğrulanmış polygon topolojisine uygulanır. Material batching draw order bariyerlerini aşmaz. Pan sırasında inceltilen çizim etkileşim sonunda exact hedefe döner.

**Çıkış:** Genel crop + kritik ROI, bağımsız topoloji/numeric test, 0.5 CSS px azami test-projeksiyonu tessellation hedefi. **Negatif:** Non-uniform circle, self-intersecting hatch, seam/chunk sınırı, büyük origin, wipeout arkasındaki text. Kaynak sorunluysa degraded; eksik dolguyu “stil tercihi” olarak saklama.

## G09 — Model, pafta, viewport ve bağımlılıklar

**İz:** W12 / R13,R14. **Girdi:** G08. **Alan:** layout/dependency graph, authenticated dependency resolver, panel bağlantısı.

Yap: Model/layout, viewport twist/clip/scale/frozen layer, text/annotation context, tek dosya içindeki gerçek gömülü/bound XREF graph ve 32 U3 kaynak çözümü; harici proje klasörü/mapping UI'ı yok. HTTP/UNC/file kaynaklarını çizimin verdiği path'ten serbest fetch etme. Eksik kaynak/font/underlay açık diagnostic olur. OLE aktif içerik çalıştırılmaz; safe representation yoksa eksik içerik kaydı.

**Çıkış:** Aynı paftada iki viewport ve farklı layer oracle'ı; değişmiş gömülü/bound içerik source hash'i veya platform font hash'inin yeni manifest üretmesi; dış referansı olmayan dosyada degraded açılış. **Negatif:** Cyclic XREF, yetkisiz dependency, path traversal, farklı relative origin, dosya yok. **Tamamlandı sayılmaz:** Bütün layoutları tek model bbox'ına birleştirmek.

## G10 — Chunk, scheduler ve RAM cache

**İz:** W13; W14'ün yalnız D14 RAM kısmı / E09 / R17,R20,R21,R28. **Girdi:** G09.

Yap: Spatial chunk + stable order, görünür alan önceliği, en fazla dört fetch/two decoded queue, CPU/GPU LRU ve generation kontrolü. Worker'dan transfer edilen buffer detached iken yanlış yeniden kullanma. Manifest/source/font/compiler anahtarı; RAM eviction sonrası görünüm kayıpsız geri gelsin. Client persistent dosya cache'i ekleme.

**Çıkış:** Aynı paftanın farklı chunk bölünmesinde eş görünüşü, bounded buffer hesabı, corrupt scene reddi. **Negatif:** Çok hızlı kamera, A→B→C source değişimi, eski request geç gelmesi, stale font/source, görünür setin bütçeyi aşması. Bütçe dolunca içerik sessiz silinmez.

## G11 — Durable hazırlama servisi ve özel türev erişimi

**İz:** W15,W16 / E08 / R18–R20,R27,R43,R47. **Girdi:** G10. **Alan:** Node compiler container, Neon V2 migration/repository, private Blob derivative prefix, küçük site API'leri.

Yap: Yetkili revision → idempotent queue → lease/fencing → child process → staging → validation → atomic ready pointer. Aynı source/dependency hash'i tek türeve gider. Container tek job, timeout/retry/resource sınırlarına uyar. Ready pointer publish ederken source/revision/dependency kimliği tekrar doğrulanır. Original bytes Vercel request body üzerinden taşınmaz. Lokal entegrasyon izole DB/storage ile test edilir.

**Çıkış:** Yerel container ve bağlantı sözleşmesi; gerçek hazırlama/ready/reopen, job ölümü sonrası toparlanma; service health ve redakte log. **Negatif:** Duplicate job, worker death, eski lease publish, source değişmesi, permission revoke, orphan artifact, iki izleyiciden birinin iptali. **Operasyon:** Production provider seçmek/kurmak Gemini işi değildir; gerçek host erişimi yoksa production deployment NOT_RUN kalır, fake URL konmaz.

## G12 — Host, iptal ve gerçek mobil davranış

**İz:** W17,W18 / R23–R28,R30. **Girdi:** G11. **Alan:** V2 host/worker/lifecycle; UI gerçek duruma bağlanır.

Yap: Host state machine, error boundary, session/generation, cancellation ve unmount cleanup. D3 main-thread pan/zoom, touchcancel/window drag cleanup ve 28 iptal adapter'ı, pinch anchor, resize/rotation, background/resume, context loss. İlk kullanıcı turunda bilgisayar ve fiziksel Poco X6 Pro üzerinde gerçek çizim aç; cihaz/OS/browser bilgilerini RUN'a yaz. iPhone/tablet erişimi henüz yok; geniş cihaz kabulü NOT_RUN kalır, yapılmış sayılmaz.

**Çıkış:** İptal kontrol süresi; 20 sonra 100 aç/kapatta sınırlı kaynak; gerçek dokunma ve yeniden gelme kanıtı. **Negatif:** İkinci parmak gelirken ölçüm benzeri yanlış nokta yok; sheet scroll çizimi pan etmez; permission error format hatası olmaz. **Engel:** Gerçek cihaz yoksa NOT_RUN + eksik kaydı; emülasyonu gerçek cihaz diye yazma. G13/G14 kodları bağımsız yürüyebilir, cihaz kabulü kapanmaz.

## G13 — Admin dosya menüsü ve Studio entegrasyonu

**İz:** W19 / R02,R36,R38. **Girdi:** G12'nin çalışan host'u.

Yap: Liste/grid/mobil menü, command target metadata, allowlist cadEngine=v2, doğru fileId/revision/currentLease. Dynamic host'u mevcut shell sınırından seç. Normal route ve normal komut aynı kalır. V2 seçilmemişken V2 JS/WASM/font/download zinciri çalışmaz. Legacy core import/order/worker bozulmaz.

**Çıkış:** Hem menü hem deep link → doğru V2 session. **Negatif:** Seçili A iken B'nin menüsü, double event, çoklu seçim, PDF/DWF/folder/trash, refresh/back/forward, lease URL değişip byte revision değişmemesi. Hash eşliği yanında legacy davranış regresyonu da çalıştırılır.

## G14 — Public paylaşım ve erişim sınırı

**İz:** W20 / R19,R37. **Girdi:** G13,G11. Bu etap isteğe bağlı değildir; EXEC-2 kapsamındadır.

Yap: Mevcut public token yetkisine bağlı V2 seçim/kaynak/job/manifest/chunk erişimi. Her kaynak için aynı immutable revision sınırı. Admin CRUD/rename/delete/share-create kontrolü public UI'ya sızmaz. Tahmin edilebilir scene/chunk ID yetki yerine geçmez.

**Çıkış:** İzinli gerçek paylaşımda açılış ve süresi bitince yeni erişimin reddi. **Negatif:** Başka tenant ID, eski token, farklı fileId/dependency, revoke sırasında hazırlama, signed URL yenilenmesi. Çevrimdışı açık byte'ları uzaktan geri alma garantisi yok; yeni fetch kesinlikle ayrı yetki doğrular.

## G15 — Doğruluk, performans ve işletim kabulü

**İz:** W21,W22 / R29–R31,R39,R40,R44,R46,R47. **Girdi:** G14; önceki tüm kritik semantic işler.

Yap: [11](11_DOGRULAMA_PROGRAMI.md)'in format/numeric/visual/product katmanlarını gerçek corpus ve holdout'ta uygula. İlk dört dosya tam corpus sayılmaz; 32 U3'teki ≤30 MB ve >30–70 MB kullanım sınıfları ayrı test edilir. Exact font/reference yoksa durum açık. Cold first prepare, warm server scene ve ikinci cihaz sonuçlarını ayrı raporla. Release benchmark'ı her dosya/koşulda en az 30 tekrar; 30 sonuçtan güvenilir p99 iddiası üretme. İki motor aynı içerik/kaliteyle karşılaştırılır.

**Çıkış:** Ham veri, kapsam/payda, başarısız/degraded dosyalar, asset raporu ve U2 kapsamındaki kısa paketleme TODO/sonuçları, recovery/rollback, local Linux build ve release test raporu. **Negatif:** Test suite'in FAIL olup exit0 dönmesi, mock cache'in başarı sayılması, eski generated worker'ın çalışması. **Hız değerlendirmesi:** Kalite eşliği korunacak. ≥%20 warm-server median first-useful iyileşmesi ölçülmemiş bir mühendislik hedefidir; garanti veya tek başına işlevsel PASS eşiği değildir. Hedef tutmayan sınıf açık SPEED_TARGET_MISSED/GAP olur; Gemini hedefi veya karşılaştırma koşulunu değiştiremez ve bütün ürünün hız hedefi tamamlandı diyemez. Aynı kaynak/cihaz/kalite, network, browser cache, server hazırlanmışlık ve legacy RAM cache durumları eşlenir; hazır V2 ile yalnız soğuk legacy karşılaştırması genel hız iddiası olamaz. Cold hazırlık ve hazırlama maliyeti ayrı raporlanır. Ölçümün doğru tamamlanması ile hız hedefinin sağlanması ayrı durum alanıdır.

## G16 — Gerçek motor bağlı arayüzün son kalitesi

**İz:** R32–R35,R42 / UI01–UI20. **Girdi:** G15 ve gerçek UI state'leri.

Yap: 21/22'nin bütün zorunlu ekranlarını gerçek route'ta yeniden al ve açıp incele. Çizim, font, katman, loading/degraded/error ve private share state'leri gerçek veriyle bağlı olsun. Typecheck/build ile birlikte ilgili Playwright/axe/overflow/focus/target testleri geçsin. G04 fixture/fake timer/no-op handler'ın production yolunda kalmadığını kaynak/bundle/route üzerinden denetle.

**Çıkış:** Görsel indeks + ekran başına inceleme ve düzeltilen kusur; her iki tema, mobil/tablet, uzun Türkçe metin. **Negatif:** 320 px açık sheet/klavye, %200 zoom, fullscreen portal, source revision değişimi. **Tamamlandı sayılmaz:** “Daha modern yaptım” metni veya yalnız normal desktop screenshot'ı.

## G17 — Astra'ya denetlenebilir teslim

**İz:** R41,R44,R48. **Girdi:** G00–G16 kayıtları; açık engeller varsa paket kapanmaz, eksik devir hazırlanabilir.

Yap: Son SNAP, tam kaynak/dependency/asset farkı, bütün R eşlemesi ve 78 N/V/C/F alt kabul satırı, RUN/ART doğrulaması, açık CR/FAIL/NOT_RUN/DEGRADED, UI indeksi, reproducer ve sıradaki iş. Son kodun gerçek test edildiğini doğrula. Gemini bağımsız ACCEPTED yazmaz. DENETIM_DEVRI'ni doldur; [23](23_ASTRA_DENETIM_VE_DUZELTME_DONGUSU.md)'ü izleyen Astra bütün R'leri tek tek inceleyecek.

**Çıkış:** “Uygulayıcı doğruladı / denetim bekliyor” sınırları doğru teslim. **Negatif:** Eksik ham kanıt, hayalî dosya linki, bir satırda 48 PASS, testten sonra değiştirilmiş kod, manuel değiştirilmiş golden. Production push/deploy yok.

## Test komutlarının kurulması

Gemini yeni testleri scripts/cad-v2 ve tests/cad-v2 altında oluşturacak; package.json'da check:cad-v2:unit, check:cad-v2:integration, check:cad-v2:ui ve check:cad-v2:release komutları tanımlanacak. **Bu komutlar şu an yoktur; gerçek tanım eklenmeden çalışmış gibi raporlanamaz.** Unit komutu format/geometry/scene; integration local compiler/jobs/auth; UI browser; release bunları ilgili legacy regresyonlarıyla birleştirir.

G00'da mevcut test config/fixture izolasyonu okunur. Bağımsız scriptler repo finally/timeout/nonzero exit standardına uyar. Sadece yeni eklenen assertion'ları aynalayan gereksiz testler yazılmaz; kabul oracles'ı ve kullanıcı akışı doğrulanır. Tam build yalnız milestone/entegrasyon/release'te; her renk değişiminde bütün repo suite'i tekrar koşturmak gerekmez.

## Eski backlog ile fark

E02 artık Gemini'nin decoder yarışı yapacağı iş değildir; seçilen adapter'ların uygunluğu bağımsız referansla kontrol edilir. E10 WebGPU/Offscreen/WASM seçimi bu sürümde yürütülmez. W14 persistent client cache devre dışı kapsamdır, G10 RAM/server cache sözleşmesini uygular. W15/W16 ve W20 bu sürümde zorunludur. Kullanıcı ölçüm/annotation eklenmez. Bunların aksi yalnız sonraki Astra/kullanıcı karar revizyonuyla olur.

## EXEC-2 paket başına zorunlu teknik okuma

| Paket | Ek sözleşme / alt kabul |
|---|---|
| G03 | 25 + 31; C01–C06,C11,C12 |
| G04 | 21/22 + 28/30; N01–N23 erken harness |
| G05–G08 | 29/31; V01–V13,V18 ve kaynak semantik atlası |
| G09–G10 | 29/31; viewport/resource/order/LOD, C02–C06,V11–V15 |
| G11 | 25/31; heartbeat/TTL/idempotence/fence, C07–C10 |
| G12 | 28/29; bütün N, V15–V17 gerçek sahne/lifecycle |
| G13–G14 | 30/31; F01,F18,F21–F23 ve her yeni metadata/resource yolu yetkisi |
| G15–G17 | Bütün R ve N/V/C/F; mock/gerçek/fiziksel/production ayrımı |

## U1 referans ve kullanıcı kabulü

G01/G15 [32 — Kullanıcı hedefi ve gerçek kabul](32_KULLANICI_HEDEFI_VE_GERCEK_KABUL.md) REF profilini uygular; G12/G16 bilgisayar/Poco gerçek kullanıcı fişini hazırlar. Referans CAD programının kurulu olduğu henüz doğrulanmadı. Kaynak görünüş farkı tolerans/ayar değiştirerek gizlenmez; G11/G15 yerel kaynak tüketimini raporlar, production sağlayıcısı seçmez.

## U2 paketleme ayrımı

G02/G07/G15'te lisans raporu tamamlanmadan kod/test yapılamaz biçiminde bir giriş kapısı yoktur. Kaynak/sürüm/hash ve gerçek font varlığı teknik olarak doğrulanır; hak/notice kayıtları 00 D22/U2'deki dar paketleme akışıdır. Eksik fontun görüntüyü bozması hâlâ doğruluk kusurudur.

## U3 negatif kabul

G07 farklı font alias'ını exact saymayı; G09 ek dosya seçme zorunluluğunu, tahmini XREF bağlamayı ve embedded geometriyi eksik dış dosya diye atmayı; G13 tek dosyada klasör/ZIP istemeyi FAIL sayar. G15 büyük dosya profilini yalnız padding ile doldurmaz.
