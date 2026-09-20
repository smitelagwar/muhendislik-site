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
import { GeometryCompiler } from "./geometry-compiler";
import { resolveEntityColor } from "./cad-color-resolver";

export interface TransformedSegment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  layer: string;
  order: bigint;
  color?: [number, number, number];
  colorRgb?: number;
}

export interface BlockExpansionOptions {
  blocks: Record<string, CadBlockDefinition>;
  layers: Record<string, CadLayer>;
  maxDepth?: number;
  maxTotalEntities?: number;
}

export class BlockTransformer {
  private blocks: Record<string, CadBlockDefinition>;
  private layers: Record<string, CadLayer>;
  private maxDepth: number;
  private maxTotalEntities: number;
  private totalExpanded = 0;
  private warnedTotalExpanded = false;

  constructor(options: BlockExpansionOptions) {
    this.blocks = options.blocks;
    this.layers = options.layers;
    this.maxDepth = options.maxDepth ?? 32;
    this.maxTotalEntities = options.maxTotalEntities ?? 500000;
  }

  /**
   * 2D bir noktayı INSERT dönüşüm matrisine göre dönüştürür
   */
  public static transformPoint(
    point: CadPoint2D,
    basePoint: CadPoint2D,
    insertionPoint: CadPoint2D,
    scale: [number, number, number],
    rotationRad: number
  ): CadPoint2D {
    // 1. Base point çıkar
    let x = point[0] - basePoint[0];
    let y = point[1] - basePoint[1];

    // 2. Ölçekle (negatif ve non-uniform scale destekli)
    x *= scale[0];
    y *= scale[1];

    // 3. Döndür
    if (rotationRad !== 0) {
      const cos = Math.cos(rotationRad);
      const sin = Math.sin(rotationRad);
      const rx = x * cos - y * sin;
      const ry = x * sin + y * cos;
      x = rx;
      y = ry;
    }

    // 4. Insertion point ekle
    return [x + insertionPoint[0], y + insertionPoint[1]];
  }

  /**
   * Bir INSERT varlığını ve alt bloklarını düzleştirerek çizgi segmentlerine açar
   */
  public expandInsert(
    insert: CadInsertEntity,
    ancestors: Set<string> = new Set(),
    depth = 0
  ): TransformedSegment[] {
    if (depth > this.maxDepth) {
      console.warn(`[BlockTransformer] Derinlik sınırı aşıldı (${this.maxDepth}): ${insert.blockName}`);
      return [];
    }

    if (this.totalExpanded >= this.maxTotalEntities) {
      if (!this.warnedTotalExpanded) {
        console.warn(`[BlockTransformer] Toplam genişletme sınırı aşıldı: ${this.maxTotalEntities}`);
        this.warnedTotalExpanded = true;
      }
      return [];
    }

    const block = this.blocks[insert.blockName];
    if (!block) {
      // Blok tanımı bulunamadı (eksik blok veya proxy)
      return [];
    }

    // Döngüsel referans (cycle) kontrolü
    if (ancestors.has(insert.blockName)) {
      console.warn(`[BlockTransformer] Döngüsel blok referansı tespit edildi: ${insert.blockName}`);
      return [];
    }

    const nextAncestors = new Set(ancestors);
    nextAncestors.add(insert.blockName);

    const segments: TransformedSegment[] = [];
    const basePoint = block.basePoint || [0, 0];
    const insertionPoint = insert.insertionPoint || [0, 0];
    const scale = insert.scale || [1, 1, 1];
    const rotationRad = insert.rotationRad || 0;

    for (const child of block.entities) {
      this.totalExpanded++;
      if (this.totalExpanded >= this.maxTotalEntities) break;

      // Katman 0 kuralı: Blok içindeki "0" katmanındaki nesneler INSERT'in katmanını alır
      const effectiveLayer = child.layer === "0" ? insert.layer : child.layer;

      // Katman donuk (frozen) ise çizilmez
      const layerDef = this.layers[effectiveLayer];
      if (layerDef && layerDef.frozen) continue;

      const childColor = child.color?.method === "byBlock"
        ? (insert.color ? resolveEntityColor(insert, this.layers) : resolveEntityColor({ layer: effectiveLayer }, this.layers))
        : resolveEntityColor({ color: child.color, layer: effectiveLayer }, this.layers);

      switch (child.type) {
        case "LINE": {
          const p0 = BlockTransformer.transformPoint(child.start, basePoint, insertionPoint, scale, rotationRad);
          const p1 = BlockTransformer.transformPoint(child.end, basePoint, insertionPoint, scale, rotationRad);
          segments.push({
            x0: p0[0],
            y0: p0[1],
            x1: p1[0],
            y1: p1[1],
            layer: effectiveLayer,
            order: insert.order,
            color: childColor,
          });
          break;
        }

        case "CIRCLE": {
          const center = BlockTransformer.transformPoint(child.center, basePoint, insertionPoint, scale, rotationRad);
          // Eşit olmayan ölçekte elips benzeri segmentasyon gerekir, ortalama yarıçap kullanılır
          const avgScale = (Math.abs(scale[0]) + Math.abs(scale[1])) / 2;
          const r = child.radius * avgScale;
          const numSegs = 32;
          let prevX = center[0] + r;
          let prevY = center[1];
          for (let i = 1; i <= numSegs; i++) {
            const theta = (i * 2 * Math.PI) / numSegs;
            const x = center[0] + r * Math.cos(theta);
            const y = center[1] + r * Math.sin(theta);
            segments.push({
              x0: prevX,
              y0: prevY,
              x1: x,
              y1: y,
              layer: effectiveLayer,
              order: insert.order,
              color: childColor,
            });
            prevX = x;
            prevY = y;
          }
          break;
        }

        case "ARC": {
          const center = BlockTransformer.transformPoint(child.center, basePoint, insertionPoint, scale, rotationRad);
          const avgScale = (Math.abs(scale[0]) + Math.abs(scale[1])) / 2;
          const r = child.radius * avgScale;
          let startA = child.startAngleRad + rotationRad;
          let endA = child.endAngleRad + rotationRad;
          // Negatif ölçekleme açıyı tersine çevirebilir
          if (scale[0] * scale[1] < 0) {
            const tmp = startA;
            startA = -endA;
            endA = -tmp;
          }
          let sweep = endA - startA;
          if (sweep < 0) sweep += Math.PI * 2;
          const numSegs = Math.max(8, Math.round((sweep / (Math.PI * 2)) * 32));
          let prevX = center[0] + r * Math.cos(startA);
          let prevY = center[1] + r * Math.sin(startA);
          for (let i = 1; i <= numSegs; i++) {
            const theta = startA + (sweep * i) / numSegs;
            const x = center[0] + r * Math.cos(theta);
            const y = center[1] + r * Math.sin(theta);
            segments.push({
              x0: prevX,
              y0: prevY,
              x1: x,
              y1: y,
              layer: effectiveLayer,
              order: insert.order,
              color: childColor,
            });
            prevX = x;
            prevY = y;
          }
          break;
        }

        case "LWPOLYLINE": {
          const expanded = GeometryCompiler.expandLwPolyline(child);
          for (const seg of expanded.lineSegments) {
            const p0 = BlockTransformer.transformPoint([seg.x0, seg.y0], basePoint, insertionPoint, scale, rotationRad);
            const p1 = BlockTransformer.transformPoint([seg.x1, seg.y1], basePoint, insertionPoint, scale, rotationRad);
            segments.push({
              x0: p0[0],
              y0: p0[1],
              x1: p1[0],
              y1: p1[1],
              layer: effectiveLayer,
              order: insert.order,
              color: childColor,
            });
          }
          break;
        }

        case "ELLIPSE": {
          const center = BlockTransformer.transformPoint(child.center, basePoint, insertionPoint, scale, rotationRad);
          const major = BlockTransformer.transformPoint(child.majorAxisVector, [0, 0], [0, 0], scale, rotationRad);
          const pts = GeometryCompiler.tessellateEllipse(center, major, child.axisRatio, child.startParam, child.endParam);
          for (let i = 0; i < pts.length - 1; i++) {
            segments.push({
              x0: pts[i][0],
              y0: pts[i][1],
              x1: pts[i + 1][0],
              y1: pts[i + 1][1],
              layer: effectiveLayer,
              order: insert.order,
              color: childColor,
            });
          }
          break;
        }

        case "SPLINE": {
          const transformedCp = child.controlPoints.map((cp) =>
            BlockTransformer.transformPoint(cp, basePoint, insertionPoint, scale, rotationRad)
          );
          const pts = GeometryCompiler.tessellateSpline({
            ...child,
            controlPoints: transformedCp,
          });
          for (let i = 0; i < pts.length - 1; i++) {
            segments.push({
              x0: pts[i][0],
              y0: pts[i][1],
              x1: pts[i + 1][0],
              y1: pts[i + 1][1],
              layer: effectiveLayer,
              order: insert.order,
              color: childColor,
            });
          }
          break;
        }

        case "HATCH": {
          const transformedLoops = child.loops.map((loop) => {
            if (loop.isPolyline && loop.vertices) {
              return {
                ...loop,
                vertices: loop.vertices.map((v) =>
                  BlockTransformer.transformPoint(v, basePoint, insertionPoint, scale, rotationRad)
                ),
              };
            }
            return loop;
          });
          const hatchRes = GeometryCompiler.triangulateHatch({
            ...child,
            layer: effectiveLayer,
            loops: transformedLoops,
          });
          for (const seg of hatchRes.boundaryLines) {
            segments.push({
              ...seg,
              order: insert.order,
              color: childColor,
            });
          }
          break;
        }

        case "INSERT": {
          // İçiçe (nested) INSERT genişletmesi
          // Alt INSERT'in konumunu geçerli blok dönüşümü ile dönüştür
          const nestedPos = BlockTransformer.transformPoint(
            child.insertionPoint,
            basePoint,
            insertionPoint,
            scale,
            rotationRad
          );
          const nestedScale: [number, number, number] = [
            child.scale[0] * scale[0],
            child.scale[1] * scale[1],
            child.scale[2] * scale[2],
          ];
          const nestedRot = child.rotationRad + rotationRad;

          const transformedChildInsert: CadInsertEntity = {
            ...child,
            layer: child.layer === "0" ? effectiveLayer : child.layer,
            insertionPoint: nestedPos,
            scale: nestedScale,
            rotationRad: nestedRot,
            order: insert.order,
          };

          const nestedSegs = this.expandInsert(transformedChildInsert, nextAncestors, depth + 1);
          for (let s = 0; s < nestedSegs.length; s++) {
            segments.push(nestedSegs[s]);
          }
          break;
        }

        default:
          break;
      }
    }

    return segments;
  }
}
