# Plan 04: Etkileşim, zoom ve mobil sağlamlaştırma

> **Kapsam:** D6 (fit modu kaydırırken zoom'u değiştiriyor), D7 (`touchmove` hep non-passive), D8 (pinch-in'de kaydırma kırpması), D9 (iPad trackpad pinch), D11 (fare çentiği %35 zoom). Ayrıca kullanıcının ilk talebi: **mobilde çift parmakla yakınlaştırma/uzaklaştırma "saçmalıyor"** → kök neden analizi ve kalıcı çözüm.
> **İki parça halinde ilerler:**
> - **04-A (v3 yolu, Plan 03'ten bağımsız, küçük yamalar):** D6, D9, D11. Hemen yapılabilir.
> - **04-B (v4 motor yolu):** Pinch/tekerlek/animasyon/yön değişimi `PdfEngine` üzerinden. **Plan 03 P3.3'ten sonra** yapılır.
> **Dürüstlük notu:** Mobil etkileşimin kritik varsayımları (aşağıda "H1–H4") sandbox'ta **doğrulanamadı**; gerçek iOS Safari ve Android Chrome'da elle doğrulanmadan "bitti" denmez. Bunun için §6'daki kontrol listesi **zorunlu çıkış koşuludur**.

---

## 0. Mevcut durumun özeti (kodu okudum)

`use-zoom-gestures.ts` (260+ satır) şu an:
- İçerik kapsayıcısına (`contentRef`) **tek bir `transform: scale(r)`** uygular, `transform-origin` olarak odak noktasını verir; bırakınca `onCommit` ile gerçek ölçeği state'e yazar ve `useLayoutEffect`'te scroll'u çıpa sayfa elemanının `getBoundingClientRect`'ine göre düzeltir.
- Pinch: `touchstart` pasif, `touchmove` **her zaman** `{passive:false}`, iki parmak mesafesi oranı → `r`. Parmak merkezi hareketi (pan) **izlenmiyor**: pinch sırasında iki parmakla kaydırma çıpayı kaçırır.
- İki parmaktan biri kalktığında kalan parmak için bir şey yapılmıyor: kalan parmak hemen **tek parmak kaydırma/tek dokunma/çift dokunma** olarak yorumlanabilir.
- Safari `gesture*` olayları: `isTouchDevice = "ontouchstart" in window` ise **tamamen yok sayılıyor** (iPad'de trackpad pinch ölü, D9).
- Tekerlek: `exp(-clamp(deltaY,±30) * 0.01)`; fare çentiği (|deltaY|≥100) kırpılıp **`exp(0.3) ≈ 1,35`** → tek çentik %35 (D11).
- Zoom animasyonu: `setTimeout(190)` + CSS transition; ardışık komutlar kuyruğa girip `pending` kilidi ile yarışıyor.

`pdfjs-studio.tsx` fit mantığı:
- `getFitScale` **geçerli sayfanın** boyutunu kullanıyor (`pageDimensions[currentPageRef.current]`).
- Satır ~808–816'daki efekt, `activePageSize` veya `currentPage` değişince fit'i **yeniden uyguluyor**: karışık A4/A3 belgede fit-width modunda kaydırırken zoom kendiliğinden değişir (D6).
- `ResizeObserver` yalnızca genişlik farkı ≥2 px ise fit'i yeniden uygular (iyi: mobil adres çubuğu yüksekliği değişimi zoom'u sıfırlamıyor).

### Mobil pinch'in "saçmalama" sebepleri (kod analizi + 00 dosyasındaki ölçümler)

| # | Neden | Tür | Çözüm |
|---|---|---|---|
| P1 | Pinch'te parmak merkezi (pan) izlenmiyor; çıpa yalnızca başlangıç merkezine sabit | Kod | 04-B: her karede `setLiveScale(scale, anchor, cx, cy)` |
| P2 | 2→1 parmak geçişinde kalan parmak kaydırma/dokunma olarak yorumlanıyor | Kod | 04-B: "tüm parmaklar kalkana dek yut" |
| P3 | Tek parmak kayarken ikinci parmak inerse tarayıcı kaydırmaya devam eder; `touchmove` artık `cancelable=false` olur ve `preventDefault` işe yaramaz (H1) | **Varsayım (Chrome davranışı)** | Pinch başında kaydırma alanını **kilitle** (`overflow:hidden`), tüm parmaklar kalkınca aç |
| P4 | Commit anında `useLayoutEffect` scroll düzeltmesi + yeni render ölçeği → bir kare zıplama (v3 çıpa DOM'dan ölçülüyor) | Kod | Plan 03: sayfa kutuları her karede hedef geometride, "commit zıplaması" yapısal olarak yok |
| P5 | `touchmove` non-passive → ana iş parçacığı meşgulken tek parmak kaydırma bile beklemeye alınabilir (D7, H2) | Varsayım | `touchmove` **passive**; `preventDefault` gerekmiyor (CSS `touch-action` + kilit yeterli) |
| P6 | Sınır (min/max) aşımında sert kesme: "duvara çarpma" hissi | Tasarım | Lastik payı + yaylanma (rubber-band) |
| P7 | Pinch sırasında zamanlayıcı render başlatıyor, ana iş parçacığı gesture ile yarışıyor | Kod | Plan 03 zamanlayıcısı `gesture` durumunda iş başlatmaz |
| P8 | Çift dokunma gecikmesi: tek dokunma 300 ms bekliyor (araç çubuğu geç gizleniyor) | Tasarım | 260 ms; bağlantı/düğme hedeflerinde bekleme yok (zaten hariç) |

**Hipotezler (kanıtsız; gerçek cihazda sınanacak):**
- **H1** İki parmak, biri zaten kayarken inerse Chrome Android `touchmove`'u `cancelable:false` yapar.
- **H2** `touchmove` non-passive olmak, meşgul ana iş parçacığında kaydırmayı geciktirir.
- **H3** iOS Safari ≥13 `touch-action: pan-x pan-y` ile sayfa pinch-zoom'unu engeller (çift dokunma zoom'u da).
- **H4** Gesture sırasında programatik `scrollTop` yazmak, kaydırma kilidi (`overflow:hidden`) varken iOS'ta zıplama yapmaz.
Biri çürürse §5'teki **Plan B** devreye girer.

---

# 04-A: v3 yolu için küçük yamalar (D6, D9, D11)

Bunlar `pdfjs-studio.tsx` ve `use-zoom-gestures.ts`'e yamadır; Plan 03 olmadan da çalışır ve v4'te de **kavramsal olarak aynen** korunur (04-B'de motor tarafında tekrar uygulanır).

## A1. D11: Tekerlek çentiği ve trackpad ayrımı

`pdf-zoom-math.ts` içine ekle (saf, birim testli):

```ts
export interface WheelLike { deltaY: number; deltaMode: number }
export const WHEEL_NOTCH_FACTOR = 1.1;      // bir fare çentiği = %10 (S3 ölçütü 1,05–1,15)
export const WHEEL_TRACKPAD_K = 0.01;       // trackpad pinch: exp(-deltaY·k)
export const WHEEL_TRACKPAD_CLAMP = 40;     // tek olayda en fazla ±40 px eşdeğeri

/** Fare çentiği mi? deltaMode=1 (satır) veya piksel modunda tamsayı ve |deltaY|≥50 (Chrome/Edge ±100, bazı sürücüler ±120). */
export function isWheelNotch(e: WheelLike): boolean {
  return e.deltaMode === 1 || (e.deltaMode === 0 && Number.isInteger(e.deltaY) && Math.abs(e.deltaY) >= 50);
}
export function wheelZoomFactor(e: WheelLike): number {
  if (isWheelNotch(e)) return Math.pow(WHEEL_NOTCH_FACTOR, -Math.sign(e.deltaY || 1));
  const px = e.deltaMode === 2 ? e.deltaY * 100 : e.deltaY;       // sayfa modu (nadir)
  const d = Math.max(-WHEEL_TRACKPAD_CLAMP, Math.min(WHEEL_TRACKPAD_CLAMP, px));
  return Math.exp(-d * WHEEL_TRACKPAD_K);
}
```

`use-zoom-gestures.ts` `onWheel` içinde 3 satırı değiştir:

```ts
// ESKİ: const raw = ...; const dy = Math.max(-30, Math.min(30, raw)); live.current.r = clampR(live.current.r * Math.exp(-dy * 0.01));
live.current.r = clampR(live.current.r * wheelZoomFactor(e));
```

Not: Mac trackpad pinch (Chrome/Firefox, `ctrlKey=true`) küçük kesirli `deltaY` üretir → `isWheelNotch` false → sürekli yol. Mac fare tekerleği + ctrl bazı sürücülerde tamsayı ≥50 üretmez (ör. ±4); bu durumda sürekli yoldan geçer ve çok küçük adım olur. Bu bir **kabul edilen sınır**; Plan 01 S3 senaryosu iki yolu da ölçer (trackpad ve ±100 çentik). Birim test: `isWheelNotch({deltaY:100,deltaMode:0})` true, `{deltaY:3.5}` false, `{deltaY:-100}` → faktör 1/1,1; `{deltaY:-3, deltaMode:1}` → 1,1.

`calculateWheelZoomFactor` (`pdf-gesture-engine.ts`) kullanılmıyor ve çelişkili sabit içeriyor (0,0035): **sil veya `wheelZoomFactor`'a yönlendir**; sessiz çift gerçeklik bırakma.

## A2. D9: iPad trackpad pinch

`use-zoom-gestures.ts`:
1. `isTouchDevice` sabitini **kaldır**.
2. Dokunmatik pinch bayrağı ekle:

```ts
let touchPinch = false;                       // 2 parmak pinch sürerken true
// onTouchStart içinde, e.touches.length === 2 dalında:  touchPinch = true;
// onTouchEnd içinde, d0 sıfırlanırken:                  touchPinch = false;
const gStart = (e: any) => { e.preventDefault(); if (touchPinch || pending.current || animating) return; begin(e.clientX, e.clientY); g0 = live.current.r; };
const gChange = (e: any) => { e.preventDefault(); if (touchPinch || !live.current.active || animating) return; live.current.r = clampR(g0 * e.scale); schedule(); };
const gEnd = (e: any) => { e.preventDefault(); if (!touchPinch && !animating) commit(); };
```

Mantık: iPad'de **dokunmatik** pinch hem `touch*` hem `gesture*` olayları üretir; `touchstart` önce geldiği için `touchPinch` true → gesture yok sayılır (çift işleme olmaz). **Trackpad** pinch yalnızca `gesture*` üretir → çalışır. (**Varsayım:** iPadOS Safari bu şekilde davranır; kontrol listesi §6.)

## A3. D6: Fit modu sabit referans sayfa ile

Karar (Acrobat "Genişliğe sığdır"ın sürekli kaydırmada davranışına yakın ve deterministik): **Fit, uygulandığı anda bir referans sayfaya göre hesaplanır; sonra kaydırırken zoom değişmez.** Fit düğmesi/kısayol yeniden basılınca (veya pencere genişliği değişince) referans sayfa o anki sayfayla güncellenip yeniden hesaplanır. Araç çubuğundaki mod etiketi ("Genişliğe sığdır") korunur, yüzde sabit kalır.

`pdfjs-studio.tsx`:

```ts
const fitRefPageRef = useRef<number>(1);                     // fit'in hesaplandığı referans sayfa
// getFitScale: currentPageRef.current yerine fitRefPageRef.current kullan
const currentSize = pageDimensions[fitRefPageRef.current] || firstPageSize;

// KULLANICI fit komutu verirse (butonlar, Ctrl+kısayol, çift dokunma ile fit'e dönüş, ilk açılış):
fitRefPageRef.current = currentPageRef.current;
applyFitMode(mode, true);
```

Efekt (satır ~808–816) **şu hale gelir:** bağımlılıklardan `currentPage` ve `activePageSize.*` **kaldırılır**; yalnızca yön/araç çubuğu/döndürme değişince tetiklenir:

```ts
useEffect(() => {
  if (loading || !pdfDoc || !firstPageSize) return;
  const mode = zoomRef.current.mode;
  if (mode !== "fit-width" && mode !== "fit-page") return;
  const frame = requestAnimationFrame(() => { if (zoomRef.current.mode === mode) applyFitModeRef.current(mode); });
  return () => cancelAnimationFrame(frame);
}, [isMobileLayout, loading, pdfDoc, rotation, toolbarHeight, firstPageSize?.width, firstPageSize?.height]);
```

Ek kural: referans sayfanın boyutu **geç öğrenilirse** (o sayfa henüz ölçülmediyse `firstPageSize` fallback'i kullanılır) boyut gelince fit **bir kez** yeniden hesaplanır (efekt `pageDimensions[fitRefPageRef.current]` değerini bağımlılığa ekler, ama yalnızca "o sayfanın ilk ölçümünde"; sonraki değişimlerde değil). Plan 03 ile tüm boyutlar baştan bilindiği için bu özel durum v4'te ortadan kalkar.

**Çıkış (04-A):** Plan 01 S12 (fit-genişlik modunda tüm belgeyi kaydır: araç çubuğu % hiç değişmez) yeşil; S3 (çentik başına 1,05–1,15) yeşil; birim testler (`wheelZoomFactor`, `isWheelNotch`) yeşil. iPad trackpad: elle doğrulama (§6).

---

# 04-B: v4 motor yolu

Ön koşul: Plan 03 P3.3–P3.6 (`PdfEngine`, sanal liste). `useZoomGestures` v4'te **kullanılmaz**; yerine `PdfInputController` gelir (v3 yolunda aynı hook çalışmaya devam eder, bayrak `pdfEngine`).

## B1. Dosyalar

```
src/lib/dokumantasyon/studio/pdf/engine/
  input-controller.ts    // tekerlek, gesture*, touch pinch, çift dokunma, klavye adımları
  zoom-animator.ts       // retarget edilebilir animasyon (rAF), reduced-motion saygılı
  scroll-tracker.ts      // hız takibi → scheduler interaction state
  rubber.ts              // lastik payı matematiği (saf)
tests/pdf-v4/unit/rubber.test.ts, zoom-animator.test.ts, input-math.test.ts
```

## B2. Anchor politikası (D3'ün genel hali)

Her zoom komutunun bir **çıpası** vardır: belgedeki bir nokta (`DocAnchor`, sayfa-yerel kesir) + görünümdeki hedef konumu `(vx, vy)`.

| Kaynak | Çıpa | `(vx,vy)` |
|---|---|---|
| Ctrl+tekerlek, trackpad pinch, çift tık/dokunma | imlecin/parmağın altındaki nokta | imleç/parmak konumu |
| İki parmak pinch | başlangıç merkezindeki nokta | **her karede güncel merkez** (pan dahil) |
| Klavye (Ctrl +/−), araç çubuğu, ön ayar | `scrollTop ≤ 1` ise **görünümün üstü** (belge başı); değilse görünüm merkezi | `(viewW/2, 0)` veya `(viewW/2, viewH/2)` |
| Fit komutları | görünümün üst çizgisindeki nokta | `(viewW/2, 0)` |

```ts
export function resolveAnchor(engine: PdfEngine, src: { x?: number; y?: number; kind: "pointer" | "viewport" | "fit" }) {
  const sc = engine.scroller, r = sc.getBoundingClientRect();
  const L = engine.getLayout();
  let vx: number, vy: number;
  if (src.kind === "pointer" && src.x != null && src.y != null) { vx = src.x - r.left; vy = src.y - r.top; }
  else if (src.kind === "fit" || sc.scrollTop <= 1) { vx = r.width / 2; vy = 0; }
  else { vx = r.width / 2; vy = r.height / 2; }
  const a = anchorFromPoint(L, sc.scrollLeft + vx, sc.scrollTop + vy);
  return { anchor: a, vx, vy };
}
```

(Plan 02 K3'te v3 yoluna uygulanan "belge başında üst çıpa" kuralının v4 karşılığıdır.)

## B3. Zoom animatörü (klavye/araç çubuğu/çift dokunma/ön ayar)

Gereksinimler: (1) ardışık komutlar **kuyruğa girmez, hedef güncellenir** (retarget): ×3 `Ctrl+` hızlı basımı tek akıcı harekete dönüşür; (2) animasyon sırasında yeni komut mevcut canlı ölçekten devam eder (zıplama yok); (3) `prefers-reduced-motion` → anında; (4) animasyon sırasında zamanlayıcı `gesture` durumunda.

```ts
// zoom-animator.ts
export class ZoomAnimator {
  private raf = 0; private from = 1; private to = 1; private t0 = 0; private dur = 160;
  private resolve: (() => void) | null = null; private anchor?: DocAnchor; private vx = 0; private vy = 0;
  constructor(private engine: PdfEngine, private reduced: () => boolean) {}
  animate(target: number, anchor: DocAnchor, vx: number, vy: number, ms = 160): Promise<void> {
    const cur = this.engine.getScale();
    this.anchor = anchor; this.vx = vx; this.vy = vy;
    this.from = cur; this.to = this.engine.clampScale(target);
    if (this.reduced() || ms <= 0 || Math.abs(this.to - cur) < 1e-4) {
      this.stop(); this.engine.setLiveScale(this.to, anchor, vx, vy); this.engine.settleScale(); return Promise.resolve();
    }
    this.dur = ms; this.t0 = performance.now();
    this.engine.setInteraction("gesture");
    this.resolve?.();                                              // önceki animasyon "bitti" sayılır (yerine geçildi)
    const p = new Promise<void>((res) => { this.resolve = res; });
    if (!this.raf) this.raf = requestAnimationFrame(this.tick);
    return p;
  }
  private tick = (now: number) => {
    this.raf = 0;
    const k = Math.min(1, (now - this.t0) / this.dur);
    const e = 1 - Math.pow(1 - k, 3);                              // easeOutCubic
    // ölçek logaritmik interpolasyon: zoom algısı oransaldır (1→2 ile 2→4 aynı hız hissi)
    const s = this.from * Math.pow(this.to / this.from, e);
    this.engine.setLiveScale(s, this.anchor!, this.vx, this.vy);
    if (k < 1) { this.raf = requestAnimationFrame(this.tick); return; }
    this.engine.settleScale(); this.engine.setInteraction("idle");
    const r = this.resolve; this.resolve = null; r?.();
  };
  stop() { if (this.raf) cancelAnimationFrame(this.raf); this.raf = 0; const r = this.resolve; this.resolve = null; r?.(); }
}
```

- `engine.animateScale` bu sınıfa delege eder. Süre: 160 ms (ön ayar/klavye), 220 ms (fit/çift dokunma). Ölçek farkı çok büyükse (oran >4) süre 260 ms.
- Birim test (fake `performance.now`/rAF): ara ölçek monoton, retarget'ta ölçek **süreksiz sıçramaz** (`|s_sonra − s_önce| ≤ ilerleme payı`), bitişte tam hedef.

## B4. Tekerlek ve trackpad (masaüstü)

```ts
// input-controller.ts (özet) — yalnızca scroller üzerinde, passive:false (preventDefault gerekli)
const onWheel = (e: WheelEvent) => {
  if (!e.ctrlKey && !e.metaKey) return;                       // normal kaydırmaya karışma
  e.preventDefault();                                          // tarayıcı sayfa zoom'unu engelle (yalnızca viewer içinde)
  const f = wheelZoomFactor(e);                                // 04-A1 ile aynı saf fonksiyon
  const notch = isWheelNotch(e);
  const { anchor, vx, vy } = resolveAnchor(engine, { kind: "pointer", x: e.clientX, y: e.clientY });
  if (notch) {
    // çentikler birikir ve animatörle yumuşar; 150 ms içinde n çentik → hedef = temel × 1,1^n
    pendingTarget = clampScale((pendingTarget ?? engine.getScale()) * f);
    animator.animate(pendingTarget, anchor, vx, vy, 120);
    clearTimeout(notchT); notchT = window.setTimeout(() => (pendingTarget = null), 200);
  } else {
    // trackpad: canlı, animasyonsuz; rAF birleştirme
    liveTarget = clampScale((liveTarget ?? engine.getScale()) * f); coalesce(() => engine.setLiveScale(liveTarget!, anchor, vx, vy));
    engine.setInteraction("gesture");
    clearTimeout(settleT); settleT = window.setTimeout(() => { engine.settleScale(); engine.setInteraction("idle"); liveTarget = null; }, 140);
  }
};
```

- `coalesce` = aynı karede birden fazla olay gelirse son değeri uygula (`requestAnimationFrame` ile).
- Sınırlarda trackpad için lastik payı kullanma (masaüstünde sert kes; lastik yalnızca dokunmatikte).
- Browser zoom (Ctrl+tekerlek tüm sayfa) yalnızca **viewer dışında** çalışır, çünkü dinleyici scroller'da. Araç çubuğu üzerinde Ctrl+tekerlek tarayıcı zoom'u olarak kalır (bilinçli).
- Safari masaüstü trackpad: `gesturestart/change/end` (A2 ile aynı dedupe mantığı: `touchPinch` bayrağı); `gesturechange` → `scale = g0Scale * e.scale`, çıpa `e.clientX/Y`.

## B5. İki parmak pinch (mobil) — çekirdek

**Strateji:** (a) CSS `touch-action: pan-x pan-y` (mevcut) tarayıcı sayfa zoom'unu engeller (H3); (b) iki parmak inince kaydırma alanını **kilitle**; (c) her karede `setLiveScale(scale, anchor, cx, cy)`; (d) tüm parmaklar kalkınca kilidi aç.

```ts
// input-controller.ts — touch
const T = { active: false, ignoreUntilAllUp: false, d0: 0, s0: 1, anchor: null as DocAnchor | null, locked: false };

const onTouchStart = (e: TouchEvent) => {                                   // passive: true
  if (e.touches.length >= 3) { /* 3+ parmak: pinch'i bitir, yut */ endPinch(false); T.ignoreUntilAllUp = true; return; }
  if (T.ignoreUntilAllUp) return;
  if (e.touches.length === 2) {
    // ZATEN kayıyorsak (momentum) bile: kilit, kaydırmayı durdurur ve scrollTop'u olduğu yerde bırakır
    lockScroll();
    animator.stop();
    const [a, b] = [e.touches[0], e.touches[1]];
    const cx = (a.clientX + b.clientX) / 2, cy = (a.clientY + b.clientY) / 2;
    const r = scroller.getBoundingClientRect();
    T.active = true; T.d0 = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1; T.s0 = engine.getScale();
    T.anchor = anchorFromPoint(engine.getLayout(), scroller.scrollLeft + cx - r.left, scroller.scrollTop + cy - r.top);
    engine.setInteraction("gesture"); scroller.setAttribute("data-zooming", ""); suppressTaps();
  }
};

const onTouchMove = (e: TouchEvent) => {                                    // passive: true (D7 kapandı)
  if (!T.active || e.touches.length !== 2) return;
  const [a, b] = [e.touches[0], e.touches[1]];
  const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) || 1;
  const cx = (a.clientX + b.clientX) / 2, cy = (a.clientY + b.clientY) / 2;
  const r = scroller.getBoundingClientRect();
  const raw = T.s0 * (d / T.d0);
  const s = rubber(raw, engine.minScale(), engine.maxScale());              // sınır ötesi sönümlü
  latest = { s, vx: cx - r.left, vy: cy - r.top };
  coalesce(() => engine.setLiveScale(latest.s, T.anchor!, latest.vx, latest.vy));   // rAF başına en fazla bir kez
};

const onTouchEnd = (e: TouchEvent) => {
  if (T.active && e.touches.length < 2) endPinch(true);                      // ölçek yerleşir, kilit HÂLÂ açık
  if (e.touches.length === 0) { T.ignoreUntilAllUp = false; unlockScroll(); } // tüm parmaklar kalktı
  else if (T.active === false && e.touches.length === 1 && wasPinching) T.ignoreUntilAllUp = true;  // kalan parmağı yut
};
const endPinch = (settle: boolean) => {
  if (!T.active) return; T.active = false; T.ignoreUntilAllUp = true;
  const target = clampScale(engine.getScale());                              // lastik payı varsa geri yaylan
  if (Math.abs(target - engine.getScale()) > 1e-4) { const { anchor, vx, vy } = lastAnchorState(); animator.animate(target, anchor, vx, vy, 180); }
  else if (settle) { engine.settleScale(); engine.setInteraction("idle"); }
  scroller.removeAttribute("data-zooming");
};
const lockScroll = () => { if (T.locked) return; T.locked = true; scroller.style.overflow = "hidden"; };   // scrollbar-gutter:stable olduğu için genişlik değişmez
const unlockScroll = () => { if (!T.locked) return; T.locked = false; requestAnimationFrame(() => (scroller.style.overflow = "")); };
```

Detay kuralları:
1. **Kilit süresi:** `overflow:hidden` ilk iki parmak inişinde başlar, **son parmak kalkana kadar** sürer. Bu, "pinch bitti, kalan parmak kayıyor" (P2) ve "momentum devam ediyor" (P3) sorunlarını aynı mekanizmayla çözer. Kilit sırasında `scrollTop`/`scrollLeft` yalnızca engine yazar (H4).
2. **Tek dokunma/çift dokunma yutma:** `suppressTaps()` bir bayrak koyar; pinch sonrası ilk 350 ms içindeki dokunuşlar `onTap/onDoubleTap`'e gitmez (kazara araç çubuğu açılması/çift dokunma zoom'u biter).
3. **Kısıtlar:** `touchstart`'ta `e.target` bir `input/textarea/select` ise pinch başlatma (arama kutusu). Sayfada metin seçimi aktifse (`getSelection` dolu) pinch'e izin ver ama seçim tutamaçları iOS'ta kendi jestini yapar; kontrol listesinde.
4. **Aşırı sönümlü sınırlar (`rubber.ts`):**

```ts
/** Sınır dışında direnç: aşım (log uzayı) sqrt ile sönümlenir, en çok %20 aşar. */
export function rubber(s: number, min: number, max: number, maxOver = 0.2): number {
  if (s >= min && s <= max) return s;
  const edge = s < min ? min : max;
  const over = Math.log(s / edge);                       // <0 altında, >0 üstte
  const damped = Math.sign(over) * maxOver * (1 - Math.exp(-Math.abs(over) / maxOver));
  return edge * Math.exp(damped);
}
```
   Birim test: `[min,max]` içinde özdeş; `s→∞` iken en fazla `max·e^0,2`; monoton artan (sürekli, kırılma yok).
5. **Zoom üst sınırı:** `engine.maxScale() = min(getMaxPdfScale(coarse), maxScaleForHeight())`. Mobilde 300% (mevcut). Bellek korumalı; Plan 03 parçaları 300%'te A0 dahil sınırsız çalıştığı için, **gerçek cihaz ölçümünde** sorun yoksa mobil üst sınırı 400%'e çıkarma kararı kullanıcıya bırakılır (varsayılan değişmez).
6. **Kaydırma kilidi ve erişilebilirlik:** Kilit yalnızca dokunmatik pinch sırasında; ekran okuyucu/klavye etkilenmez. `touchcancel` (ör. sistem jesti, bildirim çekmesi) **her zaman** `endPinch(false)` + tüm kilitleri aç (takılı kalma güvenliği). Ayrıca 10 sn güvenlik zamanlayıcısı: kilit 10 sn'den uzun sürerse zorla aç (hata durumunda sayfa kilitli kalmasın).
7. **Yatay çıpa:** `lefts[i]`/`contentWidth` Plan 03'te `max(viewW, maxW+2·pad)`; pinch-out ile sayfa viewport'tan küçülünce ortalanır, `scrollLeft=0` clamp'i engine'de (D8: boyut önce, scroll sonra).
8. **Performans:** `touchmove` başına iş yok, yalnızca rAF'ta bir `setLiveScale` (≈9 sayfa kutusu stil yazımı + sizer yüksekliği + 2 scroll yazımı). `getBoundingClientRect` **çağrılmaz** (v3'te `begin` içinde var); `scroller.getBoundingClientRect()` yalnızca başlangıçta ve `resize`'da önbellekle.

### B5.1 Çift dokunma ve tek dokunma

- Algılama v3'tekiyle aynı (250 ms içinde bırak, 10 px hareket sınırı, çift için 260 ms/30 px). `pinch` sonrası yutma (yukarıda).
- **Çift dokunma davranışı:** `fitWidthScale`'in %115'inden büyükse `fit-width`'e dön; değilse dokunulan noktaya `fitWidth × 2,2`; her ikisi `animator.animate(..., 220)`; çıpa `kind:"pointer"`. (Mevcut `handleSmartZoom` mantığı korunur, çağrı `engine` üzerinden.) "Metin bloğuna akıllı zoom" Plan 05.
- Tek dokunma: araç çubuğunu gizle/göster. Hedef `a, button, input, select, [data-no-tap]` ise veya seçim varsa **yok say** (mevcut). `tapDelay` 260 ms.

## B6. Kaydırma hız takibi → zamanlayıcı

```ts
// scroll-tracker.ts
export class ScrollTracker {
  private last = 0; private lastT = 0; private v = 0; private idleT = 0;
  constructor(private el: HTMLElement, private onState: (s: "scrolling" | "idle") => void) {
    el.addEventListener("scroll", this.onScroll, { passive: true });
  }
  private onScroll = () => {
    const now = performance.now(), y = this.el.scrollTop;
    if (this.lastT) { const dt = now - this.lastT; if (dt > 0) this.v = Math.abs(y - this.last) / dt * 1000; }
    this.last = y; this.lastT = now;
    if (this.v > 1500) this.onState("scrolling");                       // px/sn eşiği (ayarlanabilir)
    clearTimeout(this.idleT); this.idleT = window.setTimeout(() => { this.v = 0; this.lastT = 0; this.onState("idle"); }, 80);
  };
  dispose() { this.el.removeEventListener("scroll", this.onScroll); clearTimeout(this.idleT); }
}
```

`gesture` durumu bunu **ezer** (gesture bitmeden `idle`'a düşme). Durum birleştirme: `interaction = gestureActive ? "gesture" : scrolling ? "scrolling" : "idle"` tek yerde (engine).

## B7. Yön değişimi, yeniden boyutlandırma, adres çubuğu (S11)

Kurallar (engine + studio):
1. `ResizeObserver(scroller)`: `viewW` değişimi ≥ 2 px ise **yerleşim değişimi** (`applyLayoutChange("viewport")`); yalnızca `viewH` değişimi ise `engine.setViewport(w,h)` ile `viewH` güncellenir, **ölçek ve scroll dokunulmaz** (adres çubuğu gizlenip görünür olması).
2. Yerleşim değişiminde (genişlik): önce `captureTopAnchor()` (görünüm üst çizgisi), sonra yeni layout; sonra **mod**:
   - `fit-width`/`fit-page`: ölçek referans sayfa (A3) ile yeniden hesaplanır (`fitRefPage`), çıpa üstte korunur.
   - `custom`/`actual-size`: **ölçek aynı kalır**, yalnızca yerleşim ve çıpa (zoom % değişmez, S11 `zoomPercentChangesAfterRotateMax: 0`).
3. Yön değişimi sırasında (`orientationchange`) gesture aktifse `endPinch(false)` ve kilitleri aç.
4. `visualViewport` (klavye açılması): arama çubuğu girişinde sanal klavye `visualViewport.height`'ı düşürür; `scroller.clientHeight` genelde değişir. Kural 1 geçerli (yalnızca `viewH`), konum kaymaz. Eğer bazı cihazlarda `scroller` yüksekliği değişmeden görsel alan daralıyorsa araç çubuğu/arama paneli `visualViewport` ile konumlanır (Plan 05, gerçek cihaz bulgusuna bağlı).

> Mevcut `isResizingRef`/`preservedStateRef`/`setTimeout(100)` mekanizması v4'te **kullanılmaz** (çıpa saf matematik). v3 yolunda kalır.

## B8. Klavye ve el aracı

- **Kısayol kapsamı** (Plan 02 K4 ile uyumlu): işleyici `window`'da değil **viewer kökünde** (`tabIndex=0`) dinler; `input/textarea/[contenteditable]` içinde çalışmaz. Aşağıdakiler korunur: `Ctrl +/−/0/1/2/3` (zoom/fit), `PageUp/PageDown/Space/Shift+Space/Home/End/↑/↓` (gezinme), `Ctrl+F` (arama), `Ctrl+G`/`Enter` (sonraki eşleşme).
- `Ctrl +/−`: `getNextPdfScale` basamaklarıyla `animator.animate(next, resolveAnchor(kind:"viewport"))`; tuş basılı tutulursa (auto-repeat) **`e.repeat` ise 80 ms'den sık işlem yapma** (animasyon retarget zaten birikimi yönetir).
- `PageDown/Space`: `engine.scrollToPage` değil, **görünüm yüksekliğinin %90'ı** kadar yumuşak kaydır (`scrollBy({top, behavior:"smooth"})`); `prefers-reduced-motion` ise `auto`. `Home/End`: belge başı/sonu. `Ctrl+Home/End` aynı.
- El aracı sürükleme (`pointer*` mevcut): bırakınca **ataletli kaydırma** Plan 05 (isteğe bağlı).

## B9. Studio entegrasyonu

- `useZoomGestures` çağrısı `engineFlag === "v4"` iken yerine `useInputController(engine, scrollRef, { onTap, onDoubleTap, onSettle })`. Dönen API **v3 `zoomTo` ile aynı imzayı** sağlayan ince bir adaptör sunar (`zoomTo(scale, {x,y,animate,mode})`), böylece araç çubuğu, ön ayar listesi, klavye ve `handleSmartZoom` kodu değişmeden çalışır:

```ts
const zoomTo = useCallback((n: number, o: ZoomOpts = {}) => {
  const { anchor, vx, vy } = resolveAnchor(engine, o.x != null ? { kind: "pointer", x: o.x, y: o.y } : { kind: o.mode?.startsWith("fit") ? "fit" : "viewport" });
  pendingMode.current = o.mode ?? "custom";
  return animator.animate(n, anchor, vx, vy, o.animate ? (o.mode?.startsWith("fit") ? 220 : 160) : 0);
}, [engine]);
```
- `onSettle(scale)` (engine `settleScale` sonrası): `updateZoomState({ mode: pendingMode.current, scale })`; `targetScaleRef.current = scale`; `setRenderedScale` v4'te gerekmez (render ölçeği konakta).
- **Canlı yüzde:** araç çubuğu `engine.subscribe("scale")` ile rAF'ta güncellenir (yalnızca görünen sayı; React state değil, `useSyncExternalStore` + 50 ms throttle). Yüzde kutusuna yazma `zoomTo` kullanır.
- Zoom modu etiketi: settle sırasında ölçek, fit ölçeğiyle 1e-3 içinde ise ve komut fit'ti → mod korunur; kullanıcı pinch/tekerlek yaptıysa `custom`.
- `data-zooming` engine'dedir (Plan 03); mevcut `ResizeObserver` koruması buna bakar (v4'te yukarıdaki B7 kuralları geçerli).

---

## 5. Plan B: kaydırma kilidi (H1/H3/H4) gerçek cihazda tutmazsa

Belirti örnekleri: iOS'ta pinch başlarken sayfa zıplıyor; Android'de iki parmakla kaydırma pinch'e karışıyor; kilit sonrası `scrollTop` sıfırlanıyor.

Alternatif: **tüm dokunma yönetimi bizde** (`touch-action: none` + özel pan + atalet). Daha çok kod, daha çok risk, ama tarayıcı kaydırma çatışmasını bitirir.

```ts
const PAN_MODE: "native" | "custom" = "native";            // varsayılan; yalnızca gerçek cihaz bulgusu varsa "custom"
// custom: scroller { touch-action: none; overflow: hidden }, pan = tek parmak:
//   pointermove → scrollTop -= dy; velocity = EMA(dy/dt)
//   pointerup   → inertia: v *= 0.95 her kare (frame-independent: v *= Math.pow(0.95, dtMs/16.7)); |v|<0.02 px/ms bitir
//   scrollbar: özel (pdf-page-scrubber zaten var; yerel scrollbar yok olur)
```

**Karar kuralı:** Plan B'ye geçiş yalnızca §6'daki kontrol listesinde "pinch başlangıcında zıplama/kaçma" maddesi **iki farklı cihazda** başarısızsa yapılır. Geçişi kullanıcıya raporla; sessizce yapma.

---

## 6. Gerçek cihaz kontrol listesi (zorunlu çıkış koşulu; Luna yapamaz, kullanıcı yapar)

Plan 01 §4'ün genişletilmişi. Her satır: cihaz × sonuç (✅/❌/not). `?pdfEngine=v4&pdfdebug=1` ile aç; HUD'daki `interaction` ve `mountedPages` gözlenir.

**Cihazlar (en az):** iPhone Safari (iOS ≥16.4, mümkünse iOS 17/18), Android Chrome (orta seviye cihaz), Samsung Internet; iPad Safari (dokunmatik + trackpad/Magic Keyboard varsa); masaüstü Chrome, Firefox, Safari (Mac trackpad).

| # | Eylem | Beklenen |
|---|---|---|
| 1 | İki parmakla yavaş yakınlaştır, sonra uzaklaştır (A4, tr-metin) | Parmakların altındaki nokta parmakla birlikte kalır; beyaz/titreme yok; tarayıcı sayfası zoomlanmaz |
| 2 | Hızlı pinch ×5 art arda | Takılma yok, son ölçek tutarlı, ardından keskinleşir |
| 3 | Pinch yaparken iki parmağı **kaydır** (pan+zoom) | Çıpa parmakları izler |
| 4 | Tek parmakla kaydırırken (momentum sürerken) ikinci parmağı indir | Kaydırma durur, pinch başlar, sıçrama yok (H1/P3) |
| 5 | Pinch bitince **bir parmağı** kaldır, diğerini tut/sürükle | Sayfa kaymaz, araç çubuğu açılıp kapanmaz (P2); tüm parmaklar kalkınca normal kaydırma |
| 6 | Sınırı aş (min/max'ı zorla) | Lastik hissi, bırakınca yumuşak geri dönüş |
| 7 | Pinch-in ile sayfayı ekrandan küçült, belge **sonunda** yap | Kırpma/zıplama yok (D8/H4) |
| 8 | Çift dokunma: yakınlaş, tekrar çift dokunma: fit'e dön | Dokunulan nokta korunur; pinch sonrası 350 ms içinde yanlış çift dokunma yok |
| 9 | Yatay↔dikey döndür (zoom özel iken ve fit iken) | Özel: % aynı; fit: yeniden uyar; üst çıpa korunur (S11) |
| 10 | Adres çubuğunu gizle/göster (kaydır) | Zoom sıfırlanmaz, konum kaymaz |
| 11 | Arama kutusuna yaz (sanal klavye açık) | Konum kaymaz; pinch arama kutusunda başlamaz |
| 12 | Bildirim çekmecesi/sistem jesti pinch ortasında | Takılı kilit yok (`touchcancel`), sayfa kaydırılabilir |
| 13 | iPad trackpad pinch | Çalışır (D9); dokunmatik pinch **çift işlenmez** |
| 14 | Mac trackpad pinch (Chrome, Safari, Firefox) | Akıcı, imleç altında çıpa; tarayıcı sayfa zoom'u yok |
| 15 | Fare tekerleği çentiği (Ctrl+tekerlek) | Çentik başına ≈%10 |
| 16 | Fit-genişlik modunda tüm belgeyi kaydır (karışık A4/A3 belgede) | Yüzde değişmez (D6) |
| 17 | 300 sayfalık belgede hızlı kaydırma + pinch | Takılma yok, bellek sorunu yok (sekme yenilenmez) |
| 18 | A0 pafta: yakınlaştır %300+ | Netleşir, bulanık kalmaz, sekme çökmez |
| 19 | Sekmeyi arka plana al, geri dön | Sayfa yeniden çizilir, beyaz kalmaz |
| 20 | Gece modu açıkken pinch ve kaydırma | Takılma yok |

Sonuçlar `docs/pdf-viewer-v4/04-cihaz-sonuclari.md` dosyasına tablo olarak yazılır. **Başarısız madde varsa "bitti" denmez**, bulgu raporlanır.

---

## 7. Otomatik testler (Plan 01 senaryoları ve yeni birim testler)

- **Birim (tsx):** `input-math.test.ts` (`wheelZoomFactor`, `isWheelNotch`, `resolveAnchor` mantığı saf kısımları), `rubber.test.ts`, `zoom-animator.test.ts`.
- **E2E (Plan 01 şablonları):** S3 (tekerlek), S5 (pinch, mevcut), S6 (çift dokunma), S11 (yön), S12 (fit sabit).
  - S5'e ek adım: **pan+zoom** (iki parmak merkezini 80 px kaydır): çıpa kayması ≤1,5 px.
  - S5'e ek adım: **3. parmak** ekle: pinch biter, ölçek tutarlı kalır, kilit açılır.
  - S5'e ek adım: pinch sonrası kalan parmak sürüklenir: `scrollTop` değişmez (P2).
  - CDP `Input.dispatchTouchEvent` kısıtı: parmak viewport dışına düşerse yardımcı hata fırlatır (Plan 01); `overflow:hidden` kilidi gerçek dokunuşta native davranışı **emüle edilemediği** için H1/H3/H4 bu testlerle **kanıtlanmış sayılmaz**; yalnızca regresyon sınar.

## 8. Risk tablosu

| Risk | Olasılık | Etki | Önlem |
|---|---|---|---|
| `overflow:hidden` kilidi iOS'ta `scrollTop`'u sıfırlar/zıplatır (H4) | Orta | Yüksek | Gerçek cihaz testi #4/#7; Plan B; kilit yerine `touch-action` dinamik değişimi denenir |
| Kilit takılı kalır (olay kaybı) | Düşük | Yüksek | `touchcancel`, `visibilitychange`, `pagehide`, `blur`, 10 sn güvenlik zamanlayıcısı hepsi `unlockScroll` |
| Çentik algılama yanlış (bazı fareler/sürücüler) | Orta | Düşük | Saf fonksiyon + birim test; sürekli yol güvenli yedek; ayar: `wheelNotchFactor` sabiti |
| Çift dokunma ile pinch çakışması | Düşük | Orta | `suppressTaps` 350 ms |
| Fit referans sayfa semantiği kullanıcı beklentisine uymaz | Orta | Düşük | Karar belgelenmiş; değişiklik tek sabitte (`fitRefPageRef` yerine geçerli sayfa) |
| Trackpad pinch'te anchor dalgalanması (Chrome ctrl+wheel `clientX/Y`) | Düşük | Düşük | Çıpa **ilk olayda** sabitlenir, sonraki olaylarda yeniden hesaplanmaz (gesture bitene dek) |

## 9. Çıkış ölçütü

1. **04-A:** S3, S12 yeşil (v3 yolunda); birim testler yeşil; D6/D9/D11 kodda kapatıldı.
2. **04-B (v4 bayrağı, üretim derlemesi):** S3, S5 (mobil, mobile-throttled, ek adımlarla), S6, S11, S12 bütçeleri yeşil.
3. §6 kontrol listesi **en az 2 mobil cihazda** (1 iOS, 1 Android) doldurulmuş; #1–#8 ve #12 hepsi ✅. Başarısız madde varsa açık bulgu + Plan B kararı.
4. `touchmove` dinleyicisi passive (kod incelemesiyle doğrulanır: `grep -n "passive" input-controller.ts`).
5. Rapor: `docs/pdf-viewer-v4/04-sonuc.md` (taban/yeni, açık bulgular).
