// ============================================================================
// DWG/DXF MOTOR V2 — F02 STROKE, LINEWEIGHT & POLYLINE WIDTH ACCEPTANCE TEST
// ============================================================================
// Sözleşme: DWG_DXF_Motor_V2_Kanitli_Kok_Neden_ve_Fidelity_Gemini_Uygulama_Plani_v3.md (F02)
// - AutoCAD standart lineweight paleti (0.00 - 2.11 mm)
// - ByLayer, ByBlock, Default ve Layer Overrides hiyerarşisi
// - Hairline (0.00 mm) ve ekran piksel dönüşümü (96 DPI / CSS px)
// - Polyline constant width ve tapered (startWidth / endWidth) tessellation
// - Sıfır uzunluklu segment dayanıklılığı, kapalı köşe miter/bevel join
// - Miter limit (3.0) aşımında bevel fallback
// - Centerline değişmezliği (centerline invariant)
// - Polyline width ve lineweight etkileşimi (çift kalınlaştırma yok)
// - Binary protocol ve scene compiler chunk entegrasyonu

import assert from "node:assert";
import {
  AUTOCAD_LINEWEIGHTS_MM,
  LINEWEIGHT_BY_LAYER,
  LINEWEIGHT_BY_BLOCK,
  LINEWEIGHT_DEFAULT,
  DEFAULT_LINEWEIGHT_MM,
  resolveEntityLineweight,
  lineweightToScreenPixels,
  tessellatePolylineWithWidth,
  createLineStrokeQuad,
} from "../../src/lib/cad-v2/render/cad-stroke";
import { GeometryCompiler } from "../../src/lib/cad-v2/compile/geometry-compiler";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { parseSceneChunk, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";
import type {
  CadCanonicalDocument,
  CadEntity,
  CadLayer,
  CadInsertEntity,
  CadLwPolylineEntity,
} from "../../src/lib/cad-v2/canonical/types";

async function runF02StrokeWidthTests() {
  console.log("============================================================================");
  console.log("DWG/DXF MOTOR V2 — F02 STROKE, LINEWEIGHT & POLYLINE WIDTH TESTİ");
  console.log("============================================================================");

  // --------------------------------------------------------------------------
  // Kapı 1: AutoCAD Lineweight Paleti ve Standart Değerler
  // --------------------------------------------------------------------------
  console.log("1. AutoCAD Lineweight Paleti Doğrulaması...");
  assert.strictEqual(AUTOCAD_LINEWEIGHTS_MM.length, 24, "AutoCAD standart lineweight paleti 24 değer içermelidir");
  assert.strictEqual(AUTOCAD_LINEWEIGHTS_MM[0], 0.0, "İlk değer 0.00 mm (Hairline) olmalı");
  assert.strictEqual(AUTOCAD_LINEWEIGHTS_MM[7], 0.25, "8. değer 0.25 mm (Varsayılan) olmalı");
  assert.strictEqual(AUTOCAD_LINEWEIGHTS_MM[23], 2.11, "Son değer 2.11 mm olmalı");

  const mockLayers: Record<string, CadLayer> = {
    "0": { id: "0", name: "0", visible: true, frozen: false, locked: false, color: { method: "aci", aci: 7 }, lineweightMm: 0.25, linetypeName: "Continuous" },
    "WALLS": { id: "WALLS", name: "WALLS", visible: true, frozen: false, locked: false, color: { method: "aci", aci: 1 }, lineweightMm: 0.50, linetypeName: "Continuous" },
    "DOORS": { id: "DOORS", name: "DOORS", visible: true, frozen: false, locked: false, color: { method: "aci", aci: 2 }, lineweightMm: 0.18, linetypeName: "Continuous" },
    "HAIRLINE_LAYER": { id: "HAIRLINE_LAYER", name: "HAIRLINE_LAYER", visible: true, frozen: false, locked: false, color: { method: "aci", aci: 3 }, lineweightMm: 0.0, linetypeName: "Continuous" },
  };

  // Açıkça belirtilmiş pozitif lineweight
  const explicitEnt = { layer: "0", lineweightMm: 0.70 };
  const resExplicit = resolveEntityLineweight(explicitEnt, mockLayers);
  assert.strictEqual(resExplicit.lineweightMm, 0.70);
  assert.strictEqual(resExplicit.sourceMethod, "explicit");
  assert.strictEqual(resExplicit.isHairline, false);

  console.log("  ✓ Kapı 1 PASS: AutoCAD lineweight paleti ve açık lineweight çözümü");

  // --------------------------------------------------------------------------
  // Kapı 2: ByLayer Lineweight Çözümü ve Layer Override
  // --------------------------------------------------------------------------
  console.log("2. ByLayer Lineweight Çözümü...");

  // ByLayer (-1)
  const byLayerEnt = { layer: "WALLS", lineweightMm: LINEWEIGHT_BY_LAYER };
  const resByLayer = resolveEntityLineweight(byLayerEnt, mockLayers);
  assert.strictEqual(resByLayer.lineweightMm, 0.50, "WALLS katmanından 0.50 mm alınmalı");
  assert.strictEqual(resByLayer.sourceMethod, "byLayer");
  assert.strictEqual(resByLayer.isHairline, false);

  // Tanımlanmamış lineweight (ByLayer varsayılır)
  const undefinedLwEnt = { layer: "DOORS" };
  const resUndefined = resolveEntityLineweight(undefinedLwEnt, mockLayers);
  assert.strictEqual(resUndefined.lineweightMm, 0.18, "DOORS katmanından 0.18 mm alınmalı");
  assert.strictEqual(resUndefined.sourceMethod, "byLayer");

  // Layer Override (örn: Viewport bazlı katman ezmesi)
  const resOverride = resolveEntityLineweight(byLayerEnt, mockLayers, {
    layerOverrides: {
      WALLS: { lineweightMm: 1.00 },
    },
  });
  assert.strictEqual(resOverride.lineweightMm, 1.00, "Layer override 1.00 mm uygulanmalı");

  console.log("  ✓ Kapı 2 PASS: ByLayer ve layer override lineweight çözümü");

  // --------------------------------------------------------------------------
  // Kapı 3: ByBlock ve Nested ByBlock Hiyerarşisi
  // --------------------------------------------------------------------------
  console.log("3. ByBlock Lineweight Hiyerarşisi...");

  const byBlockEnt = { layer: "0", lineweightMm: LINEWEIGHT_BY_BLOCK };

  // Tek seviye INSERT  // Parent INSERT lineweight override
  const parentInsert: CadInsertEntity = {
    type: "INSERT",
    handle: "P1",
    order: BigInt(1),
    layer: "0",
    scale: [1, 1, 1],
    rotationRad: 0,
    blockName: "BLOCK_A",
    insertionPoint: [0, 0],
    lineweightMm: 0.80,
  };
  const resByBlock = resolveEntityLineweight(byBlockEnt, mockLayers, { parentInsert });
  assert.strictEqual(resByBlock.lineweightMm, 0.80, "Parent INSERT'in 0.80 mm lineweight'i alınmalı");
  assert.strictEqual(resByBlock.sourceMethod, "byBlock");

  // Nested INSERT stack: Root -> Middle (ByBlock) -> Child (ByBlock)
  const rootInsert: CadInsertEntity = {
    type: "INSERT",
    handle: "R1",
    order: BigInt(2),
    layer: "WALLS", // WALLS = 0.50 mm
    scale: [1, 1, 1],
    rotationRad: 0,
    blockName: "ROOT",
    insertionPoint: [0, 0],
    lineweightMm: LINEWEIGHT_BY_LAYER, // Katmandan al
  };
  const middleInsert: CadInsertEntity = {
    type: "INSERT",
    handle: "M1",
    order: BigInt(3),
    layer: "0",
    scale: [1, 1, 1],
    rotationRad: 0,
    blockName: "MIDDLE",
    insertionPoint: [0, 0],
    lineweightMm: LINEWEIGHT_BY_BLOCK,
  };

  const resNestedByBlock = resolveEntityLineweight(byBlockEnt, mockLayers, {
    parentInserts: [rootInsert, middleInsert],
  });
  assert.strictEqual(resNestedByBlock.lineweightMm, 0.50, "Nested ByBlock hiyerarşisinde root layer'ın 0.50 mm'si çözülmeli");

  console.log("  ✓ Kapı 3 PASS: ByBlock ve nested INSERT lineweight çözümü");

  // --------------------------------------------------------------------------
  // Kapı 4: Default Lineweight (-3) ve Eksik Katman Fallback
  // --------------------------------------------------------------------------
  console.log("4. Default Lineweight Çözümü...");

  const defaultEnt = { layer: "UNKNOWN_LAYER", lineweightMm: LINEWEIGHT_DEFAULT };
  const resDefault = resolveEntityLineweight(defaultEnt, mockLayers);
  assert.strictEqual(resDefault.lineweightMm, DEFAULT_LINEWEIGHT_MM, "Default lineweight 0.25 mm olmalı");
  assert.strictEqual(resDefault.sourceMethod, "default");

  // Bilinmeyen katmandaki ByLayer varlık default'a düşer
  const unknownLayerEnt = { layer: "NON_EXISTENT_LAYER", lineweightMm: LINEWEIGHT_BY_LAYER };
  const resUnknown = resolveEntityLineweight(unknownLayerEnt, mockLayers);
  assert.strictEqual(resUnknown.lineweightMm, DEFAULT_LINEWEIGHT_MM);
  assert.strictEqual(resUnknown.sourceMethod, "default");

  console.log("  ✓ Kapı 4 PASS: Default lineweight (0.25 mm) davranışı");

  // --------------------------------------------------------------------------
  // Kapı 5: Hairline (0.00 mm) Davranışı
  // --------------------------------------------------------------------------
  console.log("5. Hairline (0.00 mm) Davranışı...");

  const hairlineEnt = { layer: "HAIRLINE_LAYER", lineweightMm: LINEWEIGHT_BY_LAYER };
  const resHairline = resolveEntityLineweight(hairlineEnt, mockLayers);
  assert.strictEqual(resHairline.lineweightMm, 0.0);
  assert.strictEqual(resHairline.isHairline, true, "0.00 mm hairline olarak işaretlenmeli");

  const explicitHairline = { layer: "0", lineweightMm: 0.0 };
  const resExplicitHairline = resolveEntityLineweight(explicitHairline, mockLayers);
  assert.strictEqual(resExplicitHairline.isHairline, true);

  console.log("  ✓ Kapı 5 PASS: Hairline (0.00 mm) tespiti");

  // --------------------------------------------------------------------------
  // Kapı 6: Ekran Piksel Dönüşümü (96 CSS px / 25.4 mm)
  // --------------------------------------------------------------------------
  console.log("6. Ekran Piksel Dönüşümü...");

  // Hairline -> Her zaman 1.0 px
  assert.strictEqual(lineweightToScreenPixels(0.0), 1.0);
  assert.strictEqual(lineweightToScreenPixels(0.00001), 1.0);

  // 0.25 mm -> 0.25 * 96 / 25.4 = ~0.9448 -> clamp to minPixels (1.0)
  const px025 = lineweightToScreenPixels(0.25);
  assert.strictEqual(px025, 1.0, "0.25 mm 96 DPI'da min 1.0 px olmalı");

  // 0.50 mm -> 0.50 * 96 / 25.4 = ~1.8897 px
  const px050 = lineweightToScreenPixels(0.50);
  assert(Math.abs(px050 - (0.50 * 96 / 25.4)) < 1e-4, "0.50 mm doğru piksel değerine dönmeli");

  // 1.00 mm -> 1.00 * 96 / 25.4 = ~3.7795 px
  const px100 = lineweightToScreenPixels(1.00);
  assert(Math.abs(px100 - (1.00 * 96 / 25.4)) < 1e-4, "1.00 mm doğru piksel değerine dönmeli");

  // Retina / Yüksek DPI (192 DPI)
  const px100Retina = lineweightToScreenPixels(1.00, 192);
  assert(Math.abs(px100Retina - (1.00 * 192 / 25.4)) < 1e-4, "Retina DPI doğru hesaplanmalı");

  console.log("  ✓ Kapı 6 PASS: 96 CSS px/mm ekran piksel dönüşümü");

  // --------------------------------------------------------------------------
  // Kapı 7: Constant Width Polyline Tessellation (Segment Quads)
  // --------------------------------------------------------------------------
  console.log("7. Constant Width Polyline Tessellation...");

  const horizontalLine: CadLwPolylineEntity = {
    type: "LWPOLYLINE",
    handle: "H1",
    order: BigInt(1),
    layer: "0",
    vertices: [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ],
    isClosed: false,
    constantWidth: 10.0,
  };

  const expandedH = GeometryCompiler.expandLwPolyline(horizontalLine);
  assert(expandedH.thickTriangles, "Sabit genişlikli polyline thickTriangles üretmelidir");
  assert.strictEqual(expandedH.thickTriangles.vertices.length, 12, "2-noktalı segment tam 2 üçgen (12 koordinat) üretmeli");

  // Üst ve alt kenarların Y koordinatlarını kontrol et (+5.0 ve -5.0)
  const vertsH = expandedH.thickTriangles.vertices;
  let minY = Infinity, maxY = -Infinity;
  for (let i = 1; i < vertsH.length; i += 2) {
    minY = Math.min(minY, vertsH[i]);
    maxY = Math.max(maxY, vertsH[i]);
  }
  assert(Math.abs(minY - (-5.0)) < 1e-4, `Alt kenar Y=-5.0 olmalı, bulunan: ${minY}`);
  assert(Math.abs(maxY - 5.0) < 1e-4, `Üst kenar Y=5.0 olmalı, bulunan: ${maxY}`);

  console.log("  ✓ Kapı 7 PASS: Sabit genişlikli polyline quad üretimi");

  // --------------------------------------------------------------------------
  // Kapı 8: Tapered Polyline (startWidth -> endWidth)
  // --------------------------------------------------------------------------
  console.log("8. Tapered Polyline Tessellation...");

  const taperedPolyline: CadLwPolylineEntity = {
    type: "LWPOLYLINE",
    handle: "T1",
    order: BigInt(2),
    layer: "0",
    vertices: [
      { x: 0, y: 0, startWidth: 0.0, endWidth: 20.0 },
      { x: 100, y: 0 },
    ],
    isClosed: false,
  };

  const expandedTaper = GeometryCompiler.expandLwPolyline(taperedPolyline);
  assert(expandedTaper.thickTriangles, "Tapered polyline thickTriangles üretmelidir");
  const vertsTaper = expandedTaper.thickTriangles.vertices;

  // Başlangıç noktası civarındaki genişlik 0 olmalı
  let widthAtStart = 0;
  for (let i = 0; i < vertsTaper.length; i += 2) {
    if (Math.abs(vertsTaper[i] - 0) < 1e-4) {
      widthAtStart = Math.max(widthAtStart, Math.abs(vertsTaper[i + 1]));
    }
  }
  assert(widthAtStart < 1e-4, "Başlangıç noktası genişliği 0 olmalı");

  // Bitiş noktası civarındaki Y ±10.0 olmalı
  let maxEndY = 0;
  for (let i = 0; i < vertsTaper.length; i += 2) {
    if (Math.abs(vertsTaper[i] - 100) < 1e-4) {
      maxEndY = Math.max(maxEndY, Math.abs(vertsTaper[i + 1]));
    }
  }
  assert(Math.abs(maxEndY - 10.0) < 1e-4, `Bitiş noktası yarı genişliği 10.0 olmalı, bulunan: ${maxEndY}`);

  console.log("  ✓ Kapı 8 PASS: Tapered polyline genişlik interpolasyonu");

  // --------------------------------------------------------------------------
  // Kapı 9: Kapalı Polyline, Sıfır Uzunluklu Segment ve Miter Limit
  // --------------------------------------------------------------------------
  console.log("9. Kapalı Polyline, Sıfır Uzunluk ve Miter Limit...");

  // Sıfır uzunluklu segment içeren L-şeklinde polyline
  const degeneratePoly: CadLwPolylineEntity = {
    type: "LWPOLYLINE",
    handle: "D1",
    order: BigInt(3),
    layer: "0",
    vertices: [
      { x: 0, y: 0 },
      { x: 0, y: 0 }, // Sıfır uzunluklu dejenere segment!
      { x: 50, y: 0 },
      { x: 50, y: 50 },
    ],
    isClosed: false,
    constantWidth: 4.0,
  };

  const expDegen = GeometryCompiler.expandLwPolyline(degeneratePoly);
  assert(expDegen.thickTriangles, "Dejenere polyline güvenle tessellate edilmeli");
  // Koordinatlarda NaN veya Infinity olmamalı
  for (const c of expDegen.thickTriangles.vertices) {
    assert(Number.isFinite(c), "Üçgen koordinatları sonlu olmalı (NaN veya Inf yok)");
  }

  // Aşırı keskin açı (10 derecelik sivri köşe, miterLimit: 3.0 aşar -> Bevel Fallback)
  const sharpV: Array<{ point: [number, number]; startWidth?: number; endWidth?: number }> = [
    { point: [0, 0], startWidth: 2.0 },
    { point: [100, 0], startWidth: 2.0 },
    { point: [0, 5], startWidth: 2.0 }, // Çok dar açı
  ];
  const sharpTess = tessellatePolylineWithWidth(sharpV, false, { miterLimit: 3.0 });
  assert(sharpTess !== null, "Keskin açılı köşe tessellation üretmeli");
  for (const c of sharpTess) {
    assert(Number.isFinite(c), "Bevel fallback sonlu koordinatlar üretmeli");
  }

  console.log("  ✓ Kapı 9 PASS: Dejenere segment ve bevel fallback dayanıklılığı");

  // --------------------------------------------------------------------------
  // Kapı 10: Centerline Değişmezliği (Centerline Invariance)
  // --------------------------------------------------------------------------
  console.log("10. Centerline Değişmezliği...");

  // Genişlik verildiğinde de verilmese de centerline lineSegments noktaları birebir aynı kalmalıdır
  const pThin: CadLwPolylineEntity = {
    type: "LWPOLYLINE",
    handle: "P_THIN",
    order: BigInt(4),
    layer: "0",
    vertices: [{ x: 10, y: 20 }, { x: 40, y: 60 }, { x: 80, y: 20 }],
    isClosed: false,
  };
  const pThick: CadLwPolylineEntity = {
    type: "LWPOLYLINE",
    handle: "P_THICK",
    order: BigInt(5),
    layer: "0",
    vertices: [{ x: 10, y: 20 }, { x: 40, y: 60 }, { x: 80, y: 20 }],
    isClosed: false,
    constantWidth: 8.0,
  };

  const expThin = GeometryCompiler.expandLwPolyline(pThin);
  const expThick = GeometryCompiler.expandLwPolyline(pThick);

  assert.strictEqual(expThin.lineSegments.length, expThick.lineSegments.length, "Centerline segment sayısı eşit olmalı");
  for (let i = 0; i < expThin.lineSegments.length; i++) {
    const s0 = expThin.lineSegments[i];
    const s1 = expThick.lineSegments[i];
    assert.strictEqual(s0.x0, s1.x0, "Centerline x0 invariant olmalı");
    assert.strictEqual(s0.y0, s1.y0, "Centerline y0 invariant olmalı");
    assert.strictEqual(s0.x1, s1.x1, "Centerline x1 invariant olmalı");
    assert.strictEqual(s0.y1, s1.y1, "Centerline y1 invariant olmalı");
  }

  console.log("  ✓ Kapı 10 PASS: Centerline koordinat değişmezliği (centerline invariant)");

  // --------------------------------------------------------------------------
  // Kapı 11: Polyline Width ve Lineweight Çakışmama Kuralı
  // --------------------------------------------------------------------------
  console.log("11. Polyline Width ve Lineweight Etkileşimi...");

  // Varlık polyline width taşıyorsa, polyline width dünya uzayında çizilir.
  // Centerline'a lineweightMm atanarak çift kalınlaştırma yapılmaz!
  const docWithBoth: any = {
    sourceSha256: "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
    sourceVersionKey: "REV_STROKE_DOC",
    layers: {
      "0": { id: "0", name: "0", visible: true, frozen: false, locked: false, color: { method: "aci", aci: 7 }, lineweightMm: 1.00, linetypeName: "Continuous" },
    },
    blocks: {},
    modelSpaceEntities: [
      // 1. Saf ince çizgi (lineweight = 1.00 almalı)
      {
        type: "LINE",
        handle: "L_THIN",
        order: BigInt(6),
        layer: "0",
        start: [0, 0],
        end: [100, 0],
      },
      // 2. Genişlikli polyline (thickTriangles üretmeli, lineSegments lineweight 0 olmalı)
      {
        type: "LWPOLYLINE",
        handle: "L_WIDE",
        order: BigInt(7),
        layer: "0",
        vertices: [{ x: 0, y: 50 }, { x: 100, y: 50 }],
        isClosed: false,
        constantWidth: 5.0,
      },
      // 3. Sıfır genişlikli polyline (lineSegments lineweight = 1.00 almalı)
      {
        type: "LWPOLYLINE",
        handle: "L_ZERO",
        order: BigInt(8),
        layer: "0",
        vertices: [{ x: 0, y: 100 }, { x: 100, y: 100 }],
        isClosed: false,
      },
    ],
    paperSpaceLayouts: [],
  };

  const sceneResult = compileCanonicalToScene(docWithBoth);
  assert.strictEqual(sceneResult.manifest.chunks.length, 1);

  const chunkBytes = sceneResult.chunks.get(sceneResult.manifest.chunks[0].chunkId)!;
  const parsedChunk = parseSceneChunk(chunkBytes);

  const metaRaw = parsedChunk.sections.get(SceneTag.META)!.data as Uint8Array;
  const meta = JSON.parse(new TextDecoder().decode(metaRaw));

  // drawCommands ve layerRuns içinde lineweight kontrolü
  const drawCmds = meta.drawCommands;
  assert(drawCmds && drawCmds.length >= 2, "En az 2 drawCommand bulunmalı");

  // Çizgi 1 (LINE): lineweightMm = 1.0
  const lineCmd = drawCmds.find((c: any) => c.kind === "line" && Math.abs(c.lineweightMm - 1.0) < 1e-4);
  assert(lineCmd, "LINE komutu 1.00 mm lineweight taşımalı");

  // Genişlikli polyline üçgen komutu (triangle)
  const triCmd = drawCmds.find((c: any) => c.kind === "triangle");
  assert(triCmd, "Genişlikli polyline üçgen komutu üretmeli");

  // Genişlikli polyline'ın centerline komutu (lineweightMm = 0)
  const zeroLwLineCmd = drawCmds.find((c: any) => c.kind === "line" && Math.abs(c.lineweightMm - 0.0) < 1e-4);
  assert(zeroLwLineCmd, "Genişlikli polyline centerline komutu çift kalınlaştırmayı önlemek için lineweight 0 taşımalı");

  console.log("  ✓ Kapı 11 PASS: Polyline width ve lineweight çakışmama kuralı");

  // --------------------------------------------------------------------------
  // Kapı 12: Binary Protocol ve Single-Segment Quad Yardımcısı
  // --------------------------------------------------------------------------
  console.log("12. Single-Segment Quad ve Binary Roundtrip...");

  const quad = createLineStrokeQuad([0, 0], [10, 0], 2.0);
  assert(quad !== null, "createLineStrokeQuad 2 üçgen (12 koordinat) üretmeli");
  assert.strictEqual(quad.length, 12);
  assert(Math.abs(quad[1] - 1.0) < 1e-4, "Quad sol üst Y=1.0 olmalı");
  assert(Math.abs(quad[3] - (-1.0)) < 1e-4, "Quad sağ üst Y=-1.0 olmalı");

  // Sıfır uzunluklu çizgi quad üretmemeli (null)
  assert.strictEqual(createLineStrokeQuad([5, 5], [5, 5], 2.0), null);
  // Sıfır genişlik quad üretmemeli (null)
  assert.strictEqual(createLineStrokeQuad([0, 0], [10, 0], 0), null);

  console.log("  ✓ Kapı 12 PASS: Single-segment quad ve sınır dayanıklılığı");

  console.log("============================================================================");
  console.log("TÜM F02 GERÇEK STROKE, LINEWEIGHT & POLYLINE WIDTH KONTROLLERİ BAŞARILI!");
  console.log("============================================================================");
}

runF02StrokeWidthTests().catch((err) => {
  console.error("F02 Test Başarısız:", err);
  process.exit(1);
});
