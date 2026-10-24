# ASAMA_03 — Tarayıcı kimliği ve kota bootstrap

**Durum: PASS** · 23 Ekim 2026 · Repo HEAD: `04048e50fd02e50c1c9ea783acec2d7383f516b4`

ASAMA_03 kaynak/test/dokümantasyon/runner SHA-256 manifest özeti: `2c8c9b0dd925b3443b32bd93c28eb221d7f3d0dfef70f4022cc53877a5024466` (`ASAMA_03_changes.json`, 13 dosya).

## Yapılanlar

- `src/lib/belge-paylasim/browser-identity.ts` server-side `randomBytes(32)` ile 256-bit kimlik üretir. Cookie biçimi `v1.<id>.<iat>.<exp>.<HMAC>`; imza ve owner hash için ayrı domain kullanılır, karşılaştırma constant-time, Base64URL kodlaması canonical, imza/sürüm/expiry kontrolü fail-closed'dur. Owner hash environment ve hostname ile kapsamlanır; aynı cookie aktif kullanımda aynı kimliği koruyarak yenilenir.
- Cookie `HttpOnly`, `SameSite=Lax`, host-only, `Path=/api/belgeler/paylasim`, bir yıllık Max-Age/Expires taşır. Vercel Production/Preview ve HTTPS/uzak production hostlarında `Secure`; localhost için HTTP istisnası korunur. Cookie değeri JSON'a/loga yazılmaz.
- Yeni `POST /api/belgeler/paylasim/kota` bootstrap cookie verir/yeniler. `GET` doğrulanmış cookie echo'su ile kota aggregate'ini verir; owner hash veya ham kimlik dönmez. Repository kota sorgusu DB `NOW()` ile Europe/Istanbul gün ve ertesi yerel gece yarısını hesaplar, ortam + owner + gün satırını `SELECT ... LEFT JOIN` ile okur. DB'de bucket bulunmuyorsa ancak bu sorgu başarıyla tamamlandıktan sonra sayaçlar 0'dır; DB/şema erişilemiyorsa 503 döner.
- Paylaşım oluşturma `POST` same-origin denetiminden sonra cookie imza/sürüm/expiry doğrular. Cookie eksik veya bozuksa `428 BROWSER_ID_REQUIRED` verir; POST kimlik üretmez ve rezervasyon açmaz.
- `browser-bootstrap.ts` Web Locks varsa kilidi kullanır, yoksa BroadcastChannel ile sekmelerin ilk cookie bootstrap'ını koordine eder. Bootstrap sonrası GET echo yapılır. Cookie kabul edilmezse en fazla 2 denemeden sonra kullanıcıya PDF İndir alternatifi içeren hata verir; lider sekmenin bootstrap'ı başarısızsa bekleyen sekmeler ikinci paralel mint başlatmaz. Sonsuz deneme/IP fallback yoktur. Görünür stüdyo/hook entegrasyonu ASAMA_07'ye bırakıldı.
- API regresyon fixture'ları artık açık bootstrap cookie kullanıyor; eksik kimlik 428 sınırı ayrı test ediliyor. Yaşayan `docs/BELGELER_SISTEMI.md` ASAMA_03 sözleşmesini ekliyor.

## Doğrulama

| Kontrol | Sonuç | Kanıt |
|---|---|---|
| Belgeler/share API, repository ve ASAMA_02/03 regresyon paketi | **128 PASS / 0 FAIL / 0 SKIP**, exit 0, timeout yok | `ASAMA_03_tests.json`, `ASAMA_03_tests.tap` |
| ASAMA_03'e ait davranış testleri | 12 test: cookie imza/expiry/yenileme, cookie flags, POST 428/no-mint, bootstrap/echo, quota aggregate, host/env/day, same-IP ayrı kimlik, BroadcastChannel iki sekme, lider hata durumunda ikinci mint engeli, reddedilen cookie'de bounded retry, DB yokken 503 | Aynı TAP kanıtı |
| PGlite PostgreSQL 18.6 üzerinde kota sorgusu | doğru environment/owner/DB günü satırı; boş satır `0/0`; DB serverNow/resetAt; yalnız read-only `WITH/SELECT` | `ASAMA_03_tests.tap` |
| Runtime TypeScript (`tsconfig.next.json`) | PASS, exit 0, timeout yok | `ASAMA_03_runtime-tsc.json`, `.log` |
| Değişen kaynak, test ve kanıt runner ESLint | PASS, exit 0, timeout yok | `ASAMA_03_lint.json`, `.log` |
| `git diff --check` | PASS | Aşama kapanış terminal kaydı |

İki sekme koordinasyonu gerçek bir Chromium/Firefox/WebKit oturumu olarak çalıştırılmadı; BroadcastChannel protokolü sahte kanal hub'ıyla iki eşzamanlı bootstrap/GET echo akışında sınandı. Aynı IP'li iki anonim context, ayrı imzalı cookie'li route istekleriyle; kota sorgusu ise izole PGlite PostgreSQL ile sınandı. Gerçek Neon, Vercel Blob, Preview/Production ve kullanıcı verilerine erişilmedi.

Build bu aşamanın kapısı değildi; plan gereği ASAMA_13'te. `devam` sonrasında tek sonraki aşama ASAMA_04'tür; bu kayıt ASAMA_04 işini başlatmaz.

## Açık kapılar

- ASAMA_04'te owner hash'in rezervasyon/idempotency/proof yaşam döngüsüne bağlanması gerekir; N03 replay-proof güvenliği henüz kapanmadı.
- ASAMA_05 henüz günlük 50 başarı kotasını atomik olarak uygulamıyor; mevcut IP bazlı üretim sınırlarının kaldırılması daha sonraki aşamadır.
- UI bootstrap/helper entegrasyonu, görünür cookie engeli mesajı ve PDF İndir alternatifi ASAMA_07'de yapılacaktır.
- Neon ayrı bağlantı concurrency'si, gerçek browser motorları, Vercel Preview/Production ayarları ve build burada çalıştırılmadı.
- Remote write: 0 · Push: 0 · Deployment: 0.
