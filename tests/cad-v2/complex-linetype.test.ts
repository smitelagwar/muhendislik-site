import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parseDxfToCanonical } from "../../src/lib/cad-v2/decode/dxf-adapter";
import { mapLinetypeRecords } from "../../src/lib/cad-v2/decode/linetype-record";
import { mapTextStyleRecords } from "../../src/lib/cad-v2/decode/text-style-record";
import { CadDiagnosticCode } from "../../src/lib/cad-v2/canonical/diagnostics";
import { resolveEntityLinetype } from "../../src/lib/cad-v2/render/cad-stroke";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { FontLayoutEngine, type FontDegradedDiagnostic } from "../../src/lib/cad-v2/text/font-layout-engine";
import type { CadCanonicalDocument, CadEntity, CadLinetype, CadTextEntity, CadInsertEntity } from "../../src/lib/cad-v2/canonical/types";
import { ShxFont, ShxFontType } from "@mlightcad/shx-parser";
import type { ShxFontData } from "@mlightcad/shx-parser";
import { parseSceneChunk, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";
import { layoutComplexLinetypeEntity, layoutComplexLinetypeLine } from "../../src/lib/cad-v2/compile/complex-linetype-glyphs";
import { EntityVisitor } from "../../src/lib/cad-v2/compile/entity-visitor";
import { computeInsertMatrix, maxSingularValue2D, multiplyMatrix4x4, transformPoint2D } from "../../src/lib/cad-v2/compile/coordinate-transform";

const fixturePath = path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/r07-complex-linetype-placement.dxf");
const sourceDxf = fs.readFileSync(fixturePath);

function affineSegmentKey(segment: { x0: number; y0: number; x1: number; y1: number }): string {
  const pointKey = (x: number, y: number) => `${x.toFixed(5)},${y.toFixed(5)}`;
  const first = pointKey(segment.x0, segment.y0);
  const second = pointKey(segment.x1, segment.y1);
  return first < second ? `${first}|${second}` : `${second}|${first}`;
}

function subtractSegments<T extends { x0: number; y0: number; x1: number; y1: number }>(
  actual: T[], baseline: T[],
): T[] {
  const counts = new Map<string, number>();
  for (const segment of baseline) {
    const key = affineSegmentKey(segment);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const additions: T[] = [];
  for (const segment of actual) {
    const key = affineSegmentKey(segment);
    const count = counts.get(key) ?? 0;
    if (count > 0) counts.set(key, count - 1);
    else additions.push(segment);
  }
  return additions;
}

async function main() {
  const document = await parseDxfToCanonical(sourceDxf);
  const linetype = document.linetypes.F07_COMPLEX;
  assert.ok(linetype, "DXF adapter should carry its LTYPE table into the canonical document");
  assert.deepEqual(linetype.pattern, [5, -2, 0, -1], "dash, gap, dot and trailing gap lengths should survive decoding");
  assert.equal(linetype.totalLength, 8, "declared pattern length should survive decoding");
  assert.equal(linetype.description, "embedded shape and text placement oracle");
  assert.deepEqual(linetype.complexElements, [
    { patternIndex: 2, elementTypeFlag: 4, shapeNumber: 7, styleObjectId: "A1", scale: 1.5, rotation: 0.25, offsetX: 0.2, offsetY: -0.3 },
    { patternIndex: 3, elementTypeFlag: 2, styleObjectId: "A2", scale: 0.75, rotation: -0.125, offsetX: 0.4, offsetY: 0.15, text: "GAS" },
  ], "shape and text source fields should be retained with their pattern index");
  assert.deepEqual(document.textStyles.F07_SHAPE_STYLE, {
    id: "F07_SHAPE_STYLE", name: "F07_SHAPE_STYLE", objectHandle: "A1", fontFileName: "ltypeshapes.shx", bigFontFileName: "shapes-bigfont.shx", isShapeFile: true,
    height: 0, widthFactor: 1, obliqueAngleDeg: 0, isVertical: false,
  }, "unnamed shape-file STYLE records should survive keyed by their source handle");
  assert.deepEqual(document.textStyles.F07_TEXT_STYLE, {
    id: "F07_TEXT_STYLE", name: "F07_TEXT_STYLE", objectHandle: "A2", fontFileName: "simplex.shx", bigFontFileName: "bigfont.shx",
    isShapeFile: false, height: 0.2, widthFactor: 0.8, obliqueAngleDeg: 10, isVertical: false,
  }, "named STYLE records should retain source font, sizing, angle, and handle fields");
  const fontDiagnostics: FontDegradedDiagnostic[] = [];
  const styleProbe: CadTextEntity = {
    type: "TEXT", handle: "STYLE_PROBE", layer: "0", order: BigInt(1), text: "A",
    insertionPoint: [0, 0], height: 1, rotationRad: 0, widthFactor: 1, obliqueRad: 0, styleName: "F07_TEXT_STYLE",
  };
  FontLayoutEngine.layoutText(styleProbe, { textStyles: document.textStyles, diagnostics: fontDiagnostics });
  assert.ok(fontDiagnostics.some((item) => item.requestedFont === "simplex.shx" && item.reason === "shx_not_found"),
    "decoded STYLE font filename should reach the text resolver and missing SHX should stay explicitly degraded");
  assert.ok(!document.diagnostics.some((item) => item.code === CadDiagnosticCode.UNSUPPORTED_COMPLEX_LINETYPE_ELEMENT),
    "decoder should preserve source metadata without deciding glyph support before font resolution");

  const resolved = resolveEntityLinetype(
    document.modelSpaceEntities.find((entity) => entity.type === "LINE")!,
    document.layers,
    document.linetypes,
  );
  assert.deepEqual(resolved.pattern, [5, -2, 0, -1]);
  assert.equal(resolved.isContinuous, false, "a complex linetype must keep its dash pattern instead of becoming continuous");
  const compiled = compileCanonicalToScene(document, { sceneId: "f07_complex_linetype_dxf" });
  assert.equal(compiled.manifest.qualityStatus, "degraded", "missing embedded glyph geometry must not leave the scene marked exact");
  assert.ok(compiled.manifest.diagnosticsSummary.diagnosticCodes.includes(CadDiagnosticCode.UNSUPPORTED_COMPLEX_LINETYPE_ELEMENT), "scene quality summary should report unresolved embedded glyph geometry");

  const { AcDbDxfFiler, acdbCreateDxfPairReader } = await import("@mlightcad/data-model");
  const pairReader = acdbCreateDxfPairReader(new Uint8Array(sourceDxf));
  const filer = new AcDbDxfFiler({ outputFormat: "binary" });
  for (let pair = pairReader.next(); pair; pair = pairReader.next()) filer.writeGroup(pair.code, pair.value);
  const binaryDocument = await parseDxfToCanonical(filer.toBinary());
  assert.deepEqual(binaryDocument.linetypes.F07_COMPLEX.pattern, [5, -2, 0, -1], "binary DXF should retain the same dash pattern");
  assert.deepEqual(binaryDocument.linetypes.F07_COMPLEX.complexElements, linetype.complexElements, "binary DXF should retain the same complex source fields");
  assert.deepEqual(binaryDocument.textStyles, document.textStyles, "binary DXF should retain the same STYLE table records and object handles");
  assert.ok(!binaryDocument.diagnostics.some((item) => item.code === CadDiagnosticCode.UNSUPPORTED_COMPLEX_LINETYPE_ELEMENT));

  const dwgDefaultFields = mapLinetypeRecords([{
    name: "DWG_SIMPLE_DEFAULT_FIELDS",
    totalPatternLength: 0.75,
    pattern: [
      { elementLength: 0.25, elementTypeFlag: 0, shapeNumber: 0, styleObjectId: "", scale: 1, rotation: 0, offsetX: 0, offsetY: 0, text: "" },
      { elementLength: -0.5, elementTypeFlag: 0, shapeNumber: 0, styleObjectId: "", scale: 1, rotation: 0, offsetX: 0, offsetY: 0, text: "" },
    ],
  }]);
  assert.deepEqual(dwgDefaultFields.diagnostics, [], "default DWG dash fields must not create complex-linetype warnings");
  assert.equal(dwgDefaultFields.linetypes.DWG_SIMPLE_DEFAULT_FIELDS?.complexElements, undefined,
    "zero-valued shape/text defaults should not become canonical complex elements");
  const rotationOnly = mapLinetypeRecords([{
    name: "DWG_ABSOLUTE_ROTATION_ONLY",
    pattern: [{ elementLength: 0, elementTypeFlag: 1, shapeNumber: 0, styleObjectId: "", scale: 1, rotation: 0, offsetX: 0, offsetY: 0, text: "" }],
  }]);
  assert.equal(rotationOnly.linetypes.DWG_ABSOLUTE_ROTATION_ONLY?.complexElements?.[0]?.elementTypeFlag, 1,
    "group-74 absolute-rotation bit should stay preserved as source metadata");
  assert.deepEqual(rotationOnly.diagnostics, [], "rotation mode alone does not declare an embedded shape/text glyph");
  assert.deepEqual(layoutComplexLinetypeLine([0, 0], [10, 0], rotationOnly.linetypes.DWG_ABSOLUTE_ROTATION_ONLY, 1, {}),
    { segments: [], unsupportedElements: [] }, "rotation-only metadata must remain inert during scene compilation");

  const dwgShape = mapLinetypeRecords([{
    name: "DWG_COMPLEX",
    description: "DWG shape/text record",
    totalPatternLength: 3,
    pattern: [
      { elementLength: 2, elementTypeFlag: 0 },
      { elementLength: -1, elementTypeFlag: 2, text: "WATER", scale: 0.8 },
    ],
  }]);
  assert.deepEqual(dwgShape.linetypes.DWG_COMPLEX.pattern, [2, -1]);
  assert.deepEqual(dwgShape.linetypes.DWG_COMPLEX.complexElements, [
    { patternIndex: 1, elementTypeFlag: 2, scale: 0.8, text: "WATER" },
  ]);
  assert.deepEqual(dwgShape.diagnostics, [], "font-resolved glyph support belongs to compilation, not table decoding");
  const dwgStyles = mapTextStyleRecords([{
    name: "SHAPES", handle: "0xA1", standardFlag: 1, fixedTextHeight: 0,
    widthFactor: 1, obliqueAngle: Math.PI / 6, font: "ltypeshapes", bigFont: "",
  }]);
  assert.deepEqual({ ...dwgStyles.SHAPES, obliqueAngleDeg: undefined }, {
    id: "SHAPES", name: "SHAPES", objectHandle: "A1", fontFileName: "ltypeshapes",
    isShapeFile: true, height: 0, widthFactor: 1, obliqueAngleDeg: undefined, isVertical: false,
  }, "DWG STYLE table fields and stable handles should map without guessed extensions");
  assert.ok(Math.abs(dwgStyles.SHAPES!.obliqueAngleDeg - 30) < 1e-12, "DWG oblique radians should convert to canonical degrees");
  assert.equal(mapTextStyleRecords([{ name: "", handle: "A2", standardFlag: 1, font: "named-shapes.shx" }])["@A2"]?.name,
    "", "unnamed shape-file STYLE entries remain addressable by handle");

  const syntheticFontData: ShxFontData = {
    header: { fontType: ShxFontType.SHAPES, fileHeader: "synthetic", fileVersion: "1.0" },
    content: {
      data: { 7: new Uint8Array([0x24, 0]) },
      info: "synthetic vertical stroke", orientation: "horizontal", baseUp: 8, baseDown: 2,
      height: 10, width: 10, isExtended: false,
    },
  };
  const syntheticShapeFont = new ShxFont(syntheticFontData);
  const originalResolveFontStyle = FontLayoutEngine.resolveFontStyle.bind(FontLayoutEngine);
  FontLayoutEngine.resolveFontStyle = (params) => params.fontFileName === "ltypeshapes.shx"
    ? {
        requestedStyle: params.styleName || "", requestedFont: "ltypeshapes.shx", fontType: "shx",
        resolvedFontName: "synthetic.shx", fontHash: "synthetic", status: "exact", isSubstitute: false,
        shxFont: syntheticShapeFont,
      }
    : originalResolveFontStyle(params);
  try {
    const rotatedShape = { patternIndex: 0, elementTypeFlag: 5, shapeNumber: 7, styleObjectId: "A1" };
    const rotationProbe = {
      id: "rotation-probe", name: "rotation-probe", pattern: [1, -1], totalLength: 2,
      complexElements: [rotatedShape],
    };
    const absoluteGlyph = layoutComplexLinetypeLine([0, 0], [20, 20], rotationProbe, 1, document.textStyles);
    const relativeGlyph = layoutComplexLinetypeLine([0, 0], [20, 20], {
      ...rotationProbe, complexElements: [{ ...rotatedShape, elementTypeFlag: 4 }],
    }, 1, document.textStyles);
    assert.ok(absoluteGlyph.segments.length > 0 && relativeGlyph.segments.length > 0,
      "synthetic SHX test font resolves both complex-shape rotation modes");
    assert.ok(Math.abs(absoluteGlyph.segments[0]!.x1 - absoluteGlyph.segments[0]!.x0) < 1e-6,
      "group-74 absolute-rotation bit keeps the SHX stroke vertical on a diagonal source line");
    assert.ok(Math.abs(relativeGlyph.segments[0]!.x1 - relativeGlyph.segments[0]!.x0) > 0.01,
      "relative shape rotation follows the diagonal source tangent");

    const curvedShapeLinetype = {
      id: "curve-probe", name: "curve-probe", pattern: [10, -5], totalLength: 15,
      complexElements: [{ patternIndex: 0, elementTypeFlag: 5, shapeNumber: 7, styleObjectId: "A1" }],
    };
    const curveStyles = document.textStyles;
    const arcGlyphs = layoutComplexLinetypeEntity({
      type: "ARC", handle: "CURVE_ARC", layer: "0", order: BigInt(3), center: [0, 0], radius: 50,
      startAngleRad: 0, endAngleRad: Math.PI / 2, isClockwise: false,
    }, curvedShapeLinetype, 1, curveStyles);
    const arcAnchors = arcGlyphs.segments.filter((segment) => Math.abs(segment.x1 - segment.x0) < 1e-8);
    assert.equal(arcAnchors.length, 6, "analytic arc length places six 15-unit complex glyph anchors before the 90-degree endpoint");
    assert.ok(Math.abs(arcAnchors[0]!.x0 - 50) < 1e-8, "arc pattern starts at its analytic source point");
    assert.ok(Math.abs(arcAnchors[1]!.x0 - 50 * Math.cos(0.3)) < 1e-8,
      "the second arc glyph is placed at 15 units of arc length, not at 15 units of chord length");
    const firstArcGlyphMidY = (arcAnchors[0]!.y0 + arcAnchors[0]!.y1) / 2;
    const secondArcGlyphMidY = (arcAnchors[1]!.y0 + arcAnchors[1]!.y1) / 2;
    assert.ok(Math.abs((secondArcGlyphMidY - firstArcGlyphMidY) - 50 * Math.sin(0.3)) < 1e-8,
      "arc glyph anchor follows the analytic source tangent station");

    const circleEntity = {
      type: "CIRCLE" as const, handle: "CURVE_CIRCLE", layer: "0", order: BigInt(4), center: [0, 0] as [number, number],
      radius: 50,
    };
    const circleGlyphs = layoutComplexLinetypeEntity(circleEntity, curvedShapeLinetype, 1, curveStyles);
    const circleAnchors = circleGlyphs.segments.filter((segment) => Math.abs(segment.x1 - segment.x0) < 1e-8);
    assert.equal(circleAnchors.length, 21, "closed circle places each pattern anchor once without duplicating its closure point");
    assert.ok(Math.abs(circleAnchors[1]!.x0 - 50 * Math.cos(0.3)) < 1e-8,
      "circle phase advances by analytic circumference distance");

    const bulgeGlyphs = layoutComplexLinetypeEntity({
      type: "LWPOLYLINE", handle: "CURVE_BULGE", layer: "0", order: BigInt(5),
      vertices: [{ x: 0, y: 0, bulge: 1 }, { x: 100, y: 0 }], isClosed: false, plinegen: true,
    }, curvedShapeLinetype, 1, curveStyles);
    const bulgeAnchors = bulgeGlyphs.segments.filter((segment) => Math.abs(segment.x1 - segment.x0) < 1e-8);
    assert.equal(bulgeAnchors.length, 11, "semicircle bulge places glyphs across its analytic 50-pi-unit length");
    assert.ok(Math.abs(bulgeAnchors[1]!.x0 - (50 - 50 * Math.cos(0.3))) < 1e-8,
      "bulge phase follows exact arc distance through its source segment");
    const polylineVertices = [{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 30 }];
    const generatedPolyline = layoutComplexLinetypeEntity({
      type: "LWPOLYLINE", handle: "CURVE_PLGEN_CONTINUE", layer: "0", order: BigInt(6),
      vertices: polylineVertices, isClosed: false, plinegen: true,
    }, curvedShapeLinetype, 1, curveStyles);
    const restartedPolyline = layoutComplexLinetypeEntity({
      type: "LWPOLYLINE", handle: "CURVE_PLGEN_RESTART", layer: "0", order: BigInt(7),
      vertices: polylineVertices, isClosed: false, plinegen: false,
    }, curvedShapeLinetype, 1, curveStyles);
    assert.equal(generatedPolyline.segments.length, 5, "PLINEGEN=1 carries glyph phase through the polyline corner");
    assert.equal(restartedPolyline.segments.length, 6, "PLINEGEN=0 restarts the complex pattern on each source edge");

    const circleFixtureLinetype = {
      ...curvedShapeLinetype, pattern: [1000, -1000], totalLength: 2000,
    };
    const largeCircle = {
      ...circleEntity, handle: "CURVE_CHUNK_CIRCLE", radius: 4200, linetype: "F07_COMPLEX", order: BigInt(6),
    };
    const largeCircleDoc: CadCanonicalDocument = {
      ...document, diagnostics: [], modelSpaceEntities: [largeCircle],
      linetypes: { ...document.linetypes, F07_COMPLEX: circleFixtureLinetype },
    };
    const largeCircleScene = compileCanonicalToScene(largeCircleDoc, { sceneId: "f07_complex_circle_phase" });
    const largeCircleBaseline = compileCanonicalToScene({
      ...largeCircleDoc,
      linetypes: { ...largeCircleDoc.linetypes, F07_COMPLEX: { ...circleFixtureLinetype, complexElements: undefined } },
    }, { sceneId: "f07_complex_circle_baseline" });
    const sceneStrokeCount = (scene: ReturnType<typeof compileCanonicalToScene>) => scene.manifest.chunks.reduce((count, chunkRef) => {
      const parsed = parseSceneChunk(scene.chunks.get(chunkRef.chunkId)!);
      return count + (parsed.sections.get(SceneTag.XY)?.data as Float32Array | undefined)?.length! / 4;
    }, 0);
    const circleExpectedStrokes = layoutComplexLinetypeEntity(largeCircle, circleFixtureLinetype, 1, curveStyles).segments.length;
    assert.equal(sceneStrokeCount(largeCircleScene) - sceneStrokeCount(largeCircleBaseline), circleExpectedStrokes,
      "direct curved glyph strokes survive source tessellation and spatial chunk partitioning exactly once");
    assert.ok(largeCircleScene.manifest.chunks.length > 1, "large curved source is split into spatial chunks");
    assert.ok(!largeCircleScene.manifest.diagnosticsSummary.diagnosticCodes.includes(CadDiagnosticCode.UNSUPPORTED_COMPLEX_LINETYPE_ELEMENT),
      "exact shape glyphs on a curved source do not degrade scene quality");

    const nestedArc = {
      type: "ARC" as const, handle: "NESTED_CURVE_ARC", layer: "0", order: BigInt(7), center: [0, 0] as [number, number],
      radius: 50, startAngleRad: 0, endAngleRad: Math.PI / 2, isClockwise: false, linetype: "F07_COMPLEX",
    };
    const nestedCurveDoc: CadCanonicalDocument = {
      ...document, diagnostics: [],
      blocks: { ...document.blocks, F07_CURVE_BLOCK: { name: "F07_CURVE_BLOCK", basePoint: [0, 0], entities: [nestedArc] } },
      modelSpaceEntities: [{ type: "INSERT", handle: "CURVE_INSERT", layer: "0", order: BigInt(8),
        blockName: "F07_CURVE_BLOCK", insertionPoint: [300, 20], scale: [-1, 1, 1], rotationRad: 0 }],
      linetypes: { ...document.linetypes, F07_COMPLEX: curvedShapeLinetype },
    };
    const nestedCurveScene = compileCanonicalToScene(nestedCurveDoc, { sceneId: "f07_nested_complex_arc" });
    const nestedCurveBaseline = compileCanonicalToScene({
      ...nestedCurveDoc,
      linetypes: { ...nestedCurveDoc.linetypes, F07_COMPLEX: { ...curvedShapeLinetype, complexElements: undefined } },
    }, { sceneId: "f07_nested_complex_arc_baseline" });
    assert.equal(sceneStrokeCount(nestedCurveScene) - sceneStrokeCount(nestedCurveBaseline), arcGlyphs.segments.length,
      "nested mirrored ARC renders the same source-space complex glyph count before INSERT transforms");
    assert.ok(!nestedCurveScene.manifest.diagnosticsSummary.diagnosticCodes.includes(CadDiagnosticCode.UNSUPPORTED_COMPLEX_LINETYPE_ELEMENT),
      "nested exact curve glyphs retain a non-degraded quality result");

    // R07-F: pin source-station phase and full-affine glyph geometry for each supported curve family.
    const affineLinetype: CadLinetype = {
      id: "F07_AFFINE", name: "F07_AFFINE", pattern: [8, -13], totalLength: 21,
      complexElements: [{ patternIndex: 0, elementTypeFlag: 4, shapeNumber: 7, styleObjectId: "A1", scale: 1,
        rotation: 0.23, offsetX: 1.25, offsetY: -0.75 }],
    };
    const affineProfiles: CadEntity[] = [
      { type: "ARC", handle: "AFFINE_ARC", layer: "0", order: BigInt(21), center: [2, -3], radius: 35,
        startAngleRad: 0.18, endAngleRad: 2.43, isClockwise: false },
      { type: "CIRCLE", handle: "AFFINE_CIRCLE", layer: "0", order: BigInt(22), center: [4, -3], radius: 35 },
      { type: "LWPOLYLINE", handle: "AFFINE_BULGE", layer: "0", order: BigInt(23),
        vertices: [{ x: 0, y: 0, bulge: 0.5 }, { x: 50, y: 8 }, { x: 57, y: 42 }], isClosed: false, plinegen: true },
      { type: "ELLIPSE", handle: "AFFINE_ELLIPSE", layer: "0", order: BigInt(24), center: [-2, 1],
        majorAxisVector: [32, 4], axisRatio: 0.58, startParam: 0.2, endParam: 4.8 },
      { type: "SPLINE", handle: "AFFINE_SPLINE", layer: "0", order: BigInt(25), degree: 3,
        controlPoints: [[-30, -8], [-18, 29], [17, -27], [36, 13]], knots: [0, 0, 0, 0, 1, 1, 1, 1],
        isPeriodic: false, isRational: false },
    ];
    const innerAffineInsert: CadInsertEntity = {
      type: "INSERT", handle: "AFFINE_INNER_INSERT", layer: "0", order: BigInt(30), blockName: "F07_AFFINE_SOURCE",
      insertionPoint: [12, -5], scale: [0.75, 1.6, 1], rotationRad: 0.37,
    };
    const outerAffineInsert: CadInsertEntity = {
      type: "INSERT", handle: "AFFINE_OUTER_INSERT", layer: "0", order: BigInt(31), blockName: "F07_AFFINE_NESTED",
      insertionPoint: [320, 90], scale: [-1.4, 0.8, 1], rotationRad: -0.29,
    };
    const innerMatrix = computeInsertMatrix({ basePoint: [0, 0], insertionPoint: innerAffineInsert.insertionPoint,
      scale: innerAffineInsert.scale, rotationRad: innerAffineInsert.rotationRad });
    const outerMatrix = computeInsertMatrix({ basePoint: [0, 0], insertionPoint: outerAffineInsert.insertionPoint,
      scale: outerAffineInsert.scale, rotationRad: outerAffineInsert.rotationRad });
    const nestedAffineMatrix = multiplyMatrix4x4(outerMatrix, innerMatrix);
    const renderProfileThroughNestedInserts = (sourceProfile: CadEntity, withGlyphs: boolean) => {
      const sourceEntity = { ...sourceProfile, linetype: affineLinetype.name } as CadEntity;
      const lineType = withGlyphs ? affineLinetype : { ...affineLinetype, complexElements: undefined };
      const affineVisitor = new EntityVisitor({
        blocks: {
          ...document.blocks,
          F07_AFFINE_SOURCE: { name: "F07_AFFINE_SOURCE", basePoint: [0, 0], entities: [sourceEntity] },
          F07_AFFINE_NESTED: { name: "F07_AFFINE_NESTED", basePoint: [0, 0], entities: [innerAffineInsert] },
        },
        layers: document.layers,
        linetypes: { ...document.linetypes, [affineLinetype.name]: lineType },
        textStyles: curveStyles,
        maxCurveErrorWorld: 0.25,
      });
      const result = affineVisitor.createEmptyResult();
      affineVisitor.visitEntity(outerAffineInsert, affineVisitor.createRootContext("0", BigInt(31)), result);
      assert.deepEqual(result.diagnostics, [], `${sourceProfile.type} affine visit should not degrade or omit source geometry`);
      return result.segments;
    };
    for (const profile of affineProfiles) {
      const sourceEntity = { ...profile, linetype: affineLinetype.name } as CadEntity;
      const localError = 0.25 / maxSingularValue2D(nestedAffineMatrix);
      const sourceGlyphs = layoutComplexLinetypeEntity(sourceEntity, affineLinetype, 1, curveStyles, localError);
      const expected = sourceGlyphs.segments.map((glyph) => {
        const p0 = transformPoint2D(nestedAffineMatrix, [glyph.x0, glyph.y0]);
        const p1 = transformPoint2D(nestedAffineMatrix, [glyph.x1, glyph.y1]);
        return { x0: p0[0], y0: p0[1], x1: p1[0], y1: p1[1] };
      });
      const observed = subtractSegments(
        renderProfileThroughNestedInserts(profile, true), renderProfileThroughNestedInserts(profile, false),
      );
      assert.ok(expected.length > 0, `${profile.type} provides a non-empty glyph station profile`);
      assert.deepEqual(observed.map(affineSegmentKey).sort(), expected.map(affineSegmentKey).sort(),
        `${profile.type} glyph stations/tangent/offset geometry must be built in source coordinates and carried by both nested affine INSERTs`);
    }

    const transformedCircle = { ...circleEntity, handle: "AFFINE_CHUNK_CIRCLE", radius: 4200,
      linetype: "F07_AFFINE_CHUNK", order: BigInt(32) };
    const chunkLinetype: CadLinetype = { ...affineLinetype, id: "F07_AFFINE_CHUNK", name: "F07_AFFINE_CHUNK",
      pattern: [1200, -800], totalLength: 2000 };
    const chunkBlocks: CadCanonicalDocument["blocks"] = {
      ...document.blocks,
      F07_AFFINE_CHUNK_SOURCE: { name: "F07_AFFINE_CHUNK_SOURCE", basePoint: [0, 0], entities: [transformedCircle] },
      F07_AFFINE_CHUNK_NESTED: { name: "F07_AFFINE_CHUNK_NESTED", basePoint: [0, 0], entities: [{
        ...innerAffineInsert, handle: "AFFINE_CHUNK_INNER", blockName: "F07_AFFINE_CHUNK_SOURCE",
      }] },
    };
    const chunkRootInsert: CadInsertEntity = { ...outerAffineInsert, handle: "AFFINE_CHUNK_OUTER",
      blockName: "F07_AFFINE_CHUNK_NESTED", insertionPoint: [300, 90] };
    const chunkDoc: CadCanonicalDocument = { ...document, diagnostics: [], blocks: chunkBlocks,
      modelSpaceEntities: [chunkRootInsert], linetypes: { ...document.linetypes, [chunkLinetype.name]: chunkLinetype } };
    const chunkBaselineDoc: CadCanonicalDocument = { ...chunkDoc, linetypes: { ...chunkDoc.linetypes,
      [chunkLinetype.name]: { ...chunkLinetype, complexElements: undefined } } };
    const affineChunkScene = compileCanonicalToScene(chunkDoc, { sceneId: "f07_affine_nested_chunk_circle" });
    const affineChunkBaseline = compileCanonicalToScene(chunkBaselineDoc, { sceneId: "f07_affine_nested_chunk_circle_baseline" });
    const sceneStrokeCountForLayout = (scene: ReturnType<typeof compileCanonicalToScene>, layoutId: string) =>
      scene.manifest.chunks.filter((chunkRef) => chunkRef.layoutId === layoutId).reduce((count, chunkRef) => {
        const parsed = parseSceneChunk(scene.chunks.get(chunkRef.chunkId)!);
        return count + (parsed.sections.get(SceneTag.XY)?.data as Float32Array | undefined)?.length! / 4;
      }, 0);
    const transformedCircleGlyphCount = layoutComplexLinetypeEntity(transformedCircle, chunkLinetype, 1, curveStyles).segments.length;
    assert.ok(affineChunkScene.manifest.chunks.filter((chunkRef) => chunkRef.layoutId === "Model").length > 1,
      "nested mirrored/nonuniform CIRCLE exceeds the spatial chunk span");
    assert.equal(sceneStrokeCountForLayout(affineChunkScene, "Model") - sceneStrokeCountForLayout(affineChunkBaseline, "Model"),
      transformedCircleGlyphCount, "nested transformed curve glyphs survive model-space spatial chunk partition exactly once");

    const viewportDoc: CadCanonicalDocument = {
      ...chunkDoc,
      layouts: {
        Model: { id: "Model", name: "Model", isModelSpace: true, bbox: [-9000, -9000, 9000, 9000] },
        F07_SHEET: { id: "F07_SHEET", name: "R07 affine viewport", isModelSpace: false, bbox: [0, 0, 200, 200], viewportIds: ["F07_VP"] },
      },
      viewports: { F07_VP: { id: "F07_VP", layoutId: "F07_SHEET", center: [100, 100], width: 200, height: 200,
        viewCenter: [300, 90], viewHeight: 20000, frozenLayers: [] } },
    };
    const viewportBaselineDoc: CadCanonicalDocument = {
      ...viewportDoc,
      linetypes: { ...viewportDoc.linetypes, [chunkLinetype.name]: { ...chunkLinetype, complexElements: undefined } },
    };
    const affineViewportScene = compileCanonicalToScene(viewportDoc, { sceneId: "f07_affine_nested_viewport_circle" });
    const affineViewportBaseline = compileCanonicalToScene(viewportBaselineDoc, { sceneId: "f07_affine_nested_viewport_circle_baseline" });
    const viewportScale = viewportDoc.viewports.F07_VP!.height / viewportDoc.viewports.F07_VP!.viewHeight;
    const paperScaledGlyphCount = layoutComplexLinetypeEntity(
      transformedCircle, chunkLinetype,
      (viewportDoc.linetypeScaleSettings?.globalScale ?? 1) / viewportScale,
      curveStyles,
    ).segments.length;
    assert.equal(sceneStrokeCountForLayout(affineViewportScene, "F07_SHEET") - sceneStrokeCountForLayout(affineViewportBaseline, "F07_SHEET"),
      paperScaledGlyphCount, "paper viewport retains each PSLTSCALE-adjusted source-phase glyph once after nested affine mapping");

    const positiveDoc: CadCanonicalDocument = {
      ...document,
      diagnostics: [],
      modelSpaceEntities: [{
        ...document.modelSpaceEntities.find((entity) => entity.type === "LINE")!, end: [8200, 0],
      }],
      textStyles: {
        ...document.textStyles,
        F07_TEXT_STYLE: { ...document.textStyles.F07_TEXT_STYLE!, fontFileName: "Arial-Regular.ttf" },
      },
      linetypes: {
      ...document.linetypes,
      F07_COMPLEX: {
        ...linetype,
        complexElements: [
          { patternIndex: 2, elementTypeFlag: 4, shapeNumber: 7, styleObjectId: "A1", scale: 1.5, offsetX: 0.2, offsetY: -0.3 },
          { patternIndex: 3, elementTypeFlag: 2, styleObjectId: "A2", scale: 0.75, offsetX: 0.4, offsetY: 0.15, text: "GAS" },
        ],
      },
      },
    };
    const positiveScene = compileCanonicalToScene(positiveDoc, { sceneId: "f07_complex_linetype_shape_positive" });
    assert.ok(!positiveScene.manifest.diagnosticsSummary.diagnosticCodes.includes(CadDiagnosticCode.UNSUPPORTED_COMPLEX_LINETYPE_ELEMENT),
      "an exact decoded SHX shape should not keep the scene degraded as unsupported");
    const verticalStrokes = positiveScene.manifest.chunks.flatMap((chunkRef) => {
      const parsed = parseSceneChunk(positiveScene.chunks.get(chunkRef.chunkId)!);
      const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
      const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
      const strokes: Array<{ x: number; y0: number; y1: number }> = [];
      for (let index = 0; index < xy.length; index += 4) {
        const x0 = origin[0]! + xy[index]!;
        const y0 = origin[1]! + xy[index + 1]!;
        const x1 = origin[0]! + xy[index + 2]!;
        const y1 = origin[1]! + xy[index + 3]!;
        if (Math.abs(x1 - x0) < 1e-4 && Math.abs(y1 - y0) > 0.1) strokes.push({ x: x0, y0, y1 });
      }
      return strokes;
    });
    const expectedShapeDistances = [4087.2, 4095.2, 4103.2, 4111.2];
    for (const expected of expectedShapeDistances) {
      assert.ok(verticalStrokes.some((stroke) => Math.abs(stroke.x - expected) < 0.02),
        `SHX element follows its source pattern phase through the spatial chunk seam at x=${expected}`);
    }
    assert.ok(positiveScene.manifest.chunks.length >= 2, "long embedded-shape LINE is encoded into spatial chunks");

    const mirroredDoc: CadCanonicalDocument = {
      ...positiveDoc,
      blocks: {
        ...positiveDoc.blocks,
        F07_SHAPE_BLOCK: { name: "F07_SHAPE_BLOCK", basePoint: [0, 0], entities: positiveDoc.modelSpaceEntities },
      },
      modelSpaceEntities: [{ type: "INSERT", handle: "F07_MIRROR", layer: "0", order: BigInt(2),
        blockName: "F07_SHAPE_BLOCK", insertionPoint: [9000, 0], scale: [-1, 1, 1], rotationRad: 0 }],
    };
    const mirroredScene = compileCanonicalToScene(mirroredDoc, { sceneId: "f07_complex_linetype_shape_mirror" });
    const mirroredVertical = mirroredScene.manifest.chunks.flatMap((chunkRef) => {
      const parsed = parseSceneChunk(mirroredScene.chunks.get(chunkRef.chunkId)!);
      const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
      const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
      const strokes: number[] = [];
      for (let index = 0; index < xy.length; index += 4) {
        const x0 = origin[0]! + xy[index]!;
        const y0 = origin[1]! + xy[index + 1]!;
        const x1 = origin[0]! + xy[index + 2]!;
        const y1 = origin[1]! + xy[index + 3]!;
        if (Math.abs(x1 - x0) < 1e-4 && Math.abs(y1 - y0) > 0.1) strokes.push(x0);
      }
      return strokes;
    });
    for (const expected of expectedShapeDistances) {
      assert.ok(mirroredVertical.some((x) => Math.abs(x - (9000 - expected)) < 0.02),
        `nested mirrored INSERT transforms the placed SHX glyph without resetting source phase at ${expected}`);
    }
  } finally {
    FontLayoutEngine.resolveFontStyle = originalResolveFontStyle;
  }
  console.log("PASS complex linetype flags, DXF/DWG STYLE handle mapping, metadata retention, warning, and dash resolution");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
