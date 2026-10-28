import type { AxisElement, CadModel, Point } from "./model";
import { nextAxisName, type AxisDrawingOptions } from "./axes";
import { elementFootprint } from "./geometry";

export function constrainPoint(anchor: Point, target: Point, length: number | null, angle: number | null, fallbackAngle = 0): Point {
  const distance = Math.hypot(target.x - anchor.x, target.y - anchor.y);
  const direction = (angle ?? (distance > 1e-8 ? Math.atan2(target.y - anchor.y, target.x - anchor.x) * 180 / Math.PI : fallbackAngle)) * Math.PI / 180;
  const size = length ?? distance;
  return { x: +(anchor.x + size * Math.cos(direction)).toFixed(6), y: +(anchor.y + size * Math.sin(direction)).toFixed(6) };
}
export function axisGuide(model: CadModel, floorId: string, options: AxisDrawingOptions, point: Point, anchor?: Point): AxisElement | undefined {
  if (options.direction === "free" && !anchor) return;
  const points = model.elements.filter(e => e.floorId === floorId).flatMap(elementFootprint);
  const bounds = (key: keyof Point): [number, number] => {
    if (!points.length) return [point[key] - 5, point[key] + 5];
    const values = [...points.map(p => p[key]), point[key]], min = Math.min(...values), max = Math.max(...values);
    return max - min < 1 ? [min - 5, max + 5] : [min, max];
  };
  const xs = bounds("x"), ys = bounds("y");
  const start = options.direction === "horizontal" ? { x: xs[0], y: point.y } : options.direction === "vertical" ? { x: point.x, y: ys[0] } : anchor!;
  const end = options.direction === "horizontal" ? { x: xs[1], y: point.y } : options.direction === "vertical" ? { x: point.x, y: ys[1] } : point;
  return { ...options, type: "axis", id: "__draft__", name: options.name.trim() || nextAxisName(model.elements, options.direction, floorId), floorId, materialId: model.materials[0].id, layer: "Akslar", start, end, orientation: options.direction };
}
