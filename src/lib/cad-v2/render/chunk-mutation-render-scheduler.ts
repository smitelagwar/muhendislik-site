type TimerPort = {
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
};

/** Coalesces renderer invalidations while a large set of chunks is ingested. */
export class ChunkMutationRenderScheduler {
  private batchDepth = 0;
  private timer: unknown | null = null;
  private lastFrameRequestAt = Number.NEGATIVE_INFINITY;
  private disposed = false;

  public constructor(
    private readonly invalidateFrame: () => void,
    private readonly intervalMs = 100,
    private readonly now: () => number = () => Date.now(),
    private readonly timers: TimerPort = globalThis,
  ) {
    if (!Number.isFinite(intervalMs) || intervalMs < 0) {
      throw new Error(`Invalid chunk render interval: ${intervalMs}`);
    }
  }

  public begin(): (flush?: boolean) => void {
    if (this.disposed) return () => {};
    this.batchDepth++;
    let ended = false;
    return (flush = true) => {
      if (ended) return;
      ended = true;
      this.batchDepth = Math.max(0, this.batchDepth - 1);
      if (this.batchDepth > 0) return;
      this.clearPendingTimer();
      if (flush) this.requestFrameNow();
    };
  }

  public request(): void {
    if (this.disposed) return;
    if (this.batchDepth === 0 || this.intervalMs === 0) {
      this.requestFrameNow();
      return;
    }

    const remainingMs = this.intervalMs - (this.now() - this.lastFrameRequestAt);
    if (remainingMs <= 0) {
      this.requestFrameNow();
      return;
    }
    if (this.timer !== null) return;
    this.timer = this.timers.setTimeout(() => {
      this.timer = null;
      if (this.disposed || this.batchDepth === 0) return;
      this.requestFrameNow();
    }, remainingMs);
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.batchDepth = 0;
    this.clearPendingTimer();
  }

  private requestFrameNow(): void {
    this.lastFrameRequestAt = this.now();
    this.invalidateFrame();
  }

  private clearPendingTimer(): void {
    if (this.timer === null) return;
    this.timers.clearTimeout(this.timer);
    this.timer = null;
  }
}
