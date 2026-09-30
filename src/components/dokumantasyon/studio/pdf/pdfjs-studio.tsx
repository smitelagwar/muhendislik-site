// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PROFESSIONAL PDF.JS STUDIO VIEWER CORE
// ============================================================================

"use client";

import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { createSecurePdfLoadingTask } from "@/lib/dokumantasyon/studio/pdf/pdfjs-loader";
import { searchInPdfDocument, PdfSearchResult } from "@/lib/dokumantasyon/studio/pdf/pdf-search";
import { PdfPageView } from "./pdf-page-view";
import { PdfThumbnailSidebar } from "./pdf-thumbnail-sidebar";
import { PdfSearchBar } from "./pdf-search-bar";
import { PdfViewerToolbar } from "./pdf-viewer-toolbar";

interface PdfJsStudioProps {
  accessUrl: string;
  displayName: string;
  onAccessExpired?: () => Promise<unknown>;
  // --- YENİ: Toolbar birleştirmesi ---
  fileId?: string;
  versionNo?: number;
  sizeBytes?: number;
  extension?: string;
  createdAt?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onBack?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}

type ZoomMode = "custom" | "actual-size" | "fit-width" | "fit-page";

interface ZoomState {
  mode: ZoomMode;
  scale: number;
}

interface ZoomAnchor {
  viewportX: number;
  viewportY: number;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.2;

function clampScale(scale: number) {
  return Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
}

export function PdfJsStudio({
  accessUrl,
  displayName,
  onAccessExpired,
  fileId,
  versionNo,
  sizeBytes,
  extension,
  createdAt,
  isFullscreen,
  onToggleFullscreen,
  onBack,
  onShare,
  onDownload,
  onRename,
  onDelete,
}: PdfJsStudioProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadingTaskRef = useRef<any>(null);
  const zoomRef = useRef<ZoomState>({ mode: "fit-width", scale: 1.2 });
  const lastCommittedScaleRef = useRef<number>(1.2);
  const dragOriginRef = useRef({ x: 0, y: 0 });
  const activePointerIdRef = useRef<number | null>(null);
  const recoveredAccessUrlRef = useRef<string | null>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<ZoomState>({ mode: "fit-width", scale: 1.2 });
  const [renderedScale, setRenderedScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshingAccess, setIsRefreshingAccess] = useState(false);

  // Pan / Hand Tool Durumu
  const [isHandTool, setIsHandTool] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Kenar Çubuğu
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Arama Durumu
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResult, setSearchResult] = useState<PdfSearchResult>({
    query: "",
    totalMatches: 0,
    matches: [],
    pageMatchCounts: {},
  });
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [firstPageSize, setFirstPageSize] = useState<{ width: number; height: number } | null>(null);
  const scale = zoom.scale;

  const targetScaleRef = useRef<number>(zoom.scale);
  const activeAnchorRef = useRef<ZoomAnchor | null>(null);
  const zoomAnimFrameRef = useRef<number | null>(null);
  const debouncedRenderTimerRef = useRef<number | null>(null);

  const updateZoomState = useCallback((nextZoom: ZoomState) => {
    zoomRef.current = nextZoom;
    setZoom(nextZoom);
  }, []);

  const scheduleRenderedScaleCommit = useCallback((target: number) => {
    if (debouncedRenderTimerRef.current !== null) {
      window.clearTimeout(debouncedRenderTimerRef.current);
    }
    debouncedRenderTimerRef.current = window.setTimeout(() => {
      debouncedRenderTimerRef.current = null;
      setRenderedScale(Number(target.toFixed(3)));
    }, 220);
  }, []);

  const startSmoothZoomAnimation = useCallback(() => {
    if (zoomAnimFrameRef.current !== null) return;

    const animate = () => {
      const container = scrollContainerRef.current;
      if (!container) {
        zoomAnimFrameRef.current = null;
        return;
      }

      const currentScale = zoomRef.current.scale;
      const targetScale = targetScaleRef.current;
      const diff = targetScale - currentScale;

      if (Math.abs(diff) < 0.002) {
        updateZoomState({ mode: "custom", scale: targetScale });
        zoomAnimFrameRef.current = null;
        activeAnchorRef.current = null;
        scheduleRenderedScaleCommit(targetScale);
        return;
      }

      const nextScale = clampScale(currentScale + diff * 0.3);
      updateZoomState({ mode: "custom", scale: Number(nextScale.toFixed(4)) });
      scheduleRenderedScaleCommit(targetScale);

      zoomAnimFrameRef.current = window.requestAnimationFrame(animate);
    };

    zoomAnimFrameRef.current = window.requestAnimationFrame(animate);
  }, [scheduleRenderedScaleCommit, updateZoomState]);

  const getFitScale = useCallback((mode: Extract<ZoomMode, "fit-width" | "fit-page">) => {
    const container = scrollContainerRef.current;
    if (!container || !firstPageSize) return null;

    const isQuarterTurn = rotation % 180 !== 0;
    const pageWidth = isQuarterTurn ? firstPageSize.height : firstPageSize.width;
    const pageHeight = isQuarterTurn ? firstPageSize.width : firstPageSize.height;
    const horizontalPadding = container.clientWidth < 640 ? 32 : 64;
    const verticalPadding = container.clientHeight < 640 ? 32 : 64;
    const availableWidth = Math.max(container.clientWidth - horizontalPadding, 1);
    const availableHeight = Math.max(container.clientHeight - verticalPadding, 1);
    const targetScale = mode === "fit-width"
      ? availableWidth / pageWidth
      : Math.min(availableWidth / pageWidth, availableHeight / pageHeight);

    return Number(clampScale(targetScale).toFixed(2));
  }, [firstPageSize, rotation]);

  const applyFitMode = useCallback((mode: Extract<ZoomMode, "fit-width" | "fit-page">) => {
    const targetScale = getFitScale(mode);
    if (targetScale === null) return;

    if (zoomAnimFrameRef.current !== null) {
      window.cancelAnimationFrame(zoomAnimFrameRef.current);
      zoomAnimFrameRef.current = null;
    }
    if (debouncedRenderTimerRef.current !== null) {
      window.clearTimeout(debouncedRenderTimerRef.current);
      debouncedRenderTimerRef.current = null;
    }
    targetScaleRef.current = targetScale;
    activeAnchorRef.current = null;
    updateZoomState({ mode, scale: targetScale });
    setRenderedScale(targetScale);
  }, [getFitScale, updateZoomState]);

  const adjustCustomZoom = useCallback((delta: number, anchor?: ZoomAnchor) => {
    const container = scrollContainerRef.current;
    const currentTarget =
      zoomAnimFrameRef.current !== null
        ? targetScaleRef.current
        : zoomRef.current.scale;
    const nextTarget = clampScale(Number((currentTarget + delta).toFixed(2)));
    targetScaleRef.current = nextTarget;
    activeAnchorRef.current = anchor || (container ? {
      viewportX: container.clientWidth / 2,
      viewportY: container.clientHeight / 2,
    } : null);
    startSmoothZoomAnimation();
  }, [startSmoothZoomAnimation]);

  const handleZoomIn = useCallback(() => {
    const container = scrollContainerRef.current;
    const currentTarget =
      zoomAnimFrameRef.current !== null
        ? targetScaleRef.current
        : zoomRef.current.scale;
    const nextTarget = clampScale(Number((currentTarget * 1.25).toFixed(2)));
    targetScaleRef.current = nextTarget;
    activeAnchorRef.current = container ? {
      viewportX: container.clientWidth / 2,
      viewportY: container.clientHeight / 2,
    } : null;
    startSmoothZoomAnimation();
  }, [startSmoothZoomAnimation]);

  const handleZoomOut = useCallback(() => {
    const container = scrollContainerRef.current;
    const currentTarget =
      zoomAnimFrameRef.current !== null
        ? targetScaleRef.current
        : zoomRef.current.scale;
    const nextTarget = clampScale(Number((currentTarget / 1.25).toFixed(2)));
    targetScaleRef.current = nextTarget;
    activeAnchorRef.current = container ? {
      viewportX: container.clientWidth / 2,
      viewportY: container.clientHeight / 2,
    } : null;
    startSmoothZoomAnimation();
  }, [startSmoothZoomAnimation]);

  const setActualSize = useCallback(() => {
    const container = scrollContainerRef.current;
    targetScaleRef.current = 1;
    activeAnchorRef.current = container ? {
      viewportX: container.clientWidth / 2,
      viewportY: container.clientHeight / 2,
    } : null;
    startSmoothZoomAnimation();
  }, [startSmoothZoomAnimation]);

  // Sayfa boyutu React ve PDF.js tarafından commit edildikten sonra imleç
  // altındaki belge noktasını aynı viewport koordinatında tut.
  useLayoutEffect(() => {
    const prevScale = lastCommittedScaleRef.current;
    lastCommittedScaleRef.current = scale;

    const activeAnchor = activeAnchorRef.current;
    const container = scrollContainerRef.current;
    if (!activeAnchor || !container || prevScale <= 0 || prevScale === scale) return;

    const logicalX = (container.scrollLeft + activeAnchor.viewportX) / prevScale;
    const logicalY = (container.scrollTop + activeAnchor.viewportY) / prevScale;
    container.scrollLeft = Math.max(logicalX * scale - activeAnchor.viewportX, 0);
    container.scrollTop = Math.max(logicalY * scale - activeAnchor.viewportY, 0);
  }, [scale]);

  // 1. PDF Dokümanını Yükle ve Güvenli Yaşam Döngüsü Başlat
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    async function init() {
      try {
        const task = await createSecurePdfLoadingTask(accessUrl);
        loadingTaskRef.current = task;

        const doc = await task.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);

        try {
          const firstPage = await doc.getPage(1);
          const vp = firstPage.getViewport({ scale: 1.0 });
          setFirstPageSize({ width: vp.width || 595, height: vp.height || 842 });
        } catch {
          setFirstPageSize({ width: 595, height: 842 });
        }

        setLoading(false);
      } catch (err: unknown) {
        if (!isMounted) return;
        const httpStatus = typeof (err as { status?: unknown })?.status === "number"
          ? (err as { status: number }).status
          : null;
        const isExpiredAccess = httpStatus === 401 || httpStatus === 403 || /(?:401|403|unauthorized|forbidden)/i.test(
          err instanceof Error ? err.message : ""
        );

        if (isExpiredAccess && onAccessExpired && recoveredAccessUrlRef.current !== accessUrl) {
          recoveredAccessUrlRef.current = accessUrl;
          setIsRefreshingAccess(true);
          try {
            await onAccessExpired();
            return;
          } catch (refreshError) {
            console.warn("PDF access URL refresh failed:", refreshError);
            setError("PDF erişim bağlantısı yenilenemedi. Lütfen yeniden deneyin.");
          } finally {
            if (isMounted) {
              setIsRefreshingAccess(false);
              setLoading(false);
            }
          }
          return;
        }

        console.error("PDF yükleme hatası:", err);
        setError(
          err instanceof Error
            ? err.message
            : "PDF dokümanı yüklenirken bir hata oluştu."
        );
        setLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
      if (loadingTaskRef.current) {
        try {
          loadingTaskRef.current.destroy?.();
        } catch {}
      }
      if (pdfDoc) {
        try {
          pdfDoc.destroy?.();
        } catch {}
      }
    };
  }, [accessUrl, onAccessExpired]);

  // Scroll viewport mount edildikten sonra aktif fit modunu koru.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (loading || !container || !firstPageSize) return;

    const updateFitMode = () => {
      const mode = zoomRef.current.mode;
      if (mode === "fit-width" || mode === "fit-page") {
        applyFitMode(mode);
      }
    };

    const frame = window.requestAnimationFrame(updateFitMode);
    const observer = new ResizeObserver(updateFitMode);
    observer.observe(container);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [applyFitMode, firstPageSize, loading, rotation]);

  // 2. Sayfaya Kaydırma (Scroll to Page)
  const scrollToPage = useCallback((pageNum: number) => {
    if (pageNum < 1 || pageNum > numPages) return;
    setCurrentPage(pageNum);

    const pageEl = document.getElementById(`pdf-page-${pageNum}`);
    const container = scrollContainerRef.current;
    if (pageEl && container) {
      container.scrollTo({
        top: Math.max(pageEl.offsetTop - 16, 0),
        behavior: "smooth",
      });
    }
  }, [numPages]);

  // 3. Arama İşlevi
  useEffect(() => {
    if (!pdfDoc || !searchQuery.trim() || !isSearchOpen) {
      setSearchResult({ query: "", totalMatches: 0, matches: [], pageMatchCounts: {} });
      setCurrentMatchIndex(0);
      return;
    }

    let isCurrent = true;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const res = await searchInPdfDocument(pdfDoc, searchQuery);
        if (!isCurrent) return;

        setSearchResult(res);
        setCurrentMatchIndex(0);

        if (res.matches.length > 0) {
          scrollToPage(res.matches[0].pageNumber);
        }
      } finally {
        if (isCurrent) setIsSearching(false);
      }
    }, 200);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [pdfDoc, searchQuery, isSearchOpen, scrollToPage]);

  const handleNextMatch = () => {
    if (searchResult.totalMatches === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchResult.totalMatches;
    setCurrentMatchIndex(nextIdx);
    scrollToPage(searchResult.matches[nextIdx].pageNumber);
  };

  const handlePrevMatch = () => {
    if (searchResult.totalMatches === 0) return;
    const prevIdx =
      (currentMatchIndex - 1 + searchResult.totalMatches) % searchResult.totalMatches;
    setCurrentMatchIndex(prevIdx);
    scrollToPage(searchResult.matches[prevIdx].pageNumber);
  };

  // 4. Ctrl + Wheel / trackpad pinch: yalnızca gerçek PDF viewport'unda zoom.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (loading || !pdfDoc || !container) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;

      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const anchor: ZoomAnchor = {
        viewportX: e.clientX - rect.left,
        viewportY: e.clientY - rect.top,
      };
      activeAnchorRef.current = anchor;

      const deltaMultiplier =
        e.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : e.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? container.clientHeight
            : 1;
      const normalizedDelta = Math.min(
        Math.max(e.deltaY * deltaMultiplier, -250),
        250
      );

      // Tekerlek ivmesine duyarlı pürüzsüz sürekli yakınlaştırma
      const zoomFactor = Math.exp(-normalizedDelta * 0.002);
      const currentTarget =
        zoomAnimFrameRef.current !== null
          ? targetScaleRef.current
          : zoomRef.current.scale;
      targetScaleRef.current = clampScale(currentTarget * zoomFactor);

      startSmoothZoomAnimation();
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      if (zoomAnimFrameRef.current !== null) {
        window.cancelAnimationFrame(zoomAnimFrameRef.current);
        zoomAnimFrameRef.current = null;
      }
      if (debouncedRenderTimerRef.current !== null) {
        window.clearTimeout(debouncedRenderTimerRef.current);
        debouncedRenderTimerRef.current = null;
      }
    };
  }, [loading, pdfDoc, startSmoothZoomAnimation]);

  const defaultDownload = useCallback(() => {
    const a = document.createElement("a");
    a.href = accessUrl;
    const name = displayName || "dokuman.pdf";
    a.download = name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [accessUrl, displayName]);

  const handleDownloadAction = onDownload || defaultDownload;

  // 5. Klavye Kısayolları (Shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Eğer bir input veya textarea içindeyse ele geçirme
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        adjustCustomZoom(ZOOM_STEP);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        adjustCustomZoom(-ZOOM_STEP);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        applyFitMode("fit-page");
      } else if ((e.ctrlKey || e.metaKey) && e.key === "1") {
        e.preventDefault();
        setActualSize();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "2") {
        e.preventDefault();
        applyFitMode("fit-width");
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === "h") {
        e.preventDefault();
        setIsHandTool(true);
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === "v") {
        e.preventDefault();
        setIsHandTool(false);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
        e.preventDefault();
        setRotation((r) => (r + 90) % 360);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handlePrint();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleDownloadAction();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "s") {
        if (onShare) {
          e.preventDefault();
          onShare();
        }
      } else if (e.key === "PageUp") {
        e.preventDefault();
        scrollToPage(Math.max(currentPage - 1, 1));
      } else if (e.key === "PageDown") {
        e.preventDefault();
        scrollToPage(Math.min(currentPage + 1, numPages));
      } else if (e.key === "Home") {
        e.preventDefault();
        scrollToPage(1);
      } else if (e.key === "End") {
        e.preventDefault();
        scrollToPage(numPages);
      } else if (e.key === "Escape") {
        if (isSearchOpen) {
          e.preventDefault();
          e.stopPropagation();
          setIsSearchOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [adjustCustomZoom, applyFitMode, currentPage, numPages, scrollToPage, setActualSize, isSearchOpen, handleDownloadAction, onShare]);

  // 6. Genişliğe / Sayfaya Sığdırma Hesaplamaları
  const handleFitWidth = () => {
    applyFitMode("fit-width");
  };

  const handleFitPage = () => {
    applyFitMode("fit-page");
  };

  const handlePrint = () => {
    window.print();
  };

  // 7. Pan / Fare ile Kaydırma (Hand Tool)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isHandTool || !scrollContainerRef.current) return;
    if (zoomAnimFrameRef.current !== null) {
      window.cancelAnimationFrame(zoomAnimFrameRef.current);
      zoomAnimFrameRef.current = null;
    }
    activeAnchorRef.current = null;
    const container = scrollContainerRef.current;
    activePointerIdRef.current = e.pointerId;
    container.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragOriginRef.current = {
      x: e.clientX + scrollContainerRef.current.scrollLeft,
      y: e.clientY + scrollContainerRef.current.scrollTop,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isHandTool || activePointerIdRef.current !== e.pointerId || !scrollContainerRef.current) return;
    scrollContainerRef.current.scrollLeft = dragOriginRef.current.x - e.clientX;
    scrollContainerRef.current.scrollTop = dragOriginRef.current.y - e.clientY;
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    activePointerIdRef.current = null;
    setIsDragging(false);
  };

  const currentMatch = searchResult.matches[currentMatchIndex];

  return (
    <div data-zoom-mode={zoom.mode} className="flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden bg-background text-foreground select-none">
      {/* 1. PDF Studio Toolbar */}
      <PdfViewerToolbar
        numPages={numPages}
        currentPage={currentPage}
        scale={scale}
        zoomMode={zoom.mode}
        isSidebarOpen={isSidebarOpen}
        isHandTool={isHandTool}
        isSearchOpen={isSearchOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onPageChange={scrollToPage}
        onSetHandTool={setIsHandTool}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoom100={setActualSize}
        onFitWidth={handleFitWidth}
        onFitPage={handleFitPage}
        onRotateView={() => setRotation((r) => (r + 90) % 360)}
        onToggleSearch={() => setIsSearchOpen((prev) => !prev)}
        onPrint={handlePrint}
        displayName={displayName}
        sizeBytes={sizeBytes}
        extension={extension}
        versionNo={versionNo}
        createdAt={createdAt}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        onBack={onBack}
        onShare={onShare}
        onDownload={handleDownloadAction}
        onRename={onRename}
        onDelete={onDelete}
      />

      {/* 2. Doküman İçi Arama Çubuğu */}
      <PdfSearchBar
        isOpen={isSearchOpen}
        searchQuery={searchQuery}
        totalMatches={searchResult.totalMatches}
        currentMatchIndex={currentMatchIndex}
        isSearching={isSearching}
        onQueryChange={setSearchQuery}
        onNextMatch={handleNextMatch}
        onPrevMatch={handlePrevMatch}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* 3. Ana Çalışma Alanı (Kenar Çubuğu + Sürekli Dikey Kaydırma Sayfaları) */}
      <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {/* Sol Kenar Çubuğu (Thumbnails) */}
        <PdfThumbnailSidebar
          pdfDoc={pdfDoc}
          numPages={numPages}
          currentPage={currentPage}
          isOpen={isSidebarOpen}
          onSelectPage={scrollToPage}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Yükleniyor ve Hata Durumları */}
        {loading && (
          <div data-testid="pdf-viewer-status" role="status" className="flex flex-1 flex-col items-center justify-center py-20 text-zinc-400">
            <Loader2 className="h-9 w-9 animate-spin text-amber-500 mb-3" />
            <span className="text-sm font-medium text-zinc-300">
              {isRefreshingAccess ? "PDF erişim bağlantısı yenileniyor..." : "PDF dokümanı ve katmanlar hazırlanıyor..."}
            </span>
          </div>
        )}

        {error && (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="mx-auto max-w-md rounded-2xl border border-red-500/30 bg-red-950/30 p-6 text-center text-red-400 shadow-2xl backdrop-blur-md">
              <AlertCircle className="mx-auto h-9 w-9 text-red-500 mb-2" />
              <h3 className="text-sm font-bold text-red-200">PDF Yükleme Hatası</h3>
              <p className="mt-1 text-xs text-zinc-400">{error}</p>
            </div>
          </div>
        )}

        {/* Sürekli Dikey Kaydırma (Continuous Vertical Scroll Workspace) */}
        {!loading && !error && pdfDoc && (
          <div
            ref={scrollContainerRef}
            data-testid="pdf-scroll-viewport"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            className={`min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain [scrollbar-gutter:stable] bg-muted/50 p-4 sm:p-8 dark:bg-zinc-900/60 ${
              isHandTool
                ? isDragging
                  ? "cursor-grabbing touch-none"
                  : "cursor-grab touch-none"
                : "cursor-default"
            }`}
          >
            <div className="flex min-w-full w-max flex-col items-center py-2">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <PdfPageView
                  key={pageNum}
                  pdfDoc={pdfDoc}
                  pageNumber={pageNum}
                  scale={scale}
                  renderedScale={renderedScale}
                  rotation={rotation}
                  isHandTool={isHandTool}
                  searchQuery={isSearchOpen ? searchQuery : ""}
                  isCurrentMatchPage={currentMatch?.pageNumber === pageNum}
                  onPageVisible={(visiblePage) => {
                    setCurrentPage(visiblePage);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
