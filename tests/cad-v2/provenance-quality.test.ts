// ============================================================================
// DWG/DXF MOTOR V2 — P01 PROVENANCE & QUALITY ACCOUNTING TEST
// ============================================================================
// Bu test P01 gereksinimlerini doğrular:
// 1. Boş HATCH loops içeren belgenin asla "exact" olamayacağını, "degraded" olacağını
// 2. Eksik blok veya unsupported varlık içeren belgenin "degraded" olacağını
// 3. Blok içi metin ve görünmez çocukların diagnostik kodları üreteceğini
// 4. Sabit "exact" bildiriminin engellendiğini
// 5. R001 fixture'ında mevcut kusurların kalite muhasebesine yansıdığını
// ============================================================================

import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { parseDwgToCanonical } from "../../src/lib/cad-v2/decode/dwg-adapter";
import {
  CadDiagnosticCode,
  evaluateDocumentQuality,
} from "../../src/lib/cad-v2/canonical/diagnostics";
import type { CadCanonicalDocument } from "../../src/lib/cad-v2/canonical/types";

function createCleanCanonicalDoc(): CadCanonicalDocument {
  return {
    sourceVersionKey: "synthetic-clean",
    sourceSha256: "0000000000000000000000000000000000000000000000000000000000000000",
    acadVersion: "AC1032",
    codepage: "ANSI_1254",
    units: 4, // mm
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
    blocks: {},
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
        handle: "L1",
        type: "LINE",
        layer: "0",
        visible: true,
        order: BigInt(1),
        start: [0, 0],
        end: [100, 100],
      },
    ],
    diagnostics: [],
  };
}

async function testCleanDocProducesExact() {
  const doc = createCleanCanonicalDoc();
  const compiled = compileCanonicalToScene(doc);
  assert.equal(
    compiled.manifest.qualityStatus,
    "exact",
    "Kusursuz sentetik belge 'exact' kalite durumu almalıdır."
  );
  assert.equal(
    compiled.manifest.diagnosticsSummary.diagnosticCodes.length,
    0,
    "Kusursuz sentetik belgede tanı kodu olmamalıdır."
  );
  console.log("  ✓ Temiz sentetik belge -> exact");
}

async function testEmptyHatchProducesDegraded() {
  const doc = createCleanCanonicalDoc();
  doc.modelSpaceEntities.push({
    handle: "H1",
    type: "HATCH",
    layer: "0",
    visible: true,
    order: BigInt(2),
    patternName: "SOLID",
    isSolid: true,
    loops: [], // BOŞ LOOPS!
  });

  const quality = evaluateDocumentQuality(doc);
  assert.equal(
    quality.qualityStatus,
    "degraded",
    "Boş HATCH loops içeren belge 'degraded' olmalıdır."
  );
  assert.ok(
    quality.diagnosticCodes.includes(CadDiagnosticCode.EMPTY_HATCH_LOOPS),
    "EMPTY_HATCH_LOOPS tanı kodu üretilmelidir."
  );

  const compiled = compileCanonicalToScene(doc);
  assert.equal(
    compiled.manifest.qualityStatus,
    "degraded",
    "Derleyici manifesti boş HATCH için 'degraded' üretmelidir."
  );
  assert.ok(
    compiled.manifest.diagnosticsSummary.diagnosticCodes.includes(
      CadDiagnosticCode.EMPTY_HATCH_LOOPS
    ),
    "Derleyici manifestinde EMPTY_HATCH_LOOPS bulunmalıdır."
  );
  console.log("  ✓ Boş HATCH döngüsü -> degraded (EMPTY_HATCH_LOOPS)");
}

async function testMissingBlockProducesDegraded() {
  const doc = createCleanCanonicalDoc();
  doc.modelSpaceEntities.push({
    handle: "I1",
    type: "INSERT",
    layer: "0",
    visible: true,
    order: BigInt(2),
    blockName: "NON_EXISTENT_BLOCK",
    insertionPoint: [10, 10],
    scale: [1, 1, 1],
    rotationRad: 0,
  });

  const quality = evaluateDocumentQuality(doc);
  assert.equal(
    quality.qualityStatus,
    "degraded",
    "Tanımsız bloğa referans veren belge 'degraded' olmalıdır."
  );
  assert.ok(
    quality.diagnosticCodes.includes(CadDiagnosticCode.MISSING_BLOCK_DEFINITION),
    "MISSING_BLOCK_DEFINITION tanı kodu üretilmelidir."
  );

  const compiled = compileCanonicalToScene(doc);
  assert.equal(
    compiled.manifest.qualityStatus,
    "degraded",
    "Derleyici manifesti eksik blok için 'degraded' üretmelidir."
  );
  console.log("  ✓ Eksik blok referansı -> degraded (MISSING_BLOCK_DEFINITION)");
}

async function testBlockTextLossDetected() {
  const doc = createCleanCanonicalDoc();
  doc.blocks["BLOCK_WITH_TEXT"] = {
    name: "BLOCK_WITH_TEXT",
    basePoint: [0, 0],
    entities: [
      {
        handle: "BT1",
        type: "TEXT",
        layer: "0",
        visible: true,
        order: BigInt(10),
        text: "KOLON K101",
        insertionPoint: [5, 5],
        height: 2.5,
        rotationRad: 0,
        widthFactor: 1,
        obliqueRad: 0,
        styleName: "STANDARD",
      },
    ],
  };
  doc.modelSpaceEntities.push({
    handle: "I2",
    type: "INSERT",
    layer: "0",
    visible: true,
    order: BigInt(3),
    blockName: "BLOCK_WITH_TEXT",
    insertionPoint: [20, 20],
    scale: [1, 1, 1],
    rotationRad: 0,
  });

  const quality = evaluateDocumentQuality(doc);
  assert.ok(
    quality.diagnosticCodes.includes(CadDiagnosticCode.DROPPED_TEXT_IN_BLOCK),
    "Blok içi metin tespit edilmeli ve DROPPED_TEXT_IN_BLOCK kodu üretilmelidir."
  );
  assert.equal(
    quality.qualityStatus,
    "degraded",
    "Blok içi metin kaybı riski varken exact olamaz."
  );
  console.log("  ✓ Blok içi metin kaybı -> degraded (DROPPED_TEXT_IN_BLOCK)");
}

async function testInvisibleBlockChildrenDetected() {
  const doc = createCleanCanonicalDoc();
  doc.blocks["BLOCK_WITH_HIDDEN"] = {
    name: "BLOCK_WITH_HIDDEN",
    basePoint: [0, 0],
    entities: [
      {
        handle: "BH1",
        type: "LINE",
        layer: "0",
        visible: false, // Görünmez çocuk!
        order: BigInt(11),
        start: [0, 0],
        end: [50, 50],
      },
    ],
  };
  doc.modelSpaceEntities.push({
    handle: "I3",
    type: "INSERT",
    layer: "0",
    visible: true,
    order: BigInt(4),
    blockName: "BLOCK_WITH_HIDDEN",
    insertionPoint: [0, 0],
    scale: [1, 1, 1],
    rotationRad: 0,
  });

  const quality = evaluateDocumentQuality(doc);
  assert.ok(
    quality.diagnosticCodes.includes(CadDiagnosticCode.INVISIBLE_BLOCK_CHILDREN),
    "Görünmez blok çocukları tespit edilmeli ve INVISIBLE_BLOCK_CHILDREN kodu üretilmelidir."
  );
  console.log("  ✓ Görünmez blok çocuğu -> INVISIBLE_BLOCK_CHILDREN");
}

async function testR001QualityAudit() {
  const r001Path = "eklediklerim/ornek_dosyalar/1 ve 2.kat dwg.dwg";
  if (!fs.existsSync(r001Path)) {
    console.warn("  ⚠ R001 dosyası bulunamadı, R001 audit testi atlanıyor.");
    return;
  }

  const bytes = fs.readFileSync(r001Path);
  const doc = await parseDwgToCanonical(bytes, {
    sourceVersionKey: "R001-P01-test",
  });

  const compiled = compileCanonicalToScene(doc);

  // R001 mevcut kodda blok metinleri ve görünmez çocuklar taşıdığı için
  // kalite muhasebesi bu kusurları yakalamalı ve 'exact' vermemelidir!
  assert.equal(
    compiled.manifest.qualityStatus,
    "degraded",
    "R001 mevcut kusurlarıyla asla 'exact' olmamalıdır; 'degraded' olmalıdır."
  );
  assert.ok(
    compiled.manifest.diagnosticsSummary.diagnosticCodes.length > 0,
    "R001 için somut tanı kodları listelenmelidir."
  );
  // P04: R001 HATCH sınırları artık başarıyla çıkarıldığından EMPTY_HATCH_LOOPS kalmamıştır!
  assert.equal(
    compiled.manifest.diagnosticsSummary.diagnosticCodes.includes(
      CadDiagnosticCode.EMPTY_HATCH_LOOPS
    ),
    false,
    "P04: R001 için EMPTY_HATCH_LOOPS kodu kalmamış olmalıdır (104 HATCH'in tümü boundary içerir)."
  );
  assert.ok(
    compiled.manifest.diagnosticsSummary.diagnosticCodes.includes(
      CadDiagnosticCode.INVISIBLE_BLOCK_CHILDREN
    ),
    "P04: R001 için INVISIBLE_BLOCK_CHILDREN kodu raporlanmalıdır (*U317 içindeki 144 görünmez varlık)."
  );

  console.log("  ✓ R001 gerçek dosya testi: kalite doğru biçimde 'degraded' ve tanı kodları yakalandı.");
  console.log("    Tanı kodları:", compiled.manifest.diagnosticsSummary.diagnosticCodes);
}

async function main() {
  console.log("▶ P01 Provenance & Quality Accounting Testleri Başlatılıyor...");
  await testCleanDocProducesExact();
  await testEmptyHatchProducesDegraded();
  await testMissingBlockProducesDegraded();
  await testBlockTextLossDetected();
  await testInvisibleBlockChildrenDetected();
  await testR001QualityAudit();
  console.log("✅ P01 Bütün testler başarıyla geçti.");
}

main().catch((err) => {
  console.error("❌ P01 Test Hatası:", err);
  process.exit(1);
});
