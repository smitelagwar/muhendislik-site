// ============================================================================
// DWG/DXF MOTOR V2 — G08 GEOMETRY, CURVES, HATCH & DRAW ORDER TEST SUITE
// ============================================================================
// Sözleşme: motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md (G08)
// Gereksinimler: R07, R10, R11, R45 | Alt kabul: V05, V06, V07, V08, V10, V11, F08, F09, F12, F13, F14

import fs from "node:fs";
import path from "node:path";
import { GeometryCompiler } from "../../src/lib/cad-v2/compile/geometry-compiler";
import type {
  CadArcEntity,
  CadEllipseEntity,
  CadLwPolylineEntity,
  CadSplineEntity,
  CadHatchEntity,
  CadWipeoutEntity,
} from "../../src/lib/cad-v2/canonical/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

function approxEqual(a: number, b: number, eps = 1e-3): boolean {
  return Math.abs(a - b) <= eps;
}

// Poligon üçgenlerinin toplam alanını hesapla
function computeTrianglesArea(vertices: Float32Array): number {
  let totalArea = 0;
  for (let i = 0; i < vertices.length; i += 6) {
    const x0 = vertices[i];
    const y0 = vertices[i + 1];
    const x1 = vertices[i + 2];
    const y1 = vertices[i + 3];
    const x2 = vertices[i + 4];
    const y2 = vertices[i + 5];

    // İki boyutlu üçgen alanı: 0.5 * |x0(y1-y2) + x1(y2-y0) + x2(y0-y1)|
    const triArea = 0.5 * Math.abs(x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1));
    totalArea += triArea;
  }
  return totalArea;
}

async function runGeometryCurvesHatchTests() {
  console.log("=== DWG/DXF Motor V2 - G08 Eğri, Hatch, Çizgi ve Çizim Sırası Testi ===");

  // 1. ARC Tessellation & Sagitta Hata Sınırı Doğrulaması (R07, V07)
  console.log("\n[Test 1] Yay (ARC) Uyarlamalı Tessellation ve Hata Sınırı (<= 0.25 CSS px):");
  const arcRadius = 100;
  const arcPts = GeometryCompiler.tessellateArc([0, 0], arcRadius, 0, Math.PI / 2, false, 0.25);
  assert(arcPts.length >= 8, `Yay yeterli sayıda segmente bölündü: ${arcPts.length} nokta`);
  assert(approxEqual(arcPts[0][0], 100) && approxEqual(arcPts[0][1], 0), "Yay başlangıç noktası doğru (100, 0)");
  assert(
    approxEqual(arcPts[arcPts.length - 1][0], 0) && approxEqual(arcPts[arcPts.length - 1][1], 100),
    "Yay bitiş noktası doğru (0, 100)"
  );

  // Tüm noktaların yarıçapı r olmalı
  let maxSagittaError = 0;
  for (let i = 0; i < arcPts.length - 1; i++) {
    const p1 = arcPts[i];
    const p2 = arcPts[i + 1];
    const midX = (p1[0] + p2[0]) / 2;
    const midY = (p1[1] + p2[1]) / 2;
    const midDist = Math.hypot(midX, midY);
    const sagitta = arcRadius - midDist;
    if (sagitta > maxSagittaError) maxSagittaError = sagitta;
  }
  assert(maxSagittaError <= 0.25, `Sagitta hata sınırı sağlandı: ${maxSagittaError.toFixed(4)} <= 0.25 px`);

  // 2. ELLIPSE Tessellation (R07, F12)
  console.log("\n[Test 2] Elips (ELLIPSE) Tessellation:");
  const majorVec: [number, number] = [200, 0];
  const axisRatio = 0.5; // Minör yarıçap = 100
  const ellipsePts = GeometryCompiler.tessellateEllipse([50, 50], majorVec, axisRatio, 0, Math.PI * 2);
  assert(ellipsePts.length >= 16, `Elips noktaları üretildi: ${ellipsePts.length} nokta`);
  // Majör uç nokta: [50 + 200, 50] = [250, 50]
  assert(approxEqual(ellipsePts[0][0], 250) && approxEqual(ellipsePts[0][1], 50), "Elips majör uç noktası doğru: [250, 50]");

  // 3. LWPOLYLINE Bulge (Yay Bombesi) Açılımı (R07, F12)
  console.log("\n[Test 3] LWPOLYLINE Bulge (Yay Bombesi) Açılımı:");
  // Yarı daire: P1(-50, 0), P2(50, 0), bulge = 1 (R = 50, merkez = (0, 0))
  const bulgePts = GeometryCompiler.tessellateBulgeSegment([-50, 0], [50, 0], 1, 0.25);
  assert(bulgePts.length >= 8, `Bulge segmenti üretildi: ${bulgePts.length} nokta`);
  assert(approxEqual(bulgePts[0][0], -50) && approxEqual(bulgePts[0][1], 0), "Bulge başlangıç noktası doğru");
  assert(approxEqual(bulgePts[bulgePts.length - 1][0], 50) && approxEqual(bulgePts[bulgePts.length - 1][1], 0), "Bulge bitiş noktası doğru");

  // LWPOLYLINE genel açılımı (düz çizgiler + bulge'lu segment)
  const testPolyline: CadLwPolylineEntity = {
    handle: "PL_1",
    type: "LWPOLYLINE",
    layer: "WALL",
    order: BigInt(10),
    isClosed: true,
    vertices: [
      { x: 0, y: 0, bulge: 1 }, // (0, 0) -> (100, 0) yay
      { x: 100, y: 0, bulge: 0 }, // (100, 0) -> (100, 50) düz çizgi
      { x: 100, y: 50, bulge: 0 },
      { x: 0, y: 50, bulge: 0 },
    ],
  };
  const expandedPoly = GeometryCompiler.expandLwPolyline(testPolyline);
  assert(expandedPoly.lineSegments.length > 5, `Bulge içeren polyline başarıyla açıldı: ${expandedPoly.lineSegments.length} segment`);

  // 4. LWPOLYLINE Sabit Genişlik (Constant Width / Quads) (V05, F09)
  console.log("\n[Test 4] Polyline Genişliği (Width / Quads) Triangülasyonu:");
  const thickPolyline: CadLwPolylineEntity = {
    handle: "PL_THICK",
    type: "LWPOLYLINE",
    layer: "ROAD",
    order: BigInt(15),
    isClosed: false,
    constantWidth: 10,
    vertices: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ],
  };
  const thickRes = GeometryCompiler.expandLwPolyline(thickPolyline);
  assert(thickRes.thickTriangles !== null, "Kalın polyline için üçgenler üretildi");
  // 2 segment x 2 üçgen x 3 köşe = 12 köşe (24 float)
  assert(thickRes.thickTriangles!.vertices.length === 24, `Üçgen köşe sayısı doğru: ${thickRes.thickTriangles!.vertices.length}`);

  // 5. B-Spline / NURBS De Boor Algoritması (R07, V07)
  console.log("\n[Test 5] B-Spline De Boor Algoritması:");
  const testSpline: CadSplineEntity = {
    handle: "SP_1",
    type: "SPLINE",
    layer: "CONTOUR",
    order: BigInt(20),
    degree: 3,
    controlPoints: [
      [0, 0],
      [10, 50],
      [50, 50],
      [60, 0],
    ],
    knots: [0, 0, 0, 0, 1, 1, 1, 1], // Clamped B-spline
  };
  const splinePts = GeometryCompiler.tessellateSpline(testSpline);
  assert(splinePts.length >= 32, `B-spline noktaları üretildi: ${splinePts.length} nokta`);
  assert(approxEqual(splinePts[0][0], 0) && approxEqual(splinePts[0][1], 0), "B-spline başlangıç kontrol noktası doğru");
  assert(
    approxEqual(splinePts[splinePts.length - 1][0], 60) && approxEqual(splinePts[splinePts.length - 1][1], 0),
    "B-spline bitiş kontrol noktası doğru"
  );

  // 6. HATCH Triangulation (earcut 3.2.3 ile delik ve iç ada desteği) (R10, V10, F13)
  console.log("\n[Test 6] HATCH Üçgenleme ve İç Delik/Ada Topolojisi:");
  // fixtures-manifest.json SYN-HATCH-HOLES örneği:
  // Dış döngü 200x200 (alan = 40000), İç delik 100x100 [50..150, 50..150] (alan = 10000)
  // Beklenen net alan = 30000
  const testHatch: CadHatchEntity = {
    handle: "HATCH_1",
    type: "HATCH",
    layer: "HATCH_LYR",
    order: BigInt(25),
    patternName: "SOLID",
    isSolid: true,
    loops: [
      {
        isPolyline: true,
        vertices: [
          [0, 0],
          [200, 0],
          [200, 200],
          [0, 200],
        ],
      },
      {
        isPolyline: true,
        vertices: [
          [50, 50],
          [150, 50],
          [150, 150],
          [50, 150],
        ],
      },
    ],
  };

  const hatchRes = GeometryCompiler.triangulateHatch(testHatch);
  assert(hatchRes.mesh !== null, "Hatch üçgenleme başarıyla tamamlandı");
  const hatchArea = computeTrianglesArea(hatchRes.mesh!.vertices);
  assert(
    approxEqual(hatchArea, 30000, 1.0),
    `Hatch delik alanı doğru çıkarıldı: ${hatchArea} (Beklenen: 30000)`
  );
  assert(hatchRes.boundaryLines.length === 8, `Sınır çizgileri doğru: ${hatchRes.boundaryLines.length} (4 dış + 4 iç)`);

  // 7. WIPEOUT Arka Plan Maskeleme (R11, V11, F14)
  console.log("\n[Test 7] WIPEOUT Arka Plan Maskeleme Triangülasyonu:");
  const testWipeout: CadWipeoutEntity = {
    handle: "WIPE_1",
    type: "WIPEOUT",
    layer: "ANNOTATION",
    order: BigInt(30),
    vertices: [
      [10, 10],
      [90, 10],
      [90, 40],
      [10, 40],
    ],
  };
  const wipeoutMesh = GeometryCompiler.triangulateWipeout(testWipeout);
  assert(wipeoutMesh !== null, "Wipeout üçgenleme başarılı");
  assert(wipeoutMesh!.isWipeout === true, "Wipeout bayrağı işaretlendi");
  const wipeoutArea = computeTrianglesArea(wipeoutMesh!.vertices);
  assert(approxEqual(wipeoutArea, 80 * 30, 0.1), `Wipeout alanı doğru: ${wipeoutArea} (Beklenen: 2400)`);

  // 8. Linetype Faz Sürekliliği (R11, V06, F14)
  console.log("\n[Test 8] Linetype (Kesikli Çizgi) Faz Sürekliliği:");
  // Çizgi tipi deseni: 10 birim çizgi, 5 birim boşluk (toplam periyot = 15)
  const pattern = [10, -5];
  // 3 segmentli bir yol: (0,0)->(12,0)->(25,0)->(30,0). Toplam uzunluk = 30 (tam 2 periyot)
  const polylinePath: Array<[number, number]> = [
    [0, 0],
    [12, 0], // segment 1: 12 birim. İlk 10 çizgi, sonra 2 boşluk. Kalan boşluk: 3 birim.
    [25, 0], // segment 2: 13 birim. İlk 3 boşluk, sonra 10 çizgi.
    [30, 0], // segment 3: 5 birim. 5 boşluk.
  ];
  const linetypeRes = GeometryCompiler.applyLinetype(polylinePath, pattern, 1.0, 0);
  assert(linetypeRes.segments.length >= 2, `Kesikli çizgiler faz sıfırlanmadan üretildi: ${linetypeRes.segments.length} parça`);
  assert(approxEqual(linetypeRes.finalPhase, 0, 1e-4), "Toplam 30 birimlik yolda periyot tam kapandı (finalPhase = 0)");

  console.log("\n=== G08 GEOMETRY, CURVES & HATCH TESTLERİ BAŞARIYLA GEÇTİ (8/8 PASS) ===");
}

runGeometryCurvesHatchTests().catch((err) => {
  console.error("Test hatası:", err);
  process.exit(1);
});
