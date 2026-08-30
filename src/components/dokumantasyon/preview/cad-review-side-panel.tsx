"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  Ruler,
  MessageSquare,
  Layers,
  X,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CadReviewItem, CadReviewItemStatus } from "@/lib/dokumantasyon/cad-review/schema";
import { setupFocusTrap } from "./cad-review-shortcuts";

export type CadSidePanelTab = "search" | "measurements" | "comments" | "layers";

export interface CadTextSearchResultItem {
  id: string;
  text: string;
  layer: string;
  layoutName?: string;
  bounds: { min: { x: number; y: number }; max: { x: number; y: number } };
}

export interface CadMeasurementListItem {
  id: string;
  type: string;
  title: string;
  formattedValue: string;
  bounds?: { min: { x: number; y: number }; max: { x: number; y: number } };
}

export interface CadReviewSidePanelProps {
  activeTab: CadSidePanelTab | null;
  onSelectTab: (tab: CadSidePanelTab | null) => void;
  onClose: () => void;
  // Search
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  searchResults?: CadTextSearchResultItem[];
  onSelectSearchResult?: (result: CadTextSearchResultItem) => void;
  // Measurements
  measurements?: CadMeasurementListItem[];
  onDeleteMeasurement?: (id: string) => void;
  onSelectMeasurement?: (id: string) => void;
  // Comments / Markup
  comments?: CadReviewItem[];
  onStatusChange?: (id: string, status: CadReviewItemStatus) => void;
  onDeleteComment?: (id: string) => void;
  onSelectComment?: (id: string) => void;
  // Layers
  layers?: Array<{ name: string; isVisible: boolean; color?: number }>;
  onToggleLayer?: (name: string) => void;
  // Mobile / Modal
  isMobile?: boolean;
}

export function CadReviewSidePanel({
  activeTab,
  onSelectTab,
  onClose,
  searchQuery = "",
  onSearchQueryChange,
  searchResults = [],
  onSelectSearchResult,
  measurements = [],
  onDeleteMeasurement,
  onSelectMeasurement,
  comments = [],
  onStatusChange,
  onDeleteComment,
  onSelectComment,
  layers = [],
  onToggleLayer,
  isMobile = false,
}: CadReviewSidePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [commentStatusFilter, setCommentStatusFilter] = useState<"all" | CadReviewItemStatus>("all");
  const [layerSearch, setLayerSearch] = useState("");

  // Focus trap on mobile / modal drawer
  useEffect(() => {
    if (!activeTab || !containerRef.current) return;
    return setupFocusTrap(containerRef.current);
  }, [activeTab]);

  if (!activeTab) return null;

  const filteredComments = comments.filter((c) => {
    if (commentStatusFilter === "all") return true;
    return c.status === commentStatusFilter;
  });

  const filteredLayers = layers.filter((l) =>
    l.name.toLowerCase().includes(layerSearch.toLowerCase().trim())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
          data-cad-drawer-backdrop="true"
        />
      )}

      <aside
        ref={containerRef}
        className={
          isMobile
            ? "fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-border/80 bg-background/95 shadow-2xl backdrop-blur pb-safe"
            : "relative z-30 flex h-full w-80 shrink-0 flex-col border-l border-border/80 bg-background/95 shadow-lg backdrop-blur"
        }
        role="region"
        aria-label="CAD İnceleme Paneli"
        data-cad-review-panel="true"
      >
        {/* Panel Header with Tab Navigation */}
        <div className="flex items-center justify-between border-b border-border/60 p-2">
          <div
            className="flex items-center gap-1 overflow-x-auto"
            role="tablist"
            aria-label="Panel Sekmeleri"
          >
            <Button
              type="button"
              variant={activeTab === "search" ? "secondary" : "ghost"}
              size="sm"
              role="tab"
              id="tab-search"
              aria-selected={activeTab === "search"}
              aria-controls="panel-search"
              className="h-8 gap-1.5 px-2.5 text-xs font-medium"
              onClick={() => onSelectTab("search")}
            >
              <Search className="h-3.5 w-3.5" />
              Ara
            </Button>
            <Button
              type="button"
              variant={activeTab === "measurements" ? "secondary" : "ghost"}
              size="sm"
              role="tab"
              id="tab-measurements"
              aria-selected={activeTab === "measurements"}
              aria-controls="panel-measurements"
              className="h-8 gap-1.5 px-2.5 text-xs font-medium"
              onClick={() => onSelectTab("measurements")}
            >
              <Ruler className="h-3.5 w-3.5" />
              Ölçümler
              {measurements.length > 0 && (
                <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] text-primary">
                  {measurements.length}
                </span>
              )}
            </Button>
            <Button
              type="button"
              variant={activeTab === "comments" ? "secondary" : "ghost"}
              size="sm"
              role="tab"
              id="tab-comments"
              aria-selected={activeTab === "comments"}
              aria-controls="panel-comments"
              className="h-8 gap-1.5 px-2.5 text-xs font-medium"
              onClick={() => onSelectTab("comments")}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Yorumlar
              {comments.length > 0 && (
                <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] text-primary">
                  {comments.length}
                </span>
              )}
            </Button>
            <Button
              type="button"
              variant={activeTab === "layers" ? "secondary" : "ghost"}
              size="sm"
              role="tab"
              id="tab-layers"
              aria-selected={activeTab === "layers"}
              aria-controls="panel-layers"
              className="h-8 gap-1.5 px-2.5 text-xs font-medium"
              onClick={() => onSelectTab("layers")}
            >
              <Layers className="h-3.5 w-3.5" />
              Katmanlar
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Paneli Kapat"
            data-cad-panel-close="true"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tab 1: Text Search Panel */}
        {activeTab === "search" && (
          <div
            id="panel-search"
            role="tabpanel"
            aria-labelledby="tab-search"
            className="flex flex-1 flex-col overflow-hidden p-3"
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="CAD çiziminde metin ara..."
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange?.(e.target.value)}
                  className="h-9 pl-8 text-xs"
                  aria-label="Metin Arama Sorgusu"
                  data-cad-search-input="true"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5">
              {searchResults.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">
                  {searchQuery.trim() ? "Eşleşen metin bulunamadı." : "Aramak istediğiniz metni girin."}
                </p>
              ) : (
                searchResults.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => onSelectSearchResult?.(res)}
                    className="w-full rounded-md border border-border/50 bg-background/50 p-2.5 text-left text-xs transition-colors hover:border-primary/50 hover:bg-muted/40"
                    data-cad-search-result-item="true"
                  >
                    <div className="font-medium text-foreground">{res.text}</div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Katman: {res.layer}</span>
                      {res.layoutName && <span>{res.layoutName}</span>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Measurements Panel */}
        {activeTab === "measurements" && (
          <div
            id="panel-measurements"
            role="tabpanel"
            aria-labelledby="tab-measurements"
            className="flex flex-1 flex-col overflow-hidden p-3"
          >
            <div className="flex-1 overflow-y-auto space-y-2">
              {measurements.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">
                  Henüz bir ölçüm eklenmemiş. Toolbar üzerinden mesafe veya alan ölçümü başlatın.
                </p>
              ) : (
                measurements.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 p-2.5 shadow-2xs"
                    data-cad-measurement-item="true"
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => onSelectMeasurement?.(m.id)}
                    >
                      <div className="text-xs font-semibold text-foreground">{m.title}</div>
                      <div className="text-sm font-bold text-primary">{m.formattedValue}</div>
                    </div>
                    {onDeleteMeasurement && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onDeleteMeasurement(m.id)}
                        aria-label={`${m.title} ölçümünü sil`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Comments & Markup Panel */}
        {activeTab === "comments" && (
          <div
            id="panel-comments"
            role="tabpanel"
            aria-labelledby="tab-comments"
            className="flex flex-1 flex-col overflow-hidden p-3"
          >
            {/* Status filter buttons */}
            <div className="mb-3 flex flex-wrap gap-1">
              {(["all", "open", "question", "answered", "closed"] as const).map((st) => (
                <Button
                  key={st}
                  type="button"
                  variant={commentStatusFilter === st ? "secondary" : "outline"}
                  size="sm"
                  className="h-6 rounded-full px-2 text-[10px]"
                  onClick={() => setCommentStatusFilter(st)}
                  aria-pressed={commentStatusFilter === st}
                >
                  {st === "all"
                    ? "Tümü"
                    : st === "open"
                    ? "Açık"
                    : st === "question"
                    ? "Soru"
                    : st === "answered"
                    ? "Yanıtlandı"
                    : "Çözüldü"}
                </Button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredComments.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">
                  Filtreye uygun yorum bulunamadı.
                </p>
              ) : (
                filteredComments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-border/60 bg-background/60 p-2.5 shadow-2xs space-y-2"
                    data-cad-comment-item="true"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => onSelectComment?.(c.id)}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          {c.type === "comment_pin" ? `Pin #${c.pinIndex}` : c.type.toUpperCase()}
                          {(c as { title?: string }).title && (
                            <span className="text-muted-foreground font-normal">
                              - {(c as { title?: string }).title}
                            </span>
                          )}
                        </div>
                        {c.comment && (
                          <div className="mt-1 text-xs text-muted-foreground line-clamp-3">
                            {c.comment}
                          </div>
                        )}
                      </div>

                      {onDeleteComment && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => onDeleteComment(c.id)}
                          aria-label="Yorumu sil"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {/* Status switch buttons */}
                    {onStatusChange && (
                      <div className="flex items-center gap-1 pt-1 border-t border-border/40">
                        <Button
                          type="button"
                          size="sm"
                          variant={c.status === "open" ? "secondary" : "ghost"}
                          className="h-5 px-1.5 text-[9px]"
                          onClick={() => onStatusChange(c.id, "open")}
                        >
                          Açık
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={c.status === "question" ? "secondary" : "ghost"}
                          className="h-5 px-1.5 text-[9px]"
                          onClick={() => onStatusChange(c.id, "question")}
                        >
                          Soru
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={c.status === "closed" ? "secondary" : "ghost"}
                          className="h-5 px-1.5 text-[9px] text-green-600 dark:text-green-400"
                          onClick={() => onStatusChange(c.id, "closed")}
                        >
                          Çözüldü
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Layers Panel */}
        {activeTab === "layers" && (
          <div
            id="panel-layers"
            role="tabpanel"
            aria-labelledby="tab-layers"
            className="flex flex-1 flex-col overflow-hidden p-3"
          >
            <div className="mb-2">
              <Input
                type="search"
                placeholder="Katman filtrele..."
                value={layerSearch}
                onChange={(e) => setLayerSearch(e.target.value)}
                className="h-8 text-xs"
                aria-label="Katman Arama"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1">
              {filteredLayers.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">
                  Katman bulunamadı.
                </p>
              ) : (
                filteredLayers.map((l) => (
                  <label
                    key={l.name}
                    className="flex cursor-pointer items-center justify-between rounded-md p-2 text-xs transition-colors hover:bg-muted/50"
                  >
                    <span className="font-medium text-foreground truncate">{l.name}</span>
                    <input
                      type="checkbox"
                      checked={l.isVisible}
                      onChange={() => onToggleLayer?.(l.name)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      aria-label={`${l.name} katman görünürlüğü`}
                    />
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}