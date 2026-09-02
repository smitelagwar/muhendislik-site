# CAD / DXF Engine — Çalışma Mimarisi

Bu belge restore edilmiş çalışan motorun nasıl çalıştığını anlatır. Amaç, gelecekte bir AI'nın yalnız tek dosyaya bakıp sistemi yanlış yorumlamasını ve çalışan zinciri gereksiz yere yeniden yazmasını önlemektir.

## 1. En üst giriş noktası

CAD dosyaları doğrudan tek bir renderer'a gitmez. Ana sahip:

```text
src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx
```

Preview shell'ler CAD'i bu orchestrator'a yönlendirir:

```text
src/components/dokumantasyon/preview/file-preview-shell.tsx
src/components/dokumantasyon/studio/document-studio-shell.tsx
```

Orchestrator extension'ı normalize eder ve `.dwg`, `.dxf`, `.dwf` için farklı yol seçer.

## 2. DXF çalışma zinciri — korunacak ana davranış

Restore edilmiş zincir:

```text
DXF source
  ↓
DokCadRuntimeOrchestrator
  ↓
DxfRuntimeOrchestrator
  ↓
ENGINE 1: upstream
DokCadUpstreamViewer
MLightCAD tabanlı çalışma yolu
  ↓ yalnız gerçek failure olduğunda
ENGINE 2: current / legacy fallback
DokCadViewer
`dxf-viewer` + dedicated worker
```

### Önemli

DXF için başlangıç engine'i `upstream`dır. `useState<DxfEngine>("upstream")` davranışı bilinçlidir.

`USER_CANCELLED` veya `AbortError` failure sayılıp fallback zincirini tetiklemez. Kullanıcı iptali ile motor hatası birbirine karıştırılmamalıdır.

## 3. Upstream DXF/CAD host

Dosya:

```text
src/components/dokumantasyon/preview/cad-upstream-viewer.tsx
```

Bu bileşen şunları bir arada yönetir:

- `CadUpstreamAdapter` lifecycle,
- loading / ready / error state,
- elapsed time,
- retry / download,
- display mode,
- lineweight,
- background,
- layer panel,
- snap ayarları,
- distance ve area ölçümleri,
- CAD review overlay/store/controller'ları,
- top ribbon entegrasyonu.

Adapter:

```text
src/lib/dokumantasyon/cad-upstream/adapter.ts
```

Upstream motorun browser/runtime köprüsüdür. MLightCAD document manager, viewer davranışı, display/background, ölçüm ve lifecycle burada birleşir.

### Kritik lifecycle gerçeği

`cad-upstream-viewer.tsx` içinde geçmiş oturum teardown'ını seri hale getiren:

```ts
let previousCadUpstreamTeardown: Promise<void> = Promise.resolve();
```

mekanizması baseline'ın bir parçasıdır. Bir AI bunu "global state kötü" gerekçesiyle tek başına kaldırmamalıdır. Böyle bir değişiklik engine lifecycle değişikliğidir.

## 4. Current / legacy DXF fallback

Dosya:

```text
src/components/dokumantasyon/preview/cad-viewer.tsx
```

Bu yol "ölü eski kod" değildir. Upstream DXF failure durumunda gerçek fallback'tir.

### 4.1 Source fetch

DXF byte olarak alınır. Runtime policy ile:

- fetch timeout,
- Content-Length kontrolü,
- hard byte limit,
- streamed body toplam boyut kontrolü

uygulanır.

### 4.2 Encoding

```text
detectDxfEncoding
→ decodeDxfBytes
```

Binary DXF tespit edilirse mevcut parser ASCII DXF beklediği için unsupported olarak sınıflandırılır.

### 4.3 Fidelity ve normalization zinciri

Fallback viewer doğrudan ham metni render etmez. Mevcut pipeline şu katmanları kullanır:

```text
auditDxfText
→ auditDxfStage3
→ auditDxfStage4
→ auditDxfReleaseHardening
→ auditDxfTextRenderSource
→ normalizeDxfTextForStage3Rendering
→ normalizeDxfForStage4Rendering
→ normalizeDxfLayersForInteractiveControl
```

Blocking issue varsa eksik/yanlış renderı sessizce "başarılı" göstermek yerine görüntüleme durdurulur.

### 4.4 Object URL ve dxf-viewer

Normalize edilmiş text bir `Blob` ile object URL'ye çevrilir. Sonra:

```ts
const dxfModule = await import("dxf-viewer")
```

ile viewer lazy yüklenir.

DxfViewer seçeneklerinin önemli snapshot'ı:

```text
autoResize: true
clearAlpha: 1
antialias: true
colorCorrection: true
blackWhiteInversion: true
fileEncoding: utf-8
sceneOptions.suppressPaperSpace: true
```

Metin render kanıtı gerekiyorsa parsed DXF geçici olarak tutulabilir; doğrulama sonrası referans bırakılmaz.

## 5. Dedicated DXF worker

Dosya:

```text
src/components/dokumantasyon/preview/dxf-viewer-worker.ts
```

Bu worker, `dxf-viewer` paketinin kendi iç implementation'larını bilinçli olarak kullanır:

```text
DxfWorker
DxfScene
BatchingKey
DxfParser
```

Worker yalnız basit bir `new DxfParser()` wrapper'ı değildir. Parsed veri üzerinde mevcut fidelity katmanları uygulanır:

- dimension color normalization,
- linetype enrichment/render preparation,
- lineweight source/enrichment,
- wide polyline normalization,
- TEXT/MTEXT stage 2 normalization,
- text stage 3 layout audit.

Bu nedenle worker'ı "daha sade" hale getirmek render fidelity davranışını değiştirebilir.

### Worker factory

Fallback viewer `viewer.Load()` çağrısına özel worker factory verir:

```text
new Worker(new URL("./dxf-viewer-worker.ts", import.meta.url), { type: "module" })
```

Worker error ve messageerror terminal failure'a dönüştürülür. Load bittikten sonra worker terminate edilir.

## 6. View / layer hazırlığı

Load tamamlandıktan sonra:

- parser/text evidence kontrol edilir,
- layer runtime initialize edilir,
- visible layer bounds hesaplanır,
- uygun bounds ile `FitView` uygulanır,
- snapshot alınır,
- stage 4 viewer validation yapılır,
- ancak sonra `ready` durumu verilir.

Layer kontrolleri viewer'ın gerçek `ShowLayer()` davranışını kullanır; UI içinde sahte layer state tutulup renderdan kopuk bırakılmamalıdır.

## 7. Fallback navigation binding

`cad-viewer.tsx` fallback yolunda load sonrası mouse binding bilinçli olarak canonical hale getirilir:

```text
MIDDLE → PAN
```

Bu fallback içinde sol drag'i otomatik pan'a çevirmek, mevcut engine davranışını değiştirmek anlamına gelir. Kullanıcı açıkça istemedikçe yapılmaz.

Upstream ve fallback engine'lerin interaction implementation'ları aynı olmak zorunda değildir; orchestrator'ın görevi failure halinde engine değiştirmektir, iki motoru içten tek motor gibi yeniden yazmak değildir.

## 8. DWG zinciri neden aynı dosyayı paylaşır?

`cad-runtime-orchestrator.tsx` hem DXF hem DWG yönlendirir. Bu yüzden DXF için orchestrator'ı değiştirirken DWG sırasını yanlışlıkla bozmak kolaydır.

Baseline DWG özeti:

```text
fast cached DXF check
→ cached DXF upstream render
→ original DWG upstream
→ legacy browser conversion fallback
→ APS final fallback
```

DXF görevi sırasında bu DWG zincirine dokunmak çoğu zaman kapsam dışıdır.

## 9. DWF ayrı sınırdır

DWF:

```text
src/components/dokumantasyon/preview/dwf-local-viewer.tsx
```

yolunu kullanır. DXF motoru değişikliği DWF'yi aynı renderer'a zorla taşımamalıdır.

## 10. Asset dağıtımı

MLightCAD/LibreDWG browser asset'ları build öncesi:

```text
scripts/sync-cad-upstream-assets.mjs
```

ile senkronlanır. `/public/cad-upstream/` altındaki worker/WASM asset yolları adapter sözleşmesinin parçasıdır.

Bu scripti veya asset URL'lerini değiştirmek yalnız "build cleanup" değildir; engine startup davranışını etkileyebilir.

## 11. Hata sınıflandırması

Viewer failure'ları kullanıcıya terminal durum olarak ulaşmalıdır. Aşağıdaki model korunur:

- fetch problemi,
- parse/unsupported problemi,
- render/WebGL problemi,
- worker runtime problemi,
- timeout,
- user cancellation ayrı kategori.

Failure'ı gizleyip boş canvas göstermek kabul edilen davranış değildir.

## 12. Yeni renderer ekleme hakkında

Aşağıdakiler mevcut baseline mimarinin parçası **değildir** ve otomatik eklenmemelidir:

- yeni custom Canvas2D CAD engine,
- `safe-dxf-canvas` benzeri replacement renderer,
- her mousemove'da geometriyi baştan rasterize eden custom redraw loop,
- parsed geometry formatını sıfırdan tasarlayan worker protokolü.

Böyle bir motor ancak kullanıcı açıkça yeni engine geliştirilmesini isterse, mevcut engine korunarak ayrı canary olarak yapılabilir.
