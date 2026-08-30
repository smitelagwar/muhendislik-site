"use client";

import {
  Maximize,
  Search,
  Ruler,
  Split,
  Square,
  Circle,
  Cloud,
  Pin,
  MessageSquare,
  Type,
  MousePointer,
  Pencil,
  Eraser,
  Undo2,
  Redo2,
  Eye,
  Layers,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CadReviewTool } from "@/lib/dokumantasyon/cad-review/store";
import type { CadSidePanelTab } from "./cad-review-side-panel";

export interface CadReviewToolbarProps {
  activeTool: CadReviewTool;
  onSelectTool: (tool: CadReviewTool) => void;
  activePanelTab: CadSidePanelTab | null;
  onTogglePanelTab: (tab: CadSidePanelTab) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onFitView?: () => void;
  displayMode?: "source" | "monochrome";
  onToggleDisplayMode?: () => void;
  saveStatus?: "clean" | "dirty" | "saving";
  isMobile?: boolean;
}

export function CadReviewToolbar({
  activeTool,
  onSelectTool,
  activePanelTab,
  onTogglePanelTab,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onFitView,
  displayMode = "source",
  onToggleDisplayMode,
  saveStatus = "clean",
  isMobile = false,
}: CadReviewToolbarProps) {
  // Common button classes
  const desktopBtnClass = "h-8 w-8 p-0";
  const mobileBtnClass = "min-h-[44px] min-w-[44px] h-11 w-11 p-0 touch-manipulation";

  if (isMobile) {
    return (
      <nav
        aria-label="Mobil CAD İnceleme Araç Çubuğu"
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border/80 bg-background/95 p-2 shadow-lg backdrop-blur pb-safe"
        data-cad-mobile-dock="true"
      >
        {/* 1. Navigate / Select */}
        <Button
          type="button"
          variant={activeTool === "select" ? "secondary" : "ghost"}
          className={mobileBtnClass}
          onClick={() => onSelectTool("select")}
          aria-label="Seçim ve Gezinme Modu"
          aria-pressed={activeTool === "select"}
        >
          <MousePointer className="h-5 w-5" />
        </Button>

        {/* 2. Measure (Distance) */}
        <Button
          type="button"
          variant={activeTool === "distance" ? "secondary" : "ghost"}
          className={mobileBtnClass}
          onClick={() => onSelectTool("distance")}
          aria-label="Mesafe Ölçümü"
          aria-pressed={activeTool === "distance"}
        >
          <Ruler className="h-5 w-5" />
        </Button>

        {/* 3. Comment Pin */}
        <Button
          type="button"
          variant={activeTool === "comment_pin" ? "secondary" : "ghost"}
          className={mobileBtnClass}
          onClick={() => onSelectTool("comment_pin")}
          aria-label="Yorum Pini Ekle"
          aria-pressed={activeTool === "comment_pin"}
        >
          <Pin className="h-5 w-5" />
        </Button>

        {/* 4. Freehand Stroke */}
        <Button
          type="button"
          variant={activeTool === "stroke" ? "secondary" : "ghost"}
          className={mobileBtnClass}
          onClick={() => onSelectTool("stroke")}
          aria-label="Serbest El Çizim"
          aria-pressed={activeTool === "stroke"}
        >
          <Pencil className="h-5 w-5" />
        </Button>

        {/* 5. Eraser */}
        <Button
          type="button"
          variant={activeTool === "eraser" ? "secondary" : "ghost"}
          className={mobileBtnClass}
          onClick={() => onSelectTool("eraser")}
          aria-label="Nesne Silgisi"
          aria-pressed={activeTool === "eraser"}
        >
          <Eraser className="h-5 w-5" />
        </Button>

        {/* 6. Side Panel Tabs (Search / Comments / Layers) */}
        <Button
          type="button"
          variant={activePanelTab === "search" ? "secondary" : "ghost"}
          className={mobileBtnClass}
          onClick={() => onTogglePanelTab("search")}
          aria-label="Metin Arama Çekmecesi"
          aria-pressed={activePanelTab === "search"}
        >
          <Search className="h-5 w-5" />
        </Button>

        <Button
          type="button"
          variant={activePanelTab === "comments" ? "secondary" : "ghost"}
          className={mobileBtnClass}
          onClick={() => onTogglePanelTab("comments")}
          aria-label="Yorum Listesi Çekmecesi"
          aria-pressed={activePanelTab === "comments"}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>

        <Button
          type="button"
          variant={activePanelTab === "layers" ? "secondary" : "ghost"}
          className={mobileBtnClass}
          onClick={() => onTogglePanelTab("layers")}
          aria-label="Katman Çekmecesi"
          aria-pressed={activePanelTab === "layers"}
        >
          <Layers className="h-5 w-5" />
        </Button>
      </nav>
    );
  }

  // Desktop Floating Toolbar (Right Rail — avoids conflict with cad-left-quick-rail)
  return (
    <nav
      aria-label="CAD İnceleme Araç Çubuğu"
      className="absolute right-3 top-3 z-30 flex flex-col gap-2 rounded-xl border border-border/80 bg-background/90 p-1.5 shadow-xl backdrop-blur"
      data-cad-desktop-rail="true"
    >
      {/* Group 1: Navigation & View */}
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant={activeTool === "select" ? "secondary" : "ghost"}
          size="icon"
          className={desktopBtnClass}
          onClick={() => onSelectTool("select")}
          title="Seç / Gezin (V)"
          aria-label="Seç ve Gezin"
          aria-pressed={activeTool === "select"}
        >
          <MousePointer className="h-4 w-4" />
        </Button>

        {onFitView && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={desktopBtnClass}
            onClick={onFitView}
            title="Görünümü Sığdır (F)"
            aria-label="Görünümü Sığdır"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        )}

        {onToggleDisplayMode && (
          <Button
            type="button"
            variant={displayMode === "monochrome" ? "secondary" : "ghost"}
            size="icon"
            className={desktopBtnClass}
            onClick={onToggleDisplayMode}
            title="Siyah-Beyaz / Gerçek Renk Toggle"
            aria-label="Görünüm Renk Modu"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="h-px bg-border/60" aria-hidden="true" />

      {/* Group 2: Search */}
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant={activePanelTab === "search" ? "secondary" : "ghost"}
          size="icon"
          className={desktopBtnClass}
          onClick={() => onTogglePanelTab("search")}
          title="Metin Ara (/)"
          aria-label="Metin Arama Paneli"
          aria-pressed={activePanelTab === "search"}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-px bg-border/60" aria-hidden="true" />

      {/* Group 3: Measure */}
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant={activeTool === "distance" ? "secondary" : "ghost"}
          size="icon"
          className={desktopBtnClass}
          onClick={() => onSelectTool("distance")}
          title="İki Nokta Mesafe Ölçümü"
          aria-label="Mesafe Ölçümü"
          aria-pressed={activeTool === "distance"}
        >
          <Ruler className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={activeTool === "chain_distance" ? "secondary" : "ghost"}
          size="icon"
          className={desktopBtnClass}
          onClick={() => onSelectTool("chain_distance")}
          title="Zincir Mesafe Ölçümü"
          aria-label="Zincir Mesafe Ölçümü"
          aria-pressed={activeTool === "chain_distance"}
        >
          <Split className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={activeTool === "area" ? "secondary" : "ghost"}
          size="icon"
          className={desktopBtnClass}
          onClick={() => onSelectTool("area")}
          title="Alan Ölçümü"
          aria-label="Alan Ölçümü"
          aria-pressed={activeTool === "area"}
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-px bg-border/60" aria-hidden="true" />

      {/* Group 4: Structured Markup & Comments */}
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant={activeTool === "comment_pin" ? "secondary" : "ghost"}
          size="icon"
          className={desktopBtnClass}
          onClick={() => onSelectTool("comment_pin")}
          title="Yorum Pini Ekle"
          aria-label="Yorum Pini"
          aria-pressed={activeTool === "comment_pin"}
        >
          <Pin className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={activeTool === "shape_rect" ? "secondary" : "ghost"}
          size="icon"
          className={desktopBtnClass}
          onClick={() => onSelectTool("shape_rect")}
          title="Dikdörtgen İşaret"
          aria-label="Dikdörtgen İşaret"
          aria-pressed={activeTool === "shape_rect"}
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={activeTool === "shape_circle" ? "secondary" : "ghost"}
          size="icon"
          className={desktopBtnClass}
          onClick={() => onSelectTool("shape_circle")}
          title="Daire İşaret"
          aria-label="Daire İşaret"
          aria-pressed={activeTool === "shape_circle"}
        >
          <Circle className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={activeTool === "shape_cloud" ? "secondary" : "ghost"}
          size="icon"
          className={desktopBtnClass}
          onClick={() => onSelectTool("shape_cloud")}
          title="Revizyon Bulutu"
          aria-label="Revizyon Bulutu"
          aria-pressed={activeTool === "shape_cloud"}
        >
          <Cloud className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={activeTool === "callout" ? "secondary" : "ghost"}
          size="icon"
          className={desktopBtnClass}
          onClick={() => onSelectTool("callout")}
          title="Ok ve Metin Baloncuğu (Callout)"
          aria-label="Callout Baloncuğu"
          aria-pressed={activeTool === "callout"}
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={activeTool === "text" ? "secondary" : "ghost"}
          size="icon"
          className={desktopBtnClass}
          onClick={() => onSelectTool("text")}
          title="Metin Notu"
          aria-label="Metin Notu"
          aria-pressed={activeTool === "text"}
        >
          <Type className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-px bg-border/60" aria-hidden="true" />

      {/* Group 5: Sketch & Eraser */}
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant={activeTool === "stroke" ? "secondary" : "ghost"}
          size="icon"
          className={desktopBtnClass}
          onClick={() => onSelectTool("stroke")}
          title="Serbest El Çizim (Kalem)"
          aria-label="Serbest El Çizim"
          aria-pressed={activeTool === "stroke"}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={activeTool === "eraser" ? "secondary" : "ghost"}
          size="icon"
          className={desktopBtnClass}
          onClick={() => onSelectTool("eraser")}
          title="Nesne Silgisi"
          aria-label="Nesne Silgisi"
          aria-pressed={activeTool === "eraser"}
        >
          <Eraser className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-px bg-border/60" aria-hidden="true" />

      {/* Group 6: History & Status */}
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={desktopBtnClass}
          onClick={onUndo}
          disabled={!canUndo}
          title="Geri Al (Ctrl+Z)"
          aria-label="Geri Al"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={desktopBtnClass}
          onClick={onRedo}
          disabled={!canRedo}
          title="Yinele (Ctrl+Y)"
          aria-label="Yinele"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Save Status Live Indicator */}
      <div
        className="mt-1 flex items-center justify-center text-[10px] font-medium"
        aria-live="polite"
        title={
          saveStatus === "saving"
            ? "Kaydediliyor..."
            : saveStatus === "dirty"
            ? "Kaydedilmemiş değişiklikler var"
            : "Kaydedildi"
        }
      >
        <span
          className={`h-2 w-2 rounded-full ${
            saveStatus === "saving"
              ? "bg-amber-500 animate-pulse"
              : saveStatus === "dirty"
              ? "bg-blue-500"
              : "bg-emerald-500"
          }`}
        />
      </div>
    </nav>
  );
}