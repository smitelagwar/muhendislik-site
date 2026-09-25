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
} from "../protocol/binary-protocol";
import { BlockTransformer } from "./block-transformer";
import { maxSingularValue2x2 } from "./coordinate-transform";
import { FontLayoutEngine, type FontDegradedDiagnostic } from "../text/font-layout-engine";
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

function getShaderDashStyle(pattern: readonly number[], effectiveScale: number): { dashSize: number; gapSize: number } | undefined {
  if (pattern.length !== 2 || !(pattern[0]! > 0) || !(pattern[1]! < 0) || !(effectiveScale > 0)) return undefined;
  const dashSize = pattern[0]! * effectiveScale;
  const gapSize = -pattern[1]! * effectiveScale;
  if (!Number.isFinite(dashSize) || !Number.isFinite(gapSize) || dashSize <= 0 || gapSize <= 0) return undefined;
  return { dashSize, gapSize };
}

export interface CompiledSceneOutput {
  manifest: {

    schemaVersion: number;
    sceneId: string;
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
      chunks: Array<{
        chunkId: string;
        byteLength: number;
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
    }>;
  };
  chunks: Map<string, Uint8Array>;
  indexFiles?: Map<string, string>;
  metadataFiles?: Map<string, string>;
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

  type OrderedPrimitive =
    | {
        kind: "line";
        x0: number;
        y0: number;
        x1: number;
        y1: number;
        layer: string;
        order: bigint;
        color: [number, number, number];
        isAci7?: boolean;
        alpha?: number;
        lineweightMm?: number;
        pathDistance0?: number;
        pathDistance1?: number;
        /** Native shader dash path for supported two-term, hairline strokes. */
        dashStyle?: { dashSize: number; gapSize: number };
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
        color: [number, number, number];
        isWipeout?: boolean;
        alpha?: number;
        isAci7?: boolean;
        /** Maximum source-boundary tessellation deviation for a solid HATCH fill mesh. */
        hatchFillBoundaryTessellationErrorWorld?: number;
      };

  const allPrimitives: OrderedPrimitive[] = [];

  const blockTransformer = new BlockTransformer({
    blocks: doc.blocks || {},
    layers: doc.layers || {},
    linetypes: doc.linetypes || {},
    textStyles: doc.textStyles || {},
    maxCurveErrorWorld,
    maxCurveSegments,
  });

  const layoutId = options.layoutId;
  const layoutToken = layoutId === "Model"
    ? "model"
    : `${layoutId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32) || "layout"}_${crypto.createHash("sha256").update(layoutId).digest("hex").slice(0, 8)}`;
  const entities = layoutId === "Model" ? doc.modelSpaceEntities : (doc.paperSpaceEntities?.[layoutId] || []);
  for (const ent of entities) {
    if (ent.visible === false) continue;
    if (doc.layers && doc.layers[ent.layer]?.frozen) continue;
    const style = resolveCadStyle(ent, doc.layers || {});
    const entColor = style.rgb;
    const entIsAci7 = style.isAci7;
    const entAlpha = style.alpha;
    const lw = resolveEntityLineweight(ent, doc.layers || {});
    const entLw = lw.lineweightMm;
    const lt = resolveEntityLinetype(ent, doc.layers || {}, doc.linetypes || {});

    switch (ent.type) {
      case "LINE": {
        const [x0, y0] = ent.start;
        const [x1, y1] = ent.end;
        if (lt.isContinuous) {
          const len = Math.hypot(x1 - x0, y1 - y0);
          allPrimitives.push({
            kind: "line",
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
          const dashed = tessellateDashedPath(expanded.polyPoints, lt.pattern, lt.effectiveScale, {
            isClosed: ent.isClosed,
            plinegen: ent.plinegen ?? true,
          });
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
        const hatchRes = GeometryCompiler.triangulateHatch(ent, maxCurveSegments, maxCurveErrorWorld);
        if (hatchRes.refinementLimitReached) curveRefinementLimitReached = true;
        if (hatchRes.invalidCurveGeometry) invalidCurveGeometry = true;
        if (hatchRes.mesh && hatchRes.mesh.vertices.length > 0) {
          allPrimitives.push({
            kind: "triangle",
            vertices: hatchRes.mesh.vertices,
            layer: ent.layer,
            order: ent.order,
            color: entColor,
            alpha: entAlpha,
            isAci7: entIsAci7,
            hatchFillBoundaryTessellationErrorWorld: hatchRes.maxBoundaryTessellationErrorWorld,
          });
          const verts = hatchRes.mesh.vertices;
          for (let i = 0; i < verts.length; i += 2) {
            minX = Math.min(minX, verts[i]);
            minY = Math.min(minY, verts[i + 1]);
            maxX = Math.max(maxX, verts[i]);
            maxY = Math.max(maxY, verts[i + 1]);
          }
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
        const segs = blockTransformer.expandInsert(ent);
        const insertResult = blockTransformer.getLastResult();
        if (insertResult?.curveRefinementLimitReached) curveRefinementLimitReached = true;
        if (insertResult?.invalidCurveGeometry) invalidCurveGeometry = true;
        for (const seg of segs) {
          allPrimitives.push({
            kind: "line",
            x0: seg.x0,
            y0: seg.y0,
            x1: seg.x1,
            y1: seg.y1,
            layer: seg.layer,
            order: seg.order,
            color: seg.color || entColor,
            isAci7: seg.isAci7 ?? entIsAci7,
            alpha: seg.alpha ?? entAlpha,
            lineweightMm: seg.lineweightMm ?? entLw,
            curveSource: seg.curveSource,
            splineCurveTessellationErrorWorld: seg.splineCurveTessellationErrorWorld,
            ellipseCurveTessellationErrorWorld: seg.ellipseCurveTessellationErrorWorld,
            bulgeCurveTessellationErrorWorld: seg.bulgeCurveTessellationErrorWorld,
            hatchBoundaryTessellationErrorWorld: seg.hatchBoundaryTessellationErrorWorld,
          });
          minX = Math.min(minX, seg.x0, seg.x1);
          minY = Math.min(minY, seg.y0, seg.y1);
          maxX = Math.max(maxX, seg.x0, seg.x1);
          maxY = Math.max(maxY, seg.y0, seg.y1);
        }
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
        for (const seg of visitorRes.segments) {
          allPrimitives.push({
            kind: "line",
            x0: seg.x0,
            y0: seg.y0,
            x1: seg.x1,
            y1: seg.y1,
            layer: seg.layer,
            order: seg.order,
            color: seg.color || entColor,
            isAci7: seg.isAci7 ?? entIsAci7,
            alpha: seg.alpha ?? entAlpha,
            lineweightMm: seg.lineweightMm ?? entLw,
            splineCurveTessellationErrorWorld: seg.splineCurveTessellationErrorWorld,
            ellipseCurveTessellationErrorWorld: seg.ellipseCurveTessellationErrorWorld,
            bulgeCurveTessellationErrorWorld: seg.bulgeCurveTessellationErrorWorld,
            hatchBoundaryTessellationErrorWorld: seg.hatchBoundaryTessellationErrorWorld,
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
        const ctx = visitor.createRootContext(ent.layer, ent.order);
        ctx.viewportId = viewport.id;
        ctx.layerOverrides = viewport.layerOverrides;
        ctx.downstreamTransformSingularValue = viewportMaxScale;
        const result = visitor.createEmptyResult();
        visitor.visitEntity(ent, ctx, result);
        if (result.curveRefinementLimitReached) curveRefinementLimitReached = true;
        if (result.invalidCurveGeometry) invalidCurveGeometry = true;
        for (const segment of result.segments) {
          if (!LayoutManager.isLayerVisible(segment.layer, doc.layers || {}, viewport)) continue;
          const p0 = LayoutManager.transformPoint([segment.x0, segment.y0], matrix);
          const p1 = LayoutManager.transformPoint([segment.x1, segment.y1], matrix);
          const clippedSegments = viewport.clipPolygon && viewport.clipPolygon.length >= 3
            ? LayoutManager.clipLineToPolygon(p0, p1, viewport.clipPolygon)
            : (() => { const clipped = LayoutManager.clipLineToBBox(p0, p1, bbox); return clipped ? [clipped] : []; })();
          for (const [a, b] of clippedSegments) {
            allPrimitives.push({
              kind: "line", x0: a[0], y0: a[1], x1: b[0], y1: b[1],
              layer: segment.layer, order: viewport.order ?? segment.order,
              color: segment.color || resolveCadStyle(ent, doc.layers || {}, viewport.layerOverrides).rgb,
              isAci7: segment.isAci7, alpha: segment.alpha,
              lineweightMm: segment.lineweightMm,
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
            });
            minX = Math.min(minX, a[0], b[0]); minY = Math.min(minY, a[1], b[1]);
            maxX = Math.max(maxX, a[0], b[0]); maxY = Math.max(maxY, a[1], b[1]);
          }
        }
      }
    }
  }

  // Authoritative painter's draw order sıralaması (Yalnız gerekliyse sırala)
  let needsSort = false;
  for (let i = 1; i < allPrimitives.length; i++) {
    if (allPrimitives[i].order < allPrimitives[i - 1].order) {
      needsSort = true;
      break;
    }
  }
  if (needsSort) {
    allPrimitives.sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0));
  }

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

  // 2. Bounded Binary Chunk Bölümleme (<= 2 MiB HTTP Tavanı Uyumu)
  const MAX_SEGMENTS_PER_CHUNK = Number.isFinite(options.maxPrimitivesPerChunk)
    ? Math.min(50_000, Math.max(1, Math.floor(options.maxPrimitivesPerChunk!)))
    : 50_000;
  const chunkCount = Math.max(1, Math.ceil(allPrimitives.length / MAX_SEGMENTS_PER_CHUNK));
  const manifestChunks: Array<{
    chunkId: string;
    byteLength: number;
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
  }> = [];
  const chunksMap = new Map<string, Uint8Array>();

  for (let cIdx = 0; cIdx < chunkCount; cIdx++) {
    const startIdx = cIdx * MAX_SEGMENTS_PER_CHUNK;
    const endIdx = Math.min(allPrimitives.length, startIdx + MAX_SEGMENTS_PER_CHUNK);

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
    for (let pIdx = startIdx; pIdx < endIdx; pIdx++) {
      const primitive = allPrimitives[pIdx];
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
      const p = allPrimitives[pIdx];
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
      /** Global stable position in the sorted primitive stream, independent of chunk arrival. */
      globalOrderIndex: number;
      alpha?: number;
      isAci7?: boolean;
      lineweightMm?: number;
      dashStyle?: { dashSize: number; gapSize: number };
    }

    const drawCommands: RawDrawCommand[] = [];
    let currentCmd: RawDrawCommand | null = null;
    let lineVertexOffset = 0;
    let triVertexOffset = 0;

    for (let pIdx = startIdx; pIdx < endIdx; pIdx++) {
      const prim = allPrimitives[pIdx];
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
        if (
          currentCmd &&
          currentCmd.kind === "line" &&
          currentCmd.layer === prim.layer &&
          currentCmd.isAci7 === isAci7 &&
          Math.abs((currentCmd.lineweightMm ?? 0) - primLw) < 1e-4 &&
          Math.abs((currentCmd.alpha ?? 1) - (prim.alpha ?? 1)) < 1e-4 &&
          Math.abs(currentCmd.color[0] - prim.color[0]) < 1e-4 &&
          Math.abs(currentCmd.color[1] - prim.color[1]) < 1e-4 &&
          Math.abs(currentCmd.color[2] - prim.color[2]) < 1e-4 &&
          currentCmd.dashStyle?.dashSize === prim.dashStyle?.dashSize &&
          currentCmd.dashStyle?.gapSize === prim.dashStyle?.gapSize
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
            globalOrderIndex: pIdx,
            alpha: prim.alpha ?? 1,
            isAci7,
            lineweightMm: primLw,
            ...(prim.dashStyle ? { dashStyle: prim.dashStyle } : {}),
          };
          drawCommands.push(currentCmd);
        }
      } else {
        const vCount = prim.vertices.length / 2;
        const vIdx = triVertexOffset;
        let hatchTriangleQuantizationErrorSquared = 0;
        for (let i = 0; i < prim.vertices.length; i += 2) {
          const worldX = prim.vertices[i]!;
          const worldY = prim.vertices[i + 1]!;
          const localX = Math.fround(worldX - chunkOriginX);
          const localY = Math.fround(worldY - chunkOriginY);
          const quantizationErrorSquared =
            (worldX - (chunkOriginX + localX)) ** 2 + (worldY - (chunkOriginY + localY)) ** 2;
          maxQuantizationErrorSquared = Math.max(maxQuantizationErrorSquared, quantizationErrorSquared);
          if (prim.kind === "triangle" && Number.isFinite(prim.hatchFillBoundaryTessellationErrorWorld)) {
            hatchTriangleQuantizationErrorSquared = Math.max(hatchTriangleQuantizationErrorSquared, quantizationErrorSquared);
          }
          trianglesArray[vIdx * 2 + i] = localX;
          trianglesArray[vIdx * 2 + i + 1] = localY;
        }
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

        if (
          !isWipeout &&
          currentCmd &&
          currentCmd.kind === "triangle" &&
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
            globalOrderIndex: pIdx,
            alpha: prim.alpha ?? 1,
            isAci7,
          };
          drawCommands.push(currentCmd);
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
        primitiveCount: endIdx - startIdx,
        layerIds: Object.keys(doc.layers || {}),
        layerRuns,
        triangleRuns,
        drawCommands,
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

    const chunkBytes = buildSceneChunk(chunkSections);

    const chunkHash = crypto.createHash("sha256").update(chunkBytes).digest("hex");
    const chunkId = `chunk_${layoutToken}_${String(cIdx + 1).padStart(3, "0")}`;

    const maxQuantizationErrorWorld = Math.sqrt(maxQuantizationErrorSquared);
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
    manifestChunks.push({
      chunkId,
      byteLength: chunkBytes.byteLength,
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
    });

    // Bellek tasarrufu: İşlenen parçanın primitif referanslarını serbest bırak
    for (let pIdx = startIdx; pIdx < endIdx; pIdx++) {
      (allPrimitives as any)[pIdx] = null;
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
      bbox: layoutId === "Model" ? modelBBox : (doc.layouts?.[layoutId]?.bbox || modelBBox),
      units: typeof doc.units === "number" ? doc.units : 0,
    },
  ];


  const qualityEvaluation = evaluateDocumentQuality(doc, doc.rawStats);

  const indexId = layoutId === "Model" ? "idx_001" : `idx_${layoutToken}_001`;
  const metadataId = layoutId === "Model" ? "meta_model_001" : `meta_${layoutToken}_001`;
  const index001Content = JSON.stringify({
    indexId,
    layoutIds: [layoutId],
    chunks: manifestChunks,
  });
  const index001ByteLength = Buffer.byteLength(index001Content, "utf8");
  const index001Sha256 = crypto.createHash("sha256").update(index001Content, "utf8").digest("hex");

  const meta001Content = JSON.stringify({
    metadataId,
    layoutId,
    layers: doc.layers || {},
    schemaVersion: CAD_V2_SCHEMA_VERSION,
  });
  const meta001ByteLength = Buffer.byteLength(meta001Content, "utf8");
  const meta001Sha256 = crypto.createHash("sha256").update(meta001Content, "utf8").digest("hex");

  const indexFiles = new Map<string, string>();
  indexFiles.set(indexId, index001Content);

  const metadataFiles = new Map<string, string>();
  metadataFiles.set(metadataId, meta001Content);

  const missingFontList = fontDiagnostics.filter((d) => d.status === "substitute" || d.status === "missing");
  const qualityDiagCodes = [...qualityEvaluation.diagnosticCodes];
  let finalQualityStatus = qualityEvaluation.qualityStatus;
  if (missingFontList.length > 0) {
    if (!qualityDiagCodes.includes(CadDiagnosticCode.FONT_SUBSTITUTE_APPLIED)) {
      qualityDiagCodes.push(CadDiagnosticCode.FONT_SUBSTITUTE_APPLIED);
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
    indexPages: [
      {
        indexId,
        byteLength: index001ByteLength,
        sha256: index001Sha256,
        layoutIds: [layoutId],
        chunks: manifestChunks,
      },
    ],
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

  return {
    manifest,
    chunks: chunksMap,
    indexFiles,
    metadataFiles,
  };
}
