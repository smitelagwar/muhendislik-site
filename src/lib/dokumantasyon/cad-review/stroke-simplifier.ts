import type { CadPoint2d } from "./schema";

/**
 * Calculates perpendicular distance from point p to line segment (v -> w).
 */
function getSqPerpendicularDistance(
  p: CadPoint2d,
  v: CadPoint2d,
  w: CadPoint2d
): number {
  let x = v.x;
  let y = v.y;
  let dx = w.x - x;
  let dy = w.y - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = w.x;
      y = w.y;
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p.x - x;
  dy = p.y - y;
  return dx * dx + dy * dy;
}

/**
 * Ramer-Douglas-Peucker (RDP) algorithm for polyline simplification.
 * @param points Array of 2D CAD points
 * @param epsilon Tolerance distance in CAD world units (e.g. 1.0 - 5.0)
 */
export function simplifyPointsRdp(
  points: readonly CadPoint2d[],
  epsilon = 2.0
): CadPoint2d[] {
  if (points.length <= 2) {
    return [...points];
  }

  const sqEpsilon = epsilon * epsilon;
  const len = points.length;
  const markers = new Uint8Array(len);
  markers[0] = 1;
  markers[len - 1] = 1;

  const stack: [number, number][] = [[0, len - 1]];

  while (stack.length > 0) {
    const [first, last] = stack.pop()!;
    let maxSqDist = 0;
    let index = 0;

    const pFirst = points[first]!;
    const pLast = points[last]!;

    for (let i = first + 1; i < last; i++) {
      const sqDist = getSqPerpendicularDistance(points[i]!, pFirst, pLast);
      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
    }

    if (maxSqDist > sqEpsilon) {
      markers[index] = 1;
      stack.push([first, index]);
      stack.push([index, last]);
    }
  }

  const result: CadPoint2d[] = [];
  for (let i = 0; i < len; i++) {
    if (markers[i]) {
      result.push({ x: points[i]!.x, y: points[i]!.y });
    }
  }

  return result;
}

/**
 * Filters out consecutive points that are closer than minDistance to reduce jitter.
 */
export function filterClosePoints(
  points: readonly CadPoint2d[],
  minDistance = 1.5
): CadPoint2d[] {
  if (points.length <= 1) return [...points];

  const sqMin = minDistance * minDistance;
  const filtered: CadPoint2d[] = [points[0]!];
  let last = points[0]!;

  for (let i = 1; i < points.length; i++) {
    const pt = points[i]!;
    const dx = pt.x - last.x;
    const dy = pt.y - last.y;
    if (dx * dx + dy * dy >= sqMin) {
      filtered.push(pt);
      last = pt;
    }
  }

  // Ensure last point is always preserved
  const finalPoint = points[points.length - 1]!;
  if (filtered[filtered.length - 1] !== finalPoint) {
    filtered.push(finalPoint);
  }

  return filtered;
}

/**
 * Converts a sequence of points to a smooth Quadratic Bezier SVG path (d attribute).
 */
export function pointsToSmoothSvgPath(points: readonly CadPoint2d[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y} L ${points[0]!.x} ${points[0]!.y}`;
  if (points.length === 2) {
    return `M ${points[0]!.x} ${points[0]!.y} L ${points[1]!.x} ${points[1]!.y}`;
  }

  let d = `M ${points[0]!.x} ${points[0]!.y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    d += ` Q ${p1.x} ${p1.y} ${midX} ${midY}`;
  }

  const last = points[points.length - 1]!;
  d += ` L ${last.x} ${last.y}`;
  return d;
}