# ASAMA_09 — Temizlik kuyruğu, fiziksel byte ve gözlemlenebilirlik

**Sonuç: PASS (yerel kapı).** 2026-10-23, Europe/Istanbul. HEAD: `04048e50fd02e50c1c9ea783acec2d7383f516b4`.

## Uygulama

- Migration `009_belge_paylasim_cleanup_queue.sql`, tekil kalıcı cleanup run lease'i, artan lease version/fencing, Blob sayfalama cursor/checkpoint'i ve byte obligation cleanup lease/retry alanlarını ekler. SQL fonksiyonları checkpoint, orphan kaydı, claim/complete/fail ve tombstone purge işlemlerini run owner/version ile fence eder.
- Blob adaptörü güvenli `belge_paylasim/` öneki içinde cursor/hasMore ile sıralı sayfalama yapar ve SDK işlemlerine AbortSignal aktarır. Cleanup tam liste taraması bitmeden fiziksel silme başlatmaz; invalid cursor bir kez sıfırlanıp güvenli biçimde yeniden taranır.
- Cleanup 45 saniyelik varsayılan deadline, 100 kayıtlık sayfa/batch, 8 saniyelik liste/silme timeout'u ve 90 saniyelik run/obligation lease'i kullanır. Başarısız silim byte borcunu koruyup artan retry backoff'a girer. Lease'i bitmiş `pending` attempt `failed/unknown` durumuna taşınır ve belirsiz byte ek 24 saat tutulur.
- Cron yanıtı hatalı/kısmi çalışma için `success:false` ve HTTP 503, çalışan başka run için HTTP 409 verir. Ham SDK mesajı/URL/secret yanıta aktarılmaz. Due backlog aktif eski obligation lease'i yüzünden işlenemediğinde metrik ve sonuç `partial` olur.
- Metrikler pending/due/leased/failed sayısı, pending byte, cleanup isteğinin en eski zamanı, son başarılı çalışma, toplam byte yükümlülüğü ve kapasite kullanım oranını taşır. `cleanup_requested_at`, eski bir PDF'nin yalnızca 90 günlük ömrü nedeniyle temizlik kuyruğu yaşı yanlış gösterilmesin diye kullanılır.

## Doğrulama

- `node docs/belgeler-paylasim-v3-uygulama/run-stage09-tests.mjs` — ilgili paylaşım regresyonları ve ASAMA_02–09 testleri: **191/191 PASS**, 49 suite, 0 fail, 0 skip; 38.017 ms. Test süresi sınırı 180 saniyedir; DB/Blob/Vercel/secret değişkenleri alt süreçten kaldırılır.
- Stage09 kapsamı Memory ve PGlite/Neon-adapter ile 120/500/1.000 yetim pagination, ilk sayfada aktif kayıt, deadline/checkpoint/restart, invalid cursor, eşzamanlı cron, stale lease fencing, failed PUT cleanup, finalize sonrası dirilme engeli, 24 saat unknown grace, delete retry, HTTP 503 ve prefix korumasını içerir.
- PGlite + Memory Blob sentetik koşusunda 1.000 orphan 51 sayfada **1.105 ms** içinde işlendi; limit 30.000 ms. Bu değer gerçek Neon/Vercel Blob throughput iddiası değildir.
- `node docs/belgeler-paylasim-v3-uygulama/run-stage09-runtime-tsc.mjs` — `tsconfig.next.json` runtime TypeScript: PASS (final koşu sonucu `ASAMA_09_runtime-tsc.json` içinde).
- `node docs/belgeler-paylasim-v3-uygulama/run-stage09-lint.mjs` — cleanup kaynakları, migration harness testleri ve evidence runner lint'i: PASS. 0 error, 2 warning (`repository.ts` kullanımsız DB hesaplı lease parametresi; mevcut stage03 test stub'ı).
- `node docs/belgeler-paylasim-v3-uygulama/run-stage09-diff-check.mjs` — tracked `git diff --check` ve yeni aşama dosyalarında trailing whitespace denetimi: PASS.
- `node docs/belgeler-paylasim-v3-uygulama/run-stage09-manifest.mjs` — aşama girdileri/kanıtları için sıralı SHA-256 manifestini üretir (`ASAMA_09_changes.json`). Manifest STATE dosyasını ve kendisini dışarıda tutar.

## Kapanan bulgular ve sınırlar

- Yerel V3 kapısında F05 pagination/retry, N05 failed-upload byte/orphan temizliği, N07 hata→503 sözleşmesi, N10 sabit 50 kayıt sınırı kaynaklı backlog ve F21 cleanup yaşam döngüsü tekrar doğrulandı. N11 geç finalize'ın terminal `failed` kaydı diriltmediği SQL adapter testiyle doğrulandı.
- Gerçek Neon ayrı bağlantı concurrency, özel Vercel Blob/runtime, gerçek günlük production üretim hacmi ve fiyat/kapasite hedefi, eski deployment writer/cron uyumu ve fiziksel cihaz kapıları NOT_RUN olarak kalır. Bunlar production veya dış servis kanıtı olarak sunulmamıştır.
- Remote fetch/write, commit, push, deployment ve canlı cron çalıştırması yapılmadı.

Sonraki tek aşama **ASAMA_10**'dur.
