# 27 — Kaynak kod araştırması ve sabit yeniden kullanım haritası

[Dizin](README.md) · [Karar revizyonu](26_PLAN_DENETIMI_VE_EXEC2.md) · [Etkileşim](28_PAN_ZOOM_FIT_SOZLESMESI.md) · [Renderer](29_RENDER_VE_YASAM_DONGUSU.md)

**06.09.2026 / EXEC-2.** Bu liste Gemini için alternatif seçme menüsü değildir. İlk araştırmadaki [15 depo](arastirma/github-snapshot.json) korunur; aşağıdaki kaynaklar temel özellikler için daha ayrıntılı incelendi. Kaynak okuma ile çalıştırılmış test ayrıdır.

## Doğrudan kullanılacak altyapı

| Kaynak / sabit sürüm | V2'de görevi | Kullanılmayacak kısmı |
|---|---|---|
| Three.js 0.172.0, MIT | WebGLRenderer, OrthographicCamera, BufferGeometry/InstancedBufferGeometry, materyal/texture ve GPU kaynak altyapısı | Hazır CAD viewer, Orbit/Map/TrackballControls, perspective/orbit, WebGPU, React Three Fiber |
| d3-zoom 3.0.0, ISC | Tek 2D pan/pinch/wheel gesture davranışı, transform ve düğmelerin scaleBy bağlantısı | SVG entity renderer, animasyonlu zoom tour, çift tık zoom, varsayılan sınırsız ölçek |
| d3-selection 3.0.0, ISC | Giriş yüzeyine davranış bağlama, public selection.on ile sahip olunan handler yönetimi | React'in yönettiği UI ağacını D3 ile yeniden kurma |
| d3-drag 3.0.0, ISC | D3'ün dragDisable/dragEnable yaşam döngüsüyle kontrollü cleanup uyumu | İkinci paralel pan denetleyicisi |

Yerel runtime paketleri zaten kilitte bulunuyor. V2 uygulamasında doğrudan kullanımlar exact sürümle tanımlanacak. @types/three **0.172.0** yeni dev dependency olarak sabitlendi; registry metadata'sı doğrulandı, paket kurulmadı. D3 tipleri mevcut kilitteki @types/d3-zoom 3.0.8, @types/d3-selection 3.0.11, @types/d3-drag 3.0.7 ile kullanılacak. Yeni tip paketinin transitifleri lockfile'a kaydedilir; mevcut legacy runtime sürümleri yeniden çözülmez. WebGPU isimli bir type bağımlılığı runtime WebGPU kullanma izni değildir.

[Yerel dosya SHA-256 ve paket integrity kaydı](arastirma/exec2-yerel-kaynak-kaniti.json) · [GitHub commit ve registry kaydı](arastirma/exec2-public-kaynak-kimlikleri.json).

## Okunan birincil kaynaklar ve uygulamaya çıkan sonuç

### Three.js

[r172 WebGLRenderer kaynak kodu](https://github.com/mrdoob/three.js/blob/79497a2c9b86036cfcc0c7ed448574f2d62de64d/src/renderers/WebGLRenderer.js), [OrthographicCamera](https://github.com/mrdoob/three.js/blob/79497a2c9b86036cfcc0c7ed448574f2d62de64d/src/cameras/OrthographicCamera.js), [MapControls](https://github.com/mrdoob/three.js/blob/79497a2c9b86036cfcc0c7ed448574f2d62de64d/examples/jsm/controls/MapControls.js), [OrbitControls](https://github.com/mrdoob/three.js/blob/79497a2c9b86036cfcc0c7ed448574f2d62de64d/examples/jsm/controls/OrbitControls.js).

MapControls varsayılanında screenSpacePanning=false, sağ tuş rotasyon ve iki parmak dolly+rotasyon var. Bu nedenle “harita kontrolü zaten 2D'dir” kabulü yapılmadı. Renderer/kamera kullanılacak, bu kontroller bağlanmayacak. Güncel web dokümanı daha yeni API içerebilir; uygulama r172 source/types ile doğrulanacak.

[Three cleanup rehberi](https://threejs.org/manual/en/cleanup.html) geometry/material/texture kaynaklarının açıkça bırakılmasını gerektiriyor. React unmount veya scene.remove GPU belleğini tek başına bırakmaz. V2'nin owner/ref-count ve dispose sözleşmesi 29'da sabit.

### D3

[d3-zoom v3 source](https://github.com/d3/d3-zoom/blob/debbe3d76d86ea96965ed4cc61beb6bdf7238156/src/zoom.js), [transform](https://github.com/d3/d3-zoom/blob/debbe3d76d86ea96965ed4cc61beb6bdf7238156/src/transform.js), [pointer hesabı](https://github.com/d3/d3-selection/blob/91245ee124ec4dd491e498ecbdc9679d75332b49/src/pointer.js), [drag cleanup](https://github.com/d3/d3-drag/blob/1b88d8a2d69fca86d4d90a8329987693b79ec506/src/nodrag.js), [resmî API](https://d3js.org/d3-zoom).

Kaynakta mouse/wheel ve Touch Events bulunuyor; Pointer Events tabanlı capture mekanizması olarak sunulmayacak. touchcancel ele alınıyor; iki parmak mesafesi/orta noktası ve tek parmağa dönüş referansı tutuluyor. Mouse drag sırasında window'a handler bağlanıyor. Varsayılan filter orta tuşu dışlıyor; wheel katsayıları da ürün sözleşmesi değildir. V2 kesin filter/wheel/scaleExtent ve lifecycle adapter'ı yazacak. Programmatic transform için ölçek sınırını wrapper ayrıca uygulayacak. D3'ün özel __zoom/__zooming alanları uygulama kodundan değiştirilmez.

### vagran/dxf-viewer ve kurulu 1.0.48

[Depo ve README](https://github.com/vagran/dxf-viewer), [kaynak DxfViewer](https://github.com/vagran/dxf-viewer/blob/master/src/DxfViewer.js). Hareketli master linki araştırma içindir; uygulamada kurulu dosyanın hash'i ve ilk snapshot'taki commit kimliği esas alınır.

Kurulu kaynakta SetView/FitView ortografik kamera ve görünür en/boy oranını birlikte yönetiyor; CanvasToSceneCoord client koordinatını NDC'ye çeviriyor. Kontrol değişimi render çağırıyor. Batching ve instance yaklaşımı araştırma referansı. Kendi OrbitControls fork'undaki mouseZoomSpeedFactor upstream Three özelliği sanılmayacak. MPL-2.0 etiketi tek başına kaynak kullanma yasağı değildir. Seçilmiş 2D mimariyi koruyan kaynak uyarlaması D22/U2 altında değerlendirilebilir; kullanılan dosyanın kökeni/notice ve varsa dağıtımda kaynak sunumu korunur. Bağımsız analitik testler zorunludur. Mevcut yerel viewer değiştirilmeyecek.

README'deki UTF-8/layout/hatch/dimension sınırlılıkları ilgili upstream sürümün beyanıdır. Yerel patched MLightCAD ailesinin aynı davranışı taşıdığı varsayılmaz. Bu repo V2 doğruluğunun tek hakemi veya DWG okuyucusu değildir.

### ezdxf ve MLightCAD

[ezdxf grafik özellikleri](https://ezdxf.readthedocs.io/en/stable/tutorials/common_graphical_attributes.html), [katman kavramları](https://ezdxf.readthedocs.io/en/stable/concepts/layers.html), [drawing uygulamasının doküman kaynağı](https://github.com/mozman/ezdxf/blob/master/docs/source/addons/drawing.rst). Katman/stil mirası, lineweight ve rendering sınırlılıklarını karşılaştırmak için araştırma kaynağı. Yeni Python runtime veya tek görsel oracle seçilmedi. Aynı dosyayı iki açık kaynak kütüphanesinin benzer çizmesi, bağımsız CAD doğruluk kanıtı değildir.

MLightCAD'in bu repoda sabitlenmiş DWG/DXF/SHX/MTEXT paketleri [00](00_BAGLAYICI_UYGULAMA_KARARLARI.md) ve [önceki API incelemesindeki](arastirma/gemini-karar-dayanaklari.json) rollerinde kalır. Pan/render temelini almak adına cad-simple-viewer host'u V2'ye sarılmayacak. Decoder'ın çözemediği CAD anlamını Three veya D3 tamamlayamaz.

### Tarayıcı ve GPU davranışı

[MDN WebGL iyi uygulamaları](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices), [Khronos context recovery](https://wikis.khronos.org/webgl/HandlingContextLost), [WEBGL_lose_context](https://registry.khronos.org/webgl/extensions/WEBGL_lose_context/). Context recovery açık bir yeniden kaynak kurma akışıdır; kayıp GPU nesnelerine erişerek devam edilmez. Simüle edilen kayıp ve gerçek cihaz GPU kaybı raporda ayrı kalır.

## Gemini'nin kaynak kullanma fişi

Her doğrudan kullanım için paket/sürüm/lock integrity, import yolu, amaç, mevcut lisans dosyasına referans, wrapper yolu ve ilgili N/V/R testi kaydedilir. Kopyalanmış kod varsa kaynak commit/dosya/hash, özgün notice ve değişiklik farkı ayrı fişlenir; lisans etiketi tek başına yasak değildir; D22/U2 gerçek dağıtım koşulları uygulanır. Hazır viewer'ı V2 diye sarma yasağı mimari sınır olarak sürer. Sadece README'yi okumuşken “repo kodu doğrulandı” yazılmaz. Araştırma için açılmış depolar dependency listesine otomatik eklenmez.

Güncel sürüme yükseltmek ayrı karar gerektirir. Sabit sürüm seçimi, güvenlik ve kalite sorunu olamayacağı garantisi değildir; gerçek engel veya doğrulanmış açık bulunursa CR ile Astra'ya gelir.
