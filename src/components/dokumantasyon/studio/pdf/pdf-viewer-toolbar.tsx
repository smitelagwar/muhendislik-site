// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF VIEWER TOOLBAR (WARM GLASS ACTIONS & COMMANDS)
// ============================================================================

"use client";

import React from "react";
import {
  Sidebar,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  MousePointer,
  Hand,
  ZoomIn,
  ZoomOut,
  Search,
  MoreHorizontal,
} from "lucide-react";
import { StudioCommandButton } from "../studio-command-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PdfViewerToolbarProps {
  numPages: number;
  currentPage: number;
  scale: number;
  isSidebarOpen: boolean;
  isHandTool: boolean;
  isSearchOpen: boolean;
  onToggleSidebar: () => void;
  onPageChange: (pageNum: number) => void;
  onSetHandTool: (isHand: boolean) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoom100: () => void;
  onFitWidth: () => void;
  onFitPage: () => void;
  onRotateView: () => void;
  onToggleSearch: () => void;
  onPrint: () => void;
}

export function PdfViewerToolbar({
  numPages,
  currentPage,
  scale,
  isSidebarOpen,
  isHandTool,
  isSearchOpen,
  onToggleSidebar,
  onPageChange,
  onSetHandTool,
  onZoomIn,
  onZoomOut,
  onZoom100,
  onFitWidth,
  onFitPage,
  onRotateView,
  onToggleSearch,
  onPrint,
}: PdfViewerToolbarProps) {
  return (
    <div
      data-testid="pdf-viewer-toolbar"
      className="z-30 flex h-12 min-w-0 shrink-0 flex-nowrap items-center justify-between gap-1 border-b border-border/70 bg-card/85 px-2 py-1.5 text-xs text-foreground backdrop-blur-md select-none sm:px-3"
    >
      {/* Sol Alan: Kenar Çubuğu ve Sayfa Gezintisi */}
      <div className="flex min-w-0 shrink-0 items-center gap-0.5 sm:gap-1">
        <StudioCommandButton
          commandId="pdf.sidebar.toggle"
          onClick={onToggleSidebar}
          active={isSidebarOpen}
          showLabel={false}
          className="hidden h-8 w-8 rounded-lg p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors sm:inline-flex"
          icon={<Sidebar className="h-4 w-4" />}
        />

        <div className="hidden h-4 w-px bg-border/80 sm:mx-1 sm:block" />

        <StudioCommandButton
          commandId="pdf.page.first"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          showLabel={false}
          className="hidden h-8 w-8 rounded-lg p-0 text-muted-foreground disabled:opacity-30 sm:inline-flex"
          icon={<ChevronsLeft className="h-4 w-4" />}
        />

        <StudioCommandButton
          commandId="pdf.page.previous"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage <= 1}
          showLabel={false}
          className="h-8 w-8 rounded-lg p-0 text-muted-foreground disabled:opacity-30"
          icon={<ChevronLeft className="h-4 w-4" />}
        />

        <div className="flex shrink-0 items-center gap-1 px-1 text-xs font-medium">
          <input
            type="number"
            min={1}
            max={numPages || 1}
            value={currentPage}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 1 && val <= numPages) {
                onPageChange(val);
              }
            }}
            className="h-7 w-12 rounded-lg border border-input bg-background/80 px-1 text-center font-mono text-xs text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-inner"
            aria-label="Geçerli Sayfa"
          />
          <span className="font-semibold text-muted-foreground font-mono">/ {numPages || "—"}</span>
        </div>

        <StudioCommandButton
          commandId="pdf.page.next"
          onClick={() => onPageChange(Math.min(currentPage + 1, numPages))}
          disabled={currentPage >= numPages}
          showLabel={false}
          className="h-8 w-8 shrink-0 rounded-lg p-0 text-muted-foreground disabled:opacity-30"
          icon={<ChevronRight className="h-4 w-4" />}
        />

        <StudioCommandButton
          commandId="pdf.page.last"
          onClick={() => onPageChange(numPages)}
          disabled={currentPage >= numPages}
          showLabel={false}
          className="hidden h-8 w-8 rounded-lg p-0 text-muted-foreground disabled:opacity-30 sm:inline-flex"
          icon={<ChevronsRight className="h-4 w-4" />}
        />
      </div>

      {/* Orta Alan: Arama, İmleç Araçları ve Zoom */}
      <div className="flex min-w-0 items-center justify-end gap-1">
        <StudioCommandButton
          commandId="pdf.search.open"
          onClick={onToggleSearch}
          active={isSearchOpen}
          showLabel={false}
          className="h-8 w-8 rounded-lg p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          icon={<Search className="h-4 w-4" />}
        />

        <div className="hidden h-4 w-px bg-border/80 sm:mx-1 sm:block" />

        <StudioCommandButton
          commandId="pdf.tool.select"
          onClick={() => onSetHandTool(false)}
          active={!isHandTool}
          showLabel={false}
          className="hidden h-8 w-8 rounded-lg p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors sm:inline-flex"
          icon={<MousePointer className="h-3.5 w-3.5" />}
        />

        <StudioCommandButton
          commandId="pdf.tool.hand"
          onClick={() => onSetHandTool(true)}
          active={isHandTool}
          showLabel={false}
          className="hidden h-8 w-8 rounded-lg p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors sm:inline-flex"
          icon={<Hand className="h-3.5 w-3.5" />}
        />

        <div className="hidden h-4 w-px bg-border/80 sm:mx-1 sm:block" />

        <StudioCommandButton
          commandId="pdf.zoom.out"
          onClick={onZoomOut}
          showLabel={false}
          className="h-8 w-8 shrink-0 rounded-lg p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          icon={<ZoomOut className="h-3.5 w-3.5" />}
        />

        <StudioCommandButton
          commandId="pdf.zoom.100"
          onClick={onZoom100}
          className="h-7 shrink-0 rounded-lg px-2 font-mono text-[11px] font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          label={`${Math.round(scale * 100)}%`}
        />

        <StudioCommandButton
          commandId="pdf.zoom.in"
          onClick={onZoomIn}
          showLabel={false}
          className="h-8 w-8 shrink-0 rounded-lg p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          icon={<ZoomIn className="h-3.5 w-3.5" />}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="PDF ek işlemleri"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[210] w-48 bg-card/95 border-border shadow-2xl rounded-xl backdrop-blur-md">
            <DropdownMenuItem className="cursor-pointer text-xs sm:hidden rounded-lg" onClick={onToggleSidebar}>
              Kenar çubuğunu aç/kapat
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-xs sm:hidden rounded-lg" onClick={() => onPageChange(1)}>
              İlk sayfaya git
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-xs sm:hidden rounded-lg" onClick={() => onPageChange(numPages)}>
              Son sayfaya git
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-xs sm:hidden rounded-lg" onClick={() => onSetHandTool(false)}>
              Metin seçim imleci
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-xs sm:hidden rounded-lg" onClick={() => onSetHandTool(true)}>
              Kaydırma / el aracı
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/60" />
            <DropdownMenuItem data-command-id="pdf.zoom.fitWidth" className="cursor-pointer text-xs rounded-lg" onClick={onFitWidth}>
              Genişliğe sığdır
            </DropdownMenuItem>
            <DropdownMenuItem data-command-id="pdf.zoom.fitPage" className="cursor-pointer text-xs rounded-lg" onClick={onFitPage}>
              Sayfaya sığdır
            </DropdownMenuItem>
            <DropdownMenuItem data-command-id="pdf.rotateView" className="cursor-pointer text-xs rounded-lg" onClick={onRotateView}>
              Görünümü döndür
            </DropdownMenuItem>
            <DropdownMenuItem data-command-id="pdf.print" className="cursor-pointer text-xs rounded-lg" onClick={onPrint}>
              PDF yazdır
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
