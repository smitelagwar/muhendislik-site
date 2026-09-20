// src/lib/cad-v2/protocol/binary-protocol.ts
var SCENE_MAGIC = "DV2SCN01";
var SCENE_SCHEMA_VERSION = 1;
var HEADER_BYTE_LENGTH = 32;
var SECTION_ENTRY_BYTE_LENGTH = 32;
var MAX_CHUNK_BYTE_LENGTH = 2 * 1024 * 1024;
var MAX_DECODED_ALLOCATION_BYTES = 8 * 1024 * 1024;
var SCALAR_SIZE_MAP = {
  [1 /* U8 */]: 1,
  [2 /* U16 */]: 2,
  [3 /* U32 */]: 4,
  [4 /* F32 */]: 4,
  [5 /* F64 */]: 8
};
function parseSceneChunk(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.byteLength < HEADER_BYTE_LENGTH) {
    throw new Error(`[SceneProtocol] Ge\xE7ersiz chunk boyutu: ${bytes.byteLength} < ${HEADER_BYTE_LENGTH}`);
  }
  const magic = new TextDecoder().decode(bytes.subarray(0, 8));
  if (magic !== SCENE_MAGIC) {
    throw new Error(`[SceneProtocol] Ge\xE7ersiz magic: beklenen ${SCENE_MAGIC}, al\u0131nan: ${magic}`);
  }
  const schemaVersion = dataView.getUint32(8, true);
  if (schemaVersion !== SCENE_SCHEMA_VERSION) {
    throw new Error(`[SceneProtocol] Desteklenmeyen \u015Fema s\xFCr\xFCm\xFC: ${schemaVersion}`);
  }
  const totalByteLength = dataView.getUint32(12, true);
  if (totalByteLength !== bytes.byteLength) {
    throw new Error(
      `[SceneProtocol] Byte uzunlu\u011Fu uyu\u015Fmazl\u0131\u011F\u0131: header ${totalByteLength} !== buffer ${bytes.byteLength}`
    );
  }
  if (totalByteLength > MAX_DECODED_ALLOCATION_BYTES) {
    throw new Error(
      `[SceneProtocol] Chunk boyutu savunma s\u0131n\u0131r\u0131n\u0131 a\u015F\u0131yor: ${totalByteLength} > ${MAX_DECODED_ALLOCATION_BYTES}`
    );
  }
  const sectionCount = dataView.getUint32(16, true);
  const sectionTableOffset = dataView.getUint32(20, true);
  const headerBytes = dataView.getUint32(24, true);
  if (sectionTableOffset !== HEADER_BYTE_LENGTH || headerBytes !== HEADER_BYTE_LENGTH) {
    throw new Error(`[SceneProtocol] Ge\xE7ersiz header ofset veya boyutu`);
  }
  const tableEnd = sectionTableOffset + sectionCount * SECTION_ENTRY_BYTE_LENGTH;
  if (tableEnd > totalByteLength) {
    throw new Error(`[SceneProtocol] Section tablosu chunk s\u0131n\u0131r\u0131n\u0131 a\u015F\u0131yor: ${tableEnd} > ${totalByteLength}`);
  }
  const sections = /* @__PURE__ */ new Map();
  const seenTags = /* @__PURE__ */ new Set();
  for (let i = 0; i < sectionCount; i++) {
    const entryOffset = sectionTableOffset + i * SECTION_ENTRY_BYTE_LENGTH;
    const tag = dataView.getUint32(entryOffset, true);
    const scalarType = dataView.getUint16(entryOffset + 4, true);
    const componentCount = dataView.getUint16(entryOffset + 6, true);
    const elementCount = dataView.getUint32(entryOffset + 8, true);
    const byteOffset = dataView.getUint32(entryOffset + 12, true);
    const byteLength = dataView.getUint32(entryOffset + 16, true);
    const strideBytes = dataView.getUint32(entryOffset + 20, true);
    const flags = dataView.getUint32(entryOffset + 24, true);
    const reserved = dataView.getUint32(entryOffset + 28, true);
    if (seenTags.has(tag)) {
      throw new Error(`[SceneProtocol] Yinelenen section tag: ${tag}`);
    }
    seenTags.add(tag);
    const scalarSize = SCALAR_SIZE_MAP[scalarType];
    if (!scalarSize) {
      throw new Error(`[SceneProtocol] Bilinmeyen scalarType: ${scalarType}`);
    }
    const expectedStride = componentCount * scalarSize;
    if (strideBytes !== expectedStride) {
      throw new Error(
        `[SceneProtocol] Ge\xE7ersiz stride: tag ${tag}, beklenen ${expectedStride}, al\u0131nan ${strideBytes}`
      );
    }
    const expectedLength = elementCount * strideBytes;
    if (byteLength !== expectedLength) {
      throw new Error(
        `[SceneProtocol] Ge\xE7ersiz byteLength: tag ${tag}, beklenen ${expectedLength}, al\u0131nan ${byteLength}`
      );
    }
    if (byteOffset % 8 !== 0) {
      throw new Error(`[SceneProtocol] Section offset 8-byte hizal\u0131 de\u011Fil: tag ${tag}, offset ${byteOffset}`);
    }
    if (byteOffset < tableEnd || byteOffset + byteLength > totalByteLength) {
      throw new Error(
        `[SceneProtocol] Section aral\u0131\u011F\u0131 chunk s\u0131n\u0131r\u0131n\u0131 a\u015F\u0131yor: tag ${tag}, [${byteOffset}..${byteOffset + byteLength}]`
      );
    }
    let view;
    const subOffset = bytes.byteOffset + byteOffset;
    switch (scalarType) {
      case 1 /* U8 */:
        view = new Uint8Array(bytes.buffer, subOffset, byteLength);
        break;
      case 2 /* U16 */:
        view = new Uint16Array(bytes.buffer, subOffset, byteLength / 2);
        break;
      case 3 /* U32 */:
        view = new Uint32Array(bytes.buffer, subOffset, byteLength / 4);
        break;
      case 4 /* F32 */:
        view = new Float32Array(bytes.buffer, subOffset, byteLength / 4);
        break;
      case 5 /* F64 */:
        view = new Float64Array(bytes.buffer, subOffset, byteLength / 8);
        break;
    }
    sections.set(tag, {
      header: {
        tag,
        scalarType,
        componentCount,
        elementCount,
        byteOffset,
        byteLength,
        strideBytes,
        flags,
        reserved
      },
      data: view
    });
  }
  return {
    schemaVersion,
    totalByteLength,
    sections
  };
}

// src/workers/cad-v2/cad-v2-scene-worker.ts
var MAX_DECODED_ALLOCATION_BYTES2 = 8 * 1024 * 1024;
function validateSceneManifest(manifest) {
  if (!manifest || typeof manifest !== "object") return false;
  if (manifest.schemaVersion !== 1) return false;
  if (!manifest.sceneId || typeof manifest.sceneId !== "string") return false;
  if (!manifest.sourceVersionKey || !manifest.sourceSha256) return false;
  if (!Array.isArray(manifest.layouts) || manifest.layouts.length === 0) return false;
  return true;
}
function unpackSceneChunk(chunkId, buffer) {
  if (buffer.byteLength > MAX_DECODED_ALLOCATION_BYTES2) {
    throw new Error(`[SceneWorker] Par\xE7a boyutu izin verilen s\u0131n\u0131r\u0131 a\u015F\u0131yor: ${buffer.byteLength} > ${MAX_DECODED_ALLOCATION_BYTES2}`);
  }
  const rawChunk = parseSceneChunk(buffer);
  if (rawChunk.schemaVersion !== SCENE_SCHEMA_VERSION) {
    throw new Error(`[SceneWorker] Desteklenmeyen \u015Fema s\xFCr\xFCm\xFC: ${rawChunk.schemaVersion}`);
  }
  const originSection = rawChunk.sections.get(2 /* ORIGIN */);
  let origin = [0, 0];
  if (originSection && originSection.data instanceof Float64Array) {
    origin = [originSection.data[0], originSection.data[1]];
  }
  const xySection = rawChunk.sections.get(3 /* XY */);
  if (!xySection || !(xySection.data instanceof Float32Array)) {
    throw new Error(`[SceneWorker] Par\xE7ada ge\xE7erli XY vertex verisi bulunamad\u0131 (chunkId: ${chunkId})`);
  }
  const xyArray = xySection.data;
  const vertexCount = xyArray.length / 2;
  const runsSection = rawChunk.sections.get(9 /* DRAW_RUNS */);
  let drawRunsArray = null;
  if (runsSection && runsSection.data instanceof Uint32Array) {
    drawRunsArray = runsSection.data;
  }
  const metaSection = rawChunk.sections.get(1 /* META */);
  let meta = null;
  if (metaSection && metaSection.data instanceof Uint8Array) {
    try {
      const jsonStr = new TextDecoder().decode(metaSection.data);
      meta = JSON.parse(jsonStr);
    } catch {
      meta = null;
    }
  }
  return {
    chunkId,
    origin,
    xyArray,
    drawRunsArray,
    meta,
    vertexCount
  };
}
if (typeof self !== "undefined" && typeof self.postMessage === "function" && typeof window === "undefined") {
  self.onmessage = (event) => {
    const msg = event.data;
    if (!msg || msg.protocolVersion !== 1) {
      const errResponse = {
        protocolVersion: 1,
        viewSessionId: msg?.viewSessionId || "unknown",
        generation: msg?.generation || 0,
        sourceVersionKey: msg?.sourceVersionKey || "unknown",
        kind: "error",
        payload: { error: "Ge\xE7ersiz veya desteklenmeyen protocolVersion" }
      };
      self.postMessage(errResponse);
      return;
    }
    switch (msg.kind) {
      case "ping": {
        const readyResponse = {
          protocolVersion: 1,
          viewSessionId: msg.viewSessionId,
          generation: msg.generation,
          sourceVersionKey: msg.sourceVersionKey,
          kind: "ready",
          payload: { pong: true }
        };
        self.postMessage(readyResponse);
        break;
      }
      case "load-chunk": {
        try {
          if (!msg.payload?.chunkBuffer) {
            throw new Error("Eksik chunkBuffer y\xFCk\xFC");
          }
          const unpacked = unpackSceneChunk(msg.payload.chunkId, msg.payload.chunkBuffer);
          const response = {
            protocolVersion: 1,
            viewSessionId: msg.viewSessionId,
            generation: msg.generation,
            sourceVersionKey: msg.sourceVersionKey,
            kind: "chunk",
            payload: unpacked
          };
          const transferables = [unpacked.xyArray.buffer];
          if (unpacked.drawRunsArray && unpacked.drawRunsArray.buffer !== unpacked.xyArray.buffer) {
            transferables.push(unpacked.drawRunsArray.buffer);
          }
          self.postMessage(response, transferables);
        } catch (err) {
          const errResponse = {
            protocolVersion: 1,
            viewSessionId: msg.viewSessionId,
            generation: msg.generation,
            sourceVersionKey: msg.sourceVersionKey,
            kind: "error",
            payload: { error: err.message || "Bilinmeyen worker ayr\u0131\u015Ft\u0131rma hatas\u0131" }
          };
          self.postMessage(errResponse);
        }
        break;
      }
      case "cancel": {
        const cancelResponse = {
          protocolVersion: 1,
          viewSessionId: msg.viewSessionId,
          generation: msg.generation,
          sourceVersionKey: msg.sourceVersionKey,
          kind: "cancelled",
          payload: { chunkId: msg.payload?.chunkId }
        };
        self.postMessage(cancelResponse);
        break;
      }
      case "dispose": {
        const disposedResponse = {
          protocolVersion: 1,
          viewSessionId: msg.viewSessionId,
          generation: msg.generation,
          sourceVersionKey: msg.sourceVersionKey,
          kind: "disposed",
          payload: {}
        };
        self.postMessage(disposedResponse);
        break;
      }
      default:
        break;
    }
  };
}
export {
  unpackSceneChunk,
  validateSceneManifest
};
