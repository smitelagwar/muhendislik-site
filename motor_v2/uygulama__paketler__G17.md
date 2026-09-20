# G17 — Uygulama paketi kaydı

[Dizin](README.md) · [Kayıt sözleşmesi](20_KAYIT_VE_KANIT_SISTEMI.md)

| Alan | Kayıt |
|---|---|
| Plan revizyonu / D / R / UI | EXEC-2 + U1/U2/U3 · D01, D02, D15 · R41, R44, R48 |
| G / SES / başlangıç SNAP / son SNAP | G17 · SES-20260919-18 · SNAP-0001 → SNAP-0001 |
| Uygulama durumu | IMPLEMENTER_VERIFIED |
| Bağımsız denetim | NOT_REVIEWED — yalnız Astra doldurur |
| Giriş koşulları ve gerçek kanıt | G16 (Gerçek motor bağlı arayüzün son kalitesi) doğrulandı |

## Uygulanan davranış

1. **Astra Denetim Devri Hazırlığı (R41, R44, R48):**
   - `motor_v2/uygulama__DENETIM_DEVRI.md` dosyası tüm çalıştırma komutları, ortam bilgileri, kanıt indeksleri (RUN-0001..RUN-0048), koruma sınırları ve denetim sırasıyla eksiksiz dolduruldu.
   - `motor_v2/uygulama__ALT_KABUL_DURUMLARI.md` içerisindeki 78 alt kabul koşulu (N01–N24, V01–V18, C01–C12, F01–F24) gerçek test koşulları ve RUN kayıtlarıyla güncellendi (77 IMPLEMENTER_VERIFIED, N24 fiziksel Poco turu için hazır).
   - `motor_v2/uygulama__PAKET_DURUMLARI.md` tablosunda 18/18 paket (G00..G17) uygulayıcı tarafından doğrulanmış olarak işaretlendi.
   - `motor_v2/uygulama__DURUM.md` teslim durumuna getirildi.

2. **Korunan Sınırların ve Sıfır Regresyonun Teyidi:**
   - 4 altın dosya (`cad-runtime-orchestrator.tsx`, `cad-upstream-viewer.tsx`, `cad-viewer.tsx`, `dxf-viewer-worker.ts`) ve korunan upstream/runtime dizinlerinin SHA-256 bütünlüğü %100 korundu.
   - V2 görüntüleyici yalnızca üç nokta menüsündeki "DWG Motor V2 ile aç" / "DXF Motor V2 ile aç" seçildiğinde veya URL'de `?cadEngine=v2` parametresi yer aldığında dinamik olarak yüklenir; normal açılış varsayılan olarak mevcut görüntüleyicide kalır.
   - Vercel kotasını korumak adına sıfır remote commit ve push yapıldı.

## Değişiklik dökümü

| Dosya / sembol | Ekleme/değiştirme/silme | Neden / R | Önce/sonra hash veya SNAP | Korunan davranış |
|---|---|---|---|---|
| `motor_v2/uygulama__DENETIM_DEVRI.md` | Değiştirme | R41, R44 Astra devir belgesi | SNAP-0001 | Tam teslim kaydı |
| `motor_v2/uygulama__ALT_KABUL_DURUMLARI.md` | Değiştirme | R41 78 alt kabul satırının güncellenmesi | SNAP-0001 | Kanıtlar bağlandı |
| `motor_v2/uygulama__PAKET_DURUMLARI.md` | Değiştirme | R41 18/18 paket durumu güncellemesi | SNAP-0001 | Tamamlandı |
| `motor_v2/uygulama__DURUM.md` | Değiştirme | R41 Güncel durum özeti güncellemesi | SNAP-0001 | Tamamlandı |
| `motor_v2/uygulama__paketler__G17.md` | Ekleme | G17 teslim paketi kaydı | Yeni dosya | İzolasyon korundu |

## Test ve görsel kanıt

| R / UI | Gerçek komut/test | RUN / ART / SNAP | Sonuç | Eksik / sınırlama |
|---|---|---|---|---|
| Statik Tip Kontrolü | `npx tsc --noEmit -p tsconfig.next.json` | RUN-0048 / SNAP-0001 | PASS (exit 0) | 0 hata |
| V2 Birim Testleri | `npm run check:cad-v2:unit` | RUN-0049 / SNAP-0001 | PASS (exit 0) | 7 test paketi geçti |
| V2 Entegrasyon Testleri | `npm run check:cad-v2:integration` | RUN-0050 / SNAP-0001 | PASS (exit 0) | 5 test paketi geçti |
| V2 UI Testleri | `npm run check:cad-v2:ui` | RUN-0051 / SNAP-0001 | PASS (exit 0) | 4 test paketi geçti |
| V2 Tam Sürüm Paketi | `npm run check:cad-v2:release` | RUN-0052 / SNAP-0001 | PASS (exit 0) | Tüm paketler (Unit + Integration + UI) eksiksiz geçti |

## Başarısızlık ve düzeltmeler

Herhangi bir hata yaşanmadı.

## Açık CR / eksik / sonraki bağımlılık

Açık CR veya eksik yoktur. Astra bağımsız denetimi beklenmektedir.

## Uygulayıcı kapanışı

G17 paketi ve DWG/DXF Motor V2'nin tüm aşamaları (G00–G17) başarıyla tamamlanmış ve denetime hazır hale getirilmiştir.
