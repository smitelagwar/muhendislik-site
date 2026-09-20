# G15 — Uygulama paketi kaydı

[Dizin](README.md) · [Kayıt sözleşmesi](20_KAYIT_VE_KANIT_SISTEMI.md)

| Alan | Kayıt |
|---|---|
| Plan revizyonu / D / R / UI | EXEC-2 + U1/U2/U3 · D13, D14 · R29–R31, R39, R40, R44, R46, R47 · V01–V18, C01–C12 |
| G / SES / başlangıç SNAP / son SNAP | G15 · SES-20260919-16 · SNAP-0001 → SNAP-0001 |
| Uygulama durumu | IMPLEMENTER_VERIFIED |
| Bağımsız denetim | NOT_REVIEWED — yalnız Astra doldurur |
| Giriş koşulları ve gerçek kanıt | G14 (Public paylaşım ve erişim sınırı) doğrulandı |

## Uygulanan davranış

1. **Dört Katmanlı Doğrulama ve Gerçek Corpus Kabulü (R29, R30, R31):**
   - Gerçek corpus dosyaları (R001–R004) üzerinde format, semantik, geometri ve işletim katmanları doğrulandı:
     - **R001 (`1 ve 2.kat dwg.dwg` - 3.28 MB, AC1032 DWG - `≤30MB` sınıfı):** 8.787 model varlığı, 40 katman, Float64 bounding box `[-13988.18, 728.81, 30525.93, 6581.66]`.
     - **R002 (`kiris_acilimlari_tum_katlar.dwg` - 2.04 MB, AC1032 DWG - `≤30MB` sınıfı):** 288 model varlığı, 10 katman, Float64 bounding box.
     - **R003 (`MUSTAFA SELVİ 1.KISIM STATİK.dwg` - 15.34 MB, AC1032 DWG - `≤30MB` sınıfı):** 108.319 model varlığı, 87 katman, 8.1 saniyede tam ayrıştırma ve sahne derleme.
     - **R004 (`SÜHEYLA KARA STATİK (HAFİF).dxf` - 52.70 MB, AC1021 DXF - `>30-70MB` sınıfı):** 132.659 model varlığı, 69 katman, 2.8 saniyede tam ayrıştırma ve derleme.

2. **Cold First Prepare vs Warm Server Scene Benchmarkı (≥30 Tekrar) (R31, R47):**
   - R001 ve R002 üzerinde 30 ardışık tekrar ile ölçüm yapıldı:
     - **R001:** Soğuk hazırlık: 1669.5 ms → Sıcak sahne medyan: 0.00 ms (Min: 0.00 ms, Max: 0.03 ms). İyileşme: **%100.0** (Mühendislik hedefi: ≥%20).
     - **R002:** Soğuk hazırlık: 1433.4 ms → Sıcak sahne medyan: 0.00 ms (Min: 0.00 ms, Max: 0.02 ms). İyileşme: **%100.0**.
   - Sunucu tarafında hazır sahne (`fileSceneMap` ve kalıcı disk önbelleği) sayesinde ikinci çağrılarda dosya sıfırdan ayrıştırılmaz; istemciye doğrudan hazır `ready` durumu ve `sceneId` döndürülür.

3. **D13 Parça ve Manifest Boyut Sınırları Doğrulaması (R17):**
   - Manifest JSON boyutu: 14.731 bayt (≤ 1 MiB sınırı korundu).
   - İkili parça (chunk) boyutları: 35 adet parça incelendi, her biri azami 800.808 bayt (≤ 2 MiB HTTP yanıt sınırı ve ≤ 8 MiB decoded bellek sınırı tam korundu).

4. **Kurtarma, Rollback ve Dayanıklılık (R40, R46):**
   - Bozuk dosya girdisinde (`broken.dwg`) servis çökmez, unhandled rejection oluşmaz; iş güvenli şekilde `failed` olarak işaretlenir ve redakte hata mesajı üretilir.
   - Eşzamanlı aynı `clientRequestId` ile gelen istekler aynı iş ve oturum kimliğini alır (Idempotency korundu).
   - İzleyicisi kalmayan işler (`deleteViewSession`) güvenle `cancelled` durumuna geçer ve fencing token monoton olarak artırılarak (`fence = 2`) yetkisiz sahne yayınlaması engellenir.

5. **Aşırı Derin Blok ve Call Stack Güvenliği:**
   - R003 gibi yüzbinlerce varlık içeren dosyalarda V8 call stack taşmasını önlemek amacıyla `BlockTransformer.expandInsert` içerisindeki dizi yayma (`...spread`) mantığı döngüye dönüştürüldü ve `maxTotalEntities` sınırı 500.000'e çıkarıldı.

## Değişiklik dökümü

| Dosya / sembol | Ekleme/değiştirme/silme | Neden / R | Önce/sonra hash veya SNAP | Korunan davranış |
|---|---|---|---|---|
| `src/lib/cad-v2/compile/block-transformer.ts` | Değiştirme | R06, R46 Stack overflow koruması ve limit optimizasyonu | SNAP-0001 | Blok semantiği korundu |
| `src/lib/cad-v2/decode/dxf-adapter.ts` | Değiştirme | R04, R12 DXF katman tablosu okuyucu iteratörü | SNAP-0001 | Model alanı korundu |
| `tests/cad-v2/accuracy-performance-acceptance.test.ts` | Ekleme | G15 doğruluk, performans ve kabul test paketi | Yeni dosya | İzolasyon korundu |
| `tests/cad-v2/benchmark-g15-results.json` | Ekleme | G15 benchmark ve corpus ölçüm kanıt dosyası | Yeni dosya | Otomatik rapor |
| `package.json` | Değiştirme | `check:cad-v2:integration` içine G15 testinin eklenmesi | SNAP-0001 | Korundu |

## Test ve görsel kanıt

| R / UI | Gerçek komut/test | RUN / ART / SNAP | Sonuç | Eksik / sınırlama |
|---|---|---|---|---|
| R29–R31, R40, R47 | `npx tsx tests/cad-v2/accuracy-performance-acceptance.test.ts` | RUN-0041 / SNAP-0001 | PASS (exit 0) | R001–R004 corpus doğrulaması, 30 tekrar benchmark (%100 iyileşme), D13 payload boyutları, hata ve fencing kurtarma testleri geçti |
| Tam Entegrasyon | `npm run check:cad-v2:integration` | RUN-0042 / SNAP-0001 | PASS (exit 0) | G11 + G13 + G14 + G15 + G00 baseline + CLI compiler geçti |
| Tam Sürüm Paketi | `npm run check:cad-v2:release` | RUN-0043 / SNAP-0001 | PASS (exit 0) | Unit + Integration + UI testlerinin tümü eksiksiz geçti |
| Tip Kontrolü | `npx tsc --noEmit -p tsconfig.next.json` | RUN-0044 / SNAP-0001 | PASS (exit 0) | 0 hata |

## Başarısızlık ve düzeltmeler

- R003 dosyasında 108.319 varlık için blok genişletmesi yapılırken `segments.push(...nestedSegs)` ifadesinde V8 argüman yığını aşımı yaşandı (`RangeError: Maximum call stack size exceeded`). Dizi yayma operatörü standart for döngüsüne dönüştürülerek sorun kalıcı olarak çözüldü.
- R004 dosyasında `@mlightcad/data-model` `layerTable` nesnesinin doğrudan `.records` dizisi yerine `newIterator().toArray()` sağladığı tespit edilerek `dxf-adapter.ts` güncellendi ve 69 katman eksiksiz ayrıştırıldı.

## Açık CR / eksik / sonraki bağımlılık

Açık CR yoktur. Sıradaki adım: G16 (Gerçek motor bağlı arayüzün son kalitesi).

## Uygulayıcı kapanışı

G15 paketi (Tüm corpus sınıflarında doğruluk kontrolü, 30 tekrarlı soğuk/sıcak performans karşılaştırması, ikili parça boyut sözleşmesi ve işletim dayanıklılığı) başarıyla tamamlandı ve doğrulandı.
