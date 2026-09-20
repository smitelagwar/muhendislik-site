# G01 — Uygulama paketi kaydı

[Dizin](README.md) · [Kayıt sözleşmesi](20_KAYIT_VE_KANIT_SISTEMI.md)

| Alan | Kayıt |
|---|---|
| Plan revizyonu / D / R / UI | EXEC-2 + U1/U2/U3 · D01, D02 · R29, R31 |
| G / SES / başlangıç SNAP / son SNAP | G01 · SES-20260919-01 · SNAP-0001 → SNAP-0001 |
| Uygulama durumu | IMPLEMENTER_VERIFIED |
| Bağımsız denetim | NOT_REVIEWED — yalnız Astra doldurur |
| Giriş koşulları ve gerçek kanıt | G00 tamamlandı; R001–R004 gerçek dosyaları hazır ve hash doğrulandı |

## Uygulanan davranış

- R001, R002, R003 (DWG AC1032) ve R004 (DXF AC1021) gerçek çizim dosyaları üzerinde dosya boyutu, disk okuma süresi, bellek tüketimi ve format magic başlıkları ölçüldü.
- Ölçüm sonuçları `tests/cad-v2/legacy-baseline-metrics.json` dosyasına kaydedildi.
- Production çekirdeğine herhangi bir enstrümantasyon eklenmeden dış harness ile baseline oluşturuldu.

## Değişiklik dökümü

| Dosya / sembol | Ekleme/değiştirme/silme | Neden / R | Önce/sonra hash veya SNAP | Korunan davranış |
|---|---|---|---|---|
| `scripts/cad-v2/measure-legacy-baseline.ts` | Ekleme | R29, R31 legacy baseline harness | Yeni dosya | Çekirdek motor değişmedi |
| `tests/cad-v2/legacy-baseline-metrics.json` | Ekleme | Baseline metrikleri kaydı | Yeni dosya | İzolasyon korundu |

## Test ve görsel kanıt

| R / UI | Gerçek komut/test | RUN / ART / SNAP | Sonuç | Eksik / sınırlama |
|---|---|---|---|---|
| R29, R31 | `npx tsx scripts/cad-v2/measure-legacy-baseline.ts` | RUN-0002 / SNAP-0001 | PASS (exit 0) | Referans CAD programı kurulu olmadığı için görsel oracle NOT_RUN |

## Başarısızlık ve düzeltmeler

Herhangi bir hata oluşmadı.

## Açık CR / eksik / sonraki bağımlılık

Açık CR yoktur. Sıradaki adım G02 (DWG ve DXF ayrıştırıcı adapter'ları).

## Uygulayıcı kapanışı

G01 baseline ölçümü tamamlandı ve kaydedildi.
