// ============================================================================
// DWG/DXF MOTOR V2 — LAYOUT, VIEWPORT & DEPENDENCY MANAGER (G09)
// ============================================================================
// Sözleşme: motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md (G09), 31_SOZLESME_TAMAMLAMALARI.md
// Gereksinimler: R13, R14 | Alt kabul: V12, C02, F06, F15
//
// Yetenekler:
// 1. Model Space ve Paper Space pafta yönetimi (çoklu layout seçimi)
// 2. Viewport 2D affine dönüşüm matrisi (modelToPaper / paperToModel)
// 3. Viewport twist (rotasyon), scale (ölçek) ve merkez öteleme
// 4. Viewport başına katman dondurma (per-viewport frozen layers)
// 5. Viewport sınırları ile model geometrisi kırpma (Liang-Barsky 2D line clipping)
// 6. XREF ve dış bağımlılık grafiği (döngüsel referans ve path traversal koruması)

import type {
  CadLayout,
  CadViewport,
  CadPoint2D,
  CadBBox2D,
  CadLayer,
  CadDiagnostic,
} from "../canonical/types";

export interface AffineMatrix2D {
  a: number;
  b: number;
  c: number;
  d: number;
  tx: number;
  ty: number;
}

export class LayoutManager {
  /**
   * 1. Viewport için Model -> Paper 2D Affine Dönüşüm Matrisi Hesabı
   * P_paper = [a*x + c*y + tx, b*x + d*y + ty]
   */
  public static computeModelToPaper(viewport: CadViewport): AffineMatrix2D {
    const px = viewport.center[0];
    const py = viewport.center[1];
    const mx = viewport.viewCenter[0];
    const my = viewport.viewCenter[1];

    // Ölçek: Paper Height / Model View Height
    const scale = viewport.viewHeight > 1e-9 ? viewport.height / viewport.viewHeight : 1.0;
    const twist = (viewport as any).twistAngleRad || 0;

    const cosT = Math.cos(twist);
    const sinT = Math.sin(twist);

    const a = scale * cosT;
    const c = scale * sinT;
    const b = -scale * sinT;
    const d = scale * cosT;

    const tx = px - (a * mx + c * my);
    const ty = py - (b * mx + d * my);

    return { a, b, c, d, tx, ty };
  }

  /**
   * 2. Paper -> Model Ters Dönüşüm Matrisi
   */
  public static computePaperToModel(matrix: AffineMatrix2D): AffineMatrix2D | null {
    const det = matrix.a * matrix.d - matrix.b * matrix.c;
    if (Math.abs(det) < 1e-12) return null;

    const invDet = 1.0 / det;
    const a = matrix.d * invDet;
    const b = -matrix.b * invDet;
    const c = -matrix.c * invDet;
    const d = matrix.a * invDet;

    const tx = -(a * matrix.tx + c * matrix.ty);
    const ty = -(b * matrix.tx + d * matrix.ty);

    return { a, b, c, d, tx, ty };
  }

  /**
   * Bir 2D noktayı matris ile dönüştür
   */
  public static transformPoint(pt: CadPoint2D, mat: AffineMatrix2D): CadPoint2D {
    return [
      mat.a * pt[0] + mat.c * pt[1] + mat.tx,
      mat.b * pt[0] + mat.d * pt[1] + mat.ty,
    ];
  }

  /**
   * 3. Viewport Dikdörtgen Sınır Kutusu (Paper Uzayında)
   */
  public static getViewportPaperBBox(viewport: CadViewport): CadBBox2D {
    const halfW = viewport.width / 2;
    const halfH = viewport.height / 2;
    return [
      viewport.center[0] - halfW,
      viewport.center[1] - halfH,
      viewport.center[0] + halfW,
      viewport.center[1] + halfH,
    ];
  }

  /**
   * 4. Liang-Barsky 2D Çizgi Kırpma (Line Clipping)
   * Çizgiyi viewport'un dikdörtgen kağıt sınırları içine kırpar.
   */
  public static clipLineToBBox(
    p0: CadPoint2D,
    p1: CadPoint2D,
    bbox: CadBBox2D
  ): [CadPoint2D, CadPoint2D] | null {
    const [minX, minY, maxX, maxY] = bbox;
    let t0 = 0.0;
    let t1 = 1.0;
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];

    const p = [-dx, dx, -dy, dy];
    const q = [p0[0] - minX, maxX - p0[0], p0[1] - minY, maxY - p0[1]];

    for (let i = 0; i < 4; i++) {
      if (Math.abs(p[i]) < 1e-9) {
        if (q[i] < 0) return null; // Çizgi tamamen dışarıda ve sınıra paralel
      } else {
        const t = q[i] / p[i];
        if (p[i] < 0) {
          if (t > t1) return null;
          if (t > t0) t0 = t;
        } else {
          if (t < t0) return null;
          if (t < t1) t1 = t;
        }
      }
    }

    const clippedP0: CadPoint2D = [p0[0] + t0 * dx, p0[1] + t0 * dy];
    const clippedP1: CadPoint2D = [p0[0] + t1 * dx, p0[1] + t1 * dy];
    return [clippedP0, clippedP1];
  }

  /**
   * 5. Viewport Bazında Katman Görünürlüğü Kontrolü (R12, R13)
   * Global katman görünürlüğü VE bu viewport için özel dondurma (frozenLayers) kontrol edilir.
   */
  public static isLayerVisible(
    layerName: string,
    layers: Record<string, CadLayer>,
    viewport?: CadViewport
  ): boolean {
    const lyr = layers[layerName];
    if (lyr) {
      if (!lyr.visible || lyr.frozen) return false;
    }

    const override = viewport?.layerOverrides?.[layerName];
    if (override?.visible === false || override?.frozen === true) return false;

    if (viewport && Array.isArray(viewport.frozenLayers)) {
      if (viewport.frozenLayers.includes(layerName)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 6. XREF Bağımlılık Grafiği Doğrulaması (R14)
   * Döngüsel referans (cyclic XREF) ve Path Traversal tespiti yapar.
   */
  public static validateXrefGraph(
    rootDocId: string,
    xrefs: Array<{ id: string; parentId: string; filePath: string }>
  ): { isValid: boolean; diagnostics: CadDiagnostic[] } {
    const diagnostics: CadDiagnostic[] = [];
    const adj = new Map<string, string[]>();

    for (const ref of xrefs) {
      // Graph doğrulaması ile resolver aynı path güvenlik politikasını kullanır.
      const pathResult = this.resolveXrefAsset(ref.filePath);
      if (!pathResult.isAllowed) {
        diagnostics.push({
          id: `diag_sec_${ref.id}`,
          code: pathResult.diagnosticCode === "SEC_XREF_REMOTE_URL_FORBIDDEN"
            ? "SEC_XREF_REMOTE_URL_FORBIDDEN"
            : "SEC_PATH_TRAVERSAL_DETECTED",
          severity: "error",
          message: pathResult.message || `Güvenlik ihlali: XREF dosya yolu geçersiz (${ref.filePath})`,
        });
      }

      const list = adj.get(ref.parentId) || [];
      list.push(ref.id);
      adj.set(ref.parentId, list);
    }

    // Döngü (Cycle) Tespiti - DFS
    const visited = new Set<string>();
    const recStack = new Set<string>();
    let hasCycle = false;

    function dfs(node: string): boolean {
      visited.add(node);
      recStack.add(node);

      const neighbors = adj.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true; // Döngü tespit edildi!
        }
      }

      recStack.delete(node);
      return false;
    }

    for (const node of Array.from(adj.keys())) {
      if (!visited.has(node)) {
        if (dfs(node)) {
          hasCycle = true;
          diagnostics.push({
            id: `diag_cycle_${node}`,
            code: "ERR_CYCLIC_XREF_DETECTED",
            severity: "error",
            message: `Döngüsel XREF referansı tespit edildi (${node})`,
          });
          break;
        }
      }
    }

    return {
      isValid: diagnostics.filter((d) => d.severity === "error").length === 0,
      diagnostics,
    };
  }

  /**
   * 7. Bir noktanın 2D çokgen içinde olup olmadığını belirler (Ray Casting / Jordan Curve)
   */
  public static isPointInPolygon(pt: CadPoint2D, polygon: CadPoint2D[]): boolean {
    const n = polygon.length;
    if (n < 3) return false;
    let inside = false;
    const x = pt[0];
    const y = pt[1];

    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];

      // Sınır üzerindeki nokta içeride sayılır; bu, clip segment uçlarında
      // yatay/dikey ve köşe temaslarının kararlı olmasını sağlar.
      const cross = (x - xi) * (yj - yi) - (y - yi) * (xj - xi);
      const scale = Math.max(1, Math.abs(xj - xi), Math.abs(yj - yi));
      const onSegment = Math.abs(cross) <= 1e-10 * scale &&
        x >= Math.min(xi, xj) - 1e-10 && x <= Math.max(xi, xj) + 1e-10 &&
        y >= Math.min(yi, yj) - 1e-10 && y <= Math.max(yi, yj) + 1e-10;
      if (onSegment) return true;

      const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  /**
   * 8. Bir çizgi segmentini çokgen sınırına göre kırpar (XCLIP ve Polygon Viewport)
   * @param p0 Çizgi başlangıç noktası
   * @param p1 Çizgi bitiş noktası
   * @param polygon Kırpma çokgeni (kapalı tepe noktaları)
   * @param isInverted true ise çokgenin DIŞINDA kalan kısımları tutar (Ters XCLIP)
   * @returns Kırpılmış çizgi segmentleri listesi
   */
  public static clipLineToPolygon(
    p0: CadPoint2D,
    p1: CadPoint2D,
    polygon: CadPoint2D[],
    isInverted = false
  ): [CadPoint2D, CadPoint2D][] {
    const n = polygon.length;
    if (n < 3) {
      return [[p0, p1]];
    }
    if (![...p0, ...p1, ...polygon.flat()].every(Number.isFinite)) return [];

    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const segmentLengthSquared = dx * dx + dy * dy;
    if (segmentLengthSquared <= 1e-24) {
      const inside = this.isPointInPolygon(p0, polygon);
      return inside !== isInverted ? [[p0, p1]] : [];
    }
    const tValues: number[] = [0.0, 1.0];

    // Çokgenin her kenarı ile segmentin kesişim parametrelerini (t in [0, 1]) bul
    for (let i = 0; i < n; i++) {
      const v0 = polygon[i];
      const v1 = polygon[(i + 1) % n];
      const edx = v1[0] - v0[0];
      const edy = v1[1] - v0[1];

      // İki doğrunun kesişimi: p0 + t*(p1-p0) = v0 + u*(v1-v0)
      const denom = dx * edy - dy * edx;
      if (Math.abs(denom) > 1e-12) {
        const t = ((v0[0] - p0[0]) * edy - (v0[1] - p0[1]) * edx) / denom;
        const u = ((v0[0] - p0[0]) * dy - (v0[1] - p0[1]) * dx) / denom;

        if (t > 1e-6 && t < 1.0 - 1e-6 && u >= -1e-6 && u <= 1.0 + 1e-6) {
          tValues.push(t);
        }
      } else {
        // Paralel ve eşdoğrusal kenarlar: kenar uçlarını segment parametresine
        // ekle ki sınır boyunca uzanan segment de doğru aralıklara ayrılsın.
        const cross = (v0[0] - p0[0]) * dy - (v0[1] - p0[1]) * dx;
        if (Math.abs(cross) <= 1e-10 * Math.max(1, Math.hypot(dx, dy))) {
          for (const vertex of [v0, v1]) {
            const t = ((vertex[0] - p0[0]) * dx + (vertex[1] - p0[1]) * dy) / segmentLengthSquared;
            if (t > 0 && t < 1) tValues.push(t);
          }
        }
      }
    }

    // Parametreleri artan sırada sırala ve tekilleştir
    tValues.sort((a, b) => a - b);
    const uniqueT: number[] = [];
    for (const t of tValues) {
      if (uniqueT.length === 0 || Math.abs(t - uniqueT[uniqueT.length - 1]) > 1e-6) {
        uniqueT.push(t);
      }
    }

    const segments: [CadPoint2D, CadPoint2D][] = [];
    for (let i = 0; i < uniqueT.length - 1; i++) {
      const ta = uniqueT[i];
      const tb = uniqueT[i + 1];
      const tMid = (ta + tb) / 2;
      const midPoint: CadPoint2D = [p0[0] + tMid * dx, p0[1] + tMid * dy];

      const isInside = this.isPointInPolygon(midPoint, polygon);
      const keep = isInverted ? !isInside : isInside;

      if (keep) {
        const segP0: CadPoint2D = [p0[0] + ta * dx, p0[1] + ta * dy];
        const segP1: CadPoint2D = [p0[0] + tb * dx, p0[1] + tb * dy];
        segments.push([segP0, segP1]);
      }
    }

    return segments;
  }

  /**
   * 9. XREF ve dış bağımlılık yolunu güvenli çözer (Path traversal ve uzak URL koruması)
   */
  public static resolveXrefAsset(
    filePath: string,
    allowedBaseDirs: string[] = []
  ): { isAllowed: boolean; resolvedPath?: string; diagnosticCode?: string; message?: string } {
    if (!filePath || filePath.trim() === "") {
      return { isAllowed: false, diagnosticCode: "XREF_PATH_EMPTY", message: "XREF dosya yolu boş." };
    }

    const candidate = filePath.trim();

    // URI schemes (file:, http:, vb.) ve encoded ayraçlar platformdan
    // bağımsız biçimde reddedilir; bu yardımcı URL fetch veya decode yapmaz.
    if ((/^[a-z][a-z0-9+.-]*:/i.test(candidate) && !/^[a-z]:[\\/]/i.test(candidate)) || candidate.includes("%")) {
      return {
        isAllowed: false,
        diagnosticCode: "SEC_XREF_REMOTE_URL_FORBIDDEN",
        message: `URI veya encoded XREF yolu kabul edilmiyor: ${filePath}`,
      };
    }

    const normalizedInput = candidate.replace(/\\/g, "/");
    const segments = normalizedInput.split("/");
    // Mutlak, UNC, traversal ve kontrol karakterli yollar yükleme sınırını aşabilir.
    if (
      /[\u0000-\u001f\u007f]/.test(candidate) ||
      /^[a-z]:\//i.test(normalizedInput) ||
      normalizedInput.startsWith("/") ||
      segments.some((segment) => segment === "..")
    ) {
      return {
        isAllowed: false,
        diagnosticCode: "SEC_PATH_TRAVERSAL_DETECTED",
        message: `Güvenlik ihlali: Path traversal tespit edildi: ${filePath}`,
      };
    }

    const relativePath = segments.filter((segment) => segment !== "" && segment !== ".").join("/");
    if (!relativePath) {
      return { isAllowed: false, diagnosticCode: "XREF_PATH_EMPTY", message: "XREF dosya yolu boş." };
    }

    if (allowedBaseDirs.length > 0) {
      const rawBase = allowedBaseDirs[0]?.trim().replace(/\\/g, "/");
      const baseSegments = rawBase?.split("/") || [];
      if (
        !rawBase || /[\u0000-\u001f\u007f]/.test(rawBase) || rawBase.includes("%") ||
        (/^[a-z][a-z0-9+.-]*:/i.test(rawBase) && !/^[a-z]:\//i.test(rawBase)) ||
        baseSegments.some((segment) => segment === "..")
      ) {
        return {
          isAllowed: false,
          diagnosticCode: "SEC_XREF_BASE_DIR_INVALID",
          message: "XREF için izin verilen temel dizin geçersiz.",
        };
      }
      const base = rawBase.replace(/\/+$/, "");
      if (!(/^[a-z]:\//i.test(base) || base.startsWith("/"))) {
        return {
          isAllowed: false,
          diagnosticCode: "SEC_XREF_BASE_DIR_INVALID",
          message: "XREF için izin verilen temel dizin mutlak bir yol olmalıdır.",
        };
      }
      return { isAllowed: true, resolvedPath: `${base}/${relativePath}` };
    }

    return {
      isAllowed: true,
      resolvedPath: relativePath,
    };
  }
}
