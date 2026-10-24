# ASAMA_01 — Başlangıç envanteri ve test izolasyonu

Tarih: 23 Ekim 2026 (Europe/Istanbul)  
Sonuç: **PASS — ASAMA_01 kapandı; ASAMA_02 sıradaki aşama.**  
Kapsam: yalnız başlangıç envanteri, kanıt ve test altyapısı. Ürün kaynağı, DB, Blob, GitHub ve deployment değiştirilmedi.

## Başlangıç noktası

- Branch: `main`.
- HEAD, yerel `main` ve mevcut `origin/main` ref'i: `04048e50fd02e50c1c9ea783acec2d7383f516b4`. Remote fetch yapılmadı; `origin/main` sunucudaki güncel HEAD için kanıt sayılmaz.
- İlk çalışma ağacında izlenen dosya değişikliği yoktu. V3 plan/state/komutları ve bağımsız denetim klasörü kullanıcı tarafından sağlanmış, git'e eklenmemiş dosyalardı; korundular. Bu aşamada `PLAN/...STATE...md` ile yeni `docs/belgeler-paylasim-v3-uygulama/` kanıtları güncellendi/oluşturuldu.
- İzlenen dosyaların `git diff --binary HEAD` özeti boştu: SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, 0 bayt, 0 izlenen değişiklik. Ürün kaynakları başlangıç HEAD'inde kaldı.
- Push veya deploy yapılmadı. Stage 01 README/helper/test kanıtları da commit edilmedi.

## Araçlar, bağımlılıklar ve migration sırası

- Node `v24.15.0`; npm `11.12.1`; `package-lock.json` mevcut (633.518 bayt).
- Next `16.4.2`, TypeScript `5.9.3`, tsx `4.23.15`, `@neondatabase/serverless` `1.1.0`, `@vercel/blob` `2.8.0`, Playwright `1.62.1` (lockfile).
- Repo'da Belgeler paylaşımı için ayrı npm test script'i yok. Hedefli grup audit runner'ındaki 7 test dosyasıyla çalıştırılır. Genel `check:belgeler-pdf` daha geniş bir zincirdir; ASAMA_01 için çağrılmadı.
- Bulunan migration dosyaları sıralı: `001_dokumantasyon_base.sql`, `002_upload_integrity.sql`, `004_cad_aps_derivatives.sql`, `005_belge_paylasim.sql`. Son ve paylaşım modülüne ait migration `005`; `003` dosyası yok. Bu aşamada migration uygulanmadı.

## ENV varlığı ve güvenli test sınırı

- `.env.local` içinden yalnız anahtar adları çıkarıldı; **değerler incelenmedi, görüntülenmedi veya kayda alınmadı**. `DATABASE_URL`, `POSTGRES_URL`, `BLOB_READ_WRITE_TOKEN`, `BELGE_SHARE_SECRET` ve `CRON_SECRET` adları bu dosyada yok. `VERCEL_OIDC_TOKEN` anahtarı mevcut; değerine erişilmedi. `.env.example` bu değişken adlarını örnek/placeholder olarak içeriyor.
- Başlangıç process environment'ında veritabanı/Blob/Neon/Vercel/paylaşım/cron secret anahtarı yoktu. Test runner ayrıca bunları ve `NODE_OPTIONS`/`NODE_PATH` adlarını child process'ten kaldırıp `NODE_ENV=test` ayarlıyor. Çıktıya yalnız kaldırılan değişken adları yazılır; değer yazılmaz.
- Hedef test kaynaklarında `.env.local`/dotenv yüklemesi bulunmadı. API, servis, cleanup ve viewer testleri her test öncesi `MemoryBelgePaylasimRepository` ve `MemoryBelgeBlobStore` enjekte ediyor; client testleri sahte localStorage, UI/filename testleri yerel girdiler kullanıyor. Test process'i canlı Neon/Blob'a yönlendirilmedi.
- Runner'lar 180 saniyelik duvar saati sınırı taşır; Windows'ta timeout olursa yalnız kendi child process ağacını `taskkill /T /F` ile kapatır. Browser başlatılmadı.

## Taze baseline ve doğrulamalar

| Kontrol | Sonuç | Kanıt |
|---|---|---|
| Hedefli Belgeler paylaşımı testleri | **PASS** — 108 test, 37 suite, 108 geçti, 0 başarısız, 0 skip, exit 0; yaklaşık 1,96 sn. Bu, bu aşamada gerçekten yeniden çalıştırılan sonuçtur. | [ASAMA_01_baseline.tap](ASAMA_01_baseline.tap), [ASAMA_01_baseline.json](ASAMA_01_baseline.json) |
| Runtime TypeScript | **PASS** — `tsconfig.next.json`, `--noEmit --incremental false`, exit 0; yaklaşık 20,26 sn. | [ASAMA_01_runtime-tsc.log](ASAMA_01_runtime-tsc.log), [ASAMA_01_runtime-tsc.json](ASAMA_01_runtime-tsc.json) |
| Bu aşamada eklenen `.mjs` kanıt runner'ları için ESLint | **PASS** — 3 dosya, exit 0; yaklaşık 3,49 sn. | [ASAMA_01_lint.log](ASAMA_01_lint.log), [ASAMA_01_lint.json](ASAMA_01_lint.json) |
| Production build | **NOT_RUN** — bu aşamada ürün kodu değişmedi; V3 planı gerekiyorsa build'i ASAMA_13'e bırakıyor. | Plan gereği ertelendi |
| Ürün dosyalarında lint | **NOT_RUN / uygulanabilir değişiklik yok** — ürün kaynaklarında değişiklik yapılmadı. | Git diff: 0 izlenen değişiklik |

Taze baseline komutu: `node docs/belgeler-paylasim-v3-uygulama/run-stage01-tests.mjs`. Test grubu 7 dosyadır: filename, share-api, share-cleanup, share-client, share-server, share-ui ve share-viewer. TSC ve lint de ayrı, aynı 180 saniye sınırı/ENV temizliği olan runner'larla çalıştırıldı.

Bağımsız denetimdeki **108 test / 13 tanı probu / 3 browser mock probu** yalnız tarihsel kanıttır. Bu aşamada 108 test ayrıca taze çalıştırıldı; 13 tanı probu ve 3 browser mock probu tekrar çalıştırılmadı. Önceki browser probu gerçek UI ile taklit paylaşım API'si kullanır, gerçek backend kanıtı değildir. Eski probe sonuçları fix kabul testi veya bu aşamada yeni PASS olarak sunulmaz.

## İzole entegrasyon ve fiziksel cihaz kapısı

- **Gerçek PostgreSQL yarış testi: NOT_RUN / açık dış kapı.** `.env.local` ve process environment'da test DB bağlantısı yok; Docker ve `psql` CLI bulunmuyor. İleride yalnız disposable/ayrı PostgreSQL instance veya DB üzerinde, production'dan ayrılmış kimlik bilgileriyle ve en az iki gerçek bağlantı/instance ile çalıştırılmalı. Neon HTTP transaction semantiği ayrıca doğrulanmalı; Memory sonucu PostgreSQL atomikliği sayılmamalı.
- **Private Blob/Vercel runtime testi: NOT_RUN / açık dış kapı.** `BLOB_READ_WRITE_TOKEN` ve test store konfigürasyonu yok. İleride yalnız ayrı private test store/prefix ve izole deployment environment ile gerçek PUT/GET/DELETE/cleanup doğrulanmalı; üretim verisi kullanılmamalı.
- **Fiziksel cihaz: NOT_RUN.** `adb` mevcut ancak bağlı Android cihaz sayısı 0. `idevice_id` aracı bulunamadığından iOS fiziksel cihaz durumu doğrulanamadı. Mobil kabul gerektiğinde gerçek cihaz erişimi ayrıca sağlanmalı.
- Bu dış kapılar ASAMA_01'in yerel baseline/isolation kapısını engellemez; V3'ün release aşamalarında açık kalır.

## Aşama özeti ve durma noktası

- Başlangıç HEAD/diff, runtime sürümleri, package/test komutu, migration sırası ve ENV adlarının varlığı kaydedildi.
- Tarihsel ve taze test sınıfları ayrıldı; gerçek backend/cihaz kapsamı olduğundan fazla sunulmadı.
- `F01–F32`, `N01–N18` ve `B01–B03` eşlemesi güncel V3 STATE'e taşındı. F32 mevcut `revokedAt` önceliği nedeniyle `NOT_A_BUG_CURRENT_CODE`; F07 `NOT_REPRODUCED / NOT_RUN` kaldı.
- STATE'in YAML bloğu `js-yaml` ile parse edildi; eşleme satırları 32 F, 18 N ve 3 B olarak doğrulandı.
- Yeni bulgu yok; bu aşamada hiçbir ürün bulgusu kapatılmadı.
- **Sonraki aşama: ASAMA_02. Burada duruldu; ASAMA_02 başlatılmadı.**
