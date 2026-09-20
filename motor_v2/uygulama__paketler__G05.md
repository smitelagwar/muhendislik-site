# G05 — Uygulama paketi kaydı

[Dizin](README.md) · [Kayıt sözleşmesi](20_KAYIT_VE_KANIT_SISTEMI.md)

| Alan | Kayıt |
|---|---|
| Plan revizyonu / D / R / UI | EXEC-2 + U1/U2/U3 · D07, D13, D14, D16, D21 · R21, R22, R24, R45 · V01, V02, V03, V04, V17 |
| G / SES / başlangıç SNAP / son SNAP | G05 · SES-20260919-01 · SNAP-0001 → SNAP-0001 |
| Uygulama durumu | IMPLEMENTER_VERIFIED |
| Bağımsız denetim | NOT_REVIEWED — yalnız Astra doldurur |
| Giriş koşulları ve gerçek kanıt | G02 (dekoderler), G03 (protokol), G04-A (UI kabuğu), G04-B (D3/Three kamera kapısı) doğrulandı |

## Uygulanan davranış

1. **Sahne Derleyicisi (Scene Compiler):**
   - `src/lib/cad-v2/compile/scene-compiler.ts`: `CadCanonicalDocument` nesnesini DV2SCN01 ikili formatında parçalara (`chunk_model_001.bin`) ve sahne manifestine (`manifest.json`) derler.
   - LINE, CIRCLE (32 segment), ARC (açısal süpürme hesabı), LWPOLYLINE varlıklarını Float64 BBox hesaplayarak Float32 lokal tepe noktalarına ve Float64 orijine dönüştürür.
   - Doğrulanmış manifest ve SHA-256 hash'leri üretir.

2. **Bağımsız CLI Derleyici:**
   - `scripts/cad-v2/run-v2-compiler-cli.ts`: DWG veya DXF kaynak dosyasını okur, otomatik tür algılamasıyla `@mlightcad/libredwg-web` veya `@mlightcad/data-model` üzerinden decode eder, DV2SCN01 parçalarına ve manifest'e dönüştürür.
   - R001 (5.065 varlık, 1.666 ms), R002 (283 varlık, 1.557 ms) ve R004 (55 MB DXF, 131.655 varlık, 3.075 ms) başarıyla derlendi.

3. **Web Worker ve İstemci Yöneticisi:**
   - `src/workers/cad-v2/cad-v2-scene-worker.ts`: Arka planda DV2SCN01 ikili parçalarını doğrular, `ORIGIN`, `XY`, `DRAW_RUNS` ve `META` bölümlerini ayıklar ve `Transferable` ArrayBuffer kullanarak sıfır kopyalama (zero-copy) ile ana iş parçacığına aktarır.
   - `src/lib/cad-v2/worker/worker-client.ts`: Oturum kimliği (`viewSessionId`), nesil takibi (`generation`), iptal güvenliği (`advanceGeneration`) ve temiz unmount (`dispose`) sağlar.

4. **WebGL2 Three.js Renderer Parça Desteği:**
   - `src/lib/cad-v2/render/cad-v2-renderer.ts`: `addSceneChunk`, `removeSceneChunk` ve `clearChunks` metotları eklendi.
   - Kamera-bağıl Float64->Float32 ofsetleme: Her parça dünya orijininden kamera merkezini Float64 olarak çıkarır ve GPU'ya küçük rölatif konum verir (1e9 orijinde dahi sıfır hassasiyet kaybı).
   - Tek kirli frame (dirty-frame) RAF planlayıcısı; 20 ardışık aç/kapat döngüsünde 0,12 MB heap deltası (tam bellek platosu, sızıntı yok).

## Değişiklik dökümü

| Dosya / sembol | Ekleme/değiştirme/silme | Neden / R | Önce/sonra hash veya SNAP | Korunan davranış |
|---|---|---|---|---|
| `src/lib/cad-v2/compile/scene-compiler.ts` | Ekleme | D13, G05 sahne derleyicisi | Yeni dosya | Bağımsız V2 |
| `scripts/cad-v2/run-v2-compiler-cli.ts` | Ekleme | G05 bağımsız CLI derleyici | Yeni dosya | Bağımsız V2 |
| `src/workers/cad-v2/cad-v2-scene-worker.ts` | Ekleme | D14, R21 arka plan sahne worker'ı | Yeni dosya | Bağımsız V2 |
| `src/lib/cad-v2/worker/worker-client.ts` | Ekleme | R24, R27 worker istemci yöneticisi | Yeni dosya | Bağımsız V2 |
| `src/lib/cad-v2/render/cad-v2-renderer.ts` | Değiştirme | R22, R24 parça çizimi ve bellek temizliği | SNAP-0001 | Korundu |
| `tests/cad-v2/real-scene-render.test.ts` | Ekleme | G05 uçtan uca doğrulama paketi | Yeni dosya | İzolasyon korundu |
| `package.json` | Değiştirme | `check:cad-v2:*` ve `compile:cad-v2` komutları | SNAP-0001 | Korundu |

## Test ve görsel kanıt

| R / UI | Gerçek komut/test | RUN / ART / SNAP | Sonuç | Eksik / sınırlama |
|---|---|---|---|---|
| R21, R22, R24, R45 | `npm run check:cad-v2:unit` | RUN-0006 / SNAP-0001 | PASS (exit 0) | TEXT/HATCH sonraki paketlerde |
| R21, R22 | `npm run check:cad-v2:integration` | RUN-0007 / SNAP-0001 | PASS (exit 0) | R001 derleme ve SHA-256 doğrulandı |
| R21–R24 | `npm run check:cad-v2:release` | RUN-0008 / SNAP-0001 | PASS (exit 0) | Tam regresyon geçti |
| Statik Tip | `npx tsc --noEmit -p tsconfig.next.json` | RUN-0009 / SNAP-0001 | PASS (exit 0) | 0 hata |

## Başarısızlık ve düzeltmeler

1. `three.d.ts` içinde `Material` ve `BufferAttribute` bildirimleri eksik olduğu için `cad-upstream/adapter.ts` ile çakışma yaşandı; `Material` ve `BufferAttribute` sınıfları genişletilerek `tsc --noEmit` hatasız hale getirildi.
2. Worker göreli import yolunda `../../` yerine `../../../` düzeltmesi yapıldı.

## Açık CR / eksik / sonraki bağımlılık

Açık CR yoktur. Sıradaki adımlar: G06 (Blok, stil ve katman semantiği) ve G07 (Yazı ve kaynak ölçülendirme doğruluğu).

## Uygulayıcı kapanışı

G05 paketi (gerçek sahne derleyicisi, bağımsız CLI, Web Worker parça ayrıştırıcı ve Three.js parça çizimi) başarıyla tamamlandı ve doğrulandı.
