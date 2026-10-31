"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { Box, Check, ChevronDown, FileUp, FolderOpen, Maximize2, Search, X } from "lucide-react";
import type { IdeProject, IdeFloor } from "@/lib/hsyncad/ide-import";
import { IDE_EXAMPLES, type IdeExampleId } from "@/lib/hsyncad/ide-examples";
import { readIdeFile, rememberIdeProject, restoreIdeProject } from "@/lib/hsyncad/ide-reader-client";
import IdePlan2D, { IDE_COLORS, IDE_NAMES } from "./ide-plan2d";
import styles from "./ide-project-panel.module.css";
import IdeFileMenu from "./ide-file-menu";

const IdeScene3D = dynamic(() => import("./ide-scene3d"), { ssr: false, loading: () => <div className={styles.empty}>3B görünüm hazırlanıyor…</div> });
const fmt = (value: number) => value.toLocaleString("tr-TR", { maximumFractionDigits: 4 });
const ceilingLabel = (floor: IdeFloor) => `${floor.name}${/TAVANI/i.test(floor.name) ? "" : " TAVANI"} · ${fmt(floor.elevation + floor.height)} m`;

type Props = { initialFile?: File; initialSample?: IdeExampleId; onClose: () => void };

export default function IdeProjectPanel({ initialFile, initialSample, onClose }: Props) {
  const [project, setProject] = useState<IdeProject | null>(null);
  const [sourceFile, setSourceFile] = useState<File | undefined>();
  const [floorId, setFloorId] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [hiddenTypes, setHiddenTypes] = useState<string[]>([]);
  const [view, setView] = useState<"split" | "2d" | "3d">("split");
  const [direction, setDirection] = useState<"perspective" | "top" | "front" | "right">("perspective");
  const [allFloors, setAllFloors] = useState(true), [labels, setLabels] = useState(true), [axes3D, setAxes3D] = useState(true);
  const [slabMode, setSlabMode] = useState<"transparent" | "solid" | "hidden">("transparent");
  const [foundations2D, setFoundations2D] = useState(false);
  const [fitKey, setFitKey] = useState(0), [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Bir IDE projesi seçin veya aşağıdaki örneklerden birini açın.");
  const [error, setError] = useState("");
  const [examplesOpen, setExamplesOpen] = useState(!initialFile && !initialSample);
  const inputRef = useRef<HTMLInputElement>(null), dialogRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  const install = useCallback((next: IdeProject, source?: File, persist = true) => {
    setSourceFile(source);
    setProject(next); setFloorId(next.floors.reduce((lowest, f) => f.elevation < lowest.elevation ? f : lowest, next.floors[0])?.id ?? "");
    setSelectedId(null); setHiddenTypes([]); setSearch(""); setFitKey(n => n + 1);
    setStatus(`${next.filename} · ${next.floors.length} kat · ${next.elements.length.toLocaleString("tr-TR")} kayıt okundu.`);
    if (persist) void rememberIdeProject(next, source).catch(() => setStatus("Proje açıldı. Tarayıcı depolaması dolu; yeniden açmak için dosyayı tekrar seçebilirsiniz."));
  }, []);

  const openFile = useCallback(async (file: File, providedController?: AbortController) => {
    const controller = providedController ?? new AbortController();
    if (!providedController) { requestRef.current?.abort(); requestRef.current = controller; }
    setBusy(true); setError(""); setExamplesOpen(false);
    try {
      const next = await readIdeFile(file, controller.signal, setStatus);
      if (!controller.signal.aborted) install(next, /\.(ide10|ide11|ide11trial)$/i.test(file.name) ? file : undefined);
    } catch (cause) {
      if (!controller.signal.aborted) { setError(cause instanceof Error ? cause.message : "Proje açılamadı."); setStatus("Dosya okunamadı. Başka bir dosya seçebilirsiniz."); }
    } finally { if (requestRef.current === controller) { setBusy(false); requestRef.current = null; } }
  }, [install]);

  const openSample = useCallback(async (id: IdeExampleId) => {
    requestRef.current?.abort(); const controller = new AbortController(); requestRef.current = controller;
    setBusy(true); setError(""); setExamplesOpen(false); setStatus("Örnek proje bu bilgisayardan okunuyor…");
    try {
      const response = await fetch(`/api/hsyncad/ide-examples/${id}`, { signal: controller.signal });
      if (!response.ok) throw new Error("Bu örnek bu bilgisayarda bağlı değil. IDE dosyası aç düğmesiyle kendi dosyanızı seçin.");
      const total = Number(response.headers.get("content-length")) || 0;
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Örnek dosya akışı açılamadı.");
      const chunks: Uint8Array<ArrayBuffer>[] = []; let received = 0, reported = 0;
      while (true) { const chunk = await reader.read(); if (chunk.done) break; chunks.push(chunk.value as Uint8Array<ArrayBuffer>); received += chunk.value.byteLength; if (performance.now() - reported > 100) { reported = performance.now(); setStatus(`Örnek okunuyor · ${fmt(received / 1048576)} MB${total ? ` / ${fmt(total / 1048576)} MB` : ""}`); } }
      const disposition = response.headers.get("content-disposition") ?? "";
      const filename = decodeURIComponent(disposition.match(/filename\*=UTF-8''(.+)/i)?.[1] ?? `${id}.ide10`);
      const file = new File(chunks, filename); chunks.length = 0;
      if (!controller.signal.aborted) await openFile(file, controller);
    } catch (cause) {
      if (!controller.signal.aborted) { setError(cause instanceof Error ? cause.message : "Örnek açılamadı."); setStatus("Örnek açılamadı; Dosya aç ile devam edebilirsiniz."); }
    } finally { if (requestRef.current === controller) { setBusy(false); requestRef.current = null; } }
  }, [openFile]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => { requestRef.current?.abort(); previous?.focus(); };
  }, []);
  useEffect(() => {
    let live = true;
    void Promise.resolve().then(() => {
      if (!live) return;
      if (initialFile) void openFile(initialFile);
      else if (initialSample) void openSample(initialSample);
      else void restoreIdeProject().then(saved => { if (live && saved && !requestRef.current) { install(saved.project, saved.sourceFile, false); setExamplesOpen(false); } }).catch(() => {});
    });
    return () => { live = false; requestRef.current?.abort(); };
  }, [initialFile, initialSample, openFile, openSample, install]);

  const filtered = useMemo(() => project?.elements.filter(e => !hiddenTypes.includes(e.type)) ?? [], [project, hiddenTypes]);
  const activeFloorElements = useMemo(() => filtered.filter(e => e.floorId === floorId), [filtered, floorId]);
  const floorElements = useMemo(() => activeFloorElements.filter(e => foundations2D || !e.foundation), [activeFloorElements, foundations2D]);
  const sceneElements = useMemo(() => (allFloors ? filtered : activeFloorElements).filter(e => !e.planOnly && !["axis", "line", "slabEdge"].includes(e.type)), [allFloors, filtered, activeFloorElements]);
  const list = useMemo(() => floorElements.filter(e => !search || e.name.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR"))), [floorElements, search]);
  const selected = project?.elements.find(e => e.id === selectedId);
  const floor = project?.floors.find(f => f.id === floorId);
  const types = useMemo(() => [...new Set(project?.elements.map(e => e.type) ?? [])], [project]);

  return createPortal(<div className={styles.overlay} ref={dialogRef} role="dialog" aria-modal="true" aria-label="IDE proje görüntüleyici" tabIndex={-1} data-testid="ide-viewer" data-element-count={project?.elements.length ?? 0} onKeyDown={event => {
    event.stopPropagation();
    if (event.key === "Escape") { event.preventDefault(); if (examplesOpen) setExamplesOpen(false); else onClose(); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "o") { event.preventDefault(); inputRef.current?.click(); }
    if (event.key === "Tab") {
      const nodes = [...(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not([hidden]),select,a[href],[tabindex="0"]') ?? [])].filter(node => node.getClientRects().length);
      const first = nodes[0], last = nodes.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }} onDragOver={event => { event.preventDefault(); }} onDrop={event => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void openFile(file); }}>
    <header className={styles.header}>
      <div className={styles.brand}><IdeFileMenu project={project} sourceFile={sourceFile} floorId={floorId} elements={floorElements} labels={labels} planVisible={view !== "3d"} onOpen={() => inputRef.current?.click()} onStatus={setStatus} onError={setError} /><Box size={22} /><div><strong>IDE Proje Görüntüleyici</strong><small>{project?.name ?? "hsynCAD · Kişisel çalışma alanı"}</small></div></div>
      <div className={styles.headerActions}>
        <button type="button" data-testid="ide-open-file" onClick={() => inputRef.current?.click()}><FileUp size={16} /><span>IDE dosyası aç</span></button>
        <button type="button" data-testid="ide-examples-toggle" onClick={() => setExamplesOpen(v => !v)} aria-expanded={examplesOpen}><FolderOpen size={16} /><span>Örnek projeler</span><ChevronDown size={13} /></button>
        <button type="button" aria-label="IDE görüntüleyiciyi kapat" data-testid="ide-close" onClick={onClose}><X size={19} /></button>
      </div>
      <input hidden ref={inputRef} type="file" accept=".ide10,.ide11,.ide11trial,.hsyncad" data-testid="ide-file-input" onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void openFile(file); }} />
    </header>
    {project && <div className={styles.toolbar}>
      <label>Kat <select aria-label="IDE katı" data-testid="ide-floor" value={floorId} onChange={event => { setFloorId(event.target.value); setSelectedId(null); }}>{[...project.floors].sort((a, b) => b.elevation - a.elevation).map(f => <option key={f.id} value={f.id}>{ceilingLabel(f)}</option>)}</select></label>
      <div className={styles.segmented}>{[["split", "2B + 3B"], ["2d", "2B Plan"], ["3d", "3B Model"]].map(([id, text]) => <button type="button" key={id} data-testid={`ide-view-${id}`} aria-pressed={view === id} onClick={() => setView(id as typeof view)}>{text}</button>)}</div>
      <button type="button" data-testid="ide-fit" onClick={() => setFitKey(k => k + 1)}><Maximize2 size={15} />Sığdır</button>
      <label className={styles.check}><input type="checkbox" checked={allFloors} onChange={event => setAllFloors(event.target.checked)} />3B tüm katlar</label>
      <label className={styles.check}><input type="checkbox" checked={axes3D} onChange={event => setAxes3D(event.target.checked)} />3B akslar</label>
      <label>3B döşeme <select data-testid="ide-slab-mode" aria-label="IDE döşeme görünümü" value={slabMode} onChange={event => setSlabMode(event.target.value as typeof slabMode)}><option value="transparent">Saydam</option><option value="solid">Katı</option><option value="hidden">Gizli</option></select></label>
      <label className={styles.check}><input type="checkbox" data-testid="ide-foundations-2d" checked={foundations2D} onChange={event => setFoundations2D(event.target.checked)} />2B temeller</label>
      <label className={styles.check}><input type="checkbox" checked={labels} onChange={event => setLabels(event.target.checked)} />Eleman adları</label>
    </div>}
    {project && <div className={styles.mobileScope} data-testid="ide-mobile-scope">Kısmi IDE desteği · Merdivenler kayıtlı analiz ağıyla gösterilir. Özel kot ve pafta verileri henüz tam desteklenmiyor.</div>}
    {error && <div className={styles.error} role="alert" data-testid="ide-error">{error}</div>}
    <div className={styles.body}>
      {project ? <>
        <div className={styles.views} data-view={view}>
          {view !== "3d" && <section className={styles.plan}><div className={styles.viewTitle}><strong>2B · {floor ? ceilingLabel(floor) : ""}</strong><span>{floorElements.length.toLocaleString("tr-TR")} kayıt · metre</span></div><IdePlan2D elements={floorElements} selectedId={selectedId} onSelect={setSelectedId} labels={labels} fitKey={fitKey} /></section>}
          {view !== "2d" && <section className={styles.scene}><div className={styles.viewTitle}><strong>3B · {allFloors ? "Tüm katlar" : floor?.name}</strong><select aria-label="IDE 3B yönü" value={direction} onChange={event => setDirection(event.target.value as typeof direction)}><option value="perspective">Perspektif</option><option value="top">Üst</option><option value="front">Ön</option><option value="right">Sağ</option></select></div><IdeScene3D project={project} elements={sceneElements} selectedId={selectedId} onSelect={setSelectedId} view={direction} fitKey={fitKey} light={true} slabMode={slabMode} showAxes={axes3D && !hiddenTypes.includes("axis")} /></section>}
        </div>
        <aside className={styles.inspector} aria-label="IDE proje bilgileri">
          <div className={styles.projectInfo}><span>PROJE</span><strong>{project.filename}</strong><small>{project.floors.length} kat · {project.elements.length.toLocaleString("tr-TR")} kayıt · {fmt(project.byteLength / 1048576)} MB</small></div>
          <details className={styles.coverage} data-testid="ide-coverage"><summary>Kısmi IDE desteği · okuma kapsamı</summary>{project.warnings.map((warning, i) => <p key={i}>{warning}</p>)}{project.coverage.limitations.map((limitation, i) => <p key={`l${i}`}>{limitation}</p>)}<small>{project.coverage.decodedRecords} görüntülenen eleman · {project.coverage.holeRecords} boşluk kaydı</small></details>
          <div className={styles.filters}>{types.map(type => <button type="button" key={type} aria-pressed={!hiddenTypes.includes(type)} data-testid={`ide-type-${type}`} onClick={() => setHiddenTypes(old => old.includes(type) ? old.filter(t => t !== type) : [...old, type])}><i style={{ background: IDE_COLORS[type] }} />{IDE_NAMES[type] ?? type}<small>{project.coverage.byType[type]}</small>{!hiddenTypes.includes(type) && <Check size={12} />}</button>)}</div>
          {selected && <div className={styles.selection} data-testid="ide-selection"><span>SEÇİLİ ELEMAN</span><strong>{selected.name} · {selected.foundation ? "Radye temel" : selected.type === "wall" ? selected.structural === false ? "Duvar" : "Perde" : IDE_NAMES[selected.type]}</strong><dl><dt>Kat</dt><dd>{project.floors.find(f => f.id === selected.floorId)?.name}</dd>{selected.planAnnotation?.loads && <><dt>Sabit yük G</dt><dd>{fmt(selected.planAnnotation.loads.dead)} tf/m²</dd><dt>Hareketli yük Q</dt><dd>{fmt(selected.planAnnotation.loads.live)} tf/m²</dd></>}{selected.width !== undefined && <><dt>Genişlik</dt><dd>{fmt(selected.width)} m</dd></>}{selected.height !== undefined && <><dt>Yükseklik</dt><dd>{fmt(selected.height)} m</dd></>}{selected.thickness !== undefined && <><dt>Kalınlık</dt><dd>{fmt(selected.thickness)} m</dd></>}{selected.bottom !== undefined && <><dt>Alt kot</dt><dd>{fmt(selected.bottom)} m</dd></>}{selected.top !== undefined && <><dt>Üst kot</dt><dd>{fmt(selected.top)} m</dd></>}</dl>{selected.planOnly && <small data-testid="ide-plan-only-info">Kaynak plan geometrisi. Bu kaydın 3B yüksekliği gösterilmez.</small>}{selected.verticalSource === "storey-derived" && <small>3B düşey sınırlar kat kotlarından türetildi.</small>}{selected.mesh?.source === "native-analysis-mesh" && <div data-testid="ide-native-mesh-info"><small>Dosyadaki kayıtlı analiz yüzeyi · {selected.mesh.sourceNodeCount} düğüm · {selected.mesh.sourceFaceCount} yüz. XYZ kotları doğrudan dosyadan okunur. Basamak, kaplama ve korkuluk ayrıntıları bu yüzeyde bulunmaz.</small>{!!selected.mesh.nonPlanarQuads && <small>{selected.mesh.nonPlanarQuads} düzlemsel olmayan yüz kaynak köşeleri boyunca üçgenlendi.</small>}</div>}<details><summary>Plan koordinatları · m</summary>{selected.points.slice(0, 32).map((point, i) => <p key={i}>{i + 1}: X {fmt(point.x)} · Y {fmt(point.y)}</p>)}</details></div>}
          <label className={styles.search}><Search size={14} /><input type="search" placeholder="Eleman adı ara…" aria-label="IDE elemanı ara" value={search} onChange={event => setSearch(event.target.value)} /></label>
          <div className={styles.list}><small>{list.length} kayıt · {floor?.name}</small>{list.slice(0, 200).map(element => <button type="button" key={element.id} data-testid="ide-element" aria-pressed={selectedId === element.id} onClick={() => setSelectedId(element.id)}><i style={{ background: IDE_COLORS[element.type] }} /><strong>{element.name}</strong><span>{IDE_NAMES[element.type]}</span></button>)}{list.length > 200 && <p>İlk 200 kayıt gösteriliyor. Adıyla arayarak diğer elemanlara ulaşın.</p>}</div>
        </aside>
      </> : <div className={styles.empty}><Box size={44} /><h2>IDE projelerinizi burada inceleyin</h2><p>.ide10, .ide11, .ide11trial veya .hsyncad dosyasını seçin.</p><button type="button" onClick={() => inputRef.current?.click()}><FileUp size={17} />IDE dosyası aç</button><small>Dosya tarayıcınızda işlenir. Sunucuya yüklenmez.</small></div>}
    </div>
    <footer className={styles.footer}><span role="status" data-testid="ide-status">{status}</span><small>Sürükle: kaydır · Tekerlek: yakınlaştır · Çift tık: sığdır · Ctrl+O: aç</small></footer>
    {examplesOpen && <section className={styles.examples} aria-label="Örnek IDE projeleri" data-testid="ide-examples"><div><strong>Örnek projeler</strong><button type="button" aria-label="Örnekleri kapat" onClick={() => setExamplesOpen(false)}><X size={16} /></button></div>{IDE_EXAMPLES.map(sample => <button type="button" key={sample.id} data-testid={`ide-sample-${sample.id}`} onClick={() => void openSample(sample.id)}><FolderOpen size={20} /><span><strong>{sample.name}</strong><small>{sample.detail}</small></span></button>)}<p>Bu bilgisayardaki özgün dosyalar. Son açılan proje bu tarayıcıda hatırlanır.</p></section>}
    {busy && <div className={styles.loading} role="status" data-testid="ide-loading"><div><span className={styles.spinner} /><strong>IDE projesi açılıyor</strong><p>{status}</p><button type="button" onClick={() => { requestRef.current?.abort(); requestRef.current = null; setBusy(false); setStatus("Okuma iptal edildi."); }}>İptal</button></div></div>}
  </div>, document.body);
}
