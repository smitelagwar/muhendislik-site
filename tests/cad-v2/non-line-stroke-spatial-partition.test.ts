import type { CadCanonicalDocument, CadEntity } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { parseSceneChunk, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";
import { refineCurveSourceIntervals, type CurveSourceRef } from "../../src/lib/cad-v2/worker/curve-refinement";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`PASS: ${message}`);
}

const X = 1_000_000_000;
const Y = -1_000_000_000;

function documentWith(entity: CadEntity): CadCanonicalDocument {
  return {
    sourceVersionKey: "r04-non-line-stroke-v1", sourceSha256: "r04-non-line-stroke-v1",
    acadVersion: "AC1032", codepage: "UTF-8", units: 4, measurement: 1,
    layers: { "0": { id: "0", name: "0", visible: true, frozen: false, locked: false,
      color: { method: "aci", aci: 7 }, lineweightMm: 2, linetypeName: "CONTINUOUS" } },
    linetypes: {}, textStyles: {}, blocks: {}, layouts: {}, viewports: {},
    paperSpaceEntities: {}, diagnostics: [], modelSpaceEntities: [entity],
  };
}

function chunksOf(scene: ReturnType<typeof compileCanonicalToScene>) {
  return scene.manifest.chunks.map((entry) => {
    const raw = parseSceneChunk(scene.chunks.get(entry.chunkId)!);
    const origin = raw.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
    const xy = raw.sections.get(SceneTag.XY)!.data as Float32Array;
    const path = raw.sections.get(SceneTag.PATH_DISTANCE)!.data as Float32Array;
    const curveData = raw.sections.get(SceneTag.CURVE_DATA)?.data as Float32Array | undefined;
    const meta = JSON.parse(new TextDecoder().decode(raw.sections.get(SceneTag.META)!.data as Uint8Array)) as {
      curveSourceRefs?: CurveSourceRef[];
      drawCommands: Array<{ kind: string; globalOrderIndex?: number }>;
    };
    return { entry, origin, xy, path, curveData, meta };
  });
}

function testAnalyticStroke(entity: CadEntity, sourceType: string, expectedMinChunks: number) {
  const scene = compileCanonicalToScene(documentWith(entity), {
    sceneId: `r04_${sourceType.toLowerCase()}`, maxCurveSegments: 4096,
  });
  const chunks = chunksOf(scene);
  assert(chunks.length >= expectedMinChunks, `${sourceType} has ${chunks.length} ordered spatial chunks`);
  assert(chunks.every(({ entry }) => Math.max(entry.bbox[2] - entry.bbox[0], entry.bbox[3] - entry.bbox[1]) <= 4096.00001),
    `${sourceType} chunk bboxes stay within 4096 world units including lineweight`);
  const orderIndices = chunks.flatMap(({ meta }) => meta.drawCommands.map((command) => command.globalOrderIndex));
  assert(orderIndices.every((index, position) => index !== undefined &&
    (position === 0 || index >= orderIndices[position - 1]!)),
    `${sourceType} keeps monotonically ordered source primitives across chunks`);
  const refs = chunks.flatMap(({ meta }) => meta.curveSourceRefs ?? []);
  assert(refs.length >= chunks.length && refs.every((ref) => ref.sourceType === sourceType && ref.sourceHandle === entity.handle),
    `${sourceType} sidecar provenance survives every spatial chunk`);
  assert(refs.reduce((total, ref) => total + ref.segmentCount, 0) ===
    chunks.reduce((total, chunk) => total + chunk.xy.length / 4, 0),
    `${sourceType} sidecar intervals cover every fallback chord exactly once`);
  const lastByCurveId = new Map<string, { nextSegment: number; endParam: number }>();
  for (const chunk of chunks) {
    for (const ref of chunk.meta.curveSourceRefs ?? []) {
      const record = ref.curveRecordIndex * 8;
      const startParam = chunk.curveData![record + 6]!;
      const endParam = chunk.curveData![record + 7]!;
      const previous = lastByCurveId.get(ref.curveId);
      assert(!previous || (ref.firstSegmentIndex === previous.nextSegment &&
        Math.abs(startParam - previous.endParam) < 1e-4),
        `${sourceType} analytic segment indices and parameters have no seam gap or overlap`);
      lastByCurveId.set(ref.curveId, { nextSegment: ref.firstSegmentIndex + ref.segmentCount, endParam });
    }
  }
  const distances = chunks.flatMap(({ path }) => Array.from(path));
  assert(distances.every((distance, index) => index === 0 || distance + 0.1 >= distances[index - 1]!),
    `${sourceType} global PATH_DISTANCE does not restart at chunk boundaries`);
  assert(chunks.every(({ xy, origin }) => xy.length > 0 && Math.abs(origin[0]!) > 100_000_000 &&
    Math.max(...Array.from(xy).map(Math.abs)) < 4096),
    `${sourceType} encodes small local Float32 coordinates at a high world origin`);
  assert(scene.manifest.qualityStatus === "exact" &&
    !scene.manifest.diagnosticsSummary.diagnosticCodes.includes("NON_LINE_STROKE_SPATIAL_PARTITION_LIMIT_REACHED"),
    `${sourceType} bounded case does not claim a partition limit`);
  for (const chunk of chunks) {
    assert(!!chunk.curveData && !!chunk.meta.curveSourceRefs, `${sourceType} chunk retains CURVE_DATA`);
    const result = refineCurveSourceIntervals({
      curveData: chunk.curveData!, curveSourceRefs: chunk.meta.curveSourceRefs!,
      fallbackVertexCount: chunk.xy.length / 2,
      targetErrorCssPixels: 4, unitsPerCssPixel: 25, maxTransformSingularValue: 1,
    });
    assert(result.intervals.length > 0 && result.intervals.every((interval) => interval.sourceType === sourceType),
      `${sourceType} worker accepts every partitioned source interval`);
  }
}

testAnalyticStroke({ handle: "CIRCLE_H", type: "CIRCLE", layer: "0", order: BigInt(1),
  center: [X, Y], radius: 3200 }, "CIRCLE", 3);
testAnalyticStroke({ handle: "ARC_H", type: "ARC", layer: "0", order: BigInt(1),
  center: [X, Y], radius: 4200, startAngleRad: 0, endAngleRad: Math.PI, isClockwise: false }, "ARC", 2);
testAnalyticStroke({ handle: "ELLIPSE_H", type: "ELLIPSE", layer: "0", order: BigInt(1),
  center: [X, Y], majorAxisVector: [3600, 0], axisRatio: 0.45,
  startParam: 0, endParam: Math.PI * 2 }, "ELLIPSE", 2);
testAnalyticStroke({ handle: "SPLINE_H", type: "SPLINE", layer: "0", order: BigInt(1),
  degree: 2, controlPoints: [[X, Y], [X + 3000, Y + 3000], [X + 6000, Y],
    [X + 9000, Y - 3000], [X + 12000, Y]],
  knots: [0, 0, 0, 0.5, 0.5, 1, 1, 1], weights: [1, 1, 1, 1, 1],
  isRational: false, isPeriodic: false }, "SPLINE", 2);

{
  const document = documentWith({ handle: "CIRCLE_ORDER", type: "CIRCLE", layer: "0",
    order: BigInt(1), center: [X, Y], radius: 3200 });
  document.modelSpaceEntities.push({ handle: "OVERLAY", type: "LINE", layer: "0",
    order: BigInt(2), start: [X - 1, Y - 1], end: [X + 1, Y + 1] });
  const ordered = chunksOf(compileCanonicalToScene(document, { sceneId: "r04_painter_order" }));
  const last = ordered.at(-1)!;
  const prior = ordered.slice(0, -1).flatMap(({ meta }) => meta.drawCommands.map((command) => command.globalOrderIndex!));
  assert(ordered.length > 2 && last.meta.drawCommands.some((command) =>
    command.globalOrderIndex! > Math.max(...prior)),
  "later overlay remains after every curve spatial chunk in painter order");
}

{
  const entity: CadEntity = { handle: "POLY_BULGE_H", type: "LWPOLYLINE", layer: "0", order: BigInt(1),
    isClosed: false, vertices: [{ x: X, y: Y, bulge: Math.tan(Math.PI / 8) },
      { x: X + 6000, y: Y }, { x: X + 18000, y: Y }] };
  const scene = compileCanonicalToScene(documentWith(entity), { sceneId: "r04_bulge" });
  const chunks = chunksOf(scene);
  assert(chunks.length >= 4, "bulge plus long straight polyline edge forms multiple chunks");
  assert(chunks.every(({ entry }) => Math.max(entry.bbox[2] - entry.bbox[0], entry.bbox[3] - entry.bbox[1]) <= 4096.00001),
    "bulge/polyline chunks including straight-edge slices have bounded bboxes");
  const refs = chunks.flatMap(({ meta }) => meta.curveSourceRefs ?? []);
  assert(refs.length > 0 && refs.every((ref) => ref.sourceType === "BULGE" && ref.sourceHandle === entity.handle),
    "analytic bulge sidecar remains attached after adjacent straight-edge slicing");
  const distances = chunks.flatMap(({ path }) => Array.from(path));
  assert(distances[0] === 0 && distances.at(-1)! > 18_000 &&
    distances.every((distance, index) => index === 0 || distance + 0.1 >= distances[index - 1]!),
    "polyline PATH_DISTANCE remains monotone and continuous across chunk seams");
  const orderIndices = chunks.flatMap(({ meta }) => meta.drawCommands.map((command) => command.globalOrderIndex));
  assert(orderIndices.every((index, position) => index !== undefined &&
    (position === 0 || index >= orderIndices[position - 1]!)),
    "bulge/polyline slices keep source painter order across chunks");
}

{
  const overLimit = compileCanonicalToScene(documentWith({ handle: "POLY_CAP", type: "LWPOLYLINE",
    layer: "0", order: BigInt(1), isClosed: false,
    vertices: [{ x: 0, y: 0 }, { x: 1_100_000, y: 0 }] }), { sceneId: "r04_cap" });
  assert(overLimit.manifest.chunks.length <= 256 && overLimit.manifest.qualityStatus === "degraded",
    "polyline slice cap retains bounded work and reports degraded quality");
  assert(overLimit.manifest.diagnosticsSummary.diagnosticCodes.includes("NON_LINE_STROKE_SPATIAL_PARTITION_LIMIT_REACHED"),
    "non-LINE slice-cap fallback has its own diagnostic");
  const retained = chunksOf(overLimit)[0]!;
  assert(retained.origin[0]! + retained.xy[0]! === 0 &&
    retained.origin[0]! + retained.xy[2]! === 1_100_000,
    "cap fallback retains the entire source edge");
}

{
  const overLimit = compileCanonicalToScene(documentWith({ handle: "CIRCLE_CAP", type: "CIRCLE",
    layer: "0", order: BigInt(1), center: [X, Y], radius: 600_000 }),
  { sceneId: "r04_analytic_cap", maxCurveSegments: 4 });
  assert(overLimit.manifest.chunks.length === 1 && overLimit.manifest.qualityStatus === "degraded",
    "oversized analytic stroke avoids unbounded spatial chunk creation");
  assert(overLimit.manifest.diagnosticsSummary.diagnosticCodes.includes("NON_LINE_STROKE_SPATIAL_PARTITION_LIMIT_REACHED"),
    "oversized analytic stroke reports the non-LINE partial diagnostic");
  const retained = chunksOf(overLimit)[0]!;
  assert(retained.meta.curveSourceRefs?.some((ref) => ref.sourceHandle === "CIRCLE_CAP") === true,
    "analytic cap fallback keeps its original curve sidecar");
}

{
  const zigzag = compileCanonicalToScene(documentWith({ handle: "POLY_ZIGZAG_CAP", type: "LWPOLYLINE",
    layer: "0", order: BigInt(1), isClosed: false,
    vertices: Array.from({ length: 300 }, (_, index) => ({ x: index % 2 === 0 ? 0 : 6000, y: index * 0.01 })) }),
  { sceneId: "r04_zigzag_cap" });
  assert(zigzag.manifest.chunks.length === 1 && zigzag.manifest.qualityStatus === "degraded",
    "oscillating stroke has a source-level spatial chunk cap even with a small overall bbox");
  assert(zigzag.manifest.diagnosticsSummary.diagnosticCodes.includes("NON_LINE_STROKE_SPATIAL_PARTITION_LIMIT_REACHED"),
    "oscillating cap reports an honest non-LINE partial result");
}

{
  const sourceCircle: CadEntity = { handle: "NESTED_CIRCLE", type: "CIRCLE", layer: "0", order: BigInt(1),
    center: [0, 0], radius: 3000 };
  const sourceArc: CadEntity = { handle: "NESTED_ARC", type: "ARC", layer: "0", order: BigInt(2),
    center: [0, 0], radius: 3200, startAngleRad: 0.2, endAngleRad: Math.PI * 1.7, isClockwise: false };
  const sourceEllipse: CadEntity = { handle: "NESTED_ELLIPSE", type: "ELLIPSE", layer: "0", order: BigInt(3),
    center: [0, 0], majorAxisVector: [3400, 0], axisRatio: 0.45, startParam: 0, endParam: Math.PI * 2 };
  const sourceSpline: CadEntity = { handle: "NESTED_SPLINE", type: "SPLINE", layer: "0", order: BigInt(4),
    degree: 2, controlPoints: [[0, 0], [3000, 3000], [6000, 0], [9000, -3000], [12000, 0]],
    knots: [0, 0, 0, 0.5, 0.5, 1, 1, 1], weights: [1, 1, 1, 1, 1], isRational: false, isPeriodic: false };
  const sourceBulge: CadEntity = { handle: "NESTED_BULGE", type: "LWPOLYLINE", layer: "0", order: BigInt(5),
    isClosed: false, vertices: [{ x: 0, y: 0, bulge: 0.5 }, { x: 5000, y: 0 }, { x: 12000, y: 0 }] };
  const innerInsert: CadEntity = { handle: "INNER_INSERT", type: "INSERT", layer: "0", order: BigInt(1),
    blockName: "CURVE_SOURCE", insertionPoint: [250, -100], scale: [1.5, 0.75, 1], rotationRad: 0.23 };
  const outerInsert: CadEntity = { handle: "OUTER_INSERT", type: "INSERT", layer: "0", order: BigInt(1),
    blockName: "CURVE_NESTED", insertionPoint: [X, Y], scale: [-1.2, 1.7, 1], rotationRad: -0.17 };
  const document = documentWith(outerInsert);
  document.blocks = {
    CURVE_SOURCE: { name: "CURVE_SOURCE", basePoint: [0, 0],
      entities: [sourceCircle, sourceArc, sourceEllipse, sourceSpline, sourceBulge] },
    CURVE_NESTED: { name: "CURVE_NESTED", basePoint: [0, 0], entities: [innerInsert] },
  };
  document.modelSpaceEntities.push({ handle: "NESTED_OVERLAY", type: "LINE", layer: "0", order: BigInt(2),
    start: [X - 4, Y - 4], end: [X + 4, Y + 4] });
  const scene = compileCanonicalToScene(document, { sceneId: "r04_nested_non_line", maxCurveSegments: 4096 });
  const chunks = chunksOf(scene);
  const curveChunks = chunks.filter(({ meta }) => (meta.curveSourceRefs?.length ?? 0) > 0);
  const maxChunkSpan = Math.max(...chunks.map(({ entry }) => Math.max(entry.bbox[2] - entry.bbox[0], entry.bbox[3] - entry.bbox[1])));
  assert(curveChunks.length >= 2,
    `nested CIRCLE/ARC/ELLIPSE/SPLINE/BULGE yields ${curveChunks.length} spatial chunks after two affine INSERT transforms`);
  assert(maxChunkSpan <= 4096.00001,
    `nested non-LINE and later overlay chunks retain bounded world extents (max ${maxChunkSpan})`);
  const refs = curveChunks.flatMap(({ meta }) => meta.curveSourceRefs ?? []);
  const expectedFamilies = new Map([
    ["CIRCLE", sourceCircle.handle], ["ARC", sourceArc.handle], ["ELLIPSE", sourceEllipse.handle],
    ["SPLINE", sourceSpline.handle], ["BULGE", sourceBulge.handle],
  ]);
  assert([...expectedFamilies].every(([type, handle]) =>
    refs.some((ref) => ref.sourceType === type && ref.sourceHandle === handle)),
  "nested analytic circle/arc/ellipse/spline/bulge provenance survives spatial partitioning");
  assert(curveChunks.every(({ xy, origin }) => Math.abs(origin[0]!) > 100_000_000 && Math.abs(origin[1]!) > 100_000_000 &&
    Math.max(...Array.from(xy).map(Math.abs)) < 4096),
    "nested high-origin curve chunks retain small local Float32 coordinates");
  const orderIndices = chunks.flatMap(({ meta }) => meta.drawCommands.map((command) => command.globalOrderIndex));
  assert(orderIndices.every((index, position) => index !== undefined &&
    (position === 0 || index >= orderIndices[position - 1]!)),
    "nested curve chunks remain before the later source overlay in painter order");
}

{
  const document = documentWith({ handle: "VIEWPORT_CIRCLE", type: "CIRCLE", layer: "0", order: BigInt(1),
    center: [0, 0], radius: 3000 });
  document.layouts = { SHEET: { id: "SHEET", name: "Large spatial test sheet", isModelSpace: false,
    bbox: [0, 0, 5000, 5000], viewportIds: ["WIDE_VP"] } };
  document.viewports = { WIDE_VP: { id: "WIDE_VP", layoutId: "SHEET", center: [2500, 2500],
    width: 5000, height: 5000, viewCenter: [0, 0], viewHeight: 5000, frozenLayers: [] } };
  document.paperSpaceEntities = { SHEET: [] };
  const scene = compileCanonicalToScene(document, { sceneId: "r04_viewport_projected_curve", layoutId: "SHEET" });
  const chunks = chunksOf(scene);
  const maxChunkSpan = Math.max(...chunks.map(({ entry }) => Math.max(entry.bbox[2] - entry.bbox[0], entry.bbox[3] - entry.bbox[1])));
  assert(chunks.length >= 2, `viewport-projected non-LINE stroke is split into ${chunks.length} paper-space chunks`);
  assert(maxChunkSpan <= 4096.00001, `viewport-projected stroke chunks are bounded in paper units (max ${maxChunkSpan})`);
  const orderIndices = chunks.flatMap(({ meta }) => meta.drawCommands.map((command) => command.globalOrderIndex));
  assert(orderIndices.every((index, position) => index !== undefined &&
    (position === 0 || index >= orderIndices[position - 1]!)),
    "viewport-projected curve slices preserve source draw order");
}

console.log("PASS: R04 non-LINE spatial partition, nested curves, viewport projection, sidecars, phase and cap");
