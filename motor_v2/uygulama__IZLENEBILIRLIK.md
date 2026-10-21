**Güncel dilim — 5 Ekim 2026, v100 Gerçek Masaüstü CAD Dosyaları Kullanıcı Denetimi ve Çift Singleton Kalıcılığı:** Kullanıcının doğrudan masaüstünden sunduğu 5 gerçek CAD dosyası ("1 ve 2.kat dwg.dwg" [3.28 MB DWG], "kalip_plani_zeminkat.dxf" [0.36 MB DXF], "mustafa selvimimariiiii.dwg" [3.36 MB DWG], "SÜHEYLA KARA STATİK (HAFİF) - Kopya.dwg" [7.32 MB DWG], "SÜHEYLA KARA STATİK (HAFİF) - Kopya.dxf" [60.52 MB DXF]) sisteme aktarılarak DV2SCN01 ikili parçalarına derlendi ve tümü <2MB parça tavanına uydu. Next.js dev server ortamında API route modüllerinin izole çalışması kaynaklı view session kayıp ve 410 döngüsü `CadV2DurableService.getInstance()`'ın `globalThis.__cadV2DurableServiceInstance` üzerine bağlanmasıyla çözüldü; warm önbellek gecikmesi <10 ms seviyesine indi. `tests/document-studio/cad-v2-desktop-user-audit.spec.ts` ile 5 dosyanın tamamı Chromium tarayıcıda gerçek kullanıcı etkileşimleriyle (açılış, canvas çizimi, Zoom In/Out, Fit F, mouse wheel, orta tuş pan/sürükleme, Model/Layout pafta geçişi, katman paneli arama ve aç/kapa, görünüm ayarları) sıfır WebGL hatası ve sıfır konsol çökmesi ile test edildi (5/5 PASS, 1.6m). `npx tsc -p tsconfig.next.json --noEmit` (0 hata), `npm run check:cad-v2:unit` (48/48 PASS) ve `npm run check:cad-v2:integration` (10/10 PASS) tam yeşil olarak doğrulandı.

**Önceki dilim — 5 Ekim 2026, v99 CAD V2 48/48 Birim Testi ve R07-F Affine Glyph Raster Doğrulaması:** `package.json` test komutları güncellendi; `dwg-linetype-style-refs.test.ts`, `linetype-scale-settings.test.ts` ve `p00-projected-occupancy.test.ts` paketleri `check:cad-v2:unit` zincirine, `tests/document-studio/cad-v2-affine-glyph-raster.spec.ts` ise `check:cad-v2:ui` zincirine bağlandı. `npm run check:cad-v2:unit` 48/48 test paketiyle (exit code 0) eksiksiz PASS oldu. R07-F iç içe affine SHX eğri glif raster eşitliği (`cad-v2-affine-glyph-raster.spec.ts`) Model ve Paper viewport bölütlemesinde 1/1 PASS ile doğrulandı. `npx tsc -p tsconfig.next.json --noEmit` sıfır tip hatası verdi.

**Önceki dilim — 5 Ekim 2026, v98 CAD V2 Üçlü Doğrulama ve UI/Playwright Süit Tamamlanması (RC1 Doğrulandı):** `npm run check:cad-v2:ui` (8 Node/unit testi + 18/18 Chromium Playwright testi, 8.8m) exit code 0 ile eksiksiz PASS oldu. Bu koşuyla CAD V2'nin 3 temel kalite sütunu (`check:cad-v2:unit` 45/45 PASS, `check:cad-v2:integration` 10/10 PASS, `check:cad-v2:ui` 18/18 Chromium Playwright PASS) ve `npx tsc -p tsconfig.next.json --noEmit` (0 type error) yerel çalışma ağacında %100 yeşil doğrulandı. 20 aç/kapat döngüsünde 0 worker/session sızıntısı, WebGL context loss/restore 10 döngü sürekliliği, DPR1/DPR2/DPR3 raster hata sınırları (<1.25 CSS px), viewport bazlı chunk fetch ve layout geçişleri kanıtlandı. P00–P08, F01–F04, F06, R01 ve V01 olmak üzere 16 yerel paket eksiksiz LOCAL PASS / RC1 durumundadır.

**Önceki dilim — 5 Ekim 2026, v97 V01 Son Kabul ve Release Adayı (RC1) Doğrulaması:** V01 release candidate denetimi tamamlandı. `tests/cad-v2/v01-release-candidate.test.ts` (1/1 PASS) yazılarak `check:cad-v2:integration` zincirine eklendi. SchemaVersion=1, renderAbi=`three172-cad2d-v2`, magic=`DV2SCN01` kimlikleri, R001–R004 gerçek corpus boyut ve SHA-256 bütünlüğü, 19 temel kanıt dosyasının varlığı, Legacy varsayılan ve güvenli `?cadEngine=v2` fallback kuralı ile dağıtım worker bundle'ı (`public/cad-v2/cad-v2-scene-worker.js`, 40.4 KB) %100 doğrulandı. 14 kabul kapısı denetim matrisi (`ACCEPTANCE_MATRIX.md`), sürüm bildirimi (`RELEASE_CANDIDATE.md`) ve 26 entity destek atlası (`atlas-support-matrix.json`) oluşturuldu. V01 durumu **LOCAL PASS / RC1**; bağımsız aynı-kaynak AutoCAD görsel oracle (G5/G7, 10 ROI) ve fiziksel Poco X6 Pro donanım testleri sözleşme gereği NOT_RUN olarak dürüstçe raporlandı.

**Önceki dilim — 5 Ekim 2026, v96 R01 Çoklu Süreç Dayanıklılığı ve API Güvenlik Doğrulaması:** R01 paketinin tüm yerel gereksinimleri tamamlandı. `tests/cad-v2/durable-multiprocess.test.ts` (5/5 PASS) ve `tests/cad-v2/api-revision-auth.test.ts` (5/5 PASS) yazıldı ve `check:cad-v2:integration` zincirine bağlandı. Çoklu süreç izolasyonu (Süreç A staging publish -> Süreç B diskten soğuk okuma), beklenmedik süreç ölümü (`SIGKILL`) izolasyonu, fencing token stale lease ihlali red ve staging temizliği, unobserved job iptali ve izleyici refcount'ı, boş kaynak tamponu güvenlik sınırı, 409 `SOURCE_REVISION_CHANGED` revizyon uyuşmazlığı, SSRF (`169.254.169.254`/localhost/harici URL) engeli, `isValidCadV2StorageId` ile path traversal koruması ve 180s view session TTL / 410 / DELETE 204 sözleşmeleri %100 doğrulandı. Kanıt: `motor_v2/evidence/fidelity-v3/R01/R01_MULTIPROCESS_DURABILITY_ACCEPTANCE.md` ve `multiprocess-durability-audit.json`. R01 yerel durumu **LOCAL PASS**; harici hosting erişimi gerektiren deployment adımı Plan v3 Bölüm 11 sözleşmesi uyarınca BLOCKED / korumada tutulur.

**Önceki dilim — 30 Eylül 2026, v95 F08 cold/warm settle doğrulaması:** RTX 4060/D3D11 P00 **1/1 PASS (5.3m)**; test-only settle bariyeriyle cold ve warm açılışlar aynı **284/284** chunk ID setini istedi (98.040.976 B, set farkı 0), 194 kabul/90 CPU-budget ret ve aynı canvas SHA. Önceki 245/227 farkı ile ilk v95 280/270 snapshotı, terminal sonucu bekleyen 4/6 host load varken alınmış erken test örnekleriydi; production scheduler nondeterminism bulgusu değil. Dokuz 6/12/18 exact-tier raster capture ve accepted-ID assertions geçti. Runtime TSC ve settled Playwright PASS; kanıt evidence/fidelity-v3/F08/R001_MEMORY_LIFECYCLE_V95.json. Test-only fixture güncellendi; 64 MiB cap/production sırası değişmedi. R001 LibreDWG error 68; AutoCAD/native ROI, Poco X6 Pro, OS process/GPU peak ve tam lifecycle acceptance açık; F08 PARTIAL / ACCEPTANCE NOT_RUN.

**Önceki dilim — F08 v94 RTX 4060/D3D11 raster/source trace (request-set yorumu v95 ile superseded):** v94 karşılaştırması 245/227 route ID gösterdi; v95 incelemesi snapshot anında 4/6 host yükünün terminal sonucu beklediğini buldu. Bu sayımlar tamamlanmamış erken ölçümlerdir, settled scheduler farkı değildir. v95 bariyeri cold/warm açılışlarda aynı 284/284 ID kümesini doğruladı. v94 dokuz exact-tier raster/kaynak izi capture kaydı [v94 JSON](evidence/fidelity-v3/F08/R001_MEMORY_LIFECYCLE_V94.json) içinde korunur.
**Önceki dilim — F08 v93 RTX 4060/D3D11 P00:** Port3158 hardware exploration run **1/1 PASS (4.5m)**, CDP confirms NVIDIA GeForce RTX 4060 Direct3D11. Exact accepted-tier 6/12/18 and ID assertions passed; hardware-only matching captures 1/1/1 (not merged with SwiftShader 9/6/3). Windows observer sampled 180 records at median 1.827 ms, max9 Chrome PID, sampled aggregate working set **2.737.381.376 B**, max single-PID OS `PeakWorkingSet64` **2.034.663.424 B**, sampled P00 NVIDIA per-process dedicated usage **230.690.816 B**. Unpaced request/outcome prefixes logged matched in this run, though exploration mode did not hard-assert them; exact tiers remained asserted. [V93 evidence](evidence/fidelity-v3/F08/R001_MEMORY_LIFECYCLE_V93.json). Pixel masks not re-extracted; clean/native R001, AutoCAD same-source hash + ≥10 ROI and Poco X6 Pro remain open.
**Önceki dilim — F08 v92 R001 Node/P00 process HWM:** Real-scene Node test exit 0; OS `process.resourceUsage().maxRSS` **2.001.043.456 B**, final lifecycle RSS **1.917.587.456 B**. Event-gated P00 port3152 `CI=true` **1/1 PASS (5.5m)**, exact 6/12/18 accepted-tier + ID assertions passed; cumulative matching capture totals **9/6/3**. Initial load 194/284 accepted, 90 CPU rejects, GPU rejects 0. Successful-run observer: 413 polls, 310 Chromium-bearing, median ~980 ms, max7 Chromium processes, sampled aggregate working set **2.836.733.952 B**, max single-PID OS `PeakWorkingSet64` **1.805.160.448 B**. Aggregate is not OS HWM or GPU residency. Ports 3150 (14 at target12) and 3151 (fixed-delay footer timeout) are failed fixture attempts and excluded. [Evidence JSON](evidence/fidelity-v3/F08/R001_MEMORY_LIFECYCLE_V92.json). LibreDWG error68; F08 PARTIAL / ACCEPTANCE NOT_RUN; clean/native decode, AutoCAD hash + ≥10 ROI, GPU/Poco açık; 64 MiB sınır ve production policy değişmedi.

**Önceki dilim — F08 v91 rejected-only projected-cell cost cover:** v90 haritasındaki 21 boş projected hücre için tam ağırlıklı set-cover bir minimum 10 chunk / 35.968.388 B (34,30 MiB) CPU aday maliyeti ve aynı seçimin 20.348.712 B (19,41 MiB) GPU-buffer aday maliyetini verdi; 12 hücrede tek ret adayı var. [Türetilmiş set-cover JSON](evidence/fidelity-v3/F08/P00_REJECTED_ONLY_CELL_COST_COVER.json) girdi SHA-256 ve seçili chunk/cell listesini saklar. `candidateCpuBytes` artımlı parça tahminidir; bu toplam total resident, process peak veya yeni 64 MiB hedefi değildir. Altı odak ownership/renderer/transfer/refinement/cache/host lifecycle test komutu exit 0. Production policy değişmedi; F08 PARTIAL / ACCEPTANCE NOT_RUN. AutoCAD semantic hash + ≥10 ROI, clean/native R001, continuous browser-process HWM ve gerçek GPU/Poco dış kanıtları açık.

**Önceki dilim — F08 v90 rejected-chunk spatial map:** P00 initial open 194/284 kabul, 90 benzersiz ret; yeni test-only döküm retlerin 90/90'ını projected 20×20 hücrelere yerleştirdi, 60/64 hücre ret adayı içeriyor ve 21 hücrede kabul edilmiş aday yok. Retlerin tümü CPU kaynaklı. v89 framebuffer capture toplamı 6/12/18 hedeflerinde **8/5/2**, maskeler sabit. Bbox ROI sonuçları: ROI-01 14/18, geniş ROI-02 90/284, ROI-03 1/1, ROI-04 6/6; ROI-05–10 bbox sağlamıyor, bu yüzden eşleme `unknown`. [90 parça ID/cell/ROI haritası](evidence/fidelity-v3/F08/P00_BUDGET_REJECTION_SPATIAL_MAP.json). Port 3149 P00 1/1 PASS (5.2m); port 3148 target12 örneği capture'da 14 accepted gördüğünden dışlandı. `PROVISIONAL_SPECIFICATION`, LibreDWG error68 ve `autoCadOracle=NOT_RUN` sürüyor; F08 **PARTIAL / ACCEPTANCE NOT_RUN**. Production scheduling/admission/budget değişmedi. [F08 v90 crosswalk](evidence/fidelity-v3/F08/F08_ACCEPTANCE_CROSSWALK.md).

**Önceki dilim — F08 v88 paced erken-raster kontrolü:** P00 CI=true, port 3137, **1/1 PASS (2.6m)**. Test-only rank pacing first 16 request/outcome sırasını korudu fakat framebuffer capture 3/2/1 accepted chunk yakaladı; 31/4.288, 2/229, 2/111 cell/piksel karşılaştırması eşit admission set'i olmadığı için geçersiz bir winner testi. Settled raster 46/38.061, 69/50.091, 67/50.712; kabul 194/284, 228/284, 229/284. Tek chunk'tan sonra kalan route'ları durduran kapı port3138'de UI'ı Görünür parçalar aktarılıyor (1/284) durumunda tuttu (60 s timeout, exit1); kanca kaldırıldı. Production değişikliği yok. F08 **PARTIAL / ACCEPTANCE NOT_RUN**: LibreDWG error68; temiz decode, aynı-source AutoCAD semantic hash + 10 ROI, fiziksel GPU/Poco ve production kabulü açık. [F08 v88 crosswalk](evidence/fidelity-v3/F08/F08_ACCEPTANCE_CROSSWALK.md).

**Önceki dilim — F08 v87 ilk framebuffer rasterı:** P00 `CI=true`, port 3136 **1/1 PASS (1.8m)**; ilk 12 request/outcome candidate sırasıyla eşleşti. `readPixels`, ilk accepted chunk sonrası render-task'te default WebGL framebuffer pikselini örnekledi. Page başlangıcından ilk content draw baseline/projected/viewport **12.841/820/1.043 ms**; accepted→draw latency **33,4/10,9/21,7 ms**. First-task raster **31/4.745, 6/1.516, 11/2.964** cell/pixel; accepted chunk 6/6/12'ydi. Settled t16 **46/38.061, 69/50.091, 67/50.712**. Dört koşuda altı accepted chunk'ta projected raster 6/1.516 (3), viewport 5/1.510 (2; yalnız bir paired comparison) verdi; daha fazla chunk frame'e yetişince hücre sayısı arttı. Readback senkron GPU/event-loop etkisi yapabilir; ilk presented compositor frame değildir. `firstDrawAfterFirstAcceptedDelayMs` mutlak timestamp farkıdır. Production admission değişmedi; R001 error68, F08 PARTIAL / ACCEPTANCE NOT_RUN. [F08 v87 crosswalk](evidence/fidelity-v3/F08/F08_ACCEPTANCE_CROSSWALK.md), [lifecycle audit](evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md).

**Önceki dilim — F08 v86 üçlü sıra replay'i:** R001 P00 aynı Chromium testi baseline, projected-grid ve viewport-grid gerçek fixture sıra yüklemelerini çalıştırdı; port 3132, **1/1 PASS (1.6m)**. Candidate request head'leri eşleşti. Kabul 194/284→228/284→229/284, vertex 1.468.378→1.862.234→1.962.234, projected hücre 43/64→63/64→61/64. Settled raster t16 cell/pixel 46/38.061→69/50.091→67/50.712; response settle 9.481→5.218→5.540 ms. İlk accepted→draw latency 217→13→9 ms (ham timestamp 5.032→874→839 ms), o andaki admitted projected occupancy 29/64→6/64→5/64; o koşuda framebuffer raster capture yoktu. Viewport-grid projected'e göre Kat1/-Z'de birer ROI chunk fazla, projected cell'de 2 eksik, raster foreground pixel'de 621 fazla verdi. CPU estimate 74.920.882/72.519.048/73.908.758 B; GPU estimate 51.048.852/44.874.000/44.986.944 B. Bunlar CPU committed HWM veya GPU driver residency değildir. Production admission değişmedi; R001 error 68, F08 PARTIAL / ACCEPTANCE NOT_RUN. [F08 v86 crosswalk](evidence/fidelity-v3/F08/F08_ACCEPTANCE_CROSSWALK.md) ve [lifecycle audit](evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md).

# Gereksinim → kod → test → kanıt → bağımsız kabul

**Önceki dilim — F08 v84 first-view admission counterfactual:** R001 P00 test'i ayrılmış portta **1/1 PASS**. 64 MiB tahmini budget ile actual sıralama 194/284 chunk, 1.468.378 vertex, bbox grid 70/97 ve projected grid 43/64 verdi; 64 projected candidate cell'in 21'inde accepted chunk source'u yok. Viewport-grid simülasyonu 229/284, 1.962.234 vertex, bbox grid 97/97 ve projected grid 61/64; projected-grid simülasyonu 228/284, 1.862.234 vertex, bbox grid 97/97 ve projected grid 63/64 seçti. Dört bbox-defined ROI: Kat1 4/18→15/18, Kat2 194/284→228/284, U317 0/1→1/1, -Z INSERT 0/6→5/6. Simülasyon actual runtime reorder veya native fidelity kanıtı değil; maliyetler eski sıradan alınır ve eşzamanlılık/paylaşılan kaynaklar/fixed overhead dışarıda. Admission policy değişmedi, F08 **PARTIAL / ACCEPTANCE NOT_RUN**. Detay: [F08 v84 crosswalk](evidence/fidelity-v3/F08/F08_ACCEPTANCE_CROSSWALK.md) ve [lifecycle audit](evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md).

**Önceki dilim — F08 v83 Chromium working-set:** R001 P00 browser testi ayrılmış port 3121'de **1/1 PASS** oldu. Windows Playwright Chromium süreçleri 80 saniyede 295 kez (~271 ms ortalama) örneklendi; aggregate anlık working-set örnek maksimumu **1.741.975.552 B**, tek süreç OS peak working set **1.198.309.376 B**, en çok 3 süreç eşzamanlıydı. Bu OS-maintained aggregate HWM değildir; örnek aralığındaki kısa sıçramalar kaçabilir ve shared pages tekrarlı sayılabilir. v82 Node process OS HWM **1.944.174.592 B** ayrı gerçek-sahne testindedir. Gerçek GPU telemetrisi yok. LibreDWG error68; ilk R001 görünüş 284 chunk'tan 194 kabul/90 CPU 64 MiB estimate ret; F08 **PARTIAL / ACCEPTANCE NOT_RUN**. Temiz decode, AutoCAD semantic hash + 10 ROI ve gerçek GPU/Poco dış kapıları açık. Ayrıntı: [F08 v83 crosswalk](evidence/fidelity-v3/F08/F08_ACCEPTANCE_CROSSWALK.md) ve [lifecycle audit](evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md).

**Önceki dilim — F08 v82 ownership + Node process HWM:** Renderer kaynakları scene/generation/chunk sahibi ve refCount lease'leriyle izliyor; ortak geometry/material son lease bırakılınca dispose ediliyor. Host generation geçişi eski chunk'ları temizliyor, WorkerClient aynı transferable ArrayBuffer'ı ikinci kez göndermiyor. Ledger, renderer integration, transfer guard, scheduler/LRU, refinement preflight ve lifecycle odak testleri PASS; runtime typecheck exit 0. Ayrılmış Chromium grubu **5/5 PASS**. R001 Node test sürecinin OS-maintained maxRSS tepe değeri **1.944.174.592 B** oldu (scene compile sonunda); browser-process RSS/HWM ve gerçek GPU telemetrisi o dilimde alınmadı. R001 LibreDWG `error 68`; ilk görünüşte 284 chunk'ın 90'ı CPU 64 MiB estimate sınırı nedeniyle reddedildi. F08 **PARTIAL / ACCEPTANCE NOT_RUN**; temiz decode, AutoCAD semantic hash + 10 ROI ve Poco/gerçek GPU dış kapıları açık. Ayrıntı: [F08 v82 crosswalk](evidence/fidelity-v3/F08/F08_ACCEPTANCE_CROSSWALK.md) ve [lifecycle audit](evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md).

**Önceki dilim — F08 v81 tam doğrulama + faz RSS örnekleri:** Ayrılmış Playwright sunucusunda (`CI=true`, port 3107) `npm run check:cad-v2:ui` **18/18 Chromium PASS**. DPR3 ARC browser fixture'ında eksik heartbeat mock'u sentetik session'ın 410 alıp `prepare` akışını başlatmasına neden oluyordu; heartbeat route'u 200/180s olacak şekilde tamamlandı, aynı test **3/3 PASS**. R001 Node RSS start/decode/compile/20 worker cycle örnekleri **83.369.984 / 422.305.792 / 1.916.981.248 / 1.947.602.944 byte**; bunlar faz snapshot'ları, peak değildir. F08 **PARTIAL / ACCEPTANCE NOT_RUN**. Açık yerel iş: explicit shared-resource owner/refcount ledger ve sürekli peak telemetry; dış kapılar clean decode, AutoCAD semantic 10 ROI ve fiziksel GPU/Poco. Detay: [F08 v81 audit](evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md) ve [kabul çapraz tablosu](evidence/fidelity-v3/F08/F08_ACCEPTANCE_CROSSWALK.md).

**F08 v80 kabul çapraz tablosu + recovery state continuity:** [F08 v3 acceptance crosswalk](evidence/fidelity-v3/F08/F08_ACCEPTANCE_CROSSWALK.md) separates resident/estimated budgets from actual peak and native/hardware evidence. 10× context recovery browser **1/1 PASS** with stable camera transform, Model layout, visible GEOMETRY layer, `showLineweights=false`, rendered-frame gate and no repeat chunk request. Budget/LRU, 20 open-close, stale file switch and legacy DOM browser tests **4/4 PASS**; the 20-cycle loop had 20 worker terminate + session DELETE, zero active worker, and stable window/document/canvas listener counts 24/149/0. R001 P00 browser **1/1 PASS**: 284/284 Model chunks use current drawCommands; 8 zoom + 3 pan produced 6 reload requests / 23.368 bytes, five budget retries + one evicted reload, 6 accepted/0 rejected. Current partial R001 raster mask remains 43 accepted projected cells vs 46 thresholded canvas cells; three low-density cells' 31 pixels sit 0.293–0.670 CSS px from accepted source lines. R001 error 68 and profile provisional. Shared resource `ownerScene/generation/refCount/byteEstimate`, actual peak/process memory/GPU, clean decode, AutoCAD semantic hash + 10 ROI and physical device remain open. F08 **PARTIAL / ACCEPTANCE NOT_RUN**.

**F05 v61 source-handle and nested ATTRIB:** DXF ASCII/binary model-space and nested BLOCKS INSERT→ATTRIB pair records bind by exact group-5 source handle. BLOCKS records with no exact handle are not ordinal-guessed and emit `UNRESOLVED_DXF_INSERT_ATTRIBUTES`. Nested source render, ATTDEF precedence, alignment/justification, constant/invisible and unsupported OCS are covered; outer-transform BBox `[600.000,500.000..620.007,516.820]`. DWG adapter consumes libredwg-web `INSERT.attribs[]` / nested text fields and has synthetic source-shape checks for default +Z geometry and diagnostic boundaries. R001 error68 yields 1,922 INSERT but no observed attached ATTRIBs in that partial parse; clean attribute-bearing DWG and native AutoCAD visual remain NOT_RUN. F05 Gate 1–7, cache identity, decoder-field contract, app/test TypeScript and scoped diff-check PASS; compiler/cache v71. F05 remains OPEN/PARTIAL. See [F05 v61 acceptance evidence](evidence/fidelity-v3/F05/DIMENSION_ATTRIBUTE_ACCEPTANCE.md).

**Önceki F08 v69 CPU/GPU cohort retry → P00 tekrar ölçümü:** `ChunkAdmissionRetryGate` kapasite revizyonuna bağlı retry maliyetini saklıyor; aynı batch içindeki önceki-ret ve LRU-evicted adaylarının toplam tahmini CPU/GPU maliyeti kapasiteyi aşmıyor. Evicted chunk son admission maliyetiyle değerlendirilir. Bütçeye sığmayan görünür aday transfer başlatmadan ertelenir ve degraded/kısmi uyarısı korunur. Cache unit, sentetik gerçek-host F08 Playwright **1/1**, runtime TSC ve tam `check:cad-v2:ui` **18/18 Chromium PASS**. R001 P00 **1/1 PASS**: 8 zoom + 3 pan'de **6/6** request/start/outcome; 5 önceki-ret retry'si + 1 accepted→evicted→reload, **6 kabul / 0 ret**, unknown/missing **0**, **23.368 byte**. V68'e göre 380 istek ve 268.433.896 byte azalma; warm sette 284 ID, etkileşim 6 benzersiz ID ve yeni ID 0. İlk açılış 194 kabul/90 ret, aynı kısmi canvas hash'i. R001 error 68; native AutoCAD ROI, temiz decode ve fiziksel GPU/peak NOT_RUN; F08 **ACCEPTANCE NOT_RUN**. Tam detay F08 v69 audit'te.

**F08 v68 kapasite kapılı retry → P00 tekrar ölçümü:** `ChunkAdmissionRetryGate` ret durumunu kapasite revizyonuna bağlar; görünür küme değişikliği kendi başına retleri temizlemez. Kabul edilmiş chunk görünmez olup eviction adayı olduğunda veya görünür baskı tahliyesinden sonra bir admission kabul edildiğinde yeni retry fırsatı açılır. Başarısız baskı tahliye döngüleri tek başına yeni izin vermez. Cache gate testi, F08 Chromium layout fixture (**1/1**), runtime TSC ve `check:cad-v2:ui` (**18/18 Chromium**) PASS. Aynı R001 P00 (**1/1**): 8 zoom + 3 pan'de **386/386** network/load-start/terminal eşleşmesi; **273** önceki ret retry'si ve **113** kabul→LRU eviction→reload; unknown/missing **0**. V67'de 641/527.969.056 byte iken v68'de **386/268.457.264 byte**: **255 istek (%39,8)** ve **259.511.792 byte (%49,2)** azalma. 116 admission-pressure eviction, warm açılıştaki 284 ID'den 200 benzersiz etkileşim ID'si ve sıfır yeni ID. Açılış yine 194 kabul/90 ret; CPU/GPU tahmin/bütçe 74.920.882/67.108.864 ve 51.048.852/67.108.864 byte; aynı kısmi canvas hash'i. R001 LibreDWG error 68; `PROVISIONAL_SPECIFICATION`, native ROI/AutoCAD, gerçek GPU ve fiziksel peak NOT_RUN; F08 **ACCEPTANCE NOT_RUN**.

**F08 v67 admission/eviction → P00 refetch karar izi:** cad-v2-host-shell.tsx test callback'i varsa load start, accepted/rejected/stale outcome, CPU/GPU estimated bytes/budgets ve görünür-admission/cache-weight/curve-refinement tahliye nedenlerini kaydeder. Küçük bütçeli browser fixture 4 Model isteğinde 3 kabul/1 ret, Sheet geçişinde görünmez tahliye ve Model dönüşünde reload doğruladı (1/1). Gerçek R001 P00 (1/1): 641 network isteği ile 641 host başlangıç/sonucu eşleşti; 528 önceki budget reddi retry'si, 113 kabul sonrası LRU tahliyesi reload'u; unknown/missing outcome 0. Etkileşimde 116 görünür-admission baskı tahliyesi ve 527.969.056 yeniden transfer byte'ı ölçüldü. Her açılış 194 accepted/90 rejected; CPU peak estimate/budget 74.920.882/67.108.864 byte, GPU 51.048.852/67.108.864. Bu renderer estimate'i gerçek GPU/peak değildir. Runtime TSC PASS; check:cad-v2:ui **18/18 PASS**. R001 LibreDWG error 68, native ROI oracle NOT_RUN; F08 **ACCEPTANCE NOT_RUN**.


**F08 v66 P00 warm-set refetch izi:** Aynı `check:cad-v2:f08:p00` gerçek R001→Document Studio V2 host koşusu **1/1 PASS**. Test şimdi her etkileşim isteğini warm açılış ID setine göre sayar: 8 zoom + 3 pan'de **641/641 isteğin** tamamı warm'da daha önce istenmiş 284 ID içinden, 200 benzersiz ID tekrar indirildi; warm küme dışında yeni ID yok; toplam **527.969.056 byte**. Bu, tekrar transferini doğrular, ama hangi isteğin ilk 90 admission reddi veya daha sonra LRU tahliyesinden kaynaklandığını ayırmaz. Host DOM yalnız son genel budget uyarısını verdi; geçici per-chunk CPU/GPU tahmin oranı bu yöntemle alınamadı. Cold/warm etkileşim 8.612/4.384 s; 90 görünür chunk atlandı; 11 input→WebGL draw p50/p95 **16,5/18,4 ms**. Warm host açılışı ve sonraki etkileşim örneğinin toplamında 10 long task, maks. 728 ms. R001 LibreDWG error 68; F08 **ACCEPTANCE NOT_RUN**. Diğer detaylar F08 audit dosyasında.

**F08 v65 P00 gerçek R001 browser örneği:** `tests/document-studio/cad-v2-p00-baseline.spec.ts` gerçek DWG upload'ı sonrası Document Studio `?cadEngine=v2` host'una gider; actual host chunk kabul/admission, warm reload, canvas, CDP heap, per-process RSS, WebGL bufferData, interaction-to-next-draw ve bbox→chunk ROI eşleşmesini izler. `npm run check:cad-v2:f08:p00 -- --reporter=line` PASS 1/1. R001 3.444.087 byte/SHA `17A92CB5…F086`; LibreDWG error 68; compiler 2.630 ms decode/15.204 ms compile, Node compile-sonrası RSS 1.904.422.912 byte; 286 chunk/98.042.688 byte. İlk/warm host interactive 8.808/4.296 s; her iki açılışta 284 chunk/98.040.976 byte ve eş canvas hash'i; ikisinde de **90 görünür parça budget uyarısıyla atlandı**. 8 zoom + 3 pan: WebGL draw-call'a event latency p50/p95 16,1/17,8 ms; 641 chunk request/527.969.056 byte; 6 long task, max 789 ms. ROI-01/02 bbox chunk adayları 18/18 ve 284/284, ROI-03/04 1/1 ve 6/6, profil handle'ları 2/2 ve 6/6; ROI-05–10 bbox olmadan kapsama vermez. Bu, parça-fetch ve tekrar/hash gözlemidir, native semantic ROI parity değildir. SwiftShader ve seyrek RSS/heap noktaları fiziksel GPU/peak değildir; error 68 temiz DWG decode değildir, F08 **ACCEPTANCE NOT_RUN**. Ayrıntı `evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md`.

**F08 v64 curve replacement ve ölçüm izi:** `render/curve-refinement-memory-accounting.ts` renderer replacement öncesi resident, yeni attribute, refinement scratch/source ve worker cache reserve tahminlerini ortak CPU/GPU budget evaluator'ına verir. `cad-v2-host-shell.tsx` preflight'ta gerekirse invisible LRU eviction sonrası bir kez yeniden hesaplar; taşma sürerse eski geometry'yi tutar/degraded işaretler ve retry loop'u önler. `cache/chunk-spatial-scheduler.ts` `updateByteLength` ile yalnız kabul edilmiş replacement sonrası ağırlığı cleanup callback'i çağırmadan düzeltir. `tests/cad-v2/curve-refinement-memory-accounting.test.ts`, `chunk-scheduler-cache.test.ts`, `host-lifecycle-cancellation.test.ts`, scoped runtime TSC PASS; son LRU düzeltmesinden sonra budget + bağımsız runtime ELLIPSE Chromium testleri 2/2 PASS. Önceki tam UI koşusu 18/18 idi, fakat bu son LRU değişikliğinden önce. P00 R001 Node stage/RSS örnekleri audit'te kayıtlı; error68 var, browser/WebGL/peak/GPU/ROI kabulü değildir. F08 **ACCEPTANCE NOT_RUN**.

**F08 v63 byte ownership izi:** `worker/resource-budgets.ts` cache 8 MiB + in-flight transfer reservation 16 MiB sabitlerini paylaşır. `cad-v2-scene-worker.ts` worker cache tutulan/evicted chunk ID'lerini iletir, inline sidecar birleşik limitini uygular ve JSON refs mesajını destekler. `worker-client.ts` cache hit'te inline source üretmez; miss'te bir kere bounded fallback, aşımda yerel refine kullanır; ready/error/dispose readiness timer'ını temizler. `weighted-byte-budget.ts` chunk worker havuzunu manifest byte ağırlığıyla backpressure eder ve abort bekleyenleri uyandırır; `weighted-byte-budget.test.ts` 7/7 ve `worker-client-refinement.test.ts` 9/9 PASS. `worker-refinement-browser.test.ts` real Worker'da retained cache/cached refinement, generation fence, array fallback ve JSON fallback PASS; `host-lifecycle-cancellation.test.ts` 5/5; runtime TSC ve worker bundle PASS. Manifest rezervasyonu gerçek heap/peak/RSS/GPU ölçümü değildir; `replaceSceneChunkGeometry` eski grubu yeni buffer üretimi bitene kadar tutar, overlap bütçesi ve P00 ROI/hash **NOT_RUN**. F08 **ACCEPTANCE NOT_RUN**.

**F08 v62 kaynak ve test izi:** `cad-v2-host-shell.tsx` prepare'ı StrictMode ilk effect cleanup'ı sırasında iptal edilebilen kısa bir macrotask'a erteleyip cleanup'ta generation/abort/heartbeat/session/worker referanslarını sonlandırır. `cad-v2-layout-viewport.spec.ts` 20 V2↔dosya listesi turunda 20 prepare/20 worker terminate/20 session DELETE ve kapanışta sabit `window/document/canvas` dinleyici tabanını, ayrıca iki dosya arasında gecikmiş eski chunk'ın yeni çizime girmemesini sınar. CDP 20 tur GC sonrası heap/DOM/listener örnekleri ve 10 tur legacy kontrolü F08 audit içinde; V2-only DOM 758→800 iken legacy kontrolünde 1.130→6.577 artışı ayrı tutulur. F08 peak/GPU/RSS/worker sidecar/P00 ROI ve geniş production kabulü **NOT_RUN**.

**F08 v61 yaşam döngüsü izi:** `cad-v2-layout-viewport.spec.ts` gerçek host'ta 20 SPA aç/kapat turunda 20 worker oluşturma/terminate ve 20 görünür session DELETE; 10 ardışık WebGL context loss/restore turunda frame gate, çizim pikseli ve tek chunk isteğini doğrular. Hedefli Chromium Playwright 2/2, runtime TSC PASS. StrictMode geliştirici koşusunda 40 prepare üretir; erken abort edilenlerin sunucu oturumu bu browser testinde çözümlenmez. File switch/stale generation, peak/plateau CPU-GPU/heap, P00 ROI ve fiziksel GPU açık; F08 **ACCEPTANCE NOT_RUN**. Ayrıntı `evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md` içinde.

**F08 v60 gerçek host izi:** `cache/chunk-spatial-scheduler.ts` en eski invisible resident chunk'ı seçer; `render/chunk-memory-accounting.ts` admission'ın renderer CPU byte katkısını döndürür; `cad-v2-host-shell.tsx` görünür küme, 64 MiB CPU/GPU budget, eviction cleanup, eski reddi yeniden deneme ve açık degraded/ready uyarısını yönetir. `cad-v2-layout-viewport.spec.ts` gerçek V2 host'ta 4 Model chunk yüküyle 3 accepted/1 rejected, `SHEET_A` sonrası invisible eviction, Model'e dönüşte refetch ve toplam 7 request doğrular. Hedefli budget/LRU + context recovery Playwright 2/2, cache/lifecycle unit, runtime TSC ve scoped code diff-check PASS. 20+10 döngü, fiziksel GPU, peak metrikleri, file switch ve R001 semantik ROI kanıtı açık; F08 **ACCEPTANCE NOT_RUN**.

**F08 v59 resident-budget izi:** `render/resource-memory-estimate.ts` renderer geometrilerindeki unique backing stores ve BufferAttribute/index upload byte tahminini sayar; `render/chunk-memory-accounting.ts` incoming chunk arrays/metadata payını ve ayrı 64 MiB CPU/GPU politikasını hesaplar. `cad-v2-host-shell.tsx` bu politikayı loaded geometry + retained refinement source + incoming chunk için çağırır; taşan chunk'ı sahneden çıkarıp generation boyunca reddeder ve degraded kalite bildirir. `host-lifecycle-cancellation.test.ts` accounting/boundary/overflow/invalid-metric assertions PASS; runtime TSC PASS. Browser recovery Playwright 1/1 PASS ama bütçe overflow fixture'ı değildir. Ölçüm gerçek peak CPU/RSS/browser heap/GPU allocation değildir; host LRU/eviction/reload ve 20+10 lifecycle acceptance açık. Ayrıntı `evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md` içinde; F08 **TODO/ACCEPTANCE NOT_RUN**.

**F08 v58 context recovery izi:** `RenderedFrameGate` + `CadV2Renderer.waitForNextRenderedFrame()` WebGL kaybı/dispose ve başarılı restore frame'ini ayırır. Host güncel generation, görünür manifest chunk'ları ve render edilmiş frame tamamlanmadan stable `ready/degraded` fazına dönmez. `host-lifecycle-cancellation.test.ts` ve targeted Chromium `WEBGL_lose_context` test PASS; frame hold sırasında loading ve canvas içerik geri gelişi/pixel sayımı doğrulandı. Bu bir simüle recovery'dir. 10 recovery, 20 open/close, fiziksel GPU, CPU/GPU byte bütçeleri ve host eviction/reload açık; F08 **TODO/ACCEPTANCE NOT_RUN**. Tam kapsam F08 audit dosyasında.

**F05 v57 / F08 ilk denetim:** `dxf-dimension-override-pairs.ts` kaynak grup 70/50 ve extension noktalarını handle ile okur; `dxf-adapter.ts` desteklenen kaynak türünü converter varsayımı yerine canonical DIMENSION'a uygular. `dimension-attribute.test.ts` aligned `A05A` ve rotated linear `D05A` çizgilerini sınar. F05 seçili LOCAL PASS, genel OPEN/PARTIAL. F08 `evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md` mevcut scheduler/host/renderer kaynak bağlantısı ve eksik yaşam döngüsü ölçümünü kaydeder; F08 **TODO/NOT_RUN**. Compiler/cache v67.

**F05 v56 iz:** `decode/dxf-dimension-override-pairs.ts` handle'lı planar linear/aligned kaynak `10/20`, `13/23`, `14/24`, `50` gruplarını okur; `dxf-adapter.ts` bunları eşleşen `objectId` DIMENSION alanlarına bağlar. `dimension-attribute.test.ts` D05A kaynak noktalarını ve `y=5`, `x=0..10` çizgisini doğrular; oblique `52=15` warning + scene degraded. `decoder-field-contract`, `cache-identity`, runtime TSC PASS. Compiler/cache v66; seçili profil LOCAL PASS, F05 OPEN/PARTIAL, native oracle NOT_RUN. Ayrıntı F05 acceptance v56 bölümünde.

**F05 v55 iz:** `decode/dxf-dimension-override-pairs.ts` kaynak `ACAD/DSTYLE` çiftlerini handle'a bağlı okur; `dxf-adapter.ts` kaynak `objectId` eşleşince seçili `DIMDEC/DIMLFAC/DIMSE1` override'ını canonical DIMENSION'a uygular. Komşu style peer korunur. Eşleşmeyen, desteklenmeyen/aralık dışı/handle'sız girdiler tanılı; bağlanamayan override scene'de degraded olur. `dimension-attribute`, `decoder-field-contract`, `cache-identity`, runtime TSC PASS; seçili per-entity LOCAL PASS, kaynak geometri/native oracle OPEN, F05 OPEN/PARTIAL. Ayrıntı F05 acceptance v55 bölümünde.

**F05 v54 güncel iz:** F05 plan maddelerinin sonlu kabul matrisi `evidence/fidelity-v3/F05/DIMENSION_ATTRIBUTE_ACCEPTANCE.md` üstündedir. Açısal literal override/`<>` derece biçimi `dimension-compiler.ts` v64 ve `dimension-attribute.test.ts` formatter+visitor assertions ile yerel PASS; per-entity override, gerçek annotative context, DWG/binary attribute/MLEADER ve R001 native oracle OPEN/NOT_RUN. R001 LibreDWG error 68 temiz decode değildir. F07 yerel 5/7 ile G5/G7 dış kanıtı ayrı kalır.

| Paket / amaç | Zorunlu işler | Bitiş kanıtı | Bağımlılık | Güncel durum |
|---|---|---|---|---|
| F05 / dimension ve annotation fidelity | Saved `*D`/sentez, altı ölçü türü, metin/style/per-entity override, annotative scale, ATTRIB instance, LEADER/MLEADER, R001 kıyası | `dimension-attribute.test.ts` seçili yerel profil; gerçek kaynak DIMENSION object context ve aynı kaynak AutoCAD metin/ok/geometri karşılaştırması | Temiz DWG decode veya bağımsız kaynak fixture; native AutoCAD R001 oturumu. Ayrıntılı sonlu satırlar F05 acceptance dosyasında | **OPEN/PARTIAL**: seçili yerel profiller PASS; annotative ve native NOT_RUN; error 68 temiz decode engeli |

[Kayıt dizini](uygulama__README.md) · [Gereksinim anlamları](24_GEREKSINIM_KATALOGU.md) · [Kanıt sistemi](20_KAYIT_VE_KANIT_SISTEMI.md) · [Fidelity v3 Kanıt Klasörü](evidence/fidelity-v3/)

---

## Fidelity v3 Paket İzlenebilirlik Tablosu

| Paket | Kapsam | İzinli Dosyalar | Test Dosyası / Komutu | Kanıt Yolu | Durum |
|---|---|---|---|---|---|
| **P00** | Başlangıç fotoğrafı, kapsam ve referans profili | Yok (salt dokümantasyon ve kanıt) | `node --import tsx C:/Users/hsyn/Downloads/cad-v2-plan-v3-audit.ts` | `motor_v2/evidence/fidelity-v3/P00/` (`baseline.json`, `reference-profile.json`, `scope.md`) | **PASS** |
| **P01** | En erken kayıp noktası ve gerçek kalite muhasebesi | `canonical/types.ts`, `decode/dwg-adapter.ts`, `decode/dxf-adapter.ts`, `compile/scene-compiler.ts`, `canonical/diagnostics.ts`, `scripts/cad-v2/audit-source-pipeline.ts` | `tests/cad-v2/provenance-quality.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/P01/` (`source-census.json`, `provenance-summary.json`) | **PASS** |
| **P02** | Transfer, manifest, worker ve host state doğruluğu | `cad-v2-host-shell.tsx`, `cad-v2-canvas.tsx`, `worker-client.ts`, `binary-protocol.ts`, `cad-v2-renderer.ts`, `cad-v2-scene-worker.ts` | `tests/cad-v2/manifest-validation.test.ts`, `chunk-completeness.test.ts`, `worker-generation.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/P02/failure-matrix.json` | **PASS** |
| **P03** | Kaynak/scene kimliği, bütünlük ve publish transaction | `cad-v2-durable-service.ts`, `scene-compiler.ts`, `version.ts`, `scene-identity.ts`, `scripts/cad-v2/run-v2-compiler-cli.ts` | `tests/cad-v2/cache-identity.test.ts`, `publish-atomicity.test.ts`, `durable-service.test.ts` (npm run check:cad-v2:unit / integration) | `motor_v2/evidence/fidelity-v3/P03/publish-transaction-audit.json` | **PASS** |
| **P04** | Gerçek decoder sözleşmesi: visibility, HATCH, ellipse, units | `decode/dwg-adapter.ts`, `decode/dxf-adapter.ts`, `canonical/types.ts`, `canonical/diagnostics.ts`, `compile/block-transformer.ts`, `compile/scene-compiler.ts` | `tests/cad-v2/decoder-field-contract.test.ts`, `visibility-units.test.ts`, `dwg-ownership.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/P04/` (`decoder-contract-audit.json`) | **PASS** |
| **P05** | OCS, affine stack, mirrored geometri ve bounds | `canonical/types.ts`, `compile/coordinate-transform.ts`, `decode/*-adapter.ts`, `compile/block-transformer.ts`, `geometry-compiler.ts`, `scene-compiler.ts` | `tests/cad-v2/affine-ocs.test.ts`, `bounds-provenance.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/P05/` (`affine-ocs-audit.json`, `bounds-provenance.json`) | **PASS** |
| **P06** | Ortak entity compiler, block text ve güvenli expansion | `compile/block-transformer.ts`, `scene-compiler.ts`, `geometry-compiler.ts`, `text/font-layout-engine.ts`, `canonical/types.ts`, `compile/entity-visitor.ts` | `tests/cad-v2/entity-instance-parity.test.ts`, `block-expansion-budget.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/P06/` (`entity-instance-parity.json`, `block-expansion-budget.json`) | **PASS** |
| **P07** | Gerçek sahne komutları, fill/maske ve kararlı çizim sırası | `protocol/binary-protocol.ts`, `compile/scene-compiler.ts`, `geometry-compiler.ts`, `canonical/types.ts`, `cad-v2-scene-worker.ts`, `worker-client.ts`, `cad-v2-renderer.ts`, `version.ts` | `tests/cad-v2/primitive-roundtrip.test.ts`, `hatch-topology.test.ts`, `painter-order.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/P07/` (`primitive-roundtrip.json`) | **PASS** |
| **P08** | R001 kök düzeltme kabulü | Yok (doğrulama/kabul paketi) | `scripts/cad-v2/audit-source-pipeline.ts`, `tests/cad-v2/r001-root-fix.test.ts` | `motor_v2/evidence/fidelity-v3/P08/ROOT_FIX_ACCEPTANCE.md` | **PASS** |
| **F01** | Renk, layer, transparency ve ekran renk uzayı | `compile/cad-color-resolver.ts`, `canonical/types.ts`, `compile/entity-visitor.ts`, `compile/scene-compiler.ts`, `decode/*-adapter.ts`, `render/cad-v2-renderer.ts` | `tests/cad-v2/style-resolution.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/F01/STYLE_RESOLUTION_ACCEPTANCE.md` | **PASS** |
| **F02** | Gerçek stroke, lineweight ve polyline width | `canonical/types.ts`, `render/cad-stroke.ts`, `compile/geometry-compiler.ts`, `compile/entity-visitor.ts`, `compile/block-transformer.ts`, `compile/scene-compiler.ts`, `render/cad-v2-renderer.ts` | `tests/cad-v2/stroke-width.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/F02/STROKE_WIDTH_ACCEPTANCE.md` | **PASS** |
| **F03** | Linetype, dash phase ve model/paper ölçeği | `canonical/types.ts`, `decode/*-adapter.ts`, `render/cad-stroke.ts`, `compile/geometry-compiler.ts`, `compile/scene-compiler.ts`, `compile/entity-visitor.ts`, `compile/block-transformer.ts`, `protocol/binary-protocol.ts`, `cad-v2-scene-worker.ts` | `tests/cad-v2/linetype-phase.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/F03/LINETYPE_PHASE_ACCEPTANCE.md` | **PASS** |
| **F04** | Font, TEXT, MTEXT ve Türkçe karakter doğruluğu | `canonical/types.ts`, `canonical/diagnostics.ts`, `decode/*-adapter.ts`, `text/font-layout-engine.ts`, `compile/block-transformer.ts`, `compile/entity-visitor.ts`, `compile/scene-compiler.ts` | `tests/cad-v2/font-style-layout.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/F04/FONT_STYLE_ACCEPTANCE.md` | **PASS** |
| **F05** | DIMENSION, ATTRIB/ATTDEF, LEADER ve annotation | `compile/dimension-compiler.ts`, `compile/entity-visitor.ts`, `compile/scene-compiler.ts`, `decode/*-adapter.ts`, `canonical/types.ts` | `tests/cad-v2/dimension-attribute.test.ts` (local synthetic override/constant/invisible/top-level mirror + ASCII DXF decoder INSERT/ATTRIB/ATTDEF binding + MLEADER unsupported diagnostic + R001 census) | `motor_v2/evidence/fidelity-v3/F05/DIMENSION_ATTRIBUTE_ACCEPTANCE.md` | **PARTIAL — Gate 5 alignment/nested mirror, DIMSTYLE, binary/DWG ATTRIB/MLEADER fixture and independent visual oracle open; Gate 5A/6A selected DXF profiles PASS** |
| **F06** | Layout, viewport, XCLIP ve bağımlılık sınırları | `layout/layout-manager.ts`, `decode/dxf-xclip-pairs.ts`, `decode/dwg-adapter.ts`, canonical layout/viewports, scene compiler, renderer | `tests/cad-v2/layout-viewport.test.ts` (AutoCAD-authored normal/inverted/off DWG; ASCII + native binary DXF; XCLIPFRAME ayrımı; malformed/front-depth fail-closed; paper/model ownership; clip exact-segment); `tests/cad-v2/layout-viewport-render.test.ts` (iki paper layout, reused model, rotated/polygon viewport, frozen layer/style override, missing XREF degraded, renderer layout state); `tests/document-studio/cad-v2-layout-viewport.spec.ts` (Playwright/Chromium V2 host, worker/binary chunk/WebGL canvas layout switch); `npm run check:cad-v2:release` | `motor_v2/evidence/fidelity-v3/F06/LAYOUT_VIEWPORT_ACCEPTANCE.md` | **PASS — tanımlı 2D kabul kapsamı. Genel AutoCAD parity değil; unsupported OCS/clip/depth fail-closed, unresolved XREF degraded; same-source reference render V01'de açık.** |
| **F07** | Yüksek koordinat hassasiyeti, curve/refinement ve zoom hata bütçesi | `compile/geometry-compiler.ts`, `compile/coordinate-transform.ts`, `compile/entity-visitor.ts`, `compile/block-transformer.ts`, `compile/dimension-compiler.ts`, `compile/scene-compiler.ts`, `render/render-order.ts`, `render/chunk-visibility.ts`, `render/cad-v2-renderer.ts`, `canonical/diagnostics.ts`, `render/cad-stroke.ts`, `protocol/binary-protocol.ts`, `worker/curve-refinement.ts`, `worker/apply-curve-refinements.ts`, `workers/cad-v2/cad-v2-scene-worker.ts`, `lib/cad-v2/worker/worker-client.ts`, `components/dokumantasyon/cad-v2/cad-v2-host-shell.tsx` | `tests/cad-v2/precision-refinement.test.ts`; `tests/cad-v2/chunk-error-accounting.test.ts` (XY/TRIANGLES vertex, PATH_DISTANCE scalar, affine CURVE_DATA source F32 quantization, direct top-level CIRCLE/ARC, ELLIPSE and direct+nested/transformed standalone non-periodic SPLINE chord sagitta world/CSS accounting ve statik HATCH fill-boundary tessellation ve aynı fill triangle Float32 nicemlemesi/bileşik hata bound'u, CSS dönüşümü, degraded tanılar ve worker bütçe düşümü); `tests/cad-v2/curve-refinement.test.ts` (refined PATH_DISTANCE chord-length phase mapping); `tests/cad-v2/chunk-scheduler-cache.test.ts` (compiled bbox/index/validator/scheduler, lineweight padding); `tests/cad-v2/layout-viewport-render.test.ts` (camera bbox, renderer pan/layout viewport culling, legacy fail-open); `tests/cad-v2/manifest-validation.test.ts`; `tests/cad-v2/painter-order.test.ts`; `tests/cad-v2/worker-refinement-browser.test.ts`; remaining curve/stroke/protocol tests; `npm run check:cad-v2:unit`; `npm run check:cad-v2:ui` | `motor_v2/evidence/fidelity-v3/F07/PRECISION_REFINEMENT_ACCEPTANCE.md`, `RUNTIME_REFINEMENT_ARCHITECTURE.md` | **IN_PROGRESS — Lineweight-conservative bbox, XY/TRIANGLES, affine CURVE_DATA source, and PATH_DISTANCE Float32 quantization measurements flow into flat/index manifests; runtime refinement preserves interval endpoint phases and distributes intermediate PATH_DISTANCE by emitted chord length. PATH_DISTANCE is not consumed by the current renderer, so rendered dash parity remains open. Host provides bbox to camera-driven renderer culling with legacy fail-open. Sequential count partition/eager fetch, GPU/output transform and remaining tessellation, HATCH fill topology/runtime remesh ve diğer geometriler için bileşik hata muhasebesi, glyph/chunk-boundary accounting, periodic AutoCAD spline profile and same-source AutoCAD oracle remain open.** |
| **F08** | Bellek, performans ve yaşam döngüsü doğruluğu | F08 plan allowlist'i | F08 kabul testleri | `motor_v2/evidence/fidelity-v3/F08/` | TODO / ACCEPTANCE NOT_RUN |
| **R01** | Production hazırlama ve çok süreç dayanıklılığı | V2 service, DB repository, API routes | `tests/cad-v2/durable-multiprocess.test.ts`, `api-revision-auth.test.ts` (`npm run check:cad-v2:integration`) | `motor_v2/evidence/fidelity-v3/R01/` (`R01_MULTIPROCESS_DURABILITY_ACCEPTANCE.md`, `multiprocess-durability-audit.json`) | **LOCAL PASS** (Çoklu süreç izolasyonu, crash kill, stale lease, unobserved cancellation, 409 revizyon, SSRF ve traversal testleri PASS; hosting erişimi yok, deploy korunuyor) |
| **V01** | Son kabul ve release adayı | Yok (nihai kabul ve release raporu) | `tests/cad-v2/v01-release-candidate.test.ts`, `accuracy-performance-acceptance.test.ts`, `npm run check:cad-v2:release` | `motor_v2/evidence/fidelity-v3/V01/` (`ACCEPTANCE_MATRIX.md`, `RELEASE_CANDIDATE.md`, `atlas-support-matrix.json`) | **LOCAL PASS / RC1** (14 kapı denetimi, 26 entity destek atlası, R001–R004 corpus doğrulaması tamamlandı; bağımsız AutoCAD oracle ve fiziksel Poco X6 Pro NOT_RUN açık) |

---

## Tarihsel R01–R48 İndeksi (EXEC-2 / Düzeltme Planı Kaydı)

Tarihsel kayıtlar korunmuştur.

| R | G | Kaynak dosya / sembol | Gerçek test / oracle | RUN / ART / SNAP | Uygulama | Test sonucu | Astra denetimi |
|---|---|---|---|---|---|---|---|
| R01 | G00,G13,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R02 | G13 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R03 | G02,G11 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R04 | G02 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R05 | G03,G06 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R06 | G06 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R07 | G05,G08 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R08 | G07 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R09 | G07,G09 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R10 | G08 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R11 | G08,G10 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R12 | G06,G09 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R13 | G09 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R14 | G09,G11 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R15 | G02,G09,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R16 | G03,G06 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R17 | G03,G10 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R18 | G11 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R19 | G11,G14 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R20 | G10,G11 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R21 | G05,G10,G11 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R22 | G05 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R23 | G12 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R24 | G05,G12 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R25 | G04,G12,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R26 | G12,G14 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R27 | G11,G12 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R28 | G03,G10,G12 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R29 | G01,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R30 | G12,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R31 | G01,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R32 | G04,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R33 | G04,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R34 | G04,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R35 | G04,G12,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R36 | G13 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R37 | G14 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R38 | G13,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R39 | G02,G07,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R40 | G00,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R41 | G00,G17 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R42 | G04,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R43 | G11,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R44 | G15,G17 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R45 | G05,G08,G10 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R46 | G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R47 | G11,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R48 | G17 ve denetim turları | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |

## F07 son izlenebilirlik güncellemesi (2026-09-24)

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Nested/transformed LWPOLYLINE BULGE static fallback centerline chord sagitta | `compile/geometry-compiler.ts`, `compile/entity-visitor.ts`, `compile/scene-compiler.ts`, `protocol/binary-protocol.ts`, `canonical/diagnostics.ts`, `version.ts` | `tests/cad-v2/chunk-error-accounting.test.ts`: `bulge=1`, `R=20` exact circle formula; iki nested seviye 2×3 + mirrored 4×1/rotation; 20.001 dense samples; cap, XCLIP, flat/index/validator | **PASS —** v23→v24; `DV2SCN01` schema v1 değişmedi. Yalnız continuous, widthless centerline fallback sagitta'sı. |

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Applied runtime refinement Float32 XY buffer CSS-space deviation + apply-bound validation | `worker/apply-curve-refinements.ts`, `worker/curve-refinement.ts`, `render/cad-v2-renderer.ts` | `tests/cad-v2/curve-refinement.test.ts`: high-origin compiled CIRCLE → worker refine → production apply → 20.001 exact-source samples projected through chunk-origin/camera offset + CSS units; invalid bound/NaN reject | **PASS —** ≤0.25 CSS px geometric buffer deviation; conservative worker metric covers measurement. Raster WebGL/device-pixel output and AutoCAD same-source oracle remain open; no compiler/cache revision. |

Bu dar PASS F07'yi kapatmaz. Periodic SPLINE AutoCAD fixture/desteği ve degree-2 çoklukları 1/2, degree-3 çoklukları 1/2/3, degree-4 çoklukları 1/2/3/4 ve degree-5 çoklukları 1/2/3/4/5 profilleri dışındaki knot/degree profilleri; HATCH runtime remesh/topology; bounded spatial partition/on-demand chunk yükleme; fill/glyph/chunk-boundary ve kalan bileşik hata muhasebesi; WebGL raster/device-pixel düzeyinde runtime-refined rendered error; aynı kaynak AutoCAD görüntü/ölçü oracle'ı açık kalır. F07 **IN_PROGRESS**; plan **14/19 (%74)**, **5/19 (%26)** paket açık.

### Nested affine runtime-buffer oracle'ı — 2026-09-24

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Nested/transformed CIRCLE, ARC, ELLIPSE, BULGE runtime-refined XY buffer | `worker/apply-curve-refinements.ts`, `tests/cad-v2/curve-refinement.test.ts` | 2 seviyeli INSERT altında 10 span; mirrored/non-uniform instance; apply sonrası vertex-shifted endpoint-pair slice; worker Float32 nokta eşitliği; span başına 20.001 sidecar-source örneği | **PASS —** ≤0.2 CSS px; conservative worker metric ölçümü kapsar. Nested SPLINE/HATCH, WebGL raster/device-pixel ve AutoCAD same-source oracle'ı açık. Compiler revision/cache değişmedi (v24), schema v1. |

Toplam plan **14/19 (%74)**, **5 paket (%26)** açık; F07 **IN_PROGRESS**.

### Direct/nested rational SPLINE runtime-buffer oracle'ı — 2026-09-24

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Direct ve nested non-periodic rational quadratic SPLINE post-apply XY | `worker/apply-curve-refinements.ts`, `tests/cad-v2/curve-refinement.test.ts` | 6 knot-span; mirrored/non-uniform INSERT; apply sonrası reindexed endpoint-pair extraction; worker Float32 birebirliği; span başına 20.001 rational Bezier samples | **PASS —** ≤0.2001 CSS px ve worker conservative bound kapsaması. Periodic spline/knot multiplicity, HATCH, raster/device-pixel ve AutoCAD oracle'ı açık; compiler revision/cache değişmedi (v24), schema v1. |


### Direct/nested HATCH ARC/BULGE/ELLIPSE post-apply boundary buffer oracle'ı — 2026-09-24

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| HATCH curved boundary source'larının runtime-refined renderer XY buffer'ı | worker/apply-curve-refinements.ts, tests/cad-v2/curve-refinement.test.ts | 5 direct/nested span; apply sonrası vertex-delta reindex; worker Float32 birebirliği; her affine source'a 20.001 örnek | **PASS —** ≤0.2001 CSS px; conservative worker bound ölçümü kapsar. Bu HATCH fill remesh/topology değildir. HATCH SPLINE post-apply, periodic SPLINE/knot multiplicity, spatial partition/on-demand loading, fill/glyph/chunk-boundary kalan composite accounting, WebGL raster/device-pixel ve same-source AutoCAD oracle'ları açık. Compiler/cache değişmedi (v24), schema v1. |

F07 **IN_PROGRESS**; toplam plan **14/19 (%74)**, **5 paket (%26)** açık.


### Direct/nested HATCH rational SPLINE post-apply boundary buffer oracle'ı — 2026-09-24

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| HATCH non-periodic rational SPLINE boundary'nin runtime-refined renderer XY buffer'ı | worker/apply-curve-refinements.ts, tests/cad-v2/curve-refinement.test.ts | 4 knot-span; iki direct ve bir nested mirrored/non-uniform INSERT; apply sonrası vertex-delta reindex; worker Float32 birebirliği; span başına 20.001 rational Bezier örneği | **PASS —** ≤0.2001 CSS px; conservative worker bound ölçümü kapsar. XCLIP/cap fail-closed kontrolleri mevcut testte sürer. HATCH fill remesh/topology, periodic SPLINE/knot multiplicity, spatial partition/on-demand loading, fill/glyph/chunk-boundary bileşik muhasebe, PATH_DISTANCE rendered dash, raster/device-pixel ve same-source AutoCAD oracle'ları açık. Compiler/cache değişmedi (v24), schema v1. |

F07 **IN_PROGRESS**; toplam plan **14/19 (%74)**, **5 paket (%26)** açık.

## F07 izlenebilirlik — curved-line encoded geometry composite (2026-09-24)

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Aynı curved line primitive'inde static chord sagitta + XY Float32 endpoint round-trip error | `compile/scene-compiler.ts`, `protocol/binary-protocol.ts`, `canonical/diagnostics.ts`, `version.ts` | `chunk-error-accounting.test.ts`: 1e9 origin / 1e8 radius CIRCLE; emitted segment count'undan analitik `R(1-cos(π/n))` sagitta; emitted XY + ORIGIN endpoint ölçümü; flat/index/validator/negative/conflict ve screen budget | **PASS —** ayrı terimler hedef altında, toplam hedef üstünde; diagnostic ile `degraded`. Compiler/cache v24→v25, schema v1. Yalnız statik curved-line fallback. |
| Curved HATCH boundary line chord sagitta + aynı line Float32 endpoint bileşik bound'u | `compile/geometry-compiler.ts`, `compile/entity-visitor.ts`, `compile/scene-compiler.ts`, `version.ts` | `chunk-error-accounting.test.ts`: büyük koordinat ARC semicircle; analitik `R(1-cos(π/(2n)))`; emitted XY + ORIGIN; nested two-level INSERT scale/reflection/rotation; paper viewport single-scale fixture; XCLIP-visible fragment | **PASS —** sagitta ve encoding ayrı ayrı 0.25 CSS px içinde, same-chord toplamı hedef dışında; nested bound INSERT singular scale'ini alır; viewport ölçeği bir kez eklenir; XCLIP source bound'u taşınmaz. Compiler/cache v25→v26, schema v1. Fill TRIANGLES/remesh kapsam dışı. |

## F07 izlenebilirlik — non-periodic rational SPLINE knot multiplicity oracle'ı (2026-09-24)

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Pozitif ağırlıklı non-periodic rational SPLINE: degree-2 iç knot çoklukları 1/2; degree-3 çoklukları 1/2/3; degree-4 çoklukları 1/2/3/4; degree-5 çoklukları 1/2/3/4/5 | `tests/cad-v2/precision-refinement.test.ts`: `testSplineInternalKnotMultiplicityAgainstIndependentDeBoorOracle` | 14 sentetik profil; bağımsız homojen De Boor evaluator; profil başına 20.001, toplam 280.014 kaynak örneği; iç knot noktalarının emitted polyline'da tutulması | **PASS —** kaynak-polyline sapması ≤0.03 world unit ve raporlanan `maxSagittaWorld`. Diğer degree/knot profilleri, periodic SPLINE AutoCAD fixture/desteği ve evaluator kıyası açık. Yalnız test değişti; compiler/cache v26, schema v1. |
| Nested mirrored/non-uniform LWPOLYLINE BULGE same-chord sagitta + XY Float32 endpoint composite | `compile/entity-visitor.ts`, `compile/scene-compiler.ts`, `tests/cad-v2/chunk-error-accounting.test.ts`: `testNestedBulgeTessellationErrorIncludesInsertTransforms` | İki seviyeli 8× affine INSERT; chord başına analytic transformed endpoint ↔ serialized `ORIGIN + XY` round-trip ölçümü; per-chord sagitta + endpoint maksimumu; 20.001 source sample, CSS/world, cap, XCLIP, flat/index validator | **PASS —** per-chord maximum `maxCurveEncodedGeometryErrorWorld/CssPixels` manifest ile eşleşir; test-only, compiler/cache v26 ve schema v1 sabit. Bu tek continuous widthless BULGE chord familyasıdır; residual cross-source/chunk/fill/glyph/runtime composite açık. |
| Nested non-uniform INSERT cubic SPLINE same-chord sagitta + XY Float32 endpoint composite | `compile/entity-visitor.ts`, `compile/scene-compiler.ts`, `tests/cad-v2/chunk-error-accounting.test.ts`: `testNestedSplineTessellationErrorIncludesInsertTransforms` | İki seviyeli 8× affine; source parameter aralıklarında cubic Bernstein endpoint ve türev oracle'ı; subcurve control-hull sagitta; chord başına serialized `ORIGIN + XY` endpoint error; CSS/world, cap, XCLIP | **PASS —** control-hull sagitta + aynı chord endpoint loss maksimumu manifest composite world/CSS ile eşleşir. Test-only; revision v26/schema v1 sabit. Periodic/AutoCAD SPLINE, other-source/chunk/fill/glyph ve rendered-pixel composite'leri açık. |
| Direct top-level ELLIPSE same-chord sagitta + XY Float32 endpoint composite | `tests/cad-v2/chunk-error-accounting.test.ts`: `testEllipseCurveTessellationErrorIsMeasuredAndBudgeted` | Analitik uniform interval sayısı ve `|majorVector| × Δt² / 8`; chord başına exact ellipse endpoints ↔ serialized `ORIGIN + XY`; target yakınındaki ayrı-term-fit / sum-overrun; CSS/world, cap, flat/index validator | **PASS —** en büyük analytic sagitta + aynı chord endpoint round-trip loss manifest/hash-index world/CSS composite ile eşleşir ve target aşımında degraded diagnostic üretir. Test-only; compiler/cache v26/schema v1 sabit. Nested ELLIPSE ve kalan composite/görsel kapıları açık. |
| Nested non-uniform INSERT ELLIPSE same-chord sagitta + XY Float32 endpoint composite | `compile/entity-visitor.ts`, `compile/scene-compiler.ts`, `tests/cad-v2/chunk-error-accounting.test.ts`: `testNestedEllipseTessellationErrorIncludesInsertTransforms` | İki seviyeli 8× singular value; analitik interval/endpoints ve chord başına serialized `ORIGIN + XY`; world/CSS, flat/index, budget diagnostic, paper viewport 0.15 ve partial XCLIP | **PASS —** world sagitta birleşik INSERT ölçeğiyle büyütülür, paper viewport bir kez uygulanır, same-chord composite manifest/hash-index ile eşleşir; XCLIP parçası kaynak bound'u taşımaz. Revision v26→v27, schema v1. Yalnız bu nested profil kapanır. |
| Döndürülmüş TEXT glyph stroke uç noktalarının Float32 XY nicemleme hata muhasebesi | `tests/cad-v2/chunk-error-accounting.test.ts`: `testTextGlyphEndpointsContributeToEncodedQuantizationBudget`; mevcut genel `scene-compiler.ts` vertex quantization lane'i | Türkçe glyph içeren, döndürülmüş/yüksek koordinatlı TEXT; `FontLayoutEngine` source stroke uçları; bağımsız bbox midpoint + `Math.fround` endpoint round-trip hesabı; flat/index/validator ve CSS bütçe/degraded kontrolü | **PASS —** bütün glyph stroke endpoint round-trip maksimumu chunk `maxQuantizationErrorWorld/CssPixels` alanıyla eşleşir ve hedef aşımında mevcut tanı kaliteyi degraded yapar. Yalnız encoding muhasebesi; glyph outline/AutoCAD şekil paritesi veya runtime refinement değildir. Test-only; compiler/cache v27 ve schema v1 sabit. |

HATCH fill runtime remesh/topology, glyph outline/refinement ve cross-primitive/chunk-boundary composite terms, visible PATH_DISTANCE dash, GPU raster/device-pixel ve same-source AutoCAD oracle'ı açık kalır. F07 **IN_PROGRESS**; plan **14/19 (%74)**, **5 paket (%26)** açık.

## F07 açık kapı yeniden kontrolü — 2026-09-24

| Kapı | Mevcut kod/test kanıtı | Durum |
|---|---|---|
| Periodic SPLINE + knot/AutoCAD oracle | Periodic spline testinde fail-closed/empty output; 14 degree-2–5 knot profili synthetic non-periodic. AutoCAD-authored periodic fixture ve evaluator karşılaştırması yok. | **OPEN** |
| HATCH runtime fill remesh/topology | `curve-refinement.test.ts` HATCH ARC/BULGE/ELLIPSE/SPLINE boundary output'larını ölçer; fill TRIANGLES compiler'da üretilir, worker fill remesh/topology kabul testi yok. | **OPEN** |
| Bounded spatial partition / camera-driven on-demand fetch | Manifest chunk bbox, renderer camera culling ve sınırlı scheduler/LRU kodu/testi mevcut; fakat `SpatialChunkScheduler` host akışında çağrılmıyor. `CadV2HostShell` başlangıçta bütün chunk'ları indiriyor; yalnız concurrency sınırı uygulanıyor. | **OPEN —** mevcut bbox/culling ve scheduler unit kapsamı F07 runtime refinement için on-demand fetch kanıtı değildir. |
| Kalan composite error | CIRCLE, curved HATCH boundary, direct/nested ELLIPSE, nested BULGE/SPLINE seçili same-chord kontrolleri; TEXT glyph endpoint quantization için dar oracle var. Cross-source/chunk, fill ve glyph outline/refinement toplamları hâlâ kapsanmıyor. | **OPEN** |
| Runtime-refined rendered error | Uygulanmış worker buffer için CPU/CSS projection bound testleri var; WebGL raster/anti-alias/device-pixel ölçümü yok. | **OPEN** |
| Same-source AutoCAD visual/measurement | F07 acceptance testlerinde eşleşen AutoCAD kaynak dosyası üzerinde görüntü/ölçü kıyası yok. | **OPEN** |

Doğrudan ELLIPSE checkpoint'i test-only idi; sonraki nested ELLIPSE v27 checkpoint'i compiler/cache metadata'sını değiştirdi. Nested ELLIPSE için yalnız belirtilen 8× INSERT/paper/XCLIP profili ölçülmüştür. F07 **IN_PROGRESS** ve toplam plan **14/19 (%74)**, **5/19 (%26)** paket açık kalır.

## F07 izlenebilirlik — TEXT glyph endpoint encoding (2026-09-24)

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Gerçek TEXT glyph stroke uçlarının Float32 endpoint nicemleme hatası | `compile/scene-compiler.ts` mevcut genel XY quantization metriği; `tests/cad-v2/chunk-error-accounting.test.ts`: `testTextGlyphEndpointsContributeToEncodedQuantizationBudget` | Döndürülmüş/yüksek koordinatlı Türkçe TEXT; FontLayoutEngine source endpoints; bağımsız bounds midpoint + `Math.fround`; flat/index/validator, CSS budget ve degraded diagnostic | **PASS —** endpoint maksimumu `maxQuantizationErrorWorld/CssPixels` ile eşleşir. Yalnız encoding; font outline, runtime glyph refinement ve cross-chunk bileşik hata açık. Test-only, revision v27/schema v1 sabit. |

F07 açık kapı güncellemesi: glyph stroke endpoint encoding muhasebesi için bağımsız test eklendi; glyph outline/AutoCAD eşdeğerliği, MTEXT/dimension varyantları, runtime refinement ve chunk-boundary kompozisyonu hâlâ kanıtlanmadı. Diğer açık kapılar: periodic SPLINE AutoCAD fixture/knot oracle'ı, HATCH fill runtime remesh/topology, host'a bağlı on-demand partition/fetch, kalan fill/glyph/chunk composite'leri, visible dash, WebGL raster/device-pixel ve same-source AutoCAD ölçü/görüntü.

### 2026-09-24 — Tek kaynak ARC'ın chunk seam hata zarfı

- **Dar kabul:** Ardışık aynı-kaynak circular ARC chord'ları ayrı chunk'lardadır; analitik endpoint/sagitta ve Float64 ORIGIN + Float32 XY decode hataları, ortak kaynak vertex'teki seam gap'i, manifest/hash-index/validator aktarımı. **Oracle:** testCurveEndpointRoundTripSeamIsBoundedAcrossChunks; compile/scene-compiler.ts içindeki mevcut tessellation ve composite alanları. **Sonuç: PASS** — seam iki komşu endpoint hata toplamı ve komşu local composite sınırları içinde. Genel chunk boundary/cross-source/clip/fill/glyph muhasebesi açık; test-only, revision v27/schema v1 sabit. F07 IN_PROGRESS, plan 14/19 (%74), 5/19 (%26) açık.

### 2026-09-24 — farklı LINE kaynaklarının chunk seam hata zarfı

Dar kabul: 1e9 koordinatlarında tam ortak vertex paylaşan iki ayrı LINE kaynağı ayrı chunk'lara derlenir. Oracle: testCrossSourceLineSeamIsBoundedAcrossChunks; chunk-local bounds midpoint, Float32 offset, decode endpoint round-trip ve CSS ölçeği bağımsız ölçülür. Sonuç: PASS — ölçülen seam gap iki ortak endpoint hata toplamı ve adjacent generic chunk quantization toplamı içinde; index/manifest aktarımı kontrol edilir. Kapsam iki LINE ile sınırlıdır; line-curve, clipping, fill/glyph ve genel chunk boundary composite'leri açık. Test-only, revision v27/schema v1 sabit; F07 IN_PROGRESS, plan 14/19 (%74), 5/19 (%26) açık.

### 2026-09-24 — LINE→ARC farklı kaynak seam ve ilk chord composite'i

Dar kabul: bir LINE kaynağının tam uç noktası ayrı ARC kaynağının analitik başlangıcıdır; her biri bağımsız chunk origin'iyle kodlanır. Oracle: testLineToArcSourceSeamIsBoundedAcrossChunks; local midpoint ORIGIN ve Float32 endpoint'leri bağımsız tekrar hesaplanır, seam boşluğu iki endpoint hatasıyla ölçülür, ilk ARC chord sagitta + endpoint composite'i world/CSS alanlarıyla eşleştirilir. Sonuç: PASS — seam endpoint envelope ve komşu local hata sınırları içinde; hash-index composite ve manifest dizisi doğrulanır. Yalnız bu tek yönlü LINE→ARC profili; genel cross-source/chunk, clip/fill/glyph ve diğer curve birleşimleri açık. Test-only, revision v27/schema v1 sabit; F07 IN_PROGRESS, plan 14/19 (%74), 5/19 (%26) açık.


### 2026-09-24 — WebGL'de önceden tessellate edilmiş dash görünürlüğü

Dar kabul: synthetic DV2SCN01 fixture'ının XY bölümüne kodlanmış beş kırmızı stroke ve dört boşluğun gerçek WebGL canvas screenshot'ında piksel örneklemesi. Oracle: pre-tessellated DASHED segments appear as alternating strokes and gaps in the WebGL frame; sonuç tam 5 kırmızı aralık, 4 boşluk ve minimum 8 px üstü gap — PASS. Binary fixture beklenen PATH_DISTANCE lane'ini korur, fakat mevcut renderer lane'i okumaz; bu nedenle dash phase/PATH_DISTANCE shader tüketimi veya compiler-to-renderer uçtan uca dash kabulü değildir. Hedefli Chromium 1/1, unit, UI/Chromium 3/3, runtime typecheck ve diff-check PASS; worker bundle hash'leri koruma kopyalarıyla aynı. Test-only, revision v27/schema v1 sabit. Runtime-refined device-pixel ve AutoCAD same-source oracle'ları ile diğer F07 kapıları açık; F07 IN_PROGRESS, plan 14/19 (%74), 5/19 (%26) açık.

### 2026-09-24 — gerçek compiler DASHED chunk'ının WebGL görünürlüğü

Dar kabul: canonical LINE ve özel [24,-16] dash pattern'i compileCanonicalToScene ile derlenir; gerçek compiler manifest/chunk'ı test browser'ına sunulur. Oracle, PATH_DISTANCE'ın beklenen 0/24/40/.../184 kümülatif değerlerini ve screenshot'taki beş kırmızı aralık/dört boşluğu doğrular. Sonuç: PASS — compiler-generated tessellated dash geometry Chromium WebGL pikselinde görünür. Renderer PATH_DISTANCE lane'ini tüketmiyor; shader lane/faz hesaplaması, runtime refine sırasında faz kararlılığı ve chunk seam sürekliliği bu dar oracle'ın dışında. Hedefli Chromium 1/1, unit, UI/Chromium 3/3, runtime typecheck ve diff-check PASS; child compiler timeout-bounded, worker hash'leri değişmedi. Test-only, compiler/cache v27/schema v1 sabit. F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) açık.


## 2026-09-24 — F07 compiled DASHED chunk partition evidence

Evidence: `tests/cad-v2/f07-dash-render-scene.ts` compiles one canonical DASHED source into single-chunk and five-chunk manifests/binaries; `tests/document-studio/cad-v2-layout-viewport.spec.ts` serves both to Chromium and compares actual WebGL canvas pixels. The test checks `[0,24,40,64,80,104,120,144,160,184]` path distances, five red dash runs/four gaps in both scenes, and identical full canvas PNG SHA-256 plus run/gap intervals. Targeted 1/1 and full UI 3/3 passed; full unit, runtime typecheck, and diff-check also passed. This evidence supports only pre-tessellated LINE visibility under this tested chunk split. It does not support PATH_DISTANCE shader use, general phase behavior, runtime-refined pixel error, or AutoCAD parity. Test-only: revision v27/schema v1.

The plan remains 14/19 (74%), with 5/19 (26%) packages open. Periodic SPLINE fixture/evaluator and knot parity, HATCH fill runtime remesh/topology, host-integrated bounded/on-demand chunks, residual fill/glyph/chunk-boundary composites, PATH_DISTANCE GPU consumption, refined WebGL/device-pixel error, and same-source AutoCAD visual/measurement evidence remain unclosed.


## 2026-09-24 — direct LINE / nested BULGE source-seam evidence

Evidence: `testLineToNestedBulgeSourceSeamIsBoundedAcrossChunks` in `tests/cad-v2/chunk-error-accounting.test.ts`. It compiles a direct LINE joined exactly to a BULGE inside two INSERT levels with reflection/non-uniform scale and rotation; every primitive has a separate chunk origin. Its independent circle/affine oracle checks the transformed sagitta, each serialized Float32 endpoint loss, every chunk's world/CSS same-chord composite, and 20,001 transformed source samples. The actual decoded seam must fit both measured endpoint errors and adjacent chunk/composite bounds. Hash-index and manifest validation also retain the values. Targeted test, full CAD V2 unit, UI/Chromium 3/3, runtime typecheck, and diff-check passed. Scope is this one forward join profile; it does not close general chunk seams, fill/glyph boundaries, runtime WebGL pixel error, or AutoCAD parity. Test-only, revision v27/schema v1 unchanged.

F07 remains 14/19 (74%) with 5/19 (26%) packages open. Periodic SPLINE fixture/evaluator and periodic knot parity, HATCH runtime fill remesh/topology, host-integrated bounded/on-demand chunks, residual fill/glyph/chunk composites, PATH_DISTANCE shader consumption, runtime-refined device-pixel error, and same-source AutoCAD visual/measurement evidence remain unclosed.

## 2026-09-24 — ARC→LINE cross-source chunk seam

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| ARC'ın ardından gelen, ARC'ın analitik son vertex'inden başlayan ayrı LINE kaynağında chunk seam | tests/cad-v2/chunk-error-accounting.test.ts: testArcToLineSourceSeamIsBoundedAcrossChunks; production compiler değişmedi | Her chord/LINE için bağımsız local bounds midpoint + Float32 offset, decode endpoint hataları, son-chord circular sagitta + endpoint composite, world/CSS, hash-index ve manifest validator | PASS — ölçülen seam ortak uç kaybı ve adjacent chunk/composite sınırları içinde. Targeted/full unit, runtime typecheck, UI Chromium 3/3 ve diff-check geçti. Test-only; revision v27/schema v1 sabit. Genel cross-source/chunk, fill/glyph, runtime raster ve AutoCAD kapıları açık. |

F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) paket açık. Periodic SPLINE AutoCAD fixture/knot oracle'ı, HATCH fill remesh/topology, host on-demand partition, kalan bileşik hata, PATH_DISTANCE shader tüketimi, runtime-refined device-pixel ve same-source AutoCAD visual/measurement kapıları açık.

## 2026-09-24 — nested BULGE→LINE reverse seam

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| İki seviyeli mirrored/non-uniform INSERT altındaki BULGE'nin son chord'u ile sonraki top-level LINE arasında chunk sınırı | tests/cad-v2/chunk-error-accounting.test.ts: testNestedBulgeToLineSourceSeamIsBoundedAcrossChunks | Bağımsız semicircle endpoint/sagitta ve 8× affine oracle; chunk midpoint ORIGIN + Float32 round-trip; son chord composite; measured seam endpoint envelope; CSS/world, hash-index, manifest validation | PASS — ölçülen seam, ortak endpoint kayıpları ve komşu chunk/composite bound'ları içinde. Hedefli accounting, full unit, runtime typecheck, UI Chromium 3/3 ve diff-check geçti. Test-only; compiler/cache v27/schema v1 sabit. Yalnız bu ters yönlü nested profile; genel chunk/fill/glyph/raster/AutoCAD kapıları açık. |

F07 IN_PROGRESS, plan 14/19 (%74), 5/19 (%26) paket açık. Periodic SPLINE AutoCAD/evaluator/knot, HATCH fill remesh/topology, host on-demand partition, kalan fill/glyph/chunk-boundary composite'leri, PATH_DISTANCE shader, runtime rendered device-pixel ve same-source AutoCAD ölçü/görüntü kabul kapıları açık.


## 2026-09-24 — runtime-refined WebGL pixel-distance oracle

- Dar kabul: Idle refinement hedefi 0.25 CSS px'e geldiğinde gerçek CAD V2 WebGL canvas'ındaki quarter-circle rasterının kaynak yayla iki yönlü uzaklığı.
- Bağımsız oracle: Chromium screenshot'ından 494 renkli piksel merkezi; fit kamera üzerinden analitik yay izdüşümü; rendered→source maksimumu 0.9677 CSS px. Her 0.5 CSS px'te örneklenen kaynak yay→rendered maksimumu 0.7497 CSS px. Her ikisi 0.25 px refinement + 1 px raster payı = 1.25 CSS px altında.
- Doğrulama: Hedefli Chromium 1/1, tam CAD V2 unit, UI/Chromium 3/3, runtime typecheck ve git diff --check PASS; worker SHA-256 değerleri aynı. Test-only, compiler/cache v27 ve schema v1 değişmedi.
- Sınır: Bir quarter-circle ve 1280×672 Chromium canvas profili. Genel geometri/zoom/DPR/device rendered hata, fill/glyph/chunk composite'leri ve AutoCAD parity açık. F07 IN_PROGRESS, 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-24 — centered 125% runtime-rendered error profili

- Dar kabul: Önceki fit-camera screenshot ölçümüne ek olarak 125% UI zoom'da aynı quarter-circle'in gerçek WebGL raster/kaynak uzaklığı.
- Refinement: Zoom sonrası worker transient hedef 0.75 CSS px'i, ardından idle hedef 0.25 CSS px'i yanıtları teslim edilerek tamamlar. Kamera ölçeği UI 125% ve bağımsız fit U/1.25 ile kontrol edilir.
- Oracle: 610 renkli piksel; maksimum render→source uzaklığı 0.9612 CSS px, 0.5 px aralıklı source→render maksimumu 0.7642 CSS px. Her ikisi 1.25 px sınırında. Fit profiliyle beraber iki centered scale geçmiştir.
- Kontroller: Hedefli Chromium 1/1, full CAD V2 unit, UI/Chromium 3/3, runtime typecheck, diff-check PASS; worker hash'leri aynı. Test-only, v27/schema v1.
- Sınır: Higher zoom, pan camera, DPR/device, geometry/fill/glyph/chunk çeşitleri ve AutoCAD oracle'ı açık; diğer F07 gate'leri açık. F07 IN_PROGRESS, plan 14/19 (74%), 5/19 (26%) açık.


## 2026-09-24 — centered 80% runtime-refined raster profile

- Dar kabul: Mevcut gerçek WebGL quarter-circle screenshot oracle'ını centered 80% zoom-out ölçeğinde tekrarla.
- Refinement/oracle: UI 80%; transient 0.75 ve idle 0.25 CSS px yanıtları teslim edilir, bounded quiet/drain döngüsü sonrası screenshot. Bağımsız u=fitU/0.8=0.2055921053 world/CSS px.
- Ölçüm: 399 piksel; render→source maksimum 0.9819 CSS px, 0.5 CSS px aralıklı source→render maksimum 0.7193 CSS px. 1.25 CSS px eşiğinin altında. Üç centered profil: fit 494 px 0.9677/0.7497, 80% 399 px 0.9819/0.7193, 125% 610 px 0.9612/0.7642 (render→source/source→render).
- Kontroller: Hedefli Chromium 1/1, tam CAD V2 unit, UI/Chromium 3/3, runtime typecheck ve diff-check PASS; worker hash'leri aynı. Test-only; compiler/cache v27 ve schema v1 sabit.
- Sınır/açık kapılar: Tek sentetik quarter-circle, üç centered zoom, tek Chromium raster context. Higher zoom, pan, DPR/device, entity/fill/glyph/chunk çeşitleri, genel rendered hata ve AutoCAD same-source oracle'ı açık. Periodic SPLINE AutoCAD/evaluator/knot multiplicity, HATCH runtime remesh/topology, host bounded/on-demand partition/chunk yükleme, kalan composite error ve shader PATH_DISTANCE tüketimi açık. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-24 — translated 125% runtime-refined raster profile

- Dar kabul: Mevcut iki yönlü WebGL arc oracle'ını aynı idle 125% camera bucket'ında kontrollü pan sonrasında ölç.
- Kamera/oracle: Pointer drag +48,+24 CSS px; D3 dönüşümü aynı screen-space translation'ı verir. u=0.1315789474 world/CSS px korunur; held worker response yok ve idle hedef 0.25 CSS px quiet interval boyunca sabit kalır.
- Ölçüm: 610 pixel bbox centered [640,31]-[944,335] konumundan [688,55]-[992,359] konumuna taşındı. Render→source maksimum 0.9612 CSS px; source→render maksimum 0.7642 CSS px; eşik 1.25 CSS px.
- Kontroller: Hedefli Chromium 1/1, tam CAD V2 unit, UI/Chromium 3/3, runtime typecheck ve git diff --check PASS. DWG ve scene worker hash'leri koruma kopyalarıyla eşleşti. Test/evidence aşaması; compiler/cache v27, schema v1.
- Sınır/açık kapılar: Tek sentetik arc, pan offset'i, 125% ve Chromium bağlamı. Genel pan/zoom/DPR/device, diğer geometri/fill/glyph/chunk bileşikleri ve AutoCAD same-source oracle açık. Periodic SPLINE AutoCAD/evaluator/knot multiplicity, HATCH runtime remesh/topology, host bounded/on-demand chunks, kalan composite accounting ve PATH_DISTANCE shader tüketimi açık. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-24 — 195% pan edilmiş runtime ARC raster kabul kanıtı

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Idle refinement sonrasında yüksek zoom ve pan'de WebGL ARC raster hatası | tests/document-studio/cad-v2-layout-viewport.spec.ts, mevcut Chromium senaryosu | D3 (811,421.5,11.875), u=0.0842105263 world/CSS px; pan +171,+85.5. Görünür analitik yay [0.1591116695,1.0916057806]. 622 piksel: render→source 1.0113 px, visible source→render 0.7581 px; sınır 1.25 px. Idle .25 px, held response 0, max vertex 46. | PASS — yalnız sentetik quarter-circle / panned 195% / Chromium. Targeted Chromium 1/1, full unit, UI Chromium 3/3, runtime typecheck, diff-check. Test-only; worker hash'leri aynı, compiler/cache v27, schema v1. Genel rendered-error veya AutoCAD oracle'ı değildir. |

F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) açık paket. Periodic SPLINE AutoCAD fixture/evaluator/knot parity, HATCH runtime remesh/topology, host bounded spatial partition/on-demand chunking, fill/glyph/chunk-boundary ve diğer composite hata muhasebesi, shader PATH_DISTANCE, farklı geometri/zoom/pan/DPR profilleri ve aynı-kaynak AutoCAD visual/measurement oracle'ı açık.

## 2026-09-24 — runtime-refined raster DPR2 profili

- Dar kabul: Aynı bağımsız quarter-circle/WebGL oracle'ında gerçek Chromium `deviceScaleFactor=2` bağlamı.
- Kamera/refinement: Centered fit, `unitsPerCssPixel=0.1644736842`; CSS canvas 1280×672, DPR=2 drawing buffer 2560×1344. Worker hedefleri `[0.75,0.25]` CSS px; 2 refinement yanıtı, quiet snapshot sabit, `maxLineVertexCount=34`.
- Bağımsız raster ölçümü: Device-resolution screenshot'ta 981 seçili piksel; render→tam analitik yay maksimumu 0.6157362894 CSS px, kaynak→render maksimumu 0.4750552899 CSS px; kabul zarfı 1.25 CSS px.
- Doğrulama: `npm run check:cad-v2:unit` PASS; `npm run check:cad-v2:ui` Chromium **4/4 PASS**; `npx tsc --noEmit -p tsconfig.next.json --incremental false` ve `git diff --check` PASS. Worker SHA-256'ları koşu öncesi/sonrası aynı; compiler/cache v27, schema v1.
- Sınır: Tek sentetik ARC, centered fit ve DPR2. Farklı geometri, pan-at-DPR2 ve çeşitli cihaz/raster bağlamlarıyla genel runtime hata kapısı hâlâ **OPEN**. Periodic SPLINE AutoCAD/evaluator/knot, HATCH fill remesh/topology, host bounded/on-demand chunks, kalan fill/glyph/chunk composite'leri, shader `PATH_DISTANCE` ve same-source AutoCAD görsel/ölçü kapısı **OPEN**. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) paket açık.

## 2026-09-24 — F07 ELLIPSE runtime raster alt-kabulü

| Alan | Kanıt |
|---|---|
| Profil | Sentetik ELLIPSE U=(40,0), V=(0,24), [0,π/2]; gerçek host/worker/refined XY/WebGL; DPR1 fit 1280×672; 0.1644736842 world/CSS px. |
| Refinement | 0.75→0.25 CSS px, 2 yanıt, quiet snapshot, max 34 line vertex. |
| Oracle | 4097 parametrik örnek, 378 piksel; render→source 0.9825281925 px, source→render 0.7467465149 px; eşik 1.25 px. |
| Kontroller | İlgili iki unit, Chromium 1/1, tam UI Chromium 5/5, runtime typecheck/diff-check PASS. Son retry C: ENOSPC nedeniyle sonuçsuz. |
| Kimlik/sınır | Worker hash aynı, v27/schema v1. Full unit, mevcut P05/P06 evidence JSON yazma yan etkisi nedeniyle tekrarlanmadı. |

Tek geometri/profil; genel rendered-error ve AutoCAD oracle'ı açık. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) paket açık.
D-backed retry'ler test başlamadan durdu: ilkinde npm cache C: üzerindeydi; ikincisinde scripts/sync-cad-upstream-assets.mjs:61 C: diskinde ENOSPC verdi. Yeni D: çıktıları korundu.

### 2026-09-25 — rendered-error iz profili: DPR2 fit + pan

| Bağlam | Kamera | Raster | Worker durumu | Render→kaynak | Kaynak→render |
|---|---|---:|---|---:|---:|
| ARC, Chromium WebGL, DPR2 | fit, pan (+48,+24) CSS px; D3 (640,336,6.08) → (688,360,6.08) | 1280×672 CSS; 2560×1344 px; 981 seçili piksel | 0.75→0.25 CSS px; 2 yanıt; sessiz; 34 max line vertex | 0.6157362894 CSS px | 0.4750552899 CSS px |

İki yönlü bağımsız analitik quarter-circle raster oracle'ı 1.25 CSS px bütçesinin altında. Üç ilgili unit (`curve-refinement`, `precision-refinement`, `layout-viewport`), tam Chromium viewport dosyası 5/5, runtime typecheck ve diff-check geçti. Test-only; compiler/cache v27 ve DV2SCN01 v1, scene/DWG worker hash'leri değişmedi.

Bu iz yalnız bir geometri, fit zoom, sabit pan vektörü ve Chromium DPR2 içindir. F07 rendered-error genellemesi AÇIK/PARTIAL; periodic SPLINE AutoCAD/knot, HATCH remesh/topology, host bounded/on-demand chunks, fill/glyph/chunk bileşikleri, shader `PATH_DISTANCE` ve aynı-kaynak AutoCAD görsel/ölçü kapıları AÇIK; AutoCAD oracle'ı NOT_RUN. F07 14/19 (%74), 5/19 (%26) açık.
### 2026-09-25 — ELLIPSE runtime raster iz profili (DPR2 pan)

| Kaynak/oracle | Kamera | CSS / device raster | Refinement | Piksel sayısı | Render→kaynak | Kaynak→render |
|---|---|---|---|---:|---:|---:|
| Sentetik ELLIPSE, 4097 parametrik kaynak örneği | DPR2 fit, pan (+48,+24); D3 (640,336,6.08) → (688,360,6.08) | 1280×672 / 2560×1344 | 0.75→0.25 CSS px, 2 yanıt, sessiz, 34 max line vertex | 759 | 0.6081436225 CSS px | 0.4231605551 CSS px |

Bağımsız parametrik oracle iki yönü de 1.25 CSS px zarfında ölçtü; pan merkezini D3 dönüşüm farkıyla doğruladı. Üç ilgili unit, tam Chromium dosyası 6/6, runtime typecheck ve diff-check geçti. Test-only; compiler/cache v27, DV2SCN01 v1 ve iki worker hash'i değişmedi.

Rendered-error hâlâ kısmi: ARC ve ELLIPSE DPR2 fit/+48,+24 pan profilleri eklendi; tam geometri/zoom/pan/DPR/device matrisi yok. Periodic SPLINE AutoCAD/knot, HATCH runtime topology, host bounded/on-demand chunk, fill/glyph/chunk composite, shader `PATH_DISTANCE` ve same-source AutoCAD görsel/ölçü kapıları OPEN; AutoCAD oracle'ı NOT_RUN. F07 IN_PROGRESS, 14/19 (%74), 5/19 (%26) açık.
## 2026-09-25 — DPR2 ELLIPSE 125% ikinci pan: ölçüm ve açık kapı denetimi

| Profil | D3 kamera | Raster | Worker | Bağımsız parametrik oracle |
|---|---|---|---|---|
| 40×24 ELLIPSE, Chromium WebGL, DPR2, 125% | fit-pan (688,360,k=6.08) → zoom (700,366,k=7.6) → ikinci +48,+24 pan (748,390,k=7.6); net (+108,+54) CSS px | 1280×672 CSS; 2560×1344 device; 940 piksel | [0.75,0.25,0.75,0.25], 4 yanıt, quiet, 40 max line vertex | 4097 kaynak örneği; u=0.1315789474 world/CSS px; render→kaynak 0.5931555545 px, kaynak→render 0.4141058575 px (≤1.25) |

tests/document-studio/cad-v2-layout-viewport.spec.ts içindeki DPR2 ELLIPSE kabul senaryosu aynı testi fit-pan, merkezden 125% yakınlaştırma ve ikinci pan sırasıyla çalıştırır. Hedefli senaryo 1/1; dosyanın tüm Chromium senaryoları 6/6; curve-refinement, precision-refinement, layout-viewport unit'leri; runtime tsc --noEmit -p tsconfig.next.json --incremental false; git diff --check başarılıdır. Çıktılar D:\codex-cad-v2-f07-ellipse-pan-dpr2-125-20260925 altında saklandı; Next dev cache’i C: üzerinde yeni ve benzersiz dizindedir. Test/helper only; compiler/cache v27, DV2SCN01 v1 ve ölçülen scene/DWG worker hash'leri değişmedi.

### F07 kapıları — güncel kaynak/test taraması

| Kapı | Doğrulanan repo durumu | Kabul durumu |
|---|---|---|
| Periodic SPLINE AutoCAD fixture/desteği ve knot oracle | DXF/DWG adapter isPeriodic bilgisini taşır; geometry compiler periodic profili reddeder; precision testinde periodic giriş boş/fail-closed. De Boor knot oracle'ı sentetik non-periodic degree 2–5 profilleridir; AutoCAD periodic fixture yok. | AÇIK |
| HATCH runtime remesh/topology | HATCH curved-boundary sidecar testi çizgi XY buffer'ını ölçer; runtime fill remesh/topology testi veya runtime remesh yolu bulunmadı. Fill TRIANGLES statik compiler kapsamındadır. | AÇIK |
| Bounded spatial partition/on-demand chunk | Scheduler cache modülü ve unit'i var; host-shell scheduler'ı çağırmıyor. Host manifestteki chunk listesi üzerinde concurrency 6 fetch döngüsü çalıştırıyor. | AÇIK |
| Fill/glyph/chunk-boundary/kalan composite | Seçilmiş chord, encoded endpoint, glyph endpoint ve source-seam terimleri için dar testler var; fill TRIANGLES, glyph outline/refinement ve bütün çapraz chunk/fill etkileşimlerinin ortak muhasebesi yok. | AÇIK |
| Shader PATH_DISTANCE | Scene worker PATH_DISTANCE bölümünü decode/transfer ediyor; cad-v2-renderer içinde PATH_DISTANCE tüketicisi yok. | AÇIK |
| Geometri/zoom/pan/DPR/device rendered-error | ARC ve ELLIPSE için seçilmiş Chromium profilleri iki yönlü ölçüldü; bu belgeye eklenen profil ELLIPSE DPR2/125%/iki pan adımıdır. Genel geometri ve device matrisi tam değildir. | PARTIAL / AÇIK |
| Aynı-kaynak AutoCAD görüntü/ölçü oracle'ı | F07 browser raster testlerinde eş kaynak AutoCAD görüntüsü/ölçüsüyle eşleştirilmiş oracle yok. | AÇIK / NOT_RUN |

Plan 14/19 (%74), 5/19 (%26) paket açık; F07 IN_PROGRESS.
Güncel runtime raster profili envanteri: ARC — DPR1 fit/80%/125%, panned DPR1 125%/195%, ayrıca DPR2 fit ve +48,+24 pan; ELLIPSE — DPR1 fit, DPR2 fit kamera sonrası +48,+24 pan, DPR2 125% ve iki pan adımı. Önceki DPR2 pan eksikliği notları bu ek ölçümden önceki checkpoint'leri anlatır. Farklı geometri ve device bağlamlarının bütünü ölçülmediğinden genel kabul PARTIAL/AÇIK'tır.
## 2026-09-25 — ELLIPSE DPR2 80% panlı kamera raster ölçümü

| Profil | Kamera ve pan | Raster/oracle | Refined rendered-error |
|---|---|---|---|
| ELLIPSE, Chromium WebGL, DPR2, 80% | 125% panlı kamera (748,390,k=7.6) → merkezden 100% → 80%; son kamera (709.12,370.56,k=4.864), taşınmış net ofset (+69.12,+34.56) CSS px | 1280×672 CSS / 2560×1344 device; 4097 analitik kaynak örneği, 620 seçili piksel; u=0.2055921053 world/CSS px | render→kaynak 0.5127801495 CSS px; kaynak→render 0.3767122232 CSS px; ≤1.25 |

80% profili, mevcut +108,+54 panın merkez-ankorlu zoom ile ölçeklenmesini test eder; 80% noktasında ayrıca pointer drag uygulanmadı. 80% UI durumu, kamera ölçeği/ötelemesi, değişmiş canvas frame'i ve son idle refinement doğrulandı. Worker target listesi altı öğe [0.75,0.25] tekrarıdır; 6 yanıt, quiet ve maxLineVertexCount=40.

Hedefli Chromium 1/1, dosya Chromium 6/6, üç ilgili unit ve runtime typecheck PASS; git diff --check PASS. Yalnız test/helper değişti, C: yeni cache ve D: yeni/korunmuş test çıktıları kullanıldı; v27/schema v1 ve iki worker hash'i sabit.

Güncel F07 kapıları hâlâ açıktır: periodic SPLINE AutoCAD fixture/knot oracle; HATCH runtime remesh/topology; host'a bağlı bounded partition/on-demand fetch; fill/glyph/chunk-boundary kalan composite; shader PATH_DISTANCE; tam rendered-error geometry/zoom/pan/DPR/device matrisi (PARTIAL); aynı-kaynak AutoCAD görsel/ölçü oracle'ı (NOT_RUN). Nested BULGE seam/same-chord alt-oracle'ları zaten var ve bu turda yinelenmedi. Plan 14/19 (%74), 5/19 (%26) açık; F07 IN_PROGRESS.
## 2026-09-25 — DPR2 ELLIPSE 156% rendered-error ölçümü

| Profil | Kamera | Raster ve kaynak oracle'ı | Sonuç |
|---|---|---|---|
| ELLIPSE, Chromium WebGL, DPR2, 156% | 80% taşınmış kameradan merkez-ankorlu zoom-in: 100→125→156%; D3 (775,403.5,k=9.5); net ofset (+135,+67.5) CSS px | 1280×672 CSS / 2560×1344 device; u=0.1052631579 world/CSS px; 4097 parametrik kaynak örneği; 1190 piksel | render→kaynak 0.6348085456 CSS px; kaynak→render 0.4734169813 CSS px; her ikisi ≤1.25 |

Kaynak quarter-ellipse raster karede tamamen görünür kaldı; crop uygulanmadı. 156%’te ayrıca pointer drag yapılmadı; mevcut pan merkezi zoom ile taşındı. Worker hedefleri toplam [0.75,0.25]×4, 8 yanıt, quiet, maxLineVertexCount=42.

Hedefli browser 1/1, viewport Chromium dosyası 6/6, üç ilgili unit ve runtime typecheck PASS; diff-check PASS. Test/helper dışında prod kodu değişmedi; revision v27, schema v1, scene/DWG worker hash'leri sabit. Çıktı ve config D:\codex-cad-v2-f07-ellipse-dpr2-156-pan-20260925 altında; yeni C: cache ayrı ve korunuyor.

Yedi F07 kapısının audit durumu değişmedi: periodic SPLINE, HATCH remesh/topology, host bounded/on-demand fetch, kalan fill/glyph/chunk composite ve shader PATH_DISTANCE AÇIK; genel rendered-error matrisi PARTIAL/AÇIK; same-source AutoCAD görsel/ölçü AÇIK/NOT_RUN. Nested BULGE seçili same-chord ve iki seam yönünde zaten bağımsız ölçülmüş olduğundan yinelenmedi. F07 IN_PROGRESS, plan 14/19 (%74), 5/19 (%26) açık.

## 2026-09-25 — DPR1 ELLIPSE 156% + gerçek pan rendered-error kaydı

| Profil | Kamera | Bağımsız kaynak/raster oracle'ı | Sonuç |
|---|---|---|---|
| ELLIPSE, gerçek CAD V2 host/worker/WebGL, Chromium DPR1 | Fit (640,336,k=6.08); ardışık UI 125%→156%; son yüksek-zoom pan öncesi (640,336,k=9.5); gerçek pointer +48,+24 sonrası (688,360,k=9.5) | 1280×672 CSS/device px; u=0.1052631579 world/CSS px; tam görünür quarter-ellipse; 4097 parametrik analitik kaynak örneği ve 592 render pikseli | render→kaynak 0.9868434156 CSS px; kaynak→render 0.7490349703 CSS px; iki yön ≤1.25. Refinement [0.75,0.25]×3, 6/6 yanıt, quiet, max 42 line vertex |

DPR1 fit kabulü korunarak yeni 156% gerçek-pan profili eklendi. Her zoom seviyesinde son idle target 0.25 CSS px'e ulaşmadan sonraki adıma geçilmedi; hedef sayısı ve yanıt sayısı eşitlendi. Hedefli browser 1/1 (44.5 sn), viewport dosyası 6/6 (2.3 dk), üç ilgili unit, runtime TypeScript ve diff-check PASS. Yalnız test/helper değişti; compiler/cache v27, schema v1 ve iki worker hash'i değişmedi. Test çıktıları/config'i `D:\codex-cad-v2-f07-ellipse-dpr1-156-pan-20260925`; iki benzersiz C: cache kullanıldı.

| F07 kapısı yeniden denetlendi | Güncel kod/test kanıtı | Durum |
|---|---|---|
| Periodic SPLINE AutoCAD fixture/desteği ve knot multiplicity oracle'ı | Compiler periodic input'u reddediyor; bağımsız De Boor profilleri non-periodic sentetik spline'lar. AutoCAD periodic fixture/evaluator yok. | AÇIK |
| HATCH runtime remesh/topology | Worker curve-span refinement boundary line'ları güncelliyor; fill üçgenleri runtime topology remesh kabulünden geçmiyor. | AÇIK |
| Bounded spatial partition/on-demand chunk | Scheduler unit'leri mevcut ama host'a bağlanmamış; host manifest chunk'larını concurrency 6 ile fetch ediyor. | AÇIK |
| Kalan fill/glyph/chunk-boundary composite | Seçilmiş endpoint/seam/fill-boundary terimleri var; tam birleşik hata bütçesi kanıtı yok. | AÇIK |
| Shader `PATH_DISTANCE` tüketimi | Worker alanı açıp taşıyor; renderer okumuyor, mevcut dash rasterı tessellated XY'yi ölçüyor. | AÇIK |
| Runtime-refined rendered-error matrisi | ARC ve ELLIPSE için seçili DPR1/2, zoom/pan oracle'ları var; geometri ve device matrisi genel değil. | PARTIAL / AÇIK |
| Same-source AutoCAD görsel/ölçü oracle'ı | Eşleştirilmiş AutoCAD raster/ROI/ölçü kabul testi yok. | AÇIK / NOT_RUN |

Bu profil yalnızca sentetik ELLIPSE, tek canvas/Chromium ve seçili DPR1 kameraları için PASS'tır. F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) paket açık.


### F07 — Rational SPLINE runtime raster ölçümü, 2026-09-25

| İzlenen kabul | Bu turdaki kanıt | Sonuç |
|---|---|---|
| Host→worker refinement→WebGL içinde SPLINE source metadata'sının korunması | Sentetik clamped single-span cubic rational SPLINE; binary chunk metadata'sı kontrol noktası ve ağırlıklarla round-trip doğrulandı. | Bu dar sentetik profil PASS |
| Worker refinement sonrası çizilen eğrinin kaynak geometrisine yakınlığı | 1280×672 DPR1 fit, D3 (640,336,k=6.08); iki yönlü raster/source oracle, 4097 bağımsız rasyonel Bernstein örneği ve 677 raster pikseli. | PASS: 0.8164272623 / 0.7307145792 CSS px; sınır 1.25 |
| Refinement yanıtının gerçekten uygulanması | Hedef dizisi [0.75,0.25], 2/2 yanıt, quiet snapshot ve 96 maksimum line vertex. | PASS |
| Suite ve tür denetimi | Hedefli Chromium 1/1; tam viewport Chromium 7/7; curve-refinement, precision-refinement, worker-refinement-browser; runtime TypeScript ve diff-check. | PASS |

Bu kanıt periodic AutoCAD SPLINE, knot multiplicity davranışı veya farklı device/zoom matrisi anlamına gelmez. Periodic SPLINE AutoCAD fixture/knot oracle, HATCH runtime remesh, bounded host chunk fetch, kalan fill/glyph/chunk composite muhasebesi, shader PATH_DISTANCE ve same-source AutoCAD görsel/ölçü kapıları AÇIK; genel rendered-error matrisi PARTIAL/AÇIK. F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) paket açık.


### F07 — Rational SPLINE DPR2 pan kanıtı, 2026-09-25

| Kabul bağlantısı | Ölçüm | Sonuç |
|---|---|---|
| Gerçek pan ve D3 kamera doğrulaması | DPR2 fit (640,336,k=6.08) → gerçek +48,+24 CSS px pan → (688,360,k=6.08). Drawing buffer 2560×1344. | PASS |
| Kaynak spline → runtime raster iki yönlü envelope | 4097 bağımsız rational Bernstein örneği, 1348 raster pikseli; renderer source konumu gerçek D3 camera ile projekte edildi. | 0.4829010756 / 0.4292518924 CSS px; ≤1.25 |
| Refinement'ın pan sonrasında settled olması | [0.75,0.25] target dizisi; 2/2 cevap; pan öncesi/sonrası state quiet; max line vertex 96. | PASS |
| Değişiklik sonrası önceki DPR1 fit profilinin korunması | Kamera-aware oracle ile DPR1 fit aynı iki yönlü hatayı verdi: 0.8164272623 / 0.7307145792 CSS px. | PASS |
| Test ve tip denetimleri | Target Chromium 1/1; tam viewport Chromium 8/8; curve-refinement, precision-refinement, worker-refinement-browser; runtime TypeScript ve diff-check. | PASS |

Periodic SPLINE AutoCAD fixture/destek ve knot multiplicity oracle AÇIK; bu test non-periodic sentetik single-span cubic'dir. HATCH runtime remesh/topology AÇIK; host bounded spatial partition/on-demand chunk AÇIK; fill/glyph/chunk-boundary kalan composite AÇIK; shader PATH_DISTANCE AÇIK; geniş geometri/zoom/pan/DPR/device rendered-error matrisi PARTIAL/AÇIK; same-source AutoCAD görsel/ölçü AÇIK/NOT_RUN. Bu DPR2 pan profili genel kapıyı kapatmaz. F07 IN_PROGRESS, 14/19 (%74) tamam, 5/19 (%26) açık.


### F07 kanıt izi — rational SPLINE DPR2 125% zoom/pan (2026-09-25)

`tests/document-studio/cad-v2-layout-viewport.spec.ts` içindeki gerçek host→worker→refined line buffer→WebGL profili, DPR2 rasyonel Bernstein raster oracle'ını fit-pan, centered 125% zoom ve ikinci gerçek pan boyunca yürütür. D3 kamera sırası (640,336,6.08) → (688,360,6.08) → (700,366,7.6) → (748,390,7.6); son net pan ofseti (+108,+54) CSS px. 1280×672 CSS / 2560×1344 device; 4097 bağımsız source sample, 1702 raster pixel; iki yönlü hata 0.4689849332 / 0.4743416490 CSS px. Worker hedefleri `[0.75,0.25,0.75,0.25]`, 4/4 reply, quiet, max 110 line vertex. Bu yalnız tek sentetik, non-periodic rational SPLINE kamera profili için dar kabul sonucudur.

Seçilmiş Chromium raster kümesi 5/5 ve tam viewport Chromium dosyası 8/8; ilgili precision/curve/worker-browser testleri ve runtime typecheck geçti. `git diff --check` temiz. Test-only; compiler/cache v27, DV2SCN01 v1 ve iki worker SHA-256 sabit. Ayrı koşu konfigürasyonları, loglar ve sonuçlar yeni D: köklerinde tutuldu; C: Next cache'leri de ayrıdır. Düzeltilmiş suite konfigürasyonu `DOK_LOCAL_DATA_DIR` değerini per-run `TEMP` altına yerleştirdi. İlk suite config güvenli path korumasına takıldı; başarısız koşu ekleri korunmuş.

| F07 kapısı | Kod/test kanıtı | Durum |
|---|---|---|
| Periodic SPLINE AutoCAD fixture/desteği ve knot oracle | Mevcut periodic girdi fail-closed; De Boor multiplicity testleri sentetik non-periodic spline ile sınırlı. | **AÇIK** |
| HATCH runtime remesh/topology | Runtime curve boundary refinement fill triangle/topology remesh değildir. | **AÇIK** |
| Bounded spatial partition ve on-demand chunk | Scheduler host loading'e bağlanmamış; host manifest chunk'larını concurrency 6 ile getiriyor. | **AÇIK** |
| Fill/glyph/chunk-boundary ve kalan composite hesabı | Dar terimler mevcut; tam birleşik fill/glyph/chunk toplam kanıtı yok. | **AÇIK** |
| Shader `PATH_DISTANCE` | Renderer worker alanını tüketmiyor; dash rasterı tessellated XY kullanıyor. | **AÇIK** |
| Geometri/zoom/pan/DPR/device rendered-error | ARC/ELLIPSE/SPLINE için seçili profil var; tüm geometri ve cihaz matrisi tamam değil. | **PARTIAL / AÇIK** |
| Aynı-kaynak AutoCAD görsel/ölçü oracle'ı | Paired AutoCAD görüntü/ROI/measurement kabulü yok. | **AÇIK / NOT_RUN** |

F07 **IN_PROGRESS** kalır; plan ilerlemesi **14/19 (%74)**, açık paketler **5/19 (%26)**.


## F07 izlenebilirlik — Rational SPLINE DPR2 156% pan raster oracle

| Ölçülen kapsam | Kaynak ve oracle | Sonuç |
|---|---|---|
| DPR2 live host→worker→refined line buffer→WebGL rational SPLINE | `tests/document-studio/cad-v2-layout-viewport.spec.ts`; gerçek D3 camera; independent rational Bernstein evaluator; 4097 kaynak örneği ve screenshot device-pixel merkezleri | **PASS —** 156% centered zoom `(775,403.5,k=9.5)`, ardından gerçek `(+48,+24)` CSS pan `(823,427.5,k=9.5)`; 2124 raster piksel; 0.4907102356 px render→source ve 0.4090727048 px source→render, ≤1.25. |
| Settled refinement ve stale yanıt koruması | Aynı browser testinde pre-zoom target-count baseline; yeni hedef/yanıt, son 0.25 hedef ve sakin pending state | **PASS —** `[0.75,0.25,0.75,0.25,0.75,0.25]`, 6/6 reply, max line vertex 110. Önceki 125% cevabını yeni zoom cevabı sayan helper yarışı giderildi. |
| Doğrulama | Targeted Chromium; tam viewport browser dosyası; üç refinement unit dosyası; runtime TS; diff check | **PASS —** targeted 1/1; viewport 8/8; `precision-refinement`, `curve-refinement`, `worker-refinement-browser`; `tsc --noEmit -p tsconfig.next.json --incremental false`; temiz `git diff --check`. |

Test/helper-only değişiklik: compiler/cache v27, DV2SCN01 v1 ve scene/DWG worker hash'leri sabit. Loglar yeni `D:\codex-cad-v2-f07-spline-dpr2-156-pan-retry-20260925` ve `D:\codex-cad-v2-f07-spline-dpr2-156-pan-full-20260925` köklerinde tutuldu; önceki pan195 kökleri ve repo D-backed `test-output/` silinmedi.

| F07 kapısı | Durum |
|---|---|
| Periodic SPLINE AutoCAD fixture/desteği/knot oracle | **AÇIK** — mevcut multiplicity evaluator sentetik non-periodic profillerle sınırlı. |
| HATCH runtime remesh/topology | **AÇIK** |
| Bounded spatial partition ve on-demand chunk | **AÇIK** — scheduler host'a bağlı değil, host manifest chunk'larını concurrency 6 ile getiriyor. |
| Fill/glyph/chunk-boundary ve kalan composite | **AÇIK** |
| Shader `PATH_DISTANCE` tüketimi | **AÇIK** — renderer alanı tüketmiyor. |
| Genel geometri/zoom/pan/DPR/device rendered-error | **PARTIAL / AÇIK** |
| Same-source AutoCAD görsel/ölçü oracle'ı | **AÇIK / NOT_RUN** |

Nested/transformed BULGE same-chord ve iki seam-yönü oracle bu alt aşamada yeniden çalıştırılmadı. F07 **IN_PROGRESS**; plan **14/19 (%74)**, **5/19 (%26)** paket açık.


## F07 SPLINE DPR2 195% acceptance (2026-09-25)

| İzlenen bağ | Kaynak | Sonuç |
|---|---|---|
| 195% DPR2 kamera ve raster | tests/document-studio/cad-v2-layout-viewport.spec.ts; sentetik non-periodic rational cubic SPLINE; Chromium/WebGL gerçek device raster | PASS — D3 (868.75,450.375,k=11.875), viewport 1280×672 CSS, buffer 2560×1344, u=0.08421052631578949; 4097 rational Bernstein kaynak örneği / 2704 raster pikseli; render→source 0.5413191518506184, source→render 0.4506939094329671 CSS px (≤1.25). |
| Settled worker refinement | Aynı browser akışındaki hedef/yanıt sayacı, pending kuyruğu ve line buffer | PASS — hedefler [0.75,0.25]×4, 8 yanıt, son hedef 0.25 CSS px, pending 0, maxLineVertexCount 114. |
| Sentetik session heartbeat izolasyonu | F07 SPLINE ve ELLIPSE fixture route'ları | PASS — mock heartbeat 200 döner; gerçek API 410 kaynaklı prepare/fit yenilemesi engellenir. ELLIPSE zoom assert'leri ölçek ve yeni refinement cevabını denetler. |
| Doğrulama | Layout viewport Chromium; npm run check:cad-v2:unit; runtime TypeScript; git diff --check | PASS — Chromium 8/8 (190 s); unit exit 0; runtime tsc --noEmit -p tsconfig.next.json --incremental false exit 0; diff check temiz. |

Koşu log/config/results kökü: D:\codex-cad-v2-f07-spline-dpr2-195-zoom-final2-20260925. Test/helper-only değişiklik; compiler/cache v27, DV2SCN01 v1 ve preserved scene/DWG worker SHA-256 değerleri sabit. Kapılar: periodic AutoCAD SPLINE/knot, HATCH remesh/topology, bounded/on-demand chunk, kalan fill/glyph/chunk composite ve shader PATH_DISTANCE AÇIK; genel geometri/zoom/pan/DPR/device rendered-error PARTIAL / AÇIK; same-source AutoCAD AÇIK / NOT_RUN. F07 IN_PROGRESS, 14/19 (%74), 5/19 (%26) paket açık.


## F07 ELLIPSE DPR2 195% acceptance (2026-09-25)

| İzlenen bağ | Kaynak | Sonuç |
|---|---|---|
| Gerçek zoom, pan ve DPR2 raster | tests/document-studio/cad-v2-layout-viewport.spec.ts; parametrik ELLIPSE kaynak oracle'ı | PASS — D3 156% kamerası (775,403.5,k=9.5), pan (-10,-5), 195% kamera (796.25,414.125,k=11.875); net merkez pan (+156.25,+78.125) CSS px; 1280×672 CSS / 2560×1344 device; tam çeyrek ellipse görünür. |
| Bağımsız raster/source envelope | 4097 analitik örnek / 1476 DPR2 WebGL pikseli | PASS — render→source 0.6301951256486582, source→render 0.4610262730380537 CSS px; iki yön ≤1.25. |
| Settled refinement | Browser worker mesajları, line draw vertex sayacı ve quiet snapshot | PASS — 14 yanıt, son hedef 0.25 CSS px, pending 0, maxLineVertexCount 46. |
| Doğrulama | Targeted ve tam layout-viewport Chromium; precision/curve/worker refinement unit; runtime TS; diff check | PASS — 1/1, 8/8, ilgili üç unit ve typecheck geçti. |

Bu yalnız test/helper genişlemesidir; compiler/cache v27, binary schema v1 ve preserved worker hash'leri sabittir. Loglar D:\codex-cad-v2-f07-ellipse-dpr2-195-target-20260925 ve D:\codex-cad-v2-f07-ellipse-dpr2-195-full-20260925 altında korundu. Periodic AutoCAD SPLINE/knot, HATCH runtime topology, bounded/on-demand chunk, kalan fill/glyph/chunk composite ve shader PATH_DISTANCE AÇIK; genellenmiş rendered-error PARTIAL / AÇIK; same-source AutoCAD AÇIK / NOT_RUN. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) açık.

## 2026-09-25 — F07 DPR1 195% pan kanıt izi

Test: `tests/document-studio/cad-v2-layout-viewport.spec.ts`, DPR1 ELLIPSE kabul testi, zoom/pan bölümü ve raster assertion’ları (195% adımı yaklaşık satır 1540–1618). Fixture semimajor 40 / semiminor 24 çeyrek elipsidir. D3 kamera fit `(640,336,6.08)` → 156% pan `(688,360,9.5)` → 195% zoom `(700,366,11.875)` → son pan `(690,361,11.875)`. Raster oracle worker subdivision’ını kullanmaz; 4097 eşit parametrik analitik örnek ile PNG’den seçilmiş WebGL piksel merkezlerini ölçer. Son hata çift yönü `(1.0146941342, 0.7496648734)` CSS px; örnek sayısı 4097, raster sayısı 747.

Hedefli ve tam Chromium config/log/Playwright sonuçları `D:\codex-cad-v2-f07-ellipse-dpr1-195-pan-retry-20260925` altındadır: `playwright.target.config.ts`, `target.stdout.log`, `playwright.full.config.ts`, `full.stdout.log`, ve `results-target-20260925` / `results-full-20260925`. İlk koşunun timeout screenshot/video/context’i ayrıca `D:\codex-cad-v2-f07-ellipse-dpr1-195-pan-20260925\results-target-20260925` altında bırakıldı. Her koşu kendine ait C: Next cache ve D: TEMP/data dizini kullandı; test portları 43903–43906 artık dinlemiyor.

Doğrulama izi: hedefli Chromium 1/1; tam viewport Chromium 8/8; `npm run check:cad-v2:unit` 0; kamera etkileşimi, gerçek sahne render, worker refinement browser, host lifecycle ve UI quality alt testleri PASS; runtime `tsc --noEmit -p tsconfig.next.json --incremental false` PASS. `ui-subchecks.stdout.log` ve `runtime-tsc.stdout.log` aynı D: kökünde. Revision/cache kimliği `cad-v2-compiler-2026.09-v27`, schema v1; worker public bundle hash’leri bu test-only aşamada değişmedi.

Unit paketinin kaynak koddan gelen yazma yan etkisi: P05 `affine-ocs-audit.json`, P05 `bounds-provenance.json`, P06 `entity-instance-parity.json`, P06 `block-expansion-budget.json` dosyalarına testler çıktı yazdı (04:12:48–04:12:55, 2026-09-25); çıktıların tamamı ve unit logu korunuyor. Gelecek unit tekrarından önce bu test yan etkilerini izole etme gereği vardır.
### İzlenebilirlik düzeltmesi — hedef koşusu log dosyası

Başarılı hedefli Playwright koşusunun stdout’u D: dosyasına tee edilmedi; bu nedenle üstte anılan `target.stdout.log` mevcut değildir. Hedef koşusunun `1 passed` sonucu `results-target-20260925/.last-run.json` içindeki `status: passed, failedTests: []` ile doğrulanır; aynı testin tam Chromium dosya koşusundaki ayrıntılı raster ölçümü `full.stdout.log` içinde tutulur. İlk başarısız koşunun video, screenshot ve error context’i ayrı ilk-deneme kökünde korunmuştur.
### Unit evidence yazma yan etkisi — önemli not

`npm run check:cad-v2:unit` sırasında testler çalışma ağacında zaten bulunan dört P05/P06 JSON evidence dosyasını doğrudan yeniden yazdı. Çalışma öncesi bu dört dosyanın byte kopyası/hash’i alınmadığından eski byte içerikleri bu oturumda geri yüklenemiyor; testlerin ürettiği güncel PASS çıktıları ve unit logu yerinde bırakıldı. Bu, test otomasyonunun repo içi evidence yazma yan etkisidir ve gelecek geniş unit koşusundan önce ayrıca izole edilmelidir.
## F07 ARC DPR2 195% pan — izlenebilirlik kanıtı (2026-09-25)

| İzlenen bağ | Kaynak | Sonuç |
|---|---|---|
| Runtime refinement → gerçek kamera | `tests/document-studio/cad-v2-layout-viewport.spec.ts` içindeki DPR2 ARC testi (başlangıç satırı 1147) | PASS — fit `(640,336,6.08)`; fit pan `(+48,+24)`; 125% → 156% → 195% merkez zoom; 195% seviyesinde ikinci gerçek pan `(+48,+24)`; son D3 `(781.75,406.875,11.875)`, fit-relative `(+141.75,+70.875)` CSS px. |
| Canvas ve görünür analitik kaynak | Chromium WebGL2 screenshot; DPR2; bağımsız tam analitik çeyrek çember ve viewport ile kırpılmış görünür kaynak açıları | PASS — 1280×672 CSS / 2560×1344 device; `u=0.08421052631578949`; görünür kaynak açısı `[0,1.0286029931]`; rasterda 1363 seçilmiş mavi piksel. |
| İki yönlü raster/source hata | Screenshot piksel merkezleri ↔ bağımsız analitik kaynak yay | PASS — render→kaynak `0.6559628023` CSS px; kaynak→render `0.4458264123` CSS px; ikisi de ≤1.25. |
| Refinement sakinliği | Worker mesaj sayacı, son hedef ve WebGL line draw vertex sayacı | PASS — `[0.75,0.25]×4`; 8/8 yanıt; son hedef 0.25 CSS px; pending 0; maksimum line vertex 46. |
| Doğrulama | Hedefli/full Playwright, üç refinement unit/browser-worker ve beş UI alt testi, runtime TS | PASS — hedefli 1/1; viewport Chromium 8/8 (3.5 dk); yedi ilgili script; `tsc --noEmit -p tsconfig.next.json --incremental false`; `git diff --check`. |

Hedefli config/stdout/sonuçları `D:\codex-cad-v2-f07-arc-dpr2-195-20260925\pw-target.config.ts`, `target.stdout.log`, `results-target`; tam dosya config/stdout/sonuçları `pw-full.config.ts`, `full.stdout.log`, `results-full` altındadır. Yedi script logu ve typecheck logu aynı D: kökte saklıdır. Her koşunun izole D: temp/data ve ayrı C: Next cache'i vardı; 43927/43928 portlarında listener kalmadı. Test-only değişiklik compiler/cache v27, scene schema v1 ve her iki worker hash'ini değiştirmedi.

Bu kayıt rendered-error matrisi kapsamını ARC/DPR2/195%/pan profilinde artırır, fakat genellenmiş geometri/zoom/pan/DPR/device kapısını **PARTIAL / AÇIK** bırakır. Periodic AutoCAD SPLINE/knot, HATCH runtime topology, bounded/on-demand chunk, fill/glyph/chunk composite, shader `PATH_DISTANCE` ve same-source AutoCAD oracle kapıları **AÇIK** (AutoCAD oracle **NOT_RUN**); F07 **IN_PROGRESS**, 14/19 (%74), 5/19 (%26) açık.
## F07 rational SPLINE DPR1 195% pan — izlenebilirlik (2026-09-25)

| İzlenen bağ | Kaynak | Sonuç |
|---|---|---|
| UI zoom ve gerçek kamera panı | `tests/document-studio/cad-v2-layout-viewport.spec.ts`, DPR1 rational SPLINE oracle testi (başlangıç satırı 1747) | PASS — fit `(640,336,k=6.08)`; merkez zoom 125% → 156% → 195%; 195% zoomda gerçek `(+48,+24)` pan; son D3 `(688,360,k=11.875)`. |
| Bağımsız kaynak ve DPR1 raster | 4097 örnekli rational Bernstein evaluator; 1280×672 WebGL screenshot | PASS — source bounds `[284.25,98.75]..[1091.75,573.75]` viewport içinde; 1350 seçilmiş piksel. |
| Bidirectional rendered error | Screenshot piksel merkezleri ↔ bağımsız rasyonel kaynak yay | PASS — render→kaynak `0.9300776279` CSS px; kaynak→render `0.7905694150` CSS px; iki yön ≤1.25. |
| Worker settle ve aynı bucket pan | Request/reply instrumentation, `maxLineVertexCount`, pan öncesi/sonrası state | PASS — hedef `[0.75,0.25]×4`, 8/8 reply, son 0.25 CSS px, pending 0, max line vertex 114; aynı bucket pan ek hedef üretmedi. |
| Doğrulama | Targeted ve tam Chromium, CAD refinement testleri, beş UI subcheck, runtime TS | PASS — 1/1; viewport dosyası 8/8; üç ilgili unit/browser-worker ve beş UI script; runtime typecheck ve diff check. |

Kanıt dizini `D:\codex-cad-v2-f07-spline-dpr1-195-pan-20260925-v2`: `pw-target.config.ts`, `target.stdout.log`, `results-target`; `pw-full.config.ts`, `full.stdout.log`, `results-full`; ilgili yedi script logu ve `runtime-tsc.log`. Target/full ayrı C: Next cache ve D: geçici data kullandı; portlar 43929/43930 kapalı, hedef süreç yok. Test-only aşamada compiler/cache v27, schema v1 ve önceki iki worker hash'i korundu.

DPR1 rational SPLINE/195% pan örneği rendered-error matrisini genişletir; genel geometri/zoom/pan/DPR/device kapısı **PARTIAL / AÇIK** kalır. Periodic AutoCAD SPLINE/knot oracle, HATCH runtime remesh, bounded/on-demand chunks, fill/glyph/chunk composite, shader `PATH_DISTANCE`, same-source AutoCAD visual/measurement kapıları **AÇIK** (AutoCAD oracle **NOT_RUN**). F07 **IN_PROGRESS**, 14/19 (%74), 5/19 (%26) paket açık.
## F07 DPR2 ELLIPSE 195% sonrası pan — izlenebilirlik (2026-09-25)

| İzlenen bağ | Kaynak | Sonuç |
|---|---|---|
| 195% sonrası gerçek pan ve kamera | `tests/document-studio/cad-v2-layout-viewport.spec.ts` DPR2 ELLIPSE testi (başlangıç satırı 2285; ek assertion yaklaşık satır 2839) | PASS — 195% zoom öncesi kamera `(796.25,414.125,k=11.875)`; gerçek `(-10,-5)` pan sonrası `(786.25,409.125,k=11.875)`; fit-relative offset `(+146.25,+73.125)` CSS px. |
| Tam görünür parametrik kaynak | ELLIPSE semimajor/semiminor projeksiyonu ve DPR2 viewport | PASS — 1280×672 CSS / 2560×1344 device; `u=0.0842105263`; kaynak çeyrek yay bounds'ı viewport içinde; kaynak açısı `[0,π/2]`. |
| Bağımsız raster/source oracle | 4097 parametrik analitik örnek ↔ 1476 WebGL pikseli | PASS — render→source `0.6301951256` CSS px; source→render `0.4610262730` CSS px; her ikisi ≤1.25. |
| Runtime refinement quiet | Worker hedef/yanıt sayaçları ve line draw vertex sayacı | PASS — `[0.75,0.25]×7`, 14/14 yanıt, son hedef 0.25 CSS px, pending 0, maxLineVertexCount 46; 195% sonrası pan bu state'i değiştirmedi. |
| Doğrulama | Hedefli/tam Chromium, ilgili unit/browser-worker ve beş UI alt testi, runtime TS | PASS — 1/1; tam viewport 8/8; `tsc --noEmit -p tsconfig.next.json --incremental false`; `git diff --check`. |

Hedefli ve tam koşu kanıtı `D:\codex-cad-v2-f07-ellipse-dpr2-195-postpan-20260925` içindedir (`target.stdout.log`, `full.stdout.log`, Playwright config/sonuçları, yedi script logu ve typecheck logu). Her koşu benzersiz C: cache ve ayrı D: temp/data kullandı; 43931/43932 listener'ı ve ilgili test process'i kalmadı. Production runtime/worker değişmedi; revision v27, schema v1 ve iki worker SHA-256 sabit.

Bu ölçüm DPR2 ELLIPSE/195% pan profilini genişletir; rendered-error matrisi genel olarak **PARTIAL / AÇIK** kalır. Periodic AutoCAD SPLINE/knot, HATCH topology, bounded/on-demand chunks, fill/glyph/chunk composite, shader `PATH_DISTANCE` ve same-source AutoCAD oracle açık; sonuncusu **NOT_RUN**. F07 **IN_PROGRESS**, 14/19 (%74), 5/19 (%26) açık.
## F07 DPR2 SPLINE 195% sonrası ek pan — izlenebilirlik (2026-09-25)

| İzlenen bağ | Kanıt | Sonuç |
|---|---|---|
| Test kaynağı ve gerçek etkileşim | `tests/document-studio/cad-v2-layout-viewport.spec.ts`, `runtime-refined SPLINE pan raster error is bounded at DPR2` | PASS — 195% yakınlaştırma sonrasında gerçek `(-10,-5)` CSS px pan; kamera `(868.75,450.375,k=11.875)` → `(858.75,445.375,k=11.875)`. |
| DPR2 raster bağlamı ve görünür kaynak | 1280×672 CSS, 2560×1344 device; `u=0.0842105263` | PASS — 4097 rational Bernstein örneğinin bounds'ı `[455,184.125]..[1262.5,659.125]`, viewport içinde. |
| Bağımsız raster/source oracle | 4097 kaynak örneği ↔ 2704 seçilmiş WebGL pikseli | PASS — render→source `0.5413191519` CSS px; source→render `0.4506939094` CSS px; ikisi `≤1.25`. |
| Runtime refinement | target/reply ve line-vertex enstrümantasyonu | PASS — `[0.75,0.25]×4`, 8/8 reply, son hedef 0.25 CSS px, pending 0, maksimum 114 vertex; pan state'i yenilemedi. |
| Doğrulamalar | Hedef/tam Chromium, 7 odaklı unit/UI testi, runtime TypeScript | PASS — 1/1, viewport 8/8, focused 7/7, `tsc --noEmit ...`, `git diff --check`. |

Kanıt kökü `D:\codex-cad-v2-f07-spline-dpr2-195-postpan-20260925`: `target.stdout.log`, `full.stdout.log`, `results-target`, `results-full`, yedi test logu, `runtime-tsc.log` ve iki Playwright config. Her browser koşusu ayrı C: Next cache ve D: temp/data kullandı; 43933/43934 listener'ı veya test süreci kalmadı.

Kapı özeti: periodic AutoCAD SPLINE/knot, HATCH remesh/topology, bounded/on-demand chunk, fill/glyph/chunk composite, shader `PATH_DISTANCE` **AÇIK**; genellenmiş rendered-error matrisi **PARTIAL / AÇIK**; same-source AutoCAD visual/measurement **AÇIK / NOT_RUN**. F07 **IN_PROGRESS**; 14/19 (%74), 5/19 (%26) paket açık. Runtime/compiler/cache v27, pipeline `fidelity-v3-p07`, schema v1 ve iki worker hash'i değişmedi.
## F07 DPR2 SPLINE 80% zoom + pan — izlenebilirlik (2026-09-25)

| İzlenen bağ | Kanıt | Sonuç |
|---|---|---|
| UI zoom-out ve gerçek pan | `tests/document-studio/cad-v2-layout-viewport.spec.ts`, DPR2 SPLINE raster testi | PASS — 195%’ten 156/125/100/80% adımları; 80% gerçek `(-10,-5)` pan; kamera `(729.6,380.8,k=4.864)` → `(719.6,375.8,k=4.864)`. |
| DPR2 viewport ve kaynak görünürlüğü | 1280×672 CSS, 2560×1344 device; bağımsız tam SPLINE | PASS — `u=0.2055921053`; 4097 kaynak örneğinin bounds `[554.224,268.792]..[884.976,463.352]` viewport içinde. |
| Rasyonel kaynak/raster oracle | 4097 Bernstein örneği ↔ 1112 WebGL pikseli | PASS — render→source `0.4476090077` CSS px; source→render `0.3641466608` CSS px; ikisi `≤1.25`. |
| Refinement idle ve aynı bucket panı | Worker target/reply ve line vertex enstrümantasyonu | PASS — `[0.75,0.25]×5`, 10/10 reply, son hedef 0.25 CSS px, pending 0, maxLineVertexCount 114; 80% pan sonrası state aynı. |
| Kontroller | Hedef/tam Chromium, odaklı CAD unit/UI, runtime TS | PASS — 1/1, viewport 8/8, focused 7/7, `tsc --noEmit -p tsconfig.next.json --incremental false`, `git diff --check`. |

Kanıt kökü `D:\codex-cad-v2-f07-spline-dpr2-80-pan-20260925`: `target.stdout.log`, `full.stdout.log`, `results-target`, `results-full`, yedi focused script logu, `runtime-tsc.log` ve koşu config'leri. Ayrı C: Next cache / D: temp-data kökleri kullanıldı; 43935/43936 listener'ı ve test Node süreci kalmadı.

Bu hücre rendered-error matrisini genişletir, genel kapıyı kapatmaz. Periodic AutoCAD SPLINE/knot, HATCH runtime remesh/topology, bounded/on-demand chunk, kalan fill/glyph/chunk composite, shader `PATH_DISTANCE` açık; same-source AutoCAD visual/measurement açık/not run. F07 `IN_PROGRESS`, 14/19 (%74), 5/19 (%26) paket açık. Compiler/cache v27, pipeline `fidelity-v3-p07`, schema v1 ve iki worker hash'i değişmedi.
## 2026-09-25 — F07 DPR1 SPLINE 80% pan kanıt izi

| Kabul hücresi | Uygulama/test | Ölçüm | Sonuç |
|---|---|---|---|
| 195% pan sonrası düşük zoom DPR1 raster | tests/document-studio/cad-v2-layout-viewport.spec.ts, rational Bernstein kaynak oracle'ı | DPR1 1280×672; final kamera (649.6608,340.8304,k=4.864); 4097 kaynak örneği / 542 seçilmiş WebGL pikseli | render→source 0.7981910667 px; source→render 0.9082625171 px; eşik 1.25 px altında |
| Worker refinement sakinliği | Aynı Chromium senaryosu, zoom-out hedef geçmişi ve post-pan snapshot | 0.25 px son hedef; [0.75,0.25]×5; 10/10 yanıt; maxLineVertexCount=114; pending 0 | PASS |
| Tekrar doğrulama | Hedef Chromium; tam viewport Chromium; 2 refinement unit + 5 UI/worker test; runtime typecheck; diff check | 1/1; 8/8; 7/7; PASS; PASS | PASS |

Kanıt konumu: D:\codex-cad-v2-f07-spline-dpr1-80-pan-20260925 (target, full, focused, typecheck günlükleri; izole test artifact ve temp/data). Compiler/cache v27, pipeline p07, DV2SCN01 schema v1 ve worker hash'leri korundu. Test-only matris genişlemesi olduğundan runtime/compiler cache revision değişmedi.

Kapı denetimi: sentetik clamped spline knot birim testleri AutoCAD periodic fixture/runtime ve AutoCAD knot oracle'ı değildir; periodic/knot kapısı AÇIK. HATCH testleri statik mesh/topology ile sınırlı; runtime remesh AÇIK. Compiler bounded spatial partition üretmiyor ve host manifest chunk'larını eager yüklemeye devam ediyor; on-demand kapısı AÇIK. Static glyph ve fill nicemleme ölçümleri mevcut olsa da fill/glyph/chunk sınırı ve kalan bileşik hesap AÇIK. Renderer PATH_DISTANCE tüketmediğinden shader/dash kapısı AÇIK. Tarayıcı matrisi sentetik SwiftShader profilleriyle PARTIAL/AÇIK; native GPU/device ve AutoCAD eş-kaynak görüntü/ölçü oracle'ı NOT_RUN. F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) paket açık.

**F08 v82 — owner ledger → worker transfer guard → renderer/host tests → R001 process HWM:** Resource owner record carries scene, host generation, chunk, refCount and CPU/GPU byteEstimate. Shared object identity is counted once and disposed on last lease. Renderer integration covers actual Three geometry/material registration/removal and generation clear; worker test blocks duplicate ArrayBuffer transfer. Ledger/renderer/worker, scheduler/cache, curve preflight and host lifecycle focused tests pass; runtime tsconfig.next check exits 0. Targeted clean-port Chromium budget/LRU, 10 simulated context recovery, 20 open/close, stale file switch and legacy control **5/5 PASS**. R001 test exited 0 but logs LibreDWG error 68: OS-maintained Node process maxRSS **1.944.174.592 B** at compile; 4 concurrent source copies **1.692.880 B**; unpacked worker chunk **1.272.108 B**; renderer output CPU/GPU estimate **1.212.120/1.212.120 B**; 22 curve refs refined to 1.255 segments. Browser process RSS and physical GPU remain NOT_RUN. Initial P00 still rejects 90/284 visible chunks due CPU estimate 74.920.882/67.108.864 B; GPU estimate is 51.048.852/67.108.864 B. Fidelity effect remains unresolved without clean decode and same-source AutoCAD semantic hash + 10 ROI. F08 **PARTIAL / ACCEPTANCE NOT_RUN**.


## 2026-09-25 — F07 DPR1 ELLIPSE 80% pan izlenebilirlik kaydı

| İz | Kanıt / sonuç |
|---|---|
| Test senaryosu | `tests/document-studio/cad-v2-layout-viewport.spec.ts:1468`; independent parametric ELLIPSE oracle senaryosu 80% zoom-out ve (-10,-5) CSS px panı kapsıyor. |
| Runtime/raster bağlamı | D3 camera `(650.48,341.24,4.864)`; CSS viewport ve DPR1 buffer `1280×672`; `u=0.2055921052631579` world/CSS px; 4097 analitik örnek / 299 WebGL pikseli. |
| İki yönlü ölçüm | Render→analitik kaynak maksimum `0.7860996134` CSS px; kaynak→render maksimum `0.8713208364` CSS px; eşik `1.25` CSS px. |
| Refinement | Hedef dizisi sonu 0.25 CSS px; 10 istek / 10 yanıt; `maxLineVertexCount=46`; post-pan 350 ms snapshot'ında ek yanıt yok, pending 0. |
| Tekrar doğrulama | Hedefli Chromium 1/1 (82.4 s); tam viewport Chromium 8/8 (275.5 s); odaklı unit/UI 7/7; runtime TS ve CRLF-aware diff check PASS. |
| Artifact ve çalışma ağacı | Başarılı log/artifact kökü `D:\codex-cad-v2-f07-ellipse-dpr1-80-pan-20260925`; C: Next cache'leri ayrı, D: temp/data izole. Başlangıç kurulumunda default `test-results` altına düşen başarısız upload artifact'i silinmeden korundu; sonraki koşular explicit D: `--output` kullandı. |
| Revision/cache | Compiler v27, pipeline p07, schema v1 sabit; public scene worker ve korunmuş conversion worker SHA-256 değerleri önceki checkpoint ile aynı. |

Kapılar: periodic AutoCAD SPLINE/knot **AÇIK**; HATCH runtime remesh/topology **AÇIK**; host bounded/on-demand chunks **AÇIK**; kalan fill/glyph/chunk-boundary composite accounting **AÇIK**; shader `PATH_DISTANCE` **AÇIK**; genel geometri/zoom/pan/DPR/device raster matrisi **PARTIAL / AÇIK**; same-source AutoCAD visual/measurement **AÇIK / NOT_RUN**. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) açık.


**Artifact notu:** İlk başarısız Playwright çağrısında PowerShell argüman aktarımı nedeniyle `--output` etkinleşmedi ve varsayılan repo `test-results` yoluna failure artifact yazıldı. Mevcut çıktı silinmedi/taşınmadı. Koşu öncesi aynı adlı artifact için hash/yedek alınmadığından, varsa önceki içeriğin korunup korunmadığı geriye dönük doğrulanamıyor. Bu başarısız deneme PASS sayımına dahil değildir.


## 2026-09-25 — F07 DPR1 ARC 80% pan izlenebilirlik kaydı

| Kabul izi | Uygulama ve sonuç |
|---|---|
| Test/oracle | `tests/document-studio/cad-v2-layout-viewport.spec.ts:704`; mevcut canlı zoom/stale-response testi, bağımsız analitik quarter-circle projeksiyonu ile DPR1 80% pan hücresi eklenerek genişletildi. |
| Kamera/raster | 80% zoom kamerası `(710.0416,371.0208,k=4.864)`; (+48,+24) CSS px pan sonrası `(758.0416,395.0208,k=4.864)`; viewport ve raster `1280×672`; `u=0.2055921052631579` world/CSS px. |
| Ölçüm | 383 seçilmiş WebGL pikseli; render→kaynak `0.8401740575` CSS px, kaynak→render `0.7087218739` CSS px; her iki yön `≤1.25` px. |
| Refinement | Son hedef 0.25 CSS px; son zoom-out profili `[0.75,0.25]`; pending yanıt 0; maksimum 46 line vertex. Pan sonrasında refinement snapshot'ı değişmedi. |
| Tekrar | Targeted Chromium 1/1; tam viewport Chromium 8/8; odaklı unit/UI 7/7; runtime TS ve diff check PASS. |
| Koşu izleri | Başarılı ve ilk başarısız hedef koşu çıktıları, tam suite, unit logları ve ayrı cache/temp konfigürasyonları `D:\codex-cad-v2-f07-arc-dpr1-80-pan-20260925` altında korundu. İlk assertion düzeltmesi runtime bug değildir; test zoom oranı çarpımına göre düzeltildi. |

Periyodik SPLINE/knot, HATCH runtime remesh, bounded/on-demand chunk, kalan fill/glyph/chunk composite, shader `PATH_DISTANCE`, genel raster matrisi ve same-source AutoCAD oracle kapıları açık/PARTIAL durumunu korur. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-25 — F07 DPR3 ELLIPSE cihaz-piksel izi

| İz | Kanıt / sonuç |
|---|---|
| Test ve oracle | tests/document-studio/cad-v2-layout-viewport.spec.ts:3545; yeni runtime-refined ELLIPSE kabul testi, bağımsız 4097 örnekli parametrik kaynak oracle'ı. |
| Cihaz ve renderer | DPR3; CSS viewport 1280×672; renderer canvas buffer 2560×1344 (2× cap); cihaz ölçekli screenshot 3840×2016. |
| Kamera / kaynak | Fit (640,336,k=6.08); gerçek (-10,-5) CSS px pan sonrası (630,331,k=6.08); u=0.16447368421052633 world/CSS px. |
| İki yönlü raster | 2198 seçilmiş WebGL pikseli; render→kaynak 0.7085877543 CSS px; kaynak→render 0.2589010743 CSS px; her ikisi ≤1.25 px. |
| Worker | Hedef geçmişi [0.75,0.25]; 2/2 cevap; son hedef 0.25 CSS px; aynı bucket pan sonrası yeni refinement yok; maxLineVertexCount=34. |
| Tekrar doğrulama | curve-refinement.test.ts PASS; precision-refinement.test.ts PASS; yeni Chromium senaryosu 1/1 PASS; runtime tsconfig.next.json typecheck PASS. Tam viewport dosyası bu turda çalıştırılmadı. |
| Artifact ve izolasyon | D: log/artifact kökü D:\codex-cad-v2-f07-dpr3-clamp-20260925; ayrı C: Next cache; uygulama fixture verisi izinli Temp yolunda saklandı; 43951 portu kapalı. İlk güvenli-yol kurulum hatasının dosyaları korunuyor. |
| Cache / ABI | Compiler v27, pipeline p07, schema v1, render ABI three172-cad2d-v1; scene worker SHA-256 1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280. |

Kapı sonucu: periodic AutoCAD SPLINE/knot AÇIK; HATCH runtime remesh/topology AÇIK; host bounded partition/on-demand chunk AÇIK; fill/glyph/chunk-boundary bileşik hesabı AÇIK; shader PATH_DISTANCE AÇIK; genel rendered-error matrisi PARTIAL/AÇIK; same-source AutoCAD visual/measurement AÇIK/NOT_RUN. Nested/transformed BULGE için mevcut dar oracle'lar bulunduğundan bu alt aşama olarak seçilmedi. F07 IN_PROGRESS, 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-25 — F07 DPR3 SPLINE ölçüm izi ve iç ilerleme metriği

İzlenen uçtan uca test: synthetic rational non-periodic SPLINE scene fixture → binary `CURVE_DATA`/`PATH_DISTANCE` fallback → host camera profile → `refine-curves` worker istek/yanıtları → Three line geometry → WebGL2 canvas screenshot → ayrı 4097 örnekli rational Bernstein ve raster nearest-distance hesabı. Test `tests/document-studio/cad-v2-layout-viewport.spec.ts:3655`; hedef 0.25 CSS px, son pan aynı bucket'ta no-op.

DPR/device kaydı birbirinden ayrıdır: 1280×672 CSS viewport, DPR3, 2560×1344 renderer buffer (2× cap), 3840×2016 device screenshot. 80% zoom `(k=4.864)` ve `(-10,-5)` CSS px pan `(x=630,y=331)` ile sonuçlandı. 4097 kaynak örneği / 3273 render pikseli için render→source `0.6668573448 px`, source→render `0.2322079741 px`. Worker `[0.75,0.25]×2`, 4/4 reply, pending 0, max line vertices 96.

Ölçüm ispat sınırı: kaynak AutoCAD-authored değildir; oracle testte sabitlenen rational Bernstein cubic kaynağından bağımsız değerlendirilir. Chromium config SwiftShader kullanır. Native GPU/cihaz veya AutoCAD same-source benzerliği çıkarımı yapılmaz.

F07 ilerleme raporu için planın altı ana gereksinim grubu üzerinden ortak tahmin kullanılır: 2 PASS + 4 PARTIAL; PARTIAL=0.5 ağırlıkla **(2 + 4×0.5)/6 ≈ %67 F07 iç ilerleme**. Yedi nihai kabul kapısının durumu ayrı tutulur ve F07 IN_PROGRESS kalır. Genel uygulama planı ayrıca 14/19 (%74), 5/19 açık paket durumundadır.

D: kanıtı: `D:\codex-cad-v2-f07-spline-dpr3-80-pan-20260925\playwright-run-002` ve `logs\playwright-run-002.log`; yanlış baseURL ile teste başlamayan ilk deneme `playwright-run-001` altında tutuldu. Ayrı Next cache `.next-f07-spline-dpr3-80-pan-20260925-retry`; test veri dizini silinmeden korundu.

## 2026-09-25 — PATH_DISTANCE → shader uçtan uca izi

Ölçülen zincir: canonical two-term DASHED LWPOLYLINE → full straight source segment pairs (31-unit path spans) → serialized `PATH_DISTANCE` F32 and `drawCommands[].dashStyle={24,16}` → worker unpack → renderer `lineDistance` vertex attribute → Three `LineDashedMaterial` shader → Chromium WebGL2 pixels. Tek chunk ile 6 chunk'ın 12 scalar endpoint değerleri aynı kaldı; shader-visible five-dash run'ları ve gap ölçümleri `[66–177],[275–420],[518–663],[762–907],[1005–1150]`, `[97,97,98,97]` px; screenshot hashes eşit. Bu profilin boşlukları kaynak XY'ye bake edilmemiştir.

Kanıt: `tests/cad-v2/f07-dash-render-scene.ts`, `tests/document-studio/cad-v2-layout-viewport.spec.ts` içindeki `compiler-produced DASHED WebGL output is invariant to chunk partition` ve `tests/cad-v2/linetype-phase.test.ts` metadata fallback kontrolleri. Son hedef koşu 1/1 Chromium PASS; görüntüler/log `D:\codex-cad-v2-f07-path-distance-line-shader-20260925\playwright-run-002` ve `logs\playwright-run-002.log` altında. Compiler v28 / pipeline p08 / render ABI v2; schema v1. Diğer pattern tipleri CPU fallback olduğundan nihai shader kapısı PARTIAL/AÇIK kalır.


## 2026-09-25 — Periodic SPLINE DXF alan izi

İz zinciri: DXF pair reader → group-5 handle → fields 70/71/72/73/40/41/10/20/30 → dxf-adapter canonical SPLINE → geometry validator/scene diagnostic. tests/cad-v2/dxf-periodic-spline.test.ts sentetik profilleri ASCII ve AcDbDxfFiler binary DXF üzerinden okur; flag, count, knot, control net, periodic domain kapanışı, continuity ve multiplicity 2/3 eşleşmesini sınar. Degree 0 canonical kayıtta tutulur ve tessellator tarafından reddedilir.

Fixture AutoCAD üretimi değildir. 90 s COM denemesi periodic DWG/DXF/property dump üretmedi; AutoCAD parity NOT_RUN, periodic runtime support fail-closed/AÇIK. D:\codex-cad-v2-f07-periodic-spline-acad-20260925 altında test logları ve Chromium run-003 korunur. Chromium 1/1 bu ağacın sentetik DPR1 ARC runtime regression ölçümüdür; periodic SPLINE raster testi değildir.

Güncel kimlik v29 / fidelity-v3-p08 / ABI v2 / schema v1. F07 iç metrik yaklaşık %67; genel plan 14/19=%74. Bunlar farklı paydalardır.


## 2026-09-25 — PATH_DISTANCE shader test izi

Compiler DASHED line path → PATH_DISTANCE F32 → renderer lineDistance attribute → Three LineDashedMaterial → WebGL framebuffer. Güncel testte source path 184 unit, source edge 31, dash/gap 24/16; scalar dizisi [0,31,31,62,62,93,93,124,124,155,155,184]. Tek chunk ve 6 chunk beş aynı raster run'ı ve 97/97/98/97 px gap üretti; iki framebuffer SHA-256 98878ef260eb93722877a39be4a72bc188dbbbfda24b36f83d1680980941e0a8.

linetype-phase.test.ts 12/12, hedefli Chromium 1/1. Kanıt D:\codex-cad-v2-f07-periodic-spline-acad-20260925\playwright-run-004 altında. Desteklenen dar profile doğrulandı; generic PATH_DISTANCE shader kapısı PARTIAL/OPEN. F07 iç ~%67, genel plan 14/19 (%74).


## 2026-09-25 — F07 periodic SPLINE runtime-refinement checkpoint

Trace: DXF flag/degree/knots/weights/control points → cyclic profile validation → per-span homogeneous fit → bounded source sidecar → scene binary → generation-aware Web Worker cache/fallback.

Synthetic periodic DXF SPLINE runtime refinement is now enabled for a bounded profile: degree 1–8, positive finite weights, cyclic control/weight tail, and closed active knot interval. Open/non-cyclic seams and degree 9+ fail-closed; non-periodic knot insertion is unchanged. This supersedes the earlier blanket periodic rejection only for these synthetic profiles.

Independent De Boor oracle: four 4-span profiles (F071/F074/F075/F077), 12,001 samples each (48,004 total), target 0.05 world units. Max errors 0.0188605 / 0.0326872 / 0.0364018 / 0.0361927; reported bounds 0.0254003 / 0.0441744 / 0.0488367 / 0.0482629. Simple/double/triple internal multiplicity and rational weights were included. Chromium worker refined 6 source segments to 64; bound met, stale generation dropped, LRU inline fallback passed, Float32 output 3,472 bytes.

Periodic AutoCAD-authored fixture/parity and periodic raster comparison are still missing: this gate remains PARTIAL/OPEN. A separate DPR3, 80%-zoomed-and-panned UI raster regression tested a non-periodic rational SPLINE only (3,273 pixels; render→source 0.666857 CSS px, source→render 0.232208 CSS px), so it does not close periodic or general runtime raster acceptance.

Current compiler/cache revision cad-v2-compiler-2026.09-v30; pipeline fidelity-v3-p08; DV2SCN01 schema v1 and three172-cad2d-v2 render ABI unchanged. Unit package exited 0, periodic unit and real-browser worker tests passed, runtime tsc --noEmit -p tsconfig.next.json --incremental false passed. Logs retained in D:\codex-cad-v2-f07-periodic-runtime-20260925. F07 remains IN_PROGRESS, internal estimate ~67% (2 PASS + 4 PARTIAL across 6 groups); plan 14/19 (74%), 5 packages open.


## 2026-09-25 — F07 nested affine BULGE DPR2 rendered-error checkpoint

Test izi: nested LWPOLYLINE bulge → two-level INSERT transform (inner non-uniform scale/rotation; outer mirrored non-uniform scale/rotation) → compiler CURVE_DATA/BULGE sidecar → scene binary → document host → real Web Worker refinement → WebGL2 DPR2 buffer → device screenshot.

Bağımsız kaynak oracle'ı DXF bulge ilişkisi theta=4*atan(b) ile yay merkez/radius'ını start/end/bulge'dan hesapladı; 4.097 kaynak noktasına iki INSERT affine dönüşümünü bağımsız uyguladı. %80 zoom ve +24,+12 CSS px pan sonrası kamera k=26.928623; CSS viewport 1280×672, buffer/screenshot 2560×1344. 3.105 boyalı piksel için azami render→source 0.5856469647 CSS px; source→render 0.4652905302 CSS px.

Runtime trace: 1 BULGE source ref; hedefler [0.75,0.25,0.75,0.25], 4 reply; maxLineVertexCount 98; pan'den sonra yeni istek yok ve bekleyen yanıt yok. Hedefli Playwright Chromium 1/1; chunk-error-accounting ve curve-refinement unit testleri PASS; runtime tsconfig.next typecheck PASS. Test-inclusive repo tsconfig.json tam kontrolü exit 2, yeni spec için hata vermedi fakat diğer mevcut UI testlerinde tip hataları var.

Kanıt ve test config: `D:\codex-cad-v2-f07-nested-bulge-raster-20260925`. Bu hücre rendered-error matrisine nested affine BULGE ekler; native GPU/device parity ve genel matrix tamamlanmadığı için kapı PARTIAL/OPEN. F07 ~%67; plan 14/19 (%74).

## 2026-09-26 — F07 sabit kapanış listesi ve R08/156% ölçümü

Bu kayıt, erişilebilir 91a0 checkout'undaki v30/p08/ABI v2 durumunu esas alır. Önceki v42/p19 worktree boş ve Git'e bağlı değildir. Önceki R01/R02a/R02b tamamlandı kayıtları tarihsel kanıttır; bunların kodu bu checkout'ta bulunmadığından burada tekrar PASS sayılmaz. Ana plandaki R01 production paketi ile aşağıdaki F07 iç liste farklıdır.

| F07 iç iş | Kapanacak kabul koşulu | Kapının tam PASS olması için kalan |
|---|---|---|
| R01/R02a/R02b — tarihsel, bu checkout'ta doğrulanamıyor | Uzun doğrudan LINE ve ölçülen HATCH alt profilleri | v42 kodu/fixture'ları kurtarılıp yeniden doğrulanmalı; bu turda yeniden yapılmadı |
| R03 — sıradaki; v42 önkoşullu | Genişlikli/kesikli doğrudan LINE ve 256 dilim sınırında bounded spatial chunk, painter order, PATH_DISTANCE, high-origin bbox ve viewport fetch | Tek uzun primitive, diğer geometri ve chunk yaşam döngüsü ayrıca kalır |
| R04 | LINE dışı stroke ailelerinde yerel spatial chunk | R03 ve kalan fill/glyph/pafta, bileşik hata gerekir |
| R05 | Fill, glyph ve aktif pafta chunk fetch | Bileşik hata, diğer aileler ve yaşam döngüsü gerekir |
| R06 | Fill/glyph/chunk-boundary bileşik hata muhasebesi | Bütün desteklenen aile ve zoom sınırları gerekir |
| R07 | PATH_DISTANCE shader/desen aileleri ve chunk sınırı | Stil/ölçek matrisi ve gerçek raster doğrulaması gerekir |
| R08 — bu tur 156% DPR1/DPR2 ARC alt profili ölçüldü | Geniş geometri/zoom/pan/DPR rendered-error matrisi | DPR3, diğer aile/bağlamlar ve native cihaz R09 gerekir |
| R09 | Gerçek GPU/cihaz rendered-error profili | R08 matrisi ve planın kabul cihazı gerekir; F08 bellek koşulları ayrı fazdır |
| R10 | Aynı kaynak AutoCAD görsel ve DIM oracle'ı | Native referans çıktısı, aynı kaynak/ayar karşılaştırması gerekir |
| R11 — plan gereği açıkça eklendi | Periodic SPLINE degree/knot multiplicity/domain/weights/endpoint profil matrisi | Tek ölçülmüş AutoCAD degree-3/multiplicity-2 fixture genel matrisi kapatmaz |

R11 gerekçesi ana v3 planı F07 maddelerindeki degree, knot multiplicity/domain, periodicity, weights ve endpoint doğrulama şartıdır; kurtarılan özet listede ayrı sonlu iş olarak yoktu. F07'nin yedi terminal kapısından hiçbiri bu erişilebilir checkout'ta tam kapsamıyla yeni PASS olmadı. Tarihsel kapı 1/2 profil PASS kayıtları genel profil PASS sayılmaz; kapılar 3-7 PARTIAL, native AutoCAD karşılaştırması NOT_RUN. Genel planın önceki 14/19 paketi bu turda değiştirilmedi.

R08/156% ölçümü: gerçek host/worker/WebGL2 DPR1'de 612 piksel için 0,9621349720/0,7532715925 CSS px; DPR2'de 1.544 piksel için 0,5933250455/0,4743416490 CSS px. Her iki profilde 0,25 px idle hedef, gerçek +48,+24 pan ve 1,25 px raster zarfı doğrulandı. Chromium 2/2 ve son DPR1 retry 1/1, ilgili üç test 3/3, runtime typecheck ve diff-check PASS. Kanıt D:\codex-cad-v2-r08-156-20260926-003/-004/-005. Sıradaki devam R03'tür; önce kayıp v42/p19 çalışma içeriğinin kurtarılması veya kanıta dayalı yeniden kurulması gerekir. R03 bu v30 checkout üstünde kapanmış sayılmaz.

## 2026-09-26 -- F07 internal R11 supported periodic SPLINE matrix

R03 prerequisite audit: the old v42/p19 worktree is empty and unregistered; session logs and retained output do not provide an intact source/fixture snapshot. No spatial patch was transferred to v30. Independent R11 supported synthetic DXF source/worker matrix is DONE: degree 1–8, multiplicity 1/2/3 on degree 3, active-domain shifts/scales, weights, endpoint closure, 28,007 De Boor samples with 0.0436049487 / 0.05 maximum error, and 43/43 worker spans. Unit gate and runtime typecheck passed. Seven terminal F07 gates: 0/7 fully PASS; native AutoCAD multi-profile comparison under R10 and physical GPU under R09 remain NOT_RUN. Next `devam`: R03 source recovery/reconstruction followed by wide/dashed LINE >256-slice spatial and host viewport-fetch acceptance.

## 2026-09-26 — F07 sabit liste R03 uygulama sonucu

R03 bu turda erişilebilir v30/p08 çalışma ağacında bağımsız tamamlandı; v42/p19 kodu/fixture'ı mevcutmuş gibi kullanılmadı. Genişlikli/kesikli top-level LINE spatial chunk, painter order, PATH_DISTANCE, high-origin bbox, >256 dilim partial sınırı ve host viewport fetch kabul profili eklendi. 12.000 world-unit LINE 3 chunk; 1e9 origin bbox/uç oracle'ı PASS; 1.100.000 world-unit LINE 269 slice gerektireceğinden tek chunk'ta korunup qualityStatus=degraded ve DIRECT_LINE_SPATIAL_PARTITION_LIMIT_REACHED tanısı alır.

R03 doğrulaması: yeni compiler testi 24 assertion; painter-order, scheduler/cache, layout viewport 9/9; Chromium'da host viewport fetch 1/1, layout selection 1/1 ve DASHED PATH_DISTANCE one/six-chunk raster equality 1/1; runtime tsconfig.next typecheck PASS. Tam unit/release zinciri bu turda çalıştırılmadı. Compiler/cache v31, pipeline p08, schema v1, ABI v2.

Paket R03 kapsamı tamamlandı; bununla yedi terminal F07 kabul kapısının hiçbiri genel kapsamıyla kapanmadı: 0/7 tam PASS. Genel planın önceki 14/19 paketi ve 5 açık paket değişmedi.

| Sonraki paket | Somut kalan iş |
|---|---|
| R04 | LINE dışı stroke ailelerinde spatial chunk: curve/polyline/bulge kaynak ailelerini, phase ve sınırları ile sınırlı partial sözleşmeyi test et. |
| R05 | Fill/glyph ve aktif pafta chunk fetch; host layout/camera görünürlüğünü bu geometrilere bağla. |
| R06 | Fill/glyph/chunk-boundary bileşik hata muhasebesi. |
| R07 | PATH_DISTANCE shader desen aileleri ve chunk sınırı matrisi. |
| R08 | DPR3, ek geometri/zoom/pan ve bağlam rendered-error ölçümleri. |
| R09 | F08 bellek yaşam döngüsünden ayrı olarak gerçek GPU/cihaz rendered-error ölçümü. |
| R10 | Aynı kaynak AutoCAD görsel ve DIM oracle'ı; native karşılaştırma şu ana kadar NOT_RUN. |
| R11 | Periodic SPLINE degree/knot multiplicity/domain/weight/endpoint profil matrisi; tek sentetik/AutoCAD fixture genel matris değildir. |

Bir sonraki devam: R04.

## 2026-09-26 — F07 R04 doğrudan stroke izlenebilirliği

| Profil | Kaynak/binary/worker kanıtı | Durum |
|---|---|---|
| Direct CIRCLE / ARC / ELLIPSE / SPLINE | 1e9 origin; 4 / 3 / 3 / 3 bounded chunk; her chunk CURVE_DATA + META provenance ve worker interval kabulü | R04 PASS, bu profiller |
| Direct widthless LWPOLYLINE/BULGE | Bulge yan verisi; 12.000-unit düz devam; monoton PATH_DISTANCE; geç overlay sırası | R04 PASS, bu profil |
| 256-chunk sınırı | 1.100.000-unit kenar, 600.000-radius daire, 299 kenarlı zikzak; geometri korunur, ayrı diagnostic/degraded | bounded PARTIAL sözleşmesi |
| Host viewport fetch | Gerçek Chromium host yakın chunk ilk fetch, uzak chunk görünür olunca fetch; 1/1 | PASS, genel fetch yolu |
| Nested INSERT / pafta stroke, width mesh, HATCH, glyph, tüm dash ailesi | Bu R04 oracle kapsamında yok | AÇIK |

Doğrulama: tam CAD V2 unit zinciri PASS, runtime tsconfig.next PASS, R04 doğrudan test PASS, Chromium 1/1 PASS. Test-kapsamlı tsconfig.json eski hatalarla exit 2. F07 terminal kapı 0/7 tam PASS; planın son belgeli sayımı 14/19, 5 açık. Compiler/cache v32, pipeline p08, schema v1, ABI v2. Sonraki devam: R05 fill/glyph ve aktif pafta chunk fetch; nested/pafta stroke boşluğu bu kapsamda ayrıca izlenmeli.

## 2026-09-26 — F07 iç R05 kanıt matrisi

| Kapsam | Kanıt | Durum |
|---|---|---|
| HATCH adaları / genişlikli LWPOLYLINE | 4×100×100=40.000 alan; 12.000×20=240.000 alan ve 12 üçgen; bounded chunk | R05 PASS, doğrudan profiller |
| TEXT / MTEXT | 1e9 yüksek origin; sıralı bounded chunk; lokal XY <4.096 | R05 PASS, doğrudan profiller |
| WIPEOUT / glyph / 256-grup sınırı | Büyük tek üçgen/glyph ve 299-edge fill geometriyi korur; ayrı degraded tanıları | bounded PARTIAL sözleşmesi |
| Aktif pafta fetch | Chromium 1/1: Model, SHEET_A yakın fill, zoom sonrası uzak glyph, seçim sonrası SHEET_B; her chunk bir kez | R05 PASS, host profili |
| Nested INSERT / viewport-projected fill/glyph | R05 oracle kapsamında değil | AÇIK |

Hedefli testler, tam check:cad-v2:unit ve runtime tsconfig.next PASS; test-kapsamlı tsconfig.json mevcut hatalarla exit 2. Compiler/cache v33, pipeline p08, schema v1, ABI v2. F07 terminal 0/7 tam PASS, son belgeli plan 14/19 (5 açık). Sonraki devam: R06 fill/glyph/chunk composite; nested/viewport boşluğu ayrıca izlenir.

## 2026-09-26 — F07 iç R06 kanıt matrisi

| Kapsam | Bağımsız kanıt | Durum |
|---|---|---|
| Temas eden HATCH fill chunk'ları | Bilinen dört dikdörtgen köşesi ile binary round-trip; çift 2.384185791015625e-7 world | R06 statik PASS |
| Uzun glyph chunk sınırı | Dönük yüksek-origin glyph; çift 0.00008489787140318244 world | R06 statik PASS |
| Fill→glyph painter chunk sınırı | Geniş dolgu üstüne sonraki glyph; çift 1.1920928955078125e-7 world | R06 statik PASS |
| Aynı chunk fill+glyph | Bilinen fill köşeleri ve glyph segment uçları; toplam 0.000028610479930766117 world; 0,25 CSS px birleşik eşik tanısı | R06 statik PASS |
| Uzak fill+glyph, manifest bütünlüğü | Etkileşim sıfır; negatif ve flat/index çelişkili metrik reddi | PASS |
| Non-adjacent chunk, nested/viewport glyph, font outline, worker/GPU raster | Bu statik oracle kapsamında değil | AÇIK |

Tam check:cad-v2:unit ve runtime tsconfig.next PASS. Test-kapsamlı tsconfig.json mevcut 212 tanıyla exit 2; R06 dosyalarında tanı yok. Compiler/cache v34, pipeline p08, schema v1, ABI v2. F07 terminal 0/7 tam PASS; son belgeli plan 14/19 (5 açık). Sonraki devam: R07 PATH_DISTANCE shader/desen ailesi ve chunk sınırları.

## 2026-09-26 — F07 iç R07 çok terimli desen kanıtı

| Profil | Ölçüm | Durum |
|---|---|---|
| Uzun CENTER LINE | 12.000 world unit, 1e9 origin, 3 bounded chunk, kesintisiz PATH_DISTANCE | PASS, kaynak/binary |
| CENTER/PHANTOM/leading-gap polyline | 1/6 chunk'ta aynı 12 mesafe; 4/6/4 terimli işaretli desen korunur | PASS, kaynak/binary |
| CENTER gerçek WebGL2 | 1/6 chunk'ta 8 aynı koşu; SHA-256 f648aab259891d658e1b861175b5e26f5617d9a9c33fd5dd8a58307e72958b6a | PASS, Chromium 1/1 |
| İki terimli DASHED regresyonu | 1/6 chunk'ta 5 aynı koşu; eski hash 264758117837085532fc5ad17b5f5b9ff469b550540ccf1a0dd14e68d678545b | PASS |
| Dot, kalın, kapalı; eğri/bulge/shape, model/pafta/mirrored | İlk üçü CPU fallback; geniş rendered/AutoCAD faz matrisi yok | R07 PARTIAL/AÇIK |

Linetype 12/12, yeni hedefli test, tam CAD V2 unit, runtime tsconfig.next PASS; genel tsconfig mevcut 212 tanıyla exit 2. Compiler/cache v35, pipeline p08, schema v1, ABI v2. F07 terminal 0/7 tam PASS; son belgeli plan 14/19 (5 açık). Sonraki devam: R07 kalan eğri/kapalı/nokta/shape ve ölçek profilleri; sonra R08 geniş rendered-error matrisi.

## 2026-09-26 — R07 bulge/dot izlenebilirliği

Kod: geometry-compiler.ts getBulgeArcParameters erişimi; scene-compiler.ts kaynak-vertex analitik dash fazı; cad-stroke.ts sonlu teğet nokta; version.ts compiler v36. Kanıt: analytic-bulge-dash.test.ts (8 nokta, 40 PATH_DISTANCE, 10/20 birim sınır, kapalı kenar), f07-dash-render-scene.ts ve cad-v2-layout-viewport.spec.ts (Chromium/WebGL2 1/36 chunk, 846 piksel, eşit SHA-256). Tam unit zinciri ve runtime typecheck PASS; AutoCAD/native parite henüz yok.

## 2026-09-26 — R07 kalın DASHED izlenebilirliği

Kod: cad-v2-host-shell.tsx renderer-ready lineweight ayarı; cad-v2-view-settings-panel.tsx erişilebilir toggle. Kanıt: wide-dash-phase.test.ts dört kaynak ağırlığı/ölçek 2/binary 1:çok chunk; f07-dash-render-scene.ts ve cad-v2-layout-viewport.spec.ts gerçek Chromium 1:5 chunk, 16.728→1.387→16.728 piksel ve geri gelen kırmızı maske toplamı 4205881069. Tam PNG tek/çok chunk hash eşit; toggle sonrası PNG byte hash'i farklı olduğu için görünür kırmızı piksel maskesi kabul ölçütüdür. Compiler/cache v36, F07 0/7 tam PASS; native AutoCAD ve model/pafta/mirrored matris açık.

## 2026-09-26 — R07 aynalı/pafta LINE faz izlenebilirliği

Kod: entity-visitor.ts source-first LINE dash ve XCLIP mesafe interpolasyonu; scene-compiler.ts INSERT/viewport PATH_DISTANCE aktarımı ve sıfır uzunluklu sınır elemesi; version.ts compiler v37. Kanıt: transformed-dash-phase.test.ts kaynak/binary ayna 1:5, viewport 1:3, doğrudan pafta shader 20/20; f07-dash-render-scene.ts + cad-v2-layout-viewport.spec.ts Chromium/WebGL2 ayna 1.211, viewport 727 kırmızı piksel ve iki partition için eşit tam PNG SHA-256. Unit zinciri, runtime typecheck ve browser 1/1 PASS; AutoCAD, global/annotation ölçek ve diğer affine eğri aileleri açık.


## 2026-09-27 — R07-E linetype traceability

| Requirement | Implementation | Current evidence | Remaining |
|---|---|---|---|
| DXF LTYPE table reaches canonical | `decode/dxf-adapter.ts`, `decode/dxf-linetype-pairs.ts` | `complex-linetype.test.ts`, ASCII and binary source | Complex glyph geometry |
| DWG LTYPE table reaches canonical | `decode/dwg-adapter.ts`, `decode/linetype-record.ts` | R001 P04 decoder test: 8 records; synthetic DWG-shaped record metadata test; libredwg error 68 logged | Real complex DWG glyph profile and clean decode oracle |
| Unsupported shape/text is visible to quality accounting | `canonical/diagnostics.ts`, `linetype-record.ts` | Scene diagnostic code and explicit `isContinuous=false` assertion | Correct rendered shape/text, font/SHX profile and AutoCAD comparison |

Fixture identity: `known-geometry-measurements.dxf` SHA-256 DDFC5AE7D57860B35B4EC66A653D247E6A9DFAD658E739ECC132EFB2EB6B0DD9; R001 DWG SHA-256 17A92CB544830845FC59717ABCC22D3CDCF97C12B8450602C9C70EC4A507F086. Test source SHA-256 EC209F51EC577FB77C0BEEE171E8C80F3B16188715010D060D35B0359340DEBF.

Commands: `npx tsx tests/cad-v2/complex-linetype.test.ts`; `npx tsx tests/cad-v2/decoder-field-contract.test.ts`; `npx tsx tests/cad-v2/linetype-phase.test.ts`; `npx tsx tests/cad-v2/cache-identity.test.ts`; `npx tsc --noEmit --target es2020 --module esnext --moduleResolution bundler --jsx preserve --skipLibCheck --esModuleInterop --allowSyntheticDefaultImports tests/cad-v2/complex-linetype.test.ts`. All passed. Compiler/cache v37→v38. F07 remains 0/7; R07-E is partial.

Changed-source SHA-256: `dxf-linetype-pairs.ts` 40E62E00B56D2A2ACBCBA39EF56BF60389279EDE528A91E2365039A92B268C90; `linetype-record.ts` 11E86744239903CC24B5565BFBE4E97D8156AC464478F8EA9438CE0BCAC59B22; `dxf-adapter.ts` 4182DE50D3456274801C4514BC059FFB4E59F3C921E9B14A2B1D684E757CEAAA; `dwg-adapter.ts` D72B1CA858A863D2310F175E183B338F096CDDAC7791054FF054594E80996707; `canonical/types.ts` 9E75F7A52D04BC5E093D968DF9B73D1186893FC1232D089C6C32E8D418BC83D0; `canonical/diagnostics.ts` FA1841DACDF0E2E5572015AFB5C2DBAD3DA169E8AC47ED4ABA06410B36BBED9E; `version.ts` 5AA4F84D2A07C2AC8C40ED458C5F7DDED174369BB468A0845B972D3333C9A8D6; `decoder-field-contract.test.ts` 9FE751455B2FDB9781B540CE63FE538B35C8B3C50F7E580909F729AE5FB1D509; `package.json` 28204DD7718E641E33B865E64AF92AFD4456620B1D6B551326B406FB5B5CCC40.

## 2026-09-27 — R07-E STYLE/source-handle traceability

| Requirement | Implementation | Current evidence | Remaining |
|---|---|---|---|
| DXF STYLE details reach canonical | `decode/dxf-style-pairs.ts`, `decode/text-style-record.ts`, `decode/dxf-adapter.ts` | complex fixture ASCII+binary: font/shape records, handles and LTYPE references match | No glyph geometry |
| DWG STYLE table reaches canonical | `decode/dwg-adapter.ts`, `decode/text-style-record.ts` | R001 P04: 12 entries; `Standard` font `arial.ttf`; error 68 logged | Clean complex DWG oracle |
| Group 74 type bits | `canonical/types.ts`, `complex-linetype.test.ts` | text bit 2, shape bit 4 | Rendering and AutoCAD profile |
| Simple DWG pattern defaults are not complex glyphs | `decode/linetype-record.ts` | three project DWGs: 14/6/8 LTYPE records, zero false complex metadata/warnings after fix; decoder errors 64/68 remain | A clean complex DWG profile |

Compiler/cache v40; pipeline p08, schema 1, ABI `three172-cad2d-v2`. Autodesk group-74 and complex text/shape semantics: [LTYPE DXF](https://help.autodesk.com/cloudhelp/2020/ENU/AutoCAD-DXF/files/GUID-F57A316C-94A2-416C-8280-191E34B182AC.htm), [text in custom linetypes](https://help.autodesk.com/cloudhelp/2021/ENU/AutoCAD-Customization/files/GUID-FEDCE7EB-4919-43AE-A54E-F3A293DD60CA.htm), [shapes in custom linetypes](https://help.autodesk.com/cloudhelp/2020/ENU/AutoCAD-MAC-Customization/files/GUID-AF0613E6-5C8B-47F0-800C-8B2524BF2015.htm). Current-tree source/test and inspected-fixture hashes are recorded below; no commit/push/PR/deploy was made.

### R07-E current-tree SHA-256 — 2026-09-27

These hashes identify the dirty active worktree state used by the targeted checks; they are not commit identities.

| Kind | Path | SHA-256 |
|---|---|---|
| Source | `src/lib/cad-v2/decode/dxf-style-pairs.ts` | `5638F584DA38654217C3B07B3E914430304566EB9AE3EAC4FD31A680498748FC` |
| Source | `src/lib/cad-v2/decode/text-style-record.ts` | `DCE9FA17BE1732C63CEEEE565C8BBE6CF550C9BFF987BD813DE116431A318938` |
| Source | `src/lib/cad-v2/decode/linetype-record.ts` | `AFA08FEF1628F18547532A8D6B4CAA0C514EFCCFED5D74C4803E3791F7BC6409` |
| Source | `src/lib/cad-v2/decode/dxf-adapter.ts` | `90E56B2A6A36DBDFC05A145CE68B1F121DE9E98B0BCDC2F77B0C07FBADBBA291` |
| Source | `src/lib/cad-v2/decode/dwg-adapter.ts` | `434E0A368E6292F405A768D4C0FD5321D06340292ED647A975ED02A7A58E265E` |
| Source | `src/lib/cad-v2/canonical/types.ts` | `A36274AE4952CFF86F1E91EA1B8AA90D6A2E228153EFFC758EAAB09E2F0FE07D` |
| Source | `src/lib/cad-v2/version.ts` | `5255891A375B29451DA61A675ABBF792424E6EBBCE12213ADC7FD03AC5435E41` |
| Test | `tests/cad-v2/complex-linetype.test.ts` | `90014CF306B58AA0E6A7963112F304A2BE2EC743DA82EA9E49BAB7973BD701CA` |
| Test | `tests/cad-v2/decoder-field-contract.test.ts` | `E601BA005089FF3FC9B692A9D9CECB76E2D59C259BDBAD64A0BF4056E97B7BC9` |
| Fixture | `tests/fixtures/cad-preview-v2/known-geometry-measurements.dxf` | `DDFC5AE7D57860B35B4EC66A653D247E6A9DFAD658E739ECC132EFB2EB6B0DD9` |
| Inspected drawing | `eklediklerim/ornek_dosyalar/MUSTAFA SELVİ 1.KISIM STATİK.dwg` | `8FF5680FA4F9D570FED738DEF92BC6CA8149FDE1B5AED9E0A495DD2BAAF521E6` |
| Inspected drawing | `eklediklerim/ornek_dosyalar/kiris_acilimlari_tum_katlar.dwg` | `9A59FF9E5496E2A3C62B378F062E5F0F3CFA707B9BD4B5A0BF6749CD8BF52459` |
| Inspected drawing | `eklediklerim/ornek_dosyalar/1 ve 2.kat dwg.dwg` | `17A92CB544830845FC59717ABCC22D3CDCF97C12B8450602C9C70EC4A507F086` |

Targeted checks on this state: `complex-linetype.test.ts`, `decoder-field-contract.test.ts`, `linetype-phase.test.ts`, `cache-identity.test.ts` and scoped TypeScript compilation passed. The two DXF/DWG decoder checks and fixture evidence do not constitute clean full-DWG or glyph-render acceptance; R001 still logs libredwg error 68.

## 2026-09-27 — R07-E native DWG style reference and standalone placement fixture

| Requirement | Implementation | Current evidence | Remaining |
|---|---|---|---|
| DWG dash STYLE reference | `decode/dwg-linetype-style-refs.ts`, `decode/dwg-adapter.ts` | pre-free native pointer scan; `dwg_ref_get_id`; allowlisted against converted STYLE table handles; fake API join test | No local DWG contains a populated complex dash STYLE reference; R001 error 68 |
| Shape/text source placement | `tests/fixtures/cad-preview-v2/r07-complex-linetype-placement.dxf` | source ASCII/binary fixture covers group 74/75/340/46/50/44/45/9 and mapped font probe | Synthetic DXF only; missing SHX, no glyph geometry or raster evidence |
| Cache/source identity | `src/lib/cad-v2/version.ts` | compiler/cache v41; cache-identity test passed | No scene output changes until glyph geometry is implemented |

Generic DWG object-reference evidence: an R001 DIMSTYLE probe resolved STYLE IDs/names including `11`/`Standard` and `8C90`/`ROMANT`. This verifies Libredwg's generic reference resolver, not a populated `Dwg_LTYPE_Dash.style` pointer in a clean file. Targeted current-state checks passed: `dwg-linetype-style-refs.test.ts`, `complex-linetype.test.ts`, `decoder-field-contract.test.ts` (error 68 remains), `linetype-phase.test.ts`, `cache-identity.test.ts` and scoped TypeScript compilation. AutoCAD/accoreconsole/ODA converter were not found on PATH; no SHX/LIN asset exists in the checkout. Synthetic field fidelity does not promote R07-E or F07 acceptance.

Current v41 source/test/fixture hashes for this group’s dirty worktree state (not commit IDs):

| Kind | Path | SHA-256 |
|---|---|---|
| Source | `src/lib/cad-v2/decode/dwg-linetype-style-refs.ts` | `036A8BE264A8481B3F58E76AB7D2D477F898A9B4633B70B83CC395513638F897` |
| Source | `src/lib/cad-v2/decode/dwg-adapter.ts` | `CFBC5DAB019C177E3E288A7A766CC3540D5D080BBBBF8B6B71953C48C8B5DD43` |
| Source | `src/lib/cad-v2/version.ts` | `537DC278EF5EE2E45929BBBE67744483111F76F97C1C909367262F751F699EEA` |
| Test | `tests/cad-v2/dwg-linetype-style-refs.test.ts` | `0A20E00C1AEEB6D278385B4AECC2613360DE553B33740D0F4A1690536A672E51` |
| Test | `tests/cad-v2/complex-linetype.test.ts` | `807EC396200BC1DDCA67C57B217CE987BC414E20537DA07D119F41304D543FC0` |
| Fixture | `tests/fixtures/cad-preview-v2/r07-complex-linetype-placement.dxf` | `C448715A57E147231DCAA29983CEC3C1133161708C42BE7DA3CF08C8075DF2AC` |

## 2026-09-27 — R07-E exact-font glyph geometry and source phase

The v42 compiler joins each LTYPE complex element to canonical STYLE identity, produces SHX shape or TEXT line geometry through existing font/layout APIs, repeats by source pattern distance, and emits it through direct LINE and `EntityVisitor` paths. Bit-1 absolute rotation, tangent-relative rotation, scale and X/Y offsets are honored. A rotation-only bit without embedded text/shape is inert metadata; it does not emit a false warning. Missing/non-exact resources produce a compile-time unsupported diagnostic and degraded quality; ordinary source dash geometry remains present. Straight-source glyphs therefore follow existing spatial chunking without resetting their source placement.

| Control | Result |
|---|---|
| `npx tsx tests/cad-v2/complex-linetype.test.ts` | PASS — ASCII/binary source fields, missing SHX degradation, exact synthetic SHX shape + bundled Arial text, absolute/relative rotation, inert rotation-only metadata, x=4096 phase/chunk seam, mirrored INSERT |
| `npx tsx tests/cad-v2/path-distance-multiterm.test.ts` | PASS — existing multi-term source phase/chunk baseline |
| `npx tsx tests/cad-v2/transformed-dash-phase.test.ts` | PASS — existing mirrored and viewport dash phase regression |
| `npx tsx tests/cad-v2/cache-identity.test.ts` | PASS — v42 compiler identity invalidates scene identity |
| Scoped changed-module TypeScript command | PASS — TypeScript 5.6, target ES2020, changed helper/visitor/compiler/decoder/version/test and `src/types/opentype.d.ts` |
| `npx tsc --noEmit --incremental false` | FAIL (exit 2) — existing unrelated repository scripts/tests; filtered output contained no diagnostics in changed CAD modules/test |
| Source `git diff --check` | PASS for changed CAD implementation/test paths. Repository-wide check still reports CRLF whitespace in earlier dirty evidence docs. |

No AutoCAD/accoreconsole/ODA converter, actual SHX/LIN resource, or DWG with a populated complex dash `style` pointer was available. Existing R001 path still emits libredwg error 68. The in-memory SHX profile proves compiler geometry wiring only, not CAD-native glyph parity. Curved-source complex glyph placement and native/raster comparison remain open. F07 terminal gates are 0/7; overall 14/19 remains historical. Next group: map embedded glyph placement onto ARC/CIRCLE/BULGE and other supported curved source distances, then verify curve phase/chunk boundaries.

Relevant Autodesk DXF contract: [LTYPE group codes](https://help.autodesk.com/cloudhelp/2020/ENU/AutoCAD-DXF/files/GUID-F57A316C-94A2-416C-8280-191E34B182AC.htm) defines group 74 absolute/text/shape flags and group 50 rotation in radians.

Dirty `91a0` source state on branch `codex/srdr-dwg-motor-v2-fidelity`, HEAD `4b51ebe6b1470c6a247e03158dfe4b5359621c97`; compiler/cache v42, pipeline p08, schema 1, ABI `three172-cad2d-v2`. Current SHA-256:

| Kind | Path | SHA-256 |
|---|---|---|
| Source | `src/lib/cad-v2/compile/complex-linetype-glyphs.ts` | `DCC7466A02C18EB183E073AEDFBF51A152138BEB96C06492E24DE35800729789` |
| Source | `src/lib/cad-v2/compile/entity-visitor.ts` | `DA069F1F5C16C53A5B0BBBECEE5ACF1B06745BB8BDE67FA0E6FCD72371898C19` |
| Source | `src/lib/cad-v2/compile/scene-compiler.ts` | `4F8055451A52E0462393D9856E06F5F06315E65A210243B0B7F79AA44A684EF2` |
| Source | `src/lib/cad-v2/decode/linetype-record.ts` | `C621BF4EC5FC352567002DE153F2E4F4E9A93B9A7AB8AA2106CFE56B9F29DFC5` |
| Source | `src/lib/cad-v2/version.ts` | `286F05D1F136C3694BB84A4E7AF2259B5906B1A9E811B0601C546B065857FB81` |
| Test | `tests/cad-v2/complex-linetype.test.ts` | `94EAAC390A7712EB3AA39A4DDE5FDD9A675BEBACE45D4242CFFED3E585FA87B7` |

## 2026-09-27 — R07-E curved-source geometry and phase (compiler/cache v43)

The v42 straight-line helper now has a source-path station evaluator. ARC and CIRCLE use exact radius×sweep distances and analytic tangent direction. LWPOLYLINE combines straight edges and exact bulge arc lengths; `plinegen=false` resets the complex pattern per edge, and closed circles omit the duplicate terminal anchor. ELLIPSE and SPLINE use their bounded tessellation path, with that approximation recorded as a limitation. Direct scene glyphs and `EntityVisitor` glyphs are emitted in source coordinates before nested/viewport affine transforms. Empty/non-complex linetypes return before curve sampling, avoiding tessellation work on ordinary drawings.

The synthetic SHX acceptance in `complex-linetype.test.ts` checks six anchors on a radius-50 quarter ARC at 15-unit spacing, 21 unique CIRCLE anchors, and 11 anchors on a bulge-1 semicircle. It also checks `PLINEGEN=1` continuation against `PLINEGEN=0` per-edge restart. A radius-4200 CIRCLE is split over spatial chunks and its encoded glyph-stroke count matches the helper expectation exactly; the same source with `complexElements` removed is the baseline. A nested mirrored ARC adds the expected source glyph count without a quality warning. These tests verify local geometry plumbing and chunk survival, not a CAD-native raster oracle.

| Control | Current result |
|---|---|
| `npx tsx tests/cad-v2/complex-linetype.test.ts` | PASS — analytic ARC/CIRCLE/BULGE stations, direct curve chunk count, nested mirrored ARC, plus prior LINE/font/decoder cases |
| `npx tsx tests/cad-v2/analytic-bulge-dash.test.ts` | PASS — analytic bulge, closed edge and dot arcs |
| `npx tsx tests/cad-v2/path-distance-multiterm.test.ts` | PASS — multi-term PATH_DISTANCE regression |
| `npx tsx tests/cad-v2/transformed-dash-phase.test.ts` | PASS — mirror/viewport phase regression |
| `npx tsx tests/cad-v2/direct-line-spatial-partition.test.ts` | PASS after replacing its obsolete v37 literal with `CAD_V2_COMPILER_REVISION` |
| `npx tsx tests/cad-v2/non-line-stroke-spatial-partition.test.ts` | PASS — curve/bulge spatial partition, sidecars, phase and bounded fallback |
| `npx tsx tests/cad-v2/cache-identity.test.ts` | PASS — active v43 compiler identity |
| Scoped TypeScript check | PASS — helper, visitor, scene compiler, version and touched tests with strict options |

Compiler/cache is `cad-v2-compiler-2026.09-v43`; pipeline `fidelity-v3-p08`, schema 1 and ABI `three172-cad2d-v2` unchanged. F07 remains 0/7 fully accepted and the overall 14/19 count remains historical. Positive complex DWG style reference, real SHX asset and same-source AutoCAD acceptance remain open. R07-E stays partial. Next group: R07-F affine curved-source transforms and source phase across transformed/chunked placements.

Dirty source state: branch `codex/srdr-dwg-motor-v2-fidelity`, HEAD `4b51ebe6b1470c6a247e03158dfe4b5359621c97`; no staging or commit. Current source/test SHA-256:

| Kind | Path | SHA-256 |
|---|---|---|
| Source | `src/lib/cad-v2/compile/complex-linetype-glyphs.ts` | `100A13C39554731F930CACC97E8530C288FCCAEB050BD1705DA183BDC3DA27C4` |
| Source | `src/lib/cad-v2/compile/entity-visitor.ts` | `F34A3CA5FCBAB95149FA1A701FC124DAFF9477E2783956AD4C8E55CABF668345` |
| Source | `src/lib/cad-v2/compile/scene-compiler.ts` | `D138C90AFD3205C3A0266329A5FA8A57679F8F19C0EA19B93208CB74CAEA1FF9` |
| Source | `src/lib/cad-v2/version.ts` | `B4E6A6913E87D99B82C6A1CEDDDC8B924A281222F63FB93C2D20F9E933EFF943` |
| Test | `tests/cad-v2/complex-linetype.test.ts` | `99B934A1CA9EB8B4430B0EBBD43DEE732FB80958DAF7E31A8889E3AD4797D48E` |
| Test | `tests/cad-v2/direct-line-spatial-partition.test.ts` | `23AAA51CE05A087B788B2A42EF57DE89B1CB0EE2E663B0163C82073C9381D92F` |

## 2026-09-27 — R07-F affine source glyph and nested spatial partition (v44)

Active checkout remains `C:\Users\hsyn\.codex\worktrees\91a0\muhendis-mimar-portali`, branch `codex/srdr-dwg-motor-v2-fidelity`, HEAD `4b51ebe6b1470c6a247e03158dfe4b5359621c97`, dirty. This group changed `scene-compiler.ts` and compiler/cache version only; pipeline p08, schema 1 and ABI `three172-cad2d-v2` remain unchanged.

| Check | Result |
|---|---|
| `npx tsx tests/cad-v2/complex-linetype.test.ts` | PASS after the test first reproduced the nested INSERT single-range gap; affine source endpoints for ARC/CIRCLE/BULGE/ELLIPSE/SPLINE, multi-chunk CIRCLE and paper viewport glyph deltas pass |
| `npx tsx tests/cad-v2/direct-line-spatial-partition.test.ts` | PASS |
| `npx tsx tests/cad-v2/non-line-stroke-spatial-partition.test.ts` | PASS |
| `npx tsx tests/cad-v2/transformed-dash-phase.test.ts` | PASS |
| `npx tsx tests/cad-v2/painter-order.test.ts` | PASS |
| `npx tsx tests/cad-v2/entity-instance-parity.test.ts` | PASS |
| `npx tsx tests/cad-v2/block-expansion-budget.test.ts` | PASS |
| `npx tsx tests/cad-v2/cache-identity.test.ts` | PASS |
| `npx tsc --noEmit -p tsconfig.next.json --incremental false` | PASS |
| Strict standalone TSC of `tests/cad-v2/complex-linetype.test.ts` and `src/types/opentype.d.ts` | PASS |
| `git diff --check -- src/lib/cad-v2/compile/scene-compiler.ts src/lib/cad-v2/version.ts` | PASS |
| Browser/WebGL raster comparison | NOT_RUN in this group; next R07-F work |
| Positive complex DWG/actual SHX and same-source AutoCAD raster | NOT_AVAILABLE / R10 external dependency |

Current SHA-256:

| Path | SHA-256 |
|---|---|
| `src/lib/cad-v2/compile/scene-compiler.ts` | `DB03362FF75EF0081B5C84FD5B0E580779E004CC521F0140998A7AECDEBFAF21` |
| `src/lib/cad-v2/version.ts` | `4A2DAE8F1A1C803178B4080E7E75ECD1B160BF1CD859B7E05749589B14303E5D` |
| `tests/cad-v2/complex-linetype.test.ts` | `C80C26F08CADE1D27B051505AE24775E8E959E9BF961132F26E4A354AA567B2C` |

The new curve-family oracle is local synthetic geometry only; it makes no native fidelity claim. F07 stays 0/7 terminal gates; 14/19 remains historical. No staging, commit, push, PR or deploy.

## 2026-09-27 — R07-F nested affine SHX WebGL raster (v44)

**Scope and result.** Added `tests/cad-v2/r07-affine-glyph-raster-scenes.ts`, which compiles one curved ARC+SHAPE source through two nested affine INSERTs into Model and a SHEET viewport. Its synthetic SHX font is deterministic and exact only within this in-memory fixture. A single-chunk compile is compared with the same geometry compiled at `maxPrimitivesPerChunk: 1`. Added `tests/document-studio/cad-v2-affine-glyph-raster.spec.ts` to upload two known-geometry host fixtures, serve the compiler scenes through CAD V2 routes, render Chromium/WebGL canvases, and compare full PNG SHA plus red-pixel masks. Both manifests are exact with no diagnostics. Model chunk counts are 1/52; paper counts are 1/46.

| Check | Result |
|---|---|
| `npx tsx tests/cad-v2/r07-affine-glyph-raster-scenes.ts` | PASS — exact Model and SHEET scenes, 1/52 and 1/46 chunks, zero diagnostic codes |
| `npx playwright test --config=playwright.config.ts tests/document-studio/cad-v2-affine-glyph-raster.spec.ts --project=chromium --reporter=line` | PASS — 1/1, 29.2 s; single/split masks and full PNGs byte-identical per layout |
| Model raster | PASS — 1,427 red pixels, FNV mask `2274897639`, PNG SHA-256 `dadeb8a9a163248bf7bfab822b0ea3f6e92dcc7929b8c559900b54062804f232` |
| SHEET paper viewport raster | PASS — 2,512 red pixels, FNV mask `2058749244`, PNG SHA-256 `042215ee2da430e27c77cf528c5a507df58ae56f0d0f2ed3574864421d9d3733` |
| `npx tsc --noEmit -p tsconfig.next.json --incremental false` | PASS |
| `npx tsx tests/cad-v2/complex-linetype.test.ts` | PASS |

The first Playwright run timed out because the harness selected layout ID `SHEET`, while the product picker uses the visible layout name, and the fake view session's real heartbeat returned 410 and triggered re-prepare. The harness now selects `R07 affine curved SHX` and returns a successful heartbeat. The rerun passed; no product behavior, threshold or profile was relaxed. The runner emitted no successful PNG artifact; the full image hashes above are the retained raster evidence.

**Scope status.** R07-F local affine geometry, bounded chunk survival, viewport projection and Chromium raster profile are complete. This is not real SHX/DWG or AutoCAD parity. R07-E still lacks a positive complex DWG dash STYLE reference and distributable SHX; R07-H/R10 same-source AutoCAD comparison remains NOT_RUN. R07-G scale semantics is next. F07 terminal gates remain 0/7; overall 14/19 remains historical. Compiler/cache v44, pipeline p08, schema 1, ABI `three172-cad2d-v2`; branch `codex/srdr-dwg-motor-v2-fidelity`, HEAD `4b51ebe6b1470c6a247e03158dfe4b5359621c97`, dirty.

| Artifact | SHA-256 |
|---|---|
| `src/lib/cad-v2/compile/scene-compiler.ts` | `DB03362FF75EF0081B5C84FD5B0E580779E004CC521F0140998A7AECDEBFAF21` |
| `src/lib/cad-v2/version.ts` | `4A2DAE8F1A1C803178B4080E7E75ECD1B160BF1CD859B7E05749589B14303E5D` |
| `tests/cad-v2/complex-linetype.test.ts` | `C80C26F08CADE1D27B051505AE24775E8E959E9BF961132F26E4A354AA567B2C` |
| `tests/cad-v2/r07-affine-glyph-raster-scenes.ts` | `15B5A4F6F81391226D9CF594F9D6DB7182F8FE6E3125064ACE26EB0C1EBC1E37` |
| `tests/document-studio/cad-v2-affine-glyph-raster.spec.ts` | `CAD2B7B6CE6EFFF80104B8BF63485F69F00CD4D0BF0423481426BD0E1CAC8B1E` |

No commit, push, PR, merge, deploy or staging was done.

## 2026-09-27 — R07-G global and viewport linetype scaling, v45

**Run identity.** Active worktree `C:\Users\hsyn\.codex\worktrees\91a0\muhendis-mimar-portali`, branch `codex/srdr-dwg-motor-v2-fidelity`, HEAD `4b51ebe6b1470c6a247e03158dfe4b5359621c97`, dirty with pre-existing user/session modifications retained. Group ran 08:57:32–09:11:54 UTC. Compiler/cache `cad-v2-compiler-2026.09-v45`; pipeline `fidelity-v3-p08`; schema1; ABI `three172-cad2d-v2`.

**Evidence and results.** `npx tsx tests/cad-v2/linetype-scale-settings.test.ts` PASS for ASCII/binary DXF HEADER, entity group48, direct and nested geometry, PSLTSCALE 0/1. Global=2 and entity=3 yielded 60-unit direct dash; CELTSCALE=4 did not multiply existing geometry. Nested output at global1/2 was 20/10 XY vertices. A 1:10 viewport generated two 10-paper-unit dashes with PSLTSCALE=1 and fifteen 1-paper-unit dashes with PSLTSCALE=0. `linetype-phase.test.ts` 12/12 PASS; `complex-linetype.test.ts` PASS; `layout-viewport-render.test.ts` and `layout-viewport.test.ts` PASS; `cache-identity.test.ts` PASS; `npx tsc --noEmit -p tsconfig.next.json --incremental false --pretty false` PASS.

The whole-repo `npx tsc --noEmit --incremental false --pretty false` exited 1 with errors in unrelated old scripts/tests (missing `cad-review` modules/exports, stale unrelated test contracts and Worker `postMessage` overloads). The scoped `tsconfig.next.json` typecheck passed and its output had no compiler errors. `git diff --check` for changed tracked CAD source/tests exited 0. First scale oracle attempts exposed (a) group48 injected after the DXF `AcDbLine` subclass marker, so the parser correctly kept CELTSCALE=4; the fixture was corrected to standard common-entity ordering, and (b) old paper glyph expectation ignored PSLTSCALE. The independent oracle now computes glyph source spacing using `globalScale / viewportScale`; no acceptance tolerance was changed.

**Autodesk primary sources:** [effective entity scale and CELTSCALE default](https://help.autodesk.com/cloudhelp/2022/ENU/OARX-DevGuide/files/GUID-FF5299A3-CE1C-4A4F-8FB6-B835015773A6.htm); [LTSCALE](https://help.autodesk.com/view/ACD/2026/ENU/?caas=caas%2Fdocumentation%2FCIV3D%2F2014%2FENU%2FfilesACD%2FGUID-88787AE5-957B-483C-9EEF-51564114181F-htm.html); [CELTSCALE](https://help.autodesk.com/cloudhelp/2026/ENU/AutoCAD-Core/files/GUID-ECE175AB-AB7B-4DEC-9CEC-D5D67AF9310B.htm); [PSLTSCALE](https://help.autodesk.com/cloudhelp/2016/ENU/AutoCAD-Core/files/GUID-23EA4D64-AE7D-41E5-A8D0-20F060313D62.htm); [MSLTSCALE](https://help.autodesk.com/cloudhelp/2022/ENU/AutoCAD-LT/files/GUID-023B046C-56EA-463C-A867-DF713666A69E.htm).

**SHA-256 at group close (whole dirty files; HEAD does not represent this state):**

| File | SHA-256 |
|---|---|
| `src/lib/cad-v2/version.ts` | `6b885ba918cabec3a2418a4b96bd61706667584281df47559190dc9b89954a4d` |
| `src/lib/cad-v2/canonical/types.ts` | `606db2e13e4d58bae4a2b3d76580763e052b1e5bd2ae1c475978e153bdc2d627` |
| `src/lib/cad-v2/render/cad-stroke.ts` | `8a08ce5cebd5e3605040d459d05029e1e411dd33df3e32688b2cf37123fc7ca2` |
| `src/lib/cad-v2/compile/entity-visitor.ts` | `183cdc6f0123b5687929ffd4d0ce2fd467c56e51d37c9e3ed4e459d5d7a8a5e5` |
| `src/lib/cad-v2/compile/block-transformer.ts` | `87e0cfc2309f65df49937b153d1d58eba41df258f057d9a6ef7e6e8910349c48` |
| `src/lib/cad-v2/compile/scene-compiler.ts` | `ac16df0034f4a186e2b226c5d5637b55b1cefd1f164aaf1582663d1fafcef580` |
| `src/lib/cad-v2/decode/dxf-linetype-scale-header.ts` | `fc9bbd7efe5a1b7a241052af1b14446a758db9cd312d3694080b0d6b8fc289b5` |
| `src/lib/cad-v2/decode/dxf-adapter.ts` | `f86ee522d1e389924245ef719ef220b579b26bcaa4f5dcae56232978a1b27549` |
| `src/lib/cad-v2/decode/dwg-adapter.ts` | `21562844d7bff10f4cb3622dd4923c72245310fd8eeacc1f8820971861f14d51` |
| `tests/cad-v2/linetype-phase.test.ts` | `6590090a639a651462c92bedb05596b0b26e6c1b3451f4425f7b6be561b52df1` |
| `tests/cad-v2/complex-linetype.test.ts` | `c34e4dc9bc9e26151cd5e90f32f84fe894100311cbc3c95ebb45959ca61189ee` |
| `tests/cad-v2/linetype-scale-settings.test.ts` | `efd74a2c2896c629bd03bf8e21086fceb027b475efb732b671fc849def7142a7` |

**Open boundary.** MSLTSCALE is retained as a mode but not yet applied to model-tab geometry because selected annotation scale is not in current host-to-compiler request. No inference from camera zoom was used. R07-G remains partial; positive complex DWG/real SHX and AutoCAD same-source comparison remain separate, and F07 terminal gates remain 0/7. This was one local R07-G scale group; estimate R07 3–9→2–8 and known F07 14–31→13–30. Overall 14/19 remains historical.

## 2026-09-27 — R07-G current annotation scale / MSLTSCALE (compiler/cache v46)

**Run identity.** Active worktree 91a0; branch codex/srdr-dwg-motor-v2-fidelity; HEAD 4b51ebe6b1470c6a247e03158dfe4b5359621c97; working tree remains dirty and prior edits were preserved. Pipeline fidelity-v3-p08, schema 1, ABI three172-cad2d-v2. The resumed subgroup start was not separately clocked. Captured checkpoints: 09:21:55–09:29:47 UTC (7m52); this is only the captured interval, not a claim for the full subgroup duration. Estimate change is based on closing one defined local profile, not this incomplete timing window.

**Behavior and evidence.** Autodesk MSLTSCALE enables annotation-scale scaling of Model-tab linetypes. The scale object's factor is paper units / drawing units. DXF parsing follows the CANNOSCALE dictionary variable handle to its DICTIONARYVAR string and the unique matching SCALE record. A real AutoCAD DXF fixture resolved 1:1 → 1.0; a synthetic ASCII and binary OBJECTS chain resolved 1:50 → 0.02. Compiler tests verify direct pattern [10,-10] × entity group48 3 × global LTSCALE 2 × annotation 0.02 gives dash 1.2; nested INSERT with factor 0.5 gives 40 XY vertices. Model scale does not leak into paper layouts. MSLTSCALE=true with absent scale factor emits MODEL_ANNOTATION_SCALE_UNRESOLVED and degraded quality. No camera zoom estimate is used.

The installed @mlightcad/libredwg-web schema's HEADER_VARIABLES omits CANNOSCALEVALUE/MSLTSCALE, and its DwgDatabase exposes DICTIONARY but not DICTIONARYVAR/SCALE object records. The DWG current factor is consequently left absent; when MSLTSCALE is known true but its factor cannot be recovered, compile quality is degraded. This dependency limitation leaves DWG scale fidelity open, not accepted.

**Verification performed in this subgroup.**
- PASS: npx tsx tests/cad-v2/linetype-scale-settings.test.ts
- PASS: npx tsx tests/cad-v2/linetype-phase.test.ts (12/12)
- PASS: npx tsx tests/cad-v2/complex-linetype.test.ts
- PASS: npx tsx tests/cad-v2/layout-viewport-render.test.ts
- PASS: npx tsx tests/cad-v2/layout-viewport.test.ts
- PASS: npx tsx tests/cad-v2/cache-identity.test.ts
- PASS: npx tsc --noEmit -p tsconfig.next.json --incremental false --pretty false
- PASS: git diff --check scoped to changed CAD source/tests.
- Whole-repository TypeScript was not run this subgroup; the v45 subgroup's unrelated script/test diagnostics remain historical and are not re-labelled as a current run.

An early assertion incorrectly expected annotation metadata in the synthetic R07 DXF that has no CANNOSCALE scale-list objects. The test was corrected to use the existing AutoCAD 1:1 fixture for adapter propagation and an explicit 1:50 OBJECTS chain for parser ASCII/binary; no product acceptance threshold was relaxed.

**Autodesk primary sources:** [MSLTSCALE system variable](https://help.autodesk.com/cloudhelp/2022/ENU/AutoCAD-LT/files/GUID-023B046C-56EA-463C-A867-DF713666A69E.htm); [CANNOSCALE](https://help.autodesk.com/cloudhelp/2024/ENU/AutoCAD-MAC-Core/files/GUID-C7111BEE-76AA-481D-AC51-8600A31FA23A.htm); [AcDbAnnotationScale getScale](https://help.autodesk.com/cloudhelp/2027/ENU/OARX-RefGuide/files/OARX-RefGuide-AcDbAnnotationScale__getScale_double__const.html).

**SHA-256 at verification close (whole dirty files, before this documentation append):**

| File | SHA-256 |
|---|---|
| src/lib/cad-v2/canonical/types.ts | 0A2E2640AD01C156A1FD903BD4E4CA053F804C6D9418B30A9F60F12A7C00C10E |
| src/lib/cad-v2/canonical/diagnostics.ts | 8564569747FE9A7DBE9D42551486EF9802AAB426F62C073F69746E0600744FDF |
| src/lib/cad-v2/compile/scene-compiler.ts | 668D0032858723C63ED919F62169DB86CF8D531C33F7CF78762B2B5B12970E19 |
| src/lib/cad-v2/decode/dxf-adapter.ts | 1EAF351733DB83653629C56B22CE633997510E4074238737E9B9EC9C742E6E8B |
| src/lib/cad-v2/decode/dxf-linetype-scale-header.ts | A0E90FD68EDDABEE9CB98C40C4A8C14483ED7D9E233A5CA8F86DCA9F602D7CEB |
| src/lib/cad-v2/version.ts | 5FB7E7B384913B321A5256AE7EEADEC441A8E1CE007BFFCF2D178A05C96BBDA2 |
| tests/cad-v2/linetype-scale-settings.test.ts | 3DC7473637FA41FD551E932C114279CDC790F7E1B1A43692DA5FAB52DEE03E0D |

**Status.** R07-G is partial, G5 remains partial, F07 terminal gates remain 0/7 and overall 14/19 remains historical. Estimates reduced by one defined local profile: R07 2–8 → 1–7; known F07 13–30 → 12–29. Real complex DWG/SHX, broader scale matrix, DWG factor schema support and R10 same-source AutoCAD evidence remain open. No commit, push, PR, merge, staging or deploy was performed.


## 2026-09-27 — R07-G active annotation scale ratio and view budget profile

The updated linetype-scale test exercises the finite CANNOSCALE ratio matrix and the fail-closed boundary. ASCII/binary DXF profiles 1:1, 1:2, 1:50 and 2:1 resolve to factors 1, 0.5, 0.02 and 2; each includes a differently named inactive SCALE record. The actual parsed factor reaches the compiler. With pattern [10,-10], group-48 entity scale 3 and LTSCALE 2, dash and gap sizes are 60, 30, 1.2 and 120. Zero paper units and duplicate matching names do not resolve; the MSLTSCALE scene remains degraded. Varying unitsPerCssPixel 0.01→1 changes continuous ARC tessellation without changing direct dash metadata. This does not claim constant screen-pixel length under zoom.

| Evidence | Value |
|---|---|
| Runtime test | PASS — npx tsx tests/cad-v2/linetype-scale-settings.test.ts |
| Strict targeted test TSC | PASS — updated test + src/types/opentype.d.ts |
| Initial targeted TSC attempt | TS7016 because the command omitted the existing opentype declaration; rerun with the declaration PASS, no source change |
| Whole/scoped runtime TSC | NOT_RUN in this test-only continuation |
| Compiler/cache and schema | v46 / schema 1 / pipeline fidelity-v3-p08 / ABI three172-cad2d-v2 |
| Current test SHA-256 | tests/cad-v2/linetype-scale-settings.test.ts — 2F1B822A755090BD6025869C45C60151A1C3EDD6B8D6B0C7FE6836956E1E8407 |

No compiler source changed. F07 terminal gates remain 0/7; overall 14/19 is historical. LibreDWG active DWG-scale fields, positive complex DWG/actual SHX, and the shared R10 AutoCAD oracle remain open.

## 2026-09-27 — R08 emulated-DPR3 156% ELLIPSE trace

| Requirement / profile | Source and test | Current result | Boundary |
|---|---|---|---|
| Live camera → worker refinement → renderer at high zoom and DPR3 profile | tests/document-studio/cad-v2-layout-viewport.spec.ts, test "runtime-refined ELLIPSE raster stays bounded through 156% zoom when emulated DPR3 is capped to a DPR2 drawing buffer"; source SHA-256 03C45E4A2FDDC79F6C006097F5C43112B55CFC65AD31034BD20446C8F6D613EB | Targeted Chromium run passed 1/1 in 55.5 s. Fit/pan and 125%/156% zoom requests settled; final target 0.25 CSS px, 6/6 replies. | Browser DPR3 is emulated. WebGL buffer is capped at 2×; it is not a physical DPR3 GPU/device result. |
| Independent ELLIPSE raster error | Analytic quarter-ellipse oracle, 4097 source samples; 3404 selected rendered pixels at 156% | render→source=0.6774800229 CSS px, source→render=0.3755782579 CSS px, under 1.25 CSS px. Fit/pan in the same run measured 0.7085877543/0.2589010743 CSS px. | One local G6 cell only. Other geometry/zoom/profile combinations, R09 hardware and R10 AutoCAD same-source oracle remain open. |

## R08 emulated-DPR3 rational SPLINE 156% trace — 2026-09-27

| Requirement / profile | Source and test | Current result | Boundary |
|---|---|---|---|
| Host → worker refinement → renderer at DPR3-emulated 80/100/125/156% | `tests/document-studio/cad-v2-layout-viewport.spec.ts`, test `runtime-refined rational SPLINE stays bounded at DPR3 buffer cap after 80% and 156% zoom-pan`; source SHA-256 `A5F7CA4A3A02E1403ED93A79D4E96E032BA02EEAB18BC8064D176EB473D41195` | Targeted command `npx playwright test tests/document-studio/cad-v2-layout-viewport.spec.ts --project=chromium --grep "80% and 156% zoom-pan" --reporter=line --workers=1 --timeout=90000` passed 1/1 in 1.0 minute. Zoom refinements settled; after 156% pan the worker state stayed at 10/10 replies and .25 CSS px target. | DPR3 is emulated; drawing buffer is capped at 2×. 100% and 125% have refinement evidence but no independent raster measurement. |
| Independent rational SPLINE raster at 80% after pan | 4097 analytic rational Bernstein samples; 3273 selected raster pixels; source bounds [464.624,223.992]..[795.376,418.552] CSS px | render→source=0.6668573448; source→render=0.2322079741 CSS px | Both ≤1.25 CSS px; emulated DPR3 only. |
| Independent rational SPLINE raster at 156% after pan | 4097 analytic rational Bernstein samples; 6390 selected raster pixels; camera (644.46875,338.234375,k=9.5); source bounds [321.46875,129.234375]..[967.46875,509.234375] CSS px | render→source=0.6433524477; source→render=0.4022573566 CSS px; final target .25 CSS px; max 110 vertices | Both ≤1.25 CSS px; physical DPR3 R09 and same-source AutoCAD R10 remain open. |

## R08 emulated-DPR3 ARC fit-pan and 195% raster trace — 2026-09-27

| Requirement / profile | Source and test | Current result | Boundary |
|---|---|---|---|
| Live host → worker refinement → WebGL at fit/100/125/156/195% with pan | `tests/document-studio/cad-v2-layout-viewport.spec.ts`, test `runtime-refined ARC raster stays bounded through 195% zoom and pan under emulated DPR3`; source SHA-256 `568D5DC50E40E89140E6EDB025BCA7CDB2AD6275EAB62BC2DFDF54BD27C9D28E` | Command `npx playwright test tests/document-studio/cad-v2-layout-viewport.spec.ts --project=chromium --grep "195% zoom and pan under emulated DPR3" --reporter=line --workers=1 --timeout=90000`; PASS 1/1 in 48.8 s. At 195%, 8/8 replies, .25 CSS-px target, max 46 vertices. | Chromium DPR3 is emulated; renderer buffer stays capped at 2×; not physical R09 evidence. |
| Independent ARC raster, fit after pan | 4097 quarter-circle samples; 2737 selected blue pixels; camera (688,360,k=6.08); 1280×672 CSS viewport, 2560×1344 buffer, 3840×2016 image | render→source=0.7535568878; source→render=0.2524335670 CSS px | Both ≤1.25 CSS px; synthetic source and browser-emulated DPR only. |
| Independent ARC raster, 195% after pan | 4097 source samples; 3514 pixels; camera (781.75,406.875,k=11.875); total pan (141.75,70.875); visible angle [0,1.0286029931] rad | Clipping-aware render→source=0.7321633267; source→render=0.2658020055 CSS px | Both ≤1.25 CSS px. Hidden source arc is excluded by the clipping-aware oracle; native AutoCAD comparison remains R10. |

## R08 emulated-DPR3 rational SPLINE 195% pan trace — 2026-09-27

| Requirement / profile | Source and test | Current result | Boundary |
|---|---|---|---|
| Host → worker refinement → WebGL at DPR3-emulated fit/80/100/125/156/195% | `tests/document-studio/cad-v2-layout-viewport.spec.ts`, test `runtime-refined rational SPLINE stays bounded at DPR3 buffer cap after 80% and 195% zoom-pan`; source SHA-256 `8AB8F0514FF26D17EC16C88A1A3A57D161782E602057529237E4BA0586C2C05B` | Command `npx playwright test tests/document-studio/cad-v2-layout-viewport.spec.ts --project=chromium --grep "80% and 195% zoom-pan" --reporter=line --workers=1 --timeout=90000`; PASS 1/1 in 1.2 min. At 195%, 12/12 replies, .25 CSS-px target, max 114 vertices. | DPR3 is emulated; internal drawing buffer is capped at 2×. 100/125% are refinement-only, not measured raster cells. |
| Independent rational SPLINE raster at 195% after pan | 4097 analytic rational Bernstein samples; 7993 rendered pixels; camera (669.5859375,350.79296875,k=11.875); source bounds [265.8359375,89.54296875]..[1073.3359375,564.54296875] CSS px | render→source=0.6696125902; source→render=0.2561999628 CSS px; final pan (+24,+12) schedules no extra refinement | Both ≤1.25 CSS px; all source bounds remain in viewport. Physical R09 device and same-source AutoCAD R10 remain open. |

## R08 emulated-DPR3 ELLIPSE 195% pan trace — 2026-09-27

| Requirement / profile | Source and test | Current result | Boundary |
|---|---|---|---|
| Live host → worker refinement → WebGL at DPR3-emulated fit/125/156/195% | `tests/document-studio/cad-v2-layout-viewport.spec.ts`, test `runtime-refined ELLIPSE raster stays bounded through 195% zoom and pan when emulated DPR3 is capped to a DPR2 drawing buffer`; source SHA-256 `40C31D08A78F6FBE0DD747D3A8167D89749AB3E1C295DF66293D38FED45C10B` | Command `npx playwright test tests/document-studio/cad-v2-layout-viewport.spec.ts --project=chromium --grep "195% zoom and pan when emulated DPR3" --reporter=line --workers=1 --timeout=90000`; PASS 1/1 in 57.2 s. 195% state: .25 CSS-px target, 8/8 replies, max 46 vertices. | DPR3 is emulated; WebGL internal buffer remains capped at 2×. Two earlier attempts exposed test sequence ordering and were corrected before final PASS. |
| Independent ELLIPSE raster at 195% after pan | 4097 analytic quarter-ellipse samples; 4289 rendered pixels; camera (644.46875,338.234375,k=11.875); visible angle interval [0,1.5707963267948966] | render→source=0.7001692267; source→render=0.4022573566 CSS px; pan (+24,+12) adds no refinement request | Both ≤1.25 CSS px and full quarter arc visible in the screenshot. This is not physical R09 or AutoCAD R10 evidence. |

## R08 emulated-DPR3 125% curve raster trio trace — 2026-09-27

| Requirement / profile | Source and test | Current result | Boundary |
|---|---|---|---|
| Live host→worker→WebGL, DPR3-emulated 125% ARC pan raster | `tests/document-studio/cad-v2-layout-viewport.spec.ts`, test `runtime-refined ARC raster stays bounded through 195% zoom and pan under emulated DPR3`; whole-file SHA-256 `B4744DA1C0E4C2223E03EC1DE0290281041A43B89A9031DE8B93F38E074D59E3` | Actual pan; camera (724,378,k=7.6), fit-relative offset (84,42), adaptive oracle 957 positions, 3402 pixels; render→source=0.7130987918, source→render=0.2712624842 CSS px. Combined targeted suite 3/3 PASS in 2.9 min. | Full quarter source visible; 4/4 replies, .25 CSS-px final target, max 40 line vertices; emulated DPR3 / 2× buffer cap. |
| Live host→worker→WebGL, DPR3-emulated 125% ELLIPSE pan raster | Same spec/test file; SHA as above | Actual pan; camera (651.5,341.75,k=7.6), offset (11.5,5.75), 4097 analytic samples, 2746 pixels; render→source=0.6766723248, source→render=0.2552488787 CSS px. | Full [0,π/2] source quarter visible; 4/4 replies, max 40 line vertices; pan adds no refinement. |
| Live host→worker→WebGL, DPR3-emulated 125% rational SPLINE pan raster | Same spec/test file; SHA as above | Actual pan; camera (648.375,340.1875,k=7.6), offset (8.375,4.1875), 4097 Bernstein samples, 5147 pixels, source bounds [389.975,172.9875]..[906.775,476.9875]; render→source=0.5827244287, source→render=0.2459745357 CSS px. | Full source bounds visible; 8/8 replies, max 110 line vertices; pan adds no refinement. |

Exact command: `npx playwright test tests/document-studio/cad-v2-layout-viewport.spec.ts --project=chromium --grep "(runtime-refined ELLIPSE raster stays bounded through 195% zoom and pan when emulated DPR3 is capped to a DPR2 drawing buffer|runtime-refined ARC raster stays bounded through 195% zoom and pan under emulated DPR3|runtime-refined rational SPLINE stays bounded at DPR3 buffer cap after 80% and 195% zoom-pan)" --reporter=line --workers=1 --timeout=90000`. All directed errors satisfy the unchanged ≤1.25 CSS-pixel envelope. DPR3 is emulated, not R09 physical hardware; 2× renderer buffer remains. The measurement does not establish the full G6 Cartesian matrix or R10 AutoCAD result.

## F07 G6/R08 formal solver and selected raster coverage — 2026-09-27

### Current solver acceptance

| Requirement | Current test/evidence | Result | Boundary |
|---|---|---|---|
| Four zoom profiles × DPR1/2/3 | tests/cad-v2/precision-refinement.test.ts; zoom [1,8,64,512], world tolerance 0.25/(zoom×DPR) | PASS 12/12; maximum device-scaled sagitta ≤0.250001 px | Solver unit test only; production camera wiring is not inferred |
| Test identity | Whole-test SHA-256 DE31C8AC07C6DE33C7E6C0E6E382DDE95FDF88051643E132D579C94E6DB9127D | Command npx tsx tests/cad-v2/precision-refinement.test.ts; PASS in 1.3 s | Re-run in this audit |
| Selected browser integration inventory | tests/document-studio/cad-v2-layout-viewport.spec.ts existing profiles | Raster and refinement-only zooms separated below | The browser suite was not rerun in this audit; prior DPR3 125% trio 3/3 is prior-group evidence |

### Nine-row family × DPR crosswalk

| Family | DPR | Measured raster zooms | Settled refinement-only zooms |
|---|---:|---|---|
| ARC | 1 | fit, 80%, 125%, 156%, 195% | 100% |
| ELLIPSE | 1 | fit, 80%, 156%, 195% | 100%, 125% |
| Rational SPLINE | 1 | fit, 80%, 195% | 100%, 125%, 156% |
| ARC | 2 | fit, 156%, 195% | 125% |
| ELLIPSE | 2 | fit, 80%, 125%, 156%, 195% | 100% |
| Rational SPLINE | 2 | fit, 80%, 125%, 156%, 195% | 100% |
| ARC | 3 emulated | fit, 125%, 195% | 100%, 156% |
| ELLIPSE | 3 emulated | fit, 125%, 156%, 195% | — |
| Rational SPLINE | 3 emulated | 80%, 125%, 156%, 195% | 100% |

The formal minimum requires four solver zoom levels and DPR1/2/3 profiles, not a raster at every family×zoom×DPR intersection. Unlisted combinations are not claimed PASS or FAIL; no finite additional mandatory R08 raster gap was identified. DPR3 browser evidence remains emulated with a 2× WebGL buffer cap. R08/G6 remains partial for physical R09 and same-source AutoCAD R10; F07 terminal gates remain 0/7, and overall 14/19 is historical. No runtime/test source change; TSC was not rerun.

## 2026-09-27 — Nested non-LINE and viewport-projected stroke spatial eligibility (F07 G3/R04, v47)

| Profile | Input and oracle | Result | Boundary |
|---|---|---|---|
| Nested affine non-glyph curves | Two INSERT transform levels; CIRCLE, ARC, ELLIPSE, SPLINE and bulged LWPOLYLINE; high origin and later overlay | 25 painter-ordered chunks; maximum chunk bbox span 4093.360040664673; family/source provenance sidecars and local Float32 extents verified | Synthetic compiler/partition acceptance; not native DWG/AutoCAD |
| Paper viewport projected stroke | CIRCLE clipped and projected into a 5000×5000 paper viewport | 4 paper-space chunks; maximum bbox span 844.033254477853; painter order retained | One viewport curve family; not physical device raster or host on-demand fetch |

The compiler now classifies emitted non-LINE stroke ranges after paper-viewport projection using the same 4096-world-unit span rule and 256-chunk cap as root-space strokes. The viewport oracle failed before this fix and passed afterward. Current-revision commands passed: npx tsx tests/cad-v2/non-line-stroke-spatial-partition.test.ts, npx tsx tests/cad-v2/cache-identity.test.ts, and npx tsc --noEmit --project tsconfig.next.json. Affine OCS, bounds/provenance, block-expansion-budget and entity-instance-parity evidence producers passed and refreshed their JSON files. npm run check:cad-v2:unit passed before the v47 identity bump and before the five-family nested expansion, so it is not a full-suite v47 result.

Compiler/cache v46→v47; pipeline p08, schema 1 and render ABI v2 unchanged. Compiler SHA-256 AB1A0435B2BBF560D5EF3282012BA917988F31A73A245F0FD765C1274EC948B5; version SHA-256 9D2BE9C5C87343F7EC22012C637F04133189209C63C8935A391E8B34460B10D1; test SHA-256 CEBCEB0326CEA0312184AF06D5030D289817F4FE816FE4285BB8213995B49F44. The bounds run logged LibreDWG input error 68 while its selected provenance assertions passed. R04's selected work group is complete, but G3 remains partial pending host on-demand fetch, remaining global bounds/cap profiles and R05 fill/glyph. R09 physical device and R10 same-source AutoCAD are separate external oracles; F07 remains 0/7 terminal gates and overall 14/19 is historical.
## 2026-09-27 — F07 G3/R05 nested/viewport glyph ve visible fetch kanıtı

| Madde | Kaynak / oracle | Sonuç ve sınır |
|---|---|---|
| R05 glyph kimliği | entity-visitor.ts → scene-compiler.ts; fill-glyph-paper-spatial.test.ts | İki INSERT seviyesi ve paper viewport üzerinden isGlyphStroke taşındı; örtüşen direct fill ile manifest maxFillGlyphCompositeErrorWorld > 0, uzun nested glyph Model/SHEET bounded chunk PASS. Nested fill mesh kapsamı değil. |
| R05 host fetch | cad-v2-host-shell.tsx loadVisibleChunksRef: prepare başlangıç kamerası, handleCameraChange debounce, handleSelectLayout; cad-v2-layout-viewport.spec.ts | Chromium 2/2 PASS: görünür viewport ve aktif pafta fill/glyph fetch. Genel network/performance ve F08 eviction kabulü değil. |
| R05 açık fill yolu | entity-visitor.ts VisitorResult yalnız segments; HATCH boundary ve WIPEOUT bounds, viewport segment projeksiyonu | Nested HATCH/WIPEOUT fill mesh, width fill ve viewport mesh clipping/projeksiyon OPEN. Painter order/clip/topoloji korunarak ayrı çalışma grubu gerekiyor. |

v48 doğrulama: npm run check:cad-v2:unit PASS (tam zincir); npx tsc --noEmit --project tsconfig.next.json PASS; chunk-composite, R04 spatial, cache identity hedefli PASS; Playwright seçili 2/2 PASS. R001 test logunda LibreDWG error 68, temiz decode iddiası yok. SHA-256: entity-visitor 851665849E3D5E463814DEAE9E381BC2E2D4C47AAB1B4EDB2431C1CB3CBB1BB0; scene-compiler 0209829BE9C77ED59B91A10E94D4F69CC4C94B0420F19B0F7E2E3A64A582DCFF; version AEEEE5C4920173B43E6B7D72B4D4DFA4FBC37393F7A4E3ABAF83F9D1FE0BEB51; test 92128B957386E5FE92D8150DDFB3ECF9597BE4BED6E957A7FBF61570BCFAB25B. p08/schema 1/ABI v2 aynı. R05 yerel kalan 2–5 grup, F07 3–20 düşük güven; F07 terminal 0/7, genel 14/19 tarihsel.

## F07 G3-G4/R05 nested fill mesh ve viewport clip — v49 / 2026-09-27

| Kabul profili | Kaynak ve bağımsız oracle | Sonuç | Sınır |
|---|---|---|---|
| Nested HATCH+WIPEOUT affine mesh | `tests/cad-v2/fill-glyph-paper-spatial.test.ts`; two-level INSERT transforms with area oracle | Total triangle area 24000; HATCH fill precedes an interleaved line and WIPEOUT remains later in draw-command order | Synthetic polygonal fixtures; no AutoCAD same-source image |
| Nested normal XCLIP | Same test; WCS convex boundary clips HATCH and WIPEOUT | Combined clipped area 5500; no unsupported diagnostic | Only valid convex normal XCLIP is handled for fills |
| Nested inverted/concave XCLIP | Same test | No fill triangles; `UNSUPPORTED_FILL_CLIP`; quality `degraded` | Intentional explicit unsupported boundary, not a PASS for inverted/concave rendering |
| Paper viewport fill projection | Same test; 100×100 nested HATCH projected at 0.5 scale | Rectangle clip area 2500; convex triangular viewport clip area 1250 | Selected synthetic viewport, no raster or native acceptance |
| Active-paper on-demand fetch | `cad-v2-host-shell.tsx:loadVisibleChunks`; `cad-v2-layout-viewport.spec.ts` active-paper visible fill/glyph test | Targeted Chromium Playwright 1/1; selected active layout asks for visible chunk and leaves hidden layout chunk unrequested | General host/performance and F08 eviction lifecycle are outside this test |

Visitor/scene compiler now carries ordered fill draw items with segment draw items through nested INSERT, dimension visitor and paper viewport paths. `dimension-compiler.ts` routes segment additions through the shared visitor-order helper. `fill-mesh.ts` validates convex clips and clips each triangle before fan triangulation. Inverted/non-convex clips fail closed with `UNSUPPORTED_FILL_CLIP` quality degradation. Nested LWPOLYLINE width meshes, global bounds/cap profiles, nested fill-glyph overlap envelope and runtime/raster composite remain open.

Compiler/cache `cad-v2-compiler-2026.09-v49`; pipeline `fidelity-v3-p08`; schema 1; ABI `three172-cad2d-v2`. Validation: targeted fill-glyph fixture PASS; accounting, expansion budget, cache identity, composite precision, layout viewport, painter order and viewport renderer tests PASS; runtime TypeScript PASS; complete `npm run check:cad-v2:unit` PASS on retry; active-paper Chromium fetch PASS 1/1. First full-unit run stopped on the previous assertion that assumed nested HATCH boundary XY lived in manifest chunk 0. Fill meshes now precede their boundary strokes in source painter order, so the assertion was updated to select a line-bearing chunk; the specific test and complete unit suite then passed. LibreDWG error 68 appeared in R001 test logs and is not clean decode evidence.

SHA-256 — `entity-visitor.ts` 3D3FD65DF23D158549898247C16F2C2A15813739B55192C088D55AF165978CB3; `scene-compiler.ts` FB56B1BA443D51851B82919031307A6F6B1A4B04F241CF7D25A9A87D2F0FC5F2; `fill-mesh.ts` F13D4F63AFB8ABEEBF5C07D98B020717B56AEB1EFB1F7A25E3E991C3318909C8; `dimension-compiler.ts` D40551E4418457886A115EBF76CAC6230706B36D41F89F1BD5E68C883B135E58; `version.ts` 5D58B99FD90B58C482C6C54A863F74DEBCF4D924EF771CCE867DDCF87D78FFE9; `fill-glyph-paper-spatial.test.ts` 2448D31753F9AA75BEE94F2BA96722901158E1D9DCF410887652F6F1A43B5A29; adjusted `chunk-error-accounting.test.ts` C103D1FE44EB55CCCFF4BA8F79A47066E0EE6A574BB4FF12817C7ED47CA57834.

R05 remaining estimate is 1–4 local groups and F07 known-local estimate is 2–19 groups, low confidence; one nested/viewport fill group is closed while width-fill, global cap and R06 interactions remain. F07 terminal 0/7 and overall 14/19 remain historical. F05/F08/production R01/V01 have no estimate; physical R09 and native AutoCAD R10 remain external dependencies. No commit, push, PR or deployment.

## F07 G3-G4/R05 nested width-fill, fill cap and binary size evidence (v50)

| Kabul profili | Kaynak / oracle | Sonuç | Sınır |
|---|---|---|---|
| Nested LWPOLYLINE width mesh | `entity-visitor.ts`, `scene-compiler.ts`, `fill-glyph-paper-spatial.test.ts`; two affine levels incl. mirrored/nonuniform transform | Nested triangle area 240; painter order retained | Synthetic compiler geometry oracle; no native raster |
| Paper viewport width-fill | Same test; model→paper projection with clip | Clipped triangle area 500 | Selected synthetic viewport profile |
| Fill/glyph composite | Same test; nested width fill overlaps nested glyph in Model and SHEET | Both manifests report `maxFillGlyphCompositeErrorWorld > 0` | Accounting envelope exercised; no runtime/raster error bound claim |
| Spatial fill cap | Same test; 256 fill-group cap | Quality degraded with `FILL_SPATIAL_PARTITION_LIMIT_REACHED`; count-window fallback retains source triangle geometry | Explicit degraded bound, not proof every arbitrary pathological fill is spatially bounded |
| Large mesh and encoded chunk size | `scene-compiler.ts`; `r001-root-fix.test.ts` | Mesh windows <=16,384 triangles; encoded chunks <=2 MiB after header/table/alignment-aware pre-estimate and order-preserving recursive split | A single indivisible primitive above cap throws; no silent oversized chunk |
| R001 P08 artifact | `tests/cad-v2/r001-root-fix.test.ts` | 286 chunks, max chunk <=2,097,152 bytes; manifest 484,094 bytes <=1 MiB | Test logs LibreDWG error 68; not clean decode evidence |

Compiler/cache cad-v2-compiler-2026.09-v50; pipeline p08, schema 1, ABI `three172-cad2d-v2`. Runtime hashes: entity-visitor `6669BEE2A031F611DC1815A2EDBC4DD885110A9EBA80EFAD9D6D933467E80A27`; scene-compiler `93B16D288C1DB5404F5DA9E79070E7B371A7B510DA4351DFA61C7E09FAB740EF`; version `BE56F3FC44F65FCD2F5981438E58B3D7C4B92964221E133FC77C3AAEAD381A3D`; fill test `9293F82DF5CDAE570A10A227C9194CCB3493BAD90D4650BE3F8EEAD07D8F814A`; R001 fixture `17a92cb544830845fc59717abcc22d3cdcf97c12b8450602c9c70ec4a507f086`.

Validation scope: full `npm run check:cad-v2:unit` passed on v50 runtime before the final test-only model/paper composite assertion was added; the updated targeted fixture then passed and `npx tsc --noEmit --project tsconfig.next.json` passed. Standalone R001 P08 passed after byte pre-estimation fix. `git diff --check` passed on the changed runtime/test files. The previous active-paper fetch Chromium evidence remains from v49; no new browser run was needed for this compiler-only change.

R05 width/cap/composite selected group is complete; broader global bounds and runtime/raster composite remain open. Inverted/concave fill clip remains fail-closed with degraded quality. F07 terminal gates remain 0/7 and 14/19 remains historical. R05 estimate 1–3 local groups, F07 known-local estimate 1–18, both low confidence. F05/F08/production R01/V01 unestimated; R09 physical device and R10 same-source AutoCAD are external. No remote writes.

## F07 G4/R06 non-adjacent fill/glyph composite accounting (v51)

| Acceptance profile | Source/oracle | Result | Boundary |
|---|---|---|---|
| High-origin non-adjacent pair | `chunk-composite-precision.test.ts`; width-fill, disjoint 24,000-unit intervening glyph and later overlapping glyph | Confirms overlapping fill/glyph chunks are separated by more than one painter chunk; both receive the cross-chunk sum | Compiler/binary metadata; not rendered-pixel distance |
| Screen target | Same fixture, target 0.25 CSS px | Each participant's max quantization fits; pair composite exceeds target and scene is degraded with `CHUNK_COMPOSITE_PRECISION_LIMIT_REACHED` | Selected synthetic view profile |
| Pair-analysis cap | 130 fills + 130 glyphs, `maxPrimitivesPerChunk: 1` | More than 16,384 candidates triggers layout-wide max-fill + max-glyph bound, `FILL_GLYPH_COMPOSITE_ANALYSIS_LIMIT_REACHED` and degraded quality | Conservative fallback may overstate unrelated participants; no silent omission |
| Existing interaction cells | Same test | Same-chunk, adjacent-chunk and non-adjacent cases pass | No host/worker/WebGL or AutoCAD raster run |

Compiler/cache v50→v51; pipeline p08, schema 1 and renderer ABI v2 unchanged. Validation at v51: `npx tsx tests/cad-v2/chunk-composite-precision.test.ts`, `npx tsx tests/cad-v2/cache-identity.test.ts`, `npx tsc --noEmit --project tsconfig.next.json`, and `npm run check:cad-v2:unit` all passed. The full unit chain logged LibreDWG error 68 on R001-containing decoder tests; their selected assertions passing does not establish a clean decode. Scoped `git diff --check` emitted no warnings for changed runtime files.

Source SHA-256 — scene-compiler `1FDBD42B0EDA0690DD5509C1ED326DF1FFCEC19524A804D66C0B86EF35400BC9`; diagnostics `CF24A6624BD9075E6942973076A7876FE6C33E0E75A51E8B48FD3C8691D904A9`; binary-protocol `81E429EA12B10338141B6AEB3412924564FE01DB5AC1245F8BA5CB9E9E36AF27`; version `2C1117F0699886152B8B642D0721DBD5FDA28728B099FB88751D44FDCDF45A59`; test `AD7A29DB4E59FD3BDEA4E1E40B1240A8DF0B2B27FA49ED5146FF0B540137FB27`.

R06 remaining estimate: 1–3 local continuation groups, low confidence; broader source-family/global-bound profiles and runtime/raster verification remain. F07 known-local estimate updates 1–18→1–17, low confidence, because one finite R06 static-composite group closed. R05 remains 1–3. F07 terminal gates stay 0/7; overall plan 14/19 is historical. F05/F08/production R01/V01 are not estimated; R09 physical device and R10 same-source AutoCAD are external dependencies.

## 2026-09-27 — F07 G1–G7 finite v3 crosswalk (dashboard v25)

| Gate | v3 scope status | Evidence/current missing owner |
|---|---|---|
| G1 periodic SPLINE/knot | PASS | Existing periodic test tightened from 0.5 to 0.25 CSS px; 43 worker spans, independent max 0.205928467 CSS px; `precision-refinement` zoom×DPR 12/12. |
| G2 HATCH runtime precision | PASS for F07 | Existing runtime boundary, Float64 mesh, cap and P07 topology tests pass. Island topology remains P07 scope, not a new F07 matrix. |
| G3 spatial/on-demand chunk | PASS | Direct, nested non-LINE, fill/glyph and active-paper visible fetch tests pass; visible fetch Chromium 1/1. More bounds variants are not v3 F07 requirements. |
| G4 fill/glyph composite | PASS local compiler bound | v51 same/adjacent/non-adjacent pair sum, 0.25 CSS px quality propagation and cap fallback are covered by focused + full unit proof. Extra raster/source-family cross product is optional. |
| G5 PATH_DISTANCE/phase | NOT_RUN | Local synthetic phase, chunk, viewport and scale profiles pass. Missing terminal evidence: AutoCAD same-source start/phase/length comparison, shared R10 with G7. |
| G6 zoom/DPR error | PASS for F07 | Four zooms × DPR 1/2/3, tolerance 0.25/(zoom×DPR), 12/12. Physical R09 device measurement is separate V01 scope. |
| G7 same-source visual/DIM | NOT_RUN | Requires source hash/profile manifest, R001 model-space comparison and ≥10 semantic ROIs; native AutoCAD owner. No global screenshot/DIM tolerance is invented; use the plan's per-domain thresholds. |

Unsupported-profile rule: plan-authorized caps must return visible partial/degraded diagnostics, never exact PASS. Missing SHX may be explicitly degraded under the plan's dependency rule, but cannot replace same-source AutoCAD parity or hide critical ROI loss. G1–G4/G6 are 5/7 PASS; G5/G7 share one external R10 evidence bundle. No code source changed in this audit; only the existing periodic test's target was tightened. Test SHA-256 `0997329E04E94B8CBCE996A3278E8E5D7A71D132613DCB56B9FFEC5448841A4B`.

**Önceki dilim — F08 v91 rejected-only projected-cell cost cover:** v90 haritasındaki 21 boş projected hücre için tam ağırlıklı set-cover bir minimum 10 chunk / 35.968.388 B (34,30 MiB) CPU aday maliyeti ve aynı seçimin 20.348.712 B (19,41 MiB) GPU-buffer aday maliyetini verdi; 12 hücrede tek ret adayı var. [Türetilmiş set-cover JSON](evidence/fidelity-v3/F08/P00_REJECTED_ONLY_CELL_COST_COVER.json) girdi SHA-256 ve seçili chunk/cell listesini saklar. `candidateCpuBytes` artımlı parça tahminidir; bu toplam total resident, process peak veya yeni 64 MiB hedefi değildir. Altı odak ownership/renderer/transfer/refinement/cache/host lifecycle test komutu exit 0. Production policy değişmedi; F08 PARTIAL / ACCEPTANCE NOT_RUN. AutoCAD semantic hash + ≥10 ROI, clean/native R001, continuous browser-process HWM ve gerçek GPU/Poco dış kanıtları açık.

**Önceki dilim — F08 v90 rejected-chunk spatial map:** P00 initial open 194/284 kabul, 90 benzersiz ret; yeni test-only döküm retlerin 90/90'ını projected 20×20 hücrelere yerleştirdi, 60/64 hücre ret adayı içeriyor ve 21 hücrede kabul edilmiş aday yok. Retlerin tümü CPU kaynaklı. v89 framebuffer capture toplamı 6/12/18 hedeflerinde **8/5/2**, maskeler sabit. Bbox ROI sonuçları: ROI-01 14/18, geniş ROI-02 90/284, ROI-03 1/1, ROI-04 6/6; ROI-05–10 bbox sağlamıyor, bu yüzden eşleme `unknown`. [90 parça ID/cell/ROI haritası](evidence/fidelity-v3/F08/P00_BUDGET_REJECTION_SPATIAL_MAP.json). Port 3149 P00 1/1 PASS (5.2m); port 3148 target12 örneği capture'da 14 accepted gördüğünden dışlandı. `PROVISIONAL_SPECIFICATION`, LibreDWG error68 ve `autoCadOracle=NOT_RUN` sürüyor; F08 **PARTIAL / ACCEPTANCE NOT_RUN**. Production scheduling/admission/budget değişmedi. [F08 v90 crosswalk](evidence/fidelity-v3/F08/F08_ACCEPTANCE_CROSSWALK.md).

**Önceki dilim — F08 v88 paced erken-raster kontrolü:** P00 CI=true, port 3137, **1/1 PASS (2.6m)**. Test-only rank pacing first 16 request/outcome sırasını korudu fakat framebuffer capture 3/2/1 accepted chunk yakaladı; 31/4.288, 2/229, 2/111 cell/piksel karşılaştırması eşit admission set'i olmadığı için geçersiz bir winner testi. Settled raster 46/38.061, 69/50.091, 67/50.712; kabul 194/284, 228/284, 229/284. Tek chunk'tan sonra kalan route'ları durduran kapı port3138'de UI'ı Görünür parçalar aktarılıyor (1/284) durumunda tuttu (60 s timeout, exit1); kanca kaldırıldı. Production değişikliği yok. F08 **PARTIAL / ACCEPTANCE NOT_RUN**: LibreDWG error68; temiz decode, aynı-source AutoCAD semantic hash + 10 ROI, fiziksel GPU/Poco ve production kabulü açık. [F08 v88 crosswalk](evidence/fidelity-v3/F08/F08_ACCEPTANCE_CROSSWALK.md).

**Önceki dilim — F08 v87 ilk framebuffer rasterı:** P00 `CI=true`, port 3136 **1/1 PASS (1.8m)**; ilk 12 request/outcome candidate sırasıyla eşleşti. `readPixels`, ilk accepted chunk sonrası render-task'te default WebGL framebuffer pikselini örnekledi. Page başlangıcından ilk content draw baseline/projected/viewport **12.841/820/1.043 ms**; accepted→draw latency **33,4/10,9/21,7 ms**. First-task raster **31/4.745, 6/1.516, 11/2.964** cell/pixel; accepted chunk 6/6/12'ydi. Settled t16 **46/38.061, 69/50.091, 67/50.712**. Dört koşuda altı accepted chunk'ta projected raster 6/1.516 (3), viewport 5/1.510 (2; yalnız bir paired comparison) verdi; daha fazla chunk frame'e yetişince hücre sayısı arttı. Readback senkron GPU/event-loop etkisi yapabilir; ilk presented compositor frame değildir. `firstDrawAfterFirstAcceptedDelayMs` mutlak timestamp farkıdır. Production admission değişmedi; R001 error68, F08 PARTIAL / ACCEPTANCE NOT_RUN. [F08 v87 crosswalk](evidence/fidelity-v3/F08/F08_ACCEPTANCE_CROSSWALK.md), [lifecycle audit](evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md).

**Önceki dilim — F08 v86 üçlü sıra replay'i:** R001 P00 aynı Chromium testi baseline, projected-grid ve viewport-grid gerçek fixture sıra yüklemelerini çalıştırdı; port 3132, **1/1 PASS (1.6m)**. Candidate request head'leri eşleşti. Kabul 194/284→228/284→229/284, vertex 1.468.378→1.862.234→1.962.234, projected hücre 43/64→63/64→61/64. Settled raster t16 cell/pixel 46/38.061→69/50.091→67/50.712; response settle 9.481→5.218→5.540 ms. İlk accepted→draw latency 217→13→9 ms (ham timestamp 5.032→874→839 ms), o andaki admitted projected occupancy 29/64→6/64→5/64; o koşuda framebuffer raster capture yoktu. Viewport-grid projected'e göre Kat1/-Z'de birer ROI chunk fazla, projected cell'de 2 eksik, raster foreground pixel'de 621 fazla verdi. CPU estimate 74.920.882/72.519.048/73.908.758 B; GPU estimate 51.048.852/44.874.000/44.986.944 B. Bunlar CPU committed HWM veya GPU driver residency değildir. Production admission değişmedi; R001 error 68, F08 PARTIAL / ACCEPTANCE NOT_RUN. [F08 v86 crosswalk](evidence/fidelity-v3/F08/F08_ACCEPTANCE_CROSSWALK.md) ve [lifecycle audit](evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md).

# Gereksinim → kod → test → kanıt → bağımsız kabul

**Önceki dilim — F08 v84 first-view admission counterfactual:** R001 P00 test'i ayrılmış portta **1/1 PASS**. 64 MiB tahmini budget ile actual sıralama 194/284 chunk, 1.468.378 vertex, bbox grid 70/97 ve projected grid 43/64 verdi; 64 projected candidate cell'in 21'inde accepted chunk source'u yok. Viewport-grid simülasyonu 229/284, 1.962.234 vertex, bbox grid 97/97 ve projected grid 61/64; projected-grid simülasyonu 228/284, 1.862.234 vertex, bbox grid 97/97 ve projected grid 63/64 seçti. Dört bbox-defined ROI: Kat1 4/18→15/18, Kat2 194/284→228/284, U317 0/1→1/1, -Z INSERT 0/6→5/6. Simülasyon actual runtime reorder veya native fidelity kanıtı değil; maliyetler eski sıradan alınır ve eşzamanlılık/paylaşılan kaynaklar/fixed overhead dışarıda. Admission policy değişmedi, F08 **PARTIAL / ACCEPTANCE NOT_RUN**. Detay: [F08 v84 crosswalk](evidence/fidelity-v3/F08/F08_ACCEPTANCE_CROSSWALK.md) ve [lifecycle audit](evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md).

**Önceki dilim — F08 v83 Chromium working-set:** R001 P00 browser testi ayrılmış port 3121'de **1/1 PASS** oldu. Windows Playwright Chromium süreçleri 80 saniyede 295 kez (~271 ms ortalama) örneklendi; aggregate anlık working-set örnek maksimumu **1.741.975.552 B**, tek süreç OS peak working set **1.198.309.376 B**, en çok 3 süreç eşzamanlıydı. Bu OS-maintained aggregate HWM değildir; örnek aralığındaki kısa sıçramalar kaçabilir ve shared pages tekrarlı sayılabilir. v82 Node process OS HWM **1.944.174.592 B** ayrı gerçek-sahne testindedir. Gerçek GPU telemetrisi yok. LibreDWG error68; ilk R001 görünüş 284 chunk'tan 194 kabul/90 CPU 64 MiB estimate ret; F08 **PARTIAL / ACCEPTANCE NOT_RUN**. Temiz decode, AutoCAD semantic hash + 10 ROI ve gerçek GPU/Poco dış kapıları açık. Ayrıntı: [F08 v83 crosswalk](evidence/fidelity-v3/F08/F08_ACCEPTANCE_CROSSWALK.md) ve [lifecycle audit](evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md).

**Önceki dilim — F08 v82 ownership + Node process HWM:** Renderer kaynakları scene/generation/chunk sahibi ve refCount lease'leriyle izliyor; ortak geometry/material son lease bırakılınca dispose ediliyor. Host generation geçişi eski chunk'ları temizliyor, WorkerClient aynı transferable ArrayBuffer'ı ikinci kez göndermiyor. Ledger, renderer integration, transfer guard, scheduler/LRU, refinement preflight ve lifecycle odak testleri PASS; runtime typecheck exit 0. Ayrılmış Chromium grubu **5/5 PASS**. R001 Node test sürecinin OS-maintained maxRSS tepe değeri **1.944.174.592 B** oldu (scene compile sonunda); browser-process RSS/HWM ve gerçek GPU telemetrisi o dilimde alınmadı. R001 LibreDWG `error 68`; ilk görünüşte 284 chunk'ın 90'ı CPU 64 MiB estimate sınırı nedeniyle reddedildi. F08 **PARTIAL / ACCEPTANCE NOT_RUN**; temiz decode, AutoCAD semantic hash + 10 ROI ve Poco/gerçek GPU dış kapıları açık. Ayrıntı: [F08 v82 crosswalk](evidence/fidelity-v3/F08/F08_ACCEPTANCE_CROSSWALK.md) ve [lifecycle audit](evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md).

**Önceki dilim — F08 v81 tam doğrulama + faz RSS örnekleri:** Ayrılmış Playwright sunucusunda (`CI=true`, port 3107) `npm run check:cad-v2:ui` **18/18 Chromium PASS**. DPR3 ARC browser fixture'ında eksik heartbeat mock'u sentetik session'ın 410 alıp `prepare` akışını başlatmasına neden oluyordu; heartbeat route'u 200/180s olacak şekilde tamamlandı, aynı test **3/3 PASS**. R001 Node RSS start/decode/compile/20 worker cycle örnekleri **83.369.984 / 422.305.792 / 1.916.981.248 / 1.947.602.944 byte**; bunlar faz snapshot'ları, peak değildir. F08 **PARTIAL / ACCEPTANCE NOT_RUN**. Açık yerel iş: explicit shared-resource owner/refcount ledger ve sürekli peak telemetry; dış kapılar clean decode, AutoCAD semantic 10 ROI ve fiziksel GPU/Poco. Detay: [F08 v81 audit](evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md) ve [kabul çapraz tablosu](evidence/fidelity-v3/F08/F08_ACCEPTANCE_CROSSWALK.md).

**F08 v80 kabul çapraz tablosu + recovery state continuity:** [F08 v3 acceptance crosswalk](evidence/fidelity-v3/F08/F08_ACCEPTANCE_CROSSWALK.md) separates resident/estimated budgets from actual peak and native/hardware evidence. 10× context recovery browser **1/1 PASS** with stable camera transform, Model layout, visible GEOMETRY layer, `showLineweights=false`, rendered-frame gate and no repeat chunk request. Budget/LRU, 20 open-close, stale file switch and legacy DOM browser tests **4/4 PASS**; the 20-cycle loop had 20 worker terminate + session DELETE, zero active worker, and stable window/document/canvas listener counts 24/149/0. R001 P00 browser **1/1 PASS**: 284/284 Model chunks use current drawCommands; 8 zoom + 3 pan produced 6 reload requests / 23.368 bytes, five budget retries + one evicted reload, 6 accepted/0 rejected. Current partial R001 raster mask remains 43 accepted projected cells vs 46 thresholded canvas cells; three low-density cells' 31 pixels sit 0.293–0.670 CSS px from accepted source lines. R001 error 68 and profile provisional. Shared resource `ownerScene/generation/refCount/byteEstimate`, actual peak/process memory/GPU, clean decode, AutoCAD semantic hash + 10 ROI and physical device remain open. F08 **PARTIAL / ACCEPTANCE NOT_RUN**.

**F05 v61 source-handle and nested ATTRIB:** DXF ASCII/binary model-space and nested BLOCKS INSERT→ATTRIB pair records bind by exact group-5 source handle. BLOCKS records with no exact handle are not ordinal-guessed and emit `UNRESOLVED_DXF_INSERT_ATTRIBUTES`. Nested source render, ATTDEF precedence, alignment/justification, constant/invisible and unsupported OCS are covered; outer-transform BBox `[600.000,500.000..620.007,516.820]`. DWG adapter consumes libredwg-web `INSERT.attribs[]` / nested text fields and has synthetic source-shape checks for default +Z geometry and diagnostic boundaries. R001 error68 yields 1,922 INSERT but no observed attached ATTRIBs in that partial parse; clean attribute-bearing DWG and native AutoCAD visual remain NOT_RUN. F05 Gate 1–7, cache identity, decoder-field contract, app/test TypeScript and scoped diff-check PASS; compiler/cache v71. F05 remains OPEN/PARTIAL. See [F05 v61 acceptance evidence](evidence/fidelity-v3/F05/DIMENSION_ATTRIBUTE_ACCEPTANCE.md).

**Önceki F08 v69 CPU/GPU cohort retry → P00 tekrar ölçümü:** `ChunkAdmissionRetryGate` kapasite revizyonuna bağlı retry maliyetini saklıyor; aynı batch içindeki önceki-ret ve LRU-evicted adaylarının toplam tahmini CPU/GPU maliyeti kapasiteyi aşmıyor. Evicted chunk son admission maliyetiyle değerlendirilir. Bütçeye sığmayan görünür aday transfer başlatmadan ertelenir ve degraded/kısmi uyarısı korunur. Cache unit, sentetik gerçek-host F08 Playwright **1/1**, runtime TSC ve tam `check:cad-v2:ui` **18/18 Chromium PASS**. R001 P00 **1/1 PASS**: 8 zoom + 3 pan'de **6/6** request/start/outcome; 5 önceki-ret retry'si + 1 accepted→evicted→reload, **6 kabul / 0 ret**, unknown/missing **0**, **23.368 byte**. V68'e göre 380 istek ve 268.433.896 byte azalma; warm sette 284 ID, etkileşim 6 benzersiz ID ve yeni ID 0. İlk açılış 194 kabul/90 ret, aynı kısmi canvas hash'i. R001 error 68; native AutoCAD ROI, temiz decode ve fiziksel GPU/peak NOT_RUN; F08 **ACCEPTANCE NOT_RUN**. Tam detay F08 v69 audit'te.

**F08 v68 kapasite kapılı retry → P00 tekrar ölçümü:** `ChunkAdmissionRetryGate` ret durumunu kapasite revizyonuna bağlar; görünür küme değişikliği kendi başına retleri temizlemez. Kabul edilmiş chunk görünmez olup eviction adayı olduğunda veya görünür baskı tahliyesinden sonra bir admission kabul edildiğinde yeni retry fırsatı açılır. Başarısız baskı tahliye döngüleri tek başına yeni izin vermez. Cache gate testi, F08 Chromium layout fixture (**1/1**), runtime TSC ve `check:cad-v2:ui` (**18/18 Chromium**) PASS. Aynı R001 P00 (**1/1**): 8 zoom + 3 pan'de **386/386** network/load-start/terminal eşleşmesi; **273** önceki ret retry'si ve **113** kabul→LRU eviction→reload; unknown/missing **0**. V67'de 641/527.969.056 byte iken v68'de **386/268.457.264 byte**: **255 istek (%39,8)** ve **259.511.792 byte (%49,2)** azalma. 116 admission-pressure eviction, warm açılıştaki 284 ID'den 200 benzersiz etkileşim ID'si ve sıfır yeni ID. Açılış yine 194 kabul/90 ret; CPU/GPU tahmin/bütçe 74.920.882/67.108.864 ve 51.048.852/67.108.864 byte; aynı kısmi canvas hash'i. R001 LibreDWG error 68; `PROVISIONAL_SPECIFICATION`, native ROI/AutoCAD, gerçek GPU ve fiziksel peak NOT_RUN; F08 **ACCEPTANCE NOT_RUN**.

**F08 v67 admission/eviction → P00 refetch karar izi:** cad-v2-host-shell.tsx test callback'i varsa load start, accepted/rejected/stale outcome, CPU/GPU estimated bytes/budgets ve görünür-admission/cache-weight/curve-refinement tahliye nedenlerini kaydeder. Küçük bütçeli browser fixture 4 Model isteğinde 3 kabul/1 ret, Sheet geçişinde görünmez tahliye ve Model dönüşünde reload doğruladı (1/1). Gerçek R001 P00 (1/1): 641 network isteği ile 641 host başlangıç/sonucu eşleşti; 528 önceki budget reddi retry'si, 113 kabul sonrası LRU tahliyesi reload'u; unknown/missing outcome 0. Etkileşimde 116 görünür-admission baskı tahliyesi ve 527.969.056 yeniden transfer byte'ı ölçüldü. Her açılış 194 accepted/90 rejected; CPU peak estimate/budget 74.920.882/67.108.864 byte, GPU 51.048.852/67.108.864. Bu renderer estimate'i gerçek GPU/peak değildir. Runtime TSC PASS; check:cad-v2:ui **18/18 PASS**. R001 LibreDWG error 68, native ROI oracle NOT_RUN; F08 **ACCEPTANCE NOT_RUN**.


**F08 v66 P00 warm-set refetch izi:** Aynı `check:cad-v2:f08:p00` gerçek R001→Document Studio V2 host koşusu **1/1 PASS**. Test şimdi her etkileşim isteğini warm açılış ID setine göre sayar: 8 zoom + 3 pan'de **641/641 isteğin** tamamı warm'da daha önce istenmiş 284 ID içinden, 200 benzersiz ID tekrar indirildi; warm küme dışında yeni ID yok; toplam **527.969.056 byte**. Bu, tekrar transferini doğrular, ama hangi isteğin ilk 90 admission reddi veya daha sonra LRU tahliyesinden kaynaklandığını ayırmaz. Host DOM yalnız son genel budget uyarısını verdi; geçici per-chunk CPU/GPU tahmin oranı bu yöntemle alınamadı. Cold/warm etkileşim 8.612/4.384 s; 90 görünür chunk atlandı; 11 input→WebGL draw p50/p95 **16,5/18,4 ms**. Warm host açılışı ve sonraki etkileşim örneğinin toplamında 10 long task, maks. 728 ms. R001 LibreDWG error 68; F08 **ACCEPTANCE NOT_RUN**. Diğer detaylar F08 audit dosyasında.

**F08 v65 P00 gerçek R001 browser örneği:** `tests/document-studio/cad-v2-p00-baseline.spec.ts` gerçek DWG upload'ı sonrası Document Studio `?cadEngine=v2` host'una gider; actual host chunk kabul/admission, warm reload, canvas, CDP heap, per-process RSS, WebGL bufferData, interaction-to-next-draw ve bbox→chunk ROI eşleşmesini izler. `npm run check:cad-v2:f08:p00 -- --reporter=line` PASS 1/1. R001 3.444.087 byte/SHA `17A92CB5…F086`; LibreDWG error 68; compiler 2.630 ms decode/15.204 ms compile, Node compile-sonrası RSS 1.904.422.912 byte; 286 chunk/98.042.688 byte. İlk/warm host interactive 8.808/4.296 s; her iki açılışta 284 chunk/98.040.976 byte ve eş canvas hash'i; ikisinde de **90 görünür parça budget uyarısıyla atlandı**. 8 zoom + 3 pan: WebGL draw-call'a event latency p50/p95 16,1/17,8 ms; 641 chunk request/527.969.056 byte; 6 long task, max 789 ms. ROI-01/02 bbox chunk adayları 18/18 ve 284/284, ROI-03/04 1/1 ve 6/6, profil handle'ları 2/2 ve 6/6; ROI-05–10 bbox olmadan kapsama vermez. Bu, parça-fetch ve tekrar/hash gözlemidir, native semantic ROI parity değildir. SwiftShader ve seyrek RSS/heap noktaları fiziksel GPU/peak değildir; error 68 temiz DWG decode değildir, F08 **ACCEPTANCE NOT_RUN**. Ayrıntı `evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md`.

**F08 v64 curve replacement ve ölçüm izi:** `render/curve-refinement-memory-accounting.ts` renderer replacement öncesi resident, yeni attribute, refinement scratch/source ve worker cache reserve tahminlerini ortak CPU/GPU budget evaluator'ına verir. `cad-v2-host-shell.tsx` preflight'ta gerekirse invisible LRU eviction sonrası bir kez yeniden hesaplar; taşma sürerse eski geometry'yi tutar/degraded işaretler ve retry loop'u önler. `cache/chunk-spatial-scheduler.ts` `updateByteLength` ile yalnız kabul edilmiş replacement sonrası ağırlığı cleanup callback'i çağırmadan düzeltir. `tests/cad-v2/curve-refinement-memory-accounting.test.ts`, `chunk-scheduler-cache.test.ts`, `host-lifecycle-cancellation.test.ts`, scoped runtime TSC PASS; son LRU düzeltmesinden sonra budget + bağımsız runtime ELLIPSE Chromium testleri 2/2 PASS. Önceki tam UI koşusu 18/18 idi, fakat bu son LRU değişikliğinden önce. P00 R001 Node stage/RSS örnekleri audit'te kayıtlı; error68 var, browser/WebGL/peak/GPU/ROI kabulü değildir. F08 **ACCEPTANCE NOT_RUN**.

**F08 v63 byte ownership izi:** `worker/resource-budgets.ts` cache 8 MiB + in-flight transfer reservation 16 MiB sabitlerini paylaşır. `cad-v2-scene-worker.ts` worker cache tutulan/evicted chunk ID'lerini iletir, inline sidecar birleşik limitini uygular ve JSON refs mesajını destekler. `worker-client.ts` cache hit'te inline source üretmez; miss'te bir kere bounded fallback, aşımda yerel refine kullanır; ready/error/dispose readiness timer'ını temizler. `weighted-byte-budget.ts` chunk worker havuzunu manifest byte ağırlığıyla backpressure eder ve abort bekleyenleri uyandırır; `weighted-byte-budget.test.ts` 7/7 ve `worker-client-refinement.test.ts` 9/9 PASS. `worker-refinement-browser.test.ts` real Worker'da retained cache/cached refinement, generation fence, array fallback ve JSON fallback PASS; `host-lifecycle-cancellation.test.ts` 5/5; runtime TSC ve worker bundle PASS. Manifest rezervasyonu gerçek heap/peak/RSS/GPU ölçümü değildir; `replaceSceneChunkGeometry` eski grubu yeni buffer üretimi bitene kadar tutar, overlap bütçesi ve P00 ROI/hash **NOT_RUN**. F08 **ACCEPTANCE NOT_RUN**.

**F08 v62 kaynak ve test izi:** `cad-v2-host-shell.tsx` prepare'ı StrictMode ilk effect cleanup'ı sırasında iptal edilebilen kısa bir macrotask'a erteleyip cleanup'ta generation/abort/heartbeat/session/worker referanslarını sonlandırır. `cad-v2-layout-viewport.spec.ts` 20 V2↔dosya listesi turunda 20 prepare/20 worker terminate/20 session DELETE ve kapanışta sabit `window/document/canvas` dinleyici tabanını, ayrıca iki dosya arasında gecikmiş eski chunk'ın yeni çizime girmemesini sınar. CDP 20 tur GC sonrası heap/DOM/listener örnekleri ve 10 tur legacy kontrolü F08 audit içinde; V2-only DOM 758→800 iken legacy kontrolünde 1.130→6.577 artışı ayrı tutulur. F08 peak/GPU/RSS/worker sidecar/P00 ROI ve geniş production kabulü **NOT_RUN**.

**F08 v61 yaşam döngüsü izi:** `cad-v2-layout-viewport.spec.ts` gerçek host'ta 20 SPA aç/kapat turunda 20 worker oluşturma/terminate ve 20 görünür session DELETE; 10 ardışık WebGL context loss/restore turunda frame gate, çizim pikseli ve tek chunk isteğini doğrular. Hedefli Chromium Playwright 2/2, runtime TSC PASS. StrictMode geliştirici koşusunda 40 prepare üretir; erken abort edilenlerin sunucu oturumu bu browser testinde çözümlenmez. File switch/stale generation, peak/plateau CPU-GPU/heap, P00 ROI ve fiziksel GPU açık; F08 **ACCEPTANCE NOT_RUN**. Ayrıntı `evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md` içinde.

**F08 v60 gerçek host izi:** `cache/chunk-spatial-scheduler.ts` en eski invisible resident chunk'ı seçer; `render/chunk-memory-accounting.ts` admission'ın renderer CPU byte katkısını döndürür; `cad-v2-host-shell.tsx` görünür küme, 64 MiB CPU/GPU budget, eviction cleanup, eski reddi yeniden deneme ve açık degraded/ready uyarısını yönetir. `cad-v2-layout-viewport.spec.ts` gerçek V2 host'ta 4 Model chunk yüküyle 3 accepted/1 rejected, `SHEET_A` sonrası invisible eviction, Model'e dönüşte refetch ve toplam 7 request doğrular. Hedefli budget/LRU + context recovery Playwright 2/2, cache/lifecycle unit, runtime TSC ve scoped code diff-check PASS. 20+10 döngü, fiziksel GPU, peak metrikleri, file switch ve R001 semantik ROI kanıtı açık; F08 **ACCEPTANCE NOT_RUN**.

**F08 v59 resident-budget izi:** `render/resource-memory-estimate.ts` renderer geometrilerindeki unique backing stores ve BufferAttribute/index upload byte tahminini sayar; `render/chunk-memory-accounting.ts` incoming chunk arrays/metadata payını ve ayrı 64 MiB CPU/GPU politikasını hesaplar. `cad-v2-host-shell.tsx` bu politikayı loaded geometry + retained refinement source + incoming chunk için çağırır; taşan chunk'ı sahneden çıkarıp generation boyunca reddeder ve degraded kalite bildirir. `host-lifecycle-cancellation.test.ts` accounting/boundary/overflow/invalid-metric assertions PASS; runtime TSC PASS. Browser recovery Playwright 1/1 PASS ama bütçe overflow fixture'ı değildir. Ölçüm gerçek peak CPU/RSS/browser heap/GPU allocation değildir; host LRU/eviction/reload ve 20+10 lifecycle acceptance açık. Ayrıntı `evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md` içinde; F08 **TODO/ACCEPTANCE NOT_RUN**.

**F08 v58 context recovery izi:** `RenderedFrameGate` + `CadV2Renderer.waitForNextRenderedFrame()` WebGL kaybı/dispose ve başarılı restore frame'ini ayırır. Host güncel generation, görünür manifest chunk'ları ve render edilmiş frame tamamlanmadan stable `ready/degraded` fazına dönmez. `host-lifecycle-cancellation.test.ts` ve targeted Chromium `WEBGL_lose_context` test PASS; frame hold sırasında loading ve canvas içerik geri gelişi/pixel sayımı doğrulandı. Bu bir simüle recovery'dir. 10 recovery, 20 open/close, fiziksel GPU, CPU/GPU byte bütçeleri ve host eviction/reload açık; F08 **TODO/ACCEPTANCE NOT_RUN**. Tam kapsam F08 audit dosyasında.

**F05 v57 / F08 ilk denetim:** `dxf-dimension-override-pairs.ts` kaynak grup 70/50 ve extension noktalarını handle ile okur; `dxf-adapter.ts` desteklenen kaynak türünü converter varsayımı yerine canonical DIMENSION'a uygular. `dimension-attribute.test.ts` aligned `A05A` ve rotated linear `D05A` çizgilerini sınar. F05 seçili LOCAL PASS, genel OPEN/PARTIAL. F08 `evidence/fidelity-v3/F08/LIFECYCLE_BASELINE_AUDIT.md` mevcut scheduler/host/renderer kaynak bağlantısı ve eksik yaşam döngüsü ölçümünü kaydeder; F08 **TODO/NOT_RUN**. Compiler/cache v67.

**F05 v56 iz:** `decode/dxf-dimension-override-pairs.ts` handle'lı planar linear/aligned kaynak `10/20`, `13/23`, `14/24`, `50` gruplarını okur; `dxf-adapter.ts` bunları eşleşen `objectId` DIMENSION alanlarına bağlar. `dimension-attribute.test.ts` D05A kaynak noktalarını ve `y=5`, `x=0..10` çizgisini doğrular; oblique `52=15` warning + scene degraded. `decoder-field-contract`, `cache-identity`, runtime TSC PASS. Compiler/cache v66; seçili profil LOCAL PASS, F05 OPEN/PARTIAL, native oracle NOT_RUN. Ayrıntı F05 acceptance v56 bölümünde.

**F05 v55 iz:** `decode/dxf-dimension-override-pairs.ts` kaynak `ACAD/DSTYLE` çiftlerini handle'a bağlı okur; `dxf-adapter.ts` kaynak `objectId` eşleşince seçili `DIMDEC/DIMLFAC/DIMSE1` override'ını canonical DIMENSION'a uygular. Komşu style peer korunur. Eşleşmeyen, desteklenmeyen/aralık dışı/handle'sız girdiler tanılı; bağlanamayan override scene'de degraded olur. `dimension-attribute`, `decoder-field-contract`, `cache-identity`, runtime TSC PASS; seçili per-entity LOCAL PASS, kaynak geometri/native oracle OPEN, F05 OPEN/PARTIAL. Ayrıntı F05 acceptance v55 bölümünde.

**F05 v54 güncel iz:** F05 plan maddelerinin sonlu kabul matrisi `evidence/fidelity-v3/F05/DIMENSION_ATTRIBUTE_ACCEPTANCE.md` üstündedir. Açısal literal override/`<>` derece biçimi `dimension-compiler.ts` v64 ve `dimension-attribute.test.ts` formatter+visitor assertions ile yerel PASS; per-entity override, gerçek annotative context, DWG/binary attribute/MLEADER ve R001 native oracle OPEN/NOT_RUN. R001 LibreDWG error 68 temiz decode değildir. F07 yerel 5/7 ile G5/G7 dış kanıtı ayrı kalır.

| Paket / amaç | Zorunlu işler | Bitiş kanıtı | Bağımlılık | Güncel durum |
|---|---|---|---|---|
| F05 / dimension ve annotation fidelity | Saved `*D`/sentez, altı ölçü türü, metin/style/per-entity override, annotative scale, ATTRIB instance, LEADER/MLEADER, R001 kıyası | `dimension-attribute.test.ts` seçili yerel profil; gerçek kaynak DIMENSION object context ve aynı kaynak AutoCAD metin/ok/geometri karşılaştırması | Temiz DWG decode veya bağımsız kaynak fixture; native AutoCAD R001 oturumu. Ayrıntılı sonlu satırlar F05 acceptance dosyasında | **OPEN/PARTIAL**: seçili yerel profiller PASS; annotative ve native NOT_RUN; error 68 temiz decode engeli |

[Kayıt dizini](uygulama__README.md) · [Gereksinim anlamları](24_GEREKSINIM_KATALOGU.md) · [Kanıt sistemi](20_KAYIT_VE_KANIT_SISTEMI.md) · [Fidelity v3 Kanıt Klasörü](evidence/fidelity-v3/)

---

## Fidelity v3 Paket İzlenebilirlik Tablosu

| Paket | Kapsam | İzinli Dosyalar | Test Dosyası / Komutu | Kanıt Yolu | Durum |
|---|---|---|---|---|---|
| **P00** | Başlangıç fotoğrafı, kapsam ve referans profili | Yok (salt dokümantasyon ve kanıt) | `node --import tsx C:/Users/hsyn/Downloads/cad-v2-plan-v3-audit.ts` | `motor_v2/evidence/fidelity-v3/P00/` (`baseline.json`, `reference-profile.json`, `scope.md`) | **PASS** |
| **P01** | En erken kayıp noktası ve gerçek kalite muhasebesi | `canonical/types.ts`, `decode/dwg-adapter.ts`, `decode/dxf-adapter.ts`, `compile/scene-compiler.ts`, `canonical/diagnostics.ts`, `scripts/cad-v2/audit-source-pipeline.ts` | `tests/cad-v2/provenance-quality.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/P01/` (`source-census.json`, `provenance-summary.json`) | **PASS** |
| **P02** | Transfer, manifest, worker ve host state doğruluğu | `cad-v2-host-shell.tsx`, `cad-v2-canvas.tsx`, `worker-client.ts`, `binary-protocol.ts`, `cad-v2-renderer.ts`, `cad-v2-scene-worker.ts` | `tests/cad-v2/manifest-validation.test.ts`, `chunk-completeness.test.ts`, `worker-generation.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/P02/failure-matrix.json` | **PASS** |
| **P03** | Kaynak/scene kimliği, bütünlük ve publish transaction | `cad-v2-durable-service.ts`, `scene-compiler.ts`, `version.ts`, `scene-identity.ts`, `scripts/cad-v2/run-v2-compiler-cli.ts` | `tests/cad-v2/cache-identity.test.ts`, `publish-atomicity.test.ts`, `durable-service.test.ts` (npm run check:cad-v2:unit / integration) | `motor_v2/evidence/fidelity-v3/P03/publish-transaction-audit.json` | **PASS** |
| **P04** | Gerçek decoder sözleşmesi: visibility, HATCH, ellipse, units | `decode/dwg-adapter.ts`, `decode/dxf-adapter.ts`, `canonical/types.ts`, `canonical/diagnostics.ts`, `compile/block-transformer.ts`, `compile/scene-compiler.ts` | `tests/cad-v2/decoder-field-contract.test.ts`, `visibility-units.test.ts`, `dwg-ownership.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/P04/` (`decoder-contract-audit.json`) | **PASS** |
| **P05** | OCS, affine stack, mirrored geometri ve bounds | `canonical/types.ts`, `compile/coordinate-transform.ts`, `decode/*-adapter.ts`, `compile/block-transformer.ts`, `geometry-compiler.ts`, `scene-compiler.ts` | `tests/cad-v2/affine-ocs.test.ts`, `bounds-provenance.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/P05/` (`affine-ocs-audit.json`, `bounds-provenance.json`) | **PASS** |
| **P06** | Ortak entity compiler, block text ve güvenli expansion | `compile/block-transformer.ts`, `scene-compiler.ts`, `geometry-compiler.ts`, `text/font-layout-engine.ts`, `canonical/types.ts`, `compile/entity-visitor.ts` | `tests/cad-v2/entity-instance-parity.test.ts`, `block-expansion-budget.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/P06/` (`entity-instance-parity.json`, `block-expansion-budget.json`) | **PASS** |
| **P07** | Gerçek sahne komutları, fill/maske ve kararlı çizim sırası | `protocol/binary-protocol.ts`, `compile/scene-compiler.ts`, `geometry-compiler.ts`, `canonical/types.ts`, `cad-v2-scene-worker.ts`, `worker-client.ts`, `cad-v2-renderer.ts`, `version.ts` | `tests/cad-v2/primitive-roundtrip.test.ts`, `hatch-topology.test.ts`, `painter-order.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/P07/` (`primitive-roundtrip.json`) | **PASS** |
| **P08** | R001 kök düzeltme kabulü | Yok (doğrulama/kabul paketi) | `scripts/cad-v2/audit-source-pipeline.ts`, `tests/cad-v2/r001-root-fix.test.ts` | `motor_v2/evidence/fidelity-v3/P08/ROOT_FIX_ACCEPTANCE.md` | **PASS** |
| **F01** | Renk, layer, transparency ve ekran renk uzayı | `compile/cad-color-resolver.ts`, `canonical/types.ts`, `compile/entity-visitor.ts`, `compile/scene-compiler.ts`, `decode/*-adapter.ts`, `render/cad-v2-renderer.ts` | `tests/cad-v2/style-resolution.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/F01/STYLE_RESOLUTION_ACCEPTANCE.md` | **PASS** |
| **F02** | Gerçek stroke, lineweight ve polyline width | `canonical/types.ts`, `render/cad-stroke.ts`, `compile/geometry-compiler.ts`, `compile/entity-visitor.ts`, `compile/block-transformer.ts`, `compile/scene-compiler.ts`, `render/cad-v2-renderer.ts` | `tests/cad-v2/stroke-width.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/F02/STROKE_WIDTH_ACCEPTANCE.md` | **PASS** |
| **F03** | Linetype, dash phase ve model/paper ölçeği | `canonical/types.ts`, `decode/*-adapter.ts`, `render/cad-stroke.ts`, `compile/geometry-compiler.ts`, `compile/scene-compiler.ts`, `compile/entity-visitor.ts`, `compile/block-transformer.ts`, `protocol/binary-protocol.ts`, `cad-v2-scene-worker.ts` | `tests/cad-v2/linetype-phase.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/F03/LINETYPE_PHASE_ACCEPTANCE.md` | **PASS** |
| **F04** | Font, TEXT, MTEXT ve Türkçe karakter doğruluğu | `canonical/types.ts`, `canonical/diagnostics.ts`, `decode/*-adapter.ts`, `text/font-layout-engine.ts`, `compile/block-transformer.ts`, `compile/entity-visitor.ts`, `compile/scene-compiler.ts` | `tests/cad-v2/font-style-layout.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/F04/FONT_STYLE_ACCEPTANCE.md` | **PASS** |
| **F05** | DIMENSION, ATTRIB/ATTDEF, LEADER ve annotation | `compile/dimension-compiler.ts`, `compile/entity-visitor.ts`, `compile/scene-compiler.ts`, `decode/*-adapter.ts`, `canonical/types.ts` | `tests/cad-v2/dimension-attribute.test.ts` (local synthetic override/constant/invisible/top-level mirror + ASCII DXF decoder INSERT/ATTRIB/ATTDEF binding + MLEADER unsupported diagnostic + R001 census) | `motor_v2/evidence/fidelity-v3/F05/DIMENSION_ATTRIBUTE_ACCEPTANCE.md` | **PARTIAL — Gate 5 alignment/nested mirror, DIMSTYLE, binary/DWG ATTRIB/MLEADER fixture and independent visual oracle open; Gate 5A/6A selected DXF profiles PASS** |
| **F06** | Layout, viewport, XCLIP ve bağımlılık sınırları | `layout/layout-manager.ts`, `decode/dxf-xclip-pairs.ts`, `decode/dwg-adapter.ts`, canonical layout/viewports, scene compiler, renderer | `tests/cad-v2/layout-viewport.test.ts` (AutoCAD-authored normal/inverted/off DWG; ASCII + native binary DXF; XCLIPFRAME ayrımı; malformed/front-depth fail-closed; paper/model ownership; clip exact-segment); `tests/cad-v2/layout-viewport-render.test.ts` (iki paper layout, reused model, rotated/polygon viewport, frozen layer/style override, missing XREF degraded, renderer layout state); `tests/document-studio/cad-v2-layout-viewport.spec.ts` (Playwright/Chromium V2 host, worker/binary chunk/WebGL canvas layout switch); `npm run check:cad-v2:release` | `motor_v2/evidence/fidelity-v3/F06/LAYOUT_VIEWPORT_ACCEPTANCE.md` | **PASS — tanımlı 2D kabul kapsamı. Genel AutoCAD parity değil; unsupported OCS/clip/depth fail-closed, unresolved XREF degraded; same-source reference render V01'de açık.** |
| **F07** | Yüksek koordinat hassasiyeti, curve/refinement ve zoom hata bütçesi | `compile/geometry-compiler.ts`, `compile/coordinate-transform.ts`, `compile/entity-visitor.ts`, `compile/block-transformer.ts`, `compile/dimension-compiler.ts`, `compile/scene-compiler.ts`, `render/render-order.ts`, `render/chunk-visibility.ts`, `render/cad-v2-renderer.ts`, `canonical/diagnostics.ts`, `render/cad-stroke.ts`, `protocol/binary-protocol.ts`, `worker/curve-refinement.ts`, `worker/apply-curve-refinements.ts`, `workers/cad-v2/cad-v2-scene-worker.ts`, `lib/cad-v2/worker/worker-client.ts`, `components/dokumantasyon/cad-v2/cad-v2-host-shell.tsx` | `tests/cad-v2/precision-refinement.test.ts`; `tests/cad-v2/chunk-error-accounting.test.ts` (XY/TRIANGLES vertex, PATH_DISTANCE scalar, affine CURVE_DATA source F32 quantization, direct top-level CIRCLE/ARC, ELLIPSE and direct+nested/transformed standalone non-periodic SPLINE chord sagitta world/CSS accounting ve statik HATCH fill-boundary tessellation ve aynı fill triangle Float32 nicemlemesi/bileşik hata bound'u, CSS dönüşümü, degraded tanılar ve worker bütçe düşümü); `tests/cad-v2/curve-refinement.test.ts` (refined PATH_DISTANCE chord-length phase mapping); `tests/cad-v2/chunk-scheduler-cache.test.ts` (compiled bbox/index/validator/scheduler, lineweight padding); `tests/cad-v2/layout-viewport-render.test.ts` (camera bbox, renderer pan/layout viewport culling, legacy fail-open); `tests/cad-v2/manifest-validation.test.ts`; `tests/cad-v2/painter-order.test.ts`; `tests/cad-v2/worker-refinement-browser.test.ts`; remaining curve/stroke/protocol tests; `npm run check:cad-v2:unit`; `npm run check:cad-v2:ui` | `motor_v2/evidence/fidelity-v3/F07/PRECISION_REFINEMENT_ACCEPTANCE.md`, `RUNTIME_REFINEMENT_ARCHITECTURE.md` | **IN_PROGRESS — Lineweight-conservative bbox, XY/TRIANGLES, affine CURVE_DATA source, and PATH_DISTANCE Float32 quantization measurements flow into flat/index manifests; runtime refinement preserves interval endpoint phases and distributes intermediate PATH_DISTANCE by emitted chord length. PATH_DISTANCE is not consumed by the current renderer, so rendered dash parity remains open. Host provides bbox to camera-driven renderer culling with legacy fail-open. Sequential count partition/eager fetch, GPU/output transform and remaining tessellation, HATCH fill topology/runtime remesh ve diğer geometriler için bileşik hata muhasebesi, glyph/chunk-boundary accounting, periodic AutoCAD spline profile and same-source AutoCAD oracle remain open.** |
| **F08** | Bellek, performans ve yaşam döngüsü doğruluğu | F08 plan allowlist'i | F08 kabul testleri | `motor_v2/evidence/fidelity-v3/F08/` | TODO / ACCEPTANCE NOT_RUN |
| **R01** | Production hazırlama ve çok süreç dayanıklılığı | V2 service, DB repository, API routes | `tests/cad-v2/durable-multiprocess.test.ts`, `api-revision-auth.test.ts` | `motor_v2/evidence/fidelity-v3/R01/` | TODO |
| **V01** | Son kabul ve release adayı | Yok (nihai kabul ve release raporu) | Tüm test zinciri + gerçek cihaz doğrulaması | `motor_v2/evidence/fidelity-v3/V01/` | TODO |

---

## Tarihsel R01–R48 İndeksi (EXEC-2 / Düzeltme Planı Kaydı)

Tarihsel kayıtlar korunmuştur.

| R | G | Kaynak dosya / sembol | Gerçek test / oracle | RUN / ART / SNAP | Uygulama | Test sonucu | Astra denetimi |
|---|---|---|---|---|---|---|---|
| R01 | G00,G13,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R02 | G13 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R03 | G02,G11 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R04 | G02 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R05 | G03,G06 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R06 | G06 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R07 | G05,G08 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R08 | G07 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R09 | G07,G09 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R10 | G08 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R11 | G08,G10 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R12 | G06,G09 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R13 | G09 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R14 | G09,G11 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R15 | G02,G09,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R16 | G03,G06 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R17 | G03,G10 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R18 | G11 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R19 | G11,G14 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R20 | G10,G11 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R21 | G05,G10,G11 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R22 | G05 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R23 | G12 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R24 | G05,G12 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R25 | G04,G12,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R26 | G12,G14 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R27 | G11,G12 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R28 | G03,G10,G12 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R29 | G01,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R30 | G12,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R31 | G01,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R32 | G04,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R33 | G04,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R34 | G04,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R35 | G04,G12,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R36 | G13 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R37 | G14 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R38 | G13,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R39 | G02,G07,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R40 | G00,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R41 | G00,G17 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R42 | G04,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R43 | G11,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R44 | G15,G17 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R45 | G05,G08,G10 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R46 | G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R47 | G11,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R48 | G17 ve denetim turları | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |

## F07 son izlenebilirlik güncellemesi (2026-09-24)

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Nested/transformed LWPOLYLINE BULGE static fallback centerline chord sagitta | `compile/geometry-compiler.ts`, `compile/entity-visitor.ts`, `compile/scene-compiler.ts`, `protocol/binary-protocol.ts`, `canonical/diagnostics.ts`, `version.ts` | `tests/cad-v2/chunk-error-accounting.test.ts`: `bulge=1`, `R=20` exact circle formula; iki nested seviye 2×3 + mirrored 4×1/rotation; 20.001 dense samples; cap, XCLIP, flat/index/validator | **PASS —** v23→v24; `DV2SCN01` schema v1 değişmedi. Yalnız continuous, widthless centerline fallback sagitta'sı. |

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Applied runtime refinement Float32 XY buffer CSS-space deviation + apply-bound validation | `worker/apply-curve-refinements.ts`, `worker/curve-refinement.ts`, `render/cad-v2-renderer.ts` | `tests/cad-v2/curve-refinement.test.ts`: high-origin compiled CIRCLE → worker refine → production apply → 20.001 exact-source samples projected through chunk-origin/camera offset + CSS units; invalid bound/NaN reject | **PASS —** ≤0.25 CSS px geometric buffer deviation; conservative worker metric covers measurement. Raster WebGL/device-pixel output and AutoCAD same-source oracle remain open; no compiler/cache revision. |

Bu dar PASS F07'yi kapatmaz. Periodic SPLINE AutoCAD fixture/desteği ve degree-2 çoklukları 1/2, degree-3 çoklukları 1/2/3, degree-4 çoklukları 1/2/3/4 ve degree-5 çoklukları 1/2/3/4/5 profilleri dışındaki knot/degree profilleri; HATCH runtime remesh/topology; bounded spatial partition/on-demand chunk yükleme; fill/glyph/chunk-boundary ve kalan bileşik hata muhasebesi; WebGL raster/device-pixel düzeyinde runtime-refined rendered error; aynı kaynak AutoCAD görüntü/ölçü oracle'ı açık kalır. F07 **IN_PROGRESS**; plan **14/19 (%74)**, **5/19 (%26)** paket açık.

### Nested affine runtime-buffer oracle'ı — 2026-09-24

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Nested/transformed CIRCLE, ARC, ELLIPSE, BULGE runtime-refined XY buffer | `worker/apply-curve-refinements.ts`, `tests/cad-v2/curve-refinement.test.ts` | 2 seviyeli INSERT altında 10 span; mirrored/non-uniform instance; apply sonrası vertex-shifted endpoint-pair slice; worker Float32 nokta eşitliği; span başına 20.001 sidecar-source örneği | **PASS —** ≤0.2 CSS px; conservative worker metric ölçümü kapsar. Nested SPLINE/HATCH, WebGL raster/device-pixel ve AutoCAD same-source oracle'ı açık. Compiler revision/cache değişmedi (v24), schema v1. |

Toplam plan **14/19 (%74)**, **5 paket (%26)** açık; F07 **IN_PROGRESS**.

### Direct/nested rational SPLINE runtime-buffer oracle'ı — 2026-09-24

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Direct ve nested non-periodic rational quadratic SPLINE post-apply XY | `worker/apply-curve-refinements.ts`, `tests/cad-v2/curve-refinement.test.ts` | 6 knot-span; mirrored/non-uniform INSERT; apply sonrası reindexed endpoint-pair extraction; worker Float32 birebirliği; span başına 20.001 rational Bezier samples | **PASS —** ≤0.2001 CSS px ve worker conservative bound kapsaması. Periodic spline/knot multiplicity, HATCH, raster/device-pixel ve AutoCAD oracle'ı açık; compiler revision/cache değişmedi (v24), schema v1. |


### Direct/nested HATCH ARC/BULGE/ELLIPSE post-apply boundary buffer oracle'ı — 2026-09-24

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| HATCH curved boundary source'larının runtime-refined renderer XY buffer'ı | worker/apply-curve-refinements.ts, tests/cad-v2/curve-refinement.test.ts | 5 direct/nested span; apply sonrası vertex-delta reindex; worker Float32 birebirliği; her affine source'a 20.001 örnek | **PASS —** ≤0.2001 CSS px; conservative worker bound ölçümü kapsar. Bu HATCH fill remesh/topology değildir. HATCH SPLINE post-apply, periodic SPLINE/knot multiplicity, spatial partition/on-demand loading, fill/glyph/chunk-boundary kalan composite accounting, WebGL raster/device-pixel ve same-source AutoCAD oracle'ları açık. Compiler/cache değişmedi (v24), schema v1. |

F07 **IN_PROGRESS**; toplam plan **14/19 (%74)**, **5 paket (%26)** açık.


### Direct/nested HATCH rational SPLINE post-apply boundary buffer oracle'ı — 2026-09-24

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| HATCH non-periodic rational SPLINE boundary'nin runtime-refined renderer XY buffer'ı | worker/apply-curve-refinements.ts, tests/cad-v2/curve-refinement.test.ts | 4 knot-span; iki direct ve bir nested mirrored/non-uniform INSERT; apply sonrası vertex-delta reindex; worker Float32 birebirliği; span başına 20.001 rational Bezier örneği | **PASS —** ≤0.2001 CSS px; conservative worker bound ölçümü kapsar. XCLIP/cap fail-closed kontrolleri mevcut testte sürer. HATCH fill remesh/topology, periodic SPLINE/knot multiplicity, spatial partition/on-demand loading, fill/glyph/chunk-boundary bileşik muhasebe, PATH_DISTANCE rendered dash, raster/device-pixel ve same-source AutoCAD oracle'ları açık. Compiler/cache değişmedi (v24), schema v1. |

F07 **IN_PROGRESS**; toplam plan **14/19 (%74)**, **5 paket (%26)** açık.

## F07 izlenebilirlik — curved-line encoded geometry composite (2026-09-24)

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Aynı curved line primitive'inde static chord sagitta + XY Float32 endpoint round-trip error | `compile/scene-compiler.ts`, `protocol/binary-protocol.ts`, `canonical/diagnostics.ts`, `version.ts` | `chunk-error-accounting.test.ts`: 1e9 origin / 1e8 radius CIRCLE; emitted segment count'undan analitik `R(1-cos(π/n))` sagitta; emitted XY + ORIGIN endpoint ölçümü; flat/index/validator/negative/conflict ve screen budget | **PASS —** ayrı terimler hedef altında, toplam hedef üstünde; diagnostic ile `degraded`. Compiler/cache v24→v25, schema v1. Yalnız statik curved-line fallback. |
| Curved HATCH boundary line chord sagitta + aynı line Float32 endpoint bileşik bound'u | `compile/geometry-compiler.ts`, `compile/entity-visitor.ts`, `compile/scene-compiler.ts`, `version.ts` | `chunk-error-accounting.test.ts`: büyük koordinat ARC semicircle; analitik `R(1-cos(π/(2n)))`; emitted XY + ORIGIN; nested two-level INSERT scale/reflection/rotation; paper viewport single-scale fixture; XCLIP-visible fragment | **PASS —** sagitta ve encoding ayrı ayrı 0.25 CSS px içinde, same-chord toplamı hedef dışında; nested bound INSERT singular scale'ini alır; viewport ölçeği bir kez eklenir; XCLIP source bound'u taşınmaz. Compiler/cache v25→v26, schema v1. Fill TRIANGLES/remesh kapsam dışı. |

## F07 izlenebilirlik — non-periodic rational SPLINE knot multiplicity oracle'ı (2026-09-24)

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Pozitif ağırlıklı non-periodic rational SPLINE: degree-2 iç knot çoklukları 1/2; degree-3 çoklukları 1/2/3; degree-4 çoklukları 1/2/3/4; degree-5 çoklukları 1/2/3/4/5 | `tests/cad-v2/precision-refinement.test.ts`: `testSplineInternalKnotMultiplicityAgainstIndependentDeBoorOracle` | 14 sentetik profil; bağımsız homojen De Boor evaluator; profil başına 20.001, toplam 280.014 kaynak örneği; iç knot noktalarının emitted polyline'da tutulması | **PASS —** kaynak-polyline sapması ≤0.03 world unit ve raporlanan `maxSagittaWorld`. Diğer degree/knot profilleri, periodic SPLINE AutoCAD fixture/desteği ve evaluator kıyası açık. Yalnız test değişti; compiler/cache v26, schema v1. |
| Nested mirrored/non-uniform LWPOLYLINE BULGE same-chord sagitta + XY Float32 endpoint composite | `compile/entity-visitor.ts`, `compile/scene-compiler.ts`, `tests/cad-v2/chunk-error-accounting.test.ts`: `testNestedBulgeTessellationErrorIncludesInsertTransforms` | İki seviyeli 8× affine INSERT; chord başına analytic transformed endpoint ↔ serialized `ORIGIN + XY` round-trip ölçümü; per-chord sagitta + endpoint maksimumu; 20.001 source sample, CSS/world, cap, XCLIP, flat/index validator | **PASS —** per-chord maximum `maxCurveEncodedGeometryErrorWorld/CssPixels` manifest ile eşleşir; test-only, compiler/cache v26 ve schema v1 sabit. Bu tek continuous widthless BULGE chord familyasıdır; residual cross-source/chunk/fill/glyph/runtime composite açık. |
| Nested non-uniform INSERT cubic SPLINE same-chord sagitta + XY Float32 endpoint composite | `compile/entity-visitor.ts`, `compile/scene-compiler.ts`, `tests/cad-v2/chunk-error-accounting.test.ts`: `testNestedSplineTessellationErrorIncludesInsertTransforms` | İki seviyeli 8× affine; source parameter aralıklarında cubic Bernstein endpoint ve türev oracle'ı; subcurve control-hull sagitta; chord başına serialized `ORIGIN + XY` endpoint error; CSS/world, cap, XCLIP | **PASS —** control-hull sagitta + aynı chord endpoint loss maksimumu manifest composite world/CSS ile eşleşir. Test-only; revision v26/schema v1 sabit. Periodic/AutoCAD SPLINE, other-source/chunk/fill/glyph ve rendered-pixel composite'leri açık. |
| Direct top-level ELLIPSE same-chord sagitta + XY Float32 endpoint composite | `tests/cad-v2/chunk-error-accounting.test.ts`: `testEllipseCurveTessellationErrorIsMeasuredAndBudgeted` | Analitik uniform interval sayısı ve `|majorVector| × Δt² / 8`; chord başına exact ellipse endpoints ↔ serialized `ORIGIN + XY`; target yakınındaki ayrı-term-fit / sum-overrun; CSS/world, cap, flat/index validator | **PASS —** en büyük analytic sagitta + aynı chord endpoint round-trip loss manifest/hash-index world/CSS composite ile eşleşir ve target aşımında degraded diagnostic üretir. Test-only; compiler/cache v26/schema v1 sabit. Nested ELLIPSE ve kalan composite/görsel kapıları açık. |
| Nested non-uniform INSERT ELLIPSE same-chord sagitta + XY Float32 endpoint composite | `compile/entity-visitor.ts`, `compile/scene-compiler.ts`, `tests/cad-v2/chunk-error-accounting.test.ts`: `testNestedEllipseTessellationErrorIncludesInsertTransforms` | İki seviyeli 8× singular value; analitik interval/endpoints ve chord başına serialized `ORIGIN + XY`; world/CSS, flat/index, budget diagnostic, paper viewport 0.15 ve partial XCLIP | **PASS —** world sagitta birleşik INSERT ölçeğiyle büyütülür, paper viewport bir kez uygulanır, same-chord composite manifest/hash-index ile eşleşir; XCLIP parçası kaynak bound'u taşımaz. Revision v26→v27, schema v1. Yalnız bu nested profil kapanır. |
| Döndürülmüş TEXT glyph stroke uç noktalarının Float32 XY nicemleme hata muhasebesi | `tests/cad-v2/chunk-error-accounting.test.ts`: `testTextGlyphEndpointsContributeToEncodedQuantizationBudget`; mevcut genel `scene-compiler.ts` vertex quantization lane'i | Türkçe glyph içeren, döndürülmüş/yüksek koordinatlı TEXT; `FontLayoutEngine` source stroke uçları; bağımsız bbox midpoint + `Math.fround` endpoint round-trip hesabı; flat/index/validator ve CSS bütçe/degraded kontrolü | **PASS —** bütün glyph stroke endpoint round-trip maksimumu chunk `maxQuantizationErrorWorld/CssPixels` alanıyla eşleşir ve hedef aşımında mevcut tanı kaliteyi degraded yapar. Yalnız encoding muhasebesi; glyph outline/AutoCAD şekil paritesi veya runtime refinement değildir. Test-only; compiler/cache v27 ve schema v1 sabit. |

HATCH fill runtime remesh/topology, glyph outline/refinement ve cross-primitive/chunk-boundary composite terms, visible PATH_DISTANCE dash, GPU raster/device-pixel ve same-source AutoCAD oracle'ı açık kalır. F07 **IN_PROGRESS**; plan **14/19 (%74)**, **5 paket (%26)** açık.

## F07 açık kapı yeniden kontrolü — 2026-09-24

| Kapı | Mevcut kod/test kanıtı | Durum |
|---|---|---|
| Periodic SPLINE + knot/AutoCAD oracle | Periodic spline testinde fail-closed/empty output; 14 degree-2–5 knot profili synthetic non-periodic. AutoCAD-authored periodic fixture ve evaluator karşılaştırması yok. | **OPEN** |
| HATCH runtime fill remesh/topology | `curve-refinement.test.ts` HATCH ARC/BULGE/ELLIPSE/SPLINE boundary output'larını ölçer; fill TRIANGLES compiler'da üretilir, worker fill remesh/topology kabul testi yok. | **OPEN** |
| Bounded spatial partition / camera-driven on-demand fetch | Manifest chunk bbox, renderer camera culling ve sınırlı scheduler/LRU kodu/testi mevcut; fakat `SpatialChunkScheduler` host akışında çağrılmıyor. `CadV2HostShell` başlangıçta bütün chunk'ları indiriyor; yalnız concurrency sınırı uygulanıyor. | **OPEN —** mevcut bbox/culling ve scheduler unit kapsamı F07 runtime refinement için on-demand fetch kanıtı değildir. |
| Kalan composite error | CIRCLE, curved HATCH boundary, direct/nested ELLIPSE, nested BULGE/SPLINE seçili same-chord kontrolleri; TEXT glyph endpoint quantization için dar oracle var. Cross-source/chunk, fill ve glyph outline/refinement toplamları hâlâ kapsanmıyor. | **OPEN** |
| Runtime-refined rendered error | Uygulanmış worker buffer için CPU/CSS projection bound testleri var; WebGL raster/anti-alias/device-pixel ölçümü yok. | **OPEN** |
| Same-source AutoCAD visual/measurement | F07 acceptance testlerinde eşleşen AutoCAD kaynak dosyası üzerinde görüntü/ölçü kıyası yok. | **OPEN** |

Doğrudan ELLIPSE checkpoint'i test-only idi; sonraki nested ELLIPSE v27 checkpoint'i compiler/cache metadata'sını değiştirdi. Nested ELLIPSE için yalnız belirtilen 8× INSERT/paper/XCLIP profili ölçülmüştür. F07 **IN_PROGRESS** ve toplam plan **14/19 (%74)**, **5/19 (%26)** paket açık kalır.

## F07 izlenebilirlik — TEXT glyph endpoint encoding (2026-09-24)

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Gerçek TEXT glyph stroke uçlarının Float32 endpoint nicemleme hatası | `compile/scene-compiler.ts` mevcut genel XY quantization metriği; `tests/cad-v2/chunk-error-accounting.test.ts`: `testTextGlyphEndpointsContributeToEncodedQuantizationBudget` | Döndürülmüş/yüksek koordinatlı Türkçe TEXT; FontLayoutEngine source endpoints; bağımsız bounds midpoint + `Math.fround`; flat/index/validator, CSS budget ve degraded diagnostic | **PASS —** endpoint maksimumu `maxQuantizationErrorWorld/CssPixels` ile eşleşir. Yalnız encoding; font outline, runtime glyph refinement ve cross-chunk bileşik hata açık. Test-only, revision v27/schema v1 sabit. |

F07 açık kapı güncellemesi: glyph stroke endpoint encoding muhasebesi için bağımsız test eklendi; glyph outline/AutoCAD eşdeğerliği, MTEXT/dimension varyantları, runtime refinement ve chunk-boundary kompozisyonu hâlâ kanıtlanmadı. Diğer açık kapılar: periodic SPLINE AutoCAD fixture/knot oracle'ı, HATCH fill runtime remesh/topology, host'a bağlı on-demand partition/fetch, kalan fill/glyph/chunk composite'leri, visible dash, WebGL raster/device-pixel ve same-source AutoCAD ölçü/görüntü.

### 2026-09-24 — Tek kaynak ARC'ın chunk seam hata zarfı

- **Dar kabul:** Ardışık aynı-kaynak circular ARC chord'ları ayrı chunk'lardadır; analitik endpoint/sagitta ve Float64 ORIGIN + Float32 XY decode hataları, ortak kaynak vertex'teki seam gap'i, manifest/hash-index/validator aktarımı. **Oracle:** testCurveEndpointRoundTripSeamIsBoundedAcrossChunks; compile/scene-compiler.ts içindeki mevcut tessellation ve composite alanları. **Sonuç: PASS** — seam iki komşu endpoint hata toplamı ve komşu local composite sınırları içinde. Genel chunk boundary/cross-source/clip/fill/glyph muhasebesi açık; test-only, revision v27/schema v1 sabit. F07 IN_PROGRESS, plan 14/19 (%74), 5/19 (%26) açık.

### 2026-09-24 — farklı LINE kaynaklarının chunk seam hata zarfı

Dar kabul: 1e9 koordinatlarında tam ortak vertex paylaşan iki ayrı LINE kaynağı ayrı chunk'lara derlenir. Oracle: testCrossSourceLineSeamIsBoundedAcrossChunks; chunk-local bounds midpoint, Float32 offset, decode endpoint round-trip ve CSS ölçeği bağımsız ölçülür. Sonuç: PASS — ölçülen seam gap iki ortak endpoint hata toplamı ve adjacent generic chunk quantization toplamı içinde; index/manifest aktarımı kontrol edilir. Kapsam iki LINE ile sınırlıdır; line-curve, clipping, fill/glyph ve genel chunk boundary composite'leri açık. Test-only, revision v27/schema v1 sabit; F07 IN_PROGRESS, plan 14/19 (%74), 5/19 (%26) açık.

### 2026-09-24 — LINE→ARC farklı kaynak seam ve ilk chord composite'i

Dar kabul: bir LINE kaynağının tam uç noktası ayrı ARC kaynağının analitik başlangıcıdır; her biri bağımsız chunk origin'iyle kodlanır. Oracle: testLineToArcSourceSeamIsBoundedAcrossChunks; local midpoint ORIGIN ve Float32 endpoint'leri bağımsız tekrar hesaplanır, seam boşluğu iki endpoint hatasıyla ölçülür, ilk ARC chord sagitta + endpoint composite'i world/CSS alanlarıyla eşleştirilir. Sonuç: PASS — seam endpoint envelope ve komşu local hata sınırları içinde; hash-index composite ve manifest dizisi doğrulanır. Yalnız bu tek yönlü LINE→ARC profili; genel cross-source/chunk, clip/fill/glyph ve diğer curve birleşimleri açık. Test-only, revision v27/schema v1 sabit; F07 IN_PROGRESS, plan 14/19 (%74), 5/19 (%26) açık.


### 2026-09-24 — WebGL'de önceden tessellate edilmiş dash görünürlüğü

Dar kabul: synthetic DV2SCN01 fixture'ının XY bölümüne kodlanmış beş kırmızı stroke ve dört boşluğun gerçek WebGL canvas screenshot'ında piksel örneklemesi. Oracle: pre-tessellated DASHED segments appear as alternating strokes and gaps in the WebGL frame; sonuç tam 5 kırmızı aralık, 4 boşluk ve minimum 8 px üstü gap — PASS. Binary fixture beklenen PATH_DISTANCE lane'ini korur, fakat mevcut renderer lane'i okumaz; bu nedenle dash phase/PATH_DISTANCE shader tüketimi veya compiler-to-renderer uçtan uca dash kabulü değildir. Hedefli Chromium 1/1, unit, UI/Chromium 3/3, runtime typecheck ve diff-check PASS; worker bundle hash'leri koruma kopyalarıyla aynı. Test-only, revision v27/schema v1 sabit. Runtime-refined device-pixel ve AutoCAD same-source oracle'ları ile diğer F07 kapıları açık; F07 IN_PROGRESS, plan 14/19 (%74), 5/19 (%26) açık.

### 2026-09-24 — gerçek compiler DASHED chunk'ının WebGL görünürlüğü

Dar kabul: canonical LINE ve özel [24,-16] dash pattern'i compileCanonicalToScene ile derlenir; gerçek compiler manifest/chunk'ı test browser'ına sunulur. Oracle, PATH_DISTANCE'ın beklenen 0/24/40/.../184 kümülatif değerlerini ve screenshot'taki beş kırmızı aralık/dört boşluğu doğrular. Sonuç: PASS — compiler-generated tessellated dash geometry Chromium WebGL pikselinde görünür. Renderer PATH_DISTANCE lane'ini tüketmiyor; shader lane/faz hesaplaması, runtime refine sırasında faz kararlılığı ve chunk seam sürekliliği bu dar oracle'ın dışında. Hedefli Chromium 1/1, unit, UI/Chromium 3/3, runtime typecheck ve diff-check PASS; child compiler timeout-bounded, worker hash'leri değişmedi. Test-only, compiler/cache v27/schema v1 sabit. F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) açık.


## 2026-09-24 — F07 compiled DASHED chunk partition evidence

Evidence: `tests/cad-v2/f07-dash-render-scene.ts` compiles one canonical DASHED source into single-chunk and five-chunk manifests/binaries; `tests/document-studio/cad-v2-layout-viewport.spec.ts` serves both to Chromium and compares actual WebGL canvas pixels. The test checks `[0,24,40,64,80,104,120,144,160,184]` path distances, five red dash runs/four gaps in both scenes, and identical full canvas PNG SHA-256 plus run/gap intervals. Targeted 1/1 and full UI 3/3 passed; full unit, runtime typecheck, and diff-check also passed. This evidence supports only pre-tessellated LINE visibility under this tested chunk split. It does not support PATH_DISTANCE shader use, general phase behavior, runtime-refined pixel error, or AutoCAD parity. Test-only: revision v27/schema v1.

The plan remains 14/19 (74%), with 5/19 (26%) packages open. Periodic SPLINE fixture/evaluator and knot parity, HATCH fill runtime remesh/topology, host-integrated bounded/on-demand chunks, residual fill/glyph/chunk-boundary composites, PATH_DISTANCE GPU consumption, refined WebGL/device-pixel error, and same-source AutoCAD visual/measurement evidence remain unclosed.


## 2026-09-24 — direct LINE / nested BULGE source-seam evidence

Evidence: `testLineToNestedBulgeSourceSeamIsBoundedAcrossChunks` in `tests/cad-v2/chunk-error-accounting.test.ts`. It compiles a direct LINE joined exactly to a BULGE inside two INSERT levels with reflection/non-uniform scale and rotation; every primitive has a separate chunk origin. Its independent circle/affine oracle checks the transformed sagitta, each serialized Float32 endpoint loss, every chunk's world/CSS same-chord composite, and 20,001 transformed source samples. The actual decoded seam must fit both measured endpoint errors and adjacent chunk/composite bounds. Hash-index and manifest validation also retain the values. Targeted test, full CAD V2 unit, UI/Chromium 3/3, runtime typecheck, and diff-check passed. Scope is this one forward join profile; it does not close general chunk seams, fill/glyph boundaries, runtime WebGL pixel error, or AutoCAD parity. Test-only, revision v27/schema v1 unchanged.

F07 remains 14/19 (74%) with 5/19 (26%) packages open. Periodic SPLINE fixture/evaluator and periodic knot parity, HATCH runtime fill remesh/topology, host-integrated bounded/on-demand chunks, residual fill/glyph/chunk composites, PATH_DISTANCE shader consumption, runtime-refined device-pixel error, and same-source AutoCAD visual/measurement evidence remain unclosed.

## 2026-09-24 — ARC→LINE cross-source chunk seam

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| ARC'ın ardından gelen, ARC'ın analitik son vertex'inden başlayan ayrı LINE kaynağında chunk seam | tests/cad-v2/chunk-error-accounting.test.ts: testArcToLineSourceSeamIsBoundedAcrossChunks; production compiler değişmedi | Her chord/LINE için bağımsız local bounds midpoint + Float32 offset, decode endpoint hataları, son-chord circular sagitta + endpoint composite, world/CSS, hash-index ve manifest validator | PASS — ölçülen seam ortak uç kaybı ve adjacent chunk/composite sınırları içinde. Targeted/full unit, runtime typecheck, UI Chromium 3/3 ve diff-check geçti. Test-only; revision v27/schema v1 sabit. Genel cross-source/chunk, fill/glyph, runtime raster ve AutoCAD kapıları açık. |

F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) paket açık. Periodic SPLINE AutoCAD fixture/knot oracle'ı, HATCH fill remesh/topology, host on-demand partition, kalan bileşik hata, PATH_DISTANCE shader tüketimi, runtime-refined device-pixel ve same-source AutoCAD visual/measurement kapıları açık.

## 2026-09-24 — nested BULGE→LINE reverse seam

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| İki seviyeli mirrored/non-uniform INSERT altındaki BULGE'nin son chord'u ile sonraki top-level LINE arasında chunk sınırı | tests/cad-v2/chunk-error-accounting.test.ts: testNestedBulgeToLineSourceSeamIsBoundedAcrossChunks | Bağımsız semicircle endpoint/sagitta ve 8× affine oracle; chunk midpoint ORIGIN + Float32 round-trip; son chord composite; measured seam endpoint envelope; CSS/world, hash-index, manifest validation | PASS — ölçülen seam, ortak endpoint kayıpları ve komşu chunk/composite bound'ları içinde. Hedefli accounting, full unit, runtime typecheck, UI Chromium 3/3 ve diff-check geçti. Test-only; compiler/cache v27/schema v1 sabit. Yalnız bu ters yönlü nested profile; genel chunk/fill/glyph/raster/AutoCAD kapıları açık. |

F07 IN_PROGRESS, plan 14/19 (%74), 5/19 (%26) paket açık. Periodic SPLINE AutoCAD/evaluator/knot, HATCH fill remesh/topology, host on-demand partition, kalan fill/glyph/chunk-boundary composite'leri, PATH_DISTANCE shader, runtime rendered device-pixel ve same-source AutoCAD ölçü/görüntü kabul kapıları açık.


## 2026-09-24 — runtime-refined WebGL pixel-distance oracle

- Dar kabul: Idle refinement hedefi 0.25 CSS px'e geldiğinde gerçek CAD V2 WebGL canvas'ındaki quarter-circle rasterının kaynak yayla iki yönlü uzaklığı.
- Bağımsız oracle: Chromium screenshot'ından 494 renkli piksel merkezi; fit kamera üzerinden analitik yay izdüşümü; rendered→source maksimumu 0.9677 CSS px. Her 0.5 CSS px'te örneklenen kaynak yay→rendered maksimumu 0.7497 CSS px. Her ikisi 0.25 px refinement + 1 px raster payı = 1.25 CSS px altında.
- Doğrulama: Hedefli Chromium 1/1, tam CAD V2 unit, UI/Chromium 3/3, runtime typecheck ve git diff --check PASS; worker SHA-256 değerleri aynı. Test-only, compiler/cache v27 ve schema v1 değişmedi.
- Sınır: Bir quarter-circle ve 1280×672 Chromium canvas profili. Genel geometri/zoom/DPR/device rendered hata, fill/glyph/chunk composite'leri ve AutoCAD parity açık. F07 IN_PROGRESS, 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-24 — centered 125% runtime-rendered error profili

- Dar kabul: Önceki fit-camera screenshot ölçümüne ek olarak 125% UI zoom'da aynı quarter-circle'in gerçek WebGL raster/kaynak uzaklığı.
- Refinement: Zoom sonrası worker transient hedef 0.75 CSS px'i, ardından idle hedef 0.25 CSS px'i yanıtları teslim edilerek tamamlar. Kamera ölçeği UI 125% ve bağımsız fit U/1.25 ile kontrol edilir.
- Oracle: 610 renkli piksel; maksimum render→source uzaklığı 0.9612 CSS px, 0.5 px aralıklı source→render maksimumu 0.7642 CSS px. Her ikisi 1.25 px sınırında. Fit profiliyle beraber iki centered scale geçmiştir.
- Kontroller: Hedefli Chromium 1/1, full CAD V2 unit, UI/Chromium 3/3, runtime typecheck, diff-check PASS; worker hash'leri aynı. Test-only, v27/schema v1.
- Sınır: Higher zoom, pan camera, DPR/device, geometry/fill/glyph/chunk çeşitleri ve AutoCAD oracle'ı açık; diğer F07 gate'leri açık. F07 IN_PROGRESS, plan 14/19 (74%), 5/19 (26%) açık.


## 2026-09-24 — centered 80% runtime-refined raster profile

- Dar kabul: Mevcut gerçek WebGL quarter-circle screenshot oracle'ını centered 80% zoom-out ölçeğinde tekrarla.
- Refinement/oracle: UI 80%; transient 0.75 ve idle 0.25 CSS px yanıtları teslim edilir, bounded quiet/drain döngüsü sonrası screenshot. Bağımsız u=fitU/0.8=0.2055921053 world/CSS px.
- Ölçüm: 399 piksel; render→source maksimum 0.9819 CSS px, 0.5 CSS px aralıklı source→render maksimum 0.7193 CSS px. 1.25 CSS px eşiğinin altında. Üç centered profil: fit 494 px 0.9677/0.7497, 80% 399 px 0.9819/0.7193, 125% 610 px 0.9612/0.7642 (render→source/source→render).
- Kontroller: Hedefli Chromium 1/1, tam CAD V2 unit, UI/Chromium 3/3, runtime typecheck ve diff-check PASS; worker hash'leri aynı. Test-only; compiler/cache v27 ve schema v1 sabit.
- Sınır/açık kapılar: Tek sentetik quarter-circle, üç centered zoom, tek Chromium raster context. Higher zoom, pan, DPR/device, entity/fill/glyph/chunk çeşitleri, genel rendered hata ve AutoCAD same-source oracle'ı açık. Periodic SPLINE AutoCAD/evaluator/knot multiplicity, HATCH runtime remesh/topology, host bounded/on-demand partition/chunk yükleme, kalan composite error ve shader PATH_DISTANCE tüketimi açık. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-24 — translated 125% runtime-refined raster profile

- Dar kabul: Mevcut iki yönlü WebGL arc oracle'ını aynı idle 125% camera bucket'ında kontrollü pan sonrasında ölç.
- Kamera/oracle: Pointer drag +48,+24 CSS px; D3 dönüşümü aynı screen-space translation'ı verir. u=0.1315789474 world/CSS px korunur; held worker response yok ve idle hedef 0.25 CSS px quiet interval boyunca sabit kalır.
- Ölçüm: 610 pixel bbox centered [640,31]-[944,335] konumundan [688,55]-[992,359] konumuna taşındı. Render→source maksimum 0.9612 CSS px; source→render maksimum 0.7642 CSS px; eşik 1.25 CSS px.
- Kontroller: Hedefli Chromium 1/1, tam CAD V2 unit, UI/Chromium 3/3, runtime typecheck ve git diff --check PASS. DWG ve scene worker hash'leri koruma kopyalarıyla eşleşti. Test/evidence aşaması; compiler/cache v27, schema v1.
- Sınır/açık kapılar: Tek sentetik arc, pan offset'i, 125% ve Chromium bağlamı. Genel pan/zoom/DPR/device, diğer geometri/fill/glyph/chunk bileşikleri ve AutoCAD same-source oracle açık. Periodic SPLINE AutoCAD/evaluator/knot multiplicity, HATCH runtime remesh/topology, host bounded/on-demand chunks, kalan composite accounting ve PATH_DISTANCE shader tüketimi açık. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-24 — 195% pan edilmiş runtime ARC raster kabul kanıtı

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Idle refinement sonrasında yüksek zoom ve pan'de WebGL ARC raster hatası | tests/document-studio/cad-v2-layout-viewport.spec.ts, mevcut Chromium senaryosu | D3 (811,421.5,11.875), u=0.0842105263 world/CSS px; pan +171,+85.5. Görünür analitik yay [0.1591116695,1.0916057806]. 622 piksel: render→source 1.0113 px, visible source→render 0.7581 px; sınır 1.25 px. Idle .25 px, held response 0, max vertex 46. | PASS — yalnız sentetik quarter-circle / panned 195% / Chromium. Targeted Chromium 1/1, full unit, UI Chromium 3/3, runtime typecheck, diff-check. Test-only; worker hash'leri aynı, compiler/cache v27, schema v1. Genel rendered-error veya AutoCAD oracle'ı değildir. |

F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) açık paket. Periodic SPLINE AutoCAD fixture/evaluator/knot parity, HATCH runtime remesh/topology, host bounded spatial partition/on-demand chunking, fill/glyph/chunk-boundary ve diğer composite hata muhasebesi, shader PATH_DISTANCE, farklı geometri/zoom/pan/DPR profilleri ve aynı-kaynak AutoCAD visual/measurement oracle'ı açık.

## 2026-09-24 — runtime-refined raster DPR2 profili

- Dar kabul: Aynı bağımsız quarter-circle/WebGL oracle'ında gerçek Chromium `deviceScaleFactor=2` bağlamı.
- Kamera/refinement: Centered fit, `unitsPerCssPixel=0.1644736842`; CSS canvas 1280×672, DPR=2 drawing buffer 2560×1344. Worker hedefleri `[0.75,0.25]` CSS px; 2 refinement yanıtı, quiet snapshot sabit, `maxLineVertexCount=34`.
- Bağımsız raster ölçümü: Device-resolution screenshot'ta 981 seçili piksel; render→tam analitik yay maksimumu 0.6157362894 CSS px, kaynak→render maksimumu 0.4750552899 CSS px; kabul zarfı 1.25 CSS px.
- Doğrulama: `npm run check:cad-v2:unit` PASS; `npm run check:cad-v2:ui` Chromium **4/4 PASS**; `npx tsc --noEmit -p tsconfig.next.json --incremental false` ve `git diff --check` PASS. Worker SHA-256'ları koşu öncesi/sonrası aynı; compiler/cache v27, schema v1.
- Sınır: Tek sentetik ARC, centered fit ve DPR2. Farklı geometri, pan-at-DPR2 ve çeşitli cihaz/raster bağlamlarıyla genel runtime hata kapısı hâlâ **OPEN**. Periodic SPLINE AutoCAD/evaluator/knot, HATCH fill remesh/topology, host bounded/on-demand chunks, kalan fill/glyph/chunk composite'leri, shader `PATH_DISTANCE` ve same-source AutoCAD görsel/ölçü kapısı **OPEN**. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) paket açık.

## 2026-09-24 — F07 ELLIPSE runtime raster alt-kabulü

| Alan | Kanıt |
|---|---|
| Profil | Sentetik ELLIPSE U=(40,0), V=(0,24), [0,π/2]; gerçek host/worker/refined XY/WebGL; DPR1 fit 1280×672; 0.1644736842 world/CSS px. |
| Refinement | 0.75→0.25 CSS px, 2 yanıt, quiet snapshot, max 34 line vertex. |
| Oracle | 4097 parametrik örnek, 378 piksel; render→source 0.9825281925 px, source→render 0.7467465149 px; eşik 1.25 px. |
| Kontroller | İlgili iki unit, Chromium 1/1, tam UI Chromium 5/5, runtime typecheck/diff-check PASS. Son retry C: ENOSPC nedeniyle sonuçsuz. |
| Kimlik/sınır | Worker hash aynı, v27/schema v1. Full unit, mevcut P05/P06 evidence JSON yazma yan etkisi nedeniyle tekrarlanmadı. |

Tek geometri/profil; genel rendered-error ve AutoCAD oracle'ı açık. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) paket açık.
D-backed retry'ler test başlamadan durdu: ilkinde npm cache C: üzerindeydi; ikincisinde scripts/sync-cad-upstream-assets.mjs:61 C: diskinde ENOSPC verdi. Yeni D: çıktıları korundu.

### 2026-09-25 — rendered-error iz profili: DPR2 fit + pan

| Bağlam | Kamera | Raster | Worker durumu | Render→kaynak | Kaynak→render |
|---|---|---:|---|---:|---:|
| ARC, Chromium WebGL, DPR2 | fit, pan (+48,+24) CSS px; D3 (640,336,6.08) → (688,360,6.08) | 1280×672 CSS; 2560×1344 px; 981 seçili piksel | 0.75→0.25 CSS px; 2 yanıt; sessiz; 34 max line vertex | 0.6157362894 CSS px | 0.4750552899 CSS px |

İki yönlü bağımsız analitik quarter-circle raster oracle'ı 1.25 CSS px bütçesinin altında. Üç ilgili unit (`curve-refinement`, `precision-refinement`, `layout-viewport`), tam Chromium viewport dosyası 5/5, runtime typecheck ve diff-check geçti. Test-only; compiler/cache v27 ve DV2SCN01 v1, scene/DWG worker hash'leri değişmedi.

Bu iz yalnız bir geometri, fit zoom, sabit pan vektörü ve Chromium DPR2 içindir. F07 rendered-error genellemesi AÇIK/PARTIAL; periodic SPLINE AutoCAD/knot, HATCH remesh/topology, host bounded/on-demand chunks, fill/glyph/chunk bileşikleri, shader `PATH_DISTANCE` ve aynı-kaynak AutoCAD görsel/ölçü kapıları AÇIK; AutoCAD oracle'ı NOT_RUN. F07 14/19 (%74), 5/19 (%26) açık.
### 2026-09-25 — ELLIPSE runtime raster iz profili (DPR2 pan)

| Kaynak/oracle | Kamera | CSS / device raster | Refinement | Piksel sayısı | Render→kaynak | Kaynak→render |
|---|---|---|---|---:|---:|---:|
| Sentetik ELLIPSE, 4097 parametrik kaynak örneği | DPR2 fit, pan (+48,+24); D3 (640,336,6.08) → (688,360,6.08) | 1280×672 / 2560×1344 | 0.75→0.25 CSS px, 2 yanıt, sessiz, 34 max line vertex | 759 | 0.6081436225 CSS px | 0.4231605551 CSS px |

Bağımsız parametrik oracle iki yönü de 1.25 CSS px zarfında ölçtü; pan merkezini D3 dönüşüm farkıyla doğruladı. Üç ilgili unit, tam Chromium dosyası 6/6, runtime typecheck ve diff-check geçti. Test-only; compiler/cache v27, DV2SCN01 v1 ve iki worker hash'i değişmedi.

Rendered-error hâlâ kısmi: ARC ve ELLIPSE DPR2 fit/+48,+24 pan profilleri eklendi; tam geometri/zoom/pan/DPR/device matrisi yok. Periodic SPLINE AutoCAD/knot, HATCH runtime topology, host bounded/on-demand chunk, fill/glyph/chunk composite, shader `PATH_DISTANCE` ve same-source AutoCAD görsel/ölçü kapıları OPEN; AutoCAD oracle'ı NOT_RUN. F07 IN_PROGRESS, 14/19 (%74), 5/19 (%26) açık.
## 2026-09-25 — DPR2 ELLIPSE 125% ikinci pan: ölçüm ve açık kapı denetimi

| Profil | D3 kamera | Raster | Worker | Bağımsız parametrik oracle |
|---|---|---|---|---|
| 40×24 ELLIPSE, Chromium WebGL, DPR2, 125% | fit-pan (688,360,k=6.08) → zoom (700,366,k=7.6) → ikinci +48,+24 pan (748,390,k=7.6); net (+108,+54) CSS px | 1280×672 CSS; 2560×1344 device; 940 piksel | [0.75,0.25,0.75,0.25], 4 yanıt, quiet, 40 max line vertex | 4097 kaynak örneği; u=0.1315789474 world/CSS px; render→kaynak 0.5931555545 px, kaynak→render 0.4141058575 px (≤1.25) |

tests/document-studio/cad-v2-layout-viewport.spec.ts içindeki DPR2 ELLIPSE kabul senaryosu aynı testi fit-pan, merkezden 125% yakınlaştırma ve ikinci pan sırasıyla çalıştırır. Hedefli senaryo 1/1; dosyanın tüm Chromium senaryoları 6/6; curve-refinement, precision-refinement, layout-viewport unit'leri; runtime tsc --noEmit -p tsconfig.next.json --incremental false; git diff --check başarılıdır. Çıktılar D:\codex-cad-v2-f07-ellipse-pan-dpr2-125-20260925 altında saklandı; Next dev cache’i C: üzerinde yeni ve benzersiz dizindedir. Test/helper only; compiler/cache v27, DV2SCN01 v1 ve ölçülen scene/DWG worker hash'leri değişmedi.

### F07 kapıları — güncel kaynak/test taraması

| Kapı | Doğrulanan repo durumu | Kabul durumu |
|---|---|---|
| Periodic SPLINE AutoCAD fixture/desteği ve knot oracle | DXF/DWG adapter isPeriodic bilgisini taşır; geometry compiler periodic profili reddeder; precision testinde periodic giriş boş/fail-closed. De Boor knot oracle'ı sentetik non-periodic degree 2–5 profilleridir; AutoCAD periodic fixture yok. | AÇIK |
| HATCH runtime remesh/topology | HATCH curved-boundary sidecar testi çizgi XY buffer'ını ölçer; runtime fill remesh/topology testi veya runtime remesh yolu bulunmadı. Fill TRIANGLES statik compiler kapsamındadır. | AÇIK |
| Bounded spatial partition/on-demand chunk | Scheduler cache modülü ve unit'i var; host-shell scheduler'ı çağırmıyor. Host manifestteki chunk listesi üzerinde concurrency 6 fetch döngüsü çalıştırıyor. | AÇIK |
| Fill/glyph/chunk-boundary/kalan composite | Seçilmiş chord, encoded endpoint, glyph endpoint ve source-seam terimleri için dar testler var; fill TRIANGLES, glyph outline/refinement ve bütün çapraz chunk/fill etkileşimlerinin ortak muhasebesi yok. | AÇIK |
| Shader PATH_DISTANCE | Scene worker PATH_DISTANCE bölümünü decode/transfer ediyor; cad-v2-renderer içinde PATH_DISTANCE tüketicisi yok. | AÇIK |
| Geometri/zoom/pan/DPR/device rendered-error | ARC ve ELLIPSE için seçilmiş Chromium profilleri iki yönlü ölçüldü; bu belgeye eklenen profil ELLIPSE DPR2/125%/iki pan adımıdır. Genel geometri ve device matrisi tam değildir. | PARTIAL / AÇIK |
| Aynı-kaynak AutoCAD görüntü/ölçü oracle'ı | F07 browser raster testlerinde eş kaynak AutoCAD görüntüsü/ölçüsüyle eşleştirilmiş oracle yok. | AÇIK / NOT_RUN |

Plan 14/19 (%74), 5/19 (%26) paket açık; F07 IN_PROGRESS.
Güncel runtime raster profili envanteri: ARC — DPR1 fit/80%/125%, panned DPR1 125%/195%, ayrıca DPR2 fit ve +48,+24 pan; ELLIPSE — DPR1 fit, DPR2 fit kamera sonrası +48,+24 pan, DPR2 125% ve iki pan adımı. Önceki DPR2 pan eksikliği notları bu ek ölçümden önceki checkpoint'leri anlatır. Farklı geometri ve device bağlamlarının bütünü ölçülmediğinden genel kabul PARTIAL/AÇIK'tır.
## 2026-09-25 — ELLIPSE DPR2 80% panlı kamera raster ölçümü

| Profil | Kamera ve pan | Raster/oracle | Refined rendered-error |
|---|---|---|---|
| ELLIPSE, Chromium WebGL, DPR2, 80% | 125% panlı kamera (748,390,k=7.6) → merkezden 100% → 80%; son kamera (709.12,370.56,k=4.864), taşınmış net ofset (+69.12,+34.56) CSS px | 1280×672 CSS / 2560×1344 device; 4097 analitik kaynak örneği, 620 seçili piksel; u=0.2055921053 world/CSS px | render→kaynak 0.5127801495 CSS px; kaynak→render 0.3767122232 CSS px; ≤1.25 |

80% profili, mevcut +108,+54 panın merkez-ankorlu zoom ile ölçeklenmesini test eder; 80% noktasında ayrıca pointer drag uygulanmadı. 80% UI durumu, kamera ölçeği/ötelemesi, değişmiş canvas frame'i ve son idle refinement doğrulandı. Worker target listesi altı öğe [0.75,0.25] tekrarıdır; 6 yanıt, quiet ve maxLineVertexCount=40.

Hedefli Chromium 1/1, dosya Chromium 6/6, üç ilgili unit ve runtime typecheck PASS; git diff --check PASS. Yalnız test/helper değişti, C: yeni cache ve D: yeni/korunmuş test çıktıları kullanıldı; v27/schema v1 ve iki worker hash'i sabit.

Güncel F07 kapıları hâlâ açıktır: periodic SPLINE AutoCAD fixture/knot oracle; HATCH runtime remesh/topology; host'a bağlı bounded partition/on-demand fetch; fill/glyph/chunk-boundary kalan composite; shader PATH_DISTANCE; tam rendered-error geometry/zoom/pan/DPR/device matrisi (PARTIAL); aynı-kaynak AutoCAD görsel/ölçü oracle'ı (NOT_RUN). Nested BULGE seam/same-chord alt-oracle'ları zaten var ve bu turda yinelenmedi. Plan 14/19 (%74), 5/19 (%26) açık; F07 IN_PROGRESS.
## 2026-09-25 — DPR2 ELLIPSE 156% rendered-error ölçümü

| Profil | Kamera | Raster ve kaynak oracle'ı | Sonuç |
|---|---|---|---|
| ELLIPSE, Chromium WebGL, DPR2, 156% | 80% taşınmış kameradan merkez-ankorlu zoom-in: 100→125→156%; D3 (775,403.5,k=9.5); net ofset (+135,+67.5) CSS px | 1280×672 CSS / 2560×1344 device; u=0.1052631579 world/CSS px; 4097 parametrik kaynak örneği; 1190 piksel | render→kaynak 0.6348085456 CSS px; kaynak→render 0.4734169813 CSS px; her ikisi ≤1.25 |

Kaynak quarter-ellipse raster karede tamamen görünür kaldı; crop uygulanmadı. 156%’te ayrıca pointer drag yapılmadı; mevcut pan merkezi zoom ile taşındı. Worker hedefleri toplam [0.75,0.25]×4, 8 yanıt, quiet, maxLineVertexCount=42.

Hedefli browser 1/1, viewport Chromium dosyası 6/6, üç ilgili unit ve runtime typecheck PASS; diff-check PASS. Test/helper dışında prod kodu değişmedi; revision v27, schema v1, scene/DWG worker hash'leri sabit. Çıktı ve config D:\codex-cad-v2-f07-ellipse-dpr2-156-pan-20260925 altında; yeni C: cache ayrı ve korunuyor.

Yedi F07 kapısının audit durumu değişmedi: periodic SPLINE, HATCH remesh/topology, host bounded/on-demand fetch, kalan fill/glyph/chunk composite ve shader PATH_DISTANCE AÇIK; genel rendered-error matrisi PARTIAL/AÇIK; same-source AutoCAD görsel/ölçü AÇIK/NOT_RUN. Nested BULGE seçili same-chord ve iki seam yönünde zaten bağımsız ölçülmüş olduğundan yinelenmedi. F07 IN_PROGRESS, plan 14/19 (%74), 5/19 (%26) açık.

## 2026-09-25 — DPR1 ELLIPSE 156% + gerçek pan rendered-error kaydı

| Profil | Kamera | Bağımsız kaynak/raster oracle'ı | Sonuç |
|---|---|---|---|
| ELLIPSE, gerçek CAD V2 host/worker/WebGL, Chromium DPR1 | Fit (640,336,k=6.08); ardışık UI 125%→156%; son yüksek-zoom pan öncesi (640,336,k=9.5); gerçek pointer +48,+24 sonrası (688,360,k=9.5) | 1280×672 CSS/device px; u=0.1052631579 world/CSS px; tam görünür quarter-ellipse; 4097 parametrik analitik kaynak örneği ve 592 render pikseli | render→kaynak 0.9868434156 CSS px; kaynak→render 0.7490349703 CSS px; iki yön ≤1.25. Refinement [0.75,0.25]×3, 6/6 yanıt, quiet, max 42 line vertex |

DPR1 fit kabulü korunarak yeni 156% gerçek-pan profili eklendi. Her zoom seviyesinde son idle target 0.25 CSS px'e ulaşmadan sonraki adıma geçilmedi; hedef sayısı ve yanıt sayısı eşitlendi. Hedefli browser 1/1 (44.5 sn), viewport dosyası 6/6 (2.3 dk), üç ilgili unit, runtime TypeScript ve diff-check PASS. Yalnız test/helper değişti; compiler/cache v27, schema v1 ve iki worker hash'i değişmedi. Test çıktıları/config'i `D:\codex-cad-v2-f07-ellipse-dpr1-156-pan-20260925`; iki benzersiz C: cache kullanıldı.

| F07 kapısı yeniden denetlendi | Güncel kod/test kanıtı | Durum |
|---|---|---|
| Periodic SPLINE AutoCAD fixture/desteği ve knot multiplicity oracle'ı | Compiler periodic input'u reddediyor; bağımsız De Boor profilleri non-periodic sentetik spline'lar. AutoCAD periodic fixture/evaluator yok. | AÇIK |
| HATCH runtime remesh/topology | Worker curve-span refinement boundary line'ları güncelliyor; fill üçgenleri runtime topology remesh kabulünden geçmiyor. | AÇIK |
| Bounded spatial partition/on-demand chunk | Scheduler unit'leri mevcut ama host'a bağlanmamış; host manifest chunk'larını concurrency 6 ile fetch ediyor. | AÇIK |
| Kalan fill/glyph/chunk-boundary composite | Seçilmiş endpoint/seam/fill-boundary terimleri var; tam birleşik hata bütçesi kanıtı yok. | AÇIK |
| Shader `PATH_DISTANCE` tüketimi | Worker alanı açıp taşıyor; renderer okumuyor, mevcut dash rasterı tessellated XY'yi ölçüyor. | AÇIK |
| Runtime-refined rendered-error matrisi | ARC ve ELLIPSE için seçili DPR1/2, zoom/pan oracle'ları var; geometri ve device matrisi genel değil. | PARTIAL / AÇIK |
| Same-source AutoCAD görsel/ölçü oracle'ı | Eşleştirilmiş AutoCAD raster/ROI/ölçü kabul testi yok. | AÇIK / NOT_RUN |

Bu profil yalnızca sentetik ELLIPSE, tek canvas/Chromium ve seçili DPR1 kameraları için PASS'tır. F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) paket açık.


### F07 — Rational SPLINE runtime raster ölçümü, 2026-09-25

| İzlenen kabul | Bu turdaki kanıt | Sonuç |
|---|---|---|
| Host→worker refinement→WebGL içinde SPLINE source metadata'sının korunması | Sentetik clamped single-span cubic rational SPLINE; binary chunk metadata'sı kontrol noktası ve ağırlıklarla round-trip doğrulandı. | Bu dar sentetik profil PASS |
| Worker refinement sonrası çizilen eğrinin kaynak geometrisine yakınlığı | 1280×672 DPR1 fit, D3 (640,336,k=6.08); iki yönlü raster/source oracle, 4097 bağımsız rasyonel Bernstein örneği ve 677 raster pikseli. | PASS: 0.8164272623 / 0.7307145792 CSS px; sınır 1.25 |
| Refinement yanıtının gerçekten uygulanması | Hedef dizisi [0.75,0.25], 2/2 yanıt, quiet snapshot ve 96 maksimum line vertex. | PASS |
| Suite ve tür denetimi | Hedefli Chromium 1/1; tam viewport Chromium 7/7; curve-refinement, precision-refinement, worker-refinement-browser; runtime TypeScript ve diff-check. | PASS |

Bu kanıt periodic AutoCAD SPLINE, knot multiplicity davranışı veya farklı device/zoom matrisi anlamına gelmez. Periodic SPLINE AutoCAD fixture/knot oracle, HATCH runtime remesh, bounded host chunk fetch, kalan fill/glyph/chunk composite muhasebesi, shader PATH_DISTANCE ve same-source AutoCAD görsel/ölçü kapıları AÇIK; genel rendered-error matrisi PARTIAL/AÇIK. F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) paket açık.


### F07 — Rational SPLINE DPR2 pan kanıtı, 2026-09-25

| Kabul bağlantısı | Ölçüm | Sonuç |
|---|---|---|
| Gerçek pan ve D3 kamera doğrulaması | DPR2 fit (640,336,k=6.08) → gerçek +48,+24 CSS px pan → (688,360,k=6.08). Drawing buffer 2560×1344. | PASS |
| Kaynak spline → runtime raster iki yönlü envelope | 4097 bağımsız rational Bernstein örneği, 1348 raster pikseli; renderer source konumu gerçek D3 camera ile projekte edildi. | 0.4829010756 / 0.4292518924 CSS px; ≤1.25 |
| Refinement'ın pan sonrasında settled olması | [0.75,0.25] target dizisi; 2/2 cevap; pan öncesi/sonrası state quiet; max line vertex 96. | PASS |
| Değişiklik sonrası önceki DPR1 fit profilinin korunması | Kamera-aware oracle ile DPR1 fit aynı iki yönlü hatayı verdi: 0.8164272623 / 0.7307145792 CSS px. | PASS |
| Test ve tip denetimleri | Target Chromium 1/1; tam viewport Chromium 8/8; curve-refinement, precision-refinement, worker-refinement-browser; runtime TypeScript ve diff-check. | PASS |

Periodic SPLINE AutoCAD fixture/destek ve knot multiplicity oracle AÇIK; bu test non-periodic sentetik single-span cubic'dir. HATCH runtime remesh/topology AÇIK; host bounded spatial partition/on-demand chunk AÇIK; fill/glyph/chunk-boundary kalan composite AÇIK; shader PATH_DISTANCE AÇIK; geniş geometri/zoom/pan/DPR/device rendered-error matrisi PARTIAL/AÇIK; same-source AutoCAD görsel/ölçü AÇIK/NOT_RUN. Bu DPR2 pan profili genel kapıyı kapatmaz. F07 IN_PROGRESS, 14/19 (%74) tamam, 5/19 (%26) açık.


### F07 kanıt izi — rational SPLINE DPR2 125% zoom/pan (2026-09-25)

`tests/document-studio/cad-v2-layout-viewport.spec.ts` içindeki gerçek host→worker→refined line buffer→WebGL profili, DPR2 rasyonel Bernstein raster oracle'ını fit-pan, centered 125% zoom ve ikinci gerçek pan boyunca yürütür. D3 kamera sırası (640,336,6.08) → (688,360,6.08) → (700,366,7.6) → (748,390,7.6); son net pan ofseti (+108,+54) CSS px. 1280×672 CSS / 2560×1344 device; 4097 bağımsız source sample, 1702 raster pixel; iki yönlü hata 0.4689849332 / 0.4743416490 CSS px. Worker hedefleri `[0.75,0.25,0.75,0.25]`, 4/4 reply, quiet, max 110 line vertex. Bu yalnız tek sentetik, non-periodic rational SPLINE kamera profili için dar kabul sonucudur.

Seçilmiş Chromium raster kümesi 5/5 ve tam viewport Chromium dosyası 8/8; ilgili precision/curve/worker-browser testleri ve runtime typecheck geçti. `git diff --check` temiz. Test-only; compiler/cache v27, DV2SCN01 v1 ve iki worker SHA-256 sabit. Ayrı koşu konfigürasyonları, loglar ve sonuçlar yeni D: köklerinde tutuldu; C: Next cache'leri de ayrıdır. Düzeltilmiş suite konfigürasyonu `DOK_LOCAL_DATA_DIR` değerini per-run `TEMP` altına yerleştirdi. İlk suite config güvenli path korumasına takıldı; başarısız koşu ekleri korunmuş.

| F07 kapısı | Kod/test kanıtı | Durum |
|---|---|---|
| Periodic SPLINE AutoCAD fixture/desteği ve knot oracle | Mevcut periodic girdi fail-closed; De Boor multiplicity testleri sentetik non-periodic spline ile sınırlı. | **AÇIK** |
| HATCH runtime remesh/topology | Runtime curve boundary refinement fill triangle/topology remesh değildir. | **AÇIK** |
| Bounded spatial partition ve on-demand chunk | Scheduler host loading'e bağlanmamış; host manifest chunk'larını concurrency 6 ile getiriyor. | **AÇIK** |
| Fill/glyph/chunk-boundary ve kalan composite hesabı | Dar terimler mevcut; tam birleşik fill/glyph/chunk toplam kanıtı yok. | **AÇIK** |
| Shader `PATH_DISTANCE` | Renderer worker alanını tüketmiyor; dash rasterı tessellated XY kullanıyor. | **AÇIK** |
| Geometri/zoom/pan/DPR/device rendered-error | ARC/ELLIPSE/SPLINE için seçili profil var; tüm geometri ve cihaz matrisi tamam değil. | **PARTIAL / AÇIK** |
| Aynı-kaynak AutoCAD görsel/ölçü oracle'ı | Paired AutoCAD görüntü/ROI/measurement kabulü yok. | **AÇIK / NOT_RUN** |

F07 **IN_PROGRESS** kalır; plan ilerlemesi **14/19 (%74)**, açık paketler **5/19 (%26)**.


## F07 izlenebilirlik — Rational SPLINE DPR2 156% pan raster oracle

| Ölçülen kapsam | Kaynak ve oracle | Sonuç |
|---|---|---|
| DPR2 live host→worker→refined line buffer→WebGL rational SPLINE | `tests/document-studio/cad-v2-layout-viewport.spec.ts`; gerçek D3 camera; independent rational Bernstein evaluator; 4097 kaynak örneği ve screenshot device-pixel merkezleri | **PASS —** 156% centered zoom `(775,403.5,k=9.5)`, ardından gerçek `(+48,+24)` CSS pan `(823,427.5,k=9.5)`; 2124 raster piksel; 0.4907102356 px render→source ve 0.4090727048 px source→render, ≤1.25. |
| Settled refinement ve stale yanıt koruması | Aynı browser testinde pre-zoom target-count baseline; yeni hedef/yanıt, son 0.25 hedef ve sakin pending state | **PASS —** `[0.75,0.25,0.75,0.25,0.75,0.25]`, 6/6 reply, max line vertex 110. Önceki 125% cevabını yeni zoom cevabı sayan helper yarışı giderildi. |
| Doğrulama | Targeted Chromium; tam viewport browser dosyası; üç refinement unit dosyası; runtime TS; diff check | **PASS —** targeted 1/1; viewport 8/8; `precision-refinement`, `curve-refinement`, `worker-refinement-browser`; `tsc --noEmit -p tsconfig.next.json --incremental false`; temiz `git diff --check`. |

Test/helper-only değişiklik: compiler/cache v27, DV2SCN01 v1 ve scene/DWG worker hash'leri sabit. Loglar yeni `D:\codex-cad-v2-f07-spline-dpr2-156-pan-retry-20260925` ve `D:\codex-cad-v2-f07-spline-dpr2-156-pan-full-20260925` köklerinde tutuldu; önceki pan195 kökleri ve repo D-backed `test-output/` silinmedi.

| F07 kapısı | Durum |
|---|---|
| Periodic SPLINE AutoCAD fixture/desteği/knot oracle | **AÇIK** — mevcut multiplicity evaluator sentetik non-periodic profillerle sınırlı. |
| HATCH runtime remesh/topology | **AÇIK** |
| Bounded spatial partition ve on-demand chunk | **AÇIK** — scheduler host'a bağlı değil, host manifest chunk'larını concurrency 6 ile getiriyor. |
| Fill/glyph/chunk-boundary ve kalan composite | **AÇIK** |
| Shader `PATH_DISTANCE` tüketimi | **AÇIK** — renderer alanı tüketmiyor. |
| Genel geometri/zoom/pan/DPR/device rendered-error | **PARTIAL / AÇIK** |
| Same-source AutoCAD görsel/ölçü oracle'ı | **AÇIK / NOT_RUN** |

Nested/transformed BULGE same-chord ve iki seam-yönü oracle bu alt aşamada yeniden çalıştırılmadı. F07 **IN_PROGRESS**; plan **14/19 (%74)**, **5/19 (%26)** paket açık.


## F07 SPLINE DPR2 195% acceptance (2026-09-25)

| İzlenen bağ | Kaynak | Sonuç |
|---|---|---|
| 195% DPR2 kamera ve raster | tests/document-studio/cad-v2-layout-viewport.spec.ts; sentetik non-periodic rational cubic SPLINE; Chromium/WebGL gerçek device raster | PASS — D3 (868.75,450.375,k=11.875), viewport 1280×672 CSS, buffer 2560×1344, u=0.08421052631578949; 4097 rational Bernstein kaynak örneği / 2704 raster pikseli; render→source 0.5413191518506184, source→render 0.4506939094329671 CSS px (≤1.25). |
| Settled worker refinement | Aynı browser akışındaki hedef/yanıt sayacı, pending kuyruğu ve line buffer | PASS — hedefler [0.75,0.25]×4, 8 yanıt, son hedef 0.25 CSS px, pending 0, maxLineVertexCount 114. |
| Sentetik session heartbeat izolasyonu | F07 SPLINE ve ELLIPSE fixture route'ları | PASS — mock heartbeat 200 döner; gerçek API 410 kaynaklı prepare/fit yenilemesi engellenir. ELLIPSE zoom assert'leri ölçek ve yeni refinement cevabını denetler. |
| Doğrulama | Layout viewport Chromium; npm run check:cad-v2:unit; runtime TypeScript; git diff --check | PASS — Chromium 8/8 (190 s); unit exit 0; runtime tsc --noEmit -p tsconfig.next.json --incremental false exit 0; diff check temiz. |

Koşu log/config/results kökü: D:\codex-cad-v2-f07-spline-dpr2-195-zoom-final2-20260925. Test/helper-only değişiklik; compiler/cache v27, DV2SCN01 v1 ve preserved scene/DWG worker SHA-256 değerleri sabit. Kapılar: periodic AutoCAD SPLINE/knot, HATCH remesh/topology, bounded/on-demand chunk, kalan fill/glyph/chunk composite ve shader PATH_DISTANCE AÇIK; genel geometri/zoom/pan/DPR/device rendered-error PARTIAL / AÇIK; same-source AutoCAD AÇIK / NOT_RUN. F07 IN_PROGRESS, 14/19 (%74), 5/19 (%26) paket açık.


## F07 ELLIPSE DPR2 195% acceptance (2026-09-25)

| İzlenen bağ | Kaynak | Sonuç |
|---|---|---|
| Gerçek zoom, pan ve DPR2 raster | tests/document-studio/cad-v2-layout-viewport.spec.ts; parametrik ELLIPSE kaynak oracle'ı | PASS — D3 156% kamerası (775,403.5,k=9.5), pan (-10,-5), 195% kamera (796.25,414.125,k=11.875); net merkez pan (+156.25,+78.125) CSS px; 1280×672 CSS / 2560×1344 device; tam çeyrek ellipse görünür. |
| Bağımsız raster/source envelope | 4097 analitik örnek / 1476 DPR2 WebGL pikseli | PASS — render→source 0.6301951256486582, source→render 0.4610262730380537 CSS px; iki yön ≤1.25. |
| Settled refinement | Browser worker mesajları, line draw vertex sayacı ve quiet snapshot | PASS — 14 yanıt, son hedef 0.25 CSS px, pending 0, maxLineVertexCount 46. |
| Doğrulama | Targeted ve tam layout-viewport Chromium; precision/curve/worker refinement unit; runtime TS; diff check | PASS — 1/1, 8/8, ilgili üç unit ve typecheck geçti. |

Bu yalnız test/helper genişlemesidir; compiler/cache v27, binary schema v1 ve preserved worker hash'leri sabittir. Loglar D:\codex-cad-v2-f07-ellipse-dpr2-195-target-20260925 ve D:\codex-cad-v2-f07-ellipse-dpr2-195-full-20260925 altında korundu. Periodic AutoCAD SPLINE/knot, HATCH runtime topology, bounded/on-demand chunk, kalan fill/glyph/chunk composite ve shader PATH_DISTANCE AÇIK; genellenmiş rendered-error PARTIAL / AÇIK; same-source AutoCAD AÇIK / NOT_RUN. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) açık.

## 2026-09-25 — F07 DPR1 195% pan kanıt izi

Test: `tests/document-studio/cad-v2-layout-viewport.spec.ts`, DPR1 ELLIPSE kabul testi, zoom/pan bölümü ve raster assertion’ları (195% adımı yaklaşık satır 1540–1618). Fixture semimajor 40 / semiminor 24 çeyrek elipsidir. D3 kamera fit `(640,336,6.08)` → 156% pan `(688,360,9.5)` → 195% zoom `(700,366,11.875)` → son pan `(690,361,11.875)`. Raster oracle worker subdivision’ını kullanmaz; 4097 eşit parametrik analitik örnek ile PNG’den seçilmiş WebGL piksel merkezlerini ölçer. Son hata çift yönü `(1.0146941342, 0.7496648734)` CSS px; örnek sayısı 4097, raster sayısı 747.

Hedefli ve tam Chromium config/log/Playwright sonuçları `D:\codex-cad-v2-f07-ellipse-dpr1-195-pan-retry-20260925` altındadır: `playwright.target.config.ts`, `target.stdout.log`, `playwright.full.config.ts`, `full.stdout.log`, ve `results-target-20260925` / `results-full-20260925`. İlk koşunun timeout screenshot/video/context’i ayrıca `D:\codex-cad-v2-f07-ellipse-dpr1-195-pan-20260925\results-target-20260925` altında bırakıldı. Her koşu kendine ait C: Next cache ve D: TEMP/data dizini kullandı; test portları 43903–43906 artık dinlemiyor.

Doğrulama izi: hedefli Chromium 1/1; tam viewport Chromium 8/8; `npm run check:cad-v2:unit` 0; kamera etkileşimi, gerçek sahne render, worker refinement browser, host lifecycle ve UI quality alt testleri PASS; runtime `tsc --noEmit -p tsconfig.next.json --incremental false` PASS. `ui-subchecks.stdout.log` ve `runtime-tsc.stdout.log` aynı D: kökünde. Revision/cache kimliği `cad-v2-compiler-2026.09-v27`, schema v1; worker public bundle hash’leri bu test-only aşamada değişmedi.

Unit paketinin kaynak koddan gelen yazma yan etkisi: P05 `affine-ocs-audit.json`, P05 `bounds-provenance.json`, P06 `entity-instance-parity.json`, P06 `block-expansion-budget.json` dosyalarına testler çıktı yazdı (04:12:48–04:12:55, 2026-09-25); çıktıların tamamı ve unit logu korunuyor. Gelecek unit tekrarından önce bu test yan etkilerini izole etme gereği vardır.
### İzlenebilirlik düzeltmesi — hedef koşusu log dosyası

Başarılı hedefli Playwright koşusunun stdout’u D: dosyasına tee edilmedi; bu nedenle üstte anılan `target.stdout.log` mevcut değildir. Hedef koşusunun `1 passed` sonucu `results-target-20260925/.last-run.json` içindeki `status: passed, failedTests: []` ile doğrulanır; aynı testin tam Chromium dosya koşusundaki ayrıntılı raster ölçümü `full.stdout.log` içinde tutulur. İlk başarısız koşunun video, screenshot ve error context’i ayrı ilk-deneme kökünde korunmuştur.
### Unit evidence yazma yan etkisi — önemli not

`npm run check:cad-v2:unit` sırasında testler çalışma ağacında zaten bulunan dört P05/P06 JSON evidence dosyasını doğrudan yeniden yazdı. Çalışma öncesi bu dört dosyanın byte kopyası/hash’i alınmadığından eski byte içerikleri bu oturumda geri yüklenemiyor; testlerin ürettiği güncel PASS çıktıları ve unit logu yerinde bırakıldı. Bu, test otomasyonunun repo içi evidence yazma yan etkisidir ve gelecek geniş unit koşusundan önce ayrıca izole edilmelidir.
## F07 ARC DPR2 195% pan — izlenebilirlik kanıtı (2026-09-25)

| İzlenen bağ | Kaynak | Sonuç |
|---|---|---|
| Runtime refinement → gerçek kamera | `tests/document-studio/cad-v2-layout-viewport.spec.ts` içindeki DPR2 ARC testi (başlangıç satırı 1147) | PASS — fit `(640,336,6.08)`; fit pan `(+48,+24)`; 125% → 156% → 195% merkez zoom; 195% seviyesinde ikinci gerçek pan `(+48,+24)`; son D3 `(781.75,406.875,11.875)`, fit-relative `(+141.75,+70.875)` CSS px. |
| Canvas ve görünür analitik kaynak | Chromium WebGL2 screenshot; DPR2; bağımsız tam analitik çeyrek çember ve viewport ile kırpılmış görünür kaynak açıları | PASS — 1280×672 CSS / 2560×1344 device; `u=0.08421052631578949`; görünür kaynak açısı `[0,1.0286029931]`; rasterda 1363 seçilmiş mavi piksel. |
| İki yönlü raster/source hata | Screenshot piksel merkezleri ↔ bağımsız analitik kaynak yay | PASS — render→kaynak `0.6559628023` CSS px; kaynak→render `0.4458264123` CSS px; ikisi de ≤1.25. |
| Refinement sakinliği | Worker mesaj sayacı, son hedef ve WebGL line draw vertex sayacı | PASS — `[0.75,0.25]×4`; 8/8 yanıt; son hedef 0.25 CSS px; pending 0; maksimum line vertex 46. |
| Doğrulama | Hedefli/full Playwright, üç refinement unit/browser-worker ve beş UI alt testi, runtime TS | PASS — hedefli 1/1; viewport Chromium 8/8 (3.5 dk); yedi ilgili script; `tsc --noEmit -p tsconfig.next.json --incremental false`; `git diff --check`. |

Hedefli config/stdout/sonuçları `D:\codex-cad-v2-f07-arc-dpr2-195-20260925\pw-target.config.ts`, `target.stdout.log`, `results-target`; tam dosya config/stdout/sonuçları `pw-full.config.ts`, `full.stdout.log`, `results-full` altındadır. Yedi script logu ve typecheck logu aynı D: kökte saklıdır. Her koşunun izole D: temp/data ve ayrı C: Next cache'i vardı; 43927/43928 portlarında listener kalmadı. Test-only değişiklik compiler/cache v27, scene schema v1 ve her iki worker hash'ini değiştirmedi.

Bu kayıt rendered-error matrisi kapsamını ARC/DPR2/195%/pan profilinde artırır, fakat genellenmiş geometri/zoom/pan/DPR/device kapısını **PARTIAL / AÇIK** bırakır. Periodic AutoCAD SPLINE/knot, HATCH runtime topology, bounded/on-demand chunk, fill/glyph/chunk composite, shader `PATH_DISTANCE` ve same-source AutoCAD oracle kapıları **AÇIK** (AutoCAD oracle **NOT_RUN**); F07 **IN_PROGRESS**, 14/19 (%74), 5/19 (%26) açık.
## F07 rational SPLINE DPR1 195% pan — izlenebilirlik (2026-09-25)

| İzlenen bağ | Kaynak | Sonuç |
|---|---|---|
| UI zoom ve gerçek kamera panı | `tests/document-studio/cad-v2-layout-viewport.spec.ts`, DPR1 rational SPLINE oracle testi (başlangıç satırı 1747) | PASS — fit `(640,336,k=6.08)`; merkez zoom 125% → 156% → 195%; 195% zoomda gerçek `(+48,+24)` pan; son D3 `(688,360,k=11.875)`. |
| Bağımsız kaynak ve DPR1 raster | 4097 örnekli rational Bernstein evaluator; 1280×672 WebGL screenshot | PASS — source bounds `[284.25,98.75]..[1091.75,573.75]` viewport içinde; 1350 seçilmiş piksel. |
| Bidirectional rendered error | Screenshot piksel merkezleri ↔ bağımsız rasyonel kaynak yay | PASS — render→kaynak `0.9300776279` CSS px; kaynak→render `0.7905694150` CSS px; iki yön ≤1.25. |
| Worker settle ve aynı bucket pan | Request/reply instrumentation, `maxLineVertexCount`, pan öncesi/sonrası state | PASS — hedef `[0.75,0.25]×4`, 8/8 reply, son 0.25 CSS px, pending 0, max line vertex 114; aynı bucket pan ek hedef üretmedi. |
| Doğrulama | Targeted ve tam Chromium, CAD refinement testleri, beş UI subcheck, runtime TS | PASS — 1/1; viewport dosyası 8/8; üç ilgili unit/browser-worker ve beş UI script; runtime typecheck ve diff check. |

Kanıt dizini `D:\codex-cad-v2-f07-spline-dpr1-195-pan-20260925-v2`: `pw-target.config.ts`, `target.stdout.log`, `results-target`; `pw-full.config.ts`, `full.stdout.log`, `results-full`; ilgili yedi script logu ve `runtime-tsc.log`. Target/full ayrı C: Next cache ve D: geçici data kullandı; portlar 43929/43930 kapalı, hedef süreç yok. Test-only aşamada compiler/cache v27, schema v1 ve önceki iki worker hash'i korundu.

DPR1 rational SPLINE/195% pan örneği rendered-error matrisini genişletir; genel geometri/zoom/pan/DPR/device kapısı **PARTIAL / AÇIK** kalır. Periodic AutoCAD SPLINE/knot oracle, HATCH runtime remesh, bounded/on-demand chunks, fill/glyph/chunk composite, shader `PATH_DISTANCE`, same-source AutoCAD visual/measurement kapıları **AÇIK** (AutoCAD oracle **NOT_RUN**). F07 **IN_PROGRESS**, 14/19 (%74), 5/19 (%26) paket açık.
## F07 DPR2 ELLIPSE 195% sonrası pan — izlenebilirlik (2026-09-25)

| İzlenen bağ | Kaynak | Sonuç |
|---|---|---|
| 195% sonrası gerçek pan ve kamera | `tests/document-studio/cad-v2-layout-viewport.spec.ts` DPR2 ELLIPSE testi (başlangıç satırı 2285; ek assertion yaklaşık satır 2839) | PASS — 195% zoom öncesi kamera `(796.25,414.125,k=11.875)`; gerçek `(-10,-5)` pan sonrası `(786.25,409.125,k=11.875)`; fit-relative offset `(+146.25,+73.125)` CSS px. |
| Tam görünür parametrik kaynak | ELLIPSE semimajor/semiminor projeksiyonu ve DPR2 viewport | PASS — 1280×672 CSS / 2560×1344 device; `u=0.0842105263`; kaynak çeyrek yay bounds'ı viewport içinde; kaynak açısı `[0,π/2]`. |
| Bağımsız raster/source oracle | 4097 parametrik analitik örnek ↔ 1476 WebGL pikseli | PASS — render→source `0.6301951256` CSS px; source→render `0.4610262730` CSS px; her ikisi ≤1.25. |
| Runtime refinement quiet | Worker hedef/yanıt sayaçları ve line draw vertex sayacı | PASS — `[0.75,0.25]×7`, 14/14 yanıt, son hedef 0.25 CSS px, pending 0, maxLineVertexCount 46; 195% sonrası pan bu state'i değiştirmedi. |
| Doğrulama | Hedefli/tam Chromium, ilgili unit/browser-worker ve beş UI alt testi, runtime TS | PASS — 1/1; tam viewport 8/8; `tsc --noEmit -p tsconfig.next.json --incremental false`; `git diff --check`. |

Hedefli ve tam koşu kanıtı `D:\codex-cad-v2-f07-ellipse-dpr2-195-postpan-20260925` içindedir (`target.stdout.log`, `full.stdout.log`, Playwright config/sonuçları, yedi script logu ve typecheck logu). Her koşu benzersiz C: cache ve ayrı D: temp/data kullandı; 43931/43932 listener'ı ve ilgili test process'i kalmadı. Production runtime/worker değişmedi; revision v27, schema v1 ve iki worker SHA-256 sabit.

Bu ölçüm DPR2 ELLIPSE/195% pan profilini genişletir; rendered-error matrisi genel olarak **PARTIAL / AÇIK** kalır. Periodic AutoCAD SPLINE/knot, HATCH topology, bounded/on-demand chunks, fill/glyph/chunk composite, shader `PATH_DISTANCE` ve same-source AutoCAD oracle açık; sonuncusu **NOT_RUN**. F07 **IN_PROGRESS**, 14/19 (%74), 5/19 (%26) açık.
## F07 DPR2 SPLINE 195% sonrası ek pan — izlenebilirlik (2026-09-25)

| İzlenen bağ | Kanıt | Sonuç |
|---|---|---|
| Test kaynağı ve gerçek etkileşim | `tests/document-studio/cad-v2-layout-viewport.spec.ts`, `runtime-refined SPLINE pan raster error is bounded at DPR2` | PASS — 195% yakınlaştırma sonrasında gerçek `(-10,-5)` CSS px pan; kamera `(868.75,450.375,k=11.875)` → `(858.75,445.375,k=11.875)`. |
| DPR2 raster bağlamı ve görünür kaynak | 1280×672 CSS, 2560×1344 device; `u=0.0842105263` | PASS — 4097 rational Bernstein örneğinin bounds'ı `[455,184.125]..[1262.5,659.125]`, viewport içinde. |
| Bağımsız raster/source oracle | 4097 kaynak örneği ↔ 2704 seçilmiş WebGL pikseli | PASS — render→source `0.5413191519` CSS px; source→render `0.4506939094` CSS px; ikisi `≤1.25`. |
| Runtime refinement | target/reply ve line-vertex enstrümantasyonu | PASS — `[0.75,0.25]×4`, 8/8 reply, son hedef 0.25 CSS px, pending 0, maksimum 114 vertex; pan state'i yenilemedi. |
| Doğrulamalar | Hedef/tam Chromium, 7 odaklı unit/UI testi, runtime TypeScript | PASS — 1/1, viewport 8/8, focused 7/7, `tsc --noEmit ...`, `git diff --check`. |

Kanıt kökü `D:\codex-cad-v2-f07-spline-dpr2-195-postpan-20260925`: `target.stdout.log`, `full.stdout.log`, `results-target`, `results-full`, yedi test logu, `runtime-tsc.log` ve iki Playwright config. Her browser koşusu ayrı C: Next cache ve D: temp/data kullandı; 43933/43934 listener'ı veya test süreci kalmadı.

Kapı özeti: periodic AutoCAD SPLINE/knot, HATCH remesh/topology, bounded/on-demand chunk, fill/glyph/chunk composite, shader `PATH_DISTANCE` **AÇIK**; genellenmiş rendered-error matrisi **PARTIAL / AÇIK**; same-source AutoCAD visual/measurement **AÇIK / NOT_RUN**. F07 **IN_PROGRESS**; 14/19 (%74), 5/19 (%26) paket açık. Runtime/compiler/cache v27, pipeline `fidelity-v3-p07`, schema v1 ve iki worker hash'i değişmedi.
## F07 DPR2 SPLINE 80% zoom + pan — izlenebilirlik (2026-09-25)

| İzlenen bağ | Kanıt | Sonuç |
|---|---|---|
| UI zoom-out ve gerçek pan | `tests/document-studio/cad-v2-layout-viewport.spec.ts`, DPR2 SPLINE raster testi | PASS — 195%’ten 156/125/100/80% adımları; 80% gerçek `(-10,-5)` pan; kamera `(729.6,380.8,k=4.864)` → `(719.6,375.8,k=4.864)`. |
| DPR2 viewport ve kaynak görünürlüğü | 1280×672 CSS, 2560×1344 device; bağımsız tam SPLINE | PASS — `u=0.2055921053`; 4097 kaynak örneğinin bounds `[554.224,268.792]..[884.976,463.352]` viewport içinde. |
| Rasyonel kaynak/raster oracle | 4097 Bernstein örneği ↔ 1112 WebGL pikseli | PASS — render→source `0.4476090077` CSS px; source→render `0.3641466608` CSS px; ikisi `≤1.25`. |
| Refinement idle ve aynı bucket panı | Worker target/reply ve line vertex enstrümantasyonu | PASS — `[0.75,0.25]×5`, 10/10 reply, son hedef 0.25 CSS px, pending 0, maxLineVertexCount 114; 80% pan sonrası state aynı. |
| Kontroller | Hedef/tam Chromium, odaklı CAD unit/UI, runtime TS | PASS — 1/1, viewport 8/8, focused 7/7, `tsc --noEmit -p tsconfig.next.json --incremental false`, `git diff --check`. |

Kanıt kökü `D:\codex-cad-v2-f07-spline-dpr2-80-pan-20260925`: `target.stdout.log`, `full.stdout.log`, `results-target`, `results-full`, yedi focused script logu, `runtime-tsc.log` ve koşu config'leri. Ayrı C: Next cache / D: temp-data kökleri kullanıldı; 43935/43936 listener'ı ve test Node süreci kalmadı.

Bu hücre rendered-error matrisini genişletir, genel kapıyı kapatmaz. Periodic AutoCAD SPLINE/knot, HATCH runtime remesh/topology, bounded/on-demand chunk, kalan fill/glyph/chunk composite, shader `PATH_DISTANCE` açık; same-source AutoCAD visual/measurement açık/not run. F07 `IN_PROGRESS`, 14/19 (%74), 5/19 (%26) paket açık. Compiler/cache v27, pipeline `fidelity-v3-p07`, schema v1 ve iki worker hash'i değişmedi.
## 2026-09-25 — F07 DPR1 SPLINE 80% pan kanıt izi

| Kabul hücresi | Uygulama/test | Ölçüm | Sonuç |
|---|---|---|---|
| 195% pan sonrası düşük zoom DPR1 raster | tests/document-studio/cad-v2-layout-viewport.spec.ts, rational Bernstein kaynak oracle'ı | DPR1 1280×672; final kamera (649.6608,340.8304,k=4.864); 4097 kaynak örneği / 542 seçilmiş WebGL pikseli | render→source 0.7981910667 px; source→render 0.9082625171 px; eşik 1.25 px altında |
| Worker refinement sakinliği | Aynı Chromium senaryosu, zoom-out hedef geçmişi ve post-pan snapshot | 0.25 px son hedef; [0.75,0.25]×5; 10/10 yanıt; maxLineVertexCount=114; pending 0 | PASS |
| Tekrar doğrulama | Hedef Chromium; tam viewport Chromium; 2 refinement unit + 5 UI/worker test; runtime typecheck; diff check | 1/1; 8/8; 7/7; PASS; PASS | PASS |

Kanıt konumu: D:\codex-cad-v2-f07-spline-dpr1-80-pan-20260925 (target, full, focused, typecheck günlükleri; izole test artifact ve temp/data). Compiler/cache v27, pipeline p07, DV2SCN01 schema v1 ve worker hash'leri korundu. Test-only matris genişlemesi olduğundan runtime/compiler cache revision değişmedi.

Kapı denetimi: sentetik clamped spline knot birim testleri AutoCAD periodic fixture/runtime ve AutoCAD knot oracle'ı değildir; periodic/knot kapısı AÇIK. HATCH testleri statik mesh/topology ile sınırlı; runtime remesh AÇIK. Compiler bounded spatial partition üretmiyor ve host manifest chunk'larını eager yüklemeye devam ediyor; on-demand kapısı AÇIK. Static glyph ve fill nicemleme ölçümleri mevcut olsa da fill/glyph/chunk sınırı ve kalan bileşik hesap AÇIK. Renderer PATH_DISTANCE tüketmediğinden shader/dash kapısı AÇIK. Tarayıcı matrisi sentetik SwiftShader profilleriyle PARTIAL/AÇIK; native GPU/device ve AutoCAD eş-kaynak görüntü/ölçü oracle'ı NOT_RUN. F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) paket açık.

**F08 v82 — owner ledger → worker transfer guard → renderer/host tests → R001 process HWM:** Resource owner record carries scene, host generation, chunk, refCount and CPU/GPU byteEstimate. Shared object identity is counted once and disposed on last lease. Renderer integration covers actual Three geometry/material registration/removal and generation clear; worker test blocks duplicate ArrayBuffer transfer. Ledger/renderer/worker, scheduler/cache, curve preflight and host lifecycle focused tests pass; runtime tsconfig.next check exits 0. Targeted clean-port Chromium budget/LRU, 10 simulated context recovery, 20 open/close, stale file switch and legacy control **5/5 PASS**. R001 test exited 0 but logs LibreDWG error 68: OS-maintained Node process maxRSS **1.944.174.592 B** at compile; 4 concurrent source copies **1.692.880 B**; unpacked worker chunk **1.272.108 B**; renderer output CPU/GPU estimate **1.212.120/1.212.120 B**; 22 curve refs refined to 1.255 segments. Browser process RSS and physical GPU remain NOT_RUN. Initial P00 still rejects 90/284 visible chunks due CPU estimate 74.920.882/67.108.864 B; GPU estimate is 51.048.852/67.108.864 B. Fidelity effect remains unresolved without clean decode and same-source AutoCAD semantic hash + 10 ROI. F08 **PARTIAL / ACCEPTANCE NOT_RUN**.


## 2026-09-25 — F07 DPR1 ELLIPSE 80% pan izlenebilirlik kaydı

| İz | Kanıt / sonuç |
|---|---|
| Test senaryosu | `tests/document-studio/cad-v2-layout-viewport.spec.ts:1468`; independent parametric ELLIPSE oracle senaryosu 80% zoom-out ve (-10,-5) CSS px panı kapsıyor. |
| Runtime/raster bağlamı | D3 camera `(650.48,341.24,4.864)`; CSS viewport ve DPR1 buffer `1280×672`; `u=0.2055921052631579` world/CSS px; 4097 analitik örnek / 299 WebGL pikseli. |
| İki yönlü ölçüm | Render→analitik kaynak maksimum `0.7860996134` CSS px; kaynak→render maksimum `0.8713208364` CSS px; eşik `1.25` CSS px. |
| Refinement | Hedef dizisi sonu 0.25 CSS px; 10 istek / 10 yanıt; `maxLineVertexCount=46`; post-pan 350 ms snapshot'ında ek yanıt yok, pending 0. |
| Tekrar doğrulama | Hedefli Chromium 1/1 (82.4 s); tam viewport Chromium 8/8 (275.5 s); odaklı unit/UI 7/7; runtime TS ve CRLF-aware diff check PASS. |
| Artifact ve çalışma ağacı | Başarılı log/artifact kökü `D:\codex-cad-v2-f07-ellipse-dpr1-80-pan-20260925`; C: Next cache'leri ayrı, D: temp/data izole. Başlangıç kurulumunda default `test-results` altına düşen başarısız upload artifact'i silinmeden korundu; sonraki koşular explicit D: `--output` kullandı. |
| Revision/cache | Compiler v27, pipeline p07, schema v1 sabit; public scene worker ve korunmuş conversion worker SHA-256 değerleri önceki checkpoint ile aynı. |

Kapılar: periodic AutoCAD SPLINE/knot **AÇIK**; HATCH runtime remesh/topology **AÇIK**; host bounded/on-demand chunks **AÇIK**; kalan fill/glyph/chunk-boundary composite accounting **AÇIK**; shader `PATH_DISTANCE` **AÇIK**; genel geometri/zoom/pan/DPR/device raster matrisi **PARTIAL / AÇIK**; same-source AutoCAD visual/measurement **AÇIK / NOT_RUN**. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) açık.


**Artifact notu:** İlk başarısız Playwright çağrısında PowerShell argüman aktarımı nedeniyle `--output` etkinleşmedi ve varsayılan repo `test-results` yoluna failure artifact yazıldı. Mevcut çıktı silinmedi/taşınmadı. Koşu öncesi aynı adlı artifact için hash/yedek alınmadığından, varsa önceki içeriğin korunup korunmadığı geriye dönük doğrulanamıyor. Bu başarısız deneme PASS sayımına dahil değildir.


## 2026-09-25 — F07 DPR1 ARC 80% pan izlenebilirlik kaydı

| Kabul izi | Uygulama ve sonuç |
|---|---|
| Test/oracle | `tests/document-studio/cad-v2-layout-viewport.spec.ts:704`; mevcut canlı zoom/stale-response testi, bağımsız analitik quarter-circle projeksiyonu ile DPR1 80% pan hücresi eklenerek genişletildi. |
| Kamera/raster | 80% zoom kamerası `(710.0416,371.0208,k=4.864)`; (+48,+24) CSS px pan sonrası `(758.0416,395.0208,k=4.864)`; viewport ve raster `1280×672`; `u=0.2055921052631579` world/CSS px. |
| Ölçüm | 383 seçilmiş WebGL pikseli; render→kaynak `0.8401740575` CSS px, kaynak→render `0.7087218739` CSS px; her iki yön `≤1.25` px. |
| Refinement | Son hedef 0.25 CSS px; son zoom-out profili `[0.75,0.25]`; pending yanıt 0; maksimum 46 line vertex. Pan sonrasında refinement snapshot'ı değişmedi. |
| Tekrar | Targeted Chromium 1/1; tam viewport Chromium 8/8; odaklı unit/UI 7/7; runtime TS ve diff check PASS. |
| Koşu izleri | Başarılı ve ilk başarısız hedef koşu çıktıları, tam suite, unit logları ve ayrı cache/temp konfigürasyonları `D:\codex-cad-v2-f07-arc-dpr1-80-pan-20260925` altında korundu. İlk assertion düzeltmesi runtime bug değildir; test zoom oranı çarpımına göre düzeltildi. |

Periyodik SPLINE/knot, HATCH runtime remesh, bounded/on-demand chunk, kalan fill/glyph/chunk composite, shader `PATH_DISTANCE`, genel raster matrisi ve same-source AutoCAD oracle kapıları açık/PARTIAL durumunu korur. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-25 — F07 DPR3 ELLIPSE cihaz-piksel izi

| İz | Kanıt / sonuç |
|---|---|
| Test ve oracle | tests/document-studio/cad-v2-layout-viewport.spec.ts:3545; yeni runtime-refined ELLIPSE kabul testi, bağımsız 4097 örnekli parametrik kaynak oracle'ı. |
| Cihaz ve renderer | DPR3; CSS viewport 1280×672; renderer canvas buffer 2560×1344 (2× cap); cihaz ölçekli screenshot 3840×2016. |
| Kamera / kaynak | Fit (640,336,k=6.08); gerçek (-10,-5) CSS px pan sonrası (630,331,k=6.08); u=0.16447368421052633 world/CSS px. |
| İki yönlü raster | 2198 seçilmiş WebGL pikseli; render→kaynak 0.7085877543 CSS px; kaynak→render 0.2589010743 CSS px; her ikisi ≤1.25 px. |
| Worker | Hedef geçmişi [0.75,0.25]; 2/2 cevap; son hedef 0.25 CSS px; aynı bucket pan sonrası yeni refinement yok; maxLineVertexCount=34. |
| Tekrar doğrulama | curve-refinement.test.ts PASS; precision-refinement.test.ts PASS; yeni Chromium senaryosu 1/1 PASS; runtime tsconfig.next.json typecheck PASS. Tam viewport dosyası bu turda çalıştırılmadı. |
| Artifact ve izolasyon | D: log/artifact kökü D:\codex-cad-v2-f07-dpr3-clamp-20260925; ayrı C: Next cache; uygulama fixture verisi izinli Temp yolunda saklandı; 43951 portu kapalı. İlk güvenli-yol kurulum hatasının dosyaları korunuyor. |
| Cache / ABI | Compiler v27, pipeline p07, schema v1, render ABI three172-cad2d-v1; scene worker SHA-256 1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280. |

Kapı sonucu: periodic AutoCAD SPLINE/knot AÇIK; HATCH runtime remesh/topology AÇIK; host bounded partition/on-demand chunk AÇIK; fill/glyph/chunk-boundary bileşik hesabı AÇIK; shader PATH_DISTANCE AÇIK; genel rendered-error matrisi PARTIAL/AÇIK; same-source AutoCAD visual/measurement AÇIK/NOT_RUN. Nested/transformed BULGE için mevcut dar oracle'lar bulunduğundan bu alt aşama olarak seçilmedi. F07 IN_PROGRESS, 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-25 — F07 DPR3 SPLINE ölçüm izi ve iç ilerleme metriği

İzlenen uçtan uca test: synthetic rational non-periodic SPLINE scene fixture → binary `CURVE_DATA`/`PATH_DISTANCE` fallback → host camera profile → `refine-curves` worker istek/yanıtları → Three line geometry → WebGL2 canvas screenshot → ayrı 4097 örnekli rational Bernstein ve raster nearest-distance hesabı. Test `tests/document-studio/cad-v2-layout-viewport.spec.ts:3655`; hedef 0.25 CSS px, son pan aynı bucket'ta no-op.

DPR/device kaydı birbirinden ayrıdır: 1280×672 CSS viewport, DPR3, 2560×1344 renderer buffer (2× cap), 3840×2016 device screenshot. 80% zoom `(k=4.864)` ve `(-10,-5)` CSS px pan `(x=630,y=331)` ile sonuçlandı. 4097 kaynak örneği / 3273 render pikseli için render→source `0.6668573448 px`, source→render `0.2322079741 px`. Worker `[0.75,0.25]×2`, 4/4 reply, pending 0, max line vertices 96.

Ölçüm ispat sınırı: kaynak AutoCAD-authored değildir; oracle testte sabitlenen rational Bernstein cubic kaynağından bağımsız değerlendirilir. Chromium config SwiftShader kullanır. Native GPU/cihaz veya AutoCAD same-source benzerliği çıkarımı yapılmaz.

F07 ilerleme raporu için planın altı ana gereksinim grubu üzerinden ortak tahmin kullanılır: 2 PASS + 4 PARTIAL; PARTIAL=0.5 ağırlıkla **(2 + 4×0.5)/6 ≈ %67 F07 iç ilerleme**. Yedi nihai kabul kapısının durumu ayrı tutulur ve F07 IN_PROGRESS kalır. Genel uygulama planı ayrıca 14/19 (%74), 5/19 açık paket durumundadır.

D: kanıtı: `D:\codex-cad-v2-f07-spline-dpr3-80-pan-20260925\playwright-run-002` ve `logs\playwright-run-002.log`; yanlış baseURL ile teste başlamayan ilk deneme `playwright-run-001` altında tutuldu. Ayrı Next cache `.next-f07-spline-dpr3-80-pan-20260925-retry`; test veri dizini silinmeden korundu.

## 2026-09-25 — PATH_DISTANCE → shader uçtan uca izi

Ölçülen zincir: canonical two-term DASHED LWPOLYLINE → full straight source segment pairs (31-unit path spans) → serialized `PATH_DISTANCE` F32 and `drawCommands[].dashStyle={24,16}` → worker unpack → renderer `lineDistance` vertex attribute → Three `LineDashedMaterial` shader → Chromium WebGL2 pixels. Tek chunk ile 6 chunk'ın 12 scalar endpoint değerleri aynı kaldı; shader-visible five-dash run'ları ve gap ölçümleri `[66–177],[275–420],[518–663],[762–907],[1005–1150]`, `[97,97,98,97]` px; screenshot hashes eşit. Bu profilin boşlukları kaynak XY'ye bake edilmemiştir.

Kanıt: `tests/cad-v2/f07-dash-render-scene.ts`, `tests/document-studio/cad-v2-layout-viewport.spec.ts` içindeki `compiler-produced DASHED WebGL output is invariant to chunk partition` ve `tests/cad-v2/linetype-phase.test.ts` metadata fallback kontrolleri. Son hedef koşu 1/1 Chromium PASS; görüntüler/log `D:\codex-cad-v2-f07-path-distance-line-shader-20260925\playwright-run-002` ve `logs\playwright-run-002.log` altında. Compiler v28 / pipeline p08 / render ABI v2; schema v1. Diğer pattern tipleri CPU fallback olduğundan nihai shader kapısı PARTIAL/AÇIK kalır.


## 2026-09-25 — Periodic SPLINE DXF alan izi

İz zinciri: DXF pair reader → group-5 handle → fields 70/71/72/73/40/41/10/20/30 → dxf-adapter canonical SPLINE → geometry validator/scene diagnostic. tests/cad-v2/dxf-periodic-spline.test.ts sentetik profilleri ASCII ve AcDbDxfFiler binary DXF üzerinden okur; flag, count, knot, control net, periodic domain kapanışı, continuity ve multiplicity 2/3 eşleşmesini sınar. Degree 0 canonical kayıtta tutulur ve tessellator tarafından reddedilir.

Fixture AutoCAD üretimi değildir. 90 s COM denemesi periodic DWG/DXF/property dump üretmedi; AutoCAD parity NOT_RUN, periodic runtime support fail-closed/AÇIK. D:\codex-cad-v2-f07-periodic-spline-acad-20260925 altında test logları ve Chromium run-003 korunur. Chromium 1/1 bu ağacın sentetik DPR1 ARC runtime regression ölçümüdür; periodic SPLINE raster testi değildir.

Güncel kimlik v29 / fidelity-v3-p08 / ABI v2 / schema v1. F07 iç metrik yaklaşık %67; genel plan 14/19=%74. Bunlar farklı paydalardır.


## 2026-09-25 — PATH_DISTANCE shader test izi

Compiler DASHED line path → PATH_DISTANCE F32 → renderer lineDistance attribute → Three LineDashedMaterial → WebGL framebuffer. Güncel testte source path 184 unit, source edge 31, dash/gap 24/16; scalar dizisi [0,31,31,62,62,93,93,124,124,155,155,184]. Tek chunk ve 6 chunk beş aynı raster run'ı ve 97/97/98/97 px gap üretti; iki framebuffer SHA-256 98878ef260eb93722877a39be4a72bc188dbbbfda24b36f83d1680980941e0a8.

linetype-phase.test.ts 12/12, hedefli Chromium 1/1. Kanıt D:\codex-cad-v2-f07-periodic-spline-acad-20260925\playwright-run-004 altında. Desteklenen dar profile doğrulandı; generic PATH_DISTANCE shader kapısı PARTIAL/OPEN. F07 iç ~%67, genel plan 14/19 (%74).


## 2026-09-25 — F07 periodic SPLINE runtime-refinement checkpoint

Trace: DXF flag/degree/knots/weights/control points → cyclic profile validation → per-span homogeneous fit → bounded source sidecar → scene binary → generation-aware Web Worker cache/fallback.

Synthetic periodic DXF SPLINE runtime refinement is now enabled for a bounded profile: degree 1–8, positive finite weights, cyclic control/weight tail, and closed active knot interval. Open/non-cyclic seams and degree 9+ fail-closed; non-periodic knot insertion is unchanged. This supersedes the earlier blanket periodic rejection only for these synthetic profiles.

Independent De Boor oracle: four 4-span profiles (F071/F074/F075/F077), 12,001 samples each (48,004 total), target 0.05 world units. Max errors 0.0188605 / 0.0326872 / 0.0364018 / 0.0361927; reported bounds 0.0254003 / 0.0441744 / 0.0488367 / 0.0482629. Simple/double/triple internal multiplicity and rational weights were included. Chromium worker refined 6 source segments to 64; bound met, stale generation dropped, LRU inline fallback passed, Float32 output 3,472 bytes.

Periodic AutoCAD-authored fixture/parity and periodic raster comparison are still missing: this gate remains PARTIAL/OPEN. A separate DPR3, 80%-zoomed-and-panned UI raster regression tested a non-periodic rational SPLINE only (3,273 pixels; render→source 0.666857 CSS px, source→render 0.232208 CSS px), so it does not close periodic or general runtime raster acceptance.

Current compiler/cache revision cad-v2-compiler-2026.09-v30; pipeline fidelity-v3-p08; DV2SCN01 schema v1 and three172-cad2d-v2 render ABI unchanged. Unit package exited 0, periodic unit and real-browser worker tests passed, runtime tsc --noEmit -p tsconfig.next.json --incremental false passed. Logs retained in D:\codex-cad-v2-f07-periodic-runtime-20260925. F07 remains IN_PROGRESS, internal estimate ~67% (2 PASS + 4 PARTIAL across 6 groups); plan 14/19 (74%), 5 packages open.


## 2026-09-25 — F07 nested affine BULGE DPR2 rendered-error checkpoint

Test izi: nested LWPOLYLINE bulge → two-level INSERT transform (inner non-uniform scale/rotation; outer mirrored non-uniform scale/rotation) → compiler CURVE_DATA/BULGE sidecar → scene binary → document host → real Web Worker refinement → WebGL2 DPR2 buffer → device screenshot.

Bağımsız kaynak oracle'ı DXF bulge ilişkisi theta=4*atan(b) ile yay merkez/radius'ını start/end/bulge'dan hesapladı; 4.097 kaynak noktasına iki INSERT affine dönüşümünü bağımsız uyguladı. %80 zoom ve +24,+12 CSS px pan sonrası kamera k=26.928623; CSS viewport 1280×672, buffer/screenshot 2560×1344. 3.105 boyalı piksel için azami render→source 0.5856469647 CSS px; source→render 0.4652905302 CSS px.

Runtime trace: 1 BULGE source ref; hedefler [0.75,0.25,0.75,0.25], 4 reply; maxLineVertexCount 98; pan'den sonra yeni istek yok ve bekleyen yanıt yok. Hedefli Playwright Chromium 1/1; chunk-error-accounting ve curve-refinement unit testleri PASS; runtime tsconfig.next typecheck PASS. Test-inclusive repo tsconfig.json tam kontrolü exit 2, yeni spec için hata vermedi fakat diğer mevcut UI testlerinde tip hataları var.

Kanıt ve test config: `D:\codex-cad-v2-f07-nested-bulge-raster-20260925`. Bu hücre rendered-error matrisine nested affine BULGE ekler; native GPU/device parity ve genel matrix tamamlanmadığı için kapı PARTIAL/OPEN. F07 ~%67; plan 14/19 (%74).

## 2026-09-26 — F07 sabit kapanış listesi ve R08/156% ölçümü

Bu kayıt, erişilebilir 91a0 checkout'undaki v30/p08/ABI v2 durumunu esas alır. Önceki v42/p19 worktree boş ve Git'e bağlı değildir. Önceki R01/R02a/R02b tamamlandı kayıtları tarihsel kanıttır; bunların kodu bu checkout'ta bulunmadığından burada tekrar PASS sayılmaz. Ana plandaki R01 production paketi ile aşağıdaki F07 iç liste farklıdır.

| F07 iç iş | Kapanacak kabul koşulu | Kapının tam PASS olması için kalan |
|---|---|---|
| R01/R02a/R02b — tarihsel, bu checkout'ta doğrulanamıyor | Uzun doğrudan LINE ve ölçülen HATCH alt profilleri | v42 kodu/fixture'ları kurtarılıp yeniden doğrulanmalı; bu turda yeniden yapılmadı |
| R03 — sıradaki; v42 önkoşullu | Genişlikli/kesikli doğrudan LINE ve 256 dilim sınırında bounded spatial chunk, painter order, PATH_DISTANCE, high-origin bbox ve viewport fetch | Tek uzun primitive, diğer geometri ve chunk yaşam döngüsü ayrıca kalır |
| R04 | LINE dışı stroke ailelerinde yerel spatial chunk | R03 ve kalan fill/glyph/pafta, bileşik hata gerekir |
| R05 | Fill, glyph ve aktif pafta chunk fetch | Bileşik hata, diğer aileler ve yaşam döngüsü gerekir |
| R06 | Fill/glyph/chunk-boundary bileşik hata muhasebesi | Bütün desteklenen aile ve zoom sınırları gerekir |
| R07 | PATH_DISTANCE shader/desen aileleri ve chunk sınırı | Stil/ölçek matrisi ve gerçek raster doğrulaması gerekir |
| R08 — bu tur 156% DPR1/DPR2 ARC alt profili ölçüldü | Geniş geometri/zoom/pan/DPR rendered-error matrisi | DPR3, diğer aile/bağlamlar ve native cihaz R09 gerekir |
| R09 | Gerçek GPU/cihaz rendered-error profili | R08 matrisi ve planın kabul cihazı gerekir; F08 bellek koşulları ayrı fazdır |
| R10 | Aynı kaynak AutoCAD görsel ve DIM oracle'ı | Native referans çıktısı, aynı kaynak/ayar karşılaştırması gerekir |
| R11 — plan gereği açıkça eklendi | Periodic SPLINE degree/knot multiplicity/domain/weights/endpoint profil matrisi | Tek ölçülmüş AutoCAD degree-3/multiplicity-2 fixture genel matrisi kapatmaz |

R11 gerekçesi ana v3 planı F07 maddelerindeki degree, knot multiplicity/domain, periodicity, weights ve endpoint doğrulama şartıdır; kurtarılan özet listede ayrı sonlu iş olarak yoktu. F07'nin yedi terminal kapısından hiçbiri bu erişilebilir checkout'ta tam kapsamıyla yeni PASS olmadı. Tarihsel kapı 1/2 profil PASS kayıtları genel profil PASS sayılmaz; kapılar 3-7 PARTIAL, native AutoCAD karşılaştırması NOT_RUN. Genel planın önceki 14/19 paketi bu turda değiştirilmedi.

R08/156% ölçümü: gerçek host/worker/WebGL2 DPR1'de 612 piksel için 0,9621349720/0,7532715925 CSS px; DPR2'de 1.544 piksel için 0,5933250455/0,4743416490 CSS px. Her iki profilde 0,25 px idle hedef, gerçek +48,+24 pan ve 1,25 px raster zarfı doğrulandı. Chromium 2/2 ve son DPR1 retry 1/1, ilgili üç test 3/3, runtime typecheck ve diff-check PASS. Kanıt D:\codex-cad-v2-r08-156-20260926-003/-004/-005. Sıradaki devam R03'tür; önce kayıp v42/p19 çalışma içeriğinin kurtarılması veya kanıta dayalı yeniden kurulması gerekir. R03 bu v30 checkout üstünde kapanmış sayılmaz.

## 2026-09-26 -- F07 internal R11 supported periodic SPLINE matrix

R03 prerequisite audit: the old v42/p19 worktree is empty and unregistered; session logs and retained output do not provide an intact source/fixture snapshot. No spatial patch was transferred to v30. Independent R11 supported synthetic DXF source/worker matrix is DONE: degree 1–8, multiplicity 1/2/3 on degree 3, active-domain shifts/scales, weights, endpoint closure, 28,007 De Boor samples with 0.0436049487 / 0.05 maximum error, and 43/43 worker spans. Unit gate and runtime typecheck passed. Seven terminal F07 gates: 0/7 fully PASS; native AutoCAD multi-profile comparison under R10 and physical GPU under R09 remain NOT_RUN. Next `devam`: R03 source recovery/reconstruction followed by wide/dashed LINE >256-slice spatial and host viewport-fetch acceptance.

## 2026-09-26 — F07 sabit liste R03 uygulama sonucu

R03 bu turda erişilebilir v30/p08 çalışma ağacında bağımsız tamamlandı; v42/p19 kodu/fixture'ı mevcutmuş gibi kullanılmadı. Genişlikli/kesikli top-level LINE spatial chunk, painter order, PATH_DISTANCE, high-origin bbox, >256 dilim partial sınırı ve host viewport fetch kabul profili eklendi. 12.000 world-unit LINE 3 chunk; 1e9 origin bbox/uç oracle'ı PASS; 1.100.000 world-unit LINE 269 slice gerektireceğinden tek chunk'ta korunup qualityStatus=degraded ve DIRECT_LINE_SPATIAL_PARTITION_LIMIT_REACHED tanısı alır.

R03 doğrulaması: yeni compiler testi 24 assertion; painter-order, scheduler/cache, layout viewport 9/9; Chromium'da host viewport fetch 1/1, layout selection 1/1 ve DASHED PATH_DISTANCE one/six-chunk raster equality 1/1; runtime tsconfig.next typecheck PASS. Tam unit/release zinciri bu turda çalıştırılmadı. Compiler/cache v31, pipeline p08, schema v1, ABI v2.

Paket R03 kapsamı tamamlandı; bununla yedi terminal F07 kabul kapısının hiçbiri genel kapsamıyla kapanmadı: 0/7 tam PASS. Genel planın önceki 14/19 paketi ve 5 açık paket değişmedi.

| Sonraki paket | Somut kalan iş |
|---|---|
| R04 | LINE dışı stroke ailelerinde spatial chunk: curve/polyline/bulge kaynak ailelerini, phase ve sınırları ile sınırlı partial sözleşmeyi test et. |
| R05 | Fill/glyph ve aktif pafta chunk fetch; host layout/camera görünürlüğünü bu geometrilere bağla. |
| R06 | Fill/glyph/chunk-boundary bileşik hata muhasebesi. |
| R07 | PATH_DISTANCE shader desen aileleri ve chunk sınırı matrisi. |
| R08 | DPR3, ek geometri/zoom/pan ve bağlam rendered-error ölçümleri. |
| R09 | F08 bellek yaşam döngüsünden ayrı olarak gerçek GPU/cihaz rendered-error ölçümü. |
| R10 | Aynı kaynak AutoCAD görsel ve DIM oracle'ı; native karşılaştırma şu ana kadar NOT_RUN. |
| R11 | Periodic SPLINE degree/knot multiplicity/domain/weight/endpoint profil matrisi; tek sentetik/AutoCAD fixture genel matris değildir. |

Bir sonraki devam: R04.

## 2026-09-26 — F07 R04 doğrudan stroke izlenebilirliği

| Profil | Kaynak/binary/worker kanıtı | Durum |
|---|---|---|
| Direct CIRCLE / ARC / ELLIPSE / SPLINE | 1e9 origin; 4 / 3 / 3 / 3 bounded chunk; her chunk CURVE_DATA + META provenance ve worker interval kabulü | R04 PASS, bu profiller |
| Direct widthless LWPOLYLINE/BULGE | Bulge yan verisi; 12.000-unit düz devam; monoton PATH_DISTANCE; geç overlay sırası | R04 PASS, bu profil |
| 256-chunk sınırı | 1.100.000-unit kenar, 600.000-radius daire, 299 kenarlı zikzak; geometri korunur, ayrı diagnostic/degraded | bounded PARTIAL sözleşmesi |
| Host viewport fetch | Gerçek Chromium host yakın chunk ilk fetch, uzak chunk görünür olunca fetch; 1/1 | PASS, genel fetch yolu |
| Nested INSERT / pafta stroke, width mesh, HATCH, glyph, tüm dash ailesi | Bu R04 oracle kapsamında yok | AÇIK |

Doğrulama: tam CAD V2 unit zinciri PASS, runtime tsconfig.next PASS, R04 doğrudan test PASS, Chromium 1/1 PASS. Test-kapsamlı tsconfig.json eski hatalarla exit 2. F07 terminal kapı 0/7 tam PASS; planın son belgeli sayımı 14/19, 5 açık. Compiler/cache v32, pipeline p08, schema v1, ABI v2. Sonraki devam: R05 fill/glyph ve aktif pafta chunk fetch; nested/pafta stroke boşluğu bu kapsamda ayrıca izlenmeli.

## 2026-09-26 — F07 iç R05 kanıt matrisi

| Kapsam | Kanıt | Durum |
|---|---|---|
| HATCH adaları / genişlikli LWPOLYLINE | 4×100×100=40.000 alan; 12.000×20=240.000 alan ve 12 üçgen; bounded chunk | R05 PASS, doğrudan profiller |
| TEXT / MTEXT | 1e9 yüksek origin; sıralı bounded chunk; lokal XY <4.096 | R05 PASS, doğrudan profiller |
| WIPEOUT / glyph / 256-grup sınırı | Büyük tek üçgen/glyph ve 299-edge fill geometriyi korur; ayrı degraded tanıları | bounded PARTIAL sözleşmesi |
| Aktif pafta fetch | Chromium 1/1: Model, SHEET_A yakın fill, zoom sonrası uzak glyph, seçim sonrası SHEET_B; her chunk bir kez | R05 PASS, host profili |
| Nested INSERT / viewport-projected fill/glyph | R05 oracle kapsamında değil | AÇIK |

Hedefli testler, tam check:cad-v2:unit ve runtime tsconfig.next PASS; test-kapsamlı tsconfig.json mevcut hatalarla exit 2. Compiler/cache v33, pipeline p08, schema v1, ABI v2. F07 terminal 0/7 tam PASS, son belgeli plan 14/19 (5 açık). Sonraki devam: R06 fill/glyph/chunk composite; nested/viewport boşluğu ayrıca izlenir.

## 2026-09-26 — F07 iç R06 kanıt matrisi

| Kapsam | Bağımsız kanıt | Durum |
|---|---|---|
| Temas eden HATCH fill chunk'ları | Bilinen dört dikdörtgen köşesi ile binary round-trip; çift 2.384185791015625e-7 world | R06 statik PASS |
| Uzun glyph chunk sınırı | Dönük yüksek-origin glyph; çift 0.00008489787140318244 world | R06 statik PASS |
| Fill→glyph painter chunk sınırı | Geniş dolgu üstüne sonraki glyph; çift 1.1920928955078125e-7 world | R06 statik PASS |
| Aynı chunk fill+glyph | Bilinen fill köşeleri ve glyph segment uçları; toplam 0.000028610479930766117 world; 0,25 CSS px birleşik eşik tanısı | R06 statik PASS |
| Uzak fill+glyph, manifest bütünlüğü | Etkileşim sıfır; negatif ve flat/index çelişkili metrik reddi | PASS |
| Non-adjacent chunk, nested/viewport glyph, font outline, worker/GPU raster | Bu statik oracle kapsamında değil | AÇIK |

Tam check:cad-v2:unit ve runtime tsconfig.next PASS. Test-kapsamlı tsconfig.json mevcut 212 tanıyla exit 2; R06 dosyalarında tanı yok. Compiler/cache v34, pipeline p08, schema v1, ABI v2. F07 terminal 0/7 tam PASS; son belgeli plan 14/19 (5 açık). Sonraki devam: R07 PATH_DISTANCE shader/desen ailesi ve chunk sınırları.

## 2026-09-26 — F07 iç R07 çok terimli desen kanıtı

| Profil | Ölçüm | Durum |
|---|---|---|
| Uzun CENTER LINE | 12.000 world unit, 1e9 origin, 3 bounded chunk, kesintisiz PATH_DISTANCE | PASS, kaynak/binary |
| CENTER/PHANTOM/leading-gap polyline | 1/6 chunk'ta aynı 12 mesafe; 4/6/4 terimli işaretli desen korunur | PASS, kaynak/binary |
| CENTER gerçek WebGL2 | 1/6 chunk'ta 8 aynı koşu; SHA-256 f648aab259891d658e1b861175b5e26f5617d9a9c33fd5dd8a58307e72958b6a | PASS, Chromium 1/1 |
| İki terimli DASHED regresyonu | 1/6 chunk'ta 5 aynı koşu; eski hash 264758117837085532fc5ad17b5f5b9ff469b550540ccf1a0dd14e68d678545b | PASS |
| Dot, kalın, kapalı; eğri/bulge/shape, model/pafta/mirrored | İlk üçü CPU fallback; geniş rendered/AutoCAD faz matrisi yok | R07 PARTIAL/AÇIK |

Linetype 12/12, yeni hedefli test, tam CAD V2 unit, runtime tsconfig.next PASS; genel tsconfig mevcut 212 tanıyla exit 2. Compiler/cache v35, pipeline p08, schema v1, ABI v2. F07 terminal 0/7 tam PASS; son belgeli plan 14/19 (5 açık). Sonraki devam: R07 kalan eğri/kapalı/nokta/shape ve ölçek profilleri; sonra R08 geniş rendered-error matrisi.

## 2026-09-26 — R07 bulge/dot izlenebilirliği

Kod: geometry-compiler.ts getBulgeArcParameters erişimi; scene-compiler.ts kaynak-vertex analitik dash fazı; cad-stroke.ts sonlu teğet nokta; version.ts compiler v36. Kanıt: analytic-bulge-dash.test.ts (8 nokta, 40 PATH_DISTANCE, 10/20 birim sınır, kapalı kenar), f07-dash-render-scene.ts ve cad-v2-layout-viewport.spec.ts (Chromium/WebGL2 1/36 chunk, 846 piksel, eşit SHA-256). Tam unit zinciri ve runtime typecheck PASS; AutoCAD/native parite henüz yok.

## 2026-09-26 — R07 kalın DASHED izlenebilirliği

Kod: cad-v2-host-shell.tsx renderer-ready lineweight ayarı; cad-v2-view-settings-panel.tsx erişilebilir toggle. Kanıt: wide-dash-phase.test.ts dört kaynak ağırlığı/ölçek 2/binary 1:çok chunk; f07-dash-render-scene.ts ve cad-v2-layout-viewport.spec.ts gerçek Chromium 1:5 chunk, 16.728→1.387→16.728 piksel ve geri gelen kırmızı maske toplamı 4205881069. Tam PNG tek/çok chunk hash eşit; toggle sonrası PNG byte hash'i farklı olduğu için görünür kırmızı piksel maskesi kabul ölçütüdür. Compiler/cache v36, F07 0/7 tam PASS; native AutoCAD ve model/pafta/mirrored matris açık.

## 2026-09-26 — R07 aynalı/pafta LINE faz izlenebilirliği

Kod: entity-visitor.ts source-first LINE dash ve XCLIP mesafe interpolasyonu; scene-compiler.ts INSERT/viewport PATH_DISTANCE aktarımı ve sıfır uzunluklu sınır elemesi; version.ts compiler v37. Kanıt: transformed-dash-phase.test.ts kaynak/binary ayna 1:5, viewport 1:3, doğrudan pafta shader 20/20; f07-dash-render-scene.ts + cad-v2-layout-viewport.spec.ts Chromium/WebGL2 ayna 1.211, viewport 727 kırmızı piksel ve iki partition için eşit tam PNG SHA-256. Unit zinciri, runtime typecheck ve browser 1/1 PASS; AutoCAD, global/annotation ölçek ve diğer affine eğri aileleri açık.


## 2026-09-27 — R07-E linetype traceability

| Requirement | Implementation | Current evidence | Remaining |
|---|---|---|---|
| DXF LTYPE table reaches canonical | `decode/dxf-adapter.ts`, `decode/dxf-linetype-pairs.ts` | `complex-linetype.test.ts`, ASCII and binary source | Complex glyph geometry |
| DWG LTYPE table reaches canonical | `decode/dwg-adapter.ts`, `decode/linetype-record.ts` | R001 P04 decoder test: 8 records; synthetic DWG-shaped record metadata test; libredwg error 68 logged | Real complex DWG glyph profile and clean decode oracle |
| Unsupported shape/text is visible to quality accounting | `canonical/diagnostics.ts`, `linetype-record.ts` | Scene diagnostic code and explicit `isContinuous=false` assertion | Correct rendered shape/text, font/SHX profile and AutoCAD comparison |

Fixture identity: `known-geometry-measurements.dxf` SHA-256 DDFC5AE7D57860B35B4EC66A653D247E6A9DFAD658E739ECC132EFB2EB6B0DD9; R001 DWG SHA-256 17A92CB544830845FC59717ABCC22D3CDCF97C12B8450602C9C70EC4A507F086. Test source SHA-256 EC209F51EC577FB77C0BEEE171E8C80F3B16188715010D060D35B0359340DEBF.

Commands: `npx tsx tests/cad-v2/complex-linetype.test.ts`; `npx tsx tests/cad-v2/decoder-field-contract.test.ts`; `npx tsx tests/cad-v2/linetype-phase.test.ts`; `npx tsx tests/cad-v2/cache-identity.test.ts`; `npx tsc --noEmit --target es2020 --module esnext --moduleResolution bundler --jsx preserve --skipLibCheck --esModuleInterop --allowSyntheticDefaultImports tests/cad-v2/complex-linetype.test.ts`. All passed. Compiler/cache v37→v38. F07 remains 0/7; R07-E is partial.

Changed-source SHA-256: `dxf-linetype-pairs.ts` 40E62E00B56D2A2ACBCBA39EF56BF60389279EDE528A91E2365039A92B268C90; `linetype-record.ts` 11E86744239903CC24B5565BFBE4E97D8156AC464478F8EA9438CE0BCAC59B22; `dxf-adapter.ts` 4182DE50D3456274801C4514BC059FFB4E59F3C921E9B14A2B1D684E757CEAAA; `dwg-adapter.ts` D72B1CA858A863D2310F175E183B338F096CDDAC7791054FF054594E80996707; `canonical/types.ts` 9E75F7A52D04BC5E093D968DF9B73D1186893FC1232D089C6C32E8D418BC83D0; `canonical/diagnostics.ts` FA1841DACDF0E2E5572015AFB5C2DBAD3DA169E8AC47ED4ABA06410B36BBED9E; `version.ts` 5AA4F84D2A07C2AC8C40ED458C5F7DDED174369BB468A0845B972D3333C9A8D6; `decoder-field-contract.test.ts` 9FE751455B2FDB9781B540CE63FE538B35C8B3C50F7E580909F729AE5FB1D509; `package.json` 28204DD7718E641E33B865E64AF92AFD4456620B1D6B551326B406FB5B5CCC40.

## 2026-09-27 — R07-E STYLE/source-handle traceability

| Requirement | Implementation | Current evidence | Remaining |
|---|---|---|---|
| DXF STYLE details reach canonical | `decode/dxf-style-pairs.ts`, `decode/text-style-record.ts`, `decode/dxf-adapter.ts` | complex fixture ASCII+binary: font/shape records, handles and LTYPE references match | No glyph geometry |
| DWG STYLE table reaches canonical | `decode/dwg-adapter.ts`, `decode/text-style-record.ts` | R001 P04: 12 entries; `Standard` font `arial.ttf`; error 68 logged | Clean complex DWG oracle |
| Group 74 type bits | `canonical/types.ts`, `complex-linetype.test.ts` | text bit 2, shape bit 4 | Rendering and AutoCAD profile |
| Simple DWG pattern defaults are not complex glyphs | `decode/linetype-record.ts` | three project DWGs: 14/6/8 LTYPE records, zero false complex metadata/warnings after fix; decoder errors 64/68 remain | A clean complex DWG profile |

Compiler/cache v40; pipeline p08, schema 1, ABI `three172-cad2d-v2`. Autodesk group-74 and complex text/shape semantics: [LTYPE DXF](https://help.autodesk.com/cloudhelp/2020/ENU/AutoCAD-DXF/files/GUID-F57A316C-94A2-416C-8280-191E34B182AC.htm), [text in custom linetypes](https://help.autodesk.com/cloudhelp/2021/ENU/AutoCAD-Customization/files/GUID-FEDCE7EB-4919-43AE-A54E-F3A293DD60CA.htm), [shapes in custom linetypes](https://help.autodesk.com/cloudhelp/2020/ENU/AutoCAD-MAC-Customization/files/GUID-AF0613E6-5C8B-47F0-800C-8B2524BF2015.htm). Current-tree source/test and inspected-fixture hashes are recorded below; no commit/push/PR/deploy was made.

### R07-E current-tree SHA-256 — 2026-09-27

These hashes identify the dirty active worktree state used by the targeted checks; they are not commit identities.

| Kind | Path | SHA-256 |
|---|---|---|
| Source | `src/lib/cad-v2/decode/dxf-style-pairs.ts` | `5638F584DA38654217C3B07B3E914430304566EB9AE3EAC4FD31A680498748FC` |
| Source | `src/lib/cad-v2/decode/text-style-record.ts` | `DCE9FA17BE1732C63CEEEE565C8BBE6CF550C9BFF987BD813DE116431A318938` |
| Source | `src/lib/cad-v2/decode/linetype-record.ts` | `AFA08FEF1628F18547532A8D6B4CAA0C514EFCCFED5D74C4803E3791F7BC6409` |
| Source | `src/lib/cad-v2/decode/dxf-adapter.ts` | `90E56B2A6A36DBDFC05A145CE68B1F121DE9E98B0BCDC2F77B0C07FBADBBA291` |
| Source | `src/lib/cad-v2/decode/dwg-adapter.ts` | `434E0A368E6292F405A768D4C0FD5321D06340292ED647A975ED02A7A58E265E` |
| Source | `src/lib/cad-v2/canonical/types.ts` | `A36274AE4952CFF86F1E91EA1B8AA90D6A2E228153EFFC758EAAB09E2F0FE07D` |
| Source | `src/lib/cad-v2/version.ts` | `5255891A375B29451DA61A675ABBF792424E6EBBCE12213ADC7FD03AC5435E41` |
| Test | `tests/cad-v2/complex-linetype.test.ts` | `90014CF306B58AA0E6A7963112F304A2BE2EC743DA82EA9E49BAB7973BD701CA` |
| Test | `tests/cad-v2/decoder-field-contract.test.ts` | `E601BA005089FF3FC9B692A9D9CECB76E2D59C259BDBAD64A0BF4056E97B7BC9` |
| Fixture | `tests/fixtures/cad-preview-v2/known-geometry-measurements.dxf` | `DDFC5AE7D57860B35B4EC66A653D247E6A9DFAD658E739ECC132EFB2EB6B0DD9` |
| Inspected drawing | `eklediklerim/ornek_dosyalar/MUSTAFA SELVİ 1.KISIM STATİK.dwg` | `8FF5680FA4F9D570FED738DEF92BC6CA8149FDE1B5AED9E0A495DD2BAAF521E6` |
| Inspected drawing | `eklediklerim/ornek_dosyalar/kiris_acilimlari_tum_katlar.dwg` | `9A59FF9E5496E2A3C62B378F062E5F0F3CFA707B9BD4B5A0BF6749CD8BF52459` |
| Inspected drawing | `eklediklerim/ornek_dosyalar/1 ve 2.kat dwg.dwg` | `17A92CB544830845FC59717ABCC22D3CDCF97C12B8450602C9C70EC4A507F086` |

Targeted checks on this state: `complex-linetype.test.ts`, `decoder-field-contract.test.ts`, `linetype-phase.test.ts`, `cache-identity.test.ts` and scoped TypeScript compilation passed. The two DXF/DWG decoder checks and fixture evidence do not constitute clean full-DWG or glyph-render acceptance; R001 still logs libredwg error 68.

## 2026-09-27 — R07-E native DWG style reference and standalone placement fixture

| Requirement | Implementation | Current evidence | Remaining |
|---|---|---|---|
| DWG dash STYLE reference | `decode/dwg-linetype-style-refs.ts`, `decode/dwg-adapter.ts` | pre-free native pointer scan; `dwg_ref_get_id`; allowlisted against converted STYLE table handles; fake API join test | No local DWG contains a populated complex dash STYLE reference; R001 error 68 |
| Shape/text source placement | `tests/fixtures/cad-preview-v2/r07-complex-linetype-placement.dxf` | source ASCII/binary fixture covers group 74/75/340/46/50/44/45/9 and mapped font probe | Synthetic DXF only; missing SHX, no glyph geometry or raster evidence |
| Cache/source identity | `src/lib/cad-v2/version.ts` | compiler/cache v41; cache-identity test passed | No scene output changes until glyph geometry is implemented |

Generic DWG object-reference evidence: an R001 DIMSTYLE probe resolved STYLE IDs/names including `11`/`Standard` and `8C90`/`ROMANT`. This verifies Libredwg's generic reference resolver, not a populated `Dwg_LTYPE_Dash.style` pointer in a clean file. Targeted current-state checks passed: `dwg-linetype-style-refs.test.ts`, `complex-linetype.test.ts`, `decoder-field-contract.test.ts` (error 68 remains), `linetype-phase.test.ts`, `cache-identity.test.ts` and scoped TypeScript compilation. AutoCAD/accoreconsole/ODA converter were not found on PATH; no SHX/LIN asset exists in the checkout. Synthetic field fidelity does not promote R07-E or F07 acceptance.

Current v41 source/test/fixture hashes for this group’s dirty worktree state (not commit IDs):

| Kind | Path | SHA-256 |
|---|---|---|
| Source | `src/lib/cad-v2/decode/dwg-linetype-style-refs.ts` | `036A8BE264A8481B3F58E76AB7D2D477F898A9B4633B70B83CC395513638F897` |
| Source | `src/lib/cad-v2/decode/dwg-adapter.ts` | `CFBC5DAB019C177E3E288A7A766CC3540D5D080BBBBF8B6B71953C48C8B5DD43` |
| Source | `src/lib/cad-v2/version.ts` | `537DC278EF5EE2E45929BBBE67744483111F76F97C1C909367262F751F699EEA` |
| Test | `tests/cad-v2/dwg-linetype-style-refs.test.ts` | `0A20E00C1AEEB6D278385B4AECC2613360DE553B33740D0F4A1690536A672E51` |
| Test | `tests/cad-v2/complex-linetype.test.ts` | `807EC396200BC1DDCA67C57B217CE987BC414E20537DA07D119F41304D543FC0` |
| Fixture | `tests/fixtures/cad-preview-v2/r07-complex-linetype-placement.dxf` | `C448715A57E147231DCAA29983CEC3C1133161708C42BE7DA3CF08C8075DF2AC` |

## 2026-09-27 — R07-E exact-font glyph geometry and source phase

The v42 compiler joins each LTYPE complex element to canonical STYLE identity, produces SHX shape or TEXT line geometry through existing font/layout APIs, repeats by source pattern distance, and emits it through direct LINE and `EntityVisitor` paths. Bit-1 absolute rotation, tangent-relative rotation, scale and X/Y offsets are honored. A rotation-only bit without embedded text/shape is inert metadata; it does not emit a false warning. Missing/non-exact resources produce a compile-time unsupported diagnostic and degraded quality; ordinary source dash geometry remains present. Straight-source glyphs therefore follow existing spatial chunking without resetting their source placement.

| Control | Result |
|---|---|
| `npx tsx tests/cad-v2/complex-linetype.test.ts` | PASS — ASCII/binary source fields, missing SHX degradation, exact synthetic SHX shape + bundled Arial text, absolute/relative rotation, inert rotation-only metadata, x=4096 phase/chunk seam, mirrored INSERT |
| `npx tsx tests/cad-v2/path-distance-multiterm.test.ts` | PASS — existing multi-term source phase/chunk baseline |
| `npx tsx tests/cad-v2/transformed-dash-phase.test.ts` | PASS — existing mirrored and viewport dash phase regression |
| `npx tsx tests/cad-v2/cache-identity.test.ts` | PASS — v42 compiler identity invalidates scene identity |
| Scoped changed-module TypeScript command | PASS — TypeScript 5.6, target ES2020, changed helper/visitor/compiler/decoder/version/test and `src/types/opentype.d.ts` |
| `npx tsc --noEmit --incremental false` | FAIL (exit 2) — existing unrelated repository scripts/tests; filtered output contained no diagnostics in changed CAD modules/test |
| Source `git diff --check` | PASS for changed CAD implementation/test paths. Repository-wide check still reports CRLF whitespace in earlier dirty evidence docs. |

No AutoCAD/accoreconsole/ODA converter, actual SHX/LIN resource, or DWG with a populated complex dash `style` pointer was available. Existing R001 path still emits libredwg error 68. The in-memory SHX profile proves compiler geometry wiring only, not CAD-native glyph parity. Curved-source complex glyph placement and native/raster comparison remain open. F07 terminal gates are 0/7; overall 14/19 remains historical. Next group: map embedded glyph placement onto ARC/CIRCLE/BULGE and other supported curved source distances, then verify curve phase/chunk boundaries.

Relevant Autodesk DXF contract: [LTYPE group codes](https://help.autodesk.com/cloudhelp/2020/ENU/AutoCAD-DXF/files/GUID-F57A316C-94A2-416C-8280-191E34B182AC.htm) defines group 74 absolute/text/shape flags and group 50 rotation in radians.

Dirty `91a0` source state on branch `codex/srdr-dwg-motor-v2-fidelity`, HEAD `4b51ebe6b1470c6a247e03158dfe4b5359621c97`; compiler/cache v42, pipeline p08, schema 1, ABI `three172-cad2d-v2`. Current SHA-256:

| Kind | Path | SHA-256 |
|---|---|---|
| Source | `src/lib/cad-v2/compile/complex-linetype-glyphs.ts` | `DCC7466A02C18EB183E073AEDFBF51A152138BEB96C06492E24DE35800729789` |
| Source | `src/lib/cad-v2/compile/entity-visitor.ts` | `DA069F1F5C16C53A5B0BBBECEE5ACF1B06745BB8BDE67FA0E6FCD72371898C19` |
| Source | `src/lib/cad-v2/compile/scene-compiler.ts` | `4F8055451A52E0462393D9856E06F5F06315E65A210243B0B7F79AA44A684EF2` |
| Source | `src/lib/cad-v2/decode/linetype-record.ts` | `C621BF4EC5FC352567002DE153F2E4F4E9A93B9A7AB8AA2106CFE56B9F29DFC5` |
| Source | `src/lib/cad-v2/version.ts` | `286F05D1F136C3694BB84A4E7AF2259B5906B1A9E811B0601C546B065857FB81` |
| Test | `tests/cad-v2/complex-linetype.test.ts` | `94EAAC390A7712EB3AA39A4DDE5FDD9A675BEBACE45D4242CFFED3E585FA87B7` |

## 2026-09-27 — R07-E curved-source geometry and phase (compiler/cache v43)

The v42 straight-line helper now has a source-path station evaluator. ARC and CIRCLE use exact radius×sweep distances and analytic tangent direction. LWPOLYLINE combines straight edges and exact bulge arc lengths; `plinegen=false` resets the complex pattern per edge, and closed circles omit the duplicate terminal anchor. ELLIPSE and SPLINE use their bounded tessellation path, with that approximation recorded as a limitation. Direct scene glyphs and `EntityVisitor` glyphs are emitted in source coordinates before nested/viewport affine transforms. Empty/non-complex linetypes return before curve sampling, avoiding tessellation work on ordinary drawings.

The synthetic SHX acceptance in `complex-linetype.test.ts` checks six anchors on a radius-50 quarter ARC at 15-unit spacing, 21 unique CIRCLE anchors, and 11 anchors on a bulge-1 semicircle. It also checks `PLINEGEN=1` continuation against `PLINEGEN=0` per-edge restart. A radius-4200 CIRCLE is split over spatial chunks and its encoded glyph-stroke count matches the helper expectation exactly; the same source with `complexElements` removed is the baseline. A nested mirrored ARC adds the expected source glyph count without a quality warning. These tests verify local geometry plumbing and chunk survival, not a CAD-native raster oracle.

| Control | Current result |
|---|---|
| `npx tsx tests/cad-v2/complex-linetype.test.ts` | PASS — analytic ARC/CIRCLE/BULGE stations, direct curve chunk count, nested mirrored ARC, plus prior LINE/font/decoder cases |
| `npx tsx tests/cad-v2/analytic-bulge-dash.test.ts` | PASS — analytic bulge, closed edge and dot arcs |
| `npx tsx tests/cad-v2/path-distance-multiterm.test.ts` | PASS — multi-term PATH_DISTANCE regression |
| `npx tsx tests/cad-v2/transformed-dash-phase.test.ts` | PASS — mirror/viewport phase regression |
| `npx tsx tests/cad-v2/direct-line-spatial-partition.test.ts` | PASS after replacing its obsolete v37 literal with `CAD_V2_COMPILER_REVISION` |
| `npx tsx tests/cad-v2/non-line-stroke-spatial-partition.test.ts` | PASS — curve/bulge spatial partition, sidecars, phase and bounded fallback |
| `npx tsx tests/cad-v2/cache-identity.test.ts` | PASS — active v43 compiler identity |
| Scoped TypeScript check | PASS — helper, visitor, scene compiler, version and touched tests with strict options |

Compiler/cache is `cad-v2-compiler-2026.09-v43`; pipeline `fidelity-v3-p08`, schema 1 and ABI `three172-cad2d-v2` unchanged. F07 remains 0/7 fully accepted and the overall 14/19 count remains historical. Positive complex DWG style reference, real SHX asset and same-source AutoCAD acceptance remain open. R07-E stays partial. Next group: R07-F affine curved-source transforms and source phase across transformed/chunked placements.

Dirty source state: branch `codex/srdr-dwg-motor-v2-fidelity`, HEAD `4b51ebe6b1470c6a247e03158dfe4b5359621c97`; no staging or commit. Current source/test SHA-256:

| Kind | Path | SHA-256 |
|---|---|---|
| Source | `src/lib/cad-v2/compile/complex-linetype-glyphs.ts` | `100A13C39554731F930CACC97E8530C288FCCAEB050BD1705DA183BDC3DA27C4` |
| Source | `src/lib/cad-v2/compile/entity-visitor.ts` | `F34A3CA5FCBAB95149FA1A701FC124DAFF9477E2783956AD4C8E55CABF668345` |
| Source | `src/lib/cad-v2/compile/scene-compiler.ts` | `D138C90AFD3205C3A0266329A5FA8A57679F8F19C0EA19B93208CB74CAEA1FF9` |
| Source | `src/lib/cad-v2/version.ts` | `B4E6A6913E87D99B82C6A1CEDDDC8B924A281222F63FB93C2D20F9E933EFF943` |
| Test | `tests/cad-v2/complex-linetype.test.ts` | `99B934A1CA9EB8B4430B0EBBD43DEE732FB80958DAF7E31A8889E3AD4797D48E` |
| Test | `tests/cad-v2/direct-line-spatial-partition.test.ts` | `23AAA51CE05A087B788B2A42EF57DE89B1CB0EE2E663B0163C82073C9381D92F` |

## 2026-09-27 — R07-F affine source glyph and nested spatial partition (v44)

Active checkout remains `C:\Users\hsyn\.codex\worktrees\91a0\muhendis-mimar-portali`, branch `codex/srdr-dwg-motor-v2-fidelity`, HEAD `4b51ebe6b1470c6a247e03158dfe4b5359621c97`, dirty. This group changed `scene-compiler.ts` and compiler/cache version only; pipeline p08, schema 1 and ABI `three172-cad2d-v2` remain unchanged.

| Check | Result |
|---|---|
| `npx tsx tests/cad-v2/complex-linetype.test.ts` | PASS after the test first reproduced the nested INSERT single-range gap; affine source endpoints for ARC/CIRCLE/BULGE/ELLIPSE/SPLINE, multi-chunk CIRCLE and paper viewport glyph deltas pass |
| `npx tsx tests/cad-v2/direct-line-spatial-partition.test.ts` | PASS |
| `npx tsx tests/cad-v2/non-line-stroke-spatial-partition.test.ts` | PASS |
| `npx tsx tests/cad-v2/transformed-dash-phase.test.ts` | PASS |
| `npx tsx tests/cad-v2/painter-order.test.ts` | PASS |
| `npx tsx tests/cad-v2/entity-instance-parity.test.ts` | PASS |
| `npx tsx tests/cad-v2/block-expansion-budget.test.ts` | PASS |
| `npx tsx tests/cad-v2/cache-identity.test.ts` | PASS |
| `npx tsc --noEmit -p tsconfig.next.json --incremental false` | PASS |
| Strict standalone TSC of `tests/cad-v2/complex-linetype.test.ts` and `src/types/opentype.d.ts` | PASS |
| `git diff --check -- src/lib/cad-v2/compile/scene-compiler.ts src/lib/cad-v2/version.ts` | PASS |
| Browser/WebGL raster comparison | NOT_RUN in this group; next R07-F work |
| Positive complex DWG/actual SHX and same-source AutoCAD raster | NOT_AVAILABLE / R10 external dependency |

Current SHA-256:

| Path | SHA-256 |
|---|---|
| `src/lib/cad-v2/compile/scene-compiler.ts` | `DB03362FF75EF0081B5C84FD5B0E580779E004CC521F0140998A7AECDEBFAF21` |
| `src/lib/cad-v2/version.ts` | `4A2DAE8F1A1C803178B4080E7E75ECD1B160BF1CD859B7E05749589B14303E5D` |
| `tests/cad-v2/complex-linetype.test.ts` | `C80C26F08CADE1D27B051505AE24775E8E959E9BF961132F26E4A354AA567B2C` |

The new curve-family oracle is local synthetic geometry only; it makes no native fidelity claim. F07 stays 0/7 terminal gates; 14/19 remains historical. No staging, commit, push, PR or deploy.

## 2026-09-27 — R07-F nested affine SHX WebGL raster (v44)

**Scope and result.** Added `tests/cad-v2/r07-affine-glyph-raster-scenes.ts`, which compiles one curved ARC+SHAPE source through two nested affine INSERTs into Model and a SHEET viewport. Its synthetic SHX font is deterministic and exact only within this in-memory fixture. A single-chunk compile is compared with the same geometry compiled at `maxPrimitivesPerChunk: 1`. Added `tests/document-studio/cad-v2-affine-glyph-raster.spec.ts` to upload two known-geometry host fixtures, serve the compiler scenes through CAD V2 routes, render Chromium/WebGL canvases, and compare full PNG SHA plus red-pixel masks. Both manifests are exact with no diagnostics. Model chunk counts are 1/52; paper counts are 1/46.

| Check | Result |
|---|---|
| `npx tsx tests/cad-v2/r07-affine-glyph-raster-scenes.ts` | PASS — exact Model and SHEET scenes, 1/52 and 1/46 chunks, zero diagnostic codes |
| `npx playwright test --config=playwright.config.ts tests/document-studio/cad-v2-affine-glyph-raster.spec.ts --project=chromium --reporter=line` | PASS — 1/1, 29.2 s; single/split masks and full PNGs byte-identical per layout |
| Model raster | PASS — 1,427 red pixels, FNV mask `2274897639`, PNG SHA-256 `dadeb8a9a163248bf7bfab822b0ea3f6e92dcc7929b8c559900b54062804f232` |
| SHEET paper viewport raster | PASS — 2,512 red pixels, FNV mask `2058749244`, PNG SHA-256 `042215ee2da430e27c77cf528c5a507df58ae56f0d0f2ed3574864421d9d3733` |
| `npx tsc --noEmit -p tsconfig.next.json --incremental false` | PASS |
| `npx tsx tests/cad-v2/complex-linetype.test.ts` | PASS |

The first Playwright run timed out because the harness selected layout ID `SHEET`, while the product picker uses the visible layout name, and the fake view session's real heartbeat returned 410 and triggered re-prepare. The harness now selects `R07 affine curved SHX` and returns a successful heartbeat. The rerun passed; no product behavior, threshold or profile was relaxed. The runner emitted no successful PNG artifact; the full image hashes above are the retained raster evidence.

**Scope status.** R07-F local affine geometry, bounded chunk survival, viewport projection and Chromium raster profile are complete. This is not real SHX/DWG or AutoCAD parity. R07-E still lacks a positive complex DWG dash STYLE reference and distributable SHX; R07-H/R10 same-source AutoCAD comparison remains NOT_RUN. R07-G scale semantics is next. F07 terminal gates remain 0/7; overall 14/19 remains historical. Compiler/cache v44, pipeline p08, schema 1, ABI `three172-cad2d-v2`; branch `codex/srdr-dwg-motor-v2-fidelity`, HEAD `4b51ebe6b1470c6a247e03158dfe4b5359621c97`, dirty.

| Artifact | SHA-256 |
|---|---|
| `src/lib/cad-v2/compile/scene-compiler.ts` | `DB03362FF75EF0081B5C84FD5B0E580779E004CC521F0140998A7AECDEBFAF21` |
| `src/lib/cad-v2/version.ts` | `4A2DAE8F1A1C803178B4080E7E75ECD1B160BF1CD859B7E05749589B14303E5D` |
| `tests/cad-v2/complex-linetype.test.ts` | `C80C26F08CADE1D27B051505AE24775E8E959E9BF961132F26E4A354AA567B2C` |
| `tests/cad-v2/r07-affine-glyph-raster-scenes.ts` | `15B5A4F6F81391226D9CF594F9D6DB7182F8FE6E3125064ACE26EB0C1EBC1E37` |
| `tests/document-studio/cad-v2-affine-glyph-raster.spec.ts` | `CAD2B7B6CE6EFFF80104B8BF63485F69F00CD4D0BF0423481426BD0E1CAC8B1E` |

No commit, push, PR, merge, deploy or staging was done.

## 2026-09-27 — R07-G global and viewport linetype scaling, v45

**Run identity.** Active worktree `C:\Users\hsyn\.codex\worktrees\91a0\muhendis-mimar-portali`, branch `codex/srdr-dwg-motor-v2-fidelity`, HEAD `4b51ebe6b1470c6a247e03158dfe4b5359621c97`, dirty with pre-existing user/session modifications retained. Group ran 08:57:32–09:11:54 UTC. Compiler/cache `cad-v2-compiler-2026.09-v45`; pipeline `fidelity-v3-p08`; schema1; ABI `three172-cad2d-v2`.

**Evidence and results.** `npx tsx tests/cad-v2/linetype-scale-settings.test.ts` PASS for ASCII/binary DXF HEADER, entity group48, direct and nested geometry, PSLTSCALE 0/1. Global=2 and entity=3 yielded 60-unit direct dash; CELTSCALE=4 did not multiply existing geometry. Nested output at global1/2 was 20/10 XY vertices. A 1:10 viewport generated two 10-paper-unit dashes with PSLTSCALE=1 and fifteen 1-paper-unit dashes with PSLTSCALE=0. `linetype-phase.test.ts` 12/12 PASS; `complex-linetype.test.ts` PASS; `layout-viewport-render.test.ts` and `layout-viewport.test.ts` PASS; `cache-identity.test.ts` PASS; `npx tsc --noEmit -p tsconfig.next.json --incremental false --pretty false` PASS.

The whole-repo `npx tsc --noEmit --incremental false --pretty false` exited 1 with errors in unrelated old scripts/tests (missing `cad-review` modules/exports, stale unrelated test contracts and Worker `postMessage` overloads). The scoped `tsconfig.next.json` typecheck passed and its output had no compiler errors. `git diff --check` for changed tracked CAD source/tests exited 0. First scale oracle attempts exposed (a) group48 injected after the DXF `AcDbLine` subclass marker, so the parser correctly kept CELTSCALE=4; the fixture was corrected to standard common-entity ordering, and (b) old paper glyph expectation ignored PSLTSCALE. The independent oracle now computes glyph source spacing using `globalScale / viewportScale`; no acceptance tolerance was changed.

**Autodesk primary sources:** [effective entity scale and CELTSCALE default](https://help.autodesk.com/cloudhelp/2022/ENU/OARX-DevGuide/files/GUID-FF5299A3-CE1C-4A4F-8FB6-B835015773A6.htm); [LTSCALE](https://help.autodesk.com/view/ACD/2026/ENU/?caas=caas%2Fdocumentation%2FCIV3D%2F2014%2FENU%2FfilesACD%2FGUID-88787AE5-957B-483C-9EEF-51564114181F-htm.html); [CELTSCALE](https://help.autodesk.com/cloudhelp/2026/ENU/AutoCAD-Core/files/GUID-ECE175AB-AB7B-4DEC-9CEC-D5D67AF9310B.htm); [PSLTSCALE](https://help.autodesk.com/cloudhelp/2016/ENU/AutoCAD-Core/files/GUID-23EA4D64-AE7D-41E5-A8D0-20F060313D62.htm); [MSLTSCALE](https://help.autodesk.com/cloudhelp/2022/ENU/AutoCAD-LT/files/GUID-023B046C-56EA-463C-A867-DF713666A69E.htm).

**SHA-256 at group close (whole dirty files; HEAD does not represent this state):**

| File | SHA-256 |
|---|---|
| `src/lib/cad-v2/version.ts` | `6b885ba918cabec3a2418a4b96bd61706667584281df47559190dc9b89954a4d` |
| `src/lib/cad-v2/canonical/types.ts` | `606db2e13e4d58bae4a2b3d76580763e052b1e5bd2ae1c475978e153bdc2d627` |
| `src/lib/cad-v2/render/cad-stroke.ts` | `8a08ce5cebd5e3605040d459d05029e1e411dd33df3e32688b2cf37123fc7ca2` |
| `src/lib/cad-v2/compile/entity-visitor.ts` | `183cdc6f0123b5687929ffd4d0ce2fd467c56e51d37c9e3ed4e459d5d7a8a5e5` |
| `src/lib/cad-v2/compile/block-transformer.ts` | `87e0cfc2309f65df49937b153d1d58eba41df258f057d9a6ef7e6e8910349c48` |
| `src/lib/cad-v2/compile/scene-compiler.ts` | `ac16df0034f4a186e2b226c5d5637b55b1cefd1f164aaf1582663d1fafcef580` |
| `src/lib/cad-v2/decode/dxf-linetype-scale-header.ts` | `fc9bbd7efe5a1b7a241052af1b14446a758db9cd312d3694080b0d6b8fc289b5` |
| `src/lib/cad-v2/decode/dxf-adapter.ts` | `f86ee522d1e389924245ef719ef220b579b26bcaa4f5dcae56232978a1b27549` |
| `src/lib/cad-v2/decode/dwg-adapter.ts` | `21562844d7bff10f4cb3622dd4923c72245310fd8eeacc1f8820971861f14d51` |
| `tests/cad-v2/linetype-phase.test.ts` | `6590090a639a651462c92bedb05596b0b26e6c1b3451f4425f7b6be561b52df1` |
| `tests/cad-v2/complex-linetype.test.ts` | `c34e4dc9bc9e26151cd5e90f32f84fe894100311cbc3c95ebb45959ca61189ee` |
| `tests/cad-v2/linetype-scale-settings.test.ts` | `efd74a2c2896c629bd03bf8e21086fceb027b475efb732b671fc849def7142a7` |

**Open boundary.** MSLTSCALE is retained as a mode but not yet applied to model-tab geometry because selected annotation scale is not in current host-to-compiler request. No inference from camera zoom was used. R07-G remains partial; positive complex DWG/real SHX and AutoCAD same-source comparison remain separate, and F07 terminal gates remain 0/7. This was one local R07-G scale group; estimate R07 3–9→2–8 and known F07 14–31→13–30. Overall 14/19 remains historical.

## 2026-09-27 — R07-G current annotation scale / MSLTSCALE (compiler/cache v46)

**Run identity.** Active worktree 91a0; branch codex/srdr-dwg-motor-v2-fidelity; HEAD 4b51ebe6b1470c6a247e03158dfe4b5359621c97; working tree remains dirty and prior edits were preserved. Pipeline fidelity-v3-p08, schema 1, ABI three172-cad2d-v2. The resumed subgroup start was not separately clocked. Captured checkpoints: 09:21:55–09:29:47 UTC (7m52); this is only the captured interval, not a claim for the full subgroup duration. Estimate change is based on closing one defined local profile, not this incomplete timing window.

**Behavior and evidence.** Autodesk MSLTSCALE enables annotation-scale scaling of Model-tab linetypes. The scale object's factor is paper units / drawing units. DXF parsing follows the CANNOSCALE dictionary variable handle to its DICTIONARYVAR string and the unique matching SCALE record. A real AutoCAD DXF fixture resolved 1:1 → 1.0; a synthetic ASCII and binary OBJECTS chain resolved 1:50 → 0.02. Compiler tests verify direct pattern [10,-10] × entity group48 3 × global LTSCALE 2 × annotation 0.02 gives dash 1.2; nested INSERT with factor 0.5 gives 40 XY vertices. Model scale does not leak into paper layouts. MSLTSCALE=true with absent scale factor emits MODEL_ANNOTATION_SCALE_UNRESOLVED and degraded quality. No camera zoom estimate is used.

The installed @mlightcad/libredwg-web schema's HEADER_VARIABLES omits CANNOSCALEVALUE/MSLTSCALE, and its DwgDatabase exposes DICTIONARY but not DICTIONARYVAR/SCALE object records. The DWG current factor is consequently left absent; when MSLTSCALE is known true but its factor cannot be recovered, compile quality is degraded. This dependency limitation leaves DWG scale fidelity open, not accepted.

**Verification performed in this subgroup.**
- PASS: npx tsx tests/cad-v2/linetype-scale-settings.test.ts
- PASS: npx tsx tests/cad-v2/linetype-phase.test.ts (12/12)
- PASS: npx tsx tests/cad-v2/complex-linetype.test.ts
- PASS: npx tsx tests/cad-v2/layout-viewport-render.test.ts
- PASS: npx tsx tests/cad-v2/layout-viewport.test.ts
- PASS: npx tsx tests/cad-v2/cache-identity.test.ts
- PASS: npx tsc --noEmit -p tsconfig.next.json --incremental false --pretty false
- PASS: git diff --check scoped to changed CAD source/tests.
- Whole-repository TypeScript was not run this subgroup; the v45 subgroup's unrelated script/test diagnostics remain historical and are not re-labelled as a current run.

An early assertion incorrectly expected annotation metadata in the synthetic R07 DXF that has no CANNOSCALE scale-list objects. The test was corrected to use the existing AutoCAD 1:1 fixture for adapter propagation and an explicit 1:50 OBJECTS chain for parser ASCII/binary; no product acceptance threshold was relaxed.

**Autodesk primary sources:** [MSLTSCALE system variable](https://help.autodesk.com/cloudhelp/2022/ENU/AutoCAD-LT/files/GUID-023B046C-56EA-463C-A867-DF713666A69E.htm); [CANNOSCALE](https://help.autodesk.com/cloudhelp/2024/ENU/AutoCAD-MAC-Core/files/GUID-C7111BEE-76AA-481D-AC51-8600A31FA23A.htm); [AcDbAnnotationScale getScale](https://help.autodesk.com/cloudhelp/2027/ENU/OARX-RefGuide/files/OARX-RefGuide-AcDbAnnotationScale__getScale_double__const.html).

**SHA-256 at verification close (whole dirty files, before this documentation append):**

| File | SHA-256 |
|---|---|
| src/lib/cad-v2/canonical/types.ts | 0A2E2640AD01C156A1FD903BD4E4CA053F804C6D9418B30A9F60F12A7C00C10E |
| src/lib/cad-v2/canonical/diagnostics.ts | 8564569747FE9A7DBE9D42551486EF9802AAB426F62C073F69746E0600744FDF |
| src/lib/cad-v2/compile/scene-compiler.ts | 668D0032858723C63ED919F62169DB86CF8D531C33F7CF78762B2B5B12970E19 |
| src/lib/cad-v2/decode/dxf-adapter.ts | 1EAF351733DB83653629C56B22CE633997510E4074238737E9B9EC9C742E6E8B |
| src/lib/cad-v2/decode/dxf-linetype-scale-header.ts | A0E90FD68EDDABEE9CB98C40C4A8C14483ED7D9E233A5CA8F86DCA9F602D7CEB |
| src/lib/cad-v2/version.ts | 5FB7E7B384913B321A5256AE7EEADEC441A8E1CE007BFFCF2D178A05C96BBDA2 |
| tests/cad-v2/linetype-scale-settings.test.ts | 3DC7473637FA41FD551E932C114279CDC790F7E1B1A43692DA5FAB52DEE03E0D |

**Status.** R07-G is partial, G5 remains partial, F07 terminal gates remain 0/7 and overall 14/19 remains historical. Estimates reduced by one defined local profile: R07 2–8 → 1–7; known F07 13–30 → 12–29. Real complex DWG/SHX, broader scale matrix, DWG factor schema support and R10 same-source AutoCAD evidence remain open. No commit, push, PR, merge, staging or deploy was performed.


## 2026-09-27 — R07-G active annotation scale ratio and view budget profile

The updated linetype-scale test exercises the finite CANNOSCALE ratio matrix and the fail-closed boundary. ASCII/binary DXF profiles 1:1, 1:2, 1:50 and 2:1 resolve to factors 1, 0.5, 0.02 and 2; each includes a differently named inactive SCALE record. The actual parsed factor reaches the compiler. With pattern [10,-10], group-48 entity scale 3 and LTSCALE 2, dash and gap sizes are 60, 30, 1.2 and 120. Zero paper units and duplicate matching names do not resolve; the MSLTSCALE scene remains degraded. Varying unitsPerCssPixel 0.01→1 changes continuous ARC tessellation without changing direct dash metadata. This does not claim constant screen-pixel length under zoom.

| Evidence | Value |
|---|---|
| Runtime test | PASS — npx tsx tests/cad-v2/linetype-scale-settings.test.ts |
| Strict targeted test TSC | PASS — updated test + src/types/opentype.d.ts |
| Initial targeted TSC attempt | TS7016 because the command omitted the existing opentype declaration; rerun with the declaration PASS, no source change |
| Whole/scoped runtime TSC | NOT_RUN in this test-only continuation |
| Compiler/cache and schema | v46 / schema 1 / pipeline fidelity-v3-p08 / ABI three172-cad2d-v2 |
| Current test SHA-256 | tests/cad-v2/linetype-scale-settings.test.ts — 2F1B822A755090BD6025869C45C60151A1C3EDD6B8D6B0C7FE6836956E1E8407 |

No compiler source changed. F07 terminal gates remain 0/7; overall 14/19 is historical. LibreDWG active DWG-scale fields, positive complex DWG/actual SHX, and the shared R10 AutoCAD oracle remain open.

## 2026-09-27 — R08 emulated-DPR3 156% ELLIPSE trace

| Requirement / profile | Source and test | Current result | Boundary |
|---|---|---|---|
| Live camera → worker refinement → renderer at high zoom and DPR3 profile | tests/document-studio/cad-v2-layout-viewport.spec.ts, test "runtime-refined ELLIPSE raster stays bounded through 156% zoom when emulated DPR3 is capped to a DPR2 drawing buffer"; source SHA-256 03C45E4A2FDDC79F6C006097F5C43112B55CFC65AD31034BD20446C8F6D613EB | Targeted Chromium run passed 1/1 in 55.5 s. Fit/pan and 125%/156% zoom requests settled; final target 0.25 CSS px, 6/6 replies. | Browser DPR3 is emulated. WebGL buffer is capped at 2×; it is not a physical DPR3 GPU/device result. |
| Independent ELLIPSE raster error | Analytic quarter-ellipse oracle, 4097 source samples; 3404 selected rendered pixels at 156% | render→source=0.6774800229 CSS px, source→render=0.3755782579 CSS px, under 1.25 CSS px. Fit/pan in the same run measured 0.7085877543/0.2589010743 CSS px. | One local G6 cell only. Other geometry/zoom/profile combinations, R09 hardware and R10 AutoCAD same-source oracle remain open. |

## R08 emulated-DPR3 rational SPLINE 156% trace — 2026-09-27

| Requirement / profile | Source and test | Current result | Boundary |
|---|---|---|---|
| Host → worker refinement → renderer at DPR3-emulated 80/100/125/156% | `tests/document-studio/cad-v2-layout-viewport.spec.ts`, test `runtime-refined rational SPLINE stays bounded at DPR3 buffer cap after 80% and 156% zoom-pan`; source SHA-256 `A5F7CA4A3A02E1403ED93A79D4E96E032BA02EEAB18BC8064D176EB473D41195` | Targeted command `npx playwright test tests/document-studio/cad-v2-layout-viewport.spec.ts --project=chromium --grep "80% and 156% zoom-pan" --reporter=line --workers=1 --timeout=90000` passed 1/1 in 1.0 minute. Zoom refinements settled; after 156% pan the worker state stayed at 10/10 replies and .25 CSS px target. | DPR3 is emulated; drawing buffer is capped at 2×. 100% and 125% have refinement evidence but no independent raster measurement. |
| Independent rational SPLINE raster at 80% after pan | 4097 analytic rational Bernstein samples; 3273 selected raster pixels; source bounds [464.624,223.992]..[795.376,418.552] CSS px | render→source=0.6668573448; source→render=0.2322079741 CSS px | Both ≤1.25 CSS px; emulated DPR3 only. |
| Independent rational SPLINE raster at 156% after pan | 4097 analytic rational Bernstein samples; 6390 selected raster pixels; camera (644.46875,338.234375,k=9.5); source bounds [321.46875,129.234375]..[967.46875,509.234375] CSS px | render→source=0.6433524477; source→render=0.4022573566 CSS px; final target .25 CSS px; max 110 vertices | Both ≤1.25 CSS px; physical DPR3 R09 and same-source AutoCAD R10 remain open. |

## R08 emulated-DPR3 ARC fit-pan and 195% raster trace — 2026-09-27

| Requirement / profile | Source and test | Current result | Boundary |
|---|---|---|---|
| Live host → worker refinement → WebGL at fit/100/125/156/195% with pan | `tests/document-studio/cad-v2-layout-viewport.spec.ts`, test `runtime-refined ARC raster stays bounded through 195% zoom and pan under emulated DPR3`; source SHA-256 `568D5DC50E40E89140E6EDB025BCA7CDB2AD6275EAB62BC2DFDF54BD27C9D28E` | Command `npx playwright test tests/document-studio/cad-v2-layout-viewport.spec.ts --project=chromium --grep "195% zoom and pan under emulated DPR3" --reporter=line --workers=1 --timeout=90000`; PASS 1/1 in 48.8 s. At 195%, 8/8 replies, .25 CSS-px target, max 46 vertices. | Chromium DPR3 is emulated; renderer buffer stays capped at 2×; not physical R09 evidence. |
| Independent ARC raster, fit after pan | 4097 quarter-circle samples; 2737 selected blue pixels; camera (688,360,k=6.08); 1280×672 CSS viewport, 2560×1344 buffer, 3840×2016 image | render→source=0.7535568878; source→render=0.2524335670 CSS px | Both ≤1.25 CSS px; synthetic source and browser-emulated DPR only. |
| Independent ARC raster, 195% after pan | 4097 source samples; 3514 pixels; camera (781.75,406.875,k=11.875); total pan (141.75,70.875); visible angle [0,1.0286029931] rad | Clipping-aware render→source=0.7321633267; source→render=0.2658020055 CSS px | Both ≤1.25 CSS px. Hidden source arc is excluded by the clipping-aware oracle; native AutoCAD comparison remains R10. |

## R08 emulated-DPR3 rational SPLINE 195% pan trace — 2026-09-27

| Requirement / profile | Source and test | Current result | Boundary |
|---|---|---|---|
| Host → worker refinement → WebGL at DPR3-emulated fit/80/100/125/156/195% | `tests/document-studio/cad-v2-layout-viewport.spec.ts`, test `runtime-refined rational SPLINE stays bounded at DPR3 buffer cap after 80% and 195% zoom-pan`; source SHA-256 `8AB8F0514FF26D17EC16C88A1A3A57D161782E602057529237E4BA0586C2C05B` | Command `npx playwright test tests/document-studio/cad-v2-layout-viewport.spec.ts --project=chromium --grep "80% and 195% zoom-pan" --reporter=line --workers=1 --timeout=90000`; PASS 1/1 in 1.2 min. At 195%, 12/12 replies, .25 CSS-px target, max 114 vertices. | DPR3 is emulated; internal drawing buffer is capped at 2×. 100/125% are refinement-only, not measured raster cells. |
| Independent rational SPLINE raster at 195% after pan | 4097 analytic rational Bernstein samples; 7993 rendered pixels; camera (669.5859375,350.79296875,k=11.875); source bounds [265.8359375,89.54296875]..[1073.3359375,564.54296875] CSS px | render→source=0.6696125902; source→render=0.2561999628 CSS px; final pan (+24,+12) schedules no extra refinement | Both ≤1.25 CSS px; all source bounds remain in viewport. Physical R09 device and same-source AutoCAD R10 remain open. |

## R08 emulated-DPR3 ELLIPSE 195% pan trace — 2026-09-27

| Requirement / profile | Source and test | Current result | Boundary |
|---|---|---|---|
| Live host → worker refinement → WebGL at DPR3-emulated fit/125/156/195% | `tests/document-studio/cad-v2-layout-viewport.spec.ts`, test `runtime-refined ELLIPSE raster stays bounded through 195% zoom and pan when emulated DPR3 is capped to a DPR2 drawing buffer`; source SHA-256 `40C31D08A78F6FBE0DD747D3A8167D89749AB3E1C295DF66293D38FED45C10B` | Command `npx playwright test tests/document-studio/cad-v2-layout-viewport.spec.ts --project=chromium --grep "195% zoom and pan when emulated DPR3" --reporter=line --workers=1 --timeout=90000`; PASS 1/1 in 57.2 s. 195% state: .25 CSS-px target, 8/8 replies, max 46 vertices. | DPR3 is emulated; WebGL internal buffer remains capped at 2×. Two earlier attempts exposed test sequence ordering and were corrected before final PASS. |
| Independent ELLIPSE raster at 195% after pan | 4097 analytic quarter-ellipse samples; 4289 rendered pixels; camera (644.46875,338.234375,k=11.875); visible angle interval [0,1.5707963267948966] | render→source=0.7001692267; source→render=0.4022573566 CSS px; pan (+24,+12) adds no refinement request | Both ≤1.25 CSS px and full quarter arc visible in the screenshot. This is not physical R09 or AutoCAD R10 evidence. |

## R08 emulated-DPR3 125% curve raster trio trace — 2026-09-27

| Requirement / profile | Source and test | Current result | Boundary |
|---|---|---|---|
| Live host→worker→WebGL, DPR3-emulated 125% ARC pan raster | `tests/document-studio/cad-v2-layout-viewport.spec.ts`, test `runtime-refined ARC raster stays bounded through 195% zoom and pan under emulated DPR3`; whole-file SHA-256 `B4744DA1C0E4C2223E03EC1DE0290281041A43B89A9031DE8B93F38E074D59E3` | Actual pan; camera (724,378,k=7.6), fit-relative offset (84,42), adaptive oracle 957 positions, 3402 pixels; render→source=0.7130987918, source→render=0.2712624842 CSS px. Combined targeted suite 3/3 PASS in 2.9 min. | Full quarter source visible; 4/4 replies, .25 CSS-px final target, max 40 line vertices; emulated DPR3 / 2× buffer cap. |
| Live host→worker→WebGL, DPR3-emulated 125% ELLIPSE pan raster | Same spec/test file; SHA as above | Actual pan; camera (651.5,341.75,k=7.6), offset (11.5,5.75), 4097 analytic samples, 2746 pixels; render→source=0.6766723248, source→render=0.2552488787 CSS px. | Full [0,π/2] source quarter visible; 4/4 replies, max 40 line vertices; pan adds no refinement. |
| Live host→worker→WebGL, DPR3-emulated 125% rational SPLINE pan raster | Same spec/test file; SHA as above | Actual pan; camera (648.375,340.1875,k=7.6), offset (8.375,4.1875), 4097 Bernstein samples, 5147 pixels, source bounds [389.975,172.9875]..[906.775,476.9875]; render→source=0.5827244287, source→render=0.2459745357 CSS px. | Full source bounds visible; 8/8 replies, max 110 line vertices; pan adds no refinement. |

Exact command: `npx playwright test tests/document-studio/cad-v2-layout-viewport.spec.ts --project=chromium --grep "(runtime-refined ELLIPSE raster stays bounded through 195% zoom and pan when emulated DPR3 is capped to a DPR2 drawing buffer|runtime-refined ARC raster stays bounded through 195% zoom and pan under emulated DPR3|runtime-refined rational SPLINE stays bounded at DPR3 buffer cap after 80% and 195% zoom-pan)" --reporter=line --workers=1 --timeout=90000`. All directed errors satisfy the unchanged ≤1.25 CSS-pixel envelope. DPR3 is emulated, not R09 physical hardware; 2× renderer buffer remains. The measurement does not establish the full G6 Cartesian matrix or R10 AutoCAD result.

## F07 G6/R08 formal solver and selected raster coverage — 2026-09-27

### Current solver acceptance

| Requirement | Current test/evidence | Result | Boundary |
|---|---|---|---|
| Four zoom profiles × DPR1/2/3 | tests/cad-v2/precision-refinement.test.ts; zoom [1,8,64,512], world tolerance 0.25/(zoom×DPR) | PASS 12/12; maximum device-scaled sagitta ≤0.250001 px | Solver unit test only; production camera wiring is not inferred |
| Test identity | Whole-test SHA-256 DE31C8AC07C6DE33C7E6C0E6E382DDE95FDF88051643E132D579C94E6DB9127D | Command npx tsx tests/cad-v2/precision-refinement.test.ts; PASS in 1.3 s | Re-run in this audit |
| Selected browser integration inventory | tests/document-studio/cad-v2-layout-viewport.spec.ts existing profiles | Raster and refinement-only zooms separated below | The browser suite was not rerun in this audit; prior DPR3 125% trio 3/3 is prior-group evidence |

### Nine-row family × DPR crosswalk

| Family | DPR | Measured raster zooms | Settled refinement-only zooms |
|---|---:|---|---|
| ARC | 1 | fit, 80%, 125%, 156%, 195% | 100% |
| ELLIPSE | 1 | fit, 80%, 156%, 195% | 100%, 125% |
| Rational SPLINE | 1 | fit, 80%, 195% | 100%, 125%, 156% |
| ARC | 2 | fit, 156%, 195% | 125% |
| ELLIPSE | 2 | fit, 80%, 125%, 156%, 195% | 100% |
| Rational SPLINE | 2 | fit, 80%, 125%, 156%, 195% | 100% |
| ARC | 3 emulated | fit, 125%, 195% | 100%, 156% |
| ELLIPSE | 3 emulated | fit, 125%, 156%, 195% | — |
| Rational SPLINE | 3 emulated | 80%, 125%, 156%, 195% | 100% |

The formal minimum requires four solver zoom levels and DPR1/2/3 profiles, not a raster at every family×zoom×DPR intersection. Unlisted combinations are not claimed PASS or FAIL; no finite additional mandatory R08 raster gap was identified. DPR3 browser evidence remains emulated with a 2× WebGL buffer cap. R08/G6 remains partial for physical R09 and same-source AutoCAD R10; F07 terminal gates remain 0/7, and overall 14/19 is historical. No runtime/test source change; TSC was not rerun.

## 2026-09-27 — Nested non-LINE and viewport-projected stroke spatial eligibility (F07 G3/R04, v47)

| Profile | Input and oracle | Result | Boundary |
|---|---|---|---|
| Nested affine non-glyph curves | Two INSERT transform levels; CIRCLE, ARC, ELLIPSE, SPLINE and bulged LWPOLYLINE; high origin and later overlay | 25 painter-ordered chunks; maximum chunk bbox span 4093.360040664673; family/source provenance sidecars and local Float32 extents verified | Synthetic compiler/partition acceptance; not native DWG/AutoCAD |
| Paper viewport projected stroke | CIRCLE clipped and projected into a 5000×5000 paper viewport | 4 paper-space chunks; maximum bbox span 844.033254477853; painter order retained | One viewport curve family; not physical device raster or host on-demand fetch |

The compiler now classifies emitted non-LINE stroke ranges after paper-viewport projection using the same 4096-world-unit span rule and 256-chunk cap as root-space strokes. The viewport oracle failed before this fix and passed afterward. Current-revision commands passed: npx tsx tests/cad-v2/non-line-stroke-spatial-partition.test.ts, npx tsx tests/cad-v2/cache-identity.test.ts, and npx tsc --noEmit --project tsconfig.next.json. Affine OCS, bounds/provenance, block-expansion-budget and entity-instance-parity evidence producers passed and refreshed their JSON files. npm run check:cad-v2:unit passed before the v47 identity bump and before the five-family nested expansion, so it is not a full-suite v47 result.

Compiler/cache v46→v47; pipeline p08, schema 1 and render ABI v2 unchanged. Compiler SHA-256 AB1A0435B2BBF560D5EF3282012BA917988F31A73A245F0FD765C1274EC948B5; version SHA-256 9D2BE9C5C87343F7EC22012C637F04133189209C63C8935A391E8B34460B10D1; test SHA-256 CEBCEB0326CEA0312184AF06D5030D289817F4FE816FE4285BB8213995B49F44. The bounds run logged LibreDWG input error 68 while its selected provenance assertions passed. R04's selected work group is complete, but G3 remains partial pending host on-demand fetch, remaining global bounds/cap profiles and R05 fill/glyph. R09 physical device and R10 same-source AutoCAD are separate external oracles; F07 remains 0/7 terminal gates and overall 14/19 is historical.
## 2026-09-27 — F07 G3/R05 nested/viewport glyph ve visible fetch kanıtı

| Madde | Kaynak / oracle | Sonuç ve sınır |
|---|---|---|
| R05 glyph kimliği | entity-visitor.ts → scene-compiler.ts; fill-glyph-paper-spatial.test.ts | İki INSERT seviyesi ve paper viewport üzerinden isGlyphStroke taşındı; örtüşen direct fill ile manifest maxFillGlyphCompositeErrorWorld > 0, uzun nested glyph Model/SHEET bounded chunk PASS. Nested fill mesh kapsamı değil. |
| R05 host fetch | cad-v2-host-shell.tsx loadVisibleChunksRef: prepare başlangıç kamerası, handleCameraChange debounce, handleSelectLayout; cad-v2-layout-viewport.spec.ts | Chromium 2/2 PASS: görünür viewport ve aktif pafta fill/glyph fetch. Genel network/performance ve F08 eviction kabulü değil. |
| R05 açık fill yolu | entity-visitor.ts VisitorResult yalnız segments; HATCH boundary ve WIPEOUT bounds, viewport segment projeksiyonu | Nested HATCH/WIPEOUT fill mesh, width fill ve viewport mesh clipping/projeksiyon OPEN. Painter order/clip/topoloji korunarak ayrı çalışma grubu gerekiyor. |

v48 doğrulama: npm run check:cad-v2:unit PASS (tam zincir); npx tsc --noEmit --project tsconfig.next.json PASS; chunk-composite, R04 spatial, cache identity hedefli PASS; Playwright seçili 2/2 PASS. R001 test logunda LibreDWG error 68, temiz decode iddiası yok. SHA-256: entity-visitor 851665849E3D5E463814DEAE9E381BC2E2D4C47AAB1B4EDB2431C1CB3CBB1BB0; scene-compiler 0209829BE9C77ED59B91A10E94D4F69CC4C94B0420F19B0F7E2E3A64A582DCFF; version AEEEE5C4920173B43E6B7D72B4D4DFA4FBC37393F7A4E3ABAF83F9D1FE0BEB51; test 92128B957386E5FE92D8150DDFB3ECF9597BE4BED6E957A7FBF61570BCFAB25B. p08/schema 1/ABI v2 aynı. R05 yerel kalan 2–5 grup, F07 3–20 düşük güven; F07 terminal 0/7, genel 14/19 tarihsel.

## F07 G3-G4/R05 nested fill mesh ve viewport clip — v49 / 2026-09-27

| Kabul profili | Kaynak ve bağımsız oracle | Sonuç | Sınır |
|---|---|---|---|
| Nested HATCH+WIPEOUT affine mesh | `tests/cad-v2/fill-glyph-paper-spatial.test.ts`; two-level INSERT transforms with area oracle | Total triangle area 24000; HATCH fill precedes an interleaved line and WIPEOUT remains later in draw-command order | Synthetic polygonal fixtures; no AutoCAD same-source image |
| Nested normal XCLIP | Same test; WCS convex boundary clips HATCH and WIPEOUT | Combined clipped area 5500; no unsupported diagnostic | Only valid convex normal XCLIP is handled for fills |
| Nested inverted/concave XCLIP | Same test | No fill triangles; `UNSUPPORTED_FILL_CLIP`; quality `degraded` | Intentional explicit unsupported boundary, not a PASS for inverted/concave rendering |
| Paper viewport fill projection | Same test; 100×100 nested HATCH projected at 0.5 scale | Rectangle clip area 2500; convex triangular viewport clip area 1250 | Selected synthetic viewport, no raster or native acceptance |
| Active-paper on-demand fetch | `cad-v2-host-shell.tsx:loadVisibleChunks`; `cad-v2-layout-viewport.spec.ts` active-paper visible fill/glyph test | Targeted Chromium Playwright 1/1; selected active layout asks for visible chunk and leaves hidden layout chunk unrequested | General host/performance and F08 eviction lifecycle are outside this test |

Visitor/scene compiler now carries ordered fill draw items with segment draw items through nested INSERT, dimension visitor and paper viewport paths. `dimension-compiler.ts` routes segment additions through the shared visitor-order helper. `fill-mesh.ts` validates convex clips and clips each triangle before fan triangulation. Inverted/non-convex clips fail closed with `UNSUPPORTED_FILL_CLIP` quality degradation. Nested LWPOLYLINE width meshes, global bounds/cap profiles, nested fill-glyph overlap envelope and runtime/raster composite remain open.

Compiler/cache `cad-v2-compiler-2026.09-v49`; pipeline `fidelity-v3-p08`; schema 1; ABI `three172-cad2d-v2`. Validation: targeted fill-glyph fixture PASS; accounting, expansion budget, cache identity, composite precision, layout viewport, painter order and viewport renderer tests PASS; runtime TypeScript PASS; complete `npm run check:cad-v2:unit` PASS on retry; active-paper Chromium fetch PASS 1/1. First full-unit run stopped on the previous assertion that assumed nested HATCH boundary XY lived in manifest chunk 0. Fill meshes now precede their boundary strokes in source painter order, so the assertion was updated to select a line-bearing chunk; the specific test and complete unit suite then passed. LibreDWG error 68 appeared in R001 test logs and is not clean decode evidence.

SHA-256 — `entity-visitor.ts` 3D3FD65DF23D158549898247C16F2C2A15813739B55192C088D55AF165978CB3; `scene-compiler.ts` FB56B1BA443D51851B82919031307A6F6B1A4B04F241CF7D25A9A87D2F0FC5F2; `fill-mesh.ts` F13D4F63AFB8ABEEBF5C07D98B020717B56AEB1EFB1F7A25E3E991C3318909C8; `dimension-compiler.ts` D40551E4418457886A115EBF76CAC6230706B36D41F89F1BD5E68C883B135E58; `version.ts` 5D58B99FD90B58C482C6C54A863F74DEBCF4D924EF771CCE867DDCF87D78FFE9; `fill-glyph-paper-spatial.test.ts` 2448D31753F9AA75BEE94F2BA96722901158E1D9DCF410887652F6F1A43B5A29; adjusted `chunk-error-accounting.test.ts` C103D1FE44EB55CCCFF4BA8F79A47066E0EE6A574BB4FF12817C7ED47CA57834.

R05 remaining estimate is 1–4 local groups and F07 known-local estimate is 2–19 groups, low confidence; one nested/viewport fill group is closed while width-fill, global cap and R06 interactions remain. F07 terminal 0/7 and overall 14/19 remain historical. F05/F08/production R01/V01 have no estimate; physical R09 and native AutoCAD R10 remain external dependencies. No commit, push, PR or deployment.

## F07 G3-G4/R05 nested width-fill, fill cap and binary size evidence (v50)

| Kabul profili | Kaynak / oracle | Sonuç | Sınır |
|---|---|---|---|
| Nested LWPOLYLINE width mesh | `entity-visitor.ts`, `scene-compiler.ts`, `fill-glyph-paper-spatial.test.ts`; two affine levels incl. mirrored/nonuniform transform | Nested triangle area 240; painter order retained | Synthetic compiler geometry oracle; no native raster |
| Paper viewport width-fill | Same test; model→paper projection with clip | Clipped triangle area 500 | Selected synthetic viewport profile |
| Fill/glyph composite | Same test; nested width fill overlaps nested glyph in Model and SHEET | Both manifests report `maxFillGlyphCompositeErrorWorld > 0` | Accounting envelope exercised; no runtime/raster error bound claim |
| Spatial fill cap | Same test; 256 fill-group cap | Quality degraded with `FILL_SPATIAL_PARTITION_LIMIT_REACHED`; count-window fallback retains source triangle geometry | Explicit degraded bound, not proof every arbitrary pathological fill is spatially bounded |
| Large mesh and encoded chunk size | `scene-compiler.ts`; `r001-root-fix.test.ts` | Mesh windows <=16,384 triangles; encoded chunks <=2 MiB after header/table/alignment-aware pre-estimate and order-preserving recursive split | A single indivisible primitive above cap throws; no silent oversized chunk |
| R001 P08 artifact | `tests/cad-v2/r001-root-fix.test.ts` | 286 chunks, max chunk <=2,097,152 bytes; manifest 484,094 bytes <=1 MiB | Test logs LibreDWG error 68; not clean decode evidence |

Compiler/cache cad-v2-compiler-2026.09-v50; pipeline p08, schema 1, ABI `three172-cad2d-v2`. Runtime hashes: entity-visitor `6669BEE2A031F611DC1815A2EDBC4DD885110A9EBA80EFAD9D6D933467E80A27`; scene-compiler `93B16D288C1DB5404F5DA9E79070E7B371A7B510DA4351DFA61C7E09FAB740EF`; version `BE56F3FC44F65FCD2F5981438E58B3D7C4B92964221E133FC77C3AAEAD381A3D`; fill test `9293F82DF5CDAE570A10A227C9194CCB3493BAD90D4650BE3F8EEAD07D8F814A`; R001 fixture `17a92cb544830845fc59717abcc22d3cdcf97c12b8450602c9c70ec4a507f086`.

Validation scope: full `npm run check:cad-v2:unit` passed on v50 runtime before the final test-only model/paper composite assertion was added; the updated targeted fixture then passed and `npx tsc --noEmit --project tsconfig.next.json` passed. Standalone R001 P08 passed after byte pre-estimation fix. `git diff --check` passed on the changed runtime/test files. The previous active-paper fetch Chromium evidence remains from v49; no new browser run was needed for this compiler-only change.

R05 width/cap/composite selected group is complete; broader global bounds and runtime/raster composite remain open. Inverted/concave fill clip remains fail-closed with degraded quality. F07 terminal gates remain 0/7 and 14/19 remains historical. R05 estimate 1–3 local groups, F07 known-local estimate 1–18, both low confidence. F05/F08/production R01/V01 unestimated; R09 physical device and R10 same-source AutoCAD are external. No remote writes.

## F07 G4/R06 non-adjacent fill/glyph composite accounting (v51)

| Acceptance profile | Source/oracle | Result | Boundary |
|---|---|---|---|
| High-origin non-adjacent pair | `chunk-composite-precision.test.ts`; width-fill, disjoint 24,000-unit intervening glyph and later overlapping glyph | Confirms overlapping fill/glyph chunks are separated by more than one painter chunk; both receive the cross-chunk sum | Compiler/binary metadata; not rendered-pixel distance |
| Screen target | Same fixture, target 0.25 CSS px | Each participant's max quantization fits; pair composite exceeds target and scene is degraded with `CHUNK_COMPOSITE_PRECISION_LIMIT_REACHED` | Selected synthetic view profile |
| Pair-analysis cap | 130 fills + 130 glyphs, `maxPrimitivesPerChunk: 1` | More than 16,384 candidates triggers layout-wide max-fill + max-glyph bound, `FILL_GLYPH_COMPOSITE_ANALYSIS_LIMIT_REACHED` and degraded quality | Conservative fallback may overstate unrelated participants; no silent omission |
| Existing interaction cells | Same test | Same-chunk, adjacent-chunk and non-adjacent cases pass | No host/worker/WebGL or AutoCAD raster run |

Compiler/cache v50→v51; pipeline p08, schema 1 and renderer ABI v2 unchanged. Validation at v51: `npx tsx tests/cad-v2/chunk-composite-precision.test.ts`, `npx tsx tests/cad-v2/cache-identity.test.ts`, `npx tsc --noEmit --project tsconfig.next.json`, and `npm run check:cad-v2:unit` all passed. The full unit chain logged LibreDWG error 68 on R001-containing decoder tests; their selected assertions passing does not establish a clean decode. Scoped `git diff --check` emitted no warnings for changed runtime files.

Source SHA-256 — scene-compiler `1FDBD42B0EDA0690DD5509C1ED326DF1FFCEC19524A804D66C0B86EF35400BC9`; diagnostics `CF24A6624BD9075E6942973076A7876FE6C33E0E75A51E8B48FD3C8691D904A9`; binary-protocol `81E429EA12B10338141B6AEB3412924564FE01DB5AC1245F8BA5CB9E9E36AF27`; version `2C1117F0699886152B8B642D0721DBD5FDA28728B099FB88751D44FDCDF45A59`; test `AD7A29DB4E59FD3BDEA4E1E40B1240A8DF0B2B27FA49ED5146FF0B540137FB27`.

R06 remaining estimate: 1–3 local continuation groups, low confidence; broader source-family/global-bound profiles and runtime/raster verification remain. F07 known-local estimate updates 1–18→1–17, low confidence, because one finite R06 static-composite group closed. R05 remains 1–3. F07 terminal gates stay 0/7; overall plan 14/19 is historical. F05/F08/production R01/V01 are not estimated; R09 physical device and R10 same-source AutoCAD are external dependencies.

## 2026-09-27 — F07 G1–G7 finite v3 crosswalk (dashboard v25)

| Gate | v3 scope status | Evidence/current missing owner |
|---|---|---|
| G1 periodic SPLINE/knot | PASS | Existing periodic test tightened from 0.5 to 0.25 CSS px; 43 worker spans, independent max 0.205928467 CSS px; `precision-refinement` zoom×DPR 12/12. |
| G2 HATCH runtime precision | PASS for F07 | Existing runtime boundary, Float64 mesh, cap and P07 topology tests pass. Island topology remains P07 scope, not a new F07 matrix. |
| G3 spatial/on-demand chunk | PASS | Direct, nested non-LINE, fill/glyph and active-paper visible fetch tests pass; visible fetch Chromium 1/1. More bounds variants are not v3 F07 requirements. |
| G4 fill/glyph composite | PASS local compiler bound | v51 same/adjacent/non-adjacent pair sum, 0.25 CSS px quality propagation and cap fallback are covered by focused + full unit proof. Extra raster/source-family cross product is optional. |
| G5 PATH_DISTANCE/phase | NOT_RUN | Local synthetic phase, chunk, viewport and scale profiles pass. Missing terminal evidence: AutoCAD same-source start/phase/length comparison, shared R10 with G7. |
| G6 zoom/DPR error | PASS for F07 | Four zooms × DPR 1/2/3, tolerance 0.25/(zoom×DPR), 12/12. Physical R09 device measurement is separate V01 scope. |
| G7 same-source visual/DIM | NOT_RUN | Requires source hash/profile manifest, R001 model-space comparison and ≥10 semantic ROIs; native AutoCAD owner. No global screenshot/DIM tolerance is invented; use the plan's per-domain thresholds. |

Unsupported-profile rule: plan-authorized caps must return visible partial/degraded diagnostics, never exact PASS. Missing SHX may be explicitly degraded under the plan's dependency rule, but cannot replace same-source AutoCAD parity or hide critical ROI loss. G1–G4/G6 are 5/7 PASS; G5/G7 share one external R10 evidence bundle. No code source changed in this audit; only the existing periodic test's target was tightened. Test SHA-256 `0997329E04E94B8CBCE996A3278E8E5D7A71D132613DCB56B9FFEC5448841A4B`.
