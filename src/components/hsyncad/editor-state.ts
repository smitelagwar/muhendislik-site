import type { CadElement, CadModel, Point } from "@/lib/hsyncad/model";
import { createEmptyModel } from "@/lib/hsyncad/model";

export type Tool = CadElement["type"] | "select" | "move" | "pan";
export const TYPE_NAMES: Record<CadElement["type"], string> = {
  axis: "Aks", column: "Kolon", beam: "Kiriş", wall: "Perde", slab: "Döşeme",
};
export const TYPE_COLORS: Record<CadElement["type"], string> = {
  axis: "#8496ab", column: "#d99a31", beam: "#4e94e8", wall: "#25aa97", slab: "#9d80dd",
};
export const LAYERS = ["Akslar", "Kolonlar", "Kirişler", "Perdeler", "Döşemeler"];
export const TYPE_LAYERS: Record<CadElement["type"], string> = {
  axis: LAYERS[0], column: LAYERS[1], beam: LAYERS[2], wall: LAYERS[3], slab: LAYERS[4],
};
export type History = { present: CadModel; past: CadModel[]; future: CadModel[] };
export type HistoryAction = { type: "commit"; model: CadModel } | { type: "restore"; model: CadModel } | { type: "undo" | "redo" };
export const initialHistory = (): History => ({ present: createEmptyModel(), past: [], future: [] });
export function historyReducer(state: History, action: HistoryAction): History {
  if (action.type === "commit") return { present: action.model, past: [...state.past.slice(-79), state.present], future: [] };
  if (action.type === "restore") return { present: action.model, past: [], future: [] };
  if (action.type === "undo" && state.past.length) return {
    present: state.past[state.past.length - 1], past: state.past.slice(0, -1), future: [state.present, ...state.future],
  };
  if (action.type === "redo" && state.future.length) return {
    present: state.future[0], past: [...state.past, state.present], future: state.future.slice(1),
  };
  return state;
}
export function roundPoint(p: Point): Point { return { x: +p.x.toFixed(6), y: +p.y.toFixed(6) }; }
export function distance(a: Point, b: Point) { return Math.hypot(a.x - b.x, a.y - b.y); }
export function segmentDistance(p: Point, a: Point, b: Point) {
  const length2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (!length2) return distance(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / length2));
  return distance(p, { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
}
export function insidePolygon(p: Point, points: Point[]) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i], b = points[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
