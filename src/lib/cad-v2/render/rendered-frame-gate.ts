/** Resolves recovery waiters only after a real frame, and fails them on loss/dispose. */
export class RenderedFrameGate {
  private waiters = new Set<(rendered: boolean) => void>();
  private contextLost = false;
  private disposed = false;

  public isUnavailable(): boolean {
    return this.contextLost || this.disposed;
  }

  public markContextLost(): void {
    this.contextLost = true;
    this.resolveWaiters(false);
  }

  public markContextRestored(): void {
    if (!this.disposed) this.contextLost = false;
  }

  public waitForFrame(timeoutMs = 15_000): Promise<boolean> {
    if (this.isUnavailable()) return Promise.resolve(false);
    return new Promise((resolve) => {
      let timer: ReturnType<typeof setTimeout>;
      const finish = (rendered: boolean) => {
        clearTimeout(timer);
        this.waiters.delete(finish);
        resolve(rendered);
      };
      timer = setTimeout(() => finish(false), timeoutMs);
      this.waiters.add(finish);
    });
  }

  public markFrameRendered(): void {
    if (!this.isUnavailable()) this.resolveWaiters(true);
  }

  public markFrameFailed(): void {
    this.resolveWaiters(false);
  }

  public dispose(): void {
    this.disposed = true;
    this.resolveWaiters(false);
  }

  private resolveWaiters(rendered: boolean): void {
    for (const resolve of Array.from(this.waiters)) resolve(rendered);
  }
}
