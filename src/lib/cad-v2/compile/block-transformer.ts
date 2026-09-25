// ============================================================================
// DWG/DXF MOTOR V2 — BLOCK & INSERT TRANSFORMER (G06)
// ============================================================================
// Sözleşme: motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md (G06), R06, R12
// - 2D Affine transform: translate(-basePoint) -> scale(sx, sy) -> rotate(rad) -> translate(insertionPoint)
// - Negative ve non-uniform scale desteği
// - Layer 0 kalıtımı: Blok içindeki layer "0" varlıkları INSERT'in katmanını miras alır
// - BYBLOCK/BYLAYER renk ve çizgi kalınlığı kalıtımı
// - Nested INSERT ve döngüsel referans (cycle/depth) koruması

import type {
  CadBlockDefinition,
  CadInsertEntity,
  CadEntity,
  CadLayer,
  CadPoint2D,
} from "../canonical/types";
import {
  Matrix4x4,
  computeInsertMatrix,
  transformPoint2D,
  createIdentityMatrix,
} from "./coordinate-transform";
import {
  EntityVisitor,
  VisitorContext,
  VisitorResult,
  TransformedSegment,
} from "./entity-visitor";

export type { TransformedSegment };

export interface BlockExpansionOptions {
  blocks: Record<string, CadBlockDefinition>;
  layers: Record<string, CadLayer>;
  linetypes?: Record<string, any>;
  textStyles?: Record<string, any>;
  maxDepth?: number;
  maxTotalEntities?: number;
  maxCurveErrorWorld?: number;
  maxCurveSegments?: number;
}

export class BlockTransformer {
  private visitor: EntityVisitor;
  private lastResult: VisitorResult | null = null;

  constructor(options: BlockExpansionOptions) {
    this.visitor = new EntityVisitor(options);
  }

  /**
   * 2D bir noktayı INSERT dönüşüm matrisine göre dönüştürür (P05: 4x4 Float64 affine stack)
   */
  public static transformPoint(
    point: CadPoint2D,
    basePoint: CadPoint2D,
    insertionPoint: CadPoint2D,
    scale: [number, number, number],
    rotationRad: number,
    extrusionDirection?: [number, number, number]
  ): CadPoint2D {
    const m = computeInsertMatrix({
      basePoint,
      insertionPoint,
      scale,
      rotationRad,
      extrusionDirection,
    });
    return transformPoint2D(m, point);
  }

  /**
   * Bir INSERT varlığını ve alt bloklarını düzleştirerek çizgi segmentlerine açar (P06: EntityVisitor)
   */
  public expandInsert(
    insert: CadInsertEntity,
    ancestors: Set<string> = new Set(),
    depth = 0,
    parentMatrix?: Matrix4x4
  ): TransformedSegment[] {
    const result = this.visitor.createEmptyResult();
    const ctx: VisitorContext = {
      transform: parentMatrix || createIdentityMatrix(),
      effectiveLayer: insert.layer,
      order: insert.order,
      parentInsert: insert,
      ancestors,
      depth,
      insertPath: [],
    };
    this.visitor.visitEntity(insert, ctx, result);
    this.lastResult = result;
    return result.segments;
  }

  public getLastResult(): VisitorResult | null {
    return this.lastResult;
  }

  public getVisitor(): EntityVisitor {
    return this.visitor;
  }
}
