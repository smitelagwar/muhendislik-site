"use client";

import { useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  Layers,
  Lock,
  RotateCcw,
  Search,
  Snowflake,
  X,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CadLayerItem } from "@/lib/dokumantasyon/cad-upstream/adapter";

export interface CadLayerPanelProps {
  layers: CadLayerItem[];
  query: string;
  onQueryChange: (query: string) => void;
  onToggleLayer: (name: string, visible: boolean) => void;
  onIsolateLayer: (name: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
  onResetSource: () => void;
  onClose: () => void;
}

export function CadLayerPanel({
  layers,
  query,
  onQueryChange,
  onToggleLayer,
  onIsolateLayer,
  onShowAll,
  onHideAll,
  onResetSource,
  onClose,
}: CadLayerPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
  });

  const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
  const filteredLayers = normalizedQuery
    ? layers.filter((layer) => layer.name.toLocaleLowerCase("tr-TR").includes(normalizedQuery))
    : layers;
  const visibleCount = layers.filter((layer) => layer.visible).length;

  // Dragging logic for desktop floating panel
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (window.innerWidth < 640) return; // Mobile uses fixed bottom sheet
    if ((e.target as HTMLElement).closest("button, input")) return;

    isDraggingRef.current = true;
    const panel = panelRef.current;
    const rect = panel?.getBoundingClientRect();
    const currentPosX = position ? position.x : (rect?.left ?? 0);
    const currentPosY = position ? position.y : (rect?.top ?? 0);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: currentPosX,
      posY: currentPosY,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const parent = panelRef.current?.parentElement;
    const parentRect = parent?.getBoundingClientRect();
    const panelWidth = 340;
    const panelHeight = 400;

    let nextX = dragStartRef.current.posX + deltaX;
    let nextY = dragStartRef.current.posY + deltaY;

    if (parentRect) {
      nextX = Math.max(parentRect.left + 10, Math.min(parentRect.right - panelWidth - 10, nextX));
      nextY = Math.max(parentRect.top + 10, Math.min(parentRect.bottom - panelHeight - 10, nextY));
    }

    setPosition({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  return (
    <aside
      ref={panelRef}
      data-testid="cad-layer-panel"
      style={
        position && typeof window !== "undefined" && window.innerWidth >= 640
          ? { left: `${position.x}px`, top: `${position.y}px`, right: "auto", bottom: "auto" }
          : undefined
      }
      className="absolute inset-x-2 bottom-2 z-30 flex max-h-[60vh] flex-col overflow-hidden rounded-2xl border border-border/80 bg-background/95 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:bottom-auto sm:right-3 sm:top-14 sm:w-[340px] sm:max-h-[70vh]"
      aria-label="CAD Katman Yöneticisi"
    >
      {/* Header with drag handle */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex cursor-default sm:cursor-grab items-center justify-between gap-3 border-b border-border px-3 py-2.5 select-none active:sm:cursor-grabbing"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Layers className="h-4 w-4 text-amber-500" />
            Katmanlar
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground" data-testid="cad-layer-visible-count">
            {visibleCount} / {layers.length} katman görünür
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground"
          aria-label="Katman panelini kapat"
          data-testid="cad-layer-close-button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search & Bulk Operations */}
      <div className="border-b border-border p-2.5">
        <label className="flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground focus-within:border-amber-500">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Katman ara (örn. DUVAR, 0)..."
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-xs"
            data-testid="cad-layer-search-input"
          />
        </label>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onShowAll}
            className="h-7 px-1.5 text-[11px]"
            data-testid="cad-layer-show-all"
          >
            Tümünü Aç
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onHideAll}
            className="h-7 px-1.5 text-[11px]"
            data-testid="cad-layer-hide-all"
          >
            Tümünü Kapat
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetSource}
            className="h-7 px-1.5 text-[11px]"
            data-testid="cad-layer-reset-source"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Kaynağa Dön
          </Button>
        </div>
      </div>

      {/* Layer List */}
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5" data-testid="cad-layer-list">
        {filteredLayers.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">Eşleşen katman bulunamadı.</div>
        ) : (
          filteredLayers.map((layer) => (
            <div
              key={layer.name}
              data-testid={`cad-layer-row-${layer.name}`}
              data-layer-name={layer.name}
              data-visible={layer.visible ? "true" : "false"}
              className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs transition hover:bg-accent/50"
            >
              {/* Color swatch and Layer name */}
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full border border-black/20"
                  style={{ backgroundColor: layer.color || "#888888" }}
                  aria-hidden="true"
                />
                <span className="truncate font-medium text-foreground" title={layer.name}>
                  {layer.name}
                </span>
                {layer.isCurrent ? (
                  <span className="rounded bg-amber-500/20 px-1 text-[9px] font-semibold text-amber-500">
                    Aktif
                  </span>
                ) : null}
                {layer.isFrozen ? (
                  <span title="Donmuş (Frozen) Katman">
                    <Snowflake className="h-3 w-3 shrink-0 text-blue-400" />
                  </span>
                ) : null}
                {layer.isLocked ? (
                  <span title="Kilitli (Locked) Katman">
                    <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                  </span>
                ) : null}
              </div>

              {/* Action buttons: Isolate and Toggle */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onIsolateLayer(layer.name)}
                  className="grid h-6 w-6 place-items-center rounded text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  title="Bu katmanı izole et"
                  data-testid={`cad-layer-isolate-${layer.name}`}
                  aria-label={`${layer.name} katmanını izole et`}
                >
                  <Target className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onToggleLayer(layer.name, !layer.visible)}
                  className={`grid h-6 w-6 place-items-center rounded transition ${
                    layer.visible
                      ? "text-amber-500 hover:bg-amber-500/10"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                  title={layer.visible ? "Katmanı gizle" : "Katmanı göster"}
                  data-testid={`cad-layer-toggle-${layer.name}`}
                  aria-label={`${layer.name} katman görünürlüğü`}
                  aria-pressed={layer.visible}
                >
                  {layer.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
