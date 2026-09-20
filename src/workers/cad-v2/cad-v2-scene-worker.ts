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

export interface HostToWorkerMessage {
  protocolVersion: 1;
  viewSessionId: string;
  generation: number;
  sourceVersionKey: string;
  kind: "load-chunk" | "cancel" | "dispose";
  payload?: {
    chunkId: string;
    chunkBuffer?: ArrayBuffer;
  };
}

export interface WorkerToHostMessage {
  protocolVersion: 1;
  viewSessionId: string;
  generation: number;
  sourceVersionKey: string;
  kind: "chunk" | "progress" | "diagnostics" | "ready" | "error" | "cancelled" | "disposed";
  payload: any;
}

export interface UnpackedSceneChunk {
  chunkId: string;
  origin: [number, number];
  xyArray: Float32Array;
  drawRunsArray: Uint32Array | null;
  meta: Record<string, any> | null;
  vertexCount: number;
}

const MAX_DECODED_ALLOCATION_BYTES = 8 * 1024 * 1024; // 8 MiB (Plan D08, D13)

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

  return {
    chunkId,
    origin,
    xyArray,
    drawRunsArray,
    meta,
    vertexCount,
  };
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
          if (unpacked.drawRunsArray) {
            transferables.push(unpacked.drawRunsArray.buffer);
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
