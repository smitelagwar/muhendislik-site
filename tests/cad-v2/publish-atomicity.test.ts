// ============================================================================
// DWG/DXF MOTOR V2 — P03 PUBLISH ATOMICITY & STAGING TEST SUITE
// ============================================================================
// Sözleşme: Fidelity v3 Planı P03, motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md

import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import * as os from "node:os";
import { CadV2DurableService } from "../../src/lib/cad-v2/service/cad-v2-durable-service";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import type { CadCanonicalDocument } from "../../src/lib/cad-v2/canonical/types";

async function runPublishAtomicityTests() {
  console.log("▶ P03 Publish Atomicity Testleri Başlatılıyor...");

  const testStorageDir = path.join(os.tmpdir(), `cad-v2-p03-test-${Date.now()}`);
  fs.mkdirSync(testStorageDir, { recursive: true });

  const service = new CadV2DurableService(testStorageDir);

  const sampleDxf = `0
SECTION
2
ENTITIES
0
LINE
8
İÇ DUVARLAR
10
0.0
20
0.0
11
100.0
21
100.0
0
LINE
8
ÖN CEPHE KAPLAMA
10
100.0
20
100.0
11
200.0
21
200.0
0
ENDSEC
0
EOF
`;
  const dxfBuffer = Buffer.from(sampleDxf, "utf-8");
  const fileId = "file_atomic_001";
  const revKey = "rev_atomic_v1";

  // Test 1: Başarılı Hazırlama ve Atomik Staging
  const prepRes = await service.prepare({
    fileId,
    clientRequestId: crypto.randomUUID(),
    expectedSourceVersionKey: revKey,
    sourceBuffer: dxfBuffer,
    fileName: "sample.dxf",
  });

  assert.equal(prepRes.status, "ready");
  assert.ok(prepRes.sceneId, "sceneId üretilmelidir.");
  const sceneId = prepRes.sceneId;

  // Staging klasörünün temizlendiğini doğrula
  const stagingBaseDir = path.join(testStorageDir, "staging");
  if (fs.existsSync(stagingBaseDir)) {
    const remainingStagedJobs = fs.readdirSync(stagingBaseDir);
    assert.equal(
      remainingStagedJobs.length,
      0,
      "Başarılı publish sonrasında staging klasörü temizlenmelidir."
    );
  }
  console.log("  ✓ Başarılı staging ve atomik publish doğrulandı.");

  // Test 2: Disk Kalıcılığı ve Soğuk Süreç (Cold Process) Erişimi
  const coldService = new CadV2DurableService(testStorageDir);
  const coldManifest = coldService.getManifest(sceneId);
  assert.ok(coldManifest, "Soğuk süreç manifesti diskten okuyabilmelidir.");
  assert.equal(coldManifest.sceneId, sceneId);
  assert.equal(coldManifest.sourceVersionKey, revKey);

  // Parça erişimi
  const chunkId = coldManifest.chunks[0].chunkId;
  const coldChunk = coldService.getChunk(sceneId, chunkId);
  assert.ok(coldChunk, "Soğuk süreç parça ikili verisini diskten okuyabilmelidir.");
  assert.equal(coldChunk.byteLength, coldManifest.chunks[0].byteLength);

  // Metadata ve Index erişimi
  const meta = await coldService.getSceneMetadata(sceneId, "meta_model_001");
  assert.ok(meta, "Soğuk süreç metadata dosyasını okuyabilmelidir.");
  assert.equal(meta.metadataId, "meta_model_001");

  const idx = await coldService.getSceneIndex(sceneId, "idx_001");
  assert.ok(idx, "Soğuk süreç index dosyasını okuyabilmelidir.");
  assert.equal(idx.indexId, "idx_001");
  console.log("  ✓ Soğuk süreç (disk kalıcılığı, metadata ve index) doğrulandı.");

  // Test 3: Türkçe Çok Baytlı Katman Adları ve Buffer.byteLength Doğruluğu
  const canonicalWithTurkishLayers: CadCanonicalDocument = {
    sourceVersionKey: "rev_turkish_test",
    sourceSha256: "aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899",
    units: 4,
    layers: {
      "İÇ DUVARLAR": {
        id: "İÇ DUVARLAR",
        name: "İÇ DUVARLAR",
        visible: true,
        frozen: false,
        locked: false,
        color: { method: "aci", aci: 1 },
        lineweightMm: 0.25,
        linetypeName: "Continuous",
      },
      "ÖN CEPHE KAPLAMA": {
        id: "ÖN CEPHE KAPLAMA",
        name: "ÖN CEPHE KAPLAMA",
        visible: true,
        frozen: false,
        locked: false,
        color: { method: "aci", aci: 2 },
        lineweightMm: 0.25,
        linetypeName: "Continuous",
      },
      "ZEMİN KATI ÇİZGİLERİ": {
        id: "ZEMİN KATI ÇİZGİLERİ",
        name: "ZEMİN KATI ÇİZGİLERİ",
        visible: true,
        frozen: false,
        locked: false,
        color: { method: "aci", aci: 3 },
        lineweightMm: 0.25,
        linetypeName: "Continuous",
      },
      "ŞAFT VE ASANSÖR BOŞLUĞU": {
        id: "ŞAFT VE ASANSÖR BOŞLUĞU",
        name: "ŞAFT VE ASANSÖR BOŞLUĞU",
        visible: true,
        frozen: false,
        locked: false,
        color: { method: "aci", aci: 4 },
        lineweightMm: 0.25,
        linetypeName: "Continuous",
      },
    },
    acadVersion: "AC1027",
    codepage: "ANSI_1254",
    measurement: 1,
    linetypes: {},
    textStyles: {},
    blocks: {},
    layouts: {},
    viewports: {},
    diagnostics: [],
    modelSpaceEntities: [
      {
        type: "LINE",
        handle: "T01",
        layer: "İÇ DUVARLAR",
        start: [0, 0],
        end: [100, 100],
        order: BigInt(1),
      },
    ],
  };

  const compiledTurkish = compileCanonicalToScene(canonicalWithTurkishLayers);
  const metaTurkishPage = compiledTurkish.manifest.metadataPages[0];
  const metaTurkishContent = compiledTurkish.metadataFiles?.get(metaTurkishPage.metadataId);
  assert.ok(metaTurkishContent, "Metadata içeriği üretilmiş olmalıdır.");

  const exactByteLength = Buffer.byteLength(metaTurkishContent, "utf8");
  assert.equal(
    metaTurkishPage.byteLength,
    exactByteLength,
    "Manifest metadata byteLength tam olarak Buffer.byteLength(content, 'utf8') değerine eşit olmalıdır."
  );
  console.log("  ✓ Çok baytlı UTF-8 Buffer.byteLength doğrulaması başarılı.");

  // Test 4: Fencing İhlalinde veya İptal Edilen İşte Staging Temizliği
  const fencedJob: any = {
    jobId: `job_fenced_${Date.now()}`,
    fileId: "fenced_file",
    sourceVersionKey: "v_fenced_1",
    clientRequestId: crypto.randomUUID(),
    status: "running",
    phase: "source",
    fence: 99, // Hatalı fence
    attempt: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await service.executeJobSync(fencedJob, dxfBuffer, "fenced.dxf");
  assert.equal(fencedJob.status, "failed");
  assert.match(fencedJob.error, /fencing token ihlali/i);

  const fencedStagingDir = path.join(testStorageDir, "staging", fencedJob.jobId);
  assert.equal(
    fs.existsSync(fencedStagingDir),
    false,
    "Fencing ihlalinde staging klasörü güvenle silinmelidir."
  );
  console.log("  ✓ Fencing ihlalinde atomik iptal ve staging temizliği doğrulandı.");

  // Temizlik
  try {
    fs.rmSync(testStorageDir, { recursive: true, force: true });
  } catch {}

  console.log("✅ P03 Publish Atomicity Testleri Başarıyla Geçti.\n");
}

runPublishAtomicityTests().catch((err) => {
  console.error("P03 Publish Atomicity Test Hatası:", err);
  process.exit(1);
});
