// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — CAD STUDIO TOP RIBBON TOOLBAR
// AutoCAD / Revit / Bluebeam Revu tarzı tam genişlikli ergonomik üst araç çubuğu
// ============================================================================

"use client";

import React from "react";
import {
  Circle,
  Cloud,
  Eraser,
  Eye,
  Hand,
  Layers,
  Magnet,
  Maximize,
  MessageSquare,
  MousePointer,
  Pencil,
  Pin,
  Redo2,
  Ruler,
  Search,
  Split,
  Square,
  Trash2,
  Type,
  Undo2,
  ChevronDown,
  Download,
  FileCode,
  Share2,
  Check,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type {
  CadReviewTool,
  CadActiveMarkupStyle,
} from "@/lib/dokumantasyon/cad-review/store";
import type { CadSidePanelTab } from "./cad-review-side-panel";
import type {
  CadBackgroundColorOption,
  CadUpstreamDisplayMode,
} from "@/lib/dokumantasyon/cad-upstream/adapter";
import { cn } from "@/lib/utils";

export const CAD_MARKUP_COLORS = [
  { name: "Kırmızı", hex: "#ef4444" },
  { name: "Turuncu", hex: "#f97316" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Sarı", hex: "#eab308" },
  { name: "Yeşil", hex: "#10b981" },
  { name: "Mavi", hex: "#3b82f6" },
  { name: "Mor", hex: "#a855f7" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Beyaz", hex: "#ffffff" },
  { name: "Siyah", hex: "#000000" },
];

export const CAD_STROKE_WIDTHS = [
  { label: "1px", value: 1, desc: "İnce" },
  { label: "2px", value: 2, desc: "Standart" },
  { label: "3px", value: 3, desc: "Orta" },
  { label: "5px", value: 5, desc: "Kalın" },
  { label: "8px", value: 8, desc: "Vurgu" },
];

export const CAD_LINE_STYLES = [
  { label: "Düz", value: "continuous" as const, pattern: "────────" },
  { label: "Kesikli", value: "dashed" as const, pattern: "── ── ──" },
  { label: "Noktalı", value: "dotted" as const, pattern: "• • • • •" },
];

export interface CadStudioRibbonProps {
  // Navigation
  activeTool: CadReviewTool | "pan" | null;
  onSelectTool: (tool: CadReviewTool) => void;
  onPan: () => void;
  onFitView: () => void;

  // Display & Style
  displayMode: CadUpstreamDisplayMode;
  onSelectDisplayMode: (mode: CadUpstreamDisplayMode) => void;
  lineWeightVisible: boolean;
  onToggleLineWeight: () => void;
  backgroundColor: CadBackgroundColorOption;
  onSelectBackgroundColor: (color: CadBackgroundColorOption) => void;

  // Active Markup Style (Aşama 2: Renk, Kalınlık, Çizgi Tipi, Dolgu)
  markupStyle?: CadActiveMarkupStyle;
  onUpdateMarkupStyle?: (style: Partial<CadActiveMarkupStyle>) => void;

  // Measure
  onStartDistance: () => void;
  onStartChainDistance?: () => void;
  onStartArea: () => void;
  onClearMeasurements: () => void;

  // Panels & Settings
  activePanelTab: CadSidePanelTab | null;
  onTogglePanelTab: (tab: CadSidePanelTab) => void;
  layerPanelOpen: boolean;
  onToggleLayerPanel: () => void;
  snapPanelOpen: boolean;
  onToggleSnapPanel: () => void;
  snapEnabled?: boolean;
  layersCount?: number;
  commentsCount?: number;

  // History & Status
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  saveStatus?: "clean" | "dirty" | "saving";

  // Downloads & Exports
  onDownloadOriginal?: () => void;
  onDownloadDxf?: () => void;
  onOpenExportDialog?: () => void;
  sourceFileName?: string;
}

export function CadStudioRibbon({
  activeTool,
  onSelectTool,
  onPan,
  onFitView,
  displayMode,
  onSelectDisplayMode,
  lineWeightVisible,
  onToggleLineWeight,
  backgroundColor,
  onSelectBackgroundColor,
  markupStyle = {
    color: "#ff3b30",
    strokeWidth: 2,
    lineDash: "continuous",
    opacity: 1,
    fontSize: 16,
  },
  onUpdateMarkupStyle,
  onStartDistance,
  onStartChainDistance,
  onStartArea,
  onClearMeasurements,
  activePanelTab,
  onTogglePanelTab,
  layerPanelOpen,
  onToggleLayerPanel,
  snapPanelOpen,
  onToggleSnapPanel,
  snapEnabled = true,
  layersCount = 0,
  commentsCount = 0,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  saveStatus = "clean",
  onDownloadOriginal,
  onDownloadDxf,
  onOpenExportDialog,
}: CadStudioRibbonProps) {
  const btnBase = "h-9 px-3 text-xs font-semibold rounded-xl transition-all shrink-0 flex items-center gap-2 select-none shadow-sm";
  const iconBtnBase = "h-9 w-9 p-0 rounded-xl transition-all shrink-0 flex items-center justify-center select-none shadow-sm";

  const isShapeActive =
    activeTool === "shape_rect" ||
    activeTool === "shape_circle" ||
    activeTool === "shape_cloud";

  return (
    <div
      data-testid="cad-studio-ribbon"
      data-cad-studio-ribbon="true"
      className="flex h-13 sm:h-14 w-full shrink-0 items-center justify-between border-b border-border/80 bg-card/95 px-2 sm:px-3.5 text-foreground backdrop-blur-xl z-20 select-none overflow-x-auto scrollbar-none shadow-md"
    >
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-max" data-testid="cad-left-quick-rail">
        {/* ── 1. GEZİNME (NAVIGATE) GRUBU ── */}
        <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-muted/50 p-1" role="toolbar" aria-label="Gezinme Araçları">
          <Button
            type="button"
            size="sm"
            variant={activeTool === "select" ? "secondary" : "ghost"}
            className={cn(
              btnBase,
              activeTool === "select"
                ? "bg-background text-foreground shadow font-bold border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            )}
            onClick={() => onSelectTool("select")}
            title="Seç / Gezin [V]"
            data-testid="cad-tool-select"
            aria-label="Seç ve Gezin"
          >
            <MousePointer className="h-4.5 w-4.5 text-amber-500" />
            <span className="hidden md:inline text-xs">Seç</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant={activeTool === "pan" || activeTool === null ? "secondary" : "ghost"}
            className={cn(
              btnBase,
              (activeTool === "pan" || activeTool === null)
                ? "bg-background text-foreground shadow font-bold border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            )}
            onClick={onPan}
            title="Kaydır (Pan) [P]"
            data-testid="cad-tool-pan"
            aria-label="Kaydır (Pan)"
          >
            <Hand className="h-4.5 w-4.5 text-amber-500" />
            <span className="hidden md:inline text-xs">Kaydır</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn(iconBtnBase, "text-muted-foreground hover:text-foreground hover:bg-background/80")}
            onClick={onFitView}
            title="Ekrana Sığdır [F]"
            data-testid="cad-tool-fit"
            aria-label="Görünüme sığdır"
          >
            <Maximize className="h-4.5 w-4.5" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border/60 shrink-0" aria-hidden="true" />

        {/* ── 2. GÖRÜNÜM & RENK (VIEW & DISPLAY) GRUBU ── */}
        <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-muted/50 p-1" role="toolbar" aria-label="Görünüm Seçenekleri">
          <Button
            type="button"
            size="sm"
            variant={displayMode === "source" ? "secondary" : "ghost"}
            className={cn(
              btnBase,
              displayMode === "source"
                ? "bg-background text-foreground shadow font-bold border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            )}
            onClick={() => onSelectDisplayMode("source")}
            title="Gerçek Renkler"
            data-testid="cad-display-source"
          >
            <Eye className="h-4.5 w-4.5 text-amber-500" />
            <span className="hidden lg:inline text-xs">Gerçek</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant={displayMode === "monochrome" ? "secondary" : "ghost"}
            className={cn(
              btnBase,
              displayMode === "monochrome"
                ? "bg-background text-foreground shadow font-bold border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            )}
            onClick={() => onSelectDisplayMode("monochrome")}
            title="Siyah-Beyaz Modu"
            data-testid="cad-display-monochrome"
          >
            <span className="hidden lg:inline text-xs">Siyah-Beyaz</span>
            <span className="lg:hidden text-xs">S/B</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant={lineWeightVisible ? "secondary" : "ghost"}
            className={cn(
              btnBase,
              "px-2.5",
              lineWeightVisible
                ? "bg-background text-foreground shadow font-bold border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            )}
            onClick={onToggleLineWeight}
            title="Çizgi Kalınlıklarını Aç / Kapat"
            data-testid="cad-display-lineweight"
          >
            <span className="text-xs font-mono font-bold">LW</span>
          </Button>

          {/* Arka Plan Rengi Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className={cn(btnBase, "text-muted-foreground hover:text-foreground hover:bg-background/80 px-2.5")}
                title="Arka Plan Rengi"
                data-testid="cad-tool-view-settings"
              >
                <span
                  className="h-3 w-3 rounded-full border border-white/30 shadow-sm"
                  style={{
                    backgroundColor:
                      backgroundColor === "autocad"
                        ? "#212830"
                        : backgroundColor === "black"
                        ? "#000000"
                        : "#ffffff",
                  }}
                />
                <span className="hidden xl:inline text-xs capitalize">{backgroundColor}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44 bg-card/95 border-border shadow-2xl backdrop-blur-xl rounded-xl">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold">Arka Plan Rengi</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onSelectBackgroundColor("autocad")}
                className="flex items-center gap-2.5 text-xs cursor-pointer font-medium rounded-lg"
                data-testid="cad-bg-autocad"
              >
                <span className="h-3.5 w-3.5 rounded-full border border-white/30 bg-[#212830]" />
                <span>AutoCAD Koyu</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onSelectBackgroundColor("black")}
                className="flex items-center gap-2.5 text-xs cursor-pointer font-medium rounded-lg"
                data-testid="cad-bg-black"
              >
                <span className="h-3.5 w-3.5 rounded-full border border-white/30 bg-black" />
                <span>Tam Siyah</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onSelectBackgroundColor("white")}
                className="flex items-center gap-2.5 text-xs cursor-pointer font-medium rounded-lg"
                data-testid="cad-bg-white"
              >
                <span className="h-3.5 w-3.5 rounded-full border border-black/30 bg-white" />
                <span>Beyaz</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="h-6 w-px bg-border/60 shrink-0" aria-hidden="true" />

        {/* ── 3. ÖLÇÜM (MEASURE) GRUBU ── */}
        <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-muted/50 p-1" role="toolbar" aria-label="Ölçüm Araçları">
          <Button
            type="button"
            size="sm"
            variant={activeTool === "distance" ? "default" : "ghost"}
            className={cn(
              btnBase,
              activeTool === "distance"
                ? "bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-md ring-2 ring-blue-500/30"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            )}
            onClick={onStartDistance}
            title="Mesafe Ölç [T]"
            data-testid="cad-tool-distance"
            aria-label="Mesafe ölç"
          >
            <Ruler className="h-4.5 w-4.5" />
            <span className="hidden md:inline text-xs">Mesafe</span>
          </Button>

          {onStartChainDistance && (
            <Button
              type="button"
              size="sm"
              variant={activeTool === "chain_distance" ? "default" : "ghost"}
              className={cn(
                iconBtnBase,
                activeTool === "chain_distance"
                  ? "bg-blue-600 text-white hover:bg-blue-500 shadow-md ring-2 ring-blue-500/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60"
              )}
              onClick={onStartChainDistance}
              title="Zincir Mesafe Ölçümü"
              data-testid="cad-tool-chain-distance"
            >
              <Split className="h-4.5 w-4.5" />
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            variant={activeTool === "area" ? "default" : "ghost"}
            className={cn(
              btnBase,
              activeTool === "area"
                ? "bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-md ring-2 ring-blue-500/30"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            )}
            onClick={onStartArea}
            title="Alan Ölç [A]"
            data-testid="cad-tool-area"
            aria-label="Alan ölç"
          >
            <Square className="h-4.5 w-4.5" />
            <span className="hidden md:inline text-xs">Alan</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn(iconBtnBase, "text-muted-foreground hover:text-destructive hover:bg-destructive/10")}
            onClick={onClearMeasurements}
            title="Ölçümleri Temizle"
            data-testid="cad-tool-clear"
            aria-label="Ölçümleri temizle"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border/60 shrink-0" aria-hidden="true" />

        {/* ── 4. İŞARETLEME & ÇİZİM (MARKUP & ANNOTATE) GRUBU ── */}
        <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-muted/50 p-1" role="toolbar" aria-label="İşaretleme Araçları">
          {/* Yorum Pini */}
          <Button
            type="button"
            size="sm"
            variant={activeTool === "comment_pin" ? "default" : "ghost"}
            className={cn(
              iconBtnBase,
              activeTool === "comment_pin"
                ? "bg-amber-600 text-white hover:bg-amber-500 shadow-md ring-2 ring-amber-500/30"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            )}
            onClick={() => onSelectTool("comment_pin")}
            title="Yorum Pini Ekle"
            data-testid="cad-tool-pin"
          >
            <Pin className="h-4.5 w-4.5" />
          </Button>

          {/* Serbest Çizim / Kalem + Stil Menüsü Dropdown */}
          <DropdownMenu>
            <div className="flex items-center">
              <Button
                type="button"
                size="sm"
                variant={activeTool === "stroke" ? "default" : "ghost"}
                className={cn(
                  btnBase,
                  "pr-1.5 pl-2.5",
                  activeTool === "stroke"
                    ? "bg-amber-600 text-white hover:bg-amber-500 shadow-md ring-2 ring-amber-500/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                )}
                onClick={() => onSelectTool("stroke")}
                title="Serbest Çizim Kalemi"
                data-testid="cad-tool-stroke"
              >
                <div className="relative">
                  <Pencil className="h-4.5 w-4.5" />
                  <span
                    className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full border border-black/50"
                    style={{ backgroundColor: markupStyle.color }}
                  />
                </div>
                <span className="hidden xl:inline text-xs">Kalem</span>
              </Button>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant={activeTool === "stroke" ? "default" : "ghost"}
                  className={cn(
                    "h-9 px-1 rounded-r-xl -ml-1 transition-all",
                    activeTool === "stroke"
                      ? "bg-amber-600 text-white hover:bg-amber-500 border-l border-amber-400/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                  )}
                  title="Kalem Stili (Renk, Kalınlık, Çizgi Tipi)"
                  data-testid="cad-tool-stroke-style-trigger"
                >
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
            </div>
            <DropdownMenuContent align="start" className="w-64 bg-card/95 border-border shadow-2xl backdrop-blur-xl rounded-xl p-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5 text-amber-500" />
                  Kalem Çizim Stili
                </span>
                <span
                  className="h-3 w-3 rounded-full border border-white/30"
                  style={{ backgroundColor: markupStyle.color }}
                />
              </div>

              {/* 1. Renk Paleti */}
              <div className="mt-2.5">
                <span className="text-[11px] text-muted-foreground font-semibold">Renk Seçimi</span>
                <div className="grid grid-cols-5 gap-1.5 mt-1.5">
                  {CAD_MARKUP_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => {
                        onUpdateMarkupStyle?.({ color: c.hex });
                        if (activeTool !== "stroke") onSelectTool("stroke");
                      }}
                      className={cn(
                        "h-7 rounded-lg flex items-center justify-center transition-transform hover:scale-105 border border-white/20 shadow-sm",
                        markupStyle.color === c.hex && "ring-2 ring-amber-400 scale-105"
                      )}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {markupStyle.color === c.hex && (
                        <Check
                          className={cn(
                            "h-3.5 w-3.5",
                            c.hex === "#ffffff" || c.hex === "#eab308" || c.hex === "#f59e0b"
                              ? "text-black"
                              : "text-white"
                          )}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Çizgi Kalınlığı */}
              <div className="mt-3">
                <span className="text-[11px] text-muted-foreground font-semibold">Çizgi Kalınlığı</span>
                <div className="grid grid-cols-5 gap-1 mt-1.5">
                  {CAD_STROKE_WIDTHS.map((w) => (
                    <button
                      key={w.value}
                      type="button"
                      onClick={() => {
                        onUpdateMarkupStyle?.({ strokeWidth: w.value });
                        if (activeTool !== "stroke") onSelectTool("stroke");
                      }}
                      className={cn(
                        "h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center border border-border/70 bg-muted/60 transition-all hover:bg-background",
                        markupStyle.strokeWidth === w.value && "bg-amber-500 text-zinc-950 border-amber-400 font-extrabold shadow-sm"
                      )}
                      title={`${w.label} (${w.desc})`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Çizgi Tipi */}
              <div className="mt-3">
                <span className="text-[11px] text-muted-foreground font-semibold">Çizgi Tipi</span>
                <div className="grid grid-cols-3 gap-1 mt-1.5">
                  {CAD_LINE_STYLES.map((st) => (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => {
                        onUpdateMarkupStyle?.({ lineDash: st.value });
                        if (activeTool !== "stroke") onSelectTool("stroke");
                      }}
                      className={cn(
                        "h-7 px-2 rounded-lg text-[11px] font-medium flex items-center justify-center border border-border/70 bg-muted/60 transition-all hover:bg-background",
                        markupStyle.lineDash === st.value && "bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-sm"
                      )}
                      title={st.label}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Şekiller Dropdown (Dikdörtgen, Daire, Bulut + Stil Ayarları) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant={isShapeActive ? "default" : "ghost"}
                className={cn(
                  btnBase,
                  "px-2.5",
                  isShapeActive
                    ? "bg-amber-600 text-white font-bold hover:bg-amber-500 shadow-md ring-2 ring-amber-500/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                )}
                title="Şekil İşaretleri & Ayarları"
                data-testid="cad-tool-shapes-dropdown"
              >
                {activeTool === "shape_circle" ? (
                  <Circle className="h-4.5 w-4.5" />
                ) : activeTool === "shape_cloud" ? (
                  <Cloud className="h-4.5 w-4.5" />
                ) : (
                  <Square className="h-4.5 w-4.5" />
                )}
                <span className="hidden xl:inline text-xs">Şekil</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 bg-card/95 border-border shadow-2xl backdrop-blur-xl rounded-xl p-2.5">
              <span className="text-[11px] text-muted-foreground font-semibold">Şekil Türü</span>
              <div className="grid grid-cols-3 gap-1 mt-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelectTool("shape_rect")}
                  className={cn(
                    "h-8 flex items-center justify-center gap-1 text-xs rounded-lg border border-border/70",
                    activeTool === "shape_rect" && "bg-amber-500 text-zinc-950 font-bold border-amber-400"
                  )}
                  data-testid="cad-tool-shape-rect"
                >
                  <Square className="h-3.5 w-3.5" />
                  <span>Kare</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelectTool("shape_circle")}
                  className={cn(
                    "h-8 flex items-center justify-center gap-1 text-xs rounded-lg border border-border/70",
                    activeTool === "shape_circle" && "bg-amber-500 text-zinc-950 font-bold border-amber-400"
                  )}
                  data-testid="cad-tool-shape-circle"
                >
                  <Circle className="h-3.5 w-3.5" />
                  <span>Daire</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelectTool("shape_cloud")}
                  className={cn(
                    "h-8 flex items-center justify-center gap-1 text-xs rounded-lg border border-border/70",
                    activeTool === "shape_cloud" && "bg-amber-500 text-zinc-950 font-bold border-amber-400"
                  )}
                  data-testid="cad-tool-shape-cloud"
                >
                  <Cloud className="h-3.5 w-3.5" />
                  <span>Bulut</span>
                </Button>
              </div>

              <DropdownMenuSeparator className="my-2" />

              {/* Kenar Rengi */}
              <span className="text-[11px] text-muted-foreground font-semibold">Kenar Rengi</span>
              <div className="grid grid-cols-5 gap-1.5 mt-1.5">
                {CAD_MARKUP_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => onUpdateMarkupStyle?.({ color: c.hex })}
                    className={cn(
                      "h-6 rounded-lg flex items-center justify-center transition-transform hover:scale-105 border border-white/20 shadow-sm",
                      markupStyle.color === c.hex && "ring-2 ring-amber-400 scale-105"
                    )}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {markupStyle.color === c.hex && (
                      <Check
                        className={cn(
                          "h-3 w-3",
                          c.hex === "#ffffff" || c.hex === "#eab308" || c.hex === "#f59e0b"
                            ? "text-black"
                            : "text-white"
                        )}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Kenar Kalınlığı & Çizgi Tipi */}
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold">Kalınlık</span>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 5].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => onUpdateMarkupStyle?.({ strokeWidth: w })}
                        className={cn(
                          "flex-1 h-6 text-[10px] font-mono font-bold rounded border border-border/70 bg-muted/60",
                          markupStyle.strokeWidth === w && "bg-amber-500 text-zinc-950 font-extrabold"
                        )}
                      >
                        {w}p
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold">Çizgi Tipi</span>
                  <div className="flex gap-1 mt-1">
                    {CAD_LINE_STYLES.map((st) => (
                      <button
                        key={st.value}
                        type="button"
                        onClick={() => onUpdateMarkupStyle?.({ lineDash: st.value })}
                        className={cn(
                          "flex-1 h-6 text-[10px] font-medium rounded border border-border/70 bg-muted/60",
                          markupStyle.lineDash === st.value && "bg-amber-500 text-zinc-950 font-bold"
                        )}
                        title={st.label}
                      >
                        {st.label[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Saydam Dolgu Seçeneği */}
              <div className="mt-2.5">
                <span className="text-[11px] text-muted-foreground font-semibold">Dolgu</span>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  <button
                    type="button"
                    onClick={() => onUpdateMarkupStyle?.({ fillColor: undefined })}
                    className={cn(
                      "h-6 text-[10px] font-medium rounded border border-border/70 bg-muted/60",
                      !markupStyle.fillColor && "bg-amber-500 text-zinc-950 font-bold"
                    )}
                  >
                    Şeffaf
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateMarkupStyle?.({ fillColor: markupStyle.color })}
                    className={cn(
                      "h-6 text-[10px] font-medium rounded border border-border/70 bg-muted/60",
                      Boolean(markupStyle.fillColor) && "bg-amber-500 text-zinc-950 font-bold"
                    )}
                  >
                    %20 Dolgu
                  </button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Callout (Ok ve Baloncuk) */}
          <Button
            type="button"
            size="sm"
            variant={activeTool === "callout" ? "default" : "ghost"}
            className={cn(
              iconBtnBase,
              activeTool === "callout"
                ? "bg-amber-600 text-white hover:bg-amber-500 shadow-md ring-2 ring-amber-500/30"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            )}
            onClick={() => onSelectTool("callout")}
            title="Ok & Açıklama Baloncuğu (Callout)"
            data-testid="cad-tool-callout"
          >
            <MessageSquare className="h-4.5 w-4.5" />
          </Button>

          {/* Metin Notu */}
          <Button
            type="button"
            size="sm"
            variant={activeTool === "text" ? "default" : "ghost"}
            className={cn(
              iconBtnBase,
              activeTool === "text"
                ? "bg-amber-600 text-white hover:bg-amber-500 shadow-md ring-2 ring-amber-500/30"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            )}
            onClick={() => onSelectTool("text")}
            title="Metin Notu Ekle"
            data-testid="cad-tool-text"
          >
            <Type className="h-4.5 w-4.5" />
          </Button>

          {/* Silgi */}
          <Button
            type="button"
            size="sm"
            variant={activeTool === "eraser" ? "default" : "ghost"}
            className={cn(
              iconBtnBase,
              activeTool === "eraser"
                ? "bg-rose-600 text-white hover:bg-rose-500 shadow-md ring-2 ring-rose-500/30"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            )}
            onClick={() => onSelectTool("eraser")}
            title="İşaret Silgisi"
            data-testid="cad-tool-eraser"
          >
            <Eraser className="h-4.5 w-4.5" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border/60 shrink-0" aria-hidden="true" />

        {/* ── 5. KATMAN, OSNAP & ARAMA ÇEKMECELERİ ── */}
        <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-muted/50 p-1" role="toolbar" aria-label="Paneller ve Ayarlar">
          {/* Katmanlar */}
          <Button
            type="button"
            size="sm"
            variant={layerPanelOpen || activePanelTab === "layers" ? "secondary" : "ghost"}
            className={cn(
              btnBase,
              (layerPanelOpen || activePanelTab === "layers")
                ? "bg-background text-foreground shadow font-bold border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            )}
            onClick={onToggleLayerPanel}
            title="Katmanlar Paneli"
            data-testid="cad-tool-layers"
            aria-label="Katmanlar"
          >
            <Layers className="h-4.5 w-4.5 text-indigo-400" />
            <span className="hidden md:inline text-xs">Katmanlar</span>
            {layersCount > 0 && (
              <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-400 font-mono">
                {layersCount}
              </span>
            )}
          </Button>

          {/* Nesne Yakalama (Osnap / Magnet) */}
          <Button
            type="button"
            size="sm"
            variant={snapPanelOpen ? "secondary" : "ghost"}
            className={cn(
              btnBase,
              snapPanelOpen
                ? "bg-background text-foreground shadow font-bold border border-border/60"
                : snapEnabled
                ? "text-muted-foreground hover:text-foreground hover:bg-background/60"
                : "text-muted-foreground/40"
            )}
            onClick={onToggleSnapPanel}
            title="Nesne Yakalama (Osnap)"
            data-testid="cad-tool-snap-settings"
            aria-label="Nesne yakalama ayarları"
          >
            <Magnet className="h-4.5 w-4.5 text-emerald-400" />
            <span className="hidden lg:inline text-xs">Osnap</span>
          </Button>

          {/* Metin Arama */}
          <Button
            type="button"
            size="sm"
            variant={activePanelTab === "search" ? "secondary" : "ghost"}
            className={cn(
              iconBtnBase,
              activePanelTab === "search"
                ? "bg-background text-foreground shadow font-bold border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            )}
            onClick={() => onTogglePanelTab("search")}
            title="Çizim İçi Metin Ara [/]"
            data-testid="cad-tool-search-panel"
          >
            <Search className="h-4.5 w-4.5" />
          </Button>

          {/* Yorumlar Listesi */}
          <Button
            type="button"
            size="sm"
            variant={activePanelTab === "comments" ? "secondary" : "ghost"}
            className={cn(
              btnBase,
              activePanelTab === "comments"
                ? "bg-background text-foreground shadow font-bold border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            )}
            onClick={() => onTogglePanelTab("comments")}
            title="Yorumlar ve Notlar Listesi"
            data-testid="cad-tool-comments-panel"
          >
            <MessageSquare className="h-4.5 w-4.5 text-amber-400" />
            <span className="hidden lg:inline text-xs">Yorumlar</span>
            {commentsCount > 0 && (
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 font-mono">
                {commentsCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* ── 6. SAĞ TARAF: GEÇMİŞ, HIZLI İNDİRME & DURUM ── */}
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {onUndo && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(iconBtnBase, "text-muted-foreground hover:text-foreground disabled:opacity-30 hover:bg-background/80")}
            onClick={onUndo}
            disabled={!canUndo}
            title="Geri Al [Ctrl+Z]"
            data-testid="cad-tool-undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
        )}

        {onRedo && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(iconBtnBase, "text-muted-foreground hover:text-foreground disabled:opacity-30 hover:bg-background/80")}
            onClick={onRedo}
            disabled={!canRedo}
            title="Yinele [Ctrl+Y]"
            data-testid="cad-tool-redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        )}

        {/* Canlı Kayıt Durumu Noktası */}
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono border border-border/50 bg-muted/40"
          title={
            saveStatus === "saving"
              ? "Değişiklikler kaydediliyor..."
              : saveStatus === "dirty"
              ? "Kaydedilmemiş değişiklikler var"
              : "Tüm değişiklikler kaydedildi"
          }
          data-testid="cad-save-status"
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              saveStatus === "saving"
                ? "bg-amber-400 animate-pulse"
                : saveStatus === "dirty"
                ? "bg-blue-400"
                : "bg-emerald-400"
            )}
          />
        </div>

        <div className="h-6 w-px bg-border/60 shrink-0 mx-0.5" aria-hidden="true" />

        {/* Hızlı İndirme Dropdown / Butonları */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="sm"
              className="h-9 gap-1.5 px-3 bg-amber-500 font-bold text-zinc-950 hover:bg-amber-400 rounded-xl shadow-md text-xs"
              title="Dosyayı veya Çizilen Revizyonları İndir"
              data-testid="cad-tool-download-dropdown"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">İndir</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card/95 border-border shadow-2xl backdrop-blur-xl rounded-xl">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold">İndirme Seçenekleri</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {onDownloadDxf && (
              <DropdownMenuItem
                onClick={onDownloadDxf}
                className="flex items-center gap-2.5 text-xs cursor-pointer font-bold text-amber-500 bg-amber-500/10 rounded-lg my-0.5"
                data-testid="cad-download-dxf-rev"
              >
                <FileCode className="h-4 w-4 text-amber-500" />
                <div className="flex flex-col">
                  <span>Revizyonlu DXF İndir</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Tüm çizim ve notlarla</span>
                </div>
              </DropdownMenuItem>
            )}
            {onDownloadOriginal && (
              <DropdownMenuItem
                onClick={onDownloadOriginal}
                className="flex items-center gap-2.5 text-xs cursor-pointer font-medium rounded-lg my-0.5"
                data-testid="cad-download-original"
              >
                <Download className="h-4 w-4 text-blue-500" />
                <div className="flex flex-col">
                  <span>Orijinal Çizimi İndir</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Kaynak DWG/DXF dosyası</span>
                </div>
              </DropdownMenuItem>
            )}
            {onOpenExportDialog && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onOpenExportDialog}
                  className="flex items-center gap-2.5 text-xs cursor-pointer font-medium rounded-lg my-0.5"
                  data-testid="cad-open-export-dialog"
                >
                  <Share2 className="h-4 w-4 text-indigo-400" />
                  <span>Dışa Aktarma Merkezi (PNG/PDF)</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
