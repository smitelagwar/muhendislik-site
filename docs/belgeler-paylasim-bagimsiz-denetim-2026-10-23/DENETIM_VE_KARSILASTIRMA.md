# Bağımsız denetim, Rev2 karşılaştırması ve V3 karar kaydı

Tarih: 23.10.2026 (Europe/Istanbul). Repo: `C:\Users\hsyn\Desktop\muhendis-mimar-portali`.
Kaynak HEAD: `04048e50fd02e50c1c9ea783acec2d7383f516b4`. Yerel main ve origin/main referansları aynı; uzak sunucu HEAD'i fetch ile yenilenmedi. Ürün kaynakları değiştirilmedi.

## İnceleme yöntemi ve gerçekten yapılan kontroller

Önce PROJECT/AGENTS/ilgili kurallar ve uygulanmış ilk plan incelendi. **Rev2 düzeltme planını okumadan önce** mevcut server, quota, token, request validation, cleanup, Blob, hook, dialog ve viewer kodlarından bağımsız notlar çıkarıldı. Sonra Rev2 okunup bulgular karşılaştırıldı; bağımsız hata senaryoları çalıştırıldı ve nihai V3 yazıldı. Böylece önceki planın sınıflandırmaları otomatik doğru kabul edilmedi.

- `node docs/belgeler-paylasim-bagimsiz-denetim-2026-10-23/run-baseline.mjs`: **108/108 test, 37 suite, 0 fail, 0 skip**, exit0, yaklaşık 2 saniye. Yedi dosya: filename + share-api/cleanup/client/server/ui/viewer. `baseline-summary.json` ve `baseline.tap` kanıtları.
- `node --import tsx docs/belgeler-paylasim-bagimsiz-denetim-2026-10-23/probes.ts`: **13 bağımsız tanı senaryosu**. Memory repository/Blob'a explicit injection; üretim DB/Blob erişimi yok. Sonuç `probe-results.json`. Bunlar güvenli sonucun geçtiği testler değil, **mevcut kusurları gözleyen tanı problarıdır**; exit0 “sistem hatasız” demek değildir.
- `node docs/belgeler-paylasim-bagimsiz-denetim-2026-10-23/browser-probe.mjs`: canonical canlı sitedeki sözleşme UI'si Chromium 1366→320px. **Bütün share POST/DELETE yanıtları tarayıcıda taklit edildi**, diğer mutasyon istekleri engellendi. Canlı link, DB kaydı veya PDF yaratılmadı. UI davranışı kanıtıdır, gerçek backend E2E değildir. `browser-results.json`, `dialog-320.png`.
- Kaynak kod incelemesi: 5 stüdyo wiring, PDF generator/filename, route'lar, root layout/middleware, next.config, vercel.json/.vercelignore, mevcut migration005, test runner ve repo state.
- Kurulu Next dokümanları: route handlers, proxy, route groups, headers; ek olarak resmi Neon transaction ve Vercel Blob/Cron dokümanları.

**Çalıştırılmayanlar:** tüm `check:belgeler-pdf` görsel zinciri, genel lint/tsc/build, gerçek Neon concurrency, private Vercel Blob lifecycle, gerçek cookie/WAF davranışı, fiziksel Android/iPhone, canlı deployment/config/kota sayaç okuması. Önceki state'teki 303 test/build/READY iddiaları bu denetimin yeniden koşum sonucu değildir. Yeni V3 uygulaması başlamadı.

## Girdiler ve kopyaları

| Özgün girdi | Bu denetimde kullanımı |
|---|---|
| `C:\Users\hsyn\Downloads\BELGELER_PAYLASIM_NIHAI_V2_PLAN (1).md` | İlk hedef ve korunacak ürün sözleşmesi |
| `C:\Users\hsyn\Downloads\BELGELER_PAYLASIM_NIHAI_V2_STATE (1).md` | **BASLAMADI** durumunda eski başlangıç kopyası; bugünkü uygulama state'i değildir |
| `C:\Users\hsyn\Downloads\BELGELER_PAYLASIM_KAPSAMLI_DENETIM_VE_DUZELTME_PLANI_REV2_2026-10-23.md` | 32 bulgu ve 11 aşamalı önceki düzeltme önerisi |
| `C:\Users\hsyn\Downloads\BELGELER_PAYLASIM_DENETIM_DUZELTME_STATE_V2.md` | Rev2 başlangıç state'i |
| `C:\Users\hsyn\AppData\Local\Temp\codex-clipboard-f87f97b3-2e62-435d-ba5c-045bbe41a46a.png` | Kullanıcının ilk deneme engeli ve 50 üretim isteği |

Kalıcı kopyalar bu klasörün `sources\` dizinindedir, `source-manifest.json` dört Markdown'ın özgün/kopya yollarını ve SHA-256'yı tutar. Görsel `sources/kullanici-istegi.png`. Orijinaller değiştirilmedi. Repo içindeki `PLAN/BELGELER_PAYLASIM_NIHAI_V2_STATE.md` ise **TAMAMLANDI** diyor; bu fark eski Downloads state'ini güncel kabul etmeme sebebidir.

## Bağımsız bulgular ve kanıt

Önem: P1 = düzeltme/release öncesi zorunlu; P2 = işlev/UX/dayanıklılık sorunu. Aşağıdakiler üretimde sömürüldüğü veya veri ihlali yaşandığı iddiası değildir.

| Kimlik | Öncelik / kesinlik | Gözlem, kaynak ve etkisi | V3 |
|---|---|---|---|
| N01 | P1, MEMORY_REPRO + CODE | 3/15dk ayarına rağmen aynı IP'den **20 farklı paralel requestId'nin 20'si kabul edildi**. repository.ts:484 SELECT sayıyor; service-core ardından ayrı INSERT. Mevcut race testi aynı ID unique testidir, kota atomikliğini kanıtlamaz. | 05,13 |
| N02 | P1, MEMORY_REPRO | Failed kayıt sonrası aynı ID retry **UNIQUE constraint violation: request_id_hash**. `service-core.ts` failed dalını ele almadan INSERT'e düşüyor. Normal ağ/PDF/Blob hatası kullanıcıyı retry döngüsüne kilitleyebilir. | 04 |
| N03 | P1, MEMORY_REPRO | Farklı IP/istemci aynı ID+payload verince `existing_ready` ve **aynı manageToken** alıyor; owner/proof kontrolü yok. Kötüye kullanım ID/payload bilgisini gerektirir; public view token tek başına bu bilgiyi sağlamaz. | 03,04 |
| N04 | P1, MEMORY_REPRO | Revoke→purge→tombstone GC sonrası aynı ID farklı payload ile yeniden oluşturulunca **aynı view token, eski URL durumu ok**. Sebep yalnız requestId'ye bağlı v1 HMAC. Eski link farklı yeni içerik gösterebilir. Bu Rev2'nin açıkça kapsamadığı bir yaşam döngüsü açığıdır. | 04 |
| N05 | P1, MEMORY_REPRO | Blob PUT var; kayıt failed; cleanup error0 fakat **Blob kalıyor, aktif byte=0**. failed sonlanmamış kayıt orphan sayılmıyor, stale pending sorgusu da yakalamıyor; expiry'ye kadar temizlikten kaçabilir. | 05,09 |
| N06 | P2, MEMORY_REPRO | `window.localStorage` getter'ı exception atınca `getStoredShareLinks()` dışarı exception taşıyor. `isLocalStorageAvailable` getter'ı try dışında okuyor; storage-disabled fallback her durumda güvenli değil. | 08 |
| N07 | P1, MEMORY_REPRO | Blob del hatası enjekte edildi: cron **HTTP200, success:true, errorCount:1**. Çalışma başarısızlığı gizleniyor. Vercel otomatik retry yaptığı varsayılamaz. | 09 |
| N08 | P2, MEMORY_REPRO | PDF HEAD bir kez `blob.get` çağırdı; GET'i delege edip gövdeyi atıyor, stream cancel yok. Gereksiz transfer ve kaynak kullanımı. | 06,11 |
| N09 | P1, LOCAL_FUNCTION_REPRO | Origin/Host olmayan JSON + bilinmeyen üst alan + 8 karakter ID kabul edildi; tüm belge türlerine üç sabit etiket eklendi. `request-validation.ts` exact schema/same-origin sözleşmesini tam uygulamıyor. Origin tek başına bot yetkilendirmesi değildir. | 06 |
| N10 | P1, MEMORY_REPRO | 120 expired fixture için **50 purged / 70 kaldı**. Günlük tek cron ile günlük sürekli üretim 50'yi aşarsa backlog büyür; sadece cursor düzeltmek yetmez. | 09,14 |
| N11 | P1, MEMORY_REPRO | pending→markPurged→geç finalize sırası sonrasında view durumu **ok**. `finalizeReady` status/attempt/lease koşulsuz UPDATE yapıyor. RevokeAt dolu örnekte get kontrolü korur; boş revokedAt'lı cleanup terminalinde koruma yok. | 04,09 |
| N12 | P1, STREAM_REPRO | 64 KiB limitine karşı 20×16 KiB chunk gönderildi; reddetmeden önce **20/20 chunk okundu**. `request.text()` sonrası boyut kontrolü gerçek stream limiti değildir. | 06 |
| B01 | P2, BROWSER_MOCK_REPRO | Başarılı kart açıkken DELETE503 `SENTETIK_IPTAL_HATASI` döndürüldü; görünür hata sayısı **0**. Dialog `share.error` yalnız activeLink olmayan dalda. | 07 |
| B02 | P1, BROWSER_MOCK_REPRO | Sözleşmede link→kapat→`sozlesme-muteahhit_unvan` alanını değiştir→aç: eski sonuç görünür, **create düğmesi0**, mockPOST1. Yeni revision için yeni link yolu yok. | 07 |
| B03 | P2, BROWSER_MOCK_REPRO | 320px viewport: dialog clientWidth286, scrollWidth347; sağdaki metin/Kopyala kırpılıyor. Görsel dosyası bunu doğrular. Birçok işlem 24–40px, 44px altında. Sonuç sentetik linki maskeli. | 07,13 |
| N13 | P1, CODE | Repository ensureSchema ilk erişimde CREATE TABLE/INDEX yapıyor; ilk uygulanmış planda açıkça yasaktı. Migration/readiness ile runtime ayrılmalı. | 02 |
| N14 | P1, CODE | repository/blob factory yalnız VERCEL flag'ine göre katı davranıyor; Vercel dışı NODE_ENV production konfigürasyonsuzken Memory dönebilir. Ayrıca env mirası testte gerçek cloud'a gitme riski yaratır. | 01,02 |
| N15 | P2, CODE | server-pdf yalnız header/boyut/hash denetliyor; runtime parse/page/AcroForm kontrolü yok. Internal render exception metni API mesajına taşınabiliyor. | 06,12 |
| N16 | P2, CODE | Viewer fetch/loadingTask/PDF proxy cleanup yok; cancel sonrası settle beklemeden render; fitPage/pinch yok, mobil fitWidth gizli, 0.5 min ve A4 sabiti. Sabit dark renkler tema eşliğini karşılamıyor. | 10 |
| N17 | P1, DESIGN_GAP | Yeni kota yalnız yeni deployment'ta uygulanırsa eski public deployment URL'sindeki POST eski kimliksiz kodla aynı DB'ye yazabilir. Aynı durum eski cron kodu için de önemli. Ortam erişimi görülmediği için **üretimde teyitsiz risk**. | 14 |
| N18 | P1, DESIGN_GAP | 50 başarı semantiğinde 49 used+1 pending ve gece yarısını aşan iş tanımsızsa yanlış 429 veya çift kota olur. Byte refund, daily refund ve terminal status tek atomik finalize sözleşmesine bağlanmalı. | 04,05 |

## Rev2'nin F01–F32 bulguları ile açık karşılaştırma

| Rev2 | Karar / bağımsız değerlendirme | V3 aşaması |
|---|---|---|
| F01 | Korundu, B02 ile tarayıcıda tekrar üretildi; sadece ID yenilemek yetmez, yeni bağlantı eylemi de gerekli. | 07 |
| F02 | Korundu, N03 ile doğrulandı; proof+owner ve N04 nonce/tombstone ilavesi. | 03–04 |
| F03 | Korundu, N01 ile doğrulandı; günlük ve fiziksel byte atomikliği, başarısızlık refund'u eklendi. | 05 |
| F04 | Korundu, N12 chunk deneyiyle doğrulandı. | 06 |
| F05 | Kodla doğrulandı; cursor'a ek olarak gerçek memory pagination, throughput/backlog ve adil retry. | 09 |
| F06 | Kod riski doğrulandı; gerçek viewer hızlı-etkileşim/bellek testi bu oturumda NOT_RUN. | 10 |
| F07 | Önceki canlı otomasyon iddiası bu oturumda tekrar doğrulanmadı. Tüm status ve client navigasyon için test; peşin bug/refactor yok. | 11 |
| F08 | A4 sabiti, mobile gizli fit ve CSS kodda doğrulandı; geometry oracle eklendi. | 10 |
| F09 | Her stüdyoda default true warning kodda doğrulandı; hassas/örnek sınıflandırma ve sade metin. | 07,12 |
| F10 | Expiry/history/storage eksikleri korundu; transactional IndexedDB ve doğrulanmamış durum ayrımı. | 08 |
| F11 | `formatYibfPart` harf kabul ediyor, korundu; tam7 rakam, PDF formunu bozma. | 12 |
| F12 | API ve hook sabit900/15dk, doğrulandı. Reserved/abuse/capacity kodlarıyla genişletildi. | 05–07 |
| F13 | Hook close loading'i sıfırlıyor fetch durmuyor; response generation ve lost-response recovery şart. | 07 |
| F14 | N08 ile HEAD gerçek blob.get çağrısı doğrulandı. | 11 |
| F15 | /b HTML global strict-origin-when-cross-origin; token same-origin referer yolunu taşıyabilir. PDF error header tutarsız. Yeni no-referrer/no-store kapsamı. | 06,11 |
| F16 | Kurulu Next rehberinde deprecated doğrulandı; **tüm siteyi route-group'a taşıma zorunluluğu kaldırıldı**. Kanıtlı dar çözüm. | 11 |
| F17 | Önceki deployment/build gözlemi tarihsel kanıt olarak korundu; Vercel'e yeniden bağlanıp doğrulanmadı. Branch deploymentDisabled kodda var, skip etiketi tek başına garanti değil. | 14–15 |
| F18 | Yeni görsel/PDF parity yapılmadı; eski başarılar tekrar edilmiş sayılmaz. Net5×3 matris. | 12–13 |
| F19 | initialExpiresAt kullanılmıyor, sabit90 etiketi; korundu. | 10 |
| F20 | IP extraction kodda doğrulandı; platform header güven zinciri bu oturumda NOT_RUN. IP artık ürün kotası değil. | 06,14 |
| F21 | N05/N07/N10/N11 ile genişletildi; yalnız stale pending/grace yeterli değil. | 09 |
| F22 | GET/HEAD transfer ve DB maliyeti gerçek; mevcut Vercel planı/fatura incelenmedi, uydurma fiyat yok. | 14 |
| F23 | Kullanıcı isteği kesin kabul K01/K02; eski sınırlar kaynakta doğrulandı. İlk görseldeki gerçek 429 server nedeni henüz bilinmiyor. | 03,05,07,13 |
| F24 | History sayaç≠quota, ayrı aggregate sunucu sayaç; korundu. | 05,07 |
| F25 | Kapasite kaygısı doğru; **50×90=4500**, 1,2MiB varsayımı=5,27GiB. Rev2'deki 5400 belge/6–7GiB hatalı. | 05,09,14 |
| F26 | Anonim kimlik korundu; cookie silme/farklı host sınırı dürüstçe belirtildi. | 03 |
| F27 | Gerçek reset/serverNow/Retry-After; reserved denial quota bitmesi değildir. | 05–07 |
| F28 | Preview/prod izolasyonu şart; hangi env'in aynı kaynakları kullandığı teyit edilmedi. | 01–02,14 |
| F29 | window.location.origin kodda var; **production deployment hostu canonical**, **izole preview kendi hostu** diye netleştirildi. Bütün preview linklerini production'a zorlamak yanlış olurdu. | 06 |
| F30 | Bootstrap şart; aynı kimlik için iki normal sekme koordine edilir. Anonim sil-yenileyi tümden önleme garantisi verilmez. | 03 |
| F31 | 20 limit bug; **aktif kayıt sayısal sınırla atılmaz**. Rev2 aşama02 hâlâ20 diyor, state04 “100 geçmiş” diyor; bu çelişkiler V3'te kaldırıldı. | 08 |
| F32 | **Mevcut kodda hata değil.** `getShareByViewToken` önce `revokedAt` kontrol ediyor. Probe: record.status=purged, result.status=revoked. Bu sırayı koruyan regresyon yeterli; asıl yeni sorun N04/N11. | 04,11 |

## Önceki planın uygulama açısından iyileştirilmesi

1. Rev2 aşama03 kimlik, kripto, migration, atomik kota, HTTP ve kapasiteyi tek dev aşamada topluyordu. V3 bunları **02–06** olarak ayırdı; Luna'nın her turda daha dar değişiklik/test kapsamı var.
2. UI düzeltmesi backend sözleşmesinden önce yapılınca ikinci kez yazılma riski vardı. V3 önce schema/identity/idempotency/quota/API, sonra hook/dialog/history ilerliyor.
3. Sadece sayacı50 yapmak yetersiz: başarısız retry, reserved zamanlaması, storage fiziksel muhasebesi, delete backlog, eski deployment writer ve token tekrar kullanımı ayrı kabul kapıları oldu.
4. İlk orijinal planın runtime DDL yasağı ve gerçek PDF parse beklentisi mevcut uygulamada eksikti; V3 bunları açıkça geri aldı.
5. Rev2'de HTTP200 hata sayfası ile API410 ayrımı muğlaktı. V3 API410'u zorunlu, HTML statüsünü framework ile doğrulanmış ayrı sözleşme yapıyor. JSX içinde “iptal” yazması HTTP410 testi değildir.
6. 108 mevcut testin tamamı geçerken kusurlar bulunabildi. V3 same-ID unique, distinct-ID quota race, parse gerçekliği, browser mock ve gerçek backend testlerini ayrı kanıt olarak istiyor. Desktop-only Playwright skip kuralı özellikle kaldırılacak.
7. WAF/Redis/CAPTCHA/dedup/maliyet yükseltme kendiliğinden eklenmez. Gerekli dış karar hazır seçeneklerle release aşamasına bırakılır; yerel düzeltmeler gereksiz bloke edilmez.
8. Kullanıcının gelecekte yeniden denetim istemesine uygun kalıcı kanıt klasörü, tek STATE, açık stage stop/restart ve son denetim komutu eklendi. Eski Downloads state'in “başlamadı” olması uygulamayı baştan tekrar kurma sebebi olamaz.

## Bağımsız ilk çalışma sırası → nihai birleşim

Bağımsız kaynak incelemesinden çıkan ön sıra: (1) değişmeyen eski-link güvenliği ve failed/replay akışı, (2) yarışsız kota/physical byte, (3) cleanup/lease/kapasite, (4) form-revision/dialog/storage, (5) viewer/headers, (6) gerçek test/release. Rev2'nin **50/gün/tarayıcı** ürün kararı ve kapsamlı PDF/mobil matrisi bu sıraya eklendi. Sonuç 15 aşamalı V3; 01–13 yerel doğrulama, 14 kapasite/RC hazırlığı, 15 ayrı açık yayın komutuyla release.

## Teknik kaynaklar ve sınırları

- Kurulu Next rehberi `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`: middleware adı deprecated; bu tek başına çalışan kabuk hatasının kanıtı değildir.
- Kurulu `headers.md`: request-time API; root seviyesindeki kullanımın dinamik render etkisi build raporuyla ölçülmelidir. `route-groups.md` çoklu root geçişinde full reload uyarır; geniş refactor otomatik önerilmedi.
- [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver): HTTP için non-interactive transaction; interactive session gerektiğinde uygun bağlantı gerekir. V3 SQL transaction önerisi buna dayanır.
- [Vercel Blob SDK](https://vercel.com/docs/vercel-blob/using-blob-sdk): list cursor/hasMore ile ilerler. Mevcut ilk sayfa taraması bu sözleşmeyi kullanmıyor.
- [Vercel Cron yönetimi](https://vercel.com/docs/cron-jobs/manage-cron-jobs): başarısız cron invocation otomatik yeniden denenmez; overlap/lock ve çalışma süresi uygulama tarafından yönetilir. “HTTP500 olunca platform mutlaka tekrarlar” varsayımı yok.

Bu kaynaklar 23.10.2026'da okundu. Ücret/plan/kapasite değerleri bu oturumda doğrulanmadı; uygulama release öncesi güncel ölçüm ve resmi fiyat/hesap bilgisi gerekir.
