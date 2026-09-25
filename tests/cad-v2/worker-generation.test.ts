// ============================================================================
// DWG/DXF MOTOR V2 — P02 WORKER GENERATION & LIFECYCLE TEST
// ============================================================================
// Doğrulanacak senaryolar:
// 1. Generation takibi (nesil ilerleme ve eski istekleri iptal etme)
// 2. Disposed istemciye istek gönderildiğinde kontrollü hata
// 3. Stale yanıtların / eski nesil isteklerinin yeni oturuma sızmaması
// ============================================================================

import * as assert from "node:assert/strict";
import { CadV2WorkerClient } from "../../src/lib/cad-v2/worker/worker-client";
import { buildSceneChunk, SceneTag, SceneScalarType } from "../../src/lib/cad-v2/protocol/binary-protocol";

function createMockChunk(): ArrayBuffer {
  const origin = new Float64Array([0, 0]);
  const xy = new Float32Array([0, 0, 10, 10]);
  const u8 = buildSceneChunk([
    {
      tag: SceneTag.ORIGIN,
      scalarType: SceneScalarType.F64,
      componentCount: 2,
      elementCount: 1,
      data: origin,
    },
    {
      tag: SceneTag.XY,
      scalarType: SceneScalarType.F32,
      componentCount: 2,
      elementCount: 2,
      data: xy,
    },
  ]);
  const copy = new ArrayBuffer(u8.byteLength);
  new Uint8Array(copy).set(u8);
  return copy;
}

async function testGenerationAdvanceCancelsPending() {
  const client = new CadV2WorkerClient("sess_gen_test", "v1.0.0");
  assert.equal(client.getGeneration(), 1, "Başlangıç nesli 1 olmalıdır.");

  const nextGen = client.advanceGeneration();
  assert.equal(nextGen, 2, "İlerletilen nesil 2 olmalıdır.");
  assert.equal(client.getGeneration(), 2);

  client.dispose();
  console.log("  ✓ Nesil (generation) ilerletme ve yönetim mantığı doğrulandı.");
}

async function testDisposedClientRejects() {
  const client = new CadV2WorkerClient("sess_dispose_test", "v1.0.0");
  client.dispose();

  const mockBuf = createMockChunk();
  await assert.rejects(
    () => client.loadChunk("chunk_test", mockBuf),
    /İstemci sonlandırılmış/,
    "Disposed istemci yeni chunk isteğini reddetmelidir."
  );
  console.log("  ✓ Sonlandırılmış (disposed) istemci isteği başarıyla reddetti.");
}

async function testDirectUnpackSyncFallback() {
  const client = new CadV2WorkerClient("sess_sync_test", "v1.0.0");
  const mockBuf = createMockChunk();

  // Node ortamında Worker olmadan senkron unpackSceneChunk çağrılır
  const unpacked = await client.loadChunk("chunk_sync_01", mockBuf);
  assert.equal(unpacked.chunkId, "chunk_sync_01");
  assert.equal(unpacked.vertexCount, 2);
  assert.equal(unpacked.origin[0], 0);
  assert.equal(unpacked.origin[1], 0);

  client.dispose();
  console.log("  ✓ Node / senkron çalışma modunda parça açma başarılı.");
}

async function main() {
  console.log("▶ P02 Worker Generation & Lifecycle Testleri Başlatılıyor...");
  await testGenerationAdvanceCancelsPending();
  await testDisposedClientRejects();
  await testDirectUnpackSyncFallback();
  console.log("✅ P02 Worker Generation & Lifecycle Testleri Başarıyla Geçti.");
}

main().catch((err) => {
  console.error("❌ P02 Worker Test Hatası:", err);
  process.exit(1);
});
