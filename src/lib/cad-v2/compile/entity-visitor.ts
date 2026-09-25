// ============================================================================
// DWG/DXF MOTOR V2 — UNIFIED ENTITY COMPILER & VISITOR (P06)
// ============================================================================
// Sözleşme: P06 — Ortak entity compiler, block text ve güvenli expansion
// 1. Ortak visitor: entity + transform + effective layer/style + visibility + order path + clip + provenance
// 2. LINE kadar TEXT/MTEXT, fill, width, WIPEOUT ve dimension block içeriği aynı yoldan geçer
// 3. ATTRIB / ATTDEF tekilleştirme: instance değerinin kaynak bağlamını koru
// 4. Farklı hata kodları: MISSING_BLOCK_DEFINITION, CYCLIC_BLOCK_REFERENCE, MAX_DEPTH_EXCEEDED, EXPANSION_BUDGET_EXCEEDED
// 5. Bounded expansion budget (tavan aşımında güvenli durma ve explicit partial/degraded)
// ============================================================================

import type {
  CadEntity,
  CadBlockDefinition,
  CadLayer,
  CadInsertEntity,
  CadTextEntity,
  CadMTextEntity,
  CadAttDefEntity,
  CadAttribEntity,
  CadTextStyle,
  CadClipBoundary,
} from "../canonical/types";
import { LayoutManager } from "../layout/layout-manager";
import {
  Matrix4x4,
  computeInsertMatrix,
  multiplyMatrix4x4,
  transformPoint2D,
  createIdentityMatrix,
  maxSingularValue2D,
} from "./coordinate-transform";
import { GeometryCompiler } from "./geometry-compiler";
import type { AnalyticCurveSourceSegment } from "./geometry-compiler";
import { FontLayoutEngine } from "../text/font-layout-engine";
import { resolveCadStyle, resolveEntityColor } from "./cad-color-resolver";
import { DimensionCompiler } from "./dimension-compiler";
import {
  resolveEntityLineweight,
  resolveEntityLinetype,
  tessellateDashedLine,
  tessellateDashedArc,
  tessellateDashedCircle,
  tessellateDashedPath,
} from "../render/cad-stroke";

export interface TransformedSegment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  layer: string;
  order: bigint;
  color?: [number, number, number];
  colorRgb?: number;
  isAci7?: boolean;
  alpha?: number;
  lineweightMm?: number;
  /** Analytic source after the complete INSERT transform; omitted for clipped/dashed output. */
  curveSource?: AnalyticCurveSourceSegment;
  /** Conservative spline tessellation error after this segment's INSERT transforms. */
  splineCurveTessellationErrorWorld?: number;
  /** Conservative ellipse tessellation error after this segment's INSERT transforms. */
  ellipseCurveTessellationErrorWorld?: number;
  /** Conservative continuous, widthless bulge chord error after INSERT transforms. */
  bulgeCurveTessellationErrorWorld?: number;
  /** Conservative HATCH boundary chord error after the complete INSERT transform. */
  hatchBoundaryTessellationErrorWorld?: number;
}

export interface VisitorDiagnostic {
  code: string;
  message: string;
  handle?: string;
  blockName?: string;
  depth?: number;
}

export interface VisitorContext {
  transform: Matrix4x4;
  effectiveLayer: string;
  order: bigint;
  parentInsert?: CadInsertEntity;
  parentInserts?: CadInsertEntity[];
  ancestors: Set<string>;
  depth: number;
  insertPath: string[];
  viewportId?: string;
  layerOverrides?: Record<string, Partial<CadLayer>>;
  clipBoundary?: CadClipBoundary;
  /** Later transforms applied after this context (e.g. paper viewport projection). */
  downstreamTransformSingularValue?: number;
}

export interface EntityVisitorOptions {
  blocks: Record<string, CadBlockDefinition>;
  layers: Record<string, CadLayer>;
  linetypes?: Record<string, any>;
  textStyles?: Record<string, CadTextStyle>;
  maxDepth?: number;
  maxTotalEntities?: number;
  maxCurveErrorWorld?: number;
  maxCurveSegments?: number;
}

export interface VisitorResult {
  segments: TransformedSegment[];
  diagnostics: VisitorDiagnostic[];
  totalEntitiesVisited: number;
  totalPrimitivesProduced: number;
  isBudgetExceeded: boolean;
  curveRefinementLimitReached: boolean;
  invalidCurveGeometry: boolean;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export class EntityVisitor {
  private blocks: Record<string, CadBlockDefinition>;
  private layers: Record<string, CadLayer>;
  private linetypes: Record<string, any>;
  private textStyles?: Record<string, CadTextStyle>;
  private maxDepth: number;
  private maxTotalEntities: number;
  private maxCurveErrorWorld: number;
  private maxCurveSegments: number;

  constructor(options: EntityVisitorOptions) {
    this.blocks = options.blocks;
    this.layers = options.layers;
    this.linetypes = options.linetypes || {};
    this.textStyles = options.textStyles;
    this.maxDepth = options.maxDepth ?? 32;
    this.maxTotalEntities = options.maxTotalEntities ?? 500000;
    this.maxCurveErrorWorld = Number.isFinite(options.maxCurveErrorWorld) && options.maxCurveErrorWorld! > 0
      ? options.maxCurveErrorWorld!
      : 0.25;
    this.maxCurveSegments = Number.isFinite(options.maxCurveSegments)
      ? Math.max(1, Math.min(65_536, Math.floor(options.maxCurveSegments!)))
      : 65_536;
  }

  /**
   * Boş ve sıfırlanmış bir VisitorResult nesnesi oluşturur
   */
  public createEmptyResult(): VisitorResult {
    return {
      segments: [],
      diagnostics: [],
      totalEntitiesVisited: 0,
      totalPrimitivesProduced: 0,
      isBudgetExceeded: false,
      curveRefinementLimitReached: false,
      invalidCurveGeometry: false,
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    };
  }

  /**
   * Kök bağlam (WCS, Identity matrix, depth 0) üretir
   */
  public createRootContext(layer: string, order: bigint): VisitorContext {
    return {
      transform: createIdentityMatrix(),
      effectiveLayer: layer,
      order,
      ancestors: new Set(),
      depth: 0,
      insertPath: [],
      parentInserts: [],
    };
  }

  /**
   * Tekil bir varlığı bağlamı ile ziyaret eder ve primitive segmentlerini üretir
   */
  public visitEntity(
    ent: CadEntity,
    ctx: VisitorContext,
    result: VisitorResult
  ): void {
    // 1. Kaynak görünürlük kontrolü
    if (ent.visible === false) {
      result.diagnostics.push({
        code: "EXCLUDED_BY_SOURCE_VISIBILITY",
        message: `Entity ${ent.handle} kaynakta görünmez olarak işaretlenmiş.`,
        handle: ent.handle,
      });
      return;
    }

    const combinedCurveScale = maxSingularValue2D(ctx.transform) * (ctx.downstreamTransformSingularValue ?? 1);
    const localCurveError = combinedCurveScale > 0 && Number.isFinite(combinedCurveScale)
      ? this.maxCurveErrorWorld / combinedCurveScale
      : Number.MAX_VALUE;

    // 2. Katman donukluk kontrolü
    const layerDef = this.layers[ctx.effectiveLayer];
    if (layerDef && layerDef.frozen) {
      return;
    }

    // 3. Kaynak bütçe kontrolü (Bounded Expansion)
    result.totalEntitiesVisited++;
    if (result.totalEntitiesVisited > this.maxTotalEntities) {
      if (!result.isBudgetExceeded) {
        result.isBudgetExceeded = true;
        result.diagnostics.push({
          code: "EXPANSION_BUDGET_EXCEEDED",
          message: `Genişletme bütçesi sınırı aşıldı: ${this.maxTotalEntities}`,
          handle: ent.handle,
        });
      }
      return;
    }

    // Renk ve stil çözümü
    const style = resolveCadStyle(ent, this.layers, {
      effectiveLayer: ctx.effectiveLayer,
      parentInserts: ctx.parentInserts,
      parentInsert: ctx.parentInsert,
      layerOverrides: ctx.layerOverrides,
      viewportId: ctx.viewportId,
    });
    const effectiveColor = style.rgb;
    const isAci7 = style.isAci7;
    const alpha = style.alpha;

    const lw = resolveEntityLineweight(ent, this.layers, {
      parentInsert: ctx.parentInsert,
      parentInserts: ctx.parentInserts,
      layerOverrides: ctx.layerOverrides,
    });
    const effectiveLineweight = lw.lineweightMm;

    const lt = resolveEntityLinetype(ent, this.layers, this.linetypes, {
      parentInsert: ctx.parentInsert,
      parentInserts: ctx.parentInserts,
      layerOverrides: ctx.layerOverrides,
    });

    switch (ent.type) {
      case "LINE": {
        const p0 = transformPoint2D(ctx.transform, ent.start);
        const p1 = transformPoint2D(ctx.transform, ent.end);
        if (lt.isContinuous) {
          this.addSegment(p0, p1, ctx, effectiveColor, result, isAci7, alpha, effectiveLineweight);
        } else {
          const res = tessellateDashedLine(p0, p1, lt.pattern, lt.effectiveScale);
          for (const s of res.segments) {
            this.addSegment([s.x0, s.y0], [s.x1, s.y1], ctx, effectiveColor, result, isAci7, alpha, effectiveLineweight);
          }
        }
        break;
      }

      case "CIRCLE": {
        if (lt.isContinuous) {
          const curve = GeometryCompiler.tessellateArcWithBudget(ent.center, ent.radius, 0, Math.PI * 2, false,
            localCurveError, this.maxCurveSegments);
          if (!curve.errorBoundMet) result.curveRefinementLimitReached = true;
          this.addCurvePoints(curve.points, ctx, effectiveColor, result, isAci7, alpha, effectiveLineweight, {
            curveId: this.getInstanceCurveId(ctx, ent.handle, "CIRCLE"),
            sourceHandle: ent.handle,
            sourceType: "CIRCLE",
            center: ent.center,
            basisU: [ent.radius, 0],
            basisV: [0, ent.radius],
            startParam: 0,
            endParam: Math.PI * 2,
          });
        } else {
          const res = tessellateDashedCircle(ent.center, ent.radius, lt.pattern, lt.effectiveScale, 0, {
            maxErrorWorld: localCurveError, maxSegments: this.maxCurveSegments,
          });
          if (res.refinementLimitReached || res.errorBoundMet === false) result.curveRefinementLimitReached = true;
          for (const s of res.segments) {
            const p0 = transformPoint2D(ctx.transform, [s.x0, s.y0]);
            const p1 = transformPoint2D(ctx.transform, [s.x1, s.y1]);
            this.addSegment(p0, p1, ctx, effectiveColor, result, isAci7, alpha, effectiveLineweight);
          }
        }
        break;
      }

      case "ARC": {
        if (lt.isContinuous) {
          const curve = GeometryCompiler.tessellateArcWithBudget(ent.center, ent.radius, ent.startAngleRad,
            ent.endAngleRad, ent.isClockwise, localCurveError, this.maxCurveSegments);
          if (!curve.errorBoundMet) result.curveRefinementLimitReached = true;
          const direction = ent.isClockwise ? -1 : 1;
          let sweep = ent.endAngleRad - ent.startAngleRad;
          if (ent.isClockwise && sweep > 0) sweep -= Math.PI * 2;
          else if (!ent.isClockwise && sweep < 0) sweep += Math.PI * 2;
          if (Math.abs(sweep) < 1e-9) sweep = direction * Math.PI * 2;
          this.addCurvePoints(curve.points, ctx, effectiveColor, result, isAci7, alpha, effectiveLineweight, {
            curveId: this.getInstanceCurveId(ctx, ent.handle, "ARC"),
            sourceHandle: ent.handle,
            sourceType: "ARC",
            center: ent.center,
            basisU: [ent.radius, 0],
            basisV: [0, ent.radius],
            startParam: ent.startAngleRad,
            endParam: ent.startAngleRad + sweep,
          });
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
            { maxErrorWorld: localCurveError, maxSegments: this.maxCurveSegments }
          );
          if (res.refinementLimitReached || res.errorBoundMet === false) result.curveRefinementLimitReached = true;
          for (const s of res.segments) {
            const p0 = transformPoint2D(ctx.transform, [s.x0, s.y0]);
            const p1 = transformPoint2D(ctx.transform, [s.x1, s.y1]);
            this.addSegment(p0, p1, ctx, effectiveColor, result, isAci7, alpha, effectiveLineweight);
          }
        }
        break;
      }

      case "LWPOLYLINE": {
        const expanded = GeometryCompiler.expandLwPolyline(ent, this.maxCurveSegments, localCurveError);
        if (expanded.refinementLimitReached) result.curveRefinementLimitReached = true;
        const hasWidth = (ent.constantWidth ?? 0) !== 0 || ent.vertices.some((vertex) =>
          (vertex.startWidth ?? 0) !== 0 || (vertex.endWidth ?? 0) !== 0);
        if (!lt.isContinuous && expanded.polyPoints && expanded.polyPoints.length >= 2) {
          const res = tessellateDashedPath(expanded.polyPoints, lt.pattern, lt.effectiveScale, {
            isClosed: ent.isClosed,
            plinegen: ent.plinegen ?? true,
          });
          for (const s of res.segments) {
            const p0 = transformPoint2D(ctx.transform, [s.x0, s.y0]);
            const p1 = transformPoint2D(ctx.transform, [s.x1, s.y1]);
            this.addSegment(p0, p1, ctx, effectiveColor, result, isAci7, alpha, effectiveLineweight);
          }
        } else {
          for (const seg of expanded.lineSegments) {
            const p0 = transformPoint2D(ctx.transform, [seg.x0, seg.y0]);
            const p1 = transformPoint2D(ctx.transform, [seg.x1, seg.y1]);
            const curveSource = lt.isContinuous && !hasWidth && seg.curveSource
              ? this.transformCurveSource(ctx, seg.curveSource)
              : undefined;
            const bulgeCurveTessellationErrorWorld = lt.isContinuous && !hasWidth && Number.isFinite(seg.bulgeCurveTessellationErrorWorld)
              ? seg.bulgeCurveTessellationErrorWorld! * maxSingularValue2D(ctx.transform)
              : undefined;
            this.addSegment(
              p0, p1, ctx, effectiveColor, result, isAci7, alpha, effectiveLineweight,
              curveSource, undefined, bulgeCurveTessellationErrorWorld,
            );
          }
        }
        break;
      }

      case "ELLIPSE": {
        const curve = GeometryCompiler.tessellateEllipseWithBudget(
          ent.center,
          ent.majorAxisVector,
          ent.axisRatio,
          ent.startParam,
          ent.endParam,
          localCurveError,
          this.maxCurveSegments
        );
        if (!curve.errorBoundMet) result.curveRefinementLimitReached = true;
        const ellipseCurveTessellationErrorWorld = Number.isFinite(curve.maxSagittaWorld)
          ? curve.maxSagittaWorld * maxSingularValue2D(ctx.transform)
          : undefined;
        const sweep = ent.endParam - ent.startParam <= 0
          ? ent.endParam - ent.startParam + Math.PI * 2
          : ent.endParam - ent.startParam;
        const ratio = Math.max(1e-6, Math.min(1, ent.axisRatio));
        const source = lt.isContinuous ? {
          curveId: this.getInstanceCurveId(ctx, ent.handle, "ELLIPSE"),
          sourceHandle: ent.handle,
          sourceType: "ELLIPSE" as const,
          center: ent.center,
          basisU: ent.majorAxisVector,
          basisV: [-ent.majorAxisVector[1] * ratio, ent.majorAxisVector[0] * ratio] as [number, number],
          startParam: ent.startParam,
          endParam: ent.startParam + sweep,
        } : undefined;
        this.addCurvePoints(
          curve.points, ctx, effectiveColor, result, isAci7, alpha, effectiveLineweight,
          source, undefined, ellipseCurveTessellationErrorWorld,
        );
        break;
      }

      case "SPLINE": {
        const curve = GeometryCompiler.tessellateSplineWithBudget(ent, localCurveError, this.maxCurveSegments);
        if (curve.invalidInput) result.invalidCurveGeometry = true;
        else if (!curve.errorBoundMet) result.curveRefinementLimitReached = true;
        const splineCurveTessellationErrorWorld = Number.isFinite(curve.maxSagittaWorld)
          ? curve.maxSagittaWorld * maxSingularValue2D(ctx.transform)
          : undefined;
        if (lt.isContinuous && curve.splineBezierSpans?.length) {
          for (const span of curve.splineBezierSpans) {
            for (let index = 0; index + 1 < span.points.length; index++) {
              const source = this.transformCurveSource(ctx, {
                curveId: `${ent.handle}:SPLINE:SPAN:${span.spanIndex}`,
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
              this.addSegment(
                transformPoint2D(ctx.transform, span.points[index]!),
                transformPoint2D(ctx.transform, span.points[index + 1]!),
                ctx,
                effectiveColor,
                result,
                isAci7,
                alpha,
                effectiveLineweight,
                source,
                splineCurveTessellationErrorWorld,
              );
            }
          }
        } else {
          this.addCurvePoints(
            curve.points, ctx, effectiveColor, result, isAci7, alpha, effectiveLineweight, undefined,
            splineCurveTessellationErrorWorld,
          );
        }
        break;
      }

      case "HATCH": {
        const hatchRes = GeometryCompiler.triangulateHatch({
          ...ent,
          layer: ctx.effectiveLayer,
        }, this.maxCurveSegments, localCurveError);
        if (hatchRes.refinementLimitReached) result.curveRefinementLimitReached = true;
        if (hatchRes.invalidCurveGeometry) result.invalidCurveGeometry = true;
        for (const seg of hatchRes.boundaryLines) {
          const p0 = transformPoint2D(ctx.transform, [seg.x0, seg.y0]);
          const p1 = transformPoint2D(ctx.transform, [seg.x1, seg.y1]);
          const curveSource = lt.isContinuous && seg.curveSource
            ? this.transformCurveSource(ctx, seg.curveSource)
            : undefined;
          const hatchBoundaryTessellationErrorWorld = Number.isFinite(seg.hatchBoundaryTessellationErrorWorld)
            ? seg.hatchBoundaryTessellationErrorWorld! * maxSingularValue2D(ctx.transform)
            : undefined;
          this.addSegment(
            p0, p1, ctx, effectiveColor, result, isAci7, alpha, effectiveLineweight,
            curveSource, undefined, undefined, hatchBoundaryTessellationErrorWorld,
          );
        }
        break;
      }

      case "WIPEOUT": {
        const wipeMesh = GeometryCompiler.triangulateWipeout(ent);
        if (wipeMesh) {
          for (let i = 0; i < wipeMesh.vertices.length; i += 2) {
            const p = transformPoint2D(ctx.transform, [
              wipeMesh.vertices[i],
              wipeMesh.vertices[i + 1],
            ]);
            result.minX = Math.min(result.minX, p[0]);
            result.minY = Math.min(result.minY, p[1]);
            result.maxX = Math.max(result.maxX, p[0]);
            result.maxY = Math.max(result.maxY, p[1]);
          }
        }
        break;
      }

      case "TEXT": {
        // P06: Top-level ve blok içindeki TEXT aynı ortak motorla derlenir
        const segs = FontLayoutEngine.layoutText(ent, { textStyles: this.textStyles });
        for (const seg of segs) {
          const p0 = transformPoint2D(ctx.transform, [seg.x0, seg.y0]);
          const p1 = transformPoint2D(ctx.transform, [seg.x1, seg.y1]);
          const segColor = seg.color ? resolveEntityColor({ color: seg.color, layer: ent.layer }, this.layers) : effectiveColor;
          this.addSegment(p0, p1, ctx, segColor, result, isAci7, alpha);
        }
        break;
      }

      case "MTEXT": {
        // P06: Top-level ve blok içindeki MTEXT aynı ortak motorla derlenir
        const segs = FontLayoutEngine.layoutMText(ent, { textStyles: this.textStyles });
        for (const seg of segs) {
          const p0 = transformPoint2D(ctx.transform, [seg.x0, seg.y0]);
          const p1 = transformPoint2D(ctx.transform, [seg.x1, seg.y1]);
          const segColor = seg.color ? resolveEntityColor({ color: seg.color, layer: ent.layer }, this.layers) : effectiveColor;
          this.addSegment(p0, p1, ctx, segColor, result, isAci7, alpha);
        }
        break;
      }

      case "ATTDEF": {
        // F05: Görünmez öznitelik kontrolü
        if (ent.isInvisible) {
          return;
        }
        // F05: ATTDEF tekilleştirme ve constant kontrolü:
        // isConstant ise instance override edilemez, daima varsayılan metin basılır
        let textToRender = ent.defaultText || ent.tag;
        if (!ent.isConstant && ctx.parentInsert && ctx.parentInsert.attributes && ctx.parentInsert.attributes[ent.tag] != null) {
          textToRender = ctx.parentInsert.attributes[ent.tag];
        }
        const textProxy: CadTextEntity = {
          ...ent,
          type: "TEXT",
          text: textToRender,
        };
        const segs = FontLayoutEngine.layoutText(textProxy, { textStyles: this.textStyles });
        for (const seg of segs) {
          const p0 = transformPoint2D(ctx.transform, [seg.x0, seg.y0]);
          const p1 = transformPoint2D(ctx.transform, [seg.x1, seg.y1]);
          const segColor = seg.color ? resolveEntityColor({ color: seg.color, layer: ent.layer }, this.layers) : effectiveColor;
          this.addSegment(p0, p1, ctx, segColor, result, isAci7, alpha);
        }
        break;
      }

      case "ATTRIB": {
        // F05: Görünmez öznitelik kontrolü
        if (ent.isInvisible) {
          return;
        }
        const textProxy: CadTextEntity = {
          ...ent,
          type: "TEXT",
          text: ent.text,
        };
        const segs = FontLayoutEngine.layoutText(textProxy, { textStyles: this.textStyles });
        for (const seg of segs) {
          const p0 = transformPoint2D(ctx.transform, [seg.x0, seg.y0]);
          const p1 = transformPoint2D(ctx.transform, [seg.x1, seg.y1]);
          const segColor = seg.color ? resolveEntityColor({ color: seg.color, layer: ent.layer }, this.layers) : effectiveColor;
          this.addSegment(p0, p1, ctx, segColor, result, isAci7, alpha);
        }
        break;
      }

      case "DIMENSION": {
        DimensionCompiler.compileDimension(
          ent,
          ctx,
          {
            blocks: this.blocks,
            layers: this.layers,
            linetypes: this.linetypes,
            textStyles: this.textStyles,
            visitor: this,
          },
          result
        );
        break;
      }

      case "LEADER": {
        DimensionCompiler.compileLeader(
          ent,
          ctx,
          {
            layers: this.layers,
            textStyles: this.textStyles,
          },
          result
        );
        break;
      }

      case "INSERT": {
        this.visitInsert(ent, ctx, result);
        break;
      }

      default:
        break;
    }
  }

  /**
   * INSERT varlığını ve referans verdiği blok tanımını açar
   */
  private visitInsert(
    insert: CadInsertEntity,
    ctx: VisitorContext,
    result: VisitorResult
  ): void {
    if (ctx.depth > this.maxDepth) {
      result.diagnostics.push({
        code: "MAX_DEPTH_EXCEEDED",
        message: `Maksimum blok derinliği (${this.maxDepth}) aşıldı: ${insert.blockName}`,
        blockName: insert.blockName,
        handle: insert.handle,
        depth: ctx.depth,
      });
      return;
    }

    const block = this.blocks[insert.blockName];
    if (!block) {
      result.diagnostics.push({
        code: "MISSING_BLOCK_DEFINITION",
        message: `Blok tanımı bulunamadı: ${insert.blockName}`,
        blockName: insert.blockName,
        handle: insert.handle,
      });
      return;
    }

    if (ctx.ancestors.has(insert.blockName)) {
      result.diagnostics.push({
        code: "CYCLIC_BLOCK_REFERENCE",
        message: `Döngüsel blok referansı tespit edildi: ${insert.blockName}`,
        blockName: insert.blockName,
        handle: insert.handle,
      });
      return;
    }

    const nextAncestors = new Set(ctx.ancestors);
    nextAncestors.add(insert.blockName);

    // INSERT yerel 4x4 matrisi
    const localMatrix = computeInsertMatrix({
      basePoint: block.basePoint || [0, 0],
      insertionPoint: insert.insertionPoint || [0, 0],
      scale: insert.scale || [1, 1, 1],
      rotationRad: insert.rotationRad || 0,
      extrusionDirection: insert.extrusionDirection,
    });

    // Parent stack soldan çarpar
    const currentMatrix = multiplyMatrix4x4(ctx.transform, localMatrix);

    for (const child of block.entities) {
      if (result.isBudgetExceeded) break;

      if (child.visible === false) {
        result.diagnostics.push({
          code: "INVISIBLE_BLOCK_CHILDREN",
          message: `Görünmez blok çocuğu dışlandı: ${child.handle}`,
          handle: child.handle,
          blockName: insert.blockName,
        });
        continue;
      }

      const childEffectiveLayer = child.layer === "0" ? ctx.effectiveLayer : child.layer;
      const nextParentInserts = ctx.parentInserts ? [...ctx.parentInserts, insert] : [insert];

      const effectiveClipBoundary = insert.clipBoundary || ctx.clipBoundary;

      const childContext: VisitorContext = {
        transform: currentMatrix,
        effectiveLayer: childEffectiveLayer,
        order: insert.order,
        parentInsert: insert,
        parentInserts: nextParentInserts,
          ancestors: nextAncestors,
          depth: ctx.depth + 1,
          insertPath: [...ctx.insertPath, insert.blockName],
          viewportId: ctx.viewportId,
          layerOverrides: ctx.layerOverrides,
          clipBoundary: effectiveClipBoundary,
          downstreamTransformSingularValue: ctx.downstreamTransformSingularValue,
      };

      this.visitEntity(child, childContext, result);
    }
  }

  private addSegment(
    p0: [number, number],
    p1: [number, number],
    ctx: VisitorContext,
    color: [number, number, number],
    result: VisitorResult,
    isAci7?: boolean,
    alpha?: number,
    lineweightMm?: number,
    curveSource?: AnalyticCurveSourceSegment,
    splineCurveTessellationErrorWorld?: number,
    bulgeCurveTessellationErrorWorld?: number,
    hatchBoundaryTessellationErrorWorld?: number,
    ellipseCurveTessellationErrorWorld?: number
  ): void {
    // F06: XCLIP sınır kontrolü (Normal ve Inverted çokgen kırpma)
    if (
      ctx.clipBoundary &&
      ctx.clipBoundary.isClippingEnabled !== false &&
      ctx.clipBoundary.boundaryVertices &&
      ctx.clipBoundary.boundaryVertices.length >= 3
    ) {
      const clipped = LayoutManager.clipLineToPolygon(
        p0,
        p1,
        ctx.clipBoundary.boundaryVertices,
        ctx.clipBoundary.isInverted
      );
      for (const seg of clipped) {
        result.segments.push({
          x0: seg[0][0],
          y0: seg[0][1],
          x1: seg[1][0],
          y1: seg[1][1],
          layer: ctx.effectiveLayer,
          order: ctx.order,
          color,
          isAci7,
          alpha,
          lineweightMm,
        });
        result.totalPrimitivesProduced++;
        result.minX = Math.min(result.minX, seg[0][0], seg[1][0]);
        result.minY = Math.min(result.minY, seg[0][1], seg[1][1]);
        result.maxX = Math.max(result.maxX, seg[0][0], seg[1][0]);
        result.maxY = Math.max(result.maxY, seg[0][1], seg[1][1]);
      }
      return;
    }

    result.segments.push({
      x0: p0[0],
      y0: p0[1],
      x1: p1[0],
      y1: p1[1],
      layer: ctx.effectiveLayer,
      order: ctx.order,
      color,
      isAci7,
      alpha,
      lineweightMm,
      curveSource,
      ...(Number.isFinite(splineCurveTessellationErrorWorld) ? { splineCurveTessellationErrorWorld } : {}),
      ...(Number.isFinite(ellipseCurveTessellationErrorWorld) ? { ellipseCurveTessellationErrorWorld } : {}),
      ...(Number.isFinite(bulgeCurveTessellationErrorWorld) ? { bulgeCurveTessellationErrorWorld } : {}),
      ...(Number.isFinite(hatchBoundaryTessellationErrorWorld) ? { hatchBoundaryTessellationErrorWorld } : {}),
    });
    result.totalPrimitivesProduced++;
    result.minX = Math.min(result.minX, p0[0], p1[0]);
    result.minY = Math.min(result.minY, p0[1], p1[1]);
    result.maxX = Math.max(result.maxX, p0[0], p1[0]);
    result.maxY = Math.max(result.maxY, p0[1], p1[1]);
  }

  private addCurvePoints(
    points: Array<[number, number]>,
    ctx: VisitorContext,
    color: [number, number, number],
    result: VisitorResult,
    isAci7?: boolean,
    alpha?: number,
    lineweightMm?: number,
    source?: Omit<AnalyticCurveSourceSegment, "segmentIndex" | "center" | "basisU" | "basisV" | "startParam" | "endParam"> & {
      center: [number, number];
      basisU: [number, number];
      basisV: [number, number];
      startParam: number;
      endParam: number;
    },
    splineCurveTessellationErrorWorld?: number,
    ellipseCurveTessellationErrorWorld?: number
  ): void {
    for (let index = 0; index + 1 < points.length; index++) {
      const p0 = transformPoint2D(ctx.transform, points[index]!);
      const p1 = transformPoint2D(ctx.transform, points[index + 1]!);
      const curveSource = source ? {
        ...source,
        center: transformPoint2D(ctx.transform, source.center),
        basisU: [
          ctx.transform[0]! * source.basisU[0] + ctx.transform[4]! * source.basisU[1],
          ctx.transform[1]! * source.basisU[0] + ctx.transform[5]! * source.basisU[1],
        ] as [number, number],
        basisV: [
          ctx.transform[0]! * source.basisV[0] + ctx.transform[4]! * source.basisV[1],
          ctx.transform[1]! * source.basisV[0] + ctx.transform[5]! * source.basisV[1],
        ] as [number, number],
        startParam: source.startParam + (source.endParam - source.startParam) * index / (points.length - 1),
        endParam: source.startParam + (source.endParam - source.startParam) * (index + 1) / (points.length - 1),
        segmentIndex: index,
      } : undefined;
      this.addSegment(
        p0, p1, ctx, color, result, isAci7, alpha, lineweightMm,
        curveSource, splineCurveTessellationErrorWorld, undefined, undefined, ellipseCurveTessellationErrorWorld,
      );
    }
  }

  private transformCurveSource(ctx: VisitorContext, source: AnalyticCurveSourceSegment): AnalyticCurveSourceSegment {
    const instancePath = (ctx.parentInserts ?? []).map((insert) => insert.handle).join("/");
    return {
      ...source,
      curveId: instancePath ? `${instancePath}:${source.curveId}` : source.curveId,
      center: transformPoint2D(ctx.transform, source.center),
      basisU: [
        ctx.transform[0]! * source.basisU[0] + ctx.transform[4]! * source.basisU[1],
        ctx.transform[1]! * source.basisU[0] + ctx.transform[5]! * source.basisU[1],
      ],
      basisV: [
        ctx.transform[0]! * source.basisV[0] + ctx.transform[4]! * source.basisV[1],
        ctx.transform[1]! * source.basisV[0] + ctx.transform[5]! * source.basisV[1],
      ],
      ...(source.splineSource ? {
        splineSource: {
          controlPoints: source.splineSource.controlPoints.map((point) => transformPoint2D(ctx.transform, point)),
          weights: source.splineSource.weights,
        },
      } : {}),
    };
  }

  private getInstanceCurveId(ctx: VisitorContext, handle: string, type: "CIRCLE" | "ARC" | "ELLIPSE"): string {
    const instancePath = (ctx.parentInserts ?? []).map((insert) => insert.handle).join("/");
    return `${instancePath}:${handle}:${type}`;
  }
}
