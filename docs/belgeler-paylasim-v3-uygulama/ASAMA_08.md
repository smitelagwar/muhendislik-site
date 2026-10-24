# ASAMA_08 — Kalıcı yönetim geçmişi ve eski storage migration'ı

**Sonuç: PASS (yerel kapı).** 2026-10-23, Europe/Istanbul. HEAD: `04048e50fd02e50c1c9ea783acec2d7383f516b4`.

## Uygulama

- **N06 Depolama Getter Hata Koruması:** `getSafeLocalStorage()` ve `getSafeIndexedDB()`, tarayıcı güvenlik kısıtlamaları (Safari gizli mod, çerez engeli veya depolama reddi) altında getter seviyesinde fırlatılan SecurityError / DOMException istisnalarını `try...catch` ile yakalar; uygulamanın çökmesi engellendi.
- **F31 & 4.500 Aktif Kayıt Koruması:** Önceki sürümlerdeki 20 kayıtlık kesme sınırı (`MAX_STORED_LINKS = 20`) tamamen kaldırıldı. Aktif yönetim anahtarları hiçbir sayısal sınırla sessizce atılmaz. 4.500 aktif bağlantının depolanması ve sorgulanması desteklendi.
- **Sayfalı Arayüz ve DOM Koruması:** `belge-share-dialog.tsx` bileşeninde 4.500 kaydın aynı anda DOM'a basılmasını önlemek amacıyla 10'luk sayfalı görünüm (`pagedHistoryLinks`) ve "Önceki" / "Sonraki" sayfalama kontrolleri eklendi.
- **Eski Depolama Geçişi (Legacy Migration):** `migrateLegacyLocalStorage`, `localStorage` üzerindeki `belge_paylasim_user_registry_v1` verisini IndexedDB `links` tablosuna aktarır. Kural gereği kalıcı yazma IndexedDB transaction `oncomplete` ile doğrulanmadan eski localStorage verisi silinmez; kesintiye uğrayan veya başarısız olan aktarımlarda veri kaybı yaşanmaz ve işlem güvenle yeniden çalıştırılabilir.
- **İki Sekme Yarışı ve Stale Event Koruması:** `BroadcastChannel` eşitlemesi ve IndexedDB transaction seviyesinde var olan `revokedAt` damgası korunur. Başka bir sekmeden veya gecikmiş bir olaydan gelen un-revoked durumdaki kayıt, iptal edilmiş bir bağlantıyı asla tekrar 'aktif' yapamaz.
- **Doğrulanmamış Sunucu Durumu Ayrımı:** Sunucudan anlık teyit alınmamış kayıtlar yanıltıcı biçimde "Aktif" olarak gösterilmez; arayüzde "Cihazda kayıtlı", "Süresi doldu" veya "İptal edildi" durumları ve son geçerlilik tarihi gösterilir.
- **Kalıcı Saklama Hatasında Aktif Sonuç Koruması:** Depolama hatası oluşsa bile oluşturulan aktif bağlantı (`activeLink`) React durumunda korunur, kopyalama ve mevcut oturumda iptal işlemleri çalışır; kullanıcıya kalıcı hafızaya kaydedilemediğine dair bilgilendirici uyarı gösterilir. Kayıt defterinde hiçbir ham form verisi veya PDF baytı saklanmaz.

## Doğrulama

- `node docs/belgeler-paylasim-v3-uygulama/run-stage08-tests.mjs` — **176/176 PASS**, 48 suite, **0 FAIL, 0 SKIP**; izole test adaptörleri.
- `node docs/belgeler-paylasim-v3-uygulama/run-stage08-runtime-tsc.mjs` — **PASS**, exit 0.
- `node docs/belgeler-paylasim-v3-uygulama/run-stage08-lint.mjs` — **PASS**, exit 0.
- `git diff --check` — **PASS**, exit 0.

Komut ve test çıktıları `ASAMA_08_*.json`, `.log` ve `.tap` dosyalarındadır. `ASAMA_08_changes.json`, bu aşamanın değişen dosyaları için SHA-256 manifestidir.

## Kalan kapılar ve sınırlar

- Gerçek Neon / PostgreSQL çok-bağlantı concurrency, Vercel private Blob / runtime ve platform WAF testleri henüz çalıştırılmadı.
- Fiziksel Android/iOS kabulü ve harici tarayıcı testleri release kapılarına açık bırakılmıştır.
- Production build V3 planı gereği ASAMA_13 kapısındadır.
- ASAMA_09 başlatılmadı. Remote fetch/write, commit, push ve deployment yapılmadı.

Sonraki tek aşama **ASAMA_09**'dur.
