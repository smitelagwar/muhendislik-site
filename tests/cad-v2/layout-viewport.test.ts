// ============================================================================
// DWG/DXF MOTOR V2 — G09 LAYOUTS, VIEWPORTS & DEPENDENCIES TEST SUITE
// ============================================================================
// Sözleşme: motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md (G09)
// Gereksinimler: R13, R14 | Alt kabul: V12, C02, F06, F15

import fs from "node:fs";
import path from "node:path";
import { LayoutManager } from "../../src/lib/cad-v2/layout/layout-manager";
import type { CadViewport, CadLayer, CadPoint2D, CadCanonicalDocument } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { parseSceneChunk, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";
import { parseDxfToCanonical } from "../../src/lib/cad-v2/decode/dxf-adapter";
import { parseDwgToCanonical } from "../../src/lib/cad-v2/decode/dwg-adapter";
import { resolveDwgInsertSpatialFilter } from "../../src/lib/cad-v2/decode/dwg-spatial-filter";
import { evaluateDocumentQuality } from "../../src/lib/cad-v2/canonical/diagnostics";

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

function isExactlyOneWorldSegment(
  xy: Float32Array,
  origin: Float64Array,
  expectedA: CadPoint2D,
  expectedB: CadPoint2D,
  eps = 3e-4
): boolean {
  if (xy.length !== 4 || origin.length < 2) return false;
  const actualA: CadPoint2D = [xy[0] + origin[0], xy[1] + origin[1]];
  const actualB: CadPoint2D = [xy[2] + origin[0], xy[3] + origin[1]];
  const pointMatches = (actual: CadPoint2D, expected: CadPoint2D) =>
    approxEqual(actual[0], expected[0], eps) && approxEqual(actual[1], expected[1], eps);
  return (
    (pointMatches(actualA, expectedA) && pointMatches(actualB, expectedB)) ||
    (pointMatches(actualA, expectedB) && pointMatches(actualB, expectedA))
  );
}

function hasWorldSegment(
  xy: Float32Array,
  origin: Float64Array,
  expectedA: CadPoint2D,
  expectedB: CadPoint2D,
  eps = 3e-4
): boolean {
  const pointMatches = (x: number, y: number, expected: CadPoint2D) =>
    approxEqual(x + origin[0], expected[0], eps) && approxEqual(y + origin[1], expected[1], eps);
  for (let i = 0; i + 3 < xy.length; i += 4) {
    if (
      (pointMatches(xy[i], xy[i + 1], expectedA) && pointMatches(xy[i + 2], xy[i + 3], expectedB)) ||
      (pointMatches(xy[i], xy[i + 1], expectedB) && pointMatches(xy[i + 2], xy[i + 3], expectedA))
    ) return true;
  }
  return false;
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

  const safeXref = LayoutManager.resolveXrefAsset("refs\\site plan.dwg", ["C:\\cad\\project\\refs"]);
  assert(safeXref.isAllowed && safeXref.resolvedPath === "C:/cad/project/refs/refs/site plan.dwg", "Göreli XREF yolu izinli kök altında normalize edildi");
  for (const unsafePath of ["../secret.dwg", "folder/../../secret.dwg", "C:\\temp\\outside.dwg", "\\\\server\\share\\x.dwg", "/etc/passwd", "https://example.test/x.dwg", "file:///C:/secret.dwg", "%2e%2e/secret.dwg", "safe.dwg\u0000.dwg"]) {
    assert(!LayoutManager.resolveXrefAsset(unsafePath, ["C:/cad/project"]).isAllowed, `Güvensiz XREF yolu reddedildi: ${JSON.stringify(unsafePath)}`);
  }
  assert(!LayoutManager.resolveXrefAsset("ref.dwg", ["relative/base"]).isAllowed, "Göreli allowlist tabanı reddedildi");
  const unresolvedXrefQuality = evaluateDocumentQuality({
    sourceVersionKey: "xref-test", sourceSha256: "xref-test", acadVersion: "AC1032", codepage: "UTF-8", units: 0, measurement: 1,
    layers: {}, linetypes: {}, textStyles: {}, layouts: {}, viewports: {}, paperSpaceEntities: {}, diagnostics: [],
    blocks: { "SITE_XREF": { name: "SITE_XREF", basePoint: [0, 0], entities: [], isXref: true, xrefPath: "refs/site.dwg" } },
    modelSpaceEntities: [{ handle: "XREF_INSERT", type: "INSERT", layer: "0", order: BigInt(1), blockName: "SITE_XREF", insertionPoint: [0, 0], scale: [1, 1, 1], rotationRad: 0 }],
  } as unknown as CadCanonicalDocument);
  assert(unresolvedXrefQuality.diagnosticCodes.includes("UNRESOLVED_XREF"), "Geometri içermeyen external block sahne kalitesinde açık UNRESOLVED_XREF tanısı üretir");

  const xclipDictionaries = new Map([
    ["A", { handle: "A", entries: { ACAD_FILTER: "B" } }],
    ["B", { handle: "B", entries: { SPATIAL: "C" } }],
  ]);
  const validXclip = { handle: "C", ownerHandle: "B" };
  const resolvedXclipLink = resolveDwgInsertSpatialFilter({ ownerDictionaryHardId: "A" }, xclipDictionaries, new Map([["C", validXclip]]));
  assert(resolvedXclipLink.present && resolvedXclipLink.filter === validXclip, "DWG XCLIP handle zinciri owner doğrulamasıyla çözümlenir");
  const danglingXclipLink = resolveDwgInsertSpatialFilter({ ownerDictionaryHardId: "A" }, xclipDictionaries, new Map());
  assert(danglingXclipLink.present && !danglingXclipLink.filter, "Kopuk XCLIP handle zinciri clip var ama çözümsüz olarak işaretlenir");
  const noXclipLink = resolveDwgInsertSpatialFilter({ ownerDictionaryHardId: "A" }, new Map([["A", { entries: {} }]]), new Map());
  assert(!noXclipLink.present, "XCLIP SPATIAL girdisi olmayan normal INSERT etkilenmez");

  // 7. F06 çokgen clip: normal/ters, köşe teması, sınır boyunca çizgi ve bozuk koordinat
  console.log("\n[Test 7] Polygon XCLIP Normal/Ters ve Sınır Durumları:");
  const square: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]];
  const insideParts = LayoutManager.clipLineToPolygon([-5, 5], [15, 5], square);
  assert(insideParts.length === 1, "Normal clip tek iç aralık üretmeli");
  assert(approxEqual(insideParts[0][0][0], 0) && approxEqual(insideParts[0][1][0], 10), "Normal clip çokgen sınırlarında bitmeli");

  const outsideParts = LayoutManager.clipLineToPolygon([-5, 5], [15, 5], square, true);
  assert(outsideParts.length === 2, "Inverted clip iki dış aralık üretmeli");
  assert(approxEqual(outsideParts[0][0][0], -5) && approxEqual(outsideParts[0][1][0], 0), "Inverted clip sol dış parçayı korumalı");
  assert(approxEqual(outsideParts[1][0][0], 10) && approxEqual(outsideParts[1][1][0], 15), "Inverted clip sağ dış parçayı korumalı");

  const boundaryParts = LayoutManager.clipLineToPolygon([-5, 0], [15, 0], square);
  assert(boundaryParts.length === 1, "Çokgen kenarı boyunca giden çizgi tek parça kalmalı");
  assert(approxEqual(boundaryParts[0][0][0], 0) && approxEqual(boundaryParts[0][1][0], 10), "Kenar çizgisi sınır boyunca kırpılmalı");

  assert(LayoutManager.clipLineToPolygon([5, 5], [5, 5], square).length === 1, "İçerideki sıfır uzunluklu parça korunmalı");
  assert(LayoutManager.clipLineToPolygon([15, 5], [15, 5], square).length === 0, "Dışarıdaki sıfır uzunluklu parça elenmeli");
  assert(LayoutManager.clipLineToPolygon([Number.NaN, 0], [1, 1], square).length === 0, "Sonlu olmayan koordinat clip çıktısına taşmamalı");

  // 8. Gerçek compiler çıktısında Model / paper ayrımı, viewport projeksiyonu ve clip.
  console.log("\n[Test 8] F06 Layout sahnesi ve viewport geometry compiler kabul testi:");
  const sceneDoc = {
    sourceVersionKey: "f06-layout-test", sourceSha256: "f06-layout-test-sha", acadVersion: "AC1027", codepage: "UTF-8",
    units: 4, measurement: 1,
    layers: {
      A: { id: "A", name: "A", visible: true, frozen: false, locked: false, color: { method: "rgb", rgb: [255, 0, 0] }, lineweightMm: 0.35, linetypeName: "Continuous" },
      B: { id: "B", name: "B", visible: true, frozen: false, locked: false, color: { method: "rgb", rgb: [0, 0, 255] }, lineweightMm: 0.25, linetypeName: "Continuous" },
    },
    linetypes: {}, textStyles: {}, blocks: {},
    layouts: {
      Model: { id: "Model", name: "Model", isModelSpace: true, bbox: [-20, -20, 20, 20] },
      Sheet: { id: "Sheet", name: "Sheet A3", isModelSpace: false, bbox: [0, 0, 200, 150], viewportIds: ["VP1"] },
    },
    viewports: { VP1: { id: "VP1", layoutId: "Sheet", order: BigInt(1), center: [0, 0], width: 20, height: 10, viewCenter: [0, 0], viewHeight: 10, frozenLayers: ["B"], layerOverrides: { A: { color: { method: "rgb", rgb: [0, 255, 0] }, lineweightMm: 0.7 } } } },
    modelSpaceEntities: [
      { handle: "M1", type: "LINE", layer: "A", order: BigInt(1), start: [-20, 0], end: [20, 0] },
      { handle: "M2", type: "LINE", layer: "B", order: BigInt(2), start: [-5, 2], end: [5, 2] },
    ],
    paperSpaceEntities: { Sheet: [{ handle: "P1", type: "LINE", layer: "A", order: BigInt(2), start: [100, 100], end: [110, 100] }] },
    diagnostics: [],
  } as unknown as CadCanonicalDocument;
  const compiledScene = compileCanonicalToScene(sceneDoc, { sceneId: "scene_f06_layout_test" });
  assert(compiledScene.manifest.layouts.length === 2, "Manifest exposes Model and paper layout separately");
  const sheetInfo = compiledScene.manifest.layouts.find((layout) => layout.layoutId === "Sheet");
  assert(sheetInfo?.kind === "paper" && sheetInfo.sourceName === "Sheet A3", "Paper layout source identity is preserved");
  const sheetChunkRef = compiledScene.manifest.chunks.find((chunk) => chunk.layoutId === "Sheet");
  const modelChunkRef = compiledScene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
  assert(Boolean(sheetChunkRef && modelChunkRef && sheetChunkRef.chunkId !== modelChunkRef.chunkId), "Model and paper geometry use distinct chunks");
  const sheetChunk = parseSceneChunk(compiledScene.chunks.get(sheetChunkRef!.chunkId)!);
  const meta = sheetChunk.sections.get(SceneTag.META)!.data as Uint8Array;
  const metaText = new TextDecoder().decode(meta);
  const sheetMeta = JSON.parse(metaText);
  assert(sheetMeta.layoutId === "Sheet", "Serialized chunk metadata identifies the selected paper layout");
  assert(sheetMeta.layerRuns.every((run: { layer: string }) => run.layer !== "B"), "Viewport frozen layer is excluded from projected geometry");
  assert(sheetMeta.layerRuns.some((run: { color: number[]; lineweightMm?: number }) => run.color[1] > 0.99 && run.color[0] < 0.01 && run.lineweightMm === 0.7), "Viewport layer color and lineweight overrides reach the compiled draw run");
  const xy = sheetChunk.sections.get(SceneTag.XY)!.data as Float32Array;
  const origin = sheetChunk.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  const worldX = [xy[0] + origin[0], xy[2] + origin[0]].sort((a, b) => a - b);
  assert(approxEqual(worldX[0], -10) && approxEqual(worldX[1], 10), "Viewport model line is transformed and clipped to the paper viewport");
  assert(sheetInfo?.bbox.join(",") === "0,0,200,150", "Paper layout bounds come from the layout, not viewport/model geometry");

  const multiLayoutFixture = path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/multi-layout-model-paperspace.dxf");
  const decodedMultiLayout = await parseDxfToCanonical(fs.readFileSync(multiLayoutFixture));
  assert(Boolean(decodedMultiLayout.layouts.Layout1 && !decodedMultiLayout.layouts.Layout1.isModelSpace), "DXF Object LAYOUT table produces its named paper layout");
  assert(Boolean(decodedMultiLayout.paperSpaceEntities?.Layout1?.some((entity) => entity.type === "TEXT")), "Paper-space entity ownership is assigned to the matching named layout");
  const decodedScene = compileCanonicalToScene(decodedMultiLayout, { sceneId: "scene_f06_decoded_dxf" });
  assert(decodedScene.manifest.chunks.some((chunk) => chunk.layoutId === "Layout1"), "Decoded DXF paper content reaches a layout-specific compiled chunk");

  const viewportDxf = fs.readFileSync(multiLayoutFixture, "utf8");
  const viewportEntity = [
    "0", "VIEWPORT", "5", "40", "100", "AcDbEntity", "8", "0", "67", "1", "410", "Layout1",
    "100", "AcDbViewport", "10", "100.0", "20", "75.0", "30", "0.0", "40", "100.0", "41", "150.0",
    "12", "25.0", "22", "10.0", "17", "1000.0", "27", "2000.0", "37", "0.0",
    "16", "0.0", "26", "0.0", "36", "1.0", "45", "500.0", "51", "30.0", "68", "2", "69", "2", "331", "6", "0",
  ].join("\n");
  const viewportSource = viewportDxf.replace(/0\r?\nENDSEC\r?\n0\r?\nSECTION\r?\n2\r?\nOBJECTS/, `${viewportEntity}\nENDSEC\n0\nSECTION\n2\nOBJECTS`);
  assert(viewportSource !== viewportDxf, "Synthetic viewport was inserted into the known paper-space DXF fixture");
  const decodedViewportDoc = await parseDxfToCanonical(Buffer.from(viewportSource));
  const decodedViewport = Object.values(decodedViewportDoc.viewports)[0];
  assert(Boolean(decodedViewport), "DXF VIEWPORT entity is decoded from the paper-space block");
  assert(decodedViewport?.layoutId === "Layout1", "DXF VIEWPORT remains associated with its owning paper layout");
  assert(decodedViewport?.center[0] === 100 && decodedViewport.center[1] === 75 && decodedViewport.width === 150 && decodedViewport.height === 100, "DXF paper center and viewport width/height fields are mapped correctly");
  assert(approxEqual(decodedViewport!.viewCenter[0], 1016.6506351) && approxEqual(decodedViewport!.viewCenter[1], 2021.1602540), "DXF DCS view center and WCS target are combined with the 30-degree twist");
  assert(decodedViewport?.frozenLayers.includes("0"), "DXF viewport frozen-layer object ID resolves to its layer name");

  const systemViewportSource = viewportSource.replace(/69\r?\n2(?=\r?\n331)/, "69\n1");
  assert(systemViewportSource !== viewportSource, "Synthetic DXF system viewport number was changed to group 69 value 1");
  const decodedSystemViewportDoc = await parseDxfToCanonical(Buffer.from(systemViewportSource));
  assert(Object.keys(decodedSystemViewportDoc.viewports).length === 0, "DXF paper-space system viewport 1 is excluded from model projections");

  // AutoCAD LT-authored binary fixture: one paper TEXT, two active model
  // viewports (numbers 2 and 3), plus AutoCAD's system viewport 1.
  console.log("\n[Test 9] AutoCAD DWG gerçek fixture'ında paper ownership ve system viewport elemesi:");
  const autocadDwgFixture = path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/f06-autocad-layout-viewport.dwg");
  assert(fs.existsSync(autocadDwgFixture), "AutoCAD tarafından üretilen F06 DWG fixture repoda mevcut");
  const decodedAutoCAD = await parseDwgToCanonical(fs.readFileSync(autocadDwgFixture));
  const autoCADLayout = Object.values(decodedAutoCAD.layouts).find((layout) => layout.name === "F06_SHEET");
  assert(Boolean(autoCADLayout && !autoCADLayout.isModelSpace), "AutoCAD DWG fixture named paper layout'ı çözümlendi");
  assert(Boolean(decodedAutoCAD.paperSpaceEntities?.[autoCADLayout!.id]?.some((entity) => entity.type === "TEXT")), "AutoCAD DWG paper TEXT doğru layout block'una bağlandı");
  assert(!decodedAutoCAD.modelSpaceEntities.some((entity) => entity.type === "TEXT" && (entity as any).text === "F06 PAPER SPACE CONTROL"), "Aynı paper TEXT modelSpaceEntities içine kopyalanmıyor");
  const autoCADViewports = Object.values(decodedAutoCAD.viewports).filter((viewport) => viewport.layoutId === autoCADLayout!.id);
  assert(autoCADViewports.length === 2, `Sistem viewport'u elenip iki aktif model viewport'u kaldı (${autoCADViewports.length})`);
  assert(autoCADViewports.map((viewport) => viewport.viewportNumber).sort().join(",") === "2,3", "AutoCAD aktif viewport numaraları 2 ve 3 korunuyor");
  assert(!autoCADViewports.some((viewport) => viewport.viewportNumber === 1), "AutoCAD system viewport 1 canonical projeksiyona taşınmıyor");
  const autoCADScene = compileCanonicalToScene(decodedAutoCAD, { sceneId: "scene_f06_autocad_fixture" });
  assert(autoCADScene.manifest.chunks.some((chunk) => chunk.layoutId === autoCADLayout!.id), "AutoCAD paper layout fixture derleyicide layout chunk'ı üretiyor");

  const autoCADXclipFixture = path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/f06-autocad-xclip.dwg");
  assert(fs.existsSync(autoCADXclipFixture), "AutoCAD tarafından üretilen gerçek DWG XCLIP fixture repoda mevcut");
  const decodedAutoCADXclip = await parseDwgToCanonical(fs.readFileSync(autoCADXclipFixture));
  const xclippedInsert = decodedAutoCADXclip.modelSpaceEntities.find((entity) => entity.type === "INSERT" && (entity as any).blockName === "F06_XCLIP_BLOCK_CLEAN");
  assert(decodedAutoCADXclip.modelSpaceEntities.length === 1, "AutoCAD XCLIP fixture model space contains only the intended INSERT, no un-clipped control geometry");
  const xclip = (xclippedInsert as any)?.clipBoundary;
  assert(Boolean(xclip && xclip.boundaryVertices.length === 4), "SPATIAL_FILTER owner-dictionary zinciri DWG INSERT'e bağlandı");
  assert(xclip?.boundaryVertices.map((point: [number, number]) => point.join(",")).join(";") === "20,20;80,20;80,80;20,80", "Identity OCS/matrix XCLIP sınırı kayıpsız world clip polygon'a çevrildi");
  const xclipScene = compileCanonicalToScene(decodedAutoCADXclip, { sceneId: "scene_f06_autocad_xclip" });
  const xclipModelChunkRef = xclipScene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
  const xclipModelChunk = parseSceneChunk(xclipScene.chunks.get(xclipModelChunkRef!.chunkId)!);
  const xclipXY = xclipModelChunk.sections.get(SceneTag.XY)!.data as Float32Array;
  const xclipOrigin = xclipModelChunk.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  const hasWorldPoint = (x: number, y: number) => Array.from({ length: xclipXY.length / 2 }, (_, i) => i * 2).some((i) => approxEqual(xclipXY[i] + xclipOrigin[0], x, 2e-4) && approxEqual(xclipXY[i + 1] + xclipOrigin[1], y, 2e-4));
  assert(hasWorldPoint(20, 50) && hasWorldPoint(80, 50), "AutoCAD XCLIP boundary gerçek DWG block çizgisini [20,50]–[80,50] aralığında kırptı");
  assert(isExactlyOneWorldSegment(xclipXY, xclipOrigin, [20, 50], [80, 50]), "AutoCAD DWG XCLIP sahnesinde tek doğru segment var; dışarı taşan veya üst üste binen çizgi yok");

  // AutoCAD XCLIP Off is a different semantic state from hiding the frame via
  // XCLIPFRAME. The oracle was created on a disposable copy and exported by
  // AutoCAD LT 2027; its filter remains present while DXF group 71 is zero.
  const xclipOffDwgPath = path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/f06-autocad-xclip-off.dwg");
  assert(fs.existsSync(xclipOffDwgPath), "AutoCAD-generated XCLIP Off DWG oracle fixture exists");
  const xclipOffDwg = await parseDwgToCanonical(fs.readFileSync(xclipOffDwgPath));
  const xclipOffDwgInsert = xclipOffDwg.modelSpaceEntities.find((entity) => entity.type === "INSERT" && (entity as any).blockName === "F06_XCLIP_BLOCK_CLEAN") as any;
  assert(xclipOffDwgInsert?.clipBoundary?.isClippingEnabled === false, "DWG group-71 disabled clip state is retained as isClippingEnabled=false");
  const xclipOffDwgScene = compileCanonicalToScene(xclipOffDwg, { sceneId: "scene_f06_autocad_xclip_off_dwg" });
  const xclipOffDwgChunkRef = xclipOffDwgScene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
  const xclipOffDwgChunk = parseSceneChunk(xclipOffDwgScene.chunks.get(xclipOffDwgChunkRef!.chunkId)!);
  const xclipOffDwgXY = xclipOffDwgChunk.sections.get(SceneTag.XY)!.data as Float32Array;
  const xclipOffDwgOrigin = xclipOffDwgChunk.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  assert(hasWorldSegment(xclipOffDwgXY, xclipOffDwgOrigin, [0, 50], [100, 50]), "DWG XCLIP Off restores the full unclipped line");
  assert(!hasWorldSegment(xclipOffDwgXY, xclipOffDwgOrigin, [20, 50], [80, 50]), "DWG XCLIP Off does not retain a clip-truncated line");

  const xclipFrameHiddenPath = path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/f06-autocad-xclip-frame-hidden.dwg");
  const xclipFrameHidden = await parseDwgToCanonical(fs.readFileSync(xclipFrameHiddenPath));
  const xclipFrameHiddenInsert = xclipFrameHidden.modelSpaceEntities.find((entity) => entity.type === "INSERT" && (entity as any).blockName === "F06_XCLIP_BLOCK_CLEAN") as any;
  assert(xclipFrameHiddenInsert?.clipBoundary?.isClippingEnabled === true, "XCLIPFRAME=0 is distinguished from XCLIP Off; filter clipping remains enabled");
  const xclipFrameHiddenScene = compileCanonicalToScene(xclipFrameHidden, { sceneId: "scene_f06_autocad_xclip_frame_hidden" });
  const xclipFrameHiddenChunkRef = xclipFrameHiddenScene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
  const xclipFrameHiddenChunk = parseSceneChunk(xclipFrameHiddenScene.chunks.get(xclipFrameHiddenChunkRef!.chunkId)!);
  assert(isExactlyOneWorldSegment(xclipFrameHiddenChunk.sections.get(SceneTag.XY)!.data as Float32Array, xclipFrameHiddenChunk.sections.get(SceneTag.ORIGIN)!.data as Float64Array, [20, 50], [80, 50]), "Hidden XCLIP frame still clips geometry to the exact inside segment");

  const autoCADXclipDxfFixture = path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/f06-autocad-xclip-clean.dxf");
  assert(fs.existsSync(autoCADXclipDxfFixture), "AutoCAD DWG'den dışa aktarılan gerçek ASCII DXF XCLIP fixture repoda mevcut");
  const decodedAutoCADXclipDxf = await parseDxfToCanonical(fs.readFileSync(autoCADXclipDxfFixture));
  const dxfXclipInsert = decodedAutoCADXclipDxf.modelSpaceEntities.find((entity) => entity.type === "INSERT" && (entity as any).blockName === "F06_XCLIP_BLOCK_CLEAN") as any;
  assert(Boolean(dxfXclipInsert?.clipBoundary && dxfXclipInsert.visible !== false), "DXF INSERT extension dictionary zincirinden SPATIAL_FILTER clip'i çözümlendi");
  assert(dxfXclipInsert?.clipBoundary?.boundaryVertices.map((point: [number, number]) => point.join(",")).join(";") === "20,20;80,20;80,80;20,80", "AutoCAD ASCII DXF OCS clip sınırı canonical WCS polygon'a aktarıldı");
  const xclipDxfScene = compileCanonicalToScene(decodedAutoCADXclipDxf, { sceneId: "scene_f06_autocad_xclip_dxf" });
  const xclipDxfChunkRef = xclipDxfScene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
  const xclipDxfChunk = parseSceneChunk(xclipDxfScene.chunks.get(xclipDxfChunkRef!.chunkId)!);
  const xclipDxfXY = xclipDxfChunk.sections.get(SceneTag.XY)!.data as Float32Array;
  const xclipDxfOrigin = xclipDxfChunk.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  const hasDxfClipPoint = (x: number, y: number) => Array.from({ length: xclipDxfXY.length / 2 }, (_, i) => i * 2).some((i) => approxEqual(xclipDxfXY[i] + xclipDxfOrigin[0], x, 2e-4) && approxEqual(xclipDxfXY[i + 1] + xclipDxfOrigin[1], y, 2e-4));
  assert(hasDxfClipPoint(20, 50) && hasDxfClipPoint(80, 50), "AutoCAD ASCII DXF XCLIP block çizgisini [20,50]–[80,50] aralığına kırptı");
  assert(isExactlyOneWorldSegment(xclipDxfXY, xclipDxfOrigin, [20, 50], [80, 50]), "AutoCAD ASCII DXF XCLIP sahnesinde tek doğru segment var; taşma veya çakışan segment yok");

  const xclipOffDxfPath = path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/f06-autocad-xclip-off.dxf");
  assert(fs.existsSync(xclipOffDxfPath), "AutoCAD DXFOUT ASCII XCLIP Off oracle fixture exists");
  const xclipOffDxf = await parseDxfToCanonical(fs.readFileSync(xclipOffDxfPath));
  const xclipOffDxfInsert = xclipOffDxf.modelSpaceEntities.find((entity) => entity.type === "INSERT" && (entity as any).blockName === "F06_XCLIP_BLOCK_CLEAN") as any;
  assert(xclipOffDxfInsert?.clipBoundary?.isClippingEnabled === false, "ASCII DXF group 71=0 is not misread as an active XCLIP");
  const xclipOffDxfScene = compileCanonicalToScene(xclipOffDxf, { sceneId: "scene_f06_autocad_xclip_off_dxf" });
  const xclipOffDxfChunkRef = xclipOffDxfScene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
  const xclipOffDxfChunk = parseSceneChunk(xclipOffDxfScene.chunks.get(xclipOffDxfChunkRef!.chunkId)!);
  const xclipOffDxfXY = xclipOffDxfChunk.sections.get(SceneTag.XY)!.data as Float32Array;
  const xclipOffDxfOrigin = xclipOffDxfChunk.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  assert(hasWorldSegment(xclipOffDxfXY, xclipOffDxfOrigin, [0, 50], [100, 50]), "ASCII DXF XCLIP Off restores the full unclipped line");
  assert(!hasWorldSegment(xclipOffDxfXY, xclipOffDxfOrigin, [20, 50], [80, 50]), "ASCII DXF XCLIP Off does not retain a clip-truncated line");
  const { AcDbDxfFiler, acdbCreateDxfPairReader } = await import("@mlightcad/data-model");
  const encodeBinaryDxf = (source: Buffer | Uint8Array) => {
    const pairs = acdbCreateDxfPairReader(new Uint8Array(source));
    const filer = new AcDbDxfFiler({ outputFormat: "binary" });
    for (let pair = pairs.next(); pair; pair = pairs.next()) filer.writeGroup(pair.code, pair.value);
    return filer.toBinary();
  };
  const binaryDxfBytes = encodeBinaryDxf(fs.readFileSync(autoCADXclipDxfFixture));
  assert(Buffer.from(binaryDxfBytes.subarray(0, 22)).toString("binary") === "AutoCAD Binary DXF\r\n\u001a\u0000", "AutoCAD ASCII fixture converted to a binary DXF stream with the official sentinel");
  const xclipOffBinaryDxf = await parseDxfToCanonical(encodeBinaryDxf(fs.readFileSync(xclipOffDxfPath)));
  const xclipOffBinaryInsert = xclipOffBinaryDxf.modelSpaceEntities.find((entity) => entity.type === "INSERT" && (entity as any).blockName === "F06_XCLIP_BLOCK_CLEAN") as any;
  assert(xclipOffBinaryInsert?.clipBoundary?.isClippingEnabled === false, "Binary DXF pair reader preserves AutoCAD XCLIP Off state");
  const xclipOffBinaryScene = compileCanonicalToScene(xclipOffBinaryDxf, { sceneId: "scene_f06_autocad_xclip_off_binary_dxf" });
  const xclipOffBinaryChunkRef = xclipOffBinaryScene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
  const xclipOffBinaryChunk = parseSceneChunk(xclipOffBinaryScene.chunks.get(xclipOffBinaryChunkRef!.chunkId)!);
  assert(hasWorldSegment(xclipOffBinaryChunk.sections.get(SceneTag.XY)!.data as Float32Array, xclipOffBinaryChunk.sections.get(SceneTag.ORIGIN)!.data as Float64Array, [0, 50], [100, 50]), "Binary DXF XCLIP Off restores the full line");
  const decodedAutoCADXclipBinaryDxf = await parseDxfToCanonical(binaryDxfBytes);
  const binaryDxfXclipInsert = decodedAutoCADXclipBinaryDxf.modelSpaceEntities.find((entity) => entity.type === "INSERT" && (entity as any).blockName === "F06_XCLIP_BLOCK_CLEAN") as any;
  assert(Boolean(binaryDxfXclipInsert?.clipBoundary && binaryDxfXclipInsert.visible !== false), "Binary DXF INSERT filter dictionary chain resolves into a canonical XCLIP");
  const binaryXclipScene = compileCanonicalToScene(decodedAutoCADXclipBinaryDxf, { sceneId: "scene_f06_autocad_xclip_binary_dxf" });
  const binaryXclipChunkRef = binaryXclipScene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
  const binaryXclipChunk = parseSceneChunk(binaryXclipScene.chunks.get(binaryXclipChunkRef!.chunkId)!);
  const binaryXclipXY = binaryXclipChunk.sections.get(SceneTag.XY)!.data as Float32Array;
  const binaryXclipOrigin = binaryXclipChunk.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  const hasBinaryXclipPoint = (x: number, y: number) => Array.from({ length: binaryXclipXY.length / 2 }, (_, i) => i * 2).some((i) => approxEqual(binaryXclipXY[i] + binaryXclipOrigin[0], x, 2e-4) && approxEqual(binaryXclipXY[i + 1] + binaryXclipOrigin[1], y, 2e-4));
  assert(hasBinaryXclipPoint(20, 50) && hasBinaryXclipPoint(80, 50), "Binary DXF XCLIP clips the block line to the exact canonical endpoints");
  assert(isExactlyOneWorldSegment(binaryXclipXY, binaryXclipOrigin, [20, 50], [80, 50]), "Binary DXF XCLIP leaves exactly one clipped segment without overlap or overflow");

  // AutoCAD LT 2027 encodes Invert Clip in the saved SPATIAL_FILTER boundary
  // as a compound polygon. LibreDWG 0.7.10 does not expose a separate inverted
  // flag, so assert the user-visible geometry that the compound boundary yields.
  const invertedXclipDwgPath = path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/f06-autocad-xclip-inverted-oracle.dwg");
  assert(fs.existsSync(invertedXclipDwgPath), "AutoCAD LT Invert Clip komutuyla oluşturulan ayrı DWG oracle fixture mevcut");
  const invertedXclipDwg = await parseDwgToCanonical(fs.readFileSync(invertedXclipDwgPath));
  const invertedDwgInsert = invertedXclipDwg.modelSpaceEntities.find((entity) => entity.type === "INSERT" && (entity as any).blockName === "F06_XCLIP_BLOCK_CLEAN") as any;
  assert(Boolean(invertedDwgInsert?.clipBoundary && invertedDwgInsert.visible !== false && invertedDwgInsert.clipBoundary.boundaryVertices.length === 11), "DWG inverted clip compound boundary kayıpsız çözümlendi; güvenli profilde fail-closed olmadı");
  const invertedDwgScene = compileCanonicalToScene(invertedXclipDwg, { sceneId: "scene_f06_autocad_inverted_xclip_dwg" });
  const invertedDwgChunkRef = invertedDwgScene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
  const invertedDwgChunk = parseSceneChunk(invertedDwgScene.chunks.get(invertedDwgChunkRef!.chunkId)!);
  const invertedDwgXY = invertedDwgChunk.sections.get(SceneTag.XY)!.data as Float32Array;
  const invertedDwgOrigin = invertedDwgChunk.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  assert(hasWorldSegment(invertedDwgXY, invertedDwgOrigin, [0, 50], [20, 50]) && hasWorldSegment(invertedDwgXY, invertedDwgOrigin, [80, 50], [100, 50]), "DWG Invert Clip orta bölümü saklayıp çizginin iki dış parçasını bırakıyor");
  assert(!hasWorldSegment(invertedDwgXY, invertedDwgOrigin, [20, 50], [80, 50]), "DWG Invert Clip normal clip içindeki orta çizgiyi göstermiyor");

  const invertedXclipDxfPath = path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/f06-autocad-xclip-inverted-oracle.dxf");
  assert(fs.existsSync(invertedXclipDxfPath), "Aynı AutoCAD inverted DWG'den alınan ASCII DXF oracle fixture mevcut");
  const invertedXclipDxf = await parseDxfToCanonical(fs.readFileSync(invertedXclipDxfPath));
  const invertedDxfInsert = invertedXclipDxf.modelSpaceEntities.find((entity) => entity.type === "INSERT" && (entity as any).blockName === "F06_XCLIP_BLOCK_CLEAN") as any;
  assert(Boolean(invertedDxfInsert?.clipBoundary && invertedDxfInsert.visible !== false && invertedDxfInsert.clipBoundary.boundaryVertices.length === 11), "AutoCAD DXF inverted clip compound boundary DWG ile aynı vertex profiliyle çözümlendi");
  const invertedDxfScene = compileCanonicalToScene(invertedXclipDxf, { sceneId: "scene_f06_autocad_inverted_xclip_dxf" });
  const invertedDxfChunkRef = invertedDxfScene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
  const invertedDxfChunk = parseSceneChunk(invertedDxfScene.chunks.get(invertedDxfChunkRef!.chunkId)!);
  const invertedDxfXY = invertedDxfChunk.sections.get(SceneTag.XY)!.data as Float32Array;
  const invertedDxfOrigin = invertedDxfChunk.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  assert(hasWorldSegment(invertedDxfXY, invertedDxfOrigin, [0, 50], [20, 50]) && hasWorldSegment(invertedDxfXY, invertedDxfOrigin, [80, 50], [100, 50]), "ASCII DXF Invert Clip orta bölümü saklayıp çizginin iki dış parçasını bırakıyor");
  assert(!hasWorldSegment(invertedDxfXY, invertedDxfOrigin, [20, 50], [80, 50]), "ASCII DXF Invert Clip normal clip içindeki orta çizgiyi göstermiyor");

  const autoCADNormalBinaryDxfPath = path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/f06-autocad-xclip-autocad-binary.dxf");
  const autoCADInvertedBinaryDxfPath = path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/f06-autocad-xclip-inverted-autocad-binary.dxf");
  const autoCADOffBinaryDxfPath = path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/f06-autocad-xclip-off-autocad-binary.dxf");
  const autoCADBinarySentinel = Buffer.from("AutoCAD Binary DXF\r\n\x1a\0", "binary");
  for (const binaryPath of [autoCADNormalBinaryDxfPath, autoCADInvertedBinaryDxfPath, autoCADOffBinaryDxfPath]) {
    assert(fs.existsSync(binaryPath), `AutoCAD native binary DXF fixture exists: ${path.basename(binaryPath)}`);
    const bytes = fs.readFileSync(binaryPath);
    assert(bytes.subarray(0, autoCADBinarySentinel.length).equals(autoCADBinarySentinel), `AutoCAD native binary DXF sentinel is valid: ${path.basename(binaryPath)}`);
  }
  const autoCADNativeBinaryDxf = await parseDxfToCanonical(fs.readFileSync(autoCADNormalBinaryDxfPath));
  const autoCADNativeBinaryInsert = autoCADNativeBinaryDxf.modelSpaceEntities.find((entity) => entity.type === "INSERT" && (entity as any).blockName === "F06_XCLIP_BLOCK_CLEAN") as any;
  assert(Boolean(autoCADNativeBinaryInsert?.clipBoundary && autoCADNativeBinaryInsert.visible !== false), "AutoCAD-produced binary DXF normal XCLIP handle chain resolves");
  const autoCADNativeBinaryScene = compileCanonicalToScene(autoCADNativeBinaryDxf, { sceneId: "scene_f06_autocad_native_binary_xclip" });
  const autoCADNativeBinaryChunkRef = autoCADNativeBinaryScene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
  const autoCADNativeBinaryChunk = parseSceneChunk(autoCADNativeBinaryScene.chunks.get(autoCADNativeBinaryChunkRef!.chunkId)!);
  const autoCADNativeBinaryXY = autoCADNativeBinaryChunk.sections.get(SceneTag.XY)!.data as Float32Array;
  const autoCADNativeBinaryOrigin = autoCADNativeBinaryChunk.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  assert(isExactlyOneWorldSegment(autoCADNativeBinaryXY, autoCADNativeBinaryOrigin, [20, 50], [80, 50]), "AutoCAD-produced binary DXF normal XCLIP compiles to exact [20,50]–[80,50]");

  const autoCADNativeOffBinaryDxf = await parseDxfToCanonical(fs.readFileSync(autoCADOffBinaryDxfPath));
  const autoCADNativeOffBinaryInsert = autoCADNativeOffBinaryDxf.modelSpaceEntities.find((entity) => entity.type === "INSERT" && (entity as any).blockName === "F06_XCLIP_BLOCK_CLEAN") as any;
  assert(autoCADNativeOffBinaryInsert?.clipBoundary?.isClippingEnabled === false, "AutoCAD-produced binary DXF retains XCLIP Off state");
  const autoCADNativeOffBinaryScene = compileCanonicalToScene(autoCADNativeOffBinaryDxf, { sceneId: "scene_f06_autocad_native_binary_xclip_off" });
  const autoCADNativeOffBinaryChunkRef = autoCADNativeOffBinaryScene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
  const autoCADNativeOffBinaryChunk = parseSceneChunk(autoCADNativeOffBinaryScene.chunks.get(autoCADNativeOffBinaryChunkRef!.chunkId)!);
  assert(hasWorldSegment(autoCADNativeOffBinaryChunk.sections.get(SceneTag.XY)!.data as Float32Array, autoCADNativeOffBinaryChunk.sections.get(SceneTag.ORIGIN)!.data as Float64Array, [0, 50], [100, 50]), "AutoCAD-produced binary DXF XCLIP Off restores the full line");

  const autoCADNativeInvertedBinaryDxf = await parseDxfToCanonical(fs.readFileSync(autoCADInvertedBinaryDxfPath));
  const autoCADNativeInvertedBinaryInsert = autoCADNativeInvertedBinaryDxf.modelSpaceEntities.find((entity) => entity.type === "INSERT" && (entity as any).blockName === "F06_XCLIP_BLOCK_CLEAN") as any;
  assert(Boolean(autoCADNativeInvertedBinaryInsert?.clipBoundary && autoCADNativeInvertedBinaryInsert.visible !== false && autoCADNativeInvertedBinaryInsert.clipBoundary.boundaryVertices.length === 11), "AutoCAD-produced binary DXF inverted compound boundary resolves");
  const autoCADNativeInvertedBinaryScene = compileCanonicalToScene(autoCADNativeInvertedBinaryDxf, { sceneId: "scene_f06_autocad_native_binary_inverted_xclip" });
  const autoCADNativeInvertedBinaryChunkRef = autoCADNativeInvertedBinaryScene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
  const autoCADNativeInvertedBinaryChunk = parseSceneChunk(autoCADNativeInvertedBinaryScene.chunks.get(autoCADNativeInvertedBinaryChunkRef!.chunkId)!);
  const autoCADNativeInvertedBinaryXY = autoCADNativeInvertedBinaryChunk.sections.get(SceneTag.XY)!.data as Float32Array;
  const autoCADNativeInvertedBinaryOrigin = autoCADNativeInvertedBinaryChunk.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  assert(hasWorldSegment(autoCADNativeInvertedBinaryXY, autoCADNativeInvertedBinaryOrigin, [0, 50], [20, 50]) && hasWorldSegment(autoCADNativeInvertedBinaryXY, autoCADNativeInvertedBinaryOrigin, [80, 50], [100, 50]), "AutoCAD-produced binary DXF inverted XCLIP preserves only the two outside segments");
  assert(!hasWorldSegment(autoCADNativeInvertedBinaryXY, autoCADNativeInvertedBinaryOrigin, [20, 50], [80, 50]), "AutoCAD-produced binary DXF inverted XCLIP hides the inside segment");

  const changedClipMatrixLines = fs.readFileSync(autoCADXclipDxfFixture, "utf8").split(/\r?\n/);
  const spatialFilterRecordStart = changedClipMatrixLines.lastIndexOf("SPATIAL_FILTER");
  let clipMatrixValueIndex = 0;
  let mutatedClipMatrix = false;
  for (let lineIndex = spatialFilterRecordStart + 1; lineIndex + 1 < changedClipMatrixLines.length; lineIndex += 2) {
    if (changedClipMatrixLines[lineIndex].trim() === "0") break;
    if (changedClipMatrixLines[lineIndex].trim() === "40") {
      clipMatrixValueIndex++;
      if (clipMatrixValueIndex === 13) {
        changedClipMatrixLines[lineIndex + 1] = "2.0";
        mutatedClipMatrix = true;
        break;
      }
    }
  }
  assert(mutatedClipMatrix, "Unsupported DXF clip matrix fixture mutation targets the second 4x3 matrix");
  const unsupportedMatrixDxf = await parseDxfToCanonical(Buffer.from(changedClipMatrixLines.join("\n")));
  const withheldDxfInsert = unsupportedMatrixDxf.modelSpaceEntities.find((entity) => entity.type === "INSERT" && (entity as any).blockName === "F06_XCLIP_BLOCK_CLEAN");
  assert(withheldDxfInsert?.visible === false && unsupportedMatrixDxf.diagnostics.some((diagnostic) => diagnostic.code === "UNRESOLVED_XCLIP_TRANSFORM"), "DXF non-identity clip matrix clipsiz çizim yerine fail-closed diagnostic üretir");
  const unsupportedMatrixBinaryDxf = await parseDxfToCanonical(encodeBinaryDxf(Buffer.from(changedClipMatrixLines.join("\n"))));
  const withheldBinaryDxfInsert = unsupportedMatrixBinaryDxf.modelSpaceEntities.find((entity) => entity.type === "INSERT" && (entity as any).blockName === "F06_XCLIP_BLOCK_CLEAN");
  assert(withheldBinaryDxfInsert?.visible === false && unsupportedMatrixBinaryDxf.diagnostics.some((diagnostic) => diagnostic.code === "UNRESOLVED_XCLIP_TRANSFORM"), "Binary DXF unsupported clip matrix also fails closed");
  const frontClipLines = fs.readFileSync(autoCADXclipDxfFixture, "utf8").split(/\r?\n/);
  const frontClipStart = frontClipLines.lastIndexOf("SPATIAL_FILTER");
  let frontClipFlagSet = false;
  let frontClipDistanceInserted = false;
  for (let lineIndex = frontClipStart + 1; lineIndex + 1 < frontClipLines.length; lineIndex += 2) {
    if (frontClipLines[lineIndex].trim() === "0") break;
    if (frontClipLines[lineIndex].trim() === "72") {
      frontClipLines[lineIndex + 1] = "1";
      frontClipFlagSet = true;
    }
    if (!frontClipDistanceInserted && frontClipLines[lineIndex].trim() === "40") {
      frontClipLines.splice(lineIndex, 0, "40", "5.0");
      frontClipDistanceInserted = true;
      break;
    }
  }
  assert(frontClipFlagSet && frontClipDistanceInserted, "SPATIAL_FILTER front-plane mutation includes its overloaded group-40 distance before both matrices");
  const frontClippedDxf = await parseDxfToCanonical(Buffer.from(frontClipLines.join("\n")));
  const withheldFrontClipInsert = frontClippedDxf.modelSpaceEntities.find((entity) => entity.type === "INSERT" && (entity as any).blockName === "F06_XCLIP_BLOCK_CLEAN");
  assert(withheldFrontClipInsert?.visible === false && frontClippedDxf.diagnostics.some((diagnostic) => diagnostic.code === "UNRESOLVED_XCLIP_TRANSFORM"), "Front-depth clipping remains explicitly unsupported and withheld after correct group-40 parsing");
  const malformedMatrixLines = fs.readFileSync(autoCADXclipDxfFixture, "utf8").split(/\r?\n/);
  const malformedMatrixStart = malformedMatrixLines.lastIndexOf("SPATIAL_FILTER");
  let removedMatrixValue = false;
  for (let lineIndex = malformedMatrixStart + 1; lineIndex + 1 < malformedMatrixLines.length; lineIndex += 2) {
    if (malformedMatrixLines[lineIndex].trim() === "0") break;
    if (malformedMatrixLines[lineIndex].trim() === "40") {
      malformedMatrixLines.splice(lineIndex, 2);
      removedMatrixValue = true;
      break;
    }
  }
  assert(removedMatrixValue, "Malformed transform mutation removes one SPATIAL_FILTER matrix value");
  const malformedMatrixDxf = await parseDxfToCanonical(Buffer.from(malformedMatrixLines.join("\n")));
  const withheldMalformedMatrixInsert = malformedMatrixDxf.modelSpaceEntities.find((entity) => entity.type === "INSERT" && (entity as any).blockName === "F06_XCLIP_BLOCK_CLEAN");
  assert(withheldMalformedMatrixInsert?.visible === false && malformedMatrixDxf.diagnostics.some((diagnostic) => diagnostic.code === "UNRESOLVED_XCLIP_TRANSFORM"), "Incomplete SPATIAL_FILTER matrix fails closed instead of applying shifted coordinates");
  const brokenSpatialDictionaryText = fs.readFileSync(autoCADXclipDxfFixture, "utf8").replace(/(\n\s*3\r?\n)SPATIAL(\r?\n\s*360\r?\n)([0-9A-F]+)\b/i, "$1SPATIAL_MISSING$2$3");
  assert(brokenSpatialDictionaryText !== fs.readFileSync(autoCADXclipDxfFixture, "utf8"), "DXF broken SPATIAL fixture mutation found the AutoCAD ACAD_FILTER child");
  const brokenSpatialDxf = await parseDxfToCanonical(Buffer.from(brokenSpatialDictionaryText));
  const withheldBrokenSpatialInsert = brokenSpatialDxf.modelSpaceEntities.find((entity) => entity.type === "INSERT" && (entity as any).blockName === "F06_XCLIP_BLOCK_CLEAN");
  assert(withheldBrokenSpatialInsert?.visible === false && brokenSpatialDxf.diagnostics.some((diagnostic) => diagnostic.code === "UNRESOLVED_XCLIP_REFERENCE"), "DXF ACAD_FILTER with missing SPATIAL target fails closed instead of silently dropping XCLIP");
  const transformedXclipDxfFixture = path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/f06-autocad-xclip-transformed-clean.dxf");
  assert(fs.existsSync(transformedXclipDxfFixture), "AutoCAD transformed XCLIP'in gerçek ASCII DXF dışa aktarımı repoda mevcut");
  const decodedTransformedXclipDxf = await parseDxfToCanonical(fs.readFileSync(transformedXclipDxfFixture));
  const transformedDxfInsert = decodedTransformedXclipDxf.modelSpaceEntities.find((entity) => entity.type === "INSERT" && (entity as any).blockName === "F06_XCLIP_TRANSFORMED_BLOCK_CLEAN") as any;
  assert(Boolean(transformedDxfInsert?.clipBoundary && transformedDxfInsert.visible !== false), "DXF parser inverse INSERT matrix ile identity clip matrix ayrımını koruyor");
  const transformedXclipDxfScene = compileCanonicalToScene(decodedTransformedXclipDxf, { sceneId: "scene_f06_autocad_xclip_transformed_dxf" });
  const transformedXclipDxfChunkRef = transformedXclipDxfScene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
  const transformedXclipDxfChunk = parseSceneChunk(transformedXclipDxfScene.chunks.get(transformedXclipDxfChunkRef!.chunkId)!);
  const transformedXclipDxfXY = transformedXclipDxfChunk.sections.get(SceneTag.XY)!.data as Float32Array;
  const transformedXclipDxfOrigin = transformedXclipDxfChunk.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  const hasTransformedDxfClipPoint = (x: number, y: number) => Array.from({ length: transformedXclipDxfXY.length / 2 }, (_, i) => i * 2).some((i) => approxEqual(transformedXclipDxfXY[i] + transformedXclipDxfOrigin[0], x, 3e-4) && approxEqual(transformedXclipDxfXY[i + 1] + transformedXclipDxfOrigin[1], y, 3e-4));
  assert(hasTransformedDxfClipPoint(192.320508, 353.30127) && hasTransformedDxfClipPoint(244.282032, 383.30127), "AutoCAD transformed ASCII DXF clip'i WCS'de doğru uygulanıyor");
  assert(isExactlyOneWorldSegment(transformedXclipDxfXY, transformedXclipDxfOrigin, [192.320508, 353.30127], [244.282032, 383.30127]), "AutoCAD transformed ASCII DXF clip'i tek WCS segment bırakır, kopya/taşma bırakmaz");
  const decodedTransformedBinaryDxf = await parseDxfToCanonical(encodeBinaryDxf(fs.readFileSync(transformedXclipDxfFixture)));
  const transformedBinaryInsert = decodedTransformedBinaryDxf.modelSpaceEntities.find((entity) => entity.type === "INSERT" && (entity as any).blockName === "F06_XCLIP_TRANSFORMED_BLOCK_CLEAN") as any;
  assert(Boolean(transformedBinaryInsert?.clipBoundary && transformedBinaryInsert.visible !== false), "Binary DXF reader preserves transformed INSERT XCLIP metadata");
  const transformedBinaryScene = compileCanonicalToScene(decodedTransformedBinaryDxf, { sceneId: "scene_f06_autocad_xclip_transformed_binary_dxf" });
  const transformedBinaryChunkRef = transformedBinaryScene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
  const transformedBinaryChunk = parseSceneChunk(transformedBinaryScene.chunks.get(transformedBinaryChunkRef!.chunkId)!);
  const transformedBinaryXY = transformedBinaryChunk.sections.get(SceneTag.XY)!.data as Float32Array;
  const transformedBinaryOrigin = transformedBinaryChunk.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  const hasTransformedBinaryPoint = (x: number, y: number) => Array.from({ length: transformedBinaryXY.length / 2 }, (_, i) => i * 2).some((i) => approxEqual(transformedBinaryXY[i] + transformedBinaryOrigin[0], x, 3e-4) && approxEqual(transformedBinaryXY[i + 1] + transformedBinaryOrigin[1], y, 3e-4));
  assert(hasTransformedBinaryPoint(192.320508, 353.30127) && hasTransformedBinaryPoint(244.282032, 383.30127), "Binary DXF translated/rotated XCLIP compiles to the verified WCS endpoints");
  assert(isExactlyOneWorldSegment(transformedBinaryXY, transformedBinaryOrigin, [192.320508, 353.30127], [244.282032, 383.30127]), "Binary DXF transformed XCLIP leaves exactly one expected WCS segment");

  const transformedXclipFixture = path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/f06-autocad-xclip-transformed.dwg");
  assert(fs.existsSync(transformedXclipFixture), "AutoCAD transformed INSERT + XCLIP fixture repoda mevcut");
  const decodedTransformedXclip = await parseDwgToCanonical(fs.readFileSync(transformedXclipFixture));
  const transformedInsert = decodedTransformedXclip.modelSpaceEntities.find((entity) => entity.type === "INSERT" && (entity as any).blockName === "F06_XCLIP_TRANSFORMED_BLOCK_CLEAN") as any;
  assert(Boolean(transformedInsert?.clipBoundary && transformedInsert.visible !== false), "Identity clip matrix altında translated/rotated INSERT güvenle korunuyor");
  const transformedBoundary = transformedInsert?.clipBoundary?.boundaryVertices as [number, number][] | undefined;
  assert(Boolean(transformedBoundary && approxEqual(transformedBoundary[0][0], 207.320508) && approxEqual(transformedBoundary[0][1], 327.320508)), "AutoCAD transformed XCLIP world vertices kayıpsız çözümleniyor");
  const transformedScene = compileCanonicalToScene(decodedTransformedXclip, { sceneId: "scene_f06_autocad_xclip_transformed" });
  const transformedChunkRef = transformedScene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
  const transformedChunk = parseSceneChunk(transformedScene.chunks.get(transformedChunkRef!.chunkId)!);
  const transformedXY = transformedChunk.sections.get(SceneTag.XY)!.data as Float32Array;
  const transformedOrigin = transformedChunk.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  const hasTransformedPoint = (x: number, y: number) => Array.from({ length: transformedXY.length / 2 }, (_, i) => i * 2).some((i) => approxEqual(transformedXY[i] + transformedOrigin[0], x, 3e-4) && approxEqual(transformedXY[i + 1] + transformedOrigin[1], y, 3e-4));
  assert(hasTransformedPoint(192.320508, 353.30127) && hasTransformedPoint(244.282032, 383.30127), "AutoCAD XCLIP translated/rotated INSERT çizgisini dönüştürülmüş sınır içinde kırptı");
  assert(isExactlyOneWorldSegment(transformedXY, transformedOrigin, [192.320508, 353.30127], [244.282032, 383.30127]), "AutoCAD transformed DWG clip'i tek WCS segment bırakır, kopya/taşma bırakmaz");

  console.log("\n=== G09 MODEL, PAFTA, VIEWPORT VE BAĞIMLILIKLAR TESTLERİ BAŞARIYLA GEÇTİ (9/9 PASS + DWG XCLIP) ===");
}

runLayoutViewportTests().catch((err) => {
  console.error("Test hatası:", err);
  process.exit(1);
});
