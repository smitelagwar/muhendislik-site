# Dokümantasyon depolama sözleşmesi

| Konu | Bağlayıcı davranış |
| --- | --- |
| Metadata otoritesi | Üretimde Neon `dok_files`; yalnız açık yerel geliştirme modunda yerel JSON kayıtları. |
| Nesne otoritesi | Üretimde Vercel Private Blob (`dok_storage/`); üretimde yerel disk yasaktır. |
| Upload intent | Admin ve same-origin denetiminden sonra UUID pathname, boyut, dosya adı ve klasörü bağlayan, 30 dakikalık imzalı intent. Dayanıklı modda intent ledger'a yazılamazsa upload başlamaz. |
| Finalize / webhook | Vercel imzalı `blob.upload-completed` callback'i Blob'u yeniden okur, boyut ve magic-byte doğrular, sonra pathname unique anahtarıyla metadata kaydını idempotent oluşturur. |
| Erişim URL'si | Admin URL'si imzalı Private Blob GET/HEAD (varsayılan 60 dk); public paylaşım URL'si 3 dk. URL'ler API yanıtlarında `private, no-store` ile verilir. |
| Silme | İlk silme soft-delete'dir. Kalıcı silme Blob'u önce siler; Blob silinemiyorsa DB kaydı tutulur ve `purge_status=failed` ile yeniden denenebilir. Blob silinip DB silinemezse reconcile kırık metadata olarak raporlar. |
| Reconcile | Tek yetkili araç `npm run reconcile:dokumantasyon`. Varsayılan salt rapordur; DB/Blob/intent durumlarını sınıflar. `--delete-safe-orphans` yalnız 24 saatlik grace süresini geçen, aktif intent'i olmayan orphan nesneleri siler. |
| Backup | `npm run backup:dokumantasyon` Neon metadata ve paylaşım snapshotlarını operatörün yerel `backups/dokumantasyon/` alanına alır; Blob kopyası üretmez. |

## Sağlayıcı kararı

Bu panelin hedefi harici Drive/MEGA/Yandex dosyalarını yönetmek değil, onların dosya yöneticisi UX niteliklerini bu hizmetin Vercel Blob + Neon alanında sağlamaktır. Bu nedenle provider abstraction ve provider pilotu eklenmedi. Gerçek bir harici-depo gereksinimi oluşursa önce ayrı bir karar kaydı, capability modeli ve yalnız bir pilot gerekir.

## Üretim yapılandırması

Dayanıklı akış için uygulama ortamında `DATABASE_URL` (veya desteklenen Postgres eşdeğeri), `BLOB_STORE_ID` ve `BLOB_WEBHOOK_PUBLIC_KEY` gerekir. Değerleri bu repoda tutulmaz veya üretilmez.

## CAD V2 sahne nesneleri — aday uygulama durumu (17 Ekim 2026)

Bu bölüm `PLAN/DWG_DXF_MOTOR_V2_GPT_6_LUNA_EXTRA_HIGH_PLANI.md` kapsamındaki `src/lib/cad-v2` adayını tarif eder; production storage sözleşmesinin veya cutover kabulünün yerine geçmez.

- Her publish attempt'i immutable bir generation prefix'ine chunk, index ve metadata nesnelerini yazar; byte uzunluğu, hash ve beklenen nesne kümeleri doğrulanmadan manifest commit pointer'ı yayımlanmaz.
- Upload hatası işi `ready` yapmaz. Vercel'de kalıcı Blob yapılandırması yoksa yerel diske sessizce düşüp kalıcı başarı bildirilmez. Vercel OIDC/store seçimi ve local/CLI token seçimi ayrı davranış testleriyle kapsanır.
- Candidate worktree artık `CadV2DurableRepository` ile Neon `getDb()` adaptörünü, TEXT public ID'leri, client-request idempotency index'ini ve koşullu DB `READY` pointer'ını içerir. `001_durable_repository.sql` UUID ID'lerini veri/FK değerlerini koruyarak TEXT'e geçirir; nesne kümesi doğrulanmayan eski sahneleri `legacy_unverified` durumuna alır. Migration bu ortamda production veya Preview veritabanına uygulanmadı.
- Her immutable Blob generation yazımı DB lease'i almadan başlayamaz; publisher her nesneden önce owner/fence/expiry kontrolüyle lease yeniler ve DB READY transaction'ı bu lease'i `published` ile kapatır. `002_publish_lease_reconcile.sql`, `cad_v2_publish_leases` tablosunu ve expiry indeksini ekler.
- `tests/cad-v2/durable-repository.test.ts` PGlite PostgreSQL motoruyla fresh/legacy schema, idempotency, 10 concurrent repository prepare'in tek aktif işe bağlanması, exact object set + READY atomikliği, rollback, child-process A/B/C, ayrı servis örneğinden cold Blob read ve chunk/index/metadata/manifest hata enjeksiyonlarını sınar. `prepare-chunk-404-repro.test.ts` ayrıca persistent PGlite DB üzerinde gerçek admin/public HTTP route'larını ayrı publisher/retry/cold-reader süreçleriyle açıp kapatarak pozitif manifest/chunk/index/metadata/job cold-share ve yabancı/expired/revoked/parolalı share + heartbeat/DELETE retlerini sınar.
- `publish-lease-reconcile.test.ts` rapor modunun salt-okunur olmasını; canlı viewer lease'inin temizliği durdurmasını; stale attempt'in fence edilip `expired`, staging scene'in `orphaned` olmasını; grace, retry ve geç gelen object davranışını; READY pointer/object set'in korunmasını PGlite + bellek içi Blob store ile doğrular. `npm run reconcile:cad-v2` varsayılan olarak yalnız rapor üretir; iki aşamalı açık teyit olmadan silmez. Operasyon adımları `docs/cad-v2/storage-reconcile-runbook.md` içindedir. Bu testler Neon/Private Blob canlı kabulü değildir.
- Açık L03 kabulü: izole Neon/Private Blob test hedefinde migration, bağlantı ve bağımsız-process eşzamanlılık/cold-read kabulü. Üretimde prepare veya DB migration çalıştırılmadı.
- Üretim erişimi için Blob nesnelerini veya kullanıcı verisini testlerde kullanma; her fault/cold-reader kabulü run-level izole test store ve veri alanı kullanmalıdır.
