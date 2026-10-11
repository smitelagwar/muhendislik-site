# A4 — Dokunmatik ve jest dayanıklılığı (H13, H14, H24 + tekerlek/animatör çakışması)

**Önce oku:** `00-OKU-ONCE.md`. **Ön koşul:** A1–A3 yeşil.

## Dosyalar
- `src/lib/dokumantasyon/studio/pdf/engine/input-controller.ts`
- `src/lib/dokumantasyon/studio/pdf/engine/engine.ts`
- `src/lib/dokumantasyon/studio/pdf/engine/rubber.ts` (yalnız oku; değiştirme)
- `src/components/dokumantasyon/studio/pdf/pdfjs-studio.tsx` (yalnız kök sarmalayıcıya `data-chrome-hidden`; `Select-String "isChromeHidden"` ile uygun elemanı bul)
- `tests/pdf-v4/helpers/gestures.ts` (yardımcı ekleme), `tests/pdf-v4/unit/engine.test.ts`
- YENİ: `tests/pdf-v4/v5m-a4-dokunmatik.spec.ts` (proje `mobile`; A1'de config'e eklendi)

## Kök nedenler
- **H13:** `useInputController` "Tek dokunma ve Çift dokunma algılayıcı" efekti yalnız `touchend` dinler; hareket/süre/çoklu parmak kontrolü yok. Parmakla **kaydırmanın sonu da dokunma sayılır** → 260 ms sonra `onTap` → `handleViewerTap` araç çubuğunu gizler/gösterir (her kaydırmada). İki ardışık kaydırma (<300 ms, <35 px) `onDoubleTap` → istemsiz zoom.
- **H14:** `engine.setLiveScale` kendi içinde `clampScale` uygular; pinch'teki `rubber()` aşımı kesilir, `endPinch`'teki geri yaylanma hiç çalışmaz (ölü kod).
- **H24:** `engine.onScroll` ve `ScrollTracker` `scheduler.setInteraction`'ı doğrudan yazar; `setLiveScale` içindeki `scrollLeft/Top` atamaları scroll olayı üretir → jest sırasında durum `scrolling/idle`'a düşer, ağır render jest ortasında başlar.
- Trackpad `ctrl+wheel` (sürekli kol) çalışan animatörü durdurmaz.

## Değişiklikler

### 1) `input-controller.ts` — dokunma algılama (H13)
"Tek dokunma ve Çift dokunma algılayıcı" efektini şöyle genişlet (mevcut `lastTapTime/lastTapPos/tapTimer` kalır):
```ts
let start: { x: number; y: number; t: number } | null = null;
let moved = false;
let multi = false;
const MOVE_PX = 10;

const onTouchStart = (e: TouchEvent) => {
  if (e.touches.length > 1) { multi = true; return; }
  start = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: performance.now() };
  moved = false;
};
const onTouchMove = (e: TouchEvent) => {
  if (!start || e.touches.length !== 1) return;
  if (Math.hypot(e.touches[0].clientX - start.x, e.touches[0].clientY - start.y) > MOVE_PX) moved = true;
};
```
`onTouchEnd` başında:
```ts
const wasMulti = multi;
if (e.touches.length === 0) multi = false;
if (wasMulti || moved || !start || performance.now() - start.t > 350) {
  // kaydırma/uzun basış/çok parmak: dokunma değildir ve çift dokunma dizisini bozar
  lastTapTime = 0;
  if (tapTimer) { clearTimeout(tapTimer); tapTimer = null; }
  start = null;
  return;
}
start = null;
```
(sonrasında mevcut `suppressTapsUntilRef` / `changedTouches` mantığı aynen). `touchstart` ve `touchmove` dinleyicilerini `{ passive: true }` ekle/kaldır.

### 2) `engine.ts` — lastik bant (H14)
`setLiveScale(scale, anchor, vx, vy, overshoot = false)`: `this.scale = overshoot ? Math.min(Math.max(scale, this.minScale() * 0.8), this.maxScale() * 1.25) : this.clampScale(scale);`
`input-controller.ts` pinch'te `engine.setLiveScale(...)` iki çağrısına (`onTouchMove` rAF ve `endPinch` başı) `true` ekle. `endPinch`'teki mevcut geri yaylanma mantığı değişmeden çalışır (`target !== curScale` → animatör).

### 3) `engine.ts` — jest durumu koruması (H24)
- Alan: `private gestureAt = 0;`
- `setInteraction(s, force = false)`:
```ts
const now = this.nowFn();
if (s === "gesture") this.gestureAt = now;
else if (!force && this.interaction === "gesture" && now - this.gestureAt < 400) return; // jest sürerken scroll olayı durumu ezemez
this.interaction = s;
this.scheduler.setInteraction(s);
```
- `setLiveScale` başında `this.gestureAt = this.nowFn();` (canlı ölçekleme jest sürdüğünü yeniler; 400 ms sessizlikten sonra koruma kendiliğinden düşer → takılı kalma riski yok).
- `onScroll`: `scheduler.setInteraction("scrolling")` ve 80 ms'lik zamanlayıcının `scheduler.setInteraction("idle")` çağrılarını `this.setInteraction("scrolling")` / `this.setInteraction("idle")` ile değiştir (artık koruma uygulanır).

### 4) `input-controller.ts` — trackpad/animatör çakışması
`onWheel` içinde, **trackpad (sürekli) dalının** başında `animator.stop();` çağır.

### 5) `data-chrome-hidden` (test gözlenebilirliği)
`pdfjs-studio.tsx`'te `isChromeHidden`'ı yöneten kök/sarmalayıcı elemana `data-chrome-hidden={isChromeHidden ? "true" : "false"}` ekle (başka değişiklik yok).

## Testler
**Yardımcı** (`helpers/gestures.ts`; mevcut `doubleTap` uygulamasındaki CDP desenini kopyala): `swipe(page, x, y0, y1, steps = 8)` → `Input.dispatchTouchEvent` `touchStart` → `touchMove`×steps → `touchEnd`. Ayrıca `pinchManual(page, cx, cy, d0, d1)` → iki parmak `touchStart`, `touchMove` (mesafe d0→d1), **dönen `end()` fonksiyonu** ile `touchEnd` (ortadaki ölçümü yapabilmek için).

`tests/pdf-v4/v5m-a4-dokunmatik.spec.ts` (`mobile`, 390×844):
1. **`kaydırma jesti araç çubuğunu değiştirmez`** — `uzun-300`; `swipe` ×3 (aralarında 300 ms); 600 ms; `[data-chrome-hidden]` hâlâ `"false"` ve `scrollTop` arttı.
2. **`gerçek tek dokunma araç çubuğunu gizler/gösterir`** — sayfa üstüne tek dokunma (CDP touchStart+touchEnd, hareketsiz); 450 ms → `"true"`; tekrar → `"false"`.
3. **`iki ardışık kaydırma zoom yapmaz`** — `swipe` ×2 aralık 250 ms, uç noktalar yakın; `eng.getScale()` değişmedi.
4. **`çift dokunma hâlâ yakınlaştırır`** — mevcut `doubleTap`; `getScale()` arttı (`waitZoomSettled`).
5. **`pinch lastik bant: jest ortasında aşım, bırakınca sınıra döner`** — `karisik-60`; `pinchManual` ile çok açılan mesafe; bırakmadan `getScale() > maxScale()` ve `≤ maxScale()*1.25`; `end()` sonra 900 ms → `getScale() ≤ maxScale() + 1e-3`.

**Birim (`unit/engine.test.ts`):**
- `setLiveScale(huge, anchor, vx, vy, true)` → `getScale()` ∈ (`maxScale()`, `maxScale()*1.25`]; `overshoot` olmadan `≤ maxScale()`.
- `setInteraction("gesture")` sonra hemen `setInteraction("scrolling")` → `scheduler.interactionState === "gesture"`; sahte `now` +500 ms ilerletilince `"scrolling"` kabul edilir; `force=true` her zaman kabul.

## Kırmızı kanıtı
Değişiklikten önce 1, 3, 5 ve iki birim test kırmızı olmalı; 2 ve 4 yeşil olabilir (regresyon bekçisi) → rapora yaz.

## Kapı
```powershell
npx tsc --noEmit --incremental false
npm run check:pdf-v4:unit
npx playwright test --config=playwright.pdf-v4.config.ts tests/pdf-v4/v5m-a4-dokunmatik.spec.ts --project=mobile --reporter=line 2>&1 | Select-Object -Last 40
npx playwright test --config=playwright.pdf-v4.config.ts tests/pdf-v4/v5-a1-bellek.spec.ts tests/pdf-v4/v5-a2-zoom-yerlesim.spec.ts --project=desktop --reporter=line 2>&1 | Select-Object -Last 30
```
(Üçüncü komut regresyon bekçisi; A1/A2 yeşil kalmalı.) Gate testleri (`s05/s06`) production sunucu ister: **çalıştırma**, raporda "A6'da production koşusu" yaz.

## Dokunma
`use-zoom-gestures.ts` (v3), `pdf-gesture-engine.ts`, `rubber.ts` matematiği.
