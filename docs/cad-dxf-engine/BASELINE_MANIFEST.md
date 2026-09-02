# CAD / DXF Engine — Golden Baseline Manifest

Bu dosya çalışan DXF/CAD motorunun **geri dönüş manifestidir**. Değerler tarihsel golden referansı temsil eder ve yeni çalışmalar sırasında silinmez.

## 1. Golden kimlik

| Alan | Değer |
|---|---|
| Vercel project | `muhendislik-site` |
| Golden Production deployment | `dpl_5xrsMtgshSvcwTN4oH3FBNkecoeo` |
| Deployment label / commit message | `IGNORE2` |
| Golden Git commit | `909c59cb9dcac8e722b3bda4c66fd9d8a25755c8` |
| Golden branch | `main` |
| Restore commit | `afbc121923f2de1313801f884f428535334a40cf` |

Golden commit yalnız `IGNORE2` marker commitinden ibaret değildir; Vercel deployment metadata'sı bu SHA'yı source commit olarak kullanmıştır. Restore işlemi CAD/DXF scope'unu bu committeki tree ile eşitlemiştir.

## 2. Core protected blob hash'leri

Aşağıdaki blob SHA değerleri `909c59cb...` ve restore edilmiş `main` için aynı olan core dosyaları tanımlar.

| Dosya | Golden blob SHA |
|---|---|
| `src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx` | `44d10674954b457d6fd74ba26bf7b7a390c73bf0` |
| `src/components/dokumantasyon/preview/cad-viewer.tsx` | `93c5e3db2ee3bd41eadc34f4f4f38600ca738d2c` |
| `src/components/dokumantasyon/preview/cad-upstream-viewer.tsx` | `1e3461f4499cfb7aba0fc1893c36325668376a4f` |
| `src/components/dokumantasyon/preview/dxf-viewer-worker.ts` | `4b43906928bfcb31d71038b01927d018022cad11` |
| `src/components/dokumantasyon/preview/cad-studio-ribbon.tsx` | `1c771ce559855e99d1210c42286a140f547f01a2` |
| `src/components/dokumantasyon/preview/cad-view-settings-panel.tsx` | `bd25c149f3cc82a2546919d50f5f89a6277c1d07` |

### Hash nasıl kontrol edilir?

Golden:

```bash
git rev-parse 909c59cb9dcac8e722b3bda4c66fd9d8a25755c8:<path>
```

Working tree:

```bash
git hash-object <path>
```

Motor değişikliği **istenmiyorsa** protected core dosyada hash değişmesi kırmızı bayraktır.

## 3. Dependency snapshot

IGNORE2/restored mimarinin önemli CAD bağımlılıkları:

- `@mlightcad/cad-simple-viewer` `1.6.2`
- `@mlightcad/data-model` `1.14.2`
- `@mlightcad/libredwg-converter` `3.14.2`
- `dxf-viewer` `^1.0.48`

Bu sürümler sırf yeni sürüm çıktığı için yükseltilmez. Paket yükseltmesi gerçek engine değişikliği kabul edilir.

## 4. Protected path grupları

### Core routing / rendering

```text
src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx
src/components/dokumantasyon/preview/cad-upstream-viewer.tsx
src/components/dokumantasyon/preview/cad-viewer.tsx
src/components/dokumantasyon/preview/dxf-viewer-worker.ts
```

### Engine bridge / runtime

```text
src/lib/dokumantasyon/cad-upstream/**
src/lib/dokumantasyon/cad-runtime/**
src/lib/dokumantasyon/dxf-*
src/lib/dokumantasyon/dwg/runtime-policy.ts
scripts/sync-cad-upstream-assets.mjs
```

### Shared viewer routing / fallback

```text
src/components/dokumantasyon/preview/dwg-legacy-conversion-fallback.tsx
src/components/dokumantasyon/preview/dwg-dxf-conversion-worker.ts
src/components/dokumantasyon/preview/aps-only-dwg-viewer.tsx
src/components/dokumantasyon/preview/dwf-local-viewer.tsx
src/components/dokumantasyon/preview/file-preview-shell.tsx
src/components/dokumantasyon/studio/document-studio-shell.tsx
src/app/dokumantasyon/dosya/[fileId]/page.tsx
```

### CAD görünüm ve araç katmanı

```text
src/components/dokumantasyon/preview/cad-studio-ribbon.tsx
src/components/dokumantasyon/preview/cad-view-settings-panel.tsx
src/components/dokumantasyon/preview/cad-layer-panel.tsx
src/components/dokumantasyon/preview/cad-snap-settings-panel.tsx
src/components/dokumantasyon/preview/cad-distance-overlay.tsx
src/components/dokumantasyon/preview/cad-area-overlay.tsx
```

Bu son grup engine core kadar değişmez değildir; UI görevlerinde değiştirilebilir. Ancak değişiklik engine lifecycle, viewer initialization veya render loop'u içine taşınmamalıdır.

## 5. Golden'a geri dönüş kuralı

Bir AI değişikliği motoru bozarsa "benzer kod" yeniden yazılmaz. Golden Git tree doğrudan kaynak alınır.

Örnek:

```bash
GOLDEN=909c59cb9dcac8e722b3bda4c66fd9d8a25755c8
git restore --source="$GOLDEN" --worktree -- \
  src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx \
  src/components/dokumantasyon/preview/cad-viewer.tsx \
  src/components/dokumantasyon/preview/cad-upstream-viewer.tsx \
  src/components/dokumantasyon/preview/dxf-viewer-worker.ts
```

Bütün repository'yi `reset --hard` ile eskiye döndürmek varsayılan çözüm değildir; sadece ilgili scope restore edilir.

## 6. Baseline değiştirilebilir mi?

Evet, fakat yalnız kullanıcı açıkça yeni çalışan motoru yeni baseline olarak kabul ederse.

Yeni baseline kabul edildiğinde:

- bu dosyadaki IGNORE2 referansı **silinmez**,
- yeni baseline ayrı bir "Accepted Baseline History" kaydı olarak eklenir,
- yeni core blob hash'leri ayrıca eklenir,
- neden değiştiği yazılır,
- eski golden restore yolu korunur.

### Accepted Baseline History

1. **IGNORE2 / Golden #1** — `909c59cb9dcac8e722b3bda4c66fd9d8a25755c8` — çalışan tarihsel geri dönüş kaynağı.
