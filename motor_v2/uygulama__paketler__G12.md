# G12 — Uygulama paketi kaydı

[Dizin](README.md) · [Kayıt sözleşmesi](20_KAYIT_VE_KANIT_SISTEMI.md)

| Alan | Kayıt |
|---|---|
| Plan revizyonu / D / R / UI | EXEC-2 + U1/U2/U3 · D02, D15, D20 · R23–R28, R30 · V16, V17, N10, N18 |
| G / SES / başlangıç SNAP / son SNAP | G12 · SES-20260919-13 · SNAP-0001 → SNAP-0001 |
| Uygulama durumu | IMPLEMENTER_VERIFIED |
| Bağımsız denetim | NOT_REVIEWED — yalnız Astra doldurur |
| Giriş koşulları ve gerçek kanıt | G11 (durable hazırlama servisi ve API rotaları) doğrulandı |

## Uygulanan davranış

1. **Host State Machine (Durum Makinesi):**
   - `src/components/dokumantasyon/cad-v2/cad-v2-host-shell.tsx`:
     - Tam durum kümesi: `authorizing` | `preparing` | `loading` | `ready` | `degraded` | `cancelled` | `context-lost` | `error`.
     - Sunucu ile gerçek entegrasyon: `POST /api/dokumantasyon/cad-v2/prepare` çağrısı, 202 durumunda `/jobs/[jobId]` sorgulama, manifest çekimi ve parçaların Web Worker üzerinden akıtılması.
     - `degraded` durumu: Eksik font veya tanınmayan nesneler olduğunda kullanıcıya sarı uyarı rozeti gösterilir ancak çizim açılmaya devam eder.

2. **Kullanıcı İptali ve Oturum Temizliği (Cancellation & Cleanup):**
   - Hazırlama veya yükleme sırasında kullanıcı "İptal Et" veya "Geri" butonuna bastığında:
     - `abortController.abort()` ile aktif tüm ağ istekleri derhal kesilir.
     - `DELETE /api/dokumantasyon/cad-v2/view-sessions/[viewSessionId]` isteği gönderilerek sunucudaki izleyici kaydı silinir ve unobserved iş iptal edilir.
     - Ekran `cancelled` durumuna geçer ve temiz unmount sağlanır.

3. **180s TTL ve Kalp Atışı (Heartbeat) Yönetimi:**
   - Aktif sekmede her 30 saniyede bir, arka plandaki (`hidden`) sekmede her 60 saniyede bir `POST /view-sessions/[viewSessionId]/heartbeat` tetiklenir.
   - Sekme görünür olduğunda oturum süresi dolmuşsa (410 `VIEW_SESSION_EXPIRED`), sunucudan aynı revizyon için otomatik olarak yeni bir hazırlama (`prepare`) başlatılır.

4. **WebGL Context Loss ve Recovery (R30, V16):**
   - Canvas üzerinde `webglcontextlost` olayı dinlenir; `event.preventDefault()` uygulanarak tarayıcının WebGL çökertmesi önlenir ve `context-lost` durumuna geçilerek kullanıcıya "Görüntü yeniden hazırlanıyor..." bildirimi verilir.
   - `webglcontextrestored` olayı tetiklendiğinde GPU kaynakları sunucudan tekrar dosya indirmeden bellekten yeniden çizilir ve doğrudan `ready` durumuna dönülür.

5. **Gerçek Mobil Dokunma Güvenliği (N18):**
   - Çizim katmanında `touchAction: "none"`, `overscrollBehavior: "contain"` tanımlıdır (sayfa kayması önlenir).
   - Katman ve ayar panellerinde `touchAction: "pan-y"` tanımlıdır; mobil cihazda (ve Poco X6 Pro ekranında) sheet içinde kaydırma yapılırken alttaki CAD çiziminin kayması/pan olması engellenir.

## Değişiklik dökümü

| Dosya / sembol | Ekleme/değiştirme/silme | Neden / R | Önce/sonra hash veya SNAP | Korunan davranış |
|---|---|---|---|---|
| `src/components/dokumantasyon/cad-v2/cad-v2-host-shell.tsx` | Değiştirme | R23–R28, R30 gerçek host state machine, iptal, context loss | SNAP-0001 | Legacy kod değişmedi |
| `src/components/dokumantasyon/cad-v2/cad-v2-canvas.tsx` | Değiştirme | WebGL context loss ve restored listener'ları | SNAP-0001 | Korundu |
| `tests/cad-v2/host-lifecycle-cancellation.test.ts` | Ekleme | G12 host yaşam döngüsü ve iptal test paketi | Yeni dosya | İzolasyon korundu |
| `package.json` | Değiştirme | `check:cad-v2:ui` komutuna host lifecycle testinin eklenmesi | SNAP-0001 | Korundu |

## Test ve görsel kanıt

| R / UI | Gerçek komut/test | RUN / ART / SNAP | Sonuç | Eksik / sınırlama |
|---|---|---|---|---|
| R23–R28, R30 | `npx tsx tests/cad-v2/host-lifecycle-cancellation.test.ts` | RUN-0031 / SNAP-0001 | PASS (exit 0) | 5 test (State machine, Context loss recovery, Cancel teardown, Worker dispose, Touch isolation) geçti |
| UI | `npm run check:cad-v2:ui` | RUN-0032 / SNAP-0001 | PASS (exit 0) | Kamera etkileşim + gerçek sahne render (20x) + host lifecycle testleri geçti |
| Tip Kontrolü | `npx tsc --noEmit -p tsconfig.next.json` | RUN-0033 / SNAP-0001 | PASS (exit 0) | 0 hata |

## Başarısızlık ve düzeltmeler

Herhangi bir hata veya başarısızlık yaşanmadı; WebGL context loss ve restore mekanizması tarayıcı varsayılan çökme davranışını engelleyecek şekilde kuruldu.

## Açık CR / eksik / sonraki bağımlılık

Fiziksel Poco X6 Pro ve mobil Safari testleri kullanıcı aşamasında gerçek cihaz üzerinden denetlenecek; emülasyon cihaz testi yerine yazılmadı (NOT_RUN olarak bırakıldı). Sıradaki adım: G13 (Admin dosya menüsü ve Studio entegrasyonu).

## Uygulayıcı kapanışı

G12 paketi (Host state machine, gerçek prepare/manifest/chunk akışı, iptal ve unmount temizliği, 180s heartbeat ve mobil dokunma izolasyonu) başarıyla tamamlandı ve doğrulandı.
