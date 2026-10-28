import type { CadElement, CadModel, ColumnElement, Floor, Point } from "./model";

export type LineStyle = "solid" | "dashed" | "dashdot";
export type Appearance = { color?: string; lineStyle?: LineStyle; filled?: boolean; hatch?: boolean; group?: string; rebarMass?: number };
export type SnapSettings = { intersection: boolean; endpoint: boolean; midpoint: boolean; grid: boolean; tolerancePx: number; selectionPx: number; showNodes: boolean; nodeRadius: number };
export type CadLayer = { name: string; visible: boolean; locked: boolean; color?: string };
export type LayerState = { visible: boolean; locked: boolean };
export const DEFAULT_SNAP: SnapSettings = { intersection: true, endpoint: true, midpoint: true, grid: true, tolerancePx: 10, selectionPx: 8, showNodes: false, nodeRadius: 3 };
export const DEFAULT_LAYERS = ["Akslar", "Kolonlar", "Kirişler", "Perdeler", "Döşemeler"];

export function layerState(model: CadModel, layer: string, floorId: string): LayerState {
  const common = model.layers?.find(l => l.name === layer);
  const overrides = model.floors.find(f => f.id === floorId)?.layerStates;
  return overrides && Object.hasOwn(overrides, layer) ? overrides[layer] : { visible: common?.visible ?? true, locked: common?.locked ?? false };
}
export function setLayerState(model: CadModel, layer: string, state: LayerState, scope: "floor" | "all", floorId: string): CadModel {
  return { ...model, layers: [...(model.layers ?? DEFAULT_LAYERS.map(name => ({ name, visible: true, locked: false }))).filter(l => l.name !== layer), { ...model.layers?.find(l => l.name === layer), name: layer, ...(scope === "all" ? state : { visible: model.layers?.find(l => l.name === layer)?.visible ?? true, locked: model.layers?.find(l => l.name === layer)?.locked ?? false }) }],
    floors: model.floors.map(f => scope === "all" || f.id === floorId ? { ...f, layerStates: { ...f.layerStates, [layer]: state } } : {
      ...f, layerStates: { ...f.layerStates, [layer]: layerState(model, layer, f.id) },
    }) };
}
export function effectiveThickness(slab: { thickness: number; buildUp?: { name: string; thickness: number }[] }): number {
  return slab.buildUp?.length ? slab.buildUp.reduce((sum, layer) => sum + layer.thickness, 0) : slab.thickness;
}
export function columnOffsets(column: ColumnElement): Point {
  if (column.anchorMode === "center") return { x: 0, y: 0 };
  if (column.anchorMode === "edge") return { x: column.width / 2, y: 0 };
  if (column.anchorMode === "corner") return { x: column.width / 2, y: -column.depth / 2 };
  return { x: column.offsetX ?? 0, y: column.offsetY ?? 0 };
}
export function wallPath(wall: Pick<Extract<CadElement, { type: "wall" }>, "start" | "end" | "curveSagitta" | "curveSegments">): Point[] {
  const { start, end } = wall, sagitta = wall.curveSagitta ?? 0;
  const length = Math.hypot(end.x - start.x, end.y - start.y);
  if (Math.abs(sagitta) < 1e-9 || length < 1e-9) return [start, end];
  const nx = -(end.y - start.y) / length, ny = (end.x - start.x) / length;
  const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  const centerOffset = sagitta / 2 - length * length / (8 * sagitta);
  const center = { x: middle.x + nx * centerOffset, y: middle.y + ny * centerOffset };
  const radius = Math.hypot(length / 2, centerOffset), angle = Math.atan2(start.y - center.y, start.x - center.x);
  const sweep = -4 * Math.atan2(2 * sagitta, length);
  const segments = wall.curveSegments ?? 12;
  return Array.from({ length: segments + 1 }, (_, i) => {
    const a = angle + sweep * i / segments;
    return i === 0 ? start : i === segments ? end : { x: center.x + radius * Math.cos(a), y: center.y + radius * Math.sin(a) };
  });
}
export function addStorey(model: CadModel, floor: Floor, below: boolean): { model: CadModel; floor: Floor } {
  const next: Floor = { id: crypto.randomUUID(), name: below ? `Bodrum ${model.floors.filter(f => f.elevation < 0).length + 1}` : `${model.floors.length}. Kat`, height: floor.height,
    elevation: below ? Math.min(...model.floors.map(f => f.elevation)) - floor.height : Math.max(...model.floors.map(f => f.elevation + f.height)) };
  return { model: { ...model, floors: [...model.floors, next].sort((a, b) => a.elevation - b.elevation) }, floor: next };
}

/** Optional extension fields keep schema v1 files backwards compatible. */
export function readExtras(source: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  const fail = (key: string): never => { throw new Error(`${key}: geçersiz değer.`); };
  for (const key of ["offsetX", "offsetY", "leanX", "leanY", "curveSagitta", "slopeX", "slopeY", "hatchAngle", "finishLoad", "liveLoad", "extensionStart", "extensionEnd", "rebarMass", "endTopOffset"])
    if (source[key] !== undefined) { const v = source[key]; if (typeof v !== "number" || !Number.isFinite(v) || Math.abs(v) > 1e6) fail(key); output[key] = v; }
  for (const key of ["filled", "hatch", "minor", "drawInside", "drawOutside", "straighten", "referenceVisible", "mirrorX"])
    if (source[key] !== undefined) { if (typeof source[key] !== "boolean") fail(key); output[key] = source[key]; }
  for (const key of ["group", "suffix", "finishName"])
    if (source[key] !== undefined) { if (typeof source[key] !== "string" || source[key].length > 160) fail(key); output[key] = source[key]; }
  for (const key of ["color", "outsideColor"])
    if (source[key] !== undefined) { if (typeof source[key] !== "string" || !/^#[0-9a-f]{6}$/i.test(source[key])) fail(key); output[key] = source[key]; }
  const choices = { lineStyle: ["solid", "dashed", "dashdot"], outsideLineStyle: ["solid", "dashed", "dashdot"], section: ["rectangle", "circle", "polygon"], alignment: ["center", "left", "right"], anchorMode: ["defined", "center", "edge", "corner"] };
  for (const [key, values] of Object.entries(choices)) if (source[key] !== undefined) { if (!values.includes(source[key] as string)) fail(key); output[key] = source[key]; }
  for (const [key, min, max] of [["circleSegments", 8, 64], ["curveSegments", 2, 15]] as const)
    if (source[key] !== undefined) { const v = source[key]; if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max) fail(key); output[key] = v; }
  if (source.sectionPoints !== undefined) {
    if (!Array.isArray(source.sectionPoints) || source.sectionPoints.length < 3 || source.sectionPoints.length > 100) fail("Poligon kesit");
    output.sectionPoints = (source.sectionPoints as unknown[]).map(p => {
      if (!p || typeof p !== "object") fail("Kesit köşesi");
      const { x, y } = p as Point;
      if (![x, y].every(v => typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= 1e6)) fail("Kesit köşesi");
      return { x, y };
    });
  }
  if (source.buildUp !== undefined) {
    if (!Array.isArray(source.buildUp) || !source.buildUp.length || source.buildUp.length > 12) fail("Döşeme katmanları");
    output.buildUp = (source.buildUp as { name: string; thickness: number }[]).map(l => {
      if (!l || typeof l.name !== "string" || !l.name.trim() || l.name.length > 160 || typeof l.thickness !== "number" || !Number.isFinite(l.thickness) || l.thickness <= 0 || l.thickness > 100) fail("Döşeme katmanı");
      return { name: l.name, thickness: l.thickness };
    });
  }
  for (const key of ["finishLoad", "liveLoad", "rebarMass"]) if (typeof output[key] === "number" && (output[key] as number) < 0) fail(key);
  return output;
}

export function readLayerStates(value: unknown): Record<string, LayerState> | undefined {
  if (value === undefined) return;
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length > 100) throw new Error("Katman durumları geçersiz.");
  return Object.fromEntries(Object.entries(value).map(([name, v]) => {
    if (!name.trim() || name.length > 160 || !v || typeof v !== "object" || typeof v.visible !== "boolean" || typeof v.locked !== "boolean") throw new Error("Katman durumu geçersiz.");
    return [name, { visible: v.visible, locked: v.locked }];
  }));
}
export function readSnap(value: unknown): SnapSettings | undefined {
  if (value === undefined) return;
  if (!value || typeof value !== "object") throw new Error("Yakalama ayarları geçersiz.");
  const result = { ...DEFAULT_SNAP, ...value } as SnapSettings;
  for (const key of ["intersection", "endpoint", "midpoint", "grid", "showNodes"] as const) if (typeof result[key] !== "boolean") throw new Error("Yakalama seçeneği geçersiz.");
  for (const key of ["tolerancePx", "selectionPx", "nodeRadius"] as const) if (typeof result[key] !== "number" || !Number.isFinite(result[key]) || result[key] < 1 || result[key] > 50) throw new Error("Yakalama duyarlılığı 1–50 piksel olmalıdır.");
  return Object.fromEntries(Object.keys(DEFAULT_SNAP).map(key => [key, result[key as keyof SnapSettings]])) as SnapSettings;
}
