"use client";

import { useEffect, useRef, useState } from "react";
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
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

function findCadViewport(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>('[aria-label$="CAD görünümü"]');
}

function findLayerTrigger(
  triggerRef?: React.RefObject<HTMLButtonElement | null>
): HTMLButtonElement | null {
  if (typeof document === "undefined") return null;
  return (
    triggerRef?.current ??
    document.querySelector<HTMLButtonElement>('[data-testid="cad-tool-layers"]')
  );
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
  triggerRef,
}: CadLayerPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const restoreTargetRef = useRef<HTMLButtonElement | HTMLElement | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isMobileSheet, setIsMobileSheet] = useState(false);
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

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsMobileSheet(media.matches);
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, []);

  // Focus restore is shared, while focus trapping is mobile-modal only.
  useEffect(() => {
    previousActiveElement.current = document.activeElement as HTMLElement | null;
    restoreTargetRef.current = findLayerTrigger(triggerRef) ?? previousActiveElement.current;
    searchInputRef.current?.focus();

    return () => {
      const target = findLayerTrigger(triggerRef) ?? restoreTargetRef.current;
      target?.focus?.();
    };
  }, [triggerRef]);

  // Viewer historically rendered aria-hidden whenever the layer panel was open.
  // Enforce the actual interaction mode here: desktop is modeless and the canvas
  // remains exposed; mobile is a modal bottom sheet and the canvas is hidden.
  useEffect(() => {
    const viewport = findCadViewport();
    if (!viewport) return;

    const enforce = () => {
      if (isMobileSheet) {
        if (viewport.getAttribute("aria-hidden") !== "true") {
          viewport.setAttribute("aria-hidden", "true");
        }
        viewport.setAttribute("data-cad-layer-modal-inert", "true");
      } else {
        if (viewport.hasAttribute("aria-hidden")) viewport.removeAttribute("aria-hidden");
        viewport.removeAttribute("data-cad-layer-modal-inert");
      }
    };

    enforce();
    const observer = new MutationObserver(enforce);
    observer.observe(viewport, { attributes: true, attributeFilter: ["aria-hidden"] });

    return () => {
      observer.disconnect();
      viewport.removeAttribute("aria-hidden");
      viewport.removeAttribute("data-cad-layer-modal-inert");
    };
  }, [isMobileSheet, layers]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      // Desktop panel is intentionally modeless: users can tab back to the
      // toolbar/canvas. Mobile bottom sheet is modal and traps focus.
      if (!isMobileSheet || event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileSheet, onClose]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isMobileSheet) return;
    if ((event.target as HTMLElement).closest("button, input")) return;

    isDraggingRef.current = true;
    const panel = panelRef.current;
    const rect = panel?.getBoundingClientRect();
    const currentPosX = position ? position.x : (rect?.left ?? 0);
    const currentPosY = position ? position.y : (rect?.top ?? 0);

    dragStartRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      posX: currentPosX,
      posY: currentPosY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const deltaX = event.clientX - dragStartRef.current.startX;
    const deltaY = event.clientY - dragStartRef.current.startY;

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

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer may already be released by the browser.
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs sm:hidden"
        onClick={onClose}
        aria-hidden="true"
        data-testid="cad-layer-backdrop"
      />

      <aside
        ref={panelRef}
        data-testid="cad-layer-panel"
        data-cad-layer-mode={isMobileSheet ? "modal-sheet" : "modeless-floating"}
        style={
          position && !isMobileSheet
            ? { left: `${position.x}px`, top: `${position.y}px`, right: "auto", bottom: "auto" }
            : undefined
        }
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col overflow-hidden rounded-t-2xl border-t border-border/80 bg-background/95 shadow-2xl backdrop-blur-xl pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-3 sm:top-14 sm:w-[340px] sm:max-h-[70vh] sm:rounded-2xl sm:border sm:pb-0"
        aria-label="CAD Katman Yöneticisi"
        role="dialog"
        aria-modal={isMobileSheet ? "true" : "false"}
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="flex cursor-default items-center justify-between gap-3 border-b border-border px-3 py-2.5 select-none sm:cursor-grab active:sm:cursor-grabbing"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Layers className="h-4 w-4 text-amber-500" />
              Katmanlar
            </div>
            <p
              className="mt-0.5 text-[10px] text-muted-foreground"
              data-testid="cad-layer-visible-count"
              aria-live="polite"
            >
              {visibleCount} / {layers.length} katman görünür
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground sm:h-7 sm:w-7"
            aria-label="Katman panelini kapat"
            data-testid="cad-layer-close-button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-border p-2.5">
          <label className="flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs text-foreground focus-within:border-amber-500 sm:h-8">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Katman ara (örn. DUVAR, 0)..."
              className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              data-testid="cad-layer-search-input"
            />
          </label>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <Button type="button" variant="outline" size="sm" onClick={onShowAll} className="h-11 px-2 text-xs font-medium sm:h-7 sm:text-[11px]" data-testid="cad-layer-show-all">
              Tümünü Aç
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onHideAll} className="h-11 px-2 text-xs font-medium sm:h-7 sm:text-[11px]" data-testid="cad-layer-hide-all">
              Tümünü Kapat
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onResetSource} className="h-11 px-2 text-xs font-medium sm:h-7 sm:text-[11px]" data-testid="cad-layer-reset-source">
              <RotateCcw className="mr-1 h-3 w-3" />
              Kaynağa Dön
            </Button>
          </div>
        </div>

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
                className="flex min-h-[48px] items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs transition hover:bg-accent/50 sm:min-h-0"
              >
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
                    <span className="rounded bg-amber-500/20 px-1 text-[9px] font-semibold text-amber-500">Aktif</span>
                  ) : null}
                  {layer.isFrozen ? (
                    <span title="Donmuş (Frozen) Katman" className="inline-flex items-center">
                      <Snowflake className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                      <span className="sr-only">Donmuş (Frozen)</span>
                    </span>
                  ) : null}
                  {layer.isLocked ? (
                    <span title="Kilitli (Locked) Katman" className="inline-flex items-center">
                      <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="sr-only">Kilitli (Locked)</span>
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onIsolateLayer(layer.name)}
                    className="flex h-11 w-11 items-center justify-center rounded text-muted-foreground transition hover:bg-accent hover:text-foreground sm:h-6 sm:w-6"
                    title="Bu katmanı izole et"
                    data-testid={`cad-layer-isolate-${layer.name}`}
                    aria-label={`${layer.name} katmanını izole et`}
                  >
                    <Target className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleLayer(layer.name, !layer.visible)}
                    className={`flex h-11 w-11 items-center justify-center rounded transition sm:h-6 sm:w-6 ${
                      layer.visible
                        ? "text-amber-500 hover:bg-amber-500/10"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                    title={layer.visible ? "Katmanı gizle" : "Katmanı göster"}
                    data-testid={`cad-layer-toggle-${layer.name}`}
                    aria-label={`${layer.name} katmanını ${layer.visible ? "gizle" : "göster"}`}
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
    </>
  );
}
