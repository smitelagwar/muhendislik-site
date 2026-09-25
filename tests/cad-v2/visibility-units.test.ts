// ============================================================================
// DWG/DXF MOTOR V2 — P04 VISIBILITY & UNITS TEST
// ============================================================================
// Sözleşme: P04 — Visibility, hidden block children exclusion, INSUNITS
// 1. *U317 bloğunda 144 görünmez ve 13 görünür varlık doğrulanır
// 2. BlockTransformer expandInsert görünmez çocukları genişletmez
// 3. Görünmez INSERT (parent) genişletilmez ([] döner)
// 4. Units 0 (unitless) korunur; keyfî default 5'e dönüştürülmez
// ============================================================================

import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseDwgToCanonical } from "../../src/lib/cad-v2/decode/dwg-adapter";
import { BlockTransformer } from "../../src/lib/cad-v2/compile/block-transformer";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import type { CadCanonicalDocument, CadInsertEntity } from "../../src/lib/cad-v2/canonical/types";

async function testU317BlockVisibility() {
  const r001Path = path.resolve(process.cwd(), "eklediklerim/ornek_dosyalar/1 ve 2.kat dwg.dwg");
  if (!fs.existsSync(r001Path)) {
    console.warn("  ⚠ R001 fixture bulunamadı, test atlanıyor.");
    return;
  }

  const bytes = fs.readFileSync(r001Path);
  const doc = await parseDwgToCanonical(bytes, {
    sourceVersionKey: "R001-P04-visibility",
  });

  const u317 = doc.blocks["*U317"];
  assert.ok(u317 != null, "*U317 blok tanımı bulunmalıdır.");
  assert.equal(
    u317.entities.length,
    157,
    `*U317 içinde 157 varlık bulunmalıdır, bulunan: ${u317.entities.length}`
  );

  const visibleEntities = u317.entities.filter((e) => e.visible !== false);
  const invisibleEntities = u317.entities.filter((e) => e.visible === false);

  assert.equal(
    visibleEntities.length,
    13,
    `*U317 içinde tam olarak 13 görünür varlık olmalıdır, bulunan: ${visibleEntities.length}`
  );
  assert.equal(
    invisibleEntities.length,
    144,
    `*U317 içinde tam olarak 144 görünmez varlık olmalıdır, bulunan: ${invisibleEntities.length}`
  );

  console.log(`  ✓ *U317 görünürlük doğrulaması: 157 toplam, 13 görünür, 144 görünmez.`);

  // BlockTransformer ile genişletme testi
  const transformer = new BlockTransformer({
    blocks: doc.blocks,
    layers: doc.layers,
  });

  const testInsert: CadInsertEntity = {
    handle: "TEST_INSERT_U317",
    type: "INSERT",
    layer: "0",
    order: BigInt(9999),
    blockName: "*U317",
    insertionPoint: [0, 0],
    scale: [1, 1, 1],
    rotationRad: 0,
    visible: true,
  };

  const expandedSegments = transformer.expandInsert(testInsert);
  // Yalnız 13 görünür varlıktan türetilen segmentler üretilmelidir!
  // 144 görünmez varlık (özellikle devasa BBox oluşturan HATCH/çizgiler) atlanmalıdır.
  assert.ok(
    expandedSegments.length > 0,
    "Görünür 13 varlıktan çizim segmentleri üretilmelidir."
  );

  // Görünmez varlıkların BBox'ı kirletmediğini doğrula
  let minX = Infinity, maxX = -Infinity;
  for (const seg of expandedSegments) {
    minX = Math.min(minX, seg.x0, seg.x1);
    maxX = Math.max(maxX, seg.x0, seg.x1);
  }

  // Eğer 144 görünmez varlık dahil edilseydi BBox -13988'e kadar uzayacaktı!
  assert.ok(
    minX > -5000,
    `Görünmez çocuklar dışlandığında *U317 minX=-13988 olmamalıdır! Ölçülen: ${minX}`
  );

  console.log(`  ✓ *U317 genişletme testi: 144 görünmez çocuk başarıyla dışlandı, minX=${minX.toFixed(1)}.`);
}

async function testParentInsertInvisibleExclusion() {
  const syntheticDoc: CadCanonicalDocument = {
    sourceVersionKey: "synthetic-invis-parent",
    sourceSha256: "0000000000000000000000000000000000000000000000000000000000000000",
    acadVersion: "AC1032",
    codepage: "ANSI_1254",
    units: 0,
    measurement: 1,
    layers: {
      "0": {
        id: "0",
        name: "0",
        visible: true,
        frozen: false,
        locked: false,
        color: { method: "aci", aci: 7 },
        lineweightMm: 0,
        linetypeName: "Continuous",
      },
    },
    linetypes: {},
    textStyles: {},
    blocks: {
      TEST_BLOCK: {
        name: "TEST_BLOCK",
        basePoint: [0, 0],
        entities: [
          {
            handle: "L1",
            type: "LINE",
            layer: "0",
            visible: true,
            order: BigInt(1),
            start: [0, 0],
            end: [100, 100],
          },
        ],
      },
    },
    layouts: {
      Model: {
        id: "Model",
        name: "Model",
        isModelSpace: true,
        bbox: [0, 0, 100, 100],
      },
    },
    viewports: {},
    modelSpaceEntities: [
      {
        handle: "I_INVIS",
        type: "INSERT",
        layer: "0",
        order: BigInt(2),
        blockName: "TEST_BLOCK",
        insertionPoint: [0, 0],
        scale: [1, 1, 1],
        rotationRad: 0,
        visible: false, // Görünmez INSERT!
      },
    ],
    diagnostics: [],
  };

  const transformer = new BlockTransformer({
    blocks: syntheticDoc.blocks,
    layers: syntheticDoc.layers,
  });

  const segs = transformer.expandInsert(syntheticDoc.modelSpaceEntities[0] as CadInsertEntity);
  assert.equal(
    segs.length,
    0,
    "visible=false olan parent INSERT hiçbir segment üretmemelidir."
  );

  const compiled = compileCanonicalToScene(syntheticDoc);
  assert.equal(
    compiled.chunks.size,
    1,
    "Sahne 1 chunk üretmeli"
  );
  console.log("  ✓ Görünmez parent INSERT dışlama testi başarılı.");
}

async function testUnitlessAndMappingPreservation() {
  // Units 0 (unitless) testi
  const doc0: CadCanonicalDocument = {
    sourceVersionKey: "synthetic-units-0",
    sourceSha256: "0000000000000000000000000000000000000000000000000000000000000000",
    acadVersion: "AC1032",
    codepage: "ANSI_1254",
    units: 0, // UNITLESS!
    measurement: 0,
    layers: {},
    linetypes: {},
    textStyles: {},
    blocks: {},
    layouts: {},
    viewports: {},
    modelSpaceEntities: [],
    diagnostics: [],
  };

  const compiled0 = compileCanonicalToScene(doc0);
  assert.equal(
    compiled0.manifest.layouts[0]?.units,
    0,
    "INSUNITS=0 (Unitless) derleyicide 0 olarak kalmalıdır; 5'e dönüştürülmemelidir!"
  );

  // Units 6 (meters) testi
  const doc6: CadCanonicalDocument = {
    ...doc0,
    sourceVersionKey: "synthetic-units-6",
    units: 6,
  };
  const compiled6 = compileCanonicalToScene(doc6);
  assert.equal(
    compiled6.manifest.layouts[0]?.units,
    6,
    "INSUNITS=6 (Meters) derleyicide 6 olarak kalmalıdır."
  );

  console.log("  ✓ INSUNITS unitless (0) ve meters (6) korunma testi başarılı.");
}

async function main() {
  console.log("▶ P04 Visibility & Units Testi Başlatılıyor...");
  await testU317BlockVisibility();
  await testParentInsertInvisibleExclusion();
  await testUnitlessAndMappingPreservation();
  console.log("✅ P04 Visibility & Units Testi Başarıyla Geçti.");
}

main().catch((err) => {
  console.error("❌ P04 Visibility & Units Test Hatası:", err);
  process.exit(1);
});
