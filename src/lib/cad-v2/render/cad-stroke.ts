// ============================================================================
// DWG/DXF MOTOR V2 — CAD STROKE & LINEWEIGHT ENGINE (F02)
// ============================================================================
// Sözleşme: DWG_DXF_Motor_V2_Kanitli_Kok_Neden_ve_Fidelity_Gemini_Uygulama_Plani_v3.md (F02)
// - LineBasicMaterial platform bağımlılığından bağımsız segment quad + join/cap + miter limit
// - Source lineweight (mm) ByLayer / ByBlock / Default çözümü
// - Hairline (0.00 mm) ve LWT off davranışı
// - Constant / per-vertex start-end polyline widths (dünya biriminde geometri)
// - Width + lineweight etkileşimi: polyline width önceliklidir, körlemesine toplanmaz
// - Sıfır uzunluk, kapalı köşe, keskin açı ve dejenere segment dayanıklılığı
// - Centerline değişmezliği (centerline invariant)

import type {
  CadPoint2D,
  CadEntity,
  CadLayer,
  CadInsertEntity,
  CadLinetype,
} from "../canonical/types";

/**
 * AutoCAD standart lineweight değerleri (mm cinsinden)
 */
export const AUTOCAD_LINEWEIGHTS_MM = [
  0.0, 0.05, 0.09, 0.13, 0.15, 0.18, 0.20, 0.25, 0.30, 0.35, 0.40, 0.50,
  0.53, 0.60, 0.70, 0.80, 0.90, 1.00, 1.06, 1.20, 1.40, 1.58, 2.00, 2.11,
] as const;

export const LINEWEIGHT_BY_LAYER = -1;
export const LINEWEIGHT_BY_BLOCK = -2;
export const LINEWEIGHT_DEFAULT = -3;
export const DEFAULT_LINEWEIGHT_MM = 0.25;

export interface LineweightResolutionContext {
  parentInsert?: CadInsertEntity;
  parentInserts?: CadInsertEntity[];
  layerOverrides?: Record<string, Partial<CadLayer>>;
}

export interface ResolvedLineweight {
  lineweightMm: number;
  sourceMethod: "explicit" | "byLayer" | "byBlock" | "default";
  isHairline: boolean;
}

/**
 * AutoCAD lineweight tam çözümü (ByLayer, ByBlock, Default, Layer Overrides)
 */
export function resolveEntityLineweight(
  ent: Pick<CadEntity, "layer" | "lineweightMm">,
  layers: Record<string, CadLayer>,
  ctx?: LineweightResolutionContext
): ResolvedLineweight {
  const lwVal = ent.lineweightMm;

  // 1. Açıkça belirtilmiş pozitif/sıfır lineweight (0.00 mm = Hairline)
  if (typeof lwVal === "number" && lwVal >= 0) {
    return {
      lineweightMm: lwVal,
      sourceMethod: "explicit",
      isHairline: lwVal <= 1e-4,
    };
  }

  // 2. ByBlock (lwVal === -2)
  if (lwVal === LINEWEIGHT_BY_BLOCK) {
    const parentStack = ctx?.parentInserts || (ctx?.parentInsert ? [ctx.parentInsert] : []);
    for (let i = parentStack.length - 1; i >= 0; i--) {
      const parent = parentStack[i];
      if (typeof parent.lineweightMm === "number" && parent.lineweightMm >= 0) {
        return {
          lineweightMm: parent.lineweightMm,
          sourceMethod: "byBlock",
          isHairline: parent.lineweightMm <= 1e-4,
        };
      }
      if (parent.lineweightMm === LINEWEIGHT_DEFAULT) {
        return {
          lineweightMm: DEFAULT_LINEWEIGHT_MM,
          sourceMethod: "byBlock",
          isHairline: false,
        };
      }
      // Parent ByLayer ise parent katmanının lineweight'ini al
      if (parent.lineweightMm === LINEWEIGHT_BY_LAYER || parent.lineweightMm === undefined) {
        const parentLyr = ctx?.layerOverrides?.[parent.layer] || layers[parent.layer];
        if (parentLyr && typeof parentLyr.lineweightMm === "number" && parentLyr.lineweightMm >= 0) {
          return {
            lineweightMm: parentLyr.lineweightMm,
            sourceMethod: "byBlock",
            isHairline: parentLyr.lineweightMm <= 1e-4,
          };
        }
      }
    }
  }

  // 3. ByLayer (lwVal === -1 veya undefined)
  const targetLayerName = ent.layer || "0";
  const effectiveLayer = ctx?.layerOverrides?.[targetLayerName] || layers[targetLayerName];
  if (effectiveLayer && typeof effectiveLayer.lineweightMm === "number") {
    const lyrLw = effectiveLayer.lineweightMm;
    if (lyrLw >= 0) {
      return {
        lineweightMm: lyrLw,
        sourceMethod: "byLayer",
        isHairline: lyrLw <= 1e-4,
      };
    }
    if (lyrLw === LINEWEIGHT_DEFAULT) {
      return {
        lineweightMm: DEFAULT_LINEWEIGHT_MM,
        sourceMethod: "default",
        isHairline: false,
      };
    }
  }

  // 4. Default (AutoCAD standard default = 0.25 mm)
  return {
    lineweightMm: DEFAULT_LINEWEIGHT_MM,
    sourceMethod: "default",
    isHairline: false,
  };
}

/**
 * Lineweight mm değerini tanımlı ekran piksel genişliğine çevirir.
 * 96 CSS px / 25.4 mm standart ekran profili.
 * Hairline (0.0 mm) her zaman 1px döner.
 */
export function lineweightToScreenPixels(
  lineweightMm: number,
  displayDpi = 96,
  minPixels = 1.0
): number {
  if (lineweightMm <= 1e-4) {
    return minPixels; // Hairline = 1.0 px
  }
  const pxPerMm = displayDpi / 25.4;
  return Math.max(minPixels, lineweightMm * pxPerMm);
}

export interface StrokeTessellationOptions {
  miterLimit?: number; // Varsayılan: 3.0 (AutoCAD benzeri)
}

export interface PolylineVertexWidth {
  point: CadPoint2D;
  startWidth?: number;
  endWidth?: number;
}

/**
 * Genişlikli (constantWidth veya start/end width) polyline'ı segment quad + miter/bevel join ile
 * ikili üçgen dizisine (TRIANGLES vertices: [x0, y0, x1, y1, x2, y2, ...]) dönüştürür.
 * Sıfır uzunluklu segmentler, aşırı keskin açılar ve taper durumları güvenle ele alınır.
 */
export function tessellatePolylineWithWidth(
  vertices: PolylineVertexWidth[],
  isClosed = false,
  options: StrokeTessellationOptions = {}
): Float64Array | null {
  if (!vertices || vertices.length < 2) return null;

  const miterLimit = options.miterLimit ?? 3.0;

  // Segmentleri hazırla (sıfır uzunluklu olanları filtrele)
  interface SegmentInfo {
    p0: CadPoint2D;
    p1: CadPoint2D;
    dx: number;
    dy: number;
    len: number;
    nx: number; // Birim normal x (-dy / len)
    ny: number; // Birim normal y (dx / len)
    w0: number; // Başlangıç genişliği
    w1: number; // Bitiş genişliği
  }

  const segments: SegmentInfo[] = [];
  const count = isClosed ? vertices.length : vertices.length - 1;

  let hasPositiveWidth = false;

  for (let i = 0; i < count; i++) {
    const vCurr = vertices[i];
    const vNext = vertices[(i + 1) % vertices.length];

    const p0 = vCurr.point;
    const p1 = vNext.point;

    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const len = Math.hypot(dx, dy);

    if (len < 1e-9) continue; // Sıfır uzunluklu segmenti atla

    const w0 = Math.max(0, vCurr.startWidth ?? 0);
    const w1 = Math.max(0, vCurr.endWidth ?? vCurr.startWidth ?? 0);

    if (w0 > 0 || w1 > 0) hasPositiveWidth = true;

    segments.push({
      p0,
      p1,
      dx,
      dy,
      len,
      nx: -dy / len,
      ny: dx / len,
      w0,
      w1,
    });
  }

  if (segments.length === 0 || !hasPositiveWidth) return null;

  const triangles: number[] = [];

  // Her segment için ana quad'ı üret (2 üçgen)
  // v0 (Sol Başlangıç)  --- v2 (Sol Bitiş)
  //       |                    |
  // v1 (Sağ Başlangıç) --- v3 (Sağ Bitiş)
  interface SegmentCorners {
    l0: CadPoint2D;
    r0: CadPoint2D;
    l1: CadPoint2D;
    r1: CadPoint2D;
  }
  const corners: SegmentCorners[] = [];

  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const h0 = s.w0 / 2;
    const h1 = s.w1 / 2;

    const l0: CadPoint2D = [s.p0[0] + s.nx * h0, s.p0[1] + s.ny * h0];
    const r0: CadPoint2D = [s.p0[0] - s.nx * h0, s.p0[1] - s.ny * h0];
    const l1: CadPoint2D = [s.p1[0] + s.nx * h1, s.p1[1] + s.ny * h1];
    const r1: CadPoint2D = [s.p1[0] - s.nx * h1, s.p1[1] - s.ny * h1];

    corners.push({ l0, r0, l1, r1 });

    // Quad: (l0, r0, l1) ve (r0, r1, l1)
    triangles.push(
      l0[0], l0[1],
      r0[0], r0[1],
      l1[0], l1[1],

      r0[0], r0[1],
      r1[0], r1[1],
      l1[0], l1[1]
    );
  }

  // Segmentler arası köşe birleşimleri (Joins)
  const joinCount = isClosed ? segments.length : segments.length - 1;
  for (let i = 0; i < joinCount; i++) {
    const sA = segments[i];
    const sB = segments[(i + 1) % segments.length];
    const cA = corners[i];
    const cB = corners[(i + 1) % segments.length];

    // İki segmentin yön vektörleri arasındaki çapraz çarpım (dönüş yönü)
    const cross = sA.dx * sB.dy - sA.dy * sB.dx;

    // Dot product
    const dot = (sA.dx * sB.dx + sA.dy * sB.dy) / (sA.len * sB.len);
    const clampedDot = Math.max(-1, Math.min(1, dot));
    const angle = Math.acos(clampedDot);

    if (Math.abs(cross) < 1e-6 || angle < 1e-4) {
      // Düz devam ediyor, join üçgenine gerek yok
      continue;
    }

    const halfAngle = angle / 2;
    const miterRatio = Math.sin(halfAngle) > 1e-6 ? 1 / Math.sin(halfAngle) : miterLimit + 1;

    const pivot = sA.p1; // Ortak köşe noktası

    if (cross > 0) {
      // Sağa dönüş (Dış taraf: Sağ kenar rA -> rB, İç taraf: lA / lB)
      if (miterRatio <= miterLimit) {
        // Miter Join
        const mx = (sA.nx + sB.nx) / 2;
        const my = (sA.ny + sB.ny) / 2;
        const mLen = Math.hypot(mx, my);
        if (mLen > 1e-6) {
          const avgW = (sA.w1 + sB.w0) / 4;
          const miterPt: CadPoint2D = [pivot[0] - (mx / mLen) * avgW * miterRatio, pivot[1] - (my / mLen) * avgW * miterRatio];
          triangles.push(
            pivot[0], pivot[1],
            cA.r1[0], cA.r1[1],
            miterPt[0], miterPt[1],

            pivot[0], pivot[1],
            miterPt[0], miterPt[1],
            cB.r0[0], cB.r0[1]
          );
        } else {
          // Bevel Join Fallback
          triangles.push(
            pivot[0], pivot[1],
            cA.r1[0], cA.r1[1],
            cB.r0[0], cB.r0[1]
          );
        }
      } else {
        // Bevel Join (Aşırı keskin açı - sivri uç patlamasını önler)
        triangles.push(
          pivot[0], pivot[1],
          cA.r1[0], cA.r1[1],
          cB.r0[0], cB.r0[1]
        );
      }
    } else {
      // Sola dönüş (Dış taraf: Sol kenar lA -> lB, İç taraf: rA / rB)
      if (miterRatio <= miterLimit) {
        // Miter Join
        const mx = (sA.nx + sB.nx) / 2;
        const my = (sA.ny + sB.ny) / 2;
        const mLen = Math.hypot(mx, my);
        if (mLen > 1e-6) {
          const avgW = (sA.w1 + sB.w0) / 4;
          const miterPt: CadPoint2D = [pivot[0] + (mx / mLen) * avgW * miterRatio, pivot[1] + (my / mLen) * avgW * miterRatio];
          triangles.push(
            pivot[0], pivot[1],
            cA.l1[0], cA.l1[1],
            miterPt[0], miterPt[1],

            pivot[0], pivot[1],
            miterPt[0], miterPt[1],
            cB.l0[0], cB.l0[1]
          );
        } else {
          // Bevel Join Fallback
          triangles.push(
            pivot[0], pivot[1],
            cA.l1[0], cA.l1[1],
            cB.l0[0], cB.l0[1]
          );
        }
      } else {
        // Bevel Join
        triangles.push(
          pivot[0], pivot[1],
          cA.l1[0], cA.l1[1],
          cB.l0[0], cB.l0[1]
        );
      }
    }
  }

  // This is still world-space compiler geometry. Keep sub-unit widths at large
  // CAD coordinates until scene-compiler subtracts the local chunk origin.
  return new Float64Array(triangles);
}

/**
 * 2 nokta arasındaki tek bir düz çizgi için kalın quad geometri üretir
 */
export function createLineStrokeQuad(
  p0: CadPoint2D,
  p1: CadPoint2D,
  width: number
): Float32Array | null {
  if (width <= 0) return null;
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return null;

  const halfW = width / 2;
  const nx = (-dy / len) * halfW;
  const ny = (dx / len) * halfW;

  const l0 = [p0[0] + nx, p0[1] + ny];
  const r0 = [p0[0] - nx, p0[1] - ny];
  const l1 = [p1[0] + nx, p1[1] + ny];
  const r1 = [p1[0] - nx, p1[1] - ny];

  return new Float32Array([
    l0[0], l0[1],
    r0[0], r0[1],
    l1[0], l1[1],

    r0[0], r0[1],
    r1[0], r1[1],
    l1[0], l1[1],
  ]);
}

// ============================================================================
// F03 — AUTOCAD ÇİZGİ TİPİ (LINETYPE) VE KESİKLİ ÇİZGİ (DASH PHASE) MOTORU
// ============================================================================

export interface StandardLinetype {
  name: string;
  description: string;
  pattern: number[];
  totalLength: number;
}

/**
 * AutoCAD standart linetype paleti (acad.lin / acadiso.lin)
 * Pozitif: Dolu çizgi (dash), Negatif: Boşluk (gap), 0: Nokta (dot)
 */
export const STANDARD_AUTOCAD_LINETYPES: Record<string, StandardLinetype> = {
  CONTINUOUS: { name: "CONTINUOUS", description: "Solid line", pattern: [], totalLength: 0 },
  SOLID: { name: "SOLID", description: "Solid line", pattern: [], totalLength: 0 },
  DASHED: { name: "DASHED", description: "__ __ __ __ __", pattern: [12.7, -6.35], totalLength: 19.05 },
  DASHED2: { name: "DASHED2", description: "_ _ _ _ _", pattern: [6.35, -3.175], totalLength: 9.525 },
  DASHEDX2: { name: "DASHEDX2", description: "____  ____  ____", pattern: [25.4, -12.7], totalLength: 38.1 },
  HIDDEN: { name: "HIDDEN", description: "_ _ _ _ _", pattern: [6.35, -3.175], totalLength: 9.525 },
  HIDDEN2: { name: "HIDDEN2", description: ".....", pattern: [3.175, -1.5875], totalLength: 4.7625 },
  HIDDENX2: { name: "HIDDENX2", description: "__  __  __", pattern: [12.7, -6.35], totalLength: 19.05 },
  CENTER: { name: "CENTER", description: "____ _ ____ _ ____", pattern: [31.75, -6.35, 6.35, -6.35], totalLength: 50.8 },
  CENTER2: { name: "CENTER2", description: "__ . __ . __", pattern: [15.875, -3.175, 3.175, -3.175], totalLength: 25.4 },
  CENTERX2: { name: "CENTERX2", description: "________  __  ________", pattern: [63.5, -12.7, 12.7, -12.7], totalLength: 101.6 },
  DOT: { name: "DOT", description: ". . . . .", pattern: [0.0, -6.35], totalLength: 6.35 },
  DOT2: { name: "DOT2", description: ".........", pattern: [0.0, -3.175], totalLength: 3.175 },
  DOTX2: { name: "DOTX2", description: ".  .  .  .", pattern: [0.0, -12.7], totalLength: 12.7 },
  DASHDOT: { name: "DASHDOT", description: "__ . __ . __", pattern: [12.7, -6.35, 0.0, -6.35], totalLength: 25.4 },
  DASHDOT2: { name: "DASHDOT2", description: "_ . _ . _", pattern: [6.35, -3.175, 0.0, -3.175], totalLength: 12.7 },
  DASHDOTX2: { name: "DASHDOTX2", description: "____  .  ____", pattern: [25.4, -12.7, 0.0, -12.7], totalLength: 50.8 },
  PHANTOM: { name: "PHANTOM", description: "____ _ _ ____ _ _", pattern: [31.75, -6.35, 6.35, -6.35, 6.35, -6.35], totalLength: 63.5 },
  PHANTOM2: { name: "PHANTOM2", description: "__ . . __ . .", pattern: [15.875, -3.175, 3.175, -3.175, 3.175, -3.175], totalLength: 31.75 },
  PHANTOMX2: { name: "PHANTOMX2", description: "________  __  __  ________", pattern: [63.5, -12.7, 12.7, -12.7, 12.7, -12.7], totalLength: 127.0 },
  DIVIDE: { name: "DIVIDE", description: "__ . . __ . .", pattern: [12.7, -6.35, 0.0, -6.35, 0.0, -6.35], totalLength: 31.75 },
  DIVIDE2: { name: "DIVIDE2", description: "_ . . _ . .", pattern: [6.35, -3.175, 0.0, -3.175, 0.0, -3.175], totalLength: 15.875 },
  DIVIDEX2: { name: "DIVIDEX2", description: "____  .  .  ____", pattern: [25.4, -12.7, 0.0, -12.7, 0.0, -12.7], totalLength: 63.5 },
  BORDER: { name: "BORDER", description: "__ __ . __ __ .", pattern: [12.7, -6.35, 12.7, -6.35, 0.0, -6.35], totalLength: 44.45 },
  BORDER2: { name: "BORDER2", description: "_ _ . _ _ .", pattern: [6.35, -3.175, 6.35, -3.175, 0.0, -3.175], totalLength: 22.225 },
  BORDERX2: { name: "BORDERX2", description: "____  ____  .  ____", pattern: [25.4, -12.7, 25.4, -12.7, 0.0, -12.7], totalLength: 88.9 },
};

export interface LinetypeResolutionContext {
  parentInsert?: CadInsertEntity;
  parentInserts?: CadInsertEntity[];
  layerOverrides?: Record<string, Partial<CadLayer>>;
  globalLtScale?: number; // LTSCALE (default 1.0)
  currentLtScale?: number; // CELTSCALE (default 1.0)
  isPaperSpace?: boolean;
  psLtScale?: number; // PSLTSCALE (default 1.0)
  msLtScale?: number; // MSLTSCALE (default 1.0)
}

export interface ResolvedLinetype {
  name: string;
  pattern: number[];
  totalLength: number;
  isContinuous: boolean;
  effectiveScale: number;
  sourceMethod: "explicit" | "byLayer" | "byBlock" | "default";
}

/**
 * AutoCAD standart linetype çözümü (ByLayer, ByBlock, Explicit, Default Continuous)
 */
export function resolveEntityLinetype(
  ent: Pick<CadEntity, "layer" | "linetype" | "linetypeScale">,
  layers: Record<string, CadLayer>,
  linetypesTable?: Record<string, CadLinetype>,
  ctx?: LinetypeResolutionContext
): ResolvedLinetype {
  let targetName = "CONTINUOUS";
  let sourceMethod: "explicit" | "byLayer" | "byBlock" | "default" = "default";

  const rawLt = ent.linetype?.trim();
  if (!rawLt || rawLt.toUpperCase() === "BYLAYER") {
    sourceMethod = "byLayer";
    const targetLayerName = ent.layer || "0";
    const effectiveLayer = ctx?.layerOverrides?.[targetLayerName] || layers[targetLayerName];
    targetName = (effectiveLayer as any)?.linetype || effectiveLayer?.linetypeName || "CONTINUOUS";
  } else if (rawLt.toUpperCase() === "BYBLOCK") {
    sourceMethod = "byBlock";
    const parentStack = ctx?.parentInserts || (ctx?.parentInsert ? [ctx.parentInsert] : []);
    let found = false;
    for (let i = parentStack.length - 1; i >= 0; i--) {
      const parent = parentStack[i];
      if (parent.linetype && parent.linetype.toUpperCase() !== "BYBLOCK") {
        if (parent.linetype.toUpperCase() === "BYLAYER") {
          const parentLyr = ctx?.layerOverrides?.[parent.layer] || layers[parent.layer];
          targetName = parentLyr?.linetypeName || "Continuous";
        } else {
          targetName = parent.linetype;
        }
        found = true;
        break;
      }
    }
    if (!found) {
      targetName = "Continuous";
    }
  } else {
    sourceMethod = "explicit";
    targetName = rawLt;
  }

  const upper = targetName.toUpperCase();
  let pattern: number[] = [];
  let totalLength = 0;
  let isContinuous = true;

  if (upper === "CONTINUOUS" || upper === "SOLID" || upper === "") {
    pattern = [];
    totalLength = 0;
    isContinuous = true;
  } else {
    // 1. Dokümandaki linetypes tablosundan ara
    const docLt = linetypesTable?.[targetName] || linetypesTable?.[upper];
    if (docLt && Array.isArray(docLt.pattern) && docLt.pattern.length > 0) {
      pattern = docLt.pattern;
      totalLength = docLt.totalLength || pattern.reduce((sum, v) => sum + Math.abs(v), 0);
      isContinuous = false;
    } else if (STANDARD_AUTOCAD_LINETYPES[upper]) {
      // 2. Standart AutoCAD paletinden ara
      const std = STANDARD_AUTOCAD_LINETYPES[upper];
      pattern = std.pattern;
      totalLength = std.totalLength;
      isContinuous = pattern.length === 0;
    } else {
      // Bilinmeyen linetype fallback
      pattern = [];
      totalLength = 0;
      isContinuous = true;
    }
  }

  const entScale = typeof ent.linetypeScale === "number" && ent.linetypeScale > 0 ? ent.linetypeScale : 1.0;
  const globalScale = typeof ctx?.globalLtScale === "number" && ctx.globalLtScale > 0 ? ctx.globalLtScale : 1.0;
  const curScale = typeof ctx?.currentLtScale === "number" && ctx.currentLtScale > 0 ? ctx.currentLtScale : 1.0;
  const psScale = ctx?.isPaperSpace ? (typeof ctx?.psLtScale === "number" && ctx.psLtScale > 0 ? ctx.psLtScale : 1.0) : 1.0;
  const msScale = !ctx?.isPaperSpace ? (typeof ctx?.msLtScale === "number" && ctx.msLtScale > 0 ? ctx.msLtScale : 1.0) : 1.0;
  const effectiveScale = entScale * globalScale * curScale * psScale * msScale;

  return {
    name: targetName,
    pattern,
    totalLength,
    isContinuous,
    effectiveScale,
    sourceMethod,
  };
}

export interface DashedSegment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  d0?: number;
  d1?: number;
  isDot?: boolean;
}

export interface DashedPathResult {
  segments: DashedSegment[];
  endPhase: number;
  totalDistance: number;
  maxSagittaWorld?: number;
  errorBoundMet?: boolean;
  refinementLimitReached?: boolean;
}

export interface ArcDashTessellationOptions {
  /** Maximum deviation between a circular arc and its emitted line chords, in geometry units. */
  maxErrorWorld?: number;
  /** Bound on emitted chord count for this arc/circle entity. */
  maxSegments?: number;
}

/**
 * 2 nokta arasındaki bir düz çizgiyi verilen dash/gap pattern'ine göre
 * kesikli segment dizisine dönüştürür.
 * Eksen çizgisi değişmezliği (centerline invariance) kesinlikle korunur.
 */
export function tessellateDashedLine(
  p0: CadPoint2D,
  p1: CadPoint2D,
  pattern: number[],
  scale = 1.0,
  startPhase = 0.0
): DashedPathResult {
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const len = Math.hypot(dx, dy);

  if (len < 1e-9) {
    return { segments: [], endPhase: startPhase, totalDistance: 0 };
  }

  if (!pattern || pattern.length === 0) {
    return {
      segments: [{ x0: p0[0], y0: p0[1], x1: p1[0], y1: p1[1], d0: 0, d1: len }],
      endPhase: startPhase + len,
      totalDistance: len,
    };
  }

  const safeScale = scale > 0 ? scale : 1.0;
  const sPattern = pattern.map((v) => v * safeScale);
  let cycleLen = 0;
  for (const v of sPattern) cycleLen += Math.abs(v);

  if (cycleLen < 1e-6) {
    return {
      segments: [{ x0: p0[0], y0: p0[1], x1: p1[0], y1: p1[1], d0: 0, d1: len }],
      endPhase: startPhase + len,
      totalDistance: len,
    };
  }

  const ux = dx / len;
  const uy = dy / len;

  let phase = startPhase % cycleLen;
  if (phase < 0) phase += cycleLen;

  let pIdx = 0;
  let acc = 0;
  for (let i = 0; i < sPattern.length; i++) {
    const elemAbs = Math.abs(sPattern[i]);
    if (phase < acc + elemAbs - 1e-9) {
      pIdx = i;
      break;
    }
    acc += elemAbs;
  }
  let elemRem = Math.abs(sPattern[pIdx]) - (phase - acc);

  let curDist = 0;
  const segments: DashedSegment[] = [];

  while (curDist < len - 1e-9) {
    const step = Math.min(elemRem, len - curDist);
    const elemVal = sPattern[pIdx];

    if (elemVal > 1e-6) {
      const x0 = p0[0] + ux * curDist;
      const y0 = p0[1] + uy * curDist;
      const x1 = p0[0] + ux * (curDist + step);
      const y1 = p0[1] + uy * (curDist + step);
      segments.push({ x0, y0, x1, y1, d0: curDist, d1: curDist + step });
    } else if (Math.abs(elemVal) <= 1e-6) {
      const x0 = p0[0] + ux * curDist;
      const y0 = p0[1] + uy * curDist;
      const dotLen = Math.min(0.001 * safeScale, len - curDist);
      segments.push({ x0, y0, x1: x0 + ux * dotLen, y1: y0 + uy * dotLen, d0: curDist, d1: curDist + dotLen, isDot: true });
    }

    curDist += step;
    phase += step;
    pIdx = (pIdx + 1) % sPattern.length;
    elemRem = Math.abs(sPattern[pIdx]);
  }

  return {
    segments,
    endPhase: startPhase + len,
    totalDistance: len,
  };
}

/**
 * Birbirine bağlı 2D noktalar dizisini (polyline yolu) kesikli çizgilere böler.
 * plinegen=true: köşe geçişlerinde faz korunur (sürekli desen).
 * plinegen=false: her köşede desen baştan başlar.
 */
export function tessellateDashedPath(
  points: CadPoint2D[],
  pattern: number[],
  scale = 1.0,
  options?: {
    startPhase?: number;
    isClosed?: boolean;
    plinegen?: boolean;
  }
): DashedPathResult {
  if (!points || points.length < 2) {
    return { segments: [], endPhase: options?.startPhase ?? 0, totalDistance: 0 };
  }
  const isClosed = options?.isClosed ?? false;
  const plinegen = options?.plinegen ?? true;
  let phase = options?.startPhase ?? 0;
  let totalDist = 0;
  const allSegments: DashedSegment[] = [];

  const count = isClosed ? points.length : points.length - 1;
  for (let i = 0; i < count; i++) {
    const p0 = points[i];
    const p1 = points[(i + 1) % points.length];
    const segStartPhase = plinegen ? phase : 0;
    const res = tessellateDashedLine(p0, p1, pattern, scale, segStartPhase);
    for (const seg of res.segments) {
      allSegments.push({
        ...seg,
        d0: totalDist + (seg.d0 ?? 0),
        d1: totalDist + (seg.d1 ?? 0),
      });
    }
    phase = res.endPhase;
    totalDist += res.totalDistance;
  }
  return { segments: allSegments, endPhase: phase, totalDistance: totalDist };
}

/**
 * Yay parçalama yardımcısı (dairesel bağımsızlık)
 */
function sampleArcPoints(
  center: CadPoint2D,
  radius: number,
  startAngleRad: number,
  endAngleRad: number,
  isClockwise = false,
  maxError = 0.25,
  maxSegments = 65_536
): { points: CadPoint2D[]; maxSagittaWorld: number; errorBoundMet: boolean } {
  if (radius <= 0) return { points: [center], maxSagittaWorld: 0, errorBoundMet: true };
  let sweep = endAngleRad - startAngleRad;
  if (isClockwise) {
    if (sweep > 0) sweep -= Math.PI * 2;
  } else {
    if (sweep < 0) sweep += Math.PI * 2;
  }
  if (Math.abs(sweep) < 1e-9) sweep = Math.PI * 2;
  const safeError = Number.isFinite(maxError) && maxError > 0 ? maxError : 0.25;
  const maxDelta = 4 * Math.asin(Math.sqrt(Math.min(1, safeError / (2 * radius))));
  const requested = Math.max(1, Math.ceil(Math.abs(sweep) / Math.max(Number.EPSILON, maxDelta)));
  const cap = Number.isFinite(maxSegments) ? Math.max(1, Math.min(65_536, Math.floor(maxSegments))) : 65_536;
  const segCount = Math.min(requested, cap);
  const pts: CadPoint2D[] = [];
  for (let i = 0; i <= segCount; i++) {
    const th = startAngleRad + (sweep * i) / segCount;
    pts.push([center[0] + radius * Math.cos(th), center[1] + radius * Math.sin(th)]);
  }
  const emittedDelta = Math.abs(sweep) / segCount;
  const maxSagittaWorld = radius * (1 - Math.cos(emittedDelta / 2));
  return { points: pts, maxSagittaWorld, errorBoundMet: requested <= cap && maxSagittaWorld <= safeError * (1 + 1e-12) };
}

/**
 * Yay (ARC) üzerinde kesikli çizgi desenini gerçek yay uzunluğu (s = r * theta)
 * boyunca hassas olarak açar (poligonal çarpıtma ve chord hatası olmaksızın).
 */
export function tessellateDashedArc(
  center: CadPoint2D,
  radius: number,
  startAngleRad: number,
  endAngleRad: number,
  isClockwise = false,
  pattern: number[] = [],
  scale = 1.0,
  startPhase = 0.0,
  options: ArcDashTessellationOptions = {}
): DashedPathResult {
  if (radius <= 0) return { segments: [], endPhase: startPhase, totalDistance: 0 };

  const maxErrorWorld = Number.isFinite(options.maxErrorWorld) && (options.maxErrorWorld ?? 0) > 0
    ? options.maxErrorWorld!
    : 0.25;
  const maxSegments = Number.isFinite(options.maxSegments)
    ? Math.max(1, Math.min(65_536, Math.floor(options.maxSegments!)))
    : 65_536;

  let sweep = endAngleRad - startAngleRad;
  if (isClockwise) {
    if (sweep > 0) sweep -= Math.PI * 2;
  } else {
    if (sweep < 0) sweep += Math.PI * 2;
  }
  if (Math.abs(sweep) < 1e-9) sweep = Math.PI * 2;

  const arcLength = radius * Math.abs(sweep);
  if (!pattern || pattern.length === 0) {
    const sampled = sampleArcPoints(center, radius, startAngleRad, endAngleRad, isClockwise, maxErrorWorld, maxSegments);
    const pts = sampled.points;
    const segs: DashedSegment[] = [];
    let curD = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const segL = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      segs.push({ x0: pts[i][0], y0: pts[i][1], x1: pts[i + 1][0], y1: pts[i + 1][1], d0: curD, d1: curD + segL });
      curD += segL;
    }
    return { segments: segs, endPhase: startPhase + arcLength, totalDistance: arcLength,
      maxSagittaWorld: sampled.maxSagittaWorld, errorBoundMet: sampled.errorBoundMet,
      refinementLimitReached: !sampled.errorBoundMet };
  }

  const safeScale = scale > 0 ? scale : 1.0;
  const sPattern = pattern.map((v) => v * safeScale);
  let cycleLen = 0;
  for (const v of sPattern) cycleLen += Math.abs(v);

  if (cycleLen < 1e-6) {
    const sampled = sampleArcPoints(center, radius, startAngleRad, endAngleRad, isClockwise, maxErrorWorld, maxSegments);
    const pts = sampled.points;
    const segs: DashedSegment[] = [];
    let curD = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const segL = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      segs.push({ x0: pts[i][0], y0: pts[i][1], x1: pts[i + 1][0], y1: pts[i + 1][1], d0: curD, d1: curD + segL });
      curD += segL;
    }
    return { segments: segs, endPhase: startPhase + arcLength, totalDistance: arcLength,
      maxSagittaWorld: sampled.maxSagittaWorld, errorBoundMet: sampled.errorBoundMet,
      refinementLimitReached: !sampled.errorBoundMet };
  }

  const sweepSign = isClockwise ? -1 : 1;
  let phase = startPhase % cycleLen;
  if (phase < 0) phase += cycleLen;

  let pIdx = 0;
  let acc = 0;
  for (let i = 0; i < sPattern.length; i++) {
    const elemAbs = Math.abs(sPattern[i]);
    if (phase < acc + elemAbs - 1e-9) {
      pIdx = i;
      break;
    }
    acc += elemAbs;
  }
  let elemRem = Math.abs(sPattern[pIdx]) - (phase - acc);

  let curDist = 0;
  const segments: DashedSegment[] = [];
  let maxSagittaWorld = 0;
  let refinementLimitReached = false;
  let patternSteps = 0;
  const maxPatternSteps = Math.max(pattern.length + 1, maxSegments * 2 + pattern.length);

  while (curDist < arcLength - 1e-9) {
    if (++patternSteps > maxPatternSteps) {
      refinementLimitReached = true;
      break;
    }
    const step = Math.min(elemRem, arcLength - curDist);
    const elemVal = sPattern[pIdx];

    if (elemVal > 1e-6) {
      const d0 = curDist;
      const d1 = curDist + step;
      const th0 = startAngleRad + sweepSign * (d0 / radius);
      const th1 = startAngleRad + sweepSign * (d1 / radius);

      const dashSweep = Math.abs(th1 - th0);
      const maxDelta = 4 * Math.asin(Math.sqrt(Math.min(1, maxErrorWorld / (2 * radius))));
      const subCount = Math.max(1, Math.ceil(dashSweep / Math.max(Number.EPSILON, maxDelta)));
      if (segments.length + subCount > maxSegments) {
        refinementLimitReached = true;
        break;
      }

      for (let s = 0; s < subCount; s++) {
        const a0 = th0 + (th1 - th0) * (s / subCount);
        const a1 = th0 + (th1 - th0) * ((s + 1) / subCount);
        const segD0 = d0 + (d1 - d0) * (s / subCount);
        const segD1 = d0 + (d1 - d0) * ((s + 1) / subCount);
        maxSagittaWorld = Math.max(maxSagittaWorld, radius * (1 - Math.cos((dashSweep / subCount) / 2)));
        segments.push({
          x0: center[0] + radius * Math.cos(a0),
          y0: center[1] + radius * Math.sin(a0),
          x1: center[0] + radius * Math.cos(a1),
          y1: center[1] + radius * Math.sin(a1),
          d0: segD0,
          d1: segD1,
        });
      }
    } else if (Math.abs(elemVal) <= 1e-6) {
      if (segments.length >= maxSegments) {
        refinementLimitReached = true;
        break;
      }
      const th = startAngleRad + sweepSign * (curDist / radius);
      const px = center[0] + radius * Math.cos(th);
      const py = center[1] + radius * Math.sin(th);
      segments.push({ x0: px, y0: py, x1: px, y1: py, d0: curDist, d1: curDist, isDot: true });
    }

    curDist += step;
    phase += step;
    pIdx = (pIdx + 1) % sPattern.length;
    elemRem = Math.abs(sPattern[pIdx]);
  }

  return { segments, endPhase: startPhase + arcLength, totalDistance: arcLength,
    maxSagittaWorld, errorBoundMet: !refinementLimitReached && maxSagittaWorld <= maxErrorWorld * (1 + 1e-12),
    refinementLimitReached };
}

/**
 * Çember (CIRCLE) üzerinde kesikli çizgi deseni
 */
export function tessellateDashedCircle(
  center: CadPoint2D,
  radius: number,
  pattern: number[] = [],
  scale = 1.0,
  startPhase = 0.0,
  options: ArcDashTessellationOptions = {}
): DashedPathResult {
  return tessellateDashedArc(center, radius, 0, Math.PI * 2, false, pattern, scale, startPhase, options);
}
