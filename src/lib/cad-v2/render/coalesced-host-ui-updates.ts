type HostUiUpdate = {
  progress?: string;
  entityCount?: number;
};

type TimerPort = {
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
};

/** Coalesces high-rate chunk telemetry before publishing it to React state. */
export class CoalescedHostUiUpdates {
  private latest: HostUiUpdate = {};
  private timer: unknown | null = null;
  private disposed = false;

  public constructor(
    private readonly publish: (update: HostUiUpdate) => void,
    private readonly intervalMs = 100,
    private readonly timers: TimerPort = globalThis,
  ) {
    if (!Number.isFinite(intervalMs) || intervalMs < 0) {
      throw new Error(`Invalid host UI update interval: ${intervalMs}`);
    }
  }

  public schedule(update: HostUiUpdate): void {
    if (this.disposed) return;
    this.latest = { ...this.latest, ...update };
    if (this.timer !== null) return;
    this.timer = this.timers.setTimeout(() => {
      this.timer = null;
      this.publishLatest();
    }, this.intervalMs);
  }

  public flush(): void {
    if (this.disposed) return;
    this.clearPendingTimer();
    this.publishLatest();
  }

  public cancelPending(): void {
    this.clearPendingTimer();
    this.latest = {};
  }

  public dispose(): void {
    if (this.disposed) return;
    this.cancelPending();
    this.disposed = true;
  }

  private publishLatest(): void {
    if (this.disposed) return;
    const update = this.latest;
    this.latest = {};
    if (Object.keys(update).length > 0) this.publish(update);
  }

  private clearPendingTimer(): void {
    if (this.timer === null) return;
    this.timers.clearTimeout(this.timer);
    this.timer = null;
  }
}
