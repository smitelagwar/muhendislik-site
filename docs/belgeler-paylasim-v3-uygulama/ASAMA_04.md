# ASAMA_04 — Güvenli idempotency ve yarışa dayanıklı durum makinesi

**Durum: PASS** · 23 Ekim 2026 · Repo HEAD: `04048e50fd02e50c1c9ea783acec2d7383f516b4`

Kaynak/test/dokümantasyon/runner manifest özeti: `b9c654e0f6e52aefa9e211b5921e4906ed4c69b643b7b21892d8a069c0970b0f` (`ASAMA_04_changes.json`, 19 dosya).

## Yapılanlar

- Create POST artık doğrulanmış tarayıcı owner cookie'si ve `x-belge-share-replay-proof` başlığında ayrı, canonical 256-bit Base64URL proof ister. Ham proof saklanmaz; owner ve request ID kapsamlı HMAC hash saklanır. Yanlış proof/owner ve olmayan işlem aynı genel 404 cevabını alır.
- Yeni token çifti `requestId` üzerinden v1 gibi türetilmez. Her yeni rezervasyon için CSPRNG 32 bayt nonce üretilir; DB nonce'u ve `token_key_version` değerini kalıcı saklar. Domain-separated V2 HMAC ile aynı nonce/key-version aynı tokenları verir; tombstone GC sonrası aynı request ID yeni nonce ve yeni link üretir. Eski token hash'leri ve eski view/revoke yolu korunur.
- Migration 007 `token_key_version` alanını ekler ve schema readiness sürümünü 7 yapar. Kayıtlı key version aktif yapılandırmada yoksa replay fail-closed 503 döner. Secret veya eski token hash'leri otomatik döndürülmez.
- Aynı owner+proof+payload için ready replay 200, ilk başarı 201, işlem devam ederken create replay 202 olur. Payload çakışması yetkilendirmeden sonra 409'dur. Proof alanı olmayan eski kayıt için `LEGACY_REPLAY_UNAVAILABLE` 409 döner; `manageToken` requestId'den tekrar üretilmez.
- `GET /api/belgeler/paylasim/islem/[requestId]` proof'u yalnız header'dan alır; query string'e koymaz. Endpoint form içeriği döndürmez, ready durumunda bağlantı/token/expiry döndürür; pending, failed ve terminal yanıtları kontrollü, `private, no-store` başlıklarıyla gelir.
- Failed retry ve süresi dolmuş pending takeover aynı logical record üzerinde yeni UUID attempt, artan `attempt_version`, yeni lease ve attempt'e özgü Blob yolu açar. Finalize/fail yalnız pending + eşleşen attempt/version + geçerli lease + `revoked_at IS NULL` koşuluyla uygulanır ve DB'de etkilenen satır sayısı kontrol edilir.
- Failure injection testleri eski attempt'in geç finalize'ını, revoke sonrası finalize'ı, PUT sonrası finalize DB hatasını ve DB commit yanıt kaybını sınar. Hazır kaydı generic catch ile failed'e düşürmeden proof ile kurtarır. PUT sonrası DB finalize hatasında kalan eski Blob orphan'ı ASAMA_05/09 byte muhasebesi ve cleanup kapsamına açık bırakıldı.
- Yaşayan sistem dokümanı ASAMA_04 API/token/attempt sözleşmesini ve migration bilgisini kaydeder. Create/delete beklenmeyen hata logları ham hata metni yerine yalnız hata kategorisi yazar.

## Doğrulama

| Kontrol | Sonuç | Kanıt |
|---|---|---|
| Belgeler/share API, UI, viewer, cleanup ve ASAMA_02/03/04 regresyon paketi | **139 PASS / 0 FAIL / 0 SKIP**, exit 0, timeout yok | `ASAMA_04_tests.json`, `ASAMA_04_tests.tap` |
| Yeni ASAMA_04 davranışları | V2 nonce/key sürümü, owner+proof+payload replay, legacy 409, retry/takeover, stale finalize, revoke/finalize, tombstone GC, GET proof/no-store, 20 paralel Memory ve PGlite create, PUT→DB hata ve kayıp commit yanıtı | Aynı TAP kanıtı |
| PGlite PostgreSQL 18.6 concurrency | 20 eşzamanlı aynı ID isteği bir satır üretir; 1 create + 19 in-flight; raw UNIQUE exception yok | `ASAMA_04_tests.tap` |
| Runtime TypeScript (`tsconfig.next.json`) | PASS, exit 0, timeout yok | `ASAMA_04_runtime-tsc.json`, `.log` |
| Değişen runtime/API/test/runner ESLint | PASS, exit 0, timeout yok | `ASAMA_04_lint.json`, `.log` |
| `git diff --check` | PASS | Aşama kapanış terminal kaydı |

PGlite concurrency tek izole veritabanı istemcisi üzerindedir; ayrı gerçek PostgreSQL/Neon instance bağlantıları, Vercel Blob ve gerçek browser motoru sınanmadı. Production build plan gereği ASAMA_13 kapısıdır. Kota tarafında eski IP preflight akışı ASAMA_05 atomik owner/gün muhasebesine kadar geçici olarak kalır. Remote write: 0 · Push: 0 · Deployment: 0.

## Aşama sonucu

N02, N03, N04 ve N11 kapatıldı; F02 replay/token davranışıyla kapatıldı ve F32 `revokedAt` önceliği korundu. Bir sonraki tek aşama ASAMA_05'tir. `devam` ile ASAMA_05 uygulanabilir; ASAMA_15 için yayın yetkisi verilmiş değildir.
