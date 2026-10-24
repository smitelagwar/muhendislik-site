# ASAMA_14 — Kapasite, RC ve yayın hazırlığı

**Durum: ENGELLI.** Yerel kapasite/fiyat raporu, salt okunur release incelemesi ve izole Vercel Linux Preview RC tamamlandı. RC geçti; Production readiness kapıları kapanmadığı için STATE `YAYINA_HAZIR` değildir ve Aşama 15’e geçilmedi.

- Tarih: 2026-10-24 (Europe/Istanbul)
- Branch / HEAD: `main` / `04048e50fd02e50c1c9ea783acec2d7383f516b4`
- `src/lib/site-config.ts` Vercel Preview'da yalnız platformun `VERCEL=1` ve `VERCEL_URL` sistem değerlerinden tam HTTPS canonical/allowlist origin'i türetir; açık `BELGE_SHARE_PREVIEW_URL` ve `BELGE_SHARE_PREVIEW_ORIGINS` ayarları hâlâ önceliklidir. Buna eşlik eden stage06 testi ve `.env.example` notu güncellendi. Diğer V3 çalışma ağacı değişikliklerine dokunulmadı.
- GitHub fetch/write, commit, push: **0**. Bu aşamada Preview CLI dağıtımı toplam **4/4** oldu; Production deployment/alias, Vercel proje env değişikliği, cron çağrısı ve Production DB sorgusu: **0**.
- `belgeler-stage14-preview-20261024` adlı private store yalnız Preview OIDC ile oluşturuldu. Başarılı Linux RC, Vercel Development Neon'u ve bu Preview-only store'u dağıtım başına override ile kullandı; Production DB/Blob'a bağlanmadı. Project-level Preview değişkenleri hâlâ Production ile ortak olduğundan yeni varsayılan Preview deploy'u güvenli sayılmaz.
- Vercel env envanteri `decrypt=false` ile alındı; değerler okunmadı/kaydedilmedi. Blob depo içeriği açılmadı; yalnız aggregate store metadata okundu.

## PDF boyutu ölçümü

`ASAMA_12_pdfs/*_shared.pdf` altındaki beş şablonun üç sentetik fixture için ürettiği 15 gerçek shared-PDF çıktısı byte bazında ölçüldü. Bunlar gerçek üretim derlemesinin render edilmiş PDF'leridir; ancak gerçek müşteri belgelerini veya üretim boyut dağılımını temsil ettikleri iddia edilmiyor.

| Ölçüm | Sonuç |
|---|---:|
| Örnek sayısı / toplam | 15 / 18,668,902 byte |
| Minimum | 1,178,807 byte (1.1242 MiB) |
| Ortalama | 1,244,593.47 byte (1.1867 MiB) |
| p95, nearest-rank | 1,284,386 byte (1.2250 MiB) |
| Örnek maksimumu | 1,284,386 byte (1.2250 MiB) |
| Uygulama başına PDF üst sınırı | 3,145,728 byte (3 MiB) |

Örnek sayısı küçük olduğundan nearest-rank p95, örnek maksimumuna eşittir. Kapasite modelinde bu ölçüm ile uygulamanın 3 MiB sert üst sınırı ayrı ayrı kullanılır; production p95'i yerine geçirilmez.

## 90 günlük kapasite modeli

Formül: `90 günlük aktif PDF = kabul edilen yeni link/gün × 90`; ortalama/p95 kapasite değerleri ilgili PDF boyutuyla, muhafazakâr üst sınır 3 MiB ile çarpılır. Bir aylık transfer varsayımı her yeni link için bir tam GET, 30 günlük ay ve sabit günlük hacimdir. Silme gecikmesi/backlog bu temel tabloda yoktur.

### Tarayıcı başına günde bir yeni link

| Aktif tarayıcı | Yeni link/gün | 90 günde aktif | Ortalama PDF boyutuyla | p95 boyutuyla | Her PDF 3 MiB ise | Aylık bir tam GET transferi | Tahmini Blob advanced ops/ay |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 1 | 90 | 0.112 GB | 0.116 GB | 0.283 GB | 0.037 GB | 60 |
| 5 | 5 | 450 | 0.560 GB | 0.578 GB | 1.416 GB | 0.187 GB | 300 |
| 10 | 10 | 900 | 1.120 GB | 1.156 GB | 2.831 GB | 0.373 GB | 570 |

### Tarayıcı başına 50/gün sınırı ve yerel 200/gün varsayımı

`200/gün` yalnız yerel/test varsayımıdır; Production env’deki açık kapasite kararı değildir. Bu tabloda, yalnız senaryo matematiği için 1, 5 ve 10 tarayıcıya ait `min(tarayıcı × 50, 200)` uygulanmıştır.

| Aktif tarayıcı | Varsayılan yeni link/gün | 90 günde aktif | Ortalama PDF boyutuyla | p95 boyutuyla | Her PDF 3 MiB ise | Aylık bir GET / üç GET transferi | PUT + nightly list advanced ops/ay |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 50 | 4,500 | 5.601 GB | 5.780 GB | 14.156 GB | 1.867 / 5.601 GB | 2,850 |
| 5 | 200 | 18,000 | 22.403 GB | 23.119 GB | 56.623 GB | 7.468 / 22.403 GB | 11,400 |
| 10 | 200 | 18,000 | 22.403 GB | 23.119 GB | 56.623 GB | 7.468 / 22.403 GB | 11,400 |

Hesaplanan nightly liste sayısı, kodun 100 nesnelik sayfa boyutu ve her gece tüm `belge_paylasim/` prefix'inin eksiksiz taranması varsayımıdır. Her başarılı Blob `put()` ve her Blob `list()` bir advanced operation olarak sayılmıştır; retry, diğer uygulama Blob trafiği ve panel kullanımı hariçtir. `del()` ücreti hesaba katılmadı. Her PDF için üç tam GET duyarlılık senaryosudur; gerçek GET/HEAD telemetrisi alınmadı.

PDF API'sindeki `HEAD`, DB/lifecycle/size metadata'sını okur ve Blob `get()`/stream açmaz; PDF Blob transferi sıfırdır. `GET` Blob'u açıp tam gövdeyi stream eder. Rota `Range` uygulamaz; 206/range aktarımı vaat edilmez. Rota `private, no-store` döndürdüğü için istek başı gerçek transfer/cache davranışı Vercel metrikleri olmadan ölçülmüş sayılmaz.

## Mevcut Vercel ve veri durumu

- Takım planı Vercel API bağlamında **Hobby** olarak doğrulandı. Son 180 günde listelenen 33 deployment'ın 28'i Production hedefli. En yeni Production deployment 2026-10-23 15:16 UTC'de oluşturulmuş ve HEAD'deki `04048e50…` commit'ini çalıştırıyor; Stage13 değişiklikleri yayınlanmış değil.
- Mevcut `muhendislik-site-blob` deposu private, iad1, `available`; 2026-10-24 snapshot'ında **52,285,761 byte / 58 nesne**. Bu bütün store toplamıdır; paylaşım prefix'inin payı ayrıştırılmadı. Nesne isimleri veya içerikleri okunmadı.
- Stage13 izole Development Neon/Blob testinden kalanlar sıfır: `links=0`, `quotas=0`, `obligations=0`, test private Blob nesnesi `0` (`ASAMA_13_share_live_summary.json`, `ASAMA_13_postgres_live.log`). Production DB satırları ve gerçek V3 `pending/deletion` backlog'u sorgulanmadı.
- `BLOB_STORE_ID`, `DATABASE_URL` ve Neon DB bağlantı değişkenlerinin Vercel env hedefi aynı tek kayıtla `production + preview`; `BELGE_SHARE_SECRET` ve `CRON_SECRET` de aynı hedefleri paylaşıyor. Sır değerleri çözümlenmedi. Varsayılan Preview hâlâ Production DB/Blob'a yönelir; alttaki RC yalnız dağıtım başına Development/Preview override'larıyla izole edildi, project-level ayrım yapılmadı.
- `BELGE_SHARE_GLOBAL_DAILY_LIMIT` ve `BELGE_SHARE_GLOBAL_MAX_STORAGE_BYTES` Vercel env envanterinde yok. Kod Production'da bu iki değer yok/bozuksa `QUOTA_CAPACITY_CONFIG_NOT_CONFIGURED` ile fail-closed olur. `200/gün` ve `1 GiB` yalnız yerel varsayımlardır.
- Proje ayarları deployment SSO korumasını `all_except_custom_domains` olarak bildiriyor; parola koruması kapalı. Bu, eski Production deployment URL'lerindeki yazma yollarının kapatıldığını ispatlamıyor. Önceki deployment'larda eski create/cron koduna erişimi engelleyen bağımsız politika kanıtı yok; N17 açık.
- Mevcut Blob store snapshot'ı 1 GB Hobby Blob depolama limitine göre yaklaşık 52.3 MB kullanıyor. Diğer proje trafiği ve kullanım değişimi hesaba katılmadan kalan 947.7 MB'ı paylaşım için garanti edilmiş kapasite saymıyorum.
- Vercel billing-charges MCP uç noktası `404 costs_not_found` döndü; mevcut fatura tutarı alınamadı. Neon Production planı/kullanımı da Vercel env bağlantısından belirlenemiyor ve production DB'ye bağlanılmadı.
- 2026-10-24'te salt okunur Vercel metrics şeması `vercel.request.count` ve `vercel.request.fdt_out_bytes` için `request_method`, `route` ve `environment` boyutlarını doğruladı. Production'da `/api/belgeler/paylasim/` prefix'i için son 30 günlük method/count ve outgoing-byte sorguları Hobby takımında `payment_required` (exit 1) ile reddedildi; GET/HEAD sayısı veya transfer byte'ı elde edilmedi. Vercel'e göre Query/Observability Plus Hobby'de yok; Pro/Enterprise erişimi ve kullanım bazlı ücret gerektiriyor. Bu yüzden telemetriyi ücretsiz gözlem gibi varsaymadım ve plan yükseltmesi/ek satın alım yapılmadı. Kaynak: [Observability Plus erişim ve fiyatlama](https://vercel.com/docs/observability/observability-plus).

## Yerel Firefox/WebKit kabulü (Development)

- Kaynaklar `vercel env run -e development` ile bağlı Vercel projesinin Development değişkenlerinden alındı; localhost Next.js dev sunucusunda çalıştı. Başlangıç snapshot'ı schema 9, `links=0`, `quotas=0`, `obligations=0`, non-development satırları `0`, private share-prefix Blob nesnesi `0` gösterdi.
- İlk deneme `127.0.0.1` üzerinde iki tarayıcıda da `/api/belgeler/paylasim/kota` kimlik bootstrap'ından `403` aldı; bağlantı oluşturma adımına geçmedi. Aynı test `localhost` hostuyla tekrarlandığında Firefox ve WebKit'in her biri K01/K02 canlı Neon+private Blob akışını geçti: toplam **2/2 PASS, 0 fail, 46.5 saniye**. Komut günlükleri `ASAMA_14_cross_browser.log` (ilk başarısız host denemesi) ve `ASAMA_14_cross_browser_localhost.log` dosyalarındadır.
- `run-stage13-postgres-live.ts` izole Development reset/cleanup korumalarıyla çalıştırıldı. Testten kalan 6 link, 4 quota ve 6 blob-obligation satırı temizlendi; private Blob prefix nesnesi yoktu. Cleanup runner'ın kendi 100-ID SQL testleri de PASS oldu ve tüm tabloları tekrar sıfırladı. Son snapshot: schema 9, bütün V3 tablo sayıları ve Blob nesne sayısı `0` (`ASAMA_14_development_cleanup_localhost.log`, `ASAMA_14_development_after_cleanup.log`). Production DB/Blob'a erişilmedi.
- Bu sonuç masaüstü Firefox/WebKit'in yerel Development kabulüdür; tek başına Linux/Production kanıtı değildir. İzole Linux Preview RC'nin ayrı sonucu aşağıdadır. Gerçek Production GET/HEAD transfer metriği ve fiziksel Android/iOS kabulü hâlâ yoktur. Özet: `ASAMA_14_cross_browser.json`.

## İzole Vercel Linux Preview RC

- Son ve planın izin verdiği **4/4** Preview dağıtımı `dpl_9hQVKHvEK9xsETMtYhn89NZiwau8` / [`https://muhendislik-site-2o68ppbmy-huseying5713-2819s-projects.vercel.app`](https://muhendislik-site-2o68ppbmy-huseying5713-2819s-projects.vercel.app) oldu. CLI `Preview` hedefini verdi; alias atanmadı. Build `READY`, Next.js production compilation ve TypeScript geçti, **627** static page üretildi (`ASAMA_14_preview_deploy_final.log`, `ASAMA_14_preview_build_final.json`). Aynı yerel çalışma ağacı kullanıldı; GitHub ref'i ilerletilmedi.
- Vercel'in her dağıtımda oluşturduğu rastgele `VERCEL_URL` sabit dosyada önceden allowlist edilemediği için Vercel Preview'larda güvenilir platform `VERCEL_URL` değerinden tek origin'li fallback eklendi. Yalnız Vercel Preview dalında çalışır; explicit URL/allowlist değerleri verilirse mevcut tam origin eşlemesi sürer. Üretim canonical kontrolü ve Preview'ın üretim URL'sini reddetmesi değişmedi.
- Protected Preview'a Vercel Development env-run'in kısa ömürlü OIDC başlığıyla ulaşıldı. Dağıtım başına runtime override'ları Development Neon URL'lerini, Preview-only `BLOB_STORE_ID`'yi, sentetik share/cron secret'larını ve test kapasite limitlerini kullandı; değerler kanıta yazılmadı. Project env kayıtları, Production ve Production Blob store değiştirilmedi.
- `tests/site-audit/belgeler-share-live-acceptance.spec.ts` Chromium'da **1/1 PASS, 0 fail, 16.2 saniye** oldu. Gerçek Preview uygulamasında aynı browser içindeki iki linkin PDF hash/parity'si, ikinci tab kota paylaşımı, aynı NAT'ta ayrı browser kota izolasyonu ve revoke akışı çalıştı. Test başarılı akışın oluşturduğu üç synthetic share'i iptal etti.
- Ardından yalnız Vercel Development DB içindeki `environment_key='preview'` namespace temizlendi: **4 link, 3 quota, 4 obligation** silindi; son sayılar `0/0/0` (`ASAMA_14_preview_db_cleanup_final.log`). Production DB'ye erişilmedi.
- İlk canonical URL hatasında upload edilmiş tek sentetik Blob nesnesi hâlâ private test store'da: aggregate **1 nesne / 1.17 MB**. Başarılı testteki üç nesne revoke ile silindi. Store silme komutu bu kalan nesne yüzünden `409 Blob store not empty` verdi; store **silinmedi**, Production store'a dokunulmadı (`ASAMA_14_preview_blob_cleanup_final.log`). Yerel `.env.local` değerleri korunup doğrulandı. Bu kalıntı ve izole store ID'si final kanıtta açıkça kayıtlıdır.
- Son temizlik denemesinde `vercel env run -e preview` içinden gelen OIDC ile yalnız `belge_paylasim/` prefix'ini listeleme/silme girişimi Blob tarafından `Access denied` ile reddedildi; nesne listesi okunmadı ve silme çağrısı yapılmadı (`ASAMA_14_preview_blob_prefix_cleanup.log`). Store private kaldı.
- Preview env/Blob ayrımı bu tek RC için başarılı oldu; project-level Preview/Production env kayıtlarını kalıcı ayırmıyor. Planın kalan yayın hazırlığı koşulları bu nedenle ayrıca açık kalır.

## Production salt-okunur erişim sınırı

- Vercel Production env envanteri salt okunur incelendi ve kanıt dosyasına yalnızca değişken adları, türleri ve hedefleri yazıldı. `DATABASE_URL` ve ilgili Neon/PG bağlantıları `Sensitive` türünde, Production ve Preview'a birlikte hedefli; değerleri Vercel CLI'de `Hidden`. `BLOB_STORE_ID` aynı iki hedefte ortak; `BLOB_READ_WRITE_TOKEN` env envanterinde görünmüyor. Production global günlük/byte kota değişkenleri de yok. Ham env çıktısındaki non-sensitive değerler kanıta alınmadı.
- Ek Vercel MCP `get_project_env` salt-okunur denemesi de Production/Preview ortak hedefli `POSTGRES_URL_NON_POOLING` için `decrypted=false` ve boş değer döndürdü. Bu nedenle guarded Production SQL inspector hâlâ connection pool oluşturmadan duruyor; Production SQL veya Blob listeleme çalıştırılmadı (`ASAMA_14_late_rechecks.json`).
- `vercel env run -e production` sürecindeki değer-varlığı kontrolünde Production DB bağlantı değerleri ve Blob tokenı boş/aktarılmamıştı; Development karşılaştırmasında DB bağlantıları ve Blob tokenı mevcuttu. Üretim için yazılan ayrı snapshot aracı bu yüzden DB havuzunu oluşturmadan, `BEGIN READ ONLY` aşamasına gelmeden güvenlik kontrolünde durdu. Hiçbir Production SQL sorgusu veya Blob listesi çalışmadı; değerler terminale/kanıta yazılmadı (`ASAMA_14_production_env_inventory.log`, `ASAMA_14_production_env_presence.json`, `ASAMA_14_production_readonly_snapshot.log`).
- Production şema sürümü, V3 tablo/backlog sayıları, Blob prefix nesneleri ve canlı cleanup durumu bu nedenle hâlâ ölçülmedi. Bu erişim engeli aşılmadan bunlar hakkında sayı veya PASS iddiası yoktur.

## Deployment URL koruması ve eski cron yolu

- Vercel proje ayarında SSO koruması açık (`all_except_custom_domains`). Son ve önceki Production deployment hostlarında oturumsuz `HEAD /`, `OPTIONS /api/belgeler/paylasim` ve önceki deployment'ta `OPTIONS /api/cron/belge-paylasim-temizlik` istekleri `302` ile Vercel Authentication'a yönlendi. Projenin herkese açık production alias'ı `HEAD / = 200`, share route `OPTIONS = 204`, cron GET Authorization başlıksız `401`, share-route GET gövdesiz `405` döndü. 401 yanıtından önce `CRON_SECRET` denetimi ve 405 yanıtından önce POST dışı yöntem reddi, Production'a dağıtılmış `04048e50...` handler kaynak koduyla eşleşir. Sonuçlar ve yalnızca sembolik deployment etiketleri `ASAMA_14_deployment_protection.json` dosyasındadır.
- Bu, test edilen benzersiz deployment URL'lerine anonim erişimin korunduğunu gösterir. POST veya `Authorization: Bearer CRON_SECRET` içeren cron çağrısı yapılmadı; bu nedenle authenticated writer/cron erişiminin kapalı olduğunu iddia etmiyorum. Vercel cron isteklerini Production deployment URL'sine GET ile gönderir ve `CRON_SECRET`'ı Authorization başlığına ekler; cron'un 7 günlük geçmiş sorgusu Hobby'de 1 saatlik runtime-log saklama sınırından dolayı `400 bad_request` ile sonuçlandı. Bu iki kısıt `ASAMA_14_runtime_logs_retention.json` içinde kaydedildi. Kaynaklar: [Deployment Protection](https://vercel.com/docs/deployment-protection), [Cron Jobs yönetimi](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
- Önceki denetimde görünmüş OIDC değerini burada yeniden görüntülemedim. `ASAMA_14_oidc_expiry.json` yerel `.env.local` içindeki eski token'ın 2026-10-12'de sona erdiğini tarihsel olarak kaydeder; Vercel Development `env run` ile geçici olarak sağlanan yeni token Preview SSO kabulünde çalıştı ve değeri/çıktısı saklanmadı. Yerel token değeri karşılaştırılmadı veya `.env.local` dosyasına yazılmadı.

## Güncel fiyat ve seçenekler

Fiyatlar 2026-10-24 tarihinde resmi sayfalardan kaydedildi; USD, vergi hariçtir. Vercel Hobby $0/aydır; Hobby Blob kullanımı aylık 1 GB depolama, 10 GB Blob Data Transfer, 10,000 simple ve 2,000 advanced operation ile sınırlıdır. Dahil limit aşılırsa Hobby'de ek kullanım faturalanmaz; Blob erişimi limit aşımı sonrası geçici olarak kullanılamayabilir. Aynı projedeki diğer Vercel hizmetleri dahil kaynakları tüketebilir.

Vercel'in resmi Pro plan fiyatı $20/ay ve $20 kullanım kredisi içerir. Blob Pro kullanımı kullanım bazlıdır. Bu fiyat/credit bilgisi harcama kararı değildir.

Mevcut private Blob store `iad1` bölgesinde. Aynı PDF/gün senaryosunda her yeni link için bir GET varsayımıyla yalnız paylaşım Blob kısmının kaba Pro upper-bound hesabı:

| Hacim | Depolama | Aylık PDF transferi | Advanced operation | Tahmini Blob kaynak kullanımı |
|---|---:|---:|---:|---:|
| 50 link/gün, 1 GET/link | $0.13 | $0.60 | $0.014 | yaklaşık $0.74/ay |
| 200 link/gün, 1 GET/link | $0.52 | $2.39 | $0.057 | yaklaşık $2.96/ay |
| 200 link/gün, 3 GET/link | $0.52 | $7.17 | $0.057 | yaklaşık $7.75/ay |

Ücret modelinde IAD1 başına storage `$0.023/GB-month`, Blob transfer `$0.05/GB`, cache miss FOT `$0.06/GB`, private function yanıtı FDT `$0.15/GB` ve yanıt FOT `$0.06/GB` alınmıştır. Transfer değeri `0.32 USD/GB × tahmini Blob transferi`, tüm indirmeler miss varsayımıyla hesaplanan üst sınırdır; Pro kullanım kredisi varsa tüm projedeki başka tüketimle paylaşılır. Gerçek Blob/CDN cache, function çalışma/bellek, bölge, tekrar istek ve tüm proje trafiği faturayı değiştirir. Hobby'de tek GET 200/gün senaryosu 7.47 GB Blob transferi hesaplar; üç GET 22.40 GB ile 10 GB dahil Blob transferini aşar. İki senaryoda da Hobby advanced-operation sınırı, 1 GB depolama sınırından önce/bağımsız olarak aşılır.

Neon'un 2026-10-24 fiyat sayfası Free için proje başına 1 GB DB, 100 CU-hour/ay ve Launch için $0.106/CU-hour, $0.35/GB-month gösteriyor. Production Neon planı/bakiye/DB kullanımı ölçülmediğinden Neon faturası bu tahmine eklenemez.

İki sayısal işletim seçeneği ortaya çıktı; hiçbiri uygulanmadı:

1. **Hobby sınırında kalma:** Günlük global limiti ve paylaşım byte bütçesini, 90 gün boyunca tüm PDF'ler 3 MiB olduğunda ve cleanup zamanında tamamlandığında Hobby sınırlarının altında kalacak kadar düşük ayarla. Bugünkü whole-store kullanımını düşmeden önceki kaba kalan 947.7 MB, yaklaşık 301 maksimum boyutlu dosyaya (90 gün boyunca yaklaşık 3.35/gün) karşılık gelir; diğer Vercel kullanımı ve backlog bu sayıyı düşürür. Günlük 2 yeni share + en çok 600,000,000 share-byte gibi daha dar bir örnek, üretim kotası olarak önerilmemiş bir senaryodur.
2. **Daha yüksek hacim:** Pro'nun $20/ay ve $20 usage credit seçeneğini bütçe olarak değerlendir; 200/gün, tek GET/link modelinde tahmini Blob kaynak tüketimi yaklaşık $2.96/aydır. Bu seçenek Vercel'in diğer uygulama kullanımını ve Neon ücretini içermez; gerçek tüketimle doğrulanmadı.

## Runtime, migration, cron ve log incelemesi

- Gerçek Production/Preview secret varlığı `decrypt=false` ile görüldü: share secret, cron secret, database URL ve private Blob store referansları mevcut. Project-level DB/Blob Preview izolasyonu yok; final RC yalnız deployment başına izole override kullandı, bu varlık tek başına release yeterliliği değildir.
- `db/migrations/006`–`009` ve migration runner kaynakları statik incelendi. Stage13 test veritabanı schema version 9'du; Production schema version okunmadı ve migration çalıştırılmadı. V3 migrations'ta `DROP TABLE`, `TRUNCATE` veya `DROP COLUMN` bulunmuyor; eski V3 constraint/trigger/function nesnelerini replace etmek için `DROP ... IF EXISTS` kullanılıyor. Rollback yolu yeni create akışını kapatıp read/revoke'ı korumaktır; güvenli olmayan eski create sürümüne kör rollback yapılmaz.
- Salt okunur `vercel crons list` proje için 1 aktif schedule gösterdi: `/api/cron/belge-paylasim-temizlik`, `0 3 * * *` (`ASAMA_14_cron_inventory.json`). Bu schedule/route metadata'sıdır, invocation geçmişi değildir. Route `maxDuration=60s`, cleanup iç deadline'ı 45s ve Blob liste sayfası 100 nesnedir. 18,000 aktif nesne için tam gecelik tarama teorik 180 list çağrısı/çalışma ve 5,400 list çağrısı/30 gün gerektirir. Test edilmiş Production throughput, backlog boşaltma süresi ve gerçek cron invocation yok; N10/K12 production ölçeğinde kapanmış sayılmadı.
- Yerel ASAMA_09 benchmark'ı PGlite + Memory Blob üzerinde 1,000 sentetik orphan'ı özel `pageSize=20` ile 51 sayfada 1,105 ms'de işlemişti (`ASAMA_09_tests.tap`). Bu benchmark Vercel Blob ağ gecikmesini veya mevcut production `pageSize=100` taramasını ölçmez; yalnız tarihsel yerel referans olarak tutuldu.
- `logShareRequestFailure` sabit kategori, süre ve correlation ID yazar; Error nesnesi, token, istek gövdesi veya URL yazmaz. Cron cleanup hata çıktısı sabit hata kodları/aggregate metriklerdir. Bu kaynak incelemesi log/trace redaction PASS'tir. Production runtime log örneği alınamadı; Hobby 7 günlük sorguyu reddetti ve saklama penceresi 1 saat.
- N17 kısmen daraltıldı: test edilen eski/generated deployment URL'lerindeki anonim istekler Vercel SSO'ya yönlendiriliyor; production alias'ında kimliksiz cron GET 401 ile temizlikten önce duruyor. Production alias'ı herkese açık kalıyor; POST ile authenticated cron/bearer davranışı ve aktif schedule'ın çalışma kaydı test edilmedi. Eski deployment'ların yazma yolunun tamamen etkisiz olduğunu kanıtlamadım.

## Doğrulama ve aşama kapısı

`run-stage14-capacity-check.ps1` gerçek 15 PDF fixture byte'larından ortalama/p95'i ve 1/5/10 tarayıcı tablolarındaki formülleri yeniden hesapladı; ayrıca ASAMA_09 ölçümünün sentetik `pageSize=20` kapsam etiketini doğruladı. **21/21 assertion PASS** (`ASAMA_14_capacity_check.log`). Bu yalnızca yerel aritmetik/kanıt tutarlılığı kontrolüdür; Production servis testi veya RC değildir.

Resmi fiyat kaynakları (erişim tarihi 2026-10-24):

- [Vercel plan fiyatları](https://vercel.com/pricing)
- [Vercel Blob usage/pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing)
- [Vercel IAD1 fiyatları](https://vercel.com/docs/pricing/regional-pricing/iad1)
- [Vercel Private Storage transfer ücretleri](https://vercel.com/docs/vercel-blob/private-storage)
- [Neon plan ve fiyatları](https://neon.com/pricing)

**Aşama ENGELLI; `completed_stages` 13 olarak kalır, `active_stage=ASAMA_14`, `next_stage=ASAMA_14`.** Linux Preview RC alt-kapısı geçti. `YAYINA_HAZIR` için şu koşullar hâlâ açık:

1. Production ve Preview için birbirinden ayrı Neon DB ve private Blob env kaynakları (şu an aynı env kayıtlarını paylaşıyorlar).
2. Açıkça yapılandırılmış Production global günlük/byte kota değerleri ve bunların seçilmiş Hobby/Pro kapasitesini aşmadığının kontrolü.
3. Production share-prefix, pending/deletion backlog, DB şema sürümü ve nightly cleanup throughput ölçümü.
4. Eski deployment URL'lerinde create/cron yazma yolunun gerçekten engellendiğinin kanıtı.
5. Gerçek maliyet/kapasite kararı ve fiziksel Android/iOS kabulü veya kapsamının açıkça değiştirilmesi. Masaüstü Firefox/WebKit Development **2/2 PASS** ve Vercel Linux Preview **1/1 PASS** fiziksel cihazı ikame etmez.

2026-10-24 cihaz envanterinde `adb` bulundu ancak bağlı Android cihaz sayısı `0`; `idevice_id` aracı yoktu. Fiziksel mobil kabul çalıştırılmadı (`ASAMA_14_physical_device_inventory.json`). Aynı gün bağlı Vercel billing charges uç noktası bir kez daha `404 costs_not_found` verdi; güncel fatura tutarı alınamadı (`ASAMA_14_late_rechecks.json`).

Kullanıcı 2026-10-24'te “yayınlamak gerekiyorsa yayınla” diyerek koşullu yayın talimatı verdi. Ancak 14. aşama kapıları geçmediğinden yayın önkoşulu oluşmadı; bu talimat production veri incelemesi, bütçe/kapasite veya cihaz kabulü eksiklerini kaldırmıyor. Project-level Vercel env ayarı değiştirilmedi, Production deploy başlatılmadı ve Preview dağıtım sınırı aşılmadı. ASAMA_14 ENGELLI kaldı; ASAMA_15 başlatılmadı.
