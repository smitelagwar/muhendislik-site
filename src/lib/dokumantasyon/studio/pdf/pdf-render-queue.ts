// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF RENDER KUYRUĞU (FAZ C)
// ============================================================================

export interface RenderTaskHandle {
  promise: Promise<unknown>;
  cancel: () => void;
}

export interface QueuedRenderJob {
  id: string; // e.g. `page-${pageNumber}`
  pageNumber: number;
  priority: number; // Küçük sayı = yüksek öncelik (0: görünür sayfa)
  renderFn: () => RenderTaskHandle;
  onSuccess?: () => void;
  onError?: (err: unknown) => void;
}

const MAX_CONCURRENT_RENDERS = 2;

class PdfRenderQueueManager {
  private activeJobs = new Map<string, { job: QueuedRenderJob; handle: RenderTaskHandle }>();
  private pendingQueue: QueuedRenderJob[] = [];
  private currentPage = 1;
  private listeners = new Set<(isIdle: boolean) => void>();

  public isIdle(): boolean {
    return this.activeJobs.size === 0 && this.pendingQueue.length === 0;
  }

  public subscribe(listener: (isIdle: boolean) => void): () => void {
    this.listeners.add(listener);
    listener(this.isIdle());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const idle = this.isIdle();
    for (const listener of this.listeners) {
      try {
        listener(idle);
      } catch {}
    }
  }

  public setCurrentPage(page: number): void {
    this.currentPage = page;
    // Bekleyen işlerin önceliklerini görünür sayfaya göre güncelle
    for (const job of this.pendingQueue) {
      job.priority = Math.abs(job.pageNumber - this.currentPage);
    }
    this.sortQueue();
    this.processNext();
  }

  public enqueue(
    id: string,
    pageNumber: number,
    renderFn: () => RenderTaskHandle,
    onSuccess?: () => void,
    onError?: (err: unknown) => void
  ): () => void {
    // Aynı sayfa için bekleyen veya devam eden eski görevi iptal et
    this.cancel(id);

    const priority = Math.abs(pageNumber - this.currentPage);
    const job: QueuedRenderJob = {
      id,
      pageNumber,
      priority,
      renderFn,
      onSuccess,
      onError,
    };

    this.pendingQueue.push(job);
    this.sortQueue();
    this.processNext();

    // İptal edici fonksiyon döndür
    return () => {
      this.cancel(id);
    };
  }

  public cancel(id: string): void {
    // 1. Bekleme kuyruğundaysa çıkar
    const pendingIdx = this.pendingQueue.findIndex((j) => j.id === id);
    if (pendingIdx !== -1) {
      this.pendingQueue.splice(pendingIdx, 1);
    }

    // 2. Aktif çiziliyorsa renderTask'i iptal et
    const active = this.activeJobs.get(id);
    if (active) {
      try {
        active.handle.cancel();
      } catch {
        // İptal hataları sessizce yutulur
      }
      this.activeJobs.delete(id);
      this.processNext();
    }
    this.notifyListeners();
  }

  public clear(): void {
    for (const [, active] of this.activeJobs) {
      try {
        active.handle.cancel();
      } catch {}
    }
    this.activeJobs.clear();
    this.pendingQueue = [];
    this.notifyListeners();
  }

  public getActiveCount(): number {
    return this.activeJobs.size;
  }

  private sortQueue(): void {
    this.pendingQueue.sort((a, b) => a.priority - b.priority);
  }

  private processNext(): void {
    this.notifyListeners();
    while (this.activeJobs.size < MAX_CONCURRENT_RENDERS && this.pendingQueue.length > 0) {
      const job = this.pendingQueue.shift();
      if (!job) break;

      try {
        const handle = job.renderFn();
        this.activeJobs.set(job.id, { job, handle });
        this.notifyListeners();

        handle.promise
          .then(() => {
            if (this.activeJobs.has(job.id)) {
              this.activeJobs.delete(job.id);
              job.onSuccess?.();
              this.processNext();
            }
          })
          .catch((err: unknown) => {
            if (this.activeJobs.has(job.id)) {
              this.activeJobs.delete(job.id);
              const errName = (err as { name?: string })?.name || "";
              if (errName === "RenderingCancelledException") {
                // İptal edilen görevlerin RenderingCancelledException'ı sessizce yutulur
              } else {
                job.onError?.(err);
              }
              this.processNext();
            }
          });
      } catch (err: unknown) {
        this.activeJobs.delete(job.id);
        const errName = (err as { name?: string })?.name || "";
        if (errName !== "RenderingCancelledException") {
          job.onError?.(err);
        }
        this.processNext();
      }
    }
    this.notifyListeners();
  }
}

export const pdfRenderQueue = new PdfRenderQueueManager();
