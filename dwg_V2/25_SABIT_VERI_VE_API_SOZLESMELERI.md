# 25 — Sabit veri ve API sözleşmeleri

[Dizin](README.md) · [EXEC-2](00_BAGLAYICI_UYGULAMA_KARARLARI.md) · [Uygulama sırası](19_GEMINI_ADIM_ADIM_UYGULAMA.md)

**Bağlayıcı EXEC-2 eki.** [31 — Sözleşme tamamlamaları](31_SOZLESME_TAMAMLAMALARI.md) bu belgenin metadata, resource, exact binary byte düzeni, renderAbi ve view-session TTL ayrıntılarını tamamlar; birlikte uygulanır. Aşağıdaki V2 yolları, tipler ve tablolar gelecekte uygulanacak; mevcut repo API'si gibi raporlanmayacak. Gemini public sözleşme seçmeyecek. Kaynak sistemdeki file/revision/tenant/permission gerçekliği adapter ile taşınacak; mevcut DB sözleşmesi bu örneğe uydurulmak için yeniden yazılmayacak. Bağ kurulamıyorsa CR açılacak.

## Veri yolu

```text
V2 açılışı → küçük yetkili prepare isteği → Neon job / mevcut hazır scene
Node supervisor → izole child process → private Blob'a manifest ve küçük chunk
Browser → yetkili V2 manifest/chunk API → private Blob'dan sınırlandırılmış byte
Browser Worker → doğrulama/unpack → transfer → V2 WebGL2 renderer
```

**Her manifest/chunk isteğinde mevcut dosya/paylaşım erişimi tekrar doğrulanır.** Blob'un doğrudan erişilebilir signed URL'si browser'a verilmez. Böylece revoke/expiry sonrasında yeni chunk talepleri reddedilir; önceden aktarılmış byte'ın cihazdan geri alınacağı iddia edilmez. Cache-Control: private, no-store; CDN/public cache ve kalıcı browser dosya cache'i yok. RAM scene cache yeni source açılışında yetki kontrolünü atlatmaz.

Bu yol Vercel'de büyük CAD parse veya büyük original proxy anlamına gelmez: **her chunk'ın depolanan ve HTTP yanıt byte uzunluğu en fazla 2 MiB**, root/index manifest en fazla 1 MiB. V2 chunk payload'ı identity encoding ile saklanır; GZIP/Brotli, sıkıştırma seçimi ve büyük Range response EXEC-2'de yok. Decoded allocation için 00'daki 8 MiB ek savunma sınırı da uygulanır. Compiler gerekirse geometrinin birden fazla chunk'ta düzenli devam etmesini sağlar; 2 MiB sınırını yükseltmez.

Yanıt küçük olsa bile toplam auth/DB/fetch maliyeti G15'te ölçülür. %20 hız hedefi uğruna private Blob URL'sine veya public cache'e gizlice geçilmez. İmzalı kaynak lease compiler'ın sunucu erişiminde kullanılabilir; browser scene erişimiyle karıştırılmaz.

## Sabit kimlikler

| Ad | Biçim ve anlam |
|---|---|
| sourceVersionKey | Kaynak sistemin immutable sürüm anahtarı; string. URL veya yalnız display version numarası değil |
| sourceSha256 | Küçük harf 64 hex, gerçek source byte hash'i |
| dependencyDigest | Canonical sıralanmış dependency kayıtlarının SHA-256'sı; font/XREF/underlay sürümleri dahil |
| compilerVersion | Runtime compiler build kimliği; sadece EXEC-2 plan adı değil |
| schemaVersion | Tam sayı 1 |
| qualityProfile | Sabit cad-v2-2d-v1; kısmi içerik bu profil tam uyumlu demek değildir |
| artifactKey | tenant scope + sourceVersionKey + sourceSha256 + dependencyDigest + decoderVersions + compilerVersion + schemaVersion + renderAbi + qualityProfile hash'i |
| sceneId / jobId / viewSessionId | Sunucunun ürettiği opaque ID; dosya yetkisi yerine geçmez |
| generation | Host içinde monoton artan tamsayı; dosya değişimi/iptalde ilerler |
| handle / instancePath | Kaynak handle kayıpsız hex string; definition handle ile instance yolu ayrı |

Dependency kayıt sırası canonical resourceKind + kaynak içindeki normalize edilmiş güvenli relative ID + hash'tir. Kaynak katman/pafta/metin adlarının harfleri veya Unicode içeriği bu sıralama için değiştirilmez. Yetkisiz tenant'ın aynı byte hash'ine sahip olması sahne paylaşım hakkı yaratmaz.

## Uygulama API yüzeyi

Admin prefix: /api/dokumantasyon/cad-v2. Public prefix: /api/public/cad-v2. Aşağıdaki suffix'ler iki kapsamda aynı davranış tipini taşır; auth context ayrı mevcut admin/public yetkisinden türetilir. Public share token'ı mevcut paylaşım doğrulamasıyla çözümlenir, yeni admin kimliği üretilmez. Token veya signed URL loglanmaz.

| Method / suffix | Girdi | Başarı ve davranış |
|---|---|---|
| POST /prepare | fileId, expectedSourceVersionKey veya null, clientRequestId UUID | 200 hazır scene ya da 202 queued/running job; viewSessionId ve doğrulanmış sourceVersionKey |
| GET /jobs/[jobId] | Kimlik + mevcut auth | İş durumu, gerçek phase, nullable progress, diagnostic özeti; sceneId yalnız ready/degraded son durumunda |
| POST /view-sessions/[viewSessionId]/heartbeat | Boş strict body + sahiplik/auth | 200; 31 TTL/heartbeat sözleşmesi |
| GET /scenes/[sceneId]/metadata/[metadataId] | Root'ta kayıtlı metadata ID | JSON ≤1 MiB, aynı source/share yetkisi |
| DELETE /view-sessions/[viewSessionId] | Kimlik + sahiplik/auth | 204; izleyici ayrılır. Ortak iş diğer izleyiciler için sürer |
| GET /scenes/[sceneId]/manifest | Kimlik + mevcut source/permission doğrulaması | schema v1 JSON; en fazla 1 MiB |
| GET /scenes/[sceneId]/indexes/[indexId] | Root manifestte kayıtlı index kimliği | JSON chunk index; en fazla 1 MiB |
| GET /scenes/[sceneId]/chunks/[chunkId] | İndekste kayıtlı opaque kimlik | application/octet-stream; en fazla 2 MiB, hash/length metadata'sıyla eş |

İstemci Blob pathname, tenantId, source URL veya worker executable vermez. expectedSourceVersionKey farklıysa 409 SOURCE_REVISION_CHANGED; sunucu başka dosyanın/sürümün sahnesini sessiz vermez. Null “yetkili mevcut sürümü çöz” demektir. İstek şeması strict doğrulanır; bilinmeyen engine/decoder parametresi kabul edilmez. POST/DELETE mevcut CSRF/origin/session sözleşmesini korur.

401/403/404 mevcut güvenli erişim politikasına göre; 409 revision çakışması; 413 tanımlı kaynak/byte sınırı; 422 format/scene uyumsuzluğu; 429 sınırlı talep; 503 geçici hazırlama hizmeti yok. API her beklenen hata için {code, message, retryable, requestId} verir. code sabit domain enum, message Türkçe ve redakte; internal stack/secret yok. Retry davranışı 00 sınırlarını aşmaz.

Public paylaşımın izin verdiği dosya/sürüm/dependency seti her endpoint'te aynı sınırdır. Geçerli job/scene ID'si ile başka dosyanın erişimini kazanmak mümkün olmayacak. Önceden yetkili bir stream başlamışken revoke oluşursa aktarılmış byte geri alınamaz; sonraki istek reddedilir. İş sırasında kaynak silinirse ready pointer publish edilmez.

## İş ve host durumları

Server job: queued → running → ready veya degraded veya failed veya cancelled. running phase: source, decode, normalize, compile, publish. Retry yalnız transient failed girişimini yeniden queued yapar ve attempt/fencing token artırır; eski attempt sonucu publish edemez. status geçmişi event/attempt kaydında korunur.

Host: authorizing → queued/preparing → loading-scene → partial → ready/degraded; cancelled/error terminal durumlar. Browser full-ready aktif paftanın istenen kaliteye ulaşmasıdır; bütün dosyanın diğer paftalarının browser RAM'inde olduğu anlamına gelmez. Server ready, manifestin ilan ettiği kapsamın derlenmiş/tamamlanmış olmasını ifade eder. Kaynak reader'da unknown olduğu halde hiçbir warning olmadan ready verilmez.

Her host/worker mesajı {protocolVersion:1, viewSessionId, generation, sourceVersionKey, kind, payload} taşır. kind: load, chunk, progress, diagnostics, ready, error, cancel, disposed. Yanlış protocolVersion veya eski generation/sourceVersionKey state'e uygulanmaz. İptal UI'ı worker mesajını beklemez; eski generation'a ait sonuçlar atılır. Payload tipleri discriminated union; any veya kontrolsüz type assertion ile geçilmez.

## Manifest v1

Root alanları (31 ile tamamlanır): schemaVersion, sceneId, sourceVersionKey, sourceSha256, dependencyDigest, decoderVersions, compilerVersion, qualityProfile, qualityStatus, diagnosticsSummary, layouts, resources, indexPages, createdAt, renderAbi, metadataPages, limits. Metadata byte sınırı dolarsa chunk indeksi sayfalara bölünür; yeni plansız root şeması kurulmaz.

| Alan | Sözleşme |
|---|---|
| qualityStatus | exact, degraded; hata/unsupported için başarı manifesti üretilmez |
| diagnosticsSummary | unknownEntityCount, unknownObjectCount, missingFontCount, missingDependencyCount ve diagnosticCode listesi; bilinmeyen sayı null |
| layouts[] | layoutId, sourceName, kind=model/paper, units, bbox, viewportMetadataIds, qualityStatus, diagnosticIds |
| resources | {metadataIds:string[]} — 31 resources sayfaları; resource record ve payload ilişkileri orada tanımlıdır; serbest dış URL yok |
| indexPages[] | indexId, byteLength, sha256, layoutIds; yetkili sabit index endpoint'iyle alınır |

Index page: schemaVersion, sceneId, pageId, chunks[]. Her chunk kaydı: chunkId, byteLength, decodedByteLength, sha256, layoutId, bbox, layerIds, orderStart, orderEnd, dependencyChunkIds, resourceIds. Hash/size/schema her payload için yüklemeden sonra doğrulanır; dependency graph/cycle/limit yüklemeden önce değerlendirilir. Bbox/draw order doğrulaması sadece JSON tipi kontrolü değildir.

Manifest root kendini hash'leyen bir JSON döngüsü yaratmaz: root hash'i DB scene kaydında tutulur. Root/index/chunk byte'ı stable serializer ile bir defa yazılır ve hash o gerçek byte üzerinden hesaplanır. Decoder'ın verdiği source id ile compiler'ın ürettiği görünür primitive id ayrı alanlarda kalır.

## Binary v1 sınırı

Chunk little-endian, UTF-8 string table ve hizalı typed array section'ları kullanır; JSON entity object grafiği değildir. Header: magic DV2SCN01, schemaVersion=1, totalByteLength, sectionCount, sectionTableOffset. Section table kaydı: tag, scalarType, componentCount, elementCount, byteOffset, byteLength. Byte aralıkları taşamaz, header/table ile çakışamaz; sayı çarpımı güvenli tamsayı sınırını aşamaz. ScalarType yalnız u8/u16/u32/f32/f64; bilinmeyen tag/type reddedilir.

Canonical section'ları source identity/primitive semantic kayıtlarını; render section'ları local origin, vertices/indices, instance transforms, layer/style/order/clip lookup'larını taşır. GPU local origin kaybolmadan üretilir. 31'de header/table/tag ve payload descriptor düzeni sabittir; G03 bunları kod/test olarak uygular. Gemini public typed layout seçmez. Ortak sözleşmede ek group/type gerektiren eksik bulunursa CR açılır; field'ı sessiz atmak yok.

İlk encoder ve reader testleri aynı yanlış varsayımı paylaşmamalı: elle hazırlanmış doğru/kırık header, little-endian oracle, analitik geometry ve independent reference ile denetlenir. serialize→deserialize eşliği tek doğrulama değildir. Shader/worker değişiminde compilerVersion/asset kimliği eşleşmeden eski chunk yeniymiş gibi kullanılmaz.

## V2 veri deposu sınırı

V2'ye ait mantıksal tablolar: cad_v2_jobs, cad_v2_job_attempts, cad_v2_scenes, cad_v2_scene_objects, cad_v2_view_sessions. Mevcut file/revision kayıtları yeniden kopyalanıp alternatif source-of-truth oluşturulmaz. jobs için artifactKey + aktif durum idempotence; scenes için artifactKey unique; scene_objects için sceneId/objectId unique; job_attempts için jobId/attempt unique. Lease owner, lease expiry, monotonic fencing token ve heartbeat job kaydındadır.

Claim işlemi tek DB transaction ile; worker ve publish kontrolleri aynı source/revision/dependency ve fence'e bağlıdır. Başarısız staging görünür ready manifest olamaz. Yeni client viewSession aynı hazır veya çalışan job'a abone olur; DELETE sadece kendine ait viewSession'ı ayırır. Supervisor unobserved running işi sonlandırırken lease/ref-count yarışlarını transaction ile çözer. Local migration/test data üretim kullanıcısını değiştirmez.

## Kontrat kabulü

G03 format/protocol negatif testleri; G10 chunk/queue/identity; G11 DB/lease/atomic publish; G13/G14 admin/public route ve her chunk yetkisi; G15 gerçek Vercel boyut sınırıyla uyumlu payload ölçümü. Geçici API mock'u production kabulü sayılmaz. Yeni endpoint olmadığı halde “endpoint hazır” notu yazılmaz.

## U3 kaynak çözüm sınırı

Dependency alanları 32 U3'teki tek source içeriğini, gömülü/bound kaynakları, platform fontlarını ve eksik dış referans diagnostics'ini temsil eder. API'ye companion dosya/klasör/ZIP yükleme veya client dependency mapping parametresi eklenmez. Gömülü/bound değişiklikler sourceSha256, platform font değişiklikleri dependencyDigest ile invalidation üretir.
