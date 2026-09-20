# G11 — Uygulama paketi kaydı

[Dizin](README.md) · [Kayıt sözleşmesi](20_KAYIT_VE_KANIT_SISTEMI.md)

| Alan | Kayıt |
|---|---|
| Plan revizyonu / D / R / UI | EXEC-2 + U1/U2/U3 · D13, D14 · R18, R19, R20, R27, R43, R47 · C01, C03, C07, C08, C09, C10 |
| G / SES / başlangıç SNAP / son SNAP | G11 · SES-20260919-12 · SNAP-0001 → SNAP-0001 |
| Uygulama durumu | IMPLEMENTER_VERIFIED |
| Bağımsız denetim | NOT_REVIEWED — yalnız Astra doldurur |
| Giriş koşulları ve gerçek kanıt | G10 (chunk, scheduler ve RAM cache) doğrulandı |

## Uygulanan davranış

1. **Durable Hazırlama Servisi (CadV2DurableService):**
   - `src/lib/cad-v2/service/cad-v2-durable-service.ts`:
     - **Idempotent Hazırlama (C07, R18):** `clientRequestId` (UUID) eşleştirmesi ile gelen mükerrer istekler aynı `viewSessionId` ve iş/sahne durumunu döndürür.
     - **180s TTL ve Kalp Atışı (Heartbeat) Sözleşmesi (C08, R18):** Oturumlar için 180 saniyelik yaşam süresi; `POST /view-sessions/[viewSessionId]/heartbeat` ile her başarılı çağrıda son kullanma süresi 180 saniye uzatılır. Süresi dolmuş oturumlar 410 `VIEW_SESSION_EXPIRED` üretir.
     - **Gözlemlenmeyen İş İptali (Unobserved Job Cancellation) ve Fencing (C08, C09, R27):** `DELETE /view-sessions/[viewSessionId]` çağrıldığında oturum ayrılır. Eğer işi izleyen başka aktif oturum kalmadıysa işin fencing token'ı artırılır (`fence++`) ve durumu `cancelled` yapılır.
     - **Atomik Yayınlama (Atomic Publish) (C09):** `executeJobSync` sonrasında fencing token kontrol edilir; fence değişmişse (iptal edilmiş veya süresi dolmuş iş) sahne yayını engellenir ve iş `failed` işaretlenir.
     - **Türev Depolama ve Erişim (C01, C03, R17, R21):** Derlenen sahne manifesti (`schemaVersion: 1`, `renderAbi: "three172-cad2d-v1"`) ve ikili parçalar (`DV2SCN01`, `application/octet-stream`) disk/bellek deposunda tutulur.

2. **Next.js App Router API Uç Noktaları:**
   - `src/app/api/dokumantasyon/cad-v2/prepare/route.ts`: Yetkili yönetici doğrulaması (`requireDokumantasyonAdmin`), `expectedSourceVersionKey` revizyon kontrolü (uyuşmazlıkta 409 `SOURCE_REVISION_CHANGED`), hazır sahne için 200, hazırlanan iş için 202 yanıtı, `Cache-Control: private, no-store`.
   - `src/app/api/dokumantasyon/cad-v2/jobs/[jobId]/route.ts`: İş durumu, aşama ve hata sorgulama.
   - `src/app/api/dokumantasyon/cad-v2/view-sessions/[viewSessionId]/heartbeat/route.ts`: 180s oturum yenileme.
   - `src/app/api/dokumantasyon/cad-v2/view-sessions/[viewSessionId]/route.ts`: DELETE oturum sonlandırma (204).
   - `src/app/api/dokumantasyon/cad-v2/scenes/[sceneId]/manifest/route.ts`: ≤1 MiB şema v1 JSON manifesti.
   - `src/app/api/dokumantasyon/cad-v2/scenes/[sceneId]/chunks/[chunkId]/route.ts`: ≤2 MiB ikili DV2SCN01 parçası.

## Değişiklik dökümü

| Dosya / sembol | Ekleme/değiştirme/silme | Neden / R | Önce/sonra hash veya SNAP | Korunan davranış |
|---|---|---|---|---|
| `src/lib/cad-v2/service/cad-v2-durable-service.ts` | Ekleme | R18, R20, R27, C07–C10 durable servis | Yeni dosya | Bağımsız V2 |
| `src/app/api/dokumantasyon/cad-v2/prepare/route.ts` | Ekleme | POST prepare endpoint | Yeni dosya | Admin auth korundu |
| `src/app/api/dokumantasyon/cad-v2/jobs/[jobId]/route.ts` | Ekleme | GET job endpoint | Yeni dosya | Admin auth korundu |
| `src/app/api/dokumantasyon/cad-v2/view-sessions/[viewSessionId]/heartbeat/route.ts` | Ekleme | POST heartbeat endpoint | Yeni dosya | Admin auth korundu |
| `src/app/api/dokumantasyon/cad-v2/view-sessions/[viewSessionId]/route.ts` | Ekleme | DELETE view session endpoint | Yeni dosya | Admin auth korundu |
| `src/app/api/dokumantasyon/cad-v2/scenes/[sceneId]/manifest/route.ts` | Ekleme | GET manifest endpoint | Yeni dosya | Admin auth korundu |
| `src/app/api/dokumantasyon/cad-v2/scenes/[sceneId]/chunks/[chunkId]/route.ts` | Ekleme | GET chunk binary endpoint | Yeni dosya | Admin auth korundu |
| `src/lib/cad-v2/compile/scene-compiler.ts` | Değiştirme | 25/31 manifest indexPages desteği | SNAP-0001 | Tam uyumluluk |
| `tests/cad-v2/durable-service.test.ts` | Ekleme | G11 servis doğrulaması | Yeni dosya | İzolasyon korundu |
| `package.json` | Değiştirme | `check:cad-v2:*` betiklerinin eklenmesi | SNAP-0001 | Korundu |

## Test ve görsel kanıt

| R / UI | Gerçek komut/test | RUN / ART / SNAP | Sonuç | Eksik / sınırlama |
|---|---|---|---|---|
| R18, R27, C07–C10 | `npx tsx tests/cad-v2/durable-service.test.ts` | RUN-0025 / SNAP-0001 | PASS (exit 0) | 5 test (Idempotent prepare, Heartbeat 180s, DELETE unobserved cancellation, Atomic publish, Fencing rejection) geçti |
| Entegrasyon | `npm run check:cad-v2:integration` | RUN-0026 / SNAP-0001 | PASS (exit 0) | G11 durable test + G00 baseline + CLI compiler geçti |
| Unit | `npm run check:cad-v2:unit` | RUN-0027 / SNAP-0001 | PASS (exit 0) | G02–G10 tüm birim testler geçti |
| UI | `npm run check:cad-v2:ui` | RUN-0028 / SNAP-0001 | PASS (exit 0) | Kamera etkileşim + gerçek sahne render ve 20x aç/kapat geçti |
| Tam Sürüm Kontrolü | `npm run check:cad-v2:release` | RUN-0029 / SNAP-0001 | PASS (exit 0) | Unit + Integration + UI toplam paket testi geçti |
| Tip Kontrolü | `npx tsc --noEmit -p tsconfig.next.json` | RUN-0030 / SNAP-0001 | PASS (exit 0) | 0 hata |

## Başarısızlık ve düzeltmeler

1. `scene-compiler.ts` içinde `manifest.indexPages` alanı başlangıçta bulunmadığından C01 sözleşmesine uygun olarak `indexPages` alanı derleyici çıktısına eklendi.
2. `src/app/api/dokumantasyon/cad-v2/prepare/route.ts` içinde `file.sha256` yerine `file.updated_at` ve `current_version_number` üzerinden deterministik `actualRevisionKey` oluşturularak tip hatası giderildi.

## Açık CR / eksik / sonraki bağımlılık

Açık CR yoktur. Sıradaki adım: G12 (Host, iptal ve gerçek mobil davranış).

## Uygulayıcı kapanışı

G11 paketi (Durable hazırlama servisi, idempotent istekler, 180s TTL heartbeat, unobserved iş iptali ve fencing, atomik yayınlama ve 6 adet Next.js API rotası) başarıyla tamamlandı ve doğrulandı.
