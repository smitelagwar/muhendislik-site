# ASAMA_02 — Uyumlu migration ve runtime adaptörü

**Durum: PASS** · 23 Ekim 2026 · Repo HEAD: `04048e50fd02e50c1c9ea783acec2d7383f516b4`

Ürün/migration/test kaynakları için SHA-256 envanter özeti: `45327afcbb9bf636c2aeb87090b617c8b8200a746ac1f07c57cb203d5d371bee` (`ASAMA_02_changes.json`).

## Yapılanlar

- `005_belge_paylasim.sql` değiştirilmedi. Yeni `006_belge_paylasim_v3_runtime.sql` legacy linklere nullable/versioned owner, request/proof/token, nonce, attempt/lease, `ready_at`, quota accounting ve purge alanları ekliyor.
- `belge_paylasim_daily_quotas` ortam + owner hash + İstanbul gün anahtarı için unique satır, link/byte sayaçlarında nonnegative CHECK kısıtları sağlıyor. `belge_paylasim_blob_obligations` her fiziksel nesnenin byte borcunu tombstone GC sonrasında da tutuyor; store ortamı, retry zamanı, hata nedeni ve attempt bilgisi için indeksli.
- Şema sürümü 6 idempotent upsert ile işaretleniyor. Eski linklere owner/proof/nonce atanmıyor; token hash'leri ve `expires_at` aynen kalıyor. Hassas form verisi sütunu eklenmedi.
- Neon repository runtime DDL'si kaldırıldı. Her DB metodu şema-ready kapısından geçiyor; kapı yalnız `SELECT schema_version ...` çalıştırıyor ve eksik/eski şemayı güvenli 503'e çeviriyor. `ready_at`, yeni başarılı finalize işleminde yazılıyor.
- DB/Blob konfigürasyonu yokken fabrika Memory adaptörüne düşmüyor. Memory adaptörleri açık test enjeksiyonuyla seçilir; Production/Vercel altında test enjeksiyonu reddedilir. Paylaşım POST/DELETE, PDF GET ve cleanup rotaları altyapı sorunlarını kontrollü 503 olarak döndürüyor.
- Yaşayan belge ve `.env.example` migration dağıtım sırasını ve V3 geçiş sınırını açıklıyor. 50/gün kullanıcı kotası henüz etkinleştirilmedi; bu, sonraki aşamaların işi.

## Doğrulama

| Kontrol | Sonuç | Kanıt |
|---|---|---|
| Boş PGlite PostgreSQL 18.6 üzerinde repository migration'ları 001, 002, 004, 005, 006 | PASS | `ASAMA_02_tests.tap` |
| 006'nın aynı veritabanında art arda tekrar uygulanması | PASS | `ASAMA_02_tests.tap` |
| 005 legacy fixture upgrade; eski SELECT/revoke, status, token hashleri ve expiry korunumu | PASS | `ASAMA_02_tests.tap` |
| Quota unique anahtarı, tüm nonnegative sayaçlar, Blob obligation FK ve tombstone sonrası byte borcu | PASS | `ASAMA_02_tests.tap` |
| Neon token lookup öncesi salt-okunur readiness ve route 503 davranışı | PASS | `ASAMA_02_tests.tap` |
| Hedefli share regresyonları + ASAMA_02 testleri | **116 PASS / 0 FAIL / 0 SKIP**, exit 0 | `ASAMA_02_tests.json`, `ASAMA_02_tests.tap` |
| Runtime TypeScript (`tsconfig.next.json`) | PASS, exit 0 | `ASAMA_02_runtime-tsc.json`, `.log` |
| Değişen kaynak/test/runner ESLint | PASS, exit 0 | `ASAMA_02_lint.json`, `.log` |
| `git diff --check` | PASS | Çalışma ağacı denetimi |
| Tüm repo `tsc --noEmit --incremental false` | **FAIL: 606 tanı**, değişen ASAMA_02 dosyalarında 0 tanı | `ASAMA_02_project-tsc.log` |

Tam repo typecheck hataları ASAMA_02 alanı dışındaki `docs/pdf-viewer-v4`, `ecc`, `scripts/cad-v2` ve diğer mevcut dosyalarda. ASAMA_01 bu geniş komutu çalıştırmadı; dolayısıyla bu kayıt onları tarihsel olarak “önceden var” diye sınıflandırmıyor. Tam repo typecheck ASAMA_02 kapı koşulu değildi; runtime typecheck ve değişen test lint'i geçti.

PGlite gerçek PostgreSQL motorunu yerelde ve bellekte çalıştırdı; üretim/Preview Neon veritabanına bağlanılmadı, hiçbir canlı migrasyon uygulanmadı. Bu aşama eşzamanlı Neon bağlantı yarışı iddiası taşımaz.

## Migration ve rollback notu

006 yalnızca eklemeli, `IF NOT EXISTS`/`ON CONFLICT` tabanlıdır ve PGlite'de tekrar uygulaması doğrulandı. Aşağı yönlü DROP migration'ı bilerek yoktur: ileride oluşturulacak byte yükümlülüklerini silmek fiziksel depolama borcunu gizleyebilir. Gerekirse önce uygulama sürümü geri alınır; ek nullable sütunlar 005 kullanan sürüm tarafından okunmaz. Yeni runtime, schema version 6 olmadan paylaşım işlemi başlatmaz.

## Açık kapılar ve sonraki aşama

- Gerçek Neon instance'ında iki ayrı bağlantıyla concurrency; private Vercel Blob ve Preview/Production kaynak ayrımı bu aşamada çalıştırılmadı. Remote erişim/credential kullanılmadı; bunlar sonraki plan kapılarıdır.
- Build çalıştırılmadı; V3 planı build'i ASAMA_13 release gate'ine bırakıyor.
- Bu ASAMA_02 kapısı PASS. Sıradaki ve tek izinli aşama **ASAMA_03 — Tarayıcı kimliği ve kota bootstrap**.
- Remote write: 0 · Push: 0 · Deployment: 0.
