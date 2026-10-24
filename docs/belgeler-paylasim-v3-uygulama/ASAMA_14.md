# ASAMA_14 — Kapasite, RC ve yayın hazırlığı

**Durum: PASS / YAYINA_HAZIR (2026-10-24).** Önceki engel kayıtları [ASAMA_14_history.md](ASAMA_14_history.md) içinde korunmuştur. Son dashboard doğrulaması ve seçilen kapasite bu raporda geçerlidir.

## Doğrulanan sonuçlar

- İzole Vercel Linux Preview RC build READY ve K01/K02 1/1 PASS; masaüstü Firefox/WebKit gerçek Development akışı 2/2 PASS. Stage13 gerçek Neon ayrı bağlantı yarışları, private Blob ve PDF kapıları PASS.
- Production Neon dashboard salt-okunur sorguları: mevcut 005 şeması, 6 link, 2 aktif link / 2.456.130 byte; pending, expired-not-purged, revoked-not-purged ve aktif lease sayıları 0. DB boyutu 9.658.368 byte. Hiçbir Production DDL/DML bu aşamada çalışmadı; bağlantı sırları okunmadı.
- Son 30 günde 6 link, tarihsel günlük tepe 4; gerçek PDF ortalaması 1.259.110,17 byte, p95/max 1.283.900 byte. Fixture kapasite tabloları ve 21/21 aritmetik kontrolü önceki kanıtlarda korunur.
- Vercel Hobby ve Neon Free doğrulandı. Yeni ücretli plan açılmadı. Production Blob dashboard: 54,7 MB storage; 277/2000 advanced işlem; 183/10000 simple işlem; 312 MB/10 GB transfer. Bunlar store toplamlarıdır, rota bazında GET/HEAD sayısı değildir. Billing API 404 sonucu sıfır fatura olarak yorumlanmadı.

## Uygulanan kapasite ve izolasyon

- Production/Preview env: global 50 yeni link/gün ve 600.000.000 byte fiziksel paylaşım yükümlülüğü sınırı kaydedildi. Tarayıcı başına İstanbul gününde 50 kota ve mevcut linklerin 90 günlük süresi korunur.
- Mevcut hız 6/30 gün için 90 günlük 18 belge, her biri 3 MiB olsa 56.623.104 byte eder. Seçilen 600 MB bütçe bu gözlenen kullanım için yeterlidir; sürekli 50/gün ×90 gün tam yük Hobby kapsamında desteklenmez. Kapasite dolduğunda yeni create 503 verir; saklama süresi kısaltılmaz.
- Neon bağlantısında Preview için otomatik ayrı DB branch oluşturma açıldı, Production branch oluşturma kapalı tutuldu; ayar kaydedilip yeniden açılarak doğrulandı.
- Production private Blob yalnız production ortamına, ayrı private Preview store yalnız preview ortamına bağlandı. API bağlantı hedeflerini doğruladı.
- Önceki başarısız denemeden kalan tek sentetik Preview PDF dashboard üzerinden planın fixture temizliği kapsamında silindi; klasör boş. Bu store artık kalıcı Preview izolasyonu için tutuluyor.

## Kalan açık doğrulamalar ve kapsam

Kullanıcı, ek kaynak sağlamadan mevcut imkânlarla tamamlanmasını ve yayınlanmasını, önceki eksik cihaz raporundan sonra açıkça istedi. Fiziksel Android/iOS kabulü **NOT_RUN** olarak manuel risk kaydında kalır; masaüstü WebKit sonucu fiziksel iOS testi olarak etiketlenmez. Production toplu yük/cron testi çalıştırılmaz. Gerçek backlog 0; yüksek hacim throughput garantisi seçilen ölçülmüş-kullanım Hobby kapasitesine eklenmez.

Eski generated deployment URL'leri Vercel SSO korumasında; anonim erişim engelli. Yetkili operatör erişimi ayrı bir ayrıcalıktır. Eski güvensiz create sürümüne kör rollback yapılmaz. F09 uzun metin okunabilirliği P2 notu korunur.

## Tek yayın yolu

ASAMA_15: 006–009 additive migration → altı eski satır ve iki aktif linkin korunmasını doğrula → internal-* branch üzerinde tek kaynak checkpoint → tek staged Production build (--skip-domain) → READY → aynı Production artifact promote → canonical alias üzerinde yalnız iki sentetik sözleşmeli bounded smoke → own-fixture revoke. Git main push ile ikinci build üretilmez. Gelecekteki cron invocation henüz görülmediyse NOT_YET_OBSERVED yazılır.

Ayrıntılı makine kanıtı: [ASAMA_14_release_readiness.json](ASAMA_14_release_readiness.json).
