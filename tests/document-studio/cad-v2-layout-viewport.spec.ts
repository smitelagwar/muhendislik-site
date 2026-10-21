import { expect, test, type Page } from "@playwright/test";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { PNG } from "pngjs";
import { CAD_V2_COMPILER_REVISION } from "../../src/lib/cad-v2/version";
import { uploadCadPreviewV2Fixture, signInAdmin, cleanupUploadedCadFixtures } from "./cad-test-helpers";
import { buildSceneChunk, DrawPrimitiveKind, MAX_CHUNK_BYTE_LENGTH, parseSceneChunk, SceneScalarType, SceneTag, UINT32_MAX } from "../../src/lib/cad-v2/protocol/binary-protocol";

function makeBrowserAcceptanceScene(
  sceneId = "scene_f06_browser_layout_acceptance",
  modelColor: [number, number, number] = [1, 0.1, 0.1],
) {
  const bbox: [number, number, number, number] = [-50, -50, 50, 50];
  const createChunk = (layoutId: string, xy: number[], color: [number, number, number]) => {
    const meta = new TextEncoder().encode(JSON.stringify({
      layoutId,
      chunkIndex: layoutId === "Model" ? 0 : 1,
      drawCommands: [{ kind: "line", layer: "GEOMETRY", color, firstVertex: 0, vertexCount: 2, lineweightMm: 0.5 }],
    }));
    return buildSceneChunk([
      { tag: SceneTag.META, scalarType: SceneScalarType.U8, componentCount: 1, elementCount: meta.length, data: meta },
      { tag: SceneTag.ORIGIN, scalarType: SceneScalarType.F64, componentCount: 2, elementCount: 1, data: new Float64Array([0, 0]) },
      { tag: SceneTag.XY, scalarType: SceneScalarType.F32, componentCount: 2, elementCount: 2, data: new Float32Array(xy) },
    ]);
  };
  const chunks = new Map([
    ["chunk_100", createChunk("Model", [-40, 0, 40, 0], modelColor)],
    ["chunk_200", createChunk("SHEET_A", [0, -40, 0, 40], [0.1, 0.8, 1])],
  ]);
  const manifest = {
    schemaVersion: 1,
    sceneId,
    sourceVersionKey: "f06-browser-layout-fixture",
    sourceSha256: "f06-browser-layout-fixture",
    renderAbi: "three172-cad2d-v2",
    qualityStatus: "exact",
    diagnosticsSummary: { unknownEntityCount: 0, unknownObjectCount: 0, missingFontCount: 0, missingDependencyCount: 0, diagnosticCodes: [] },
    layouts: [
      { layoutId: "Model", sourceName: "Model", kind: "model", bbox, units: 4 },
      { layoutId: "SHEET_A", sourceName: "SHEET_A", kind: "paper", bbox, units: 4 },
    ],
    chunks: Array.from(chunks, ([chunkId, bytes]) => ({
      chunkId,
      byteLength: bytes.byteLength,
      sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
      layoutId: chunkId === "chunk_100" ? "Model" : "SHEET_A",
      maxHatchFillEncodedGeometryErrorWorld: 0,
    })),
  };
  return { sceneId, chunks, manifest };
}

function makeBrowserBudgetOverflowScene(includeTrailingSmallModel = false, largeModelCount = 4) {
  const sceneId = "scene_f08_browser_budget_overflow";
  const layoutId = "Model";
  const bbox: [number, number, number, number] = [-50, -50, 50, 50];
  const vertexCount = 100_000;
  const xy = new Float32Array(vertexCount * 2);
  xy[0] = -40;
  xy[2] = 40;
  const chunks = new Map<string, Uint8Array>();
  const trailingSmallModelIndex = includeTrailingSmallModel ? largeModelCount : -1;
  const sheetChunkIndex = largeModelCount + (includeTrailingSmallModel ? 1 : 0);
  for (let chunkIndex = 0; chunkIndex <= sheetChunkIndex; chunkIndex++) {
    const isSheet = chunkIndex === sheetChunkIndex;
    const isTrailingSmallModel = chunkIndex === trailingSmallModelIndex;
    const isSmallChunk = isTrailingSmallModel;
    const chunkVertexCount = isSmallChunk ? 2 : vertexCount;
    const chunkXy = isSmallChunk ? new Float32Array([-40, 0, 40, 0]) : xy;
    const chunkLayoutId = isSheet ? "SHEET_A" : layoutId;
    const meta = new TextEncoder().encode(JSON.stringify({
      layoutId: chunkLayoutId,
      chunkIndex,
      drawCommands: Array.from({ length: isSmallChunk ? 1 : 30 }, (_, commandIndex) => ({
        kind: "line", layer: "BUDGET", color: [1, 0.05 + commandIndex * 0.01, 0.05],
        firstVertex: 0, vertexCount: chunkVertexCount, globalOrderIndex: chunkIndex * 30 + commandIndex, lineweightMm: 0,
      })),
    }));
    const chunk = buildSceneChunk([
      { tag: SceneTag.META, scalarType: SceneScalarType.U8, componentCount: 1, elementCount: meta.length, data: meta },
      { tag: SceneTag.ORIGIN, scalarType: SceneScalarType.F64, componentCount: 2, elementCount: 1, data: new Float64Array([0, 0]) },
      { tag: SceneTag.XY, scalarType: SceneScalarType.F32, componentCount: 2, elementCount: chunkVertexCount, data: chunkXy },
    ]);
    if (chunk.byteLength > 2 * 1024 * 1024) throw new Error("F08 budget fixture exceeded the chunk protocol ceiling");
    chunks.set(`chunk_f08_budget_${chunkIndex}`, chunk);
  }
  const manifest = {
    schemaVersion: 1, sceneId,
    sourceVersionKey: includeTrailingSmallModel ? "f08-browser-budget-fairness-source" : "f08-browser-budget-source",
    sourceSha256: includeTrailingSmallModel ? "f08-browser-budget-fairness-source" : "f08-browser-budget-source",
    renderAbi: "three172-cad2d-v2", qualityStatus: "exact",
    diagnosticsSummary: { unknownEntityCount: 0, unknownObjectCount: 0, missingFontCount: 0,
      missingDependencyCount: 0, diagnosticCodes: [] },
    layouts: [
      { layoutId, sourceName: layoutId, kind: "model", bbox, units: 4 },
      { layoutId: "SHEET_A", sourceName: "SHEET_A", kind: "paper", bbox, units: 4 },
    ],
    chunks: Array.from(chunks, ([chunkId, bytes]) => ({
      chunkId, layoutId: chunkId.endsWith(`_${sheetChunkIndex}`) ? "SHEET_A" : layoutId, bbox,
      byteLength: bytes.byteLength,
      sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
      maxHatchFillEncodedGeometryErrorWorld: 0,
    })),
  };
  return { sceneId, chunks, manifest };
}

function makeBrowserViewportFetchScene() {
  const sceneId = "scene_r03_viewport_chunk_fetch";
  const layoutId = "Model";
  const bbox: [number, number, number, number] = [-12, -12, 12, 12];
  const createChunk = (chunkIndex: number, origin: [number, number]) => {
    const meta = new TextEncoder().encode(JSON.stringify({
      layoutId,
      chunkIndex,
      drawCommands: [{ kind: "line", layer: "GEOMETRY", color: [0.2, 0.8, 1], firstVertex: 0, vertexCount: 2, globalOrderIndex: chunkIndex, lineweightMm: 0.5 }],
    }));
    return buildSceneChunk([
      { tag: SceneTag.META, scalarType: SceneScalarType.U8, componentCount: 1, elementCount: meta.length, data: meta },
      { tag: SceneTag.ORIGIN, scalarType: SceneScalarType.F64, componentCount: 2, elementCount: 1, data: new Float64Array(origin) },
      { tag: SceneTag.XY, scalarType: SceneScalarType.F32, componentCount: 2, elementCount: 2, data: new Float32Array([-0.5, 0, 0.5, 0]) },
    ]);
  };
  const chunks = new Map([
    ["chunk_r03_near", createChunk(0, [0.5, 0])],
    ["chunk_r03_far", createChunk(1, [30.5, 0])],
  ]);
  const manifest = {
    schemaVersion: 1,
    sceneId,
    sourceVersionKey: "r03-viewport-fetch-v1",
    sourceSha256: "r03-viewport-fetch-v1",
    renderAbi: "three172-cad2d-v2",
    qualityStatus: "exact",
    diagnosticsSummary: { unknownEntityCount: 0, unknownObjectCount: 0, missingFontCount: 0, missingDependencyCount: 0, diagnosticCodes: [] },
    layouts: [{ layoutId, sourceName: layoutId, kind: "model", bbox, units: 4 }],
    chunks: Array.from(chunks, ([chunkId, bytes]) => ({
      chunkId,
      byteLength: bytes.byteLength,
      sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
      layoutId,
      bbox: chunkId === "chunk_r03_near" ? [-0.25, -0.25, 1.25, 0.25] : [30.25, -0.25, 31.25, 0.25],
      maxHatchFillEncodedGeometryErrorWorld: 0,
    })),
  };
  return { sceneId, chunks, manifest };
}

function makeBrowserActivePaperFetchScene() {
  const sceneId = "scene_r05_active_paper_fetch";
  const layoutBBox: [number, number, number, number] = [-12, -12, 12, 12];
  const makeChunk = (layoutId: string, chunkIndex: number, kind: "line" | "triangle", x: number) => {
    const meta = new TextEncoder().encode(JSON.stringify({
      layoutId, chunkIndex,
      drawCommands: [{ kind, layer: "GEOMETRY", color: [0.25, 0.75, 1],
        firstVertex: 0, vertexCount: kind === "triangle" ? 3 : 2,
        globalOrderIndex: chunkIndex, lineweightMm: 0 }],
    }));
    return buildSceneChunk([
      { tag: SceneTag.META, scalarType: SceneScalarType.U8, componentCount: 1, elementCount: meta.length, data: meta },
      { tag: SceneTag.ORIGIN, scalarType: SceneScalarType.F64, componentCount: 2, elementCount: 1, data: new Float64Array([x, 0]) },
      { tag: SceneTag.XY, scalarType: SceneScalarType.F32, componentCount: 2,
        elementCount: kind === "triangle" ? 0 : 2,
        data: kind === "triangle" ? new Float32Array(0) : new Float32Array([0, 0, 1, 0]) },
      ...(kind === "triangle" ? [{ tag: SceneTag.TRIANGLES, scalarType: SceneScalarType.F32,
        componentCount: 2, elementCount: 3, data: new Float32Array([0, 0, 1, 0, 0, 1]) }] : []),
    ]);
  };
  const definitions = [
    ["chunk_r05_model", "Model", "line", 0],
    ["chunk_r05_a_fill", "SHEET_A", "triangle", 0],
    ["chunk_r05_a_glyph_far", "SHEET_A", "line", 30],
    ["chunk_r05_b_glyph", "SHEET_B", "line", 0],
  ] as const;
  const chunks = new Map<string, Uint8Array>(definitions.map(([chunkId, layoutId, kind, x], index) =>
    [chunkId, makeChunk(layoutId, index, kind, x)] as const));
  const manifest = {
    schemaVersion: 1, sceneId,
    sourceVersionKey: "r05-active-paper-fixture", sourceSha256: "r05-active-paper-fixture",
    renderAbi: "three172-cad2d-v2", qualityStatus: "exact",
    diagnosticsSummary: { unknownEntityCount: 0, unknownObjectCount: 0, missingFontCount: 0,
      missingDependencyCount: 0, diagnosticCodes: [] },
    layouts: ["Model", "SHEET_A", "SHEET_B"].map((layoutId) => ({
      layoutId, sourceName: layoutId, kind: layoutId === "Model" ? "model" : "paper",
      bbox: layoutBBox, units: 4,
    })),
    chunks: definitions.map(([chunkId, layoutId, , x]) => ({
      chunkId, layoutId, bbox: [x - 0.25, -0.25, x + 1.25, 1.25] as [number, number, number, number],
      byteLength: chunks.get(chunkId)!.byteLength,
      sha256: crypto.createHash("sha256").update(chunks.get(chunkId)!).digest("hex"),
      maxHatchFillEncodedGeometryErrorWorld: 0,
    })),
  };
  return { sceneId, chunks, manifest };
}

function makeBrowserHatchRuntimeQualityScene(options: { includeErrorBound?: boolean } = {}) {
  const includeErrorBound = options.includeErrorBound ?? true;
  const sceneId = includeErrorBound ? "scene_l08_hatch_runtime_quality" : "scene_l08_hatch_legacy_quality";
  const layoutId = "Model";
  const bbox: [number, number, number, number] = [-50, -50, 50, 50];
  const meta = new TextEncoder().encode(JSON.stringify({
    layoutId,
    chunkIndex: 0,
    drawCommands: [{ kind: "triangle", layer: "HATCH", color: [0.2, 0.8, 1],
      firstVertex: 0, vertexCount: 3, globalOrderIndex: 0, lineweightMm: 0 }],
  }));
  const chunk = buildSceneChunk([
    { tag: SceneTag.META, scalarType: SceneScalarType.U8, componentCount: 1, elementCount: meta.length, data: meta },
    { tag: SceneTag.ORIGIN, scalarType: SceneScalarType.F64, componentCount: 2, elementCount: 1, data: new Float64Array([0, 0]) },
    { tag: SceneTag.XY, scalarType: SceneScalarType.F32, componentCount: 2, elementCount: 0, data: new Float32Array(0) },
    { tag: SceneTag.TRIANGLES, scalarType: SceneScalarType.F32, componentCount: 2, elementCount: 3,
      data: new Float32Array([-8, -6, 8, -6, 0, 8]) },
  ]);
  const chunks = new Map([["chunk_l08_hatch", chunk]]);
  const manifest = {
    schemaVersion: 1, sceneId,
    sourceVersionKey: "l08-hatch-runtime-quality-v1", sourceSha256: "l08-hatch-runtime-quality-v1",
    renderAbi: "three172-cad2d-v2", qualityStatus: "exact",
    diagnosticsSummary: { unknownEntityCount: 0, unknownObjectCount: 0, missingFontCount: 0,
      missingDependencyCount: 0, diagnosticCodes: [] },
    layouts: [{ layoutId, sourceName: layoutId, kind: "model", bbox, units: 4 }],
    chunks: [{ chunkId: "chunk_l08_hatch", layoutId, bbox: [-10, -10, 10, 10],
      byteLength: chunk.byteLength, sha256: crypto.createHash("sha256").update(chunk).digest("hex"),
      ...(includeErrorBound ? { maxHatchFillEncodedGeometryErrorWorld: 0.036 } : {}) }],
  };
  return { sceneId, chunks, manifest };
}

function makeBrowserHatchRuntimeSourceScene() {
  const sceneId = "scene_l08_hatch_runtime_source";
  const layoutId = "Model";
  const chunkId = "chunk_l08_hatch_runtime_source";
  const sourceId = "hatch:L08_HATCH_SOURCE:1";
  const source = {
    handle: "L08_HATCH_SOURCE", layer: "FILL", order: "1", isSolid: true, solidFill: true, hatchStyle: 0,
    loops: [{ isPolyline: false, isClosed: true, edges: [
      { type: "ARC", center: [0, 0], radius: 10, startAngleRad: 0, endAngleRad: Math.PI / 2, ccw: true },
      { type: "LINE", start: [0, 10], end: [10, 0] },
    ] }],
  };
  const meta = new TextEncoder().encode(JSON.stringify({
    layoutId, chunkIndex: 0, primitiveCount: 2, layerIds: ["FILL", "__RUNTIME_SENTINEL"],
    layerRuns: [{ layer: "__RUNTIME_SENTINEL", color: [0, 0, 0], firstVertex: 0, vertexCount: 2 }],
    triangleRuns: [{ layer: "FILL", color: [0, 0.7059, 0.8235], firstVertex: 0, vertexCount: 3, isWipeout: false, alpha: 1 }],
    drawCommands: [
      { kind: "line", layer: "__RUNTIME_SENTINEL", color: [0, 0, 0], firstVertex: 0,
        vertexCount: 2, order: 0, globalOrderIndex: 0, alpha: 1, lineweightMm: 0 },
      { kind: "triangle", layer: "FILL", color: [0, 0.7059, 0.8235], firstVertex: 0,
        vertexCount: 3, order: 1, globalOrderIndex: 1, alpha: 1, hatchSourceId: sourceId },
    ],
    hatchFillSourceVersion: 1, hatchFillSources: [{ sourceId, source }],
  }));
  const chunk = buildSceneChunk([
    { tag: SceneTag.META, scalarType: SceneScalarType.U8, componentCount: 1, elementCount: meta.length, data: meta },
    { tag: SceneTag.ORIGIN, scalarType: SceneScalarType.F64, componentCount: 2, elementCount: 1, data: new Float64Array([0, 0]) },
    { tag: SceneTag.XY, scalarType: SceneScalarType.F32, componentCount: 2, elementCount: 2,
      data: new Float32Array([1000, 1000, 1001, 1001]) },
    { tag: SceneTag.DRAW_RUNS, scalarType: SceneScalarType.U32, componentCount: 8, elementCount: 2,
      data: new Uint32Array([
        DrawPrimitiveKind.STROKE_PATH, 0, 2, UINT32_MAX, 0, 0, UINT32_MAX, 0,
        DrawPrimitiveKind.TRIANGLES, 0, 3, UINT32_MAX, 0, 0, UINT32_MAX, 1,
      ]) },
    { tag: SceneTag.TRIANGLES, scalarType: SceneScalarType.F32, componentCount: 2, elementCount: 3,
      data: new Float32Array([10, 0, 0, 10, 7.0710678, 7.0710678]) },
  ]);
  const chunks = new Map([[chunkId, chunk]]);
  const manifest = {
    schemaVersion: 1, sceneId, sourceVersionKey: "l08-hatch-runtime-source-v1", sourceSha256: "l08-hatch-runtime-source-v1",
    renderAbi: "three172-cad2d-v2", qualityStatus: "exact",
    diagnosticsSummary: { unknownEntityCount: 0, unknownObjectCount: 0, missingFontCount: 0, missingDependencyCount: 0, diagnosticCodes: [] },
    layouts: [{ layoutId, sourceName: layoutId, kind: "model", bbox: [-1, -1, 11, 11], units: 4 }],
    chunks: [{ chunkId, layoutId, bbox: [0, 0, 10, 10], byteLength: chunk.byteLength,
      sha256: crypto.createHash("sha256").update(chunk).digest("hex"), maxHatchFillEncodedGeometryErrorWorld: 0.5 }],
  };
  return { sceneId, chunks, manifest };
}

function makeBrowserCurveHatchPreflightBudgetScene() {
  const sceneId = "scene_l11_curve_hatch_preflight_budget";
  const layoutId = "Model";
  const bbox: [number, number, number, number] = [-1, -1, 11, 11];
  const pressureChunkCount = 57;
  const pressureVertexCount = 260_000; // 2 MiB içinde kalır; renderer U16 packing sonrasında yaklaşık 1 MiB tutar.
  const chunks = new Map<string, Uint8Array>();
  const manifestChunks: Array<Record<string, unknown>> = [];

  for (let chunkIndex = 0; chunkIndex < pressureChunkCount; chunkIndex++) {
    const chunkId = `chunk_l11_pressure_${String(chunkIndex).padStart(2, "0")}`;
    const meta = new TextEncoder().encode(JSON.stringify({
      layoutId,
      chunkIndex,
      drawCommands: [{ kind: "line", layer: "CPU_PRESSURE", color: [0.1, 0.1, 0.1],
        firstVertex: 0, vertexCount: pressureVertexCount, globalOrderIndex: chunkIndex, lineweightMm: 0 }],
    }));
    const xy = new Float32Array(pressureVertexCount * 2);
    xy[0] = 1000; xy[1] = 1000; xy[2] = 1001; xy[3] = 1001;
    const chunk = buildSceneChunk([
      { tag: SceneTag.META, scalarType: SceneScalarType.U8, componentCount: 1, elementCount: meta.length, data: meta },
      { tag: SceneTag.ORIGIN, scalarType: SceneScalarType.F64, componentCount: 2, elementCount: 1, data: new Float64Array([0, 0]) },
      { tag: SceneTag.XY, scalarType: SceneScalarType.F32, componentCount: 2,
        elementCount: pressureVertexCount, data: xy },
    ]);
    if (chunk.byteLength > MAX_CHUNK_BYTE_LENGTH) throw new Error(`L11 pressure chunk exceeds protocol limit: ${chunkId}`);
    chunks.set(chunkId, chunk);
    manifestChunks.push({ chunkId, layoutId, bbox, byteLength: chunk.byteLength,
      sha256: crypto.createHash("sha256").update(chunk).digest("hex"), maxHatchFillEncodedGeometryErrorWorld: 0 });
  }

  const combinedChunkId = "chunk_l11_curve_hatch_combined";
  const curveCount = 1;
  const hatchSourceId = "hatch:L11_CURVE_HATCH:1";
  const hatchSource = {
    handle: "L11_CURVE_HATCH", layer: "FILL", order: "1", isSolid: true, solidFill: true, hatchStyle: 0,
    loops: [{ isPolyline: false, isClosed: true, edges: [
      { type: "ARC", center: [0, 0], radius: 10, startAngleRad: 0, endAngleRad: Math.PI / 2, ccw: true },
      { type: "LINE", start: [0, 10], end: [10, 0] },
    ] }],
  };
  const curveSourceRefs = Array.from({ length: curveCount }, (_, curveIndex) => ({
    curveId: `l11-curve-${curveIndex}`,
    sourceHandle: `L11_CURVE_${curveIndex}`,
    sourceType: "ARC",
    firstSegmentIndex: 0,
    segmentCount: 1,
    curveRecordIndex: curveIndex,
    firstVertex: curveIndex * 2,
    vertexCount: 2,
  }));
  const meta = new TextEncoder().encode(JSON.stringify({
    layoutId,
    chunkIndex: pressureChunkCount,
    drawCommands: [
      { kind: "line", layer: "CURVES", color: [0.7, 0.7, 0.7], firstVertex: 0,
        vertexCount: curveCount * 2, globalOrderIndex: 0, lineweightMm: 0 },
      { kind: "triangle", layer: "FILL", color: [0, 0.7059, 0.8235], firstVertex: 0,
        vertexCount: 3, globalOrderIndex: 1, lineweightMm: 0, hatchSourceId },
    ],
    curveSourceRefs,
    hatchFillSourceVersion: 1,
    hatchFillSources: [{ sourceId: hatchSourceId, source: hatchSource }],
  }));
  const curveData = new Float32Array(curveCount * 8);
  const curveFallback = new Float32Array(curveCount * 4);
  for (let curveIndex = 0; curveIndex < curveCount; curveIndex++) {
    const recordOffset = curveIndex * 8;
    curveData.set([1000, 1000, 1, 0, 0, 1, 0, Math.PI / 2], recordOffset);
    const vertexOffset = curveIndex * 4;
    curveFallback.set([1001, 1000, 1000, 1001], vertexOffset);
  }
  const combinedChunk = buildSceneChunk([
    { tag: SceneTag.META, scalarType: SceneScalarType.U8, componentCount: 1, elementCount: meta.length, data: meta },
    { tag: SceneTag.ORIGIN, scalarType: SceneScalarType.F64, componentCount: 2, elementCount: 1, data: new Float64Array([0, 0]) },
    { tag: SceneTag.XY, scalarType: SceneScalarType.F32, componentCount: 2,
      elementCount: curveFallback.length / 2, data: curveFallback },
    { tag: SceneTag.CURVE_DATA, scalarType: SceneScalarType.F32, componentCount: 8,
      elementCount: curveCount, data: curveData },
    { tag: SceneTag.TRIANGLES, scalarType: SceneScalarType.F32, componentCount: 2,
      elementCount: 3, data: new Float32Array([10, 0, 0, 10, 7.0710678, 7.0710678]) },
  ]);
  if (combinedChunk.byteLength > MAX_CHUNK_BYTE_LENGTH) {
    throw new Error(`L11 combined curve/HATCH source exceeds protocol limit (${combinedChunk.byteLength} bytes)`);
  }
  chunks.set(combinedChunkId, combinedChunk);
  manifestChunks.push({ chunkId: combinedChunkId, layoutId, bbox, byteLength: combinedChunk.byteLength,
    sha256: crypto.createHash("sha256").update(combinedChunk).digest("hex"), maxHatchFillEncodedGeometryErrorWorld: 0.5 });

  const manifest = {
    schemaVersion: 1,
    sceneId,
    sourceVersionKey: "l11-curve-hatch-preflight-budget-v1",
    sourceSha256: "l11-curve-hatch-preflight-budget-v1",
    renderAbi: "three172-cad2d-v2",
    qualityStatus: "exact",
    diagnosticsSummary: { unknownEntityCount: 0, unknownObjectCount: 0, missingFontCount: 0,
      missingDependencyCount: 0, diagnosticCodes: [] },
    layouts: [{ layoutId, sourceName: layoutId, kind: "model", bbox, units: 4 }],
    chunks: manifestChunks,
  };
  return { sceneId, chunks, manifest, pressureChunkCount, combinedChunkId };
}

function makeBrowserHatchPatternScene(includePatternLines = false) {
  const sceneId = includePatternLines ? "scene_l08_patterned_hatch_render" : "scene_l08_unsupported_hatch_pattern";
  const layoutId = "Model";
  const chunkId = includePatternLines ? "chunk_l08_patterned_hatch_render" : "chunk_l08_unsupported_hatch_pattern";
  const boundarySegments: Array<[number, number, number, number]> = [
    [0, 0, 20, 0], [20, 0, 20, 12], [20, 12, 0, 12], [0, 12, 0, 0],
  ];
  const patternSegments: Array<[number, number, number, number]> = includePatternLines
    ? [[4, 0, 4, 12], [8, 0, 8, 12], [12, 0, 12, 12], [16, 0, 16, 12]]
    : [];
  const xyValues = [...boundarySegments, ...patternSegments].flatMap((segment) => segment);
  const diagnosticCode = includePatternLines ? "HATCH_PATTERN_NATIVE_PARITY_UNVERIFIED" : "UNSUPPORTED_HATCH_PATTERN";
  const meta = new TextEncoder().encode(JSON.stringify({
    layoutId,
    chunkIndex: 0,
    drawCommands: [{ kind: "line", layer: "PATTERN", color: [0.8, 0.8, 0.8],
      firstVertex: 0, vertexCount: xyValues.length / 2, globalOrderIndex: 0, lineweightMm: 0 }],
  }));
  const chunk = buildSceneChunk([
    { tag: SceneTag.META, scalarType: SceneScalarType.U8, componentCount: 1, elementCount: meta.length, data: meta },
    { tag: SceneTag.ORIGIN, scalarType: SceneScalarType.F64, componentCount: 2, elementCount: 1, data: new Float64Array([0, 0]) },
    { tag: SceneTag.XY, scalarType: SceneScalarType.F32, componentCount: 2, elementCount: xyValues.length / 2,
      data: new Float32Array(xyValues) },
    { tag: SceneTag.TRIANGLES, scalarType: SceneScalarType.F32, componentCount: 2, elementCount: 0, data: new Float32Array(0) },
  ]);
  const chunks = new Map([[chunkId, chunk]]);
  const manifest = {
    schemaVersion: 1,
    sceneId,
    sourceVersionKey: includePatternLines ? "l08-patterned-hatch-render-v1" : "l08-unsupported-hatch-pattern-v1",
    sourceSha256: includePatternLines ? "l08-patterned-hatch-render-v1" : "l08-unsupported-hatch-pattern-v1",
    renderAbi: "three172-cad2d-v2",
    qualityStatus: "degraded",
    diagnosticsSummary: { unknownEntityCount: 0, unknownObjectCount: 0, missingFontCount: 0,
      missingDependencyCount: 0, diagnosticCodes: [diagnosticCode] },
    layouts: [{ layoutId, sourceName: layoutId, kind: "model", bbox: [0, 0, 20, 12], units: 4 }],
    chunks: [{ chunkId, layoutId, bbox: [0, 0, 20, 12], byteLength: chunk.byteLength,
      sha256: crypto.createHash("sha256").update(chunk).digest("hex") }],
  };
  return { sceneId, chunks, manifest };
}

function makeBrowserCurveRefinementScene() {
  const sceneId = "scene_f07_camera_curve_refinement";
  const bbox: [number, number, number, number] = [-50, -50, 50, 50];
  const layoutId = "Model";
  const meta = new TextEncoder().encode(JSON.stringify({
    layoutId,
    chunkIndex: 0,
    drawCommands: [{ kind: "line", layer: "CURVE", color: [0.2, 0.75, 1], firstVertex: 0, vertexCount: 2, order: 0, lineweightMm: 0 }],
    curveSourceRefs: [{
      curveId: "F07-CAMERA-ARC", sourceHandle: "F07A1", sourceType: "ARC", firstSegmentIndex: 0,
      segmentCount: 1, curveRecordIndex: 0, firstVertex: 0, vertexCount: 2,
    }],
  }));
  const chunk = buildSceneChunk([
    { tag: SceneTag.META, scalarType: SceneScalarType.U8, componentCount: 1, elementCount: meta.length, data: meta },
    { tag: SceneTag.ORIGIN, scalarType: SceneScalarType.F64, componentCount: 2, elementCount: 1, data: new Float64Array([0, 0]) },
    { tag: SceneTag.XY, scalarType: SceneScalarType.F32, componentCount: 2, elementCount: 2, data: new Float32Array([40, 0, 0, 40]) },
    { tag: SceneTag.DRAW_RUNS, scalarType: SceneScalarType.U32, componentCount: 8, elementCount: 1, data: new Uint32Array([0, 0, 2, 0, 0, 0, 0, 0]) },
    { tag: SceneTag.PATH_DISTANCE, scalarType: SceneScalarType.F32, componentCount: 1, elementCount: 2, data: new Float32Array([0, 20 * Math.PI]) },
    { tag: SceneTag.CURVE_DATA, scalarType: SceneScalarType.F32, componentCount: 8, elementCount: 1, data: new Float32Array([0, 0, 40, 0, 0, 40, 0, Math.PI / 2]) },
  ]);
  const chunks = new Map([["chunk_f07_curve", chunk]]);
  const manifest = {
    schemaVersion: 1,
    sceneId,
    sourceVersionKey: "f07-camera-curve-source",
    sourceSha256: "f07-camera-curve-source",
    renderAbi: "three172-cad2d-v2",
    qualityStatus: "exact",
    diagnosticsSummary: { unknownEntityCount: 0, unknownObjectCount: 0, missingFontCount: 0, missingDependencyCount: 0, diagnosticCodes: [] },
    layouts: [{ layoutId, sourceName: layoutId, kind: "model", bbox, units: 4 }],
    chunks: [{ chunkId: "chunk_f07_curve", byteLength: chunk.byteLength, sha256: crypto.createHash("sha256").update(chunk).digest("hex"),
      layoutId, maxHatchFillEncodedGeometryErrorWorld: 0 }],
  };
  return { sceneId, chunks, manifest };
}

function makeBrowserEllipseRefinementScene() {
  const sceneId = "scene_f07_runtime_ellipse_refinement";
  const layoutId = "Model";
  const bbox: [number, number, number, number] = [-50, -50, 50, 50];
  const semimajor = 40;
  const semiminor = 24;
  const meta = new TextEncoder().encode(JSON.stringify({
    layoutId,
    chunkIndex: 0,
    drawCommands: [{ kind: "line", layer: "ELLIPSE", color: [0.2, 0.75, 1], firstVertex: 0, vertexCount: 2, order: 0, lineweightMm: 0 }],
    curveSourceRefs: [{
      curveId: "F07-RUNTIME-ELLIPSE", sourceHandle: "F07E1", sourceType: "ELLIPSE", firstSegmentIndex: 0,
      segmentCount: 1, curveRecordIndex: 0, firstVertex: 0, vertexCount: 2,
    }],
  }));
  let quarterArcLength = 0;
  const integrationIntervals = 1024;
  for (let i = 0; i <= integrationIntervals; i++) {
    const parameter = (i / integrationIntervals) * Math.PI / 2;
    const speed = Math.hypot(semimajor * Math.sin(parameter), semiminor * Math.cos(parameter));
    quarterArcLength += speed * (i === 0 || i === integrationIntervals ? 1 : i % 2 === 0 ? 2 : 4);
  }
  quarterArcLength *= (Math.PI / 2 / integrationIntervals) / 3;
  const chunk = buildSceneChunk([
    { tag: SceneTag.META, scalarType: SceneScalarType.U8, componentCount: 1, elementCount: meta.length, data: meta },
    { tag: SceneTag.ORIGIN, scalarType: SceneScalarType.F64, componentCount: 2, elementCount: 1, data: new Float64Array([0, 0]) },
    { tag: SceneTag.XY, scalarType: SceneScalarType.F32, componentCount: 2, elementCount: 2, data: new Float32Array([semimajor, 0, 0, semiminor]) },
    { tag: SceneTag.DRAW_RUNS, scalarType: SceneScalarType.U32, componentCount: 8, elementCount: 1, data: new Uint32Array([0, 0, 2, 0, 0, 0, 0, 0]) },
    { tag: SceneTag.PATH_DISTANCE, scalarType: SceneScalarType.F32, componentCount: 1, elementCount: 2, data: new Float32Array([0, quarterArcLength]) },
    { tag: SceneTag.CURVE_DATA, scalarType: SceneScalarType.F32, componentCount: 8, elementCount: 1, data: new Float32Array([0, 0, semimajor, 0, 0, semiminor, 0, Math.PI / 2]) },
  ]);
  const chunks = new Map([["chunk_f07_ellipse", chunk]]);
  const manifest = {
    schemaVersion: 1,
    sceneId,
    sourceVersionKey: "f07-runtime-ellipse-source",
    sourceSha256: "f07-runtime-ellipse-source",
    renderAbi: "three172-cad2d-v2",
    qualityStatus: "exact",
    diagnosticsSummary: { unknownEntityCount: 0, unknownObjectCount: 0, missingFontCount: 0, missingDependencyCount: 0, diagnosticCodes: [] },
    layouts: [{ layoutId, sourceName: layoutId, kind: "model", bbox, units: 4 }],
    chunks: [{ chunkId: "chunk_f07_ellipse", byteLength: chunk.byteLength, sha256: crypto.createHash("sha256").update(chunk).digest("hex"),
      layoutId, maxHatchFillEncodedGeometryErrorWorld: 0 }],
  };
  return { sceneId, chunks, manifest, semimajor, semiminor };
}

async function configureF07EllipseRefinementPage(
  page: Page,
  scene: ReturnType<typeof makeBrowserEllipseRefinementScene>,
  sessionId: string,
): Promise<void> {
  await page.addInitScript(() => {
    const state = { targetErrors: [] as number[], refinedReplies: 0, maxLineVertexCount: 0 };
    (window as Window & { __cadV2F07Ellipse?: typeof state }).__cadV2F07Ellipse = state;

    const NativeWorker = window.Worker;
    window.Worker = new Proxy(NativeWorker, {
      construct(target, args, newTarget) {
        const worker = Reflect.construct(target, args, newTarget) as Worker;
        worker.addEventListener("message", (event) => {
          if ((event.data as { kind?: string })?.kind === "refined-curves") state.refinedReplies++;
        });
        return worker;
      },
    });

    const nativePostMessage = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function(message: unknown, transfer?: Transferable[]) {
      if (message && typeof message === "object" && (message as { kind?: string }).kind === "refine-curves") {
        const targetError = (message as { payload?: { targetErrorCssPixels?: number } }).payload?.targetErrorCssPixels;
        if (typeof targetError === "number") state.targetErrors.push(targetError);
      }
      return nativePostMessage.call(this, message, transfer ?? []);
    };

    const nativeDrawArrays = WebGL2RenderingContext.prototype.drawArrays;
    WebGL2RenderingContext.prototype.drawArrays = function(mode: number, first: number, count: number) {
      if (mode === 0x0001) state.maxLineVertexCount = Math.max(state.maxLineVertexCount, count);
      return nativeDrawArrays.call(this, mode, first, count);
    };
  });

  await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ready", sceneId: scene.sceneId, viewSessionId: sessionId, sourceVersionKey: scene.manifest.sourceVersionKey }),
    });
  });
  await page.route(`**/api/dokumantasyon/cad-v2/view-sessions/${sessionId}/heartbeat`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ expiresAt: Date.now() + 180_000 }) });
  });
  await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
  });
  await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
    const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
    const chunk = scene.chunks.get(chunkId);
    if (!chunk) {
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "F07 ELLIPSE fixture chunk not found" }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
  });
}

async function configureF07ArcDpr3RefinementPage(
  page: Page,
  scene: ReturnType<typeof makeBrowserCurveRefinementScene>,
  sessionId: string,
): Promise<void> {
  await page.addInitScript(() => {
    const state = { targetErrors: [] as number[], refinedReplies: 0, maxLineVertexCount: 0 };
    (window as Window & { __cadV2F07ArcDpr3?: typeof state }).__cadV2F07ArcDpr3 = state;

    const NativeWorker = window.Worker;
    window.Worker = new Proxy(NativeWorker, {
      construct(target, args, newTarget) {
        const worker = Reflect.construct(target, args, newTarget) as Worker;
        worker.addEventListener("message", (event) => {
          if ((event.data as { kind?: string })?.kind === "refined-curves") state.refinedReplies++;
        });
        return worker;
      },
    });

    const nativePostMessage = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function(message: unknown, transfer?: Transferable[]) {
      if (message && typeof message === "object" && (message as { kind?: string }).kind === "refine-curves") {
        const targetError = (message as { payload?: { targetErrorCssPixels?: number } }).payload?.targetErrorCssPixels;
        if (typeof targetError === "number") state.targetErrors.push(targetError);
      }
      return nativePostMessage.call(this, message, transfer ?? []);
    };

    const nativeDrawArrays = WebGL2RenderingContext.prototype.drawArrays;
    WebGL2RenderingContext.prototype.drawArrays = function(mode: number, first: number, count: number) {
      if (mode === 0x0001) state.maxLineVertexCount = Math.max(state.maxLineVertexCount, count);
      return nativeDrawArrays.call(this, mode, first, count);
    };
  });

  await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ready", sceneId: scene.sceneId, viewSessionId: sessionId, sourceVersionKey: scene.manifest.sourceVersionKey }),
    });
  });
  await page.route(`**/api/dokumantasyon/cad-v2/view-sessions/${sessionId}/heartbeat`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ expiresAt: Date.now() + 180_000 }) });
  });
  await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
  });
  await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
    const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
    const chunk = scene.chunks.get(chunkId);
    if (!chunk) {
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "F07 DPR3 ARC fixture chunk not found" }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
  });
}

async function measureF07ArcRasterError({
  screenshotBase64,
  zoomFactor,
  panCssPixels = { x: 0, y: 0 },
  clipArcToViewport = false,
}: {
  screenshotBase64: string;
  zoomFactor: number;
  panCssPixels?: { x: number; y: number };
  clipArcToViewport?: boolean;
}) {
  const image = new Image();
  image.src = "data:image/png;base64," + screenshotBase64;
  await image.decode();
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = image.naturalWidth;
  sampleCanvas.height = image.naturalHeight;
  const context = sampleCanvas.getContext("2d");
  if (!context) throw new Error("Could not read the presented WebGL pixels");
  context.drawImage(image, 0, 0);

  const input = document.querySelector<HTMLElement>('[aria-label="CAD V2 Çizim Etkileşim Alanı"]');
  if (!input) throw new Error("CAD camera input surface is missing");
  const width = input.clientWidth;
  const height = input.clientHeight;
  const margin = Math.min(32, 0.1 * Math.min(width, height));
  const fitUnitsPerCssPixel = Math.max(
    100 / Math.max(1, width - 2 * margin),
    100 / Math.max(1, height - 2 * margin),
  );
  const unitsPerCssPixel = fitUnitsPerCssPixel / zoomFactor;
  const radiusCssPixels = 40 / unitsPerCssPixel;
  const centerX = width / 2 + panCssPixels.x;
  const centerY = height / 2 + panCssPixels.y;
  const minimumArcAngle = clipArcToViewport && centerX + radiusCssPixels > width
    ? Math.acos(Math.max(-1, Math.min(1, (width - centerX) / radiusCssPixels)))
    : 0;
  const maximumArcAngle = clipArcToViewport && centerY - radiusCssPixels < 0
    ? Math.asin(Math.max(0, Math.min(1, centerY / radiusCssPixels)))
    : Math.PI / 2;
  if (minimumArcAngle >= maximumArcAngle) throw new Error("The analytic F07 arc is outside the camera viewport");
  const scaleX = image.naturalWidth / width;
  const scaleY = image.naturalHeight / height;
  const pixels = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
  // Element screenshots include page controls layered over the canvas. Restrict the
  // sample to a 16 CSS px padded analytic-arc envelope to exclude those controls.
  const visibleArcStart = {
    x: centerX + radiusCssPixels * Math.cos(minimumArcAngle),
    y: centerY - radiusCssPixels * Math.sin(minimumArcAngle),
  };
  const visibleArcEnd = {
    x: centerX + radiusCssPixels * Math.cos(maximumArcAngle),
    y: centerY - radiusCssPixels * Math.sin(maximumArcAngle),
  };
  const xStart = Math.max(0, Math.floor((visibleArcEnd.x - 16) * scaleX));
  const xEnd = Math.min(sampleCanvas.width, Math.ceil((visibleArcStart.x + 16) * scaleX));
  const yStart = Math.max(0, Math.floor((visibleArcEnd.y - 16) * scaleY));
  const yEnd = Math.min(sampleCanvas.height, Math.ceil((visibleArcStart.y + 16) * scaleY));
  let bluePixelCount = 0;
  let maximumArcDistanceCssPixels = 0;
  let furthestBluePixel: { x: number; y: number; closestX: number; closestY: number } | null = null;
  const bluePixelCenters: Array<{ x: number; y: number }> = [];
  const blueBounds = { minX: xEnd, minY: yEnd, maxX: -1, maxY: -1 };
  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const offset = (y * sampleCanvas.width + x) * 4;
      const red = pixels[offset]!;
      const green = pixels[offset + 1]!;
      const blue = pixels[offset + 2]!;
      if (!(blue > 80 && blue > red * 1.3 && blue > green * 1.05)) continue;
      bluePixelCount++;
      blueBounds.minX = Math.min(blueBounds.minX, x);
      blueBounds.minY = Math.min(blueBounds.minY, y);
      blueBounds.maxX = Math.max(blueBounds.maxX, x);
      blueBounds.maxY = Math.max(blueBounds.maxY, y);

      const cssX = (x + 0.5) / scaleX;
      const cssY = (y + 0.5) / scaleY;
      bluePixelCenters.push({ x: cssX, y: cssY });
      const dx = cssX - centerX;
      const dy = centerY - cssY;
      const angle = Math.max(0, Math.min(Math.PI / 2, Math.atan2(dy, dx)));
      const closestX = centerX + radiusCssPixels * Math.cos(angle);
      const closestY = centerY - radiusCssPixels * Math.sin(angle);
      const distanceCssPixels = Math.hypot(cssX - closestX, cssY - closestY);
      if (distanceCssPixels > maximumArcDistanceCssPixels) {
        maximumArcDistanceCssPixels = distanceCssPixels;
        furthestBluePixel = { x: cssX, y: cssY, closestX, closestY };
      }
    }
  }
  const sourceArcSampleCount = Math.ceil(radiusCssPixels * (maximumArcAngle - minimumArcAngle) / 0.5);
  let maximumSourceArcToPixelDistanceCssPixels = 0;
  for (let sample = 0; sample <= sourceArcSampleCount; sample++) {
    const angle = minimumArcAngle + sample / sourceArcSampleCount * (maximumArcAngle - minimumArcAngle);
    const sourceX = centerX + radiusCssPixels * Math.cos(angle);
    const sourceY = centerY - radiusCssPixels * Math.sin(angle);
    let nearestPixelDistance = Number.POSITIVE_INFINITY;
    for (const pixel of bluePixelCenters) {
      nearestPixelDistance = Math.min(nearestPixelDistance, Math.hypot(pixel.x - sourceX, pixel.y - sourceY));
    }
    maximumSourceArcToPixelDistanceCssPixels = Math.max(
      maximumSourceArcToPixelDistanceCssPixels,
      nearestPixelDistance,
    );
  }
  return {
    bluePixelCount,
    maximumArcDistanceCssPixels,
    maximumSourceArcToPixelDistanceCssPixels,
    furthestBluePixel,
    blueBounds,
    unitsPerCssPixel,
    visibleArcAngles: [minimumArcAngle, maximumArcAngle],
    cameraWidth: width,
    cameraHeight: height,
    imageWidth: image.naturalWidth,
    imageHeight: image.naturalHeight,
  };
}

async function measureF07EllipseRasterError({
  screenshotBase64,
  semimajor,
  semiminor,
  zoomFactor = 1,
  panCssPixels = { x: 0, y: 0 },
}: {
  screenshotBase64: string;
  semimajor: number;
  semiminor: number;
  zoomFactor?: number;
  panCssPixels?: { x: number; y: number };
}) {
  const image = new Image();
  image.src = "data:image/png;base64," + screenshotBase64;
  await image.decode();
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = image.naturalWidth;
  sampleCanvas.height = image.naturalHeight;
  const context = sampleCanvas.getContext("2d");
  if (!context) throw new Error("Could not read the presented WebGL ellipse pixels");
  context.drawImage(image, 0, 0);

  const input = document.querySelector<HTMLElement>('[aria-label="CAD V2 Çizim Etkileşim Alanı"]');
  if (!input) throw new Error("CAD camera input surface is missing");
  const width = input.clientWidth;
  const height = input.clientHeight;
  const margin = Math.min(32, 0.1 * Math.min(width, height));
  const fitUnitsPerCssPixel = Math.max(
    100 / Math.max(1, width - 2 * margin),
    100 / Math.max(1, height - 2 * margin),
  );
  const unitsPerCssPixel = fitUnitsPerCssPixel / zoomFactor;
  const centerX = width / 2 + panCssPixels.x;
  const centerY = height / 2 + panCssPixels.y;
  const radiusXCssPixels = semimajor / unitsPerCssPixel;
  const radiusYCssPixels = semiminor / unitsPerCssPixel;
  const scaleX = image.naturalWidth / width;
  const scaleY = image.naturalHeight / height;
  const pixels = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
  const xStart = Math.max(0, Math.floor((centerX - 16) * scaleX));
  const xEnd = Math.min(sampleCanvas.width, Math.ceil((centerX + radiusXCssPixels + 16) * scaleX));
  const yStart = Math.max(0, Math.floor((centerY - radiusYCssPixels - 16) * scaleY));
  const yEnd = Math.min(sampleCanvas.height, Math.ceil((centerY + 16) * scaleY));
  const renderedPixelCenters: Array<{ x: number; y: number }> = [];
  const ellipseSamples: Array<{ x: number; y: number }> = [];
  const sampleCount = 4096;
  let maximumRenderedToSourceDistanceCssPixels = 0;
  for (let sample = 0; sample <= sampleCount; sample++) {
    const parameter = sample / sampleCount * Math.PI / 2;
    const sourceX = centerX + radiusXCssPixels * Math.cos(parameter);
    const sourceY = centerY - radiusYCssPixels * Math.sin(parameter);
    ellipseSamples.push({ x: sourceX, y: sourceY });
  }

  const blueBounds = { minX: xEnd, minY: yEnd, maxX: -1, maxY: -1 };
  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const offset = (y * sampleCanvas.width + x) * 4;
      const red = pixels[offset]!;
      const green = pixels[offset + 1]!;
      const blue = pixels[offset + 2]!;
      if (!(blue > 80 && blue > red * 1.3 && blue > green * 1.05)) continue;
      blueBounds.minX = Math.min(blueBounds.minX, x);
      blueBounds.minY = Math.min(blueBounds.minY, y);
      blueBounds.maxX = Math.max(blueBounds.maxX, x);
      blueBounds.maxY = Math.max(blueBounds.maxY, y);
      const renderedX = (x + 0.5) / scaleX;
      const renderedY = (y + 0.5) / scaleY;
      renderedPixelCenters.push({ x: renderedX, y: renderedY });
      let nearestSourceDistance = Number.POSITIVE_INFINITY;
      for (const source of ellipseSamples) {
        nearestSourceDistance = Math.min(nearestSourceDistance, Math.hypot(renderedX - source.x, renderedY - source.y));
      }
      maximumRenderedToSourceDistanceCssPixels = Math.max(maximumRenderedToSourceDistanceCssPixels, nearestSourceDistance);
    }
  }

  let maximumSourceToRenderedDistanceCssPixels = 0;
  for (const source of ellipseSamples) {
    let nearestRenderedDistance = Number.POSITIVE_INFINITY;
    for (const rendered of renderedPixelCenters) {
      nearestRenderedDistance = Math.min(nearestRenderedDistance, Math.hypot(rendered.x - source.x, rendered.y - source.y));
    }
    maximumSourceToRenderedDistanceCssPixels = Math.max(maximumSourceToRenderedDistanceCssPixels, nearestRenderedDistance);
  }

  return {
    bluePixelCount: renderedPixelCenters.length,
    maximumRenderedToSourceDistanceCssPixels,
    maximumSourceToRenderedDistanceCssPixels,
    blueBounds,
    unitsPerCssPixel,
    visibleSourceAngles: [0, Math.PI / 2],
    cameraWidth: width,
    cameraHeight: height,
    imageWidth: image.naturalWidth,
    imageHeight: image.naturalHeight,
    analyticSampleCount: ellipseSamples.length,
  };
}

function makeBrowserSplineRefinementScene() {
  const sceneId = "scene_f07_runtime_spline_refinement";
  const layoutId = "Model";
  const bbox: [number, number, number, number] = [-50, -50, 50, 50];
  const controlPoints: [number, number][] = [[-34, -18], [-15, 40], [17, -38], [34, 22]];
  const weights = [1, 0.7, 1.25, 0.9];
  const meta = new TextEncoder().encode(JSON.stringify({
    layoutId,
    chunkIndex: 0,
    drawCommands: [{ kind: "line", layer: "SPLINE", color: [0.2, 0.75, 1], firstVertex: 0, vertexCount: 2, order: 0, lineweightMm: 0 }],
    curveSourceRefs: [{
      curveId: "F07-RUNTIME-SPLINE", sourceHandle: "F07S1", sourceType: "SPLINE", firstSegmentIndex: 0,
      segmentCount: 1, curveRecordIndex: 0, firstVertex: 0, vertexCount: 2,
      splineSource: { controlPoints, weights },
    }],
  }));
  const chunk = buildSceneChunk([
    { tag: SceneTag.META, scalarType: SceneScalarType.U8, componentCount: 1, elementCount: meta.length, data: meta },
    { tag: SceneTag.ORIGIN, scalarType: SceneScalarType.F64, componentCount: 2, elementCount: 1, data: new Float64Array([0, 0]) },
    { tag: SceneTag.XY, scalarType: SceneScalarType.F32, componentCount: 2, elementCount: 2, data: new Float32Array([...controlPoints[0]!, ...controlPoints[3]!]) },
    { tag: SceneTag.DRAW_RUNS, scalarType: SceneScalarType.U32, componentCount: 8, elementCount: 1, data: new Uint32Array([0, 0, 2, 0, 0, 0, 0, 0]) },
    { tag: SceneTag.PATH_DISTANCE, scalarType: SceneScalarType.F32, componentCount: 1, elementCount: 2, data: new Float32Array([0, 100]) },
    { tag: SceneTag.CURVE_DATA, scalarType: SceneScalarType.F32, componentCount: 8, elementCount: 1, data: new Float32Array([0, 0, 0, 0, 0, 0, 0, 1]) },
  ]);
  const chunks = new Map([["chunk_f07_spline", chunk]]);
  const manifest = {
    schemaVersion: 1,
    sceneId,
    sourceVersionKey: "f07-runtime-spline-source",
    sourceSha256: "f07-runtime-spline-source",
    renderAbi: "three172-cad2d-v2",
    qualityStatus: "exact",
    diagnosticsSummary: { unknownEntityCount: 0, unknownObjectCount: 0, missingFontCount: 0, missingDependencyCount: 0, diagnosticCodes: [] },
    layouts: [{ layoutId, sourceName: layoutId, kind: "model", bbox, units: 4 }],
    chunks: [{ chunkId: "chunk_f07_spline", byteLength: chunk.byteLength, sha256: crypto.createHash("sha256").update(chunk).digest("hex"),
      layoutId, maxHatchFillEncodedGeometryErrorWorld: 0 }],
  };
  return { sceneId, chunks, manifest, controlPoints, weights };
}

async function configureF07SplineRefinementPage(
  page: Page,
  scene: ReturnType<typeof makeBrowserSplineRefinementScene>,
  sessionId: string,
): Promise<void> {
  await page.addInitScript(() => {
    const state = { targetErrors: [] as number[], refinedReplies: 0, maxLineVertexCount: 0 };
    (window as Window & { __cadV2F07Spline?: typeof state }).__cadV2F07Spline = state;

    const NativeWorker = window.Worker;
    window.Worker = new Proxy(NativeWorker, {
      construct(target, args, newTarget) {
        const worker = Reflect.construct(target, args, newTarget) as Worker;
        worker.addEventListener("message", (event) => {
          if ((event.data as { kind?: string })?.kind === "refined-curves") state.refinedReplies++;
        });
        return worker;
      },
    });

    const nativePostMessage = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function(message: unknown, transfer?: Transferable[]) {
      if (message && typeof message === "object" && (message as { kind?: string }).kind === "refine-curves") {
        const targetError = (message as { payload?: { targetErrorCssPixels?: number } }).payload?.targetErrorCssPixels;
        if (typeof targetError === "number") state.targetErrors.push(targetError);
      }
      return nativePostMessage.call(this, message, transfer ?? []);
    };

    const nativeDrawArrays = WebGL2RenderingContext.prototype.drawArrays;
    WebGL2RenderingContext.prototype.drawArrays = function(mode: number, first: number, count: number) {
      if (mode === 0x0001) state.maxLineVertexCount = Math.max(state.maxLineVertexCount, count);
      return nativeDrawArrays.call(this, mode, first, count);
    };
  });

  await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ready", sceneId: scene.sceneId, viewSessionId: sessionId, sourceVersionKey: scene.manifest.sourceVersionKey }),
    });
  });
  await page.route(`**/api/dokumantasyon/cad-v2/view-sessions/${sessionId}/heartbeat`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ expiresAt: Date.now() + 180_000 }) });
  });
  await page.route("**/api/dokumantasyon/cad-v2/scenes/" + scene.sceneId + "/manifest", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
  });
  await page.route("**/api/dokumantasyon/cad-v2/scenes/" + scene.sceneId + "/chunks/*", async (route) => {
    const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
    const chunk = scene.chunks.get(chunkId);
    if (!chunk) {
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "F07 SPLINE fixture chunk not found" }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
  });
}

async function measureF07SplineRasterError({
  screenshotBase64,
  controlPoints,
  weights,
  camera,
}: {
  screenshotBase64: string;
  controlPoints: [number, number][];
  weights: number[];
  camera: { x: number; y: number; k: number };
}) {
  const image = new Image();
  image.src = "data:image/png;base64," + screenshotBase64;
  await image.decode();
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = image.naturalWidth;
  sampleCanvas.height = image.naturalHeight;
  const context = sampleCanvas.getContext("2d");
  if (!context) throw new Error("Could not read the presented WebGL spline pixels");
  context.drawImage(image, 0, 0);

  const input = document.querySelector<HTMLElement>('[aria-label="CAD V2 Çizim Etkileşim Alanı"]');
  if (!input) throw new Error("CAD camera input surface is missing");
  const width = input.clientWidth;
  const height = input.clientHeight;
  const unitsPerCssPixel = 1 / camera.k;
  const scaleX = image.naturalWidth / width;
  const scaleY = image.naturalHeight / height;
  const sourceSampleCount = 4096;
  const sourceSamples: Array<{ x: number; y: number }> = [];
  const sourceBounds = { minX: Number.POSITIVE_INFINITY, minY: Number.POSITIVE_INFINITY, maxX: Number.NEGATIVE_INFINITY, maxY: Number.NEGATIVE_INFINITY };

  // Independent rational Bernstein evaluation of the single cubic span.
  for (let sample = 0; sample <= sourceSampleCount; sample++) {
    const t = sample / sourceSampleCount;
    const oneMinusT = 1 - t;
    const basis = [oneMinusT ** 3, 3 * oneMinusT ** 2 * t, 3 * oneMinusT * t ** 2, t ** 3];
    let weightedX = 0;
    let weightedY = 0;
    let totalWeight = 0;
    for (let index = 0; index < 4; index++) {
      const factor = basis[index]! * weights[index]!;
      weightedX += controlPoints[index]![0] * factor;
      weightedY += controlPoints[index]![1] * factor;
      totalWeight += factor;
    }
    const point = {
      x: camera.x + (weightedX / totalWeight) * camera.k,
      y: camera.y - (weightedY / totalWeight) * camera.k,
    };
    sourceSamples.push(point);
    sourceBounds.minX = Math.min(sourceBounds.minX, point.x);
    sourceBounds.minY = Math.min(sourceBounds.minY, point.y);
    sourceBounds.maxX = Math.max(sourceBounds.maxX, point.x);
    sourceBounds.maxY = Math.max(sourceBounds.maxY, point.y);
  }

  const pixels = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
  const xStart = Math.max(0, Math.floor((sourceBounds.minX - 16) * scaleX));
  const xEnd = Math.min(sampleCanvas.width, Math.ceil((sourceBounds.maxX + 16) * scaleX));
  const yStart = Math.max(0, Math.floor((sourceBounds.minY - 16) * scaleY));
  const yEnd = Math.min(sampleCanvas.height, Math.ceil((sourceBounds.maxY + 16) * scaleY));
  const renderedPixels: Array<{ x: number; y: number }> = [];
  const renderedBounds = { minX: xEnd, minY: yEnd, maxX: -1, maxY: -1 };
  let maximumRenderedToSourceDistanceCssPixels = 0;
  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const offset = (y * sampleCanvas.width + x) * 4;
      const red = pixels[offset]!;
      const green = pixels[offset + 1]!;
      const blue = pixels[offset + 2]!;
      if (!(blue > 80 && blue > red * 1.3 && blue > green * 1.05)) continue;
      renderedBounds.minX = Math.min(renderedBounds.minX, x);
      renderedBounds.minY = Math.min(renderedBounds.minY, y);
      renderedBounds.maxX = Math.max(renderedBounds.maxX, x);
      renderedBounds.maxY = Math.max(renderedBounds.maxY, y);
      const rendered = { x: (x + 0.5) / scaleX, y: (y + 0.5) / scaleY };
      renderedPixels.push(rendered);
      let nearestSource = Number.POSITIVE_INFINITY;
      for (const source of sourceSamples) nearestSource = Math.min(nearestSource, Math.hypot(rendered.x - source.x, rendered.y - source.y));
      maximumRenderedToSourceDistanceCssPixels = Math.max(maximumRenderedToSourceDistanceCssPixels, nearestSource);
    }
  }

  let maximumSourceToRenderedDistanceCssPixels = 0;
  for (const source of sourceSamples) {
    let nearestRendered = Number.POSITIVE_INFINITY;
    for (const rendered of renderedPixels) nearestRendered = Math.min(nearestRendered, Math.hypot(rendered.x - source.x, rendered.y - source.y));
    maximumSourceToRenderedDistanceCssPixels = Math.max(maximumSourceToRenderedDistanceCssPixels, nearestRendered);
  }
  return {
    bluePixelCount: renderedPixels.length,
    maximumRenderedToSourceDistanceCssPixels,
    maximumSourceToRenderedDistanceCssPixels,
    renderedBounds,
    sourceBounds,
    unitsPerCssPixel,
    camera,
    cameraWidth: width,
    cameraHeight: height,
    imageWidth: image.naturalWidth,
    imageHeight: image.naturalHeight,
    independentSourceSampleCount: sourceSamples.length,
  };
}

function makeBrowserVisibleDashScenes() {
  const output = execFileSync(process.execPath, ["--import", "tsx", "tests/cad-v2/f07-dash-render-scene.ts"], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 15_000,
    windowsHide: true,
    maxBuffer: 2 * 1024 * 1024,
  });
  const compiled = JSON.parse(output) as {
    scenes: Array<{
      sceneId: string;
      manifest: { chunks: Array<{ chunkId: string; layoutId: string }> };
      chunks: Array<{ chunkId: string; chunkBase64: string }>;
    }>;
  };
  return compiled.scenes.map((scene) => {
    const chunks = new Map(scene.chunks.map(({ chunkId, chunkBase64 }) => [chunkId, Buffer.from(chunkBase64, "base64")]));
    const modelChunks = scene.manifest.chunks
      .map((chunkRef: { chunkId: string }) => {
        const chunk = chunks.get(chunkRef.chunkId);
        if (!chunk) throw new Error(`Compiler output is missing chunk ${chunkRef.chunkId}`);
        const parsed = parseSceneChunk(chunk);
        const encodedPathDistance = parsed.sections.get(SceneTag.PATH_DISTANCE)?.data as Float32Array | undefined;
        if (!encodedPathDistance) throw new Error(`Compiler chunk ${chunkRef.chunkId} is missing PATH_DISTANCE`);
        const metadata = parsed.sections.get(SceneTag.META)?.data as Uint8Array | undefined;
        if (!metadata) throw new Error(`Compiler chunk ${chunkRef.chunkId} is missing META`);
        const meta = JSON.parse(new TextDecoder().decode(metadata)) as {
          drawCommands?: Array<{ kind: string; vertexCount: number; dashStyle?: { dashSize: number; gapSize: number; pattern?: number[] } }>;
        };
        return { pathDistanceValues: Array.from(encodedPathDistance), drawCommands: meta.drawCommands ?? [] };
      });
    return {
      sceneId: scene.sceneId,
      manifest: scene.manifest,
      chunks,
      pathDistanceValues: modelChunks.flatMap((chunk: { pathDistanceValues: number[] }) => chunk.pathDistanceValues),
      dashDrawCommands: modelChunks.flatMap((chunk: { drawCommands: Array<{ kind: string }> }) =>
        chunk.drawCommands.filter((command) => command.kind === "line")),
    };
  });
}

test.describe("CAD V2 F06 — real browser layout picker", () => {
  test.afterEach(async ({ page }) => {
    if (process.env.CAD_V2_PRESERVE_TEST_FIXTURES === "1") return;
    await cleanupUploadedCadFixtures(page);
  });

  test("F08 kaynak bütçesi görünür aşımı bildirir, LRU tahliye ve yeniden yüklemeyi korur", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserBudgetOverflowScene();
    const sessionId = "vs_f08_browser_budget_overflow";
    const requestedChunkIds: string[] = [];

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ status: "ready", sceneId: scene.sceneId, viewSessionId: sessionId,
          sourceVersionKey: scene.manifest.sourceVersionKey }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/view-sessions/${sessionId}/heartbeat`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ expiresAt: Date.now() + 180_000 }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
      const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
      requestedChunkIds.push(chunkId);
      const chunk = scene.chunks.get(chunkId);
      if (!chunk) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "F08 budget chunk not found" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
    });

    await page.addInitScript(() => {
      const events: Array<{ type: string; chunkId?: string; loadId?: number; status?: string; reason?: string }> = [];
      Object.defineProperty(window, "__cadV2ResourceDiagnostics", {
        value: (event: { type: string; chunkId?: string; loadId?: number; status?: string; reason?: string }) => events.push(event),
        configurable: true,
      });
      Object.defineProperty(window, "__cadV2ResourceEvents", { value: events, configurable: true });
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
    const warning = page.getByTestId("cad-v2-quality-warning");
    await expect(warning).toBeVisible({ timeout: 45_000 });
    await expect(warning).toContainText("Bellek bütçesi nedeniyle görünür alanda");
    expect(requestedChunkIds.length).toBe(4);
    expect(new Set(requestedChunkIds).size).toBe(4);
    const initialResourceDecisions = await page.evaluate(() =>
      (window as unknown as { __cadV2ResourceEvents: Array<{ type: string; status?: string }> }).__cadV2ResourceEvents.slice());
    const initialOutcomes = initialResourceDecisions.filter((event) => event.type === "chunk-load-outcome");
    expect(initialResourceDecisions.filter((event) => event.type === "chunk-load-start")).toHaveLength(4);
    const initialAcceptedCount = initialOutcomes.filter((event) => event.status === "accepted").length;
    expect(initialAcceptedCount).toBeGreaterThan(0);
    expect(initialAcceptedCount).toBeLessThan(4);
    expect(initialOutcomes.filter((event) => event.status === "rejected").length).toBeGreaterThan(0);
    await expect(page.getByText("Varlık:").locator("..")).toContainText(String(initialAcceptedCount * 100_000));

    const picker = page.getByRole("combobox", { name: "Pafta seçimi" });
    await picker.selectOption("SHEET_A");
    await expect(picker).toHaveValue("SHEET_A");
    await expect(warning).toBeHidden({ timeout: 20_000 });
    await expect.poll(() => requestedChunkIds.filter((id) => id.endsWith("_4")).length).toBe(1);
    await expect.poll(async () => page.evaluate(() =>
      (window as unknown as { __cadV2ResourceEvents: Array<{ type: string; reason?: string }> }).__cadV2ResourceEvents
        .filter((event) => event.type === "chunk-evicted" && event.reason === "visible-admission-budget-pressure").length),
    { timeout: 10_000 }).toBeGreaterThan(0);

    await picker.selectOption("Model");
    await expect(picker).toHaveValue("Model");
    await expect(warning).toContainText("Bellek bütçesi nedeniyle görünür alanda", { timeout: 20_000 });
    await expect.poll(() => requestedChunkIds.length, { timeout: 20_000 }).toBeGreaterThan(5);
    expect(requestedChunkIds.filter((id) => !id.endsWith("_4")).length).toBeGreaterThan(4);
    expect(new Set(requestedChunkIds.filter((id) => !id.endsWith("_4"))).size).toBe(4);
    await expect(page.getByText("Varlık:").locator("..")).toContainText("Varlık:");
    const resourceEvents = await page.evaluate(() =>
      (window as unknown as { __cadV2ResourceEvents: Array<{ type: string; chunkId?: string; status?: string; reason?: string }> }).__cadV2ResourceEvents.slice());
    const evictedChunkIds = new Set<string>();
    let refetchedAfterEviction = false;
    for (const event of resourceEvents) {
      if (event.type === "chunk-evicted" && event.chunkId) evictedChunkIds.add(event.chunkId);
      if (event.type === "chunk-load-start" && event.chunkId && evictedChunkIds.has(event.chunkId)) refetchedAfterEviction = true;
    }
    expect(refetchedAfterEviction).toBe(true);
  });

  test("F08 bütçe reddi kalan görünür adayları durdurmaz ve sığan küçük parçayı kabul eder", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserBudgetOverflowScene(true, 6);
    const sessionId = "vs_f08_browser_budget_fairness";
    const requestedChunkIds: string[] = [];

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ status: "ready", sceneId: scene.sceneId, viewSessionId: sessionId,
          sourceVersionKey: scene.manifest.sourceVersionKey }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/view-sessions/${sessionId}/heartbeat`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ expiresAt: Date.now() + 180_000 }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
      const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
      requestedChunkIds.push(chunkId);
      const chunk = scene.chunks.get(chunkId);
      if (!chunk) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "F08 fairness chunk not found" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
    });
    await page.addInitScript(() => {
      const events: Array<{ type: string; chunkId?: string; status?: string }> = [];
      Object.defineProperty(window, "__cadV2ResourceDiagnostics", {
        value: (event: { type: string; chunkId?: string; status?: string }) => events.push(event),
        configurable: true,
      });
      Object.defineProperty(window, "__cadV2ResourceEvents", { value: events, configurable: true });
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
    const warning = page.getByTestId("cad-v2-quality-warning");
    await expect(warning).toBeVisible({ timeout: 45_000 });
    await expect(warning).toContainText("Bellek bütçesi nedeniyle görünür alanda");
    await expect.poll(() => requestedChunkIds.length, { timeout: 20_000 }).toBe(7);
    expect(new Set(requestedChunkIds).size).toBe(7);

    const outcomes = await page.evaluate(() =>
      (window as unknown as { __cadV2ResourceEvents: Array<{ type: string; chunkId?: string; status?: string }> })
        .__cadV2ResourceEvents.filter((event) => event.type === "chunk-load-outcome"));
    expect(outcomes).toHaveLength(7);
    expect(outcomes.filter((event) => event.status === "rejected").length).toBeGreaterThan(0);
    expect(outcomes.some((event) => event.chunkId === "chunk_f08_budget_6" && event.status === "accepted")).toBe(true);
    const acceptedLargeChunks = outcomes.filter((event) =>
      event.chunkId?.startsWith("chunk_f08_budget_") && event.chunkId !== "chunk_f08_budget_6" && event.status === "accepted").length;
    await expect(page.getByText("Varlık:").locator("..")).toContainText(String(acceptedLargeChunks * 100_000 + 2));
  });

  test("pafta seçimi WebGL host içindeki aktif layout chunk'larını değiştirir", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserAcceptanceScene();
    const sceneId = scene.sceneId;
    const sessionId = "vs_f06_browser_layout_acceptance";

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ready", sceneId, viewSessionId: sessionId, sourceVersionKey: scene.manifest.sourceVersionKey }),
      });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${sceneId}/manifest`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${sceneId}/chunks/*`, async (route) => {
      const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
      const chunk = scene.chunks.get(chunkId);
      if (!chunk) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "fixture chunk not found" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
    const picker = page.getByRole("combobox", { name: "Pafta seçimi" });
    await expect(picker).toBeVisible({ timeout: 60_000 });
    await expect(picker).toHaveValue("Model");

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();
    // Browser compositor screenshot is the oracle here: WebGL's default drawing buffer
    // may be cleared after presentation when preserveDrawingBuffer is false.
    const readFrame = async () => crypto.createHash("sha256").update(await canvas.screenshot()).digest("hex");

    let modelFrame = "";
    await expect.poll(async () => {
      modelFrame = await readFrame();
      return modelFrame;
    }, { timeout: 15_000 }).not.toBe("");

    await picker.selectOption("SHEET_A");
    await expect(picker).toHaveValue("SHEET_A");
    await expect.poll(readFrame, { timeout: 15_000 }).not.toBe(modelFrame);
    await expect(page.getByText("Varlık:")).toBeVisible();
  });

  test("L10 pafta değişiminde her layout kendi yakınlaştırma ve merkezini geri yükler", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements", "l10-layout-camera-restore.dxf");
    const scene = makeBrowserAcceptanceScene("scene_l10_layout_camera_restore");
    scene.manifest.layouts[1]!.bbox = [-200, -100, 200, 100];
    const sessionId = "vs_l10_layout_camera_restore";

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ status: "ready", sceneId: scene.sceneId, viewSessionId: sessionId,
          sourceVersionKey: scene.manifest.sourceVersionKey }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/view-sessions/${sessionId}/heartbeat`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ expiresAt: Date.now() + 180_000 }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
      const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
      const chunk = scene.chunks.get(chunkId);
      if (!chunk) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: `L10 chunk not found: ${chunkId}` }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
    const picker = page.getByRole("combobox", { name: "Pafta seçimi" });
    await expect(picker).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText("Varlık:")).toBeVisible({ timeout: 30_000 });
    const input = page.getByLabel("CAD V2 Çizim Etkileşim Alanı");
    const readCamera = () => input.evaluate((element) => {
      const zoom = (element as HTMLDivElement & { __zoom?: { x: number; y: number; k: number } }).__zoom;
      if (!zoom) throw new Error("L10 D3 camera state was not initialized");
      return { x: zoom.x, y: zoom.y, k: zoom.k };
    });

    await page.getByRole("button", { name: "Yakınlaştır (+)" }).click();
    await page.getByRole("button", { name: "Yakınlaştır (+)" }).click();
    await input.focus();
    await page.keyboard.press("ArrowRight");
    const modelCamera = await readCamera();

    await picker.selectOption("SHEET_A");
    await expect(picker).toHaveValue("SHEET_A");
    await expect.poll(readCamera).not.toEqual(modelCamera);
    await page.getByRole("button", { name: "Yakınlaştır (+)" }).click();
    await page.getByRole("button", { name: "Yakınlaştır (+)" }).click();
    await input.focus();
    await page.keyboard.press("ArrowDown");
    const sheetCamera = await readCamera();
    expect(sheetCamera).not.toEqual(modelCamera);

    await picker.selectOption("Model");
    await expect(picker).toHaveValue("Model");
    await expect.poll(readCamera).toEqual(modelCamera);
    await picker.selectOption("SHEET_A");
    await expect(picker).toHaveValue("SHEET_A");
    await expect.poll(readCamera).toEqual(sheetCamera);
  });

  test("L10 hızlı pafta dönüşünde gecikmiş eski layout chunk'ı aktif çizime sızmaz", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements", "l10-stale-layout-chunk.dxf");
    const scene = makeBrowserAcceptanceScene("scene_l10_stale_layout_chunk");
    const sessionId = "vs_l10_stale_layout_chunk";
    let paperChunkRequests = 0;
    let paperReplyAttempted = false;
    let releasePaperChunk: (() => void) | undefined;
    const paperChunkGate = new Promise<void>((resolve) => { releasePaperChunk = resolve; });

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ status: "ready", sceneId: scene.sceneId, viewSessionId: sessionId,
          sourceVersionKey: scene.manifest.sourceVersionKey }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/view-sessions/${sessionId}/heartbeat`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ expiresAt: Date.now() + 180_000 }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
      const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
      const chunk = scene.chunks.get(chunkId);
      if (!chunk) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: `L10 chunk not found: ${chunkId}` }) });
        return;
      }
      if (chunkId === "chunk_200") {
        paperChunkRequests++;
        await paperChunkGate;
        paperReplyAttempted = true;
      }
      try {
        await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
      } catch {
        // Switching back may abort the held request; either way it must not paint over Model.
      }
    });
    await page.addInitScript(() => {
      const events: Array<{ type: string; chunkId?: string; status?: string }> = [];
      Object.defineProperty(window, "__cadV2L10Events", { value: events, configurable: true });
      Object.defineProperty(window, "__cadV2ResourceDiagnostics", {
        value: (event: { type: string; chunkId?: string; status?: string }) => events.push(event), configurable: true,
      });
    });

    try {
      await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
      const picker = page.getByRole("combobox", { name: "Pafta seçimi" });
      await expect(picker).toBeVisible({ timeout: 60_000 });
      await expect(page.getByText("Varlık:")).toBeVisible({ timeout: 30_000 });
      const canvas = page.locator("canvas").first();
      const countColors = async (screenshot: Buffer) => page.evaluate(async (base64) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const sample = document.createElement("canvas");
        sample.width = image.width;
        sample.height = image.height;
        const context = sample.getContext("2d");
        if (!context) throw new Error("Could not create L10 screenshot sampler");
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
        let red = 0;
        let cyan = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i]! > 100 && pixels[i]! > pixels[i + 1]! * 1.5 && pixels[i]! > pixels[i + 2]! * 1.5) red++;
          if (pixels[i + 2]! > 100 && pixels[i + 1]! > pixels[i]! * 1.5 && pixels[i + 2]! > pixels[i]! * 1.5) cyan++;
        }
        return { red, cyan };
      }, screenshot.toString("base64"));

      const modelBefore = await countColors(await canvas.screenshot());
      expect(modelBefore.red).toBeGreaterThan(20);
      await picker.selectOption("SHEET_A");
      await expect(picker).toHaveValue("SHEET_A");
      await expect.poll(() => paperChunkRequests, { timeout: 15_000 }).toBe(1);
      await picker.selectOption("Model");
      await expect(picker).toHaveValue("Model");
      const modelBeforeOldReply = await canvas.screenshot();
      const modelBeforeOldReplyColors = await countColors(modelBeforeOldReply);
      expect(modelBeforeOldReplyColors.red).toBeGreaterThan(20);
      releasePaperChunk?.();
      await expect.poll(() => paperReplyAttempted).toBe(true);
      await expect.poll(() => page.evaluate(() =>
        (window as unknown as { __cadV2L10Events: Array<{ type: string; chunkId?: string; status?: string }> }).__cadV2L10Events
          .some((event) => event.type === "chunk-load-outcome" && event.chunkId === "chunk_200" && event.status === "stale-visibility")),
      { timeout: 15_000 }).toBe(true);
      await expect.poll(async () => countColors(await canvas.screenshot()), { timeout: 15_000 })
        .toEqual(modelBeforeOldReplyColors);
      expect(crypto.createHash("sha256").update(await canvas.screenshot()).digest("hex"))
        .toBe(crypto.createHash("sha256").update(modelBeforeOldReply).digest("hex"));
    } finally {
      releasePaperChunk?.();
    }
  });

  test("kaynak ve tek renk görünüşü yeniden hazırlamadan kayıpsız geri döner", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserAcceptanceScene("scene_l09_monochrome_roundtrip");
    const sessionId = "vs_l09_monochrome_roundtrip";
    const requests = { prepare: 0, manifest: 0, chunks: 0 };

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      requests.prepare++;
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ status: "ready", sceneId: scene.sceneId, viewSessionId: sessionId,
          sourceVersionKey: scene.manifest.sourceVersionKey }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/view-sessions/${sessionId}/heartbeat`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ expiresAt: Date.now() + 180_000 }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
      requests.manifest++;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
      requests.chunks++;
      const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
      const chunk = scene.chunks.get(chunkId);
      if (!chunk) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "fixture chunk not found" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
    await expect(page.getByRole("combobox", { name: "Pafta seçimi" })).toHaveValue("Model", { timeout: 60_000 });
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();
    const nextCanvasFrames = () => page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
    const readStableCanvasFrame = async () => {
      let previousHash = "";
      let frame = Buffer.alloc(0);
      for (let attempt = 0; attempt < 8; attempt++) {
        await nextCanvasFrames();
        frame = await canvas.screenshot();
        const hash = crypto.createHash("sha256").update(frame).digest("hex");
        if (hash === previousHash) return frame;
        previousHash = hash;
      }
      throw new Error("Canvas screenshot did not stabilize across eight consecutive frames");
    };
    await page.getByRole("button", { name: "Görünüm Ayarları" }).click();
    const lineweightToggle = page.getByRole("button", { name: "Çizgi Kalınlıkları" });
    await expect(lineweightToggle).toHaveAttribute("aria-pressed", "true");
    await lineweightToggle.click();
    await expect(lineweightToggle).toHaveAttribute("aria-pressed", "false");
    const lineweightOffFrame = await readStableCanvasFrame();
    await lineweightToggle.click();
    await expect(lineweightToggle).toHaveAttribute("aria-pressed", "true");
    await nextCanvasFrames();
    await page.getByRole("button", { name: "Görünüm Ayarları" }).click();
    const sourceFrame = await readStableCanvasFrame();
    const sourcePng = PNG.sync.read(sourceFrame);
    const countColoredSourcePixels = (data: Buffer) => {
      const png = PNG.sync.read(data);
      let count = 0;
      for (let offset = 0; offset < png.data.length; offset += 4) {
        const red = png.data[offset]!;
        const green = png.data[offset + 1]!;
        const blue = png.data[offset + 2]!;
        if (red > 80 && red > green * 1.5 && red > blue * 1.5) count++;
      }
      return count;
    };
    const coloredSourcePixels = countColoredSourcePixels(sourceFrame);
    const lineweightOffColoredPixels = countColoredSourcePixels(lineweightOffFrame);
    expect(coloredSourcePixels).toBeGreaterThan(20);
    expect(coloredSourcePixels).toBeGreaterThan(lineweightOffColoredPixels);
    console.log(`L11 lineweight raster: ${JSON.stringify({ lineweightOffColoredPixels, lineweightOnColoredPixels: coloredSourcePixels })}`);
    expect(requests).toEqual({ prepare: 1, manifest: 1, chunks: 1 });

    await page.getByRole("button", { name: "Görünüm Ayarları" }).click();
    const monochromeToggle = page.getByText("Tek Renk Modu").locator("xpath=../..").getByRole("button");
    await expect(monochromeToggle).toBeVisible();
    await monochromeToggle.click();
    await page.getByRole("button", { name: "Görünüm Ayarları" }).click();
    const monochromeFrame = await readStableCanvasFrame();
    const monochromePng = PNG.sync.read(monochromeFrame);
    let changedPixels = 0;
    for (let offset = 0; offset < sourcePng.data.length; offset += 4) {
      const changed = Math.abs(sourcePng.data[offset]! - monochromePng.data[offset]!) > 8
        || Math.abs(sourcePng.data[offset + 1]! - monochromePng.data[offset + 1]!) > 8
        || Math.abs(sourcePng.data[offset + 2]! - monochromePng.data[offset + 2]!) > 8;
      if (changed) changedPixels++;
    }
    expect(changedPixels).toBeGreaterThan(20);

    await page.getByRole("button", { name: "Görünüm Ayarları" }).click();
    const restoreToggle = page.getByText("Tek Renk Modu").locator("xpath=../..").getByRole("button");
    await expect(restoreToggle).toBeVisible();
    await restoreToggle.click();
    await page.getByRole("button", { name: "Görünüm Ayarları" }).click();
    const restoredFrame = await readStableCanvasFrame();
    const restoredPng = PNG.sync.read(restoredFrame);
    let restoredColoredPixels = 0;
    for (let offset = 0; offset < sourcePng.data.length; offset += 4) {
      const red = restoredPng.data[offset]!;
      const green = restoredPng.data[offset + 1]!;
      const blue = restoredPng.data[offset + 2]!;
      if (red > 80 && red > green * 1.5 && red > blue * 1.5) restoredColoredPixels++;
    }
    expect(restoredColoredPixels).toBe(coloredSourcePixels);
    expect(crypto.createHash("sha256").update(restoredFrame).digest("hex"))
      .toBe(crypto.createHash("sha256").update(sourceFrame).digest("hex"));
    expect(requests).toEqual({ prepare: 1, manifest: 1, chunks: 1 });
  });

  test("WebGL context restore 20 döngüde yeni frame ve kaynak sürekliliğini korur", async ({ page }) => {
    test.setTimeout(180_000);
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserAcceptanceScene();
    Object.assign(scene.manifest, {
      layers: {
        GEOMETRY: {
          id: "GEOMETRY", name: "GEOMETRY", visible: true, frozen: false, locked: false,
          color: { method: "rgb", rgb: [255, 26, 26] }, lineweightMm: 0.5, linetypeName: "Continuous",
        },
      },
    });
    const sessionId = "vs_f08_context_recovery_gate";
    const requestedChunkIds: string[] = [];

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ status: "ready", sceneId: scene.sceneId, viewSessionId: sessionId,
          sourceVersionKey: scene.manifest.sourceVersionKey }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/view-sessions/${sessionId}/heartbeat`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ expiresAt: Date.now() + 180_000 }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
      const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
      requestedChunkIds.push(chunkId);
      const chunk = scene.chunks.get(chunkId);
      if (!chunk) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "F08 fixture chunk not found" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
    const picker = page.getByRole("combobox", { name: "Pafta seçimi" });
    await expect(picker).toBeVisible({ timeout: 60_000 });
    const canvas = page.locator("canvas").first();
    const input = page.getByLabel("CAD V2 Çizim Etkileşim Alanı");
    const countRedPixels = async (screenshot: Buffer) => page.evaluate(async (base64) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const sample = document.createElement("canvas");
      sample.width = image.width;
      sample.height = image.height;
      const context = sample.getContext("2d");
      if (!context) throw new Error("Could not create a screenshot pixel sampler");
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
      let count = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i]! > 80 && pixels[i]! > pixels[i + 1]! * 1.5 && pixels[i]! > pixels[i + 2]! * 1.5) count++;
      }
      return count;
    }, screenshot.toString("base64"));
    const initialRedPixels = await countRedPixels(await canvas.screenshot());
    expect(initialRedPixels).toBeGreaterThan(20);
    expect(requestedChunkIds).toEqual(["chunk_100"]);

    await page.getByRole("button", { name: "Yakınlaştır (+)" }).click();
    const cameraBeforeLoss = await input.evaluate((element) => {
      const zoom = (element as HTMLDivElement & { __zoom?: { x: number; y: number; k: number } }).__zoom;
      if (!zoom) throw new Error("F08 camera state was not initialized");
      return { x: zoom.x, y: zoom.y, k: zoom.k };
    });
    expect(cameraBeforeLoss.k).toBeGreaterThan(1);

    await page.getByRole("button", { name: "Görünüm Ayarları" }).click();
    const lineweightToggle = page.getByRole("button", { name: "Çizgi Kalınlıkları" });
    await expect(lineweightToggle).toHaveAttribute("aria-pressed", "true");
    await lineweightToggle.click();
    await expect(lineweightToggle).toHaveAttribute("aria-pressed", "false");
    await page.getByRole("button", { name: "Görünüm Ayarları" }).click();
    const configuredVisibleRedPixels = await countRedPixels(await canvas.screenshot());
    expect(configuredVisibleRedPixels).toBeGreaterThan(20);

    await page.getByTitle("Katmanlar").click();
    await expect(page.getByText("Görünür: 1 / 1")).toBeVisible();
    await page.getByTitle("Katmanlar").click();

    await page.evaluate(() => {
      const state = { hold: false, pending: [] as FrameRequestCallback[], nextId: 1 };
      const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
      (window as any).__cadF08FrameState = state;
      (window as any).__cadF08ReleaseFrames = () => {
        state.hold = false;
        for (const callback of state.pending.splice(0)) nativeRequestAnimationFrame(callback);
      };
      window.requestAnimationFrame = (callback: FrameRequestCallback) => {
        if (!state.hold) return nativeRequestAnimationFrame(callback);
        state.pending.push(callback);
        return state.nextId++;
      };
      state.hold = true;
    });
    await canvas.evaluate(async (element) => {
      const canvasElement = element as HTMLCanvasElement;
      const gl = canvasElement.getContext("webgl2");
      const extension = gl?.getExtension("WEBGL_lose_context");
      if (!extension) throw new Error("WEBGL_lose_context extension is unavailable");
      (window as any).__cadF08LoseContextExtension = extension;
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error("WebGL context lost event timed out")), 5_000);
        element.addEventListener("webglcontextlost", () => { window.clearTimeout(timeout); resolve(); }, { once: true });
        extension.loseContext();
      });
    });
    await expect(page.getByText("Görüntü yeniden hazırlanıyor...")).toBeVisible();
    await page.evaluate(() => (window as any).__cadF08LoseContextExtension.restoreContext());
    await expect(page.getByTestId("cad-v2-streaming-progress")).toBeVisible();
    expect(await page.evaluate(() => (window as any).__cadF08FrameState.pending.length)).toBeGreaterThan(0);
    await page.evaluate(() => (window as any).__cadF08ReleaseFrames());
    await expect(page.getByTestId("cad-v2-streaming-progress")).toBeHidden({ timeout: 15_000 });
    await expect(page.getByText("Varlık:")).toBeVisible();
    expect(requestedChunkIds).toEqual(["chunk_100"]);
    const restoredRedPixels = await countRedPixels(await canvas.screenshot());
    expect(restoredRedPixels).toBeGreaterThan(configuredVisibleRedPixels * 0.75);
    expect(restoredRedPixels).toBeLessThan(configuredVisibleRedPixels * 1.25);
    expect(await input.evaluate((element) => (element as HTMLDivElement & { __zoom?: { x: number; y: number; k: number } }).__zoom))
      .toEqual(cameraBeforeLoss);
    expect(await picker.inputValue()).toBe("Model");
    await page.getByRole("button", { name: "Görünüm Ayarları" }).click();
    await expect(page.getByRole("button", { name: "Çizgi Kalınlıkları" })).toHaveAttribute("aria-pressed", "false");
    await page.getByRole("button", { name: "Görünüm Ayarları" }).click();

    for (let recovery = 2; recovery <= 20; recovery++) {
      await canvas.evaluate(async (element) => {
        const extension = (window as any).__cadF08LoseContextExtension as WEBGL_lose_context;
        await new Promise<void>((resolve, reject) => {
          const timeout = window.setTimeout(() => reject(new Error("WebGL context lost event timed out")), 5_000);
          element.addEventListener("webglcontextlost", () => { window.clearTimeout(timeout); resolve(); }, { once: true });
          extension.loseContext();
        });
      });
      await expect(page.getByText("Görüntü yeniden hazırlanıyor...")).toBeVisible();
      await canvas.evaluate(async (element) => {
        const extension = (window as any).__cadF08LoseContextExtension as WEBGL_lose_context;
        await new Promise<void>((resolve, reject) => {
          const timeout = window.setTimeout(() => reject(new Error("WebGL context restored event timed out")), 5_000);
          element.addEventListener("webglcontextrestored", () => { window.clearTimeout(timeout); resolve(); }, { once: true });
          extension.restoreContext();
        });
      });
      await expect(page.getByText("DWG Motor V2 Hazırlanıyor")).toBeHidden({ timeout: 15_000 });
      await expect(page.getByText("Varlık:")).toBeVisible();
      expect(requestedChunkIds, `recovery ${recovery} fetched a chunk again`).toEqual(["chunk_100"]);
      const redPixels = await countRedPixels(await canvas.screenshot());
      expect(redPixels, `recovery ${recovery} lost the visible layer`).toBeGreaterThan(configuredVisibleRedPixels * 0.75);
      expect(redPixels, `recovery ${recovery} duplicated the drawing`).toBeLessThan(configuredVisibleRedPixels * 1.25);
      expect(await input.evaluate((element) => (element as HTMLDivElement & { __zoom?: { x: number; y: number; k: number } }).__zoom),
        `recovery ${recovery} changed the camera`).toEqual(cameraBeforeLoss);
      expect(await picker.inputValue(), `recovery ${recovery} changed the active layout`).toBe("Model");
      await page.getByTitle("Katmanlar").click();
      await expect(page.getByText("Görünür: 1 / 1")).toBeVisible();
      await page.getByTitle("Katmanlar").click();
      await page.getByRole("button", { name: "Görünüm Ayarları" }).click();
      await expect(page.getByRole("button", { name: "Çizgi Kalınlıkları" }), `recovery ${recovery} changed lineweight settings`)
        .toHaveAttribute("aria-pressed", "false");
      await page.getByRole("button", { name: "Görünüm Ayarları" }).click();
    }

    await page.getByTitle("Katmanlar").click();
    await expect(page.getByText("Görünür: 1 / 1")).toBeVisible();
    await page.getByTitle("Katmanlar").click();
    await expect.poll(async () => countRedPixels(await canvas.screenshot()), { timeout: 10_000 })
      .toBeGreaterThan(configuredVisibleRedPixels * 0.75);
    await expect.poll(async () => countRedPixels(await canvas.screenshot()), { timeout: 10_000 })
      .toBeLessThan(configuredVisibleRedPixels * 1.25);
  });

  test("L11 kullanıcı iptali 200 ms içinde görünür olur ve açılmış view session silinir", async ({ page }) => {
    test.setTimeout(60_000);
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements", "l11-cancel-latency.dxf");
    const scene = makeBrowserAcceptanceScene("scene_l11_cancel_latency");
    const viewSessionId = "vs_l11_cancel_latency";
    let deleteCount = 0;

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        status: "preparing",
        sceneId: null,
        jobId: "job_l11_cancel_latency",
        viewSessionId,
        sourceVersionKey: scene.manifest.sourceVersionKey,
      }) });
    });
    await page.route("**/api/dokumantasyon/cad-v2/jobs/job_l11_cancel_latency", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "running" }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/view-sessions/${viewSessionId}`, async (route) => {
      if (route.request().method() === "DELETE") deleteCount++;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
    await expect(page.getByText("DWG/DXF geometrisi derleniyor...")).toBeVisible({ timeout: 15_000 });
    const deleteResponsePromise = page.waitForResponse((response) =>
      response.request().method() === "DELETE" && response.url().includes(`/view-sessions/${viewSessionId}`),
    );
    const cancelLatencyMs = await page.evaluate(() => new Promise<number>((resolve, reject) => {
      const overlay = document.querySelector('[data-testid="cad-v2-blocking-loading-overlay"]');
      const button = Array.from(overlay?.querySelectorAll("button") ?? [])
        .find((element) => element.textContent?.trim() === "İptal Et") as HTMLButtonElement | undefined;
      if (!button) {
        reject(new Error("Blocking preparation cancel button is missing."));
        return;
      }
      const startedAt = performance.now();
      const observer = new MutationObserver(() => {
        if (document.body.textContent?.includes("İşlem İptal Edildi")) {
          observer.disconnect();
          window.clearTimeout(timeout);
          resolve(performance.now() - startedAt);
        }
      });
      const timeout = window.setTimeout(() => {
        observer.disconnect();
        reject(new Error("Cancel acknowledgement did not render within 2 seconds."));
      }, 2_000);
      observer.observe(document.body, { childList: true, characterData: true, subtree: true });
      button.click();
      if (document.body.textContent?.includes("İşlem İptal Edildi")) {
        observer.disconnect();
        window.clearTimeout(timeout);
        resolve(performance.now() - startedAt);
      }
    }));

    expect(cancelLatencyMs).toBeLessThanOrEqual(200);
    await expect(page.getByText("İşlem İptal Edildi")).toBeVisible();
    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.status()).toBe(200);
    expect(deleteCount).toBe(1);
    console.log(`L11 cancel UI/cleanup: ${JSON.stringify({ cancelLatencyMs, deleteStatus: deleteResponse.status(), deleteCount })}`);
  });

  test("20 V2 aç/kapat döngüsünde worker ve view session temizlenir", async ({ page }) => {
    test.setTimeout(180_000);
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserAcceptanceScene();
    let prepareCount = 0;
    const deletedSessions = new Set<string>();
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Performance.enable");
    const memorySamples: Array<{
      cycle: number;
      phase: "v2" | "list";
      jsHeapUsedBytes: number;
      domNodes: number;
      liveDomElements: number;
      jsEventListeners: number;
      trackedListeners: { window: number; document: number; canvas: number };
      trackedListenerTargets: {
        activeTargetCount: number;
        activeListenerCount: number;
        detachedTargetCount: number;
        detachedListenerCount: number;
        byKind: Record<string, { targets: number; listeners: number }>;
        topTargets: Array<{ kind: string; connected: boolean; listenerCount: number; eventTypes: string[]; id: string | null; className: string | null; dataTestId: string | null; ariaLabel: string | null }>;
      };
    }> = [];
    const sampleMemory = async (cycle: number, phase: "v2" | "list") => {
      await cdp.send("HeapProfiler.collectGarbage");
      const metrics = await cdp.send("Performance.getMetrics");
      const dom = await cdp.send("Memory.getDOMCounters");
      const jsHeapUsedBytes = metrics.metrics.find((entry: { name: string }) => entry.name === "JSHeapUsedSize")?.value;
      expect(Number.isFinite(jsHeapUsedBytes)).toBe(true);
      const liveDomElements = await page.evaluate(() => document.getElementsByTagName("*").length);
      const trackedListeners = await page.evaluate(() => ({ ...(window as any).__cadF08ListenerStats }));
      const trackedListenerTargets = await page.evaluate(() => (window as any).__cadF08SummarizeListenerTargets());
      memorySamples.push({ cycle, phase, jsHeapUsedBytes, domNodes: dom.nodes, liveDomElements,
        jsEventListeners: dom.jsEventListeners, trackedListeners, trackedListenerTargets });
    };
    await page.addInitScript(() => {
      const counters = { active: 0, created: 0, terminated: 0 };
      (window as any).__cadF08Workers = counters;
      const listenerStats = { window: 0, document: 0, canvas: 0 };
      (window as any).__cadF08ListenerStats = listenerStats;
      const listenerRegistry = new WeakMap<EventTarget, Map<string, Set<EventListenerOrEventListenerObject>>>();
      const listenerTargetRefs = new Set<WeakRef<EventTarget>>();
      const listenerTargetRefByTarget = new WeakMap<EventTarget, WeakRef<EventTarget>>();
      const listenerKind = (target: EventTarget): keyof typeof listenerStats | null =>
        target === window ? "window" : target === document ? "document" :
        target instanceof HTMLCanvasElement ? "canvas" : null;
      const listenerKey = (type: string, options?: boolean | AddEventListenerOptions | EventListenerOptions) =>
        `${type}:${typeof options === "boolean" ? options : !!options?.capture}`;
      const nativeAdd = EventTarget.prototype.addEventListener;
      const nativeRemove = EventTarget.prototype.removeEventListener;
      (EventTarget.prototype as any).addEventListener = function(type: string, listener: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions) {
        const kind = listenerKind(this);
        if (listener) {
          if (!listenerTargetRefByTarget.has(this)) {
            const targetRef = new WeakRef(this);
            listenerTargetRefByTarget.set(this, targetRef);
            listenerTargetRefs.add(targetRef);
          }
          let byKey = listenerRegistry.get(this);
          if (!byKey) { byKey = new Map(); listenerRegistry.set(this, byKey); }
          const key = listenerKey(type, options);
          let listeners = byKey.get(key);
          if (!listeners) { listeners = new Set(); byKey.set(key, listeners); }
          if (!listeners.has(listener)) {
            listeners.add(listener);
            if (kind) listenerStats[kind]++;
          }
        }
        return nativeAdd.call(this, type, listener, options);
      };
      (EventTarget.prototype as any).removeEventListener = function(type: string, listener: EventListenerOrEventListenerObject | null,
        options?: boolean | EventListenerOptions) {
        const kind = listenerKind(this);
        if (listener && listenerRegistry.get(this)?.get(listenerKey(type, options))?.delete(listener) && kind) {
          listenerStats[kind]--;
        }
        return nativeRemove.call(this, type, listener, options);
      };
      (window as any).__cadF08SummarizeListenerTargets = () => {
        let activeTargetCount = 0;
        let activeListenerCount = 0;
        let detachedTargetCount = 0;
        let detachedListenerCount = 0;
        const byKind: Record<string, { targets: number; listeners: number }> = {};
        const topTargets: Array<{ kind: string; connected: boolean; listenerCount: number; eventTypes: string[]; id: string | null; className: string | null; dataTestId: string | null; ariaLabel: string | null }> = [];
        for (const targetRef of listenerTargetRefs) {
          const target = targetRef.deref();
          if (!target) {
            listenerTargetRefs.delete(targetRef);
            continue;
          }
          const byKey = listenerRegistry.get(target);
          if (!byKey) continue;
          const eventTypes = new Map<string, number>();
          for (const [key, listeners] of byKey) {
            if (listeners.size === 0) continue;
            const separator = key.indexOf(":");
            const eventType = separator < 0 ? key : key.slice(0, separator);
            eventTypes.set(eventType, (eventTypes.get(eventType) ?? 0) + listeners.size);
          }
          const listenerCount = Array.from(eventTypes.values()).reduce((sum, count) => sum + count, 0);
          if (listenerCount === 0) continue;
          activeTargetCount++;
          activeListenerCount += listenerCount;
          const connected = !(target instanceof Node) || target.isConnected;
          if (!connected) {
            detachedTargetCount++;
            detachedListenerCount += listenerCount;
          }
          let kind: string;
          let id: string | null = null;
          let className: string | null = null;
          let dataTestId: string | null = null;
          let ariaLabel: string | null = null;
          if (target === window) kind = "window";
          else if (target === document) kind = "document";
          else if (target instanceof Element) {
            kind = `element:${target.tagName.toLowerCase()}`;
            id = target.id || null;
            className = typeof target.className === "string" ? target.className.slice(0, 100) || null : null;
            dataTestId = target.getAttribute("data-testid");
            ariaLabel = target.getAttribute("aria-label");
          } else kind = `event-target:${target.constructor?.name ?? "unknown"}`;
          const bucket = byKind[kind] ??= { targets: 0, listeners: 0 };
          bucket.targets++;
          bucket.listeners += listenerCount;
          topTargets.push({ kind, connected, listenerCount, eventTypes: Array.from(eventTypes.keys()).sort(),
            id, className, dataTestId, ariaLabel });
        }
        topTargets.sort((left, right) => right.listenerCount - left.listenerCount);
        return { activeTargetCount, activeListenerCount, detachedTargetCount, detachedListenerCount, byKind,
          topTargets: topTargets.slice(0, 20) };
      };
      const NativeWorker = window.Worker;
      window.Worker = new Proxy(NativeWorker, {
        construct(target, args, newTarget) {
          const worker = Reflect.construct(target, args, newTarget) as Worker;
          if (String(args[0]).includes("/cad-v2/cad-v2-scene-worker.js")) {
            counters.active++;
            counters.created++;
            const terminate = worker.terminate.bind(worker);
            worker.terminate = () => {
              counters.active--;
              counters.terminated++;
              terminate();
            };
          }
          return worker;
        },
      });
    });
    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      const sessionId = `vs_f08_open_close_${++prepareCount}`;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        status: "ready", sceneId: scene.sceneId, viewSessionId: sessionId,
        sourceVersionKey: scene.manifest.sourceVersionKey,
      }) });
    });
    await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*/heartbeat", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ expiresAt: Date.now() + 180_000 }) });
    });
    await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*", async (route) => {
      if (route.request().method() === "DELETE") {
        deletedSessions.add(new URL(route.request().url()).pathname.split("/").at(-1)!);
      }
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ expiresAt: Date.now() + 180_000 }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
      const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
      const chunk = scene.chunks.get(chunkId);
      await route.fulfill(chunk
        ? { status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) }
        : { status: 404, body: "missing chunk" });
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
    for (let cycle = 1; cycle <= 20; cycle++) {
      await expect(page.getByRole("combobox", { name: "Pafta seçimi" })).toBeVisible({ timeout: 30_000 });
      await expect.poll(() => page.evaluate(() => (window as any).__cadF08Workers.active), { timeout: 30_000 }).toBe(1);
      await sampleMemory(cycle, "v2");
      await page.locator('button[title="Geri Dön"]').click({ timeout: 10_000 });
      await expect(page).toHaveURL(/\/dokumantasyon(?:\?.*)?$/);
      await expect.poll(() => page.evaluate(() => (window as any).__cadF08Workers.active)).toBe(0);
      await expect.poll(() => deletedSessions.size, {
        message: `cycle ${cycle}: prepares=${prepareCount}, deleted=${Array.from(deletedSessions).join(",")}`,
      }).toBe(cycle);
      await expect(page.locator('button[aria-label="Dosya İşlemleri"][data-file-name="known-geometry-measurements.dxf"]'))
        .toBeVisible();
      await page.waitForTimeout(150);
      await sampleMemory(cycle, "list");
      if (cycle < 20) {
        await page.locator('button[aria-label="Dosya İşlemleri"][data-file-name="known-geometry-measurements.dxf"]').click();
        await page.getByRole("menuitem", { name: "DXF Motor V2 ile aç" }).click();
      }
    }
    const workers = await page.evaluate(() => (window as any).__cadF08Workers);
    expect(workers).toEqual({ active: 0, created: 20, terminated: 20 });
    expect(prepareCount).toBe(20);
    expect(deletedSessions.size).toBe(20);
    expect(memorySamples).toHaveLength(40);
    await test.info().attach("f08-chromium-cdp-route-samples.json", {
      body: Buffer.from(JSON.stringify(memorySamples, null, 2)), contentType: "application/json",
    });
    const listSamples = memorySamples.filter((sample) => sample.phase === "list");
    for (const sample of listSamples) {
      expect(sample.trackedListeners.canvas, `cycle ${sample.cycle} retained a canvas listener`).toBe(0);
      expect(sample.trackedListeners.window, `cycle ${sample.cycle} changed window listener baseline`)
        .toBe(listSamples[0]!.trackedListeners.window);
      expect(sample.trackedListeners.document, `cycle ${sample.cycle} changed document listener baseline`)
        .toBe(listSamples[0]!.trackedListeners.document);
    }
    console.log(`F08 CDP list cycles 1/10/20: ${JSON.stringify([listSamples[0], listSamples[9], listSamples[19]])}`);
    await cdp.detach();
  });

  test("dosya geçişinde gecikmiş eski chunk yeni sahneye çizilmez", async ({ page }) => {
      test.setTimeout(120_000);
      await signInAdmin(page);
      const { fileId: oldFileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements", "f08-switch-old.dxf");
      const { fileId: newFileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements", "f08-switch-new.dxf");
      const oldScene = makeBrowserAcceptanceScene("scene_f08_switch_old");
      const newScene = makeBrowserAcceptanceScene("scene_f08_switch_new", [0.1, 1, 0.1]);
      const scenesByFile = new Map([[oldFileId, oldScene], [newFileId, newScene]]);
      let oldChunkRequests = 0;
      let releaseOldChunk: (() => void) | undefined;
      const oldChunkGate = new Promise<void>((resolve) => { releaseOldChunk = resolve; });
      let oldReplyDelivered = false;
      let newChunkRequests = 0;
      await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
        const { fileId } = route.request().postDataJSON() as { fileId: string };
        const scene = scenesByFile.get(fileId);
        if (!scene) throw new Error(`Unknown F08 switch file: ${fileId}`);
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
          status: "ready", sceneId: scene.sceneId, viewSessionId: `vs_f08_${fileId}`,
          sourceVersionKey: scene.manifest.sourceVersionKey,
        }) });
      });
      await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*/heartbeat", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      });
      await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      });
      for (const scene of [oldScene, newScene]) {
        await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
          await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
        });
        await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
          const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
          const chunk = scene.chunks.get(chunkId);
          if (!chunk) throw new Error(`Unknown F08 chunk: ${chunkId}`);
          if (scene === oldScene) {
            oldChunkRequests++;
            await oldChunkGate;
          } else {
            newChunkRequests++;
          }
        try {
          await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
          if (scene === oldScene) oldReplyDelivered = true;
        } catch {
          // The old request may already have been aborted by the host transition.
        }
      });
    }

    try {
      await page.goto(`/dokumantasyon/dosya/${oldFileId}?cadEngine=v2`);
      await expect.poll(() => oldChunkRequests, { timeout: 30_000 }).toBeGreaterThan(0);
      await page.locator('button[title="Geri Dön"]').click();
      await expect(page).toHaveURL(/\/dokumantasyon(?:\?.*)?$/);
      await page.locator('button[aria-label="Dosya İşlemleri"][data-file-name="f08-switch-new.dxf"]').click();
      await page.getByRole("menuitem", { name: "DXF Motor V2 ile aç" }).click();
      await expect(page).toHaveURL(new RegExp(`/dokumantasyon/dosya/${newFileId}\\?cadEngine=v2$`));
      await expect.poll(() => newChunkRequests, { timeout: 30_000 }).toBeGreaterThan(0);
      await expect(page.getByText("Varlık:")).toBeVisible({ timeout: 30_000 });

      const canvas = page.locator("canvas").last();
      const countColors = async () => page.evaluate(async (base64) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const sample = document.createElement("canvas");
        sample.width = image.width;
        sample.height = image.height;
        const context = sample.getContext("2d")!;
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
        let red = 0;
        let green = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          // The orange status icon and CAD controls are composited over this canvas screenshot.
          const x = i / 4 % image.width;
          const y = Math.floor(i / 4 / image.width);
          if (x < 70 || y >= image.height - 56) continue;
          if (pixels[i]! > 150 && pixels[i]! > pixels[i + 1]! * 1.5 && pixels[i]! > pixels[i + 2]! * 1.5) red++;
          if (pixels[i + 1]! > 150 && pixels[i + 1]! > pixels[i]! * 1.5 && pixels[i + 1]! > pixels[i + 2]! * 1.5) green++;
        }
        return { red, green };
      }, (await canvas.screenshot()).toString("base64"));
      const beforeOldReply = await countColors();
      expect(beforeOldReply.green).toBeGreaterThan(20);
      expect(beforeOldReply.red).toBeLessThan(10);
      releaseOldChunk?.();
      await expect.poll(() => oldReplyDelivered).toBe(true);
      const afterOldReply = await countColors();
      expect(afterOldReply.green).toBeGreaterThan(beforeOldReply.green * 0.75);
      expect(afterOldReply.red).toBeLessThan(10);
    } finally {
      releaseOldChunk?.();
    }
  });

  test("L05 kaynak revizyonu için tek otomatik repair, terminal sessizlik ve açık retry", async ({ page }) => {
    test.setTimeout(120_000);
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements", "l05-revision-repair.dxf");
    const scene = makeBrowserAcceptanceScene("scene_l05_revision_repair");
    let prepareCount = 0;
    let jobPollCount = 0;
    let manifestCount = 0;
    let chunkCount = 0;
    const expectedVersionKeys: Array<string | undefined> = [];

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      prepareCount++;
      const request = route.request().postDataJSON() as { expectedSourceVersionKey?: string };
      expectedVersionKeys.push(request.expectedSourceVersionKey);
      if (prepareCount <= 2) {
        await route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({
          code: "SOURCE_REVISION_CHANGED",
          message: `Injected revision conflict ${prepareCount}`,
          actualSourceVersionKey: `l05-revision-${prepareCount}`,
        }) });
        return;
      }
      if (prepareCount === 3) {
        await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({
          message: "Injected transient prepare failure",
        }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        status: "ready", sceneId: scene.sceneId, viewSessionId: "vs_l05_revision_repair",
        sourceVersionKey: scene.manifest.sourceVersionKey,
      }) });
    });
    await page.route("**/api/dokumantasyon/cad-v2/jobs/*", async (route) => {
      jobPollCount++;
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "unexpected job poll" }) });
    });
    await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*/heartbeat", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
      manifestCount++;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
      chunkCount++;
      const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
      const chunk = scene.chunks.get(chunkId);
      if (!chunk) throw new Error(`Unknown L05 revision-repair chunk: ${chunkId}`);
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
    });

    try {
      await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
      await expect(page.getByText("Görüntüleme Başarısız")).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText("Injected revision conflict 2")).toBeVisible();
      expect(prepareCount, "one source-revision repair is allowed per automatic attempt chain").toBe(2);
      expect(expectedVersionKeys[1]).toBe("l05-revision-1");
      expect(jobPollCount).toBe(0);
      expect(manifestCount).toBe(0);
      expect(chunkCount).toBe(0);
      await page.waitForTimeout(300);
      expect(prepareCount, "terminal conflict does not create another prepare request").toBe(2);

      await page.getByRole("button", { name: "Tekrar Dene" }).click();
      await expect(page.getByText("Injected transient prepare failure")).toBeVisible({ timeout: 10_000 });
      expect(prepareCount).toBe(3);
      expect(expectedVersionKeys[2]).toBe("l05-revision-2");

      await page.getByRole("button", { name: "Tekrar Dene" }).click();
      await expect(page.getByText("Varlık:")).toBeVisible({ timeout: 30_000 });
      expect(prepareCount).toBe(4);
      expect(expectedVersionKeys[3]).toBe("l05-revision-2");
      await expect.poll(() => chunkCount, { timeout: 15_000 }).toBeGreaterThan(0);
      expect(jobPollCount).toBe(0);
    } finally {
      // Guarded globalTeardown deletes only this isolated run-data directory.
    }
  });

  test("L05 hızlı tekrar dene yalnızca yeni generation başlatır", async ({ page }) => {
    test.setTimeout(90_000);
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements", "l05-rapid-retry.dxf");
    const scene = makeBrowserAcceptanceScene("scene_l05_rapid_retry");
    const validChunk = scene.chunks.get("chunk_100")!;
    let prepareCount = 0;
    let chunkCount = 0;
    let releaseRetryPrepare: (() => void) | undefined;
    const retryPrepareGate = new Promise<void>((resolve) => { releaseRetryPrepare = resolve; });

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      prepareCount++;
      if (prepareCount === 1) {
        await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Injected first prepare failure" }) });
        return;
      }
      await retryPrepareGate;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        status: "ready", sceneId: scene.sceneId, viewSessionId: "vs_l05_rapid_retry",
        sourceVersionKey: scene.manifest.sourceVersionKey,
      }) });
    });
    await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*/heartbeat", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
      chunkCount++;
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(validChunk) });
    });

    try {
      await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
      await expect(page.getByText("Injected first prepare failure")).toBeVisible({ timeout: 30_000 });
      await page.getByRole("button", { name: "Tekrar Dene" }).click();
      await expect.poll(() => prepareCount).toBe(2);
      await expect(page.getByRole("button", { name: "Tekrar Dene" })).toHaveCount(0);
      await page.waitForTimeout(300);
      expect(prepareCount, "an in-flight explicit retry cannot be re-entered from the terminal button").toBe(2);
    } finally {
      releaseRetryPrepare?.();
    }
    await expect(page.getByText("Varlık:")).toBeVisible({ timeout: 30_000 });
    expect(prepareCount).toBe(2);
    expect(chunkCount).toBe(1);
  });

  test("L05 hazır sahnede chunk 404 için tek kontrollü repair sibling isteklerini durdurur", async ({ page }) => {
    test.setTimeout(120_000);
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements", "l05-chunk-integrity.dxf");
    const scene = makeBrowserAcceptanceScene("scene_l05_chunk_integrity");
    const validChunk = scene.chunks.get("chunk_100")!;
    const validDescriptor = scene.manifest.chunks.find((chunk) => chunk.chunkId === "chunk_100")!;
    scene.manifest.chunks = [
      { ...validDescriptor, chunkId: "chunk_missing", layoutId: "Model" },
      { ...validDescriptor, chunkId: "chunk_sibling", layoutId: "Model" },
    ];

    let prepareCount = 0;
    let manifestCount = 0;
    let missingChunkRequestCount = 0;
    let siblingRequestCount = 0;
    let siblingRequestFailedCount = 0;
    let heartbeatCount = 0;
    let jobPollCount = 0;
    let releaseSiblingRoutes: () => void = () => {};
    const siblingRouteGate = new Promise<void>((resolve) => { releaseSiblingRoutes = resolve; });

    await page.clock.install();
    page.on("requestfailed", (request) => {
      if (new URL(request.url()).pathname.endsWith("/chunks/chunk_sibling")) siblingRequestFailedCount++;
    });
    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      prepareCount++;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        status: "ready", sceneId: scene.sceneId, viewSessionId: `vs_l05_chunk_integrity_${prepareCount}`,
        sourceVersionKey: scene.manifest.sourceVersionKey,
      }) });
    });
    await page.route("**/api/dokumantasyon/cad-v2/jobs/*", async (route) => {
      jobPollCount++;
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "unexpected job poll" }) });
    });
    await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*/heartbeat", async (route) => {
      heartbeatCount++;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
      manifestCount++;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
      const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
      if (chunkId === "chunk_missing") {
        missingChunkRequestCount++;
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({
          code: "READY_SCENE_MISSING_OBJECT", message: "Injected ready scene missing chunk",
        }) });
        return;
      }
      if (chunkId === "chunk_sibling") {
        siblingRequestCount++;
        await siblingRouteGate;
        try {
          await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(validChunk) });
        } catch {
          // A cancelled browser request is the expected outcome for this held sibling.
        }
        return;
      }
      throw new Error(`Unexpected L05 chunk request: ${chunkId}`);
    });

    try {
      await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
      await expect(page.getByText("Görüntüleme Başarısız")).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(/Kritik parça bulunamadı/)).toBeVisible();
      expect(missingChunkRequestCount, "HTTP 404 is never blindly retried").toBe(2);
      await expect(page.getByText(/Sahne bütünlüğü doğrulanamadı/)).toBeVisible();
      expect(prepareCount, "a ready-scene integrity failure gets at most one controlled repair").toBe(2);
      expect(manifestCount).toBe(2);
      expect(siblingRequestCount).toBeGreaterThan(0);
      expect(siblingRequestFailedCount, "fatal chunk integrity failure aborts sibling fetches").toBeGreaterThan(0);
      expect(jobPollCount).toBe(0);

      await page.clock.fastForward(31_000);
      expect(heartbeatCount, "terminal integrity error stops session heartbeat").toBe(0);
      expect(prepareCount).toBe(2);
      expect(manifestCount).toBe(2);
      expect(missingChunkRequestCount).toBe(2);
    } finally {
      releaseSiblingRoutes();
    }
  });

  test("L05 SHA-256 uyuşmazlığı bir kez sınıflanır, sahne onarılır ve terminal ağ sessiz kalır", async ({ page }) => {
    test.setTimeout(90_000);
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements", "l05-hash-mismatch.dxf");
    const scene = makeBrowserAcceptanceScene("scene_l05_hash_mismatch");
    const validChunk = scene.chunks.get("chunk_100")!;
    scene.manifest.chunks[0]!.sha256 = "0".repeat(64);
    let prepareCount = 0;
    let manifestCount = 0;
    let chunkCount = 0;
    let heartbeatCount = 0;

    await page.clock.install();
    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      prepareCount++;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        status: "ready", sceneId: scene.sceneId, viewSessionId: `vs_l05_hash_${prepareCount}`,
        sourceVersionKey: scene.manifest.sourceVersionKey,
      }) });
    });
    await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*/heartbeat", async (route) => {
      heartbeatCount++;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
      manifestCount++;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
      chunkCount++;
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(validChunk) });
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
    await expect(page.getByText("Görüntüleme Başarısız")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Sahne bütünlüğü doğrulanamadı: SHA-256 sağlama toplamı uyuşmazlığı/)).toBeVisible();
    expect(prepareCount).toBe(2);
    expect(manifestCount).toBe(2);
    expect(chunkCount, "a hash mismatch is not retried as an ordinary chunk request").toBe(2);
    await page.clock.fastForward(31_000);
    expect(heartbeatCount).toBe(0);
    expect(chunkCount).toBe(2);
  });

  test("L05 chunk HTTP retry tablosu kalıcı hataları durdurur ve Retry-After bütçesine uyar", async ({ page }) => {
    test.setTimeout(120_000);
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements", "l05-http-retry-policy.dxf");
    const scene = makeBrowserAcceptanceScene("scene_l05_http_retry_policy");
    const validChunk = scene.chunks.get("chunk_100")!;
    const responsePlan: Array<{ kind: "http"; status: number; retryAfter?: string } | { kind: "network" } | { kind: "success" }> = [
      { kind: "http", status: 503, retryAfter: "2" },
      { kind: "http", status: 503, retryAfter: "2" },
      { kind: "http", status: 503, retryAfter: "2" },
      { kind: "http", status: 401 },
      { kind: "http", status: 403 },
      { kind: "http", status: 410 },
      { kind: "http", status: 501 },
      { kind: "http", status: 429, retryAfter: "2" },
      { kind: "network" },
      { kind: "success" },
    ];
    let prepareCount = 0;
    let chunkRequestCount = 0;

    await page.clock.install();
    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      prepareCount++;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        status: "ready", sceneId: scene.sceneId, viewSessionId: `vs_l05_http_retry_${prepareCount}`,
        sourceVersionKey: scene.manifest.sourceVersionKey,
      }) });
    });
    await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*/heartbeat", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
      chunkRequestCount++;
      const outcome = responsePlan.shift() ?? { kind: "success" as const };
      if (outcome.kind === "network") {
        await route.abort("failed");
        return;
      }
      if (outcome.kind === "http") {
        const headers: Record<string, string> = {};
        if (outcome.retryAfter) headers["Retry-After"] = outcome.retryAfter;
        await route.fulfill({
          status: outcome.status,
          contentType: "application/json",
          headers,
          body: JSON.stringify({ code: "INJECTED_HTTP_FAILURE", message: `Injected HTTP ${outcome.status}` }),
        });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(validChunk) });
    });

    try {
      await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
      await expect.poll(() => chunkRequestCount).toBe(1);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await page.clock.runFor(1_999);
      expect(chunkRequestCount, "503 retry waits for Retry-After instead of a shorter local delay").toBe(1);
      await page.clock.runFor(1);
      await expect.poll(() => chunkRequestCount).toBe(2);
      await page.clock.runFor(2_000);
      await expect.poll(() => chunkRequestCount).toBe(3);
      await expect(page.getByText(/Parça indirilemedi \(503/)).toBeVisible();
      expect(prepareCount).toBe(1);
      expect(responsePlan).toHaveLength(7);

      await page.getByRole("button", { name: "Tekrar Dene" }).click();
      await expect(page.getByText(/Yetki hatası \(401\)/)).toBeVisible();
      expect(chunkRequestCount).toBe(4);
      expect(prepareCount).toBe(2);

      await page.getByRole("button", { name: "Tekrar Dene" }).click();
      await expect(page.getByText(/Yetki hatası \(403\)/)).toBeVisible();
      expect(chunkRequestCount).toBe(5);
      expect(prepareCount).toBe(3);

      await page.getByRole("button", { name: "Tekrar Dene" }).click();
      await expect(page.getByText(/Görüntüleme erişimi sona erdi \(410\)/)).toBeVisible();
      expect(chunkRequestCount).toBe(6);
      expect(prepareCount, "chunk 410 is terminal and does not renew the viewer session").toBe(4);

      await page.getByRole("button", { name: "Tekrar Dene" }).click();
      await expect(page.getByText(/Parça isteği reddedildi \(501\)/)).toBeVisible();
      expect(chunkRequestCount).toBe(7);
      expect(prepareCount).toBe(5);

      await page.getByRole("button", { name: "Tekrar Dene" }).click();
      await expect.poll(() => chunkRequestCount).toBe(8);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await page.clock.runFor(1_999);
      expect(chunkRequestCount, "429 retry waits for Retry-After").toBe(8);
      await page.clock.runFor(1);
      await expect.poll(() => chunkRequestCount).toBe(9);
      await page.clock.runFor(400);
      await expect(page.getByText("Varlık:")).toBeVisible({ timeout: 30_000 });
      await expect.poll(async () => page.locator("[data-cad-v2-progress]").getAttribute("data-cad-v2-progress"))
        .toMatch(/İndirilen 1\/2 · Doğrulanan 1\/2 · Görünür 1\/1 · Çizilen 1\/2/);
      expect(chunkRequestCount).toBe(10);
      expect(prepareCount).toBe(6);
      expect(responsePlan).toHaveLength(0);
    } finally {
      // Guarded globalTeardown deletes only this isolated run-data directory.
    }
  });

  test("L05 VIEW_SESSION_EXPIRED heartbeat yalnızca bir kez prepare yeniler", async ({ page }) => {
    test.setTimeout(120_000);
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements", "l05-heartbeat-refresh.dxf");
    const scene = makeBrowserAcceptanceScene("scene_l05_heartbeat_refresh");
    const validChunk = scene.chunks.get("chunk_100")!;
    let prepareCount = 0;
    let manifestCount = 0;
    let heartbeatCount = 0;

    await page.clock.install();
    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      prepareCount++;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        status: "ready", sceneId: scene.sceneId, viewSessionId: `vs_l05_heartbeat_${prepareCount}`,
        sourceVersionKey: scene.manifest.sourceVersionKey,
      }) });
    });
    await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*/heartbeat", async (route) => {
      heartbeatCount++;
      await route.fulfill({ status: 410, contentType: "application/json", body: JSON.stringify({
        code: "VIEW_SESSION_EXPIRED", message: "Oturum süresi doldu veya bulunamadı.",
      }) });
    });
    await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
      manifestCount++;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
      const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
      const chunk = scene.chunks.get(chunkId);
      if (!chunk) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ code: "CHUNK_NOT_FOUND" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(validChunk) });
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
    await expect(page.getByText("Varlık:")).toBeVisible({ timeout: 30_000 });
    await page.clock.runFor(30_000);
    await expect.poll(() => prepareCount).toBe(2);
    await expect.poll(() => manifestCount).toBe(2);
    expect(heartbeatCount).toBe(1);
    await expect(page.getByText("Varlık:")).toBeVisible({ timeout: 30_000 });

    await page.clock.runFor(30_000);
    await expect(page.getByText("Oturum süresi doldu; çizimi yeniden deneyin.")).toBeVisible();
    expect(heartbeatCount).toBe(2);
    expect(prepareCount, "an expired session cannot start an unbounded prepare loop").toBe(2);
    expect(manifestCount).toBe(2);
    await page.clock.runFor(60_000);
    expect(heartbeatCount).toBe(2);
    expect(prepareCount).toBe(2);
  });

  test("L05 A→B→A gezinmesi ve browser back/forward eski generation isteklerini taşımıyor", async ({ page }) => {
    test.setTimeout(120_000);
    await signInAdmin(page);
    const { fileId: fileA } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements", "l05-history-a.dxf");
    const { fileId: fileB } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements", "l05-history-b.dxf");
    const sceneA = makeBrowserAcceptanceScene("scene_l05_history_a", [1, 0.1, 0.1]);
    const sceneB = makeBrowserAcceptanceScene("scene_l05_history_b", [0.1, 1, 0.1]);
    const sceneByFile = new Map([[fileA, sceneA], [fileB, sceneB]]);
    const sceneRequests = new Map([[sceneA.sceneId, 0], [sceneB.sceneId, 0]]);
    let prepareCount = 0;

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      prepareCount++;
      const body = route.request().postDataJSON() as { fileId: string };
      const scene = sceneByFile.get(body.fileId);
      if (!scene) throw new Error(`Unknown L05 history file: ${body.fileId}`);
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        status: "ready", sceneId: scene.sceneId, viewSessionId: `vs_l05_history_${prepareCount}`,
        sourceVersionKey: scene.manifest.sourceVersionKey,
      }) });
    });
    await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*/heartbeat", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    for (const scene of [sceneA, sceneB]) {
      await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
      });
      await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
        sceneRequests.set(scene.sceneId, (sceneRequests.get(scene.sceneId) ?? 0) + 1);
        const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
        const chunk = scene.chunks.get(chunkId);
        if (!chunk) throw new Error(`Unknown L05 history chunk: ${chunkId}`);
        await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
      });
    }

    const assertScene = async (fileId: string) => {
      await expect(page).toHaveURL(new RegExp(`/dokumantasyon/dosya/${fileId}\\?cadEngine=v2$`));
      await expect(page.getByText("Varlık:")).toBeVisible({ timeout: 30_000 });
    };
    await page.goto(`/dokumantasyon/dosya/${fileA}?cadEngine=v2`);
    await assertScene(fileA);
    await page.goto(`/dokumantasyon/dosya/${fileB}?cadEngine=v2`);
    await assertScene(fileB);
    await page.goBack();
    await assertScene(fileA);
    await page.goForward();
    await assertScene(fileB);

    expect(prepareCount).toBe(4);
    expect(sceneRequests.get(sceneA.sceneId)).toBeGreaterThanOrEqual(2);
    expect(sceneRequests.get(sceneB.sceneId)).toBeGreaterThanOrEqual(2);
    expect(await page.locator('[data-v2-phase="ready"]').count()).toBe(1);
  });

  test("L05 offline→online ve background→resume geçişleri sınırlı isteği sürdürür", async ({ page, context }) => {
    test.setTimeout(90_000);
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements", "l05-network-visibility.dxf");
    const scene = makeBrowserAcceptanceScene("scene_l05_network_visibility");
    const validChunk = scene.chunks.get("chunk_100")!;
    let chunkCount = 0;
    let heartbeatCount = 0;
    let visibilityState: "visible" | "hidden" = "visible";

    await page.clock.install();
    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        status: "ready", sceneId: scene.sceneId, viewSessionId: "vs_l05_network_visibility",
        sourceVersionKey: scene.manifest.sourceVersionKey,
      }) });
    });
    await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*/heartbeat", async (route) => {
      heartbeatCount++;
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.route("**/api/dokumantasyon/cad-v2/view-sessions/*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
      chunkCount++;
      if (chunkCount === 1) {
        await context.setOffline(true);
        await route.abort("failed");
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(validChunk) });
    });

    await page.addInitScript(() => {
      let state: DocumentVisibilityState = "visible";
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
      Object.defineProperty(window, "__setCadTestVisibility", {
        configurable: true,
        value: (next: DocumentVisibilityState) => { state = next; document.dispatchEvent(new Event("visibilitychange")); },
      });
    });
    await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
    await expect.poll(() => chunkCount).toBe(1);
    expect(await page.evaluate(() => navigator.onLine)).toBe(false);
    await context.setOffline(false);
    expect(await page.evaluate(() => navigator.onLine)).toBe(true);
    await page.clock.runFor(400);
    await expect(page.getByText("Varlık:")).toBeVisible({ timeout: 30_000 });
    expect(chunkCount).toBe(2);

    const setVisibility = (next: "visible" | "hidden") => page.evaluate((value) => {
      (window as Window & { __setCadTestVisibility?: (state: DocumentVisibilityState) => void })
        .__setCadTestVisibility?.(value);
    }, next);
    const heartbeatBaseline = heartbeatCount;
    await setVisibility("hidden");
    expect(await page.evaluate(() => document.visibilityState)).toBe("hidden");
    await page.clock.runFor(59_999);
    expect(heartbeatCount).toBe(heartbeatBaseline);
    await page.clock.runFor(2);
    await expect.poll(() => heartbeatCount).toBe(heartbeatBaseline + 1);
    await setVisibility("visible");
    await page.clock.runFor(29_999);
    expect(heartbeatCount).toBe(heartbeatBaseline + 1);
    await page.clock.runFor(2);
    await expect.poll(() => heartbeatCount).toBe(heartbeatBaseline + 2);
  });

  test("legacy ve dosya listesi geçişi için F08 DOM sayaç kontrolü", async ({ page }) => {
    test.setTimeout(120_000);
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements", "f08-legacy-control.dxf");
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Performance.enable");
    const samples: Array<{ cycle: number; jsHeapUsedBytes: number; domNodes: number; liveDomElements: number; jsEventListeners: number }> = [];
    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    for (let cycle = 1; cycle <= 10; cycle++) {
      await expect(page.getByTestId("document-studio-shell")).toBeVisible({ timeout: 30_000 });
      await page.locator('[data-command-id="studio.back"]').click();
      await expect(page).toHaveURL(/\/dokumantasyon(?:\?.*)?$/);
      await expect(page.locator(`a[data-testid="dok-file-name"][href="/dokumantasyon/dosya/${fileId}"]`)).toBeVisible();
      await cdp.send("HeapProfiler.collectGarbage");
      const metrics = await cdp.send("Performance.getMetrics");
      const dom = await cdp.send("Memory.getDOMCounters");
      samples.push({
        cycle,
        jsHeapUsedBytes: metrics.metrics.find((entry: { name: string }) => entry.name === "JSHeapUsedSize")?.value,
        domNodes: dom.nodes,
        liveDomElements: await page.evaluate(() => document.getElementsByTagName("*").length),
        jsEventListeners: dom.jsEventListeners,
      });
      if (cycle < 10) await page.locator(`a[data-testid="dok-file-name"][href="/dokumantasyon/dosya/${fileId}"]`).click();
    }
    expect(samples).toHaveLength(10);
    await test.info().attach("f08-legacy-route-control.json", {
      body: Buffer.from(JSON.stringify(samples, null, 2)), contentType: "application/json",
    });
    console.log(`F08 legacy control first/last: ${JSON.stringify([samples[0], samples.at(-1)])}`);
    await cdp.detach();
  });

  test("host yalnız kamera viewport'undaki chunk'ları alır ve zoom sonrası görünür chunk'ı ister", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserViewportFetchScene();
    const sessionId = "vs_r03_viewport_chunk_fetch";
    const requestedChunkIds: string[] = [];

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ready", sceneId: scene.sceneId, viewSessionId: sessionId, sourceVersionKey: scene.manifest.sourceVersionKey }),
      });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/view-sessions/${sessionId}/heartbeat`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ expiresAt: Date.now() + 180_000 }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
      const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
      requestedChunkIds.push(chunkId);
      const chunk = scene.chunks.get(chunkId);
      if (!chunk) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "R03 fixture chunk not found" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
    const input = page.getByLabel("CAD V2 Çizim Etkileşim Alanı");
    await expect(input).toBeVisible({ timeout: 60_000 });
    await expect.poll(() => requestedChunkIds, { timeout: 15_000 }).toContain("chunk_r03_near");
    await expect.poll(() => requestedChunkIds, { timeout: 1_000 }).not.toContain("chunk_r03_far");

    await input.hover();
    await page.mouse.wheel(0, 600);
    await expect.poll(() => requestedChunkIds, { timeout: 15_000 }).toContain("chunk_r03_far");
    expect(requestedChunkIds.filter((id) => id === "chunk_r03_near")).toHaveLength(1);
    expect(requestedChunkIds.filter((id) => id === "chunk_r03_far")).toHaveLength(1);
  });

  test("L08 HATCH statik/legacy fail-closed ve kaynak tabanlı runtime remesh kaliteyi korur", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserHatchRuntimeQualityScene();
    const sessionId = "vs_l08_hatch_runtime_quality";
    let activeScene = scene;

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ status: "ready", sceneId: activeScene.sceneId, viewSessionId: sessionId,
          sourceVersionKey: activeScene.manifest.sourceVersionKey }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/view-sessions/${sessionId}/heartbeat`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ expiresAt: Date.now() + 180_000 }) });
    });
    await page.route("**/api/dokumantasyon/cad-v2/scenes/*/manifest", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(activeScene.manifest) });
    });
    await page.route("**/api/dokumantasyon/cad-v2/scenes/*/chunks/*", async (route) => {
      const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
      const bytes = activeScene.chunks.get(chunkId);
      if (!bytes) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "L08 HATCH fixture chunk not found" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(bytes) });
    });

    await page.addInitScript(() => {
      const events: Array<Record<string, unknown>> = [];
      (window as Window & { __cadV2HatchQualityEvents?: Array<Record<string, unknown>> }).__cadV2HatchQualityEvents = events;
      (window as Window & { __cadV2ResourceDiagnostics?: (event: Record<string, unknown>) => void }).__cadV2ResourceDiagnostics = (event) => {
        if (typeof event.type === "string" && event.type.startsWith("hatch-fill-runtime")) events.push(event);
      };
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
    const canvas = page.locator("canvas").first();
    const host = page.locator("[data-v2-phase]");
    const warning = page.getByTestId("cad-v2-quality-warning");
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await expect(host).toHaveAttribute("data-v2-phase", "ready", { timeout: 30_000 });
    await expect(warning).toBeHidden();
    await expect.poll(() => page.evaluate(() =>
      (window as Window & { __cadV2HatchQualityEvents?: Array<Record<string, unknown>> }).__cadV2HatchQualityEvents?.at(-1)?.status,
    )).toBe("within-budget");

    await page.getByRole("button", { name: "Yakınlaştır (+)" }).click();
    await expect(page.getByText("125%")).toBeVisible();
    await expect.poll(() => page.evaluate(() =>
      (window as Window & { __cadV2HatchQualityEvents?: Array<Record<string, unknown>> }).__cadV2HatchQualityEvents?.at(-1)?.status,
    )).toBe("over-budget");
    await expect(warning).toContainText("Kaynak mesh bulunmadığı için runtime fill remesh uygulanamıyor", { timeout: 20_000 });
    await expect(host).toHaveAttribute("data-v2-phase", "degraded");

    await page.getByRole("button", { name: "Uzaklaştır (-)" }).click();
    await expect(page.getByText("100%")).toBeVisible();
    await expect.poll(() => page.evaluate(() =>
      (window as Window & { __cadV2HatchQualityEvents?: Array<Record<string, unknown>> }).__cadV2HatchQualityEvents?.at(-1)?.status,
    )).toBe("within-budget");
    await expect(warning).toBeHidden({ timeout: 20_000 });
    await expect(host).toHaveAttribute("data-v2-phase", "ready");

    await page.getByRole("button", { name: "Yakınlaştır (+)" }).click();
    await expect(page.getByText("125%")).toBeVisible();
    await expect(warning).toContainText("Kaynak mesh bulunmadığı için runtime fill remesh uygulanamıyor", { timeout: 20_000 });
    await expect(host).toHaveAttribute("data-v2-phase", "degraded");
    const finalScreenshot = await canvas.screenshot();
    const png = PNG.sync.read(finalScreenshot);
    let cyanFillPixelCount = 0;
    for (let offset = 0; offset < png.data.length; offset += 4) {
      const [red, green, blue, alpha] = png.data.subarray(offset, offset + 4);
      if (alpha > 0 && red! < 170 && green! > 160 && blue! > 200) cyanFillPixelCount++;
    }
    expect(cyanFillPixelCount, "degraded warning must keep the HATCH fill visible in the WebGL canvas").toBeGreaterThan(100);
    await test.info().attach("l08-hatch-runtime-quality.json", {
      body: Buffer.from(JSON.stringify(await page.evaluate(() =>
        (window as Window & { __cadV2HatchQualityEvents?: Array<Record<string, unknown>> }).__cadV2HatchQualityEvents ?? [],
      ), null, 2)),
      contentType: "application/json",
    });
    await test.info().attach("l08-hatch-zoomed-fill.png", { body: finalScreenshot, contentType: "image/png" });

    activeScene = makeBrowserHatchRuntimeQualityScene({ includeErrorBound: false });
    await page.reload();
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await expect(warning).toContainText("hata sınırı doğrulanamıyor", { timeout: 30_000 });
    await expect(host).toHaveAttribute("data-v2-phase", "degraded");
    await expect.poll(() => page.evaluate(() =>
      (window as Window & { __cadV2HatchQualityEvents?: Array<Record<string, unknown>> }).__cadV2HatchQualityEvents?.at(-1)?.status,
    )).toBe("unverifiable");
    const legacyCanvasPng = await canvas.screenshot();
    const legacyCanvas = PNG.sync.read(legacyCanvasPng);
    let legacyCyanPixelCount = 0;
    for (let offset = 0; offset < legacyCanvas.data.length; offset += 4) {
      const [red, green, blue, alpha] = legacyCanvas.data.subarray(offset, offset + 4);
      if (alpha > 0 && red! < 170 && green! > 160 && blue! > 200) legacyCyanPixelCount++;
    }
    expect(legacyCyanPixelCount, "an unverifiable legacy manifest must keep its HATCH visible while degraded").toBeGreaterThan(100);

    activeScene = makeBrowserHatchRuntimeSourceScene();
    await page.reload();
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await expect.poll(() => page.evaluate(() =>
      (window as Window & { __cadV2HatchQualityEvents?: Array<Record<string, unknown>> }).__cadV2HatchQualityEvents
        ?.some((event) => event.type === "hatch-fill-runtime-refinement" && event.status === "replaced"),
    ), { timeout: 30_000 }).toBe(true);
    await expect(host).toHaveAttribute("data-v2-phase", "ready", { timeout: 30_000 });
    await expect(warning).toBeHidden();
    const firstRefinement = await page.evaluate(() =>
      (window as Window & { __cadV2HatchQualityEvents?: Array<Record<string, unknown>> }).__cadV2HatchQualityEvents
        ?.filter((event) => event.type === "hatch-fill-runtime-refinement" && event.status === "replaced")[0] ?? null,
    ) as { unitsPerCssPixel: number; triangleCount: number; errorWorld: number; requestedErrorWorld: number } | null;
    expect(firstRefinement, "host must atomically replace the source-backed HATCH mesh after worker remeshing").not.toBeNull();
    expect(firstRefinement!.errorWorld).toBeLessThanOrEqual(firstRefinement!.requestedErrorWorld * (1 + 1e-12));

    await page.getByRole("button", { name: "Yakınlaştır (+)" }).click();
    await expect(page.getByText("125%")).toBeVisible();
    await expect.poll(() => page.evaluate((previousUnits) => {
      return (window as Window & { __cadV2HatchQualityEvents?: Array<Record<string, unknown>> }).__cadV2HatchQualityEvents
        ?.some((event) => event.type === "hatch-fill-runtime-refinement" && event.status === "replaced" &&
          typeof event.unitsPerCssPixel === "number" && event.unitsPerCssPixel < previousUnits * 0.9);
    }, firstRefinement!.unitsPerCssPixel), { timeout: 30_000 }).toBe(true);
    const zoomedRefinement = await page.evaluate(() =>
      (window as Window & { __cadV2HatchQualityEvents?: Array<Record<string, unknown>> }).__cadV2HatchQualityEvents
        ?.filter((event) => event.type === "hatch-fill-runtime-refinement" && event.status === "replaced").at(-1) ?? null,
    ) as { triangleCount: number } | null;
    expect(zoomedRefinement?.triangleCount).toBeGreaterThan(firstRefinement!.triangleCount);
    await expect.poll(() => page.evaluate(() =>
      (window as Window & { __cadV2HatchQualityEvents?: Array<Record<string, unknown>> }).__cadV2HatchQualityEvents
        ?.filter((event) => event.type === "hatch-fill-runtime-quality").at(-1)?.status,
    )).toBe("within-budget");
    await expect(host).toHaveAttribute("data-v2-phase", "ready");
    const refinedCanvas = PNG.sync.read(await canvas.screenshot());
    let refinedFillPixelCount = 0;
    for (let offset = 0; offset < refinedCanvas.data.length; offset += 4) {
      const [red, green, blue, alpha] = refinedCanvas.data.subarray(offset, offset + 4);
      if (alpha! > 0 && red! < 120 && green! > 100 && blue! > 150) refinedFillPixelCount++;
    }
    expect(refinedFillPixelCount, "successful runtime replacement must keep the curved HATCH visibly filled").toBeGreaterThan(100);
  });

  test("L11 worker cache kapasitesi gerçek bellek sayılmaz; eğri ve kaynak HATCH remesh'i sürer", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserCurveHatchPreflightBudgetScene();
    const sessionId = "vs_l11_curve_hatch_preflight_budget";
    const pressureChunkIds = new Set(Array.from({ length: scene.pressureChunkCount }, (_, index) =>
      `chunk_l11_pressure_${String(index).padStart(2, "0")}`));
    const acceptedPressureChunkIds = new Set<string>();
    let resolvePressureAdmissions!: () => void;
    const pressureAdmissionsReady = new Promise<void>((resolve) => { resolvePressureAdmissions = resolve; });

    await page.exposeBinding("__l11ReportChunkAdmission", (_source, event: unknown) => {
      const diagnostic = event as { type?: unknown; chunkId?: unknown; status?: unknown };
      if (diagnostic.type === "chunk-load-outcome" && diagnostic.status === "accepted" &&
          typeof diagnostic.chunkId === "string" && pressureChunkIds.has(diagnostic.chunkId)) {
        acceptedPressureChunkIds.add(diagnostic.chunkId);
        if (acceptedPressureChunkIds.size === pressureChunkIds.size) resolvePressureAdmissions();
      }
    });
    await page.addInitScript(() => {
      const events: Array<Record<string, unknown>> = [];
      const resourceEvents: Array<Record<string, unknown>> = [];
      const curveWarnings: string[] = [];
      const curveRefinementRequests: number[] = [];
      const phaseEvents: string[] = [];
      const target = window as Window & {
        __cadV2HatchQualityEvents?: Array<Record<string, unknown>>;
        __cadV2ResourceDiagnostics?: (event: Record<string, unknown>) => void;
        __l11ReportChunkAdmission?: (event: unknown) => Promise<void>;
        __l11CurveRefinementRequests?: number[];
        __l11ResourceEvents?: Array<Record<string, unknown>>;
        __l11CurveWarnings?: string[];
        __l11PhaseEvents?: string[];
      };
      target.__cadV2HatchQualityEvents = events;
      target.__l11CurveRefinementRequests = curveRefinementRequests;
      target.__l11ResourceEvents = resourceEvents;
      target.__l11CurveWarnings = curveWarnings;
      target.__l11PhaseEvents = phaseEvents;
      target.__cadV2ResourceDiagnostics = (event) => {
        resourceEvents.push(event);
        if (typeof event.type === "string" && event.type.startsWith("hatch-fill-runtime")) events.push(event);
        if (event.type === "chunk-load-outcome") void target.__l11ReportChunkAdmission?.(event);
      };
      const nativePostMessage = Worker.prototype.postMessage;
      Worker.prototype.postMessage = function(message: unknown, transfer?: Transferable[]) {
        if (message && typeof message === "object" && (message as { kind?: string }).kind === "refine-curves") {
          curveRefinementRequests.push(performance.now());
        }
        return nativePostMessage.call(this, message, transfer ?? []);
      };
      const observeRuntimeState = () => {
        const warning = document.querySelector('[data-testid="cad-v2-quality-warning"]')?.textContent ?? "";
        if (warning.includes("Eğri iyileştirmesi")) {
          curveWarnings.push(warning);
        }
        const phase = document.querySelector("[data-v2-phase]")?.getAttribute("data-v2-phase");
        if (phase && phaseEvents.at(-1) !== phase) phaseEvents.push(phase);
      };
      const observer = new MutationObserver(observeRuntimeState);
      observer.observe(document, { childList: true, subtree: true, characterData: true, attributes: true,
        attributeFilter: ["data-v2-phase"] });
      observeRuntimeState();
    });

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ status: "ready", sceneId: scene.sceneId, viewSessionId: sessionId,
          sourceVersionKey: scene.manifest.sourceVersionKey }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/view-sessions/${sessionId}/heartbeat`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ expiresAt: Date.now() + 180_000 }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
      const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
      const bytes = scene.chunks.get(chunkId);
      if (!bytes) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: `L11 chunk missing: ${chunkId}` }) });
        return;
      }
      if (chunkId === scene.combinedChunkId) {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        try {
          await Promise.race([pressureAdmissionsReady, new Promise<never>((_, reject) => {
            timeout = setTimeout(() => reject(new Error("L11 pressure chunks were not admitted before the combined refinement chunk")), 30_000);
          })]);
        } finally {
          if (timeout) clearTimeout(timeout);
        }
      }
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(bytes) });
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
    const canvas = page.locator("canvas").first();
    const host = page.locator("[data-v2-phase]");
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await expect.poll(() => page.evaluate((chunkId) =>
      (window as Window & { __l11ResourceEvents?: Array<Record<string, unknown>> }).__l11ResourceEvents
        ?.some((event) => event.type === "chunk-load-outcome" && event.chunkId === chunkId && event.status === "accepted"),
    scene.combinedChunkId), { timeout: 30_000 }).toBe(true);
    const preflightProbe = await page.evaluate(() => ({
      events: (window as Window & { __l11ResourceEvents?: Array<Record<string, unknown>> }).__l11ResourceEvents ?? [],
      warnings: (window as Window & { __l11CurveWarnings?: string[] }).__l11CurveWarnings ?? [],
      curveRefinementRequests: (window as Window & { __l11CurveRefinementRequests?: number[] }).__l11CurveRefinementRequests ?? [],
      phases: (window as Window & { __l11PhaseEvents?: string[] }).__l11PhaseEvents ?? [],
      hatchEvents: (window as Window & { __cadV2HatchQualityEvents?: Array<Record<string, unknown>> }).__cadV2HatchQualityEvents ?? [],
    }));
    await test.info().attach("l11-curve-hatch-preflight-probe.json", {
      body: Buffer.from(JSON.stringify(preflightProbe, null, 2)), contentType: "application/json",
    });
    await expect.poll(() => page.evaluate(() =>
      (window as Window & { __l11CurveRefinementRequests?: number[] }).__l11CurveRefinementRequests?.length ?? 0,
    ), { timeout: 30_000 }).toBeGreaterThan(0);
    await expect.poll(() => page.evaluate((chunkId) =>
      (window as Window & { __cadV2HatchQualityEvents?: Array<Record<string, unknown>> }).__cadV2HatchQualityEvents
        ?.some((event) => event.type === "hatch-fill-runtime-refinement" && event.status === "replaced" && event.chunkId === chunkId),
    scene.combinedChunkId), { timeout: 30_000 }).toBe(true);
    await expect(host).toHaveAttribute("data-v2-phase", "ready", { timeout: 20_000 });

    const diagnostics = await page.evaluate(() => ({
      events: (window as Window & { __l11ResourceEvents?: Array<Record<string, unknown>> }).__l11ResourceEvents ?? [],
      warnings: (window as Window & { __l11CurveWarnings?: string[] }).__l11CurveWarnings ?? [],
      curveRefinementRequests: (window as Window & { __l11CurveRefinementRequests?: number[] }).__l11CurveRefinementRequests ?? [],
      phases: (window as Window & { __l11PhaseEvents?: string[] }).__l11PhaseEvents ?? [],
      hatchEvents: (window as Window & { __cadV2HatchQualityEvents?: Array<Record<string, unknown>> }).__cadV2HatchQualityEvents ?? [],
    }));
    const targetAdmission = diagnostics.events.find((event) =>
      event.type === "chunk-load-outcome" && event.chunkId === scene.combinedChunkId && event.status === "accepted",
    ) as { cpuResidentBytes?: number; cpuBudgetBytes?: number; gpuBufferBytesEstimate?: number;
      gpuBudgetBytes?: number; retainedRefinementSourceBytesIfAccepted?: number } | undefined;
    expect(targetAdmission, "curve/HATCH fixture must be admitted before its refinement pass").toBeDefined();
    expect(targetAdmission!.retainedRefinementSourceBytesIfAccepted).toBeGreaterThan(0);
    expect(targetAdmission!.cpuResidentBytes).toBeLessThanOrEqual(targetAdmission!.cpuBudgetBytes!);
    expect(targetAdmission!.gpuBufferBytesEstimate).toBeLessThanOrEqual(targetAdmission!.gpuBudgetBytes!);
    expect(diagnostics.curveRefinementRequests.length,
      "the unused capacity of the worker source cache must not reject this fitting curve pass").toBeGreaterThan(0);
    expect(diagnostics.warnings, "the fitting curve pass must not be rejected by an unallocated cache budget").toEqual([]);
    expect(diagnostics.phases).toContain("ready");
    expect(diagnostics.hatchEvents.some((event) => event.type === "hatch-fill-runtime-refinement" &&
      event.status === "replaced" && event.chunkId === scene.combinedChunkId),
    "the same admitted chunk must complete HATCH worker remesh after curve refinement").toBe(true);
    const hatchReplacement = diagnostics.hatchEvents.find((event) => event.type === "hatch-fill-runtime-refinement" &&
      event.status === "replaced" && event.chunkId === scene.combinedChunkId) as {
        errorWorld?: number; requestedErrorWorld?: number; peakCpuBytes?: number; peakGpuBufferBytesEstimate?: number;
      } | undefined;
    expect(hatchReplacement!.errorWorld).toBeLessThanOrEqual(hatchReplacement!.requestedErrorWorld! * (1 + 1e-12));
    expect(hatchReplacement!.peakCpuBytes).toBeLessThanOrEqual(64 * 1024 * 1024);
    expect(hatchReplacement!.peakGpuBufferBytesEstimate).toBeLessThanOrEqual(64 * 1024 * 1024);

    const finalScreenshot = await canvas.screenshot();
    const png = PNG.sync.read(finalScreenshot);
    let filledPixelCount = 0;
    for (let offset = 0; offset < png.data.length; offset += 4) {
      const [red, green, blue, alpha] = png.data.subarray(offset, offset + 4);
      if (alpha! > 0 && red! < 120 && green! > 100 && blue! > 150) filledPixelCount++;
    }
    expect(filledPixelCount, "same-chunk curve and HATCH refinement must keep filled pixels visible").toBeGreaterThan(100);
    await test.info().attach("l11-curve-hatch-preflight.json", {
      body: Buffer.from(JSON.stringify({
        compilerRevision: CAD_V2_COMPILER_REVISION,
        acceptedPressureChunkCount: acceptedPressureChunkIds.size,
        targetAdmission,
        curveRefinementRequests: diagnostics.curveRefinementRequests.length,
        curveWarnings: diagnostics.warnings,
        phaseEvents: diagnostics.phases,
        hatchEvent: diagnostics.hatchEvents.find((event) => event.type === "hatch-fill-runtime-refinement" &&
          event.status === "replaced" && event.chunkId === scene.combinedChunkId),
        filledPixelCount,
      }, null, 2)),
      contentType: "application/json",
    });
    await test.info().attach("l11-curve-hatch-preflight.png", { body: finalScreenshot, contentType: "image/png" });
  });

  test("L08 unsupported patterned HATCH keeps its boundary and never paints a solid fill", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserHatchPatternScene();
    const sessionId = "vs_l08_unsupported_hatch_pattern";

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ status: "ready", sceneId: scene.sceneId, viewSessionId: sessionId,
          sourceVersionKey: scene.manifest.sourceVersionKey }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/view-sessions/${sessionId}/heartbeat`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ expiresAt: Date.now() + 180_000 }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
      const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
      const bytes = scene.chunks.get(chunkId);
      if (!bytes) {
        await route.fulfill({ status: 404, contentType: "application/json",
          body: JSON.stringify({ error: "L08 patterned HATCH fixture chunk not found" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(bytes) });
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
    const canvas = page.locator("canvas").first();
    const host = page.locator("[data-v2-phase]");
    const warning = page.getByTestId("cad-v2-quality-warning");
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await expect(host).toHaveAttribute("data-v2-phase", "degraded", { timeout: 30_000 });
    await expect(warning).toBeVisible();

    const screenshot = PNG.sync.read(await canvas.screenshot());
    let boundaryInkPixels = 0;
    let centerInkPixels = 0;
    const centerX = Math.floor(screenshot.width / 2);
    const centerY = Math.floor(screenshot.height / 2);
    for (let y = 0; y < screenshot.height; y++) {
      for (let x = 0; x < screenshot.width; x++) {
        const offset = (y * screenshot.width + x) * 4;
        const red = screenshot.data[offset]!;
        const green = screenshot.data[offset + 1]!;
        const blue = screenshot.data[offset + 2]!;
        const ink = Math.max(red, green, blue) > 115;
        if (ink) boundaryInkPixels++;
        if (ink && Math.abs(x - centerX) <= 8 && Math.abs(y - centerY) <= 8) centerInkPixels++;
      }
    }
    expect(boundaryInkPixels, "the HATCH boundary must remain visible in the real WebGL canvas").toBeGreaterThan(50);
    expect(centerInkPixels, "unsupported ANSI31 geometry must not be painted as solid fill").toBeLessThan(5);
  });

  test("L08 bounded patterned HATCH linework renders while retaining degraded parity quality", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserHatchPatternScene(true);
    const sessionId = "vs_l08_patterned_hatch_render";

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ status: "ready", sceneId: scene.sceneId, viewSessionId: sessionId,
          sourceVersionKey: scene.manifest.sourceVersionKey }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/view-sessions/${sessionId}/heartbeat`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ expiresAt: Date.now() + 180_000 }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
      const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
      const bytes = scene.chunks.get(chunkId);
      if (!bytes) {
        await route.fulfill({ status: 404, contentType: "application/json",
          body: JSON.stringify({ error: "L08 bounded pattern fixture chunk not found" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(bytes) });
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
    const canvas = page.locator("canvas").first();
    const host = page.locator("[data-v2-phase]");
    const warning = page.getByTestId("cad-v2-quality-warning");
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await expect(host).toHaveAttribute("data-v2-phase", "degraded", { timeout: 30_000 });
    await expect(warning).toBeVisible();

    const screenshot = PNG.sync.read(await canvas.screenshot());
    let interiorPatternInkPixels = 0;
    for (let y = Math.floor(screenshot.height * 0.25); y < Math.floor(screenshot.height * 0.75); y++) {
      for (let x = Math.floor(screenshot.width * 0.2); x < Math.floor(screenshot.width * 0.8); x++) {
        const offset = (y * screenshot.width + x) * 4;
        const red = screenshot.data[offset]!;
        const green = screenshot.data[offset + 1]!;
        const blue = screenshot.data[offset + 2]!;
        if (Math.max(red, green, blue) > 115) interiorPatternInkPixels++;
      }
    }
    expect(interiorPatternInkPixels, "bounded HATCH pattern strokes must paint the real WebGL canvas interior").toBeGreaterThan(0);
  });

  test("aktif pafta yalnız görünür fill ve glyph chunk'larını ister", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserActivePaperFetchScene();
    const sessionId = "vs_r05_active_paper_fetch";
    const requestedChunkIds: string[] = [];

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ status: "ready", sceneId: scene.sceneId,
          viewSessionId: sessionId, sourceVersionKey: scene.manifest.sourceVersionKey }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/view-sessions/${sessionId}/heartbeat`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ expiresAt: Date.now() + 180_000 }) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
      const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
      requestedChunkIds.push(chunkId);
      const chunk = scene.chunks.get(chunkId);
      if (!chunk) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "R05 fixture chunk not found" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
    const picker = page.getByRole("combobox", { name: "Pafta seçimi" });
    await expect(picker).toBeVisible({ timeout: 60_000 });
    await expect.poll(() => requestedChunkIds, { timeout: 15_000 }).toContain("chunk_r05_model");
    await expect.poll(() => requestedChunkIds, { timeout: 1_000 }).not.toContain("chunk_r05_a_fill");
    expect(requestedChunkIds).not.toContain("chunk_r05_b_glyph");

    await picker.selectOption("SHEET_A");
    await expect.poll(() => requestedChunkIds, { timeout: 15_000 }).toContain("chunk_r05_a_fill");
    expect(requestedChunkIds).not.toContain("chunk_r05_a_glyph_far");
    expect(requestedChunkIds).not.toContain("chunk_r05_b_glyph");

    const input = page.getByLabel("CAD V2 Çizim Etkileşim Alanı");
    await input.hover();
    await page.mouse.wheel(0, 600);
    await expect.poll(() => requestedChunkIds, { timeout: 15_000 }).toContain("chunk_r05_a_glyph_far");

    await picker.selectOption("SHEET_B");
    await expect.poll(() => requestedChunkIds, { timeout: 15_000 }).toContain("chunk_r05_b_glyph");
    for (const chunkId of ["chunk_r05_model", "chunk_r05_a_fill", "chunk_r05_a_glyph_far", "chunk_r05_b_glyph"]) {
      expect(requestedChunkIds.filter((id) => id === chunkId)).toHaveLength(1);
    }
  });

  test("canlı zoom, stale yanıt ve aynı bucket pan davranışını doğrular", async ({ page }) => {
    test.setTimeout(180_000);
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserCurveRefinementScene();
    const sessionId = "vs_f07_camera_curve_refinement";

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ready", sceneId: scene.sceneId, viewSessionId: sessionId, sourceVersionKey: scene.manifest.sourceVersionKey }),
      });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
      const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
      const chunk = scene.chunks.get(chunkId);
      if (!chunk) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "F07 fixture chunk not found" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
    });

    await page.addInitScript(() => {
      const heldResponses: MessageEvent[] = [];
      let deliverResponse: ((event: MessageEvent) => void) | null = null;
      const state = {
        refinementRequests: 0,
        targetErrors: [] as number[],
        heldRefinementResponses: 0,
        maxLineVertexCount: 0,
        releaseNextRefinementResponse: () => {
          const event = heldResponses.shift();
          if (!event || !deliverResponse) throw new Error("No held F07 refinement response is available");
          state.heldRefinementResponses = heldResponses.length;
          deliverResponse(event);
        },
      };
      (window as Window & { __cadV2F07?: typeof state }).__cadV2F07 = state;
      const NativeWorker = window.Worker;
      window.Worker = new Proxy(NativeWorker, {
        construct(target, args, newTarget) {
          const worker = Reflect.construct(target, args, newTarget) as Worker;
          let onmessage: ((this: Worker, event: MessageEvent) => unknown) | null = null;
          Object.defineProperty(worker, "onmessage", {
            configurable: true,
            get: () => onmessage,
            set: (handler: ((this: Worker, event: MessageEvent) => unknown) | null) => { onmessage = handler; },
          });
          deliverResponse = (event) => { onmessage?.call(worker, event); };
          worker.addEventListener("message", (event) => {
            if ((event.data as { kind?: string })?.kind === "refined-curves") {
              heldResponses.push(event);
              state.heldRefinementResponses = heldResponses.length;
              return;
            }
            onmessage?.call(worker, event);
          });
          return worker;
        },
      });
      const workerPostMessage = Worker.prototype.postMessage;
      Worker.prototype.postMessage = function(message: unknown, transfer?: Transferable[]) {
        if (message && typeof message === "object") {
          const kind = (message as { kind?: string }).kind;
          if (kind === "refine-curves") {
            state.refinementRequests++;
            const target = (message as { payload?: { targetErrorCssPixels?: number } }).payload?.targetErrorCssPixels;
            if (typeof target === "number") state.targetErrors.push(target);
          }
        }
        return workerPostMessage.call(this, message, transfer ?? []);
      };
      const drawArrays = WebGL2RenderingContext.prototype.drawArrays;
      WebGL2RenderingContext.prototype.drawArrays = function(mode: number, first: number, count: number) {
        if (mode === 0x0001) state.maxLineVertexCount = Math.max(state.maxLineVertexCount, count);
        return drawArrays.call(this, mode, first, count);
      };
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
    const canvas = page.locator("canvas").first();
    const readFrame = async () => crypto.createHash("sha256").update(await canvas.screenshot()).digest("hex");
    const dragDrawing = async () => {
      const input = page.getByLabel("CAD V2 Çizim Etkileşim Alanı");
      const bounds = await input.boundingBox();
      expect(bounds).not.toBeNull();
      await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
      await page.mouse.down();
      await page.mouse.move(bounds!.x + bounds!.width / 2 + 48, bounds!.y + bounds!.height / 2 + 24, { steps: 4 });
      await page.mouse.up();
      return { x: 48, y: 24 };
    };
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText("Varlık:")).toBeVisible({ timeout: 60_000 });
    await expect.poll(() => page.evaluate(() => (window as Window & { __cadV2F07?: { refinementRequests: number; maxLineVertexCount: number } }).__cadV2F07?.maxLineVertexCount ?? 0),
      { timeout: 15_000 }).toBeGreaterThanOrEqual(2);

    // Let the initial fit camera settle through both profiles before measuring user zoom behavior.
    let initialCameraStable = false;
    for (let attempt = 0; attempt < 5 && !initialCameraStable; attempt++) {
      await expect.poll(() => page.evaluate(() => (window as Window & { __cadV2F07?: { heldRefinementResponses: number } }).__cadV2F07?.heldRefinementResponses ?? 0),
        { timeout: 15_000 }).toBeGreaterThan(0);
      await page.evaluate(() => {
        const state = (window as Window & { __cadV2F07?: { heldRefinementResponses: number; releaseNextRefinementResponse: () => void } }).__cadV2F07!;
        while (state.heldRefinementResponses > 0) state.releaseNextRefinementResponse();
      });
      await page.waitForTimeout(750);
      const snapshot = await page.evaluate(() => (window as Window & { __cadV2F07?: { refinementRequests: number; heldRefinementResponses: number; targetErrors: number[] } }).__cadV2F07!);
      const lastProfileIsIdle = snapshot.targetErrors.at(-1) === 0.25;
      if (snapshot.heldRefinementResponses === 0 && lastProfileIsIdle) {
        await page.waitForTimeout(750);
        const quietSnapshot = await page.evaluate(() => (window as Window & { __cadV2F07?: { refinementRequests: number; heldRefinementResponses: number } }).__cadV2F07!);
        initialCameraStable = quietSnapshot.heldRefinementResponses === 0 && quietSnapshot.refinementRequests === snapshot.refinementRequests;
      }
    }
    expect(initialCameraStable, "initial fit refinement should settle at idle profile before the zoom oracle").toBe(true);
    const settledRefinement = await page.evaluate(() =>
      (window as Window & { __cadV2F07?: { targetErrors: number[]; maxLineVertexCount: number } }).__cadV2F07!);
    expect(settledRefinement.targetErrors.at(-1)).toBe(0.25);
    expect(settledRefinement.maxLineVertexCount).toBeGreaterThan(2);

    const renderedArcError = await page.evaluate(measureF07ArcRasterError, {
      screenshotBase64: (await canvas.screenshot()).toString("base64"),
      zoomFactor: 1,
    });
    expect(renderedArcError.bluePixelCount).toBeGreaterThan(50);
    // The independent quarter-circle projection must contain the rasterized one-pixel
    // WebGL line within the 0.25 CSS px refinement budget plus a 1 px raster envelope.
    expect(renderedArcError.maximumArcDistanceCssPixels,
      `rendered arc pixels exceeded the projected source envelope: ${JSON.stringify(renderedArcError)}`)
      .toBeLessThanOrEqual(1.25);
    expect(renderedArcError.maximumSourceArcToPixelDistanceCssPixels,
      `projected source arc had a raster coverage gap: ${JSON.stringify(renderedArcError)}`)
      .toBeLessThanOrEqual(1.25);
    console.log(`F07 runtime-refined WebGL arc pixel envelope PASS: ${JSON.stringify(renderedArcError)}`);

    const zoomOutBaseline = await page.evaluate(() => {
      const state = (window as Window & { __cadV2F07?: { refinementRequests: number; targetErrors: number[] } }).__cadV2F07!;
      return { refinementRequests: state.refinementRequests, targetErrorCount: state.targetErrors.length };
    });
    await page.getByRole("button", { name: "Uzaklaştır (-)" }).click();
    await expect(page.getByText("80%")).toBeVisible();
    let zoomOutRefinementStable = false;
    for (let attempt = 0; attempt < 5 && !zoomOutRefinementStable; attempt++) {
      await expect.poll(() => page.evaluate(() =>
        (window as Window & { __cadV2F07?: { heldRefinementResponses: number } }).__cadV2F07!.heldRefinementResponses,
      ), { timeout: 15_000 }).toBeGreaterThan(0);
      await page.evaluate(() => {
        const state = (window as Window & { __cadV2F07?: { heldRefinementResponses: number; releaseNextRefinementResponse: () => void } }).__cadV2F07!;
        while (state.heldRefinementResponses > 0) state.releaseNextRefinementResponse();
      });
      await page.waitForTimeout(750);
      const snapshot = await page.evaluate((baseline) => {
        const state = (window as Window & { __cadV2F07?: { refinementRequests: number; heldRefinementResponses: number; targetErrors: number[] } }).__cadV2F07!;
        return {
          refinementRequests: state.refinementRequests,
          heldRefinementResponses: state.heldRefinementResponses,
          targetErrors: state.targetErrors.slice(baseline),
        };
      }, zoomOutBaseline.targetErrorCount);
      const idleProfileApplied = snapshot.targetErrors.includes(0.75) && snapshot.targetErrors.at(-1) === 0.25;
      if (snapshot.heldRefinementResponses === 0 && idleProfileApplied) {
        await page.waitForTimeout(750);
        const quietSnapshot = await page.evaluate(() =>
          (window as Window & { __cadV2F07?: { refinementRequests: number; heldRefinementResponses: number } }).__cadV2F07!);
        zoomOutRefinementStable = quietSnapshot.heldRefinementResponses === 0 &&
          quietSnapshot.refinementRequests === snapshot.refinementRequests;
      }
    }
    expect(zoomOutRefinementStable, "80% zoom should settle after all transient and idle refinement responses").toBe(true);
    const zoomOutState = await page.evaluate((baseline) => {
      const state = (window as Window & { __cadV2F07?: { refinementRequests: number; targetErrors: number[]; heldRefinementResponses: number } }).__cadV2F07!;
      return {
        refinementRequests: state.refinementRequests,
        targetErrors: state.targetErrors.slice(baseline),
        heldRefinementResponses: state.heldRefinementResponses,
      };
    }, zoomOutBaseline.targetErrorCount);
    expect(zoomOutState.refinementRequests).toBeGreaterThan(zoomOutBaseline.refinementRequests);
    expect(zoomOutState.targetErrors).toContain(0.75);
    expect(zoomOutState.targetErrors.at(-1)).toBe(0.25);
    expect(zoomOutState.heldRefinementResponses).toBe(0);
    const zoomedOutArcError = await page.evaluate(measureF07ArcRasterError, {
      screenshotBase64: (await canvas.screenshot()).toString("base64"),
      zoomFactor: 0.8,
    });
    expect(zoomedOutArcError.bluePixelCount).toBeGreaterThan(50);
    expect(zoomedOutArcError.maximumArcDistanceCssPixels,
      `80% zoom rendered arc pixels exceeded the projected source envelope: ${JSON.stringify(zoomedOutArcError)}`)
      .toBeLessThanOrEqual(1.25);
    expect(zoomedOutArcError.maximumSourceArcToPixelDistanceCssPixels,
      `80% zoom projected source arc had a raster coverage gap: ${JSON.stringify(zoomedOutArcError)}`)
      .toBeLessThanOrEqual(1.25);
    console.log(`F07 80% runtime-refined WebGL arc pixel envelope PASS: ${JSON.stringify(zoomedOutArcError)}`);

    const beforeFitFrame = await readFrame();
    await page.getByRole("button", { name: "Çizimi Sığdır (F)" }).click();
    await expect(page.getByText("100%")).toBeVisible();
    await expect.poll(readFrame, { timeout: 5_000 }).not.toBe(beforeFitFrame);
    await page.waitForTimeout(250);

    const zoomProfileBaseline = await page.evaluate(() => {
      const state = (window as Window & { __cadV2F07?: { refinementRequests: number; targetErrors: number[] } }).__cadV2F07!;
      return { refinementRequests: state.refinementRequests, targetErrorCount: state.targetErrors.length };
    });
    await page.getByRole("button", { name: "Yakınlaştır (+)" }).click();
    await expect(page.getByText("125%")).toBeVisible();
    let zoomRefinementStable = false;
    for (let attempt = 0; attempt < 5 && !zoomRefinementStable; attempt++) {
      await expect.poll(() => page.evaluate(() =>
        (window as Window & { __cadV2F07?: { heldRefinementResponses: number } }).__cadV2F07!.heldRefinementResponses,
      ), { timeout: 15_000 }).toBeGreaterThan(0);
      await page.evaluate(() => {
        const state = (window as Window & { __cadV2F07?: { heldRefinementResponses: number; releaseNextRefinementResponse: () => void } }).__cadV2F07!;
        while (state.heldRefinementResponses > 0) state.releaseNextRefinementResponse();
      });
      await page.waitForTimeout(750);
      const snapshot = await page.evaluate((baseline) => {
        const state = (window as Window & { __cadV2F07?: { refinementRequests: number; heldRefinementResponses: number; targetErrors: number[] } }).__cadV2F07!;
        return {
          refinementRequests: state.refinementRequests,
          heldRefinementResponses: state.heldRefinementResponses,
          targetErrors: state.targetErrors.slice(baseline),
        };
      }, zoomProfileBaseline.targetErrorCount);
      const idleProfileApplied = snapshot.targetErrors.includes(0.75) && snapshot.targetErrors.at(-1) === 0.25;
      if (snapshot.heldRefinementResponses === 0 && idleProfileApplied) {
        await page.waitForTimeout(750);
        const quietSnapshot = await page.evaluate(() =>
          (window as Window & { __cadV2F07?: { refinementRequests: number; heldRefinementResponses: number } }).__cadV2F07!);
        zoomRefinementStable = quietSnapshot.heldRefinementResponses === 0 &&
          quietSnapshot.refinementRequests === snapshot.refinementRequests;
      }
    }
    expect(zoomRefinementStable, "125% zoom should settle after all transient and idle refinement responses").toBe(true);
    const zoomProfileState = await page.evaluate((baseline) => {
      const state = (window as Window & { __cadV2F07?: { refinementRequests: number; targetErrors: number[]; heldRefinementResponses: number; maxLineVertexCount: number } }).__cadV2F07!;
      return {
        refinementRequests: state.refinementRequests,
        targetErrors: state.targetErrors.slice(baseline),
        heldRefinementResponses: state.heldRefinementResponses,
        maxLineVertexCount: state.maxLineVertexCount,
      };
    }, zoomProfileBaseline.targetErrorCount);
    expect(zoomProfileState.refinementRequests).toBeGreaterThan(zoomProfileBaseline.refinementRequests);
    expect(zoomProfileState.targetErrors).toContain(0.75);
    expect(zoomProfileState.targetErrors.at(-1)).toBe(0.25);
    expect(zoomProfileState.heldRefinementResponses).toBe(0);
    expect(zoomProfileState.maxLineVertexCount).toBeGreaterThan(2);
    const zoomedArcError = await page.evaluate(measureF07ArcRasterError, {
      screenshotBase64: (await canvas.screenshot()).toString("base64"),
      zoomFactor: 1.25,
    });
    expect(zoomedArcError.bluePixelCount).toBeGreaterThan(50);
    expect(zoomedArcError.maximumArcDistanceCssPixels,
      `125% zoom rendered arc pixels exceeded the projected source envelope: ${JSON.stringify(zoomedArcError)}`)
      .toBeLessThanOrEqual(1.25);
    expect(zoomedArcError.maximumSourceArcToPixelDistanceCssPixels,
      `125% zoom projected source arc had a raster coverage gap: ${JSON.stringify(zoomedArcError)}`)
      .toBeLessThanOrEqual(1.25);
    console.log(`F07 125% runtime-refined WebGL arc pixel envelope PASS: ${JSON.stringify(zoomedArcError)}`);

    const panBaseline = await page.evaluate(() => {
      const state = (window as Window & { __cadV2F07?: { refinementRequests: number; targetErrors: number[] } }).__cadV2F07!;
      return { refinementRequests: state.refinementRequests, targetErrorCount: state.targetErrors.length };
    });
    const beforeMeasuredPanFrame = await readFrame();
    const panCssPixels = await dragDrawing();
    await expect.poll(readFrame, { timeout: 5_000 }).not.toBe(beforeMeasuredPanFrame);
    await page.waitForTimeout(750);
    let panRefinementStable = false;
    for (let attempt = 0; attempt < 5 && !panRefinementStable; attempt++) {
      const snapshot = await page.evaluate((baseline) => {
        const state = (window as Window & { __cadV2F07?: { refinementRequests: number; heldRefinementResponses: number; targetErrors: number[] } }).__cadV2F07!;
        return {
          refinementRequests: state.refinementRequests,
          heldRefinementResponses: state.heldRefinementResponses,
          targetErrors: state.targetErrors.slice(baseline),
          lastTargetError: state.targetErrors.at(-1),
        };
      }, panBaseline.targetErrorCount);
      if (snapshot.heldRefinementResponses > 0) {
        await page.evaluate(() => {
          const state = (window as Window & { __cadV2F07?: { heldRefinementResponses: number; releaseNextRefinementResponse: () => void } }).__cadV2F07!;
          while (state.heldRefinementResponses > 0) state.releaseNextRefinementResponse();
        });
      }
      await page.waitForTimeout(750);
      const settledSnapshot = await page.evaluate((baseline) => {
        const state = (window as Window & { __cadV2F07?: { refinementRequests: number; heldRefinementResponses: number; targetErrors: number[] } }).__cadV2F07!;
        return {
          refinementRequests: state.refinementRequests,
          heldRefinementResponses: state.heldRefinementResponses,
          targetErrors: state.targetErrors.slice(baseline),
          lastTargetError: state.targetErrors.at(-1),
        };
      }, panBaseline.targetErrorCount);
      const idleProfileRetained = settledSnapshot.lastTargetError === 0.25 &&
        (settledSnapshot.refinementRequests === panBaseline.refinementRequests ||
          (settledSnapshot.targetErrors.includes(0.75) && settledSnapshot.targetErrors.at(-1) === 0.25));
      if (settledSnapshot.heldRefinementResponses === 0 && idleProfileRetained) {
        await page.waitForTimeout(750);
        const quietSnapshot = await page.evaluate(() => {
          const state = (window as Window & { __cadV2F07?: { refinementRequests: number; heldRefinementResponses: number; targetErrors: number[] } }).__cadV2F07!;
          return {
            refinementRequests: state.refinementRequests,
            heldRefinementResponses: state.heldRefinementResponses,
            lastTargetError: state.targetErrors.at(-1),
          };
        });
        panRefinementStable = quietSnapshot.heldRefinementResponses === 0 &&
          quietSnapshot.refinementRequests === settledSnapshot.refinementRequests &&
          quietSnapshot.lastTargetError === 0.25;
      }
    }
    expect(panRefinementStable, "panned 125% view should retain or settle at the idle refinement profile").toBe(true);
    const panRefinementState = await page.evaluate((baseline) => {
      const state = (window as Window & { __cadV2F07?: { refinementRequests: number; targetErrors: number[]; heldRefinementResponses: number } }).__cadV2F07!;
      return {
        refinementRequests: state.refinementRequests,
        targetErrors: state.targetErrors.slice(baseline),
        heldRefinementResponses: state.heldRefinementResponses,
        lastTargetError: state.targetErrors.at(-1),
      };
    }, panBaseline.targetErrorCount);
    expect(panRefinementState.refinementRequests).toBeGreaterThanOrEqual(panBaseline.refinementRequests);
    if (panRefinementState.refinementRequests > panBaseline.refinementRequests) {
      expect(panRefinementState.targetErrors).toContain(0.75);
      expect(panRefinementState.targetErrors.at(-1)).toBe(0.25);
    }
    expect(panRefinementState.lastTargetError).toBe(0.25);
    expect(panRefinementState.heldRefinementResponses).toBe(0);
    const pannedArcError = await page.evaluate(measureF07ArcRasterError, {
      screenshotBase64: (await canvas.screenshot()).toString("base64"),
      zoomFactor: 1.25,
      panCssPixels,
    });
    expect(pannedArcError.bluePixelCount).toBeGreaterThan(50);
    expect(pannedArcError.maximumArcDistanceCssPixels).toBeLessThanOrEqual(1.25);
    expect(pannedArcError.maximumSourceArcToPixelDistanceCssPixels).toBeLessThanOrEqual(1.25);
    console.log("F07 panned 125% runtime-refined WebGL arc pixel envelope PASS: " + JSON.stringify(pannedArcError));

    await page.evaluate(() => {
      const state = (window as Window & { __cadV2F07?: { refinementRequests: number; targetErrors: number[] } }).__cadV2F07!;
      state.refinementRequests = 0;
      state.targetErrors.length = 0;
    });

    const beforeZoom = await page.evaluate(() => (window as Window & { __cadV2F07?: { refinementRequests: number; maxLineVertexCount: number; targetErrors: number[] } }).__cadV2F07!);
    await page.getByRole("button", { name: "Yakınlaştır (+)" }).click();
    await expect(page.getByText("156%")).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as Window & { __cadV2F07?: { refinementRequests: number; maxLineVertexCount: number } }).__cadV2F07!),
      { timeout: 15_000 }).toMatchObject({ refinementRequests: beforeZoom.refinementRequests + 1 });
    expect(await page.evaluate((baselineCount) => (window as Window & { __cadV2F07?: { targetErrors: number[] } }).__cadV2F07!.targetErrors.slice(baselineCount), beforeZoom.targetErrors.length))
      .toEqual([0.75]);
    await expect.poll(() => page.evaluate(() => (window as Window & { __cadV2F07?: { heldRefinementResponses: number } }).__cadV2F07?.heldRefinementResponses ?? 0),
      { timeout: 15_000 }).toBe(1);
    await page.getByRole("button", { name: "Yakınlaştır (+)" }).click();
    await expect(page.getByText("195%")).toBeVisible();
    await page.evaluate(() => (window as Window & { __cadV2F07?: { releaseNextRefinementResponse: () => void } }).__cadV2F07!.releaseNextRefinementResponse());
    await expect.poll(() => page.evaluate(() => (window as Window & { __cadV2F07?: { refinementRequests: number } }).__cadV2F07?.refinementRequests ?? 0),
      { timeout: 15_000 }).toBe(beforeZoom.refinementRequests + 2);
    await expect.poll(() => page.evaluate(() => (window as Window & { __cadV2F07?: { heldRefinementResponses: number } }).__cadV2F07?.heldRefinementResponses ?? 0),
      { timeout: 15_000 }).toBe(1);
    expect(await page.evaluate(() => (window as Window & { __cadV2F07?: { maxLineVertexCount: number } }).__cadV2F07!.maxLineVertexCount))
      .toBe(beforeZoom.maxLineVertexCount);
    await page.evaluate(() => (window as Window & { __cadV2F07?: { releaseNextRefinementResponse: () => void } }).__cadV2F07!.releaseNextRefinementResponse());
    await expect.poll(() => page.evaluate(() => (window as Window & { __cadV2F07?: { refinementRequests: number; maxLineVertexCount: number } }).__cadV2F07?.maxLineVertexCount ?? 0),
      { timeout: 15_000 }).toBe(beforeZoom.maxLineVertexCount);
    const transientVertexCount = await page.evaluate(() => (window as Window & { __cadV2F07?: { maxLineVertexCount: number } }).__cadV2F07!.maxLineVertexCount);
    await page.waitForTimeout(400);
    const beforeIdlePanFrame = await readFrame();
    const transientPanCssPixels = await dragDrawing();
    await expect.poll(readFrame, { timeout: 5_000 }).not.toBe(beforeIdlePanFrame);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => (window as Window & { __cadV2F07?: { refinementRequests: number } }).__cadV2F07!.refinementRequests))
      .toBe(beforeZoom.refinementRequests + 2);
    await expect.poll(() => page.evaluate(() => (window as Window & { __cadV2F07?: { refinementRequests: number } }).__cadV2F07?.refinementRequests ?? 0),
      { timeout: 15_000 }).toBe(beforeZoom.refinementRequests + 3);
    await expect.poll(() => page.evaluate(() => (window as Window & { __cadV2F07?: { heldRefinementResponses: number } }).__cadV2F07?.heldRefinementResponses ?? 0),
      { timeout: 15_000 }).toBe(1);
    expect(await page.evaluate((baselineCount) => (window as Window & { __cadV2F07?: { targetErrors: number[] } }).__cadV2F07!.targetErrors.slice(baselineCount), beforeZoom.targetErrors.length))
      .toEqual([0.75, 0.75, 0.25]);
    expect(await page.evaluate(() => (window as Window & { __cadV2F07?: { maxLineVertexCount: number } }).__cadV2F07!.maxLineVertexCount))
      .toBe(transientVertexCount);
    await page.evaluate(() => (window as Window & { __cadV2F07?: { releaseNextRefinementResponse: () => void } }).__cadV2F07!.releaseNextRefinementResponse());
    await expect.poll(() => page.evaluate(() => (window as Window & { __cadV2F07?: { maxLineVertexCount: number } }).__cadV2F07?.maxLineVertexCount ?? 0),
      { timeout: 15_000 }).toBeGreaterThan(transientVertexCount);

    const beforePanFrame = await readFrame();
    const finalPanCssPixels = await dragDrawing();
    await expect.poll(readFrame, { timeout: 5_000 }).not.toBe(beforePanFrame);
    expect(await page.evaluate(() => (window as Window & { __cadV2F07?: { refinementRequests: number } }).__cadV2F07!.refinementRequests))
      .toBe(beforeZoom.refinementRequests + 3);
    await expect(page.getByText("195%")).toBeVisible();
    const settledHighZoomState = await page.evaluate(() => {
      const state = (window as Window & { __cadV2F07?: { targetErrors: number[]; heldRefinementResponses: number; maxLineVertexCount: number } }).__cadV2F07!;
      return {
        lastTargetError: state.targetErrors.at(-1),
        heldRefinementResponses: state.heldRefinementResponses,
        maxLineVertexCount: state.maxLineVertexCount,
      };
    });
    expect(settledHighZoomState.lastTargetError).toBe(0.25);
    expect(settledHighZoomState.heldRefinementResponses).toBe(0);
    expect(settledHighZoomState.maxLineVertexCount).toBeGreaterThan(transientVertexCount);
    const finalD3ZoomTransform = await page.evaluate(() => {
      const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
        '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
      );
      const transform = input?.__zoom;
      if (!input || !transform) return null;
      const width = input.clientWidth;
      const height = input.clientHeight;
      const margin = Math.min(32, 0.1 * Math.min(width, height));
      const fitUnitsPerCssPixel = Math.max(100 / Math.max(1, width - 2 * margin), 100 / Math.max(1, height - 2 * margin));
      return { x: transform.x, y: transform.y, k: transform.k, width, height, fitUnitsPerCssPixel };
    });
    const highZoomPanOffset = {
      x: panCssPixels.x * 1.25 * 1.25 + transientPanCssPixels.x + finalPanCssPixels.x,
      y: panCssPixels.y * 1.25 * 1.25 + transientPanCssPixels.y + finalPanCssPixels.y,
    };
    expect(finalD3ZoomTransform).not.toBeNull();
    expect(finalD3ZoomTransform!.x).toBeCloseTo(finalD3ZoomTransform!.width / 2 + highZoomPanOffset.x, 6);
    expect(finalD3ZoomTransform!.y).toBeCloseTo(finalD3ZoomTransform!.height / 2 + highZoomPanOffset.y, 6);
    expect(finalD3ZoomTransform!.k).toBeCloseTo(1.953125 / finalD3ZoomTransform!.fitUnitsPerCssPixel, 6);
    const highZoomArcError = await page.evaluate(measureF07ArcRasterError, {
      screenshotBase64: (await canvas.screenshot()).toString("base64"),
      zoomFactor: 1.953125,
      panCssPixels: highZoomPanOffset,
      clipArcToViewport: true,
    });
    console.log("F07 panned 195% runtime-refined visible WebGL arc envelope PASS: " +
      JSON.stringify({ highZoomPanOffset, settledHighZoomState, finalD3ZoomTransform, highZoomArcError }));
    expect(highZoomArcError.bluePixelCount).toBeGreaterThan(50);
    expect(highZoomArcError.maximumArcDistanceCssPixels).toBeLessThanOrEqual(1.25);
    expect(highZoomArcError.maximumSourceArcToPixelDistanceCssPixels).toBeLessThanOrEqual(1.25);

    const lowZoomBaseline = await page.evaluate(() => {
      const state = (window as Window & { __cadV2F07?: { refinementRequests: number; targetErrors: number[] } }).__cadV2F07!;
      return { refinementRequests: state.refinementRequests, targetErrorCount: state.targetErrors.length };
    });
    const zoomOutButton = page.getByRole("button", { name: "Uzaklaştır (-)" });
    const zoomOutFrame = await readFrame();
    for (const expectedZoom of ["156%", "125%", "100%", "80%"] as const) {
      await zoomOutButton.click();
      await expect(page.getByText(expectedZoom)).toBeVisible();
    }
    await expect.poll(readFrame, { timeout: 5_000 }).not.toBe(zoomOutFrame);
    await expect.poll(() => page.evaluate((baseline) =>
      (window as Window & { __cadV2F07?: { refinementRequests: number } }).__cadV2F07!.refinementRequests > baseline,
    lowZoomBaseline.refinementRequests), { timeout: 20_000 }).toBe(true);

    let lowZoomIdleSnapshot: {
      refinementRequests: number;
      targetErrors: number[];
      heldRefinementResponses: number;
      maxLineVertexCount: number;
    } | null = null;
    for (let attempt = 0; attempt < 5 && !lowZoomIdleSnapshot; attempt++) {
      const pending = await page.evaluate(() =>
        (window as Window & { __cadV2F07?: { heldRefinementResponses: number } }).__cadV2F07!.heldRefinementResponses,
      );
      if (pending > 0) {
        await page.evaluate(() => {
          const state = (window as Window & { __cadV2F07?: { heldRefinementResponses: number; releaseNextRefinementResponse: () => void } }).__cadV2F07!;
          while (state.heldRefinementResponses > 0) state.releaseNextRefinementResponse();
        });
      }
      await page.waitForTimeout(350);
      const snapshot = await page.evaluate((baseline) => {
        const state = (window as Window & { __cadV2F07?: {
          refinementRequests: number; targetErrors: number[]; heldRefinementResponses: number; maxLineVertexCount: number;
        } }).__cadV2F07!;
        return {
          refinementRequests: state.refinementRequests,
          targetErrors: state.targetErrors.slice(baseline),
          heldRefinementResponses: state.heldRefinementResponses,
          maxLineVertexCount: state.maxLineVertexCount,
        };
      }, lowZoomBaseline.targetErrorCount);
      const idleProfileApplied = snapshot.targetErrors.includes(0.75) && snapshot.targetErrors.at(-1) === 0.25;
      if (snapshot.heldRefinementResponses === 0 && idleProfileApplied) {
        await page.waitForTimeout(350);
        const confirmation = await page.evaluate((baseline) => {
          const state = (window as Window & { __cadV2F07?: {
            refinementRequests: number; targetErrors: number[]; heldRefinementResponses: number; maxLineVertexCount: number;
          } }).__cadV2F07!;
          return {
            refinementRequests: state.refinementRequests,
            targetErrors: state.targetErrors.slice(baseline),
            heldRefinementResponses: state.heldRefinementResponses,
            maxLineVertexCount: state.maxLineVertexCount,
          };
        }, lowZoomBaseline.targetErrorCount);
        if (JSON.stringify(confirmation) === JSON.stringify(snapshot)) lowZoomIdleSnapshot = confirmation;
      }
    }
    expect(lowZoomIdleSnapshot, "80% DPR1 ARC refinement should settle at 0.25 CSS px with no pending replies").not.toBeNull();

    const cameraAt80 = await page.evaluate(() => {
      const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
        '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
      );
      if (!input?.__zoom) throw new Error("F07 DPR1 ARC camera is missing at 80%");
      const margin = Math.min(32, 0.1 * Math.min(input.clientWidth, input.clientHeight));
      const fitUnitsPerCssPixel = Math.max(
        100 / Math.max(1, input.clientWidth - 2 * margin),
        100 / Math.max(1, input.clientHeight - 2 * margin),
      );
      return { ...input.__zoom, width: input.clientWidth, height: input.clientHeight, fitUnitsPerCssPixel };
    });
    expect(cameraAt80.k * cameraAt80.fitUnitsPerCssPixel).toBeCloseTo(0.8, 6);
    expect(cameraAt80.x - cameraAt80.width / 2).toBeCloseTo(highZoomPanOffset.x * 0.8 ** 4, 6);
    expect(cameraAt80.y - cameraAt80.height / 2).toBeCloseTo(highZoomPanOffset.y * 0.8 ** 4, 6);

    const lowZoomPanCssPixels = { x: 48, y: 24 };
    const lowZoomPanInput = page.getByLabel("CAD V2 Çizim Etkileşim Alanı");
    const lowZoomPanBounds = await lowZoomPanInput.boundingBox();
    expect(lowZoomPanBounds).not.toBeNull();
    const frameBeforeLowZoomPan = await readFrame();
    await page.mouse.move(
      lowZoomPanBounds!.x + lowZoomPanBounds!.width / 2,
      lowZoomPanBounds!.y + lowZoomPanBounds!.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      lowZoomPanBounds!.x + lowZoomPanBounds!.width / 2 + lowZoomPanCssPixels.x,
      lowZoomPanBounds!.y + lowZoomPanBounds!.height / 2 + lowZoomPanCssPixels.y,
      { steps: 4 },
    );
    await page.mouse.up();
    await expect.poll(readFrame, { timeout: 5_000 }).not.toBe(frameBeforeLowZoomPan);
    const cameraAfter80Pan = await page.evaluate(() => {
      const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
        '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
      );
      if (!input?.__zoom) throw new Error("F07 DPR1 ARC camera is missing after its 80% pan");
      return { ...input.__zoom, width: input.clientWidth, height: input.clientHeight };
    });
    expect(cameraAfter80Pan.x - cameraAt80.x).toBeCloseTo(lowZoomPanCssPixels.x, 6);
    expect(cameraAfter80Pan.y - cameraAt80.y).toBeCloseTo(lowZoomPanCssPixels.y, 6);
    expect(cameraAfter80Pan.k).toBeCloseTo(cameraAt80.k, 12);
    const lowZoomPanState = await page.evaluate((baseline) => {
      const state = (window as Window & { __cadV2F07?: {
        refinementRequests: number; targetErrors: number[]; heldRefinementResponses: number; maxLineVertexCount: number;
      } }).__cadV2F07!;
      return {
        refinementRequests: state.refinementRequests,
        targetErrors: state.targetErrors.slice(baseline),
        heldRefinementResponses: state.heldRefinementResponses,
        maxLineVertexCount: state.maxLineVertexCount,
      };
    }, lowZoomBaseline.targetErrorCount);
    await page.waitForTimeout(350);
    const lowZoomPanQuietConfirmation = await page.evaluate((baseline) => {
      const state = (window as Window & { __cadV2F07?: {
        refinementRequests: number; targetErrors: number[]; heldRefinementResponses: number; maxLineVertexCount: number;
      } }).__cadV2F07!;
      return {
        refinementRequests: state.refinementRequests,
        targetErrors: state.targetErrors.slice(baseline),
        heldRefinementResponses: state.heldRefinementResponses,
        maxLineVertexCount: state.maxLineVertexCount,
      };
    }, lowZoomBaseline.targetErrorCount);
    expect(lowZoomPanQuietConfirmation, "same-bucket 80% DPR1 ARC pan must not schedule additional refinement")
      .toEqual(lowZoomPanState);
    expect(lowZoomPanQuietConfirmation.refinementRequests).toBe(lowZoomIdleSnapshot!.refinementRequests);
    expect(lowZoomPanQuietConfirmation.heldRefinementResponses).toBe(0);
    expect(lowZoomPanQuietConfirmation.targetErrors.at(-1)).toBe(0.25);
    expect(lowZoomPanQuietConfirmation.maxLineVertexCount).toBeGreaterThan(2);

    const lowZoomPanOffset = {
      x: cameraAfter80Pan.x - cameraAfter80Pan.width / 2,
      y: cameraAfter80Pan.y - cameraAfter80Pan.height / 2,
    };
    const lowZoomArcError = await page.evaluate(measureF07ArcRasterError, {
      screenshotBase64: (await canvas.screenshot()).toString("base64"),
      zoomFactor: 0.8,
      panCssPixels: lowZoomPanOffset,
      clipArcToViewport: true,
    });
    expect(lowZoomArcError.cameraWidth).toBe(cameraAfter80Pan.width);
    expect(lowZoomArcError.cameraHeight).toBe(cameraAfter80Pan.height);
    expect(lowZoomArcError.imageWidth).toBe(cameraAfter80Pan.width);
    expect(lowZoomArcError.imageHeight).toBe(cameraAfter80Pan.height);
    expect(lowZoomArcError.visibleArcAngles[1]).toBeGreaterThan(lowZoomArcError.visibleArcAngles[0]);
    expect(lowZoomArcError.bluePixelCount).toBeGreaterThan(50);
    expect(lowZoomArcError.maximumArcDistanceCssPixels,
      "80% panned DPR1 ARC pixels exceeded the projected visible-source envelope: " + JSON.stringify(lowZoomArcError))
      .toBeLessThanOrEqual(1.25);
    expect(lowZoomArcError.maximumSourceArcToPixelDistanceCssPixels,
      "80% panned DPR1 ARC source samples had a raster coverage gap: " + JSON.stringify(lowZoomArcError))
      .toBeLessThanOrEqual(1.25);
    console.log("F07 80% panned DPR1 runtime-refined ARC pixel envelope PASS: " + JSON.stringify({
      lowZoomPanCssPixels, cameraAt80, cameraAfter80Pan, lowZoomIdleSnapshot, lowZoomPanQuietConfirmation, lowZoomArcError,
    }));

    // The earlier 156% reply was deliberately stale. Revisit that zoom after the
    // stale-response sequence, deliver its current replies, then measure the real frame.
    const zoomInButton = page.getByRole("button", { name: "Yakınlaştır (+)" });
    for (const expectedZoom of ["100%", "125%", "156%"] as const) {
      await zoomInButton.click();
      await expect(page.getByText(expectedZoom)).toBeVisible();
    }
    const settleHeldArcRefinement = async (description: string) => {
      let quietState: { refinementRequests: number; targetErrors: number[]; heldRefinementResponses: number; maxLineVertexCount: number } | null = null;
      for (let attempt = 0; attempt < 8 && !quietState; attempt++) {
        await page.waitForTimeout(350);
        await page.evaluate(() => {
          const state = (window as Window & { __cadV2F07?: { heldRefinementResponses: number; releaseNextRefinementResponse: () => void } }).__cadV2F07!;
          while (state.heldRefinementResponses > 0) state.releaseNextRefinementResponse();
        });
        await page.waitForTimeout(350);
        const first = await page.evaluate(() => {
          const state = (window as Window & { __cadV2F07?: { refinementRequests: number; targetErrors: number[]; heldRefinementResponses: number; maxLineVertexCount: number } }).__cadV2F07!;
          return { refinementRequests: state.refinementRequests, targetErrors: [...state.targetErrors], heldRefinementResponses: state.heldRefinementResponses, maxLineVertexCount: state.maxLineVertexCount };
        });
        await page.waitForTimeout(350);
        const second = await page.evaluate(() => {
          const state = (window as Window & { __cadV2F07?: { refinementRequests: number; targetErrors: number[]; heldRefinementResponses: number; maxLineVertexCount: number } }).__cadV2F07!;
          return { refinementRequests: state.refinementRequests, targetErrors: [...state.targetErrors], heldRefinementResponses: state.heldRefinementResponses, maxLineVertexCount: state.maxLineVertexCount };
        });
        if (JSON.stringify(first) === JSON.stringify(second) && second.heldRefinementResponses === 0 &&
          second.targetErrors.at(-1) === 0.25 && second.maxLineVertexCount > 2) quietState = second;
      }
      expect(quietState, description + " must settle at 0.25 CSS px with no held reply").not.toBeNull();
      return quietState!;
    };
    const settled156 = await settleHeldArcRefinement("revisited 156% DPR1 ARC");
    const cameraAt156 = await page.evaluate(() => {
      const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
        '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
      );
      if (!input?.__zoom) throw new Error("F07 DPR1 ARC camera is missing at settled 156%");
      return { ...input.__zoom };
    });
    const frameBefore156Pan = await readFrame();
    const panAt156 = await dragDrawing();
    await expect.poll(readFrame, { timeout: 5_000 }).not.toBe(frameBefore156Pan);
    const settled156Pan = await settleHeldArcRefinement("panned 156% DPR1 ARC");
    const cameraAfter156Pan = await page.evaluate(() => {
      const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
        '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
      );
      if (!input?.__zoom) throw new Error("F07 DPR1 ARC camera is missing after settled 156% pan");
      return { ...input.__zoom, width: input.clientWidth, height: input.clientHeight };
    });
    expect(cameraAfter156Pan.k).toBeCloseTo(9.5, 6);
    expect(cameraAfter156Pan.x - cameraAt156.x).toBeCloseTo(panAt156.x, 6);
    expect(cameraAfter156Pan.y - cameraAt156.y).toBeCloseTo(panAt156.y, 6);
    const settled156Error = await page.evaluate(measureF07ArcRasterError, {
      screenshotBase64: (await canvas.screenshot()).toString("base64"),
      zoomFactor: 1.5625,
      panCssPixels: { x: cameraAfter156Pan.x - cameraAfter156Pan.width / 2, y: cameraAfter156Pan.y - cameraAfter156Pan.height / 2 },
      clipArcToViewport: true,
    });
    expect(settled156Error.bluePixelCount).toBeGreaterThan(50);
    expect(settled156Error.visibleArcAngles[1]).toBeGreaterThan(settled156Error.visibleArcAngles[0]);
    expect(settled156Error.maximumArcDistanceCssPixels).toBeLessThanOrEqual(1.25);
    expect(settled156Error.maximumSourceArcToPixelDistanceCssPixels).toBeLessThanOrEqual(1.25);
    console.log("F07 settled 156% panned DPR1 ARC envelope PASS: " + JSON.stringify({
      panAt156, settled156, settled156Pan, cameraAt156, cameraAfter156Pan, settled156Error,
    }));
  });

  test("runtime-refined ARC raster error is bounded at device pixel ratio 2", async ({ browser, page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserCurveRefinementScene();
    const sessionId = "vs_f07_camera_curve_refinement_dpr2";
    const context = await browser.newContext({
      baseURL: new URL(page.url()).origin,
      deviceScaleFactor: 2,
      viewport: { width: 1280, height: 720 },
      storageState: await page.context().storageState(),
    });

    try {
      const dprPage = await context.newPage();
      await dprPage.addInitScript(() => {
        const state = {
          targetErrors: [] as number[],
          refinedReplies: 0,
          maxLineVertexCount: 0,
        };
        (window as Window & { __cadV2F07Dpr2?: typeof state }).__cadV2F07Dpr2 = state;

        const NativeWorker = window.Worker;
        window.Worker = new Proxy(NativeWorker, {
          construct(target, args, newTarget) {
            const worker = Reflect.construct(target, args, newTarget) as Worker;
            worker.addEventListener("message", (event) => {
              if ((event.data as { kind?: string })?.kind === "refined-curves") state.refinedReplies++;
            });
            return worker;
          },
        });

        const nativePostMessage = Worker.prototype.postMessage;
        Worker.prototype.postMessage = function(message: unknown, transfer?: Transferable[]) {
          if (message && typeof message === "object" && (message as { kind?: string }).kind === "refine-curves") {
            const targetError = (message as { payload?: { targetErrorCssPixels?: number } }).payload?.targetErrorCssPixels;
            if (typeof targetError === "number") state.targetErrors.push(targetError);
          }
          return nativePostMessage.call(this, message, transfer ?? []);
        };

        const nativeDrawArrays = WebGL2RenderingContext.prototype.drawArrays;
        WebGL2RenderingContext.prototype.drawArrays = function(mode: number, first: number, count: number) {
          if (mode === 0x0001) state.maxLineVertexCount = Math.max(state.maxLineVertexCount, count);
          return nativeDrawArrays.call(this, mode, first, count);
        };
      });

      await dprPage.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "ready", sceneId: scene.sceneId, viewSessionId: sessionId, sourceVersionKey: scene.manifest.sourceVersionKey }),
        });
      });
      await dprPage.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/manifest`, async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
      });
      await dprPage.route(`**/api/dokumantasyon/cad-v2/scenes/${scene.sceneId}/chunks/*`, async (route) => {
        const chunkId = new URL(route.request().url()).pathname.split("/").at(-1)!;
        const chunk = scene.chunks.get(chunkId);
        if (!chunk) {
          await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "F07 DPR2 fixture chunk not found" }) });
          return;
        }
        await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
      });

      await dprPage.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
      const canvas = dprPage.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 60_000 });
      await expect(dprPage.getByText("Varlık:")).toBeVisible({ timeout: 60_000 });
      await expect.poll(async () => dprPage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Dpr2?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Dpr2;
        return Boolean(state && state.targetErrors.at(-1) === 0.25 &&
          state.refinedReplies >= state.targetErrors.length && state.maxLineVertexCount > 2);
      }), { timeout: 30_000, intervals: [100, 250, 500, 1000] }).toBe(true);

      await dprPage.waitForTimeout(350);
      const quietBefore = await dprPage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Dpr2?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Dpr2!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      await dprPage.waitForTimeout(350);
      const quietAfter = await dprPage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Dpr2?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Dpr2!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      expect(quietAfter).toEqual(quietBefore);
      expect(quietAfter.targetErrors.at(-1)).toBe(0.25);

      const rasterContext = await dprPage.evaluate(() => {
        const canvasElement = document.querySelector("canvas");
        if (!canvasElement) throw new Error("F07 DPR2 canvas is missing");
        return {
          devicePixelRatio: window.devicePixelRatio,
          cssWidth: canvasElement.clientWidth,
          cssHeight: canvasElement.clientHeight,
          drawingBufferWidth: canvasElement.width,
          drawingBufferHeight: canvasElement.height,
        };
      });
      expect(rasterContext.devicePixelRatio).toBe(2);
      expect(rasterContext.drawingBufferWidth).toBe(rasterContext.cssWidth * 2);
      expect(rasterContext.drawingBufferHeight).toBe(rasterContext.cssHeight * 2);

      const screenshot = await canvas.screenshot({ scale: "device" });
      const rasterError = await dprPage.evaluate(measureF07ArcRasterError, {
        screenshotBase64: screenshot.toString("base64"),
        zoomFactor: 1,
      });
      expect(rasterError.imageWidth).toBe(rasterError.cameraWidth * 2);
      expect(rasterError.imageHeight).toBe(rasterError.cameraHeight * 2);
      expect(rasterError.bluePixelCount).toBeGreaterThan(100);
      expect(rasterError.maximumArcDistanceCssPixels,
        `DPR2 rendered arc pixels exceeded the projected source envelope: ${JSON.stringify(rasterError)}`)
        .toBeLessThanOrEqual(1.25);
      expect(rasterError.maximumSourceArcToPixelDistanceCssPixels,
        `DPR2 projected source arc had a raster coverage gap: ${JSON.stringify(rasterError)}`)
        .toBeLessThanOrEqual(1.25);
      console.log(`F07 DPR2 runtime-refined WebGL arc pixel envelope PASS: ${JSON.stringify({ rasterContext, quietAfter, rasterError })}`);

      const panInput = dprPage.getByLabel("CAD V2 Çizim Etkileşim Alanı");
      const panBounds = await panInput.boundingBox();
      expect(panBounds).not.toBeNull();
      const cameraBeforePan = await dprPage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 D3 camera transform is missing");
        return { ...input.__zoom };
      });
      const frameBeforePan = crypto.createHash("sha256").update(await canvas.screenshot()).digest("hex");
      const panCssPixels = { x: 48, y: 24 };
      await dprPage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await dprPage.mouse.down();
      await dprPage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + panCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + panCssPixels.y,
        { steps: 4 },
      );
      await dprPage.mouse.up();
      await expect.poll(async () => crypto.createHash("sha256").update(await canvas.screenshot()).digest("hex"),
        { timeout: 5_000 }).not.toBe(frameBeforePan);

      const cameraAfterPan = await dprPage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 D3 camera transform is missing after pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterPan.x - cameraBeforePan.x).toBeCloseTo(panCssPixels.x, 6);
      expect(cameraAfterPan.y - cameraBeforePan.y).toBeCloseTo(panCssPixels.y, 6);
      expect(cameraAfterPan.k).toBeCloseTo(cameraBeforePan.k, 12);

      let panQuiet = false;
      let panQuietSnapshot = { targetErrors: [] as number[], refinedReplies: 0, maxLineVertexCount: 0 };
      for (let attempt = 0; attempt < 5 && !panQuiet; attempt++) {
        await dprPage.waitForTimeout(350);
        const snapshot = await dprPage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Dpr2?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Dpr2!;
          return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
        });
        if (snapshot.refinedReplies >= snapshot.targetErrors.length && snapshot.targetErrors.at(-1) === 0.25) {
          await dprPage.waitForTimeout(350);
          const quiet = await dprPage.evaluate(() => {
            const state = (window as Window & { __cadV2F07Dpr2?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Dpr2!;
            return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
          });
          if (JSON.stringify(quiet) === JSON.stringify(snapshot)) {
            panQuiet = true;
            panQuietSnapshot = quiet;
          }
        }
      }
      expect(panQuiet, "panned DPR2 ARC should retain the applied idle refinement and settle with no pending replies").toBe(true);
      expect(panQuietSnapshot.maxLineVertexCount).toBeGreaterThan(2);
      const pannedRasterError = await dprPage.evaluate(measureF07ArcRasterError, {
        screenshotBase64: (await canvas.screenshot({ scale: "device" })).toString("base64"),
        zoomFactor: 1,
        panCssPixels,
      });
      expect(pannedRasterError.imageWidth).toBe(rasterError.imageWidth);
      expect(pannedRasterError.imageHeight).toBe(rasterError.imageHeight);
      expect(pannedRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(pannedRasterError.maximumArcDistanceCssPixels,
        `panned DPR2 rendered arc pixels exceeded the projected source envelope: ${JSON.stringify(pannedRasterError)}`)
        .toBeLessThanOrEqual(1.25);
      expect(pannedRasterError.maximumSourceArcToPixelDistanceCssPixels,
        `panned DPR2 projected source arc had a raster coverage gap: ${JSON.stringify(pannedRasterError)}`)
        .toBeLessThanOrEqual(1.25);
      console.log(`F07 panned DPR2 runtime-refined WebGL arc pixel envelope PASS: ${JSON.stringify({ panCssPixels, cameraBeforePan, cameraAfterPan, panQuietSnapshot, pannedRasterError })}`);

      const waitForDpr2ArcRefinementIdle = async (minimumTargetCount: number, description: string) => {
        await expect.poll(async () => dprPage.evaluate((minimumCount) => {
          const state = (window as Window & { __cadV2F07Dpr2?: { targetErrors: number[]; refinedReplies: number } }).__cadV2F07Dpr2;
          return Boolean(state && state.targetErrors.length >= minimumCount && state.targetErrors.at(-1) === 0.25 &&
            state.refinedReplies >= state.targetErrors.length);
        }, minimumTargetCount), { timeout: 20_000, intervals: [100, 250, 500, 1000] }).toBe(true);

        let quiet = false;
        let quietSnapshot = await dprPage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Dpr2?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Dpr2!;
          return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
        });
        for (let attempt = 0; attempt < 5 && !quiet; attempt++) {
          await dprPage.waitForTimeout(350);
          const current = await dprPage.evaluate(() => {
            const state = (window as Window & { __cadV2F07Dpr2?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Dpr2!;
            return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
          });
          if (current.refinedReplies >= current.targetErrors.length && current.targetErrors.at(-1) === 0.25) {
            await dprPage.waitForTimeout(350);
            const confirmation = await dprPage.evaluate(() => {
              const state = (window as Window & { __cadV2F07Dpr2?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Dpr2!;
              return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
            });
            if (JSON.stringify(confirmation) === JSON.stringify(current)) {
              quiet = true;
              quietSnapshot = confirmation;
            }
          }
        }
        expect(quiet, description + " must settle at 0.25 CSS px with no outstanding replies").toBe(true);
        return quietSnapshot;
      };

      const zoomButton = dprPage.getByRole("button", { name: "Yakınlaştır (+)" });
      let highZoomQuiet = panQuietSnapshot;
      for (const expectedZoom of ["125%", "156%", "195%"] as const) {
        const baselineTargetCount = await dprPage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Dpr2?: { targetErrors: number[] } }).__cadV2F07Dpr2!;
          return state.targetErrors.length;
        });
        await zoomButton.click();
        await expect(dprPage.getByText(expectedZoom)).toBeVisible();
        highZoomQuiet = await waitForDpr2ArcRefinementIdle(
          baselineTargetCount + 1,
          expectedZoom + " DPR2 ARC zoom refinement",
        );
      }

      const cameraAfter195Zoom = await dprPage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ARC camera transform is missing at 195%");
        return { ...input.__zoom };
      });
      expect(cameraAfter195Zoom.k / cameraBeforePan.k).toBeCloseTo(1.953125, 6);
      expect(cameraAfter195Zoom.x).toBeCloseTo(
        rasterContext.cssWidth / 2 + (cameraAfterPan.x - rasterContext.cssWidth / 2) * 1.953125, 6,
      );
      expect(cameraAfter195Zoom.y).toBeCloseTo(
        rasterContext.cssHeight / 2 + (cameraAfterPan.y - rasterContext.cssHeight / 2) * 1.953125, 6,
      );
      expect(highZoomQuiet.targetErrors.at(-1)).toBe(0.25);
      expect(highZoomQuiet.refinedReplies).toBe(highZoomQuiet.targetErrors.length);

      const highZoomPanCssPixels = { x: 48, y: 24 };
      const frameBeforeHighZoomPan = crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await dprPage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await dprPage.mouse.down();
      await dprPage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + highZoomPanCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + highZoomPanCssPixels.y,
        { steps: 4 },
      );
      await dprPage.mouse.up();
      const readHighZoomDeviceFrame = async () => crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await expect.poll(readHighZoomDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeHighZoomPan);
      const cameraAfter195Pan = await dprPage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ARC camera transform is missing after its 195% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfter195Pan.x - cameraAfter195Zoom.x).toBeCloseTo(highZoomPanCssPixels.x, 6);
      expect(cameraAfter195Pan.y - cameraAfter195Zoom.y).toBeCloseTo(highZoomPanCssPixels.y, 6);
      expect(cameraAfter195Pan.k).toBeCloseTo(cameraAfter195Zoom.k, 12);
      const highZoomPanQuiet = await waitForDpr2ArcRefinementIdle(
        highZoomQuiet.targetErrors.length,
        "panned 195% DPR2 ARC refinement",
      );
      expect(highZoomPanQuiet.maxLineVertexCount).toBeGreaterThan(2);

      const highZoomPanOffset = {
        x: cameraAfter195Pan.x - rasterContext.cssWidth / 2,
        y: cameraAfter195Pan.y - rasterContext.cssHeight / 2,
      };
      expect(highZoomPanOffset.x).toBeCloseTo(panCssPixels.x * 1.953125 + highZoomPanCssPixels.x, 6);
      expect(highZoomPanOffset.y).toBeCloseTo(panCssPixels.y * 1.953125 + highZoomPanCssPixels.y, 6);
      const highZoomRasterError = await dprPage.evaluate(measureF07ArcRasterError, {
        screenshotBase64: (await canvas.screenshot({ scale: "device" })).toString("base64"),
        zoomFactor: 1.953125,
        panCssPixels: highZoomPanOffset,
        clipArcToViewport: true,
      });
      expect(highZoomRasterError.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(highZoomRasterError.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(highZoomRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(highZoomRasterError.visibleArcAngles[1]).toBeGreaterThan(highZoomRasterError.visibleArcAngles[0]);
      expect(highZoomRasterError.maximumArcDistanceCssPixels,
        "195% panned DPR2 ARC pixels exceeded the projected visible-source envelope: " + JSON.stringify(highZoomRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(highZoomRasterError.maximumSourceArcToPixelDistanceCssPixels,
        "195% panned DPR2 ARC source samples had a raster coverage gap: " + JSON.stringify(highZoomRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 195% panned DPR2 runtime-refined ARC pixel envelope PASS: " + JSON.stringify({
        highZoomPanCssPixels, cameraAfter195Zoom, cameraAfter195Pan, highZoomPanQuiet, highZoomRasterError,
      }));

      const beforeReturn156 = highZoomPanQuiet.targetErrors.length;
      await dprPage.getByRole("button", { name: "Uzaklaştır (-)" }).click();
      await expect(dprPage.getByText("156%")).toBeVisible();
      const returned156 = await waitForDpr2ArcRefinementIdle(beforeReturn156 + 1, "returned 156% DPR2 ARC");
      const cameraAt156 = await dprPage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ARC camera is missing at returned 156%");
        return { ...input.__zoom };
      });
      const frameBefore156Pan = await readHighZoomDeviceFrame();
      const currentPanBounds = (await panInput.boundingBox()) || panBounds;
      await dprPage.mouse.move(currentPanBounds!.x + currentPanBounds!.width / 2, currentPanBounds!.y + currentPanBounds!.height / 2);
      await dprPage.mouse.down();
      await dprPage.mouse.move(currentPanBounds!.x + currentPanBounds!.width / 2 + 48, currentPanBounds!.y + currentPanBounds!.height / 2 + 24, { steps: 4 });
      await dprPage.mouse.up();
      await expect.poll(readHighZoomDeviceFrame, { timeout: 5_000 }).not.toBe(frameBefore156Pan);
      const panned156 = await waitForDpr2ArcRefinementIdle(returned156.targetErrors.length, "panned 156% DPR2 ARC");
      const cameraAfter156Pan = await dprPage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ARC camera is missing after returned 156% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfter156Pan.x - cameraAt156.x).toBeCloseTo(48, 6);
      expect(cameraAfter156Pan.y - cameraAt156.y).toBeCloseTo(24, 6);
      expect(cameraAfter156Pan.k).toBeCloseTo(cameraAt156.k, 12);
      expect(cameraAfter156Pan.k / cameraBeforePan.k).toBeCloseTo(1.5625, 6);
      const returned156Error = await dprPage.evaluate(measureF07ArcRasterError, {
        screenshotBase64: (await canvas.screenshot({ scale: "device" })).toString("base64"),
        zoomFactor: 1.5625,
        panCssPixels: { x: cameraAfter156Pan.x - rasterContext.cssWidth / 2, y: cameraAfter156Pan.y - rasterContext.cssHeight / 2 },
        clipArcToViewport: true,
      });
      expect(returned156Error.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(returned156Error.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(returned156Error.bluePixelCount).toBeGreaterThan(100);
      expect(returned156Error.visibleArcAngles[1]).toBeGreaterThan(returned156Error.visibleArcAngles[0]);
      expect(returned156Error.maximumArcDistanceCssPixels).toBeLessThanOrEqual(1.25);
      expect(returned156Error.maximumSourceArcToPixelDistanceCssPixels).toBeLessThanOrEqual(1.25);
      console.log("F07 returned 156% panned DPR2 ARC envelope PASS: " + JSON.stringify({
        returned156, panned156, cameraAt156, cameraAfter156Pan, returned156Error,
      }));
    } finally {
      await context.close();
    }
  });

  test("runtime-refined ELLIPSE raster error is bounded by an independent parametric oracle", async ({ browser, page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserEllipseRefinementScene();
    const sceneChunk = scene.chunks.get("chunk_f07_ellipse");
    if (!sceneChunk) throw new Error("F07 ELLIPSE fixture chunk was not created");
    const metaSection = parseSceneChunk(sceneChunk).sections.get(SceneTag.META)?.data as Uint8Array | undefined;
    if (!metaSection) throw new Error("F07 ELLIPSE fixture metadata was not encoded");
    const fixtureMeta = JSON.parse(new TextDecoder().decode(metaSection)) as {
      curveSourceRefs: Array<{ sourceType: string; curveRecordIndex: number; firstVertex: number; vertexCount: number }>;
    };
    expect(fixtureMeta.curveSourceRefs).toEqual([{
      curveId: "F07-RUNTIME-ELLIPSE", sourceHandle: "F07E1", sourceType: "ELLIPSE", firstSegmentIndex: 0,
      segmentCount: 1, curveRecordIndex: 0, firstVertex: 0, vertexCount: 2,
    }]);

    const context = await browser.newContext({
      baseURL: new URL(page.url()).origin,
      deviceScaleFactor: 1,
      viewport: { width: 1280, height: 720 },
      storageState: await page.context().storageState(),
    });
    try {
      const ellipsePage = await context.newPage();
      await configureF07EllipseRefinementPage(ellipsePage, scene, "vs_f07_runtime_ellipse");

      await ellipsePage.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
      const canvas = ellipsePage.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 60_000 });
      await expect(ellipsePage.getByText("Varlık:")).toBeVisible({ timeout: 60_000 });
      await expect.poll(() => ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse;
        return Boolean(state && state.targetErrors.includes(0.25) &&
          state.refinedReplies >= state.targetErrors.length && state.maxLineVertexCount > 2);
      }), { timeout: 30_000, intervals: [100, 250, 500, 1000] }).toBe(true);

      await ellipsePage.waitForTimeout(350);
      const quietBefore = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      await ellipsePage.waitForTimeout(350);
      const quietAfter = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      expect(quietAfter).toEqual(quietBefore);
      expect(quietAfter.targetErrors.at(-1)).toBe(0.25);
      expect(quietAfter.refinedReplies).toBe(quietAfter.targetErrors.length);

      const rasterContext = await ellipsePage.evaluate(() => {
        const canvasElement = document.querySelector("canvas");
        if (!canvasElement) throw new Error("F07 ELLIPSE canvas is missing");
        return {
          devicePixelRatio: window.devicePixelRatio,
          cssWidth: canvasElement.clientWidth,
          cssHeight: canvasElement.clientHeight,
          drawingBufferWidth: canvasElement.width,
          drawingBufferHeight: canvasElement.height,
        };
      });
      expect(rasterContext.devicePixelRatio).toBe(1);
      expect(rasterContext.drawingBufferWidth).toBe(rasterContext.cssWidth);
      expect(rasterContext.drawingBufferHeight).toBe(rasterContext.cssHeight);

      const screenshot = await canvas.screenshot({ scale: "device" });
      const rasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: screenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
      });
      expect(rasterError.bluePixelCount).toBeGreaterThan(100);
      expect(rasterError.maximumRenderedToSourceDistanceCssPixels,
        `ELLIPSE raster pixels exceeded the independent parametric source envelope: ${JSON.stringify(rasterError)}`)
        .toBeLessThanOrEqual(1.25);
      expect(rasterError.maximumSourceToRenderedDistanceCssPixels,
        `ELLIPSE source samples had a raster coverage gap: ${JSON.stringify(rasterError)}`)
        .toBeLessThanOrEqual(1.25);
      console.log(`F07 runtime-refined ELLIPSE raster envelope PASS: ${JSON.stringify({ rasterContext, quietAfter, rasterError })}`);

      const waitForRefinementIdle = async (minimumTargetCount: number, description: string) => {
        await expect.poll(() => ellipsePage.evaluate((minimumCount) => {
          const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number } }).__cadV2F07Ellipse;
          return Boolean(state && state.targetErrors.length >= minimumCount && state.targetErrors.at(-1) === 0.25 &&
            state.refinedReplies >= state.targetErrors.length);
        }, minimumTargetCount), { timeout: 20_000, intervals: [100, 250, 500, 1000] }).toBe(true);

        let quiet = false;
        let quietSnapshot = await ellipsePage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
          return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
        });
        for (let attempt = 0; attempt < 5 && !quiet; attempt++) {
          await ellipsePage.waitForTimeout(350);
          const current = await ellipsePage.evaluate(() => {
            const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
            return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
          });
          if (current.refinedReplies >= current.targetErrors.length && current.targetErrors.at(-1) === 0.25) {
            await ellipsePage.waitForTimeout(350);
            const confirmation = await ellipsePage.evaluate(() => {
              const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
              return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
            });
            if (JSON.stringify(confirmation) === JSON.stringify(current)) {
              quiet = true;
              quietSnapshot = confirmation;
            }
          }
        }
        expect(quiet, description + " must settle at 0.25 CSS px with no outstanding replies").toBe(true);
        return quietSnapshot;
      };

      const zoomButton = ellipsePage.getByRole("button", { name: "Yakınlaştır (+)" });
      const cameraBeforeZoom = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR1 ELLIPSE D3 camera transform is missing before zoom");
        return { ...input.__zoom };
      });
      let settledRefinement = quietAfter;
      for (const expectedZoom of ["125%", "156%"] as const) {
        const baseline = await ellipsePage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[] } }).__cadV2F07Ellipse!;
          return state.targetErrors.length;
        });
        await zoomButton.click();
        await expect(ellipsePage.getByText(expectedZoom)).toBeVisible();
        settledRefinement = await waitForRefinementIdle(baseline + 1, expectedZoom + " DPR1 ELLIPSE zoom refinement");
      }
      expect(settledRefinement.targetErrors.at(-1)).toBe(0.25);
      expect(settledRefinement.refinedReplies).toBe(settledRefinement.targetErrors.length);

      const cameraAfterZoom = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR1 ELLIPSE D3 camera transform is missing at 156%");
        return { ...input.__zoom };
      });
      expect(cameraAfterZoom.k / cameraBeforeZoom.k).toBeCloseTo(1.5625, 6);
      expect(cameraAfterZoom.x).toBeCloseTo(rasterContext.cssWidth / 2, 6);
      expect(cameraAfterZoom.y).toBeCloseTo(rasterContext.cssHeight / 2, 6);

      const panCssPixels = { x: 48, y: 24 };
      const panInput = ellipsePage.getByLabel("CAD V2 Çizim Etkileşim Alanı");
      const panBounds = await panInput.boundingBox();
      expect(panBounds).not.toBeNull();
      const frameBeforePan = crypto.createHash("sha256").update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await ellipsePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await ellipsePage.mouse.down();
      await ellipsePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + panCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + panCssPixels.y,
        { steps: 4 },
      );
      await ellipsePage.mouse.up();
      const readDeviceFrame = async () => crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforePan);
      const cameraAfterPan = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR1 ELLIPSE D3 camera transform is missing after pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterPan.x - cameraAfterZoom.x).toBeCloseTo(panCssPixels.x, 6);
      expect(cameraAfterPan.y - cameraAfterZoom.y).toBeCloseTo(panCssPixels.y, 6);
      expect(cameraAfterPan.k).toBeCloseTo(cameraAfterZoom.k, 12);
      const panQuiet = await waitForRefinementIdle(settledRefinement.targetErrors.length, "panned 156% DPR1 ELLIPSE refinement");
      expect(panQuiet.maxLineVertexCount).toBeGreaterThan(2);

      const pannedScreenshot = await canvas.screenshot({ scale: "device" });
      const pannedRasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: pannedScreenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        zoomFactor: 1.5625,
        panCssPixels,
      });
      expect(pannedRasterError.imageWidth).toBe(rasterContext.cssWidth);
      expect(pannedRasterError.imageHeight).toBe(rasterContext.cssHeight);
      expect(pannedRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(pannedRasterError.maximumRenderedToSourceDistanceCssPixels,
        "156% panned DPR1 ELLIPSE rendered pixels exceeded the independent parametric source envelope: " + JSON.stringify(pannedRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(pannedRasterError.maximumSourceToRenderedDistanceCssPixels,
        "156% panned DPR1 ELLIPSE source samples had a raster coverage gap: " + JSON.stringify(pannedRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 156% panned DPR1 runtime-refined ELLIPSE pixel envelope PASS: " + JSON.stringify({
        panCssPixels, cameraBeforeZoom, cameraAfterZoom, cameraAfterPan, panQuiet, pannedRasterError,
      }));

      const highZoomBaseline = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[] } }).__cadV2F07Ellipse!;
        return state.targetErrors.length;
      });
      await zoomButton.click();
      await expect(ellipsePage.getByText("195%")).toBeVisible();
      const highZoomQuiet = await waitForRefinementIdle(highZoomBaseline + 1, "195% DPR1 ELLIPSE zoom refinement");
      const cameraAfter195Zoom = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR1 ELLIPSE D3 camera transform is missing at 195%");
        return { ...input.__zoom };
      });
      expect(cameraAfter195Zoom.k / cameraBeforeZoom.k).toBeCloseTo(1.953125, 6);
      expect(cameraAfter195Zoom.x).toBeCloseTo(
        rasterContext.cssWidth / 2 + (cameraAfterPan.x - rasterContext.cssWidth / 2) * 1.25, 6,
      );
      expect(cameraAfter195Zoom.y).toBeCloseTo(
        rasterContext.cssHeight / 2 + (cameraAfterPan.y - rasterContext.cssHeight / 2) * 1.25, 6,
      );
      expect(highZoomQuiet.targetErrors.at(-1)).toBe(0.25);
      expect(highZoomQuiet.refinedReplies).toBe(highZoomQuiet.targetErrors.length);

      const highZoomPanPixels = { x: -10, y: -5 };
      const frameBeforeHighZoomPan = crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await ellipsePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await ellipsePage.mouse.down();
      await ellipsePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + highZoomPanPixels.x,
        panBounds!.y + panBounds!.height / 2 + highZoomPanPixels.y,
        { steps: 4 },
      );
      await ellipsePage.mouse.up();
      const readHighZoomFrame = async () => crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await expect.poll(readHighZoomFrame, { timeout: 5_000 }).not.toBe(frameBeforeHighZoomPan);
      const cameraAfter195Pan = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR1 ELLIPSE D3 camera transform is missing after the 195% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfter195Pan.x - cameraAfter195Zoom.x).toBeCloseTo(highZoomPanPixels.x, 6);
      expect(cameraAfter195Pan.y - cameraAfter195Zoom.y).toBeCloseTo(highZoomPanPixels.y, 6);
      expect(cameraAfter195Pan.k).toBeCloseTo(cameraAfter195Zoom.k, 12);
      const highZoomPanQuiet = await waitForRefinementIdle(
        highZoomQuiet.targetErrors.length,
        "panned 195% DPR1 ELLIPSE refinement",
      );
      expect(highZoomPanQuiet.maxLineVertexCount).toBeGreaterThan(2);

      const highZoomPanOffset = {
        x: cameraAfter195Pan.x - rasterContext.cssWidth / 2,
        y: cameraAfter195Pan.y - rasterContext.cssHeight / 2,
      };
      const highZoomPanScreenshot = await canvas.screenshot({ scale: "device" });
      const highZoomPanRasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: highZoomPanScreenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        zoomFactor: 1.953125,
        panCssPixels: highZoomPanOffset,
      });
      expect(highZoomPanRasterError.imageWidth).toBe(rasterContext.cssWidth);
      expect(highZoomPanRasterError.imageHeight).toBe(rasterContext.cssHeight);
      expect(highZoomPanRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(highZoomPanRasterError.maximumRenderedToSourceDistanceCssPixels,
        "195% panned DPR1 ELLIPSE pixels exceeded the independent parametric source envelope: " + JSON.stringify(highZoomPanRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(highZoomPanRasterError.maximumSourceToRenderedDistanceCssPixels,
        "195% panned DPR1 ELLIPSE source samples had a raster coverage gap: " + JSON.stringify(highZoomPanRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 195% panned DPR1 runtime-refined ELLIPSE pixel envelope PASS: " + JSON.stringify({
        highZoomPanPixels, cameraAfter195Zoom, cameraAfter195Pan, highZoomPanQuiet, highZoomPanRasterError,
      }));

      const zoomOutBaseline = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[] } }).__cadV2F07Ellipse!;
        return state.targetErrors.length;
      });
      const zoomOutButton = ellipsePage.getByRole("button", { name: "Uzaklaştır (-)" });
      const frameBeforeZoomOut = await readHighZoomFrame();
      for (const expectedZoom of ["156%", "125%", "100%", "80%"] as const) {
        await zoomOutButton.click();
        await expect(ellipsePage.getByText(expectedZoom)).toBeVisible();
      }
      await expect.poll(readHighZoomFrame, { timeout: 5_000 }).not.toBe(frameBeforeZoomOut);
      const cameraAfter80Zoom = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR1 ELLIPSE D3 camera is missing at 80%");
        return { ...input.__zoom };
      });
      expect(cameraAfter80Zoom.k / cameraBeforeZoom.k).toBeCloseTo(0.8, 6);
      const zoomOutPanOffset = {
        x: cameraAfter80Zoom.x - rasterContext.cssWidth / 2,
        y: cameraAfter80Zoom.y - rasterContext.cssHeight / 2,
      };
      expect(zoomOutPanOffset.x).toBeCloseTo(
        (cameraAfter195Pan.x - rasterContext.cssWidth / 2) * 0.8 ** 4, 6,
      );
      expect(zoomOutPanOffset.y).toBeCloseTo(
        (cameraAfter195Pan.y - rasterContext.cssHeight / 2) * 0.8 ** 4, 6,
      );
      const zoomOutQuiet = await waitForRefinementIdle(zoomOutBaseline + 1, "80% DPR1 ELLIPSE zoom-out refinement");

      const final80PanPixels = { x: -10, y: -5 };
      const frameBefore80Pan = await readHighZoomFrame();
      await ellipsePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await ellipsePage.mouse.down();
      await ellipsePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + final80PanPixels.x,
        panBounds!.y + panBounds!.height / 2 + final80PanPixels.y,
        { steps: 4 },
      );
      await ellipsePage.mouse.up();
      await expect.poll(readHighZoomFrame, { timeout: 5_000 }).not.toBe(frameBefore80Pan);
      const cameraAfter80Pan = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR1 ELLIPSE D3 camera is missing after its 80% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfter80Pan.x - cameraAfter80Zoom.x).toBeCloseTo(final80PanPixels.x, 6);
      expect(cameraAfter80Pan.y - cameraAfter80Zoom.y).toBeCloseTo(final80PanPixels.y, 6);
      expect(cameraAfter80Pan.k).toBeCloseTo(cameraAfter80Zoom.k, 12);
      const final80PanQuietSnapshot = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      await ellipsePage.waitForTimeout(350);
      const final80PanQuietConfirmation = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      expect(final80PanQuietConfirmation, "80% same-bucket DPR1 ELLIPSE pan must not request more refinement")
        .toEqual(final80PanQuietSnapshot);
      expect(final80PanQuietConfirmation).toEqual(zoomOutQuiet);
      expect(final80PanQuietConfirmation.refinedReplies).toBe(final80PanQuietConfirmation.targetErrors.length);
      expect(final80PanQuietConfirmation.targetErrors.at(-1)).toBe(0.25);
      expect(final80PanQuietConfirmation.maxLineVertexCount).toBeGreaterThan(2);

      const final80PanOffset = {
        x: cameraAfter80Pan.x - rasterContext.cssWidth / 2,
        y: cameraAfter80Pan.y - rasterContext.cssHeight / 2,
      };
      expect(final80PanOffset.x).toBeCloseTo(zoomOutPanOffset.x + final80PanPixels.x, 6);
      expect(final80PanOffset.y).toBeCloseTo(zoomOutPanOffset.y + final80PanPixels.y, 6);
      const final80PanScreenshot = await canvas.screenshot({ scale: "device" });
      const final80PanRasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: final80PanScreenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        zoomFactor: 0.8,
        panCssPixels: final80PanOffset,
      });
      expect(final80PanRasterError.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(final80PanRasterError.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(final80PanRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(final80PanRasterError.analyticSampleCount).toBe(4097);
      expect(final80PanRasterError.visibleSourceAngles[1]).toBeGreaterThan(final80PanRasterError.visibleSourceAngles[0]);
      expect(final80PanRasterError.maximumRenderedToSourceDistanceCssPixels,
        "80% panned DPR1 ELLIPSE pixels exceeded the independent parametric source envelope: " + JSON.stringify(final80PanRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(final80PanRasterError.maximumSourceToRenderedDistanceCssPixels,
        "80% panned DPR1 ELLIPSE source samples had a raster coverage gap: " + JSON.stringify(final80PanRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 80% panned DPR1 runtime-refined ELLIPSE pixel envelope PASS: " + JSON.stringify({
        final80PanPixels, cameraAfter80Zoom, cameraAfter80Pan, zoomOutQuiet, final80PanQuietConfirmation, final80PanRasterError,
      }));
    } finally {
      await context.close();
    }
  });

  test("runtime-refined SPLINE raster error is bounded by an independent rational Bernstein oracle", async ({ browser, page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserSplineRefinementScene();
    const sceneChunk = scene.chunks.get("chunk_f07_spline");
    if (!sceneChunk) throw new Error("F07 SPLINE fixture chunk was not created");
    const metaSection = parseSceneChunk(sceneChunk).sections.get(SceneTag.META)?.data as Uint8Array | undefined;
    if (!metaSection) throw new Error("F07 SPLINE fixture metadata was not encoded");
    const fixtureMeta = JSON.parse(new TextDecoder().decode(metaSection)) as {
      curveSourceRefs: Array<{
        sourceType: string;
        curveRecordIndex: number;
        firstVertex: number;
        vertexCount: number;
        splineSource?: { controlPoints: [number, number][]; weights: number[] };
      }>;
    };
    expect(fixtureMeta.curveSourceRefs).toEqual([{
      curveId: "F07-RUNTIME-SPLINE", sourceHandle: "F07S1", sourceType: "SPLINE", firstSegmentIndex: 0,
      segmentCount: 1, curveRecordIndex: 0, firstVertex: 0, vertexCount: 2,
      splineSource: { controlPoints: scene.controlPoints, weights: scene.weights },
    }]);

    const context = await browser.newContext({
      baseURL: new URL(page.url()).origin,
      deviceScaleFactor: 1,
      viewport: { width: 1280, height: 720 },
      storageState: await page.context().storageState(),
    });
    try {
      const splinePage = await context.newPage();
      await configureF07SplineRefinementPage(splinePage, scene, "vs_f07_runtime_spline");
      await splinePage.goto("/dokumantasyon/dosya/" + fileId + "?cadEngine=v2");
      const canvas = splinePage.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 60_000 });
      await expect(splinePage.getByText("Varlık:")).toBeVisible({ timeout: 60_000 });
      await expect.poll(() => splinePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Spline?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Spline;
        return Boolean(state && state.targetErrors.at(-1) === 0.25 &&
          state.refinedReplies >= state.targetErrors.length && state.maxLineVertexCount > 2);
      }), { timeout: 30_000, intervals: [100, 250, 500, 1000] }).toBe(true);

      await splinePage.waitForTimeout(350);
      const quietBefore = await splinePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Spline?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Spline!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      await splinePage.waitForTimeout(350);
      const quietAfter = await splinePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Spline?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Spline!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      expect(quietAfter).toEqual(quietBefore);
      expect(quietAfter.targetErrors.at(-1)).toBe(0.25);
      expect(quietAfter.refinedReplies).toBe(quietAfter.targetErrors.length);
      expect(quietAfter.maxLineVertexCount).toBeGreaterThan(2);

      const rasterContext = await splinePage.evaluate(() => {
        const canvasElement = document.querySelector("canvas");
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!canvasElement || !input?.__zoom) throw new Error("F07 SPLINE canvas/camera is missing");
        return {
          devicePixelRatio: window.devicePixelRatio,
          cssWidth: canvasElement.clientWidth,
          cssHeight: canvasElement.clientHeight,
          drawingBufferWidth: canvasElement.width,
          drawingBufferHeight: canvasElement.height,
          camera: { ...input.__zoom },
        };
      });
      expect(rasterContext.devicePixelRatio).toBe(1);
      expect(rasterContext.drawingBufferWidth).toBe(rasterContext.cssWidth);
      expect(rasterContext.drawingBufferHeight).toBe(rasterContext.cssHeight);
      expect(rasterContext.camera.k).toBeCloseTo(6.08, 6);
      expect(rasterContext.camera.x).toBeCloseTo(rasterContext.cssWidth / 2, 6);
      expect(rasterContext.camera.y).toBeCloseTo(rasterContext.cssHeight / 2, 6);

      const screenshot = await canvas.screenshot({ scale: "device" });
      const rasterError = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: screenshot.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: rasterContext.camera,
      });
      expect(rasterError.imageWidth).toBe(rasterContext.cssWidth);
      expect(rasterError.imageHeight).toBe(rasterContext.cssHeight);
      expect(rasterError.bluePixelCount).toBeGreaterThan(100);
      expect(rasterError.independentSourceSampleCount).toBe(4097);
      expect(rasterError.maximumRenderedToSourceDistanceCssPixels,
        "runtime-refined SPLINE pixels exceeded the independent rational Bernstein source envelope: " + JSON.stringify(rasterError))
        .toBeLessThanOrEqual(1.25);
      expect(rasterError.maximumSourceToRenderedDistanceCssPixels,
        "independent rational Bernstein SPLINE samples had a raster coverage gap: " + JSON.stringify(rasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        rasterContext, quietAfter, rasterError,
      }));

      const readSplineState = async () => splinePage.evaluate(() => {
        const state = (window as Window & {
          __cadV2F07Spline?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number };
        }).__cadV2F07Spline;
        if (!state) throw new Error("F07 DPR1 SPLINE worker instrumentation is missing");
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      const waitForSplineQuiet = async (description: string, previousTargetCount?: number) => {
        await expect.poll(async () => {
          const state = await readSplineState();
          return (previousTargetCount === undefined || state.targetErrors.length > previousTargetCount) &&
            state.targetErrors.at(-1) === 0.25 && state.refinedReplies === state.targetErrors.length &&
            state.maxLineVertexCount > 2;
        }, { timeout: 30_000, intervals: [100, 250, 500, 1000] }).toBe(true);
        let quietSnapshot = await readSplineState();
        let quiet = false;
        let stableIntervals = 0;
        for (let attempt = 0; attempt < 8 && stableIntervals < 2; attempt++) {
          await splinePage.waitForTimeout(350);
          const next = await readSplineState();
          if (JSON.stringify(next) === JSON.stringify(quietSnapshot)) stableIntervals++;
          else stableIntervals = 0;
          quietSnapshot = next;
        }
        quiet = stableIntervals === 2;
        expect(quiet, description + " must settle with no pending refinement reply").toBe(true);
        expect(quietSnapshot.refinedReplies).toBe(quietSnapshot.targetErrors.length);
        expect(quietSnapshot.targetErrors.at(-1)).toBe(0.25);
        return quietSnapshot;
      };

      let highZoomState = quietAfter;
      let highZoomCamera = rasterContext.camera;
      const zoomButton = splinePage.getByRole("button", { name: "Yakınlaştır (+)" });
      for (const expectedZoom of ["125%", "156%", "195%"] as const) {
        const baseline = await readSplineState();
        await zoomButton.click();
        await expect(splinePage.getByText(expectedZoom)).toBeVisible();
        highZoomState = await waitForSplineQuiet("DPR1 SPLINE " + expectedZoom, baseline.targetErrors.length);
        const camera = await splinePage.evaluate(() => {
          const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
            '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
          );
          if (!input?.__zoom) throw new Error("F07 DPR1 SPLINE D3 camera is missing after zoom");
          return { ...input.__zoom };
        });
        expect(camera.k / highZoomCamera.k).toBeCloseTo(1.25, 6);
        expect(camera.x).toBeCloseTo(rasterContext.cssWidth / 2, 6);
        expect(camera.y).toBeCloseTo(rasterContext.cssHeight / 2, 6);
        expect(highZoomState.targetErrors.length).toBeGreaterThan(baseline.targetErrors.length);
        highZoomCamera = camera;
      }
      expect(highZoomCamera.k / rasterContext.camera.k).toBeCloseTo(1.953125, 6);

      const highZoomPanCssPixels = { x: 48, y: 24 };
      const panInput = splinePage.getByLabel("CAD V2 Çizim Etkileşim Alanı");
      const panBounds = await panInput.boundingBox();
      expect(panBounds).not.toBeNull();
      const frameBeforeHighZoomPan = crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await splinePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await splinePage.mouse.down();
      await splinePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + highZoomPanCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + highZoomPanCssPixels.y,
        { steps: 4 },
      );
      await splinePage.mouse.up();
      const readDpr1SplineDeviceFrame = async () => crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await expect.poll(readDpr1SplineDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeHighZoomPan);
      const cameraAfterHighZoomPan = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR1 SPLINE D3 camera is missing after high-zoom pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterHighZoomPan.x - highZoomCamera.x).toBeCloseTo(highZoomPanCssPixels.x, 6);
      expect(cameraAfterHighZoomPan.y - highZoomCamera.y).toBeCloseTo(highZoomPanCssPixels.y, 6);
      expect(cameraAfterHighZoomPan.k).toBeCloseTo(highZoomCamera.k, 12);
      const highZoomPanState = await waitForSplineQuiet("same-bucket 195% DPR1 SPLINE pan");
      expect(highZoomPanState).toEqual(highZoomState);

      const highZoomPanScreenshot = await canvas.screenshot({ scale: "device" });
      const highZoomPanRasterError = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: highZoomPanScreenshot.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: cameraAfterHighZoomPan,
      });
      expect(highZoomPanRasterError.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(highZoomPanRasterError.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(highZoomPanRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(highZoomPanRasterError.independentSourceSampleCount).toBe(4097);
      expect(highZoomPanRasterError.sourceBounds.minX).toBeGreaterThanOrEqual(0);
      expect(highZoomPanRasterError.sourceBounds.minY).toBeGreaterThanOrEqual(0);
      expect(highZoomPanRasterError.sourceBounds.maxX).toBeLessThan(rasterContext.cssWidth);
      expect(highZoomPanRasterError.sourceBounds.maxY).toBeLessThan(rasterContext.cssHeight);
      expect(highZoomPanRasterError.maximumRenderedToSourceDistanceCssPixels,
        "195% panned DPR1 SPLINE pixels exceeded the independent rational Bernstein envelope: " + JSON.stringify(highZoomPanRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(highZoomPanRasterError.maximumSourceToRenderedDistanceCssPixels,
        "195% panned DPR1 SPLINE source samples had a raster coverage gap: " + JSON.stringify(highZoomPanRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 195% panned DPR1 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        highZoomPanCssPixels, highZoomCamera, cameraAfterHighZoomPan, highZoomPanState, highZoomPanRasterError,
      }));

      const zoomOutBaseline = await readSplineState();
      const zoomOutButton = splinePage.getByRole("button", { name: "Uzaklaştır (-)" });
      const frameBeforeSplineZoomOut = await readDpr1SplineDeviceFrame();
      for (const expectedZoom of ["156%", "125%", "100%", "80%"] as const) {
        await zoomOutButton.click();
        await expect(splinePage.getByText(expectedZoom)).toBeVisible();
      }
      await expect.poll(readDpr1SplineDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeSplineZoomOut);
      const cameraAfter80Zoom = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR1 SPLINE D3 camera is missing at 80%");
        return { ...input.__zoom };
      });
      expect(cameraAfter80Zoom.k / rasterContext.camera.k).toBeCloseTo(0.8, 6);
      const zoomedOutPanOffset = {
        x: cameraAfter80Zoom.x - rasterContext.cssWidth / 2,
        y: cameraAfter80Zoom.y - rasterContext.cssHeight / 2,
      };
      expect(zoomedOutPanOffset.x).toBeCloseTo(
        (cameraAfterHighZoomPan.x - rasterContext.cssWidth / 2) * 0.8 ** 4, 6,
      );
      expect(zoomedOutPanOffset.y).toBeCloseTo(
        (cameraAfterHighZoomPan.y - rasterContext.cssHeight / 2) * 0.8 ** 4, 6,
      );
      const zoomOutQuiet = await waitForSplineQuiet("80% DPR1 SPLINE zoom-out refinement", zoomOutBaseline.targetErrors.length);

      const final80PanCssPixels = { x: -10, y: -5 };
      const frameBeforeFinal80Pan = await readDpr1SplineDeviceFrame();
      await splinePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await splinePage.mouse.down();
      await splinePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + final80PanCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + final80PanCssPixels.y,
        { steps: 4 },
      );
      await splinePage.mouse.up();
      await expect.poll(readDpr1SplineDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeFinal80Pan);
      const cameraAfter80Pan = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR1 SPLINE D3 camera is missing after its 80% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfter80Pan.x - cameraAfter80Zoom.x).toBeCloseTo(final80PanCssPixels.x, 6);
      expect(cameraAfter80Pan.y - cameraAfter80Zoom.y).toBeCloseTo(final80PanCssPixels.y, 6);
      expect(cameraAfter80Pan.k).toBeCloseTo(cameraAfter80Zoom.k, 12);
      const final80PanSnapshot = await readSplineState();
      await splinePage.waitForTimeout(350);
      const final80PanQuietSnapshot = await readSplineState();
      expect(final80PanQuietSnapshot, "80% same-bucket DPR1 pan must not schedule another SPLINE refinement")
        .toEqual(final80PanSnapshot);
      expect(final80PanQuietSnapshot).toEqual(zoomOutQuiet);
      expect(final80PanQuietSnapshot.refinedReplies).toBe(final80PanQuietSnapshot.targetErrors.length);
      expect(final80PanQuietSnapshot.targetErrors.at(-1)).toBe(0.25);

      const final80PanScreenshot = await canvas.screenshot({ scale: "device" });
      const final80PanRasterError = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: final80PanScreenshot.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: cameraAfter80Pan,
      });
      expect(final80PanRasterError.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(final80PanRasterError.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(final80PanRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(final80PanRasterError.independentSourceSampleCount).toBe(4097);
      expect(final80PanRasterError.sourceBounds.minX).toBeGreaterThanOrEqual(0);
      expect(final80PanRasterError.sourceBounds.minY).toBeGreaterThanOrEqual(0);
      expect(final80PanRasterError.sourceBounds.maxX).toBeLessThan(rasterContext.cssWidth);
      expect(final80PanRasterError.sourceBounds.maxY).toBeLessThan(rasterContext.cssHeight);
      expect(final80PanRasterError.maximumRenderedToSourceDistanceCssPixels,
        "80% panned DPR1 SPLINE pixels exceeded the independent rational Bernstein envelope: " + JSON.stringify(final80PanRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(final80PanRasterError.maximumSourceToRenderedDistanceCssPixels,
        "80% panned DPR1 SPLINE source samples had a raster coverage gap: " + JSON.stringify(final80PanRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 80% panned DPR1 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        final80PanCssPixels, cameraAfter80Zoom, cameraAfter80Pan, zoomOutQuiet, final80PanQuietSnapshot, final80PanRasterError,
      }));
    } finally {
      await context.close();
    }
  });
  test("runtime-refined SPLINE pan raster error is bounded at DPR2", async ({ browser, page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserSplineRefinementScene();
    const sceneChunk = scene.chunks.get("chunk_f07_spline");
    if (!sceneChunk) throw new Error("F07 DPR2 SPLINE fixture chunk was not created");
    const metadata = parseSceneChunk(sceneChunk).sections.get(SceneTag.META)?.data as Uint8Array | undefined;
    if (!metadata) throw new Error("F07 DPR2 SPLINE source metadata was not encoded");
    const fixtureMeta = JSON.parse(new TextDecoder().decode(metadata)) as {
      curveSourceRefs: Array<{ sourceType: string; splineSource?: { controlPoints: [number, number][]; weights: number[] } }>;
    };
    expect(fixtureMeta.curveSourceRefs[0]).toMatchObject({
      sourceType: "SPLINE",
      splineSource: { controlPoints: scene.controlPoints, weights: scene.weights },
    });

    const context = await browser.newContext({
      baseURL: new URL(page.url()).origin,
      deviceScaleFactor: 2,
      viewport: { width: 1280, height: 720 },
      storageState: await page.context().storageState(),
    });
    try {
      const splinePage = await context.newPage();
      await configureF07SplineRefinementPage(splinePage, scene, "vs_f07_runtime_spline_dpr2_pan");
      await splinePage.goto("/dokumantasyon/dosya/" + fileId + "?cadEngine=v2");
      const canvas = splinePage.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 60_000 });
      await expect(splinePage.getByText("Varlık:")).toBeVisible({ timeout: 60_000 });

      const readState = async () => splinePage.evaluate(() => {
        const state = (window as Window & {
          __cadV2F07Spline?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number };
        }).__cadV2F07Spline;
        if (!state) throw new Error("F07 DPR2 SPLINE worker instrumentation is missing");
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      const waitForQuiet = async (description: string, afterTargetCount = 0) => {
        await expect.poll(async () => {
          const state = await readState();
          return state.targetErrors.length > afterTargetCount && state.targetErrors.at(-1) === 0.25 &&
            state.refinedReplies === state.targetErrors.length && state.maxLineVertexCount > 2;
        }, { timeout: 30_000, intervals: [100, 250, 500, 1000] }).toBe(true);
        let quietSnapshot = await readState();
        let quiet = false;
        for (let attempt = 0; attempt < 5 && !quiet; attempt++) {
          await splinePage.waitForTimeout(350);
          const next = await readState();
          if (JSON.stringify(next) === JSON.stringify(quietSnapshot)) quiet = true;
          quietSnapshot = next;
        }
        expect(quiet, description + " should remain stable with no pending replies").toBe(true);
        expect(quietSnapshot.refinedReplies).toBe(quietSnapshot.targetErrors.length);
        expect(quietSnapshot.targetErrors.at(-1)).toBe(0.25);
        return quietSnapshot;
      };

      const beforePanQuiet = await waitForQuiet("DPR2 SPLINE fit refinement");
      const rasterContext = await splinePage.evaluate(() => {
        const canvasElement = document.querySelector("canvas");
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!canvasElement || !input?.__zoom) throw new Error("F07 DPR2 SPLINE canvas/camera is missing");
        return {
          devicePixelRatio: window.devicePixelRatio,
          cssWidth: canvasElement.clientWidth,
          cssHeight: canvasElement.clientHeight,
          drawingBufferWidth: canvasElement.width,
          drawingBufferHeight: canvasElement.height,
          camera: { ...input.__zoom },
        };
      });
      expect(rasterContext.devicePixelRatio).toBe(2);
      expect(rasterContext.drawingBufferWidth).toBe(rasterContext.cssWidth * 2);
      expect(rasterContext.drawingBufferHeight).toBe(rasterContext.cssHeight * 2);
      expect(rasterContext.camera.k).toBeCloseTo(6.08, 6);
      expect(rasterContext.camera.x).toBeCloseTo(rasterContext.cssWidth / 2, 6);
      expect(rasterContext.camera.y).toBeCloseTo(rasterContext.cssHeight / 2, 6);

      const panCssPixels = { x: 48, y: 24 };
      const panInput = splinePage.getByLabel("CAD V2 Çizim Etkileşim Alanı");
      const panBounds = await panInput.boundingBox();
      expect(panBounds).not.toBeNull();
      const frameBeforePan = crypto.createHash("sha256").update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await splinePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await splinePage.mouse.down();
      await splinePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + panCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + panCssPixels.y,
        { steps: 4 },
      );
      await splinePage.mouse.up();
      const readDeviceFrame = async () => crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforePan);

      const cameraAfterPan = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 SPLINE camera is missing after pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterPan.x - rasterContext.camera.x).toBeCloseTo(panCssPixels.x, 6);
      expect(cameraAfterPan.y - rasterContext.camera.y).toBeCloseTo(panCssPixels.y, 6);
      expect(cameraAfterPan.k).toBeCloseTo(rasterContext.camera.k, 12);
      const panQuiet = await waitForQuiet("panned DPR2 SPLINE refinement");

      const screenshot = await canvas.screenshot({ scale: "device" });
      const rasterError = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: screenshot.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: cameraAfterPan,
      });
      expect(rasterError.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(rasterError.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(rasterError.bluePixelCount).toBeGreaterThan(100);
      expect(rasterError.independentSourceSampleCount).toBe(4097);
      expect(rasterError.maximumRenderedToSourceDistanceCssPixels,
        "DPR2 panned SPLINE pixels exceeded the independent rational Bernstein envelope: " + JSON.stringify(rasterError))
        .toBeLessThanOrEqual(1.25);
      expect(rasterError.maximumSourceToRenderedDistanceCssPixels,
        "DPR2 panned SPLINE source samples had a raster gap: " + JSON.stringify(rasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 panned DPR2 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        panCssPixels, rasterContext, cameraAfterPan, beforePanQuiet, panQuiet, rasterError,
      }));

      const zoomBaseline = await readState();
      await splinePage.getByRole("button", { name: "Yakınlaştır (+)" }).click();
      await expect(splinePage.getByText("125%")).toBeVisible();
      const zoomQuiet = await waitForQuiet("125% DPR2 SPLINE zoom refinement", zoomBaseline.targetErrors.length);
      const cameraAfterZoom = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 SPLINE D3 camera is missing after zoom");
        return { ...input.__zoom };
      });
      expect(cameraAfterZoom.k / cameraAfterPan.k).toBeCloseTo(1.25, 6);
      expect(cameraAfterZoom.x).toBeCloseTo(rasterContext.cssWidth / 2 + panCssPixels.x * 1.25, 6);
      expect(cameraAfterZoom.y).toBeCloseTo(rasterContext.cssHeight / 2 + panCssPixels.y * 1.25, 6);
      expect(zoomQuiet.refinedReplies).toBe(zoomQuiet.targetErrors.length);
      expect(zoomQuiet.targetErrors.at(-1)).toBe(0.25);

      const zoomPanCssPixels = { x: 48, y: 24 };
      const frameBeforeZoomPan = await readDeviceFrame();
      await splinePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await splinePage.mouse.down();
      await splinePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + zoomPanCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + zoomPanCssPixels.y,
        { steps: 4 },
      );
      await splinePage.mouse.up();
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeZoomPan);
      const cameraAfterZoomPan = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 SPLINE D3 camera is missing after zoom-pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterZoomPan.x - cameraAfterZoom.x).toBeCloseTo(zoomPanCssPixels.x, 6);
      expect(cameraAfterZoomPan.y - cameraAfterZoom.y).toBeCloseTo(zoomPanCssPixels.y, 6);
      expect(cameraAfterZoomPan.k).toBeCloseTo(cameraAfterZoom.k, 12);
      const zoomedPanOffset = {
        x: cameraAfterZoomPan.x - rasterContext.cssWidth / 2,
        y: cameraAfterZoomPan.y - rasterContext.cssHeight / 2,
      };
      expect(zoomedPanOffset.x).toBeCloseTo(panCssPixels.x * 1.25 + zoomPanCssPixels.x, 6);
      expect(zoomedPanOffset.y).toBeCloseTo(panCssPixels.y * 1.25 + zoomPanCssPixels.y, 6);
      const zoomPanQuiet = await waitForQuiet("panned 125% DPR2 SPLINE refinement");
      const zoomPanScreenshot = await canvas.screenshot({ scale: "device" });
      const zoomPanRasterError = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: zoomPanScreenshot.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: cameraAfterZoomPan,
      });
      expect(zoomPanRasterError.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(zoomPanRasterError.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(zoomPanRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(zoomPanRasterError.independentSourceSampleCount).toBe(4097);
      expect(zoomPanRasterError.maximumRenderedToSourceDistanceCssPixels,
        "125% panned DPR2 SPLINE pixels exceeded the independent rational Bernstein envelope: " + JSON.stringify(zoomPanRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(zoomPanRasterError.maximumSourceToRenderedDistanceCssPixels,
        "125% panned DPR2 SPLINE source samples had a raster coverage gap: " + JSON.stringify(zoomPanRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(zoomPanQuiet.refinedReplies).toBe(zoomPanQuiet.targetErrors.length);
      expect(zoomPanQuiet.targetErrors.at(-1)).toBe(0.25);
      console.log("F07 125% panned DPR2 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        zoomBaseline, zoomQuiet, cameraAfterZoom, zoomPanCssPixels, cameraAfterZoomPan, zoomPanQuiet, zoomPanRasterError,
      }));

      const highZoomBaseline = await readState();
      await splinePage.getByRole("button", { name: "Yakınlaştır (+)" }).click();
      await expect(splinePage.getByText("156%")).toBeVisible();
      const highZoomQuiet = await waitForQuiet("156% DPR2 SPLINE zoom refinement", highZoomBaseline.targetErrors.length);
      const cameraAfterHighZoom = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 SPLINE D3 camera is missing after 156% zoom");
        return { ...input.__zoom };
      });
      expect(cameraAfterHighZoom.k / cameraAfterZoomPan.k).toBeCloseTo(1.25, 6);
      expect(cameraAfterHighZoom.x).toBeCloseTo(
        rasterContext.cssWidth / 2 + zoomedPanOffset.x * 1.25, 6,
      );
      expect(cameraAfterHighZoom.y).toBeCloseTo(
        rasterContext.cssHeight / 2 + zoomedPanOffset.y * 1.25, 6,
      );
      expect(highZoomQuiet.refinedReplies).toBe(highZoomQuiet.targetErrors.length);
      expect(highZoomQuiet.targetErrors.at(-1)).toBe(0.25);

      const highZoomPanCssPixels = { x: 48, y: 24 };
      const frameBeforeHighZoomPan = await readDeviceFrame();
      await splinePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await splinePage.mouse.down();
      await splinePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + highZoomPanCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + highZoomPanCssPixels.y,
        { steps: 4 },
      );
      await splinePage.mouse.up();
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeHighZoomPan);
      const cameraAfterHighZoomPan = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 SPLINE D3 camera is missing after 156% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterHighZoomPan.x - cameraAfterHighZoom.x).toBeCloseTo(highZoomPanCssPixels.x, 6);
      expect(cameraAfterHighZoomPan.y - cameraAfterHighZoom.y).toBeCloseTo(highZoomPanCssPixels.y, 6);
      expect(cameraAfterHighZoomPan.k).toBeCloseTo(cameraAfterHighZoom.k, 12);
      const highZoomPanOffset = {
        x: cameraAfterHighZoomPan.x - rasterContext.cssWidth / 2,
        y: cameraAfterHighZoomPan.y - rasterContext.cssHeight / 2,
      };
      expect(highZoomPanOffset.x).toBeCloseTo(zoomedPanOffset.x * 1.25 + highZoomPanCssPixels.x, 6);
      expect(highZoomPanOffset.y).toBeCloseTo(zoomedPanOffset.y * 1.25 + highZoomPanCssPixels.y, 6);
      const highZoomPanQuiet = await waitForQuiet("panned 156% DPR2 SPLINE refinement");
      const highZoomPanScreenshot = await canvas.screenshot({ scale: "device" });
      const highZoomPanRasterError = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: highZoomPanScreenshot.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: cameraAfterHighZoomPan,
      });
      expect(highZoomPanRasterError.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(highZoomPanRasterError.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(highZoomPanRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(highZoomPanRasterError.independentSourceSampleCount).toBe(4097);
      expect(highZoomPanRasterError.sourceBounds.minX).toBeGreaterThanOrEqual(0);
      expect(highZoomPanRasterError.sourceBounds.minY).toBeGreaterThanOrEqual(0);
      expect(highZoomPanRasterError.sourceBounds.maxX).toBeLessThan(rasterContext.cssWidth);
      expect(highZoomPanRasterError.sourceBounds.maxY).toBeLessThan(rasterContext.cssHeight);
      expect(highZoomPanRasterError.maximumRenderedToSourceDistanceCssPixels,
        "156% panned DPR2 SPLINE pixels exceeded the independent rational Bernstein envelope: " + JSON.stringify(highZoomPanRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(highZoomPanRasterError.maximumSourceToRenderedDistanceCssPixels,
        "156% panned DPR2 SPLINE source samples had a raster coverage gap: " + JSON.stringify(highZoomPanRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(highZoomPanQuiet.refinedReplies).toBe(highZoomPanQuiet.targetErrors.length);
      expect(highZoomPanQuiet.targetErrors.at(-1)).toBe(0.25);
      console.log("F07 156% panned DPR2 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        highZoomBaseline, highZoomQuiet, cameraAfterHighZoom, highZoomPanCssPixels,
        cameraAfterHighZoomPan, highZoomPanQuiet, highZoomPanRasterError,
      }));

      const ultraZoomBaseline = await readState();
      const frameBefore195Zoom = await readDeviceFrame();
      await splinePage.getByRole("button", { name: "Yakınlaştır (+)" }).click();
      await expect(splinePage.getByText("195%")).toBeVisible();
      const ultraZoomQuiet = await waitForQuiet("195% DPR2 SPLINE zoom refinement", ultraZoomBaseline.targetErrors.length);
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBefore195Zoom);
      const cameraAfter195Zoom = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 SPLINE D3 camera is missing after 195% zoom");
        return { ...input.__zoom };
      });
      expect(cameraAfter195Zoom.k / cameraAfterHighZoomPan.k).toBeCloseTo(1.25, 6);
      expect(cameraAfter195Zoom.x).toBeCloseTo(
        rasterContext.cssWidth / 2 + highZoomPanOffset.x * 1.25, 6,
      );
      expect(cameraAfter195Zoom.y).toBeCloseTo(
        rasterContext.cssHeight / 2 + highZoomPanOffset.y * 1.25, 6,
      );
      expect(ultraZoomQuiet.refinedReplies).toBe(ultraZoomQuiet.targetErrors.length);
      expect(ultraZoomQuiet.targetErrors.at(-1)).toBe(0.25);
      const ultraZoomScreenshot = await canvas.screenshot({ scale: "device" });
      const ultraZoomRasterError = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: ultraZoomScreenshot.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: cameraAfter195Zoom,
      });
      expect(ultraZoomRasterError.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(ultraZoomRasterError.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(ultraZoomRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(ultraZoomRasterError.independentSourceSampleCount).toBe(4097);
      expect(ultraZoomRasterError.sourceBounds.minX).toBeGreaterThanOrEqual(0);
      expect(ultraZoomRasterError.sourceBounds.minY).toBeGreaterThanOrEqual(0);
      expect(ultraZoomRasterError.sourceBounds.maxX).toBeLessThan(rasterContext.cssWidth);
      expect(ultraZoomRasterError.sourceBounds.maxY).toBeLessThan(rasterContext.cssHeight);
      expect(ultraZoomRasterError.maximumRenderedToSourceDistanceCssPixels,
        "195% DPR2 SPLINE pixels exceeded the independent rational Bernstein envelope: " + JSON.stringify(ultraZoomRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(ultraZoomRasterError.maximumSourceToRenderedDistanceCssPixels,
        "195% DPR2 SPLINE source samples had a raster coverage gap: " + JSON.stringify(ultraZoomRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 195% DPR2 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        ultraZoomBaseline, ultraZoomQuiet, cameraAfter195Zoom, ultraZoomRasterError,
      }));

      const final195PanCssPixels = { x: -10, y: -5 };
      const frameBeforeFinal195Pan = await readDeviceFrame();
      await splinePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await splinePage.mouse.down();
      await splinePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + final195PanCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + final195PanCssPixels.y,
        { steps: 4 },
      );
      await splinePage.mouse.up();
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeFinal195Pan);
      const cameraAfterFinal195Pan = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 SPLINE camera is missing after its 195% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterFinal195Pan.x - cameraAfter195Zoom.x).toBeCloseTo(final195PanCssPixels.x, 6);
      expect(cameraAfterFinal195Pan.y - cameraAfter195Zoom.y).toBeCloseTo(final195PanCssPixels.y, 6);
      expect(cameraAfterFinal195Pan.k).toBeCloseTo(cameraAfter195Zoom.k, 12);
      const final195PanOffset = {
        x: cameraAfterFinal195Pan.x - rasterContext.cssWidth / 2,
        y: cameraAfterFinal195Pan.y - rasterContext.cssHeight / 2,
      };
      expect(final195PanOffset.x).toBeCloseTo(highZoomPanOffset.x * 1.25 + final195PanCssPixels.x, 6);
      expect(final195PanOffset.y).toBeCloseTo(highZoomPanOffset.y * 1.25 + final195PanCssPixels.y, 6);

      let final195PanQuiet = false;
      let final195PanQuietSnapshot = await readState();
      for (let attempt = 0; attempt < 5 && !final195PanQuiet; attempt++) {
        await splinePage.waitForTimeout(350);
        const next = await readState();
        if (JSON.stringify(next) === JSON.stringify(final195PanQuietSnapshot)) final195PanQuiet = true;
        final195PanQuietSnapshot = next;
      }
      expect(final195PanQuiet, "panned 195% DPR2 SPLINE should not schedule another refinement reply").toBe(true);
      expect(final195PanQuietSnapshot.targetErrors).toEqual(ultraZoomQuiet.targetErrors);
      expect(final195PanQuietSnapshot.refinedReplies).toBe(ultraZoomQuiet.refinedReplies);
      expect(final195PanQuietSnapshot.refinedReplies).toBe(final195PanQuietSnapshot.targetErrors.length);
      expect(final195PanQuietSnapshot.targetErrors.at(-1)).toBe(0.25);
      expect(final195PanQuietSnapshot.maxLineVertexCount).toBe(ultraZoomQuiet.maxLineVertexCount);

      const final195PanScreenshot = await canvas.screenshot({ scale: "device" });
      const final195PanRasterError = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: final195PanScreenshot.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: cameraAfterFinal195Pan,
      });
      expect(final195PanRasterError.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(final195PanRasterError.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(final195PanRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(final195PanRasterError.independentSourceSampleCount).toBe(4097);
      expect(final195PanRasterError.sourceBounds.minX).toBeGreaterThanOrEqual(0);
      expect(final195PanRasterError.sourceBounds.minY).toBeGreaterThanOrEqual(0);
      expect(final195PanRasterError.sourceBounds.maxX).toBeLessThan(rasterContext.cssWidth);
      expect(final195PanRasterError.sourceBounds.maxY).toBeLessThan(rasterContext.cssHeight);
      expect(final195PanRasterError.maximumRenderedToSourceDistanceCssPixels,
        "195% panned DPR2 SPLINE pixels exceeded the independent rational Bernstein envelope: " + JSON.stringify(final195PanRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(final195PanRasterError.maximumSourceToRenderedDistanceCssPixels,
        "195% panned DPR2 SPLINE source samples had a raster coverage gap: " + JSON.stringify(final195PanRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 195% panned DPR2 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        final195PanCssPixels, cameraAfter195Zoom, cameraAfterFinal195Pan, final195PanQuietSnapshot, final195PanRasterError,
      }));

      const zoomOutBaseline = await readState();
      const zoomOutButton = splinePage.getByRole("button", { name: "Uzaklaştır (-)" });
      const frameBeforeSplineZoomOut = await readDeviceFrame();
      for (const expectedZoom of ["156%", "125%", "100%", "80%"] as const) {
        await zoomOutButton.click();
        await expect(splinePage.getByText(expectedZoom)).toBeVisible();
      }
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeSplineZoomOut);
      const cameraAfter80Zoom = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 SPLINE D3 camera is missing at 80%");
        return { ...input.__zoom };
      });
      expect(cameraAfter80Zoom.k / rasterContext.camera.k).toBeCloseTo(0.8, 6);
      const zoomedOutPanOffset = {
        x: cameraAfter80Zoom.x - rasterContext.cssWidth / 2,
        y: cameraAfter80Zoom.y - rasterContext.cssHeight / 2,
      };
      expect(zoomedOutPanOffset.x).toBeCloseTo(final195PanOffset.x * 0.8 ** 4, 6);
      expect(zoomedOutPanOffset.y).toBeCloseTo(final195PanOffset.y * 0.8 ** 4, 6);
      const zoomOutQuiet = await waitForQuiet("80% DPR2 SPLINE zoom-out refinement", zoomOutBaseline.targetErrors.length);

      const final80PanCssPixels = { x: -10, y: -5 };
      const frameBeforeFinal80Pan = await readDeviceFrame();
      await splinePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await splinePage.mouse.down();
      await splinePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + final80PanCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + final80PanCssPixels.y,
        { steps: 4 },
      );
      await splinePage.mouse.up();
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeFinal80Pan);
      const cameraAfter80Pan = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 SPLINE D3 camera is missing after its 80% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfter80Pan.x - cameraAfter80Zoom.x).toBeCloseTo(final80PanCssPixels.x, 6);
      expect(cameraAfter80Pan.y - cameraAfter80Zoom.y).toBeCloseTo(final80PanCssPixels.y, 6);
      expect(cameraAfter80Pan.k).toBeCloseTo(cameraAfter80Zoom.k, 12);
      const final80PanOffset = {
        x: cameraAfter80Pan.x - rasterContext.cssWidth / 2,
        y: cameraAfter80Pan.y - rasterContext.cssHeight / 2,
      };
      expect(final80PanOffset.x).toBeCloseTo(zoomedOutPanOffset.x + final80PanCssPixels.x, 6);
      expect(final80PanOffset.y).toBeCloseTo(zoomedOutPanOffset.y + final80PanCssPixels.y, 6);

      const final80PanSnapshot = await readState();
      await splinePage.waitForTimeout(350);
      const final80PanQuietSnapshot = await readState();
      expect(final80PanQuietSnapshot, "80% same-bucket pan must not schedule another SPLINE refinement").toEqual(final80PanSnapshot);
      expect(final80PanQuietSnapshot.targetErrors).toEqual(zoomOutQuiet.targetErrors);
      expect(final80PanQuietSnapshot.refinedReplies).toBe(final80PanQuietSnapshot.targetErrors.length);
      expect(final80PanQuietSnapshot.targetErrors.at(-1)).toBe(0.25);

      const final80PanScreenshot = await canvas.screenshot({ scale: "device" });
      const final80PanRasterError = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: final80PanScreenshot.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: cameraAfter80Pan,
      });
      expect(final80PanRasterError.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(final80PanRasterError.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(final80PanRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(final80PanRasterError.independentSourceSampleCount).toBe(4097);
      expect(final80PanRasterError.sourceBounds.minX).toBeGreaterThanOrEqual(0);
      expect(final80PanRasterError.sourceBounds.minY).toBeGreaterThanOrEqual(0);
      expect(final80PanRasterError.sourceBounds.maxX).toBeLessThan(rasterContext.cssWidth);
      expect(final80PanRasterError.sourceBounds.maxY).toBeLessThan(rasterContext.cssHeight);
      expect(final80PanRasterError.maximumRenderedToSourceDistanceCssPixels,
        "80% panned DPR2 SPLINE pixels exceeded the independent rational Bernstein envelope: " + JSON.stringify(final80PanRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(final80PanRasterError.maximumSourceToRenderedDistanceCssPixels,
        "80% panned DPR2 SPLINE source samples had a raster coverage gap: " + JSON.stringify(final80PanRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 80% panned DPR2 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        final80PanCssPixels, cameraAfter80Zoom, cameraAfter80Pan, zoomOutQuiet, final80PanQuietSnapshot, final80PanRasterError,
      }));
    } finally {
      await context.close();
    }
  });

  test("runtime-refined ELLIPSE raster error is bounded after a DPR2 pan", async ({ browser, page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserEllipseRefinementScene();
    const context = await browser.newContext({
      baseURL: new URL(page.url()).origin,
      deviceScaleFactor: 2,
      viewport: { width: 1280, height: 720 },
      storageState: await page.context().storageState(),
    });

    try {
      const ellipsePage = await context.newPage();
      await configureF07EllipseRefinementPage(ellipsePage, scene, "vs_f07_runtime_ellipse_dpr2_pan");
      await ellipsePage.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
      const canvas = ellipsePage.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 60_000 });
      await expect(ellipsePage.getByText("Varlık:")).toBeVisible({ timeout: 60_000 });
      await expect.poll(() => ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse;
        return Boolean(state && state.targetErrors.includes(0.25) &&
          state.refinedReplies >= state.targetErrors.length && state.maxLineVertexCount > 2);
      }), { timeout: 30_000, intervals: [100, 250, 500, 1000] }).toBe(true);

      await ellipsePage.waitForTimeout(350);
      const quietBefore = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      await ellipsePage.waitForTimeout(350);
      const quietAfter = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      expect(quietAfter).toEqual(quietBefore);
      expect(quietAfter.targetErrors.at(-1)).toBe(0.25);
      expect(quietAfter.refinedReplies).toBe(quietAfter.targetErrors.length);

      const rasterContext = await ellipsePage.evaluate(() => {
        const canvasElement = document.querySelector("canvas");
        if (!canvasElement) throw new Error("F07 DPR2 ELLIPSE canvas is missing");
        return {
          devicePixelRatio: window.devicePixelRatio,
          cssWidth: canvasElement.clientWidth,
          cssHeight: canvasElement.clientHeight,
          drawingBufferWidth: canvasElement.width,
          drawingBufferHeight: canvasElement.height,
        };
      });
      expect(rasterContext.devicePixelRatio).toBe(2);
      expect(rasterContext.drawingBufferWidth).toBe(rasterContext.cssWidth * 2);
      expect(rasterContext.drawingBufferHeight).toBe(rasterContext.cssHeight * 2);

      const panInput = ellipsePage.getByLabel("CAD V2 Çizim Etkileşim Alanı");
      const panBounds = await panInput.boundingBox();
      expect(panBounds).not.toBeNull();
      const cameraBeforePan = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ELLIPSE D3 camera transform is missing");
        return { ...input.__zoom };
      });
      const panCssPixels = { x: 48, y: 24 };
      const frameBeforePan = crypto.createHash("sha256").update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await ellipsePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await ellipsePage.mouse.down();
      await ellipsePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + panCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + panCssPixels.y,
        { steps: 4 },
      );
      await ellipsePage.mouse.up();
      const readDeviceFrame = async () => crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforePan);

      const cameraAfterPan = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ELLIPSE D3 camera transform is missing after pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterPan.x - cameraBeforePan.x).toBeCloseTo(panCssPixels.x, 6);
      expect(cameraAfterPan.y - cameraBeforePan.y).toBeCloseTo(panCssPixels.y, 6);
      expect(cameraAfterPan.k).toBeCloseTo(cameraBeforePan.k, 12);

      let panQuiet = false;
      let panQuietSnapshot = quietAfter;
      for (let attempt = 0; attempt < 5 && !panQuiet; attempt++) {
        await ellipsePage.waitForTimeout(350);
        const snapshot = await ellipsePage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
          return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
        });
        if (snapshot.refinedReplies >= snapshot.targetErrors.length && snapshot.targetErrors.at(-1) === 0.25) {
          await ellipsePage.waitForTimeout(350);
          const quiet = await ellipsePage.evaluate(() => {
            const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
            return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
          });
          if (JSON.stringify(quiet) === JSON.stringify(snapshot)) {
            panQuiet = true;
            panQuietSnapshot = quiet;
          }
        }
      }
      expect(panQuiet, "panned DPR2 ELLIPSE should retain idle refinement with no pending replies").toBe(true);
      expect(panQuietSnapshot.maxLineVertexCount).toBeGreaterThan(2);

      const screenshot = await canvas.screenshot({ scale: "device" });
      const rasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: screenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        panCssPixels,
      });
      expect(rasterError.imageWidth).toBe(rasterContext.cssWidth * 2);
      expect(rasterError.imageHeight).toBe(rasterContext.cssHeight * 2);
      expect(rasterError.bluePixelCount).toBeGreaterThan(100);
      expect(rasterError.maximumRenderedToSourceDistanceCssPixels,
        `DPR2 panned ELLIPSE pixels exceeded the independent parametric source envelope: ${JSON.stringify(rasterError)}`)
        .toBeLessThanOrEqual(1.25);
      expect(rasterError.maximumSourceToRenderedDistanceCssPixels,
        `DPR2 panned ELLIPSE source samples had a raster coverage gap: ${JSON.stringify(rasterError)}`)
        .toBeLessThanOrEqual(1.25);
      console.log(`F07 panned DPR2 runtime-refined ELLIPSE pixel envelope PASS: ${JSON.stringify({ panCssPixels, cameraBeforePan, cameraAfterPan, rasterContext, panQuietSnapshot, rasterError })}`);

      const zoomBaseline = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number } }).__cadV2F07Ellipse!;
        return { targetCount: state.targetErrors.length, refinedReplies: state.refinedReplies };
      });
      await ellipsePage.getByRole("button", { name: "Yakınlaştır (+)" }).click();
      await expect(ellipsePage.getByText("125%")).toBeVisible();
      await expect.poll(() => ellipsePage.evaluate((baseline) => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number } }).__cadV2F07Ellipse!;
        return state.targetErrors.length > baseline.targetCount && state.targetErrors.at(-1) === 0.25 &&
          state.refinedReplies >= state.targetErrors.length;
      }, zoomBaseline), { timeout: 20_000 }).toBe(true);

      let zoomQuiet = false;
      let zoomQuietSnapshot = panQuietSnapshot;
      for (let attempt = 0; attempt < 5 && !zoomQuiet; attempt++) {
        await ellipsePage.waitForTimeout(350);
        const snapshot = await ellipsePage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
          return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
        });
        if (snapshot.refinedReplies >= snapshot.targetErrors.length && snapshot.targetErrors.at(-1) === 0.25) {
          await ellipsePage.waitForTimeout(350);
          const quiet = await ellipsePage.evaluate(() => {
            const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
            return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
          });
          if (JSON.stringify(quiet) === JSON.stringify(snapshot)) {
            zoomQuiet = true;
            zoomQuietSnapshot = quiet;
          }
        }
      }
      expect(zoomQuiet, "125% DPR2 ELLIPSE refinement should settle after its idle response").toBe(true);
      expect(zoomQuietSnapshot.maxLineVertexCount).toBeGreaterThan(2);
      const cameraAfterZoom = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ELLIPSE D3 camera transform is missing at 125%");
        return { ...input.__zoom };
      });
      expect(cameraAfterZoom.k / cameraAfterPan.k).toBeCloseTo(1.25, 6);
      expect(cameraAfterZoom.x).toBeCloseTo(rasterContext.cssWidth / 2 + panCssPixels.x * 1.25, 6);
      expect(cameraAfterZoom.y).toBeCloseTo(rasterContext.cssHeight / 2 + panCssPixels.y * 1.25, 6);

      const zoomPanCssPixels = { x: 48, y: 24 };
      const frameBeforeZoomPan = await readDeviceFrame();
      await ellipsePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await ellipsePage.mouse.down();
      await ellipsePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + zoomPanCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + zoomPanCssPixels.y,
        { steps: 4 },
      );
      await ellipsePage.mouse.up();
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeZoomPan);
      const cameraAfterZoomPan = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ELLIPSE D3 camera transform is missing after 125% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterZoomPan.x - cameraAfterZoom.x).toBeCloseTo(zoomPanCssPixels.x, 6);
      expect(cameraAfterZoomPan.y - cameraAfterZoom.y).toBeCloseTo(zoomPanCssPixels.y, 6);
      expect(cameraAfterZoomPan.k).toBeCloseTo(cameraAfterZoom.k, 12);
      const zoomedPanOffset = {
        x: cameraAfterZoomPan.x - rasterContext.cssWidth / 2,
        y: cameraAfterZoomPan.y - rasterContext.cssHeight / 2,
      };
      expect(zoomedPanOffset.x).toBeCloseTo(panCssPixels.x * 1.25 + zoomPanCssPixels.x, 6);
      expect(zoomedPanOffset.y).toBeCloseTo(panCssPixels.y * 1.25 + zoomPanCssPixels.y, 6);

      let zoomPanQuiet = false;
      let zoomPanQuietSnapshot = zoomQuietSnapshot;
      for (let attempt = 0; attempt < 5 && !zoomPanQuiet; attempt++) {
        await ellipsePage.waitForTimeout(350);
        const snapshot = await ellipsePage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
          return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
        });
        if (snapshot.refinedReplies >= snapshot.targetErrors.length && snapshot.targetErrors.at(-1) === 0.25) {
          await ellipsePage.waitForTimeout(350);
          const quiet = await ellipsePage.evaluate(() => {
            const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
            return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
          });
          if (JSON.stringify(quiet) === JSON.stringify(snapshot)) {
            zoomPanQuiet = true;
            zoomPanQuietSnapshot = quiet;
          }
        }
      }
      expect(zoomPanQuiet, "panned 125% DPR2 ELLIPSE should retain idle refinement with no pending replies").toBe(true);
      const zoomedScreenshot = await canvas.screenshot({ scale: "device" });
      const zoomedRasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: zoomedScreenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        zoomFactor: 1.25,
        panCssPixels: zoomedPanOffset,
      });
      expect(zoomedRasterError.imageWidth).toBe(rasterContext.cssWidth * 2);
      expect(zoomedRasterError.imageHeight).toBe(rasterContext.cssHeight * 2);
      expect(zoomedRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(zoomedRasterError.maximumRenderedToSourceDistanceCssPixels,
        `125% panned DPR2 ELLIPSE pixels exceeded the independent source envelope: ${JSON.stringify(zoomedRasterError)}`)
        .toBeLessThanOrEqual(1.25);
      expect(zoomedRasterError.maximumSourceToRenderedDistanceCssPixels,
        `125% panned DPR2 ELLIPSE source samples had a raster gap: ${JSON.stringify(zoomedRasterError)}`)
        .toBeLessThanOrEqual(1.25);
      console.log(`F07 125% panned DPR2 runtime-refined ELLIPSE pixel envelope PASS: ${JSON.stringify({ zoomedPanOffset, cameraAfterZoom, cameraAfterZoomPan, zoomPanQuietSnapshot, zoomedRasterError })}`);

      const zoomOutBaseline = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number } }).__cadV2F07Ellipse!;
        return { targetCount: state.targetErrors.length, refinedReplies: state.refinedReplies };
      });
      const zoomOutButton = ellipsePage.getByRole("button", { name: "Uzaklaştır (-)" });
      const frameBeforeZoomOut = await readDeviceFrame();
      await zoomOutButton.click();
      await expect(ellipsePage.getByText("100%")).toBeVisible();
      await zoomOutButton.click();
      await expect(ellipsePage.getByText("80%")).toBeVisible();
      await expect.poll(() => ellipsePage.evaluate((baseline) => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number } }).__cadV2F07Ellipse!;
        return state.targetErrors.length > baseline.targetCount && state.targetErrors.at(-1) === 0.25 &&
          state.refinedReplies >= state.targetErrors.length;
      }, zoomOutBaseline), { timeout: 20_000, intervals: [100, 250, 500, 1000] }).toBe(true);
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeZoomOut);

      let zoomOutQuiet = false;
      let zoomOutQuietSnapshot = zoomPanQuietSnapshot;
      for (let attempt = 0; attempt < 5 && !zoomOutQuiet; attempt++) {
        await ellipsePage.waitForTimeout(350);
        const snapshot = await ellipsePage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
          return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
        });
        if (snapshot.refinedReplies >= snapshot.targetErrors.length && snapshot.targetErrors.at(-1) === 0.25) {
          await ellipsePage.waitForTimeout(350);
          const quiet = await ellipsePage.evaluate(() => {
            const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
            return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
          });
          if (JSON.stringify(quiet) === JSON.stringify(snapshot)) {
            zoomOutQuiet = true;
            zoomOutQuietSnapshot = quiet;
          }
        }
      }
      expect(zoomOutQuiet, "80% DPR2 ELLIPSE refinement should settle with no pending replies").toBe(true);
      expect(zoomOutQuietSnapshot.maxLineVertexCount).toBeGreaterThan(2);

      const cameraAfterZoomOut = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ELLIPSE D3 camera transform is missing at 80%");
        return { ...input.__zoom };
      });
      expect(cameraAfterZoomOut.k / cameraBeforePan.k).toBeCloseTo(0.8, 6);
      const zoomedOutPanOffset = {
        x: cameraAfterZoomOut.x - rasterContext.cssWidth / 2,
        y: cameraAfterZoomOut.y - rasterContext.cssHeight / 2,
      };
      expect(zoomedOutPanOffset.x).toBeCloseTo(zoomedPanOffset.x * (0.8 / 1.25), 6);
      expect(zoomedOutPanOffset.y).toBeCloseTo(zoomedPanOffset.y * (0.8 / 1.25), 6);

      const zoomedOutScreenshot = await canvas.screenshot({ scale: "device" });
      const zoomedOutRasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: zoomedOutScreenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        zoomFactor: 0.8,
        panCssPixels: zoomedOutPanOffset,
      });
      expect(zoomedOutRasterError.imageWidth).toBe(rasterContext.cssWidth * 2);
      expect(zoomedOutRasterError.imageHeight).toBe(rasterContext.cssHeight * 2);
      expect(zoomedOutRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(zoomedOutRasterError.maximumRenderedToSourceDistanceCssPixels,
        "80% panned DPR2 ELLIPSE pixels exceeded the independent parametric source envelope: " + JSON.stringify(zoomedOutRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(zoomedOutRasterError.maximumSourceToRenderedDistanceCssPixels,
        "80% panned DPR2 ELLIPSE source samples had a raster coverage gap: " + JSON.stringify(zoomedOutRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 80% panned DPR2 runtime-refined ELLIPSE pixel envelope PASS: " + JSON.stringify({
        zoomedOutPanOffset, cameraAfterZoomOut, zoomOutQuietSnapshot, zoomedOutRasterError,
      }));

      const zoomInBaseline = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number } }).__cadV2F07Ellipse!;
        return { targetCount: state.targetErrors.length, refinedReplies: state.refinedReplies };
      });
      const zoomInButton = ellipsePage.getByRole("button", { name: "Yakınlaştır (+)" });
      const frameBeforeZoomIn = await readDeviceFrame();
      for (const expectedZoom of ["100%", "125%", "156%"] as const) {
        const zoomStepBaseline = await ellipsePage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[] } }).__cadV2F07Ellipse!;
          return { targetCount: state.targetErrors.length };
        });
        await zoomInButton.click();
        await expect(ellipsePage.getByText(expectedZoom)).toBeVisible();
        const expectedZoomScale = expectedZoom === "156%" ? 1.5625 : Number.parseFloat(expectedZoom) / 100;
        try {
          await expect.poll(() => ellipsePage.evaluate(({ baselineTargetCount, expectedScale, fitScale }) => {
            const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
              '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
            );
            const state = (window as Window & {
              __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number };
            }).__cadV2F07Ellipse;
            return Boolean(input?.__zoom && state &&
              Math.abs(input.__zoom.k / fitScale - expectedScale) < 1e-6 &&
              state.targetErrors.length > baselineTargetCount &&
              state.targetErrors.at(-1) === 0.25 &&
              state.refinedReplies >= state.targetErrors.length);
          }, {
            baselineTargetCount: zoomStepBaseline.targetCount,
            expectedScale: expectedZoomScale,
            fitScale: cameraBeforePan.k,
          }), { timeout: 20_000, intervals: [100, 250, 500, 1000] }).toBe(true);
        } catch (error) {
          const diagnostic = await ellipsePage.evaluate(() => {
            const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
              '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
            );
            const state = (window as Window & {
              __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number };
            }).__cadV2F07Ellipse;
            return {
              camera: input?.__zoom,
              targetErrors: state?.targetErrors,
              refinedReplies: state?.refinedReplies,
            };
          });
          throw new Error(`ELLIPSE zoom step ${expectedZoom} did not settle; expected scale=${expectedZoomScale}, fit k=${cameraBeforePan.k}, target baseline=${zoomStepBaseline.targetCount}, observed=${JSON.stringify(diagnostic)}; ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      await expect.poll(() => ellipsePage.evaluate((baseline) => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number } }).__cadV2F07Ellipse!;
        return state.targetErrors.length > baseline.targetCount && state.targetErrors.at(-1) === 0.25 &&
          state.refinedReplies >= state.targetErrors.length;
      }, zoomInBaseline), { timeout: 20_000, intervals: [100, 250, 500, 1000] }).toBe(true);
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeZoomIn);

      let zoomInQuiet = false;
      let zoomInQuietSnapshot = zoomOutQuietSnapshot;
      for (let attempt = 0; attempt < 5 && !zoomInQuiet; attempt++) {
        await ellipsePage.waitForTimeout(350);
        const snapshot = await ellipsePage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
          return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
        });
        if (snapshot.refinedReplies >= snapshot.targetErrors.length && snapshot.targetErrors.at(-1) === 0.25) {
          await ellipsePage.waitForTimeout(350);
          const quiet = await ellipsePage.evaluate(() => {
            const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
            return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
          });
          if (JSON.stringify(quiet) === JSON.stringify(snapshot)) {
            zoomInQuiet = true;
            zoomInQuietSnapshot = quiet;
          }
        }
      }
      expect(zoomInQuiet, "156% DPR2 ELLIPSE refinement should settle with no pending replies").toBe(true);
      expect(zoomInQuietSnapshot.maxLineVertexCount).toBeGreaterThan(2);

      const cameraAfterZoomIn156 = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ELLIPSE D3 camera transform is missing at 156%");
        return { ...input.__zoom };
      });
      expect(cameraAfterZoomIn156.k / cameraBeforePan.k).toBeCloseTo(1.5625, 6);
      const zoomedIn156PanOffset = {
        x: cameraAfterZoomIn156.x - rasterContext.cssWidth / 2,
        y: cameraAfterZoomIn156.y - rasterContext.cssHeight / 2,
      };
      expect(zoomedIn156PanOffset.x).toBeCloseTo(zoomedOutPanOffset.x * (1.5625 / 0.8), 6);
      expect(zoomedIn156PanOffset.y).toBeCloseTo(zoomedOutPanOffset.y * (1.5625 / 0.8), 6);

      const zoomedIn156Screenshot = await canvas.screenshot({ scale: "device" });
      const zoomedIn156RasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: zoomedIn156Screenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        zoomFactor: 1.5625,
        panCssPixels: zoomedIn156PanOffset,
      });
      expect(zoomedIn156RasterError.imageWidth).toBe(rasterContext.cssWidth * 2);
      expect(zoomedIn156RasterError.imageHeight).toBe(rasterContext.cssHeight * 2);
      expect(zoomedIn156RasterError.bluePixelCount).toBeGreaterThan(100);
      expect(zoomedIn156RasterError.maximumRenderedToSourceDistanceCssPixels,
        "156% panned DPR2 ELLIPSE pixels exceeded the independent parametric source envelope: " + JSON.stringify(zoomedIn156RasterError))
        .toBeLessThanOrEqual(1.25);
      expect(zoomedIn156RasterError.maximumSourceToRenderedDistanceCssPixels,
        "156% panned DPR2 ELLIPSE source samples had a raster coverage gap: " + JSON.stringify(zoomedIn156RasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 156% panned DPR2 runtime-refined ELLIPSE pixel envelope PASS: " + JSON.stringify({
        zoomedIn156PanOffset, cameraAfterZoomIn156, zoomInQuietSnapshot, zoomedIn156RasterError,
      }));

      const highZoomPanInput = ellipsePage.getByLabel("CAD V2 Çizim Etkileşim Alanı");
      const highZoomPanBounds = await highZoomPanInput.boundingBox();
      expect(highZoomPanBounds).not.toBeNull();
      const highZoomPanStart = {
        x: highZoomPanBounds!.x + highZoomPanBounds!.width / 2,
        y: highZoomPanBounds!.y + highZoomPanBounds!.height / 2,
      };
      const cameraBeforeHighZoomPan = cameraAfterZoomIn156;
      const frameBeforeHighZoomPan = await readDeviceFrame();
      await ellipsePage.mouse.move(highZoomPanStart.x, highZoomPanStart.y);
      await ellipsePage.mouse.down();
      await ellipsePage.mouse.move(highZoomPanStart.x - 10, highZoomPanStart.y - 5, { steps: 4 });
      await ellipsePage.mouse.up();
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeHighZoomPan);
      const cameraAfterHighZoomPan = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ELLIPSE camera is missing after the 195% preparation pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterHighZoomPan.x - cameraBeforeHighZoomPan.x).toBeCloseTo(-10, 6);
      expect(cameraAfterHighZoomPan.y - cameraBeforeHighZoomPan.y).toBeCloseTo(-5, 6);
      expect(cameraAfterHighZoomPan.k).toBeCloseTo(cameraBeforeHighZoomPan.k, 12);

      const ultraZoomBaseline = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number } }).__cadV2F07Ellipse!;
        return { targetCount: state.targetErrors.length, refinedReplies: state.refinedReplies };
      });
      const frameBefore195Zoom = await readDeviceFrame();
      await ellipsePage.getByRole("button", { name: "Yakınlaştır (+)" }).click();
      await expect(ellipsePage.getByText("195%")).toBeVisible();
      await expect.poll(() => ellipsePage.evaluate(({ baselineTargetCount, baselineReplies, fitScale }) => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        const state = (window as Window & {
          __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number };
        }).__cadV2F07Ellipse;
        return Boolean(input?.__zoom && state &&
          Math.abs(input.__zoom.k / fitScale - 1.953125) < 1e-6 &&
          state.targetErrors.length > baselineTargetCount &&
          state.refinedReplies > baselineReplies &&
          state.targetErrors.at(-1) === 0.25 &&
          state.refinedReplies >= state.targetErrors.length);
      }, {
        baselineTargetCount: ultraZoomBaseline.targetCount,
        baselineReplies: ultraZoomBaseline.refinedReplies,
        fitScale: cameraBeforePan.k,
      }), { timeout: 20_000, intervals: [100, 250, 500, 1000] }).toBe(true);
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBefore195Zoom);

      let ultraZoomQuiet = false;
      let ultraZoomQuietSnapshot = zoomInQuietSnapshot;
      for (let attempt = 0; attempt < 5 && !ultraZoomQuiet; attempt++) {
        await ellipsePage.waitForTimeout(350);
        const snapshot = await ellipsePage.evaluate(() => {
          const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
          return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
        });
        if (snapshot.refinedReplies >= snapshot.targetErrors.length && snapshot.targetErrors.at(-1) === 0.25) {
          await ellipsePage.waitForTimeout(350);
          const quiet = await ellipsePage.evaluate(() => {
            const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
            return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
          });
          if (JSON.stringify(quiet) === JSON.stringify(snapshot)) {
            ultraZoomQuiet = true;
            ultraZoomQuietSnapshot = quiet;
          }
        }
      }
      expect(ultraZoomQuiet, "195% DPR2 ELLIPSE refinement should settle with no pending replies").toBe(true);
      expect(ultraZoomQuietSnapshot.targetErrors.at(-1)).toBe(0.25);
      expect(ultraZoomQuietSnapshot.refinedReplies).toBe(ultraZoomQuietSnapshot.targetErrors.length);
      expect(ultraZoomQuietSnapshot.maxLineVertexCount).toBeGreaterThan(2);

      const cameraAfter195Zoom = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ELLIPSE D3 camera transform is missing at 195%");
        return { ...input.__zoom };
      });
      expect(cameraAfter195Zoom.k / cameraBeforePan.k).toBeCloseTo(1.953125, 6);
      const ultraZoomPanOffset = {
        x: cameraAfter195Zoom.x - rasterContext.cssWidth / 2,
        y: cameraAfter195Zoom.y - rasterContext.cssHeight / 2,
      };
      expect(ultraZoomPanOffset.x).toBeCloseTo(
        (cameraAfterHighZoomPan.x - rasterContext.cssWidth / 2) * 1.25, 6,
      );
      expect(ultraZoomPanOffset.y).toBeCloseTo(
        (cameraAfterHighZoomPan.y - rasterContext.cssHeight / 2) * 1.25, 6,
      );
      const highZoomUnitsPerCssPixel = 0.16447368421052633 / 1.953125;
      expect(cameraAfter195Zoom.x + scene.semimajor / highZoomUnitsPerCssPixel)
        .toBeLessThan(rasterContext.cssWidth);
      expect(cameraAfter195Zoom.y - scene.semiminor / highZoomUnitsPerCssPixel).toBeGreaterThan(0);

      const ultraZoomScreenshot = await canvas.screenshot({ scale: "device" });
      const ultraZoomRasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: ultraZoomScreenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        zoomFactor: 1.953125,
        panCssPixels: ultraZoomPanOffset,
      });
      expect(ultraZoomRasterError.imageWidth).toBe(rasterContext.cssWidth * 2);
      expect(ultraZoomRasterError.imageHeight).toBe(rasterContext.cssHeight * 2);
      expect(ultraZoomRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(ultraZoomRasterError.maximumRenderedToSourceDistanceCssPixels,
        "195% DPR2 ELLIPSE pixels exceeded the independent parametric source envelope: " + JSON.stringify(ultraZoomRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(ultraZoomRasterError.maximumSourceToRenderedDistanceCssPixels,
        "195% DPR2 ELLIPSE source samples had a raster coverage gap: " + JSON.stringify(ultraZoomRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 195% panned DPR2 runtime-refined ELLIPSE pixel envelope PASS: " + JSON.stringify({
        ultraZoomPanOffset, cameraAfterHighZoomPan, cameraAfter195Zoom, ultraZoomQuietSnapshot, ultraZoomRasterError,
      }));

      const final195PanCssPixels = { x: -10, y: -5 };
      const frameBeforeFinal195Pan = await readDeviceFrame();
      await ellipsePage.mouse.move(highZoomPanStart.x, highZoomPanStart.y);
      await ellipsePage.mouse.down();
      await ellipsePage.mouse.move(
        highZoomPanStart.x + final195PanCssPixels.x,
        highZoomPanStart.y + final195PanCssPixels.y,
        { steps: 4 },
      );
      await ellipsePage.mouse.up();
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeFinal195Pan);
      const cameraAfterFinal195Pan = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR2 ELLIPSE camera is missing after its 195% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterFinal195Pan.x - cameraAfter195Zoom.x).toBeCloseTo(final195PanCssPixels.x, 6);
      expect(cameraAfterFinal195Pan.y - cameraAfter195Zoom.y).toBeCloseTo(final195PanCssPixels.y, 6);
      expect(cameraAfterFinal195Pan.k).toBeCloseTo(cameraAfter195Zoom.k, 12);
      const final195PanOffset = {
        x: cameraAfterFinal195Pan.x - rasterContext.cssWidth / 2,
        y: cameraAfterFinal195Pan.y - rasterContext.cssHeight / 2,
      };
      expect(final195PanOffset.x).toBeCloseTo(ultraZoomPanOffset.x + final195PanCssPixels.x, 6);
      expect(final195PanOffset.y).toBeCloseTo(ultraZoomPanOffset.y + final195PanCssPixels.y, 6);
      expect(cameraAfterFinal195Pan.x).toBeGreaterThan(0);
      expect(cameraAfterFinal195Pan.x + scene.semimajor / highZoomUnitsPerCssPixel)
        .toBeLessThan(rasterContext.cssWidth);
      expect(cameraAfterFinal195Pan.y - scene.semiminor / highZoomUnitsPerCssPixel).toBeGreaterThan(0);
      expect(cameraAfterFinal195Pan.y).toBeLessThan(rasterContext.cssHeight);

      const refinementAfterFinal195Pan = await ellipsePage.evaluate(() => {
        const state = (window as Window & {
          __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number };
        }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      await ellipsePage.waitForTimeout(350);
      const final195PanQuietSnapshot = await ellipsePage.evaluate(() => {
        const state = (window as Window & {
          __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number };
        }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      await ellipsePage.waitForTimeout(350);
      const final195PanQuietConfirmation = await ellipsePage.evaluate(() => {
        const state = (window as Window & {
          __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number };
        }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      expect(final195PanQuietSnapshot).toEqual(ultraZoomQuietSnapshot);
      expect(final195PanQuietConfirmation).toEqual(final195PanQuietSnapshot);
      expect(refinementAfterFinal195Pan).toEqual(ultraZoomQuietSnapshot);
      expect(final195PanQuietSnapshot.refinedReplies).toBe(final195PanQuietSnapshot.targetErrors.length);
      expect(final195PanQuietSnapshot.targetErrors.at(-1)).toBe(0.25);

      const final195PanScreenshot = await canvas.screenshot({ scale: "device" });
      const final195PanRasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: final195PanScreenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        zoomFactor: 1.953125,
        panCssPixels: final195PanOffset,
      });
      expect(final195PanRasterError.imageWidth).toBe(rasterContext.drawingBufferWidth);
      expect(final195PanRasterError.imageHeight).toBe(rasterContext.drawingBufferHeight);
      expect(final195PanRasterError.analyticSampleCount).toBe(4097);
      expect(final195PanRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(final195PanRasterError.maximumRenderedToSourceDistanceCssPixels,
        "195% DPR2 ELLIPSE pixels after final real pan exceeded the independent parametric source envelope: " + JSON.stringify(final195PanRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(final195PanRasterError.maximumSourceToRenderedDistanceCssPixels,
        "195% DPR2 ELLIPSE source samples after final real pan had a raster coverage gap: " + JSON.stringify(final195PanRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 195% DPR2 ELLIPSE raster after an additional real pan PASS: " + JSON.stringify({
        final195PanCssPixels, cameraAfterFinal195Pan, final195PanOffset, final195PanQuietSnapshot,
        final195PanQuietConfirmation, final195PanRasterError,
      }));
    } finally {
      await context.close();
    }
  });

  test("compiler-produced DASHED WebGL output is invariant to chunk partition", async ({ page }) => {
    await signInAdmin(page);
    const { fileId: singleChunkFileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const { fileId: splitChunkFileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    // The fixture is compiled in a bounded child process to keep compiler ESM loading
    // separate from Playwright's test discovery. PATH_DISTANCE is sent to LineDashedMaterial.
    const scenes = makeBrowserVisibleDashScenes();
    expect(scenes).toHaveLength(12);
    const [singleChunkScene, splitChunkScene, centerSingleScene, centerSplitScene,
      curvedSingleScene, curvedSplitScene, wideSingleScene, wideSplitScene,
      mirrorSingleScene, mirrorSplitScene, viewportSingleScene, viewportSplitScene] = scenes;
    if (!singleChunkScene || !splitChunkScene || !centerSingleScene || !centerSplitScene ||
        !curvedSingleScene || !curvedSplitScene || !wideSingleScene || !wideSplitScene ||
        !mirrorSingleScene || !mirrorSplitScene || !viewportSingleScene || !viewportSplitScene)
      throw new Error("Expected compiled DASHED, CENTER, curved, wide, mirror and viewport scene variants");
    const expectedPathDistance = [0, 31, 31, 62, 62, 93, 93, 124, 124, 155, 155, 184];
    expect(singleChunkScene.manifest.chunks.filter((chunk: { layoutId: string }) => chunk.layoutId === "Model")).toHaveLength(1);
    expect(splitChunkScene.manifest.chunks.filter((chunk: { layoutId: string }) => chunk.layoutId === "Model")).toHaveLength(6);
    expect(singleChunkScene.pathDistanceValues).toEqual(expectedPathDistance);
    expect(splitChunkScene.pathDistanceValues).toEqual(expectedPathDistance);
    expect(singleChunkScene.dashDrawCommands).toHaveLength(1);
    expect(singleChunkScene.dashDrawCommands[0]).toMatchObject({ vertexCount: 12, dashStyle: { dashSize: 24, gapSize: 16 } });
    expect(splitChunkScene.dashDrawCommands).toHaveLength(6);
    expect(splitChunkScene.dashDrawCommands.every((command: { vertexCount: number; dashStyle?: { dashSize: number; gapSize: number } }) =>
      command.vertexCount === 2 && command.dashStyle?.dashSize === 24 && command.dashStyle.gapSize === 16)).toBe(true);
    expect(centerSingleScene.pathDistanceValues).toEqual(expectedPathDistance);
    expect(centerSplitScene.pathDistanceValues).toEqual(expectedPathDistance);
    expect(centerSingleScene.dashDrawCommands[0]?.dashStyle?.pattern).toEqual([24, -8, 8, -8]);
    expect(centerSplitScene.dashDrawCommands.every((command: { dashStyle?: { pattern?: number[] } }) =>
      JSON.stringify(command.dashStyle?.pattern) === JSON.stringify([24, -8, 8, -8]))).toBe(true);
    const scenesById = new Map(scenes.map((scene) => [scene.sceneId, scene]));
    const scenesByFileId = new Map([
      [singleChunkFileId, singleChunkScene],
      [splitChunkFileId, splitChunkScene],
    ]);
    const { fileId: centerSingleFileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const { fileId: centerSplitFileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    scenesByFileId.set(centerSingleFileId, centerSingleScene);
    scenesByFileId.set(centerSplitFileId, centerSplitScene);
    const { fileId: curvedSingleFileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const { fileId: curvedSplitFileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    scenesByFileId.set(curvedSingleFileId, curvedSingleScene);
    scenesByFileId.set(curvedSplitFileId, curvedSplitScene);
    const { fileId: wideSingleFileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const { fileId: wideSplitFileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    scenesByFileId.set(wideSingleFileId, wideSingleScene);
    scenesByFileId.set(wideSplitFileId, wideSplitScene);
    const { fileId: mirrorSingleFileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const { fileId: mirrorSplitFileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const { fileId: viewportSingleFileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const { fileId: viewportSplitFileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    scenesByFileId.set(mirrorSingleFileId, mirrorSingleScene);
    scenesByFileId.set(mirrorSplitFileId, mirrorSplitScene);
    scenesByFileId.set(viewportSingleFileId, viewportSingleScene);
    scenesByFileId.set(viewportSplitFileId, viewportSplitScene);

    await page.route("**/api/dokumantasyon/cad-v2/prepare", async (route) => {
      const request = route.request().postDataJSON() as { fileId?: string };
      const scene = request.fileId ? scenesByFileId.get(request.fileId) : undefined;
      if (!scene) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "F07 dash fixture file not found" }) });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ready", sceneId: scene.sceneId, viewSessionId: `vs_${scene.sceneId}`, sourceVersionKey: scene.manifest.sourceVersionKey }),
      });
    });
    await page.route("**/api/dokumantasyon/cad-v2/scenes/*/manifest", async (route) => {
      const sceneId = new URL(route.request().url()).pathname.split("/").at(-2)!;
      const scene = scenesById.get(sceneId);
      if (!scene) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "F07 dash fixture scene not found" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(scene.manifest) });
    });
    await page.route("**/api/dokumantasyon/cad-v2/scenes/*/chunks/*", async (route) => {
      const pathParts = new URL(route.request().url()).pathname.split("/");
      const scene = scenesById.get(pathParts.at(-3)!);
      const chunkId = pathParts.at(-1)!;
      const chunk = scene?.chunks.get(chunkId);
      if (!chunk) {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "F07 dash fixture chunk not found" }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.from(chunk) });
    });

    const readDashPixels = async () => {
      const canvas = page.locator("canvas").first();
      const screenshot = await canvas.screenshot();
      const stats = await page.evaluate(async (pngBase64) => {
        const image = new Image();
        image.src = `data:image/png;base64,${pngBase64}`;
        await image.decode();
        const sampleCanvas = document.createElement("canvas");
        sampleCanvas.width = image.naturalWidth;
        sampleCanvas.height = image.naturalHeight;
        const context = sampleCanvas.getContext("2d");
        if (!context) throw new Error("Could not create a pixel-sampling canvas for the WebGL screenshot");
        context.drawImage(image, 0, 0);
        const { width, height } = sampleCanvas;
        const pixels = context.getImageData(0, 0, width, height).data;
        const redByColumn = new Array<boolean>(width).fill(false);
        const centerY = Math.floor(height / 2);
        for (let x = 0; x < width; x++) {
          for (let y = Math.max(0, centerY - 10); y <= Math.min(height - 1, centerY + 10); y++) {
            const offset = (y * width + x) * 4;
            const red = pixels[offset]!;
            const green = pixels[offset + 1]!;
            const blue = pixels[offset + 2]!;
            if (red > 80 && red > green * 1.6 + 20 && red > blue * 1.6 + 20) {
              redByColumn[x] = true;
              break;
            }
          }
        }
        const runs: Array<[number, number]> = [];
        let runStart = -1;
        for (let x = 0; x < width; x++) {
          if (redByColumn[x] && runStart < 0) runStart = x;
          if (!redByColumn[x] && runStart >= 0) {
            runs.push([runStart, x - 1]);
            runStart = -1;
          }
        }
        if (runStart >= 0) runs.push([runStart, width - 1]);
        const redPixelColumns = redByColumn.reduce((count, red) => count + Number(red), 0);
        const gaps = runs.slice(1).map((run, index) => run[0] - runs[index]![1] - 1);
        return { width, height, redPixelColumns, runs, gaps };
      }, screenshot.toString("base64"));
      return { ...stats, screenshotSha256: crypto.createHash("sha256").update(screenshot).digest("hex") };
    };

    const readScenePixels = async (fileId: string, expectedRuns = 5) => {
      await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
      const canvas = page.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 60_000 });
      await expect(page.getByText("Varlık:")).toBeVisible({ timeout: 60_000 });
      let pixelStats = await readDashPixels();
      await expect.poll(async () => {
        pixelStats = await readDashPixels();
        return pixelStats.runs.length;
      }, { timeout: 15_000 }).toBeGreaterThanOrEqual(expectedRuns);
      expect(pixelStats.redPixelColumns).toBeGreaterThan(100);
      expect(pixelStats.runs).toHaveLength(expectedRuns);
      expect(pixelStats.gaps).toHaveLength(expectedRuns - 1);
      expect(Math.min(...pixelStats.gaps)).toBeGreaterThan(8);
      return pixelStats;
    };

    const singleChunkPixels = await readScenePixels(singleChunkFileId);
    const splitChunkPixels = await readScenePixels(splitChunkFileId);
    expect(splitChunkPixels.screenshotSha256).toBe(singleChunkPixels.screenshotSha256);
    expect(splitChunkPixels.runs).toEqual(singleChunkPixels.runs);
    expect(splitChunkPixels.gaps).toEqual(singleChunkPixels.gaps);
    const centerSinglePixels = await readScenePixels(centerSingleFileId, 8);
    const centerSplitPixels = await readScenePixels(centerSplitFileId, 8);
    expect(centerSplitPixels.screenshotSha256).toBe(centerSinglePixels.screenshotSha256);
    expect(centerSplitPixels.runs).toEqual(centerSinglePixels.runs);
    expect(centerSplitPixels.gaps).toEqual(centerSinglePixels.gaps);
    console.log("F07 PATH_DISTANCE LineDashedMaterial WebGL phase acceptance PASS: " + JSON.stringify({
      pathDistanceValues: singleChunkScene.pathDistanceValues,
      drawCommands: singleChunkScene.dashDrawCommands,
      singleChunk: { chunks: 1, runs: singleChunkPixels.runs, gaps: singleChunkPixels.gaps, screenshotSha256: singleChunkPixels.screenshotSha256 },
      splitChunks: { chunks: 6, runs: splitChunkPixels.runs, gaps: splitChunkPixels.gaps, screenshotSha256: splitChunkPixels.screenshotSha256 },
    }));
    console.log("R07 CENTER multi-term PATH_DISTANCE shader phase PASS: " + JSON.stringify({
      pathDistanceValues: centerSingleScene.pathDistanceValues,
      singleChunk: { chunks: 1, runs: centerSinglePixels.runs, screenshotSha256: centerSinglePixels.screenshotSha256 },
      splitChunks: { chunks: 6, runs: centerSplitPixels.runs, screenshotSha256: centerSplitPixels.screenshotSha256 },
    }));
    const readCurvedPixels = async (fileId: string, navigate = true, minimumRedPixels = 100) => {
      if (navigate) await page.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);
      const canvas = page.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 60_000 });
      await expect(page.getByText("Varlık:")).toBeVisible({ timeout: 60_000 });
      let redPixels = 0;
      let redMaskChecksum = 0;
      let screenshot: Buffer = Buffer.alloc(0);
      await expect.poll(async () => {
        screenshot = await canvas.screenshot();
        const sampled = await page.evaluate(async (pngBase64) => {
          const image = new Image();
          image.src = `data:image/png;base64,${pngBase64}`;
          await image.decode();
          const sample = document.createElement("canvas");
          sample.width = image.naturalWidth;
          sample.height = image.naturalHeight;
          const context = sample.getContext("2d")!;
          context.drawImage(image, 0, 0);
          const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
          let count = 0;
          let checksum = 2166136261;
          for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i]! > 80 && pixels[i]! > pixels[i + 1]! * 1.6 + 20 &&
                pixels[i]! > pixels[i + 2]! * 1.6 + 20) {
              count++;
              checksum = Math.imul(checksum ^ (i / 4), 16777619);
            }
          }
          return { count, checksum: checksum >>> 0 };
        }, screenshot.toString("base64"));
        redPixels = sampled.count;
        redMaskChecksum = sampled.checksum;
        return redPixels;
      }, { timeout: 15_000 }).toBeGreaterThan(minimumRedPixels);
      return { redPixels, redMaskChecksum, sha256: crypto.createHash("sha256").update(screenshot).digest("hex") };
    };
    const curvedSinglePixels = await readCurvedPixels(curvedSingleFileId);
    const curvedSplitPixels = await readCurvedPixels(curvedSplitFileId);
    expect(curvedSplitPixels).toEqual(curvedSinglePixels);
    console.log("R07 analytic bulge/closed/dot WebGL chunk parity PASS: " + JSON.stringify({
      singleChunks: curvedSingleScene.manifest.chunks.length,
      splitChunks: curvedSplitScene.manifest.chunks.length,
      ...curvedSinglePixels,
    }));
    expect(wideSingleScene.dashDrawCommands.every((command: { dashStyle?: unknown; lineweightMm?: number }) =>
      command.dashStyle === undefined && command.lineweightMm === 4)).toBe(true);
    expect(wideSplitScene.pathDistanceValues).toEqual(wideSingleScene.pathDistanceValues);
    const wideSinglePixels = await readCurvedPixels(wideSingleFileId, true, 5000);
    const wideSplitPixels = await readCurvedPixels(wideSplitFileId, true, 5000);
    expect(wideSplitPixels).toEqual(wideSinglePixels);
    await page.getByRole("button", { name: "Görünüm Ayarları" }).click();
    const weightToggle = page.getByRole("button", { name: "Çizgi Kalınlıkları" });
    await expect(weightToggle).toHaveAttribute("aria-pressed", "true");
    await weightToggle.click();
    await expect(weightToggle).toHaveAttribute("aria-pressed", "false");
    let thinPixels = await readCurvedPixels(wideSplitFileId, false);
    await expect.poll(async () => {
      thinPixels = await readCurvedPixels(wideSplitFileId, false);
      return thinPixels.redPixels;
    }, { timeout: 8_000 }).toBeLessThan(wideSplitPixels.redPixels / 2);
    await weightToggle.click();
    await expect(weightToggle).toHaveAttribute("aria-pressed", "true");
    await expect.poll(async () => (await readCurvedPixels(wideSplitFileId, false, 5000)).redMaskChecksum,
      { timeout: 8_000 }).toBe(wideSplitPixels.redMaskChecksum);
    const restoredPixels = await readCurvedPixels(wideSplitFileId, false, 5000);
    expect(restoredPixels.redPixels).toBe(wideSplitPixels.redPixels);
    console.log("R07 wide DASHED WebGL chunk/lineweight toggle PASS: " + JSON.stringify({
      singleChunks: wideSingleScene.manifest.chunks.length,
      splitChunks: wideSplitScene.manifest.chunks.length,
      thickPixels: wideSplitPixels.redPixels,
      thinPixels: thinPixels.redPixels,
      redMaskChecksum: wideSplitPixels.redMaskChecksum,
      sha256: wideSplitPixels.sha256,
    }));
    expect(mirrorSingleScene.pathDistanceValues).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90]);
    expect(mirrorSplitScene.pathDistanceValues).toEqual(mirrorSingleScene.pathDistanceValues);
    expect(viewportSingleScene.pathDistanceValues).toEqual([20, 30, 40, 50, 60, 70]);
    expect(viewportSplitScene.pathDistanceValues).toEqual(viewportSingleScene.pathDistanceValues);
    const mirrorSinglePixels = await readCurvedPixels(mirrorSingleFileId);
    const mirrorSplitPixels = await readCurvedPixels(mirrorSplitFileId);
    expect(mirrorSplitPixels).toEqual(mirrorSinglePixels);
    const viewportSinglePixels = await readCurvedPixels(viewportSingleFileId);
    const viewportSplitPixels = await readCurvedPixels(viewportSplitFileId);
    expect(viewportSplitPixels).toEqual(viewportSinglePixels);
    console.log("R07 mirrored INSERT and 2x paper viewport WebGL chunk parity PASS: " + JSON.stringify({
      mirror: { chunks: [mirrorSingleScene.manifest.chunks.length, mirrorSplitScene.manifest.chunks.length],
        ...mirrorSinglePixels },
      viewport: { chunks: [viewportSingleScene.manifest.chunks.length, viewportSplitScene.manifest.chunks.length],
        ...viewportSinglePixels },
    }));
  });

  test("runtime-refined ELLIPSE raster stays bounded through 195% zoom and pan when emulated DPR3 is capped to a DPR2 drawing buffer", async ({ browser, page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserEllipseRefinementScene();
    const context = await browser.newContext({
      baseURL: new URL(page.url()).origin,
      deviceScaleFactor: 3,
      viewport: { width: 1280, height: 720 },
      storageState: await page.context().storageState(),
    });

    try {
      const ellipsePage = await context.newPage();
      await configureF07EllipseRefinementPage(ellipsePage, scene, "vs_f07_ellipse_dpr3_buffer_cap");
      await ellipsePage.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);

      const canvas = ellipsePage.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 60_000 });
      await expect(ellipsePage.getByText("Varlık:")).toBeVisible({ timeout: 60_000 });
      await expect.poll(() => ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse;
        return Boolean(state && state.targetErrors.at(-1) === 0.25 &&
          state.refinedReplies >= state.targetErrors.length && state.maxLineVertexCount > 2);
      }), { timeout: 30_000, intervals: [100, 250, 500, 1000] }).toBe(true);

      const rasterContext = await ellipsePage.evaluate(() => {
        const canvasElement = document.querySelector("canvas");
        if (!canvasElement) throw new Error("F07 DPR3 ELLIPSE canvas is missing");
        return {
          devicePixelRatio: window.devicePixelRatio,
          cssWidth: canvasElement.clientWidth,
          cssHeight: canvasElement.clientHeight,
          drawingBufferWidth: canvasElement.width,
          drawingBufferHeight: canvasElement.height,
        };
      });
      expect(rasterContext.devicePixelRatio).toBe(3);
      expect(rasterContext.drawingBufferWidth).toBe(rasterContext.cssWidth * 2);
      expect(rasterContext.drawingBufferHeight).toBe(rasterContext.cssHeight * 2);

      const panInput = ellipsePage.getByLabel("CAD V2 Çizim Etkileşim Alanı");
      const panBounds = await panInput.boundingBox();
      expect(panBounds).not.toBeNull();
      const cameraBeforePan = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 ELLIPSE camera transform is missing");
        return { ...input.__zoom };
      });
      const refinementBeforePan = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      const frameBeforePan = crypto.createHash("sha256").update(await canvas.screenshot()).digest("hex");
      const panCssPixels = { x: -10, y: -5 };
      await ellipsePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await ellipsePage.mouse.down();
      await ellipsePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + panCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + panCssPixels.y,
        { steps: 4 },
      );
      await ellipsePage.mouse.up();
      await expect.poll(async () => crypto.createHash("sha256").update(await canvas.screenshot()).digest("hex"),
        { timeout: 5_000 }).not.toBe(frameBeforePan);

      const cameraAfterPan = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 ELLIPSE camera transform is missing after pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterPan.x - cameraBeforePan.x).toBeCloseTo(panCssPixels.x, 6);
      expect(cameraAfterPan.y - cameraBeforePan.y).toBeCloseTo(panCssPixels.y, 6);
      expect(cameraAfterPan.k).toBeCloseTo(cameraBeforePan.k, 12);

      await ellipsePage.waitForTimeout(350);
      const refinementAfterPan = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      expect(refinementAfterPan).toEqual(refinementBeforePan);

      const screenshot = await canvas.screenshot({ scale: "device" });
      const rasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: screenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        zoomFactor: 1,
        panCssPixels,
      });
      expect(rasterError.imageWidth).toBe(rasterError.cameraWidth * 3);
      expect(rasterError.imageHeight).toBe(rasterError.cameraHeight * 3);
      expect(rasterError.bluePixelCount).toBeGreaterThan(50);
      expect(rasterError.maximumRenderedToSourceDistanceCssPixels,
        "DPR3 rendered ELLIPSE pixels exceeded the projected source envelope: " + JSON.stringify(rasterError))
        .toBeLessThanOrEqual(1.25);
      expect(rasterError.maximumSourceToRenderedDistanceCssPixels,
        "DPR3 projected ELLIPSE source samples had a raster coverage gap: " + JSON.stringify(rasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 DPR3 runtime-refined ELLIPSE with DPR2 drawing-buffer cap PASS: " + JSON.stringify({
        rasterContext, cameraBeforePan, cameraAfterPan, refinementAfterPan, rasterError,
      }));

      const waitForZoomRefinement = async (baselineTargetCount: number, expectedZoom: string) => {
        await expect.poll(() => ellipsePage.evaluate((baseline) => {
          const state = (window as Window & {
            __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number };
          }).__cadV2F07Ellipse;
          return Boolean(state && state.targetErrors.length > baseline && state.targetErrors.at(-1) === 0.25 &&
            state.refinedReplies >= state.targetErrors.length && state.maxLineVertexCount > 2);
        }, baselineTargetCount), { timeout: 20_000, intervals: [100, 250, 500, 1000] }).toBe(true);

        let snapshot = await ellipsePage.evaluate(() => {
          const state = (window as Window & {
            __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number };
          }).__cadV2F07Ellipse!;
          return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
        });
        let stableIntervals = 0;
        for (let attempt = 0; attempt < 8 && stableIntervals < 2; attempt++) {
          await ellipsePage.waitForTimeout(350);
          const next = await ellipsePage.evaluate(() => {
            const state = (window as Window & {
              __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number };
            }).__cadV2F07Ellipse!;
            return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
          });
          stableIntervals = JSON.stringify(next) === JSON.stringify(snapshot) ? stableIntervals + 1 : 0;
          snapshot = next;
        }
        expect(stableIntervals, expectedZoom + " DPR3 ELLIPSE refinement must settle").toBeGreaterThanOrEqual(2);
        expect(snapshot.targetErrors.at(-1)).toBe(0.25);
        expect(snapshot.refinedReplies).toBe(snapshot.targetErrors.length);
        return snapshot;
      };

      let lastZoomState = refinementAfterPan;
      const zoomButton = ellipsePage.getByRole("button", { name: "Yakınlaştır (+)" });
      const baselineTargetCount125 = await ellipsePage.evaluate(() =>
        (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[] } }).__cadV2F07Ellipse!.targetErrors.length);
      await zoomButton.click();
      await expect(ellipsePage.getByText("125%")).toBeVisible();
      lastZoomState = await waitForZoomRefinement(baselineTargetCount125, "125% DPR3 ELLIPSE");
      const cameraAfter125Zoom = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 ELLIPSE camera transform is missing at 125%");
        return { ...input.__zoom };
      });
      expect(cameraAfter125Zoom.k / cameraBeforePan.k).toBeCloseTo(1.25, 6);
      expect(cameraAfter125Zoom.x - rasterContext.cssWidth / 2).toBeCloseTo(panCssPixels.x * 1.25, 6);
      expect(cameraAfter125Zoom.y - rasterContext.cssHeight / 2).toBeCloseTo(panCssPixels.y * 1.25, 6);

      const pan125CssPixels = { x: 24, y: 12 };
      const frameBefore125Pan = crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await ellipsePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await ellipsePage.mouse.down();
      await ellipsePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + pan125CssPixels.x,
        panBounds!.y + panBounds!.height / 2 + pan125CssPixels.y,
        { steps: 4 },
      );
      await ellipsePage.mouse.up();
      await expect.poll(async () => crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex"), { timeout: 5_000 })
        .not.toBe(frameBefore125Pan);
      const cameraAfter125Pan = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 ELLIPSE camera transform is missing after 125% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfter125Pan.x - cameraAfter125Zoom.x).toBeCloseTo(pan125CssPixels.x, 6);
      expect(cameraAfter125Pan.y - cameraAfter125Zoom.y).toBeCloseTo(pan125CssPixels.y, 6);
      expect(cameraAfter125Pan.k).toBeCloseTo(cameraAfter125Zoom.k, 12);
      const panOffsetAt125 = {
        x: cameraAfter125Pan.x - rasterContext.cssWidth / 2,
        y: cameraAfter125Pan.y - rasterContext.cssHeight / 2,
      };
      expect(panOffsetAt125.x).toBeCloseTo(panCssPixels.x * 1.25 + pan125CssPixels.x, 6);
      expect(panOffsetAt125.y).toBeCloseTo(panCssPixels.y * 1.25 + pan125CssPixels.y, 6);
      await ellipsePage.waitForTimeout(350);
      const refinementAfter125Pan = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      expect(refinementAfter125Pan).toEqual(lastZoomState);

      const zoom125Screenshot = await canvas.screenshot({ scale: "device" });
      const zoom125RasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: zoom125Screenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        zoomFactor: 1.25,
        panCssPixels: panOffsetAt125,
      });
      expect(zoom125RasterError.imageWidth).toBe(rasterContext.cssWidth * 3);
      expect(zoom125RasterError.imageHeight).toBe(rasterContext.cssHeight * 3);
      expect(zoom125RasterError.bluePixelCount).toBeGreaterThan(50);
      expect(zoom125RasterError.analyticSampleCount).toBe(4097);
      expect(zoom125RasterError.visibleSourceAngles).toEqual([0, Math.PI / 2]);
      const ellipseCenterAt125 = {
        x: rasterContext.cssWidth / 2 + panOffsetAt125.x,
        y: rasterContext.cssHeight / 2 + panOffsetAt125.y,
      };
      expect(ellipseCenterAt125.x + scene.semimajor / zoom125RasterError.unitsPerCssPixel)
        .toBeLessThan(rasterContext.cssWidth);
      expect(ellipseCenterAt125.y - scene.semiminor / zoom125RasterError.unitsPerCssPixel).toBeGreaterThan(0);
      expect(zoom125RasterError.maximumRenderedToSourceDistanceCssPixels,
        "125% panned emulated-DPR3 ELLIPSE pixels exceeded the independent parametric source envelope: " + JSON.stringify(zoom125RasterError))
        .toBeLessThanOrEqual(1.25);
      expect(zoom125RasterError.maximumSourceToRenderedDistanceCssPixels,
        "125% panned emulated-DPR3 ELLIPSE source samples had a raster coverage gap: " + JSON.stringify(zoom125RasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 125% panned emulated-DPR3 runtime-refined ELLIPSE raster envelope PASS: " + JSON.stringify({
        cameraAfter125Zoom, cameraAfter125Pan, panOffsetAt125, refinementAfter125Pan, zoom125RasterError,
      }));

      const frameBefore125PanReset = crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await ellipsePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await ellipsePage.mouse.down();
      await ellipsePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 - pan125CssPixels.x,
        panBounds!.y + panBounds!.height / 2 - pan125CssPixels.y,
        { steps: 4 },
      );
      await ellipsePage.mouse.up();
      await expect.poll(async () => crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex"), { timeout: 5_000 })
        .not.toBe(frameBefore125PanReset);
      const cameraAfter125PanReset = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 ELLIPSE camera is missing after resetting 125% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfter125PanReset.x).toBeCloseTo(cameraAfter125Zoom.x, 6);
      expect(cameraAfter125PanReset.y).toBeCloseTo(cameraAfter125Zoom.y, 6);
      expect(cameraAfter125PanReset.k).toBeCloseTo(cameraAfter125Zoom.k, 12);
      await ellipsePage.waitForTimeout(350);
      const refinementAfter125PanReset = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      expect(refinementAfter125PanReset).toEqual(refinementAfter125Pan);
      lastZoomState = refinementAfter125PanReset;

      const baselineTargetCount156 = await ellipsePage.evaluate(() =>
        (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[] } }).__cadV2F07Ellipse!.targetErrors.length);
      await zoomButton.click();
      await expect(ellipsePage.getByText("156%")).toBeVisible();
      lastZoomState = await waitForZoomRefinement(baselineTargetCount156, "156% DPR3 ELLIPSE");
      const cameraAfter156Zoom = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 ELLIPSE camera transform is missing at 156%");
        return { ...input.__zoom };
      });
      expect(cameraAfter156Zoom.k / cameraBeforePan.k).toBeCloseTo(1.5625, 6);
      const panOffsetAt156 = {
        x: cameraAfter156Zoom.x - rasterContext.cssWidth / 2,
        y: cameraAfter156Zoom.y - rasterContext.cssHeight / 2,
      };
      expect(panOffsetAt156.x).toBeCloseTo(panCssPixels.x * 1.5625, 6);
      expect(panOffsetAt156.y).toBeCloseTo(panCssPixels.y * 1.5625, 6);

      const zoom156Screenshot = await canvas.screenshot({ scale: "device" });
      const zoom156RasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: zoom156Screenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        zoomFactor: 1.5625,
        panCssPixels: panOffsetAt156,
      });
      expect(zoom156RasterError.imageWidth).toBe(rasterContext.cssWidth * 3);
      expect(zoom156RasterError.imageHeight).toBe(rasterContext.cssHeight * 3);
      expect(zoom156RasterError.bluePixelCount).toBeGreaterThan(50);
      expect(zoom156RasterError.maximumRenderedToSourceDistanceCssPixels,
        "156% panned emulated-DPR3 ELLIPSE pixels exceeded the independent parametric source envelope: " + JSON.stringify(zoom156RasterError))
        .toBeLessThanOrEqual(1.25);
      expect(zoom156RasterError.maximumSourceToRenderedDistanceCssPixels,
        "156% panned emulated-DPR3 ELLIPSE source samples had a raster coverage gap: " + JSON.stringify(zoom156RasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 156% panned emulated-DPR3 runtime-refined ELLIPSE with DPR2 drawing-buffer cap PASS: " + JSON.stringify({
        cameraAfter156Zoom, panOffsetAt156, lastZoomState, zoom156RasterError,
      }));

      const baselineTargetCount = await ellipsePage.evaluate(() =>
        (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[] } }).__cadV2F07Ellipse!.targetErrors.length);
      const frameBefore195Zoom = crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await zoomButton.click();
      await expect(ellipsePage.getByText("195%")).toBeVisible();
      lastZoomState = await waitForZoomRefinement(baselineTargetCount, "195% DPR3 ELLIPSE");
      await expect.poll(async () => crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex"), { timeout: 5_000 })
        .not.toBe(frameBefore195Zoom);

      const cameraAfter195Zoom = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 ELLIPSE camera transform is missing at 195%");
        return { ...input.__zoom };
      });
      expect(cameraAfter195Zoom.k / cameraAfter156Zoom.k).toBeCloseTo(1.25, 6);
      expect(cameraAfter195Zoom.x - rasterContext.cssWidth / 2).toBeCloseTo(panOffsetAt156.x * 1.25, 6);
      expect(cameraAfter195Zoom.y - rasterContext.cssHeight / 2).toBeCloseTo(panOffsetAt156.y * 1.25, 6);

      const pan195CssPixels = { x: 24, y: 12 };
      const frameBefore195Pan = crypto.createHash("sha256").update(await canvas.screenshot({ scale: "device" })).digest("hex");
      await ellipsePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await ellipsePage.mouse.down();
      await ellipsePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + pan195CssPixels.x,
        panBounds!.y + panBounds!.height / 2 + pan195CssPixels.y,
        { steps: 4 },
      );
      await ellipsePage.mouse.up();
      await expect.poll(async () => crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex"), { timeout: 5_000 })
        .not.toBe(frameBefore195Pan);

      const cameraAfter195Pan = await ellipsePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 ELLIPSE camera transform is missing after 195% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfter195Pan.x - cameraAfter195Zoom.x).toBeCloseTo(pan195CssPixels.x, 6);
      expect(cameraAfter195Pan.y - cameraAfter195Zoom.y).toBeCloseTo(pan195CssPixels.y, 6);
      expect(cameraAfter195Pan.k).toBeCloseTo(cameraAfter195Zoom.k, 12);
      await ellipsePage.waitForTimeout(350);
      const refinementAfter195Pan = await ellipsePage.evaluate(() => {
        const state = (window as Window & { __cadV2F07Ellipse?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number } }).__cadV2F07Ellipse!;
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      expect(refinementAfter195Pan).toEqual(lastZoomState);

      const panOffsetAt195 = {
        x: cameraAfter195Pan.x - rasterContext.cssWidth / 2,
        y: cameraAfter195Pan.y - rasterContext.cssHeight / 2,
      };
      const zoom195Screenshot = await canvas.screenshot({ scale: "device" });
      const zoom195RasterError = await ellipsePage.evaluate(measureF07EllipseRasterError, {
        screenshotBase64: zoom195Screenshot.toString("base64"),
        semimajor: scene.semimajor,
        semiminor: scene.semiminor,
        zoomFactor: 1.953125,
        panCssPixels: panOffsetAt195,
      });
      expect(zoom195RasterError.imageWidth).toBe(rasterContext.cssWidth * 3);
      expect(zoom195RasterError.imageHeight).toBe(rasterContext.cssHeight * 3);
      expect(zoom195RasterError.bluePixelCount).toBeGreaterThan(50);
      expect(zoom195RasterError.visibleSourceAngles).toEqual([0, Math.PI / 2]);
      expect(zoom195RasterError.maximumRenderedToSourceDistanceCssPixels,
        "195% panned emulated-DPR3 ELLIPSE pixels exceeded the independent parametric source envelope: " + JSON.stringify(zoom195RasterError))
        .toBeLessThanOrEqual(1.25);
      expect(zoom195RasterError.maximumSourceToRenderedDistanceCssPixels,
        "195% panned emulated-DPR3 ELLIPSE source samples had a raster coverage gap: " + JSON.stringify(zoom195RasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 195% panned emulated-DPR3 runtime-refined ELLIPSE raster envelope PASS: " + JSON.stringify({
        cameraAfter195Zoom, pan195CssPixels, cameraAfter195Pan, panOffsetAt195, lastZoomState,
        refinementAfter195Pan, zoom195RasterError,
      }));
    } finally {
      await context.close();
    }
  });

  test("runtime-refined ARC raster stays bounded through 195% zoom and pan under emulated DPR3", async ({ browser, page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserCurveRefinementScene();
    const context = await browser.newContext({
      baseURL: new URL(page.url()).origin,
      deviceScaleFactor: 3,
      viewport: { width: 1280, height: 720 },
      storageState: await page.context().storageState(),
    });

    try {
      const arcPage = await context.newPage();
      await configureF07ArcDpr3RefinementPage(arcPage, scene, "vs_f07_arc_dpr3_zoom_pan");
      await arcPage.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);

      const canvas = arcPage.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 60_000 });
      await expect(arcPage.getByText("Varlık:")).toBeVisible({ timeout: 60_000 });

      const readArcState = () => arcPage.evaluate(() => {
        const state = (window as Window & {
          __cadV2F07ArcDpr3?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number };
        }).__cadV2F07ArcDpr3;
        if (!state) throw new Error("F07 DPR3 ARC worker instrumentation is missing");
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      const waitForArcQuiet = async (minimumTargetCount: number, description: string) => {
        await expect.poll(async () => {
          const state = await readArcState();
          return state.targetErrors.length >= minimumTargetCount && state.targetErrors.at(-1) === 0.25 &&
            state.refinedReplies === state.targetErrors.length && state.maxLineVertexCount > 2;
        }, { timeout: 30_000, intervals: [100, 250, 500, 1000] }).toBe(true);

        let snapshot = await readArcState();
        let stableIntervals = 0;
        for (let attempt = 0; attempt < 8 && stableIntervals < 2; attempt++) {
          await arcPage.waitForTimeout(350);
          const next = await readArcState();
          stableIntervals = JSON.stringify(next) === JSON.stringify(snapshot) ? stableIntervals + 1 : 0;
          snapshot = next;
        }
        expect(stableIntervals, description + " must settle without pending refinement replies").toBeGreaterThanOrEqual(2);
        expect(snapshot.refinedReplies).toBe(snapshot.targetErrors.length);
        expect(snapshot.targetErrors.at(-1)).toBe(0.25);
        return snapshot;
      };

      const fitState = await waitForArcQuiet(1, "fit DPR3 ARC refinement");
      const rasterContext = await arcPage.evaluate(() => {
        const canvasElement = document.querySelector("canvas");
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!canvasElement || !input?.__zoom) throw new Error("F07 DPR3 ARC canvas/camera is missing");
        return {
          devicePixelRatio: window.devicePixelRatio,
          cssWidth: canvasElement.clientWidth,
          cssHeight: canvasElement.clientHeight,
          drawingBufferWidth: canvasElement.width,
          drawingBufferHeight: canvasElement.height,
          camera: { ...input.__zoom },
        };
      });
      expect(rasterContext.devicePixelRatio).toBe(3);
      expect(rasterContext.drawingBufferWidth).toBe(rasterContext.cssWidth * 2);
      expect(rasterContext.drawingBufferHeight).toBe(rasterContext.cssHeight * 2);

      const panInput = arcPage.getByLabel("CAD V2 Çizim Etkileşim Alanı");
      const panBounds = await panInput.boundingBox();
      expect(panBounds).not.toBeNull();
      const fitPanCssPixels = { x: 48, y: 24 };
      const cameraBeforePan = rasterContext.camera;
      const frameBeforeFitPan = await canvas.screenshot({ scale: "device" });
      await arcPage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await arcPage.mouse.down();
      await arcPage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + fitPanCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + fitPanCssPixels.y,
        { steps: 4 },
      );
      await arcPage.mouse.up();
      await expect.poll(async () => (await canvas.screenshot({ scale: "device" })).toString("base64"),
        { timeout: 5_000 }).not.toBe(frameBeforeFitPan.toString("base64"));
      const cameraAfterFitPan = await arcPage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 ARC camera is missing after fit pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterFitPan.x - cameraBeforePan.x).toBeCloseTo(fitPanCssPixels.x, 6);
      expect(cameraAfterFitPan.y - cameraBeforePan.y).toBeCloseTo(fitPanCssPixels.y, 6);
      expect(cameraAfterFitPan.k).toBeCloseTo(cameraBeforePan.k, 12);
      const fitPanState = await waitForArcQuiet(fitState.targetErrors.length, "fit-panned DPR3 ARC");
      expect(fitPanState).toEqual(fitState);

      const fitScreenshot = await canvas.screenshot({ scale: "device" });
      const fitRasterError = await arcPage.evaluate(measureF07ArcRasterError, {
        screenshotBase64: fitScreenshot.toString("base64"),
        zoomFactor: 1,
        panCssPixels: fitPanCssPixels,
      });
      expect(fitRasterError.imageWidth).toBe(rasterContext.cssWidth * 3);
      expect(fitRasterError.imageHeight).toBe(rasterContext.cssHeight * 3);
      expect(fitRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(fitRasterError.maximumArcDistanceCssPixels,
        "fit-panned DPR3 ARC pixels exceeded the projected source envelope: " + JSON.stringify(fitRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(fitRasterError.maximumSourceArcToPixelDistanceCssPixels,
        "fit-panned DPR3 ARC source samples had a raster coverage gap: " + JSON.stringify(fitRasterError))
        .toBeLessThanOrEqual(1.25);

      const zoomButton = arcPage.getByRole("button", { name: "Yakınlaştır (+)" });
      let lastZoomState = fitPanState;
      const zoomBaseline125 = await readArcState();
      await zoomButton.click();
      await expect(arcPage.getByText("125%")).toBeVisible();
      lastZoomState = await waitForArcQuiet(
        zoomBaseline125.targetErrors.length + 1,
        "125% DPR3 ARC zoom refinement",
      );
      const cameraAfter125Zoom = await arcPage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 ARC camera is missing at 125% zoom");
        return { ...input.__zoom };
      });
      expect(cameraAfter125Zoom.k / cameraBeforePan.k).toBeCloseTo(1.25, 6);
      expect(cameraAfter125Zoom.x).toBeCloseTo(
        rasterContext.cssWidth / 2 + fitPanCssPixels.x * 1.25, 6,
      );
      expect(cameraAfter125Zoom.y).toBeCloseTo(
        rasterContext.cssHeight / 2 + fitPanCssPixels.y * 1.25, 6,
      );

      const panAt125CssPixels = { x: 24, y: 12 };
      const frameBefore125Pan = await canvas.screenshot({ scale: "device" });
      await arcPage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await arcPage.mouse.down();
      await arcPage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + panAt125CssPixels.x,
        panBounds!.y + panBounds!.height / 2 + panAt125CssPixels.y,
        { steps: 4 },
      );
      await arcPage.mouse.up();
      await expect.poll(async () => (await canvas.screenshot({ scale: "device" })).toString("base64"),
        { timeout: 5_000 }).not.toBe(frameBefore125Pan.toString("base64"));
      const cameraAfter125Pan = await arcPage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 ARC camera is missing after 125% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfter125Pan.x - cameraAfter125Zoom.x).toBeCloseTo(panAt125CssPixels.x, 6);
      expect(cameraAfter125Pan.y - cameraAfter125Zoom.y).toBeCloseTo(panAt125CssPixels.y, 6);
      expect(cameraAfter125Pan.k).toBeCloseTo(cameraAfter125Zoom.k, 12);
      const totalPanAt125 = {
        x: cameraAfter125Pan.x - rasterContext.cssWidth / 2,
        y: cameraAfter125Pan.y - rasterContext.cssHeight / 2,
      };
      expect(totalPanAt125.x).toBeCloseTo(fitPanCssPixels.x * 1.25 + panAt125CssPixels.x, 6);
      expect(totalPanAt125.y).toBeCloseTo(fitPanCssPixels.y * 1.25 + panAt125CssPixels.y, 6);
      const pan125State = await waitForArcQuiet(lastZoomState.targetErrors.length, "panned 125% DPR3 ARC");
      expect(pan125State).toEqual(lastZoomState);

      const screenshot125 = await canvas.screenshot({ scale: "device" });
      const rasterError125 = await arcPage.evaluate(measureF07ArcRasterError, {
        screenshotBase64: screenshot125.toString("base64"),
        zoomFactor: 1.25,
        panCssPixels: totalPanAt125,
      });
      expect(rasterError125.imageWidth).toBe(rasterContext.cssWidth * 3);
      expect(rasterError125.imageHeight).toBe(rasterContext.cssHeight * 3);
      expect(rasterError125.bluePixelCount).toBeGreaterThan(100);
      expect(rasterError125.visibleArcAngles).toEqual([0, Math.PI / 2]);
      const arcCenterAt125 = {
        x: rasterContext.cssWidth / 2 + totalPanAt125.x,
        y: rasterContext.cssHeight / 2 + totalPanAt125.y,
      };
      const arcRadiusAt125 = 40 / rasterError125.unitsPerCssPixel;
      expect(arcCenterAt125.x + arcRadiusAt125).toBeLessThan(rasterContext.cssWidth);
      expect(arcCenterAt125.y - arcRadiusAt125).toBeGreaterThan(0);
      expect(rasterError125.maximumArcDistanceCssPixels,
        "125% panned emulated-DPR3 ARC pixels exceeded the source envelope: " + JSON.stringify(rasterError125))
        .toBeLessThanOrEqual(1.25);
      expect(rasterError125.maximumSourceArcToPixelDistanceCssPixels,
        "125% panned emulated-DPR3 ARC source samples had a raster coverage gap: " + JSON.stringify(rasterError125))
        .toBeLessThanOrEqual(1.25);

      const frameBefore125PanReset = await canvas.screenshot({ scale: "device" });
      await arcPage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await arcPage.mouse.down();
      await arcPage.mouse.move(
        panBounds!.x + panBounds!.width / 2 - panAt125CssPixels.x,
        panBounds!.y + panBounds!.height / 2 - panAt125CssPixels.y,
        { steps: 4 },
      );
      await arcPage.mouse.up();
      await expect.poll(async () => (await canvas.screenshot({ scale: "device" })).toString("base64"),
        { timeout: 5_000 }).not.toBe(frameBefore125PanReset.toString("base64"));
      const cameraAfter125PanReset = await arcPage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 ARC camera is missing after resetting 125% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfter125PanReset.x).toBeCloseTo(cameraAfter125Zoom.x, 6);
      expect(cameraAfter125PanReset.y).toBeCloseTo(cameraAfter125Zoom.y, 6);
      expect(cameraAfter125PanReset.k).toBeCloseTo(cameraAfter125Zoom.k, 12);
      lastZoomState = await waitForArcQuiet(pan125State.targetErrors.length, "reset 125% DPR3 ARC pan");
      expect(lastZoomState).toEqual(pan125State);

      for (const expectedZoom of ["156%", "195%"] as const) {
        const zoomBaseline = await readArcState();
        await zoomButton.click();
        await expect(arcPage.getByText(expectedZoom)).toBeVisible();
        lastZoomState = await waitForArcQuiet(
          zoomBaseline.targetErrors.length + 1,
          expectedZoom + " DPR3 ARC zoom refinement",
        );
      }

      const cameraAfter195Zoom = await arcPage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 ARC camera is missing at 195% zoom");
        return { ...input.__zoom };
      });
      expect(cameraAfter195Zoom.k / cameraBeforePan.k).toBeCloseTo(1.953125, 6);
      expect(cameraAfter195Zoom.x).toBeCloseTo(
        rasterContext.cssWidth / 2 + fitPanCssPixels.x * 1.953125, 6,
      );
      expect(cameraAfter195Zoom.y).toBeCloseTo(
        rasterContext.cssHeight / 2 + fitPanCssPixels.y * 1.953125, 6,
      );

      const highZoomPanCssPixels = { x: 48, y: 24 };
      const frameBeforeHighZoomPan = await canvas.screenshot({ scale: "device" });
      await arcPage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await arcPage.mouse.down();
      await arcPage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + highZoomPanCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + highZoomPanCssPixels.y,
        { steps: 4 },
      );
      await arcPage.mouse.up();
      await expect.poll(async () => (await canvas.screenshot({ scale: "device" })).toString("base64"),
        { timeout: 5_000 }).not.toBe(frameBeforeHighZoomPan.toString("base64"));
      const cameraAfter195Pan = await arcPage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 ARC camera is missing after 195% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfter195Pan.x - cameraAfter195Zoom.x).toBeCloseTo(highZoomPanCssPixels.x, 6);
      expect(cameraAfter195Pan.y - cameraAfter195Zoom.y).toBeCloseTo(highZoomPanCssPixels.y, 6);
      expect(cameraAfter195Pan.k).toBeCloseTo(cameraAfter195Zoom.k, 12);
      const highZoomPanState = await waitForArcQuiet(lastZoomState.targetErrors.length, "panned 195% DPR3 ARC");
      expect(highZoomPanState).toEqual(lastZoomState);
      const totalPanAt195 = {
        x: cameraAfter195Pan.x - rasterContext.cssWidth / 2,
        y: cameraAfter195Pan.y - rasterContext.cssHeight / 2,
      };
      expect(totalPanAt195.x).toBeCloseTo(fitPanCssPixels.x * 1.953125 + highZoomPanCssPixels.x, 6);
      expect(totalPanAt195.y).toBeCloseTo(fitPanCssPixels.y * 1.953125 + highZoomPanCssPixels.y, 6);

      const highZoomScreenshot = await canvas.screenshot({ scale: "device" });
      const highZoomRasterError = await arcPage.evaluate(measureF07ArcRasterError, {
        screenshotBase64: highZoomScreenshot.toString("base64"),
        zoomFactor: 1.953125,
        panCssPixels: totalPanAt195,
        clipArcToViewport: true,
      });
      expect(highZoomRasterError.imageWidth).toBe(rasterContext.cssWidth * 3);
      expect(highZoomRasterError.imageHeight).toBe(rasterContext.cssHeight * 3);
      expect(highZoomRasterError.bluePixelCount,
        "195% panned emulated-DPR3 ARC raster had too few classified pixels: " + JSON.stringify({
          rasterContext, cameraAfter195Zoom, cameraAfter195Pan, totalPanAt195, highZoomRasterError,
        }))
        .toBeGreaterThan(100);
      expect(highZoomRasterError.visibleArcAngles[1]).toBeGreaterThan(highZoomRasterError.visibleArcAngles[0]);
      expect(highZoomRasterError.maximumArcDistanceCssPixels,
        "195% panned emulated-DPR3 ARC pixels exceeded the visible-source envelope: " + JSON.stringify(highZoomRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(highZoomRasterError.maximumSourceArcToPixelDistanceCssPixels,
        "195% panned emulated-DPR3 ARC source samples had a raster coverage gap: " + JSON.stringify(highZoomRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 DPR3 ARC fit/125%/195% runtime-refined raster envelopes PASS: " + JSON.stringify({
        rasterContext, cameraBeforePan, cameraAfterFitPan, fitPanState, fitRasterError,
        cameraAfter125Zoom, cameraAfter125Pan, pan125State, totalPanAt125, rasterError125, cameraAfter125PanReset,
        cameraAfter195Zoom, cameraAfter195Pan, highZoomPanState, totalPanAt195, highZoomRasterError,
      }));
    } finally {
      await context.close();
    }
  });

  test("runtime-refined rational SPLINE stays bounded at DPR3 buffer cap after 80% and 195% zoom-pan", async ({ browser, page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    const scene = makeBrowserSplineRefinementScene();
    const context = await browser.newContext({
      baseURL: new URL(page.url()).origin,
      deviceScaleFactor: 3,
      viewport: { width: 1280, height: 720 },
      storageState: await page.context().storageState(),
    });

    try {
      const splinePage = await context.newPage();
      await configureF07SplineRefinementPage(splinePage, scene, "vs_f07_spline_dpr3_80_pan");
      await splinePage.goto(`/dokumantasyon/dosya/${fileId}?cadEngine=v2`);

      const canvas = splinePage.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 60_000 });
      await expect(splinePage.getByText("Varlık:")).toBeVisible({ timeout: 60_000 });

      const readSplineState = () => splinePage.evaluate(() => {
        const state = (window as Window & {
          __cadV2F07Spline?: { targetErrors: number[]; refinedReplies: number; maxLineVertexCount: number };
        }).__cadV2F07Spline;
        if (!state) throw new Error("F07 DPR3 SPLINE worker instrumentation is missing");
        return { targetErrors: [...state.targetErrors], refinedReplies: state.refinedReplies, maxLineVertexCount: state.maxLineVertexCount };
      });
      const waitForSplineQuiet = async (minimumTargetCount: number, description: string) => {
        await expect.poll(async () => {
          const state = await readSplineState();
          return state.targetErrors.length >= minimumTargetCount && state.targetErrors.at(-1) === 0.25 &&
            state.refinedReplies === state.targetErrors.length && state.maxLineVertexCount > 2;
        }, { timeout: 30_000, intervals: [100, 250, 500, 1000] }).toBe(true);

        let snapshot = await readSplineState();
        let stableIntervals = 0;
        for (let attempt = 0; attempt < 8 && stableIntervals < 2; attempt++) {
          await splinePage.waitForTimeout(350);
          const next = await readSplineState();
          stableIntervals = JSON.stringify(next) === JSON.stringify(snapshot) ? stableIntervals + 1 : 0;
          snapshot = next;
        }
        expect(stableIntervals, description + " must settle without pending refinement replies").toBeGreaterThanOrEqual(2);
        expect(snapshot.refinedReplies).toBe(snapshot.targetErrors.length);
        expect(snapshot.targetErrors.at(-1)).toBe(0.25);
        return snapshot;
      };

      const initialState = await waitForSplineQuiet(1, "initial DPR3 SPLINE refinement");
      const rasterContext = await splinePage.evaluate(() => {
        const canvasElement = document.querySelector("canvas");
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!canvasElement || !input?.__zoom) throw new Error("F07 DPR3 SPLINE canvas/camera is missing");
        return {
          devicePixelRatio: window.devicePixelRatio,
          cssWidth: canvasElement.clientWidth,
          cssHeight: canvasElement.clientHeight,
          drawingBufferWidth: canvasElement.width,
          drawingBufferHeight: canvasElement.height,
          camera: { ...input.__zoom },
        };
      });
      expect(rasterContext.devicePixelRatio).toBe(3);
      expect(rasterContext.drawingBufferWidth).toBe(rasterContext.cssWidth * 2);
      expect(rasterContext.drawingBufferHeight).toBe(rasterContext.cssHeight * 2);

      const readDeviceFrame = async () => crypto.createHash("sha256")
        .update(await canvas.screenshot({ scale: "device" })).digest("hex");
      const frameBeforeZoomOut = await readDeviceFrame();
      const zoomBaseline = await readSplineState();
      await splinePage.getByRole("button", { name: "Uzaklaştır (-)" }).click();
      await expect(splinePage.getByText("80%")).toBeVisible();
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeZoomOut);

      const cameraAfterZoomOut = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 SPLINE camera is missing after 80% zoom-out");
        return { ...input.__zoom };
      });
      expect(cameraAfterZoomOut.k / rasterContext.camera.k).toBeCloseTo(0.8, 6);
      const zoomOutState = await waitForSplineQuiet(zoomBaseline.targetErrors.length + 1, "80% DPR3 SPLINE zoom-out refinement");

      const panCssPixels = { x: -10, y: -5 };
      const panInput = splinePage.getByLabel("CAD V2 Çizim Etkileşim Alanı");
      const panBounds = await panInput.boundingBox();
      expect(panBounds).not.toBeNull();
      const frameBeforePan = await readDeviceFrame();
      await splinePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await splinePage.mouse.down();
      await splinePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + panCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + panCssPixels.y,
        { steps: 4 },
      );
      await splinePage.mouse.up();
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforePan);

      const cameraAfterPan = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 SPLINE camera is missing after pan");
        return { ...input.__zoom };
      });
      expect(cameraAfterPan.x - cameraAfterZoomOut.x).toBeCloseTo(panCssPixels.x, 6);
      expect(cameraAfterPan.y - cameraAfterZoomOut.y).toBeCloseTo(panCssPixels.y, 6);
      expect(cameraAfterPan.k).toBeCloseTo(cameraAfterZoomOut.k, 12);
      await splinePage.waitForTimeout(350);
      const stateAfterPan = await readSplineState();
      expect(stateAfterPan).toEqual(zoomOutState);

      const screenshot = await canvas.screenshot({ scale: "device" });
      const rasterError = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: screenshot.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: cameraAfterPan,
      });
      expect(rasterError.imageWidth).toBe(rasterContext.cssWidth * 3);
      expect(rasterError.imageHeight).toBe(rasterContext.cssHeight * 3);
      expect(rasterError.bluePixelCount).toBeGreaterThan(100);
      expect(rasterError.independentSourceSampleCount).toBe(4097);
      expect(rasterError.sourceBounds.minX).toBeGreaterThanOrEqual(0);
      expect(rasterError.sourceBounds.minY).toBeGreaterThanOrEqual(0);
      expect(rasterError.sourceBounds.maxX).toBeLessThan(rasterContext.cssWidth);
      expect(rasterError.sourceBounds.maxY).toBeLessThan(rasterContext.cssHeight);
      expect(rasterError.maximumRenderedToSourceDistanceCssPixels,
        "80% panned DPR3 SPLINE pixels exceeded the independent rational Bernstein envelope: " + JSON.stringify(rasterError))
        .toBeLessThanOrEqual(1.25);
      expect(rasterError.maximumSourceToRenderedDistanceCssPixels,
        "80% panned DPR3 SPLINE source samples had a raster coverage gap: " + JSON.stringify(rasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 80% panned DPR3 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        initialState, rasterContext, cameraAfterZoomOut, cameraAfterPan, zoomOutState, stateAfterPan, rasterError,
      }));

      let lastZoomState = zoomOutState;
      const zoomButton = splinePage.getByRole("button", { name: "Yakınlaştır (+)" });
      for (const expectedZoom of ["100%", "125%"] as const) {
        const zoomBaseline = await readSplineState();
        await zoomButton.click();
        await expect(splinePage.getByText(expectedZoom)).toBeVisible();
        lastZoomState = await waitForSplineQuiet(
          zoomBaseline.targetErrors.length + 1,
          expectedZoom + " DPR3 SPLINE zoom refinement",
        );
      }

      const cameraAfter125Zoom = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 SPLINE camera is missing at 125% zoom");
        return { ...input.__zoom };
      });
      expect(cameraAfter125Zoom.k / rasterContext.camera.k).toBeCloseTo(1.25, 6);
      const panOffsetAt80 = {
        x: cameraAfterPan.x - rasterContext.cssWidth / 2,
        y: cameraAfterPan.y - rasterContext.cssHeight / 2,
      };
      const panOffsetAt125Zoom = {
        x: cameraAfter125Zoom.x - rasterContext.cssWidth / 2,
        y: cameraAfter125Zoom.y - rasterContext.cssHeight / 2,
      };
      expect(panOffsetAt125Zoom.x).toBeCloseTo(panOffsetAt80.x * (1.25 / 0.8), 6);
      expect(panOffsetAt125Zoom.y).toBeCloseTo(panOffsetAt80.y * (1.25 / 0.8), 6);

      const pan125CssPixels = { x: 24, y: 12 };
      const frameBefore125Pan = await readDeviceFrame();
      await splinePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await splinePage.mouse.down();
      await splinePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + pan125CssPixels.x,
        panBounds!.y + panBounds!.height / 2 + pan125CssPixels.y,
        { steps: 4 },
      );
      await splinePage.mouse.up();
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBefore125Pan);
      const cameraAfter125Pan = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 SPLINE camera is missing after 125% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfter125Pan.x - cameraAfter125Zoom.x).toBeCloseTo(pan125CssPixels.x, 6);
      expect(cameraAfter125Pan.y - cameraAfter125Zoom.y).toBeCloseTo(pan125CssPixels.y, 6);
      expect(cameraAfter125Pan.k).toBeCloseTo(cameraAfter125Zoom.k, 12);
      const panOffsetAt125 = {
        x: cameraAfter125Pan.x - rasterContext.cssWidth / 2,
        y: cameraAfter125Pan.y - rasterContext.cssHeight / 2,
      };
      expect(panOffsetAt125.x).toBeCloseTo(panOffsetAt125Zoom.x + pan125CssPixels.x, 6);
      expect(panOffsetAt125.y).toBeCloseTo(panOffsetAt125Zoom.y + pan125CssPixels.y, 6);
      const stateAfter125Pan = await waitForSplineQuiet(lastZoomState.targetErrors.length, "panned 125% DPR3 SPLINE");
      expect(stateAfter125Pan).toEqual(lastZoomState);

      const screenshot125 = await canvas.screenshot({ scale: "device" });
      const rasterError125 = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: screenshot125.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: cameraAfter125Pan,
      });
      expect(rasterError125.imageWidth).toBe(rasterContext.cssWidth * 3);
      expect(rasterError125.imageHeight).toBe(rasterContext.cssHeight * 3);
      expect(rasterError125.bluePixelCount).toBeGreaterThan(100);
      expect(rasterError125.independentSourceSampleCount).toBe(4097);
      expect(rasterError125.sourceBounds.minX).toBeGreaterThanOrEqual(0);
      expect(rasterError125.sourceBounds.minY).toBeGreaterThanOrEqual(0);
      expect(rasterError125.sourceBounds.maxX).toBeLessThan(rasterContext.cssWidth);
      expect(rasterError125.sourceBounds.maxY).toBeLessThan(rasterContext.cssHeight);
      expect(rasterError125.maximumRenderedToSourceDistanceCssPixels,
        "125% panned DPR3 SPLINE pixels exceeded the independent rational Bernstein envelope: " + JSON.stringify(rasterError125))
        .toBeLessThanOrEqual(1.25);
      expect(rasterError125.maximumSourceToRenderedDistanceCssPixels,
        "125% panned DPR3 SPLINE source samples had a raster coverage gap: " + JSON.stringify(rasterError125))
        .toBeLessThanOrEqual(1.25);

      const frameBefore125PanReset = await readDeviceFrame();
      await splinePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await splinePage.mouse.down();
      await splinePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 - pan125CssPixels.x,
        panBounds!.y + panBounds!.height / 2 - pan125CssPixels.y,
        { steps: 4 },
      );
      await splinePage.mouse.up();
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBefore125PanReset);
      const cameraAfter125PanReset = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 SPLINE camera is missing after resetting 125% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfter125PanReset.x).toBeCloseTo(cameraAfter125Zoom.x, 6);
      expect(cameraAfter125PanReset.y).toBeCloseTo(cameraAfter125Zoom.y, 6);
      expect(cameraAfter125PanReset.k).toBeCloseTo(cameraAfter125Zoom.k, 12);
      lastZoomState = await waitForSplineQuiet(stateAfter125Pan.targetErrors.length, "reset 125% DPR3 SPLINE pan");
      expect(lastZoomState).toEqual(stateAfter125Pan);

      const zoomBaseline156 = await readSplineState();
      await zoomButton.click();
      await expect(splinePage.getByText("156%")).toBeVisible();
      lastZoomState = await waitForSplineQuiet(zoomBaseline156.targetErrors.length + 1, "156% DPR3 SPLINE zoom refinement");

      const cameraAfter156Zoom = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 SPLINE camera is missing at 156% zoom");
        return { ...input.__zoom };
      });
      expect(cameraAfter156Zoom.k / rasterContext.camera.k).toBeCloseTo(1.5625, 6);
      const panOffsetAt156 = {
        x: cameraAfter156Zoom.x - rasterContext.cssWidth / 2,
        y: cameraAfter156Zoom.y - rasterContext.cssHeight / 2,
      };
      expect(panOffsetAt156.x).toBeCloseTo(panOffsetAt80.x * (1.5625 / 0.8), 6);
      expect(panOffsetAt156.y).toBeCloseTo(panOffsetAt80.y * (1.5625 / 0.8), 6);

      const highZoomPanCssPixels = { x: 24, y: 12 };
      const frameBeforeHighZoomPan = await readDeviceFrame();
      await splinePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await splinePage.mouse.down();
      await splinePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + highZoomPanCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + highZoomPanCssPixels.y,
        { steps: 4 },
      );
      await splinePage.mouse.up();
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBeforeHighZoomPan);
      const cameraAfter156Pan = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 SPLINE camera is missing after 156% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfter156Pan.x - cameraAfter156Zoom.x).toBeCloseTo(highZoomPanCssPixels.x, 6);
      expect(cameraAfter156Pan.y - cameraAfter156Zoom.y).toBeCloseTo(highZoomPanCssPixels.y, 6);
      expect(cameraAfter156Pan.k).toBeCloseTo(cameraAfter156Zoom.k, 12);
      await splinePage.waitForTimeout(350);
      const stateAfter156Pan = await readSplineState();
      expect(stateAfter156Pan).toEqual(lastZoomState);

      const highZoomScreenshot = await canvas.screenshot({ scale: "device" });
      const highZoomRasterError = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: highZoomScreenshot.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: cameraAfter156Pan,
      });
      expect(highZoomRasterError.imageWidth).toBe(rasterContext.cssWidth * 3);
      expect(highZoomRasterError.imageHeight).toBe(rasterContext.cssHeight * 3);
      expect(highZoomRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(highZoomRasterError.independentSourceSampleCount).toBe(4097);
      expect(highZoomRasterError.sourceBounds.minX).toBeGreaterThanOrEqual(0);
      expect(highZoomRasterError.sourceBounds.minY).toBeGreaterThanOrEqual(0);
      expect(highZoomRasterError.sourceBounds.maxX).toBeLessThan(rasterContext.cssWidth);
      expect(highZoomRasterError.sourceBounds.maxY).toBeLessThan(rasterContext.cssHeight);
      expect(highZoomRasterError.maximumRenderedToSourceDistanceCssPixels,
        "156% panned DPR3 SPLINE pixels exceeded the independent rational Bernstein envelope: " + JSON.stringify(highZoomRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(highZoomRasterError.maximumSourceToRenderedDistanceCssPixels,
        "156% panned DPR3 SPLINE source samples had a raster coverage gap: " + JSON.stringify(highZoomRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 125% panned DPR3 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        cameraAfter125Zoom, cameraAfter125Pan, panOffsetAt125, stateAfter125Pan, rasterError125,
      }));
      console.log("F07 156% panned DPR3 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        cameraAfter156Zoom, panOffsetAt80, panOffsetAt156, highZoomPanCssPixels, cameraAfter156Pan,
        lastZoomState, stateAfter156Pan, highZoomRasterError,
      }));

      const ultraZoomBaseline = await readSplineState();
      const frameBefore195Zoom = await readDeviceFrame();
      await zoomButton.click();
      await expect(splinePage.getByText("195%")).toBeVisible();
      const ultraZoomState = await waitForSplineQuiet(
        ultraZoomBaseline.targetErrors.length + 1,
        "195% DPR3 SPLINE zoom refinement",
      );
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBefore195Zoom);
      const cameraAfter195Zoom = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 SPLINE camera is missing at 195% zoom");
        return { ...input.__zoom };
      });
      expect(cameraAfter195Zoom.k / cameraAfter156Pan.k).toBeCloseTo(1.25, 6);
      expect(cameraAfter195Zoom.x - rasterContext.cssWidth / 2).toBeCloseTo(
        (cameraAfter156Pan.x - rasterContext.cssWidth / 2) * 1.25, 6,
      );
      expect(cameraAfter195Zoom.y - rasterContext.cssHeight / 2).toBeCloseTo(
        (cameraAfter156Pan.y - rasterContext.cssHeight / 2) * 1.25, 6,
      );
      expect(ultraZoomState.targetErrors.at(-1)).toBe(0.25);
      expect(ultraZoomState.refinedReplies).toBe(ultraZoomState.targetErrors.length);

      const ultraZoomPanCssPixels = { x: 24, y: 12 };
      const frameBefore195Pan = await readDeviceFrame();
      await splinePage.mouse.move(panBounds!.x + panBounds!.width / 2, panBounds!.y + panBounds!.height / 2);
      await splinePage.mouse.down();
      await splinePage.mouse.move(
        panBounds!.x + panBounds!.width / 2 + ultraZoomPanCssPixels.x,
        panBounds!.y + panBounds!.height / 2 + ultraZoomPanCssPixels.y,
        { steps: 4 },
      );
      await splinePage.mouse.up();
      await expect.poll(readDeviceFrame, { timeout: 5_000 }).not.toBe(frameBefore195Pan);
      const cameraAfter195Pan = await splinePage.evaluate(() => {
        const input = document.querySelector<HTMLElement & { __zoom?: { x: number; y: number; k: number } }>(
          '[aria-label="CAD V2 Çizim Etkileşim Alanı"]',
        );
        if (!input?.__zoom) throw new Error("F07 DPR3 SPLINE camera is missing after 195% pan");
        return { ...input.__zoom };
      });
      expect(cameraAfter195Pan.x - cameraAfter195Zoom.x).toBeCloseTo(ultraZoomPanCssPixels.x, 6);
      expect(cameraAfter195Pan.y - cameraAfter195Zoom.y).toBeCloseTo(ultraZoomPanCssPixels.y, 6);
      expect(cameraAfter195Pan.k).toBeCloseTo(cameraAfter195Zoom.k, 12);
      const stateAfter195Pan = await waitForSplineQuiet(
        ultraZoomState.targetErrors.length,
        "panned 195% DPR3 SPLINE refinement",
      );
      expect(stateAfter195Pan).toEqual(ultraZoomState);

      const ultraZoomScreenshot = await canvas.screenshot({ scale: "device" });
      const ultraZoomRasterError = await splinePage.evaluate(measureF07SplineRasterError, {
        screenshotBase64: ultraZoomScreenshot.toString("base64"),
        controlPoints: scene.controlPoints,
        weights: scene.weights,
        camera: cameraAfter195Pan,
      });
      expect(ultraZoomRasterError.imageWidth).toBe(rasterContext.cssWidth * 3);
      expect(ultraZoomRasterError.imageHeight).toBe(rasterContext.cssHeight * 3);
      expect(ultraZoomRasterError.bluePixelCount).toBeGreaterThan(100);
      expect(ultraZoomRasterError.independentSourceSampleCount).toBe(4097);
      expect(ultraZoomRasterError.sourceBounds.minX).toBeGreaterThanOrEqual(0);
      expect(ultraZoomRasterError.sourceBounds.minY).toBeGreaterThanOrEqual(0);
      expect(ultraZoomRasterError.sourceBounds.maxX).toBeLessThan(rasterContext.cssWidth);
      expect(ultraZoomRasterError.sourceBounds.maxY).toBeLessThan(rasterContext.cssHeight);
      expect(ultraZoomRasterError.maximumRenderedToSourceDistanceCssPixels,
        "195% panned DPR3 SPLINE pixels exceeded the independent rational Bernstein envelope: " + JSON.stringify(ultraZoomRasterError))
        .toBeLessThanOrEqual(1.25);
      expect(ultraZoomRasterError.maximumSourceToRenderedDistanceCssPixels,
        "195% panned DPR3 SPLINE source samples had a raster coverage gap: " + JSON.stringify(ultraZoomRasterError))
        .toBeLessThanOrEqual(1.25);
      console.log("F07 195% panned DPR3 runtime-refined rational SPLINE raster envelope PASS: " + JSON.stringify({
        ultraZoomBaseline, ultraZoomState, cameraAfter195Zoom, ultraZoomPanCssPixels, cameraAfter195Pan,
        stateAfter195Pan, ultraZoomRasterError,
      }));
    } finally {
      await context.close();
    }
  });
});
