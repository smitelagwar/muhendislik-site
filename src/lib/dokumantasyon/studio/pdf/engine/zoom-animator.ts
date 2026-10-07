// ============================================================================
// PDF v4 MOTOR — RETARGET EDİLEBİLİR ZOOM ANİMATÖRÜ (Plan 04 B3)
// ----------------------------------------------------------------------------
// - Hızlı ardışık tuşlarda (Ctrl+++) animasyon kesilmez; yeni hedefe pürüzsüz
//   olarak yönlendirilir (retarget).
// - Logaritmik ölçek interpolasyonu ile algısal sabit hız hissi.
// - prefers-reduced-motion durumunda anında yerleşim.
// - Animasyon boyunca interaction "gesture" durumundadır.
// ============================================================================

import type { PdfEngine } from "./engine";
import type { DocAnchor } from "./layout";

export interface ZoomAnimatorOptions {
  reduced?: () => boolean;
  now?: () => number;
  raf?: (cb: (time: number) => void) => number;
  cancelRaf?: (id: number) => void;
}

export class ZoomAnimator {
  private rafId = 0;
  private from = 1;
  private to = 1;
  private t0 = 0;
  private dur = 160;
  private resolve: (() => void) | null = null;
  private anchor?: DocAnchor;
  private vx = 0;
  private vy = 0;

  private readonly reduced: () => boolean;
  private readonly nowFn: () => number;
  private readonly rafFn: (cb: (time: number) => void) => number;
  private readonly cancelRafFn: (id: number) => void;

  constructor(private engine: PdfEngine, opts: ZoomAnimatorOptions = {}) {
    this.reduced =
      opts.reduced ??
      (() =>
        typeof window !== "undefined" &&
        !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
    this.nowFn = opts.now ?? (() => performance.now());
    this.rafFn =
      opts.raf ??
      ((cb) => (typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame(cb) : 0));
    this.cancelRafFn =
      opts.cancelRaf ??
      ((id) => {
        if (typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(id);
      });
  }

  animate(target: number, anchor: DocAnchor, vx: number, vy: number, ms = 160): Promise<void> {
    const cur = this.engine.getScale();
    this.anchor = anchor;
    this.vx = vx;
    this.vy = vy;
    this.from = cur;
    this.to = this.engine.clampScale(target);

    // Hareket azaltma veya anında zoom
    if (this.reduced() || ms <= 0 || Math.abs(this.to - cur) < 1e-4) {
      this.stop();
      this.engine.setLiveScale(this.to, anchor, vx, vy);
      this.engine.settleScale();
      return Promise.resolve();
    }

    this.dur = ms;
    this.t0 = this.nowFn();
    this.engine.setInteraction("gesture");

    // Önceki animasyon retarget edildiği için çözümlenir
    this.resolve?.();
    const p = new Promise<void>((res) => {
      this.resolve = res;
    });

    if (!this.rafId) {
      this.rafId = this.rafFn(this.tick);
    }

    return p;
  }

  private tick = (now: number) => {
    this.rafId = 0;
    const currentTime = typeof now === "number" && now > 0 ? now : this.nowFn();
    const k = Math.min(1, Math.max(0, (currentTime - this.t0) / this.dur));
    // easeOutCubic: 1 - (1 - k)^3
    const e = 1 - Math.pow(1 - k, 3);

    // Ölçek logaritmik interpolasyon: s = from * (to / from)^e
    const ratio = this.to / (this.from || 1);
    const s = this.from * Math.pow(ratio, e);

    if (this.anchor) {
      this.engine.setLiveScale(s, this.anchor, this.vx, this.vy);
    }

    if (k < 1) {
      this.rafId = this.rafFn(this.tick);
      return;
    }

    this.engine.settleScale();
    this.engine.setInteraction("idle");
    const r = this.resolve;
    this.resolve = null;
    r?.();
  };

  stop(): void {
    if (this.rafId) {
      this.cancelRafFn(this.rafId);
      this.rafId = 0;
    }
    const r = this.resolve;
    this.resolve = null;
    r?.();
  }

  isAnimating(): boolean {
    return this.rafId !== 0;
  }
}
