# G10 — Uygulama paketi kaydı

[Dizin](README.md) · [Kayıt sözleşmesi](20_KAYIT_VE_KANIT_SISTEMI.md)

| Alan | Kayıt |
|---|---|
| Plan revizyonu / D / R / UI | EXEC-2 + U1/U2/U3 · D13, D14 · R17, R20, R21, R28 · V15 · C03, C04, C11 |
| G / SES / başlangıç SNAP / son SNAP | G10 · SES-20260919-11 · SNAP-0001 → SNAP-0001 |
| Uygulama durumu | IMPLEMENTER_VERIFIED |
| Bağımsız denetim | NOT_REVIEWED — yalnız Astra doldurur |
| Giriş koşulları ve gerçek kanıt | G09 (model, pafta, viewport ve bağımlılıklar) doğrulandı |

## Uygulanan davranış

1. **Sınırlı RAM LRU Önbelleği (LruChunkCache):**
   - `src/lib/cad-v2/cache/chunk-spatial-scheduler.ts`:
     - 64 MiB CPU chunk / 64 MiB GPU başlangıç bellek tavanı (`DEFAULT_MAX_RAM_CACHE_BYTES = 64 * 1024 * 1024`).
     - Yeni parça eklenirken bütçe aşılırsa sadece **şu an görünmeyen (`isVisible === false`)** parçalar en eski kullanım zamanına göre (LRU) otomatik olarak tahliye (evict) edilir.
     - Görünür parçalar bütçe doldu diye sessizce silinmez; görünürlük önceliği korunur.
     - **Kayıpsız Geri Yükleme (Lossless Eviction):** Tahliye edilen bir parça, kamera o bölgeye geri döndüğünde sunucudan/bellekten kayıpsız olarak tekrar yüklenir ve önbelleğe alınır.

2. **Mekânsal Parça Planlayıcısı (SpatialChunkScheduler):**
   - `src/lib/cad-v2/cache/chunk-spatial-scheduler.ts`:
     - Kamera görünüm alanı (`cameraViewport: CadBBox2D`) ile parçaların sınırlayıcı kutuları (`meta.bbox`) arasındaki kesişim tespit edilir.
     - Kesişen parçalar en yüksek öncelikle (`priority: 0`) indirme kuyruğuna alınır.
     - **Kuyruk ve Eşzamanlılık Sınırı:** En fazla 4 eşzamanlı aktif fetch (`MAX_CONCURRENT_FETCH = 4`) ve 2 adet decoded worker kuyruğu uygulanır.
     - **Nesil (Generation) Güvenliği:** Kullanıcı hızlı kamera hareketi yaptığında veya çizimler/paftalar arasında geçiş yaptığında (`A -> B -> C`), nesil numarası artırılır (`generation++`); eski nesle ait geç gelen ağ yanıtları (`generation < currentGeneration`) güvenle reddedilir ve atılır.

## Değişiklik dökümü

| Dosya / sembol | Ekleme/değiştirme/silme | Neden / R | Önce/sonra hash veya SNAP | Korunan davranış |
|---|---|---|---|---|
| `src/lib/cad-v2/cache/chunk-spatial-scheduler.ts` | Ekleme | R17, R20, R21, R28 LRU cache ve spatial scheduler | Yeni dosya | Bağımsız V2 |
| `tests/cad-v2/chunk-scheduler-cache.test.ts` | Ekleme | G10 bellek ve önceliklendirme test paketi | Yeni dosya | İzolasyon korundu |
| `package.json` | Değiştirme | `check:cad-v2:unit` güncellemesi | SNAP-0001 | Korundu |

## Test ve görsel kanıt

| R / UI | Gerçek komut/test | RUN / ART / SNAP | Sonuç | Eksik / sınırlama |
|---|---|---|---|---|
| R20, R21, R28 | `npx tsx tests/cad-v2/chunk-scheduler-cache.test.ts` | RUN-0022 / SNAP-0001 | PASS (exit 0) | 5 test (LRU eviction, Lossless recovery, Spatial priority, Throttle, Stale request drop) geçti |
| Regresyon | `npm run check:cad-v2:release` | RUN-0023 / SNAP-0001 | PASS (exit 0) | G00–G10 tüm testler ve CLI derleme geçti |
| Tip Kontrolü | `npx tsc --noEmit -p tsconfig.next.json` | RUN-0024 / SNAP-0001 | PASS (exit 0) | 0 hata |

## Başarısızlık ve düzeltmeler

Tahliye sürecinde aktif görünen parçaların silinmemesi için `isVisible` bayrağı eklendi ve `ensureBudget` algoritması yalnızca görünmeyen adayları sıralayarak tahliye edecek şekilde güvenceye alındı.

## Açık CR / eksik / sonraki bağımlılık

Açık CR yoktur. Sıradaki adım: G11 (Durable hazırlama servisi ve özel türev erişimi).

## Uygulayıcı kapanışı

G10 paketi (64 MiB bütçeli LRU önbellek, kayıpsız tahliye, mekânsal görünürlük planlayıcısı, 4 eşzamanlı istek tavanı ve nesil yarışı koruması) başarıyla tamamlandı ve doğrulandı.
