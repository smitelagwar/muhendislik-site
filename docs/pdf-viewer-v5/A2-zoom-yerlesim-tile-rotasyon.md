# A2 — Zoom yerleşimi, tile seçimi, döndürme (H3, H4, H6, H7)

**Önce oku:** `00-OKU-ONCE.md`. **Ön koşul:** A1 bitmiş ve yeşil (özellikle `engine.setPageKeys`, `refresh`, `bumpTiles`).

## Dosyalar
- `src/lib/dokumantasyon/studio/pdf/engine/engine.ts`
- `src/lib/dokumantasyon/studio/pdf/engine/use-pdf-engine.ts`
- `src/components/dokumantasyon/studio/pdf/engine/pdf-page-host.tsx`
- `src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx` (**yalnız** motor kurulum efekti: `// PDF v4 Motor Entegrasyonu` ve `// v4: Rotasyon Değişimi` civarı; `Select-String "PDF v4 Motor Entegrasyonu"` ile bul, ±40 satır oku)
- YENİ: `tests/pdf-v4/v5-a2-zoom-yerlesim.spec.ts` (yardımcılar: `helpers/v5.ts`)

## Kök neden (kanıtlı)
- **H3:** `computeLayout` her sayfayı içerik genişliğinin (en geniş sayfa) ortasına koyar. `karisik-60`'ta en geniş sayfa 1. sayfanın 2,84 katıdır. Sayfa boyutları `readAllSizes` ile kademeli gelir; 1. batch'te içerik dar, sonra genişler. `engine.applyLayoutChange` `isAtTop` iken yalnız `scrollTop=0` yapar, **`scrollLeft`'e dokunmaz** → sayfa 1 sağa kayar ve ekran dışında kalır. Sonraki zoom'larda çıpa yanlış sayfaya düşer; 267%'de `viewRectInPage.w=19px`, 400%+'da `null` (ekran tamamen boş).
- **H4:** `PdfPageHost` efekt 6: `viewRectInPage` `null` ise (sayfa görünürde değil) `effectiveRect` = tüm sayfa → 165 tile/110 MB. Ayrıca efekt scroll'a bağlı değil: yüksek zoomda sayfa içinde kaydırınca yeni tile istenmez.
- **H6:** Studio'daki motor efekti bağımlılıkları `[engineFlag, pdfDoc, loading, isMobileLayout, rotation, toolbarHeight]` → döndürme/araç çubuğu yüksekliği değişince motor dispose+yeniden yaratılır; konum 1. sayfaya sıfırlanır, önbellek gider.
- **H7:** `tileKey` ve `backdropKey` `rotation` içermez (genScale aynıysa eski yönün canvas'ı geri gelir).

## Değişiklikler (cerrahi)

### 1) `engine.ts`
a. `listeners` haritasına `"view"` türü ekle (`subscribe`/`emit` tip birleşimlerine de).
b. **H3 — `applyLayoutChange`:**
```ts
const prevN = this.layout.n; // computeLayout'tan ÖNCE oku
...
// yeni layout hesaplandı, sizer boyutu yazıldı:
if (prevN === 0 && this.layout.n > 0) {
  // ilk sizes: 1. sayfayı yatayda ortala
  this.scroller.scrollLeft = Math.max(0, this.layout.lefts[0] + this.layout.widths[0] / 2 - this.viewW / 2);
  this.scroller.scrollTop = 0;
} else {
  const s = scrollForAnchor(this.layout, anchor, anchor.vx, 0, this.viewW, this.viewH);
  this.scroller.scrollLeft = s.left;                 // ARTIK her durumda yatay çıpa korunur
  this.scroller.scrollTop = isAtTop ? 0 : s.top;
}
```
(mevcut `if (isAtTop) … else …` bloğunu bununla değiştir). Fonksiyonun sonunda `this.emit("layout")`'tan sonra `this.emit("view")`.
c. `setScale` ve `settleScale` sonunda `this.emit("view")`. `onScroll` içindeki 80 ms'lik `scrollTimer` geri çağrısında `scheduler.setInteraction("idle")`'dan sonra `this.emit("view")`.
d. **H6:** `applyLayoutChange` türüne `"padding"` ekle ve yöntem ekle:
```ts
/** Mobil araç çubuğu yüksekliği veya yerleşim modu değişince üst boşluğu yeniden uygular (motor yeniden yaratılmaz). */
refreshPaddingTop(): void { this.applyLayoutChange("padding"); }
```

### 2) `use-pdf-engine.ts`
Yeni kanca (mevcut kancalar gibi `useSyncExternalStore`, `"layout"` olayına abone):
```ts
export function useEngineRotation(engine: PdfEngine | null): number { /* getSnapshot: engine ? engine.getRotation() : 0 */ }
```

### 3) `pdf-page-host.tsx`
a. **Anahtarlar (H7).** Modül seviyesinde iki yardımcı tanımla ve dosyadaki **tüm** `` `b:${…}` `` / `` `s:${…}` `` üretimlerini bunlarla değiştir (`Select-String -Pattern '`b:\$|`s:\$'` ile bul; A1'deki `keyOf`, `backdropKey`, efekt 4'teki yerel `backdropKey`, efekt 6'daki `tileKey`):
```ts
const backdropKeyOf = (doc: string, page: number, rot: number) => `b:${doc}:${page}:r${rot}`;
const tileKeyOf = (doc: string, page: number, rot: number, genScale: number, o: number, tile: string) =>
  `s:${doc}:${page}:r${rot}:${genScale}:${o}:${tile}`;
```
b. **Rotasyon aboneliği:** `const engineRotation = useEngineRotation(engine); const rotation = propRotation ?? engineRotation;` (eski `propRotation ?? engine.getRotation()` satırını değiştir). Rotasyon değişince `generations` yeni `genId` (rotation içeriyor) ile yeniden kurulur; mevcut mantık yeterli.
c. **Görünüm tick'i (H4):**
```ts
const [viewTick, setViewTick] = useState(0);
const modeRef = useRef<"whole" | "tiles">("whole"); // efekt 6'da güncellenir
useEffect(() => engine.subscribe("view", () => { if (modeRef.current === "tiles") setViewTick((n) => n + 1); }), [engine]);
```
`viewTick`'i efekt 6 **ve** efekt 7 bağımlılıklarına ekle.
d. **Efekt 6 (tile seçimi) düzeltmeleri:**
 - `modeRef.current = mode;` ata.
 - `mode === "tiles"` iken `viewRect` **null ise** `targetTiles = []` (tüm sayfayı tile'lama YOK; backdrop sayfayı örter).
 - `visibleOnly` + marj birleşimi toplam `≤ 24` tile ile sınırlı (mevcut 32 → 24).
 - `curGen.tiles` içinden `targetTiles` anahtar kümesinde **olmayanları sil** (`curGen.tiles.delete`; governor'daki canvas LRU'da kalır, `cached` yolu geri kullanır).
 - A1'de eklediğin `engine.setPageKeys(...)` çağrısından `curGen.tiles` kaynaklı üçüncü yayılımı **kaldır**; yalnız backdrop + `targetTiles` anahtarları korunur.
e. **Efekt 7:** `tiles` modunda `viewRect === null` ise `allReady=false`, durum `hasBackdrop ? "backdrop" : "empty"` (boş `needed` ile `every` yanıltmasın).

### 4) `pdfjs-studio.tsx` (motor efekti)
- `isMobileLayoutRef`, `toolbarHeightRef` oluştur (her render'da `.current = …`). `new PdfEngine({...})` içinde `initialRotation: rotationRef.current`, `paddingTopExtra: () => (isMobileLayoutRef.current ? toolbarHeightRef.current + PDF_PAGE_PADDING : 0)`.
- Efekt bağımlılık dizisini **`[engineFlag, pdfDoc, loading]`** yap (`isMobileLayout, rotation, toolbarHeight` çıkar).
- Yeni efekt: `useEffect(() => { engineInstance?.refreshPaddingTop(); }, [engineInstance, isMobileLayout, toolbarHeight]);` (engineFlag v4 iken).
- Mevcut `// v4: Rotasyon Değişimi` efekti kalır (artık motoru yeniden yaratmadan çalışır).

## Testler — `tests/pdf-v4/v5-a2-zoom-yerlesim.spec.ts` (proje `desktop`)
1. **`karisik-60: tüm boyutlar yüklenince sayfa 1 yatayda görünür`** — aç, `waitSharp`; `expect.poll(() => eng.getLayout().n)` = 60 (8 sn). Sonra `v5State.viewRectP1` null değil ve `w ≥ 200`.
2. **`karisik-60: klavye zoom ×4 boyunca geçerli sayfa ekranda ve dolu`** — fare (683,450); `Control+Equal` ×4 (her biri 1500 ms). Her adımdan sonra `eng.viewRectInPage(eng.getCurrentPage())` null değil, `w ≥ 100`, `h ≥ 100`. Son adımdan 3500 ms sonra `sharpInView ≥ 1`, `blankInView === 0`.
3. **`a0-vektor: yüksek zoomda sayfa içi kaydırma yeni tile çizer, tüm sayfa tile'lanmaz`** — aç, `Control+Equal` ×3, 4000 ms; `scroller.scrollBy(0, 1500)`, 4000 ms. `sharpInView ≥ 1`, `blankInView === 0` ve `document.querySelectorAll('[data-page="1"] canvas[data-layer="sharp"]').length ≤ 40`.
4. **`döndürme konumu ve motoru korur`** — `karisik-60`; `eng.__t = 7`; `scrollToPage(10)`, 1500 ms; scroller odak; `Control+Shift+Equal`; 2500 ms. `cur === 10`, `eng.__t === 7`, `rot === 90`, `sharpInView ≥ 1`, `blankInView === 0`.
5. **`döndürme sonrası görüntü yönü doğru`** — `tr-metin`; 3 kez `Control+Shift+Equal` (270°) arasında 2500 ms; her adımda sayfa 1 kutusunun `w/h` oranı ile içindeki ilk `canvas[data-layer="sharp"]`'ın `width/height` oranı arası fark ≤ %3.

## Kırmızı kanıtı
Değişiklikten önce testleri koş (`--project=desktop --reporter=line | Select-Object -Last 60`). Beklenen kırmızılar: 1, 2 (viewRect null), 3 (tile sayısı > 40 veya `sharpInView 0`), 4 (`cur 1` + `__t` kayıp). Test 5 kırmızı olmayabilir (cache kaçırma tesadüfe bağlı) → nedenini raporla; yine de yeşil kalmalı.

## Kapı
```powershell
npx tsc --noEmit --incremental false
npm run check:pdf-v4:unit
npx playwright test --config=playwright.pdf-v4.config.ts tests/pdf-v4/v5-a1-bellek.spec.ts tests/pdf-v4/v5-a2-zoom-yerlesim.spec.ts --project=desktop --reporter=line 2>&1 | Select-Object -Last 50
```
Ayrıca `layout.test.ts`/`engine.test.ts` kırılırsa **testi değil kodu** düzelt. `engine.test.ts`'e iki test ekle: (i) boş layout'tan karışık boyutlu ilk `setSizes` sonrası `scroller.scrollLeft` 1. sayfa merkezini görünüm merkezine getirir; (ii) `setRotation` sonrası `getPosition().page` değişmez.

## Dokunma
`computeLayout`, `layout.ts`, `tiles.ts` (matematik doğru; değiştirme), CAD dosyaları.
