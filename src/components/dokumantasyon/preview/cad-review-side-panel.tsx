"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Focus,
  Layers,
  MessageSquare,
  PencilLine,
  Ruler,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CadReviewItem, CadReviewItemStatus } from "@/lib/dokumantasyon/cad-review/schema";
import { getCurrentCadReviewStore } from "@/lib/dokumantasyon/cad-review/active-store";
import {
  CadMeasurementFacade,
  type CadMeasurementBounds,
  type CadMeasurementViewModel,
} from "@/lib/dokumantasyon/cad-review/measurement-facade";
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
  bounds?: CadMeasurementBounds;
  isSelected?: boolean;
  isVisible?: boolean;
  segmentValues?: string[];
  segmentCount?: number;
}

export interface CadReviewSidePanelProps {
  activeTab: CadSidePanelTab | null;
  onSelectTab: (tab: CadSidePanelTab | null) => void;
  onClose: () => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  searchResults?: CadTextSearchResultItem[];
  onSelectSearchResult?: (result: CadTextSearchResultItem) => void;
  measurements?: CadMeasurementListItem[];
  onDeleteMeasurement?: (id: string) => void;
  onSelectMeasurement?: (id: string) => void;
  comments?: CadReviewItem[];
  onStatusChange?: (id: string, status: CadReviewItemStatus) => void;
  onDeleteComment?: (id: string) => void;
  onSelectComment?: (id: string) => void;
  layers?: Array<{ name: string; isVisible: boolean; color?: number }>;
  onToggleLayer?: (name: string) => void;
  isMobile?: boolean;
}

type CadZoomAdapter = {
  zoomToBounds?: (bounds: CadMeasurementBounds, margin?: number) => Promise<void> | void;
};

type CadHostWithAdapter = HTMLElement & { __cadAdapter?: CadZoomAdapter };

function resolveZoomAdapter(): CadZoomAdapter | null {
  if (typeof document === "undefined") return null;
  const root = document.querySelector("[data-cad-upstream-host='true']") as CadHostWithAdapter | null;
  if (root?.__cadAdapter) return root.__cadAdapter;
  const viewport = document.querySelector("[aria-label$='CAD görünümü']") as CadHostWithAdapter | null;
  return viewport?.__cadAdapter ?? null;
}

function measurementTypeLabel(type: string): string {
  if (type === "chain_distance") return "Sürekli Mesafe";
  if (type === "area") return "Alan";
  return "Mesafe";
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
  const [autoMobile, setAutoMobile] = useState(false);
  const [, setStoreRevision] = useState(0);
  const [expandedMeasurements, setExpandedMeasurements] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const sync = () => setAutoMobile(query.matches);
    sync();
    query.addEventListener?.("change", sync);
    return () => query.removeEventListener?.("change", sync);
  }, []);

  const activeStore = getCurrentCadReviewStore();
  useEffect(() => {
    if (!activeStore) return;
    return activeStore.subscribe(() => setStoreRevision((value) => value + 1));
  }, [activeStore]);

  const effectiveMobile = isMobile || autoMobile;
  const measurementFacade = activeStore ? new CadMeasurementFacade(activeStore) : null;
  const liveMeasurements: CadMeasurementViewModel[] = measurementFacade?.listMeasurements() ?? [];
  const effectiveMeasurements: CadMeasurementListItem[] = activeStore ? liveMeasurements : measurements;
  const activeStoreItems = activeStore?.getItems() ?? [];
  const effectiveComments = activeStore
    ? activeStoreItems.filter(
        (item) => item.type === "comment_pin" || item.type === "text" || item.type === "callout"
      )
    : comments;

  useEffect(() => {
    if (!activeTab || !containerRef.current || !effectiveMobile) return;
    return setupFocusTrap(containerRef.current);
  }, [activeTab, effectiveMobile]);

  if (!activeTab) return null;

  const filteredComments = effectiveComments.filter((comment) => {
    if (commentStatusFilter === "all") return true;
    return comment.status === commentStatusFilter;
  });

  const filteredLayers = layers.filter((layer) =>
    layer.name.toLowerCase().includes(layerSearch.toLowerCase().trim())
  );

  const selectMeasurement = (id: string) => {
    measurementFacade?.selectMeasurement(id);
    onSelectMeasurement?.(id);
  };

  const zoomMeasurement = async (measurement: CadMeasurementListItem) => {
    selectMeasurement(measurement.id);
    if (!measurement.bounds) return;
    await resolveZoomAdapter()?.zoomToBounds?.(measurement.bounds, 0.22);
  };

  const deleteMeasurement = (id: string) => {
    if (measurementFacade) measurementFacade.deleteMeasurement(id);
    else onDeleteMeasurement?.(id);
  };

  const toggleVisibility = (measurement: CadMeasurementListItem) => {
    if (!measurementFacade) return;
    measurementFacade.setMeasurementVisible(measurement.id, measurement.isVisible === false);
  };

  const startRename = (measurement: CadMeasurementListItem) => {
    setRenamingId(measurement.id);
    setRenameDraft(measurement.title);
  };

  const saveRename = () => {
    if (!renamingId || !measurementFacade) return;
    const next = renameDraft.trim();
    if (next) measurementFacade.renameMeasurement(renamingId, next);
    setRenamingId(null);
    setRenameDraft("");
  };

  const toggleExpanded = (id: string) => {
    setExpandedMeasurements((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      {effectiveMobile && (
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
          effectiveMobile
            ? "fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-border/80 bg-background/95 shadow-2xl backdrop-blur pb-safe"
            : "relative z-30 flex h-full w-80 shrink-0 flex-col border-l border-border/80 bg-background/95 shadow-lg backdrop-blur"
        }
        role="region"
        aria-label="CAD İnceleme Paneli"
        data-cad-review-panel="true"
        data-cad-panel-mobile={effectiveMobile ? "true" : "false"}
      >
        <div className="flex items-center justify-between border-b border-border/60 p-2">
          <div className="flex items-center gap-1 overflow-x-auto" role="tablist" aria-label="Panel Sekmeleri">
            <Button type="button" variant={activeTab === "search" ? "secondary" : "ghost"} size="sm" role="tab" id="tab-search" aria-selected={activeTab === "search"} aria-controls="panel-search" className="h-8 gap-1.5 px-2.5 text-xs font-medium" onClick={() => onSelectTab("search")}>
              <Search className="h-3.5 w-3.5" /> Ara
            </Button>
            <Button type="button" variant={activeTab === "measurements" ? "secondary" : "ghost"} size="sm" role="tab" id="tab-measurements" aria-selected={activeTab === "measurements"} aria-controls="panel-measurements" className="h-8 gap-1.5 px-2.5 text-xs font-medium" onClick={() => onSelectTab("measurements")} data-testid="cad-measurements-tab">
              <Ruler className="h-3.5 w-3.5" /> Ölçümler
              {effectiveMeasurements.length > 0 && (
                <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] text-primary">{effectiveMeasurements.length}</span>
              )}
            </Button>
            <Button type="button" variant={activeTab === "comments" ? "secondary" : "ghost"} size="sm" role="tab" id="tab-comments" aria-selected={activeTab === "comments"} aria-controls="panel-comments" className="h-8 gap-1.5 px-2.5 text-xs font-medium" onClick={() => onSelectTab("comments")}>
              <MessageSquare className="h-3.5 w-3.5" /> Yorumlar
              {effectiveComments.length > 0 && (
                <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] text-primary">{effectiveComments.length}</span>
              )}
            </Button>
            <Button type="button" variant={activeTab === "layers" ? "secondary" : "ghost"} size="sm" role="tab" id="tab-layers" aria-selected={activeTab === "layers"} aria-controls="panel-layers" className="h-8 gap-1.5 px-2.5 text-xs font-medium" onClick={() => onSelectTab("layers")}>
              <Layers className="h-3.5 w-3.5" /> Katmanlar
            </Button>
          </div>

          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground" onClick={onClose} aria-label="Paneli Kapat" data-cad-panel-close="true">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {activeTab === "search" && (
          <div id="panel-search" role="tabpanel" aria-labelledby="tab-search" className="flex flex-1 flex-col overflow-hidden p-3">
            <div className="mb-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="CAD çiziminde metin ara..." value={searchQuery} onChange={(event) => onSearchQueryChange?.(event.target.value)} className="h-9 pl-8 text-xs" aria-label="Metin Arama Sorgusu" data-cad-search-input="true" autoFocus />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5">
              {searchResults.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">{searchQuery.trim() ? "Eşleşen metin bulunamadı." : "Aramak istediğiniz metni girin."}</p>
              ) : (
                searchResults.map((result) => (
                  <button key={result.id} type="button" onClick={() => onSelectSearchResult?.(result)} className="w-full rounded-md border border-border/50 bg-background/50 p-2.5 text-left text-xs transition-colors hover:border-primary/50 hover:bg-muted/40" data-cad-search-result-item="true">
                    <div className="font-medium text-foreground">{result.text}</div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground"><span>Katman: {result.layer}</span>{result.layoutName && <span>{result.layoutName}</span>}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "measurements" && (
          <div id="panel-measurements" role="tabpanel" aria-labelledby="tab-measurements" className="flex flex-1 flex-col overflow-hidden p-3" data-testid="cad-measurement-list">
            <div className="mb-2 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Mesafe · Sürekli Mesafe · Alan</span>
              <span>{effectiveMeasurements.length} kayıt</span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {effectiveMeasurements.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">Henüz ölçüm yok. Mesafe, Sürekli Mesafe veya Alan aracını kullanın.</p>
              ) : (
                effectiveMeasurements.map((measurement) => {
                  const expanded = expandedMeasurements.has(measurement.id);
                  const isChain = measurement.type === "chain_distance";
                  const selected = measurement.isSelected === true;
                  const visible = measurement.isVisible !== false;
                  return (
                    <div
                      key={measurement.id}
                      className={`rounded-lg border p-2.5 shadow-2xs transition-colors ${selected ? "border-primary/70 bg-primary/8" : "border-border/60 bg-background/60"}`}
                      data-cad-measurement-item="true"
                      data-testid={`cad-measurement-${measurement.id}`}
                      data-cad-measurement-type={measurement.type}
                      data-cad-measurement-selected={selected ? "true" : "false"}
                      data-cad-measurement-visible={visible ? "true" : "false"}
                    >
                      <div className="flex items-start gap-2">
                        {isChain ? (
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => toggleExpanded(measurement.id)} aria-label={expanded ? "Segmentleri gizle" : "Segmentleri göster"} data-testid="cad-measurement-expand">
                            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          </Button>
                        ) : <div className="w-7 shrink-0" />}

                        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => selectMeasurement(measurement.id)}>
                          {renamingId === measurement.id ? (
                            <input
                              autoFocus
                              value={renameDraft}
                              maxLength={128}
                              onChange={(event) => setRenameDraft(event.target.value)}
                              onClick={(event) => event.stopPropagation()}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") { event.preventDefault(); saveRename(); }
                                if (event.key === "Escape") { event.preventDefault(); setRenamingId(null); setRenameDraft(""); }
                              }}
                              className="h-7 w-full rounded border border-border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                              aria-label="Ölçüm adını düzenle"
                              data-testid="cad-measurement-rename-input"
                            />
                          ) : (
                            <div className="truncate text-xs font-semibold text-foreground">{measurement.title}</div>
                          )}
                          <div className="mt-0.5 text-[10px] text-muted-foreground">{measurementTypeLabel(measurement.type)}{isChain && measurement.segmentCount !== undefined ? ` · ${measurement.segmentCount} segment` : ""}</div>
                          <div className="mt-1 text-sm font-bold text-primary">{measurement.formattedValue}</div>
                        </button>

                        <div className="grid shrink-0 grid-cols-2 gap-1">
                          {renamingId === measurement.id ? (
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={saveRename} aria-label="Ölçüm adını kaydet"><Check className="h-3.5 w-3.5" /></Button>
                          ) : (
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => startRename(measurement)} aria-label={`${measurement.title} adını değiştir`} data-testid="cad-measurement-rename"><PencilLine className="h-3.5 w-3.5" /></Button>
                          )}
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => void zoomMeasurement(measurement)} aria-label={`${measurement.title} ölçümüne git`} data-testid="cad-measurement-zoom"><Focus className="h-3.5 w-3.5" /></Button>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleVisibility(measurement)} aria-label={visible ? `${measurement.title} ölçümünü gizle` : `${measurement.title} ölçümünü göster`} data-testid="cad-measurement-visibility">{visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}</Button>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteMeasurement(measurement.id)} aria-label={`${measurement.title} ölçümünü sil`} data-testid="cad-measurement-delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>

                      {isChain && expanded ? (
                        <div className="mt-2 space-y-1 border-t border-border/50 pt-2" data-testid="cad-chain-segment-list">
                          {(measurement.segmentValues ?? []).map((segment, index) => (
                            <div key={`${measurement.id}-segment-${index}`} className="flex items-center justify-between rounded bg-muted/35 px-2 py-1 text-[10px]">
                              <span className="text-muted-foreground">Segment {index + 1}</span>
                              <span className="font-semibold text-foreground">{segment}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === "comments" && (
          <div id="panel-comments" role="tabpanel" aria-labelledby="tab-comments" className="flex flex-1 flex-col overflow-hidden p-3">
            <div className="mb-3 flex flex-wrap gap-1">
              {(["all", "open", "question", "answered", "closed"] as const).map((status) => (
                <Button key={status} type="button" variant={commentStatusFilter === status ? "secondary" : "outline"} size="sm" className="h-6 rounded-full px-2 text-[10px]" onClick={() => setCommentStatusFilter(status)} aria-pressed={commentStatusFilter === status}>
                  {status === "all" ? "Tümü" : status === "open" ? "Açık" : status === "question" ? "Soru" : status === "answered" ? "Yanıtlandı" : "Çözüldü"}
                </Button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredComments.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">Filtreye uygun yorum bulunamadı.</p>
              ) : (
                filteredComments.map((comment) => (
                  <div key={comment.id} className="rounded-lg border border-border/60 bg-background/60 p-2.5 shadow-2xs space-y-2" data-cad-comment-item="true">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 cursor-pointer" onClick={() => onSelectComment?.(comment.id)}>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          {comment.type === "comment_pin" ? `Pin #${comment.pinIndex}` : comment.type.toUpperCase()}
                          {(comment as { title?: string }).title && <span className="text-muted-foreground font-normal">- {(comment as { title?: string }).title}</span>}
                        </div>
                        {comment.comment && <div className="mt-1 text-xs text-muted-foreground line-clamp-3">{comment.comment}</div>}
                      </div>
                      {onDeleteComment && <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => onDeleteComment(comment.id)} aria-label="Yorumu sil"><Trash2 className="h-3 w-3" /></Button>}
                    </div>
                    {onStatusChange && (
                      <div className="flex items-center gap-1 pt-1 border-t border-border/40">
                        <Button type="button" size="sm" variant={comment.status === "open" ? "secondary" : "ghost"} className="h-5 px-1.5 text-[9px]" onClick={() => onStatusChange(comment.id, "open")}>Açık</Button>
                        <Button type="button" size="sm" variant={comment.status === "question" ? "secondary" : "ghost"} className="h-5 px-1.5 text-[9px]" onClick={() => onStatusChange(comment.id, "question")}>Soru</Button>
                        <Button type="button" size="sm" variant={comment.status === "closed" ? "secondary" : "ghost"} className="h-5 px-1.5 text-[9px] text-green-600 dark:text-green-400" onClick={() => onStatusChange(comment.id, "closed")}>Çözüldü</Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "layers" && (
          <div id="panel-layers" role="tabpanel" aria-labelledby="tab-layers" className="flex flex-1 flex-col overflow-hidden p-3">
            <div className="mb-2"><Input type="search" placeholder="Katman filtrele..." value={layerSearch} onChange={(event) => setLayerSearch(event.target.value)} className="h-8 text-xs" aria-label="Katman Arama" /></div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {filteredLayers.length === 0 ? <p className="p-4 text-center text-xs text-muted-foreground">Katman bulunamadı.</p> : filteredLayers.map((layer) => (
                <label key={layer.name} className="flex cursor-pointer items-center justify-between rounded-md p-2 text-xs transition-colors hover:bg-muted/50">
                  <span className="font-medium text-foreground truncate">{layer.name}</span>
                  <input type="checkbox" checked={layer.isVisible} onChange={() => onToggleLayer?.(layer.name)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" aria-label={`${layer.name} katman görünürlüğü`} />
                </label>
              ))}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
