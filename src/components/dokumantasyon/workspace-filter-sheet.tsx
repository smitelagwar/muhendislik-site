"use client";

import { useRef } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OverlayPortal } from "./drive-v3/overlay-portal";

export interface WorkspaceFilters {
  type: "all" | "cad" | "pdf" | "image" | "other";
  date: "all" | "today" | "week" | "month";
  size: "all" | "small" | "medium" | "large";
  scope: "current" | "all";
  starredOnly: boolean;
}

interface WorkspaceFilterSheetProps {
  isOpen: boolean;
  filters: WorkspaceFilters;
  onChange: (filters: WorkspaceFilters) => void;
  onClose: () => void;
  matchCount?: number;
}

const emptyFilters: WorkspaceFilters = {
  type: "all",
  date: "all",
  size: "all",
  scope: "current",
  starredOnly: false,
};

export function WorkspaceFilterSheet({ isOpen, filters, onChange, onClose, matchCount }: WorkspaceFilterSheetProps) {
  const initialFocusRef = useRef<HTMLSelectElement>(null);

  if (!isOpen) return null;

  const update = <K extends keyof WorkspaceFilters>(key: K, value: WorkspaceFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <OverlayPortal
      isOpen={isOpen}
      onClose={onClose}
      title="Dosyaları filtrele"
      presentation="sheet"
      initialFocusRef={initialFocusRef}
    >
      <section className="w-full p-5 sm:p-6" data-testid="workspace-filter-sheet">
        <div className="flex items-center justify-between border-b border-border pb-3 pr-10">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <SlidersHorizontal className="h-5 w-5 text-amber-500" />
            <h2 id="workspace-filter-title">Dosyaları filtrele</h2>
          </div>
          {typeof matchCount === "number" && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              {matchCount} eşleşme
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <label className="space-y-1.5 text-muted-foreground">
            <span>Tür</span>
            <select
              ref={initialFocusRef}
              value={filters.type}
              onChange={(event) => update("type", event.target.value as WorkspaceFilters["type"])}
              className="h-10 w-full rounded-lg border border-input bg-background px-2 text-foreground"
            >
              <option value="all">Tüm türler</option><option value="cad">CAD</option><option value="pdf">PDF</option><option value="image">Görsel</option><option value="other">Diğer</option>
            </select>
          </label>
          <label className="space-y-1.5 text-muted-foreground">
            <span>Tarih</span>
            <select value={filters.date} onChange={(event) => update("date", event.target.value as WorkspaceFilters["date"])} className="h-10 w-full rounded-lg border border-input bg-background px-2 text-foreground">
              <option value="all">Tüm zamanlar</option><option value="today">Son 24 saat</option><option value="week">Son 7 gün</option><option value="month">Son 30 gün</option>
            </select>
          </label>
          <label className="space-y-1.5 text-muted-foreground">
            <span>Boyut</span>
            <select value={filters.size} onChange={(event) => update("size", event.target.value as WorkspaceFilters["size"])} className="h-10 w-full rounded-lg border border-input bg-background px-2 text-foreground">
              <option value="all">Tüm boyutlar</option><option value="small">5 MB altı</option><option value="medium">5–100 MB</option><option value="large">100 MB üstü</option>
            </select>
          </label>
          <label className="space-y-1.5 text-muted-foreground">
            <span>Kapsam</span>
            <select value={filters.scope} onChange={(event) => update("scope", event.target.value as WorkspaceFilters["scope"])} className="h-10 w-full rounded-lg border border-input bg-background px-2 text-foreground">
              <option value="current">Bu klasör</option><option value="all">Tüm klasörler</option>
            </select>
          </label>
        </div>

        <label className="mt-4 flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-xs text-foreground">
          <input type="checkbox" checked={filters.starredOnly} onChange={(event) => update("starredOnly", event.target.checked)} className="h-4 w-4 accent-amber-500" />
          Yalnız yıldızlı öğeler
        </label>

        <div className="mt-5 flex justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(emptyFilters)}>Temizle</Button>
          <Button type="button" size="sm" onClick={onClose} className="bg-amber-500 font-semibold text-zinc-950 hover:bg-amber-400">Uygula</Button>
        </div>
      </section>
    </OverlayPortal>
  );
}
