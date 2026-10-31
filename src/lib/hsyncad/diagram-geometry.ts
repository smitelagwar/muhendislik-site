import type { Point } from "./model";
import type { AnalysisResult } from "./analysis";

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface StationData {
  x: number;
  N?: number;
  V2?: number;
  V3?: number;
  T?: number;
  M2?: number;
  M3?: number;
  stationIndex?: number;
  ratio?: number;
}

export type ForceDiagramType = "M3" | "V2" | "N";

/**
 * Turkish Civil Engineering / TS 500 / ideCAD canonical tension-face normal vector.
 * For beams running in 2D plan, the canonical orientation ensures consistent normal
 * pointing "up" (positive y-direction) regardless of whether the member was clicked
 * left-to-right or right-to-left.
 */
export function computeTensionFaceNormal(dx: number, dy: number): {
  nx: number;
  ny: number;
  tx: number;
  ty: number;
  L: number;
} {
  const L = Math.hypot(dx, dy);
  if (L < 1e-6) {
    return { nx: 0, ny: 1, tx: 1, ty: 0, L: 0 };
  }
  const tx = dx / L;
  const ty = dy / L;

  // Canonical rule: if tx > 1e-6 or (abs(tx) <= 1e-6 and ty > 0), normal is (-ty, tx).
  // Otherwise, normal is (ty, -tx).
  const isCanonical = tx > 1e-6 || (Math.abs(tx) <= 1e-6 && ty > 0);
  const nx = isCanonical ? -ty : ty;
  const ny = isCanonical ? tx : -tx;

  return { nx, ny, tx, ty, L };
}

/**
 * Calculates auto-scale factor for force diagrams so peak values approximate 0.60 m.
 */
export function calculateAutoDiagramScale(
  stationMap: Record<string, StationData[] | undefined>,
  forceType: ForceDiagramType,
  targetHeightM = 0.60
): number {
  let maxAbs = 0;
  for (const list of Object.values(stationMap)) {
    if (!list || !list.length) continue;
    for (const s of list) {
      const val = forceType === "M3" ? (s.M3 ?? 0) : forceType === "V2" ? (s.V2 ?? 0) : (s.N ?? 0);
      const absVal = Math.abs(val);
      if (absVal > maxAbs) maxAbs = absVal;
    }
  }
  return targetHeightM / Math.max(1.0, maxAbs);
}

/**
 * Calculates magnification factor for 2D/3D deformations.
 * Real drifts (5 - 30 mm) are magnified to ~6% of building characteristic dimension.
 */
export function calculateAutoDeformationScale(
  displacements: Record<string, [number, number, number, number, number, number] | undefined>,
  buildingDimensionM: number
): number {
  let maxDrift = 0;
  for (const d of Object.values(displacements)) {
    if (!d) continue;
    const mag = Math.hypot(d[0], d[1], d[2]);
    if (mag > maxDrift) maxDrift = mag;
  }
  if (maxDrift < 1e-7) return 100;
  const raw = (0.06 * Math.max(5, buildingDimensionM)) / maxDrift;
  return Math.min(2000, Math.max(10, Math.round(raw)));
}

/**
 * Computes 2D SVG diagram coordinates, tie lines, and peak labels.
 * Tension-face convention:
 * M3 > 0 (sagging / span tension) is plotted with a negative normal offset
 * so it appears on the bottom face of the beam.
 * M3 < 0 (hogging / support tension) is plotted with a positive normal offset (top face).
 */
export function get2DBeamDiagram(
  start: Point,
  end: Point,
  stations: StationData[],
  forceType: ForceDiagramType,
  scale: number,
  screen: (p: Point) => Point
): {
  polygonPoints: string;
  curveScreenPoints: Point[];
  tieLines: { from: Point; to: Point; val: number }[];
  peakSpan: { x: number; val: number; screen: Point };
  support1: { x: number; val: number; screen: Point };
  support2: { x: number; val: number; screen: Point };
} {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const { nx, ny, tx, ty, L } = computeTensionFaceNormal(dx, dy);

  if (L < 1e-6 || !stations.length) {
    const sZero = screen(start);
    return {
      polygonPoints: `${sZero.x},${sZero.y}`,
      curveScreenPoints: [sZero],
      tieLines: [],
      peakSpan: { x: 0, val: 0, screen: sZero },
      support1: { x: 0, val: 0, screen: sZero },
      support2: { x: 0, val: 0, screen: sZero },
    };
  }

  let maxSpanAbs = -1;
  let maxSpanIdx = Math.floor(stations.length / 2);

  const curveWorld: Point[] = [];
  const tieLines: { from: Point; to: Point; val: number }[] = [];

  for (let i = 0; i < stations.length; i++) {
    const s = stations[i];
    const val = forceType === "M3" ? (s.M3 ?? 0) : forceType === "V2" ? (s.V2 ?? 0) : (s.N ?? 0);
    // For M3, negative offset draws M3 > 0 on bottom face (tension face)
    const offset = forceType === "M3" ? -scale * val : scale * val;

    const basePoint: Point = {
      x: start.x + s.x * tx,
      y: start.y + s.x * ty,
    };
    const diagPoint: Point = {
      x: basePoint.x + offset * nx,
      y: basePoint.y + offset * ny,
    };
    curveWorld.push(diagPoint);

    // Track span peak (excluding immediate end supports 0 and N-1)
    if (i > 0 && i < stations.length - 1 && Math.abs(val) > maxSpanAbs) {
      maxSpanAbs = Math.abs(val);
      maxSpanIdx = i;
    }

    // Tie lines at stations 0, 2, 5, 8, 10
    if (i === 0 || i === Math.round(stations.length * 0.25) || i === Math.round(stations.length * 0.5) || i === Math.round(stations.length * 0.75) || i === stations.length - 1) {
      tieLines.push({
        from: screen(basePoint),
        to: screen(diagPoint),
        val,
      });
    }
  }

  const sStart = screen(start);
  const sEnd = screen(end);
  const curveScreenPoints = curveWorld.map(p => screen(p));

  // Closed polygon: start baseline -> curve stations -> end baseline -> close
  const polygonPoints = `${sStart.x},${sStart.y} ` +
    curveScreenPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") +
    ` ${sEnd.x},${sEnd.y}`;

  const s0 = stations[0];
  const sEndStation = stations[stations.length - 1];
  const sMid = stations[maxSpanIdx];

  const val0 = forceType === "M3" ? (s0.M3 ?? 0) : forceType === "V2" ? (s0.V2 ?? 0) : (s0.N ?? 0);
  const valEnd = forceType === "M3" ? (sEndStation.M3 ?? 0) : forceType === "V2" ? (sEndStation.V2 ?? 0) : (sEndStation.N ?? 0);
  const valMid = forceType === "M3" ? (sMid.M3 ?? 0) : forceType === "V2" ? (sMid.V2 ?? 0) : (sMid.N ?? 0);

  return {
    polygonPoints,
    curveScreenPoints,
    tieLines,
    peakSpan: { x: sMid.x, val: valMid, screen: curveScreenPoints[maxSpanIdx] },
    support1: { x: s0.x, val: val0, screen: curveScreenPoints[0] },
    support2: { x: sEndStation.x, val: valEnd, screen: curveScreenPoints[curveScreenPoints.length - 1] },
  };
}

/**
 * Linearly interpolates internal forces at span fraction t in [0, 1].
 */
export function interpolateStationForces(
  stations: StationData[],
  t: number
): {
  x: number;
  N: number;
  V2: number;
  V3: number;
  T: number;
  M2: number;
  M3: number;
} {
  if (stations.length < 2) {
    const s = stations[0];
    return s
      ? {
          x: s.x ?? 0,
          N: s.N ?? 0,
          V2: s.V2 ?? 0,
          V3: s.V3 ?? 0,
          T: s.T ?? 0,
          M2: s.M2 ?? 0,
          M3: s.M3 ?? 0,
        }
      : { x: 0, N: 0, V2: 0, V3: 0, T: 0, M2: 0, M3: 0 };
  }
  const clampedT = Math.max(0, Math.min(1, t));
  const numIntervals = stations.length - 1;
  const rawIdx = clampedT * numIntervals;
  const k = Math.min(numIntervals - 1, Math.floor(rawIdx));
  const alpha = rawIdx - k;

  const s1 = stations[k];
  const s2 = stations[k + 1] ?? s1;

  const lerp = (a: number | undefined, b: number | undefined) =>
    (1 - alpha) * (a ?? 0) + alpha * (b ?? 0);

  return {
    x: lerp(s1.x, s2.x),
    N: lerp(s1.N, s2.N),
    V2: lerp(s1.V2, s2.V2),
    V3: lerp(s1.V3, s2.V3),
    T: lerp(s1.T, s2.T),
    M2: lerp(s1.M2, s2.M2),
    M3: lerp(s1.M3, s2.M3),
  };
}

/**
 * Projects a 2D point onto a line segment and calculates distance.
 */
export function projectPointToSegment(
  p: Point,
  a: Point,
  b: Point
): { t: number; proj: Point; distance: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const L2 = dx * dx + dy * dy;
  if (L2 < 1e-9) {
    const d = Math.hypot(p.x - a.x, p.y - a.y);
    return { t: 0, proj: { ...a }, distance: d };
  }
  const rawT = ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2;
  const t = Math.max(0, Math.min(1, rawT));
  const proj: Point = {
    x: a.x + t * dx,
    y: a.y + t * dy,
  };
  const distance = Math.hypot(p.x - proj.x, p.y - proj.y);
  return { t, proj, distance };
}

/**
 * Maps Demand-Capacity Ratio (DCR) to standard Turkish structural colors.
 */
export function getDcrColor(ratio: number): string {
  if (ratio <= 0.50) return "#22c55e"; // Green: safe / large reserve
  if (ratio <= 0.70) return "#84cc16"; // Lime: safe
  if (ratio <= 0.90) return "#eab308"; // Yellow: moderate
  if (ratio <= 1.00) return "#f97316"; // Orange: near capacity
  return "#ef4444";                    // Crimson: over capacity
}

/**
 * Hex number version for Three.js materials.
 */
export function getDcrColorHex(ratio: number): number {
  if (ratio <= 0.50) return 0x22c55e;
  if (ratio <= 0.70) return 0x84cc16;
  if (ratio <= 0.90) return 0xeab308;
  if (ratio <= 1.00) return 0xf97316;
  return 0xef4444;
}

/**
 * Coordinate mapping: CAD/FEM (X, Y, Z_elevation) to Three.js (X, Y_elevation, Z).
 * One model unit is one metre. Plan +Y maps to world -Z; world +Y is elevation.
 */
export function cadToThreeCoord(x: number, y: number, z: number): [number, number, number] {
  return [x, z, -y];
}

/**
 * Displacement vector mapping from CAD/FEM to Three.js world axes.
 */
export function cadToThreeDisplacement(ux: number, uy: number, uz: number): [number, number, number] {
  return [ux, uz, -uy];
}

/**
 * 3D Extruded Ribbon Quad Strip Generator.
 * For each interval between station k and k+1:
 * Generates 1 quad = 2 triangles = 6 vertices connecting baseline S to crest C.
 * 10 intervals = 20 triangles = 60 vertices total.
 */
export function build3DRibbonData(
  startCad: Point3D,
  endCad: Point3D,
  memberType: "beam" | "column" | "wall",
  stations: StationData[],
  forceType: ForceDiagramType,
  scale: number,
  rotationDeg = 0
): {
  meshPositions: Float32Array;
  crestPositions: Float32Array;
  baselinePositions: Float32Array;
  endCapPositions: Float32Array;
} {
  const dx = endCad.x - startCad.x;
  const dy = endCad.y - startCad.y;
  const dz = endCad.z - startCad.z;
  const L = Math.hypot(dx, dy, dz);

  if (L < 1e-6 || stations.length < 2) {
    return {
      meshPositions: new Float32Array(0),
      crestPositions: new Float32Array(0),
      baselinePositions: new Float32Array(0),
      endCapPositions: new Float32Array(0),
    };
  }

  const tx = dx / L;
  const ty = dy / L;
  const tz = dz / L;

  // Extrusion direction in Three.js coordinates
  let nxThree = 0;
  let nyThree = 1; // Default vertical extrusion (+Y in Three.js) for beams
  let nzThree = 0;

  if (memberType === "column" || memberType === "wall") {
    // For vertical columns, extrusion is in the horizontal plane along local bending axis
    const rad = (rotationDeg * Math.PI) / 180;
    // local y' is (cos beta, sin beta, 0) in CAD -> (cos beta, 0, -sin beta) in Three.js
    nxThree = Math.cos(rad);
    nyThree = 0;
    nzThree = -Math.sin(rad);
  }

  const numStations = stations.length;
  const baselinesThree: [number, number, number][] = [];
  const crestsThree: [number, number, number][] = [];

  for (let i = 0; i < numStations; i++) {
    const s = stations[i];
    const val = forceType === "M3" ? (s.M3 ?? 0) : forceType === "V2" ? (s.V2 ?? 0) : (s.N ?? 0);
    // In Three.js for beams: M3 > 0 tension face points downward (-Y)
    const factor = (memberType === "beam" && forceType === "M3") ? -scale * val : scale * val;

    // CAD station point
    const sCadX = startCad.x + s.x * tx;
    const sCadY = startCad.y + s.x * ty;
    const sCadZ = startCad.z + s.x * tz;

    // Map to Three.js base
    const [bx, by, bz] = cadToThreeCoord(sCadX, sCadY, sCadZ);
    baselinesThree.push([bx, by, bz]);

    // Offset along extrusion normal
    crestsThree.push([
      bx + factor * nxThree,
      by + factor * nyThree,
      bz + factor * nzThree,
    ]);
  }

  // 1 quad = 2 triangles = 6 vertices (18 floats) per interval
  const numQuads = numStations - 1;
  const meshPositions = new Float32Array(numQuads * 18);
  let ptr = 0;

  for (let i = 0; i < numQuads; i++) {
    const b0 = baselinesThree[i];
    const b1 = baselinesThree[i + 1];
    const c0 = crestsThree[i];
    const c1 = crestsThree[i + 1];

    // Triangle 1: b0, c0, b1
    meshPositions[ptr++] = b0[0]; meshPositions[ptr++] = b0[1]; meshPositions[ptr++] = b0[2];
    meshPositions[ptr++] = c0[0]; meshPositions[ptr++] = c0[1]; meshPositions[ptr++] = c0[2];
    meshPositions[ptr++] = b1[0]; meshPositions[ptr++] = b1[1]; meshPositions[ptr++] = b1[2];

    // Triangle 2: c0, c1, b1
    meshPositions[ptr++] = c0[0]; meshPositions[ptr++] = c0[1]; meshPositions[ptr++] = c0[2];
    meshPositions[ptr++] = c1[0]; meshPositions[ptr++] = c1[1]; meshPositions[ptr++] = c1[2];
    meshPositions[ptr++] = b1[0]; meshPositions[ptr++] = b1[1]; meshPositions[ptr++] = b1[2];
  }

  // Crest line: line strip through all crests (numStations points * 3)
  const crestPositions = new Float32Array(numStations * 3);
  for (let i = 0; i < numStations; i++) {
    crestPositions[i * 3 + 0] = crestsThree[i][0];
    crestPositions[i * 3 + 1] = crestsThree[i][1];
    crestPositions[i * 3 + 2] = crestsThree[i][2];
  }

  // Baseline line
  const baselinePositions = new Float32Array(numStations * 3);
  for (let i = 0; i < numStations; i++) {
    baselinePositions[i * 3 + 0] = baselinesThree[i][0];
    baselinePositions[i * 3 + 1] = baselinesThree[i][1];
    baselinePositions[i * 3 + 2] = baselinesThree[i][2];
  }

  // End cap verticals (2 lines = 4 points * 3 = 12 floats)
  const endCapPositions = new Float32Array(12);
  // Cap 0: b0 -> c0
  endCapPositions[0] = baselinesThree[0][0];
  endCapPositions[1] = baselinesThree[0][1];
  endCapPositions[2] = baselinesThree[0][2];
  endCapPositions[3] = crestsThree[0][0];
  endCapPositions[4] = crestsThree[0][1];
  endCapPositions[5] = crestsThree[0][2];
  // Cap end: b_last -> c_last
  const last = numStations - 1;
  endCapPositions[6] = baselinesThree[last][0];
  endCapPositions[7] = baselinesThree[last][1];
  endCapPositions[8] = baselinesThree[last][2];
  endCapPositions[9] = crestsThree[last][0];
  endCapPositions[10] = crestsThree[last][1];
  endCapPositions[11] = crestsThree[last][2];

  return {
    meshPositions,
    crestPositions,
    baselinePositions,
    endCapPositions,
  };
}

/**
 * Maps normalized displacement ratio rho in [0, 1] to a scientific heatmap RGB color.
 * Color ramp:
 * - rho in [0.00, 0.25]: Blue (0.1, 0.4, 0.95) to Cyan (0.1, 0.85, 0.95)
 * - rho in [0.25, 0.50]: Cyan to Green (0.2, 0.8, 0.2)
 * - rho in [0.50, 0.75]: Green to Yellow (0.9, 0.8, 0.1)
 * - rho in [0.75, 1.00]: Yellow to Red (0.9, 0.2, 0.1)
 */
export function getDisplacementHeatmapColor(rho: number): [number, number, number] {
  const rClamped = Math.max(0, Math.min(1, rho));
  if (rClamped <= 0.25) {
    const s = rClamped / 0.25;
    return [0.1, 0.4 + 0.45 * s, 0.95];
  }
  if (rClamped <= 0.50) {
    const s = (rClamped - 0.25) / 0.25;
    return [0.1 + 0.1 * s, 0.85 - 0.05 * s, 0.95 - 0.75 * s];
  }
  if (rClamped <= 0.75) {
    const s = (rClamped - 0.50) / 0.25;
    return [0.2 + 0.7 * s, 0.8, 0.2 - 0.1 * s];
  }
  const s = (rClamped - 0.75) / 0.25;
  return [0.9, 0.8 - 0.6 * s, 0.1];
}

/**
 * Computes maximum resultant displacement magnitude across the building
 * from floor diaphragms and discrete joint displacements.
 */
export function getMaxDisplacementMagnitude(analysisResult?: AnalysisResult | null): number {
  if (!analysisResult) return 0.01;
  let maxD = 0;
  if (analysisResult.floorDiaphragms) {
    for (const dia of analysisResult.floorDiaphragms) {
      const dx = (dia as any).displacementX ?? (dia as any).ux ?? 0;
      const dy = (dia as any).displacementY ?? (dia as any).uy ?? 0;
      const mag = Math.hypot(dx, dy);
      if (mag > maxD) maxD = mag;
    }
  }
  if (analysisResult.displacements) {
    for (const d of Object.values(analysisResult.displacements)) {
      if (!d) continue;
      const mag = Math.hypot(d[0], d[1], d[2]);
      if (mag > maxD) maxD = mag;
    }
  }
  return Math.max(1e-6, maxD);
}

/**
 * Calculates 3D vertex displacement kinematics [ux, uy, uz] in CAD space for any vertex (cadX, cadY, cadZ).
 * Supports:
 * 1. Node-level lookup for discrete joints from analysisResult.displacements if within 2cm tolerance.
 * 2. Multi-storey floor diaphragm kinematics with elevation-dependent interpolation:
 *    - Foundation / ground level (cadZ <= 0): clamped to [0, 0, 0].
 *    - Storey 1 zone (0 < cadZ <= dia[0].elevation): linear interpolation from ground [0, 0, 0] to storey 1 diaphragm.
 *    - Multi-storey intermediate zone (dia[i].elevation <= cadZ <= dia[i+1].elevation): linear interpolation between diaphragm i and i+1.
 *    - Roof / above top storey (cadZ >= dia[last].elevation): top diaphragm rigid kinematics.
 *    - Kinematics: ux = dia.ux - dia.rz * (cadY - dia.centerY), uy = dia.uy + dia.rz * (cadX - dia.centerX).
 * 3. Fallback to node displacement map.
 */
export function getVertexDisplacement(
  cadX: number,
  cadY: number,
  cadZ: number,
  analysisResult?: AnalysisResult | null
): [number, number, number] {
  if (!analysisResult) return [0, 0, 0];

  // Ground level / foundation clamping: supports have 0 translation
  if (cadZ <= 0) return [0, 0, 0];

  // Discrete joint node lookup if available
  if (analysisResult.femOutput?.nodes && analysisResult.displacements) {
    for (const node of analysisResult.femOutput.nodes) {
      if (Math.hypot(node.x - cadX, node.y - cadY, node.z - cadZ) < 0.02) {
        const d = analysisResult.displacements[node.id];
        if (d) return [d[0], d[1], d[2]];
      }
    }
  }

  // Multi-storey floor diaphragm kinematics
  const diaphragms = analysisResult.floorDiaphragms;
  if (diaphragms && diaphragms.length > 0) {
    const sorted = [...diaphragms].sort((a, b) => a.elevation - b.elevation);
    const n = sorted.length;

    // Helper to extract diaphragm values safely
    const getDiaProps = (d: any) => ({
      elevation: d.elevation ?? 0,
      ux: d.displacementX ?? d.ux ?? 0,
      uy: d.displacementY ?? d.uy ?? 0,
      rz: d.rotationZ ?? d.rz ?? 0,
      cx: d.centerX ?? d.cx ?? 0,
      cy: d.centerY ?? d.cy ?? 0,
    });

    const d0 = getDiaProps(sorted[0]);

    // Below first storey diaphragm: interpolate from 0 at ground level (Z=0)
    if (cadZ <= d0.elevation) {
      const z0 = d0.elevation;
      const alpha = z0 > 1e-6 ? Math.max(0, Math.min(1, cadZ / z0)) : 1.0;
      const uxDia = alpha * d0.ux;
      const uyDia = alpha * d0.uy;
      const rzDia = alpha * d0.rz;
      const ux = uxDia - rzDia * (cadY - d0.cy);
      const uy = uyDia + rzDia * (cadX - d0.cx);
      return [ux, uy, 0];
    }

    const dLast = getDiaProps(sorted[n - 1]);

    // Above top storey diaphragm: use top diaphragm
    if (cadZ >= dLast.elevation) {
      const ux = dLast.ux - dLast.rz * (cadY - dLast.cy);
      const uy = dLast.uy + dLast.rz * (cadX - dLast.cx);
      return [ux, uy, 0];
    }

    // Between storeys i and i+1: linear interpolation
    for (let i = 0; i < n - 1; i++) {
      const d1 = getDiaProps(sorted[i]);
      const d2 = getDiaProps(sorted[i + 1]);
      if (cadZ >= d1.elevation && cadZ <= d2.elevation) {
        const dz = d2.elevation - d1.elevation;
        const alpha = dz > 1e-6 ? Math.max(0, Math.min(1, (cadZ - d1.elevation) / dz)) : 0;
        const uxInterp = (1 - alpha) * d1.ux + alpha * d2.ux;
        const uyInterp = (1 - alpha) * d1.uy + alpha * d2.uy;
        const rzInterp = (1 - alpha) * d1.rz + alpha * d2.rz;
        const cxInterp = (1 - alpha) * d1.cx + alpha * d2.cx;
        const cyInterp = (1 - alpha) * d1.cy + alpha * d2.cy;

        const ux = uxInterp - rzInterp * (cadY - cyInterp);
        const uy = uyInterp + rzInterp * (cadX - cxInterp);
        return [ux, uy, 0];
      }
    }
  }

  // Fallback: search displacements dictionary for any non-zero vector
  for (const disp of Object.values(analysisResult.displacements ?? {})) {
    if (disp && (Math.abs(disp[0]) > 0 || Math.abs(disp[1]) > 0 || Math.abs(disp[2]) > 0)) {
      return [disp[0], disp[1], disp[2]];
    }
  }

  return [0, 0, 0];
}

/**
 * Projects a 3D raycast intersection point (in Three.js world coordinates)
 * onto a structural member's axis to compute:
 * - t in [0, 1]: normalized station along the member span
 * - x: physical station position in meters (t * L)
 * - L: member span length in meters
 */
export function projectRaycastHitToStation(
  hitPoint: { x: number; y: number; z: number },
  element: any,
  floor?: { elevation: number; height: number }
): { t: number; x: number; L: number } {
  const elev = floor?.elevation ?? 0;
  const fHeight = floor?.height ?? 3.0;

  let p1Three: { x: number; y: number; z: number };
  let p2Three: { x: number; y: number; z: number };
  let L = 3.0;

  if (element.type === "beam") {
    L = Math.hypot(element.end.x - element.start.x, element.end.y - element.start.y);
    const beamY = elev + fHeight;
    p1Three = { x: element.start.x, y: beamY, z: -element.start.y };
    p2Three = { x: element.end.x, y: beamY, z: -element.end.y };
  } else if (element.type === "column") {
    const colHeight = element.height || fHeight || 3.0;
    L = colHeight;
    const posX = element.position?.x ?? element.x ?? 0;
    const posY = element.position?.y ?? element.y ?? 0;
    const bottomZ = element.bottomZ ?? elev;
    p1Three = { x: posX, y: bottomZ, z: -posY };
    p2Three = { x: posX, y: bottomZ + colHeight, z: -posY };
  } else if (element.type === "wall") {
    L = Math.hypot(element.end.x - element.start.x, element.end.y - element.start.y);
    const wallY = (element.bottomZ ?? elev) + (element.height || fHeight || 3.0) * 0.5;
    p1Three = { x: element.start.x, y: wallY, z: -element.start.y };
    p2Three = { x: element.end.x, y: wallY, z: -element.end.y };
  } else {
    return { t: 0.5, x: 1.5, L: 3.0 };
  }

  const dx = p2Three.x - p1Three.x;
  const dy = p2Three.y - p1Three.y;
  const dz = p2Three.z - p1Three.z;
  const lenSq = dx * dx + dy * dy + dz * dz;

  if (lenSq < 1e-6) {
    return { t: 0.5, x: L * 0.5, L };
  }

  const vHitX = hitPoint.x - p1Three.x;
  const vHitY = hitPoint.y - p1Three.y;
  const vHitZ = hitPoint.z - p1Three.z;
  const dot = vHitX * dx + vHitY * dy + vHitZ * dz;
  const rawT = dot / lenSq;
  const t = Math.max(0, Math.min(1, rawT));
  const x = t * L;

  return { t, x, L };
}
