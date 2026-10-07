// ============================================================================
// PDF v4 MOTOR — TAMPON CANVAS HAVUZU (Plan 03 P3.4.3)
// ----------------------------------------------------------------------------
// Ara çizim ve kırpma (gutter) işlemlerinde tekrar eden canvas tahsisini
// ve Garbage Collection baskısını önler.
// ============================================================================

export class CanvasPool {
  private free: HTMLCanvasElement[] = [];

  constructor(private maxBytes: number = 8 * 1024 * 1024) {}

  get poolSize(): number {
    return this.free.length;
  }

  acquire(w: number, h: number): HTMLCanvasElement {
    const i = this.free.findIndex((c) => c.width === w && c.height === h);
    if (i >= 0) {
      return this.free.splice(i, 1)[0];
    }
    if (typeof document !== "undefined") {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      return c;
    }
    // SSR / test ortamı fallback'i
    return { width: w, height: h } as HTMLCanvasElement;
  }

  release(c: HTMLCanvasElement): void {
    const currentBytes = this.free.reduce((s, x) => s + x.width * x.height * 4, 0);
    const itemBytes = c.width * c.height * 4;

    if (currentBytes + itemBytes > this.maxBytes) {
      // Havuz kapasitesi doldu: Safari için belleği hemen serbest bırak
      c.width = 0;
      c.height = 0;
      return;
    }
    this.free.push(c);
  }

  clear(): void {
    for (const c of this.free) {
      c.width = 0;
      c.height = 0;
    }
    this.free = [];
  }
}
