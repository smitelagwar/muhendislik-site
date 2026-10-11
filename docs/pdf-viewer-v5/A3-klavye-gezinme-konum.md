# A3 — Klavye, gezinme, konum kaydı, arama (H8, H9, H10, H11, H12, H15, H16)

**Önce oku:** `00-OKU-ONCE.md`. **Ön koşul:** A1 + A2 yeşil. Bu aşama büyük ölçüde `pdfjs-studio.tsx` içindedir: **dosyayı baştan okuma**; her madde için verilen fonksiyon adını `Select-String` ile bul, ±40 satır oku.

## Dosyalar
- `src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx`
- `src/components/dokumantasyon/studio/pdf/pdf-highlight-layer.tsx` (yalnız `data-active-match` niteliği)
- Kısayol modalı: `Select-String -Path src -Recurse -Pattern "PdfShortcutsModal" -List` ile bul (metin ekleme)
- `src/lib/dokumantasyon/studio/pdf/pdf-navigation.ts` (geçmiş girdi tipi — gerekirse)
- YENİ: `tests/pdf-v4/v5-a3-klavye-gezinme.spec.ts`

## Kök nedenler (kanıtlı)
- **H8:** `Ctrl+Shift+-` için `e.key === "-"` kontrol ediliyor; Shift ile `e.key` `"_"` gelir. Ölçüm: tuştan sonra `rot` değişmedi. Türkçe Q klavyede `+` için de `e.key`'e güvenilmez → `e.code` eklenecek.
- **H15:** Space yalnız el aracını açar; PageUp/PageDown/↑/↓ hiç işlenmiyor (yalnız scroller odaktayken tarayıcı kaydırır; odak `body`'deyken sayfa kaymaz). Yatay taşma varken ←/→ yatay kaydırmaz.
- **H16:** `handleZoomIn/Out` imleç belge üzerindeyken `animate:false`, değilse `animate:true`.
- **H9:** v4 sayfa elemanında `id="pdf-page-N"` yoktur (yalnız v3 `pdf-page-view.tsx`). `handleScrubMove` `document.getElementById(...)` null bulur → scrubber sürüklerken görünüm kaymaz. `performSave` aynı yüzden `offsetRatio`'yu hep 0 yazar; ayrıca v4'te `restorePosition`, `viewReady` olunca (sayfa boyutları henüz yarım yüklüyken) çağrılır.
- **H12:** Geri/ileri geçmişi `scrollTop` (piksel) saklar; zoom/döndürme sonrası anlamsızdır.
- **H11:** Arama efekti bağımlılık zinciri `scrollToPage → triggerDebouncedSave → performSave → [isHandTool, isSidebarOpen, nightMode, sidebarTab]`; bu ayarlar değişince arama yeniden başlar ve ilk eşleşmeye atlar.
- **H10:** `handleNextMatch/PrevMatch` `scrollToPage(eşleşmeSayfası)` çağırır (sayfa başı). Aynı sayfadaki sonraki eşleşmede hiç kayma olmaz; yüksek zoomda eşleşme ekran dışında kalır.

## Değişiklikler

### 1) Tuş haritası (`handleKeyDown`, `// Kısayollar yalnızca PDF stüdyosu odaktayken`)
Yardımcılar (efektin içinde):
```ts
const isPlus = e.key === "+" || e.key === "=" || e.code === "Equal" || e.code === "NumpadAdd";
const isMinus = e.key === "-" || e.key === "_" || e.code === "Minus" || e.code === "NumpadSubtract";
```
- `mod && shift && isPlus` → saat yönü; `mod && shift && isMinus` → saat yönü tersi (mevcut iki dalı bunlarla değiştir).
- `mod && isPlus` / `mod && isMinus` zoom dalları ve `!mod` zoom dalları da `isPlus/isMinus` kullanır. `e.shiftKey` olmadan.
- **Kaydırma tuşları** (`!mod && !e.altKey && !interactive`), `const sc = scrollContainerRef.current; if (!sc) return;` ile, hepsi `e.preventDefault()` + `sc.scrollBy({ behavior: "auto", ... })`:
  - `ArrowDown/ArrowUp`: ±56 px dikey.
  - `PageDown/PageUp`: ±`sc.clientHeight * 0.9`.
  - `ArrowLeft/ArrowRight`: yatay taşma varsa (`sc.scrollWidth > sc.clientWidth + 1`) ±56 px yatay; **yoksa** mevcut sayfa değiştirme davranışı korunur.
  - `Home/End` mevcut. `Ctrl+Home/Ctrl+End` aynı işi yapsın (`mod` iken de).
- **Space:** keydown'da (`!e.repeat`) `spaceStartRef.current = performance.now()` + mevcut `setSpaceDown(true)`. keyup'ta `performance.now() - spaceStartRef.current < 250 && !isDragging` ise `sc.scrollBy({ top: (e.shiftKey ? -1 : 1) * sc.clientHeight * 0.9 })`. Yani kısa basış = sayfa kaydır, basılı tutma = el aracı (mevcut). `e.shiftKey` Space keydown'unda da aynı kabul edilir; keyup'ta `e.shiftKey` kullan.
- Kısayol modalına bu satırları Türkçe ekle: `Boşluk / Shift+Boşluk — sayfa aşağı/yukarı`, `PageUp / PageDown`, `↑ / ↓ — satır kaydır`, `Ctrl+Shift+- — sola döndür`.
- Kaydırıcıya odak: scroll alanının `onPointerDown`'ında (mevcut sarmalayıcıyı koru) hedef `a, button, input, textarea, select` değilse `e.currentTarget.focus({ preventScroll: true })` çağır.

### 2) Klavye zoom animasyonu (H16)
`handleZoomIn` ve `handleZoomOut` içindeki imleç-içi dalda `zoomTo(nextTarget, { animate: false, ...` → `animate: true`. (Animatör retarget eder; çıpa her basışta imleç noktasından yeniden çözülür.)

### 3) Konum kaydı ve v4 uyumu (H9)
- `performSave`: `engineFlag === "v4" && engineRef.current` ise `const pos = engineRef.current.getPosition();` → `page: pos.page`, `offsetRatio: Math.min(Math.max(pos.fy, 0), 1)`; v3 yolu aynen kalır.
- `handleScrubMove`: v4 ise `engineRef.current.scrollToPage(targetPage, 0, "auto"); return;` (v3 yolu aynen kalır).
- **Geri yükleme:** `// Konum geri yükleme` efektindeki v4 dalını (`engineRef.current.restorePosition` çağıran blok) **kaldır** (v3 dalı kalır). Yerine `// v4: Kademeli Sayfa Boyutları` efektinin `readAllSizes` geri çağrısında, `setSizes`'dan hemen sonra:
```ts
const pr = pendingRestoreRef.current;
if (pr && engineInstance.getLayout().n >= pr.page) {
  engineInstance.restorePosition({ page: pr.page, fy: pr.ratio });
  pendingRestoreRef.current = null;
}
```
(Sayfa N'nin üst konumu yalnız önceki sayfalara bağlı olduğundan `n >= page` olunca kesindir.) Belge hiç kaydırılmadan `pendingRestoreRef` zaten tekerlek/dokunma/imleçte null'lanıyor.

### 4) Geçmiş (H12) ve uzak atlamalar
- `NavigationHistoryEntry`'ye isteğe bağlı `fy?: number` ekle (`pdf-navigation.ts`; varsa `pushNavigationHistory` karşılaştırması `page`+`scrollTop` yerine `fy` varsa `page`+`fy` (±0.01) kullansın).
- Yardımcı: `const captureNavEntry = () => { const c = scrollContainerRef.current; if (!c) return null; const p = engineFlag === "v4" ? engineRef.current?.getPosition() : null; return { page: p ? p.page : currentPageRef.current, scrollTop: c.scrollTop, ...(p ? { fy: p.fy } : {}) }; }` — `pushNavigationHistory` çağrılan **tüm** yerlerde (`handleNavigateDestination`, `handleNavigateBack/Forward`, `handleSidebarSelectPage`, `handleScrubEnd`, `handleContinuousScrubEnd` start konumu hariç) mevcut `{page, scrollTop}` nesnesi yerine bunu kullan.
- `handleNavigateBack/Forward`: girdide `fy` varsa ve v4 ise `engineRef.current.scrollToPage(target.page, target.fy, far ? "auto" : "smooth")`, aksi halde mevcut `container.scrollTo`.
- `scrollToPage`: `behavior` → `isReducedMotion || Math.abs(pageNum - prevPage) > 3 ? "auto" : "smooth"` (`prevPage` = `currentPageRef.current`'ın **atamadan önceki** değeri).

### 5) Arama (H10, H11)
- `const scrollToPageRef = useRef(scrollToPage); scrollToPageRef.current = scrollToPage;` ve arama efekti içindeki `scrollToPage(...)` → `scrollToPageRef.current(...)`; efekt bağımlılık dizisinden `scrollToPage` çıkar.
- `pdf-highlight-layer.tsx`: aktif eşleşmeyi çizen elemana `data-active-match="true"` ekle (yalnız aktif olana).
- Studio'da `revealActiveMatch`:
```ts
const revealActiveMatch = useCallback((frame = 0) => {
  const sc = scrollContainerRef.current;
  if (!sc) return;
  const el = sc.querySelector<HTMLElement>('[data-active-match="true"]');
  if (!el) { if (frame < 30) requestAnimationFrame(() => revealActiveMatch(frame + 1)); return; }
  const r = el.getBoundingClientRect(), v = sc.getBoundingClientRect(), m = 80;
  const outV = r.top < v.top + m || r.bottom > v.bottom - m;
  const outH = r.left < v.left || r.right > v.right;
  if (outV || outH) sc.scrollBy({ top: outV ? (r.top + r.bottom) / 2 - (v.top + v.bottom) / 2 : 0, left: outH ? (r.left + r.right) / 2 - (v.left + v.right) / 2 : 0, behavior: "auto" });
}, []);
```
- `handleNextMatch`, `handlePrevMatch` ve "ilk eşleşme" yolunda: hedef sayfa `currentPageRef.current`'a **eşitse** `scrollToPage` ÇAĞIRMA, yalnız `revealActiveMatch()`; farklıysa `scrollToPage(page)` sonra `revealActiveMatch()`. (`pdfRenderQueue.setCurrentPage` çağrıları kalsın.)

## Testler — `tests/pdf-v4/v5-a3-klavye-gezinme.spec.ts` (proje `desktop`)
Selector'ları `Select-String` ile bul (thumbnail, scrubber `pdf-page-scrubber`, arama çubuğu `pdf-search-bar`); **uydurma `data-testid` ekleme**, yoksa var olan role/aria seçicileri kullan.
1. **`Ctrl+Shift+- saat yönü tersi döndürür`** — `tr-metin`; `Control+Shift+Equal` → `rot 90`; `Control+Shift+Minus` → `rot 0`.
2. **`PageDown/PageUp/Space/oklar kaydırır (odak body iken)`** — `uzun-300`; scroller dışına tıklamadan: `PageDown` → `scrollTop` artışı `0.9×clientHeight` ±%5; `PageUp` geri; `ArrowDown` +56 ±2; `Space` (kısa) ≈ PageDown; `Shift+Space` geri.
3. **`Space basılı tutma el aracını açar, sayfa kaydırmaz`** — `keyboard.down("Space")`, 400 ms, `up` → `scrollTop` değişmez.
4. **`klavye zoom imleç belge üzerindeyken animasyonlu ve çıpa sabit`** — `karisik-60`, `anchorAt/anchorDrift` (`helpers/viewer.ts`); `Control+Equal` ×3 → `anchorDrift ≤ 3 px`.
5. **`scrubber sürüklerken görünüm kayar`** — `uzun-300`; scrubber üstüne gel, imleci basılı tutup %50 yüksekliğe sürükle; **bırakmadan** `cur > 20`.
6. **`okuma konumu sayfa içi oran ile kaydedilir ve yeniden açılınca geri gelir`** — `uzun-300`; `scrollToPage(40)`, ardından `scroller.scrollBy(0, 300)`; 900 ms; `getPosition()` kaydet; `page.reload()`; `waitSharp`; `getPosition().page === kayıtlı` ve `|fy - kayıtlı fy| ≤ 0.02`.
7. **`geri geçmişi zoom sonrası doğru yere döner`** — thumbnail tıklamasıyla sayfa 20'ye git (geçmişe yazılır); `Control+Equal`; `Alt+ArrowLeft` → `|cur - başlangıç| ≤ 1`.
8. **`arama: sonraki eşleşme ekranda`** — `tr-metin`; `Ctrl+F`, `tests/fixtures/pdf/manifest.json`'daki tr-metin arama kelimesi (yoksa `"ve"`, ≥2 eşleşme olmalı); `Control+g` ×3 (her biri 800 ms): `[data-active-match="true"]` sınır kutusu scroller kutusunun içinde.
9. **`arama sürerken kenar çubuğu açmak konumu bozmaz`** — arama aç, `scrollToPage(5)`, `F4`, 1500 ms → `cur === 5`.

## Kırmızı kanıtı
Değişiklikten önce testleri koş. Beklenen kırmızılar: 1, 2, 3(kırmızı değilse raporla), 5, 6, 7, 8, 9. Test 4 kırmızı olmayabilir.

## Kapı
```powershell
npx tsc --noEmit --incremental false
npm run check:pdf-v4:unit
npm run check:pdf-v2:unit
npx playwright test --config=playwright.pdf-v4.config.ts tests/pdf-v4/v5-a1-bellek.spec.ts tests/pdf-v4/v5-a2-zoom-yerlesim.spec.ts tests/pdf-v4/v5-a3-klavye-gezinme.spec.ts --project=desktop --reporter=line 2>&1 | Select-Object -Last 60
npx playwright test --config=playwright.config.ts tests/document-studio/pdf-viewer-toolbar-parity.spec.ts --project=chromium --reporter=line 2>&1 | Select-Object -Last 30
```

## Dokunma
v3 yolları (`PdfPageView`, `use-zoom-gestures.ts`) — yalnız v4 dalları değişir; `pdf-search-engine.ts` mantığı.
