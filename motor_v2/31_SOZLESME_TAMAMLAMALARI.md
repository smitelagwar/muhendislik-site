# 31 — Metadata, kaynak parçası, binary ve lease tamamlamaları

[Dizin](README.md) · [Temel API](25_SABIT_VERI_VE_API_SOZLESMELERI.md) · [Renderer](29_RENDER_VE_YASAM_DONGUSU.md) · [Alt kabul](uygulama__ALT_KABUL_DURUMLARI.md)

**EXEC-2 / 25'in bağlayıcı tamamlayıcısı.** Aşağıdaki alanlar şimdi tasarlanıyor; mevcut endpoint veya uygulanmış şema değildir. EXEC-1 henüz runtime'a uygulanmadığından schemaVersion=1 korunur. EXEC-2 dışındaki eski planla üretilmiş deney artifact'ı varsa yeniden derlenir; compilerVersion/renderAbi eşleşmeden kabul edilmez.

## Manifest ve metadata sayfaları

25 root alanlarına **renderAbi="three172-cad2d-v1", metadataPages, limits** eklenir. limits gerçek derlemede kullanılan girdiler, decoded toplam, chunk sayısı ve refinement sınırlarını bildirir; client kendi 00/29 üst sınırlarının aşılmasına izin vermez. qualityStatus'taki exact, seçilmiş profil için bilinen eksik olmadığını bildirir; matematiksel sonsuz hassasiyet veya tüm format desteği değildir.

Root layouts yalnız layoutId/sourceName/kind/bbox/units ve metadata referanslarını taşır. viewportIds ve resources tam dizileri daima metadata sayfalarında tutulur; root resources={metadataIds:string[]}, layout viewportMetadataIds:string[] referanslarını taşır; içerik metadata sayfalarındadır. 1 MiB root sınırı her durumda korunur. Sayfalama capability değildir; v1'in sabit parçasıdır. sourceName özgün Unicode; UI görünen adından ID üretilmez.

GET /scenes/[sceneId]/metadata/[metadataId] iki admin/public prefix altında aynı mevcut erişim kontrolüne tabidir; JSON ≤1 MiB, private/no-store. Root metadataPages kaydı: metadataId, kind, byteLength, sha256, recordCount, layoutIds. kind=layers|styles|viewports|resources|diagnostics|bounds. Sayfa: schemaVersion, sceneId, metadataId, kind, records. Root'ta bulunmayan kimlik kabul edilmez. Her record ID ilgili scene içinde benzersiz, bütün referanslar compiler publish öncesi çözülür.

| Record | Sabit alanlar / anlam |
|---|---|
| layer | layerId, sourceName, sourceOn, sourceFrozen, sourceLocked, color, linetypeId, lineweight, transparency |
| style | styleId, kind=stroke/fill/text/image, sourceStyleId, resolvedColor, alpha, lineweightMm, linetypeId, fontResourceId, diagnosticIds; ilgili olmayan alan null |
| viewport | viewportId, layoutId, modelLayoutId, enabled, modelToPaper(16 Float64, column-major), clipRings(2D paper coordinates), frozenLayerIds, annotationScale, diagnosticIds |
| resource | resourceId, kind=font/xref/image/underlay, sourceName, sourceSha256 veya null, status=available/missing/unsupported, payloadKind=outline/raster/compiled-xref/none, partChunkIds, decodedByteLength, diagnosticIds |
| diagnostic | diagnosticId, code, severity=info/warning/error, sourceHandle veya null, instancePath veya null, layoutId veya null, resourceId veya null, count veya null, redactedMessage |
| bounds | layoutId, viewportId veya null, layerId, bbox=[minX,minY,maxX,maxY] veya null, primitiveCount; effective layer çözülmüş olmalı |

Image primitive descriptor'ı META'da resourceId, texturePartChunkId, vertex/UV range, alpha ve affine instance referansını taşır. Stroke descriptor'ı PATH_DISTANCE ve STROKE_DATA aralıklarını kaynak segmentlerle bire bir eşler; width/phase chunk sınırında korunur.

Stroke style'ın linetype kayıtları style sayfasında kind=linetype olarak ayrıca tutulur: styleId, sourceStyleId, pattern(Float64 dizi), phase, totalLength, shapeResourceIds, diagnosticIds. Text style kind=text alanlarına height/widthFactor/oblique/rotation/alignment ve source resolved font bilgisi eklenir; glyph placement render payload'dadır. Renk record'u sourceKind=aci/truecolor/bylayer/byblock, sourceValue ve resolvedSrgb üçlüsünü korur. BYLAYER/BYBLOCK çözülmemiş GPU payload publish edilemez.

Farklı viewport/layer bağlamları aynı source layer kimliğini korur; görünürlük override sourceOn/sourceFrozen'ı mutasyona uğratmaz. İlk render sourceOn && !sourceFrozen && !viewportFrozen. UI tek görünürlük checkbox'ı kullanıcı overrideVisible=true/false/null tutar; açık override kaynak off/frozen durumunu yalnız bu viewer görünümünde aşabilir ve “Kaynakta kapalı/donuk” etiketi kalır. Viewport'a özel frozen kuralı bu genel checkbox ile aşılmaz. “Tümünü göster” global overrideVisible=true yapar; viewport özel dondurma korunur. Source locked sadece düzenleme bilgisi, görünmezlik değildir.

Pafta viewport clipRings ve bounds kendi paper uzayındadır; modelToPaper'nin terslenebilirliği ve sayısal doğruluğu test edilir. Nonrect clip için ringleri earcut ile üçgenlere böl; her clip üçgenine karşı Sutherland–Hodgman convex intersection uygula, oluşan parçalarda source parameter/order/phase bilgisini koru. Delik halkaları triangulation girdisinde korunur. Kendi kendini kesen/bozuk ring otomatik “tamir edildi” sayılmaz; diagnostic ve degraded. Aynı işlem çizgi parçasında parametre aralığı kesişimiyle yapılır; dahili clip üçgen kenarları görünür stroke üretmez. Aynı source segment üzerindeki bitişik/örtüşen parametre aralıkları birleştirilir; clip triangulation ortak kenarında double stroke/alpha oluşmaz.

## Resource byte yolu ve chunk index

Yeni serbest URL veya büyük resource endpoint'i açılmaz. Kaynak payload parçaları **25'in GET /chunks/[chunkId]** yolundan gelir. Chunk kaydına payloadKind=geometry|resource, resourceId veya null, partIndex, partCount, encoding=scene-bin-v1|png|jpeg eklenir. geometry için layoutId/bbox/order alanları dolu; resource için null olabilir. Resource kimliği/staging/path client girdisinden türetilmez. Her part ≤2 MiB; decoded boyut/hash/scene/resource ilişkisi aynı izin zincirinde doğrulanır.

Font outline geometry chunk'ıdır; original SHX/TTF public font asset'ı yapılmaz. XREF ayrı raw dosya olarak browser'da parse edilmez, derlenmiş scene parçalarıdır. PNG/JPEG raster tile'ları source raster geometrisi ve transform metadata'sıyla ilişkilidir. Missing resource için sahte boş chunk üretilmez. Image dimensions/decode boyutu 29 limitleriyle doğrulanır; zip bomb/decompression overflow dağıtım sınırını aşamaz.

Index kaydına geometryKind, primitiveCount, lodBucket veya null, finalErrorBoundCssPx veya null, viewportId veya null eklenir. dependencyChunkIds yalnız zorunlu bağımlılık; cycle ret. Global order source traversal'dan gelir, indexPage/chunk geliş sırasından değil. Compiler'ın layer/layout/style/resource/clip ve order referanslarını bütünsel doğrulaması publish kapısıdır. Client sadece görünür veriyi taşır ama aldığı sayfaların sınır/hash/ref bütünlüğünü doğrular.

## Binary v1: minimum ortak byte sözleşmesi

25'teki header burada kesin byte düzenine bağlanır. Bütün tamsayılar unsigned little-endian; Float32/64 IEEE754; offset byte cinsinden. Header **32 byte**: [0..7] ASCII DV2SCN01; [8] u32 schemaVersion=1; [12] u32 totalByteLength; [16] u32 sectionCount; [20] u32 sectionTableOffset=32; [24] u32 headerBytes=32; [28] u32 reserved=0. Section table her kayıt **32 byte**:

| Byte offset | Alan |
|---|---|
| 0 | tag u32 |
| 4 | scalarType u16: 1=u8,2=u16,3=u32,4=f32,5=f64 |
| 6 | componentCount u16, 1..16 |
| 8 | elementCount u32 |
| 12 | byteOffset u32 |
| 16 | byteLength u32 |
| 20 | strideBytes u32; packed componentCount×scalarSize |
| 24 | flags u32=0 |
| 28 | reserved u32=0 |

Her payload 8 byte hizalı; aralıklar header/table/başka payload ile çakışamaz; padding sıfır. Aynı tag bir chunk'ta bir defa bulunur. byteLength=elementCount×strideBytes; doğrulama allocation'dan önce. Unknown tag/type/flags reddedilir, sessiz atılmaz. Bu format compressed codec seçimi değildir.

Güncel runtime tag listesi (`src/lib/cad-v2/protocol/binary-protocol.ts`): 1 META(u8,1 UTF-8 JSON); 2 ORIGIN(f64,2 tek kayıt); 3 XY(f32,2 lokal vertex); 4 TRIANGLES(f32,2 mesh vertex); 5 INSTANCE(f32,6 affine a,b,c,d,tx,ty); 6 CURVE_DATA(f32,8); 7 GLYPH_DATA(f32,4); 8 SOURCE_STRINGS(u8,1 UTF-8 JSON); 9 DRAW_RUNS(u32,8); 10 PATH_DISTANCE(f32,1 cumulative stroke distance); 11 CLIP_DATA(f32,4); 12 STROKE_DATA(f32,2); 13 UV(f32,2). Hiçbir chunk browser'a canonical entity object grafiği taşımaz. META yalnız buffer aralık descriptor'ları, kimlikler ve bounded draw resource eşlemesidir; koordinatlar typed bölümlerde kalır. Bu tabloda scalar/component sayıları çalışan runtime tag sözleşmesidir; daha eski tasarım metinlerindeki farklı layout değerleri uygulanmış wire format'ı tanımlamaz.

DRAW_RUNS sekiz alanı: primitiveKind, firstElement, elementCount, instanceIndex(UINT32_MAX=none), layerLocalId, styleLocalId, clipLocalId(UINT32_MAX=none), orderLocalId. primitiveKind 1=triangles,2=stroke-path,3=curve,4=glyph,5=image-quad,6=wipeout. firstElement/elementCount ilgili section'ın element indeksidir; byte offset değildir. META local-ID tablosu scene kimliklerine, orderLocalId ise Float64 kullanılmadan **decimal string global source order** değerine eşler; JS sort BigInt karşılaştırır. instance affine a*x+c*y+tx, b*x+d*y+ty. Clip barycentric/triangle verisi 11; subrange descriptor META'da kesin pointCount/firstElement taşır.

CURVE_DATA descriptor türleri line/arc/ellipse/bspline. META paramsStart/paramsCount/degree/controlPointCount/knotCount/weightCount/rational ve parameterStart/End taşır. Param sırası: line x0,y0,x1,y1; arc cx,cy,r,startAngle,sweep; ellipse cx,cy,ux,uy,vx,vy,startParam,sweep; bspline önce XY kontrol noktaları, sonra knots, sonra weights. Açılar radian, sweep işaretli; full circle açıkça 2π. CURVE_DATA world coordinate Float64 + scene coordinateSpace metadata'sı kullanır, Float32 vertex'ten ters türetilmez. Non-uniform transformed arc ellipse'e çevrilir.

GLYPH_DATA outline komutları META'da ordered command list M/L/Q/C/Z ve her birinin paramsStart/paramsCount aralığıyla tanımlanır; sayılar Float64 bölümünde. Glyph placement affine INSTANCE veya META referansıyla kaynak text provenance'a bağlıdır. Source strings yalnız id/handle/path içindir; SOURCE_STRINGS table'ın büyümesi decoded bütçesine dahildir. Referansları döngüsüz, finite, range-safe ve index<vertexCount olarak doğrula. Boyuta sığmayan tek geometri parametre aralıklarıyla birden fazla chunk'a bölünür; source entity kimliği ve phase kopmaz.

Binary encoder/reader'ın aynı yanlış layout'ta anlaşması yeterli değildir. G03 elle hesaplanmış 32 byte header, iki section, bilinen little-endian Float64, broken overlap/unknown/reserved, sıfır uzunluk ve int taşması fixture'ları kullanır. Renderer shader input'ları public buffer sözleşmesinden adapter ile üretilir; yeni tag/ABI gerektiren bir boşluk CR'dir.

## İzleyici lease'i ve idempotence

POST /view-sessions/[viewSessionId]/heartbeat → 200 {viewSessionId,expiresAt,serverTime}; sahiplik ve admin/public dosya izni her seferinde doğrulanır. Body boş strict object. Client aktifken 30 s heartbeat, hidden olduğunda 60 s hedef; browser timer durabilir. Server TTL son başarılı heartbeat'ten **180 s**. DELETE anında detached. Heartbeat job compiler lease'i değildir.

Prepare isteğinde clientRequestId UUID zorunlu alan olur. Aynı auth scope + file/revision + clientRequestId retry'da aynı viewSession döner; yeni bağlantı yeni ID alır. Request ID yetki yerine geçmez. expectedSourceVersionKey null mevcut yetkili sürümü çözme anlamını korur.

Supervisor 15 s sweep'te süresi dolmuş view session'ları etkin sayımdan çıkarır. Son observer yoksa 30 s grace; sonra job hâlâ unobserved ise transaction içinde fence artırıp cancel işaretler, child process'i sonlandırır. Grace sırasında yeni observer geldiyse cancel olmaz. Release/publish da aynı fence/source kontrolüne tabidir. Hazır immutable scene izleyici gidince silinmez; mevcut türev retention/orphan politikası ayrıdır.

Background sekme 180 s sonra lease kaybetmiş olabilir. Visible dönüşte heartbeat 410 VIEW_SESSION_EXPIRED ise aynı mevcut source revision için **yeni clientRequestId ile prepare**; source yeniden decode varsayımı yok, hazır artifact kullanılır. Eski generation mesajları atılır. Revoke/expiry 401/403 ise yeniden prepare döngüsü yok; kullanıcıya yetki hatası. API45s request timeout job300s outer timeout'tan ayrıdır; bütün viewer'a toplam45s timer uygulanmaz.

## C01–C12 kabul

| ID | Kanıt |
|---|---|
| C01 | Root ve metadata/index sayfaları ≤1 MiB; kayıp/döngülü/yanlış scene referansı ret |
| C02 | Layer/style/viewport/bounds ilişkisi, görünür fit ve frozen semantiği |
| C03 | Resource parçaları aynı yetkili chunk yolu; her parça ≤2 MiB |
| C04 | Hash/length/encoding/decoded limit; bozuk PNG/JPEG/geometry allocation öncesi sınır |
| C05 | Header/table bağımsız byte oracle, little-endian ve reserved/overlap ret |
| C06 | Curve/glyph/instance/range/phase/provenance decode ve shader eşlemesi |
| C07 | clientRequestId retry aynı viewSession; farklı tenant paylaşım yok |
| C08 | Sekme DELETE olmadan kapanır; TTL/grace/sweep ortak işi doğru temizler |
| C09 | Son izleyici cancel ile yeni izleyici/publish yarışı; fence ihlali yok |
| C10 | Background→expired→resume hazır scene; revoke sonrasında yeniden erişim yok |
| C11 | renderAbi/compiler/schema mismatch cache ret; eski chunk sessiz kabul değil |
| C12 | Görünür tüm metadata/resources/geometry doğrulanmadan full-ready değil |

Tamamlanan C satırları ilgili R17–R21/R24/R26/R27'yi destekler; ayrı test edilmemiş koşullar NOT_RUN kalır.

## U3 — Tek dosyada resources anlamı

32 U3 dış dependency yükleme/eşleme akışının yerine geçer. resources tablosu dosyada mevcut gömülü/bound içerik, platform fontları ve missing/unsupported dış referans kayıtları içindir. XREF partChunkIds yalnız gerçekten sağlanmış/bound içerikte doludur. Dış referans adı var diye başka kullanıcı/tenant dosyası aranmaz. Font substitute için source requested font ile kullanılan actual resource kimliği ayrı, qualityStatus degraded olur. Exact olmayan alias hiçbir zaman exact manifest üretmez. API/binary sürüm/tag listesi değişmez.

## F07 — Statik HATCH fill boundary hata metrikleri (2026-09-24)

Statik HATCH fill triangle primitive'leri, kaynak sınır eğrilerinin tessellation sagitta maksimumunu chunk başına world-space ölçü olarak taşır. Complete active-view profile varsa CSS-pixel karşılığı hesaplanır; hata hedefi aşınca scene kalite durumu `degraded` olur ve `HATCH_FILL_BOUNDARY_TESSELLATION_LIMIT_REACHED` tanısı eklenir. Flat manifest ve hash'li index page aynı metrikleri sunar; validator eski manifestlerde alanın yokluğuna izin verir, mevcut değerleri finite/non-negative ve birbirleriyle tutarlı doğrular. `DV2SCN01` binary layout/schema v1 değişmez; yeni compile/cache çıktısı için compiler revision v17→v18 artırılır.

Bu sözleşme statik kaynak-boundary tessellation sapmasını kapsar; HATCH runtime re-triangulation, fill topology, triangle Float32 nicemleme ile bileşik hata, glyph ve chunk partition boundary muhasebesi için kabul yerine geçmez. Kanıt: `motor_v2/evidence/fidelity-v3/F07/PRECISION_REFINEMENT_ACCEPTANCE.md`.

## F07 — Statik HATCH sınır + triangle encoding birleşik hatası (2026-09-24)

Her statik HATCH fill triangle primitive'i için derleyici boundary tessellation world error'u ve yalnız o fill'e ait emitted Float32 triangle vertex round-trip hatasını toplar. Bu iki terimin per-fill toplamı chunk başına max world/CSS metric ve `HATCH_FILL_ENCODED_PRECISION_LIMIT_REACHED` degraded quality tanısı olarak taşınır; boundary-only diagnostic ayrı kalır. Flat manifest ile index-page kaydı validator'da karşılaştırılır ve yeni alanlar legacy manifestte optional'dır. `DV2SCN01`/schema v1 değişmeden compiler revision v18→v19 güncellenmiştir.

Bu composite bound earcut/topology sapması, runtime HATCH remesh, genel fill semantiği, glyph, diğer triangle/chunk/GPU/output error terimleri veya AutoCAD parity'si değildir. Kanıt ve test kapsamı `motor_v2/evidence/fidelity-v3/F07/PRECISION_REFINEMENT_ACCEPTANCE.md` içindedir.

## F07 — Doğrudan CIRCLE/ARC chord sagitta ölçümü (2026-09-24)

Top-level CIRCLE/ARC stroke tessellator'larının emitted chord'lar için hesapladığı maksimum sagitta chunk bazında `maxCircularCurveTessellationErrorWorld` alanında taşınır; eksiksiz active-view error profile varsa CSS karşılığı da yazılır. Alan flat manifest ve hash'li index sayfasında aynı olmalı; validator eski kayıtlarda alanın bulunmamasını kabul eder, yeni değerleri finite/non-negative ve tutarlı doğrular. Screen target aşımında `CIRCULAR_CURVE_TESSELLATION_LIMIT_REACHED` quality diagnostic üretilir. Cache-visible compile/quality değişikliği compiler revision v19→v20 gerektirir; `DV2SCN01` wire layout/schema v1 değişmez.

Bu kabul yalnız doğrudan top-level CIRCLE/ARC statik stroke kirişlerini kapsar; ellipse/spline/bulge, nested source, runtime replacement, GPU/output, fill topology, glyph, spatial partition veya AutoCAD aynı-kaynak parity kabulü değildir. Kanıt ve ölçüm oracle'ı `motor_v2/evidence/fidelity-v3/F07/PRECISION_REFINEMENT_ACCEPTANCE.md` içindedir.

## F07 — Direct ELLIPSE chord tessellation ölçümü (2026-09-24)

Doğrudan top-level ELLIPSE stroke tessellation'ının bounded `maxSagittaWorld` değeri chunk başına `maxEllipseCurveTessellationErrorWorld` alanında taşınır; complete active-view profile varsa CSS karşılığı hesaplanır. Flat manifest ile hash-index sayfası aynı değeri taşır. Validator bu alanı eski manifestler için optional tutar ve gelen değerleri finite/non-negative ve flat/index açısından tutarlı doğrular. Screen target aşımında `ELLIPSE_CURVE_TESSELLATION_LIMIT_REACHED` kalite tanısı eklenir. Compiler/cache semantiği v20→v21 ilerler; `DV2SCN01` schema v1 değişmez.

Kabul yalnız direct top-level ELLIPSE statik çizgi kirişidir; nested/transformed ellipse, spline/bulge, HATCH runtime fill, glyph, GPU/output veya AutoCAD parity kabulü değildir. Kanıt `motor_v2/evidence/fidelity-v3/F07/PRECISION_REFINEMENT_ACCEPTANCE.md` içindedir.

## F07 — Direct non-periodic SPLINE chord tessellation ölçümü (2026-09-24)

Doğrudan top-level, non-periodic standalone SPLINE için bounded rational tessellator'ın `maxSagittaWorld` değeri chunk başına `maxSplineCurveTessellationErrorWorld` olarak flat manifest ve hash-index sayfasına taşınır; tam active-view profiliyle CSS pixel karşılığı hesaplanır. Validator alanları legacy manifestler için optional tutar ve finite/non-negative değer ile flat/index eşitliğini doğrular. Screen target aşımı `SPLINE_CURVE_TESSELLATION_LIMIT_REACHED` tanısını ve `degraded` kalite durumunu üretir. Compiler/cache çıktısı değişikliği revision v21→v22 gerektirdi; `DV2SCN01` wire layout/schema v1 değişmedi.

Bu checkpoint periodic AutoCAD SPLINE desteği, nested spline kiriş metrikleri, spline knot/multiplicity genel kabulü, runtime refinement sonrası rendered hata, AutoCAD aynı-kaynak görsel/ölçü oracle'ı veya F07 paket kabulü değildir. Kanıt `motor_v2/evidence/fidelity-v3/F07/PRECISION_REFINEMENT_ACCEPTANCE.md` içindedir.

## F07 — Nested/transformed SPLINE tessellation bound muhasebesi (2026-09-24)

Nested INSERT visitor, spline tessellator'ın local `maxSagittaWorld` bound'unu kümülatif INSERT matrisinin en büyük singular değeriyle world-space'e taşır; paper viewport projeksiyonunda viewport singular değeri de eklenir. Bu alan chunk'ın önceki SPLINE world/CSS hata ölçümüne katılır. INSERT XCLIP ile kesilmiş chord fragment'lerinde source bağı koparıldığı için spline bound alanı taşınmaz. Flat manifest ve hash-index validator sözleşmesi aynıdır; compiler/cache revision v22→v23 ilerler, `DV2SCN01`/schema v1 değişmez.

Kanıt iki INSERT seviyesinde bileşik 8× non-uniform scale, CSS dönüşümü, düşük segment cap ve XCLIP'li görünen chord fragment'leriyle alınır. Bu yalnız non-periodic spline tessellation bound muhasebesidir; periodic AutoCAD profili, spline genel multiplicity oracle'ı, runtime-refined rendered error ve same-source AutoCAD parity kabulü değildir.

## F07 — Nested/transformed LWPOLYLINE BULGE statik chord bound'u (2026-09-24)

`GeometryCompiler.expandLwPolyline` her emitted BULGE chord'una local circular sagitta bound'u ekler. `EntityVisitor` bu değeri yalnız continuous, widthless LWPOLYLINE centerline stroke'larında birleşik nested INSERT dönüşümünün en büyük singular değeriyle world-space'e yükseltir. Paper viewport projeksiyonu ek ölçeği scene compiler'da uygular. XCLIP'in segment kırpma yolunda kaynak bound'u aktarılmaz.

Scene chunk ve index metadatası `maxBulgeCurveTessellationErrorWorld` ile complete active-view profile olduğunda CSS pixel karşılığını taşır. Validator alanı legacy manifestler için optional tutar; finite/non-negative ve flat/index eşitliğini doğrular. Screen target aşımı `BULGE_CURVE_TESSELLATION_LIMIT_REACHED` ile kaliteyi `degraded` yapar. Bağımsız `bulge=1`, `R=20` yarım daire fixture'ı chord sayısından exact circle sagitta formülüyle world/CSS metriğini hesaplar; iki seviyeli 2×3 ve mirrored 4×1 nested dönüşüm, outer rotation, 20.001 yoğun örnek, iki-chord cap overrun, XCLIP ve validator negative/conflict durumları sınanır.

Compiler/cache revision v23→v24 ilerledi; `DV2SCN01` wire layout/schema v1 değişmedi. Targeted `chunk-error-accounting.test.ts`, `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (Chromium 2/2), production runtime typecheck ve `git diff --check` PASS.

Kapsam static fallback centerline chord sapmasıdır; dashed veya width'li polyline, HATCH fill/runtime remesh-topology, runtime-refined rendered error, glyph, chunk boundary bileşik hata, periodic spline/knot multiplicity, bounded spatial partition/on-demand loading ve same-source AutoCAD pixel/measurement oracle'ı değildir. F07 **IN_PROGRESS**; toplam plan **14/19 (%74)**, **5 paket (%26)** açık.

### F07 — uygulanmış runtime refinement buffer'ı CSS-space ölçümü

`applyCurveRefinementsToChunk`, worker'ın başarılı diye işaretlediği aralıkları renderer XY buffer'ına eklemeden önce positive finite requested budget, finite/non-negative conservative error metriği, hedef bütçeye uyum ve finite Float32 koordinatları doğrular. Bağımsız test, 1e9 world origin'de derlenen CIRCLE'ı worker refinement ve gerçek apply hattından geçirir; renderer'ın tükettiği endpoint-pair buffer'ını chunk-origin/camera-center offset ve CSS scale ile 20.001 exact-source örneğine karşı ölçer. Uygulanmış geometrik buffer sapması 0.25 CSS px altındadır ve conservative worker metriği oracle ölçümünü kapsar. Bozuk bound ve NaN koordinatlar uygulanmaz.

Doğrulama: `npx tsx tests/cad-v2/curve-refinement.test.ts`, `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (Chromium **2/2**), `npx tsc --noEmit -p tsconfig.next.json --incremental false`, `git diff --check` — **PASS**. Bu raster WebGL/device-pixel hatası veya AutoCAD same-source görsel/ölçü paritesi değildir; bu kapılar, periodic spline/knot multiplicity, HATCH runtime remesh/topology, spatial partition/on-demand chunk fetch ve glyph/chunk-boundary kalan hata muhasebesi açıktır. Apply değişikliği compiler/cache kimliğini etkilemez; revision v24/schema v1 sabit. F07 **IN_PROGRESS**; toplam plan **14/19 (%74)**, **5 paket (%26)** açık.

Nested affine follow-up olarak `testNestedInsertCircleAndArcCarryTransformedSidecars`, iki seviyeli INSERT zincirindeki 10 CIRCLE/ARC/ELLIPSE/BULGE span'inin uygulama sonrası renderer XY endpoint-pair buffer'ını ölçer. Yeniden indekslenen her span, worker'ın Float32 nokta listesiyle birebirdir; analytic sidecar source'a göre 20.001 örnekli sapma ≤0.2 CSS px'tir ve conservative worker metriği ölçümü kapsar. Mirrored/non-uniform INSERT dönüşümleri fixture'a dahildir. Targeted curve-refinement, tam unit, UI/Chromium 2/2, runtime typecheck ve diff-check PASS. Bu sonuç nested rational SPLINE/HATCH'i, gerçek WebGL raster/device-pixel çıktısını veya AutoCAD aynı-kaynak oracle'ını kapsamaz; diğer açık F07 kapıları devam eder. Plan **14/19 (%74)**, **5 paket (%26)** açık.

Rational SPLINE follow-up, direct ve nested non-periodic quadratic kaynaklardaki 6 knot-span'i gerçek apply sonrası renderer XY buffer'ından ölçer. Vertex reindex'iyle çıkarılan her endpoint-pair dizisi worker Float32 output'u ile eşleşir; 20.001 örnekli rational Bezier oracle'ı her span için ≤0.2001 CSS px ve conservative metriğin ölçümü kapsadığını doğrular. Test fixture'ında mirrored/non-uniform nested INSERT vardır. Targeted curve-refinement, tam unit, UI/Chromium 2/2, runtime typecheck ve diff-check PASS. Bu, periodic spline AutoCAD/knot multiplicity, HATCH runtime remesh/topology, WebGL raster/device-pixel veya same-source AutoCAD kabulü değildir. Compiler/cache değişmedi, revision v24/schema v1; F07 **IN_PROGRESS**, toplam plan **14/19 (%74)**.


### F07 — HATCH boundary ARC/BULGE/ELLIPSE post-apply buffer oracle'ı (2026-09-24)

testHatchArcBulgeAndEllipseSidecarsIncludingNestedInsert, direct HATCH BULGE/ARC/ELLIPSE ile mirrored/non-uniform nested INSERT içindeki ARC/ELLIPSE olmak üzere 5 boundary source span'ini worker refinement ve applyCurveRefinementsToChunk sonrasındaki renderer XY endpoint-pair buffer'ından ölçer. Reindex edilmiş span noktaları worker Float32 output'u ile birebir; her span için 20.001 örnekli affine sidecar oracle'ı ≤0.2001 CSS px sapma ölçer ve conservativeErrorCssPixels değeri bu ölçümü kapsar. HATCH fill TRIANGLES fallback'inin varlığı korunur.

Doğrulama: targeted npx tsx tests/cad-v2/curve-refinement.test.ts, tam npm run check:cad-v2:unit, npm run check:cad-v2:ui (Chromium **2/2**), npx tsc --noEmit -p tsconfig.next.json --incremental false, git diff --check — **PASS**. Bu boundary-line buffer ölçümüdür; HATCH fill runtime remesh/topology/Triangle hata muhasebesi değildir. HATCH SPLINE post-apply, periodic SPLINE AutoCAD fixture/knot multiplicity, bounded spatial partition/on-demand loading, fill/glyph/chunk-boundary ve kalan bileşik hata muhasebesi, WebGL raster/device-pixel ve same-source AutoCAD oracle'ı açık kalır. Compiler/cache revision v24, schema v1; F07 **IN_PROGRESS**, plan **14/19 (%74)**, **5 paket (%26)** açık.


### F07 — HATCH rational SPLINE post-apply buffer oracle'ı (2026-09-24)

İki direct ve aynı mirrored/non-uniform nested INSERT altındaki iki HATCH SPLINE knot-span, gerçek worker refinement ve apply adımı sonrası renderer XY endpoint-pair buffer'ından çıkarılır. Önceki başarılı span'lerin vertex delta'ları uygulanınca buffer dilimleri yeniden indekslenir; Float32 noktaları worker koordinatlarıyla birebir, 20.001 örnekli rational Bezier oracle'ı span başına ≤0.2001 CSS px ve worker conservative metriğinin ölçümü kapsadığını doğrular. Mevcut XCLIP fail-closed ve capped tessellation sidecar ret testleri korunur.

Doğrulama: targeted npx tsx tests/cad-v2/curve-refinement.test.ts, tam npm run check:cad-v2:unit, npm run check:cad-v2:ui (Chromium **2/2**), npx tsc --noEmit -p tsconfig.next.json --incremental false ve git diff --check — **PASS**. Bu HATCH boundary line geometry'sidir; fill runtime remesh/topology hata hesabı değildir. Periodic SPLINE AutoCAD fixture/knot multiplicity, bounded spatial partition/on-demand loading, fill/glyph/chunk-boundary kalan bileşik hata hesabı, PATH_DISTANCE rendered dash, WebGL raster/device-pixel ve same-source AutoCAD oracle'ı açık kalır. Compiler/cache v24, schema v1 sabit; F07 **IN_PROGRESS**, **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — curved-line chord + Float32 endpoint bileşik hata metriği

- Scene compiler aynı emitted curved line primitive'i için statik kaynak chord sagitta bound'unu ve bu primitive'in iki chunk-local Float32 XY endpoint round-trip hatasından büyüğünü toplar; chunk maksimumu `maxCurveEncodedGeometryErrorWorld` ve complete active-view CSS değeri olarak flat manifest/hash-index metadata'sına yazılır. Legacy manifest uyumu için validator alanları optional tutar, present değerlerde finite/non-negative ve flat/index eşitliğini doğrular. Target aşımı `CURVE_ENCODED_PRECISION_LIMIT_REACHED` diagnostic'iyle kaliteyi `degraded` yapar.
- Büyük koordinatlı independent CIRCLE oracle'ı (`1e9` origin, `1e8` radius), emitted segment count'undan analitik `R(1-cos(π/n))` sagitta'yı ve serialized XY + ORIGIN üzerinden geri ölçülen endpoint error'u bir araya getirir. İki terim ayrı ayrı screen budget içinde kalır; aynı chord'da toplam budget'ı aşar. Flat manifest/hash-index/validator aktarımı, kalite tanısı, negatif metric ve flat/index conflict reddi doğrulanır. Mevcut direct CIRCLE/ARC, ELLIPSE, SPLINE ve nested BULGE accounting testleri artık toplam profile göre kalite kararını da sınar.
- Compiler/cache revision v24→v25; `DV2SCN01` binary section layout ve schema v1 değişmedi. UI build'i scene-worker hash'ini değiştirmedi.
- `npx tsx tests/cad-v2/chunk-error-accounting.test.ts`, `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (Chromium 2/2), runtime `tsconfig.next.json` typecheck ve `git diff --check` — PASS.
- Kapsam static curved-line fallback primitive'idir. HATCH fill triangles/remesh-topology, glyph, farklı primitive/chunk birleşimleri ve sınır etkileri, PATH_DISTANCE rendered dash, runtime WebGL raster/device-pixel hata ölçümü ve same-source AutoCAD image/measurement oracle'ı açık kalır. F07 IN_PROGRESS; toplam plan 14/19 (%74), 5 paket (%26) açık.

## 2026-09-24 ek checkpoint — HATCH boundary line chord + endpoint composite

- `GeometryCompiler.triangulateHatch`, ARC/BULGE/ELLIPSE/SPLINE tessellation'ından gelen konservatif per-chord kaynak sapma bound'unu boundary line primitive'ine taşır. `EntityVisitor` bound'u tam INSERT matrisinin en büyük singular değeriyle dönüştürür; scene compiler paper viewport scale'ini bir kez ekler ve aynı line'ın chunk-local Float32 XY endpoint round-trip hatasıyla composite eder. XCLIP route'u clipped line'a kaynak bound kopyalamaz.
- Direct büyük koordinatlı semicircle HATCH oracle'ı `R(1-cos(π/(2n)))` analitik sagitta'yı ve emitted XY + ORIGIN endpoint hatasını ölçer: ayrı ayrı hedef içinde, same-line toplamı 0.25 CSS px hedefinin üzerindedir. İki seviyeli mirrored/rotated 8× INSERT testi transformed source oracle'ını doğrular; paper viewport fixture'ı viewport ölçeğinin tek kez uygulandığını ölçer; düz kapanış çizgisi eğri bound'u almaz; XCLIP-visible geometry source bound'suz kalır.
- Compiler/cache revision v25→v26; `DV2SCN01` section layout ve schema v1 değişmedi. Targeted `npx tsx tests/cad-v2/chunk-error-accounting.test.ts`, `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (Chromium **2/2**), `npx tsc --noEmit -p tsconfig.next.json --incremental false` ve `git diff --check` — **PASS**. UI worker build'inde `public/cad-v2/cad-v2-scene-worker.js` SHA-256 öncesi/sonrası aynı kaldı (`1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280`).
- Bu static boundary-line kabulü HATCH fill TRIANGLES quantization'ını genişletmez ve runtime fill remesh/topology sağlamaz. Periodic SPLINE AutoCAD fixture/knot multiplicity, bounded spatial partition/on-demand chunk fetch, kalan glyph/chunk-boundary/farklı primitive composite, PATH_DISTANCE rendered dash, WebGL raster/device-pixel ve same-source AutoCAD görsel/ölçü oracle'ı açık kalır. F07 **IN_PROGRESS**; plan **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — non-periodic rational SPLINE knot multiplicity oracle'ı

- `testSplineInternalKnotMultiplicityAgainstIndependentDeBoorOracle`, iç knot çoklukları 1, 2 ve 3 (simple, double, degree multiplicity) olan üç sentetik, pozitif ağırlıklı rational degree-3 non-periodic knot vektörünü sınar. Bağımsız homojen De Boor evaluator'ı profil başına 20.001 kaynak örneği üretir; emitted polyline sapması 0.03 world unit ve raporlanan konservatif `maxSagittaWorld` içinde kalır, her farklı iç knot noktası çıktıda korunur.
- Hedefli `npx tsx tests/cad-v2/precision-refinement.test.ts`, tam `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (Chromium **2/2**), runtime `npx tsc --noEmit -p tsconfig.next.json --incremental false` ve `git diff --check` — **PASS**. Önceki Playwright raporları korundu; UI testi sonrası iki worker bundle önceki hash'leriyle doğrulanıp korundu.
- Bu test-only checkpoint compiler/cache kimliğini değiştirmez: revision **v26**, `DV2SCN01` schema **v1**. Yalnız bu sentetik non-periodic degree-3 profilleri kanıtlandı; diğer degree/profiller, periodic SPLINE AutoCAD fixture/desteği ve evaluator paritesi açık. HATCH runtime fill remesh/topology, bounded spatial partition/on-demand fetch, kalan fill/glyph/chunk-boundary/composite muhasebesi, visible dash, WebGL raster/device-pixel ve same-source AutoCAD görsel/ölçü kapıları da açık. F07 **IN_PROGRESS**; plan **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — degree-2 rational SPLINE knot profilleri

- Bağımsız homogeneous De Boor oracle'ına iki degree-2 pozitif ağırlıklı rational SPLINE profili eklendi: simple knot çokluğu 1 ve degree-multiplicity knot çokluğu 2. Önceki üç degree-3 profille birlikte toplam beş profil 20.001 örnek/profil, yani 100.005 source örneğiyle sınanır; sapma ≤0.03 world unit ve `maxSagittaWorld`, ayrıca farklı iç knot noktaları output polyline'ında korunur.
- Hedefli precision testi, tam CAD V2 unit, UI/Chromium **2/2**, runtime typecheck ve `git diff --check` — **PASS**. UI testinden sonra worker dosyaları önceki hash'leriyle doğrulanıp korundu; mevcut Playwright raporları geri yüklendi.
- Yalnız test kapsamı genişledi; compiler/cache revision **v26** ve `DV2SCN01` schema **v1** sabit. Diğer degree/knot profilleri ve AutoCAD evaluator kıyası, periodic SPLINE fixture/desteği, HATCH runtime fill remesh/topology, bounded spatial partition/on-demand loading, fill/glyph/chunk-boundary bileşik hata, visible dash, WebGL raster/device-pixel ve same-source AutoCAD oracle'ı açık kalır. F07 **IN_PROGRESS**; plan **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — degree-4 rational SPLINE knot profilleri

- Bağımsız homojen De Boor evaluator'ı degree-4 non-periodic rational SPLINE için iç knot çoklukları 1/2/3/4 (simple/double/triple/degree multiplicity) olan dört pozitif ağırlıklı profili kapsar. Degree-2 profilleri 1/2 ve degree-3 profilleri 1/2/3 ile toplam 9 sentetik profil, 20.001 örnek/profil ve 180.009 kaynak örneği ölçülür. Her emitted polyline sapması ≤0.03 world unit ve `maxSagittaWorld` sınırındadır; farklı iç knot noktaları output'ta korunur.
- Hedefli precision testi, `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (Chromium **2/2**), runtime `npx tsc --noEmit -p tsconfig.next.json --incremental false` ve `git diff --check` — **PASS**. UI run sırasında worker artifact'ları ve mevcut Playwright raporları korundu.
- Yalnız test kapsamı genişledi; compiler/cache revision **v26**, `DV2SCN01` schema **v1** sabit. Degree/knot profillerinin geri kalanı, periodic SPLINE AutoCAD fixture/desteği ve evaluator kıyası, HATCH runtime fill remesh/topology, bounded spatial partition/on-demand chunk yükleme, fill/glyph/chunk-boundary ve kalan bileşik hata muhasebesi, visible PATH_DISTANCE dash, WebGL raster/device-pixel ve same-source AutoCAD visual/measurement oracle'ı açık kalır. F07 **IN_PROGRESS**; toplam plan **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — degree-5 rational SPLINE knot profilleri

- Bağımsız homojen De Boor oracle'ı beş pozitif ağırlıklı non-periodic rational degree-5 profille genişletildi: iç knot çoklukları 1, 2, 3, 4 ve 5. Degree-2/3/4 profilleriyle toplam 14 profil ve profil başına 20.001 olmak üzere 280.014 kaynak örneği denetlendi. Her profilin kaynak-polyline sapması ≤0.03 world unit ve `maxSagittaWorld`; her distinct iç knot noktası output'ta tutulur.
- Hedefli precision testi, `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (Chromium **2/2**), runtime `npx tsc --noEmit -p tsconfig.next.json --incremental false` ve `git diff --check` — **PASS**. Worker artifact hash'leri değişmedi; Playwright raporu benzersiz output dizinine alındı.
- Yalnız test kapsamı genişledi; compiler/cache revision **v26**, `DV2SCN01` schema **v1** sabit. Diğer degree/knot profilleri, periodic SPLINE AutoCAD fixture/desteği/evaluator kıyası, HATCH runtime fill remesh/topology, bounded spatial partition/on-demand loading, fill/glyph/chunk-boundary ve kalan composite accounting, visible PATH_DISTANCE dash, WebGL raster/device-pixel ve same-source AutoCAD visual/measurement oracle'ı açık kalır. F07 **IN_PROGRESS**; plan **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — nested BULGE same-chord encoding bileşiği

- `testNestedBulgeTessellationErrorIncludesInsertTransforms`, iki seviyeli mirrored/non-uniform INSERT altındaki continuous widthless LWPOLYLINE BULGE için her emitted chord'un independent analytic source endpoint'lerini binary Float32 XY + Float64 ORIGIN'den açılan endpoint'lerle karşılaştırır. Aynı chord'un 8× affine source sagitta bound'u ve en kötü endpoint round-trip error'u toplanır; per-chord maksimum manifest world/CSS composite alanlarıyla eşitlenir.
- 20.001 örnekli transformed arc oracle'ı, transform singular value, cap/degraded tanısı, XCLIP source bound omission ve index/manifest validation kontrolleri korunur. Targeted chunk-error accounting, tam CAD V2 unit, UI/Chromium **2/2**, runtime typecheck ve `git diff --check` — **PASS**.
- Test-only kabul; compiler/cache revision **v26**, `DV2SCN01` schema **v1** değişmedi. Bu tek static nested BULGE familyasının same-chord composite ölçümüdür. Diğer source/chunk, HATCH fill/glyph/boundary, runtime/GPU rendered error, periodic/AutoCAD SPLINE ve same-source AutoCAD oracle'ları açık kalır. F07 **IN_PROGRESS**; toplam plan **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — nested SPLINE same-chord encoding bileşiği

- İki seviyeli 8× non-uniform INSERT altındaki clamped cubic SPLINE, adaptive parametre aralıklarında bağımsız Bernstein source endpoint'leri ve türevden türetilen cubic subcurve control-hull chord-deviation bound'u ile sınanır. Control-hull sagitta birleşik INSERT singular value'siyle yükseltilir; her chord'un Float32 XY + Float64 ORIGIN endpoint round-trip kaybı aynı sagitta bound'una eklenir. En büyük toplam manifest `maxCurveEncodedGeometryErrorWorld/CssPixels` alanlarıyla karşılaştırılır.
- Targeted `npx tsx tests/cad-v2/chunk-error-accounting.test.ts`, tam `npm run check:cad-v2:unit`, UI/Chromium **2/2**, runtime `npx tsc --noEmit -p tsconfig.next.json --incremental false` ve `git diff --check` — **PASS**. Mevcut cap/degraded, flat/index, validator ve XCLIP fail-closed kontrolleri korunur.
- Bu sentetik non-periodic cubic static composite ölçümüdür; diğer spline knot/degree/periodic profilleri, residual cross-source/chunk, HATCH fill/glyph/boundary, runtime/WebGL rendered error ve same-source AutoCAD görsel/ölçü oracle'ı açık. Yalnız test değişti; compiler/cache v26, `DV2SCN01` schema v1 sabit. F07 **IN_PROGRESS**; toplam plan **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — nested ELLIPSE same-chord encoding bileşiği

- `testNestedEllipseTessellationErrorIncludesInsertTransforms` bağımsız analitik ellipse interval/endpoints oracle'ını iki seviyeli non-uniform INSERT dönüşümüne uygular; bileşik en büyük singular value 8×'tir. Her emitted chord için source sagitta bound'u ve serialized Float32 XY + Float64 ORIGIN endpoint round-trip kaybı aynı-chord toplamı olarak ölçülür; manifest/hash-index world/CSS alanı ve budget overrun diagnostic/degraded sonucu doğrulanır.
- Paper viewport 0.15 ölçeği bir kez uygulanır; partial XCLIP sonrası görünür geometri korunur fakat tam-ellipse kaynak bound'u aktarılmaz. Hedefli chunk-error accounting, tam CAD V2 unit, UI/Chromium **2/2**, runtime `tsconfig.next.json` typecheck ve `git diff --check` **PASS**. Her iki worker bundle da önceki hash'leriyle aynı kaldı.
- Nested visitor/manifest quality metadata'sı değiştiği için compiler/cache revision **v26→v27** yükseltildi; `DV2SCN01` schema **v1** sabit. Bu yalnız test edilen nested ELLIPSE profile'ının static same-chord fallback composite kabulüdür; diğer ellipse profilleri, cross-source/chunk/fill/glyph/chunk-boundary composite'leri, periodic SPLINE AutoCAD fixture/knot multiplicity, HATCH runtime fill remesh/topology, camera-driven on-demand loading, visible dash, rendered WebGL/device-pixel ve same-source AutoCAD visual/measurement kapıları açık kalır. F07 **IN_PROGRESS**; plan **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — direct ELLIPSE same-chord encoding bileşiği

- `testEllipseCurveTessellationErrorIsMeasuredAndBudgeted` independently derives the uniform ellipse segment count and conservative major-axis second-derivative chord bound, then evaluates exact source endpoints and measures each matching serialized Float32 XY + Float64 ORIGIN pair. The maximum same-chord sagitta-plus-endpoint-loss value matches flat and indexed world/CSS composite metadata.
- An epsilon-tight target keeps tessellation and endpoint encoding individually within budget while their per-chord sum exceeds it; the test asserts the degraded diagnostic, hash-index/manifest values, and existing one-segment cap behavior. Targeted test, full CAD V2 unit, UI/Chromium **2/2**, runtime typecheck, and diff-check pass. Both worker bundle hashes remained unchanged and Playwright artifacts used new isolated directories.
- This is test-only direct top-level ELLIPSE static fallback coverage. Nested ELLIPSE and residual cross-source/chunk/fill/glyph/boundary composite, periodic/AutoCAD SPLINE, HATCH runtime fill remesh/topology, bounded spatial partition/on-demand loading, visible dash, runtime-refined rendered WebGL/device-pixel error, and same-source AutoCAD image/measurement remain open. Compiler/cache **v26**, `DV2SCN01` schema **v1** unchanged; F07 **IN_PROGRESS**, plan **14/19 (74%)**, **5/19 (26%)** open.

- Doğrudan ELLIPSE checkpoint'indeki açık kapı kaynak taraması: periyodik SPLINE testte fail-closed ve AutoCAD periodic evaluator fixture'ı yok; HATCH runtime kabulü yalnız boundary output'larını kapsıyor, fill remesh/topology yok. Manifest bbox/culling/scheduler/cache primitive'leri mevcut olsa da `SpatialChunkScheduler` host'a entegre değil ve host initial load'da tüm chunk'ları indiriyor. Nested ELLIPSE visitor static sagitta aktarımı o anda eksikti; sonraki v27 checkpoint'i aşağıda seçili nested profili kapatır. Runtime-refined geometri için CPU/CSS projection testi bulunuyor; WebGL raster/device-pixel ve same-source AutoCAD visual/measurement oracle'ı yok. Bunlar **OPEN** kalır; doğrudan ELLIPSE static composite önceki checkpoint'te ölçüldü.

## 2026-09-24 ek checkpoint — TEXT glyph stroke endpoint nicemleme oracle'ı

- `testTextGlyphEndpointsContributeToEncodedQuantizationBudget` yüksek koordinatlı, döndürülmüş Türkçe TEXT'in tüm gerçek font-layout line stroke uçlarını serialized Float32 XY + Float64 ORIGIN endpoint'leriyle kıyaslar. Bağımsız bbox midpoint ve fround oracle'ı world-space maksimumla eşleşir; active-view CSS dönüşümü, flat/hash-index/validator aktarımı ve limit aşımında `CHUNK_QUANTIZATION_LIMIT_REACHED` / `degraded` doğrulanır.
- Targeted chunk-error accounting, tam CAD V2 unit, UI/Chromium **2/2**, runtime typecheck ve diff-check geçti; worker bundle hash'leri değişmedi. Yalnız encoding hata muhasebesi kanıtlandı; AutoCAD font kontur kıyası, MTEXT/dimension glyph, runtime glyph refinement ve chunk-boundary kompozisyonu açık.
- Test-only; compiler/cache **v27**, `DV2SCN01` schema **v1** değişmedi. F07 **IN_PROGRESS**; toplam plan **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — tek kaynak ARC'ın chunk seam hata zarfı

- testCurveEndpointRoundTripSeamIsBoundedAcrossChunks bir non-closed analitik ARC'ı bir chord / chunk olacak şekilde böler. Her chunk'ın decode edilmiş ORIGIN + Float32 XY uçları gerçek kaynak çember noktalarıyla kıyaslanır; uniform interval sagitta değeri R × (1 - cos(Δθ/2)) ile ayrıca hesaplanır. Her local composite manifest/hash-index alanlarıyla karşılaştırılır ve ortak kaynak tepesinde ölçülen decode seam boşluğunun iki uç nicemleme hatası toplamı ile komşu composite sınırları içinde kaldığı doğrulanır.
- Hedefli chunk-error accounting, npm run check:cad-v2:unit, UI/Chromium 2/2, runtime npx tsc --noEmit -p tsconfig.next.json --incremental false ve git diff --check — PASS. Worker bundle hash'leri önceki koruma kopyalarıyla aynı.
- Yalnız ardışık chord'ları ayrı chunk'larda bulunan tek circular ARC'ın test-only seam zarfıdır; genel chunk-boundary/cross-source join veya clip/fill/glyph bileşiği değildir. Compiler/cache v27, DV2SCN01 schema v1 sabit. F07 IN_PROGRESS; plan 14/19 (%74), 5 paket (%26) açık. Periodic SPLINE AutoCAD fixture/knot oracle'ı, HATCH fill runtime remesh/topology, host on-demand partition/loading, kalan composite'ler, visible PATH_DISTANCE dash, runtime rendered WebGL/device-pixel error ve same-source AutoCAD visual/measurement kabul kapıları açık.

## 2026-09-24 ek checkpoint — farklı LINE kaynaklarının chunk seam zarfı

- testCrossSourceLineSeamIsBoundedAcrossChunks iki ayrı handle/order taşıyan ve aynı kaynak vertex'inde tam birleşen LINE kaynağını maxPrimitivesPerChunk=1 ile ayrı chunk'lara düşürür. Her chunk'ın bbox midpoint ORIGIN'i ve Float32 endpoint offset'leri bağımsız yeniden hesaplanır; decode round-trip kayıpları ölçülür. Compiler generic world-space hata metriği ve active affine/CSS projeksiyonu bu oracle ile karşılaştırılır.
- Paylaşılan kaynak vertex'teki seam boşluğu sıfırdan büyüktür; iki ortak endpoint hatasının toplamını ve komşu chunk'ların generic nicemleme hata toplamını aşmaz. Hash-index alanı ve manifest validasyonu sınanır. Hedefli chunk-error accounting, npm run check:cad-v2:unit, UI/Chromium 2/2, runtime npx tsc --noEmit -p tsconfig.next.json --incremental false ve git diff --check — PASS. Worker hash'leri koruma kopyalarıyla aynı.
- Bu test-only dar kabul yalnız iki bağlı LINE'ın bir chunk sınırındaki ortak vertex'ini kapsar; genel cross-source, line-curve, clip/fill/glyph veya arbitrary chunk-boundary bileşikleri değildir. Compiler/cache v27 ve DV2SCN01 schema v1 sabit. F07 IN_PROGRESS; plan 14/19 (%74), 5 paket (%26) açık. Periodic SPLINE/AutoCAD-knot oracle'ı, HATCH fill runtime remesh/topology, host on-demand partition/loading, kalan fill/glyph/chunk muhasebesi, visible dash, rendered device-pixel error ve same-source AutoCAD visual/measurement kapıları açık.

## 2026-09-24 ek checkpoint — LINE→ARC chunk seam ve ilk chord composite oracle'ı

- testLineToArcSourceSeamIsBoundedAcrossChunks ayrı LINE ve ARC canonical kaynaklarının tek ortak vertex'te birleşmesini sınar. LINE ve her ARC chord'u ayrı chunk'a düşürülür; her iki chunk local midpoint ORIGIN'i ve Float32 endpoint offset'i bağımsız hesaplanır. İlk ARC chord endpoint'leri analitik çember parametrizasyonundan gelir.
- Ortak kaynak vertex'teki sıfırdan büyük decode gap'i iki endpoint round-trip hatasının toplamı ve komşu generic chunk quantization toplamıyla sınırlandırılır. İlk ARC chunk'ın analytic sagitta + encoded endpoint toplamı manifest ve hash-index world/CSS değerleriyle eşleşir. Hedefli accounting, npm run check:cad-v2:unit, UI/Chromium 2/2, runtime npx tsc --noEmit -p tsconfig.next.json --incremental false ve git diff --check — PASS. Worker bundle hash'leri koruma kopyalarıyla aynı.
- Bu dar test-only profil yalnız tek yönlü LINE→ARC ilk-chord seam'idir; ters yön, başka eğriler, clipping, fill/glyph ve genel cross-source/chunk composite kabulü değildir. Compiler/cache v27, DV2SCN01 schema v1 sabit. F07 IN_PROGRESS; plan 14/19 (%74), 5 paket (%26) açık. Periodic SPLINE AutoCAD/periodic knot oracle'ı, HATCH fill runtime remesh/topology, host on-demand partition/loading, kalan composite'ler, visible dash, rendered device-pixel ve same-source AutoCAD visual/measurement kapıları açık.


## 2026-09-24 ek checkpoint — önceden tessellate edilmiş dash için WebGL piksel oracle'ı

- tests/document-studio/cad-v2-layout-viewport.spec.ts içine Chromium görüntü oracle'ı eklendi. Synthetic DV2SCN01 chunk, XY bölümünde beş kırmızı dash segmenti ve aralarındaki dört boşluğu taşır; gerçek WebGL canvas screenshot'ı örneklenerek tam beş kırmızı piksel aralığı, dört sıfırdan büyük gap ve 8 px üstünde minimum gap doğrulanır.
- Fixture PATH_DISTANCE dizisini [0,24,40,64,80,104,120,144,160,184] olarak taşır. Renderer mevcut durumda LINE geometrisini XY bölümünden kurar ve PATH_DISTANCE tüketicisi yoktur. Bu nedenle doğrulama yalnız önceden üretilmiş dash/gap geometrisinin görünmesini kanıtlar; lane'in shader tarafından okunmasını, dash phase hesabını veya gerçek compiler→renderer dash akışını kanıtlamaz.
- Hedefli Chromium 1/1, npm run check:cad-v2:unit, tam npm run check:cad-v2:ui (Chromium 3/3), npx tsc --noEmit -p tsconfig.next.json --incremental false ve git diff --check — PASS. Worker bundle hash'leri koruma kopyalarıyla aynıdır. Test/doküman değişikliğidir; compiler/cache revision v27 ve DV2SCN01 schema v1 sabit.
- Açık kapılar: PATH_DISTANCE renderer/shader tüketimi; runtime-refined rendered WebGL/device-pixel hata ölçümü; periodic SPLINE AutoCAD fixture/desteği ve knot multiplicity oracle'ı; HATCH fill runtime remesh/topology; host'a bağlı bounded spatial partition ve on-demand chunk yükleme; kalan fill/glyph/chunk-boundary bileşik hata muhasebesi; same-source AutoCAD görsel/ölçü oracle'ı. F07 IN_PROGRESS; plan 14/19 (%74), 5 paket (%26) açık.

## 2026-09-24 ek checkpoint — compiler çıktısı DASHED çizgisinin WebGL görünürlüğü

- Test fixture child'ı canonical 184 birim LINE ve [24,-16] özel dash/gap pattern'ini compileCanonicalToScene ile gerçek DV2SCN01 manifest/chunk'a dönüştürür. Playwright fixture üretimini 15 saniye timeout ve 2 MiB stdout sınırıyla çağırır; compiler modülü Playwright discovery sürecine yüklenmez.
- Chromium gerçek compiler chunk'ını CAD V2 host'a verir. Wire PATH_DISTANCE değerleri [0,24,40,64,80,104,120,144,160,184] ile doğrulanır; WebGL canvas screenshot piksel oracle'ı tam 5 kırmızı dash aralığı ve 4 boşluk görür. Böylece görünür kesikli geometri artık elle üretilmiş XY değil, compiler tessellation çıktısıdır.
- Renderer hâlâ pre-tessellated XY line segment'leri çizer; PATH_DISTANCE'ı shader'da okumaz. Bu nedenle shader lane tüketimi, runtime refinement/chunk sınırında faz kararlılığı, rendered geometrik-error bound ve AutoCAD same-source visual/measurement kabulü açık kalır. Targeted Chromium 1/1, tam unit, tam UI/Chromium 3/3, runtime typecheck, diff-check — PASS. Worker hash'leri koruma kopyalarıyla aynı; test-only, compiler/cache v27 ve DV2SCN01 schema v1 sabit.
- Diğer açık F07 kapıları: periodic SPLINE AutoCAD fixture/desteği ve knot multiplicity oracle'ı; HATCH fill runtime remesh/topology; host'a entegre bounded spatial partition/on-demand chunk loading; kalan fill/glyph/chunk-boundary bileşik hata muhasebesi. F07 IN_PROGRESS; plan 14/19 (%74), 5 paket (%26) açık.


## 2026-09-24 — compiled DASHED chunk partition contract evidence

For one canonical 184-unit `[24,-16]` DASHED LINE, compilation emits the same five dash primitives and cumulative path-distance sequence when encoded as one Model chunk or five one-primitive chunks. Chromium loads the actual emitted manifests and binary chunks and verifies matching five-run/four-gap pixel masks and an identical full-canvas PNG hash under the same viewport. Targeted Chromium 1/1, full UI/Chromium 3/3, CAD V2 unit, runtime typecheck, and diff-check passed; worker bundles match the preserved hashes. The scope is pre-tessellated LINE geometry only. No contract is claimed for shader-side PATH_DISTANCE use, general linetype phase/refinement, device-pixel error, or AutoCAD parity. Test-only; compiler/cache v27 and DV2SCN01 schema v1 are unchanged.

F07 remains IN_PROGRESS: 14/19 plan packages (74%) are recorded complete and 5/19 (26%) remain open. The periodic SPLINE AutoCAD fixture/evaluator and remaining knot oracle, HATCH fill runtime remesh/topology, host-integrated bounded spatial/on-demand loading, residual fill/glyph/chunk-boundary composite accounting, PATH_DISTANCE shader consumption, rendered runtime-refinement pixel error, and same-source AutoCAD visual/measurement oracle remain open.


## 2026-09-24 — LINE to nested BULGE source seam contract evidence

A top-level LINE meets an LWPOLYLINE BULGE nested through two INSERTs with reflection, non-uniform scale, rotation, and large translation. One primitive per chunk forces the direct LINE endpoint and nested arc start through separate Float64 origins and Float32 offsets. The independent oracle checks the combined singular-value-scaled circular sagitta, every chord's endpoint encoding and world/CSS composite, the decoded seam envelope, and 20,001 exact transformed arc samples. Hash-index and manifest validator outputs retain the same per-chunk metrics. Targeted accounting, full CAD V2 unit, UI/Chromium 3/3, runtime typecheck, and diff-check passed; worker hashes match preserved copies. This covers only the tested forward LINE-to-nested-BULGE join. Test-only; compiler/cache v27 and DV2SCN01 schema v1 are unchanged.

F07 remains IN_PROGRESS: 14/19 plan packages (74%) are recorded complete and 5/19 (26%) remain open. Periodic SPLINE AutoCAD/evaluator and periodic knot parity, HATCH fill runtime remesh/topology, host-integrated bounded spatial/on-demand loading, residual fill/glyph/chunk-boundary composites, PATH_DISTANCE shader consumption, runtime-refined rendered WebGL/device-pixel error, and same-source AutoCAD visual/measurement remain open.

## 2026-09-24 — ARC→LINE kaynak sınırı hata zarfı

- testArcToLineSourceSeamIsBoundedAcrossChunks ARC'ın analitik son noktasını ayrı LINE kaynağının tam başlangıcı yapar; her kiriş ve LINE bağımsız chunk'tır. Her chunk ORIGIN midpoint'i ve Float32 XY endpoint'leri bağımsız yeniden hesaplanır. Son ARC chord'un daire sagitta'sı + aynı chord endpoint encoding kaybı, LINE encoding bound'u ve ortak endpoint seam gap'i world/CSS düzleminde ölçülür; hash-index/manifest aktarımı doğrulanır.
- Hedefli test, npm run check:cad-v2:unit, runtime typecheck, UI/Chromium 3/3 ve git diff --check geçti. Worker bundle hash'leri koruma kopyalarıyla aynı. Yalnız test eklendi; compiler/cache v27, DV2SCN01 schema v1 sabit.
- Kabul yalnız bu ARC→LINE yönündeki statik seam profiline aittir; genel cross-source/chunk topology, fill/glyph, runtime rendered-pixel veya AutoCAD parity kabulü değildir. F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) açık paket. Periodic SPLINE AutoCAD/evaluator/knot oracle'ı, HATCH fill runtime remesh/topology, host'a bağlı bounded/on-demand chunk, kalan fill/glyph/chunk composite, PATH_DISTANCE shader tüketimi, runtime WebGL/device-pixel error ve same-source AutoCAD görsel/ölçü kapıları açık.

## 2026-09-24 — nested BULGE→LINE seam hata zarfı

- testNestedBulgeToLineSourceSeamIsBoundedAcrossChunks iki seviyeli reflected/non-uniform INSERT içindeki BULGE semicircle sonunu ayrı LINE kaynağının tam başlangıcına bağlar. Her source chord ve LINE ayrı chunk'tır; local bounds midpoint ve Float32 endpoint'leri bağımsız yeniden hesaplanır. Combined singular value 8 ile ölçeklenen circular sagitta ve son chord endpoint kaybı aynı-chord composite olarak world/CSS manifest değerleriyle karşılaştırılır; decode seam'i iki uç round-trip hatasına ve komşu chunk hata zarfına sığmalıdır.
- Hedefli test, npm run check:cad-v2:unit, runtime typecheck, UI/Chromium 3/3 ve git diff --check geçti. Worker bundle hash'leri korunmuş kopyalarla aynı. Test-only; compiler/cache v27, DV2SCN01 schema v1 değişmedi.
- Bu yalnız ters yönlü nested BULGE→LINE birleşimidir; genel cross-source/chunk, fill/glyph, runtime-refined render veya AutoCAD parity kabulü değildir. F07 IN_PROGRESS; toplam plan 14/19 (%74), 5/19 (%26) paket açık. Periodic SPLINE AutoCAD/knot oracle'ı, HATCH fill runtime remesh/topology, host on-demand partition, kalan fill/glyph/chunk composite'leri, PATH_DISTANCE shader tüketimi, rendered WebGL/device-pixel error ve same-source AutoCAD görsel/ölçü oracle'ı açık.


## 2026-09-24 — Runtime-refined rendered ARC raster ölçümü

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Idle refinement sonrasında gerçek WebGL frame'inde quarter-circle kaynak/raster hata zarfı | tests/document-studio/cad-v2-layout-viewport.spec.ts, mevcut kamera/refinement senaryosu | Fit kamera ile bağımsız analitik yay; 494 render pikseli ve 0.5 CSS px aralıklı kaynak örnekleri. Render→source 0.9677 px, source→render 0.7497 px; sınır 1.25 px | PASS — yalnız bu sentetik quarter-circle/Chromium canvas profilinde. Hedefli Chromium 1/1, full unit, UI Chromium 3/3, runtime typecheck, diff-check geçti. Test-only; compiler v27/schema v1. Genel DPR/geometry/render bound ve AutoCAD oracle açık. |

F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) açık paket. Periodic SPLINE AutoCAD fixture/evaluator/knot parity, HATCH runtime remesh/topology, host on-demand bounded chunking, kalan fill/glyph/chunk-boundary composite'leri, shader PATH_DISTANCE, diğer runtime rendered-error profilleri ve same-source AutoCAD görsel/ölçü kabulü açık.


## 2026-09-24 — 125% runtime-refined raster profile

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Fit profiline ek olarak centered 125% zoom sonrası gerçek WebGL quarter-circle raster hatası | tests/document-studio/cad-v2-layout-viewport.spec.ts, tekrar kullanılan screenshot oracle'ı | UI 125%; transient 0.75 ve idle 0.25 refinement teslimi; u=fitU/1.25. 610 pixel. Render→source 0.9612 px, source→render 0.7642 px; eşik 1.25 px | PASS — iki centered scale (fit ve 125%). Hedefli Chromium 1/1, full unit, UI/Chromium 3/3, runtime typecheck, diff-check. Test-only; compiler v27/schema v1. Pan/higher zoom/DPR/device/genel raster ve AutoCAD oracle'ları açık. |

F07 IN_PROGRESS; toplam plan 14/19 (%74), 5/19 (%26) paket açık. Periodic SPLINE AutoCAD/evaluator/knot parity, HATCH runtime fill remesh/topology, host bounded/on-demand chunk loading, kalan fill/glyph/chunk-boundary composites, shader PATH_DISTANCE, genel runtime rendered hata ve same-source AutoCAD görsel/ölçü kapıları açık.


## 2026-09-24 — runtime-refined 80% raster profile

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Fit ve 125% kanıtlarına ek olarak centered 80% zoom-out'ta gerçek WebGL ARC raster/kaynak hatası | tests/document-studio/cad-v2-layout-viewport.spec.ts, aynı kamera/refinement senaryosu | UI 80%; transient 0.75 + idle 0.25 CSS px refinement, bounded quiet/drain; u=fitU/0.8=0.2055921053. 399 piksel: render→source 0.9819 px, source→render 0.7193 px; eşik 1.25 px. Fit/80%/125% üçü de eşik içinde. | PASS — hedefli Chromium 1/1, full CAD V2 unit, UI/Chromium 3/3, runtime typecheck, diff-check. Test-only; worker hash'leri aynı, compiler/cache v27 ve schema v1 sabit. Tek synthetic quarter-circle/Chromium context; pan, higher zoom, DPR/device, diğer geometri/fill/glyph/chunk ve genel hata kapıları açık. AutoCAD oracle ve diğer F07 kapıları açık. |

F07 IN_PROGRESS; toplam plan 14/19 (%74), 5/19 (%26) paket açık. Periodic SPLINE AutoCAD/evaluator/knot multiplicity, HATCH runtime remesh/topology, host bounded/on-demand chunk loading, kalan fill/glyph/chunk-boundary composite hesabı, shader PATH_DISTANCE tüketimi, daha geniş rendered-error bağlamları ve same-source AutoCAD visual/measurement oracle'ı açık.


## 2026-09-24 — panned 125% runtime-refined raster profile

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Tekrarlanan centered raster ölçümüne ek olarak aynı idle 125% bucket'ında pan edilmiş gerçek WebGL ARC hatası | tests/document-studio/cad-v2-layout-viewport.spec.ts, mevcut 125% kamera/refinement senaryosu | +48,+24 CSS px pointer drag; bağımsız kamera merkezi ötelemesi; u=0.1315789474 sabit; 610 piksel bbox tam öteleme kadar kayar. Render→source 0.9612 px, source→render 0.7642 px; eşik 1.25 px. Idle 0.25 refinement ve quiet queue korunur. | PASS — hedefli Chromium 1/1, full CAD V2 unit, UI/Chromium 3/3, runtime typecheck, diff-check. Rebuilt worker hash'leri aynı; compiler/cache v27 ve schema v1 sabit. Yalnız bu sentetik arc/pan/zoom bağlamı; genel pan/DPR/geometri/fill/glyph/chunk/AutoCAD kapıları açık. |

F07 IN_PROGRESS; toplam plan 14/19 (%74), 5/19 (%26) paket açık. Periodic SPLINE AutoCAD/evaluator/knot multiplicity, HATCH runtime remesh/topology, host bounded/on-demand chunk loading, kalan fill/glyph/chunk-boundary composite hesabı, PATH_DISTANCE shader tüketimi, genel rendered-error profiles ve same-source AutoCAD visual/measurement oracle'ı açık.

### F07 — Runtime-refined WebGL raster DPR2 alt kabulü (2026-09-24)

Gerçek Chromium `deviceScaleFactor=2` browser context'inde V2 host → worker refinement → WebGL çizimi → device-resolution screenshot hattı ölçüldü. CSS canvas 1280×672 ve drawing buffer/screenshot 2560×1344'tür. Idle refinement sonrasında 0.25 CSS px hedefi, 2 tamamlanmış yanıt ve kararlı kuyruk doğrulandı; maksimum LINES draw vertex sayısı 34'tür. 981 pikselin tam analitik quarter-circle'a uzaklığı render→source yönünde 0.6157362894 CSS px, source→render yönünde 0.4750552899 CSS px'tir; iki yön de 1.25 CSS px sınırındadır.

Doğrulama: tam `npm run check:cad-v2:unit`, tam `npm run check:cad-v2:ui` (Chromium **4/4**), `npx tsc --noEmit -p tsconfig.next.json --incremental false`, `git diff --check` — PASS. `public/cad-v2/cad-v2-scene-worker.js` ve `public/workers/dwg-dxf-conversion-worker.js` SHA-256 değerleri koşu öncesiyle aynıdır. Test/kanıt dışında compiler/cache kimliği değişmedi (`cad-v2-compiler-2026.09-v27`); DV2SCN01 schema v1.

Bu alt kabul tek sentetik ARC, centered fit ve DPR2 raster profiline özeldir. Farklı geometri/pan/zoom/DPR-device ailesinde genel hata sınırını kapatmaz. Periodic SPLINE AutoCAD fixture/desteği ile periodic knot oracle'ı, HATCH runtime fill remesh/topology, host'a bağlı bounded spatial partition/on-demand chunk yüklemesi, kalan fill/glyph/chunk-boundary bileşik muhasebe, shader `PATH_DISTANCE` tüketimi ve aynı-kaynak AutoCAD görsel/ölçü oracle'ı **OPEN** kalır. F07 **IN_PROGRESS**, plan **14/19 (%74)** ve **5/19 (%26)** paket açık.


### 2026-09-24 — panned 195% runtime ARC hata zarfı

F07 raster kabul testi fit/80%/centered 125% ve panned 125% profillerine ek olarak aynı sentetik quarter-circle'ı panned 195% UI zoom'da ölçer. Stale 156% yanıtı kabul edilmez; idle .25 CSS px yanıtı, held response=0 ve max 46 line vertex doğrulanır. D3 transform (811,421.5,11.875), pan (+171,+85.5) ve u=0.0842105263 world/CSS px bağımsız kamera hesabıyla eşleşir. Kaynak örnekleri görünür yay [0.1591116695,1.0916057806] ile sınırlıdır; render pikselleri tüm analitik yaya kıyaslanır. 622 pikselde yönlü maksimumlar 1.0113/0.7581 CSS px'tir; 1.25 CSS px sınırının altındadır.

Hedefli Chromium 1/1, tam CAD V2 unit, UI/Chromium 3/3, runtime typecheck ve git diff --check geçti. Worker hash'leri korunan kopyalarla eşleşti. Yalnız Playwright testi/kanıt güncellendi; compiler/cache v27, DV2SCN01 schema v1. Bu sentetik profil genel geometri/DPR/pan/zoom zarfı veya AutoCAD eşdeğerliği değildir. Periodic SPLINE AutoCAD fixture/evaluator/knot oracle'ı, HATCH runtime remesh/topology, host bounded/on-demand chunking, fill/glyph/chunk seam ve kalan bileşik hata, shader PATH_DISTANCE, geniş rendered-error kapsamı ve same-source AutoCAD karşılaştırması açık. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) paket açık.

### F07 — ELLIPSE runtime-refined raster oracle (2026-09-24)

| Dar kabul | Uygulama | Ölçüm/doğrulama | Sonuç ve sınır |
|---|---|---|---|
| Farklı geometriyle refined WebGL raster hatası | `tests/document-studio/cad-v2-layout-viewport.spec.ts`, sentetik ELLIPSE sidecar; gerçek host/worker/WebGL | DPR1 fit 1280×672; 4097 kaynak örneği, 378 piksel; iki yön 0.9825281925/0.7467465149 CSS px ≤1.25; worker 0.75→0.25, 2 yanıt, max 34 vertex. | PASS — ilgili unit'ler, Chromium 1/1, UI 5/5, runtime typecheck/diff-check. Worker hash sabit; v27/schema v1. Tek sentetik ELLIPSE, AutoCAD/genel kapı değildir. |

Son guard retry'si C: disk doluluğu (ENOSPC) nedeniyle sonuç vermedi; tam unit mevcut P05/P06 JSON'larını yazacağı için tekrarlanmadı. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) paket açık.
D-backed retry'ler test başlamadan durdu: ilkinde npm cache C: üzerindeydi; ikincisinde scripts/sync-cad-upstream-assets.mjs:61 C: diskinde ENOSPC verdi. Yeni D: çıktıları korundu.

### 2026-09-25 — F07 DPR2 ARC pan raster kabul kanıtı

DPR2 gerçek host→worker→refined WebGL akışında ARC, fit kamera sonrasında (48,24) CSS px sürüklendi. D3 x/y bu delta kadar ilerledi, k=6.08 sabit kaldı. 2560×1344 ekran görüntüsündeki 981 seçili pikselin bağımsız çeyrek-çember oracle'ına en büyük uzaklığı 0.6157362894 CSS px; analitik kaynak örneklerinin render piksellerine en büyük uzaklığı 0.4750552899 CSS px oldu. Canvas DPR2 (CSS 1280×672), idle hedef 0.25 CSS px, 2 yanıt, kararlı kuyruk ve 34 max line vertex doğrulandı; limit 1.25 CSS px.

İlgili üç unit geçti; Chromium viewport kabul dosyası 5/5 geçti; `tsc --noEmit -p tsconfig.next.json --incremental false` ve `git diff --check` temiz. Test-only; compiler/cache v27, DV2SCN01 schema v1 ve korunmuş worker hash'leri değişmedi.

Kabul yalnız bu sentetik ARC / fit / pan / DPR2 örneğini kapsar. Genel geometri-zoom-pan-DPR rendered-error, periodic SPLINE AutoCAD/knot eşliği, HATCH runtime topology, entegre bounded/on-demand chunks, fill/glyph/chunk kompozitleri, shader `PATH_DISTANCE` ve same-source AutoCAD oracle'ı AÇIK; AutoCAD oracle'ı NOT_RUN. F07 IN_PROGRESS — 14/19 (%74), 5/19 (%26) paket açık.
### 2026-09-25 — ELLIPSE DPR2 pan için F07 rendered-error kanıtı

ELLIPSE yan-yarıçapları 40/24 olan sentetik kaynak, mevcut host ve worker'dan geçip DPR2 WebGL'de fit kamera sonrası gerçek mouse ile +48,+24 CSS px taşındı. D3 x/y delta'yı uyguladı; k=6.08 kaldı. Bağımsız parametrik oracle 4097 kaynak noktasını 759 render pikseline karşı ölçtü. 2560×1344 device raster / 1280×672 CSS görünümünde hata maksimumları piksel→kaynak 0.6081436225 ve kaynak→piksel 0.4231605551 CSS px; ikisi 1.25 sınırında. Refinement 0.75→0.25 CSS px, 2 yanıt, sakin kuyruk, 34 max line vertex.

Üç ilgili unit PASS; altı Chromium kabul senaryosu 6/6 PASS; runtime typecheck ve `git diff --check` PASS. Yalnız test/helper değişti; compiler/cache v27, DV2SCN01 v1 ve korunan worker SHA-256 değerleri aynı.

Bu ELLIPSE profili DPR2 pan varyasyonunu ve ARC dışı bir eğriyi ölçer, genel rendered-error sözleşmesini kapatmaz. Periodic SPLINE AutoCAD/knot, HATCH runtime remesh/topology, host bounded/on-demand chunk, fill/glyph/chunk composite, shader `PATH_DISTANCE` ve same-source AutoCAD görüntü/ölçü oracle'ı OPEN (sonuncusu NOT_RUN). F07 IN_PROGRESS: 14/19 (%74), 5/19 (%26) paket açık.
### 2026-09-25 — F07 ELLIPSE 125% DPR2 panlı rendered-error profili

| Dar kabul | Oracle ve gerçek bağlam | Ölçüm | Sonuç |
|---|---|---|---|
| Runtime-refined ELLIPSE raster envelope: fit pan + centered 125% zoom + ikinci pan | CAD V2 host→worker→WebGL; DPR2; 4097 parametrik kaynak örneği; gerçek mouse hareketi | Kamera (688,360,6.08) → (700,366,7.6) → (748,390,7.6); net pan (+108,+54); 940 raster pikseli; 1280×672 CSS / 2560×1344 device; 0.1315789474 world/CSS px; iki yönlü maksimum 0.5931555545 / 0.4141058575 CSS px | PASS — yalnız bu sentetik ELLIPSE profili, ≤1.25 CSS px. 4 worker yanıtı, sessiz kuyruk, 40 max line vertex. Genel rendered-error kapısı kapanmaz. |

Hedefli Chromium 1/1; aynı kabul dosyası 6/6; üç ilgili unit (curve-refinement, precision-refinement, layout-viewport); runtime typecheck ve git diff --check geçti. Yeni C: Next cache ve D: test çıktıları ayrı, mevcut çıktıların üzerine yazılmadı. Test/helper dışında production değişikliği yok; compiler/cache v27, DV2SCN01 schema v1, scene worker 1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280 ve DWG/DXF worker DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D aynı kaldı.

Açık kapılar (PASS değildir): periodic SPLINE AutoCAD fixture/knot oracle; HATCH runtime remesh/topology; bounded spatial partition ve host on-demand chunk fetch; fill/glyph/chunk-boundary ve kalan composite; shader PATH_DISTANCE tüketimi; tam geometri/zoom/pan/DPR/device rendered-error matrisi; same-source AutoCAD visual/measurement oracle (NOT_RUN). F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) paket açık.
Rendered-error envanter notu: ARC'de DPR1 fit/80%/125%, panned DPR1 125%/195% ve DPR2 fit/+48,+24 pan; ELLIPSE'de DPR1 fit, DPR2 fit-kamera sonrası +48,+24 pan ve 125% zoom'da iki pan adımı ölçülmüştür. Eski “DPR2 pan yok” ara notu önceki durum içindir. Genel kapı hâlâ PARTIAL/AÇIK.
### 2026-09-25 — F07 ELLIPSE DPR2 80% panned-view profili

| Dar kabul | Kamera ve oracle | Ölçüm | Sonuç |
|---|---|---|---|
| Runtime-refined ELLIPSE raster envelope at 80% | Önceki 125% panlı D3 transform (748,390,7.6); merkez-ankorlu zoom-out ile 100%, sonra 80%; son transform (709.12,370.56,4.864), pan offset (+69.12,+34.56) | 1280×672 CSS, 2560×1344 DPR2; 4097 analitik örnek; 620 piksel; iki yönlü hata 0.5127801495 / 0.3767122232 CSS px; worker 6 yanıt, quiet, 40 max vertex | PASS — bu tek synthetic ELLIPSE/80% taşınmış kamera profili için, ≤1.25 CSS px. 80%’te ayrıca mouse drag yoktur. |

Targeted Chromium 1/1, tam kabul dosyası 6/6, curve-refinement/precision-refinement/layout-viewport unit'leri, runtime TypeScript ve git diff --check PASS. Production kodu değişmedi; revision v27, DV2SCN01 v1, scene worker 1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280 ve DWG/DXF worker DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D aynı.

Diğer kabul kapıları PASS değildir: periodic SPLINE AutoCAD/knot; HATCH remesh/topology; host bounded/on-demand chunks; residual fill/glyph/chunk composites; shader PATH_DISTANCE; genel rendered-error matrisi PARTIAL; same-source AutoCAD visual/measurement NOT_RUN. F07 IN_PROGRESS, plan 14/19 (%74), 5/19 (%26) açık.
### 2026-09-25 — ELLIPSE DPR2 156% runtime raster profili

| Dar kabul | Renderer/kamera | Bağımsız raster ölçümü | Sonuç |
|---|---|---|---|
| Yüksek zoomda runtime-refined ELLIPSE | DPR2 WebGL; 80% panlı kamera merkez-ankorlu 100→125→156%; D3 (775,403.5,9.5); pan ofseti (+135,+67.5) CSS px | 4097 kaynak örneği, 1190 piksel, 0.1052631579 world/CSS px; render→kaynak / kaynak→render 0.6348085456 / 0.4734169813 CSS px | PASS — tek sentetik geometri ve taşınmış kamera profili için ≤1.25 CSS px. 8 refinement yanıtı, sakin kuyruk, 42 max line vertex. |

Targeted Chromium 1/1, tam altı senaryolu Chromium dosyası 6/6, üç ilgili unit, runtime typecheck ve git diff --check geçti. Test/helper only; compiler/cache v27, DV2SCN01 v1, scene worker 1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280 ve DWG/DXF worker DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D değişmedi.

Genel geometri/device rendered-error matrisi PARTIAL/AÇIK. Periodic SPLINE AutoCAD/knot, HATCH runtime remesh/topology, bounded/on-demand host chunks, kalan fill/glyph/chunk composite, shader PATH_DISTANCE ve same-source AutoCAD ölçü/görüntü kapıları da AÇIK; sonuncusu NOT_RUN. F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) açık.

### 2026-09-25 — DPR1 156% panlı runtime ELLIPSE raster kabulü

| Dar kabul | Gerçek tarayıcı/kamera | Oracle ve ölçüm | Sonuç |
|---|---|---|---|
| Runtime-refined ELLIPSE yüksek zoom + pointer pan | Chromium WebGL DPR1; fit (640,336,6.08), UI 125%→156%, merkez-ankorlu son zoom (640,336,9.5), gerçek +48,+24 drag sonrası (688,360,9.5) | 1280×672 CSS/device; 4097 bağımsız parametrik kaynak örneği; 592 seçilmiş raster pikseli; u=0.1052631579 world/CSS px; render→kaynak / kaynak→render = 0.9868434156 / 0.7490349703 CSS px | PASS — bu sentetik ELLIPSE/DPR1/156%/pan profili için ≤1.25 CSS px; tam quarter-ellipse görünür; [0.75,0.25]×3, 6 yanıt, quiet, 42 max line vertex |

Targeted Chromium 1/1, layout-viewport Chromium 6/6, curve-refinement/precision-refinement/layout-viewport unit'leri, runtime TypeScript ve `git diff --check` PASS. Ayrı test süreçleri ve WebServer kapandı. Test/helper dışında production değişikliği yok; compiler/cache v27, DV2SCN01 schema v1, scene worker SHA-256 `1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280`, DWG/DXF worker `DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D` aynı. Rapor/config/log ve ayrı C: cache `D:\codex-cad-v2-f07-ellipse-dpr1-156-pan-20260925` altında; önceki test çıktıları korunmuştur.

| Diğer F07 kapısı | Durum |
|---|---|
| Periodic SPLINE AutoCAD fixture/desteği ve periodic knot oracle'ı | AÇIK — mevcut knot örnekleri non-periodic sentetik; periodic compiler yolu fail-closed |
| HATCH runtime fill remesh/topology | AÇIK |
| Bounded spatial partition ve host on-demand chunk fetch | AÇIK — scheduler host'a bağlı değil, başlangıçta tüm manifest chunks fetch edilir |
| Fill/glyph/chunk-boundary kalan composite error muhasebesi | AÇIK |
| Shader `PATH_DISTANCE` consumption | AÇIK — renderer tüketmiyor |
| Genel rendered-error geometri/zoom/pan/DPR/device matrisi | PARTIAL / AÇIK |
| Same-source AutoCAD visual/measurement oracle | AÇIK / NOT_RUN |

Bu dar profil genel rendered-error kapısını PASS yapmaz. Nested/transformed BULGE seam/same-chord profilleri mevcut olduklarından bu turda yinelenmedi. F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) açık.


## F07 kanıt eki — rational SPLINE runtime-refined DPR1 raster profili (2026-09-25)

Sentetik, non-periodic, tek-span rational cubic SPLINE gerçek host/worker/WebGL yoluna alındı. Worker kaynak subdivision'ından bağımsız rasyonel Bernstein oracle'ı 4097 source sample ve 677 raster pikselini karşılaştırdı. DPR1 fit, D3 (640,336,k=6.08), 1280×672 canvas: render→source 0.8164272623 CSS px; source→render 0.7307145792 CSS px. Refinement hedefi 0.25 CSS px'e indi; iki yanıt alındı, kuyruk sakin kaldı, maksimum 96 line vertex ölçüldü.

Hedefli Chromium 1/1, tam viewport Chromium 7/7, üç ilgili refinement/worker unit kabulü, runtime TypeScript ve diff-check geçti. Yalnız tarayıcı test/helper katmanı bu alt aşamada değişti; compiler/cache v27, DV2SCN01 v1 ve scene/DWG worker hash'leri değişmedi. Yeni ayrı C: cache'leri ve tüm D: run artifact'ları D:\codex-cad-v2-f07-spline-dpr1-fit-20260925 altında tutuldu.

Kapı yorumu: bu profil yalnız sentetik rational cubic SPLINE raster envelope'ünü PASS eder. Periodic AutoCAD SPLINE/knot oracle, HATCH runtime remesh/topology, host bounded/on-demand chunk, fill/glyph/chunk composite, shader PATH_DISTANCE ve same-source AutoCAD ölçü/görüntü AÇIK; tüm geometri ve device bağlamlarına rendered-error kapısı PARTIAL/AÇIK. Nested/transformed BULGE tekrar edilmedi; mevcut same-chord ve iki seam-yönü oracle'ı daha geniş composite açığını kapatmıyor. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) paket açık.


## F07 kanıt eki — rational SPLINE DPR2 pan

DPR1 fit oracle'ı gerçek kamera dönüşümünü ve device-pixel ölçeğini kullanacak şekilde genişletildi. Aynı sentetik non-periodic rational cubic, Chromium DPR2'de gerçek +48,+24 CSS px pan aldı. Kamera (640,336,k=6.08) → (688,360,k=6.08); CSS canvas 1280×672, drawing buffer 2560×1344. Bağımsız 4097 noktalı rational Bernstein örneklemesi ve 1348 raster pikseli: render→source maksimum 0.4829010756 CSS px, source→render 0.4292518924 CSS px. Worker [0.75,0.25] hedeflerini yanıtladı (2/2), pan sonrası sakin state ve maksimum 96 line vertex doğrulandı.

Targeted Chromium 1/1, tüm layout-viewport Chromium 8/8, curve/precision/worker-refinement unit kabul testleri, runtime typecheck ve diff-check PASS. Kamera-aware oracle ile önceki DPR1 fit de aynı değerleri korudu; production compiler/worker/schema değişmedi (v27, DV2SCN01 v1). Koşu artifact'ları D:\codex-cad-v2-f07-spline-dpr2-pan-20260925-camaware altında tutuldu; iki ayrı C: cache ve iki eski D: pan195 kökü korundu.

Yalnız SPLINE için bir DPR2 pan profili eklendi. Periodic AutoCAD SPLINE/knot, HATCH runtime remesh/topology, bounded host chunk loading, fill/glyph/chunk composite, shader PATH_DISTANCE ve same-source AutoCAD ölçü/görüntü AÇIK (AutoCAD NOT_RUN); genel rendered-error matrisi PARTIAL/AÇIK. F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) paket açık.


### 2026-09-25 — F07 rational SPLINE DPR2/125% pan oracle kabulü

| Kabul bağlantısı | Ölçüm | Sonuç |
|---|---|---|
| Host→worker→WebGL kamera/refinement davranışı | Gerçek DPR2 pan (+48,+24), centered 125% zoom ve ikinci gerçek pan (+48,+24); D3 (640,336,6.08)→(688,360,6.08)→(700,366,7.6)→(748,390,7.6). | **PASS — yalnız bu sentetik profil** |
| Bağımsız kaynak/raster hata envelope'ü | Rational Bernstein 4097 source sample; 1702 raster pikseli; 1280×672 CSS, 2560×1344 device, net pan (+108,+54), u=0.1315789474 world/CSS px. | **PASS — 0.4689849332 / 0.4743416490 CSS px**, ≤1.25 iki yönde |
| Settled refinement | Hedef `[0.75,0.25,0.75,0.25]`, reply 4/4, son hedef 0.25, quiet, maksimum 110 line vertex. | **PASS** |
| İlgili doğrulama | Seçilmiş Chromium raster kümesi 5/5; tam viewport Chromium 8/8; precision-refinement, curve-refinement, worker-refinement-browser; runtime TS typecheck; diff-check. | **PASS** |

Production kodu bu alt aşamada değişmedi; compiler/cache v27, DV2SCN01 v1 ve worker hash'leri sabit. Hedefli/tam-run cache ve raporları `D:\codex-cad-v2-f07-spline-dpr2-zoom-pan-20260925` ile `D:\codex-cad-v2-f07-spline-dpr2-zoom-pan-fullretry-20260925` altında; ilk hatalı TEMP-path suite denemesinin log/hata ekleri de ayrı kökte tutuldu.

Bu dar sentetik kabul, F07'nin genel kapılarını kapatmaz: periodic AutoCAD SPLINE/knot oracle **AÇIK**; HATCH runtime remesh/topology **AÇIK**; host bounded partition/on-demand chunk **AÇIK**; kalan fill/glyph/chunk-boundary composite **AÇIK**; shader `PATH_DISTANCE` **AÇIK**; tüm geometri/zoom/pan/DPR/device rendered-error matrisi **PARTIAL/AÇIK**; same-source AutoCAD görsel/ölçü **AÇIK/NOT_RUN**. F07 **IN_PROGRESS**, **14/19 (%74)** tamam ve **5/19 (%26)** paket açık.


### 2026-09-25 — F07 rational SPLINE DPR2/156% ikinci pan kabulü

| Kabul bağı | Ölçüm | Sonuç |
|---|---|---|
| Kamera/zoom/pan | Fit `(640,336,6.08)` → pan `(688,360,6.08)` → 125% `(700,366,7.6)` → pan `(748,390,7.6)` → 156% `(775,403.5,9.5)` → ikinci zoomdaki pan `(823,427.5,9.5)`; toplam net pan `(+183,+91.5)` CSS px. | **PASS —** gerçek Chromium D3/gesture state. |
| Kaynak/raster hata envelope'ü | Independent rational Bernstein 4097 source sample; 2124 DPR2 raster pixel; 1280×672 CSS / 2560×1344 device; `u=0.1052631579` world/CSS px. | **PASS — 0.4907102356 / 0.4090727048 CSS px**, iki yön ≤1.25. |
| Settled refinement | Hedef `[0.75,0.25,0.75,0.25,0.75,0.25]`; 6/6 reply; son hedef 0.25; pending boş; maksimum 110 line vertex. | **PASS** |
| Doğrulama | Targeted Chromium 1/1; tam viewport dosyası 8/8; 3 unit; runtime TypeScript; `git diff --check`. | **PASS** |

Test bekleyici yarışı, zoom öncesi target-count baseline'ından daha yeni hedef/yanıtı şart koşarak düzeltildi. İlk başarısız ve düzeltilmiş koşu logları saklandı. Production kodu değişmedi; compiler/cache v27, schema v1, iki worker hash'i sabit. Kayıtlar `D:\codex-cad-v2-f07-spline-dpr2-156-pan-retry-20260925` ile `D:\codex-cad-v2-f07-spline-dpr2-156-pan-full-20260925` altında.

Periodic AutoCAD SPLINE/knot oracle, HATCH runtime remesh/topology, host bounded/on-demand chunk, fill/glyph/chunk composite, shader `PATH_DISTANCE` ve same-source AutoCAD visual/measurement **AÇIK** (AutoCAD **NOT_RUN**); genel geometri/zoom/pan/DPR/device rendered-error **PARTIAL/AÇIK**. Nested/transformed BULGE testleri tekrarlanmadı. F07 **IN_PROGRESS**, **14/19 (%74)** tamam ve **5/19 (%26)** paket açık.


### F07 SPLINE DPR2 195% runtime-render kabulü (2026-09-25)

| Kabul bağı | Ölçüm | Sonuç |
|---|---|---|
| Gerçek kamera ve device bağlamı | 195% son kamera (868.75,450.375,k=11.875); 1280×672 CSS / 2560×1344 DPR2; u=0.08421052631578949 | PASS — kaynak SPLINE viewport içinde. |
| Bağımsız kaynak/raster zarfı | 4097 rational Bernstein örneği ve 2704 seçilmiş WebGL pikseli | PASS — render→kaynak 0.5413191518506184, kaynak→render 0.4506939094329671 CSS px; iki yön ≤1.25. |
| Settled refinement | 8/8 yanıt, son hedef 0.25 CSS px, pending 0, en çok 114 line vertex | PASS |
| Kontroller | Chromium viewport dosyası 8/8 / 190 s; tam npm run check:cad-v2:unit; runtime TypeScript; git diff --check | PASS |

195% kanıtı sentetik, non-periodic tek rational cubic SPLINE'a ve mevcut Chromium device-raster bağlamına özeldir. Mock heartbeat düzeltmesi test fixture'larında kaldı; production kod değişmedi. Log ve test çıktıları D:\codex-cad-v2-f07-spline-dpr2-195-zoom-final2-20260925 altında; önceki D: pan195/debug2 ve repo test-output dosyaları korundu. Compiler/cache v27, schema v1 ve iki preserved worker hash'i değişmedi.

Periodic AutoCAD SPLINE/fixture/knot oracle, HATCH runtime remesh/topology, host bounded partition/on-demand chunk, kalan fill/glyph/chunk-boundary bileşik hata, shader PATH_DISTANCE tüketimi ve same-source AutoCAD visual/measurement AÇIK (same-source NOT_RUN); genel geometri/zoom/pan/DPR/device rendered-error PARTIAL / AÇIK. Nested/transformed BULGE'ın mevcut dar same-chord/seam oracle'ları genel composite kapısını kapatmıyor. F07 IN_PROGRESS, plan 14/19 (%74) tamam ve 5/19 (%26) paket açık.


### F07 ELLIPSE DPR2 195% rendered-error kabulü (2026-09-25)

| Kabul bağı | Ölçüm | Sonuç |
|---|---|---|
| Kamera ve görünürlük | 156% kamerasından gerçek (-10,-5) pan, sonra merkez-ankorlu 195%; final (796.25,414.125,k=11.875), net pan (+156.25,+78.125) CSS px | PASS — tam parametrik çeyrek ellipse 1280×672 CSS viewport içinde. |
| DPR2 oracle | 2560×1344 device buffer, 4097 kaynak örneği, 1476 seçilmiş raster pikseli | PASS — render→kaynak 0.6301951256486582, kaynak→render 0.4610262730380537 CSS px (≤1.25). |
| Runtime refinement | 14 yanıt, son hedef .25 CSS px, pending 0, maxLineVertexCount 46 | PASS |
| Kontroller | Targeted Chromium 1/1; tam viewport Chromium 8/8; üç ilgili unit; runtime TS; diff check | PASS |

195% ölçümü sentetik tek ELLIPSE geometrisine aittir ve genel geometri/device matrisi kabulü değildir. Yalnız browser test/helper değişti, production kod değişmedi. D: log kökleri ve ayrı C: cache'ler korundu; v27/schema v1 ve worker hash'leri sabit.

Periodic AutoCAD SPLINE/knot, HATCH runtime remesh/topology, host bounded/on-demand chunk, residual fill/glyph/chunk-boundary composite, shader PATH_DISTANCE ve same-source AutoCAD visual/measurement AÇIK (AutoCAD NOT_RUN); genel rendered-error PARTIAL / AÇIK. F07 IN_PROGRESS, plan 14/19 (%74), 5/19 (%26) paket açık.

## F07 ek runtime raster profili — 2026-09-25

DPR1’de runtime-refined ELLIPSE için 195% yakınlaştırma ve aynı zoomda gerçek pan profili geçti: 1280×672 CSS / DPR1, D3 `(690,361,11.875)`, 4097 bağımsız parametrik kaynak örneği, 747 raster pikseli. Render→kaynak maksimum 1.0146941342 CSS px ve kaynak→render maksimum 0.7496648734 CSS px (`≤1.25`). Hedefli Chromium 1/1, tam viewport 8/8, CAD V2 unit exit 0, UI alt testleri ve runtime typecheck PASS.

Bu sonuç yerel sentetik ELLIPSE profilini genişletir; aynı-kaynak AutoCAD doğrulaması, diğer geometri türleri, fill/glyph/chunk bileşiği veya shader deseni için kabul kanıtı değildir. F07 gate seti açık kalır ve paket kapatılmaz. Plan ilerlemesi 14/19 (%74); 5/19 (%26) paket açık; F07 IN_PROGRESS.
## 2026-09-25 — F07 ARC DPR2 195% pan alt kabulü

**Kapsam:** Sentetik, analitik çeyrek ARC kaynağının DPR2 gerçek browser/runtime refinement sonrası raster hatası; 195% UI zoom ve zoom seviyesindeki ikinci gerçek pan.

**Kabul kanıtı:** Son D3 kamera `(781.75,406.875,k=11.875)`; fit-relative pan `(+141.75,+70.875)` CSS px. Canvas 1280×672 CSS ve 2560×1344 DPR2 device pikselidir. Görünür yay aralığı `[0,1.0286029931]`; bağımsız analitik kaynak oracle'ı ile 1363 render pikselinin render→source maksimumu `0.6559628023` CSS px, source→render maksimumu `0.4458264123` CSS px (eşik `≤1.25`). Refinement `[0.75,0.25]×4`, 8/8 yanıt, son hedef 0.25, pending 0, maksimum line vertex 46. Hedefli Chromium 1/1 ve tam viewport Chromium 8/8 geçti.

İlgili üç refinement unit/browser-worker testi, beş `check:cad-v2:ui` alt testi, runtime `tsc --noEmit -p tsconfig.next.json --incremental false` ve `git diff --check` PASS. Geniş unit komutu bilinen P05/P06 evidence JSON yazma etkisi nedeniyle çalıştırılmadı. Test/rapor/loglar D:\codex-cad-v2-f07-arc-dpr2-195-20260925 altında; iki koşu ayrı C: Next cache kullandı ve 43927/43928 portları kapandı. Sadece browser kabul testi değişti; compiler/cache v27, pipeline `fidelity-v3-p07`, schema v1 ve korunmuş worker SHA-256 değerleri değişmedi.

Bu alt kabul F07’yi tamamlamaz. Periodic AutoCAD SPLINE/knot oracle, HATCH runtime remesh/topology, bounded host partition/on-demand chunks, kalan fill/glyph/chunk-boundary bileşik hata, shader `PATH_DISTANCE` ve same-source AutoCAD görsel/ölçü kapıları **AÇIK**; genellenmiş rendered-error matrisi **PARTIAL / AÇIK**. F07 **IN_PROGRESS**; plan 14/19 (%74), 5/19 (%26) paket açık.
## 2026-09-25 — Rational SPLINE DPR1 195% pan alt kabulü

**Kapsam:** Sentetik non-periodic rational cubic SPLINE’ın DPR1’de fit durumundan 125%, 156%, 195% merkez-ankorlu zooma taşınması ve 195% zoomda gerçek `(+48,+24)` CSS px fare panı sonrası runtime-refined WebGL raster hatası.

**Bağımsız oracle sonucu:** 4097 rational Bernstein örneği ve 1350 seçilmiş WebGL pikseli. Son kamera `(688,360,k=11.875)`, `u=0.0842105263` world/CSS px; tüm kaynak bounds `[284.25,98.75]..[1091.75,573.75]` viewport içinde. Render→source `0.9300776279` CSS px; source→render `0.7905694150` CSS px; eşik `≤1.25`. Refinement `[0.75,0.25]×4`, 8/8 reply, son 0.25 CSS px, pending 0, maxLineVertexCount 114. Same-bucket pan sonrası worker state sabit kaldı.

Hedefli Chromium 1/1; tam viewport Chromium 8/8; üç refinement unit/browser-worker ve beş UI subcheck; runtime TypeScript ve `git diff --check` PASS. Unit paketi P05/P06 kanıt JSON’larına yazdığı için geniş suite çalıştırılmadı; UI subtestleri worker rebuild adımı atlanarak doğrudan çalıştırıldı. Çıktılar D:\codex-cad-v2-f07-spline-dpr1-195-pan-20260925-v2 altında; ayrı C: Next cache kullanıldı, test portları kapalı. Yalnız kabul testi değişti; compiler/cache v27, pipeline `fidelity-v3-p07`, schema v1 ve worker hash'leri aynı kaldı.

Bu alt kabul periodic/AutoCAD SPLINE desteği ve knot oracle’ını **KAPATMAZ**. HATCH runtime remesh/topology, bounded partition/on-demand chunk, residual fill/glyph/chunk composite, shader `PATH_DISTANCE` ve same-source AutoCAD oracle **AÇIK**; genel rendered-error matrisi **PARTIAL / AÇIK**. F07 **IN_PROGRESS**, plan 14/19 (%74), 5/19 (%26) paket açık.
## 2026-09-25 — DPR2 ELLIPSE 195% sonrası pan alt kabulü

**Kapsam:** DPR2 sentetik parametrik ELLIPSE runtime-refinement raster kabulinde 195% UI zoomdan sonra gerçek `(-10,-5)` CSS px pan.

**Kabul ölçümü:** Son kamera `(786.25,409.125,k=11.875)`, fit-relative offset `(+146.25,+73.125)` CSS px. 1280×672 CSS viewport / 2560×1344 device buffer, `u=0.0842105263`. Tam çeyrek yay viewport içinde; bağımsız 4097 noktalı parametrik kaynak oracle'ı 1476 WebGL pikselinde render→source `0.6301951256` ve source→render `0.4610262730` CSS px ölçtü (`≤1.25`). Worker `[0.75,0.25]×7`, 14/14 yanıt, son 0.25 CSS px, pending 0, max line vertex 46; son pan sonrası quiet state aynı kaldı.

Hedefli Chromium 1/1; tam viewport Chromium 8/8; üç refinement unit/browser-worker, beş UI alt testi, runtime typecheck ve `git diff --check` PASS. Geniş unit paketi P05/P06 JSON yazma etkileri nedeniyle çalıştırılmadı; UI alt testleri worker rebuild adımı atlanarak yürütüldü. Kanıtlar `D:\codex-cad-v2-f07-ellipse-dpr2-195-postpan-20260925` altında; C: cache'ler ayrıdır, test portları kapalı. Yalnız browser acceptance testi değişti; compiler/cache v27, pipeline `fidelity-v3-p07`, schema v1 ve worker hash'leri aynı.

Bu profil F07’yi tamamlamaz. Periodic AutoCAD SPLINE/knot, HATCH remesh/topology, bounded spatial partition/on-demand chunk, fill/glyph/chunk composite ve shader `PATH_DISTANCE` kapıları **AÇIK**; genel rendered-error matrisi **PARTIAL / AÇIK**; same-source AutoCAD visual/measurement **AÇIK / NOT_RUN**. F07 **IN_PROGRESS**, plan 14/19 (%74), 5/19 (%26) paket açık.
## 2026-09-25 — F07 DPR2 SPLINE 195% pan alt kabulü

**Kapsam:** Sentetik non-periodic rational cubic SPLINE kabul testinde DPR2 fit → 125% → 156% → 195% zoom dizisi ve 195% sonrasında gerçek `(-10,-5)` CSS px fare panı.

**Ölçüm:** Final D3 kamera `(858.75,445.375,k=11.875)`, fit-relative offset `(+218.75,+109.375)` CSS px. 1280×672 CSS viewport / 2560×1344 device buffer; kaynak bounds `[455,184.125]..[1262.5,659.125]` görünür. Bağımsız 4097 rational Bernstein noktası, 2704 WebGL pikseliyle iki yönde karşılaştırıldı: render→source `0.5413191519`, source→render `0.4506939094` CSS px (`≤1.25`). Refinement `[0.75,0.25]×4`, 8/8 reply, son hedef 0.25 CSS px, pending 0, maxLineVertexCount 114; pan bu state'i değiştirmedi.

Hedefli Chromium 1/1; tam viewport Chromium 8/8; iki refinement unit + beş UI/browser test 7/7; runtime typecheck ve `git diff --check` PASS. Geniş unit paketi bilinen P05/P06 JSON yazma etkisi nedeniyle çalıştırılmadı; UI alt testleri generated worker rebuild olmadan doğrudan koştu. Kanıt/log/config/sonuçlar `D:\codex-cad-v2-f07-spline-dpr2-195-postpan-20260925` altında; iki ayrı C: Next cache, D: temp/data, kapalı test portları.

Yalnız browser acceptance testine eklenti yapıldı. Compiler/cache v27, `fidelity-v3-p07`, schema v1 ve iki worker SHA-256 değişmedi. Bu synthetic profile periodic AutoCAD SPLINE/knot oracle'ını kapatmaz; HATCH topology, bounded/on-demand chunk, fill/glyph/chunk composite ve shader `PATH_DISTANCE` açık kalır; rendered-error matrisi partial/open, AutoCAD same-source görsel/ölçü oracle'ı açık/not run. F07 `IN_PROGRESS`; plan 14/19 (%74), 5/19 (%26) paket açık.
## 2026-09-25 — F07 DPR2 rational SPLINE 80% pan alt kabulü

**Kapsam:** DPR2 non-periodic rational cubic SPLINE raster kabulinde 195% zoomdan UI zoom-out ile 156% → 125% → 100% → 80% geçişi ve 80% zoomda gerçek `(-10,-5)` CSS px pan.

**Ölçüm:** Kamera `(729.6,380.8,k=4.864)`’ten `(719.6,375.8,k=4.864)`’e geçti; final fit-relative offset `(+79.6,+39.8)` CSS px. 1280×672 CSS viewport / 2560×1344 device buffer içinde tam kaynak bounds `[554.224,268.792]..[884.976,463.352]` kaldı. Bağımsız 4097 rasyonel Bernstein örneği ve 1112 WebGL pikseli render→source `0.4476090077`, source→render `0.3641466608` CSS px ölçtü (`≤1.25`). Refinement `[0.75,0.25]×5`, 10/10 yanıt, pending 0, son hedef 0.25 CSS px, maksimum 114 line vertex; aynı bucket panı state'i yenilemedi.

Hedef Chromium 1/1; tam viewport Chromium 8/8; yedi odaklı CAD unit/UI testi 7/7; runtime typecheck ve `git diff --check` PASS. Geniş unit paketi mevcut P05/P06 kanıt JSON’larına yazdığı için koşulmadı; beş UI subcheck doğrudan, worker rebuild olmadan çalıştırıldı. Çıktılar `D:\codex-cad-v2-f07-spline-dpr2-80-pan-20260925` altında; C: cache'ler ayrıdır, D: temp/data kullanıldı, test portları kapalı.

Bu alt kabul yalnız sentetik DPR2 SPLINE raster matrisine bir 80% pan hücresi ekler; periodic AutoCAD fixture/knot, HATCH remesh/topology, on-demand chunks, kalan composite, shader `PATH_DISTANCE` ve AutoCAD oracle kapıları **AÇIK** kalır. Genel rendered-error matrisi **PARTIAL / AÇIK**. Compiler/cache v27, pipeline `fidelity-v3-p07`, schema v1 ve worker hash'leri değişmedi. F07 **IN_PROGRESS**, 14/19 (%74), 5/19 (%26) paket açık.
## 2026-09-25 — F07 raster kabul eki: DPR1 SPLINE 80% pan

**Tamamlanan dar alt aşama:** Mevcut DPR1 non-periodic rational SPLINE Chromium testi, 195% zoom ve pan sonrasından 80% zoom-out ile gerçek (-10,-5) CSS px panı kapsayacak şekilde genişletildi. Kaynak spline 4097 bağımsız rational Bernstein örneğiyle; çıktı Chromium WebGL framebuffer'ından seçilen piksellerle karşılaştırıldı.

- Final kamera: (649.6608,340.8304,k=4.864), fit-relative pan (+9.6608,+4.8304) CSS px.
- CSS viewport / DPR1 buffer: 1280×672 / 1280×672; u=0.2055921052631579 world/CSS px.
- Tam kaynak bounds görünür: [484.2848,233.8224]–[815.0368,428.3824].
- 542 render pikselinde iki yönlü ölçüm: render→source 0.7981910667 px; source→render 0.9082625171 px; kabul sınırı 1.25 px.
- Refinement: son hedef 0.25 px; [0.75,0.25]×5; 10 yanıt/10 istek; pending 0; maxLineVertexCount 114. Son pan aynı bucket'ta yeni refinement üretmedi.

**Doğrulama:** Hedefli Chromium 1/1, tam viewport Chromium 8/8, odaklı refinement/UI/worker testleri 7/7, runtime TypeScript 0 hata ve git diff --check PASS. Tüm komutlar timeout ile sınırlandı; portlar kapandı. Günlükler ve Playwright artifact'leri D:\codex-cad-v2-f07-spline-dpr1-80-pan-20260925 altında, C: cache dizinleri ayrı tutuldu.

Bu ölçüm bir sentetik DPR1 spline hücresini kanıtlar; F07 paketini veya genel AutoCAD uygunluğunu tamamlamaz. Periodic AutoCAD spline/knot oracle, HATCH runtime remesh/topology, bounded partition/on-demand loading, kalan fill/glyph/chunk-boundary composite accounting, shader PATH_DISTANCE ve eş-kaynak AutoCAD visual/measurement açık kalır. Rendered-error matrisi PARTIAL/AÇIK. Revizyon etkisi: yalnız kabul testi; compiler/cache v27, fidelity-v3-p07, schema v1 ve worker SHA-256'ları değişmedi. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-25 — F07 DPR1 ELLIPSE runtime raster kabul eki

Bu ek mevcut binary/API sözleşmesini değiştirmez; yalnızca F07 runtime refinement raster kanıtını kaydeder. `tests/document-studio/cad-v2-layout-viewport.spec.ts:1468` sentetik ELLIPSE testine 195% pan sonrasında 156%/125%/100%/80% zoom-out ve 80% düzeyinde (-10,-5) CSS px kullanıcı panı eklendi. Bağımsız parametric oracle 4097 kaynak örneğini 299 DPR1 WebGL pikseliyle karşılaştırdı; render→kaynak `0.7860996134` px, kaynak→render `0.8713208364` px (ikisi de 1.25 px eşiğinin altında). Final camera `(650.48,341.24,k=4.864)`, viewport/buffer 1280×672, `u=0.2055921052631579` world/CSS px.

Targeted Chromium 1/1, tam viewport Chromium 8/8, yedi odaklı CAD V2 unit/UI testi 7/7 ve runtime `tsc --noEmit -p tsconfig.next.json --incremental false` geçti. Final worker hedefi 0.25 CSS px, 10/10 refinement yanıtı ve 46 maksimum line vertex; son pan 350 ms içinde yeni refinement üretmedi. Günlük/artifact kökü `D:\codex-cad-v2-f07-ellipse-dpr1-80-pan-20260925`; başarısız ilk yükleme denemesi artifact'i korundu ve başarılı koşu sayılmadı. Compiler/cache v27, pipeline p07, DV2SCN01 schema v1 ve bilinen worker hash'leri sabit kaldı.

Bu sentetik hücre F07 kapılarını kapatmaz: periodic AutoCAD SPLINE fixture/knot oracle, HATCH runtime remesh/topology, host bounded/on-demand chunks, kalan fill/glyph/chunk-boundary composite, shader `PATH_DISTANCE`, genel geometri/device matrix ve same-source AutoCAD visual/measurement (**NOT_RUN**) açık kalır. F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) paket açık.


**Artifact notu:** İlk başarısız Playwright çağrısında PowerShell argüman aktarımı nedeniyle `--output` etkinleşmedi ve varsayılan repo `test-results` yoluna failure artifact yazıldı. Mevcut çıktı silinmedi/taşınmadı. Koşu öncesi aynı adlı artifact için hash/yedek alınmadığından, varsa önceki içeriğin korunup korunmadığı geriye dönük doğrulanamıyor. Bu başarısız deneme PASS sayımına dahil değildir.


## 2026-09-25 — F07 DPR1 ARC 80% runtime raster kabul eki

Bu alt ek binary/API sözleşmesini veya runtime compiler'ı değiştirmez. Mevcut DPR1 ARC browser senaryosuna 195% pan sonrasında 156% → 125% → 100% → 80% zoom-out ve 80% seviyesinde gerçek (+48,+24) CSS px pan eklendi. Bağımsız analitik quarter-circle oracle 383 WebGL pikselinde render→kaynak maksimum `0.8401740575` CSS px ve kaynak→render maksimum `0.7087218739` CSS px ölçtü; ikisi de 1.25 px altında. Final kamera `(758.0416,395.0208,k=4.864)`, viewport/raster 1280×672, ölçek `0.2055921052631579` world/CSS px.

Targeted Chromium 1/1, tam viewport Chromium 8/8, yedi odaklı CAD V2 unit/UI testi 7/7 ve runtime TypeScript kontrolü geçti. 0.25 CSS px son hedef ve 0 pending yanıt doğrulandı; 46 line vertex görüldü ve 80% pan ek refinement üretmedi. Çıktılar `D:\codex-cad-v2-f07-arc-dpr1-80-pan-20260925` altında korundu; hatalı ilk zoom assertion denemesi de D: altında tutuldu, düzeltilmiş retry ve full suite PASS verdi.

Bu sentetik raster hücresi F07 kapılarını kapatmaz ve schema değişikliği getirmez: compiler/cache revision v27, pipeline p07 ve DV2SCN01 v1 aynı kaldı. Periodic AutoCAD SPLINE/knot, HATCH runtime remesh/topology, host on-demand chunks, kalan bileşik fill/glyph/chunk hesabı, shader `PATH_DISTANCE`, genel rendered-error matrisi ve same-source AutoCAD oracle kapıları açık/PARTIAL kalır. F07 IN_PROGRESS, 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-25 — F07 DPR3 raster eki: ABI ve binary sözleşme etkisi

Bu alt aşama yalnız kabul testini ve test fixture temizliğini korumaya yönelik opt-in kancayı değiştirdi; compiler, worker, renderer kaynağı veya serialized chunk alanları değişmedi. PATH_DISTANCE aynı optional F32 scalar section olarak decode/worker aktarımında kalır; mevcut CadV2Renderer bunu vertex attribute/shader'a bağlamaz. DPR3 ölçümü dash görünüşü veya shader tüketimi kabulü değildir.

Doğrulanan kimlikler: compiler/cache revision cad-v2-compiler-2026.09-v27; pipeline fidelity-v3-p07; DV2SCN01 schema v1; render ABI three172-cad2d-v1. Public scene worker SHA-256 1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280. Bu aşamada cache invalidation/schema migration gerekmedi. F07 IN_PROGRESS; periodic spline, HATCH runtime remesh, on-demand partition, kalan bileşik hata, shader PATH_DISTANCE, genel rendered-error matrisi ve AutoCAD oracle kapıları açık/partial kalır; plan 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-25 — F07 DPR3 rational SPLINE rendered-error kanıtı

Test-only DPR3 profili, mevcut scene/protocol sözleşmesini değiştirmeden 80% zoom ve gerçek `(-10,-5)` CSS px pan sonrasında runtime-refined non-periodic rational SPLINE'i raster oracle ile ölçtü. 1280×672 CSS viewport, DPR3, renderer'ın 2× sınırıyla 2560×1344 drawing buffer ve 3840×2016 device screenshot kullanıldı. Fit `(640,336,k=6.08)` → 80% `(640,336,k=4.864)` → pan `(630,331,k=4.864)`.

4097 bağımsız kaynak örneği / 3273 WebGL pikseli: render→source maksimum `0.6668573448 CSS px`, source→render maksimum `0.2322079741 CSS px` (kabul ≤1.25). Refinement `[0.75,0.25,0.75,0.25]`, reply 4/4, final target 0.25, pending 0, max line vertices 96; aynı bucket'taki pan yeni istek üretmedi.

Kimlik/cache etkisi: yalnız `tests/document-studio/cad-v2-layout-viewport.spec.ts` kabul senaryosu eklendi. Compiler/cache revision `cad-v2-compiler-2026.09-v27`, pipeline `fidelity-v3-p07`, DV2SCN01 v1 ve ABI `three172-cad2d-v1` değişmedi; yeni C: Next cache test izolasyonu içindir, scene/compiler cache invalidation gerektirmedi. Test config/log/artifact'leri D: run-002 altında saklandı; repo dışı plan dosyası değiştirilmedi.

F07 iç tahmini, plandaki altı ana gereksinim grubuyla raporlanır: 2 PASS + 4 PARTIAL, PARTIAL yarım ağırlık = **yaklaşık %67**. Bu iş yalnız rendered-error grubundaki bir matriks hücresini güçlendirir; grubun statüsünü PARTIAL'dan PASS'a taşımaz. Periodic AutoCAD SPLINE/knot, HATCH runtime remesh/topology, on-demand partition, residual fill/glyph/chunk composite, shader PATH_DISTANCE ve same-source AutoCAD oracle açık; genel rendered-error matrisi PARTIAL/AÇIK. F07 IN_PROGRESS; plan geneli 14/19 (%74), 5/19 açık.

## 2026-09-25 — Optional two-term shader dash draw-command sözleşmesi

Yeni derleyici, yalnız desteklenen widthless straight LINE ve açık düz LWPOLYLINE için `META.drawCommands[]` içinde optional `dashStyle: { dashSize, gapSize }` üretir. Shader girişindeki `lineDistance` attribute'u aynı vertex sırasındaki PATH_DISTANCE F32 elemanlarından kurulur; Three `LineDashedMaterial` `dashSize/gapSize` ile fazı path distance üzerinden tüketir. Worker binary section değişmedi; `PATH_DISTANCE` scalar/vertex cardinality korunur. `DV2SCN01` schema v1 kalır. Compiler/cache v28, pipeline p08 ve `three172-cad2d-v2` renderer ABI yeni semantics için cache/revision sınırıdır.

Desen tam iki terim `[positive,-negative]`, etkili scale sonrasında finite/pozitif olmak zorunda. Geniş lineweight, width, bulge, kapalı/plinegen-reset polyline, dot/çok-terimli veya leading-gap pattern için yeni metadata üretilmez; CPU-expanded fallback korunur. Bu dar implementasyon tüm linetype sözleşmesini shader'a taşımaz. Tek/altı chunk Chromium karşılaştırmasında beş DASHED görünür run ve aynı screenshot hash'i ölçüldü; test 1/1 PASS.


## 2026-09-25 — DXF periodic SPLINE alan sözleşmesi eki

Ham DXF SPLINE flags 70 (periodic/rational), degree 71, declared counts 72/73, knots 40, weights 41 ve 3D controls 10/20/30 handle üzerinden canonical modele taşınır. ASCII ve binary pair okuyucuları aynı sentetik alanları verir. Eksik flag uydurulmaz; degree 0 korunur ve validator reddeder.

Kabul sınırı: sentetik De Boor closure <1e-8 world, knot continuity <1e-5 ve multiplicity 2/3 kanıtlandı; AutoCAD-authored fixture üretilemedi (COM 90 s timeout), aynı-kaynak parity NOT_RUN. Üretim periodic tessellation fail-closed. Serialized schema değişmedi.

Güncel source kimliği compiler/cache v29, pipeline p08, renderer ABI v2, DV2SCN01 schema v1. Compiler revision scene cache identity'sine dahildir; cache-identity testi PASS. Public worker hash'i 1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280; worker bundle bu decoder işi için değişmedi. İlgili unitler, viewport 9/9 + DWG XCLIP, Chromium 1/1, runtime typecheck ve CRLF-aware diff check PASS. F07 iç tahmini %67; genel plan 14/19 (%74), beş paket açık.


## 2026-09-25 — PATH_DISTANCE sınırlı renderer doğrulama eki

Güncel source/test doğrulaması: Straight widthless LINE ve açık LWPOLYLINE'ın iki terimli dash/gap profili PATH_DISTANCE scalar'larını Three lineDistance attribute'una verir. 184 unit ve [24,-16] test profili tek ve altı chunk'a ayrıldığında scalar dizisi, 5 raster run, 97/97/98/97 px gap ve iki framebuffer SHA-256 (98878ef260eb93722877a39be4a72bc188dbbbfda24b36f83d1680980941e0a8) eşleşti. Linetype unit paketi 12/12 ve targeted Chromium 1/1 PASS.

Bu, bütün AutoCAD linetype desenlerinin shader'a taşındığı anlamına gelmez; diğer desenler mevcut CPU fallback/kapasite sınırları kapsamındadır. PATH_DISTANCE nihai F07 gate PARTIAL/OPEN. D: kanıt kökü D:\codex-cad-v2-f07-periodic-spline-acad-20260925\playwright-run-004; F07 ~%67, genel plan 14/19 (%74).


## 2026-09-25 — F07 periodic SPLINE runtime-refinement checkpoint

Contract detail: homogeneous per-span polynomial fitting uses Chebyshev-Lobatto fit nodes plus residual validation nodes; residual and floating-point allowance enter source-fit error used by the convex-hull refinement budget. The sampled oracle is not an exhaustive rational-curve proof or AutoCAD parity.

Synthetic periodic DXF SPLINE runtime refinement is now enabled for a bounded profile: degree 1–8, positive finite weights, cyclic control/weight tail, and closed active knot interval. Open/non-cyclic seams and degree 9+ fail-closed; non-periodic knot insertion is unchanged. This supersedes the earlier blanket periodic rejection only for these synthetic profiles.

Independent De Boor oracle: four 4-span profiles (F071/F074/F075/F077), 12,001 samples each (48,004 total), target 0.05 world units. Max errors 0.0188605 / 0.0326872 / 0.0364018 / 0.0361927; reported bounds 0.0254003 / 0.0441744 / 0.0488367 / 0.0482629. Simple/double/triple internal multiplicity and rational weights were included. Chromium worker refined 6 source segments to 64; bound met, stale generation dropped, LRU inline fallback passed, Float32 output 3,472 bytes.

Periodic AutoCAD-authored fixture/parity and periodic raster comparison are still missing: this gate remains PARTIAL/OPEN. A separate DPR3, 80%-zoomed-and-panned UI raster regression tested a non-periodic rational SPLINE only (3,273 pixels; render→source 0.666857 CSS px, source→render 0.232208 CSS px), so it does not close periodic or general runtime raster acceptance.

Current compiler/cache revision cad-v2-compiler-2026.09-v30; pipeline fidelity-v3-p08; DV2SCN01 schema v1 and three172-cad2d-v2 render ABI unchanged. Unit package exited 0, periodic unit and real-browser worker tests passed, runtime tsc --noEmit -p tsconfig.next.json --incremental false passed. Logs retained in D:\codex-cad-v2-f07-periodic-runtime-20260925. F07 remains IN_PROGRESS, internal estimate ~67% (2 PASS + 4 PARTIAL across 6 groups); plan 14/19 (74%), 5 packages open.


## 2026-09-25 — F07 nested affine BULGE DPR2 rendered-error checkpoint

Nested/transformed BULGE için canlı renderer kabul hücresi eklendi. Derlenmiş canonical sahnede `bulge=1` yarım çemberi iki seviyeli INSERT dönüşümünden geçti; bir analytic BULGE sidecar gerçek worker tarafından yüklendi ve rafine edildi. Kaynak oracle'ı bağımsız olarak 4.097 yay noktası üretti ve inner/outer affine dönüşümlerini uyguladı.

DPR2, %80 zoom-out, +24,+12 CSS px pan: 1280×672 CSS canvas ve 2560×1344 drawing buffer. 3.105 render pikselinde iki yönlü en büyük sapma 0.585647 / 0.465291 CSS px (1.25 px kabul sınırının içinde); worker hedefi 0.25 px, 4/4 yanıt, pan sonrasında bekleyen yanıt yok, line vertex tepe sayısı 98. Chromium 1/1 ve ilgili iki unit testi PASS; runtime typecheck PASS.

Bu, bir sentetik SwiftShader rendered-error matrisi hücresidir; AutoCAD fixture/görsel parity veya native GPU kabulü değildir. Tam test-inclusive repo typecheck mevcut diğer test dosyalarında hata ile exit 2 verir; yeni spec son tanı listesinde yoktur. Runtime/compiler revision v30/p08 değişmedi; matrix gate PARTIAL/OPEN; F07 ~%67, genel plan 14/19 (%74).

## 2026-09-26 — F07 settled 156% ARC runtime rendered-error eki

Aynı sentetik analitik çeyrek ARC, canlı belge host'u, worker refinement ve WebGL2 üzerinden iki DPR'de 156% dönüş/pan ölçümüne alındı. DPR1 stale yanıtı reddetme akışından sonra yeniden 156% durumuna geldi; 0 bekleyen yanıt, son 0,25 CSS px hedef ve gerçek +48,+24 pan ile 612 pikselde iki yönlü azami hata 0,9621349720 / 0,7532715925 CSS px. DPR2 195%'ten 156%'e dönüp 10/10 worker yanıtı sonrası gerçek +48,+24 pan yaptı; 1.544 pikselde 0,5933250455 / 0,4743416490 CSS px. İki profil de 1,25 CSS px sınırını geçti.

Hedefli Chromium 2/2; son DPR1 kamera assertion'ı yeniden koşusu 1/1; curve-refinement, camera-interaction ve worker-refinement-browser 3/3; runtime TypeScript ve diff-check PASS. Tam test-inclusive TypeScript exit 2, mevcut başka test/Worker.postMessage tip sorunları nedeniyle; yeni 156% bloklarında tanı yok. Başarılı loglar D:\codex-cad-v2-r08-156-20260926-003/-004/-005 konumunda. Bu test-only değişiklik compiler/cache v30, pipeline p08, ABI v2 veya binary schema v1'i değiştirmez.

Erişilebilir checkout eski olduğundan v42/p19 worktree'deki R01/R02b kod/fixture kanıtı burada temsil edilmez. 156% boşluğu bu checkout'ta ölçüldü; geniş F07 rendered-error kapısı PARTIAL, native GPU ve AutoCAD aynı-kaynak oracle'ı açık kalır. F07 kapanış veya genel plan yüzde artışı iddia edilmez.

## 2026-09-26 -- F07 internal R11 supported periodic SPLINE matrix

R11 periodic SPLINE contract on supported degree 1–8: preserve source knot multiplicity and rational weights through ASCII/binary DXF, canonical data, binary scene and worker; evaluate the active domain without clamped-end assumptions; omit zero-width spans; close endpoints; fail closed on unsupported degree 9 or invalid endpoint/knot/weight cycles. Seven new profiles: 28,007 De Boor points, maximum 0.0436049487 world units within 0.05; 43/43 binary/worker spans. Compiler/cache v30, pipeline p08, DV2SCN01 v1 and render ABI v2 unchanged. This does not claim native AutoCAD equality or terminal F07 completion.

## 2026-09-26 — F07 iç R03 direct LINE spatial/viewport kabul kaydı

R03 için mevcut compiler ve host akışı 91a0 v30/p08 checkout'unda yeniden kuruldu; eski v42/p19 snapshot veya fixture kurtarıldığı iddia edilmez. Top-level LINE continuous, iki terimli hairline shader dash ve kalın CPU dash dalları bounded spatial gruplamaya katılır. 12.000 unit kaynak çizgi üç <=4.096 bbox'lı chunk'a ayrıldı; lineweight padding'i, XY endpoints, source global order ve PATH_DISTANCE aralıkları korundu. 1e9 yüksek origin profili 3 chunk'ta tam source bbox/endpoints ve <3.000 Float32 local coordinates üretti.

Sınır davranışı: 1.100.000 unit kaynak çizgi 269 dilim isteyeceğinden 256 kaynak-başına cap'i aşar; derleyici kaynağın tamamını tek chunk'ta tutar, global DIRECT_LINE_SPATIAL_PARTITION_LIMIT_REACHED diagnostic'i ekler ve kaliteyi degraded işaretler. Bu bounded-partial sözleşmesi chunk adedini ve geometri kaybını kontrol eder; istisnai tek chunk için 4.096-unit bbox/local-precision garantisi ileri sürmez.

Host viewport gate'i aktif layout + kamera bbox ile istek seçer; zoom/pan sonrasında görünür yeni chunk'ı 120 ms debounce ardından çeker ve pafta değişimi ilgili viewport'u yükler. Host UI Chromium testi near/far fixture ile başlangıçta yalnız near fetch, zoom sonrası tek far fetch doğruladı. Yeniden koşulan sınırlı PATH_DISTANCE WebGL profili single/six chunk partition'da aynı 5 raster run, 97/97/98/97 px gap ve aynı 264758117837085532fc5ad17b5f5b9ff469b550ccf1a0dd14e68d678545b screenshot hash'ini üretti; bu tüm dash families için raster kabulü değildir.

Doğrulama komutları: node --import tsx tests/cad-v2/direct-line-spatial-partition.test.ts (24 assertions), painter-order.test.ts, chunk-scheduler-cache.test.ts, layout-viewport.test.ts, tsconfig.next runtime typecheck; hedefli Chromium viewport-fetch/layout-picker/DASHED chunk-partition testleri 3/3 PASS. Tam check:cad-v2:unit, integration veya release zinciri çalıştırılmadı. Compiler/cache kimliği output değiştiği için v30→v31 oldu; fidelity-v3-p08, schema v1, render ABI v2 ve worker bundle hash'i sabit kaldı. F07 yedi terminal kapısı 0/7 tam PASS, genel plan 14/19 ve 5 açık.

## 2026-09-26 — F07 iç R04 doğrudan LINE dışı stroke sözleşmesi

Uzun top-level CIRCLE/ARC/ELLIPSE/SPLINE ve genişliksiz LWPOLYLINE/BULGE stroke kaynakları sıralı, padded <=4.096 world-unit spatial aralıklara ayrılır. Analitik kaynak chordları bölünmez; source handle/type/parametre yan verisi worker için taşınır. Uzun düz polyline kenarında slice PATH_DISTANCE, source order ve bitiş noktaları korunur. Kısa kaynaklar eski painter sequence davranışında kalır.

Kaynak başına 256 tahmini spatial chunk bütçesi geçilirse geometri bir bütün korunur; NON_LINE_STROKE_SPATIAL_PARTITION_LIMIT_REACHED ve degraded zorunludur. Bu özel fallback 4.096 bbox ve yerel Float32 hassasiyetini taahhüt etmez. Bu tanı, direct LINE sınır tanısından ayrıdır.

Kanıt: CIRCLE/ARC/ELLIPSE/SPLINE yüksek-origin 4/3/3/3 chunk, binary CURVE_DATA ve worker kabulü; BULGE + düz continuation fazı, overlay painter sırası; 1.100.000 kenar / 600.000 radius / 299 kenar cap örnekleri. Tam CAD V2 unit, tsconfig.next ve host viewport-fetch Chromium 1/1 PASS. Test-kapsamlı tsconfig.json mevcut eski hatalar nedeniyle FAIL. Compiler/cache v32; pipeline p08, DV2SCN01 v1 ve render ABI v2. F07 0/7 tam terminal PASS; son belgeli genel plan 14/19. Nested/pafta, fill/glyph, tam dash/raster ve aynı-kaynak AutoCAD kabulü açık.

## 2026-09-26 — F07 iç R05 fill/glyph ve pafta chunk sözleşmesi

Uzun doğrudan HATCH/WIPEOUT/genişlikli LWPOLYLINE dolgusu kaynak sırasındaki tam üçgenler halinde <=4.096 world-unit hedefli gruplara ayrılır; topoloji ve alan korunur. Uzun TEXT/MTEXT/ATTDEF/ATTRIB çizgileri sıralı stroke spatial yoluna girer. Bölünemeyen büyük üçgen/glyph veya 256 grup üstü kaynak geometriyi atmaz; FILL_SPATIAL_PARTITION_LIMIT_REACHED ya da GLYPH_STROKE_SPATIAL_PARTITION_LIMIT_REACHED ve degraded verir. Bu istisna normal lokal hassasiyet zarfını taahhüt etmez.

Kanıt: dört HATCH adası 40.000 alan; genişlikli 12.000×20 polyline 240.000 alan, 12 üçgen; yüksek-origin TEXT/MTEXT bounded XY; oversized HATCH/WIPEOUT/glyph ve 299-edge cap tanıları; fill/WIPEOUT/LINE painter sırası. Gerçek Chromium host aktif pafta fetch 1/1, tam CAD V2 unit ve runtime tsconfig.next PASS. Test-kapsamlı tsconfig.json mevcut hatalarla exit 2. Compiler/cache v33, pipeline p08, DV2SCN01 v1, render ABI v2. F07 terminal 0/7 tam PASS; son belgeli plan 14/19. Nested/viewport-projected içerik, R06 composite ve AutoCAD kabulü açık.

## 2026-09-26 — F07 iç R06 statik bileşik hata sözleşmesi

Aynı chunk içinde kesişen dolgu ve doğrudan glyph geometri zarfı, dolgunun source-boundary/üçgen encode hatası ile glyph stroke uç nokta encode hatasının toplamını raporlar. Mekânda kesişen bitişik painter chunk çifti, her chunk'ın en güçlü statik geometri/encode sınırının toplamını raporlar. Dünya birimi ve aktif CSS px değerleri flat manifest ile hash index'te eşleşir; validator negatif/non-finite/çelişkili değeri reddeder. 0,25 CSS px hedefi aşan birleşik metrik degraded ve CHUNK_COMPOSITE_PRECISION_LIMIT_REACHED gerektirir. Uzak fill/glyph aynı-chunk etkileşim terimi sıfırdır.

Kanıt: yüksek-origin HATCH çift 2.384185791015625e-7, glyph çift 0.00008489787140318244, fill→glyph chunk çifti 1.1920928955078125e-7 ve aynı-chunk fill/glyph 0.000028610479930766117 world; her tekil terim hedefteyken toplam overrun testi. Hedefli test, tam CAD V2 unit ve runtime typecheck PASS; genel test tsconfig mevcut 212 tanıyla exit 2. Compiler/cache v34, pipeline p08, DV2SCN01 v1, render ABI v2. F07 terminal 0/7 tam PASS; son belgeli plan 14/19. Non-adjacent chunk, nested/viewport glyph, font outline, worker/GPU raster ve AutoCAD kabulü açık.

## 2026-09-26 — F07 iç R07 çok terimli shader sözleşmesi

Uygun düz hairline LINE ve açık düz genişliksiz PLINEGEN polyline, 2–12 işaretli ve sıfır olmayan desen terimini effective scale ile taşıyabilir. Pozitif terim çizgi, negatif terim boşluktur; PATH_DISTANCE global kaynak yolu boyunca ilerler ve chunk'ta sıfırlanmaz. İki terimli mevcut LineDashedMaterial korunur; diğer uygun terimler ShaderMaterial ile aynı periyotta değerlendirilir. Komut birleştirme yalnız desenler eşitse yapılır; tema/monokrom güncellemesi shader rengine ulaşır. Nokta, kalın ve kapalı polyline CPU fallback'tir.

Kanıt: 12.000-unit yüksek-origin LINE üç chunk; açık CENTER/PHANTOM/leading-gap polyline 1/6 chunk mesafe parity; gerçek Chromium CENTER 8 aynı koşu ve eşit hash, mevcut DASHED 5 aynı koşu/hash; hedefli linetype 12/12, tam CAD V2 unit ve runtime typecheck PASS. Compiler/cache v35, pipeline p08, DV2SCN01 v1, ABI v2. R07 geniş desen/ölçek/render kabulü PARTIAL, AutoCAD eşliği iddia edilmez. F07 terminal 0/7 tam PASS; son belgeli plan 14/19.

## 2026-09-26 — F07 R07 analitik bulge ve dot ara sözleşmesi

Widthless dashed bulge polyline için desen fazı kaynak yay uzunluğuna, kapalı kenara ve PLINEGEN kaynak köşesi semantiğine bağlandı. ARC/CIRCLE dot terimi sıfır uzunluklu WebGL primitive yerine sonlu teğet primitive taşır. Compiler/cache v36; DV2SCN01 schema v1, pipeline p08, render ABI v2. Kaynak/binary ve Chromium 1/36 chunk görsel hash eşliği sağlandı; native AutoCAD ve kalan R07 profilleri açık olduğundan F07 terminal 0/7 tam PASS değişmedi.

## 2026-09-26 — F07 R07 kalın DASHED ara sözleşmesi

CAD V2 host başlangıç showLineweights ayarı renderera uygulanır; erişilebilir düğme basılı durumunu açıklar. CPU geniş DASHED fazı kaynak linetypeScale 2 ile 0,13–1,00 mm ağırlıklarda binary tek/çok chunk aynı kalır. Gerçek WebGL tek/5 chunk tam ekran görüntüsü eşit, canlı off/on kırmızı piksel maskesi geri gelir. Compiler/cache v36 değişmedi; pipeline p08, schema v1, ABI v2. Native AutoCAD ve kalan R07 profilleri açık; F07 terminal 0/7 tam PASS.

## 2026-09-26 — F07 R07 aynalı blok ve pafta faz ara sözleşmesi

Kesikli LINE kaynak deseni affine INSERT dönüşümünden önce açılır; kaynak PATH_DISTANCE aynalama ve viewport clipping sırasında korunur. Pafta sınırında sıfır uzunluklu dash primitive üretilmez. Kaynak/binary 1/5 ayna ve 1/3 ölçekli pafta, gerçek Chromium/WebGL2 aynı chunk-partition görünüşünü verdi. Compiler/cache v37; pipeline p08, DV2SCN01 schema v1, render ABI v2. Kompleks linetype, diğer affine kaynak aileleri ve AutoCAD oracle açık; F07 terminal 0/7 tam PASS.


## 2026-09-27 — F07 R07-E complex LTYPE decode checkpoint

R07-E bu turda yalnızca kaynak tablosu taşınması ve kayıp uyarısı bakımından kısmi ilerledi. DXF ASCII/binary group-pair taraması, data-model 1.14.2'nin düşürdüğü group 75/340/46/50/44/45/9 alanlarını koruyor; DWG LibreDwg LTYPE entries canonical tabloya alınıyor. Dash/gap/dot pattern canonical'da kalıyor. Shape/text glifleri çizilmediğinden R07-E AÇIK/KISMİ; uyarı `UNSUPPORTED_COMPLEX_LINETYPE_ELEMENT` scene quality summary'ye geçiyor ve kaliteyi degraded tutuyor.

Kaynak kimliği: branch `codex/srdr-dwg-motor-v2-fidelity`, HEAD `4b51ebe6b1470c6a247e03158dfe4b5359621c97` (dirty); compiler/cache v37→v38, pipeline p08, DV2SCN01 schema 1, render ABI `three172-cad2d-v2`. Ana plan kabul kapsamı daraltılmadı. F07 kapıları 0/7; genel planın 14/19 sayısı tarihsel ve bu checkout için topluca yeniden doğrulanmadı.

Doğrulama: `complex-linetype.test.ts` ASCII ve binary DXF'de [5,-2,0,-1], toplam 8 ve shape/text metadata eşitliğini; sahne tanısını, `qualityStatus=degraded` ve `isContinuous=false` sonucunu doğruladı. Aynı test DWG converter şekilli kaydını kontrol etti. R001 decoder sözleşmesi 8 canonical LTYPE kaydı gördü, fakat libredwg aynı çalıştırmada error code 68 yazdı. Pinned enum'da 68, UNHANDLEDCLASS (4) + VALUEOUTOFBOUNDS (64); bu nedenle R001 sayımı LTYPE tablosunun mevcut olduğunu kanıtlar, tam/kayıpsız DWG decode'u değil. `linetype-phase.test.ts`, `cache-identity.test.ts` ve ilgili scoped TypeScript kontrolü PASS. Tam CAD V2 release veya AutoCAD oracle çalıştırılmadı.

SHA-256: test `EC209F51EC577FB77C0BEEE171E8C80F3B16188715010D060D35B0359340DEBF`; ASCII fixture `DDFC5AE7D57860B35B4EC66A653D247E6A9DFAD658E739ECC132EFB2EB6B0DD9`; R001 DWG `17A92CB544830845FC59717ABCC22D3CDCF97C12B8450602C9C70EC4A507F086`. Sonraki iş: text/shape gliflerini linetype fazı ve chunk sınırlarıyla birlikte gerçek scene geometry olarak üretmek; SHX/style desteği ve same-source AutoCAD kıyası ayrıca açık.

## 2026-09-27 — R07-E STYLE table bridge and flag correction

DXF STYLE group pairs and LibreDwg `tables.STYLE.entries` now populate canonical `textStyles`, including source object handle, available font/bigfont names, fixed height, width factor, oblique angle, vertical flag and shape-file flag. Unnamed shape-file entries remain addressable by handle. This supplies source metadata for later glyph work; it does not emit complex-linetype glyph geometry. LibreDwg emits zero-valued shape/text defaults on ordinary DWG dash elements, so the mapper now ignores those defaults instead of attaching false complex metadata or warnings. Compiler/cache identity advanced v38→v40; pipeline p08, schema 1 and ABI v2 are unchanged.

The complex-linetype fixture now follows Autodesk DXF group 74 semantics (bit 1 absolute rotation, bit 2 text, bit 4 shape) and ties element STYLE handles to decoded STYLE records. ASCII/binary DXF, synthetic DWG-style mapping, R001's 12 observed STYLE records (`Standard`→`arial.ttf`), F04 font layout, F03 linetype phase, P04 decoder contract, cache identity and scoped TypeScript checks passed. R001 still logs libredwg error 68; this verifies observed table mapping only and is not clean DWG acceptance. A one-off audit of the three available project DWGs after normalization found 14/6/8 LTYPE records and zero complex glyph flags/warnings; two inputs logged decoder errors 64 and 68, so these are false-positive prevention evidence, not a complex-DWG fidelity oracle. No `.shx`/`.lin` asset is present in the worktree or `public/fonts`. Glyph geometry, DWG complex dash style-handle recovery, rendered phase/chunk comparison and native AutoCAD remain open.

## 2026-09-27 — R07-E DWG dash STYLE-reference recovery path

Before the native DWG buffer is freed, the adapter now scans LTYPE dash records and resolves each `dash.style` reference with the pinned Libredwg `dwg_ref_get_id` API. It accepts only IDs that match handles from the decoded STYLE table and joins them by LTYPE name and pattern index; an ID already supplied by a future converter is preserved. The pinned converter source identifies `styleObjectId` as a TODO, and its public dash type exposes `style` as a native reference pointer. This closes the adapter path, not the real-fixture acceptance: available DWGs have no populated complex dash STYLE reference, and R001 continues to log error 68.

The former in-test pair injection is now the standalone synthetic `tests/fixtures/cad-preview-v2/r07-complex-linetype-placement.dxf`. It exercises shape/text group 74, shape number 75, STYLE handle 340, scale 46, rotation 50, offsets 44/45 and text 9 in ASCII and binary DXF. The font resources are absent, so scene quality remains degraded and no glyph/raster result is claimed. `dwg-linetype-style-refs.test.ts`, `complex-linetype.test.ts`, R001 P04 decoder contract, F03 12 gates, cache identity and scoped TypeScript checks passed. Compiler/cache v40→v41; schema 1, pipeline p08 and ABI v2 unchanged. F07 remains 0/7 and the historical count 14/19 is unchanged.

## 2026-09-27 — R07-E straight LINE complex glyph geometry

Compiler/cache revision v42 adds `compile/complex-linetype-glyphs.ts`: complex LTYPE elements resolve their STYLE handle against canonical `textStyles`; exact SHX shape geometry comes from `ShxFont.getLayoutCharShape`, and embedded text reuses `FontLayoutEngine.layoutTextDetailed`. Pattern-index distance plus cycle length places each symbol in source coordinates. Group 74 absolute rotation and relative-to-line rotation, element scale, X/Y offsets and effective linetype scale are applied before INSERT/viewport transforms. Direct LINE compilation and `EntityVisitor` emit ordered stroke primitives so existing bounded chunking carries the geometry. Numeric dash/gap/dot strokes remain and the pattern does not fall back to continuous.

Decoder now preserves source fields without deciding rendering support before font resolution. At compile time, an unresolved STYLE/font/shape, unsupported payload/flag, or glyph-instance cap produces `UNSUPPORTED_COMPLEX_LINETYPE_ELEMENT` and `qualityStatus=degraded`; an exact font profile emits geometry without this unsupported diagnostic. The fixture's absent `simplex.shx` still degrades. A synthetic in-memory SHX shape plus bundled Arial TTF test verifies geometry, group 74 rotation modes, repeated placement around the 4096-unit chunk boundary and mirrored INSERT coordinates. This is a deterministic local compiler fixture, not a real DWG SHX resource or AutoCAD raster oracle; curved-source glyph placement remains open.

Verification: `npx tsx tests/cad-v2/complex-linetype.test.ts`, `path-distance-multiterm.test.ts`, `transformed-dash-phase.test.ts` and `cache-identity.test.ts` PASS. Scoped TypeScript compilation of changed CAD modules/test PASS. `npx tsc --noEmit --incremental false` exits 2 from existing unrelated repository script/test diagnostics; the changed CAD source/test paths have no matching diagnostics after the BigInt target correction. `git diff --check` reports pre-existing CRLF whitespace in already-dirty living documents; implementation files are checked separately. F07 remains 0/7 complete terminal gates; overall 14/19 is historical, not reaccepted. Real complex DWG reference, actual SHX asset, curved glyphs, native AutoCAD raster/measurement and full-plan acceptance remain open.

## 2026-09-27 — R07-E curved-source complex glyph placement (compiler/cache v43)

Complex glyph placement now uses a source-path station model. ARC, CIRCLE and LWPOLYLINE bulge edges use analytic arc length, point and tangent evaluation; straight polyline edges compose into the same path. `PLINEGEN=0` starts a separate pattern path at each edge, while generated paths keep the entity-wide phase. Full-circle closure is exclusive so the first symbol is not duplicated. ELLIPSE and SPLINE use their bounded tessellated path. The helper returns source-space geometry; scene compilation and `EntityVisitor` transform those strokes afterwards for direct, nested and mirrored entities. Curve glyphs join normal ordered/spatial chunk handling.

Synthetic SHX tests check six anchors on a 90-degree radius-50 ARC, 21 non-duplicated anchors on a radius-50 CIRCLE, 11 anchors across a radius-50 semicircle bulge, and direct large-circle chunk output against a no-glyph baseline. `PLINEGEN=1` continues phase across the polyline vertex; `PLINEGEN=0` restarts it on each edge. A nested mirrored ARC produces the expected glyph count. Regression controls passed: `complex-linetype.test.ts`, `analytic-bulge-dash.test.ts`, `path-distance-multiterm.test.ts`, `transformed-dash-phase.test.ts`, `direct-line-spatial-partition.test.ts`, `non-line-stroke-spatial-partition.test.ts`, `cache-identity.test.ts` and scoped TypeScript compilation. The direct-line test's obsolete v37 literal was changed to compare the manifest with the active compiler revision; it then passed.

Compiler/cache v42→v43; pipeline p08, schema 1 and ABI v2 unchanged. F07 terminal gates remain 0/7, overall 14/19 remains historical. E's local curved-placement scope is implemented, but no positive complex-DWG style reference, distributed SHX, or native AutoCAD/raster oracle is available. ARC/CIRCLE/BULGE phase is analytic; ELLIPSE/SPLINE phase follows the compiler's tessellated path. R07-E remains partial and its external-source/native acceptance remains open. Next local scope: R07-F affine curved-source profile and transformed/chunk phase behavior.

## 2026-09-27 — R07-F affine curve glyph profile and nested spatial partition (compiler/cache v44)

R07-F local affine profile is now explicit: ARC/CIRCLE/LWPOLYLINE bulges use analytic source stations; ELLIPSE/SPLINE use the compiler's bounded source tessellation stations. A synthetic SHX fixture passes glyph source geometry through two nested INSERTs with reflection, non-uniform scales, rotations and the resulting affine/shear composition. The visitor's additional segments are compared against each source glyph segment transformed by the composed matrix; this checks placement, tangent-relative angle, rotation and offsets, rather than stroke count alone.

The large nested radius-4200 CIRCLE exposed a spatial partition gap: its expanded child strokes stayed in one range because the scene compiler only classified top-level curve types. Compiler/cache identity advanced v43→v44. Large INSERT expansions whose ordered line-stroke span exceeds 4096 world units now enter the existing bounded range partition; the emitted glyph delta matches the source station count across Model chunks, and paper viewport projection retains the same count. Source painter order stays within the existing ordered group; the existing slice cap remains fail-visible/degraded.

Verification passed: `complex-linetype.test.ts`, `direct-line-spatial-partition.test.ts`, `non-line-stroke-spatial-partition.test.ts`, `transformed-dash-phase.test.ts`, `painter-order.test.ts`, `entity-instance-parity.test.ts`, `block-expansion-budget.test.ts`, `cache-identity.test.ts`, runtime `tsconfig.next` typecheck, strict typecheck of the complex-linetype test and `git diff --check` for changed product source. The complex test first reproduced the missing nested partition, then passed after v44.

R07-F remains partial: no Chromium/WebGL pixel-mask comparison was run for the nested affine glyph profiles. R07-E still lacks a positive complex DWG dash STYLE reference and distributable real SHX. AutoCAD/native raster evidence remains R10-owned. F07 terminal acceptance remains 0/7; overall plan 14/19 is historical, not reaccepted. Next: browser raster mask comparison for transformed nested glyphs under single/split chunk and viewport profiles.

## 2026-09-27 — R07-F nested affine SHX browser raster (compiler/cache v44)

Added a bounded compiler scene fixture and Chromium acceptance for a curved SHAPE glyph source nested under reflected, non-uniformly scaled and rotated INSERTs. The exact in-memory SHX fixture is synthetic. The same canonical document is compiled with one Model/paper chunk and with primitive chunk cap 1; both manifests must remain `exact` with no diagnostic codes. The browser compares full WebGL screenshots and red-pixel masks in Model and the paper viewport.

Chromium PASS (1 test, 29.2 s): Model chunks 1/52 had 1,427 red-mask pixels, checksum `2274897639`, PNG SHA-256 `dadeb8a9a163248bf7bfab822b0ea3f6e92dcc7929b8c559900b54062804f232`; paper chunks 1/46 had 2,512 red-mask pixels, checksum `2058749244`, PNG SHA-256 `042215ee2da430e27c77cf528c5a507df58ae56f0d0f2ed3574864421d9d3733`. Single/split masks and full screenshots matched in both layouts. The first browser attempt exposed fixture-harness issues (the picker uses the visible layout name; a synthetic heartbeat otherwise receives a real expired-session response); the harness now uses the displayed name and a successful heartbeat. No product behavior or acceptance threshold was changed.

`npx tsc --noEmit -p tsconfig.next.json --incremental false` and `npx tsx tests/cad-v2/complex-linetype.test.ts` also PASS. Compiler/cache remains v44, pipeline p08, schema 1, ABI `three172-cad2d-v2`. Fixture/spec hashes are in `uygulama__IZLENEBILIRLIK.md`. This closes R07-F's local synthetic browser profile only; R07-E positive complex DWG/real SHX and R07-H/R10 same-source AutoCAD remain open. F07 terminal gates remain 0/7 and overall 14/19 remains historical. Next: R07-G scale-semantics inventory and a finite model/paper/annotation profile matrix.

## 2026-09-27 — R07-G global/entity and PSLTSCALE profile (compiler/cache v45)

Autodesk semantics were checked before changing the old Gate 5 formula: an existing entity's effective linetype scale is its saved entity scale (DXF group 48) multiplied by global `LTSCALE`; `CELTSCALE` is the default applied as entities are created. `PSLTSCALE` and `MSLTSCALE` are 0/1 modes, not numeric multipliers. The old synthetic test's `entity × global × CELTSCALE × numeric PSL/MS factors` expectation was corrected; PSL/MS flags no longer masquerade as scale factors.

Canonical documents now retain `globalScale`, `currentEntityScale`, `paperSpaceViewportScaling` and `modelTabAnnotationScaling`. DXF ASCII and binary HEADER records preserve all four when present (including `$MSLTSCALE`, omitted by data-model 1.14.2); DWG adapter reads header values exposed by LibreDWG and leaves unsupported MSLTSCALE absent. Direct scene compilation and nested `EntityVisitor` paths receive global LTSCALE. Paper viewport projection applies the inverse uniform model-to-paper scale when PSLTSCALE=1; PSLTSCALE=0 keeps model-space dash periods, while paper-space entities use global scale in their own units.

`tests/cad-v2/linetype-scale-settings.test.ts` verifies ASCII/binary HEADER and group 48 decoding, direct dash size 60 from `[10,-10] × entity 3 × LTSCALE 2`, nested INSERT output at global scale 1/2 (20/10 XY vertices), and a 1:10 paper viewport: PSL=1 emits two 10-unit paper dashes; PSL=0 emits fifteen 1-unit dashes in the clipped 30-unit span. An existing curved-glyph viewport oracle was updated to independently derive its expected glyph count at the PSLTSCALE-adjusted effective scale; no threshold was relaxed. `complex-linetype`, linetype-phase (12 gates), layout-viewport render/parser and cache identity tests pass. Scoped runtime TypeScript passes. Whole-repository `tsc` still exits with diagnostics in unrelated scripts/tests; it is not reported as PASS.

Autodesk references: [entity linetype scale and CELTSCALE](https://help.autodesk.com/cloudhelp/2022/ENU/OARX-DevGuide/files/GUID-FF5299A3-CE1C-4A4F-8FB6-B835015773A6.htm), [CELTSCALE](https://help.autodesk.com/cloudhelp/2026/ENU/AutoCAD-Core/files/GUID-ECE175AB-AB7B-4DEC-9CEC-D5D67AF9310B.htm), [PSLTSCALE](https://help.autodesk.com/cloudhelp/2016/ENU/AutoCAD-Core/files/GUID-23EA4D64-AE7D-41E5-A8D0-20F060313D62.htm), [MSLTSCALE](https://help.autodesk.com/cloudhelp/2022/ENU/AutoCAD-LT/files/GUID-023B046C-56EA-463C-A867-DF713666A69E.htm).

This closes only the local global/entity + PSLTSCALE portion of R07-G. MSLTSCALE rendering remains open because the selected model-tab annotation scale is not yet carried from host view state into the compiler; scale matrices beyond the tested 1:10 viewport remain open. R07-E still lacks a positive complex DWG/real SHX, R07-H/R10 AutoCAD same-source evidence remains NOT_RUN, F07 terminal gates are 0/7, and overall 14/19 is historical. Compiler/cache v44→v45; schema 1, pipeline p08 and ABI `three172-cad2d-v2` unchanged. Exact source/test hashes and command output are in `uygulama__IZLENEBILIRLIK.md`. No remote write was performed.

## 2026-09-27 — R07-G etkin annotation scale profili (compiler/cache v46)

Autodesk MSLTSCALE, Model sekmesindeki linetype desenlerini etkin annotation scale'e göre ölçekler. AnnotationScale scale factor, paper units / drawing units oranıdır. DXF okuyucu CANNOSCALE değişken sözlüğü girdisini DICTIONARYVAR değeri ve eş adlı SCALE kaydıyla çözer; ASCII ve binary akışlar desteklenir. Sonuç canonical linetypeScaleSettings içine modelTabAnnotationScaleFactor olarak taşınır. Derleyici yalnız Model layout'unda MSLTSCALE=true ise LTSCALE'i bu değerle çarpar; PSLTSCALE ve paper layout akışları bundan etkilenmez. Eksik/geçersiz etkin ölçek MSLTSCALE profilini sessizce exact göstermez; MODEL_ANNOTATION_SCALE_UNRESOLVED ile degraded olur.

Yerel kabul: AutoCAD DXF fixture'ında 1:1; sentetik named scale zincirinde ASCII/binary 1:50 → 0.02; doğrudan global 2 × entity 3 × annotation 0.02 → 1.2 dash; nested INSERT factor 0.5 → 40 XY vertex. Eksik factor tanısı ve paper-profile yalıtımı doğrulandı. R07-G kısmi kalır: installed LibreDWG şeması current scale record/factorını taşımıyor; geniş ölçek matrisi, pozitif complex DWG/real SHX ve AutoCAD same-source kıyası açıktır. F07 terminal kapıları 0/7; genel 14/19 tarihsel.
## 2026-09-27 — R07-G finite annotation-scale matrix and view-refinement independence (v46)

This test-only continuation closes the selected finite DXF scale profile. The parser matrix covers active CANNOSCALE ratios 1:1, 1:2, 1:50 and 2:1 in ASCII and binary DXF, with an additional differently named inactive SCALE entry to ensure the active DICTIONARYVAR name wins. The compiler matrix consumes the factors actually returned by the parser: pattern [10,-10] × entity scale 3 × global LTSCALE 2 yields equal dash/gap lengths 60, 30, 1.2 and 120. Each resolved Model profile remains exact.

Two fail-closed controls are included: zero paper units and duplicate named SCALE records produce no factor; feeding the unresolved result to MSLTSCALE=true keeps MODEL_ANNOTATION_SCALE_UNRESOLVED and degraded quality. A paired active-view profile changes unitsPerCssPixel from 0.01 to 1 while target curve error stays 0.25 CSS pixels. ARC tessellation changes, but direct-line dash metadata remains identical. This only establishes world-unit linetype metadata independence from view/refinement inputs; on-screen dash pixels naturally change with zoom.

Verification: npx tsx tests/cad-v2/linetype-scale-settings.test.ts PASS. Strict targeted TypeScript check of the test and src/types/opentype.d.ts PASS. An initial ad-hoc targeted TSC omitted the ambient opentype declaration and returned TS7016; adding the existing declaration fixed the command without a product edit. Production source is unchanged, so compiler/cache stays v46, pipeline p08, schema 1, ABI three172-cad2d-v2. Scoped runtime TSC and repository-wide TSC were not rerun in this test-only subgroup. R07-G remains partial; F07 terminal gates 0/7 and overall 14/19 remain historical. DWG active-scale field support, positive complex DWG/real SHX, and R10 same-source AutoCAD evidence remain open.

## 2026-09-27 — R08 emulated-DPR3 ELLIPSE 156% raster cell

This is a local synthetic runtime raster checkpoint, not a native-device or AutoCAD parity claim. The existing Document Studio host → scene worker → WebGL path was extended so the emulated-DPR3 ELLIPSE profile records fit/pan and then actual UI zoom through 125% and 156%. At 156%, the camera is (624.375,328.1875,k=9.5) and the fit-relative pan is (-15.625,-7.8125) CSS px.

| Item | Result |
|---|---|
| Emulated browser/device | Chromium deviceScaleFactor=3; CSS canvas 1280×672; renderer buffer remains capped at 2× (2560×1344); device screenshot 3840×2016 |
| Runtime refinement | 0.75→0.25 CSS px at fit, 125%, and 156%; 6/6 replies; no pending reply; 42 maximum line vertices |
| Independent raster oracle | 4097 analytic parametric samples; 3404 selected pixels; render→source 0.6774800229 CSS px; source→render 0.3755782579 CSS px; both ≤1.25 |
| Existing fit/pan cell in the same run | 2198 pixels; render→source 0.7085877543 CSS px; source→render 0.2589010743 CSS px |

The targeted Playwright command npx playwright test tests/document-studio/cad-v2-layout-viewport.spec.ts --project=chromium --grep "156% zoom when emulated DPR3" --reporter=line passed 1/1 in 55.5 seconds. The updated test source SHA-256 is 03C45E4A2FDDC79F6C006097F5C43112B55CFC65AD31034BD20446C8F6D613EB. Compiler/cache v46, pipeline p08, schema 1 and render ABI v2 did not change. This closes one local high-zoom cell only: other source-family/zoom combinations, physical DPR3 hardware (R09), and same-source AutoCAD (R10) remain open.

## 2026-09-27 — R08 emulated-DPR3 rational SPLINE at 156% with pan

Extended the live Document Studio host → refinement worker → WebGL synthetic rational SPLINE profile. It retains its measured 80% zoom-out/pan cell, then settles 100%, 125% and 156% zoom refinements, applies a real (+24,+12) CSS-pixel pan at 156%, and measures a second independent raster cell. At DPR3 emulation the drawing buffer remains capped at 2×; CSS viewport is 1280×672 and device screenshot is 3840×2016. Fit camera is (640,336,k=6.08); at 80% after (-10,-5) pan it is (630,331,k=4.864); the 156% camera before the final pan is (620.46875,326.234375,k=9.5), then (644.46875,338.234375,k=9.5).

| Cell | Independent oracle / raster | Worker / quality | Result |
|---|---|---|---|
| 80% after pan | 4097 samples; 3273 pixels; source bounds [464.624,223.992]..[795.376,418.552] CSS px | 4/4 replies; maximum 96 line vertices | render→source 0.6668573448; source→render 0.2322079741 CSS px |
| 156% after pan | 4097 samples; 6390 pixels; source bounds [321.46875,129.234375]..[967.46875,509.234375] CSS px | 10/10 replies; final target 0.25 CSS px; max 110 line vertices; final pan queued no refinement | render→source 0.6433524477; source→render 0.4022573566 CSS px |

Both directed distances satisfy the unchanged 1.25 CSS-pixel raster envelope, and the full independent source bounds remain in the viewport. The 100% and 125% zoom steps are refinement-settled observations, not independent raster measurements.

Verification: `npx playwright test tests/document-studio/cad-v2-layout-viewport.spec.ts --project=chromium --grep "80% and 156% zoom-pan" --reporter=line --workers=1 --timeout=90000` passed 1/1 in 1.0 minute. Updated test source SHA-256: `A5F7CA4A3A02E1403ED93A79D4E96E032BA02EEAB18BC8064D176EB473D41195`. This is test/evidence only; compiler/cache v46, pipeline p08, schema 1 and ABI v2 are unchanged. R08/G6 remains partial, F07 terminal gates remain 0/7, and overall 14/19 remains historical; DPR3 ARC, physical-device R09 and same-source AutoCAD R10 remain open.

## 2026-09-27 — R08 emulated-DPR3 ARC fit-pan and 195% pan raster

The synthetic quarter-circle ARC now has a live Document Studio host → refinement worker → WebGL profile under Chromium deviceScaleFactor=3. The WebGL buffer remains capped at 2× (CSS 1280×672, drawing buffer 2560×1344, device screenshot 3840×2016). After fit settles, a (+48,+24) CSS-pixel pan is raster-measured; UI zoom then settles 100%, 125%, 156% and 195%. A second (+48,+24) pan at 195% does not add refinement work. The final camera is k=11.875 at (781.75,406.875); fit-relative total pan is (141.75,70.875).

An independent 4097-sample quarter-circle raster oracle measured 2737 pixels at fit-pan (render→source 0.7535568878, source→render 0.2524335670 CSS px) and 3514 pixels at 195% pan (0.7321633267 / 0.2658020055 CSS px). The latter uses viewport clipping and the visible source-angle interval [0,1.0286029931] radians. Both bidirectional errors satisfy the unchanged 1.25 CSS-pixel bound. Refinement ended at .25 CSS px with 8/8 replies and maximum 46 line vertices. Intermediate zoom steps are refinement evidence, not separate raster cells.

Verification: targeted Chromium Playwright passed 1/1 in 48.8 s; command and current whole-test-file SHA-256 `568D5DC50E40E89140E6EDB025BCA7CDB2AD6275EAB62BC2DFDF54BD27C9D28E` are recorded in `uygulama__IZLENEBILIRLIK.md`. Scoped test-file `git diff --check` passed. Test-only: compiler/cache v46, pipeline p08, schema 1, ABI v2 unchanged. G6/R08 remains partial; physical DPR3 R09, residual source-family/zoom raster matrix and same-source AutoCAD R10 remain open. F07 terminal gates remain 0/7 and overall 14/19 is historical. No commit/push/PR/deploy.

## 2026-09-27 — R08 emulated-DPR3 rational SPLINE 195% pan raster

Extended the existing DPR3 rational SPLINE host→worker→WebGL profile from its measured 80% and 156% cells to a 195% zoom plus a real (+24,+12) CSS-pixel pan. The 195% camera is k=11.875 at (669.5859375,350.79296875); the independent 4097-sample rational Bernstein oracle selects 7993 pixels with source bounds [265.8359375,89.54296875]..[1073.3359375,564.54296875] CSS px, all inside the viewport. Render→source error is 0.6696125902 CSS px and source→render gap is 0.2561999628 CSS px, both within the unchanged 1.25 CSS-pixel bound.

Worker refinement settled at .25 CSS px with 12/12 replies and max 114 line vertices. The final pan did not schedule another refinement. The targeted Playwright command `npx playwright test tests/document-studio/cad-v2-layout-viewport.spec.ts --project=chromium --grep "80% and 195% zoom-pan" --reporter=line --workers=1 --timeout=90000` passed 1/1 in 1.2 minutes. Whole test-file SHA-256: `8AB8F0514FF26D17EC16C88A1A3A57D161782E602057529237E4BA0586C2C05B`. Test-only; `git diff --check` scoped to this test passed, compiler/cache v46, p08, schema 1 and ABI v2 unchanged. Browser DPR3 remains emulated with the renderer buffer capped at 2×; G6/R08, physical R09 and AutoCAD R10 remain open. F07 terminal gates remain 0/7; overall 14/19 is historical.

## 2026-09-27 — R08 emulated-DPR3 ELLIPSE 195% pan raster

Extended the existing synthetic quarter-ELLIPSE host→worker→WebGL profile through 195% UI zoom and an actual (+24,+12) CSS-pixel pan after the prior 156% measurement. The final camera is (644.46875,338.234375,k=11.875), with pan-relative offset (4.46875,2.234375). The independent analytic quarter-ellipse oracle sampled 4097 source points and selected 4289 raster pixels; the full angular source interval [0,π/2] remained visible. Render→source distance is 0.7001692267 CSS px and source→render coverage gap is 0.4022573566 CSS px, both within the unchanged 1.25 CSS-pixel limit.

Refinement settled at .25 CSS px with 8/8 replies and max 46 line vertices; the final pan did not enqueue another refinement. Final targeted Playwright passed 1/1 in 57.2 s: `npx playwright test tests/document-studio/cad-v2-layout-viewport.spec.ts --project=chromium --grep "195% zoom and pan when emulated DPR3" --reporter=line --workers=1 --timeout=90000`. Current whole-test-file SHA-256: `40C31D08A78F6FBE0DD747D3A8167D89749AB3E1C295DF66293D38FED45C10B`. Two earlier attempts exposed a test-only zoom sequencing error: 195% was inserted before code still asserting 156%; a broad edit also temporarily omitted DPR2 ARC's 195% step, which was restored before the passing run. The 156% measure now precedes a distinct 195% step; thresholds and runtime/product code are unchanged. Scoped `git diff --check` passed. Browser DPR3 is emulated with a 2× buffer cap; R08/G6 remains partial, R09 physical device and R10 AutoCAD remain open. F07 terminal gates remain 0/7; overall 14/19 is historical.

## 2026-09-27 — F07 G6 / R08 DPR3 125% pan raster trio

Added 125% settled-zoom pan raster measurements to the synthetic ARC, ELLIPSE and rational SPLINE Chromium profiles. The 125% camera scale is k=7.6. ARC ends at (724,378) after total fit-relative pan (84,42); its adaptive quarter-circle oracle places 957 points at ≤0.5 CSS-pixel arc spacing and matches 3402 pixels with directed errors 0.7130987918/0.2712624842 CSS px. ELLIPSE ends at (651.5,341.75), pan offset (11.5,5.75); its 4097-point analytic quarter-ellipse matches 2746 pixels with errors 0.6766723248/0.2552488787. Rational SPLINE ends at (648.375,340.1875), pan offset (8.375,4.1875); its 4097-point Bernstein oracle matches 5147 pixels, source bounds [389.975,172.9875]..[906.775,476.9875], and errors 0.5827244287/0.2459745357. Every source quarter/profile remains fully visible and all directed errors satisfy the unchanged ≤1.25 CSS-pixel limit.

All three contexts emulate DPR3 with a 1280×672 CSS viewport, a 2560×1344 WebGL buffer cap, and 3840×2016 device screenshots. At 125%, worker states settle to the .25 CSS-pixel target; ARC and ELLIPSE have 4/4 cumulative replies and max 40 line vertices, SPLINE has 8/8 and max 110. The measured pan itself adds no refinement request; tests reset the pan before continuing their existing higher-zoom checks.

Verification: the targeted Chromium Playwright selection passed 3/3 in 2.9 min; command and whole-test-file SHA-256 `B4744DA1C0E4C2223E03EC1DE0290281041A43B89A9031DE8B93F38E074D59E3` are in `uygulama__IZLENEBILIRLIK.md`. Scoped `git diff --check` passed. This is test-only; runtime/product code and threshold are unchanged, so TSC was not rerun. R08/G6 remains partial because no complete geometry×zoom×DPR cross-product was specified. R09 physical-device and R10 same-source AutoCAD evidence remain open; F07 terminal acceptance is 0/7 and overall 14/19 remains historical.

## 2026-09-27 — F07 G6/R08 formal acceptance coverage audit

The current precision-refinement unit suite satisfies the plan's minimum of four zoom levels × DPR 1/2/3: zoom [1,8,64,512], tolerance 0.25/(zoom×DPR), maximum device-scaled sagitta ≤0.250001 px, 12/12 profiles passing. Command: npx tsx tests/cad-v2/precision-refinement.test.ts; PASS in 1.3 s. Whole-test source SHA-256: DE31C8AC07C6DE33C7E6C0E6E382DDE95FDF88051643E132D579C94E6DB9127D.

The test verifies the budget solver, not production camera wiring. Existing selected live browser profiles were inventoried separately into measured-raster and refinement-only zooms for ARC, ELLIPSE and rational SPLINE at DPR1/2/3; the main plan does not require every geometry×zoom×DPR Cartesian cell. The prior DPR3 125% trio result is recorded in its prior group and was not rerun here. No finite additional R08 raster requirement was identified; optional unlisted cross-product effort remains unestimable. R08/G6 stays partial for physical-device R09 and same-source AutoCAD R10; F07 terminal gates 0/7 and overall 14/19 are historical. No runtime/test source change; TSC not rerun.

## 2026-09-27 — F07 G3/R04 nested non-LINE and viewport-projected stroke partition (compiler/cache v47)

The compiler now applies the same bounded spatial-range classification to non-LINE strokes emitted through paper-viewport projection as to root-space strokes. The classifier retains the existing 4096-world-unit span threshold, 256-chunk cap and degraded diagnostic. Nested INSERT coverage uses two affine levels and includes CIRCLE, ARC, ELLIPSE, SPLINE and bulged LWPOLYLINE sources at high origin, followed by a later overlay. The oracle verifies 25 ordered chunks, maximum chunk-bounds span 4093.360040664673, source-family/provenance sidecars and local Float32 extents. The projected paper-space CIRCLE profile yields four chunks with maximum span 844.033254477853 and preserves painter order. The viewport test failed before the compiler change and passed after it.

Compiler/cache identity advanced v46→v47 because chunk eligibility changes compiled output; pipeline p08, DV2SCN01 schema 1 and render ABI v2 are unchanged. scene-compiler.ts SHA-256: AB1A0435B2BBF560D5EF3282012BA917988F31A73A245F0FD765C1274EC948B5; version.ts: 9D2BE9C5C87343F7EC22012C637F04133189209C63C8935A391E8B34460B10D1; test: CEBCEB0326CEA0312184AF06D5030D289817F4FE816FE4285BB8213995B49F44.

Current-revision checks passed: npx tsx tests/cad-v2/non-line-stroke-spatial-partition.test.ts, npx tsx tests/cad-v2/cache-identity.test.ts, and npx tsc --noEmit --project tsconfig.next.json. The affine OCS, bounds/provenance, block-expansion-budget and entity-instance-parity evidence producers also passed and refreshed their JSON records. The bounds test logged LibreDWG error 68 while exercising its project input; its specific bounds/provenance assertions passed, which is not a clean-decode claim. npm run check:cad-v2:unit passed after the compiler behavior change but before the v47 identity bump and expansion of the nested matrix from a single family to five; focused R04/cache/typecheck checks were rerun at v47. This closes the selected R04 spatial stroke group, not G3: on-demand fetch, remaining global bounds/cap profiles, R05 fill/glyph and native R09/R10 remain open. No commit, push, PR or deploy.
## 2026-09-27 — F07 G3/R05 nested glyph ve görünür chunk çağrıları (v48)

İki seviyeli INSERT içindeki TEXT/MTEXT/ATTRIB/ATTDEF visitor segmentlerinin glyph kimliği sahneye ve paper viewport projeksiyonuna taşınıyor. Örtüşen doğrudan HATCH fill + nested glyph profillerinde model/pafta encoded-error bileşik alanı artık sıfır değil; uzun nested glyph her iki layout'ta bounded spatial chunk üretiyor. Host kaynak çağrıları ilk görünüm, kamera değişimi ve pafta seçiminde yalnız görünür chunk'ları istiyor; seçili Chromium testleri 2/2 PASS. v48 tam CAD unit zinciri ve runtime TSC PASS. LibreDWG error 68 temiz decode kanıtı değildir. Visitor nested HATCH/WIPEOUT fill mesh taşımıyor; viewport da yalnız segment projeksiyonu yapıyor. Bu R05/G3/G4 geniş kabulü açık bırakır; F07 terminal 0/7, genel 14/19 tarihsel. Commit/push/deploy yok.

## 2026-09-27 — F07 G3-G4/R05 nested ve viewport fill mesh (v49)

EntityVisitor artık nested HATCH solid mesh ve WIPEOUT mesh’lerini dönüştürülmüş fill primitive olarak taşır; segment/fill sırası `drawItems` ile korunur, scene compiler bu sırayı INSERT, dimension visitor ve paper viewport yollarında tüketir. Normal convex XCLIP mesh’i keser. Inverted veya concave/invalid clip durumunda fill fail-closed atlanır ve `UNSUPPORTED_FILL_CLIP` kalite tanısı sahneyi degraded yapar. Paper viewport HATCH mesh’i model→paper affine ile dönüştürülür ve dikdörtgen ya da desteklenen convex clip polygon ile kesilir. Testler iki INSERT affine dönüşümünde HATCH+WIPEOUT toplam alanını 24000, araya giren çizginin painter order’ını, convex XCLIP sonrası toplam alan 5500, paper rectangle alanı 2500 ve convex triangle alanı 1250 olarak doğrular. Nested LWPOLYLINE width-fill taşınması bu kapsamda tamamlanmadı.

Compiler/cache cad-v2-compiler-2026.09-v49; p08/schema 1/ABI v2 aynı. `npm run check:cad-v2:unit`, runtime TSC, focused spatial/composite/cache/viewport/order kontrolleri ve active-paper visible-fill/glyph Chromium testi 1/1 PASS. İlk unit koşusu eski nested-HATCH oracle’ının `chunks[0]` içinde line XY beklemesi yüzünden durdu; mesh artık önce yayımlandığından oracle line taşıyan chunk’ı seçer hale getirildi ve accounting testiyle tam suite tekrar geçti. R001 test loglarında LibreDWG error 68 var; temiz DWG decode iddiası yok. F07 terminal 0/7, genel 14/19 tarihsel; G3/G4/R05 kısmi. F05/F08/production R01/V01 ve fiziksel R09/AutoCAD R10 açık. Commit/push/PR/deploy yok.

## 2026-09-27 — F07 G3-G4/R05 nested LWPOLYLINE width fill, cap ve wire-byte sınırı (v50)

EntityVisitor, LWPOLYLINE expansion’ından gelen `thickTriangles` mesh’ini `addFill` yoluyla nested affine INSERT dönüşümleri, etkin clip, stil ve sıralı draw-item akışına taşır; paper viewport model→paper dönüşümü ve clip yolunda da mesh korunur. İki seviyeli mirrored/nonuniform affine profilinde bağımsız üçgen alan oracle’ı 240; paper viewport clipping sonrası alan 500. Nested width-fill ile glyph’in örtüştüğü hem Model hem pafta composite manifest alanları >0 verir; bu seçili compiler/error-accounting profili native raster kanıtı değildir.

Büyük fill akışları en çok 16.384 üçgenlik pencerelere bölünür. 256 spatial fill-group sınırı aşılınca bounded count windows geometriyi korur ve `FILL_SPATIAL_PARTITION_LIMIT_REACHED` ile sahne degraded olur. Chunk boyutu için binary section header/table/alignment dahil gerçek encoded byte gereksinimi encode öncesi hesaplanır; 2 MiB’ı aşacak primitive aralığı sırayı koruyarak ikiye bölünür, bölünemeyen tek primitive açık hata verir. R001 P08 doğrulaması 286 chunk, en büyük chunk <=2.097.152 byte ve 484.094 byte manifest (<1 MiB) ile geçti.

Compiler/cache v49→v50; pipeline p08, schema 1, ABI v2 aynı. `npm run check:cad-v2:unit` v50 runtime kodunda, son yalnız-test composite genişletmesinden önce PASS; genişletilmiş `fill-glyph-paper-spatial.test.ts` sonrasında hedefli test ve `npx tsc --noEmit --project tsconfig.next.json` PASS. `npx tsx tests/cad-v2/r001-root-fix.test.ts` ayrıca PASS; testte LibreDWG error 68 loglandı ve bu temiz decode iddiası değildir. `git diff --check` kaynak kapsamı PASS. Hashes: entity-visitor `6669BEE2A031F611DC1815A2EDBC4DD885110A9EBA80EFAD9D6D933467E80A27`; scene-compiler `93B16D288C1DB5404F5DA9E79070E7B371A7B510DA4351DFA61C7E09FAB740EF`; version `BE56F3FC44F65FCD2F5981438E58B3D7C4B92964221E133FC77C3AAEAD381A3D`; test `9293F82DF5CDAE570A10A227C9194CCB3493BAD90D4650BE3F8EEAD07D8F814A`.

Seçili R05 width/cap/byte/composite grubu tamamlandı; daha geniş global bounds varyantları ve runtime/raster composite açık. Inverted/concave XCLIP fill clipping `UNSUPPORTED_FILL_CLIP` ile fail-closed/degraded kalır. G3/G4 kısmi, F07 terminal 0/7 ve 14/19 tarihsel; F05/F08/production R01/V01 tahminlenmedi, fiziksel R09 ve same-source AutoCAD R10 dış bağımlılıktır. Commit/push/PR/deploy yok.

## 2026-09-27 — F07 G4/R06 non-adjacent fill/glyph composite envelope (v51)

Scene compiler now retains each chunk's finite source fill/glyph bounds and its separate Float32 fill-boundary and glyph-stroke encoding terms. For distinct chunks in the same layout, overlapping fill/glyph source bounds add the two independent terms and publish that composite bound to both chunks, including CSS-pixel conversion when a complete screen profile is present. Existing quality evaluation degrades the scene when this combined bound crosses the target.

Pair analysis is capped at 16,384 candidate cross-chunk checks. On overflow, the compiler applies the layout-wide maximum fill term plus maximum glyph term to every participating fill/glyph chunk, adds `FILL_GLYPH_COMPOSITE_ANALYSIS_LIMIT_REACHED`, and marks quality degraded. The cap path is exercised with 130 fills and 130 glyphs split at one primitive per chunk; no pair bound is silently omitted.

The high-origin R06 fixture places a long intervening glyph across multiple chunks before an overlapping later glyph. Assertions cover same-chunk, adjacent-chunk and non-adjacent fill/glyph bounds, per-chunk errors below a 0.25 CSS-pixel target while the pair sum exceeds it, the existing `CHUNK_COMPOSITE_PRECISION_LIMIT_REACHED` degraded result, and manifest/index validation. Focused test, cache identity, runtime TypeScript and the complete `npm run check:cad-v2:unit` chain pass at v51. R001 tests in that chain logged LibreDWG error 68; this is not clean-decode evidence. No browser/native raster test was run; runtime/raster acceptance remains open.

Compiler/cache v50→v51; pipeline p08, schema 1 and renderer ABI v2 unchanged. Source SHA-256: scene-compiler `1FDBD42B0EDA0690DD5509C1ED326DF1FFCEC19524A804D66C0B86EF35400BC9`; diagnostics `CF24A6624BD9075E6942973076A7876FE6C33E0E75A51E8B48FD3C8691D904A9`; binary protocol `81E429EA12B10338141B6AEB3412924564FE01DB5AC1245F8BA5CB9E9E36AF27`; version `2C1117F0699886152B8B642D0721DBD5FDA28728B099FB88751D44FDCDF45A59`; test `AD7A29DB4E59FD3BDEA4E1E40B1240A8DF0B2B27FA49ED5146FF0B540137FB27`.

R06's selected non-adjacent static-bound group is closed; broader source-family bounds and runtime/raster composite remain open. R06 is estimated at 1–3 local groups, low confidence. F07 known-local estimate becomes 1–17 groups (previously 1–18); terminal gates remain 0/7 and overall 14/19 remains historical. R05 remains 1–3 groups for wider bounds/runtime-raster work; F05/F08/production R01/V01 remain unestimated; R09 physical-device and R10 same-source AutoCAD evidence remain external. No commit, push, PR or deployment.

## 2026-09-28 — F08 v64 execution evidence pointer (non-normative)

This execution note does not change the metadata/resource/binary contract above. The v64 implementation record is in `evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md`: curve geometry replacement now receives a CPU/GPU estimate preflight, can evict one invisible LRU chunk and retry, retains the old geometry on rejection, and updates cache weight after an accepted swap. Unit, host lifecycle, scoped runtime typecheck and post-change focused browser checks passed. Admission estimates are not measured allocator or GPU peaks. P00 R001 Node measurements logged LibreDWG error 68; they are not clean DWG or browser-render acceptance. F08 remains **ACCEPTANCE NOT_RUN**; P00 browser performance/ROI and real peak measurements remain open.

## 2026-09-28 — F08 v65 P00 browser execution note (non-normative)

This execution note does not change any contract metadata, resource, or binary fields. `tests/document-studio/cad-v2-p00-baseline.spec.ts` ran on the actual R001 upload and V2 host via `npm run check:cad-v2:f08:p00 -- --reporter=line` (1/1 PASS). It measured cold/warm host interaction at 8.808/4.296 s, equal 284-chunk fetch sets and equal canvas hashes, but both opens warned that 90 visible chunks were skipped by the memory budget. Eight zoom plus three pan actions produced 641 additional chunk requests / 527,969,056 bytes; 11 input-to-next-WebGL-draw samples p50/p95 were 16.1/17.8 ms. The run logged LibreDWG error 68; renderer RSS/JS heap are sparse observations, `bufferData` is upload-call volume, and bbox-to-chunk ROI mapping is not native semantic fidelity. See `evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md`; F08 remains **ACCEPTANCE NOT_RUN**.

## 2026-09-28 — F08 v66 P00 warm-set refetch classification (non-normative)

The same actual R001/V2-host workload passed again (1/1). The test now classifies chunk requests against IDs fetched during the warm open: all 641 interaction requests / 527,969,056 bytes belonged to 200 IDs already seen in the warm-open set of 284; no new interaction ID fell outside that set. This proves repeated transfer, not whether each request follows initial budget rejection or later LRU eviction. The DOM exposed only the final “90 chunks skipped” summary, so per-chunk CPU/GPU admission estimates remain unavailable. Cold/warm interaction was 8.612/4.384 s; input-to-next-WebGL-draw p50/p95 16.5/18.4 ms; the warm-host-open plus interaction sample contained 10 long tasks, maximum 728 ms. LibreDWG error 68, SwiftShader, sparse memory points, and absent AutoCAD ROI oracle remain limitations. F08 stays **ACCEPTANCE NOT_RUN**; full detail is in the F08 lifecycle audit.

## 2026-09-28 — F08 v73 projected primitive and raster occupancy (non-normative)

P00 test-only projection maps compiled line-segment samples and fill-triangle/cell intersections into the same 20×20 cells as the host's padded camera viewport. There are 64 projected-geometry candidate cells versus 97 bbox candidate cells; 33 bbox cells (34.0%) have no projected primitive, with no projected-only cells. Chromium's actual partial canvas screenshot marked 102/400 cells and 96,463 pixels against corner background [5,5,5] using a 16-channel threshold and three-pixel cell minimum. The actual accepted projection covers 43 cells, all shared with raster; 59 raster cells have no corresponding accepted projected cell. This exposes a substantial gap in the projection proxy; its cause is not attributed without a renderer/layer/dash/wipeout audit.

Projected-cell marginal admission is a counterfactual: 228 chunks / 1,862,234 vertices / 63 of 64 projected cells; bbox-20 marginal: 229 / 1,962,234 / 61 of 64. Cold/warm masks match. Raster analysis executes after pan/zoom measurements. No runtime ordering changed. P00 1/1, occupancy unit 4/4, targeted P00 TypeScript check PASS. F08 remains ACCEPTANCE NOT_RUN: raster cells are not pixel similarity or AutoCAD parity; R001 reports LibreDWG error 68; same-source native oracle and peak/physical GPU evidence remain open. See F08 v73 lifecycle audit.

## 2026-09-28 — F08 v72 measured viewport and grid-sensitivity what-if (non-normative)

The opt-in resource sink now records the actual first camera state, its 1 CSS-pixel-padded world viewport bbox and host-visible Model chunk count. Cold/warm R001 P00 matched: 1440×852 CSS px, center (496.4980, 3503.5372), unitsPerCssPixel 19.149232, viewport bbox [-13310.0983,-4673.1849,14303.0943,11680.2592], 284 visible chunks.

Across 5×5, 10×10 and 20×20 grids, cells with at least one Model chunk bbox candidate numbered 11, 30 and 97; empty cells were excluded. Actual admission covered 7/11, 21/30, 70/97; vertex-per-CPU-byte covered 8/11, 25/30, 88/97. Grid marginal counterfactuals at all three resolutions covered 11/11, 30/30 and 97/97. Their admission sets were: 5×5, 228 chunks / 1,862,022 vertices; 10×10, 227 / 1,812,368; 20×20, 229 / 1,962,234.

The grid selections include more estimated vertices than actual order (343,990–493,856 more) but fewer than pure vertex yield (305,218–455,084 fewer). The accepted sets and vertex yield vary with grid resolution. This is coarse bbox occupancy, not primitive pixels, line density, readability or semantic importance; no runtime admission ordering changed. R001 still logs LibreDWG error 68, the profile is provisional and native AutoCAD/clean-decode/physical-GPU/actual-peak evidence is absent. P00 1/1 and scoped runtime TSC passed; the full UI chain last passed 18/18 before this opt-in viewport diagnostic. F08 ACCEPTANCE NOT_RUN. The next local check should compare projected primitive or raster occupancy with bbox-cell occupancy.

## 2026-09-28 — F08 v71 sparse-ROI marginal admission what-if (non-normative)

The R001 P00 test now reports a test-only sparse-bbox marginal priority model. Targets have fewer than 10% of the 284 Model chunks intersecting their provisional profile bbox: ROI-01 18, ROI-03 1, ROI-04 6; ROI-02's 284 candidates are the broad baseline. Equal total weight per target is divided across its candidates; a candidate's remaining marginal weight is scored per estimated CPU byte, then ties use marginal weight, vertex yield and chunk ID. Once sparse target coverage is exhausted, the simulation uses vertex yield per CPU byte.

With the same additive estimated CPU/GPU admission budgets, cold and warm results match: the marginal model accepts 129 chunks / 1,859,354 vertices, with bbox candidate coverage ROI-01 18/18, ROI-02 129/284, ROI-03 1/1, ROI-04 6/6. Actual order is 194 / 1,468,378 and 4/18, 194/284, 0/1, 0/6. Pure vertex-yield is 212 / 2,267,452 and 10/18, 212/284, 1/1, 4/6. The single-representative policy selected chunk_model_262, whose bbox intersects all three sparse ROI candidate sets, and produced the same result as pure vertex yield.

This is a provisional profile-bbox what-if, not camera viewport, raster, readability or AutoCAD semantic evidence. Reordering can change measured costs; fixed renderer overhead, shared backing stores and concurrent completion order are omitted. No runtime admission order changed. Latest P00 Playwright 1/1 and scoped runtime TSC passed; full check:cad-v2:ui last passed after the prior runtime-only telemetry change (Chromium 18/18). F08 remains ACCEPTANCE NOT_RUN because R001 reports LibreDWG error 68 and native AutoCAD, clean-decode, physical-GPU and actual-peak evidence remain absent. See the F08 v71 lifecycle audit.

## 2026-09-28 — F08 v70 cold-open admission-cost analysis (non-normative)

The opt-in host test trace now separates renderer geometry CPU additions, temporary unpacked CPU bytes, refinement-source candidates, GPU buffer additions, and vertex counts per chunk. R001 P00 passed 1/1 after this diagnostic-only change; both cold and warm opens still saw 284 visible chunks, 194 accepted / 90 rejected, with all 90 rejections caused by CPU estimates. Accepted/rejected vertex totals were 1,468,378 / 5,896,582.

Three measured-cost reordering scenarios run inside the test only. The actual order yielded 194 chunks / 1,468,378 vertices and bbox candidate coverage ROI-01 4/18, ROI-02 194/284, ROI-03 0/1, ROI-04 0/6. Greedy vertices per estimated CPU byte yielded 212 / 2,267,452 with 10/18, 212/284, 1/1, 4/6. Greedy lowest estimated CPU cost yielded 232 / 2,225,908 with 10/18, 232/284, 1/1, 4/6. Smallest manifest-byte-first yielded 226 / 1,625,892 with 8/18, 226/284, 0/1, 2/6. These are additive zero-baseline what-ifs: fixed renderer overhead, shared backing stores, completion concurrency, order-dependent measured geometry cost, viewport readability and semantic/native quality are not modeled. They do not change runtime ordering or prove visual fidelity; bbox coverage is not AutoCAD ROI acceptance.

Runtime TSC and cache/scheduler unit passed; the full UI chain passed again after this diagnostic-only increment, including 18/18 Chromium tests. R001 continues to log LibreDWG error 68, the profile remains provisional, and physical GPU/peak plus native AutoCAD oracle remain absent. F08 is still ACCEPTANCE NOT_RUN. See [F08 v70 audit](C:/Users/hsyn/.codex/worktrees/91a0/muhendis-mimar-portali/motor_v2/evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md).

## 2026-09-28 — F08 v69 CPU/GPU cohort retry and P00 remeasurement (non-normative)

`ChunkAdmissionRetryGate` now selects prior budget rejections and previously accepted, LRU-evicted reloads as a cohort. The sum of estimated CPU and GPU costs in a retry batch must fit available plus reclaimable capacity; excess candidates wait for another capacity opportunity. The last accepted cost is retained for evicted chunks. A visible candidate deferred by the gate keeps the degraded/partial warning without making a doomed transfer. Cache-unit assertions, the synthetic F08 host browser test (1/1), runtime TSC, and the full UI chain passed; the latter completed with **18/18 Chromium tests**.

R001 P00 passed (1/1) with the same source SHA and compiled-scene SHA. On 8 zoom + 3 pan actions it emitted **6 network requests**, each matched to a host start and terminal outcome: five prior-rejection retries plus one accepted→evicted→reload; all six were accepted, none rejected, and no start/outcome was missing. The six requested IDs were in the 284-ID warm set. Traffic was **23,368 bytes**, down 380 requests and 268,433,896 bytes from v68 (386 / 268,457,264 bytes). First and warm open remained 194 accepted / 90 rejected, with the same partial canvas hash and CPU/GPU estimates. Interaction input-to-next-WebGL-draw p50/p95 was 15.4/17.7 ms; three interaction long tasks had a maximum of 132 ms.

F08 remains **ACCEPTANCE NOT_RUN**: R001 still logs LibreDWG error 68, the profile is provisional, and native AutoCAD semantic ROI, clean decode, physical GPU, and actual peak memory evidence are absent. Estimates remain 1–3 known local F08 groups / 8–19 total; historical 14/19 is unchanged. See [F08 v69 audit](C:/Users/hsyn/.codex/worktrees/91a0/muhendis-mimar-portali/motor_v2/evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md).

## 2026-09-28 — F08 v68 capacity-gated retry and P00 remeasurement (non-normative)

The host now records rejected chunk IDs with a cache-capacity revision. A viewport-set change alone no longer clears all rejections. A retry becomes eligible after an accepted resident chunk leaves the visible set, or after a successful admission sequence uses one or more visible-pressure evictions; failed admission eviction loops do not themselves open another retry opportunity. Acceptance clears the chunk's old rejection marker. The deterministic cache test covers unchanged-capacity suppression, first attempts for new chunks, retry after a capacity opportunity, repeated rejection suppression, and marker cleanup after acceptance.

Validation: targeted F08 Playwright **1/1 PASS**, `npx tsc --noEmit --project tsconfig.next.json --incremental false` PASS, and full `npm run check:cad-v2:ui -- --reporter=line` PASS, including **18/18 Chromium** tests plus worker, cache, lifecycle, and refinement checks. The synthetic budget fixture still demonstrates 4 Model loads → 3 accepted + 1 rejected, Sheet transition eviction, and a later Model reload.

R001 P00 **1/1 PASS** with unchanged source SHA `17a92cb544830845fc59717abcc22d3cdcf97c12b8450602c9c70ec4a507f086`, 8,787 canonical entities, 286 chunks / 98,042,688 bytes, and stable compiled-scene SHA `c6bba3f08f1189deefe38ee9879e3dd2dc471bef442316d0d01d87ee28ef15e4`. In 8 zoom + 3 pan actions, interaction requests fell from **641 to 386** and transfer from **527,969,056 to 268,457,264 bytes**. All 386 requests paired with a host start and terminal result: 273 retries of prior budget rejections and 113 reloads of previously accepted, evicted chunks. Admission-pressure evictions remained **116**; there were 200 unique requested IDs, all from the initial warm set of 284. The reduction is 255 requests (**39.8%**) and 259,511,792 bytes (**49.2%**). Cold/warm opening still accepted 194 and rejected 90, with the same partial canvas hash and CPU/GPU estimates of 74,920,882/67,108,864 and 51,048,852/67,108,864 bytes.

This does not close F08. LibreDWG still logged error 68, the profile remains provisional, native AutoCAD semantic ROI and physical GPU/peak measurements are not run, and the partial opening canvas remains. F08 estimate stays **1–3 known local groups**, total known local work stays **8–19**, and historical 14/19 is unchanged. See [F08 v68 audit](C:/Users/hsyn/.codex/worktrees/91a0/muhendis-mimar-portali/motor_v2/evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md).

## 2026-09-28 — F08 v67 admission/eviction decision trace (non-normative)

The opt-in host test sink now records each visible chunk's accepted/rejected/stale result, CPU/GPU admission estimates and eviction reason. The small-budget real-host regression passed: 4 initial Model loads produced 3 accepted and 1 rejected; changing to SHEET_A recorded invisible LRU eviction; returning to Model requested an evicted ID again. Actual R001 P00 passed 1/1 with 641/641 interaction network loads paired to host starts and outcomes. Of these, 528 retried chunks whose previous decision was rejection and 113 reloaded chunks accepted earlier and then evicted; no request was unclassified. There were 116 visible-admission-pressure evictions, and 527,969,056 bytes transferred. Both cold/warm opens admitted 194 of 284 and rejected 90. Peak reported CPU was 74,920,882 / 67,108,864 bytes and GPU estimate 51,048,852 / 67,108,864; these are admission estimates, not allocator/GPU peaks. Runtime TSC and the full check:cad-v2:ui chain passed (18/18 Chromium tests); F08 remains **ACCEPTANCE NOT_RUN** because R001 reports LibreDWG error 68 and native semantic ROI, physical GPU and peak evidence remain absent.

## 2026-09-27 — F07 G1–G7 ana v3 kabul denetimi (dashboard v25)

Ana Fidelity v3 F07 maddelerini yerel test kanıtlarına eşledim; G1–G7 kimlikleri ana belgede ayrı resmi numaralar değil, durum panelinin eşlemesidir. Zorunlu F07 kapıları G1 periodic SPLINE, G2 HATCH precision/runtime, G3 bounded spatial/on-demand chunks, G4 fill/glyph composite ve G6 4 zoom × DPR 1/2/3 olarak tamamlandı (5/7). G5’in AutoCAD phase/length parity’si ve G7 same-source visual/DIM kıyası aynı R10 kanıt paketini bekliyor; ikisi NOT_RUN. R09 fiziksel Poco X6 Pro testi V01’in ayrı dış kapısıdır.

G1 testindeki mevcut periodic worker oracle hedefi 0.5’ten v3’ün 0.25 CSS px bitiş hedefine çekildi; yeni profil/geometri hücresi eklenmedi. `npx tsx tests/cad-v2/dxf-periodic-spline.test.ts` PASS; 43 worker span, bağımsız rational Bezier worker oracle hatası en çok 0.0205928467 world unit = 0.205928467 CSS px (`unitsPerCssPixel=0.1`). `npx tsx tests/cad-v2/precision-refinement.test.ts` PASS: 4 zoom × DPR 1/2/3, 12/12.

Bu turda `curve-refinement.test.ts` ve `hatch-topology.test.ts` PASS; HATCH worker dense oracle ≤0.2001 CSS px ve P07 island/topology ölçümleri mevcut profil için PASS. `direct-line-spatial-partition.test.ts`, `non-line-stroke-spatial-partition.test.ts`, `fill-glyph-paper-spatial.test.ts` ve mevcut active-paper visible-fetch Playwright profili 1/1 PASS. G4 v51 focused/full-unit kaydı önceki R06 bölümündeki kanıttır; yeniden koşturulmadı. Daha geniş bounds/source-family/runtime-raster çarpımları v3 F07 zorunluluğu değildir; panelde optional takip olarak ayrıldı.

G1 test SHA-256 `0997329E04E94B8CBCE996A3278E8E5D7A71D132613DCB56B9FFEC5448841A4B`. `git diff --check -- tests/cad-v2/dxf-periodic-spline.test.ts` temiz. Kaynak compiler değişmedi. Güncel sayaç ve her kapının owner/minimal closure tablosu esas depo `DWG_PLAN_DURUMU.md` v25’tedir; bu bölümdeki eski 0/7 ve efor tahminleri kendi tarihsel grup kayıtlarıdır. Commit, push, PR veya deploy yapılmadı.
