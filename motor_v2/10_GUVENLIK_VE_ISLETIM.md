# 10 — Güvenlik, erişim, sunucu hazırlığı ve işletim

> **Araştırma katmanı:** Bu belgedeki alternatifler ve öneriler Gemini için seçim yetkisi değildir. Kullanıcının son talimatıyla [00 — EXEC-2](00_BAGLAYICI_UYGULAMA_KARARLARI.md) ve [19 — sabit uygulama sırası](19_GEMINI_ADIM_ADIM_UYGULAMA.md) geçerlidir. Çelişen seçim/scope ifadeleri tarihsel araştırma olarak kalır; Gemini uygulamaz.

[Dizin](README.md) · [Sistem](05_SISTEM_MIMARISI.md) · [Kaynak/risk](14_KAYNAK_VE_RISK_PLANI.md)

CAD dosyaları büyük ve yapısal olarak karmaşık girdilerdir. Bu belge ürünün gerçek açılış güvenilirliği için bir tasarım önerisidir; yeni hizmet veya DB tablosu oluşturulmadı.

## Mevcut depolamayla uyum

Repo [storage sözleşmesi](../DOK_STORAGE_CONTRACT.md) üretimde metadata için Neon, nesne için Vercel Private Blob ve imzalı erişim akışını tarif ediyor. V2 bu otoriteleri atlayan ikinci bir upload/dosya deposu kurmaz. Server compiler gerekirse işlemci ayrı olabilir; kaynak dosya sahipliği ve yetki aynı sistemden gelir.

Öneri: V2 türevleri ayrı namespace ve metadata tablosunda kaynak revision'a bağlı tutulur. Compiler geçici workspace'i üretim depolama otoritesi değildir. DB sırları browser'a veya CAD native process'ine verilmez. Worker yalnız okuyacağı kaynak ve yazacağı staging alanına sınırlı hak alır.

## Browser ve native parser sınırları

| Tehdit / bozulma | Önerilen koruma | Beklenen kullanıcı sonucu |
|---|---|---|
| Büyük declared count / length | Integer overflow, offset ve allocation kontrolü | Hızlı sınıflanmış hata |
| Compression bomb | Compressed/decoded byte oranı + mutlak bütçe | İş kaynak limitinde kesilir |
| Recursive blok/XREF | Depth, node visit ve toplam expansion bütçesi | Kısmi/unsupported bilgisi |
| Milyon segmentli hatch/spline | İş/time/segment limiti, iptal checkpoint'i | Boş ekran yerine kontrollü durum |
| NaN/Infinity/bozuk matris | Finite kontrolü ve entity izolasyonu | Hatalı entity diagnostik |
| Bozuk font/görsel | Font/parser izolasyonu, pixel/atlas sınırı | Fallback/eksik font uyarısı |
| Harici path/URL | Yetkili dependency resolver | Rastgele ağ/disk erişimi yapılmaz |
| Aktif içerik/OLE/script | Makro, script ve OLE çalıştırmama | Statik temsil veya açık eksiklik |
| Bozuk scene/cache | Schema/checksum/length doğrulaması | Bir kez yeniden yükleme, sonra hata |

WASM memory sandbox işletim sistemi belleğine erişimi sınırlayabilir; browser'ı CPU/RAM tüketiminden otomatik korumaz. Native compiler için OS/container sınırları, düşük yetkili kullanıcı, ağ çıkışı kısıtı, süre/RAM/CPU/disk limiti ve izole temp klasörü düşünülebilir. Parser süreçten ayrılırsa crash diğer kullanıcı işlerini düşürmez.

XREF/IMAGE/underlay URL'leri sunucunun localhost, metadata endpoint'i veya özel ağına SSRF oluşturamaz. Archive/ZIP dependency paketi eklenirse path traversal, duplicate/case-colliding isim, symlink, sıkıştırma bombası ve toplam açılmış boyut testleri gerekir. Dosya uzantısı çalıştırılabilir içerik politikasını belirlemez.

## İzin ve cache

Scene, thumbnail, metin arama indeksi ve glyph/raster türevleri kaynak dosya kadar hassas bilgi taşıyabilir. Sadece orijinal DWG'yi private tutmak yeterli değildir. Manifest, chunk ve server-side cache lookup her zaman dosya/tenant/share yetkisine bağlanır. Tahmin edilmesi zor object ID erişim denetiminin yerine geçmez.

Türev content hash'i tenant'lar arasında yetkisiz varlık sorgusu veya dedupe yan kanalı oluşturmamalı. Hash gizli anahtar değildir. Telemetry'de dosya adı, çizim metni, koordinat, public token veya signed URL query'si tutulmaz; gerekli korelasyon için kısıtlı süreli pseudonymous session/file identity düşünülebilir.

Kalıcı browser cache ortak bilgisayarda veri bırakır. Varsayılan RAM-only veya kullanıcı opt-in disk cache seçenekleri değerlendirilebilir. Logout'ta uygulama cache namespace'i temizlenebilir, fakat kullanıcıya teslim edilmiş baytlar geri alınamaz. Offline erişim ve anında share revocation aynı anda mutlak garanti edilemez. Önerilen ilk politika: offline paylaşım erişimi yok; cache okumadan online yetki kontrolü; hassas/public oturumlarda persistent cache kapalı.

## Server job tasarımı

Önerilen HTTP kontrol düzlemi küçük metadata taşır:

```text
POST /api/.../cad-v2/prepare        dosya revision'ı için idempotent iş
GET  /api/.../cad-v2/status         kısa durum / retry-after
GET  /api/.../cad-v2/manifest       yetkili sahne ve sınırlı lease
GET  yetkili-private-chunk-url     byte verisi
```

Bunlar taslaktır, mevcut endpoint değildir. Server istemciden rastgele `sourceUrl` kabul etmek yerine yetkili `fileId/revision` çözer. Aynı kaynak için iki istek duplicate compilation yaratmaz. Kuyruk tenant fairness ve concurrency sınırı içerebilir; küçük işler büyük dosyaların arkasında süresiz kalmaz.

Durum satırı `sourceRevision`, dependency digest, decoder/compiler build, `attempt`, `leaseOwner`, `leaseExpiresAt`, error class ve output manifest kimliği taşıyabilir. İşçi yeniden başladıktan sonra lease kaybetmiş eski süreç output'u publish edemez; compare-and-swap/fencing kontrolü gerekir.

Hazırlık çıktısı staging'e yazılır, kalite ve checksum doğrulanır, ready pointer atomik ilerler. Aynı kaynağın yeni sürümü gelirken eski job bitse de güncel revision'a yazamaz. Kullanıcı silme/revoke işlemi compile sırasında gerçekleşirse yayın öncesi yetki/kaynak yaşamı tekrar kontrol edilir.

## Retry ve iptal

Kaynak 404/revoked, desteklenmeyen format veya deterministik bozuk dosya sınırsız retry almaz. Transient ağ/storage/işçi çökmesi sınırlı exponential backoff + jitter ile tekrar denenebilir. Öneri başlangıcı 2 yeniden deneme ve toplam süre bütçesi; gerçek işletim verisine göre ayarlanır.

Viewer kapandığında UI oturumu hemen biter. Aynı preparation job başka kullanıcıya da hizmet ediyorsa tek kullanıcı iptali ortak işi yanlışlıkla silmez; consumer lease ve job cancellation ayrı tasarlanır. Yalnız o isteğe ait iş, iptal politikasıyla durdurulabilir. Job tamamlandıysa sonuç cache'de kalıp kalmayacağı storage maliyeti politikasına bağlıdır.

## Vercel'in rolü

Önerilen başlangıç rolü Next.js UI, mevcut auth ve küçük job/manifest API'leri. Ağır native DWG işlemi seçilirse SDK/OS/bellek gereksinimine uygun kalıcı kuyruk işçisi ayrı compute üzerinde çalışabilir. Worker'ın ayrı olması kaynak dosyanın public olması anlamına gelmez.

5 Eylül 2026'da açılan resmi Vercel Functions limits sayfası request/response payload için 4,5 MB; Fluid Compute'da Hobby 300 sn, Pro/Enterprise genel maksimum 800 sn; belirli koşullarda 1800 sn beta ve 2/4 GB memory kademeleri bildiriyor. Bu proje hesabının planı/config'i canlı doğrulanmadı. Büyük CAD baytlarını tek JSON request/response'la taşıma önerilmiyor. [Resmi limitler](https://vercel.com/docs/functions/limitations).

Yerel Vercel skill metninde farklı payload/bundle sayıları bulunması nedeniyle rapor resmi canlı belgeyi esas aldı. İleride kurulumda limitler yeniden doğrulanabilir. Durable orchestration bir native SDK çağrısının RAM ihtiyacını, OS uyumluluğunu veya tek adım sınırını kendiliğinden kaldırmaz. `after()`/`waitUntil()` tek başına dayanıklı kuyruk yerine varsayılmaz.

## Türevlerin saklama ve silme yaşamı

Öneri: source revision silinince erişimi hemen kapat; ilişkili ready/staging parçalarını idempotent temizleme işiyle kaldır; temizleme hatasını metadata'da tut ve retry yap. Scene DB satırını önce silip storage orphan'ını izsiz bırakma. Mevcut storage deletion sözleşmesine uygun ayrı türev reconciliation kullanılabilir.

Bir font/dependency hash değişince mevcut scene immutable kalır; yeni sürüm oluşturulur. Eski uygulama yeni schema okuyamıyorsa explicit unsupported-schema ile uygun scene sürümü ister. İlk beta bitmeden uzun migration desteği kurmak şart değil; fakat cache formatı sürümsüz bırakılmaz.

## Gözlenebilirlik

Önerilen dashboard: prepare queue p50/p95, compile duration, native exit/timeout/OOM, scene/source byte oranı, cache hit türü, T-first-useful/full-ready, gerçek aktif motor, degraded oranı, file switch hatası, context loss, device sınıfı ve retry sayısı.

Kullanıcıya kısa neden ve eylem; geliştiriciye anonim session ID ile sınıflanmış hata. “Bir hata oluştu” tek başına yeterli diagnostik değildir; raw drawing text'i loglamak da çözüm değildir. Debug overlay üretimde kapalı veya yetkili olabilir.

## Release ve geri dönüş

Bu repo az remote write hedefliyor. Geliştirme yerelde toplanır; anlamlı checkpoint ve uygun test sonrası tek kontrollü yazım değerlendirilir. Remote çalışma branch/skip politikası [AGENTS.md](../AGENTS.md)'den izlenir. Bir skip etiketi yazmak tek başına canlı provider davranışını kanıtlamaz; repo kuralına göre ilk korumalı push sonucu doğrulanır.

V2 rollback: V2 özelliğini kapat, yeni job kabulünü durdur, çalışan işleri politikayla sonlandır/drain et, eski motoru çalışır bırak. Tüm siteyi tarihsel golden commit'e dönmek varsayılan V2 rollback yöntemi olmaz. V2 ve legacy worker/WASM asset sürümleri ayrı tutulur. Build sistemi değişecekse aynı commit Linux Preview/üretim artifact doğrulaması repo şartlarıyla planlanır; gereksiz preview zinciri oluşturulmaz.
