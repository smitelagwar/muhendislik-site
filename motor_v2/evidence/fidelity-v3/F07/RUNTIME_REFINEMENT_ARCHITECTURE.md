# F07 — Runtime curve refinement mimarisi / karar kaydı

Durum: **KISMİ RUNTIME UYGULAMASI — F07 AÇIK**  
Tasarım baseline'ı: 2026-09-23 · Güncel uygulama durumu: 2026-09-24

Bu kayıt, 2026-09-23'teki tasarım ve akış denetimiyle başladı. Eski checkpoint'ler kendi tarihlerinin durumunu saklar; güncel durum aşağıdadır. Bu belge veya uygulama AutoCAD eşdeğerliğini iddia etmez.

## Güncel uygulama durumu — 2026-09-24

- Chunk'lar opsiyonel `CURVE_DATA` F32×8 affine sidecar ve `META.curveSourceRefs` taşır. Bounded worker evaluator'ı ve source cache/LRU, fallback chord span'lerini camera/error profiline göre yeniden örnekleyebilir. Non-periodic rational spline knot-span kaynak ağları aynı META sürümündeki `splineSource` yüküyle saklanır. Compiler chunk world-bbox'ı flat manifest ve index sayfasında taşır, lineweight stroke'unu da kapsar ve manifest validator sınırları doğrular.
- Direct ve nested/transformed continuous `CIRCLE`, `ARC`, `ELLIPSE`, width'siz continuous LWPOLYLINE `BULGE` ve bounded positive-weight non-periodic entity `SPLINE` sidecar kapsamındadır. Continuous HATCH edge `ARC`/`BULGE`/`ELLIPSE` ve non-periodic `SPLINE` boundary knot-span'leri de sidecar alır. INSERT handle yolu ve parent entity/segment/span source identity korunur; XCLIP ile kesilen chord fragment'lerine analytic source bağlanmaz. Width'li veya kesintili polyline runtime sidecar almaz.
- Gerçek host, 1/4 oktav zoom bucket, same-bucket pan no-op, coalesced transient `0.75 CSS px` ve idle `0.25 CSS px` refinement, kalite gerilememe, stale yanıt düşürme ve atomik WebGL chunk-group replacement uygular. Gerçek Chromium e2e ARC ile camera → worker → WebGL akışını, stale yanıt/pan ve transient/idle kapılarını sınar. Nested BULGE için compiler-binary-worker hattı yoğun affine oracle ile unit test edilir.
- Güncel `CAD_V2_COMPILER_REVISION` v27'dir; `DV2SCN01` schema v1, `META.curveSourceVersion` v3 kalır. XY/TRIANGLES vertex, affine `CURVE_DATA` center/basis/parameter ve PATH_DISTANCE scalar Float32 quantization; direct top-level CIRCLE/ARC, ELLIPSE; direct+nested/transformed standalone non-periodic SPLINE; nested INSERT singular value ile world-space'e taşınan continuous, widthless LWPOLYLINE BULGE ve ELLIPSE; ve curved HATCH boundary line chord sagitta metrikleri compiler/index manifestine world/CSS olarak yazılır. Her curved-line primitive için sagitta + aynı primitive endpoint-quantization composite bound tutulur; nested HATCH/SPLINE/BULGE/ELLIPSE bound'ları INSERT affine singular value ile, paper viewport bound'ları viewport scale ile yükseltilir (XCLIP fragment'lerinde source claim'i atlanır). HATCH dolgu triangles için mevcut boundary + triangle encoding composite ayrı kalır; bu line-boundary metriği runtime fill remesh/topology değildir. Affine sidecar source error worker refinement bütçesinden düşülür. PATH_DISTANCE hatası active screen budget'ı aştığında `PATH_DISTANCE_PRECISION_LIMIT_REACHED` ile scene degraded olur. Screen budget aşımında ilgili quality diagnostics üretilir. PATH_DISTANCE host'tan taşınıp worker refinement sırasında korunur; mevcut renderer PATH_DISTANCE lane'ini okumadığı için bu ölçüm tek başına rendered dash görünüş oracle'ı değildir.
- Host doğrulanmış chunk bbox'larını renderer'a verir. Renderer kamera world viewport'u ile kesişmeyen loaded chunk group'larını culler; kamera değişiminde ve layout seçiminde görünürlük yenilenir, boundsız legacy chunk fail-open kalır. Compiler chunk'ları hâlâ global painter-order akışından ardışık sayım sınırıyla üretir ve production host bütün chunk'ları eager fetch/decode eder; spatial partition ve on-demand loading açık kalır.
- Manifest'teki `maxQuantizationErrorWorld`, XY ve triangle chunk-local Float32 vertex'lerinin origin geri eklendikten sonra ölçülen azami world-space farkıdır. `maxCurveSourceQuantizationErrorWorld` F32 affine `CURVE_DATA` merkez/basis/parametre hatasını; `maxPathDistanceQuantizationErrorWorld` ise kaynak cumulative path mesafelerinden PATH_DISTANCE Float32 değerine scalar round-trip farkını ölçer. İki lane de active screen profile ile CSS piksele çevrilip target aşımında ayrı tanı üretir. PATH_DISTANCE henüz renderer tarafından okunmadığından bu metric transport/precision muhasebesidir; görünür dash fazı doğruluğunu kapatmaz. Worker affine curve source payını runtime refinement toleransından çıkarır.
- `applyCurveRefinementsToChunk`, yeni PATH_DISTANCE ara değerlerini refined Float32 chord uzunluklarının kümülatif oranıyla dağıtır; eski span'in başlangıç/bitiş fazı sabit kalır ve komşu chord uçları aynı faz değerini paylaşır. Renderer PATH_DISTANCE'i hâlen okumadığından bu worker veri sözleşmesinin doğruluğudur, görünür dash veya AutoCAD eşdeğerliği kanıtı değildir.
- F07 hâlâ **IN_PROGRESS**. Sentetik non-periodic rational spline oracle'ı degree-2/3/4/5 için sırasıyla iç knot çoklukları 1/2, 1/2/3, 1/2/3/4 ve 1/2/3/4/5 profillerini bağımsız dense De Boor hesabıyla sınar; diğer degree/knot profilleri, AutoCAD-authored periodic spline fixture/desteği ve AutoCAD evaluator kıyası açık kalır. HATCH dolgusunun runtime remesh/error accounting'i, bounded spatial partition/on-demand loading, kamera/GPU dönüşümü ve sonraki output rounding, kalan tessellation, fill/glyph/chunk-boundary muhasebesi, PATH_DISTANCE rendered dash fazı oracle'ı ve aynı-source AutoCAD görüntü/ölçü oracle'ı da açıktır. Genel AutoCAD parity iddiası yoktur.
- `testNestedBulgeTessellationErrorIncludesInsertTransforms` now independently measures each emitted nested BULGE chord's Float32 XY endpoint round-trip loss and verifies the manifest composite is the maximum same-chord sum of that loss plus the affine-scaled source sagitta. Residual cross-primitive/chunk/glyph composites remain open.
- `testNestedSplineTessellationErrorIncludesInsertTransforms` independently derives each adaptive cubic subcurve's control-hull sagitta from its Bernstein source/derivative and measures exact source endpoints against the chunk-local Float32 output. The same primitive composite and active-view CSS value match the manifest; this does not close other source/chunk or rendered-pixel gates.

## 2026-09-24 checkpoint — static HATCH boundary line composite

`triangulateHatch` now carries a conservative source deviation bound on each chord generated from a curved HATCH edge into the emitted boundary-line primitive. `EntityVisitor` scales that bound by the combined INSERT transform's largest singular value; paper viewport projection applies its scale once downstream. The existing per-line static curved-geometry composite metric adds that deviation bound to the same emitted line's worst chunk-local Float32 XY endpoint round-trip loss. A direct large-coordinate semicircle fixture measures the analytic `R(1-cos(π/(2n)))` bound and serialized endpoints; a nested reflected/rotated 8× fixture checks affine propagation; a paper fixture checks single viewport-scale application; and an XCLIP fixture confirms visible clipped fragments receive no source-bound claim. Compiler/cache revision v25→v26; schema v1 unchanged. HATCH fill TRIANGLES remesh/topology/error, glyph/chunk-boundary residuals, other-source/chunk composite interactions, periodic SPLINE AutoCAD, knot/degree profiles beyond the synthetic degree-2 multiplicities 1/2, degree-3 multiplicities 1/2/3, degree-4 multiplicities 1/2/3/4 and degree-5 multiplicities 1/2/3/4/5, bounded spatial partition/on-demand loading, visible PATH_DISTANCE dash, WebGL raster/device-pixel and same-source AutoCAD image/measurement remain open. F07 remains IN_PROGRESS; plan 14/19 (74%), 5/19 (26%) open.

## Başlangıç akışı ve kök engel (2026-09-23 denetimi)

1. `POST /api/dokumantasyon/cad-v2/prepare` kaynak DWG/DXF baytlarını alır ve `CadV2DurableService.executeJobSync` içinde canonical belgeyi bir kez derleyip deterministik sahne kimliğiyle yayımlar.
2. `CadV2HostShell` manifest geldikten sonra gerçek layout BBox'ını renderer'a verir, `fit()` çağırır ve ancak bundan sonra `D3CameraAdapter` içindeki gerçek `unitsPerCssPixel`, CSS viewport genişliği/yüksekliği belli olur.
3. Browser worker protokolü v1 yalnızca `load-chunk`, `cancel`, `dispose` taşır. Worker `DV2SCN01` chunk'ını açar; eğri hesaplamaz.
4. Scene compiler `CIRCLE`, `ARC`, `ELLIPSE`, bulge ve desteklenen `SPLINE` kaynaklarını derleme sırasında line chord'larına çevirir. Mevcut binary payload XY/DRAW_RUNS/TRIANGLES/PATH_DISTANCE saklar; kaynak eğrinin parametrelerini ve kararlı entity/curve kimliğini taşımaz.

Sonuç: gerçek camera profili ilk derlemeden sonra hazırdır; fakat worker'a ulaşan geometride runtime yeniden örneklemeyi mümkün kılacak eğri kaynağı yoktur. Yalnızca kamera profilini worker mesajına eklemek kaliteyi değiştirmez. Her zoom/pan'da aynı dosyayı baştan parse/compile etmek de doğru çözüm değildir: gecikme, kaynak maliyeti, cache çoğalması ve eski generation sonucu yarışı üretir.

## Karar: kaynak eğri sidecar'ı + görünüm bucket'ında worker tessellation

- Mevcut line/triangle chunk'ları hızlı ilk görüntü ve geri uyumluluk için korunur.
- Her chunk, ilgili kaynak eğrilerin lineerleştirilmemiş ve blok dönüşümü uygulanmış parametrelerini içeren sürümlü bir `CURVE_SOURCES` sidecar/section taşır. Geçişte sidecar yoksa mevcut line geometry kullanılır ve ince zoom'da exact/refined iddiası verilmez.
- İlk runtime kapsam yalnız 2D `CIRCLE` ve `ARC` olur. Kaynak koordinatına uygulanmış affine dönüşüm, daireyi elipse çevirebildiğinden payload yalnız center/radius saklayamaz; dönüştürülmüş merkez ve iki basis vektörü, parametre başlangıcı/süpürme yönü ile temsil edilir. Dash/gap pattern'i ve başlangıç fazı da curve başına korunur.
- Worker saf, Node bağımlılığı olmayan evaluator kullanır; istek `targetErrorCssPixels`, `unitsPerCssPixel`, `maxTransformSingularValue`, görünüm bucket'ı, `viewSessionId`, `generation`, `sourceVersionKey` ve curve/chunk kimliğini taşır. Çıktı ölçülen/conservative hata üst sınırını, üretilen segment sayısını ve cap durumunu döndürür.
- DPR, renderer'ın çizim buffer'ı ile CSS ölçüsünü karıştırmamalıdır. Kullanıcıya tanımlı hata CSS pikselindedir; DPR yalnız raster çözünürlüğü içindir. DPR'yi units/CSS-pixel'e ikinci kez çarpmak yasaktır.
- Bucket yalnız zoom/error profiline bağlıdır; pan ve kamera merkezi cache kimliğine girmez. Bucket sınırında cache miss normaldir. Aynı bucket içindeki pan yeni curve tessellation işi başlatmaz.
- Zoom sırasında mevcut mesh geçici olarak görünür kalır; worker en güncel generation için refinement üretir. Yeni geometri tüm curve kayıtları doğrulandıktan sonra atomik değiştirilir. Eski generation yanıtı atılır. Idle son durum daha sıkı hedef isterse ikinci, sınırlı refinement geçişi yapılır.
- Her curve/entity için segment ve iş bütçesi vardır. Cap aşılırsa kısmi geometri kalite durumuna yansıtılır; sahne `exact` kalamaz. Geçersiz eğri fail-closed olur. Worker iptali ve dispose tüm bekleyen allocation'ları serbest bırakır.

## Zorunlu uygulama sırası

1. **Sözleşme ve saf matematik:** `CIRCLE`/`ARC` analytic record tipi, affine basis dönüştürme, dash phase, bounded evaluator ve dense bağımsız oracle. Node import'u, DOM ve Three.js bağımlılığı olmaz.
2. **Protokol:** DV2 scene schema'da opsiyonel/versioned curve sidecar; eski chunk decode devam eder. Büyük sidecar parça başına byte/entity limitine uyar ve manifest hash'ine dahil edilir.
3. **Worker generation:** `refine-curves` isteği/yanıtı session+generation+source+bucket kimliği taşır. Eski yanıt düşürme, cancel, malformed payload reddi ve bellek sınırı test edilir.
4. **Renderer swap:** Stable curve id ile yalnız doğru layout/layer/style içinde line mesh değiştirilir. Yeni mesh hazır olmadan eski silinmez; draw order, dash phase, layer toggle, lineweight ve dispose davranışı korunur.
5. **Camera policy:** gerçek kamera state'i (`unitsPerCssPixel`, CSS ölçüler) renderer callback'inden bucket yöneticisine gider. Pan aynı bucket'ta no-op'tur; zoom/resize yeni bucket gerektirirse tek coalesced istek çıkar. Transient/idle için ayrı ve ölçülebilir hedefler tanımlanır.
6. **Gerçek pipeline kabulü:** browser testinde aktif camera → worker refine → binary/mesh swap → camera tekrar değişirken stale generation'ın atılması doğrulanır. CSS hata üst sınırı dönüşüm ve DPR profillerinde ölçülür. Aynı kaynak AutoCAD'de referans açısı ayrıca karşılaştırılır.

## Kapsam dışı davranış / kayma engeli

- Bu işi “worker'a camera objesi ekleme” ile tamamlandı sayma; sidecar'da curve source ve renderer swap yoksa yalnız mesaj taşınmıştır.
- Her wheel/pan olayında DWG/DXF'yi baştan decode/compile etme.
- Çalışma anında sabit sayıda nokta üretip bunu AutoCAD/0.25 px exact diye etiketleme.
- DPR'yi CSS piksel bütçesine çift uygulama.
- Bozuk/unsupported rational veya periodic spline'i yaklaşık çizip kaliteyi exact bırakma. Spline için ayrı kabul oracle'ı olmadan ilk circle/arc kapsamına karıştırma.
- Cache'i pan merkeziyle anahtarlama veya stale generation mesh'ini son mesh'in üstüne yazma.
- Segment/entity/bellek tavanlarını kaldırma.

## Kabul ölçüleri

- Binary roundtrip sonrası dönüştürülmüş `CIRCLE` ve saat yönlü/saat yönü tersi `ARC` yoğun analitik oracle'a karşı target CSS hatasını aşmaz.
- Non-uniform/mirrored/nested INSERT dönüşümü ve paper viewport downstream transform'u sınanır.
- Kesikli eğride dash/gap uzunluğu ve seam fazı korunur; çizgi tavanında explicit degraded tanısı vardır.
- Aynı pan bucket'ında yeni tessellation yok; zoom bucket'ında en fazla bir aktif iş; yeni generation öncekini iptal eder.
- Eski chunk, malformed parametre, NaN, aşırı segment isteği, dispose sırasında pending iş ve protokol eski sürüm fallback'i test edilir.
- Yeni worker geometry'sinin layer/color/lineweight/order ve AutoCAD visual oracle'ı kabul edilmeden F07 kapanmaz.

## 2026-09-23 uygulama checkpoint'i — kaynak aralık sidecar'ı (kısmi)

- `DV2SCN01` eski chunk biçimi korunarak opsiyonel `CURVE_DATA` (8×F32) section'ı üretilebilir hale getirildi. Her kayıt chunk-origin'e göre merkez, iki basis vektörü ve parametre başlangıç/bitişini taşır; META v1 referansı fallback XY vertex aralığına, kararlı layout/handle/type curve kimliğine ve kaynak segment aralığına bağlar.
- İlk kapsam scene compiler'ın doğrudan derlediği `CIRCLE`/`ARC` entity'leridir. Sürekli chord aralıkları bir sidecar aralığında birleştirilir; linetype kesintilerinde/gap'lerde aralık birleştirilmez. Chunk sınırları doğal olarak yeni aralık başlatır. Mevcut XY ve PATH_DISTANCE fallback'i aynen korunur.
- `parseSceneChunk` artık section sabit F32×8 stride'ını ve tüm eğri alanlarının finite değer taşımasını kontrol eder. Test; chunk bölünmesi, saat yönü iki ARC sweep'i, parametrik uçların binary fallback chord uçlarıyla eşleşmesi ve NaN'ın trust boundary'de reddini kapsar.
- Saf bounded evaluator `src/lib/cad-v2/worker/curve-refinement.ts` içine eklendi. Her affine basis için `max|P''|·Δt²/8` conservative interpolation bound kullanır; `unitsPerCssPixel` × downstream singular-value bütçesini uygular; chunk-relative Float32 quantization payını toleranstan düşer. Record/reference/vertex span doğrulanır, parametre ve toplam çıktı cap'leri uygulanır, cap veya yetersiz Float32 precision olduğunda `degraded` döner ve mevcut fallback'in tutulabilmesi için koordinat üretmez.
- Kanıt: `npx tsx tests/cad-v2/precision-refinement.test.ts`, `npx tsx tests/cad-v2/binary-protocol.test.ts`, `npx tsx tests/cad-v2/curve-refinement.test.ts` başarılıdır. Yeni oracle compiler sidecar'ından başlayıp saat yönü ARC, non-uniform affine ellipse, mirrored sweep, yoğun bağımsız örnekleme, segment/precision cap ve bozuk kayıt reddini denetler.
- `refine-curves` worker mesajı eklendi. `load-chunk` sırasında sidecar worker-local 8 MiB LRU belleğe kopyalanır; sonraki istekler DWG/DXF'yi yeniden parse/compile veya sidecar'ı yeniden transfer etmez. `dispose` ilgili session belleğini temizler. `CadV2WorkerClient.refineCurves()` worker mesajı ve Node/senkron fallback'i sunar; generation ilerletme bekleyen refinement Promise'lerini reddeder ve worker'a yeni generation cancel mesajı gönderir. Worker eski session-generation mesajlarını ve farklı source anahtarını reddeder.
- `scripts/build-dwg-dxf-worker.mjs` artık legacy worker'ı koruyarak CAD V2 worker public bundle'ını da üretir; esbuild metafile kontrolü bounded evaluator'ın bundle'a girdiğini doğrular. Gerçek Chromium worker kabul testi public bundle'ı HTTP origin'den çalıştırıp load → source cache → refine → cancel/gen-2 → eski gen-1 isteğini düşürme → cached gen-2 refinement akışını tamamlar.
- Kanıt: `npx tsx tests/cad-v2/precision-refinement.test.ts`, `npx tsx tests/cad-v2/binary-protocol.test.ts`, `npx tsx tests/cad-v2/curve-refinement.test.ts`, `npx tsx tests/cad-v2/worker-refinement-browser.test.ts` başarılıdır.
- **Açık:** host camera callback'i bucket/coalescing/idle/transient hedefini henüz seçmez ve returned span renderer mesh'ine atomik olarak bağlanmaz. İşleyen evaluator senkron ama katı 65.536 toplam segment limiti ile bounded olduğu için aynı worker event loop cancel mesajını hesaplama sırasında alamaz; generation değişiminde host eski cevabı kabul etmez. Refine/renderer swap, dönüştürülmüş/nested kaynak, AutoCAD referans kıyası gelmeden F07 kapanmaz.
- **Açık:** worker bu sidecar'ı henüz okumaz/tessellate etmez; renderer swap/camera bucket/generation entegrasyonu yoktur. Sidecar şu anda direct top-level `CIRCLE`/`ARC` kapsamındadır; INSERT/nested INSERT, viewport'tan dönüştürülmüş geometri, ELLIPSE/bulge/SPLINE ve source dash metadata'nın ayrı runtime yeniden-örneklemesi bu checkpoint ile çözülmüş sayılmaz. Dolayısıyla bu teslim F07'yi kapatmaz ve AutoCAD fidelity iddiası oluşturmaz.

## 2026-09-24 uygulama checkpoint'i — canlı zoom bucket ve chunk swap (kısmi)

- `CadV2HostShell`, gerçek `CadCameraState.unitsPerCssPixel` değerini izler. Kamera profili 1/4 oktav bucket'a yuvarlanır; kamera merkezi ve pan bucket anahtarına girmez. Aynı bucket içindeki pan ve tekrarlanan kamera callback'leri yeni tessellation işi çıkarmaz. Zoom olayları 120 ms debounce edilir ve aynı anda en fazla bir refinement taraması çalışır.
- Bucket içindeki en yakın zoom değerinin (bucket üst sınırı) kullanılması toleransı muhafazakâr tutar. Hedef `0.25 CSS px`, downstream transform `1`'dir; sidecar şu an doğrudan derlenmiş, dönüşümü kaynak basis'e gömülü CIRCLE/ARC'lerle sınırlıdır. DPR CSS hata bütçesine eklenmez.
- Host her chunk'ın değişmez ilk unpack edilmiş kopyasını tutar. Worker sonucu güncel değilse renderer'a uygulanmaz. Başarılı span'ler `applyCurveRefinementsToChunk()` ile eski fallback chord aralığının yerine bağlı line-segment çiftleri olarak yazılır; draw-command start/count aralıkları vertex farkına göre tekrar indekslenir. Degraded/cap/precision-fail span'leri fallback'lerinde kalır.
- Renderer `replaceSceneChunkGeometry()` ile yeni chunk grubunu senkron kurar; yeni grup hazır olmadan eski görünüm atılmaz. Kurulum tamamlanınca eski grup aynı JS görevinde kaldırılıp kaynakları dispose edilir; bir sonraki RAF'ta eski ve yeni span üst üste çizilmez. Eski kaynak chunk saklandığı için sonraki bucket yeni toleransla baştan üretilir.
- `tests/cad-v2/curve-refinement.test.ts` şimdi sadece evaluator'ı değil, fallback değiştirme, bağlantılı segment üretimi, komşu span'lerin korunumu, draw-command aralık kaydırması, layer/order/lineweight metadata'sı ve kaynak chunk immutability davranışını da test eder. `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` ve `npx tsc --noEmit -p tsconfig.next.json --incremental false` bu checkpoint'te **PASS**.
- Browser worker kabulü worker cache/refine/cancel/stale-generation yolunu, Playwright F06 kabulü gerçek host'un layout değişimini doğrular. Bunlar henüz tek bir uçtan uca testte canlı kamera → refinement → Three/WebGL span swap → zoom/pan sırasında stale drop akışını ölçmez; host camera bucketing ve renderer replacement için bu birleşik browser oracle'ı açık kalır.
- Kamera değişimi yeni isteği debounce eder ve eski cevabın uygulanmasını engeller; worker içindeki senkron hesaplama sırasında gelen `cancel` mesajı hesaplamayı kesmez. Bu nedenle hesaplama segment bütçeleriyle bounded kalır, stale sonuç host'ta atılır; gerçek preemptive cancellation iddiası yoktur. Transient ve idle için ayrı kalite profilleri henüz yoktur.
- Scope hâlâ yalnız direct top-level CIRCLE/ARC sidecar'dır. Transformed/nested kaynaklar, ELLIPSE/bulge/SPLINE, dash-phase runtime eşliği, bucket başına çoklu kalite profili, spatial partition/global order index, fill/glyph error accounting ve same-source AutoCAD visual oracle açık kalır. F07 **IN_PROGRESS**; AutoCAD parity iddiası yoktur.

## 2026-09-24 doğrulama checkpoint'i — canlı host → worker → WebGL

- `tests/document-studio/cad-v2-layout-viewport.spec.ts` içine gerçek host kabul senaryosu eklendi. Test bir ARC `CURVE_DATA` sidecar'ı olan DV2SCN01 chunk'ını sahte HTTP yanıtlarından host'a yükler; gerçek public CAD V2 worker'ı ve Three/WebGL renderer'ı kullanır.
- Host ilk görüntüyü fallback chord olarak çizer. Test kullanıcıya görünen `Yakınlaştır (+)` düğmesine basar ve 100%→125% durumunu bekler; worker'a `refine-curves` mesajı gönderildiğini, sonra WebGL `LINES` drawArrays çağrısının vertex sayısının fallback 2'den büyük olduğunu doğrular. Bu, source sidecar → browser worker → yeni renderer geometrisi akışını birlikte kanıtlar; yoğun referansla piksel-space hata ölçümü ayrı evaluator/compiler oracle'ında kalır.
- İlk koşuda test `.next` altında önceden derlenmiş eski host kodunu kullanmıştı. `playwright.config.ts` artık varsayılanı dev/source sunucusu yaptı; derlemeden sonra production kabul testi çalıştırmak isteyen komut `PLAYWRIGHT_PRODUCTION_SERVER=1` seçimini açıkça vermelidir. Bu değişiklik CI/build server varsayımını açık ve tekrarlanabilir kılar.
- Doğrulama: `npm run check:cad-v2:ui` (F06 ve F07 Playwright testleri 2/2), `npx tsc --noEmit -p tsconfig.next.json --incremental false`, `npx tsx tests/cad-v2/curve-refinement.test.ts`, `git diff --check` — **PASS**.
- Kapsam sınırı: test pan no-op sayımını, transient/idle iki aşamalı profili veya same-source AutoCAD görüntü eşleşmesini sınamaz. Bunlar ve transformed/nested, ellipse/bulge/spline sidecar, periodic spline, spatial partition/order ve fill/glyph hata muhasebesi F07'nin açık kabul kapılarıdır. F07 paket statüsü **IN_PROGRESS**.

## 2026-09-24 doğrulama checkpoint'i — stale bucket yanıtını düşürme

- Browser testindeki gerçek Worker nesnesinin `onmessage` teslimi kontrollü hale getirilir. İlk refinement cevabı bekletilir; bu sırada toolbar zoom'u kamerayı ikinci bucket'a taşır.
- İlk (stale) cevabı teslim etmek renderer vertex sayısını değiştirmemelidir. Host eski promise'i tamamladıktan sonra güncel bucket'ı yeniden kuyruğa koyar. Test ikinci `refine-curves` isteğini ve onun cevabı gelene kadar fallback vertex sayısının sabit kalmasını şart koşar; ikinci yanıt teslim edilince WebGL çizgi sayısı büyür. Bu, gerçek host/browser/worker/renderer hattında stale sonucun uygulanmamasını kanıtlar.
- Güncel bucket geometry'si kurulduktan sonra canvas input surface üzerinde gerçek drag ile pan yapılır. Canvas screenshot'ı değişirken zoom label sabit kalır ve worker refinement request sayısı artmaz; bu aynı bucket içi pan/no-op politikasını gerçek host üzerinde kanıtlar.
- `npm run check:cad-v2:ui` F06 + F07 Chromium **2/2 PASS**; production runtime typecheck, curve evaluator/replacement testi ve `git diff --check` **PASS**.
- Açık: zoom bucket cache davranışının daha geniş oracle'ı, transient/idle profile, transformed/nested ve ELLIPSE/bulge/SPLINE sidecar, periodic spline, gerçek spatial partition/order index, fill/glyph error accounting ve same-source AutoCAD görsel/ölçü karşılaştırması. F07 **IN_PROGRESS**.

## 2026-09-24 checkpoint — nested/transformed CIRCLE ve ARC

- EntityVisitor, block içinde derlediği continuous CIRCLE ve ARC chord'larına analitik kaynak span'i ekler. Kaynak merkez ve basis vektörleri birleşik parent+nested INSERT affine matrisinden geçirilir; ARC'ın saat yönü/saat yönü tersi signed sweep'i parametre aralığında korunur.
- Eğri kimliği her INSERT instance handle'ını ve kaynak entity handle/type'ını içerir. Aynı blok birden çok noktaya yerleştirildiğinde kayıtlar birbirine karışmaz. Scene compiler dönüştürülmüş kaynağı standart `CURVE_DATA`/META sidecar biçimine yazar; worker aynı bounded evaluator ile işler.
- Kabul testi iki seviye INSERT zincirinde translation, rotation, non-uniform scale ve mirrored scale uygular; bir block iki ayrı instance ile yerleştirilir. Dört kaynak span'in kimlikleri, fallback uç noktaları ve 20.000 örnekli bağımsız yoğun oracle altında `0.2 CSS px` ekran hatası doğrulanır.
- Etkin XCLIP altında kırpılan primitive'lere sidecar eklenmez; bir source arc birden çok görünür parçaya bölünmüşken tam aralık varsaymak yanlış olur. Kesintili linetype, LWPOLYLINE bulge/width ve diğer kaynaklar bu checkpoint'in kapsamına dahil değildir; var olan fallback geometri devam eder.
- F07 hâlâ **IN_PROGRESS**. Nested ELLIPSE/BULGE/SPLINE, HATCH eğri sidecar'ları, periodic spline AutoCAD fixture'ı, spatial partition/global painter-order index, fill/glyph error accounting ve same-source AutoCAD visual oracle açık kalır.

## 2026-09-24 checkpoint — nested/transformed ELLIPSE

- INSERT visitor içindeki continuous ELLIPSE için ellipse major/minor basis ve merkez birleşik nested affine dönüşümden geçirilip sidecar'a yazılır. Parametre sweep'i, `endParam <= startParam` sarımını koruyacak şekilde normalize edilir; worker evaluator çıkışını aynı signed/parametrik eğri üzerinden üretir.
- İki nested INSERT seviyesi, non-uniform + mirrored scale, rotation ve aynı block'un iki ayrı instance'ı altında CIRCLE/ARC/ELLIPSE birlikte derlenir. Altı sidecar span'i, benzersiz instance curve ID'leri, fallback uç noktaları ve 20.000 örnekli bağımsız `0.2 CSS px` oracle'ı doğrulanır.
- Derleyici çıktısının yeni sidecar davranışı cache'e doğru yansısın diye compiler revision `cad-v2-compiler-2026.09-v5` → `cad-v2-compiler-2026.09-v6` ilerletildi. Binary section layout değişmedi; `DV2SCN01` schema version aynı kaldı.
- F07 **IN_PROGRESS**. Nested LWPOLYLINE bulge ve SPLINE, HATCH runtime source, periodic spline AutoCAD fixture/desteği, spatial partition/global order index, fill/glyph error muhasebesi ve same-source AutoCAD visual oracle hâlâ açık.

## 2026-09-24 ek karar — iki kademeli tolerans ve görüntü kalitesini geriletmeme

- Kamera bucket değişince tek transient refinement 120 ms coalesce edilir ve `0.75 CSS px` hedefi kullanır. Son kamera hareketinden 600 ms sonra aynı bucket'ta idle refinement `0.25 CSS px` ile çalışır. Aynı bucket pan, transient tessellation istemez; idle zamanlayıcısı her kamera callback'inde temizlenip yeniden kurulur. Kamera zoom'u bucket değiştirirse önceki epoch geçersiz olur ve güncel bucket kuyruğa girer.
- Chunk başına gösterimdeki geometrinin konservatif world-error sınırı saklanır. Worker'dan gelen başarılı yeni hedef, var olan görüntünün hata sınırını iyileştirmiyorsa renderer swap yapılmaz. Bu, daha kaba transient cevabın yüksek kaliteli önceki geometriyi zoom geçişinde geriletmesini önler. Başarılı daha sıkı cevap aynı atomik group replacement yoluyla uygulanır. Transient/idle degraded/cap yanıtlarında kısmi span'ler uygulanmaz; mevcut display ve teşhis korunur.
- F07 host browser kabul testi başlangıç fit'inin transient/idle zincirini ölçüm taban çizgisinden önce tamamlar; kullanıcı zoom'u sırasında stale yanıtı bırakıp yalnız güncel sonucu kabul ettirir; hedef sırasını `.75 → .75 → .25` olarak doğrular; idle penceresindeki pan'ın sayacı sıfırladığını, pan'ın yeni transient isteğe yol açmadığını, transient cevabın daha hassas display'i koruduğunu ve idle cevabın geometriyi sıkılaştırdığını kontrol eder.
- Kullanıcı hareketi aynı bucket'ta kısa aralıklarla yinelendiğinde idle hesabı ertelenir. Worker içindeki senkron evaluator hesaplama sürerken browser `cancel` mesajını okuyamaz; hesap yine bounded segment bütçeleriyle sınırlıdır ve epoch kontrolü stale sonucu uygulamaz. Preemptive worker cancellation iddiası yoktur.
- F07 **IN_PROGRESS**. Top-level ELLIPSE sidecar artımı `CURVE_DATA` affine-basis kaydını yeniden kullanır; ellipse major vector major basis, ratio ile dik döndürülmüş vector minor basis, signed/wrapped t aralığı da source parametrelerini taşır. Direct top-level LWPOLYLINE bulge de `BULGE` sourceType ve signed sweep ile aynı worker evaluator'a bağlanır. Width'li polylinelerde fill/centerline kalitesi ayrışmaması, kesintili linetype'ta dash/gap fazı kaybolmaması için bu iki profil fallback'te bırakılır. Unit zinciri, UI zinciri, production runtime typecheck ve `git diff --check` PASS. Runtime source scope direct top-level `CIRCLE`/`ARC`/`ELLIPSE`/width'siz-continuous `BULGE` ile sınırlıdır; transformed/nested kaynaklar, HATCH bulge, SPLINE knot-span/periodic AutoCAD fixture'ı, spatial partition/global painter-order index, fill/glyph/chunk-boundary error accounting ve same-source AutoCAD pixel/measurement oracle açık kabul kapılarıdır.
- Compiler çıktısı değişince cache identity yenilensin diye compiler revision `cad-v2-compiler-2026.09-v4`'ten `v5`'e yükseltildi; binary schema değişmediği için `DV2SCN01` schema version aynı kaldı.

## 2026-09-24 durum uzlaştırması — nested BULGE refinement ve statik bound

Önceki checkpoint'lerde nested LWPOLYLINE bulge sidecar'ı “açık” olarak listelenmişti. Daha sonraki uygulama kaydı ve `tests/cad-v2/curve-refinement.test.ts` bunu kapatır: continuous, widthless nested/transformed bulge source interval'ları `CURVE_DATA` üzerinden bounded worker evaluator'a taşınır; mirrored/non-uniform INSERT ve XCLIP davranışı ayrı fixture'larla sınanmıştır. Bu, AutoCAD parity kabulü değildir.

`tests/cad-v2/chunk-error-accounting.test.ts` ile eklenen `maxBulgeCurveTessellationErrorWorld` ise runtime evaluator sonucunu ölçmez; compiled fallback centerline chord'un static circle sagitta bound'unu iki seviyeli INSERT dönüşümüne göre manifest/index'e taşır. Yalnız continuous, widthless LWPOLYLINE stroke kapsamındadır. XCLIP fragment'inde source bound düşürülür; hedef aşımında kalite degraded olur. Revision v23→v24, schema v1 sabittir. Hedefli accounting testi, tam unit, UI/Chromium 2/2, runtime typecheck ve `git diff --check` geçti.

F07'nin runtime-refined rendered error oracle'ı, aynı-kaynak AutoCAD pixel/measurement karşılaştırması, periodic SPLINE AutoCAD fixture/knot multiplicity, HATCH runtime remesh/topology, bounded spatial partition/on-demand chunk yükleme, glyph ve chunk-boundary/bileşik kalan hata muhasebesi hâlâ açık kabul kapılarıdır.

## 2026-09-24 ek checkpoint — uygulanmış runtime geometri buffer'ı

`applyCurveRefinementsToChunk` artık başarılı refinement aralıklarının finite, hedef altında conservative CSS bound taşıdığını ve bütün Float32 koordinatlarının finite olduğunu doğrular. `tests/cad-v2/curve-refinement.test.ts`, yüksek world-origin'li compiled CIRCLE'ı refine edip gerçek apply fonksiyonundan geçirir; renderer'ın line endpoint-pair XY buffer'ını chunk-origin/camera-relative offset ve CSS world scale ile 20.001 örnekli exact-source oracle'a karşı ölçer. 0.25 CSS px geometrik sapma hedefi ve konservatif rapor kapsaması sağlanır; bozuk metrik/NaN girdileri apply sınırında reddedilir.

Bu, renderer'a giden **geometri buffer'ı** için ölçümdür; WebGL raster/anti-alias/device-pixel çıktısı ve AutoCAD same-source görsel/ölçü oracle'ı değildir. Önceki “runtime-refined rendered error açık” kayıtları bu daha dar buffer-projection kapısını içermez; raster/output ve AutoCAD kapıları açık kalır. Bu host-side apply doğrulaması compiler manifest/cache çıktısını değiştirmez; compiler revision v24 ve schema v1 sabit kalır. Unit, targeted curve-refinement, UI/Chromium 2/2, runtime typecheck ve diff-check geçti. F07 **IN_PROGRESS**, toplam plan **14/19 (%74)**.

Nested follow-up: `testNestedInsertCircleAndArcCarryTransformedSidecars` artık iki nested INSERT örneğindeki 10 CIRCLE/ARC/ELLIPSE/BULGE aralığını apply sonrası XY buffer'dan yeniden çıkarır. Span offset'leri önceki refinement vertex delta'larıyla hesaplanır; çıktı noktaları worker Float32 noktalarıyla birebir, yoğun sidecar-source ekran oracle'ı ≤0.2 CSS px ve worker conservative bound'u ölçümü kapsar. Test/unit/UI Chromium 2/2/runtime typecheck geçti. Nested affine rational SPLINE/HATCH çıktı ölçümü, WebGL raster/device-pixel ve AutoCAD oracle'ı hâlâ açık; compiler/cache revision v24, schema v1 sabit.

2026-09-24 rational SPLINE follow-up: Direct ve iki nested INSERT instance'ındaki 6 non-periodic rational quadratic knot-span, gerçek apply sonrası yeniden indekslenmiş endpoint-pair buffer'ından çıkarılır. Her span worker Float32 coordinates'iyle birebir ve 20.001 örnekli independent rational Bezier CSS oracle'ı ≤0.2001 px; conservative metrik ölçümü kapsar. Targeted/full unit, UI Chromium 2/2, runtime typecheck ve diff-check geçti. Bu, önceki kayıtların “nested rational SPLINE post-apply oracle açık” kısmını kapatır; periodic spline AutoCAD profili ve knot multiplicity, HATCH runtime fill/post-apply sınır, raster/device-pixel ve AutoCAD oracle'ları açık kalır. Compiler/cache revision v24 ve schema v1 değişmedi.


2026-09-24 HATCH boundary follow-up: testHatchArcBulgeAndEllipseSidecarsIncludingNestedInsert, direct BULGE/ARC/ELLIPSE ile mirrored/non-uniform nested HATCH INSERT altındaki ARC/ELLIPSE olmak üzere 5 source span'i applyCurveRefinementsToChunk sonrası XY buffer'ından ölçer. Reindexed endpoint-pair çıktısı worker Float32 noktalarıyla birebir; span başına 20.001 sidecar-source örnekli oracle ≤0.2001 CSS px ve conservative worker bound ölçümü kapsar. Targeted curve-refinement, tam unit, UI/Chromium 2/2, runtime typecheck ve diff-check geçti. Bu yalnız HATCH boundary line buffer'ıdır; HATCH fill remesh/topology/TRIANGLES error accounting, HATCH SPLINE post-apply, periodic SPLINE AutoCAD/knot multiplicity, bounded spatial partition/on-demand loading, fill/glyph/chunk-boundary kalan bileşik hata, WebGL raster/device-pixel ve same-source AutoCAD oracle'ı açık kalır. Compiler/cache revision v24, schema v1 değişmedi; F07 **IN_PROGRESS**, plan **14/19 (%74)**.


2026-09-24 HATCH rational SPLINE follow-up: testHatchSplineBezierSidecarsAndBoundedWorkerRefinement, iki direct HATCH knot-span'i ve tek mirrored/non-uniform nested INSERT altındaki iki knot-span olmak üzere toplam 4 non-periodic rational quadratic boundary aralığını applyCurveRefinementsToChunk sonrasındaki XY buffer'ından ölçer. Reindexed endpoint-pair buffer'ı worker Float32 noktalarıyla birebir; span başına 20.001 rational Bezier örnekli CSS oracle ≤0.2001 px ve conservative worker bound ölçümü kapsar. Targeted curve-refinement, tam unit, UI/Chromium 2/2, runtime typecheck ve diff-check geçti. Bu, HATCH SPLINE boundary buffer kapısını kapatır; HATCH fill remesh/topology/error accounting, periodic SPLINE AutoCAD/knot multiplicity, bounded spatial partition/on-demand loading, fill/glyph/chunk-boundary kalan bileşik hata, PATH_DISTANCE rendered dash, WebGL raster/device-pixel ve same-source AutoCAD oracle'ı açık kalır. Compiler/cache revision v24, schema v1 değişmedi; F07 **IN_PROGRESS**, plan **14/19 (%74)**.

## 2026-09-24 ek checkpoint — non-periodic rational SPLINE knot multiplicity oracle'ı

`tests/cad-v2/precision-refinement.test.ts` now includes an independent homogeneous De Boor evaluator and a dense tessellation oracle for three positive-weight, degree-3 non-periodic SPLINEs with simple, double, and degree-multiplicity internal knots (multiplicities 1, 2, and 3). Each profile is sampled at 20,001 parameters; measured source-to-polyline deviation remains within the requested 0.03 world-unit tolerance and the reported `maxSagittaWorld`, and each distinct internal knot point appears in the output. Targeted precision, full unit, UI/Chromium 2/2, runtime typecheck, and diff-check passed. UI worker bundles and existing Playwright report artifacts were preserved byte-for-byte. This closes only those synthetic degree-3 multiplicity cases: other degrees/profiles, periodic SPLINE AutoCAD fixture/support and evaluator parity remain open along with HATCH fill remesh/topology, spatial partition/on-demand fetch, residual fill/glyph/chunk-boundary/composite accounting, visible dash, raster/device-pixel, and same-source AutoCAD visual/measurement gates. Test-only; revision v26 and schema v1 unchanged. F07 remains **IN_PROGRESS**, plan 14/19 (74%), 5/19 (26%) open.

## 2026-09-24 ek checkpoint — degree-2 SPLINE oracle kapsamı

Aynı bağımsız homojen De Boor testine iki degree-2 pozitif ağırlıklı rational profil eklendi: tek iç knot (çokluk 1) ve degree-multiplicity knot (çokluk 2). Böylece beş profilde toplam 100.005 yoğun kaynak örneği ölçülüyor: degree-2 çoklukları 1/2 ve degree-3 çoklukları 1/2/3. Kaynak-polyline sapması her profilde ≤0.03 world unit ve `maxSagittaWorld`; her distinct knot noktası polyline'da tutuluyor. Hedefli precision testi, tam unit, UI/Chromium 2/2, runtime typecheck ve diff-check geçti. Bu yalnız static tessellator çıktısıdır; başka degree/knot profilleri, periodic spline/AutoCAD fixture ve evaluator oracle'ı, HATCH runtime remesh/topology, spatial partition/on-demand loading, glyph/chunk-boundary bileşik muhasebe, visible dash, raster/device-pixel ve same-source AutoCAD görsel/ölçü kapıları açık. Test-only; compiler/cache revision v26 ve schema v1 sabit. F07 **IN_PROGRESS**, plan **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — degree-4 SPLINE knot çoklukları

Bağımsız oracle'a dört pozitif ağırlıklı, rational, non-periodic degree-4 profil eklendi; bunlar iç knot çoklukları 1–4'ü temsil eder. Degree-2/3 profillerle birlikte 9 profile ait 180.009 kaynak örneği kontrol edildi. Her profil için kaynak-polyline farkı ≤0.03 world unit ve `maxSagittaWorld`; tüm distinct iç knot noktaları tessellation çıktısında bulunur. Hedefli precision testi, tam unit, UI/Chromium 2/2, runtime typecheck ve diff-check geçti. Bu sentetik degree 2–4 profillerini kapsar; diğer knot yerleşimleri ve degree'ler, periodic AutoCAD SPLINE fixture/desteği/evaluator, HATCH runtime fill remesh/topology, spatial partition/on-demand loading, fill/glyph/chunk-boundary bileşik hata, visible dash, WebGL raster/device-pixel ve same-source AutoCAD ölçü/görüntü kapıları açıktır. Test-only; revision v26/schema v1 sabit, F07 **IN_PROGRESS**, toplam plan **14/19 (%74)**.

## 2026-09-24 ek checkpoint — degree-5 SPLINE knot çoklukları

Beş pozitif ağırlıklı rational non-periodic degree-5 profile simple, double, triple, quadruple ve degree-multiplicity (1–5) iç knot'ları ekler. Degree-2/3/4 profilleriyle toplam 14 profil ve 280.014 bağımsız homojen De Boor kaynak örneği ölçülür (20.001/profil); emitted polyline sapması ≤0.03 world unit ve `maxSagittaWorld`, her distinct knot noktası tessellation'da tutulur. Hedefli precision testi, tam unit, UI/Chromium 2/2, runtime typecheck ve diff-check geçti. Bu sentetik degree 2–5 tessellator profilleridir; diğer degree/knot vektörleri, periodic AutoCAD SPLINE fixture/desteği/evaluator, HATCH runtime fill remesh/topology, bounded spatial partition/on-demand loading, fill/glyph/chunk-boundary kalan bileşik hata, visible PATH_DISTANCE dash, WebGL raster/device-pixel ve same-source AutoCAD ölçü/görüntü kapıları açık. Yalnız test değişti; revision v26/schema v1 sabit. F07 **IN_PROGRESS**, toplam plan **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — nested BULGE same-chord encoded composite oracle'ı

İki seviyeli mirrored/non-uniform LWPOLYLINE BULGE fixture'ı, 20.001 yoğun analytic source örneği ve manifest sagitta bound'una ek olarak artık her emitted chord'un `ORIGIN + Float32 XY` round-trip endpoint kaybını bağımsız ölçer. Her chord için 8× affine kaynak sagitta'sı ile aynı chord'un en büyük endpoint kaybı toplanır; bu değerlerden en büyüğü `maxCurveEncodedGeometryErrorWorld` ile, active-view CSS dönüşümü de `maxCurveEncodedGeometryErrorCssPixels` ile karşılaştırılır. Targeted `npx tsx tests/cad-v2/chunk-error-accounting.test.ts`, tam CAD V2 unit, UI/Chromium 2/2, runtime typecheck ve diff-check geçti. Test-only oracle; compiler/cache v26 ve schema v1 değişmedi. Bu tek nested BULGE chord familyasının same-line encoding bileşiğidir; diğer source/chunk, fill, glyph, boundary ve runtime/WebGL bileşikleri açık kalır. F07 **IN_PROGRESS**, plan **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — nested SPLINE same-chord encoded composite oracle'ı

İki seviyeli non-uniform INSERT altındaki clamped cubic SPLINE için her adaptive aralıkta exact source endpoints cubic Bernstein formülüyle hesaplanır. Türeve dayalı subcurve kontrol noktalarının chord'a uzaklığı, bağımsız local sagitta üst sınırını verir; birleşik INSERT singular value'siyle yükseltilen bu bound, aynı emitted chord'un ölçülen Float32 endpoint round-trip kaybıyla toplanır. Per-chord toplam maksimumu manifest `maxCurveEncodedGeometryErrorWorld/CssPixels` değerleriyle eşleşir. Targeted chunk-error accounting, tam unit, UI/Chromium 2/2, runtime typecheck ve diff-check geçti. Bu sentetik clamped cubic, iki seviyeli 8× affine fixture'dır; periodic/AutoCAD SPLINE ve diğer source/chunk composite'leri, HATCH fill/glyph/boundary, rendered WebGL/pixel ve same-source AutoCAD oracle'ları açık kalır. Test-only; revision v26/schema v1 sabit. F07 **IN_PROGRESS**, plan **14/19 (%74)**, **5 paket (%26)** açık.

## Static fallback curved-line composite metric — 2026-09-24

The compiler now records the maximum per-emitted-line sum of (a) the source chord sagitta bound already attached to the static circular, ellipse, spline, or continuous widthless bulge fallback and (b) the larger of that same line's two chunk-local Float32 XY endpoint round-trip errors. It exports the world-space maximum and, with a complete active-view profile, the CSS-pixel value to both flat manifest and hash-index chunk metadata. The manifest validator keeps the fields optional for older outputs, validates finite non-negative values, and rejects flat/index disagreement. A CSS budget overrun emits `CURVE_ENCODED_PRECISION_LIMIT_REACHED` and degrades scene quality. Compiler/cache revision is v25; binary schema remains v1.

An independent large-coordinate circle test derives `R(1-cos(π/n))` from the emitted segment count, reads the emitted XY Float32 values and Float64 ORIGIN, and measures endpoint round-trip error. Each term fits the requested 0.25 CSS-pixel budget alone; their same-primitive sum exceeds it and drives the diagnostic. This static fallback metric does not measure the worker-refined replacement, fill triangles/remesh topology, glyphs, cross-primitive or chunk-boundary interactions, visible dash output, WebGL raster/device pixels, or AutoCAD same-source parity. Those F07 gates remain open; overall plan remains 14/19 (74%), with 5/19 (26%) packages open.

## 2026-09-24 — direct ELLIPSE static same-chord composite oracle

`testEllipseCurveTessellationErrorIsMeasuredAndBudgeted` independently computes the uniform interval count and conservative sagitta `|majorVector| × Δt² / 8`, evaluates each analytic source endpoint, and measures its matching chunk-local Float32 XY + Float64 ORIGIN round-trip loss. The per-chord sum maximum matches flat manifest and hash-index world/CSS values. A target placed just above the static sagitta confirms that each term fits alone but their same-chord sum degrades quality and emits the curve precision diagnostic; the segment-cap check remains in place. Targeted chunk-error accounting, full CAD V2 unit, the full UI chain including Chromium **2/2**, runtime typecheck and `git diff --check` passed. UI build left both worker bundle hashes unchanged and used isolated Playwright report/result directories. Test-only; compiler/cache v26 and schema v1 are unchanged.

This covers direct top-level ELLIPSE static fallback only. Nested ELLIPSE, residual cross-source/chunk/fill/glyph/boundary composites, periodic/AutoCAD SPLINE, HATCH runtime fill remesh/topology, bounded spatial partition/on-demand loading, visible PATH_DISTANCE dash, runtime-refined rendered WebGL/device-pixel error and same-source AutoCAD visual/measurement remain open at this earlier checkpoint. F07 stays **IN_PROGRESS**; plan **14/19 (74%)**, **5/19 (26%)** open.

### Open-gate recheck — code and tests

- **Periodic SPLINE:** the tessellator test rejects periodic profiles with no emitted geometry and `errorBoundMet=false`; the 14 degree-2–5 knot profiles are synthetic and non-periodic. No AutoCAD-authored periodic fixture/evaluator oracle exists in the F07 tests.
- **HATCH fill:** runtime tests exercise curved HATCH boundary sidecars and post-apply boundary buffers. Fill TRIANGLES are generated by the compiler; there is no worker fill remesh/topology acceptance test.
- **Spatial/on-demand:** compiler manifest bboxes, renderer camera culling, and bounded LRU/fetch-scheduler code/tests exist. The scheduler is not wired into the host; `CadV2HostShell` walks every manifest chunk and fetches the complete set during initial loading with a concurrency limit. This does not pass the F07 camera-driven on-demand loading gate.
- **Residual static composite at the direct-only checkpoint:** direct ellipse, nested BULGE/SPLINE, circular, and curved HATCH boundary cases had selected same-chord checks. Cross-source/chunk-boundary and fill/glyph composites remained open. Nested ELLIPSE static sagitta propagation was missing then; the following v27 checkpoint covers the selected nested model/paper transform profile and XCLIP omission, while other residual composites remain open.
- **Rendered/AutoCAD oracle:** CPU-side applied-refinement tests measure projected geometry bounds, but no WebGL raster/device-pixel or anti-alias output oracle is present. No same-source AutoCAD image/measurement comparison is present. These remain open; no general AutoCAD fidelity claim is made.

## 2026-09-24 — nested ELLIPSE visitor bound and cache revision

The nested ELLIPSE visitor now emits a static sagitta bound scaled by the composed INSERT singular value; scene compilation retains it in the line composite, and paper projection applies its scale once. The two-level 8× fixture checks analytic endpoints, serialized Float32 endpoint loss, manifest/index world/CSS values and degraded diagnostics; the paper fixture checks the 0.15 viewport scale, and partial XCLIP output keeps no source-bound claim. Targeted, full unit, UI/Chromium **2/2**, runtime typecheck, and diff-check passed. Compiler/cache revision advances **v26→v27**; schema v1 stays fixed. This closes this nested ellipse profile only.

Open-gate recheck after the nested ELLIPSE checkpoint: nested ELLIPSE static same-chord accounting is covered for its tested profile. Cross-source/chunk-boundary, fill, and glyph-outline/refinement composites remain open; direct TEXT glyph stroke endpoint Float32 quantization now has the narrow independent encoding oracle in the following checkpoint. The HATCH worker tests still cover boundary curves only, not fill remesh/topology. Bbox culling and a bounded scheduler/LRU exist, but the scheduler is not connected to the host, which fetches all manifest chunks at initial load. Periodic SPLINE remains fail-closed with no AutoCAD-authored fixture/evaluator; CPU projected-buffer error tests do not measure WebGL raster/device pixels, and there is no same-source AutoCAD visual/measurement comparison. F07 remains **IN_PROGRESS**, plan **14/19 (74%)**, **5/19 (26%)** open.

## 2026-09-24 — TEXT glyph stroke endpoint encoding oracle

A high-coordinate rotated TEXT fixture now measures all generated glyph stroke endpoints across the binary `ORIGIN + Float32 XY` round trip. Its independent bound-midpoint and `Math.fround` calculation matches the compiler's generic chunk world/CSS quantization metrics; the hash-index and validator preserve the result, and an over-budget profile degrades with `CHUNK_QUANTIZATION_LIMIT_REACHED`. Targeted accounting, full unit, UI/Chromium **2/2**, runtime typecheck and diff-check passed. This tests encoding loss after `FontLayoutEngine` has generated the strokes; font outline parity, MTEXT/dimension variants, runtime glyph refinement and cross-chunk composites remain open. Test-only; revision v27 and schema v1 unchanged.

F07 remains **IN_PROGRESS**, total plan **14/19 (74%)**, with **5/19 (26%)** packages open. HATCH fill runtime remesh/topology, periodic/AutoCAD SPLINE, host-integrated on-demand partition, remaining glyph/fill/chunk-boundary composites, visible dash, rendered device-pixel error and same-source AutoCAD visual/measurement gates remain open.

## 2026-09-24 — encoded seam bound for a continuous ARC split across chunks

A single non-closed ARC is compiled with one chord per chunk. The test evaluates analytic circle endpoints and sagitta, decodes each serialized ORIGIN + Float32 XY endpoint, checks each local curve-plus-encoding composite, and measures the gap between adjacent decoded endpoints at their shared source vertex. The gap is bounded by the two endpoint round-trip errors and by the adjacent chunk composites; manifest/index validation preserves each local value. This is a test-only static accounting oracle for this continuous ARC profile, not a general join/topology or cross-source composite guarantee. Targeted accounting, full CAD V2 unit, UI/Chromium 2/2, runtime typecheck, and diff-check pass. Compiler/cache v27 and binary schema v1 are unchanged; F07 remains IN_PROGRESS, plan 14/19 (74%), 5/19 (26%) open. Periodic SPLINE/AutoCAD and knot oracle, HATCH fill runtime remesh/topology, host-integrated on-demand chunk partition, remaining fill/glyph/chunk composites, visible dash, rendered device-pixel error, and same-source AutoCAD visual/measurement gates remain open.

## 2026-09-24 — separate LINE source seam across chunk origins

Two distinct connected LINE entities are forced into separate chunks. The test independently reconstructs each chunk-local bounds midpoint and Float32 endpoint offsets, then measures the decoded error at both sides of their shared source vertex. The resulting non-zero seam is within the endpoint-error sum and the adjacent generic chunk quantization bounds; active CSS projection, index metadata and manifest validation are checked. This is a narrow test-only static encoding oracle for one exact LINE-to-LINE join, not general cross-source continuity or arbitrary chunk composition. Targeted test, full unit, UI/Chromium 2/2, runtime typecheck and diff-check pass. Worker bundle hashes are unchanged. Compiler/cache v27 and binary schema v1 remain unchanged; F07 is IN_PROGRESS, plan 14/19 (74%), 5/19 (26%) open. Periodic SPLINE/AutoCAD and knot oracle, HATCH fill runtime remesh/topology, host-integrated on-demand chunk partition, remaining fill/glyph/chunk composites, visible dash, rendered device-pixel error and same-source AutoCAD visual/measurement gates remain open.

## 2026-09-24 — LINE-to-ARC seam across independent chunk origins

An analytic ARC begins exactly at the endpoint of a separate LINE entity. The LINE and each emitted ARC chord are put in individual chunks, so the shared source point is encoded against two different Float64 origins and Float32 coordinate pairs. The test independently decodes both sides, bounds the seam by the endpoint errors, verifies the first ARC chord's sagitta-plus-encoding composite and its CSS projection, and checks the hash-index and manifest sequence. This is a narrow static oracle for one forward LINE-to-ARC join; it is not general cross-source continuity or all-curve chunk accounting. Targeted accounting, full unit, UI/Chromium 2/2, runtime typecheck and diff-check pass. Worker hashes match preserved copies. Compiler/cache v27 and binary schema v1 are unchanged; F07 remains IN_PROGRESS, plan 14/19 (74%), 5/19 (26%) open. Periodic SPLINE/AutoCAD and periodic knot oracle, HATCH fill runtime remesh/topology, host-integrated on-demand chunk partition, residual fill/glyph/chunk composites, visible dash, rendered device-pixel error, and same-source AutoCAD visual/measurement gates remain open.


## 2026-09-24 — visible pre-tessellated dash pixel check

The Chromium test serves a DV2SCN01 fixture whose XY vertices already represent five independent red dash segments and four gaps. It samples the presented WebGL canvas screenshot and observes five red runs with four non-zero gaps (minimum width greater than eight pixels). The fixture carries the expected cumulative PATH_DISTANCE lane, but the current renderer does not consume that lane; the browser pixel result is therefore a visibility check for pre-tessellated XY only, not PATH_DISTANCE shader support or dash-phase rendering. Targeted Chromium 1/1, full UI Chromium 3/3, full CAD V2 unit, runtime typecheck, and diff-check pass. Worker hashes match the preserved copies. Compiler/cache v27 and schema v1 are unchanged. Runtime-refined device-pixel error and same-source AutoCAD image/measurement parity remain open, along with the other F07 gates.

## 2026-09-24 — compiler-to-WebGL DASHED pixel oracle

A child fixture compiler creates a canonical 184-unit LINE with a [24,-16] dash/gap pattern, and the browser test serves its actual compiled manifest and binary chunk to the CAD V2 host. The test checks the compiled cumulative PATH_DISTANCE values and samples the WebGL screenshot for five dash runs and four gaps. This validates that compiler-generated dashes reach visible pixels. Renderer still draws the already separated XY segments and does not consume PATH_DISTANCE, so shader-lane use, phase behavior during runtime refinement, and general chunk-boundary stability remain open. Targeted Chromium 1/1, full unit, full UI Chromium 3/3, runtime typecheck, and diff-check pass; the child compiler is timeout-bounded. Worker hashes match preserved copies. Revision v27 and schema v1 are unchanged; rendered-error and AutoCAD same-source gates remain open.


## 2026-09-24 — compiled DASHED partition-invariance browser check

The Chromium host now loads two scenes compiled from the same canonical `[24,-16]` DASHED LINE: a single Model chunk and five Model chunks (one primitive per chunk). It serves the real compiler manifests and DV2SCN01 bytes, checks the cumulative path-distance values in both encodings, samples the rendered WebGL canvases, and confirms identical full-canvas PNG hashes plus five visible red runs/four gaps. This confirms only that already tessellated XY output for this LINE is invariant to this chunk split. `cad-v2-renderer.ts` still has no `PATH_DISTANCE` consumption, so this does not verify GPU dash rendering or phase behavior. Targeted Chromium 1/1, UI/Chromium 3/3, full CAD V2 unit, runtime typecheck, and diff-check passed; generated worker hashes match the preserved copies. Compiler/cache v27 and schema v1 are unchanged.

F07 remains IN_PROGRESS at 14/19 packages (74%), with 5/19 (26%) open. Runtime-refined rendered device-pixel error, periodic SPLINE AutoCAD/evaluator and knot parity, HATCH fill remesh/topology, host-integrated bounded partition/on-demand loading, residual fill/glyph/chunk-boundary composites, shader-side PATH_DISTANCE, and same-source AutoCAD visual/measurement gates remain open.


## 2026-09-24 — LINE to nested transformed BULGE seam envelope

A new independent chunk-error test connects a direct LINE to the start of a nested LWPOLYLINE BULGE arc. The arc passes through two INSERT levels with reflection, non-uniform scale, rotation, and large world translation; per-primitive chunking gives the join endpoints separate local origins. The test derives the local semicircle and its conservative 8× transformed sagitta independently, decodes each chunk's Float32 endpoints, verifies all same-chord world/CSS composites, and measures 20,001 analytic samples against each corresponding rendered chord envelope. The decoded source seam is bounded by its two endpoint round-trip errors, adjacent generic quantization bounds, and the LINE plus first BULGE composite. Index and validator metadata are checked. Targeted accounting, full unit, UI/Chromium 3/3, runtime typecheck, and diff-check pass; bundle hashes match preserved copies. Test-only; compiler/cache v27 and schema v1 remain unchanged.

This covers only this connected direct-LINE / nested reflected non-uniform BULGE profile. Other cross-source/chunk joins, clipping, fill/glyph interactions, runtime-refined rendered pixel error, shader-side PATH_DISTANCE, periodic/AutoCAD SPLINE, HATCH fill remesh/topology, host-integrated on-demand chunks, and AutoCAD same-source visual/measurement remain open. F07 stays IN_PROGRESS at 14/19 packages (74%), 5/19 (26%) open.

## 2026-09-24 — cross-source ARC→LINE encoding seam

The accounting test now covers the reverse source order from the earlier LINE→ARC profile: a separate LINE begins at the analytic endpoint of a preceding circular ARC, with one emitted primitive per chunk. An independent bounds-midpoint/Float32 oracle measures both shared endpoint round trips, the decoded seam, and the final ARC chord sagitta-plus-encoding composite in world and active-view CSS units. Flat/hash-index metadata and manifest validation are checked. Targeted accounting, complete CAD V2 unit, runtime typecheck, UI/Chromium 3/3, and diff-check pass. The UI rebuild produced the same preserved worker bundle hashes. This is test-only; compiler/cache revision v27 and binary schema v1 are unchanged.

The evidence is limited to this ARC→LINE static chunk join. It does not close general source/chunk topology, fill/glyph composites, runtime-refined rendered device-pixel error, or AutoCAD parity. F07 remains IN_PROGRESS at 14/19 (74%), with 5/19 (26%) packages open.

## 2026-09-24 — nested BULGE-to-LINE reverse source seam

A two-level INSERT-contained BULGE LWPOLYLINE now has a separate direct LINE starting at the transformed analytic endpoint of the final BULGE chord. The nested affine has reflection, non-uniform scale (combined singular value 8), rotation, and a 1e9-scale translation; one primitive per chunk gives the join endpoints independent origins. The oracle independently calculates the transformed circular sagitta, Float32 endpoint round-trip, final-chord world/CSS composite, decoded seam envelope, and LINE encoding bound. Hash-index and manifest validation retain the values. Targeted accounting, full CAD V2 unit, runtime typecheck, UI/Chromium 3/3, and diff-check pass. Worker hashes match preserved bundles. Test-only; compiler/cache v27 and binary schema v1 are unchanged.

This closes only this reverse nested-BULGE-to-LINE join profile. General cross-source/chunk, fill/glyph, runtime-rendered pixel, and AutoCAD parity gates remain open. F07 remains IN_PROGRESS at 14/19 (74%), with 5/19 (26%) packages open.


## 2026-09-24 — runtime-refined rendered arc pixel envelope

The Chromium camera/refinement scenario now checks both directions of raster-to-source distance on the presented CAD V2 WebGL canvas. After the worker has refined the quarter-circle to the idle 0.25 CSS-pixel target, an independent fit-camera projection is compared with 494 sampled blue/cyan pixels and with analytic source points every 0.5 CSS px. Maximum rendered-pixel-to-arc distance is 0.9677 CSS px and maximum source-sample-to-rendered-pixel distance is 0.7497 CSS px, each under the 1.25 CSS px allowance (0.25 refinement target plus 1 CSS px raster envelope). The measured screenshot is 1280×672 CSS/device pixels with 0.16447 world units per CSS pixel.

Targeted Chromium 1/1, full CAD V2 unit, UI/Chromium 3/3, runtime typecheck, and git diff --check pass; both worker bundle hashes match preserved copies. This is test-only; compiler/cache revision v27 and binary schema v1 are unchanged. It measures one synthetic quarter-circle profile and does not close the broad rendered/device-pixel contract across geometry, zoom, DPR, fills, glyphs, or chunk boundaries. F07 remains IN_PROGRESS at 14/19 (74%), 5/19 (26%) open; periodic/AutoCAD SPLINE and knot parity, HATCH runtime remesh/topology, host-integrated bounded on-demand chunks, residual fill/glyph/chunk composites, shader PATH_DISTANCE, general rendered-error profiles, and same-source AutoCAD visual/measurement remain open.


## 2026-09-24 — centered 125% zoom raster profile

The two-sided raster oracle is now applied to a second camera scale on the real Chromium CAD V2 WebGL canvas. The UI confirms 125%; the worker's transient 0.75 CSS px and idle 0.25 CSS px refinement responses are both delivered before capture. The independent source projection divides the fit-camera scale by 1.25, giving 0.13157895 world units per CSS pixel. Across 610 detected blue/cyan pixels, the maximum rendered-pixel-to-arc distance is 0.9612 CSS px; source-arc samples at 0.5 CSS px spacing are at most 0.7642 CSS px from rendered pixels. Both remain within the 1.25 CSS px allowance. Together with the prior fit profile, this covers two centered camera scales.

Targeted Chromium 1/1, complete CAD V2 unit, UI/Chromium 3/3, runtime typecheck, and diff-check passed; preserved worker hashes are unchanged. Test-only; compiler/cache v27 and binary schema v1 remain unchanged. Higher zoom levels, panned-camera centers, DPR/device contexts, other geometry, fill/glyph/chunk interactions, general rendered error, and same-source AutoCAD comparison remain open, along with periodic AutoCAD SPLINE/knot parity, HATCH runtime remesh/topology, and host-integrated bounded on-demand chunks. F07 remains IN_PROGRESS at 14/19 (74%), 5/19 (26%) open.


## 2026-09-24 — centered 80% runtime-refined raster profile

The Chromium acceptance flow now repeats the two-sided pixel/source-arc distance measurement at centered 80% zoom-out. It checks the UI zoom, waits for transient 0.75 CSS px and idle 0.25 CSS px worker refinement replies, then drains pending replies through a bounded quiet loop before taking the screenshot. The independent scale is fitU/0.8 = 0.2055921053 world/CSS px. Of 399 detected pixels, the maximum pixel-to-source distance is 0.9819 CSS px and the maximum sampled source-to-pixel distance is 0.7193 CSS px, both below 1.25 CSS px.

The fit, 80%, and 125% profiles now all pass: respectively 494 pixels at 0.9677/0.7497 CSS px, 399 at 0.9819/0.7193 CSS px, and 610 at 0.9612/0.7642 CSS px (render→source/source→render). Targeted Chromium 1/1, complete CAD V2 unit, UI/Chromium 3/3, runtime typecheck, and diff-check passed. Test-only; compiler/cache v27 and binary schema v1 are unchanged, and worker hashes match preserved copies.

This is limited to one synthetic quarter-circle, three centered zoom profiles, one Chromium canvas/raster context, and this fixture. Panned views, higher zoom, DPR/device variation, other entities, fills/glyphs/chunk boundaries, a general rendered-error contract, and same-source AutoCAD comparison remain open. Periodic SPLINE AutoCAD/evaluator and knot multiplicity parity, HATCH runtime remesh/topology, host-integrated bounded on-demand chunks, residual composite accounting, and shader PATH_DISTANCE consumption remain open. F07 remains IN_PROGRESS at 14/19 (74%), with 5/19 (26%) packages open.


## 2026-09-24 — translated 125% runtime-refined raster profile

After the centered 125% profile, the browser test drags the input surface by +48,+24 CSS pixels and confirms a changed WebGL frame. The camera scale remains 0.1315789474 world/CSS px; at the same refinement bucket, the prior 0.25 CSS-pixel idle refinement stays applied, the held-response count is zero, and a bounded quiet interval confirms stability. The independent analytic quarter-circle center is translated by the measured pointer delta. The 610 detected blue pixels move from [640,31]-[944,335] to [688,55]-[992,359]. Both directed distances remain 0.9612/0.7642 CSS px (render→source/source→render), under the 1.25 CSS px envelope.

Targeted Chromium 1/1, complete CAD V2 unit, full UI/Chromium 3/3, runtime typecheck, and diff-check passed. Rebuilt worker SHA-256 hashes match preserved copies. No production compiler/cache behavior changed; revision v27 and binary schema v1 remain unchanged.

This is one known pan offset on one synthetic quarter-circle at one zoom level. Other pan offsets, higher/lower scales, DPR/device contexts, geometry/fill/glyph/chunk interactions, general rendered-error guarantees, and AutoCAD comparison remain open. Periodic SPLINE AutoCAD/evaluator and knot multiplicity parity, HATCH runtime remesh/topology, host-integrated bounded on-demand chunks, residual composite accounting, and shader PATH_DISTANCE consumption remain open. F07 stays IN_PROGRESS at 14/19 (74%), with 5/19 (26%) packages open.


## 2026-09-24 — panned 195% runtime-refined visible ARC profile

This browser refinement/raster profile uses the real WebGL canvas at the 195% UI bucket after a stale 156% response is superseded. Accepted idle target is 0.25 CSS px, held replies=0, maxLineVertexCount=46. D3 reports (x=811,y=421.5,k=11.875) on a 1280×672 canvas; u=0.0842105263 world/CSS px. Two centered zoom increments scale the earlier +48,+24 pan to +75,+37.5; two subsequent drags add +96,+48, matching total translation +171,+85.5.

Only visible source angles [0.1591116695,1.0916057806] are sampled for source→render distance; rendered pixels are checked against the entire analytic quarter-circle. Of 622 pixels, maxima are 1.0113 CSS px render→source and 0.7581 CSS px source→render, both ≤1.25 CSS px. Targeted Chromium 1/1, full CAD V2 unit, UI/Chromium 3/3, runtime typecheck, and diff-check passed. Worker hashes match preserved copies. No production compiler/runtime code changed; compiler/cache v27 and binary schema v1 remain fixed.

This is one synthetic ARC, viewport, camera, and Chromium raster, not a general error guarantee or AutoCAD equivalence. Periodic SPLINE AutoCAD fixture/evaluator and knot multiplicity parity, HATCH runtime remesh/topology, host-integrated bounded partition/on-demand chunks, fill/glyph/chunk-boundary and residual composite accounting, shader PATH_DISTANCE, broader rendered-error coverage, and same-source AutoCAD visual/measurement remain open. F07 IN_PROGRESS; 14/19 (74%), 5/19 (26%) packages open.


## 2026-09-24 — DPR2 runtime-refined raster checkpoint

The same real-host quarter-circle refinement/raster oracle was run in a fresh Chromium context with device scale factor 2. It settled after worker targets 0.75→0.25 CSS px with 2 replies and a stable quiet snapshot. CSS camera viewport is 1280×672, WebGL drawing buffer is 2560×1344, and the independent analytic-source comparison covers 981 device-resolution pixels. Maximum render→source distance is 0.6157362894 CSS px; source→render maximum is 0.4750552899 CSS px; both are below the 1.25 CSS-pixel envelope. The largest observed line draw has 34 vertices.

Complete CAD V2 unit and UI/Chromium (4/4), runtime TypeScript check, and diff-check passed. Worker bundle SHA-256 values did not change across the UI build. This is a test-only raster profile; compiler/cache revision v27 and binary schema v1 remain fixed.

The DPR2 profile is centered fit on the same single synthetic ARC. It does not close the broader geometry/zoom/pan/device rendered-error gate. Periodic SPLINE AutoCAD fixture/evaluator and knot parity, HATCH fill remesh/topology, host-integrated bounded spatial partition/on-demand loading, residual fill/glyph/chunk composite accounting, shader `PATH_DISTANCE` consumption, and same-source AutoCAD visual/measurement remain open. F07 stays **IN_PROGRESS** at 14/19 (74%), with 5/19 (26%) packages open.

## 2026-09-24 — runtime-refined ELLIPSE raster profile

A direct synthetic ELLIPSE sidecar (center 0,0; basis (40,0)/(0,24), [0,π/2]) passed through host→worker→refined buffer→WebGL. DPR1 fit was 1280×672 at 0.1644736842 world/CSS px. Targets 0.75→0.25 settled with 2 replies, quiet state, and 34 maximum line vertices.
Independent parametric comparison: 4097 source samples, 378 rendered pixels; maximum pixel→source 0.9825281925 CSS px, source→pixel 0.7467465149 CSS px, both ≤1.25. Relevant units, focused Chromium 1/1, full UI/Chromium 5/5, runtime typecheck and diff-check passed. A later reporter retry had no result because C: was full (ENOSPC); full unit was not repeated because it rewrites existing P05/P06 evidence.
Rendered-error remains OPEN: ARC includes DPR1 zoom/pan and centered DPR2 fit; ELLIPSE adds DPR1 fit. Other curve/fill/glyph families, pan DPR2, DPR3/device contexts remain uncovered. Periodic SPLINE AutoCAD/evaluator/knot, HATCH fill remesh, host bounded on-demand chunks, residual composite budget, shader PATH_DISTANCE, and same-source AutoCAD visual/measurement remain OPEN (same-source NOT_RUN). F07 IN_PROGRESS; 14/19 (74%), 5/19 (26%) open.
Worker SHA-256 unchanged: scene 1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280; DWG DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D. Compiler/cache v27 and DV2SCN01 schema v1.
D-backed retry'ler test başlamadan durdu: ilkinde npm cache C: üzerindeydi; ikincisinde scripts/sync-cad-upstream-assets.mjs:61 C: diskinde ENOSPC verdi. Yeni D: çıktıları korundu.

## 2026-09-25 — DPR2 panned ARC runtime/render ölçümü

Chromium senaryosu mevcut host refinement protokolünü ve gerçek WebGL canvas'ı DPR2 bağlamında kullandı. Fit kameradaki 0.75→0.25 CSS px isteklerine iki refinement yanıtı geldi; quiet snapshot'ta bekleyen yanıt yoktu ve line draw en çok 34 vertex içerdi. Gerçek mouse pan (+48,+24 CSS px), D3 transform'unda aynı translasyonu korudu ve k değerini 6.08'de tuttu. 981 raster pikseli ile analitik quarter-circle oracle'ının yönlü uzaklık maksimumları render→source 0.6157362894, source→render 0.4750552899 CSS px (≤1.25); DPR2 backing buffer 2560×1344, viewport 1280×672.

Üç ilgili unit kabul testi ve tam beş senaryolu Chromium dosyası geçti; runtime typecheck ve `git diff --check` geçti. Test-only değişiklik: v27 compiler/cache, DV2SCN01 v1 ve scene/DWG worker hash'leri aynı.

Bu tek sentetik ARC'nin fit+DPR2+bir pan profili runtime sınırıdır; shader `PATH_DISTANCE` tüketimi, çoklu geometri/zoom/pan/DPR/device genellemesi, fill/glyph/chunk bileşikleri ve same-source AutoCAD karşılaştırması kapanmış değildir. Periodic SPLINE AutoCAD/knot, HATCH remesh/topology ve host bounded/on-demand chunk kapıları da AÇIK; aynı-kaynak AutoCAD oracle'ı NOT_RUN. F07 IN_PROGRESS, 14/19 (%74), 5/19 (%26) paket açık.
## 2026-09-25 — DPR2 pan altında ELLIPSE worker/render ölçümü

Aynı 40×24 parametrik ELLIPSE artık DPR2 gerçek host/worker çiziminde de test edildi. Idle refinement hedefi 0.25 CSS px'e geldi; [0.75,0.25] hedeflerine iki yanıt alındı, kuyruk iki quiet aralığında sabit kaldı ve LINES draw en çok 34 vertex oldu. Pan (+48,+24 CSS px) D3 kamerayı (640,336,k=6.08)'den (688,360,k=6.08)'e taşıdı. 1280×672 CSS viewport, 2560×1344 backing buffer, 759 raster pikseli. 4097 noktalı bağımsız parametrik ellipse oracle'ında maksimum render→source ve source→render uzaklıkları sırasıyla 0.6081436225 ve 0.4231605551 CSS px (≤1.25).

Üç hedefli unit, altı Chromium senaryosunun tamamı, runtime typecheck ve diff-check geçti. Test/helper only; compiler/cache v27, DV2SCN01 schema v1 ve worker hash'leri değişmedi.

Bu kanıt DPR2'de bir pan offseti ve ikinci geometri ailesidir. Geniş rendered-error kapısı genel geometri/zoom/pan/DPR/device matrisi, fill/glyph/chunk, shader `PATH_DISTANCE` ve AutoCAD eşdeğerliği için OPEN kalır. Periodic SPLINE AutoCAD/knot, HATCH runtime remesh/topology, host bounded/on-demand chunk yükleme ve same-source AutoCAD oracle'ı da OPEN; AutoCAD karşılaştırması NOT_RUN. F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) paket açık.
## 2026-09-25 — DPR2 ELLIPSE at 125% after two pans

The browser acceptance sequence now measures the synthetic 40×24 ELLIPSE after an initial +48,+24 CSS-pixel pan, a centered 125% zoom, and a second +48,+24 pan. The D3 transforms are (688,360,k=6.08), (700,366,k=7.6), and (748,390,k=7.6); the total translation relative to the viewport center is (+108,+54) CSS px. In the 1280×672 CSS viewport and 2560×1344 DPR2 drawing buffer, the source ellipse projects at 0.1315789474 world/CSS px. An independent 4097-parameter-sample oracle measured 940 WebGL pixels in both directions: max rendered-pixel→source 0.5931555545 CSS px and source→rendered-pixel 0.4141058575 CSS px (≤1.25). Refinement targets [0.75,0.25,0.75,0.25] each received a reply; the queue remained quiet and maxLineVertexCount was 40.

The targeted case passed 1/1 and all six cases in the layout-viewport Chromium file passed. curve-refinement, precision-refinement, layout-viewport, runtime TypeScript, and git diff --check passed. This changes only the test/helper and a new unique Next dev cache was used on C:. Test outputs/configuration were preserved on D:. Compiler/cache v27 and binary schema v1 did not change; scene and DWG/DXF worker hashes remain 1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280 and DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D.

### F07 gate audit after this measurement

- Periodic SPLINE: the compiler rejects periodic input and its unit case verifies fail-closed empty output; synthetic knot-multiplicity oracle profiles are non-periodic, with no AutoCAD-authored periodic fixture/evaluator comparison. OPEN.
- HATCH remesh/topology: runtime-refined boundary line buffers are measured, but fill remesh/topology acceptance is absent. OPEN.
- Spatial partition/on-demand chunks: SpatialChunkScheduler is isolated to cache code/tests; CadV2HostShell fetches the manifest chunk list with concurrency 6 and has no scheduler integration. OPEN.
- Fill/glyph/chunk composites: selected line/chord, encoded endpoint, glyph endpoint, and seam terms have narrow tests; fill triangles, glyph outline/refinement, and complete cross-source/chunk composite sums are not covered. OPEN.
- Shader PATH_DISTANCE: the scene worker decodes/transfers the field; cad-v2-renderer has no consumer. OPEN.
- Rendered error matrix: ARC and ELLIPSE now have several real Chromium zoom/pan/DPR profiles, including this DPR2/125% ELLIPSE; broader geometry, output, and device coverage remains incomplete. PARTIAL / OPEN.
- Same-source AutoCAD visual/measurement: no paired AutoCAD source render/measurement oracle is exercised by these F07 tests. OPEN / NOT_RUN.

This profile does not close any of those broader gates. F07 remains IN_PROGRESS at 14/19 plan packages (74%) with 5/19 (26%) open.
Current measured raster matrix: ARC includes DPR1 fit/80%/125%, panned DPR1 125%/195%, and DPR2 fit plus a +48,+24 pan. ELLIPSE includes DPR1 fit, DPR2 captured after a +48,+24 pan from fit, and DPR2 at 125% after the initial and second +48,+24 pans. Earlier statements that no DPR2 pan was measured describe the prior checkpoint. Broader geometry/device rendered-error coverage remains PARTIAL / OPEN.
## 2026-09-25 — ELLIPSE DPR2 80% after center-anchored zoom-out

The 125% DPR2 ELLIPSE view at (748,390,k=7.6) was zoomed out twice through 100% to 80%. Final D3 state (709.12,370.56,k=4.864) corresponds to a retained/scaled pan offset (+69.12,+34.56) CSS px; no new mouse drag occurred at 80%. At a 1280×672 CSS viewport / 2560×1344 DPR2 buffer and 0.2055921053 world/CSS px, the independent 4097-point ellipse oracle measured 620 WebGL pixels. Max render→source was 0.5127801495 CSS px; source→render was 0.3767122232 CSS px. Both are ≤1.25. Refinement targets [0.75,0.25] repeated three times produced six replies, quiet pending state, and maxLineVertexCount=40.

Targeted Chromium 1/1, full six-case layout-viewport Chromium 6/6, three relevant unit tests, runtime TypeScript check, and git diff --check passed. This test/helper-only step used a new C: Next cache and preserved D: test artifacts. Compiler/cache v27, DV2SCN01 schema v1, and worker hashes are unchanged.

The F07 gate audit remains: periodic SPLINE AutoCAD fixture/knot oracle OPEN; HATCH fill runtime remesh/topology OPEN; bounded partition/on-demand host fetch OPEN; residual fill/glyph/chunk composite accounting OPEN; shader PATH_DISTANCE consumption OPEN; broad rendered-error matrix PARTIAL/OPEN; same-source AutoCAD visual/measurement OPEN/NOT_RUN. Existing transformed BULGE same-chord and seam tests were not repeated. Overall F07 IN_PROGRESS, 14/19 plan packages (74%), 5/19 (26%) open.
## 2026-09-25 — ELLIPSE DPR2 156% zoom raster envelope

After DPR2 measurements at 80% and 125%, the existing translated view was zoomed in through UI-confirmed 100%, 125%, and 156% levels. No extra pointer movement occurred during this profile. At 156%, D3 is (775,403.5,k=9.5), the scaled pan offset is (+135,+67.5) CSS px, and the analytic scale is 0.1052631579 world/CSS px. The full quarter-ellipse remains in the viewport. Independent 4097-point parametric-source comparison across 1190 DPR2 pixels produced max rendered-pixel→source distance 0.6348085456 CSS px and source→rendered-pixel distance 0.4734169813 CSS px (≤1.25). Runtime refinement targets [0.75,0.25]×4 settled with 8 replies, quiet state, and maxLineVertexCount=42.

The targeted browser case passed 1/1, all six cases in the layout-viewport Chromium file passed, and curve-refinement/precision-refinement/layout-viewport, runtime TypeScript, and git diff --check passed. Test/helper only; compiler/cache v27, schema v1, and scene/DWG worker hashes remain unchanged. The D: results and fresh C: Next cache were preserved.

Gate status remains: periodic SPLINE AutoCAD/evaluator/knot OPEN; HATCH fill runtime remesh/topology OPEN; host-integrated bounded partition/on-demand chunks OPEN; residual fill/glyph/chunk-boundary composite accounting OPEN; shader PATH_DISTANCE consumption OPEN; broad geometry/zoom/pan/DPR/device rendered-error PARTIAL/OPEN; same-source AutoCAD visual/measurement OPEN/NOT_RUN. F07 IN_PROGRESS at 14/19 plan packages (74%), 5/19 (26%) open.

## 2026-09-25 — DPR1 high-zoom panned ELLIPSE host/render profile

The live CAD V2 host → worker → refined line buffer → WebGL path was measured at DPR1 after two sequential UI zoom steps. Fit transform `(640,336,k=6.08)` advanced through 125% and 156%, awaiting the final 0.25 CSS-pixel target and a stable quiet state at each level. Center-anchored 156% camera is `(640,336,k=9.5)`. A real mouse pan of `(+48,+24)` CSS px produced `(688,360,k=9.5)`, with no scale change. In the 1280×672 CSS/device canvas, the full quarter-ellipse is visible and `u=0.1052631579` world/CSS px.

The independent source oracle samples 4097 points on the analytic ellipse and compares both directions with 592 WebGL raster pixels: render→source max **0.9868434156 CSS px**, source→render max **0.7490349703 CSS px**, both ≤1.25. Worker targets `[0.75,0.25]×3` produced six replies, no pending target response at the settled sample, and 42 maximum line vertices.

Targeted browser **1/1**, full layout-viewport Chromium **6/6**, three relevant unit files, runtime TypeScript check, and `git diff --check` passed. The test/helper change does not alter production compiler/cache revision `cad-v2-compiler-2026.09-v27`, binary schema v1, or scene/DWG worker hashes. Bounded run configs, logs and results remain under `D:\codex-cad-v2-f07-ellipse-dpr1-156-pan-20260925`; each browser run had its own C: Next cache, and no test server remains active.

### Current F07 gates after this profile

- **OPEN — Periodic SPLINE/AutoCAD/knot oracle:** current compiler rejects periodic input; De Boor multiplicity coverage is synthetic and non-periodic.
- **OPEN — HATCH runtime remesh/topology:** curve boundary refinement is not fill-triangle/topology remeshing.
- **OPEN — Bounded spatial partition/on-demand chunks:** `SpatialChunkScheduler` is not host-integrated; host fetches initial manifest chunks with concurrency 6.
- **OPEN — Residual fill/glyph/chunk-boundary composite accounting:** selected narrow terms pass, complete composite sums do not.
- **OPEN — Shader `PATH_DISTANCE`:** the renderer does not consume the worker-transferred field.
- **PARTIAL / OPEN — Rendered-error matrix:** this expands ELLIPSE DPR1 high-zoom pan coverage; varied geometry and output-device contexts remain incomplete.
- **OPEN / NOT_RUN — Same-source AutoCAD visual/measurement oracle:** no paired F07 AutoCAD render/ROI/measurement result exists.

Nested/transformed BULGE was not chosen again: independent same-chord and both seam directions already have narrow oracles, while the broader composite gate remains open. F07 stays **IN_PROGRESS**; plan progress is unchanged at **14/19 (74%)**, with **5/19 (26%)** packages open.


## 2026-09-25 — Synthetic rational SPLINE through the runtime refinement path

The browser harness now feeds a synthetic clamped single-span rational cubic SPLINE source reference through the existing host, worker, refined-buffer, and WebGL rendering path. It checks the binary metadata's four control points and rational weights before accepting raster output. Worker messages are instrumented for requested CSS error and replies; the test waits for the final 0.25 target and two equal quiet snapshots before capturing the canvas.

The independent browser oracle evaluates the rational cubic in Bernstein form, samples 4097 source points, and measures both directed distances against 677 selected raster pixels. DPR1 fit context: 1280×672 CSS/device pixels, camera D3 (640,336,k=6.08), u=0.1644736842 world/CSS px. Maximum raster→source error was 0.8164272623 CSS px; maximum source→raster coverage gap was 0.7307145792 CSS px. The worker target sequence was [0.75,0.25], with 2 replies and 96 maximum line vertices. Both distances are within 1.25 CSS px for this synthetic profile.

Targeted Chromium passed 1/1; the complete layout-viewport Chromium file passed 7/7. curve-refinement, precision-refinement, worker-refinement-browser, runtime TypeScript, and diff-check passed. The stage adds browser test/helper code only. Compiler/cache revision v27, binary schema v1, and both worker hashes remain unchanged. Run artifacts/configs are preserved under D:\codex-cad-v2-f07-spline-dpr1-fit-20260925; each browser run used a separate C: cache and the test ports are closed.

Architecture and acceptance limits: this one-span non-periodic synthetic source is not an AutoCAD-authored periodic spline and says nothing about periodic knot multiplicity. HATCH fill remesh/topology, bounded host spatial partition/on-demand chunk fetching, residual fill/glyph/chunk-boundary composite error, shader PATH_DISTANCE consumption, broader geometry/zoom/pan/DPR/device raster envelopes, and same-source AutoCAD render/measurement remain open; the rendered-error gate is PARTIAL / OPEN and the AutoCAD oracle is NOT_RUN. Existing nested/transformed BULGE same-chord and seam-direction tests were not repeated. F07 remains IN_PROGRESS, 14/19 plan packages (74%) complete and 5/19 (26%) open.


## 2026-09-25 — Rational SPLINE camera-aware DPR2 pan raster profile

The single-span rational SPLINE browser oracle now projects source points through the measured D3 camera and normalizes screenshot raster samples to CSS pixels. A real DPR2 pan moved the camera from (640,336,k=6.08) to (688,360,k=6.08) after (+48,+24) CSS px input. The 1280×672 CSS viewport rendered into a 2560×1344 device buffer.

An independent rational Bernstein evaluator sampled 4097 source points; 1348 selected WebGL pixels gave max rendered→source distance 0.4829010756 CSS px and source→rendered distance 0.4292518924 CSS px. The worker received [0.75,0.25], replied twice, remained quiet before and after pan, and rendered up to 96 line vertices. The existing DPR1 fit case also passed through the camera-aware oracle in the full suite with its previous 0.8164272623 / 0.7307145792 CSS px measurements.

Targeted Chromium 1/1, full viewport Chromium 8/8, three focused refinement/worker unit acceptances, runtime TypeScript, and diff-check passed. This is test/helper-only; compiler/cache revision v27, schema v1, and both worker hashes are unchanged. Preserved run artifacts are under D:\codex-cad-v2-f07-spline-dpr2-pan-20260925-camaware; browser ports are closed.

This remains a synthetic non-periodic spline profile. Periodic AutoCAD SPLINE support/knot oracle, HATCH remesh/topology, bounded host spatial partition and on-demand chunk fetch, residual fill/glyph/chunk-boundary composite accounting, shader PATH_DISTANCE rendering, and same-source AutoCAD visual/measurement remain OPEN; the last is NOT_RUN. The general geometry/zoom/pan/DPR/device rendered-error matrix remains PARTIAL / OPEN. F07 remains IN_PROGRESS, 14/19 packages (74%) complete and 5/19 (26%) open.


## 2026-09-25 — Rational SPLINE DPR2 125% zoom/pan runtime raster oracle

Bu Chromium profili kaynak spline metadata'sını binary chunk'tan okuduktan sonra gerçek CAD V2 host→worker refinement→buffer replacement→WebGL yolunda çalıştırır. Fit kamera D3 (640,336,k=6.08); gerçek +48,+24 CSS px pan (688,360,k=6.08); centered zoom 125% (700,366,k=7.6); ikinci gerçek +48,+24 pan (748,390,k=7.6). Canvas 1280×672 CSS; DPR2 drawing buffer 2560×1344; son kamera merkezine göre birleşik pan (+108,+54) CSS px.

Worker hedef/yanıt sayacı zoom ve pan sonrasında target `[0.75,0.25,0.75,0.25]`, 4/4 cevap ve quiet state doğruladı; maksimum line draw 110 vertex. Rasyonel Bernstein evaluator 4097 bağımsız kaynak konumu örnekleyip 1702 seçilmiş device pixel merkezine CSS uzayında kıyasladı. `d(render,source)` maksimumu 0.4689849332 CSS px, `d(source,render)` maksimumu 0.4743416490 CSS px; iki yön ≤1.25 CSS px.

Seçilmiş Chromium raster kümesi 5/5; düzeltme sonrasında tam viewport suite 8/8 (2.9 dk); üç ilgili unit/runtime-worker kabulü; runtime typecheck ve diff-check PASS. İlk tam-suite girişimi yalnızca test harness güvenli temp-root denetiminde kaldı: `DOK_LOCAL_DATA_DIR`, `TEMP` alt ağacının kardeşiydi. Yeni run root, Next cache, port ve sonuç klasörüyle DOK path'i TEMP altına taşınınca suite 8/8 geçti. Her iki denemenin çıktı ve hata raporu korundu; test sunucuları kapandı.

Bu test-only genişleme compile/cache üretimini veya worker artifact'larını değiştirmedi: compiler revision v27, DV2SCN01 schema v1; scene worker SHA-256 `1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280`; DWG/DXF worker SHA-256 `DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D`. C: cache'leri yeni/benzersiz, D: run kökleri `D:\codex-cad-v2-f07-spline-dpr2-zoom-pan-20260925` ve `D:\codex-cad-v2-f07-spline-dpr2-zoom-pan-fullretry-20260925`; önceki run kökleri ve D-backed test-output korunuyor.

### Bu ölçümden sonra açık F07 kapıları

| Kapı | Sonuç |
|---|---|
| Periodic AutoCAD SPLINE fixture/runtime desteği ve knot multiplicity oracle | **AÇIK** — bu SPLINE non-periodic sentetik single-span kaynaktır; periodic compiler/test oracle yok. |
| HATCH runtime remesh/topology | **AÇIK** — fill triangle topology runtime-refinement kabulünden geçmiyor. |
| Bounded spatial partition/on-demand chunk loading | **AÇIK** — scheduler host'a bağlı değil; host manifest chunk'larını concurrency 6 ile yüklüyor. |
| Fill/glyph/chunk-boundary ve kalan bileşik hata | **AÇIK** — genel birleşik envelope tamam değil. |
| Shader `PATH_DISTANCE` tüketimi | **AÇIK** — renderer alanı okumuyor. |
| Geometri, zoom, pan, DPR/device rendered-error | **PARTIAL / AÇIK** — seçili ARC/ELLIPSE/SPLINE örnekleri var, genel matris yok. |
| Aynı-kaynak AutoCAD görsel/ölçü oracle'ı | **AÇIK / NOT_RUN** — eşleştirilmiş AutoCAD raster/ROI/ölçüm koşusu yok. |

Nested/transformed BULGE mevcut dar same-chord ve iki seam yönü testleri bu alt aşamada yeniden çalıştırılmadı; bu profilden PASS çıkarılmaz. F07 **IN_PROGRESS**; plan **14/19 (%74)**, açık **5/19 (%26)**.


## 2026-09-25 — Rational SPLINE DPR2 at 156% with a second pan

The live CAD V2 host → scene worker → refined XY line buffer → WebGL path was measured for a synthetic non-periodic rational cubic SPLINE. DPR2 camera sequence: fit `(640,336,k=6.08)`, real pan `(688,360,k=6.08)`, centered 125% zoom `(700,366,k=7.6)`, second pan `(748,390,k=7.6)`, centered 156% zoom `(775,403.5,k=9.5)`, then real `(+48,+24)` CSS px pan `(823,427.5,k=9.5)`. Final fit-center-relative pan is `(+183,+91.5)` CSS px. The viewport is 1280×672 CSS px, drawing buffer 2560×1344 device px (`u=0.1052631579` world/CSS px), and the full source remains visible.

The independent rational Bernstein source evaluator used 4097 samples against 2124 selected raster pixels. Maximum render-to-source distance was **0.4907102356 CSS px** and source-to-render coverage gap was **0.4090727048 CSS px**, both within 1.25 CSS px. Refinement settled through `[0.75,0.25,0.75,0.25,0.75,0.25]`, 6/6 replies, latest target 0.25, no pending responses, maximum line draw 110 vertices.

A first targeted attempt revealed a waiter race that accepted the prior 125% 0.25 reply before the new 156% transient 0.75 target. The helper now requires a refinement target newer than the pre-zoom target-count baseline. Corrected targeted Chromium passed 1/1; the full viewport Chromium file passed 8/8 in 3.1 minutes. Three focused unit files, runtime TypeScript (`tsc --noEmit -p tsconfig.next.json --incremental false`), and `git diff --check` passed. Failed and passing logs/configs remain in separate D: roots.

This test-only expansion did not change compiler/cache output: compiler revision v27, binary schema v1, and both worker hashes are unchanged. Targeted and unit/typecheck output is preserved under `D:\codex-cad-v2-f07-spline-dpr2-156-pan-retry-20260925`; full viewport output under `D:\codex-cad-v2-f07-spline-dpr2-156-pan-full-20260925`.

### F07 gates after this measurement

| Gate | Status |
|---|---|
| Periodic AutoCAD SPLINE fixture/runtime support and knot multiplicity oracle | **OPEN** — the measured source is synthetic and non-periodic. |
| HATCH runtime remesh/topology | **OPEN** — this curve test does not remesh fill topology. |
| Bounded spatial partition and on-demand chunk loading | **OPEN** — host loading remains eager; scheduler integration is absent. |
| Remaining fill/glyph/chunk-boundary composite accounting | **OPEN** — full cross-source and chunk/fill/glyph envelope is absent. |
| Shader consumption of `PATH_DISTANCE` | **OPEN** — this raster profile does not establish shader dash consumption. |
| General geometry/zoom/pan/DPR/device rendered-error | **PARTIAL / OPEN** — selected ARC/ELLIPSE/SPLINE cases are measured, not the full matrix. |
| Same-source AutoCAD visual/measurement oracle | **OPEN / NOT_RUN** — no paired AutoCAD render/ROI/measurement run. |

Existing nested/transformed BULGE same-chord and two seam-direction tests were not rerun and do not close residual composite accounting. F07 remains **IN_PROGRESS**, plan **14/19 (74%)**, with **5/19 (26%)** open.


## 2026-09-25 — Rational SPLINE DPR2 at 195% with translated camera

This profile continues the synthetic non-periodic rational cubic SPLINE through fit, three real pointer pans interleaved with centered zoom steps to 125%, 156%, and 195%. Final D3 transform is (868.75,450.375,k=11.875); relative to fit center, net pan is (+228.75,+114.375) CSS px. At CSS 1280×672 / DPR2 drawing buffer 2560×1344, the world-to-CSS scale is 0.08421052631578949. Full source bounds [465,189.125]..[1272.5,664.125] remain visible.

A separate 4097-sample rational Bernstein evaluator measured 2704 selected WebGL pixels in both directions. Maximum render-to-source distance is 0.5413191518506184 CSS px; maximum source-to-render coverage gap is 0.4506939094329671 CSS px; both are at most 1.25 CSS px. Settled targets [0.75,0.25]×4 yielded 8 replies, final target 0.25 CSS px, no pending replies, and maxLineVertexCount 114.

The complete viewport Chromium file passed 8/8 in 190 seconds, complete CAD V2 unit suite passed, runtime TypeScript check passed, and git diff --check passed. Synthetic session heartbeat is intercepted with a successful fixture response; this prevents a real-API 410 from restarting the fake session and resetting its camera. ELLIPSE zoom steps now assert camera scale and a fresh refinement response. This changed browser-test isolation only. Run evidence is preserved at D:\codex-cad-v2-f07-spline-dpr2-195-zoom-final2-20260925; no test ports or test processes remained. Compiler/cache revision v27, binary schema v1, and preserved scene/DWG worker SHA-256 values are unchanged.

### F07 gate status after this profile

| Gate | Status |
|---|---|
| Periodic AutoCAD SPLINE fixture/runtime support and knot multiplicity oracle | OPEN |
| HATCH runtime remesh/topology | OPEN |
| Bounded spatial partition and on-demand chunk loading | OPEN |
| Remaining fill/glyph/chunk-boundary and composite error accounting | OPEN |
| Shader consumption of PATH_DISTANCE | OPEN |
| Rendered error across geometry, zoom, pan, DPR and device contexts | PARTIAL / OPEN |
| Same-source AutoCAD visual/measurement oracle | OPEN / NOT_RUN |

Existing nested/transformed BULGE same-chord and seam-direction tests were not repeated and do not close the remaining composite gate. F07 remains IN_PROGRESS, plan 14/19 (74%), with 5/19 (26%) packages open.


## 2026-09-25 — DPR2 ELLIPSE runtime-refined at 195% after pan

At the prior 156% DPR2 ELLIPSE state (775,403.5,k=9.5), an additional real pointer drag of (-10,-5) CSS px produced (765,398.5,k=9.5). One centered zoom step reached the 195% bucket at (796.25,414.125,k=11.875), with final fit-relative translation (+156.25,+78.125) CSS px. The 1280×672 CSS viewport, DPR2 2560×1344 buffer and u=0.08421052631578949 world/CSS px keep the full quarter ellipse visible.

A separate 4097-sample parametric source oracle measured 1476 selected WebGL pixels in both directions: max render-to-source distance 0.6301951256486582 CSS px; max source-to-render coverage gap 0.4610262730380537 CSS px; both ≤1.25. The final refinement quiet snapshot records 14 replies, latest target 0.25 CSS px, zero pending replies and maxLineVertexCount 46.

Targeted Chromium passed 1/1 and the full layout-viewport file passed 8/8 (3.3 min). The precision-refinement, curve-refinement and worker-refinement-browser tests, runtime TypeScript check and git diff --check passed. This test-only profile leaves production runtime unchanged; its logs/configs/results and fresh C: caches are retained in D:\codex-cad-v2-f07-ellipse-dpr2-195-target-20260925 and D:\codex-cad-v2-f07-ellipse-dpr2-195-full-20260925. Compiler/cache v27, binary schema v1 and preserved scene/DWG worker hashes are unchanged.

### F07 gate status after this profile

| Gate | Status |
|---|---|
| Periodic AutoCAD SPLINE fixture/runtime and knot multiplicity oracle | OPEN |
| HATCH runtime remesh/topology | OPEN |
| Bounded spatial partition and on-demand chunk loading | OPEN |
| Remaining fill/glyph/chunk-boundary composite accounting | OPEN |
| Shader consumption of PATH_DISTANCE | OPEN |
| Rendered error across geometry, zoom, pan, DPR and device contexts | PARTIAL / OPEN |
| Same-source AutoCAD visual/measurement oracle | OPEN / NOT_RUN |

Nested/transformed BULGE same-chord and worker-applied source tests already measure their narrow bounds; the residual cross-source/fill/glyph/chunk composite remains open. F07 remains IN_PROGRESS, plan 14/19 (74%), with 5/19 (26%) packages open.

## 2026-09-25 — DPR1 high-zoom pan runtime izi

195% ELLIPSE kabulünde zincir `canonical fixture → binary scene → browser scene worker → curve refinement response → renderer line buffer → WebGL canvas screenshot` olarak çalıştı. UI zoom’u fit’e göre k=1.953125’e taşıdı; son kamera `(690,361,11.875)` oldu. 195% sonrası pan aynı refinement bucket’ında uygulandığı için yeni target/reply üretmedi; state `[0.75,0.25]×4`, 8/8 reply, son 0.25 CSS px, pending 0 olarak sakin kaldı. Kameranın `(-10,-5)` CSS px deltası ve rasterın bağımsız parametrik ELLIPSE mesafeleri ayrıca ölçüldü: 747 piksel, render→source 1.0146941342 CSS px, source→render 0.7496648734 CSS px.

Test-only değişiklik: production renderer, shader, compiler veya worker değişmedi. Bu nedenle `CAD_V2_COMPILER_REVISION=cad-v2-compiler-2026.09-v27`, `CAD_V2_SCHEMA_VERSION=1`, `CAD_V2_PIPELINE_REVISION=fidelity-v3-p07` aynı; scene-worker public bundle ve DWG/DXF worker SHA-256 değerleri değişmedi. Yalnız kabul koşusu için farklı adlandırılmış `.next-f07-ellipse-dpr1-195-*` cache’leri kullanıldı.

`npm run check:cad-v2:unit` başarılı exit 0 verdi, ancak mevcut unit testleri P05/P06 kanıt JSON’larına doğrudan yazar. Bu koşuda yazılan dört dosya ve log saklandı; sonraki çalıştırmalarda ilgili test yazma yan etkileri önceden hesaba katılmalı. Renderer’da shader `PATH_DISTANCE` kullanımı hâlâ yok; bu profile shader kabulü atfedilmez.

Kapı durumu: periodic AutoCAD SPLINE/knot oracle, HATCH runtime remesh/topology, bounded/on-demand chunk yükleme, fill/glyph/chunk-boundary composite hata hesabı, shader `PATH_DISTANCE`, genellenmiş geometri/zoom/pan/DPR/device matrix ve same-source AutoCAD visual/measurement kapıları bu ölçümle kapanmadı (son matrix PARTIAL, AutoCAD oracle NOT_RUN). F07 IN_PROGRESS, plan 14/19 (%74), 5/19 (%26) açık.
## 2026-09-25 — DPR2 ARC 195% runtime-refined pan profile

The browser path measured here is `synthetic analytic ARC scene → scene worker → runtime refine-curves requests/replies → renderer line buffer → WebGL2 canvas screenshot`. At DPR2, the viewport is 1280×672 CSS px with a 2560×1344 device buffer. The fit camera `(640,336,k=6.08)` receives a real (+48,+24) pan; centered UI zooms reach 125%, 156%, then 195%; another real (+48,+24) pan at 195% ends at `(781.75,406.875,k=11.875)`. Net fit-center-relative translation is (+141.75,+70.875) CSS px. The independent visible-source interval is `[0,1.0286029931]` radians.

The screenshot raster oracle selected 1363 ARC pixels and measured maximum render-to-analytic-source error 0.6559628023 CSS px and maximum source-to-render coverage gap 0.4458264123 CSS px (both ≤1.25). The settled request sequence is `[0.75,0.25]×4`; all 8 replies arrived, final target is 0.25 CSS px, pending reply count is 0, and maximum line vertex count is 46. Pan within the existing 195% zoom bucket reuses the settled refinement; the camera delta and final raster were independently checked.

Targeted Chromium passed 1/1 and the full viewport Chromium file passed 8/8 (3.5 min). Three refinement unit/browser-worker tests and five UI subchecks passed; runtime TypeScript and `git diff --check` passed. The wide unit suite was intentionally omitted because it writes P05/P06 evidence JSONs. The aggregate UI script was decomposed so its worker-build step did not overwrite the user-modified generated worker. Run configs, logs, reports, and isolated temp/data are retained under `D:\codex-cad-v2-f07-arc-dpr2-195-20260925`; distinct C: Next caches were used and browser-server ports are closed.

This acceptance-only test change does not modify the runtime, shader, worker, compiler/cache key, or scene schema. Compiler revision v27, pipeline `fidelity-v3-p07`, binary schema v1 and both preserved worker SHA-256 values remain unchanged. Shader `PATH_DISTANCE` consumption is still **OPEN**; this raster envelope does not establish shader usage.

| Gate | Status |
|---|---|
| Periodic AutoCAD SPLINE fixture/runtime support and knot multiplicity oracle | OPEN |
| HATCH runtime remesh/topology | OPEN |
| Bounded spatial partition and on-demand chunk loading | OPEN |
| Remaining fill/glyph/chunk-boundary and composite error accounting | OPEN |
| Shader consumption of PATH_DISTANCE | OPEN |
| Rendered error across geometry, zoom, pan, DPR and device contexts | PARTIAL / OPEN |
| Same-source AutoCAD visual/measurement oracle | OPEN / NOT_RUN |

The selected ARC/DPR2/195% profile only adds coverage to the rendered-error matrix. F07 remains IN_PROGRESS, plan 14/19 (74%), with 5/19 (26%) packages open.
## 2026-09-25 — DPR1 runtime-refined rational SPLINE, 195% pan

This synthetic non-periodic clamped rational cubic SPLINE profile follows the live `scene → worker refine-curves → refined line buffer → WebGL canvas` path. At DPR1 the 1280×672 CSS viewport and device buffer starts at fit `(640,336,k=6.08)`, reaches centered 125%, 156%, and 195% zoom, then receives a real `(+48,+24)` CSS-pixel pan. The final camera is `(688,360,k=11.875)`, `u=0.0842105263` world/CSS px. An independent rational Bernstein evaluator uses 4097 samples; all samples remain in bounds `[284.25,98.75]..[1091.75,573.75]`.

The settled sequence is `[0.75,0.25]×4`: 8 worker replies, latest target 0.25 CSS px, no pending replies, and `maxLineVertexCount=114`. Bidirectional screenshot comparison across 1350 selected pixels yields 0.9300776279 CSS px rendered-to-source and 0.7905694150 CSS px source-to-render, both ≤1.25. Final pan is within the current zoom bucket and did not create a new refinement request; camera delta, quiet state, and raster were all measured.

Targeted Chromium 1/1, full viewport Chromium 8/8, three refinement unit/browser-worker tests, five UI subchecks, runtime TypeScript and diff check passed. Wide unit execution remains skipped due its P05/P06 JSON write side effects; the UI package worker rebuild was not invoked. Test-only changes leave compiler/cache revision v27, pipeline `fidelity-v3-p07`, schema v1 and both worker artifacts unchanged. All run evidence is kept under `D:\codex-cad-v2-f07-spline-dpr1-195-pan-20260925-v2` with isolated caches and closed test ports.

| Gate | Status |
|---|---|
| Periodic AutoCAD SPLINE fixture/runtime support and knot multiplicity oracle | OPEN |
| HATCH runtime remesh/topology | OPEN |
| Bounded spatial partition and on-demand chunk loading | OPEN |
| Remaining fill/glyph/chunk-boundary and composite error accounting | OPEN |
| Shader consumption of PATH_DISTANCE | OPEN |
| Rendered error across geometry, zoom, pan, DPR and device contexts | PARTIAL / OPEN |
| Same-source AutoCAD visual/measurement oracle | OPEN / NOT_RUN |

This DPR1 synthetic SPLINE profile expands one matrix cell and does not settle the periodic AutoCAD SPLINE gate. F07 stays IN_PROGRESS, plan 14/19 (74%), with 5/19 (26%) packages open.
## 2026-09-25 — DPR2 ELLIPSE: pan after 195% refinement

The synthetic parametric ELLIPSE browser run now drags the camera by `(-10,-5)` CSS px after the final 195% UI zoom. At DPR2 the final camera changes from `(796.25,414.125,k=11.875)` to `(786.25,409.125,k=11.875)`; the fit-relative translation is `(+146.25,+73.125)` CSS px. Projected semimajor/semiminor bounds verify the full analytic quarter ellipse stays inside the 1280×672 CSS viewport / 2560×1344 device buffer.

The separate parametric oracle uses 4097 samples and selects 1476 WebGL raster pixels. Its maximum rendered-to-source distance is 0.6301951256 CSS px and maximum source-to-render distance is 0.4610262730 CSS px (both ≤1.25). The refinement sequence settles at `[0.75,0.25]×7`: 14 replies, final target 0.25 CSS px, no pending reply, maximum 46 line vertices. The post-pan instrumentation snapshot matches twice and equals the pre-pan state, confirming same-bucket reuse.

Targeted Chromium 1/1 and full viewport Chromium 8/8 passed, together with three refinement unit/browser-worker tests, five UI subchecks, runtime TypeScript and diff check. The full unit bundle remains skipped due its P05/P06 JSON writes; UI steps ran individually without rebuilding the generated worker. Production renderer/worker/compiler/cache logic is unchanged; revision v27, pipeline `fidelity-v3-p07`, schema v1 and both worker hashes remain fixed. Run configs, logs and screenshots/results remain under `D:\codex-cad-v2-f07-ellipse-dpr2-195-postpan-20260925`; ports 43931/43932 are closed.

| Gate | Status |
|---|---|
| Periodic AutoCAD SPLINE fixture/runtime support and knot multiplicity oracle | OPEN |
| HATCH runtime remesh/topology | OPEN |
| Bounded spatial partition and on-demand chunk loading | OPEN |
| Remaining fill/glyph/chunk-boundary and composite error accounting | OPEN |
| Shader consumption of PATH_DISTANCE | OPEN |
| Rendered error across geometry, zoom, pan, DPR and device contexts | PARTIAL / OPEN |
| Same-source AutoCAD visual/measurement oracle | OPEN / NOT_RUN |

This DPR2 ELLIPSE profile fills only the post-zoom-pan cell in the selected raster matrix. F07 stays IN_PROGRESS, plan 14/19 (74%), with 5/19 (26%) packages open.
## 2026-09-25 — DPR2 rational SPLINE raster after 195% pan

The existing synthetic, non-periodic single-span rational cubic SPLINE browser path now receives a real `(-10,-5)` CSS-pixel pointer pan after centered zoom steps to 125%, 156% and 195%. The final D3 camera is `(858.75,445.375,k=11.875)`; relative to fit center the translation is `(+218.75,+109.375)` CSS px. The DPR2 drawing buffer is 2560×1344 for a 1280×672 CSS viewport, with `u=0.0842105263` world/CSS px. All 4097 independently evaluated rational Bernstein source samples remain visible inside `[455,184.125]..[1262.5,659.125]` CSS px.

Against 2704 selected WebGL pixels, the source-to-render and render-to-source maxima are **0.4506939094 CSS px** and **0.5413191519 CSS px**, respectively (each ≤1.25). Worker refinement settles at `[0.75,0.25]×4`, 8 replies, last target 0.25 CSS px, zero pending replies and maximum 114 line vertices. The same-bucket pan does not change the settled instrumentation state.

Target Chromium 1/1, full viewport Chromium 8/8, focused unit/UI 7/7, runtime TypeScript and whitespace checks passed. The broad unit package remains unrun due its P05/P06 evidence JSON writes; the five UI checks ran without rebuilding the generated worker. No runtime production source changed. Compiler/cache revision v27, pipeline `fidelity-v3-p07`, schema v1 and both worker hashes are unchanged. Retained evidence is under `D:\codex-cad-v2-f07-spline-dpr2-195-postpan-20260925`; browser jobs used distinct C: caches and D: temp/data, and left no test listeners/processes.

| F07 gate | Status |
|---|---|
| Periodic AutoCAD SPLINE fixture/runtime support and knot multiplicity oracle | OPEN |
| HATCH runtime remesh/topology | OPEN |
| Bounded spatial partition and on-demand chunk loading | OPEN |
| Remaining fill/glyph/chunk-boundary and composite error accounting | OPEN |
| Shader consumption of `PATH_DISTANCE` | OPEN |
| Rendered-error matrix across geometry, zoom, pan, DPR and device contexts | PARTIAL / OPEN |
| Same-source AutoCAD visual/measurement oracle | OPEN / NOT_RUN |

This pan adds a synthetic DPR2 matrix cell only. F07 remains IN_PROGRESS at plan 14/19 (74%), with 5/19 (26%) packages open.
## 2026-09-25 — DPR2 rational SPLINE raster at 80% after pan

The synthetic non-periodic rational cubic SPLINE browser flow now reaches 80% by stepping down from 195% through 156%, 125%, and 100%, and performs a real `(-10,-5)` CSS-pixel pan at that zoom. The final D3 camera is `(719.6,375.8,k=4.864)`; its fit-relative offset is `(+79.6,+39.8)` CSS px. With a 1280×672 CSS viewport and DPR2 2560×1344 device buffer, `u=0.2055921053` world/CSS px. The full independent source bounds `[554.224,268.792]..[884.976,463.352]` stay in view.

The separate rational Bernstein oracle samples 4097 source points and selects 1112 WebGL pixels. Maximum render-to-source error is **0.4476090077 CSS px**; maximum source-to-render gap is **0.3641466608 CSS px** (each ≤1.25). Runtime refinement settles at `[0.75,0.25]×5`: 10 replies, final target 0.25 CSS px, no pending replies and maximum 114 line vertices. A 350 ms post-pan quiet comparison confirms the 80% same-bucket pan does not request another refinement.

Targeted Chromium 1/1, full viewport Chromium 8/8, focused unit/UI 7/7, runtime TypeScript and whitespace checks passed. The broad unit package remains unrun due to P05/P06 evidence JSON writes; the five UI checks ran without rebuilding the generated worker. The acceptance-only change does not modify runtime, shader, compiler/cache or worker source. Revision v27, pipeline `fidelity-v3-p07`, schema v1 and both worker hashes remain unchanged. Logs/configs/results are under `D:\codex-cad-v2-f07-spline-dpr2-80-pan-20260925`; test ports/processes are closed.

| F07 gate | Status |
|---|---|
| Periodic AutoCAD SPLINE fixture/runtime support and knot multiplicity oracle | OPEN |
| HATCH runtime remesh/topology | OPEN |
| Bounded spatial partition and on-demand chunk loading | OPEN |
| Remaining fill/glyph/chunk-boundary and composite error accounting | OPEN |
| Shader consumption of `PATH_DISTANCE` | OPEN |
| Rendered-error matrix across geometry, zoom, pan, DPR and device contexts | PARTIAL / OPEN |
| Same-source AutoCAD visual/measurement oracle | OPEN / NOT_RUN |

This adds one zoom/pan cell to the synthetic DPR2 SPLINE matrix. F07 remains IN_PROGRESS at plan 14/19 (74%), with 5/19 (26%) packages open.
## 2026-09-25 — DPR1 SPLINE 80% runtime refinement / pan

The runtime browser acceptance now carries its synthetic non-periodic rational cubic SPLINE from the existing 195% zoom/pan down through 156%, 125%, 100%, and 80%, then applies a real (-10,-5) CSS-pixel pan. At final camera (649.6608,340.8304,k=4.864), the 1280×672 CSS viewport and DPR1 framebuffer both measure 1280×672; the full source bounds [484.2848,233.8224]..[815.0368,428.3824] remain visible. An independent 4097-sample rational Bernstein source oracle compared against 542 WebGL pixels: rendered-to-source maximum 0.7981910667 CSS px and source-to-rendered maximum 0.9082625171 CSS px, both within 1.25 px. The idle refinement sequence is [0.75,0.25]×5, 10 replies for 10 requests, final target 0.25 px, zero pending replies, and maximum line vertex count 114. The same-bucket pan schedules no extra response.

The targeted Chromium case passed 1/1 (55.7 s test body); the complete viewport Chromium file passed 8/8 (285.2 s); two refinement unit checks plus five direct UI/worker checks passed 7/7; runtime TypeScript and git diff --check passed. Runs had hard timeouts, used isolated D: temp/data/output and separate C: Next caches, and left ports 43937/43938 closed.

Runtime/compiler implementation did not change in this stage. Compiler/cache revision remains cad-v2-compiler-2026.09-v27, pipeline fidelity-v3-p07, scene binary schema v1. Worker SHA-256 remains 1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280 for the scene worker and DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D for the DWG/DXF conversion worker.

Gate re-audit remains conservative: periodic AutoCAD SPLINE fixture/runtime and AutoCAD knot oracle **OPEN**; HATCH runtime remesh/topology **OPEN**; bounded spatial partition/on-demand chunks **OPEN**; residual fill/glyph/chunk-boundary composite accounting **OPEN**; shader consumption of PATH_DISTANCE **OPEN**; broad geometry/zoom/pan/DPR/device rendered-error **PARTIAL / OPEN**; same-source AutoCAD visual/measurement **OPEN / NOT_RUN**. Existing synthetic clamped SPLINE knot tests and static glyph/HATCH accounting cover narrower cases only. F07 remains **IN_PROGRESS**, plan 14/19 (74%), 5/19 (26%) packages open.


## 2026-09-25 — DPR1 ELLIPSE 80% runtime refinement / pan

The browser acceptance adds a zoom-out and pan cell to the synthetic ELLIPSE runtime matrix: after the existing high-zoom profile, the camera returns through 156%, 125%, and 100% to 80%, then receives a real (-10,-5) CSS-pixel pan. Final camera is `(650.48,341.24,k=4.864)` on a `1280×672` CSS viewport and DPR1 drawing buffer; the world scale is `0.2055921052631579` world/CSS px.

A 4097-sample independent parametric quarter-ellipse oracle measured 299 WebGL pixels. Rendered-to-source maximum is 0.7860996134 CSS px; source-to-rendered maximum is 0.8713208364 CSS px (≤1.25 px). Runtime refinement settled at 0.25 CSS px, 10 replies for 10 requests, and 46 maximum line vertices. The same-bucket pan did not schedule a new refinement in the 350 ms confirmation window.

Targeted Chromium passed 1/1 (82.4 s end-to-end), the full viewport Chromium file passed 8/8 (275.5 s), seven focused CAD V2 unit/UI scripts passed 7/7, and the runtime TypeScript check passed. Successful logs/artifacts are in `D:\codex-cad-v2-f07-ellipse-dpr1-80-pan-20260925`; each browser run used a separate C: Next cache and isolated D: temp/data. Ports 3000 and 43940 and matching runner/server processes were closed after completion. The initial setup-only failure artifact in the repository default `test-results` directory was preserved and excluded from the passing result.

No runtime/compiler source or binary protocol was changed by this substage. Compiler/cache revision remains `cad-v2-compiler-2026.09-v27`, pipeline `fidelity-v3-p07`, and scene binary schema v1; public scene worker and preserved DWG/DXF conversion-worker artifact SHA-256 values still match the prior checkpoint.

Gate status remains conservative: periodic AutoCAD SPLINE fixture/runtime and knot oracle **OPEN**; HATCH runtime remesh/topology **OPEN**; host-integrated bounded partition/on-demand chunking **OPEN**; residual fill/glyph/chunk-boundary composite error **OPEN**; shader `PATH_DISTANCE` consumption **OPEN**; broad geometry/zoom/pan/DPR/device rendered-error **PARTIAL / OPEN**; same-source AutoCAD visual/measurement **OPEN / NOT_RUN**. Static HATCH topology/fill accounting and glyph quantization tests cover narrower cases. F07 remains IN_PROGRESS, plan 14/19 (74%), with 5/19 (26%) packages open.


**Artifact note:** In the first failed Playwright invocation, PowerShell argument forwarding did not apply `--output`, so the failure artifact went to the repository default `test-results` path. The current output was not deleted or moved. Because no pre-run hash or backup was taken for a same-named artifact, preservation of any prior content cannot be verified retrospectively. This failed attempt is excluded from PASS counts.


## 2026-09-25 — DPR1 ARC 80% runtime refinement / pan

The synthetic quarter-circle ARC browser acceptance adds a DPR1 low-zoom pan cell. After its existing 195% pan, the camera zooms through 156%, 125%, and 100% to 80%, then receives a real (+48,+24) CSS-pixel pan. Camera changes from `(710.0416,371.0208,k=4.864)` to `(758.0416,395.0208,k=4.864)`; viewport and raster are `1280×672`, at `0.2055921052631579` world/CSS px.

The independent analytic source-arc oracle measured 383 WebGL pixels. Rendered-to-source maximum is 0.8401740575 CSS px and source-to-rendered maximum is 0.7087218739 CSS px (≤1.25 px). Refinement settled at target 0.25 CSS px with no pending replies and 46 maximum line vertices. The pan did not cause another request in the same zoom bucket.

Targeted Chromium passed 1/1; the complete viewport Chromium file passed 8/8; seven focused CAD V2 unit/UI scripts passed 7/7; runtime TypeScript and CRLF-aware diff checks passed. D: logs/artifacts are under `D:\codex-cad-v2-f07-arc-dpr1-80-pan-20260925`, with separate C: caches and D: temp/data. A first test-only camera-ratio assertion failed because it divided instead of multiplying `k` by fit scale; the corrected retry and complete run passed. Its D: failure artifacts remain preserved.

Runtime/compiler/protocol source was not changed. Revision remains `cad-v2-compiler-2026.09-v27`, pipeline `fidelity-v3-p07`, schema v1; the public scene worker and preserved conversion-worker artifact hashes match the preceding checkpoint. The periodic SPLINE/knot, HATCH runtime remesh, bounded/on-demand chunks, residual composite accounting, shader `PATH_DISTANCE`, broad rendered-error matrix (**PARTIAL / OPEN**), and same-source AutoCAD (**OPEN / NOT_RUN**) gates remain open. F07 stays IN_PROGRESS at 14/19 (74%), with 5/19 (26%) packages open.


## 2026-09-25 — DPR3 rendered-error matrix eki

DPR3 browser bağlamı, kullanıcı CSS ölçüsü ile WebGL buffer çözünürlüğünün ayrı kaldığını doğruladı: viewport 1280×672 CSS px; window.devicePixelRatio=3; renderer buffer'ı 2560×1344 ile 2×'te sınırlı; cihaz screenshot'ı 3840×2016. Canlı ELLIPSE worker refinement ve gerçek pan sonrasında independent raster oracle iki yönde 0.7085877543 / 0.2589010743 CSS px ölçtü (≤1.25). Bu sentetik DPR profili native GPU davranışı veya genel rendered-error matrisi değildir.

Bu alt aşama compiler/worker/renderer/protocol kaynağını değiştirmedi. Compiler/cache v27, pipeline p07, DV2SCN01 schema v1 ve three172-cad2d-v1 ABI sabit kaldı. Renderer PATH_DISTANCE alanını hâlâ okumaz; bu raster kabulü dash/shader oracle'ı değildir. Periodic AutoCAD SPLINE, HATCH runtime fill remesh, bounded/on-demand chunking, kalan fill/glyph/chunk bileşikleri ve same-source AutoCAD visual/measurement kapıları açık kalır. F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-25 — DPR3 80% rational SPLINE runtime/render profile

The browser test exercised `synthetic rational SPLINE scene → binary source sidecar → host camera bucket → scene-worker refinement → renderer line buffer → WebGL2 screenshot`. Fit camera `(640,336,k=6.08)` stepped to 80% `(640,336,k=4.864)`, then a real `(-10,-5)` CSS-pixel pan produced `(630,331,k=4.864)`. CSS viewport 1280×672; browser DPR3; renderer drawing buffer capped to 2560×1344 (2×); device screenshot 3840×2016.

An independent 4097-point rational Bernstein oracle and 3273 selected WebGL pixels measured max render→source `0.6668573448 CSS px` and source→render `0.2322079741 CSS px`, both within 1.25 px. Runtime refinement ended at `[0.75,0.25,0.75,0.25]`, 4/4 replies, target 0.25 CSS px, pending 0, max line vertices 96. Pan within the final zoom bucket scheduled no new request.

This modifies only the browser acceptance spec. Compiler/cache revision v27, pipeline `fidelity-v3-p07`, DV2SCN01 schema v1, render ABI `three172-cad2d-v1`, and public scene-worker SHA-256 `1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280` remain unchanged. The isolated C: Next cache is test output state, not a scene-cache revision. Successful Chromium artifacts/logs are preserved under `D:\codex-cad-v2-f07-spline-dpr3-80-pan-20260925`; no server listener remained on test ports 43973/43974.

F07's plan section has six top-level requirement groups. Current internal estimate: two PASS, four PARTIAL; using half credit for a partial group gives `(2 + 4×0.5)/6 ≈ 67%`. The estimate is separate from the overall plan's 14/19 (74%) and does not override the unresolved final acceptance gates. Periodic AutoCAD spline/knot, HATCH runtime fill remesh/topology, host spatial partition/on-demand chunks, residual fill/glyph/chunk composite, shader `PATH_DISTANCE`, and same-source AutoCAD visual/measurement remain OPEN (last NOT_RUN); general geometry/zoom/pan/DPR/device rendered-error remains PARTIAL/OPEN. F07 stays IN_PROGRESS.


## 2026-09-25 — PATH_DISTANCE shader draw path (limited profile)

The renderer now consumes PATH_DISTANCE for a deliberately narrow case: hairline straight LINE and open, straight, widthless LWPOLYLINE with `plinegen` enabled and exactly `[positive dash, negative gap]`. The compiler preserves the full centerline, cumulative F32 endpoints and `{dashSize,gapSize}` on ordered draw-command metadata. Renderer copies the scalar values alongside the position runs into Three r172's `lineDistance` attribute and uses `LineDashedMaterial`; its built-in WebGL shader evaluates the dash/gap intervals. This keeps phase stable when one source polyline is split into multiple chunks.

Chromium evidence used a 184-unit path split into 31-unit source edges, pattern `[24,-16]`, and 1 versus 6 chunks. The encoded distances were `[0,31,31,62,62,93,93,124,124,155,155,184]`; the single draw command had 12 vertices. Both rendered frames contained five runs at `[66–177],[275–420],[518–663],[762–907],[1005–1150]`, with gaps 97/97/98/97 px and identical SHA-256 `264758117837085532fc5ad17b5f5b9ff469b550540ccf1a0dd14e68d678545b`. The focused Chromium spec passed 1/1. `linetype-phase.test.ts` passed all 12 gates and checks fallback for lineweight and multi-term patterns; `real-scene-render.test.ts`, `durable-service.test.ts` 5/5, runtime typecheck and CRLF-aware diff check passed.

Wide lines, vertex widths, bulge/curved paths, closed or phase-reset polylines, dots, multi-term and leading-gap patterns retain CPU expansion. This closes no generic AutoCAD linetype gate: PATH_DISTANCE shader consumption is **PARTIAL / OPEN**. Compiler/cache revision v28, pipeline p08, render ABI `three172-cad2d-v2`; DV2SCN01 schema v1. The existing scene worker bundle hash remains `1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280`. F07 internal estimate remains 2 PASS + 4 PARTIAL across six top-level requirement groups, about 67%; overall plan 14/19 (74%), five packages open.


## 2026-09-25 — Periodic SPLINE DXF source preservation (synthetic oracle only)

The DXF pair reader preserves raw SPLINE fields by group-5 handle: flags 70, degree 71, counts 72/73, knots 40, weights 41 and WCS controls 10/20/30. ASCII/binary synthetic profiles match. Invalid degree 0 remains visible to validation. Independent degree-3 De Boor checks closure <1e-8 world units, knot-4 continuity <1e-5, multiplicity 2/3 and cyclic control repetition. Production periodic refinement remains unsupported and fails closed with no points and degraded/CURVE_GEOMETRY_INVALID; non-periodic clamped cubic baseline passes.

The profiles are synthetic, not AutoCAD-authored. AutoCAD COM fixture attempt timed out at 90 s without DWG/DXF/property output; AutoCAD periodic parity remains OPEN/NOT_RUN. Evidence is preserved in D:\codex-cad-v2-f07-periodic-spline-acad-20260925.

Separate runtime regression: synthetic DPR1 ARC Chromium 1/1, 80% after (+48,+24) CSS px pan, 1280×672 canvas and 383 pixels; max render-to-source 0.8401740575 CSS px and source-to-render 0.7087218739 CSS px. Target 0.25, pending 0, max line vertices 46. This does not test periodic SPLINE.

Current identifiers from source: compiler/cache v29, pipeline p08, ABI v2, DV2SCN01 schema v1. Compiler revision participates in scene identity; serialized chunks and public worker bundle did not change in this decoder stage. Public scene-worker SHA-256 1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280.

F07 remains IN_PROGRESS: internal estimate ~67% (2 PASS + 4 PARTIAL over six groups); overall plan 14/19 (74%), five packages open. HATCH remesh, bounded/on-demand chunking, residual fill/glyph/chunk-boundary accounting, broad PATH_DISTANCE shader, full rendered-error coverage and same-source AutoCAD oracle remain unresolved; PATH_DISTANCE is PARTIAL/OPEN for the limited hairline two-term path.


## 2026-09-25 — PATH_DISTANCE shader profile rerun

The current straight hairline dash path was rerun through compiler output, PATH_DISTANCE, renderer lineDistance attribute and Three LineDashedMaterial under Chromium. Unit linetype-phase.test.ts passed all 12 gates; the focused browser test passed 1/1. A 184-unit source path with 31-unit edges and dash/gap 24/16 preserved scalar endpoints [0,31,31,62,62,93,93,124,124,155,155,184]. One versus six chunks produced the same five visible runs, gaps 97/97/98/97 px and framebuffer SHA-256 98878ef260eb93722877a39be4a72bc188dbbbfda24b36f83d1680980941e0a8.

This confirms the limited two-term straight hairline profile. Wide, curved/bulged, reset and multi-term pattern coverage remains incomplete; PATH_DISTANCE stays PARTIAL/OPEN. Artifacts: D:\codex-cad-v2-f07-periodic-spline-acad-20260925\playwright-run-004. The evidence does not change F07's approximately 67% internal estimate or the overall plan's 14/19 (74%) status.


## 2026-09-25 — F07 periodic SPLINE runtime-refinement checkpoint

Runtime path: bounded rational-Bezier span sidecars enter the existing refinement worker; browser evidence covers cached source and inline source fallback after LRU eviction, and generation checks discard stale results.

Synthetic periodic DXF SPLINE runtime refinement is now enabled for a bounded profile: degree 1–8, positive finite weights, cyclic control/weight tail, and closed active knot interval. Open/non-cyclic seams and degree 9+ fail-closed; non-periodic knot insertion is unchanged. This supersedes the earlier blanket periodic rejection only for these synthetic profiles.

Independent De Boor oracle: four 4-span profiles (F071/F074/F075/F077), 12,001 samples each (48,004 total), target 0.05 world units. Max errors 0.0188605 / 0.0326872 / 0.0364018 / 0.0361927; reported bounds 0.0254003 / 0.0441744 / 0.0488367 / 0.0482629. Simple/double/triple internal multiplicity and rational weights were included. Chromium worker refined 6 source segments to 64; bound met, stale generation dropped, LRU inline fallback passed, Float32 output 3,472 bytes.

Periodic AutoCAD-authored fixture/parity and periodic raster comparison are still missing: this gate remains PARTIAL/OPEN. A separate DPR3, 80%-zoomed-and-panned UI raster regression tested a non-periodic rational SPLINE only (3,273 pixels; render→source 0.666857 CSS px, source→render 0.232208 CSS px), so it does not close periodic or general runtime raster acceptance.

Current compiler/cache revision cad-v2-compiler-2026.09-v30; pipeline fidelity-v3-p08; DV2SCN01 schema v1 and three172-cad2d-v2 render ABI unchanged. Unit package exited 0, periodic unit and real-browser worker tests passed, runtime tsc --noEmit -p tsconfig.next.json --incremental false passed. Logs retained in D:\codex-cad-v2-f07-periodic-runtime-20260925. F07 remains IN_PROGRESS, internal estimate ~67% (2 PASS + 4 PARTIAL across 6 groups); plan 14/19 (74%), 5 packages open.


## 2026-09-25 — F07 nested affine BULGE DPR2 rendered-error checkpoint

Runtime path is now exercised for nested transformed BULGE: canonical LWPOLYLINE bulge under two INSERT transforms → compiler-generated curve sidecar → scene binary/chunk fetch → host-managed worker refinement → renderer LINE buffers → WebGL2 raster. Transform profile combines an inner non-uniform scale/rotation with an outer mirrored non-uniform scale/rotation.

The independent source evaluator uses `theta=4*atan(b)` and an analytic circular center/radius, then applies the INSERT transforms separately to 4,097 samples. At DPR2, 80% zoom-out and +24,+12 CSS pan, CSS viewport was 1280×672 and buffer/screenshot 2560×1344. The worker observed one BULGE source reference, 4/4 refinement responses with final target 0.25 CSS px and max line vertex count 98. Bidirectional raster distances were 0.5856469647 and 0.4652905302 CSS px across 3,105 colored pixels. The pan scheduled no further reply.

Focused real-host Chromium 1/1; nested affine/composite accounting unit and curve-refinement unit PASS; runtime typecheck PASS. The repository-wide test-inclusive TypeScript check still fails in other existing tests and older viewport Worker.postMessage instrumentation; the new test is absent from the final diagnostic list. All evidence is retained in `D:\codex-cad-v2-f07-nested-bulge-raster-20260925`.

This expands only the synthetic rendered-error matrix. Native-device coverage, broader families/context matrix, and same-source AutoCAD remain open. No runtime source/protocol/cache revision was changed: compiler/cache v30, pipeline p08, schema v1, render ABI v2; public worker hashes unchanged. F07 stays IN_PROGRESS at ~67% (2 PASS + 4 PARTIAL of 6 groups); overall plan 14/19 (74%), five packages open.
