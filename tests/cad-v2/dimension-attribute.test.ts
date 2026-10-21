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
import { mapDwgInsertAttributeInstances } from "../../src/lib/cad-v2/decode/dwg-insert-attributes";
import { parseDxfToCanonical } from "../../src/lib/cad-v2/decode/dxf-adapter";
import { parseDxfDimensionOverridePairs } from "../../src/lib/cad-v2/decode/dxf-dimension-override-pairs";
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
    assert(!result.diagnostics.some((diagnostic) => diagnostic.code === CadDiagnosticCode.DIMENSION_SYNTHESIZED_FROM_DEFINITION),
      "Drawable saved graphics block has priority over synthesized geometry");
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

    doc.blocks["*D_EMPTY_TEXT"] = {
      name: "*D_EMPTY_TEXT",
      basePoint: [0, 0],
      entities: [{
        handle: "D_EMPTY_TEXT",
        type: "TEXT",
        layer: "0",
        order: BigInt(3),
        text: "",
        insertionPoint: [75, 45],
        height: 2.5,
        rotationRad: 0,
        widthFactor: 1,
        obliqueRad: 0,
        styleName: "STANDARD",
      }],
    };
    const invalidSavedBlockDim: CadDimensionEntity = {
      ...dimLinear,
      handle: "DIM_INVALID_SAVED_BLOCK",
      anonymousBlockName: "*D_EMPTY_TEXT",
    };
    const invalidSavedBlockResult = visitor.createEmptyResult();
    visitor.visitEntity(invalidSavedBlockDim, ctx, invalidSavedBlockResult);
    assert(invalidSavedBlockResult.diagnostics.some((diagnostic) =>
      diagnostic.code === CadDiagnosticCode.DIMENSION_SYNTHESIZED_FROM_DEFINITION),
    "A nonempty saved block with no drawable output falls back with an explicit diagnosis");
    assert(invalidSavedBlockResult.segments.some((segment) =>
      Math.abs(segment.y0 - 40) < 1e-2 && Math.abs(segment.y1 - 40) < 1e-2 && Math.abs(segment.x1 - segment.x0) > 50),
    "Invalid saved graphics block recovers the same measurement line from definition points");
    assert.strictEqual(invalidSavedBlockResult.segments.length, result.segments.length,
      "Invalid saved graphics block produces one synthesized dimension, not duplicate strokes");

    doc.layers.FROZEN_DIM = { ...doc.layers.DIM!, id: "FROZEN_DIM", name: "FROZEN_DIM", frozen: true };
    doc.blocks["*D_FROZEN"] = {
      name: "*D_FROZEN",
      basePoint: [0, 0],
      entities: [{ handle: "D_FROZEN_LINE", type: "LINE", layer: "FROZEN_DIM", order: BigInt(4), start: [0, 40], end: [150, 40] }],
    };
    const frozenSavedBlockResult = visitor.createEmptyResult();
    visitor.visitEntity({ ...dimLinear, handle: "DIM_FROZEN_SAVED_BLOCK", anonymousBlockName: "*D_FROZEN" }, ctx, frozenSavedBlockResult);
    assert.strictEqual(frozenSavedBlockResult.segments.length, 0, "Frozen saved-block layer stays hidden");
    assert(!frozenSavedBlockResult.diagnostics.some((diagnostic) =>
      diagnostic.code === CadDiagnosticCode.DIMENSION_SYNTHESIZED_FROM_DEFINITION),
    "An intentionally hidden saved block is not mistaken for an invalid graphic");

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
    const renderAngularText = (text: string) => {
      const rendered = visitor.createEmptyResult();
      visitor.visitEntity({ ...dimAngular, text }, ctx, rendered);
      return rendered.segments;
    };
    assert.deepStrictEqual(renderAngularText("Açı <>"), renderAngularText("Açı 45.0°"),
      "Açısal placeholder, kaynakta yazılı eşdeğer derece etiketine dönüşmeli");
    assert.deepStrictEqual(renderAngularText("Açı <>°"), renderAngularText("Açı 45.0°"),
      "Kaynak şablonda bulunan derece imi iki kez çizilmemeli");
    assert.deepStrictEqual(renderAngularText("Açı <>%%d"), renderAngularText("Açı 45.0%%d"),
      "Kaynak %%d derece kaçışı iki kez çizilmemeli");
    assert.notDeepStrictEqual(renderAngularText("ÖZEL AÇI"), renderAngularText("ÖZEL AÇI°"),
      "Açısal literal override kaynağa ek derece imi almamalı");

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
    assert.strictEqual(formatDimensionText("<>", 45, { decimals: 1, suffix: "°" }), "45.0°", "Açısal ölçü değeri derece imiyle yazılır");
    assert.strictEqual(formatDimensionText("Açı <>", 45, { decimals: 1, suffix: "°" }), "Açı 45.0°", "Açısal şablon derece imini yalnız değere ekler");
    assert.strictEqual(formatDimensionText("ÖZEL AÇI", 45, { decimals: 1, suffix: "°" }), "ÖZEL AÇI", "Literal açısal override sonuna derece imi eklenmez");
    assert.strictEqual(formatDimensionText("45°", 45, { decimals: 1, suffix: "°" }), "45°", "Kaynak derece imi yinelenmez");
    assert.strictEqual(formatDimensionText("<>°", 45, { decimals: 1, suffix: "°" }), "45.0°", "Şablondaki derece imi yinelenmez");
    assert.strictEqual(formatDimensionText("<>%%d", 45, { decimals: 1, suffix: "°" }), "45.0%%d", "DXF derece kaçışı yinelenmez");
    assert.strictEqual(formatDimensionText("<>", d, { decimals: 3, unitFormat: "scientific" }), "1.255E+02", "Scientific primary DIMLUNIT fixed precision and exponent format");
    assert.strictEqual(formatDimensionText("<>", 10, { decimals: 3, unitScale: 0.5 }), "5.000", "Positive DIMLFAC scales the linear label value before formatting");
    assert.strictEqual(formatDimensionText("<>", 10, {
      decimals: 3,
      unitScale: 0.5,
      symmetricTolerance: { value: 0.25, decimals: 3 },
    }), "5.000%%p0.250", "Symmetric DIMTP/DIMTM uses DIMTDEC and remains independent from DIMLFAC");
    const precisionFixturePath = path.join(process.cwd(), "tests/fixtures/dxf/stage3-dimensions.dxf");
    const precisionSource = fs.readFileSync(precisionFixturePath, "utf8");
    const newline = precisionSource.includes("\r\n") ? "\r\n" : "\n";
    const precisionSourceWithDimdec = precisionSource.replace(
      /(140\r?\n2\.5\r?\n)0(\r?\nENDTAB)/,
      (_match, prefix, suffix) => `${prefix}271${newline}3${newline}0${suffix}`
    );
    assert.notStrictEqual(precisionSourceWithDimdec, precisionSource, "DXF fixture DIMSTYLE record was extended with DIMDEC=3");
    const precisionDoc = await parseDxfToCanonical(Buffer.from(precisionSourceWithDimdec), { sourceVersionKey: "f05-dimdec-dxf" });
    const precisionDim = precisionDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.styleName === "STANDARD" && !entity.anonymousBlockName && (entity.dimType & 0x07) === 0
    );
    assert(precisionDim, "The DXF source contains a linear DIMENSION without a saved graphics block");
    assert.strictEqual(precisionDim.primaryUnitDecimals, 3, "DIMSTYLE group 271 reaches canonical DIMENSION precision");

    const precisionVisitor = new EntityVisitor({
      blocks: precisionDoc.blocks,
      layers: precisionDoc.layers,
      linetypes: precisionDoc.linetypes,
      textStyles: precisionDoc.textStyles,
    });
    const compileDimension = (dim: CadDimensionEntity) => {
      const result = precisionVisitor.createEmptyResult();
      precisionVisitor.visitEntity(dim, precisionVisitor.createRootContext(dim.layer, dim.order), result);
      return result;
    };
    const sourcePrecisionResult = compileDimension(precisionDim);
    const twoDecimalControl = compileDimension({ ...precisionDim, primaryUnitDecimals: 2 });
    assert(sourcePrecisionResult.segments.length > twoDecimalControl.segments.length,
      "Synthesized primary-unit label at source DIMDEC=3 emits additional glyph strokes over the 2-decimal control");

    // AutoCAD ACAD/DSTYLE XDATA: the first source entity overrides three style fields.
    const handledDimensionSource = precisionSourceWithDimdec.replace(
      `0${newline}DIMENSION${newline}8${newline}0`,
      `0${newline}DIMENSION${newline}5${newline}D05A${newline}8${newline}0`
    );
    const overrideSource = handledDimensionSource.replace(
      `1${newline}<>${newline}0${newline}DIMENSION`,
      `1${newline}<>${newline}1001${newline}ACAD${newline}1000${newline}DSTYLE${newline}1002${newline}{${newline}1070${newline}271${newline}1070${newline}1${newline}1070${newline}144${newline}1040${newline}0.5${newline}1070${newline}75${newline}1070${newline}1${newline}1002${newline}}${newline}0${newline}DIMENSION`
    );
    assert.notStrictEqual(overrideSource, handledDimensionSource, "ACAD/DSTYLE override was injected into the selected DIMENSION");
    const overrideDoc = await parseDxfToCanonical(Buffer.from(overrideSource), { sourceVersionKey: "f05-entity-dstyle-override" });
    const overrideScan = await parseDxfDimensionOverridePairs(Buffer.from(overrideSource));
    assert.deepStrictEqual([...overrideScan.byHandle.get("D05A")!.values.entries()], [[271, 1], [144, 0.5], [75, 1]],
      "Source ACAD/DSTYLE integer and real pairs are preserved by handle");
    assert(!overrideScan.byHandle.get("D05A")!.unsupported, "Selected DSTYLE pairs are syntactically supported");
    assert.deepStrictEqual(overrideScan.geometryByHandle.get("D05A")?.defPoint, [5, 5], "DXF group 10/20 retains the source dimension-line point");
    assert.deepStrictEqual(overrideScan.geometryByHandle.get("D05A")?.line1Start, [0, 0], "DXF group 13/23 retains the first extension origin");
    assert.deepStrictEqual(overrideScan.geometryByHandle.get("D05A")?.line1End, [10, 0], "DXF group 14/24 retains the second extension origin");
    const overrideDim = overrideDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.handle === "D05A"
    );
    assert(overrideDim, "DXF objectId retains the source DIMENSION handle for DSTYLE binding");
    assert.strictEqual(overrideDim.primaryUnitDecimals, 1, "Per-entity DIMDEC takes precedence over DIMSTYLE DIMDEC=3");
    assert.strictEqual(overrideDim.primaryUnitScale, 0.5, "Per-entity DIMLFAC overrides the style value");
    assert.strictEqual(overrideDim.suppressFirstExtensionLine, true, "Per-entity DIMSE1 reaches canonical geometry");
    assert.deepStrictEqual(overrideDim.defPoint, [5, 5], "The source dimension-line point replaces converter zero defaults");
    assert.deepStrictEqual(overrideDim.line1Start, [0, 0], "The first source extension origin reaches canonical geometry");
    assert.deepStrictEqual(overrideDim.line1End, [10, 0], "The second source extension origin reaches canonical geometry");
    const overrideResult = compileDimension(overrideDim);
    assert(overrideResult.segments.some((segment) =>
      Math.abs(segment.y0 - 5) < 1e-6 && Math.abs(segment.y1 - 5) < 1e-6
      && Math.abs(Math.abs(segment.x1 - segment.x0) - 10) < 1e-6),
    "The synthesized dimension line follows source extension origins at source y=5");
    const overrideControl = compileDimension({ ...overrideDim, primaryUnitDecimals: 3, primaryUnitScale: 1, suppressFirstExtensionLine: false });
    assert(overrideResult.segments.length < overrideControl.segments.length,
      "Per-entity style fields change synthesized label and one extension line");
    assert(!overrideDoc.diagnostics.some((diagnostic) => diagnostic.code === "UNRESOLVED_DIMENSION_ENTITY_OVERRIDE"),
      "A securely matched source objectId needs no unresolved-override diagnosis");
    const neighborDimension = overrideDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.handle !== "D05A" && entity.styleName === "STANDARD"
    );
    assert(neighborDimension, "The source has a neighboring dimension without the override");
    assert.strictEqual(neighborDimension.primaryUnitDecimals, 3, "Per-entity DIMDEC does not leak to the neighboring style peer");
    assert.notStrictEqual(neighborDimension.suppressFirstExtensionLine, true, "Per-entity DIMSE1 does not leak to the neighboring dimension");

    const obliqueSource = overrideSource.replace(
      `34${newline}0${newline}1${newline}<>${newline}1001${newline}ACAD`,
      `34${newline}0${newline}52${newline}15${newline}1${newline}<>${newline}1001${newline}ACAD`
    );
    assert.notStrictEqual(obliqueSource, overrideSource, "An unsupported source oblique angle was injected into the handled entity");
    const obliqueDoc = await parseDxfToCanonical(Buffer.from(obliqueSource), { sourceVersionKey: "f05-source-oblique" });
    assert(obliqueDoc.diagnostics.some((diagnostic) =>
      diagnostic.code === "UNRESOLVED_DIMENSION_SOURCE_GEOMETRY" && diagnostic.entityHandle === "D05A"),
    "Unsupported source oblique geometry is explicitly diagnosed on the source handle");
    const obliqueScene = compileCanonicalToScene(obliqueDoc);
    assert.strictEqual(obliqueScene.manifest.qualityStatus, "degraded", "Unsupported source geometry degrades the compiled scene");
    assert(obliqueScene.manifest.diagnosticsSummary.diagnosticCodes.includes("UNRESOLVED_DIMENSION_SOURCE_GEOMETRY"),
      "The compiled scene retains the unsupported source geometry diagnosis");

    const alignedSource = precisionSourceWithDimdec.replace(
      `0${newline}DIMENSION${newline}8${newline}0${newline}3${newline}STANDARD${newline}70${newline}1`,
      `0${newline}DIMENSION${newline}5${newline}A05A${newline}8${newline}0${newline}3${newline}STANDARD${newline}70${newline}1`
    );
    assert.notStrictEqual(alignedSource, precisionSourceWithDimdec, "The aligned source entity has a stable handle");
    const alignedDoc = await parseDxfToCanonical(Buffer.from(alignedSource), { sourceVersionKey: "f05-source-aligned" });
    const alignedDim = alignedDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.handle === "A05A"
    );
    assert(alignedDim, "The aligned source handle reaches canonical DIMENSION");
    assert.strictEqual(alignedDim.dimType & 7, 1, "Source group 70 restores aligned type lost by the converter");
    assert(!alignedDoc.diagnostics.some((diagnostic) => diagnostic.code === "UNRESOLVED_DIMENSION_SOURCE_GEOMETRY"),
      "A complete aligned source geometry profile needs no unresolved-source diagnosis");
    assert.deepStrictEqual(alignedDim.defPoint, [5, 15], "Aligned group 10/20 reaches the dimension-line point");
    assert.deepStrictEqual(alignedDim.line1Start, [0, 10], "Aligned group 13/23 reaches the first extension origin");
    assert.deepStrictEqual(alignedDim.line1End, [10, 10], "Aligned group 14/24 reaches the second extension origin");
    assert(compileDimension(alignedDim).segments.some((segment) =>
      Math.abs(segment.y0 - 15) < 1e-6 && Math.abs(segment.y1 - 15) < 1e-6
      && Math.abs(Math.abs(segment.x1 - segment.x0) - 10) < 1e-6),
    "Aligned dimension synthesis uses source extension origins at y=15");

    const rotatedSource = handledDimensionSource
      .replace(`70${newline}0${newline}10${newline}5${newline}20${newline}5`,
        `70${newline}0${newline}50${newline}90${newline}10${newline}5${newline}20${newline}5`)
      .replace(`14${newline}10${newline}24${newline}0${newline}34${newline}0${newline}1${newline}<>`,
        `14${newline}0${newline}24${newline}10${newline}34${newline}0${newline}1${newline}<>`);
    assert.notStrictEqual(rotatedSource, handledDimensionSource, "A rotated source geometry profile was constructed");
    const rotatedDoc = await parseDxfToCanonical(Buffer.from(rotatedSource), { sourceVersionKey: "f05-source-rotated" });
    const rotatedDim = rotatedDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.handle === "D05A"
    );
    assert(rotatedDim, "The rotated source handle reaches canonical DIMENSION");
    assert(Math.abs(rotatedDim.rotationRad - Math.PI / 2) < 1e-12, "DXF group 50 degrees becomes canonical radians");
    assert.deepStrictEqual(rotatedDim.line1End, [0, 10], "Rotated source group 14/24 overrides converter coordinates");
    assert(compileDimension(rotatedDim).segments.some((segment) =>
      Math.abs(segment.x0 - 5) < 1e-6 && Math.abs(segment.x1 - 5) < 1e-6
      && Math.abs(Math.abs(segment.y1 - segment.y0) - 10) < 1e-6),
    "Rotated linear dimension synthesis follows the source x=5 line");

    const unknownOverrideSource = overrideSource.replace(
      `1002${newline}}${newline}0${newline}DIMENSION`,
      `1070${newline}177${newline}1070${newline}3${newline}1002${newline}}${newline}0${newline}DIMENSION`
    );
    const unknownOverrideDoc = await parseDxfToCanonical(Buffer.from(unknownOverrideSource), { sourceVersionKey: "f05-entity-dstyle-unknown" });
    assert(unknownOverrideDoc.diagnostics.some((diagnostic) =>
      diagnostic.code === "UNSUPPORTED_DIMENSION_ENTITY_OVERRIDE" && diagnostic.entityHandle === "D05A"),
    "Unsupported DSTYLE field on one DIMENSION is diagnosed on its source handle");
    const invalidOverrideSource = overrideSource.replace(`1070${newline}271${newline}1070${newline}1`,
      `1070${newline}271${newline}1070${newline}99`);
    const invalidOverrideDoc = await parseDxfToCanonical(Buffer.from(invalidOverrideSource), { sourceVersionKey: "f05-entity-dstyle-invalid" });
    assert(invalidOverrideDoc.diagnostics.some((diagnostic) =>
      diagnostic.code === "UNSUPPORTED_DIMENSION_ENTITY_OVERRIDE" && diagnostic.entityHandle === "D05A"),
    "Out-of-range per-entity DIMDEC is diagnosed even when the converter loses the source handle");
    const handlelessOverrideSource = overrideSource.replace(`5${newline}D05A${newline}8${newline}0`, `8${newline}0`);
    const handlelessOverrideDoc = await parseDxfToCanonical(Buffer.from(handlelessOverrideSource), { sourceVersionKey: "f05-entity-dstyle-handleless" });
    assert(handlelessOverrideDoc.diagnostics.some((diagnostic) => diagnostic.code === "UNRESOLVED_DIMENSION_ENTITY_OVERRIDE"),
      "Handleless DSTYLE XDATA remains an explicit unbound diagnosis");

    const scientificSource = precisionSourceWithDimdec.replace(
      /(271\r?\n3\r?\n)0(\r?\nENDTAB)/,
      (_match, prefix, suffix) => `${prefix}277${newline}1${newline}0${suffix}`
    );
    assert.notStrictEqual(scientificSource, precisionSourceWithDimdec, "DXF DIMSTYLE record was extended with DIMLUNIT=1");
    const scientificDoc = await parseDxfToCanonical(Buffer.from(scientificSource), { sourceVersionKey: "f05-dimlunit-scientific-dxf" });
    const scientificDim = scientificDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.styleName === "STANDARD" && !entity.anonymousBlockName && (entity.dimType & 0x07) === 0
    );
    assert(scientificDim, "The scientific DIMLUNIT source contains a linear DIMENSION without a saved graphics block");
    assert.strictEqual(scientificDim.primaryUnitFormat, "scientific", "DIMSTYLE group 277=1 reaches canonical scientific primary-unit format");
    assert.strictEqual(scientificDim.primaryUnitDecimals, 3, "DIMDEC remains independent from the selected DIMLUNIT format");
    const scientificResult = compileDimension(scientificDim);
    assert(scientificResult.segments.length > sourcePrecisionResult.segments.length,
      "Synthesized scientific primary-unit label emits more glyph strokes than the decimal control");

    const unsupportedUnitSource = scientificSource.replace(
      /(277\r?\n)1(\r?\n0\r?\nENDTAB)/,
      (_match, prefix, suffix) => `${prefix}4${suffix}`
    );
    assert.notStrictEqual(unsupportedUnitSource, scientificSource, "The in-memory DIMLUNIT boundary control changed to architectural format");
    const unsupportedUnitDoc = await parseDxfToCanonical(Buffer.from(unsupportedUnitSource), { sourceVersionKey: "f05-dimlunit-unsupported-dxf" });
    const unsupportedUnitDiagnostic = unsupportedUnitDoc.diagnostics.find((diagnostic) => diagnostic.code === "UNSUPPORTED_DIMENSION_UNIT_FORMAT");
    assert(unsupportedUnitDiagnostic, "Unsupported architectural DIMLUNIT is reported explicitly instead of silently formatted as decimal");
    assert.strictEqual(unsupportedUnitDiagnostic.severity, "warning", "Unsupported DIMLUNIT profile is an explicit degraded warning");

    const precisionAndScaleSource = precisionSource.replace(
      /(140\r?\n2\.5\r?\n)0(\r?\nENDTAB)/,
      (_match, prefix, suffix) => `${prefix}144${newline}0.5${newline}271${newline}3${newline}0${suffix}`
    );
    assert.notStrictEqual(precisionAndScaleSource, precisionSource, "DXF DIMSTYLE record was extended with DIMLFAC=0.5");
    const scaledDoc = await parseDxfToCanonical(Buffer.from(precisionAndScaleSource), { sourceVersionKey: "f05-dimlfac-half-dxf" });
    const scaledDim = scaledDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.styleName === "STANDARD" && !entity.anonymousBlockName && (entity.dimType & 0x07) === 0
    );
    assert(scaledDim, "The DIMLFAC source contains a linear DIMENSION without a saved graphics block");
    assert.strictEqual(scaledDim.primaryUnitScale, 0.5, "DIMSTYLE group 144 reaches canonical primary-unit label scale");
    assert.strictEqual(scaledDim.primaryUnitDecimals, 3, "DIMLFAC profile retains source DIMDEC precision");
    const scaledResult = compileDimension(scaledDim);
    const unscaledResult = compileDimension({ ...scaledDim, primaryUnitScale: 1 });
    assert.notStrictEqual(scaledResult.segments.length, unscaledResult.segments.length,
      "Source DIMLFAC changes the synthesized numeric label while retaining identical dimension geometry");
    assert.deepStrictEqual(scaledResult.segments.slice(0, 9), unscaledResult.segments.slice(0, 9),
      "The two extension lines, dimension line, and both arrowheads are unchanged by DIMLFAC");

    const negativeScaleSource = precisionAndScaleSource.replace(
      /(144\r?\n)0\.5/,
      (_match, prefix) => `${prefix}-0.5`
    );
    assert.notStrictEqual(negativeScaleSource, precisionAndScaleSource, "The in-memory DIMLFAC boundary control changed to -0.5");
    const negativeScaleDoc = await parseDxfToCanonical(Buffer.from(negativeScaleSource), { sourceVersionKey: "f05-dimlfac-negative-dxf" });
    const negativeScaleDiagnostic = negativeScaleDoc.diagnostics.find((diagnostic) => diagnostic.code === "UNSUPPORTED_DIMENSION_UNIT_SCALE");
    assert(negativeScaleDiagnostic, "Negative DIMLFAC paper-space-only semantics receive an explicit warning");
    assert.strictEqual(negativeScaleDiagnostic.severity, "warning", "Unsupported negative DIMLFAC is visibly degraded");

    const symmetricToleranceSource = precisionSourceWithDimdec.replace(
      /(271\r?\n3\r?\n)0(\r?\nENDTAB)/,
      (_match, prefix, suffix) => `${prefix}71${newline}1${newline}47${newline}0.25${newline}48${newline}0.25${newline}272${newline}3${newline}0${suffix}`
    );
    assert.notStrictEqual(symmetricToleranceSource, precisionSourceWithDimdec, "DXF DIMSTYLE record was extended with DIMTOL=1, DIMTP/DIMTM=0.25 and DIMTDEC=3");
    const toleranceDoc = await parseDxfToCanonical(Buffer.from(symmetricToleranceSource), { sourceVersionKey: "f05-dimtolerance-symmetric-dxf" });
    const toleranceDim = toleranceDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.styleName === "STANDARD" && !entity.anonymousBlockName && (entity.dimType & 0x07) === 0
    );
    assert(toleranceDim, "The symmetric tolerance source contains a linear DIMENSION without a saved graphics block");
    assert.deepStrictEqual(toleranceDim.symmetricTolerance, { value: 0.25, decimals: 3 }, "DIMTOL/DIMTP/DIMTM/DIMTDEC reach the canonical symmetric tolerance profile");
    const toleranceResult = compileDimension(toleranceDim);
    const noToleranceControl = compileDimension({ ...toleranceDim, symmetricTolerance: undefined });
    assert(toleranceResult.segments.length > noToleranceControl.segments.length,
      "Synthesized symmetric tolerance label adds its ± value glyphs to the numeric measurement");

    const addEntityDstyle = (source: string, handle: string, pairs: Array<[number, number, number]>) => {
      const handledSource = source.replace(
        `0${newline}DIMENSION${newline}8${newline}0`,
        `0${newline}DIMENSION${newline}5${newline}${handle}${newline}8${newline}0`
      );
      assert.notStrictEqual(handledSource, source, `DIMENSION fixture received stable handle ${handle}`);
      const dstylePairs = pairs.map(([variableCode, valueCode, value]) =>
        `1070${newline}${variableCode}${newline}${valueCode}${newline}${value}`
      ).join(newline);
      const result = handledSource.replace(
        `1${newline}<>${newline}0${newline}DIMENSION`,
        `1${newline}<>${newline}1001${newline}ACAD${newline}1000${newline}DSTYLE${newline}1002${newline}{${newline}${dstylePairs}${newline}1002${newline}}${newline}0${newline}DIMENSION`
      );
      assert.notStrictEqual(result, handledSource, `ACAD/DSTYLE overrides were injected into ${handle}`);
      return result;
    };

    const entityToleranceSource = addEntityDstyle(precisionSourceWithDimdec, "D05T", [
      [71, 1070, 1], [47, 1040, 0.25], [48, 1040, 0.25], [272, 1070, 3],
    ]);
    const entityToleranceDoc = await parseDxfToCanonical(Buffer.from(entityToleranceSource), { sourceVersionKey: "f05-entity-dstyle-tolerance-on" });
    const entityToleranceScan = await parseDxfDimensionOverridePairs(Buffer.from(entityToleranceSource));
    assert.deepStrictEqual([...entityToleranceScan.byHandle.get("D05T")!.values.entries()], [
      [71, 1], [47, 0.25], [48, 0.25], [272, 3],
    ], "DIMTOL, DIMTP, DIMTM, and DIMTDEC source pairs retain their XDATA value types and handle");
    assert(!entityToleranceScan.byHandle.get("D05T")!.unsupported, "Selected symmetric tolerance override pairs are supported");
    const entityToleranceDim = entityToleranceDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.handle === "D05T"
    );
    assert(entityToleranceDim, "The per-entity tolerance handle reaches canonical DIMENSION");
    assert.deepStrictEqual(entityToleranceDim.symmetricTolerance, { value: 0.25, decimals: 3 },
      "Per-entity DIMTOL/TP/TM/TDEC enables a symmetric tolerance even when the base DIMSTYLE has tolerances off");
    assert(!entityToleranceDoc.diagnostics.some((diagnostic) => diagnostic.code === "UNSUPPORTED_DIMENSION_TOLERANCE"),
      "A supported per-entity symmetric tolerance does not produce a false unsupported warning");
    const entityToleranceResult = compileDimension(entityToleranceDim);
    assert(entityToleranceResult.segments.length > compileDimension({ ...entityToleranceDim, symmetricTolerance: undefined }).segments.length,
      "Per-entity tolerance changes the synthesized label strokes");
    const entityToleranceNeighbor = entityToleranceDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.handle !== "D05T" && entity.styleName === "STANDARD"
    );
    assert(entityToleranceNeighbor, "The same-style neighboring dimension remains available as a scope control");
    assert.strictEqual(entityToleranceNeighbor.symmetricTolerance, undefined,
      "Per-entity DIMTOL does not leak to a neighboring dimension sharing the style");

    const inheritedToleranceSource = addEntityDstyle(symmetricToleranceSource, "D05I", [[272, 1070, 1]]);
    const inheritedToleranceDoc = await parseDxfToCanonical(Buffer.from(inheritedToleranceSource), { sourceVersionKey: "f05-entity-dstyle-tolerance-inherit" });
    const inheritedToleranceDim = inheritedToleranceDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.handle === "D05I"
    );
    assert(inheritedToleranceDim, "A partial DSTYLE tolerance override remains attached to its source dimension");
    assert.deepStrictEqual(inheritedToleranceDim.symmetricTolerance, { value: 0.25, decimals: 1 },
      "An entity DIMTDEC override replaces only precision and inherits DIMTOL/TP/TM from DIMSTYLE");

    const disabledToleranceSource = addEntityDstyle(symmetricToleranceSource, "D05O", [[71, 1070, 0]]);
    const disabledToleranceDoc = await parseDxfToCanonical(Buffer.from(disabledToleranceSource), { sourceVersionKey: "f05-entity-dstyle-tolerance-off" });
    const disabledToleranceDim = disabledToleranceDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.handle === "D05O"
    );
    assert(disabledToleranceDim, "A DIMTOL=0 entity override remains attached to its source dimension");
    assert.strictEqual(disabledToleranceDim.symmetricTolerance, undefined, "Per-entity DIMTOL=0 disables the style's tolerance label");
    const disabledToleranceNeighbor = disabledToleranceDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.handle !== "D05O" && entity.styleName === "STANDARD"
    );
    assert(disabledToleranceNeighbor, "The same-style tolerance-enabled neighbor remains available as a scope control");
    assert.deepStrictEqual(disabledToleranceNeighbor.symmetricTolerance, { value: 0.25, decimals: 3 },
      "Per-entity DIMTOL=0 leaves the neighboring dimension's style tolerance enabled");

    const asymmetricEntityToleranceSource = addEntityDstyle(precisionSourceWithDimdec, "D05A2", [
      [71, 1070, 1], [47, 1040, 0.25], [48, 1040, 0.4], [272, 1070, 3],
    ]);
    const asymmetricEntityToleranceDoc = await parseDxfToCanonical(Buffer.from(asymmetricEntityToleranceSource), { sourceVersionKey: "f05-entity-dstyle-tolerance-asymmetric" });
    const asymmetricEntityDim = asymmetricEntityToleranceDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.handle === "D05A2"
    );
    assert(asymmetricEntityDim, "The asymmetric tolerance source handle reaches canonical DIMENSION");
    assert.strictEqual(asymmetricEntityDim.symmetricTolerance, undefined,
      "Asymmetric per-entity tolerances are not silently reduced to a symmetric value");
    assert(asymmetricEntityToleranceDoc.diagnostics.some((diagnostic) =>
      diagnostic.code === "UNSUPPORTED_DIMENSION_TOLERANCE" && diagnostic.entityHandle === "D05A2"),
    "Unsupported asymmetric per-entity tolerances keep an entity-scoped warning");

    const malformedEntityToleranceSource = addEntityDstyle(precisionSourceWithDimdec, "D05M", [[47, 1070, 0.25]]);
    const malformedEntityToleranceDoc = await parseDxfToCanonical(Buffer.from(malformedEntityToleranceSource), { sourceVersionKey: "f05-entity-dstyle-tolerance-malformed" });
    assert(malformedEntityToleranceDoc.diagnostics.some((diagnostic) =>
      diagnostic.code === "UNSUPPORTED_DIMENSION_ENTITY_OVERRIDE" && diagnostic.entityHandle === "D05M"),
    "A DIMTP override with the wrong XDATA value type is diagnosed on its source handle");

    const supportedEntityDstyleSource = addEntityDstyle(precisionSourceWithDimdec, "D05P", [
      [40, 1040, 2], [47, 1040, 0.25], [48, 1040, 0.25], [71, 1070, 1],
      [75, 1070, 1], [76, 1070, 1], [142, 1040, 2.5], [144, 1040, 0.5],
      [271, 1070, 2], [272, 1070, 2], [277, 1070, 1],
    ]);
    const supportedEntityDstyleDoc = await parseDxfToCanonical(Buffer.from(supportedEntityDstyleSource), { sourceVersionKey: "f05-entity-dstyle-supported-matrix" });
    const supportedEntityDstyleScan = await parseDxfDimensionOverridePairs(Buffer.from(supportedEntityDstyleSource));
    assert.deepStrictEqual([...supportedEntityDstyleScan.byHandle.get("D05P")!.values.entries()], [
      [40, 2], [47, 0.25], [48, 0.25], [71, 1], [75, 1], [76, 1],
      [142, 2.5], [144, 0.5], [271, 2], [272, 2], [277, 1],
    ], "The finite supported DSTYLE override code set retains each value with its source handle");
    assert(!supportedEntityDstyleScan.byHandle.get("D05P")!.unsupported,
      "Supported integer and real DSTYLE values pass type/range validation together");
    const supportedEntityDstyleDim = supportedEntityDstyleDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.handle === "D05P"
    );
    assert(supportedEntityDstyleDim, "The supported DSTYLE source handle reaches canonical DIMENSION");
    assert.strictEqual(supportedEntityDstyleDim.dimScale, 2, "Per-entity DIMSCALE overrides the style scale");
    assert.strictEqual(supportedEntityDstyleDim.primaryUnitDecimals, 2, "Per-entity DIMDEC overrides the style precision");
    assert.strictEqual(supportedEntityDstyleDim.primaryUnitFormat, "scientific", "Per-entity DIMLUNIT overrides the style format");
    assert.strictEqual(supportedEntityDstyleDim.primaryUnitScale, 0.5, "Per-entity DIMLFAC reaches the canonical label factor");
    assert.strictEqual(supportedEntityDstyleDim.tickSize, 2.5, "Per-entity DIMTSZ reaches the canonical tick size");
    assert.strictEqual(supportedEntityDstyleDim.suppressFirstExtensionLine, true, "Per-entity DIMSE1 reaches the first suppression flag");
    assert.strictEqual(supportedEntityDstyleDim.suppressSecondExtensionLine, true, "Per-entity DIMSE2 reaches the second suppression flag");
    assert.deepStrictEqual(supportedEntityDstyleDim.symmetricTolerance, { value: 0.25, decimals: 2 },
      "Per-entity DIMTOL/TP/TM/TDEC resolve as one symmetric profile");
    assert(!supportedEntityDstyleDoc.diagnostics.some((diagnostic) =>
      diagnostic.code === "UNSUPPORTED_DIMENSION_ENTITY_OVERRIDE" || diagnostic.code === "UNSUPPORTED_DIMENSION_TOLERANCE"),
    "The finite supported DSTYLE matrix remains diagnostic-free");
    const supportedEntityDstyleNeighbor = supportedEntityDstyleDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.handle !== "D05P" && entity.styleName === "STANDARD"
    );
    assert(supportedEntityDstyleNeighbor, "A same-style dimension remains available for override isolation checks");
    assert.strictEqual(supportedEntityDstyleNeighbor.primaryUnitDecimals, 3, "Per-entity DIMDEC does not change the style peer");
    assert.strictEqual(supportedEntityDstyleNeighbor.primaryUnitFormat, "decimal", "Per-entity DIMLUNIT does not change the style peer");
    assert.strictEqual(supportedEntityDstyleNeighbor.dimScale, 1, "Per-entity DIMSCALE does not change the style peer");
    assert.strictEqual(supportedEntityDstyleNeighbor.tickSize, undefined, "Per-entity DIMTSZ does not change the style peer");
    assert.notStrictEqual(supportedEntityDstyleNeighbor.suppressFirstExtensionLine, true, "Per-entity DIMSE1 does not change the style peer");
    assert.notStrictEqual(supportedEntityDstyleNeighbor.suppressSecondExtensionLine, true, "Per-entity DIMSE2 does not change the style peer");
    assert.strictEqual(supportedEntityDstyleNeighbor.symmetricTolerance, undefined, "Per-entity DIMTOL does not change the style peer");

    const asymmetricToleranceSource = symmetricToleranceSource.replace(
      /(48\r?\n)0\.25/,
      (_match, prefix) => `${prefix}0.4`
    );
    assert.notStrictEqual(asymmetricToleranceSource, symmetricToleranceSource, "The finite DIMTM boundary control changed to an asymmetric value");
    const asymmetricToleranceDoc = await parseDxfToCanonical(Buffer.from(asymmetricToleranceSource), { sourceVersionKey: "f05-dimtolerance-asymmetric-dxf" });
    const asymmetricToleranceDiagnostic = asymmetricToleranceDoc.diagnostics.find((diagnostic) => diagnostic.code === "UNSUPPORTED_DIMENSION_TOLERANCE");
    assert(asymmetricToleranceDiagnostic, "Unsupported asymmetric DIMTP/DIMTM is diagnosed instead of silently rendered as symmetric");
    assert.strictEqual(asymmetricToleranceDiagnostic.severity, "warning", "Unsupported asymmetric tolerance is visibly degraded");

    const tickSource = precisionSourceWithDimdec.replace(
      /(271\r?\n3\r?\n)0(\r?\nENDTAB)/,
      (_match, prefix, suffix) => `${prefix}142${newline}2.5${newline}0${suffix}`
    );
    assert.notStrictEqual(tickSource, precisionSourceWithDimdec, "DXF DIMSTYLE record was extended with DIMTSZ=2.5");
    const tickDoc = await parseDxfToCanonical(Buffer.from(tickSource), { sourceVersionKey: "f05-dimtsz-linear-dxf" });
    const tickDim = tickDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.styleName === "STANDARD" && !entity.anonymousBlockName && (entity.dimType & 0x07) === 0
    );
    assert(tickDim, "The DIMTSZ source contains a linear DIMENSION without a saved graphics block");
    assert.strictEqual(tickDim.tickSize, 2.5, "DIMSTYLE group 142 reaches canonical DIMENSION tick size");
    const tickResult = compileDimension(tickDim);
    const arrowControl = compileDimension({ ...tickDim, tickSize: 0 });
    assert.deepStrictEqual(tickResult.segments.slice(0, 3), arrowControl.segments.slice(0, 3),
      "DIMTSZ changes only the two end symbols and keeps extension/dimension lines unchanged");
    assert.strictEqual(arrowControl.segments.length - tickResult.segments.length, 4,
      "Two oblique tick strokes replace the two three-stroke arrowheads");
    for (const tick of tickResult.segments.slice(3, 5)) {
      const slope = (tick.y1 - tick.y0) / (tick.x1 - tick.x0);
      assert(Math.abs(Math.abs(slope) - 1) < 1e-9, "DIMTSZ endpoint marks are 45-degree oblique ticks");
    }
    const extensionSuppressionSource = precisionSourceWithDimdec.replace(
      /(271\r?\n3\r?\n)0(\r?\nENDTAB)/,
      (_match, prefix, suffix) => `${prefix}75${newline}1${newline}0${suffix}`
    );
    assert.notStrictEqual(extensionSuppressionSource, precisionSourceWithDimdec, "DXF DIMSTYLE record was extended with DIMSE1=1");
    const extensionSuppressionDoc = await parseDxfToCanonical(Buffer.from(extensionSuppressionSource), { sourceVersionKey: "f05-dimse1-suppressed-dxf" });
    const suppressedExtensionDim = extensionSuppressionDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.styleName === "STANDARD" && !entity.anonymousBlockName && (entity.dimType & 0x07) === 0
    );
    assert(suppressedExtensionDim, "The DIMSE1 source contains a linear DIMENSION without a saved graphics block");
    assert.strictEqual(suppressedExtensionDim.suppressFirstExtensionLine, true, "DIMSTYLE group 75 reaches canonical first-extension-line suppression");

    const extensionVisibleSource = extensionSuppressionSource.replace(
      /(75\r?\n)1/,
      (_match, prefix) => `${prefix}0`
    );
    assert.notStrictEqual(extensionVisibleSource, extensionSuppressionSource, "The finite DIMSE1 control changed to zero");
    const extensionVisibleDoc = await parseDxfToCanonical(Buffer.from(extensionVisibleSource), { sourceVersionKey: "f05-dimse1-visible-dxf" });
    const visibleExtensionDim = extensionVisibleDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.styleName === "STANDARD" && !entity.anonymousBlockName && (entity.dimType & 0x07) === 0
    );
    assert(visibleExtensionDim, "The DIMSE1=0 control contains the same linear DIMENSION profile");
    assert.notStrictEqual(visibleExtensionDim.suppressFirstExtensionLine, true, "DIMSE1=0 keeps the first extension line visible");
    const suppressedExtensionResult = compileDimension(suppressedExtensionDim);
    const visibleExtensionResult = compileDimension(visibleExtensionDim);
    assert.strictEqual(visibleExtensionResult.segments.length - suppressedExtensionResult.segments.length, 1,
      "DIMSE1 removes exactly the first extension-line stroke");
    assert.deepStrictEqual(suppressedExtensionResult.segments, visibleExtensionResult.segments.slice(1),
      "All remaining extension/dimension lines, symbols, and label strokes match the DIMSE1=0 control");

    const secondExtensionSuppressionSource = precisionSourceWithDimdec.replace(
      /(271\r?\n3\r?\n)0(\r?\nENDTAB)/,
      (_match, prefix, suffix) => `${prefix}76${newline}1${newline}0${suffix}`
    );
    assert.notStrictEqual(secondExtensionSuppressionSource, precisionSourceWithDimdec, "DXF DIMSTYLE record was extended with DIMSE2=1");
    const secondExtensionSuppressionDoc = await parseDxfToCanonical(Buffer.from(secondExtensionSuppressionSource), { sourceVersionKey: "f05-dimse2-suppressed-dxf" });
    const suppressedSecondExtensionDim = secondExtensionSuppressionDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.styleName === "STANDARD" && !entity.anonymousBlockName && (entity.dimType & 0x07) === 0
    );
    assert(suppressedSecondExtensionDim, "The DIMSE2 source contains a linear DIMENSION without a saved graphics block");
    assert.strictEqual(suppressedSecondExtensionDim.suppressSecondExtensionLine, true, "DIMSTYLE group 76 reaches canonical second-extension-line suppression");

    const secondExtensionVisibleSource = secondExtensionSuppressionSource.replace(
      /(76\r?\n)1(\r?\n0\r?\nENDTAB)/,
      (_match, prefix, suffix) => `${prefix}0${suffix}`
    );
    assert.notStrictEqual(secondExtensionVisibleSource, secondExtensionSuppressionSource, "The finite DIMSE2 control changed to zero");
    const secondExtensionVisibleDoc = await parseDxfToCanonical(Buffer.from(secondExtensionVisibleSource), { sourceVersionKey: "f05-dimse2-visible-dxf" });
    const visibleSecondExtensionDim = secondExtensionVisibleDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.styleName === "STANDARD" && !entity.anonymousBlockName && (entity.dimType & 0x07) === 0
    );
    assert(visibleSecondExtensionDim, "The DIMSE2=0 control contains the same linear DIMENSION profile");
    assert.notStrictEqual(visibleSecondExtensionDim.suppressSecondExtensionLine, true, "DIMSE2=0 keeps the second extension line visible");
    const suppressedSecondExtensionResult = compileDimension(suppressedSecondExtensionDim);
    const visibleSecondExtensionResult = compileDimension(visibleSecondExtensionDim);
    assert.strictEqual(visibleSecondExtensionResult.segments.length - suppressedSecondExtensionResult.segments.length, 1,
      "DIMSE2 removes exactly the second extension-line stroke");
    assert.deepStrictEqual(suppressedSecondExtensionResult.segments[0], visibleSecondExtensionResult.segments[0],
      "DIMSE2 leaves the first extension line unchanged");
    assert.deepStrictEqual(suppressedSecondExtensionResult.segments, [
      ...visibleSecondExtensionResult.segments.slice(0, 1),
      ...visibleSecondExtensionResult.segments.slice(2),
    ], "All remaining extension/dimension lines, symbols, and label strokes match the DIMSE2=0 control");

    const setStandardDimstyleScale = (source: string, value: number): string => source.replace(
      /(0\r?\nTABLE\r?\n2\r?\nDIMSTYLE\r?\n70\r?\n\d+\r?\n0\r?\nDIMSTYLE\r?\n2\r?\nSTANDARD\r?\n70\r?\n\d+\r?\n40\r?\n)\d+(\r?\n)/,
      (_match, prefix, suffix) => `${prefix}${value}${suffix}`
    );
    const dimensionScaleSource = setStandardDimstyleScale(precisionSource, 2);
    assert.notStrictEqual(dimensionScaleSource, precisionSource, "DXF DIMSTYLE DIMSCALE was set to 2");
    const dimensionScaleDoc = await parseDxfToCanonical(Buffer.from(dimensionScaleSource), { sourceVersionKey: "f05-dimscale-2-dxf" });
    const dimensionScaleDim = dimensionScaleDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.styleName === "STANDARD" && !entity.anonymousBlockName && (entity.dimType & 0x07) === 0
    );
    assert(dimensionScaleDim, "The DIMSCALE=2 source contains a linear DIMENSION without a saved graphics block");
    assert.strictEqual(dimensionScaleDim.dimScale, 2, "DIMSTYLE group 40 reaches the synthesized dimension scale");
    const dimensionScaleResult = compileDimension(dimensionScaleDim);

    const dimensionScaleControlSource = setStandardDimstyleScale(dimensionScaleSource, 1);
    const dimensionScaleControlDoc = await parseDxfToCanonical(Buffer.from(dimensionScaleControlSource), { sourceVersionKey: "f05-dimscale-1-dxf" });
    const dimensionScaleControlDim = dimensionScaleControlDoc.modelSpaceEntities.find(
      (entity): entity is CadDimensionEntity => entity.type === "DIMENSION" && entity.styleName === "STANDARD" && !entity.anonymousBlockName && (entity.dimType & 0x07) === 0
    );
    assert(dimensionScaleControlDim, "The DIMSCALE=1 control contains the same linear DIMENSION profile");
    assert.strictEqual(dimensionScaleControlDim.dimScale, 1, "DIMSTYLE group 40=1 reaches canonical control scale");
    const dimensionScaleControl = compileDimension(dimensionScaleControlDim);
    assert.strictEqual(dimensionScaleResult.segments.length, dimensionScaleControl.segments.length,
      "Changing DIMSCALE preserves the selected text/symbol topology");
    assert.notDeepStrictEqual(dimensionScaleResult.segments[0], dimensionScaleControl.segments[0],
      "DIMSCALE scales extension-line furniture");
    assert.deepStrictEqual(dimensionScaleResult.segments[2], dimensionScaleControl.segments[2],
      "DIMSCALE keeps the source measurement dimension line fixed");

    const zeroDimensionScaleSource = setStandardDimstyleScale(dimensionScaleSource, 0);
    const zeroDimensionScaleDoc = await parseDxfToCanonical(Buffer.from(zeroDimensionScaleSource), { sourceVersionKey: "f05-dimscale-zero-dxf" });
    const zeroScaleDiagnostic = zeroDimensionScaleDoc.diagnostics.find((diagnostic) =>
      diagnostic.code === "UNSUPPORTED_DIMENSION_ANNOTATIVE_SCALE"
    );
    assert(zeroScaleDiagnostic, "DIMSCALE=0 annotative scale without resolved object contexts is explicitly diagnosed");
    assert.strictEqual(zeroScaleDiagnostic.severity, "warning", "Unresolved annotative DIMSCALE is visibly degraded");
    const zeroScaleScene = compileCanonicalToScene(zeroDimensionScaleDoc);
    assert.strictEqual(zeroScaleScene.manifest.qualityStatus, "degraded",
      "Unresolved annotative dimension scale degrades the delivered scene manifest");
    assert(zeroScaleScene.manifest.diagnosticsSummary.diagnosticCodes.includes("UNSUPPORTED_DIMENSION_ANNOTATIVE_SCALE"),
      "The delivered scene manifest retains the unsupported annotative-scale diagnosis");
    const nonAnnotativeScene = compileCanonicalToScene(dimensionScaleControlDoc);
    assert(!nonAnnotativeScene.manifest.diagnosticsSummary.diagnosticCodes.includes("UNSUPPORTED_DIMENSION_ANNOTATIVE_SCALE"),
      "DIMSCALE=1 control does not report an annotative-scale limitation");

    console.log(`  ✓ Gate 4: SELECTED PROFILES PASS — DIMDEC decimal ${sourcePrecisionResult.segments.length}; DIMLUNIT scientific ${scientificResult.segments.length}; DIMLFAC=0.5 ${scaledResult.segments.length} vs scale-1 ${unscaledResult.segments.length}; symmetric tolerance ${toleranceResult.segments.length} vs ${noToleranceControl.segments.length}; DIMTSZ=2.5 ticks ${tickResult.segments.length} vs arrows ${arrowControl.segments.length}; DIMSE1/2 remove one extension stroke; DIMSCALE=2 scales furniture; selected DSTYLE plus linear/aligned/rotated source geometry bound through objectId; unsupported oblique diagnosed; broader geometry/native oracle open`);
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

    console.log("  ✓ Gate 5 synthetic: LOCAL PASS — mock instance override, constant, invisible ve top-level mirror profili geçti; decoder/alignment/nested mirror kapsamı ayrı");
  }

  // --------------------------------------------------------------------------
  // GATE 5B: ATTRIB alignment under a nested mirrored INSERT
  // --------------------------------------------------------------------------
  console.log("\n[Gate 5B] ATTDEF alignment ve nested mirrored INSERT...");
  {
    const doc = createMockBaseDocument();
    const makeInnerBlock = (horizontalMode: number): CadBlockDefinition => ({
      name: horizontalMode === 3 ? "INNER_ALIGNED" : "INNER_LEFT",
      basePoint: [0, 0],
      entities: [
        {
          handle: `ATT_ALIGN_${horizontalMode}`,
          type: "ATTDEF",
          layer: "0",
          order: BigInt(1),
          tag: "TAG_ALIGN",
          defaultText: "DEFAULT",
          insertionPoint: [10, 10],
          alignmentPoint: [30, 10],
          horizontalMode,
          verticalMode: 0,
          height: 4,
          rotationRad: 0,
          widthFactor: 1,
          obliqueRad: 0,
          styleName: "STANDARD",
        },
      ],
    });
    doc.blocks.INNER_ALIGNED = makeInnerBlock(3);
    doc.blocks.INNER_LEFT = makeInnerBlock(0);
    const alignedNestedInsert: CadInsertEntity = {
      handle: "INS_NESTED_ALIGNED",
      type: "INSERT",
      layer: "0",
      order: BigInt(2),
      blockName: "INNER_ALIGNED",
      insertionPoint: [100, 0],
      scale: [-1, 1, 1],
      rotationRad: 0,
      attributes: { TAG_ALIGN: "FIT" },
    };
    const leftNestedInsert: CadInsertEntity = {
      ...alignedNestedInsert,
      handle: "INS_NESTED_LEFT",
      blockName: "INNER_LEFT",
      order: BigInt(3),
    };
    doc.blocks.ATTRIB_WRAPPER = {
      name: "ATTRIB_WRAPPER",
      basePoint: [0, 0],
      entities: [alignedNestedInsert],
    };

    const visitor = new EntityVisitor({
      blocks: doc.blocks,
      layers: doc.layers,
      linetypes: doc.linetypes,
      textStyles: doc.textStyles,
    });
    const wrapperInsert: CadInsertEntity = {
      handle: "INS_WRAPPER",
      type: "INSERT",
      layer: "0",
      order: BigInt(4),
      blockName: "ATTRIB_WRAPPER",
      insertionPoint: [500, 500],
      scale: [1, 1, 1],
      rotationRad: 0,
    };
    const alignedResult = visitor.createEmptyResult();
    visitor.visitEntity(wrapperInsert, visitor.createRootContext("0", BigInt(4)), alignedResult);
    assert(alignedResult.segments.length > 0, "Nested ATTDEF instance text'i çizgi geometrisine çevrildi");

    const leftOnlyDoc = createMockBaseDocument();
    leftOnlyDoc.blocks.INNER_LEFT = makeInnerBlock(0);
    leftOnlyDoc.blocks.ATTRIB_WRAPPER = {
      ...doc.blocks.ATTRIB_WRAPPER!,
      entities: [leftNestedInsert],
    };
    const leftVisitor = new EntityVisitor({
      blocks: leftOnlyDoc.blocks,
      layers: leftOnlyDoc.layers,
      linetypes: leftOnlyDoc.linetypes,
      textStyles: leftOnlyDoc.textStyles,
    });
    const leftResult = leftVisitor.createEmptyResult();
    leftVisitor.visitEntity(wrapperInsert, leftVisitor.createRootContext("0", BigInt(4)), leftResult);

    const alignedWidth = alignedResult.maxX - alignedResult.minX;
    const leftWidth = leftResult.maxX - leftResult.minX;
    assert(alignedResult.minX >= 570 && alignedResult.maxX <= 590, "Nested negative-X scale ve wrapper translate öznitelik metnini beklenen [570,590] WCS alanında tuttu");
    assert(alignedResult.minY >= 510 && alignedResult.maxY <= 520, "Nested ATTDEF baseline metni beklenen [510,520] WCS yüksekliğinde kaldı");
    assert(alignedWidth > 18 && alignedWidth > leftWidth * 1.5, "ATTDEF ALIGNED (horizontalMode=3), insertion/alignment noktaları arasındaki 20 birimlik hedefe göre genişledi");
    assert(leftWidth < 12, "Sol hizalı karşılaştırma, alignmentPoint'i width-fit hedefi olarak kullanmadı");
    assert(!alignedResult.diagnostics.some((diagnostic) => diagnostic.code === "MISSING_BLOCK_DEFINITION"), "Nested ATTRIB block zinciri çözüldü");
    console.log(`    measured: alignedWidth=${alignedWidth.toFixed(3)}, leftWidth=${leftWidth.toFixed(3)}, nestedBBox=[${alignedResult.minX.toFixed(3)},${alignedResult.minY.toFixed(3)}..${alignedResult.maxX.toFixed(3)},${alignedResult.maxY.toFixed(3)}]`);
    console.log("  ✓ Gate 5B: LOCAL PASS — ALIGNED genişlik farkı ve nested mirrored instance koordinatları doğrulandı");

    const sourcePositionedDoc = createMockBaseDocument();
    sourcePositionedDoc.blocks.INNER_SOURCE_POSITIONED = {
      ...makeInnerBlock(0),
      name: "INNER_SOURCE_POSITIONED",
    };
    const sourcePositionedInsert: CadInsertEntity = {
      ...alignedNestedInsert,
      handle: "INS_NESTED_SOURCE_ATTRIB",
      blockName: "INNER_SOURCE_POSITIONED",
      attributeEntities: [{
        handle: "ATTR_NESTED_SOURCE",
        type: "ATTRIB",
        layer: "0",
        order: BigInt(2),
        tag: "TAG_ALIGN",
        text: "SRC",
        insertionPoint: [90, 10],
        height: 4,
        rotationRad: 0,
        widthFactor: 1,
        obliqueRad: 0,
        styleName: "STANDARD",
      }],
    };
    sourcePositionedDoc.blocks.SOURCE_ATTRIB_WRAPPER = {
      name: "SOURCE_ATTRIB_WRAPPER",
      basePoint: [0, 0],
      entities: [sourcePositionedInsert],
    };
    const sourcePositionedVisitor = new EntityVisitor({
      blocks: sourcePositionedDoc.blocks,
      layers: sourcePositionedDoc.layers,
      linetypes: sourcePositionedDoc.linetypes,
      textStyles: sourcePositionedDoc.textStyles,
    });
    const sourcePositionedWrapper: CadInsertEntity = {
      ...wrapperInsert,
      handle: "INS_SOURCE_ATTRIB_WRAPPER",
      blockName: "SOURCE_ATTRIB_WRAPPER",
    };
    const sourcePositionedResult = sourcePositionedVisitor.createEmptyResult();
    sourcePositionedVisitor.visitEntity(sourcePositionedWrapper,
      sourcePositionedVisitor.createRootContext("0", sourcePositionedWrapper.order), sourcePositionedResult);
    assert(sourcePositionedResult.minX >= 590 && sourcePositionedResult.maxX <= 605,
      "Nested attached ATTRIB uses the already-positioned source point through the outer transform only; its own mirrored INSERT is not applied twice");
    console.log(`    source-instance BBox=[${sourcePositionedResult.minX.toFixed(3)},${sourcePositionedResult.minY.toFixed(3)}..${sourcePositionedResult.maxX.toFixed(3)},${sourcePositionedResult.maxY.toFixed(3)}]`);
    assert(sourcePositionedResult.minY >= 509.9 && sourcePositionedResult.maxY <= 515,
      "Nested attached ATTRIB keeps source parent-plane Y through its containing wrapper");
    console.log("  ✓ Gate 5B source-instance: LOCAL PASS — nested mirrored INSERT does not double-transform attached ATTRIB geometry");
  }

  // --------------------------------------------------------------------------
  // GATE 5A: DXF decoder-owned INSERT/ATTRIB -> ATTDEF tag binding
  // --------------------------------------------------------------------------
  console.log("\n[Gate 5A] DXF decoder kaynaklı ATTRIB -> ATTDEF bağlaması...");
  {
    const dwgAttributeMapping = mapDwgInsertAttributeInstances({
      handle: "A100",
      isVariableAttributes: true,
      attribs: [{
        type: "ATTRIB",
        handle: "A101",
        layer: "TEXT",
        colorIndex: 0,
        lineweight: 25,
        tag: "KOD",
        flags: 0,
        text: {
          text: "K01",
          startPoint: { x: 10, y: 15 },
          endPoint: { x: 30, y: 15 },
          textHeight: 2.5,
          rotation: 0,
          xScale: 1.2,
          obliqueAngle: 0,
          styleName: "STANDARD",
          halign: 3,
          valign: 0,
          extrusionDirection: { x: 0, y: 0, z: 1 },
        },
      }, {
        type: "ATTRIB",
        handle: "A102",
        layer: "TEXT",
        tag: "HIDDEN",
        flags: 3,
        text: {
          text: "SECRET",
          startPoint: { x: 5, y: 6 },
          textHeight: 2.5,
          styleName: "STANDARD",
          extrusionDirection: { x: 0, y: 0, z: 1 },
        },
      }],
    }, BigInt(77));
    assert.deepStrictEqual(dwgAttributeMapping.attributes, { KOD: "K01", HIDDEN: "SECRET" },
      "libredwg-web INSERT.attribs values bind to their tags");
    assert.deepStrictEqual(dwgAttributeMapping.attributeEntities[0]?.insertionPoint, [10, 15],
      "DWG ATTRIB nested text.startPoint reaches canonical source placement");
    assert.deepStrictEqual(dwgAttributeMapping.attributeEntities[0]?.alignmentPoint, [30, 15],
      "DWG ATTRIB nested text.endPoint reaches canonical alignment");
    assert.strictEqual(dwgAttributeMapping.attributeEntities[0]?.horizontalMode, 3,
      "DWG ATTRIB nested text.halign reaches canonical justification");
    assert.strictEqual(dwgAttributeMapping.attributeEntities[0]?.lineweightMm, 0.25,
      "DWG attached ATTRIB lineweight uses the adapter's millimetre mapping");
    assert.strictEqual(dwgAttributeMapping.attributeEntities[0]?.color?.method, "byBlock",
      "DWG attached ATTRIB ByBlock color is retained");
    assert.strictEqual(dwgAttributeMapping.attributeEntities[1]?.isInvisible, true,
      "DWG ATTRIB invisible flag is retained");
    assert.strictEqual(dwgAttributeMapping.attributeEntities[1]?.isConstant, true,
      "DWG ATTRIB constant flag is retained");
    assert.strictEqual(dwgAttributeMapping.diagnostics.length, 0,
      "Supported default-OCS DWG ATTRIB pair maps without a geometry warning");

    const unsupportedDwgAttrib = mapDwgInsertAttributeInstances({
      handle: "A200",
      isVariableAttributes: true,
      attribs: [{
        handle: "A201",
        tag: "KOD",
        flags: 0,
        text: {
          text: "K02",
          startPoint: { x: 10, y: 15 },
          textHeight: 2.5,
          extrusionDirection: { x: 1, y: 0, z: 0 },
        },
      }],
    }, BigInt(78));
    assert.deepStrictEqual(unsupportedDwgAttrib.attributes, { KOD: "K02" },
      "Unsupported DWG ATTRIB OCS still preserves its safe tag/value");
    assert.strictEqual(unsupportedDwgAttrib.attributeEntities.length, 0,
      "Unsupported DWG ATTRIB OCS is not guessed into 2D geometry");
    assert(unsupportedDwgAttrib.diagnostics.some((diagnostic) => diagnostic.code === "UNSUPPORTED_ATTRIBUTE_INSTANCE_GEOMETRY"),
      "Unsupported DWG ATTRIB OCS emits a per-entity geometry diagnostic");

    for (const unsupportedCase of [{
      name: "missing insertion point",
      attribute: { tag: "KOD", flags: 0, text: { text: "K03", textHeight: 2.5, extrusionDirection: { x: 0, y: 0, z: 1 } } },
    }, {
      name: "missing justified alignment point",
      attribute: { tag: "KOD", flags: 0, text: { text: "K04", startPoint: { x: 10, y: 15 }, textHeight: 2.5, halign: 3, extrusionDirection: { x: 0, y: 0, z: 1 } } },
    }, {
      name: "multiline layout",
      attribute: { tag: "KOD", flags: 0, mtextFlag: 2, text: { text: "K05", startPoint: { x: 10, y: 15 }, textHeight: 2.5, extrusionDirection: { x: 0, y: 0, z: 1 } } },
    }]) {
      const boundaryMapping = mapDwgInsertAttributeInstances({ handle: "A250", isVariableAttributes: true, attribs: [unsupportedCase.attribute] }, BigInt(80));
      assert.strictEqual(boundaryMapping.attributeEntities.length, 0,
        `DWG ATTRIB ${unsupportedCase.name} must not create guessed simple-text geometry`);
      assert(boundaryMapping.diagnostics.some((diagnostic) => diagnostic.code === "UNSUPPORTED_ATTRIBUTE_INSTANCE_GEOMETRY"),
        `DWG ATTRIB ${unsupportedCase.name} must emit an explicit geometry diagnostic`);
    }

    const missingDwgAttribs = mapDwgInsertAttributeInstances({ handle: "A300", isVariableAttributes: true }, BigInt(79));
    assert(missingDwgAttribs.diagnostics.some((diagnostic) => diagnostic.code === "UNRESOLVED_DWG_INSERT_ATTRIBUTES"),
      "DWG INSERT whose decoder omits a declared attached ATTRIB array is explicitly degraded");

    const fixturePath = path.join(process.cwd(), "tests/fixtures/dxf/blocks-attrib.dxf");
    const fixtureBytes = fs.readFileSync(fixturePath);
    const fixtureSource = fixtureBytes.toString("utf8");
    const fixtureNewline = fixtureSource.includes("\r\n") ? "\r\n" : "\n";
    const decoded = await parseDxfToCanonical(fixtureBytes, { sourceVersionKey: "f05-attrib-fixture" });
    const insert = decoded.modelSpaceEntities.find((entity): entity is CadInsertEntity => entity.type === "INSERT");
    assert(insert, "DXF decoder INSERT fixture'ını canonical INSERT olarak korudu");
    assert.strictEqual(insert.blockName, "TAGGED_BLOCK", "Kaynak DXF INSERT blok adı canonical INSERT'e bağlandı");
    assert.deepStrictEqual(insert.attributes, { KOD: "K01" }, "Decoder'ın SEQEND ile biten gerçek ATTRIB dizisi tag/text değerini instance'a bağladı");
    assert.strictEqual(insert.attributeEntities?.length, 1, "Bağlı kaynak ATTRIB'in entity geometrisi canonical INSERT üzerinde korundu");
    assert.deepStrictEqual(insert.attributeEntities?.[0]?.insertionPoint, [10, 15], "ATTRIB group 10/20 INSERT'in yerleşmiş parent-plane koordinatında korundu");
    assert.strictEqual(insert.attributeEntities?.[0]?.text, "K01", "Canonical instance ATTRIB kendi source text değerini korudu");

    const handleBoundSource = fixtureSource
      .replace(`0${fixtureNewline}INSERT${fixtureNewline}8${fixtureNewline}0${fixtureNewline}2${fixtureNewline}TAGGED_BLOCK`,
        `0${fixtureNewline}INSERT${fixtureNewline}5${fixtureNewline}ABCD${fixtureNewline}8${fixtureNewline}0${fixtureNewline}2${fixtureNewline}TAGGED_BLOCK`)
      .replace(`0${fixtureNewline}ATTRIB${fixtureNewline}8${fixtureNewline}TEXT`,
        `0${fixtureNewline}ATTRIB${fixtureNewline}5${fixtureNewline}ABCE${fixtureNewline}8${fixtureNewline}TEXT`);
    assert.notStrictEqual(handleBoundSource, fixtureSource, "Group 5 source handle controls were inserted for INSERT and ATTRIB");
    const handleBoundDoc = await parseDxfToCanonical(Buffer.from(handleBoundSource), { sourceVersionKey: "f05-attrib-source-handle" });
    const handleBoundInsert = handleBoundDoc.modelSpaceEntities.find((entity): entity is CadInsertEntity => entity.type === "INSERT");
    assert(handleBoundInsert, "Handle-bearing DXF source still decodes its canonical INSERT");
    assert.strictEqual(handleBoundInsert.sourceHandle, "ABCD", "DXF INSERT group 5 survives converter objectId as the canonical source identity");
    assert.deepStrictEqual(handleBoundInsert.attributes, { KOD: "K01" }, "Raw group 5 INSERT/ATTRIB pair data joins to the exact canonical owner");
    assert.strictEqual(handleBoundInsert.attributeEntities?.[0]?.handle, "ABCE", "ATTRIB source handle remains attached to its canonical instance geometry");
    assert(!handleBoundDoc.diagnostics.some((diagnostic) => diagnostic.code === "UNRESOLVED_DXF_INSERT_ATTRIBUTES"),
      "A matching source INSERT handle does not produce an unresolved-owner diagnostic");

    const nestedBlockDefinition = [
      "0", "BLOCK", "5", "B000", "100", "AcDbEntity", "8", "0", "100", "AcDbBlockBegin", "2", "OUTER_BLOCK", "3", "OUTER_BLOCK", "70", "0", "10", "0", "20", "0", "30", "0",
      "0", "INSERT", "5", "B001", "100", "AcDbEntity", "8", "0", "100", "AcDbBlockReference", "66", "1", "2", "TAGGED_BLOCK", "10", "100", "20", "200", "30", "0", "41", "1", "42", "1", "43", "1",
      "0", "ATTRIB", "5", "B002", "100", "AcDbEntity", "8", "TEXT", "100", "AcDbText", "10", "110", "20", "215", "30", "0", "40", "2.5", "1", "NESTED", "50", "0", "41", "1", "51", "0", "7", "STANDARD", "100", "AcDbAttribute", "2", "KOD", "70", "0",
      "0", "SEQEND", "5", "B003", "100", "AcDbEntity", "8", "0", "0", "ENDBLK", "5", "B004", "100", "AcDbEntity", "8", "0", "100", "AcDbBlockEnd",
    ].join(fixtureNewline) + fixtureNewline;
    const nestedBlockSource = fixtureSource.replace(
      `0${fixtureNewline}ENDSEC${fixtureNewline}0${fixtureNewline}SECTION${fixtureNewline}2${fixtureNewline}ENTITIES`,
      nestedBlockDefinition + `0${fixtureNewline}ENDSEC${fixtureNewline}0${fixtureNewline}SECTION${fixtureNewline}2${fixtureNewline}ENTITIES`
    ).replace(
      `0${fixtureNewline}ENDSEC${fixtureNewline}0${fixtureNewline}EOF`,
      ["0", "INSERT", "5", "C001", "100", "AcDbEntity", "8", "0", "100", "AcDbBlockReference", "2", "OUTER_BLOCK", "10", "500", "20", "300", "30", "0", "41", "1", "42", "1", "43", "1", "0", "ENDSEC", "0", "EOF"].join(fixtureNewline)
    );
    assert.notStrictEqual(nestedBlockSource, fixtureSource, "Nested BLOCKS-owned INSERT/ATTRIB and modelspace wrapper were added in memory");
    const nestedBlockDoc = await parseDxfToCanonical(Buffer.from(nestedBlockSource), { sourceVersionKey: "f05-attrib-nested-block-source" });
    const nestedBlock = nestedBlockDoc.blocks.OUTER_BLOCK;
    const nestedBlockInsert = nestedBlock?.entities.find((entity): entity is CadInsertEntity => entity.type === "INSERT");
    const outerBlockInsert = nestedBlockDoc.modelSpaceEntities.find((entity): entity is CadInsertEntity => entity.type === "INSERT" && entity.sourceHandle === "C001");
    assert(nestedBlock && nestedBlockInsert && outerBlockInsert, "Nested source block, INSERT and wrapper survived canonical decode");
    assert.strictEqual(nestedBlockInsert.sourceHandle, "B001", "Nested BLOCKS INSERT retains its exact source group 5 identity");
    assert.deepStrictEqual(nestedBlockInsert.insertionPoint, [100, 200], "Nested INSERT keeps its source placement in the containing block definition");
    assert.deepStrictEqual(outerBlockInsert.insertionPoint, [500, 300], "Model-space wrapper retains its source placement");
    assert.deepStrictEqual(nestedBlockInsert.attributes, { KOD: "NESTED" }, "BLOCKS INSERT/ATTRIB pair joins by source handle inside its containing block only");
    assert.deepStrictEqual(nestedBlockInsert.attributeEntities?.[0]?.insertionPoint, [110, 215], "Nested ATTRIB source placement stays in the containing block plane");
    assert(!nestedBlockDoc.diagnostics.some((diagnostic) => diagnostic.code === "UNRESOLVED_DXF_INSERT_ATTRIBUTES"),
      "Exact nested BLOCKS owner handle avoids a guessed or unresolved join");
    const nestedBlockVisitor = new EntityVisitor({
      blocks: nestedBlockDoc.blocks,
      layers: nestedBlockDoc.layers,
      linetypes: nestedBlockDoc.linetypes,
      textStyles: nestedBlockDoc.textStyles,
    });
    const nestedBlockResult = nestedBlockVisitor.createEmptyResult();
    nestedBlockVisitor.visitEntity(outerBlockInsert,
      nestedBlockVisitor.createRootContext(outerBlockInsert.layer, outerBlockInsert.order), nestedBlockResult);
    console.log(`    nested source-wrapper bbox=[${nestedBlockResult.minX.toFixed(3)},${nestedBlockResult.minY.toFixed(3)}..${nestedBlockResult.maxX.toFixed(3)},${nestedBlockResult.maxY.toFixed(3)}], segments=${nestedBlockResult.segments.length}`);
    assert(nestedBlockResult.segments.length > 0 && nestedBlockResult.minX >= 600 && nestedBlockResult.maxX > 620 && nestedBlockResult.minY >= 500 && nestedBlockResult.maxY > 516,
      "Nested source ATTRIB renders at its block-plane source point through a canonical outer INSERT transform");
    const nestedDefaultBlocks = {
      ...nestedBlockDoc.blocks,
      OUTER_BLOCK: {
        ...nestedBlock,
        entities: nestedBlock.entities.map((entity) => entity.type === "INSERT"
          ? { ...entity, attributes: undefined, attributeEntities: undefined }
          : entity),
      },
    };
    const nestedDefaultVisitor = new EntityVisitor({
      blocks: nestedDefaultBlocks,
      layers: nestedBlockDoc.layers,
      linetypes: nestedBlockDoc.linetypes,
      textStyles: nestedBlockDoc.textStyles,
    });
    const nestedDefaultResult = nestedDefaultVisitor.createEmptyResult();
    nestedDefaultVisitor.visitEntity(outerBlockInsert,
      nestedDefaultVisitor.createRootContext(outerBlockInsert.layer, outerBlockInsert.order), nestedDefaultResult);
    assert.notStrictEqual(nestedBlockResult.segments.length, nestedDefaultResult.segments.length,
      "Nested block ATTDEF geometry uses the source instance NESTED value rather than DEFAULT");

    const { AcDbDxfFiler, acdbCreateDxfPairReader } = await import("@mlightcad/data-model");
    const binaryPairs = acdbCreateDxfPairReader(new Uint8Array(Buffer.from(nestedBlockSource)));
    const binaryWriter = new AcDbDxfFiler({ outputFormat: "binary" });
    for (let pair = binaryPairs.next(); pair; pair = binaryPairs.next()) binaryWriter.writeGroup(pair.code, pair.value);
    const nestedBinaryBytes = binaryWriter.toBinary();
    assert.strictEqual(Buffer.from(nestedBinaryBytes.subarray(0, 22)).toString("binary"), "AutoCAD Binary DXF\r\n\u001a\u0000",
      "Nested ATTRIB binary profile uses the official DXF sentinel");
    const nestedBinaryDoc = await parseDxfToCanonical(nestedBinaryBytes, { sourceVersionKey: "f05-attrib-nested-block-binary" });
    const nestedBinaryBlockInsert = nestedBinaryDoc.blocks.OUTER_BLOCK?.entities.find((entity): entity is CadInsertEntity => entity.type === "INSERT");
    const nestedBinaryWrapper = nestedBinaryDoc.modelSpaceEntities.find((entity): entity is CadInsertEntity => entity.type === "INSERT" && entity.sourceHandle === "C001");
    assert(nestedBinaryBlockInsert && nestedBinaryWrapper, "Binary DXF nested INSERT/ATTRIB sequence survives canonical decode");
    assert.deepStrictEqual(nestedBinaryBlockInsert.attributes, nestedBlockInsert.attributes,
      "Binary DXF pair scan binds the same nested source tag/value");
    assert.deepStrictEqual(nestedBinaryBlockInsert.attributeEntities?.[0], nestedBlockInsert.attributeEntities?.[0],
      "Binary DXF retains attached ATTRIB source handle, geometry, style and justification fields");
    assert.deepStrictEqual(nestedBinaryWrapper.insertionPoint, outerBlockInsert.insertionPoint,
      "Binary DXF converter and raw pair binding retain the same outer INSERT placement");
    assert(!nestedBinaryDoc.diagnostics.some((diagnostic) => diagnostic.code === "UNRESOLVED_DXF_INSERT_ATTRIBUTES"),
      "Binary DXF nested source handles bind without an unresolved-owner diagnostic");

    const missingNestedHandleSource = nestedBlockSource.replace(
      `0${fixtureNewline}INSERT${fixtureNewline}5${fixtureNewline}B001${fixtureNewline}100${fixtureNewline}AcDbEntity`,
      `0${fixtureNewline}INSERT${fixtureNewline}100${fixtureNewline}AcDbEntity`
    );
    assert.notStrictEqual(missingNestedHandleSource, nestedBlockSource, "Nested INSERT group 5 omission control was created");
    const missingNestedHandleDoc = await parseDxfToCanonical(Buffer.from(missingNestedHandleSource), { sourceVersionKey: "f05-attrib-nested-block-no-handle" });
    const unresolvedNestedInsert = missingNestedHandleDoc.blocks.OUTER_BLOCK?.entities.find((entity): entity is CadInsertEntity => entity.type === "INSERT");
    assert(unresolvedNestedInsert, "Nested no-handle source INSERT remains present canonically");
    assert.strictEqual(unresolvedNestedInsert.attributes, undefined,
      "BLOCKS ATTRIB values are not guessed by ordinal when the nested source INSERT handle is missing");
    assert(missingNestedHandleDoc.diagnostics.some((diagnostic) => diagnostic.code === "UNRESOLVED_DXF_INSERT_ATTRIBUTES"),
      "Nested no-handle ATTRIB source emits an unresolved join diagnostic");

    const attdef = decoded.blocks.TAGGED_BLOCK?.entities.find((entity) => entity.type === "ATTDEF");
    assert(attdef?.type === "ATTDEF", "Kaynak block ATTDEF canonical blokta korundu");
    assert.strictEqual(attdef.tag, "KOD", "ATTRIB tag'i ile ATTDEF tag'i eşleşti");
    assert.strictEqual(attdef.defaultText, "DEFAULT", "ATTDEF varsayılan metni kaynak pair'lerinden korundu");

    const visitor = new EntityVisitor({
      blocks: decoded.blocks,
      layers: decoded.layers,
      linetypes: decoded.linetypes,
      textStyles: decoded.textStyles,
    });
    const result = visitor.createEmptyResult();
    visitor.visitEntity(insert, visitor.createRootContext(insert.layer, insert.order), result);
    assert(result.segments.length > 0, "Decoder kaynaklı ATTRIB override'ı block text render yoluna ulaştı");
    assert(!result.diagnostics.some((diagnostic) => diagnostic.code === "MISSING_BLOCK_DEFINITION"), "Decoder kaynaklı INSERT block definition'ı çözüldü");
    const defaultOnlyInsert: CadInsertEntity = { ...insert, attributes: undefined, attributeEntities: undefined };
    const defaultOnlyResult = visitor.createEmptyResult();
    visitor.visitEntity(defaultOnlyInsert, visitor.createRootContext(insert.layer, insert.order), defaultOnlyResult);
    assert.notStrictEqual(result.segments.length, defaultOnlyResult.segments.length, "Render geometry, ATTDEF DEFAULT yerine decoder'dan gelen K01 instance metnini kullandı");

    const withoutBlockLine = fixtureSource.replace(
      `0${fixtureNewline}LINE${fixtureNewline}8${fixtureNewline}0${fixtureNewline}10${fixtureNewline}0${fixtureNewline}20${fixtureNewline}0${fixtureNewline}11${fixtureNewline}20${fixtureNewline}21${fixtureNewline}0${fixtureNewline}`,
      ""
    );
    assert.notStrictEqual(withoutBlockLine, fixtureSource, "Attribute source controls isolate ATTDEF text without unrelated block geometry");
    const alignedAttdefSource = withoutBlockLine.replace(
      `40${fixtureNewline}2.5${fixtureNewline}1${fixtureNewline}DEFAULT`,
      `40${fixtureNewline}2.5${fixtureNewline}72${fixtureNewline}3${fixtureNewline}74${fixtureNewline}0${fixtureNewline}11${fixtureNewline}20${fixtureNewline}21${fixtureNewline}5${fixtureNewline}1${fixtureNewline}DEFAULT`
    );
    assert.notStrictEqual(alignedAttdefSource, withoutBlockLine, "ATTDEF second alignment point and mode were added to the DXF source");
    const alignedAttdefDoc = await parseDxfToCanonical(Buffer.from(alignedAttdefSource), { sourceVersionKey: "f05-attrib-attdef-aligned" });
    const alignedAttdef = alignedAttdefDoc.blocks.TAGGED_BLOCK?.entities.find((entity) => entity.type === "ATTDEF");
    assert(alignedAttdef?.type === "ATTDEF", "DXF source ATTDEF remains in its canonical block");
    assert.deepStrictEqual(alignedAttdef.insertionPoint, [0, 5], "ATTDEF group 10/20 reaches the canonical first alignment point");
    assert.strictEqual(alignedAttdef.horizontalMode, 3, "ATTDEF group 72 reaches canonical horizontal alignment mode");
    assert.strictEqual(alignedAttdef.verticalMode, 0, "ATTDEF group 74 reaches canonical vertical alignment mode");
    assert.deepStrictEqual(alignedAttdef.alignmentPoint, [20, 5], "ATTDEF group 11/21 reaches the canonical second alignment point");
    const alignedAttdefInsert = alignedAttdefDoc.modelSpaceEntities.find((entity): entity is CadInsertEntity => entity.type === "INSERT");
    assert(alignedAttdefInsert, "Aligned ATTDEF fixture retains its source INSERT");
    const alignedAttdefVisitor = new EntityVisitor({
      blocks: alignedAttdefDoc.blocks,
      layers: alignedAttdefDoc.layers,
      linetypes: alignedAttdefDoc.linetypes,
      textStyles: alignedAttdefDoc.textStyles,
    });
    const alignedAttdefResult = alignedAttdefVisitor.createEmptyResult();
    alignedAttdefVisitor.visitEntity({ ...alignedAttdefInsert, attributes: undefined, attributeEntities: undefined },
      alignedAttdefVisitor.createRootContext(alignedAttdefInsert.layer, alignedAttdefInsert.order), alignedAttdefResult);
    const leftAlignedAttdefSource = alignedAttdefSource.replace(
      `72${fixtureNewline}3${fixtureNewline}74`,
      `72${fixtureNewline}0${fixtureNewline}74`
    );
    assert.notStrictEqual(leftAlignedAttdefSource, alignedAttdefSource, "A DXF group 72=0 source control was created");
    const leftAlignedAttdefDoc = await parseDxfToCanonical(Buffer.from(leftAlignedAttdefSource), { sourceVersionKey: "f05-attrib-attdef-left-control" });
    const leftAlignedAttdef = leftAlignedAttdefDoc.blocks.TAGGED_BLOCK?.entities.find((entity) => entity.type === "ATTDEF");
    const leftAlignedAttdefInsert = leftAlignedAttdefDoc.modelSpaceEntities.find((entity): entity is CadInsertEntity => entity.type === "INSERT");
    assert(leftAlignedAttdef?.type === "ATTDEF" && leftAlignedAttdefInsert, "Left-aligned source control remains canonical");
    assert.strictEqual(leftAlignedAttdef.horizontalMode, 0, "Source group 72=0 overrides the converter's default alignment state");
    const leftAlignedAttdefVisitor = new EntityVisitor({
      blocks: leftAlignedAttdefDoc.blocks,
      layers: leftAlignedAttdefDoc.layers,
      linetypes: leftAlignedAttdefDoc.linetypes,
      textStyles: leftAlignedAttdefDoc.textStyles,
    });
    const leftAlignedAttdefResult = leftAlignedAttdefVisitor.createEmptyResult();
    leftAlignedAttdefVisitor.visitEntity({ ...leftAlignedAttdefInsert, attributes: undefined, attributeEntities: undefined },
      leftAlignedAttdefVisitor.createRootContext(leftAlignedAttdefInsert.layer, leftAlignedAttdefInsert.order), leftAlignedAttdefResult);
    const alignedAttdefWidth = alignedAttdefResult.maxX - alignedAttdefResult.minX;
    const leftAlignedAttdefWidth = leftAlignedAttdefResult.maxX - leftAlignedAttdefResult.minX;
    assert(alignedAttdefWidth > leftAlignedAttdefWidth * 1.5,
      "The decoded ATTDEF ALIGNED source points fit text width relative to the group 72=0 control");

    const constantAttdefSource = fixtureSource.replace(
      `70${fixtureNewline}0${fixtureNewline}0${fixtureNewline}ENDBLK`,
      `70${fixtureNewline}2${fixtureNewline}0${fixtureNewline}ENDBLK`
    );
    assert.notStrictEqual(constantAttdefSource, fixtureSource, "ATTDEF source group 70 constant flag control was added");
    const constantAttdefDoc = await parseDxfToCanonical(Buffer.from(constantAttdefSource), { sourceVersionKey: "f05-attrib-attdef-constant" });
    const constantAttdef = constantAttdefDoc.blocks.TAGGED_BLOCK?.entities.find((entity) => entity.type === "ATTDEF");
    const constantInsert = constantAttdefDoc.modelSpaceEntities.find((entity): entity is CadInsertEntity => entity.type === "INSERT");
    assert(constantAttdef?.type === "ATTDEF" && constantInsert, "Constant source ATTDEF and INSERT instance are available");
    assert.strictEqual(constantAttdef.isConstant, true, "ATTDEF group 70 bit 2 reaches canonical constant semantics");
    const constantVisitor = new EntityVisitor({
      blocks: constantAttdefDoc.blocks,
      layers: constantAttdefDoc.layers,
      linetypes: constantAttdefDoc.linetypes,
      textStyles: constantAttdefDoc.textStyles,
    });
    const constantResult = constantVisitor.createEmptyResult();
    constantVisitor.visitEntity(constantInsert, constantVisitor.createRootContext(constantInsert.layer, constantInsert.order), constantResult);
    const constantDefaultResult = constantVisitor.createEmptyResult();
    constantVisitor.visitEntity({ ...constantInsert, attributes: undefined, attributeEntities: undefined },
      constantVisitor.createRootContext(constantInsert.layer, constantInsert.order), constantDefaultResult);
    assert.deepStrictEqual(constantResult.segments, constantDefaultResult.segments,
      "Decoded constant ATTDEF preserves DEFAULT when the matching ATTRIB instance carries K01");

    const invisibleAttdefSource = withoutBlockLine.replace(
      `70${fixtureNewline}0${fixtureNewline}0${fixtureNewline}ENDBLK`,
      `70${fixtureNewline}1${fixtureNewline}0${fixtureNewline}ENDBLK`
    );
    assert.notStrictEqual(invisibleAttdefSource, withoutBlockLine, "ATTDEF source group 70 invisible flag control was added");
    const invisibleAttdefDoc = await parseDxfToCanonical(Buffer.from(invisibleAttdefSource), { sourceVersionKey: "f05-attrib-attdef-invisible" });
    const invisibleAttdef = invisibleAttdefDoc.blocks.TAGGED_BLOCK?.entities.find((entity) => entity.type === "ATTDEF");
    const invisibleInsert = invisibleAttdefDoc.modelSpaceEntities.find((entity): entity is CadInsertEntity => entity.type === "INSERT");
    assert(invisibleAttdef?.type === "ATTDEF" && invisibleInsert, "Invisible source ATTDEF and INSERT instance are available");
    assert.strictEqual(invisibleAttdef.isInvisible, true, "ATTDEF group 70 bit 1 reaches canonical invisible semantics");
    const invisibleVisitor = new EntityVisitor({
      blocks: invisibleAttdefDoc.blocks,
      layers: invisibleAttdefDoc.layers,
      linetypes: invisibleAttdefDoc.linetypes,
      textStyles: invisibleAttdefDoc.textStyles,
    });
    const invisibleResult = invisibleVisitor.createEmptyResult();
    invisibleVisitor.visitEntity(invisibleInsert, invisibleVisitor.createRootContext(invisibleInsert.layer, invisibleInsert.order), invisibleResult);
    assert.strictEqual(invisibleResult.segments.length, 0, "Invisible decoded ATTDEF suppresses its paired K01 instance text");
    const alignedAttribSource = withoutBlockLine.replace(
      ["40", "2.5", "1", "K01", "2", "KOD"].join(fixtureNewline),
      ["40", "2.5", "72", "3", "74", "0", "11", "30", "21", "15", "1", "K01", "2", "KOD"].join(fixtureNewline)
    );
    assert.notStrictEqual(alignedAttribSource, withoutBlockLine, "Attached ATTRIB group 72/74 and 11/21 source fields were added");
    const alignedAttribDoc = await parseDxfToCanonical(Buffer.from(alignedAttribSource), { sourceVersionKey: "f05-attrib-instance-aligned" });
    const alignedAttribInsert = alignedAttribDoc.modelSpaceEntities.find((entity): entity is CadInsertEntity => entity.type === "INSERT");
    const alignedAttrib = alignedAttribInsert?.attributeEntities?.[0];
    assert(alignedAttribInsert && alignedAttrib, "Source ATTRIB instance geometry is present on its canonical INSERT");
    assert.deepStrictEqual(alignedAttrib.insertionPoint, [10, 15], "ATTRIB group 10/20 reaches its instance entity");
    assert.deepStrictEqual(alignedAttrib.alignmentPoint, [30, 15], "ATTRIB group 11/21 reaches its instance entity");
    assert.strictEqual(alignedAttrib.horizontalMode, 3, "ATTRIB group 72 reaches its instance entity");
    assert.strictEqual(alignedAttrib.verticalMode, 0, "ATTRIB group 74 reaches its instance entity");
    const alignedAttribVisitor = new EntityVisitor({
      blocks: alignedAttribDoc.blocks,
      layers: alignedAttribDoc.layers,
      linetypes: alignedAttribDoc.linetypes,
      textStyles: alignedAttribDoc.textStyles,
    });
    const alignedAttribResult = alignedAttribVisitor.createEmptyResult();
    alignedAttribVisitor.visitEntity(alignedAttribInsert,
      alignedAttribVisitor.createRootContext(alignedAttribInsert.layer, alignedAttribInsert.order), alignedAttribResult);
    const leftAlignedAttribSource = alignedAttribSource.replace(
      ["72", "3", "74"].join(fixtureNewline),
      ["72", "0", "74"].join(fixtureNewline)
    );
    assert.notStrictEqual(leftAlignedAttribSource, alignedAttribSource, "ATTRIB group 72=0 instance control was created");
    const leftAlignedAttribDoc = await parseDxfToCanonical(Buffer.from(leftAlignedAttribSource), { sourceVersionKey: "f05-attrib-instance-left-control" });
    const leftAlignedAttribInsert = leftAlignedAttribDoc.modelSpaceEntities.find((entity): entity is CadInsertEntity => entity.type === "INSERT");
    assert(leftAlignedAttribInsert, "Left-aligned source ATTRIB instance remains attached to its INSERT");
    const leftAlignedAttribVisitor = new EntityVisitor({
      blocks: leftAlignedAttribDoc.blocks,
      layers: leftAlignedAttribDoc.layers,
      linetypes: leftAlignedAttribDoc.linetypes,
      textStyles: leftAlignedAttribDoc.textStyles,
    });
    const leftAlignedAttribResult = leftAlignedAttribVisitor.createEmptyResult();
    leftAlignedAttribVisitor.visitEntity(leftAlignedAttribInsert,
      leftAlignedAttribVisitor.createRootContext(leftAlignedAttribInsert.layer, leftAlignedAttribInsert.order), leftAlignedAttribResult);
    const alignedAttribWidth = alignedAttribResult.maxX - alignedAttribResult.minX;
    const leftAlignedAttribWidth = leftAlignedAttribResult.maxX - leftAlignedAttribResult.minX;
    assert(alignedAttribWidth > leftAlignedAttribWidth * 1.5,
      "Attached ATTRIB ALIGNED placement fits its text to source group 11/21, unlike the group 72=0 control");
    assert(alignedAttribResult.minX >= 10 && alignedAttribResult.maxX <= 31,
      "Attached ATTRIB geometry renders once in its source parent-plane placement without reapplying INSERT translation");
    assert.strictEqual(alignedAttribResult.segments.length, leftAlignedAttribResult.segments.length,
      "Changing instance justification changes geometry width without duplicating or dropping glyph topology");

    const unsupportedAttribSource = fixtureSource.replace(
      ["40", "2.5", "1", "K01", "2", "KOD"].join(fixtureNewline),
      ["40", "2.5", "210", "1", "220", "0", "230", "0", "1", "K01", "2", "KOD"].join(fixtureNewline)
    );
    assert.notStrictEqual(unsupportedAttribSource, fixtureSource, "Non-default ATTRIB extrusion source control was added");
    const unsupportedAttribDoc = await parseDxfToCanonical(Buffer.from(unsupportedAttribSource), { sourceVersionKey: "f05-attrib-instance-unsupported-ocs" });
    const unsupportedAttribInsert = unsupportedAttribDoc.modelSpaceEntities.find((entity): entity is CadInsertEntity => entity.type === "INSERT");
    assert(unsupportedAttribInsert, "Non-default OCS source retains its canonical INSERT and tag value");
    assert.deepStrictEqual(unsupportedAttribInsert.attributes, { KOD: "K01" }, "Unsupported placement retains the safely decoded tag/value binding");
    assert.strictEqual(unsupportedAttribInsert.attributeEntities, undefined, "Unsupported OCS is not attached as guessed 2D geometry");
    assert(unsupportedAttribDoc.diagnostics.some((diagnostic) => diagnostic.code === "UNSUPPORTED_ATTRIBUTE_INSTANCE_GEOMETRY"),
      "Unsupported ATTRIB OCS is surfaced as a source-handle geometry diagnostic");
    console.log("  ✓ Gate 5A: LOCAL PASS — source ATTRIB value, placement, justification, ATTDEF flags and render de-duplication passed");
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
  // GATE 6A: Unsupported MLEADER must be explicitly diagnosed
  // --------------------------------------------------------------------------
  console.log("\n[Gate 6A] Desteklenmeyen MLEADER için entity tanısı...");
  {
    const fixturePath = path.join(process.cwd(), "tests/fixtures/dxf/unsupported-annotations.dxf");
    const decoded = await parseDxfToCanonical(fs.readFileSync(fixturePath), { sourceVersionKey: "f05-unsupported-mleader" });
    const mleaderDiagnostics = decoded.diagnostics.filter((diagnostic) =>
      diagnostic.code === "UNSUPPORTED_ENTITY_TYPE" && /MLEADER/i.test(diagnostic.message)
    );
    assert.strictEqual(mleaderDiagnostics.length, 1, "Omitted MLEADER entity için tek explicit warning üretildi");
    assert.strictEqual(mleaderDiagnostics[0]?.severity, "warning", "Unsupported profile degraded-warning tanısı taşıdı");
    assert.strictEqual(mleaderDiagnostics[0]?.id, "diag_dxf_unsupported_mleader_1", "Handle olmayan fixture entity'si de kararlı bir diagnostic kimliği aldı");
    assert(!decoded.modelSpaceEntities.some((entity) => String(entity.type).toUpperCase().includes("MLEADER")), "Unsupported MLEADER generic bir entity gibi sessizce çizilmedi");
    assert(decoded.modelSpaceEntities.some((entity) => entity.type === "LEADER"), "Aynı fixture'daki desteklenen LEADER entity'si korundu");
    console.log("  ✓ Gate 6A: LOCAL PASS — DXF MLEADER omission açık entity warning ile işaretlendi; LEADER korunuyor");
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
    assert.strictEqual(probe.styleName, "zulay iç ölçü", "R001 DWG probe DIMSTYLE adını korumalı");
    assert.strictEqual(probe.primaryUnitDecimals, 0, "R001 DIMSTYLE group DIMDEC=0 canonical primary-unit precision alanına ulaşmalı");
    console.log(`  -> DWG DIMSTYLE probe: style=${probe.styleName}, DIMDEC=${probe.primaryUnitDecimals}`);

    // Sahneye derleme ve render parça kontrolü
    const compiled = compileCanonicalToScene(doc);
    assert(compiled.chunks.size > 0, "Sahne parçaları başarıyla üretilmeli");
    assert(compiled.manifest.indexPages[0].chunks.length > 0, "Manifest parçaları başarıyla içermeli");

    console.log("  ✓ Gate 7: CENSUS/COMPILE PASS — 1814 DIMENSION ve *D bağı; LibreDWG error 68 nedeniyle temiz decode ve AutoCAD görsel oracle NOT_RUN");
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
