import assert from "node:assert/strict";
import type { CadCanonicalDocument, CadEntity, CadPoint2D } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { parseSceneChunk, SceneTag, validateSceneManifest } from "../../src/lib/cad-v2/protocol/binary-protocol";
import { FontLayoutEngine } from "../../src/lib/cad-v2/text/font-layout-engine";

const X = 1_000_000_000;
const Y = -1_000_000_000;

function documentWith(entities: CadEntity[]): CadCanonicalDocument {
  return {
    sourceVersionKey: "r06-chunk-composite", sourceSha256: "r06-chunk-composite",
    acadVersion: "AC1032", codepage: "UTF-8", units: 4, measurement: 1,
    layers: { "0": { id: "0", name: "0", visible: true, frozen: false, locked: false,
      color: { method: "aci", aci: 7 }, lineweightMm: 0, linetypeName: "CONTINUOUS" } },
    linetypes: {}, textStyles: {}, blocks: {}, layouts: {}, viewports: {},
    paperSpaceEntities: {}, diagnostics: [], modelSpaceEntities: entities,
  };
}

function staticBound(chunk: ReturnType<typeof compileCanonicalToScene>["manifest"]["chunks"][number]): number {
  return Math.max(chunk.maxQuantizationErrorWorld, chunk.maxHatchFillEncodedGeometryErrorWorld,
    chunk.maxCurveEncodedGeometryErrorWorld);
}

function overlaps(a: [number, number, number, number], b: [number, number, number, number]): boolean {
  return a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];
}

function assertPairOracle(scene: ReturnType<typeof compileCanonicalToScene>): number {
  const chunks = scene.manifest.chunks;
  const expected = chunks.map(() => 0);
  for (let index = 1; index < chunks.length; index++) {
    const a = chunks[index - 1]!;
    const b = chunks[index]!;
    if (a.layoutId !== b.layoutId || !overlaps(a.bbox, b.bbox)) continue;
    const bound = staticBound(a) + staticBound(b);
    expected[index - 1] = Math.max(expected[index - 1]!, bound);
    expected[index] = Math.max(expected[index]!, bound);
  }
  for (let index = 0; index < chunks.length; index++) {
    const actual = chunks[index]!.maxAdjacentChunkCompositeErrorWorld;
    assert.ok(Math.abs(actual - expected[index]!) < 1e-12,
      `chunk ${index} uses the sum of overlapping painter-neighbor geometry bounds`);
  }
  return Math.max(...expected);
}

// Four touching rectangles force one HATCH source across multiple spatial chunks.
// Every triangle vertex is an independently known rectangle corner.
const rectangles = Array.from({ length: 4 }, (_, index) => {
  const left = X + index * 2000 + 0.03125;
  const right = X + (index + 1) * 2000 + 0.03125;
  const bottom = Y + 0.013;
  const top = Y + 20.017;
  return { left, right, bottom, top };
});
const corners: CadPoint2D[] = rectangles.flatMap(({ left, right, bottom, top }) => [
  [left, bottom], [right, bottom], [right, top], [left, top],
]);
const hatch: CadEntity = { handle: "R06_TOUCHING_FILL", type: "HATCH", layer: "0", order: BigInt(1),
  patternName: "SOLID", isSolid: true,
  loops: rectangles.map(({ left, right, bottom, top }) => ({ isPolyline: true,
    vertices: [[left, bottom], [right, bottom], [right, top], [left, top]] as CadPoint2D[] })) };
const fillSource = documentWith([hatch]);
const fillScene = compileCanonicalToScene(fillSource, { sceneId: "r06_fill_reference" });
const fillChunks = fillScene.manifest.chunks.filter((chunk) => chunk.maxHatchFillTriangleQuantizationErrorWorld > 0);
assert.ok(fillChunks.length >= 2, "one HATCH source crosses at least two fill chunks");
for (const chunk of fillChunks) {
  const parsed = parseSceneChunk(fillScene.chunks.get(chunk.chunkId)!);
  const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  const triangles = parsed.sections.get(SceneTag.TRIANGLES)!.data as Float32Array;
  let measured = 0;
  for (let vertex = 0; vertex < triangles.length; vertex += 2) {
    const decodedX = origin[0]! + triangles[vertex]!;
    const decodedY = origin[1]! + triangles[vertex + 1]!;
    measured = Math.max(measured, Math.min(...corners.map(([x, y]) => Math.hypot(x - decodedX, y - decodedY))));
  }
  assert.ok(Math.abs(measured - chunk.maxHatchFillTriangleQuantizationErrorWorld) < 1e-12,
    "HATCH triangle quantization matches independent rectangle-corner round trips");
}
const fillPair = assertPairOracle(fillScene);
assert.ok(fillPair > Math.max(...fillChunks.map(staticBound)),
  "touching fill chunks expose a joint bound larger than either individual chunk bound");

// A tall glyph has sliced lines with neighboring chunk bboxes that touch.
const glyph: CadEntity = { handle: "R06_TALL_GLYPH", type: "TEXT", layer: "0", order: BigInt(1),
  text: "I", insertionPoint: [X + 0.017, Y + 0.013], height: 12_000,
  rotationRad: 0.37, widthFactor: 1.15, obliqueRad: 0.12, styleName: "STANDARD" };
const glyphScene = compileCanonicalToScene(documentWith([glyph]), { sceneId: "r06_glyph_reference" });
assert.ok(glyphScene.manifest.chunks.length >= 2, "tall glyph crosses multiple spatial chunks");
const glyphPair = assertPairOracle(glyphScene);
assert.ok(glyphPair > 0, "glyph chunk seam has a measured Float32 composite bound");

const mixedScene = compileCanonicalToScene(documentWith([
  { handle: "R06_WIDE_FILL", type: "LWPOLYLINE", layer: "0", order: BigInt(1),
    isClosed: false, constantWidth: 20,
    vertices: Array.from({ length: 7 }, (_, index) => ({ x: X + index * 2000 + 0.017, y: Y + 0.013 })) },
  { ...glyph, handle: "R06_FILL_OVERLAY_GLYPH", order: BigInt(2),
    insertionPoint: [X + 11_800.017, Y + 0.013], height: 12 },
]), { sceneId: "r06_fill_glyph_overlay" });
const mixedPair = assertPairOracle(mixedScene);
const mixedKinds = mixedScene.manifest.chunks.map((chunk) => {
  const sections = parseSceneChunk(mixedScene.chunks.get(chunk.chunkId)!).sections;
  return { hasFill: ((sections.get(SceneTag.TRIANGLES)?.data as Float32Array | undefined)?.length ?? 0) > 0,
    hasStroke: ((sections.get(SceneTag.XY)?.data as Float32Array | undefined)?.length ?? 0) > 0 };
});
assert.ok(mixedScene.manifest.chunks.some((chunk, index) => index > 0 &&
  mixedKinds[index - 1]!.hasFill && mixedKinds[index]!.hasStroke &&
  overlaps(mixedScene.manifest.chunks[index - 1]!.bbox, chunk.bbox) &&
  chunk.maxAdjacentChunkCompositeErrorWorld > 0),
"a later glyph over a wide fill carries the two-chunk composite across their painter boundary");

const nearFillCorners: CadPoint2D[] = [
  [X + 0.011, Y + 0.013], [X + 2000.019, Y + 0.013],
  [X + 2000.019, Y + 20.017], [X + 0.011, Y + 20.017],
];
const nearFill: CadEntity = { handle: "R06_NEAR_FILL", type: "HATCH", layer: "0", order: BigInt(1),
  patternName: "SOLID", isSolid: true,
  loops: [{ isPolyline: true, vertices: nearFillCorners }] };
const nearGlyph: CadEntity = { ...glyph, handle: "R06_NEAR_GLYPH", order: BigInt(2),
  text: "I", insertionPoint: [X + 1000.017, Y + 0.013], height: 15 };
const sameChunkSource = documentWith([nearFill, nearGlyph]);
const sameChunk = compileCanonicalToScene(sameChunkSource, { sceneId: "r06_same_chunk_reference" });
assert.equal(sameChunk.manifest.chunks.length, 1, "near fill and glyph share one sequence chunk");
const sameRef = sameChunk.manifest.chunks[0]!;
const sameRaw = parseSceneChunk(sameChunk.chunks.get(sameRef.chunkId)!);
const sameOrigin = sameRaw.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
const sameTriangles = sameRaw.sections.get(SceneTag.TRIANGLES)!.data as Float32Array;
let fillLoss = 0;
for (let offset = 0; offset < sameTriangles.length; offset += 2) {
  const x = sameOrigin[0]! + sameTriangles[offset]!;
  const y = sameOrigin[1]! + sameTriangles[offset + 1]!;
  fillLoss = Math.max(fillLoss, Math.min(...nearFillCorners.map(([cx, cy]) => Math.hypot(cx - x, cy - y))));
}
const glyphSegments = FontLayoutEngine.layoutText(nearGlyph as Extract<CadEntity, { type: "TEXT" }>);
const sameXy = sameRaw.sections.get(SceneTag.XY)!.data as Float32Array;
const glyphOffset = sameXy.length - glyphSegments.length * 4;
assert.ok(glyphOffset >= 0 && glyphSegments.length > 0);
let glyphLoss = 0;
for (let index = 0; index < glyphSegments.length; index++) {
  const segment = glyphSegments[index]!;
  for (const [endpoint, sx, sy] of [[0, segment.x0, segment.y0], [1, segment.x1, segment.y1]]) {
    const offset = glyphOffset + index * 4 + endpoint * 2;
    glyphLoss = Math.max(glyphLoss, Math.hypot(sx - (sameOrigin[0]! + sameXy[offset]!),
      sy - (sameOrigin[1]! + sameXy[offset + 1]!)));
  }
}
assert.ok(fillLoss > 0 && glyphLoss > 0 &&
  Math.abs(sameRef.maxFillGlyphCompositeErrorWorld - fillLoss - glyphLoss) < 1e-12,
  "same-chunk fill/glyph bound equals independent fill corner and glyph endpoint losses");
const sameThresholdWorld = (Math.max(fillLoss, glyphLoss) + fillLoss + glyphLoss) / 2;
const sameScreened = compileCanonicalToScene(sameChunkSource, {
  sceneId: "r06_same_chunk_screened", targetCurveErrorCssPixels: 0.25,
  unitsPerCssPixel: sameThresholdWorld / 0.25, maxTransformSingularValue: 1,
});
assert.ok(sameScreened.manifest.chunks[0]!.maxQuantizationErrorCssPixels! < 0.25 &&
  sameScreened.manifest.chunks[0]!.maxFillGlyphCompositeErrorCssPixels! > 0.25,
  "individual fill/glyph losses fit but their same-chunk sum crosses the screen budget");
assert.ok(sameScreened.manifest.diagnosticsSummary.diagnosticCodes.includes("CHUNK_COMPOSITE_PRECISION_LIMIT_REACHED") &&
  sameScreened.manifest.qualityStatus === "degraded");
assert.equal(validateSceneManifest(sameScreened.manifest).chunks[0]!.maxFillGlyphCompositeErrorWorld,
  sameScreened.manifest.chunks[0]!.maxFillGlyphCompositeErrorWorld);
const badFillGlyph = structuredClone(sameScreened.manifest);
badFillGlyph.chunks[0]!.maxFillGlyphCompositeErrorWorld = -1;
assert.throws(() => validateSceneManifest(badFillGlyph), /maxFillGlyphCompositeErrorWorld/);
const conflictingFillGlyph = JSON.parse(JSON.stringify(sameScreened.manifest)) as typeof sameScreened.manifest;
conflictingFillGlyph.indexPages[0]!.chunks[0]!.maxFillGlyphCompositeErrorWorld += 1;
assert.throws(() => validateSceneManifest(conflictingFillGlyph), /maxFillGlyphCompositeErrorWorld/);

const distantGlyph: CadEntity = { ...nearGlyph, handle: "R06_DISTANT_GLYPH",
  insertionPoint: [X + 10_000.017, Y + 0.013] };
const distantScene = compileCanonicalToScene(documentWith([nearFill, distantGlyph]), {
  sceneId: "r06_disjoint_same_chunk",
});
assert.equal(distantScene.manifest.chunks[0]!.maxFillGlyphCompositeErrorWorld, 0,
  "disjoint fill and glyph bounds do not acquire a same-chunk interaction term");

// Each separate chunk fits, but the sum at a common fill boundary does not.
const singleMax = Math.max(...fillScene.manifest.chunks.map(staticBound));
const thresholdWorld = (singleMax + fillPair) / 2;
const screened = compileCanonicalToScene(fillSource, {
  sceneId: "r06_fill_screened", targetCurveErrorCssPixels: 0.25,
  unitsPerCssPixel: thresholdWorld / 0.25, maxTransformSingularValue: 1,
});
assert.ok(screened.manifest.chunks.every((chunk) => chunk.maxQuantizationErrorCssPixels! < 0.25),
  "individual fill chunk encoding errors fit the active screen target");
assert.ok(screened.manifest.chunks.some((chunk) => chunk.maxAdjacentChunkCompositeErrorCssPixels! > 0.25),
  "joint fill boundary displacement exceeds that target");
assert.equal(screened.manifest.qualityStatus, "degraded");
assert.ok(screened.manifest.diagnosticsSummary.diagnosticCodes.includes("CHUNK_COMPOSITE_PRECISION_LIMIT_REACHED"));
assertPairOracle(screened);

const validated = validateSceneManifest(screened.manifest);
const indexed = JSON.parse(screened.indexFiles!.get(screened.manifest.indexPages[0]!.indexId)!) as {
  chunks: Array<{ maxAdjacentChunkCompositeErrorWorld: number; maxAdjacentChunkCompositeErrorCssPixels: number }>;
};
for (let index = 0; index < screened.manifest.chunks.length; index++) {
  const source = screened.manifest.chunks[index]!;
  assert.equal(validated.chunks[index]!.maxAdjacentChunkCompositeErrorWorld, source.maxAdjacentChunkCompositeErrorWorld);
  assert.equal(indexed.chunks[index]!.maxAdjacentChunkCompositeErrorCssPixels,
    source.maxAdjacentChunkCompositeErrorCssPixels);
}
const malformed = structuredClone(screened.manifest);
malformed.chunks[0]!.maxAdjacentChunkCompositeErrorWorld = -1;
assert.throws(() => validateSceneManifest(malformed), /maxAdjacentChunkCompositeErrorWorld/,
  "manifest rejects a negative cross-chunk precision bound");
const mismatched = JSON.parse(JSON.stringify(screened.manifest)) as typeof screened.manifest;
mismatched.chunks[0]!.maxAdjacentChunkCompositeErrorWorld += 1;
assert.throws(() => validateSceneManifest(mismatched), /maxAdjacentChunkCompositeErrorWorld/,
  "flat and indexed cross-chunk precision bounds must agree");

const nonAdjacentFill: CadEntity = { handle: "R06_NON_ADJACENT_FILL", type: "LWPOLYLINE", layer: "0", order: BigInt(1),
  isClosed: false, constantWidth: 40,
  vertices: [{ x: X + 0.011, y: Y + 0.013 }, { x: X + 100, y: Y + 0.013 }] };
const interveningGlyph: CadEntity = { ...glyph, handle: "R06_INTERVENING_GLYPH", order: BigInt(2),
  insertionPoint: [X + 10_000.017, Y + 0.013], height: 24_000, rotationRad: 0 };
const nonAdjacentOverlay: CadEntity = { ...glyph, handle: "R06_NON_ADJACENT_OVERLAY", order: BigInt(3),
  insertionPoint: [X + 0.017, Y + 0.013], height: 100, rotationRad: 0 };
const nonAdjacentSource = documentWith([nonAdjacentFill, interveningGlyph, nonAdjacentOverlay]);
const nonAdjacentScene = compileCanonicalToScene(nonAdjacentSource, { sceneId: "r06_non_adjacent_fill_glyph" });
const nonAdjacentParts = nonAdjacentScene.manifest.chunks.map((chunk, index) => {
  const sections = parseSceneChunk(nonAdjacentScene.chunks.get(chunk.chunkId)!).sections;
  return { chunk, index,
    hasFill: ((sections.get(SceneTag.TRIANGLES)?.data as Float32Array | undefined)?.length ?? 0) > 0,
    hasStroke: ((sections.get(SceneTag.XY)?.data as Float32Array | undefined)?.length ?? 0) > 0 };
});
const nonAdjacentPair = nonAdjacentParts.flatMap((fillPart) => nonAdjacentParts
  .filter((glyphPart) => fillPart.hasFill && glyphPart.hasStroke &&
    glyphPart.index > fillPart.index + 1 && overlaps(fillPart.chunk.bbox, glyphPart.chunk.bbox))
  .map((glyphPart) => ({ fillPart, glyphPart })))[0];
assert.ok(nonAdjacentPair,
  `fixture must put an overlapping fill/glyph pair on non-adjacent chunks: ${JSON.stringify(nonAdjacentParts.map(({ chunk, index, hasFill, hasStroke }) => ({ index, hasFill, hasStroke, bbox: chunk.bbox })))}`);
assert.ok(nonAdjacentPair.fillPart.chunk.maxFillGlyphCompositeErrorWorld > 0 &&
  nonAdjacentPair.glyphPart.chunk.maxFillGlyphCompositeErrorWorld > 0,
  "non-adjacent overlapping fill/glyph chunks both carry the conservative cross-chunk composite bound");
const nonAdjacentComposite = nonAdjacentPair.fillPart.chunk.maxFillGlyphCompositeErrorWorld;
const nonAdjacentIndividual = Math.max(nonAdjacentPair.fillPart.chunk.maxQuantizationErrorWorld,
  nonAdjacentPair.glyphPart.chunk.maxQuantizationErrorWorld);
assert.ok(nonAdjacentComposite > nonAdjacentIndividual,
  "cross-chunk fill/glyph composite adds independent encoded geometry losses");
const nonAdjacentThresholdWorld = (nonAdjacentComposite + nonAdjacentIndividual) / 2;
const nonAdjacentScreened = compileCanonicalToScene(nonAdjacentSource, {
  sceneId: "r06_non_adjacent_fill_glyph_screened", targetCurveErrorCssPixels: 0.25,
  unitsPerCssPixel: nonAdjacentThresholdWorld / 0.25, maxTransformSingularValue: 1,
});
const screenedPair = nonAdjacentScreened.manifest.chunks.find((chunk) =>
  chunk.maxFillGlyphCompositeErrorWorld === nonAdjacentComposite);
assert.ok(screenedPair && screenedPair.maxQuantizationErrorCssPixels! < 0.25 &&
  screenedPair.maxFillGlyphCompositeErrorCssPixels! > 0.25,
  "individual chunk errors fit the view target while a non-adjacent fill/glyph pair exceeds it");
assert.equal(nonAdjacentScreened.manifest.qualityStatus, "degraded");
assert.ok(nonAdjacentScreened.manifest.diagnosticsSummary.diagnosticCodes.includes("CHUNK_COMPOSITE_PRECISION_LIMIT_REACHED"));
const nonAdjacentValidated = validateSceneManifest(nonAdjacentScreened.manifest);
const nonAdjacentIndex = JSON.parse(nonAdjacentScreened.indexFiles!.get(nonAdjacentScreened.manifest.indexPages[0]!.indexId)!) as {
  chunks: Array<{ maxFillGlyphCompositeErrorWorld: number; maxFillGlyphCompositeErrorCssPixels: number }>;
};
for (let index = 0; index < nonAdjacentScreened.manifest.chunks.length; index++) {
  const source = nonAdjacentScreened.manifest.chunks[index]!;
  assert.equal(nonAdjacentValidated.chunks[index]!.maxFillGlyphCompositeErrorWorld, source.maxFillGlyphCompositeErrorWorld,
    "validated manifest retains the non-adjacent fill/glyph composite bound");
  assert.equal(nonAdjacentIndex.chunks[index]!.maxFillGlyphCompositeErrorWorld, source.maxFillGlyphCompositeErrorWorld,
    "hash-index page retains the non-adjacent fill/glyph composite bound");
  assert.equal(nonAdjacentIndex.chunks[index]!.maxFillGlyphCompositeErrorCssPixels, source.maxFillGlyphCompositeErrorCssPixels,
    "hash-index page retains the screen-space non-adjacent composite bound");
}

const pairCapSource = documentWith([
  ...Array.from({ length: 130 }, (_, index) => ({ ...nonAdjacentFill,
    handle: `R06_PAIR_CAP_FILL_${index}`, order: BigInt(index + 1) })),
  ...Array.from({ length: 130 }, (_, index) => ({ ...nonAdjacentOverlay,
    handle: `R06_PAIR_CAP_GLYPH_${index}`, order: BigInt(131 + index) })),
]);
const pairCapScene = compileCanonicalToScene(pairCapSource, {
  sceneId: "r06_fill_glyph_pair_analysis_cap", maxPrimitivesPerChunk: 1,
});
assert.equal(pairCapScene.manifest.qualityStatus, "degraded",
  "capped fill/glyph pair analysis marks its conservative fallback as degraded");
assert.ok(pairCapScene.manifest.diagnosticsSummary.diagnosticCodes.includes("FILL_GLYPH_COMPOSITE_ANALYSIS_LIMIT_REACHED"),
  "pair-analysis cap emits an explicit diagnostic");
assert.ok(pairCapScene.manifest.chunks.some((chunk) => chunk.maxFillGlyphCompositeErrorWorld > 0),
  "pair-analysis cap retains a conservative fill/glyph composite bound");

console.log(`PASS: R06 fill/glyph same-, adjacent- and non-adjacent-chunk composite; fill=${fillPair}, glyph=${glyphPair}, mixed=${mixedPair}, local=${fillLoss + glyphLoss}`);
