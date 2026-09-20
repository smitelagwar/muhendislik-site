# G13 — Uygulama paketi kaydı

[Dizin](README.md) · [Kayıt sözleşmesi](20_KAYIT_VE_KANIT_SISTEMI.md)

| Alan | Kayıt |
|---|---|
| Plan revizyonu / D / R / UI | EXEC-2 + U1/U2/U3 · D02, D15 · R02, R36, R38 · F01, F18, F21 |
| G / SES / başlangıç SNAP / son SNAP | G13 · SES-20260919-14 · SNAP-0001 → SNAP-0001 |
| Uygulama durumu | IMPLEMENTER_VERIFIED |
| Bağımsız denetim | NOT_REVIEWED — yalnız Astra doldurur |
| Giriş koşulları ve gerçek kanıt | G12 (host, iptal ve gerçek mobil davranış) doğrulandı |

## Uygulanan davranış

1. **Admin Dosya Menüsü Entegrasyonu (D02, R02, R36):**
   - `src/components/dokumantasyon/file-manager.tsx`:
     - Hem liste (`renderFileRow`) hem de ızgara (`renderFileCard`) görünümündeki üç nokta açılır menüsüne (dropdown menu) DWG ve DXF dosyaları için özel menü öğesi eklendi:
       - `.dwg` dosyaları için: **"DWG Motor V2 ile aç"**
       - `.dxf` dosyaları için: **"DXF Motor V2 ile aç"**
     - Tıklandığında `router.push("/dokumantasyon/dosya/${file.id}?cadEngine=v2")` rotasına yönlendirir.
     - PDF, resim, metin dosyaları veya klasörler için bu menü öğesi kesinlikle görüntülenmez (format allowlist koruması).
     - Dosyaya çift tıklama veya "Önizle / Studio" seçildiğinde normal varsayılan rota (`/dokumantasyon/dosya/${file.id}`) çağrılır; kullanıcı mevcut kararlı görüntüleyicide kalmaya devam eder.

2. **Document Studio ve Sayfa Yönlendirmesi (D15, R38):**
   - `src/app/dokumantasyon/dosya/[fileId]/page.tsx`:
     - URL'deki `searchParams` (`cadEngine`) okunur ve `DocumentStudioShell` bileşenine iletilir.
   - `src/components/dokumantasyon/studio/document-studio-shell.tsx`:
     - `DokCadV2Viewer` (`CadV2HostShell`) `next/dynamic` ile `ssr: false` olarak yüklenir.
     - `previewKind === "cad"` durumunda:
       - Eğer `cadEngine === "v2"` ise `DokCadV2Viewer` açılır.
       - Eğer `cadEngine !== "v2"` ise mevcut çalışan `DokCadViewer` (legacy orchestrator) birebir çalışır.
     - V2 seçilmemişken V2 JS, Web Worker veya Three.js paketleri ilk bundle'a sızmaz (sıfır bayt ek yük).

## Değişiklik dökümü

| Dosya / sembol | Ekleme/değiştirme/silme | Neden / R | Önce/sonra hash veya SNAP | Korunan davranış |
|---|---|---|---|---|
| `src/components/dokumantasyon/file-manager.tsx` | Değiştirme | R02, R36 liste ve grid üç nokta menüsünde Motor V2 seçeneği | SNAP-0001 | Normal açılış aynı kaldı |
| `src/app/dokumantasyon/dosya/[fileId]/page.tsx` | Değiştirme | R38 searchParams üzerinden cadEngine parametresi aktarımı | SNAP-0001 | Korundu |
| `src/components/dokumantasyon/studio/document-studio-shell.tsx` | Değiştirme | R38 dynamic DokCadV2Viewer seçimi | SNAP-0001 | Legacy CAD motoru dokunulmadı |
| `tests/cad-v2/admin-menu-routing.test.ts` | Ekleme | G13 menü allowlist ve routing test paketi | Yeni dosya | İzolasyon korundu |
| `package.json` | Değiştirme | `check:cad-v2:integration` komutuna G13 testinin eklenmesi | SNAP-0001 | Korundu |

## Test ve görsel kanıt

| R / UI | Gerçek komut/test | RUN / ART / SNAP | Sonuç | Eksik / sınırlama |
|---|---|---|---|---|
| R02, R36, R38 | `npx tsx tests/cad-v2/admin-menu-routing.test.ts` | RUN-0034 / SNAP-0001 | PASS (exit 0) | 6 test (DWG/DXF menu allowlist, non-CAD rejection, cadEngine routing, legacy fallback) geçti |
| Entegrasyon | `npm run check:cad-v2:integration` | RUN-0035 / SNAP-0001 | PASS (exit 0) | G11 durable + G13 menu + G00 baseline + CLI compiler geçti |
| Tip Kontrolü | `npx tsc --noEmit -p tsconfig.next.json` | RUN-0036 / SNAP-0001 | PASS (exit 0) | 0 hata |

## Başarısızlık ve düzeltmeler

Herhangi bir hata veya gerileme yaşanmadı.

## Açık CR / eksik / sonraki bağımlılık

Açık CR yoktur. Sıradaki adım: G14 (Public paylaşım ve erişim sınırı).

## Uygulayıcı kapanışı

G13 paketi (Admin dosya menüsü, DWG/DXF allowlist'i, cadEngine=v2 routing'i ve DocumentStudioShell dinamik motor ayrımı) başarıyla tamamlandı ve doğrulandı.
