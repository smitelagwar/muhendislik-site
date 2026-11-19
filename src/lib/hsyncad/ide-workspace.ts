import type { IdeElement, IdeProject } from "./ide-import";
import type { IdeNativeElementPatch } from "./ide-native-save";
import { createEmptyModel, validateModel, type CadElement, type CadModel, type Floor, type Point } from "./model";
import { elementFootprint, isSimplePolygon } from "./geometry";

export type IdeWorkspaceImport = { source: IdeProject; mappedIds: string[]; references: { id: string; reason: string }[] };
export const IDE_REFERENCE_LAYER = "IDE referansları";
const layers = { axis: "Akslar", column: "Kolonlar", beam: "Kirişler", wall: "Perdeler", slab: "Döşemeler", slabEdge: "Döşeme kenarları" };
const ring = (points: Point[]) => points.length > 2 && Math.hypot(points[0].x - points.at(-1)!.x, points[0].y - points.at(-1)!.y) < 1e-8 ? points.slice(0, -1) : points;
const requireValue = (value: number | undefined, label: string): number => {
  if (value === undefined || !Number.isFinite(value) || value <= 0) throw new Error(`${label} çözümlenemedi.`);
  return value;
};

const TF_M2_TO_KN_M2 = 9.80665;

/** Only map geometry that the editor can represent without filling holes or guessing dimensions. */
function editableElement(e: IdeElement, floor: Floor, materialId: string): CadElement {
  if (e.planOnly) throw new Error("Yalnız plan geometrisi çözümlendi.");
  if (e.mesh) throw new Error("Kayıtlı yüzey ağı; parametrik düzenleme desteklenmiyor.");
  if (e.holes?.length) throw new Error("İç boşluklar korunuyor; boşluklu eleman düzenlemesi desteklenmiyor.");
  if (!(e.type in layers)) throw new Error("Bu nesne türü kaynak referansı olarak korunuyor.");
  if (e.type === "wall" && e.structural === false) throw new Error("Mimari duvar, betonarme perdeye dönüştürülmedi.");
  const type = e.type as keyof typeof layers;
  const base = { id: e.id, name: e.name || `IDE ${e.nativeId}`, floorId: e.floorId, materialId, layer: layers[type] };
  const [start, end] = [e.points[0], e.points.at(-1)];
  if (type === "axis" || type === "slabEdge") {
    if (!start || !end || e.points.length !== 2) throw new Error("Doğrusal iki uç kaydı bekleniyor.");
    return { ...base, type, start: { ...start }, end: { ...end }, ...(type === "axis" ? { extension: 0 } : { topOffset: e.nativeZ }) };
  }
  const height = requireValue(e.top !== undefined && e.bottom !== undefined ? e.top - e.bottom : undefined, "Düşey aralık");
  const topOffset = e.top! - floor.elevation - floor.height;
  if (type === "slab") {
    const points = ring(e.footprint ?? e.points);
    return {
      ...base,
      type,
      points: points.map(p => ({ ...p })),
      thickness: requireValue(e.thickness, "Döşeme kalınlığı"),
      topOffset,
      ...(e.slabLoads ? { finishLoad: e.slabLoads.finishTfM2 * TF_M2_TO_KN_M2, liveLoad: e.slabLoads.liveTfM2 * TF_M2_TO_KN_M2 } : {}),
    };
  }
  if (type === "column") {
    const points = ring(e.footprint ?? e.points);
    if (!isSimplePolygon(points) || points.length > 100) throw new Error("Kolon kesiti düzenleyici sınırlarının dışında.");
    const position = e.circleSection?.center ?? { x: points.reduce((s, p) => s + p.x, 0) / points.length, y: points.reduce((s, p) => s + p.y, 0) / points.length };
    const minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y)), maxY = Math.max(...points.map(p => p.y));
    const common = { ...base, type, position: { ...position }, height, heightMode: "fixed" as const, baseOffset: e.bottom! - floor.elevation };
    if (e.circleSection) return { ...common, section: "circle", width: 2 * e.circleSection.radius, depth: 2 * e.circleSection.radius, circleSegments: 64 };
    // Rectangles stay dimension-editable; other sections retain their exact local polygon.
    const a = points[0], b = points[1], width = Math.hypot(b.x - a.x, b.y - a.y), angle = Math.atan2(b.y - a.y, b.x - a.x);
    const local = points.map(p => ({ x: (p.x - position.x) * Math.cos(angle) + (p.y - position.y) * Math.sin(angle), y: -(p.x - position.x) * Math.sin(angle) + (p.y - position.y) * Math.cos(angle) }));
    const depth = Math.max(...local.map(p => p.y)) - Math.min(...local.map(p => p.y));
    const rectangle = { ...common, section: "rectangle" as const, width, depth, rotation: angle * 180 / Math.PI };
    if (points.length === 4 && elementFootprint(rectangle).every(p => points.some(q => Math.hypot(p.x - q.x, p.y - q.y) < 1e-6))) return rectangle;
    return { ...common, section: "polygon", width: maxX - minX, depth: maxY - minY, sectionPoints: points.map(p => ({ x: p.x - position.x, y: p.y - position.y })) };
  }
  if (!start || !end || e.points.length !== 2) throw new Error("Doğrusal iki uç kaydı bekleniyor.");
  const actual = ring(e.footprint ?? []), length = Math.hypot(end.x - start.x, end.y - start.y);
  const centre = { x: actual.reduce((s, p) => s + p.x, 0) / actual.length, y: actual.reduce((s, p) => s + p.y, 0) / actual.length };
  // Native lateralOffset is an edge placement value, not the editor's centre-line offset.
  const offset = (centre.x - (start.x + end.x) / 2) * -(end.y - start.y) / length + (centre.y - (start.y + end.y) / 2) * (end.x - start.x) / length;
  const common = { ...base, start: { ...start }, end: { ...end }, offset };
  const result: CadElement = type === "beam"
    ? { ...common, type, width: requireValue(e.width, "Kiriş genişliği"), height, topOffset }
    : { ...common, type: "wall", thickness: requireValue(e.width, "Perde kalınlığı"), height, heightMode: "fixed", baseOffset: e.bottom! - floor.elevation };
  // Reject a non-rectangular footprint rather than quietly straightening it.
  const projected = elementFootprint(result);
  if (actual.length !== 4 || !projected.every(p => actual.some(q => Math.hypot(p.x - q.x, p.y - q.y) < 1e-5))) throw new Error("Kesit konturu doğrusal düzenleyiciyle eşleşmiyor.");
  return result;
}

export function importIdeWorkspace(source: IdeProject): CadModel {
  const model = createEmptyModel();
  model.name = source.name || source.filename;
  model.floors = source.floors.map(f => ({ id: f.id, name: f.name, elevation: f.elevation, height: f.height }));
  const nativeMaterials = source.materials?.length
    ? source.materials.map(m => ({
        id: `ide-mat-${m.id}`,
        name: m.name,
        kind: m.kind,
        fckMpa: m.fckMpa,
        fykMpa: m.fykMpa,
        elasticModulusMpa: m.elasticModulusMpa,
        unitWeightTfM3: m.unitWeightTfM3,
      }))
    : undefined;
  model.materials = nativeMaterials ?? [{ id: "ide-unassigned", name: "IDE malzemesi · yeniden tanımlayın" }];
  const materialByIndex = new Map<number, string>(
    (source.materials ?? []).map(m => [m.id, `ide-mat-${m.id}`]),
  );
  const defaultMaterialId = model.materials[0].id;
  const references: IdeWorkspaceImport["references"] = [];
  for (const e of source.elements) {
    try {
      const materialId = (e.materialIndex !== undefined ? materialByIndex.get(e.materialIndex) : undefined) ?? defaultMaterialId;
      const element = editableElement(e, model.floors.find(f => f.id === e.floorId)!, materialId);
      // Reuse the real editor validator so one unsupported record cannot reject the whole project.
      model.elements.push(validateModel({ ...model, elements: [element] }).elements[0]);
    } catch (error) { references.push({ id: e.id, reason: error instanceof Error ? error.message : "Geometri desteklenmiyor." }); }
  }
  model.ideImport = { source, mappedIds: model.elements.map(e => e.id), references };
  return validateModel(model);
}

/** R1–R5 counts shown by the workbench/report summary labels.
 *  Fields absent from the source stay at 0/undefined — nothing is fabricated. */
export type IdeProjectAnalytics = {
  materialCount: number;
  rebarCount: number;
  modalTableCount: number;
  seismic?: IdeProject["seismicSoil"];
};

export function ideProjectAnalytics(source: IdeProject | null | undefined): IdeProjectAnalytics | null {
  if (!source) return null;
  let rebarCount = 0;
  for (const element of source.elements) if (element.rebarLayout) rebarCount += 1;
  return {
    materialCount: source.materials?.length ?? 0,
    rebarCount,
    modalTableCount: source.f9Results?.modalTables.length ?? 0,
    ...(source.seismicSoil ? { seismic: source.seismicSoil } : {}),
  };
}

export function ideReferenceElements(model: CadModel): IdeElement[] {
  if (!model.ideImport) return [];
  const ids = new Set(model.ideImport.references.map(r => r.id)), floors = new Set(model.floors.map(f => f.id));
  return model.ideImport.source.elements.filter(e => ids.has(e.id) && floors.has(e.floorId));
}

/**
 * T-F6.2 — derive the pending native save patches from the live editor model.
 * Only beams whose section height drifted from the decoded source value are
 * writable (T-F6.1 grammar contract); everything else is a UI-level rejection.
 * The derivation reads the model itself, so an undo that restores the source
 * height makes the patch disappear without a separate patch store. No source
 * (or an unresolvable record) yields no patch — an empty list keeps the
 * product rule intact: editing nothing can never produce a native save.
 */
export function collectIdeNativePatches(source: IdeProject | null | undefined, elements: CadElement[]): IdeNativeElementPatch[] {
  if (!source) return [];
  const beams = new Map<string, IdeElement>();
  for (const element of source.elements) if (element.type === "beam") beams.set(element.id, element);
  const patches: IdeNativeElementPatch[] = [];
  for (const element of elements) {
    if (element.type !== "beam") continue;
    const native = beams.get(element.id);
    if (!native) continue;
    if (native.height === undefined || !Number.isFinite(native.height)) continue;
    if (!Number.isInteger(native.sourceOffset) || native.sourceOffset < 0) continue;
    // Float noise below 1e-9 is not a user edit.
    if (!Number.isFinite(element.height) || Math.abs(element.height - native.height) <= 1e-9) continue;
    patches.push({ id: element.id, sourceOffset: native.sourceOffset, field: "beamSectionHeight", value: element.height });
  }
  return patches;
}
