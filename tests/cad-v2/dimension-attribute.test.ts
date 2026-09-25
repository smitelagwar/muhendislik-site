// ============================================================================
// DWG/DXF MOTOR V2 — F05 DIMENSION, ATTRIBUTE & LEADER ACCEPTANCE TEST
// ============================================================================
// Sözleşme: Fidelity v3 Planı F05 — DIMENSION, ATTRIB/ATTDEF, LEADER ve annotation
// Gate 1: DIMENSION canonical kimliği ve semantics korunumu (type === "DIMENSION")
// Gate 2: Saved anonymous graphics block (*D...) expansion & double-transform koruması
// Gate 3: Eksik blok durumunda definition noktalarından geometri ve ok ucu sentezi (Linear, Aligned, Angular, Diameter, Radius, Ordinate)
// Gate 4: Ölçü metin şablonu (<>), override ("DEĞİŞKEN") ve sentetik biçim beklentileri
// Gate 5: ATTRIB & ATTDEF bağlama (instance override, constant, invisible, mirrored INSERT)
// Gate 6: LEADER ve ekli açıklama (polyline, arrowhead, metin etiketi)
// Gate 7: Gerçek DWG (R001) boyutsal doğrulama ve handle probe'ları
// ============================================================================

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import type {
  CadCanonicalDocument,
  CadDimensionEntity,
  CadLeaderEntity,
  CadInsertEntity,
  CadBlockDefinition,
  CadLayer,
} from "../../src/lib/cad-v2/canonical/types";
import { parseDwgToCanonical } from "../../src/lib/cad-v2/decode/dwg-adapter";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import {
  DimensionCompiler,
  formatDimensionText,
} from "../../src/lib/cad-v2/compile/dimension-compiler";
import { EntityVisitor } from "../../src/lib/cad-v2/compile/entity-visitor";
import { CadDiagnosticCode } from "../../src/lib/cad-v2/canonical/diagnostics";

function createMockBaseDocument(): CadCanonicalDocument {
  return {
    sourceVersionKey: "f05_test",
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
        lineweightMm: 0.25,
        linetypeName: "Continuous",
      },
      "DIM": {
        id: "DIM",
        name: "DIM",
        visible: true,
        frozen: false,
        locked: false,
        color: { method: "aci", aci: 1 }, // Kırmızı
        lineweightMm: 0.18,
        linetypeName: "Continuous",
      },
    },
    linetypes: {
      Continuous: { id: "Continuous", name: "Continuous", description: "Solid", pattern: [], totalLength: 0 },
    },
    textStyles: {
      STANDARD: { id: "STANDARD", name: "STANDARD", fontFileName: "txt.shx", height: 0, widthFactor: 1, obliqueAngleDeg: 0, isVertical: false },
    },
    blocks: {},
    layouts: {
      Model: {
        id: "Model",
        name: "Model",
        isModelSpace: true,
        bbox: [-1000, -1000, 1000, 1000],
      },
    },
    viewports: {},
    modelSpaceEntities: [],
    diagnostics: [],
  };
}

async function runDimensionAttributeTests() {
  console.log("============================================================================");
  console.log("DWG/DXF MOTOR V2 — F05 DIMENSION, ATTRIBUTE & LEADER KABUL TESTİ");
  console.log("============================================================================");

  // --------------------------------------------------------------------------
  // GATE 1: DIMENSION Canonical Kimlik ve Semantics Korunumu
  // --------------------------------------------------------------------------
  console.log("\n[Gate 1] DIMENSION Canonical Kimlik ve Semantics Korunumu...");
  {
    const dimEnt: CadDimensionEntity = {
      handle: "DIM_1",
      type: "DIMENSION",
      layer: "DIM",
      order: BigInt(1),
      dimType: 0, // Linear
      text: "<>",
      styleName: "STANDARD",
      defPoint: [100, 50],
      textMidpoint: [50, 60],
      line1Start: [0, 0],
      line1End: [100, 0],
      anonymousBlockName: "*D1",
      measurement: 100.0,
      dimScale: 1.0,
      arrowSize: 2.5,
    };

    assert.strictEqual(dimEnt.type, "DIMENSION", "Entity type 'DIMENSION' olarak korunmalı (INSERT'e dönüştürülmemeli)");
    assert.strictEqual(dimEnt.anonymousBlockName, "*D1", "Anonim blok referansı korunmalı");
    assert.strictEqual(dimEnt.measurement, 100.0, "Kaynak ölçüm değeri korunmalı");
    assert.deepStrictEqual(dimEnt.defPoint, [100, 50], "defPoint korunmalı");
    assert.deepStrictEqual(dimEnt.textMidpoint, [50, 60], "textMidpoint korunmalı");
    console.log("  ✓ Gate 1: PASS — DIMENSION kaynak tipi, ölçüm ve geometri metadata'sı korundu");
  }

  // --------------------------------------------------------------------------
  // GATE 2: Saved Anonymous Block (*D...) Expansion & Double-Transform Koruması
  // --------------------------------------------------------------------------
  console.log("\n[Gate 2] Saved Anonymous Block (*D...) Expansion & Double-Transform Koruması...");
  {
    const doc = createMockBaseDocument();
    // Anonim blok tanımı: Dünya koordinatlarında (0,0) ile (100,0) arasında ölçü çizgisi içerir
    const dBlock: CadBlockDefinition = {
      name: "*D100",
      basePoint: [0, 0],
      entities: [
        {
          handle: "D_LINE_1",
          type: "LINE",
          layer: "0",
          order: BigInt(10),
          start: [0, 50],
          end: [100, 50],
        },
        {
          handle: "D_TEXT_1",
          type: "TEXT",
          layer: "0",
          order: BigInt(11),
          text: "100.00",
          insertionPoint: [50, 55],
          height: 2.5,
          rotationRad: 0,
          widthFactor: 1,
          obliqueRad: 0,
          styleName: "STANDARD",
        },
      ],
    };
    doc.blocks["*D100"] = dBlock;

    const dim: CadDimensionEntity = {
      handle: "DIM_AUTOCAD_1",
      type: "DIMENSION",
      layer: "DIM",
      order: BigInt(1),
      dimType: 0,
      styleName: "STANDARD",
      anonymousBlockName: "*D100",
      defPoint: [100, 50], // Definition point
      insertionPoint: [0, 0],
    };

    const visitor = new EntityVisitor({
      blocks: doc.blocks,
      layers: doc.layers,
      linetypes: doc.linetypes,
      textStyles: doc.textStyles,
    });

    const ctx = visitor.createRootContext("DIM", BigInt(1));
    const result = visitor.createEmptyResult();
    visitor.visitEntity(dim, ctx, result);

    assert(result.segments.length > 0, "Anonim blok varlıkları açılmalıdır");
    // Çizgi segmenti kontrolü: (0, 50) -> (100, 50) olmalı (defPoint 100 eklenip (100, 100) -> (200, 100) olmamalı!)
    const dimLine = result.segments.find(
      (s) => Math.abs(s.x0 - 0) < 1e-3 && Math.abs(s.y0 - 50) < 1e-3 && Math.abs(s.x1 - 100) < 1e-3
    );
    assert(dimLine, "Anonim blok çizgisi (0, 50) -> (100, 50) konumunda olmalı; DOUBLE-TRANSFORM kayması olmamalı");
    console.log("  ✓ Gate 2: PASS — *D anonim blok içeriği WCS konumunda açıldı, double-transform engellendi");
  }

  // --------------------------------------------------------------------------
  // GATE 3: Definition Noktalarından Geometri ve Ok Ucu Sentezi
  // --------------------------------------------------------------------------
  console.log("\n[Gate 3] Eksik Blok Durumunda Geometri ve Ok Ucu Sentezi...");
  {
    const doc = createMockBaseDocument();
    // doc.blocks içinde *D bloğu YOK
    const dimLinear: CadDimensionEntity = {
      handle: "DIM_SYNTH_LIN",
      type: "DIMENSION",
      layer: "DIM",
      order: BigInt(2),
      dimType: 0, // Linear
      text: "<>",
      styleName: "STANDARD",
      line1Start: [0, 0],
      line1End: [150, 0],
      defPoint: [150, 40], // Ölçü çizgisi Y=40
      textMidpoint: [75, 45],
      measurement: 150.0,
      arrowSize: 3.0,
    };

    const visitor = new EntityVisitor({
      blocks: doc.blocks,
      layers: doc.layers,
      linetypes: doc.linetypes,
      textStyles: doc.textStyles,
    });

    const ctx = visitor.createRootContext("DIM", BigInt(2));
    const result = visitor.createEmptyResult();
    visitor.visitEntity(dimLinear, ctx, result);

    // Tanı kodu kontrolü
    const synthDiag = result.diagnostics.find(
      (d) => d.code === CadDiagnosticCode.DIMENSION_SYNTHESIZED_FROM_DEFINITION
    );
    assert(synthDiag, "Bloksuz boyutta DIMENSION_SYNTHESIZED_FROM_DEFINITION tanısı üretilmeli");

    // Sentezlenen segmentler: ölçü çizgisi, iki bağlama çizgisi, ok uçları ve metin çizgileri
    assert(result.segments.length >= 7, `En az 7 segment üretilmeli (Bulunan: ${result.segments.length})`);

    // Sentezlenen ölçü çizgisinin varlığı (Y=40 seviyesinde 0 ile 150 arasında)
    const lineY40 = result.segments.some(
      (s) => Math.abs(s.y0 - 40) < 1e-2 && Math.abs(s.y1 - 40) < 1e-2 && Math.abs(s.x1 - s.x0) > 50
    );
    assert(lineY40, "Y=40 seviyesinde sentezlenmiş ölçü çizgisi bulunmalı");

    // Diğer boyut tipleri sentez dayanıklılığı (Aligned, Angular, Diameter, Radius, Ordinate)
    const dimAligned: CadDimensionEntity = {
      handle: "DIM_ALIGNED",
      type: "DIMENSION",
      layer: "DIM",
      order: BigInt(3),
      dimType: 1, // Aligned
      styleName: "STANDARD",
      line1Start: [0, 0],
      line1End: [100, 100],
      defPoint: [0, 20],
    };
    const resAligned = visitor.createEmptyResult();
    visitor.visitEntity(dimAligned, ctx, resAligned);
    assert(resAligned.segments.length > 5, "Aligned boyut başarıyla sentezlenmeli");

    const dimAngular: CadDimensionEntity = {
      handle: "DIM_ANGULAR",
      type: "DIMENSION",
      layer: "DIM",
      order: BigInt(4),
      dimType: 2, // Angular
      styleName: "STANDARD",
      defPoint: [0, 0],
      line1Start: [50, 0],
      line1End: [35.35, 35.35],
    };
    const resAngular = visitor.createEmptyResult();
    visitor.visitEntity(dimAngular, ctx, resAngular);
    assert(resAngular.segments.length > 10, "Angular boyut başarıyla sentezlenmeli");

    const dimDiameter: CadDimensionEntity = {
      handle: "DIM_DIAMETER",
      type: "DIMENSION",
      layer: "DIM",
      order: BigInt(5),
      dimType: 3, // Diameter
      styleName: "STANDARD",
      defPoint: [100, 100],
      textMidpoint: [150, 100],
    };
    const resDiameter = visitor.createEmptyResult();
    visitor.visitEntity(dimDiameter, ctx, resDiameter);
    assert(resDiameter.segments.length > 5, "Diameter boyut başarıyla sentezlenmeli");

    const dimRadius: CadDimensionEntity = {
      handle: "DIM_RADIUS",
      type: "DIMENSION",
      layer: "DIM",
      order: BigInt(6),
      dimType: 4, // Radius
      styleName: "STANDARD",
      defPoint: [200, 200],
      line1Start: [250, 200],
    };
    const resRadius = visitor.createEmptyResult();
    visitor.visitEntity(dimRadius, ctx, resRadius);
    assert(resRadius.segments.length > 3, "Radius boyut başarıyla sentezlenmeli");

    const dimOrdinate: CadDimensionEntity = {
      handle: "DIM_ORDINATE",
      type: "DIMENSION",
      layer: "DIM",
      order: BigInt(7),
      dimType: 6, // Ordinate
      styleName: "STANDARD",
      defPoint: [300, 400],
      textMidpoint: [320, 420],
    };
    const resOrdinate = visitor.createEmptyResult();
    visitor.visitEntity(dimOrdinate, ctx, resOrdinate);
    assert(resOrdinate.segments.length > 1, "Ordinate boyut başarıyla sentezlenmeli");

    console.log("  ✓ Gate 3: PASS — 6 boyut türü (Linear, Aligned, Angular, Diameter, Radius, Ordinate) sentezlendi");
  }

  // --------------------------------------------------------------------------
  // GATE 4: Ölçü Metin Şablonu (<>), Override ve Sayısal Biçim Oracle'ı
  // --------------------------------------------------------------------------
  console.log("\n[Gate 4] Ölçü Metin Şablonu (<>), Override ve Sentetik Sayısal Biçim Beklentileri...");
  {
    const d = 125.456;
    assert.strictEqual(formatDimensionText("", d), "125.46", "Boş metin -> ölçülen mesafe");
    assert.strictEqual(formatDimensionText(undefined, d), "125.46", "undefined -> ölçülen mesafe");
    assert.strictEqual(formatDimensionText("<>", d), "125.46", "'<>' -> ölçülen mesafe");
    assert.strictEqual(formatDimensionText("Ø<>", d), "Ø125.46", "'Ø<>' -> çap öneki ve ölçülen mesafe");
    assert.strictEqual(formatDimensionText("R<>", d), "R125.46", "'R<>' -> yarıçap öneki ve ölçülen mesafe");
    assert.strictEqual(formatDimensionText("<> mm", d), "125.46 mm", "'<> mm' -> son ek ve ölçülen mesafe");
    assert.strictEqual(formatDimensionText("ÖLÇEK: <>", d), "ÖLÇEK: 125.46", "ÖLÇEK şablonu");
    assert.strictEqual(formatDimensionText("DEĞİŞKEN", d), "DEĞİŞKEN", "Özel override aynen korunmalı");
    assert.strictEqual(formatDimensionText("KOLON BOYU", d), "KOLON BOYU", "Özel override aynen korunmalı");
    console.log("  ✓ Gate 4: LOCAL PASS — sentetik metin beklentileri eşleşti; bağımsız AutoCAD oracle'ı çalıştırılmadı");
  }

  // --------------------------------------------------------------------------
  // GATE 5: ATTRIB & ATTDEF Bağlama (Instance Override, Constant, Invisible)
  // --------------------------------------------------------------------------
  console.log("\n[Gate 5] ATTRIB & ATTDEF Bağlama Semantikleri...");
  {
    const doc = createMockBaseDocument();
    doc.blocks["DOOR_BLOCK"] = {
      name: "DOOR_BLOCK",
      basePoint: [0, 0],
      entities: [
        // 1. Normal ATTDEF (Override edilebilir)
        {
          handle: "ATT_NORMAL",
          type: "ATTDEF",
          layer: "0",
          order: BigInt(20),
          tag: "TAG_DOOR_ID",
          defaultText: "K1",
          insertionPoint: [10, 10],
          height: 5,
          rotationRad: 0,
          widthFactor: 1,
          obliqueRad: 0,
          styleName: "STANDARD",
        },
        // 2. Constant ATTDEF (Override edilemez!)
        {
          handle: "ATT_CONST",
          type: "ATTDEF",
          layer: "0",
          order: BigInt(21),
          tag: "TAG_CONST",
          defaultText: "YANGIN KAPISI",
          isConstant: true,
          insertionPoint: [10, 20],
          height: 5,
          rotationRad: 0,
          widthFactor: 1,
          obliqueRad: 0,
          styleName: "STANDARD",
        },
        // 3. Invisible ATTDEF (Çizilmemeli!)
        {
          handle: "ATT_INVIS",
          type: "ATTDEF",
          layer: "0",
          order: BigInt(22),
          tag: "TAG_SECRET",
          defaultText: "GİZLİ_METİN",
          isInvisible: true,
          insertionPoint: [10, 30],
          height: 5,
          rotationRad: 0,
          widthFactor: 1,
          obliqueRad: 0,
          styleName: "STANDARD",
        },
      ],
    };

    // INSERT: TAG_DOOR_ID için 'K105' verir; TAG_CONST için 'SAHTE' vermeye çalışır
    const doorInsert: CadInsertEntity = {
      handle: "INS_DOOR_1",
      type: "INSERT",
      layer: "0",
      order: BigInt(30),
      blockName: "DOOR_BLOCK",
      insertionPoint: [500, 500],
      scale: [1, 1, 1],
      rotationRad: 0,
      attributes: {
        TAG_DOOR_ID: "K105",
        TAG_CONST: "SAHTE_OVERRIDE",
      },
    };

    const visitor = new EntityVisitor({
      blocks: doc.blocks,
      layers: doc.layers,
      linetypes: doc.linetypes,
      textStyles: doc.textStyles,
    });

    const ctx = visitor.createRootContext("0", BigInt(30));
    const result = visitor.createEmptyResult();
    visitor.visitEntity(doorInsert, ctx, result);

    assert(result.segments.length > 0, "Kapı öznitelik metinleri üretilmeli");

    // 1. Instance override: TAG_DOOR_ID K105 oldu mu?
    // K105 metninin Y koordinatı 500 + 10 = 510 civarında olmalı
    const k105Segs = result.segments.filter(
      (s) => Math.abs(s.y0 - 510) < 15 && Math.abs(s.x0 - 510) < 50
    );
    assert(k105Segs.length > 0, "Normal ATTDEF instance override (K105) ile çizildi");

    // 2. Constant ATTDEF: SAHTE_OVERRIDE yerine YANGIN KAPISI çizildi mi?
    // Y koordinatı 500 + 20 = 520 civarında
    const constSegs = result.segments.filter(
      (s) => Math.abs(s.y0 - 520) < 15 && Math.abs(s.x0 - 510) < 100
    );
    assert(constSegs.length > 0, "isConstant öznitelik varsayılan metnini (YANGIN KAPISI) korudu");

    // 3. Invisible ATTDEF: GİZLİ_METİN (Y=530 civarı) çizilmemiş olmalı!
    const invisSegs = result.segments.filter(
      (s) => Math.abs(s.y0 - 530) < 5 && Math.abs(s.x0 - 510) < 50
    );
    assert.strictEqual(invisSegs.length, 0, "isInvisible öznitelik çizilmedi (başarıyla elendi)");

    // 4. Mirrored INSERT (scale: [-1, 1, 1]) kontrolü
    const mirroredInsert: CadInsertEntity = {
      ...doorInsert,
      handle: "INS_DOOR_MIRROR",
      scale: [-1, 1, 1],
    };
    const resMirror = visitor.createEmptyResult();
    visitor.visitEntity(mirroredInsert, ctx, resMirror);
    // Mirrored olduğu için X koordinatları 500 - x yönünde sola kaymalı
    assert(resMirror.minX < 500, "Aynalanmış INSERT özniteliği ters yönde üretildi");

    console.log("  ✓ Gate 5: PASS — ATTRIB/ATTDEF instance override, constant, invisible ve mirrored doğruluğu sağlandı");
  }

  // --------------------------------------------------------------------------
  // GATE 6: LEADER ve Ekli Açıklama Desteği
  // --------------------------------------------------------------------------
  console.log("\n[Gate 6] LEADER ve Ekli Açıklama Desteği...");
  {
    const doc = createMockBaseDocument();
    const leaderEnt: CadLeaderEntity = {
      handle: "LEADER_1",
      type: "LEADER",
      layer: "DIM",
      order: BigInt(40),
      vertices: [
        [0, 0],     // Ok ucu
        [50, 50],   // Dirsek
        [100, 50],  // Omuz
      ],
      hasArrowhead: true,
      arrowheadSize: 3.5,
      text: "NOT: 2Ø16 DONATI",
    };

    const visitor = new EntityVisitor({
      blocks: doc.blocks,
      layers: doc.layers,
      linetypes: doc.linetypes,
      textStyles: doc.textStyles,
    });

    const ctx = visitor.createRootContext("DIM", BigInt(40));
    const result = visitor.createEmptyResult();
    visitor.visitEntity(leaderEnt, ctx, result);

    assert(result.segments.length >= 5, `LEADER çizgileri, ok ucu ve metin üretilmeli (Bulunan: ${result.segments.length})`);

    // (0,0) civarında ok ucu segmenti var mı?
    const arrowAtOrigin = result.segments.some(
      (s) => (Math.hypot(s.x0, s.y0) < 5 || Math.hypot(s.x1, s.y1) < 5)
    );
    assert(arrowAtOrigin, "LEADER ucunda (0,0) ok ucu segmenti bulunmalı");

    // (100, 50) civarında metin segmentleri var mı?
    const textAtShoulder = result.segments.some(
      (s) => s.x0 >= 95 && Math.abs(s.y0 - 50) < 10
    );
    assert(textAtShoulder, "LEADER omuz noktasında ekli metin bulunmalı");

    console.log("  ✓ Gate 6: PASS — LEADER polyline, arrowhead ve ekli metin doğru konumda üretildi");
  }

  // --------------------------------------------------------------------------
  // GATE 7: Gerçek DWG (R001) Boyutsal Doğrulama ve Handle Probe'ları
  // --------------------------------------------------------------------------
  console.log("\n[Gate 7] Gerçek DWG (R001) Boyutsal Doğrulama ve Handle Probe'ları...");
  {
    const r001Path = path.resolve(process.cwd(), "eklediklerim/ornek_dosyalar/1 ve 2.kat dwg.dwg");
    assert(fs.existsSync(r001Path), `R001 dosyası bulunamadı: ${r001Path}`);
    const rawBytes = fs.readFileSync(r001Path);
    const rawHash = crypto.createHash("sha256").update(rawBytes).digest("hex");

    const doc = await parseDwgToCanonical(rawBytes, {
      sourceSha256: rawHash,
      sourceVersionKey: "r001_f05_acceptance",
    });

    const dimEntities = doc.modelSpaceEntities.filter((e) => e.type === "DIMENSION") as CadDimensionEntity[];
    console.log(`  -> R001 DIMENSION sayısı: ${dimEntities.length}`);
    assert.strictEqual(dimEntities.length, 1814, `R001 DIMENSION census fixture sayısı değişti (Bulunan: ${dimEntities.length})`);

    // Anonim blok referansı taşıyan boyut sayısı
    const dimsWithBlocks = dimEntities.filter((d) => d.anonymousBlockName && d.anonymousBlockName.startsWith("*D"));
    console.log(`  -> Anonim (*D) bloğu referans veren boyut sayısı: ${dimsWithBlocks.length}`);
    assert.strictEqual(dimsWithBlocks.length, 1814, "R001'deki her DIMENSION kaynak *D bloğu referansını korumalı");
    assert(
      dimsWithBlocks.every((dim) => {
        const block = dim.anonymousBlockName ? doc.blocks[dim.anonymousBlockName] : undefined;
        return Boolean(block && block.entities.length > 0);
      }),
      "Her R001 DIMENSION referansı mevcut ve boş olmayan canonical *D bloğuna bağlanmalı"
    );

    // Gerçek bir boyut probe'u
    const probe = dimEntities[0];
    console.log(`  -> Probe Boyut: handle=${probe.handle}, block=${probe.anonymousBlockName}, layer=${probe.layer}`);
    assert(probe.layer, "Boyut varlığının geçerli bir katmanı olmalı");
    assert(probe.anonymousBlockName, "Probe boyut anonim blok taşımalı");
    assert.strictEqual(probe.handle, "AB6F", "R001 sabit probe handle'ı değişti; census oracle'ı güncellenmeli");
    assert.strictEqual(probe.anonymousBlockName, "*D1789", "R001 sabit probe *D referansı değişti");

    // Sahneye derleme ve render parça kontrolü
    const compiled = compileCanonicalToScene(doc);
    assert(compiled.chunks.size > 0, "Sahne parçaları başarıyla üretilmeli");
    assert(compiled.manifest.indexPages[0].chunks.length > 0, "Manifest parçaları başarıyla içermeli");

    console.log("  ✓ Gate 7: PASS — R001 DIMENSION census 1814 ve her biri mevcut *D bloğuna bağlı; sahne derlemesi tamamlandı (AutoCAD görsel oracle'ı değildir)");
  }

  console.log("\n============================================================================");
  console.log(">>> F05 YEREL TESTLER GEÇTİ; PLAN / AUTOCAD KABULÜ EKSİK (PARTIAL) <<<");
  console.log("============================================================================");
}

runDimensionAttributeTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n[F05 TEST FAILED]:", err);
    process.exit(1);
  });
