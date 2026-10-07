// ============================================================================
// PDF v4 MOTOR — SAF GEOMETRİ VE YERLEŞİM (Plan 03 P3.1.1)
// ----------------------------------------------------------------------------
// React ve DOM'dan bağımsız; Float64Array ile O(1) ve O(log N) ikili arama.
// ============================================================================

export interface PageSizePt {
  w: number;
  h: number;
}

export interface LayoutParams {
  sizes: ReadonlyArray<PageSizePt>;
  scale: number; // css px / pt
  gap: number; // PDF_PAGE_GAP (ölçeklenmeyen piksel)
  padding: number; // PDF_PAGE_PADDING (kenar boşluğu)
  viewportW: number; // kaydırma alanının clientWidth (scrollbar hariç)
  paddingTopExtra?: number; // mobilde araç çubuğu payı
}

export interface Layout {
  n: number;
  scale: number;
  tops: Float64Array;
  heights: Float64Array;
  widths: Float64Array;
  lefts: Float64Array;
  totalHeight: number;
  contentWidth: number;
}

export function computeLayout(p: LayoutParams): Layout {
  const n = p.sizes.length;
  const tops = new Float64Array(n);
  const heights = new Float64Array(n);
  const widths = new Float64Array(n);
  const lefts = new Float64Array(n);
  let y = p.padding + (p.paddingTopExtra ?? 0);
  let maxW = 0;

  for (let i = 0; i < n; i++) {
    const w = p.sizes[i].w * p.scale;
    const h = p.sizes[i].h * p.scale;
    widths[i] = w;
    heights[i] = h;
    tops[i] = y;
    y += h + p.gap;
    if (w > maxW) maxW = w;
  }

  const totalHeight = n > 0 ? y - p.gap + p.padding : 2 * p.padding;
  const contentWidth = Math.max(p.viewportW, maxW + 2 * p.padding);

  for (let i = 0; i < n; i++) {
    lefts[i] = (contentWidth - widths[i]) / 2;
  }

  return {
    n,
    scale: p.scale,
    tops,
    heights,
    widths,
    lefts,
    totalHeight,
    contentWidth,
  };
}

/** y koordinatını içeren sayfa (0-tabanlı). Boşluktaysa en yakın üst sayfa. İkili arama O(log N). */
export function pageAtY(L: Layout, y: number): number {
  if (L.n <= 0) return 0;
  if (y <= L.tops[0]) return 0;
  if (y >= L.tops[L.n - 1]) return L.n - 1;

  let lo = 0;
  let hi = L.n - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (L.tops[mid] <= y) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** Görünür sayfa aralığı (0-tabanlı, dahil). */
export function visibleRange(
  L: Layout,
  scrollTop: number,
  viewH: number,
  overscanPx: number
): { first: number; last: number } {
  if (L.n <= 0) return { first: 0, last: 0 };
  const a = pageAtY(L, Math.max(0, scrollTop - overscanPx));
  const b = pageAtY(L, scrollTop + viewH + overscanPx);
  return { first: Math.max(0, a), last: Math.min(L.n - 1, Math.max(a, b)) };
}

/** Araç çubuğundaki "geçerli sayfa": görünüm yüksekliğinin %40 çizgisini içeren sayfa (1-tabanlı). */
export function currentPageOf(L: Layout, scrollTop: number, viewH: number): number {
  if (L.n <= 0) return 1;
  return pageAtY(L, scrollTop + viewH * 0.4) + 1;
}

/** Çıpa: belge içindeki bir noktayı sayfa-yerel kesirle tutar; ölçekten bağımsızdır. */
export interface DocAnchor {
  page: number; // 0-tabanlı sayfa indeksi
  fx: number; // sayfa içi yatay oran [0..1]
  fy: number; // sayfa içi dikey oran [0..1]
}

export function anchorFromPoint(L: Layout, docX: number, docY: number): DocAnchor {
  if (L.n <= 0) return { page: 0, fx: 0.5, fy: 0 };
  const i = pageAtY(L, docY);
  const w = L.widths[i] || 1;
  const h = L.heights[i] || 1;
  return {
    page: i,
    fx: (docX - L.lefts[i]) / w,
    fy: (docY - L.tops[i]) / h,
  };
}

export function pointFromAnchor(L: Layout, a: DocAnchor): { x: number; y: number } {
  if (L.n <= 0) return { x: 0, y: 0 };
  const i = Math.min(Math.max(a.page, 0), L.n - 1);
  return {
    x: L.lefts[i] + a.fx * L.widths[i],
    y: L.tops[i] + a.fy * L.heights[i],
  };
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Çıpa viewport içinde (vx, vy) noktasında kalsın diye gereken scrollLeft/Top. */
export function scrollForAnchor(
  L: Layout,
  a: DocAnchor,
  vx: number,
  vy: number,
  viewW: number,
  viewH: number
): { left: number; top: number } {
  if (L.n <= 0) return { left: 0, top: 0 };
  const p = pointFromAnchor(L, a);
  const maxL = Math.max(0, L.contentWidth - viewW);
  const maxT = Math.max(0, L.totalHeight - viewH);
  return {
    left: clamp(p.x - vx, 0, maxL),
    top: clamp(p.y - vy, 0, maxT),
  };
}
