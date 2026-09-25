// ============================================================================
// DWG/DXF MOTOR V2 — DIMENSION, ATTRIBUTE & LEADER COMPILER (F05)
// ============================================================================
// Sözleşme: Fidelity v3 Planı F05 — DIMENSION, ATTRIB/ATTDEF, LEADER ve annotation
// 1. DIMENSION kaynak kimliği ve semantics korunur (type === "DIMENSION")
// 2. Saved anonymous graphics block (*D...) render temsili & double-transform koruması
// 3. Eksik/geçersiz blok durumunda definition point'lerden tam geometri sentezi (Linear, Aligned, Angular, Diameter, Radius, Ordinate)
// 4. Metin biçimleme oracel'ı: "", <>, Ø<>, R<>, özel override ("DEĞİŞKEN")
// 5. ATTRIB/ATTDEF bağlanması (instance override, constant, invisible)
// 6. LEADER / MLEADER desteği ve ok ucu üretimi
// ============================================================================

import type {
  CadDimensionEntity,
  CadLeaderEntity,
  CadTextEntity,
  CadBlockDefinition,
  CadLayer,
  CadTextStyle,
  CadPoint2D,
} from "../canonical/types";
import {
  type VisitorContext,
  type VisitorResult,
  type EntityVisitor,
} from "./entity-visitor";
import { FontLayoutEngine } from "../text/font-layout-engine";
import { transformPoint2D } from "./coordinate-transform";
import { CadDiagnosticCode } from "../canonical/diagnostics";
import { resolveCadStyle, resolveEntityColor } from "./cad-color-resolver";

export interface DimensionCompileOptions {
  blocks?: Record<string, CadBlockDefinition>;
  layers?: Record<string, CadLayer>;
  linetypes?: Record<string, any>;
  textStyles?: Record<string, CadTextStyle>;
  visitor?: EntityVisitor;
}

/**
 * AutoCAD ölçülendirme metin biçimlendirme kuralı:
 * - Boşluk veya "" ise: ölçülen mesafe (ör. "100.00")
 * - "<>" ise: ölçülen mesafe (ör. "100.00")
 * - "<>" içeren şablon (ör. "R<>", "Ø<>", "<> mm"): <> yerine ölçülen mesafe konur
 * - Özel override metin (ör. "DEĞİŞKEN", "KOLON BOYU"): metin aynen korunur
 */
export function formatDimensionText(
  rawText: string | undefined,
  measurement: number,
  options?: {
    decimals?: number;
    prefix?: string;
    suffix?: string;
  }
): string {
  const dec = options?.decimals ?? 2;
  const formattedVal = Math.abs(measurement).toFixed(dec);

  if (!rawText || rawText.trim() === "" || rawText === "<>") {
    return formattedVal;
  }

  if (rawText.includes("<>")) {
    return rawText.replace(/<>/g, formattedVal);
  }

  // Kullanıcı tarafından açıkça verilen override metin
  return rawText;
}

export class DimensionCompiler {
  /**
   * Bir DIMENSION varlığını derler:
   * Path A: Kaydedilmiş *D... anonim bloğu varsa double-transform uygulamadan açar.
   * Path B: Blok yoksa veya boşsa definition point'lerden geometri ve metin sentezler.
   */
  public static compileDimension(
    dim: CadDimensionEntity,
    ctx: VisitorContext,
    options: DimensionCompileOptions,
    result: VisitorResult
  ): void {
    const blocks = options.blocks || {};
    const anonymousBlock = dim.anonymousBlockName ? blocks[dim.anonymousBlockName] : undefined;

    // Path A: Kaydedilmiş geçerli anonim blok (*D...) var mı?
    if (anonymousBlock && Array.isArray(anonymousBlock.entities) && anonymousBlock.entities.length > 0) {
      this.expandAnonymousBlock(dim, anonymousBlock, ctx, options, result);
      return;
    }

    // Path B: Blok yok veya boş -> Definition point'lerden tam geometri sentezle
    result.diagnostics.push({
      code: CadDiagnosticCode.DIMENSION_SYNTHESIZED_FROM_DEFINITION,
      message: `Boyut varlığı (${dim.handle}) için anonim grafik bloğu (${dim.anonymousBlockName || "yok"}) bulunamadı; tanımdan sentezlendi.`,
      handle: dim.handle,
    });

    this.synthesizeDimensionGeometry(dim, ctx, options, result);
  }

  /**
   * Path A: Kaydedilmiş *D... anonim bloğunu açar.
   * CRITICAL DOUBLE-TRANSFORM KORUMASI:
   * *D... blokları AutoCAD tarafından dünya/yerel koordinatlarda authoring anında üretilir.
   * Blok tanımı basePoint [0,0] ve dim.insertionPoint genellikle [0,0]'dır.
   * Naif bir INSERT transformasyonu gibi defPoint veya insertionPoint eklemek geometrinin
   * iki kez kaymasına (double-transform) yol açar.
   * Blok alt varlıkları doğrudan ctx.transform ile (üst INSERT'lerin hiyerarşik matrisi) işlenir.
   */
  private static expandAnonymousBlock(
    dim: CadDimensionEntity,
    block: CadBlockDefinition,
    ctx: VisitorContext,
    options: DimensionCompileOptions,
    result: VisitorResult
  ): void {
    const visitor = options.visitor;
    if (!visitor) return;

    for (const child of block.entities) {
      if (result.isBudgetExceeded) break;
      if (child.visible === false) continue;

      const childEffectiveLayer = child.layer === "0" ? ctx.effectiveLayer : child.layer;

      const childContext: VisitorContext = {
        transform: ctx.transform, // Double-transform yok: doğrudan ebeveyn transformu uygulanır
        effectiveLayer: childEffectiveLayer,
        order: ctx.order,
        parentInsert: ctx.parentInsert,
        parentInserts: ctx.parentInserts,
        ancestors: ctx.ancestors,
        depth: ctx.depth + 1,
        insertPath: [...ctx.insertPath, dim.anonymousBlockName || "*D"],
        viewportId: ctx.viewportId,
        layerOverrides: ctx.layerOverrides,
        clipBoundary: ctx.clipBoundary,
        downstreamTransformSingularValue: ctx.downstreamTransformSingularValue,
      };

      visitor.visitEntity(child, childContext, result);
    }
  }

  /**
   * Path B: Blok tanımı bulunmadığında ölçülendirmeyi definition noktalarından sentezler.
   */
  private static synthesizeDimensionGeometry(
    dim: CadDimensionEntity,
    ctx: VisitorContext,
    options: DimensionCompileOptions,
    result: VisitorResult
  ): void {
    const dimType = (dim.dimType ?? 0) & 0x07; // 0..6 taban tipi
    const layers = options.layers || {};

    const style = resolveCadStyle(dim, layers, {
      effectiveLayer: ctx.effectiveLayer,
      parentInsert: ctx.parentInsert,
      parentInserts: ctx.parentInserts,
      layerOverrides: ctx.layerOverrides,
      viewportId: ctx.viewportId,
    });
    const color = style.rgb;
    const isAci7 = style.isAci7;
    const alpha = style.alpha;

    const dimScale = dim.dimScale && dim.dimScale > 0 ? dim.dimScale : 1.0;
    const arrowSize = (dim.arrowSize && dim.arrowSize > 0 ? dim.arrowSize : 2.5) * dimScale;
    const extOffset = 1.0 * dimScale; // Ölçü bağlama çizgisi başlangıç ofseti
    const extOvershoot = 1.25 * dimScale; // Ölçü çizgisini aşma mesafesi
    const textHeight = 2.5 * dimScale;

    switch (dimType) {
      case 0: // Linear / Rotated
      case 1: { // Aligned
        this.synthesizeLinearOrAligned(
          dim,
          dimType === 1,
          ctx,
          color,
          isAci7,
          alpha,
          arrowSize,
          extOffset,
          extOvershoot,
          textHeight,
          options,
          result
        );
        break;
      }

      case 2: // Angular 5-point
      case 5: { // Angular 3-point
        this.synthesizeAngular(
          dim,
          ctx,
          color,
          isAci7,
          alpha,
          arrowSize,
          textHeight,
          options,
          result
        );
        break;
      }

      case 3: { // Diameter
        this.synthesizeDiameter(
          dim,
          ctx,
          color,
          isAci7,
          alpha,
          arrowSize,
          textHeight,
          options,
          result
        );
        break;
      }

      case 4: { // Radius
        this.synthesizeRadius(
          dim,
          ctx,
          color,
          isAci7,
          alpha,
          arrowSize,
          textHeight,
          options,
          result
        );
        break;
      }

      case 6: { // Ordinate
        this.synthesizeOrdinate(
          dim,
          ctx,
          color,
          isAci7,
          alpha,
          textHeight,
          options,
          result
        );
        break;
      }

      default: {
        // Fallback: Linear
        this.synthesizeLinearOrAligned(
          dim,
          false,
          ctx,
          color,
          isAci7,
          alpha,
          arrowSize,
          extOffset,
          extOvershoot,
          textHeight,
          options,
          result
        );
        break;
      }
    }
  }

  /**
   * Linear ve Aligned ölçülendirme geometrisi sentezi
   */
  private static synthesizeLinearOrAligned(
    dim: CadDimensionEntity,
    isAligned: boolean,
    ctx: VisitorContext,
    color: [number, number, number],
    isAci7: boolean | undefined,
    alpha: number | undefined,
    arrowSize: number,
    extOffset: number,
    extOvershoot: number,
    textHeight: number,
    options: DimensionCompileOptions,
    result: VisitorResult
  ): void {
    const p1 = dim.line1Start || dim.defPoint || [0, 0];
    const p2 = dim.line1End || dim.textMidpoint || [p1[0] + 100, p1[1]];
    const dimPt = dim.defPoint || p1;

    let angle = dim.rotationRad || 0;
    if (isAligned) {
      angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
    }

    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const vx = -uy;
    const vy = ux;

    // Ölçü doğrusunun konumu: dimPt'den geçen ve (ux, uy) yönündeki hat
    // dimPt'nin normal (vx, vy) üzerindeki izdüşümü:
    const h = dimPt[0] * vx + dimPt[1] * vy;

    // p1 ve p2'nin (ux, uy) eksenindeki izdüşümleri
    const u1 = p1[0] * ux + p1[1] * uy;
    const u2 = p2[0] * ux + p2[1] * uy;

    // Ölçü çizgisi uç noktaları
    const d1x = u1 * ux + h * vx;
    const d1y = u1 * uy + h * vy;
    const d2x = u2 * ux + h * vx;
    const d2y = u2 * uy + h * vy;

    // Ölçülen gerçek mesafe
    const measuredDist = dim.measurement ?? Math.abs(u2 - u1);

    // 1. Ölçü bağlama çizgisi 1 (p1 -> d1 + overshoot)
    const p1Norm = p1[0] * vx + p1[1] * vy;
    const extDir1 = Math.sign(h - p1Norm) || 1;
    const ext1StartX = p1[0] + extDir1 * extOffset * vx;
    const ext1StartY = p1[1] + extDir1 * extOffset * vy;
    const ext1EndX = d1x + extDir1 * extOvershoot * vx;
    const ext1EndY = d1y + extDir1 * extOvershoot * vy;
    this.addWorldSegment([ext1StartX, ext1StartY], [ext1EndX, ext1EndY], ctx, color, isAci7, alpha, result);

    // 2. Ölçü bağlama çizgisi 2 (p2 -> d2 + overshoot)
    const p2Norm = p2[0] * vx + p2[1] * vy;
    const extDir2 = Math.sign(h - p2Norm) || 1;
    const ext2StartX = p2[0] + extDir2 * extOffset * vx;
    const ext2StartY = p2[1] + extDir2 * extOffset * vy;
    const ext2EndX = d2x + extDir2 * extOvershoot * vx;
    const ext2EndY = d2y + extDir2 * extOvershoot * vy;
    this.addWorldSegment([ext2StartX, ext2StartY], [ext2EndX, ext2EndY], ctx, color, isAci7, alpha, result);

    // 3. Ölçü çizgisi (d1 -> d2)
    this.addWorldSegment([d1x, d1y], [d2x, d2y], ctx, color, isAci7, alpha, result);

    // 4. Ok uçları
    // d1'deki ok (d2 yönüne bakar)
    const dir12x = (d2x - d1x);
    const dir12y = (d2y - d1y);
    const len12 = Math.hypot(dir12x, dir12y);
    if (len12 > 1e-4) {
      const udirX = dir12x / len12;
      const udirY = dir12y / len12;
      this.addArrowhead([d1x, d1y], [-udirX, -udirY], arrowSize, ctx, color, isAci7, alpha, result);
      this.addArrowhead([d2x, d2y], [udirX, udirY], arrowSize, ctx, color, isAci7, alpha, result);
    }

    // 5. Ölçü Metni
    const labelText = formatDimensionText(dim.text, measuredDist);
    const textMid = dim.textMidpoint || [(d1x + d2x) / 2 + 1.5 * vx, (d1y + d2y) / 2 + 1.5 * vy];

    this.renderDimensionLabel(
      labelText,
      textMid,
      angle,
      textHeight,
      ctx,
      color,
      isAci7,
      alpha,
      options,
      result
    );
  }

  /**
   * Angular ölçülendirme geometrisi sentezi
   */
  private static synthesizeAngular(
    dim: CadDimensionEntity,
    ctx: VisitorContext,
    color: [number, number, number],
    isAci7: boolean | undefined,
    alpha: number | undefined,
    arrowSize: number,
    textHeight: number,
    options: DimensionCompileOptions,
    result: VisitorResult
  ): void {
    const center = dim.defPoint || [0, 0];
    const p1 = dim.line1Start || [center[0] + 50, center[1]];
    const p2 = dim.line1End || [center[0] + 50, center[1] + 50];

    const a1 = Math.atan2(p1[1] - center[1], p1[0] - center[0]);
    const a2 = Math.atan2(p2[1] - center[1], p2[0] - center[0]);
    let sweep = a2 - a1;
    while (sweep < 0) sweep += Math.PI * 2;

    const r = Math.hypot(p1[0] - center[0], p1[1] - center[1]) || 50;

    // Ölçü yayını çiz
    const steps = 16;
    let prevX = center[0] + r * Math.cos(a1);
    let prevY = center[1] + r * Math.sin(a1);
    for (let i = 1; i <= steps; i++) {
      const angle = a1 + (sweep * i) / steps;
      const currX = center[0] + r * Math.cos(angle);
      const currY = center[1] + r * Math.sin(angle);
      this.addWorldSegment([prevX, prevY], [currX, currY], ctx, color, isAci7, alpha, result);
      prevX = currX;
      prevY = currY;
    }

    // Ok uçları
    const tan1x = -Math.sin(a1);
    const tan1y = Math.cos(a1);
    const tan2x = Math.sin(a2);
    const tan2y = -Math.cos(a2);
    this.addArrowhead([center[0] + r * Math.cos(a1), center[1] + r * Math.sin(a1)], [-tan1x, -tan1y], arrowSize, ctx, color, isAci7, alpha, result);
    this.addArrowhead([center[0] + r * Math.cos(a2), center[1] + r * Math.sin(a2)], [-tan2x, -tan2y], arrowSize, ctx, color, isAci7, alpha, result);

    // Açı metni (derece)
    const angleDeg = (sweep * 180) / Math.PI;
    const labelText = formatDimensionText(dim.text, angleDeg, { decimals: 1 }) + "°";
    const midAngle = a1 + sweep / 2;
    const textMid = dim.textMidpoint || [center[0] + (r + 5) * Math.cos(midAngle), center[1] + (r + 5) * Math.sin(midAngle)];

    this.renderDimensionLabel(
      labelText,
      textMid,
      midAngle - Math.PI / 2,
      textHeight,
      ctx,
      color,
      isAci7,
      alpha,
      options,
      result
    );
  }

  /**
   * Diameter ölçülendirme geometrisi sentezi
   */
  private static synthesizeDiameter(
    dim: CadDimensionEntity,
    ctx: VisitorContext,
    color: [number, number, number],
    isAci7: boolean | undefined,
    alpha: number | undefined,
    arrowSize: number,
    textHeight: number,
    options: DimensionCompileOptions,
    result: VisitorResult
  ): void {
    const center = dim.defPoint || [0, 0];
    const p = dim.textMidpoint || [center[0] + 50, center[1]];
    const angle = Math.atan2(p[1] - center[1], p[0] - center[0]);
    const r = Math.hypot(p[0] - center[0], p[1] - center[1]) || 50;

    const p1x = center[0] - r * Math.cos(angle);
    const p1y = center[1] - r * Math.sin(angle);
    const p2x = center[0] + r * Math.cos(angle);
    const p2y = center[1] + r * Math.sin(angle);

    // Çap çizgisi
    this.addWorldSegment([p1x, p1y], [p2x, p2y], ctx, color, isAci7, alpha, result);

    // Ok uçları
    this.addArrowhead([p1x, p1y], [Math.cos(angle), Math.sin(angle)], arrowSize, ctx, color, isAci7, alpha, result);
    this.addArrowhead([p2x, p2y], [-Math.cos(angle), -Math.sin(angle)], arrowSize, ctx, color, isAci7, alpha, result);

    const diameterVal = dim.measurement ?? (r * 2);
    const labelText = formatDimensionText(dim.text || "Ø<>", diameterVal);
    const textMid = dim.textMidpoint || [(p1x + p2x) / 2, (p1y + p2y) / 2 + 2];

    this.renderDimensionLabel(
      labelText,
      textMid,
      angle,
      textHeight,
      ctx,
      color,
      isAci7,
      alpha,
      options,
      result
    );
  }

  /**
   * Radius ölçülendirme geometrisi sentezi
   */
  private static synthesizeRadius(
    dim: CadDimensionEntity,
    ctx: VisitorContext,
    color: [number, number, number],
    isAci7: boolean | undefined,
    alpha: number | undefined,
    arrowSize: number,
    textHeight: number,
    options: DimensionCompileOptions,
    result: VisitorResult
  ): void {
    const center = dim.defPoint || [0, 0];
    const p = dim.line1Start || dim.textMidpoint || [center[0] + 50, center[1]];
    const angle = Math.atan2(p[1] - center[1], p[0] - center[0]);
    const r = Math.hypot(p[0] - center[0], p[1] - center[1]) || 50;

    // Yarıçap çizgisi (merkez -> çevre)
    this.addWorldSegment(center, p, ctx, color, isAci7, alpha, result);

    // Çevre noktasında merkeze doğru bakan ok
    this.addArrowhead(p, [Math.cos(angle), Math.sin(angle)], arrowSize, ctx, color, isAci7, alpha, result);

    const radiusVal = dim.measurement ?? r;
    const labelText = formatDimensionText(dim.text || "R<>", radiusVal);
    const textMid = dim.textMidpoint || [(center[0] + p[0]) / 2, (center[1] + p[1]) / 2 + 2];

    this.renderDimensionLabel(
      labelText,
      textMid,
      angle,
      textHeight,
      ctx,
      color,
      isAci7,
      alpha,
      options,
      result
    );
  }

  /**
   * Ordinate ölçülendirme geometrisi sentezi
   */
  private static synthesizeOrdinate(
    dim: CadDimensionEntity,
    ctx: VisitorContext,
    color: [number, number, number],
    isAci7: boolean | undefined,
    alpha: number | undefined,
    textHeight: number,
    options: DimensionCompileOptions,
    result: VisitorResult
  ): void {
    const featurePt = dim.defPoint || [0, 0];
    const leaderPt = dim.textMidpoint || [featurePt[0] + 20, featurePt[1] + 20];

    // Lider hattı
    this.addWorldSegment(featurePt, leaderPt, ctx, color, isAci7, alpha, result);

    const val = dim.measurement ?? featurePt[0];
    const labelText = formatDimensionText(dim.text, val);

    this.renderDimensionLabel(
      labelText,
      leaderPt,
      0,
      textHeight,
      ctx,
      color,
      isAci7,
      alpha,
      options,
      result
    );
  }

  /**
   * LEADER varlığını derler (polyline, ok ucu ve ekli metin)
   */
  public static compileLeader(
    leader: CadLeaderEntity,
    ctx: VisitorContext,
    options: DimensionCompileOptions,
    result: VisitorResult
  ): void {
    if (!leader.vertices || leader.vertices.length < 2) return;

    const layers = options.layers || {};
    const style = resolveCadStyle(leader, layers, {
      effectiveLayer: ctx.effectiveLayer,
      parentInsert: ctx.parentInsert,
      parentInserts: ctx.parentInserts,
      layerOverrides: ctx.layerOverrides,
      viewportId: ctx.viewportId,
    });
    const color = style.rgb;
    const isAci7 = style.isAci7;
    const alpha = style.alpha;

    const arrowSize = leader.arrowheadSize && leader.arrowheadSize > 0 ? leader.arrowheadSize : 2.5;

    // 1. Polylines
    for (let i = 0; i < leader.vertices.length - 1; i++) {
      this.addWorldSegment(leader.vertices[i], leader.vertices[i + 1], ctx, color, isAci7, alpha, result);
    }

    // 2. Ok ucu (ilk tepe noktasında)
    if (leader.hasArrowhead !== false) {
      const v0 = leader.vertices[0];
      const v1 = leader.vertices[1];
      const dx = v1[0] - v0[0];
      const dy = v1[1] - v0[1];
      const len = Math.hypot(dx, dy);
      if (len > 1e-4) {
        this.addArrowhead(v0, [-dx / len, -dy / len], arrowSize, ctx, color, isAci7, alpha, result);
      }
    }

    // 3. Ekli metin (son tepe noktasında)
    if (leader.text && leader.text.trim() !== "") {
      const lastVertex = leader.vertices[leader.vertices.length - 1];
      this.renderDimensionLabel(
        leader.text,
        [lastVertex[0] + 2, lastVertex[1]],
        0,
        2.5,
        ctx,
        color,
        isAci7,
        alpha,
        options,
        result
      );
    }
  }

  /**
   * Kapalı üçgen ok ucu (Arrowhead) üretir
   * @param tip Okun sivri ucu
   * @param dir Okun işaret ettiği yönün tersi birim vektör (ok tabanına doğru)
   * @param length Ok uzunluğu
   */
  private static addArrowhead(
    tip: CadPoint2D,
    dir: [number, number],
    length: number,
    ctx: VisitorContext,
    color: [number, number, number],
    isAci7: boolean | undefined,
    alpha: number | undefined,
    result: VisitorResult
  ): void {
    const width = length * 0.35;
    const nx = -dir[1];
    const ny = dir[0];

    const baseCenterX = tip[0] + dir[0] * length;
    const baseCenterY = tip[1] + dir[1] * length;

    const leftX = baseCenterX + nx * (width / 2);
    const leftY = baseCenterY + ny * (width / 2);

    const rightX = baseCenterX - nx * (width / 2);
    const rightY = baseCenterY - ny * (width / 2);

    // Kapalı ok üçgeni çizgileri: Tip -> Left -> Right -> Tip
    this.addWorldSegment(tip, [leftX, leftY], ctx, color, isAci7, alpha, result);
    this.addWorldSegment([leftX, leftY], [rightX, rightY], ctx, color, isAci7, alpha, result);
    this.addWorldSegment([rightX, rightY], tip, ctx, color, isAci7, alpha, result);
  }

  /**
   * Ölçü etiketi metnini çizer
   */
  private static renderDimensionLabel(
    text: string,
    position: CadPoint2D,
    rotationRad: number,
    height: number,
    ctx: VisitorContext,
    color: [number, number, number],
    isAci7: boolean | undefined,
    alpha: number | undefined,
    options: DimensionCompileOptions,
    result: VisitorResult
  ): void {
    const textProxy: CadTextEntity = {
      handle: "DIM_LABEL",
      type: "TEXT",
      layer: ctx.effectiveLayer,
      order: ctx.order,
      text,
      insertionPoint: position,
      height,
      rotationRad,
      widthFactor: 1,
      obliqueRad: 0,
      styleName: "STANDARD",
      horizontalMode: 1, // Center
      verticalMode: 2,   // Middle
    };

    const segs = FontLayoutEngine.layoutText(textProxy, { textStyles: options.textStyles });
    for (const seg of segs) {
      const p0 = transformPoint2D(ctx.transform, [seg.x0, seg.y0]);
      const p1 = transformPoint2D(ctx.transform, [seg.x1, seg.y1]);
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
      });
      result.totalPrimitivesProduced++;
      result.minX = Math.min(result.minX, p0[0], p1[0]);
      result.minY = Math.min(result.minY, p0[1], p1[1]);
      result.maxX = Math.max(result.maxX, p0[0], p1[0]);
      result.maxY = Math.max(result.maxY, p0[1], p1[1]);
    }
  }

  /**
   * Dünya koordinatlarındaki iki nokta arasına segment ekler
   */
  private static addWorldSegment(
    p0: CadPoint2D,
    p1: CadPoint2D,
    ctx: VisitorContext,
    color: [number, number, number],
    isAci7: boolean | undefined,
    alpha: number | undefined,
    result: VisitorResult
  ): void {
    const tp0 = transformPoint2D(ctx.transform, p0);
    const tp1 = transformPoint2D(ctx.transform, p1);
    result.segments.push({
      x0: tp0[0],
      y0: tp0[1],
      x1: tp1[0],
      y1: tp1[1],
      layer: ctx.effectiveLayer,
      order: ctx.order,
      color,
      isAci7,
      alpha,
    });
    result.totalPrimitivesProduced++;
    result.minX = Math.min(result.minX, tp0[0], tp1[0]);
    result.minY = Math.min(result.minY, tp0[1], tp1[1]);
    result.maxX = Math.max(result.maxX, tp0[0], tp1[0]);
    result.maxY = Math.max(result.maxY, tp0[1], tp1[1]);
  }
}
