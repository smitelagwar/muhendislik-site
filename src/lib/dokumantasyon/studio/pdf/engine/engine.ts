// ============================================================================
// PDF v4 MOTOR — ÇEKİRDEK MOTOR SINIFI (Plan 03 P3.3, P3.8)
// ----------------------------------------------------------------------------
// Geometri store'u, imperatif DOM uygulaması, sanal sayfa aralık takibi,
// zoom animatörü ve koordinat çıpalama yöneticisi.
// React'tan bağımsızdır; useSyncExternalStore ile React'a bağlanır.
// ============================================================================

import {
  computeLayout,
  pageAtY,
  visibleRange,
  currentPageOf,
  anchorFromPoint,
  pointFromAnchor,
  scrollForAnchor,
  type Layout,
  type PageSizePt,
  type DocAnchor,
} from "./layout";
import { MIN_PDF_SCALE, clampPdfScale } from "../pdf-gesture-engine";
import { getMaxPdfScale } from "../pdf-zoom-math";

export interface EngineOptions {
  scroller: HTMLElement;
  sizer: HTMLElement;
  gap?: number;
  padding?: number;
  initialScale?: number;
  initialRotation?: number;
  paddingTopExtra?: () => number;
  overscanPx?: () => number;
  now?: () => number;
}

export function maxScaleForHeight(
  sizes: ReadonlyArray<PageSizePt>,
  gap: number,
  padding: number,
  cap = 15_000_000
): number {
  if (sizes.length === 0) return 10.0;
  let lo = 0.1;
  let hi = 20.0;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    let h = 2 * padding - gap;
    for (const s of sizes) h += s.h * mid + gap;
    if (h <= cap) lo = mid;
    else hi = mid;
  }
  return lo;
}

import { Scheduler } from "./scheduler";
import { Governor, getDefaultGovernorConfig } from "./governor";
import { CanvasPool } from "./canvas-pool";

export class PdfEngine {
  readonly scroller: HTMLElement;
  readonly sizer: HTMLElement;
  readonly scheduler: Scheduler;
  readonly governor: Governor;
  readonly pool: CanvasPool;
  private readonly gap: number;
  private readonly padding: number;
  private readonly ptExtraFn: () => number;
  private readonly overscanFn: () => number;
  private readonly nowFn: () => number;

  private rawSizes: PageSizePt[] = [];
  private rotatedSizes: PageSizePt[] = [];
  private rotation: number = 0;
  private viewW: number = 800;
  private viewH: number = 600;

  private scale: number = 1.0;
  private renderScale: number = 1.0;
  private layout: Layout;
  private range: { first: number; last: number } = { first: 1, last: 1 };
  private currentPage: number = 1;
  private interaction: "idle" | "scrolling" | "gesture" = "idle";

  private pages = new Map<number, HTMLElement>();
  private listeners = new Map<string, Set<() => void>>([
    ["range", new Set()],
    ["page", new Set()],
    ["scale", new Set()],
    ["layout", new Set()],
  ]);

  private rafScroll: number = 0;
  private animId: number = 0;
  private zoomingTimer: any = null;

  constructor(opts: EngineOptions) {
    this.scroller = opts.scroller;
    this.sizer = opts.sizer;
    this.gap = opts.gap ?? 16;
    this.padding = opts.padding ?? 16;
    if (typeof opts.initialScale === "number") {
      this.scale = opts.initialScale;
      this.renderScale = opts.initialScale;
    }
    if (typeof opts.initialRotation === "number") {
      this.rotation = opts.initialRotation;
    }
    this.viewW = Math.max(1, opts.scroller.clientWidth || 800);
    this.viewH = Math.max(1, opts.scroller.clientHeight || 600);
    this.ptExtraFn = opts.paddingTopExtra ?? (() => 0);
    this.overscanFn = opts.overscanPx ?? (() => this.viewH * 1.5);
    this.nowFn = opts.now ?? (() => performance.now());

    this.scheduler = new Scheduler(2);
    this.governor = new Governor();
    this.pool = new CanvasPool();

    this.layout = computeLayout({
      sizes: [],
      scale: this.scale,
      gap: this.gap,
      padding: this.padding,
      viewportW: this.viewW,
      paddingTopExtra: this.ptExtraFn(),
    });

    this.scroller.addEventListener("scroll", this.onScroll, { passive: true });
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.onVisibilityChange);
    }
  }

  // --- Girdi ---

  getRotation(): number {
    return this.rotation;
  }

  setSizes(from: number, sizes: PageSizePt[]): void {
    const next = [...this.rawSizes];
    for (let i = 0; i < sizes.length; i++) {
      next[from - 1 + i] = sizes[i];
    }
    this.rawSizes = next;
    this.applyRotationToSizes();
    this.applyLayoutChange("sizes");
  }

  setRotation(deg: number): void {
    const rot = ((deg % 360) + 360) % 360;
    if (this.rotation === rot) return;
    this.rotation = rot;
    this.applyRotationToSizes();
    this.applyLayoutChange("rotation");
  }

  setViewport(w: number, h: number): void {
    if (Math.abs(this.viewW - w) < 1 && Math.abs(this.viewH - h) < 1) return;
    this.viewW = Math.max(1, w);
    this.viewH = Math.max(1, h);
    this.applyLayoutChange("viewport");
  }

  // --- Ölçek ve Zoom ---

  getScale(): number {
    return this.scale;
  }

  getRenderScale(): number {
    return this.renderScale;
  }

  minScale(): number {
    return MIN_PDF_SCALE;
  }

  maxScale(): number {
    const hCap = maxScaleForHeight(this.rotatedSizes, this.gap, this.padding);
    return Math.min(getMaxPdfScale(), hCap);
  }

  clampScale(s: number): number {
    return clampPdfScale(s, this.minScale(), this.maxScale());
  }

  captureCenterAnchor(): DocAnchor & { vx: number; vy: number } {
    const vx = this.viewW / 2;
    const vy = this.viewH / 2;
    const docX = this.scroller.scrollLeft + vx;
    const docY = this.scroller.scrollTop + vy;
    return {
      ...anchorFromPoint(this.layout, docX, docY),
      vx,
      vy,
    };
  }

  setScale(
    scale: number,
    anchorOrFocus?: (DocAnchor & { vx: number; vy: number }) | { vx: number; vy: number }
  ): void {
    const s = this.clampScale(scale);
    if (Math.abs(this.scale - s) < 1e-4 && Math.abs(this.renderScale - s) < 1e-4) return;

    let anchor: DocAnchor & { vx: number; vy: number };
    if (anchorOrFocus && "page" in anchorOrFocus) {
      anchor = anchorOrFocus;
    } else {
      const vx = anchorOrFocus?.vx ?? this.viewW / 2;
      const vy = anchorOrFocus?.vy ?? (this.scroller.scrollTop <= 1 ? 0 : this.viewH / 2);
      const docX = this.scroller.scrollLeft + vx;
      const docY = this.scroller.scrollTop + vy;
      anchor = {
        ...anchorFromPoint(this.layout, docX, docY),
        vx,
        vy,
      };
    }
    this.scale = s;
    this.renderScale = s;

    this.layout = computeLayout({
      sizes: this.rotatedSizes,
      scale: this.scale,
      gap: this.gap,
      padding: this.padding,
      viewportW: this.viewW,
      paddingTopExtra: this.ptExtraFn(),
    });

    this.sizer.style.width = `${this.layout.contentWidth}px`;
    this.sizer.style.height = `${this.layout.totalHeight}px`;

    const scr = scrollForAnchor(this.layout, anchor, anchor.vx, anchor.vy, this.viewW, this.viewH);
    this.scroller.scrollLeft = scr.left;
    this.scroller.scrollTop = scr.top;

    for (const [p1, el] of this.pages) {
      this.applyBox(p1, el);
    }

    this.updateRange();
    this.updateCurrent();
    this.emit("scale");
  }

  /**
   * Tek karelik senkron ölçekleme. Gesture veya animatör tarafından her rAF'ta çağrılır.
   */
  setLiveScale(scale: number, anchor: DocAnchor, vx: number, vy: number): void {
    this.scale = this.clampScale(scale);

    // data-zooming işaretini yerleştir
    this.scroller.setAttribute("data-zooming", "true");
    if (this.zoomingTimer) clearTimeout(this.zoomingTimer);

    this.layout = computeLayout({
      sizes: this.rotatedSizes,
      scale: this.scale,
      gap: this.gap,
      padding: this.padding,
      viewportW: this.viewW,
      paddingTopExtra: this.ptExtraFn(),
    });

    // 1) sizer boyutu
    this.sizer.style.width = `${this.layout.contentWidth}px`;
    this.sizer.style.height = `${this.layout.totalHeight}px`;

    // 2) scroll: çıpayı (vx, vy) noktasında tut
    const s = scrollForAnchor(this.layout, anchor, vx, vy, this.viewW, this.viewH);
    this.scroller.scrollLeft = s.left;
    this.scroller.scrollTop = s.top;

    // 3) Görünür aralık kontrolü
    this.updateRange();

    // 4) Mount edilmiş sayfa kutularını güncelle
    for (const [p1, el] of this.pages) {
      this.applyBox(p1, el);
    }

    this.emit("scale");
  }

  /**
   * Zoom durduğunda çağrılır: render ölçeğini terfi ettirir, data-zooming kaldırılır.
   */
  settleScale(): void {
    this.renderScale = this.scale;
    if (this.zoomingTimer) clearTimeout(this.zoomingTimer);
    this.zoomingTimer = setTimeout(() => {
      this.scroller.removeAttribute("data-zooming");
    }, 150);

    for (const [p1, el] of this.pages) {
      this.applyBox(p1, el);
    }
    this.emit("scale");
  }

  async animateScale(
    targetScale: number,
    anchor: DocAnchor,
    vx: number,
    vy: number,
    ms: number = 200
  ): Promise<void> {
    if (this.animId) cancelAnimationFrame(this.animId);
    const startScale = this.scale;
    const endScale = this.clampScale(targetScale);
    if (Math.abs(startScale - endScale) < 0.001) {
      this.settleScale();
      return;
    }

    const t0 = this.nowFn();
    return new Promise<void>((resolve) => {
      const step = () => {
        const now = this.nowFn();
        const progress = Math.min(1, (now - t0) / ms);
        // ease-out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = startScale + (endScale - startScale) * ease;
        this.setLiveScale(current, anchor, vx, vy);

        if (progress < 1) {
          this.animId = requestAnimationFrame(step);
        } else {
          this.animId = 0;
          this.settleScale();
          resolve();
        }
      };
      this.animId = requestAnimationFrame(step);
    });
  }

  // --- Gezinme ---

  scrollToPage(page1: number, fy: number = 0, behavior: "auto" | "smooth" = "auto"): void {
    if (this.layout.n <= 0) return;
    const p0 = Math.min(Math.max(page1 - 1, 0), this.layout.n - 1);
    const targetY = this.layout.tops[p0] + fy * (this.layout.heights[p0] || 0);
    this.scroller.scrollTo({
      top: Math.max(0, targetY),
      behavior,
    });
  }

  scrollToRect(
    page1: number,
    rectCss: { x: number; y: number; w: number; h: number },
    align: "center" | "nearest" = "center"
  ): void {
    if (this.layout.n <= 0) return;
    const p0 = Math.min(Math.max(page1 - 1, 0), this.layout.n - 1);
    const pageX = this.layout.lefts[p0];
    const pageY = this.layout.tops[p0];

    let targetY = pageY + rectCss.y;
    if (align === "center") {
      targetY += rectCss.h / 2 - this.viewH / 2;
    }

    let targetX = pageX + rectCss.x;
    if (align === "center") {
      targetX += rectCss.w / 2 - this.viewW / 2;
    }

    this.scroller.scrollTo({
      left: Math.max(0, targetX),
      top: Math.max(0, targetY),
      behavior: "auto",
    });
  }

  getPosition(): { page: number; fy: number; fx: number; scale: number } {
    const a = this.captureTopAnchor();
    return {
      page: a.page + 1,
      fy: a.fy,
      fx: a.fx,
      scale: this.scale,
    };
  }

  restorePosition(p: { page: number; fy?: number; scale?: number }): void {
    if (typeof p.scale === "number" && p.scale > 0) {
      this.scale = this.clampScale(p.scale);
      this.renderScale = this.scale;
    }
    this.scrollToPage(p.page, p.fy ?? 0, "auto");
  }

  captureTopAnchor(): DocAnchor & { vx: number } {
    const vx = this.viewW / 2;
    const docX = this.scroller.scrollLeft + vx;
    const docY = this.scroller.scrollTop;
    return {
      ...anchorFromPoint(this.layout, docX, docY),
      vx,
    };
  }

  viewRectInPage(page1: number): { x: number; y: number; w: number; h: number } | null {
    const p0 = page1 - 1;
    if (p0 < 0 || p0 >= this.layout.n) return null;

    const sL = this.scroller.scrollLeft;
    const sT = this.scroller.scrollTop;
    const pLeft = this.layout.lefts[p0];
    const pTop = this.layout.tops[p0];
    const pW = this.layout.widths[p0];
    const pH = this.layout.heights[p0];

    const x0 = Math.max(0, sL - pLeft);
    const y0 = Math.max(0, sT - pTop);
    const x1 = Math.min(pW, sL + this.viewW - pLeft);
    const y1 = Math.min(pH, sT + this.viewH - pTop);

    if (x1 <= x0 || y1 <= y0) return null;

    // Canlı ölçekten render ölçeğine normalize et
    const scaleRatio = this.scale / (this.renderScale || 1.0);
    return {
      x: x0 / scaleRatio,
      y: y0 / scaleRatio,
      w: (x1 - x0) / scaleRatio,
      h: (y1 - y0) / scaleRatio,
    };
  }

  // --- Durum ve Sorgular ---

  setInteraction(s: "idle" | "scrolling" | "gesture"): void {
    this.interaction = s;
  }

  getRange(): { first: number; last: number } {
    return this.range;
  }

  getCurrentPage(): number {
    return this.currentPage;
  }

  getLayout(): Layout {
    return this.layout;
  }

  // --- Olaylar ---

  subscribe(kind: "range" | "page" | "scale" | "layout", cb: () => void): () => void {
    const set = this.listeners.get(kind);
    if (!set) return () => {};
    set.add(cb);
    return () => set.delete(cb);
  }

  registerPage(page1: number, el: HTMLElement): () => void {
    this.pages.set(page1, el);
    this.applyBox(page1, el);
    return () => {
      this.pages.delete(page1);
    };
  }

  private scrollTimer: any = null;

  dispose(): void {
    this.scroller.removeEventListener("scroll", this.onScroll);
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.onVisibilityChange);
    }
    if (this.scrollTimer) clearTimeout(this.scrollTimer);
    if (this.rafScroll) cancelAnimationFrame(this.rafScroll);
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.zoomingTimer) clearTimeout(this.zoomingTimer);
    this.listeners.forEach((s) => s.clear());
    this.pages.clear();
  }

  // --- İç Mekanizma ---

  private onVisibilityChange = (): void => {
    if (typeof document === "undefined") return;
    if (document.hidden) {
      this.scheduler.setInteraction("gesture");
      this.governor.trimTo(0);
      this.pool.clear();
    } else {
      this.scheduler.setInteraction("idle");
      this.emit("range");
    }
  };

  private onScroll = (): void => {
    this.scheduler.setInteraction("scrolling");
    if (this.scrollTimer) clearTimeout(this.scrollTimer);
    this.scrollTimer = setTimeout(() => {
      this.scheduler.setInteraction("idle");
    }, 80);

    if (this.rafScroll) return;
    this.rafScroll = requestAnimationFrame(() => {
      this.rafScroll = 0;
      this.updateRange();
      this.updateCurrent();
    });
  };

  private updateRange(): void {
    const r = visibleRange(this.layout, this.scroller.scrollTop, this.viewH, this.overscanFn());
    // 1-tabanlı
    const first1 = r.first + 1;
    const last1 = r.last + 1;
    if (first1 !== this.range.first || last1 !== this.range.last) {
      this.range = { first: first1, last: last1 };
      this.emit("range");
    }
  }

  private updateCurrent(): void {
    const cp = currentPageOf(this.layout, this.scroller.scrollTop, this.viewH);
    if (cp !== this.currentPage) {
      this.currentPage = cp;
      this.emit("page");
    }
  }

  private applyRotationToSizes(): void {
    const isSwap = this.rotation === 90 || this.rotation === 270;
    this.rotatedSizes = this.rawSizes.map((s) => (isSwap ? { w: s.h, h: s.w } : { w: s.w, h: s.h }));
  }

  private applyLayoutChange(kind: "sizes" | "rotation" | "viewport"): void {
    const isAtTop = this.scroller.scrollTop <= 1;
    const anchor = this.captureTopAnchor();

    this.layout = computeLayout({
      sizes: this.rotatedSizes,
      scale: this.scale,
      gap: this.gap,
      padding: this.padding,
      viewportW: this.viewW,
      paddingTopExtra: this.ptExtraFn(),
    });

    this.sizer.style.width = `${this.layout.contentWidth}px`;
    this.sizer.style.height = `${this.layout.totalHeight}px`;

    if (isAtTop) {
      this.scroller.scrollTop = 0;
    } else {
      const s = scrollForAnchor(this.layout, anchor, anchor.vx, 0, this.viewW, this.viewH);
      this.scroller.scrollLeft = s.left;
      this.scroller.scrollTop = s.top;
    }

    this.updateRange();
    this.updateCurrent();

    for (const [p1, el] of this.pages) {
      this.applyBox(p1, el);
    }

    this.emit("layout");
  }

  private applyBox(p1: number, el: HTMLElement): void {
    const i = p1 - 1;
    if (i < 0 || i >= this.layout.n) return;
    const L = this.layout;
    el.style.width = `${L.widths[i]}px`;
    el.style.height = `${L.heights[i]}px`;
    el.style.transform = `translate3d(${L.lefts[i]}px, ${L.tops[i]}px, 0)`;

    // Nesil kapları: live/genScale oranını uygula
    const genContainers = el.querySelectorAll<HTMLElement>("[data-gen-scale]");
    for (let k = 0; k < genContainers.length; k++) {
      const g = genContainers[k];
      const gs = Number(g.dataset.genScale) || this.scale;
      g.style.transform = `scale(${this.scale / gs})`;
    }
  }

  private emit(kind: "range" | "page" | "scale" | "layout"): void {
    const set = this.listeners.get(kind);
    if (set) {
      for (const cb of set) cb();
    }
  }
}
