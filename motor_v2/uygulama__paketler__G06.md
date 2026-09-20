# G06 — Uygulama paketi kaydı

[Dizin](README.md) · [Kayıt sözleşmesi](20_KAYIT_VE_KANIT_SISTEMI.md)

| Alan | Kayıt |
|---|---|
| Plan revizyonu / D / R / UI | EXEC-2 + U1/U2/U3 · D07, D13, D16 · R06, R12 · V13 · F07, F12 |
| G / SES / başlangıç SNAP / son SNAP | G06 · SES-20260919-07 · SNAP-0001 → SNAP-0001 |
| Uygulama durumu | IMPLEMENTER_VERIFIED |
| Bağımsız denetim | NOT_REVIEWED — yalnız Astra doldurur |
| Giriş koşulları ve gerçek kanıt | G05 (gerçek sahne ve render hattı) doğrulandı |

## Uygulanan davranış

1. **Blok ve INSERT Dönüşüm Motoru (BlockTransformer):**
   - `src/lib/cad-v2/compile/block-transformer.ts`:
     - 2D Affine transform matrisi: `translate(-basePoint) -> scale(sx, sy) -> rotate(rotationRad) -> translate(insertionPoint)`.
     - Negatif ölçekleme (aynalama/mirror) ve eşit olmayan (non-uniform) ölçekleme tam geometrik doğrulukla desteklenir.
     - **Katman 0 (Layer 0) Kalıtım Kuralı:** Blok tanımı içindeki `"0"` katmanındaki varlıklar, çağıran INSERT nesnesinin katmanını ve renk/çizgi kalınlığı özelliklerini miras alır; özel katmandaki varlıklar ise kendi katmanlarını korur.
     - **Donuk (Frozen) Katman Ayıklama:** Donuk katmanlardaki varlıklar derleme aşamasında ayıklanır.
     - **İçiçe (Nested) Bloklar:** Blok içindeki INSERT varlıkları kümülatif matris çarpımıyla hiyerarşik olarak açılır.
     - **Döngüsel (Cycle) ve Derinlik Koruması:** `ancestors: Set<string>` ve azami derinlik `maxDepth = 32` kontrolüyle sonsuz özyinelemeler (`A -> B -> A`) güvenle yakalanır ve atlanır.

2. **DWG Dekoder Katman ve Blok Ayrıştırması:**
   - `src/lib/cad-v2/decode/dwg-adapter.ts`:
     - `rawDb.tables.LAYER.entries` tablosundan 40 gerçek AutoCAD katmanı (renk ACI/RGB, görünürlük, donukluk, kilitlilik, çizgi türü ve kalınlığı) eksiksiz çıkarıldı.
     - `rawDb.tables.BLOCK_RECORD.entries` tablosundan 3.233 blok tanımı (kullanıcı blokları, mimari semboller vb.) ve bunların alt varlıkları çıkarılarak `CadBlockDefinition` sözleşmesine bağlandı.
     - R001 dosyasındaki 1.922 INSERT varlığı ve model alanındaki toplam 6.869 varlık tam çözüldü.

3. **Sahne Derleyicisi Entegrasyonu:**
   - `src/lib/cad-v2/compile/scene-compiler.ts`: `BlockTransformer` entegre edilerek `INSERT` varlıkları DV2SCN01 ikili parçalarına dahil edildi; BBox `[-13988.18, 728.81, 30525.93, 6581.66]` olarak doğru hesaplandı.

## Değişiklik dökümü

| Dosya / sembol | Ekleme/değiştirme/silme | Neden / R | Önce/sonra hash veya SNAP | Korunan davranış |
|---|---|---|---|---|
| `src/lib/cad-v2/compile/block-transformer.ts` | Ekleme | R06, R12 blok ve katman dönüştürücüsü | Yeni dosya | Bağımsız V2 |
| `src/lib/cad-v2/decode/dwg-adapter.ts` | Değiştirme | R06, R12 LAYER ve BLOCK_RECORD ayrıştırması | SNAP-0001 | Korundu |
| `src/lib/cad-v2/compile/scene-compiler.ts` | Değiştirme | R06 INSERT derleme entegrasyonu | SNAP-0001 | Korundu |
| `tests/cad-v2/block-layer-semantics.test.ts` | Ekleme | G06 analitik ve gerçek dosya testleri | Yeni dosya | İzolasyon korundu |
| `package.json` | Değiştirme | `check:cad-v2:unit` güncellemesi | SNAP-0001 | Korundu |

## Test ve görsel kanıt

| R / UI | Gerçek komut/test | RUN / ART / SNAP | Sonuç | Eksik / sınırlama |
|---|---|---|---|---|
| R06, R12 | `npx tsx tests/cad-v2/block-layer-semantics.test.ts` | RUN-0010 / SNAP-0001 | PASS (exit 0) | Analitik + R001 gerçek dosya geçti |
| Regresyon | `npm run check:cad-v2:release` | RUN-0011 / SNAP-0001 | PASS (exit 0) | G00–G06 tüm testler geçti |
| Tip Kontrolü | `npx tsc --noEmit -p tsconfig.next.json` | RUN-0012 / SNAP-0001 | PASS (exit 0) | 0 hata |

## Başarısızlık ve düzeltmeler

LibreDWG çıktısında katman tablosunun `tables.LAYER.entries`, blok tablosunun `tables.BLOCK_RECORD.entries` altında tutulduğu ve LINE varlıklarında `startPoint`/`endPoint`, INSERT varlıklarında `xScale`/`yScale`/`zScale` alanlarının kullanıldığı tespit edilerek adaptör bu alanları kapsayacak şekilde güçlendirildi.

## Açık CR / eksik / sonraki bağımlılık

Açık CR yoktur. Sıradaki adımlar: G07 (Yazı ve kaynak ölçülendirme doğruluğu) ve G08 (Eğri, hatch, çizgi ve çizim sırası).

## Uygulayıcı kapanışı

G06 paketi (blok dönüştürücüsü, katman 0 kalıtımı, döngü koruması, 40 katman ve 3.233 blok tanımı) başarıyla tamamlandı ve doğrulandı.
