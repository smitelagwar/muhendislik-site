// ============================================================================
// DWG/DXF MOTOR V2 — GEOMETRY COMPILER (G08)
// ============================================================================
// Sözleşme: motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md (G08), 29_RENDER_VE_YASAM_DONGUSU.md
// Gereksinimler: R07, R10, R11, R45 | Alt kabul: V05, V06, V07, V08, V10, V11, F08, F09, F12, F13, F14
//
// Yetenekler:
// 1. Arc / Circle uyarlamalı (adaptive) tessellation (hata sınırı <= 0.25 CSS px)
// 2. Ellipse tessellation (majorAxisVector, axisRatio, startParam, endParam)
// 3. LWPolyline bulge (yay segmenti) ve kalınlık (quad/triangulation)
// 4. B-Spline / NURBS De Boor algoritması ile eğri hesaplama
// 5. Hatch sınır döngüleri ve earcut 3.2.3 ile iç delik/ada triangülasyonu
// 6. Linetype (kesikli/noktalı çizgi) faz sürekliliği
// 7. Wipeout arka plan maskeleme
// 8. Painter's draw order korunumu

import earcut from "earcut";
import type {
  CadPoint2D,
  CadEntity,
  CadArcEntity,
  CadCircleEntity,
  CadEllipseEntity,
  CadLwPolylineEntity,
  CadSplineEntity,
  CadHatchEntity,
  CadWipeoutEntity,
  CadLinetype,
} from "../canonical/types";

export interface CompiledLineSegment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  layer: string;
  order: bigint;
  color?: number;
  lineweightMm?: number;
}

export interface CompiledTriangleMesh {
  vertices: Float32Array; // [x0, y0, x1, y1, x2, y2, ...]
  layer: string;
  order: bigint;
  color?: number;
  alpha?: number;
  isWipeout?: boolean;
}

export class GeometryCompiler {
  /**
   * 1. Uyarlamalı (Adaptive) Yay (ARC) Tessellation
   * Hata sınırı (sagitta): s = r * (1 - cos(theta / 2)) <= maxError
   * theta <= 2 * acos(1 - maxError / r)
   */
  public static tessellateArc(
    center: CadPoint2D,
    radius: number,
    startAngleRad: number,
    endAngleRad: number,
    isClockwise = false,
    maxError = 0.25
  ): CadPoint2D[] {
    if (radius <= 0) return [center];

    let sweep = endAngleRad - startAngleRad;
    if (isClockwise) {
      if (sweep > 0) sweep -= Math.PI * 2;
    } else {
      if (sweep < 0) sweep += Math.PI * 2;
    }

    if (Math.abs(sweep) < 1e-9) sweep = Math.PI * 2;

    // Açı adımı hesabı
    const safeError = Math.max(1e-5, Math.min(radius * 0.5, maxError));
    const maxDeltaTheta = 2 * Math.acos(Math.max(-1, Math.min(1, 1 - safeError / radius)));
    const segCount = Math.min(
      512,
      Math.max(8, Math.ceil(Math.abs(sweep) / Math.max(1e-4, maxDeltaTheta)))
    );

    const points: CadPoint2D[] = [];
    for (let i = 0; i <= segCount; i++) {
      const theta = startAngleRad + (sweep * i) / segCount;
      points.push([
        center[0] + radius * Math.cos(theta),
        center[1] + radius * Math.sin(theta),
      ]);
    }
    return points;
  }

  /**
   * 2. Çember (CIRCLE) Tessellation
   */
  public static tessellateCircle(
    center: CadPoint2D,
    radius: number,
    maxError = 0.25
  ): CadPoint2D[] {
    return this.tessellateArc(center, radius, 0, Math.PI * 2, false, maxError);
  }

  /**
   * 3. Elips (ELLIPSE) Tessellation
   * Parametrik denklem: P(t) = Center + cos(t)*majorVector + sin(t)*minorVector
   */
  public static tessellateEllipse(
    center: CadPoint2D,
    majorVector: CadPoint2D,
    axisRatio: number,
    startParam = 0,
    endParam = Math.PI * 2,
    maxError = 0.25
  ): CadPoint2D[] {
    const ux = majorVector[0];
    const uy = majorVector[1];
    const majorLen = Math.hypot(ux, uy);
    if (majorLen <= 1e-9) return [center];

    const safeRatio = Math.max(1e-6, Math.min(1, axisRatio));
    // Minör eksen vektörü: majör eksene dik ve axisRatio ile ölçekli
    const vx = -uy * safeRatio;
    const vy = ux * safeRatio;

    let sweep = endParam - startParam;
    if (sweep <= 0) sweep += Math.PI * 2;

    const safeError = Math.max(1e-5, maxError);
    const maxDelta = 2 * Math.acos(Math.max(-1, Math.min(1, 1 - safeError / majorLen)));
    const segCount = Math.min(
      512,
      Math.max(16, Math.ceil(sweep / Math.max(1e-4, maxDelta)))
    );

    const points: CadPoint2D[] = [];
    for (let i = 0; i <= segCount; i++) {
      const t = startParam + (sweep * i) / segCount;
      const cosT = Math.cos(t);
      const sinT = Math.sin(t);
      points.push([
        center[0] + cosT * ux + sinT * vx,
        center[1] + cosT * uy + sinT * vy,
      ]);
    }
    return points;
  }

  /**
   * 4. Bulge (Yay Bombesi) Segmenti Tessellation
   * Bulge = tan(sweep / 4)
   */
  public static tessellateBulgeSegment(
    p1: CadPoint2D,
    p2: CadPoint2D,
    bulge: number,
    maxError = 0.25
  ): CadPoint2D[] {
    if (Math.abs(bulge) < 1e-6) return [p1, p2];

    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const chordLen = Math.hypot(dx, dy);
    if (chordLen < 1e-9) return [p1, p2];

    const radius = (chordLen * (1 + bulge * bulge)) / (4 * Math.abs(bulge));
    const sweep = 4 * Math.atan(bulge); // işaretli sweep açısı

    // Kiriş orta noktası
    const mx = (p1[0] + p2[0]) / 2;
    const my = (p1[1] + p2[1]) / 2;

    // Kirişe dik birim normal (90 derece saat yönünün tersi)
    const nx = -dy / chordLen;
    const ny = dx / chordLen;

    // Merkez mesafesi
    const h = (chordLen / 2) * ((1 - bulge * bulge) / (2 * bulge));
    const cx = mx - nx * h;
    const cy = my - ny * h;

    const startAngle = Math.atan2(p1[1] - cy, p1[0] - cx);

    const safeError = Math.max(1e-5, maxError);
    const maxDelta = 2 * Math.acos(Math.max(-1, Math.min(1, 1 - safeError / Math.max(1e-5, radius))));
    const segCount = Math.min(
      256,
      Math.max(6, Math.ceil(Math.abs(sweep) / Math.max(1e-4, maxDelta)))
    );

    const points: CadPoint2D[] = [];
    for (let i = 0; i <= segCount; i++) {
      const theta = startAngle + (sweep * i) / segCount;
      points.push([cx + radius * Math.cos(theta), cy + radius * Math.sin(theta)]);
    }
    return points;
  }

  /**
   * 5. LWPOLYLINE Açılımı (Bulge ve Genişlik Desteği)
   */
  public static expandLwPolyline(entity: CadLwPolylineEntity): {
    lineSegments: CompiledLineSegment[];
    thickTriangles: CompiledTriangleMesh | null;
  } {
    const v = entity.vertices;
    if (!v || v.length < 2) return { lineSegments: [], thickTriangles: null };

    const polyPoints: CadPoint2D[] = [];
    const count = entity.isClosed ? v.length : v.length - 1;

    for (let i = 0; i < count; i++) {
      const pCurrent: CadPoint2D = [v[i].x, v[i].y];
      const nextIdx = (i + 1) % v.length;
      const pNext: CadPoint2D = [v[nextIdx].x, v[nextIdx].y];
      const bulge = v[i].bulge || 0;

      if (Math.abs(bulge) > 1e-6) {
        const arcPts = this.tessellateBulgeSegment(pCurrent, pNext, bulge);
        // İlk nokta hariç ekle (önceki parça ile çakışmayı önlemek için)
        if (polyPoints.length === 0) polyPoints.push(arcPts[0]);
        for (let j = 1; j < arcPts.length; j++) {
          polyPoints.push(arcPts[j]);
        }
      } else {
        if (polyPoints.length === 0) polyPoints.push(pCurrent);
        polyPoints.push(pNext);
      }
    }

    // Çizgi parçalarına dönüştür
    const lineSegments: CompiledLineSegment[] = [];
    for (let i = 0; i < polyPoints.length - 1; i++) {
      lineSegments.push({
        x0: polyPoints[i][0],
        y0: polyPoints[i][1],
        x1: polyPoints[i + 1][0],
        y1: polyPoints[i + 1][1],
        layer: entity.layer,
        order: entity.order,
        lineweightMm: entity.lineweightMm,
      });
    }

    // Kalın polyline varsa (constantWidth > 0) quad şeritleri üret
    const width = entity.constantWidth || 0;
    let thickTriangles: CompiledTriangleMesh | null = null;

    if (width > 0 && polyPoints.length >= 2) {
      const halfW = width / 2;
      const triVerts: number[] = [];

      for (let i = 0; i < polyPoints.length - 1; i++) {
        const p1 = polyPoints[i];
        const p2 = polyPoints[i + 1];
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const len = Math.hypot(dx, dy);
        if (len <= 1e-9) continue;

        const nx = (-dy / len) * halfW;
        const ny = (dx / len) * halfW;

        const v0 = [p1[0] + nx, p1[1] + ny];
        const v1 = [p1[0] - nx, p1[1] - ny];
        const v2 = [p2[0] + nx, p2[1] + ny];
        const v3 = [p2[0] - nx, p2[1] - ny];

        // 2 Üçgen: (v0, v1, v2) ve (v1, v3, v2)
        triVerts.push(
          v0[0], v0[1],
          v1[0], v1[1],
          v2[0], v2[1],
          v1[0], v1[1],
          v3[0], v3[1],
          v2[0], v2[1]
        );
      }

      if (triVerts.length > 0) {
        thickTriangles = {
          vertices: new Float32Array(triVerts),
          layer: entity.layer,
          order: entity.order,
          alpha: 1,
        };
      }
    }

    return { lineSegments, thickTriangles };
  }

  /**
   * 6. De Boor Algoritması ile B-Spline / NURBS Tessellation
   */
  public static tessellateSpline(
    spline: CadSplineEntity,
    maxError = 0.25
  ): CadPoint2D[] {
    const cp = spline.controlPoints;
    const knots = spline.knots;
    const p = spline.degree || 3;

    if (!cp || cp.length < p + 1 || !knots || knots.length < cp.length + p + 1) {
      return cp || [];
    }

    const n = cp.length - 1;
    const uMin = knots[p];
    const uMax = knots[n + 1];
    if (uMin >= uMax) return cp;

    const weights = spline.weights || new Array(cp.length).fill(1);
    const segCount = Math.min(512, Math.max(32, cp.length * 16));
    const points: CadPoint2D[] = [];

    // De Boor fonksiyonu (u parametresinde nokta hesaplar)
    function deBoor(u: number): CadPoint2D {
      let k = p;
      while (k < n && knots[k + 1] <= u) k++;
      if (u >= uMax) k = n;

      const d: Array<[number, number, number]> = [];
      for (let i = 0; i <= p; i++) {
        const idx = k - p + i;
        const pt = cp[idx] || [0, 0];
        const w = weights[idx] ?? 1;
        d.push([pt[0] * w, pt[1] * w, w]);
      }

      for (let r = 1; r <= p; r++) {
        for (let j = p; j >= r; j--) {
          const i = k - p + j;
          const denom = knots[i + p + 1 - r] - knots[i];
          const alpha = denom !== 0 ? (u - knots[i]) / denom : 0;
          d[j] = [
            (1 - alpha) * d[j - 1][0] + alpha * d[j][0],
            (1 - alpha) * d[j - 1][1] + alpha * d[j][1],
            (1 - alpha) * d[j - 1][2] + alpha * d[j][2],
          ];
        }
      }

      const w = d[p][2] !== 0 ? d[p][2] : 1;
      return [d[p][0] / w, d[p][1] / w];
    }

    for (let i = 0; i <= segCount; i++) {
      const u = uMin + ((uMax - uMin) * i) / segCount;
      points.push(deBoor(u));
    }

    return points;
  }

  /**
   * 7. HATCH Üçgenleme (earcut 3.2.3 ile delik ve iç ada desteği)
   */
  public static triangulateHatch(hatch: CadHatchEntity): {
    mesh: CompiledTriangleMesh | null;
    boundaryLines: CompiledLineSegment[];
  } {
    const boundaryLines: CompiledLineSegment[] = [];
    if (!hatch.loops || hatch.loops.length === 0) {
      return { mesh: null, boundaryLines };
    }

    // Her döngüyü düz 2D nokta poligonuna çevir
    const polygonRings: CadPoint2D[][] = [];

    for (const loop of hatch.loops) {
      const ring: CadPoint2D[] = [];

      if (loop.isPolyline && loop.vertices) {
        for (let i = 0; i < loop.vertices.length; i++) {
          const pt = loop.vertices[i];
          ring.push(pt);
        }
      } else if (loop.edges) {
        for (const edge of loop.edges) {
          if (edge.type === "LINE") {
            ring.push(edge.start);
          } else if (edge.type === "ARC") {
            const arcPts = this.tessellateArc(
              edge.center,
              edge.radius,
              edge.startAngleRad,
              edge.endAngleRad,
              !edge.ccw
            );
            for (let j = 0; j < arcPts.length - 1; j++) {
              ring.push(arcPts[j]);
            }
          }
        }
      }

      // Halka kapalıysa son tekrarlanan noktayı çıkar
      if (ring.length > 2) {
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (Math.hypot(first[0] - last[0], first[1] - last[1]) < 1e-5) {
          ring.pop();
        }
      }

      if (ring.length >= 3) {
        polygonRings.push(ring);

        // Sınır çizgilerini topla
        for (let i = 0; i < ring.length; i++) {
          const p1 = ring[i];
          const p2 = ring[(i + 1) % ring.length];
          boundaryLines.push({
            x0: p1[0],
            y0: p1[1],
            x1: p2[0],
            y1: p2[1],
            layer: hatch.layer,
            order: hatch.order,
          });
        }
      }
    }

    if (polygonRings.length === 0) {
      return { mesh: null, boundaryLines };
    }

    // Döngü alanlarını hesapla (Shoelace formülü)
    function ringArea(ring: CadPoint2D[]): number {
      let area = 0;
      for (let i = 0; i < ring.length; i++) {
        const p1 = ring[i];
        const p2 = ring[(i + 1) % ring.length];
        area += p1[0] * p2[1] - p2[0] * p1[1];
      }
      return area / 2;
    }

    // En büyük mutlak alana sahip döngü dış sınır (outer boundary), diğerleri iç delikler (holes)
    let outerIdx = 0;
    let maxArea = -Infinity;
    for (let i = 0; i < polygonRings.length; i++) {
      const a = Math.abs(ringArea(polygonRings[i]));
      if (a > maxArea) {
        maxArea = a;
        outerIdx = i;
      }
    }

    const outerRing = polygonRings[outerIdx];
    const holeRings = polygonRings.filter((_, idx) => idx !== outerIdx);

    // Earcut için düz koordinat dizisi ve delik indeksleri hazırla
    const flatCoords: number[] = [];
    const holeIndices: number[] = [];

    // Dış döngü saat yönünün tersine (CCW - pozitif alan) olmalıdır
    if (ringArea(outerRing) < 0) outerRing.reverse();
    for (const pt of outerRing) {
      flatCoords.push(pt[0], pt[1]);
    }

    // Delikler saat yönünde (CW - negatif alan) olmalıdır
    for (const hole of holeRings) {
      if (ringArea(hole) > 0) hole.reverse();
      holeIndices.push(flatCoords.length / 2);
      for (const pt of hole) {
        flatCoords.push(pt[0], pt[1]);
      }
    }

    // earcut 3.2.3 çağrısı
    const triangles = earcut(flatCoords, holeIndices, 2);
    if (!triangles || triangles.length === 0) {
      return { mesh: null, boundaryLines };
    }

    const meshVerts = new Float32Array(triangles.length * 2);
    for (let i = 0; i < triangles.length; i++) {
      const vIdx = triangles[i];
      meshVerts[i * 2] = flatCoords[vIdx * 2];
      meshVerts[i * 2 + 1] = flatCoords[vIdx * 2 + 1];
    }

    const mesh: CompiledTriangleMesh = {
      vertices: meshVerts,
      layer: hatch.layer,
      order: hatch.order,
      alpha: 1,
    };

    return { mesh, boundaryLines };
  }

  /**
   * 8. WIPEOUT Üçgenleme
   */
  public static triangulateWipeout(wipeout: CadWipeoutEntity): CompiledTriangleMesh | null {
    const v = wipeout.vertices;
    if (!v || v.length < 3) return null;

    const flatCoords: number[] = [];
    for (const pt of v) {
      flatCoords.push(pt[0], pt[1]);
    }

    const triangles = earcut(flatCoords, null, 2);
    if (!triangles || triangles.length === 0) return null;

    const meshVerts = new Float32Array(triangles.length * 2);
    for (let i = 0; i < triangles.length; i++) {
      const idx = triangles[i];
      meshVerts[i * 2] = flatCoords[idx * 2];
      meshVerts[i * 2 + 1] = flatCoords[idx * 2 + 1];
    }

    return {
      vertices: meshVerts,
      layer: wipeout.layer,
      order: wipeout.order,
      isWipeout: true,
      alpha: 1,
    };
  }

  /**
   * 9. Linetype (Çizgi Tipi) Faz Sürekliliği
   * Poligonal yol boyunca pattern adımlarını kümülatif mesafe ile böler.
   */
  public static applyLinetype(
    points: CadPoint2D[],
    pattern: number[],
    scale = 1.0,
    initialPhase = 0
  ): { segments: Array<{ x0: number; y0: number; x1: number; y1: number }>; finalPhase: number } {
    if (!pattern || pattern.length === 0 || points.length < 2) {
      const segs: Array<{ x0: number; y0: number; x1: number; y1: number }> = [];
      for (let i = 0; i < points.length - 1; i++) {
        segs.push({
          x0: points[i][0],
          y0: points[i][1],
          x1: points[i + 1][0],
          y1: points[i + 1][1],
        });
      }
      return { segments: segs, finalPhase: initialPhase };
    }

    const scaledPattern = pattern.map((p) => p * Math.max(1e-4, scale));
    const totalPatternLen = scaledPattern.reduce((acc, p) => acc + Math.abs(p), 0);
    if (totalPatternLen <= 1e-6) {
      return { segments: [], finalPhase: initialPhase };
    }

    let patternIdx = 0;
    let currentPhase = initialPhase % totalPatternLen;
    if (currentPhase < 0) currentPhase += totalPatternLen;

    // Fazın denk geldiği pattern elemanını ve kalan uzunluğunu bul
    let accumulated = 0;
    for (let i = 0; i < scaledPattern.length; i++) {
      const elLen = Math.abs(scaledPattern[i]);
      if (accumulated + elLen > currentPhase) {
        patternIdx = i;
        break;
      }
      accumulated += elLen;
    }

    const segments: Array<{ x0: number; y0: number; x1: number; y1: number }> = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const segLen = Math.hypot(dx, dy);
      if (segLen <= 1e-9) continue;

      const dirX = dx / segLen;
      const dirY = dy / segLen;
      let distCovered = 0;

      while (distCovered < segLen) {
        const elValue = scaledPattern[patternIdx];
        const elLen = Math.abs(elValue);
        const elRemaining = elLen - (currentPhase - accumulated);
        const step = Math.min(segLen - distCovered, elRemaining);

        const startX = p1[0] + dirX * distCovered;
        const startY = p1[1] + dirY * distCovered;
        const endX = p1[0] + dirX * (distCovered + step);
        const endY = p1[1] + dirY * (distCovered + step);

        // Pozitif değer çizgi (dash), negatif değer boşluk (gap)
        if (elValue > 0) {
          segments.push({ x0: startX, y0: startY, x1: endX, y1: endY });
        }

        distCovered += step;
        currentPhase += step;

        if (currentPhase >= accumulated + elLen - 1e-6) {
          patternIdx = (patternIdx + 1) % scaledPattern.length;
          accumulated = (accumulated + elLen) % totalPatternLen;
          if (patternIdx === 0) {
            currentPhase = 0;
            accumulated = 0;
          }
        }
      }
    }

    return { segments, finalPhase: currentPhase };
  }
}
