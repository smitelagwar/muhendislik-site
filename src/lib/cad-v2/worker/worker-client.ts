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
  type RefineRuntimeHatchOptions,
} from "../../../workers/cad-v2/cad-v2-scene-worker";
import type { CurveRefinementResult } from "./curve-refinement";
import {
  refineRuntimeHatchFill,
  type RuntimeHatchFillSource,
  type RuntimeHatchFillRefinementResult,
} from "./hatch-fill-refinement";
import {
  CAD_V2_REFINEMENT_CACHE_MISS_ERROR_PREFIX,
  CAD_V2_REFINEMENT_SOURCE_CACHE_BUDGET_BYTES,
} from "./resource-budgets";

export class CadV2WorkerClient {
  private viewSessionId: string;
  private sourceVersionKey: string;
  private generation = 1;
  private worker: Worker | null = null;
  private isDisposed = false;

  private isWorkerReady = false;
  private readyPromise: Promise<boolean> | null = null;
  private readyResolve: ((ready: boolean) => void) | null = null;
  private readyTimeout: ReturnType<typeof setTimeout> | null = null;

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
  private pendingHatchRefinements = new Map<string, {
    resolve: (result: RuntimeHatchFillRefinementResult) => void;
    reject: (err: Error) => void;
    generation: number;
    timer: ReturnType<typeof setTimeout>;
  }>();
  private workerCachedRefinementSourceChunkIds = new Set<string>();
  private workerCachedRefinementSourceBytesByChunkId = new Map<string, number>();
  private transferredChunkBuffers = new WeakSet<ArrayBuffer>();
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
          this.readyTimeout = setTimeout(() => {
            this.readyTimeout = null;
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
          if (this.readyTimeout) clearTimeout(this.readyTimeout);
          this.readyTimeout = null;
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
        if (this.readyTimeout) clearTimeout(this.readyTimeout);
        this.readyTimeout = null;
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
      if (this.readyTimeout) clearTimeout(this.readyTimeout);
      this.readyTimeout = null;
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
        const cacheStatus = msg.payload?.workerRefinementSourceCache;
        if (Array.isArray(cacheStatus?.evictedChunkIds)) {
          for (const evictedChunkId of cacheStatus.evictedChunkIds) {
            if (typeof evictedChunkId === "string") {
              this.workerCachedRefinementSourceChunkIds.delete(evictedChunkId);
              this.workerCachedRefinementSourceBytesByChunkId.delete(evictedChunkId);
            }
          }
        }
        if (cacheStatus?.retained === true) {
          const refs = msg.payload.meta?.curveSourceRefs;
          const curveData = msg.payload.curveDataArray;
          if (curveData && Array.isArray(refs)) {
            const sourceBytes = curveData.byteLength + JSON.stringify(refs).length * 2;
            this.workerCachedRefinementSourceChunkIds.add(chunkId);
            this.workerCachedRefinementSourceBytesByChunkId.set(chunkId, sourceBytes);
          } else {
            this.workerCachedRefinementSourceChunkIds.delete(chunkId);
            this.workerCachedRefinementSourceBytesByChunkId.delete(chunkId);
          }
        } else {
          this.workerCachedRefinementSourceChunkIds.delete(chunkId);
          this.workerCachedRefinementSourceBytesByChunkId.delete(chunkId);
        }
        delete msg.payload.workerRefinementSourceCache;
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
    } else if (msg.kind === "refined-hatches") {
      const requestId = msg.payload?.requestId;
      const pending = typeof requestId === "string" ? this.pendingHatchRefinements.get(requestId) : undefined;
      if (pending && pending.generation === msg.generation) {
        clearTimeout(pending.timer);
        this.pendingHatchRefinements.delete(requestId);
        pending.resolve(msg.payload.result as RuntimeHatchFillRefinementResult);
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
      const hatchRefinement = typeof requestId === "string" ? this.pendingHatchRefinements.get(requestId) : undefined;
      if (hatchRefinement && hatchRefinement.generation === msg.generation) {
        clearTimeout(hatchRefinement.timer);
        this.pendingHatchRefinements.delete(requestId);
        hatchRefinement.reject(new Error(errorMsg));
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
  public async loadChunk(
    chunkId: string,
    chunkBuffer: ArrayBuffer,
    unitsPerCssPixel?: number,
  ): Promise<UnpackedSceneChunk> {
    if (this.isDisposed) {
      throw new Error("[CadV2WorkerClient] İstemci sonlandırılmış (disposed)");
    }

    // Worker henüz başlatılıyorsa hazır olmasını bekle
    if (this.readyPromise) {
      await this.readyPromise;
    }
    if (this.isDisposed) throw new Error("[CadV2WorkerClient] İstemci sonlandırılmış (disposed)");

    // Web Worker varsa ve doğrulanmışsa arka planda çalıştır
    if (this.worker && this.isWorkerReady) {
      if (chunkBuffer.byteLength === 0 || this.transferredChunkBuffers.has(chunkBuffer)) {
        throw new Error(`[CadV2WorkerClient] Chunk buffer already transferred or detached (${chunkId})`);
      }
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
            compactPositions: true,
            ...(Number.isFinite(unitsPerCssPixel) && unitsPerCssPixel! > 0 ? { unitsPerCssPixel } : {}),
          },
        };

        // Transferable olarak gönder (sıfır kopya)
        try {
          this.worker!.postMessage(msg, [chunkBuffer]);
          this.transferredChunkBuffers.add(chunkBuffer);
        } catch (postErr) {
          cleanup();
          reject(postErr);
        }
      });
    }

    // Node testleri veya worker desteklemeyen ortamlarda doğrudan senkron ayrıştırma
    return unpackSceneChunk(chunkId, chunkBuffer, {
      compactPositions: true,
      ...(Number.isFinite(unitsPerCssPixel) && unitsPerCssPixel! > 0
        ? { overviewUnitsPerCssPixel: unitsPerCssPixel }
        : {}),
    });
  }

  /** Refines the already-unpacked source spans; it never reparses or recompiles the drawing. */
  public async refineCurves(chunk: UnpackedSceneChunk, options: RefineChunkCurvesOptions): Promise<CurveRefinementResult> {
    if (this.isDisposed) throw new Error("[CadV2WorkerClient] İstemci sonlandırılmış (disposed)");
    if (!chunk.curveDataArray || !Array.isArray(chunk.meta?.curveSourceRefs) || chunk.meta.curveSourceRefs.length === 0) {
      return { intervals: [], totalSegments: 0, totalOutputBytes: 0, errorBoundMet: true };
    }
    if (this.readyPromise) await this.readyPromise;
    if (!this.worker || !this.isWorkerReady) return refineUnpackedChunkCurves(chunk, options);

    const requestWorkerRefinement = (includeInlineSource: boolean): Promise<CurveRefinementResult> => {
      let curveDataCopy: Float32Array | null = null;
      let curveSourceRefsJson: string | undefined;
      if (includeInlineSource) {
        const refsJson = JSON.stringify(chunk.meta!.curveSourceRefs);
        const inlineSidecarBytes = chunk.curveDataArray!.byteLength + refsJson.length * 2;
        if (inlineSidecarBytes > CAD_V2_REFINEMENT_SOURCE_CACHE_BUDGET_BYTES) {
          return Promise.reject(new Error("REFINEMENT_INLINE_SOURCE_OVER_BUDGET"));
        }
        curveDataCopy = new Float32Array(chunk.curveDataArray!);
        curveSourceRefsJson = refsJson;
      }
      const curveDataBuffer = curveDataCopy?.buffer as ArrayBuffer | undefined;

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
            ...(curveDataBuffer ? { curveDataBuffer } : {}),
            ...(curveSourceRefsJson ? { curveSourceRefsJson } : {}),
            fallbackVertexCount: chunk.vertexCount,
          },
        };
        try {
          this.worker!.postMessage(message, curveDataBuffer ? [curveDataBuffer] : []);
        } catch (error) {
          clearTimeout(timer);
          this.pendingRefinements.delete(requestId);
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      });
    };

    if (this.workerCachedRefinementSourceChunkIds.has(chunk.chunkId)) {
      try {
        return await requestWorkerRefinement(false);
      } catch (error) {
        if (!(error instanceof Error) || !error.message.startsWith(CAD_V2_REFINEMENT_CACHE_MISS_ERROR_PREFIX)) throw error;
        this.workerCachedRefinementSourceChunkIds.delete(chunk.chunkId);
        this.workerCachedRefinementSourceBytesByChunkId.delete(chunk.chunkId);
      }
    }

    try {
      return await requestWorkerRefinement(true);
    } catch (error) {
      if (error instanceof Error && error.message === "REFINEMENT_INLINE_SOURCE_OVER_BUDGET") {
        return refineUnpackedChunkCurves(chunk, options);
      }
      throw error;
    }
  }

  /**
   * Returns the source bytes guaranteed to be resident for this curve request.
   * Other cached chunks are evictable before the worker handles the request. For
   * this chunk, the worker either retains the cached copy or receives this same
   * bounded inline sidecar; oversized sources fall back to the main thread.
   */
  public async getCurveRefinementWorkerSourceBytes(chunk: UnpackedSceneChunk): Promise<number> {
    if (this.isDisposed) return 0;
    if (this.readyPromise) await this.readyPromise;
    if (this.isDisposed || !this.worker || !this.isWorkerReady) return 0;

    const refs = chunk.meta?.curveSourceRefs;
    if (!chunk.curveDataArray || !Array.isArray(refs) || refs.length === 0) return 0;
    const inlineSourceBytes = chunk.curveDataArray.byteLength + JSON.stringify(refs).length * 2;
    return inlineSourceBytes <= CAD_V2_REFINEMENT_SOURCE_CACHE_BUDGET_BYTES
      ? inlineSourceBytes
      : 0;
  }

  /** Refines one bounded source-backed solid HATCH away from the rendering thread when a worker is available. */
  public async refineHatchFill(
    chunkId: string,
    source: RuntimeHatchFillSource,
    options: RefineRuntimeHatchOptions,
  ): Promise<RuntimeHatchFillRefinementResult> {
    if (this.isDisposed) throw new Error("[CadV2WorkerClient] İstemci sonlandırılmış (disposed)");
    const sourceJson = JSON.stringify(source);
    if (new TextEncoder().encode(sourceJson).byteLength > 128 * 1024) {
      return refineRuntimeHatchFill(source, { ...options, maxBoundaryElements: 0 });
    }
    if (this.readyPromise) await this.readyPromise;
    if (!this.worker || !this.isWorkerReady) return refineRuntimeHatchFill(source, options);

    const requestId = `${this.viewSessionId}:${this.generation}:${++this.refinementRequestSequence}`;
    return new Promise<RuntimeHatchFillRefinementResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingHatchRefinements.delete(requestId);
        reject(new Error(`[CadV2WorkerClient] HATCH refinement zaman aşımı (${chunkId})`));
      }, 10_000);
      this.pendingHatchRefinements.set(requestId, { resolve, reject, generation: this.generation, timer });
      const message: HostToWorkerMessage = {
        protocolVersion: 1,
        viewSessionId: this.viewSessionId,
        generation: this.generation,
        sourceVersionKey: this.sourceVersionKey,
        kind: "refine-hatches",
        payload: {
          chunkId,
          requestId,
          hatchSourceJson: sourceJson,
          targetErrorCssPixels: options.targetErrorCssPixels,
          unitsPerCssPixel: options.unitsPerCssPixel,
          maxTransformSingularValue: options.maxTransformSingularValue,
          maxCurveSegments: options.maxCurveSegments,
          maxBoundaryElements: options.maxBoundaryElements,
          maxOutputTriangles: options.maxOutputTriangles,
        },
      };
      try {
        this.worker!.postMessage(message);
      } catch (error) {
        clearTimeout(timer);
        this.pendingHatchRefinements.delete(requestId);
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
    for (const [requestId, pending] of Array.from(this.pendingHatchRefinements.entries())) {
      clearTimeout(pending.timer);
      pending.reject(new Error("CANCELLED_GENERATION_ADVANCE"));
      this.pendingHatchRefinements.delete(requestId);
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
    this.workerCachedRefinementSourceChunkIds.clear();
    this.workerCachedRefinementSourceBytesByChunkId.clear();
    if (this.readyTimeout) clearTimeout(this.readyTimeout);
    this.readyTimeout = null;
    if (this.readyResolve) {
      this.readyResolve(false);
      this.readyResolve = null;
    }

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
