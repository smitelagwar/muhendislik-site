// ============================================================================
// DWG/DXF MOTOR V2 — G09 LAYOUTS, VIEWPORTS & DEPENDENCIES TEST SUITE
// ============================================================================
// Sözleşme: motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md (G09)
// Gereksinimler: R13, R14 | Alt kabul: V12, C02, F06, F15

import { LayoutManager } from "../../src/lib/cad-v2/layout/layout-manager";
import type { CadViewport, CadLayer, CadPoint2D } from "../../src/lib/cad-v2/canonical/types";

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

async function runLayoutViewportTests() {
  console.log("=== DWG/DXF Motor V2 - G09 Model, Pafta, Viewport ve Bağımlılıklar Testi ===");

  // 1. Viewport 2D Affine Dönüşüm Matrisi (Model -> Paper) Doğrulaması (R13, V12, F06)
  console.log("\n[Test 1] Viewport ModelToPaper Affine Dönüşümü (Ölçek, Merkez ve Twist):");
  // Senaryo: Pafta üzerinde merkez (400, 300), boyut (200, 150).
  // Model alanında merkez (1000, 2000), yükseklik 1500 (Ölçek = 150 / 1500 = 0.1)
  const testViewport: CadViewport = {
    id: "VP_01",
    layoutId: "Layout1",
    center: [400, 300],
    width: 200,
    height: 150,
    viewCenter: [1000, 2000],
    viewHeight: 1500,
    frozenLayers: [],
  };

  const mat = LayoutManager.computeModelToPaper(testViewport);
  // Model merkezinin paftadaki karşılığı viewport merkezi (400, 300) olmalıdır
  const pPaperCenter = LayoutManager.transformPoint([1000, 2000], mat);
  assert(
    approxEqual(pPaperCenter[0], 400) && approxEqual(pPaperCenter[1], 300),
    `Model merkezi paftada viewport merkezine dönüştü: [${pPaperCenter[0]}, ${pPaperCenter[1]}]`
  );

  // Modelde (1000, 2750) noktası: dY = +750. 0.1 ölçekle dY_paper = +75. Paftada Y = 375 olmalı
  const pPaperTop = LayoutManager.transformPoint([1000, 2750], mat);
  assert(approxEqual(pPaperTop[1], 375), `Model üst noktası paftada doğru: Y = ${pPaperTop[1]} (Beklenen: 375)`);

  // 2. Terslenebilirlik (Invertibility): PaperToModel(ModelToPaper(P)) == P (C02)
  console.log("\n[Test 2] Dönüşüm Matrisi Terslenebilirliği (PaperToModel):");
  const invMat = LayoutManager.computePaperToModel(mat);
  assert(invMat !== null, "Ters matris başarıyla hesaplandı");
  const pModelRestored = LayoutManager.transformPoint(pPaperTop, invMat!);
  assert(
    approxEqual(pModelRestored[0], 1000) && approxEqual(pModelRestored[1], 2750),
    `Ters dönüşüm modeli aslına geri getirdi: [${pModelRestored[0]}, ${pModelRestored[1]}]`
  );

  // 3. Viewport Twist (Döndürülmüş Görünüm) (R13, V12)
  console.log("\n[Test 3] Viewport Twist (Görünüm Açısı Rotasyonu):");
  const twistedViewport: CadViewport = {
    ...testViewport,
    id: "VP_TWIST",
    // 90 derece saat yönünün tersi twist
    ...( { twistAngleRad: Math.PI / 2 } as any ),
  };
  const twistMat = LayoutManager.computeModelToPaper(twistedViewport);
  // Twist varken model dY (+750) -> kağıt dX (+75) olmalı
  const pTwist = LayoutManager.transformPoint([1000, 2750], twistMat);
  assert(
    approxEqual(pTwist[0], 475) && approxEqual(pTwist[1], 300),
    `90 derece twistli nokta doğru hesaplandı: [${pTwist[0]}, ${pTwist[1]}] (Beklenen: [475, 300])`
  );

  // 4. Liang-Barsky 2D Çizgi Kırpma (Viewport Sınırları Dışına Taşmayı Önleme) (R13, V12)
  console.log("\n[Test 4] Viewport Sınırlarında Çizgi Kırpma (Liang-Barsky):");
  const vpBBox = LayoutManager.getViewportPaperBBox(testViewport); // [300, 225, 500, 375]
  // Çizgi: (200, 300) -> (600, 300) (Viewport'u yatayda delip geçiyor)
  const clipped = LayoutManager.clipLineToBBox([200, 300], [600, 300], vpBBox);
  assert(clipped !== null, "Çizgi başarıyla kırpıldı");
  assert(
    approxEqual(clipped![0][0], 300) && approxEqual(clipped![1][0], 500),
    `Kırpılan çizgi tam viewport sınırlarında: X = [${clipped![0][0]}, ${clipped![1][0]}]`
  );

  // Tamamen dışarıdaki çizgi null dönmeli
  const outsideLine = LayoutManager.clipLineToBBox([10, 10], [50, 50], vpBBox);
  assert(outsideLine === null, "Dışarıdaki çizgi beklendiği gibi reddedildi (null)");

  // 5. Paftada İki Farklı Viewport ve Katman Dondurma Oracles'ı (R12, R13, C02)
  console.log("\n[Test 5] Aynı Paftada İki Viewport ve Farklı Katman Dondurma:");
  const testLayers: Record<string, CadLayer> = {
    WALL: { id: "WALL", name: "WALL", visible: true, frozen: false, locked: false, color: { method: "byLayer" }, lineweightMm: 0.5, linetypeName: "Continuous" },
    ELECTRICAL: { id: "ELECTRICAL", name: "ELECTRICAL", visible: true, frozen: false, locked: false, color: { method: "byLayer" }, lineweightMm: 0.25, linetypeName: "Continuous" },
    FROZEN_GLOBAL: { id: "FROZEN_GLOBAL", name: "FROZEN_GLOBAL", visible: true, frozen: true, locked: false, color: { method: "byLayer" }, lineweightMm: 0, linetypeName: "Continuous" },
  };

  const vpMimari: CadViewport = {
    id: "VP_MIMARI",
    layoutId: "Pafta1",
    center: [200, 200],
    width: 300,
    height: 300,
    viewCenter: [0, 0],
    viewHeight: 1000,
    frozenLayers: ["ELECTRICAL"], // Elektrik katmanı mimari görünümde dondurulmuş!
  };

  const vpElektrik: CadViewport = {
    id: "VP_ELEKTRIK",
    layoutId: "Pafta1",
    center: [600, 200],
    width: 300,
    height: 300,
    viewCenter: [0, 0],
    viewHeight: 1000,
    frozenLayers: [], // Elektrik katmanı açık
  };

  assert(LayoutManager.isLayerVisible("WALL", testLayers, vpMimari), "Duvar katmanı Mimari viewport'ta görünür");
  assert(!LayoutManager.isLayerVisible("ELECTRICAL", testLayers, vpMimari), "Elektrik katmanı Mimari viewport'ta donduruldu (gizli)");
  assert(LayoutManager.isLayerVisible("ELECTRICAL", testLayers, vpElektrik), "Elektrik katmanı Elektrik viewport'ta görünür");
  assert(!LayoutManager.isLayerVisible("FROZEN_GLOBAL", testLayers, vpElektrik), "Global dondurulan katman hiçbir viewport'ta görünmez");

  // 6. XREF Bağımlılık Grafiği Güvenlik ve Döngü Kontrolü (R14, F15)
  console.log("\n[Test 6] XREF Döngüsel Referans ve Path Traversal Güvenliği:");
  // A -> B -> C -> A (Döngüsel XREF)
  const cyclicXrefs = [
    { id: "B.dwg", parentId: "A.dwg", filePath: "sub/B.dwg" },
    { id: "C.dwg", parentId: "B.dwg", filePath: "sub/C.dwg" },
    { id: "A.dwg", parentId: "C.dwg", filePath: "sub/A.dwg" },
  ];
  const cycleRes = LayoutManager.validateXrefGraph("A.dwg", cyclicXrefs);
  assert(!cycleRes.isValid, "Döngüsel XREF grafiği başarıyla tespit edildi ve engellendi");
  assert(
    cycleRes.diagnostics.some((d) => d.code === "ERR_CYCLIC_XREF_DETECTED"),
    "ERR_CYCLIC_XREF_DETECTED tanısı üretildi"
  );

  // Path Traversal saldırısı: ../../secret.dwg
  const maliciousXrefs = [
    { id: "ATTACK.dwg", parentId: "A.dwg", filePath: "../../etc/passwd.dwg" },
  ];
  const secRes = LayoutManager.validateXrefGraph("A.dwg", maliciousXrefs);
  assert(!secRes.isValid, "Path Traversal girişimi başarıyla engellendi");
  assert(
    secRes.diagnostics.some((d) => d.code === "SEC_PATH_TRAVERSAL_DETECTED"),
    "SEC_PATH_TRAVERSAL_DETECTED tanısı üretildi"
  );

  console.log("\n=== G09 MODEL, PAFTA, VIEWPORT VE BAĞIMLILIKLAR TESTLERİ BAŞARIYLA GEÇTİ (6/6 PASS) ===");
}

runLayoutViewportTests().catch((err) => {
  console.error("Test hatası:", err);
  process.exit(1);
});
