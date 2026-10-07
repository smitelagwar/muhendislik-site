# Plan 03: Motor (yerleşim, bölgesel render, bellek, zamanlayıcı)

> **Kapsam:** D4 (büyük format bellek/bulanıklık), D5 (O(N) ana iş parçacığı işi), D14 (gece modu maliyeti), D15 (küçük resimler sayfayla yarışıyor).
> **Ön koşul:** Plan 01 (ölçüm) ve Plan 02 (K1–K4) bitmiş olacak. Plan 02'nin `viewReady` kapısı, `pdf-document-source` ve `pdfjs-paths` bu planda varsayılır.
> **Boyut:** L. Bu plan en büyük iş. **Bayrak arkasında** (`pdfEngine`), eski motor silinmez.
> **Dürüstlük notu:** Aşağıdaki kod parçaları tasarım taslağıdır, repo'da çalıştırılmadı. Yalnızca "Ölçülmüş" etiketli sayılar sandbox ölçümüdür (00 numaralı dosya, M3–M8).

---

## 0. Bu plan neyi çözüyor, neyi çözmüyor

**Bugünkü mimari (okudum):**
- `pdfjs-studio.tsx` ~1798–1840: tüm sayfalar (`numPages`) `flex-col` içinde `PdfPageView` olarak **hepsi** mount ediliyor. 300 sayfada her zoom/durum değişimi 300 bileşeni yeniden render ediyor. Pencereleme (`PAGE_WINDOW_N=5`) yalnızca canvas'ı boşaltıyor, DOM ve React işini azaltmıyor. Bu **O(N)** iştir (D5).
- `pdf-page-view.tsx`: her sayfa kendi `getPage` + `getAnnotations` çağrısını yapıyor, kendi `IntersectionObserver`'ını kuruyor, tam sayfa tek canvas çiziyor. `computePageGeometry` taban 1,0 olduğu için bütçeyi aşıyor (D4).
- Zoom sırasında sayfa konumları DOM akışından geliyor; yerleşim bilgisi (`tops`) yok. Bu yüzden konum geri yükleme `setTimeout` ile yapılıyor, sayfa tespiti IO'ya bağlı (M9).

**v4 hedef mimarisi (tek cümle):** Yerleşim **saf matematik** (`tops[]`, `heights[]`), DOM'a yalnızca **görünür aralıktaki ~5–9 sayfa** mutlak konumla konur, her sayfa **parçalara (tile)** çizilir, hepsi **öncelikli bir zamanlayıcı** ve **bellek yöneticisi** üzerinden geçer, zoom sırasında sayfa kutuları **tam hedef geometride** durur ve içerik CSS ile ölçeklenir.

**Bu plan çözmez:** Gesture girdisi, pinch matematiği, fit modu semantiği (D6), iPad trackpad (D9), tekerlek çentiği (D11). Onlar Plan 04. Ancak Plan 04'ün üstüne oturacağı `engine` API'si burada tanımlanır (§4).

---

## 1. Dosya haritası (yeni dosyalar)

Hepsi yeni; mevcut dosyalara yalnızca §9'daki entegrasyon dokunuşları yapılır.

```
src/lib/dokumantasyon/studio/pdf/engine/
  layout.ts            // saf: computeLayout, pageAtY, visibleRange, anchor <-> scroll
  tiles.ts             // saf: planTiles, tilesForRect, chooseMode, outputScale
  lru.ts               // saf: bayt bütçeli LRU (canvas yaşam döngüsünden bağımsız)
  scheduler.ts         // öncelikli iş kuyruğu (interaction state farkındalıklı)
  governor.ts          // canvas bellek muhasebesi + tahliye + visibilitychange
  canvas-pool.ts       // tampon canvas havuzu, serbest bırakma kuralları
  page-sizes.ts        // kademeli sayfa boyutu okuma (saf çekirdek + pdf.js bağlayıcı)
  engine.ts            // PdfEngine sınıfı: geometri store'u + imperatif uygulama + olaylar
  use-pdf-engine.ts    // React bağlayıcı (useSyncExternalStore)
  flags.ts             // pdfEngine bayrağı
src/components/dokumantasyon/studio/pdf/engine/
  pdf-virtual-pages.tsx   // sizer + görünür aralıktaki sayfa konakları
  pdf-page-host.tsx       // bir sayfanın yaşam döngüsü: backdrop, sharp, tiles, overlays
  pdf-page-overlays.tsx   // MEVCUT metin/vurgu/ek açıklama kodunun taşınmış hali (davranış aynı)
tests/pdf-v4/unit/layout.test.ts, tiles.test.ts, lru.test.ts, scheduler.test.ts
```

**Kural:** `engine/` altındaki `*.ts` dosyaları React ve DOM'a **bağımlı olmayan** çekirdeği (layout, tiles, lru, scheduler çekirdeği) saf tutar; böylece `tsx` ile birim test edilir (Plan 01'deki `document-source.test.ts` gibi).

---

## 2. Aşamalar ve sıra

| Aşama | İçerik | Tek başına değeri | Çıkış ölçütü (Plan 01 senaryosu) |
|---|---|---|---|
| P3.0 | Bayrak + iskelet + öznitelik sözleşmesi | Geri alma güvencesi | v3 davranışı **değişmedi** (S1/S2 taban) |
| P3.1 | Saf çekirdek: layout, tiles, lru + birim testler | Mantık doğrulanmış | birim testler yeşil |
| P3.2 | Sayfa boyutları (kademeli) | Karışık boyutlu belge doğru yerleşim | birim test + S1 |
| P3.3 | Engine: geometri store'u, imperatif uygulama, sanal sayfa listesi | **D5 çözülür** (O(N) biter) | S4, S1 |
| P3.4 | Zamanlayıcı + bellek yöneticisi + canvas havuzu | Sınırlı bellek, öncelik | S8, S13 |
| P3.5 | Sayfa konağı: backdrop + sharp + tiles + nesil (generation) | **D4 çözülür**, titreme yok | S2, S7 |
| P3.6 | Studio entegrasyonu (arama, küçük resim, bağlantı, konum, fit) | Özellik paritesi | S1–S5, mevcut e2e |
| P3.7 | Küçük resimler zamanlayıcıdan (D15) | | S14 |
| P3.8 | Yükseklik koruması + büyük belge sınırları | Çok sayfa/büyük zoom güvenli | S7, S8 |
| P3.9 | Gece modu (D14) + sekme gizleme | | S13 |
| P3.10 | Telemetri, kademeli açılış, geri alma | | tüm bütçeler |

**Her aşama sonunda:** bayrak `v4` iken ilgili senaryolar bütçeyi geçmeli; bayrak `v3` iken hiçbir şey değişmemeli.

---

## P3.0 Bayrak ve sözleşme

`flags.ts`:

```ts
export type PdfEngineFlag = "v3" | "v4";
export function readPdfEngineFlag(): PdfEngineFlag {
  try {
    if (typeof window === "undefined") return "v3";
    const q = new URLSearchParams(window.location.search).get("pdfEngine");
    if (q === "v4" || q === "v3") { window.localStorage.setItem("dok:pdfEngine", q); return q; }
    const s = window.localStorage.getItem("dok:pdfEngine");
    if (s === "v4" || s === "v3") return s;
  } catch { /* gizli pencere vb. */ }
  return (process.env.NEXT_PUBLIC_PDF_ENGINE === "v4" ? "v4" : "v3");
}
```

- `pdfjs-studio.tsx` kök öğesindeki `data-pdf-engine` (Plan 01 §1.3) artık `readPdfEngineFlag()` değerini yazar. Test altyapısı bunu okuyup hangi motoru ölçtüğünü sonuç dosyasına yazar.
- **Öznitelik sözleşmesi (v4'te de korunur; Plan 01 testleri buna bağlı):**
  - `[data-testid="pdf-scroll-viewport"]` kaydırma alanı (aynı öğe).
  - Mount edilen her sayfa: `[data-page="N"]`, `[data-testid="pdf-page-N"]`, `data-page-number`.
  - `data-page-state`: `"empty"` (yer tutucu), `"backdrop"` (yalnızca düşük çözünürlüklü ön izleme), `"rendered"` (görünür tüm parçalar keskin).
  - Keskin canvas'lar `canvas[data-layer="sharp"]`, ön izleme `canvas[data-layer="backdrop"]`. Test yardımcıları keskinlik ölçümünde backdrop'u hariç tutuyor.
  - Zoom sürerken kök kaydırma öğesinde `data-zooming` (mevcut koruma bunu kullanıyor).
- **Boş kare tanımı (Plan 01 örnekleyici):** görünür (>40 px) bir sayfada `data-page-state` `empty` ise kare boştur. `backdrop` boş **sayılmaz**; sayfa hiçbir zaman beyaz görünmez, en kötü ihtimalle bulanık görünür. Bu bilinçli bir tasarım kararıdır, "keskinleşme süresi" (`sharpMs`) ayrı metriktir.

**Çıkış (P3.0):** `?pdfEngine=v3` ve `v4` ikisi de açılıyor; `v4` şimdilik `v3`'ü render ediyor (iskelet). Plan 01 S1 taban sayıları değişmedi.

---

## P3.1 Saf çekirdek

### 3.1.1 `layout.ts`

Tasarım kararları (gerekçeli):
1. **Yükseklikler yuvarlanmaz (kesirli px).** Neden: zoom sırasında sayfa kutuları hedef ölçekte doğrusal ölçeklenir; sayfa başına yuvarlama, 1000 sayfalık belgede çıpa sayfasının üstünde biriken ±0,5 px hatalar yüzünden tens-of-px "zıplama" üretir. Kesirli konum `translate3d` ile sorunsuz çizilir. (Kanıt: tasarım hesabı, ölçüm yok.)
2. `gap` ve `padding` **ölçeklenmeyen sabitlerdir**. Bu yüzden `tops(s)` ölçeğe göre tam doğrusal değildir; sayfa kutuları her karede hedef ölçeğe göre **yeniden konumlandırılır** (§4), tüm içeriği tek `transform: scale()` ile ölçeklemeyiz. (v3'te çıpa uzaktaki sayfalarda `gap·(r−1)·k` kadar kayabilir; bu motor bunu yapısal olarak engeller.)
3. Dönüş (rotation) boyutlara baştan uygulanır: `sizes` zaten döndürülmüş (w,h) alır.

```ts
// layout.ts (saf)
export interface PageSizePt { w: number; h: number }          // döndürme uygulanmış, pt
export interface LayoutParams {
  sizes: ReadonlyArray<PageSizePt>;
  scale: number;          // css px / pt
  gap: number;            // PDF_PAGE_GAP
  padding: number;        // PDF_PAGE_PADDING (kenar boşluğu)
  viewportW: number;      // kaydırma alanının clientWidth (scrollbar hariç)
  paddingTopExtra?: number; // mobilde araç çubuğu payı (studio zaten paddingTop veriyor, bkz. §9.2)
}
export interface Layout {
  n: number; scale: number;
  tops: Float64Array; heights: Float64Array; widths: Float64Array; lefts: Float64Array;
  totalHeight: number; contentWidth: number;
}
export function computeLayout(p: LayoutParams): Layout {
  const n = p.sizes.length;
  const tops = new Float64Array(n), heights = new Float64Array(n);
  const widths = new Float64Array(n), lefts = new Float64Array(n);
  let y = p.padding + (p.paddingTopExtra ?? 0), maxW = 0;
  for (let i = 0; i < n; i++) {
    const w = p.sizes[i].w * p.scale, h = p.sizes[i].h * p.scale;
    widths[i] = w; heights[i] = h; tops[i] = y; y += h + p.gap;
    if (w > maxW) maxW = w;
  }
  const totalHeight = n ? y - p.gap + p.padding : 2 * p.padding;
  const contentWidth = Math.max(p.viewportW, maxW + 2 * p.padding);
  for (let i = 0; i < n; i++) lefts[i] = (contentWidth - widths[i]) / 2;
  return { n, scale: p.scale, tops, heights, widths, lefts, totalHeight, contentWidth };
}
/** y koordinatını içeren sayfa (0-tabanlı). Boşluktaysa en yakın üst sayfa. İkili arama. */
export function pageAtY(L: Layout, y: number): number {
  let lo = 0, hi = L.n - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (L.tops[mid] <= y) lo = mid; else hi = mid - 1; }
  return lo;
}
export function visibleRange(L: Layout, scrollTop: number, viewH: number, overscanPx: number) {
  const a = pageAtY(L, Math.max(0, scrollTop - overscanPx));
  const b = pageAtY(L, scrollTop + viewH + overscanPx);
  return { first: a, last: b };               // dahil, 0-tabanlı
}
/** Araç çubuğundaki "geçerli sayfa": görünüm yüksekliğinin %40 çizgisini içeren sayfa. Kaydırma ve gösterge AYNI fonksiyonu kullanır (M9'u kapatır). */
export function currentPageOf(L: Layout, scrollTop: number, viewH: number): number {
  return pageAtY(L, scrollTop + viewH * 0.4) + 1;
}
/** Çıpa: belge içindeki bir noktayı sayfa-yerel kesirle tutar; ölçekten bağımsızdır. */
export interface DocAnchor { page: number; fx: number; fy: number }   // fx/fy ∈ ℝ (sayfa dışına taşabilir)
export function anchorFromPoint(L: Layout, docX: number, docY: number): DocAnchor {
  const i = pageAtY(L, docY);
  return { page: i, fx: (docX - L.lefts[i]) / L.widths[i], fy: (docY - L.tops[i]) / L.heights[i] };
}
export function pointFromAnchor(L: Layout, a: DocAnchor) {
  const i = Math.min(Math.max(a.page, 0), L.n - 1);
  return { x: L.lefts[i] + a.fx * L.widths[i], y: L.tops[i] + a.fy * L.heights[i] };
}
/** Çıpa viewport içinde (vx,vy) noktasında kalsın diye gereken scrollLeft/Top. */
export function scrollForAnchor(L: Layout, a: DocAnchor, vx: number, vy: number, viewW: number, viewH: number) {
  const p = pointFromAnchor(L, a);
  const maxL = Math.max(0, L.contentWidth - viewW), maxT = Math.max(0, L.totalHeight - viewH);
  return { left: clamp(p.x - vx, 0, maxL), top: clamp(p.y - vy, 0, maxT) };
}
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
```

> `fx` yatay çıpa: sayfa genişliği ölçekle orantılı olduğundan sayfa-yerel kesir ölçekten bağımsız kalır. Bu, D3'teki "merkez çıpa" hatasının kökten çözümüdür: açılışta çıpa `{page:0, fx:0.5, fy:0}` olup `vy=0` ile yerleştirilir.

**Birim testleri (`layout.test.ts`):**
- 3 farklı boyutlu sayfa: `tops[i+1] = tops[i] + heights[i] + gap`; `totalHeight` son sayfanın altı + padding.
- `pageAtY` sınırlar: `y<0` → 0, tam `tops[i]` → i, boşluk (gap) içi → üstteki sayfa, `y>total` → son.
- `anchorFromPoint → pointFromAnchor` gidiş-dönüş hatası <1e-9, **ölçek değişse bile** (ölçek 1 → 2.37, aynı çıpa) çıpa sayfa-yerel kesri sabit.
- `scrollForAnchor` clamp: belge başında `vy` büyükse `top=0`.
- Rastgele 5000 sayfa: `pageAtY` doğrusal tarama ile aynı sonuç (1000 rastgele y).

### 3.1.2 `tiles.ts`

**Neden parça?** (Ölçülmüş M3/M4) Tam sayfa canvas'ta A0 %400'de 228 MP, %500'de render hiç bitmedi; 512 px parça %500'de 183 ms. Parça çizim bütçesi sayfa boyutundan bağımsız.

**Kural: Çözünürlükten asla taviz verme, alanı sınırla.** v3 `outputScale`'i düşürüp bulanıklaştırıyordu (taban 1,0 bile aşıyordu). v4'te `outputScale = min(dpr, OUT_CAP)` **sabit**; bütçe aşılırsa **yalnızca görünür bölgeyi** (parça) çizeriz.

```ts
// tiles.ts (saf)
export const OUT_CAP = 3;                 // piksel/css-px üst sınırı (DPR3 telefonlar için)
export const TILE_PX = { mobile: 512, desktop: 768 };     // bitmap px; gerçek cihazda ölçüp ayarla
export const GUTTER = 2;                  // M4: kenarda %2,9–4,1 fark; 2px taşma + kırpma ile kapanır
export const WHOLE_MAX_PX = { mobile: 4_000_000, desktop: 12_000_000 }; // tek canvas ≤ bu kadar piksel

export type Mode = "whole" | "tiles";
export function outputScaleFor(dpr: number): number { return Math.min(Math.max(dpr || 1, 1), OUT_CAP); }
export function chooseMode(cssW: number, cssH: number, o: number, wholeMax: number): Mode {
  return cssW * o * cssH * o <= wholeMax ? "whole" : "tiles";
}
export interface TileRect {
  col: number; row: number;
  x: number; y: number; w: number; h: number;        // bitmap px (sayfa bitmap uzayı)
  cssX: number; cssY: number; cssW: number; cssH: number; // render ölçeğinde css px
  key: string;                                        // `${col}:${row}`
}
export function gridSize(cssW: number, cssH: number, o: number, tile: number) {
  return { cols: Math.ceil((cssW * o) / tile), rows: Math.ceil((cssH * o) / tile) };
}
export function tileRect(col: number, row: number, cssW: number, cssH: number, o: number, tile: number): TileRect {
  const bw = Math.ceil(cssW * o), bh = Math.ceil(cssH * o);
  const x = col * tile, y = row * tile;
  const w = Math.min(tile, bw - x), h = Math.min(tile, bh - y);
  return { col, row, x, y, w, h, cssX: x / o, cssY: y / o, cssW: w / o, cssH: h / o, key: `${col}:${row}` };
}
/** Sayfa-yerel css dikdörtgenini (render ölçeğinde) kesen parçalar; margin: css px. Merkeze yakın önce. */
export function tilesForRect(cssW: number, cssH: number, o: number, tile: number,
  rect: { x: number; y: number; w: number; h: number }, margin: number): TileRect[] {
  const { cols, rows } = gridSize(cssW, cssH, o, tile);
  const t = tile / o;
  const c0 = Math.max(0, Math.floor((rect.x - margin) / t)), c1 = Math.min(cols - 1, Math.floor((rect.x + rect.w + margin) / t));
  const r0 = Math.max(0, Math.floor((rect.y - margin) / t)), r1 = Math.min(rows - 1, Math.floor((rect.y + rect.h + margin) / t));
  const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2, out: TileRect[] = [];
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) out.push(tileRect(c, r, cssW, cssH, o, tile));
  return out.sort((a, b) => dist(a, cx, cy) - dist(b, cx, cy));
}
const dist = (t: TileRect, cx: number, cy: number) => Math.hypot(t.cssX + t.cssW / 2 - cx, t.cssY + t.cssH / 2 - cy);
```

`whole` modu = tek parça (`tile = ∞`); aynı kod yolu, gutter yok (sayfa kenarı).

**Parça render tarifi** (pdf.js `page.render`):

```ts
// bir parçayı çiz: tampon (w+2g)x(h+2g) → kırp → hedef parça canvas'ı (w x h)
const g = mode === "tiles" ? GUTTER : 0;
const buf = pool.acquire(r.w + 2 * g, r.h + 2 * g);
const task = page.render({
  canvasContext: buf.getContext("2d", { alpha: false })!,
  viewport,                                     // page.getViewport({ scale: renderScale, rotation })
  transform: [o, 0, 0, o, -(r.x - g), -(r.y - g)],
  background: "#ffffff",                        // alpha:false ile uyumlu
});
await task.promise;                             // iptalde RenderingCancelledException → sessiz
tileCanvas.width = r.w; tileCanvas.height = r.h;
tileCanvas.getContext("2d", { alpha: false })!.drawImage(buf, g, g, r.w, r.h, 0, 0, r.w, r.h);
pool.release(buf);
```

> `alpha:false` bağlam Safari/Chrome'da daha hızlı kompozit edilir; ama sayfa arka planı beyaz olmak zorunda: `background:"#ffffff"` verilmeli. Gece modu ve saydam sayfalar için §P3.9'a bak. **Doğrula:** pdf.js 6.3.289 `render()` parametrelerinde `background` ve `transform` var mı? `node_modules/pdfjs-dist/types/src/display/api.d.ts` içinde `RenderParameters`'a bak; adlar farklıysa oradaki adı kullan.

**Birim testleri (`tiles.test.ts`):** parçaların birleşimi sayfa bitmap'ini **boşluksuz ve çakışmasız** kaplar (toplam alan = bw·bh, 3 farklı boyut); `tilesForRect` görünür dikdörtgen kenarında doğru parçaları döndürür; merkez sıralaması; `chooseMode` eşikte.

### 3.1.3 `lru.ts`

Bayt bütçeli, **korumalı küme** destekli LRU (görünür parçalar asla tahliye edilmez):

```ts
export class ByteLru<K, V> {
  private m = new Map<K, { v: V; bytes: number }>(); private total = 0;
  constructor(private budget: number, private onEvict: (k: K, v: V) => void) {}
  get bytes() { return this.total; }
  get(k: K) { const e = this.m.get(k); if (!e) return undefined; this.m.delete(k); this.m.set(k, e); return e.v; }
  set(k: K, v: V, bytes: number) { this.delete(k); this.m.set(k, { v, bytes }); this.total += bytes; }
  delete(k: K) { const e = this.m.get(k); if (!e) return; this.m.delete(k); this.total -= e.bytes; this.onEvict(k, e.v); }
  setBudget(b: number) { this.budget = b; }
  /** bütçeyi aşıyorsa en eskiden başlayarak tahliye et; protect(k) true ise atla */
  trim(protect: (k: K) => boolean = () => false) {
    for (const k of this.m.keys()) { if (this.total <= this.budget) break; if (!protect(k)) this.delete(k); }
  }
}
```

Testler: sıra, koruma, bütçe düşünce tahliye, `onEvict` çağrısı (canvas `width=height=0` buradan yapılır).

**Çıkış (P3.1):** `npx tsx --test tests/pdf-v4/unit/*.test.ts` (veya projede kullanılan koşucu) yeşil. Bu aşamada ürün kodu değişmedi.

---

## P3.2 Sayfa boyutları (kademeli okuma)

**Sorun:** v3'te boyutlar her sayfanın kendi `getPage`'iyle öğreniliyor; bilinmeyen sayfalar `firstPageSize` varsayımıyla çiziliyor, ölçülünce düzen kayıyor. Karışık boyutlu belgede (A4+A3+pafta) kaydırma sırasında zıplama olur.

**Karar:** Açılışta **tüm sayfa boyutlarını** küçük parçalar halinde oku (ölçülmüş M8: `getPage+getAnnotations` ×300 = 17–36 ms; yalnızca `getPage` + `view` daha da ucuz). Boyutlar bilinmeden önce tahmin = ilk sayfa.

```ts
// page-sizes.ts
export interface SizeSource { numPages: number; getPage(n: number): Promise<{ view: number[]; rotate: number; cleanup?: () => void }> }
export async function readAllSizes(
  doc: SizeSource, signal: AbortSignal, onBatch: (from: number, sizes: PageSizePt[]) => void,
  opts = { batch: 25, firstBatchBlocking: true }
): Promise<void> {
  const n = doc.numPages;
  for (let from = 1; from <= n; from += opts.batch) {
    if (signal.aborted) return;
    const to = Math.min(n, from + opts.batch - 1);
    const pages = await Promise.all(Array.from({ length: to - from + 1 }, (_, k) => doc.getPage(from + k)));
    const sizes = pages.map((p) => {
      const [x0, y0, x1, y1] = p.view; const rot = ((p.rotate % 360) + 360) % 360;
      const w = x1 - x0, h = y1 - y0;
      return rot === 90 || rot === 270 ? { w: h, h: w } : { w, h };
    });
    onBatch(from, sizes);
    if (to < n) await idle(signal);                     // her batch arası tarayıcıya nefes
  }
}
const idle = (signal: AbortSignal) => new Promise<void>((res) => {
  const ric = (globalThis as any).requestIdleCallback;
  if (ric) ric(() => res(), { timeout: 100 }); else setTimeout(res, 0);
  signal.addEventListener("abort", () => res(), { once: true });
});
```

Kurallar:
- **İlk batch (1–25) görünüm hazır olmadan önce beklenir** (Plan 02 `viewReady` kapısı); kalanı arkadan. Toplam tahmin: bilinmeyen sayfa = bilinen son sayfa boyutu.
- `p.view` kullan, `getViewport` değil (hızlı). Kullanıcı döndürmesini (`rotation`) `sizes` üzerinde **sonradan** uygula: `rotated = (rotation%180===90) ? {w:h,h:w} : {w,h}`.
- Boyut batch'i geldiğinde yerleşim yeniden hesaplanır. **Görünür sayfanın üstündeki** sayfaların boyutları değiştiyse çıpa korunur (§P3.3 `applyLayoutChange`): `scrollTop` farkı = `yeniTop[çıpaSayfa] − eskiTop[çıpaSayfa]`.
- Çok büyük belge (>5000 sayfa): `batch=50`, ilk 200 sayfa hemen, kalanı idle.
- `getPage` başarısız olursa o sayfa için tahmin boyutu kalır, `console.warn` bir kez.
- Sayfa proxy'leri burada **tutulmaz**; `page.cleanup()` çağırıp bırak (bellek). Konak (§P3.5) kendi `getPage`'ini yapar (pdf.js zaten sayfa nesnesini önbellekler).

**Birim test:** sahte `SizeSource` ile 60 sayfa, `rotate:90` olanlar yer değiştirmiş; `abort` sonrası `onBatch` çağrılmaz.

**Çıkış (P3.2):** `karisik-60` fixture'ında tüm boyutlar ilk saniyede okunur (`__pdfDebug` HUD'da `sizesKnown=60`).

---

## P3.3 Engine: geometri store'u, imperatif uygulama, sanal liste

### 3.3.1 Temel fikir

React yalnızca **hangi sayfaların mount olacağını** bilir (aralık). Sayfaların **konumu, boyutu ve ölçeği** React dışından, `PdfEngine` tarafından doğrudan DOM'a yazılır. Böylece:
- Kaydırma = **sıfır React işi** (aralık değişmedikçe re-render yok).
- Zoom animasyonu/pinch = karede yalnızca ~9 sayfa kutusunun `style.transform`'u + sizer yüksekliği + scroll konumu yazılır. React render yok.
- Sayfa kutusu **her zaman hedef geometride**; içerik (bitmap) CSS ile ölçeklenir (§P3.5). Commit anında "zıplama" olmaz.

### 3.3.2 `PdfEngine` yüzeyi

```ts
// engine.ts (DOM bilen, React bilmeyen)
export interface EngineOptions { scroller: HTMLElement; sizer: HTMLElement; gap: number; padding: number;
  paddingTopExtra: () => number; overscanPx: () => number; now?: () => number }
export interface ViewState { scale: number; scrollTop: number; scrollLeft: number; viewW: number; viewH: number }
export class PdfEngine {
  // --- girdi ---
  setSizes(from: number, sizes: PageSizePt[]): void;     // batch geldi
  setRotation(deg: number): void;
  setViewport(w: number, h: number): void;               // ResizeObserver'dan
  // --- zoom (Plan 04 bunun üstüne kurulur) ---
  getScale(): number;
  /** Tek karelik, senkron: ölçeği ayarla, çıpayı (vx,vy)'de tut, DOM'u güncelle. Gesture ve animasyon bunu çağırır. */
  setLiveScale(scale: number, anchor: DocAnchor, vx: number, vy: number): void;
  /** Zoom bitti/yerleşti: render ölçeğini hedefe terfi ettir (yeni nesil), olay yayınla. */
  settleScale(): void;
  animateScale(target: number, anchor: DocAnchor, vx: number, vy: number, ms?: number): Promise<void>;
  // --- gezinme ---
  scrollToPage(page1: number, fy?: number, behavior?: "auto" | "smooth"): void;
  scrollToRect(page1: number, rectCss: { x: number; y: number; w: number; h: number }, align?: "center" | "nearest"): void;
  getPosition(): { page: number; fy: number; fx: number };     // konum kaydı için
  restorePosition(p: { page: number; fy: number }): void;       // saf: scrollForAnchor
  // --- ölçek sınırları ve etkileşim durumu (Plan 04 bunları kullanır) ---
  readonly scroller: HTMLElement;
  minScale(): number;                                           // MIN_PDF_SCALE
  maxScale(): number;                                           // min(getMaxPdfScale(coarse), maxScaleForHeight())  (P3.8)
  clampScale(s: number): number;
  setInteraction(s: "idle" | "scrolling" | "gesture"): void;    // zamanlayıcıyı sürer; gesture, scrolling'i ezer
  captureTopAnchor(): DocAnchor & { vx: number };               // görünüm üst çizgisindeki nokta
  viewRectInPage(page1: number): { x: number; y: number; w: number; h: number } | null; // sayfa-yerel css, canlı ölçekte
  // --- sorgular ---
  getRange(): { first: number; last: number };                  // 1-tabanlı
  getCurrentPage(): number;
  getLayout(): Layout;
  // --- olaylar ---
  subscribe(kind: "range" | "page" | "scale" | "layout", cb: () => void): () => void;
  // --- sayfa kutusu kaydı (konak) ---
  registerPage(page1: number, el: HTMLElement): () => void;
  dispose(): void;
}
```

### 3.3.3 `setLiveScale` içi (tek senkron adım, rAF içinde çağrılır)

```ts
setLiveScale(scale, anchor, vx, vy) {
  this.scale = clampScale(scale);
  this.layout = computeLayout({ sizes: this.rotated, scale: this.scale, gap, padding, viewportW: this.viewW, paddingTopExtra: this.pt() });
  // 1) sizer boyutu (kaydırılabilir alanı oluşturur)
  this.sizer.style.width = `${this.layout.contentWidth}px`;
  this.sizer.style.height = `${this.layout.totalHeight}px`;
  // 2) scroll: çıpa (vx,vy)'de kalsın — boyut güncellemesinden SONRA yaz (aksi halde tarayıcı kırpar)
  const s = scrollForAnchor(this.layout, anchor, vx, vy, this.viewW, this.viewH);
  this.scroller.scrollLeft = s.left; this.scroller.scrollTop = s.top;
  // 3) görünür aralık değişti mi? değiştiyse 'range' olayı (React mount/unmount)
  this.updateRange();
  // 4) mount edilmiş sayfa kutuları: translate + boyut + nesil kapları ölçeği
  for (const [p, el] of this.pages) this.applyBox(p, el);
  this.emit("scale");
}
private applyBox(p1: number, el: HTMLElement) {
  const i = p1 - 1, L = this.layout;
  el.style.width = `${L.widths[i]}px`; el.style.height = `${L.heights[i]}px`;
  el.style.transform = `translate3d(${L.lefts[i]}px, ${L.tops[i]}px, 0)`;
  // nesil kapları: her biri kendi render ölçeğinde; hedefe oran uygula
  for (const g of el.querySelectorAll<HTMLElement>("[data-gen-scale]")) {
    const gs = Number(g.dataset.genScale); g.style.transform = `scale(${this.scale / gs})`;
  }
}
```

Notlar:
- `scrollLeft/Top` yazımı sizer boyutundan **sonra**. Pinch-in'de kaydırılabilir alan küçülür; tarayıcı kırpmadan önce doğru değeri yazdığımız için D8 (varsayım) bu yolla önlenir. (**Doğrulama:** Plan 04'te gerçek cihaz kontrol listesi.)
- Gesture sırasında `overflow` kaydırması `touch-action:none` ile Plan 04'te kapatılır; programatik `scrollTop` yazımı yalnızca bu aralıkta güvenlidir.
- `data-zooming` işaretini engine koyar (`setLiveScale` ilk çağrıda ekle, `settleScale`'de 150 ms sonra kaldır). Mevcut ResizeObserver koruması buna bakıyor.
- Sayfa kutusu `position:absolute; left:0; top:0; will-change:transform` **yalnızca zoom sürerken** (`engine.interacting`); durunca `will-change` kaldırılır (GPU katman belleği).
- `contain: layout paint style` sayfa kutusunda **kalmalı**.

### 3.3.4 Kaydırma ve aralık

```ts
// engine içinde
private onScroll = () => { if (this.rafScroll) return; this.rafScroll = requestAnimationFrame(() => { this.rafScroll = 0; this.updateRange(); this.updateCurrent(); }); };
// scroller.addEventListener("scroll", this.onScroll, { passive: true });
private updateRange() {
  const r = visibleRange(this.layout, this.scroller.scrollTop, this.viewH, this.overscanPx());
  if (r.first !== this.range.first || r.last !== this.range.last) { this.range = r; this.emit("range"); }
}
```

- `overscanPx` = `1.5 × viewH` masaüstü, `1.0 × viewH` mobil. Mount edilecek sayfa sayısı yine de **en çok 9** (S4 `mountedPagesMax`): çok küçük zoom'da (fit-page, küçük sayfalar) aralık 9'dan büyük olabilir; o zaman aralığı geçerli sayfa merkezli 9'a kırp **ve** `overscan`'ı küçült. Ama görünür alana giren sayfa asla kırpılmaz (görünürler çok olabilir: %25 zoom'da 20 sayfa görünür; bu durumda `mountedPagesMax` S4 için `max(9, görünür+2)` olarak yorumlanmalı. **Plan 01 budgets.json'da S4'ü yalnız %100 zoom'da koştur** diye not düş.)
- `scroll` olayında React `setState` **yok**. `range`/`page` olayları `useSyncExternalStore` ile yalnızca değişince tetikler.
- `currentPageOf` → `page` olayı yalnızca sayı değişince. Araç çubuğu, küçük resim vurgusu, konum kaydı buradan beslenir. `handlePageVisible`/IO tabanlı eski yol v4'te **kapalıdır**.

### 3.3.5 `applyLayoutChange` (boyut batch'i, döndürme, viewport genişliği değişimi)

```ts
private applyLayoutChange(kind: "sizes" | "rotation" | "viewport") {
  const anchor = this.captureTopAnchor();          // görünümün üst çizgisindeki nokta: {page,fx,fy} + vy=0
  // fit modunda scale yeniden hesaplanır (Plan 04: fit semantiği); burada yalnızca layout:
  this.layout = computeLayout(...);
  this.sizer.style...; 
  const s = scrollForAnchor(this.layout, anchor, anchor.vx, 0, this.viewW, this.viewH);
  this.scroller.scrollTop = s.top; this.scroller.scrollLeft = s.left;
  this.updateRange(); for (const [p, el] of this.pages) this.applyBox(p, el);
  this.emit("layout");
}
```

`captureTopAnchor`: `{ ...anchorFromPoint(L, scrollLeft + viewW/2, scrollTop), vx: viewW/2 }`. Yön değişiminde (S11) bu çıpa korunur; `fit` kipi korunması Plan 04'te.

### 3.3.6 React bağlayıcı: `PdfVirtualPages`

```tsx
// pdf-virtual-pages.tsx
export function PdfVirtualPages({ engine, pdfDoc, overlayProps, nightMode }: Props) {
  const range = useEngineRange(engine);               // useSyncExternalStore: {first,last} (1-tabanlı)
  const pages: number[] = []; for (let p = range.first; p <= range.last; p++) pages.push(p);
  return (<>{pages.map((p) => <PdfPageHost key={p} engine={engine} pdfDoc={pdfDoc} pageNumber={p} overlayProps={overlayProps(p)} nightMode={nightMode} />)}</>);
}
```

- `sizer` öğesi: `<div ref={sizerRef} className="pdf-content relative" style={{ overflowAnchor: "none" }}>`; **mevcut `flex-col items-center` ve `gap/padding` stilleri v4'te kaldırılır** (yerleşim motordan). `data-testid="pdf-content"` varsa korunur.
- `key={p}`: sayfa numarası. Aralık kayarken yalnızca giren/çıkan sayfalar mount/unmount olur.
- Scroll alanı `overflow:auto` ve diğer sınıflar **aynı kalır** (`[scrollbar-gutter:stable]` ile genişlik `clientWidth` ölçümünü etkiler: `viewW = scroller.clientWidth`).

**Çıkış (P3.3):** v4 bayrağıyla 300 sayfalık belgede S4 (hızlı kaydırma): `gapMaxMs ≤ 200`, `longTaskMs ≤ 100` (masaüstü), mount ≤ 9 (%100'de). Kaydırma sırasında React Profiler'da `PdfVirtualPages` yalnızca aralık değiştiğinde render oluyor (HUD sayaç: `renders`).

---

## P3.4 Zamanlayıcı, bellek yöneticisi, canvas havuzu

### 3.4.1 Zamanlayıcı

**Neden:** v3 `pdf-render-queue.ts` yalnızca "geçerli sayfaya uzaklık" önceliği biliyor; küçük resimler kuyruğu atlıyor (D15); gesture/kaydırma sırasında iş başlatmayı durdurmuyor.

Öncelik sınıfları (küçük = önce):

| Sınıf | İş | Not |
|---|---|---|
| 0 | Görünür parça (merkeze yakın önce), `whole` modu görünür sayfa | |
| 1 | Görünür sayfanın backdrop'u (yoksa) | Backdrop yoksa keskinden **önce** çizilir (hızlı, ~30–100 ms) |
| 2 | Görünür sayfaların kenar boşluğu (margin) parçaları | |
| 3 | Komşu sayfaların backdrop'u (aralık içinde) | |
| 4 | Metin katmanı / ek açıklama (konak iç işi, kuyruğa girmez, idle) | |
| 5 | Küçük resimler | Gesture/kaydırma sırasında **duraklatılır** |

Etkileşim durumu: `idle | scrolling | gesture`. Kurallar:
- `gesture`: **yeni iş başlatma**, devam edenlerden görünür-dışı olanları iptal et. Devam eden görünür iş bitebilir (iptal etmek yarım iş = çöp).
- `scrolling` (hız > 1500 px/s veya son scroll <80 ms): yalnızca **sınıf 1 ve 3** (backdrop) başlat; sınıf 0/2 bekler. Hız düşüp 80 ms sessizlik olunca sınıf 0 başlar.
- `idle`: hepsi.
- Eşzamanlılık: masaüstü 2, mobil 1 (`navigator.hardwareConcurrency ≥ 6 && deviceMemory ≥ 4` ise mobilde 2).

```ts
// scheduler.ts
export type Interaction = "idle" | "scrolling" | "gesture";
export interface Job { id: string; cls: number; dist: number; run: (signal: AbortSignal) => Promise<void>; }
export class Scheduler {
  private pending = new Map<string, Job>(); private active = new Map<string, { job: Job; ac: AbortController }>();
  private state: Interaction = "idle"; private maxConc: number;
  constructor(maxConc: number, private postTask: (fn: () => void) => void = defaultPost) { this.maxConc = maxConc; }
  setInteraction(s: Interaction) { this.state = s; if (s === "gesture") this.cancelWhere((j) => j.cls >= 2); this.pump(); }
  enqueue(job: Job) { this.cancel(job.id); this.pending.set(job.id, job); this.pump(); }
  cancel(id: string) { this.pending.delete(id); const a = this.active.get(id); if (a) { a.ac.abort(); this.active.delete(id); } }
  cancelWhere(pred: (j: Job) => boolean) { for (const j of [...this.pending.values()]) if (pred(j)) this.pending.delete(j.id); for (const [id, a] of this.active) if (pred(a.job)) { a.ac.abort(); this.active.delete(id); } }
  private allowed(j: Job) {
    if (this.state === "gesture") return false;
    if (this.state === "scrolling") return j.cls === 1 || j.cls === 3;
    return true;
  }
  private pump() {
    if (this.active.size >= this.maxConc) return;
    const next = [...this.pending.values()].filter((j) => this.allowed(j)).sort((a, b) => a.cls - b.cls || a.dist - b.dist)[0];
    if (!next) return;
    this.pending.delete(next.id);
    const ac = new AbortController(); this.active.set(next.id, { job: next, ac });
    this.postTask(() => { next.run(ac.signal).catch(() => {}).finally(() => { if (this.active.get(next.id)?.ac === ac) this.active.delete(next.id); this.pump(); }); });
    this.pump();
  }
}
const defaultPost = (fn: () => void) => { const s = (globalThis as any).scheduler; if (s?.postTask) s.postTask(fn, { priority: "user-visible" }); else setTimeout(fn, 0); };
```

- İptal sinyali `run` içinde `renderTask.cancel()`'a bağlanır (`signal.addEventListener("abort", () => task.cancel())`); `RenderingCancelledException` yutulur ve **tampon canvas havuza geri verilir**.
- Aynı `id` yeniden eklenince eskisi iptal (v3 davranışı korunur). `id` biçimi: `t:${doc}:${page}:${gen}:${col}:${row}`, `b:${doc}:${page}`, `th:${doc}:${page}`.
- Eski `pdfRenderQueue` v3'te kalır (bayrak). v4 onu **kullanmaz**.

**Birim test (`scheduler.test.ts`):** sahte `postTask` (senkron), sıralama (cls sonra dist), `gesture`'da yeni iş başlamaz, `scrolling`'de yalnızca cls 1/3, `cancel` aktif işin sinyalini abort eder, `maxConc` aşılmaz.

### 3.4.2 Bellek yöneticisi (`governor.ts`)

**Gerçekler:** iOS Safari'de tek canvas ≈16,7 MP, **toplam canvas belleği** sınırlı; aşılınca canvas sessizce boş döner veya sekme yeniden yüklenir (kaynaklar 00 dosyasında). Chrome Android düşük bellekli cihazda sekmeyi öldürür. Bu yüzden sayfa sayısı değil **bayt** bütçesi tutarız.

Bütçeler (başlangıç değerleri, gerçek cihazda ayarla; Plan 01 S7/S8 üst sınırı 160/80 MB):

| | masaüstü | mobil |
|---|---|---|
| Keskin parçalar + whole canvas (toplam) | 112 MB | 48 MB |
| Backdrop önbelleği | 40 MB | 16 MB |
| Tampon havuzu (en çok) | 8 MB | 4 MB |
| **Toplam tavan** | **160 MB** | **68 MB** |

Toplam, Plan 01 S7/S8 ölçütlerinin (160 / 80 MB) içinde kalır; ölçüt `canvasStats().bytesMB` ile doğrulanır. Bunlar **başlangıç değerleridir**: gerçek cihazda HUD ile ölçüp `governor` yapılandırmasından (tek yer) ayarla.

```ts
// governor.ts
export class Governor {
  sharp: ByteLru<string, HTMLCanvasElement>; backdrop: ByteLru<string, HTMLCanvasElement>;
  private visibleKeys = new Set<string>();
  constructor(private cfg: { sharpBytes: number; backdropBytes: number }) {
    const free = (_: string, c: HTMLCanvasElement) => { c.width = 0; c.height = 0; };    // Safari: belleği hemen bırak
    this.sharp = new ByteLru(cfg.sharpBytes, free); this.backdrop = new ByteLru(cfg.backdropBytes, free);
  }
  setVisible(keys: Iterable<string>) { this.visibleKeys = new Set(keys); }
  addSharp(key: string, c: HTMLCanvasElement) { this.sharp.set(key, c, c.width * c.height * 4); this.sharp.trim((k) => this.visibleKeys.has(k)); }
  addBackdrop(key: string, c: HTMLCanvasElement) { this.backdrop.set(key, c, c.width * c.height * 4); this.backdrop.trim((k) => this.visibleKeys.has(k)); }
  /** sekme gizlenince / bellek baskısında */
  trimTo(frac: number) { this.sharp.setBudget(this.cfg.sharpBytes * frac); this.backdrop.setBudget(this.cfg.backdropBytes * frac); this.sharp.trim(); this.backdrop.trim(); }
  onAllocFailure() { this.cfg.sharpBytes *= 0.5; this.cfg.backdropBytes *= 0.5; this.trimTo(1); }
}
```

- **Tahsis hatası algılama:** `canvas.getContext("2d")` `null` dönerse veya `drawImage` sonrası `getImageData(0,0,1,1)` istisna atarsa → `governor.onAllocFailure()` (bütçeyi yarıya indir), o parça iptal ve yeniden kuyruğa. HUD'da `allocFailures` sayacı.
- **Sekme gizlenince** (`visibilitychange`, `pagehide`, `freeze`): `trimTo(0)` → keskin canvas'ların hepsi sıfırlanır, backdrop `0.25` tutulur; görünür olunca sınıf 0 işleri yeniden kuyruğa girer. Hedef: S13 `canvasBytesMBHiddenMax` 24/16.
- **Performans izleme:** `performance.memory` (yalnızca Chromium) varsa `usedJSHeapSize` HUD'a. Karar mekanizması buna **bağlı değil**.
- `deviceMemory ≤ 2` veya `hardwareConcurrency ≤ 2` → mobil bütçelerin `0.6`'sı ("düşük uç" profili).

### 3.4.3 Canvas havuzu

```ts
// canvas-pool.ts
export class CanvasPool {
  private free: HTMLCanvasElement[] = [];
  constructor(private maxBytes: number) {}
  acquire(w: number, h: number): HTMLCanvasElement {
    const i = this.free.findIndex((c) => c.width === w && c.height === h);
    if (i >= 0) return this.free.splice(i, 1)[0];
    const c = document.createElement("canvas"); c.width = w; c.height = h; return c;
  }
  release(c: HTMLCanvasElement) {
    let total = this.free.reduce((s, x) => s + x.width * x.height * 4, 0) + c.width * c.height * 4;
    if (total > this.maxBytes) { c.width = 0; c.height = 0; return; }   // havuz dolu: bırak
    this.free.push(c);
  }
  clear() { for (const c of this.free) { c.width = 0; c.height = 0; } this.free = []; }
}
```

Tamponlar aynı boyutta tekrar kullanılır (parça ızgarasında çoğu parça aynı boyutta), GC baskısı düşer; Safari'de ayrılan canvas belleği geç bırakıldığı için `width=height=0` kuralı korunur.

**Çıkış (P3.4):** birim testler yeşil; S8 (100 zoom döngüsü + kaydırma): heap büyümesi ≤30 MB, `canvasBytesMB` bütçe içinde; S13 gizleme testi.

---

## P3.5 Sayfa konağı (`PdfPageHost`)

### 3.5.1 DOM yapısı

```
<div ref=boxRef data-page data-testid="pdf-page-N" data-page-number data-page-state=…
     style="position:absolute;left:0;top:0;width/height/transform → ENGINE yazar; contain:layout paint style">
  <div class="placeholder">           // yalnızca state="empty" iken görünür (sayfa numarası + beyaz zemin)
  <div class="gen" data-gen-scale="0.9"  style="position:absolute;left:0;top:0;width:W(0.9);height:H(0.9);transform-origin:0 0">
     <canvas data-layer="backdrop">   // yalnızca en yeni nesil kabında; bkz. 3.5.3
     <canvas data-layer="sharp" style="position:absolute;left:cssX;top:cssY;width:cssW;height:cssH"> × (parça sayısı)
  </div>
  <div class="gen" data-gen-scale="1.35" …>  // yeni nesil (parçalar geldikçe dolar)
  <div class="overlays" data-gen-scale="1.35">  // metin/vurgu/ek açıklama: EN YENİ render ölçeğinde (render ölçeği = settle edilen)
</div>
```

- Nesil kabı genişlik/yüksekliği **o nesil ölçeğinde** sayfa boyutudur; `transform: scale(live/genScale)` engine tarafından yazılır (§3.3.3).
- Z sırası: placeholder(0) < backdrop(1) < eski nesil sharp(2) < yeni nesil sharp(3) < metin(4) < vurgu(5) < ek açıklama(6). Mevcut `PDF_LAYER_Z_INDEX` sabitlerini yeniden kullan, aralarda boşluk bırak.
- Sayfa kutusu arka planı: beyaz (gece modunda §P3.9). `rounded-sm shadow-xl` mevcut görünüm korunur; `transition-shadow` **kaldırılır** (zoom sırasında gereksiz).
- `data-page-state` hesabı konağın içinde, tek yerde:

```ts
const state = !hasBackdrop && !hasAnySharp ? "empty"
            : visibleTilesAllSharp(currentGen) ? "rendered" : "backdrop";
```

  `visibleTilesAllSharp`: mevcut nesilde, görünür dikdörtgenle kesişen **tüm** parçalar çizilmiş. Eski nesil parçaları sayılmaz (test keskinlik ölçümü bu yüzden `rendered`'a bakar).

### 3.5.2 Nesil (generation) mantığı: titremesiz zoom

`settleScale()` çağrılınca `renderScale = liveScale` (yeni nesil `g+1`). Konak:
1. Yeni nesil kabını oluşturur (boş), `data-gen-scale = renderScale`.
2. Görünür parçaları zamanlayıcıya sınıf 0 ile ekler.
3. **Eski nesli yerinde bırakır** (CSS ile ölçeklenmiş halde görünür kalır).
4. Yeni nesilde görünür parçaların **hepsi** hazır olunca (veya 2500 ms zaman aşımı) eski nesli kaldırır (`c.width=0`).
5. Bir nesil kaldırılırken içindeki parçalar governor'dan da silinir.
6. En fazla **2 nesil** yaşar; üçüncü başlarsa en eskisi hemen düşer (hızlı ardışık zoom'da yığılmayı önler). Bu, `pdf.js discussion #19770` yönteminin parça düzeyine uygulanmasıdır (eski canvas CSS ile ölçeklenir, yenisi arka planda çizilir).

Keskinlik kuralı: eski nesil `live/genScale` oranı **4×'ten büyük** (aşırı büyütme, bulanık) veya **0,25×'ten küçük** olursa o nesil artık "görsel olarak işe yaramaz", yine de backdrop kalır; sadece korunur.

**Render ölçeği ne zaman terfi eder?** (aşırı yeniden çizimi önlemek için)
- Zoom animasyonu/pinch bittikten 120 ms sonra (`settleDebounceMs`).
- Pinch/animasyon sürerken **terfi yok**; içerik yalnızca CSS ile ölçeklenir.
- `|live/renderScale − 1| < 0.02` ise terfi **yok** (gereksiz yeniden çizim).
- Sürekli tekerlek zoom'unda (trackpad) debounce her olayda sıfırlanır.

### 3.5.3 Backdrop

- Her sayfa için **tek düşük çözünürlüklü tam sayfa bitmap**: uzun kenar 640 px (mobil) / 960 px (masaüstü), `outputScale=1`, `whole` yolu. Maliyet küçük (~30–100 ms; **varsayım**, Plan 01 `renderMs` ile doğrula).
- `governor.backdrop` içinde saklanır (anahtar `b:${doc}:${page}`), ölçekten **bağımsızdır**: aynı bitmap her zoom'da kullanılır, CSS ile hedef boyuta gerilir. Bu, hızlı kaydırmada ve zoom'da sayfanın **asla beyaz görünmemesini** sağlar.
- Backdrop canvas'ı sayfa kutusunun **ayrı alt katmanında** (z=1) tüm sayfa boyutuna gerilir (`width:100%;height:100%`), nesil kaplarının altında. Keskin parçalar tamamen kapladığında bile kalır (maliyetsiz).
- Çok büyük sayfada (A0) backdrop uzun kenar 960'a oranla çok bulanık görünür; bu istenen davranış (ön izleme). Büyük sayfalarda `maxDim` 1280 olabilir (bellek: 1280×905×4≈4,6 MB).
- Gece modunda backdrop da aynı filtreyi alır (§P3.9).

### 3.5.4 Parça yaşam döngüsü (konak içi)

```ts
// pdf-page-host.tsx (özet)
useEffect(() => {
  // girdi: page proxy, renderScale(gen), rotation, visibleRect(sayfa-yerel css, render ölçeğinde), engine.interaction
  // 1) mode = chooseMode(cssW@renderScale, cssH@renderScale, o, WHOLE_MAX[profile])
  // 2) hedef parça listesi:
  //    whole  → [tek parça]
  //    tiles  → tilesForRect(cssW, cssH, o, TILE, visibleRect, margin = TILE/o)
  // 3) her parça için: governor.sharp.get(key) varsa canvas'ı DOM'a ekle (anında); yoksa scheduler.enqueue(cls: görünür?0:2, dist)
  // 4) listede olmayan parçalar DOM'dan çıkar (governor'da kalabilir; LRU karar verir)
}, [page, renderScale, rotation, visibleRectKey, profile]);
```

- `visibleRect` dönüşümü: engine'den `viewRectInPage(page1)` = scroller görünümünün sayfa kutusuyla kesişimi, **render ölçeğine** çevrilmiş (`/ (live/renderScale)`). `engine.subscribe("scale"|"range")` ve scroll rAF'ında değişince yeniden hesapla, ama React state yerine **ref + küçük debounce (50 ms)** ile `visibleRectKey` (parça aralığı `c0-c1/r0-r1` dizgisi) değiştiğinde güncelle. Böylece parça kümesi değişmedikçe efekt çalışmaz.
- Parça tamamlanınca: canvas'ı `gen` kabına ekle, `governor.addSharp`, `data-page-state` güncelle (konak içi `useState` yalnızca `empty/backdrop/rendered` geçişinde değişir).
- **Parça sayfa başına üst sınırı:** `whole` dışında en çok 16 parça (4×4); aşılırsa margin 0'a düşür.
- Sayfa unmount (aralıktan çıktı): bekleyen/aktif işleri iptal, DOM canvas'larını kaldır; **governor'daki parçalar kalır** (geri dönünce anında gelir), bellek baskısında LRU tahliye eder. Backdrop kalır.
- `page.cleanup()` yalnızca bir sayfa **hiçbir önbellekte parçası kalmayınca** çağrılır; her unmount'ta çağırma (pdf.js sayfa kaynaklarını yeniden çözmek pahalı).
- Hata: `page.render` hatası (iptal hariç) → parça `error` durumu, 1 kez yeniden dener (500 ms), olmazsa HUD `renderErrors++` ve sayfa backdrop'ta kalır (beyaz değil). Kullanıcıya sessiz; üç ardışık sayfa hatası olursa mevcut hata bandı (`unsupported`/`error`) yerine "Bu sayfa tam çizilemedi, yeniden dene" küçük bildirimi (Plan 05).

### 3.5.5 Metin, vurgu ve ek açıklama katmanı (`pdf-page-overlays.tsx`)

**Taşıma, yeniden yazma değil.** `pdf-page-view.tsx` içindeki şu bölümleri **davranışı değiştirmeden** yeni bileşene taşı:
- metin katmanı efektleri (satır ~277–372: `TextLayer` oluşturma, `update({viewport})`, `endOfContent`, `selecting` sınıfı),
- `PdfHighlightLayer` kullanımı,
- ek açıklama/bağlantı katmanı (satır ~520–642, **önce oku**: bağlantı tıklaması `onNavigateDestination`, `convertPdfRectToViewport`).

Farklar (yalnızca bunlar):
- `scale`/`viewport` artık **render ölçeğinde** (`renderScale`) verilir; kap `data-gen-scale={renderScale}` taşır (CSS ölçekleme engine'de).
- Metin katmanı **görünür ±1 sayfa** (aralığın dar penceresi) için kurulur ve `scheduler` dışı, `requestIdleCallback` ile, `scrolling` durumunda **ertelenir**. Aralığa girmemiş sayfada metin katmanı yok (DOM düğümü azalır).
- Zoom sırasında metin katmanı yeniden çizilmez (CSS ile ölçeklenir); `settle` sonrası `textLayer.update({ viewport })`. `--scale-factor` CSS değişkeni yeni render ölçeğine ayarlanır (mevcut kod).
- Seçim: kullanıcı bir sayfada seçim yaparken o sayfa **unmount edilmez** (aralık dışına çıksa bile `selectionPin`): `document.getSelection()` aktifken seçimin içerdiği sayfa numaralarını engine'e `pin` olarak bildir; engine bu sayfaları aralığa ekler. Seçim bitince serbest.

**Çıkış (P3.5):** v4 bayrağıyla
- S2 (klavye zoom ×3 in, ×6 out, ×3 in): `blankFrames=0`, `anchorDriftPx ≤ 1`, `sharpMs ≤ 800` (masaüstü).
- S7 (A0 vektör, her zoom düzeyi): her canvas ≤ 16 MP, toplam bellek ≤ 160/80 MB, `sharpRatio ≥ 0.95`; **%500'de render tamamlanıyor** (v3'te tamamlanmıyordu, 00 M3).
- Manuel: A0 sayfa %800'e kadar zoom: parçalar kenarlarında dikiş (seam) görünmüyor (gutter+kırpma). Görsel dikiş testi için `tests/pdf-v4/unit` yerine ekran görüntüsü karşılaştırması: aynı bölge tam-sayfa render (küçük zoom'da) ile parça render'ın piksel farkı %0,5'in altında (Plan 01 `a0-vektor` fixture, M4 yöntemi).

---

## P3.6 Studio entegrasyonu (bayrak `v4`)

Kural: `pdfjs-studio.tsx`'te **eski ve yeni yolu yan yana** tut: `engineFlag === "v4" ? <V4Pages/> : <eski liste>`. Eski kod silinmez.

### 3.6.1 Kurulum

- Mevcut kaydırma `div` (`data-testid="pdf-scroll-viewport"`) aynı; içindeki `pdf-content` bloğu v4'te `<div ref={sizerRef} …/>` + `<PdfVirtualPages/>`.
- `engine` örneği `useRef` içinde, `scroller`/`sizer` mount olunca oluşturulur (`useLayoutEffect`), unmount'ta `dispose()`.
- `viewReady` kapısı (Plan 02 K3): v4'te `viewReady = ilk boyut batch'i geldi && engine.layout kuruldu && viewport genişliği ≥ 2`.
- `ResizeObserver` (mevcut, ~844–870): v4'te `engine.setViewport(w,h)` çağırır; fit modunu yeniden uygulama mantığı mevcut koddan **aynen** çalışır ama ölçek uygulaması `engine.setLiveScale`/`settleScale` üzerinden yapılır (Plan 04 fit semantiği).

### 3.6.2 Eşleştirme tablosu (v3 kavramı → v4)

| v3 | v4 |
|---|---|
| `currentPage` state + `handlePageVisible` (IO) | `engine.subscribe("page")` → `setCurrentPage` (yalnızca değişince) |
| `pageDimensions`/`firstPageSize`/`handleDimensionsMeasured` | `page-sizes.ts` → `engine.setSizes` |
| `scale`/`renderedScale` state | `engine.getScale()`; `renderedScale` konakta (render ölçeği, settle edilir). React `scale` state yalnızca **settle** anında güncellenir (araç çubuğu yüzdesi, 100 ms'de bir güncelle, canlı yüzde için `engine.subscribe("scale")` + rAF throttle) |
| `scrollToPage(n)` (offsetTop) | `engine.scrollToPage(n)` |
| konum kaydı `{page, scrollRatio, scale}` (`onScroll` içinde) | `engine.getPosition()` → `{page, fy, fx, scale}`; `scrollRatio` eski kayıtlarla **uyumlu okunur** (eski kayıt gelirse `page` kullan, `fy=0`) |
| konum geri yükleme (`setTimeout` zinciri) | `engine.restorePosition` (saf), `viewReady` sonrası tek çağrı (Plan 02 K3 rAF döngüsüne gerek kalmaz; v3 yolu için K3 kalır) |
| arama sonucuna atla | `engine.scrollToRect(page, rect, "center")`; `rect` = `convertPdfRectToViewport(viewport@scale, match.rect)` (saf; DOM sorgusu **yok**, sayfa mount olmasa da çalışır) |
| iç bağlantı/yer imi hedefi (`handleNavigateDestination`) | hedef `pageIndex` + `[x,y]` → `engine.scrollToRect` veya `scrollToPage(page, fy)` |
| küçük resme tıkla | `engine.scrollToPage(n)` |
| `data-zooming` | engine ekler/kaldırır |

### 3.6.3 Dikkat edilecekler

1. **Arama vurgusu:** `searchMatches` yalnızca mount edilmiş sayfaların `overlays`'ine gider. Sonuç listesindeki sayfa **mount olmamışsa** `scrollToRect` onu aralığa getirir; vurgu mount sonrası çizilir (`isCurrentMatchPage` mantığı aynı).
2. **Yazdırma/indirme:** bu bileşende yazdırma yoksa bu madde yok. (Kontrol et: `grep -n "print" pdfjs-studio.tsx`.) Varsa tarayıcı yazdırması artık yalnızca mount edilen sayfaları görür → pdf'i **indirip yeni sekmede aç** yolunu kullan (zaten indirme düğmesi var), uyarıyı koru.
3. **Tarayıcı bul (Ctrl+F):** mount edilmemiş sayfaların metni bulunmaz. Uygulamanın kendi arama çubuğu bunun içindir; mevcut `Ctrl+F` kısayolu zaten uygulama aramasına gidiyor (satır ~1319). Bu davranış v3'te de pencereli olduğu için **kötüleşmez**.
4. **Seçim sürüklerken kaydırma:** otomatik kaydırma sırasında aralık değişir; seçim pin'i (§3.5.5) sayfaları tutar.
5. **Erişilebilirlik:** `role="document"` kaydırma alanında; her sayfa kutusu `aria-label="Sayfa N / M"`; mount edilmemiş sayfalar ekran okuyucuya görünmez. Plan 05'te sayfa-atlama duyuruları (live region).
6. **El aracı / kaydırma çubuğu / sayfa kaydırıcı (`pdf-page-scrubber`):** `scrollTop`/`scrollHeight` kullanıyorsa `engine.getLayout().totalHeight` ve `pageAtY` ile hesapla (aynı kaynak).
7. **Mobil `paddingTop` (araç çubuğu payı):** studio kaydırma `div`'ine `paddingTop` veriyor (satır ~1794). v4'te bunu `paddingTopExtra` olarak engine'e ver ve `div`'den **kaldır** (yoksa çift sayılır). Araç çubuğu gizlenip gösterilince `paddingTopExtra` değişirse `applyLayoutChange("viewport")` ile çıpa korunur. *(Mevcut davranış: araç çubuğu `toolbarHeight` kadar yer kaplıyorsa onu aynen kullan.)*

**Çıkış (P3.6):** Plan 01 S1–S5 + mevcut e2e paketi (`pdf-viewer-v2-faz-b.spec.ts`, `check-dokumantasyon-studio-*`) v4 bayrağında **eski ile aynı yeşil**; bayrak v3'te değişmedi. Eski e2e'nin `offsetTop`/DOM sıralamasına bağlı varsayımları varsa Luna bunları **test altyapısı yardımcılarıyla** (`engine.scrollToPage` yerine `__pdfDebug.scrollToPage`) güncellemeden önce raporlar.

---

## P3.7 Küçük resimler (D15)

Bugün `pdf-thumbnail-sidebar.tsx` (343 satır) render kuyruğunu atlıyor. v4:
- Küçük resim işleri `scheduler`'a sınıf 5 ile girer, `id: th:${doc}:${page}`. Panel görünür değilse (kapalı/mobilde gizli) **iş yok**.
- Küçük resim bitmap'i **backdrop önbelleğinden türetilir** (varsa): backdrop 640–960 px olduğu için 120–160 px küçük resim için tekrar render gerekmez; `drawImage` ile küçült. Yoksa kendi küçük render'ı (`scale = 140/pageWidthPt`), sonucu `governor.backdrop`'a **değil**, küçük bir ayrı LRU'ya (4 MB) koy.
- Sanal liste mevcut; yalnızca render kaynağı değişir.
- Kaydırma/gesture sırasında duraklar (zamanlayıcı kuralı).

**Çıkış:** S14 (küçük resim paneli açıkken hızlı kaydırma): `gapP95Ms ≤ 40` (masaüstü), `≤ 60` (mobil).

---

## P3.8 Yükseklik koruması ve büyük belge sınırları

Tarayıcılar tek öğenin yüksekliğini sınırlar (Chrome/Safari ≈ 33,5 M px; Firefox ≈ 17,9 M px; **aşılınca kaydırma alanı kısalır veya bozulur**). v3 bunu hiç denetlemiyor.

**Kural:** `HEIGHT_CAP = 15_000_000` px (en kısıtlı tarayıcının altında güvenli). `maxScaleForDoc = max olan s: totalHeight(s) ≤ HEIGHT_CAP`; ikili arama ile engine hesaplar:

```ts
export function maxScaleForHeight(sizes: PageSizePt[], gap: number, padding: number, cap = 15_000_000): number {
  let lo = 0.1, hi = 20;                         // zoom üst sınırı: 2000%
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    let h = 2 * padding - gap; for (const s of sizes) h += s.h * mid + gap;
    if (h <= cap) lo = mid; else hi = mid;
  }
  return lo;
}
```

- `engine.setLiveScale` ve zoom komutları `clampScale(scale)` içinde `Math.min(ZOOM_MAX, maxScaleForDoc)` uygular. Yüzde kutusu/ön ayar listesi bu üst sınırı kullanır; üst sınıra çarpan kullanıcıya kısa bildirim: "Bu belgede daha fazla yakınlaştırma desteklenmiyor." (Plan 05'te toast).
- Yatay genişlik de aynı kapla sınırlı (`contentWidth ≤ 15 M`); pratikte pafta için zoom üst sınırı belirler.
- **Gerçekçi sayılar:** 1000 sayfa A4 (842 pt) %100 → 0,96 M px sorun yok; %1000 → ~9,6 M px yine içinde; 5000 sayfa %500 → ~21 M px → sınır devreye girer. Yani sınır nadir ama kesin güvenlik sağlar.
- **Çok sayfalı belgede `Float64Array`** kullanıldığı için 50.000 sayfada bile `computeLayout` ~ <1 ms (**varsayım**, birim testte 50.000 sayfa için 5 ms altı koşulu koy).
- Sayfa sayısı çok büyükse (>2000) `setLiveScale` içinde her karede `computeLayout` O(N) çalışır: 2000 sayfa × kare başına ~0,05 ms = ihmal edilebilir. 50.000 sayfada karede 1 ms; kabul edilebilir. Gerekirse `tops`'u ölçek-doğrusal parçalara ayırıp önbellekle (yalnızca ölçülürse).

---

## P3.9 Gece modu (D14) ve sekme gizleme

### Gece modu

v3: her canvas'a `filter: invert(1) hue-rotate(180deg)`. Büyük canvas'ta filtre her kompozitte pahalı olabilir (varsayım, ölçülmedi).

**Karar (ölçüm koşullu):**
1. **Varsayılan:** filtreyi **tek bir sarmalayıcıya** (sizer) uygula, parça canvas'larına değil. Maliyet viewport pikseline bağlı kalır, sayfa/parça sayısına değil.
2. **Ölçüm:** Plan 01 S2/S4'ü `nightMode` açıkken de koş (`?night=1` veya localStorage, Plan 01'de yoksa Luna ekler). Takılma bütçeyi geçerse **3.**'ye geç.
3. **Alternatif (yalnızca gerekirse):** `ctx.filter` ile **parça oluştururken** bir kez uygula (`ctx.filter = "invert(1) hue-rotate(180deg)"` + `drawImage`). `CanvasRenderingContext2D.filter` Safari'de yeni sürümlerde var, **eski sürümlerde yok**; yoksa 1. yöntemde kal. İkisi arasında geçiş: `"filter" in CanvasRenderingContext2D.prototype`.
4. Metin katmanı (şeffaf metin) ve vurgu filtre **dışında** olmalı (aksi halde vurgu rengi bozulur); mevcut davranışı koru: filtre yalnızca canvas/backdrop katmanlarında kalacaksa sarmalayıcı yerine `[data-layer]` canvas'lara CSS sınıfıyla uygula. **Önce 1'i dene, vurgu bozulursa canvas-bazlı CSS'e dön** (bugünkü davranış).
5. Gece modunda sayfa arka planı `bg-zinc-950` yerine **beyaz + filtre** (ters çevrilince koyu); mevcut render zaten bunu yapıyor, `alpha:false` bağlam beyaz zemine ihtiyaç duyar.

### Sekme gizleme ve bellek baskısı

- `document.visibilitychange` → `hidden`: `scheduler.setInteraction("gesture")` (iş durdur), `governor.trimTo(0)`, havuzu `clear()`; `visible`: `idle` + görünür parçaları yeniden kuyrukla. (S13)
- Mobilde `pagehide` aynı. `freeze` olayı (Chrome) aynı.
- Bellek uyarısı API'si (Safari'de yok) varsayılmaz. Kural yalnızca tahsis hatası + bütçe.

---

## P3.10 Telemetri, kademeli açılış, geri alma

### Telemetri (`?pdfdebug=1` HUD, Plan 01'deki `pdf-debug-stats.ts`)

Engine bu sayaçları yazar (varsa HUD gösterir; **üretimde yalnız bayrakla**, kullanıcı verisi toplanmaz):

`engine`, `mountedPages`, `renders`(React render sayısı), `tilesRendered`, `tilesCached`, `backdropHits/Misses`, `evictions`, `sharpBytesMB`, `backdropBytesMB`, `queueDepth`, `activeJobs`, `renderMsP50/P95`, `allocFailures`, `renderErrors`, `layoutMs` (son `computeLayout`), `interaction`.

`__pdfDebug` (yalnızca `localStorage["dok:testHooks"]==="1"` veya `?pdfdebug=1`): `scrollToPage(n)`, `getRange()`, `getLayout()`, `engine`.

### Açılış planı

1. Plan bitince `v4` varsayılan **kapalı**. Kullanıcı kendi cihazlarında `?pdfEngine=v4` ile dener.
2. Plan 01 `check:pdf-v4:gate` (üretim sunucusu) v4'te yeşil + gerçek cihaz kontrol listesi (Plan 01 §4) yapıldıktan sonra varsayılan v4. `NEXT_PUBLIC_PDF_ENGINE=v4` ile ortam bazlı açılabilir (preview → production).
3. Varsayılan v4 olduktan **bir sürüm sonra** v3'ü silme kararı **kullanıcıya** aittir; Luna silmez, silme için ayrı PR önerir.

### Geri alma

`?pdfEngine=v3` (tek kullanıcı), `NEXT_PUBLIC_PDF_ENGINE=v3` (herkes, yeniden dağıtım). Kod geri alma gerekmez.

---

## 4. Plan 04'e devredilen sözleşme (engine API)

Plan 04 gesture/zoom girdisini **yalnızca** şu çağrılarla uygular; geometriye başka yerden dokunmaz:

- `engine.setLiveScale(scale, anchor, vx, vy)` her karede (rAF), `engine.settleScale()` bitince.
- `engine.animateScale(...)` klavye/araç çubuğu/çift dokunma/ön ayar için.
- `engine.captureTopAnchor()` / `anchorFromPoint` ile çıpa üretimi.
- `engine.setInteraction("gesture" | "scrolling" | "idle")` zamanlayıcıyı sürer.
- `data-zooming` engine'dedir.

---

## 5. Risk tablosu

| Risk | Olasılık | Etki | Önlem |
|---|---|---|---|
| Mutlak konumlu sayfalarda mevcut e2e'nin DOM sırası varsayımları kırılır | Yüksek | Orta | Bayrak; test yardımcıları `data-page`'e göre; kırılanlar raporlanır |
| pdf.js `render()` `transform`+viewport kombinasyonu parça kenarında farklı çıkar | Orta | Orta | Gutter+kırpma (M4'te ölçülen çözüm); piksel farkı testi (P3.5 çıkışı) |
| Safari'de `alpha:false` + `drawImage` rengi/öncelik farkı | Düşük | Düşük | `alpha:false`'u yalnızca performans için kullan; sorun olursa kaldır |
| `scrollTop`'u gesture sırasında yazmak iOS'ta momentum/zıplama yapar | Orta | Yüksek | Plan 04'te gesture `touch-action:none`; gerçek cihaz kontrol listesi **zorunlu** |
| Seçim pin'i/Ctrl+F beklentisi | Düşük | Düşük | §3.6.3 |
| Parça ızgarası çok parçalı sayfada DOM canvas sayısı artar | Düşük | Düşük | ≤16 parça/sayfa kuralı, margin 0'a düşer |
| Bütçe sayıları yanlış (gerçek cihazda) | Orta | Orta | Başlangıç değerleri açıkça işaretli; HUD ile gerçek cihaz ölçümü; bütçeler tek dosyada (`governor` yapılandırması) |

## 6. Çıkış ölçütü (plan bütünü)

Tüm koşullar **v4 bayrağı, üretim derlemesi, `check:pdf-v4:gate`** ile:

1. S1, S2, S4, S5 (mobil), S7, S8, S13, S14 bütçeleri yeşil (masaüstü + mobil + mobile-throttled; webkit yalnızca bilgi).
2. 300 sayfalık belgede `longTaskMs` ve `gapMaxMs` **v3 tabanından en az %70 düşük** (taban: 00 M6; gate'in kendi taban dosyasıyla karşılaştır).
3. A0 vektör %500 ve %800'de render tamamlanır, tek canvas ≤ 16 MP, keskinlik ≥ 0,95.
4. Mevcut e2e ve `check-dokumantasyon-studio-*` paketleri v4'te yeşil.
5. Bayrak v3'te davranış değişmemiş (S1/S2 taban ± gürültü).
6. Rapor: `docs/pdf-viewer-v4/03-sonuc.md` (taban/yeni tablo, açık kalan maddeler, **bütçe sayıları değiştiyse neden**).
