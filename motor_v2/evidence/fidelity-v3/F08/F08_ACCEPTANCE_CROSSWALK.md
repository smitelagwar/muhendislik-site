# F08 — Fidelity v3 kabul çapraz tablosu

**Tarih:** 30 Eylül 2026
**Durum:** `PARTIAL / ACCEPTANCE NOT_RUN`
**Kapsam:** `29_RENDER_VE_YASAM_DONGUSU.md` F08 maddelerini mevcut kaynak, sentetik Chromium kanıtı, P00 R001 ölçümü ve dış kabul girdileriyle eşleştirir. Bu tablo yalnız dosya veya unit test varlığına dayanarak PASS vermez.

## v95 — RTX 4060/D3D11 tamamlanmış cold/warm request seti (30 Eylül)

Port 3161 installed-Chrome koşusu **1/1 PASS (5.3m)** verdi; CDP `ANGLE_D3D11`, RTX 4060, ayrı GPU process, compositing ve WebGL doğrulandı. Test-only settle bariyeri cold/warm snapshot öncesinde beş ardışık 100 ms sabit aralık, sıfır pending route ve sıfır terminal sonucu bekleyen host `chunk-load-start` istedi. Düzeltilmiş koşuda her iki açılışta da **284/284** unique chunk isteği ve **98.040.976 B** görüldü; sorted set SHA-256 aynı (`8ae670…2e8f`), iki yönde set farkı **0**. Her iki tarafta 284 start/284 outcome, 194 accepted/90 rejected, aynı camera ve canvas SHA-256 (`069e43…0673`) vardı. Production scheduler değiştirilmedi.

İlk v95 tekrarındaki 280/270 route sayıları, 284/274 host start ve 280/268 outcome ile snapshot anında sırasıyla **4/6** pending host load içeriyordu; bu koşu testten PASS aldı ama tamamlanmış set karşılaştırması olarak kabul edilmedi. Testin erken snapshot alması bulundu; settled koşu görünür farkı kapattı. Test kaynak düzeltmesi bekleyen host ID'leri terminal outcome'a kadar settle eder ve süre aşımında pending diagnostics ile fail eder.

RTX 4060 raster/source izi dokuz exact-tier capture ile tekrarlandı: baseline/projected/viewport × 6/12/18 accepted count ve ordered-ID assertion'ları geçti; projected centerline **43**, canvas raster **46** occupied cell verdi. Raster-only hücreler 152/153/154'teki **37/37 pixel** accepted `aks` çizgilerine 1 CSS px içinde izlenebildi. Bir-pixel hücre 156, üç-pixel occupancy eşiğinin altında kaldı; radius sweep yalnız tanısal, lineweight/AA oracle değil. Maskeler ve ID listeleri [v95 JSON](R001_MEMORY_LIFECYCLE_V95.json) içinde.

Cold/warm admission cost **74.920.882 / 67.108.864 B CPU estimate** ve **51.048.852 / 67.108.864 B GPU-buffer estimate**; ilk değer sınırı aşıyor, ikinci aşmıyor. Bunlar process RSS HWM veya physical GPU residency değildir; run'da Windows process/GPU observer yoktu. R001 LibreDWG **error 68**; temiz/native decode, aynı kaynak AutoCAD semantic hash + ≥10 ROI, Poco X6 Pro ve tam peak/lifecycle kabulü açık. F08 **PARTIAL / ACCEPTANCE NOT_RUN**; iki 64 MiB cap ve production admission order değişmedi. v94 kaydı 245/227 route sayımını içerir ama pending host-load sayaçlarını kaydetmemiştir; bu nedenle orijinal run'daki eksik load sayısı doğrudan kanıtlanamaz. Sonraki ilk v95 snapshot'ında aynı count-idle yönteminin erken örnek alabildiği, 4/6 pending load ile doğrudan görüldü. Settled v95 cold/warm karşılaştırması scheduler nondeterminism iddiasını desteklemiyor.

## v94 — RTX 4060/D3D11 exact-tier raster ve kaynak izi (30 Eylül; request-set yorumu v95 ile superseded)

Port 3159’daki installed Chrome koşusu **1/1 PASS (5.3m)** verdi; CDP `ANGLE_D3D11`, NVIDIA GeForce RTX 4060, ayrı GPU process, GPU compositing ve WebGL/WebGL2 enabled doğruladı. Opt-in exploration modu unpaced projected/viewport replay prefix’lerini hard-assert etmedi; iki request ve outcome prefix’i logda beklenen diziyle eşleşti. Pacing’li koşulda baseline/projected-grid/viewport-grid için **6, 12 ve 18** kabul edilmiş parça hedeflerinin dokuz capture’ı da tam kabul sayısı ve beklenen ID dizisi hard assertion’larını geçti. Capture sırasında unranked parça isteği yoktu. 9 capture’ın kabul edilmiş ID dizileri, 20×20 hücre maskeleri ve foreground pixel sayıları [R001_MEMORY_LIFECYCLE_V94.json](R001_MEMORY_LIFECYCLE_V94.json) içinde.

Settled 1440×852 canvas maskesinde color-delta 16 ve hücre başına en az 3 foreground pixel eşiğiyle accepted projected centerline **43 hücre**, raster **46 hücre** verdi; raster-only row 7 / column 12–14 hücreleri **152/153/154**, sırasıyla **13/9/15 pixel** taşıdı. Pixel örneklerinin **37/37’si** accepted projected line’a 1 CSS px içinde bağlandı: chunk `002`, `aks`, command 5 ve 23; chunk `107`, `aks`, command 150. Tek pixel’li hücre 156 eşiğin altında kaldı. 0.25–1 CSS px diagnostic centerline radius sweep üç raster-only hücreyi kapatıyor; bu genişletme gerçek stroke-width/antialias renderer modeli değildir. Önceki SwiftShader notundaki 31 pixel (13/6/12) ile bu koşudaki 37 pixel (13/9/15) yalnız cell/count kıyasıdır; eski ham maskenin pixelwise verisi olmadığından donanım kaynaklı fark sonucu çıkarılamaz.

İlk ve warm açılış aynı canvas SHA ve ölçülen maskeyi verdi, fakat kaydedilen fetched set sayıları **245 / 49.298.056 byte** ve **227 / 49.213.584 byte** idi (`initialFetchedChunkSetStable=false`). v94 run'ı pending host-load sayaçlarını saklamadığı için bu iki eski snapshot'taki tamamlanmamış yük sayısı bilinmiyor. v95'te aynı count-idle snapshot yöntemi kullanıldığında 280/270 route sayısında 4/6 host load'un terminal outcome beklediği görüldü; v95 settle bariyeri ardından cold/warm iki yönde de 284/284 aynı set'i doğruladı. Bu sonraki tanı, v94 farkının da erken snapshot kaynaklı olabileceğine işaret eder; v94 tek başına scheduler drift kanıtı değildir. v94 maliyet raporunda 284 görünür chunk'ın 194'ü kabul/90'ı CPU-budget reddiydi; CPU estimate **74.920.882 / 67.108.864 B**, GPU-buffer estimate **51.048.852 / 67.108.864 B**. İki cap ve production sırası değiştirilmedi.

İlk port3159 denemesi `chunk_model_251`’i paced replay rank’inde bulamadığı için başarısızdı. Kaynak manifest ve derlenmiş sahnede chunk bulundu; test route’larının yeni replay kurulduktan sonra değişebilir global run state’ini okuması kök neden oldu. Test fixture’ı her Playwright request’ine replay snapshot’ı bağlayacak şekilde düzeltildi; unranked geliş capture bariyerine kadar bekletilip raporlanıyor, exact count/ID assertion’ları korunuyor. Runtime scoped TSC geçti; başarılı D3D11 Playwright koşusu düzeltmeden sonra tekrarlandı.

Bu run için Windows process/GPU observer çalıştırılmadı; browser raporundaki RSS/heap değerleri OS-maintained process peak veya GPU residency değildir. R001 yine LibreDWG **error 68** verdi. Temiz/native decode, same-source AutoCAD semantic hash + ≥10 ROI, Poco X6 Pro ve tam peak/lifecycle kabulü açık; F08 **PARTIAL / ACCEPTANCE NOT_RUN** kalır. [v94 kanıt JSON’u](R001_MEMORY_LIFECYCLE_V94.json).

## v93 — RTX 4060 / Direct3D11 P00 exact-tier keşif (30 Eylül)

İlk port 3153 donanım koşusu viewport-grid accepted-outcome prefix assertion'ında başarısız oldu. Sabit Playwright varsayılanı SwiftShader olduğundan donanım denemesi, geçici bir config ile installed Chrome + `--use-angle=d3d11` üzerinde tekrarlandı. P00 test başlangıcındaki CDP `SystemInfo.getInfo`, etkin WebGL renderer'ı **ANGLE (NVIDIA GeForce RTX 4060, Direct3D11)** olarak raporladı; `gpu_compositing` ve WebGL enabled, ayrı GPU process (`inProcessGpu=false`). Windows P00 PID GPU sayaçları ayrıca örneklendi.

Port 3158 final koşusu **exit 0, 1/1 PASS (4.5m)** verdi. 6/12/18 accepted-tier readback'leri ve accepted-ID assertions üçü de geçti; donanım koşusunda tier başına bir eşleşmiş capture üretildi. İlk açılış 194/284 kabul, 90 CPU ret, 0 GPU ret. Opt-in `CAD_V2_P00_HARDWARE_GPU_EXPLORATION=1` modu yalnızca unpaced replay prefix'lerini hard assertion yerine logladı; bu koşuda projected-grid ve viewport-grid request/outcome prefix'leri logda beklenenlerle eşleşti. Exact-tier accepted count ve ID kontrolleri hard assertion olarak kaldı. Bu nedenle sonuç gerçek GPU yolu için **keşif/tekrarlanabilirlik kanıtı**, F08 acceptance değildir. Pixel-mask değerleri bu güncellemede saklı machine-readable rapordan yeniden çıkarılmadığı için SwiftShader maskeleriyle birleştirilmedi.

Port3158'e bağlı Windows observer UTC **20:55:34–21:01:01** aralığında 180 örnek aldı; median aralık **1.827 ms**, en çok 9 yeni Chrome PID. Chromium çalışma seti eşzamanlı örneklerinin toplamı en çok **2.737.381.376 B**, tek PID OS `PeakWorkingSet64` en çok **2.034.663.424 B** oldu. `GPU Process Memory(*)\Dedicated Usage` NVIDIA LUID `0x00000000_0x00010831` için P00 Chrome PID'lerinde sampled dedicated usage toplamı/tek-PID tepesi **230.690.816 B** idi; tüm uygulamaların adapter dedicated usage sample tepe değeri **1.185.914.880 B**. GPU counter ve aggregate değerler sampled ölçümdür; `PeakWorkingSet64` yalnız tek PID içindir, PID tepeleri toplanmadı. Ham kayıt, backend tanısı ve sınırlamalar [R001_MEMORY_LIFECYCLE_V93.json](R001_MEMORY_LIFECYCLE_V93.json) içinde.

AutoCAD/accoreconsole bulunmadı; `adb devices -l` boş olduğundan Poco X6 Pro yok. Önceki port3153 ve geçici response-gate fixture denemeleri başarısız olarak V93 JSON'da listelendi ve kabul sayılmadı. R001 LibreDWG `error 68`, temiz/native decode, same-source AutoCAD semantic hash + ≥10 ROI ve Poco cihaz ölçümü açık. F08 **PARTIAL / ACCEPTANCE NOT_RUN**; 64 MiB CPU/GPU limitleri ve production admission order değişmedi.

## v92 — R001 Node HWM ve event-gated Chromium P00 (29 Eylül)

`npx tsx tests/cad-v2/real-scene-render.test.ts` **exit 0 / PASS**. R001 SHA `17a92cb544830845fc59717abcc22d3cdcf97c12b8450602c9c70ec4a507f086` için Node OS-maintained `maxRSS` **2.001.043.456 B** oldu; tepe scene compile sonrasında kaydedildi ve paralel chunk kopyası, unpack, curve refinement, reload, worker load ve 20 open/close örneklerinden sonra değişmedi. Faz bazlı RSS/heap değerleri ve 1.917.587.456 B son RSS kanıtta ayrıdır. LibreDWG `error 68` sürdüğünden bu temiz/native decode değildir.

P00 pacing kancası, hedef accepted sayısına ulaştıktan sonra gelen chunk yanıtlarını `readPixels` sonrası `console.debug` marker'ı Promise bariyerini bırakana kadar bekletiyor; `finally` de bariyeri bırakıyor. Böylece assertion gevşetilmeden accepted-tier ve ID eşitliği korunuyor. `CI=true`, port 3152 koşusu **exit 0, 1/1 PASS (5.5m)**; hedef **6/12/18** tier'larının üçü de geçti. Bu güncellemeyle toplam başarılı eşleşmiş capture sayıları **9/6/3**. İlk açılış yine 194/284 kabul, 90 CPU ret, 0 GPU ret verdi. Test-only pacing; production admission/sıralama/bütçesi değişmedi.

Port 3152'ye bağlı Windows process observer yaklaşık **5:23** çalıştı: 413 poll (310 Chromium-bearing), medyan **980 ms**, eşzamanlı en çok **7 chrome-headless-shell**, örneklenmiş aggregate working set en çok **2.836.733.952 B**, OS-maintained tek PID `PeakWorkingSet64` en çok **1.805.160.448 B**. Aggregate örneklenmiş toplamdır, OS-maintained çoklu-süreç HWM değildir; per-PID tepeler toplanmadı. Yaklaşık 980 ms aralık kısa aggregate sıçramalarını kaçırabilir; working set shared pages içerebilir ve fiziksel GPU residency ölçmez. Ham observer yolu ve ayrıntılar [R001_MEMORY_LIFECYCLE_V92.json](R001_MEMORY_LIFECYCLE_V92.json) içinde.

Önceki port 3150 exact-12 capture'ı 14 accepted gördüğü için başarısız ve dışlanmıştır; port 3151'deki sabit 5 saniyelik route bekletmesi UI'ı 72/284'te tutup 60 saniye footer timeout'a yol açtığı için başarısız fixture denemesidir. İki koşunun observer sayıları yalnız exploratory geçmiş olarak JSON'da saklandı; başarılı P00 sonucu yerine kullanılmıyor.

F08 **PARTIAL / ACCEPTANCE NOT_RUN** kalır. AutoCAD same-source semantic hash + ≥10 ROI, temiz/native R001 decode, fiziksel GPU/Poco X6 Pro ve production kabulü açık; CPU/GPU 64 MiB sınırları ve production admission order değişmedi.

Ek yerel doğrulama olarak bir bağımsız process tekrarı çalıştırıp exact-tier maskelerini yeniden çıkarmak yararlı olur; dış kabul girdileri gelmeden raster/projection proxy’sinden production sırası seçilmez.

## v91 — rejected-only hücreler için maliyetli kapsama analizi (29 Eylül)

v90 P00 ret haritasından 21 rejected-only projected hücreyi örten **tam ağırlıklı set-cover** türetildi. En düşük gözlenen parça-adayı maliyetli çözüm 10 chunk'tır; seçilen `candidateCpuBytes` toplamı **35.968.388 B / 34,30 MiB**, buna karşılık GPU buffer aday toplamı **20.348.712 B / 19,41 MiB**. Hücrelerin 12'sinde tek bir rejected chunk adayı vardır. Seçim ve hücre eşlemesi [P00_REJECTED_ONLY_CELL_COST_COVER.json](P00_REJECTED_ONLY_CELL_COST_COVER.json), girdi kimliği/hash'i [P00_BUDGET_REJECTION_SPATIAL_MAP.json](P00_BUDGET_REJECTION_SPATIAL_MAP.json) içinde kayıtlıdır.

`candidateCpuBytes`, kod sözleşmesinde parça başına `geometryCpuBytesAdded + incomingUnpackedCpuBytes` artımlı admission tahminidir; toplam sahne CPU'su, process RSS veya yeni limit değildir. Seçili maliyetlerin toplamı gerçek yeniden sıralanmış runtime deneyi sayılmaz; accepted/refinement retention, çalışma-zamanı overhead'i ve eviction etkileri için karşılaştırmalı native fidelity sonucu yoktur. Bu nedenle 64 MiB CPU/GPU limitleri ve production sıralaması değişmedi. 6 odak testi (ledger, renderer sahipliği, transferable, refinement bütçesi, scheduler/LRU ve host lifecycle) bu turda exit 0 ile tekrar geçti. F08 **PARTIAL / ACCEPTANCE NOT_RUN**; aynı kaynak AutoCAD semantic hash + ≥10 ROI, temiz/native R001 decode, gerçek GPU/Poco ve browser-process tepe kanıtı açık.

## v90 — ilk-açılış bütçe retlerinin mekânsal dökümü (28 Eylül)

P00 R001 browser ölçümü, ilk açılışta 284 görünür Model chunk'ının **194'ünü kabul etti, 90 benzersiz chunk'ı reddetti**. Port 3149 koşusu `CI=true`, `1/1 PASS (5.2m)`; test-only raporuna 90 reddedilen ID için projected 20×20 hücreleri, bbox ROI eşleşmeleri ve ret kaynağı eklendi. 90 retin tamamı CPU kaynağına yazıldı; GPU ret sayısı **0**. CPU peak admission estimate **74.920.882 B / 67.108.864 B** bütçe; GPU buffer estimate **51.048.852 B / 67.108.864 B** bütçe. Kabul edilen setin projected occupancy'si **43/64** hücreydi.

| Ret kapsamı | İlk açılış sonucu |
|---|---:|
| Reddedilen benzersiz chunk | 90 / 284 |
| Projected occupancy'de en az bir hücresi olan reddedilen chunk | 90 / 90 |
| Reddedilen chunk bulunan projected hücre | 60 / 64 |
| Yalnız reddedilmiş aday içeren projected hücre | 21 / 64 |
| ROI-01 plan bbox | 14 / 18 ret; 4 kabul |
| ROI-02 plan bbox | 90 / 284 ret; 194 kabul |
| ROI-03 U317 bbox | 1 / 1 ret |
| ROI-04 -Z INSERT bbox | 6 / 6 ret |
| ROI-05–10 | `worldBBoxEstimate` yok; chunk eşlemesi ölçülemedi |

Yalnız reddedilmiş 21 grid hücresi row:column olarak **8:{0,1,2,4,5,17}; 9:{0,1,2,4,5}; 10:{0,1,2,5}; 11:{0,1,2,5}; 12:{13,14}**.

ROI sayımları örtüşür: ROI-02 tüm 284 chunk bbox'ını içerdiğinden seçici değildir; diğer ROI ret sayılarını toplayıp 90'a eşitlemek doğru olmaz. ROI-05–10 için sıfır ret sonucu çıkarılmıyor; profil bunları mekânsal olarak chunk'lara bağlayacak bbox sağlamıyor. Hücreler derlenmiş geometri projeksiyonudur, raster/semantik önem değildir. Her reddedilen chunk'ın hücre/ROI/ret-nedeni/bayt kaydı [P00_BUDGET_REJECTION_SPATIAL_MAP.json](P00_BUDGET_REJECTION_SPATIAL_MAP.json) içinde saklandı.

Port 3148'de ayrı eşik replay'i 12 kabul hedefinde 14 accepted chunk yakaladığı için **exit 1** verdi; o capture eşit-set ölçümü olarak kullanılmadı. Port 3149'daki tekrar tüm mevcut P00 assertions ile geçti ve her tier için aynı framebuffer maskelerini verdi. Böylece başarılı tam capture sayısı 6/12/18 hedeflerinde sırasıyla **8 / 5 / 2**; accepted→readback aralıkları **176–231 / 386–583 / 606–890 ms** oldu. Bu dilim test/evidence değişikliğidir; production scheduling/admission/bütçesi değişmedi. R001 LibreDWG `error 68`, `autoCadOracle=NOT_RUN`; F08 **PARTIAL / ACCEPTANCE NOT_RUN**.

## v89 — eşit accepted-tier framebuffer capture (28 Eylül)

P00 test-only hook, accepted chunk sayısı hedef **6, 12 veya 18** olduğunda o eşiği gören ilk draw'dan sonra default-framebuffer `readPixels` aldı. Capture edilen accepted chunk ID'leri ve admission outcome prefix'leri her tier için candidate-order prefix'iyle eşleşti. Rank 0–5 yanıtları rank başına 12 ms, kalanlar 250 ms geciktirildi. `CI=true` koşuları: port 3143 hedef 6 **1/1 PASS**; port 3144 hedef 6 `--repeat-each=2` **2/2 PASS**; port 3145 hedef 6/12 **1/1 PASS**; port 3146 hedef 6/12 `--repeat-each=2` **2/2 PASS**; port 3147 hedefleri 6/12/18 **1/1 PASS**. Toplam **5 P00 komutu, 7 Playwright test sonucu**. Projected paced request loglarında candidate prefix'inden önce bazen ek request'ler vardı; bunlar accepted/captured prefix'lerine girmedi.

| Capture hedefi | Baseline | Projected-grid | Viewport-grid |
|---|---:|---:|---:|
| 6 accepted: cell / foreground px (7 eşleştirilmiş capture) | 31 / 4.745 | 6 / 1.516 | 5 / 1.510 |
| 6 accepted: captured ID prefix | 001–006 | 192,195,198,051,054,057 | 192,195,198,191,194,197 |
| 12 accepted: cell / foreground px (4 eşleştirilmiş capture) | 33 / 5.516 | 9 / 3.020 | 11 / 2.964 |
| 18 accepted: cell / foreground px (1 keşif capture'ı) | 33 / 6.375 | 11 / 3.544 | 11 / 3.543 |
| Settled t16 cell / foreground px | 46 / 38.061 | 69 / 50.091 | 67 / 50.712 |
| Settled accepted visible chunks (paced koşul aralığı) | 190–194 / 284 | 228 / 284 | 229 / 284 |

Altı accepted tier'ındaki yedi eşleştirilmiş capture ve 12 accepted tier'ındaki dört capture kendi içinde aynı maskeyi verdi. Altı chunk'ta projected-grid viewport-grid'den **1 cell / 6 px** fazla; 12 chunk'ta viewport-grid **2 cell** fazla, projected-grid **56 px** fazla verdi. 18 chunk'ta hücre sayısı eşit, projected-grid **1 px** fazla; bu yalnızca bir keşif örneği. Hücre kapsamı ile piksel toplamı aynı stratejiyi seçmiyor; kazanan belirlenmedi.

İlk accepted event'ten readback tamamlanmasına kadar 6-tier koşuları **176–231 ms**, 12-tier koşuları **390–583 ms**, tek 18-tier koşusu **606–890 ms** sürdü. Aralıklar ilgili sayıda admission bekleme süresini ve senkron `readPixels` işlemini birlikte kapsar; GPU-only readback veya compositor sunum gecikmesi değildir. Capture, hedefi geçen draw sonrasındaki default WebGL framebuffer'ıdır; kullanıcının first-presented frame'i değildir. Pacing ve capture test-only; production sıra/admission/bütçesi değişmedi. R001 LibreDWG `error 68`; temiz/native decode, aynı SHA AutoCAD semantic hash + 10 ROI, fiziksel GPU/Poco X6 Pro ve production acceptance `NOT_RUN`; F08 **PARTIAL / ACCEPTANCE NOT_RUN**.

## v88 — paced ilk-katman denemesi eşit kabul sayısı sağlamadı (28 Eylül)

P00 `CI=true`, port 3137 koşusu **exit 0, 1 passed (2.6m)**. Test fixture route'u ilk altı candidate rank'i rank başına 12 ms, kalan yanıtları 250 ms geciktirdi; üç örnekte ilk 16 request ve admission outcome sıraları eşleşti. Ancak framebuffer readback anındaki kabul edilmiş chunk sayısı baseline / projected-grid / viewport-grid için **3 / 2 / 1** oldu. İlk accepted→draw süreleri **22,2 / 19,6 / 23,3 ms**, accepted event'ten framebuffer readback tamamlanmasına kadar **258,7 / 173,1 / 166,2 ms** idi. Framebuffer cell / piksel maskesi **31 / 4.288**, **2 / 229**, **2 / 111** verdi. Bu rasterlar eşit kabul edilmiş chunk setlerinden gelmediği için erken coverage sıralaması çıkarılamaz.

| Ölçüm (paced replay) | Baseline | Projected-grid | Viewport-grid |
|---|---:|---:|---:|
| İlk accepted page timestamp / ilk draw page timestamp | 924,3 / 946,5 ms | 2.344,4 / 2.364,0 ms | 870,2 / 893,5 ms |
| Kabul / projected cell, ilk draw timestamp'inde | 3 / 29/64 | 2 / 2/64 | 1 / 2/64 |
| Kabul / projected cell, framebuffer readback'te | 3 / 29/64 | 2 / 2/64 | 1 / 2/64 |
| Framebuffer raster (occupied cell / foreground px) | 31 / 4.288 | 2 / 229 | 2 / 111 |
| Settled raster t16 (cell / foreground px) | 46 / 38.061 | 69 / 50.091 | 67 / 50.712 |
| Settled kabul / görünür chunk | 194 / 284 | 228 / 284 | 229 / 284 |

Paced settled süreleri **12,540 / 16,889 / 15,457 ms** olup normal v87 koşularıyla doğrudan kıyaslanamaz. Ayrı bir deneyde rank-0 dışındaki route yanıtlarını framebuffer capture'a kadar kapatma girişimi port 3138'de **exit 1** ile sonlandı: host 60 saniyede footer/canvas durumuna geçmeyip `Görünür parçalar aktarılıyor (1/284)` ekranında kaldı. Bu test route kapısı renderer'ı hazırlık aşamasında tuttuğundan geçerli framebuffer karşılaştırması üretemedi; kapı kodu testten çıkarıldı. Route-level tek-chunk gate kullanılmadan önce altı accepted chunk'ta tekrarlanabilir capture almak için renderer/admission düzeyinde test kancası veya başka bir ölçüm noktası gerekir.

İki deney de test-only'dir. Eşit accepted set'li erken raster sonucu yoktur; projected-grid ve viewport-grid arasında kazanan belirlenmedi. Production scheduling/admission/budget değişmedi. R001 LibreDWG `error 68`, temiz/native decode, aynı SHA ile AutoCAD semantic hash + 10 ROI, fiziksel GPU/Poco X6 Pro ve production acceptance `NOT_RUN`; F08 **PARTIAL / ACCEPTANCE NOT_RUN**.

## v87 — ilk kabul sonrası WebGL framebuffer piksel örneği (28 Eylül)

P00 testi `CI=true`, `PLAYWRIGHT_PORT=3136` ile **exit 0, 1 passed (1.8m)**. Baseline ve iki replay için ilk 12 request ve ilk 12 admission outcome'u candidate/manifest order ile eşleşti. Test, ilk accepted chunk sonrası ilk WebGL draw wrapper'ından sonra aynı senkron render görevinin microtask sonlanışında default WebGL framebuffer'ını bir kez `readPixels` ile aldı. Browser içinde 20×20, delta 16, hücre başına en az 3 piksel raster maskesi hesaplandı. Her üç sample'da default framebuffer binding, accepted chunk ve foreground piksel varlığı doğrulandı. Bu WebGL renk tamponunun doğrudan pikselidir; compositor'ın kullanıcıya sunduğu ilk ekran görüntüsü değildir.

| Ölçüm (v87 son tekrar) | Baseline | Projected-grid | Viewport-grid |
|---|---:|---:|---:|
| İlk accepted event / ilk content draw, page başlangıcından | 12.807 / 12.841 ms | 809 / 820 ms | 1.021 / 1.043 ms |
| İlk accepted chunk → ilk draw gecikmesi | 33,4 ms | 10,9 ms | 21,7 ms |
| İlk draw anında kabul / projected cell | 6 / 29/64 | 6 / 6/64 | 12 / 11/64 |
| İlk render-task framebuffer rasterı (cell / foreground px) | 31 / 4.745 | 6 / 1.516 | 11 / 2.964 |
| Readback tamamlanırken kabul edilmiş chunk | 6 | 6 | 12 |
| Readback tamamlanma zamanı, ilk kabulden sonra | 496 ms | 172 ms | 177 ms |
| Settled canvas t16 rasterı (cell / foreground px) | 46 / 38.061 | 69 / 50.091 | 67 / 50.712 |
| Kabul / toplam görünür chunk | 194 / 284 | 228 / 284 | 229 / 284 |
| Yanıtların tamamlanması | 16.490 ms | 4.780 ms | 5.094 ms |

İlk-frame benzeri gerçek framebuffer piksel örneği, projection proxy'sinden daha doğrudan erken renk kapsamı verir. Dört P00 tekrarında baseline/projected/viewport cell ve pixel dizileri sırasıyla **20/861, 9/2.788, 5/1.510**; **31/4.745, 6/1.516, 11/3.075**; **31/4.745, 6/1.516, 5/1.510**; son turdaki tabloda verilen **31/4.745, 6/1.516, 11/2.964** oldu. Ham sonuçların sırası, readback anında kaç chunk'ın kabul edildiğine bağlı: altı kabul edilmiş chunk'ta projected rasterı üç örnekte **6/1.516**, viewport-grid rasterı iki örnekte **5/1.510** hücre/piksel verdi. Bu fark küçük ve yalnız bir tekrarda iki order aynı koşuda altı kabul ile karşılaştırıldı; 12–13 kabul alan viewport rasterı aynı eşik değildir. İlk accepted event page başlangıcından baseline **4,98–12,81 s**, projected **0,78–0,83 s**, viewport **0,83–1,02 s** aralığında; ilk content draw sırasıyla **6,08–12,84 s**, **0,80–0,85 s**, **0,86–1,04 s** aralığında gerçekleşti. Order request ve admission başları eşleşse de ilk render task'e kaç outcome'ın yetiştiği değişiyor. İlk kabul→ilk draw gecikmesi alanı artık mutlak `performance.now()` timestamp'lerinden çıkarılan farkı ayrıca `firstDrawAfterFirstAcceptedDelayMs` olarak raporlar; timestamp alanının kendisi latency değildir.

Readback GPU/browser iş parçacığını senkronize edip yük akışını etkileyebilir; bu nedenle capture completion zamanı gerçek kullanıcıya ilk paint latency'si olarak yorumlanmamalı ve settle süresi önceki readback'siz v86 koşusuyla doğrudan kıyaslanmamalıdır. Bu kanıt hızlı content draw ile erken partial coverage tradeoff'unu gösterir, fakat order winner'ı belirlemez. Üretim scheduler/admission politikası değişmedi. R001 LibreDWG `error 68`, profil provisional ve AutoCAD oracle `NOT_RUN`; F08 **PARTIAL / ACCEPTANCE NOT_RUN**.

## v86 — test-only viewport-grid gerçek sıra replay'i ve üçlü karşılaştırma (28 Eylül)

`CI=true`, `PLAYWRIGHT_PORT=3132`, `npx playwright test tests/document-studio/cad-v2-p00-baseline.spec.ts --project=chromium --reporter=line --workers=1`: **exit 0, 1 passed (1.6m)**. Aynı testte baseline açılışı ve iki reload replay'i aynı R001/host koşusunda ölçüldü. Projected-grid manifest order hash'i `a8d0263abc2d8a68db804e3064a51727eb3e985a0c25610a74d6e2d8dc6fe84e`; viewport-grid order hash'i `d16fccb054505db45c9a9b64bbc4b9c8b0c431b5397f765eb7818875b4c22d00`. Her replay'in ilk 12 gerçek request'i kendi aday sırasıyla eşleşti; manifest'in `indexPages` önceliği nedeniyle yalnız test fixture'ında `indexPages: []` kullanıldı. Üretim sıralaması, admission kararı ve 64 MiB bütçeleri değişmedi.

| Ölçüm | Baseline | Projected-grid replay | Viewport-grid replay |
|---|---:|---:|---:|
| Kabul / atlanan chunk | 194 / 90 | 228 / 56 | 229 / 55 |
| Kabul edilen vertex | 1.468.378 | 1.862.234 | 1.962.234 |
| Projected primitive cell | 43/64 | 63/64 | 61/64 |
| Viewport bbox cell | 70/97 | 97/97 | 97/97 |
| ROI Kat1 / Kat2 / U317 / -Z INSERT | 4/18 / 194/284 / 0/1 / 0/6 | 15/18 / 228/284 / 1/1 / 5/6 | 16/18 / 229/284 / 1/1 / 6/6 |
| Settled canvas raster (t16) | 46 cell / 38.061 px | 69 / 50.091 px | 67 / 50.712 px |
| Görünür yanıtların tamamlanması | 9.481 ms | 5.218 ms | 5.540 ms |
| İlk kabulden ilk WebGL draw'a gecikme; o ana kadarki kabul / projected cell | 217 ms; 8 / 29/64 | 13 ms; 6 / 6/64 | 9 ms; 6 / 5/64 |
| CPU event tepe / bütçe | 74.920.882 / 67.108.864 B | 72.519.048 / 67.108.864 B | 73.908.758 / 67.108.864 B |
| GPU buffer estimate tepe / bütçe | 51.048.852 / 67.108.864 B | 44.874.000 / 67.108.864 B | 44.986.944 / 67.108.864 B |

İki gerçek fixture replay'i baseline görünür yanıt tamamlanmasını bu koşuda yaklaşık %45–%42 kısalttı. Viewport-grid, projected-grid'e göre bir chunk ve 100.000 vertex fazla kabul etti; settled rasterı 621 foreground pixel daha fazla, ancak occupied-cell sayısı 2 az ve projected geometry coverage'ı 2 cell düşüktü. Bu yüzden kaba raster piksel toplamı ile projected hücre kapsamı aynı kalite sıralamasını vermiyor. WebGL telemetry'deki ilk draw alanı mutlak page `performance.now()` timestamp'idir; ilk kabul→draw gecikmesi iki timestamp farkıdır (**217 / 13 / 9 ms**). Bu koşudaki baseline latency önceki v85 koşusundaki 1.571,9 ms'den farklıdır; ilk draw gecikmesi değişkendir. İlk readback'siz koşu doğrudan ilk-frame raster değeri sağlamadığından projection proxy'siyle sınırlı kalmıştı.

CPU tepe olayı üç sırada da 64 MiB üstündedir; bu, ret öncesi renderer resident + retained source + incoming aday tahminidir, committed resident HWM veya process RSS değildir. GPU metriği driver residency değildir. R001 LibreDWG `error 68`, profil provisional ve AutoCAD oracle `NOT_RUN`; F08 **PARTIAL / ACCEPTANCE NOT_RUN** kalır. Bu karşılaştırma scheduler/admission sırası için production değişikliği veya native semantic fidelity kabulü değildir.

## v85 — test-only projected-grid soğuk açılış replay'i (28 Eylül)

R001 P00 Chromium koşusu `CI=true`, `PLAYWRIGHT_PORT=3131`, `npx playwright test tests/document-studio/cad-v2-p00-baseline.spec.ts --project=chromium --reporter=line --workers=1`: **exit 0, 1 passed (1.4m)**. Aynı gerçek host/worker/renderer ve 64 MiB admission kodu üçüncü, yeniden yüklenmiş bir view-session'da çalıştı. Projected-grid greedy sırası yalnız test fixture'ının flat manifest chunk listesine uygulandı; `validateSceneManifest` dolu `indexPages` listesini tercih ettiğinden replay fixture'ında `indexPages: []` kullanıldı. Üretim sıralama kodu, admission kararı ve bütçe değişmedi. 284 adayın sıra SHA-256'sı `a8d0263abc2d8a68db804e3064a51727eb3e985a0c25610a74d6e2d8dc6fe84e`; replay'in ilk 16 request'i ve ilk 16 admission outcome'u candidate order başıyla eşleşti.

| Ölçüm | Mevcut manifest sırası | Projected-grid fixture sırası |
|---|---:|---:|
| Kabul / atlanan görünür chunk | 194 / 90 | 228 / 56 |
| Kabul edilen vertex | 1.468.378 | 1.862.234 |
| Actual projected primitive grid | 43/64 | 63/64 |
| ROI-01 Kat1 | 4/18 | 15/18 |
| ROI-02 Kat2 | 194/284 | 228/284 |
| ROI-03 U317 outlier | 0/1 | 1/1 |
| ROI-04 -Z INSERT | 0/6 | 5/6 |
| Canvas raster, t16 ve hücre başına ≥3 piksel | 46 hücre / 38.061 foreground px | 69 hücre / 50.091 foreground px |
| İlk kabulden sonraki ilk WebGL çizim | 1.571,9 ms; o ana kadar 36 kabul, projected 32/64 | 8,4 ms; o ana kadar 6 kabul, projected 6/64 |
| Görünür chunk yanıtları tamamlanana kadar | 9.242 ms | 4.770 ms |
| GPU buffer admission estimate tepe/bütçe | 51.048.852 / 67.108.864 B | 44.874.000 / 67.108.864 B |
| CPU admission event tepe/bütçe | 74.920.882 / 67.108.864 B | 72.519.048 / 67.108.864 B |

Projected-grid replay, 228 chunk / 1.862.234 vertex / 63 projected cell sonucuyla v84'teki maliyet karşıolgusunu bu çalıştırmada eşledi. Mevcut sıraya göre settled rasterda 23 hücre ve 12.030 foreground pixel daha fazlaydı; bunlar kaba aynı-canvas occupancy sayılarıdır, native fidelity/readability kanıtı değildir. İlk içerik çizimindeki projected occupancy ise **32/64'ten 6/64'e** düştü; candidate ilk çizimi ilk admission'dan 8,4 ms sonra, baseline 1.571,9 ms sonra yaptı. Bu first-content-frame hücre hesabı, ilk kabulden sonraki ilk WebGL draw timestamp'inde kabul edilmiş chunk'ların projected coverage'ıdır; o andaki doğrudan canvas screenshot/raster maskesi değildir. Settled t16 canvas maskesi ayrıca ölçüldü. Sonraki sıralama deneyi ilk görünüş gecikmesi ile erken frame coverage tradeoff'unu ele almalı.

CPU event tepe değeri admitted resident high-water mark veya process RSS değildir: admission helper chunk'ı geçici renderer'a ekleyip renderer resident + retained source + incoming unpacked CPU tahminini sınar; ret durumunda chunk'ı hemen çıkarır. Bu nedenle ret öncesi event aday tahmini 64 MiB'den yüksek olabilir. GPU değerleri de GPU driver residency değildir. Screenshot hash candidate sıra nedeniyle değişti; bu değişiklik AutoCAD parity demek değildir. Deney aynı browser context'te yeni page reload/view-session kullandı; temiz OS/browser-process başlatması değildir. R001 decoder `error 68`, profil provisional, AutoCAD oracle `NOT_RUN`; F08 **PARTIAL / ACCEPTANCE NOT_RUN** ve üretim admission order/bütçesi değişmedi.

## v84 — 64 MiB ilk görünüş admission-order karşıolgusu (28 Eylül)

R001 P00 tekrarında `CI=true`, `PLAYWRIGHT_PORT=3124`, `npx playwright test tests/document-studio/cad-v2-p00-baseline.spec.ts --project=chromium --reporter=line` **exit 0**, **1 passed (1.5m)**. Aynı cold-open kaynak olayları ve CPU/GPU bütçeleriyle test-only sıralama simülasyonu yaptı; production scheduler/renderer sırası değiştirilmedi.

Mevcut sıralama 284 görünür chunk'tan **194** kabul, **1.468.378 vertex**, viewport 20×20 bbox candidate hücrelerinde **70/97**, projected primitive hücrelerinde **43/64** verdi. `cameraViewportGrid20MarginalCoveragePerCpuByte` karşıolgusu **229/284 chunk**, **1.962.234 vertex**, bbox candidate hücrelerinde **97/97**, projected primitive hücrelerinde **61/64** seçti. `cameraProjectedPrimitiveGrid20MarginalCoveragePerCpuByte` ise **228/284 chunk**, **1.862.234 vertex**, **97/97** bbox ve **63/64** projected primitive hücre seçti. Profilde world bbox tanımlı dört ROI için mevcut sıralama: Kat1 **4/18**, Kat2 **194/284**, U317 outlier **0/1**, -Z INSERT **0/6**; viewport-grid karşıolgusu: **16/18**, **229/284**, **1/1**, **6/6**; projected-grid karşıolgusu: **15/18**, **228/284**, **1/1**, **5/6**. Diğer altı profil ROI'sinde bbox tahmini olmadığından bu yerel kapsama metriğine girmez.

Bu projeksiyona göre 64 aday hücrenin **21'inde** actual accepted chunk'lardan hiçbirinin projected source'u yoktur; bu 21 hücre chunk-rejection kaynaklı olası boşlukları işaretler, fakat her hücrede görünür/önemli geometry bulunduğunu ispatlamaz. Canvas'ın eşik16 raster maskesinde 46 hücre, accepted centerline projeksiyonunda 43 hücre vardı; üç raster-only hücrenin pikselleri kabul edilmiş çizgilere yakın bulundu. Raster maskesi 21 aday boşluğun semantic etkisini ölçmez.

Bu sonuç, mevcut maliyet tahminleriyle daha mekânsal sıralama hipotezinin soğuk görünüşte test edilmeye değer olduğunu gösteriyor. Viewport-grid karşıolgusu Kat1 ve -Z bölgesinde birer chunk fazla seçerken; projected-grid karşıolgusu bir chunk/100.000 vertex daha azla iki projected hücre fazla kapsıyor. Simülatör maliyetleri mevcut sıralamada ölçülmüş chunk değerlerinden alır ve toplamları sıfırdan başlatır; renderer sabit giderini, chunk'lar arası paylaşılan backing store'ları, eşzamanlı completion sırasını ve sıralama değişince yeniden oluşacak geometri giderlerini modellemez. Grid/drawCommand coverage görüntüde okunabilirlik ya da AutoCAD semantik ROI eşliği değildir. R001 error 68 ve native oracle NOT_RUN; bu nedenle ölçüm runtime admission kararını değiştirme kanıtı sayılmadı.

Sonraki adım v85'teki first-content-frame coverage ve gecikme tradeoff'unu ayrı bir test-only öncelik sırasıyla incelemek; sonra native AutoCAD/temiz decode/cihaz girdilerini almak. Üretim admission politikasını bu dış kanıtlar olmadan değiştirme.

## v83 — R001 Chromium process working-set örneklemesi (28 Eylül)

R001 P00 cold/warm tarayıcı testi `CI=true`, ayrılmış `PLAYWRIGHT_PORT=3121` ile çalıştı: `npx playwright test tests/document-studio/cad-v2-p00-baseline.spec.ts --project=chromium --reporter=line`, **exit 0**, **1 passed (1.3m)**. Harici Windows gözlemleyici, `ms-playwright` executable yolundaki Chromium süreçlerini `Get-Process` üzerinden yaklaşık 250 ms aralıkla **295 kez / 80,0 saniye** örnekledi (ölçülen ortalama aralık yaklaşık 271 ms). En çok üç Chromium süreci eşzamanlı görüldü. Süreçlerin anlık `WorkingSet64` toplamının örneklenen en yüksek değeri **1.741.975.552 B**; tek süreçte OS `PeakWorkingSet64` en yüksek değeri **1.198.309.376 B** oldu. PID başına OS peak değerlerinin toplamı **1.825.996.800 B**'dir; bunlar aynı anda oluşmadığından aggregate peak değildir.

Bu sonuç örnekleme aralığındaki en yüksek aggregate working set'tir, OS-maintained Chromium process-tree high-water mark değildir; 250 ms aralık kısa sıçramaları kaçırabilir ve process working set toplamı paylaşılan sayfaları birden fazla sayabilir. P00 test raporundaki Node `rssBytes` değerleri faz anlık görüntüleridir. Node `process.resourceUsage().maxRSS` kaydı ayrı gerçek-sahne sürecine aittir. Bu ölçümler gerçek GPU residency/telemetrisi sağlamaz.

## v82 — resource ownership ve gerçek Node-process high-water mark (28 Eylül)

Renderer artık her loaded chunk grubundaki geometry/material kaynaklarını scene, host generation ve chunk kimliğiyle ownership ledger'a kaydeder. Ortak kaynak nesneleri kimlik üzerinden tek kez muhasebeleştirilir; owner lease'leri `refCount` ile tutulur ve kaynak ancak son lease bırakıldığında dispose edilir. Prepare başlangıcındaki owner değişimi eski chunk'ları boşaltır; renderer testinde yeni generation'a ait olmayan kayıt kalmadı. Ledger accounting/son-sahip testleri, gerçek renderer-group registration/removal testi ve aktarılmış worker buffer'ını ikinci kez gönderme testi PASS. `setResourceOwner` generation switch için gerçek renderer API yolunu da sınar.

R001 gerçek-sahne testine OS-maintained `process.resourceUsage().maxRSS` high-water mark kontrol noktaları eklendi; sampler thread kullanılmadı. Kaynak hash'i `17a92cb544830845fc59717abcc22d3cdcf97c12b8450602c9c70ec4a507f086`, decoder yine LibreDWG `error 68` bildirdi. Test süreci başlangıçta maxRSS **103.096.320 B**, decode sonrası **454.119.424 B**, scene compile sonrası ve senaryo sonuna kadar **1.944.174.592 B** gördü. Bu tek Node test sürecinin bütünsel, işletim sistemi tarafından tutulan HWM değeridir; compile fazı sonunda yükseldi, sonraki copy/refinement/reload/20-cycle aşamalarında artmadı. Anlık compile sonrası RSS **1.796.464.640 B** idi; anlık RSS ile HWM aynı metrik değildir.

Ayrı tahminler: dört eşzamanlı in-process kaynak buffer kopyası toplam **1.692.880 B**; ilk unpack edilmiş worker chunk **1.272.108 B**; onun renderer attribute CPU estimate'i **1.212.120 B**, GPU buffer estimate'i **1.212.120 B** ve build scratch estimate'i **50.112 B**. Aynı R001 parçasındaki 22 curve source için refinement **1.255 segment** üretti; aynı kaynağın reload vertex count'i değişmedi. Bu tek chunk/workload koşturması ilk görünüşte reddedilen 90 chunk'ı temsil etmez. Browser process RSS/HWM ve fiziksel GPU telemetry bu turda alınmadı.

Soğuk R001 açılışında 284 görünür chunk'ın 194'ü kabul, **90'ı reddedildi**; önceki host telemetrisi retlerin 90/90'ının CPU estimate nedeniyle olduğunu gösteriyor (**74.920.882 / 67.108.864 B CPU**, **51.048.852 / 67.108.864 B GPU**). Dolayısıyla mevcut 64 MiB policy altında ilk çizim degraded/partial kalıyor; yerel raster/projection ölçümü native semantik ROI tamlığını belirleyemiyor. Bütçe değiştirilmedi.

## v82 — doğrulama kayıtları

- `npx tsx tests/cad-v2/real-scene-render.test.ts`: **exit 0**; R001 decode/compile, dört buffer kopya cohort'u, worker unpack, curve refinement, same-source reload, 20 worker-client turu ve sonraki R002 kontrolü. R001 process HWM kaydı R002 aşamasından önce yazıldı.
- Ownership ledger, renderer registration, worker single-transfer, scheduler/cache, curve replacement preflight ve host lifecycle testleri: **PASS**; `npx tsc --noEmit --project tsconfig.next.json --incremental false`: **exit 0**.
- `CI=true`, `PLAYWRIGHT_PORT=3119`, `npx playwright test tests/document-studio/cad-v2-layout-viewport.spec.ts --project=chromium --grep 'F08|WebGL context restore|20 V2|dosya geçişinde'`: **5/5 Chromium PASS** (64 MiB budget/LRU, 10 simüle context recovery, 20 open/close, stale file switch ve legacy DOM control). 20-cycle CDP heap örnekleri 1/10/20'de **35.974.392 / 58.510.920 / 59.167.756 B**; doğrudan window/document/canvas listener sayacı **24/149/0** olarak kaldı. Bunlar Chromium JS heap snapshot'larıdır, browser-process RSS veya plateau kanıtı değildir.

F08'de başlangıç sınırı CPU resident ve GPU tahmini için ayrı ayrı **64 MiB**'dir. Bu üst sınır browser toplam RAM'i değildir. Gerçek peak kaynak kopyaları, worker/source buffer'ları, renderer geometri dizileri, browser heap/RSS ve GPU tüketimi ayrı kaydedilmelidir. P00 sabit workload'unda ilk görünür frame, tam görünür içerik, etkileşim p50/p95, long task, request ve semantik/ROI sonucu birlikte değerlendirilir.

| Fidelity v3 koşulu | Bu checkout'ta doğrulanmış | Durum | F08'i kapatmak için kalan kanıt |
|---|---|---|---|
| Ayrı CPU resident ve GPU estimate admission; bütçe aşımını sessizce gizlememe | `chunk-memory-accounting.ts`, `resource-budgets.ts`; 64 MiB sınır, invalid telemetry fail-closed, gelen chunk'ı renderer'dan çıkarma unit kontrolleri; gerçek host fixture'ında görünür ret uyarısı | **Yerel davranış PASS, kaynak ölçüsü PARTIAL** | Sayaçlar typed-array/attribute tahminidir. JS/allocator/worker kopyaları, texture/render target ve gerçek GPU allocation'ı değildir. P00'da görünür içerik ilk açılışta bütçeyi aşıp degraded kalıyor. |
| Tepe tüketimini kaynak türüne göre ölçme | R001 `real-scene-render.test.ts` Node süreci OS-maintained `process.resourceUsage().maxRSS` kaydını her faz sonunda aldı: start **103.096.320 B**, decode sonrası **454.119.424 B**, compile sonrası **1.944.174.592 B**; sonraki copy/refinement/reload/20-cycle adımları aynı HWM'de kaldı. Son faz RSS **1.830.256.640 B**. R001 P00 Chromium süreçleri 80,0 saniyede 295 kez örneklendi: aggregate anlık `WorkingSet64` örnek maksimumu **1.741.975.552 B**, en yüksek tek-process OS `PeakWorkingSet64` **1.198.309.376 B**; üç eşzamanlı sürece kadar görüldü. Ayrı workload estimate'leri: 4 buffer copy **1.692.880 B**, unpacked worker chunk **1.272.108 B**, renderer CPU/GPU buffer estimate **1.212.120 / 1.212.120 B**, build scratch **50.112 B**. | **Node process HWM measured; Chromium working set sampled; GPU PARTIAL** | Chromium değeri 250 ms hedefli örnekleme maksimumudur, OS-maintained aggregate process-tree HWM değildir; kısa tepe kaçabilir ve shared pages süreç toplamında tekrar sayılabilir. Worker/renderer source attribution ve gerçek GPU residency/telemetry yoktur. CDP heap kontrolleri faz snapshot'ıdır. |
| LRU eviction → yeniden görünür olunca reload | `chunk-scheduler-cache.test.ts`; sentetik gerçek-host bütçe fixture'ında görünmeyen parça tahliyesi ve geri yükleme; R001 P00 pan/zoom retry cohort ölçümleri | **PARTIAL** | Sentetik fixture ve R001 tekrar yükleme davranışı var; ancak ilk R001 görünür set'i 64 MiB estimate'i aşarak 90 chunk'ı atlıyor. Tam viewport/semantik ROI tamlığı gösterilmedi. |
| Paylaşılan geometry/material sahipliği ve transfer/cleanup | `resource-ownership-ledger.ts` scene/generation/chunk, `refCount` ve CPU/GPU `byteEstimate` taşır; renderer her chunk grubuna geometry/material kaynaklarını kaydeder, son lease'te dispose eder ve scene/generation değişiminde chunk'ları bırakır. WorkerClient aynı `ArrayBuffer`'ı iki kez transfer etmeyi reddeder. Ledger paylaşım/son-owner, renderer registration/removal/generation, transfer guard testleri ve browser stale file-switch geçer. | **Local ownership/transfer PASS** | Farklı chunk'ların gerçek runtime'da aynı geometry/material/glyph nesnesini paylaştığı prod fixture yoktur; ledger sentetik shared identity ile refcount/last-owner davranışını kanıtlar. Gerçek GPU driver allocation/disposal ve fiziksel context/file switch telemetry'si eksik. |
| Curve replacement sırasında old + new kaynak bütçesi | `curve-refinement-memory-accounting.ts` preflight; kabul/ret sınırları ve LRU ağırlığı bookkeeping unit kontrolleri | **Yerel estimate PASS, gerçek peak PARTIAL** | Hesaplanan scratch/resident byte sınırı gerçek allocator/GC peak'i veya başarısız/iptal swap tepe belleği değildir. R001 browser replacement workload'u ölçülmedi. |
| Eski generation/file switch/cancel temizliği; 20 aç-kapat | Renderer `setResourceOwner` eski generation chunk kayıtlarını temizler; host lifecycle/browser stale file switch, 20 worker oluşturma/terminate, 20 session DELETE ve listener tabanlarını sınar. Renderer ownership testinde generation geçişiyle eski lease sayısı sıfırlanır. | **Local synthetic/browser PASS** | CDP heap artışı playlist/legacy control'da da görülür; bu ölçümler browser process RSS/high-water mark veya fiziksel GPU teardown plateau değildir. |
| 10 context loss/recovery; kamera, layer/layout ve view setting korunması | Bu dilimdeki Chromium/SwiftShader testi 10 döngüde yeni frame ve tek chunk request'ini; zoom camera transform, Model layout, görünür `GEOMETRY` layer ve `showLineweights=false` durumunu kontrol eder | **Sentetik local PASS** | WEBGL_lose_context simülasyonudur; fiziksel GPU driver/device recovery'si değildir. P00 semantic ROI aynı testte ölçülmedi. |
| Sabit P00 cold/warm, frame/interaction, request ve ROI kabulü | R001 actual sırası 194/284, 1.468.378 vertex, 43/64 projected cell; test-only projected-grid gerçek replay 228/284, 1.862.234 vertex, 63/64; viewport-grid 229/284, 1.962.234 vertex, 61/64. Dört bbox ROI actual/projected/viewport: Kat1 4/18→15/18→16/18; Kat2 194/284→228/284→229/284; U317 0/1→1/1→1/1; -Z INSERT 0/6→5/6→6/6. Settled t16 raster cell 46→69→67. v87 test-only framebuffer readback'inde first render-task raster baseline/projected/viewport **31/4.745, 6/1.516, 5/1.510** cell/pixel; üç process tekrarı early raster sıralamasını kararlı üretmedi. İlk kabul→ilk draw gecikmesi v87'de 26,3/12,5/11,0 ms; readback compositor first-presented screenshot değildir. | **PARTIAL; order replay test-only** | Replay fixture manifest sırasını değiştirdi; production scheduler/policy değişmedi. Senkron GPU readback ve async chunk admission zamanlamayı etkileyebilir. CPU event tepe ret öncesi candidate estimate'tir, gerçek process/GPU peak değildir. R001 LibreDWG `error 68`, profil `PROVISIONAL_SPECIFICATION`; AutoCAD semantic hash ve 10 native ROI yok. Raster occupancy semantic completeness/readability/parity kanıtlamaz. |
| Gerçek kullanıcı bilgisayarı/Poco, gerçek GPU ve aynı-kaynak AutoCAD | Bu çalışma alanında doğrulanmış fiziksel ölçüm yok | **NOT_RUN** | Kullanıcı bilgisayarı + Poco X6 Pro device/workload kaydı; AutoCAD same-source capture, en az 10 semantic ROI, temiz DWG decode ve F07 ortak native oracle girdileri gerekir. |

## v81 — doğrulamalar (önceki dilim)

- `npm run check:cad-v2:ui` temiz ve ayrılmış Playwright sunucusunda (`CI=true`, port 3107): **18/18 Chromium PASS**; paket içindeki kamera, R001 render, worker/refinement, lifecycle, budget ve UI kontrolleri de PASS. Bu, 28 Eylül v81 kaydıdır.
- DPR3 ARC zoom/pan tarayıcı testinde sentetik `viewSessionId` için heartbeat route'u eksikti; gerçek endpoint'in 410 cevabı host'u yeniden prepare edip kamera durumunu sıfırlayabiliyordu. Fixture heartbeat'i 200/180s döndürecek şekilde tamamlandı; aynı test `--repeat-each=3` ile **3/3 PASS**, pan/zoom ve raster ölçümleri tutarlı. Hata mesajına raster/camera snapshot'ı da eklendi.
- İlk varsayılan Playwright denemesi eski `reuseExistingServer` sürecine bağlanarak dosya deposu tutarsızlığı ve bağlantı reddi üretti; sonucu kabul ölçümü sayılmadı. Ayrılmış CI/3107 tekrarında tam paket geçti.
- `weighted-byte-budget.test.ts`: **7/7 PASS**; ağırlıklı reservation, bekleme, idempotent release, abort ve oversized reddi.
- `chunk-scheduler-cache.test.ts`: bütçe fırsatı sonrası retry, eviction, saklanan tahmini maliyetle reload ve replacement LRU ağırlığı PASS.
- `curve-refinement-memory-accounting.test.ts`: old+new geometri, retained source, result/scratch ve sınır aşımı PASS.
- Runtime `tsconfig.next.json` typecheck: **PASS**.
- `WebGL context restore 10 döngüde yeni frame ve kaynak sürekliliğini korur`: Chromium/SwiftShader **1/1 PASS**; her döngüde camera/layout/layer/view setting ve frame kontrolü.
- Aynı Playwright dosyasında F08 bütçe/LRU, 20 aç-kapat, gecikmiş file-switch ve legacy DOM kontrolü: **4/4 PASS**. 20 turda worker create/terminate/session DELETE **20/20**, aktif worker **0**; doğrudan listener tabanı window/document/canvas **24/149/0**. Liste fazında 1/10/20 tur JS heap **34.260.840 / 58.409.072 / 58.781.540 byte**, DOM node **656 / 771 / 801**, CDP listener **708 / 1.042 / 1.186**. Legacy-only 10 tur kontrolü heap **70.641.192→78.293.860 byte**, DOM **1.566→6.948**, CDP listener **1.032→4.089** gösterdi; bu genel sayfa artışı yalnız CAD V2'ye bağlanamaz.
- `cad-v2-p00-baseline.spec.ts` sabit R001 cold/warm browser örneği: **1/1 PASS**. R001 SHA mevcut P00 kaydıyla eşleşti; 284/284 Model chunk yeni drawCommands biçiminde. t16 ve hücre başına ≥3 raster pixel'de canvas **46 cell**, accepted projected centerline **43**, raster-only **3**; 31 pixeli kabul edilmiş source çizgilerine **0,293–0,670 CSS px** uzakta. 8 zoom + 3 pan sonrasında **6 chunk / 23.368 byte** tekrar istendi: 5 önceki budget retinin kapasite fırsatıyla retry'ı, 1 accepted-evicted reload'u; 6 kabul, 0 ret. AutoCAD/native semantik oracle değildir.
- Test dosyasının standalone strict TypeScript kontrolü bu çalışma kapsamında **PASS değil**: yeni F08 bölümünün dışında bulunan beş mock `postMessage` overload hatası (286, 346, 665, 1593, 2233) sürüyor. Yeni context testindeki `getContext` türü açıkça `HTMLCanvasElement` olarak daraltıldı; bu yerel tanı kaldırıldı. Runtime `tsconfig.next.json` typecheck PASS, Playwright testleri çalıştı.

Bu yerel kanıtlar F08'in lifecycle/admission uygulamasını daraltır; temiz decode, peak/GPU veya AutoCAD oracle yerine geçmez. F08 durumu **ACCEPTANCE NOT_RUN** kalır.

## Kalan yerel/dış iş sınırı

1. Browser PID/process RSS high-water mark'ı sabit R001 P00 browser workload'u sırasında örnekle; Node maxRSS, CDP heap ve GPU estimate'ten ayrı raporla.
2. Aynı-kaynak AutoCAD semantic hash ve en az 10 ROI ile 90 CPU-budget reddinin gerçek görünüş etkisini karşılaştır; 64 MiB başlangıç politikasını fiziksel device ölçümü olmadan genişletme.
3. Temiz/native R001 decode, AutoCAD semantic hash + 10 ROI ve gerçek Poco/GPU girdileri gelene kadar F08 acceptance'ı `NOT_RUN` tut.
