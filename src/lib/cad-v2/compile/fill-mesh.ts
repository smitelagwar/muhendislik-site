import type { CadPoint2D } from "../canonical/types";

function signedArea(polygon: readonly CadPoint2D[]): number {
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const current = polygon[i]!;
    const next = polygon[(i + 1) % polygon.length]!;
    area += current[0] * next[1] - next[0] * current[1];
  }
  return area / 2;
}

export function isConvexClipPolygon(polygon: readonly CadPoint2D[]): boolean {
  if (polygon.length < 3 || !polygon.flat().every(Number.isFinite)) return false;
  let direction = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]!;
    const b = polygon[(i + 1) % polygon.length]!;
    const c = polygon[(i + 2) % polygon.length]!;
    const cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(cross) <= 1e-12) continue;
    const current = Math.sign(cross);
    if (direction !== 0 && direction !== current) return false;
    direction = current;
  }
  return direction !== 0 && Math.abs(signedArea(polygon)) > 1e-12;
}

/** Returns null for unsupported clips, an empty array for a fully clipped mesh. */
export function clipTriangleMeshToConvexPolygon(
  vertices: Float64Array,
  polygon: readonly CadPoint2D[],
): Float64Array | null {
  if (!isConvexClipPolygon(polygon) || vertices.length % 6 !== 0) return null;
  const orientation = Math.sign(signedArea(polygon));
  const output: number[] = [];
  const inside = (point: CadPoint2D, a: CadPoint2D, b: CadPoint2D) => {
    const edgeX = b[0] - a[0];
    const edgeY = b[1] - a[1];
    const cross = edgeX * (point[1] - a[1]) - edgeY * (point[0] - a[0]);
    return orientation * cross >= -1e-10 * Math.max(1, Math.hypot(edgeX, edgeY));
  };
  const intersection = (start: CadPoint2D, end: CadPoint2D, a: CadPoint2D, b: CadPoint2D): CadPoint2D => {
    const edgeX = b[0] - a[0];
    const edgeY = b[1] - a[1];
    const startDistance = edgeX * (start[1] - a[1]) - edgeY * (start[0] - a[0]);
    const endDistance = edgeX * (end[1] - a[1]) - edgeY * (end[0] - a[0]);
    const denominator = startDistance - endDistance;
    const t = Math.abs(denominator) > 1e-20 ? startDistance / denominator : 0;
    return [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t];
  };

  for (let offset = 0; offset < vertices.length; offset += 6) {
    let subject: CadPoint2D[] = [
      [vertices[offset]!, vertices[offset + 1]!],
      [vertices[offset + 2]!, vertices[offset + 3]!],
      [vertices[offset + 4]!, vertices[offset + 5]!],
    ];
    for (let edge = 0; edge < polygon.length && subject.length > 0; edge++) {
      const clipStart = polygon[edge]!;
      const clipEnd = polygon[(edge + 1) % polygon.length]!;
      const input = subject;
      subject = [];
      let previous = input[input.length - 1]!;
      let previousInside = inside(previous, clipStart, clipEnd);
      for (const current of input) {
        const currentInside = inside(current, clipStart, clipEnd);
        if (currentInside !== previousInside) subject.push(intersection(previous, current, clipStart, clipEnd));
        if (currentInside) subject.push(current);
        previous = current;
        previousInside = currentInside;
      }
    }
    for (let index = 1; index + 1 < subject.length; index++) {
      const a = subject[0]!;
      const b = subject[index]!;
      const c = subject[index + 1]!;
      const area2 = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
      if (area2 <= 1e-18) continue;
      output.push(a[0], a[1], b[0], b[1], c[0], c[1]);
    }
  }
  return new Float64Array(output);
}
