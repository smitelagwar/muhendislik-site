import { distance, elementFootprint, elementVerticalRange, isSimplePolygon, lineIntersection, polygonArea } from "./geometry";
import { readExtras, readLayerStates, readSnap, type Appearance, type CadLayer, type LayerState, type SnapSettings, type LineStyle } from "./definitions";
import { validateDrafting, type DraftingData } from "./drafting";
import { validateLinkedSlabRegions } from "./regions";

/** SI model: coordinates, elevations and dimensions are always metres. */
export type Point = { x: number; y: number };
export type Floor = { id: string; name: string; elevation: number; height: number; architecturalOffset?: number; layerStates?: Record<string, LayerState> };
export type Material = { id: string; name: string };
export type ElementType = "axis" | "column" | "beam" | "wall" | "slab" | "slabEdge";
export type PointBinding = { kind: "column"; id: string } | { kind: "axes"; ids: [string, string] } | { kind: "member"; id: string; t: number };
export type ElementConnections = { position?: PointBinding; start?: PointBinding; end?: PointBinding };
type ElementBase = Appearance & { id: string; name: string; floorId: string; materialId: string; layer: string; connections?: ElementConnections };
export type AxisElement = ElementBase & { type: "axis"; start: Point; end: Point; orientation?: "horizontal" | "vertical" | "free"; labelSide?: "both" | "start" | "end" | "none"; extension?: number; suffix?: string; minor?: boolean; extensionStart?: number; extensionEnd?: number; drawInside?: boolean; drawOutside?: boolean; outsideColor?: string; outsideLineStyle?: LineStyle; straighten?: boolean };
type VerticalOffsets = { baseOffset?: number; topOffset?: number; heightMode?: "story" | "fixed" };
export type ColumnElement = ElementBase & VerticalOffsets & { type: "column"; position: Point; width: number; depth: number; height: number; rotation?: number; section?: "rectangle" | "circle" | "polygon"; sectionPoints?: Point[]; circleSegments?: number; offsetX?: number; offsetY?: number; leanX?: number; leanY?: number; anchorMode?: "defined" | "center" | "edge" | "corner"; mirrorX?: boolean };
export type BeamElement = ElementBase & { type: "beam"; start: Point; end: Point; width: number; height: number; topOffset?: number; endTopOffset?: number; alignment?: "center" | "left" | "right"; offset?: number; curveSagitta?: number; curveSegments?: number };
export type WallElement = ElementBase & VerticalOffsets & { type: "wall"; start: Point; end: Point; thickness: number; height: number; alignment?: "center" | "left" | "right"; offset?: number; curveSagitta?: number; curveSegments?: number };
export type SlabElement = ElementBase & { type: "slab"; points: Point[]; thickness: number; topOffset?: number; slopeX?: number; slopeY?: number; hatchAngle?: number; referenceVisible?: boolean; buildUp?: { name: string; thickness: number }[]; finishName?: string; finishLoad?: number; liveLoad?: number; boundary?: { elementIds: string[] }; labelPosition?: Point };
export type SlabEdgeElement = ElementBase & { type: "slabEdge"; start: Point; end: Point; topOffset?: number; endTopOffset?: number };
export type CadElement = AxisElement | ColumnElement | BeamElement | WallElement | SlabElement | SlabEdgeElement;
export type SolidElement = ColumnElement | BeamElement | WallElement | SlabElement;
export function isSolidElement(e: CadElement): e is SolidElement { return e.type !== "axis" && e.type !== "slabEdge"; }
export type CadModel = { schemaVersion: 1; name: string; floors: Floor[]; materials: Material[]; elements: CadElement[]; layers?: CadLayer[]; snap?: SnapSettings; toolDefaults?: Partial<Record<SolidElement["type"], SolidElement>>; drafting?: DraftingData };

export function createEmptyModel(): CadModel {
  return {
    schemaVersion: 1,
    name: "Yeni yapı modeli",
    floors: [{ id: "floor-0", name: "Zemin kat", elevation: 0, height: 3 }],
    materials: [{ id: "concrete", name: "Beton" }],
    elements: [],
  };
}

/** Four corner columns, four perimeter beams, one 4 m wall and a 4×4 m slab. */
export function createDemoModel(): CadModel {
  const model = createEmptyModel();
  model.name = "4 × 4 m örnek yapı";
  const common = { floorId: "floor-0", materialId: "concrete" };
  const corners: Point[] = [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }];
  const axes: AxisElement[] = [
    { ...common, id: "axis-A", name: "A", type: "axis", layer: "Akslar", start: { x: -1, y: 0 }, end: { x: 5, y: 0 } },
    { ...common, id: "axis-B", name: "B", type: "axis", layer: "Akslar", start: { x: -1, y: 4 }, end: { x: 5, y: 4 } },
    { ...common, id: "axis-1", name: "1", type: "axis", layer: "Akslar", start: { x: 0, y: -1 }, end: { x: 0, y: 5 } },
    { ...common, id: "axis-2", name: "2", type: "axis", layer: "Akslar", start: { x: 4, y: -1 }, end: { x: 4, y: 5 } },
  ];
  const columns: ColumnElement[] = corners.map((position, i) => ({ ...common, id: `column-${i}`, name: `S${i + 1}`, type: "column", layer: "Kolonlar", position: { ...position }, width: 0.4, depth: 0.4, height: 3 }));
  const beams: BeamElement[] = corners.map((start, i) => ({ ...common, id: `beam-${i}`, name: `K${i + 1}`, type: "beam", layer: "Kirişler", start: { ...start }, end: { ...corners[(i + 1) % 4] }, width: 0.25, height: 0.5 }));
  model.elements = [...axes, ...columns, ...beams,
    { ...common, id: "wall-0", name: "P1", type: "wall", layer: "Perdeler", start: { x: 0, y: 2 }, end: { x: 4, y: 2 }, thickness: 0.2, height: 3 },
    { ...common, id: "slab-0", name: "D1", type: "slab", layer: "Döşemeler", points: corners.map(p => ({ ...p })), thickness: 0.15 },
  ];
  return model;
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label}: nesne bekleniyor.`);
  return value as Record<string, unknown>;
}
function text(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim() || value.length > 160) throw new Error(`${label}: 1–160 karakterlik metin girin.`);
  return value;
}
function number(value: unknown, label: string, positive = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > 1_000_000 || (positive && value <= 0)) throw new Error(`${label}: ${positive ? "pozitif " : ""}sonlu sayı girin (en çok 1.000.000 m).`);
  return value;
}
function point(value: unknown, label: string): Point {
  const p = record(value, label);
  return { x: number(p.x, `${label} X`), y: number(p.y, `${label} Y`) };
}
function list(value: unknown, label: string, limit: number): unknown[] {
  if (!Array.isArray(value) || value.length > limit) throw new Error(`${label}: en fazla ${limit} kayıt içeren dizi bekleniyor.`);
  return value;
}
function uniqueIds(values: { id: string }[], label: string) {
  if (new Set(values.map(v => v.id)).size !== values.length) throw new Error(`${label}: yinelenen kimlik var.`);
}

function optionalNumber<K extends string>(source: Record<string, unknown>, key: K, label: string): Partial<Record<K, number>> {
  return source[key] === undefined ? {} : { [key]: number(source[key], label) } as Record<K, number>;
}
function optionalChoice<K extends string, V extends string>(source: Record<string, unknown>, key: K, choices: readonly V[], label: string): Partial<Record<K, V>> {
  if (source[key] === undefined) return {};
  if (typeof source[key] !== "string" || !choices.includes(source[key] as V)) throw new Error(`${label}: geçersiz seçenek.`);
  return { [key]: source[key] } as Record<K, V>;
}
function verticalOffsets(source: Record<string, unknown>): VerticalOffsets {
  return { ...optionalNumber(source, "baseOffset", "Alt kot farkı"), ...optionalNumber(source, "topOffset", "Üst kot farkı"), ...optionalChoice(source, "heightMode", ["story", "fixed"] as const, "Yükseklik yöntemi") };
}

/** Reconstruct a complete validated model before replacing application state. */
export function validateModel(value: unknown): CadModel {
  const source = record(value, "Model");
  if (source.schemaVersion !== 1) throw new Error("Desteklenmeyen model sürümü; schemaVersion 1 bekleniyor.");
  const floors = list(source.floors, "Katlar", 100).map((v): Floor => {
    const f = record(v, "Kat");
    return { id: text(f.id, "Kat kimliği"), name: text(f.name, "Kat adı"), elevation: number(f.elevation, "Kat kotu"), height: number(f.height, "Kat yüksekliği", true), ...optionalNumber(f, "architecturalOffset", "Mimari kot farkı"), ...(f.layerStates === undefined ? {} : { layerStates: readLayerStates(f.layerStates) }) };
  });
  const materials = list(source.materials, "Malzemeler", 100).map((v): Material => {
    const m = record(v, "Malzeme");
    return { id: text(m.id, "Malzeme kimliği"), name: text(m.name, "Malzeme adı") };
  });
  if (!floors.length || !materials.length) throw new Error("En az bir kat ve bir malzeme gereklidir.");
  uniqueIds(floors, "Katlar"); uniqueIds(materials, "Malzemeler");
  const floorIds = new Set(floors.map(f => f.id));
  const materialIds = new Set(materials.map(m => m.id));
  const elements = list(source.elements, "Elemanlar", 1000).map((v): CadElement => {
    const e = record(v, "Eleman");
    const base: ElementBase = { id: text(e.id, "Eleman kimliği"), name: text(e.name, "Eleman adı"), floorId: text(e.floorId, "Eleman katı"), materialId: text(e.materialId, "Eleman malzemesi"), layer: text(e.layer, "Katman"), ...readExtras(e) };
    if (!floorIds.has(base.floorId) || !materialIds.has(base.materialId)) throw new Error(`${base.name}: kat veya malzeme bulunamadı.`);
    if (e.type === "column") return { ...base, type: "column", position: point(e.position, "Konum"), width: number(e.width, "Kolon b", true), depth: number(e.depth, "Kolon h", true), height: number(e.height, "Kolon yüksekliği", true), ...verticalOffsets(e), ...optionalNumber(e, "rotation", "Kolon açısı") };
    if (e.type === "slab") {
      const points = list(e.points, "Döşeme köşeleri", 200).map(v => point(v, "Köşe"));
      if (!isSimplePolygon(points) || polygonArea(points) < 1e-8) throw new Error(`${base.name}: döşeme en az üç köşeli, alanı pozitif ve kendisiyle kesişmeyen kapalı alan olmalıdır.`);
      let boundary: SlabElement["boundary"];
      if (e.boundary !== undefined) { const b = record(e.boundary, "Döşeme sınırı"); boundary = { elementIds: list(b.elementIds, "Döşeme sınır elemanları", 1000).map(id => text(id, "Sınır elemanı")) }; if (!boundary.elementIds.length) throw new Error("Döşeme sınırı boş olamaz."); }
      return { ...base, type: "slab", points, thickness: number(e.thickness, "Döşeme kalınlığı", true), ...optionalNumber(e, "topOffset", "Döşeme kot farkı"), ...(boundary ? { boundary } : {}), ...(e.labelPosition === undefined ? {} : { labelPosition: point(e.labelPosition, "Döşeme yazısı") }) };
    }
    if (e.type === "axis" || e.type === "beam" || e.type === "wall" || e.type === "slabEdge") {
      const start = point(e.start, "Başlangıç"), end = point(e.end, "Bitiş");
      if (Math.hypot(end.x - start.x, end.y - start.y) < 1e-6) throw new Error(`${base.name}: başlangıç ve bitiş farklı olmalıdır.`);
      if (e.type === "slabEdge") return { ...base, type: "slabEdge", start, end, ...optionalNumber(e, "topOffset", "Kenar kot farkı"), ...optionalNumber(e, "endTopOffset", "Kenar bitiş kot farkı") };
      if (e.type === "axis") {
        const extras = { ...optionalChoice(e, "orientation", ["horizontal", "vertical", "free"] as const, "Aks yönü"), ...optionalChoice(e, "labelSide", ["both", "start", "end", "none"] as const, "Aks etiket tarafı"), ...optionalNumber(e, "extension", "Aks uzantısı") };
        if (extras.extension !== undefined && extras.extension < 0) throw new Error("Aks uzantısı negatif olamaz.");
        if (Math.hypot(end.x - start.x, end.y - start.y) + Number(e.extensionStart ?? extras.extension ?? 0) + Number(e.extensionEnd ?? extras.extension ?? 0) < 1e-6) throw new Error("Aks delta değerleri görünür aks uzunluğunu sıfırlıyor.");
        if (extras.orientation === "horizontal" && Math.abs(end.y - start.y) > 1e-8) throw new Error("Yatay aksın uç Y koordinatları eşit olmalıdır.");
        if (extras.orientation === "vertical" && Math.abs(end.x - start.x) > 1e-8) throw new Error("Düşey aksın uç X koordinatları eşit olmalıdır.");
        return { ...base, type: "axis", start, end, ...extras };
      }
      if (e.type === "beam") return { ...base, type: "beam", start, end, width: number(e.width, "Kiriş b", true), height: number(e.height, "Kiriş h", true), ...optionalNumber(e, "topOffset", "Kiriş kot farkı"), ...optionalNumber(e, "offset", "Kiriş yanal ofseti"), ...optionalChoice(e, "alignment", ["center", "left", "right"] as const, "Kiriş hizası") };
      return { ...base, type: "wall", start, end, thickness: number(e.thickness, "Perde kalınlığı", true), height: number(e.height, "Perde yüksekliği", true), ...verticalOffsets(e), ...optionalNumber(e, "offset", "Perde kaçıklığı") };
    }
    throw new Error(`${base.name}: bilinmeyen eleman tipi.`);
  });
  uniqueIds(elements, "Elemanlar");
  for (const element of elements) {
    if (!isSolidElement(element)) continue;
    if (element.type === "column" && element.section === "polygon" && (!element.sectionPoints || !isSimplePolygon(element.sectionPoints))) throw new Error(`${element.name}: geçerli kapalı poligon kesit girin.`);
    if (!isSimplePolygon(elementFootprint(element))) throw new Error(`${element.name}: kesit sınırı kesişiyor veya geçersiz.`);
    if (element.type === "slab" && (Math.abs(element.slopeX ?? 0) > 100 || Math.abs(element.slopeY ?? 0) > 100)) throw new Error("Döşeme eğimi her yönde en çok %100 olabilir.");
    const floor = floors.find(f => f.id === element.floorId)!;
    const [bottom, top] = elementVerticalRange(element, floor);
    if (!Number.isFinite(bottom) || !Number.isFinite(top) || top - bottom < 1e-6) throw new Error(`${element.name}: üst kot alt kottan en az 0,000001 m büyük olmalıdır.`);
  }
  const byId = new Map(elements.map(e => [e.id, e]));
  for (let i = 0; i < elements.length; i++) {
    const raw = record((source.elements as unknown[])[i], "Eleman"), element = elements[i];
    if (raw.connections !== undefined) {
      const values = record(raw.connections, "Eleman bağlantıları"), connections: ElementConnections = {};
      for (const key of ["position", "start", "end"] as const) if (values[key] !== undefined) {
        if (!(key in element)) throw new Error(`${element.name}: bağlantı noktası türle uyumsuz.`);
        const v = record(values[key], "Nokta bağlantısı");
        if (v.kind === "column") {
          const id = text(v.id, "Bağlı kolon"), parent = byId.get(id);
          if (element.type === "column" || parent?.type !== "column" || parent.floorId !== element.floorId) throw new Error("Kolon bağlantısı geçersiz.");
          connections[key] = { kind: "column", id };
        } else if (v.kind === "member") {
          const id = text(v.id, "Bağlı kiriş/perde"), parent = byId.get(id), t = number(v.t, "Bağlantı oranı");
          if ((parent?.type !== "beam" && parent?.type !== "wall") || parent.id === element.id || parent.floorId !== element.floorId || Math.abs(parent.curveSagitta ?? 0) > 1e-9 || t < 0 || t > 1) throw new Error("Eleman üzeri bağlantı geçersiz.");
          connections[key] = { kind: "member", id, t };
        } else if (v.kind === "axes") {
          const ids = list(v.ids, "Bağlı akslar", 2).map(id => text(id, "Aks kimliği"));
          if (ids.length !== 2 || ids[0] === ids[1] || ids.some(id => { const p = byId.get(id); return p?.type !== "axis" || p.floorId !== element.floorId; })) throw new Error("Aks bağlantısı geçersiz.");
          connections[key] = { kind: "axes", ids: ids as [string, string] };
        } else throw new Error("Bilinmeyen nokta bağlantısı.");
      }
      element.connections = connections;
      for (const [key, binding] of Object.entries(connections)) {
        const actual = (element as unknown as Record<string, Point>)[key];
        let expected: Point | null = null;
        if (binding.kind === "column") { const parent = byId.get(binding.id)!; if (parent.type === "column") expected = parent.position; }
        else if (binding.kind === "member") { const parent = byId.get(binding.id)!; if (parent.type === "beam" || parent.type === "wall") expected = { x: parent.start.x + (parent.end.x - parent.start.x) * binding.t, y: parent.start.y + (parent.end.y - parent.start.y) * binding.t }; }
        else { const [a, b] = binding.ids.map(id => byId.get(id)!); if (a.type === "axis" && b.type === "axis") expected = lineIntersection(a.start, a.end, b.start, b.end); }
        if (!expected || distance(actual, expected) > 2e-6) throw new Error(`${element.name}: bağlı düğüm koordinatı referansıyla uyuşmuyor.`);
      }
    }
    if (element.type === "slab" && element.boundary?.elementIds.some(id => { const parent = byId.get(id); return !parent || parent.floorId !== element.floorId || parent.type === "axis" || parent.type === "slab"; })) throw new Error(`${element.name}: döşeme sınır referansı geçersiz.`);
  }
  const visiting = new Set<string>(), finished = new Set<string>();
  function checkDependencies(id: string) { if (finished.has(id)) return; if (visiting.has(id)) throw new Error("Düğüm bağlantılarında döngü var."); visiting.add(id); for (const binding of Object.values(byId.get(id)?.connections ?? {})) for (const parent of binding.kind === "axes" ? binding.ids : [binding.id]) checkDependencies(parent); visiting.delete(id); finished.add(id); }
  for (const id of byId.keys()) checkDependencies(id);
  const layers = source.layers === undefined ? undefined : list(source.layers, "Katmanlar", 100).map(v => {
    const l = record(v, "Katman");
    if (typeof l.visible !== "boolean" || typeof l.locked !== "boolean") throw new Error("Katman görünürlük/kilit seçeneği geçersiz.");
    return { name: text(l.name, "Katman adı"), visible: l.visible, locked: l.locked, ...readExtras(l) } as CadLayer;
  });
  if (layers && new Set(layers.map(l => l.name)).size !== layers.length) throw new Error("Katman adı yinelenemez.");
  let toolDefaults: CadModel["toolDefaults"];
  if (source.toolDefaults !== undefined) {
    const templates = record(source.toolDefaults, "Eleman varsayılanları");
    toolDefaults = {};
    for (const type of ["column", "beam", "wall", "slab"] as const) if (templates[type] !== undefined) {
      const template = record(templates[type], "Eleman varsayılanı");
      if (template.type !== type) throw new Error("Eleman varsayılanının türü geçersiz.");
      const checked = validateModel({ ...source, toolDefaults: undefined, elements: [{ ...template, connections: undefined, boundary: undefined, labelPosition: undefined, floorId: floorIds.has(template.floorId as string) ? template.floorId : floors[0].id, materialId: materialIds.has(template.materialId as string) ? template.materialId : materials[0].id }] });
      toolDefaults[type] = checked.elements[0] as SolidElement;
    }
  }
  const model: CadModel = { schemaVersion: 1, name: text(source.name, "Model adı"), floors, materials, elements, ...(layers ? { layers } : {}), ...(source.snap === undefined ? {} : { snap: readSnap(source.snap) }), ...(toolDefaults ? { toolDefaults } : {}), ...(source.drafting === undefined ? {} : { drafting: validateDrafting(source.drafting, floorIds) }) };
  validateLinkedSlabRegions(model);
  return model;
}

export function translateElement(element: CadElement, delta: Point): CadElement {
  const move = (p: Point) => ({ x: p.x + delta.x, y: p.y + delta.y });
  if (element.type === "column") return { ...element, position: move(element.position) };
  if (element.type === "slab") return { ...element, points: element.points.map(move), ...(element.labelPosition ? { labelPosition: move(element.labelPosition) } : {}) };
  return { ...element, start: move(element.start), end: move(element.end) };
}
