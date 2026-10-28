"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type KeyboardEvent } from "react";
import dynamic from "next/dynamic";
import { Box, Check, ChevronRight, Download, Eye, Hand, Layers, Maximize2, MousePointer2, Move, Plus, Redo2, RotateCcw, Ruler, Trash2, Undo2, X } from "lucide-react";
import { createDemoModel, createEmptyModel, isSolidElement, validateModel, type CadModel, type Point } from "@/lib/hsyncad/model";
import { calculateQuantities } from "@/lib/hsyncad/quantities";
import { resolveJunctions } from "@/lib/hsyncad/junctions";
import { expandAxisFrame, type AxisDrawingOptions } from "@/lib/hsyncad/axes";
import { addStorey, DEFAULT_SNAP, layerState, setLayerState } from "@/lib/hsyncad/definitions";
import { copyElementsToFloor, reconcileConnections, removeWithDependents } from "@/lib/hsyncad/relationships";
import { createFeatureDemo } from "@/lib/hsyncad/feature-demo";
import { createWorkflowDemo } from "@/lib/hsyncad/workflow-demo";
import { DRAFTING_NAMES, isDraftingTool, localToWorld, worldToLocal } from "@/lib/hsyncad/drafting";
import { constrainPoint } from "@/lib/hsyncad/drawing";
import { useReferenceTools } from "./use-reference-tools";
import { ReferenceButtons, ReferenceOptions, ReferenceRecords, type ReferenceSource } from "./reference-tools";
import AxisOptions from "./axis-options";
import CommandBar, { ELEMENT_TOOLS as TOOLS, type RibbonAction } from "./command-bar";
import { historyReducer, initialHistory, LAYERS, TYPE_COLORS, TYPE_NAMES, type Tool } from "./editor-state";
import { ElementProperties, FloorProperties } from "./properties";
import Plan2D from "./plan2d";
import styles from "./workbench.module.css";
import SettingsDialog from "./settings-dialog";
import { LayerOptions, MaterialOptions, SnapOptions } from "./project-settings";
import QuantityReport from "./quantity-report";
import EditDialog from "./edit-dialog";
import { editElement, type EditOperation } from "@/lib/hsyncad/edit-commands";
import AnalysisDialog from "./analysis-dialog";
import { runStructuralAnalysis, type AnalysisResult, type AnalysisSettings } from "@/lib/hsyncad/analysis";
import { downloadDxfFile } from "@/lib/hsyncad/dxf-export";
import { addPadFootingToColumn, addStripFootingToBeam, addRaftFoundation } from "@/lib/hsyncad/foundations";
import { addStairToModel } from "@/lib/hsyncad/stairs";
import type { ColumnElement, BeamElement } from "@/lib/hsyncad/model";
import DrawingToolbar from "./drawing-toolbar";
import NativeCoordinateBox from "./coordinate-box";
import { useDrawingSession, type DrawingType, type Dimensions } from "./use-drawing-session";

const Scene3D = dynamic(() => import("./scene3d"), { ssr: false, loading: () => <div className="hcad-loading">3B görünüm hazırlanıyor…</div> });
const STORAGE_KEY = "hsyncad.model.v1";

// Formatting should not round 0.6314999999999999 downward because of
// binary floating-point noise at decimal half-steps.
const number = (value: number | null | undefined, digits = 3) => {
  if (value == null) return "—";
  const factor = 10 ** digits;
  // Quantize harmless floating noise five places beyond displayed precision
  // before half-up decimal rounding (e.g. a 0.6315 m³ overlap -> 0.632).
  const decimal = Number(value.toFixed(Math.min(digits + 5, 12)));
  const rounded = Math.sign(decimal) * Math.round(Math.abs(decimal) * factor) / factor;
  return rounded.toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
};
const DEFAULTS: Record<DrawingType, Dimensions> = {
  axis: { width: 0.4, depth: 0.4, height: 3, thickness: 0.2 },
  column: { width: 0.4, depth: 0.4, height: 3, thickness: 0.2 },
  beam: { width: 0.25, depth: 0.5, height: 0.5, thickness: 0.2 },
  wall: { width: 0.2, depth: 0.2, height: 3, thickness: 0.2 },
  slab: { width: 0.2, depth: 0.2, height: 3, thickness: 0.15 },
};

export default function HsynCadWorkbench() {
  const [history, dispatch] = useReducer(historyReducer, undefined, initialHistory);
  const model = history.present;
  const [cadTheme, setCadTheme] = useState<"light" | "dark">("light");
  const [showGrid, setShowGrid] = useState(true), [dockOpen, setDockOpen] = useState(false), [referenceId, setReferenceId] = useState("");
  const [tool, setTool] = useState<Tool>("select");
  const [editOperation, setEditOperation] = useState<EditOperation | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisViewMode, setAnalysisViewMode] = useState<"none" | "displacement" | "moment" | "shear" | "capacity">("none");
  const [paftaMode, setPaftaMode] = useState(false);
  const [tab, setTab] = useState("Giriş");
  const [ribbonTab, setRibbonTab] = useState("Betonarme");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [floorId, setFloorId] = useState(model.floors[0].id);
  const [defaults, setDefaults] = useState(DEFAULTS);
  const [axisOptions, setAxisOptions] = useState<AxisDrawingOptions>({ direction: "horizontal", name: "", extension: 1, labelSide: "both" });
  const [snapping, setSnapping] = useState(true);
  const [ortho, setOrtho] = useState(false);
  const [gridStep, setGridStep] = useState(0.25);
  const [hiddenLayers, setHiddenLayers] = useState<string[]>([]);
  const [snapLabel, setSnapLabel] = useState("Hazır");
  const [coords, setCoords] = useState({ x: "0", y: "0" });
  const [command, setCommand] = useState("");
  const [message, setMessage] = useState("Bir araç seçin veya ölçülü örneği açın.");
  const [saveStatus, setSaveStatus] = useState("Yerel çalışma");
  const [hydrated, setHydrated] = useState(false);
  const dirty = useRef(false);
  const [zoom, setZoom] = useState(100);
  const [fitKey, setFitKey] = useState(0);
  const [viewRequest, setViewRequest] = useState({ mode: "perspective", revision: 0 });
  const [panel, setPanel] = useState<"quantities" | "properties">("quantities");
  const [isCompact, setIsCompact] = useState(false);
  const [compactView, setCompactView] = useState<"2d" | "3d">("2d");
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [coordinatePosition, setCoordinatePosition] = useState({ x: 70, y: 62 });
  const coordinateDragRef = useRef<{ x: number; y: number } | null>(null);
  const [coordinatesOpen, setCoordinatesOpen] = useState(true);
  const [coordinateLocks, setCoordinateLocks] = useState({ x: false, y: false });
  const [settings, setSettings] = useState<"element" | "snap" | "layers" | "materials" | "report" | null>(null);
  const [coordinateMode, setCoordinateMode] = useState("xy");
  const rootRef = useRef<HTMLDivElement>(null);
  const inspectorTriggerRef = useRef<HTMLButtonElement>(null);
  const inspectorCloseRef = useRef<HTMLButtonElement>(null);
  const inspectorRef = useRef<HTMLElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const floor = model.floors.find((f) => f.id === floorId) ?? model.floors[0];
  const selected = model.elements.find((e) => e.id === selectedId);
  const visibleElements = useMemo(() => model.elements.filter((e) => e.floorId === floor.id && !hiddenLayers.includes(e.layer) && layerState(model, e.layer, e.floorId).visible), [model, floor.id, hiddenLayers]);
  const junctions = useMemo(() => resolveJunctions(model), [model]);
  const quantities = useMemo(() => calculateQuantities(model, junctions), [model, junctions]);
  const activeType = TOOLS.some((t) => t.id === tool) ? tool as DrawingType : null;
    const layerOptions = [...new Set([...LAYERS, ...(model.layers?.map(l => l.name) ?? []), ...model.elements.map((e) => e.layer)])];
  const drawing = useDrawingSession({ model, floor, tool, activeType, defaults, selected, axisOptions, onAxisOptions: setAxisOptions, commit, onSelect: setSelectedId, onMessage: setMessage, onFit: () => setFitKey(n => n + 1), onReveal: layer => setHiddenLayers(old => old.filter(l => l !== layer)) });
  const { pending: drawingPending, setPending, cursor, setCursor, placePoint: placeStructuralPoint, finishSlab } = drawing;
  const references = useReferenceTools(model, floor.id, tool, commit, setMessage);
  const draftingTool = isDraftingTool(tool);
  const pending = draftingTool ? references.pending : drawingPending;
  const coordinateAnchor = pending.at(-1) ?? drawing.lastPosition;
  function coordinateConstraint(point: Point) {
    if (coordinateMode === "polar" || (!coordinateLocks.x && !coordinateLocks.y)) return point;
    const scale = drawing.unit === "cm" ? .01 : 1;
    const x = Number(coords.x.replace(",", ".")) * scale, y = Number(coords.y.replace(",", ".")) * scale;
    let value = coordinateMode === "local" ? worldToLocal(point, references.frame) : coordinateMode === "relative" ? { x: point.x - coordinateAnchor.x, y: point.y - coordinateAnchor.y } : point;
    value = { x: coordinateLocks.x && Number.isFinite(x) ? x : value.x, y: coordinateLocks.y && Number.isFinite(y) ? y : value.y };
    return coordinateMode === "local" ? localToWorld(value, references.frame) : coordinateMode === "relative" ? { x: value.x + coordinateAnchor.x, y: value.y + coordinateAnchor.y } : value;
  }
  function changeCoordinateMode(mode: string) { setCoordinateMode(mode); setCoordinateLocks({ x: false, y: false }); }
  function changeDrawingUnit(unit: "m" | "cm") {
    const factor = drawing.unit === unit ? 1 : unit === "cm" ? 100 : .01;
    const convert = (value: string) => { const parsed = value.trim() ? Number(value.replace(",", ".")) : NaN; return Number.isFinite(parsed) ? String(+(parsed * factor).toFixed(8)) : value; };
    setCoords(old => ({ x: convert(old.x), y: coordinateMode === "polar" ? old.y : convert(old.y) }));
    drawing.changeUnit(unit);
  }
  function toggleCoordinateLock(key: "x" | "y") {
    const value = coords[key].trim() ? Number(coords[key].replace(",", ".")) : NaN;
    if (!Number.isFinite(value)) { setMessage("Kilitlemek için geçerli bir koordinat girin."); return; }
    setCoordinateLocks(old => ({ ...old, [key]: !old[key] }));
    drawing.setLengthText(""); drawing.setDirectionText("");
  }
  const referenceSources: ReferenceSource[] = [...references.items.filter(i => i.kind === "referenceLine").map(i => ({ id: i.id, name: i.name, a: i.points[0], b: i.points[1] })), ...visibleElements.flatMap(e => e.type === "axis" || (e.type === "beam" || e.type === "wall") && !e.curveSagitta ? [{ id: e.id, name: e.name, a: e.start, b: e.end }] : [])];
  const referenceSource = referenceSources.find(r => r.id === referenceId);
  function placePoint(point: typeof cursor, action?: Parameters<typeof placeStructuralPoint>[1]) {
    if (![point.x, point.y].every(value => Number.isFinite(value) && Math.abs(value) <= 1_000_000)) { setMessage("Geçerli X/Y girin; koordinatlar sonlu ve ±1.000.000 m aralığında olmalıdır."); return; }
    const target = coordinateConstraint(draftingTool && pending.length ? constrainPoint(pending.at(-1)!, point, drawing.lengthLock, drawing.directionLock, drawing.fallbackAngle) : point);
    if (draftingTool) { setCursor(target); drawing.recordPoint(target); references.place(target); } else placeStructuralPoint(target, action);
  }
  function constrainToReference(perpendicular: boolean) {
    if (!referenceSource) return;
    const angle = Math.atan2(referenceSource.b.y - referenceSource.a.y, referenceSource.b.x - referenceSource.a.x) * 180 / Math.PI + (perpendicular ? 90 : 0);
    if (tool === "column") drawing.setAngleLock(angle);
    else { if (tool !== "beam" && tool !== "wall") selectTool("beam"); drawing.setDirectionText(String(angle)); }
    setOrtho(false); setMessage(`Referans doğrultusu ${number(angle, 2)}° kilitlendi. İlk / sonraki noktayı belirtin.`);
  }
  function localReference() { if (referenceSource && references.setFrame({ origin: referenceSource.a, angle: Math.atan2(referenceSource.b.y - referenceSource.a.y, referenceSource.b.x - referenceSource.a.x) * 180 / Math.PI, enabled: true })) setCoordinateMode("local"); }
  function globalReference() { if (references.frame && references.setFrame({ ...references.frame, enabled: false })) setCoordinateMode("xy"); }
  const toolDefaultsKey = JSON.stringify(model.toolDefaults ?? {});
  useEffect(() => {
    const templates = JSON.parse(toolDefaultsKey) as CadModel["toolDefaults"];
    let live = true;
    queueMicrotask(() => { if (!live) return; setDefaults(current => {
      const next = { ...current };
      for (const type of ["column", "beam", "wall", "slab"] as const) {
        const template = templates?.[type];
        next[type] = { ...DEFAULTS[type] };
        if (template) for (const key of ["width", "depth", "height", "thickness"] as const) if (key in template) next[type][key] = Number((template as unknown as Record<string, unknown>)[key]);
      }
      return next;
    }); });
    return () => { live = false; };
  }, [toolDefaultsKey]);

  useEffect(() => {
    // A selection from the lower element list should reveal the new form's heading.
    if (selectedId) inspectorRef.current?.querySelector(".hcad-inspector-content")?.scrollTo({ top: 0 });
  }, [selectedId]);

  // Keep the media breakpoint aligned with the CSS; no model or canvas remounts on a view switch.
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1000px)");
    const sync = () => {
      setIsCompact(query.matches);
      if (!query.matches) {
        setInspectorOpen(false);
        setCoordinatesOpen(true);
      } else {
        setCoordinatesOpen(false);
      }
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // On-screen keyboards shrink visualViewport on mobile even when dvh stays unchanged.
  useEffect(() => {
    const viewport = window.visualViewport;
    const node = rootRef.current;
    if (!viewport || !node) return;
    const update = () => {
      const keyboardVisible = isCompact && document.documentElement.clientHeight - viewport.height > 100;
      if (keyboardVisible) node.style.setProperty("--hcad-visual-height", `${Math.floor(viewport.height)}px`);
      else node.style.removeProperty("--hcad-visual-height");
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      node.style.removeProperty("--hcad-visual-height");
    };
  }, [isCompact]);

  useEffect(() => {
    if (!isCompact || !inspectorOpen) return;
    // The drawer transitions visibility for 180 ms. Delay focus until it becomes
    // keyboard-focusable rather than racing the CSS visibility transition.
    const timer = window.setTimeout(() => {
      if (!inspectorRef.current?.inert) inspectorCloseRef.current?.focus({ preventScroll: true });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [isCompact, inspectorOpen]);

  function closeCompactInspector() {
    setInspectorOpen(false);
    requestAnimationFrame(() => inspectorTriggerRef.current?.focus({ preventScroll: true }));
  }

  function handleInspectorKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!isCompact || !inspectorOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeCompactInspector();
      return;
    }
    if (event.key !== "Tab") return;
    const container = inspectorRef.current;
    if (!container) return;
    const elements = Array.from(container.querySelectorAll<HTMLElement>(
      "button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], summary, [tabindex]:not([tabindex='-1'])"
    )).filter((el) => el.getClientRects().length > 0 && window.getComputedStyle(el).visibility !== "hidden");
    if (!elements.length) return;
    const first = elements[0], last = elements[elements.length - 1];
    if (event.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !container.contains(document.activeElement))) {
      event.preventDefault(); first.focus();
    }
  }

  useEffect(() => {
    let live = true;
    queueMicrotask(() => {
      if (!live) return;
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const restored = validateModel(JSON.parse(saved));
          dispatch({ type: "restore", model: restored }); setDockOpen(!!restored.elements.length || !!restored.drafting?.items.length);
          setFloorId(restored.floors[0].id); setFitKey((n) => n + 1);
          setMessage("Son yerel model geri yüklendi."); setSaveStatus("Tarayıcıda kayıtlı");
        }
      } catch { setMessage("Yerel kayıt okunamadı. Boş çalışma açıldı; yeni bir değişiklik yapana kadar kayıt korunur."); setSaveStatus("Kayıt okunamadı"); }
      setHydrated(true);
    });
    return () => { live = false; };
  }, []);
  useEffect(() => {
    if (!hydrated || !dirty.current) return;
    // Save each committed model before a route change can unmount the editor.
    let status = "Tarayıcıya kaydedildi";
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(model)); }
    catch { status = "Yerel kayıt başarısız; JSON kaydedin"; }
    const timer = setTimeout(() => setSaveStatus(status), 0);
    return () => clearTimeout(timer);
  }, [model, hydrated]);

  function commit(next: CadModel, success: string, propagate = true) {
    try {
      if (propagate && next.floors.length < model.floors.length && next.drafting) { const ids = new Set(next.floors.map(f => f.id)); next = { ...next, drafting: { items: next.drafting.items.filter(i => ids.has(i.floorId)), frames: Object.fromEntries(Object.entries(next.drafting.frames ?? {}).filter(([id]) => ids.has(id))) } }; }
      const valid = validateModel(propagate ? reconcileConnections(next, model) : next);
      dirty.current = true; dispatch({ type: "commit", model: valid }); setMessage(success);
      if (!model.drafting?.items.length && valid.drafting?.items.length) setDockOpen(true);
      return true;
    } catch (error) { setMessage(error instanceof Error ? error.message : "Model geçerli değil."); return false; }
  }
  function selectTool(next: Tool) {
    setCoordinateLocks({ x: false, y: false });
    setTool(next); drawing.clearDraft(); references.clear(); setTab(isDraftingTool(next) ? "Çizimler" : "Giriş");
    setRibbonTab(isDraftingTool(next) ? "Araçlar" : "Betonarme");
    setMessage(
      next === "move" ? "Elemanı seçin, ardından taşıma başlangıcını ve hedefini belirtin."
      : next === "pan" ? "Planı sürükleyin. İki parmakla kaydırma ve yakınlaştırma da kullanılabilir."
      : next === "select" ? "Plandan, 3B görünümden veya eleman listesinden seçim yapın."
      : next === "axis" ? "Aks: Yatay/düşey için tıklayın veya seçeneklerden ölçülü aks sistemi oluşturun. Boşluk tuşu: yön değiştir."
      : `${isDraftingTool(next) ? DRAFTING_NAMES[next] : TYPE_NAMES[next]}: ${next === "column" ? "merkez noktası" : "ilk nokta"} bekleniyor.`
    );
  }
  const selectElement = useCallback((id: string | null) => {
    const element = model.elements.find(e => e.id === id);
    if (element && layerState(model, element.layer, element.floorId).locked) { setMessage("Bu katman kilitli. Katman ayarlarından kilidi çözün."); return; }
    setSelectedId(id); setPending([]);
    if (id) { setPanel("properties"); setDockOpen(true); }
  }, [model, setPending]);
  function deleteSelected() {
    if (!selected) { setMessage("Silmek için önce bir eleman seçin."); return; }
    if (layerState(model, selected.layer, selected.floorId).locked) { setMessage("Kilitli katmandaki eleman silinemez."); return; }
    const removal = removeWithDependents(model, selected.id);
    if (commit(removal.model, `${selected.name} silindi.${removal.count > 1 ? " Bağlı döşeme de kaldırıldı." : ""} Geri al ile tüm işlem döner.`)) { setSelectedId(null); drawing.clearDraft(); references.clear(); }
  }
  function undo() {
    const previous = history.past[history.past.length - 1];
    setDockOpen(true); dirty.current = true; dispatch({ type: "undo" }); drawing.clearDraft(); references.clear();
    setSelectedId(old => old && previous?.elements.some(e => e.id === old) ? old : null);
    setMessage("Son işlem geri alındı.");
  }
  function redo() {
    const next = history.future[0];
    setDockOpen(true); dirty.current = true; dispatch({ type: "redo" }); drawing.clearDraft(); references.clear();
    setSelectedId(old => old && next?.elements.some(e => e.id === old) ? old : null);
    setMessage("İşlem yeniden uygulandı.");
  }
  function cancel() { drawing.clearDraft(); references.clear(); setCoordinateLocks({ x: false, y: false }); setMessage("Geçerli çizim iptal edildi."); }
  function replaceModel(next: CadModel, success: string) {
    if (commit(next, success, false)) { drawing.resetModel(); setCoordinateLocks({ x: false, y: false }); setDefaults(DEFAULTS); setSelectedId(null); drawing.clearDraft(); references.clear(); setFloorId(next.floors[0].id); setHiddenLayers([]); setFitKey((n) => n + 1); }
  }
  async function importFile(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error("JSON dosyası en fazla 5 MB olabilir.");
      const next = validateModel(JSON.parse(await file.text()));
      replaceModel(next, "JSON modeli açıldı. Önceki model Geri al ile geri getirilebilir.");
    } catch (error) { setMessage(`Dosya açılamadı: ${error instanceof Error ? error.message : "Geçersiz JSON"}`); }
    if (fileInput.current) fileInput.current.value = "";
  }
  function exportFile() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(model, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "hsyncad-model.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); setMessage("Model JSON dosyası indirildi.");
  }
  function runCommand() {
    const value = command.trim().toLocaleLowerCase("tr");
    if (value === "sil") deleteSelected();
    else if (value === "geri") undo();
    else if (value === "yinele" || value === "ileri") redo();
    else if (value === "iptal") cancel();
    else if (value === "bitir") { if (draftingTool) references.finish(); else finishSlab(); }
    else {
      const relative = value.startsWith("@"), numeric = relative ? value.slice(1) : value;
      const polar = numeric.includes("<"), values = numeric.split(polar ? /</ : /[;\s]+/).map((v) => v.trim() ? Number(v.replace(",", ".")) : NaN);
      const scale = drawing.unit === "cm" ? 0.01 : 1;
      if (tool === "axis" && values.length === 1 && Number.isFinite(values[0])) drawing.offsetAxis(values[0] * scale);
      else if (values.length === 2 && values.every(Number.isFinite)) {
        const anchor = relative || polar ? coordinateAnchor : { x: 0, y: 0 };
        placePoint(polar ? { x: anchor.x + values[0] * scale * Math.cos(values[1] * Math.PI / 180), y: anchor.y + values[0] * scale * Math.sin(values[1] * Math.PI / 180) } : { x: anchor.x + values[0] * scale, y: anchor.y + values[1] * scale });
      }
      else setMessage(`Komutlar: X Y, @ΔX ΔY, @L<Açı, aks mesafesi, sil, geri, yinele, iptal, bitir. Giriş: ${drawing.unit}.`);
    }
    setCommand("");
  }
  function addFloor() {
    const next = addStorey(model, floor, false);
    if (commit(next.model, `${next.floor.name} eklendi. Boş katta çizime başlayabilirsiniz.`)) { setFloorId(next.floor.id); setSelectedId(null); drawing.clearDraft(); references.clear(); }
  }
  function deleteFloor() {
    const remaining = model.floors.filter(f => f.id !== floor.id);
    if (!remaining.length) return;
    const drafting = model.drafting ? { items: model.drafting.items.filter(item => item.floorId !== floor.id), frames: Object.fromEntries(Object.entries(model.drafting.frames ?? {}).filter(([id]) => id !== floor.id)) } : undefined;
    if (commit({ ...model, floors: remaining, elements: model.elements.filter(e => e.floorId !== floor.id), drafting }, "Kat, elemanları ve ölçüm/referans kayıtları silindi. Geri al ile döner.")) {
      setFloorId(remaining[0].id); setSelectedId(null); drawing.clearDraft(); references.clear(); setCoordinateLocks({ x: false, y: false });
    }
  }
  function copyFloor() {
    const next = addStorey(model, floor, false);
    const copies = copyElementsToFloor(model.elements.filter(e => e.floorId === floor.id), next.floor.id);
    if (commit({ ...next.model, elements: [...model.elements, ...copies], ...(model.drafting ? { drafting: { items: [...model.drafting.items, ...references.items.map(i => ({ ...i, id: crypto.randomUUID(), floorId: next.floor.id }))], frames: { ...model.drafting.frames, ...(references.frame ? { [next.floor.id]: references.frame } : {}) } } } : {}) }, `${copies.length} eleman üst kata kopyalandı.`)) { setFloorId(next.floor.id); setSelectedId(null); drawing.clearDraft(); references.clear(); setFitKey(n => n + 1); }
  }
  const creationDraft = drawing.definition;
  function startElement(type: "column" | "beam" | "wall" | "slab", patch?: Parameters<typeof drawing.patchDefinition>[0], settingsOpen = false) {
    selectTool(type);
    if (patch) drawing.patchToolDefinition(type, patch);
    if (settingsOpen) setSettings("element");
  }
  function chooseRibbon(name: string) {
    setRibbonTab(name);
    setTab(name === "Görüntü" ? "Görünüm" : name === "Ayarlar" ? "Proje" : name === "Araçlar" || name === "Çizimler" ? name : "Giriş");
  }
  function runAnalysis(customSettings?: AnalysisSettings) {
    try {
      const res = runStructuralAnalysis(model, customSettings);
      setAnalysisResult(res);
      setAnalysisOpen(true);
      setMessage(`TBDY 2018 Analizi tamamlandı: W = ${res.totalWeightKn.toFixed(1)} kN, Vt = ${res.baseShearKn.toFixed(1)} kN. ${res.overallPass ? "Tüm tahkikler UYGUN." : "Bazı elemanlarda kapasite aşımı var."}`);
    } catch (err) {
      setMessage(`Analiz hatası: ${err instanceof Error ? err.message : "Hesap yapılamadı"}`);
    }
  }
  function addFooting() {
    if (selected?.type === "column") {
      const next = addPadFootingToColumn(model, selected as ColumnElement);
      commit(next, `${selected.name} altına 1.50×1.50 m tekil temel eklendi.`);
    } else if (selected?.type === "beam") {
      const next = addStripFootingToBeam(model, selected as BeamElement);
      commit(next, `${selected.name} boyunca sürekli temel eklendi.`);
    } else {
      const lowestFloor = [...model.floors].sort((a, b) => a.elevation - b.elevation)[0];
      const columns = model.elements.filter(e => e.type === "column" && e.floorId === lowestFloor.id) as ColumnElement[];
      if (!columns.length) {
        setMessage("Temel eklenecek kolon veya kiriş bulunamadı.");
        return;
      }
      let cur = model;
      for (const col of columns) cur = addPadFootingToColumn(cur, col);
      commit(cur, `${columns.length} adet tekil temel oluşturuldu.`);
    }
  }
  function addStripFooting() {
    if (selected?.type === "beam") {
      const next = addStripFootingToBeam(model, selected as BeamElement);
      commit(next, `${selected.name} boyunca sürekli temel eklendi.`);
    } else {
      const lowestFloor = [...model.floors].sort((a, b) => a.elevation - b.elevation)[0];
      const beams = model.elements.filter(e => e.type === "beam" && e.floorId === lowestFloor.id) as BeamElement[];
      if (!beams.length) {
        setMessage("Sürekli temel için zemin kat kirişi bulunamadı.");
        return;
      }
      let cur = model;
      for (const bm of beams) cur = addStripFootingToBeam(cur, bm);
      commit(cur, `${beams.length} adet sürekli temel oluşturuldu.`);
    }
  }
  function addRaft() {
    const lowestFloor = [...model.floors].sort((a, b) => a.elevation - b.elevation)[0];
    const columns = model.elements.filter(e => e.type === "column" && e.floorId === lowestFloor.id) as ColumnElement[];
    const xs = columns.length ? columns.map(c => c.position.x) : [0, 4];
    const ys = columns.length ? columns.map(c => c.position.y) : [0, 4];
    const minX = Math.min(...xs) - 1.0, maxX = Math.max(...xs) + 1.0;
    const minY = Math.min(...ys) - 1.0, maxY = Math.max(...ys) + 1.0;
    const corners: Point[] = [{ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }];
    const next = addRaftFoundation(model, lowestFloor.id, corners, 0.50);
    commit(next, "Yapı altına 50 cm radye temel plağı eklendi.");
  }
  function addStair() {
    const next = addStairToModel(model, floor.id, { x: 0, y: 0 }, { x: 4.8, y: 0 });
    commit(next, "16 rıhtlı betonarme merdiven oluşturuldu.");
  }
  function exportDxf() {
    downloadDxfFile(model, floor.id);
    setMessage("AutoCAD DXF çizim dosyası (.dxf) indirildi.");
  }
  const ribbonActions: Record<number, RibbonAction> = {
    40122: { run: () => setEditOperation("rotate"), disabled: !selected },
    13230: { run: () => setEditOperation("mirror"), disabled: !selected },
    12490: { run: () => setEditOperation("copy"), disabled: !selected },
    13670: { run: () => setEditOperation("copy"), disabled: !selected },
    13220: { run: () => setEditOperation("offset"), disabled: !selected, partial: true, hint: "Global X/Y ile ötelenmiş kopya; paralel eğri ofseti değil" },
    13090: { run: () => setEditOperation("array"), disabled: !selected },
    [-1]: { run: () => replaceModel(createEmptyModel(), "Yeni boş model açıldı. Önceki model Geri al ile döner.") },
    [-2]: { run: () => replaceModel(createDemoModel(), "4 × 4 m ölçülü örnek açıldı.") },
    [-3]: { run: () => replaceModel(createFeatureDemo(), "Gelişmiş örnek açıldı.") },
    [-4]: { run: () => replaceModel(createWorkflowDemo(), "Bağlı çizim akışı örneği açıldı.") },
    11300: { run: () => fileInput.current?.click() }, 11320: { run: exportFile },
    12590: { run: () => selectTool("axis"), active: tool === "axis" },
    12580: { run: () => selectTool("axis"), hint: "Yeni aks seçeneklerini açar" },
    12671: { run: () => { selectTool("axis"); setAxisOptions(old => ({ ...old, direction: old.direction === "horizontal" ? "vertical" : old.direction === "vertical" ? "free" : "horizontal" })); } },
    12820: { run: () => startElement("column", { section: "rectangle" }), active: tool === "column" && creationDraft?.type === "column" && (creationDraft.section ?? "rectangle") === "rectangle" },
    12840: { run: () => startElement("column", { section: "circle", anchorMode: "center", circleSegments: 40 }), active: creationDraft?.type === "column" && creationDraft.section === "circle" },
    12830: { run: () => startElement("column", { section: "polygon", anchorMode: "defined", sectionPoints: [{ x: -.2, y: -.2 }, { x: .2, y: -.2 }, { x: .2, y: .2 }, { x: -.2, y: .2 }] }), active: creationDraft?.type === "column" && creationDraft.section === "polygon" },
    12890: { run: () => startElement("column", undefined, true) },
    12910: { run: () => startElement("beam"), active: tool === "beam" }, 12920: { run: () => startElement("beam", undefined, true) },
    13810: { run: () => startElement("wall"), active: tool === "wall" }, 13820: { run: () => startElement("wall", undefined, true) },
    12570: { run: () => { startElement("slab"); drawing.changeSlabMode("region"); }, active: tool === "slab" && drawing.slabMode !== "edge" },
    13120: { run: () => startElement("slab", undefined, true) },
    14350: { run: () => { startElement("slab"); drawing.changeSlabMode("edge"); }, active: tool === "slab" && drawing.slabMode === "edge" },
    14610: { run: () => { startElement("slab", undefined, true); drawing.changeSlabMode("edge"); }, partial: true, hint: "Döşeme ayarlarından kenarın kot farkı alınır; bütün alanlar kenarı etkilemez" },
    15700: { run: () => setTab("Katlar"), partial: true, hint: "Aktif kat ayarları; kat seçimi yatay şerittedir" }, 11240: { run: () => setTab("Katlar") }, 12500: { run: copyFloor },
    15163: { run: () => setTab("Proje") }, 13130: { run: () => setSettings("layers") }, 40073: { run: () => setSettings("materials") },
    13600: { run: undo, disabled: !history.past.length }, 13610: { run: redo, disabled: !history.future.length },
    13190: { run: () => selectTool("move"), active: tool === "move" }, 13260: { run: deleteSelected, disabled: !selected },
    13470: { run: () => { setPanel("properties"); setDockOpen(true); }, disabled: !selected },
    13030: { run: () => setFitKey(n => n + 1) }, 13080: { run: () => selectTool("pan"), active: tool === "pan" },
    13583: { run: () => setShowGrid(v => !v), active: showGrid, partial: true, hint: "Izgarayı aç/kapatır; çizim sınırları düzenleyicisi yok" },
    12605: { run: () => setCoordinatesOpen(v => !v), active: coordinatesOpen },
    13660: { run: () => selectTool("measureDistance"), active: tool === "measureDistance" },
    13650: { run: () => selectTool("measureArea"), active: tool === "measureArea" },
    40221: { run: () => selectTool("measureAngle"), active: tool === "measureAngle" },
    11350: { run: () => setSettings("snap") }, 11340: { run: () => setSnapping(v => !v), active: snapping, partial: true, hint: "Genel yakalamayı aç/kapatır; yakalama türlerini ayarlardan seçin" },
    11160: { run: () => setOrtho(v => !v), active: ortho },
    40232: { run: () => selectTool("referencePoint"), partial: true, hint: "Web: tek noktada orijin; dönük sistem için referans doğrusunu Lokal sistem yap" },
    40233: { run: () => { if (references.frame) references.setFrame({ ...references.frame, enabled: !references.frame.enabled }); }, disabled: !references.frame, active: references.frame?.enabled },
    12210: { run: () => setSettings("report") },
    11760: { run: () => runAnalysis() },
    11710: { run: () => { if (!analysisResult) runAnalysis(); setAnalysisOpen(true); } },
    11800: { run: () => runAnalysis() },
    12030: { run: () => { if (!analysisResult) runAnalysis(); setAnalysisOpen(true); } },
    12033: { run: () => { if (!analysisResult) runAnalysis(); setAnalysisOpen(true); } },
    12034: { run: () => { if (!analysisResult) runAnalysis(); setAnalysisOpen(true); } },
    11820: { run: () => setAnalysisViewMode(m => m === "displacement" ? "none" : "displacement"), active: analysisViewMode === "displacement" },
    11840: { run: () => { if (!analysisResult) runAnalysis(); setAnalysisViewMode(m => m === "moment" ? "none" : "moment"); }, active: analysisViewMode === "moment" },
    11839: { run: () => { if (!analysisResult) runAnalysis(); setAnalysisViewMode(m => m === "shear" ? "none" : "shear"); }, active: analysisViewMode === "shear" },
    12109: { run: () => { if (!analysisResult) runAnalysis(); setAnalysisViewMode(m => m === "capacity" ? "none" : "capacity"); }, active: analysisViewMode === "capacity" },
    12079: { run: () => { if (!analysisResult) runAnalysis(); setAnalysisViewMode(m => m === "shear" ? "none" : "shear"); }, active: analysisViewMode === "shear" },
    15736: { run: () => { if (!analysisResult) runAnalysis(); setAnalysisViewMode(m => m === "capacity" ? "none" : "capacity"); }, active: analysisViewMode === "capacity" },
    12710: { run: addFooting },
    12750: { run: addFooting, hint: "Tekil temel parametreleri" },
    12690: { run: addStripFooting },
    12700: { run: addStripFooting, hint: "Sürekli temel parametreleri" },
    12430: { run: addRaft },
    14170: { run: () => startElement("beam", { width: 0.3, height: 0.5 }) },
    14180: { run: () => startElement("beam", { width: 0.3, height: 0.5 }, true) },
    13830: { run: addStair },
    13840: { run: addStair, hint: "Merdiven rıht/basamak parametreleri" },
    13880: { run: () => setAnalysisViewMode("displacement") },
    62790: { run: addStair },
    11330: { run: exportDxf },
    13290: { run: () => selectTool("measureDistance") },
    13270: { run: () => selectTool("measureDistance") },
    13300: { run: () => selectTool("measureDistance") },
    13310: { run: () => selectTool("measureDistance") },
    13381: { run: () => selectTool("measureAngle") },
    40202: { run: () => setPaftaMode(p => !p), active: paftaMode },
    40227: { run: () => setPaftaMode(p => !p), active: paftaMode },
    12000: { run: () => { setFloorId(model.floors[0].id); setPaftaMode(true); } },
    12190: { run: () => setSettings("report") },
    12186: { run: () => setSettings("report") },
    40163: { run: () => setSettings("report") },
    40164: { run: () => setSettings("report") },
    40585: { run: () => { startElement("slab"); drawing.changeSlabMode("region"); } },
    14360: { run: () => { startElement("slab"); drawing.changeSlabMode("region"); }, hint: "Döşeme boşluğu" },
  };
  for (const [id, mode] of [[12098, "perspective"], [12092, "top"], [12093, "bottom"], [12096, "left"], [12097, "right"], [12094, "front"], [12095, "back"], [12195, "iso"]] as const) {
    ribbonActions[id] = { run: () => setViewRequest(old => ({ mode, revision: old.revision + 1 })), active: viewRequest.mode === mode };
  }
  const instruction = draftingTool ? references.instruction : tool === "select" ? "Eleman seçin" : tool === "pan" ? "Görünümü kaydırın" : tool === "move" ? (pending.length ? "Hedef noktası" : "Taşıma başlangıcı") : tool === "column" ? (pending.length ? "Döndürün ve onaylayın · Space: simetri" : "Kolon tutma noktasını sabitleyin") : tool === "slab" ? (drawing.labelDraft ? "Döşeme yazı konumunu belirleyin" : drawing.slabMode === "region" ? "Kapalı alana tıklayın · Ctrl: yazı yerini seç" : drawing.slabMode === "edge" ? (pending.length ? "Kenarın bitiş noktası" : "Kenarın başlangıç noktası") : pending.length + " köşe · Kapalı alan çizin") : tool === "axis" ? (axisOptions.direction === "free" ? (pending.length ? "Aks bitiş noktası" : "Aks başlangıç noktası") : "Aks noktası veya mesafe + Enter") : pending.length ? "Bitiş düğümü · Space: kaçıklık · Shift: dik" : "Başlangıç düğümü";

  return <div ref={rootRef} className={styles.root} data-testid="hsyncad-workbench" data-ready={hydrated} data-cad-theme={cadTheme} tabIndex={-1}
    onPointerDown={(event) => { if ((event.target as HTMLElement).closest("svg[role='img']")) event.currentTarget.focus({ preventScroll: true }); }}
    onKeyDown={(event) => {
      if (event.key === "Escape" && isCompact && inspectorOpen) {
        event.preventDefault();
        closeCompactInspector();
        return;
      }
      if ((event.target as HTMLElement).closest("input,textarea,select")) return;
      if (draftingTool && event.key === "Enter") { event.preventDefault(); references.finish(); return; }
      if (!draftingTool && drawing.handleKey(event)) return;
      if (event.key === " " && tool === "axis") {
        event.preventDefault();
        drawing.clearDraft();
        setAxisOptions((prev) => ({
          ...prev,
          direction: prev.direction === "horizontal" ? "vertical" : prev.direction === "vertical" ? "free" : "horizontal",
        }));
        setMessage("Aks yönü değiştirildi.");
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); }
      if (event.key === "Delete") { event.preventDefault(); deleteSelected(); }
      if (event.key === "Escape") { cancel(); setTool("select"); }
      if (event.key === "Enter" && tool === "slab") finishSlab();
    }}>
    <CommandBar tool={tool} modelName={model.name} floorName={`${floor.name} tavanı, ${number(floor.elevation + floor.height, 2)} m`} saveStatus={saveStatus}
      canUndo={!!history.past.length} canRedo={!!history.future.length} hasSelection={!!selected}
      tab={ribbonTab} onTab={chooseRibbon} actions={ribbonActions} onUndo={undo} onRedo={redo}
      onExport={exportFile} onImport={() => fileInput.current?.click()} />
    <input ref={fileInput} type="file" accept=".json,application/json" hidden aria-label="JSON model dosyası" data-testid="hsyncad-import" onChange={(e) => void importFile(e.target.files?.[0])} />
    <div className={`hcad-ribbon ${tab === "Giriş" && tool === "axis" ? "hcad-ribbon-axis" : tab === "Giriş" && !activeType ? "hcad-ribbon-passive" : ""}`} data-testid="hsyncad-context-bar" aria-label="Etkin araç seçenekleri">
      {tab === "Giriş" && tool !== "axis" && <>
        <div className="hcad-context-title"><span>{activeType ? "Yeni " + TYPE_NAMES[activeType] : tool === "move" ? "Taşı" : tool === "pan" ? "Görünümü kaydır" : "Seçim"}</span><small>{instruction}</small></div>
        {creationDraft ? <DrawingToolbar definition={creationDraft} unit={drawing.unit} onDimension={(key, value) => { if (activeType) setDefaults(old => ({ ...old, [activeType]: { ...old[activeType], [key]: value } })); }} onChange={drawing.patchDefinition} onSettings={() => setSettings("element")} angle={drawing.columnAngle} angleLocked={drawing.angleLocked} onAngle={drawing.setAngleLock} columnRotating={tool === "column" && !!pending.length} onConfirm={() => drawing.confirmColumn()} continuous={drawing.continuous} onContinuous={drawing.setContinuous} lengthText={drawing.lengthText} directionText={drawing.directionText} onLength={drawing.setLengthText} onDirection={drawing.setDirectionText} onClear={() => { drawing.setLengthText(""); drawing.setDirectionText(""); }} slabMode={drawing.slabMode} onSlabMode={drawing.changeSlabMode} levels={drawing.levels} /> : <p className="hcad-context-hint">{instruction}</p>}
      </>}
      {tab === "Giriş" && tool === "axis" && (
      <div className="hcad-axis-options-slot" data-testid="hsyncad-axis-options-slot">
      <AxisOptions
        options={axisOptions}
        unit={drawing.unit}
        offsetDistance={drawing.axisDistance}
        onOffsetDistance={drawing.setAxisDistance}
        onOffset={drawing.offsetAxis}
        onChange={next => { if (next.direction !== axisOptions.direction) drawing.clearDraft(); setAxisOptions(next); }}
        elements={model.elements}
        floorId={floor.id}
        materialId={model.materials[0].id}
        selectedId={selectedId}
        onCreateGrid={(axes) => {
          if (layerState(model, "Akslar", floor.id).locked) { setMessage("Aks katmanı kilitli."); return; }
          if (commit({ ...model, elements: expandAxisFrame([...model.elements, ...axes], floor.id) }, `${axes.length} aks eklendi.`)) {
            setSelectedId(axes.at(-1)?.id ?? null);
            setFitKey((n) => n + 1);
          }
        }}
      />
      </div>
    )}
      {(tab === "Çizimler" || tab === "Araçlar") && <><ReferenceButtons tool={tool} onTool={selectTool} /><ReferenceOptions sources={referenceSources} sourceId={referenceSource?.id ?? ""} onSource={setReferenceId} onDirection={constrainToReference} onLocal={localReference} onGlobal={globalReference} hasFrame={!!references.frame?.enabled} />{tool === "measureArea" && <button type="button" disabled={pending.length < 3} onClick={references.finish} data-testid="finish-measure-area">Alanı tamamla ↵</button>}<span className="hcad-fine">{instruction}</span></>}
      {tab === "Görünüm" && <><button type="button" aria-pressed={showGrid} onClick={() => setShowGrid(!showGrid)}>Izgara göster</button><button type="button" onClick={() => setCadTheme(cadTheme === "light" ? "dark" : "light")}>{cadTheme === "light" ? "Koyu çalışma alanı" : "Açık çalışma alanı"}</button><div className="hcad-ribbon-group"><button type="button" onClick={() => setFitKey((n) => n + 1)}><Maximize2 size={18} />2B çizimi sığdır</button><label className="hcad-toggle"><input type="checkbox" checked={snapping} onChange={(e) => setSnapping(e.target.checked)} />Nokta yakalama</label><label className="hcad-toggle"><input type="checkbox" checked={ortho} onChange={(e) => setOrtho(e.target.checked)} />Dik çizim</label><button type="button" onClick={() => setSettings("snap")}>Yakalama ayarları</button><button type="button" onClick={() => setSettings("layers")}>Katman ayarları</button></div><div className="hcad-ribbon-group hcad-layer-list">{layerOptions.map((layer) => <label key={layer} className="hcad-toggle"><input type="checkbox" checked={!hiddenLayers.includes(layer) && layerState(model, layer, floor.id).visible} onChange={(e) => { setHiddenLayers(old => old.filter(l => l !== layer)); commit(setLayerState(model, layer, { ...layerState(model, layer, floor.id), visible: e.target.checked }, "all", floor.id), "Katman görünürlüğü güncellendi."); }} />{layer}</label>)}</div><p className="hcad-fine">Gizlenen katmanlar metraja dahildir.<br />2B aktif katı, 3B bütün katları gösterir.</p></>}
      {tab === "Katlar" && <><FloorProperties key={JSON.stringify(floor)} floor={floor} onApply={(next) => commit({ ...model, floors: model.floors.map((f) => f.id === next.id ? next : f) }, "Kat güncellendi. Kat tavanına bağlı elemanlar birlikte güncellendi.")} /><button type="button" onClick={addFloor}><Plus size={16} />Yeni kat</button><button type="button" onClick={() => { const next = addStorey(model, floor, true); if (commit(next.model, "Alt kat eklendi.")) { setFloorId(next.floor.id); setSelectedId(null); drawing.clearDraft(); references.clear(); } }}>Aşağı kat ekle</button><button type="button" onClick={copyFloor}>Katı üste kopyala</button><button type="button" disabled={model.floors.length < 2} onClick={deleteFloor}>Katı ve elemanlarını sil</button><p className="hcad-fine">Statik taban: {number(floor.elevation)} m · tavan: {number(floor.elevation + floor.height)} m.<br />Mimari referans: {number(floor.elevation + (floor.architecturalOffset ?? 0))} m; geometrik kotları değiştirmez.</p></>}
      {tab === "Proje" && <><button type="button" onClick={() => replaceModel(createEmptyModel(), "Yeni boş model açıldı. Önceki model Geri al ile geri getirilebilir.")}><Plus size={17} />Yeni model</button><button type="button" data-testid="load-demo" onClick={() => replaceModel(createDemoModel(), "4 × 4 m ölçülü örnek açıldı. Tüm işlemler geri alınabilir.")}><Box size={18} />4 × 4 m örneği aç</button><button type="button" onClick={exportFile}><Download size={17} />JSON kaydet</button><p className="hcad-fine">Model bu tarayıcıda otomatik saklanır.<br />Kalıcı yedek için JSON dosyası indirin.</p></>}
      {tab === "Proje" && <button type="button" onClick={() => setSettings("materials")}>Malzeme tanımları</button>}
      {tab === "Proje" && <button type="button" data-testid="load-feature-demo" onClick={() => replaceModel(createFeatureDemo(), "Gelişmiş örnek açıldı. Daire/poligon/eğik kolon, eğrisel perde ve eğimli katmanlı döşemeyi seçerek inceleyin.")}>Gelişmiş örneği aç</button>}
      {tab === "Proje" && <button type="button" data-testid="load-workflow-demo" onClick={() => replaceModel(createWorkflowDemo(), "Bağlı örnek açıldı. Bir aksı taşıyınca kolonlar, kirişler, orta perde ve döşeme sınırları birlikte güncellenir.")}>Çizim akışı örneği</button>}
    </div>
    {editOperation && <SettingsDialog title="Seçili elemanı düzenle" onClose={() => setEditOperation(null)}><EditDialog operation={editOperation} onApply={(dx, dy, angle, count) => { if (!selected) return; try { if (layerState(model, selected.layer, selected.floorId).locked) throw new Error("Katman kilitli."); const changed = editElement(selected, editOperation, dx, dy, angle, count); const replace = editOperation === "rotate" || editOperation === "mirror"; if (commit({ ...model, elements: replace ? model.elements.map(e => e.id === selected.id ? changed[0] : e) : [...model.elements, ...changed] }, "Düzenleme uygulandı; geri alınabilir.")) setEditOperation(null); } catch (error) { setMessage(error instanceof Error ? error.message : "Düzenleme uygulanamadı."); } }} /></SettingsDialog>}
    {analysisOpen && <SettingsDialog title="TBDY 2018 Yapı Analizi ve Betonarme Tasarım" onClose={() => setAnalysisOpen(false)}>
      <AnalysisDialog model={model} result={analysisResult} onRun={runAnalysis} onClose={() => setAnalysisOpen(false)} onSetViewMode={setAnalysisViewMode} />
    </SettingsDialog>}
    {settings && <SettingsDialog title={{ element: `${creationDraft ? TYPE_NAMES[creationDraft.type] : "Eleman"} oluşturma ayarları`, snap: "Yakalama ve düğüm ayarları", layers: "Katman ayarları", materials: "Malzeme tanımları", report: "Metraj raporu" }[settings]} onClose={() => setSettings(null)}>
      {settings === "element" && creationDraft && <ElementProperties creation element={creationDraft} model={model} onDelete={() => {}} onApply={next => { if (!isSolidElement(next)) return; if (commit({ ...model, toolDefaults: { ...model.toolDefaults, [next.type]: next } }, "Eleman varsayılanları kaydedildi. Sonraki yerleştirmelerde uygulanır.")) { drawing.clearOverrides(next.type); setSettings(null); } }} />}
      {settings === "snap" && <SnapOptions model={model} onApply={commit} />}
      {settings === "layers" && <LayerOptions model={model} floor={floor} onApply={commit} />}
      {settings === "materials" && <MaterialOptions model={model} onApply={commit} />}
      {settings === "report" && <QuantityReport model={model} junctions={junctions} />}
      <p role="status" className="hcad-fine">{message}</p>
    </SettingsDialog>}
    <div className="hcad-icon-strip" aria-label="Hızlı çizim araçları"><button type="button" title="Seç" aria-label="Hızlı seç" onClick={() => selectTool("select")}><MousePointer2 size={15} /></button><button type="button" title="Kaydır" aria-label="Hızlı kaydır" onClick={() => selectTool("pan")}><Hand size={15} /></button><button type="button" title="Çizimi sığdır" aria-label="Hızlı sığdır" onClick={() => setFitKey(n => n + 1)}><Maximize2 size={15} /></button><i /><ReferenceButtons compact tool={tool} onTool={selectTool} /><i /><button type="button" title="Yakalama ayarları" aria-label="Hızlı yakalama ayarları" onClick={() => setSettings("snap")}><Move size={15} /></button><button type="button" title="Katman ayarları" aria-label="Hızlı katman ayarları" onClick={() => setSettings("layers")}><Layers size={15} /></button><button type="button" aria-label="Koordinat kutusu" title="Koordinat kutusunu aç / kapat" aria-pressed={coordinatesOpen} onClick={() => setCoordinatesOpen(v => !v)}><Move size={15} /></button>    <div className="hcad-menu-row">
      <div className="hcad-workspace-bar">
      <div className="hcad-compact-switch" role="group" aria-label="CAD çalışma görünümü">
        <button type="button" data-testid="hsyncad-view-2d" aria-pressed={compactView === "2d"} className={compactView === "2d" ? "active" : ""} onClick={() => setCompactView("2d")}>2B</button>
        <button type="button" data-testid="hsyncad-view-3d" aria-pressed={compactView === "3d"} className={compactView === "3d" ? "active" : ""} onClick={() => setCompactView("3d")}>3B</button>
        <button type="button" ref={inspectorTriggerRef} data-testid="hsyncad-inspector-toggle" aria-controls="hsyncad-compact-inspector" aria-expanded={inspectorOpen} aria-label="Metraj ve özellikler panelini aç" onClick={() => setInspectorOpen(true)}><Layers size={14} />{panel === "quantities" ? "Metraj" : "Özellikler"}</button>
      </div>
      <div><label><span className="sr-only">Çizim giriş birimi</span><select aria-label="Çizim giriş birimi" value={drawing.unit} onChange={e => changeDrawingUnit(e.target.value as "m" | "cm")}><option value="m">Giriş: m</option><option value="cm">Giriş: cm</option></select></label></div><div><span className="hcad-section-eyebrow">Kat</span><label><span className="sr-only">Aktif kat</span><select data-testid="active-floor" value={floor.id} onChange={(e) => { setFloorId(e.target.value); setSelectedId(null); drawing.clearDraft(); references.clear(); setCoordinateLocks({ x: false, y: false }); }}>{model.floors.map((f) => <option key={f.id} value={f.id}>{f.name} · +{number(f.elevation, 2)} m</option>)}</select></label></div><div className="hcad-workspace-tools"><button type="button" className={snapping ? "active" : ""} aria-pressed={snapping} onClick={() => setSnapping(!snapping)} data-testid="snap-toggle">Yakalama {snapping ? "açık" : "kapalı"}</button><button type="button" className={ortho ? "active" : ""} aria-pressed={ortho} onClick={() => setOrtho(!ortho)}>Dik çizim</button><label><span className="sr-only">Izgara aralığı</span><select aria-label="Izgara aralığı" value={gridStep} onChange={(e) => setGridStep(Number(e.target.value))}><option value={0.1}>Izgara 0,10 m</option><option value={0.25}>Izgara 0,25 m</option><option value={0.5}>Izgara 0,50 m</option><option value={1}>Izgara 1,00 m</option></select></label></div></div>
    </div>
</div>
    <div className="hcad-body" data-inspector-open={dockOpen}>
      <nav className="hcad-side-tools" aria-label="Dikey çizim araçları">{[{ id: "select", name: "Seç", Icon: MousePointer2 }, { id: "move", name: "Taşı", Icon: Move }, { id: "pan", name: "Kaydır", Icon: Hand }].map(({ id, name, Icon }) => <button type="button" key={id} data-testid={`tool-${id}`} title={name} aria-label={name} className={tool === id ? "active" : ""} onClick={() => selectTool(id as Tool)}><Icon size={19} /><small>{name}</small></button>)}<button type="button" className="hcad-mobile-history" aria-label="Geri al" title="Geri al" disabled={!history.past.length} onClick={undo}><Undo2 size={17} /></button><button type="button" className="hcad-mobile-history" aria-label="Yinele" title="Yinele" disabled={!history.future.length} onClick={redo}><Redo2 size={17} /></button><span className="hcad-toolbar-rule" /><button type="button" aria-label="Seçili elemanı sil" title="Sil (Delete)" onClick={deleteSelected} disabled={!selected}><Trash2 size={18} /><small>Sil</small></button><button type="button" aria-label="Çizimi iptal et" title="İptal (Esc)" onClick={cancel} disabled={!pending.length}><X size={18} /><small>İptal</small></button><button type="button" aria-label="Çizimi sığdır" title="Çizimi sığdır" onClick={() => setFitKey((n) => n + 1)}><Maximize2 size={18} /><small>Sığdır</small></button></nav>
      <div className="hcad-views" data-active-view={compactView}><div className="hcad-plan-wrap">
        <button type="button" className="hcad-coordinate-toggle" data-testid="hsyncad-coordinate-toggle" aria-controls="hsyncad-coordinate-form" aria-expanded={coordinatesOpen} onClick={() => setCoordinatesOpen((open) => !open)}><Move size={13} />X/Y</button><Plan2D coordinateConstraint={coordinateConstraint} elements={visibleElements} tool={tool} selectedId={selectedId} pending={pending} snapping={snapping} snapSettings={model.snap ?? DEFAULT_SNAP} lockedLayers={layerOptions.filter(l => layerState(model, l, floor.id).locked)} layerColors={Object.fromEntries((model.layers ?? []).map(l => [l.name, l.color]))} ortho={ortho} gridStep={gridStep} fitKey={fitKey} preview={drawing.preview} unit={drawing.unit} lengthLock={drawing.lengthLock} angleLock={drawing.directionLock} fallbackAngle={drawing.fallbackAngle} regionPicking={tool === "slab" && drawing.slabMode === "region"} draftingItems={references.items} referenceFrame={references.frame} showGrid={showGrid} onPoint={placePoint} onSelect={selectElement} onCursor={(p, label) => { setCursor(p); setSnapLabel(label); }} onZoom={setZoom} analysisResult={analysisResult} analysisViewMode={analysisViewMode} paftaMode={paftaMode} />
        {coordinatesOpen && <NativeCoordinateBox coords={coords} onCoords={setCoords} mode={coordinateMode} onMode={changeCoordinateMode} unit={drawing.unit}
          cursor={cursor} anchor={coordinateAnchor} elevation={floor.elevation + floor.height} compactOpen={coordinatesOpen} hasLocalFrame={!!references.frame?.enabled}
          xLocked={coordinateLocks.x} yLocked={coordinateLocks.y} onToggleX={() => toggleCoordinateLock("x")} onToggleY={() => toggleCoordinateLock("y")}
          lengthText={drawing.lengthText} directionText={drawing.directionText}
          onLength={value => { setCoordinateLocks({ x: false, y: false }); drawing.setLengthText(value); }}
          onDirection={value => { setCoordinateLocks({ x: false, y: false }); drawing.setDirectionText(value); }}
          onToggleLength={() => { setCoordinateLocks({ x: false, y: false }); drawing.setLengthText(drawing.lengthText ? "" : String(Math.hypot(cursor.x - coordinateAnchor.x, cursor.y - coordinateAnchor.y) * (drawing.unit === "cm" ? 100 : 1))); }}
          onToggleDirection={() => { setCoordinateLocks({ x: false, y: false }); drawing.setDirectionText(drawing.directionText ? "" : String(Math.atan2(cursor.y - coordinateAnchor.y, cursor.x - coordinateAnchor.x) * 180 / Math.PI)); }}
          onClose={() => setCoordinatesOpen(false)}
          onSubmit={() => { const scale = drawing.unit === "cm" ? .01 : 1; const x = coords.x.trim() ? Number(coords.x.replace(",", ".")) * scale : NaN, y = coords.y.trim() ? Number(coords.y.replace(",", ".")) * (coordinateMode === "polar" ? 1 : scale) : NaN; placePoint(coordinateMode === "local" ? localToWorld({ x, y }, references.frame) : coordinateMode === "xy" ? { x, y } : coordinateMode === "relative" ? { x: coordinateAnchor.x + x, y: coordinateAnchor.y + y } : { x: coordinateAnchor.x + x * Math.cos(y * Math.PI / 180), y: coordinateAnchor.y + x * Math.sin(y * Math.PI / 180) }); }}
          style={{ left: "clamp(8px, " + coordinatePosition.x + "px, calc(100% - 230px))", top: "clamp(30px, " + coordinatePosition.y + "px, calc(100% - 140px))" }}
          headerDragProps={{ onPointerDown: e => { if (e.button !== 0) return; const box = e.currentTarget.parentElement!.getBoundingClientRect(); coordinateDragRef.current = { x: e.clientX - box.left, y: e.clientY - box.top }; e.currentTarget.setPointerCapture(e.pointerId); e.preventDefault(); }, onPointerMove: e => { if (!coordinateDragRef.current) return; const box = e.currentTarget.closest(".hcad-plan-wrap")!.getBoundingClientRect(); setCoordinatePosition({ x: Math.max(8, e.clientX - box.left - coordinateDragRef.current.x), y: Math.max(30, e.clientY - box.top - coordinateDragRef.current.y) }); }, onPointerUp: () => { coordinateDragRef.current = null; }, onPointerCancel: () => { coordinateDragRef.current = null; } }} />}
        {tool === "slab" && drawing.slabMode === "polygon" && pending.length > 0 && <button type="button" className="hcad-finish-slab" data-testid="finish-slab" disabled={pending.length < 3} onClick={finishSlab}><Check size={16} />Döşemeyi tamamla ({pending.length})</button>}
        {tool === "column" && pending.length > 0 && <button type="button" className="hcad-finish-slab" data-testid="confirm-column-floating" onClick={() => drawing.confirmColumn()}><Check size={16} />Kolonu onayla</button>}
      </div><Scene3D viewRequest={viewRequest} light={cadTheme === "light"} model={model} fitKey={fitKey} selectedId={selectedId} onSelect={selectElement} hiddenLayers={hiddenLayers} junctions={junctions} analysisResult={analysisResult} analysisViewMode={analysisViewMode} /></div>
      {isCompact && inspectorOpen && <div className="hcad-inspector-backdrop" data-testid="hsyncad-inspector-backdrop" aria-hidden="true" onClick={closeCompactInspector} />}
      <aside ref={inspectorRef} id="hsyncad-compact-inspector" className="hcad-inspector" data-open={inspectorOpen} inert={isCompact && !inspectorOpen} role={isCompact && inspectorOpen ? "dialog" : undefined} aria-modal={isCompact && inspectorOpen ? true : undefined} aria-label={isCompact && inspectorOpen ? "Metraj ve özellikler" : undefined} onKeyDown={handleInspectorKeyDown}>
        <div className="hcad-inspector-drawer-header"><strong>Metraj / Özellikler</strong><button type="button" ref={inspectorCloseRef} data-testid="hsyncad-inspector-close" onClick={closeCompactInspector} aria-label="Paneli kapat"><X size={17} /></button></div>
        <div className="hcad-inspector-tabs"><button type="button" className={panel === "quantities" ? "active" : ""} onClick={() => setPanel("quantities")}><Ruler size={14} />Metraj</button><button type="button" className={panel === "properties" ? "active" : ""} onClick={() => setPanel("properties")}><MousePointer2 size={14} />Özellikler</button></div>
        <div className="hcad-inspector-content"><ReferenceRecords items={references.items} unit={drawing.unit} onDelete={references.remove} onSource={id => { references.setSelectedId(id); setReferenceId(id); }} />{panel === "quantities" ? <><div className="hcad-panel-heading"><span className="hcad-section-eyebrow">ANLIK METRAJ</span><span className="hcad-live"><i />Canlı</span></div><div className="hcad-metric"><span>Beton hacmi · {quantities.netVolume === null ? "hesaplanamadı" : "net"}</span><div><strong data-testid="quantity-net">{number(quantities.netVolume)}</strong><span>m³</span></div><small>Tüm katlar · {model.elements.filter(isSolidElement).length} yapı elemanı</small></div><div className="hcad-metric hcad-metric-secondary"><span>Kalıp alanı · brüt</span><div><strong data-testid="quantity-formwork">{number(quantities.formwork, 2)}</strong><span>m²</span></div></div><table className="hcad-quantity-table"><caption>Eleman tipine göre metraj</caption><thead><tr><th>Eleman</th><th>Adet</th><th>{quantities.netVolume === null ? "— m³" : "Net m³"}</th><th>Kalıp m²</th></tr></thead><tbody>{quantities.rows.map((row) => <tr key={row.type} data-testid={`quantity-${row.type}`}><td><i style={{ background: TYPE_COLORS[row.type] }} />{TYPE_NAMES[row.type]}</td><td>{row.count}</td><td>{number(row.netVolume)}</td><td>{number(row.formwork, 2)}</td></tr>)}</tbody></table><div className="hcad-deduction"><span>Brüt hacim <b>{number(quantities.grossVolume)} m³</b></span><span>Çakışma düşümü <b data-testid="quantity-overlap">−{number(quantities.overlapVolume)} m³</b></span></div><details className="hcad-assumptions"><summary>Hesap kabulleri</summary>{quantities.assumptions.map((text, i) => <p key={i}>{text}</p>)}</details><button type="button" data-testid="hsyncad-report-open" onClick={() => setSettings("report")}>Ayrıntılı metraj raporu</button>{quantities.warnings.map((text, i) => <p className="hcad-warning" key={i}>{text}</p>)}<p className="hcad-scope-note">Geometrik modelleme ve metraj MVP’si. Statik / deprem hesabı ve mevzuata uygunluk kontrolü içermez.</p></> : <ElementProperties element={selected && !layerState(model, selected.layer, selected.floorId).locked ? selected : undefined} model={model} onApply={(next) => commit({ ...model, elements: model.elements.map((e) => e.id === next.id ? next : e) }, `${next.name} güncellendi.`)} onDelete={deleteSelected} />}
        <details className="hcad-element-list"><summary><Layers size={13} />Elemanlar ({model.elements.length})</summary>{model.elements.map((e) => <button type="button" key={e.id} data-testid={`element-${e.name}`} className={selectedId === e.id ? "active" : ""} onClick={() => { selectElement(e.id); setFloorId(e.floorId); setTool("select"); }}><i style={{ background: TYPE_COLORS[e.type] }} /><b>{e.name}</b><span>{TYPE_NAMES[e.type]}</span><small>{model.floors.find((f) => f.id === e.floorId)?.name}</small></button>)}{!model.elements.length && <p className="hcad-fine">Henüz eleman yok.</p>}</details></div>
      </aside>
      <nav className="hcad-dock-rail" aria-label="Sağ araç panelleri"><button type="button" data-testid="desktop-inspector-toggle" title="Metraj / Özellikler paneli" aria-label="Metraj panelini aç / kapat" aria-expanded={dockOpen} onClick={() => setDockOpen(!dockOpen)}><Layers size={16} /><span>Metraj / Özellikler</span></button><button type="button" title="Katmanlar" aria-label="Sağ katman ayarları" onClick={() => setSettings("layers")}><Eye size={16} /></button><button type="button" title="Metraj raporu" aria-label="Sağ metraj raporu" onClick={() => setSettings("report")}><Ruler size={16} /></button></nav>
    </div>
    <div className="hcad-command"><ChevronRight size={16} /><label htmlFor="hcad-command">Komut</label><form onSubmit={(e) => { e.preventDefault(); runCommand(); }}><input id="hcad-command" data-testid="hsyncad-command" autoComplete="off" value={command} onChange={(e) => setCommand(e.target.value)} placeholder={`${instruction} · Koordinat: 4 0 · sil / geri / iptal / bitir`} /><button type="submit" aria-label="Komutu çalıştır">↵</button></form></div>
    <div className="hcad-feedback-row">
    <div className="hcad-message" role="status" data-testid="hsyncad-message"><span className="hcad-live"><i /></span>{message}</div>
    <div className="hcad-bottom-help"><span><RotateCcw size={13} />Ctrl+Z: geri al · Delete: sil · Esc: iptal</span><button type="button" onClick={() => replaceModel(createDemoModel(), "4 × 4 m örnek açıldı. Önceki model Geri al ile geri getirilebilir.")}>Ölçülü örnekle başla <ChevronRight size={14} /></button></div>
    </div>
    <footer className="hcad-statusbar"><span><Eye size={12} />{snapLabel}</span><span>{floor.name} · {visibleElements.length} eleman</span><span>X {number(cursor.x, 2)} <b>Y {number(cursor.y, 2)}</b></span><span className="hcad-unit">Birim: <b>m · Giriş: {drawing.unit}</b></span><span data-testid="hsyncad-zoom">Yakınlaştırma: %{zoom}</span></footer>
  </div>;
}
