import type { CadPoint2d } from "./schema";

export interface CadCloudOptions {
  arcRadius?: number;
  segmentsPerArc?: number;
}

/**
 * Generates points forming a revision cloud around a bounding box (p1 to p2).
 * Each edge is divided into scalloped outward circular arcs.
 */
export function generateRevisionCloudPoints(
  p1: CadPoint2d,
  p2: CadPoint2d,
  options?: CadCloudOptions
): CadPoint2d[] {
  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);

  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);

  // Determine arc radius based on box size (approx 10-30 units, or 10% of min dimension)
  const defaultRadius = Math.max(10, Math.min(width, height) * 0.15);
  const radius = options?.arcRadius ?? defaultRadius;
  const segmentsPerArc = options?.segmentsPerArc ?? 4;

  const corners: CadPoint2d[] = [
    { x: minX, y: maxY }, // Top-Left
    { x: maxX, y: maxY }, // Top-Right
    { x: maxX, y: minY }, // Bottom-Right
    { x: minX, y: minY }, // Bottom-Left
  ];

  const cloudPoints: CadPoint2d[] = [];

  for (let i = 0; i < 4; i++) {
    const startCorner = corners[i]!;
    const endCorner = corners[(i + 1) % 4]!;

    const dx = endCorner.x - startCorner.x;
    const dy = endCorner.y - startCorner.y;
    const edgeLength = Math.hypot(dx, dy);

    // Number of scallops along this edge
    const scallopCount = Math.max(1, Math.round(edgeLength / (radius * 1.8)));
    const scallopLength = edgeLength / scallopCount;

    const unitX = dx / edgeLength;
    const unitY = dy / edgeLength;

    // Normal vector pointing outwards (counter-clockwise perimeter -> right-hand normal is outward)
    const normalX = unitY;
    const normalY = -unitX;

    for (let s = 0; s < scallopCount; s++) {
      const sStart: CadPoint2d = {
        x: startCorner.x + unitX * (s * scallopLength),
        y: startCorner.y + unitY * (s * scallopLength),
      };
      const sEnd: CadPoint2d = {
        x: startCorner.x + unitX * ((s + 1) * scallopLength),
        y: startCorner.y + unitY * ((s + 1) * scallopLength),
      };

      // Arc bulge height
      const bulgeHeight = scallopLength * 0.35;

      for (let step = 0; step < segmentsPerArc; step++) {
        const t = step / segmentsPerArc;
        // Parabolic bulge
        const bulge = 4 * t * (1 - t) * bulgeHeight;
        const ptX = sStart.x + (sEnd.x - sStart.x) * t + normalX * bulge;
        const ptY = sStart.y + (sEnd.y - sStart.y) * t + normalY * bulge;
        cloudPoints.push({ x: ptX, y: ptY });
      }
    }
  }

  return cloudPoints;
}

/**
 * Returns an SVG path string 'M... Q... Z' for rendering the revision cloud in SVG
 */
export function generateRevisionCloudSvgPath(
  p1: CadPoint2d,
  p2: CadPoint2d,
  options?: CadCloudOptions
): string {
  const points = generateRevisionCloudPoints(p1, p2, options);
  if (points.length < 3) return "";

  let path = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i]!.x} ${points[i]!.y}`;
  }
  path += " Z";
  return path;
}