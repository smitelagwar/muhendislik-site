"use client";

import { Eye, EyeOff, Layers3, RotateCcw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DxfLayerRuntimeItem } from "@/lib/dokumantasyon/dxf-layer-runtime";

interface DxfLayerPanelProps {
  layers: DxfLayerRuntimeItem[];
  query: string;
  onQueryChange: (query: string) => void;
  onToggleLayer: (name: string, visible: boolean) => void;
  onShowAll: () => void;
  onHideAll: () => void;
  onResetSource: () => void;
  onClose: () => void;
}

function colorHex(color: number): string {
  if (!Number.isFinite(color)) return "#a1a1aa";
  return `#${Math.max(0, Math.min(0xffffff, Math.trunc(color))).toString(16).padStart(6, "0")}`;
}

export function DxfLayerPanel({
  layers,
  query,
  onQueryChange,
  onToggleLayer,
  onShowAll,
  onHideAll,
  onResetSource,
  onClose,
}: DxfLayerPanelProps) {
  const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
  const filteredLayers = normalizedQuery
    ? layers.filter((layer) => `${layer.displayName} ${layer.name}`.toLocaleLowerCase("tr-TR").includes(normalizedQuery))
    : layers;
  const visibleCount = layers.filter((layer) => layer.visible).length;

  return (
    <aside
      data-testid="cad-dxf-layer-panel"
      className="absolute inset-x-2 bottom-2 z-30 flex max-h-[58vh] flex-col overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-950/95 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:bottom-auto sm:right-3 sm:top-3 sm:w-[340px] sm:max-h-[70vh]"
      aria-label="DXF katmanları"
    >
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-3 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-100">
            <Layers3 className="h-4 w-4 text-amber-400" />
            Katmanlar
          </div>
          <p className="mt-0.5 text-[10px] text-zinc-500">{visibleCount}/{layers.length} görünür</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
          aria-label="Katman panelini kapat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-zinc-800 p-2.5">
        <label className="flex h-9 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-300 focus-within:border-amber-500/60">
          <Search className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Katman ara"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-zinc-600"
            data-testid="cad-dxf-layer-search"
          />
        </label>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <Button type="button" variant="outline" onClick={onShowAll} className="h-8 border-zinc-800 bg-zinc-900 px-2 text-[10px] text-zinc-200 hover:bg-zinc-800">
            Tümünü aç
          </Button>
          <Button type="button" variant="outline" onClick={onHideAll} className="h-8 border-zinc-800 bg-zinc-900 px-2 text-[10px] text-zinc-200 hover:bg-zinc-800">
            Tümünü kapat
          </Button>
          <Button type="button" variant="outline" onClick={onResetSource} className="h-8 border-zinc-800 bg-zinc-900 px-2 text-[10px] text-zinc-200 hover:bg-zinc-800">
            <RotateCcw className="mr-1 h-3 w-3" />Kaynak
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {filteredLayers.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-zinc-500">Eşleşen katman yok.</div>
        ) : (
          filteredLayers.map((layer) => (
            <button
              key={layer.name}
              type="button"
              data-testid={`cad-dxf-layer-${layer.name}`}
              data-visible={layer.visible ? "true" : "false"}
              onClick={() => onToggleLayer(layer.name, !layer.visible)}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-zinc-900"
              aria-pressed={layer.visible}
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full border border-white/20 shadow-sm"
                style={{ backgroundColor: colorHex(layer.color) }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className={layer.visible ? "block truncate text-xs font-medium text-zinc-100" : "block truncate text-xs font-medium text-zinc-500"}>
                  {layer.displayName}
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-1 text-[9px] text-zinc-600">
                  {layer.sourceOff && <span className="rounded bg-zinc-900 px-1 py-0.5">kaynakta kapalı</span>}
                  {layer.sourceFrozen && <span className="rounded bg-zinc-900 px-1 py-0.5">frozen</span>}
                  {layer.objectCount === 0 && <span className="rounded bg-zinc-900 px-1 py-0.5">boş</span>}
                </span>
              </span>
              {layer.visible ? <Eye className="h-4 w-4 shrink-0 text-emerald-400" /> : <EyeOff className="h-4 w-4 shrink-0 text-zinc-600" />}
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
