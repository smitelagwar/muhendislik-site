# G14 — Uygulama paketi kaydı

[Dizin](README.md) · [Kayıt sözleşmesi](20_KAYIT_VE_KANIT_SISTEMI.md)

| Alan | Kayıt |
|---|---|
| Plan revizyonu / D / R / UI | EXEC-2 + U1/U2/U3 · D13, D15 · R19, R37 · F22, F23 |
| G / SES / başlangıç SNAP / son SNAP | G14 · SES-20260919-15 · SNAP-0001 → SNAP-0001 |
| Uygulama durumu | IMPLEMENTER_VERIFIED |
| Bağımsız denetim | NOT_REVIEWED — yalnız Astra doldurur |
| Giriş koşulları ve gerçek kanıt | G13 (Admin menüsü ve studio yönlendirmesi) doğrulandı |

## Uygulanan davranış

1. **Public Paylaşım Yetki ve Doğrulama Katmanı (R19, R37, F22, F23):**
   - `src/lib/cad-v2/service/public-auth.ts`:
     - `verifyPublicShareAccess(token, targetFileId)` fonksiyonu eklendi.
     - `getPublicShareInfo(token)` ve `verifyShareAccessJwt` çağrılarıyla paylaşımın geçerliliği, süresi (`expired`), iptal durumu (`revoked`) ve şifre koruması (`password_hash` & JWT çerez doğrulaması) incelenir.
     - Paylaşıma ait olmayan dosyalara erişim denemeleri katı bir şekilde 403 (ACCESS_DENIED) koduyla reddedilir.
     - Süresi dolmuş veya iptal edilmiş paylaşımlar 410 (GONE) kodu ile sonlandırılır.

2. **Public API Uç Noktaları (motor_v2/25 sözleşmesi):**
   - 6 adet public App Router route'u oluşturuldu ve yetkilendirildi:
     - `POST /api/public/cad-v2/prepare`: Public paylaşım token'ı zorunlu; dosya ID'si paylaşıma dahilse sahne derlemesini başlatır/bağlar.
     - `GET /api/public/cad-v2/jobs/[jobId]`: İş durumu sorgulanırken işin ait olduğu dosyanın bu paylaşıma ait olduğu doğrulanır.
     - `POST /api/public/cad-v2/view-sessions/[viewSessionId]/heartbeat`: Public izleme oturumu heartbeat (180s TTL) desteği.
     - `DELETE /api/public/cad-v2/view-sessions/[viewSessionId]`: İzleme oturumu sonlandırma.
     - `GET /api/public/cad-v2/scenes/[sceneId]/manifest`: Sahne dosya kimliği doğrulanarak şema v1 JSON manifest döner (azami 1 MiB).
     - `GET /api/public/cad-v2/scenes/[sceneId]/chunks/[chunkId]`: Sahne dosya kimliği doğrulanarak ikili parça baytları döner (azami 2 MiB).
   - Cache-Control başlıkları `private, no-store` olarak belirlendi. Asla harici blob URL'si browser'a sızdırılmaz.

3. **Durable Service Dosya-Sahne Eşleme Güvenliği:**
   - `CadV2DurableService` sınıfına `sceneFileMap` ve `getFileIdForScene(sceneId)` eklenerek her sahne için dosya mülkiyeti takip edilir. Public isteklerde sceneId tahmin edilse dahi dosya paylaşıma dahil değilse 403 döner.

## Değişiklik dökümü

| Dosya / sembol | Ekleme/değiştirme/silme | Neden / R | Önce/sonra hash veya SNAP | Korunan davranış |
|---|---|---|---|---|
| `src/lib/cad-v2/service/public-auth.ts` | Ekleme | R19, R37 Public share auth yardımcısı | Yeni dosya | Admin fonksiyonları sızmaz |
| `src/app/api/public/cad-v2/prepare/route.ts` | Ekleme | R19, R37 Public prepare endpoint | Yeni dosya | İzolasyon sağlandı |
| `src/app/api/public/cad-v2/jobs/[jobId]/route.ts` | Ekleme | R19, R37 Public job endpoint | Yeni dosya | İzolasyon sağlandı |
| `src/app/api/public/cad-v2/view-sessions/[viewSessionId]/heartbeat/route.ts` | Ekleme | R19, C08 Public heartbeat endpoint | Yeni dosya | İzolasyon sağlandı |
| `src/app/api/public/cad-v2/view-sessions/[viewSessionId]/route.ts` | Ekleme | R19, C08 Public session delete endpoint | Yeni dosya | İzolasyon sağlandı |
| `src/app/api/public/cad-v2/scenes/[sceneId]/manifest/route.ts` | Ekleme | R19, R37 Public manifest endpoint | Yeni dosya | İzolasyon sağlandı |
| `src/app/api/public/cad-v2/scenes/[sceneId]/chunks/[chunkId]/route.ts` | Ekleme | R19, R37 Public chunk endpoint | Yeni dosya | İzolasyon sağlandı |
| `src/lib/cad-v2/service/cad-v2-durable-service.ts` | Değiştirme | R19 sceneFileMap ve getFileIdForScene | SNAP-0001 | Korundu |
| `tests/cad-v2/public-share-auth.test.ts` | Ekleme | G14 public share güvenlik ve tenant testleri | Yeni dosya | İzolasyon korundu |
| `package.json` | Değiştirme | `check:cad-v2:integration` içine G14 testinin eklenmesi | SNAP-0001 | Korundu |

## Test ve görsel kanıt

| R / UI | Gerçek komut/test | RUN / ART / SNAP | Sonuç | Eksik / sınırlama |
|---|---|---|---|---|
| R19, R37 | `npx tsx tests/cad-v2/public-share-auth.test.ts` | RUN-0037 / SNAP-0001 | PASS (exit 0) | 12 test (token yokluğu, expired/revoked 410, yetkisiz dosya 403, şifre koruması 401, job/manifest/chunk erişim sınırlandırması) geçti |
| Entegrasyon | `npm run check:cad-v2:integration` | RUN-0038 / SNAP-0001 | PASS (exit 0) | G11 + G13 + G14 + G00 baseline + CLI compiler geçti |
| Tam Sürüm Paketi | `npm run check:cad-v2:release` | RUN-0039 / SNAP-0001 | PASS (exit 0) | Unit + Integration + UI testlerinin tümü eksiksiz geçti |
| Tip Kontrolü | `npx tsc --noEmit -p tsconfig.next.json` | RUN-0040 / SNAP-0001 | PASS (exit 0) | 0 hata |

## Başarısızlık ve düzeltmeler

Herhangi bir hata veya güvenlik açığı yaşanmadı.

## Açık CR / eksik / sonraki bağımlılık

Açık CR yoktur. Sıradaki adım: G15 (Doğruluk, performans ve işletim kabulü).

## Uygulayıcı kapanışı

G14 paketi (Public paylaşım token doğrulaması, tenant/dosya izolasyonu, public endpoint setleri ve oturum yönetimi) başarıyla tamamlandı ve doğrulandı.
