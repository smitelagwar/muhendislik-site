export type CadSnapMode = "endpoint" | "midpoint" | "intersection" | "center" | "nearest" | "perpendicular";

export function projectPerpendicularPoint(
  origin: CadSnapPoint,
  line: CadSnapLinePrimitive
): { point: CadSnapPoint; t: number } | null {
  const dx = line.b.x - line.a.x;
  const dy = line.b.y - line.a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq <= 1e-9) return null;
  const t = ((origin.x - line.a.x) * dx + (origin.y - line.a.y) * dy) / lenSq;
  return {
    point: {
      x: line.a.x + t * dx,
      y: line.a.y + t * dy,
    },
    t,
  };
}

export interface CadSnapPoint {
  x: number;
  y: number;
}

interface CadSnapPrimitiveBase {
  id: string;
  layer?: string;
}

export interface CadSnapLinePrimitive extends CadSnapPrimitiveBase {
  kind: "line";
  a: CadSnapPoint;
  b: CadSnapPoint;
}

export interface CadSnapCirclePrimitive extends CadSnapPrimitiveBase {
  kind: "circle";
  center: CadSnapPoint;
  radius: number;
}

export interface CadSnapArcPrimitive extends CadSnapPrimitiveBase {
  kind: "arc";
  center: CadSnapPoint;
  radius: number;
  startAngle: number;
  endAngle: number;
  clockwise?: boolean;
}

export type CadSnapPrimitive =
  | CadSnapLinePrimitive
  | CadSnapCirclePrimitive
  | CadSnapArcPrimitive;

export interface CadSnapCandidate {
  mode: CadSnapMode;
  point: CadSnapPoint;
  distancePx: number;
  primitiveIds: string[];
}

export interface CadSnapQuery {
  point: CadSnapPoint;
  tolerancePx: number;
  worldUnitsPerPixel: number;
  modes?: ReadonlySet<CadSnapMode>;
  origin?: CadSnapPoint | null;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const DEFAULT_MODES: ReadonlySet<CadSnapMode> = new Set([
  "endpoint",
  "midpoint",
  "intersection",
  "center",
  "nearest",
  "perpendicular",
]);

const MODE_PRIORITY: Record<CadSnapMode, number> = {
  endpoint: 0,
  intersection: 1,
  midpoint: 2,
  center: 3,
  perpendicular: 4,
  nearest: 5,
};

const TAU = Math.PI * 2;
const EPS = 1e-9;

function sq(value: number): number {
  return value * value;
}

function distance(a: CadSnapPoint, b: CadSnapPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalizeAngle(angle: number): number {
  const normalized = angle % TAU;
  return normalized < 0 ? normalized + TAU : normalized;
}

function angleOnArc(angle: number, arc: CadSnapArcPrimitive): boolean {
  const start = normalizeAngle(arc.startAngle);
  const end = normalizeAngle(arc.endAngle);
  const value = normalizeAngle(angle);
  if (arc.clockwise) {
    const span = normalizeAngle(start - end);
    const offset = normalizeAngle(start - value);
    return offset <= span + EPS;
  }
  const span = normalizeAngle(end - start);
  const offset = normalizeAngle(value - start);
  return offset <= span + EPS;
}

function pointOnArc(point: CadSnapPoint, arc: CadSnapArcPrimitive): boolean {
  return angleOnArc(Math.atan2(point.y - arc.center.y, point.x - arc.center.x), arc);
}

function pointAtAngle(center: CadSnapPoint, radius: number, angle: number): CadSnapPoint {
  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
}

function primitiveBounds(primitive: CadSnapPrimitive): Bounds {
  if (primitive.kind === "line") {
    return {
      minX: Math.min(primitive.a.x, primitive.b.x),
      minY: Math.min(primitive.a.y, primitive.b.y),
      maxX: Math.max(primitive.a.x, primitive.b.x),
      maxY: Math.max(primitive.a.y, primitive.b.y),
    };
  }
  return {
    minX: primitive.center.x - primitive.radius,
    minY: primitive.center.y - primitive.radius,
    maxX: primitive.center.x + primitive.radius,
    maxY: primitive.center.y + primitive.radius,
  };
}

function nearestOnLine(point: CadSnapPoint, line: CadSnapLinePrimitive): CadSnapPoint {
  const dx = line.b.x - line.a.x;
  const dy = line.b.y - line.a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq <= EPS) return { ...line.a };
  const t = Math.max(
    0,
    Math.min(1, ((point.x - line.a.x) * dx + (point.y - line.a.y) * dy) / lengthSq)
  );
  return { x: line.a.x + dx * t, y: line.a.y + dy * t };
}

function nearestOnCircle(
  point: CadSnapPoint,
  circle: CadSnapCirclePrimitive | CadSnapArcPrimitive
): CadSnapPoint {
  const dx = point.x - circle.center.x;
  const dy = point.y - circle.center.y;
  const len = Math.hypot(dx, dy);
  if (len <= EPS) return { x: circle.center.x + circle.radius, y: circle.center.y };
  return {
    x: circle.center.x + (dx / len) * circle.radius,
    y: circle.center.y + (dy / len) * circle.radius,
  };
}

function nearestOnArc(point: CadSnapPoint, arc: CadSnapArcPrimitive): CadSnapPoint {
  const radial = nearestOnCircle(point, arc);
  if (pointOnArc(radial, arc)) return radial;
  const start = pointAtAngle(arc.center, arc.radius, arc.startAngle);
  const end = pointAtAngle(arc.center, arc.radius, arc.endAngle);
  return distance(point, start) <= distance(point, end) ? start : end;
}

function lineLineIntersections(a: CadSnapLinePrimitive, b: CadSnapLinePrimitive): CadSnapPoint[] {
  const r = { x: a.b.x - a.a.x, y: a.b.y - a.a.y };
  const s = { x: b.b.x - b.a.x, y: b.b.y - b.a.y };
  const cross = r.x * s.y - r.y * s.x;
  if (Math.abs(cross) <= EPS) return [];
  const qp = { x: b.a.x - a.a.x, y: b.a.y - a.a.y };
  const t = (qp.x * s.y - qp.y * s.x) / cross;
  const u = (qp.x * r.y - qp.y * r.x) / cross;
  if (t < -EPS || t > 1 + EPS || u < -EPS || u > 1 + EPS) return [];
  return [{ x: a.a.x + t * r.x, y: a.a.y + t * r.y }];
}

function lineCircleIntersections(
  line: CadSnapLinePrimitive,
  circle: CadSnapCirclePrimitive | CadSnapArcPrimitive
): CadSnapPoint[] {
  const dx = line.b.x - line.a.x;
  const dy = line.b.y - line.a.y;
  const fx = line.a.x - circle.center.x;
  const fy = line.a.y - circle.center.y;
  const qa = dx * dx + dy * dy;
  if (qa <= EPS) return [];
  const qb = 2 * (fx * dx + fy * dy);
  const qc = fx * fx + fy * fy - circle.radius * circle.radius;
  const disc = qb * qb - 4 * qa * qc;
  if (disc < -EPS) return [];
  const root = Math.sqrt(Math.max(0, disc));
  const ts = root <= EPS ? [-qb / (2 * qa)] : [(-qb - root) / (2 * qa), (-qb + root) / (2 * qa)];
  return ts
    .filter((t) => t >= -EPS && t <= 1 + EPS)
    .map((t) => ({ x: line.a.x + dx * t, y: line.a.y + dy * t }))
    .filter((point) => circle.kind !== "arc" || pointOnArc(point, circle));
}

function circleCircleIntersections(
  a: CadSnapCirclePrimitive | CadSnapArcPrimitive,
  b: CadSnapCirclePrimitive | CadSnapArcPrimitive
): CadSnapPoint[] {
  const dx = b.center.x - a.center.x;
  const dy = b.center.y - a.center.y;
  const d = Math.hypot(dx, dy);
  if (d <= EPS || d > a.radius + b.radius + EPS || d < Math.abs(a.radius - b.radius) - EPS) {
    return [];
  }
  const along = (sq(a.radius) - sq(b.radius) + sq(d)) / (2 * d);
  const heightSq = sq(a.radius) - sq(along);
  if (heightSq < -EPS) return [];
  const height = Math.sqrt(Math.max(0, heightSq));
  const ux = dx / d;
  const uy = dy / d;
  const base = { x: a.center.x + ux * along, y: a.center.y + uy * along };
  const candidates = height <= EPS
    ? [base]
    : [
        { x: base.x - uy * height, y: base.y + ux * height },
        { x: base.x + uy * height, y: base.y - ux * height },
      ];
  return candidates.filter(
    (point) =>
      (a.kind !== "arc" || pointOnArc(point, a)) &&
      (b.kind !== "arc" || pointOnArc(point, b))
  );
}

function intersections(a: CadSnapPrimitive, b: CadSnapPrimitive): CadSnapPoint[] {
  if (a.kind === "line" && b.kind === "line") return lineLineIntersections(a, b);
  if (a.kind === "line" && b.kind !== "line") return lineCircleIntersections(a, b);
  if (a.kind !== "line" && b.kind === "line") return lineCircleIntersections(b, a);
  if (a.kind !== "line" && b.kind !== "line") return circleCircleIntersections(a, b);
  return [];
}

export class CadSnapEngine {
  private readonly primitives = new Map<string, CadSnapPrimitive>();
  private readonly cells = new Map<string, Set<string>>();

  constructor(private readonly cellSize = 256) {}

  clear(): void {
    this.primitives.clear();
    this.cells.clear();
  }

  rebuild(primitives: Iterable<CadSnapPrimitive>): void {
    this.clear();
    for (const primitive of primitives) this.add(primitive);
  }

  add(primitive: CadSnapPrimitive): void {
    if (!primitive.id || !Number.isFinite(this.cellSize) || this.cellSize <= 0) return;
    if (primitive.kind !== "line" && (!(primitive.radius > 0) || !Number.isFinite(primitive.radius))) {
      return;
    }
    this.primitives.set(primitive.id, primitive);
    const bounds = primitiveBounds(primitive);
    for (const key of this.keysForBounds(bounds)) {
      const ids = this.cells.get(key) ?? new Set<string>();
      ids.add(primitive.id);
      this.cells.set(key, ids);
    }
  }

  get size(): number {
    return this.primitives.size;
  }

  query(input: CadSnapQuery): CadSnapCandidate | null {
    if (!(input.tolerancePx > 0) || !(input.worldUnitsPerPixel > 0)) return null;
    const toleranceWorld = input.tolerancePx * input.worldUnitsPerPixel;
    const modes = input.modes ?? DEFAULT_MODES;
    const nearby = this.queryPrimitives({
      minX: input.point.x - toleranceWorld,
      minY: input.point.y - toleranceWorld,
      maxX: input.point.x + toleranceWorld,
      maxY: input.point.y + toleranceWorld,
    });
    const candidates: CadSnapCandidate[] = [];

    const push = (mode: CadSnapMode, point: CadSnapPoint, ids: string[]) => {
      if (!modes.has(mode)) return;
      const distanceWorld = distance(input.point, point);
      if (distanceWorld > toleranceWorld + EPS) return;
      candidates.push({
        mode,
        point,
        primitiveIds: ids,
        distancePx: distanceWorld / input.worldUnitsPerPixel,
      });
    };

    for (const primitive of nearby) {
      if (primitive.kind === "line") {
        push("endpoint", primitive.a, [primitive.id]);
        push("endpoint", primitive.b, [primitive.id]);
        push(
          "midpoint",
          { x: (primitive.a.x + primitive.b.x) / 2, y: (primitive.a.y + primitive.b.y) / 2 },
          [primitive.id]
        );
        push("nearest", nearestOnLine(input.point, primitive), [primitive.id]);
        if (input.origin && modes.has("perpendicular")) {
          const perp = projectPerpendicularPoint(input.origin, primitive);
          if (perp && perp.t >= -0.05 && perp.t <= 1.05) {
            push("perpendicular", perp.point, [primitive.id]);
          }
        }
      } else {
        push("center", primitive.center, [primitive.id]);
        if (primitive.kind === "arc") {
          const start = pointAtAngle(primitive.center, primitive.radius, primitive.startAngle);
          const end = pointAtAngle(primitive.center, primitive.radius, primitive.endAngle);
          push("endpoint", start, [primitive.id]);
          push("endpoint", end, [primitive.id]);
          const span = primitive.clockwise
            ? normalizeAngle(primitive.startAngle - primitive.endAngle)
            : normalizeAngle(primitive.endAngle - primitive.startAngle);
          const middleAngle = primitive.clockwise
            ? primitive.startAngle - span / 2
            : primitive.startAngle + span / 2;
          push("midpoint", pointAtAngle(primitive.center, primitive.radius, middleAngle), [primitive.id]);
          push("nearest", nearestOnArc(input.point, primitive), [primitive.id]);
        } else {
          push("nearest", nearestOnCircle(input.point, primitive), [primitive.id]);
        }
      }
    }

    if (modes.has("intersection")) {
      for (let i = 0; i < nearby.length; i++) {
        for (let j = i + 1; j < nearby.length; j++) {
          const a = nearby[i]!;
          const b = nearby[j]!;
          for (const point of intersections(a, b)) {
            push("intersection", point, [a.id, b.id]);
          }
        }
      }
    }

    candidates.sort(
      (a, b) =>
        MODE_PRIORITY[a.mode] - MODE_PRIORITY[b.mode] || a.distancePx - b.distancePx
    );
    return candidates[0] ?? null;
  }

  queryNearbyPrimitives(
    point: CadSnapPoint,
    worldRadius: number,
    limit = 64
  ): CadSnapPrimitive[] {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !(worldRadius > 0)) {
      return [];
    }
    const bounds: Bounds = {
      minX: point.x - worldRadius,
      minY: point.y - worldRadius,
      maxX: point.x + worldRadius,
      maxY: point.y + worldRadius,
    };
    const nearby = this.queryPrimitives(bounds);
    if (nearby.length <= limit) return nearby;

    return nearby
      .map((primitive) => {
        let distSq = Infinity;
        if (primitive.kind === "line") {
          const mx = (primitive.a.x + primitive.b.x) / 2;
          const my = (primitive.a.y + primitive.b.y) / 2;
          distSq = (mx - point.x) ** 2 + (my - point.y) ** 2;
        } else {
          distSq = (primitive.center.x - point.x) ** 2 + (primitive.center.y - point.y) ** 2;
        }
        return { primitive, distSq };
      })
      .sort((a, b) => a.distSq - b.distSq)
      .slice(0, limit)
      .map((item) => item.primitive);
  }

  private queryPrimitives(bounds: Bounds): CadSnapPrimitive[] {
    const ids = new Set<string>();
    for (const key of this.keysForBounds(bounds)) {
      for (const id of this.cells.get(key) ?? []) ids.add(id);
    }
    return [...ids].map((id) => this.primitives.get(id)).filter((value): value is CadSnapPrimitive => Boolean(value));
  }

  private *keysForBounds(bounds: Bounds): Iterable<string> {
    const minX = Math.floor(bounds.minX / this.cellSize);
    const minY = Math.floor(bounds.minY / this.cellSize);
    const maxX = Math.floor(bounds.maxX / this.cellSize);
    const maxY = Math.floor(bounds.maxY / this.cellSize);
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) yield `${x}:${y}`;
    }
  }
}
