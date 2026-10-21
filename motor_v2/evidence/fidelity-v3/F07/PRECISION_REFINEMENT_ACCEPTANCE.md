# F07 — Yüksek koordinat hassasiyeti ve eğri runtime refinement alt kapıları

Durum: **ALT KAPI PASS; F07 PAKETİ AÇIK (IN_PROGRESS)**. Bu kayıt F07 planının tüm kabul ölçütlerinin karşılandığını veya AutoCAD eşdeğerliğini iddia etmez.

## Bu turda doğrulanan düzeltmeler

- World-space kalın polyline, HATCH ve WIPEOUT üçgenleri normalization/origin subtraction öncesinde `Float64Array` olarak tutulur. Scene compiler giriş tipi de bu sözleşmeyi korur; binary scene üretiminde koordinatlar önce origin'den çıkarılır, sonra protokolün `Float32` yerel koordinat alanına yazılır.
- Her binary chunk kendi Float64 world origin'ini hesaplar. Uzak iki chunk aynı global origin'e göre Float32'ye indirilmez; local XY/triangle verisi kendi chunk anchor'ına göre kodlanır.
- ARC, ellipse ve bulge için bounded tessellation sonuçları istenen/üretilen segment sayısını, ölçülen/conservative world-space hata değerini ve `errorBoundMet` durumunu taşır. Curve başına API tavanı 1.000.000; production scene compiler tavanı 65.536'dır. Production compiler'da circle, arc, ellipse, LWPOLYLINE bulge ve HATCH içindeki arc/ellipse/bulge cap'e çarparsa manifest `degraded` ve `CURVE_REFINEMENT_LIMIT_REACHED` üretir.
- SPLINE için sabit örnekleme kaldırıldı: pozitif ağırlıklı rational/non-rational B-spline knot span'leri Bezier parçalarına dönüştürülüp kontrol-hull/chord uzaklığıyla uyarlamalı bölünür. Degree, knot sayısı/sıralaması/domain, kontrol noktaları, pozitif sonlu ağırlıklar, derinlik ve segment tavanı denetlenir. Clamped cubic uçları, iki span'li quadratic, ters-S eğrisi ve rational quadratic çeyrek çember 2.000'er yoğun referans örneğiyle sınanır. HATCH spline kenarı aynı evaluator/bütçeyi kullanır; geçersiz spline nedeniyle sahte dolgu/kapalı sınır üretmemek için tüm HATCH fail-closed edilir.
- SPLINE evaluator'ı geçersiz girdiyi `invalidInput` ile, düşük segment bütçesini ise `errorBoundMet=false` ile ayrı bildirir. Entity scene manifest'i invalid geometri için `CURVE_GEOMETRY_INVALID`, bütçe aşıldığında `CURVE_REFINEMENT_LIMIT_REACHED` üretir; ikisi de kaliteyi `degraded` yapar. Periyodik spline şimdilik desteklenmez ve fail-closed bırakılır; gerçek AutoCAD periodic profile doğrulanmadan destek iddiası kurulmaz.
- `SceneCompileOptions`, `targetCurveErrorCssPixels`, `unitsPerCssPixel` ve `maxTransformSingularValue` üçlüsü verildiğinde `worldError = targetCssPixels * unitsPerCssPixel / sigmaMax` toleransını entity circle/arc/ellipse/bulge/spline ve HATCH tessellator'larına geçirir. Eksik/tekil parametre tahmin edilmez; derleme reddedilir. Sentetik compile→binary geometri testi 0.25 CSS px bütçesini ölçüyor. Bu checkpoint'te aynı bütçe `EntityVisitor` üzerinden INSERT ve nested INSERT affine dönüşümlerini de hesaba katar; paper-space viewport projeksiyonu için 2×2 affine matrisin en büyük singular değeri toleransa eklenir. Prepare aşaması bu compile-time view-profile opsiyonlarını henüz canlı kamera değerleriyle beslemez; ilk görüntü fallback'i eski çağrılarda geriye uyumlu `0.25` world-unit varsayımını korur. Bu, aşağıda belgelenen yükleme sonrası sidecar/worker runtime refinement zincirinden ayrıdır.
- Mirrored bulge uç nokta testi bir kök geometri hatası buldu: offset center yanlış taraftaydı; bulge neredeyse doğru yönde dursa da source endpoint'e ulaşmıyordu. Normal işaret düzeltildi; pozitif/negatif süpürmeler için iki endpoint de sınandı.
- Eski `tessellateArc` points-only arayüzü geriye uyumluluk için korunmuştur ve yeni budget API'sinin noktalarını döndürür.
- Yeni kabul testi 1e9 koordinatta 0.01 uzunluk ve genişliğin triangle/scene binary roundtrip boyunca korunmasını doğrular. ARC budget solver testi 4 zoom × DPR 1/2/3 profillerinde caller tarafından dünya biriminde verilen toleransı sagitta ile doğrular; bu yalnızca tessellator matematiğini sınar, production kamera/zoom/DPR bağlantısını kanıtlamaz. Yapay düşük segment tavanında hata sınırının sağlanmadığı ayrıca denetlenir.

## Çalıştırılan doğrulamalar

- `npx tsx tests/cad-v2/precision-refinement.test.ts` — **PASS**
- `npx tsx tests/cad-v2/geometry-curves-hatch.test.ts` — **PASS**
- Yoğun S-eğrisi ve rational NURBS referans örneklemesi, çoklu knot span, segment tavanı, bozuk ağırlık, invalid geometry diagnostic ve hatalı spline içeren HATCH fail-closed kabul testleri — **PASS**.
- `npx tsx tests/cad-v2/stroke-width.test.ts` — **PASS**
- `npx tsx tests/cad-v2/hatch-topology.test.ts` — **PASS**
- `npx tsc --noEmit --target es2020 --module esnext --moduleResolution bundler --jsx preserve --skipLibCheck --esModuleInterop --allowSyntheticDefaultImports tests/cad-v2/precision-refinement.test.ts` — **PASS**
- `npm run check:cad-v2:unit` — **PASS (exit 0)**; yeni precision testi unit zincirine eklendi.
- `npm run check:cad-v2:release` — **PASS (exit 0), per-chunk origin ve bulge/ellipse-budget/production-diagnostic düzeltmelerinden önceki checkpoint**; unit + integration (R001–R004 corpus/performance ve izole CLI dahil) + UI ve F06 browser/WebGL kabul testi.
- Sonraki F07 artımları sonrası `precision-refinement.test.ts`, `primitive-roundtrip.test.ts`, `geometry-curves-hatch.test.ts`, `hatch-topology.test.ts`, hedefli `tsc`, `git diff --check` ve tam `npm run check:cad-v2:unit` — **PASS**.
- En son compiler değişiklikleri sonrasında tam integration/UI/browser release zinciri henüz tekrarlanmadı; release-level doğrulama F07 kapanışında çalıştırılacak.
- `git diff --check` — **PASS**

## Açık F07 kabul kapıları

1. **Spline profili ve AutoCAD fixture'ları:** Direct/nested standalone entity SPLINE ve HATCH'in pozitif ağırlıklı, non-periodic knot span'leri rational Bezier source olarak bounded runtime refinement alır; periodic spline fail-closed durumundadır. Bağımsız yoğun De Boor oracle'ı şimdi sentetik, pozitif ağırlıklı degree-2/3/4/5 profillerde iç knot çokluklarının 1–degree aralığını kapsar. Diğer degree/knot profilleri, gerçek AutoCAD-authored rational/periodic spline fixture ve bağımsız AutoCAD evaluator kıyası açık kalır.
4. **Analitik curve payload/refinement:** Direct ve nested/transformed `CIRCLE`/`ARC`/`ELLIPSE`/signed `BULGE`/non-periodic `SPLINE` kaynakları affine `CURVE_DATA` sidecar'ına bağlanır; tekrarlı INSERT örnekleri ayrı kimlik alır. Continuous HATCH edge `ARC`, polyline-loop `BULGE`, `ELLIPSE` ve bounded positive-weight/non-periodic `SPLINE` Bezier knot span'leri `CURVE_DATA` plus META source payload ile sidecar alır; ellipse signed sweep yönü canonical `ccw` değerini, spline span parametreleri fallback tessellator'ı izler. Width/fill veya kesintili linetype taşıyan polyline'lar fallback'te kalır; XCLIP ile kesilen span'lere analytic source bağlanmaz. Host gerçek CSS camera ölçeğini 1/4 oktav bucket'larına bağlar, pan aynı bucket'ta işi yinelemez, zoom callback'leri 120 ms coalesce edilir; transient `0.75 CSS px` ve idle `0.25 CSS px` hedefleri, kalite gerilememe ve atomik chunk-group replacement kuralları gerçek host e2e'sinde sınanır. Worker evaluator, basis/source control hull ve span'leri yoğun bağımsız oracle ile ölçer. HATCH periodic `SPLINE` kenarları sidecar almaz; HATCH dolgusunun statik triangle mesh'i boundary sidecar refinement ile yeniden triangulate edilmez. Periodic AutoCAD fixture/desteği ve same-source AutoCAD kıyası açık kalır. CSS hata bütçesinde DPR çarpanı kullanılmaz.
5. **Spatial chunking/culling:** Compiler chunk AABB'si line/triangle geometriyi kapsar; ayrıca lineweight stroke'u için en büyük etkin lineweight'in yarısı kadar genişletilir. Bbox flat manifest ve hash'li index sayfasında taşınır; validator finite/min-max kontrolü yapar ve eski bbox'sız manifestleri kabul eder. Host doğrulanmış manifest bbox'larını renderer'a aktarır; renderer her kamera değişimi ve layout seçiminde 1 CSS px görünürlük payı ile chunk group'larını culler. Eksik/bozuk bounds fail-open kalır. Compiler hâlâ global primitive sırasını ardışık primitive-count chunk'larına böler; spatial partition ve partition sonrası interleaved command gruplama açık. Global `globalOrderIndex` ve 15.002 gerçek LINE/ters chunk teslim testi mevcut painter order garantisini sınar.
6. **Entegrasyon/kullanıcı görünümü:** source retention tavanı ve worker bounded output/cache/inline-sidecar yolu vardır; fallback chord span'i replacement helper'ı ile gerçek renderer'a verilir. Worker cancellation/cache identity browser worker testinde, span boyutu ve draw-command reindexing unit testinde doğrulanır. Gerçek host browser e2e'si ARC üzerinde camera → worker → WebGL replacement, stale bucket drop, same-bucket pan, transient/idle profilleri ve kalite monotonluğunu kanıtlar; bu browser oracle nested BULGE runtime yolunu ayrıca sürmez. Chunk-boundary painter-order/count testi geçti. XY/TRIANGLES chunk-local Float32 koordinat dönüşümünün ölçülen vertex round-trip hatası per-chunk metadata'ya yazılır; aktif screen-budget profili verilmiş ve sınır aşılmışsa scene `CHUNK_QUANTIZATION_LIMIT_REACHED` ile degraded olur. Bu ölçüm CURVE_DATA/meta kaynak temsili, dash-distance, GPU matris yuvarlaması, tessellation/hatch fill ve per-glyph semantik hatayı kapsamaz; bu daha geniş hata muhasebesi açık kalır.
7. AutoCAD aynı-kaynak görsel oracle'ı çalıştırılmadı; otomatik testlerin yeşil olması AutoCAD görünüş eşitliğini kanıtlamaz.

**F07 paketi PASS olarak işaretlenemez.** Paket ancak yukarıdaki zorunlu kabul kapıları test ve gerçek pipeline kanıtlarıyla kapatıldığında PASS olur.

## 2026-09-24 ek checkpoint — global painter order across compiler chunks

- Compiler `drawCommands` metadata'sına her komutun ilk primitive'inin global sorted-stream index'ini (`globalOrderIndex`) ekler. Renderer komutları oluştururken bu indeksi `renderOrder` olarak kullanır; `chunkIndex * 10,000` yalnız global indeks bulunmayan eski cache/chunk verisi için fallback'tir.
- Gerçek compiler fixture'ı 15.002 farklı stilde LINE'ı 1.000 primitive'lik 16 chunk'a böler. Chunk'lar ters ağ gelişinde açılır; manifest sırasına göre çözümlenen renderer order değerlerinin eksiksiz ve tekil `0..15,001` olduğu doğrulanır. Resolver ayrıca yeni global indeks tercihinin ve eski metadata fallback'inin sınırlarını test eder.
- Renderer/compiled META çıktısı değiştiğinden `CAD_V2_COMPILER_REVISION` v7→v8 ilerletildi. Section binary layout değişmedi; schema v1 sabit kaldı.
- `npx tsx tests/cad-v2/painter-order.test.ts`, `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (Chromium 2/2), production runtime `tsconfig.next.json` typecheck ve `git diff --check` — **PASS**.
- Bu alt kapı bounded spatial partition'ı, partition edilmiş chunk içindeki interleaved command gruplamasını, geometrik chunk error accounting'i, fill/glyph hata bütçesini veya F07'yi kapatmaz.

## 2026-09-23 ek checkpoint

Bounded entity/HATCH spline, invalid geometry diagnostic ve HATCH fail-closed değişiklikleri sonrasında:

- `npx tsx tests/cad-v2/precision-refinement.test.ts` — **PASS**.
- `npx tsx tests/cad-v2/geometry-curves-hatch.test.ts` — **PASS**.
- Precision acceptance bağımlılıklarını kapsayan hedefli `tsc` — **PASS**.
- `git diff --check` — **PASS**.
- `npm run check:cad-v2:unit` — **PASS (exit 0)**.
- Tam `npm run check:cad-v2:release` bu checkpoint sonrası çalıştırılmadı; F07 kapanış kapısı olarak kalır.

Bu checkpoint F07 paketini kapatmaz. Periodic spline AutoCAD fixture/desteği, ekli olmayan analitik eğri worker refinement'i, spatial partition/order index, fill/glyph/runtime hata muhasebesi ve AutoCAD aynı-kaynak görsel oracle'ı açıktır.

## 2026-09-23 ek checkpoint — screen-space compiler budget

- Tessellator'a verilen world-space tolerance'ın ekrandaki anlamı caller sorumluluğundaydı; önceki zoom × DPR testi üretim camera zincirini kanıtlıyor gibi isimlendirilmişti. Test adı/çıktısı düzeltildi ve kapsam farkı bu rapora işlendi.
- `worldCurveErrorFromScreen()` ve compiler view-profile seçenekleri eklendi. `targetCurveErrorCssPixels × unitsPerCssPixel / maxTransformSingularValue` bağı, compile edilen circle/arc/ellipse/polyline bulge/spline/HATCH eğrilerine taşınıyor; eksik view profilinde explicit hata veriliyor.
- Precision testinde derlenmiş gerçek circle chunk'ı açılıp Float32 binary koordinatlarından sagitta yeniden ölçüldü; view scale × transform sonrası 0.25 CSS px hedefi doğrulandı. Bu yalnız view profile compiler'a verildiğinde geçerlidir; app'in canlı camera/zoom/DPR değerini göndermesini veya worker'ın runtime refinement yapmasını kanıtlamaz.
- Hedefli precision test ve typecheck geçti. Tam unit zinciri bu son screen-budget değişikliği sonrasında ayrıca çalıştırılmalıdır.

## 2026-09-23 ek checkpoint — INSERT ve paper viewport eğri bütçesi

- Önceki düzeltmede scene compiler'ın doğrudan derlediği entity eğrileri view-profile bütçesini kullanıyordu; fakat `INSERT` içindeki eğriler `EntityVisitor` yolunda sabit örneklemeyle açılıyor, cap/invalid durumları da manifest kalite hesabına taşınmıyordu. `EntityVisitor` eğri hatasını birikimli INSERT dönüşümünün en büyük singular değeriyle ölçeklendiriyor; nested INSERT bu dönüşümü aynı context içinde koruyor.
- Paper-space model viewport'larında model→paper 2D affine dönüşümünün en büyük singular değeri visitor context'ine aktarılıyor. Böylece ölçülen çıktı dönüşüm sonrasında da aynı hata bütçesine bağlanıyor. Curve cap ve invalid spline sonuçları INSERT, dimension/leader visitor ve viewport yollarından sahne diagnostic/quality durumuna aktarılıyor.
- Binary scene kabul testi, X ölçeği 10/Y ölçeği 2 olan INSERT içindeki daireyi 20.000 noktalı analitik elips referansına göre 0.25 CSS px hata içinde doğruluyor. 4 segmentlik yapay cap'in `degraded` + `CURVE_REFINEMENT_LIMIT_REACHED` ürettiği de denetleniyor. Paper viewport testi 2× viewport projeksiyonu sonrası binary daireyi aynı hata bütçesine göre ölçüyor.
- Bu yeni adaptive davranış, P05 affine testindeki eski `circle=32 + arc=8 => 40` sabit segment sayısı varsayımını geçersiz kıldı. Test, sabit sayıyı değil uyarlamalı tessellation'ın yeterli segment üretmesini ve dönüştürülmüş sınır kutusunu korumasını doğrulayacak şekilde güncellendi.
- `npx tsx tests/cad-v2/precision-refinement.test.ts`, `layout-viewport.test.ts`, `entity-instance-parity.test.ts`, hedefli TypeScript kontrolü ve `git diff --check` — **PASS**. `npm run check:cad-v2:unit` — **PASS (exit 0)**; zincir F05'i mevcut kapsamıyla **PARTIAL** olarak raporlar.
- Canlı prepare/host camera→compiler/worker bağlantısı, dashed circle/arc refinement bütçesi, periodic spline AutoCAD oracle'ı, spatial chunk partition/global painter-order indeksi, fill/glyph hata muhasebesi ve aynı-kaynak AutoCAD görüntü kıyası hâlâ açık olduğundan F07 paketi **IN_PROGRESS** kalır.

## 2026-09-23 ek checkpoint — kesikli ARC/CIRCLE eğri doğruluğu

- Kesikli `ARC`/`CIRCLE` çiziminde dash/gap aralıkları gerçek yay uzunluğu (`r × theta`) üzerinden korunurken, her görünür dash parçası artık `maxErrorWorld` sagitta bütçesine göre chord'lara bölünür. Önceki sabit `0.25` world-unit toleransı ve 512 nokta tavanı kaldırıldı; her entity için açık ve güvenli `maxSegments` tavanı kullanılır.
- Kesikli tessellator sonuçları `maxSagittaWorld`, `errorBoundMet` ve `refinementLimitReached` durumlarını taşır. Pattern iterasyonları ile görünen chord/dot çıktısı da sınırlandırılmıştır; cap aşılırsa kısmi çıktı sessizce tam kabul edilmez, scene compiler kaliteyi `degraded` yapıp `CURVE_REFINEMENT_LIMIT_REACHED` üretir.
- Scene compiler direct ARC/CIRCLE yolları world-space toleransı; INSERT/nested INSERT visitor yolları ise dönüşüm singular değerine göre daraltılmış local toleransı geçirir. Paper viewport'un downstream ölçeği de aynı visitor sözleşmesinde yer alır.
- Yeni kabul testi: pattern fazı/yay uzunluğu korunumu, istenen geometrik sagitta, aşırı sıkı toleransta çıktı tavanı ve açık cap bildirimi, cap diagnostic propagation; ayrıca kesikli dairenin gerçek binary scene XY verisinden 0.25 CSS px screen-error ölçümü.
- `npx tsx tests/cad-v2/precision-refinement.test.ts`, `npx tsx tests/cad-v2/linetype-phase.test.ts`, hedefli TypeScript kontrolü, `git diff --check` ve `npm run check:cad-v2:unit` — **PASS (exit 0)**.
- Bu yalnız compile-time eğri doğruluğudur. Canlı camera→worker refinement, zoom bucket/cache ve transient/idle politikasını kapatmaz; AutoCAD spline fixture, spatial partition/order gate'leri ve same-source image oracle da açık kalır. F07 **IN_PROGRESS**.

## 2026-09-23 ek checkpoint — runtime refinement kök engel denetimi

- Prepare → durable service → scene compile → host fit → worker chunk decode → renderer akışı kaynakta izlendi. Gerçek camera profili ilk fit'ten sonra oluşuyor; worker v1 yalnız binary scene'i açıyor ve scene binary kaynak eğri parametrelerini taşımıyor.
- Bu nedenle yalnız camera mesajı eklemek veya her zoom'da tüm dosyayı baştan compile etmek kabul edilmedi. Bir sonraki uygulama alt dilimi için sidecar kaydı, affine eğri temsili, session/generation/bucket protokolü, atomik renderer swap, pan/zoom/idle kuralları ve zorunlu kabul ölçüleri [runtime refinement karar kaydında](RUNTIME_REFINEMENT_ARCHITECTURE.md) sabitlendi.
- Bu checkpoint mimari inceleme/karar kaydıdır; canlı worker refinement'in uygulandığı anlamına gelmez. F07 halen **IN_PROGRESS**; sonraki alt iş analitik daire/yay kaydını ve saf bounded evaluator'ı kod/test ile gerçekleştirmektir.

## 2026-09-23 ek checkpoint — analytic source sidecar ilk compiler dilimi

- Direct `CIRCLE`/`ARC` chord aralıkları için opsiyonel `CURVE_DATA` F32×8 analitik aralık kaydı eklendi. Record center'ı chunk-relative, basis vektörleri ve signed parametre aralığı source-space'de tutulur. META v1 curve kimliğini, parametre record'ını ve değiştirilebileceği fallback vertex span'ini bağlar.
- Aynı curve içinde parametreleri ve fallback vertex'leri bitişik chord'lar tek sidecar record'ında gruplanır; dash/gap aralıkları ve chunk sınırları birleşmeyi keser. XY/PATH_DISTANCE fallback korunur ve eski consumer'lar sidecar yokmuş gibi çalışabilir.
- Binary trust boundary sabit F32×8 section biçimini ve tüm eğri alanlarının finite olmasını denetler. Test küçük chunk sınırıyla split, saat yönlü/tersi ARC ve CIRCLE sidecar'larını, parametre uçlarının fallback chord uçlarıyla eşleşmesini ve NaN reddini sınar.
- `npx tsx tests/cad-v2/precision-refinement.test.ts` ve `npx tsx tests/cad-v2/binary-protocol.test.ts` — **PASS**.
- Worker sidecar'ı explicit `refine-curves` isteğiyle tüketir; renderer swap/camera bucket, dönüşümlü ve nested kaynak eğriler, spline/ellipse/bulge kapsamı ve AutoCAD same-source visual oracle açık olduğundan F07 **IN_PROGRESS** kalır.

## 2026-09-24 ek checkpoint — bounded affine curve evaluator

- `src/lib/cad-v2/worker/curve-refinement.ts` DOM/Three/Node bağımlılığı olmadan worker'da çalışabilecek saf evaluator olarak eklendi. Her F32×8 parametre kaydını ve META vertex span referansını doğrular; affine basis için `max|P''|·Δt²/8` bound'u kullanır ve `targetErrorCssPixels × unitsPerCssPixel / maxTransformSingularValue` hesabıyla segment sayısını seçer.
- Chunk-relative Float32 çıktı kuantalaması da konservatif hata payına eklenir. Bu pay hedef bütçeyi aşarsa koordinat çıkarılmaz ve `float32-precision` ile degraded raporlanır; entity başı/toplam segment tavanında kısmi sonuç `segment-cap` ve `errorBoundMet=false` taşır. Pan/DPR'yi bu evaluator'a eklemedik: CSS-pixel sözleşmesinde DPR dışarıda kalır, pan sonraki bucket/cache katmanının sorumluluğudur.
- `tests/cad-v2/curve-refinement.test.ts`, derlenmiş CIRCLE/ARC sidecar'ından evaluator'a kadar zinciri; saat yönü/tersi, non-uniform basis, aynalı yay, yoğun oracle, Float32 uç noktaları, allocation cap, precision floor ve bozuk/taşan reference reddini doğrular. `check:cad-v2:unit` zincirine eklendi.
- `npx tsx tests/cad-v2/curve-refinement.test.ts`, ilgili dosyaların strict ES2022 TypeScript kontrolü ve `git diff --check` — **PASS**.
- `refine-curves` worker mesajı, 8 MiB session source cache/LRU, dispose temizliği ve client-side generation iptali eklendi. `scripts/build-dwg-dxf-worker.mjs` iki worker artifact'ini de üretir; gerçek Chromium testi public bundle ile initial load/cache/refine/cancel/stale-generation drop/current-generation cache-hit akışını doğrular. Host camera bucket/coalescing/idle-transient callback ve renderer atomik swap henüz yapılmadı; bu nedenle refinement sonucu otomatik görüntüye uygulanmaz ve F07 **IN_PROGRESS** kalır.
- `npx tsx tests/cad-v2/worker-refinement-browser.test.ts`, bounded evaluator kabulü, ilgili strict TypeScript kontrolü, worker build ve `git diff --check` — **PASS**. Tam unit zinciri sidecar/evaluator checkpoint'inde PASS; worker runtime checkpoint'i sonrasında yeniden çalıştırılıp **PASS** alınmıştır.

## 2026-09-24 ek checkpoint — camera bucket ve renderer span replacement

- Gerçek host kamera state'i 1/4 oktav bucket'ında izleniyor. Pan aynı bucket'ta iş üretmiyor; zoom işleri 120 ms coalesce ediliyor; bucket içinde en ince zoom kullanılarak CSS toleransı muhafazakâr tutuluyor. Scope halen direct CIRCLE/ARC'tır.
- Host en fazla 32 MiB kaynak chunk tutar. Worker 8 MiB LRU cache'i dolduğunda/eviction olduğunda WorkerClient sadece bounded curve sidecar'ı inline kopya olarak aktarır; tam scene/DWG tekrar parse edilmez. Refined coordinates, eski chord aralığını connected `LineSegments` çiftlerine çevirir ve downstream draw-command start/count aralıklarını taşır. Renderer replacement aynı JS görevi içinde yeni grubu kurup eskisini sonraki RAF öncesi dispose ederek fallback/refined üst üste görünmesini engeller. Kaynak unpacked chunk değişmez tutulur ve yeni bucket bu kaynaktan yeniden hesaplanır.
- `tests/cad-v2/curve-refinement.test.ts` fallback replacement, neighbor preservation, painter-order/style metadata ve input immutability oracle'larıyla genişletildi. `worker-refinement-browser.test.ts` LRU miss inline payload yolunu da sınar.
- Bu tur: `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (Playwright Chromium 1/1), `npx tsc --noEmit -p tsconfig.next.json --incremental false`, `git diff --check` — **PASS**.
- `tests/document-studio/cad-v2-layout-viewport.spec.ts` artık gerçek V2 host'ta toolbar zoom'u 100%→125% değiştirir, worker'a giden `refine-curves` mesajını ve WebGL `LINES` çizimindeki vertex sayısının fallback 2'den büyümesini doğrular. Bu test, camera → sidecar → worker → renderer zincirini browser/WebGL ortamında uçtan uca kanıtlar. `npm run check:cad-v2:ui` sonucu F06 + F07 Chromium testleri **2/2 PASS**; ardından `npx tsc --noEmit -p tsconfig.next.json --incremental false`, targeted `curve-refinement.test.ts` ve `git diff --check` de **PASS**.
- Test koşusu sırasında `.next` varsa Playwright'ın otomatik olarak o klasördeki sunucuyu seçmesi, çalışma ağacından eski üretim bundle'ı test edebildiğini ortaya çıkardı. `playwright.config.ts` değişikliğiyle varsayılan kaynak test sunucusu dev'dir; production browser testi ancak `PLAYWRIGHT_PRODUCTION_SERVER=1` açıkça ayarlandığında çalışır.
- Browser testi artık ilk worker refinement yanıtını bekletir, kamera bucket'ını ikinci zoom ile değiştirir, eski yanıtı serbest bıraktığında çizilen geometri sayısının fallback seviyesinde kaldığını doğrular; güncel bucket için ikinci worker isteğini ve yalnız onun yanıtından sonra artan WebGL çizgi vertex sayısını bekler. Böylece stale bucket yanıtının uygulanmaması gerçek host/browser/worker/WebGL hattında kanıtlanmıştır. Refined çizimden sonra gerçek pointer drag ile canvas görüntüsünün pan olduğu, zoom oranının sabit kaldığı ve worker refinement isteği sayısının artmadığı da doğrulanır. Güncel doğrulama: `npm run check:cad-v2:ui` F06 + F07 **2/2 PASS**, production runtime tsconfig typecheck, targeted curve-refinement testi ve `git diff --check` **PASS**.
- Bu browser oracle'ı aynı kaynakta gerçek CSS piksel hata ölçümü sağlamaz ve transient/idle ayrı kalite hedefini, tüm runtime eğri türlerini, spatial partition/order, fill/glyph error accounting veya AutoCAD same-source görüntü kıyasını kapatmaz. Bu kabul kapıları açık olduğundan F07 **IN_PROGRESS** kalır.

## 2026-09-24 ek checkpoint — transient/idle, pan debounce ve kalite monotonluğu

- Host iki hedefi ayırır: kamera bucket'ı değiştiğinde 120 ms debounce sonrası transient **0.75 CSS px**; en son aynı-bucket kamera hareketinden 600 ms sonra idle **0.25 CSS px**. Same-bucket pan yeni transient işi başlatmaz, fakat çizim etkileşimi sürerken idle işini öne almaz; idle sayacı son hareketten itibaren yeniden başlar.
- Host her chunk için ekranda gösterilen tessellation'ın konservatif world-error sınırını saklar. Yeni zoom bucket'ının transient tessellation'ı mevcut görüntüden daha kaba kalıyorsa geometri değiştirilmez; daha sıkı idle sonucu sadece gerçek hassasiyet kazanımı sağlıyorsa atomik replacement yapılır. Transient veya idle sonucu segment cap/degraded ise kısmi span'ler uygulanmaz; son geçerli görüntü korunur ve kalite uyarısı gösterilir.
- Gerçek Chromium host testi başlangıç fit'inin transient ve idle yanıtlarını tamamlayıp ölçüm taban çizgisini sabitler. Ardından canlı zoom'da stale yanıtın atılmasını, hedef sırasını, transient bekleme sırasında pan ile idle debounce'un yenilenmesini, geçici profil yanıtının daha hassas görüntüyü geriletmemesini ve sıkı idle yanıtının WebGL `LINES` geometrisini artırmasını doğrular.
- `npm run check:cad-v2:ui` (F06 + F07 Chromium **2/2**), targeted `npx tsx tests/cad-v2/curve-refinement.test.ts`, production runtime tsconfig typecheck ve `git diff --check` — **PASS**.
- Bu alt kapı F07'yi kapatmaz. Doğrudan top-level ELLIPSE compiler→sidecar→worker yolu aşağıdaki checkpoint ile kabul edildi; INSERT altında dönüştürülmüş/nested eğriler, LWPOLYLINE bulge ve SPLINE runtime source, AutoCAD periodic spline fixture/desteği, gerçek spatial partition/global order, fill/glyph error accounting, geniş zoom cache oracle'ı ve aynı-kaynak AutoCAD render/ölçü karşılaştırması açık kalır.

## 2026-09-24 ek checkpoint — doğrudan ELLIPSE runtime sidecar'ı

- Worker sidecar'ın parametrik affine-basis sözleşmesi direct top-level `ELLIPSE` kaynağını da kapsar. Compiler, canonical major-axis vektöründen dik minör basis'i ve entity'nin wrap edilebilen parametre sweep'ini üretir; metadata'da özgün handle ve `ELLIPSE` tipi korunur.
- `tests/cad-v2/curve-refinement.test.ts` sentetik canonical ELLIPSE'i gerçek scene compiler üzerinden binary chunk'a derler, chunk'ı parse/unpack edip worker evaluator'ında yeniden örnekler. Test source type/tek source interval, fallback endpoint korunumu ve 20.000 örnekli bağımsız segment-mesafe oracle'ında `0.2 CSS px` üst sınırını doğrular. `npx tsx tests/cad-v2/curve-refinement.test.ts` ve production runtime typecheck — **PASS**.
- Kabul kapsamı direct top-level ELLIPSE'tir. `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (F06 + F07 Chromium **2/2**), production runtime typecheck ve `git diff --check` — **PASS**. Sonraki top-level bulge checkpoint'i aşağıda kayıtlıdır; dönüştürülmüş/nested block source provenance, HATCH bulge span'leri, spline knot-span/periodic desteği ve AutoCAD aynı-kaynak kıyası açık olduğundan F07 **IN_PROGRESS** kalır.

## 2026-09-24 ek checkpoint — top-level LWPOLYLINE bulge runtime sidecar

- Width'siz, kesintisiz LWPOLYLINE bulge segmentleri `BULGE` kaynak kimliğiyle mevcut analytic basis kayıt biçimine bağlanır. Her arc chord'u parent polyline handle'ını, polyline segmentine özel curve kimliğini ve signed başlangıç/bitiş parametrelerini taşır; pozitif ve negatif bulge yönleri korunur.
- Compiler, fallback chord ve worker source'larını aynı `getBulgeArcParameters()` hesabından üretir; böylece merkez, yarıçap ve sweep işaretinin iki ayrı formülde zamanla ayrışması önlenir. İki yönlü bulge testi gerçek binary chunk'ı parse edip worker evaluator'ından geçirir; kaynak aralıkları ayrı kalır, uç noktalar eşleşir ve 20.000 örnekli bağımsız geometrik oracle `0.2 CSS px` üst sınırını doğrular.
- Width'li polyline sidecar üretmez; sabit genişlik fill mesh'i runtime'da yeniden örneklenen centerline ile uyumsuz kalabilir. Kesintili linetype yolu da dash/gap görünürlüğü ve fazı bu sidecar sözleşmesinde taşınmadığından sidecar üretmez. Bunlar fallback geometriyle görünür kalır.
- Scene compiler çıktısı değiştiğinden `CAD_V2_COMPILER_REVISION` `cad-v2-compiler-2026.09-v4` → `cad-v2-compiler-2026.09-v5` ilerletildi; eski derlenmiş sahnelerin yeni sidecar kurallarını atlaması önlenir.
- `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (F06 + F07 Chromium **2/2**), production runtime typecheck ve `git diff --check` — **PASS**.
- Bu kabul direct top-level width'siz/continuous LWPOLYLINE bulge segmentleriyle sınırlıdır. INSERT/nested dönüşüm provenance, width/dash eşliği, HATCH edge bulge, SPLINE segment sidecar'ı, periodic spline AutoCAD fixture/desteği ve same-source AutoCAD görsel/ölçü oracle'ı açık kaldığından F07 **IN_PROGRESS**.

## 2026-09-24 ek checkpoint — nested/transformed LWPOLYLINE bulge runtime sidecar

- `EntityVisitor`, nested INSERT içinde derlenen width'siz ve kesintisiz LWPOLYLINE yay chord'larının `GeometryCompiler.expandLwPolyline()` tarafından üretilmiş analitik source aralıklarını korur. Merkez ve iki circle basis vektörü birleşik INSERT affine matrisinden WCS XY'ye taşınır; curve kimliğine tüm INSERT handle yolu eklenir. Böylece aynı block'un yinelenen örneklerinde ve polyline'ın ayrı bulge segmentlerinde kimlik çakışmaz.
- Genişlikli/fill mesh'iyle birlikte hassasiyeti eşleştirilemeyen veya kesintili linetype fazı taşımayan polyline'lar sidecar almaz. `addSegment()` XCLIP clipping dalı analytic metadata'yı atar; kısmi görünür chord fallback geometrisi korunur fakat tam kaynak aralığıymış gibi rafine edilmez.
- Nested kabul testi mevcut iki katmanlı INSERT fixture'ına zıt signed sweep'li iki bulge ekler. Non-uniform/mirrored ölçek, rotation, iki top-level instance ve worker evaluator sonrası toplam 10 analytic interval, 10 benzersiz source kimliği, fallback uç noktaları ve her interval için 20.000 örnekli `0.2 CSS px` oracle doğrulanır. Ayrı clip testi görünür fallback fragment'lerinin kaldığını ve hiçbirine tam curve sidecar bağlanmadığını denetler.
- Yeni compiler çıktısı cache identity'yi etkilediğinden `CAD_V2_COMPILER_REVISION` `v6` → `v7` yükseltildi. Binary `CURVE_DATA` stride/layout değişmediği için `DV2SCN01` schema sürümü 1 olarak bırakıldı.
- `npx tsx tests/cad-v2/curve-refinement.test.ts`, `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (F06 + F07 Chromium **2/2**), `npx tsc --noEmit -p tsconfig.next.json --incremental false`, `npx tsx tests/cad-v2/cache-identity.test.ts` ve `git diff --check` — **PASS**. İlk targeted test koşusu yeni span sayısını yakalayıp eski 6-aralık beklentisinde kaldı; beklenti gerçek 10 compiler span'ine bağlandı ve test geçti.
- Kalan F07: HATCH `ARC`/polyline `BULGE`, `ELLIPSE` ve non-periodic `SPLINE` boundary sidecar'ları aşağıdaki checkpoint'lerde eklendi; HATCH fill mesh'ini refinement sonrası yeniden üretip hata hesabına bağlama açık. Entity SPLINE source sidecar'ı, periodic spline AutoCAD fixture/desteği, bounded spatial partition (global painter-order index var fakat spatial partition yok), fill/glyph/chunk-boundary hata muhasebesi ve aynı kaynak/profile/ROI için AutoCAD görsel/ölçü oracle'ı da açık. Bu nedenle F07 **IN_PROGRESS**, genel AutoCAD eşdeğerliği iddiası yoktur.

## 2026-09-24 ek checkpoint — HATCH edge ARC ve polyline BULGE sidecar'ları

- `triangulateHatch()` boundary tessellation'ında her chord, kaynak eğrinin loop/edge kimliği ve parametrik alt aralığıyla birlikte taşınır. HATCH edge `ARC` ile polyline-loop signed `BULGE` için fallback boundary chord'larına `CURVE_DATA` source span üretilir; line, ellipse ve spline span'leri sidecar'sız fallback olarak kalır.
- Top-level ve nested/transformed HATCH yolları yalnız continuous linetype için sidecar metadata'sını korur. Nested INSERT affine matrisi center/basis'e uygulanır; INSERT instance yolu ve HATCH loop/edge kimliği curve ID'yi benzersiz kılar. XCLIP parçası fallback çizgisini tutar ama tam eğri kaynağı iddiası taşımaz.
- Yeni test top-level polyline BULGE, top-level edge ARC ve mirrored/non-uniform/rotated nested HATCH ARC'larını binary scene → unpacked `CURVE_DATA` → worker evaluator hattından geçirir. 20.000 örnekli yoğun segment-mesafe oracle'ı her interval için `0.2 CSS px` sınırını, nested center/basis dönüşümünü ve fallback uçlarının korunmasını doğrular; XCLIP testi görünür parçaların metadata'sız kaldığını denetler. Solid fill triangle'ları aynı kaldığından bu doğrulama yalnız boundary stroke/runtime curve içindir; dolgu re-triangulation ve fill error accounting kabul edilmemiştir.
- Scene compiler çıktısı ve cache identity değiştiği için `CAD_V2_COMPILER_REVISION` v8→v9 yükseltildi. Binary record/layout değişmediğinden `CAD_V2_SCHEMA_VERSION` v1 kaldı.
- `npx tsx tests/cad-v2/curve-refinement.test.ts`, `npx tsx tests/cad-v2/hatch-topology.test.ts`, `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (F06 + F07 Chromium **2/2**), `npx tsc --noEmit -p tsconfig.next.json --incremental false` ve `git diff --check` — **PASS**.
- Bu alt kapı HATCH edge `ARC` ve polyline-loop `BULGE` boundary refinement ile sınırlıdır. HATCH `ELLIPSE`/`SPLINE`, entity SPLINE source sidecar/periodic AutoCAD profili, dynamic fill remesh ve fill/glyph/chunk error accounting, bounded spatial partition ve aynı-kaynak AutoCAD oracle'ı açık kaldığı için F07 **IN_PROGRESS**.

## 2026-09-24 ek checkpoint — HATCH edge ELLIPSE sidecar ve yön eşliği

- HATCH edge `ELLIPSE` tessellation ve analytic sidecar aynı signed parametre sweep'ini kullanır. `ccw=false` için saat yönündeki sweep korunur; evaluator basis'i majör vektör ile dik minör vektörden üretir. Geçersiz/bozuk ellipse parametrelerinde güvenilir analytic source yazılmaz.
- Top-level ve nested/transformed continuous HATCH ellipse chord'ları edge/loop/INSERT yolu içeren benzersiz `CURVE_DATA` kayıtlarına bağlandı. Nested affine dönüşüm hem basis vektörlerini hem merkezi taşır; mevcut XCLIP ve continuous-linetype koşulları korunur.
- Hedefli test top-level CCW ve nested mirrored/non-uniform clockwise HATCH ellipse'lerini binary parse/unpack ve worker refinement hattından geçirir. Her interval için 20.000 örnekli dense segment-distance oracle `0.2 CSS px` sınırını ve fallback uç noktalarını doğrular; ayrıca iki yönün signed parametre sweep'i ayrı assert edilir.
- Scene tessellation/sidecar çıktısı cache identity'yi değiştirdiği için `CAD_V2_COMPILER_REVISION` v9→v10 yükseltildi. Binary `CURVE_DATA` stride/layout değişmediğinden schema v1 kaldı.
- `npx tsx tests/cad-v2/curve-refinement.test.ts`, `npx tsx tests/cad-v2/geometry-curves-hatch.test.ts`, tam `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (F06 + F07 Chromium **2/2**), `npx tsc --noEmit -p tsconfig.next.json --incremental false` ve `git diff --check` — **PASS**.
- Bu alt kapı HATCH edge `ELLIPSE` boundary eğrisiyle sınırlı. HATCH `SPLINE`, fill mesh runtime remesh/error accounting, entity SPLINE/periodic AutoCAD profili, bounded spatial partition, fill/glyph/chunk error muhasebesi ve aynı-kaynak AutoCAD görsel/ölçü oracle'ı açık kaldığı için F07 **IN_PROGRESS**.

## 2026-09-24 ek checkpoint — HATCH SPLINE rational Bezier runtime sidecar

- Spline tessellator, her başarılı non-periodic knot span'i için exact rational Bezier control polygon/weights, fallback noktaları ve her noktanın span-local `[0,1]` parametresini birlikte döndürür. HATCH boundary compiler her span'i ayrı, handle/loop/edge/span kimlikli sidecar olarak kaydeder; segment cap veya invalid spline durumunda partial source iddiası üretmez.
- Sidecar knot-span kaynağı binary `CURVE_DATA` parametre/vertex aralığına META'daki `splineSource` payload ile bağlanır. Payload chunk-local Float32 fallback koordinatlarıyla aynı origin'e göre normalize edilir; nested INSERT'te rational Bezier control points affine matrisiyle dönüştürülür, weights değişmeden kalır.
- Worker positive-weight rational Bezier kaynağını bounded homogeneous de Casteljau bölmesiyle rafine eder. Her alt eğride Euclidean control hull'ın chord segmentine uzaklığı ve output Float32 quantization hatası birlikte CSS hata üst sınırına katılır. Derinlik/segment/global bütçe aşımında partial refined span dönmez; fallback kaynak geometri kalır. XCLIP'te kesilmiş parçaya source payload taşınmaz.
- Yeni test iki knot span'li rational quadratic HATCH'i hem doğrudan hem mirrored/non-uniform/rotated nested INSERT altında derler; 4 benzersiz Bezier span'ini parse/unpack edip worker'da rafine eder. Her span için 20.000 örnekli bağımsız rational-Bezier segment-mesafe oracle `0.2 CSS px` sınırını, konservatif worker bound'u ve fallback uçlarının korunmasını doğrular. Clip/cap testleri metadata dışlama yolunu sınar.
- Sidecar META yorumlama sürümü 1→2, compiler/cache revision v10→v11 ilerletildi. Binary `CURVE_DATA` sekiz-float record stride/layout değişmedi; `CAD_V2_SCHEMA_VERSION` v1 kaldı.
- `npx tsx tests/cad-v2/curve-refinement.test.ts`, `npx tsx tests/cad-v2/geometry-curves-hatch.test.ts`, tam `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (F06 + F07 Chromium **2/2**), `npx tsc --noEmit -p tsconfig.next.json --incremental false` ve `git diff --check` — **PASS**.
- Bu kabul yalnız continuous HATCH içindeki bounded positive-weight non-periodic rational SPLINE boundary spans içindir. Periodic SPLINE fixture/desteği, direct/nested entity SPLINE sidecar'ı, dynamic fill remesh/error accounting, spatial partition ve same-source AutoCAD görsel/ölçü oracle'ı açık olduğundan F07 **IN_PROGRESS**.

## 2026-09-24 ek checkpoint — entity SPLINE direct/nested rational Bezier runtime sidecar

- Scene compiler direct standalone SPLINE knot-span'lerini, `EntityVisitor` ise nested INSERT kaynaklarını ayrı kaynak kimlikleriyle `CURVE_DATA`/META sidecar'a bağlar. Her span kendi `[0,1]` parametresini, fallback chord aralıklarını ve positive-weight rational Bezier kontrol ağını taşır; INSERT affine dönüşümü kontrol noktalarına uygulanır, weights değişmeden kalır.
- Sidecar yalnız başarıyla sınırlandırılmış, continuous linetype'lı non-periodic span'lerde üretilir. Segment cap'te fallback geometri kalır ve partial spline source yayınlanmaz. XCLIP ile kırpılan parçalarda visitor analitik kaynağı düşürür; global viewport clip'ten geçirilen parçalara da bu test kapsamı içinde sidecar aktarılmaz.
- Hedefli test bir direct ve iki farklı non-uniform/mirrored/rotated nested INSERT örneğini derler; altı knot-span kimliğinin benzersizliğini, dönüşmüş kontrol noktalarını, binary META/`CURVE_DATA` payload'ını ve worker çıktısını denetler. Her refined span için 20.000 örnekli bağımsız rational-Bezier segment-mesafe oracle'ı `0.2 CSS px` sınırını, fallback uç noktalarını ve clip/cap kaynak dışlamasını doğrular.
- Yeni compiler çıktısı cache kimliğini etkilediğinden `CAD_V2_COMPILER_REVISION` v11→v12 yükseltildi. META `curveSourceVersion` v2 ve binary `CURVE_DATA` sekiz-float record stride/layout aynı kaldı; `CAD_V2_SCHEMA_VERSION` v1.
- `npx tsx tests/cad-v2/curve-refinement.test.ts`, `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (F06 + F07 Chromium **2/2**), `npx tsc --noEmit -p tsconfig.next.json --incremental false` ve `git diff --check` — **PASS**.
- Bu kabul yalnız continuous linetype'lı, bounded positive-weight non-periodic standalone entity SPLINE direct/nested span'leri içindir. Periodic spline AutoCAD fixture/desteği, tüm geçerli knot multiplicity profilleri, dynamic HATCH fill remesh/error accounting, spatial partition ve same-source AutoCAD görsel/ölçü oracle'ı açık olduğundan F07 **IN_PROGRESS**.

## 2026-09-24 ek checkpoint — chunk world-bounds manifest aktarımı

- Compiler her üretilen chunk için line/triangle geometrisinden conservative `[minX,minY,maxX,maxY]` world bbox hesaplar; flat manifest ve SHA-256 ile korunan index-page chunk kaydına aynı tuple yazılır. Binary chunk ve `DV2SCN01` schema değişmez.
- Manifest validator optional bbox alanını finite değerler ve min≤max koşuluyla doğrular, flat/index sayfaları ikisi de bbox taşıdığında çelişkiyi reddeder ve eski bbox'sız manifestlerle geriye uyumlu kalır.
- `chunk-scheduler-cache.test.ts` iki uzak çizgiyi ayrı kontrollü chunk'lara derler; gerçek compiler bbox'larının index sayfasında ve validator çıktısında korunmasını, ardından `SpatialChunkScheduler` viewport sorgusunun yakındaki chunk'ı seçip uzaktakini elemesini doğrular. `manifest-validation.test.ts` bozuk, ters, çelişkili ve legacy bbox profillerini sınar.
- Manifest/compiler çıktısı değiştiği için `CAD_V2_COMPILER_REVISION` v12→v13 artırıldı; `CAD_V2_SCHEMA_VERSION` v1 kaldı.
- `npx tsx tests/cad-v2/chunk-scheduler-cache.test.ts`, `npx tsx tests/cad-v2/manifest-validation.test.ts`, tam `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (F06 + F07 Chromium **2/2**), `npx tsc --noEmit -p tsconfig.next.json --incremental false`, cache identity ve `git diff --check` — **PASS**.
- Bu artım scheduler için bbox bilgisini hazırlar; production host hâlâ tüm chunk'ları eager yükler, compiler partition'ı global painter-order akışını mekânda yeniden gruplamaz ve renderer viewport culling uygulamaz. Bu nedenle bounded spatial partition/index kabulü açık, F07 **IN_PROGRESS**.

## 2026-09-24 ek checkpoint — gerçek renderer viewport chunk culling

- Compiler chunk world bbox'ı line centerline ve triangle vertex extents'ine ek olarak o chunk'taki en büyük etkin lineweight'in yarısını kapsar; görünür kalın stroke chunk sınırında kesilmez. Binary chunk layout'u değişmedi.
- Host manifest validation sonrasında flat chunk bbox'larını renderer'a kaydeder. Renderer kamera center/ölçek/viewport ölçülerinden world viewport bbox üretir, 1 CSS px overscan uygular ve görünürlük kararını aktif layout kesişimiyle birleştirir. Kamera pan/zoom/resize callback'i ve layout değişimi görünürlüğü yeniler. Bbox'sız eski manifest/chunk görünür kalır.
- `layout-viewport-render.test.ts` kamera bbox dönüşümü, edge overscan, uzak chunk culling'i, legacy fail-open, manifest bounds aktarımı, pan güncellemesi ve iki paper layout ile spatial culling birleşimini sınar. `chunk-scheduler-cache.test.ts` gerçek compiled manifest/index bbox'ının lineweight padding'iyle scheduler'a ulaşmasını doğrular.
- Compiler bbox anlamı değiştiği için `CAD_V2_COMPILER_REVISION` v13→v14 ilerletildi; `DV2SCN01` binary chunk ve schema v1 değişmedi.
- Bu alt kapı renderer'ın yüklü chunk gruplarını viewport'a göre gizler; host network fetch/decode'u hâlâ bütün chunk'lar için yapar. Compiler hâlâ sequential primitive-count partition kullanır. Spatial partition ve talep üzerine fetch, partition sonrası interleaved order, geometrik chunk error accounting, fill/glyph hesabı, periodic AutoCAD spline profili ve same-source AutoCAD oracle açık kaldığı için F07 **IN_PROGRESS**.

## 2026-09-24 ek checkpoint — chunk-local Float32 quantization hata muhasebesi

- Her compiler chunk'ında XY centerline ve TRIANGLES vertex'lerinin chunk-local `Float32`'ye yazılmış koordinatları origin geri eklenerek kaynak Float64 world noktalarıyla karşılaştırılır; en büyük Euclidean round-trip farkı `maxQuantizationErrorWorld` olarak flat manifest ve hash'li index metadata'sına yazılır.
- Compiler'a tam active-view error profili verilmişse aynı ölçüm `maxTransformSingularValue / unitsPerCssPixel` ile CSS piksele dönüştürülür ve `maxQuantizationErrorCssPixels` olarak taşınır. Bu vertex nicemleme hatası istenen CSS hedefini aşıyorsa scene `CHUNK_QUANTIZATION_LIMIT_REACHED` tanısıyla **degraded** olur; ölçüm PASS iddiası değil, gerçek ölçülen değerdir.
- Manifest validator ölçüm alanlarını optional/legacy uyumlu, finite ve non-negative doğrular; flat/index ikisi de alanı taşıyorsa değerin eşleşmesini zorunlu kılar. Binary `DV2SCN01` ve schema v1 değişmez.
- `chunk-error-accounting.test.ts` 1e9 koordinatta küçük Float64 geometriyi, line XY quantization ölçümünü, aktif kamera CSS dönüşümünü, geniş chunk'ta bütçe aşımı/degraded tanısını, WIPEOUT triangle vertex quantization'ını ve bozuk/çelişkili manifest metriklerini sınar.
- Compiler çıktısı, manifest ve quality durum davranışı değiştiği için `CAD_V2_COMPILER_REVISION` v14→v15 yükseltildi.
- Bu artım yalnız XY/TRIANGLES Float32 vertex round-trip farkını kapsar; CURVE_DATA F32 basis/center, spline META source, PATH_DISTANCE, kamera/GPU transform precision, tessellation error, HATCH fill, glyph topology ve chunk partition boundary etkilerini kapsamaz. Gerçek spatial partition/on-demand fetch, bu geniş hata muhasebesi, periodic spline AutoCAD profili ve same-source AutoCAD oracle açık kaldığından F07 **IN_PROGRESS**.

## 2026-09-24 ek checkpoint — affine CURVE_DATA source quantization accounting

- Her non-SPLINE affine source ref için compiler, F32'ye yazılan chunk-local source center, basis U/V ve start/end parametrelerini kaynak double değerleriyle karşılaştırır. Konservatif world-space bound `centerError + basisUError + basisVError + (|U| + |V|) * maxEndpointParameterError` biçimindedir; kayan nokta toplamının aşağı yuvarlanmasına karşı küçük bir üst pay eklenir. Bu, aynı normalize interval parametresindeki eğri konum sapmasını sınırlar.
- Ref başına `sourceQuantizationErrorWorld`, META `curveSourceVersion` 3 içinde taşınır. Her chunk ayrıca `maxCurveSourceQuantizationErrorWorld`, tam camera profile varsa CSS-pixel karşılığını flat ve hash-index manifestinde taşır. Validator yeni alanları finite/non-negative ve flat/index tutarlı doğrular; eski manifestler için alanlar opsiyoneldir.
- Worker, source quantization bound'unu çıktı Float32 yuvarlama payına ekler ve kalan interpolasyon toleransını bunun ardından hesaplar. Ekran bütçesi kalmadığında degraded sonuç ve boş koordinat döner; önceki fallback geometry korunur. Compiler da sidecar source error tek başına screen target'ı aşarsa scene'i degraded işaretler.
- `chunk-error-accounting.test.ts` yüksek yarıçaplı kısa ARC üzerinde merkezi/basis/parametre bound'unu bağımsız hesaplar, 1.001 eşlenik source/encoded noktayı örnekler, CSS dönüşümü, manifest/index ölçümleri, budget tanısı ve worker'ın over-budget span'i reddetmesini doğrular. Negatif/çelişkili worker ve manifest metrikleri reddedilir; XY/TRIANGLES testleri ayrı kalır.
- `CAD_V2_COMPILER_REVISION` v15→v16, META `curveSourceVersion` v2→v3 ilerletildi. DV2SCN01 binary section layout'u ve `CAD_V2_SCHEMA_VERSION` v1 değişmedi. F07 açık kalır: PATH_DISTANCE, GPU transform/sonraki output rounding, kalan tessellation, HATCH fill, glyph semantiği, chunk boundary, spatial partition/on-demand loading, periodic AutoCAD spline profili ve same-source AutoCAD oracle henüz tamamlanmadı.
- `npx tsx tests/cad-v2/chunk-error-accounting.test.ts`, `npx tsx tests/cad-v2/precision-refinement.test.ts`, `npx tsx tests/cad-v2/curve-refinement.test.ts`, `npx tsx tests/cad-v2/manifest-validation.test.ts`, `npx tsx tests/cad-v2/cache-identity.test.ts`, tam `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (worker browser + F06/F07 Chromium **2/2**), `npx tsc --noEmit -p tsconfig.next.json --incremental false` ve `git diff --check` — **PASS**.

## 2026-09-24 ek checkpoint — PATH_DISTANCE Float32 quantization accounting

- Compiler her line endpoint'inde kaynak cumulative path distance ile `PATH_DISTANCE` Float32 array'e yazılan round-trip değerinin mutlak farkını ölçer; chunk maksimumu `maxPathDistanceQuantizationErrorWorld` olarak flat manifest ve hash-index kaydına eklenir. Complete active-view profili varsa singular-value üst sınırı ve units/CSS ölçeğiyle CSS hata ölçüsü üretilir; screen target aşımı `PATH_DISTANCE_PRECISION_LIMIT_REACHED` tanısıyla scene'i degraded yapar.
- Manifest validator world/CSS metriklerini optional/legacy uyumlu, finite ve non-negative doğrular; flat/index alanları birlikte varsa eşitliğini zorunlu kılar. Compiler çıktısı/quality davranışı değiştiği için revision v16→v17 ilerletildi; binary section layout değişmediği için schema v1 korundu.
- `chunk-error-accounting.test.ts` yüksek kümülatif mesafeli gerçek LINE chunk'ında Float32 round-trip farkını binary section'dan bağımsız hesaplar; flat/index ölçüsünü, CSS dönüşümünü, budget diagnostic/degraded durumunu ve bozuk/çelişkili metadata reddini doğrular. Renderer şu an PATH_DISTANCE okumadığından bu checkpoint yalnız taşınan scalar lane hassasiyetini muhasebeleştirir; dash görünüş parity'si veya F07 kapanışı değildir.
- `npx tsx tests/cad-v2/chunk-error-accounting.test.ts`, `npx tsx tests/cad-v2/linetype-phase.test.ts`, `npx tsx tests/cad-v2/manifest-validation.test.ts`, `npx tsx tests/cad-v2/cache-identity.test.ts`, tam `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (Chromium **2/2**), `npx tsc --noEmit -p tsconfig.next.json --incremental false` ve `git diff --check` — **PASS**.
- Bu checkpoint rendered dash phase parity'sini AutoCAD ile doğrulamaz. Spatial, GPU/output, tessellation, fill/glyph/chunk-boundary ve AutoCAD oracle kapıları açık olduğundan F07 **IN_PROGRESS**. Toplam plan **14/19 (%74)**; **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — refined PATH_DISTANCE chord-length phase mapping

- `applyCurveRefinementsToChunk`, her kabul edilmiş refined span'in Float32 çıktı noktaları arasındaki chord uzunluklarını ölçer. Başlangıç ve bitiş `PATH_DISTANCE` fazları aynı bırakılır; ara segment uçlarının fazı toplam refined chord uzunluğu içindeki kümülatif mesafe oranıyla dağıtılır. Böylece ara fazlar segment sayısına eşit bölünmez ve komşu chord uçları tek faz değerini paylaşır.
- `curve-refinement.test.ts` asimetrik uzunlukta iki refined chord'u kullanır; beklenen ara fazı bağımsız chord `hypot` toplamından hesaplar, başlangıç/bitiş fazlarının korunduğunu, ara chord faz sürekliliğini, sonraki geometry/path değerlerinin değişmediğini ve input chunk'ın immutable kaldığını doğrular.
- `npx tsx tests/cad-v2/curve-refinement.test.ts`, tam `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (Chromium **2/2**), `npx tsc --noEmit -p tsconfig.next.json --incremental false` ve `git diff --check` — **PASS**. Compiler'ın persisted scene çıktısı değişmediğinden compiler revision/schema değişmedi.
- Bu worker metadata alt kapısı rendered dash paritesini kapatmaz; mevcut renderer PATH_DISTANCE'i okumuyor. F07 **IN_PROGRESS**, toplam plan **14/19 (%74)**; **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — statik HATCH fill boundary tessellation hata bütçesi

- `GeometryCompiler.triangulateHatch` bulge/ARC/ELLIPSE/SPLINE sınır parçalarının tessellator sagitta değerlerinden maksimum world sapmasını döndürür. Scene compiler bu ölçümü HATCH fill triangle primitive'i üzerinden chunk'a toplar; `maxHatchFillBoundaryTessellationErrorWorld` ve eksiksiz active-view profile varsa CSS karşılığı flat manifest + hash-index page metadata'sına yazılır.
- Hedef CSS bütçesini aşan statik boundary sapması `HATCH_FILL_BOUNDARY_TESSELLATION_LIMIT_REACHED` tanısı üretir ve manifest kalite durumunu `degraded` yapar. Validator metrikleri eski manifestler için opsiyonel bırakır, finite/non-negative ve flat/index eşitliğini doğrular.
- `chunk-error-accounting.test.ts`, yarıçapı 50 olan yarım dairenin iki chord ile ölçülen sagitta'sını bağımsız formülle karşılaştırır; over-budget cap ve normal in-budget derlemeyi, CSS dönüşümünü, flat/index/validator aktarımını ve negatif/çelişkili manifest reddini sınar. Hatch fill üçgenlerinin Float32 quantization hatasıyla toplam/kompozit bound'u bu metrikte birleştirilmez.
- Compiler/cache semantiği değiştiği için compiler revision v17→v18 yükseltildi; `DV2SCN01` binary section layout ve schema v1 aynı kaldı.
- Targeted `chunk-error-accounting`, `hatch-topology`, `geometry-curves-hatch`, tam `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (Chromium **2/2**), production runtime typecheck ve `git diff --check` — **PASS**.
- Kapsam sınırı: runtime HATCH fill re-triangulation/error accounting, HATCH topology, triangle Float32 ile birleşik toplam hata, glyph ve chunk partition boundary muhasebesi, periodic spline AutoCAD profili ve same-source AutoCAD visual/measurement oracle açık kapıdır. F07 **IN_PROGRESS**; toplam plan **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — statik HATCH fill boundary + triangle encoding bileşik bound'u

- Scene compiler, yalnız HATCH fill triangle primitive'inin emitted Float32 vertex round-trip hatasını ölçer; bu değer, aynı primitive için hesaplanmış boundary tessellation sagitta'sıyla toplanır. Chunk başına maksimum HATCH triangle quantization ve maksimum per-fill birleşik world error ayrı alanlar olarak üretilir; complete active-view profile'da CSS-pixel karşılıkları hesaplanır.
- Birleşik bound hedefi aşınca `HATCH_FILL_ENCODED_PRECISION_LIMIT_REACHED` quality diagnostic eklenir. Önceki `HATCH_FILL_BOUNDARY_TESSELLATION_LIMIT_REACHED` saf sınır tessellation terimini ayrıca tanımlamaya devam eder. Flat manifest ve hash-index metadata alanları opsiyonel legacy validator, finite/non-negative ve eşitlik kontrollerinden geçer.
- `chunk-error-accounting.test.ts`, test HATCH'ini aynı tessellator ayarlarıyla yeniden triangulate eder, binary TRIANGLES Float32 koordinatlarını Float64 kaynak mesh ile ORIGIN ekleyerek karşılaştırır, ölçülen triangle error + bağımsız semicircle sagitta toplamını compiler output'uyla eşleştirir; over-budget ve in-budget profilleri kontrol eder. Büyük koordinatlı fixture, boundary sagitta hedef altındayken Float32 triangle error'ın birleşik toplamı hedef dışına taşıdığı durumu ayrıca sınar ve boundary-only tanısının çıkmamasını doğrular.
- Compiler revision v18→v19 değişti. Yeni metadata alanları wire `DV2SCN01` layout'una eklenmediğinden schema v1 sabit kaldı.
- Tam `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (Chromium **2/2**), `npx tsc --noEmit -p tsconfig.next.json --incremental false` ve `git diff --check` — **PASS**.
- Bu per-fill toplam boundary-tessellation + vertex-encoding sapmasıdır; HATCH topology/earcut hatası, runtime remesh, genel triangle/chunk/GPU/output dönüşüm hatası ve glyph muhasebesi dahil değildir. F07 **IN_PROGRESS**; **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — doğrudan CIRCLE/ARC chord sagitta muhasebesi

- Scene compiler, direct top-level CIRCLE ve ARC stroke primitive'lerine bounded circular tessellator'ın `maxSagittaWorld` değerini bağlar. Continuous çizgiler ve dashed CIRCLE/ARC segmentleri aynı chunk metriğine katılır. Chunk `maxCircularCurveTessellationErrorWorld` değerini, tam active-view profili verilmişse CSS karşılığını flat manifest ve hash-index sayfasına yazar. Eşik aşımı `CIRCULAR_CURVE_TESSELLATION_LIMIT_REACHED` ile kaliteyi `degraded` yapar.
- Validator alanları legacy manifestlerde optional bırakır; değerleri finite/non-negative ve flat/index uyumlu doğrular. Compiler/cache çıktısı ve kalite davranışı değiştiğinden revision v19→v20 yükseltildi. `DV2SCN01` binary section layout ve schema v1 aynı kaldı.
- `chunk-error-accounting.test.ts` continuous ve dashed CIRCLE/ARC için bağımsız `GeometryCompiler`/`cad-stroke` tessellator sonuçlarını world/CSS manifest ve index metadata ile karşılaştırır. Dört segmentle sınırlandırılmış büyük sagitta'nın budget aşımında doğru diagnostic/degraded durumu üretmesini ve bozuk/çelişkili validator metadata'sının reddini de kontrol eder.
- `npx tsx tests/cad-v2/chunk-error-accounting.test.ts`, tam `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (Chromium **2/2**), runtime `tsconfig.next.json` typecheck ve `git diff --check` — **PASS**.
- Bu ölçüm yalnız direct top-level CIRCLE/ARC statik stroke chord'larını kapsar. Ellipse, spline, bulge, nested/transformed kaynaklar, runtime refined çizim metriği, GPU/output transform, HATCH fill topology/remesh, glyph ve global spatial partition hata muhasebesi hâlâ açık; F07 **IN_PROGRESS**. Toplam plan **14/19 (%74)**; **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — direct ELLIPSE chord tessellation muhasebesi

- Scene compiler direct top-level ELLIPSE stroke segmentlerine `tessellateEllipseWithBudget` sonucundaki `maxSagittaWorld` değerini bağlar. Chunk `maxEllipseCurveTessellationErrorWorld` ölçüsünü; eksiksiz active-view profiliyle CSS karşılığını flat manifest ve hash-index sayfasına yazar. Screen target aşımı `ELLIPSE_CURVE_TESSELLATION_LIMIT_REACHED` ile kaliteyi `degraded` yapar.
- Validator alanları legacy manifestlerde optional kabul eder, finite/non-negative değer ve flat/index tutarlılığını doğrular. Compiler/cache semantiği değiştiği için revision v20→v21 yükseltildi; `DV2SCN01` section layout ve schema v1 değişmedi.
- `chunk-error-accounting.test.ts` kısmi sweep'li top-level ELLIPSE için bağımsız tessellator world sagitta'sını, CSS dönüşümünü, flat/index/validator aktarımını ve bir segmente zorlanmış over-budget diagnostic/degraded yolunu doğrular; negatif ve çelişkili ellipse metric metadata'sını reddeder.
- Targeted `npx tsx tests/cad-v2/chunk-error-accounting.test.ts`, tam `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (Chromium **2/2**), runtime `tsconfig.next.json` typecheck ve `git diff --check` — **PASS**.
- Bu yalnız direct top-level ELLIPSE statik chord error muhasebesidir. Nested/transformed ellipse, bulge/spline line strokes, HATCH boundary/fill runtime remesh, glyph, output transform, spatial partition ve same-source AutoCAD oracle kapılarını kapatmaz; F07 **IN_PROGRESS**. Toplam plan **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — direct non-periodic SPLINE chord tessellation muhasebesi

- Scene compiler, yalnız standalone top-level non-periodic SPLINE emitted chord'larına bounded rational spline tessellator'ın `maxSagittaWorld` üst sınırını bağlar. Chunk maksimumu `maxSplineCurveTessellationErrorWorld`, tam active-view profiliyle CSS karşılığı flat manifest ve hash-index chunk metadata'sında taşınır. Screen budget aşımında `SPLINE_CURVE_TESSELLATION_LIMIT_REACHED` kalite tanısı eklenir ve manifest `degraded` olur.
- Validator yeni alanları eski manifestler için optional tutar; varsa finite/non-negative olmasını ve flat manifest/hash-index değerlerinin eşleşmesini doğrular. Schema/wire section layout değişmedi; cache-visible compiler/quality çıktısı nedeniyle revision v21→v22 yükseltildi, `DV2SCN01` schema v1 sabit kaldı.
- `chunk-error-accounting.test.ts` non-periodic cubic spline fixture'ını bağımsız `tessellateSplineWithBudget` çağrısıyla ölçer; in-budget world/CSS metrikleri, index ve validator aktarımını doğrular. İki-segment cap oracle'ı screen target overrun/degraded tanısını sınar. Negatif ve çelişkili spline metric metadata'sı reddedilir.
- Doğrulama: targeted accounting testi, tam unit paketi, UI/Chromium 2/2, production runtime TypeScript ve `git diff --check` — **PASS**.
- Kapsam periodic AutoCAD spline fixture/desteği veya genel knot multiplicity parity'si değildir; nested spline statik chord ölçümü, runtime refined output error, bounded spatial partition, HATCH fill remesh/topology, glyph/chunk-boundary accounting ve same-source AutoCAD visual/measurement oracle açık kalır. F07 **IN_PROGRESS**; toplam plan **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — nested/transformed SPLINE chord tessellation muhasebesi

- `EntityVisitor` spline chord'larına tessellator'ın local `maxSagittaWorld` bound'unu ekler; bound, tüm iç içe INSERT dönüşümünün 2D en büyük singular değeriyle world-space'e çevrilip visitor segmentinden scene primitive/chunk manifestine taşınır. Paper viewport'a projekte edilen visitor segmentlerinde viewport singular scale'i de world metrike çarpılır. Screen target aşımı mevcut `SPLINE_CURVE_TESSELLATION_LIMIT_REACHED` tanısıyla degraded kalite üretir.
- XCLIP uygulanan `addSegment` branch'i kaynak spline metriğini (mevcut davranışta olduğu gibi sidecar kaynağını da) clipped chord fragment'lerine taşımaz; görünen clipped geometri korunur ama spline bound iddiası yoktur.
- `chunk-error-accounting.test.ts`, iki seviyeli INSERT'in 2×3 ve 4×1 scale'inden gelen bileşik 8× bound'u independent local spline oracle'ıyla karşılaştırır; world→CSS dönüşümünü, cap kaynaklı screen overrun tanısını ve XCLIP fragment'inde metric bulunmamasını doğrular.
- Cache-visible transformed primitive/quality çıktısı nedeniyle compiler revision v22→v23 ilerletildi. `DV2SCN01` binary layout ve schema v1 sabittir.
- Doğrulama: targeted `chunk-error-accounting.test.ts`, tam `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (Chromium **2/2**), production runtime TypeScript ve `git diff --check` — **PASS**.
- Bu nested/transformed non-periodic SPLINE static tessellation bound alt kapısıdır; periodic AutoCAD fixture/desteği, knot multiplicity parity'si, runtime-refined rendered error, bounded spatial partition, HATCH fill remesh/topology, glyph/chunk-boundary accounting ve same-source AutoCAD visual/measurement oracle açık kalır. F07 **IN_PROGRESS**; toplam plan **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 checkpoint — nested/transformed LWPOLYLINE BULGE chord hata muhasebesi

- `GeometryCompiler.expandLwPolyline` her emitted bulge chord'u için local `maxSagittaWorld` bound'unu segment metadata'sına taşır. `EntityVisitor`, bu değeri yalnız continuous, widthless LWPOLYLINE centerline stroke'larında nested INSERT birleşik 2D dönüşümünün en büyük singular değeriyle world-space'e ölçekler. Paper viewport dönüşümü chunk metriğine scene compiler aşamasında eklenir. XCLIP ile işlenen fragment'ler source bound iddiası taşımaz.
- Chunk başına `maxBulgeCurveTessellationErrorWorld` ve complete active-view profile verildiğinde CSS piksel karşılığı flat manifest ve hash-index metadata'sına yazılır. Validator ölçüleri legacy manifestler için optional bırakıp finite/non-negative ve flat/index uyumunu denetler. Hedef aşımı `BULGE_CURVE_TESSELLATION_LIMIT_REACHED` tanısı ile kaliteyi `degraded` yapar.
- Bağımsız oracle, `bulge=1` ve uçlar arası 40 birimden gelen yarım daire için `R=20` ve emitted chord sayısından `R(1-cos(π/(2n)))` sagitta hesabını kullanır. İki nested seviye (2×3 ardından mirrored 4×1 + rotation) ve active-view dönüşümü ile manifest bound'u karşılaştırılır; transformed source arc üzerinde 20.001 yoğun örnek de aynı bound'un altında kalır. İki-chord cap overrun'ı, XCLIP geometri/bound ayrımı, flat/index aktarımı, validator ve bozuk/çelişkili metadata reddi ayrıca doğrulanır.
- Compiler/cache manifest ve kalite çıktısı değiştiği için revision v23→v24 yükseltildi. `DV2SCN01` binary section layout ve schema v1 değişmedi.
- `npx tsx tests/cad-v2/chunk-error-accounting.test.ts`, `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (Chromium **2/2**), `npx tsc --noEmit -p tsconfig.next.json --incremental false` ve `git diff --check` — **PASS**.
- Kapsam yalnız static fallback centerline chord hatasıdır; dashed/width'li polyline, HATCH runtime fill remesh/topology, runtime-refined rendered error, glyph ve chunk-boundary bileşik hata, periodic SPLINE AutoCAD fixture/knot-multiplicity oracle'ı, bounded spatial partition/on-demand chunk loading ve same-source AutoCAD pixel/measurement oracle'ı açık kalır. F07 **IN_PROGRESS**; toplam plan **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — uygulanmış runtime refinement buffer'ının CSS-space oracle'ı

- Host, `applyCurveRefinementsToChunk` aşamasında yalnız `refined + errorBoundMet` aralıklarını kabul etse de doğrulama ekledi: hedef CSS hata bütçesi pozitif/finite, bildirilen conservative hata finite/non-negative ve hedefin altında, tüm Float32 refinement koordinatları finite olmalıdır. Bozuk worker sonucu renderer'ın okuyacağı yeni XY buffer'ına uygulanmadan reddedilir.
- `curve-refinement.test.ts`, 1e9 ölçekli world origin'deki daireyi gerçek compiler sidecar'ından worker ile refine edip `applyCurveRefinementsToChunk` ile renderer buffer'ına uygular. 20.001 exact-source örneği, renderer'ın chunk-origin/camera-center relative ötelemesi ve CSS ölçeği altında uygulanmış Float32 line endpoint-pair buffer'ına karşı ölçülür; measured deviation ≤0.25 CSS px ve worker'ın conservative metriği ölçümden küçük değildir. Pozitif olmayan/sonsuz metrik ve NaN koordinatlar da uygulama sınırında reddedilir.
- `npm run check:cad-v2:unit`, targeted `npx tsx tests/cad-v2/curve-refinement.test.ts`, `npm run check:cad-v2:ui` (Chromium **2/2**), `npx tsc --noEmit -p tsconfig.next.json --incremental false` ve `git diff --check` — **PASS**.
- Bu oracle renderer'ın uyguladığı geometri buffer'ını lineer camera-relative CSS projeksiyonunda ölçer; WebGL raster/anti-alias/device-pixel görüntü farkını veya AutoCAD aynı-kaynak ölçümünü ölçmez. Bu nedenle runtime-refined rendered pixel oracle'ı, aynı-kaynak AutoCAD karşılaştırması, periodic SPLINE AutoCAD fixture/knot multiplicity, HATCH runtime fill remesh/topology, bounded spatial partition/on-demand chunk yükleme ve glyph/chunk-boundary kalan hata muhasebesi açık kalır. F07 **IN_PROGRESS**; toplam plan **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — nested affine eğrilerin uygulanmış buffer ölçümü

- Önceki post-apply oracle'ı direct, yüksek world-origin CIRCLE ile sınırlıydı. `testNestedInsertCircleAndArcCarryTransformedSidecars`, iki seviye INSERT altındaki 10 CIRCLE/ARC/ELLIPSE/BULGE span'ini gerçek `applyCurveRefinementsToChunk` hattından geçirir; bir mirrored/non-uniform ve bir başka non-uniform instance içerir.
- Test, daha önceki başarılı span'lerin vertex delta'sını hesaba katarak her span'i yeniden yazılmış XY endpoint-pair buffer'ından çıkarır. Uygulanmış Float32 noktalarının worker koordinatlarıyla birebir olduğunu ve sidecar analitik kaynağına göre 20.001 örnekli CSS-space sapmanın ≤0.2 px kaldığını doğrular; `conservativeErrorCssPixels` ölçülen değeri kapsar.
- Targeted `npx tsx tests/cad-v2/curve-refinement.test.ts`, tam `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (Chromium **2/2**), runtime typecheck ve `git diff --check` — **PASS**.
- Bu kabul non-periodic nested affine CIRCLE/ARC/ELLIPSE/BULGE buffer geometrisidir; nested rational SPLINE/HATCH span post-apply ölçümü, WebGL raster/device-pixel oracle'ı, aynı-kaynak AutoCAD karşılaştırması, periodic SPLINE profili, HATCH runtime fill remesh/topology, bounded spatial partition/on-demand chunk yükleme ve glyph/chunk-boundary bileşik hata muhasebesi açık kalır. F07 **IN_PROGRESS**; plan **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — rational SPLINE post-apply buffer oracle'ı

- Direct ve iki ayrı nested INSERT instance'ındaki iki knot span toplam **6 non-periodic rational quadratic SPLINE span'i**, gerçek `applyCurveRefinementsToChunk` hattından geçirildi. Fixture mirrored/non-uniform ve rotation dönüşümlerini içerir.
- Her span, önceki span'lerin vertex delta'larıyla yeniden indekslenen XY endpoint-pair buffer'ından çıkarılır; Float32 nokta dizisi worker output'uyla birebir karşılaştırılır. Her span için 20.001 sample'lı bağımsız rational Bezier oracle'ı ≤0.2001 CSS px ölçer ve `conservativeErrorCssPixels` bound'unun ölçülen sapmayı kapsadığını doğrular.
- `npx tsx tests/cad-v2/curve-refinement.test.ts`, tam unit, UI/Chromium **2/2**, runtime typecheck ve `git diff --check` — **PASS**.
- Bu sonuç non-periodic SPLINE worker-buffer geometrisidir; periodic AutoCAD SPLINE fixture/knot multiplicity, HATCH runtime fill remesh/topology ve HATCH post-apply boundary output, WebGL raster/device-pixel, same-source AutoCAD oracle, bounded spatial partition/on-demand chunk yükleme ve glyph/chunk-boundary kalan hata muhasebesi açık kalır. Test-only oracle artımı compiler/cache çıktısını değiştirmez: revision v24, schema v1; F07 **IN_PROGRESS**, plan **14/19 (%74)**.

## 2026-09-24 ek checkpoint — HATCH ARC/BULGE/ELLIPSE post-apply sınır buffer oracle'ı

- testHatchArcBulgeAndEllipseSidecarsIncludingNestedInsert, üç direct span ile tek mirrored/non-uniform nested INSERT instance'ındaki iki span olmak üzere toplam **5 HATCH ARC/BULGE/ELLIPSE boundary span'ini** gerçek applyCurveRefinementsToChunk sonrasındaki renderer XY endpoint-pair buffer'ından çıkarır. Önceki refinement span'lerinin vertex delta'larıyla reindex edilen aralıklar worker Float32 koordinatlarıyla birebir karşılaştırılır.
- Her uygulanmış span'in affine sidecar kaynağına karşı 20.001 örnekli CSS-space geometrik oracle'ı ≤0.2001 CSS px kalır; worker conservative CSS metriği ölçümü kapsar. Mevcut HATCH TRIANGLES fill fallback'i ayrıca korunur.
- npx tsx tests/cad-v2/curve-refinement.test.ts, npm run check:cad-v2:unit, npm run check:cad-v2:ui (Chromium **2/2**), npx tsc --noEmit -p tsconfig.next.json --incremental false ve git diff --check — **PASS**.
- Bu dar sonuç yalnız HATCH sınır çizgilerinin uygulanmış geometri buffer'ıdır; fill runtime remesh/topology veya TRIANGLES hata muhasebesi değildir. HATCH SPLINE post-apply oracle'ı, periodic AutoCAD SPLINE fixture/knot multiplicity, bounded spatial partition/on-demand chunk loading, fill/glyph/chunk-boundary ve kalan bileşik hata muhasebesi, WebGL raster/device-pixel ve same-source AutoCAD image/measurement oracle'ı açık kalır. Test-only değişiklik compiler/cache çıktısını değiştirmez: revision v24, schema v1; F07 **IN_PROGRESS**, plan **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 ek checkpoint — HATCH rational SPLINE post-apply boundary buffer oracle'ı

- testHatchSplineBezierSidecarsAndBoundedWorkerRefinement, direct ve tek mirrored/non-uniform nested INSERT altındaki toplam **4 non-periodic rational quadratic HATCH SPLINE knot-span'ini** gerçek applyCurveRefinementsToChunk sonrasındaki renderer XY endpoint-pair buffer'ından çıkarır. Önceki span'lerin vertex delta'larıyla yeniden indekslenen Float32 noktaları worker output'u ile birebir doğrulanır.
- Her uygulanmış span için 20.001 örnekli bağımsız rational Bezier CSS-space oracle'ı ≤0.2001 px; conservative worker CSS metriği ölçümü kapsar. XCLIP fragment'lerinin tam kaynak span'i iddia etmediği ve capped fallback'in sidecar yayınlamadığı mevcut kontroller korunur.
- npx tsx tests/cad-v2/curve-refinement.test.ts, npm run check:cad-v2:unit, npm run check:cad-v2:ui (Chromium **2/2**), npx tsc --noEmit -p tsconfig.next.json --incremental false ve git diff --check — **PASS**.
- Bu sonuç yalnız HATCH SPLINE sınır çizgilerinin uygulanmış geometri buffer'ıdır; HATCH fill runtime remesh/topology/error accounting değildir. Periodic AutoCAD SPLINE fixture/knot multiplicity, bounded spatial partition/on-demand chunk loading, fill/glyph/chunk-boundary kalan bileşik hata muhasebesi, PATH_DISTANCE rendered dash, WebGL raster/device-pixel ve same-source AutoCAD image/measurement oracle'ı açık kalır. Test-only değişiklik compiler/cache çıktısını değiştirmez: revision v24, schema v1; F07 **IN_PROGRESS**, plan **14/19 (%74)**, **5 paket (%26)** açık.

## 2026-09-24 — aynı curved-line chord'un sagitta + encoded endpoint kabulü

- Chunk manifesti her curved line primitive için statik kaynak chord sagitta bound'unu, aynı emitted chord'un en kötü Float32 endpoint round-trip error'u ile toplar; chunk maksimumu world-space ve complete active-view CSS-space olarak flat manifest ve hash-index'e taşınır.
- Bağımsız büyük-coordinate CIRCLE fixture'ında emitted segment count'undan analitik `R(1-cos(π/n))` sagitta ve endpoint quantization ayrı ayrı 0.25 CSS px içinde kalır, ama aynı primitive'e ait toplam bound target'ı aşar. Validator aktarımı, negatif/çelişkili metrik reddi ve `CURVE_ENCODED_PRECISION_LIMIT_REACHED` / `degraded` sonucu doğrulanır.
- Hedefli accounting, tam CAD V2 unit, UI/Chromium 2/2 ve production runtime typecheck geçti. Compiler revision v24→v25; binary schema v1 sabit.
- Bu yalnız static curved-line fallback segmentlerinin bileşik encoder bound'udur. Fill triangle/remesh topology, glyph, farklı kaynak/primitive/chunk toplamları, PATH_DISTANCE görünür dash, WebGL raster/device-pixel deviation ve AutoCAD same-source ölçüm oracle'ı bu kabulde değildir. F07 **IN_PROGRESS**; **14/19 (%74)**, **5/19 (%26)** paket açık.

## 2026-09-24 — HATCH curved boundary-line static composite

- `triangulateHatch` now attaches a conservative source chord-deviation bound to each boundary line emitted from HATCH ARC, BULGE, ELLIPSE, or SPLINE tessellation. The entity visitor applies the combined INSERT scale; the paper viewport scale is applied once downstream before the line-level static composite. XCLIP-created output drops the source claim.
- The independent direct semicircle oracle uses `R(1-cos(π/(2n)))` and emitted Float32 XY plus Float64 ORIGIN. Sagitta and endpoint round-trip terms fit the 0.25 CSS-pixel target separately, while their same-chord sum exceeds the target. A two-level reflected/rotated 8× INSERT fixture independently transforms the source endpoints and checks the composite manifest bound; a paper viewport fixture confirms its projection scale is applied once. A straight closure segment has no arc bound; XCLIP-visible geometry has no source bound.
- Targeted `npx tsx tests/cad-v2/chunk-error-accounting.test.ts`, full `npm run check:cad-v2:unit`, `npm run check:cad-v2:ui` (Chromium 2/2), runtime `npx tsc --noEmit -p tsconfig.next.json --incremental false` and `git diff --check` — PASS. UI worker build kept `public/cad-v2/cad-v2-scene-worker.js` SHA-256 unchanged at `1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280`. Compiler/cache revision v25→v26; `DV2SCN01` layout/schema v1 unchanged.
- This closes only static HATCH boundary-line chord plus endpoint encoding accounting. HATCH fill TRIANGLES runtime remesh/topology/error, periodic SPLINE AutoCAD fixture/support and knot-multiplicity oracle, bounded spatial partition/on-demand chunk fetch, residual fill/glyph/chunk-boundary and cross-primitive composite accounting, PATH_DISTANCE visible dash, WebGL raster/device pixels, and same-source AutoCAD visual/measurement remain open. F07 remains **IN_PROGRESS**; plan **14/19 (74%)**, **5/19 (26%)** packages open.

## 2026-09-24 — non-periodic rational SPLINE internal knot multiplicity oracle

- `testSplineInternalKnotMultiplicityAgainstIndependentDeBoorOracle` checks three degree-3 positive-weight rational profiles with internal knot multiplicity 1 (simple), 2 (double), and 3 (degree multiplicity). The test evaluator independently applies homogeneous-coordinate De Boor recursion; 20,001 source samples per profile are measured against the complete emitted polyline, and each distinct internal-knot point must be retained.
- For every profile, dense source-to-polyline error stays within the requested 0.03 world-unit tolerance and within the tessellator's reported conservative `maxSagittaWorld`. The targeted precision test and full CAD V2 unit suite pass.
- `npm run check:cad-v2:ui` passed (Chromium **2/2**); runtime `npx tsc --noEmit -p tsconfig.next.json --incremental false` and `git diff --check` pass. Both worker bundles were restored byte-for-byte after UI build; the pre-existing Playwright reports were preserved.
- This is a synthetic non-periodic degree-3 tessellator oracle. It does not establish all degrees or knot profiles, periodic SPLINE support, an AutoCAD-authored fixture/evaluator comparison, runtime-refined output error, HATCH fill remesh/topology, bounded spatial partition/on-demand loading, residual fill/glyph/chunk-boundary and cross-primitive error accounting, visible dash fidelity, WebGL raster/device-pixel accuracy, or same-source AutoCAD visual/measurement parity. Test-only change: compiler/cache revision **v26** and `DV2SCN01` schema **v1** remain unchanged. F07 remains **IN_PROGRESS**; plan **14/19 (74%)**, **5/19 (26%)** packages open.

## 2026-09-24 — degree-2 rational SPLINE knot multiplicity coverage

- The independent oracle now covers five synthetic, positive-weight, non-periodic rational profiles: degree-2 simple and degree-multiplicity knots (multiplicities 1 and 2), plus degree-3 simple, double, and degree-multiplicity knots (1, 2, and 3). Each profile uses 20,001 independent homogeneous De Boor samples; the measured deviation to the emitted polyline remains within both 0.03 world units and the reported `maxSagittaWorld`, and each distinct internal knot point is retained.
- Targeted precision, full CAD V2 unit, UI/Chromium **2/2**, runtime typecheck, and `git diff --check` pass. This measures `tessellateSplineWithBudget` output; it does not claim runtime-refined renderer or AutoCAD parity.
- Other degree/knot profiles, periodic SPLINE support and AutoCAD fixture/evaluator, HATCH runtime fill remesh/topology, bounded spatial partition/on-demand loading, fill/glyph/chunk-boundary and cross-primitive composite error, visible dash fidelity, WebGL raster/device-pixel accuracy, and same-source AutoCAD visual/measurement remain open. Test-only change: compiler/cache revision **v26** and schema **v1** unchanged; F07 **IN_PROGRESS**, plan **14/19 (74%)**, **5/19 (26%)** open.

## 2026-09-24 — degree-4 rational SPLINE knot multiplicity coverage

- Four additional positive-weight, non-periodic rational degree-4 profiles exercise internal multiplicities 1, 2, 3, and 4 (simple, double, triple, and degree multiplicity). Together with the degree-2/3 cases, the independent homogeneous De Boor oracle now covers nine profiles and 180,009 source samples.
- Every profile's source-to-polyline deviation stays within 0.03 world units and the emitted `maxSagittaWorld`; all distinct internal-knot points are present in the tessellation. Targeted precision, full CAD V2 unit, Chromium UI 2/2, runtime typecheck, and diff-check pass.
- This adds representative synthetic knot placements for degrees 2–4 only. Other degree/knot vectors, periodic SPLINE support and AutoCAD fixture/evaluator, runtime-refined output error, HATCH fill remesh/topology, bounded spatial partition/on-demand loading, fill/glyph/chunk-boundary and cross-primitive accounting, visible dash, WebGL raster/device-pixel, and same-source AutoCAD visual/measurement remain open. Test-only change; compiler/cache v26 and schema v1 unchanged. F07 **IN_PROGRESS**, plan **14/19 (74%)**, **5/19 (26%)** open.

## 2026-09-24 — degree-5 rational SPLINE knot multiplicity coverage

- Five additional positive-weight, non-periodic rational degree-5 profiles exercise internal knot multiplicities 1–5 (simple through degree multiplicity). The independent homogeneous De Boor oracle now covers 14 profiles across degrees 2–5, with 20,001 source samples per profile and 280,014 total samples.
- Each source-to-emitted-polyline deviation remains within the 0.03 world-unit target and `maxSagittaWorld`; all distinct internal knots are retained. Targeted precision, full CAD V2 unit, UI/Chromium **2/2**, runtime typecheck, and `git diff --check` pass.
- The F07 extension is synthetic, non-periodic tessellator coverage. Other degree/knot vectors, periodic SPLINE support and AutoCAD fixture/evaluator, runtime-refined rendered error, HATCH fill remesh/topology, bounded spatial partition/on-demand loading, fill/glyph/chunk-boundary and cross-primitive accounting, visible dash, WebGL raster/device-pixel, and same-source AutoCAD visual/measurement remain open. Test-only change; compiler/cache **v26** and schema **v1** unchanged. F07 **IN_PROGRESS**, plan **14/19 (74%)**, **5/19 (26%)** open.

## 2026-09-24 — nested BULGE same-chord Float32 composite oracle

- The existing two-level reflected/non-uniform nested LWPOLYLINE BULGE fixture now independently reconstructs every emitted chord's source endpoints through the combined INSERT transform and binary `ORIGIN + Float32 XY` endpoints. For each chord it adds the conservative affine-scaled source sagitta to that same chord's maximum endpoint round-trip loss, then checks the maximum against `maxCurveEncodedGeometryErrorWorld` and its active-view CSS value.
- The independent 20,001-sample analytic semicircle geometry oracle, transform singular-value check, cap/degraded diagnostic, hash-index/manifest validation, and XCLIP source-bound exclusion remain in the fixture. Targeted chunk-error accounting, full CAD V2 unit, UI/Chromium **2/2**, runtime typecheck, and diff-check pass.
- This closes only the measured same-chord static composite for nested continuous widthless BULGE strokes. Residual composite interactions across other source/chunk types, HATCH fill/glyph/boundary terms, runtime-refined rendered error, periodic/AutoCAD SPLINE, and same-source AutoCAD visual/measurement remain open. Test-only; compiler/cache **v26** and schema **v1** unchanged. F07 **IN_PROGRESS**, plan **14/19 (74%)**, **5/19 (26%)** open.

## 2026-09-24 — nested SPLINE same-chord Float32 composite oracle

- The two-level non-uniform INSERT cubic SPLINE fixture derives each adaptive subcurve's conservative chord deviation from the cubic Bezier control hull reconstructed over that parameter interval. Exact endpoints are evaluated from the source cubic Bernstein polynomial, transformed by the combined 8× affine matrix, and compared with each emitted `ORIGIN + Float32 XY` endpoint pair.
- For each chord, the independently derived global conservative sagitta bound is added to that same chord's measured maximum endpoint round-trip loss. The maximum matches `maxCurveEncodedGeometryErrorWorld`; the CSS value matches the active-view scaling. The existing cap/degraded, flat/index validator, and XCLIP source-claim checks remain covered. Targeted chunk-error accounting, full CAD V2 unit, UI/Chromium **2/2**, runtime typecheck, and diff-check pass.
- This closes only the synthetic clamped cubic nested SPLINE same-chord static composite measurement. Other degree/knot and periodic/AutoCAD profiles, cross-source/chunk composites, HATCH fill/glyph/boundary, rendered WebGL/device-pixel error, and same-source AutoCAD visual/measurement remain open. Test-only; compiler/cache **v26** and schema **v1** unchanged. F07 **IN_PROGRESS**, plan **14/19 (74%)**, **5/19 (26%)** open.

## 2026-09-24 — direct ELLIPSE same-chord Float32 composite

- `testEllipseCurveTessellationErrorIsMeasuredAndBudgeted` now independently derives uniform segment count and the conservative ellipse chord deviation from the major-axis second-derivative bound. It evaluates each analytic ellipse endpoint, measures that same chord's serialized Float32 XY + Float64 ORIGIN round-trip loss, and compares the maximum sagitta-plus-endpoint sum to the flat manifest and hash-index composite values in world units and active-view CSS pixels.
- The fixture puts the target just above the sagitta: tessellation and endpoint encoding each fit separately, while their same-chord sum exceeds the target and triggers `CURVE_ENCODED_PRECISION_LIMIT_REACHED` / `degraded`. The one-segment cap diagnostic remains checked. Targeted chunk-error accounting, full CAD V2 unit, UI/Chromium **2/2**, runtime typecheck, and diff-check pass; both worker bundle hashes remain unchanged.
- This closes only the direct top-level ELLIPSE static fallback chord-plus-endpoint composite. Nested ELLIPSE and residual cross-source/chunk, fill, glyph, and chunk-boundary composites remain open, as do periodic/AutoCAD SPLINE, HATCH runtime fill remesh/topology, bounded spatial partition/on-demand loading, visible PATH_DISTANCE dash, runtime-refined rendered WebGL/device-pixel error, and same-source AutoCAD visual/measurement. Test-only; compiler/cache **v26** and `DV2SCN01` schema **v1** unchanged. F07 remains **IN_PROGRESS**; plan **14/19 (74%)**, **5/19 (26%)** open.
- Open-gate recheck at the direct-only checkpoint: periodic input is explicitly fail-closed by `testSplineInternalKnotMultiplicityAgainstIndependentDeBoorOracle`'s neighboring periodic case and has no AutoCAD-authored periodic fixture/evaluator oracle. HATCH worker refinement tests cover analytic boundary curves; fill triangles still have no runtime remesh/topology oracle. The manifest bboxes, renderer culling, and bounded LRU/fetch-scheduler primitives exist, but `CadV2HostShell` downloads all manifest chunks during initial load using fixed concurrency and does not call `SpatialChunkScheduler`; camera-driven on-demand fetch therefore remains unaccepted. Nested ELLIPSE static sagitta propagation was missing at that checkpoint; the subsequent nested fixture below now covers its selected model/paper transforms and XCLIP omission, without closing other composite or rendered-error gates.

## 2026-09-24 — nested ELLIPSE transformed static composite

- The entity visitor now carries the ellipse tessellator's conservative major-axis chord bound on each nested ELLIPSE primitive, scales it by the combined INSERT transform's largest singular value, and preserves the field through scene compilation and paper viewport projection. The same primitive composite path adds that bound to the line's worst Float32 endpoint round-trip error. XCLIP fragment output still drops the source-bound claim.
- `testNestedEllipseTessellationErrorIncludesInsertTransforms` uses two non-uniform INSERT levels with combined 8× singular value. Its independent analytic interval/endpoints oracle measures serialized XY + ORIGIN loss per chord and checks the manifest and hash-index world/CSS composite, over-budget diagnostic, degraded status, and a paper viewport case applying its 0.15 scale once. A partial XCLIP fixture retains visible fragments without ellipse/composite source bounds.
- Targeted chunk-error accounting, full CAD V2 unit, UI/Chromium **2/2**, runtime typecheck and diff-check pass. The generated worker bundle hashes remain unchanged. Compiler/cache revision advances **v26→v27** because nested scene-manifest error metadata and diagnostics change; `DV2SCN01` binary schema stays **v1**.
- This closes only the tested nested non-uniform ELLIPSE static chord-plus-endpoint profile. Other ellipse transform/profile cases and residual cross-source/chunk, fill, glyph, and chunk-boundary composites remain open, along with periodic/AutoCAD SPLINE, HATCH runtime fill remesh/topology, camera-driven on-demand loading, visible PATH_DISTANCE dash, rendered WebGL/device-pixel error, and same-source AutoCAD visual/measurement. F07 stays **IN_PROGRESS**; plan **14/19 (74%)**, **5/19 (26%)** open.

## 2026-09-24 — TEXT glyph stroke Float32 endpoint accounting oracle

- `testTextGlyphEndpointsContributeToEncodedQuantizationBudget` compiles a high-coordinate, rotated TEXT fixture containing Turkish glyphs. `FontLayoutEngine` supplies the reference stroke endpoints; the oracle independently derives their bounds midpoint and recomputes every endpoint's `Float32 XY + Float64 ORIGIN` round-trip error.
- The measured maximum matches the chunk's existing generic `maxQuantizationErrorWorld` and active-view CSS value, the hash-index and validator retain the metric, and an intentionally exceeded 0.25 CSS-pixel budget produces `CHUNK_QUANTIZATION_LIMIT_REACHED` / `degraded`.
- Targeted chunk-error accounting, full CAD V2 unit, UI/Chromium **2/2**, runtime `tsconfig.next.json` typecheck, and `git diff --check` — **PASS**. Both worker bundle hashes remain unchanged.
- This is encoding error accounting for generated TEXT stroke endpoints. It does not oracle the font outline against AutoCAD, MTEXT/dimension glyph variants, runtime glyph refinement, or cross-chunk glyph composites. Test-only: compiler/cache revision **v27** and `DV2SCN01` schema **v1** remain unchanged. F07 remains **IN_PROGRESS**; plan **14/19 (74%)**, **5/19 (26%)** packages open.

## 2026-09-24 — continuous ARC seam envelope across chunks

- testCurveEndpointRoundTripSeamIsBoundedAcrossChunks forces one non-closed analytic ARC into one-chord-per-chunk output. The fixture evaluates exact circular source points, independently computes the uniform chord sagitta R × (1 - cos(Δθ/2)), decodes each chunk's Float64 ORIGIN + Float32 XY, and measures both endpoint round-trip losses. Each local same-chord composite is checked against manifest metadata; every decoded seam gap must fit the sum of the two endpoint losses and the neighboring chunk composites. Hash-index and manifest validation retain the local bounds.
- Targeted chunk-error accounting, full CAD V2 unit, UI/Chromium 2/2, runtime tsconfig.next.json typecheck, and git diff --check — PASS. Both generated worker bundle hashes match the existing preserved bundle copies.
- This closes only the measured seam envelope for consecutive chords from one circular ARC with one chord per chunk. It does not establish general cross-source joins, clipping, fill/glyph interactions, or arbitrary chunk-boundary composites. Test-only: compiler/cache revision v27 and DV2SCN01 schema v1 remain unchanged. F07 remains IN_PROGRESS; plan 14/19 (74%), 5/19 (26%) packages open. Periodic SPLINE/AutoCAD and knot-multiplicity oracle, HATCH fill runtime remesh/topology, host-integrated bounded spatial partition/on-demand loading, remaining fill/glyph/chunk-boundary accounting, visible PATH_DISTANCE dash, runtime-refined rendered WebGL/device-pixel error, and same-source AutoCAD visual/measurement gates remain open.

## 2026-09-24 — connected LINE source seam envelope across chunks

- testCrossSourceLineSeamIsBoundedAcrossChunks compiles two separately identified LINE sources that share one exact source vertex, with one primitive per chunk at 1e9-scale coordinates. For each line, the oracle independently derives the bounds-midpoint ORIGIN and Float32 endpoint offsets, decodes the emitted endpoints, and measures both endpoint losses. Each chunk's generic world quantization metric and active affine/CSS projection are checked; the non-zero cross-source seam gap fits both the two shared-endpoint losses and the sum of adjacent chunk bounds. Hash-index world metrics and manifest validation are also checked.
- Targeted chunk-error accounting, full CAD V2 unit, UI/Chromium 2/2, runtime tsconfig.next.json typecheck, and git diff --check — PASS. Both generated worker bundle hashes match the preserved bundle copies.
- This covers only two connected LINE entities with one exact shared source vertex and a chunk split at that join. It does not establish arbitrary cross-source joins, line-to-curve continuity, clipping, fill/glyph effects, or general chunk-boundary composites. Test-only: compiler/cache revision v27 and DV2SCN01 schema v1 remain unchanged. F07 remains IN_PROGRESS; plan 14/19 (74%), 5/19 (26%) packages open. Periodic SPLINE/AutoCAD and knot-multiplicity oracle, HATCH fill runtime remesh/topology, host-integrated bounded spatial partition/on-demand loading, remaining fill/glyph/chunk-boundary accounting, visible PATH_DISTANCE dash, runtime-refined rendered WebGL/device-pixel error, and same-source AutoCAD visual/measurement gates remain open.

## 2026-09-24 — connected LINE-to-ARC seam envelope across chunks

- testLineToArcSourceSeamIsBoundedAcrossChunks compiles an exact LINE endpoint / analytic ARC start join at 1e9-scale coordinates, with the LINE and each ARC chord isolated into separate chunks. The oracle independently derives local bounds-midpoint origins and Float32 offsets, evaluates the first ARC chord endpoints analytically, and measures the two decoded endpoint losses at the join.
- The non-zero seam gap fits the two shared-endpoint errors, adjacent generic chunk quantization bounds, and the LINE endpoint bound plus first ARC chord's analytic sagitta-and-encoding composite. The first ARC chunk's world/CSS composite metadata matches the independent circular formula; hash-index composite and manifest chunk sequence are checked. Targeted chunk-error accounting, full CAD V2 unit, UI/Chromium 2/2, runtime tsconfig.next.json typecheck, and git diff --check — PASS. Both generated worker bundle hashes match the preserved copies.
- This is only one exact LINE-to-ARC join with the first ARC chord in a separate chunk. It does not cover reversed direction, other curve types, clipping, fill/glyph effects, or general cross-source/chunk composites. Test-only: compiler/cache v27 and DV2SCN01 schema v1 remain unchanged. F07 remains IN_PROGRESS; plan 14/19 (74%), 5/19 (26%) packages open. Periodic SPLINE/AutoCAD and periodic knot oracle, HATCH fill runtime remesh/topology, host-integrated bounded spatial partition/on-demand loading, remaining fill/glyph/chunk-boundary accounting, visible PATH_DISTANCE dash, runtime-refined rendered WebGL/device-pixel error, and same-source AutoCAD visual/measurement gates remain open.


## 2026-09-24 — WebGL pixel oracle for pre-tessellated DASHED segments

- Added a Chromium pixel oracle in tests/document-studio/cad-v2-layout-viewport.spec.ts. A DV2SCN01 fixture encodes five already-separated red XY stroke segments and four expected gaps; the test screenshots the actual WebGL canvas and finds exactly five red runs, four gaps, and more than eight pixels for the narrowest gap.
- The fixture also preserves PATH_DISTANCE values [0,24,40,64,80,104,120,144,160,184]. The current renderer constructs line geometry from XY and has no PATH_DISTANCE consumer. This result proves visibility of pre-tessellated dash geometry only; it does not prove renderer/shader use of PATH_DISTANCE, dash-phase evaluation, or end-to-end compiler-to-renderer dash behavior.
- Targeted Chromium pixel test: 1/1 PASS. Full npm run check:cad-v2:unit: PASS. Full npm run check:cad-v2:ui: PASS, including Chromium 3/3. Runtime npx tsc --noEmit -p tsconfig.next.json --incremental false and git diff --check: PASS. Both rebuilt worker SHA-256 values match the preserved copies: DWG worker DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D; scene worker 1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280.
- Test/document-only acceptance: compiler/cache revision v27 and DV2SCN01 schema v1 remain unchanged. This is not rendered-error measurement against an analytic/refined target or an AutoCAD image/measurement oracle. Periodic SPLINE AutoCAD fixture/support and knot multiplicity oracle, HATCH fill runtime remesh/topology, host-integrated bounded spatial partition/on-demand chunks, residual fill/glyph/chunk-boundary composite accounting, PATH_DISTANCE renderer/shader consumption, runtime-refined rendered WebGL/device-pixel error, and same-source AutoCAD visual/measurement remain open. F07 remains IN_PROGRESS; plan 14/19 (74%), 5/19 (26%) packages open.

## 2026-09-24 — compiler-produced DASHED scene visible in Chromium

- Replaced the protocol-only browser fixture source with a bounded Node child that runs compileCanonicalToScene on one canonical LINE using DASHED pattern [24,-16]. The actual compiler-produced manifest and DV2SCN01 chunk are then served to the CAD V2 host; the test independently checks PATH_DISTANCE [0,24,40,64,80,104,120,144,160,184] and samples the presented WebGL canvas.
- Chromium observes exactly five red dash runs and four non-zero gaps. This ties visible dash output to compiler tessellation and its cumulative distance payload. The production renderer still draws the pre-tessellated XY segments and does not read PATH_DISTANCE; shader-side lane consumption, screen-space phase evaluation, and dash stability across runtime refinement/chunk boundaries remain open.
- Targeted browser test: 1/1 PASS. Full CAD V2 unit PASS, including F03 compiler/binary/worker PATH_DISTANCE phase checks. Full UI chain PASS with Chromium 3/3. Runtime typecheck and git diff --check PASS. The fixture child has a 15-second timeout and a 2 MiB output cap. Rebuilt DWG and scene worker hashes match their preserved copies.
- Test-only change; compiler/cache revision v27 and DV2SCN01 schema v1 remain unchanged. This pixel pattern check is not a rendered geometric-error bound or an AutoCAD image/measurement oracle. Periodic SPLINE AutoCAD fixture/support and knot multiplicity oracle, HATCH fill runtime remesh/topology, host-integrated bounded spatial partition/on-demand chunks, residual fill/glyph/chunk-boundary composite accounting, PATH_DISTANCE renderer/shader consumption, runtime-refined rendered WebGL/device-pixel error, and same-source AutoCAD visual/measurement remain open. F07 remains IN_PROGRESS; plan 14/19 (74%), 5/19 (26%) packages open.


## 2026-09-24 — compiler-produced DASHED chunk-partition WebGL oracle

The bounded child fixture compiles the same canonical 184-unit LINE with `[24,-16]` linetype twice: once as one Model chunk and once with `maxPrimitivesPerChunk=1` (five Model chunks). The Chromium host receives the actual compiler manifests and DV2SCN01 chunk bytes for each scene. Both variants carry the same cumulative `PATH_DISTANCE` sequence `[0,24,40,64,80,104,120,144,160,184]`. Pixel sampling finds five red dash runs and four gaps in each presented WebGL canvas; the full canvas PNG SHA-256, run intervals, and gap intervals match exactly under the same padded viewport bounds. This is a narrow pre-tessellated LINE/chunk-partition rendering oracle. The renderer still does not consume `PATH_DISTANCE`; shader-side dash rendering/phase and runtime-refined raster error are not established.

Targeted Chromium **1/1**, full `npm run check:cad-v2:unit`, full UI/Chromium **3/3**, runtime `npx tsc --noEmit -p tsconfig.next.json --incremental false`, and `git diff --check` passed. Worker bundles match the preserved copies (DWG `DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D`; scene worker `1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280`). Test-only: compiler/cache revision **v27** and binary schema **v1** remain unchanged. F07 stays **IN_PROGRESS**; the plan remains **14/19 (74%)**, with **5/19 (26%)** packages open.

Open gates remain: periodic SPLINE AutoCAD fixture/evaluator and remaining periodic knot-parity oracle; HATCH fill runtime remesh/topology; host-integrated bounded spatial partition and on-demand chunk loading; residual fill/glyph/chunk-boundary composite error accounting; shader consumption of `PATH_DISTANCE`; runtime-refined rendered WebGL/device-pixel error; and same-source AutoCAD visual/measurement comparison.


## 2026-09-24 — direct LINE to nested transformed BULGE chunk seam

`testLineToNestedBulgeSourceSeamIsBoundedAcrossChunks` joins a top-level LINE endpoint to the first point of a BULGE LWPOLYLINE nested under two INSERTs. The combined transform reflects and non-uniformly scales the source arc (largest singular value 8), then rotates/translates it near 1e9 coordinates; one emitted primitive per chunk gives the direct LINE and each BULGE chord independent Float64 origins. The oracle independently derives the semicircle sweep, tessellation interval count, `R(1-cos(Δθ/2))` sagitta, composed affine points, chunk-bounds origins, Float32 endpoint losses and active-view CSS metrics. It checks every chunk's same-chord sagitta-plus-endpoint composite, the shared endpoint seam against both endpoint losses and neighboring chunk bounds, and 20,001 analytic source samples against their corresponding decoded chord envelopes. Hash-index, manifest validation, diagnostic and scene quality metadata are checked too.

Targeted `npx tsx tests/cad-v2/chunk-error-accounting.test.ts`, full CAD V2 unit, UI/Chromium **3/3**, runtime `npx tsc --noEmit -p tsconfig.next.json --incremental false`, and `git diff --check` passed. Worker hashes match the preserved copies. Test-only: compiler/cache revision **v27** and binary schema **v1** are unchanged. This closes only this forward LINE-to-nested reflected/non-uniform BULGE join profile; other cross-source joins and fill/glyph/boundary interactions remain open.

F07 remains **IN_PROGRESS**; plan **14/19 (74%)**, with **5/19 (26%)** packages open. Periodic SPLINE AutoCAD fixture/evaluator and periodic knot parity, HATCH fill runtime remesh/topology, host-integrated bounded spatial partition/on-demand chunk loading, residual fill/glyph/chunk-boundary composites, shader-side `PATH_DISTANCE`, runtime-refined rendered WebGL/device-pixel error, and same-source AutoCAD visual/measurement comparison remain open.

### 2026-09-24 — cross-source ARC→LINE chunk seam

testArcToLineSourceSeamIsBoundedAcrossChunks ARC kaynağını, analitik son çember noktasıyla tam aynı başlangıç vertex'ini kullanan ayrı LINE kaynağından önce derler. Her ARC kirişi ve LINE ayrı chunk'tadır. Bağımsız oracle her chunk'ın bounds-midpoint ORIGIN'ini, Float32 XY offset'lerini ve decode uç kayıplarını yeniden hesaplar; son ARC kirişi için daire sagitta'sını endpoint encoding kaybıyla birleştirir. Ölçülen seam boşluğu ortak iki uç kaybı, adjacent generic quantization toplamı ve ARC composite + LINE encoding zarfıyla karşılaştırılır. CSS/world izdüşümü, hash-index alanları ve manifest validation da kontrol edilir.

Targeted accounting, tam CAD V2 unit, runtime typecheck ve UI/Chromium 3/3 geçti; git diff --check temiz. UI worker bundle hash'leri koruma kopyalarıyla aynı. Yalnız test eklendi; compiler/cache revision v27, DV2SCN01 schema v1 sabit.

Bu tek ARC→LINE sıralı kaynak profili için statik encoding/seam oracle'ıdır. Genel çapraz-kaynak/chunk bileşikleri, fill/glyph, runtime-refined rendered hata ve AutoCAD eşdeğerliği kapanmış sayılmaz. Periodic SPLINE AutoCAD fixture/evaluator/knot parity, HATCH fill runtime remesh/topology, host'a bağlı bounded/on-demand chunk yükleme, kalan fill/glyph/chunk-boundary composite'leri, PATH_DISTANCE shader tüketimi, WebGL device-pixel hata ve same-source AutoCAD görsel/ölçü oracle'ı açık. F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) paket açık.

### 2026-09-24 — nested BULGE→LINE ters yönlü chunk seam

testNestedBulgeToLineSourceSeamIsBoundedAcrossChunks iki seviyeli INSERT içindeki bulge=1 LWPOLYLINE yarım dairesinin son analitik noktasını ayrı top-level LINE kaynağının tam başlangıcı yapar. İç ölçek (2,3), dış yansıtmalı ölçek (-4,1), 0.35 rad rotasyon ve 1e9'a yakın öteleme birleşerek singular value 8 profili oluşturur; her BULGE kirişi ve LINE ayrı chunk origin'i kullanır. Bağımsız oracle son chord'un daire sagitta'sını birleşik dönüşümle world-space'e taşır, Float32 endpoint kaybını ekler, iki kaynak arasındaki decode seam'ini ve CSS/world metriklerini ölçer. Hash-index ile manifest validation da doğrulanır.

Targeted chunk-error accounting, tam CAD V2 unit, runtime typecheck, UI/Chromium 3/3 ve git diff --check geçti. Worker hash'leri korunmuş kopyalarla aynı. Yalnız test eklendi; compiler/cache v27, DV2SCN01 schema v1 sabit.

Bu yalnız son nested BULGE chord → LINE yönlü statik seam profilidir; önceki LINE→nested BULGE ölçümünün ters kaynak sırasını tamamlar, genel cross-source/chunk kompozisyonunu değil. Periodic SPLINE AutoCAD fixture/evaluator/knot parity, HATCH runtime fill remesh/topology, host on-demand bounded chunk yükleme, kalan fill/glyph/chunk-boundary composite'leri, PATH_DISTANCE shader tüketimi, runtime-refined WebGL/device-pixel hata ve same-source AutoCAD görsel/ölçü oracle'ı açık. F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-24 — runtime-refined WebGL ARC pixel error oracle

The existing Chromium refinement scenario now measures the actual CAD V2 WebGL canvas after idle runtime refinement reaches its 0.25 CSS-pixel target and confirms that the rendered line has more than two vertices. It projects the fixture’s analytic quarter-circle independently using the fit-camera scale, then compares 494 detected blue/cyan pixel centers with that arc inside a padded region that excludes overlaid page controls. The maximum rendered-pixel-to-analytic-arc distance is 0.9677 CSS px; the maximum distance from 0.5 CSS-pixel-spaced analytic arc samples to the nearest rendered pixel is 0.7497 CSS px. Both directed measurements are within 1.25 CSS px (0.25 refinement target + 1 CSS px raster envelope).

Targeted Chromium 1/1, full CAD V2 unit, full UI/Chromium 3/3, runtime typecheck, and git diff --check passed. The rebuilt worker SHA-256 hashes match preserved copies (DWG DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D; scene worker 1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280). Test-only: compiler/cache revision v27 and DV2SCN01 schema v1 are unchanged.

This is a measured runtime-refined rendered-error profile for one synthetic quarter-circle, camera fit, Chromium canvas size, and raster context. It does not establish a general bound across entities, zoom/DPR/device contexts, fills/glyphs/chunk boundaries, or AutoCAD output. Periodic SPLINE AutoCAD fixture/evaluator and knot parity, HATCH fill runtime remesh/topology, host-integrated bounded spatial partition/on-demand chunks, residual fill/glyph/chunk-boundary composites, shader-side PATH_DISTANCE, broader runtime-refined rendered error, and same-source AutoCAD visual/measurement comparison remain open. F07 remains IN_PROGRESS; plan 14/19 (74%), 5/19 (26%) packages open.


## 2026-09-24 — ikinci rendered-error profili: yüzde 125 kamera zoom'u

Önceki fit-camera screenshot oracle'ı aynı gerçek WebGL quarter-circle görüntüsünde 125% yakınlaştırmada da çalıştırıldı. UI yüzde göstergesi doğrulanır; host refinement isteği önce 0.75 CSS px transient, sonra 0.25 CSS px idle hedefiyle tamamlanıp yanıtlar teslim edilmeden screenshot alınmaz. Kamera merkezinde değişiklik olmadan 125% UI zoom'u, fit ölçeğinden bağımsız olarak u=0.13157895 world/CSS px ile analitik yaya dönüştürülür. 610 mavi/cyan piksel ölçülür: render→source en büyük uzaklık 0.9612 CSS px, 0.5 CSS px aralıklı source→render örnekleri en fazla 0.7642 CSS px'tedir. Fit profiliyle aynı 1.25 CSS px (0.25 hedef + 1 raster px) sınırındadır.

Hedefli Chromium 1/1, tam CAD V2 unit, tam UI/Chromium 3/3, runtime typecheck ve git diff --check geçti. Worker SHA-256 hash'leri korunan kopyalarla aynı; test-only değişiklik, compiler/cache revision v27, DV2SCN01 schema v1 sabit.

Bu ek kanıt fit ve 125% centered zoom profillerini kapsar; daha yüksek zoom seviyeleri, DPR/cihaz değişimleri, farklı geometri, pan edilmiş kameralar, fill/glyph/chunk etkileşimleri ve AutoCAD same-source parity açık kalır. Diğer F07 kapıları: periodic SPLINE AutoCAD fixture/evaluator ve knot parity, HATCH runtime fill remesh/topology, host-integrated bounded partition/on-demand chunk loading, kalan fill/glyph/chunk-boundary composites, shader PATH_DISTANCE kullanımı ve genel rendered hata garantisi. F07 IN_PROGRESS; toplam plan 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-24 — third centered scale profile: 80% zoom-out

The same two-sided screenshot oracle now measures the actual runtime-refined WebGL quarter-circle at centered 80% zoom-out. After the UI confirms 80%, transient 0.75 CSS px and idle 0.25 CSS px refinement replies are delivered and the bounded response queue becomes quiet. The independent camera scale is fitU/0.8 = 0.2055921053 world/CSS px. It detects 399 rendered pixels; maximum rendered-pixel-to-source-arc distance is 0.9819 CSS px, and maximum sampled source-arc-to-rendered-pixel distance is 0.7193 CSS px. Both are within the 1.25 CSS px envelope (0.25 refinement target + 1 CSS px raster allowance).

Together with the existing fit and centered 125% profiles, all three measured scales are within the same envelope: fit 494 pixels at 0.9677/0.7497 CSS px, 80% 399 pixels at 0.9819/0.7193 CSS px, and 125% 610 pixels at 0.9612/0.7642 CSS px (render→source/source→render). Targeted Chromium 1/1, complete CAD V2 unit, full UI/Chromium 3/3, runtime typecheck, and diff-check passed. Test-only; compiler/cache revision v27 and DV2SCN01 schema v1 are unchanged, as are the preserved UI worker hashes.

This remains a synthetic quarter-circle measured in one centered Chromium canvas/raster context at 80%, fit, and 125%. Higher zoom, panned views, DPR/device variation, other geometry, fills, glyphs, chunk boundaries, broader cumulative runtime error, and same-source AutoCAD image/measurement comparison remain open. Periodic SPLINE AutoCAD fixtures/evaluator and knot-multiplicity oracle, HATCH runtime remesh/topology, host-integrated bounded partition/on-demand chunk loading, residual fill/glyph/chunk-boundary error accounting, and shader-side PATH_DISTANCE consumption are also open. F07 remains IN_PROGRESS; plan 14/19 (74%), with 5/19 (26%) packages open.


## 2026-09-24 — measured panned runtime-refined raster profile

The two-sided rendered-pixel/source-arc oracle was repeated after a controlled 48×24 CSS-pixel pointer drag at centered 125% zoom. The D3 camera adapter maps this drag to the same screen translation while keeping units-per-CSS-pixel at 0.1315789474. The bounded wait verifies that the prior idle 0.25 CSS-pixel refinement profile remains settled and there are no held replies before the screenshot. The measured 610 blue pixels occupy bounds shifted by exactly +48,+24 CSS pixels from the centered 125% profile. Maximum rendered-pixel-to-source-arc distance is 0.9612 CSS px; maximum sampled source-arc-to-rendered-pixel distance is 0.7642 CSS px, both within 1.25 CSS px.

Targeted Chromium 1/1, complete CAD V2 unit, full UI/Chromium 3/3, runtime typecheck, and git diff --check passed. Rebuilt DWG conversion and CAD V2 scene worker SHA-256 values match preserved copies. This stage changes the browser test and evidence only; compiler/cache revision v27 and DV2SCN01 schema v1 remain unchanged.

This is one synthetic quarter-circle at one translated camera center and 125% scale in one Chromium raster context. It does not cover arbitrary pan directions/distances, other scales, DPR/device variation, other geometry, fills, glyphs, chunk boundaries, broad cumulative rendered error, or same-source AutoCAD image/measurement parity. Periodic SPLINE AutoCAD fixtures/evaluator and knot-multiplicity oracle, HATCH runtime remesh/topology, host-integrated bounded spatial partition/on-demand chunk loading, residual fill/glyph/chunk-boundary error accounting, and shader-side PATH_DISTANCE consumption remain open. F07 remains IN_PROGRESS; plan 14/19 (74%), with 5/19 (26%) packages open.


## 2026-09-24 — panned 195% runtime-refined visible ARC profile

The Chromium WebGL quarter-circle raster oracle now covers a high-zoom, panned view after runtime refinement settles. Three centered 1.25 zoom steps produce 195.3125% (UI rounds to 195%); the 156% response is held as the stale intermediate, then the final idle response reaches the 0.25 CSS-pixel target with zero held replies and 46 maximum line vertices. D3 reports k=11.875 (fit scale 0.1644736842, hence 0.0842105263 world/CSS px), x=811/y=421.5. The previous +48,+24 pan scales to +75,+37.5 through the two centered zoom steps; two later +48,+24 drags yield the independently expected +171,+85.5.

The camera clips the source quarter-circle. Source→render samples are restricted to visible analytic angles [0.1591116695,1.0916057806], while each rendered pixel is compared to the full analytic source circle so a nearest point just outside the viewport is not falsely clamped to the edge. Across 622 selected pixels, maximum render→source distance is 1.0113 CSS px and visible source→render distance is 0.7581 CSS px, both below 1.25 CSS px.

Targeted Chromium 1/1, complete CAD V2 unit, UI/Chromium 3/3, runtime npx tsc --noEmit -p tsconfig.next.json --incremental false, and git diff --check passed. Rebuilt DWG/scene worker hashes are DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D and 1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280, matching preserved artifacts. Test-only: compiler/cache revision v27 and DV2SCN01 schema v1 unchanged.

This is limited to one synthetic quarter-circle, one panned 195% camera, one Chromium canvas/raster context, and the visible curve segment. Periodic SPLINE AutoCAD fixture/support and knot multiplicity oracle, HATCH runtime remesh/topology, bounded host spatial partition/on-demand chunk loading, fill/glyph/chunk-boundary and remaining composite accounting, shader PATH_DISTANCE consumption, broader rendered error across geometry/zoom/pan/DPR, and same-source AutoCAD visual/measurement remain open. F07 IN_PROGRESS; plan 14/19 (74%), 5/19 (26%) packages open.


## 2026-09-24 — runtime-refined WebGL raster profile at DPR2

The browser test now creates an isolated Chromium context with `deviceScaleFactor=2` and exercises the actual CAD V2 host, worker and WebGL renderer. The centered fit viewport is 1280×672 CSS px; the renderer drawing buffer and `scale: "device"` screenshot are 2560×1344. Worker refinement requests reached the transient 0.75 and idle 0.25 CSS-pixel profiles; both replies arrived, a bounded quiet check remained stable, and the largest observed LINES draw was 34 vertices.

An independent analytic quarter-circle projection was compared in both directions against 981 selected device-resolution raster pixels. Maximum rendered-pixel→full-source-arc distance is 0.6157362894 CSS px; maximum source-arc→rendered-pixel distance is 0.4750552899 CSS px. Both are within the 1.25 CSS-pixel envelope. The browser reported `devicePixelRatio=2`, and canvas backing dimensions exactly doubled CSS dimensions.

Validation: complete `npm run check:cad-v2:unit` PASS; complete `npm run check:cad-v2:ui` Chromium **4/4 PASS**; runtime `npx tsc --noEmit -p tsconfig.next.json --incremental false` PASS; `git diff --check` PASS. The rebuilt DWG and CAD scene worker bundle hashes are unchanged from immediately before this run. No compiler/runtime production code changed; compiler/cache revision remains `cad-v2-compiler-2026.09-v27` and DV2SCN01 binary schema remains v1.

### Open-gate recheck against current code and tests

| F07 gate | Evidence in the current tree | State |
|---|---|---|
| Periodic SPLINE AutoCAD fixture/support and knot multiplicity oracle | Fourteen non-periodic synthetic degree-2..5 multiplicity profiles use an independent De Boor oracle; periodic AutoCAD fixture/evaluator coverage is absent. | **OPEN** |
| HATCH runtime fill remesh/topology | Boundary curves receive worker refinement; fill triangles remain the static compiler mesh and have no runtime remesh/topology acceptance. | **OPEN** |
| Bounded spatial partition and on-demand chunk load | Bbox/culling and scheduler unit coverage exist; the scheduler is not wired into the host and initial host loading fetches all manifest chunks. | **OPEN** |
| Remaining fill/glyph/chunk-boundary composite error | Selected same-chord, seam, fill-boundary and glyph-endpoint terms are measured; complete cross-source/chunk/fill/glyph outline/refinement composites are not. | **OPEN** |
| Shader consumption of `PATH_DISTANCE` | Binary/worker and refinement paths retain the array, but `cad-v2-renderer.ts` does not read it; compiler-produced DASHED raster evidence uses pre-tessellated XY. | **OPEN** |
| Runtime-refined rendered error across geometry, zoom, pan and DPR/device | One quarter-circle is measured at fit/80%/125%, panned 125%/195% at DPR1 and centered fit at DPR2. The new DPR2 profile is partial progress; other geometry, pan at DPR2 and a broader device matrix remain absent. | **OPEN** |
| Same-source AutoCAD visual/measurement oracle | No paired same-source AutoCAD raster/ROI/measurement comparison exists in the F07 tests. | **OPEN / NOT_RUN** |

Nested/transformed BULGE was not selected for another substage: the current tree already has an independent same-chord affine bound test and both selected BULGE→LINE/LINE→BULGE chunk-seam directions. Those narrow passes do not close the remaining general composite gate. This DPR2 result is one synthetic geometry/profile, not AutoCAD parity or a general rendered-error guarantee. F07 remains **IN_PROGRESS**; plan **14/19 (74%)**, with **5/19 (26%)** packages open.

## 2026-09-24 — F07 ELLIPSE runtime-refined raster measurement

A synthetic direct ELLIPSE sidecar (center (0,0), basis (40,0)/(0,24), parameter [0, π/2]) traversed the real host, refinement worker, applied XY buffer, and WebGL renderer. Chromium DPR1 fit used 1280×672 CSS/drawing-buffer pixels at 0.1644736842 world/CSS px. Worker targets 0.75→0.25 CSS px settled with 2 replies, stable quiet state, and max 34 LINES vertices.
The independent parametric oracle used 4097 source samples and 378 selected pixels. Maximum rendered-pixel→source distance was 0.9825281925 CSS px; source→rendered-pixel was 0.7467465149 CSS px; both ≤1.25. One quarter ELLIPSE/DPR1 fit only, not AutoCAD parity/general guarantee.
Relevant curve-refinement/precision-refinement units, focused Chromium 1/1, full UI/Chromium 5/5, runtime typecheck and diff-check passed. A final retry after a fail-fast guard edit yielded no test result: C: was full and Playwright failed with ENOSPC. Full unit was not repeated because it rewrites existing P05/P06 evidence JSONs. Worker hashes unchanged (scene 1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280; DWG DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D); compiler/cache v27, schema v1.

| F07 gate recheck | Evidence | State |
|---|---|---|
| Periodic SPLINE AutoCAD fixture/knot | Fourteen synthetic non-periodic profiles; no periodic AutoCAD fixture/evaluator. | OPEN |
| HATCH runtime fill remesh/topology | Boundary refinement only; fill topology is not remeshed. | OPEN |
| Bounded partition/on-demand chunks | Scheduler tests exist; host fetches all initial manifest chunks. | OPEN |
| Residual fill/glyph/chunk composites | Selected terms exist; general composites unproven. | OPEN |
| Shader PATH_DISTANCE | Renderer does not consume it; dash test checks pre-tessellated XY. | OPEN |
| Rendered-error geometry/zoom/pan/DPR/device | ARC has zoom/pan and DPR2 fit; ELLIPSE adds DPR1 fit. Other geometry and pan-DPR2 remain absent. | OPEN |
| Same-source AutoCAD visual/measurement | No paired oracle. | OPEN / NOT_RUN |

F07 IN_PROGRESS; plan 14/19 (74%), 5/19 (26%) packages open.
D-backed retry'ler test başlamadan durdu: ilkinde npm cache C: üzerindeydi; ikincisinde scripts/sync-cad-upstream-assets.mjs:61 C: diskinde ENOSPC verdi. Yeni D: çıktıları korundu.

## 2026-09-25 — DPR2 pan altında bağımsız runtime ARC hata ölçümü

Aynı analitik quarter-circle kaynağı, Chromium'da DPR2 gerçek çizim yüzeyinde fit kamera merkezinden +48,+24 CSS px sürüklendi. D3 kamera (640,336,k=6.08)'dan (688,360,k=6.08)'e geçti; kamera ölçeği ve refinement bucket sabit kaldı. DPR2 drawing buffer 2560×1344, CSS viewport 1280×672, ölçek 0.1644736842 world/CSS px. Worker hedefleri [0.75,0.25], iki yanıt ve sessiz snapshot sonrası 981 seçili render pikseli ile bağımsız analitik kaynak yayı iki yönde karşılaştırıldı: piksel→kaynak maksimumı 0.6157362894 CSS px, kaynak→render maksimumı 0.4750552899 CSS px. Her ikisi 1.25 CSS px sınırında.

Unit profilleri `curve-refinement`, `precision-refinement`, `layout-viewport` PASS; beş testli Chromium kabul dosyası 5/5 PASS; runtime TypeScript kontrolü ve diff-check PASS. Yalnız test değişikliği; compiler/cache revision v27, binary schema v1 ve iki worker SHA-256 sabit.

Sonuç DPR2 fit ve tek pan vektörüne özgü profildir. Daha geniş geometri/zoom/pan/DPR/device matrisi ile fill, glyph, chunk ve AutoCAD görsel/ölçü hatası kapıları AÇIK kalır. Diğer açık kapılar: periodic SPLINE AutoCAD/knot oracle'ı, HATCH runtime remesh/topology, host-integrated bounded/on-demand chunk, kalan bileşik hata muhasebesi ve shader `PATH_DISTANCE`. Same-source AutoCAD oracle'ı NOT_RUN. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) açık.
## 2026-09-25 — bağımsız parametrik oracle ile panned DPR2 ELLIPSE

DPR1 centered ELLIPSE profilini koruyarak yeni bir Chromium DPR2 bağlamı eklendi. Gerçek CAD V2 host/worker/refined-buffer/WebGL hattındaki sentetik ELLIPSE, D3 fit transform'unda (640,336,k=6.08) başladı ve gerçek mouse pan +48,+24 CSS px sonrası (688,360,k=6.08) oldu. CSS canvas 1280×672, device buffer ve ekran görüntüsü 2560×1344, u=0.1644736842 world/CSS px. Bağımsız oracle elipsi 4097 eşit parametre örneğiyle kurdu; 759 seçilmiş raster pikselinde render→kaynak maksimumı 0.6081436225 CSS px, kaynak→render maksimumı 0.4231605551 CSS px. Hedef bütçe 1.25 CSS px. Worker [0.75,0.25] hedefleri için iki yanıt geldi; sakin snapshot ve en fazla 34 line vertex doğrulandı.

`curve-refinement`, `precision-refinement`, `layout-viewport` targeted unit testleri PASS; tam Chromium viewport dosyası 6/6 PASS; runtime `tsc --noEmit -p tsconfig.next.json --incremental false` ve `git diff --check` PASS. Değişiklik test/helper kapsamındadır; revision v27, binary schema v1 ve worker hash'leri sabit.

Güncellenen rendered-error envanteri DPR2 fit+tek pan bağlamında ARC ve ELLIPSE içerir; bu, farklı geometri/zoom/pan/DPR/device genel kapısını yalnızca kısmen karşılar ve kapı OPEN kalır. Periodic AutoCAD SPLINE/knot, HATCH remesh/topology, host bounded/on-demand chunks, kalan fill/glyph/chunk bileşikleri, shader `PATH_DISTANCE`, same-source AutoCAD görsel/ölçü oracle'ı OPEN; AutoCAD NOT_RUN. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) açık.
## 2026-09-25 — ELLIPSE DPR2, 125% zoom and second-pan raster profile

The prior DPR2 ELLIPSE fit-pan capture now continues through centered 125% zoom and a second real +48,+24 CSS-pixel mouse pan. D3 camera transforms were (688,360,k=6.08) after the first pan, (700,366,k=7.6) after zoom, and (748,390,k=7.6) after the second pan, for net center-relative offset (+108,+54) CSS px. The CSS viewport is 1280×672, DPR2 drawing buffer is 2560×1344, and the independent analytic ellipse uses 0.1315789474 world units/CSS px. A 4097-point parametric source oracle was compared in both directions with 940 selected raster pixels: maximum render-to-source distance 0.5931555545 CSS px; maximum source-to-render distance 0.4141058575 CSS px. Both are within the 1.25 CSS-pixel envelope. Worker target sequence [0.75,0.25,0.75,0.25] settled with four replies, quiet pending count, and 40 maximum line vertices.

Targeted Chromium 1/1 and the complete six-case layout-viewport Chromium file 6/6 passed. The three relevant CAD V2 unit files and runtime TypeScript check passed, as did git diff --check. The stage changed only the test/helper; compiler/cache revision cad-v2-compiler-2026.09-v27, DV2SCN01 schema v1, scene worker SHA-256 1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280, and DWG/DXF worker SHA-256 DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D are unchanged. Test logs/reports are preserved under D:\codex-cad-v2-f07-ellipse-pan-dpr2-125-20260925; the run used a fresh C: Next cache.

This is a narrow synthetic ELLIPSE raster acceptance only. Periodic SPLINE AutoCAD fixture/support and knot oracle, HATCH runtime remesh/topology, host-integrated bounded partition/on-demand chunks, remaining fill/glyph/chunk-boundary composite accounting, shader PATH_DISTANCE consumption, the general geometry/zoom/pan/DPR/device rendered-error matrix, and same-source AutoCAD visual/measurement remain OPEN. The AutoCAD oracle is NOT_RUN. F07 remains IN_PROGRESS; 14/19 packages (74%) complete, 5/19 (26%) open.
Current raster-profile inventory: ARC has DPR1 fit/80%/125%, DPR1 panned 125%/195%, and DPR2 fit plus +48,+24 pan; ELLIPSE has DPR1 fit, DPR2 from fit camera after +48,+24 pan, and DPR2 at 125% after two +48,+24 pan steps. Older notes saying there was no DPR2 pan predate this capture. The general matrix remains PARTIAL/OPEN because other geometry and device contexts are not covered.
## 2026-09-25 — DPR2 ELLIPSE 80% zoom-out with retained pan

After the DPR2 ELLIPSE 125% capture at D3 (748,390,k=7.6), two center-anchored zoom-outs showed 100% then 80%. The final camera is (709.12,370.56,k=4.864), which scales the existing center-relative pan offset to (+69.12,+34.56) CSS px. No additional pointer drag was performed at 80%; this measures the translated camera after zoom-out. CSS viewport 1280×672, device buffer 2560×1344, u=0.2055921053 world/CSS px. The independent 4097-sample parametric ellipse oracle covers 620 rendered pixels: maximum render→source distance 0.5127801495 CSS px and source→render distance 0.3767122232 CSS px, both within 1.25. Worker targets were [0.75,0.25,0.75,0.25,0.75,0.25]; six replies settled, quiet state, maxLineVertexCount=40.

Targeted Chromium 1/1 and the six-case layout-viewport file 6/6 passed, along with curve-refinement, precision-refinement, layout-viewport, runtime TypeScript, and git diff --check. Test/helper only; compiler/cache v27, DV2SCN01 schema v1, and scene/DWG worker hashes are unchanged. Logs and reports are preserved under D:\codex-cad-v2-f07-ellipse-dpr2-80-pan-20260925; the Next cache is a new unique C: directory.

This expands the measured camera matrix, not the general acceptance contract. Periodic SPLINE AutoCAD/evaluator and knot parity, HATCH runtime remesh/topology, host-integrated bounded partition/on-demand chunks, remaining fill/glyph/chunk composites, shader PATH_DISTANCE, general geometry/device rendered error, and same-source AutoCAD image/measurement remain OPEN; the AutoCAD oracle is NOT_RUN. F07 remains IN_PROGRESS at 14/19 (74%) with 5/19 (26%) open.
## 2026-09-25 — DPR2 ELLIPSE at 156% with retained translated camera

The DPR2 ELLIPSE camera at 80% with retained pan was zoomed in around viewport center through 100%, 125%, and 156%. At 156%, D3 reports (x=775,y=403.5,k=9.5), corresponding to the scaled center-relative offset (+135,+67.5) CSS px and 0.1052631579 world/CSS px. No new pointer drag occurred at 156%; this is the translated view carried through center-anchored zoom. The quarter-ellipse remains fully visible. An independent 4097-parameter source oracle measured 1190 device pixels in both directions: max render-to-source 0.6348085456 CSS px; source-to-render 0.4734169813 CSS px. Both are ≤1.25. Worker [0.75,0.25] targets repeated four times, eight replies total, quiet pending state, maxLineVertexCount=42.

Targeted Chromium 1/1, the six-case layout-viewport Chromium file 6/6, three relevant unit files, runtime TypeScript, and git diff --check passed. Test/helper only; compiler/cache v27, DV2SCN01 schema v1, and both worker SHA-256 values are unchanged. Run artifacts were preserved under D:\codex-cad-v2-f07-ellipse-dpr2-156-pan-20260925 and Next used a fresh C: cache.

This high-zoom ELLIPSE profile extends the raster matrix; general geometry/device acceptance stays PARTIAL/OPEN. Periodic SPLINE AutoCAD/knot oracle, HATCH runtime remesh/topology, host bounded/on-demand chunks, remaining fill/glyph/chunk composites, shader PATH_DISTANCE, and same-source AutoCAD image/measurement remain OPEN; AutoCAD is NOT_RUN. F07 remains IN_PROGRESS; 14/19 (74%) complete, 5/19 (26%) open.

## 2026-09-25 — DPR1 ELLIPSE at 156% after a real pan

The DPR1 ELLIPSE browser case now retains its centered fit capture and then exercises two UI zoom steps, 125% and 156%, one at a time. Each zoom waits for the latest 0.25 CSS-pixel refinement reply and a stable quiet snapshot before the next input, preventing a stale/intermediate zoom response from satisfying the measurement. From fit D3 `(640,336,k=6.08)`, centered zoom reaches `(640,336,k=9.5)`; a real mouse drag of `(+48,+24)` CSS px reaches `(688,360,k=9.5)`. The complete quarter-ellipse remains visible in the 1280×672 DPR1 drawing buffer at `u=0.1052631579` world/CSS px.

An independent parametric oracle samples the analytic ELLIPSE at 4097 parameters and compares both directed distances against 592 selected device-raster pixels. Maximum rendered-pixel→source distance is **0.9868434156 CSS px**; source→rendered-pixel distance is **0.7490349703 CSS px**. Both meet the 1.25 CSS-pixel envelope. Runtime targets were `[0.75,0.25]×3`; all six replies arrived, the final target was 0.25, the state remained quiet, and `maxLineVertexCount=42`.

Targeted Chromium passed 1/1 (44.5 s); the complete six-case layout-viewport Chromium file passed 6/6 (2.3 min). `curve-refinement`, `precision-refinement`, and `layout-viewport` unit tests, runtime `tsc --noEmit -p tsconfig.next.json --incremental false`, and `git diff --check` passed. Only the test/helper changed. Compiler/cache revision `cad-v2-compiler-2026.09-v27`, DV2SCN01 schema v1, scene worker SHA-256 `1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280`, and DWG/DXF worker SHA-256 `DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D` are unchanged. Full logs/config/results are preserved under `D:\codex-cad-v2-f07-ellipse-dpr1-156-pan-20260925`; the targeted and full browser runs used separate new C: Next caches.

### F07 open-gate recheck against current source/tests

| Gate | Current evidence | State |
|---|---|---|
| Periodic SPLINE AutoCAD fixture/support and knot multiplicity oracle | Periodic input is rejected fail-closed; independent De Boor multiplicity profiles cover synthetic non-periodic splines only. No periodic AutoCAD fixture/evaluator oracle. | **OPEN** |
| HATCH runtime remesh/topology | Runtime refinement updates curve boundary spans; fill triangles/topology do not have a runtime remesh acceptance path. | **OPEN** |
| Bounded spatial partition and on-demand chunks | Scheduler and bbox unit coverage exist, but scheduler is not integrated into host loading; host fetches the manifest chunk list at concurrency 6. | **OPEN** |
| Remaining fill/glyph/chunk-boundary composites | Selected endpoint/seam/fill-boundary terms are covered; full cross-source/chunk/fill/glyph-outline cumulative accounting is absent. | **OPEN** |
| Shader consumption of `PATH_DISTANCE` | Worker decodes/transfers the field; `cad-v2-renderer.ts` does not consume it, and dash pixels come from pre-tessellated XY. | **OPEN** |
| Runtime-refined rendered error across geometry/zoom/pan/DPR/device | This adds one DPR1 high-zoom panned ELLIPSE profile to selected ARC/ELLIPSE DPR1/2 cases; the general geometry/output-device matrix remains incomplete. | **PARTIAL / OPEN** |
| Same-source AutoCAD visual/measurement oracle | No paired same-source AutoCAD render/ROI/measurement test is present. | **OPEN / NOT_RUN** |

The general rendered-error gate remains open; this is one synthetic profile, not AutoCAD parity. Existing nested/transformed BULGE same-chord and two seam-direction oracles were not repeated. F07 remains **IN_PROGRESS** at **14/19 (74%)**, with **5/19 (26%)** packages open.


## 2026-09-25 — Rational cubic SPLINE DPR1 fit browser raster acceptance

A synthetic, non-periodic, clamped single-span rational cubic SPLINE now exercises the live CAD V2 host → scene worker refinement → line-buffer application → WebGL path. The fixture stores four control points [(-34,-18),(-15,40),(17,-38),(34,22)] and weights [1,0.7,1.25,0.9]; the test decodes the binary chunk metadata and checks that the source reference survives intact.

At DPR1, the 1280×672 canvas is at fit transform D3 (640,336,k=6.08), or 0.1644736842 world/CSS px. The worker received the final 0.25 CSS-pixel target after 0.75; both replies arrived, two quiet snapshots were equal, and the largest observed line draw contained 96 vertices. A separate rational Bernstein evaluator sampled 4097 source points, independent of the worker's recursive subdivision. Across 677 selected WebGL raster pixels, maximum rendered-pixel→source distance was 0.8164272623 CSS px and maximum source→render distance was 0.7307145792 CSS px; both are within the 1.25 CSS-pixel envelope.

The targeted Chromium case passed 1/1 and the complete layout-viewport Chromium file passed 7/7 (2.6 min). curve-refinement, precision-refinement, and worker-refinement-browser acceptance tests passed; runtime TypeScript and git diff --check passed. This substage changed only the browser test/helper, not production code. Compiler/cache revision cad-v2-compiler-2026.09-v27, DV2SCN01 schema v1, scene worker SHA-256 1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280, and DWG/DXF worker SHA-256 DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D are unchanged. Browser configs, logs and results are preserved at D:\codex-cad-v2-f07-spline-dpr1-fit-20260925; the two browser runs used distinct fresh C: Next caches and left no listeners on their ports.

This synthetic rational curve does not establish periodic AutoCAD SPLINE support or a knot-multiplicity oracle. Periodic/AutoCAD SPLINE remains OPEN; HATCH runtime remesh/topology OPEN; bounded spatial partition and host on-demand chunks OPEN; residual fill/glyph/chunk-boundary composite accounting OPEN; shader PATH_DISTANCE consumption OPEN; broad geometry/zoom/pan/DPR/device rendered-error remains PARTIAL / OPEN; same-source AutoCAD visual/measurement remains OPEN / NOT_RUN. Existing nested/transformed BULGE same-chord and both seam-direction oracles were not repeated. F07 remains IN_PROGRESS at 14/19 plan packages (74%), with 5/19 (26%) open.


## 2026-09-25 — Rational SPLINE DPR2 after a real pan

The independent rational Bernstein raster oracle now uses the measured D3 camera and converts screenshot device-pixel centers back to CSS coordinates. The synthetic non-periodic single-span rational cubic was loaded through the live host/worker/WebGL path at DPR2. From fit (640,336,k=6.08), a real mouse drag of (+48,+24) CSS px produced (688,360,k=6.08) without changing zoom. The viewport was 1280×672 CSS px and the drawing buffer/screenshot was 2560×1344 device px.

Across 1348 selected raster pixels and 4097 independent rational Bernstein source samples, max raster→source error was 0.4829010756 CSS px and max source→raster gap was 0.4292518924 CSS px (both ≤1.25). Refinement targets [0.75,0.25] received 2/2 replies; before/after pan snapshots were stable and max line draw was 96 vertices. The camera-aware oracle also reran the existing DPR1 fit profile in the full suite with unchanged results, 0.8164272623 / 0.7307145792 CSS px.

Targeted Chromium passed 1/1; the full viewport Chromium file passed 8/8 (2.7 min). curve-refinement, precision-refinement, worker-refinement-browser, runtime TypeScript, and git diff --check passed. Only the browser test/helper changed; compiler/cache v27, DV2SCN01 v1, and scene/DWG worker hashes did not change. New configs/logs/results are preserved under D:\codex-cad-v2-f07-spline-dpr2-pan-20260925-camaware with a distinct C: Next cache per browser run.

The profile is synthetic and does not establish AutoCAD periodic SPLINE support or a knot-multiplicity oracle. Those remain OPEN, as do HATCH runtime remesh/topology, bounded host spatial partition/on-demand chunks, residual fill/glyph/chunk composite accounting, shader PATH_DISTANCE consumption, and same-source AutoCAD visual/measurement (NOT_RUN). The broader geometry/zoom/pan/DPR/device rendered-error gate remains PARTIAL / OPEN. F07 remains IN_PROGRESS at 14/19 packages (74%) with 5/19 (26%) open.


## 2026-09-25 — Rational SPLINE DPR2 125% zoom ve ikinci gerçek pan

DPR2 raster oracle'ı aynı sentetik clamped single-span rational cubic için 125% centered zoom ve ikinci mouse pan adımını da ölçüyor. Gerçek kamera dizisi fit (640,336,k=6.08), ilk pan sonrası (688,360,k=6.08), centered 125% zoom sonrası (700,366,k=7.6), ikinci gerçek +48,+24 CSS px pan sonrası (748,390,k=7.6). Böylece 125% görünümde fit merkezi relatif toplam pan (+108,+54) CSS px. Canvas 1280×672 CSS ve 2560×1344 device px; `u=1/7.6=0.1315789474` world/CSS px.

Worker/host instrumentation zoom cevabında ve ikinci pan sakinleşmesinde `[0.75,0.25,0.75,0.25]` hedeflerini, 4/4 yanıtı, son 0.25 hedefini ve eşleşen quiet state'i doğruladı. Maksimum çizgi draw 110 vertex. Worker'ın kendi curve evaluator'ından bağımsız rasyonel Bernstein kaynak oracle'ı 4097 noktada değerlendirildi. 1702 mavi raster pikselinde maksimum render→source **0.4689849332 CSS px**, source→render coverage gap **0.4743416490 CSS px**; iki yön de 1.25 altında.

İlgili unit seti (`precision-refinement`, `curve-refinement`, `worker-refinement-browser`) geçti; seçilmiş raster Chromium kümesi 5/5 ve tam `cad-v2-layout-viewport.spec.ts` 8/8 geçti. Runtime `npx tsc --noEmit -p tsconfig.next.json --incremental false` ve `git diff --check` geçti. İlk tam UI denemesi `UNSAFE_TEST_DATA_DIR` ile durdu; config hatası DOK path'inin per-run TEMP klasörünün dışında olmasından kaynaklandı, ardından yeni output/cache kökünde TEMP içindeki DOK path ile tam 8/8 tekrar geçti. Hatalı config denemesinin artefaktları silinmedi.

Değişiklik yalnız test/helper'dadır. Runtime refinement veya compiler çıktısı değişmedi; revision `cad-v2-compiler-2026.09-v27`, binary DV2SCN01 v1, worker hash'leri scene `1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280`, DWG/DXF `DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D`. Yeni C: cache'ler ayrı; D: hedefli, hatalı-suite ve düzeltilmiş-suite log/sonuçları korunuyor.

F07 kapı sonucu değişmedi: periodic AutoCAD SPLINE/knot oracle **AÇIK**; HATCH runtime remesh/topology **AÇIK**; bounded host partition/on-demand chunks **AÇIK**; remaining fill/glyph/chunk composite **AÇIK**; shader `PATH_DISTANCE` tüketimi **AÇIK**; geniş geometri/zoom/pan/DPR/device rendered-error matrisi **PARTIAL/AÇIK**; same-source AutoCAD visual/measurement **AÇIK/NOT_RUN**. Nested/transformed BULGE'ın mevcut dar same-chord ve iki seam yönü testleri bu turda tekrar edilmedi. F07 **IN_PROGRESS**, plan **14/19 (%74)** ve **5/19 (%26)** paket açık.


## 2026-09-25 — Rational SPLINE DPR2 156% zoom and second pan

The synthetic non-periodic, clamped rational cubic SPLINE browser oracle now carries the DPR2 camera through fit, a real pan, centered 125% zoom and another pan, then centered 156% zoom and a second real pointer pan. The measured D3 sequence is `(640,336,k=6.08)` → `(688,360,k=6.08)` → `(700,366,k=7.6)` → `(748,390,k=7.6)` → `(775,403.5,k=9.5)` → `(823,427.5,k=9.5)`. Final fit-center-relative pan is `(+183,+91.5)` CSS px. The viewport is 1280×672 CSS px, drawing buffer 2560×1344 device px, `u=1/9.5=0.1052631579` world/CSS px, and the full source remains visible.

An independent rational Bernstein evaluator with 4097 samples was compared bidirectionally with 2124 selected WebGL raster pixels. Maximum rendered-to-source distance is **0.4907102356 CSS px**; maximum source-to-render coverage gap is **0.4090727048 CSS px**. Both satisfy the 1.25 CSS px test envelope. After the final zoom and pan, worker targets are `[0.75,0.25,0.75,0.25,0.75,0.25]`, with 6 matching replies, latest target 0.25 CSS px, no pending replies, and maxLineVertexCount 110.

The first targeted attempt exposed a test-helper race: it could accept the previous 125% settled 0.25 reply before the new 156% transient 0.75 target appeared. The helper now requires a target count newer than the pre-zoom baseline. Corrected targeted Chromium passed 1/1 and the full `cad-v2-layout-viewport.spec.ts` file passed 8/8 (3.1 min). `precision-refinement.test.ts`, `curve-refinement.test.ts`, `worker-refinement-browser.test.ts`, runtime `tsc --noEmit -p tsconfig.next.json --incremental false`, and `git diff --check` passed. Failed and corrected run artifacts are retained separately.

Only the browser test/helper changed. Compiler/cache revision `cad-v2-compiler-2026.09-v27`, DV2SCN01 schema v1, scene-worker SHA-256 `1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280`, and DWG/DXF-worker SHA-256 `DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D` remain unchanged. Targeted/unit/typecheck artifacts are under `D:\codex-cad-v2-f07-spline-dpr2-156-pan-retry-20260925`; full-suite config/logs under `D:\codex-cad-v2-f07-spline-dpr2-156-pan-full-20260925`. Prior pan195 roots and repository `test-output/` were preserved; test ports are closed.

Periodic AutoCAD SPLINE fixture/runtime support and knot oracle **OPEN**; HATCH runtime remesh/topology **OPEN**; bounded host spatial partition/on-demand chunks **OPEN**; remaining fill/glyph/chunk-boundary composite accounting **OPEN**; shader `PATH_DISTANCE` consumption **OPEN**; broad geometry/zoom/pan/DPR/device rendered-error **PARTIAL / OPEN**; same-source AutoCAD visual/measurement **OPEN / NOT_RUN**. Existing nested/transformed BULGE same-chord and two seam-direction tests were not repeated. F07 remains **IN_PROGRESS** at **14/19 (74%)**, with **5/19 (26%)** packages open.


## F07 SPLINE DPR2 195% acceptance (2026-09-25)

The runtime-refined browser acceptance now carries the synthetic, non-periodic rational cubic SPLINE through centered zoom steps and real pans to 195%. Final D3 camera is (x=868.75,y=450.375,k=11.875), with fit-center-relative offset (+228.75,+114.375) CSS px. The CSS viewport is 1280×672; DPR2 drawing buffer is 2560×1344; projected scale is u=0.08421052631578949 world/CSS px. Source bounds [465,189.125]..[1272.5,664.125] remain within the viewport.

The independent rational Bernstein evaluator uses 4097 source samples. Bidirectional comparison against 2704 selected WebGL pixels gives maximum rendered-to-source distance 0.5413191518506184 CSS px and maximum source-to-render coverage gap 0.4506939094329671 CSS px; both are within the 1.25 CSS px test envelope. The settled refinement sequence is [0.75,0.25]×4, with 8 replies, final target 0.25, no pending reply, and maxLineVertexCount 114.

Full layout-viewport Chromium passed 8/8 in 190 seconds. The complete npm run check:cad-v2:unit, runtime node_modules/typescript/bin/tsc --noEmit -p tsconfig.next.json --incremental false, and git diff --check passed. Logs/config/results are retained at D:\codex-cad-v2-f07-spline-dpr2-195-zoom-final2-20260925. Mock heartbeat success handling and stronger ELLIPSE zoom/refinement assertions isolate synthetic test sessions; no production source changed. Compiler/cache revision cad-v2-compiler-2026.09-v27, DV2SCN01 schema v1, scene worker SHA-256 1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280 and DWG/DXF worker SHA-256 DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D remain unchanged.

Open acceptance gates: periodic AutoCAD SPLINE fixture/runtime support and knot multiplicity oracle; HATCH runtime remesh/topology; host-integrated bounded spatial partition/on-demand chunk loading; remaining fill/glyph/chunk-boundary composite accounting; shader PATH_DISTANCE consumption; broad rendered-error across geometry/zoom/pan/DPR/device; and same-source AutoCAD visual/measurement (NOT_RUN). Selected existing nested/transformed BULGE same-chord/seam tests were not repeated and do not close composite accounting. F07 remains IN_PROGRESS at 14/19 (74%), with 5/19 (26%) packages open.


## F07 ELLIPSE DPR2 195% acceptance (2026-09-25)

The synthetic parametric ELLIPSE DPR2 raster profile now includes a real (-10,-5) CSS-pixel pan at 156%, followed by centered UI zoom to the 195% bucket. The resulting D3 transform is (796.25,414.125,k=11.875), or (+156.25,+78.125) CSS px relative to fit center. In a 1280×672 CSS viewport and 2560×1344 DPR2 buffer, u=0.08421052631578949 world/CSS px; the full quarter ellipse remains visible.

An independent 4097-sample parametric ellipse oracle was measured against 1476 selected WebGL pixels. Maximum rendered-to-source distance is 0.6301951256486582 CSS px and maximum source-to-render coverage gap is 0.4610262730380537 CSS px, both within 1.25 CSS px. After zoom settled, 14/14 refinement targets had replies, the last target was 0.25 CSS px, pending count was zero, and maxLineVertexCount was 46.

Targeted Chromium passed 1/1; the full layout-viewport file passed 8/8 in 3.3 minutes. precision-refinement, curve-refinement, worker-refinement-browser, runtime TypeScript, and git diff --check passed. Output is retained under D:\codex-cad-v2-f07-ellipse-dpr2-195-target-20260925 and D:\codex-cad-v2-f07-ellipse-dpr2-195-full-20260925. Only the browser test/helper changed. Compiler/cache revision cad-v2-compiler-2026.09-v27, DV2SCN01 schema v1, scene-worker SHA-256 1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280 and DWG/DXF-worker SHA-256 DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D remain unchanged.

Open gates remain periodic AutoCAD SPLINE fixture/runtime and knot oracle; HATCH runtime remesh/topology; bounded host partition/on-demand chunks; residual fill/glyph/chunk-boundary composite accounting; shader PATH_DISTANCE consumption; broad rendered-error across geometry/zoom/pan/DPR/device; and same-source AutoCAD visual/measurement (NOT_RUN). Existing nested/transformed BULGE source, worker-applied and same-chord accounting tests do not cover this remaining cross-source composite. F07 remains IN_PROGRESS at 14/19 (74%), with 5/19 (26%) packages open.

## 2026-09-25 — DPR1 ELLIPSE 195% yüksek zoom + pan

Gerçek CAD V2 host/worker-refinement/WebGL gösteriminden alınan DPR1 raster, aynı sentetik analitik çeyrek ELLIPSE kaynağına bağımsız 4097-nokta parametrik oracle ile karşılaştırıldı. DPR1 çizim tamponu 1280×672; son kamera `(690,361,k=11.875)`, fit’e oran 1.953125 ve merkez-relative son ofset `(50,25)` CSS px. Son pan gerçek fare hareketiyle `(-10,-5)` CSS px; kaynak yay viewport içinde kaldı. 747 raster pikseli için render→kaynak maksimum `1.0146941341675897` CSS px, kaynak→render maksimum `0.7496648733725313` CSS px (`≤1.25`).

Refinement hedef dizisi `[0.75,0.25]×4`; 8/8 yanıt, son hedef 0.25 CSS px, pending response 0, `maxLineVertexCount=46`. Tam viewport Chromium 8/8 (3.5 dk), unit 0, beş UI alt kontrolü ve runtime typecheck geçti. Aynı bucket içindeki son pan yeni target üretmedi; state’in sabit hedef sayısıyla quiet kalması ve kameranın pan deltası ayrıca doğrulandı. Başarılı çıktı ve ilk harness-timeout artefaktları D: run köklerinde korunuyor.

Bu DPR1 profili DPR2 ELLIPSE 195% sonucuna eşlenik kapsama ekler; cihaz/zoom/geometri matrisi genel kabul düzeyine çıkmadığından genel rendered-error kapısı PARTIAL/AÇIK kalır. Başka F07 gate’leri bu ölçümle kapanmaz.
## 2026-09-25 — DPR2 ARC 195% zoom and second pan

The DPR2 browser acceptance now carries the synthetic analytic quarter-circle ARC through a fit-state real pan (+48,+24 CSS px), centered UI zoom at 125%, 156%, and 195%, then another real (+48,+24) CSS-pixel pan at 195%. Final D3 transform is `(781.75,406.875,k=11.875)`, or fit-center-relative translation `(+141.75,+70.875)` CSS px. The viewport is 1280×672 CSS px and the device drawing buffer is 2560×1344; `u=0.08421052631578949` world/CSS px. The viewport-clipped source-angle interval is `[0,1.0286029931]` radians.

An independent analytic arc oracle was compared bidirectionally against 1363 selected WebGL pixels. Maximum rendered-to-source distance is **0.6559628023 CSS px**; maximum source-to-render coverage gap is **0.4458264123 CSS px**. Both are within the 1.25 CSS px acceptance bound. Settled worker targets are `[0.75,0.25]×4`, with 8 replies, latest target 0.25 CSS px, zero pending replies, and `maxLineVertexCount=46`.

Targeted Chromium passed 1/1 (51.2 s); the full `cad-v2-layout-viewport.spec.ts` Chromium file passed 8/8 (3.5 min). The precision-refinement, curve-refinement, worker-refinement-browser, camera-interaction, real-scene-render, host-lifecycle-cancellation, and ui-quality-acceptance scripts passed. Runtime `tsc --noEmit -p tsconfig.next.json --incremental false` and `git diff --check` passed. The broad unit command was not rerun because it writes four existing P05/P06 evidence JSONs; the five UI subchecks were run directly without invoking the package's worker rebuild step, preserving the existing generated worker. Test outputs/configs are retained under `D:\codex-cad-v2-f07-arc-dpr2-195-20260925`; the target/full runs used distinct C: Next caches and D: temporary data paths, and their ports are closed.

Only the browser acceptance test changed. Compiler/cache revision `cad-v2-compiler-2026.09-v27`, pipeline `fidelity-v3-p07`, DV2SCN01 schema v1, scene-worker SHA-256 `1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280`, and DWG/DXF-worker SHA-256 `DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D` remain unchanged.

This result extends only the rendered-error matrix: periodic AutoCAD SPLINE fixture/runtime and knot multiplicity oracle **OPEN**; HATCH runtime remesh/topology **OPEN**; bounded host partition/on-demand chunk loading **OPEN**; residual fill/glyph/chunk-boundary composite accounting **OPEN**; shader `PATH_DISTANCE` consumption **OPEN**; broad geometry/zoom/pan/DPR/device rendered-error **PARTIAL / OPEN**; same-source AutoCAD visual/measurement **OPEN / NOT_RUN**. F07 remains **IN_PROGRESS**, plan 14/19 (74%), with 5/19 (26%) packages open.
## 2026-09-25 — DPR1 rational SPLINE at 195% after real pan

The existing synthetic, non-periodic, clamped rational cubic SPLINE browser oracle now exercises DPR1 fit, centered UI zoom steps to 125%, 156%, and 195%, then a real (+48,+24) CSS-pixel pan at 195%. Final D3 camera is `(688,360,k=11.875)`, with `u=0.0842105263` world/CSS px in a 1280×672 CSS/DPR1 buffer. All 4097 independently evaluated rational Bernstein source samples remain visible; source bounds are `[284.25,98.75]..[1091.75,573.75]` CSS px.

Bidirectional comparison against 1350 selected WebGL pixels gives maximum rendered-to-source distance **0.9300776279 CSS px** and maximum source-to-render coverage gap **0.7905694150 CSS px**, both within 1.25 CSS px. The settled refinement sequence is `[0.75,0.25]×4`, with 8 replies, latest target 0.25 CSS px, zero pending replies, and `maxLineVertexCount=114`. The pan stays inside the 195% refinement bucket; final camera displacement and unchanged worker state were checked.

Targeted Chromium passed 1/1 (49.6 s), and the complete layout-viewport Chromium file passed 8/8 (3.5 min). `precision-refinement`, `curve-refinement`, `worker-refinement-browser`, `camera-interaction`, `real-scene-render`, `host-lifecycle-cancellation`, `ui-quality-acceptance`, runtime TypeScript and `git diff --check` passed. The broad unit command was omitted because it writes four P05/P06 evidence JSONs; the five UI subchecks ran directly without the package worker rebuild. Logs/configs/results and separate C: Next caches are retained under `D:\codex-cad-v2-f07-spline-dpr1-195-pan-20260925-v2`; test ports are closed.

Only the browser acceptance test changed. Compiler/cache revision `cad-v2-compiler-2026.09-v27`, pipeline `fidelity-v3-p07`, DV2SCN01 schema v1, scene worker SHA-256 `1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280`, and DWG/DXF worker SHA-256 `DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D` are unchanged.

This synthetic non-periodic single-span result only adds to the rendered-error matrix. Periodic AutoCAD SPLINE fixture/runtime and knot oracle **OPEN**; HATCH runtime remesh/topology **OPEN**; bounded spatial partition/on-demand chunks **OPEN**; remaining fill/glyph/chunk-boundary composite accounting **OPEN**; shader `PATH_DISTANCE` consumption **OPEN**; general geometry/zoom/pan/DPR/device rendered-error **PARTIAL / OPEN**; same-source AutoCAD visual/measurement **OPEN / NOT_RUN**. F07 remains **IN_PROGRESS** at plan 14/19 (74%), with 5/19 (26%) packages open.
## 2026-09-25 — DPR2 ELLIPSE 195% after a second real pan

The DPR2 parametric ELLIPSE browser acceptance now applies an additional real `(-10,-5)` CSS-pixel pointer pan after reaching the 195% zoom bucket. The camera moves from `(796.25,414.125,k=11.875)` to `(786.25,409.125,k=11.875)`, giving final fit-center-relative offset `(+146.25,+73.125)` CSS px. The 1280×672 CSS viewport has a 2560×1344 DPR2 drawing buffer; `u=0.0842105263` world/CSS px. Explicit projected-radius assertions keep the full quarter ellipse inside the viewport.

An independent 4097-sample parametric oracle was compared bidirectionally against 1476 selected WebGL pixels. Maximum rendered-to-source distance is **0.6301951256 CSS px**; maximum source-to-render coverage gap is **0.4610262730 CSS px**. Both are ≤1.25 CSS px. Settled worker targets are `[0.75,0.25]×7`, with 14 replies, last target 0.25 CSS px, zero pending replies and `maxLineVertexCount=46`. Two post-pan quiet snapshots match the pre-pan refinement state.

Targeted Chromium passed 1/1 (Playwright 1.4 min); the complete layout-viewport file passed 8/8 (3.6 min). The precision-refinement, curve-refinement, worker-refinement-browser, camera-interaction, real-scene-render, host-lifecycle-cancellation, ui-quality-acceptance, runtime TypeScript and `git diff --check` checks passed. The broad unit command was omitted because it writes existing P05/P06 evidence JSONs; the five UI subchecks ran directly without the package worker rebuild. Logs/config/results are retained at `D:\codex-cad-v2-f07-ellipse-dpr2-195-postpan-20260925`; target/full used separate C: Next caches and D: temp/data, with no remaining listeners.

This test-only profile leaves compiler/cache revision v27, pipeline `fidelity-v3-p07`, DV2SCN01 schema v1, scene worker SHA-256 `1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280` and DWG/DXF worker SHA-256 `DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D` unchanged. The rendered-error matrix remains PARTIAL/OPEN; periodic AutoCAD SPLINE/knot, HATCH remesh/topology, bounded/on-demand chunks, remaining fill/glyph/chunk composite, shader `PATH_DISTANCE`, and same-source AutoCAD visual/measurement remain OPEN (AutoCAD NOT_RUN). F07 remains IN_PROGRESS at 14/19 (74%), with 5/19 (26%) packages open.
## 2026-09-25 — DPR2 rational SPLINE raster acceptance after 195% pan

The synthetic, non-periodic single-span rational cubic SPLINE browser acceptance now performs an actual `(-10,-5)` CSS-pixel pointer pan after the 195% zoom step. Its D3 camera changes from `(868.75,450.375,k=11.875)` to `(858.75,445.375,k=11.875)`, for a fit-center-relative offset of `(+218.75,+109.375)` CSS px. At DPR2 the viewport is 1280×672 CSS px with a 2560×1344 drawing buffer; all independent source samples remain within `[455,184.125]..[1262.5,659.125]` CSS px.

The independent rational Bernstein oracle evaluates 4097 points and compares them bidirectionally with 2704 selected WebGL pixels. Maximum rendered-to-source distance is **0.5413191519 CSS px**; maximum source-to-render coverage gap is **0.4506939094 CSS px**, both ≤1.25 CSS px. Refinement settles at `[0.75,0.25]×4`, with 8 replies, final target 0.25 CSS px, no pending replies and `maxLineVertexCount=114`. The final pan leaves the same-bucket refinement state unchanged.

Targeted Chromium passed 1/1 (1.4 min); the complete viewport Chromium file passed 8/8 (3.9 min); seven focused CAD unit/UI tests passed 7/7; runtime TypeScript and `git diff --check` passed. The broad unit bundle was omitted because it writes existing P05/P06 evidence JSONs. Five UI subchecks ran directly without the worker-build step. Configs, logs and results are retained under `D:\codex-cad-v2-f07-spline-dpr2-195-postpan-20260925`, with distinct C: Next caches and D: temp/data; ports 43933/43934 and test processes are closed.

This test-only addition leaves compiler/cache revision `cad-v2-compiler-2026.09-v27`, pipeline `fidelity-v3-p07`, DV2SCN01 schema v1, scene worker SHA-256 `1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280`, and DWG/DXF worker SHA-256 `DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D` unchanged.

| Gate | Status after this profile |
|---|---|
| Periodic AutoCAD SPLINE fixture/runtime support and knot multiplicity oracle | OPEN |
| HATCH runtime remesh/topology | OPEN |
| Bounded spatial partition and on-demand chunk loading | OPEN |
| Remaining fill/glyph/chunk-boundary composite accounting | OPEN |
| Shader consumption of `PATH_DISTANCE` | OPEN |
| Rendered error across geometry, zoom, pan, DPR and device contexts | PARTIAL / OPEN |
| Same-source AutoCAD visual/measurement oracle | OPEN / NOT_RUN |

This result expands one synthetic DPR2 rendered-error matrix cell; it does not establish AutoCAD SPLINE or same-source AutoCAD conformance. F07 remains IN_PROGRESS at 14/19 (74%), with 5/19 (26%) packages open.
## 2026-09-25 — DPR2 rational SPLINE raster acceptance at 80% after pan

The synthetic, non-periodic rational cubic SPLINE browser acceptance now zooms out from the 195% state through 156%, 125%, 100% and 80%, then applies a real `(-10,-5)` CSS-pixel pan at 80%. At DPR2 the camera changes from `(729.6,380.8,k=4.864)` to `(719.6,375.8,k=4.864)`, leaving fit-relative offset `(+79.6,+39.8)` CSS px. The 1280×672 CSS viewport uses a 2560×1344 drawing buffer; all independent source samples remain inside bounds `[554.224,268.792]..[884.976,463.352]` CSS px.

An independent rational Bernstein oracle evaluates 4097 points and compares them bidirectionally with 1112 selected WebGL pixels. Maximum rendered-to-source distance is **0.4476090077 CSS px**; maximum source-to-render coverage gap is **0.3641466608 CSS px**, both ≤1.25 CSS px. Refinement settles at `[0.75,0.25]×5`, with 10 replies, latest target 0.25 CSS px, zero pending replies and `maxLineVertexCount=114`. The final pan remains in the same 80% bucket and leaves the settled state unchanged.

Targeted Chromium passed 1/1 (1.7 min); the full viewport Chromium file passed 8/8 (4.5 min); seven focused CAD unit/UI scripts passed 7/7; runtime TypeScript and `git diff --check` passed. The wide unit package was omitted because it writes existing P05/P06 evidence JSONs. Five UI subchecks ran directly without the worker-build step. Configs, logs and results are retained under `D:\codex-cad-v2-f07-spline-dpr2-80-pan-20260925`, with separate C: Next caches and D: temp/data; ports 43935/43936 and test Node processes are closed.

This test-only profile leaves compiler/cache revision `cad-v2-compiler-2026.09-v27`, pipeline `fidelity-v3-p07`, DV2SCN01 schema v1, scene worker SHA-256 `1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280` and DWG/DXF worker SHA-256 `DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D` unchanged.

| Gate | Status after this profile |
|---|---|
| Periodic AutoCAD SPLINE fixture/runtime support and knot multiplicity oracle | OPEN |
| HATCH runtime remesh/topology | OPEN |
| Bounded spatial partition and on-demand chunk loading | OPEN |
| Remaining fill/glyph/chunk-boundary composite accounting | OPEN |
| Shader consumption of `PATH_DISTANCE` | OPEN |
| Rendered error across geometry, zoom, pan, DPR and device contexts | PARTIAL / OPEN |
| Same-source AutoCAD visual/measurement oracle | OPEN / NOT_RUN |

This profile fills one synthetic DPR2 SPLINE zoom/pan cell only and does not claim AutoCAD conformance. F07 remains IN_PROGRESS at 14/19 (74%), with 5/19 (26%) packages open.
## 2026-09-25 — DPR1 rational SPLINE 80% zoom-out ve pan

Mevcut synthetic, non-periodic rational cubic SPLINE tarayıcı kabul testi 195% pan sonrasında 156% → 125% → 100% → 80% zoom-out ve 80% üzerinde gerçek (-10,-5) CSS px fare panıyla genişletildi. Final D3 camera (649.6608,340.8304,k=4.864), viewport 1280×672 CSS px, DPR1 drawing buffer 1280×672 ve u=0.2055921052631579 world/CSS px oldu. Tam kaynak spline bounds [484.2848,233.8224]..[815.0368,428.3824] viewport içinde kaldı.

Bağımsız rational Bernstein oracle'ı 4097 source örneğini 542 seçilmiş WebGL raster pikseliyle karşılaştırdı. Maximum rendered-to-source distance **0.7981910667 CSS px**, maximum source-to-rendered coverage gap **0.9082625171 CSS px**; ikisi de 1.25 px sınırının altında. Worker target geçmişi [0.75,0.25]×5, 10/10 yanıt, son hedef 0.25 CSS px, bekleyen yanıt 0 ve maksimum maxLineVertexCount=114. Aynı-bucket son pan worker refinement durumunu değiştirmedi.

**Testler:** hedef Chromium 1/1 (test gövdesi 55.7 sn), tam cad-v2-layout-viewport.spec.ts Chromium 8/8 (285.2 sn); precision-refinement, curve-refinement ve beş doğrudan UI/worker testi 7/7; runtime tsc --noEmit -p tsconfig.next.json --incremental false ve git diff --check PASS. Geniş unit paketi P05/P06 evidence JSON yazma yan etkisi nedeniyle koşulmadı. Aggregate UI komutu worker build scriptini çalıştıracağı ve üretilmiş kullanıcı worker'ını değiştirebileceği için UI testleri build adımı olmadan doğrudan çağrıldı.

**F07 kapı denetimi:** Periodic AutoCAD SPLINE fixture/runtime ve AutoCAD knot-multiplicity oracle **OPEN** (mevcut De Boor oracle'ı sentetik clamped spline'larla sınırlı); HATCH runtime remesh/topology **OPEN**; bounded spatial partition/on-demand chunk **OPEN**; kalan fill/glyph/chunk-boundary ve diğer bileşik hata muhasebesi **OPEN**; shader PATH_DISTANCE tüketimi **OPEN**; geniş geometri/zoom/pan/DPR/device rendered-error **PARTIAL / OPEN**; aynı-kaynak AutoCAD visual/measurement **OPEN / NOT_RUN**.

D günlükleri/çıktıları D:\codex-cad-v2-f07-spline-dpr1-80-pan-20260925 altında ve iki ayrı Next cache C: üzerindedir. Test portları kapalıdır. Yalnız browser acceptance testine ek yapıldı; compiler/cache revision cad-v2-compiler-2026.09-v27, pipeline fidelity-v3-p07, DV2SCN01 schema v1 ve worker SHA-256 değerleri değişmedi. Bu sentetik DPR1 hücresi genel matrisi kapatmaz. F07 **IN_PROGRESS**, plan 14/19 (%74), 5/19 paket açık.


## 2026-09-25 — DPR1 ELLIPSE 80% zoom-out + pan acceptance cell

The synthetic DPR1 ELLIPSE browser acceptance now continues from its existing 195% pan through 156% → 125% → 100% → 80%, then applies a real (-10,-5) CSS-pixel pan. Final D3 camera is `(650.48,341.24,k=4.864)`; CSS viewport and DPR1 drawing buffer are both `1280×672`; scale is `0.2055921052631579` world/CSS px. The complete analytic quarter-ellipse remains the source oracle.

The independent 4097-sample parametric source was compared bidirectionally with 299 selected WebGL pixels. Maximum rendered-to-source distance is **0.7860996134 CSS px**; maximum source-to-rendered coverage gap is **0.8713208364 CSS px**; both are below the 1.25 px bound. Refinement settled at target 0.25 CSS px with 10/10 replies and maximum line vertex count 46. The final pan produced no additional refinement reply during a 350 ms confirmation window (pending 0).

**Verification:** targeted Chromium 1/1 (82.4 s end-to-end); full `cad-v2-layout-viewport.spec.ts` Chromium 8/8 (275.5 s); seven focused CAD V2 unit/UI scripts 7/7; runtime `tsc --noEmit -p tsconfig.next.json --incremental false`; CRLF-aware `git diff --check`; and a trailing-whitespace scan of the new test block all passed. Successful logs and outputs are preserved under `D:\codex-cad-v2-f07-ellipse-dpr1-80-pan-20260925`, with separate C: Next caches and D: temp/data. A setup-only upload failure wrote a Playwright failure artifact to the default repo `test-results` folder; it remains untouched and is excluded from PASS counts.

**Gate re-audit:** periodic AutoCAD SPLINE fixture/runtime plus AutoCAD knot-multiplicity oracle **OPEN** (compiler rejects periodic source; existing independent multiplicity profiles are synthetic clamped splines); HATCH runtime remesh/topology **OPEN** (static topology and fill-precision coverage do not exercise runtime remesh); bounded spatial partition/on-demand chunk loading **OPEN** (host still fetches the complete manifest chunk list); residual fill/glyph/chunk-boundary composite accounting **OPEN** (static glyph endpoint and HATCH fill/boundary quantization terms have narrower oracles); shader `PATH_DISTANCE` consumption **OPEN** (renderer has no field consumption); general rendered error across geometry/zoom/pan/DPR/device **PARTIAL / OPEN**; same-source AutoCAD visual/measurement **OPEN / NOT_RUN**.

This is one synthetic ELLIPSE matrix cell and is not AutoCAD parity. Only the browser acceptance test was extended in this substage. Compiler revision `cad-v2-compiler-2026.09-v27`, pipeline `fidelity-v3-p07`, DV2SCN01 schema v1, public scene-worker SHA-256 `1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280`, and preserved DWG/DXF conversion-worker artifact SHA-256 `DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D` remain unchanged. F07 remains IN_PROGRESS at plan 14/19 (74%), with 5/19 (26%) packages open.


**Artifact note:** In the first failed Playwright invocation, PowerShell argument forwarding did not apply `--output`, so the failure artifact went to the repository default `test-results` path. The current output was not deleted or moved. Because no pre-run hash or backup was taken for a same-named artifact, preservation of any prior content cannot be verified retrospectively. This failed attempt is excluded from PASS counts.


## 2026-09-25 — DPR1 ARC 80% zoom-out + pan acceptance cell

The existing DPR1 synthetic quarter-circle ARC browser scenario now zooms out from its 195% pan through 156% → 125% → 100% → 80%, then receives a real (+48,+24) CSS-pixel pan. The 80% camera is `(710.0416,371.0208,k=4.864)` before pan and `(758.0416,395.0208,k=4.864)` afterward. Both CSS viewport and DPR1 raster are `1280×672`; scale is `0.2055921052631579` world/CSS px. The analytic quarter-circle remains fully visible in the measured view.

An independent analytic quarter-circle projection measured 383 selected WebGL pixels: maximum rendered-to-source distance **0.8401740575 CSS px**, maximum source-to-rendered coverage gap **0.7087218739 CSS px**, both below 1.25 px. The zoom-out refinement profile ended at `[0.75,0.25]` with a 0.25 CSS-pixel target, zero pending replies, and maximum line vertex count 46. The final same-bucket pan produced no additional refinement request.

**Verification:** targeted Chromium 1/1 (58.3 s end-to-end), full viewport Chromium 8/8 (290.5 s), seven focused CAD V2 unit/UI scripts 7/7, runtime TypeScript check (14.1 s), and CRLF-aware diff check passed. Successful logs and both initial/retry target artifacts are preserved under `D:\codex-cad-v2-f07-arc-dpr1-80-pan-20260925`; targeted retry and full Chromium used distinct C: Next caches with D: temp/data. The initial target failure was an inverted test-only zoom assertion (`k / fitScale`); it was corrected to the zoom ratio product and the retry/full run passed. No repo-default Playwright output was used in this stage.

**Gate audit:** periodic AutoCAD SPLINE fixture/runtime and AutoCAD knot oracle **OPEN** (periodic input is rejected fail-closed); HATCH runtime remesh/topology **OPEN**; host bounded partition/on-demand chunks **OPEN**; remaining fill/glyph/chunk-boundary composite accounting **OPEN**; shader `PATH_DISTANCE` consumption **OPEN**; general rendered-error across geometry/zoom/pan/DPR/device **PARTIAL / OPEN**; same-source AutoCAD visual/measurement **OPEN / NOT_RUN**. Narrower static spline-knot, HATCH, and glyph quantization tests do not satisfy those broader gates.

This adds one synthetic ARC camera cell and is not AutoCAD parity. The change is acceptance-test-only; compiler revision `cad-v2-compiler-2026.09-v27`, pipeline `fidelity-v3-p07`, DV2SCN01 schema v1, public scene-worker SHA-256 `1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280`, and preserved conversion-worker artifact SHA-256 `DD2A10B2347504387B7DC54D9DB5289C33E4F5A772C3E56AECAD79117C2F510D` remain unchanged. F07 remains IN_PROGRESS at plan 14/19 (74%), with 5/19 (26%) packages open.


## 2026-09-25 — DPR3 ELLIPSE rasterı, DPR2 WebGL buffer sınırı

Yeni Playwright kabul hücresi tests/document-studio/cad-v2-layout-viewport.spec.ts içinde sentetik non-periodic parametrik ELLIPSE'i canlı Document Studio host → scene worker refinement → renderer → WebGL canvas yolunda açtı. Browser DPR3 emüle etti; CSS viewport 1280×672, renderer'ın Math.min(devicePixelRatio, 2) sınırıyla canvas çizim buffer'ı 2560×1344, scale=device screenshot 3840×2016 oldu. Başlangıç D3 kamerası (640,336,k=6.08); gerçek (-10,-5) CSS px pan sonrası (630,331,k=6.08). World/CSS ölçeği 0.16447368421052633.

Bağımsız 4097 örnekli çeyrek elips oracle'ı 2198 WebGL pikselini iki yönde karşılaştırdı: maksimum render→analitik kaynak uzaklığı 0.7085877543321305 CSS px; maksimum kaynak→render coverage aralığı 0.258901074253901 CSS px. İkisi de 1.25 CSS px sınırının altında kaldı. Refinement [0.75,0.25] hedeflerini 2/2 yanıtladı; son hedef 0.25 CSS px, maxLineVertexCount 34; aynı-bucket pan yeni istek/yanıt üretmedi.

Doğrulama: yeni DPR3 Chromium senaryosu 1/1 PASS; tests/cad-v2/curve-refinement.test.ts ve tests/cad-v2/precision-refinement.test.ts PASS; npx tsc --noEmit -p tsconfig.next.json --incremental false PASS. Bu alt aşamada tam viewport Chromium dosyası çalıştırılmadı; eski 8/8 sonucu yeni doğrulama sayısına eklenmez. Log: D:\codex-cad-v2-f07-dpr3-clamp-20260925\logs\playwright-run-003.log; başarılı Playwright çıktısı D:\codex-cad-v2-f07-dpr3-clamp-20260925\playwright-run-003; ilk UNSAFE_TEST_DATA_DIR kurulum artifact'leri playwright-run-001 altında korundu. Test fixture verisi, test afterEach temizliğini yalnızca CAD_V2_PRESERVE_TEST_FIXTURES=1 ile atlayıp izinli Temp klasöründe tutuldu.

| F07 kapısı | Sonuç |
|---|---|
| Periodic AutoCAD SPLINE fixture/destek ve knot multiplicity oracle'ı | OPEN — periodic input compiler'da fail-closed; AutoCAD fixture/evaluator oracle yok |
| HATCH runtime remesh/topology | OPEN — statik mesh/topology testleri var; worker TRIANGLES remesh etmiyor |
| Bounded spatial partition ve on-demand chunk yükleme | OPEN — loaded bbox culling var; compiler sıra parçaları üretir, host manifest chunk listesini eager yükler |
| Kalan fill/glyph/chunk-boundary bileşik hata | OPEN — seçilmiş statik fill/glyph terimleri var, genel birleşik zarf yok |
| Shader'da PATH_DISTANCE tüketimi | OPEN — renderer attribute/shader bağlantısı yok |
| Geometri/zoom/pan/DPR/device rendered-error | PARTIAL / OPEN — sentetik eğriler DPR1/2 ve DPR3 (buffer cap 2) profillerinde; native GPU/device matrisi yok |
| Same-source AutoCAD visual/measurement | OPEN / NOT_RUN — eşleştirilmiş referans koşusu yok |

Nested/transformed BULGE bu alt aşama olarak seçilmedi: repo'da mevcut same-chord/affine ve seam-yönü testleri daha dar oracle sağlar; bu turda tekrarlanmadı. Test-only raster kabulü runtime/compiler/cache/protocol kodunu değiştirmedi; v27, fidelity-v3-p07, DV2SCN01 v1 ve render ABI sabit kaldı. F07 IN_PROGRESS, plan 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-25 — DPR3 rational SPLINE 80% zoom-out + pan

A new Chromium acceptance cell applies an 80% zoom-out and a real `(-10,-5)` CSS-pixel pan to the synthetic non-periodic rational cubic SPLINE. It drives the actual Document Studio host, worker refinement and WebGL renderer, then compares the screenshot against an independent 4097-sample rational Bernstein source oracle.

The CSS viewport is 1280×672. `devicePixelRatio=3`; the renderer clamps the WebGL drawing buffer to 2560×1344 (2× CSS), while `{scale:"device"}` screenshot dimensions are 3840×2016. Camera state is fit `(640,336,k=6.08)`, 80% `(640,336,k=4.864)`, and after pan `(630,331,k=4.864)`. Thus `unitsPerCssPixel=0.2055921052631579`.

The bidirectional comparison selected 3273 WebGL pixels: maximum render-to-source distance **0.6668573448 CSS px** and maximum source-to-render coverage gap **0.2322079741 CSS px**, each ≤1.25 px. Refinement targets were `[0.75,0.25,0.75,0.25]`, with 4/4 replies, final target 0.25 px, no pending reply and `maxLineVertexCount=96`. The final same-bucket pan did not enqueue further refinement.

**Verification:** targeted Chromium 1/1 passed (test body 42.0 s; run total 59.8 s); `node --import tsx tests/cad-v2/curve-refinement.test.ts` passed; `node --import tsx tests/cad-v2/precision-refinement.test.ts` passed; runtime `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.next.json --incremental false` passed; `git -c core.whitespace=cr-at-eol diff --check` passed. The full viewport file was not rerun in this checkpoint. A first config invocation targeted port 3000 instead of its isolated server and failed before `signInAdmin` reached the test; its artifacts remain under `playwright-run-001` and are excluded from pass counts. Corrected config and successful output are under `D:\codex-cad-v2-f07-spline-dpr3-80-pan-20260925\playwright-run-002`; Next cache and preserved fixture data used unique paths.

This is a SwiftShader synthetic rational spline raster cell, not an AutoCAD or native-GPU oracle. It adds coverage to the broader rendered-error matrix; that gate remains **PARTIAL / OPEN**. The six-item F07 plan-bullet estimate is 2 PASS + 4 PARTIAL; at half credit for each partial group, internal F07 progress is **approximately 67%**. This is an explicit tracking estimate, not the external plan's 14/19 total.

| F07 final acceptance gate | Status |
|---|---|
| Periodic AutoCAD SPLINE fixture/runtime support and knot multiplicity oracle | **OPEN** — periodic input fails closed; no AutoCAD periodic fixture/evaluator oracle |
| HATCH runtime remesh/topology | **OPEN** — runtime refinement does not regenerate TRIANGLES topology |
| Bounded spatial partition and on-demand chunk loading | **OPEN** — compiler still partitions by sequence and host eagerly fetches manifest chunks |
| Remaining fill/glyph/chunk-boundary composite accounting | **OPEN** — selected static terms exist; complete composite envelope is absent |
| Shader consumption of `PATH_DISTANCE` | **OPEN** — worker transfers it; renderer does not bind/read it in a shader |
| Rendered error across geometry, zoom, pan, DPR and device contexts | **PARTIAL / OPEN** — this adds one DPR3 low-zoom SPLINE cell under SwiftShader, not native-device/full-family coverage |
| Same-source AutoCAD visual/measurement oracle | **OPEN / NOT_RUN** |

F07 remains **IN_PROGRESS**. Overall plan count remains 14/19 (74%), with 5/19 (26%) packages open.


## 2026-09-25 — PATH_DISTANCE shader tüketimi: iki-terimli hairline profili

Yeni rendered-path kabulü, CPU tarafından kesik parçalara ayrılmayan açık düz LWPOLYLINE centerline'ında path-distance shader fazını sınar. Source polyline segment uzunluğu 31, linetype `[24,-16]`, derlenmiş shader uniform'ları dash 24 / gap 16 world unit'tir. PATH_DISTANCE `[0,31,31,62,62,93,93,124,124,155,155,184]` değerleri tek chunk ve 6 chunk'ta eşleşti. Three r172 `LineDashedMaterial`, her line vertex'ine eşlenmiş `lineDistance` attribute'u tüketti; WebGL framebuffer beş dash run ve `97,97,98,97` px boşluklar verdi. Tek/çok chunk screenshot SHA-256 aynı.

Bu bir sagitta veya curve rendered-error ölçümü değildir. Runtime compiler/cache v28, pipeline p08, render ABI v2; binary schema v1. Periodic AutoCAD spline, Hatch fill runtime, full composite/error matrix ve same-source AutoCAD kabul kapıları açık kalır. PATH_DISTANCE shader kapısı yalnız `[dash,-gap]` hairline LINE/açık düz LWPOLYLINE kapsamına ilerledi: **PARTIAL / OPEN**.


## 2026-09-25 — DXF periodic SPLINE source fields / synthetic knot oracle

The pair reader preserves SPLINE group-70 flags, group-71 degree, declared group-72/73 counts, group-40 knots, group-41 weights and WCS controls 10/20/30 by group-5 handle. ASCII and AcDbDxfFiler-generated binary synthetic profiles decode identically. Degree 0 remains visible rather than becoming cubic. Independent degree-3 De Boor checks active-domain closure <1e-8 world units, continuity around knot 4 <1e-5, multiplicity 2/3, counts and cyclic control tail. Production periodic tessellation remains unsupported and fails closed (no points, invalidInput, errorBoundMet=false, degraded/CURVE_GEOMETRY_INVALID). No AutoCAD-authored periodic fixture was produced; source parity remains OPEN/NOT_RUN.

Separate targeted Chromium rerun: synthetic DPR1 ARC, 1280×672 canvas, 80% then (+48,+24) CSS px pan; camera (710.0416,371.0208,k=4.864) → (758.0416,395.0208,k=4.864). Across 383 WebGL pixels, max render-to-source 0.8401740575 CSS px and source-to-render 0.7087218739 CSS px (≤1.25); worker target 0.25, pending 0, max line vertices 46. This is not periodic SPLINE raster evidence.

Verification: periodic SPLINE, precision-refinement, geometry-curves-hatch (8/8), chunk-error-accounting, cache-identity, layout-viewport (9/9 + DWG XCLIP), targeted Chromium (1/1), runtime tsconfig.next typecheck and CRLF-aware diff check PASS. D:\codex-cad-v2-f07-periodic-spline-acad-20260925 stores logs/artifacts; unique C: Next cache and separate D: Playwright output were used.

Correction to the historical gate snapshot: its statement that the renderer did not consume PATH_DISTANCE predates the limited two-term straight hairline shader path documented below. Current status is PARTIAL/OPEN: supported positive-dash/negative-gap LINE and open straight widthless LWPOLYLINE bind PATH_DISTANCE to Three lineDistance; broad patterns, widths, bulges and reset semantics remain uncovered.

F07 internal estimate remains approximately 67% (2 PASS + 4 PARTIAL / six top-level groups, half credit per partial); overall plan 14/19 (74%), five open. Remaining gates: AutoCAD periodic fixture/runtime parity; HATCH remesh/topology; bounded partition/on-demand chunks; residual fill/glyph/chunk-boundary composite; broad PATH_DISTANCE (PARTIAL/OPEN); general geometry/zoom/pan/DPR/device error matrix (PARTIAL/OPEN); same-source AutoCAD visual/measurement (OPEN/NOT_RUN).


## 2026-09-25 — PATH_DISTANCE shader subprofile rerun

The limited straight hairline shader path was rerun from current code. linetype-phase.test.ts passed 12/12 and the focused Chromium test passed 1/1. For a 184-unit path split at 31-unit source edges with 24 dash / 16 gap, PATH_DISTANCE was [0,31,31,62,62,93,93,124,124,155,155,184]. One-chunk and six-chunk WebGL frames had the same five dash runs, gaps 97/97/98/97 px, and SHA-256 98878ef260eb93722877a39be4a72bc188dbbbfda24b36f83d1680980941e0a8. This verifies only the supported two-term straight hairline profile; broad PATH_DISTANCE semantics remain PARTIAL/OPEN. Evidence: D:\codex-cad-v2-f07-periodic-spline-acad-20260925\playwright-run-004.

This gate improvement does not change the F07 internal estimate: approximately 67% (2 PASS + 4 PARTIAL across six top-level groups); the overall plan remains 14/19 (74%), five packages open.


## 2026-09-25 — F07 periodic SPLINE runtime-refinement checkpoint

| Profile | Internal knot multiplicity | Spans | Segments | Reported bound (world) | Max De Boor sample error (world) |
| --- | --- | ---: | ---: | ---: | ---: |
| F071 | [1,1,1] | 4 | 64 | 0.0254002531 | 0.0188605073 |
| F074 | [2,1,1] | 4 | 64 | 0.0441743528 | 0.0326871951 |
| F075 | [3,1,1] | 4 | 50 | 0.0488367179 | 0.0364017865 |
| F077 rational | [1,1,1] | 4 | 60 | 0.0482628757 | 0.0361926659 |

Synthetic periodic DXF SPLINE runtime refinement is now enabled for a bounded profile: degree 1–8, positive finite weights, cyclic control/weight tail, and closed active knot interval. Open/non-cyclic seams and degree 9+ fail-closed; non-periodic knot insertion is unchanged. This supersedes the earlier blanket periodic rejection only for these synthetic profiles.

Independent De Boor oracle: four 4-span profiles (F071/F074/F075/F077), 12,001 samples each (48,004 total), target 0.05 world units. Max errors 0.0188605 / 0.0326872 / 0.0364018 / 0.0361927; reported bounds 0.0254003 / 0.0441744 / 0.0488367 / 0.0482629. Simple/double/triple internal multiplicity and rational weights were included. Chromium worker refined 6 source segments to 64; bound met, stale generation dropped, LRU inline fallback passed, Float32 output 3,472 bytes.

Periodic AutoCAD-authored fixture/parity and periodic raster comparison are still missing: this gate remains PARTIAL/OPEN. A separate DPR3, 80%-zoomed-and-panned UI raster regression tested a non-periodic rational SPLINE only (3,273 pixels; render→source 0.666857 CSS px, source→render 0.232208 CSS px), so it does not close periodic or general runtime raster acceptance.

Current compiler/cache revision cad-v2-compiler-2026.09-v30; pipeline fidelity-v3-p08; DV2SCN01 schema v1 and three172-cad2d-v2 render ABI unchanged. Unit package exited 0, periodic unit and real-browser worker tests passed, runtime tsc --noEmit -p tsconfig.next.json --incremental false passed. Logs retained in D:\codex-cad-v2-f07-periodic-runtime-20260925. F07 remains IN_PROGRESS, internal estimate ~67% (2 PASS + 4 PARTIAL across 6 groups); plan 14/19 (74%), 5 packages open.


## 2026-09-25 — F07 nested affine BULGE DPR2 rendered-error checkpoint

A new real-host rendered-error cell covers a nested LWPOLYLINE BULGE transformed through two INSERTs: inner non-uniform scale/rotation plus outer mirrored non-uniform scale/rotation. The production scene compiler emits the BULGE source sidecar; a separate analytic oracle derives the circular arc from endpoints and DXF bulge `b=1`, then applies the two affine transforms independently to 4,097 source samples.

At DPR2, CSS viewport 1280×672 and WebGL buffer/device screenshot 2560×1344, the browser zoomed out to 80% and panned +24,+12 CSS px. One BULGE ref was present; worker targets were [0.75,0.25,0.75,0.25], all four replies arrived, the final target was 0.25 CSS px and no replies remained pending after pan. Across 3,105 selected raster pixels, maximum rendered→source error was 0.5856469647 CSS px and source→rendered coverage gap was 0.4652905302 CSS px (both ≤1.25 px). Maximum line vertex count was 98.

Targeted Chromium passed 1/1; affine/composite chunk-accounting and analytic worker-refinement unit tests passed; runtime tsconfig.next typecheck passed. Test-inclusive whole-repo tsconfig.json remains exit 2 due other current test-file typing errors; the new spec has no remaining diagnostics. Artifacts/logs/config and compiled fixture are retained at `D:\codex-cad-v2-f07-nested-bulge-raster-20260925`.

This closes only a synthetic SwiftShader raster cell. The broad geometry/zoom/pan/DPR/device rendered-error gate remains PARTIAL/OPEN, as do same-source AutoCAD and native-device checks. Compiler/cache v30, pipeline p08, DV2SCN01 schema v1 and render ABI v2 are unchanged. F07 internal estimate remains ~67%; overall plan 14/19 (74%).

## 2026-09-26 — F07 settled 156% ARC rendered-error oracle (DPR1/DPR2)

Recovery context: this isolated 91a0 checkout is at compiler/cache cad-v2-compiler-2026.09-v30, pipeline fidelity-v3-p08, ABI three172-cad2d-v2, binary DV2SCN01 schema v1. The previously used v42/p19 worktree is empty; its R01/R02b source and untracked fixtures are not present here. This entry measures only the accessible checkout and does not reassert those lost changes.

The existing live document host, scene worker, refinement and WebGL2 ARC test now revisits 156% after its intentionally stale 156% response was rejected. On DPR1, the later 156% state settled with final target 0.25 CSS px, zero held responses and a real +48,+24 CSS px pan. D3 camera was (918.55,475.275,k=9.5); CSS canvas and screenshot were 1280x672. Independent analytic quarter-circle samples compared with 612 selected raster pixels gave maximum rendered-to-source 0.9621349720 CSS px and source-to-rendered 0.7532715925 CSS px. Visible source angle was [0.3137457750, pi/2].

On DPR2, the test returned from settled 195% to 156%, received 10/10 refinement replies with final target 0.25 CSS px, then applied a real +48,+24 CSS px pan. D3 camera changed from (753.4,392.7,k=9.5) to (801.4,416.7,k=9.5). CSS canvas was 1280x672; drawing buffer and screenshot were 2560x1344. For 1,544 selected pixels, the two maxima were 0.5933250455 and 0.4743416490 CSS px. Both DPR profiles meet the 1.25 CSS px raster envelope. These are synthetic SwiftShader profiles, not physical GPU or AutoCAD parity.

Targeted Chromium 2/2 passed, followed by DPR1 assertion retry 1/1; curve-refinement, camera-interaction and worker-refinement-browser tests 3/3 passed; runtime tsconfig.next typecheck and diff-check passed. Full test-inclusive tsconfig.json still exits 2 on existing errors, including prior Worker.postMessage typing in this spec; no diagnostic points to the added 156% blocks. First browser attempt used an unsupported absolute Next dist path; second used a disallowed D: local-data path. Both failed before the acceptance test. Successful artifacts are at D:\codex-cad-v2-r08-156-20260926-003 and -004; unit logs are at -005. Scene worker SHA-256 remained 1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280.

The 156% omission is now measured on the accessible checkout. F07 rendered-error gate remains PARTIAL: the plan also requires broader geometry, at least four zoom levels, DPR1/2/3 and native device coverage. No compiler/runtime/protocol revision changed.

## 2026-09-26 -- F07 internal R11 supported periodic SPLINE matrix

R11 supported synthetic DXF source/worker matrix is complete in the accessible 91a0 v30/p08 checkout. Existing degree-3 single/double/triple-knot and rational profiles plus seven new profiles cover periodic degree 1–8, shifted/scaled positive and negative active domains, rational weights, zero-width repeated knots, and closed endpoints. ASCII and AutoCAD binary DXF decode agree. Independent De Boor oracle sampled 28,007 points on the seven new profiles: maximum source-to-tessellation error 0.0436049487 world units against the 0.05 target. Scene binary/META carried 43/43 positive knot spans to worker refinement; independent rational Bezier oracle measured at most 0.0436046739 world units against the same target (worker target 0.5 CSS px at 0.1 world units/CSS px). Degree 9 and broken endpoint/knot/weight cycles fail closed.

## 2026-09-26 — F07 R03 direct LINE spatial partition and host viewport fetch

The prior v42/p19 worktree remained empty and unregistered. R03 was independently reconstructed against the accessible 91a0 compiler/cache v30, pipeline p08 checkout; no unavailable v42 patch or fixture was transferred. Direct top-level continuous LINE, two-term shader-dashed LINE, and CPU-expanded wide dashed LINE now enter a bounded spatial path. Centerline slices preserve source endpoints, interpolated PATH_DISTANCE and sorted source painter identity. Chunk bboxes include the existing lineweight envelope and target at most 4,096 world units per axis; the per-source slice cap is 256.

The independent compiler test used a 12,000-unit, 4-unit-width line and got three chunks; all chunk spans were at most 4,096.000001, the overlay retained later painter order, endpoints and full PATH_DISTANCE were preserved. Hairline shader dashes kept the 1,000/500 dash-gap style and both slice seams were phase-continuous. Wide CPU-expanded dashes kept their source path distance. At origin (1,000,000,000; 1,000,000,000), three local-coordinate chunks reconstructed exact tested endpoints and aggregate bbox [999,999,999.5; 999,999,999.5; 1,000,012,000.5; 1,000,003,000.5].

A 1,100,000-unit line would require 269 slices. The bounded partial contract retains that source primitive in one chunk, emits DIRECT_LINE_SPATIAL_PARTITION_LIMIT_REACHED and marks scene quality degraded. This bounds chunk count and avoids dropping geometry; it explicitly does not promise a <=4,096-unit bbox or the normal local Float32 precision envelope for that fallback.

Host fetch now filters by active layout and the camera world viewport at initial load, debounces camera-triggered requests by 120 ms, and loads newly visible chunks after zoom/pan or layout selection. A real host UI Chromium route test observed the near chunk requested initially, the far chunk withheld, then the far chunk requested once after zoom made it visible. Focused DASHED WebGL acceptance also reran: one versus six chunks produced equal run positions, gaps [97,97,98,97] px and framebuffer SHA-256 264758117837085532fc5ad17b5f5b9ff469b550ccf1a0dd14e68d678545b.

Verification: direct-line-spatial-partition.test.ts (24 assertions), painter-order.test.ts, chunk-scheduler-cache.test.ts, layout-viewport.test.ts (9/9), three focused Chromium cases (viewport fetch, layout selection, PATH_DISTANCE chunk invariance; 1/1 each), and runtime tsconfig.next typecheck all passed. The full unit/release suite was not rerun. Compiler/cache revision is v31 because serialized chunk output and diagnostics changed; pipeline p08, DV2SCN01 v1 and render ABI v2 remain. Scene-worker bundle SHA-256 remains 1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280.

R03 is complete at its package scope on this checkout. The seven terminal F07 acceptance gates remain 0/7 fully PASS; R04–R11, the broad composite/rendered-error and native-device/AutoCAD gates remain open. Overall plan remains at its last documented 14/19 packages (5 open).

## 2026-09-26 — F07 R04 direct non-LINE stroke spatial chunks

R04 extends the ordered spatial compiler path to long direct CIRCLE, ARC, ELLIPSE, SPLINE and widthless LWPOLYLINE/BULGE strokes. Short sources remain in their prior sequence runs. Each eligible source is scanned in original painter order; chords are packed into at most 4,096-world-unit bbox spans including stroke padding. Long straight polyline edges are sliced with global PATH_DISTANCE interpolation. Analytic chord sidecars remain intact, so the worker receives the original curve intervals without duplicating rational SPLINE spans.

Independent high-origin (1e9, -1e9) cases yielded 4 CIRCLE, 3 ARC, 3 ELLIPSE and 3 SPLINE spatial chunks. Each tested bbox was <=4,096.00001 world units and encoded XY remained <4,096 local units. Binary CURVE_DATA/META source handles and types survived every chunk and the bounded worker accepted each interval. A BULGE plus 12,000-unit straight continuation retained monotone global PATH_DISTANCE through seams; a later LINE overlay remained after the curved source in painter order.

The source-level estimate caps spatial work at 256 chunks. A 1,100,000-unit polyline edge, a 600,000-radius CIRCLE and a 299-edge oscillating polyline remained whole in bounded fallback chunks; all reported NON_LINE_STROKE_SPATIAL_PARTITION_LIMIT_REACHED and degraded quality. That fallback retains geometry and analytic sidecars but does not claim the normal 4,096-unit local precision envelope.

Verification: the new non-line-stroke-spatial-partition.test.ts, the updated direct LINE and chunk-error-accounting tests, the complete check:cad-v2:unit chain, runtime tsconfig.next typecheck, and the real host viewport-fetch Chromium case (1/1) passed. The full test-inclusive tsconfig.json remains a separate existing-error gate. Compiler/cache revision is v32; pipeline p08, DV2SCN01 schema v1 and render ABI v2 stay unchanged. Direct source families were tested with continuous styles; nested INSERT/viewport strokes, width meshes, HATCH, glyphs, full dash-family raster parity and same-source AutoCAD remain open. F07 terminal gates are still 0/7 fully PASS; the last documented overall plan count remains 14/19 (5 open).

## 2026-09-26 — R05 fill/glyph spatial and active paper acceptance

Direct HATCH, WIPEOUT and width-bearing LWPOLYLINE triangle meshes are packed in painter order into spatial groups when their source span exceeds 4,096 world units. Whole triangle triples retain area and topology. Direct TEXT/MTEXT/ATTDEF/ATTRIB glyph strokes use the ordered stroke path. Indivisible oversized triangle/glyph and >256 groups retain geometry, set degraded quality and emit separate FILL_SPATIAL_PARTITION_LIMIT_REACHED or GLYPH_STROKE_SPATIAL_PARTITION_LIMIT_REACHED; those exceptions cannot claim the normal local precision envelope.

Four separated 100×100 HATCH islands retained 40,000 square units; a 12,000×20 width-bearing LWPOLYLINE retained 240,000 square units and 12 triangles. High-origin (1e9,-1e9) TEXT/MTEXT yielded ordered bounded chunks with local XY below 4,096. Oversized glyph, HATCH/WIPEOUT triangles and 299-edge fill cap preserved geometry with partial diagnostics. Fill, wipeout and later LINE painter order and Model/SHEET_A/SHEET_B layout identity survived binary encoding.

Real-host Chromium active-paper fetch passed 1/1: initial Model, SHEET_A near fill, its far glyph only after zoom, and SHEET_B glyph only after selection; each fetched once. Targeted tests, full check:cad-v2:unit and runtime tsconfig.next passed. Full test-inclusive tsconfig.json retains repository errors. Compiler/cache v33; pipeline p08, DV2SCN01 schema v1, render ABI v2. Nested INSERT/viewport-projected fill/glyph, native raster/device and same-source AutoCAD remain open. F07 terminal gates 0/7 fully PASS; last documented plan 14/19 (5 open).

## 2026-09-26 — R06 static fill/glyph and chunk-boundary composite

The compiler now reports two conservative static interaction envelopes. For overlapping fill and direct TEXT/MTEXT/ATTDEF/ATTRIB glyph geometry in one chunk, maxFillGlyphCompositeErrorWorld sums the fill source-boundary plus triangle encoding bound and the glyph stroke endpoint encoding bound. For spatially overlapping adjacent painter chunks, maxAdjacentChunkCompositeErrorWorld sums each chunk's strongest static geometry/encoding bound, including HATCH fill and curved stroke terms. Both convert to active-view CSS pixels once and trigger CHUNK_COMPOSITE_PRECISION_LIMIT_REACHED plus degraded quality when the requested target is crossed. Flat manifest and hash-index fields are validated as finite, non-negative and mutually consistent. Compiler/cache v34; pipeline p08, DV2SCN01 v1 and render ABI v2 unchanged.

The independent binary oracle used four touching HATCH rectangles at a 1e9 origin. Decoded triangle vertices matched known rectangle corners; adjacent fill composite was 2.384185791015625e-7 world units. A sliced rotated glyph yielded 0.00008489787140318244; a wide fill followed by overlapping glyph yielded 1.1920928955078125e-7 at the painter chunk boundary. In a single chunk, decoded fill corners and glyph endpoints summed to 0.000028610479930766117 world units. Dynamic 0.25 CSS-pixel profiles made each individual fill/glyph encoding term fit while the sum crossed the target and degraded the scene. Disjoint same-chunk fill/glyph remained at zero. The new targeted test, full CAD V2 unit chain and runtime tsconfig.next passed; test-inclusive tsconfig.json retained 212 existing diagnostics and none in R06 files.

This is the R06 static compiled-geometry package. Non-adjacent overlapping chunks, nested/viewport glyph provenance, font outline/source fidelity, worker remesh and actual WebGL/device pixels remain outside this measured envelope. F07 terminal gates remain 0/7 fully PASS; last documented plan count remains 14/19 (5 open).

## 2026-09-26 — R07 multi-term PATH_DISTANCE shader subpackage

Straight hairline LINE and open straight widthless LWPOLYLINE with PLINEGEN now retain finite nonzero positive dash/negative gap patterns of 2–12 terms in ordered command metadata. The existing two-term dash/gap case still uses Three LineDashedMaterial; other eligible patterns use a path-distance ShaderMaterial with a complete signed period. The renderer copies the binary PATH_DISTANCE scalar per vertex, keeps painter grouping keyed by the exact pattern, and updates shader color on background/monochrome changes. Dot (zero-length), wide and closed-polyline profiles stay on explicit CPU geometry paths. Compiler/cache v35; pipeline p08, DV2SCN01 schema v1 and render ABI v2 unchanged.

A 12,000-world-unit high-origin CENTER LINE spanned three bounded chunks with continuous cumulative PATH_DISTANCE. The same open polyline emitted [0,31,31,62,62,93,93,124,124,155,155,184] for one and six chunks. Four-term CENTER, six-term PHANTOM and a leading-gap pattern retained identical signed metadata and phase. Real Chromium/WebGL2 CENTER output yielded eight visible red runs for both one- and six-chunk scenes, identical run intervals and screenshot SHA-256 f648aab259891d658e1b861175b5e26f5617d9a9c33fd5dd8a58307e72958b6a. Existing two-term DASHED yielded five runs and identical one/six-chunk SHA-256 264758117837085532fc5ad17b5f5b9ff469b550540ccf1a0dd14e68d678545b. Browser 1/1, targeted linetype 12/12 gates, new source/binary test, full CAD V2 unit chain and runtime typecheck passed. Full test-inclusive tsconfig.json retained 212 existing diagnostics and none in R07 files.

R07 remains PARTIAL: curved/bulged, closed, dot, wide, complex text/shape and model/paper/mirrored scale profiles have not gained a broad rendered oracle or shader phase proof. CPU fallback does not establish AutoCAD appearance parity. F07 terminal gates remain 0/7 fully PASS; last documented overall plan count remains 14/19 (5 open).

## 2026-09-26 — R07 analytic bulge/closed/dot CPU phase subpackage

A dashed ARC/CIRCLE zero-length dot term now emits a finite 0.001×effective-scale tangent segment instead of an invisible zero-length WebGL line. Widthless dashed LWPOLYLINE with bulge uses each source bulge's analytic center/radius/sweep and true arc length for phase, then continues over straight and closed edges. PLINEGEN=false still resets at each source vertex. Compiler/cache v36; pipeline p08, DV2SCN01 schema v1 and render ABI v2 unchanged.

A new source/binary test found eight finite tangent dots, verified first and following bulge dash boundaries at 10 and 20 world units despite a coarse curve error budget, and matched all 40 PATH_DISTANCE vertex values for single versus one-primitive chunks. Real Chromium/WebGL2 rendered the curved, closed dash-dot fixture with 846 red pixels; one versus 36 chunks produced identical screenshot SHA-256 d584869b256c65a8a056c849a2767bda0389e58627e35c51fa39180dfd31977a (browser 1/1). The existing straight DASHED and CENTER hashes stayed identical. New test, full check:cad-v2:unit, runtime tsconfig.next and scoped diff check passed.

R07 remains PARTIAL: dot pixel placement versus native CAD, wide strokes, complex linetype shape/text elements, model/paper/mirrored scale matrix and same-source AutoCAD remain open. F07 terminal gates remain 0/7 fully PASS; last documented overall plan count remains 14/19 (5 open).

## 2026-09-26 — R07 wide DASHED initial lineweight and chunk acceptance

The CAD V2 settings panel defaults lineweight to on, but the renderer previously started with lineweight off. The host now applies the current setting when the renderer becomes ready; the panel toggle also has an accessible name and pressed state. This host-only change does not alter scene bytes or compiler/cache v36 (pipeline p08, DV2SCN01 schema v1, render ABI v2).

A new binary oracle covered 0.13/0.25/0.50/1.00 mm LINE source weights at entity linetypeScale 2: every width produced CPU-expanded PATH_DISTANCE [0,48,80,128,160,184] with identical single and one-primitive chunk values and no shader dash metadata. Real Chromium/WebGL2 wide 4-world-unit DASHED output had 16,728 red pixels and identical full screenshot SHA-256 542a811b1f6f96ce6cfef7ef57e5f870913a7a9992579febe1fd7297178b1fd1 for one versus five chunks. Turning lineweight off left 1,387 red pixels; turning it on restored 16,728 pixels and the same red-pixel position checksum 4205881069. Full PNG bytes changed after panel interaction despite equal red coverage, so toggle return is accepted by color-mask position/count rather than whole-PNG hash. Targeted Chromium 1/1, new source/binary test, full CAD V2 unit chain, runtime tsconfig.next and scoped diff check passed. Test-inclusive tsconfig.json still exits 2 with 160 diagnostics outside newly added wide test and modified test block.

R07 remains PARTIAL: native lineweight/CAD styling, complex shape/text linetypes, model/paper/mirrored context and same-source AutoCAD remain open. F07 terminal gates remain 0/7 fully PASS; last documented overall plan count remains 14/19 (5 open).

## 2026-09-26 — R07 mirrored INSERT and paper viewport LINE phase subpackage

The visitor now tessellates dashed LINE in source coordinates before applying a nested INSERT transform. A negative X scale of 2 therefore maps each source 10-unit dash to a mirrored 20-unit visible dash. The visitor and scene compiler carry source PATH_DISTANCE through INSERT/XCLIP and viewport projection; clipped endpoints interpolate source phase, and zero-length viewport boundary contacts are omitted. Direct paper LINE still uses its own entity linetypeScale. Compiler/cache v37; pipeline p08, DV2SCN01 schema v1 and render ABI v2 unchanged.

Independent source/binary acceptance: mirrored LINE yielded five intervals with transformed X [200,180], [160,140], [120,100], [80,60], [40,20] and source distances [0,10] through [80,90], equal at one/five chunks. A 2x paper viewport clipped the same source to three intervals X [40,60], [80,100], [120,140] with source distances [20,30], [40,50], [60,70], equal at one/three chunks. A direct paper LINE with entity scale 2 retained shader dash/gap 20/20 and path [0,100]. Real Chromium/WebGL2 one/many chunk screenshot hashes matched: mirror 1,211 red pixels and SHA-256 83e43d3d4e60d03c657e3f234ec2564f5944872a8022f3472e4e2b58567db29d; viewport 727 pixels and SHA-256 19c69e2f1519eded7109059a5c18d58d9a7bd5ef74c6179b38fd42ed7bc44efc. Browser 1/1, targeted oracle, full CAD V2 unit chain, runtime tsconfig.next and scoped diff check passed. Test-inclusive tsconfig.json remains exit 2 with 160 existing diagnostics and none in the new R07 test or edited compiler files.

This closes the measured dashed LINE mirror/viewport profile only. Nonuniform curved/width geometry, global/annotation linetype scales not present in canonical input, complex shape/text elements and same-source AutoCAD remain open. R07 stays PARTIAL; F07 terminal gates remain 0/7 fully PASS and last documented overall plan count remains 14/19 (5 open).


## 2026-09-27 — R07-E complex linetype decode evidence

DXF adapters now build the canonical LTYPE table from both the database table and direct group pairs. The direct reader preserves embedded element flags, shape number, style handle, scale, rotation, offsets and text for ASCII and binary DXF; this compensates for @mlightcad/data-model 1.14.2 skipping those groups. The DWG adapter maps LibreDwg `tables.LTYPE.entries`, including pattern element metadata. Custom dash/gap/dot sequences are retained by `resolveEntityLinetype`; complex glyphs are explicitly diagnosed as not rendered, so this is partial decoder coverage rather than R07-E acceptance.

The independent synthetic profile produced `[5, -2, 0, -1]`, total pattern length 8, and matching source metadata after ASCII and binary DXF decode. The scene manifest retained `UNSUPPORTED_COMPLEX_LINETYPE_ELEMENT`, status `degraded`; resolver returned `isContinuous=false`. R001 exposed eight canonical linetypes, but libredwg also logged error code 68 (UNHANDLEDCLASS|VALUEOUTOFBOUNDS). This establishes that table entries reached the adapter, not lossless full-file decode. Focused test, existing F03 linetype suite, cache identity test and scoped TypeScript check passed on 2026-09-27. Native AutoCAD and embedded glyph raster comparison were not run.

Compiler/cache revision advanced v37→v38 because canonical table transport and scene diagnostics affect compiled output and cache identity. Pipeline p08, schema 1 and render ABI v2 remain unchanged. F07 remains 0/7 fully accepted; overall 14/19 remains a historical count, with five packages open.

Source/fixture hashes: `tests/cad-v2/complex-linetype.test.ts` EC209F51EC577FB77C0BEEE171E8C80F3B16188715010D060D35B0359340DEBF; `known-geometry-measurements.dxf` DDFC5AE7D57860B35B4EC66A653D247E6A9DFAD658E739ECC132EFB2EB6B0DD9; R001 DWG 17A92CB544830845FC59717ABCC22D3CDCF97C12B8450602C9C70EC4A507F086. Next: implement actual shape/text linetype glyph geometry and phase-aware rendering, then compare the same profile in AutoCAD.

### 2026-09-27 — R07-E STYLE source mapping update (still partial)

DXF/DWG STYLE records now reach canonical `textStyles` with file names, sizing/obliquing/flags and source handles; shape-file records are distinguished and unnamed records retain a handle key. The synthetic LTYPE oracle uses group 74 bit 2 for text and bit 4 for shape, and confirms DXF element style handles exist in the decoded table. R001 mapped 12 styles but still emitted libredwg error 68; this is not promoted to clean DWG acceptance. `UNSUPPORTED_COMPLEX_LINETYPE_ELEMENT` remains active and scene quality remains degraded until glyph geometry is produced.

Current checks passed: `complex-linetype.test.ts`, `decoder-field-contract.test.ts` (R001, code 68 logged), `font-style-layout.test.ts`, `linetype-phase.test.ts`, `cache-identity.test.ts` and scoped TypeScript. The mapper now excludes LibreDwg's zero-valued default shape/text fields; a one-off post-fix parse of the three project DWGs yielded 14/6/8 LTYPE records with zero complex metadata/warnings, while errors 64/68 remain in two inputs. Compiler/cache v40; pipeline p08/schema 1/ABI v2 unchanged. F07 stays 0/7; R07-E remains partial. Open at that checkpoint: complex-dash handle recovery, SHX/text/shape geometry, phase/chunk rendering and independent raster/native comparison. The following v41 entry records the adapter bridge; no positive populated complex-dash DWG or `.shx`/`.lin` resource is available in this checkout.

### 2026-09-27 — R07-E native DWG STYLE-reference path and placement fixture

`dwg-linetype-style-refs.ts` reads each native LTYPE dash `style` reference before `dwg_free`, resolves it through `dwg_ref_get_id`, and accepts the handle only when it exists in the converted STYLE table. The resolved handle is attached to the corresponding converted pattern element without overriding a direct converter value. This addresses the pinned converter's `styleObjectId` TODO but is not a populated complex-DWG reference acceptance: the available DWGs contain no such dash, and the R001 source still reports libredwg error 68.

The standalone synthetic DXF `r07-complex-linetype-placement.dxf` now carries documented shape and text element fields together with scale, rotation, offsets and STYLE references. ASCII/binary DXF, mocked native-reference join, actual R001 decode path, F03 linetype gates, cache identity and scoped TypeScript checks passed. The text STYLE points to missing `simplex.shx`; no glyph scene geometry, raster output or AutoCAD comparison is claimed. Compiler/cache v41; p08/schema 1/ABI v2. F07 remains 0/7 fully accepted.

### 2026-09-27 — R07-E straight LINE complex glyph geometry (compiler/cache v42)

The compiler now resolves each complex dash STYLE handle against canonical `textStyles`, lays out exact SHX shape strokes with `ShxFont.getLayoutCharShape`, and lays out embedded TEXT with the existing `FontLayoutEngine`. Source pattern index/cycle distance, effective linetype scale, element scale, offsets and group 74 absolute-versus-relative radians rotation determine glyph placement. Direct LINE compilation and the INSERT/viewport `EntityVisitor` emit the glyph segments as regular ordered strokes, preserving phase through the existing spatial chunk flow. Numeric dash/gap/dot geometry remains independent.

The decoder no longer declares every shape/text entry unsupported without considering the available font. At compile time a missing STYLE/font/shape, invalid embedded payload or cap overflow produces `UNSUPPORTED_COMPLEX_LINETYPE_ELEMENT` and degraded scene quality. An exact synthetic SHX shape and exact bundled Arial text profile produce geometry without that unsupported diagnostic; the provided placement fixture still correctly degrades because its `simplex.shx` is absent.

Verification: `complex-linetype.test.ts` checks ASCII/binary source fields, missing-font degradation, exact shape+text geometry, group 74 absolute/relative orientation, repeated source placement around a 4096-unit chunk seam, and mirrored INSERT. `path-distance-multiterm.test.ts`, `transformed-dash-phase.test.ts`, `cache-identity.test.ts` and scoped TypeScript compilation passed. Full `npx tsc --noEmit --incremental false` exits 2 on existing unrelated repository script/test diagnostics; no matching diagnostics were reported for the changed CAD source/test files. No real complex-DWG dash reference, SHX asset, curved-source glyph profile, or AutoCAD raster/measurement evidence is available. Therefore R07-E remains partial and F07 terminal gates remain **0/7**.

## 2026-09-27 — R07-E curved-source source-distance checks (v43)

The curved fixture keeps the acceptance metric in source units: a radius-50 quarter ARC places the second 15-unit symbol at angle 0.3 rad; a radius-50 CIRCLE emits 21 unique stations for the 15-unit repeat; and a bulge-1 edge from (0,0) to (100,0) places the next symbol after exactly 15 of its 50π arc units. `PLINEGEN=1` carries the cycle over a two-edge vertex; `PLINEGEN=0` restarts it per edge. A radius-4200 CIRCLE compiles across multiple spatial chunks; total encoded glyph strokes equal the source helper's expected count and the no-glyph baseline, proving glyphs were neither omitted nor duplicated by chunk partitioning. A nested mirrored ARC adds the same number of strokes as the source-space result.

Current tests: `complex-linetype.test.ts`, `analytic-bulge-dash.test.ts`, `path-distance-multiterm.test.ts`, `transformed-dash-phase.test.ts`, `direct-line-spatial-partition.test.ts`, `non-line-stroke-spatial-partition.test.ts`, `cache-identity.test.ts`: PASS. Scoped TypeScript check for changed compiler/visitor/helper/version and both touched tests: PASS. Direct-line spatial test now compares the scene's compiler version to `CAD_V2_COMPILER_REVISION`; its former v37 expectation was stale and failed before correction.

Compiler/cache identity is v43. The exact distance/tangent oracle in this entry covers circular ARC/CIRCLE and bulge; ELLIPSE/SPLINE follow their source compiler tessellation. These are local synthetic checks, not native drawing acceptance. R07-E and G5 remain partial; F07 terminal gates remain 0/7. Positive DWG complex STYLE reference, deployed SHX, and same-source AutoCAD evidence remain open.

## 2026-09-27 — R07-F affine curve source, INSERT chunks and viewport (v44)

The accepted local affine source list is fixed for this profile: `ARC`, `CIRCLE` and `LWPOLYLINE` bulge arcs station symbols by analytic source arc length/tangent; `ELLIPSE` and `SPLINE` station symbols on the compiler-bounded tessellated source path. Exact synthetic SHX glyphs are built in that source frame and each segment endpoint is checked after a two-level INSERT matrix: inner non-uniform scale/rotation, outer reflected non-uniform scale/rotation. The composed matrix includes the resulting shear. Test comparison subtracts the same visitor output with complex glyphs removed, then compares every remaining glyph endpoint pair against the source glyph geometry transformed through that matrix.

The large nested radius-4200 CIRCLE showed that scene compilation grouped spatial ranges only for top-level CIRCLE/ARC/etc.; expanded INSERT descendants were never marked spatially eligible as a group. v44 now treats an expanded INSERT's source-ordered line strokes as one bounded partition candidate when their aggregate span exceeds 4096 world units. Existing range counting/cap and degraded fallback still apply. Test asserts multiple Model chunks and that the complex-glyph stroke delta equals the source helper count. A paper viewport scene and same-source no-glyph baseline assert the same glyph delta after model-to-paper projection.

Current checks: `complex-linetype.test.ts`, direct and non-line spatial partition, transformed dash phase, painter order, entity instance parity, block expansion budget, cache identity, runtime `tsconfig.next` typecheck, and strict TSC for the touched test all PASS. The complex integration test reproduced the nested single-range issue before the v44 fix and passed after it.

These are source/binary geometry and count checks, not raster evidence. No browser/WebGL screenshot or same-source AutoCAD comparison was run. R07-F is PARTIAL pending browser raster; E's positive complex DWG/real SHX and R10 native oracle remain open. G3/G5 therefore stay partial; F07 terminal gates remain 0/7, overall plan 14/19 remains historical. Compiler/cache v44, pipeline p08, DV2SCN01 schema 1 and render ABI v2.

### 2026-09-27 — R07-F browser raster profile (synthetic exact SHX, v44)

The local browser gap is now measured with a deterministic compiler-produced curved SHAPE glyph scene. Source ARC strokes and shape glyphs pass through two nested affine INSERTs (inner non-uniform scale/rotation; outer reflection/non-uniform scale/rotation), then compile into Model and a paper viewport. The exact in-memory SHX is synthetic; no real SHX or native CAD equivalence is inferred. Both scenes compile with zero diagnostics and `qualityStatus=exact`.

Chromium compared 1 versus 52 Model chunks and 1 versus 46 paper chunks. Single/split full PNGs and red-mask pixel sets are identical per layout. Model: 1,427 pixels / checksum `2274897639` / SHA-256 `dadeb8a9a163248bf7bfab822b0ea3f6e92dcc7929b8c559900b54062804f232`. Paper: 2,512 pixels / checksum `2058749244` / SHA-256 `042215ee2da430e27c77cf528c5a507df58ae56f0d0f2ed3574864421d9d3733`. The targeted Chromium test passed (1/1); repository TypeScript and existing complex-linetype unit test also passed.

R07-F local source/affine/chunk/viewport/browser conditions are complete. G3/G5 remain partial at phase level because bounded on-demand chunk scheduling, broader cap profiles and same-source AutoCAD/native evidence remain; R07-E still needs a positive complex DWG style reference and real SHX. F07 terminal gates remain 0/7. Next local acceptance work is R07-G's scale-semantics matrix; R10 owns the native comparison.

### 2026-09-27 — R07-G global/entity and paper-viewport scale profile (v45)

**Semantics fixed before oracle changes.** Autodesk defines existing-entity effective scale as saved per-entity scale × global `LTSCALE`; `CELTSCALE` initializes new entities. `PSLTSCALE` controls whether viewport scale governs displayed dash lengths; `MSLTSCALE` is a boolean switch for model-tab annotation scale. They are not additional numeric factors. The previous Gate 5's synthetic numeric `currentLtScale`, `psLtScale`, `msLtScale` factors were removed; the accepted base formula is entity × global, with presentation context applied only where it is available and semantically defined.

**Implemented local behavior.** Canonical settings retain global and entity-default scales plus boolean paper/model mode values. DXF HEADER capture covers ASCII and binary, including MSLTSCALE absent from the installed data-model reader. DXF/DWG decode preserve header settings; direct compilation and nested visitor/INSERT paths apply LTSCALE. In paper viewport projection, PSLTSCALE=1 scales source periods by the inverse model-to-paper factor; PSLTSCALE=0 retains model-space period scaling. Paper-space entities stay in paper units under global scale.

**Oracle:** synthetic 1:10 viewport, `[10,-10]` pattern, entity scale 1. PSLTSCALE=1 produces two visible 10-paper-unit dash segments; PSLTSCALE=0 produces fifteen visible 1-paper-unit segments. Header decode (ASCII and binary) preserves LTSCALE=2, CELTSCALE=4, PSLTSCALE=1, MSLTSCALE=0 and entity group 48=3. Direct compiler metadata reports dash size 60 (`10 × 3 × 2`); nested line output halves from 20 to 10 XY vertices when LTSCALE changes 1→2 despite CELTSCALE=4.

| Verification | Result |
|---|---|
| `npx tsx tests/cad-v2/linetype-scale-settings.test.ts` | PASS — DXF ASCII/binary header + group48, direct/nested scale, PSLTSCALE viewport geometry |
| `npx tsx tests/cad-v2/linetype-phase.test.ts` | PASS — 12/12; corrected existing entity formula |
| `npx tsx tests/cad-v2/complex-linetype.test.ts` | PASS — including independently scale-adjusted projected-glyph oracle |
| `npx tsx tests/cad-v2/layout-viewport-render.test.ts` and `layout-viewport.test.ts` | PASS — renderer and parser/viewport regressions |
| `npx tsx tests/cad-v2/cache-identity.test.ts` | PASS — revision invalidates compiler cache identity |
| `npx tsc --noEmit -p tsconfig.next.json --incremental false --pretty false` | PASS — runtime TypeScript |
| `npx tsc --noEmit --incremental false --pretty false` | FAIL — whole repo reports unrelated script/test diagnostics (missing cad-review modules/exports, stale test contracts, and Worker postMessage typing); not a blanket PASS. |
| `git diff --check` scoped to touched tracked code/tests | PASS |

Autodesk primary references: [entity effective scale / CELTSCALE default](https://help.autodesk.com/cloudhelp/2022/ENU/OARX-DevGuide/files/GUID-FF5299A3-CE1C-4A4F-8FB6-B835015773A6.htm), [PSLTSCALE](https://help.autodesk.com/cloudhelp/2016/ENU/AutoCAD-Core/files/GUID-23EA4D64-AE7D-41E5-A8D0-20F060313D62.htm), [MSLTSCALE](https://help.autodesk.com/cloudhelp/2022/ENU/AutoCAD-LT/files/GUID-023B046C-56EA-463C-A867-DF713666A69E.htm).

**Remaining R07-G:** MSLTSCALE's selected annotation scale is current host/view state and is not yet carried into the scene compiler; implement after tracing that state path. Broader finite viewport/annotation-scale matrix and same-source AutoCAD validation remain open. This local profile does not close R07-G/F07 G5 or imply native parity. F07 terminal gates remain 0/7; overall 14/19 remains historical. Compiler/cache v44→v45; binary schema1, p08 and ABI v2 unchanged.

## 2026-09-27 — R07-G MSLTSCALE / etkin annotation scale (v46)

Bu yerel alt profil MSLTSCALE'ın etkin Model annotation scale factor ile etkisini sınar; R07-G, G5 veya AutoCAD eşdeğer kabulünü kapatmaz.

- DXF gerçek AutoCAD fixture'ı named CANNOSCALE 1:1 ve SCALE kaydını canonical factor 1 olarak verdi.
- Ayrı sentetik CANNOSCALE dictionary → DICTIONARYVAR → SCALE zinciri ASCII ve binary DXF'te 1:50 için paper/drawing = 0.02 verdi.
- Model global LTSCALE 2, entity group48 3 ve annotation factor 0.02 iken [10,-10] pattern dash size 1.2 oldu; MSLTSCALE olmadan önceki direct davranış korunuyor.
- Nested INSERT Model profili factor 0.5 ile 40 XY vertex üretti. Aynı MSLTSCALE ayarı paper viewport desenine taşınmadı; PSLTSCALE 0/1 oracle'ı değişmedi.
- MSLTSCALE true ama etkin factor yoksa sahne MODEL_ANNOTATION_SCALE_UNRESOLVED diagnostic'i ile degraded oldu.
- PASS: linetype-scale-settings, linetype-phase 12/12, complex-linetype, layout-viewport-render, layout-viewport, cache-identity ve tsconfig.next runtime typecheck. Repo-genel tsc bu grupta çalıştırılmadı; önceki v45 turundaki unrelated script/test tanıları tarihsel kayıttır.

Açık kalan: LibreDWG-web'in yüklü veritabanı şeması CANNOSCALEVALUE/MSLTSCALE header alanlarını ve DICTIONARYVAR/SCALE nesnelerini sağlamıyor; DWG current factorı absent kalır ve varsa etkin MSLTSCALE profili degraded gösterilir. Çoklu scale matrix, real SHX/complex DWG ve R10 native same-source kanıtı ayrı açık işlerdir.
### 2026-09-27 — R07-G active annotation-scale matrix (compiler/cache v46)

The finite synthetic active-scale profile now covers 1:1, 1:2, 1:50 and 2:1 in both ASCII and binary DXF. Each OBJECTS list contains the named active SCALE plus a differently named inactive scale. Parsed factors are passed directly into the compiler profile; for [10,-10], entity scale 3 and global LTSCALE 2, resulting Model dash/gap sizes are 60, 30, 1.2 and 120. Resolved factors retain exact quality. A zero paper-unit record or ambiguous duplicate name is unresolved; MSLTSCALE without a valid factor remains degraded with MODEL_ANNOTATION_SCALE_UNRESOLVED.

| Control | Result |
|---|---|
| npx tsx tests/cad-v2/linetype-scale-settings.test.ts | PASS — ASCII/binary finite ratio matrix, active-vs-inactive scale selection, compiler propagation, invalid/ambiguous fail-closed behavior, view refinement profile |
| Strict targeted TSC with src/types/opentype.d.ts and the updated test | PASS |
| Camera/refinement boundary | PASS — changing unitsPerCssPixel from 0.01 to 1 changes ARC tessellation but leaves dash/gap world metadata unchanged |
| Scoped runtime / repository TypeScript | NOT_RUN — production source did not change in this subgroup |

This does not assert constant on-screen pixel dash length during zoom. Current LibreDWG web schema still lacks the current active SCALE/DICTIONARYVAR fields; no DWG factor was inferred. No compiler version bump: the update is test/evidence only. F07 remains 0/7 terminal gates; overall 14/19 remains historical and is not a current global acceptance.

## 2026-09-27 — R08 emulated-DPR3 ELLIPSE at 156% with pan

The existing synthetic ELLIPSE browser profile now exercises the live Document Studio host, scene worker and WebGL canvas at emulated Chromium DPR3 through fit, 125% and 156% zoom. A real (-10,-5) CSS-pixel pan at fit scales to (-15.625,-7.8125) CSS px relative to the centered 156% camera. The renderer retains its 2× drawing-buffer cap: CSS canvas 1280×672, drawing buffer 2560×1344, and scale=device screenshot 3840×2016. This is a software/browser-emulated DPR profile, not physical DPR3 hardware.

At 156%, the D3 camera is (624.375,328.1875,k=9.5). The host requested transient/idle targets of 0.75/0.25 CSS px at both zoom steps; all 6 worker replies settled, the final target is 0.25 CSS px, and the curve has 42 maximum line vertices. An independent analytic oracle sampled 4097 source points and compared 3404 rendered pixels: maximum render-to-source error is 0.6774800229 CSS px and source-to-render coverage gap is 0.3755782579 CSS px, both under 1.25. The same run rechecked the existing fit+pan cell (2198 pixels; 0.7085877543/0.2589010743 CSS px).

Verification: targeted Playwright 1/1 PASS, 55.5 s; command and updated test SHA-256 03C45E4A2FDDC79F6C006097F5C43112B55CFC65AD31034BD20446C8F6D613EB are recorded in motor_v2/31_SOZLESME_TAMAMLAMALARI.md. The finite R08 matrix remains partial; this result does not close G6, R09 native-device measurement, or R10 AutoCAD comparison. Compiler/cache and serialized/runtime contracts are unchanged.

## 2026-09-27 — Emulated-DPR3 rational SPLINE 156% pan raster cell

The existing synthetic, non-periodic rational cubic SPLINE profile now continues from its 80% zoom-out/pan state through centered UI zooms to 100%, 125% and 156%. Each zoom settles a worker refinement with transient/idle target sequence 0.75→0.25 CSS px. At 156%, a real (+24,+12) CSS-pixel pan changes camera translation without scheduling another refinement. The camera is (620.46875,326.234375,k=9.5) before that pan and (644.46875,338.234375,k=9.5) afterward. The 80%-relative fit-center pan offset scales by 1.5625/0.8 as expected.

At emulated DPR3 the CSS viewport is 1280×672, WebGL drawing buffer is 2560×1344 (2× cap), and a device-scale screenshot is 3840×2016. The independent rational Bernstein oracle evaluates 4097 source points. At 80% after pan, 3273 blue raster pixels measured render→source 0.6668573448 and source→render 0.2322079741 CSS px. At 156% after pan, 6390 pixels measured 0.6433524477 and 0.4022573566 CSS px, respectively. Both cells satisfy the unchanged 1.25 CSS-pixel bidirectional bound; full source bounds remain visible. The 100% and 125% steps are refinement-only observations, not raster cells.

Targeted Playwright passed 1/1 in 1.0 minute; test source SHA-256 `A5F7CA4A3A02E1403ED93A79D4E96E032BA02EEAB18BC8064D176EB473D41195`. Browser DPR3 remains emulated. DPR3 ARC, complete source-family/zoom matrix, native R09 device, and R10 AutoCAD comparison remain open; G6 remains PARTIAL/OPEN and F07 terminal gate count remains 0/7.

## 2026-09-27 — Emulated-DPR3 ARC fit-pan and 195% pan raster cell

The synthetic quarter-circle ARC traverses the live host, worker refinement and WebGL renderer at emulated DPR3 with the 2× buffer cap. CSS viewport is 1280×672, drawing buffer 2560×1344, and device-scale screenshot 3840×2016. A fit-space (+48,+24) pan is measured; centered zoom steps settle at fit, 100%, 125%, 156% and 195%; a second (+48,+24) pan at 195% is measured with clipping-aware source coverage. Final camera k=11.875 at (781.75,406.875), total fit-relative pan (141.75,70.875), visible angle interval [0,1.0286029931] radians.

The independent 4097-sample oracle selects 2737 fit-pan pixels and 3514 high-zoom pixels. Fit-pan directed errors are 0.7535568878 and 0.2524335670 CSS px; 195% directed errors are 0.7321633267 and 0.2658020055 CSS px. Each direction is below the unchanged 1.25 CSS-pixel envelope. Worker refinement settles at .25 CSS px with 8/8 replies and max 46 line vertices. The 100/125/156% observations settle refinement but are not presented as independent raster measurements.

Targeted Playwright: PASS, 1/1 in 48.8 s. Source SHA-256 `568D5DC50E40E89140E6EDB025BCA7CDB2AD6275EAB62BC2DFDF54BD27C9D28E`. This closes only the selected synthetic DPR3 ARC local cells. DPR3 is browser-emulated, not physical device evidence; G6/R08 remains partial, R09 hardware and R10 AutoCAD remain open. F07 terminal acceptance stays 0/7; overall 14/19 is historical.

## 2026-09-27 — Emulated-DPR3 rational SPLINE 195% pan raster cell

The rational cubic SPLINE browser profile now continues through settled fit, 80%, 100%, 125%, 156% and 195% refinement states under emulated Chromium DPR3. At 195%, a real (+24,+12) CSS-pixel pan changes translation without adding refinement work. The final camera is (669.5859375,350.79296875,k=11.875). The viewport is 1280×672 CSS px; the device screenshot is 3840×2016 while WebGL's internal drawing buffer remains capped at 2560×1344.

An independent 4097-sample rational Bernstein oracle matched 7993 blue pixels at 195%. The projected source bounds [265.8359375,89.54296875]..[1073.3359375,564.54296875] remain fully in view. Render→source distance is 0.6696125902 CSS px; source→render coverage gap is 0.2561999628 CSS px, under the unchanged 1.25 CSS-pixel limit in both directions. The worker reached .25 CSS px with 12/12 replies and at most 114 line vertices.

Targeted Playwright passed 1/1 in 1.2 minutes; source SHA-256 `8AB8F0514FF26D17EC16C88A1A3A57D161782E602057529237E4BA0586C2C05B`. This adds one synthetic browser-emulated R08 cell. It does not represent physical DPR3 GPU/device evidence; complete G6 scope, R09 and R10 remain open. F07 terminal gate count remains 0/7 and overall 14/19 remains historical.

## 2026-09-27 — Emulated-DPR3 ELLIPSE 195% pan raster cell

The live synthetic quarter-ELLIPSE profile now measures its 195% UI zoom after a real (+24,+12) CSS-pixel pan, following the existing 156% raster cell. Final camera (644.46875,338.234375,k=11.875); emulated DPR3 uses a 1280×672 CSS viewport, 2560×1344 WebGL buffer cap and 3840×2016 device screenshot. The independent analytic oracle uses 4097 samples and observes the complete quarter interval [0,π/2] in the raster.

At 195%, 4289 pixels yield render→source 0.7001692267 and source→render 0.4022573566 CSS px, both within the unchanged 1.25 limit. Worker refinement settled at .25 CSS px, 8/8 replies, max 46 line vertices; pan schedules no additional refinement. Targeted Playwright passed 1/1 in 57.2 s; whole test-source SHA-256 `40C31D08A78F6FBE0DD747D3A8167D89749AB3E1C295DF66293D38FED45C10B`.

The first two attempts failed at a stale 156% camera assertion after a test edit placed the new 195% step in the earlier zoom loop. The test sequence was corrected and rerun; the unchanged DPR2 ARC 195% coverage loop is retained. No application code or acceptance threshold changed. This is a local browser-emulated R08 cell only; physical-device R09, residual G6 scope and AutoCAD R10 remain open. F07 terminal gates remain 0/7; overall 14/19 is historical.

## 2026-09-27 — DPR3 emulation: 125% ARC / ELLIPSE / rational SPLINE pan raster

The selected common 125% zoom cell is now independently raster-measured for all three synthetic source families after actual camera pan. The quarter-circle ARC oracle adapts sampling to ≤0.5 CSS-pixel spacing (957 positions at this scale); ELLIPSE uses 4097 analytic points; rational SPLINE uses 4097 independent Bernstein points and reports fully visible source bounds. Raster pixel counts are 3402 / 2746 / 5147 for ARC / ELLIPSE / SPLINE. Directed render→source / source→render errors are 0.7130987918/0.2712624842, 0.6766723248/0.2552488787 and 0.5827244287/0.2459745357 CSS px. Each direction remains ≤1.25; the existing threshold is unchanged.

The settled camera is k=7.6 for each profile. Final positions are ARC (724,378), ELLIPSE (651.5,341.75), and SPLINE (648.375,340.1875), each including its fitted/scaled prior pan and new +24,+12 CSS-pixel pan. The visible quarter domains/bounds are asserted inside the viewport. All three live host→worker→WebGL contexts use emulated DPR3; the 2× drawing-buffer cap remains, and device screenshots are 3× CSS size. Pan does not issue extra refinement; the existing test flow resets the camera before its 156%/195% checks.

Targeted Chromium Playwright passed all three DPR3 profiles (3/3, 2.9 min). Whole test file SHA-256: `B4744DA1C0E4C2223E03EC1DE0290281041A43B89A9031DE8B93F38E074D59E3`. This closes selected 125% local raster cells only, not the G6 family×zoom×DPR acceptance matrix, physical R09 or same-source AutoCAD R10. F07 terminal gates stay 0/7; overall 14/19 remains historical.

## 2026-09-27 — G6/R08 formal zoom × DPR minimum and coverage crosswalk

The required solver acceptance matrix is explicit in the current test: zoom [1,8,64,512] × DPR [1,2,3], world tolerance 0.25/(zoom×DPR), and measured device-scaled sagitta ≤0.250001 px. Current run: PASS 12/12 using npx tsx tests/cad-v2/precision-refinement.test.ts (1.3 s). Test-source SHA-256: DE31C8AC07C6DE33C7E6C0E6E382DDE95FDF88051643E132D579C94E6DB9127D.

This is a solver unit acceptance, not production camera integration. The selected host→worker→WebGL raster tests were cross-referenced separately for ARC, ELLIPSE and rational SPLINE by DPR1/2/3, marking measured raster zooms separately from settled refinement-only zooms. The plan does not specify a full geometry×zoom×DPR raster Cartesian product; unlisted intersections are neither PASS nor FAIL. The previous group’s DPR3 125% raster trio 3/3 evidence was not rerun in this audit. No new finite required local R08 gap was found. R08 remains partial pending physical R09 and same-source AutoCAD R10; F07 terminal gates remain 0/7 and overall 14/19 is historical. Test-only audit; runtime source and threshold unchanged.

## 2026-09-27 — G3/R04 nested non-LINE and viewport-projected spatial strokes (v47)

The shared spatial classifier now marks long non-LINE primitive ranges produced by paper-viewport clipping/projection, in addition to root-space ranges. Its 4096-unit span threshold, 256-chunk cap and degraded behavior remain the acceptance boundaries. A two-level affine INSERT fixture covers CIRCLE, ARC, ELLIPSE, SPLINE and bulged LWPOLYLINE at high origin with a later overlay. The independent assertions verify ordered 25-chunk partitioning, maximum bounds span 4093.360040664673, source-family/provenance sidecars, local Float32 extents and painter order. A projected paper-space CIRCLE regression produces four bounded chunks, maximum span 844.033254477853, while retaining order. The viewport assertion was red before the compiler fix and green after.

npx tsx tests/cad-v2/non-line-stroke-spatial-partition.test.ts, npx tsx tests/cad-v2/cache-identity.test.ts, and npx tsc --noEmit --project tsconfig.next.json passed after compiler/cache advanced to cad-v2-compiler-2026.09-v47. Affine OCS, bounds/provenance, block-expansion-budget and entity-instance-parity evidence producers passed and refreshed their records. The CAD unit suite had passed before the version bump (with the compiler behavior change, but before the nested five-family expansion); it was not represented as a v47 full-suite result.

Source hashes: compiler AB1A0435B2BBF560D5EF3282012BA917988F31A73A245F0FD765C1274EC948B5; version 9D2BE9C5C87343F7EC22012C637F04133189209C63C8935A391E8B34460B10D1; test CEBCEB0326CEA0312184AF06D5030D289817F4FE816FE4285BB8213995B49F44. Pipeline p08, schema 1, render ABI v2 are unchanged. The bounds producer logged input error 68, but its requested bounds/provenance assertions passed; this is not evidence of a clean decode. The selected R04 group is closed; broader G3 remains partial for on-demand host fetch, remaining global bounds/cap profiles and R05 fill/glyph. R09 physical device and R10 same-source AutoCAD remain external acceptance; F07 stays 0/7 terminal gates and 14/19 remains historical.
## 2026-09-27 — F07 G3/R05 nested/viewport glyph encoded-error kabulü (v48)

Sentetik yüksek koordinatlı test iki INSERT seviyesi altındaki TEXT'i doğrudan fill ile ve viewport projeksiyonu sonrası pafta fill'iyle örtüştürür. Her iki manifestte maxFillGlyphCompositeErrorWorld > 0; uzun nested glyph Model ve SHEET layout'larında birden fazla, en çok 4096.00001 span'li spatial chunk verir. Direct fill/glyph alan/topoloji/sıra/partial profilleri de aynı testte PASS. Host visible-fetch Playwright 2/2; tam check:cad-v2:unit, chunk-composite, R04 spatial, cache identity ve tsconfig.next PASS. Compiler/cache v47→v48; p08/schema 1/ABI v2 değişmedi. Nested/viewport HATCH/WIPEOUT mesh ve clip ile gerçek raster bileşik zarf OPEN. Bu sonuç F07 terminal 0/7 ve genel 14/19 tarihsel durumu değiştirmez.

## 2026-09-27 — Nested/viewport fill mesh ve clip acceptance (G3-G4/R05, v49)

Nested INSERT fixture: iki affine seviye altında HATCH solid alanı ve WIPEOUT mask mesh’i korunuyor; toplam beklenen üçgen alanı 24000. Draw-item akışı HATCH fill → araya giren kaynak çizgi → WIPEOUT sırasını koruyor. Normal convex XCLIP hem HATCH hem WIPEOUT’ı kırpar; ölçülen birleşik alan 5500 ve unsupported-clip tanısı yok. Inverted ve concave XCLIP fill mesh’lerini atlayıp `UNSUPPORTED_FILL_CLIP` ile quality’yi degraded yapıyor. Paper viewport’taki nested HATCH rectangle clip alanı 2500; convex triangle clip alanı 1250. Bu profiller synthetic compiler/binary geometry oracle’ıdır; native AutoCAD raster oracle değildir.

Compiler/cache v48→v49; pipeline p08, schema 1 ve render ABI v2 aynı. `npx tsx tests/cad-v2/fill-glyph-paper-spatial.test.ts`, `npx tsx tests/cad-v2/chunk-error-accounting.test.ts`, `npx tsc --noEmit --project tsconfig.next.json` ve `npm run check:cad-v2:unit` PASS. Suite’in ilk koşusu eski nested HATCH accounting testinin ilk chunk’ta line XY varsayımını açığa çıkardı; test artık fill-first chunk düzeninde boundary line chunk’ını seçiyor, ardından tam zincir PASS oldu. Aktif paper visible fill/glyph Chromium test’i 1/1 PASS. HATCH solid/WIPEOUT mesh bu yolla taşınıyor; nested LWPOLYLINE width mesh, geniş bounds/cap, nested fill-glyph composite zarfı ve runtime/raster bileşik hata ayrıca açık. G3/G4 kısmi; F07 terminal 0/7 ve 14/19 tarihsel. LibreDWG error 68 temiz decode sayılmaz.

## 2026-09-27 — Nested width-fill, bounded fill partition ve encoded-byte cap (R05, v50)

Seçili kabul profilleri: nested iki seviyeli mirrored/nonuniform LWPOLYLINE width mesh alanı 240; nested paper viewport clipping sonrası alan 500; Model ve pafta nested width-fill/glyph composite hata alanları >0. Bunlar compiler triangle/binary error oracle’larıdır, AutoCAD/native raster parity sonucu değildir. 256 fill spatial-group cap’inde diagnostic `FILL_SPATIAL_PARTITION_LIMIT_REACHED` üretilir, scene degraded olur ve kaynak triangle sayısı korunur; büyük mesh’ler 16.384 triangle pencerelerine ayrılır.

Binary chunk sınırı header, section table ve padding/alignment dahil encode öncesi ölçülür. 2 MiB üstü tahminlenen primitive aralıkları painter order korunarak recursively split edilir. R001 P08 fixture sonucu: 286 chunk; maksimum chunk <=2.097.152 byte; manifest 484.094 byte (<=1 MiB). Ayrı R001 koşusunda LibreDWG error 68 gözlendi; P08 geometry/size assertion PASS olsa da temiz decode sayılmaz.

Compiler/cache v49→v50; p08/schema 1/ABI v2 değişmedi. `npm run check:cad-v2:unit` v50 runtime değişikliğiyle, son yalnız-test composite assertion genişletmesinden önce PASS; güncel genişletilmiş fill-glyph test ve runtime TSC sonrasında PASS; R001 P08 testi de byte fix sonrası ayrı PASS. Kaynak/test SHA-256: entity-visitor `6669BEE2A031F611DC1815A2EDBC4DD885110A9EBA80EFAD9D6D933467E80A27`; scene-compiler `93B16D288C1DB5404F5DA9E79070E7B371A7B510DA4351DFA61C7E09FAB740EF`; version `BE56F3FC44F65FCD2F5981438E58B3D7C4B92964221E133FC77C3AAEAD381A3D`; fill-glyph test `9293F82DF5CDAE570A10A227C9194CCB3493BAD90D4650BE3F8EEAD07D8F814A`; R001 fixture `17a92cb544830845fc59717abcc22d3cdcf97c12b8450602c9c70ec4a507f086`.

G3/G4 ve R05 geniş kabulü kısmi: global bounds profilleri ve runtime/raster fill-glyph composite zarfı açık. Inverted/concave fill clip unsupported ve degraded kalır. F07 terminal 0/7 ve genel 14/19 tarihsel değişmedi.

## 2026-09-27 — R06 non-adjacent cross-chunk fill/glyph bound (compiler/cache v51)

The compiler now evaluates overlapping source fill and glyph bounds across distinct chunks in the same layout. It adds the fill-boundary encoding term to the glyph-stroke encoding term and records the maximum composite on both participating chunks; CSS-pixel bounds use the active transform and units-per-pixel profile. The existing quality gate degrades the scene when this pair bound exceeds the target.

The high-origin regression has a width-fill, a 24,000-unit intervening glyph at a disjoint location that creates bounded chunks, then a later glyph overlapping the fill. It verifies a non-adjacent overlapping pair, a composite larger than either participant's individual quantization maximum, individual screen errors below 0.25 CSS px while the pair exceeds 0.25 CSS px, and degraded quality with `CHUNK_COMPOSITE_PRECISION_LIMIT_REACHED`. Same-chunk and adjacent-chunk checks remain in the same test.

To bound compiler work, pair analysis checks at most 16,384 cross-chunk candidates. Overflow applies a conservative per-layout maximum fill term plus maximum glyph term to participating chunks, emits `FILL_GLYPH_COMPOSITE_ANALYSIS_LIMIT_REACHED`, and marks the scene degraded. A 130-fill/130-glyph fixture with one primitive per chunk triggers and checks this fallback.

`npx tsx tests/cad-v2/chunk-composite-precision.test.ts`, `npx tsx tests/cad-v2/cache-identity.test.ts`, `npx tsc --noEmit --project tsconfig.next.json`, and the complete `npm run check:cad-v2:unit` suite pass at compiler/cache v51. The unit chain includes R001 and logged LibreDWG error 68; no clean DWG decode is claimed. These are compiler/binary error-accounting tests, not browser, GPU or native AutoCAD raster evidence. Broader source-family, runtime/raster composite and global bounds acceptance remain open; F07 is still 0/7 terminal gates and 14/19 remains historical.

Source SHA-256: scene-compiler `1FDBD42B0EDA0690DD5509C1ED326DF1FFCEC19524A804D66C0B86EF35400BC9`; diagnostics `CF24A6624BD9075E6942973076A7876FE6C33E0E75A51E8B48FD3C8691D904A9`; binary protocol `81E429EA12B10338141B6AEB3412924564FE01DB5AC1245F8BA5CB9E9E36AF27`; version `2C1117F0699886152B8B642D0721DBD5FDA28728B099FB88751D44FDCDF45A59`; test `AD7A29DB4E59FD3BDEA4E1E40B1240A8DF0B2B27FA49ED5146FF0B540137FB27`.

## 2026-09-27 — Periodic SPLINE worker oracle tightened to v3 final target

The existing periodic degree/domain/weight matrix now asks the worker for the plan's 0.25 CSS-pixel final target (at 0.1 world unit/CSS pixel), instead of the prior 0.5 CSS-pixel target. This changes the acceptance threshold of the same 43-span profile; it adds no geometry or test cell. Every serialized span reaches the worker and reports `errorBoundMet=true`. The independent rational Bezier oracle's maximum worker error is 0.020592846700890868 world unit, equal to 0.205928467 CSS px, under the unchanged 0.25 target. Degree/domain/repeated-knot/weight/endpoint and malformed seam/knot/weight fail-closed assertions remain in the same test.

`npx tsx tests/cad-v2/dxf-periodic-spline.test.ts` PASS; `npx tsx tests/cad-v2/precision-refinement.test.ts` PASS, including the required `[1,8,64,512] × [1,2,3]` zoom/DPR solver profiles (12/12; maximum measured device-scaled sagitta 0.250001 px). Test SHA-256: `0997329E04E94B8CBCE996A3278E8E5D7A71D132613DCB56B9FFEC5448841A4B`. Compiler/cache v51, p08, schema 1 and ABI v2 unchanged. AutoCAD parity remains R10/G7 and was not run.
