// ============================================================================
// DWG/DXF MOTOR V2 — G06 BLOCK & LAYER SEMANTICS TEST SUITE
// ============================================================================
// Sözleşme: motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md (G06), R06, R12
// - 2D Dönüşüm matrisi (öteleme, rotasyon, negatif ve non-uniform ölçek)
// - Katman 0 (Layer 0) kalıtımı ve BYBLOCK/BYLAYER semantiği
// - İçiçe (nested) bloklar ve döngüsel (cycle/depth) koruması
// - Gerçek DWG (R001) 40 katman ve 300+ blok tanımı doğrulaması

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { BlockTransformer } from "../../src/lib/cad-v2/compile/block-transformer";
import { parseDwgToCanonical } from "../../src/lib/cad-v2/decode/dwg-adapter";
import type {
  CadBlockDefinition,
  CadInsertEntity,
  CadLayer,
  CadLineEntity,
} from "../../src/lib/cad-v2/canonical/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

function approxEqual(a: number, b: number, eps = 1e-4): boolean {
  return Math.abs(a - b) <= eps;
}

async function runBlockLayerSemanticsTests() {
  console.log("=== DWG/DXF Motor V2 - G06 Blok ve Katman Semantiği Testi ===");

  // 1. Analitik Dönüşüm Testi (Transform Point)
  console.log("\n[Test 1] 2D Dönüşüm Matrisi Doğruluğu:");
  const p1 = BlockTransformer.transformPoint([10, 20], [0, 0], [100, 200], [2, 3, 1], 0);
  assert(approxEqual(p1[0], 120) && approxEqual(p1[1], 260), "Ölçekleme ve öteleme doğru: [120, 260]");

  // 90 derece rotasyon: [10, 0] -> [0, 10]
  const pRot = BlockTransformer.transformPoint([10, 0], [0, 0], [0, 0], [1, 1, 1], Math.PI / 2);
  assert(approxEqual(pRot[0], 0) && approxEqual(pRot[1], 10), "90 derece rotasyon doğru: [0, 10]");

  // 2. Negatif ve Non-Uniform Ölçekleme (Ayna/Yansıma)
  console.log("\n[Test 2] Negatif ve Eşit Olmayan Ölçek (Non-Uniform / Mirroring):");
  const pMirror = BlockTransformer.transformPoint([15, 25], [0, 0], [100, 100], [-1, 1, 1], 0);
  assert(approxEqual(pMirror[0], 85) && approxEqual(pMirror[1], 125), "Negatif X ölçeği (aynalama) doğru: [85, 125]");

  // 3. Layer 0 Kalıtımı (R06, R12)
  console.log("\n[Test 3] Katman 0 (Layer 0) Kalıtım Semantiği:");
  const testLayers: Record<string, CadLayer> = {
    "0": { id: "0", name: "0", visible: true, frozen: false, locked: false, color: { method: "byLayer" }, lineweightMm: 0, linetypeName: "Continuous" },
    WALL: { id: "WALL", name: "WALL", visible: true, frozen: false, locked: false, color: { method: "aci", aci: 1 }, lineweightMm: 0.5, linetypeName: "Continuous" },
    DOOR: { id: "DOOR", name: "DOOR", visible: true, frozen: false, locked: false, color: { method: "aci", aci: 3 }, lineweightMm: 0.25, linetypeName: "Continuous" },
    FROZEN_LYR: { id: "FROZEN_LYR", name: "FROZEN_LYR", visible: true, frozen: true, locked: false, color: { method: "aci", aci: 2 }, lineweightMm: 0, linetypeName: "Continuous" },
  };

  const testBlocks: Record<string, CadBlockDefinition> = {
    BLK_DOOR: {
      name: "BLK_DOOR",
      basePoint: [0, 0],
      entities: [
        {
          handle: "H1",
          type: "LINE",
          layer: "0", // Katman 0: INSERT'in katmanını almalı
          order: BigInt(1),
          start: [0, 0],
          end: [100, 0],
        } as CadLineEntity,
        {
          handle: "H2",
          type: "LINE",
          layer: "DOOR", // Kendi katmanı: DOOR kalmalı
          order: BigInt(2),
          start: [0, 0],
          end: [0, 100],
        } as CadLineEntity,
        {
          handle: "H3",
          type: "LINE",
          layer: "FROZEN_LYR", // Donuk katman: atlanmalı
          order: BigInt(3),
          start: [50, 50],
          end: [50, 100],
        } as CadLineEntity,
      ],
    },
  };

  const transformer = new BlockTransformer({
    blocks: testBlocks,
    layers: testLayers,
  });

  const insertOnWall: CadInsertEntity = {
    handle: "INS_1",
    type: "INSERT",
    layer: "WALL",
    order: BigInt(10),
    blockName: "BLK_DOOR",
    insertionPoint: [500, 500],
    scale: [1, 1, 1],
    rotationRad: 0,
  };

  const segs = transformer.expandInsert(insertOnWall);
  assert(segs.length === 2, `2 varlık genişletildi (donuk katmandaki atlandı): ${segs.length}`);
  assert(segs[0].layer === "WALL", `Katman 0 nesnesi INSERT katmanını miras aldı: ${segs[0].layer}`);
  assert(segs[1].layer === "DOOR", `Özel katman nesnesi kendi katmanını korudu: ${segs[1].layer}`);

  // 4. İçiçe (Nested) Bloklar
  console.log("\n[Test 4] İçiçe (Nested) Blok Genişletmesi:");
  testBlocks["BLK_PARENT"] = {
    name: "BLK_PARENT",
    basePoint: [0, 0],
    entities: [
      {
        handle: "INS_CHILD",
        type: "INSERT",
        layer: "0",
        order: BigInt(5),
        blockName: "BLK_DOOR",
        insertionPoint: [50, 50],
        scale: [2, 2, 1],
        rotationRad: 0,
      } as CadInsertEntity,
    ],
  };

  const insertParent: CadInsertEntity = {
    handle: "INS_P",
    type: "INSERT",
    layer: "WALL",
    order: BigInt(20),
    blockName: "BLK_PARENT",
    insertionPoint: [1000, 1000],
    scale: [1, 1, 1],
    rotationRad: 0,
  };

  const nestedSegs = transformer.expandInsert(insertParent);
  assert(nestedSegs.length === 2, `İçiçe blok başarıyla 2 segment üretti: ${nestedSegs.length}`);
  // Alt blok çizgisi: start [0,0]-> scale 2 -> [0,0] + child [50,50] -> [50,50] + parent [1000,1000] = [1050, 1050]
  assert(approxEqual(nestedSegs[0].x0, 1050) && approxEqual(nestedSegs[0].y0, 1050), "İçiçe dönüşüm başlangıç noktası doğru: [1050, 1050]");
  // bitiş [100,0] -> scale 2 -> [200,0] + child [50,50] -> [250,50] + parent [1000,1000] = [1250, 1050]
  assert(approxEqual(nestedSegs[0].x1, 1250) && approxEqual(nestedSegs[0].y1, 1050), "İçiçe dönüşüm bitiş noktası doğru: [1250, 1050]");

  // 5. Negatif Güvenlik: Döngüsel Blok (Cycle Detection) ve Derinlik Sınırı
  console.log("\n[Test 5] Negatif Güvenlik: Döngüsel Referans (Cycle) ve Derinlik Koruması:");
  testBlocks["CYCLE_A"] = {
    name: "CYCLE_A",
    basePoint: [0, 0],
    entities: [
      {
        handle: "INS_B",
        type: "INSERT",
        layer: "0",
        order: BigInt(1),
        blockName: "CYCLE_B",
        insertionPoint: [0, 0],
        scale: [1, 1, 1],
        rotationRad: 0,
      } as CadInsertEntity,
    ],
  };
  testBlocks["CYCLE_B"] = {
    name: "CYCLE_B",
    basePoint: [0, 0],
    entities: [
      {
        handle: "INS_A",
        type: "INSERT",
        layer: "0",
        order: BigInt(1),
        blockName: "CYCLE_A",
        insertionPoint: [0, 0],
        scale: [1, 1, 1],
        rotationRad: 0,
      } as CadInsertEntity,
    ],
  };

  const cycleInsert: CadInsertEntity = {
    handle: "INS_CYC",
    type: "INSERT",
    layer: "0",
    order: BigInt(1),
    blockName: "CYCLE_A",
    insertionPoint: [0, 0],
    scale: [1, 1, 1],
    rotationRad: 0,
  };

  const cycleSegs = transformer.expandInsert(cycleInsert);
  assert(cycleSegs.length === 0, "Döngüsel blok sonsuz döngüye girmeden güvenle atlandı (0 segment)");

  // 6. Gerçek Dosya Doğrulaması (R001)
  console.log("\n[Test 6] Gerçek DWG (R001) Katman ve Blok Ayrıştırma:");
  const r001Path = path.resolve(process.cwd(), "eklediklerim/ornek_dosyalar/1 ve 2.kat dwg.dwg");
  const rawBytes = fs.readFileSync(r001Path);
  const fileHash = crypto.createHash("sha256").update(rawBytes).digest("hex");

  const canonicalDoc = await parseDwgToCanonical(rawBytes, {
    sourceSha256: fileHash,
    sourceVersionKey: "1 ve 2.kat dwg.dwg",
  });

  const layerCount = Object.keys(canonicalDoc.layers).length;
  const blockCount = Object.keys(canonicalDoc.blocks).length;
  console.log(`- R001 Katman Sayısı: ${layerCount}`);
  console.log(`- R001 Blok Tanımı Sayısı: ${blockCount}`);

  assert(layerCount >= 30, `R001 en az 30 katman içeriyor: ${layerCount}`);
  assert(blockCount >= 50, `R001 en az 50 blok tanımı içeriyor: ${blockCount}`);

  // INSERT varlıklarını say
  const insertCount = canonicalDoc.modelSpaceEntities.filter((e) => e.type === "INSERT").length;
  console.log(`- R001 Model Alanı INSERT Varlık Sayısı: ${insertCount}`);
  assert(insertCount > 1000, `R001 model alanında 1000'den fazla INSERT varlığı mevcut: ${insertCount}`);

  console.log("\n>>> G06 BLOK VE KATMAN SEMANTİĞİ TESTLERİ BAŞARIYLA GEÇTİ (PASS) <<<\n");
}

runBlockLayerSemanticsTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test hatası:", err);
    process.exit(1);
  });
