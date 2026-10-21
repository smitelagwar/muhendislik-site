# R01 — Production Hazırlama ve Çok Süreç Dayanıklılığı Kabul Raporu

**Sözleşme & Referans:**
- `DWG_DXF_Motor_V2_Kanitli_Kok_Neden_ve_Fidelity_Gemini_Uygulama_Plani_v3.md` — Bölüm 11 (R01)
- `DWG_CALISMA_SOZLESMESI.md`
- `motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md`
- `motor_v2/31_SOZLESME_TAMAMLAMALARI.md`

**Durum:** LOCAL PASS (Yerel çok süreçli dayanıklılık ve API güvenlik kapıları %100 doğrulandı; harici hosting/production deployment erişimi olmadığı için deployment adımı sözleşme gereği BLOCKED/KORUNUYOR)

---

## 1. Test Kapsamı ve Yürütülen Paketler

R01 paketi kapsamında iki kapsamlı entegrasyon test paketi hazırlanmış ve `package.json` içindeki `check:cad-v2:integration` zincirine bağlanmıştır:

1. **`tests/cad-v2/durable-multiprocess.test.ts` (5/5 PASS):**
   - **Test 1 (Çoklu Süreç İzolasyonu):** Ayrı bir Node işletim sistemi süreci (Süreç A / child-publisher) DXF geometrisini derler, staging dizininde doğrular ve atomik olarak sahne dizinine yayınlar. İkinci bir bağımsız soğuk süreç (Süreç B / child-verifier) RAM önbelleği tamamen boşken sahneyi diskten okur; manifest schemaVersion (1), renderAbi (`three172-cad2d-v2`), ikili parça magic başlığı (`DV2SCN01`) ve bayt uzunlukları doğrulanır. Staging dizini 0 artık dosya ile temizlenir.
   - **Test 2 (Süreç Ölümü / Crash Simülasyonu):** Staging yazımı sırasında `SIGKILL` ile aniden öldürülen sürecin yarım kalmış verisi nihai sahneler dizinine sızmaz; atomik izolasyon korunur.
   - **Test 3 (Fencing Token İhlali ve Stale Lease):** Başka bir süreç tarafından devralınan veya iptal edilen eski bir iş (stale fence token), atomik publish aşamasında `"Fencing token ihlali: İş iptal edilmiş veya süresi geçmiş."` hatasıyla reddedilir ve staging temizlenir.
   - **Test 4 (Eksik Kaynak Tamponu):** Kaynak buffer boşken veya sağlanamadığında iş sonsuz `running` durumunda asılı kalmaz; anında `failed` durumuna ve `MISSING_SOURCE_BUFFER` hatasına geçer.
   - **Test 5 (Unobserved Job İptali ve Fencing Artışı):** Tek izleyicisi olan oturum silindiğinde (DELETE 204), iş `cancelled` olur ve fence token 1 artırılır. Çoklu izleyicili senaryoda biri ayrıldığında iş diğer izleyici için `running` kalmaya devam eder; son izleyici ayrıldığında iptal edilir.

2. **`tests/cad-v2/api-revision-auth.test.ts` (5/5 PASS):**
   - **Grup 1 (Revizyon Uyuşmazlığı):** İstemcinin beklediği revizyon (`expectedSourceVersionKey`) dosyanın güncel revizyonu ile uyuşmadığında `409 SOURCE_REVISION_CHANGED` döner (`retryable: true`, `actualSourceVersionKey` sağlanır).
   - **Grup 2 (SSRF Saldırı Koruması):** `accessUrl` parametresi üzerinden `169.254.169.254` (cloud metadata), `127.0.0.1` (localhost), harici saldırgan sunucuları, `file://` ve `javascript:` şemaları engellenir; yalnızca yetkili dosyanın Blob otoritesi kabul edilir.
   - **Grup 3 (Path Traversal & isValidCadV2StorageId):** `../`, `../../etc/passwd`, `..\..\System32`, `null byte`, boşluk veya özel karakter içeren tüm zararlı depolama kimlikleri `isValidCadV2StorageId` tarafından reddedilir (HTTP 400). Durable storage arama metotları traversal denemelerinde `null` döner.
   - **Grup 4 (View Session 180s TTL):** Oturumlar için 180 saniye TTL uygulanır. Heartbeat ile süre uzatılır; süresi dolan oturumlar `410 VIEW_SESSION_EXPIRED` verir. DELETE çağrısı oturumu sonlandırır (HTTP 204).
   - **Grup 5 (Paylaşım Bağlantısı ve Yetki Sınırları):** Token eksikliğinde 401, bilinmeyen tokende 403, süresi dolmuş veya iptal edilmiş tokende 410, şifreli paylaşımda 401 ve kapsam dışı dosya erişiminde 403 yanıtları doğrulanmıştır.

---

## 2. Kanıt Verileri ve Metrikler

| Test Bileşeni | Test Dosyası | Sonuç |
|---|---|---|
| Multi-Process Publish & Cold Verify | `tests/cad-v2/durable-multiprocess.test.ts` (Test 1) | PASS (0 exit, 0 staging leak) |
| Process Kill / Staging Isolation | `tests/cad-v2/durable-multiprocess.test.ts` (Test 2) | PASS (SIGKILL, 0 scene corruption) |
| Fencing Token Stale Lease Rejection | `tests/cad-v2/durable-multiprocess.test.ts` (Test 3) | PASS (Staging purged, failed status) |
| Empty Buffer Safety Boundary | `tests/cad-v2/durable-multiprocess.test.ts` (Test 4) | PASS (MISSING_SOURCE_BUFFER) |
| Unobserved Observer / Fence Counter | `tests/cad-v2/durable-multiprocess.test.ts` (Test 5) | PASS (Multi-observer refcount invariant) |
| Source Revision Mismatch (409) | `tests/cad-v2/api-revision-auth.test.ts` (Grup 1) | PASS (409 SOURCE_REVISION_CHANGED) |
| Client accessUrl SSRF Protection | `tests/cad-v2/api-revision-auth.test.ts` (Grup 2) | PASS (Cloud metadata / localhost blocked) |
| Storage ID Path Traversal Sanitization | `tests/cad-v2/api-revision-auth.test.ts` (Grup 3) | PASS (isValidCadV2StorageId) |
| View Session 180s TTL & Expiry (410) | `tests/cad-v2/api-revision-auth.test.ts` (Grup 4) | PASS (410 VIEW_SESSION_EXPIRED) |
| Share Token Auth Boundaries (401/403/410) | `tests/cad-v2/api-revision-auth.test.ts` (Grup 5) | PASS (Exact HTTP status match) |

---

## 3. Sözleşme Durumu

- Plan v3 Bölüm 11 Kuralı: "Mevcut 00/25/31 kararlarından kesin hosting/runtime erişimi çıkarılamıyorsa deployment bağımlısı alt adım BLOCKED kalır; yerel çok-süreç testleri yürür."
- Yerel çok-süreç ve API revizyon/auth doğrulama koşulları **LOCAL PASS** olarak tamamlanmıştır.
- Canlı sunucuya uzak yazma / deploy yapılmamıştır (`AGENTS.md` ve `GEMINI.md` kurallarına tam uyum).
