# 29 — Çizim altyapısı, kalite ve kaynak yaşam döngüsü

[Dizin](README.md) · [Giriş/kamera](28_PAN_ZOOM_FIT_SOZLESMESI.md) · [Veri ekleri](31_SOZLESME_TAMAMLAMALARI.md) · [Alt kabul](uygulama/ALT_KABUL_DURUMLARI.md)

**EXEC-2 / G05–G12.** Three.js 0.172.0 grafik altyapısıdır. CAD semantiği, materyal davranışı, painter order, pafta ve batch planı V2'ye aittir. Her entity için bir React bileşeni veya bir Three Object3D üretmek yok. Gruplama aynı layer/style/order/clip bağlamında contiguous run + typed buffer/instance üzerinden yapılır.

## Kesin renderer başlangıcı

WebGLRenderer: antialias=true, alpha=false, premultipliedAlpha=true, preserveDrawingBuffer=false, stencil=true, depth=false, powerPreference=default. V2 için tek renderer/context. WebGL2 bulunamazsa açık UNSUPPORTED_WEBGL2; gizli Canvas/legacy fallback yok. NoToneMapping, SRGBColorSpace çıkış; kaynak renkleri linear çalışma uzayına bir kez dönüştürülür. Custom shader da aynı çıkış sözleşmesini uygular; renkler iki kez gamma işleminden geçmez. Tema kaynak geometri renklerini değiştirmez.

Canvas boyutu ResizeObserver ile drawable CSS alandan alınır. pixelRatio=min(devicePixelRatio,2). renderer.setSize(W,H,false); CSS ölçüsü ayrı kalır. Browser %200 zoom ve değişen DPR'da input hâlâ CSS px kullanır. MSAA gerçekleşmiş örnek sayısı kayda alınır; antialias:true her cihazda aynı örnek sayısı garantisi değildir. FXAA/TAA/SSAO/bloom ve arka plan animasyonu yok.

Tek dirty-frame scheduler kullanılır. invalidate gerekçeleri camera/chunk/style/visibility/resize/context-restore. Bir frame'den önce kaç event gelirse gelsin bir RAF. Boşta sürekli RAF yok; görünmez tab'da rendering durur. Raf callback'i yalnız son geçerli generation'a ait veriyi çizer. Geometry parse/normalize/triangulation frame loop'a konmaz.

## Hassasiyet, çizgiler ve refinement

Kaynak Float64 kalır. Chunk vertices kendi chunk origin'ine göre Float32'dir. Her frame'de chunkOrigin-cameraCenter farkı önce JS Float64'te alınır; GPU'ya bu küçük relatif fark ve lokal vertex gönderilir. Three kamera xy=0 olduğundan merkez ikinci kez çıkarılmaz. Devasa world matrix'lerini Float32 shader içinde çıkararak küçük detay korunamaz. Frustum/culling bbox Float64 ve kaynak coordinate space'tedir. Instancing transform sırası OCS→block/instance→layout viewport→camera olarak ayrı kanıtlanır.

Kalın CAD stroke için platforma bağımlı gl.lineWidth veya Three LineBasicMaterial.linewidth yeterli sayılmaz. Segment quads/triangle join-cap geometrisi ve ekran uzayında coverage anti-alias kullanılır. Kaynak polyline width geometri birimidir; lineweight ekran sunum kuralıdır; birbirine çevrilmez. Lineweight görüntülemesi açıkken mm→CSS px dönüşümü 96/25.4 katsayısıyla yapılır; 0 lineweight hairline 1 CSS px. Bu ekran yaklaşımı fiziksel çıktı ölçeği değildir. Join/cap kaynak semantiği korunur; bulunmayan generic segmentte butt cap + bevel join sabittir.

Dashed/dotted çizginin fazı chunk başlangıcında sıfırlanmaz. Kaynak path boyunca Float64 kümülatif mesafe, phase/linetype scale ve başlangıç parametresi taşınır. BYLAYER/BYBLOCK, annotation ve viewport scale canonical/compile aşamasında çözülür; UI toggle bunları yeniden decode ettirmez. Kaynak renkleri, monochrome, lineweight açık/kapalı materyal uniform/state değişimidir.

Sunucu yalnız tek zoom için noktalanmış curve göndermez. Analitik line/arc/ellipse/bulge ve rational B-spline kontrol noktası/knot/weight payload'ı korunur. Worker bu **hazır sahne verisinden** visible curve tessellation üretir; ham DWG/DXF okumaz. Curve parametre aralığı ve provenance kaybolmaz. Final hata bütçesi ≤0.25 CSS px; segment sayısı/derinlik sınırı allocation öncesi uygulanır. Generic curve için span bazlı bounded adaptive subdivision; yalnız midpoint örneğiyle S eğrisinin düz kabul edilmesi yasak. Konveks kontrol zarfı flatness bound kullanılır; positive rational weights şartı doğrulanır, sıfır/negatif/bozuk weights açık diagnostic verir. Unsupported curve düz çizgi diye hazır gösterilmez.

Refinement zoom bucket'ı floor(log2(k/k0)) ile belirlenir; cache kimliği geometry + viewport transform + bucket + styleVersion. Bucket'ın en yakın zoom ucuna göre tolerans hesaplanır. Pan aynı scale'de tessellation yeniden üretmez; yeni görünür chunk/refinement alabilir. Etkileşim bitiminde 150 ms sonra final kalite iş önceliği yükselir. Cache/bütçe yetişmezse partial kalır; çizim kalıcı azaltılıp ready yazılmaz. Başlangıç işlem tavanı görünür tek refinement görevi için 1.000.000 çıktı vertex ve subdivision depth 32; aşım görünür limit diagnostic + CR kanıtıdır. Bu rakamlar benchmark sonucu değildir.

Font glyph outline SHX/TTF/MTEXT sözleşmesinden hazırlanır. Tarayıcıya bütün original font dosyasını gönderip platform font rasterizer'ına teslim etmek yok; glyph vector payload ve shaped yerleşim derlenmiş sahnenin parçasıdır. Canvas2D yalnız test görseli/yardımcı raster işi olabilir; text veya CAD ana renderer'ı değildir. Eksik font önceki degraded kurallarına uyar. Font outline triangulation ve ekran uzayı hata bütçesi de refinement kapsamındadır.

## Sıra, clipping ve pafta

Global kaynak painter order authoritative'dir. renderer.sortObjects=false; bütün 2D primitive materyallerinde depthTest=false, depthWrite=false. Opaque/transparent kuyruk ayrımı kaynak sırayı bozmasın diye **CAD materyallerinin tamamı aynı transparent render kuyruğunda** normal alpha blending ile tutulur; opak primitive alpha=1. Materyal “aynı renk” diye daha erken entity'nin önüne taşınmaz. renderer.info.drawCalls ve görsel oracle birlikte incelenir.

Compiler clip/mask bariyerleriyle sıralı render command run'ları üretir. Basit viewport dikdörtgeni scissor; arbitrary XCLIP/viewport polygon ve iç içe clip için server/worker'da polygon intersection ile primitive clipping uygulanır. Stencil keyfî derinlik çözümü diye kullanılmaz. Wipeout kaynak sırasındaki masked background fill'dir; daha sonraki entity'leri silmez. Image şeffaflığı, hatch adaları ve çizgi/text painter order tek testte birlikte denenir. Batch merge sadece bitişik ve aynı clip/order semantiği taşıyan aralıkta yapılır.

Pafta kamera görünümü ile pafta içindeki model viewport dönüşümü ayrıdır. Kullanıcının pan/zoom'u viewport twist'i değiştirmez. Geometri clipping sonrası bbox'sı, pafta katman dondurma ve annotation bağlamı 31 metadata'sıyla eşleşir. Yeni chunk geç gelince doğru global sırasına yerleşir; geliş sırası görünüş olamaz.

## RAM, GPU, texture ve sahiplik

Bütün cihazlarda CPU resident chunk/refinement/index/resource bütçesi 64 MiB, GPU tahmin bütçesi 64 MiB başlangıçtır. GPU hesabına vertex/index/instance buffers, textures ve render targets girer; Three internal/browser overhead ayrıca ölçülür. Bu sayı toplam browser RAM garantisi değildir. Coarse/fine pointer bellek kapasitesi belirlemez. Bütçeyi artırma veya kaliteyi kalıcı düşürme Gemini kararı değildir.

Her kaynak ownerScene/generation/refCount/byteEstimate taşır. Shared glyph/material/geometry son owner bırakana kadar dispose edilmez. Evicted GPU chunk geçerli server türevinden tekrar yüklenebilir. Worker'a transfer edilen ArrayBuffer gönderen tarafta detached kabul edilir; aynı buffer ikinci kere GPU'ya okunmaz. Resident kaynakların muhasebesi transfer/eviction/cancel'da çift sayılmaz.

Image payload PNG/JPEG güvenli raster parçalarıdır; original DWG dependency URL'si browser'a verilmez. Texture tile üst sınırı 1024×1024 px, renk kanalı RGBA8; mevcut MAX_TEXTURE_SIZE bundan küçükse explicit unsupported. Her byte parçası 2 MiB altındadır; decode sonrası RGBA boyutu ayrıca bütçelenir. 1 px örtüşme/gutter ile komşu tile örnekleme dikişleri önlenir; clamp-to-edge ve mipmap yok, linear filter. Asıl image geometrisi affine transform/clip ile korunur. Compiler ayrı source image için 64 megapixel decode üst sınırı ve toplam 250 MiB input sınırını uygular. Limit aşımı gizli downsample değildir.

Unmount sırası: generation/abort → giriş teardown → RAF/timer → worker terminate → per-scene owner bırakma → geometry/material/texture dispose → varsa ImageBitmap.close → renderer.dispose → referansları bırakma. Debug HUD veya ölçüm araçlarının eski buffer referanslarını tutmadığı da incelenir. Renderer.dispose uygulama tarafından yaratılmış bütün texture'ları otomatik temizlemiş sayılmaz.

Context loss'ta drawing durur, “Görüntü yeniden hazırlanıyor” durumu gelir. Restore olayından sonra geçerli CPU scene veya yetkili chunk yeniden yüklemesiyle GPU kaynakları kurulur; aynı camera/layers/settings korunur. 15 s içinde recovery tamamlanmazsa açık error ve kullanıcı retry yolu; sonsuz spinner yok. Kayıptan sonra eski GPU resource handle'ları kullanılmaz. Normal recover source decode/job başlatmaz.

## V01–V18 alt kabul

| ID | Zorunlu kanıt |
|---|---|
| V01 | Gerçek WebGL2 + three r172; aktif engine cad-v2; placeholder görsel değil |
| V02 | Boşta RAF yok, 100 input event tek frame'e birleşiyor, React entity render yok |
| V03 | DPR/resize sonrası stroke/font keskinliği; 0×0 canvas güvenli |
| V04 | 1e9 origin yanında küçük detay ve instance hassasiyeti |
| V05 | Hairline/lineweight/polyline width farkı, join/cap ve zoom |
| V06 | Linetype phase chunk/tile/instance sınırlarında süreklilik |
| V07 | Eğri/error bound, inflection ve zoom sınırları; sabit tessellation kaybı yok |
| V08 | Pan/zoom sonrası final kalite, bounded refinement ve partial gerçeği |
| V09 | Türkçe glyph/font/MTEXT, eksik font ve kaynak renklerinin iki tema eşliği |
| V10 | Hatch delik/ada/yoğun pattern ve aynı sıradaki text/stroke |
| V11 | Opaque+transparent+wipeout+image karma painter order; chunk geliş sırası farklı |
| V12 | Döndürülmüş/nonrect viewport/XCLIP, nested block ve annotation bağlamı |
| V13 | Layer toggle/frozen/lock ve monochrome/lineweight ayarları; source mutasyonu yok |
| V14 | Image tile seam/alpha/texture decoded limit ve eksik resource |
| V15 | RAM/GPU LRU evict→reload; limit aşımı görünür, silent omission yok |
| V16 | Simüle context loss/restore ve fiziksel cihaz kaybı ayrı; ayarlar korunuyor |
| V17 | 20 open/close + 10 context recovery; kaynak plato ve lifecycle farkı |
| V18 | R001–R004 + holdout gerçek CAD ROI; typecheck/screenshot tek başına kabul değil |

Ekran ve sayısal kanıt olmadan V satırı PASS yazılmaz. Draw call azaltmak için V11'i bozmak veya FPS yükseltmek için V08'i eksik bırakmak kabul değildir.
