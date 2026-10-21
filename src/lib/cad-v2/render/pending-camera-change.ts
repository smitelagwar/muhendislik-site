/** Keeps only the latest camera state until the next renderer frame. */
export class PendingCameraChange<T> {
  private pending: T | null = null;

  enqueue(change: T): void {
    this.pending = change;
  }

  flush(apply: (change: T) => void): boolean {
    const change = this.pending;
    if (change === null) return false;
    this.pending = null;
    apply(change);
    return true;
  }
}
