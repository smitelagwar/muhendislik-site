# 31 — Metadata, kaynak parçası, binary ve lease tamamlamaları

[Dizin](README.md) · [Temel API](25_SABIT_VERI_VE_API_SOZLESMELERI.md) · [Renderer](29_RENDER_VE_YASAM_DONGUSU.md) · [Alt kabul](uygulama/ALT_KABUL_DURUMLARI.md)

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

Sabit tag listesi: 1 META(u8,1 UTF-8 JSON); 2 ORIGIN(f64,2 tek kayıt); 3 XY(f32,2 lokal vertex); 4 TRIANGLES(u32,3 index); 5 INSTANCE(f64,6 affine a,b,c,d,tx,ty); 6 CURVE_DATA(f64,1); 7 GLYPH_DATA(f64,1); 8 SOURCE_STRINGS(u8,1 UTF-8 JSON string[]); 9 DRAW_RUNS(u32,8); 10 PATH_DISTANCE(f64,1); 11 CLIP_DATA(f64,1); 12 STROKE_DATA(f64,4: startWidth,endWidth,phase,linetypeScale); 13 UV(f32,2). Hiçbir chunk browser'a canonical entity object grafiği taşımaz. META yalnız buffer aralık descriptor'ları, kimlikler ve bounded draw resource eşlemesidir; koordinatlar typed bölümlerde kalır.

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
