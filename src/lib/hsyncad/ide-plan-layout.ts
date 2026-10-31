import type { IdeElement, IdePoint } from "./ide-import";

export type PlanCamera = { x: number; y: number; scale: number };
export const planPoints = (element: IdeElement): IdePoint[] => element.planPaths?.length ? element.planPaths.flat() : element.footprint?.length ? element.footprint : element.points;

export function planBounds(points: IdePoint[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); }
  return { minX, minY, maxX, maxY };
}

/** Source endpoints are also the only label anchors. An axis never gets a label at its centre. */
export function axisEndLabels(element: IdeElement): IdePoint[] {
  if (element.type !== "axis" || element.points.length < 2) return [];
  return [element.points[0], element.points.at(-1)!];
}

export function fitPlanView(elements: IdeElement[], width: number, height: number): PlanCamera | undefined {
  const { minX, minY, maxX, maxY } = planBounds(elements.flatMap(planPoints));
  if (!Number.isFinite(minX) || width <= 1 || height <= 1) return;
  const padding = Math.min(38, Math.max(18, Math.min(width, height) * .055));
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2, scale: Math.max(.05, Math.min((width - padding * 2) / Math.max(.1, maxX - minX), (height - padding * 2) / Math.max(.1, maxY - minY))) };
}

/** Text is a drawing size in metres, not an invariant 10px UI overlay. */
export const planFontPixels = (scale: number, height = .16) => Math.max(0, scale * height);

export function planGridStep(scale: number) {
  const raw = 90 / Math.max(.05, scale), decade = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map(value => value * decade).reduce((best, value) => Math.abs(Math.log(value / raw)) < Math.abs(Math.log(best / raw)) ? value : best);
}

export function memberLabel(element: IdeElement) {
  const footprint = element.footprint;
  let a: IdePoint | undefined, b: IdePoint | undefined;
  if (footprint?.length === 4 && element.points.length === 2) {
    a = { x: (footprint[0].x + footprint[3].x) / 2, y: (footprint[0].y + footprint[3].y) / 2 };
    b = { x: (footprint[1].x + footprint[2].x) / 2, y: (footprint[1].y + footprint[2].y) / 2 };
  } else if (footprint?.length) {
    let longest = 0;
    for (let i = 0; i < footprint.length; i++) {
      const from = footprint[i], to = footprint[(i + 1) % footprint.length], length = Math.hypot(to.x - from.x, to.y - from.y);
      if (length > longest) { longest = length; a = from; b = to; }
    }
  } else [a, b] = element.points;
  if (!a || !b) return;
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (length < 1e-8) return;
  let angle = Math.atan2(-(b.y - a.y), b.x - a.x);
  if (angle >= Math.PI / 2 - 1e-9) { angle -= Math.PI; [a, b] = [b, a]; }
  if (angle < -Math.PI / 2) { angle += Math.PI; [a, b] = [b, a]; }
  // Joined native members have a clear footprint shorter than their gross
  // section label. Never replace the stored label with a bounding-box length.
  const section = element.type === "wall" ? element.planAnnotation?.section : element.planAnnotation?.section ?? element.sectionLabel;
  const inset = Math.min(.12, length * .08);
  return { anchor: { x: a.x + (b.x - a.x) / length * inset, y: a.y + (b.y - a.y) / length * inset }, angle, length, text: `${element.name}${section ? `  ${section}` : ""}` };
}

function insideRing(point: IdePoint, ring: IdePoint[]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
export function insidePlanArea(point: IdePoint, ring: IdePoint[], holes: IdePoint[][] = []) {
  return insideRing(point, ring) && !holes.some(hole => insideRing(point, hole));
}

function segmentDistance(point: IdePoint, a: IdePoint, b: IdePoint) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(point.x - a.x - dx * t, point.y - a.y - dy * t);
}

/** Filled members win over the slab below; voids never select their parent slab. */
export function hitPlanElement(elements: IdeElement[], point: IdePoint, tolerance: number): IdeElement | undefined {
  let best: { element: IdeElement; priority: number; distance: number } | undefined;
  for (const element of elements) {
    const ring = element.footprint ?? element.points, area = !element.planPaths?.length && ring.length > 2;
    const member = ["wall", "beam", "column", "band"].includes(element.type);
    const interior = area && insidePlanArea(point, ring, element.holes);
    let distance = Infinity;
    const paths = element.planPaths?.length ? element.planPaths : [ring, ...(element.holes ?? [])];
    for (const path of paths) for (let i = 0; i < path.length - (path.length === 2 || element.planPaths?.length ? 1 : 0); i++) distance = Math.min(distance, segmentDistance(point, path[i], path[(i + 1) % path.length]));
    if (element.type === "axis") {
      const endpoint = axisEndLabels(element).some(p => Math.hypot(point.x - p.x, point.y - p.y) <= Math.max(tolerance, .2));
      if (!endpoint && distance > Math.min(tolerance, .08)) continue;
    } else if (!interior && distance > tolerance) continue;
    const priority = member ? 0 : element.type === "stair" ? 1 : element.type === "axis" || element.type === "section" ? 2 : element.type === "slab" ? 3 : 4;
    if (interior) distance = 0;
    if (!best || priority < best.priority || priority === best.priority && distance < best.distance) best = { element, priority, distance };
  }
  return best?.element;
}

/** A rectangular annotation must stay in the filled area, including concave slabs and openings. */
export function slabLabelAnchor(element: IdeElement, boxWidth = 1.7, boxHeight = .5): IdePoint | undefined {
  const ring = element.footprint ?? element.points, holes = element.holes ?? [];
  if (ring.length < 3) return;
  const { minX, minY, maxX, maxY } = planBounds(ring);
  const margin = .16, scanStep = Math.max(.12, (maxY - minY) / 80);
  for (let y = maxY - margin; y > minY + boxHeight; y -= scanStep) {
    const intersections: number[] = [];
    for (const polygon of [ring, ...holes]) for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i], b = polygon[j];
      if ((a.y > y - boxHeight / 2) !== (b.y > y - boxHeight / 2)) intersections.push(a.x + (y - boxHeight / 2 - a.y) * (b.x - a.x) / (b.y - a.y));
    }
    intersections.sort((a, b) => a - b);
    for (let i = 0; i + 1 < intersections.length; i += 2) {
      const x = Math.max(minX + margin, intersections[i] + margin);
      if (x + boxWidth > Math.min(maxX - margin, intersections[i + 1] - margin)) continue;
      const probes = [{ x, y }, { x: x + boxWidth, y }, { x, y: y - boxHeight }, { x: x + boxWidth, y: y - boxHeight }, { x: x + boxWidth / 2, y: y - boxHeight / 2 }];
      const cutsRectangle = (a: IdePoint, b: IdePoint) => {
        // Liang–Barsky clip: a source boundary entering the annotation's open
        // rectangle means corners alone would have missed a narrow notch/hole.
        const dx = b.x - a.x, dy = b.y - a.y, inset = 1e-8;
        let low = 0, high = 1;
        for (const [p, q] of [[-dx, a.x - x - inset], [dx, x + boxWidth - a.x - inset], [-dy, a.y - (y - boxHeight) - inset], [dy, y - a.y - inset]]) {
          if (Math.abs(p) < 1e-12) { if (q < 0) return false; continue; }
          const t = q / p;
          if (p < 0) low = Math.max(low, t); else high = Math.min(high, t);
          if (low > high) return false;
        }
        return true;
      };
      const boundaryCrosses = [ring, ...holes].some(polygon => polygon.some((p, i) => cutsRectangle(p, polygon[(i + 1) % polygon.length])));
      if (probes.every(p => insidePlanArea(p, ring, holes)) && !boundaryCrosses) return { x, y };
    }
  }
  return;
}
