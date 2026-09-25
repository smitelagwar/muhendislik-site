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
