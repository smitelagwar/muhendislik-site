import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import type { CadCanonicalDocument, CadEntity, CadLineEntity } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { parseDxfToCanonical } from "../../src/lib/cad-v2/decode/dxf-adapter";
import { parseDxfLinetypeScaleHeader } from "../../src/lib/cad-v2/decode/dxf-linetype-scale-header";
import { parseSceneChunk, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";

const fixture = fs.readFileSync(path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/r07-complex-linetype-placement.dxf"), "utf8");
const withHeaderProfile = fixture
  .replace(/(9\r?\n\$ACADVER\r?\n1\r?\nAC1027\r?\n)(0\r?\nENDSEC)/, "$1" + [
    "9", "$LTSCALE", "40", "2",
    "9", "$CELTSCALE", "40", "4",
    "9", "$PSLTSCALE", "70", "1",
    "9", "$MSLTSCALE", "70", "0",
  ].join("\n") + "\n$2");
const withEntityScale = withHeaderProfile.replace(
  /6\r?\nF07_COMPLEX\r?\n100\r?\nAcDbLine\r?\n/,
  "6\nF07_COMPLEX\n48\n3\n100\nAcDbLine\n",
);
assert.notEqual(withHeaderProfile, fixture, "DXF profile must inject its header settings and entity scale");
assert.notEqual(withEntityScale, withHeaderProfile, "DXF group 48 belongs before the entity-specific subclass");
const annotationScaleProfiles = [
  { name: "1:1", paperUnits: 1, drawingUnits: 1, factor: 1 },
  { name: "1:2", paperUnits: 1, drawingUnits: 2, factor: 0.5 },
  { name: "1:50", paperUnits: 1, drawingUnits: 50, factor: 0.02 },
  { name: "2:1", paperUnits: 2, drawingUnits: 1, factor: 2 },
] as const;

function makeAnnotationScaleObjects(
  name: string,
  paperUnits: number,
  drawingUnits: number,
  additionalScales: Array<{ name: string; paperUnits: number; drawingUnits: number }> = [],
): string {
  return [
    "0", "SECTION", "2", "OBJECTS",
    "0", "DICTIONARY", "5", "10", "100", "AcDbDictionary", "3", "CANNOSCALE", "350", "20",
    "0", "DICTIONARYVAR", "5", "20", "100", "DictionaryVariables", "280", "0", "1", name,
    "0", "SCALE", "5", "30", "100", "AcDbScale", "300", name,
    "140", String(paperUnits), "141", String(drawingUnits),
    ...additionalScales.flatMap((scale, index) => [
      "0", "SCALE", "5", String(31 + index), "100", "AcDbScale", "300", scale.name,
      "140", String(scale.paperUnits), "141", String(scale.drawingUnits),
    ]),
    "0", "ENDSEC", "0", "EOF",
  ].join("\n");
}

function baseDocument(entity: CadEntity, globalScale: number, blocks: CadCanonicalDocument["blocks"] = {}): CadCanonicalDocument {
  return {
    sourceVersionKey: "r07-linetype-scale",
    sourceSha256: "r07-linetype-scale",
    acadVersion: "AC1027",
    codepage: "UTF-8",
    units: 4,
    measurement: 1,
    linetypeScaleSettings: { globalScale, currentEntityScale: 4, paperSpaceViewportScaling: true, modelTabAnnotationScaling: false },
    layers: { "0": { id: "0", name: "0", visible: true, frozen: false, locked: false,
      color: { method: "aci", aci: 7 }, lineweightMm: 0, linetypeName: "R07_SCALE" } },
    linetypes: { R07_SCALE: { id: "R07_SCALE", name: "R07_SCALE", pattern: [10, -10], totalLength: 20 } },
    textStyles: {},
    blocks,
    layouts: {},
    viewports: {},
    modelSpaceEntities: [entity],
    paperSpaceEntities: {},
    diagnostics: [],
  };
}

function sceneXyVertexCount(scene: ReturnType<typeof compileCanonicalToScene>): number {
  return scene.manifest.chunks.reduce((sum, ref) => {
    const xy = parseSceneChunk(scene.chunks.get(ref.chunkId)!).sections.get(SceneTag.XY)?.data as Float32Array | undefined;
    return sum + (xy?.length ?? 0) / 2;
  }, 0);
}

function sceneSegments(scene: ReturnType<typeof compileCanonicalToScene>) {
  return scene.manifest.chunks.flatMap((ref) => {
    const sections = parseSceneChunk(scene.chunks.get(ref.chunkId)!).sections;
    const xy = sections.get(SceneTag.XY)?.data as Float32Array | undefined;
    const origin = sections.get(SceneTag.ORIGIN)?.data as Float64Array | undefined;
    if (!xy || !origin) return [];
    const segments = [];
    for (let index = 0; index + 3 < xy.length; index += 4) {
      segments.push({
        x0: origin[0]! + xy[index]!,
        y0: origin[1]! + xy[index + 1]!,
        x1: origin[0]! + xy[index + 2]!,
        y1: origin[1]! + xy[index + 3]!,
      });
    }
    return segments;
  });
}

function directDashStyle(scene: ReturnType<typeof compileCanonicalToScene>) {
  for (const ref of scene.manifest.chunks) {
    const sections = parseSceneChunk(scene.chunks.get(ref.chunkId)!).sections;
    const bytes = sections.get(SceneTag.META)?.data as Uint8Array | undefined;
    if (!bytes) continue;
    const meta = JSON.parse(new TextDecoder().decode(bytes)) as {
      drawCommands?: Array<{ dashStyle?: { dashSize: number; gapSize: number } }>;
    };
    const dash = meta.drawCommands?.find((command) => command.dashStyle)?.dashStyle;
    if (dash) return dash;
  }
  throw new Error("Direct LINE must retain its shader dash style");
}

async function main() {
  const decoded = await parseDxfToCanonical(Buffer.from(withEntityScale));
  assert.deepEqual(decoded.linetypeScaleSettings, {
    globalScale: 2,
    currentEntityScale: 4,
    paperSpaceViewportScaling: true,
    modelTabAnnotationScaling: false,
  }, "DXF HEADER stores scale values and PSLTSCALE/MSLTSCALE as boolean modes");
  const sourceLine = decoded.modelSpaceEntities.find((entity) => entity.type === "LINE");
  assert.ok(sourceLine?.type === "LINE");
  assert.equal(sourceLine.linetypeScale, 3, "DXF group 48 remains the entity's saved scale");

  const { AcDbDxfFiler, acdbCreateDxfPairReader } = await import("@mlightcad/data-model");
  const pairReader = acdbCreateDxfPairReader(new Uint8Array(Buffer.from(withEntityScale)));
  const binaryFiler = new AcDbDxfFiler({ outputFormat: "binary" });
  for (let pair = pairReader.next(); pair; pair = pairReader.next()) binaryFiler.writeGroup(pair.code, pair.value);
  const binaryDecoded = await parseDxfToCanonical(binaryFiler.toBinary());
  assert.deepEqual(binaryDecoded.linetypeScaleSettings, decoded.linetypeScaleSettings,
    "binary DXF retains the same global/entity defaults and boolean scale modes");
  assert.equal(binaryDecoded.modelSpaceEntities.find((entity) => entity.type === "LINE")?.linetypeScale, 3,
    "binary DXF retains the explicit group-48 entity scale");
  const autocadScaleListDxf = fs.readFileSync(path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/f06-autocad-xclip.dxf"));
  const autocadScaleList = await parseDxfToCanonical(autocadScaleListDxf);
  assert.equal(autocadScaleList.linetypeScaleSettings?.modelTabAnnotationScaleFactor, 1,
    "the real AutoCAD DXF's CANNOSCALE dictionary and 1:1 SCALE record reach canonical settings");

  const parsedAnnotationFactors = new Map<string, number>();
  for (const profile of annotationScaleProfiles) {
    const annotationScaleObjects = makeAnnotationScaleObjects(profile.name, profile.paperUnits, profile.drawingUnits, [
      { name: `inactive-${profile.name}`, paperUnits: 7, drawingUnits: 1 },
    ]);
    const annotationProfile = await parseDxfLinetypeScaleHeader(Buffer.from(annotationScaleObjects));
    assert.equal(annotationProfile.modelTabAnnotationScaleFactor, profile.factor,
      `ASCII DXF resolves active CANNOSCALE ${profile.name} instead of an inactive scale-list entry`);
    parsedAnnotationFactors.set(profile.name, annotationProfile.modelTabAnnotationScaleFactor!);
    const objectPairReader = acdbCreateDxfPairReader(new Uint8Array(Buffer.from(annotationScaleObjects)));
    const objectBinaryFiler = new AcDbDxfFiler({ outputFormat: "binary" });
    for (let pair = objectPairReader.next(); pair; pair = objectPairReader.next()) {
      objectBinaryFiler.writeGroup(pair.code, pair.value);
    }
    const binaryAnnotationProfile = await parseDxfLinetypeScaleHeader(objectBinaryFiler.toBinary());
    assert.equal(binaryAnnotationProfile.modelTabAnnotationScaleFactor, profile.factor,
      `binary DXF resolves active CANNOSCALE ${profile.name} instead of an inactive scale-list entry`);
  }
  const invalidAnnotationProfile = await parseDxfLinetypeScaleHeader(Buffer.from(
    makeAnnotationScaleObjects("invalid-zero-paper", 0, 50),
  ));
  assert.equal(invalidAnnotationProfile.modelTabAnnotationScaleFactor, undefined,
    "a SCALE record with zero paper units is not treated as a resolved annotation factor");
  const ambiguousAnnotationProfile = await parseDxfLinetypeScaleHeader(Buffer.from(
    makeAnnotationScaleObjects("ambiguous-scale", 1, 10, [
      { name: "ambiguous-scale", paperUnits: 1, drawingUnits: 20 },
    ]),
  ));
  assert.equal(ambiguousAnnotationProfile.modelTabAnnotationScaleFactor, undefined,
    "duplicate named SCALE records do not make the active annotation factor guessable");

  const directLine: CadLineEntity = {
    type: "LINE", handle: "SCALE_DIRECT", layer: "0", order: BigInt(1),
    start: [0, 0], end: [600, 0], linetype: "R07_SCALE", linetypeScale: 3,
  };
  const directDoc = baseDocument(directLine, 2);
  const dash = directDashStyle(compileCanonicalToScene(directDoc, { sceneId: "r07_scale_direct" }));
  assert.equal(dash.dashSize, 60, "direct dash size is pattern × entity scale × global LTSCALE");
  assert.equal(dash.gapSize, 60);

  const modelScaleDoc = baseDocument(directLine, 2);
  modelScaleDoc.linetypeScaleSettings = {
    globalScale: 2,
    modelTabAnnotationScaling: true,
    modelTabAnnotationScaleFactor: 1 / 50,
  };
  const modelScaleScene = compileCanonicalToScene(modelScaleDoc, { sceneId: "r07_msltscale_direct" });
  const modelScaleDash = directDashStyle(modelScaleScene);
  assert.ok(Math.abs(modelScaleDash.dashSize - 1.2) < 1e-12,
    "MSLTSCALE applies the active annotation factor only to model-tab linetypes");
  assert.equal(modelScaleScene.manifest.qualityStatus, "exact",
    "a resolved active annotation factor does not degrade model-tab linetype output");

  for (const profile of annotationScaleProfiles) {
    const resolvedFactor = parsedAnnotationFactors.get(profile.name);
    assert.notEqual(resolvedFactor, undefined, `parser supplied the ${profile.name} factor to the compiler profile`);
    const matrixDoc = baseDocument(directLine, 2);
    matrixDoc.linetypeScaleSettings = {
      globalScale: 2,
      modelTabAnnotationScaling: true,
      modelTabAnnotationScaleFactor: resolvedFactor,
    };
    const matrixScene = compileCanonicalToScene(matrixDoc, { sceneId: `r07_msltscale_${profile.name.replace(":", "_")}` });
    const matrixDash = directDashStyle(matrixScene);
    assert.equal(matrixDash.dashSize, 60 * profile.factor,
      `Model dash length follows the active ${profile.name} annotation factor`);
    assert.equal(matrixDash.gapSize, 60 * profile.factor,
      `Model gap length follows the active ${profile.name} annotation factor`);
    assert.equal(matrixScene.manifest.qualityStatus, "exact",
      `resolved ${profile.name} scale remains an exact Model profile`);
  }

  const viewProfileDoc = baseDocument(directLine, 2);
  viewProfileDoc.linetypeScaleSettings = {
    globalScale: 2,
    modelTabAnnotationScaling: true,
    modelTabAnnotationScaleFactor: 1 / 50,
  };
  viewProfileDoc.modelSpaceEntities.push({
    type: "ARC", handle: "VIEW_REFINEMENT_ARC", layer: "0", order: BigInt(2),
    center: [800, 0], radius: 200, startAngleRad: 0, endAngleRad: Math.PI,
    linetype: "CONTINUOUS",
  });
  const fineViewScene = compileCanonicalToScene(viewProfileDoc, {
    sceneId: "r07_msltscale_view_fine", targetCurveErrorCssPixels: 0.25,
    unitsPerCssPixel: 0.01, maxTransformSingularValue: 1,
  });
  const coarseViewScene = compileCanonicalToScene(viewProfileDoc, {
    sceneId: "r07_msltscale_view_coarse", targetCurveErrorCssPixels: 0.25,
    unitsPerCssPixel: 1, maxTransformSingularValue: 1,
  });
  assert.deepEqual(directDashStyle(fineViewScene), directDashStyle(coarseViewScene),
    "active-view scale/refinement inputs change curve tessellation but do not become MSLTSCALE factors");
  assert.notEqual(sceneXyVertexCount(fineViewScene), sceneXyVertexCount(coarseViewScene),
    "the paired active-view profiles exercise different curve tessellation budgets");

  const unresolvedModelScaleDoc = baseDocument(directLine, 1);
  unresolvedModelScaleDoc.linetypeScaleSettings = {
    globalScale: 1,
    modelTabAnnotationScaling: true,
    ...(invalidAnnotationProfile.modelTabAnnotationScaleFactor !== undefined
      ? { modelTabAnnotationScaleFactor: invalidAnnotationProfile.modelTabAnnotationScaleFactor }
      : {}),
  };
  const unresolvedModelScale = compileCanonicalToScene(unresolvedModelScaleDoc, { sceneId: "r07_msltscale_unresolved" });
  assert.equal(unresolvedModelScale.manifest.qualityStatus, "degraded",
    "MSLTSCALE without a resolved current annotation factor cannot be reported exact");
  assert.ok(unresolvedModelScale.manifest.diagnosticsSummary.diagnosticCodes.includes("MODEL_ANNOTATION_SCALE_UNRESOLVED"));

  const blockLine: CadLineEntity = {
    type: "LINE", handle: "SCALE_BLOCK_LINE", layer: "0", order: BigInt(2),
    start: [0, 0], end: [600, 0], linetype: "R07_SCALE", linetypeScale: 3,
  };
  const insert: CadEntity = {
    type: "INSERT", handle: "SCALE_INSERT", layer: "0", order: BigInt(1), blockName: "SCALE_BLOCK",
    insertionPoint: [0, 0], scale: [1, 1, 1], rotationRad: 0, linetype: "CONTINUOUS",
  };
  const blocks: CadCanonicalDocument["blocks"] = {
    SCALE_BLOCK: { name: "SCALE_BLOCK", basePoint: [0, 0], entities: [blockLine] },
  };
  const nestedAtOne = compileCanonicalToScene(baseDocument(insert, 1, blocks), { sceneId: "r07_scale_nested_1" });
  const nestedAtTwo = compileCanonicalToScene(baseDocument(insert, 2, blocks), { sceneId: "r07_scale_nested_2" });
  assert.equal(sceneXyVertexCount(nestedAtOne), 20, "nested visitor uses entity scale with default global scale");
  assert.equal(sceneXyVertexCount(nestedAtTwo), 10, "nested visitor applies document LTSCALE to source dash spacing");
  const nestedModelScaleDoc = baseDocument(insert, 1, blocks);
  nestedModelScaleDoc.linetypeScaleSettings = {
    globalScale: 1,
    modelTabAnnotationScaling: true,
    modelTabAnnotationScaleFactor: 0.5,
  };
  assert.equal(sceneXyVertexCount(compileCanonicalToScene(nestedModelScaleDoc, { sceneId: "r07_msltscale_nested" })), 40,
    "MSLTSCALE's resolved model annotation factor reaches nested INSERT strokes");

  const paperSource: CadLineEntity = {
    type: "LINE", handle: "SCALE_VIEWPORT_LINE", layer: "0", order: BigInt(1),
    start: [0, 0], end: [600, 0], linetype: "R07_SCALE", linetypeScale: 1,
  };
  const makePaperDoc = (psltscale: boolean) => {
    const doc = baseDocument(paperSource, 1);
    doc.linetypeScaleSettings = {
      globalScale: 1,
      paperSpaceViewportScaling: psltscale,
      modelTabAnnotationScaling: true,
      modelTabAnnotationScaleFactor: 1 / 50,
    };
    doc.layouts = { SHEET: { id: "SHEET", name: "SHEET", isModelSpace: false, bbox: [-30, -10, 30, 10] } };
    doc.viewports = { VP1: { id: "VP1", layoutId: "SHEET", center: [0, 0], width: 60, height: 20,
      viewCenter: [0, 0], viewHeight: 200, frozenLayers: [] } };
    doc.paperSpaceEntities = { SHEET: [] };
    return doc;
  };
  const paperModeOn = sceneSegments(compileCanonicalToScene(makePaperDoc(true), {
    sceneId: "r07_psltscale_on", layoutId: "SHEET",
  }));
  const paperModeOff = sceneSegments(compileCanonicalToScene(makePaperDoc(false), {
    sceneId: "r07_psltscale_off", layoutId: "SHEET",
  }));
  assert.equal(paperModeOn.length, 2, "PSLTSCALE=1 keeps the projected dash at one paper-space period in a 1:10 viewport");
  assert.ok(Math.abs(Math.hypot(paperModeOn[0]!.x1 - paperModeOn[0]!.x0, paperModeOn[0]!.y1 - paperModeOn[0]!.y0) - 10) < 1e-4,
    "PSLTSCALE=1 dash length is ten paper units after a 1:10 viewport projection");
  assert.equal(paperModeOff.length, 15, "PSLTSCALE=0 retains model-unit dash frequency through the 1:10 viewport");
  assert.ok(paperModeOff.every((segment) => Math.abs(Math.hypot(segment.x1 - segment.x0, segment.y1 - segment.y0) - 1) < 1e-4),
    "PSLTSCALE=0 dash length follows model-to-paper viewport scale");

  console.log("R07-G LTSCALE decode/direct/nested scale profile PASS");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => process.exit(process.exitCode ?? 0));
