// ============================================================================
// DWG/DXF MOTOR V2 — WORKER CLIENT MANAGER
// ============================================================================
// Sözleşme: motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md (Satır 66), 29_RENDER_VE_YASAM_DONGUSU.md
// Generation takibi, iptal güvenliği, transferable buffer yönetimi ve temiz unmount.

import {
  unpackSceneChunk,
  type HostToWorkerMessage,
  type WorkerToHostMessage,
  type UnpackedSceneChunk,
} from "../../../workers/cad-v2/cad-v2-scene-worker";

export class CadV2WorkerClient {
  private viewSessionId: string;
  private sourceVersionKey: string;
  private generation = 1;
  private worker: Worker | null = null;
  private isDisposed = false;

  private isWorkerReady = false;
  private readyPromise: Promise<boolean> | null = null;
  private readyResolve: ((ready: boolean) => void) | null = null;

  private pendingRequests = new Map<
    string,
    {
      resolve: (chunk: UnpackedSceneChunk) => void;
      reject: (err: any) => void;
      generation: number;
    }
  >();

  constructor(viewSessionId: string, sourceVersionKey: string) {
    this.viewSessionId = viewSessionId;
    this.sourceVersionKey = sourceVersionKey;
    this.initWorker();
  }

  private initWorker(): void {
    if (typeof window !== "undefined" && typeof Worker !== "undefined") {
      try {
        this.readyPromise = new Promise<boolean>((resolve) => {
          this.readyResolve = resolve;
          // Worker yüklenemezse 2s içinde senkron moda düş
          setTimeout(() => {
            if (!this.isWorkerReady) {
              resolve(false);
            }
          }, 2000);
        });

        this.worker = new Worker("/cad-v2/cad-v2-scene-worker.js", { type: "module" });

        this.worker.onmessage = (event: MessageEvent<WorkerToHostMessage>) => {
          this.handleWorkerMessage(event.data);
        };

        this.worker.onerror = (err) => {
          console.warn("[CadV2WorkerClient] Worker hatası, senkron moda geçildi:", err);
          this.isWorkerReady = false;
          if (this.readyResolve) {
            this.readyResolve(false);
            this.readyResolve = null;
          }
          if (this.worker) {
            try {
              this.worker.terminate();
            } catch {}
            this.worker = null;
          }
        };

        // Ping ile worker'ın ayağa kalktığını doğrula
        this.worker.postMessage({
          protocolVersion: 1,
          viewSessionId: this.viewSessionId,
          generation: this.generation,
          sourceVersionKey: this.sourceVersionKey,
          kind: "ping" as any,
        });
      } catch (err) {
        console.warn("[CadV2WorkerClient] Web Worker başlatılamadı, senkron mod devrede:", err);
        this.worker = null;
        this.isWorkerReady = false;
        if (this.readyResolve) {
          this.readyResolve(false);
          this.readyResolve = null;
        }
      }
    }
  }

  private handleWorkerMessage(msg: WorkerToHostMessage): void {
    if (!msg || msg.protocolVersion !== 1) return;

    if (msg.kind === ("ready" as any)) {
      this.isWorkerReady = true;
      if (this.readyResolve) {
        this.readyResolve(true);
        this.readyResolve = null;
      }
      return;
    }

    // Eski nesil (generation) veya oturum mesajlarını yok say (R24/R26)
    if (msg.generation !== this.generation || msg.viewSessionId !== this.viewSessionId) {
      return;
    }

    if (msg.kind === "chunk") {
      const chunkId = msg.payload?.chunkId;
      if (chunkId && this.pendingRequests.has(chunkId)) {
        const req = this.pendingRequests.get(chunkId)!;
        this.pendingRequests.delete(chunkId);
        req.resolve(msg.payload as UnpackedSceneChunk);
      }
    } else if (msg.kind === "error") {
      const errorMsg = msg.payload?.error || "Bilinmeyen worker hatası";
      for (const [chunkId, req] of Array.from(this.pendingRequests.entries())) {
        if (req.generation === msg.generation) {
          req.reject(new Error(errorMsg));
          this.pendingRequests.delete(chunkId);
        }
      }
    }
  }

  /**
   * İkili parçayı ayrıştırır (Worker varsa arka planda transferable ile, yoksa doğrudan senkron).
   */
  public async loadChunk(chunkId: string, chunkBuffer: ArrayBuffer): Promise<UnpackedSceneChunk> {
    if (this.isDisposed) {
      throw new Error("[CadV2WorkerClient] İstemci sonlandırılmış (disposed)");
    }

    // Worker henüz başlatılıyorsa hazır olmasını bekle
    if (this.readyPromise) {
      await this.readyPromise;
    }

    // Web Worker varsa ve doğrulanmışsa arka planda çalıştır
    if (this.worker && this.isWorkerReady) {
      return new Promise<UnpackedSceneChunk>((resolve, reject) => {
        const gen = this.generation;
        let timer: any = null;

        const cleanup = () => {
          if (timer) clearTimeout(timer);
          this.pendingRequests.delete(chunkId);
        };

        this.pendingRequests.set(chunkId, {
          resolve: (chunk) => {
            cleanup();
            resolve(chunk);
          },
          reject: (err) => {
            cleanup();
            reject(err);
          },
          generation: gen,
        });

        // 15s timeout: Transferable buffer aktarıldığı için neutered olur, bu yüzden senkron kurtarma yapılamaz
        timer = setTimeout(() => {
          this.pendingRequests.delete(chunkId);
          reject(new Error(`[CadV2WorkerClient] Worker parça zaman aşımı (${chunkId}, 15s)`));
        }, 15_000);

        const msg: HostToWorkerMessage = {
          protocolVersion: 1,
          viewSessionId: this.viewSessionId,
          generation: gen,
          sourceVersionKey: this.sourceVersionKey,
          kind: "load-chunk",
          payload: {
            chunkId,
            chunkBuffer,
          },
        };

        // Transferable olarak gönder (sıfır kopya)
        try {
          this.worker!.postMessage(msg, [chunkBuffer]);
        } catch (postErr) {
          cleanup();
          reject(postErr);
        }
      });
    }

    // Node testleri veya worker desteklemeyen ortamlarda doğrudan senkron ayrıştırma
    return unpackSceneChunk(chunkId, chunkBuffer);
  }

  /**
   * Generation ilerletir ve bekleyen istekleri iptal eder (A->B->C geçişleri).
   */
  public advanceGeneration(): number {
    this.generation++;
    // Bekleyen eski istekleri reddet
    for (const [chunkId, req] of Array.from(this.pendingRequests.entries())) {
      req.reject(new Error("CANCELLED_GENERATION_ADVANCE"));
      this.pendingRequests.delete(chunkId);
    }
    return this.generation;
  }

  public getGeneration(): number {
    return this.generation;
  }

  /**
   * Temiz unmount / sonlandırma
   */
  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    this.advanceGeneration();

    if (this.worker) {
      try {
        const msg: HostToWorkerMessage = {
          protocolVersion: 1,
          viewSessionId: this.viewSessionId,
          generation: this.generation,
          sourceVersionKey: this.sourceVersionKey,
          kind: "dispose",
        };
        this.worker.postMessage(msg);
        this.worker.terminate();
      } catch {
        // İhmal et
      }
      this.worker = null;
    }
  }
}
