// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF VIEWER TOOLBAR (ACTIONS & COMMANDS)
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
  Maximize2,
  RotateCw,
  Search,
  Printer,
} from "lucide-react";
import { StudioCommandButton } from "../studio-command-button";

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
    <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs text-zinc-200 backdrop-blur-md z-30 select-none">
      {/* Sol Alan: Kenar Çubuğu ve Sayfa Gezintisi */}
      <div className="flex items-center gap-1">
        <StudioCommandButton
          commandId="pdf.sidebar.toggle"
          onClick={onToggleSidebar}
          active={isSidebarOpen}
          showLabel={false}
          className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 rounded-md"
          icon={<Sidebar className="h-4 w-4" />}
        />

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        <StudioCommandButton
          commandId="pdf.page.first"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          showLabel={false}
          className="h-7 w-7 p-0 text-zinc-400 disabled:opacity-30 rounded-md"
          icon={<ChevronsLeft className="h-4 w-4" />}
        />

        <StudioCommandButton
          commandId="pdf.page.previous"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage <= 1}
          showLabel={false}
          className="h-7 w-7 p-0 text-zinc-400 disabled:opacity-30 rounded-md"
          icon={<ChevronLeft className="h-4 w-4" />}
        />

        <div className="flex items-center gap-1 text-xs px-1">
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
            className="h-6 w-11 rounded border border-zinc-700 bg-zinc-950 px-1 text-center font-mono text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
            aria-label="Geçerli Sayfa"
          />
          <span className="text-zinc-400 font-medium">/ {numPages || "—"}</span>
        </div>

        <StudioCommandButton
          commandId="pdf.page.next"
          onClick={() => onPageChange(Math.min(currentPage + 1, numPages))}
          disabled={currentPage >= numPages}
          showLabel={false}
          className="h-7 w-7 p-0 text-zinc-400 disabled:opacity-30 rounded-md"
          icon={<ChevronRight className="h-4 w-4" />}
        />

        <StudioCommandButton
          commandId="pdf.page.last"
          onClick={() => onPageChange(numPages)}
          disabled={currentPage >= numPages}
          showLabel={false}
          className="h-7 w-7 p-0 text-zinc-400 disabled:opacity-30 rounded-md"
          icon={<ChevronsRight className="h-4 w-4" />}
        />
      </div>

      {/* Orta Alan: Arama, İmleç Araçları ve Zoom */}
      <div className="flex items-center gap-1">
        <StudioCommandButton
          commandId="pdf.search.open"
          onClick={onToggleSearch}
          active={isSearchOpen}
          showLabel={false}
          className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 rounded-md"
          icon={<Search className="h-4 w-4" />}
        />

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        <StudioCommandButton
          commandId="pdf.tool.select"
          onClick={() => onSetHandTool(false)}
          active={!isHandTool}
          showLabel={false}
          className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 rounded-md"
          icon={<MousePointer className="h-3.5 w-3.5" />}
        />

        <StudioCommandButton
          commandId="pdf.tool.hand"
          onClick={() => onSetHandTool(true)}
          active={isHandTool}
          showLabel={false}
          className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 rounded-md"
          icon={<Hand className="h-3.5 w-3.5" />}
        />

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        <StudioCommandButton
          commandId="pdf.zoom.out"
          onClick={onZoomOut}
          showLabel={false}
          className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 rounded-md"
          icon={<ZoomOut className="h-3.5 w-3.5" />}
        />

        <StudioCommandButton
          commandId="pdf.zoom.100"
          onClick={onZoom100}
          className="h-6 px-1.5 text-[11px] font-mono text-zinc-300 hover:text-zinc-100 rounded-md"
          label={`${Math.round(scale * 100)}%`}
        />

        <StudioCommandButton
          commandId="pdf.zoom.in"
          onClick={onZoomIn}
          showLabel={false}
          className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 rounded-md"
          icon={<ZoomIn className="h-3.5 w-3.5" />}
        />

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        <StudioCommandButton
          commandId="pdf.zoom.fitWidth"
          onClick={onFitWidth}
          showLabel={false}
          className="h-7 px-2 text-[11px] text-zinc-400 hover:text-zinc-100 rounded-md hidden sm:inline-flex"
          label="Genişlik"
        />

        <StudioCommandButton
          commandId="pdf.zoom.fitPage"
          onClick={onFitPage}
          showLabel={false}
          className="h-7 px-2 text-[11px] text-zinc-400 hover:text-zinc-100 rounded-md hidden sm:inline-flex"
          label="Sayfa"
        />

        <div className="h-4 w-px bg-zinc-800 mx-1" />

        <StudioCommandButton
          commandId="pdf.rotateView"
          onClick={onRotateView}
          showLabel={false}
          className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 rounded-md"
          icon={<RotateCw className="h-3.5 w-3.5" />}
        />

        <StudioCommandButton
          commandId="pdf.print"
          onClick={onPrint}
          showLabel={false}
          className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 rounded-md hidden sm:inline-flex"
          icon={<Printer className="h-3.5 w-3.5" />}
        />
      </div>
    </div>
  );
}
