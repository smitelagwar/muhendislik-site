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
      // Path traversal kontrolü (.. veya mutlak sistem yolları)
      if (ref.filePath.includes("..") || /^[a-zA-Z]:[\\\/]/.test(ref.filePath) || ref.filePath.startsWith("/")) {
        diagnostics.push({
          id: `diag_sec_${ref.id}`,
          code: "SEC_PATH_TRAVERSAL_DETECTED",
          severity: "error",
          message: `Güvenlik ihlali: XREF dosya yolu path traversal içeriyor (${ref.filePath})`,
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
}
