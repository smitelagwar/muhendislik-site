"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronRight, Columns3, Grid2X2, Layers, Ruler, Square } from "lucide-react";
import { type NativeRibbonCommand } from "@/lib/hsyncad/ribbon-layout";
import { PRODUCT_RIBBON_TABS } from "@/lib/hsyncad/product-ribbon";
import CadIcon, { type CadIconName } from "./cad-icons";
import type { Tool } from "./editor-state";
import styles from "./ribbon.module.css";

export const ELEMENT_TOOLS = [
  { id: "axis", name: "Aks", Icon: Grid2X2 },
  { id: "column", name: "Kolon", Icon: Columns3 },
  { id: "beam", name: "Kiriş", Icon: Ruler },
  { id: "wall", name: "Perde", Icon: Square },
  { id: "slab", name: "Döşeme", Icon: Layers },
] as const;
export type RibbonAction = { run: () => void; active?: boolean; disabled?: boolean; hint?: string; partial?: boolean };
type Props = {
  tool: Tool; modelName: string; floorName: string; saveStatus: string;
  canUndo: boolean; canRedo: boolean; hasSelection: boolean;
  tab: string; onTab: (tab: string) => void;
  actions: Record<number, RibbonAction>;
  onUndo: () => void; onRedo: () => void; onExport: () => void; onImport: () => void;
};
const toolIds: Record<number, string> = { 12590: "axis", 12820: "column", 12910: "beam", 13810: "wall", 12570: "slab", 13660: "measureDistance", 13650: "measureArea", 40221: "measureAngle" };
const iconIds: Record<number, CadIconName> = {
  12590: "axis", 12820: "column", 12840: "circle-column", 12830: "polygon-column", 12910: "beam", 1823: "curve-beam", 13810: "wall", 12570: "slab", 14350: "slab-edge", 13830: "stairs",
  12690: "foundation", 12710: "footing", 12576: "raft", 14351: "slab-edge", 15700: "floors", 11240: "floors", 12500: "copy-floor", 40350: "rigid",
  13600: "undo", 13610: "redo", 13660: "measure", 13650: "area", 40221: "angle", 13030: "fit", 13080: "pan", 13470: "settings", 12605: "origin",
};
function iconFor(c: NativeRibbonCommand): CadIconName {
  if (c.commandId && iconIds[c.commandId]) return iconIds[c.commandId];
  const s = c.symbol;
  if (/SETTINGS|PREFERENCES|CONFIG/.test(s)) return "settings";
  if (/AXIS|CONTOUR/.test(s)) return "axis";
  if (/COLUMN/.test(s)) return "column";
  if (/SLAB_EDGE|RAFT_EDGE/.test(s)) return "slab-edge";
  if (/SLAB|RAFT/.test(s)) return "slab";
  if (/BEAM/.test(s)) return /CURVE|ARC/.test(s) ? "curve-beam" : "beam";
  if (/WALL|PANEL/.test(s)) return "wall";
  if (/REPORT|QUANTITY/.test(s)) return "report";
  if (/STEEL|PROFILE/.test(s)) return "steel";
  if (/ANALY|DESIGN|FORCE|LOAD/.test(s)) return "analysis";
  if (/LAYER/.test(s)) return "layer";
  if (/LOCAL|COORD/.test(s)) return "origin";
  if (/SNAP|MIDPOINT|NEAR_TO/.test(s)) return "snap";
  if (/DIMENSION|DIM$/.test(s)) return "dimension";
  if (/TEXT|LABEL/.test(s)) return "text";
  if (/ROTAT/.test(s)) return "rotate";
  if (/MIRROR|SYMMETR/.test(s)) return "mirror";
  if (/MOVE|TRANSLAT/.test(s)) return "move";
  if (/DELETE|ERASE/.test(s)) return "delete";
  if (/ZOOM/.test(s)) return "zoom";
  if (/TOP/.test(s)) return "top";
  if (/FRONT|BACK/.test(s)) return "front";
  if (/VIEW|PERSPECTIVE|MODEL|SOLID/.test(s)) return "model";
  if (/DRAW|SECTION/.test(s)) return "drawing";
  return "reference";
}

/** Semantic ordering comes from the verified resource manifest; all artwork and handlers are web implementations. */
export default function CommandBar(p: Props) {
  const [menu, setMenu] = useState<{ command: NativeRibbonCommand; x: number; y: number } | null>(null);
  const [fileOpen, setFileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const root = useRef<HTMLElement>(null);
  const menuRoot = useRef<HTMLDivElement>(null);
  const fileRoot = useRef<HTMLDivElement>(null);
  const current = PRODUCT_RIBBON_TABS.find(t => t.label === p.tab) ?? PRODUCT_RIBBON_TABS[0];
  useEffect(() => {
    if (!menu && !fileOpen) return;
    const close = (event: PointerEvent) => {
      if (!menuRoot.current?.contains(event.target as Node) && !(event.target as HTMLElement).closest("[data-menu-trigger]")) setMenu(null);
      if (!fileRoot.current?.contains(event.target as Node)) setFileOpen(false);
    };
    const key = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") { setMenu(null); setFileOpen(false); } };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", key); };
  }, [menu, fileOpen]);
  function openMenu(event: MouseEvent<HTMLButtonElement>, command: NativeRibbonCommand) {
    const box = event.currentTarget.getBoundingClientRect();
    setMenu(old => old?.command.id === command.id ? null : { command, x: Math.max(4, Math.min(box.left, window.innerWidth - 310)), y: box.bottom });
  }
  function execute(id: number | null) { setMenu(null); setFileOpen(false); if (id != null) p.actions[id]?.run(); }
  const searchResults = search.trim().length > 1 ? PRODUCT_RIBBON_TABS.flatMap(t => t.panels.flatMap(panel => {
    const flatten = (c: NativeRibbonCommand): NativeRibbonCommand[] => [c, ...c.children.flatMap(flatten)];
    return panel.commands.flatMap(flatten).filter(c => c.label.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr"))).map(c => ({ c, tab: t.label }));
  })).filter((r, i, all) => all.findIndex(x => x.c.commandId === r.c.commandId) === i).slice(0, 12) : [];
  function renderCommand(c: NativeRibbonCommand) {
    if (c.type === "Separator" || !c.label) return <i className={styles.separator} key={c.id} />;
    const action = c.commandId != null ? p.actions[c.commandId] : undefined;
    const disabled = !action || action.disabled;
    const primaryTool = c.commandId != null ? toolIds[c.commandId] : undefined;
    const title = `${c.label}${!action ? " · Bu sürümde uygulanmadı" : `${action.partial ? " · Kısmi web karşılığı" : ""}${action.disabled ? " · Geçerli işlem veya seçim gerekli" : action.hint ? ` · ${action.hint}` : ""}`}`;
    return <div key={c.id} className={`${styles.command} ${c.large ? styles.large : styles.small}`} data-size={c.large ? "large" : "small"}>
      <button type="button" title={title} aria-label={c.label} disabled={disabled}
        data-testid={primaryTool ? `${["axis", "column", "beam", "wall", "slab"].includes(primaryTool) ? "tool" : "ribbon"}-${primaryTool}` : undefined}
        data-command-id={c.commandId} data-implementation={!action ? "unimplemented" : action.partial ? "partial" : "implemented"} aria-pressed={action?.active ?? (primaryTool === p.tool)} onClick={() => execute(c.commandId)}>
        <CadIcon name={iconFor(c)} size={c.large ? 29 : 16} />{c.large && <span>{c.label}{action?.partial ? " *" : ""}</span>}
      </button>
      {!!c.children.length && <button type="button" className={styles.drop} title={`${c.label} alt komutları`} aria-label={`${c.label} alt komutları`} aria-haspopup="menu" aria-expanded={menu?.command.id === c.id} data-menu-trigger onClick={event => openMenu(event, c)}><ChevronDown size={9} /></button>}
    </div>;
  }
  function renderMenu(commands: NativeRibbonCommand[]) {
    return commands.map(c => {
      if (c.type === "Separator" || !c.label) return <hr key={c.id} />;
      const action = c.commandId != null ? p.actions[c.commandId] : undefined;
      return <div key={c.id}>
        <button role="menuitem" type="button" disabled={!action || action.disabled} onClick={() => execute(c.commandId)} title={action?.hint ?? (!action ? "Bu sürümde uygulanmadı" : c.label)}>
          <CadIcon name={iconFor(c)} size={18} /><span>{c.label}</span>{!action && <small>Uygulanmadı</small>}{action?.partial && <small>Kısmi</small>}{!!c.children.length && <ChevronRight size={12} />}
        </button>{!!c.children.length && <div className={styles.nested}>{renderMenu(c.children)}</div>}
      </div>;
    });
  }
  return <header ref={root} className={styles.root} data-testid="hsyncad-command-bar">
    <div className={styles.titlebar}>
      <Link href="/kategori/araclar" aria-label="Araçlara dön" title="Araçlara dön"><ArrowLeft size={12} /></Link><h1>hsynCAD</h1>
      <div className={styles.quick} aria-label="Hızlı erişim">
        <button type="button" title="IDE veya JSON modeli aç · Ctrl+O" aria-label="Model aç" onClick={p.onImport}><CadIcon name="open" size={15} /></button>
        <button type="button" title="JSON kaydet" aria-label="JSON kaydet" onClick={p.onExport}><CadIcon name="save" size={15} /></button>
        <button type="button" aria-label="Geri al" title="Geri al · Ctrl+Z" disabled={!p.canUndo} onClick={p.onUndo}><CadIcon name="undo" size={15} /></button>
        <button type="button" aria-label="Yinele" title="Yinele · Ctrl+Shift+Z" disabled={!p.canRedo} onClick={p.onRedo}><CadIcon name="redo" size={15} /></button>
      </div><span className={styles.project}>{p.modelName} — [{p.floorName}]</span><small title={p.saveStatus}>{p.saveStatus}</small>
    </div>
    <div className={styles.tabrow}>
      <div ref={fileRoot} className={styles.file}>
        <button type="button" aria-label="Dosya işlemleri" aria-expanded={fileOpen} onClick={() => { setFileOpen(v => !v); setMenu(null); }}>Dosya</button>
        {fileOpen && <div className={styles.fileMenu} role="menu">{[
          [-1, "Yeni model", "new"], [11300, "Model aç", "open"], [11320, "JSON kaydet", "save"], [-2, "4 × 4 m örneği aç", "model"], [-3, "Gelişmiş örneği aç", "model"], [-4, "Çizim akışı örneği", "model"], [-5, "7 Katlı Plaza (1536 m²)", "model"],
        ].map(([id, label, icon]) => <button type="button" role="menuitem" key={id} data-testid={id === -2 ? "load-demo" : id === -3 ? "load-feature-demo" : id === -4 ? "load-workflow-demo" : id === -5 ? "load-seven-storey-demo" : undefined} onClick={() => execute(Number(id))}><CadIcon name={icon as CadIconName} size={18} />{label}</button>)}</div>}
      </div>
      <div className={styles.tabs} role="tablist" aria-label="Çizim sekmeleri" onKeyDown={event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault(); const index = PRODUCT_RIBBON_TABS.indexOf(current);
        const next = event.key === "Home" ? 0 : event.key === "End" ? PRODUCT_RIBBON_TABS.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + PRODUCT_RIBBON_TABS.length) % PRODUCT_RIBBON_TABS.length;
        p.onTab(PRODUCT_RIBBON_TABS[next].label); setMenu(null);
        root.current?.querySelector<HTMLButtonElement>(`[data-ribbon-index="${next}"]`)?.focus();
      }}>{PRODUCT_RIBBON_TABS.map((t, i) => <button type="button" key={t.id} role="tab" id={`ribbon-tab-${i}`} data-ribbon-index={i} aria-selected={t === current} tabIndex={t === current ? 0 : -1} aria-controls="hsyncad-native-ribbon" onClick={() => { p.onTab(t.label); setMenu(null); }}>{t.label}</button>)}</div>
      <span className={styles.availability}>Gri: uygulanmadı · *: kısmi</span>
      <div className={styles.search}><input aria-label="Komut ara" placeholder="Komut ara…" value={search} onChange={e => setSearch(e.target.value)} />
        {!!searchResults.length && <div className={styles.searchResults}>{searchResults.map(({ c, tab }) => <button type="button" key={c.id} onClick={() => { setSearch(""); p.onTab(tab); execute(c.commandId); }} disabled={!p.actions[c.commandId ?? 0] || p.actions[c.commandId ?? 0].disabled}>{c.label}<small>{tab}{!p.actions[c.commandId ?? 0] ? " · uygulanmadı" : ""}</small></button>)}</div>}
      </div>
    </div>
    <div className={styles.ribbon} id="hsyncad-native-ribbon" role="tabpanel" aria-labelledby={`ribbon-tab-${PRODUCT_RIBBON_TABS.indexOf(current)}`} data-testid="hsyncad-native-ribbon">
      {current.panels.map(panel => <section key={panel.id} className={styles.panel} aria-label={`${panel.label} grubu`} data-ribbon-panel={panel.label}>
        <div className={styles.commands}>{panel.commands.map(renderCommand)}</div><div className={styles.panelLabel}>{panel.label}</div>
      </section>)}
    </div>
    {menu && <div ref={menuRoot} role="menu" aria-label={`${menu.command.label} alt komutları`} className={styles.menu} style={{ left: menu.x, top: menu.y }}>{renderMenu(menu.command.children)}</div>}
  </header>;
}
