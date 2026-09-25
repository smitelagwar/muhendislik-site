// ============================================================================
// DWG/DXF MOTOR V2 — P06 BLOCK EXPANSION & BUDGET TEST
// ============================================================================
// Sözleşme: P06 — Ortak entity compiler, block text ve güvenli expansion
// 1. Eksik blok (MISSING_BLOCK_DEFINITION), döngü (CYCLIC_BLOCK_REFERENCE),
//    derinlik (MAX_DEPTH_EXCEEDED) ve bütçe (EXPANSION_BUDGET_EXCEEDED) ayrı tanı kodları
// 2. Cycle ancestor-path ile kontrol edilir; aynı bloğun birden fazla meşru instance'ı engellenmez
// 3. Bounded termination + off-by-one testleri (tavan-1, tavan, tavan+1)
// 4. Sayaç her derleme başında sıfırlanır
// ============================================================================

import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { EntityVisitor, VisitorContext } from "../../src/lib/cad-v2/compile/entity-visitor";
import type {
  CadBlockDefinition,
  CadInsertEntity,
  CadLineEntity,
} from "../../src/lib/cad-v2/canonical/types";

function runBlockExpansionBudgetTests() {
  console.log("▶ P06 Block Expansion & Budget Testleri Başlatılıyor...");

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
  };

  // --------------------------------------------------------------------------
  // 1. EKSİK BLOK REFERANSI (MISSING_BLOCK_DEFINITION)
  // --------------------------------------------------------------------------
  {
    const visitor = new EntityVisitor({ blocks: {}, layers });
    const result = visitor.createEmptyResult();
    const ctx = visitor.createRootContext("0", BigInt(1));

    visitor.visitEntity(
      {
        type: "INSERT",
        handle: "I_MISSING",
        layer: "0",
        order: BigInt(1),
        blockName: "NON_EXISTENT_BLOCK",
        insertionPoint: [0, 0],
        scale: [1, 1, 1],
        rotationRad: 0,
        visible: true,
      } as CadInsertEntity,
      ctx,
      result
    );

    assert(
      result.diagnostics.some((d) => d.code === "MISSING_BLOCK_DEFINITION"),
      "Eksik blok için MISSING_BLOCK_DEFINITION kodu üretilmelidir"
    );
    console.log("  ✓ MISSING_BLOCK_DEFINITION tanı kodu başarıyla doğrulandı.");
  }

  // --------------------------------------------------------------------------
  // 2. DÖNGÜSEL BLOK REFERANSI (CYCLIC_BLOCK_REFERENCE) & ANCESTOR-PATH
  // --------------------------------------------------------------------------
  {
    // A -> B -> A döngüsü
    const blockA: CadBlockDefinition = {
      name: "BLOCK_A",
      basePoint: [0, 0],
      entities: [
        {
          type: "INSERT",
          handle: "I_B",
          layer: "0",
          order: BigInt(1),
          blockName: "BLOCK_B",
          insertionPoint: [0, 0],
          scale: [1, 1, 1],
          rotationRad: 0,
          visible: true,
        } as CadInsertEntity,
      ],
    };

    const blockB: CadBlockDefinition = {
      name: "BLOCK_B",
      basePoint: [0, 0],
      entities: [
        {
          type: "INSERT",
          handle: "I_A",
          layer: "0",
          order: BigInt(2),
          blockName: "BLOCK_A", // Döngü!
          insertionPoint: [0, 0],
          scale: [1, 1, 1],
          rotationRad: 0,
          visible: true,
        } as CadInsertEntity,
      ],
    };

    const visitor = new EntityVisitor({
      blocks: { BLOCK_A: blockA, BLOCK_B: blockB },
      layers,
    });
    const result = visitor.createEmptyResult();
    const ctx = visitor.createRootContext("0", BigInt(1));

    visitor.visitEntity(
      {
        type: "INSERT",
        handle: "I_ROOT",
        layer: "0",
        order: BigInt(1),
        blockName: "BLOCK_A",
        insertionPoint: [0, 0],
        scale: [1, 1, 1],
        rotationRad: 0,
        visible: true,
      } as CadInsertEntity,
      ctx,
      result
    );

    assert(
      result.diagnostics.some((d) => d.code === "CYCLIC_BLOCK_REFERENCE"),
      "Döngü tespit edildiğinde CYCLIC_BLOCK_REFERENCE kodu üretilmelidir"
    );
    console.log("  ✓ CYCLIC_BLOCK_REFERENCE döngüsel blok koruması sonsuz döngüye girmeden durduruldu.");

    // 2b. Aynı bloğun meşru çoklu instance'ı (cycle değildir!)
    const blockLeaf: CadBlockDefinition = {
      name: "LEAF",
      basePoint: [0, 0],
      entities: [
        {
          type: "LINE",
          handle: "L1",
          layer: "0",
          order: BigInt(1),
          start: [0, 0],
          end: [10, 0],
          visible: true,
        } as CadLineEntity,
      ],
    };

    const blockBranch: CadBlockDefinition = {
      name: "BRANCH",
      basePoint: [0, 0],
      entities: [
        {
          type: "INSERT",
          handle: "I_L1",
          layer: "0",
          order: BigInt(1),
          blockName: "LEAF",
          insertionPoint: [0, 0],
          scale: [1, 1, 1],
          rotationRad: 0,
          visible: true,
        } as CadInsertEntity,
        {
          type: "INSERT",
          handle: "I_L2",
          layer: "0",
          order: BigInt(2),
          blockName: "LEAF", // Aynı bloğun ikinci meşru kullanımı!
          insertionPoint: [20, 0],
          scale: [1, 1, 1],
          rotationRad: 0,
          visible: true,
        } as CadInsertEntity,
      ],
    };

    const branchVisitor = new EntityVisitor({
      blocks: { LEAF: blockLeaf, BRANCH: blockBranch },
      layers,
    });
    const branchRes = branchVisitor.createEmptyResult();
    branchVisitor.visitEntity(
      {
        type: "INSERT",
        handle: "I_BRANCH",
        layer: "0",
        order: BigInt(1),
        blockName: "BRANCH",
        insertionPoint: [0, 0],
        scale: [1, 1, 1],
        rotationRad: 0,
        visible: true,
      } as CadInsertEntity,
      branchVisitor.createRootContext("0", BigInt(1)),
      branchRes
    );

    assert.equal(
      branchRes.diagnostics.filter((d) => d.code === "CYCLIC_BLOCK_REFERENCE").length,
      0,
      "Aynı bloğun kardeş instance'ları döngü sayılmamalıdır"
    );
    assert.equal(branchRes.segments.length, 2, "Her iki LEAF nesnesi de açılmalıdır");
    console.log("  ✓ Kardeş blok instance'larının meşru kullanımı başarıyla doğrulandı (0 false-positive cycle).");
  }

  // --------------------------------------------------------------------------
  // 3. MAKSİMUM DERİNLİK SINIRI (MAX_DEPTH_EXCEEDED)
  // --------------------------------------------------------------------------
  {
    // 5 seviye derin blok zinciri: B0 -> B1 -> B2 -> B3 -> B4
    const blocks: Record<string, CadBlockDefinition> = {};
    for (let i = 0; i < 5; i++) {
      blocks[`B_${i}`] = {
        name: `B_${i}`,
        basePoint: [0, 0],
        entities: [
          i < 4
            ? ({
                type: "INSERT",
                handle: `I_${i}`,
                layer: "0",
                order: BigInt(i),
                blockName: `B_${i + 1}`,
                insertionPoint: [0, 0],
                scale: [1, 1, 1],
                rotationRad: 0,
                visible: true,
              } as CadInsertEntity)
            : ({
                type: "LINE",
                handle: `L_DEEP`,
                layer: "0",
                order: BigInt(i),
                start: [0, 0],
                end: [10, 0],
                visible: true,
              } as CadLineEntity),
        ],
      };
    }

    // maxDepth = 3 ayarla
    const depthVisitor = new EntityVisitor({ blocks, layers, maxDepth: 3 });
    const depthRes = depthVisitor.createEmptyResult();
    depthVisitor.visitEntity(
      {
        type: "INSERT",
        handle: "I_ROOT",
        layer: "0",
        order: BigInt(1),
        blockName: "B_0",
        insertionPoint: [0, 0],
        scale: [1, 1, 1],
        rotationRad: 0,
        visible: true,
      } as CadInsertEntity,
      depthVisitor.createRootContext("0", BigInt(1)),
      depthRes
    );

    assert(
      depthRes.diagnostics.some((d) => d.code === "MAX_DEPTH_EXCEEDED"),
      "Derinlik aşımında MAX_DEPTH_EXCEEDED üretilmelidir"
    );
    console.log("  ✓ MAX_DEPTH_EXCEEDED derinlik sınırı aşımı başarıyla tespit edildi.");
  }

  // --------------------------------------------------------------------------
  // 4. BOUNDED TERMINATION & OFF-BY-ONE BÜTÇE TESTİ (TAVAN-1, TAVAN, TAVAN+1)
  // --------------------------------------------------------------------------
  {
    // 100 entity'lik test bloğu oluştur
    const entities100: CadLineEntity[] = [];
    for (let i = 0; i < 100; i++) {
      entities100.push({
        type: "LINE",
        handle: `L_${i}`,
        layer: "0",
        order: BigInt(i),
        start: [i, 0],
        end: [i + 1, 0],
        visible: true,
      });
    }

    const testBlock: CadBlockDefinition = {
      name: "BLOCK_100",
      basePoint: [0, 0],
      entities: entities100,
    };

    // 4a. Tavan-1: bütçe 102 (1 INSERT + 100 child = 101 total) -> Budget NOT exceeded
    const visitorBelow = new EntityVisitor({
      blocks: { BLOCK_100: testBlock },
      layers,
      maxTotalEntities: 102,
    });
    const resBelow = visitorBelow.createEmptyResult();
    visitorBelow.visitEntity(
      {
        type: "INSERT",
        handle: "I_TOP",
        layer: "0",
        order: BigInt(1),
        blockName: "BLOCK_100",
        insertionPoint: [0, 0],
        scale: [1, 1, 1],
        rotationRad: 0,
        visible: true,
      } as CadInsertEntity,
      visitorBelow.createRootContext("0", BigInt(1)),
      resBelow
    );
    assert.equal(resBelow.isBudgetExceeded, false, "Tavan-1 durumunda bütçe aşılmamalıdır");
    assert.equal(resBelow.segments.length, 100, "100 segmentin tamamı derlenmelidir");

    // 4b. Tavan: bütçe 101 (1 INSERT + 100 child = 101 total) -> Budget NOT exceeded
    const visitorExact = new EntityVisitor({
      blocks: { BLOCK_100: testBlock },
      layers,
      maxTotalEntities: 101,
    });
    const resExact = visitorExact.createEmptyResult();
    visitorExact.visitEntity(
      {
        type: "INSERT",
        handle: "I_TOP",
        layer: "0",
        order: BigInt(1),
        blockName: "BLOCK_100",
        insertionPoint: [0, 0],
        scale: [1, 1, 1],
        rotationRad: 0,
        visible: true,
      } as CadInsertEntity,
      visitorExact.createRootContext("0", BigInt(1)),
      resExact
    );
    assert.equal(resExact.isBudgetExceeded, false, "Tam tavan durumunda bütçe aşılmamalıdır");
    assert.equal(resExact.segments.length, 100);

    // 4c. Tavan+1: bütçe 100 (1 INSERT + 100 child = 101 total) -> Budget EXCEEDED!
    const visitorOver = new EntityVisitor({
      blocks: { BLOCK_100: testBlock },
      layers,
      maxTotalEntities: 100, // 100 ile sınırlı
    });
    const resOver = visitorOver.createEmptyResult();
    visitorOver.visitEntity(
      {
        type: "INSERT",
        handle: "I_TOP",
        layer: "0",
        order: BigInt(1),
        blockName: "BLOCK_100",
        insertionPoint: [0, 0],
        scale: [1, 1, 1],
        rotationRad: 0,
        visible: true,
      } as CadInsertEntity,
      visitorOver.createRootContext("0", BigInt(1)),
      resOver
    );
    assert.equal(resOver.isBudgetExceeded, true, "Bütçe aşıldığında isBudgetExceeded true olmalıdır");
    assert(
      resOver.diagnostics.some((d) => d.code === "EXPANSION_BUDGET_EXCEEDED"),
      "EXPANSION_BUDGET_EXCEEDED tanı kodu üretilmelidir"
    );
    // Bounded termination: fazladan nesne üretilmeden durmalı
    assert.equal(resOver.segments.length, 99, "Sınırı aşan son varlık kesilmeli ve güvenli durmalıdır");
    console.log("  ✓ Bounded termination ve off-by-one testleri (tavan-1, tavan, tavan+1) başarıyla geçti.");
  }

  // --------------------------------------------------------------------------
  // 5. COMPILER SIFIRLAMA (STATE LEAK OLMAMASI)
  // --------------------------------------------------------------------------
  {
    const dummyBlock: CadBlockDefinition = {
      name: "DUMMY",
      basePoint: [0, 0],
      entities: [
        {
          type: "LINE",
          handle: "L_DUMMY",
          layer: "0",
          order: BigInt(1),
          start: [0, 0],
          end: [1, 1],
          visible: true,
        } as CadLineEntity,
      ],
    };

    const visitor = new EntityVisitor({ blocks: { DUMMY: dummyBlock }, layers, maxTotalEntities: 5 });
    const r1 = visitor.createEmptyResult();
    visitor.visitEntity(
      { type: "INSERT", handle: "I1", layer: "0", order: BigInt(1), blockName: "DUMMY", insertionPoint: [0, 0], scale: [1, 1, 1], rotationRad: 0, visible: true } as CadInsertEntity,
      visitor.createRootContext("0", BigInt(1)),
      r1
    );
    assert.equal(r1.totalEntitiesVisited, 2);

    const r2 = visitor.createEmptyResult();
    visitor.visitEntity(
      { type: "INSERT", handle: "I2", layer: "0", order: BigInt(2), blockName: "DUMMY", insertionPoint: [0, 0], scale: [1, 1, 1], rotationRad: 0, visible: true } as CadInsertEntity,
      visitor.createRootContext("0", BigInt(2)),
      r2
    );
    assert.equal(r2.totalEntitiesVisited, 2, "İkinci derleme önceki sayacı taşımamalı, sıfırdan başlamalıdır");
    console.log("  ✓ Derleme sayaç sıfırlama testi doğrulandı.");
  }

  // Kanıt kaydı
  const evidenceDir = path.resolve(process.cwd(), "motor_v2/evidence/fidelity-v3/P06");
  fs.mkdirSync(evidenceDir, { recursive: true });
  fs.writeFileSync(
    path.join(evidenceDir, "block-expansion-budget.json"),
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        package: "P06",
        status: "PASS",
        tests: [
          "missing_block_definition",
          "cyclic_block_reference_and_ancestor_path",
          "max_depth_exceeded",
          "bounded_termination_off_by_one_budget",
          "compiler_reset_between_calls",
        ],
      },
      null,
      2
    )
  );
  console.log("  ✓ P06 bütçe kanıtı kaydedildi: motor_v2/evidence/fidelity-v3/P06/block-expansion-budget.json");
}

try {
  runBlockExpansionBudgetTests();
  console.log("✅ P06 Block Expansion & Budget Testleri Başarıyla Geçti.");
} catch (err) {
  console.error("❌ P06 Block Expansion & Budget Testi Hatası:", err);
  process.exit(1);
}
