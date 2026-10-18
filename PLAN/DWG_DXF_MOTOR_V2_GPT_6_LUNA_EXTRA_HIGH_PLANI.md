# DWG / DXF Motor V2 — GPT‑6 Luna Extra High uygulama planı

**Hazırlanma:** 17 Ekim 2026 · **Hedef uygulayıcı:** GPT‑6 Luna, Extra High (`xhigh`) · **Durum:** PLAN HAZIR; ürün düzeltmeleri ve kabul testleri henüz uygulanmadı.

Bu plan, kullanıcının mühendislik sitesinde DWG/DXF dosyalarını güvenilir biçimde açma ve AutoCAD'e yakın kaynak görünüşü elde etme hedefi içindir. Öncelik ekran görüntüsündeki `chunk_model_004` 404 hatasını, ardından eksik veya hatalı çizim risklerini kapatmaktır. “Mükemmel” kabulü; tanımlanmış destek matrisinde eksiksiz açılış, ölçülebilir görüntü doğruluğu, açıklanmış istisnalar ve geri alınabilir dağıtım anlamına gelir. Her DWG sürümü, proxy nesnesi ve eksik dış kaynak için kanıtsız yüzde yüz eşlik sözü verilmez.

Bu oturumun çıktısı plandır. Uygulama kodu değiştirilmedi; ürün testleri, AutoCAD oracle çekimi, commit, push veya deployment yapılmadı. `rea` indirildi ve gerçek CAD worker dosyasının kopyasında statik analiz çalıştırıldı; ayrıntıları Bölüm 4'tedir.

## 1. Kapsam, öncelik ve korunacak davranış

### 1.1 Ürün kapsamı

- Ana kullanım: çevrimiçi, salt okunur **2D DWG/DXF inceleme**; Model ve Layout/viewport bağlamları, katmanlar, kaynak renkleri, çizgi tipleri, yazılar, kaynak ölçüleri, hatch ve block görünüşü.
- Mevcut ürün kayıtlarındaki dosya profili korunur: genellikle **0–30 MB**, üst kullanım **30–70 MB**. MB=1.000.000 byte; raporda gerçek byte sayısı da bulunur. Teknik güvenlik sınırıyla ürün performans sınırı aynı şey değildir.
- Kullanıcı tek DWG/DXF verir. Açılış için ek klasör, font paketi veya XREF teslim etmesi zorunlu tutulmaz. Dosyada bulunmayan dış veri üretilemez; eksiklik çizim üzerinde ve tanılarda açıkça belirtilir.
- Yeni kaynak düzenleme, DWG kaydetme, 3D CAD, BIM, çevrimdışı çalışma ve yeni ölçüm ürünleri bu planın önüne geçirilmez. Mevcut ölçüm/review özellikleri korunur; çizimin kendi ölçü nesneleri doğruluk kapsamındadır.
- Türkçe arayüz, light/dark eşliği, Dark Industrial görsel kimliği, tam ekran çalışma alanı, pan/zoom/fit ve mevcut V1 fallback korunur.

### 1.2 Öncelik sırası

1. **P0:** eksik sahneyi hazır ilan etme, sahne parçalarının 404 vermesi, dosya/paylaşım erişim sınırları ve sessiz geometri kaybı.
2. **P1:** kalıcı iş yürütme, cache kimliği, kaynak doğrulama, bounded retry/cancel, AutoCAD referansına göre fidelity.
3. **P2:** büyük çizimde bellek, ilk faydalı görüntü, mobil/masaüstü etkileşim, gözlemlenebilirlik ve kontrollü yayın.

Hız, eksik çizimi tam gibi göstermenin gerekçesi olamaz. Başarısızlığı `ready` durumuna çevirmek, hata ekranını gizlemek veya test toleransını genişletmek çözüm değildir.

### 1.3 Repo kuralları ve bu talebin sınırı

Uygulamaya başlamadan `PROJECT.md` → `AGENTS.md` → ilgili `.agents/rules` → `docs/cad-dxf-engine/README.md`, `BASELINE_MANIFEST.md`, `ARCHITECTURE.md`, `VISUAL_INTERACTION_CONTRACT.md`, `AI_CHANGE_PROTOCOL.md` → `DOK_CONTEXT_MAP.md`, `DOK_STORAGE_CONTRACT.md`, `docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md` sırası uygulanır. Kaynak kodla eski belge çelişirse kod/test/çalışan sürüm doğrulanır.

Bu yeni talep, önceki Gemini/Astra yürütme metinlerini kendiliğinden etkinleştirmez; yeni bir plan istemektedir. Eski belgeler bağlam ve kanıttır. İçlerindeki “başla”, “devam et”, “plan açma” gibi metinler bu oturumda uygulama yetkisi sayılmaz. Bu dosya da tek başına canlıya yayın talimatı değildir.

Korunan tarihsel referanslar: IGNORE2 golden commit `909c59cb9dcac8e722b3bda4c66fd9d8a25755c8`, restore `afbc121923f2de1313801f884f428535334a40cf`, deployment `dpl_5xrsMtgshSvcwTN4oH3FBNkecoeo`. Silinmez veya yeni baseline ile sessizce değiştirilmez. Eski motor ve fallback kaldırılmaz. Kullanıcı primary cutover/yeni baseline kararını ayrıca açıkça vermeden varsayılan motor değiştirilmez; bu ayrım `AI_CHANGE_PROTOCOL.md` Bölüm 5 ve 12'nin gereğidir.

## 2. İncelenen gerçek durum ve kesinlik sınırı

### 2.1 Birbirine karıştırılmaması gereken sürümler

| Alan | 17 Ekim 2026 gözlemi | Plana etkisi |
|---|---|---|
| Ana checkout | `C:\Users\hsyn\Desktop\muhendis-mimar-portali`, branch `main`, HEAD `14235bd4ff86f6d03f3a575d4650596cef57206e`; remote main aynı SHA | Belgeler/PDF işine ait dirty/untracked dosyalar var; korunacak |
| Ana checkout CAD kimliği | compiler `cad-v2-compiler-2026.09-v33`, pipeline `fidelity-v3-p08`, schema 1, ABI `three172-cad2d-v2` | Bu sürümün kusurları daha ileri ağaca otomatik genellenmeyecek |
| Önceki çalışma ağacı | `C:\Users\hsyn\.codex\worktrees\91a0\muhendis-mimar-portali`, branch `codex/srdr-dwg-motor-v2-fidelity`, HEAD `4b51ebe6b1470c6a247e03158dfe4b5359621c97`, dirty çalışma | Güncel dosyaları HEAD'den daha ileri; salt SHA yeterli kimlik değil |
| Çalışma ağacı CAD kimliği | compiler `cad-v2-compiler-2026.09-v71`; aynı pipeline/schema/ABI ailesi | Görünür parça yükleme, budget, TTL ve bazı testler ilerlemiş |
| “CAD Preview V2 RELEASE READY” | PROJECT ve mimari hafızadaki eski MLightCAD hardening kaydı | Yeni `src/lib/cad-v2` motorunun production kabulü değildir |
| Eski durum kayıtları | `DWG_PLAN_DURUMU.md`, `motor_v2`, `dwg_V2` farklı tarihler ve uygulama durumları içeriyor | Aynı testin iki sürüme aitmiş gibi sayılması önlenecek |

**Faz L00 atlanamaz.** En yüksek compiler numarası her dosyada en doğru çözüm demek değildir. Örneğin v71'de ilerlemiş loading vardır; v33'teki bazı compiler-revision cache kontrolleri ise v71'de aynı biçimde bulunmaz. Otomatik merge, reset, stash, checkout değiştirme veya dirty dosyaları taşıma yapılmaz.

### 2.2 Ekran görüntülerinin kanıtladığı ve kanıtlamadığı

Bir görüntüde `POST /api/dokumantasyon/cad-v2/prepare` 200 ve sahne GET'lerinde çok sayıda 404; diğerinde “Görüntüleme Başarısız — Kritik parça bulunamadı (404): chunk_model_004” görülüyor. Bu, **sahne teslim zincirinin başarısız olduğunu** gösterir. Tek başına “DXF bozuktur”, “parser hatalıdır” veya “Vercel cache kesin bozuk” sonucunu vermez. HTTP 200 de tek başına işin kalıcı ve eksiksiz hazır olduğunu kanıtlamaz; response body gerekir.

Bu incelemede production ortam değişkenleri, gerçek Blob nesneleri, deployment kaynak SHA'sı ve korelasyonlu canlı loglar okunmadı. Olayın kesin RCA'sı L01'de doğrulanacaktır. Ekrandaki hatalı DXF'nin birebir kaynak byte'ları mevcut R001–R004 corpusuyla eşleştirilmedi.

### 2.3 Kaynak kodla doğrulanan bulgular

Aşağıdaki satır numaraları ana checkout/v33 içindir; uygulama başlangıcında yeniden çözülür. **Ortak** işaretliler v71'de de odak incelemeyle görülmüştür.

| ID / önem | Somut bulgu | Konum / sürüm ayrımı | Sonuç |
|---|---|---|---|
| B01 / P0 | V2 Blob IO için yalnız `BLOB_READ_WRITE_TOKEN` kontrol ediyor; ortak storage katmanı OIDC + `BLOB_STORE_ID` da destekliyor | `cad-v2-durable-service.ts:375,517,574`; `runtime-mode.ts:105–141`; **ortak** | Geçerli OIDC-only production ayarında V2 kalıcı IO atlanabilir |
| B02 / P0 | Blob manifesti parçalardan önce yükleniyor; upload hatası warning ile yutulup iş `ready` oluyor | servis `:385–417`; **ortak** | Manifestin ilan ettiği parça eksik olabilir |
| B03 / P0 | Jobs/sessions/idempotency/scene-file mapping RAM Map; Vercel'de `/tmp`; metadata/index Blob fallback yok | servis `:67–80,602–665`; **ortak** | Cold start ve ayrı instance davranışı yerel PASS'ten çıkarılamaz |
| B04 / P0 | Public route'larda scene→file bulunmazsa `if(fileId && ...)` dosya kapsamı kontrolünü atlıyor; public session DELETE auth çağırmıyor; heartbeat share/session sahipliğini bağlamıyor | `src/app/api/public/cad-v2/**`; **ortak** | Yetki ilişkisinin kalıcı ve fail-closed olması gerekir; exploit çalıştırılmadı |
| B05 / P1 | Kaynak buffer alınamazsa ilerlemeyen `preparing` iş; route içinde senkron compile; kalıcı kuyruk bağlantısı yok | servis `:252–276`; `services/cad-v2-compiler/**`; **ortak** | Dosya olmadan iş açma ve request ömrüne bağlı compile düzeltilmeli |
| B06 / P1 | 401/403/404 de üç kez deneniyor; fatal worker reject sonrası sibling chunk görevleri durmuyor | `cad-v2-host-shell.tsx:378–405,466,500`; **ortak** | 404 seli, boşa iş ve geç yanıt riski |
| B07 / P1 | Public prepare istemcinin serbest HTTP `accessUrl` değerini sunucudan fetch edebiliyor | public prepare route; **ortak** | Kaynak yalnız yetkili DB/storage kaydından çözülmeli; URL/redirect güvenliği sınanmalı |
| B08 / P0 | Bilinmeyen entity `null` ile düşebiliyor; genel unsupported/invalid muhasebesi eksik; canonical'da SOLID olsa da adapter switch'inde yok | `decode/{dwg,dxf}-adapter.ts`, `canonical/diagnostics.ts`; **ortak** | Eksik çizim `exact` gibi raporlanabilir; MLEADER'a özel tanı genel problemi kapatmıyor |
| B09 / P1 | Service ve CLI gerçek font byte digest'ini scene identity'ye geçmiyor; varsayılan `system-bundled-v1` | `service/scene-identity.ts`, servis `:192,304`, compiler CLI `:83`; **ortak** | Font değişimiyle eski artifact tekrar kullanılabilir |
| B10 / P1 | Bazı UI testleri kaynak string'i/canvas boyutu denetliyor; gerçek corpus fidelity testi yalnız entity>0, layer>0 ve bbox uzunluğu gibi zayıf koşullar kullanıyor | `tests/cad-v2/{accuracy-performance-acceptance,ui-quality-acceptance,host-lifecycle-cancellation}.test.ts`, desktop audit; **ortak** | “Test geçti” gerçek çizimin doğru göründüğü anlamına gelmeyebilir |
| B11 / ayrım | v33 bütün parçaları yükler; periodic spline testi gate dışında; binary sınırları 4/16 MiB | v33'e özel | v71'de görünür yükleme/budget var, spline testi gate'e girmiş, sınırlar 2/8 MiB; bunlar yeniden yazılmayacak |
| B12 / ayrım | v71 TTL expiry, storage ID whitelist, expectedFence ve StrictMode/generation cleanup iyileştirmeleri içeriyor | v71'e özel | Mevcut düzeltmeler korunacak; gerçek dağıtık fence/lease kabulü ayrıca yapılacak |

**En güçlü olay hipotezi:** OIDC-only IO'nun atlanması veya kısmi Blob publish + ayrı instance/geçici disk nedeniyle bir yerde manifest bulunurken başka yerde chunk bulunamaması. L01, bu iki yolu ve stale artifact/yanlış nesne anahtarı ihtimalini ayrı ayrı doğrular. Bulgu ile olayın kesin nedeni ayrı kaydedilir.

## 3. Hedef teknik sözleşme

### 3.1 Dosyadan ekrana uçtan uca zincir

```text
Yetkili dosya + kesin revision + kaynak SHA-256
    → idempotent prepare + kalıcı job/session
    → bounded compiler worker / mevcut supervisor
    → decode + census + canonical + scene compile
    → girişime özel immutable object set
    → her nesnenin byte/hash/completeness doğrulaması
    → manifest + atomik READY referansı
    → yetkili manifest/chunk/index/metadata okuma
    → görünür parça scheduler + worker decode
    → doğrulanmış ilk çizim → görünür alan tamamlığı → kalite durumu
```

Önerilen kalıcı otorite **mevcut Neon + Private Blob** sözleşmesidir. Yeni storage sağlayıcısı eklenmez. Process RAM ve `/tmp`, kaybı doğruluğu etkilemeyen cache olur. Aynı yerel dizini paylaşan iki process, bağımsız instance testi değildir.

### 3.2 İş, yayın ve görüntü durumları

- Job: `queued → running(source/decode/compile) → publishing → ready | degraded | failed | cancelled`. `publishing` yeni alan veya mevcut phase olarak sözleşmeye açık eklenir. `ready/degraded` yalnız kalıcı, eksiksiz nesne setine işaret eder.
- Kalite: `exact`, `degraded`, `unsupported` ayrımı mevcut tiplerle eşlenir. Kaynak/entity/font kaybı, bütçe nedeniyle eksik alan veya decode uyarısı `exact` olamaz.
- Host: preparing/loading-manifest/loading-visible/rendering/ready/degraded/error/cancelled. “Manifest geldi”, “canvas var” ve “çizim hazır” farklı olaylardır. Teknik state'ler kullanıcıya Türkçe ve sade gösterilir.
- Monotonic fence + owner + lease expiry + attempt kimliği gerekir. Son commit anında yeniden kontrol edilir; eski worker yeni attempt'in artifact'ini yayınlayamaz.
- `ready_scene_missing_object` bir **sunucu bütünlük hatasıdır**. Bir bounded yeniden hazırlama yapılabilir; istemcide sonsuz retry ile saklanmaz.

### 3.3 Yayınlama ve kimlik

`scene identity`, canonical serialization ile tenant/file/revision/source SHA + gerçek decoder sürümleri + compiler + schema + render ABI + kalite profili + **gerçek font/resource katalog digest'i** içermelidir. Manifestte de aynı değerler doğrulanır. Cache lookup, yalnız dosya adı veya kaynak SHA ile bu diğer boyutları atlamaz.

Publish sırası: attempt staging → tüm chunk/index/metadata/font bağımlılık kayıtları → length/hash/set doğrulaması → manifest → DB'de koşullu READY pointer. DB+Blob tek transaction değildir; yalnız DB READY referansı okuyuculara yayınlanır. Crash arada olursa staging görünmez kalır; grace süresi sonrası temizlenir. READY update başarısızsa eski geçerli scene korunur. Tek bir `manifest.json` dosyasının varlığı yeterli kabul değildir.

SQL taslağı kör uygulanmaz: `db/schema.sql` UUID kolonları ile uygulamadaki `scene_<hash>`, `job_<uuid>`, `vs_<uuid>` string kimlikleri uzlaştırılır. Aktif iş idempotency'si için `UNIQUE(artifact_key,status)` yerine uygun unique/partial index ve transaction tasarlanır. Source version aynıyken değişen byte, yeniden adlandırma ve gerçek içerik değişimi ayrı sınanır.

### 3.4 Erişim ve kaynak güveni

Her manifest/chunk/index/metadata/job/session isteği kalıcı `principal/share → file/revision → scene/object/session` ilişkisi üzerinden doğrulanır. Mapping yoksa erişim reddedilir. Yetki kontrolü helper mock'u yerine gerçek route üzerinden test edilir. Share iptali/expiry/parola, kaynak silinmesi ve revision değişimi publish öncesi de yeniden kontrol edilir. POST/DELETE için mevcut same-origin/CSRF/session korumaları korunur; credentialed cross-origin mutation reddi gerçek route üzerinden sınanır.

Prepare tarayıcıdan keyfi URL alıp fetch etmez; kaynak yetkili dosya kaydının server-side storage locator'ından çözülür. İmzalı URL gerekiyorsa origin/path/revision ve redirect politikası doğrulanır. Timeout, byte sınırı ve magic/format kontrolü bulunur. Token, dosya içeriği ve imzalı URL'ler log/evidence'a yazılmaz.

### 3.5 Retry ve kaynak bütçesi

| Sonuç | Politika |
|---|---|
| Kullanıcı iptali / AbortError | Retry ve fallback döngüsü yok; generation terminal |
| 401 / 403 | Aynı chunk'ı tekrar indirme yok; oturum/yetki UX'i |
| Hazır sahnede 404 / hash uyuşmazlığı | Sibling istekleri abort; tek bütünlük bildirimi; en fazla bir kontrollü scene repair |
| 409 source revision | En fazla bir authoritative metadata yenileme; yine değişiyorsa görünür terminal durum |
| 410 session | Yetki geçerliyse bir session yenileme; recursive sonsuz prepare yok |
| 429 / geçici ağ / retryable 5xx | `Retry-After` ve bounded exponential backoff+jitter; başlangıç toplam 3 attempt, ortak zaman bütçesi |
| Invalid binary / schema / ABI | Fail-closed; decode/allocation başlamadan ret; güvenli fallback seçeneği |

Fatal error/cancel/unmount sonrası chunk, job polling ve heartbeat istekleri durur. “Tekrar dene” bilinçli yeni generation'dır; aynı logical isteğin network retry'ı aynı idempotency anahtarını korur. Eşzamanlı kullanıcılar tek hazırlama işini paylaşabilir; birinin çıkması diğerinin işini iptal etmez.

## 4. REA ve AutoCAD LT 2027: hazırlanmış araçlar ve kullanım yolu

### 4.1 Gerçekleştirilmiş REA hazırlığı

| Alan | Değer |
|---|---|
| Resmi depo | [morluto/rea](https://github.com/morluto/rea) |
| Yerel clone | `C:\Users\hsyn\Desktop\cad-engine-references\rea` |
| Kaynak HEAD | `376eeca770820b31f7f8d4c5fcc397315621643e` — shallow clone |
| package / lisans | `rea-agents` 6.5.0; REA kodu MIT, üçüncü taraf bildirimleri ayrıca korunur |
| Node aralığı | Kaynak `engines`: `^22.19.0 \|\| ^24.11.0 \|\| >=26.0.0`; bu ilk koşuda Node v24.15.0 / npm 11.12.1 |
| Çalıştırılmış inceleme | CAD scene worker'ın izole kopyasında static JavaScript analysis |
| Analiz klasörü | `C:\Users\hsyn\Desktop\cad-engine-references\analysis\cad-v2-worker-2026-10-17` |
| Kanıtlar | `worker-analysis.json`, `run-manifest.json`, `verified-summary.json`, `autocad-inventory.json`, CLI help/stderr ve `input` kopyası |
| Sonuç | exit 0, yaklaşık 3,42 s; 40.573 byte JS; 1 parsed file, 5.439 AST node, 0 parse failure; partial graph |
| Input SHA-256 | `10153E8BE50382EF4F10CFED25D49D5A917403560A62D812780CAE5484E3B881` |
| Analiz JSON SHA-256 | `4A77ACCE3B2CE899DF75039B620ACB37E03EA0D48427052DC9C01FB495F0BC9E` |

Çalıştırılan komutun eşdeğeri; input dizini tek worker kopyası içerir:

```powershell
npx --yes --package rea-agents@6.5.0 rea analyze-javascript-application "C:\Users\hsyn\Desktop\cad-engine-references\analysis\cad-v2-worker-2026-10-17\input" --artifact-format directory --max-heap-mb 512 --analysis-timeout-ms 60000 --json
```

Clone ve npm CLI sürümü ayrı kimliklerdir; bu ilk koşu bir deployment bundle testi değildir. Statik grafikten gerçek chunk fetch sırası, production RCA veya render doğruluğu çıkarılmaz. Global REA kurulumu, Codex MCP ayarı ve ana projenin package/lockfile'ı değiştirilmedi.

### 4.2 REA'yı plan boyunca somut kullanma

1. L00'da seçilen **gerçek candidate** worker/bundle/WASM dosyalarının SHA'larını al. İlk analiz main/v33 çıktısına aittir; v71 veya yeni candidate için yeni run klasörü kullan.
2. Sabit REA sürümüyle compiler/worker/build çıktılarında import/export, entrypoint, message boundary ve dağıtılan asset bağımlılıklarını incele. Dynamic import için statik bulguyu network trace ile doğrula.
3. Hatalı açılıştan alınmış **ayıklanmış HAR** üzerinden prepare/manifest/chunk/index/metadata sırasını ve aynı ID'nin yanıtlarını araştır. REA komut ve tool parametrelerini kurulu sürümün `--help`/tool catalog'undan doğrula; var olmayan komut adı üretme.
4. WASM gerekiyorsa REA'nın exact sürümündeki `inspect_wasm_artifact` sözleşmesini ve WABT gereksinimini doğrula; import/export ve statik memory min/max/shared/memory64 beyanlarını incele. Gerçek runtime memory büyümesini worker telemetry ile ayrıca ölç. AST/metadata, decoder semantics testi yerine geçmez.
5. Her bulguya `question → target SHA → command/tool → evidence location → conclusion → limitation → regression test` zinciri ekle. 5 MB'lık raporu model bağlamına tümüyle dökme; belirli bulguları kaynak konumuyla çıkar.
6. Native PE incelemesi yalnız somut, cevaplanmamış bir interoperability sorusu varsa ayrı ve dar bir araştırma olur. Windows Ghidra desteğinin deneysel sınırları ve provider kurulumu doğrulanır. Hopper/Ghidra/IDA lisansı veya kurulu olduğu varsayılmaz. İlk çözüm olarak AutoCAD binary'lerini decompile etmek gerekmiyor.

REA, runtime CAD decoder/renderer bağımlılığı yapılmaz; tarayıcıya/Vercel bundle'ına paketlenmez. Görevi inceleme ve kanıt üretimidir. Resmi başlangıç ve tool sınırları [sabit kaynak README](https://github.com/morluto/rea/blob/376eeca770820b31f7f8d4c5fcc397315621643e/README.md) ve clone içindeki `docs` üzerinden kontrol edilir.

**Doğrulanmış ek CLI sözleşmeleri:** Aşağıdaki örnek yollar uygulayıcı tarafından gerçek, ayıklanmış artifact yolu ile doldurulur; komutlar bu plan oturumunda çalıştırılmadı.

```powershell
npx --yes --package rea-agents@6.5.0 rea inspect-web-network-capture "C:\GERCEK_RUN_DIZINI\sanitized-session.har" har --json
npx --yes --package rea-agents@6.5.0 rea trace-application-feature "C:\GERCEK_RUN_DIZINI\trace-input.json" --json
```

HAR aracı offline çalışır; kayıtlı URL'leri fetch etmez. Bu kaynak sürümündeki sınırlar 32 MiB HAR input, 96 MiB decoder reply ve 64 nesting'dir. Kayıt seçimi original 0-based producer ordinal kullanır; az record seçmek tam decode maliyetini azaltmaz. Export öncesi cookie/auth/header/body/URL token'larını ayıkla. Trace JSON içindeki `application`, analiz JSON'unun **tam nesnesidir**, dosya yolu/string değildir; `seed` ve `direction` gerçek soruya göre tanımlanır. Sadece worker'da `chunk_model_004` string'i bulunmaması HTTP sorununun yokluğu değildir; network host bundle'ı ayrıca incelenir. [HAR sözleşmesi](https://github.com/morluto/rea/blob/376eeca770820b31f7f8d4c5fcc397315621643e/docs/web-network-captures.md), [JS/trace sözleşmesi](https://github.com/morluto/rea/blob/376eeca770820b31f7f8d4c5fcc397315621643e/docs/javascript-application-workflows.md)

WASM lane'i için operatörün WABT **1.0.42** araçları (`wasm-validate`, `wasm-objdump`, `wasm2wat`) gerekir; `REA_WABT_BIN_DIRECTORY` yalnız mevcut gerçek dizine ayarlanır. CLI biçimi `rea inspect-wasm-artifact <wasm> --glue_paths <glue.js> --format json` şeklindedir. Kaynak sözleşmesindeki **dosya başına 8 MiB** sınırı büyük CAD WASM'larını dışarıda bırakabilir; Windows toolchain bu oturumda NOT_VERIFIED'dır. Limitin etrafından dolaşmak için binary parçalama veya “analiz edildi” iddiası yok; gerekirse desteklenen başka statik araç ayrı doğrulanır. [WASM sözleşmesi](https://github.com/morluto/rea/blob/376eeca770820b31f7f8d4c5fcc397315621643e/docs/wasm-artifacts.md)

### 4.3 AutoCAD LT kurulumu ve doğru oracle yolu

Kurulum dizini `C:\Program Files\Autodesk\AutoCAD LT 2027` doğrulandı; `acadlt.exe` (ProductVersion `R26.0.60.0.0`) ve **`accoreconsole.exe`** (`26.0.60.0.0`) gerçekten var. EXE varlığı LT'de desteklenen/headless/server kullanım hakkı veya otomasyon desteği kanıtı değildir.

Resmi 2027 API matrisinde Windows LT için AutoLISP desteklenir; Visual LISP/ActiveX sınırlıdır, ObjectARX ve Managed .NET gibi full AutoCAD API'leri LT'ye varsayılamaz. ActiveX yalnız AutoLISP içinden sınırlıdır; LT'yi dış uygulamadan COM ile kontrol etme yolu varsayılmaz. [Autodesk 2027 API matrisi](https://help.autodesk.com/cloudhelp/2027/ENU/AutoCAD-Customization/files/GUID-E6429154-36DF-4D84-8ABC-9FCA15B66158.htm), [Autodesk LT ActiveX kapsamı — 2026 belgesi](https://help.autodesk.com/cloudhelp/2026/ENU/AutoCAD-ActiveX/files/GUID-9C082B2D-015E-43C1-9168-623A2EA91D94.htm)

Öncelikli oracle yolu **GUI AutoCAD LT + desteklenen komut/script + gerekirse sınırlı AutoLISP** olacaktır. Autodesk'in LT başlangıç script yolu `acadlt drawing_name /b script_name` olarak belgelenir; script argümanı son sıradadır. Gerçek script kontrollü test kopyasında, diyalog/timeout ve kapanış davranışı doğrulandıktan sonra kullanılır. [Autodesk 2027 startup script belgesi](https://help.autodesk.com/cloudhelp/2027/ENU/AutoCAD-Customization/files/GUID-8675B657-8C15-4594-BDFB-644B66BD02D7.htm)

- L06 capability probe: binary ürün/sürüm, desteklenen komutlar, AutoLISP fonksiyonları, script/log/screenshot/export yetenekleri; ham sonuçları kaydet. Full AutoCAD COM ProgID, Python COM, .NET plug-in veya LT Core Console desteği tahmin edilmez.
- `accoreconsole.exe` yolu capability probe için envanterdir; LT 2027 için resmi destek doğrulanmadan bu executable'a otomatik batch pipeline bağlanmaz. GUI script lane bağımsız olarak ilerleyebilir.
- Kaynak dosya kopyasında çalış; AutoCAD'in otomatik upgrade/recover/audit/purge/explode/save işlemlerini orijinale uygulama. Kaynak ve test kopyasının işlem öncesi/sonrası SHA eşitliğini denetle. Dönüştürülmüş DXF/PDF/PNG ayrı artifact olur.
- DWG→DXF export ikincil decoder karşılaştırması için yararlıdır; DWG desteğinin tek başarı ölçütü olamaz. DWG ve export DXF aynı kaynaktan türemiş olsa da birbirinin birebir kaynak SHA'sı değildir.
- AutoCAD; yerel referans üreticisidir. Kullanıcı bilgisayarını production conversion sunucusu, kurulu lisansı da otomatik server lisansı sayma. Autodesk font/DLL dosyalarını web sitesine kopyalama.

İlk envanterde `acadlt.exe` için Authenticode `HashMismatch`, `accoreconsole.exe` için `Valid` gözlendi. Neden araştırılmadı; lisans veya güvenlik hakkında sonuç çıkarılmadı. Oracle çalıştırılmadan önce ürün build/sürüm ve kurulum bütünlüğü Autodesk'in desteklenen yöntemiyle doğrulanır; bu plan kurulum dosyalarını değiştirmez.

## 5. Corpus, bağımsız oracle ve kabul ölçümü

### 5.1 Mevcut corpus ve eklenecek vakalar

| ID | Mevcut gerçek dosya | Boyut / eksik kapsam |
|---|---|---|
| R001 | `eklediklerim/ornek_dosyalar/1 ve 2.kat dwg.dwg` | 3.444.087 byte DWG, AC1032 |
| R002 | `eklediklerim/ornek_dosyalar/kiris_acilimlari_tum_katlar.dwg` | 2.139.550 byte DWG, AC1032 |
| R003 | `eklediklerim/ornek_dosyalar/MUSTAFA SELVİ 1.KISIM STATİK.dwg` | 16.084.252 byte DWG, AC1032 |
| R004 | `eklediklerim/ornek_dosyalar/SÜHEYLA KARA STATİK (HAFİF).dxf` | 55.259.742 byte DXF, manifest AC1021 |
| FAIL-404 | Ekran görüntüsündeki `...KIRILIM_YAZISIZ.dxf` | Birebir kaynak henüz eşlenmedi; gerçek regression dosyası olacak |

SHA'lar `tests/cad-v2/fixtures-manifest.json` içinden doğrulanır; dosya sadece adına bakılarak eşlenmez. `DWG_PLAN_DURUMU.md`'deki beş masaüstü dosyasının bu dört fixture ile aynı olduğu varsayılmaz. Farklı çalışma ağacı/dosyalar ayrı kayıt tutulur.

Ek corpus: gerçek 30–70 MB DWG, 70 MB sınırına yakın yoğun çizim, eski/yeni DWG sürümleri, ASCII/binary DXF, Türkçe/codepage, çok katman/block/XREF, yoğun hatch/metin, büyük dünya koordinatı, çok viewport. Byte ekleyerek şişirilmiş dosya performans corpus'u değildir. Eksik gerçek dosya sınıfı NOT_RUN kalır; yerel sentetik sınır testleri yine yapılır. Müşteri çizimleri public fixture olarak commit edilmez; paylaşılabilir minimal örnekler anonimleştirilir.

### 5.2 Oracle manifesti

Her oracle için: fixture ID/source SHA/byte, AutoCAD LT ürün build'i, açılış uyarıları, decoder'ın raw format bilgisi, Model/Layout, viewport/layer görünürlüğü, camera world rect, image boyutu/DPR, arka plan, units/UCS, font adı/substitution ve `LTSCALE/CELTSCALE/MSLTSCALE/PSLTSCALE`, lineweight/plot profili kaydedilir. Ekran görünüşü ile CTB uygulanmış plot karşılaştırması ayrı profillerdir.

Kaynakta eksik XREF/font/image varsa AutoCAD'in de neyi gösterdiği kaydedilir. Oracle'ın makinedeki ek kaynakları kullanıp web sürümünün tek dosyayla bunlara ulaşamaması adil karşılaştırmada gizlenmez. Platformun yeniden dağıtılabilir kaynaklarıyla elde edilebilen profil ve unavailable/substitute profil açıkça ayrılır.

### 5.3 Bağımsız doğruluk koşulları

- **Semantik:** raw handle/type/layout/owner census; canonical instance; block expansion; primitive; dropped/unsupported/invalid/degraded nedenleri. Raw entity sayısıyla primitive sayısı birebir eşit olmak zorunda değildir; her dönüşüm açıklanabilir olmak zorundadır.
- **Sayısal:** LINE endpoint, radius/angle, block affine dönüşümü, hatch delik alanı, units/bounds ve kaynak ölçüleri bağımsız beklenen değerlerle sınanır. Aynı compiler fonksiyonuyla “expected” hesaplayıp kendini doğrulama yapılmaz.
- **Görsel:** tam görünüm + dosya başına en az 10 anlamlı ROI; yazı/ölçü, hatch deliği, block, kesikli çizgi, pafta, büyük koordinat/detay kapsanır. Görüntü registration yalnız kamera/ölçek için yapılır; bozuk geometriyi gizleyen elastik warp yapılmaz.
- **Raster metrik:** alpha>0 veya canvas boyutu yeterli değildir. Bilinen arka plandan farklı içerik maskesi, missing/extra stroke, ROI ve edge-distance ölçülür; anti-aliasing/DPR etkisi ayrıca tutulur. SSIM tek başına kabul değildir.
- **Eşiklerin ayrımı:** mevcut `motor_v2/29_RENDER_VE_YASAM_DONGUSU.md` final geometrik hata bütçesi **≤0,25 CSS px**, `28_PAN_ZOOM_FIT_SOZLESMESI.md` pan/anchor hatası **≤0,25 CSS px** olarak korunur. Transient refinement mevcut ayrı bütçesiyle ölçülür; raster toleransına dönüştürülerek gevşetilmez. Mevcut bazı raster fixture'larında **≤1,25 CSS px** edge-distance zarfı anti-aliasing ve stroke kapsamıyla birlikte değerlendirilir; bu değer geometri hedefinin yerine geçmez. Native raster, glyph/fill/lineweight ve her anlamlı ROI için ayrı ölçü/tolerans L06'da bağımsız oracle ile kalibre edilip dondurulur. Sayısal örneklerde `max(1e-6 çizim birimi, referans uzunluğun 1e-9'u)` başlangıç toleransıdır; mevcut daha sıkı fixture koşulu korunur. Sonraki değişiklik gerekçeli karar kaydı gerektirir.
- **Kritik sıfır kayıp:** ROI'de eksik kolon/kiriş sınırı, ölçü değeri, metin satırı veya hatch adası varsa global skor yüksek olsa da FAIL.

## 6. Aşamalı uygulama paketleri

Her paket, Luna'nın birkaç bağlı işi doğrulayıp kayıt bırakabileceği büyüklüktedir. Paket kimlikleri `L00–L14` yeni plana aittir; eski F07/R01/G15 kimliklerini yeniden adlandırmaz. Gerekli eşleme L00'da yapılır. Aşağıdaki paketler henüz uygulanmamıştır.

| Paket | Amaç | Bağımlılık | Başlangıç durumu |
|---|---|---|---|
| L00 | Checkout, kanıt ve backlog uzlaştırma | Yok | NOT_STARTED |
| L01 | Gerçek 404 reproduction + ölçüm | L00 | NOT_STARTED |
| L02 | Güvenilir testler + dosya/paylaşım yetkisi | L01 | NOT_STARTED |
| L03 | Kalıcı repository + atomik publish | L01–L02 | NOT_STARTED |
| L04 | Bounded compiler işi ve lease/fence | L03 | NOT_STARTED |
| L05 | İstemci retry/cancel/ready sözleşmesi | L03–L04 | NOT_STARTED |
| L06 | REA + AutoCAD bağımsız oracle | L00; L01 ile paralel olabilir | REA ilk analizi DONE; oracle NOT_RUN |
| L07 | Decode, census ve kaynak semantiği | L06 | NOT_STARTED |
| L08 | Geometri, hatch ve hassasiyet | L07 | NOT_STARTED |
| L09 | Yazı, çizgi, ölçü ve renk eşliği | L07; L08 ile kısmen paralel | NOT_STARTED |
| L10 | Model/Layout/viewport ve dış kaynaklar | L08–L09 | NOT_STARTED |
| L11 | Büyük dosya performansı ve yaşam döngüsü | L05, L08–L10 | NOT_STARTED |
| L12 | Gerçek kullanıcı ve cihaz UX'i | L05, L10–L11 | NOT_STARTED |
| L13 | Birleşik bağımsız release kabulü | L02–L12 | NOT_STARTED |
| L14 | Tek kontrollü yayın ve rollback | L13 + gerekli kullanıcı cutover kararı | NOT_STARTED |

### L00 — Kaynağı ve kabul listesini sabitle

**İşler:**

1. İki checkout'un branch/HEAD/dirty/untracked listesini, protected core hash'lerini, package-lock ve worker/WASM/font digest'lerini ayrı snapshot'a kaydet. Dirty değişiklikler için binary patch ve gerekiyorsa untracked dosya kopyalarıyla geri alınabilir yerel checkpoint hazırla; kullanıcı verisini taşıma/silme/stash etme.
2. v33↔v71 farklarını yalnız görev kapsamındaki dosyalarda karşılaştır. Güncel işin sahibini ve candidate çalışma ağacını kanıtla belirle; eşzamanlı çalışan başka oturumun dosyalarını overwrite etme. Mevcut uygun ağacı kullan; sırf düzen olsun diye yeni worktree açma.
3. `DWG_PLAN_DURUMU.md`, `motor_v2/uygulama__DURUM.md`, eski v3 planı ve bu plandaki B01–B12 için `OPEN / RESOLVED / NEEDS_REPRODUCTION` tablosu oluştur. v71'de çözülmüş scheduler/spline/TTL işini yeniden yazma.
4. Mevcut test discovery ile npm gate'lerini eşleştir; eski kanıtların SHA/diff/fixture/bundle kimliğini kaydet. `PROJECT.md`'deki iki V2'nin adını uygulama sırasında doğru ayır.

**Çıkış:** tek candidate tanımı (HEAD + dirty fingerprint), geri dönüş kaydı, sonlu açık kabul listesi. Güvenilmeyen eski PASS yeni kabul sayılmıyor. Kaynak uzlaştırması tamamlanmadan motor dosyası değiştirilmez.

### L01 — Gerçek hata için tekrar üretilebilir kanıt

**İşler:**

1. FAIL-404 kaynağını yetkili dosya kaydından bul; download/fixture SHA'yı eşleştir. Bulunamazsa gerçek olay `NOT_REPRODUCED`, injected 404 regression ayrı `PASS/FAIL` tutulur; kaynak incelemesi yine ilerler.
2. Tek açılışın prepare body/job/session/scene/object ID'leri, build kimliği, response code/body sınıfı, requested object pathname ve storage mode'unu korele et. Değer yerine config capability boolean kaydet; secret dökme.
3. Production/Preview OIDC-only sözleşmesi ve Vercel dışı local/CLI token sözleşmesinde, farklı boş temp/cache dizinli bağımsız süreçler kullan: prepare A → manifest B → chunk/index/metadata C. Aynı izole test backend'i, ayrı local diskler kullan. Üretimde token bypass açma; OIDC store bağlantısı yoksa mevcut fail-closed davranışı koru.
4. N'inci upload failure, manifest-first görünürlük, stale manifest, yanlış cache key ve cold start denemeleriyle B01/B02'yi birbirinden ayır. Mevcut hatayı yakalayan en küçük gerçek HTTP regresyonunu önce yaz.

**İzolasyon:** Fault injection/cold-instance testleri yalnız izole Neon test DB/schema ve test Blob store veya test principal'ına ait benzersiz prefix'te çalışır. Script, production DB/store/credential hedefinde mutation yapmayı guard ile reddeder. `DOK_LOCAL_DATA_DIR` uzak Neon/Blob'u izole etmez. Production olay incelemesi salt okunur, sınırlı tek oturumdur; oraya fault injection taşınmaz.

**Çıkış:** `olay → timeline → confirmed cause / rejected hypothesis / remaining unknown → regression` kaydı; en az bir ilgili test düzeltme öncesi FAIL. Rastgele production retry veya deploy yapılmaz.

### L02 — Test güveni ve yetki sınırlarını kapat

**İşler:**

1. G15 testindeki opsiyonel artifact/job kontrollerini zorunlu yap; bozuk dosyada `ready` kabulünü kaldır. Desktop audit'e bağımsız içerik/ROI assertion ekle. Source-string testlerini yalnız statik kontrat olarak adlandır; davranış kabulüyle karıştırma.
2. Scene→file/revision/tenant ve session→principal/share için fail-closed route sözleşmesi ve kırmızı testleri hazırla. Null mapping, yabancı share, expired/revoked/parolalı share için public read/job/heartbeat/DELETE kapsamını denetle; hemen uygulanabilir auth/origin korumalarını kapat. Kalıcı repository'ye bağlı tam uygulama ve cold-read başarı kabulü L03'te tamamlanır.
3. Prepare kaynağını yalnız server-side kayıttan çöz. Kaynak URL manipülasyonu, iç ağ/metadata adresi, redirect, traversal ve limitleri izole testlerde sınayıp serbest istemci URL yolunu kaldır. Üretimde iç ağ taraması yapma.
4. Test verisini run-level `DOK_LOCAL_DATA_DIR` ile ayır; before/after kullanıcı DB hash ve kayıt kümesi eşitliğini denetle. Tarihsel evidence dosyalarını ezmeyen run dizinleri ve test runner timeout/cleanup sağla.

**Çıkış:** gerçek route testleri yabancı nesne ve credentialed cross-origin mutation'ı yakalıyor; hemen uygulanabilir auth korumaları geçiyor. Kalıcı mapping'e bağlı pozitif cold-share testleri L03 için açık kalır; bütün yetki paketi L02+L03 ortak kabulüdür. Test FAIL'i exit!=0, timeout açık FAIL/NOT_RUN; atlanan test PASS sayılmıyor.

### L03 — Kalıcı sahne ve atomik publish

**İşler:**

1. Mevcut Neon/Private Blob sözleşmesine uyan repository ekle/bağla. Jobs/sessions/idempotency/revision/scene-object ilişkileri durable olur; şema ID ve aktif unique index farklarını migration testiyle çöz. L02'nin kalıcı object/session yetki bağını da bu repository üzerinden tamamla.
2. Tüm Blob IO'da ortak configuration/options yolunu kullan; Vercel Production/Preview OIDC, Vercel dışı local/CLI token ve eksik config ayrı davranış testleri. Üretimde token bypass veya geçici diske sessiz kalıcı fallback yok; configuration error sınıflanır.
3. Attempt prefix + immutable nesneler + set/hash/length doğrulaması + manifest-last + koşullu READY transaction uygula. Metadata/index/chunk/manifest aynı durable read contract'ını kullanır. Cache hit öncesi compiler/schema/ABI/font/resource kimliğini doğrula.
4. Eski eksik sahne için quarantine/controlled rebuild; orphan staging için grace+lease-aware reconcile; DB pointer/object set yedekleme ve temizleme runbook'u hazırla. Aktif sahneyi indiscriminately silme.

**Çıkış:** A/B/C bağımsız süreç testi; bütün parça/index/metadata upload noktalarında fault injection; kill/restart; stale attempt ve aynı artifact'e 10 prepare. Hiçbir eksik nesne seti ready değil; restart sonrası eksiksiz sahne tekrar bulunuyor. L02'nin bütün pozitif/negatif yetki testleri geçer; geçerli cold share başarılı, yabancı share/session reddedilir.

### L04 — Hazırlama işini request ömründen ayır

**İşler:**

1. Mevcut `services/cad-v2-compiler/{supervisor,compiler-child}` kodunu yeniden kullanma uygunluğu için denetle. Route; yetki, kaynak revision ve job enqueue yapar. Compile ayrı bounded worker'da gerçekleşir; isimsiz fire-and-forget Promise kalmaz.
2. Durable claim/lease/heartbeat/fence, exponential retry, max attempt ve terminal error ekle. Process kill/OOM/timeout sonrası iş kurtarılır; source yoksa hemen typed failure, sonsuz preparing yok.
3. Decode/compile aşamalarını input byte, memory/RSS, zaman ve parallelism sınırlarıyla çalıştır. Fencing yalnız başlangıçta değil publish transaction'ında da doğrulanır. İki izleyici/tek çıkış refcount ve expired lease davranışını sınar.
4. Yerel ölçümlere göre compiler host ADR'si hazırla. Mevcut ayrı hazırlama hizmeti kararını koru; Vercel worker/container/queue uygunluğu ancak gerçek plan sınırları, paketler ve kaynak tüketimiyle karşılaştırılır. Yeni ücretli kaynak/sağlayıcı otomatik açılmaz.

**Çıkış:** queued iş process restart sonrası ilerler veya sınıflanmış terminal sonuç verir; API 202 ve izlenebilir job döner; request kapanması işi kaybettirmez. Worker fail/cancel/source revision change sonrası eski artifact yayınlanmaz.

Not: Vercel Functions süre/bellek/payload sınırları plan ve runtime'a bağlıdır; mevcut account sınırları uygulama anında doğrulanır. Büyük dosya tarayıcıdan prepare JSON'una/base64'e sokulmaz. Güncel limitler [Vercel Functions limits](https://vercel.com/docs/functions/limitations) kaynağından kontrol edilir; limite yalnız timeout artırarak yaklaşılmaz.

### L05 — Yükleme, retry ve hata kurtarma

**İşler:**

1. Host state machine'i Bölüm 3'e bağla. v71 görünür chunk scheduler/generation/StrictMode düzeltmelerini koru; host tekrar yazılmaz. Terminal error/cancel/unmount bütün sibling fetch/poll/worker/heartbeat'i kapatır.
2. HTTP/error retry tablosunu uygula; aynı generation için repair en fazla bir. Progress; indirilen/doğrulanan/görünür/çizilen parça sayılarını ayırır. Gerçek çizimden önce ready olmaz.
3. Manifest/object hash, byte length, binary magic/schema/ABI/table offsets/typed array allocation sınırlarını decode öncesi doğrula. Truncated/bomb/overflow ve NaN/Infinity girdileri bounded reddet.
4. A→B→A file switch, geri/ileri, hızlı tekrar dene, unmount sırasında response, background→resume, auth expiry ve network offline→online senaryolarını gerçek mount+HTTP ile sınayıp generation sızıntısını kapat.

**Çıkış:** injected 404 tek sınıflanmış hata verir; üçlü kör chunk retry ve request seli yok; terminal sonrası ağ sessiz. Fallback açık kullanıcı eylemiyle çalışır ve V2 hatası diagnostic olarak korunur.

### L06 — REA araştırması ve AutoCAD referans seti

**İşler:**

1. Bölüm 4'teki REA run'ını candidate asset'lerinde yeni run ID ile tekrarla. Network/HAR bulgularını statik graph'tan ayrı kaydet; build/source/worker ilişkisinde yanlış deploy dosyası olmadığını denetle.
2. AutoCAD LT capability probe ve kontrollü read-only GUI script lane'i hazırla. Referans dosyalar üzerinde `SAVE/AUDIT/PURGE/EXPLODE` çalıştırma; dönüşüm gerekiyorsa ayrı kopya ve yeni kaynak kimliği kullan.
3. R001–R004 + FAIL-404 için Model ve mevcut Layout görünüşleri, tam görünüm ve en az 10 ROI, sayısal ölçüler/type census, font ve resource uyarıları üret. Kaynağı bilinmeyen dosya için oracle uydurma.
4. Tarayıcı camera/scale/viewport/profile'i eşleştiren karşılaştırma harness'i kur; independent oracle toleranslarını Bölüm 5'e göre kalibre et. Golden güncelleme başarısız snapshot'ı kabul etme yolu değildir.

**Çıkış:** source SHA + native program build + görüntü profiliyle tekrar üretilebilir referans seti. REA run PASS ve native parity PASS ayrı etiketlenir. AutoCAD kullanılamazsa bağımsız yerel geliştirme ilerler; ilgili native kapı NOT_RUN kalır.

### L07 — Decode ve eksiksizlik muhasebesi

**İşler:**

1. Raw type/handle/owner/layout envanterini decoder çıkışından, filtre öncesi al. Converted, expanded, clipped, invisible, invalid ve unsupported nesneleri nedenleriyle eşle. SOLID, 3DFACE/TRACE ve mevcut union/switch farklılıklarını feature atlasıyla doğrula.
2. DWG sürüm/magic, ASCII ve binary DXF, codepage/Unicode escape, Türkçe `İ ı Ş ş Ğ ğ Ç ç Ö ö Ü ü`, ölçü sembolleri ve bozuk/truncated input için gerçek fixture/sentetik edge case hazırla.
3. Model/Paper ownership, nested INSERT/MINSERT, mirror/nonuniform scale, BYBLOCK/layer0, ATTRIB/ATTDEF, OCS/UCS/extrusion, units/$INSUNITS ve büyük koordinatı kaynak semantiğiyle çöz.
4. Dynamic/annotative/proxy/custom objects, MLEADER, underlay ve bilinmeyen entity'lerin destek düzeyini açık atlasla tut. Yetkili decoder bunları veremiyorsa görünür diagnostic/degraded; destek sözü sessizce daraltılmaz.

**Çıkış:** raw'dan kaybolan açıklamasız handle=0; desteklenmeyen çizim exact olamaz. Aynı dosyanın DWG ve AutoCAD export DXF farkları teknik kanıt olarak raporlanır; wrapper'daki `success` tek başına clean decode değildir. Tarihsel LibreDWG error 68 gibi uyarılar source SHA bazında yeniden doğrulanır.

### L08 — Geometri ve görüntü hassasiyeti

**İşler:**

1. LINE/ARC/CIRCLE/ELLIPSE, kapalı/açık LWPOLYLINE bulge, nonuniform/mirror affine ve spline için bağımsız sayısal oracle; periodic/rational/tekrarlı knot/degenerate profillerini kapsa. v71'deki çözülmüş periodic testi yeniden keşfetme.
2. HATCH dış/iç loop, island/nesting, concave/self-intersecting/invalid sınır, pattern origin/angle/scale ve curved boundary triangulation/refinement testleri. Runtime fill remesh ile boundary çizgisi aynı kalite sözleşmesine uyar.
3. Float64 dünya, chunk-local origin ve Float32 GPU roundtrip hatalarını; curve tessellation + affine transform + glyph/fill + chunk seam toplamıyla ölç. Cap/budget aşımı sınıflanır; NaN/bounds outlier tüm Fit'i bozmaz.
4. DPR1/2/3, fit/zoom/pan ve Model/Paper dönüşümünde statik+worker refinement kalite monotonluğu, stale yanıt reddi ve global primitive draw order'ı gerçek render ile denetle.

**Çıkış:** kabul edilmiş destek profilinde Bölüm 5 hata sınırları ve kritik ROI sıfır kayıp; curve düzgünken fill'in bozulması ya da farklı chunk geliş sırasıyla wipeout sırasının değişmesi FAIL.

### L09 — Metin, ölçü, çizgi ve kaynak görünüşü

**İşler:**

1. SHX/TTF, text style width/oblique/bigfont, baseline/alignment, mirrored text, MTEXT satır/paragraf/stack/fraction/escape, background mask, Türkçe ve simgeleri native ROI ile kıyasla. Browser UI fontuyla sessiz font değiştirme yok.
2. Gerçek platform font dosya hash'lerini ve alias/fallback politikasını scene identity'ye bağla. Exact bulunamazsa mevcut ürün sözleşmesindeki Arial fallback'i açık substitute+degraded olur; missing glyph görünür tanı verir. Font byte değişimiyle cache miss testi service+CLI düzeyinde zorunlu.
3. ACI/truecolor/BYLAYER/BYBLOCK/alpha, source/monochrome, background ve lineweight; polyline variable width, join/cap, çok terimli linetype, dot/shape/text, dash phase ve `PATH_DISTANCE` tüketimini gerçek shader/raster çıktısıyla denetle.
4. DIMENSION/anonymous block/override/style, oklar, extension lines, annotative scale, ATTDEF/ATTRIB yerleşimi ve mevcut leader desteğini gerçek kaynak örnekleriyle sınayıp atlası güncelle.

**Çıkış:** ölçü değeri/yazı satırı eksik değil; fondu değiştirmek geometriyi kaybettirmiyor; source↔monochrome dönüşü reparse etmeden kayıpsız. Font substitution ya da unsupported ölçü profili exact sayılmıyor.

### L10 — Pafta, viewport ve dış kaynak davranışı

**İşler:**

1. Model/Paper ayrımı; birden çok viewport, scale/twist/center, rectangular/nonrectangular clip, viewport layer freeze/override ve draw order'ı AutoCAD oracle ile sınar.
2. XCLIP/SPATIAL_FILTER, nested block clip, WIPEOUT, mask, IMAGE/PDF underlay/OLE gibi kaynakları feature matrisine bağla. Kaynakta bulunmayan companion verisi çizilmez; dosyanın mevcut içeriği yine gösterilir.
3. Layout değişiminde doğru görünür chunk seti ve camera restore; source/monochrome/layer state tutarlılığı; hızlı layout switch sırasında stale veri ekrana eklenmemesi.
4. Mühendislik çizimlerinde fit, gerçek dünya bounds, aşırı uzaktaki tek entity ve boş görünür layer durumlarını sınar; boşluk geçerli ise bozuk dosya diye sınıflama.

**Çıkış:** Model ve her desteklenen Layout'ta kritik ROI'ler korunuyor; dış kaynak eksiği kullanıcıdan zorunlu ek dosya istemeden açıklanıyor. Başka bir viewport'un geometri/katman durumu sızmıyor.

### L11 — Büyük dosya, kaynak bütçesi ve yaşam döngüsü

**İşler:**

1. v71 scheduler/admission/cache implementasyonunu ölç; görünür ROI önceliği, bounded transfer/decode queue, CPU+GPU+refinement bütçesi, oversized single chunk ve fairness'i gerçek hostta sınar. Yeni scheduler baştan yazılmaz.
2. Ölç: source-fetch/decode/compile/publish, cold/warm time-to-first-meaningful-frame, görünür alan tamamlanma süresi, istek/byte sayısı, long task, p50/p95 frame time, Node/worker/browser OS peak RSS ve GPU buffer tahmini. Tahmini buffer byte'ı gerçek VRAM veya toplam process peak diye etiketleme.
3. 20 gerçek aç/kapat, A/B dosya geçişi, pan/zoom/layer/layout, tab background/restore ve gerçek `WEBGL_lose_context` kayıp/kurtarma döngüsü. Worker, event listener, RAF, fetch, GPU geometry/material/texture ve session leak'lerini ölç.
4. CPU/GPU/bütçe baskısında görünür parçanın eksik kalmasını kalite/tamamlık durumuna bağla; LOD/detail yeniden getirme ve eviction canlı viewport'u bozmasın. Source geometriyi silerek ya da font/hatch'i atarak hız kazanma yok.

**Çıkış:** 0–30 / 30–70 MB sınıfları ayrı; keşif/smoke için en az 5 cold/warm örnek, **release benchmark için her dosya/koşulda en az 30 tekrar** (`motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md:139`). Otuz örnekten güvenilir p99 sonucu çıkarılmaz; 5 koşuluk smoke'dan release yüzdelikleri üretilmez. Kritik testlerde 0 leak/0 crash/0 missing content; sürekli büyüyen bellek yok, cache plateau ve tavanı açıklanmış. Mevcut başlangıç hedefleri korunur: masaüstü frame p95≤20 ms, ağır çizim telefon frame p95≤33 ms, input yanıt p95≤100 ms, cancel UI≤200 ms; backend cleanup ayrıca ölçülür (`07_PERFORMANS_VE_BELLEK.md`). CPU resident ve GPU tahmin bütçeleri **64 MiB / 64 MiB** başlangıç sözleşmesidir (`29_RENDER_VE_YASAM_DONGUSU.md:39`); toplam browser/VRAM garantisi değildir. Hedef/bütçe değişikliği yalnız ölçüm ve gerekçeli ürün kararıyla yapılır; test geçsin diye büyütülmez. Bunlar mevcut ölçülmüş başarı iddiası değildir. Cold compile ve hazır sahne ilk faydalı görünüm süreleri donanım/ağ/sınıf bazında ölçülüp hedefi L00/L06'da sabitlenir; ölçülmeden SLA uydurulmaz.

### L12 — Gerçek kullanıcı akışları ve mobil kabul

**İşler:**

1. Dosya listesi → V2 aç → kaynak çizim → pan/wheel/fit/layer/layout → geri dön → aynı dosya tekrar aç akışı. V1/V2 split karşılaştırması render oracle yerine geçmez; iki motor aynı kaynağı ve doğru viewport'u alır.
2. Windows Chrome ve Edge, Chromium/WebKit tarayıcı otomasyonu; gerçek Poco X6 Pro'da dokunma/pinch/pan, portrait/landscape, long-press/context menu, sheet scroll ve bellek baskısı. iPhone/tablet gerçek erişim yoksa ilgili kapı NOT_RUN; emülasyon fiziksel cihaz kabulü sayılmaz.
3. 320/390/430/768/1024/1366/1920 genişlikler, kısa yatay ekran, DPR ve browser zoom; canvas tam viewport, safe area, 44 px hedefler, focus trap/restore, keyboard ve screen reader durumları.
4. Loading/cancel/error/retry/fallback Türkçe ve erişilebilir; teknik chunk ID ana kullanıcı mesajına egemen olmaz, diagnostic ayrıntıda correlation ID bulunur. İndir ve mevcut görüntüleyiciyle aç yolları çalışır.

**Çıkış:** görünmeyen buton, takılı spinner, canvas üstünü kapatan panel veya kaybolan çizim yok; kaynak dosya değişmiyor. Ölçüm/review araçları önceki davranışı koruyor; görüntüleme hedefinin önüne yeni özellik eklenmiyor.

### L13 — Birleşik release kabulü ve bağımsız inceleme

**İşler:**

1. Mevcut gate'leri candidate'da çalıştır; test discovery'de hiçbir zorunlu dosya dışarıda kalmasın. Statik/unit/integration/browser/native/device sonuçlarını ayrı tut; yalnız mock/full shared disk sonucu production dayanıklılığı sayılmaz.
2. Yeni gerçek HTTP fault/cold-instance kabulünü, source/census ve native ROI karşılaştırmasını tek release raporuna bağla. Artifact/source/build/worker/font hash'leri aynı candidate'a ait olmalı.
3. Bağımsız reviewer; B01–B12, kabul K01–K18 ve başarısız testlerin tolerans/snapshot değiştirilerek kapatılmadığını kontrol eder. Bilinen eksikler OPEN/DEGRADED/NOT_RUN olarak kalır.
4. Aynı production build üzerinde browser smoke ve Linux build/asset tracing kontrolü; package lock, worker/WASM MIME/path, font notice ve `.vercelignore` bağımlılıklarını doğrula. Yeni artifact geçmiş evidence'ı ezmez.

**Çıkış:** aşağıdaki K01–K18'in zorunlu kapsamı kanıtlı PASS; fiziksel/native eksik varsa ilgili tam kabul kapanmıyor. “Lokal release adayı” ve “production kabulü” farklı etiketlerdir.

### L14 — Kontrollü yayın, takip ve rollback

**İşler:**

1. `AGENTS.md`/Vercel kurallarını yeniden kontrol et. Uzaktan çalışma `internal-*` veya `chatgpt-*`, ara checkpoint gerekiyorsa `[skip ci]`/`[skip vercel]`; tek amaca ait değişiklikler tek anlamlı commit/push'ta toplanır. Dosya başına commit, noop/retry deploy yok.
2. Varsayılan plan bütçesi **0–1 Preview, en fazla 1 Production**; repo üst sınırı olan 4 Preview tüketilecek kota değildir. Build sistemi değişmişse aynı candidate commit için Vercel Linux Preview READY ve smoke gerekir; production'da doğrulanmış artifact promote edilir. Böyle bir değişiklik yoksa doğrulanmış tek main release yolu repo kurallarıyla seçilir; iki ayrı production build/deploy yolu peş peşe kullanılmaz.
3. Kullanıcının açık cutover/baseline kararı gerekiyorsa kanıtlı candidate raporunu tamamladıktan sonra son adımda al. O zamana kadar mevcut default/fallback korunur. Production'da küçük gerçek DWG ve DXF için bir cold/warm smoke; share erişimi ve bütün object türleri doğrulanır.
4. Yayın sonrası aynı artifact üzerinde hata/latency/transfer/memory göstergelerini kontrol et. Hazır scene missing object, cross-file yetki ihlali veya veri kaybı varsa V2 girişini kapatıp doğrulanmış V1'e dön; başarısız immutable scene'i quarantine et. DB migration önce expand-compatible olmalı; rollback için kullanıcı verisi silinmez.

**Çıkış:** deployment/commit/artifact kimliği, gerekli smoke, tek rollback prosedürü ve yaşayan dokümanlar güncel. Otomatik monitor istenirse ayrıca kurulur; bu plan kendiliğinden zamanlanmış görev oluşturmaz.

## 7. Nihai kabul matrisi

| ID | Kapanması gereken koşul | Kanıt türü |
|---|---|---|
| K01 | FAIL-404 kaynağı eşlenmiş; olay nedeni kanıt/unknown ayrımıyla raporlu | Source SHA + correlated HTTP timeline |
| K02 | Vercel OIDC ve Vercel dışı local/CLI token sözleşmesinde ayrı process/cache ile bütün object türleri okunuyor; üretimde token bypass yok | İzole gerçek backend + A/B/C HTTP testi |
| K03 | Kısmi publish/kill hiçbir zaman ready üretmiyor; eski fence yayın yapamıyor | Fault injection + DB/object set denetimi |
| K04 | Null mapping, yabancı/iptal share ve yabancı session fail-closed | Gerçek admin/public route matrisi |
| K05 | Prepare keyfi kaynak URL kullanmıyor; revision/source/limit bağları geçerli | Route/adversarial fixture testi |
| K06 | Kaynak yok/OOM/timeout job terminal; bounded retry/cancel; restart kurtarma | Compiler supervisor + durable job testi |
| K07 | Terminal host sonrası ağ/worker/heartbeat sessiz; repair≤1 | Browser network trace + lifecycle testi |
| K08 | Gerçek font/resource/decoder/compiler değişimi doğru cache invalidation yapıyor | Service/CLI kimlik testleri |
| K09 | Raw→canonical→instance→primitive kaybı nedenli; açıklamasız kayıp=0 | Census manifest + bağımsız sayısal oracle |
| K10 | Kaynak metin/ölçü/renk/linetype/block/hatch destek profilinde doğru | AutoCAD aynı-kaynak ROI + numeric |
| K11 | Layout/viewport/clip/draw order ve resource eksikleri doğru | Native pafta + browser raster |
| K12 | Hata bütçesi DPR/zoom/affine/fill/glyph/seam üzerinde sağlanıyor | Bileşik error accounting + raster |
| K13 | 0–30 / 30–70 MB kaynak ve render tüketimi bounded; mevcut frame/input/cancel hedefleri korunuyor | Release: dosya/koşul başına ≥30 cold/warm tekrar + OS/worker/GPU ayrımlı ölçüm |
| K14 | 20 lifecycle, gerçek context loss, background/resume ve stale generation güvenli | Gerçek browser/resource counters |
| K15 | Windows Chrome/Edge ve gerçek Poco kullanıcı akışı kabul | Cihaz/build/run kimlikli kanıt |
| K16 | V1 fallback, readonly source, tema/erişilebilirlik regresyonu yok | Legacy + UX/source hash kontrolleri |
| K17 | Aynı candidate typecheck/build/gate/Linux asset zinciri tutarlı | Log + source/diff/bundle hash manifesti |
| K18 | Production smoke ve rollback doğrulanmış; gereken cutover kararı kayıtlı | Tek deployment raporu |

K01'de gerçek dosyaya erişim yoksa unknown saklanır; injected düzeltmeler yapılabilir ama gerçek olay çözüldü denmez. Native veya fiziksel cihaza bağımlı kapı yerine sentetik PASS yazılmaz. Test kapsamındaki desteklenmeyen içerik sessizce listeden çıkarılmaz; ürün kararı ve degraded sözleşmesiyle görünür tutulur.

## 8. Çalıştırma ve test disiplini

### 8.1 Mevcut komutlar — başlangıçta package.json ile doğrulanacak

```powershell
npm run check:cad-v2:unit
npm run check:cad-v2:integration
npm run check:cad-v2:ui
npm run check:cad-v2:release
npx tsc --noEmit --incremental false -p tsconfig.next.json
npx tsc --noEmit --incremental false
npm run check:tools
npm run build
```

| Ek komut | main / v33 | 91a0 / v71 | Kullanım |
|---|---|---|---|
| `npm run check:cad-v2:desktop-audit` | package script var | package script yok | Mevcut desktop audit spec'inin candidate'daki varlığı/config'i doğrulanarak bağlanır |
| `npm run check:cad-v2:f08:p00` | package script yok | package script var | Güçlü P00 render/resource ölçümü; gerçek HTTP testi yerine geçmez |

`check:cad-v2:release` ana checkout'ta unit→integration→UI zinciridir; genel typecheck/build/desktop/native/physical/cloud acceptance otomatik dahil değildir. Eski `check:cad-real-user-release` legacy MLightCAD davranışlarının korunması için kullanılır; yeni motorun kabulü yerine geçmez.

v33'te gate dışında olan örnekler `npx tsx tests/cad-v2/dxf-periodic-spline.test.ts` ve `npx playwright test tests/document-studio/cad-v2-nested-bulge-raster.spec.ts --project=chromium` idi. v71'de spline gate'e alınmıştır; dosya varlığını/gate üyeliğini L00'da ölçmeden yeni test icat edilmez. Production browser koşusunun desteklenen config'inde `PLAYWRIGHT_PRODUCTION_SERVER=1` kullanımı doğrulanır; mevcut çalışan kullanıcı sunucusu kapatılmaz.

v71'de `check:cad-v2:f08:p00` gerçek compiler→host→raster/occupancy/budget ölçümleri içerir; desktop audit'in zayıf assertion'ları bütün render testlerinin boş olduğu anlamına gelmez. P00 prepare/manifest/chunk API'lerini `page.route` ile karşılar: güçlü render/resource kanıtıdır, gerçek HTTP/dağıtık depolama kabulü değildir. Ayrı P00 ve desktop gate'lerinin release zincirindeki üyeliği açık kaydedilir; ihtiyaç halinde yeni wrapper'lar yerine bu testler yeniden kullanılır.

### 8.2 Yeni test adları öneridir; mevcut kabul edilmiş testlerle birleştir

`cross-instance-artifacts`, `publish-fault-matrix`, `oidc-storage-contract`, `public-route-object-scope`, `source-authority`, `http-retry-cancel`, `font-resource-cache-identity`, `raw-entity-census`, `native-roi-parity`, `production-artifact-smoke` gibi sonlu davranış grupları oluşturulabilir. Aynı davranışı tekrar eden onlarca test dosyası üretme. Yeni bir gate adı komut olarak sunulmadan önce package.json'a gerçekten bağlanmış olsun.

### 8.3 Çalıştırma sırası ve süreç sahipliği

Önce değişen davranışın dar testi; bağlı düzeltmeler tamamlanınca ilgili suite; paket kapanışında typecheck ve gerekiyorsa build/browser. Finalde tam ilgili release zinciri bir kez çalışır. Geçmiş PASS yeni çalışmış gibi raporlanmaz; başarılı geniş suite her küçük düzeltmede tekrarlanmaz.

Her bağımsız script; error→nonzero exit, dış wall-clock timeout, `try/finally` browser/worker/process kapatma ve `.agents/rules/test-ve-otomasyon-standardi.md` sözleşmesini uygular. Normal selector timeout ≤8 s; sayfa/ready için makul 30–45 s; ağır compile/büyük corpus ayrı ve ölçülmüş test bütçesi alır. Uzun testlerde 60 saniyeden uzun sessiz kalma. Yalnız bu koşunun sahip olduğu process/port/dizin temizlenir.

Kanıt klasörü önerisi: `test-output/cad-v2-luna/<UTC-run-id>/<package>/`. Her run; komut, exit, timeout, source HEAD+dirty digest, fixture SHA, compiler/schema/ABI, worker/WASM/font hash, browser/device/OS, ham ölçü ve sonucu içerir. Büyük/private çıktı ignored/artifact olur; geçmiş `motor_v2/evidence` dosyaları overwrite edilmez. DB snapshot sayı eşitliği yanında kayıt kümesi/hash eşitliğiyle korunur.

## 9. Luna için yürütme sözleşmesi ve hazır başlangıç istemi

### 9.1 Oturum düzeni

- Kullanıcı uygulamayı başlattığında L00'dan başla; her tur aynı kabul amacına hizmet eden yaklaşık **3–4 anlamlı alt işi**, ilgili test ve kayıtlarıyla bitir. Test yazmak, belge yazmak ve aynı davranış kodunu değiştirmek üç ayrı ürün işi sayılmaz.
- Bir aşama büyükse birkaç tura böl; kimliğini ve kabul kapsamını koru. Sırf daha kolay diye yeni aşamaya atlama. Bir test geçti diye aşama PASS olmaz.
- Uygulayıcı hedefi GPT‑6 Luna Extra High'dır. Bu bir çalışma ayarıdır; model adı veya kapasitesi için teknik ürün iddiası değildir. Model/effort mevcut arayüzden seçilir; uygulama bağımlılığına yazılmaz.
- Aynı dosyaya iki ajan yazmaz. Bağımsız read-only audit, fixture/oracle ve farklı modüllerde test araştırması paralel yapılabilir. Kaynak uzlaştırma, migration ve publish gibi bağımlı değişiklikler sıralı ilerler.
- Her tur sonunda: ne değişti, hangi kabul kapandı, gerçek komut/exit, açık hata/NOT_RUN, tam sıradaki işler. Yüzdeyi test sayısıyla şişirme; `kapanan/zorunlu` maddeyi ve yerel/native/device/cloud ayrımını göster.
- Durum otoritesi uygulama başladığında mevcut `DWG_PLAN_DURUMU.md` içinde bu plan revizyonuna bağlanır. Bu dosya teknik plan olarak kalır; paralel ve çelişen yeni durum panelleri açılmaz. Mimari değiştiği pakette `DOK_CONTEXT_MAP.md`, `DOK_STORAGE_CONTRACT.md`, CAD mimari hafızası ve gerekirse PROJECT güncellenir.

### 9.2 Kopyalanabilir başlangıç istemi

> GPT‑6 Luna Extra High olarak `PLAN/DWG_DXF_MOTOR_V2_GPT_6_LUNA_EXTRA_HIGH_PLANI.md` planını uygula. Önce PROJECT, AGENTS ve ilgili repo kurallarını oku. L00 ile iki checkout'u (main/v33 ve 91a0/v71) salt okunur karşılaştır; dirty kullanıcı değişikliklerini koru ve doğru candidate'ı kanıtla. Eski PASS kayıtlarını yeni kabul sayma; v71'de tamamlanmış scheduler/spline/TTL işlerini yeniden yazma. İlk hedef prepare başarılı görünürken chunk 404 oluşmasının gerçek regresyonunu ve kalıcı publish/erişim kusurlarını kapatmaktır. REA clone'u `C:\Users\hsyn\Desktop\cad-engine-references\rea`, ilk kanıt `...\analysis\cad-v2-worker-2026-10-17` içindedir; sabit sürüm ve hash ile kullan. AutoCAD LT 2027'yi yerel bağımsız görsel/numeric oracle olarak capability probe sonrası kullan; full AutoCAD API veya Core Console desteğini varsayma. Her grupta yaklaşık 3–4 ilişkili işi kod+test+kanıt ile bitir; ilk küçük işte durma, kabul kapsamını daraltma. P0→P1→fidelity→performance→gerçek cihaz→release sırasını koru. Kaynak geometriyi kaybetmeyi gizleme, font değişimini exact sayma, canlı depoyu test verisiyle kirletme. Commit/push/deploy veya primary cutover yapma; bunlar planın final paketindeki repo kuralları ve ayrıca verilen kullanıcı yetkisiyle ele alınacak. Her tur sonunda açık kabul ve bir sonraki somut grubu Türkçe raporla.

### 9.3 İlk uygulama turunun somut hedefi

1. L00 candidate ve eski durum/test gate farkları tablosu.
2. L01 için küçük ayrı-process HTTP repro ile OIDC-only ve kısmi publish ayrımı.
3. L02 public null mapping/session ownership kusurlarını yakalayan gerçek route testleri.
4. Bu üç davranışın sonuçlarıyla L03'ün kalıcı repository/publish kapsamını sabitle; zaman/bağımlılık elverirse aynı grupta dar ilk düzeltmeyi doğrula.

İlk turda bütün renderer'ı yeniden tasarlamak, paketleri topluca yükseltmek, AutoCAD binary araştırmasına dalmak veya production deploy almak yok. İlk turun başarısı, sorunun kanıtla daraltılması ve yanlış `ready`/yetki kabulünü yakalayan testlerin oluşmasıdır; yalnız yeni bir uzun plan yazılması değildir.

## 10. Kaynak, maliyet ve açık bağımlılıklar

| Konu | Karar / doğrulanacak durum |
|---|---|
| Mevcut storage | Neon + Private Blob korunacak; V2 ortak runtime konfigürasyonuna bağlanacak |
| Compiler host | Mevcut supervisor temel alınacak; gerçek peak/decode/compile/egress ölçülmeden host boyutu/fiyatı seçilmeyecek |
| Aylık kapasite | Yeni benzersiz dosya, açılış, cache-hit, ortalama/p95 artifact byte ve eşzamanlı compile varsayımları ayrı kaydedilecek |
| Maliyet hesabı | `unique compile × CPU/RAM süresi + retained artifact byte × saklama + Blob/Function transfer/request + DB`; güncel fiyatlar satın alma aşamasında resmi kaynakla doğrulanacak |
| REA | Clone ve ilk CLI analizi tamam; native provider/JDK/WABT kurulumu yapılmadı, gerektiği kanıtlanırsa ayrı hazırlık |
| AutoCAD LT | Dizin ve executables mevcut; native oracle henüz üretilmedi; capability/build/bütünlük doğrulaması yapılacak |
| Hatalı kaynak | Ekrandaki DXF'nin byte/SHA eşlemesi henüz yok; K01'i etkiler, bağımsız düzeltmeleri durdurmaz |
| Gerçek büyük corpus | 30–70 MB gerçek DWG ve üst sınıf yoğunluk çeşitliliği eksik olabilir; sentetikle gerçek kabul karıştırılmayacak |
| Fiziksel cihaz | Poco kabulü kullanıcı cihazında koşulacak; bu oturumda test edilmedi; iOS erişimi henüz bilinmiyor |
| Production RCA | Ortam capability/nesne seti/log/deployment kaynak kimliği henüz okunmadı |

Kaynak kodda OIDC modeli ile token-only guard farkı yerel olarak doğrulandı. Güncel Blob SDK OIDC/store ID ve token çözüm sırası [Vercel Blob SDK authentication](https://vercel.com/docs/vercel-blob/using-blob-sdk#authentication) belgesinde de açıklanır. Uygulamada kurulu SDK sürümü ve ortak helper sözleşmesi birlikte kontrol edilir; README örneği kör kopyalanmaz.

Next.js sürümü ana checkout'ta 16.3.6'dır. Route/cache/worker/build kodu yazılmadan **kurulu** `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`, `08-caching.md` ve ilgili güncel guide okunur; eski Next.js varsayımlarıyla çözüm kurulmaz. Build `next build --webpack`, Vercel build `npm run build` ve CAD worker/WASM/font prebuild senkronu korunur.

Bu planın bitiş çizgisi yeni bir “RELEASE READY” notu değildir: FAIL-404'ün açıklanması, eksiksiz kalıcı scene teslimi, doğru erişim sınırları, bağımsız AutoCAD eşliği, gerçek cihaz ve aynı artifact üretim kabulünün K01–K18 ile kanıtlanmasıdır.
