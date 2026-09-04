// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — UPLOAD QUEUE MANAGER (CONCURRENCY 3)
// ============================================================================

export type UploadQueueStatus =
  | "queued"
  | "uploading"
  | "finalizing"
  | "success"
  | "failed"
  | "cancelled";

export interface UploadQueueItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: UploadQueueStatus;
  errorMessage?: string;
  file?: File;
  targetFolderId?: string | null;
  abortController?: AbortController;
}

export type QueueListener = (queue: UploadQueueItem[]) => void;

export class UploadQueueManager {
  private queue: UploadQueueItem[] = [];
  private concurrency: number = 3;
  private listeners: Set<QueueListener> = new Set();
  private activeCount: number = 0;
  private uploadExecutor?: (item: UploadQueueItem, onProgress: (pct: number) => void) => Promise<void>;

  constructor(concurrency = 3) {
    this.concurrency = concurrency;
  }

  public setExecutor(executor: (item: UploadQueueItem, onProgress: (pct: number) => void) => Promise<void>) {
    this.uploadExecutor = executor;
  }

  public subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    listener([...this.queue]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const snapshot = [...this.queue];
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  public getQueue(): UploadQueueItem[] {
    return [...this.queue];
  }

  public enqueue(files: Array<{ file: File; targetFolderId?: string | null; id?: string }>): string[] {
    const addedIds: string[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < files.length; i++) {
      const entry = files[i];
      const id = entry.id || `upload_${timestamp}_${i}_${entry.file.name}`;
      addedIds.push(id);

      this.queue.push({
        id,
        name: entry.file.name,
        size: entry.file.size,
        progress: 0,
        status: "queued",
        file: entry.file,
        targetFolderId: entry.targetFolderId,
        abortController: new AbortController(),
      });
    }

    this.notify();
    this.processNext();
    return addedIds;
  }

  public cancel(id: string) {
    const item = this.queue.find((q) => q.id === id);
    if (!item) return;

    if (item.status === "uploading" || item.status === "queued" || item.status === "finalizing") {
      item.abortController?.abort();
      item.status = "cancelled";
      item.errorMessage = "İptal edildi";
      this.notify();
    }
  }

  public retryFailed(): string[] {
    const failedItems = this.queue.filter((q) => q.status === "failed" || q.status === "cancelled");
    const retriedIds: string[] = [];

    for (const item of failedItems) {
      item.status = "queued";
      item.progress = 0;
      item.errorMessage = undefined;
      item.abortController = new AbortController();
      retriedIds.push(item.id);
    }

    this.notify();
    this.processNext();
    return retriedIds;
  }

  public retryItem(id: string): boolean {
    const item = this.queue.find((q) => q.id === id);
    if (!item || (item.status !== "failed" && item.status !== "cancelled")) return false;

    item.status = "queued";
    item.progress = 0;
    item.errorMessage = undefined;
    item.abortController = new AbortController();

    this.notify();
    this.processNext();
    return true;
  }

  public clearFinished() {
    this.queue = this.queue.filter((q) => q.status === "queued" || q.status === "uploading" || q.status === "finalizing");
    this.notify();
  }

  private async processNext() {
    if (!this.uploadExecutor) return;

    while (this.activeCount < this.concurrency) {
      const nextItem = this.queue.find((q) => q.status === "queued");
      if (!nextItem) break;

      this.activeCount++;
      nextItem.status = "uploading";
      nextItem.progress = 10;
      this.notify();

      // Launch upload asynchronously without blocking the loop
      this.executeUpload(nextItem);
    }
  }

  private async executeUpload(item: UploadQueueItem) {
    if (!this.uploadExecutor) {
      this.activeCount--;
      return;
    }

    try {
      await this.uploadExecutor(item, (pct: number) => {
        item.progress = Math.min(95, Math.max(10, Math.round(pct)));
        if (pct >= 90 && item.status === "uploading") {
          item.status = "finalizing";
        }
        this.notify();
      });

      item.status = "success";
      item.progress = 100;
    } catch (err: unknown) {
      if (item.abortController?.signal.aborted) {
        item.status = "cancelled";
        item.errorMessage = "Yükleme iptal edildi";
      } else {
        item.status = "failed";
        item.errorMessage = err instanceof Error ? err.message : "Yükleme başarısız oldu";
      }
    } finally {
      this.activeCount--;
      this.notify();
      this.processNext();
    }
  }
}

// Global persistent instance so navigation between folders never destroys ongoing queue
export const globalUploadQueue = new UploadQueueManager(3);
