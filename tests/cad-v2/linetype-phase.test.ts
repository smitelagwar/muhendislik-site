// ============================================================================
// DWG/DXF MOTOR V2 — F03: LINETYPE, DASH PHASE VE MODEL/PAPER ÖLÇEĞİ TESTİ
// ============================================================================
// Plan: F03 — Linetype, dash phase ve model/paper ölçeği
// Gates:
// 1. Standard AutoCAD Linetype Palette (25 tanım, pozitif döngü boyu, eleman sayıları)
// 2. ByLayer Linetype Resolution (katman kalıtımı, override, Continuous varsayılanı)
// 3. ByBlock Linetype Resolution (INSERT ebeveyn kalıtımı, çok katmanlı nested blok)
// 4. Explicit & Custom Document Linetypes (doc.linetypes tablosu, büyük/küçük harf toleransı, fallback)
// 5. Effective Scale Resolution (entityScale * globalScale * curScale * psScale * msScale)
// 6. Single Line Dashing & Centerline Invariance (kesikli çizgi, eksen değişmezliği)
// 7. Polyline Continuous Dash Phasing (plinegen: true ile köşeler arası faz korunumu)
// 8. Polyline Vertex Restart (plinegen: false ile her köşede desenin baştan başlaması)
// 9. Closed Polyline Loop Wrap-around (kapalı polyline döngüsü ve faz devamlılığı)
// 10. Arc & Circle True Arc Length Dashing (s = r * theta boyu gerçek yay mesafesi, chord hatasızlık)
// 11. Chunk Boundary & Cumulative Distance (mesafe monotonluğu, sıfır zıplama)
// 12. Binary Protocol & Scene Compiler Integration (SceneTag.PATH_DISTANCE üretimi ve worker/unpack turu)

import assert from "node:assert";
import type {
  CadCanonicalDocument,
  CadEntity,
  CadLineEntity,
  CadCircleEntity,
  CadArcEntity,
  CadLwPolylineEntity,
  CadInsertEntity,
  CadBlockDefinition,
} from "../../src/lib/cad-v2/canonical/types";
import {
  STANDARD_AUTOCAD_LINETYPES,
  resolveEntityLinetype,
  tessellateDashedLine,
  tessellateDashedPath,
  tessellateDashedArc,
  tessellateDashedCircle,
} from "../../src/lib/cad-v2/render/cad-stroke";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { parseSceneChunk, SceneTag, SceneScalarType } from "../../src/lib/cad-v2/protocol/binary-protocol";
import { unpackSceneChunk } from "../../src/workers/cad-v2/cad-v2-scene-worker";

console.log("[F03 Test] Linetype, Dash Phase ve Model/Paper Ölçeği Testi Başlatılıyor...");

// ----------------------------------------------------------------------------
// GATE 1: Standard AutoCAD Linetype Palette
// ----------------------------------------------------------------------------
console.log("  Gate 1: Standard AutoCAD Linetype Palette doğrulanıyor...");
{
  const expectedTypes = [
    "CONTINUOUS", "SOLID",
    "DASHED", "DASHED2", "DASHEDX2",
    "HIDDEN", "HIDDEN2", "HIDDENX2",
    "CENTER", "CENTER2", "CENTERX2",
    "DOT", "DOT2", "DOTX2",
    "DASHDOT", "DASHDOT2", "DASHDOTX2",
    "DIVIDE", "DIVIDE2", "DIVIDEX2",
    "PHANTOM", "PHANTOM2", "PHANTOMX2",
    "BORDER", "BORDER2", "BORDERX2",
  ];

  for (const name of expectedTypes) {
    const def = STANDARD_AUTOCAD_LINETYPES[name];
    assert(def !== undefined, `Standart linetype '${name}' tanımlı olmalı`);
    if (name === "CONTINUOUS" || name === "SOLID") {
      assert.strictEqual(def.pattern.length, 0, `${name} boş pattern olmalı`);
      assert.strictEqual(def.totalLength, 0, `${name} totalLength 0 olmalı`);
    } else {
      assert(def.pattern.length > 0, `${name} en az bir pattern elemanı içermeli`);
      assert(def.totalLength > 0, `${name} totalLength pozitif olmalı`);
      const sum = def.pattern.reduce((acc, v) => acc + Math.abs(v), 0);
      assert(Math.abs(sum - def.totalLength) < 1e-4, `${name} totalLength pattern toplamına eşit olmalı`);
    }
  }

  // DASHED2 = DASHED * 0.5, DASHEDX2 = DASHED * 2.0
  const dashed = STANDARD_AUTOCAD_LINETYPES["DASHED"];
  const dashed2 = STANDARD_AUTOCAD_LINETYPES["DASHED2"];
  const dashedX2 = STANDARD_AUTOCAD_LINETYPES["DASHEDX2"];
  assert(Math.abs(dashed2.totalLength - dashed.totalLength * 0.5) < 1e-4, "DASHED2 yarım ölçek olmalı");
  assert(Math.abs(dashedX2.totalLength - dashed.totalLength * 2.0) < 1e-4, "DASHEDX2 iki kat ölçek olmalı");
}

// ----------------------------------------------------------------------------
// GATE 2: ByLayer Linetype Resolution
// ----------------------------------------------------------------------------
console.log("  Gate 2: ByLayer Linetype Resolution doğrulanıyor...");
{
  const layers: any = {
    "CENTER_LAYER": { id: "CENTER_LAYER", name: "CENTER_LAYER", linetypeName: "CENTER", colorAci: 1, visible: true, frozen: false, locked: false, color: { method: "aci", aci: 1 }, lineweightMm: 0.25 },
    "DEFAULT_LAYER": { id: "DEFAULT_LAYER", name: "DEFAULT_LAYER", colorAci: 7, visible: true, frozen: false, locked: false, color: { method: "aci", aci: 7 }, lineweightMm: 0.25, linetypeName: "CONTINUOUS" },
  };

  const lineByLayer: CadLineEntity = {
    type: "LINE",
    handle: "101",
    order: BigInt(101),
    layer: "CENTER_LAYER",
    start: [0, 0],
    end: [100, 0],
    linetype: "ByLayer",
  };

  const res1 = resolveEntityLinetype(lineByLayer, layers);
  assert.strictEqual(res1.sourceMethod, "byLayer");
  assert.strictEqual(res1.name, "CENTER");
  assert.strictEqual(res1.isContinuous, false);
  assert.strictEqual(res1.pattern.length, 4);

  // Layer'da linetype belirtilmemişse -> Continuous
  const lineDefaultLayer: CadLineEntity = {
    type: "LINE",
    handle: "102",
    order: BigInt(102),
    layer: "DEFAULT_LAYER",
    start: [0, 0],
    end: [50, 0],
  };
  const res2 = resolveEntityLinetype(lineDefaultLayer, layers);
  assert.strictEqual(res2.name, "CONTINUOUS");
  assert.strictEqual(res2.isContinuous, true);

  // Viewport/context layer override kontrolü
  const res3 = resolveEntityLinetype(lineByLayer, layers, undefined, {
    layerOverrides: {
      "CENTER_LAYER": { linetypeName: "HIDDEN" },
    },
  });
  assert.strictEqual(res3.name, "HIDDEN");
  assert.strictEqual(res3.sourceMethod, "byLayer");
}

// ----------------------------------------------------------------------------
// GATE 3: ByBlock Linetype Resolution
// ----------------------------------------------------------------------------
console.log("  Gate 3: ByBlock Linetype Resolution doğrulanıyor...");
{
  const layers: any = {
    "0": { id: "0", name: "0", colorAci: 7, visible: true, frozen: false, locked: false, color: { method: "aci", aci: 7 }, lineweightMm: 0.25, linetypeName: "CONTINUOUS" },
  };

  const lineByBlock: CadLineEntity = {
    type: "LINE",
    handle: "201",
    layer: "0",
    order: BigInt(201),
    start: [0, 0],
    end: [20, 0],
    linetype: "ByBlock",
  };

  const parentInsert: CadInsertEntity = {
    type: "INSERT",
    handle: "200",
    layer: "0",
    order: BigInt(200),
    scale: [1, 1, 1],
    rotationRad: 0,
    blockName: "DOOR",
    insertionPoint: [10, 10],
    linetype: "DASHED",
  };

  const res1 = resolveEntityLinetype(lineByBlock, layers, undefined, {
    parentInsert,
  });
  assert.strictEqual(res1.sourceMethod, "byBlock");
  assert.strictEqual(res1.name, "DASHED");
  assert.strictEqual(res1.isContinuous, false);

  // Ebeveyn INSERT'in kendisi de ByBlock ise grand-parent'a tırmanma
  const grandParent: CadInsertEntity = {
    type: "INSERT",
    handle: "199",
    layer: "0",
    order: BigInt(199),
    scale: [1, 1, 1],
    rotationRad: 0,
    blockName: "FLOOR",
    insertionPoint: [0, 0],
    linetype: "PHANTOM",
  };
  const parentByBlock: CadInsertEntity = {
    ...parentInsert,
    linetype: "ByBlock",
  };

  const res2 = resolveEntityLinetype(lineByBlock, layers, undefined, {
    parentInsert: parentByBlock,
    parentInserts: [grandParent, parentByBlock],
  });
  assert.strictEqual(res2.sourceMethod, "byBlock");
  assert.strictEqual(res2.name, "PHANTOM");
}

// ----------------------------------------------------------------------------
// GATE 4: Explicit & Custom Document Linetypes
// ----------------------------------------------------------------------------
console.log("  Gate 4: Explicit & Custom Document Linetypes doğrulanıyor...");
{
  const customLinetypes: any = {
    "CUSTOM_GAS": {
      id: "CUSTOM_GAS",
      name: "CUSTOM_GAS",
      description: "Gas line ----GAS----GAS----",
      pattern: [12.0, -2.0, 0.0, -2.0],
      totalLength: 16.0,
    },
  };

  const lineCustom: CadLineEntity = {
    type: "LINE",
    handle: "301",
    layer: "0",
    order: BigInt(301),
    start: [0, 0],
    end: [100, 0],
    linetype: "custom_gas", // Küçük harfle explicit tanım
  };

  const res = resolveEntityLinetype(lineCustom, {}, customLinetypes);
  assert.strictEqual(res.sourceMethod, "explicit");
  assert.strictEqual(res.name, "custom_gas");
  assert.strictEqual(res.isContinuous, false);
  assert.strictEqual(res.pattern.length, 4);
  assert.strictEqual(res.totalLength, 16.0);

  // Tamamen bilinmeyen linetype fallback -> CONTINUOUS
  const lineUnknown: CadLineEntity = {
    type: "LINE",
    handle: "302",
    layer: "0",
    order: BigInt(302),
    start: [0, 0],
    end: [100, 0],
    linetype: "NON_EXISTENT_LTYPE_12345",
  };
  const resUnknown = resolveEntityLinetype(lineUnknown, {});
  assert.strictEqual(resUnknown.isContinuous, true);
  assert.strictEqual(resUnknown.pattern.length, 0);
}

// ----------------------------------------------------------------------------
// GATE 5: Effective Scale Resolution
// ----------------------------------------------------------------------------
console.log("  Gate 5: Effective Scale Resolution doğrulanıyor...");
{
  const lineScaled: CadLineEntity = {
    type: "LINE",
    handle: "401",
    layer: "0",
    order: BigInt(401),
    start: [0, 0],
    end: [100, 0],
    linetype: "DASHED",
    linetypeScale: 2.5,
  };

  // Model alanı: entScale (2.5) * globalScale (2.0) * curScale (1.0) * msScale (1.5) = 7.5
  const resModel = resolveEntityLinetype(lineScaled, {}, undefined, {
    globalLtScale: 2.0,
    currentLtScale: 1.0,
    msLtScale: 1.5,
    isPaperSpace: false,
  });
  assert(Math.abs(resModel.effectiveScale - 7.5) < 1e-4, `Model alanı effectiveScale 7.5 olmalı, alınan: ${resModel.effectiveScale}`);

  // Paper alanı: entScale (2.5) * globalScale (2.0) * curScale (1.0) * psLtScale (0.5) = 2.5
  const resPaper = resolveEntityLinetype(lineScaled, {}, undefined, {
    globalLtScale: 2.0,
    currentLtScale: 1.0,
    psLtScale: 0.5,
    isPaperSpace: true,
  });
  assert(Math.abs(resPaper.effectiveScale - 2.5) < 1e-4, `Paper alanı effectiveScale 2.5 olmalı, alınan: ${resPaper.effectiveScale}`);
}

// ----------------------------------------------------------------------------
// GATE 6: Single Line Dashing & Centerline Invariance
// ----------------------------------------------------------------------------
console.log("  Gate 6: Single Line Dashing & Centerline Invariance doğrulanıyor...");
{
  // 100 birim uzunluğunda eğik çizgi: (0, 0) -> (60, 80) [len = 100]
  const p0: [number, number] = [0, 0];
  const p1: [number, number] = [60, 80];
  // Pattern: [10, -5] (dash 10, gap 5, cycle 15)
  const pattern = [10, -5];
  const res = tessellateDashedLine(p0, p1, pattern, 1.0, 0.0);

  assert(res.segments.length > 1, "Kesikli çizgi birden fazla segmente bölünmeli");
  assert(Math.abs(res.totalDistance - 100) < 1e-4, "Toplam çizgi mesafesi 100 olmalı");
  assert(Math.abs(res.endPhase - 100) < 1e-4, "endPhase 100 olmalı");

  // Centerline değişmezliği kontrolü: her segmentin uç noktaları doğru çizgi üzerinde mi?
  // Doğru denklemi: 80 * x - 60 * y = 0
  for (const seg of res.segments) {
    const err0 = Math.abs(80 * seg.x0 - 60 * seg.y0);
    const err1 = Math.abs(80 * seg.x1 - 60 * seg.y1);
    assert(err0 < 1e-4, `Başlangıç noktası eksen üzerinde olmalı (sapma: ${err0})`);
    assert(err1 < 1e-4, `Bitiş noktası eksen üzerinde olmalı (sapma: ${err1})`);

    // Her dash segmentinin uzunluğu <= 10 olmalı
    const segLen = Math.hypot(seg.x1 - seg.x0, seg.y1 - seg.y0);
    assert(segLen <= 10.0 + 1e-4, `Dash uzunluğu ${segLen} <= 10 olmalı`);
    assert(seg.d0 !== undefined && seg.d1 !== undefined, "Segment d0 ve d1 mesafe değerlerini taşımalı");
    assert(seg.d1 >= seg.d0, "d1 >= d0 olmalı");
  }
}

// ----------------------------------------------------------------------------
// GATE 7: Polyline Continuous Dash Phasing (plinegen: true)
// ----------------------------------------------------------------------------
console.log("  Gate 7: Polyline Continuous Dash Phasing (plinegen: true) doğrulanıyor...");
{
  // 2 segmentli L şekli: (0, 0) -> (12, 0) -> (12, 16)
  // Segment 1: len = 12
  // Segment 2: len = 16
  // Pattern: [10, -5] (cycle = 15)
  // Segment 1 sonunda phase = 12. Segment 1'de 0..10 dash, 10..12 gap.
  // plinegen: true olduğunda Segment 2, phase = 12 ile başlar!
  // Gap 10..15 aralığında olduğu için 12..15 (kalan 3 birim gap) köşeyi geçerek Segment 2'nin başında devam etmeli!
  // Ardından 3 birim gap bitince dash başlamalı!
  const pts: [number, number][] = [[0, 0], [12, 0], [12, 16]];
  const pattern = [10, -5];

  const res = tessellateDashedPath(pts, pattern, 1.0, {
    plinegen: true,
    isClosed: false,
  });

  assert(res.segments.length >= 2, "Polyline kesikli segmentler üretmeli");
  assert(Math.abs(res.totalDistance - 28) < 1e-4, "Toplam polyline uzunluğu 28 olmalı");

  // Segment 1'deki ilk dash: (0, 0) -> (10, 0)
  const firstDash = res.segments[0];
  assert(Math.abs(firstDash.x0 - 0) < 1e-4 && Math.abs(firstDash.x1 - 10) < 1e-4, "İlk dash (0,0)->(10,0) olmalı");

  // Segment 2'deki ilk dash: köşe (12, 0)'dan 3 birim yukarıda başlamalı: (12, 3) -> (12, 13)
  const seg2Dash = res.segments.find((s) => Math.abs(s.x0 - 12) < 1e-4);
  assert(seg2Dash !== undefined, "Segment 2'de dash bulunmalı");
  assert(Math.abs(seg2Dash.y0 - 3) < 1e-4, `plinegen: true ile Segment 2'deki dash gap bitişi y=3'ten başlamalı, alınan: ${seg2Dash.y0}`);
}

// ----------------------------------------------------------------------------
// GATE 8: Polyline Vertex Restart (plinegen: false)
// ----------------------------------------------------------------------------
console.log("  Gate 8: Polyline Vertex Restart (plinegen: false) doğrulanıyor...");
{
  // Aynı L şekli: plinegen: false olduğunda her köşede desen başa döner (phase = 0).
  // Segment 2 köşe noktasından (12, 0) hemen dash ile başlamalıdır!
  const pts: [number, number][] = [[0, 0], [12, 0], [12, 16]];
  const pattern = [10, -5];

  const res = tessellateDashedPath(pts, pattern, 1.0, {
    plinegen: false,
    isClosed: false,
  });

  const seg2Dash = res.segments.find((s) => Math.abs(s.x0 - 12) < 1e-4);
  assert(seg2Dash !== undefined, "Segment 2'de dash bulunmalı");
  assert(Math.abs(seg2Dash.y0 - 0) < 1e-4, `plinegen: false ile Segment 2 tam köşeden y=0 başlamalı, alınan: ${seg2Dash.y0}`);
}

// ----------------------------------------------------------------------------
// GATE 9: Closed Polyline Loop Wrap-around
// ----------------------------------------------------------------------------
console.log("  Gate 9: Closed Polyline Loop Wrap-around doğrulanıyor...");
{
  // 10x10 kare (çevre = 40)
  const squarePts: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]];
  const pattern = [5, -5]; // 5 dash, 5 gap

  const res = tessellateDashedPath(squarePts, pattern, 1.0, {
    isClosed: true,
    plinegen: true,
  });

  assert(Math.abs(res.totalDistance - 40) < 1e-4, "Kapalı karenin toplam mesafesi 40 olmalı");
  // 40 / 10 = 4 tam döngü -> 4 dash
  assert.strictEqual(res.segments.length, 4, "4 kenarda 4 adet 5 birimlik dash üretilmeli");
  for (const seg of res.segments) {
    const len = Math.hypot(seg.x1 - seg.x0, seg.y1 - seg.y0);
    assert(Math.abs(len - 5.0) < 1e-4, "Her dash tam 5 birim olmalı");
  }
}

// ----------------------------------------------------------------------------
// GATE 10: Arc & Circle True Arc Length Dashing
// ----------------------------------------------------------------------------
console.log("  Gate 10: Arc & Circle True Arc Length Dashing doğrulanıyor...");
{
  const center: [number, number] = [0, 0];
  const radius = 100;
  // Çember çevresi = 2 * PI * 100 ~= 628.3185
  // Pattern: [20, -10] (cycle = 30)
  const pattern = [20, -10];
  const res = tessellateDashedCircle(center, radius, pattern, 1.0, 0.0);

  const expectedCircumference = 2 * Math.PI * radius;
  assert(Math.abs(res.totalDistance - expectedCircumference) < 1e-3, "Çember uzunluğu analitik çevreye eşit olmalı");
  assert(res.segments.length > 20, "Çember üzerinde yeterli sayıda dash segmenti üretilmeli");

  // Bütün üretilen noktalar analitik çember yarıçapı r=100 üzerinde olmalı
  for (const seg of res.segments) {
    const r0 = Math.hypot(seg.x0, seg.y0);
    const r1 = Math.hypot(seg.x1, seg.y1);
    assert(Math.abs(r0 - radius) < 0.25, `Çember noktası r0=${r0} yarıçapa uygun olmalı`);
    assert(Math.abs(r1 - radius) < 0.25, `Çember noktası r1=${r1} yarıçapa uygun olmalı`);
  }

  // Yarım daire yay (ARC): 0 -> PI
  const resArc = tessellateDashedArc(center, radius, 0, Math.PI, false, pattern, 1.0, 0.0);
  const expectedArcLen = Math.PI * radius;
  assert(Math.abs(resArc.totalDistance - expectedArcLen) < 1e-3, "Yay uzunluğu r*PI olmalı");
}

// ----------------------------------------------------------------------------
// GATE 11: Chunk Boundary & Cumulative Distance
// ----------------------------------------------------------------------------
console.log("  Gate 11: Chunk Boundary & Cumulative Distance doğrulanıyor...");
{
  const p0: [number, number] = [0, 0];
  const p1: [number, number] = [1000, 0];
  const pattern = [20, -10];
  const res = tessellateDashedLine(p0, p1, pattern, 1.0, 0.0);

  // Mesafe monotonluğu: d0 < d1 ve bir sonraki d0 >= önceki d1
  let lastD = -1;
  for (const seg of res.segments) {
    assert(seg.d0! >= lastD - 1e-4, `Kümülatif mesafe monoton artmalı: ${seg.d0} >= ${lastD}`);
    assert(seg.d1! > seg.d0!, `Segment bitiş mesafesi başlangıçtan büyük olmalı: ${seg.d1} > ${seg.d0}`);
    lastD = seg.d1!;
  }
}

// ----------------------------------------------------------------------------
// GATE 12: Binary Protocol & Scene Compiler Integration
// ----------------------------------------------------------------------------
console.log("  Gate 12: Binary Protocol & Scene Compiler Integration doğrulanıyor...");
{
  const doc: any = {
    sourceSha256: "aabbccddeeff11223344556677889900aabbccddeeff11223344556677889900",
    sourceVersionKey: "LINETYPE_FIDELITY_TEST_REV1",
    acadVersion: "AC1032",
    codepage: "ANSI_1252",
    units: 4,
    measurement: 1,
    layers: {
      "0": { id: "0", name: "0", colorAci: 7, visible: true, frozen: false, locked: false, color: { method: "aci", aci: 7 }, lineweightMm: 0.25, linetypeName: "CONTINUOUS" },
      "HIDDEN_LAYER": { id: "HIDDEN_LAYER", name: "HIDDEN_LAYER", linetype: "HIDDEN", colorAci: 1, visible: true, frozen: false, locked: false, color: { method: "aci", aci: 1 }, lineweightMm: 0.25 },
      "CENTER_LAYER": { id: "CENTER_LAYER", name: "CENTER_LAYER", linetype: "CENTER", colorAci: 3, visible: true, frozen: false, locked: false, color: { method: "aci", aci: 3 }, lineweightMm: 0.25 },
    },
    linetypes: {
      CUSTOM_DASHDOT: {
        id: "CUSTOM_DASHDOT",
        name: "CUSTOM_DASHDOT",
        pattern: [10, -2, 0, -2],
        totalLength: 14,
      },
    },
    modelSpaceEntities: [
      // 1. Düz çizgi (HIDDEN linetype)
      {
        type: "LINE",
        handle: "L1",
        layer: "HIDDEN_LAYER",
        start: [0, 0],
        end: [200, 0],
        order: BigInt(1),
      },
      // 2. Daire (CENTER linetype)
      {
        type: "CIRCLE",
        handle: "C1",
        layer: "CENTER_LAYER",
        center: [100, 100],
        radius: 50,
        order: BigInt(2),
      },
      // 3. Polyline (Özel linetype, plinegen: true)
      {
        type: "LWPOLYLINE",
        handle: "P1",
        layer: "0",
        linetype: "CUSTOM_DASHDOT",
        lineweightMm: 0,
        plinegen: true,
        isClosed: false,
        vertices: [
          { x: 0, y: 50 },
          { x: 80, y: 50 },
          { x: 80, y: 120 },
        ],
        order: BigInt(3),
      },
    ],
  };

  const compiled = compileCanonicalToScene(doc, { sceneId: "test_linetype_scene" });
  assert(compiled.manifest !== undefined, "Manifest üretilmeli");
  assert(compiled.chunks.size > 0, "En az 1 chunk üretilmeli");

  // Chunk'ı ikili protokolden çöz ve SceneTag.PATH_DISTANCE'ı doğrula
  const chunkBytes = compiled.chunks.get("chunk_model_001");
  assert(chunkBytes !== undefined, "chunk_model_001 mevcut olmalı");

  const rawChunk = parseSceneChunk(chunkBytes);
  const pathDistSec = rawChunk.sections.get(SceneTag.PATH_DISTANCE);
  assert(pathDistSec !== undefined, "SceneTag.PATH_DISTANCE section mevcut olmalı");
  assert.strictEqual(pathDistSec.header.tag, SceneTag.PATH_DISTANCE);
  assert.strictEqual(pathDistSec.header.scalarType, SceneScalarType.F32);
  assert.strictEqual(pathDistSec.header.componentCount, 1);

  const xySec = rawChunk.sections.get(SceneTag.XY);
  assert(xySec !== undefined, "SceneTag.XY mevcut olmalı");
  const lineVertCount = (xySec.data as Float32Array).length / 2;
  assert.strictEqual(pathDistSec.header.elementCount, lineVertCount, "PATH_DISTANCE eleman sayısı line vert sayısına eşit olmalı");

  // Worker unpackSceneChunk doğrulaması
  const unpacked = unpackSceneChunk("chunk_model_001", chunkBytes);
  assert(unpacked.pathDistancesArray !== null && unpacked.pathDistancesArray !== undefined, "unpacked.pathDistancesArray mevcut olmalı");
  assert.strictEqual(unpacked.pathDistancesArray.length, lineVertCount);

  const metaSection = rawChunk.sections.get(SceneTag.META);
  assert(metaSection !== undefined, "Scene META shader-linetype sınırlarını doğrulamak için mevcut olmalı");
  const sceneMeta = JSON.parse(new TextDecoder().decode(metaSection.data as Uint8Array)) as {
    drawCommands?: Array<{ layer: string; dashStyle?: { dashSize: number; gapSize: number } }>;
  };
  const drawCommands = sceneMeta.drawCommands ?? [];
  assert(drawCommands.some((command) => command.layer === "HIDDEN_LAYER" && command.dashStyle === undefined),
    "Lineweight taşıyan iki-terimli HIDDEN çizgisi shader stilini almaz; mevcut CPU-expanded yolunda kalır");
  assert(drawCommands.some((command) => command.layer === "0" && command.dashStyle === undefined),
    "Çok-terimli CUSTOM_DASHDOT polyline shader stilini almaz; mevcut CPU-expanded yolunda kalır");

  // Non-finite (NaN / Infinity) içermediğini doğrula
  for (let i = 0; i < unpacked.pathDistancesArray.length; i++) {
    assert(Number.isFinite(unpacked.pathDistancesArray[i]), `pathDistancesArray[${i}] finite olmalı`);
  }
}

console.log("[F03 Test] TÜM 12 KAPI BAŞARIYLA GEÇTİ (PASS)!");
