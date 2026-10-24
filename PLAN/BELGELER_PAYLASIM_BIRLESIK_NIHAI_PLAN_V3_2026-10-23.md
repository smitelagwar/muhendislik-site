# Belgeler paylaşımı — bağımsız denetimle birleştirilmiş nihai uygulama planı V3

Plan kimliği: `BELGELER-SHARE-MERGED-V3-20261023` · Tarih: 23 Ekim 2026, Europe/Istanbul.
Durum: **PLAN_HAZIR / UYGULAMA_BASLAMADI**. Bu dosya bir tamamlanma raporu değildir.
Hedef uygulayıcı: Kullanıcının seçtiği **GPT 6 Luna / Extra High**, yerel Windows çalışma alanı. Her `devam` en fazla bir aşama.

## 1. Dosyalar, öncelik ve çalışma sınırı

**Repo kökü:** `C:\Users\hsyn\Desktop\muhendis-mimar-portali`

**Tek geçerli uygulama planı:** `C:\Users\hsyn\Desktop\muhendis-mimar-portali\PLAN\BELGELER_PAYLASIM_BIRLESIK_NIHAI_PLAN_V3_2026-10-23.md`

**Tek güncellenecek uygulama STATE'i:** `C:\Users\hsyn\Desktop\muhendis-mimar-portali\PLAN\BELGELER_PAYLASIM_BIRLESIK_NIHAI_STATE_V3_2026-10-23.md`

**Bağımsız bulgular ve Rev2 karşılaştırması:** `C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-bagimsiz-denetim-2026-10-23\DENETIM_VE_KARSILASTIRMA.md`

**Luna komutları:** `C:\Users\hsyn\Desktop\muhendis-mimar-portali\PLAN\BELGELER_PAYLASIM_LUNA_KOMUTLARI_V3_2026-10-23.md`

**Yeni uygulama kanıtlarının yeri:** `C:\Users\hsyn\Desktop\muhendis-mimar-portali\docs\belgeler-paylasim-v3-uygulama\`. Her aşama `ASAMA_XX.md`, gerekli küçük JSON raporları ve maskelenmiş görseller üretir. Son çıktı `FINAL_AUDIT.md` olur. Henüz bu uygulama kanıtları yoktur.

Bu belgede aşağıdaki kaynak/test yolları repo köküne göredir. Komutlar repo kökünde PowerShell ile çalıştırılır. Göreli dosya isimlerini Downloads'ta arama.

Girdi belgeleri ve görselin kalıcı kopyaları bağımsız denetim klasörünün `sources\` dizinindedir; özgün yollar ve SHA-256 değerleri `source-manifest.json` içindedir. Downloads'taki dört belgeye veya tamamlanmış eski plan/state dosyalarına yazma. V3, **uygulama kararlarında** Rev2'nin yerine geçer; eski planlar yalnız geçmiş bağlamdır. Kullanıcının güncel açık talebi ve `AGENTS.md` önceliği korunur.

İlk okuma sırası: `PROJECT.md` → `AGENTS.md` → `.agents/rules/belgeler-kurallari.md`, `test-ve-otomasyon-standardi.md`, `vercel-kurallari.md`, `yasayan-dokumantasyon-bakimi.md` → V3 plan/state → bağımsız denetim. Next kodu yazmadan ilgili kurulu `node_modules/next/dist/docs/` rehberlerini oku. Kod/test ile belge çelişirse bugünkü gerçeği doğrula.

**Denetim tabanı:** yerel `main`, HEAD/main/origin-main yerel referansları `04048e50fd02e50c1c9ea783acec2d7383f516b4`; başlangıç çalışma ağacı temizdi. Remote fetch yapılmadı; origin/main referansı canlı uzak HEAD kanıtı değildir. Son commit blueprint balina katmanını kaldırır; geri getirme. Yeni oturumda HEAD farkını ve kullanıcı değişikliklerini koru. Bu planı hazırlayan oturum ürün kodu, DB, Blob, GitHub veya deploy değiştirmedi; yalnız plan/kanıt dosyaları ekledi.

## 2. Kullanıcının görseldeki isteği — değiştirilemez ürün kabulü

Kullanıcı: **“1 kez denedikten sonra … uyarı geliyor … tarayıcı başına 50 adet üretmeye kadar izin verebilir ya da günlük 50 adet … nihai planda kesinlikle olacak.”** Görselin kopyası `docs/belgeler-paylasim-bagimsiz-denetim-2026-10-23/sources/kullanici-istegi.png`.

**Seçilen net yorum: aynı anonim tarayıcı kimliği için İstanbul takvim gününde 50 başarılı, benzersiz yeni bağlantı.** Gün 00.00 Europe/Istanbul'da yenilenir. Aynı profil/hosttaki sekmeler aynı kotayı paylaşır. Aynı Wi-Fi/NAT'taki iki tarayıcı bağımsız hak kullanır. Bu, fiziksel kişi/cihaz kimliği garantisi değildir; cookie silme, gizli profil ve farklı host ayrı kimlik yaratabilir. Fingerprinting veya hesap zorunluluğu ekleme.

Zorunlu kullanıcı kabulü: **sözleşme stüdyosunda ilk link → formu değiştir → ikinci link sorunsuz; 1–50 başarılı yeni link mümkün; 51. yeni link doğru günlük kota mesajı alır.** Geçmişte bir bağlantı görünmesi sunucuda yalnız bir istek olduğunun kanıtı değildir. Ekrandaki gerçek ilk 429'un hangi sayacı tetiklediği bu denetimde canlı DB'den doğrulanmadı.

- Normal akıştan `3/15dk IP`, `10/24s IP`, `20 aktif/IP` engellerini çıkar. IP başına 50 ile değiştirme.
- Aynı isteğin ağ tekrarı, mevcut linki açma/kopyalama, başarısız üretim ve iptal **yeni başarı sayılmaz**. Başarılı linkin sonradan iptali günlük hakkı geri vermez.
- `used` kesinleşmiş başarı, `reserved` halen çalışan işler, `remaining=max(0,50-used-reserved)` olarak sunucudan gelir. `used=49,reserved=1` durumunda “50 bağlantı oluşturdun” yazma; devam eden iş nedeniyle geçici bekleme göster. Kota endpoint'i yalnız bu tarayıcının agregat bilgisini verir.
- `429 DAILY_BROWSER_QUOTA_EXCEEDED` yalnız `used=50` için; ISO `resetAt`, `serverNow`, gerçek saniyeli `Retry-After`. Devam eden rezervasyonların tüm boşluğu doldurması `409 BROWSER_QUOTA_RESERVED`; yeniden kontrol ederek devam et. Sistem kapasitesi `503 STORAGE_CAPACITY_UNAVAILABLE`; WAF/abuse yanıtı ayrı. Hepsini “15 dakika bekle”ye çevirme.
- Normalde küçük satır: **“Bugün 1 / 50 · 49 bağlantı hakkın kaldı”**. Reset saatini Türkiye saatiyle açıkla; cihaz saati yanlış olsa da sunucu saati temel alınır. Aynı sekmede gece yarısı, sekmeye geri dönüş ve başka sekmede oluşturma sonrasında yenile.
- 50 hakkı ile 90 günlük saklama birlikte gerçek kapasite testine tabidir. Bir ağ veya kapasite kesintisinde “50 kesin her koşulda oluşur” vaadi verme; fakat normal kullanıcıyı eski IP limitleriyle tekrar engelleme.

## 3. Korunacak sözleşmeler

Beş belge: `beton-dokum-tutanagi`, `santiye-sefi-taahhutnamesi`, `santiye-sefi-istifa-dilekcesi`, `insaat-ruhsati-dilekcesi`, `santiye-sefi-sozlesmesi`.

Normal **PDF İndir editable**, boş form adları `*_BOS.pdf` ve Yazdır çalışır. Paylaş yalnız kullanıcı “Bağlantı oluştur” dediğinde allowlist JSON gönderir, sunucu `flatten:true` PDF üretir. Mevcut 56 alan/sabit etiket sözleşmesi, taslak izinleri, undo/restore/inline edit, odak, bölüm ve mobil form/PDF geçişleri korunur. Form değişikliği daha önce yayımlanmış PDF'yi değiştirmez.

Link **90×24 saat** geçerli; yeni kayıtlar için başlangıç başarılı `ready_at`, eski kayıtların mevcut `expires_at` değeri korunur. API expiry anında 410; iptalde önce DB erişimi kapanır, sonra fiziksel silme. Alıcı view tokenı yönetim yetkisi vermez. `/b/[token]` site kabuğu, düzenleme/indir/yazdır/ham PDF yeni sekme düğmesi içermeyen okuyucu olarak kalır. Gerçek kopya/ekran görüntüsü engelleme veya DRM vaadi yoktur. Önceden indirilmiş baytları iptal sonrası uzaktan silme garantisi verilmez.

`/p/[token]`, `dok_*`, CAD, mühendislik formülleri, genel tasarım/tema değişmez. WhatsApp, `wa.me`, `navigator.share`, e-posta, QR, hesap, OCR/e-imza, yeni belge türü eklenmez. Saklamada içerik dedup/ref-count veya yeni kuyruk/Redis servisi bu düzeltmenin varsayılanı değildir.

## 4. Önce kararlaştırılmış teknik ayrıntılar

### 4.1 Kimlik, replay ve eski linkler

Kimlik sunucuda CSPRNG ile, sürümlü imzalı HttpOnly cookie olarak verilir; production Secure, SameSite=Lax, host-only, `Path=/api/belgeler/paylasim`. Cookie kotayı tanımlar; iptal yetkisi vermez. JSON yanıtına ham kimlik koyma. Süreyi aktif kullanıcıda kimlik değişmeden yenile; gün ortasında sırf cookie rotasyonu ile yeni kota üretme.

Dialog açılışında aynı-origin bootstrap + cookie echo doğrulaması; POST kimlik yoksa yeni kimlik üretmez, `428 BROWSER_ID_REQUIRED` döner. İki ilk sekme için Web Locks/BroadcastChannel veya destekli eşdeğer koordinasyon + cookie doğrulaması. Web Locks olmayan tarayıcıyı destekle. Çerez engelli ise en çok sınırlı bootstrap denemesi, açıklama ve PDF İndir alternatifi; sonsuz döngü/IP'ye gizli dönüş yok. Anonim istemcinin cookie'yi bilerek silmesini bütünüyle önleyebildiğini iddia etme.

Yeni istek `crypto.getRandomValues` ile **256-bit requestId ve ayrı 256-bit replay proof** taşır; biçim ve uzunluk doğrulanır. DB proof'un hash/HMAC özetini tutar. Replay mevcut kaydın owner kimliği + proof + belge/payload özeti ile doğrulanır. RequestId tek başına yönetim tokenını geri aldırmaz. API'yi doğrulanmış replay kurtarmasıyla test et; sadece tokenın 43 karakter olması güvenlik kanıtı değildir.

Yeni token türetimi **v2 domain + DB'de kalıcı rastgele reservation nonce + sürümlü sunucu anahtarı** üzerinden yapılır (eşdeğer denetlenebilir tasarım olabilir). Aynı canlı reservation tekrarında aynı tokenlar; tombstone silindikten sonra aynı requestId yeniden kullanılsa bile **yeni nonce, farklı token**. Yeni kod v1 deterministik türetimini yeni kayıt için kullanmaz. Eski view/manage hash lookup ve DELETE çalışır. Legacy POST replay'inde yalnız requestId üzerinden manageToken geri döndürme; mevcut sahip yönetim anahtarıyla kanıtlayamıyorsa açık `409 LEGACY_REPLAY_UNAVAILABLE`, yeni bağlantı yolu. Secretları otomatik döndürme; eski link hashlerini yeniden yazma. Anahtar versiyonu ve kaybında replay'in güvenli hatası test edilir.

### 4.2 Üretim, kota ve temizlik tek yaşam döngüsü

1. Kimlik/proof/body kontrolü → SQL'de **idempotency + günlük hak rezervasyonu + byte rezervasyonu + pending attempt** birlikte commit.
2. PDF render ve Blob PUT işlem sırasında DB kilidi tutulmadan yapılır. Her attempt ayrı rastgele Blob yolu; geç kalan eski attempt güncel nesneyi ezemez.
3. `finalize` yalnız `pending AND attempt_id/lease_version eşleşiyor AND lease geçerli AND revoked_at IS NULL` koşulunda ready yapar; etkilenen satır sayısı kontrol edilir. Hak `reserved→used`, gerçek byte ve `ready_at/expires_at` **aynı SQL işleminde** kesinleşir.
4. Render/put/finalize hatası: günlük rezervasyon **bir kez** geri bırakılır; Blob varlığı belirsizse byte borcu hemen sıfırlanmaz, cleanup görevi kalır. Başarılı DB commit'inden sonra yanıt kaybolursa aynı proof replay mevcut ready'yi döndürür; ready kaydını genel catch ile failed'e çevirme.
5. Failed tekrar: aynı request/proof/payload için mevcut mantıksal iş yeni attempt lease alır; unique INSERT çakışmasına düşmez. Süresi bitmiş pending lease güvenli devralınır. Yeni form içeriği için yeni requestId şarttır. Geç kalan writer purged/failed/revoked kaydı yeniden ready yapamaz.
6. Sayaç günü DB saatinden İstanbul takvimiyle belirlenir. Gece yarısını aşan iş finalize sırasında eski rezervasyonu bırakıp yeni gün hakkını **atomik** alır; o gün doluysa ready olmaz, nesne cleanup'a gider ve açık hata döner. Çift refund veya iki güne başarı yazma yok. Kullanıcıdan gelen tarih/saat sayaçta kullanılmaz.

Neon HTTP `sql.transaction` non-interactive işlemleri destekler; ayrı HTTP sorgularına `BEGIN/COMMIT` yazıp tek session var sanma. Şartlı mutasyonları aynı SQL fonksiyon/transaction içinde yap, kilit sırası tutarlı olsun. Unique race'i ham 500'e çevirmek yerine mevcut kayda tekrar bak. İşlem maliyeti öncesi rezervasyon zorunlu. Gerçek ayrı PostgreSQL bağlantılarıyla yarış testleri gerekir; Memory/PGlite yalnız yardımcıdır. [Neon sürücü belgesi](https://neon.com/docs/serverless/serverless-driver).

### 4.3 Kapasiteyi doğru say

**50×90=4.500 PDF**, 5.400 değil. 1,2 MiB ortalama varsayımıyla 5.400 MiB ≈ **5,27 GiB** tek sürekli aktif tarayıcı; 10 tarayıcı ≈52,7 GiB. Bu tahmini dosya hacmidir, fiyat değildir; gerçek ortalama/p95/max boyut ve trafik ayrı ölçülür. 3 MiB tavanın tüm kayıtlarda dolduğu üst senaryo tek tarayıcı için ≈13,18 GiB'dir. Grace/temizlik gecikmesi ek kapasite ister.

`physical_committed_bytes + pending_reserved_bytes + deletion_pending/unknown_upload_bytes` bütçede sayılır; sadece erişilebilir ready dosyaları saymak yetersizdir. Silme doğrulanmadan yer açılmış sayma. Global günlük/byte üst sınırı env/config ile gerekçeli; mevcut 1 GiB/200 değerlerini körlemesine koruma veya rastgele sınırsız büyütme. 200 global günlük sınır, dört tam kullanıcıyla dolar; hedef eşzamanlı kullanıcı sayısı kapasite raporunda yer alır. Plan/fiyat/izin bilgisi yoksa yerel geliştirme tamamlanır, yalnız release gate açık kalır; ücretli paket kendiliğinden açılmaz.

Cleanup **günde yalnız 50 kayıt silen** iş olarak kalamaz. Günlük 200 üretim ve 50 silme uzun vadede en az 150/gün kuyruk büyümesi yapar. Bounded çok-batch döngüsü, cursor/checkpoint, adil retry/backoff ve throughput kanıtı gerekir. Hata alan ilk batch sonraki işleri sonsuza kadar aç bırakmamalı. DB kaynaklı silmede de prefix ve store/environment sınırı doğrulanır. Orphan için 24 saat grace, üretim lease'i için ölçülen max iş süresinden uzun fakat 24 saatlik kota kilidine dönüşmeyen ayrı süre kullanılır. [Blob sayfalama](https://vercel.com/docs/vercel-blob/using-blob-sdk), [Cron yönetimi](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

### 4.4 Preview, canlı ve test sınırları

Runtime DB/Blob konfigürasyonu eksikse 503; `NODE_ENV=production` altında Vercel dışında da açık test modu olmadan Memory fallback yasak. Test modu yalnız CI/yerel açık flag, production Vercel'de kapalı. Üretim request'inde `CREATE TABLE/INDEX` yapma; migration yayın öncesi yönetilen adım, runtime schema sürümü yalnız kontrol eder.

Production release deployment URL'si ve production alias aynı veri ortamını temsil ediyorsa **yeni link canonical production URL'si** olur. Gerçek izole Preview kendi allowlist test hostunu döndürür; production'a yöneltemez. Sadece hostname'de `vercel.app` bulunmasına göre karar verme. Bir environment'ın DB kaydına başka environment'ın Blob yolunu bağlama. Host/Origin tam scheme+host+port doğrulanır; eksik/null/bozuk Origin için browser API sözleşmesi açık ret, testler gerçek başlıkları gönderir. Origin kontrolü tek başına bot koruması değildir.

### 4.5 Yerel yönetim kaydı

Arayüzde 20/100 satır sayfalama olabilir; **aktif iptal anahtarı sayısal sınır yüzünden atılamaz**. IndexedDB transaction ile viewToken anahtarına göre kaydet; 4.500 aktif kayıt testi. Eski `belge_paylasim_user_registry_v1` verisini doğrula, aktar, **kalıcı yazma başarıyla doğrulanmadan eski veriyi silme**. Kesinti halinde migration tekrar güvenli çalışır. Aynı anda iki sekme append/revoke kaybetmez.

Kayıt yalnız view/manage token, belge türü, kanonik link, zamanlar ve durum içerir; ham form/PDF/kişi adı yok. Quota cookie ile taslak saklama iznini karıştırma. localStorage getter, IndexedDB açılış/transaction, quota exceeded, bozuk JSON ve eviction hataları ele alınır. Tarayıcı saklaması kapalıysa oluşturma öncesi yönetim anahtarının kapanıştan sonra kaybolabileceği belirtilir; mevcut oturumda kopyalama/iptal çalışır. Sonuç URL'sini sunucu biçim/origin/expiry doğrulamasından geçir. 4.500 kaydı her render'da parse edip tümünü DOM'a basma. Anahtar dışa aktarma/hesap senkronizasyonu bu planda eklenmez.

## 5. Aşamalar — her biri tek çıktı ve test kapısı

Ortak protokol: STATE oku → HEAD/diff kontrol et → yalnız aşamanın bağımlı küçük değişikliklerini yap → anlamlı test → kanıt dosyası + STATE → 4–7 satır rapor ve dur. Başarısız zorunlu test varken sonraki bağımlı aşamaya geçme. `NOT_RUN` hiçbir zaman PASS değildir. Yeni bulguyu `V3-Nxx` kimliğiyle kaydet. Kullanıcı dosyalarını reset/clean/stash ile silme. Yeni subagent başlatma zorunluluğu yoktur. Aşama sınırları commit/push sınırları değildir.

### ASAMA_01 — Başlangıcı sabitle, kanıt ve test altyapısını ayır

- Git durumu, gerçek HEAD, Node/npm, paket/test komutları, migration sırası ve mevcut ENV **isimlerinin** varlığını kaydet. Secret değerlerini veya üretim verisini loglama. `.env.local` ile testlerin canlı Neon/Blob'a gitmesini engelleyen açık izolasyonu doğrula.
- Bağımsız raporun 108 test ve 13 tanı probunu önce tarihsel kanıt olarak al; güncel kaynak farklıysa yalnız etkilenenleri yeniden üret. Tarayıcı probu gerçek UI + taklit API'dir, production uçtan uca kanıtı değildir.
- `F01–F32` ve `N/B` eşleme tablosunu state'e taşı; F32 mevcut revokedAt sırasıyla **NOT_A_BUG**, F07 henüz **NOT_REPRODUCED/NOT_RUN**. Önceden giderilmiş şeyi yeniden bozma.
- İzole PostgreSQL/Blob entegrasyon testinin nasıl çalışacağı ve fiziksel cihaz bulunabilirliği yazılsın; altyapı yok diye bütün yerel ilerlemeyi durdurma, dış kapıyı işaretle.
- Baseline: hedefli 108 test, runtime tsc, değişecek dosyalar lint; production build bir kez gerekirse bu aşamada, yoksa ASAMA_13'te. Eski global lint/TS sorunları ayrı kaydedilsin.

**Çıktı:** `ASAMA_01.md` + başlangıç envanteri + uygulanacak test listesi. **Kapı:** ürün kaynakları değişmeden kanıt sınıfları ve test izolasyonu net. Sonraki: 02.

### ASAMA_02 — İleri uyumlu şema, adaptör ve runtime güvenliği

- Ana dosyalar: `src/lib/belge-paylasim/{types,repository,config,blob-store}.ts`, `db/migrations/`, `.env.example`; mevcut `005_belge_paylasim.sql`'i yeniden yazma. Denetimde son numara 005; **006 yalnız hâlâ boşsa** kullan.
- Owner hash, request/proof/token version, reservation nonce, attempt/lease/version, ready_at, quota day/accounting, purge reason ve fiziksel byte yükümlülüğü için minimum şema tasarla. Günlük bucket UNIQUE(environment,owner_hash,day), sayaç nonnegative CHECK, ilişki/indexler. Hassas form sütunu ekleme.
- Legacy satırları silmeden/kişiye atamadan nullable/versioned eklemeler; eski view/manage/expiry aynen. Şema-ready probe read-only, runtime DDL kaldır. Eksik schema/config kontrollü 503; Memory yalnız açık yerel test adaptörü.
- Migration tekrar çalıştırma ve eski uygulama sürümüyle read/revoke uyumluluğu test et. Ortamlar aynı Blob store paylaşacaksa ayrı namespace ve kesin deletion guard; mümkünse ayrı store/DB. Migration bu aşamada yalnız izole DB'de.

**Kapı:** fresh DB ve legacy fixture upgrade PASS; runtime prod fallback yok; public GET DDL yapmıyor. **Çıktı:** schema/rollback notu ve testler. Sonraki: 03.

### ASAMA_03 — Tarayıcı kimliği ve kota hazırlık endpoint'i

- Önerilen yeni modüller `src/lib/belge-paylasim/browser-identity.ts`, `src/app/api/belgeler/paylasim/kota/route.ts`; kesin isimleri state'e yaz.
- Bölüm 4.1 cookie/echo/iki sekme akışını uygula. Kota okuması boş defaultları bellekten uydurmaz; DB'deki doğru gün bucket'ını okur. Eksik kimlikli POST kendi başına yeni browser yaratmaz.
- Cookie imza/versiyon/expiry, secure local istisna, host/path, cookie-blocked sınırlı kurtarma; cookie ham değeri response/logda yok. Yeni env secret gerekirse örnek yalnız isim/uzunluk, mevcut secretı döndürme.
- Test: aynı browser iki sekme, aynı IP iki ayrı browser context, iki ilk bootstrap, bozuk cookie, cookie reddi, gün/host/env farkı; browser UI geçici olarak eski create yoluna bağlanmaz.

**Kapı:** kimlik istikrarlı; POST/GET sınırı tanımlı, sonsuz bootstrap yok. Sonraki: 04.

### ASAMA_04 — Güvenli idempotency ve yarışa dayanıklı durum makinesi

- `tokens.ts`, `service-core.ts`, repository ve create/delete route sözleşmeleri. Bölüm 4.1–4.2 replay/proof/token-v2/fencing kurallarını uygula.
- Aynı kimlik+proof+payload hazır replay 200; ilk başarı 201; in-flight 202 + güvenli aynı istekle durum/retry akışı (bu yeni yanıtı ASAMA_07 UI anlayacak). Farklı payload 409, yanlış proof bilgi sızdırmadan ret. Legacy manageToken POST ile geri verilmez.
- Reload/yanıt kaybı için `GET /api/belgeler/paylasim/islem/[requestId]` durum endpoint'i tanımla: aynı owner cookie + ayrı replay-proof header zorunlu; query string'e proof yazma. Pending202/ready200/failed kontrollü durum; hazır sonuç yalnız bu kanıtla view/manage döndürür, form verisi hiçbir zaman dönmez. Bütün yanıtlar private no-store; yanlış proof/kayıt yok bilgisini ayırt ettirmeyen ret. Böylece formu kalıcı saklamadan başarılı işlemi geri bulmak mümkün olur. Endpoint yeni PDF üretmez; failed retry ancak özgün içerik mevcutsa aynı payload ile POST'tur.
- Failed retry için aynı kaydın yeni attempt'i; revoke/purge terminal erişimi korur. Tombstone GC sonrası aynı requestId yeni v2 nonce üretir, eski link aktifleşmez. Token ve snapshot değişmezliği birlikte sınanır.
- Genel catch ready'yi failed'e çeviremez. Geç finalize, lease takeover, revoke/finalize çakışması, PUT sonrası DB hata ve yanıt kaybı için deterministik failure injection.

**Kapı:** N02/N03/N04/N11 regresyon testleri PASS; aynı ID 20 paralelde tek mantıksal iş, ham UNIQUE 500 yok; eski view/revoke çalışır. Sonraki: 05.

### ASAMA_05 — Atomik 50/gün ve fiziksel byte muhasebesi

- Önerilen `quota.ts`; repository SQL fonksiyon/transaction'ları ve config. Reserve link + daily + bytes tek transaction; finalize/refund tam bir kere. Render/Blob sırasında kilit tutulmaz.
- Bölüm 2'nin `used/reserved/remaining`, gün sınırı ve hata nedenlerini uygula. 3/10/20 eski IP normal kota yolu tamamen çıkarılır; IP hash yalnız gerekçeli ayrı abuse verisi olarak tutulabilir.
- Günlük başarı geçmişi link iptali/tombstone GC yüzünden geriye düşmez. Günlük ledger retention süresi ve compact/GC ayrı; sadece count(records) kullanma. Fiziksel orphan/failed/deletion_pending bytes unutulmaz.
- Test: 1/49/50/51; 100 farklı ID paralel; tek ID tekrarları; 49 used+1 reserved; failure refund iki kez; iki instance/DB bağlantısı; gece yarısında reserve/finalize/rollback; boşluk 1 bayt kala iki PUT rezervasyonu; BLOB silme başarısızken kapasite serbestleşmez.
- Gerçek PostgreSQL yarış testi çalışmadıysa açık dış kapı; Memory sonucu “Neon atomiklik PASS” değildir. ASAMA_13/14 release öncesi bu açık kapı kapanmalı.

**Kapı:** yerel işlev ve SQL sözleşmesi PASS, normal 1–50 engelsiz; başarısız işi başarı sayma yok. Sonraki: 06.

### ASAMA_06 — HTTP sözleşmesi, sınırlar ve doğru link alan adı

- `request-validation.ts`, create/delete/PDF route'ları, `server-pdf.ts`, `site-config.ts` gerekirse. JSON stream 64 KiB+1'de erken durdurulur; byte hesabı UTF-8, iptal/releaseReader ve timeout, Content-Length yalanı testli.
- Üst seviye body exact allowlist; values yalnız belge alanları/string. Prototype anahtarı, nested object, null/array, uydurma sabit etiket açık ret; üç sabit etiket istemciden serbestçe tüm belgelere kabul edilmez. Generator'ın gerçek etiketleri korunur.
- Node runtime/maxDuration ve template/font tracing kurulu sürüme göre; render hatası path/stack/internal error mesajını kullanıcıya taşımaz. Public error `{code,message,requestCorrelationId}`; loglar token/form/proof içermeyen kategori+süre.
- JSON olmayan WAF 403/429/HTML, abort/offline, malformed API response, server 503 ayrımı. `Retry-After` gerçekten hesaplanır. Headerlar hata/405/HEAD dahil tutarlı. Çok uzun/bozuk view/manage token DB'ye gitmeden reddedilir.
- Bölüm 4.4 canonical/environment URL; production deployment hostu ile izole Preview ayrımı. İstemci `window.location.origin` ile server URL'sini yeniden yazmaz. DELETE manage auth korunur; cookie tek başına revoke hakkı vermez.

**Kapı:** N09/N12 ve F04/F12/F14/F15/F20/F27/F29 hedefli HTTP testleri, 64 KiB sınırı ve gerçek prod bundle asset listesi kontrolü. Sonraki: 07.

### ASAMA_07 — Yeni revizyon, kota ve hata durumlarıyla paylaşım penceresi

- `src/hooks/use-belge-share.ts`, `src/components/belge-paylasim/belge-share-dialog.tsx`, beş `*-studio.tsx` dar wiring. Başarı current snapshot fingerprint/revision ile ilişkili; eski link ve yeni form farkı görünür. **“Güncel belge için yeni bağlantı oluştur”** yolu her uygun durumda var; aynı snapshot mevcut linki ücretsiz kopyalayabilir, açıkça yeni bağımsız link de üretilebilir.
- İn-flight ref kilidi, generation/request kimliği, bounded timeout/abort ve stale-response koruması. Dialog kapamak backend'in kesin iptali sayılmaz. Başarılı cevap kaybolduysa aynı proof/request tekrarını kullan; kör yeni ID ile ikinci kota harcama. Reload recovery kaydı kişisel form içermez; form geri yüklenemiyorsa eski isteğin durumunu güvenli kurtar, farklı payload gönderme.
- `isReady` prop'u gerçekten kullanılsın veya yerine doğru revision/snapshot koşulu gelsin. Paylaşılacak değerler görünür güncel form snapshot'ı; debounce/inline draft/undo/restore geçişleri testli. Form POST tıklamasında bir kez dondurulur.
- Create, **aktif sonuç ekranındaki revoke**, geçmiş revoke ve copy hataları aynı görünür aria-live hata alanında. Clipboard izni yoksa readonly input seçimi + açık elle kopyalama mesajı. Başarı mevcut formu sıfırlamaz.
- Kota sunucudan; history.length kota değildir. Reserved durumu, WAF HTML, cookie-disabled, capacity 503, gerçek reset, sekme dönüşü/geceyarısı. Bilgi uyarısında teknik “snapshot/flatten” yerine anlaşılır metin; örnek/hassas alan tespiti form sözleşmesinden.
- 320 px dialog `min-w-0`, sarılabilen başlık/link alanı, uygun flex/grid, 44×44 işlemler; inputu kırpıp Kopyala'yı ekran dışında bırakma. Focus trap/Escape/restore, light/dark ve reduced-motion.

**Kapı:** browser B01/B02/B03 tekrarında artık gizli hata/eski sonuç kilidi/kırpılma yok; sözleşme ilk→ikinci link testi PASS; quota UI 2/50, iki farklı PDF içeriği. Sonraki: 08.

### ASAMA_08 — Kaybolmayan yönetim geçmişi ve eski storage migration'ı

- `local-link-registry.ts` ve gerekli IndexedDB helper/hook; bölüm 4.5'i uygula. Aktif sonuç kaydı failed storage yüzünden UI'da yok olmaz; depolama başarısı ayrıca raporlanır. Yeni geçmiş kaydı form/PDF içermez.
- Storage getter erişimi de try içinde; kalıcı storage yok/bozuksa render crash yok. İki sekme transactional upsert/revoke, stale event bir revoked kaydı active'e çeviremez. Liste tarih/expiry ile durum verir; doğrulanmamış server durumunu kesin active diye sunma.
- Legacy 20 kayıt restore → 4.500 aktif kayıt → sayfalı görünüm → 2 sekme eşzamanlı yazma/revoke → kesilmiş migration → restart senaryoları. Saklama yoksa kullanıcıya sonradan sürpriz yerine ön bilgi.

**Kapı:** yönetim anahtarı sessiz kaybı yok, 4.500 kayıt erişilebilir, N06 giderildi, quota cookie ile taslak izinleri ayrı. Sonraki: 09.

### ASAMA_09 — Temizlik kuyruğu, fiziksel byte ve gözlemlenebilirlik

- `cleanup.ts`, repository, blob-store ve cron route. Ready expired/revoked, failed upload/finalize, stale pending, orphan, tombstone ve byte reconciliation tek açık politika.
- Attempt lease reclaim ile orphan 24h grace ayrılır. Claim + owner/fencing; eski cron yeni lease sahibi işin sonucunu ezemez. `finalize` cleanup'ın kapattığı kaydı diriltemez. Başka prefix/ortamı DB satırı yanlış olsa dahi silme.
- SDK `cursor/hasMore` sözleşmesi, gerçek sayfalama yapan Memory adaptörü, bounded çok-batch, persist checkpoint, retry backoff/next_retry_at, deadline. 120/500/1000 kayıt ve listenin ilk sayfası hep aktifken sonraki orphan testi. Liste silinirken cursor skip ve cursor invalid/restart güvenliği.
- Tek cron çalışmasında 50'de durma; ölçülen günlük üretimden fazla cleanup kapasitesi ve backlog eritme kanıtı. Zaman sınırı ile yarım iş `incomplete/partial` olarak raporlanır. Hata varken `success:true` yasak; güvenli 5xx/partial sözleşmesi + sayısal metrikler. Vercel başarısız cron'u otomatik retry etmez; sonraki invocation/resume ve alarm prosedürü açık.
- Fiziksel silme belirsiz/hatalıysa bytes yükümlülüğü devam eder. Hata metnine raw SDK message/URL/secret yazma. Aggregate backlog, en yaşlı pending-delete, failed/partial counts, son başarılı cron zamanı, kapasite kullanımı.

**Kapı:** N05/N07/N10/F05/F21 kapanır; concurrent cron, timeout/restart, delete hatası, >limit pagination ve prefix koruması gerçek adaptör katmanında testli. Sonraki: 10.

### ASAMA_10 — Salt-okunur viewer, mobil geometri ve kaynak yaşam döngüsü

- `belge-share-viewer.tsx`; paylaşılan PDF.js loader/worker sahipliğini koru, Dokümantasyon motorunu kopyalama/yeniden yazma.
- Fetch AbortController, loadingTask destroy, document destroy, render cancel + promise settle, generation ID; async getPage sonrası stale kontrol. Aynı canvas çakışmaz; unmount yüklemeyi durdurur; paylaşılan worker tümden öldürülmez.
- Fit-width ve fit-page gerçek sayfa viewport ölçüsünden; 595.28 sabiti kalkar. Her boyutta erişilebilir sığdır, mobile pinch/pan, yön değişimi/ResizeObserver ve DPR. Zoom etiketi CSS gerçek gösterimiyle uyumlu; büyütülmüş sayfanın sol/üst bölgesi ulaşılabilir. Başlangıç mobilde uygun fit; min zoom fit'i engellemez.
- Ölçülmüş max backing canvas pixels/byte bütçesi; zoom arttıkça DPR'yi gerektiğinde sınırlayıp CSS boyutunu koru. Başarısız render boş canvas ile sessiz geçmez; erişilebilir retry. Son kullanım tarihi gerçek `initialExpiresAt`; yanlış her ziyaret “90 gün kaldı” anlamı yok.
- Klavye/erişilebilir isim/sayfa sayacı/aria-live/44px/light-dark/reduced-motion. Canvas-only içeriğin ekran okuyucuyla belge metnini okutmadığı açık sınırlama; kontrol erişilebilirliğini tüm belge içeriği erişilebilirliği diye sunma. Yeni aktif annotation/URI/scripting açma.

**Kapı:** 1/2 sayfa, hızlı 20 zoom+sayfa, 30 mount/unmount ve hata/retry ile kaynaklar artarak birikmiyor; 320/390/768/1366, DPR1/2/3, fit/pinch/pan, kırpılma ve boş render regresyonları PASS. Gerçek telefon testi yoksa manuel NOT_RUN. Sonraki: 11.

### ASAMA_11 — `/b` kabuğu, HTTP metadata ve erişim durumları

- `src/app/b/[token]/page.tsx`, root layout, middleware/proxy, next.config, robots ve PDF API. Ready/unknown/revoked/expired/pending/DB unavailable durumları açık ekran verir. DB 503'ü “belge yok” sayma. RevokedAt precedence **korunur** (Rev2 F32 için mevcut kodu gereksiz değiştirme).
- API: unknown404, expired/revoked410, pending425, storage502/503. HTML route için status seçeneklerini kurulu Next'e göre belgeleyerek gerçek testi yaz; JSX döndürüp HTTP410 kanıtladım deme. Bu planda HTML durum ekranı 200 olabilir; **PDF API 410 zorunlu**. Unknown için native notFound kullanılacaksa shell korunur.
- HEAD izin/status/expiry/metadata kontrol eder; Blob GET/stream açmaz. Range varsayılan 200 tam akış kalabilir; desteklemediğin 206/Accept-Ranges davranışı vaat etme. 200/4xx/5xx tümünde private no-store, no-referrer, noindex/noarchive, nosniff; HTML tokenı OG/analytics/log/referrer'a taşınmaz.
- Doğrudan, client navigation, geri/ileri, prefetch, reload, error boundary'de Navbar/Footer/GlobalOverlays yok; diğer rotalarda var. Route-group eklemek tek başına root chrome'u kaldırmaz. **Geniş site taşıması varsayılan değil**: önce en küçük doğrulanmış çözüm. Middleware→proxy geçişi gerekiyorsa kurulu rehbere göre; root headers() nedeniyle dinamikleşen sayfaları build raporuyla ölç, öneriyi ayrı kanıtla.

**Kapı:** F07 yeniden üretildi/düzeltildi veya kanıtlı NOT_REPRODUCED; header/HEAD/UI/normal site kabuğu testleri PASS. Sonraki: 12.

### ASAMA_12 — PDF içeriği, dosya adı ve beş stüdyo uyumu

- `belge-filename.ts`, `server-pdf.ts`, `pdf-engine.ts` yalnız gerekli yerler; 5 stüdyo ve mevcut approved fixtures. Her belge boş/örnek/Türkçe+uzun alan en az 3 fixture; sözleşme iki sayfa.
- Sunucu PDF `%PDF-`+boyut ile yetinmez: parse, beklenen sayfa sayısı, AcroForm=0; mevcut editable indir alanları >0. Renderlar aynı form içeriği/tarih/font/yerleşim, hayalet AP/DV yok; bütün binary'nin aynı olması beklenmez. Hatalı dosyayı Blob'a koyma.
- YİBF dosya adında **tam 7 rakam**; diğerleri ad parçasından atlanır, PDF'nin kullanıcı alanı ve düzenleme serbestliği bozulmaz. Tarih leap/invalid/Istanbul fallback, 100 karakter, unicode, örnek kişi/ad, explicit filename override, boş form isimleri.
- Share son an inline edit / debounce / undo / restore ile indir aynı güncel değerleri kullanıyor mu; değişen form için eski paylaşım baytları değişmiyor mu. Yeni şablon/font bağımlılığı ekleme; golden fixture'ı sırf test geçsin diye güncelleme.

**Kapı:** 5×3 PDF parity, alan/page count, filenames ve eski taslak/odak/form/yazdır davranışı PASS. Görsel karşılaştırma gerçek render kanıtı içerir. Sonraki: 13.

### ASAMA_13 — Bütünleşik yerel release kapısı

- Başarı sayısı değil gerçek test kapsamı; bölüm 6 matrisi eksiksiz. Gerçek PostgreSQL çok-bağlantı concurrency + izole Blob adapter, günlük hak/byte ve failure injection zorunlu. API mock'lu browser testi gerçek backend E2E yerine geçmez.
- Mevcut doğrulanmış komutlar: `npm run check:belgeler-pdf`; `npx tsc -p tsconfig.next.json --noEmit --incremental false`; değişen dosyalara `npx eslint <dosyalar>`; `npm run build`. `npm run check:tools` repo yerel release standardına göre. Genel TS/lint baseline farkı ayrıca raporlanır; yeni hata kabul edilmez.
- Mevcut share browser: `npx playwright test --config=playwright.site.config.ts tests/site-audit/belgeler-share-e2e.spec.ts --project=chromium-desktop-1366`. Testin mevcut **masaüstü dışını skip** kuralını düzelt; mobil komut exit0+5skip ise PASS yazma. Aynı dosyada mobile-320/mobile-390 hedeflerini gerçekten çalıştır; Safari/WebKit/Firefox için mevcut config'te proje yok, kontrollü test config'i oluştur veya açık NOT_RUN.
- Belgeler draft/inline-edit/field-focus/form-view mevcut ilgili regresyonları; Dokümantasyon `/p`, ana nav/footer ve PDF okuyucu smoke. Değişmeyen tüm CAD ağır paketini körlemesine tekrar çalıştırma, shared loader/shell etkisine göre seç.
- Production build **taze** artifact üzerine browser çalıştır; yalnız `.next` var diye eski build'i kabul etme, dev server'a gizli fallback yok. Build HEAD+worktree digest raporda.
- Kanıt/STATE ve yaşayan `docs/BELGELER_SISTEMI.md`, `DOK_STORAGE_CONTRACT.md`, `PROJECT.md` ilgili bölümler güncel; `.env.example` sözleşmesi net. Geçici logları, maskelenmemiş trace/tokenları final commit'e koyma.

**Kapı:** kritik işlev/güvenlik testleri PASS, açık P1 yok; fiziksel cihaz veya maliyet onayı gibi dış kapılar açıkça ayrılmış. **Çıktı:** ilk `FINAL_AUDIT.md`, yerel tamamlanma. Sonraki: 14.

### ASAMA_14 — Sürüm adayı, gerçek kapasite ve yayın hazırlığı

- Üretim deploy yapmadan kapasite raporu: gerçek PDF ortalama/p95/max; 1/5/10 aktif tarayıcı × üretim/gün ×90; physical+pending+deletion backlog; indirme/viewer GET/HEAD transferleri; mevcut plan ve tarihli fiyat kaynakları. Bütçe yoksa varsayım ile harcama artırma; sayısal seçenek hazırla, yalnız harcama kararı açık kalır.
- Preview/production ortamı, private store, secret **varlığı**, migration runner ve rollback uyumu, cron çalışma bütçesi, log redaction kontrolü. Eski deployment URL'lerinin eski POST/cron yazarak yeni kota/veri modelini delmesi riskini kapat: eski kod yazma yolu kapatılacak/protection veya deployment politikasıyla sınırlandırılacak; eski paylaşımların canonical/view erişimi korunacak. Destructive legacy migration yok.
- Yerelde gerçek Vercel runtime/asset tracing/Blob akışı kanıtlanmadıysa **tek izole Linux Preview/RC** gerekebilir. Production DB/Blob'a bağlanan “preview test” yapma. Build sistemi değiştiyse AGENTS'nin aynı SHA Linux READY/artifact promote koşulu uygulanır; normal git-main deploy ile artifact promote'u çifte production build'e çevirmeyen tek yayın yolunu seç ve yaz.
- Repo izin verdiği çalışma branch adı `internal-belgeler-paylasim-v3-20261023` uygun ve boşsa; mevcut kullanıcı branch'ini zorla değiştirme. `internal-*` deployment kapalı; sadece push preview üretir sanma. `[skip vercel]` etiketi tek başına sıfır build garantisi değildir. Remote write ancak somut RC gereği ve kapsamı varsa; ara checkpoint döngüsü yok.
- Güvenli rollback: migration additive kalır, create gerekirse kapatılır; mevcut read/revoke korunur. Eski insecure create sürümüne kör alias rollback yapma. Bilinen kritik smoke arızasının yolu yazılıdır.

**Kapı:** RC doğrulanmış, bütçe kararı/saklama kapasitesi yeterli, dış zorunlu testler tamamlanmış veya kullanıcı açıkça kapsamı değiştirmiş; STATE `YAYINA_HAZIR`. **Burada dur.** ASAMA_15 için açık kullanıcı **“yayınla”** komutu gerekir; olağan `devam` yayın başlatmaz. Bu ayrım mevcut kullanıcının bu sohbette yalnız plan istemesinden gelir.

### ASAMA_15 — Yalnız açık yayın komutuyla tek production release

- Önkoşul 14 PASS ve yayın yetkisi. Son diff/HEAD/main/remote; başka kullanıcı değişiklikleri korunur. Bir anlamlı atomic release, ara/main noop/docs-only takip push yok. Repo çalışma modeline ve 14'te seçilen yola uygun tek üretim yayını.
- Migration/secrets/env eski+yeniyi destekleyerek doğru sırada. Aynı commit/artifact, READY, canonical alias doğrulanır. READY sonrası gereksiz CLI/HTTP komut zinciri yok; kabul raporu için önceden belirlenmiş **tek bounded browser/API smoke** çalıştırılır. Kullanıcı bu smoke'u yayın yetkisiyle birlikte komut dosyasında yetkilendirir; repo kuralı ile çelişki oluşursa güncel açık kullanıcı talebi belirleyicidir.
- Canlıda 50/100/4500 yük testi veya toplu cron tetikleme yok. Sentetik sözleşme için ilk link→değişiklik→ikinci link→birinci iptal→ikinci içerik→ikinci iptal; gerekiyorsa diğer tipler için birer smoke. Yalnız kendi fixture'larını temizle. Mevcut kullanıcı linkini/testte görünmüş özel belgeyi değiştirme.
- Cron deploy/config ve izole başarılı purge kanıtını kaydet; ertesi günü bekleyerek oturumu açık tutma. Gelecekteki gerçek cron invocation henüz yoksa bunu `NOT_YET_OBSERVED` yaz; tamamlandı diye uydurma. Fiziksel dosya silme staging kanıtı zorunlu.
- Son STATE: deployment SHA/id, exact gate sonuçları, kalmış risk ve manual testler. Kritik smoke başarısızsa TAMAMLANDI değil `YAYIN_SORUNLU`; rollback/forward-fix sadece kanıtlı dar kapsamda.

**Kapı:** yeni üretim sürümü ve kullanıcı şikâyeti akışı çalışıyor; eski erişim/revoke korunuyor. `execution_status=TAMAMLANDI`, `next_stage=null`. Sonraki `devam` hiçbir işlem yapmaz.

## 6. Kabul matrisi — geçmeden tamamlandı denmeyecek

| Kimlik | Zorunlu senaryo | Aşama / kanıt |
|---|---|---|
| K01 | Görseldeki sözleşme ilk→ikinci link, değişen PDF, 2/50; eski link sabit | 07,13,15 browser + API |
| K02 | 1/49/50/51, 49+reserved, iki tab, aynı NAT iki browser | 03,05,13 gerçek SQL+browser |
| K03 | 100 farklı paralel ID; aynı ID 100 tekrar; iki DB bağlantısı/instance | 04,05,13; 50'yi aşan başarı=FAIL |
| K04 | Istanbul 23:59:59→00:00, gece yarısını geçen render, yanlış cihaz saati | 05,07 fake DB clock + UI |
| K05 | Render fail, PUT başarılı/finalize fail, commit sonrası yanıt kaybı, double refund | 04–06,09,13 |
| K06 | Yanlış proof/owner, legacy replay, GC sonrası aynı ID, geç finalize | 04; eski token hiçbir yeni içeriği açmaz |
| K07 | 64KiB±1 UTF8 chunked, slow/aborted body, unknown top/field, forged Origin | 06 bounded-stream + HTTP |
| K08 | Prod secret/DB/Blob/schema yok, NODE_ENV production/nonVercel, env mismatch | 02,06,14 fail-closed |
| K09 | GET/HEAD metadata/expiry; HEAD blob.get=0; headers tüm statülerde | 06,11 |
| K10 | 90gün sınırı−1ms/0/+1ms, revoke, purged reason, tombstone expiry | 04,09,11 |
| K11 | 51/120/500/1000 kayıt, ilk sayfa aktif, orphan ilerleme, failed PUT, iki cron | 09; count/byte+prefix+deadline |
| K12 | cleanup throughput üretimi karşılıyor; sürekli delete hatası diğerlerini aç bırakmıyor | 09,14 yük+backlog raporu |
| K13 | Storage getter exception, IDB denied/full, 4500 aktif, 2tab, migration interruption | 08; sıfır sessiz anahtar kaybı |
| K14 | Create/revoke/copy hata her ekranda görünür; WAF HTML yanlış quota olmaz | 07; B01 regresyon |
| K15 | 320/360/390/414/430/768/1024/1366/1920 genişlik, light/dark, %150/%200 | 07,10,13 taşma/hitbox/focus |
| K16 | Fit width/page, 2page, 20 zoom, DPR1/2/3, mount/unmount/retry, pinch | 10,13 piksel/geometri/kaynak |
| K17 | Beş belge ×3 fixture: editable>0, flatten0, sayfa/metin/render; isim/YIBF | 12,13 |
| K18 | `/b` tüm durumlar + SPA/back/reload/prefetch; normal sayfa chrome korunur | 11,13 |
| K19 | Taze prod build E2E, private Blob + gerçek SQL, Linux artifact varsa aynı SHA | 13,14 |
| K20 | Eski link/read/revoke, eski deploy writer, forward/rollback şema uyumu | 02,04,14,15 |
| K21 | Log/trace/metadata/referrer'da view/manage/proof/PII yok; telemetry agregat | 06,09,11,13,14 |
| K22 | Sadece izinli sentetik canlı smoke; unauthorized cron401; 50lik test canlıda yok | 15 |

Matriste ilgili mevcut test yoksa anlamlı regresyon ekle; yalnız source string araması veya config sabiti equality'sini davranış kanıtı sayma. Baseline probu bug'ı gözleyip exit0 verebilir; düzeltmenin testinde **beklenen güvenli sonuç assertion** olmalı.

## 7. Test süreçleri, bitiş ve sonraki denetim

Repo takılma kuralını uygula: standalone scriptlerde try/finally browser.close, doğru exit code, küçük selector timeout; her uzun subprocess için duvar saati sınırı ve yalnız kendi process tree'sini durdurma. Bu ortamda `schedule/manage_task` aracı yoksa eşdeğer watchdog'u uygula ve belgeye yaz; varmış gibi çağrı uydurma. Windows'ta yalnız `curl.exe --max-time`, çıplak curl yok. Test runner timeout başlangıç önerisi unit180sn, browser dosyası300sn, build600sn; gerçek baseline'a göre gerekçeli ayarlanabilir, sonsuz bekleme yok.

STATE'te her testin komutu, tarih, HEAD+diff digest, ortam/adaptör, exit code, test/pass/fail/skip, log yolu ve bulgu kimliği bulunur. Üretim tokenı/proof/URL'sini trace'e kaydetme; sentetik credentialları bile kullanıcı raporlarında maskeli tut. `TAMAMLANDI` yalnız 15 başarılıysa; yerel bitiş ayrı `YEREL_TAMAMLANDI`, yayın bekleme `YAYINA_HAZIR`.

Sonraki bağımsız kontrol için kullanıcı şu dört şeyi verir: bu V3 planı, güncel V3 STATE, `docs/belgeler-paylasim-v3-uygulama/FINAL_AUDIT.md`, uygulanan HEAD/diff. Denetleyen ajan PASS metinlerine güvenmekle yetinmez; özellikle K01–K13 ve eski bağlantı uyumunu yeniden kontrol eder.
