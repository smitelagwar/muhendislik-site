import assert from "node:assert/strict";
import { maxScaleForHeight, PdfEngine } from "../../../src/lib/dokumantasyon/studio/pdf/engine/engine";
import { visibleRange } from "../../../src/lib/dokumantasyon/studio/pdf/engine/layout";
import { Governor, getDefaultGovernorConfig } from "../../../src/lib/dokumantasyon/studio/pdf/engine/governor";

// 1. maxScaleForHeight testleri
const a4Sizes = Array.from({ length: 1000 }, () => ({ w: 595.28, h: 841.89 }));
const scaleFor1000 = maxScaleForHeight(a4Sizes, 16, 16, 15_000_000);
// 1000 sayfa A4 için 15M cap altında güvenli ölçek hesaplanmalı (yaklaşık 17.8)
assert(scaleFor1000 > 10, `scaleFor1000 beklenenden küçük: ${scaleFor1000}`);
assert(scaleFor1000 <= 20, `scaleFor1000 20'yi aşamaz: ${scaleFor1000}`);

const a0Sizes = Array.from({ length: 5000 }, () => ({ w: 2383.94, h: 3370.39 }));
const scaleFor5000A0 = maxScaleForHeight(a0Sizes, 16, 16, 15_000_000);
// 5000 sayfa A0 için 15M cap altında ölçek ~0.88 civarında kısıtlanmalı
assert(scaleFor5000A0 < 1.0, `5000 A0 için ölçek kısıtlanmalı: ${scaleFor5000A0}`);
assert(scaleFor5000A0 > 0.5, `5000 A0 için ölçek çok düşük olmamalı: ${scaleFor5000A0}`);

// 2. Governor testleri
const cfg = getDefaultGovernorConfig(false);
const gov = new Governor(cfg);
assert(gov.sharpBytes === 0);
assert(gov.backdropBytes === 0);

// Mock canvas
const makeCanvas = (w: number, h: number) => ({ width: w, height: h } as HTMLCanvasElement);
const c1 = makeCanvas(100, 100);
gov.addSharp("s:1", c1);
assert.equal(gov.sharpBytes, 100 * 100 * 4);

gov.setVisible(["s:1"]);
gov.trimTo(0);
// s:1 görünür olduğu için korunur
assert.equal(gov.sharp.has("s:1"), true);

gov.setVisible([]);
gov.trimTo(0);
// s:1 artık görünür olmadığı için 0 bütçede tahliye edilir
assert.equal(gov.sharp.has("s:1"), false);
assert.equal(gov.sharpBytes, 0);

// 3. PdfEngine setPageKeys / clearPageKeys birleşim koruması
const mockEl = () => {
  const el = {
    clientWidth: 800,
    clientHeight: 600,
    scrollLeft: 0,
    scrollTop: 0,
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    setAttribute: () => {},
    removeAttribute: () => {},
    scrollTo: (opts: { left?: number; top?: number }) => {
      if (typeof opts.left === "number") el.scrollLeft = opts.left;
      if (typeof opts.top === "number") el.scrollTop = opts.top;
    },
  };
  return el as unknown as HTMLElement;
};

const eng = new PdfEngine({ scroller: mockEl(), sizer: mockEl() });
eng.governor.addSharp("s:p1", makeCanvas(50, 50));
eng.governor.addSharp("s:p2", makeCanvas(50, 50));
eng.setPageKeys(1, ["s:p1"]);
eng.setPageKeys(2, ["s:p2"]);
eng.governor.trimTo(0);
assert.equal(eng.governor.sharp.has("s:p1"), true);
assert.equal(eng.governor.sharp.has("s:p2"), true);

eng.clearPageKeys(1);
eng.governor.trimTo(0);
assert.equal(eng.governor.sharp.has("s:p1"), false);
assert.equal(eng.governor.sharp.has("s:p2"), true);
eng.dispose();

// 4. A2: Karışık boyutlu ilk setSizes yatay ortalama ve setRotation konum koruması
const scroller2 = mockEl();
const eng2 = new PdfEngine({ scroller: scroller2, sizer: mockEl() });
eng2.setSizes(1, [
  { w: 600, h: 800 },
  { w: 1800, h: 800 },
  { w: 600, h: 800 },
]);
const lay2 = eng2.getLayout();
const p1Center = lay2.lefts[0] + lay2.widths[0] / 2;
const viewCenter = scroller2.scrollLeft + scroller2.clientWidth / 2;
assert(Math.abs(p1Center - viewCenter) < 1, `1. sayfa merkezi görünüm merkezinde olmalı: ${p1Center} vs ${viewCenter}`);

eng2.scrollToPage(2, 0.25);
assert.equal(eng2.getPosition().page, 2);
eng2.setRotation(90);
assert.equal(eng2.getPosition().page, 2);
eng2.dispose();

// 5. A4: setLiveScale overshoot (lastik bant aşımı)
const eng3 = new PdfEngine({ scroller: mockEl(), sizer: mockEl() });
eng3.setSizes(1, [{ w: 600, h: 800 }]);
const maxS = eng3.maxScale();
const callLive = eng3.setLiveScale.bind(eng3) as (
  scale: number,
  anchor: { page: number; fx: number; fy: number },
  vx: number,
  vy: number,
  overshoot?: boolean
) => void;
callLive(maxS * 2, { page: 0, fx: 0.5, fy: 0.5 }, 400, 300, true);
assert(
  eng3.getScale() > maxS && eng3.getScale() <= maxS * 1.25 + 1e-6,
  `overshoot=true ile ölçek (${eng3.getScale()}) (${maxS}, ${maxS * 1.25}] aralığında olmalı`
);
callLive(maxS * 2, { page: 0, fx: 0.5, fy: 0.5 }, 400, 300, false);
assert(
  eng3.getScale() <= maxS + 1e-6,
  `overshoot olmadan ölçek (${eng3.getScale()}) <= ${maxS} olmalı`
);
eng3.dispose();

// 6. A4: setInteraction jest durumu koruması (400ms kalkanı + force)
let fakeNow = 1000;
const eng4 = new PdfEngine({ scroller: mockEl(), sizer: mockEl(), now: () => fakeNow });
const callSetInteraction = eng4.setInteraction.bind(eng4) as (
  s: "idle" | "scrolling" | "gesture",
  force?: boolean
) => void;
callSetInteraction("gesture");
callSetInteraction("scrolling");
assert.equal(eng4.scheduler.interactionState, "gesture", "400ms içinde scrolling gesture durumunu ezemez");
fakeNow += 500;
callSetInteraction("scrolling");
assert.equal(eng4.scheduler.interactionState, "scrolling", "400ms sonrasında scrolling kabul edilmeli");
callSetInteraction("gesture");
callSetInteraction("idle", true);
assert.equal(eng4.scheduler.interactionState, "idle", "force=true her zaman kabul edilmeli");
eng4.dispose();

// 7. A5: maxScale önbelleği (5000 sayfa, 200 clampScale < 50ms ve boyut değişince güncellenir)
const eng5 = new PdfEngine({ scroller: mockEl(), sizer: mockEl() });
const sizes5000 = Array.from({ length: 5000 }, () => ({ w: 600, h: 1000 }));
eng5.setSizes(1, sizes5000);
const maxBefore = eng5.maxScale();
const t0 = performance.now();
for (let i = 0; i < 200; i++) {
  eng5.clampScale(2.5);
}
const elapsedMs = performance.now() - t0;
assert(elapsedMs < 50, `200 clampScale çağrısı < 50ms olmalı, gerçekleşen: ${elapsedMs.toFixed(2)}ms`);
eng5.setSizes(1, Array.from({ length: 5000 }, () => ({ w: 600, h: 2500 })));
const maxAfter = eng5.maxScale();
assert.notEqual(maxBefore, maxAfter, "Boyut değişince maxScale yeniden hesaplanmalı");
eng5.dispose();

// 8. A5: düşük zoom + geniş viewH altında getRange() sayfa sınırı (<= 30) ve strict aralık korunumu
const wideScroller = {
  ...mockEl(),
  clientWidth: 1200,
  clientHeight: 1600,
} as unknown as HTMLElement;
const eng6 = new PdfEngine({ scroller: wideScroller, sizer: mockEl(), initialScale: 0.2 });
const sizes400 = Array.from({ length: 400 }, (_, idx) => ({ w: 600, h: idx === 2 ? 910 : 400 }));
eng6.setSizes(1, sizes400);
const range6 = eng6.getRange();
const count6 = range6.last - range6.first + 1;
assert(count6 <= 30, `getRange() toplam sayfa sayısı <= 30 olmalı, alınan: ${count6}`);
assert.equal(range6.first, 1, "strict aralığın ilk sayfası (1) dahil olmalı");

// 9. A5: getPageSize(3) ham boyutu ve getPageSize(999) null döner
const getPageSizeFn = (eng6 as unknown as { getPageSize?: (p: number) => { w: number; h: number } | null }).getPageSize;
assert.equal(typeof getPageSizeFn, "function", "getPageSize tanımlı olmalı");
assert.deepEqual(getPageSizeFn!.call(eng6, 3), { w: 600, h: 910 });
assert.equal(getPageSizeFn!.call(eng6, 999), null);
eng6.dispose();

// 10. A8: jest sonrası programatik scroll koruması (100ms ve 300ms)
let fakeNowA8 = 1000;
const eng7 = new PdfEngine({ scroller: mockEl(), sizer: mockEl(), now: () => fakeNowA8 });
const scrollEngine = eng7 as unknown as { onScroll: () => void; rafScroll: number };
eng7.setInteraction("gesture");
eng7.settleScale();
scrollEngine.rafScroll = 1;
fakeNowA8 += 100;
scrollEngine.onScroll();
assert.notEqual(eng7.scheduler.interactionState, "scrolling", "100ms sonraki scroll jest korumasını aşmamalı");
eng7.setInteraction("scrolling");
assert.notEqual(eng7.scheduler.interactionState, "scrolling", "setInteraction 250ms jest-sonrası kalkanını korumalı");
fakeNowA8 += 200;
scrollEngine.onScroll();
assert.equal(eng7.scheduler.interactionState, "scrolling", "300ms sonraki scroll kabul edilmeli");
scrollEngine.rafScroll = 0;
eng7.dispose();

// 11. A8: mount aralığı overscan sınırını aşmamalı
const rangeScrollerA8 = { ...mockEl(), clientWidth: 1200, clientHeight: 600 } as unknown as HTMLElement;
const eng8 = new PdfEngine({
  scroller: rangeScrollerA8,
  sizer: mockEl(),
  initialScale: 0.2,
  overscanPx: () => 0,
});
eng8.setSizes(1, Array.from({ length: 40 }, () => ({ w: 600, h: 800 })));
eng8.scrollToPage(20);
const strictRangeA8 = visibleRange(eng8.getLayout(), rangeScrollerA8.scrollTop, rangeScrollerA8.clientHeight, 0);
assert.deepEqual(
  eng8.getRange(),
  { first: strictRangeA8.first + 1, last: strictRangeA8.last + 1 },
  "overscan sıfırken mount aralığı yalnızca görünür sayfaları içermeli"
);
eng8.dispose();

console.log("engine/governor: birim testleri (maxScaleForHeight, governor bütçe/koruma, setPageKeys, yatay ortalama, rotasyon, overshoot, gesture-guard, maxScale-cache, range-cap, getPageSize) başarıyla geçti");
