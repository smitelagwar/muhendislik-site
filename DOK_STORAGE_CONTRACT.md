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
