# A5 — Performans, bellek ve uyumluluk (H17, H19, H20, H21, H22, H23)

**Önce oku:** `00-OKU-ONCE.md`. **Ön koşul:** A1–A4 yeşil.

## Dosyalar
- `src/lib/dokumantasyon/studio/pdf/engine/engine.ts`
- `src/lib/dokumantasyon/studio/pdf/engine/page-sizes.ts` (yalnız oku: birimlerin pt ve içsel döndürme dahil olduğunu doğrula)
- `src/components/dokumantasyon/studio/pdf/engine/pdf-page-host.tsx`
- `src/components/dokumantasyon/studio/pdf/engine/pdf-virtual-pages.tsx`
- `src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx` (yalnız `getFitScale`)
- `src/lib/dokumantasyon/studio/pdf/pdf-print.ts`
- `tests/pdf-v4/unit/engine.test.ts`; YENİ: `tests/pdf-v4/v5-a5-uyum.spec.ts`

## Kök nedenler
- **H17:** `PdfPageHost` unmount'ta `pageProxy.cleanup()` çağırmaz; sanal liste sayfaları sürekli mount/unmount eder → pdf.js sayfa kaynakları (operator list, görüntüler) birikir (büyük belge/uzun oturumda bellek artışı).
- **H19:** `PdfEngine.maxScale()` her çağrıda `maxScaleForHeight` (40 × N sayfa) çalıştırır; `clampScale` pinch/tekerlek karesinde çağrılır. 3000+ sayfada kare başına yüzbinlerce işlem.
- **H20:** `visibleRange` mount edilen sayfa sayısını sınırlamaz. Düşük zoom + büyük overscan (`viewH*1.5`) yüzlerce `PdfPageHost` (her biri `getPage` + backdrop işi) yaratabilir. Ayrıca `overlayProps` her render'da yeni nesne olduğundan **tüm** host'lar her studio render'ında yeniden render olur.
- **H21:** v4'te `pageDimensions` yalnız restore edilen sayfa için dolar; `getFitScale` karışık boyutlu belgede (A4+A3) fit-width/fit-page için hep 1. sayfa boyutunu kullanır.
- **H22:** `PdfPageHost` `window.devicePixelRatio`'yu yalnız render'da okur; pencere farklı DPR'li monitöre taşınınca/tarayıcı zoom değişince tile'lar yanlış çözünürlükte kalır.
- **H23:** `printPdfBytes` 0×0 `visibility:hidden` iframe kullanır (Chrome/Firefox'ta boş sayfa basma riski); `URL.revokeObjectURL` 5 dk sonra, `afterprint` yalnız `window`'da dinlenir (iframe penceresinde tetiklenir).

## Değişiklikler

### 1) `engine.ts`
- **H19 önbellek:** `private sizesVersion = 0; private maxScaleCache: { v: number; ver: number } | null = null;` `setSizes` ve `applyRotationToSizes` içinde `this.sizesVersion++; this.maxScaleCache = null;`. `maxScale()`:
```ts
if (!this.maxScaleCache || this.maxScaleCache.ver !== this.sizesVersion) {
  this.maxScaleCache = { v: Math.min(getMaxPdfScale(), maxScaleForHeight(this.rotatedSizes, this.gap, this.padding)), ver: this.sizesVersion };
}
return this.maxScaleCache.v;
```
(`getMaxPdfScale()` coarse/fine değişimi nadir; ilk hesapla sabitlenmesi yerine `Math.min(getMaxPdfScale(), cache.hCap)` olacak şekilde yalnız `hCap`'i önbelleğe al — `getMaxPdfScale()` ucuzdur.)
- **H20 sayfa sınırı:** `updateRange` içinde `visibleRange`'i iki kez çağır: `strict = visibleRange(layout, scrollTop, viewH, 0)`, `wide = visibleRange(layout, scrollTop, viewH, overscanFn())`. `cap = coarse ? 14 : 30` (`matchMedia("(pointer: coarse)")`, sınıf alanı olarak bir kez hesapla). `extra = Math.max(0, cap - (strict.last - strict.first + 1))`; `first = Math.max(wide.first, strict.first - Math.ceil(extra / 2))`, `last = Math.min(wide.last, strict.last + Math.floor(extra / 2))`. Mevcut 1-tabanlı çevirme ve `emit("range")` aynen.
- **H21:** `getPageSize(page1: number): { w: number; h: number } | null` (ham, döndürmesiz `rawSizes[page1 - 1] ?? null`).

### 2) `pdfjs-studio.tsx` — `getFitScale`
v4 iken (`engineFlag === "v4"`) `refPage` için `engineRef.current?.getPageSize(refPage)` varsa onu (`{ width: s.w, height: s.h }`) `currentSize` olarak kullan; yoksa mevcut `pageDimensions[refPage] || firstPageSize`. Birim uyumunu `page-sizes.ts`'te doğrula (pt, içsel `rotate` dahil); uyumsuzsa **dur, blokaj yaz**. `useCallback` bağımlılığına `engineFlag` ekle.

### 3) `pdf-page-host.tsx`
- **H17:** `pageProxy` yüklendiği efektin temizleyicisine (`// 2. Sayfa Proxy'sini yükle`) ek olarak ayrı efekt: `useEffect(() => () => { try { pageProxy?.cleanup(); } catch {} }, [pageProxy]);`
- **H22:** dosya içine kanca:
```ts
function useDpr(): number {
  const [dpr, setDpr] = useState(() => (typeof window === "undefined" ? 1 : window.devicePixelRatio || 1));
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    let mq: MediaQueryList | null = null;
    const onChange = () => { setDpr(window.devicePixelRatio || 1); bind(); };
    const bind = () => {
      mq?.removeEventListener("change", onChange);
      mq = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      mq.addEventListener("change", onChange, { once: true });
    };
    bind();
    return () => mq?.removeEventListener("change", onChange);
  }, []);
  return dpr;
}
```
`const dpr = ...` satırını `const dpr = useDpr();` ile değiştir (`o = outputScaleFor(dpr)` zaten bağımlılıklarda).
- Bileşeni `React.memo` ile sar: `export const PdfPageHost = React.memo(PdfPageHostInner, areEqual);` (mevcut işlev adını `PdfPageHostInner` yap; **dışa aktarılan ad ve `PdfPageHostProps` aynı kalır**). `areEqual`: `engine, pdfDoc, pageNumber, rotation, nightMode` `===`; `overlayProps` için alan alan `===` (searchMatches, searchOpts, searchQuery, isCurrentMatchPage, activeMatchIndexInPage, repairRules, onNavigateDestination, isHandTool).

### 4) `pdf-virtual-pages.tsx`
Değişiklik gerekmez (memo `PdfPageHost` tarafında). `import` adı aynı kalır.

### 5) `pdf-print.ts` (H23)
- iframe stili: `position:fixed; left:-10000px; top:0; width:210mm; height:297mm; border:0; opacity:0; pointer-events:none` (**`visibility:hidden` ve 0×0 KALDIRILIR**).
- `afterprint`: hem `window`'a hem `f.contentWindow`'a (try/catch) `{ once: true }` ile cleanup bağla. Yedek zamanlayıcı `5 * 60_000` → `20 * 60_000`.

## Testler
**Birim (`unit/engine.test.ts`):**
- 5000 sahte sayfa boyutu ile `setSizes`; `clampScale` 200 kez çağrısı toplam < 50 ms (önbellek). Boyut değişince (`setSizes` ile farklı sayfa) `maxScale()` yeniden hesaplanır (sonuç değişir).
- 400 sayfa, `scale=0.2`, geniş `viewH` ile `getRange()` toplam sayfa sayısı ≤ `cap` (30); `strict` aralık her zaman dahil.
- `getPageSize(3)` ham boyutu, `getPageSize(999)` null.

**E2E (`v5-a5-uyum.spec.ts`, `desktop`):**
1. **`fit-width karışık boyutlu belgede geçerli sayfaya göre`** — `karisik-boyut`; boyutu farklı bir sayfaya `scrollToPage` (fixture `tests/fixtures/pdf/manifest.json`'dan farklı boyutlu sayfa no'sunu al); `Control+2`; 1500 ms; o sayfanın `[data-page]` kutusu `getBoundingClientRect().width` ≈ `scroller.clientWidth − 24` (±3).
2. **`DPR değişince tile çözünürlüğü güncellenir`** — `tr-metin`; CDP `Emulation.setDeviceMetricsOverride` ile `deviceScaleFactor: 1` → `waitSharp`, sayfa 1 keskin tuval `width/css genişliği` ≈ 1 (±%5); sonra `deviceScaleFactor: 2` → 3000 ms → oran ≈ 2 (±%5).
3. **`düşük zoomda mount edilen sayfa sayısı sınırlı`** — `metin-1000`; `__pdfEngine.setScale(0.2)`, 2500 ms; `document.querySelectorAll('[data-page]').length ≤ 36`.
4. **`yazdırma iframe'i gizli değil`** — `Control+p` (veya yazdır düğmesi); `[data-testid="pdf-print-iframe"]` oluşunca `getComputedStyle(f).visibility !== "hidden"` ve `getBoundingClientRect().width ≥ 100`. (Başsız tarayıcıda `print()` diyalog açmaz; yalnız DOM doğrulanır; çalışmazsa rapora yaz.)

## Kırmızı kanıtı
Değişiklikten önce birim 2'si (önbellek/cap) ve E2E 1, 2, 3, 4 kırmızı olmalı.

## Kapı
```powershell
npx tsc --noEmit --incremental false
npm run check:pdf-v4:unit
npx playwright test --config=playwright.pdf-v4.config.ts tests/pdf-v4/v5-a5-uyum.spec.ts --project=desktop --reporter=line 2>&1 | Select-Object -Last 40
npx playwright test --config=playwright.pdf-v4.config.ts tests/pdf-v4/v5-a1-bellek.spec.ts tests/pdf-v4/v5-a2-zoom-yerlesim.spec.ts tests/pdf-v4/v5-a3-klavye-gezinme.spec.ts --project=desktop --reporter=line 2>&1 | Select-Object -Last 30
```

## Dokunma
`computeLayout`, `tiles.ts`, `governor.ts`, v3 dosyaları.
