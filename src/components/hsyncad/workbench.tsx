"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type KeyboardEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Box, Check, ChevronRight, Columns3, Download, Eye, Grid2X2, Hand, Layers, Maximize2, MousePointer2, Move, Plus, Redo2, RotateCcw, Ruler, Save, Square, Trash2, Undo2, Upload, X } from "lucide-react";
import { createDemoModel, createEmptyModel, validateModel, translateElement, type CadElement, type CadModel, type Point } from "@/lib/hsyncad/model";
import { elementFootprint } from "@/lib/hsyncad/geometry";
import { calculateQuantities } from "@/lib/hsyncad/quantities";
import { resolveJunctions } from "@/lib/hsyncad/junctions";
import { createAxisElement, type AxisDrawingOptions } from "@/lib/hsyncad/axes";
import AxisOptions from "./axis-options";
import { distance, historyReducer, initialHistory, LAYERS, TYPE_COLORS, TYPE_LAYERS, TYPE_NAMES, type Tool } from "./editor-state";
import { ElementProperties, FloorProperties, NumberField } from "./properties";
import Plan2D from "./plan2d";
import styles from "./workbench.module.css";

const Scene3D = dynamic(() => import("./scene3d"), { ssr: false, loading: () => <div className="hcad-loading">3B görünüm hazırlanıyor…</div> });
const STORAGE_KEY = "hsyncad.model.v1";
const TOOLS = [
  { id: "axis", name: "Aks", Icon: Grid2X2, detail: "İki nokta" },
  { id: "column", name: "Kolon", Icon: Columns3, detail: "Merkez noktası" },
  { id: "beam", name: "Kiriş", Icon: Ruler, detail: "İki nokta" },
  { id: "wall", name: "Perde", Icon: Square, detail: "İki nokta" },
  { id: "slab", name: "Döşeme", Icon: Layers, detail: "Kapalı alan" },
] as const;
const number = (value: number | null | undefined, digits = 3) => value == null ? "—" : value.toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
type Dimensions = { width: number; depth: number; height: number; thickness: number };
const DEFAULTS: Record<CadElement["type"], Dimensions> = {
  axis: { width: 0.4, depth: 0.4, height: 3, thickness: 0.2 },
  column: { width: 0.4, depth: 0.4, height: 3, thickness: 0.2 },
  beam: { width: 0.25, depth: 0.5, height: 0.5, thickness: 0.2 },
  wall: { width: 0.2, depth: 0.2, height: 3, thickness: 0.2 },
  slab: { width: 0.2, depth: 0.2, height: 3, thickness: 0.15 },
};

export default function HsynCadWorkbench() {
  const [history, dispatch] = useReducer(historyReducer, undefined, initialHistory);
  const model = history.present;
  const [tool, setTool] = useState<Tool>("select");
  const [tab, setTab] = useState("Giriş");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [floorId, setFloorId] = useState(model.floors[0].id);
  const [pending, setPending] = useState<Point[]>([]);
  const [defaults, setDefaults] = useState(DEFAULTS);
  const [axisOptions, setAxisOptions] = useState<AxisDrawingOptions>({ direction: "horizontal", name: "", extension: 1, labelSide: "both" });
  const [snapping, setSnapping] = useState(true);
  const [ortho, setOrtho] = useState(false);
  const [gridStep, setGridStep] = useState(0.25);
  const [hiddenLayers, setHiddenLayers] = useState<string[]>([]);
  const [cursor, setCursor] = useState<Point>({ x: 0, y: 0 });
  const [snapLabel, setSnapLabel] = useState("Hazır");
  const [coords, setCoords] = useState({ x: "0", y: "0" });
  const [command, setCommand] = useState("");
  const [message, setMessage] = useState("Bir araç seçin veya ölçülü örneği açın.");
  const [saveStatus, setSaveStatus] = useState("Yerel çalışma");
  const [hydrated, setHydrated] = useState(false);
  const dirty = useRef(false);
  const [zoom, setZoom] = useState(100);
  const [fitKey, setFitKey] = useState(0);
  const [panel, setPanel] = useState<"quantities" | "properties">("quantities");
  const [isCompact, setIsCompact] = useState(false);
  const [compactView, setCompactView] = useState<"2d" | "3d">("2d");
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [coordinatesOpen, setCoordinatesOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inspectorTriggerRef = useRef<HTMLButtonElement>(null);
  const inspectorCloseRef = useRef<HTMLButtonElement>(null);
  const inspectorRef = useRef<HTMLElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const floor = model.floors.find((f) => f.id === floorId) ?? model.floors[0];
  const selected = model.elements.find((e) => e.id === selectedId);
  const visibleElements = useMemo(() => model.elements.filter((e) => e.floorId === floor.id && !hiddenLayers.includes(e.layer)), [model.elements, floor.id, hiddenLayers]);
  const junctions = useMemo(() => resolveJunctions(model), [model]);
  const quantities = useMemo(() => calculateQuantities(model, junctions), [model, junctions]);
  const activeType = TOOLS.some((t) => t.id === tool) ? tool as CadElement["type"] : null;
  const dimensions = activeType ? defaults[activeType] : null;
  const layerOptions = [...new Set([...LAYERS, ...model.elements.map((e) => e.layer)])];

  // Keep the media breakpoint aligned with the CSS; no model or canvas remounts on a view switch.
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1000px)");
    const sync = () => {
      setIsCompact(query.matches);
      if (!query.matches) setInspectorOpen(false);
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
          dispatch({ type: "restore", model: restored });
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

  function commit(next: CadModel, success: string) {
    try {
      const valid = validateModel(next);
      dirty.current = true; dispatch({ type: "commit", model: valid }); setMessage(success);
      return true;
    } catch (error) { setMessage(error instanceof Error ? error.message : "Model geçerli değil."); return false; }
  }
  function selectTool(next: Tool) {
    setTool(next); setPending([]); setTab("Giriş");
    setMessage(
      next === "move" ? "Elemanı seçin, ardından taşıma başlangıcını ve hedefini belirtin."
      : next === "pan" ? "Planı sürükleyin. İki parmakla kaydırma ve yakınlaştırma da kullanılabilir."
      : next === "select" ? "Plandan, 3B görünümden veya eleman listesinden seçim yapın."
      : next === "axis" ? "Aks: Yatay/düşey için tıklayın veya seçeneklerden ölçülü aks sistemi oluşturun. Boşluk tuşu: yön değiştir."
      : `${TYPE_NAMES[next]}: ${next === "column" ? "merkez noktası" : "ilk nokta"} bekleniyor.`
    );
  }
  const selectElement = useCallback((id: string | null) => {
    setSelectedId(id); setPending([]);
    if (id) setPanel("properties");
  }, []);
  function deleteSelected() {
    if (!selected) { setMessage("Silmek için önce bir eleman seçin."); return; }
    if (commit({ ...model, elements: model.elements.filter((e) => e.id !== selected.id) }, `${selected.name} silindi. Geri al ile döndürebilirsiniz.`)) { setSelectedId(null); setPending([]); }
  }
  function undo() { dirty.current = true; dispatch({ type: "undo" }); setPending([]); setSelectedId(null); setMessage("Son işlem geri alındı."); }
  function redo() { dirty.current = true; dispatch({ type: "redo" }); setPending([]); setSelectedId(null); setMessage("İşlem yeniden uygulandı."); }
  function cancel() { setPending([]); setMessage("Geçerli çizim iptal edildi."); }
  function addElement(points: Point[]) {
    if (!activeType) return;
    const d = defaults[activeType];
    const count = model.elements.filter((e) => e.type === activeType).length;
    const prefix = { axis: "A", column: "S", beam: "K", wall: "P", slab: "D" }[activeType];
    let sequence = count + 1;
    while (model.elements.some((e) => e.name === `${prefix}${sequence}`)) sequence++;
    const common = { id: crypto.randomUUID(), name: `${prefix}${sequence}`, floorId: floor.id, materialId: model.materials[0].id, layer: TYPE_LAYERS[activeType] };
    let element: CadElement;
    if (activeType === "column") element = { ...common, type: "column", position: points[0], width: d.width, depth: d.depth, height: d.height };
    else if (activeType === "slab") element = { ...common, type: "slab", points, thickness: d.thickness };
    else if (activeType === "beam") element = { ...common, type: "beam", start: points[0], end: points[1], width: d.width, height: d.height };
    else if (activeType === "wall") element = { ...common, type: "wall", start: points[0], end: points[1], thickness: d.thickness, height: d.height };
    else {
      try {
        const axis = createAxisElement({
          start: points[0],
          end: points[1],
          direction: axisOptions.direction,
          name: axisOptions.name.trim() || undefined,
          extension: axisOptions.extension,
          labelSide: axisOptions.labelSide,
          floorId: floor.id,
          materialId: model.materials[0].id,
        }, model.elements);
        if (commit({ ...model, elements: [...model.elements, axis] }, `${axis.name} eklendi. Yeni aks için devam edebilirsiniz.`)) {
          setPending([]); setSelectedId(axis.id); setHiddenLayers((layers) => layers.filter((l) => l !== axis.layer));
        }
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Aks eklenemedi.");
      }
      return;
    }
    if (commit({ ...model, elements: [...model.elements, element] }, `${element.name} eklendi. Yeni ${TYPE_NAMES[element.type].toLocaleLowerCase("tr")} için devam edebilirsiniz.`)) {
      setPending([]); setSelectedId(element.id); setHiddenLayers((layers) => layers.filter((l) => l !== element.layer));
    }
  }
  function finishSlab() {
    if (tool !== "slab" || pending.length < 3) { setMessage("Döşemeyi kapatmak için en az üç ayrı nokta gerekir."); return; }
    addElement(pending);
  }
  function placePoint(point: Point) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) { setMessage("Geçerli X ve Y koordinatları girin."); return; }
    if (tool === "select" || tool === "pan") { setMessage("Nokta yerleştirmek için Aks, Kolon, Kiriş, Perde veya Döşeme seçin."); return; }
    if (tool === "move") {
      if (!selected) { setMessage("Önce taşıyacağınız elemanı seçin."); return; }
      if (!pending.length) { setPending([point]); setMessage("Taşıma hedef noktasını belirtin."); return; }
      const moved = translateElement(selected, { x: point.x - pending[0].x, y: point.y - pending[0].y });
      if (commit({ ...model, elements: model.elements.map((e) => e.id === selected.id ? moved : e) }, `${selected.name} taşındı.`)) setPending([]);
      return;
    }
    if (tool === "axis" && (axisOptions.direction === "horizontal" || axisOptions.direction === "vertical")) {
      const onFloor = model.elements.filter((e) => e.floorId === floor.id);
      const points = onFloor.flatMap((e) => e.type === "axis" ? [e.start, e.end] : elementFootprint(e));
      let start: Point, end: Point;
      if (axisOptions.direction === "horizontal") {
        const xs = points.map((p) => p.x);
        const minX = xs.length ? Math.min(...xs) - 1 : point.x - 5;
        const maxX = xs.length ? Math.max(...xs) + 1 : point.x + 5;
        start = { x: minX === maxX ? point.x - 5 : minX, y: point.y };
        end = { x: minX === maxX ? point.x + 5 : maxX, y: point.y };
      } else {
        const ys = points.map((p) => p.y);
        const minY = ys.length ? Math.min(...ys) - 1 : point.y - 5;
        const maxY = ys.length ? Math.max(...ys) + 1 : point.y + 5;
        start = { x: point.x, y: minY === maxY ? point.y - 5 : minY };
        end = { x: point.x, y: minY === maxY ? point.y + 5 : maxY };
      }
      try {
        const axis = createAxisElement({
          start, end, direction: axisOptions.direction,
          name: axisOptions.name.trim() || undefined,
          extension: axisOptions.extension,
          labelSide: axisOptions.labelSide,
          floorId: floor.id,
          materialId: model.materials[0].id,
        }, model.elements);
        if (commit({ ...model, elements: [...model.elements, axis] }, `${axis.name} aksı eklendi.`)) {
          setSelectedId(axis.id);
          setFitKey((n) => n + 1);
        }
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Aks eklenemedi.");
      }
      return;
    }
    if (tool === "column") { addElement([point]); return; }
    if (tool === "slab") {
      if (pending.length >= 3 && distance(point, pending[0]) < 0.08) { finishSlab(); return; }
      if (pending.some((p) => distance(p, point) < 1e-6)) { setMessage("Farklı bir köşe seçin veya Döşemeyi tamamla düğmesini kullanın."); return; }
      setPending([...pending, point]); setMessage(`${pending.length + 1} köşe. Son köşeden sonra “Döşemeyi tamamla” veya Enter.`); return;
    }
    if (!pending.length) { setPending([point]); setMessage("İkinci noktayı belirtin."); }
    else addElement([pending[0], point]);
  }
  function replaceModel(next: CadModel, success: string) {
    if (commit(next, success)) { setSelectedId(null); setPending([]); setFloorId(next.floors[0].id); setHiddenLayers([]); setFitKey((n) => n + 1); }
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
    else if (value === "iptal") cancel();
    else if (value === "bitir") finishSlab();
    else {
      const values = value.split(/[;\s]+/).map((v) => Number(v.replace(",", ".")));
      if (values.length === 2 && values.every(Number.isFinite)) placePoint({ x: values[0], y: values[1] });
      else setMessage("Komutlar: X Y (ör. 4 0), sil, geri, iptal, bitir. Tüm ölçüler metre.");
    }
    setCommand("");
  }
  function addFloor() {
    const top = Math.max(...model.floors.map((f) => f.elevation + f.height));
    const next = { id: crypto.randomUUID(), name: `${model.floors.length}. Kat`, elevation: top, height: floor.height };
    if (commit({ ...model, floors: [...model.floors, next] }, `${next.name} eklendi. Boş katta çizime başlayabilirsiniz.`)) { setFloorId(next.id); setSelectedId(null); setPending([]); }
  }
  const instruction = tool === "select" ? "Eleman seçin" : tool === "pan" ? "Görünümü kaydırın" : tool === "move" ? (pending.length ? "Hedef noktası" : "Taşıma başlangıcı") : tool === "column" ? "Merkez noktası" : tool === "slab" ? `${pending.length} köşe · Kapalı alan çizin` : tool === "axis" ? (axisOptions.direction === "free" ? (pending.length ? "Aks bitiş noktası" : "Aks başlangıç noktası") : `${axisOptions.direction === "horizontal" ? "Yatay" : "Düşey"} aks noktası`) : pending.length ? "İkinci nokta" : "İlk nokta";

  return <div ref={rootRef} className={styles.root} data-testid="hsyncad-workbench" data-ready={hydrated} tabIndex={-1}
    onPointerDown={(event) => { if ((event.target as HTMLElement).closest("svg[role='img']")) event.currentTarget.focus({ preventScroll: true }); }}
    onKeyDown={(event) => {
      if (event.key === "Escape" && isCompact && inspectorOpen) {
        event.preventDefault();
        closeCompactInspector();
        return;
      }
      if ((event.target as HTMLElement).closest("input,textarea,select")) return;
      if (event.key === " " && tool === "axis") {
        event.preventDefault();
        setAxisOptions((prev) => ({
          ...prev,
          direction: prev.direction === "horizontal" ? "vertical" : prev.direction === "vertical" ? "free" : "horizontal",
        }));
        setMessage("Aks yönü değiştirildi.");
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); }
      if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); deleteSelected(); }
      if (event.key === "Escape") cancel();
      if (event.key === "Enter" && tool === "slab") finishSlab();
    }}>
    <header className="hcad-topbar">
      <div className="hcad-brand"><Link href="/kategori/araclar" aria-label="Araçlara dön" title="Araçlara dön"><ArrowLeft size={17} /></Link><div className="hcad-brand-icon"><Box size={23} /></div><h1>hsyn<span>CAD</span></h1><span className="hcad-badge">ÖN İZLEME</span></div>
      <div className="hcad-project-name">{model.name}<span>2B / 3B YAPI MODELİ</span></div>
      <div className="hcad-file-actions"><button type="button" onClick={exportFile} title="JSON olarak kaydet" aria-label="JSON kaydet"><Download size={15} /><span>JSON kaydet</span></button><button type="button" onClick={() => fileInput.current?.click()} title="JSON modeli aç" aria-label="Model aç"><Upload size={15} /><span>Model aç</span></button><input ref={fileInput} type="file" accept=".json,application/json" hidden aria-label="JSON model dosyası" data-testid="hsyncad-import" onChange={(e) => void importFile(e.target.files?.[0])} /></div>
    </header>
    <div className="hcad-tabs" role="tablist" aria-label="Çizim sekmeleri">{["Giriş", "Görünüm", "Katlar", "Proje"].map((name) => <button type="button" key={name} role="tab" id={`tab-${name}`} aria-controls="hcad-ribbon" aria-selected={tab === name} onClick={() => setTab(name)}>{name}</button>)}<span className="hcad-save-state"><Save size={12} />{saveStatus}</span></div>
    <div className="hcad-ribbon" id="hcad-ribbon" role="tabpanel" aria-labelledby={`tab-${tab}`}>
      {tab === "Giriş" && <>
        <div className="hcad-ribbon-group hcad-element-tools">{TOOLS.map(({ id, name, Icon, detail }) => <button type="button" key={id} className={`hcad-tool ${tool === id ? "active" : ""}`} data-testid={`tool-${id}`} aria-pressed={tool === id} onClick={() => selectTool(id)}><Icon size={24} strokeWidth={1.5} /><strong>{name}</strong><small>{detail}</small></button>)}</div>
        <div className="hcad-ribbon-group hcad-edit-tools"><button type="button" aria-label="Geri al" title="Geri al (Ctrl+Z)" disabled={!history.past.length} onClick={undo}><Undo2 size={17} />Geri al</button><button type="button" aria-label="Yinele" disabled={!history.future.length} onClick={redo}><Redo2 size={17} />Yinele</button><button type="button" disabled={!selected} onClick={deleteSelected}><Trash2 size={16} />Sil</button></div>
        <div className="hcad-ribbon-group hcad-dimensions">{activeType && dimensions && <><span className="hcad-section-eyebrow">YENİ {TYPE_NAMES[activeType].toLocaleUpperCase("tr")} · METRE</span><div className="hcad-fields">{(activeType === "column" || activeType === "beam") && <NumberField label="Genişlik b" testId="new-width" value={dimensions.width} min={0.01} onChange={(width) => setDefaults({ ...defaults, [activeType]: { ...dimensions, width } })} />}{activeType === "column" && <NumberField label="Derinlik h" testId="new-depth" value={dimensions.depth} min={0.01} onChange={(depth) => setDefaults({ ...defaults, [activeType]: { ...dimensions, depth } })} />}{(activeType === "column" || activeType === "beam" || activeType === "wall") && <NumberField label={activeType === "beam" ? "Kesit h" : "Yükseklik"} testId="new-height" value={dimensions.height} min={0.01} onChange={(height) => setDefaults({ ...defaults, [activeType]: { ...dimensions, height } })} />}{(activeType === "wall" || activeType === "slab") && <NumberField label="Kalınlık" testId="new-thickness" value={dimensions.thickness} min={0.01} onChange={(thickness) => setDefaults({ ...defaults, [activeType]: { ...dimensions, thickness } })} />}{activeType === "axis" && <p className="hcad-fine">İki noktayla aks çizgisi tanımlayın.<br />Koordinatlar metre cinsindedir.</p>}</div></>}{!activeType && <div className="hcad-ribbon-note"><Ruler size={22} /><span>Çizin. Modelleyin. Ölçün.<small>Tek model, eşzamanlı iki görünüm.</small></span></div>}</div>
      </>}
      {tab === "Görünüm" && <><div className="hcad-ribbon-group"><button type="button" onClick={() => setFitKey((n) => n + 1)}><Maximize2 size={18} />2B çizimi sığdır</button><label className="hcad-toggle"><input type="checkbox" checked={snapping} onChange={(e) => setSnapping(e.target.checked)} />Nokta yakalama</label><label className="hcad-toggle"><input type="checkbox" checked={ortho} onChange={(e) => setOrtho(e.target.checked)} />Dik çizim</label></div><div className="hcad-ribbon-group hcad-layer-list">{layerOptions.map((layer) => <label key={layer} className="hcad-toggle"><input type="checkbox" checked={!hiddenLayers.includes(layer)} onChange={(e) => setHiddenLayers((old) => e.target.checked ? old.filter((l) => l !== layer) : [...old, layer])} />{layer}</label>)}</div><p className="hcad-fine">Gizlenen katmanlar metraja dahildir.<br />2B aktif katı, 3B bütün katları gösterir.</p></>}
      {tab === "Katlar" && <><FloorProperties key={JSON.stringify(floor)} floor={floor} onApply={(next) => commit({ ...model, floors: model.floors.map((f) => f.id === next.id ? next : f) }, "Kat güncellendi. Kiriş ve döşemeler yeni kat üst kotunu kullanır.")} /><button type="button" onClick={addFloor}><Plus size={16} />Yeni kat</button><p className="hcad-fine">Kolon ve perde yüksekliği eleman özelliğidir.<br />Kiriş ve döşemenin üstü, kat üst kotundadır.</p></>}
      {tab === "Proje" && <><button type="button" onClick={() => replaceModel(createEmptyModel(), "Yeni boş model açıldı. Önceki model Geri al ile geri getirilebilir.")}><Plus size={17} />Yeni model</button><button type="button" data-testid="load-demo" onClick={() => replaceModel(createDemoModel(), "4 × 4 m ölçülü örnek açıldı. Tüm işlemler geri alınabilir.")}><Box size={18} />4 × 4 m örneği aç</button><button type="button" onClick={exportFile}><Download size={17} />JSON kaydet</button><p className="hcad-fine">Model bu tarayıcıda otomatik saklanır.<br />Kalıcı yedek için JSON dosyası indirin.</p></>}
    </div>
    <div className="hcad-workspace-bar">
      <div className="hcad-compact-switch" role="group" aria-label="CAD çalışma görünümü">
        <button type="button" data-testid="hsyncad-view-2d" aria-pressed={compactView === "2d"} className={compactView === "2d" ? "active" : ""} onClick={() => setCompactView("2d")}>2B</button>
        <button type="button" data-testid="hsyncad-view-3d" aria-pressed={compactView === "3d"} className={compactView === "3d" ? "active" : ""} onClick={() => setCompactView("3d")}>3B</button>
        <button type="button" ref={inspectorTriggerRef} data-testid="hsyncad-inspector-toggle" aria-controls="hsyncad-compact-inspector" aria-expanded={inspectorOpen} aria-label="Metraj ve özellikler panelini aç" onClick={() => setInspectorOpen(true)}><Layers size={14} />{panel === "quantities" ? "Metraj" : "Özellikler"}</button>
      </div>
      <div><span className="hcad-section-eyebrow">ÇALIŞMA ALANI</span><ChevronRight size={13} /><label><span className="sr-only">Aktif kat</span><select data-testid="active-floor" value={floor.id} onChange={(e) => { setFloorId(e.target.value); setSelectedId(null); setPending([]); }}>{model.floors.map((f) => <option key={f.id} value={f.id}>{f.name} · +{number(f.elevation, 2)} m</option>)}</select></label></div><div className="hcad-workspace-tools"><button type="button" className={snapping ? "active" : ""} aria-pressed={snapping} onClick={() => setSnapping(!snapping)} data-testid="snap-toggle">Yakalama {snapping ? "açık" : "kapalı"}</button><button type="button" className={ortho ? "active" : ""} aria-pressed={ortho} onClick={() => setOrtho(!ortho)}>Dik çizim</button><label><span className="sr-only">Izgara aralığı</span><select aria-label="Izgara aralığı" value={gridStep} onChange={(e) => setGridStep(Number(e.target.value))}><option value={0.1}>Izgara 0,10 m</option><option value={0.25}>Izgara 0,25 m</option><option value={0.5}>Izgara 0,50 m</option><option value={1}>Izgara 1,00 m</option></select></label></div></div>
    {tool === "axis" && (
      <div className="hcad-axis-options-slot" data-testid="hsyncad-axis-options-slot">
      <AxisOptions
        options={axisOptions}
        onChange={setAxisOptions}
        elements={model.elements}
        floorId={floor.id}
        materialId={model.materials[0].id}
        selectedId={selectedId}
        onCreateGrid={(axes) => {
          if (commit({ ...model, elements: [...model.elements, ...axes] }, `${axes.length} aks eklendi.`)) {
            setFitKey((n) => n + 1);
          }
        }}
      />
      </div>
    )}
    <div className="hcad-body">
      <nav className="hcad-side-tools" aria-label="Dikey çizim araçları">{[{ id: "select", name: "Seç", Icon: MousePointer2 }, { id: "move", name: "Taşı", Icon: Move }, { id: "pan", name: "Kaydır", Icon: Hand }].map(({ id, name, Icon }) => <button type="button" key={id} data-testid={`tool-${id}`} title={name} aria-label={name} className={tool === id ? "active" : ""} onClick={() => selectTool(id as Tool)}><Icon size={19} /><small>{name}</small></button>)}<span className="hcad-toolbar-rule" /><button type="button" aria-label="Seçili elemanı sil" title="Sil (Delete)" onClick={deleteSelected} disabled={!selected}><Trash2 size={18} /><small>Sil</small></button><button type="button" aria-label="Çizimi iptal et" title="İptal (Esc)" onClick={cancel} disabled={!pending.length}><X size={18} /><small>İptal</small></button><button type="button" aria-label="Çizimi sığdır" title="Çizimi sığdır" onClick={() => setFitKey((n) => n + 1)}><Maximize2 size={18} /><small>Sığdır</small></button></nav>
      <div className="hcad-views" data-active-view={compactView}><div className="hcad-plan-wrap">
        <button type="button" className="hcad-coordinate-toggle" data-testid="hsyncad-coordinate-toggle" aria-controls="hsyncad-coordinate-form" aria-expanded={coordinatesOpen} onClick={() => setCoordinatesOpen((open) => !open)}><Move size={13} />X/Y</button><Plan2D elements={visibleElements} tool={tool} selectedId={selectedId} pending={pending} snapping={snapping} ortho={ortho} gridStep={gridStep} fitKey={fitKey} onPoint={placePoint} onSelect={selectElement} onCursor={(p, label) => { setCursor(p); setSnapLabel(label); }} onZoom={setZoom} />
        <form id="hsyncad-coordinate-form" className="hcad-coordinate-box" data-compact-open={coordinatesOpen} onSubmit={(e) => { e.preventDefault(); placePoint({ x: Number(coords.x.replace(",", ".")), y: Number(coords.y.replace(",", ".")) }); }}><div><Move size={12} /><strong>Koordinat kutusu</strong><span>m</span></div><label>X<input aria-label="X koordinatı" data-testid="coordinate-x" inputMode="decimal" value={coords.x} onChange={(e) => setCoords({ ...coords, x: e.target.value })} required /></label><label>Y<input aria-label="Y koordinatı" data-testid="coordinate-y" inputMode="decimal" value={coords.y} onChange={(e) => setCoords({ ...coords, y: e.target.value })} required /></label><button type="submit" data-testid="coordinate-place" title="Girilen koordinatı kullan"><Plus size={13} />Nokta ekle</button><small>İmleç: {number(cursor.x, 2)} / {number(cursor.y, 2)}</small></form>
        {tool === "slab" && pending.length > 0 && <button type="button" className="hcad-finish-slab" data-testid="finish-slab" disabled={pending.length < 3} onClick={finishSlab}><Check size={16} />Döşemeyi tamamla ({pending.length})</button>}
      </div><Scene3D model={model} selectedId={selectedId} onSelect={selectElement} hiddenLayers={hiddenLayers} junctions={junctions} /></div>
      {isCompact && inspectorOpen && <div className="hcad-inspector-backdrop" data-testid="hsyncad-inspector-backdrop" aria-hidden="true" onClick={closeCompactInspector} />}
      <aside ref={inspectorRef} id="hsyncad-compact-inspector" className="hcad-inspector" data-open={inspectorOpen} inert={isCompact && !inspectorOpen} role={isCompact && inspectorOpen ? "dialog" : undefined} aria-modal={isCompact && inspectorOpen ? true : undefined} aria-label={isCompact && inspectorOpen ? "Metraj ve özellikler" : undefined} onKeyDown={handleInspectorKeyDown}>
        <div className="hcad-inspector-drawer-header"><strong>Metraj / Özellikler</strong><button type="button" ref={inspectorCloseRef} data-testid="hsyncad-inspector-close" onClick={closeCompactInspector} aria-label="Paneli kapat"><X size={17} /></button></div>
        <div className="hcad-inspector-tabs"><button type="button" className={panel === "quantities" ? "active" : ""} onClick={() => setPanel("quantities")}>Metraj</button><button type="button" className={panel === "properties" ? "active" : ""} onClick={() => setPanel("properties")}>Özellikler</button></div>
        <div className="hcad-inspector-content">{panel === "quantities" ? <><div className="hcad-panel-heading"><span className="hcad-section-eyebrow">ANLIK METRAJ</span><span className="hcad-live"><i />Canlı</span></div><div className="hcad-metric"><span>Beton hacmi · {quantities.warnings.length ? "brüt" : "net"}</span><div><strong data-testid="quantity-net">{number(quantities.netVolume)}</strong><span>m³</span></div><small>Tüm katlar · {model.elements.filter((e) => e.type !== "axis").length} yapı elemanı</small></div><div className="hcad-metric hcad-metric-secondary"><span>Kalıp alanı · brüt</span><div><strong data-testid="quantity-formwork">{number(quantities.formwork, 2)}</strong><span>m²</span></div></div><table className="hcad-quantity-table"><caption>Eleman tipine göre metraj</caption><thead><tr><th>Eleman</th><th>Adet</th><th>{quantities.warnings.length ? "Brüt m³" : "Net m³"}</th><th>Kalıp m²</th></tr></thead><tbody>{quantities.rows.map((row) => <tr key={row.type} data-testid={`quantity-${row.type}`}><td><i style={{ background: TYPE_COLORS[row.type] }} />{TYPE_NAMES[row.type]}</td><td>{row.count}</td><td>{number(row.netVolume)}</td><td>{number(row.formwork, 2)}</td></tr>)}</tbody></table><div className="hcad-deduction"><span>Brüt hacim <b>{number(quantities.grossVolume)} m³</b></span><span>Çakışma düşümü <b data-testid="quantity-overlap">−{number(quantities.overlapVolume)} m³</b></span></div><details className="hcad-assumptions" open><summary>Hesap kabulleri</summary>{quantities.assumptions.map((text, i) => <p key={i}>{text}</p>)}</details>{quantities.warnings.map((text, i) => <p className="hcad-warning" key={i}>{text}</p>)}<p className="hcad-scope-note">Geometrik modelleme ve metraj MVP’si. Statik / deprem hesabı ve mevzuata uygunluk kontrolü içermez.</p></> : <ElementProperties element={selected} model={model} onApply={(next) => commit({ ...model, elements: model.elements.map((e) => e.id === next.id ? next : e) }, `${next.name} güncellendi.`)} onDelete={deleteSelected} />}
        <details className="hcad-element-list"><summary><Layers size={13} />Elemanlar ({model.elements.length})</summary>{model.elements.map((e) => <button type="button" key={e.id} data-testid={`element-${e.name}`} className={selectedId === e.id ? "active" : ""} onClick={() => { selectElement(e.id); setFloorId(e.floorId); setTool("select"); }}><i style={{ background: TYPE_COLORS[e.type] }} /><b>{e.name}</b><span>{TYPE_NAMES[e.type]}</span><small>{model.floors.find((f) => f.id === e.floorId)?.name}</small></button>)}{!model.elements.length && <p className="hcad-fine">Henüz eleman yok.</p>}</details></div>
      </aside>
    </div>
    <div className="hcad-command"><ChevronRight size={16} /><label htmlFor="hcad-command">Komut</label><form onSubmit={(e) => { e.preventDefault(); runCommand(); }}><input id="hcad-command" data-testid="hsyncad-command" autoComplete="off" value={command} onChange={(e) => setCommand(e.target.value)} placeholder={`${instruction} · Koordinat: 4 0 · sil / geri / iptal / bitir`} /><button type="submit" aria-label="Komutu çalıştır">↵</button></form></div>
    <div className="hcad-message" role="status" data-testid="hsyncad-message"><span className="hcad-live"><i /></span>{message}</div>
    <footer className="hcad-statusbar"><span><Eye size={12} />{snapLabel}</span><span>{floor.name} · {visibleElements.length} eleman</span><span>X {number(cursor.x, 2)} <b>Y {number(cursor.y, 2)}</b></span><span className="hcad-unit">Birim: <b>m</b></span><span data-testid="hsyncad-zoom">Yakınlaştırma: %{zoom}</span></footer>
    <div className="hcad-bottom-help"><span><RotateCcw size={13} />Ctrl+Z: geri al · Delete: sil · Esc: iptal</span><button type="button" onClick={() => replaceModel(createDemoModel(), "4 × 4 m örnek açıldı. Önceki model Geri al ile geri getirilebilir.")}>Ölçülü örnekle başla <ChevronRight size={14} /></button></div>
  </div>;
}
