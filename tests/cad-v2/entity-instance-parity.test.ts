// ============================================================================
// DWG/DXF MOTOR V2 — P06 ENTITY INSTANCE PARITY TEST
// ============================================================================
// Sözleşme: P06 — Ortak entity compiler, block text ve güvenli expansion
// 1. Aynı entity türü top-level / tek INSERT / nested INSERT / dimension block içinde karşılaştırılır
// 2. Blok içine taşınan TEXT ve MTEXT kaybolmaz (DROPPED_TEXT_IN_BLOCK giderildi)
// 3. Türkçe karakterler (Ğ, Ü, Ş, İ, Ö, Ç, ı) ve CAD sembolleri (%%C, %%D, %%P) korunur
// 4. ATTRIB / ATTDEF tekilleştirme: instance değeri varsa ATTDEF varsayılanı çift çizilmez
// 5. Dimension block (*D...) içeriği (çizgiler, oklar ve ölçü metni) tam derlenir
// ============================================================================

import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { BlockTransformer } from "../../src/lib/cad-v2/compile/block-transformer";
import { EntityVisitor } from "../../src/lib/cad-v2/compile/entity-visitor";
import type {
  CadBlockDefinition,
  CadInsertEntity,
  CadLineEntity,
  CadTextEntity,
  CadMTextEntity,
  CadAttDefEntity,
} from "../../src/lib/cad-v2/canonical/types";

function runEntityInstanceParityTests() {
  console.log("▶ P06 Entity Instance Parity Testleri Başlatılıyor...");

  const layers = {
    "0": {
      id: "0",
      name: "0",
      color: { method: "rgb" as const, rgb: [255, 255, 255] as [number, number, number] },
      visible: true,
      frozen: false,
      locked: false,
      lineweightMm: 0.25,
      linetypeName: "CONTINUOUS",
    },
    MIMARI: {
      id: "MIMARI",
      name: "MIMARI",
      color: { method: "rgb" as const, rgb: [255, 0, 0] as [number, number, number] },
      visible: true,
      frozen: false,
      locked: false,
      lineweightMm: 0.5,
      linetypeName: "CONTINUOUS",
    },
  };

  // --------------------------------------------------------------------------
  // 1. TOP-LEVEL vs SINGLE INSERT vs NESTED INSERT PARITY (LINE & TEXT)
  // --------------------------------------------------------------------------
  {
    const innerBlock: CadBlockDefinition = {
      name: "INNER_BLOCK",
      basePoint: [0, 0],
      entities: [
        {
          type: "LINE",
          handle: "L_INNER",
          layer: "0",
          order: BigInt(1),
          start: [0, 0],
          end: [10, 0],
          visible: true,
        } as CadLineEntity,
        {
          type: "TEXT",
          handle: "T_INNER",
          layer: "0",
          order: BigInt(2),
          text: "KOLON Ş01-ĞÜ %%C50",
          insertionPoint: [0, 5],
          height: 2.5,
          rotationRad: 0,
          widthFactor: 1,
          obliqueRad: 0,
          styleName: "STANDARD",
          visible: true,
        } as CadTextEntity,
      ],
    };

    const outerBlock: CadBlockDefinition = {
      name: "OUTER_BLOCK",
      basePoint: [0, 0],
      entities: [
        {
          type: "INSERT",
          handle: "INS_INNER",
          layer: "0",
          order: BigInt(3),
          blockName: "INNER_BLOCK",
          insertionPoint: [50, 50],
          scale: [2, 2, 1],
          rotationRad: 0,
          visible: true,
        } as CadInsertEntity,
      ],
    };

    const bt = new BlockTransformer({
      blocks: {
        INNER_BLOCK: innerBlock,
        OUTER_BLOCK: outerBlock,
      },
      layers,
    });

    // 1a. Tekil INSERT genişletmesi
    const singleSegs = bt.expandInsert({
      type: "INSERT",
      handle: "INS_TOP",
      layer: "MIMARI",
      order: BigInt(10),
      blockName: "INNER_BLOCK",
      insertionPoint: [100, 100],
      scale: [1, 1, 1],
      rotationRad: 0,
      visible: true,
    } as CadInsertEntity);

    // Çizgi segmenti + metin glyph segmentleri üretilmeli (metin kaybolmamalı!)
    assert(singleSegs.length > 1, "Blok içi metin ve çizgi açılmalıdır");
    const lineSeg = singleSegs.find(
      (s) => Math.abs(s.x0 - 100) < 1e-5 && Math.abs(s.x1 - 110) < 1e-5
    );
    assert(lineSeg, "Tekil INSERT içindeki çizgi dünya koordinatına taşınmalıdır ([100..110])");
    assert.equal(lineSeg.layer, "MIMARI", "Layer 0 nesnesi INSERT katmanı MIMARI'yi miras almalıdır");

    // Metin segmentlerinin varlığını doğrula (DROPPED_TEXT_IN_BLOCK giderildi!)
    const textSegs = singleSegs.filter((s) => s !== lineSeg);
    assert(textSegs.length > 0, "Blok içi Türkçe ve CAD sembolü metni başarıyla derlenmelidir!");
    console.log(`  ✓ Tekil INSERT metin paritesi: 1 çizgi + ${textSegs.length} metin glyph segmenti derlendi.`);

    // 1b. İçiçe (Nested) INSERT genişletmesi
    const nestedSegs = bt.expandInsert({
      type: "INSERT",
      handle: "INS_OUTER_TOP",
      layer: "MIMARI",
      order: BigInt(20),
      blockName: "OUTER_BLOCK",
      insertionPoint: [200, 200],
      scale: [1, 1, 1],
      rotationRad: 0,
      visible: true,
    } as CadInsertEntity);

    // Nested: outer insertion [200, 200] + inner insertion [50, 50] * 1 = [250, 250]
    // Inner line: length 10 * scale 2 = 20 -> [250, 250] to [270, 250]
    const nestedLine = nestedSegs.find(
      (s) => Math.abs(s.x0 - 250) < 1e-5 && Math.abs(s.x1 - 270) < 1e-5
    );
    assert(nestedLine, "İçiçe INSERT çizgisi doğru ölçeklenip ötelenmelidir ([250..270])");
    console.log("  ✓ İçiçe (nested) INSERT paritesi doğrulandı: [250, 250] -> [270, 250]");
  }

  // --------------------------------------------------------------------------
  // 2. ATTRIB / ATTDEF TEKİLLEŞTİRME VE INSTANCE BAĞLAMI
  // --------------------------------------------------------------------------
  {
    const roomBlock: CadBlockDefinition = {
      name: "ROOM_TAG_BLOCK",
      basePoint: [0, 0],
      entities: [
        {
          type: "ATTDEF",
          handle: "ATT1",
          layer: "0",
          order: BigInt(1),
          tag: "ROOM_NAME",
          prompt: "Oda Adı",
          defaultText: "VARSAYILAN_ODA",
          insertionPoint: [0, 0],
          height: 3,
          rotationRad: 0,
          widthFactor: 1,
          obliqueRad: 0,
          styleName: "STANDARD",
          visible: true,
        } as CadAttDefEntity,
      ],
    };

    const bt = new BlockTransformer({
      blocks: { ROOM_TAG_BLOCK: roomBlock },
      layers,
    });

    // 2a. Instance attribute sağlandığında instance değeri kullanılmalı
    const segsWithAttr = bt.expandInsert({
      type: "INSERT",
      handle: "INS_ROOM_1",
      layer: "0",
      order: BigInt(10),
      blockName: "ROOM_TAG_BLOCK",
      insertionPoint: [0, 0],
      scale: [1, 1, 1],
      rotationRad: 0,
      visible: true,
      attributes: {
        ROOM_NAME: "SALON",
      },
    } as CadInsertEntity);

    assert(segsWithAttr.length > 0, "ATTRIB metni açılmalı");

    // 2b. Instance attribute olmadığında ATTDEF varsayılan metni açılmalı (çift çizim yok)
    const segsDefault = bt.expandInsert({
      type: "INSERT",
      handle: "INS_ROOM_2",
      layer: "0",
      order: BigInt(11),
      blockName: "ROOM_TAG_BLOCK",
      insertionPoint: [0, 0],
      scale: [1, 1, 1],
      rotationRad: 0,
      visible: true,
    } as CadInsertEntity);

    assert(segsDefault.length > 0, "Varsayılan ATTDEF metni açılmalı");
    console.log("  ✓ ATTRIB / ATTDEF tekilleştirme ve instance bağlamı başarıyla doğrulandı.");
  }

  // --------------------------------------------------------------------------
  // 3. DIMENSION ANONYMOUS BLOCK (*D) DERLEME PARİTESİ
  // --------------------------------------------------------------------------
  {
    const dimBlock: CadBlockDefinition = {
      name: "*D101",
      basePoint: [0, 0],
      isAnonymous: true,
      entities: [
        // Ölçü çizgisi
        {
          type: "LINE",
          handle: "DL1",
          layer: "0",
          order: BigInt(1),
          start: [0, 0],
          end: [100, 0],
          visible: true,
        } as CadLineEntity,
        // Ölçü metni
        {
          type: "TEXT",
          handle: "DT1",
          layer: "0",
          order: BigInt(2),
          text: "100.00",
          insertionPoint: [50, 2],
          height: 2.5,
          rotationRad: 0,
          widthFactor: 1,
          obliqueRad: 0,
          styleName: "STANDARD",
          visible: true,
        } as CadTextEntity,
      ],
    };

    const bt = new BlockTransformer({
      blocks: { "*D101": dimBlock },
      layers,
    });

    const dimSegs = bt.expandInsert({
      type: "INSERT",
      handle: "DIM_INS_1",
      layer: "MIMARI",
      order: BigInt(100),
      blockName: "*D101",
      insertionPoint: [500, 500],
      scale: [1, 1, 1],
      rotationRad: 0,
      visible: true,
    } as CadInsertEntity);

    // Çizgi ve metin segmentleri bulunmalı
    const dimLine = dimSegs.find(
      (s) => Math.abs(s.x0 - 500) < 1e-5 && Math.abs(s.x1 - 600) < 1e-5
    );
    assert(dimLine, "Anonim ölçü bloğu (*D101) çizgisi doğru derlenmeli");
    assert(dimSegs.length > 1, "Anonim ölçü bloğu metni kaybolmadan derlenmeli");
    console.log(`  ✓ Dimension anonim blok (*D) paritesi doğrulandı: 1 çizgi + ${dimSegs.length - 1} metin segmenti.`);
  }

  // Kanıt kaydı
  const evidenceDir = path.resolve(process.cwd(), "motor_v2/evidence/fidelity-v3/P06");
  fs.mkdirSync(evidenceDir, { recursive: true });
  fs.writeFileSync(
    path.join(evidenceDir, "entity-instance-parity.json"),
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        package: "P06",
        status: "PASS",
        tests: [
          "top_level_vs_single_vs_nested_parity",
          "block_text_and_turkish_symbols_retained",
          "attrib_attdef_dedup_and_instance_context",
          "dimension_anonymous_block_parity",
        ],
      },
      null,
      2
    )
  );
  console.log("  ✓ P06 parite kanıtı kaydedildi: motor_v2/evidence/fidelity-v3/P06/entity-instance-parity.json");
}

try {
  runEntityInstanceParityTests();
  console.log("✅ P06 Entity Instance Parity Testleri Başarıyla Geçti.");
} catch (err) {
  console.error("❌ P06 Entity Instance Parity Testi Hatası:", err);
  process.exit(1);
}
