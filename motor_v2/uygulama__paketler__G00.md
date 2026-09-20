# G00 — Uygulama paketi kaydı

[Dizin](README.md) · [Kayıt sözleşmesi](20_KAYIT_VE_KANIT_SISTEMI.md)

| Alan | Kayıt |
|---|---|
| Plan revizyonu / D / R / UI | EXEC-2 + U1/U2/U3 · D01, D23 · R01, R40, R41 |
| G / SES / başlangıç SNAP / son SNAP | G00 · SES-20260919-01 · SNAP-0001 → SNAP-0001 |
| Uygulama durumu | IMPLEMENTER_VERIFIED |
| Bağımsız denetim | NOT_REVIEWED — yalnız Astra doldurur |
| Giriş koşulları ve gerçek kanıt | Git HEAD: 7703d24db8afd0392c1038601a3b929a2d097ac4, 4 korunan dosya birebir eş, R001–R004 corpus mevcut ve hash doğrulandı |

## Uygulanan davranış

- Korunan 4 çekirdek dosyanın (`cad-runtime-orchestrator.tsx`, `cad-upstream-viewer.tsx`, `cad-viewer.tsx`, `dxf-viewer-worker.ts`) parmak izleri kontrol edildi ve korundu.
- Gerçek corpus dosyalarının (`R001`, `R002`, `R003`, `R004`) fiziksel varlığı, dosya boyutları ve SHA-256 hash'leri teyit edildi.
- `tests/cad-v2/fixtures-manifest.json` oluşturularak R001-R004 ve sentetik test fixture'ları kataloglandı.
- Test veri izolasyonu (.data/dok_db.json korunması) teyit edildi.
- Tüm sabit bağımlılıkların (`three 0.172.0`, `d3-zoom 3.0.0`, `@mlightcad/libredwg-web 0.7.10`, vb.) kurulu kilitli sürümleri doğrulandı.

## Değişiklik dökümü

| Dosya / sembol | Ekleme/değiştirme/silme | Neden / R | Önce/sonra hash veya SNAP | Korunan davranış |
|---|---|---|---|---|
| `tests/cad-v2/fixtures-manifest.json` | Ekleme | R40, R41 fixture manifesti | Yeni dosya | Mevcut testler etkilenmedi |
| `scripts/cad-v2/check-cad-v2-g00-baseline.ts` | Ekleme | G00 otomatik baseline doğrulama | Yeni dosya | Salt okunur kontrol |

## Test ve görsel kanıt

| R / UI | Gerçek komut/test | RUN / ART / SNAP | Sonuç | Eksik / sınırlama |
|---|---|---|---|---|
| R01, R40, R41 | `npx tsx scripts/cad-v2/check-cad-v2-g00-baseline.ts` | RUN-0001 / SNAP-0001 | PASS (exit 0) | Yok; tüm kontroller birebir geçti |

## Başarısızlık ve düzeltmeler

Herhangi bir hata veya uyumsuzluk yaşanmadı; tüm hash'ler ve sürümler kilit belgelerle tam uyumludur.

## Açık CR / eksik / sonraki bağımlılık

Açık CR yoktur. Sıradaki adım G01 (Mevcut motorun gerçek baseline ölçümü) ve G02/G03/G04 geliştirme adımlarıdır.

## Uygulayıcı kapanışı

G00 çıkış koşulları başarıyla sağlandı ve otomatik testle kanıtlandı.
