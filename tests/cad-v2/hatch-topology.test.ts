// ============================================================================
// DWG/DXF MOTOR V2 — HATCH TOPOLOGY & NESTING TEST SUITE (P07)
// ============================================================================
// Sözleşme: Fidelity v3 Planı P07
// 1. Ters loop sırası (iç delik önce, dış sınır sonra)
// 2. Yuvalanmış adalar (nested islands: dış -> delik -> ada)
// 3. hatchStyle: Normal (0), Outer (1), Ignore (2) alan doğrulaması
// 4. Bulge (yay) içeren sınır döngüleri
// 5. Bozuk/dejenere kontur hata dayanıklılığı
// ============================================================================

import assert from "node:assert";
import type { CadHatchEntity, CadPoint2D } from "../../src/lib/cad-v2/canonical/types";
import { GeometryCompiler } from "../../src/lib/cad-v2/compile/geometry-compiler";

console.log("=== P07 HATCH TOPOLOGY & NESTING TESTS BAŞLIYOR ===");

/**
 * Üçgen mesh'in toplam alanını hesaplar
 */
function computeMeshArea(vertices: Float32Array): number {
  let totalArea = 0;
  for (let i = 0; i < vertices.length; i += 6) {
    const x1 = vertices[i], y1 = vertices[i + 1];
    const x2 = vertices[i + 2], y2 = vertices[i + 3];
    const x3 = vertices[i + 4], y3 = vertices[i + 5];
    const triArea = 0.5 * Math.abs(x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
    totalArea += triArea;
  }
  return totalArea;
}

// ----------------------------------------------------------------------------
// TEST 1: Ters Loop Sırası (İç Delik Önce, Dış Sınır Sonra)
// ----------------------------------------------------------------------------
console.log("\n[TEST 1] Ters döngü sırası (delik ilk index'te, dış sınır ikinci index'te)...");

// Delik: [40, 40] - [60, 60] (20x20 = 400)
const holeLoop = {
  isPolyline: true,
  vertices: [
    [40, 40],
    [60, 40],
    [60, 60],
    [40, 60],
  ] as CadPoint2D[],
};

// Dış sınır: [0, 0] - [100, 100] (100x100 = 10,000)
const outerLoop = {
  isPolyline: true,
  vertices: [
    [0, 0],
    [100, 0],
    [100, 100],
    [0, 100],
  ] as CadPoint2D[],
};

// Delik döngüsü DİZİDE İLK ELEMAN
const hatchReverse: CadHatchEntity = {
  type: "HATCH",
  handle: "HATCH_REV",
  layer: "0",
  order: BigInt(10),
  visible: true,
  patternName: "SOLID",
  isSolid: true,
  loops: [holeLoop, outerLoop], // Delik önce!
};

const resRev = GeometryCompiler.triangulateHatch(hatchReverse);
assert(resRev.mesh, "Ters döngü sırasında üçgen mesh üretilmeli");
const areaRev = computeMeshArea(resRev.mesh.vertices);
const expectedAreaRev = 10000 - 400; // 9600

assert(
  Math.abs(areaRev - expectedAreaRev) < 1.0,
  `Beklenen alan ~${expectedAreaRev}, hesaplanan: ${areaRev}`
);
console.log(`  ✓ Ters döngü sırasında alan başarıyla hesaplandı: ${areaRev} ≈ ${expectedAreaRev} PASS`);

// ----------------------------------------------------------------------------
// TEST 2: Yuvalanmış Adalar (Dış Sınır -> Delik -> İç Ada)
// ----------------------------------------------------------------------------
console.log("\n[TEST 2] Yuvalanmış adalar (Dış -> Delik -> İç Ada)...");

// Dış sınır: 100x100 = 10,000
const lOuter = {
  isPolyline: true,
  vertices: [[0, 0], [100, 0], [100, 100], [0, 100]] as CadPoint2D[],
};

// Delik: 80x80 [10, 10] - [90, 90] = 6,400
const lHole = {
  isPolyline: true,
  vertices: [[10, 10], [90, 10], [90, 90], [10, 90]] as CadPoint2D[],
};

// İç Ada: 40x40 [30, 30] - [70, 70] = 1,600
const lIsland = {
  isPolyline: true,
  vertices: [[30, 30], [70, 30], [70, 70], [30, 70]] as CadPoint2D[],
};

// A) Normal Stil (hatchStyle = 0): Dış Donut (10000 - 6400 = 3600) + İç Ada (1600) = 5200
const hatchNormal: CadHatchEntity = {
  type: "HATCH",
  handle: "HATCH_NORM",
  layer: "0",
  order: BigInt(20),
  visible: true,
  patternName: "SOLID",
  isSolid: true,
  hatchStyle: 0,
  loops: [lOuter, lHole, lIsland],
};

const resNorm = GeometryCompiler.triangulateHatch(hatchNormal);
assert(resNorm.mesh, "Normal stilde mesh üretilmeli");
const areaNorm = computeMeshArea(resNorm.mesh.vertices);
const expectedNorm = (10000 - 6400) + 1600; // 5200
assert(
  Math.abs(areaNorm - expectedNorm) < 1.0,
  `Normal stil alan hatası: beklenen ${expectedNorm}, alınan ${areaNorm}`
);
console.log(`  ✓ Normal stil (Dış + Ada): ${areaNorm} == ${expectedNorm} PASS`);

// B) Outer Stil (hatchStyle = 1): Yalnız Dış Donut (3600), iç ada yok sayılır
const hatchOuterOnly: CadHatchEntity = {
  ...hatchNormal,
  handle: "HATCH_OUTER",
  hatchStyle: 1,
};

const resOuter = GeometryCompiler.triangulateHatch(hatchOuterOnly);
assert(resOuter.mesh, "Outer stilde mesh üretilmeli");
const areaOuter = computeMeshArea(resOuter.mesh.vertices);
const expectedOuter = 10000 - 6400; // 3600
assert(
  Math.abs(areaOuter - expectedOuter) < 1.0,
  `Outer stil alan hatası: beklenen ${expectedOuter}, alınan ${areaOuter}`
);
console.log(`  ✓ Outer stil (Yalnız dış donut): ${areaOuter} == ${expectedOuter} PASS`);

// C) Ignore Stil (hatchStyle = 2): Tüm delikler yok sayılır (10000)
const hatchIgnore: CadHatchEntity = {
  ...hatchNormal,
  handle: "HATCH_IGNORE",
  hatchStyle: 2,
};

const resIgnore = GeometryCompiler.triangulateHatch(hatchIgnore);
assert(resIgnore.mesh, "Ignore stilde mesh üretilmeli");
const areaIgnore = computeMeshArea(resIgnore.mesh.vertices);
const expectedIgnore = 10000;
assert(
  Math.abs(areaIgnore - expectedIgnore) < 1.0,
  `Ignore stil alan hatası: beklenen ${expectedIgnore}, alınan ${areaIgnore}`
);
console.log(`  ✓ Ignore stil (Tüm delikler dolu): ${areaIgnore} == ${expectedIgnore} PASS`);

// ----------------------------------------------------------------------------
// TEST 3: Bulge (Yay Segmenti) İçeren Hatch Döngüsü
// ----------------------------------------------------------------------------
console.log("\n[TEST 3] Bulge (yay bombesi) içeren hatch döngüsü...");

// Yarım daire üst kenar içeren 100x50 dikdörtgen
// [0, 0] -> [100, 0] (düz) -> [100, 50] (düz) -> [0, 50] (bulge = 1 -> yarım daire) -> [0, 0]
const bulgeLoop = {
  isPolyline: true,
  vertices: [
    [0, 0],
    [100, 0],
    [100, 50],
    [0, 50],
  ] as CadPoint2D[],
  bulges: [0, 0, 1, 0], // 3. segment yarım daire
};

const hatchBulge: CadHatchEntity = {
  type: "HATCH",
  handle: "HATCH_BULGE",
  layer: "0",
  order: BigInt(30),
  visible: true,
  patternName: "SOLID",
  isSolid: true,
  loops: [bulgeLoop],
};

const resBulge = GeometryCompiler.triangulateHatch(hatchBulge);
assert(resBulge.mesh, "Bulge içeren döngüde mesh üretilmeli");
// Dikdörtgen alan: 100 * 50 = 5000
// Yarım daire (r=50): 0.5 * pi * 50^2 = ~3927
// Toplam alan ~8927
const areaBulge = computeMeshArea(resBulge.mesh.vertices);
assert(areaBulge > 5000, `Bulge alanı dikdörtgenden büyük olmalı (> 5000): ${areaBulge}`);
assert(areaBulge < 10000, `Bulge alanı mantıklı sınırda olmalı (< 10000): ${areaBulge}`);
console.log(`  ✓ Bulge'lı döngü başarıyla tessellate edildi ve triangulate oldu (Alan: ${areaBulge.toFixed(1)}) PASS`);

// ----------------------------------------------------------------------------
// TEST 4: Dejenere / Bozuk Kontur Dayanıklılığı
// ----------------------------------------------------------------------------
console.log("\n[TEST 4] Bozuk ve dejenere kontur dayanıklılığı...");

const degenerateHatch: CadHatchEntity = {
  type: "HATCH",
  handle: "HATCH_DEGEN",
  layer: "0",
  order: BigInt(40),
  visible: true,
  patternName: "SOLID",
  isSolid: true,
  loops: [
    {
      isPolyline: true,
      vertices: [[0, 0], [10, 10]], // 2 nokta (< 3)
    },
    {
      isPolyline: true,
      vertices: [], // boş
    },
  ],
};

const resDegen = GeometryCompiler.triangulateHatch(degenerateHatch);
assert.strictEqual(resDegen.mesh, null, "Dejenere kontur null mesh dönmeli, çökmemeli");
console.log("  ✓ Dejenere kontur çökmeden zararsız null döndü PASS");

console.log("\n=== TÜM P07 HATCH TOPOLOGY TESTLERİ BAŞARIYLA GEÇTİ (PASS) ===");
