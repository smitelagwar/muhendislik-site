/** Limits the sum of byte-weighted async work without reducing small-item concurrency. */
export class WeightedByteBudget {
  private reservedBytes = 0;
  private waiters = new Set<() => void>();

  constructor(private readonly budgetBytes: number) {
    if (!Number.isSafeInteger(budgetBytes) || budgetBytes <= 0) {
      throw new Error(`Invalid byte budget: ${budgetBytes}`);
    }
  }

  public async acquire(byteLength: number, signal?: AbortSignal): Promise<(() => void) | null> {
    if (!Number.isSafeInteger(byteLength) || byteLength < 0) {
      throw new Error(`Invalid reservation size: ${byteLength}`);
    }
    if (byteLength > this.budgetBytes) {
      throw new Error(`Reservation exceeds byte budget (${byteLength}/${this.budgetBytes})`);
    }

    while (this.reservedBytes + byteLength > this.budgetBytes) {
      if (signal?.aborted) return null;
      await new Promise<void>((resolve) => {
        let active = true;
        const wake = () => {
          if (!active) return;
          active = false;
          this.waiters.delete(wake);
          signal?.removeEventListener("abort", wake);
          resolve();
        };
        this.waiters.add(wake);
        signal?.addEventListener("abort", wake, { once: true });
        if (signal?.aborted) wake();
      });
    }
    if (signal?.aborted) return null;

    this.reservedBytes += byteLength;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.reservedBytes = Math.max(0, this.reservedBytes - byteLength);
      for (const wake of Array.from(this.waiters)) wake();
    };
  }

  public getReservedBytes(): number {
    return this.reservedBytes;
  }
}
