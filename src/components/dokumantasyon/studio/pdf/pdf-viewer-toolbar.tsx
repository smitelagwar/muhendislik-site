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
  ChevronDown,
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
  Keyboard,
  Bookmark,
  ArrowLeftCircle,
  Moon,
  Layout,
  Gauge,
  Sparkles,
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { formatBytes, formatDate } from "../../ui-helpers";
import { StudioCommandButton } from "../studio-command-button";
import { getPdfRememberSettings, setPdfRememberSettings } from "@/lib/dokumantasyon/studio/pdf/pdf-reading-position";
import { getPageFromLabel } from "@/lib/dokumantasyon/studio/pdf/pdf-navigation";
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
  onZoomSelect?: (targetScale: number) => void;
  onRotateView: () => void;
  onToggleSearch: () => void;
  onPrint: () => void;
  onOpenShortcuts?: () => void;
  // --- Faz G: Gezinme, Sayfa Etiketleri, İçindekiler ve Geçmiş Propları ---
  pageLabels?: (string | null | undefined)[] | null;
  hasOutline?: boolean;
  onToggleOutline?: () => void;
  canNavigateBack?: boolean;
  onNavigateBack?: () => void;
  // --- Faz H: Okuma Konumu ve Ayarlar Propları ---
  nightMode?: boolean;
  onToggleNightMode?: () => void;
  defaultViewMode?: "fit-width" | "fit-page";
  onChangeDefaultViewMode?: (mode: "fit-width" | "fit-page") => void;
  reduceMotion?: "system" | "on" | "off";
  onChangeReduceMotion?: (mode: "system" | "on" | "off") => void;
  rememberPosition?: boolean;
  onToggleRememberPosition?: () => void;
  // --- Faz R3: Bozuk Harf Eşleme Onarım Propları ---
  isTextRepaired?: boolean;
  autoRepairText?: boolean;
  onToggleAutoRepairText?: () => void;
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
  onZoomSelect,
  onRotateView,
  onToggleSearch,
  onPrint,
  onOpenShortcuts,
  pageLabels,
  hasOutline,
  onToggleOutline,
  canNavigateBack,
  onNavigateBack,
  nightMode = false,
  onToggleNightMode,
  defaultViewMode = "fit-width",
  onChangeDefaultViewMode,
  reduceMotion = "system",
  onChangeReduceMotion,
  rememberPosition: rememberPositionProp,
  onToggleRememberPosition,
  isTextRepaired = false,
  autoRepairText = true,
  onToggleAutoRepairText,
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
  const [internalRememberPosition, setInternalRememberPosition] = useState<boolean>(true);

  const effectiveRememberPosition =
    typeof rememberPositionProp === "boolean" ? rememberPositionProp : internalRememberPosition;

  const currentLabel =
    pageLabels && pageLabels[currentPage - 1] ? pageLabels[currentPage - 1] : null;
  const showLabelBadge = Boolean(currentLabel && currentLabel !== String(currentPage));

  useEffect(() => {
    setInternalRememberPosition(getPdfRememberSettings());
  }, []);

  useEffect(() => {
    setPageInputVal(String(currentPage));
  }, [currentPage]);

  const commitPageInput = () => {
    // 1. Sayfa etiketleri arasında tam/büyük-küçük harf eşleşmesi kontrol et (örn: "iv", "A-3")
    const matchedFromLabel = getPageFromLabel(pageLabels, pageInputVal);
    if (matchedFromLabel !== null && matchedFromLabel >= 1 && matchedFromLabel <= numPages) {
      onPageChange(matchedFromLabel);
      return;
    }

    // 2. Normal sayısal sayfa numarası girişi
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
      role="toolbar"
      aria-label="PDF stüdyo araç çubuğu"
      className="z-30 box-border flex h-14 w-full min-w-0 shrink-0 items-center justify-between gap-1 border-b border-border/70 bg-card/85 pl-[max(0.375rem,env(safe-area-inset-left))] pr-[max(0.375rem,env(safe-area-inset-right))] text-xs text-foreground backdrop-blur-2xl shadow-sm select-none sm:h-16 sm:px-3 sm:gap-1.5 print:hidden"
    >
      {/* 1. Sol Alan: Geri Dönüş, Dosya Kimliği ve Sayfa Gezintisi */}
      <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
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
              className="h-11 w-11 min-h-11 min-w-11 sm:h-9 sm:w-9 sm:min-h-9 sm:min-w-9 shrink-0 rounded-xl p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
              icon={<ArrowLeft className="h-4.5 w-4.5" />}
            />
            <div className="hidden h-5 w-px bg-border/60 sm:block" />
          </>
        )}

        {/* Dosya Kimlik Bloğu — Mobilde (< 480px) taşmayı önlemek için '⋮' menüsünde gösterilir */}
        {displayName && (
          <div className="hidden min-[480px]:flex flex-col min-w-0 pr-1">
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

        {/* İçindekiler / Yer İmleri Butonu (Yalnızca Outline Varsa Görünür, Yoksa Gizli) */}
        {hasOutline && onToggleOutline && (
          <StudioCommandButton
            commandId="pdf.outline.toggle"
            onClick={onToggleOutline}
            active={isSidebarOpen}
            showLabel={false}
            title="İçindekiler / Yer İmleri"
            aria-label="İçindekiler"
            data-testid="pdf-outline-toggle-btn"
            className="hidden h-9 w-9 rounded-xl p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors sm:inline-flex"
            icon={<Bookmark className="h-4 w-4" />}
          />
        )}

        {/* Gezinme Geçmişi: Önceki Konuma Dön (Geri) */}
        {canNavigateBack && onNavigateBack && (
          <StudioCommandButton
            commandId="pdf.navigation.back"
            onClick={onNavigateBack}
            showLabel={false}
            title="Önceki Konuma Dön"
            aria-label="Önceki konuma dön"
            data-testid="pdf-nav-back-btn"
            className="hidden sm:inline-flex h-9 w-9 rounded-xl p-0 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 transition-colors animate-in fade-in"
            icon={<ArrowLeftCircle className="h-4 w-4" />}
          />
        )}

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
            aria-label="Önceki Sayfa"
            className="h-11 w-11 min-h-11 min-w-11 sm:h-9 sm:w-9 sm:min-h-9 sm:min-w-9 shrink-0 rounded-xl p-0 text-muted-foreground disabled:opacity-30"
            icon={<ChevronLeft className="h-4 w-4" />}
          />

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1 px-0.5 text-xs font-medium">
            {showLabelBadge && (
              <span
                data-testid="pdf-page-label-badge"
                className="hidden min-[420px]:inline-block shrink-0 rounded bg-amber-500/15 border border-amber-500/30 px-1 py-0.5 font-mono text-[10px] font-bold text-amber-500"
                title={`Sayfa Etiketi: ${currentLabel}`}
              >
                {currentLabel}
              </span>
            )}
            <input
              type="text"
              inputMode="text"
              value={pageInputVal}
              disabled={numPages <= 0}
              onChange={(e) => setPageInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              onBlur={commitPageInput}
              className="h-9 w-8 sm:h-8 sm:w-11 rounded-lg border border-input bg-background/80 px-0.5 text-center font-mono text-xs text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-inner disabled:opacity-50"
              aria-label="Geçerli Sayfa"
            />
            <span className="font-semibold text-muted-foreground font-mono text-[10px] sm:text-[11px]">/ {numPages || "—"}</span>
          </div>

          <StudioCommandButton
            commandId="pdf.page.next"
            onClick={() => onPageChange(Math.min(currentPage + 1, numPages))}
            disabled={currentPage >= numPages}
            showLabel={false}
            title="Sonraki Sayfa"
            aria-label="Sonraki Sayfa"
            className="h-11 w-11 min-h-11 min-w-11 sm:h-9 sm:w-9 sm:min-h-9 sm:min-w-9 shrink-0 rounded-xl p-0 text-muted-foreground disabled:opacity-30"
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
          aria-label="Dokümanda Ara"
          className="h-11 w-11 min-h-11 min-w-11 sm:h-9 sm:w-9 sm:min-h-9 sm:min-w-9 shrink-0 rounded-xl p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
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
            className="hidden min-[420px]:inline-flex h-11 w-11 min-h-11 min-w-11 sm:h-9 sm:w-9 sm:min-h-9 sm:min-w-9 rounded-lg p-0 text-muted-foreground hover:bg-background/80 hover:text-foreground transition-colors"
            icon={<ZoomOut className="h-4 w-4" />}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                data-command-id="pdf.zoom.100"
                title={`Ölçek Menüsü · ${zoomPercent}%`}
                aria-label={`Ölçek Menüsü, yüzde ${zoomPercent}`}
                className="hidden min-[380px]:inline-flex items-center gap-1 h-11 min-h-11 px-1.5 sm:px-2 sm:h-9 sm:min-h-9 rounded-lg text-xs font-mono font-bold text-muted-foreground hover:bg-background/80 hover:text-foreground transition-colors select-none outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
              >
                <span>{zoomPercent}%</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              className="z-[220] w-48 bg-card/95 border-border shadow-2xl rounded-xl backdrop-blur-md p-1 font-sans"
            >
              <DropdownMenuItem
                className="cursor-pointer text-xs rounded-lg flex items-center justify-between"
                onClick={onFitWidth}
              >
                <span>Genişliğe Sığdır</span>
                {zoomMode === "fit-width" && <Check className="h-3.5 w-3.5 text-amber-500" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-xs rounded-lg flex items-center justify-between"
                onClick={onFitPage}
              >
                <span>Sayfaya Sığdır</span>
                {zoomMode === "fit-page" && <Check className="h-3.5 w-3.5 text-amber-500" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-xs rounded-lg flex items-center justify-between"
                onClick={onZoom100}
              >
                <span>Gerçek Boyut (%100)</span>
                {(zoomMode === "actual-size" || (zoomMode === "custom" && zoomPercent === 100)) && (
                  <Check className="h-3.5 w-3.5 text-amber-500" />
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {[50, 75, 100, 125, 150, 200, 300, 400, 500].map((stepPct) => (
                <DropdownMenuItem
                  key={stepPct}
                  className="cursor-pointer text-xs font-mono rounded-lg flex items-center justify-between"
                  onClick={() => {
                    if (onZoomSelect) {
                      onZoomSelect(stepPct / 100);
                    } else if (stepPct === 100) {
                      onZoom100();
                    }
                  }}
                >
                  <span>%{stepPct}</span>
                  {zoomPercent === stepPct && zoomMode === "custom" && (
                    <Check className="h-3.5 w-3.5 text-amber-500" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <StudioCommandButton
            commandId="pdf.zoom.in"
            onClick={onZoomIn}
            showLabel={false}
            title="Yakınlaştır (Ctrl++)"
            aria-label="Yakınlaştır"
            className="h-11 w-11 min-h-11 min-w-11 sm:h-9 sm:w-9 sm:min-h-9 sm:min-w-9 shrink-0 rounded-lg p-0 text-muted-foreground hover:bg-background/80 hover:text-foreground transition-colors"
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

        {/* Faz R3: Metin Onarım Bilgi Rozeti */}
        {isTextRepaired && (
          <div
            data-testid="pdf-text-repaired-badge"
            className="hidden items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 xl:inline-flex"
            title="Bozuk font harf eşlemesi (Ĝ -> i) kopyalama ve aramada otomatik onarıldı"
          >
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>Metin onarıldı</span>
          </div>
        )}

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
            {hasOutline && onToggleOutline && (
              <DropdownMenuItem
                className="cursor-pointer text-xs rounded-lg sm:hidden flex items-center justify-between"
                data-command-id="pdf.outline.toggle"
                onClick={onToggleOutline}
              >
                <span>İçindekiler / Yer İmleri</span>
                <Bookmark className="h-3.5 w-3.5 text-amber-500" />
              </DropdownMenuItem>
            )}
            {canNavigateBack && onNavigateBack && (
              <DropdownMenuItem
                className="cursor-pointer text-xs rounded-lg flex items-center justify-between text-amber-500 font-medium"
                data-command-id="pdf.navigation.back"
                onClick={onNavigateBack}
              >
                <span>Önceki konuma dön</span>
                <ArrowLeftCircle className="h-3.5 w-3.5" />
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="cursor-pointer text-xs rounded-lg min-[420px]:hidden flex items-center justify-between"
              data-command-id="pdf.zoom.out"
              onClick={onZoomOut}
            >
              <span>Uzaklaştır</span>
              <ZoomOut className="h-3.5 w-3.5 text-muted-foreground" />
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-xs rounded-lg min-[380px]:hidden flex items-center justify-between"
              data-command-id="pdf.zoom.100"
              onClick={onZoom100}
            >
              <span>Orijinal boyut (%100)</span>
              {zoomPercent === 100 && <Check className="h-3.5 w-3.5 text-amber-500" />}
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
            <DropdownMenuSeparator className="bg-border/60 my-1" />
            
            {/* 1. Son okunan konumu hatırla */}
            <DropdownMenuItem
              onClick={() => {
                if (onToggleRememberPosition) {
                  onToggleRememberPosition();
                } else {
                  const next = !internalRememberPosition;
                  setInternalRememberPosition(next);
                  setPdfRememberSettings(next);
                }
              }}
              data-command-id="pdf.settings.rememberPosition"
              data-testid="pdf-remember-position-toggle"
              className="flex items-center justify-between cursor-pointer text-xs rounded-lg py-1.5"
            >
              <span>Son okunan konumu hatırla</span>
              {effectiveRememberPosition ? (
                <Check className="h-3.5 w-3.5 text-amber-500" />
              ) : (
                <span className="text-[10px] text-muted-foreground">Kapalı</span>
              )}
            </DropdownMenuItem>

            {/* 2. Gece modu */}
            <DropdownMenuItem
              onClick={onToggleNightMode}
              data-command-id="pdf.settings.nightMode"
              data-testid="pdf-night-mode-toggle"
              className="flex items-center justify-between cursor-pointer text-xs rounded-lg py-1.5"
            >
              <span className="flex items-center gap-2">
                <Moon className="h-3.5 w-3.5 text-indigo-400" />
                <span>Gece modu</span>
              </span>
              {nightMode ? (
                <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">Açık</span>
              ) : (
                <span className="text-[10px] text-muted-foreground">Kapalı</span>
              )}
            </DropdownMenuItem>

            {/* 3. Varsayılan görünüm */}
            <DropdownMenuItem
              onClick={() => {
                const nextMode = defaultViewMode === "fit-page" ? "fit-width" : "fit-page";
                onChangeDefaultViewMode?.(nextMode);
              }}
              data-command-id="pdf.settings.defaultViewMode"
              data-testid="pdf-default-view-mode-toggle"
              className="flex items-center justify-between cursor-pointer text-xs rounded-lg py-1.5"
            >
              <span className="flex items-center gap-2">
                <Layout className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Varsayılan görünüm</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {defaultViewMode === "fit-page" ? "Sayfaya Sığdır" : "Genişliğe Sığdır"}
              </span>
            </DropdownMenuItem>

            {/* 4. Hareketleri azalt */}
            <DropdownMenuItem
              onClick={() => {
                const modes: ("system" | "on" | "off")[] = ["system", "on", "off"];
                const currentIdx = modes.indexOf(reduceMotion || "system");
                const nextMode = modes[(currentIdx + 1) % modes.length];
                onChangeReduceMotion?.(nextMode);
              }}
              data-command-id="pdf.settings.reduceMotion"
              data-testid="pdf-reduce-motion-toggle"
              className="flex items-center justify-between cursor-pointer text-xs rounded-lg py-1.5"
            >
              <span className="flex items-center gap-2">
                <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Hareketleri azalt</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {reduceMotion === "on" ? "Açık" : reduceMotion === "off" ? "Kapalı" : "Sistem"}
              </span>
            </DropdownMenuItem>

            {/* 5. Bozuk Harf Eşlemesini Otomatik Onar (Faz R3) */}
            <DropdownMenuItem
              onClick={onToggleAutoRepairText}
              data-command-id="pdf.settings.autoRepairText"
              data-testid="pdf-auto-repair-text-toggle"
              className="flex items-center justify-between cursor-pointer text-xs rounded-lg py-1.5"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Bozuk harf onarımı (Ĝ &rarr; i)</span>
              </span>
              {autoRepairText && <Check className="h-3.5 w-3.5 text-amber-500" />}
            </DropdownMenuItem>

            {onOpenShortcuts && (
              <>
                <DropdownMenuSeparator className="bg-border/60 my-1" />
                <DropdownMenuItem
                  onClick={onOpenShortcuts}
                  data-command-id="pdf.shortcuts"
                  data-testid="pdf-shortcuts-btn"
                  className="flex items-center justify-between cursor-pointer text-xs rounded-lg py-1.5"
                >
                  <span className="flex items-center gap-2">
                    <Keyboard className="h-3.5 w-3.5 text-amber-500" />
                    <span>Klavye kısayolları</span>
                  </span>
                  <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground border border-border">?</kbd>
                </DropdownMenuItem>
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

        {/* Tema Seçici — Mobilde gece modu '⋮' menüsünden kontrol edilir */}
        <div className="hidden sm:flex items-center shrink-0 pl-0.5">
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
