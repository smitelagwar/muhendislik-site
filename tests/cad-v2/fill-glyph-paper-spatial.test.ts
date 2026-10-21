import type { CadCanonicalDocument, CadEntity } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { parseSceneChunk, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

const X = 1_000_000_000;
const Y = -1_000_000_000;

function documentWith(entities: CadEntity[]): CadCanonicalDocument {
  return {
    sourceVersionKey: "r05-fill-glyph-paper", sourceSha256: "r05-fill-glyph-paper",
    acadVersion: "AC1032", codepage: "UTF-8", units: 4, measurement: 1,
    layers: { "0": { id: "0", name: "0", visible: true, frozen: false, locked: false,
      color: { method: "aci", aci: 7 }, lineweightMm: 0, linetypeName: "CONTINUOUS" } },
    linetypes: {}, textStyles: {}, blocks: {}, layouts: {}, viewports: {},
    paperSpaceEntities: {}, diagnostics: [], modelSpaceEntities: entities,
  };
}

function chunksOf(scene: ReturnType<typeof compileCanonicalToScene>) {
  return scene.manifest.chunks.map((entry) => {
    const raw = parseSceneChunk(scene.chunks.get(entry.chunkId)!);
    const origin = raw.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
    const xy = raw.sections.get(SceneTag.XY)?.data as Float32Array | undefined;
    const triangles = raw.sections.get(SceneTag.TRIANGLES)?.data as Float32Array | undefined;
    const meta = JSON.parse(new TextDecoder().decode(raw.sections.get(SceneTag.META)!.data as Uint8Array)) as {
      drawCommands: Array<{ kind: string; globalOrderIndex?: number }>;
    };
    return { entry, origin, xy, triangles, meta };
  });
}

function triangleArea(chunks: ReturnType<typeof chunksOf>): number {
  let area = 0;
  for (const chunk of chunks) {
    const values = chunk.triangles ?? [];
    for (let offset = 0; offset < values.length; offset += 6) {
      const x0 = values[offset]!, y0 = values[offset + 1]!;
      const x1 = values[offset + 2]!, y1 = values[offset + 3]!;
      const x2 = values[offset + 4]!, y2 = values[offset + 5]!;
      area += Math.abs((x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0)) / 2;
    }
  }
  return area;
}

function spatialBounded(chunks: ReturnType<typeof chunksOf>): boolean {
  return chunks.every(({ entry }) => Math.max(entry.bbox[2] - entry.bbox[0], entry.bbox[3] - entry.bbox[1]) <= 4096.00001);
}

{
  const polyline: CadEntity = { handle: "WIDE_STRIP", type: "LWPOLYLINE", layer: "0",
    order: BigInt(1), isClosed: false, constantWidth: 20,
    vertices: Array.from({ length: 7 }, (_, index) => ({ x: X + index * 2000, y: Y })) };
  const scene = compileCanonicalToScene(documentWith([polyline]), { sceneId: "r05_wide_strip" });
  const chunks = chunksOf(scene);
  assert(chunks.length >= 3 && spatialBounded(chunks),
    "12,000-unit wide polyline centerline and fill mesh use bounded spatial chunks");
  assert(Math.abs(triangleArea(chunks) - 240_000) < 0.01,
    "partitioned width mesh preserves the independently expected 12,000 × 20 fill area");
  assert(chunks.flatMap(({ triangles }) => Array.from(triangles ?? [])).length === 72,
    "six source quads preserve exactly twelve triangles through binary chunks");
  assert(!scene.manifest.diagnosticsSummary.diagnosticCodes.includes("FILL_SPATIAL_PARTITION_LIMIT_REACHED"),
    "bounded width mesh does not report a fill partition limit");
}

{
  const hatch: CadEntity = { handle: "HATCH_ISLANDS", type: "HATCH", layer: "0", order: BigInt(1),
    patternName: "SOLID", isSolid: true,
    loops: [0, 4000, 8000, 12_000].map((offset) => ({ isPolyline: true,
      vertices: [[X + offset, Y], [X + offset + 100, Y],
        [X + offset + 100, Y + 100], [X + offset, Y + 100]] as [number, number][] })) };
  const scene = compileCanonicalToScene(documentWith([hatch]), { sceneId: "r05_hatch_islands" });
  const chunks = chunksOf(scene);
  assert(chunks.length >= 4 && spatialBounded(chunks),
    "one HATCH source with four distant islands forms bounded fill and boundary chunks");
  assert(Math.abs(triangleArea(chunks) - 40_000) < 0.01,
    "four spatial HATCH islands preserve their independent 4 × 100 × 100 area");
  assert(!scene.manifest.diagnosticsSummary.diagnosticCodes.includes("FILL_SPATIAL_PARTITION_LIMIT_REACHED"),
    "bounded island triangles avoid the fill partial diagnostic");
}

for (const [type, make] of [
  ["TEXT", () => ({ handle: "LONG_TEXT", type: "TEXT", layer: "0", order: BigInt(1),
    text: "MMMMMMMMMMMM", insertionPoint: [X, Y], height: 1000, rotationRad: 0,
    widthFactor: 1, obliqueRad: 0, styleName: "STANDARD" })],
  ["MTEXT", () => ({ handle: "LONG_MTEXT", type: "MTEXT", layer: "0", order: BigInt(1),
    text: "MMMMMMMMMMMM", insertionPoint: [X, Y], height: 1000, referenceWidth: 50_000,
    rotationRad: 0, attachmentPoint: 1, styleName: "STANDARD" })],
] as const) {
  const entity = make() as CadEntity;
  const scene = compileCanonicalToScene(documentWith([entity]), { sceneId: `r05_${type.toLowerCase()}` });
  const chunks = chunksOf(scene);
  assert(chunks.length > 1 && spatialBounded(chunks), `${type} glyph strokes split into bounded chunks`);
  assert(chunks.every(({ xy, origin }) => xy && xy.length > 0 && origin[0]! > 100_000_000 &&
    Math.max(...Array.from(xy).map(Math.abs)) < 4096),
    `${type} keeps high-origin glyph coordinates local`);
  const order = chunks.flatMap(({ meta }) => meta.drawCommands.map((command) => command.globalOrderIndex!));
  assert(order.every((index, position) => position === 0 || index >= order[position - 1]!),
    `${type} glyph painter order stays monotone across chunks`);
  assert(!scene.manifest.diagnosticsSummary.diagnosticCodes.includes("GLYPH_STROKE_SPATIAL_PARTITION_LIMIT_REACHED"),
    `${type} bounded profile does not claim a glyph limit`);
}

{
  const hugeText: CadEntity = { handle: "GLYPH_CAP", type: "TEXT", layer: "0", order: BigInt(1),
    text: "I", insertionPoint: [0, 0], height: 1_100_000, rotationRad: 0,
    widthFactor: 1, obliqueRad: 0, styleName: "STANDARD" };
  const scene = compileCanonicalToScene(documentWith([hugeText]), { sceneId: "r05_glyph_cap" });
  assert(scene.manifest.qualityStatus === "degraded" &&
    scene.manifest.diagnosticsSummary.diagnosticCodes.includes("GLYPH_STROKE_SPATIAL_PARTITION_LIMIT_REACHED"),
    "oversized single glyph keeps its source geometry with an explicit partial diagnostic");
  assert(chunksOf(scene).some(({ xy }) => xy && xy.length > 0),
    "glyph cap fallback still emits visible source strokes");
}

{
  const hatch: CadEntity = { handle: "LONG_HATCH", type: "HATCH", layer: "0", order: BigInt(1),
    patternName: "SOLID", isSolid: true,
    loops: [{ isPolyline: true, vertices: [[X, Y], [X + 12_000, Y],
      [X + 12_000, Y + 20], [X, Y + 20]] }] };
  const scene = compileCanonicalToScene(documentWith([hatch]), { sceneId: "r05_hatch_cap" });
  const chunks = chunksOf(scene);
  assert(Math.abs(triangleArea(chunks) - 240_000) < 0.01,
    "wide HATCH fallback preserves exact 12,000 × 20 triangle area");
  assert(scene.manifest.qualityStatus === "degraded" &&
    scene.manifest.diagnosticsSummary.diagnosticCodes.includes("FILL_SPATIAL_PARTITION_LIMIT_REACHED"),
    "uncuttable long HATCH triangle retains geometry with an explicit partial diagnostic");
}

{
  const wipeout: CadEntity = { handle: "LONG_WIPEOUT", type: "WIPEOUT", layer: "0", order: BigInt(1),
    vertices: [[X, Y], [X + 12_000, Y], [X + 12_000, Y + 20], [X, Y + 20]] };
  const scene = compileCanonicalToScene(documentWith([wipeout]), { sceneId: "r05_wipeout_cap" });
  const chunks = chunksOf(scene);
  assert(Math.abs(triangleArea(chunks) - 240_000) < 0.01 &&
    chunks.some(({ meta }) => meta.drawCommands.some((command) => command.kind === "wipeout")),
    "wide WIPEOUT fallback preserves fill area and mask draw semantics");
  assert(scene.manifest.diagnosticsSummary.diagnosticCodes.includes("FILL_SPATIAL_PARTITION_LIMIT_REACHED"),
    "uncuttable WIPEOUT triangle reports the fill partial diagnostic");
}

{
  const oscillatingFill: CadEntity = { handle: "FILL_CAP", type: "LWPOLYLINE", layer: "0",
    order: BigInt(1), isClosed: false, constantWidth: 20,
    vertices: Array.from({ length: 300 }, (_, index) => ({ x: index % 2 === 0 ? 0 : 6000, y: index * 0.01 })) };
  const scene = compileCanonicalToScene(documentWith([oscillatingFill]), { sceneId: "r05_fill_cap" });
  assert(scene.manifest.qualityStatus === "degraded" &&
    scene.manifest.diagnosticsSummary.diagnosticCodes.includes("FILL_SPATIAL_PARTITION_LIMIT_REACHED"),
    "repeated fill oscillations trigger the 256-group partial contract");
  assert(triangleArea(chunksOf(scene)) > 0,
    "fill group cap retains all source mesh triangles");
}

{
  const document = documentWith([
    { handle: "ORDER_STRIP", type: "LWPOLYLINE", layer: "0", order: BigInt(1),
      isClosed: false, constantWidth: 20,
      vertices: Array.from({ length: 7 }, (_, index) => ({ x: index * 2000, y: 0 })) },
    { handle: "ORDER_MASK", type: "WIPEOUT", layer: "0", order: BigInt(2),
      vertices: [[100, -10], [200, -10], [200, 10], [100, 10]] },
    { handle: "ORDER_OVERLAY", type: "LINE", layer: "0", order: BigInt(3),
      start: [150, -15], end: [150, 15] },
  ]);
  const commands = chunksOf(compileCanonicalToScene(document, { sceneId: "r05_fill_painter_order" }))
    .flatMap(({ meta }) => meta.drawCommands);
  const maskIndex = commands.findIndex((command) => command.kind === "wipeout");
  assert(maskIndex > 0 && commands.slice(0, maskIndex).some((command) => command.kind === "triangle") &&
    commands.slice(maskIndex + 1).some((command) => command.kind === "line"),
    "spatial fill stays before the WIPEOUT mask and later overlay stroke");
  assert(commands.every((command, index) => index === 0 ||
    command.globalOrderIndex! >= commands[index - 1]!.globalOrderIndex!),
    "fill/mask/overlay source painter indices stay monotone across chunks");
}

{
  const document = documentWith([{ handle: "MODEL", type: "LINE", layer: "0", order: BigInt(1),
    start: [0, 0], end: [10, 0] }]);
  document.layouts = {
    SHEET_A: { id: "SHEET_A", name: "Sheet A", isModelSpace: false, bbox: [0, -100, 15_000, 100] },
    SHEET_B: { id: "SHEET_B", name: "Sheet B", isModelSpace: false, bbox: [-10, -10, 10, 10] },
  };
  document.paperSpaceEntities = {
    SHEET_A: [{ handle: "PAPER_STRIP", type: "LWPOLYLINE", layer: "0", order: BigInt(1),
      isClosed: false, constantWidth: 20,
      vertices: Array.from({ length: 7 }, (_, index) => ({ x: index * 2000, y: 0 })) }],
    SHEET_B: [{ handle: "PAPER_GLYPH", type: "TEXT", layer: "0", order: BigInt(1),
      text: "B", insertionPoint: [0, 0], height: 10, rotationRad: 0,
      widthFactor: 1, obliqueRad: 0, styleName: "STANDARD" }],
  };
  const scene = compileCanonicalToScene(document, { sceneId: "r05_paper_layouts" });
  const chunks = chunksOf(scene);
  assert(scene.manifest.layouts.map((layout) => layout.layoutId).join(",") === "Model,SHEET_A,SHEET_B",
    "model and two paper layouts remain separate in manifest order");
  const paperA = chunks.filter(({ entry }) => entry.layoutId === "SHEET_A");
  assert(paperA.length >= 3 && spatialBounded(paperA),
    "active paper A carries bounded fill chunks instead of one eager layout mesh");
  assert(chunks.some(({ entry }) => entry.layoutId === "SHEET_B") &&
    chunks.every(({ entry }) => scene.chunks.has(entry.chunkId)),
    "paper B and model chunks keep distinct fetch identities");
}

console.log("PASS: R05 fill/glyph/paper spatial source, binary, area, order and partial contract");

{
  const nestedText: CadEntity = { handle: "NESTED_TEXT", type: "TEXT", layer: "0", order: 1n,
    text: "M", insertionPoint: [0, 0], height: 100, rotationRad: 0,
    widthFactor: 1, obliqueRad: 0, styleName: "STANDARD" };
  const inner: CadEntity = { handle: "INNER", type: "INSERT", layer: "0", order: 1n,
    blockName: "TEXT_BLOCK", insertionPoint: [0, 0], scale: [1, 1, 1], rotationRad: 0 };
  const outer: CadEntity = { handle: "OUTER", type: "INSERT", layer: "0", order: 2n,
    blockName: "NESTED_BLOCK", insertionPoint: [X + 0.123456, Y + 0.54321],
    scale: [1, 1, 1], rotationRad: 0 };
  const fill: CadEntity = { handle: "UNDER_TEXT", type: "HATCH", layer: "0", order: 1n,
    patternName: "SOLID", isSolid: true,
    loops: [{ isPolyline: true, vertices: [
      [X, Y], [X + 120, Y], [X + 120, Y + 120], [X, Y + 120],
    ] }] };
  const document = documentWith([fill, outer]);
  document.blocks = {
    TEXT_BLOCK: { name: "TEXT_BLOCK", basePoint: [0, 0], entities: [nestedText] },
    NESTED_BLOCK: { name: "NESTED_BLOCK", basePoint: [0, 0], entities: [inner] },
  };
  const model = compileCanonicalToScene(document, { sceneId: "r05_nested_glyph_composite" });
  assert(model.manifest.chunks.some((chunk) => chunk.maxFillGlyphCompositeErrorWorld > 0),
    "two-level INSERT glyph contributes to overlapping fill/glyph encoded-error accounting");
  document.layouts = { SHEET: { id: "SHEET", name: "Sheet", isModelSpace: false,
    bbox: [X - 200, Y - 200, X + 200, Y + 200] } };
  document.paperSpaceEntities = { SHEET: [fill] };
  document.viewports = { VP: { id: "VP", layoutId: "SHEET", center: [X, Y], width: 400, height: 400,
    viewCenter: [X, Y], viewHeight: 400 } };
  const paper = compileCanonicalToScene(document, { sceneId: "r05_viewport_glyph_composite" });
  assert(paper.manifest.chunks.some((chunk) => chunk.layoutId === "SHEET" &&
    chunk.maxFillGlyphCompositeErrorWorld > 0),
    "viewport-projected nested glyph contributes to paper fill/glyph encoded-error accounting");

  nestedText.text = "MMMMMMMMMMMM";
  nestedText.height = 1000;
  document.modelSpaceEntities = [outer];
  document.paperSpaceEntities = { SHEET: [] };
  document.layouts.SHEET!.bbox = [X - 5000, Y - 5000, X + 20000, Y + 5000];
  document.viewports.VP!.center = [X + 7500, Y];
  document.viewports.VP!.width = 25000;
  document.viewports.VP!.height = 10000;
  document.viewports.VP!.viewCenter = [X + 7500, Y];
  document.viewports.VP!.viewHeight = 10000;
  const spatial = compileCanonicalToScene(document, { sceneId: "r05_nested_viewport_glyph_spatial" });
  for (const layoutId of ["Model", "SHEET"]) {
    const selected = chunksOf(spatial).filter(({ entry }) => entry.layoutId === layoutId);
    assert(selected.length > 1 && spatialBounded(selected),
      `${layoutId} nested glyph keeps bounded spatial chunks after viewport projection`);
  }
}

{
  const nestedFill: CadEntity = { handle: "NESTED_HATCH", type: "HATCH", layer: "0", order: 1n,
    patternName: "SOLID", isSolid: true,
    loops: [{ isPolyline: true, vertices: [[0, 0], [40, 0], [40, 40], [0, 40]] }] };
  const nestedLine: CadEntity = { handle: "NESTED_LINE", type: "LINE", layer: "0", order: 2n,
    start: [0, 50], end: [10, 50] };
  const nestedWipeout: CadEntity = { handle: "NESTED_WIPEOUT", type: "WIPEOUT", layer: "0", order: 3n,
    vertices: [[50, 0], [70, 0], [70, 20], [50, 20]] };
  const childInsert: CadEntity = { handle: "CHILD_INSERT", type: "INSERT", layer: "0", order: 1n,
    blockName: "FILL_LEAF", insertionPoint: [0, 0], scale: [2, 2, 1], rotationRad: 0 };
  const rootInsert: CadEntity = { handle: "ROOT_INSERT", type: "INSERT", layer: "0", order: 1n,
    blockName: "FILL_PARENT", insertionPoint: [100, 200], scale: [1, 3, 1], rotationRad: 0 };
  const nestedDocument = documentWith([rootInsert]);
  nestedDocument.blocks = {
    FILL_LEAF: { name: "FILL_LEAF", basePoint: [0, 0], entities: [nestedFill, nestedLine, nestedWipeout] },
    FILL_PARENT: { name: "FILL_PARENT", basePoint: [0, 0], entities: [childInsert] },
  };
  const nestedScene = compileCanonicalToScene(nestedDocument, { sceneId: "r05_nested_fill_mesh" });
  const nestedChunks = chunksOf(nestedScene);
  const nestedCommands = nestedChunks.flatMap(({ meta }) => meta.drawCommands);
  assert(Math.abs(triangleArea(nestedChunks) - 24_000) < 0.01,
    "two-level INSERT transforms preserve nested HATCH and WIPEOUT mesh area");
  const hatchIndex = nestedCommands.findIndex((command) => command.kind === "triangle");
  const lineIndex = nestedCommands.findIndex((command) => command.kind === "line");
  const wipeoutIndex = nestedCommands.findIndex((command) => command.kind === "wipeout");
  assert(hatchIndex >= 0 && hatchIndex < lineIndex && lineIndex < wipeoutIndex,
    "nested HATCH fill, intervening stroke and WIPEOUT retain visitor painter order");

  const clippedInsert: CadEntity = { ...rootInsert, handle: "CLIPPED_INSERT", blockName: "CLIP_FILL",
    insertionPoint: [0, 0], scale: [1, 1, 1], clipBoundary: {
      boundaryVertices: [[0, 0], [50, 0], [50, 100], [0, 100]],
    } };
  nestedDocument.blocks = {
    CLIP_FILL: { name: "CLIP_FILL", basePoint: [0, 0], entities: [
      { handle: "CLIPPED_HATCH", type: "HATCH", layer: "0", order: 1n,
        patternName: "SOLID", isSolid: true,
        loops: [{ isPolyline: true, vertices: [[0, 0], [100, 0], [100, 100], [0, 100]] }] },
      { handle: "CLIPPED_WIPEOUT", type: "WIPEOUT", layer: "0", order: 2n,
        vertices: [[25, 20], [75, 20], [75, 40], [25, 40]] },
    ] },
  };
  nestedDocument.modelSpaceEntities = [clippedInsert];
  const clippedScene = compileCanonicalToScene(nestedDocument, { sceneId: "r05_nested_fill_xclip" });
  assert(Math.abs(triangleArea(chunksOf(clippedScene)) - 5_500) < 0.01 &&
    chunksOf(clippedScene).some(({ meta }) => meta.drawCommands.some((command) => command.kind === "wipeout")) &&
    !clippedScene.manifest.diagnosticsSummary.diagnosticCodes.includes("UNSUPPORTED_FILL_CLIP"),
    "convex normal XCLIP clips nested HATCH and WIPEOUT meshes without degrading supported fills");

  clippedInsert.clipBoundary = { isInverted: true, boundaryVertices: [[0, 0], [50, 0], [50, 100], [0, 100]] };
  const invertedScene = compileCanonicalToScene(nestedDocument, { sceneId: "r05_nested_fill_inverted_xclip" });
  assert(triangleArea(chunksOf(invertedScene)) === 0 && invertedScene.manifest.qualityStatus === "degraded" &&
    invertedScene.manifest.diagnosticsSummary.diagnosticCodes.includes("UNSUPPORTED_FILL_CLIP"),
    "inverted XCLIP omits unsupported fill triangles with an explicit degraded diagnostic");

  clippedInsert.clipBoundary = { boundaryVertices: [[0, 0], [60, 0], [30, 30], [60, 60], [0, 60]] };
  const concaveScene = compileCanonicalToScene(nestedDocument, { sceneId: "r05_nested_fill_concave_xclip" });
  assert(triangleArea(chunksOf(concaveScene)) === 0 && concaveScene.manifest.qualityStatus === "degraded" &&
    concaveScene.manifest.diagnosticsSummary.diagnosticCodes.includes("UNSUPPORTED_FILL_CLIP"),
    "concave XCLIP omits unsupported HATCH/WIPEOUT meshes with the same explicit degraded diagnostic");
}

{
  const insert: CadEntity = { handle: "VIEWPORT_FILL_INSERT", type: "INSERT", layer: "0", order: 1n,
    blockName: "VIEWPORT_FILL", insertionPoint: [0, 0], scale: [1, 1, 1], rotationRad: 0 };
  const document = documentWith([insert]);
  document.blocks = { VIEWPORT_FILL: { name: "VIEWPORT_FILL", basePoint: [0, 0], entities: [{
    handle: "VIEWPORT_HATCH", type: "HATCH", layer: "0", order: 1n,
    patternName: "SOLID", isSolid: true,
    loops: [{ isPolyline: true, vertices: [[0, 0], [100, 0], [100, 100], [0, 100]] }],
  }] } };
  document.layouts = { SHEET: { id: "SHEET", name: "Sheet", isModelSpace: false, bbox: [-25, -25, 25, 25] } };
  document.paperSpaceEntities = { SHEET: [] };
  document.viewports = { VP: { id: "VP", layoutId: "SHEET", center: [0, 0], width: 50, height: 50,
    viewCenter: [50, 50], viewHeight: 100, frozenLayers: [] } };
  const rectangular = compileCanonicalToScene(document, { sceneId: "r05_viewport_fill_rect" });
  const rectangularPaper = chunksOf(rectangular).filter(({ entry }) => entry.layoutId === "SHEET");
  assert(Math.abs(triangleArea(rectangularPaper) - 2_500) < 0.01,
    "viewport-projected nested HATCH mesh is clipped to the paper viewport rectangle");

  document.viewports.VP!.clipPolygon = [[-25, -25], [25, -25], [0, 25]];
  const polygonal = compileCanonicalToScene(document, { sceneId: "r05_viewport_fill_polygon" });
  const polygonalPaper = chunksOf(polygonal).filter(({ entry }) => entry.layoutId === "SHEET");
  assert(Math.abs(triangleArea(polygonalPaper) - 1_250) < 0.01,
    "viewport-projected nested HATCH mesh is clipped to the convex viewport polygon");
}

{
  const nestedWidth: CadEntity = { handle: "NESTED_WIDTH", type: "LWPOLYLINE", layer: "0", order: 1n,
    isClosed: false, constantWidth: 4, vertices: [{ x: 0, y: 0 }, { x: 10, y: 0 }] };
  const laterLine: CadEntity = { handle: "WIDTH_OVERLAY", type: "LINE", layer: "0", order: 2n,
    start: [0, 8], end: [10, 8] };
  const childInsert: CadEntity = { handle: "WIDTH_CHILD_INSERT", type: "INSERT", layer: "0", order: 1n,
    blockName: "WIDTH_LEAF", insertionPoint: [0, 0], scale: [2, -1, 1], rotationRad: 0 };
  const rootInsert: CadEntity = { handle: "WIDTH_ROOT_INSERT", type: "INSERT", layer: "0", order: 1n,
    blockName: "WIDTH_PARENT", insertionPoint: [100, 200], scale: [1, 3, 1], rotationRad: 0 };
  const document = documentWith([rootInsert]);
  document.blocks = {
    WIDTH_LEAF: { name: "WIDTH_LEAF", basePoint: [0, 0], entities: [nestedWidth, laterLine] },
    WIDTH_PARENT: { name: "WIDTH_PARENT", basePoint: [0, 0], entities: [childInsert] },
  };
  const model = compileCanonicalToScene(document, { sceneId: "r05_nested_width_affine" });
  const modelChunks = chunksOf(model);
  const modelCommands = modelChunks.flatMap(({ meta }) => meta.drawCommands);
  assert(Math.abs(triangleArea(modelChunks) - 240) < 0.01,
    "nested variable-space width fill preserves area under mirrored and nonuniform INSERT transforms");
  const nestedFillIndex = modelCommands.findIndex((command) => command.kind === "triangle");
  const overlayIndex = modelCommands.findIndex((command, index) => index > nestedFillIndex && command.kind === "line");
  assert(nestedFillIndex > 0 && overlayIndex > nestedFillIndex,
    "nested width mesh remains between its source centerline and later block stroke in painter order");

  const viewportInsert: CadEntity = { handle: "VIEWPORT_WIDTH_INSERT", type: "INSERT", layer: "0", order: 1n,
    blockName: "VIEWPORT_WIDTH", insertionPoint: [0, 0], scale: [1, 1, 1], rotationRad: 0 };
  document.modelSpaceEntities = [viewportInsert];
  document.blocks = { VIEWPORT_WIDTH: { name: "VIEWPORT_WIDTH", basePoint: [0, 0], entities: [{
    handle: "VIEWPORT_WIDTH_STRIP", type: "LWPOLYLINE", layer: "0", order: 1n,
    isClosed: false, constantWidth: 20,
    vertices: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
  }] } };
  document.layouts = { SHEET: { id: "SHEET", name: "Sheet", isModelSpace: false, bbox: [-25, -25, 25, 25] } };
  document.paperSpaceEntities = { SHEET: [] };
  document.viewports = { VP: { id: "VP", layoutId: "SHEET", center: [0, 0], width: 50, height: 50,
    viewCenter: [50, 0], viewHeight: 100 } };
  const paper = compileCanonicalToScene(document, { sceneId: "r05_viewport_nested_width" });
  const paperChunks = chunksOf(paper).filter(({ entry }) => entry.layoutId === "SHEET");
  assert(Math.abs(triangleArea(paperChunks) - 500) < 0.01,
    "viewport-projected nested width mesh is clipped at the paper viewport after affine projection");

  const cappedInsert: CadEntity = { handle: "CAPPED_WIDTH_INSERT", type: "INSERT", layer: "0", order: 1n,
    blockName: "CAPPED_WIDTH_BLOCK", insertionPoint: [0, 0], scale: [1, 1, 1], rotationRad: 0 };
  document.modelSpaceEntities = [cappedInsert];
  document.blocks = { CAPPED_WIDTH_BLOCK: { name: "CAPPED_WIDTH_BLOCK", basePoint: [0, 0], entities: [{
    handle: "NESTED_WIDTH_CAP", type: "LWPOLYLINE", layer: "0", order: 1n,
    isClosed: false, constantWidth: 20,
    vertices: Array.from({ length: 300 }, (_, index) => ({ x: index % 2 === 0 ? 0 : 6000, y: index * 0.01 })),
  }] } };
  const capped = compileCanonicalToScene(document, { sceneId: "r05_nested_width_cap" });
  assert(capped.manifest.qualityStatus === "degraded" &&
    capped.manifest.diagnosticsSummary.diagnosticCodes.includes("FILL_SPATIAL_PARTITION_LIMIT_REACHED"),
    "nested width mesh over the 256-group bound reports an explicit degraded fill diagnostic");
  assert(triangleArea(chunksOf(capped)) > 0,
    "nested width spatial-cap fallback retains source fill triangles");
}

{
  const width: CadEntity = { handle: "COMPOSITE_WIDTH", type: "LWPOLYLINE", layer: "0", order: 1n,
    isClosed: false, constantWidth: 40,
    vertices: [{ x: 0, y: 0 }, { x: 120, y: 0 }] };
  const text: CadEntity = { handle: "COMPOSITE_TEXT", type: "TEXT", layer: "0", order: 2n,
    text: "M", insertionPoint: [0, 0], height: 100, rotationRad: 0,
    widthFactor: 1, obliqueRad: 0, styleName: "STANDARD" };
  const child: CadEntity = { handle: "COMPOSITE_CHILD", type: "INSERT", layer: "0", order: 1n,
    blockName: "COMPOSITE_LEAF", insertionPoint: [0, 0], scale: [1, 1, 1], rotationRad: 0 };
  const root: CadEntity = { handle: "COMPOSITE_ROOT", type: "INSERT", layer: "0", order: 1n,
    blockName: "COMPOSITE_PARENT", insertionPoint: [X + 0.123456, Y + 0.54321],
    scale: [1.234567, 0.876543, 1], rotationRad: 0.217 };
  const document = documentWith([root]);
  document.blocks = {
    COMPOSITE_LEAF: { name: "COMPOSITE_LEAF", basePoint: [0, 0], entities: [width, text] },
    COMPOSITE_PARENT: { name: "COMPOSITE_PARENT", basePoint: [0, 0], entities: [child] },
  };
  const model = compileCanonicalToScene(document, { sceneId: "r05_nested_width_glyph_composite" });
  assert(model.manifest.chunks.some((chunk) => chunk.maxFillGlyphCompositeErrorWorld > 0),
    "nested width fill and overlapping glyph contribute to the model composite error envelope");

  document.layouts = { SHEET: { id: "SHEET", name: "Sheet", isModelSpace: false,
    bbox: [-50, -50, 50, 50] } };
  document.paperSpaceEntities = { SHEET: [] };
  document.viewports = { VP: { id: "VP", layoutId: "SHEET", center: [0, 0], width: 100, height: 100,
    viewCenter: [X + 60, Y], viewHeight: 200 } };
  const paper = compileCanonicalToScene(document, { sceneId: "r05_viewport_nested_width_glyph_composite" });
  assert(paper.manifest.chunks.some((chunk) => chunk.layoutId === "SHEET" &&
    chunk.maxFillGlyphCompositeErrorWorld > 0),
    "viewport-projected nested width fill and glyph contribute to the paper composite error envelope");
}

console.log("PASS: R05 nested and viewport fill mesh clipping/transforms/painter order");
