import assert from "node:assert/strict";
import {
  computeLayout,
  pageAtY,
  visibleRange,
  currentPageOf,
  anchorFromPoint,
  pointFromAnchor,
  scrollForAnchor,
  type PageSizePt,
} from "../../../src/lib/dokumantasyon/studio/pdf/engine/layout";

// 1. 3 farklı boyutlu sayfa testi
const sizes: PageSizePt[] = [
  { w: 595, h: 842 }, // A4
  { w: 842, h: 1191 }, // A3
  { w: 2384, h: 3370 }, // A0
];

const gap = 16;
const padding = 24;
const scale = 1.5;
const viewportW = 1000;

const L = computeLayout({ sizes, scale, gap, padding, viewportW });

assert.equal(L.n, 3);
assert.equal(L.scale, scale);

// tops[i+1] = tops[i] + heights[i] + gap
assert.equal(L.tops[0], padding);
assert.equal(L.tops[1], L.tops[0] + L.heights[0] + gap);
assert.equal(L.tops[2], L.tops[1] + L.heights[1] + gap);

// totalHeight son sayfanın altı + padding
const expectedTotalHeight = L.tops[2] + L.heights[2] + padding;
assert.equal(L.totalHeight, expectedTotalHeight);

// contentWidth en geniş sayfa + 2*padding veya viewportW
const expectedMaxW = Math.max(sizes[0].w, sizes[1].w, sizes[2].w) * scale;
assert.equal(L.contentWidth, expectedMaxW + 2 * padding);

// 2. pageAtY sınır ve boşluk testleri
assert.equal(pageAtY(L, -50), 0);
assert.equal(pageAtY(L, L.tops[0]), 0);
assert.equal(pageAtY(L, L.tops[0] + 100), 0);
assert.equal(pageAtY(L, L.tops[0] + L.heights[0] + 5), 0); // gap içinde -> üst sayfa
assert.equal(pageAtY(L, L.tops[1]), 1);
assert.equal(pageAtY(L, L.tops[1] + L.heights[1] + gap - 1), 1); // gap içinde
assert.equal(pageAtY(L, L.tops[2]), 2);
assert.equal(pageAtY(L, L.totalHeight + 1000), 2);

// 3. anchorFromPoint -> pointFromAnchor gidiş-dönüş ve ölçek bağımsızlığı
const testPt = { x: L.lefts[1] + 100, y: L.tops[1] + 200 };
const anchor = anchorFromPoint(L, testPt.x, testPt.y);
assert.equal(anchor.page, 1);
const restoredPt = pointFromAnchor(L, anchor);
assert.ok(Math.abs(restoredPt.x - testPt.x) < 1e-9);
assert.ok(Math.abs(restoredPt.y - testPt.y) < 1e-9);

// Ölçek değiştiğinde (1 -> 2.37) aynı çıpa sayfa-yerel kesrini korumalı
const L2 = computeLayout({ sizes, scale: 2.37, gap, padding, viewportW });
const ptInL2 = pointFromAnchor(L2, anchor);
const anchorInL2 = anchorFromPoint(L2, ptInL2.x, ptInL2.y);
assert.equal(anchorInL2.page, anchor.page);
assert.ok(Math.abs(anchorInL2.fx - anchor.fx) < 1e-9);
assert.ok(Math.abs(anchorInL2.fy - anchor.fy) < 1e-9);

// 4. scrollForAnchor clamp
const scrollClamped = scrollForAnchor(L, anchor, 500, 10000, 800, 600);
assert.ok(scrollClamped.top >= 0);
assert.ok(scrollClamped.top <= L.totalHeight - 600);
assert.ok(scrollClamped.left >= 0);
assert.ok(scrollClamped.left <= L.contentWidth - 800);

// Belge başında vy büyükse top=0
const topAnchor = { page: 0, fx: 0.5, fy: 0 };
const scrollAtTop = scrollForAnchor(L, topAnchor, 400, 500, 800, 600);
assert.equal(scrollAtTop.top, 0);

// 5. 5000 sayfa ile O(log N) ikili arama ve doğruluk testi
const bigSizes: PageSizePt[] = Array.from({ length: 5000 }, (_, i) => ({
  w: 595 + (i % 10) * 10,
  h: 842 + (i % 5) * 20,
}));

const t0 = performance.now();
const bigL = computeLayout({ sizes: bigSizes, scale: 1.0, gap: 10, padding: 20, viewportW: 800 });
const layoutTime = performance.now() - t0;
assert.ok(layoutTime < 50, `5000 sayfa layout süresi ${layoutTime}ms < 50ms olmalı`);

// 1000 rastgele y için ikili arama vs doğrusal tarama
for (let k = 0; k < 1000; k++) {
  const sampleY = Math.random() * bigL.totalHeight;
  const binaryResult = pageAtY(bigL, sampleY);

  // Doğrusal doğrulama
  let linearResult = 0;
  for (let i = 0; i < bigL.n; i++) {
    if (bigL.tops[i] <= sampleY) {
      linearResult = i;
    } else {
      break;
    }
  }
  assert.equal(binaryResult, linearResult, `pageAtY uyumsuzluğu y=${sampleY}`);
}

// 6. visibleRange ve currentPageOf
const range = visibleRange(L, L.tops[1], 400, 100);
assert.ok(range.first <= 1 && range.last >= 1);
const curr = currentPageOf(L, L.tops[1], 500);
assert.equal(curr, 2); // 1-tabanlı sayfa numarası (sayfa index 1 -> sayfa 2)

// 7. 50.000 sayfalık stres testi (Plan 03 P3.8)
const hugeSizes: PageSizePt[] = Array.from({ length: 50_000 }, () => ({ w: 595, h: 842 }));
const tStart = performance.now();
const hugeL = computeLayout({ sizes: hugeSizes, scale: 1.0, gap: 10, padding: 20, viewportW: 800 });
const hugeTime = performance.now() - tStart;
assert.ok(hugeTime < 30, `50.000 sayfa layout süresi ${hugeTime}ms < 30ms olmalı`);
assert.equal(hugeL.n, 50_000);

console.log(`layout: birim testleri (computeLayout, pageAtY ikili arama, 50k sayfa ${hugeTime.toFixed(2)}ms) başarıyla geçti`);
