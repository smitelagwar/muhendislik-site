"use client";
import React, { useMemo, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Folder, MoreVertical, CheckSquare, Square } from "lucide-react";
import type { DokFile, DokFolder } from "@/lib/dokumantasyon/types";
import type { ItemActivationSource } from "./drive-v3/explorer-activation";
import { getFileIcon, formatBytes } from "./ui-helpers";
import s from "./mobile-workspace.module.css";

type Item = DokFile | DokFolder;
export type MobileBucket = { key: string; label: string; folders: DokFolder[]; files: DokFile[] };
type Block = { key: string; label?: string; items: Item[] };
const date = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });
export function mobileMetadata(item: Item) {
  const stamp = new Date(item.updated_at);
  const label = Number.isNaN(stamp.valueOf()) ? "" : date.format(stamp);
  return "parent_id" in item ? `Klasör · ${label}` : `${item.extension.toLocaleUpperCase("tr-TR")} · ${formatBytes(item.size_bytes)} · ${label}`;
}
export function MobileExplorer({ items, buckets, grouped, view, selectedIds, selection, scrollRef, onActivate, onMore, persistenceKey }: {
  items: Item[]; buckets: MobileBucket[]; grouped: boolean; view: "list" | "grid";
  selectedIds: Set<string>; selection: boolean; scrollRef: React.RefObject<HTMLDivElement | null>;
  onActivate: (item: Item, source: ItemActivationSource, e: React.MouseEvent) => void;
  onMore: (item: Item) => void; persistenceKey: string;
}) {
  const blocks = useMemo(() => {
    const result: Block[] = [];
    const collections = grouped ? buckets : [{ key: "all", label: "", folders: [], files: [] }];
    for (const bucket of collections) {
      const entries = grouped ? [...bucket.folders, ...bucket.files] : items;
      if (!entries.length) continue;
      if (grouped) result.push({ key: `group:${bucket.key}`, label: bucket.label, items: [] });
      const step = view === "grid" ? 2 : 1;
      for (let i = 0; i < entries.length; i += step) result.push({ key: `${bucket.key}:${entries[i].id}`, items: entries.slice(i, i + step) });
    }
    return result;
  }, [items, buckets, grouped, view]);
  const virtualizer = useVirtualizer({ count: blocks.length, getScrollElement: () => scrollRef.current,
    estimateSize: i => blocks[i].label ? 32 : view === "grid" ? 168 : 56,
    getItemKey: i => blocks[i].key, overscan: 8 });
  const anchor = useRef<{ id: string; offset: number } | null>(null);
  const positions = useRef(new Map<string, { id: string; offset: number }>());
  const previous = useRef(persistenceKey);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const save = () => {
      const row = virtualizer.getVirtualItems().find(row => row.end > el.scrollTop);
      if (row) {
        anchor.current = { id: blocks[row.index].items[0]?.id || blocks[row.index].key, offset: el.scrollTop - row.start };
        positions.current.set(persistenceKey, anchor.current);
      }
    };
    el.addEventListener("scroll", save, { passive: true });
    return () => { el.removeEventListener("scroll", save); };
  }, [blocks, persistenceKey, scrollRef, virtualizer]);
  useLayoutEffect(() => {
    const saved = previous.current === persistenceKey ? anchor.current : positions.current.get(persistenceKey);
    previous.current = persistenceKey;
    virtualizer.measure();
    if (saved) {
      const i = blocks.findIndex(b => b.key === saved.id || b.items.some(item => item.id === saved.id));
      if (i >= 0) { virtualizer.scrollToIndex(i, { align: "start" }); const row = virtualizer.getVirtualItems().find(r => r.index === i); if (row) virtualizer.scrollToOffset(row.start + saved.offset); }
    } else if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [view, grouped, persistenceKey, blocks.length, virtualizer, scrollRef]);
  const render = (item: Item) => {
    const folder = "parent_id" in item;
    const name = folder ? item.name : item.display_name;
    const icon = folder ? <Folder size={20} className="text-amber-500" aria-hidden /> : getFileIcon(item.extension, item.mime_type);
    const controls = selection ? <button className={s.icon} data-selection-control aria-pressed={selectedIds.has(item.id)} aria-label={`${name} ${selectedIds.has(item.id) ? "seçimini kaldır" : "seç"}`} onClick={e => onActivate(item,"select-control",e)}>{selectedIds.has(item.id) ? <CheckSquare size={20} aria-hidden /> : <Square size={20} aria-hidden />}</button> : <button className={s.icon} aria-label={`${name} işlemleri`} data-testid="dok-item-more" onClick={e => { e.stopPropagation(); onMore(item); }}><MoreVertical size={20} aria-hidden /></button>;
    return <div key={item.id} data-testid={folder ? "dok-folder-row" : "dok-file-row"} data-file-id={folder ? undefined : item.id} data-folder-id={folder ? item.id : undefined} data-selected={selectedIds.has(item.id)} data-mobile-item
      className={view === "list" ? s.row : s.tile}
      onClick={e => onActivate(item,"body",e)} onDoubleClick={e => onActivate(item,"double",e)} onContextMenu={e => onActivate(item,"context",e)}>
      {view === "grid" ? <div className={s.tileTop}>{icon}{controls}</div> : <>{selection && controls}{icon}</>}
      <div className={s.content}>
        {folder ? <button className={s.name} data-testid="dok-folder-name" onClick={e => onActivate(item,"name",e)}>{name}</button> : <Link href={`/dokumantasyon/dosya/${item.id}`} className={s.name} data-testid="dok-file-name" onClick={e => onActivate(item,"name",e)}>{name}</Link>}
        <span className={s.meta}>{mobileMetadata(item)}</span>
      </div>
      {view === "list" && !selection && controls}
    </div>;
  };
  return <div style={{ height: virtualizer.getTotalSize(), position:"relative", width:"100%" }} data-testid="dok-mobile-virtual-list">
    {virtualizer.getVirtualItems().map(row => { const block = blocks[row.index]; return <div key={row.key} data-index={row.index} ref={virtualizer.measureElement}
      style={{ position:"absolute", top:0, left:0, width:"100%", transform:`translateY(${row.start}px)`, ...(view === "grid" && !block.label ? { display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:8, padding:"0 10px 8px" } : {}) }}>
      {block.label ? <div className={s.group}>{block.label}</div> : block.items.map(render)}
    </div>; })}
  </div>;
}
