// ============================================================================
// DWG/DXF MOTOR V2 — PAINTER'S ORDER & ADJACENT RUN MERGING TEST SUITE (P07)
// ============================================================================
// Sözleşme: Fidelity v3 Planı P07
// 1. Kırmızı A -> Beyaz B -> Kırmızı C: 3 ayrı ardışık komut korunmalı (genel regroup yasak)
// 2. Stroke -> Wipeout -> Text çizim sırası
// 3. Ağdan rastgele sırayla gelen chunk'ların renderOrder ile kararlı çizimi
// ============================================================================

import assert from "node:assert";
import type { CadCanonicalDocument, CadLineEntity, CadWipeoutEntity, CadTextEntity } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { resolveDrawCommandRenderOrder } from "../../src/lib/cad-v2/render/render-order";
import { unpackSceneChunk } from "../../src/workers/cad-v2/cad-v2-scene-worker";

console.log("=== P07 PAINTER'S DRAW ORDER TESTS BAŞLIYOR ===");

// ----------------------------------------------------------------------------
// TEST 1: Kırmızı A -> Beyaz B -> Kırmızı C (Adjacent-Only Coalescing)
// ----------------------------------------------------------------------------
console.log("\n[TEST 1] Kırmızı A -> Beyaz B -> Kırmızı C ardışık komut sırası...");

const docABC: CadCanonicalDocument = {
  sourceVersionKey: "test_painter_abc",
  sourceSha256: "abc001",
  acadVersion: "AC1032",
  codepage: "ANSI_1252",
  measurement: 1,
  units: 4,
  layers: {
    "0": { id: "0", name: "0", color: { method: "aci", aci: 7 }, visible: true, frozen: false, locked: false, lineweightMm: 0, linetypeName: "CONTINUOUS" },
  },
  linetypes: {},
  textStyles: {},
  blocks: {},
  viewports: {},
  diagnostics: [],
  layouts: {
    Model: { id: "Model", name: "Model", isModelSpace: true, bbox: [0, 0, 10, 10] },
  },
  modelSpaceEntities: [
    {
      type: "LINE",
      handle: "LINE_A",
      layer: "0",
      order: BigInt(10),
      visible: true,
      start: [0, 0],
      end: [10, 0],
      color: { method: "aci", aci: 1 }, // Kırmızı A (ACI 1)
    } as CadLineEntity,
    {
      type: "LINE",
      handle: "LINE_B",
      layer: "0",
      order: BigInt(20),
      visible: true,
      start: [0, 5],
      end: [10, 5],
      color: { method: "aci", aci: 7 }, // Beyaz B (ACI 7)
    } as CadLineEntity,
    {
      type: "LINE",
      handle: "LINE_C",
      layer: "0",
      order: BigInt(30),
      visible: true,
      start: [0, 10],
      end: [10, 10],
      color: { method: "aci", aci: 1 }, // Kırmızı C (ACI 1)
    } as CadLineEntity,
  ],
};

const resABC = compileCanonicalToScene(docABC, { sceneId: "scene_abc" });
assert.strictEqual(resABC.manifest.chunks.length, 1, "Tek parça üretilmeli");

const chunkBytesABC = resABC.chunks.get(resABC.manifest.chunks[0].chunkId)!;
const unpackedABC = unpackSceneChunk(resABC.manifest.chunks[0].chunkId, chunkBytesABC);

assert(unpackedABC.meta, "Parça meta verisi bulunmalı");
const drawCommandsABC = unpackedABC.meta.drawCommands;
assert(drawCommandsABC && drawCommandsABC.length === 3, `Beklenen 3 ardışık komut, alınan: ${drawCommandsABC?.length}`);

// Sıraları ve renkleri doğrula
assert.strictEqual(drawCommandsABC[0].kind, "line");
assert.strictEqual(drawCommandsABC[0].color[0], 1, "Komut 0 Kırmızı olmalı");
assert.strictEqual(drawCommandsABC[0].color[1], 0);

assert.strictEqual(drawCommandsABC[1].kind, "line");
assert.strictEqual(drawCommandsABC[1].color[0], 1, "Komut 1 Beyaz olmalı");
assert.strictEqual(drawCommandsABC[1].color[1], 1);

assert.strictEqual(drawCommandsABC[2].kind, "line");
assert.strictEqual(drawCommandsABC[2].color[0], 1, "Komut 2 Kırmızı olmalı");
assert.strictEqual(drawCommandsABC[2].color[1], 0);

// Ardışık olan aynı renkler birleşmeli testi:
const docAdjacentSame: CadCanonicalDocument = {
  ...docABC,
  modelSpaceEntities: [
    {
      type: "LINE",
      handle: "LINE_1",
      layer: "0",
      order: BigInt(10),
      visible: true,
      start: [0, 0],
      end: [10, 0],
      color: { method: "aci", aci: 1 }, // Kırmızı 1
    } as CadLineEntity,
    {
      type: "LINE",
      handle: "LINE_2",
      layer: "0",
      order: BigInt(11),
      visible: true,
      start: [10, 0],
      end: [20, 0],
      color: { method: "aci", aci: 1 }, // Kırmızı 2 (bitişik aynı)
    } as CadLineEntity,
    {
      type: "LINE",
      handle: "LINE_3",
      layer: "0",
      order: BigInt(20),
      visible: true,
      start: [0, 5],
      end: [10, 5],
      color: { method: "aci", aci: 7 }, // Beyaz 3
    } as CadLineEntity,
  ],
};

const resAdj = compileCanonicalToScene(docAdjacentSame, { sceneId: "scene_adj" });
const unpackedAdj = unpackSceneChunk(resAdj.manifest.chunks[0].chunkId, resAdj.chunks.get(resAdj.manifest.chunks[0].chunkId)!);
const drawCommandsAdj = unpackedAdj.meta?.drawCommands;
assert.strictEqual(drawCommandsAdj?.length, 2, "Bitişik 2 kırmızı çizgi tek komutta birleşmeli; toplam 2 komut olmalı");
assert.strictEqual(drawCommandsAdj[0].vertexCount, 4, "Bitişik 2 kırmızı çizgi 4 vertex içermeli");
console.log("  ✓ Kırmızı A -> Beyaz B -> Kırmızı C ve bitişik birleştirme PASS");

// ----------------------------------------------------------------------------
// TEST 2: Stroke -> Wipeout -> Text Çizim Sırası
// ----------------------------------------------------------------------------
console.log("\n[TEST 2] Stroke -> Wipeout -> Text sıralı komutları...");

const docSWT: CadCanonicalDocument = {
  sourceVersionKey: "test_swt",
  sourceSha256: "swt001",
  acadVersion: "AC1032",
  codepage: "ANSI_1252",
  measurement: 1,
  units: 4,
  layers: {
    "0": { id: "0", name: "0", color: { method: "aci", aci: 7 }, visible: true, frozen: false, locked: false, lineweightMm: 0, linetypeName: "CONTINUOUS" },
  },
  linetypes: {},
  textStyles: {},
  blocks: {},
  viewports: {},
  diagnostics: [],
  modelSpaceEntities: [
    {
      type: "LINE",
      handle: "STROKE_1",
      layer: "0",
      order: BigInt(100),
      visible: true,
      start: [0, 0],
      end: [100, 100],
      color: { method: "rgb", rgb: [0, 1, 0] },
    } as CadLineEntity,
    {
      type: "WIPEOUT",
      handle: "WIPEOUT_1",
      layer: "0",
      order: BigInt(200),
      visible: true,
      vertices: [[10, 10], [50, 10], [50, 50], [10, 50]],
    } as CadWipeoutEntity,
    {
      type: "TEXT",
      handle: "TEXT_1",
      layer: "0",
      order: BigInt(300),
      visible: true,
      text: "HELLO",
      insertionPoint: [20, 20],
      height: 10,
      rotationRad: 0,
      widthFactor: 1,
      obliqueRad: 0,
      styleName: "STANDARD",
      color: { method: "rgb", rgb: [1, 1, 0] },
    } as CadTextEntity,
  ],
  layouts: {
    Model: { id: "Model", name: "Model", isModelSpace: true, bbox: [0, 0, 100, 100] },
  },
};

const resSWT = compileCanonicalToScene(docSWT, { sceneId: "scene_swt" });
const unpackedSWT = unpackSceneChunk(resSWT.manifest.chunks[0].chunkId, resSWT.chunks.get(resSWT.manifest.chunks[0].chunkId)!);
assert(unpackedSWT.trianglesArray && unpackedSWT.trianglesArray.length > 0, "WIPEOUT üçgen üretmeli");

const cmdsSWT = unpackedSWT.meta?.drawCommands;
assert(cmdsSWT && cmdsSWT.length >= 3, `En az 3 komut olmalı, alınan: ${cmdsSWT?.length}`);
assert.strictEqual(cmdsSWT[0].kind, "line", "İlk komut STROKE (line) olmalı");
assert.strictEqual(cmdsSWT[1].kind, "wipeout", "İkinci komut WIPEOUT olmalı");
assert.strictEqual(cmdsSWT[2].kind, "line", "Üçüncü komut TEXT vektörleri olmalı");
console.log("  ✓ Stroke -> Wipeout -> Text çizim sırası PASS");

// ----------------------------------------------------------------------------
// TEST 3: Ağdan Rastgele Gelen Chunk'ların renderOrder Kararlılığı
// ----------------------------------------------------------------------------
console.log("\n[TEST 3] Ağdan rastgele gelen chunk'ların renderOrder kararlılığı...");

// 3 parça oluşturmak için segmentler üret
const commandCount = 15_002;
const manyLines: CadLineEntity[] = Array.from({ length: commandCount }, (_, i) => ({
  type: "LINE",
  handle: `LINE_${i}`,
  layer: "0",
  order: BigInt(i * 10),
  visible: true,
  start: [i * 10, 0],
  end: [i * 10 + 5, 0],
  color: { method: "aci", aci: i % 2 === 0 ? 1 : 7 },
} as CadLineEntity));

const resMany = compileCanonicalToScene({
  ...docABC,
  sourceVersionKey: "test_painter_chunk_boundary",
  sourceSha256: "painter-chunk-boundary",
  modelSpaceEntities: manyLines,
}, { sceneId: "scene_painter_chunk_boundary", maxPrimitivesPerChunk: 1_000 });
assert.strictEqual(resMany.manifest.chunks.length, 16, "15,002 primitif 1,000 sınırında 16 chunk üretmeli");
assert.strictEqual(resolveDrawCommandRenderOrder(12_345, 20_001), 12_345, "Compiler global index'i chunk tabanlı fallback'in önüne geçmeli");
assert.strictEqual(resolveDrawCommandRenderOrder(undefined, 20_001), 20_001, "Eski chunk global index yoksa fallback kullanmalı");

const chunkRenderOrders = new Map<string, number[]>();
const arrivalOrder = [...resMany.manifest.chunks].reverse(); // Ağ chunk 2'yi önce teslim etsin.
for (const chunkInfo of arrivalOrder) {
  const unpacked = unpackSceneChunk(chunkInfo.chunkId, resMany.chunks.get(chunkInfo.chunkId)!);
  const commands = unpacked.meta?.drawCommands as Array<{ globalOrderIndex?: number }> | undefined;
  assert(commands && commands.length > 0, `${chunkInfo.chunkId} drawCommands içermeli`);
  const legacyChunkIndex = parseInt(chunkInfo.chunkId.replace(/\D+/g, "") || "0", 10);
  const legacyBaseOrder = legacyChunkIndex * 10_000;
  chunkRenderOrders.set(chunkInfo.chunkId, commands.map((command, commandIndex) =>
    resolveDrawCommandRenderOrder(command.globalOrderIndex, legacyBaseOrder + commandIndex),
  ));
}

const allRenderOrders = resMany.manifest.chunks.flatMap((chunk) => chunkRenderOrders.get(chunk.chunkId)!);
assert.strictEqual(allRenderOrders.length, commandCount, "Her kaynak LINE kendi sıralı komutunu korumalı");
for (let i = 0; i < allRenderOrders.length; i++) {
  assert.strictEqual(allRenderOrders[i], i, `Global renderOrder ${i} olmalı; alınan ${allRenderOrders[i]}`);
  if (i > 0) assert(allRenderOrders[i - 1] < allRenderOrders[i], "Chunk sınırında da renderOrder kesin artmalı");
}

console.log("  ✓ Gerçek derlenmiş chunk'larda global renderOrder ve ters ağ gelişi PASS");
console.log("\n=== TÜM P07 PAINTER ORDER TESTLERİ BAŞARIYLA GEÇTİ (PASS) ===");
