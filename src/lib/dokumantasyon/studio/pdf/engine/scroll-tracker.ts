// ============================================================================
// PDF v4 MOTOR — KAYDIRMA HIZ TAKİBİ (Plan 04 B6)
// ----------------------------------------------------------------------------
// Kaydırma hızını (piksel/saniye) izler ve eşik aşıldığında zamanlayıcıyı
// "scrolling" durumuna geçirir; rölantide "idle" durumuna döner.
// ============================================================================

export interface ScrollTrackerOptions {
  thresholdPxPerSec?: number;
  idleMs?: number;
}

export class ScrollTracker {
  private lastY = 0;
  private lastT = 0;
  private velocity = 0;
  private idleTimer: any = null;
  private readonly threshold: number;
  private readonly idleMs: number;

  constructor(
    private el: HTMLElement,
    private onState: (s: "scrolling" | "idle") => void,
    opts: ScrollTrackerOptions = {}
  ) {
    this.threshold = opts.thresholdPxPerSec ?? 1500;
    this.idleMs = opts.idleMs ?? 80;
    this.el.addEventListener("scroll", this.onScroll, { passive: true });
  }

  private onScroll = () => {
    const now = performance.now();
    const y = this.el.scrollTop;

    if (this.lastT > 0) {
      const dt = now - this.lastT;
      if (dt > 0) {
        this.velocity = (Math.abs(y - this.lastY) / dt) * 1000;
      }
    }

    this.lastY = y;
    this.lastT = now;

    if (this.velocity > this.threshold) {
      this.onState("scrolling");
    }

    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      this.velocity = 0;
      this.lastT = 0;
      this.onState("idle");
    }, this.idleMs);
  };

  dispose(): void {
    this.el.removeEventListener("scroll", this.onScroll);
    if (this.idleTimer) clearTimeout(this.idleTimer);
  }
}
