# A1 — Bellek, sekme dönüşü ve render dayanıklılığı (H1, H2, H5, H18)

**Önce oku:** `00-OKU-ONCE.md` (kurallar + token kuralları). Bu aşamada yalnız aşağıdaki dosyalar açılır.

## Dosyalar
- `src/lib/dokumantasyon/studio/pdf/engine/engine.ts`
- `src/lib/dokumantasyon/studio/pdf/engine/governor.ts` (değişiklik gerekmez, yalnız oku)
- `src/components/dokumantasyon/studio/pdf/engine/pdf-page-host.tsx`
- `playwright.pdf-v4.config.ts`
- YENİ: `tests/pdf-v4/helpers/v5.ts`, `tests/pdf-v4/v5-a1-bellek.spec.ts`

## Kök neden (kanıtlı)
1. `engine.onVisibilityChange` sekme gizlenince `governor.trimTo(0)` çağırır: bütçe 0 olur ve **geri yüklenmez** (`trimTo(1)` yalnız `onAllocFailure`'da). `Governor.setVisible` hiç çağrılmadığı için hiçbir anahtar korunmaz → ekrandaki tile canvas'ları `width=0` yapılır, sonraki her yeni tile ekleme anında silinir. Sayfalar `data-page-state="rendered"` görünür ama boştur.
2. Aynı `setVisible` eksikliği normal kullanımda da (500% zoom, 110 MB) ekrandaki tile'ların silinmesine yol açar.
3. `PdfPageHost` her tile için `setGenerations((prev) => [...prev])` çağırır → `Maximum update depth exceeded`.
4. Tile/backdrop render hataları boş `catch` ile yutulur.

## Değişiklikler (cerrahi)

### 1) `engine.ts` — görünür anahtar koruması + dönüşte toparlanma
- Alan ekle: `private pageKeys = new Map<number, Set<string>>();`
- Yöntem ekle:
  ```ts
  /** Sayfanın ekranda tutulması gereken tile/backdrop anahtarlarını bildirir; governor bunları tahliye etmez. */
  setPageKeys(page: number, keys: Iterable<string>): void {
    this.pageKeys.set(page, new Set(keys));
    const all = new Set<string>();
    for (const s of this.pageKeys.values()) for (const k of s) all.add(k);
    this.governor.setVisible(all);
  }
  clearPageKeys(page: number): void {
    if (!this.pageKeys.delete(page)) return;
    const all = new Set<string>();
    for (const s of this.pageKeys.values()) for (const k of s) all.add(k);
    this.governor.setVisible(all);
  }
  ```
- `listeners` haritasına `"refresh"` türü ekle; `subscribe` ve `emit` imzalarındaki birleşik tipe `"refresh"` ekle. `dispose()` zaten tüm kümeleri temizler.
- `onVisibilityChange` içinde:
  - gizlenince: `this.scheduler.setInteraction("gesture"); this.governor.trimTo(0.25); this.pool.clear();` (**`trimTo(0)` değil**; korunan anahtarlar zaten atlanır).
  - görününce: `this.governor.trimTo(1); this.scheduler.setInteraction("idle"); this.emit("range"); this.emit("refresh");`
- `pages.delete` zaten var; `registerPage` temizleyicisine dokunma.

### 2) `pdf-page-host.tsx`
- **Koruma bildirimi:** efekt 6 (`// 6. Görünür Parçaları Çizdirme`) içinde `targetTiles` hesaplandıktan hemen sonra, `forEach`'ten önce:
  ```ts
  const keyOf = (t: TileRect) => `s:${docId}:${pageNumber}:${genScale}:${o}:${t.key}`;
  engine.setPageKeys(pageNumber, [
    `b:${docId}:${pageNumber}`,
    ...targetTiles.map(keyOf),
    ...[...curGen.tiles.keys()].map((k) => `s:${docId}:${pageNumber}:${genScale}:${o}:${k}`),
  ]);
  ```
  (`tileKey` hesabını bu `keyOf` ile ortaklaştır; aynı biçim korunmalı.) Bileşen unmount olurken `engine.clearPageKeys(pageNumber)` çağıran **ayrı bir** `useEffect(() => () => engine.clearPageKeys(pageNumber), [engine, pageNumber])` ekle.
- **Ölü tile kurtarma:** `const [refreshTick, setRefreshTick] = useState(0);` ekle ve `refreshTick`'i efekt 6'nın bağımlılık dizisine ekle. Yeni efekt:
  ```ts
  useEffect(() => {
    return engine.subscribe("refresh", () => {
      for (const g of generationsRef.current) {
        for (const [k, t] of [...g.tiles]) if (t.canvas.width === 0) g.tiles.delete(k);
      }
      setRefreshTick((n) => n + 1);
    });
  }, [engine]);
  ```
  `generationsRef` = `useRef(generations)`; her render'da `generationsRef.current = generations`.
- Efekt 6'da `cached` bulunduğunda `cached.width === 0` ise bunu **kaçırma** say: `engine.governor.sharp.delete(tileKey)` çağır ve normal render yoluna düş.
- Backdrop efektinde (`// 4. Backdrop`) `cached` var ama `cached.width === 0` ise aynı şekilde `engine.governor.backdrop.delete(backdropKey)` yapıp yeniden render et.
- **H5:** İki yerdeki `setGenerations((prev) => [...prev])` (önbellekten tile ekleme ve render tamamlanınca) yerine tek bir toplu güncelleyici kullan:
  ```ts
  const bumpRaf = useRef(0);
  const bumpTiles = useCallback(() => {
    if (bumpRaf.current) return;
    bumpRaf.current = requestAnimationFrame(() => {
      bumpRaf.current = 0;
      setGenerations((prev) => [...prev]);
    });
  }, []);
  useEffect(() => () => { if (bumpRaf.current) cancelAnimationFrame(bumpRaf.current); }, []);
  ```
  (`useCallback` import et.) Efekt 6'nın bağımlılıklarına `bumpTiles` ekle.
- **H18 — hata yeniden deneme:** tile ve backdrop `catch` bloklarında `RenderingCancelledException` dışındaki hatalar için:
  - Bileşende `const retryRef = useRef(new Map<string, number>())`.
  - Hata olunca `n = (retryRef.current.get(id) ?? 0) + 1`; `n <= 2` ise `retryRef.current.set(id, n)` ve `setTimeout(() => engine.scheduler.enqueue(job), 600 * n)` (aynı `job` nesnesi; `cancelled` bayrağı true ise yeniden kuyruğa alma).
  - `n > 2` ise `setRenderFailed(true)`.
  - `pageState` türüne `"error"` ekle; `renderFailed` iken `data-page-state="error"` ve sayfa içinde ortalanmış, Türkçe: metin `Sayfa çizilemedi` + `<button data-testid="pdf-page-retry-{n}" data-no-tap>` etiketi `Yeniden dene` (tıklayınca `retryRef.current.clear(); setRenderFailed(false); setRefreshTick(n=>n+1)`). Placeholder'daki "Sayfa N" yazısı yalnız `empty` durumunda kalır.
  - Hata bilgisini mevcut tanılama kanalına yaz: `Select-String -Pattern "export function recordPdfError" -Path src -Recurse` ile bul, import et, `recordPdfError("render", e)` çağır.

### 3) `playwright.pdf-v4.config.ts`
Mobil projenin `testMatch` dizisine `"**/v5m-*"`, masaüstü projenin `testIgnore` dizisine `"**/v5m-*"` ekle (mobil testler A4'te gelecek; şimdi eklemek yeterli).

### 4) Testler
`tests/pdf-v4/helpers/v5.ts`:
```ts
import type { Page } from "@playwright/test";
import { SCROLL } from "./viewer";

export interface V5State {
  cur: number; scale: number; rot: number; scrollTop: number; scrollLeft: number;
  sharpInView: number; blankInView: number; // blankInView: görünürde width===0 olan keskin tuval
  sharpBudget: number; viewRectP1: { x: number; y: number; w: number; h: number } | null;
}
/** Motor + DOM anlık görüntüsü. `window.__pdfEngine` (pdfjs-studio.tsx) kullanılır. */
export async function v5State(page: Page): Promise<V5State> {
  return page.evaluate((SEL) => {
    const sc = document.querySelector(SEL) as HTMLElement;
    const vr = sc.getBoundingClientRect();
    const eng = (window as unknown as { __pdfEngine: any }).__pdfEngine;
    const inView = [...sc.querySelectorAll<HTMLCanvasElement>('canvas[data-layer="sharp"]')].filter((c) => {
      const r = c.getBoundingClientRect();
      return r.bottom > vr.top && r.top < vr.bottom && r.right > vr.left && r.left < vr.right;
    });
    return {
      cur: eng.getCurrentPage(), scale: eng.getScale(), rot: eng.getRotation(),
      scrollTop: Math.round(sc.scrollTop), scrollLeft: Math.round(sc.scrollLeft),
      sharpInView: inView.length, blankInView: inView.filter((c) => c.width === 0).length,
      sharpBudget: eng.governor.sharp.budget, viewRectP1: eng.viewRectInPage(1),
    };
  }, SCROLL);
}
/** Konsol hatalarını toplar; testin sonunda `errs` içinde "Maximum update depth" OLMAMALI. */
export function collectErrors(page: Page): string[] {
  const errs: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 200)); });
  page.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
  return errs;
}
```
`tests/pdf-v4/v5-a1-bellek.spec.ts` (proje `desktop`, `import { test, expect } from "@playwright/test"`, `openPdf`/`waitSharp` `./helpers/viewer`'dan):
1. **`sekme gizle-göster sonrası bütçe geri gelir ve tuvaller dolu`** — `karisik-60` aç, `waitSharp`. `document.hidden`'ı `Object.defineProperty(document,"hidden",{value:true,configurable:true})` ile true yapıp `visibilitychange` yay; 800 ms bekle; false yapıp tekrar yay; 2500 ms bekle. Beklenen: `sharpBudget > 0`, `blankInView === 0`, `sharpInView ≥ 1`. Sonra `__pdfEngine.scrollToPage(20)`, 3500 ms bekle: `blankInView === 0`, `sharpInView ≥ 1`.
2. **`ekrandaki tile'lar zorla tahliyede kurtarılır`** — `karisik-60` aç; `__pdfEngine.governor.trimTo(0)` sonra `trimTo(1)` çağır, ardından `__pdfEngine.scheduler`'a dokunmadan `document.dispatchEvent(new Event("visibilitychange"))` (hidden=false iken) ile "refresh" tetikle; 3000 ms sonra `blankInView === 0`.
3. **`yüksek zoomda 'Maximum update depth' hatası yok`** — `tr-metin` aç (tek boyutlu), `collectErrors`; `Control+Equal` ×4 (her biri 1500 ms); sonunda `errs.filter(e => /Maximum update depth/.test(e)).length === 0`.

## Kırmızı kanıtı (değişiklikten ÖNCE)
```powershell
npx playwright test --config=playwright.pdf-v4.config.ts tests/pdf-v4/v5-a1-bellek.spec.ts --project=desktop --reporter=line 2>&1 | Select-Object -Last 60
```
Beklenen: test 1 (`sharpBudget` 0, `blankInView` ≥1) ve test 3 kırmızı. Test 2 kırmızı değilse nedenini raporla.

## Kapı
```powershell
npx tsc --noEmit --incremental false
npm run check:pdf-v4:unit
npx playwright test --config=playwright.pdf-v4.config.ts tests/pdf-v4/v5-a1-bellek.spec.ts --project=desktop --reporter=line 2>&1 | Select-Object -Last 40
```
Hepsi yeşil olmalı. Unit testlerde `lru.test.ts`/`engine.test.ts` değişiklikten etkilenirse bunları **güncelleme**, önce planı gözden geçir (imza değiştirmedik; kırılmamalı). `engine.test.ts`'e `setPageKeys` için tek test ekle: iki sayfa anahtarı verildiğinde `governor.setVisible` birleşimi korur; `clearPageKeys` sonrası korunmaz.

## Dokunma
`governor.ts`, `lru.ts` imza/mantığı; `pdfjs-studio.tsx` (A1'de açma).
