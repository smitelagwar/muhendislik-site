// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF VIEWER TOOLBAR (WARM GLASS ACTIONS & COMMANDS)
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
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
  ArrowLeft,
  RotateCw,
  Printer,
  Download,
  Maximize2,
  Minimize2,
  Edit3,
  Trash2,
  FileText,
  MoreVertical,
  Share2,
  Check,
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { formatBytes, formatDate } from "../../ui-helpers";
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
  zoomMode?: "custom" | "actual-size" | "fit-width" | "fit-page";
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
  // --- Tekil Toolbar Propları ---
  displayName?: string;
  sizeBytes?: number;
  extension?: string;
  versionNo?: number;
  createdAt?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onBack?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}

export function PdfViewerToolbar({
  numPages,
  currentPage,
  scale,
  zoomMode,
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
  displayName,
  sizeBytes,
  extension,
  versionNo,
  createdAt,
  isFullscreen,
  onToggleFullscreen,
  onBack,
  onShare,
  onDownload,
  onRename,
  onDelete,
}: PdfViewerToolbarProps) {
  const zoomPercent = Math.round(scale * 100);
  const [pageInputVal, setPageInputVal] = useState(String(currentPage));

  useEffect(() => {
    setPageInputVal(String(currentPage));
  }, [currentPage]);

  const commitPageInput = () => {
    const val = parseInt(pageInputVal, 10);
    if (!isNaN(val) && val >= 1 && val <= numPages) {
      onPageChange(val);
    } else {
      setPageInputVal(String(currentPage));
    }
  };

  return (
    <div
      data-testid="pdf-viewer-toolbar"
      role="group"
      aria-label="PDF stüdyo araç çubuğu"
      className="z-30 box-border flex h-14 w-full min-w-0 shrink-0 items-center justify-between gap-1.5 border-b border-border/70 bg-card/85 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] text-xs text-foreground backdrop-blur-2xl shadow-sm select-none sm:h-16 sm:px-3 print:hidden"
    >
      {/* 1. Sol Alan: Geri Dönüş, Dosya Kimliği ve Sayfa Gezintisi */}
      <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
        {onBack && (
          <>
            <StudioCommandButton
              commandId="studio.back"
              onClick={onBack}
              size="sm"
              variant="ghost"
              showLabel={false}
              title="Dosya Yöneticisine Dön"
              aria-label="Dosya Yöneticisine Dön"
              className="h-9 w-9 shrink-0 rounded-xl p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 sm:h-10 sm:w-10"
              icon={<ArrowLeft className="h-4.5 w-4.5" />}
            />
            <div className="hidden h-5 w-px bg-border/60 sm:block" />
          </>
        )}

        {/* Dosya Kimlik Bloğu */}
        {displayName && (
          <div className="flex flex-col min-w-0 pr-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold text-xs sm:text-sm tracking-tight text-foreground/90 truncate max-w-[110px] min-[380px]:max-w-[160px] sm:max-w-[220px] md:max-w-[320px]" title={displayName}>
                {displayName}
              </span>
              {versionNo != null && (
                <span className="shrink-0 rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-500">
                  v{versionNo}
                </span>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
              {sizeBytes != null && <span className="font-mono">{formatBytes(sizeBytes)}</span>}
              {sizeBytes != null && <span>•</span>}
              <span className="uppercase font-bold text-rose-500/90 font-mono">
                {extension ? extension.replace(".", "") : "PDF"}
              </span>
              {numPages > 0 && <span>•</span>}
              {numPages > 0 && <span className="font-mono">{numPages} Sayfa</span>}
            </div>
          </div>
        )}

        <div className="hidden h-5 w-px bg-border/60 sm:block" />

        {/* Kenar Çubuğu (Thumbnails) Butonu */}
        <StudioCommandButton
          commandId="pdf.sidebar.toggle"
          onClick={onToggleSidebar}
          active={isSidebarOpen}
          showLabel={false}
          title="Kenar Çubuğunu Aç/Kapat"
          className="hidden h-9 w-9 rounded-xl p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors sm:inline-flex"
          icon={<Sidebar className="h-4 w-4" />}
        />

        {/* Sayfa Gezinti Kümesi */}
        <div className="flex items-center gap-0.5">
          <StudioCommandButton
            commandId="pdf.page.first"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            showLabel={false}
            title="İlk Sayfaya Git"
            className="hidden h-9 w-9 rounded-xl p-0 text-muted-foreground disabled:opacity-30 md:inline-flex"
            icon={<ChevronsLeft className="h-4 w-4" />}
          />

          <StudioCommandButton
            commandId="pdf.page.previous"
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage <= 1}
            showLabel={false}
            title="Önceki Sayfa"
            className="h-9 w-9 rounded-xl p-0 text-muted-foreground disabled:opacity-30"
            icon={<ChevronLeft className="h-4 w-4" />}
          />

          <div className="flex shrink-0 items-center gap-1 px-0.5 text-xs font-medium">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pageInputVal}
              disabled={numPages <= 0}
              onChange={(e) => setPageInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              onBlur={commitPageInput}
              className="h-8 w-11 rounded-lg border border-input bg-background/80 px-1 text-center font-mono text-xs text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-inner disabled:opacity-50"
              aria-label="Geçerli Sayfa"
            />
            <span className="font-semibold text-muted-foreground font-mono text-[11px]">/ {numPages || "—"}</span>
          </div>

          <StudioCommandButton
            commandId="pdf.page.next"
            onClick={() => onPageChange(Math.min(currentPage + 1, numPages))}
            disabled={currentPage >= numPages}
            showLabel={false}
            title="Sonraki Sayfa"
            className="h-9 w-9 shrink-0 rounded-xl p-0 text-muted-foreground disabled:opacity-30"
            icon={<ChevronRight className="h-4 w-4" />}
          />

          <StudioCommandButton
            commandId="pdf.page.last"
            onClick={() => onPageChange(numPages)}
            disabled={currentPage >= numPages}
            showLabel={false}
            title="Son Sayfaya Git"
            className="hidden h-9 w-9 rounded-xl p-0 text-muted-foreground disabled:opacity-30 md:inline-flex"
            icon={<ChevronsRight className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* 2. Sağ Alan: Arama, İmleçler, Zoom Kapsülü, Eylemler, Menü, Paylaş ve Tema */}
      <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5">
        {/* Doküman İçi Arama */}
        <StudioCommandButton
          commandId="pdf.search.open"
          onClick={onToggleSearch}
          active={isSearchOpen}
          showLabel={false}
          title="Dokümanda Ara (Ctrl+F)"
          className="h-9 w-9 rounded-xl p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          icon={<Search className="h-4 w-4" />}
        />

        <div className="hidden h-5 w-px bg-border/60 lg:block" />

        {/* Metin Seçim & El Aracı (Pan) */}
        <StudioCommandButton
          commandId="pdf.tool.select"
          onClick={() => onSetHandTool(false)}
          active={!isHandTool}
          showLabel={false}
          title="Metin Seçim İmleci (V)"
          className="hidden h-9 w-9 rounded-xl p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors lg:inline-flex"
          icon={<MousePointer className="h-3.5 w-3.5" />}
        />

        <StudioCommandButton
          commandId="pdf.tool.hand"
          onClick={() => onSetHandTool(true)}
          active={isHandTool}
          showLabel={false}
          title="Kaydırma / El Aracı (H)"
          className="hidden h-9 w-9 rounded-xl p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors lg:inline-flex"
          icon={<Hand className="h-3.5 w-3.5" />}
        />

        <div className="hidden h-5 w-px bg-border/60 sm:block" />

        {/* Zoom Segmentli Kapsülü */}
        <div className="flex items-center rounded-xl bg-secondary/50 border border-border/60 p-0.5 shadow-inner">
          <StudioCommandButton
            commandId="pdf.zoom.out"
            onClick={onZoomOut}
            showLabel={false}
            title="Uzaklaştır (Ctrl+-)"
            aria-label="Uzaklaştır"
            className="h-11 w-11 min-h-11 min-w-11 lg:h-9 lg:w-9 lg:min-h-9 lg:min-w-9 rounded-lg p-0 text-muted-foreground hover:bg-background/80 hover:text-foreground transition-colors"
            icon={<ZoomOut className="h-4 w-4" />}
          />

          <StudioCommandButton
            commandId="pdf.zoom.100"
            onClick={onZoom100}
            active={zoomMode === "actual-size" || zoomPercent === 100}
            title={`Orijinal Boyut · ${zoomPercent}%`}
            aria-label={`Ölçeği sıfırla, yüzde ${zoomPercent}`}
            className="h-11 min-h-11 px-2 lg:h-9 lg:min-h-9 lg:px-2.5 rounded-lg text-xs font-mono font-bold text-muted-foreground hover:bg-background/80 hover:text-foreground transition-colors"
            label={`${zoomPercent}%`}
          />

          <StudioCommandButton
            commandId="pdf.zoom.in"
            onClick={onZoomIn}
            showLabel={false}
            title="Yakınlaştır (Ctrl++)"
            aria-label="Yakınlaştır"
            className="h-11 w-11 min-h-11 min-w-11 lg:h-9 lg:w-9 lg:min-h-9 lg:min-w-9 rounded-lg p-0 text-muted-foreground hover:bg-background/80 hover:text-foreground transition-colors"
            icon={<ZoomIn className="h-4 w-4" />}
          />

          <div className="hidden h-4 w-px bg-border/60 mx-0.5 min-[1100px]:block" />

          <StudioCommandButton
            commandId="pdf.zoom.fitWidth"
            onClick={onFitWidth}
            active={zoomMode === "fit-width"}
            showLabel={true}
            title="Genişliğe Sığdır (Ctrl+2)"
            className="hidden h-9 px-2 rounded-lg text-[11px] font-semibold text-foreground/90 hover:bg-background/80 hover:text-foreground transition-colors min-[1100px]:inline-flex"
            label="Genişlik"
          />

          <StudioCommandButton
            commandId="pdf.zoom.fitPage"
            onClick={onFitPage}
            active={zoomMode === "fit-page"}
            showLabel={true}
            title="Sayfaya Sığdır (Ctrl+0)"
            className="hidden h-9 px-2 rounded-lg text-[11px] font-semibold text-foreground/90 hover:bg-background/80 hover:text-foreground transition-colors min-[1250px]:inline-flex"
            label="Sayfa"
          />
        </div>

        <div className="hidden h-5 w-px bg-border/60 sm:block" />

        {/* Görünümü Döndür */}
        <StudioCommandButton
          commandId="pdf.rotateView"
          onClick={onRotateView}
          showLabel={false}
          title="Görünümü Saat Yönünde Döndür (Ctrl+R)"
          className="hidden h-9 w-9 rounded-xl p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors md:inline-flex"
          icon={<RotateCw className="h-4 w-4" />}
        />

        {/* PDF Yazdır */}
        <StudioCommandButton
          commandId="pdf.print"
          onClick={onPrint}
          showLabel={false}
          title="PDF Yazdır (Ctrl+P)"
          className="hidden h-9 w-9 rounded-xl p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors lg:inline-flex"
          icon={<Printer className="h-4 w-4" />}
        />

        {/* PDF İndir */}
        {onDownload && (
          <StudioCommandButton
            commandId="studio.download"
            onClick={onDownload}
            showLabel={false}
            title="PDF İndir (Ctrl+D)"
            aria-label="PDF İndir"
            className="hidden h-9 w-9 rounded-xl p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors sm:inline-flex"
            icon={<Download className="h-4 w-4" />}
          />
        )}

        {/* Tam Ekran */}
        {onToggleFullscreen && (
          <StudioCommandButton
            commandId="studio.fullscreen"
            onClick={onToggleFullscreen}
            showLabel={false}
            title={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran Yap"}
            aria-label={isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran Yap"}
            data-testid="pdf-viewer-fullscreen-toggle"
            className="hidden h-9 w-9 rounded-xl p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors sm:inline-flex"
            icon={isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          />
        )}

        {/* Taşma ve Ek Menü (Dropdown) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="PDF ek işlemleri"
              data-testid="pdf-viewer-more-menu-trigger"
              className="inline-flex h-11 w-11 min-h-11 min-w-11 sm:h-9 sm:w-9 sm:min-h-9 sm:min-w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-amber-500 transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[210] w-56 bg-card/95 border-border shadow-2xl rounded-xl backdrop-blur-md p-1.5">
            <DropdownMenuItem
              className="cursor-pointer text-xs rounded-lg sm:hidden flex items-center justify-between"
              data-command-id="pdf.sidebar.toggle"
              onClick={onToggleSidebar}
            >
              <span>Sayfa küçük resimleri</span>
              {isSidebarOpen && <Check className="h-3.5 w-3.5 text-amber-500" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-xs rounded-lg min-[1100px]:hidden flex items-center justify-between"
              data-command-id="pdf.zoom.fitWidth"
              onClick={onFitWidth}
            >
              <span>Genişliğe sığdır</span>
              {zoomMode === "fit-width" && <Check className="h-3.5 w-3.5 text-amber-500" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-xs rounded-lg min-[1250px]:hidden flex items-center justify-between"
              data-command-id="pdf.zoom.fitPage"
              onClick={onFitPage}
            >
              <span>Sayfaya sığdır</span>
              {zoomMode === "fit-page" && <Check className="h-3.5 w-3.5 text-amber-500" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-xs rounded-lg md:hidden"
              data-command-id="pdf.rotateView"
              onClick={onRotateView}
            >
              Görünümü döndür
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-xs rounded-lg lg:hidden flex items-center justify-between"
              data-command-id="pdf.tool.select"
              onClick={() => onSetHandTool(false)}
            >
              <span>Metin seçim imleci</span>
              {!isHandTool && <Check className="h-3.5 w-3.5 text-amber-500" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-xs rounded-lg lg:hidden flex items-center justify-between"
              data-command-id="pdf.tool.hand"
              onClick={() => onSetHandTool(true)}
            >
              <span>Kaydırma / el aracı</span>
              {isHandTool && <Check className="h-3.5 w-3.5 text-amber-500" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-xs rounded-lg lg:hidden"
              data-command-id="pdf.print"
              onClick={onPrint}
            >
              PDF yazdır
            </DropdownMenuItem>

            {onDownload && (
              <DropdownMenuItem
                className="cursor-pointer text-xs rounded-lg sm:hidden flex items-center justify-between"
                data-command-id="studio.download"
                onClick={onDownload}
              >
                <span>PDF indir</span>
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuItem>
            )}

            {onToggleFullscreen && (
              <DropdownMenuItem
                onClick={onToggleFullscreen}
                data-command-id="studio.fullscreen"
                className="cursor-pointer text-xs rounded-lg sm:hidden flex items-center justify-between"
              >
                <span>{isFullscreen ? "Tam Ekrandan Çık" : "Tam Ekran Yap"}</span>
                {isFullscreen ? <Minimize2 className="h-3.5 w-3.5 text-muted-foreground" /> : <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />}
              </DropdownMenuItem>
            )}

            {onShare && (
              <DropdownMenuItem
                onClick={onShare}
                data-command-id="studio.share"
                className="flex items-center justify-between cursor-pointer text-xs rounded-lg sm:hidden"
              >
                <span>Paylaşım bağlantısı oluştur</span>
                <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuItem>
            )}

            {onRename && (
              <>
                <DropdownMenuSeparator className="bg-border/60 my-1" />
                <DropdownMenuItem
                  onClick={onRename}
                  data-command-id="studio.rename"
                  className="flex items-center gap-2 cursor-pointer text-xs rounded-lg py-1.5"
                >
                  <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                  <span>Yeniden Adlandır</span>
                </DropdownMenuItem>
              </>
            )}

            {displayName && (
              <>
                <DropdownMenuSeparator className="bg-border/60 my-1" />
                <div className="px-2 py-1.5 text-[11px] text-muted-foreground flex flex-col gap-0.5 select-text">
                  <div className="flex items-center gap-1.5 font-medium text-foreground truncate">
                    <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate">{displayName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    {sizeBytes != null && <span className="font-mono">{formatBytes(sizeBytes)}</span>}
                    <span className="uppercase font-bold text-rose-500/90 font-mono">PDF</span>
                    {numPages > 0 && <span>{numPages} Sayfa</span>}
                  </div>
                  {createdAt && <div className="text-[10px] text-muted-foreground/80">{formatDate(createdAt)}</div>}
                </div>
              </>
            )}

            {onDelete && (
              <>
                <DropdownMenuSeparator className="bg-border/60 my-1" />
                <DropdownMenuItem
                  onClick={onDelete}
                  data-command-id="studio.delete"
                  className="flex items-center gap-2 cursor-pointer text-xs text-red-500 focus:text-red-500 focus:bg-red-500/10 rounded-lg py-1.5 font-medium"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  <span>Çöp Kutusuna At</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden h-5 w-px bg-border/60 sm:block" />

        {/* Paylaşım Butonu */}
        {onShare && (
          <StudioCommandButton
            commandId="studio.share"
            onClick={onShare}
            showLabel={false}
            title="Paylaşım Bağlantısı Oluştur (Ctrl+Shift+S)"
            aria-label="Paylaşım Bağlantısı Oluştur"
            className="hidden h-9 w-9 rounded-xl p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors sm:inline-flex"
            icon={<Share2 className="h-4 w-4" />}
          />
        )}

        {/* Tema Seçici */}
        <div className="flex items-center shrink-0 pl-0.5">
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
