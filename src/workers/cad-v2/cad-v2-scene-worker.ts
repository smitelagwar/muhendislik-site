// ============================================================================
// DWG/DXF MOTOR V2 — SCENE WORKER (DV2SCN01 PARSER & UNPACKER)
// ============================================================================
// Sözleşme: motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md (Satır 66)
// Her mesaj {protocolVersion: 1, viewSessionId, generation, sourceVersionKey, kind, payload} taşır.
// Transferable ArrayBuffer aktarımı ile sıfır kopya bellek verimliliği.

import {
  parseSceneChunk,
  SceneTag,
  SCENE_SCHEMA_VERSION,
  type RawSceneChunk,
} from "../../lib/cad-v2/protocol/binary-protocol";
import {
  refineCurveSourceIntervals,
  type CurveRefinementOptions,
  type CurveRefinementResult,
  type CurveSourceRef,
} from "../../lib/cad-v2/worker/curve-refinement";

export interface HostToWorkerMessage {
  protocolVersion: 1;
  viewSessionId: string;
  generation: number;
  sourceVersionKey: string;
  kind: "load-chunk" | "refine-curves" | "cancel" | "dispose";
  payload?: {
    chunkId: string;
    chunkBuffer?: ArrayBuffer;
    requestId?: string;
    targetErrorCssPixels?: number;
    unitsPerCssPixel?: number;
    maxTransformSingularValue?: number;
    curveDataBuffer?: ArrayBuffer;
    curveSourceRefs?: CurveSourceRef[];
    fallbackVertexCount?: number;
  };
}

export interface WorkerToHostMessage {
  protocolVersion: 1;
  viewSessionId: string;
  generation: number;
  sourceVersionKey: string;
  kind: "chunk" | "refined-curves" | "progress" | "diagnostics" | "ready" | "error" | "cancelled" | "disposed";
  payload: any;
}

export interface UnpackedSceneChunk {
  chunkId: string;
  origin: [number, number];
  xyArray: Float32Array;
  drawRunsArray: Uint32Array | null;
  trianglesArray?: Float32Array | null;
  pathDistancesArray?: Float32Array | null;
  curveDataArray?: Float32Array | null;
  meta: Record<string, any> | null;
  vertexCount: number;
}

const MAX_DECODED_ALLOCATION_BYTES = 8 * 1024 * 1024; // 8 MiB (Plan D08, D13)
const MAX_REFINEMENT_SOURCE_CACHE_BYTES = 8 * 1024 * 1024;
const refinementSourceCache = new Map<string, { curveData: Float32Array; curveSourceRefsJson: string; vertexCount: number; byteLength: number }>();
const activeWorkerSessions = new Map<string, { generation: number; sourceVersionKey: string }>();
let refinementSourceCacheBytes = 0;

function sourceCacheKey(viewSessionId: string, sourceVersionKey: string, chunkId: string): string {
  return `${viewSessionId}\u0000${sourceVersionKey}\u0000${chunkId}`;
}

function retainRefinementSources(viewSessionId: string, sourceVersionKey: string, chunk: UnpackedSceneChunk): void {
  const refs = chunk.meta?.curveSourceRefs;
  if (!chunk.curveDataArray || !Array.isArray(refs) || refs.length === 0) return;
  const refsJson = JSON.stringify(refs);
  // Account for the JS UTF-16 string storage instead of retaining a large graph of per-ref objects.
  const byteLength = chunk.curveDataArray.byteLength + refsJson.length * 2;
  const key = sourceCacheKey(viewSessionId, sourceVersionKey, chunk.chunkId);
  const previous = refinementSourceCache.get(key);
  if (previous) {
    refinementSourceCacheBytes -= previous.byteLength;
    refinementSourceCache.delete(key);
  }
  if (byteLength > MAX_REFINEMENT_SOURCE_CACHE_BYTES) return;
  while (refinementSourceCacheBytes + byteLength > MAX_REFINEMENT_SOURCE_CACHE_BYTES) {
    const oldestKey = refinementSourceCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    const oldest = refinementSourceCache.get(oldestKey)!;
    refinementSourceCacheBytes -= oldest.byteLength;
    refinementSourceCache.delete(oldestKey);
  }
  refinementSourceCache.set(key, {
    curveData: new Float32Array(chunk.curveDataArray),
    curveSourceRefsJson: refsJson,
    vertexCount: chunk.vertexCount,
    byteLength,
  });
  refinementSourceCacheBytes += byteLength;
}

function clearSessionRefinementSources(viewSessionId: string): void {
  for (const [key, entry] of refinementSourceCache) {
    if (key.startsWith(`${viewSessionId}\u0000`)) {
      refinementSourceCacheBytes -= entry.byteLength;
      refinementSourceCache.delete(key);
    }
  }
}

/**
 * Manifest v1 şema doğrulaması
 */
export function validateSceneManifest(manifest: any): boolean {
  if (!manifest || typeof manifest !== "object") return false;
  if (manifest.schemaVersion !== 1) return false;
  if (!manifest.sceneId || typeof manifest.sceneId !== "string") return false;
  if (!manifest.sourceVersionKey || !manifest.sourceSha256) return false;
  if (!Array.isArray(manifest.layouts) || manifest.layouts.length === 0) return false;
  return true;
}

/**
 * İkili sahne parçasını (DV2SCN01) doğrudan ayrıştırıp typed array'leri döner.
 * Hem Node testlerinde hem de Worker içinde çağrılabilir.
 */
export function unpackSceneChunk(chunkId: string, buffer: ArrayBuffer | Uint8Array): UnpackedSceneChunk {
  if (buffer.byteLength > MAX_DECODED_ALLOCATION_BYTES) {
    throw new Error(`[SceneWorker] Parça boyutu izin verilen sınırı aşıyor: ${buffer.byteLength} > ${MAX_DECODED_ALLOCATION_BYTES}`);
  }

  const rawChunk: RawSceneChunk = parseSceneChunk(buffer);

  if (rawChunk.schemaVersion !== SCENE_SCHEMA_VERSION) {
    throw new Error(`[SceneWorker] Desteklenmeyen şema sürümü: ${rawChunk.schemaVersion}`);
  }

  // 1. ORIGIN (Tag 2 - Float64 [Ox, Oy])
  const originSection = rawChunk.sections.get(SceneTag.ORIGIN);
  let origin: [number, number] = [0, 0];
  if (originSection && originSection.data instanceof Float64Array) {
    origin = [originSection.data[0], originSection.data[1]];
  }

  // 2. XY (Tag 3 - Float32 vertex listesi)
  const xySection = rawChunk.sections.get(SceneTag.XY);
  if (!xySection || !(xySection.data instanceof Float32Array)) {
    throw new Error(`[SceneWorker] Parçada geçerli XY vertex verisi bulunamadı (chunkId: ${chunkId})`);
  }
  const xyArray = xySection.data;
  const vertexCount = xyArray.length / 2;

  // 3. DRAW_RUNS (Tag 9 - Uint32 draw run tanımları)
  const runsSection = rawChunk.sections.get(SceneTag.DRAW_RUNS);
  let drawRunsArray: Uint32Array | null = null;
  if (runsSection && runsSection.data instanceof Uint32Array) {
    drawRunsArray = runsSection.data;
  }

  // 4. META (Tag 1 - UTF-8 JSON)
  const metaSection = rawChunk.sections.get(SceneTag.META);
  let meta: Record<string, any> | null = null;
  if (metaSection && metaSection.data instanceof Uint8Array) {
    try {
      const jsonStr = new TextDecoder().decode(metaSection.data);
      meta = JSON.parse(jsonStr);
    } catch {
      // Bozuk meta durumunda toleranslı ol
      meta = null;
    }
  }

  // 5. TRIANGLES (Tag 4 - Float32 üçgen vertexleri)
  const triSection = rawChunk.sections.get(SceneTag.TRIANGLES);
  let trianglesArray: Float32Array | null = null;
  if (triSection && triSection.data instanceof Float32Array) {
    trianglesArray = triSection.data;
  }

  // 6. PATH_DISTANCE (Tag 10 - Float32 kümülatif stroke mesafeleri)
  const pathDistSection = rawChunk.sections.get(SceneTag.PATH_DISTANCE);
  let pathDistancesArray: Float32Array | null = null;
  if (pathDistSection && pathDistSection.data instanceof Float32Array) {
    pathDistancesArray = pathDistSection.data;
  }

  const curveSection = rawChunk.sections.get(SceneTag.CURVE_DATA);
  let curveDataArray: Float32Array | null = null;
  if (curveSection && curveSection.data instanceof Float32Array) {
    curveDataArray = curveSection.data;
  }

  return {
    chunkId,
    origin,
    xyArray,
    drawRunsArray,
    trianglesArray,
    pathDistancesArray,
    curveDataArray,
    meta,
    vertexCount,
  };
}

export interface RefineChunkCurvesOptions extends Omit<CurveRefinementOptions, "curveData" | "curveSourceRefs" | "fallbackVertexCount"> {}

/** Pure fallback also used by the worker message path; no document recompile occurs. */
export function refineUnpackedChunkCurves(
  chunk: UnpackedSceneChunk,
  options: RefineChunkCurvesOptions,
): CurveRefinementResult {
  const refs = chunk.meta?.curveSourceRefs;
  if (!chunk.curveDataArray || !Array.isArray(refs) || refs.length === 0) {
    return { intervals: [], totalSegments: 0, totalOutputBytes: 0, errorBoundMet: true };
  }
  return refineCurveSourceIntervals({
    ...options,
    curveData: chunk.curveDataArray,
    curveSourceRefs: refs as CurveSourceRef[],
    fallbackVertexCount: chunk.vertexCount,
  });
}

// ============================================================================
// BROWSER WEB WORKER ENTRYPOINT
// ============================================================================
if (typeof self !== "undefined" && typeof (self as any).postMessage === "function" && typeof window === "undefined") {
  self.onmessage = (event: MessageEvent<HostToWorkerMessage>) => {
    const msg = event.data;

    // Protokol sürümü kontrolü
    if (!msg || msg.protocolVersion !== 1) {
      const errResponse: WorkerToHostMessage = {
        protocolVersion: 1,
        viewSessionId: msg?.viewSessionId || "unknown",
        generation: msg?.generation || 0,
        sourceVersionKey: msg?.sourceVersionKey || "unknown",
        kind: "error",
        payload: { error: "Geçersiz veya desteklenmeyen protocolVersion" },
      };
      self.postMessage(errResponse);
      return;
    }

    const activeSession = activeWorkerSessions.get(msg.viewSessionId);
    if (activeSession && activeSession.sourceVersionKey !== msg.sourceVersionKey) {
      self.postMessage({
        protocolVersion: 1,
        viewSessionId: msg.viewSessionId,
        generation: msg.generation,
        sourceVersionKey: msg.sourceVersionKey,
        kind: "error",
        payload: { error: "Worker oturumu farklı bir sourceVersionKey ile yeniden kullanılamaz" },
      } satisfies WorkerToHostMessage);
      return;
    }
    if (activeSession && msg.generation < activeSession.generation) return;
    activeWorkerSessions.set(msg.viewSessionId, { generation: msg.generation, sourceVersionKey: msg.sourceVersionKey });

    switch (msg.kind) {
      case "ping" as any: {
        const readyResponse: WorkerToHostMessage = {
          protocolVersion: 1,
          viewSessionId: msg.viewSessionId,
          generation: msg.generation,
          sourceVersionKey: msg.sourceVersionKey,
          kind: "ready",
          payload: { pong: true },
        };
        self.postMessage(readyResponse);
        break;
      }
      case "load-chunk": {
        try {
          if (!msg.payload?.chunkBuffer) {
            throw new Error("Eksik chunkBuffer yükü");
          }

          const unpacked = unpackSceneChunk(msg.payload.chunkId, msg.payload.chunkBuffer);
          retainRefinementSources(msg.viewSessionId, msg.sourceVersionKey, unpacked);

          const response: WorkerToHostMessage = {
            protocolVersion: 1,
            viewSessionId: msg.viewSessionId,
            generation: msg.generation,
            sourceVersionKey: msg.sourceVersionKey,
            kind: "chunk",
            payload: unpacked,
          };

          // Transferable ArrayBuffers ile sıfır kopya aktarım
          const transferables: Transferable[] = [unpacked.xyArray.buffer];
          if (unpacked.drawRunsArray && unpacked.drawRunsArray.buffer !== unpacked.xyArray.buffer) {
            transferables.push(unpacked.drawRunsArray.buffer);
          }
          if (
            unpacked.trianglesArray &&
            unpacked.trianglesArray.buffer !== unpacked.xyArray.buffer &&
            unpacked.trianglesArray.buffer !== unpacked.drawRunsArray?.buffer
          ) {
            transferables.push(unpacked.trianglesArray.buffer);
          }
          if (
            unpacked.pathDistancesArray &&
            unpacked.pathDistancesArray.buffer !== unpacked.xyArray.buffer &&
            unpacked.pathDistancesArray.buffer !== unpacked.drawRunsArray?.buffer &&
            unpacked.pathDistancesArray.buffer !== unpacked.trianglesArray?.buffer
          ) {
            transferables.push(unpacked.pathDistancesArray.buffer);
          }

          (self as any).postMessage(response, transferables);
        } catch (err: any) {
          const errResponse: WorkerToHostMessage = {
            protocolVersion: 1,
            viewSessionId: msg.viewSessionId,
            generation: msg.generation,
            sourceVersionKey: msg.sourceVersionKey,
            kind: "error",
            payload: { error: err.message || "Bilinmeyen worker ayrıştırma hatası" },
          };
          self.postMessage(errResponse);
        }
        break;
      }

      case "refine-curves": {
        try {
          const requestId = msg.payload?.requestId;
          const chunkId = msg.payload?.chunkId;
          if (typeof requestId !== "string" || !requestId || typeof chunkId !== "string" || !chunkId) {
            throw new Error("Eksik curve refinement requestId/chunkId");
          }
          const cached = refinementSourceCache.get(sourceCacheKey(msg.viewSessionId, msg.sourceVersionKey, chunkId));
          const inlineBuffer = msg.payload?.curveDataBuffer;
          const curveData = cached?.curveData ?? (inlineBuffer && inlineBuffer.byteLength <= MAX_REFINEMENT_SOURCE_CACHE_BYTES
            ? new Float32Array(inlineBuffer)
            : null);
          const curveSourceRefs = cached
            ? JSON.parse(cached.curveSourceRefsJson) as CurveSourceRef[]
            : msg.payload?.curveSourceRefs;
          const fallbackVertexCount = cached?.vertexCount ?? msg.payload?.fallbackVertexCount;
          if (!curveData || !curveSourceRefs || typeof fallbackVertexCount !== "number" || !Number.isSafeInteger(fallbackVertexCount)) {
            throw new Error(`Curve source unavailable or exceeds inline limit (${chunkId})`);
          }
          // LRU refresh; curve bytes remain capped globally to 8 MiB.
          const key = sourceCacheKey(msg.viewSessionId, msg.sourceVersionKey, chunkId);
          if (cached) {
            refinementSourceCache.delete(key);
            refinementSourceCache.set(key, cached);
          }
          const result = refineCurveSourceIntervals({
            curveData,
            curveSourceRefs,
            fallbackVertexCount,
            targetErrorCssPixels: msg.payload!.targetErrorCssPixels!,
            unitsPerCssPixel: msg.payload!.unitsPerCssPixel!,
            maxTransformSingularValue: msg.payload!.maxTransformSingularValue!,
          });
          const response: WorkerToHostMessage = {
            protocolVersion: 1,
            viewSessionId: msg.viewSessionId,
            generation: msg.generation,
            sourceVersionKey: msg.sourceVersionKey,
            kind: "refined-curves",
            payload: { requestId, chunkId, result },
          };
          const transferables = result.intervals.flatMap((interval) => interval.coordinates ? [interval.coordinates.buffer] : []);
          (self as any).postMessage(response, transferables);
        } catch (err: any) {
          const errResponse: WorkerToHostMessage = {
            protocolVersion: 1,
            viewSessionId: msg.viewSessionId,
            generation: msg.generation,
            sourceVersionKey: msg.sourceVersionKey,
            kind: "error",
            payload: { requestId: msg.payload?.requestId, error: err.message || "Curve refinement başarısız" },
          };
          self.postMessage(errResponse);
        }
        break;
      }

      case "cancel": {
        const cancelResponse: WorkerToHostMessage = {
          protocolVersion: 1,
          viewSessionId: msg.viewSessionId,
          generation: msg.generation,
          sourceVersionKey: msg.sourceVersionKey,
          kind: "cancelled",
          payload: { chunkId: msg.payload?.chunkId },
        };
        self.postMessage(cancelResponse);
        break;
      }

      case "dispose": {
        clearSessionRefinementSources(msg.viewSessionId);
        activeWorkerSessions.delete(msg.viewSessionId);
        const disposedResponse: WorkerToHostMessage = {
          protocolVersion: 1,
          viewSessionId: msg.viewSessionId,
          generation: msg.generation,
          sourceVersionKey: msg.sourceVersionKey,
          kind: "disposed",
          payload: {},
        };
        self.postMessage(disposedResponse);
        break;
      }

      default:
        break;
    }
  };
}
