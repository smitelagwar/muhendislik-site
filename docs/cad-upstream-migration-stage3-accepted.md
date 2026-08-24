# CAD Upstream Migration — Aşama 3 Stable Adapter (Kabul Edilmiş Tarihsel Kayıt)

Tarih: 23 Ağustos 2026

Branch: `feat/cad-upstream-transplant`

> Bu dosya Aşama 3 tamamlandığı andaki sözleşmenin tarihsel kaydıdır. Aşama 6 gerçek DWG corpus testleri sonucunda upstream dependency sürümleri daha sonra yükseltilebilir; bu kayıt aktif dependency pin kaynağı değildir.

## Amaç

Aşama 2'de doğrulanan MLightCAD upstream çekirdeğini site koduna **fork etmeden**, custom DXF/DWG parser veya renderer yazmadan ve mevcut production CAD davranışını değiştirmeden stable bir adapter sınırının arkasına almak.

Bu aşama henüz `/dokumantasyon` runtime seçimini değiştirmez. Mevcut `cad-viewer.tsx`, `dxf-viewer-worker.ts`, `dwg-dxf-conversion-worker.ts`, APS viewer ve `src/lib/dokumantasyon/dwg/**` rollback yüzeyi olarak aynen korunur.

## Aşama 3'te kullanılan başlangıç dependency sözleşmesi

Aşama 3 kabulü sırasında kullanılan sürümler:

- `@mlightcad/cad-simple-viewer` = `1.6.0`
- `@mlightcad/data-model` = `1.13.0`
- `@mlightcad/libredwg-converter` = `3.13.0`

Bunlar tarihsel başlangıç pinleridir. Daha sonraki aşamalarda gerçek corpus ile kanıtlanan upstream upgrade bu değerleri supersede edebilir.

## Adapter sınırı

`src/lib/dokumantasyon/cad-upstream/adapter.ts`:

1. `@mlightcad/cad-simple-viewer` modülünü lazy import eder,
2. upstream örneğindeki gibi `AcDbLibreDwgConverter` kaydeder,
3. LibreDWG parser worker ve MTEXT worker URL'lerini tek yerde tanımlar,
4. `AcApDocManager.checkWebworkerReadiness()` ile create öncesi readiness doğrular,
5. `AcApDocManager.createInstance()` ile viewer çekirdeğini başlatır,
6. açılış öncesinde `manager.areWorkersReady()` kontrolünü tekrarlar,
7. access URL'den ham `ArrayBuffer` alır ve doğrudan `openDocument()` çağırır,
8. DXF içeriğini yeniden yazmaz, normalize etmez veya custom fidelity katmanından geçirmez,
9. `manager.destroy()` ile singleton/view kaynaklarını deterministik kapatır.

Adapter yalnız `.dxf` ve `.dwg` kabul eder. Fallback seçimi adapter'ın sorumluluğu değildir; bu seçim Aşama 5 runtime orkestrasyonunda yapılacaktır.

## Runtime asset sözleşmesi

Next.js/Vercel build'i Vite `static-copy` kullanmadığı için upstream runtime asset'leri build öncesinde `public/cad-upstream/` altına kopyalanır:

- `mtext-renderer-worker.js`
- `libredwg-parser-worker.js`
- `libredwg-web.wasm`

Kaynaklar doğrudan kurulu upstream npm paketlerinin `dist/` dizinleridir. Bunların kopyalanması `scripts/sync-cad-upstream-assets.mjs` ile yapılır. Üretilen dosyalar source-of-truth değildir ve Git'e alınmaz.

## Aşama 2 kanıtı

GitHub Actions run `32659396037` başarıyla tamamlandı. Exact upstream commit checkout, frozen lock install, upstream build, worker/WASM artifact kontrolü, preview smoke serve ve artifact upload adımlarının tamamı `success` verdi.

Artifact:

- ad: `cad-simple-viewer-example-92bf58f8`
- artifact id: `9498321402`
- boyut: `4502940` bayt
- SHA-256: `525e4185400a4d52c6dee5e6735c01a1d4334b7a0c8d3ad4ec8352ad8f057e9c`

## Aşama 3 kabul kriterleri

Aşama 3 şu koşullarla kapatılmıştır:

1. üç upstream çekirdek paketi exact sürümle root dependency'dir,
2. `package-lock.json` `package.json` ile senkron ve `npm ci` başarılıdır,
3. upstream runtime asset sync script'i üç zorunlu dosyayı üretir,
4. stable adapter typecheck'ten geçer,
5. adapter `dxf-viewer` veya mevcut custom fidelity/parser katmanlarına bağlı değildir,
6. adapter ham DXF/DWG içeriğini upstream `openDocument()` yoluna verir,
7. worker readiness create öncesi ve open öncesi doğrulanır,
8. adapter `destroy()` yolunu uygular,
9. Stage 3 contract gate `PASS` vermiştir,
10. Aşama 3 kapanışında frozen production CAD yüzeyinde diff yoktur.
