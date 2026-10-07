// ============================================================================
// PDF v4 MOTOR — ÖNCELİKLİ İŞ ZAMANLAYICI (Plan 03 P3.4.1)
// ----------------------------------------------------------------------------
// Kullanıcı etkileşim durumuna (idle, scrolling, gesture) göre iş başlatmayı
// ve önceliklendirmeyi (sınıf 0..5, merkeze uzaklık) yönetir.
// ============================================================================

export type Interaction = "idle" | "scrolling" | "gesture";

export interface Job {
  id: string;
  cls: number; // 0..5
  dist: number; // merkeze uzaklık (küçük = önce)
  run: (signal: AbortSignal) => Promise<void>;
}

const defaultPost = (fn: () => void) => {
  const s = typeof globalThis !== "undefined" ? (globalThis as any).scheduler : null;
  if (s?.postTask) {
    s.postTask(fn, { priority: "user-visible" }).catch(() => {});
  } else {
    setTimeout(fn, 0);
  }
};

export class Scheduler {
  private pending = new Map<string, Job>();
  private active = new Map<string, { job: Job; ac: AbortController }>();
  private state: Interaction = "idle";

  constructor(
    private maxConc: number = 2,
    private postTask: (fn: () => void) => void = defaultPost
  ) {}

  get queueDepth(): number {
    return this.pending.size;
  }

  get activeCount(): number {
    return this.active.size;
  }

  get interactionState(): Interaction {
    return this.state;
  }

  setInteraction(s: Interaction): void {
    this.state = s;
    if (s === "gesture") {
      // Gesture anında düşük öncelikli bekleyen ve aktif işleri iptal et
      this.cancelWhere((j) => j.cls >= 2);
    }
    this.pump();
  }

  enqueue(job: Job): void {
    // Aynı id varsa eskisini iptal et
    this.cancel(job.id);
    this.pending.set(job.id, job);
    this.pump();
  }

  cancel(id: string): void {
    this.pending.delete(id);
    const a = this.active.get(id);
    if (a) {
      a.ac.abort();
      this.active.delete(id);
    }
  }

  cancelWhere(pred: (j: Job) => boolean): void {
    for (const j of [...this.pending.values()]) {
      if (pred(j)) this.pending.delete(j.id);
    }
    for (const [id, a] of [...this.active.entries()]) {
      if (pred(a.job)) {
        a.ac.abort();
        this.active.delete(id);
      }
    }
  }

  clear(): void {
    this.pending.clear();
    for (const [, a] of this.active) {
      a.ac.abort();
    }
    this.active.clear();
  }

  private allowed(j: Job): boolean {
    if (this.state === "gesture") return false;
    if (this.state === "scrolling") return j.cls === 1 || j.cls === 3;
    return true;
  }

  private pump(): void {
    if (this.active.size >= this.maxConc) return;

    const candidates = [...this.pending.values()]
      .filter((j) => this.allowed(j))
      .sort((a, b) => a.cls - b.cls || a.dist - b.dist);

    const next = candidates[0];
    if (!next) return;

    this.pending.delete(next.id);
    const ac = new AbortController();
    this.active.set(next.id, { job: next, ac });

    this.postTask(() => {
      next
        .run(ac.signal)
        .catch(() => {})
        .finally(() => {
          if (this.active.get(next.id)?.ac === ac) {
            this.active.delete(next.id);
          }
          this.pump();
        });
    });

    // Boşta kapasite varsa bir sonraki işi de pompala
    this.pump();
  }
}
