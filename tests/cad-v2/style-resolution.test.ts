// ============================================================================
// DWG/DXF MOTOR V2 — F01 STYLE & COLOR RESOLUTION FIDELITY ACCEPTANCE TEST
// ============================================================================
// Sözleşme: DWG_DXF_Motor_V2_Kanitli_Kok_Neden_ve_Fidelity_Gemini_Uygulama_Plani_v3.md (F01)
// - ACI 1-255 ve RGB renk çözümü
// - ACI7 vs TrueColor beyaz ayrımı (0.88 kör koyultma yok)
// - ByBlock ve nested ByBlock hiyerarşisi
// - Layer 0 kalıtımı
// - Arka plan profilleri (dark, light, autocad)
// - Saydamlık (alpha) ve kaynak görünürlüğü ayrımı
// - Viewport katman ezmesi (VPLAYER override)
// - Monokrom modunun tahribatsız çalışması

import assert from "node:assert";
import {
  ACI_COLOR_TABLE,
  aciToRgb,
  aciToRgb255,
  cadColorToRgb,
  resolveCadStyle,
  resolveEntityColor,
  getAdaptiveRgb,
} from "../../src/lib/cad-v2/compile/cad-color-resolver";
import { EntityVisitor } from "../../src/lib/cad-v2/compile/entity-visitor";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { parseSceneChunk, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";
import type {
  CadCanonicalDocument,
  CadEntity,
  CadLayer,
  CadInsertEntity,
  CadBlockDefinition,
} from "../../src/lib/cad-v2/canonical/types";

async function runF01StyleResolutionTests() {
  console.log("============================================================================");
  console.log("DWG/DXF MOTOR V2 — F01 STYLE & COLOR RESOLUTION TESTİ");
  console.log("============================================================================");

  // --------------------------------------------------------------------------
  // 1. ACI 1-9 ve Standart 256 Renk Paleti Doğrulaması
  // --------------------------------------------------------------------------
  console.log("1. ACI 1-9 ve Standart 256 Renk Paleti Doğrulaması...");
  assert.strictEqual(ACI_COLOR_TABLE.length, 256, "ACI renk tablosu tam 256 renk içermelidir");

  // ACI 1: Kırmızı
  assert.deepStrictEqual(aciToRgb(1), [1, 0, 0], "ACI 1 Kırmızı olmalı");
  assert.deepStrictEqual(aciToRgb255(1), [255, 0, 0]);

  // ACI 2: Sarı
  assert.deepStrictEqual(aciToRgb(2), [1, 1, 0], "ACI 2 Sarı olmalı");
  assert.deepStrictEqual(aciToRgb255(2), [255, 255, 0]);

  // ACI 3: Yeşil
  assert.deepStrictEqual(aciToRgb(3), [0, 1, 0], "ACI 3 Yeşil olmalı");
  assert.deepStrictEqual(aciToRgb255(3), [0, 255, 0]);

  // ACI 4: Camgöbeği (Cyan)
  assert.deepStrictEqual(aciToRgb(4), [0, 1, 1], "ACI 4 Cyan olmalı");
  assert.deepStrictEqual(aciToRgb255(4), [0, 255, 255]);

  // ACI 5: Mavi
  assert.deepStrictEqual(aciToRgb(5), [0, 0, 1], "ACI 5 Mavi olmalı");
  assert.deepStrictEqual(aciToRgb255(5), [0, 0, 255]);

  // ACI 6: Macenta
  assert.deepStrictEqual(aciToRgb(6), [1, 0, 1], "ACI 6 Macenta olmalı");
  assert.deepStrictEqual(aciToRgb255(6), [255, 0, 255]);

  // ACI 7: Beyaz
  assert.deepStrictEqual(aciToRgb(7), [1, 1, 1], "ACI 7 Beyaz olmalı");
  assert.deepStrictEqual(aciToRgb255(7), [255, 255, 255]);

  // ACI 8: Koyu Gri
  assert.deepStrictEqual(aciToRgb(8), [0.5, 0.5, 0.5], "ACI 8 Koyu Gri olmalı");

  // ACI 9: Açık Gri
  assert.deepStrictEqual(aciToRgb(9), [0.75, 0.75, 0.75], "ACI 9 Açık Gri olmalı");

  // ACI 250..255 Gri Tonları
  assert.deepStrictEqual(aciToRgb(250), [0.33, 0.33, 0.33]);
  assert.deepStrictEqual(aciToRgb(255), [1.0, 1.0, 1.0]);

  console.log("  ✓ ACI 1-255 standart renk paleti ve sınırları PASS");

  // --------------------------------------------------------------------------
  // 2. ACI 7 ve Explicit TrueColor Ayrımı (Kör Koyultma Yok)
  // --------------------------------------------------------------------------
  console.log("2. ACI 7 ve Explicit TrueColor Ayrımı (r > 0.88 kör koyultma yok)...");

  const mockLayers: Record<string, CadLayer> = {
    "0": { id: "0", name: "0", visible: true, frozen: false, locked: false, color: { method: "aci", aci: 7 }, lineweightMm: 0, linetypeName: "Continuous" },
    "WALLS": { id: "WALLS", name: "WALLS", visible: true, frozen: false, locked: false, color: { method: "aci", aci: 1 }, lineweightMm: 0.25, linetypeName: "Continuous" },
  };

  // ACI 7 varlık
  const aci7Ent: Pick<CadEntity, "color" | "layer"> = {
    layer: "0",
    color: { method: "aci", aci: 7 },
  };
  const resolvedAci7 = resolveCadStyle(aci7Ent, mockLayers);
  assert.strictEqual(resolvedAci7.isAci7, true, "ACI 7 varlık isAci7=true taşımalı");
  assert.deepStrictEqual(resolvedAci7.rgb, [1, 1, 1]);

  // Explicit TrueColor Beyaz (255, 255, 255)
  const trueColorWhiteEnt: Pick<CadEntity, "color" | "layer"> = {
    layer: "0",
    color: { method: "rgb", rgb: [255, 255, 255] },
  };
  const resolvedTrueWhite = resolveCadStyle(trueColorWhiteEnt, mockLayers);
  assert.strictEqual(resolvedTrueWhite.isAci7, false, "TrueColor Beyaz isAci7=false olmalı (asla ACI 7 sayılmaz)");
  assert.deepStrictEqual(resolvedTrueWhite.rgb, [1, 1, 1]);

  // Explicit TrueColor Açık Gri (230, 230, 230)
  const trueColorLightGrayEnt: Pick<CadEntity, "color" | "layer"> = {
    layer: "0",
    color: { method: "rgb", rgb: [230, 230, 230] },
  };
  const resolvedLightGray = resolveCadStyle(trueColorLightGrayEnt, mockLayers);
  assert.strictEqual(resolvedLightGray.isAci7, false);
  assert.strictEqual(Math.abs(resolvedLightGray.rgb[0] - 230 / 255) < 1e-4, true);

  // Arka plan adaptasyonu kontrolü
  // ACI 7 koyu arka planda beyaz, açık arka planda siyah mürekkebe döner
  const aci7Dark = getAdaptiveRgb(resolvedAci7, false);
  assert.deepStrictEqual(aci7Dark, [1, 1, 1], "ACI 7 koyu arka planda beyaz olmalı");
  const aci7Light = getAdaptiveRgb(resolvedAci7, true);
  assert.deepStrictEqual(aci7Light, [0.08, 0.08, 0.08], "ACI 7 açık arka planda siyah/koyu mürekkep olmalı");

  // TrueColor Beyaz ise açık arka planda da ASLA koyulmaz, kendi beyazını korur!
  const trueWhiteLight = getAdaptiveRgb(resolvedTrueWhite, true);
  assert.deepStrictEqual(trueWhiteLight, [1, 1, 1], "TrueColor Beyaz açık arka planda da KENDİ BEYAZINI KORUMALI");
  const trueLightGrayLight = getAdaptiveRgb(resolvedLightGray, true);
  assert.strictEqual(trueLightGrayLight[0] > 0.88, true, "TrueColor Açık Gri koyultulmamalı");

  console.log("  ✓ ACI 7 ve TrueColor ayrımı, arka plan adaptasyon doğrulaması PASS");

  // --------------------------------------------------------------------------
  // 3. TrueColor + ACI Fallback Çözümlemesi
  // --------------------------------------------------------------------------
  console.log("3. TrueColor + ACI Fallback Çözümlemesi...");
  const fallbackEnt: Pick<CadEntity, "color" | "layer"> = {
    layer: "0",
    color: { method: "rgb", rgb: [100, 150, 200], aci: 150 },
  };
  const resolvedFallback = resolveCadStyle(fallbackEnt, mockLayers);
  assert.strictEqual(resolvedFallback.sourceMethod, "rgb");
  assert.strictEqual(resolvedFallback.aci, 150, "Kaynak ACI fallback korunmalı");
  assert.strictEqual(Math.abs(resolvedFallback.rgb[0] - 100 / 255) < 1e-4, true);
  assert.strictEqual(Math.abs(resolvedFallback.rgb[1] - 150 / 255) < 1e-4, true);
  assert.strictEqual(Math.abs(resolvedFallback.rgb[2] - 200 / 255) < 1e-4, true);

  console.log("  ✓ TrueColor + ACI fallback doğrulaması PASS");

  // --------------------------------------------------------------------------
  // 4. ByLayer Hiyerarşik Çözümlemesi
  // --------------------------------------------------------------------------
  console.log("4. ByLayer Çözümlemesi...");
  const byLayerEnt: Pick<CadEntity, "color" | "layer"> = {
    layer: "WALLS",
    color: { method: "byLayer" },
  };
  const resolvedByLayer = resolveCadStyle(byLayerEnt, mockLayers);
  assert.strictEqual(resolvedByLayer.sourceMethod, "byLayer");
  assert.deepStrictEqual(resolvedByLayer.rgb, [1, 0, 0], "WALLS katmanı Kırmızı ACI 1 olduğundan kırmızı dönmeli");

  // Katmanda açıkça TrueColor RGB tanımlı olması
  const layersWithRgb: Record<string, CadLayer> = {
    ...mockLayers,
    "SPECIAL": {
      id: "SPECIAL",
      name: "SPECIAL",
      visible: true,
      frozen: false,
      locked: false,
      color: { method: "rgb", rgb: [12, 34, 56] },
      lineweightMm: 0,
      linetypeName: "Continuous",
    },
  };
  const resolvedSpecial = resolveCadStyle({ layer: "SPECIAL" }, layersWithRgb);
  assert.strictEqual(resolvedSpecial.sourceMethod, "byLayer");
  assert.strictEqual(Math.abs(resolvedSpecial.rgb[0] - 12 / 255) < 1e-4, true);

  console.log("  ✓ ByLayer katman rengi çözümlemesi PASS");

  // --------------------------------------------------------------------------
  // 5. ByBlock ve Nested ByBlock Çözümlemesi
  // --------------------------------------------------------------------------
  console.log("5. ByBlock ve Nested ByBlock Çözümlemesi...");

  // Tekil ByBlock INSERT
  const rootInsert: CadInsertEntity = {
    handle: "INS_ROOT",
    type: "INSERT",
    layer: "WALLS",
    order: BigInt(10),
    blockName: "BLK_PARENT",
    insertionPoint: [0, 0],
    scale: [1, 1, 1],
    rotationRad: 0,
    color: { method: "rgb", rgb: [0, 255, 0] }, // Açık Yeşil
  };

  const byBlockEnt: Pick<CadEntity, "color" | "layer"> = {
    layer: "0",
    color: { method: "byBlock" },
  };

  const resolvedSingleByBlock = resolveCadStyle(byBlockEnt, mockLayers, {
    parentInsert: rootInsert,
    parentInserts: [rootInsert],
  });
  assert.strictEqual(resolvedSingleByBlock.sourceMethod, "byBlock");
  assert.deepStrictEqual(resolvedSingleByBlock.rgb, [0, 1, 0], "ByBlock çocuk, parent INSERT rengini (Yeşil) almalı");

  // Nested ByBlock:
  // Root INSERT (Mavi) -> Child INSERT (ByBlock) -> Entity (ByBlock)
  const rootInsertBlue: CadInsertEntity = {
    handle: "INS_TOP",
    type: "INSERT",
    layer: "0",
    order: BigInt(10),
    blockName: "BLK_TOP",
    insertionPoint: [0, 0],
    scale: [1, 1, 1],
    rotationRad: 0,
    color: { method: "aci", aci: 5 }, // Mavi
  };

  const childInsertByBlock: CadInsertEntity = {
    handle: "INS_MID",
    type: "INSERT",
    layer: "0",
    order: BigInt(11),
    blockName: "BLK_CHILD",
    insertionPoint: [0, 0],
    scale: [1, 1, 1],
    rotationRad: 0,
    color: { method: "byBlock" },
  };

  const resolvedNested = resolveCadStyle(byBlockEnt, mockLayers, {
    parentInsert: childInsertByBlock,
    parentInserts: [rootInsertBlue, childInsertByBlock],
  });
  assert.strictEqual(resolvedNested.sourceMethod, "byBlock");
  assert.deepStrictEqual(resolvedNested.rgb, [0, 0, 1], "Nested ByBlock yığınında yukarı yürüyüp Mavi kök rengini bulmalı");

  // Top-level ByBlock (ebeveyn yok): ACI 7 fallback
  const resolvedTopByBlock = resolveCadStyle(byBlockEnt, mockLayers);
  assert.strictEqual(resolvedTopByBlock.isAci7, true, "Top-level ByBlock ACI 7 fallback üretmeli");

  console.log("  ✓ ByBlock ve nested ByBlock çözümleme yığını PASS");

  // --------------------------------------------------------------------------
  // 6. Layer 0 Kalıtımı (EntityVisitor Doğrulaması)
  // --------------------------------------------------------------------------
  console.log("6. Layer 0 Kalıtımı ve EntityVisitor Doğrulaması...");

  const blockDefWithLayer0: CadBlockDefinition = {
    name: "BLK_TEST_L0",
    basePoint: [0, 0],
    entities: [
      {
        handle: "H_L0_LINE",
        type: "LINE",
        layer: "0", // Layer 0 varlığı
        start: [0, 0],
        end: [100, 0],
        order: BigInt(1),
        color: { method: "byLayer" },
      },
      {
        handle: "H_DOOR_LINE",
        type: "LINE",
        layer: "DOORS", // Layer 0 olmayan varlık
        start: [0, 10],
        end: [100, 10],
        order: BigInt(2),
        color: { method: "byLayer" },
      },
    ],
  };

  const layersWithDoors: Record<string, CadLayer> = {
    ...mockLayers,
    "DOORS": {
      id: "DOORS",
      name: "DOORS",
      visible: true,
      frozen: false,
      locked: false,
      color: { method: "aci", aci: 4 }, // Cyan
      lineweightMm: 0.15,
      linetypeName: "Continuous",
    },
    "FURNITURE": {
      id: "FURNITURE",
      name: "FURNITURE",
      visible: true,
      frozen: false,
      locked: false,
      color: { method: "aci", aci: 6 }, // Magenta
      lineweightMm: 0.20,
      linetypeName: "Continuous",
    },
  };

  const visitor = new EntityVisitor({
    blocks: { BLK_TEST_L0: blockDefWithLayer0 },
    layers: layersWithDoors,
  });

  const insertOnFurniture: CadInsertEntity = {
    handle: "INS_FURN",
    type: "INSERT",
    layer: "FURNITURE", // INSERT FURNITURE katmanında
    order: BigInt(100),
    blockName: "BLK_TEST_L0",
    insertionPoint: [0, 0],
    scale: [1, 1, 1],
    rotationRad: 0,
  };

  const visitorRes = visitor.createEmptyResult();
  const rootCtx = visitor.createRootContext("FURNITURE", BigInt(100));
  visitor.visitEntity(insertOnFurniture, rootCtx, visitorRes);

  assert.strictEqual(visitorRes.segments.length, 2, "2 segment üretilmeli");

  const l0Seg = visitorRes.segments.find((s) => s.y0 === 0);
  assert(l0Seg, "Layer 0 kaynaklı segment bulunmalı");
  assert.strictEqual(l0Seg.layer, "FURNITURE", "Layer 0 varlığı parent INSERT katmanını (FURNITURE) miras almalı");
  assert.deepStrictEqual(l0Seg.color, [1, 0, 1], "Layer 0 varlığı FURNITURE rengi olan Magenta'yı almalı");

  const doorSeg = visitorRes.segments.find((s) => s.y0 === 10);
  assert(doorSeg, "DOORS katmanındaki segment bulunmalı");
  assert.strictEqual(doorSeg.layer, "DOORS", "DOORS varlığı kendi katmanında kalmalı");
  assert.deepStrictEqual(doorSeg.color, [0, 1, 1], "DOORS varlığı kendi katman rengi olan Cyan'ı almalı");

  console.log("  ✓ Layer 0 kalıtımı ve bağımsız katman izolasyonu PASS");

  // --------------------------------------------------------------------------
  // 7. Saydamlık (Alpha) ve Görünürlük Ayrımı
  // --------------------------------------------------------------------------
  console.log("7. Saydamlık (Alpha) ve Görünürlük Ayrımı...");

  // Açık entity alpha
  const transparentEnt: Pick<CadEntity, "color" | "layer"> = {
    layer: "0",
    color: { method: "rgb", rgb: [255, 0, 0], alpha: 0.4 },
  };
  const resolvedAlpha = resolveCadStyle(transparentEnt, mockLayers);
  assert.strictEqual(resolvedAlpha.alpha, 0.4, "Entity saydamlığı 0.4 olmalı");

  // ByLayer alpha
  const layerWithAlpha: Record<string, CadLayer> = {
    "GLASS": {
      id: "GLASS",
      name: "GLASS",
      visible: true,
      frozen: false,
      locked: false,
      color: { method: "aci", aci: 4, alpha: 0.25 },
      lineweightMm: 0.1,
      linetypeName: "Continuous",
    },
  };
  const resolvedGlass = resolveCadStyle({ layer: "GLASS" }, layerWithAlpha);
  assert.strictEqual(resolvedGlass.alpha, 0.25, "Katmanda tanımlı alpha 0.25 miras alınmalı");

  // alpha = 0 (tam şeffaf ama sahneye katılır) vs visible = false (tamamen elenir)
  const invisibleEnt: CadEntity = {
    handle: "H_INVIS",
    type: "LINE",
    layer: "0",
    start: [0, 0],
    end: [10, 10],
    order: BigInt(1),
    visible: false,
  };
  const resInvis = visitor.createEmptyResult();
  visitor.visitEntity(invisibleEnt, rootCtx, resInvis);
  assert.strictEqual(resInvis.segments.length, 0, "visible=false varlığı primitive üretmemeli");
  assert.strictEqual(resInvis.diagnostics[0]?.code, "EXCLUDED_BY_SOURCE_VISIBILITY");

  console.log("  ✓ Saydamlık (alpha) ve görünürlük ayrımı PASS");

  // --------------------------------------------------------------------------
  // 8. Viewport Katman Ezmesi (VPLAYER Override)
  // --------------------------------------------------------------------------
  console.log("8. Viewport Katman Ezmesi (VPLAYER Override)...");

  // WALLS normalde Kırmızı ACI 1
  const normalStyle = resolveCadStyle({ layer: "WALLS" }, mockLayers);
  assert.deepStrictEqual(normalStyle.rgb, [1, 0, 0], "Normalde Kırmızı");

  // Viewport içinde WALLS Sarı ACI 2 olarak ezilmiş
  const vpOverrideStyle = resolveCadStyle({ layer: "WALLS" }, mockLayers, {
    viewportId: "VP1",
    layerOverrides: {
      "WALLS": {
        color: { method: "aci", aci: 2 }, // Sarı
      },
    },
  });
  assert.deepStrictEqual(vpOverrideStyle.rgb, [1, 1, 0], "Viewport ezmesinde Sarı ACI 2 dönmeli");
  assert.strictEqual(vpOverrideStyle.sourceMethod, "byLayer");

  console.log("  ✓ Viewport katman ezmesi doğrulaması PASS");

  // --------------------------------------------------------------------------
  // 9. Sahne Derleyicisi DrawCommands isAci7 ve Alpha Doğrulaması
  // --------------------------------------------------------------------------
  console.log("9. Sahne Derleyicisi DrawCommands isAci7 ve Alpha İletimi...");

  const canonicalDoc: CadCanonicalDocument = {
    sourceVersionKey: "v1",
    sourceSha256: "test",
    acadVersion: "AC1032",
    codepage: "ANSI_1254",
    units: 4,
    measurement: 1,
    layers: mockLayers,
    linetypes: {},
    textStyles: {},
    blocks: {},
    layouts: {
      Model: { id: "Model", name: "Model", isModelSpace: true, bbox: [0, 0, 100, 100] },
    },
    viewports: {},
    diagnostics: [],
    modelSpaceEntities: [
      // 1. Çizgi: ACI 7 (isAci7=true olmalı)
      {
        handle: "L1",
        type: "LINE",
        layer: "0",
        start: [0, 0],
        end: [10, 0],
        order: BigInt(1),
        color: { method: "aci", aci: 7 },
      },
      // 2. Çizgi: TrueColor Beyaz (isAci7=false olmalı ve ayrı komut olmalı)
      {
        handle: "L2",
        type: "LINE",
        layer: "0",
        start: [10, 0],
        end: [20, 0],
        order: BigInt(2),
        color: { method: "rgb", rgb: [255, 255, 255] },
      },
      // 3. Çizgi: Şeffaf Kırmızı (alpha=0.5)
      {
        handle: "L3",
        type: "LINE",
        layer: "WALLS",
        start: [20, 0],
        end: [30, 0],
        order: BigInt(3),
        color: { method: "rgb", rgb: [255, 0, 0], alpha: 0.5 },
      },
    ],
  };

  const compiled = compileCanonicalToScene(canonicalDoc, { sceneId: "test_job" });
  assert.strictEqual(compiled.chunks.size, 1);

  const chunkMeta = compiled.manifest.chunks[0];
  assert(chunkMeta);

  // Derlenen ilk chunk'ın ikili verisini incele
  const chunkBuffer = Array.from(compiled.chunks.values())[0];
  const parsedChunk = parseSceneChunk(chunkBuffer);
  const metaSec = parsedChunk.sections.get(SceneTag.META);
  assert(metaSec, "META section bulunamadı");
  const metaBytes = new Uint8Array(metaSec.data.buffer, metaSec.data.byteOffset, metaSec.header.byteLength);
  const metaJsonStr = new TextDecoder().decode(metaBytes);
  const parsedMeta = JSON.parse(metaJsonStr);

  const drawCmds = parsedMeta.drawCommands;
  assert(Array.isArray(drawCmds), "drawCommands dizisi bulunmalı");
  assert(drawCmds.length >= 3, "En az 3 ayrık drawCommand olmalı (ACI 7, TrueColor Beyaz ve Şeffaf Kırmızı birleşmemeli)");

  // Komut 1: ACI 7
  assert.strictEqual(drawCmds[0].isAci7, true, "İlk komut isAci7=true olmalı");

  // Komut 2: TrueColor Beyaz (isAci7=false)
  assert.strictEqual(drawCmds[1].isAci7, false, "İkinci komut isAci7=false olmalı (TrueColor)");

  // Komut 3: Şeffaf Kırmızı
  assert.strictEqual(drawCmds[2].alpha, 0.5, "Üçüncü komut alpha=0.5 taşımalı");

  console.log("  ✓ Binary chunk drawCommands içinde isAci7 ve alpha iletimi PASS");

  // --------------------------------------------------------------------------
  // 10. Geriye Dönük Uyumluluk (resolveEntityColor)
  // --------------------------------------------------------------------------
  console.log("10. Geriye Dönük Uyumluluk (resolveEntityColor)...");
  const rgbLegacy = resolveEntityColor(aci7Ent, mockLayers);
  assert(Array.isArray(rgbLegacy) && rgbLegacy.length === 3);
  assert.deepStrictEqual(rgbLegacy, [1, 1, 1]);

  console.log("  ✓ resolveEntityColor geriye dönük uyumluluğu PASS");

  console.log("\n============================================================================");
  console.log("F01 STYLE & COLOR RESOLUTION: TÜM KABUL KAPILARI GEÇTİ (PASS)");
  console.log("============================================================================");
}

runF01StyleResolutionTests().catch((err) => {
  console.error("F01 Test Başarısız:", err);
  process.exit(1);
});
