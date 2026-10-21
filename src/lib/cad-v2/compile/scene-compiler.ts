// ============================================================================
// DWG/DXF MOTOR V2 — SCENE COMPILER (CANONICAL -> DV2SCN01 CHUNKS + MANIFEST)
// ============================================================================
// Sözleşme: motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md, 31_SOZLESME_TAMAMLAMALARI.md

import * as crypto from "node:crypto";
import type { CadCanonicalDocument, CadEntity, CadBBox2D, CadPoint2D } from "../canonical/types";
import { LayoutManager } from "../layout/layout-manager";
import {
  buildSceneChunk,
  SceneTag,
  SceneScalarType,
  DrawPrimitiveKind,
  UINT32_MAX,
  MAX_CHUNK_BYTE_LENGTH,
} from "../protocol/binary-protocol";
import { BlockTransformer } from "./block-transformer";
import { maxSingularValue2x2 } from "./coordinate-transform";
import { clipTriangleMeshToConvexPolygon } from "./fill-mesh";
import type { TransformedFill, TransformedSegment } from "./entity-visitor";
import { FontLayoutEngine, type FontDegradedDiagnostic } from "../text/font-layout-engine";
import { layoutComplexLinetypeEntity } from "./complex-linetype-glyphs";
import { GeometryCompiler, worldCurveErrorFromScreen, type AnalyticCurveSourceSegment, type RationalBezierSource } from "./geometry-compiler";
import { resolveCadStyle, resolveEntityColor } from "./cad-color-resolver";
import {
  resolveEntityLineweight,
  resolveEntityLinetype,
  tessellateDashedLine,
  tessellateDashedArc,
  tessellateDashedCircle,
  tessellateDashedPath,
} from "../render/cad-stroke";
import { evaluateDocumentQuality, CadDiagnosticCode } from "../canonical/diagnostics";
import {
  CAD_V2_SCHEMA_VERSION,
  CAD_V2_COMPILER_REVISION,
  CAD_V2_RENDER_ABI,
  CAD_V2_QUALITY_PROFILE,
  CAD_V2_FONT_DIGEST,
  CAD_V2_DECODER_VERSIONS,
} from "../version";
import { computeSceneIdentity } from "../service/scene-identity";
import type { RuntimeHatchFillSource } from "../worker/hatch-fill-refinement";
import { MAX_INDEX_PAGE_BYTES } from "../protocol/manifest-index-pages";
import { resolveModelSpaceViewBounds } from "../canonical/model-space-view-bounds";
import { CAD_V2_PAINTER_DEPTH_MAX_ORDER, createPainterOrderIndex } from "../painter-order-compaction";

function getShaderDashStyle(pattern: readonly number[], effectiveScale: number):
  { dashSize: number; gapSize: number; pattern?: number[] } | undefined {
  if (!(effectiveScale > 0) || pattern.length < 2 || pattern.length > 12 ||
      !pattern.every((term) => Number.isFinite(term) && term !== 0) ||
      !pattern.some((term) => term > 0) || !pattern.some((term) => term < 0)) return undefined;
  const scaled = pattern.map((term) => term * effectiveScale);
  if (!scaled.every((term) => Number.isFinite(term) && term !== 0) ||
      !Number.isFinite(scaled.reduce((sum, term) => sum + Math.abs(term), 0))) return undefined;
  if (scaled.length === 2 && scaled[0]! > 0 && scaled[1]! < 0) {
    return { dashSize: scaled[0]!, gapSize: -scaled[1]! };
  }
  return { dashSize: 0, gapSize: 0, pattern: scaled };
}

export interface CompiledSceneOutput {
  manifest: {

    schemaVersion: number;
    sceneId: string;
    storageGeneration?: string;
    sourceVersionKey: string;
    sourceSha256: string;
    dependencyDigest: string;
    decoderVersions: Record<string, string>;
    compilerVersion: string;
    renderAbi: string;
    qualityProfile: "cad-v2-2d-v1";
    qualityStatus: "exact" | "degraded";
    diagnosticsSummary: {
      unknownEntityCount: number | null;
      unknownObjectCount: number | null;
      missingFontCount: number | null;
      missingDependencyCount: number | null;
      diagnosticCodes: string[];
    };
    layouts: Array<{
      layoutId: string;
      sourceName: string;
      kind: "model" | "paper";
      bbox: CadBBox2D;
      units: number;
    }>;
    layers?: Record<string, any>;
    resources: { metadataIds: string[] };
    indexPages: Array<{
      indexId: string;
      byteLength: number;
      sha256: string;
      layoutIds: string[];
      chunkIds?: string[];
      chunks?: Array<{
        chunkId: string;
        byteLength: number;
        renderableVertexCount: number;
        sha256: string;
        layoutId: string;
        bbox: CadBBox2D;
        maxQuantizationErrorWorld: number;
        maxQuantizationErrorCssPixels?: number;
        maxHatchFillBoundaryTessellationErrorWorld: number;
        maxHatchFillBoundaryTessellationErrorCssPixels?: number;
        maxHatchFillTriangleQuantizationErrorWorld: number;
        maxHatchFillTriangleQuantizationErrorCssPixels?: number;
        maxHatchFillEncodedGeometryErrorWorld: number;
        maxHatchFillEncodedGeometryErrorCssPixels?: number;
        maxPathDistanceQuantizationErrorWorld: number;
        maxPathDistanceQuantizationErrorCssPixels?: number;
        maxCurveSourceQuantizationErrorWorld: number;
        maxCurveSourceQuantizationErrorCssPixels?: number;
        maxCircularCurveTessellationErrorWorld: number;
        maxCircularCurveTessellationErrorCssPixels?: number;
        maxEllipseCurveTessellationErrorWorld: number;
        maxEllipseCurveTessellationErrorCssPixels?: number;
        maxSplineCurveTessellationErrorWorld: number;
        maxSplineCurveTessellationErrorCssPixels?: number;
        maxBulgeCurveTessellationErrorWorld: number;
        maxBulgeCurveTessellationErrorCssPixels?: number;
        maxCurveEncodedGeometryErrorWorld: number;
        maxCurveEncodedGeometryErrorCssPixels?: number;
        maxAdjacentChunkCompositeErrorWorld: number;
        maxAdjacentChunkCompositeErrorCssPixels?: number;
        maxFillGlyphCompositeErrorWorld: number;
        maxFillGlyphCompositeErrorCssPixels?: number;
      }>;
    }>;
    metadataPages: Array<{
      metadataId: string;
      layoutId: string;
      byteLength: number;
      sha256: string;
    }>;
    limits: {
      maxChunkBytes: number;
      maxDecodedBytes: number;
      maxManifestBytes: number;
    };
    createdAt: string;
    chunks: Array<{
      chunkId: string;
      byteLength: number;
      renderableVertexCount: number;
      sha256: string;
      layoutId: string;
      bbox: CadBBox2D;
      maxQuantizationErrorWorld: number;
      maxQuantizationErrorCssPixels?: number;
      maxHatchFillBoundaryTessellationErrorWorld: number;
      maxHatchFillBoundaryTessellationErrorCssPixels?: number;
      maxHatchFillTriangleQuantizationErrorWorld: number;
      maxHatchFillTriangleQuantizationErrorCssPixels?: number;
      maxHatchFillEncodedGeometryErrorWorld: number;
      maxHatchFillEncodedGeometryErrorCssPixels?: number;
      maxPathDistanceQuantizationErrorWorld: number;
      maxPathDistanceQuantizationErrorCssPixels?: number;
      maxCurveSourceQuantizationErrorWorld: number;
      maxCurveSourceQuantizationErrorCssPixels?: number;
      maxCircularCurveTessellationErrorWorld: number;
      maxCircularCurveTessellationErrorCssPixels?: number;
      maxEllipseCurveTessellationErrorWorld: number;
      maxEllipseCurveTessellationErrorCssPixels?: number;
      maxSplineCurveTessellationErrorWorld: number;
      maxSplineCurveTessellationErrorCssPixels?: number;
      maxBulgeCurveTessellationErrorWorld: number;
      maxBulgeCurveTessellationErrorCssPixels?: number;
      maxCurveEncodedGeometryErrorWorld: number;
      maxCurveEncodedGeometryErrorCssPixels?: number;
      maxAdjacentChunkCompositeErrorWorld: number;
      maxAdjacentChunkCompositeErrorCssPixels?: number;
      maxFillGlyphCompositeErrorWorld: number;
      maxFillGlyphCompositeErrorCssPixels?: number;
    }>;
  };
  chunks: Map<string, Uint8Array>;
  indexFiles?: Map<string, string>;
  metadataFiles?: Map<string, string>;
}

export type SceneCompileProfilePhase =
  | "compile-start"
  | "primitive-emission-complete"
  | "painter-order-complete"
  | "partition-complete"
  | "chunk-encoding-complete"
  | "manifest-ready";

export interface SceneCompileProfileEvent {
  phase: SceneCompileProfilePhase;
  layoutId: string;
  modelSourceEntityCount: number;
  primitiveCount?: number;
  primitiveCountByEntityType?: Record<string, number>;
  maximumPrimitiveSourceEntity?: { entityType: string; count: number };
  painterOrderRunCount?: number;
  painterOrderCompacted?: boolean;
  painterSortApplied?: boolean;
  sourceEntitySortApplied?: boolean;
  primitiveSortApplied?: boolean;
  partitionedPrimitiveCount?: number;
  partitionRangeCount?: number;
  encodedChunkCount?: number;
  encodedChunkBytes?: number;
  painterDepthSpatialPackingApplied?: boolean;
}

export interface SceneCompileOptions {
  sceneId?: string;
  authoritativeRevision?: string;
  fileId?: string;
  /** Internal layout selection; omitted means compile every layout. */
  layoutId?: string;
  /** Per-entity safety cap; override only for controlled tests or constrained hosts. */
  maxCurveSegments?: number;
  /** Lowerable test/host cap; production never exceeds the 50k protocol planning limit. */
  maxPrimitivesPerChunk?: number;
  /** Optional active-view profile. All three fields must be provided together. */
  targetCurveErrorCssPixels?: number;
  unitsPerCssPixel?: number;
  maxTransformSingularValue?: number;
  /** Opt-in, read-only phase observer for bounded compiler profiling. */
  onProfileEvent?: (event: SceneCompileProfileEvent) => void;
}

const DEFAULT_MAX_CURVE_SEGMENTS_PER_ENTITY = 65_536;

export function compileCanonicalToScene(
  doc: CadCanonicalDocument,
  options?: SceneCompileOptions
): CompiledSceneOutput {
  if (!options?.layoutId) {
    const layoutIds = ["Model", ...Object.entries(doc.layouts || {})
      .filter(([id, layout]) => id !== "Model" && !layout.isModelSpace)
      .map(([id]) => id)];
    const compiled = layoutIds.map((layoutId) =>
      compileCanonicalToScene(doc, { ...options, layoutId })
    );
    const first = compiled[0];
    const chunks = new Map<string, Uint8Array>();
    const indexFiles = new Map<string, string>();
    const metadataFiles = new Map<string, string>();
    for (const output of compiled) {
      for (const [id, bytes] of output.chunks) chunks.set(id, bytes);
      for (const [id, content] of output.indexFiles || []) indexFiles.set(id, content);
      for (const [id, content] of output.metadataFiles || []) metadataFiles.set(id, content);
    }
    const layouts = compiled.flatMap((output) => output.manifest.layouts);
    const indexPages = compiled.flatMap((output) => output.manifest.indexPages);
    const metadataPages = compiled.flatMap((output) => output.manifest.metadataPages);
    const allChunks = compiled.flatMap((output) => output.manifest.chunks);
    const diagnosticCodes = [...new Set(compiled.flatMap((output) => output.manifest.diagnosticsSummary.diagnosticCodes))];
    const manifest = {
      ...first.manifest,
      qualityStatus: compiled.some((output) => output.manifest.qualityStatus === "degraded") ? "degraded" as const : "exact" as const,
      layouts,
      resources: { metadataIds: metadataPages.map((page) => page.metadataId) },
      indexPages,
      metadataPages,
      chunks: allChunks,
      diagnosticsSummary: {
        ...first.manifest.diagnosticsSummary,
        diagnosticCodes,
        missingFontCount: Math.max(...compiled.map((output) => output.manifest.diagnosticsSummary.missingFontCount || 0)),
      },
    };
    return { manifest, chunks, indexFiles, metadataFiles };
  }

  let sceneId = options?.sceneId;
  if (!sceneId) {
    if (doc.sourceSha256 && (options?.authoritativeRevision || doc.sourceVersionKey)) {
      const rev = options?.authoritativeRevision || doc.sourceVersionKey;
      const fileId = options?.fileId || rev.split("_")[0] || rev;
      try {
        const fontDigest = FontLayoutEngine.getFontDigest();
        const idResult = computeSceneIdentity({
          fileId,
          sourceSha256: doc.sourceSha256,
          authoritativeRevision: rev,
          fontDigest,
        });
        sceneId = idResult.sceneId;
      } catch {
        sceneId = `scene_${crypto.createHash("sha256").update(doc.sourceSha256).digest("hex").slice(0, 24)}`;
      }
    } else if (doc.sourceSha256) {
      sceneId = `scene_${crypto.createHash("sha256").update(doc.sourceSha256).digest("hex").slice(0, 24)}`;
    } else {
      sceneId = `scene_${crypto.randomUUID()}`;
    }
  }

  // 1. Model alanı varlıklarını tara ve BBox hesapla
  const fontDiagnostics: FontDegradedDiagnostic[] = [];
  let curveRefinementLimitReached = false;
  let invalidCurveGeometry = false;
  let unsupportedComplexLinetype = false;
  let unsupportedFillClip = false;
  let unsupportedHatchPattern = false;
  let hatchPatternNativeParityUnverified = false;
  let hatchPatternLimitReached = false;
  let invalidHatchBoundary = false;
  let hatchBoundaryValidationLimitReached = false;
  const maxCurveSegments = Number.isFinite(options?.maxCurveSegments)
    ? Math.min(DEFAULT_MAX_CURVE_SEGMENTS_PER_ENTITY, Math.max(1, Math.floor(options!.maxCurveSegments!)))
    : DEFAULT_MAX_CURVE_SEGMENTS_PER_ENTITY;
  const screenBudgetFields = [options?.targetCurveErrorCssPixels, options?.unitsPerCssPixel, options?.maxTransformSingularValue];
  const hasScreenBudget = screenBudgetFields.some((value) => value !== undefined);
  if (hasScreenBudget && screenBudgetFields.some((value) => value === undefined)) {
    throw new TypeError("Screen-space curve budget requires targetCurveErrorCssPixels, unitsPerCssPixel and maxTransformSingularValue together");
  }
  const maxCurveErrorWorld = hasScreenBudget
    ? worldCurveErrorFromScreen(options!.targetCurveErrorCssPixels!, options!.unitsPerCssPixel!, options!.maxTransformSingularValue!)
    : 0.25;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const appendFill = (
    fill: TransformedFill,
    vertices = fill.vertices,
    order = fill.order,
    errorScale = 1,
    retainRuntimeHatchSource = true,
    reuseObject = false,
  ) => {
    const canReuse = reuseObject && vertices === fill.vertices && order === fill.order && errorScale === 1;
    const keepRuntimeHatchSource = retainRuntimeHatchSource && fill.hatchFillSource &&
      vertices === fill.vertices && fill.vertices.length / 6 <= 16_384;
    let primitive: OrderedPrimitive;
    if (canReuse) {
      const reusable = fill as TransformedFill & { kind: "triangle" | "wipeout" };
      reusable.kind = fill.isWipeout ? "wipeout" : "triangle";
      if (!keepRuntimeHatchSource) delete reusable.hatchFillSource;
      primitive = reusable;
    } else {
      primitive = {
        kind: fill.isWipeout ? "wipeout" : "triangle",
        vertices,
        layer: fill.layer,
        order,
        color: fill.color,
        isWipeout: fill.isWipeout,
        alpha: fill.alpha,
        isAci7: fill.isAci7,
        ...(Number.isFinite(fill.hatchFillBoundaryTessellationErrorWorld) ? {
          hatchFillBoundaryTessellationErrorWorld: fill.hatchFillBoundaryTessellationErrorWorld! * errorScale,
        } : {}),
        ...(keepRuntimeHatchSource ? { hatchFillSource: fill.hatchFillSource } : {}),
      };
    }
    allPrimitives.push(primitive);
    for (let offset = 0; offset < vertices.length; offset += 2) {
      minX = Math.min(minX, vertices[offset]!);
      minY = Math.min(minY, vertices[offset + 1]!);
      maxX = Math.max(maxX, vertices[offset]!);
      maxY = Math.max(maxY, vertices[offset + 1]!);
    }
  };

  type OrderedPrimitive =
    | {
        kind: "line";
        x0: number;
        y0: number;
        x1: number;
        y1: number;
        layer: string;
        order: bigint;
        /** Stable source primitive index used by encoded draw-command spans. */
        globalOrderIndex?: number;
        color: [number, number, number];
        isAci7?: boolean;
        alpha?: number;
        lineweightMm?: number;
        pathDistance0?: number;
        pathDistance1?: number;
        /** Keeps source dash phase when tessellated linetypes are refined at runtime. */
        pathDistanceRequired?: boolean;
        /** Native shader dash path for supported two-term, hairline strokes. */
        dashStyle?: { dashSize: number; gapSize: number; pattern?: number[] };
        /** Eligible source stroke may be sliced and grouped into bounded spatial chunks. */
        spatialPartitionEligible?: boolean;
        /** Only long source paths split existing painter runs into spatial ranges. */
        spatialRangeEligible?: boolean;
        spatialStrokeFamily?: "direct-line" | "non-line" | "glyph";
        isGlyphStroke?: boolean;
        /** Optional analytic source interval. The current chord remains the fallback geometry. */
        curveSource?: AnalyticCurveSourceSegment;
        /** Exact/conservative circular tessellation sagitta bound for a direct CIRCLE/ARC stroke. */
        circularCurveTessellationErrorWorld?: number;
        /** Bounded ellipse tessellation error for a direct top-level ELLIPSE stroke. */
        ellipseCurveTessellationErrorWorld?: number;
        /** Bounded static chord error for standalone or visitor-expanded SPLINE strokes. */
        splineCurveTessellationErrorWorld?: number;
        /** Static centerline chord error for a continuous, widthless LWPOLYLINE bulge. */
        bulgeCurveTessellationErrorWorld?: number;
        /** Static chord error for an emitted curved HATCH boundary line. */
        hatchBoundaryTessellationErrorWorld?: number;
      }
    | {
        kind: "triangle" | "wipeout";
        // Keep world-space triangle coordinates in Float64 until origin subtraction.
        vertices: Float64Array;
        layer: string;
        order: bigint;
        /** Stable source primitive index used by encoded draw-command spans. */
        globalOrderIndex?: number;
        color: [number, number, number];
        isWipeout?: boolean;
        alpha?: number;
        isAci7?: boolean;
        /** Maximum source-boundary tessellation deviation for a solid HATCH fill mesh. */
        hatchFillBoundaryTessellationErrorWorld?: number;
        /** Original direct-space solid HATCH source; omitted after clipping or spatial splitting. */
        hatchFillSource?: RuntimeHatchFillSource;
        /** A long source fill can be grouped by consecutive source triangles. */
        spatialPartitionEligible?: boolean;
        spatialRangeEligible?: boolean;
      };

  const allPrimitives: OrderedPrimitive[] = [];

  const layoutId = options.layoutId;
  const reportProfile = options?.onProfileEvent
    ? (event: Omit<SceneCompileProfileEvent, "layoutId" | "modelSourceEntityCount">) =>
      options.onProfileEvent!({
        ...event,
        layoutId,
        modelSourceEntityCount: doc.modelSpaceEntities.length,
      })
    : undefined;
  reportProfile?.({ phase: "compile-start" });
  const documentLtScale = doc.linetypeScaleSettings?.globalScale ?? 1;
  const annotationScaleFactor = doc.linetypeScaleSettings?.modelTabAnnotationScaleFactor;
  const modelAnnotationScalingEnabled = doc.linetypeScaleSettings?.modelTabAnnotationScaling === true;
  const scaledModelLtScale = documentLtScale * (annotationScaleFactor ?? 1);
  const unresolvedModelAnnotationScale = layoutId === "Model" && modelAnnotationScalingEnabled &&
    (!(annotationScaleFactor !== undefined && Number.isFinite(annotationScaleFactor) && annotationScaleFactor > 0) ||
      !Number.isFinite(scaledModelLtScale) || scaledModelLtScale <= 0);
  const effectiveGlobalLtScale = layoutId === "Model" && modelAnnotationScalingEnabled && !unresolvedModelAnnotationScale
    ? scaledModelLtScale
    : documentLtScale;

  const blockTransformer = new BlockTransformer({
    blocks: doc.blocks || {},
    layers: doc.layers || {},
    linetypes: doc.linetypes || {},
    textStyles: doc.textStyles || {},
    fontDiagnostics,
    globalLtScale: effectiveGlobalLtScale,
    maxCurveErrorWorld,
    maxCurveSegments,
  });

  const SPATIAL_CHUNK_SPAN_WORLD = 4096;
  const MAX_SPATIAL_CHUNKS_PER_SOURCE_STROKE = 256;
  // Triangle coordinates encode as three Float32 XY pairs (24 bytes/triangle).
  // Keep fill subranges and packed fill chunks comfortably below the 2 MiB wire cap.
  const MAX_FILL_TRIANGLES_PER_SPATIAL_GROUP = 16_384;
  const MAX_FILL_TRIANGLES_PER_CHUNK = 32_768;
  let nonLineEntitySpatialLimitReached = false;
  let glyphEntitySpatialLimitReached = false;
  const markLongStrokeSpatially = (firstIndex: number, family: "non-line" | "glyph") => {
    let strokeMinX = Infinity, strokeMinY = Infinity, strokeMaxX = -Infinity, strokeMaxY = -Infinity;
    for (let index = firstIndex; index < allPrimitives.length; index++) {
      const stroke = allPrimitives[index]!;
      if (stroke.kind !== "line") continue;
      const padding = Math.max(0, stroke.lineweightMm ?? 0) / 2;
      strokeMinX = Math.min(strokeMinX, stroke.x0 - padding, stroke.x1 - padding);
      strokeMinY = Math.min(strokeMinY, stroke.y0 - padding, stroke.y1 - padding);
      strokeMaxX = Math.max(strokeMaxX, stroke.x0 + padding, stroke.x1 + padding);
      strokeMaxY = Math.max(strokeMaxY, stroke.y0 + padding, stroke.y1 + padding);
    }
    const strokeSpan = Math.max(strokeMaxX - strokeMinX, strokeMaxY - strokeMinY);
    if (strokeSpan <= SPATIAL_CHUNK_SPAN_WORLD) return;

    let estimatedSpatialChunks = 0;
    let packMinX = Infinity, packMinY = Infinity, packMaxX = -Infinity, packMaxY = -Infinity;
    for (let index = firstIndex; index < allPrimitives.length; index++) {
      const stroke = allPrimitives[index]!;
      if (stroke.kind !== "line") continue;
      const padding = Math.max(0, stroke.lineweightMm ?? 0) / 2;
      const centerlineSpan = SPATIAL_CHUNK_SPAN_WORLD - 2 * padding;
      const chordSpan = Math.max(Math.abs(stroke.x1 - stroke.x0), Math.abs(stroke.y1 - stroke.y0));
      if (!(centerlineSpan > 0) || chordSpan > centerlineSpan) {
        if (packMinX < Infinity) estimatedSpatialChunks++;
        packMinX = packMinY = Infinity;
        packMaxX = packMaxY = -Infinity;
        estimatedSpatialChunks += centerlineSpan > 0 ? Math.ceil(chordSpan / centerlineSpan) : Infinity;
      } else {
        const nextMinX = Math.min(packMinX, stroke.x0 - padding, stroke.x1 - padding);
        const nextMinY = Math.min(packMinY, stroke.y0 - padding, stroke.y1 - padding);
        const nextMaxX = Math.max(packMaxX, stroke.x0 + padding, stroke.x1 + padding);
        const nextMaxY = Math.max(packMaxY, stroke.y0 + padding, stroke.y1 + padding);
        if (Math.max(nextMaxX - nextMinX, nextMaxY - nextMinY) > SPATIAL_CHUNK_SPAN_WORLD) {
          estimatedSpatialChunks++;
          packMinX = Math.min(stroke.x0, stroke.x1) - padding;
          packMinY = Math.min(stroke.y0, stroke.y1) - padding;
          packMaxX = Math.max(stroke.x0, stroke.x1) + padding;
          packMaxY = Math.max(stroke.y0, stroke.y1) + padding;
        } else {
          packMinX = nextMinX; packMinY = nextMinY;
          packMaxX = nextMaxX; packMaxY = nextMaxY;
        }
      }
      if (estimatedSpatialChunks > MAX_SPATIAL_CHUNKS_PER_SOURCE_STROKE) break;
    }
    if (packMinX < Infinity) estimatedSpatialChunks++;
    if (strokeSpan > SPATIAL_CHUNK_SPAN_WORLD * MAX_SPATIAL_CHUNKS_PER_SOURCE_STROKE ||
        estimatedSpatialChunks > MAX_SPATIAL_CHUNKS_PER_SOURCE_STROKE) {
      if (family === "glyph") glyphEntitySpatialLimitReached = true;
      else nonLineEntitySpatialLimitReached = true;
      return;
    }
    for (let index = firstIndex; index < allPrimitives.length; index++) {
      const stroke = allPrimitives[index]!;
      if (stroke.kind !== "line") continue;
      stroke.spatialPartitionEligible = true;
      stroke.spatialRangeEligible = true;
      stroke.spatialStrokeFamily = family;
    }
  };
  const markFillForSpatialChunking = (firstIndex: number) => {
    for (let index = firstIndex; index < allPrimitives.length; index++) {
      const fill = allPrimitives[index]!;
      if (fill.kind === "line") continue;
      let fillMinX = Infinity, fillMinY = Infinity, fillMaxX = -Infinity, fillMaxY = -Infinity;
      for (let vertex = 0; vertex < fill.vertices.length; vertex += 2) {
        fillMinX = Math.min(fillMinX, fill.vertices[vertex]!);
        fillMinY = Math.min(fillMinY, fill.vertices[vertex + 1]!);
        fillMaxX = Math.max(fillMaxX, fill.vertices[vertex]!);
        fillMaxY = Math.max(fillMaxY, fill.vertices[vertex + 1]!);
      }
      const triangleCount = fill.vertices.length / 6;
      if (Math.max(fillMaxX - fillMinX, fillMaxY - fillMinY) > SPATIAL_CHUNK_SPAN_WORLD ||
          triangleCount > MAX_FILL_TRIANGLES_PER_SPATIAL_GROUP) {
        // A spatially split fill no longer maps one source HATCH to one draw command.
        delete fill.hatchFillSource;
        fill.spatialPartitionEligible = true;
        fill.spatialRangeEligible = true;
      }
    }
  };
  const layoutToken = layoutId === "Model"
    ? "model"
    : `${layoutId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32) || "layout"}_${crypto.createHash("sha256").update(layoutId).digest("hex").slice(0, 8)}`;
  let entities = layoutId === "Model" ? doc.modelSpaceEntities : (doc.paperSpaceEntities?.[layoutId] || []);
  let sourceEntitySortApplied = false;
  if (layoutId === "Model") {
    for (let index = 1; index < entities.length; index++) {
      if (entities[index]!.order < entities[index - 1]!.order) {
        sourceEntitySortApplied = true;
        break;
      }
    }
    if (sourceEntitySortApplied) {
      entities = [...entities].sort((left, right) => left.order < right.order ? -1 : left.order > right.order ? 1 : 0);
    }
  }
  const primitiveCountByEntityType = reportProfile ? new Map<string, number>() : null;
  let maximumPrimitiveSourceEntity: { entityType: string; count: number } | undefined;
  for (const ent of entities) {
    if (ent.visible === false) continue;
    if (doc.layers && doc.layers[ent.layer]?.frozen) continue;
    const style = resolveCadStyle(ent, doc.layers || {});
    const entColor = style.rgb;
    const entIsAci7 = style.isAci7;
    const entAlpha = style.alpha;
    const lw = resolveEntityLineweight(ent, doc.layers || {});
    const entLw = lw.lineweightMm;
    const lt = resolveEntityLinetype(ent, doc.layers || {}, doc.linetypes || {}, {
      globalLtScale: effectiveGlobalLtScale,
    });
    const firstEntityPrimitive = allPrimitives.length;

    switch (ent.type) {
      case "LINE": {
        const [x0, y0] = ent.start;
        const [x1, y1] = ent.end;
        const needsSpatialRange = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) + entLw > 4096;
        if (lt.isContinuous) {
          const len = Math.hypot(x1 - x0, y1 - y0);
          allPrimitives.push({
            kind: "line",
            spatialPartitionEligible: true,
            spatialRangeEligible: needsSpatialRange,
            x0,
            y0,
            x1,
            y1,
            layer: ent.layer,
            order: ent.order,
            color: entColor,
            isAci7: entIsAci7,
            alpha: entAlpha,
            lineweightMm: entLw,
            pathDistance0: 0,
            pathDistance1: len,
          });
          minX = Math.min(minX, x0, x1);
          minY = Math.min(minY, y0, y1);
          maxX = Math.max(maxX, x0, x1);
          maxY = Math.max(maxY, y0, y1);
        } else {
          const dashStyle = getShaderDashStyle(lt.pattern, lt.effectiveScale);
          const length = Math.hypot(x1 - x0, y1 - y0);
          if (dashStyle && entLw <= 1e-4) {
            allPrimitives.push({
              kind: "line",
              spatialPartitionEligible: true,
              spatialRangeEligible: needsSpatialRange,
              x0,
              y0,
              x1,
              y1,
              layer: ent.layer,
              order: ent.order,
              color: entColor,
              isAci7: entIsAci7,
              alpha: entAlpha,
              lineweightMm: entLw,
              pathDistance0: 0,
              pathDistance1: length,
              dashStyle,
            });
            minX = Math.min(minX, x0, x1);
            minY = Math.min(minY, y0, y1);
            maxX = Math.max(maxX, x0, x1);
            maxY = Math.max(maxY, y0, y1);
          } else {
            const res = tessellateDashedLine(ent.start, ent.end, lt.pattern, lt.effectiveScale);
            for (const s of res.segments) {
              allPrimitives.push({
                kind: "line",
                spatialPartitionEligible: true,
                spatialRangeEligible: needsSpatialRange,
                x0: s.x0,
                y0: s.y0,
                x1: s.x1,
                y1: s.y1,
                layer: ent.layer,
                order: ent.order,
                color: entColor,
                isAci7: entIsAci7,
                alpha: entAlpha,
                lineweightMm: entLw,
                pathDistance0: s.d0,
                pathDistance1: s.d1,
              });
              minX = Math.min(minX, s.x0, s.x1);
              minY = Math.min(minY, s.y0, s.y1);
              maxX = Math.max(maxX, s.x0, s.x1);
              maxY = Math.max(maxY, s.y0, s.y1);
            }
          }
        }
        break;
      }

      case "CIRCLE": {
        const curveId = `${layoutToken}:${ent.handle}:CIRCLE`;
        if (lt.isContinuous) {
          const curveResult = GeometryCompiler.tessellateArcWithBudget(
            ent.center, ent.radius, 0, Math.PI * 2, false, maxCurveErrorWorld, maxCurveSegments
          );
          if (!curveResult.errorBoundMet) curveRefinementLimitReached = true;
          const pts = curveResult.points;
          let cumDist = 0;
          for (let i = 0; i < pts.length - 1; i++) {
            const segLen = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
            allPrimitives.push({
              kind: "line",
              x0: pts[i][0],
              y0: pts[i][1],
              x1: pts[i + 1][0],
              y1: pts[i + 1][1],
              layer: ent.layer,
              order: ent.order,
              color: entColor,
              isAci7: entIsAci7,
              alpha: entAlpha,
              lineweightMm: entLw,
              pathDistance0: cumDist,
              pathDistance1: cumDist + segLen,
              circularCurveTessellationErrorWorld: curveResult.maxSagittaWorld,
              curveSource: {
                curveId,
                sourceHandle: ent.handle,
                sourceType: "CIRCLE",
                center: ent.center,
                basisU: [ent.radius, 0],
                basisV: [0, ent.radius],
                startParam: (Math.PI * 2 * i) / (pts.length - 1),
                endParam: (Math.PI * 2 * (i + 1)) / (pts.length - 1),
                segmentIndex: i,
              },
            });
            cumDist += segLen;
            minX = Math.min(minX, pts[i][0], pts[i + 1][0]);
            minY = Math.min(minY, pts[i][1], pts[i + 1][1]);
            maxX = Math.max(maxX, pts[i][0], pts[i + 1][0]);
            maxY = Math.max(maxY, pts[i][1], pts[i + 1][1]);
          }
        } else {
          const res = tessellateDashedCircle(ent.center, ent.radius, lt.pattern, lt.effectiveScale, 0, {
            maxErrorWorld: maxCurveErrorWorld, maxSegments: maxCurveSegments,
          });
          if (res.refinementLimitReached || res.errorBoundMet === false) curveRefinementLimitReached = true;
          for (let i = 0; i < res.segments.length; i++) {
            const s = res.segments[i]!;
            const dashDistance0 = s.d0 ?? 0;
            const dashDistance1 = s.d1 ?? (dashDistance0 + Math.hypot(s.x1 - s.x0, s.y1 - s.y0));
            allPrimitives.push({
              kind: "line",
              x0: s.x0,
              y0: s.y0,
              x1: s.x1,
              y1: s.y1,
              layer: ent.layer,
              order: ent.order,
              color: entColor,
              isAci7: entIsAci7,
              alpha: entAlpha,
              lineweightMm: entLw,
              pathDistance0: s.d0,
              pathDistance1: s.d1,
              circularCurveTessellationErrorWorld: res.maxSagittaWorld,
              curveSource: {
                curveId,
                sourceHandle: ent.handle,
                sourceType: "CIRCLE",
                center: ent.center,
                basisU: [ent.radius, 0],
                basisV: [0, ent.radius],
              startParam: dashDistance0 / ent.radius,
              endParam: dashDistance1 / ent.radius,
                segmentIndex: i,
              },
            });
            minX = Math.min(minX, s.x0, s.x1);
            minY = Math.min(minY, s.y0, s.y1);
            maxX = Math.max(maxX, s.x0, s.x1);
            maxY = Math.max(maxY, s.y0, s.y1);
          }
        }
        break;
      }

      case "ARC": {
        const curveId = `${layoutToken}:${ent.handle}:ARC`;
        const arcDirection = ent.isClockwise ? -1 : 1;
        let sourceSweep = ent.endAngleRad - ent.startAngleRad;
        if (ent.isClockwise) {
          if (sourceSweep > 0) sourceSweep -= Math.PI * 2;
        } else if (sourceSweep < 0) {
          sourceSweep += Math.PI * 2;
        }
        if (Math.abs(sourceSweep) < 1e-9) sourceSweep = arcDirection * Math.PI * 2;
        if (lt.isContinuous) {
        const curveResult = GeometryCompiler.tessellateArcWithBudget(
          ent.center,
          ent.radius,
          ent.startAngleRad,
          ent.endAngleRad,
          ent.isClockwise,
          maxCurveErrorWorld,
          maxCurveSegments
        );
          if (!curveResult.errorBoundMet) curveRefinementLimitReached = true;
          const pts = curveResult.points;
          let cumDist = 0;
          for (let i = 0; i < pts.length - 1; i++) {
            const segLen = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
            allPrimitives.push({
              kind: "line",
              x0: pts[i][0],
              y0: pts[i][1],
              x1: pts[i + 1][0],
              y1: pts[i + 1][1],
              layer: ent.layer,
              order: ent.order,
              color: entColor,
              isAci7: entIsAci7,
              alpha: entAlpha,
              lineweightMm: entLw,
              pathDistance0: cumDist,
              pathDistance1: cumDist + segLen,
              circularCurveTessellationErrorWorld: curveResult.maxSagittaWorld,
              curveSource: {
                curveId,
                sourceHandle: ent.handle,
                sourceType: "ARC",
                center: ent.center,
                basisU: [ent.radius, 0],
                basisV: [0, ent.radius],
                startParam: ent.startAngleRad + sourceSweep * i / (pts.length - 1),
                endParam: ent.startAngleRad + sourceSweep * (i + 1) / (pts.length - 1),
                segmentIndex: i,
              },
            });
            cumDist += segLen;
            minX = Math.min(minX, pts[i][0], pts[i + 1][0]);
            minY = Math.min(minY, pts[i][1], pts[i + 1][1]);
            maxX = Math.max(maxX, pts[i][0], pts[i + 1][0]);
            maxY = Math.max(maxY, pts[i][1], pts[i + 1][1]);
          }
        } else {
          const res = tessellateDashedArc(
            ent.center,
            ent.radius,
            ent.startAngleRad,
            ent.endAngleRad,
            ent.isClockwise,
            lt.pattern,
            lt.effectiveScale,
            0,
            { maxErrorWorld: maxCurveErrorWorld, maxSegments: maxCurveSegments }
          );
          if (res.refinementLimitReached || res.errorBoundMet === false) curveRefinementLimitReached = true;
          for (let i = 0; i < res.segments.length; i++) {
            const s = res.segments[i]!;
            const dashDistance0 = s.d0 ?? 0;
            const dashDistance1 = s.d1 ?? (dashDistance0 + Math.hypot(s.x1 - s.x0, s.y1 - s.y0));
            allPrimitives.push({
              kind: "line",
              x0: s.x0,
              y0: s.y0,
              x1: s.x1,
              y1: s.y1,
              layer: ent.layer,
              order: ent.order,
              color: entColor,
              isAci7: entIsAci7,
              alpha: entAlpha,
              lineweightMm: entLw,
              pathDistance0: s.d0,
              pathDistance1: s.d1,
              circularCurveTessellationErrorWorld: res.maxSagittaWorld,
              curveSource: {
                curveId,
                sourceHandle: ent.handle,
                sourceType: "ARC",
                center: ent.center,
                basisU: [ent.radius, 0],
                basisV: [0, ent.radius],
                startParam: ent.startAngleRad + arcDirection * dashDistance0 / ent.radius,
                endParam: ent.startAngleRad + arcDirection * dashDistance1 / ent.radius,
                segmentIndex: i,
              },
            });
            minX = Math.min(minX, s.x0, s.x1);
            minY = Math.min(minY, s.y0, s.y1);
            maxX = Math.max(maxX, s.x0, s.x1);
            maxY = Math.max(maxY, s.y0, s.y1);
          }
        }
        break;
      }

      case "ELLIPSE": {
        const curveId = `${layoutToken}:${ent.handle}:ELLIPSE`;
        const curveResult = GeometryCompiler.tessellateEllipseWithBudget(
          ent.center,
          ent.majorAxisVector,
          ent.axisRatio,
          ent.startParam,
          ent.endParam,
          maxCurveErrorWorld,
          maxCurveSegments
        );
        if (!curveResult.errorBoundMet) curveRefinementLimitReached = true;
        const pts = curveResult.points;
        const ellipseSweep = ent.endParam - ent.startParam <= 0
          ? ent.endParam - ent.startParam + Math.PI * 2
          : ent.endParam - ent.startParam;
        const sidecarRatio = Math.max(1e-6, Math.min(1, ent.axisRatio));
        const basisV: [number, number] = [
          -ent.majorAxisVector[1] * sidecarRatio,
          ent.majorAxisVector[0] * sidecarRatio,
        ];
        let cumDist = 0;
        for (let i = 0; i < pts.length - 1; i++) {
          const segLen = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
          allPrimitives.push({
            kind: "line",
            x0: pts[i][0],
            y0: pts[i][1],
            x1: pts[i + 1][0],
            y1: pts[i + 1][1],
            layer: ent.layer,
            order: ent.order,
            color: entColor,
            isAci7: entIsAci7,
            alpha: entAlpha,
            lineweightMm: entLw,
            pathDistance0: cumDist,
            pathDistance1: cumDist + segLen,
            ellipseCurveTessellationErrorWorld: curveResult.maxSagittaWorld,
            curveSource: {
              curveId,
              sourceHandle: ent.handle,
              sourceType: "ELLIPSE",
              center: ent.center,
              basisU: ent.majorAxisVector,
              basisV,
              startParam: ent.startParam + ellipseSweep * i / (pts.length - 1),
              endParam: ent.startParam + ellipseSweep * (i + 1) / (pts.length - 1),
              segmentIndex: i,
            },
          });
          cumDist += segLen;
          minX = Math.min(minX, pts[i][0], pts[i + 1][0]);
          minY = Math.min(minY, pts[i][1], pts[i + 1][1]);
          maxX = Math.max(maxX, pts[i][0], pts[i + 1][0]);
          maxY = Math.max(maxY, pts[i][1], pts[i + 1][1]);
        }
        break;
      }

      case "LWPOLYLINE": {
        const expanded = GeometryCompiler.expandLwPolyline(ent, maxCurveSegments, maxCurveErrorWorld);
        if (expanded.refinementLimitReached) curveRefinementLimitReached = true;
        const hasWidth =
          (ent.constantWidth !== undefined && ent.constantWidth > 0) ||
          ent.vertices.some((v) => (v.startWidth && v.startWidth > 0) || (v.endWidth && v.endWidth > 0));
        const polylineLw = hasWidth ? 0 : entLw;

        const hasOnlyStraightSegments = ent.vertices.every((vertex) => !vertex.bulge || Math.abs(vertex.bulge) <= 1e-12);
        const shaderDashStyle = !hasWidth && polylineLw <= 1e-4 && !ent.isClosed &&
          (ent.plinegen ?? true) && hasOnlyStraightSegments
          ? getShaderDashStyle(lt.pattern, lt.effectiveScale)
          : undefined;

        if (shaderDashStyle && expanded.lineSegments.length > 0) {
          let cumulativeDistance = 0;
          for (const seg of expanded.lineSegments) {
            const segmentLength = Math.hypot(seg.x1 - seg.x0, seg.y1 - seg.y0);
            allPrimitives.push({
              kind: "line",
              ...seg,
              color: entColor,
              isAci7: entIsAci7,
              alpha: entAlpha,
              lineweightMm: polylineLw,
              pathDistance0: cumulativeDistance,
              pathDistance1: cumulativeDistance + segmentLength,
              dashStyle: shaderDashStyle,
            });
            cumulativeDistance += segmentLength;
            minX = Math.min(minX, seg.x0, seg.x1);
            minY = Math.min(minY, seg.y0, seg.y1);
            maxX = Math.max(maxX, seg.x0, seg.x1);
            maxY = Math.max(maxY, seg.y0, seg.y1);
          }
        } else if (!hasWidth && !lt.isContinuous && expanded.polyPoints && expanded.polyPoints.length >= 2) {
          // Bulge phase follows analytic arc length, independent of the centerline chord budget.
          const dashed = hasOnlyStraightSegments
            ? tessellateDashedPath(expanded.polyPoints, lt.pattern, lt.effectiveScale, {
                isClosed: ent.isClosed,
                plinegen: ent.plinegen ?? true,
              })
            : (() => {
                const segments: ReturnType<typeof tessellateDashedLine>["segments"] = [];
                let phase = 0;
                let totalDistance = 0;
                let refinementLimitReached = false;
                const count = ent.isClosed ? ent.vertices.length : ent.vertices.length - 1;
                for (let i = 0; i < count; i++) {
                  const current = ent.vertices[i]!;
                  const next = ent.vertices[(i + 1) % ent.vertices.length]!;
                  const p0: CadPoint2D = [current.x, current.y];
                  const p1: CadPoint2D = [next.x, next.y];
                  const startPhase = ent.plinegen === false ? 0 : phase;
                  const arc = GeometryCompiler.getBulgeArcParameters(p0, p1, current.bulge ?? 0);
                  const result = arc
                    ? tessellateDashedArc(
                        arc.center, arc.radius, arc.startAngleRad, arc.startAngleRad + arc.sweepRad,
                        arc.sweepRad < 0, lt.pattern, lt.effectiveScale, startPhase,
                        { maxErrorWorld: maxCurveErrorWorld, maxSegments: maxCurveSegments },
                      )
                    : tessellateDashedLine(p0, p1, lt.pattern, lt.effectiveScale, startPhase);
                  for (const segment of result.segments) {
                    segments.push({
                      ...segment,
                      d0: totalDistance + (segment.d0 ?? 0),
                      d1: totalDistance + (segment.d1 ?? 0),
                    });
                  }
                  phase = result.endPhase;
                  totalDistance += result.totalDistance;
                  refinementLimitReached ||= result.refinementLimitReached === true;
                }
                return { segments, endPhase: phase, totalDistance, refinementLimitReached };
              })();
          if (dashed.refinementLimitReached) curveRefinementLimitReached = true;
          for (const seg of dashed.segments) {
            allPrimitives.push({
              kind: "line",
              x0: seg.x0,
              y0: seg.y0,
              x1: seg.x1,
              y1: seg.y1,
              layer: ent.layer,
              order: ent.order,
              color: entColor,
              isAci7: entIsAci7,
              alpha: entAlpha,
              lineweightMm: polylineLw,
              pathDistance0: seg.d0,
              pathDistance1: seg.d1,
            });
            minX = Math.min(minX, seg.x0, seg.x1);
            minY = Math.min(minY, seg.y0, seg.y1);
            maxX = Math.max(maxX, seg.x0, seg.x1);
            maxY = Math.max(maxY, seg.y0, seg.y1);
          }
        } else {
          let cumDist = 0;
          for (const seg of expanded.lineSegments) {
            const segDist = Math.hypot(seg.x1 - seg.x0, seg.y1 - seg.y0);
            allPrimitives.push({
              kind: "line",
              ...seg,
              color: entColor,
              isAci7: entIsAci7,
              alpha: entAlpha,
              lineweightMm: polylineLw,
              pathDistance0: cumDist,
              pathDistance1: cumDist + segDist,
              curveSource: !hasWidth && lt.isContinuous ? seg.curveSource : undefined,
              ...(!hasWidth && lt.isContinuous && Number.isFinite(seg.bulgeCurveTessellationErrorWorld)
                ? { bulgeCurveTessellationErrorWorld: seg.bulgeCurveTessellationErrorWorld }
                : {}),
            });
            cumDist += segDist;
            minX = Math.min(minX, seg.x0, seg.x1);
            minY = Math.min(minY, seg.y0, seg.y1);
            maxX = Math.max(maxX, seg.x0, seg.x1);
            maxY = Math.max(maxY, seg.y0, seg.y1);
          }
        }

        if (expanded.thickTriangles && expanded.thickTriangles.vertices.length > 0) {
          allPrimitives.push({
            kind: "triangle",
            vertices: expanded.thickTriangles.vertices,
            layer: ent.layer,
            order: ent.order,
            color: entColor,
            alpha: entAlpha,
            isAci7: entIsAci7,
          });
          const verts = expanded.thickTriangles.vertices;
          for (let i = 0; i < verts.length; i += 2) {
            minX = Math.min(minX, verts[i]);
            minY = Math.min(minY, verts[i + 1]);
            maxX = Math.max(maxX, verts[i]);
            maxY = Math.max(maxY, verts[i + 1]);
          }
        }
        break;
      }

      case "SPLINE": {
        const curveResult = GeometryCompiler.tessellateSplineWithBudget(ent, maxCurveErrorWorld, maxCurveSegments);
        if (curveResult.invalidInput) invalidCurveGeometry = true;
        else if (!curveResult.errorBoundMet) curveRefinementLimitReached = true;
        const pts = curveResult.points;
        let cumDist = 0;
        const pushSplineSegment = (
          start: [number, number],
          end: [number, number],
          curveSource?: AnalyticCurveSourceSegment,
        ): void => {
          const segLen = Math.hypot(end[0] - start[0], end[1] - start[1]);
          allPrimitives.push({
            kind: "line",
            x0: start[0],
            y0: start[1],
            x1: end[0],
            y1: end[1],
            layer: ent.layer,
            order: ent.order,
            color: entColor,
            isAci7: entIsAci7,
            alpha: entAlpha,
            lineweightMm: entLw,
            pathDistance0: cumDist,
            pathDistance1: cumDist + segLen,
            curveSource,
            ...(Number.isFinite(curveResult.maxSagittaWorld)
              ? { splineCurveTessellationErrorWorld: curveResult.maxSagittaWorld }
              : {}),
          });
          cumDist += segLen;
          minX = Math.min(minX, start[0], end[0]);
          minY = Math.min(minY, start[1], end[1]);
          maxX = Math.max(maxX, start[0], end[0]);
          maxY = Math.max(maxY, start[1], end[1]);
        };
        if (lt.isContinuous && curveResult.splineBezierSpans?.length) {
          for (const span of curveResult.splineBezierSpans) {
            for (let index = 0; index + 1 < span.points.length; index++) {
              pushSplineSegment(span.points[index]!, span.points[index + 1]!, {
                curveId: `${layoutToken}:${ent.handle}:SPLINE:SPAN:${span.spanIndex}`,
                sourceHandle: ent.handle,
                sourceType: "SPLINE",
                center: span.source.controlPoints[0]!,
                basisU: [1, 0],
                basisV: [0, 1],
                startParam: span.parameters[index]!,
                endParam: span.parameters[index + 1]!,
                segmentIndex: index,
                splineSource: span.source,
              });
            }
          }
        } else {
          for (let index = 0; index + 1 < pts.length; index++) {
            pushSplineSegment(pts[index]!, pts[index + 1]!);
          }
        }
        break;
      }

      case "HATCH": {
        const isSolidFill = ent.isSolid === true || ent.solidFill === true;
        const hatchRes = GeometryCompiler.triangulateHatch(ent, maxCurveSegments, maxCurveErrorWorld);
        if (hatchRes.refinementLimitReached) curveRefinementLimitReached = true;
        if (hatchRes.invalidCurveGeometry) invalidCurveGeometry = true;
        if (hatchRes.invalidBoundaryGeometry) invalidHatchBoundary = true;
        if (hatchRes.boundaryValidationLimitReached) hatchBoundaryValidationLimitReached = true;
        if (!isSolidFill) {
          if (hatchRes.patternStatus === "rendered") hatchPatternNativeParityUnverified = true;
          else if (hatchRes.patternStatus === "limit") hatchPatternLimitReached = true;
          else unsupportedHatchPattern = true;
        }
        if (isSolidFill && hatchRes.mesh && hatchRes.mesh.vertices.length > 0) {
          allPrimitives.push({
            kind: "triangle",
            vertices: hatchRes.mesh.vertices,
            layer: ent.layer,
            order: ent.order,
            color: entColor,
            alpha: entAlpha,
            isAci7: entIsAci7,
            hatchFillBoundaryTessellationErrorWorld: hatchRes.maxBoundaryTessellationErrorWorld,
            ...((ent.isSolid === true || ent.solidFill === true) && hatchRes.mesh.vertices.length / 6 <= 16_384 ? {
              hatchFillSource: {
                handle: ent.handle,
                layer: ent.layer,
                order: ent.order.toString(),
                loops: ent.loops,
                hatchStyle: ent.hatchStyle,
                isSolid: ent.isSolid,
                solidFill: ent.solidFill,
              } satisfies RuntimeHatchFillSource,
            } : {}),
          });
          const verts = hatchRes.mesh.vertices;
          for (let i = 0; i < verts.length; i += 2) {
            minX = Math.min(minX, verts[i]);
            minY = Math.min(minY, verts[i + 1]);
            maxX = Math.max(maxX, verts[i]);
            maxY = Math.max(maxY, verts[i + 1]);
          }
        }
        for (const seg of hatchRes.patternSegments ?? []) {
          allPrimitives.push({
            kind: "line",
            ...seg,
            layer: ent.layer,
            order: ent.order,
            color: entColor,
            isAci7: entIsAci7,
            alpha: entAlpha,
            lineweightMm: entLw,
          });
          minX = Math.min(minX, seg.x0, seg.x1);
          minY = Math.min(minY, seg.y0, seg.y1);
          maxX = Math.max(maxX, seg.x0, seg.x1);
          maxY = Math.max(maxY, seg.y0, seg.y1);
        }
        for (const seg of hatchRes.boundaryLines) {
          allPrimitives.push({
            kind: "line",
            ...seg,
            color: entColor,
            isAci7: entIsAci7,
            alpha: entAlpha,
            lineweightMm: entLw,
            curveSource: lt.isContinuous ? seg.curveSource : undefined,
          });
          minX = Math.min(minX, seg.x0, seg.x1);
          minY = Math.min(minY, seg.y0, seg.y1);
          maxX = Math.max(maxX, seg.x0, seg.x1);
          maxY = Math.max(maxY, seg.y0, seg.y1);
        }
        break;
      }

      case "WIPEOUT": {
        const wipeMesh = GeometryCompiler.triangulateWipeout(ent);
        if (wipeMesh && wipeMesh.vertices.length > 0) {
          allPrimitives.push({
            kind: "wipeout",
            vertices: wipeMesh.vertices,
            layer: ent.layer,
            order: ent.order,
            color: [1, 1, 1],
            isWipeout: true,
            alpha: 1,
          });
          const verts = wipeMesh.vertices;
          for (let i = 0; i < verts.length; i += 2) {
            minX = Math.min(minX, verts[i]);
            minY = Math.min(minY, verts[i + 1]);
            maxX = Math.max(maxX, verts[i]);
            maxY = Math.max(maxY, verts[i + 1]);
          }
        }
        break;
      }

      case "INSERT": {
        const insertResult = blockTransformer.expandInsertWithSink(ent, (kind, item) => {
          if (kind === "fill") {
            appendFill(item as TransformedFill, undefined, undefined, 1, true, true);
            return;
          }
          const segment = item as TransformedSegment;
          const primitive = segment as unknown as Extract<OrderedPrimitive, { kind: "line" }>;
          primitive.kind = "line";
          primitive.color = segment.color ?? entColor;
          primitive.isAci7 = segment.isAci7 ?? entIsAci7;
          primitive.alpha = segment.alpha ?? entAlpha;
          primitive.lineweightMm = segment.lineweightMm ?? entLw;
          allPrimitives.push(primitive);
          minX = Math.min(minX, segment.x0, segment.x1);
          minY = Math.min(minY, segment.y0, segment.y1);
          maxX = Math.max(maxX, segment.x0, segment.x1);
          maxY = Math.max(maxY, segment.y0, segment.y1);
        });
        if (insertResult?.curveRefinementLimitReached) curveRefinementLimitReached = true;
        if (insertResult?.invalidCurveGeometry) invalidCurveGeometry = true;
        if (insertResult?.diagnostics.some((item) => item.code === "UNSUPPORTED_COMPLEX_LINETYPE_ELEMENT")) unsupportedComplexLinetype = true;
        if (insertResult?.diagnostics.some((item) => item.code === "UNSUPPORTED_FILL_CLIP")) unsupportedFillClip = true;
        if (insertResult?.diagnostics.some((item) => item.code === "UNSUPPORTED_HATCH_PATTERN")) unsupportedHatchPattern = true;
        if (insertResult?.diagnostics.some((item) => item.code === "HATCH_PATTERN_NATIVE_PARITY_UNVERIFIED")) hatchPatternNativeParityUnverified = true;
        if (insertResult?.diagnostics.some((item) => item.code === "HATCH_PATTERN_LIMIT_REACHED")) hatchPatternLimitReached = true;
        if (insertResult?.diagnostics.some((item) => item.code === "HATCH_BOUNDARY_INVALID")) invalidHatchBoundary = true;
        if (insertResult?.diagnostics.some((item) => item.code === "HATCH_BOUNDARY_VALIDATION_LIMIT_REACHED")) hatchBoundaryValidationLimitReached = true;
        break;
      }

      case "TEXT": {
        const segs = FontLayoutEngine.layoutText(ent, { textStyles: doc.textStyles, diagnostics: fontDiagnostics });
        for (const seg of segs) {
          const strokeColor = seg.color ? resolveEntityColor({ color: seg.color, layer: ent.layer }, doc.layers) : entColor;
          allPrimitives.push({ kind: "line", ...seg, color: strokeColor, isAci7: entIsAci7, alpha: entAlpha });
          minX = Math.min(minX, seg.x0, seg.x1);
          minY = Math.min(minY, seg.y0, seg.y1);
          maxX = Math.max(maxX, seg.x0, seg.x1);
          maxY = Math.max(maxY, seg.y0, seg.y1);
        }
        break;
      }

      case "MTEXT": {
        const segs = FontLayoutEngine.layoutMText(ent, { textStyles: doc.textStyles, diagnostics: fontDiagnostics });
        for (const seg of segs) {
          const strokeColor = seg.color ? resolveEntityColor({ color: seg.color, layer: ent.layer }, doc.layers) : entColor;
          allPrimitives.push({ kind: "line", ...seg, color: strokeColor, isAci7: entIsAci7, alpha: entAlpha });
          minX = Math.min(minX, seg.x0, seg.x1);
          minY = Math.min(minY, seg.y0, seg.y1);
          maxX = Math.max(maxX, seg.x0, seg.x1);
          maxY = Math.max(maxY, seg.y0, seg.y1);
        }
        break;
      }

      case "DIMENSION":
      case "LEADER":
      case "ATTDEF":
      case "ATTRIB": {
        const visitor = blockTransformer.getVisitor();
        const rootCtx = visitor.createRootContext(ent.layer, ent.order);
        const visitorRes = visitor.createEmptyResult();
        visitor.visitEntity(ent, rootCtx, visitorRes);
        if (visitorRes.curveRefinementLimitReached) curveRefinementLimitReached = true;
        if (visitorRes.invalidCurveGeometry) invalidCurveGeometry = true;
        if (visitorRes.diagnostics.some((item) => item.code === "UNSUPPORTED_COMPLEX_LINETYPE_ELEMENT")) unsupportedComplexLinetype = true;
        if (visitorRes.diagnostics.some((item) => item.code === "UNSUPPORTED_FILL_CLIP")) unsupportedFillClip = true;
        if (visitorRes.diagnostics.some((item) => item.code === "UNSUPPORTED_HATCH_PATTERN")) unsupportedHatchPattern = true;
        if (visitorRes.diagnostics.some((item) => item.code === "HATCH_PATTERN_NATIVE_PARITY_UNVERIFIED")) hatchPatternNativeParityUnverified = true;
        if (visitorRes.diagnostics.some((item) => item.code === "HATCH_PATTERN_LIMIT_REACHED")) hatchPatternLimitReached = true;
        if (visitorRes.diagnostics.some((item) => item.code === "HATCH_BOUNDARY_INVALID")) invalidHatchBoundary = true;
        if (visitorRes.diagnostics.some((item) => item.code === "HATCH_BOUNDARY_VALIDATION_LIMIT_REACHED")) hatchBoundaryValidationLimitReached = true;
        for (const draw of visitorRes.drawItems) {
          if (draw.kind === "fill") {
            appendFill(draw.item);
            continue;
          }
          const seg = draw.item;
          allPrimitives.push({
            kind: "line", x0: seg.x0, y0: seg.y0, x1: seg.x1, y1: seg.y1,
            layer: seg.layer, order: seg.order,
            color: seg.color || entColor, isAci7: seg.isAci7 ?? entIsAci7,
            alpha: seg.alpha ?? entAlpha, lineweightMm: seg.lineweightMm ?? entLw,
            splineCurveTessellationErrorWorld: seg.splineCurveTessellationErrorWorld,
            ellipseCurveTessellationErrorWorld: seg.ellipseCurveTessellationErrorWorld,
            bulgeCurveTessellationErrorWorld: seg.bulgeCurveTessellationErrorWorld,
            hatchBoundaryTessellationErrorWorld: seg.hatchBoundaryTessellationErrorWorld,
            isGlyphStroke: seg.isGlyphStroke,
          });
          minX = Math.min(minX, seg.x0, seg.x1);
          minY = Math.min(minY, seg.y0, seg.y1);
          maxX = Math.max(maxX, seg.x0, seg.x1);
          maxY = Math.max(maxY, seg.y0, seg.y1);
        }
        break;
      }

      default:
        break;
    }
    const complexLinetype = doc.linetypes?.[lt.name] || doc.linetypes?.[lt.name.toUpperCase()];
    const complexGlyphs = layoutComplexLinetypeEntity(
      ent, complexLinetype, lt.effectiveScale, doc.textStyles || {}, maxCurveErrorWorld, maxCurveSegments,
    );
    const glyphRangeEligible = ent.type === "LINE" &&
      Math.max(Math.abs(ent.end[0] - ent.start[0]), Math.abs(ent.end[1] - ent.start[1])) + entLw > 4096;
    if (complexGlyphs.unsupportedElements.length > 0) unsupportedComplexLinetype = true;
    for (const glyph of complexGlyphs.segments) {
      allPrimitives.push({
        kind: "line",
        x0: glyph.x0,
        y0: glyph.y0,
        x1: glyph.x1,
        y1: glyph.y1,
        layer: ent.layer,
        order: ent.order,
        color: entColor,
        isAci7: entIsAci7,
        alpha: entAlpha,
        lineweightMm: entLw,
        spatialPartitionEligible: true,
        spatialRangeEligible: glyphRangeEligible,
        isGlyphStroke: true,
      });
      minX = Math.min(minX, glyph.x0, glyph.x1);
      minY = Math.min(minY, glyph.y0, glyph.y1);
      maxX = Math.max(maxX, glyph.x0, glyph.x1);
      maxY = Math.max(maxY, glyph.y0, glyph.y1);
    }
    if (!lt.isContinuous) {
      for (let index = firstEntityPrimitive; index < allPrimitives.length; index++) {
        const primitive = allPrimitives[index]!;
        if (primitive.kind === "line") primitive.pathDistanceRequired = true;
      }
    }
    // Preserve short source strokes in their existing painter runs. A long
    // non-LINE stroke is partitioned in source order, including all its chords.
    const glyphStroke = ent.type === "TEXT" || ent.type === "MTEXT" ||
      ent.type === "ATTDEF" || ent.type === "ATTRIB";
    if (glyphStroke) {
      for (let index = firstEntityPrimitive; index < allPrimitives.length; index++) {
        const primitive = allPrimitives[index]!;
        if (primitive.kind === "line") primitive.isGlyphStroke = true;
      }
    }
    // A large INSERT is one source-ordered expansion group. Partition its
    // transformed child strokes together so nested curves/glyphs do not stay
    // in one oversized chunk just because their source entities are in blocks.
    const nonLineStroke = ent.type === "INSERT" || ent.type === "CIRCLE" || ent.type === "ARC" ||
      ent.type === "ELLIPSE" || ent.type === "SPLINE" ||
      ent.type === "LWPOLYLINE" || ent.type === "HATCH";
    if (nonLineStroke || glyphStroke) markLongStrokeSpatially(firstEntityPrimitive, glyphStroke ? "glyph" : "non-line");
    if (ent.type === "INSERT") {
      for (let index = firstEntityPrimitive; index < allPrimitives.length; index++) {
        const stroke = allPrimitives[index]!;
        if (stroke.kind === "line" && stroke.isGlyphStroke && stroke.spatialStrokeFamily === "non-line") {
          stroke.spatialStrokeFamily = "glyph";
        }
      }
    }
    if (ent.type === "HATCH" || ent.type === "WIPEOUT" || ent.type === "LWPOLYLINE" || ent.type === "INSERT") {
      markFillForSpatialChunking(firstEntityPrimitive);
    }
    if (primitiveCountByEntityType) {
      const emittedPrimitiveCount = allPrimitives.length - firstEntityPrimitive;
      if (emittedPrimitiveCount > 0) {
        primitiveCountByEntityType.set(
          ent.type,
          (primitiveCountByEntityType.get(ent.type) ?? 0) + emittedPrimitiveCount,
        );
        if (!maximumPrimitiveSourceEntity || emittedPrimitiveCount > maximumPrimitiveSourceEntity.count) {
          maximumPrimitiveSourceEntity = { entityType: ent.type, count: emittedPrimitiveCount };
        }
      }
    }
  }

  // Paper-space viewports project model geometry into the selected layout.
  // Each viewport has its own transform, frozen layers, style overrides and clip boundary.
  if (layoutId !== "Model") {
    const visitor = blockTransformer.getVisitor();
    const viewports = Object.values(doc.viewports || {}).filter((viewport) => viewport.layoutId === layoutId);
    for (const viewport of viewports) {
      if (viewport.clipBoundaryObjectId && !viewport.clipPolygon) continue;
      if (viewport.perspective || (viewport.viewDirection && (Math.abs(viewport.viewDirection[0]) > 1e-8 || Math.abs(viewport.viewDirection[1]) > 1e-8 || viewport.viewDirection[2] < 0.999999))) continue;
      if (![...viewport.center, viewport.width, viewport.height, ...viewport.viewCenter, viewport.viewHeight].every(Number.isFinite) || viewport.width <= 0 || viewport.height <= 0 || viewport.viewHeight <= 0) continue;
      const matrix = LayoutManager.computeModelToPaper(viewport);
      const viewportMaxScale = maxSingularValue2x2(matrix.a, matrix.b, matrix.c, matrix.d);
      const bbox = LayoutManager.getViewportPaperBBox(viewport);
      for (const ent of doc.modelSpaceEntities) {
        if (!LayoutManager.isLayerVisible(ent.layer, doc.layers || {}, viewport)) continue;
        const firstViewportPrimitive = allPrimitives.length;
        const ctx = visitor.createRootContext(ent.layer, ent.order);
        ctx.viewportId = viewport.id;
        ctx.layerOverrides = viewport.layerOverrides;
        ctx.downstreamTransformSingularValue = viewportMaxScale;
        const documentLtScale = doc.linetypeScaleSettings?.globalScale ?? 1;
        // PSLTSCALE=1, çizgi aralıklarını pafta biriminde sabit tutar; source aralığı ters viewport ölçeğiyle büyür.
        const paperSpaceLtScale = doc.linetypeScaleSettings?.paperSpaceViewportScaling === true
          ? documentLtScale / viewportMaxScale
          : documentLtScale;
        ctx.globalLtScaleOverride = paperSpaceLtScale;
        const result = visitor.createEmptyResult();
        visitor.visitEntity(ent, ctx, result);
        if (result.curveRefinementLimitReached) curveRefinementLimitReached = true;
        if (result.invalidCurveGeometry) invalidCurveGeometry = true;
        if (result.diagnostics.some((item) => item.code === "UNSUPPORTED_COMPLEX_LINETYPE_ELEMENT")) unsupportedComplexLinetype = true;
        if (result.diagnostics.some((item) => item.code === "UNSUPPORTED_FILL_CLIP")) unsupportedFillClip = true;
        if (result.diagnostics.some((item) => item.code === "UNSUPPORTED_HATCH_PATTERN")) unsupportedHatchPattern = true;
        if (result.diagnostics.some((item) => item.code === "HATCH_PATTERN_NATIVE_PARITY_UNVERIFIED")) hatchPatternNativeParityUnverified = true;
        if (result.diagnostics.some((item) => item.code === "HATCH_PATTERN_LIMIT_REACHED")) hatchPatternLimitReached = true;
        if (result.diagnostics.some((item) => item.code === "HATCH_BOUNDARY_INVALID")) invalidHatchBoundary = true;
        if (result.diagnostics.some((item) => item.code === "HATCH_BOUNDARY_VALIDATION_LIMIT_REACHED")) hatchBoundaryValidationLimitReached = true;
        const viewportClipPolygon: CadPoint2D[] = viewport.clipPolygon && viewport.clipPolygon.length >= 3
          ? viewport.clipPolygon
          : [[bbox[0], bbox[1]], [bbox[2], bbox[1]], [bbox[2], bbox[3]], [bbox[0], bbox[3]]];
        for (const draw of result.drawItems) {
          if (draw.kind === "fill") {
            const fill = draw.item;
            if (!LayoutManager.isLayerVisible(fill.layer, doc.layers || {}, viewport)) continue;
            const projected = new Float64Array(fill.vertices.length);
            for (let offset = 0; offset < fill.vertices.length; offset += 2) {
              const point = LayoutManager.transformPoint([fill.vertices[offset]!, fill.vertices[offset + 1]!], matrix);
              projected[offset] = point[0];
              projected[offset + 1] = point[1];
            }
            const clipped = clipTriangleMeshToConvexPolygon(projected, viewportClipPolygon);
            if (clipped === null) {
              unsupportedFillClip = true;
              continue;
            }
            if (clipped.length > 0) appendFill(fill, clipped, viewport.order ?? fill.order, viewportMaxScale, false);
            continue;
          }
          const segment = draw.item;
          if (!LayoutManager.isLayerVisible(segment.layer, doc.layers || {}, viewport)) continue;
          const p0 = LayoutManager.transformPoint([segment.x0, segment.y0], matrix);
          const p1 = LayoutManager.transformPoint([segment.x1, segment.y1], matrix);
          const clippedSegments = viewport.clipPolygon && viewport.clipPolygon.length >= 3
            ? LayoutManager.clipLineToPolygon(p0, p1, viewport.clipPolygon)
            : (() => { const clipped = LayoutManager.clipLineToBBox(p0, p1, bbox); return clipped ? [clipped] : []; })();
          for (const [a, b] of clippedSegments) {
            if (Math.hypot(b[0] - a[0], b[1] - a[1]) <= 1e-9) continue;
            const dx = p1[0] - p0[0];
            const dy = p1[1] - p0[1];
            const lengthSquared = dx * dx + dy * dy;
            const fraction = (point: CadPoint2D) => lengthSquared > 0
              ? Math.max(0, Math.min(1, ((point[0] - p0[0]) * dx + (point[1] - p0[1]) * dy) / lengthSquared))
              : 0;
            const sourceD0 = segment.pathDistance0;
            const sourceD1 = segment.pathDistance1;
            const sourceCurve = segment.curveSource;
            const projectedCurveSource: AnalyticCurveSourceSegment | undefined = sourceCurve ? {
              ...sourceCurve,
              center: LayoutManager.transformPoint(sourceCurve.center, matrix),
              basisU: [
                matrix.a * sourceCurve.basisU[0] + matrix.c * sourceCurve.basisU[1],
                matrix.b * sourceCurve.basisU[0] + matrix.d * sourceCurve.basisU[1],
              ] as [number, number],
              basisV: [
                matrix.a * sourceCurve.basisV[0] + matrix.c * sourceCurve.basisV[1],
                matrix.b * sourceCurve.basisV[0] + matrix.d * sourceCurve.basisV[1],
              ] as [number, number],
              startParam: sourceCurve.startParam + (sourceCurve.endParam - sourceCurve.startParam) * fraction(a),
              endParam: sourceCurve.startParam + (sourceCurve.endParam - sourceCurve.startParam) * fraction(b),
              ...(sourceCurve.splineSource ? {
                splineSource: {
                  controlPoints: sourceCurve.splineSource.controlPoints.map((point) =>
                    LayoutManager.transformPoint(point, matrix)),
                  weights: sourceCurve.splineSource.weights,
                },
              } : {}),
            } : undefined;
            allPrimitives.push({
              kind: "line", x0: a[0], y0: a[1], x1: b[0], y1: b[1],
              layer: segment.layer, order: viewport.order ?? segment.order,
              color: segment.color || resolveCadStyle(ent, doc.layers || {}, viewport.layerOverrides).rgb,
              isAci7: segment.isAci7, alpha: segment.alpha,
              lineweightMm: segment.lineweightMm,
              ...(projectedCurveSource ? { curveSource: projectedCurveSource } : {}),
              ...(sourceD0 !== undefined && sourceD1 !== undefined ? {
                pathDistance0: sourceD0 + (sourceD1 - sourceD0) * fraction(a),
                pathDistance1: sourceD0 + (sourceD1 - sourceD0) * fraction(b),
              } : {}),
              ...(Number.isFinite(segment.circularCurveTessellationErrorWorld)
                ? { circularCurveTessellationErrorWorld: segment.circularCurveTessellationErrorWorld! * viewportMaxScale }
                : {}),
               ...(Number.isFinite(segment.splineCurveTessellationErrorWorld)
                ? { splineCurveTessellationErrorWorld: segment.splineCurveTessellationErrorWorld! * viewportMaxScale }
                : {}),
               ...(Number.isFinite(segment.ellipseCurveTessellationErrorWorld)
                ? { ellipseCurveTessellationErrorWorld: segment.ellipseCurveTessellationErrorWorld! * viewportMaxScale }
                : {}),
               ...(Number.isFinite(segment.bulgeCurveTessellationErrorWorld)
                ? { bulgeCurveTessellationErrorWorld: segment.bulgeCurveTessellationErrorWorld! * viewportMaxScale }
                : {}),
               ...(Number.isFinite(segment.hatchBoundaryTessellationErrorWorld)
                 ? { hatchBoundaryTessellationErrorWorld: segment.hatchBoundaryTessellationErrorWorld! * viewportMaxScale }
                 : {}),
               isGlyphStroke: segment.isGlyphStroke,
            });
            minX = Math.min(minX, a[0], b[0]); minY = Math.min(minY, a[1], b[1]);
            maxX = Math.max(maxX, a[0], b[0]); maxY = Math.max(maxY, a[1], b[1]);
          }
        }
        markFillForSpatialChunking(firstViewportPrimitive);
        const glyphStroke = ent.type === "TEXT" || ent.type === "MTEXT" ||
          ent.type === "ATTDEF" || ent.type === "ATTRIB";
        const nonLineStroke = ent.type === "INSERT" || ent.type === "CIRCLE" || ent.type === "ARC" ||
          ent.type === "ELLIPSE" || ent.type === "SPLINE" || ent.type === "LWPOLYLINE" || ent.type === "HATCH";
        if (glyphStroke) {
          for (let index = firstViewportPrimitive; index < allPrimitives.length; index++) {
            const primitive = allPrimitives[index]!;
            if (primitive.kind === "line") primitive.isGlyphStroke = true;
          }
        }
        if (nonLineStroke || glyphStroke) {
          markLongStrokeSpatially(firstViewportPrimitive, glyphStroke ? "glyph" : "non-line");
          if (ent.type === "INSERT") {
            for (let index = firstViewportPrimitive; index < allPrimitives.length; index++) {
              const stroke = allPrimitives[index]!;
              if (stroke.kind === "line" && stroke.isGlyphStroke && stroke.spatialStrokeFamily === "non-line") {
                stroke.spatialStrokeFamily = "glyph";
              }
            }
          }
        }
      }
    }
  }

  reportProfile?.({
    phase: "primitive-emission-complete",
    primitiveCount: allPrimitives.length,
    ...(primitiveCountByEntityType ? {
      primitiveCountByEntityType: Object.fromEntries(
        [...primitiveCountByEntityType.entries()].sort((left, right) => right[1] - left[1]),
      ),
      ...(maximumPrimitiveSourceEntity ? { maximumPrimitiveSourceEntity } : {}),
    } : {}),
  });

  // Authoritative painter's draw order sıralaması (Yalnız gerekliyse sırala)
  let needsSort = false;
  for (let i = 1; i < allPrimitives.length; i++) {
    if (allPrimitives[i].order < allPrimitives[i - 1].order) {
      needsSort = true;
      break;
    }
  }
  const primitiveSortApplied = needsSort;
  if (primitiveSortApplied) {
    allPrimitives.sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0));
  }
  const painterOrderIndex = createPainterOrderIndex(allPrimitives);
  const globalOrderMax = painterOrderIndex.globalOrderMax;
  const getEncodedPainterOrderIndex = (sourceOrderIndex: number) => {
    const orderIndex = painterOrderIndex.orderIndexForSourceIndex(sourceOrderIndex);
    if (orderIndex === null) {
      throw new Error(`Painter-order index is missing source primitive ${sourceOrderIndex}.`);
    }
    return orderIndex;
  };
  reportProfile?.({
    phase: "painter-order-complete",
    primitiveCount: allPrimitives.length,
    painterOrderRunCount: painterOrderIndex.runCount,
    painterOrderCompacted: painterOrderIndex.compacted,
    painterSortApplied: sourceEntitySortApplied || primitiveSortApplied,
    sourceEntitySortApplied,
    primitiveSortApplied,
  });

  // Geçerli BBox yoksa varsayılan
  if (!Number.isFinite(minX)) {
    minX = -100;
    minY = -100;
    maxX = 100;
    maxY = 100;
  }

  const Ox = (minX + maxX) / 2;
  const Oy = (minY + maxY) / 2;
  const modelBBox: CadBBox2D = [minX, minY, maxX, maxY];
  const modelViewBBox = resolveModelSpaceViewBounds(doc.modelSpaceViewBounds, modelBBox);

  // 2. Direct LINE and long non-LINE stroke spatial slicing in painter order.
  const MAX_SEGMENTS_PER_CHUNK = Number.isFinite(options.maxPrimitivesPerChunk)
    ? Math.min(50_000, Math.max(1, Math.floor(options.maxPrimitivesPerChunk!)))
    : 50_000;
  const MAX_CHUNK_SPAN_WORLD = SPATIAL_CHUNK_SPAN_WORLD;
  const MAX_SPATIAL_CHUNKS_PER_DIRECT_LINE = MAX_SPATIAL_CHUNKS_PER_SOURCE_STROKE;
  let directLineSpatialPartitionLimitReached = false;
  let nonLineSpatialPartitionLimitReached = nonLineEntitySpatialLimitReached;
  let glyphSpatialPartitionLimitReached = glyphEntitySpatialLimitReached;
  let fillSpatialPartitionLimitReached = false;
  const markSpatialLimit = (primitive: Extract<OrderedPrimitive, { kind: "line" }>) => {
    if (primitive.spatialStrokeFamily === "glyph") glyphSpatialPartitionLimitReached = true;
    else if (primitive.spatialStrokeFamily === "non-line") nonLineSpatialPartitionLimitReached = true;
    else directLineSpatialPartitionLimitReached = true;
  };
  const chunkPrimitives: OrderedPrimitive[] = [];
  // Oversized individual meshes need count-based windows even when compact.
  for (const primitive of allPrimitives) {
    if (primitive.kind !== "line" && primitive.vertices.length / 6 > MAX_FILL_TRIANGLES_PER_SPATIAL_GROUP) {
      delete primitive.hatchFillSource;
      primitive.spatialPartitionEligible = true;
      primitive.spatialRangeEligible = true;
    }
  }
  for (let sourceIndex = 0; sourceIndex < allPrimitives.length; sourceIndex++) {
    const primitive = allPrimitives[sourceIndex]!;
    primitive.globalOrderIndex = sourceIndex;
    if (primitive.kind !== "line" && primitive.spatialPartitionEligible === true) {
      const groups: Array<[number, number]> = [];
      let groupStart = 0;
      let groupMinX = Infinity, groupMinY = Infinity, groupMaxX = -Infinity, groupMaxY = -Infinity;
      const triangleCount = primitive.vertices.length / 6;
      for (let triangle = 0; triangle < triangleCount; triangle++) {
        const base = triangle * 6;
        const x0 = primitive.vertices[base]!, y0 = primitive.vertices[base + 1]!;
        const x1 = primitive.vertices[base + 2]!, y1 = primitive.vertices[base + 3]!;
        const x2 = primitive.vertices[base + 4]!, y2 = primitive.vertices[base + 5]!;
        const triangleMinX = Math.min(x0, x1, x2), triangleMinY = Math.min(y0, y1, y2);
        const triangleMaxX = Math.max(x0, x1, x2), triangleMaxY = Math.max(y0, y1, y2);
        const candidateSpan = Math.max(
          Math.max(groupMaxX, triangleMaxX) - Math.min(groupMinX, triangleMinX),
          Math.max(groupMaxY, triangleMaxY) - Math.min(groupMinY, triangleMinY),
        );
        if (triangle > groupStart &&
            (candidateSpan > MAX_CHUNK_SPAN_WORLD || triangle - groupStart >= MAX_FILL_TRIANGLES_PER_SPATIAL_GROUP)) {
          groups.push([groupStart, triangle]);
          groupStart = triangle;
          groupMinX = groupMinY = Infinity;
          groupMaxX = groupMaxY = -Infinity;
        }
        groupMinX = Math.min(groupMinX, triangleMinX);
        groupMinY = Math.min(groupMinY, triangleMinY);
        groupMaxX = Math.max(groupMaxX, triangleMaxX);
        groupMaxY = Math.max(groupMaxY, triangleMaxY);
        if (Math.max(groupMaxX - groupMinX, groupMaxY - groupMinY) > MAX_CHUNK_SPAN_WORLD) {
          // A single triangle cannot be cut without changing fill topology.
          fillSpatialPartitionLimitReached = true;
          groups.push([groupStart, triangle + 1]);
          groupStart = triangle + 1;
          groupMinX = groupMinY = Infinity;
          groupMaxX = groupMaxY = -Infinity;
        }
        if (groups.length > MAX_SPATIAL_CHUNKS_PER_SOURCE_STROKE) break;
      }
      if (groupStart < triangleCount) groups.push([groupStart, triangleCount]);
      if (groups.length > MAX_SPATIAL_CHUNKS_PER_SOURCE_STROKE) {
        fillSpatialPartitionLimitReached = true;
        if (triangleCount <= MAX_FILL_TRIANGLES_PER_SPATIAL_GROUP) {
          chunkPrimitives.push(primitive);
        } else {
          // Spatial locality hit its source cap. Retain every triangle in bounded
          // count windows so the partial result still obeys the transport byte cap.
          for (let start = 0; start < triangleCount; start += MAX_FILL_TRIANGLES_PER_SPATIAL_GROUP) {
            const end = Math.min(triangleCount, start + MAX_FILL_TRIANGLES_PER_SPATIAL_GROUP);
            const group: OrderedPrimitive = {
              ...primitive,
              vertices: primitive.vertices.subarray(start * 6, end * 6),
              spatialRangeEligible: true,
            };
            chunkPrimitives.push(group);
            group.globalOrderIndex = sourceIndex;
          }
        }
      } else {
        for (const [start, end] of groups) {
          const group: OrderedPrimitive = {
            ...primitive,
            vertices: primitive.vertices.subarray(start * 6, end * 6),
            spatialRangeEligible: true,
          };
          chunkPrimitives.push(group);
          group.globalOrderIndex = sourceIndex;
        }
      }
      continue;
    }
    if (primitive.kind !== "line" || primitive.spatialPartitionEligible !== true) {
      chunkPrimitives.push(primitive);
      continue;
    }

    const dx = primitive.x1 - primitive.x0;
    const dy = primitive.y1 - primitive.y0;
    const strokePadding = Math.max(0, primitive.lineweightMm ?? 0) / 2;
    const maxCenterlineSpan = MAX_CHUNK_SPAN_WORLD - strokePadding * 2;
    const axisSpan = Math.max(Math.abs(dx), Math.abs(dy));
    const sliceCount = maxCenterlineSpan > 0 ? Math.ceil(axisSpan / maxCenterlineSpan) : Infinity;
    if (sliceCount > MAX_SPATIAL_CHUNKS_PER_DIRECT_LINE || !Number.isSafeInteger(sliceCount)) {
      markSpatialLimit(primitive);
      chunkPrimitives.push(primitive);
      continue;
    }
    if (sliceCount <= 1) {
      chunkPrimitives.push(primitive);
      continue;
    }
    if (primitive.curveSource) {
      // Rational SPLINE refs carry an entire Bezier span; chord slicing would
      // duplicate that source interval in the refinement worker. Keep it whole.
      markSpatialLimit(primitive);
      chunkPrimitives.push(primitive);
      continue;
    }

    const sourcePathDistance0 = primitive.pathDistance0 ?? 0;
    const sourcePathDistance1 = primitive.pathDistance1 ?? Math.hypot(dx, dy);
    for (let sliceIndex = 0; sliceIndex < sliceCount; sliceIndex++) {
      const t0 = sliceIndex / sliceCount;
      const t1 = (sliceIndex + 1) / sliceCount;
      const slice: OrderedPrimitive = {
        ...primitive,
        x0: sliceIndex === 0 ? primitive.x0 : primitive.x0 + dx * t0,
        y0: sliceIndex === 0 ? primitive.y0 : primitive.y0 + dy * t0,
        x1: sliceIndex === sliceCount - 1 ? primitive.x1 : primitive.x0 + dx * t1,
        y1: sliceIndex === sliceCount - 1 ? primitive.y1 : primitive.y0 + dy * t1,
        pathDistance0: sourcePathDistance0 + (sourcePathDistance1 - sourcePathDistance0) * t0,
        pathDistance1: sourcePathDistance0 + (sourcePathDistance1 - sourcePathDistance0) * t1,
        spatialRangeEligible: true,
      };
      chunkPrimitives.push(slice);
      slice.globalOrderIndex = sourceIndex;
    }
  }
  let painterDepthSpatialPackingApplied = false;
  type PainterSpatialItem = {
    primitive: OrderedPrimitive;
    tileX: number;
    tileY: number;
    sourceSequence: number;
    sourceOrder: number;
    wasSpatialRangeEligible: boolean;
  };
  let painterSpatialItems: PainterSpatialItem[] | null = null;
  const painterSpatialPackingCellWorld = MAX_CHUNK_SPAN_WORLD / 2;
  if (globalOrderMax <= CAD_V2_PAINTER_DEPTH_MAX_ORDER && chunkPrimitives.length >= 64) {
    const spatialItems: PainterSpatialItem[] = [];
    let canPackBySpatialTile = true;
    const spatialTileKeys = new Set<string>();
    for (let sourceSequence = 0; sourceSequence < chunkPrimitives.length; sourceSequence++) {
      const primitive = chunkPrimitives[sourceSequence]!;
      if ((primitive.alpha ?? 1) !== 1 || primitive.kind === "wipeout" ||
          (primitive.kind === "line" && (primitive.dashStyle || primitive.pathDistanceRequired || primitive.curveSource ||
            Number.isFinite(primitive.circularCurveTessellationErrorWorld) ||
            Number.isFinite(primitive.ellipseCurveTessellationErrorWorld) ||
            Number.isFinite(primitive.splineCurveTessellationErrorWorld) ||
            Number.isFinite(primitive.bulgeCurveTessellationErrorWorld) ||
            Number.isFinite(primitive.hatchBoundaryTessellationErrorWorld)))) {
        canPackBySpatialTile = false;
        break;
      }

      let primitiveMinX = Infinity;
      let primitiveMinY = Infinity;
      let primitiveMaxX = -Infinity;
      let primitiveMaxY = -Infinity;
      if (primitive.kind === "line") {
        const padding = Math.max(0, primitive.lineweightMm ?? 0) / 2;
        primitiveMinX = Math.min(primitive.x0, primitive.x1) - padding;
        primitiveMinY = Math.min(primitive.y0, primitive.y1) - padding;
        primitiveMaxX = Math.max(primitive.x0, primitive.x1) + padding;
        primitiveMaxY = Math.max(primitive.y0, primitive.y1) + padding;
      } else {
        if (primitive.vertices.length === 0 || primitive.vertices.length % 6 !== 0) {
          canPackBySpatialTile = false;
          break;
        }
        for (let vertex = 0; vertex < primitive.vertices.length; vertex += 2) {
          const x = primitive.vertices[vertex]!;
          const y = primitive.vertices[vertex + 1]!;
          if (!Number.isFinite(x) || !Number.isFinite(y)) {
            canPackBySpatialTile = false;
            break;
          }
          primitiveMinX = Math.min(primitiveMinX, x);
          primitiveMinY = Math.min(primitiveMinY, y);
          primitiveMaxX = Math.max(primitiveMaxX, x);
          primitiveMaxY = Math.max(primitiveMaxY, y);
        }
        if (!canPackBySpatialTile) break;
      }

      const span = Math.max(primitiveMaxX - primitiveMinX, primitiveMaxY - primitiveMinY);
      const tileX = Math.floor(((primitiveMinX + primitiveMaxX) / 2 - Ox) / painterSpatialPackingCellWorld);
      const tileY = Math.floor(((primitiveMinY + primitiveMaxY) / 2 - Oy) / painterSpatialPackingCellWorld);
      const sourceOrder = primitive.globalOrderIndex;
      if (!Number.isFinite(span) || span > MAX_CHUNK_SPAN_WORLD ||
          !Number.isSafeInteger(tileX) || !Number.isSafeInteger(tileY) ||
          !Number.isSafeInteger(sourceOrder) || sourceOrder! < 0 || sourceOrder! >= allPrimitives.length) {
        canPackBySpatialTile = false;
        break;
      }
      spatialTileKeys.add(`${tileX}:${tileY}`);
      spatialItems.push({
        primitive,
        tileX,
        tileY,
        sourceSequence,
        sourceOrder: sourceOrder!,
        wasSpatialRangeEligible: primitive.spatialRangeEligible === true,
      });
    }

    // Marking a single-tile sequence as spatial provides no chunk reduction and
    // can split overview painter-rank groups. Keep its original sequence intact.
    if (canPackBySpatialTile && spatialTileKeys.size > 1 && spatialItems.length === chunkPrimitives.length) {
      spatialItems.sort((left, right) => left.tileY - right.tileY || left.tileX - right.tileX ||
        left.sourceOrder - right.sourceOrder || left.sourceSequence - right.sourceSequence);
      chunkPrimitives.length = 0;
      for (const item of spatialItems) {
        item.primitive.spatialRangeEligible = true;
        chunkPrimitives.push(item.primitive);
      }
      painterSpatialItems = spatialItems;
      painterDepthSpatialPackingApplied = true;
    }
  }
  allPrimitives.length = 0;

  const buildChunkRanges = (): Array<{ startIdx: number; endIdx: number }> => {
    const ranges: Array<{ startIdx: number; endIdx: number }> = [];
    let rangeStart = -1;
    let rangeKind: "spatial" | "sequence" | null = null;
    let rangeMinX = Infinity;
    let rangeMinY = Infinity;
    let rangeMaxX = -Infinity;
    let rangeMaxY = -Infinity;
    let rangeTriangleCount = 0;
    const flushRange = (endIdx: number) => {
      if (rangeStart >= 0 && endIdx > rangeStart) ranges.push({ startIdx: rangeStart, endIdx });
      rangeStart = -1;
      rangeKind = null;
      rangeMinX = rangeMinY = Infinity;
      rangeMaxX = rangeMaxY = -Infinity;
      rangeTriangleCount = 0;
    };
    for (let index = 0; index < chunkPrimitives.length; index++) {
      const primitive = chunkPrimitives[index]!;
      const isSpatialPrimitive = primitive.spatialRangeEligible === true;
      if (!isSpatialPrimitive) {
        if (rangeKind === "spatial") flushRange(index);
        if (rangeStart < 0) {
          rangeStart = index;
          rangeKind = "sequence";
        }
        if (rangeKind !== "sequence") {
          flushRange(index);
          rangeStart = index;
          rangeKind = "sequence";
        }
        const primitiveTriangleCount = primitive.kind === "line" ? 0 : primitive.vertices.length / 6;
        if (rangeTriangleCount + primitiveTriangleCount > MAX_FILL_TRIANGLES_PER_CHUNK && index > rangeStart) {
          flushRange(index);
          rangeStart = index;
          rangeKind = "sequence";
        }
        rangeTriangleCount += primitiveTriangleCount;
        if (index + 1 - rangeStart >= MAX_SEGMENTS_PER_CHUNK) flushRange(index + 1);
        continue;
      }

      if (rangeKind === "sequence") flushRange(index);
      let primitiveMinX = Infinity, primitiveMinY = Infinity;
      let primitiveMaxX = -Infinity, primitiveMaxY = -Infinity;
      if (primitive.kind === "line") {
        const padding = Math.max(0, primitive.lineweightMm ?? 0) / 2;
        primitiveMinX = Math.min(primitive.x0, primitive.x1) - padding;
        primitiveMinY = Math.min(primitive.y0, primitive.y1) - padding;
        primitiveMaxX = Math.max(primitive.x0, primitive.x1) + padding;
        primitiveMaxY = Math.max(primitive.y0, primitive.y1) + padding;
      } else {
        for (let vertex = 0; vertex < primitive.vertices.length; vertex += 2) {
          primitiveMinX = Math.min(primitiveMinX, primitive.vertices[vertex]!);
          primitiveMinY = Math.min(primitiveMinY, primitive.vertices[vertex + 1]!);
          primitiveMaxX = Math.max(primitiveMaxX, primitive.vertices[vertex]!);
          primitiveMaxY = Math.max(primitiveMaxY, primitive.vertices[vertex + 1]!);
        }
      }
      const candidateMinX = Math.min(rangeMinX, primitiveMinX);
      const candidateMinY = Math.min(rangeMinY, primitiveMinY);
      const candidateMaxX = Math.max(rangeMaxX, primitiveMaxX);
      const candidateMaxY = Math.max(rangeMaxY, primitiveMaxY);
      const candidateSpan = Math.max(candidateMaxX - candidateMinX, candidateMaxY - candidateMinY);
      const primitiveTriangleCount = primitive.kind === "line" ? 0 : primitive.vertices.length / 6;
      if (rangeKind === "spatial" &&
          (index - rangeStart >= MAX_SEGMENTS_PER_CHUNK ||
            candidateSpan > MAX_CHUNK_SPAN_WORLD ||
            rangeTriangleCount + primitiveTriangleCount > MAX_FILL_TRIANGLES_PER_CHUNK)) {
        flushRange(index);
      }
      if (rangeStart < 0) {
        rangeStart = index;
        rangeKind = "spatial";
      }
      rangeMinX = Math.min(rangeMinX, primitiveMinX);
      rangeMinY = Math.min(rangeMinY, primitiveMinY);
      rangeMaxX = Math.max(rangeMaxX, primitiveMaxX);
      rangeMaxY = Math.max(rangeMaxY, primitiveMaxY);
      rangeTriangleCount += primitiveTriangleCount;
      if (Math.max(rangeMaxX - rangeMinX, rangeMaxY - rangeMinY) > MAX_CHUNK_SPAN_WORLD) {
        // An over-limit source primitive is retained whole and marked PARTIAL.
        if (primitive.kind === "line") markSpatialLimit(primitive);
        else fillSpatialPartitionLimitReached = true;
        flushRange(index + 1);
      }
    }
    flushRange(chunkPrimitives.length);
    if (ranges.length === 0) ranges.push({ startIdx: 0, endIdx: 0 });
    return ranges;
  };

  let chunkRanges = buildChunkRanges();
  if (painterDepthSpatialPackingApplied && painterSpatialItems) {
    const packedRanges = chunkRanges;
    painterSpatialItems.sort((left, right) => left.sourceSequence - right.sourceSequence);
    chunkPrimitives.length = 0;
    for (const item of painterSpatialItems) {
      if (item.wasSpatialRangeEligible) item.primitive.spatialRangeEligible = true;
      else delete item.primitive.spatialRangeEligible;
      chunkPrimitives.push(item.primitive);
    }
    const sourceOrderRanges = buildChunkRanges();
    if (packedRanges.length < sourceOrderRanges.length) {
      painterSpatialItems.sort((left, right) => left.tileY - right.tileY || left.tileX - right.tileX ||
        left.sourceOrder - right.sourceOrder || left.sourceSequence - right.sourceSequence);
      chunkPrimitives.length = 0;
      for (const item of painterSpatialItems) {
        item.primitive.spatialRangeEligible = true;
        chunkPrimitives.push(item.primitive);
      }
      chunkRanges = packedRanges;
    } else {
      painterDepthSpatialPackingApplied = false;
      chunkRanges = sourceOrderRanges;
    }
  }
  painterSpatialItems = null;
  reportProfile?.({
    phase: "partition-complete",
    partitionedPrimitiveCount: chunkPrimitives.length,
    partitionRangeCount: chunkRanges.length,
    painterDepthSpatialPackingApplied,
  });
  const manifestChunks: Array<{
    chunkId: string;
    byteLength: number;
    renderableVertexCount: number;
    sha256: string;
    layoutId: string;
    bbox: CadBBox2D;
    maxQuantizationErrorWorld: number;
    maxQuantizationErrorCssPixels?: number;
    maxHatchFillBoundaryTessellationErrorWorld: number;
    maxHatchFillBoundaryTessellationErrorCssPixels?: number;
    maxHatchFillTriangleQuantizationErrorWorld: number;
    maxHatchFillTriangleQuantizationErrorCssPixels?: number;
    maxHatchFillEncodedGeometryErrorWorld: number;
    maxHatchFillEncodedGeometryErrorCssPixels?: number;
    maxPathDistanceQuantizationErrorWorld: number;
    maxPathDistanceQuantizationErrorCssPixels?: number;
    maxCurveSourceQuantizationErrorWorld: number;
    maxCurveSourceQuantizationErrorCssPixels?: number;
    maxCircularCurveTessellationErrorWorld: number;
    maxCircularCurveTessellationErrorCssPixels?: number;
    maxEllipseCurveTessellationErrorWorld: number;
    maxEllipseCurveTessellationErrorCssPixels?: number;
    maxSplineCurveTessellationErrorWorld: number;
    maxSplineCurveTessellationErrorCssPixels?: number;
    maxBulgeCurveTessellationErrorWorld: number;
    maxBulgeCurveTessellationErrorCssPixels?: number;
    maxCurveEncodedGeometryErrorWorld: number;
    maxCurveEncodedGeometryErrorCssPixels?: number;
    maxAdjacentChunkCompositeErrorWorld: number;
    maxAdjacentChunkCompositeErrorCssPixels?: number;
    maxFillGlyphCompositeErrorWorld: number;
    maxFillGlyphCompositeErrorCssPixels?: number;
  }> = [];
  const fillGlyphErrorPartsByChunk: Array<{
    chunkIndex: number;
    layoutId: string;
    fillBounds: CadBBox2D;
    glyphBounds: CadBBox2D;
    maxFillEncodedBoundWorld: number;
    maxGlyphEncodedBoundWorld: number;
  }> = [];
  const chunksMap = new Map<string, Uint8Array>();
  let encodedChunkBytes = 0;

  for (let cIdx = 0; cIdx < chunkRanges.length; cIdx++) {
    const { startIdx, endIdx } = chunkRanges[cIdx]!;

    let chunkMinX = Infinity;
    let chunkMinY = Infinity;
    let chunkMaxX = -Infinity;
    let chunkMaxY = -Infinity;
    let chunkStrokePadding = 0;
    let maxHatchFillBoundaryTessellationErrorWorld = 0;
    let maxHatchFillTriangleQuantizationErrorWorld = 0;
    let maxHatchFillEncodedGeometryErrorWorld = 0;
    let maxCircularCurveTessellationErrorWorld = 0;
    let maxEllipseCurveTessellationErrorWorld = 0;
    let maxSplineCurveTessellationErrorWorld = 0;
    let maxBulgeCurveTessellationErrorWorld = 0;
    let maxCurveEncodedGeometryErrorWorld = 0;
    let maxFillEncodedBoundWorld = 0;
    let maxGlyphEncodedBoundWorld = 0;
    const fillBounds: CadBBox2D = [Infinity, Infinity, -Infinity, -Infinity];
    const glyphBounds: CadBBox2D = [Infinity, Infinity, -Infinity, -Infinity];
    for (let pIdx = startIdx; pIdx < endIdx; pIdx++) {
      const primitive = chunkPrimitives[pIdx];
      if (primitive.kind === "line") {
        if (Number.isFinite(primitive.circularCurveTessellationErrorWorld)) {
          maxCircularCurveTessellationErrorWorld = Math.max(
            maxCircularCurveTessellationErrorWorld,
            primitive.circularCurveTessellationErrorWorld!,
          );
        }
        if (Number.isFinite(primitive.ellipseCurveTessellationErrorWorld)) {
          maxEllipseCurveTessellationErrorWorld = Math.max(
            maxEllipseCurveTessellationErrorWorld,
            primitive.ellipseCurveTessellationErrorWorld!,
          );
        }
        if (Number.isFinite(primitive.splineCurveTessellationErrorWorld)) {
          maxSplineCurveTessellationErrorWorld = Math.max(
            maxSplineCurveTessellationErrorWorld,
            primitive.splineCurveTessellationErrorWorld!,
          );
        }
        if (Number.isFinite(primitive.bulgeCurveTessellationErrorWorld)) {
          maxBulgeCurveTessellationErrorWorld = Math.max(
            maxBulgeCurveTessellationErrorWorld,
            primitive.bulgeCurveTessellationErrorWorld!,
          );
        }
        if (Number.isFinite(primitive.lineweightMm) && primitive.lineweightMm! > 0) {
          chunkStrokePadding = Math.max(chunkStrokePadding, primitive.lineweightMm! / 2);
        }
        chunkMinX = Math.min(chunkMinX, primitive.x0, primitive.x1);
        chunkMinY = Math.min(chunkMinY, primitive.y0, primitive.y1);
        chunkMaxX = Math.max(chunkMaxX, primitive.x0, primitive.x1);
        chunkMaxY = Math.max(chunkMaxY, primitive.y0, primitive.y1);
      } else {
        if (primitive.kind === "triangle" && Number.isFinite(primitive.hatchFillBoundaryTessellationErrorWorld)) {
          maxHatchFillBoundaryTessellationErrorWorld = Math.max(
            maxHatchFillBoundaryTessellationErrorWorld,
            primitive.hatchFillBoundaryTessellationErrorWorld!,
          );
        }
        for (let vertex = 0; vertex < primitive.vertices.length; vertex += 2) {
          chunkMinX = Math.min(chunkMinX, primitive.vertices[vertex]!);
          chunkMinY = Math.min(chunkMinY, primitive.vertices[vertex + 1]!);
          chunkMaxX = Math.max(chunkMaxX, primitive.vertices[vertex]!);
          chunkMaxY = Math.max(chunkMaxY, primitive.vertices[vertex + 1]!);
        }
      }
    }
    const chunkOriginX = Number.isFinite(chunkMinX) ? (chunkMinX + chunkMaxX) / 2 : Ox;
    const chunkOriginY = Number.isFinite(chunkMinY) ? (chunkMinY + chunkMaxY) / 2 : Oy;
    const chunkBBox: CadBBox2D = Number.isFinite(chunkMinX)
      ? [
          chunkMinX - chunkStrokePadding,
          chunkMinY - chunkStrokePadding,
          chunkMaxX + chunkStrokePadding,
          chunkMaxY + chunkStrokePadding,
        ]
      : [chunkOriginX, chunkOriginY, chunkOriginX, chunkOriginY];

    let lineVertCount = 0;
    let triVertCount = 0;
    for (let pIdx = startIdx; pIdx < endIdx; pIdx++) {
      const p = chunkPrimitives[pIdx]!;
      if (p.kind === "line") {
        lineVertCount += 2;
      } else {
        triVertCount += p.vertices.length / 2;
      }
    }

    const xyArray = new Float32Array(lineVertCount * 2);
    const pathDistancesArray = new Float32Array(lineVertCount);
    const trianglesArray = new Float32Array(triVertCount * 2);
    let maxQuantizationErrorSquared = 0;
    let maxPathDistanceQuantizationErrorWorld = 0;
    const curveDataValues: number[] = [];
    const curveSourceRefs: Array<{
      curveId: string;
      sourceHandle: string;
      sourceType: "CIRCLE" | "ARC" | "ELLIPSE" | "BULGE" | "SPLINE";
      firstSegmentIndex: number;
      segmentCount: number;
      curveRecordIndex: number;
      firstVertex: number;
      vertexCount: number;
      sourceQuantizationErrorWorld?: number;
      splineSource?: RationalBezierSource;
    }> = [];

    interface RawDrawCommand {
      kind: "line" | "triangle" | "wipeout";
      layer: string;
      color: [number, number, number];
      firstVertex: number;
      vertexCount: number;
      order: number;
      /** Stable compact painter-order rank consumed by renderer batching and fallback sorting. */
      globalOrderIndex: number;
      /** Inclusive compact painter-order rank at the end of this merged command. */
    globalOrderEndIndex: number;
      alpha?: number;
      isAci7?: boolean;
      lineweightMm?: number;
      pathDistanceRequired?: boolean;
      dashStyle?: { dashSize: number; gapSize: number; pattern?: number[] };
      hatchSourceId?: string;
    }

    const drawCommands: RawDrawCommand[] = [];
    const hatchFillSources: Array<{ sourceId: string; source: RuntimeHatchFillSource }> = [];
    const retainedHatchSourceIds = new Set<string>();
    let retainedHatchSourceBytes = 0;
    let currentCmd: RawDrawCommand | null = null;
    let lineVertexOffset = 0;
    let triVertexOffset = 0;

    for (let pIdx = startIdx; pIdx < endIdx; pIdx++) {
      const prim = chunkPrimitives[pIdx];
      if (prim.kind === "line") {
        const vIdx = lineVertexOffset;
        const idx = vIdx * 2;
        const localX0 = Math.fround(prim.x0 - chunkOriginX);
        const localY0 = Math.fround(prim.y0 - chunkOriginY);
        const localX1 = Math.fround(prim.x1 - chunkOriginX);
        const localY1 = Math.fround(prim.y1 - chunkOriginY);
        maxQuantizationErrorSquared = Math.max(
          maxQuantizationErrorSquared,
          (prim.x0 - (chunkOriginX + localX0)) ** 2 + (prim.y0 - (chunkOriginY + localY0)) ** 2,
          (prim.x1 - (chunkOriginX + localX1)) ** 2 + (prim.y1 - (chunkOriginY + localY1)) ** 2,
        );
        const endpointQuantizationErrorSquared = Math.max(
          (prim.x0 - (chunkOriginX + localX0)) ** 2 + (prim.y0 - (chunkOriginY + localY0)) ** 2,
          (prim.x1 - (chunkOriginX + localX1)) ** 2 + (prim.y1 - (chunkOriginY + localY1)) ** 2,
        );
        if (prim.isGlyphStroke) {
          maxGlyphEncodedBoundWorld = Math.max(maxGlyphEncodedBoundWorld, Math.sqrt(endpointQuantizationErrorSquared));
          const padding = Math.max(0, prim.lineweightMm ?? 0) / 2;
          glyphBounds[0] = Math.min(glyphBounds[0], prim.x0 - padding, prim.x1 - padding);
          glyphBounds[1] = Math.min(glyphBounds[1], prim.y0 - padding, prim.y1 - padding);
          glyphBounds[2] = Math.max(glyphBounds[2], prim.x0 + padding, prim.x1 + padding);
          glyphBounds[3] = Math.max(glyphBounds[3], prim.y0 + padding, prim.y1 + padding);
        }
        const primitiveCurveSagittaWorld = Math.max(
          Number.isFinite(prim.circularCurveTessellationErrorWorld) ? prim.circularCurveTessellationErrorWorld! : 0,
          Number.isFinite(prim.ellipseCurveTessellationErrorWorld) ? prim.ellipseCurveTessellationErrorWorld! : 0,
          Number.isFinite(prim.splineCurveTessellationErrorWorld) ? prim.splineCurveTessellationErrorWorld! : 0,
          Number.isFinite(prim.bulgeCurveTessellationErrorWorld) ? prim.bulgeCurveTessellationErrorWorld! : 0,
          Number.isFinite(prim.hatchBoundaryTessellationErrorWorld) ? prim.hatchBoundaryTessellationErrorWorld! : 0,
        );
        if (primitiveCurveSagittaWorld > 0) {
          maxCurveEncodedGeometryErrorWorld = Math.max(
            maxCurveEncodedGeometryErrorWorld,
            primitiveCurveSagittaWorld + Math.sqrt(endpointQuantizationErrorSquared),
          );
        }
        xyArray[idx] = localX0;
        xyArray[idx + 1] = localY0;
        xyArray[idx + 2] = localX1;
        xyArray[idx + 3] = localY1;
        const pathDistance0 = prim.pathDistance0 ?? 0;
        const pathDistance1 = prim.pathDistance1 ?? Math.hypot(prim.x1 - prim.x0, prim.y1 - prim.y0);
        pathDistancesArray[vIdx] = pathDistance0;
        pathDistancesArray[vIdx + 1] = pathDistance1;
        maxPathDistanceQuantizationErrorWorld = Math.max(
          maxPathDistanceQuantizationErrorWorld,
          Math.abs(pathDistancesArray[vIdx]! - pathDistance0),
          Math.abs(pathDistancesArray[vIdx + 1]! - pathDistance1),
        );
        if (prim.curveSource) {
          const curve = prim.curveSource;
          const lastRef = curveSourceRefs[curveSourceRefs.length - 1];
          const lastDataIndex = curveDataValues.length - 8;
          const contiguousInterval = lastRef?.curveId === curve.curveId &&
            lastRef.firstVertex + lastRef.vertexCount === vIdx &&
            lastRef.firstSegmentIndex + lastRef.segmentCount === curve.segmentIndex &&
            Math.abs(curveDataValues[lastDataIndex + 7]! - curve.startParam) <= 1e-10;
          if (contiguousInterval) {
            curveDataValues[lastDataIndex + 7] = curve.endParam;
            lastRef.vertexCount += 2;
            lastRef.segmentCount += 1;
          } else {
            const curveRecordIndex = curveDataValues.length / 8;
            // Center is relative to the chunk origin just like XY; basis and parameter interval remain world-space.
            curveDataValues.push(
              curve.center[0] - chunkOriginX,
              curve.center[1] - chunkOriginY,
              curve.basisU[0],
              curve.basisU[1],
              curve.basisV[0],
              curve.basisV[1],
              curve.startParam,
              curve.endParam,
            );
            curveSourceRefs.push({
              curveId: curve.curveId,
              sourceHandle: curve.sourceHandle,
              sourceType: curve.sourceType,
              firstSegmentIndex: curve.segmentIndex,
              segmentCount: 1,
              curveRecordIndex,
              firstVertex: vIdx,
              vertexCount: 2,
              ...(curve.splineSource ? {
                splineSource: {
                  controlPoints: curve.splineSource.controlPoints.map((point) => [
                    point[0] - chunkOriginX,
                    point[1] - chunkOriginY,
                  ] as [number, number]),
                  weights: curve.splineSource.weights,
                },
              } : {}),
            });
          }
        }
        lineVertexOffset += 2;

        const isAci7 = prim.isAci7 === true;
        const primLw = prim.lineweightMm ?? 0;
        const sourceOrderIndex = prim.globalOrderIndex ?? pIdx;
        const globalOrderIndex = getEncodedPainterOrderIndex(sourceOrderIndex);
        if (
          currentCmd &&
          currentCmd.kind === "line" &&
          currentCmd.globalOrderIndex === globalOrderIndex &&
          currentCmd.globalOrderEndIndex === globalOrderIndex &&
          currentCmd.layer === prim.layer &&
          currentCmd.isAci7 === isAci7 &&
          Math.abs((currentCmd.lineweightMm ?? 0) - primLw) < 1e-4 &&
          Math.abs((currentCmd.alpha ?? 1) - (prim.alpha ?? 1)) < 1e-4 &&
          Math.abs(currentCmd.color[0] - prim.color[0]) < 1e-4 &&
          Math.abs(currentCmd.color[1] - prim.color[1]) < 1e-4 &&
          Math.abs(currentCmd.color[2] - prim.color[2]) < 1e-4 &&
          currentCmd.dashStyle?.dashSize === prim.dashStyle?.dashSize &&
          currentCmd.dashStyle?.gapSize === prim.dashStyle?.gapSize &&
          (currentCmd.pathDistanceRequired === true) === (prim.pathDistanceRequired === true) &&
          JSON.stringify(currentCmd.dashStyle?.pattern) === JSON.stringify(prim.dashStyle?.pattern)
        ) {
          currentCmd.vertexCount += 2;
        } else {
          currentCmd = {
            kind: "line",
            layer: prim.layer,
            color: prim.color,
            firstVertex: vIdx,
            vertexCount: 2,
            order: drawCommands.length,
            globalOrderIndex,
            globalOrderEndIndex: globalOrderIndex,
            alpha: prim.alpha ?? 1,
            isAci7,
            lineweightMm: primLw,
            ...(prim.pathDistanceRequired ? { pathDistanceRequired: true } : {}),
            ...(prim.dashStyle ? { dashStyle: prim.dashStyle } : {}),
          };
          drawCommands.push(currentCmd);
        }
      } else {
        const vCount = prim.vertices.length / 2;
        const vIdx = triVertexOffset;
        let hatchTriangleQuantizationErrorSquared = 0;
        let fillTriangleQuantizationErrorSquared = 0;
        for (let i = 0; i < prim.vertices.length; i += 2) {
          const worldX = prim.vertices[i]!;
          const worldY = prim.vertices[i + 1]!;
          const localX = Math.fround(worldX - chunkOriginX);
          const localY = Math.fround(worldY - chunkOriginY);
          const quantizationErrorSquared =
            (worldX - (chunkOriginX + localX)) ** 2 + (worldY - (chunkOriginY + localY)) ** 2;
          maxQuantizationErrorSquared = Math.max(maxQuantizationErrorSquared, quantizationErrorSquared);
          fillTriangleQuantizationErrorSquared = Math.max(fillTriangleQuantizationErrorSquared, quantizationErrorSquared);
          fillBounds[0] = Math.min(fillBounds[0], worldX);
          fillBounds[1] = Math.min(fillBounds[1], worldY);
          fillBounds[2] = Math.max(fillBounds[2], worldX);
          fillBounds[3] = Math.max(fillBounds[3], worldY);
          if (prim.kind === "triangle" && Number.isFinite(prim.hatchFillBoundaryTessellationErrorWorld)) {
            hatchTriangleQuantizationErrorSquared = Math.max(hatchTriangleQuantizationErrorSquared, quantizationErrorSquared);
          }
          trianglesArray[vIdx * 2 + i] = localX;
          trianglesArray[vIdx * 2 + i + 1] = localY;
        }
        maxFillEncodedBoundWorld = Math.max(maxFillEncodedBoundWorld,
          Math.sqrt(fillTriangleQuantizationErrorSquared) + (prim.hatchFillBoundaryTessellationErrorWorld ?? 0));
        if (prim.kind === "triangle" && Number.isFinite(prim.hatchFillBoundaryTessellationErrorWorld)) {
          const hatchTriangleQuantizationErrorWorld = Math.sqrt(hatchTriangleQuantizationErrorSquared);
          maxHatchFillTriangleQuantizationErrorWorld = Math.max(
            maxHatchFillTriangleQuantizationErrorWorld,
            hatchTriangleQuantizationErrorWorld,
          );
          maxHatchFillEncodedGeometryErrorWorld = Math.max(
            maxHatchFillEncodedGeometryErrorWorld,
            prim.hatchFillBoundaryTessellationErrorWorld! + hatchTriangleQuantizationErrorWorld,
          );
        }
        triVertexOffset += vCount;

        const isWipeout = prim.isWipeout === true;
        const kind = isWipeout ? "wipeout" : "triangle";
        const isAci7 = prim.isAci7 === true;
        const sourceOrderIndex = prim.globalOrderIndex ?? pIdx;
        const globalOrderIndex = getEncodedPainterOrderIndex(sourceOrderIndex);
        const hatchSourceId = !isWipeout && prim.hatchFillSource
          ? `hatch:${prim.hatchFillSource.handle}:${String(prim.hatchFillSource.order)}`
          : undefined;

        if (
          !isWipeout &&
          currentCmd &&
          currentCmd.kind === "triangle" &&
          currentCmd.globalOrderIndex === globalOrderIndex &&
          currentCmd.globalOrderEndIndex === globalOrderIndex &&
          currentCmd.hatchSourceId === hatchSourceId &&
          currentCmd.layer === prim.layer &&
          currentCmd.isAci7 === isAci7 &&
          Math.abs((currentCmd.alpha ?? 1) - (prim.alpha ?? 1)) < 1e-4 &&
          Math.abs(currentCmd.color[0] - prim.color[0]) < 1e-4 &&
          Math.abs(currentCmd.color[1] - prim.color[1]) < 1e-4 &&
          Math.abs(currentCmd.color[2] - prim.color[2]) < 1e-4
        ) {
          currentCmd.vertexCount += vCount;
        } else {
          currentCmd = {
            kind,
            layer: prim.layer,
            color: prim.color,
            firstVertex: vIdx,
            vertexCount: vCount,
            order: drawCommands.length,
            globalOrderIndex,
            globalOrderEndIndex: globalOrderIndex,
            alpha: prim.alpha ?? 1,
            isAci7,
            ...(hatchSourceId ? { hatchSourceId } : {}),
          };
          drawCommands.push(currentCmd);
        }
        if (hatchSourceId && !retainedHatchSourceIds.has(hatchSourceId)) {
          try {
            const sourceJson = JSON.stringify(prim.hatchFillSource);
            const sourceBytes = new TextEncoder().encode(sourceJson).byteLength;
            if (sourceBytes <= 128 * 1024 && retainedHatchSourceBytes + sourceBytes <= 512 * 1024) {
              retainedHatchSourceIds.add(hatchSourceId);
              retainedHatchSourceBytes += sourceBytes;
              hatchFillSources.push({ sourceId: hatchSourceId, source: prim.hatchFillSource! });
            } else {
              // The fallback mesh remains drawable; a source too large for bounded metadata is not advertised.
              currentCmd.hatchSourceId = undefined;
            }
          } catch {
            currentCmd.hatchSourceId = undefined;
          }
        }
      }
    }

    const curveDataArray = new Float32Array(curveDataValues);
    let maxCurveSourceQuantizationErrorWorld = 0;
    for (const curveRef of curveSourceRefs) {
      const base = curveRef.curveRecordIndex * 8;
      let sourceErrorBound = 0;
      if (curveRef.sourceType !== "SPLINE") {
        const centerError = Math.hypot(
          curveDataArray[base]! - curveDataValues[base]!,
          curveDataArray[base + 1]! - curveDataValues[base + 1]!,
        );
        const basisUError = Math.hypot(
          curveDataArray[base + 2]! - curveDataValues[base + 2]!,
          curveDataArray[base + 3]! - curveDataValues[base + 3]!,
        );
        const basisVError = Math.hypot(
          curveDataArray[base + 4]! - curveDataValues[base + 4]!,
          curveDataArray[base + 5]! - curveDataValues[base + 5]!,
        );
        const maxParameterError = Math.max(
          Math.abs(curveDataArray[base + 6]! - curveDataValues[base + 6]!),
          Math.abs(curveDataArray[base + 7]! - curveDataValues[base + 7]!),
        );
        const basisDerivativeBound = Math.hypot(curveDataValues[base + 2]!, curveDataValues[base + 3]!) +
          Math.hypot(curveDataValues[base + 4]!, curveDataValues[base + 5]!);
        const rawBound = centerError + basisUError + basisVError + basisDerivativeBound * maxParameterError;
        // Yukarı yuvarlama payı, toplam sınırın kayan nokta toplamasında küçülmesini önler.
        sourceErrorBound = rawBound + Math.max(1, rawBound) * 32 * Number.EPSILON;
      }
      curveRef.sourceQuantizationErrorWorld = sourceErrorBound;
      maxCurveSourceQuantizationErrorWorld = Math.max(maxCurveSourceQuantizationErrorWorld, sourceErrorBound);
    }

    const layerRuns = drawCommands
      .filter((c) => c.kind === "line")
      .map((c) => ({
        layer: c.layer,
        color: c.color,
        firstVertex: c.firstVertex,
        vertexCount: c.vertexCount,
        isAci7: c.isAci7,
        alpha: c.alpha,
        lineweightMm: c.lineweightMm,
      }));

    const triangleRuns = drawCommands
      .filter((c) => c.kind !== "line")
      .map((c) => ({
        layer: c.layer,
        color: c.color,
        firstVertex: c.firstVertex,
        vertexCount: c.vertexCount,
        isWipeout: c.kind === "wipeout",
        alpha: c.alpha,
        isAci7: c.isAci7,
      }));

    const originArray = new Float64Array([chunkOriginX, chunkOriginY]);
    const metaData = new TextEncoder().encode(
      JSON.stringify({
        layoutId,
        chunkIndex: cIdx,
        globalOrderMax,
        primitiveCount: endIdx - startIdx,
        layerIds: Object.keys(doc.layers || {}),
        layerRuns,
        triangleRuns,
        drawCommands,
        ...(hatchFillSources.length > 0 ? { hatchFillSourceVersion: 1, hatchFillSources } : {}),
        curveSourceVersion: curveSourceRefs.length > 0 ? 3 : undefined,
        curveSourceRefs: curveSourceRefs.length > 0 ? curveSourceRefs : undefined,
      })
    );

    const drawRunsEntries: number[] = [];
    if (lineVertCount > 0) {
      drawRunsEntries.push(
        DrawPrimitiveKind.STROKE_PATH,
        0,
        lineVertCount,
        UINT32_MAX,
        0,
        0,
        UINT32_MAX,
        0
      );
    }

    if (triVertCount > 0) {
      drawRunsEntries.push(
        DrawPrimitiveKind.TRIANGLES,
        0,
        triVertCount,
        UINT32_MAX,
        0,
        0,
        UINT32_MAX,
        1
      );
    }
    if (drawRunsEntries.length === 0) {
      drawRunsEntries.push(DrawPrimitiveKind.STROKE_PATH, 0, 0, UINT32_MAX, 0, 0, UINT32_MAX, 0);
    }

    const drawRunsArray = new Uint32Array(drawRunsEntries);

    const chunkSections: Array<{
      tag: SceneTag;
      scalarType: SceneScalarType;
      componentCount: number;
      elementCount: number;
      data: ArrayBufferView;
    }> = [
      {
        tag: SceneTag.META,
        scalarType: SceneScalarType.U8,
        componentCount: 1,
        elementCount: metaData.length,
        data: metaData,
      },
      {
        tag: SceneTag.ORIGIN,
        scalarType: SceneScalarType.F64,
        componentCount: 2,
        elementCount: 1,
        data: originArray,
      },
      {
        tag: SceneTag.XY,
        scalarType: SceneScalarType.F32,
        componentCount: 2,
        elementCount: lineVertCount,
        data: xyArray,
      },
      {
        tag: SceneTag.DRAW_RUNS,
        scalarType: SceneScalarType.U32,
        componentCount: 8,
        elementCount: drawRunsEntries.length / 8,
        data: drawRunsArray,
      },
    ];

    if (lineVertCount > 0) {
      chunkSections.push({
        tag: SceneTag.PATH_DISTANCE,
        scalarType: SceneScalarType.F32,
        componentCount: 1,
        elementCount: lineVertCount,
        data: pathDistancesArray,
      });
    }

    if (curveDataValues.length > 0) {
      chunkSections.push({
        tag: SceneTag.CURVE_DATA,
        scalarType: SceneScalarType.F32,
        componentCount: 8,
        elementCount: curveDataValues.length / 8,
        data: curveDataArray,
      });
    }

    if (triVertCount > 0) {
      chunkSections.push({
        tag: SceneTag.TRIANGLES,
        scalarType: SceneScalarType.F32,
        componentCount: 2,
        elementCount: triVertCount,
        data: trianglesArray,
      });
    }

    chunkSections.sort((a, b) => a.tag - b.tag);

    let estimatedChunkByteLength = Math.ceil((32 + chunkSections.length * 32) / 8) * 8;
    for (const section of chunkSections) {
      estimatedChunkByteLength = Math.ceil((estimatedChunkByteLength + section.data.byteLength) / 8) * 8;
    }
    if (estimatedChunkByteLength > MAX_CHUNK_BYTE_LENGTH) {
      if (endIdx - startIdx <= 1) {
        throw new RangeError(`Unsplittable scene primitive exceeds the ${MAX_CHUNK_BYTE_LENGTH}-byte chunk limit`);
      }
      const midpoint = startIdx + Math.floor((endIdx - startIdx) / 2);
      chunkRanges.splice(cIdx, 1,
        { startIdx, endIdx: midpoint },
        { startIdx: midpoint, endIdx },
      );
      cIdx--;
      continue;
    }
    const chunkBytes = buildSceneChunk(chunkSections);
    if (chunkBytes.byteLength > MAX_CHUNK_BYTE_LENGTH) {
      throw new RangeError("Encoded scene chunk exceeded the byte estimate and transport limit");
    }

    const chunkHash = crypto.createHash("sha256").update(chunkBytes).digest("hex");
    const chunkId = `chunk_${layoutToken}_${String(cIdx + 1).padStart(3, "0")}`;

    const maxQuantizationErrorWorld = Math.sqrt(maxQuantizationErrorSquared);
    const maxFillGlyphCompositeErrorWorld =
      fillBounds[0] <= glyphBounds[2] && glyphBounds[0] <= fillBounds[2] &&
      fillBounds[1] <= glyphBounds[3] && glyphBounds[1] <= fillBounds[3]
        ? maxFillEncodedBoundWorld + maxGlyphEncodedBoundWorld : 0;
    const maxFillGlyphCompositeErrorCssPixels = hasScreenBudget
      ? maxFillGlyphCompositeErrorWorld * options!.maxTransformSingularValue! / options!.unitsPerCssPixel!
      : undefined;
    const maxQuantizationErrorCssPixels = hasScreenBudget
      ? maxQuantizationErrorWorld * options!.maxTransformSingularValue! / options!.unitsPerCssPixel!
      : undefined;
    const maxHatchFillBoundaryTessellationErrorCssPixels = hasScreenBudget
      ? maxHatchFillBoundaryTessellationErrorWorld * options!.maxTransformSingularValue! / options!.unitsPerCssPixel!
      : undefined;
    const maxHatchFillTriangleQuantizationErrorCssPixels = hasScreenBudget
      ? maxHatchFillTriangleQuantizationErrorWorld * options!.maxTransformSingularValue! / options!.unitsPerCssPixel!
      : undefined;
    const maxHatchFillEncodedGeometryErrorCssPixels = hasScreenBudget
      ? maxHatchFillEncodedGeometryErrorWorld * options!.maxTransformSingularValue! / options!.unitsPerCssPixel!
      : undefined;
    const maxPathDistanceQuantizationErrorCssPixels = hasScreenBudget
      ? maxPathDistanceQuantizationErrorWorld * options!.maxTransformSingularValue! / options!.unitsPerCssPixel!
      : undefined;
    const maxCurveSourceQuantizationErrorCssPixels = hasScreenBudget
      ? maxCurveSourceQuantizationErrorWorld * options!.maxTransformSingularValue! / options!.unitsPerCssPixel!
      : undefined;
    const maxCircularCurveTessellationErrorCssPixels = hasScreenBudget
      ? maxCircularCurveTessellationErrorWorld * options!.maxTransformSingularValue! / options!.unitsPerCssPixel!
      : undefined;
    const maxEllipseCurveTessellationErrorCssPixels = hasScreenBudget
      ? maxEllipseCurveTessellationErrorWorld * options!.maxTransformSingularValue! / options!.unitsPerCssPixel!
      : undefined;
    const maxSplineCurveTessellationErrorCssPixels = hasScreenBudget
      ? maxSplineCurveTessellationErrorWorld * options!.maxTransformSingularValue! / options!.unitsPerCssPixel!
      : undefined;
    const maxBulgeCurveTessellationErrorCssPixels = hasScreenBudget
      ? maxBulgeCurveTessellationErrorWorld * options!.maxTransformSingularValue! / options!.unitsPerCssPixel!
      : undefined;
    const maxCurveEncodedGeometryErrorCssPixels = hasScreenBudget
      ? maxCurveEncodedGeometryErrorWorld * options!.maxTransformSingularValue! / options!.unitsPerCssPixel!
      : undefined;

    chunksMap.set(chunkId, chunkBytes);
    encodedChunkBytes += chunkBytes.byteLength;
    manifestChunks.push({
      chunkId,
      byteLength: chunkBytes.byteLength,
      renderableVertexCount: lineVertCount + triVertCount,
      sha256: chunkHash,
      layoutId,
      bbox: chunkBBox,
      maxQuantizationErrorWorld,
      ...(maxQuantizationErrorCssPixels === undefined ? {} : { maxQuantizationErrorCssPixels }),
      maxHatchFillBoundaryTessellationErrorWorld,
      ...(maxHatchFillBoundaryTessellationErrorCssPixels === undefined ? {} : { maxHatchFillBoundaryTessellationErrorCssPixels }),
      maxHatchFillTriangleQuantizationErrorWorld,
      ...(maxHatchFillTriangleQuantizationErrorCssPixels === undefined ? {} : { maxHatchFillTriangleQuantizationErrorCssPixels }),
      maxHatchFillEncodedGeometryErrorWorld,
      ...(maxHatchFillEncodedGeometryErrorCssPixels === undefined ? {} : { maxHatchFillEncodedGeometryErrorCssPixels }),
      maxPathDistanceQuantizationErrorWorld,
      ...(maxPathDistanceQuantizationErrorCssPixels === undefined ? {} : { maxPathDistanceQuantizationErrorCssPixels }),
      maxCurveSourceQuantizationErrorWorld,
      ...(maxCurveSourceQuantizationErrorCssPixels === undefined ? {} : { maxCurveSourceQuantizationErrorCssPixels }),
      maxCircularCurveTessellationErrorWorld,
      ...(maxCircularCurveTessellationErrorCssPixels === undefined ? {} : { maxCircularCurveTessellationErrorCssPixels }),
      maxEllipseCurveTessellationErrorWorld,
      ...(maxEllipseCurveTessellationErrorCssPixels === undefined ? {} : { maxEllipseCurveTessellationErrorCssPixels }),
      maxSplineCurveTessellationErrorWorld,
      ...(maxSplineCurveTessellationErrorCssPixels === undefined ? {} : { maxSplineCurveTessellationErrorCssPixels }),
      maxBulgeCurveTessellationErrorWorld,
      ...(maxBulgeCurveTessellationErrorCssPixels === undefined ? {} : { maxBulgeCurveTessellationErrorCssPixels }),
      maxCurveEncodedGeometryErrorWorld,
      ...(maxCurveEncodedGeometryErrorCssPixels === undefined ? {} : { maxCurveEncodedGeometryErrorCssPixels }),
      maxAdjacentChunkCompositeErrorWorld: 0,
      ...(hasScreenBudget ? { maxAdjacentChunkCompositeErrorCssPixels: 0 } : {}),
      maxFillGlyphCompositeErrorWorld,
      ...(maxFillGlyphCompositeErrorCssPixels === undefined ? {} : { maxFillGlyphCompositeErrorCssPixels }),
    });
    fillGlyphErrorPartsByChunk.push({
      chunkIndex: manifestChunks.length - 1,
      layoutId,
      fillBounds: [fillBounds[0], fillBounds[1], fillBounds[2], fillBounds[3]],
      glyphBounds: [glyphBounds[0], glyphBounds[1], glyphBounds[2], glyphBounds[3]],
      maxFillEncodedBoundWorld,
      maxGlyphEncodedBoundWorld,
    });

    // Bellek tasarrufu: İşlenen parçanın primitif referanslarını serbest bırak
    for (let pIdx = startIdx; pIdx < endIdx; pIdx++) {
      (chunkPrimitives as any)[pIdx] = null;
    }
  }

  reportProfile?.({
    phase: "chunk-encoding-complete",
    encodedChunkCount: chunksMap.size,
    encodedChunkBytes,
  });

  // Fill triangles and glyph strokes can be emitted into different painter
  // chunks even when their source bounds overlap. Bound those independent
  // encodings across the whole layout, with a conservative fallback when a
  // pathological scene would require too many pair checks.
  const MAX_FILL_GLYPH_COMPOSITE_PAIR_CHECKS = 16_384;
  const fillPartsForComposite = fillGlyphErrorPartsByChunk.filter((part) => part.fillBounds.every(Number.isFinite));
  const glyphPartsForComposite = fillGlyphErrorPartsByChunk.filter((part) => part.glyphBounds.every(Number.isFinite));
  let fillGlyphCompositeAnalysisLimitReached = false;
  let fillGlyphCompositePairChecks = 0;
  let fillGlyphCompositePairCheckLimitHit = false;
  for (const fillPart of fillPartsForComposite) {
    for (const glyphPart of glyphPartsForComposite) {
      if (glyphPart.layoutId !== fillPart.layoutId || glyphPart.chunkIndex === fillPart.chunkIndex) continue;
      fillGlyphCompositePairChecks++;
      if (fillGlyphCompositePairChecks > MAX_FILL_GLYPH_COMPOSITE_PAIR_CHECKS) {
        fillGlyphCompositePairCheckLimitHit = true;
        break;
      }
      if (fillPart.fillBounds[0] > glyphPart.glyphBounds[2] ||
          glyphPart.glyphBounds[0] > fillPart.fillBounds[2] ||
          fillPart.fillBounds[1] > glyphPart.glyphBounds[3] ||
          glyphPart.glyphBounds[1] > fillPart.fillBounds[3]) continue;
      const pairBound = fillPart.maxFillEncodedBoundWorld + glyphPart.maxGlyphEncodedBoundWorld;
      const fillChunk = manifestChunks[fillPart.chunkIndex]!;
      const glyphChunk = manifestChunks[glyphPart.chunkIndex]!;
      fillChunk.maxFillGlyphCompositeErrorWorld = Math.max(fillChunk.maxFillGlyphCompositeErrorWorld, pairBound);
      glyphChunk.maxFillGlyphCompositeErrorWorld = Math.max(glyphChunk.maxFillGlyphCompositeErrorWorld, pairBound);
      if (hasScreenBudget) {
        const pairCss = pairBound * options!.maxTransformSingularValue! / options!.unitsPerCssPixel!;
        fillChunk.maxFillGlyphCompositeErrorCssPixels = Math.max(fillChunk.maxFillGlyphCompositeErrorCssPixels ?? 0, pairCss);
        glyphChunk.maxFillGlyphCompositeErrorCssPixels = Math.max(glyphChunk.maxFillGlyphCompositeErrorCssPixels ?? 0, pairCss);
      }
    }
    if (fillGlyphCompositePairCheckLimitHit) break;
  }
  if (fillGlyphCompositePairCheckLimitHit) {
    fillGlyphCompositeAnalysisLimitReached = true;
    const conservativeBoundsByLayout = new Map<string, { fill: number; glyph: number; hasFill: boolean; hasGlyph: boolean }>();
    for (const part of fillPartsForComposite) {
      const bounds = conservativeBoundsByLayout.get(part.layoutId) ?? { fill: 0, glyph: 0, hasFill: false, hasGlyph: false };
      bounds.fill = Math.max(bounds.fill, part.maxFillEncodedBoundWorld);
      bounds.hasFill = true;
      conservativeBoundsByLayout.set(part.layoutId, bounds);
    }
    for (const part of glyphPartsForComposite) {
      const bounds = conservativeBoundsByLayout.get(part.layoutId) ?? { fill: 0, glyph: 0, hasFill: false, hasGlyph: false };
      bounds.glyph = Math.max(bounds.glyph, part.maxGlyphEncodedBoundWorld);
      bounds.hasGlyph = true;
      conservativeBoundsByLayout.set(part.layoutId, bounds);
    }
    for (const part of fillGlyphErrorPartsByChunk) {
      const bounds = conservativeBoundsByLayout.get(part.layoutId)!;
      if (!bounds?.hasFill || !bounds.hasGlyph ||
          (!part.fillBounds.every(Number.isFinite) && !part.glyphBounds.every(Number.isFinite))) continue;
      const conservativeBound = bounds.fill + bounds.glyph;
      const chunk = manifestChunks[part.chunkIndex]!;
      chunk.maxFillGlyphCompositeErrorWorld = Math.max(chunk.maxFillGlyphCompositeErrorWorld, conservativeBound);
      if (hasScreenBudget) {
        const conservativeCss = conservativeBound * options!.maxTransformSingularValue! / options!.unitsPerCssPixel!;
        chunk.maxFillGlyphCompositeErrorCssPixels = Math.max(chunk.maxFillGlyphCompositeErrorCssPixels ?? 0, conservativeCss);
      }
    }
  }

  // A painter seam may contain two independently encoded chunks. Their visible
  // boundary displacement is bounded by the sum of each chunk's strongest
  // static geometry+encoding term, not by either maximum in isolation.
  const chunkStaticBound = (chunk: typeof manifestChunks[number]) => Math.max(
    chunk.maxQuantizationErrorWorld,
    chunk.maxHatchFillEncodedGeometryErrorWorld,
    chunk.maxCurveEncodedGeometryErrorWorld,
  );
  for (let index = 1; index < manifestChunks.length; index++) {
    const previous = manifestChunks[index - 1]!;
    const current = manifestChunks[index]!;
    if (previous.layoutId !== current.layoutId ||
        previous.bbox[0] > current.bbox[2] || current.bbox[0] > previous.bbox[2] ||
        previous.bbox[1] > current.bbox[3] || current.bbox[1] > previous.bbox[3]) continue;
    const pairBound = chunkStaticBound(previous) + chunkStaticBound(current);
    previous.maxAdjacentChunkCompositeErrorWorld = Math.max(previous.maxAdjacentChunkCompositeErrorWorld, pairBound);
    current.maxAdjacentChunkCompositeErrorWorld = Math.max(current.maxAdjacentChunkCompositeErrorWorld, pairBound);
    if (hasScreenBudget) {
      const pairCss = pairBound * options!.maxTransformSingularValue! / options!.unitsPerCssPixel!;
      previous.maxAdjacentChunkCompositeErrorCssPixels = Math.max(previous.maxAdjacentChunkCompositeErrorCssPixels ?? 0, pairCss);
      current.maxAdjacentChunkCompositeErrorCssPixels = Math.max(current.maxAdjacentChunkCompositeErrorCssPixels ?? 0, pairCss);
    }
  }

  // 3. Manifest üret
  const compiledLayouts: Array<{
    layoutId: string;
    sourceName: string;
    kind: "model" | "paper";
    bbox: CadBBox2D;
    units: number;
  }> = [
    {
      layoutId,
      sourceName: layoutId === "Model" ? "Model" : (doc.layouts?.[layoutId]?.name || layoutId),
      kind: layoutId === "Model" || doc.layouts?.[layoutId]?.isModelSpace ? "model" as const : "paper" as const,
      bbox: layoutId === "Model" ? modelViewBBox : (doc.layouts?.[layoutId]?.bbox || modelBBox),
      units: typeof doc.units === "number" ? doc.units : 0,
    },
  ];


  const qualityEvaluation = evaluateDocumentQuality(doc, doc.rawStats);

  const metadataId = layoutId === "Model" ? "meta_model_001" : `meta_${layoutToken}_001`;
  const indexPages: Array<{
    indexId: string;
    byteLength: number;
    sha256: string;
    layoutIds: string[];
    chunkIds?: string[];
    chunks?: typeof manifestChunks;
  }> = [];
  const indexFiles = new Map<string, string>();
  const makeIndexId = (pageNumber: number) => {
    const suffix = String(pageNumber).padStart(3, "0");
    return layoutId === "Model" ? `idx_${suffix}` : `idx_${layoutToken}_${suffix}`;
  };
  const addIndexPage = (pageNumber: number, pageChunks: typeof manifestChunks) => {
    const indexId = makeIndexId(pageNumber);
    const content = JSON.stringify({ indexId, layoutIds: [layoutId], chunks: pageChunks });
    const bytes = Buffer.byteLength(content, "utf8");
    if (bytes > MAX_INDEX_PAGE_BYTES) {
      throw new Error(`Scene index ${indexId} exceeds the ${MAX_INDEX_PAGE_BYTES}-byte immutable page limit.`);
    }
    const ref = {
      indexId,
      byteLength: bytes,
      sha256: crypto.createHash("sha256").update(content, "utf8").digest("hex"),
      layoutIds: [layoutId],
    };
    indexFiles.set(indexId, content);
    if (bytes <= MAX_INDEX_PAGE_BYTES && pageNumber === 1 &&
        Buffer.byteLength(JSON.stringify({ indexId, layoutIds: [layoutId], chunks: manifestChunks }), "utf8") <= MAX_INDEX_PAGE_BYTES) {
      indexPages.push({ ...ref, chunks: pageChunks });
    } else {
      indexPages.push({ ...ref, chunkIds: pageChunks.map((chunk) => chunk.chunkId) });
    }
  };
  let pendingChunks: typeof manifestChunks = [];
  let pageNumber = 1;
  for (const chunk of manifestChunks) {
    const candidate = [...pendingChunks, chunk];
    const candidateId = makeIndexId(pageNumber);
    const candidateBytes = Buffer.byteLength(JSON.stringify({ indexId: candidateId, layoutIds: [layoutId], chunks: candidate }), "utf8");
    if (candidateBytes > MAX_INDEX_PAGE_BYTES && pendingChunks.length > 0) {
      addIndexPage(pageNumber++, pendingChunks);
      pendingChunks = [chunk];
      const singleBytes = Buffer.byteLength(JSON.stringify({ indexId: makeIndexId(pageNumber), layoutIds: [layoutId], chunks: pendingChunks }), "utf8");
      if (singleBytes > MAX_INDEX_PAGE_BYTES) {
        throw new Error(`Chunk ${chunk.chunkId} metadata cannot fit within a ${MAX_INDEX_PAGE_BYTES}-byte scene index page.`);
      }
    } else {
      pendingChunks = candidate;
      if (candidateBytes > MAX_INDEX_PAGE_BYTES) {
        throw new Error(`Chunk ${chunk.chunkId} metadata cannot fit within a ${MAX_INDEX_PAGE_BYTES}-byte scene index page.`);
      }
    }
  }
  addIndexPage(pageNumber, pendingChunks);
  const indexPageEntries = indexPages;

  const meta001Content = JSON.stringify({
    metadataId,
    layoutId,
    layers: doc.layers || {},
    schemaVersion: CAD_V2_SCHEMA_VERSION,
  });
  const meta001ByteLength = Buffer.byteLength(meta001Content, "utf8");
  const meta001Sha256 = crypto.createHash("sha256").update(meta001Content, "utf8").digest("hex");

  const metadataFiles = new Map<string, string>();
  metadataFiles.set(metadataId, meta001Content);

  const missingFontList = fontDiagnostics.filter((d) => d.status === "substitute" || d.status === "missing");
  const qualityDiagCodes = [...qualityEvaluation.diagnosticCodes];
  let finalQualityStatus = qualityEvaluation.qualityStatus;
  if (unresolvedModelAnnotationScale) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.MODEL_ANNOTATION_SCALE_UNRESOLVED)) {
      qualityDiagCodes.push(CadDiagnosticCode.MODEL_ANNOTATION_SCALE_UNRESOLVED);
    }
    finalQualityStatus = "degraded";
  }
  if (missingFontList.length > 0) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.FONT_SUBSTITUTE_APPLIED)) {
      qualityDiagCodes.push(CadDiagnosticCode.FONT_SUBSTITUTE_APPLIED);
    }
    finalQualityStatus = "degraded";
  }
  if (unsupportedComplexLinetype) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.UNSUPPORTED_COMPLEX_LINETYPE_ELEMENT)) {
      qualityDiagCodes.push(CadDiagnosticCode.UNSUPPORTED_COMPLEX_LINETYPE_ELEMENT);
    }
    finalQualityStatus = "degraded";
  }
  if (unsupportedFillClip) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.UNSUPPORTED_FILL_CLIP)) {
      qualityDiagCodes.push(CadDiagnosticCode.UNSUPPORTED_FILL_CLIP);
    }
    finalQualityStatus = "degraded";
  }
  if (unsupportedHatchPattern) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.UNSUPPORTED_HATCH_PATTERN)) {
      qualityDiagCodes.push(CadDiagnosticCode.UNSUPPORTED_HATCH_PATTERN);
    }
    finalQualityStatus = "degraded";
  }
  if (hatchPatternNativeParityUnverified) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.HATCH_PATTERN_NATIVE_PARITY_UNVERIFIED)) {
      qualityDiagCodes.push(CadDiagnosticCode.HATCH_PATTERN_NATIVE_PARITY_UNVERIFIED);
    }
    finalQualityStatus = "degraded";
  }
  if (hatchPatternLimitReached) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.HATCH_PATTERN_LIMIT_REACHED)) {
      qualityDiagCodes.push(CadDiagnosticCode.HATCH_PATTERN_LIMIT_REACHED);
    }
    finalQualityStatus = "degraded";
  }
  if (invalidHatchBoundary) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.HATCH_BOUNDARY_INVALID)) {
      qualityDiagCodes.push(CadDiagnosticCode.HATCH_BOUNDARY_INVALID);
    }
    finalQualityStatus = "degraded";
  }
  if (hatchBoundaryValidationLimitReached) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.HATCH_BOUNDARY_VALIDATION_LIMIT_REACHED)) {
      qualityDiagCodes.push(CadDiagnosticCode.HATCH_BOUNDARY_VALIDATION_LIMIT_REACHED);
    }
    finalQualityStatus = "degraded";
  }
  if (curveRefinementLimitReached) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.CURVE_REFINEMENT_LIMIT_REACHED)) {
      qualityDiagCodes.push(CadDiagnosticCode.CURVE_REFINEMENT_LIMIT_REACHED);
    }
    finalQualityStatus = "degraded";
  }
  if (invalidCurveGeometry) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.CURVE_GEOMETRY_INVALID)) {
      qualityDiagCodes.push(CadDiagnosticCode.CURVE_GEOMETRY_INVALID);
    }
    finalQualityStatus = "degraded";
  }
  const chunkQuantizationLimitReached = hasScreenBudget && manifestChunks.some(
    (chunk) => (chunk.maxQuantizationErrorCssPixels ?? 0) > options!.targetCurveErrorCssPixels! * (1 + 1e-12)
  );
  if (chunkQuantizationLimitReached) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.CHUNK_QUANTIZATION_LIMIT_REACHED)) {
      qualityDiagCodes.push(CadDiagnosticCode.CHUNK_QUANTIZATION_LIMIT_REACHED);
    }
    finalQualityStatus = "degraded";
  }
  const hatchFillTessellationLimitReached = hasScreenBudget && manifestChunks.some(
    (chunk) => (chunk.maxHatchFillBoundaryTessellationErrorCssPixels ?? 0) > options!.targetCurveErrorCssPixels! * (1 + 1e-12)
  );
  if (hatchFillTessellationLimitReached) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.HATCH_FILL_BOUNDARY_TESSELLATION_LIMIT_REACHED)) {
      qualityDiagCodes.push(CadDiagnosticCode.HATCH_FILL_BOUNDARY_TESSELLATION_LIMIT_REACHED);
    }
    finalQualityStatus = "degraded";
  }
  const hatchFillEncodedPrecisionLimitReached = hasScreenBudget && manifestChunks.some(
    (chunk) => (chunk.maxHatchFillEncodedGeometryErrorCssPixels ?? 0) > options!.targetCurveErrorCssPixels! * (1 + 1e-12)
  );
  if (hatchFillEncodedPrecisionLimitReached) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.HATCH_FILL_ENCODED_PRECISION_LIMIT_REACHED)) {
      qualityDiagCodes.push(CadDiagnosticCode.HATCH_FILL_ENCODED_PRECISION_LIMIT_REACHED);
    }
    finalQualityStatus = "degraded";
  }
  const circularCurveTessellationLimitReached = hasScreenBudget && manifestChunks.some(
    (chunk) => (chunk.maxCircularCurveTessellationErrorCssPixels ?? 0) > options!.targetCurveErrorCssPixels! * (1 + 1e-12)
  );
  if (circularCurveTessellationLimitReached) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.CIRCULAR_CURVE_TESSELLATION_LIMIT_REACHED)) {
      qualityDiagCodes.push(CadDiagnosticCode.CIRCULAR_CURVE_TESSELLATION_LIMIT_REACHED);
    }
    finalQualityStatus = "degraded";
  }
  const ellipseCurveTessellationLimitReached = hasScreenBudget && manifestChunks.some(
    (chunk) => (chunk.maxEllipseCurveTessellationErrorCssPixels ?? 0) > options!.targetCurveErrorCssPixels! * (1 + 1e-12)
  );
  if (ellipseCurveTessellationLimitReached) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.ELLIPSE_CURVE_TESSELLATION_LIMIT_REACHED)) {
      qualityDiagCodes.push(CadDiagnosticCode.ELLIPSE_CURVE_TESSELLATION_LIMIT_REACHED);
    }
    finalQualityStatus = "degraded";
  }
  const splineCurveTessellationLimitReached = hasScreenBudget && manifestChunks.some(
    (chunk) => (chunk.maxSplineCurveTessellationErrorCssPixels ?? 0) > options!.targetCurveErrorCssPixels! * (1 + 1e-12)
  );
  if (splineCurveTessellationLimitReached) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.SPLINE_CURVE_TESSELLATION_LIMIT_REACHED)) {
      qualityDiagCodes.push(CadDiagnosticCode.SPLINE_CURVE_TESSELLATION_LIMIT_REACHED);
    }
    finalQualityStatus = "degraded";
  }
  const bulgeCurveTessellationLimitReached = hasScreenBudget && manifestChunks.some(
    (chunk) => (chunk.maxBulgeCurveTessellationErrorCssPixels ?? 0) > options!.targetCurveErrorCssPixels! * (1 + 1e-12)
  );
  if (bulgeCurveTessellationLimitReached) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.BULGE_CURVE_TESSELLATION_LIMIT_REACHED)) {
      qualityDiagCodes.push(CadDiagnosticCode.BULGE_CURVE_TESSELLATION_LIMIT_REACHED);
    }
    finalQualityStatus = "degraded";
  }
  const curveSourceQuantizationLimitReached = hasScreenBudget && manifestChunks.some(
    (chunk) => (chunk.maxCurveSourceQuantizationErrorCssPixels ?? 0) > options!.targetCurveErrorCssPixels! * (1 + 1e-12)
  );
  if (curveSourceQuantizationLimitReached) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.CURVE_SIDECAR_PRECISION_LIMIT_REACHED)) {
      qualityDiagCodes.push(CadDiagnosticCode.CURVE_SIDECAR_PRECISION_LIMIT_REACHED);
    }
    finalQualityStatus = "degraded";
  }
  const pathDistanceQuantizationLimitReached = hasScreenBudget && manifestChunks.some(
    (chunk) => (chunk.maxPathDistanceQuantizationErrorCssPixels ?? 0) > options!.targetCurveErrorCssPixels! * (1 + 1e-12)
  );
  if (pathDistanceQuantizationLimitReached) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.PATH_DISTANCE_PRECISION_LIMIT_REACHED)) {
      qualityDiagCodes.push(CadDiagnosticCode.PATH_DISTANCE_PRECISION_LIMIT_REACHED);
    }
    finalQualityStatus = "degraded";
  }
  const curveEncodedPrecisionLimitReached = hasScreenBudget && manifestChunks.some(
    (chunk) => (chunk.maxCurveEncodedGeometryErrorCssPixels ?? 0) > options!.targetCurveErrorCssPixels! * (1 + 1e-12)
  );
  if (curveEncodedPrecisionLimitReached) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.CURVE_ENCODED_PRECISION_LIMIT_REACHED)) {
      qualityDiagCodes.push(CadDiagnosticCode.CURVE_ENCODED_PRECISION_LIMIT_REACHED);
    }
    finalQualityStatus = "degraded";
  }
  const adjacentChunkCompositeLimitReached = hasScreenBudget && manifestChunks.some(
    (chunk) => (chunk.maxAdjacentChunkCompositeErrorCssPixels ?? 0) > options!.targetCurveErrorCssPixels! * (1 + 1e-12)
  );
  if (adjacentChunkCompositeLimitReached) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.CHUNK_COMPOSITE_PRECISION_LIMIT_REACHED)) {
      qualityDiagCodes.push(CadDiagnosticCode.CHUNK_COMPOSITE_PRECISION_LIMIT_REACHED);
    }
    finalQualityStatus = "degraded";
  }
  const fillGlyphCompositeLimitReached = hasScreenBudget && manifestChunks.some(
    (chunk) => (chunk.maxFillGlyphCompositeErrorCssPixels ?? 0) > options!.targetCurveErrorCssPixels! * (1 + 1e-12)
  );
  if (fillGlyphCompositeLimitReached) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.CHUNK_COMPOSITE_PRECISION_LIMIT_REACHED)) {
      qualityDiagCodes.push(CadDiagnosticCode.CHUNK_COMPOSITE_PRECISION_LIMIT_REACHED);
    }
    finalQualityStatus = "degraded";
  }
  if (fillGlyphCompositeAnalysisLimitReached) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.FILL_GLYPH_COMPOSITE_ANALYSIS_LIMIT_REACHED)) {
      qualityDiagCodes.push(CadDiagnosticCode.FILL_GLYPH_COMPOSITE_ANALYSIS_LIMIT_REACHED);
    }
    finalQualityStatus = "degraded";
  }
  if (directLineSpatialPartitionLimitReached) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.DIRECT_LINE_SPATIAL_PARTITION_LIMIT_REACHED)) {
      qualityDiagCodes.push(CadDiagnosticCode.DIRECT_LINE_SPATIAL_PARTITION_LIMIT_REACHED);
    }
    finalQualityStatus = "degraded";
  }
  if (nonLineSpatialPartitionLimitReached) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.NON_LINE_STROKE_SPATIAL_PARTITION_LIMIT_REACHED)) {
      qualityDiagCodes.push(CadDiagnosticCode.NON_LINE_STROKE_SPATIAL_PARTITION_LIMIT_REACHED);
    }
    finalQualityStatus = "degraded";
  }
  if (glyphSpatialPartitionLimitReached) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.GLYPH_STROKE_SPATIAL_PARTITION_LIMIT_REACHED)) {
      qualityDiagCodes.push(CadDiagnosticCode.GLYPH_STROKE_SPATIAL_PARTITION_LIMIT_REACHED);
    }
    finalQualityStatus = "degraded";
  }
  if (fillSpatialPartitionLimitReached) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.FILL_SPATIAL_PARTITION_LIMIT_REACHED)) {
      qualityDiagCodes.push(CadDiagnosticCode.FILL_SPATIAL_PARTITION_LIMIT_REACHED);
    }
    finalQualityStatus = "degraded";
  }

  const manifest = {
    schemaVersion: CAD_V2_SCHEMA_VERSION,
    sceneId,
    sourceVersionKey: doc.sourceVersionKey || "v_unknown",
    sourceSha256: doc.sourceSha256 || "",
    dependencyDigest: FontLayoutEngine.getFontDigest(),
    decoderVersions: CAD_V2_DECODER_VERSIONS,
    compilerVersion: CAD_V2_COMPILER_REVISION,
    renderAbi: CAD_V2_RENDER_ABI,
    qualityProfile: CAD_V2_QUALITY_PROFILE,
    qualityStatus: finalQualityStatus,
    diagnosticsSummary: {
      unknownEntityCount: qualityEvaluation.provenance.rawUnsupportedCount || 0,
      unknownObjectCount: 0,
      missingFontCount: missingFontList.length,
      missingDependencyCount: qualityEvaluation.provenance.missingBlockCount || 0,
      diagnosticCodes: qualityDiagCodes,
    },
    layouts: compiledLayouts,
    layers: doc.layers,
    resources: { metadataIds: [metadataId] },
    indexPages: indexPageEntries,
    metadataPages: [
      {
        metadataId,
        layoutId,
        byteLength: meta001ByteLength,
        sha256: meta001Sha256,
      },
    ],
    limits: {
      maxChunkBytes: 2097152,
      maxDecodedBytes: 8388608,
      maxManifestBytes: 1048576,
    },
    createdAt: new Date().toISOString(),
    chunks: manifestChunks,
  };

  reportProfile?.({
    phase: "manifest-ready",
    encodedChunkCount: chunksMap.size,
    encodedChunkBytes,
  });

  return {
    manifest,
    chunks: chunksMap,
    indexFiles,
    metadataFiles,
  };
}
