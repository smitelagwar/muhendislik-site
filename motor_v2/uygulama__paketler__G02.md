# G02 — Uygulama paketi kaydı

[Dizin](README.md) · [Kayıt sözleşmesi](20_KAYIT_VE_KANIT_SISTEMI.md)

| Alan | Kayıt |
|---|---|
| Plan revizyonu / D / R / UI | EXEC-2 + U1/U2/U3 · D04, D05, D06 · R03, R04, R15, R39 |
| G / SES / başlangıç SNAP / son SNAP | G02 · SES-20260919-01 · SNAP-0001 → SNAP-0001 |
| Uygulama durumu | IMPLEMENTER_VERIFIED |
| Bağımsız denetim | NOT_REVIEWED — yalnız Astra doldurur |
| Giriş koşulları ve gerçek kanıt | G00 ve G01 tamamlandı; libredwg-web 0.7.10 ve data-model 1.14.2 doğrulandı |

## Uygulanan davranış

- DWG decoder adapter'ı (`src/lib/cad-v2/decode/dwg-adapter.ts`) oluşturuldu. `@mlightcad/libredwg-web 0.7.10` ile DWG ayrıştırma, `dwg_get_version_type` ile sürüm ve hata kontrolü, `convert` ile veritabanı dönüşümü ve `finally` bloğunda `dwg_free` ile WASM bellek temizliği sağlandı.
- DXF decoder adapter'ı (`src/lib/cad-v2/decode/dxf-adapter.ts`) oluşturuldu. `@mlightcad/data-model 1.14.2` `AcDbNativeDxfConverter`, `AcDbDatabase` ve `acdbAssignWorkingDatabase` ile ASCII/Binary DXF ayrıştırma ve model space varlık taraması sağlandı.
- R001 DWG ve bilinen DXF test fixture'ı üzerinde otomatik test çalıştırıldı; negatif bozuk DWG testi yapıldı.

## Değişiklik dökümü

| Dosya / sembol | Ekleme/değiştirme/silme | Neden / R | Önce/sonra hash veya SNAP | Korunan davranış |
|---|---|---|---|---|
| `src/lib/cad-v2/canonical/types.ts` | Ekleme | Kanonik 2D model sözleşmesi | Yeni dosya | Bağımsız V2 |
| `src/lib/cad-v2/decode/dwg-adapter.ts` | Ekleme | R03 DWG okuyucu adapter | Yeni dosya | Bağımsız V2 |
| `src/lib/cad-v2/decode/dxf-adapter.ts` | Ekleme | R04 DXF okuyucu adapter | Yeni dosya | Bağımsız V2 |
| `tests/cad-v2/compiler-decode.test.ts` | Ekleme | G02 test paketi | Yeni dosya | İzolasyon korundu |

## Test ve görsel kanıt

| R / UI | Gerçek komut/test | RUN / ART / SNAP | Sonuç | Eksik / sınırlama |
|---|---|---|---|---|
| R03, R04, R15 | `npx tsx tests/cad-v2/compiler-decode.test.ts` | RUN-0003 / SNAP-0001 | PASS (exit 0) | — |

## Başarısızlık ve düzeltmeler

Bozuk DWG negatif testinde `dwg_get_version_type` entegre edilerek INVALIDDWG bitmask kontrolü ve No DWG reddi sağlandı.

## Açık CR / eksik / sonraki bağımlılık

Açık CR yoktur. Sıradaki adım G03 (Canonical veri ve binary protokol entegrasyonu tamamlandı) ve G04 (Arayüz ve erken etkileşim kapısı).

## Uygulayıcı kapanışı

G02 başarıyla tamamlandı ve test edildi.
