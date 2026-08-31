import type { CadPoint2d, CadReviewItem } from "./schema";

export interface CadHitTestOptions {
  tolerancePx?: number;
  projectWorldToScreen: (p: CadPoint2d) => { x: number; y: number } | null;
}

function distToSegment(
  p: { x: number; y: number },
  v: { x: number; y: number },
  w: { x: number; y: number }
): number {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

function isPointInRect(
  p: { x: number; y: number },
  r1: { x: number; y: number },
  r2: { x: number; y: number }
): boolean {
  const minX = Math.min(r1.x, r2.x);
  const maxX = Math.max(r1.x, r2.x);
  const minY = Math.min(r1.y, r2.y);
  const maxY = Math.max(r1.y, r2.y);
  return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
}

function hasVisibleFill(item: CadReviewItem): boolean {
  return Boolean(item.style.fillColor) && (item.style.fillOpacity ?? 0) > 0;
}

export function hitTestReviewItem(
  item: CadReviewItem,
  screenPoint: { x: number; y: number },
  options: CadHitTestOptions
): boolean {
  const tol = options.tolerancePx ?? 14;
  const project = options.projectWorldToScreen;

  switch (item.type) {
    case "comment_pin": {
      const sp = project(item.position);
      if (!sp) return false;
      return Math.hypot(screenPoint.x - sp.x, screenPoint.y - sp.y) <= (tol + 10);
    }

    case "distance": {
      const s1 = project(item.start);
      const s2 = project(item.end);
      if (!s1 || !s2) return false;
      return distToSegment(screenPoint, s1, s2) <= tol;
    }

    case "chain_distance": {
      const pts = item.points.map(project).filter((p): p is { x: number; y: number } => p !== null);
      if (pts.length < 2) return false;
      for (let i = 0; i < pts.length - 1; i++) {
        if (distToSegment(screenPoint, pts[i]!, pts[i + 1]!) <= tol) return true;
      }
      return false;
    }

    case "area": {
      const pts = item.points.map(project).filter((p): p is { x: number; y: number } => p !== null);
      if (pts.length < 3) return false;
      for (let i = 0; i < pts.length; i++) {
        const next = pts[(i + 1) % pts.length]!;
        if (distToSegment(screenPoint, pts[i]!, next) <= tol) return true;
      }
      return false;
    }

    case "shape": {
      const s1 = project(item.p1);
      const s2 = project(item.p2);
      if (!s1 || !s2) return false;

      if (item.shapeKind === "rect" || item.shapeKind === "cloud") {
        const corners = [
          { x: s1.x, y: s1.y },
          { x: s2.x, y: s1.y },
          { x: s2.x, y: s2.y },
          { x: s1.x, y: s2.y },
        ];
        for (let i = 0; i < 4; i++) {
          if (distToSegment(screenPoint, corners[i]!, corners[(i + 1) % 4]!) <= tol) {
            return true;
          }
        }
        return hasVisibleFill(item) && isPointInRect(screenPoint, s1, s2);
      }

      if (item.shapeKind === "circle") {
        const radius = Math.hypot(s2.x - s1.x, s2.y - s1.y);
        const dist = Math.hypot(screenPoint.x - s1.x, screenPoint.y - s1.y);
        if (Math.abs(dist - radius) <= tol) return true;
        return hasVisibleFill(item) && dist <= radius;
      }
      return false;
    }

    case "callout": {
      const sTip = project(item.tip);
      const sAnchor = project(item.anchor);
      if (!sTip || !sAnchor) return false;
      if (distToSegment(screenPoint, sTip, sAnchor) <= tol) return true;
      if (Math.hypot(screenPoint.x - sAnchor.x, screenPoint.y - sAnchor.y) <= tol + 15) return true;
      return false;
    }

    case "text": {
      const sp = project(item.position);
      if (!sp) return false;
      const textLen = Math.max(1, item.text.length);
      const approxWidth = textLen * 9;
      const approxHeight = 20;
      const box = {
        minX: sp.x - 4,
        maxX: sp.x + approxWidth + 4,
        minY: sp.y - approxHeight - 4,
        maxY: sp.y + 4,
      };
      return (
        screenPoint.x >= box.minX - tol &&
        screenPoint.x <= box.maxX + tol &&
        screenPoint.y >= box.minY - tol &&
        screenPoint.y <= box.maxY + tol
      );
    }

    case "stroke": {
      const pts = item.points.map(project).filter((p): p is { x: number; y: number } => p !== null);
      if (pts.length < 2) return false;
      for (let i = 0; i < pts.length - 1; i++) {
        if (distToSegment(screenPoint, pts[i]!, pts[i + 1]!) <= tol) return true;
      }
      return false;
    }

    default:
      return false;
  }
}

/**
 * Top-most hit testing (checks items in reverse order)
 */
export function findHitReviewItem(
  items: readonly CadReviewItem[],
  screenPoint: { x: number; y: number },
  options: CadHitTestOptions
): CadReviewItem | null {
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i]!;
    if (hitTestReviewItem(item, screenPoint, options)) {
      return item;
    }
  }
  return null;
}
