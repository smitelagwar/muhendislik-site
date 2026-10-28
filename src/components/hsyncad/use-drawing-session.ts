"use client";
import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createToolTemplate } from "@/lib/hsyncad/creation";
import { createAxisElement, createParallelAxis, expandAxisFrame, type AxisDrawingOptions } from "@/lib/hsyncad/axes";
import { axisGuide, constrainPoint } from "@/lib/hsyncad/drawing";
import { elementFootprint, elementVerticalRange, distance } from "@/lib/hsyncad/geometry";
import { layerState, setLayerState } from "@/lib/hsyncad/definitions";
import { bindNewElement } from "@/lib/hsyncad/relationships";
import { pointInRegion, regionAt, regionLabelPoint, slabRegionsAtLevel } from "@/lib/hsyncad/regions";
import { translateElement, type CadElement, type CadModel, type Floor, type Point, type SlabElement, type SolidElement } from "@/lib/hsyncad/model";
import type { Tool } from "./editor-state";
import type { DrawingUnit, SlabMode } from "./drawing-toolbar";

export type DrawingType = Exclude<CadElement["type"], "slabEdge">;
export type Dimensions = { width: number; depth: number; height: number; thickness: number };
export type PointAction = { source: "canvas" | "coordinate"; ctrlKey?: boolean };
type Props = {
  model: CadModel; floor: Floor; tool: Tool; activeType: DrawingType | null; defaults: Record<DrawingType, Dimensions>; selected?: CadElement;
  axisOptions: AxisDrawingOptions; onAxisOptions: (o: AxisDrawingOptions) => void;
  commit: (model: CadModel, message: string) => boolean; onSelect: (id: string | null) => void; onMessage: (s: string) => void; onFit: () => void; onReveal: (layer: string) => void;
};
const numeric = (value: string) => value.trim() ? Number(value.replace(",", ".")) : NaN;
function useSlabRegions(model: CadModel, tool: Tool, mode: SlabMode, levelKey: string) {
  return useMemo(() => {
    if (tool !== "slab" || mode !== "region") return { regions: [], error: "" };
    try { return { regions: slabRegionsAtLevel(model, JSON.parse(levelKey)), error: "" }; }
    catch (error) { return { regions: [], error: error instanceof Error ? error.message : "Döşeme sınırları çözülemedi." }; }
  }, [model, tool, mode, levelKey]);
}
export function useDrawingSession(p: Props) {
  const [pending, setPending] = useState<Point[]>([]), [cursor, setCursor] = useState<Point>({ x: 0, y: 0 });
  const [overrides, setOverrides] = useState<Partial<Record<SolidElement["type"], Partial<SolidElement>>>>({});
  const [unit, setUnitValue] = useState<DrawingUnit>("m"), [continuous, setContinuous] = useState(true), [slabMode, setSlabModeValue] = useState<SlabMode>("region");
  const [lengthText, setLengthText] = useState(""), [directionText, setDirectionText] = useState("");
  const [angleLock, setAngleLock] = useState<number | null>(null), [axisDistance, setAxisDistance] = useState(4);
  const [labelDraft, setLabelDraft] = useState<SlabElement | null>(null);
  const lastPoint = useRef<Point>({ x: 0, y: 0 }), numericArmed = useRef(false), axisNumber = useRef("");
  const [lastAngle, setLastAngle] = useState(0);
  const [lastPosition, setLastPosition] = useState<Point>({ x: 0, y: 0 });
  const factor = unit === "cm" ? 0.01 : 1;
  const lengthLock = Number.isFinite(numeric(lengthText)) && numeric(lengthText) > 0 ? numeric(lengthText) * factor : null;
  const directionLock = Number.isFinite(numeric(directionText)) ? numeric(directionText) : null;
  let definition: SolidElement | undefined;
  if (p.activeType && p.activeType !== "axis") {
    const type = p.activeType, template = { ...(p.model.toolDefaults?.[type] ?? createToolTemplate(type, p.floor.id, p.model.materials[0].id)), ...overrides[type] } as SolidElement;
    definition = { ...template, ...Object.fromEntries(Object.entries(p.defaults[type]).filter(([key]) => key in template)), floorId: p.floor.id };
  }
  const slabSettings = definition?.type === "slab" ? definition : undefined;
  const thickness = slabSettings?.thickness ?? 0.15, topOffset = slabSettings?.topOffset ?? 0, slopeX = slabSettings?.slopeX ?? 0, slopeY = slabSettings?.slopeY ?? 0, buildUp = slabSettings?.buildUp;
  const slabLevelKey = JSON.stringify({ floorId: p.floor.id, thickness, topOffset, slopeX, slopeY, buildUp });
  const regionState = useSlabRegions(p.model, p.tool, slabMode, slabLevelKey);
  const hoverRegion = p.tool === "slab" && slabMode === "region" ? regionAt(cursor, regionState.regions) : undefined;
  const target = pending.length && p.tool !== "column" ? constrainPoint(pending[pending.length - 1], cursor, lengthLock, directionLock, lastAngle) : cursor;
  const columnAngle = angleLock ?? (p.tool === "column" && pending.length && distance(pending[0], cursor) > 1e-6 ? Math.atan2(cursor.y - pending[0].y, cursor.x - pending[0].x) * 180 / Math.PI : definition?.type === "column" ? definition.rotation ?? 0 : 0);
  let preview: CadElement | undefined;
  if (p.tool === "axis") preview = axisGuide(p.model, p.floor.id, p.axisOptions, cursor, pending[0]);
  else if (definition && p.tool === "column" && definition.type === "column") preview = { ...definition, position: pending[0] ?? cursor, rotation: columnAngle };
  else if (definition?.type === "slab" && p.tool === "slab") {
    if (labelDraft) preview = { ...labelDraft, labelPosition: cursor };
    else if (slabMode === "region" && hoverRegion) preview = { ...definition, points: hoverRegion.points };
    else if (slabMode === "polygon" && pending.length >= 2) preview = { ...definition, points: [...pending, cursor] };
    else if (slabMode === "edge" && pending.length) preview = { type: "slabEdge", id: "__draft__", name: "DK", floorId: p.floor.id, materialId: definition.materialId, layer: "Döşeme kenarları", start: pending[0], end: target, topOffset };
  } else if (definition && (definition.type === "beam" || definition.type === "wall") && pending.length) preview = { ...definition, start: pending[0], end: target };
  if (preview) {
    try { const points = elementFootprint(preview); if (!points.length || points.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y))) preview = undefined; }
    catch { preview = undefined; }
  }
  let levels: [number, number] | null = null;
  if (definition) { try { levels = elementVerticalRange(preview ?? definition, p.floor); } catch { /* Incomplete number inputs have no level readout. */ } }

  function patchDefinition(patch: Partial<SolidElement>) { if (definition) setOverrides(old => ({ ...old, [definition.type]: { ...old[definition.type], ...patch } })); }
  function patchToolDefinition(type: SolidElement["type"], patch: Partial<SolidElement>) { setOverrides(old => ({ ...old, [type]: { ...old[type], ...patch } })); }
  function clearOverrides(type: SolidElement["type"]) { setOverrides(old => { const next = { ...old }; delete next[type]; return next; }); }
  function clearDraft() { setPending([]); setLabelDraft(null); setLengthText(""); setDirectionText(""); setAngleLock(null); numericArmed.current = false; axisNumber.current = ""; }
  function recordPoint(point: Point) { lastPoint.current = point; setLastPosition(point); }
  function resetModel() { clearDraft(); setOverrides({}); recordPoint({ x: 0, y: 0 }); }
  function changeUnit(value: DrawingUnit) { if (Number.isFinite(numeric(lengthText))) setLengthText(String(numeric(lengthText) * factor / (value === "cm" ? 0.01 : 1))); setUnitValue(value); numericArmed.current = false; }
  function changeSlabMode(mode: SlabMode) { clearDraft(); setSlabModeValue(mode); }
  function revealModel(element: CadElement): CadModel { return layerState(p.model, element.layer, p.floor.id).visible ? p.model : setLayerState(p.model, element.layer, { visible: true, locked: false }, "floor", p.floor.id); }
  function addElement(points: Point[], patch?: Partial<SolidElement>): boolean {
    if (!definition) return false;
    const type = definition.type, spec = { ...definition, ...patch } as SolidElement, prefix = spec.name;
    let sequence = p.model.elements.filter(e => e.type === type).length + 1;
    while (p.model.elements.some(e => e.name === `${prefix}${sequence}`)) sequence++;
    const common = { ...spec, id: crypto.randomUUID(), name: `${prefix}${sequence}`, floorId: p.floor.id };
    let element: SolidElement;
    if (spec.type === "column") element = { ...spec, ...common, type: "column", position: points[0], rotation: patch && "rotation" in patch ? patch.rotation : spec.rotation } as SolidElement;
    else if (spec.type === "slab") element = { ...spec, ...common, type: "slab", points } as SolidElement;
    else element = { ...spec, ...common, type: spec.type, start: points[0], end: points[1] } as SolidElement;
    if (layerState(p.model, element.layer, p.floor.id).locked) { p.onMessage("Hedef katman kilitli; kilidi çözmeden çizim yapılamaz."); return false; }
    element = bindNewElement(element, p.model) as SolidElement;
    const next = revealModel(element);
    if (!p.commit({ ...next, elements: [...next.elements, element], toolDefaults: { ...next.toolDefaults, [type]: { ...element, name: prefix, id: `defaults-${type}` } } }, `${element.name} eklendi.${element.connections ? " Düğüm bağlantıları kuruldu." : ""}`)) return false;
    p.onSelect(element.id); p.onReveal(element.layer);
    if (element.type === "beam" || element.type === "wall") { setLastAngle(Math.atan2(points[1].y - points[0].y, points[1].x - points[0].x) * 180 / Math.PI); setPending(continuous ? [points[1]] : []); }
    else setPending([]);
    setLabelDraft(null); numericArmed.current = false; return true;
  }
  function confirmColumn() { if (p.tool === "column" && pending.length) addElement([pending[0]], { rotation: columnAngle }); }
  function finishSlab() { if (p.tool !== "slab" || slabMode !== "polygon" || pending.length < 3) { p.onMessage("Döşeme için kapalı alan seçin veya en az üç ayrı köşe girin."); return; } addElement(pending); }
  function addEdge(point: Point) {
    if (!pending.length) { setPending([point]); p.onMessage("Döşeme kenarının bitiş noktasını belirtin."); return; }
    const element: CadElement = bindNewElement({ type: "slabEdge", id: crypto.randomUUID(), name: `DK${p.model.elements.filter(e => e.type === "slabEdge").length + 1}`, floorId: p.floor.id, materialId: p.model.materials[0].id, layer: "Döşeme kenarları", start: pending[0], end: point, topOffset }, p.model);
    if (layerState(p.model, element.layer, p.floor.id).locked) { p.onMessage("Döşeme kenarı katmanı kilitli."); return; }
    const next = revealModel(element);
    if (p.commit({ ...next, elements: [...next.elements, element] }, "Döşeme kenarı eklendi; kapalı alanın içine döşeme yerleştirebilirsiniz.")) { setPending(continuous ? [point] : []); p.onSelect(element.id); }
  }
  function placePoint(point: Point, action: PointAction = { source: "coordinate" }) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) { p.onMessage("Geçerli X/Y girin."); return; }
    if (pending.length && (p.tool === "beam" || p.tool === "wall" || p.tool === "slab" && slabMode === "edge")) point = constrainPoint(pending.at(-1)!, point, lengthLock, directionLock, lastAngle);
    setCursor(point);
    recordPoint(point);
    if (p.tool === "select" || p.tool === "pan") { p.onMessage("Önce bir çizim aracı seçin."); return; }
    if (p.tool === "move") {
      if (!p.selected) { p.onMessage("Önce taşıyacağınız elemanı seçin."); return; }
      if (layerState(p.model, p.selected.layer, p.selected.floorId).locked) { p.onMessage("Kilitli katman taşınamaz."); return; }
      if (!pending.length) { setPending([point]); return; }
      const moved = translateElement(p.selected, { x: point.x - pending[0].x, y: point.y - pending[0].y });
      if (p.commit({ ...p.model, elements: p.model.elements.map(e => e.id === moved.id ? moved : e) }, `${moved.name} ve bağlı elemanları taşındı.`)) setPending([]);
      return;
    }
    if (p.tool === "axis") {
      const guide = axisGuide(p.model, p.floor.id, p.axisOptions, point, pending[0]);
      if (!guide) { setPending([point]); return; }
      try {
        const axis = createAxisElement({ ...p.axisOptions, start: guide.start, end: guide.end, direction: p.axisOptions.direction, name: p.axisOptions.name.trim() || undefined, floorId: p.floor.id, materialId: p.model.materials[0].id }, p.model.elements);
        if (layerState(p.model, axis.layer, p.floor.id).locked) { p.onMessage("Aks katmanı kilitli."); return; }
        if (p.commit({ ...p.model, elements: expandAxisFrame([...p.model.elements, axis], p.floor.id) }, `${axis.name} aksı eklendi. Mesafe yazıp Enter ile devam edebilirsiniz.`)) { setPending([]); p.onSelect(axis.id); if (p.axisOptions.direction !== "free") p.onFit(); }
      } catch (error) { p.onMessage(error instanceof Error ? error.message : "Aks eklenemedi."); }
      return;
    }
    if (p.tool === "column") {
      if (action.source === "coordinate") { addElement([point], { rotation: columnAngle }); return; }
      if (!pending.length) { setPending([point]); p.onMessage("Kolon sabitlendi. Fareyle döndürün; Space: simetri, Shift: dik açı. Tıklayın veya Enter ile onaylayın."); }
      else addElement([pending[0]], { rotation: angleLock ?? (distance(pending[0], point) > 1e-6 ? Math.atan2(point.y - pending[0].y, point.x - pending[0].x) * 180 / Math.PI : columnAngle) });
      return;
    }
    if (p.tool === "slab") {
      if (labelDraft) { addElement(labelDraft.points, { ...labelDraft, labelPosition: point }); return; }
      if (slabMode === "edge") { addEdge(point); return; }
      if (slabMode === "region") {
        const region = regionAt(point, regionState.regions);
        if (!region || definition?.type !== "slab") { p.onMessage(regionState.error || "Kapalı sınır bulunamadı. Kiriş/perde uçlarını bağlayın veya Döşeme kenarı ile açıklığı kapatın."); return; }
        const duplicate = p.model.elements.find(e => e.type === "slab" && e.floorId === p.floor.id && pointInRegion(point, e.points) && Math.abs((e.topOffset ?? 0) - (definition.topOffset ?? 0)) < 1e-6);
        if (duplicate) { p.onMessage(`Bu kotta ${duplicate.name} döşemesi zaten var. Bölmek için önce mevcut döşemeyi kaldırın.`); return; }
        const patch = { ...definition, labelPosition: regionLabelPoint(region.points), boundary: { elementIds: region.elementIds } };
        if (action.ctrlKey) { setLabelDraft({ ...patch, points: region.points }); p.onMessage("Döşeme yazısının yerini belirtin; Esc iptal eder."); }
        else addElement(region.points, patch);
        return;
      }
      if (pending.length >= 3 && distance(point, pending[0]) < 0.08) { finishSlab(); return; }
      if (pending.some(p => distance(p, point) < 1e-6)) { p.onMessage("Farklı bir köşe seçin veya Döşemeyi tamamla düğmesini kullanın."); return; }
      setPending([...pending, point]); return;
    }
    if (!pending.length) setPending([point]); else addElement([pending[0], point]);
  }
  function offsetAxis(distanceValue = axisDistance) {
    try {
      const axes = p.model.elements.filter(e => e.type === "axis" && e.floorId === p.floor.id && ((e.orientation ?? (Math.abs(e.start.y - e.end.y) < 1e-6 ? "horizontal" : Math.abs(e.start.x - e.end.x) < 1e-6 ? "vertical" : "free")) === p.axisOptions.direction));
      const source = axes.find(e => e.id === p.selected?.id) ?? axes.at(-1);
      if (!source || source.type !== "axis") throw new Error("Önce bu yönde bir aks oluşturun veya seçin.");
      const axis = createParallelAxis(source, distanceValue, p.model.elements, p.axisOptions.name);
      Object.assign(axis, Object.fromEntries(Object.entries(p.axisOptions).filter(([key]) => !["direction", "name"].includes(key))));
      if (layerState(p.model, axis.layer, p.floor.id).locked) throw new Error("Aks katmanı kilitli.");
      if (p.commit({ ...p.model, elements: expandAxisFrame([...p.model.elements, axis], p.floor.id) }, `${source.name} → ${axis.name}: ${distanceValue * (unit === "cm" ? 100 : 1)} ${unit} ofset.`)) { p.onSelect(axis.id); p.onFit(); numericArmed.current = false; axisNumber.current = ""; }
    } catch (error) { p.onMessage(error instanceof Error ? error.message : "Aks ofseti oluşturulamadı."); }
  }
  function handleKey(event: KeyboardEvent): boolean {
    if (event.ctrlKey || event.metaKey || event.altKey) return false;
    if (event.key === " " && (p.tool === "column" || p.tool === "beam" || p.tool === "wall")) { event.preventDefault(); if (definition?.type === "column") patchDefinition({ mirrorX: !definition.mirrorX }); else if (definition?.type === "beam" || definition?.type === "wall") patchDefinition({ alignment: (definition.alignment ?? "center") === "center" ? "left" : definition.alignment === "left" ? "right" : "center" }); return true; }
    if (p.tool === "column" && /^[1-4]$/.test(event.key)) { event.preventDefault(); patchDefinition({ anchorMode: (["defined", "edge", "corner", "center"] as const)[Number(event.key) - 1] }); return true; }
    const linear = p.tool === "beam" || p.tool === "wall" || p.tool === "slab" && slabMode === "edge";
    if ((p.tool === "axis" || linear) && (/^[0-9.,-]$/.test(event.key) || event.key === "Backspace" && numericArmed.current)) {
      event.preventDefault(); const before = numericArmed.current ? (p.tool === "axis" ? axisNumber.current : lengthText) : "";
      const text = event.key === "Backspace" ? before.slice(0, -1) : before + event.key; numericArmed.current = true;
      if (p.tool === "axis") { axisNumber.current = text; setAxisDistance(numeric(text) * factor); } else setLengthText(text);
      return true;
    }
    if (event.key === "Enter") {
      if (p.tool === "axis") { event.preventDefault(); offsetAxis(); return true; }
      if (p.tool === "column" && pending.length) { event.preventDefault(); confirmColumn(); return true; }
      if (linear && pending.length && lengthLock !== null) { event.preventDefault(); placePoint(constrainPoint(pending[0], cursor, lengthLock, directionLock, lastAngle), { source: "canvas" }); return true; }
      if (p.tool === "slab" && slabMode === "region") { event.preventDefault(); placePoint(cursor, { source: "canvas" }); return true; }
    }
    return false;
  }
  return { pending, setPending, cursor, setCursor, lastPoint, lastPosition, recordPoint, unit, changeUnit, continuous, setContinuous, slabMode, changeSlabMode, definition, preview, levels, hoverRegion, labelDraft,
    columnAngle, angleLocked: angleLock !== null, setAngleLock, patchDefinition, patchToolDefinition, clearOverrides, clearDraft, resetModel, confirmColumn, finishSlab, placePoint, offsetAxis, axisDistance, setAxisDistance,
    lengthText, setLengthText, directionText, setDirectionText, lengthLock, directionLock, fallbackAngle: lastAngle, handleKey };
}
