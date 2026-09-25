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
  refineUnpackedChunkCurves,
  type RefineChunkCurvesOptions,
} from "../../../workers/cad-v2/cad-v2-scene-worker";
import type { CurveRefinementResult } from "./curve-refinement";
import type { CurveSourceRef } from "./curve-refinement";

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
  private pendingRefinements = new Map<string, {
    resolve: (result: CurveRefinementResult) => void;
    reject: (err: Error) => void;
    generation: number;
    timer: ReturnType<typeof setTimeout>;
  }>();
  private refinementRequestSequence = 0;

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
    if (msg.generation !== this.generation || msg.viewSessionId !== this.viewSessionId || msg.sourceVersionKey !== this.sourceVersionKey) {
      return;
    }

    if (msg.kind === "chunk") {
      const chunkId = msg.payload?.chunkId;
      if (chunkId && this.pendingRequests.has(chunkId)) {
        const req = this.pendingRequests.get(chunkId)!;
        this.pendingRequests.delete(chunkId);
        req.resolve(msg.payload as UnpackedSceneChunk);
      }
    } else if (msg.kind === "refined-curves") {
      const requestId = msg.payload?.requestId;
      const pending = typeof requestId === "string" ? this.pendingRefinements.get(requestId) : undefined;
      if (pending && pending.generation === msg.generation) {
        clearTimeout(pending.timer);
        this.pendingRefinements.delete(requestId);
        pending.resolve(msg.payload.result as CurveRefinementResult);
      }
    } else if (msg.kind === "error") {
      const errorMsg = msg.payload?.error || "Bilinmeyen worker hatası";
      const requestId = msg.payload?.requestId;
      const refinement = typeof requestId === "string" ? this.pendingRefinements.get(requestId) : undefined;
      if (refinement && refinement.generation === msg.generation) {
        clearTimeout(refinement.timer);
        this.pendingRefinements.delete(requestId);
        refinement.reject(new Error(errorMsg));
        return;
      }
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

  /** Refines the already-unpacked source spans; it never reparses or recompiles the drawing. */
  public async refineCurves(chunk: UnpackedSceneChunk, options: RefineChunkCurvesOptions): Promise<CurveRefinementResult> {
    if (this.isDisposed) throw new Error("[CadV2WorkerClient] İstemci sonlandırılmış (disposed)");
    if (!chunk.curveDataArray || !Array.isArray(chunk.meta?.curveSourceRefs) || chunk.meta.curveSourceRefs.length === 0) {
      return { intervals: [], totalSegments: 0, totalOutputBytes: 0, errorBoundMet: true };
    }
    if (this.readyPromise) await this.readyPromise;
    if (!this.worker || !this.isWorkerReady) return refineUnpackedChunkCurves(chunk, options);

    // Worker cache LRU eviction must not turn a valid refinement into a cache-miss failure.
    // Send only the bounded analytic sidecar (never the full DWG or decoded scene) as a fallback.
    const maxInlineSidecarBytes = 8 * 1024 * 1024;
    if (chunk.curveDataArray.byteLength > maxInlineSidecarBytes) return refineUnpackedChunkCurves(chunk, options);
    const curveDataCopy = new Float32Array(chunk.curveDataArray);
    const curveRefsCopy = JSON.parse(JSON.stringify(chunk.meta!.curveSourceRefs)) as CurveSourceRef[];

    const requestId = `${this.viewSessionId}:${this.generation}:${++this.refinementRequestSequence}`;
    return new Promise<CurveRefinementResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRefinements.delete(requestId);
        reject(new Error(`[CadV2WorkerClient] Curve refinement zaman aşımı (${chunk.chunkId})`));
      }, 5000);
      this.pendingRefinements.set(requestId, { resolve, reject, generation: this.generation, timer });
      const message: HostToWorkerMessage = {
        protocolVersion: 1,
        viewSessionId: this.viewSessionId,
        generation: this.generation,
        sourceVersionKey: this.sourceVersionKey,
        kind: "refine-curves",
        payload: {
          chunkId: chunk.chunkId,
          requestId,
          targetErrorCssPixels: options.targetErrorCssPixels,
          unitsPerCssPixel: options.unitsPerCssPixel,
          maxTransformSingularValue: options.maxTransformSingularValue,
          curveDataBuffer: curveDataCopy.buffer,
          curveSourceRefs: curveRefsCopy,
          fallbackVertexCount: chunk.vertexCount,
        },
      };
      try {
        this.worker!.postMessage(message, [curveDataCopy.buffer]);
      } catch (error) {
        clearTimeout(timer);
        this.pendingRefinements.delete(requestId);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * Generation ilerletir ve bekleyen istekleri iptal eder (A->B->C geçişleri).
   */
  public advanceGeneration(): number {
    this.generation++;
    if (this.worker && this.isWorkerReady) {
      try {
        this.worker.postMessage({
          protocolVersion: 1,
          viewSessionId: this.viewSessionId,
          generation: this.generation,
          sourceVersionKey: this.sourceVersionKey,
          kind: "cancel",
        } satisfies HostToWorkerMessage);
      } catch {
        // Stale responses remain rejected locally if cancellation cannot be delivered.
      }
    }
    // Bekleyen eski istekleri reddet
    for (const [chunkId, req] of Array.from(this.pendingRequests.entries())) {
      req.reject(new Error("CANCELLED_GENERATION_ADVANCE"));
      this.pendingRequests.delete(chunkId);
    }
    for (const [requestId, pending] of Array.from(this.pendingRefinements.entries())) {
      clearTimeout(pending.timer);
      pending.reject(new Error("CANCELLED_GENERATION_ADVANCE"));
      this.pendingRefinements.delete(requestId);
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
