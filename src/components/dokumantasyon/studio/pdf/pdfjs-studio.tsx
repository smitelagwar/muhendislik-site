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

interface PendingZoomAnchor extends ZoomAnchor {
  sourceScale: number;
  targetScale: number;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.2;

function clampScale(scale: number) {
  return Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
}

export function PdfJsStudio({ accessUrl, displayName, onAccessExpired }: PdfJsStudioProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadingTaskRef = useRef<any>(null);
  const zoomRef = useRef<ZoomState>({ mode: "fit-width", scale: 1.2 });
  const pendingZoomAnchorRef = useRef<PendingZoomAnchor | null>(null);
  const wheelFrameRef = useRef<number | null>(null);
  const wheelDeltaRef = useRef(0);
  const wheelAnchorRef = useRef<ZoomAnchor | null>(null);
  const anchorFrameRef = useRef<number | null>(null);
  const dragOriginRef = useRef({ x: 0, y: 0 });
  const activePointerIdRef = useRef<number | null>(null);
  const recoveredAccessUrlRef = useRef<string | null>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<ZoomState>({ mode: "fit-width", scale: 1.2 });
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

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

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

    setZoom((current) => (
      current.mode === mode && current.scale === targetScale
        ? current
        : { mode, scale: targetScale }
    ));
  }, [getFitScale]);

  const adjustCustomZoom = useCallback((delta: number, anchor?: ZoomAnchor) => {
    setZoom((current) => {
      const targetScale = Number(clampScale(current.scale + delta).toFixed(2));
      if (anchor && targetScale !== current.scale) {
        pendingZoomAnchorRef.current = {
          ...anchor,
          sourceScale: current.scale,
          targetScale,
        };
      }
      return current.mode === "custom" && current.scale === targetScale
        ? current
        : { mode: "custom", scale: targetScale };
    });
  }, []);

  const setActualSize = useCallback(() => {
    setZoom((current) => (
      current.mode === "actual-size" && current.scale === 1
        ? current
        : { mode: "actual-size", scale: 1 }
    ));
  }, []);

  // Sayfa boyutu React ve PDF.js tarafından commit edildikten sonra imleç
  // altındaki belge noktasını aynı viewport koordinatında tut.
  useLayoutEffect(() => {
    const pendingAnchor = pendingZoomAnchorRef.current;
    const container = scrollContainerRef.current;
    if (!pendingAnchor || !container || pendingAnchor.targetScale !== scale) return;

    pendingZoomAnchorRef.current = null;
    const applyAnchor = () => {
      const currentContainer = scrollContainerRef.current;
      if (!currentContainer) return;
      const logicalX = (currentContainer.scrollLeft + pendingAnchor.viewportX) / pendingAnchor.sourceScale;
      const logicalY = (currentContainer.scrollTop + pendingAnchor.viewportY) / pendingAnchor.sourceScale;
      currentContainer.scrollLeft = Math.max(logicalX * pendingAnchor.targetScale - pendingAnchor.viewportX, 0);
      currentContainer.scrollTop = Math.max(logicalY * pendingAnchor.targetScale - pendingAnchor.viewportY, 0);
    };

    anchorFrameRef.current = window.requestAnimationFrame(() => {
      anchorFrameRef.current = window.requestAnimationFrame(applyAnchor);
    });

    return () => {
      if (anchorFrameRef.current !== null) {
        window.cancelAnimationFrame(anchorFrameRef.current);
        anchorFrameRef.current = null;
      }
    };
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
      wheelDeltaRef.current += e.deltaY;
      wheelAnchorRef.current = {
        viewportX: e.clientX - rect.left,
        viewportY: e.clientY - rect.top,
      };

      if (wheelFrameRef.current !== null) return;
      wheelFrameRef.current = window.requestAnimationFrame(() => {
        const delta = wheelDeltaRef.current;
        const anchor = wheelAnchorRef.current ?? undefined;
        wheelDeltaRef.current = 0;
        wheelAnchorRef.current = null;
        wheelFrameRef.current = null;
        const steps = Math.min(Math.max(Math.round(Math.abs(delta) / 100), 1), 4);
        adjustCustomZoom((delta < 0 ? 1 : -1) * ZOOM_STEP * steps, anchor);
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      if (wheelFrameRef.current !== null) {
        window.cancelAnimationFrame(wheelFrameRef.current);
        wheelFrameRef.current = null;
      }
    };
  }, [adjustCustomZoom, loading, pdfDoc]);

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
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
        e.preventDefault();
        setRotation((r) => (r + 90) % 360);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handlePrint();
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
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [adjustCustomZoom, applyFitMode, currentPage, numPages, scrollToPage, setActualSize]);

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
        isSidebarOpen={isSidebarOpen}
        isHandTool={isHandTool}
        isSearchOpen={isSearchOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onPageChange={scrollToPage}
        onSetHandTool={setIsHandTool}
        onZoomIn={() => adjustCustomZoom(ZOOM_STEP)}
        onZoomOut={() => adjustCustomZoom(-ZOOM_STEP)}
        onZoom100={setActualSize}
        onFitWidth={handleFitWidth}
        onFitPage={handleFitPage}
        onRotateView={() => setRotation((r) => (r + 90) % 360)}
        onToggleSearch={() => setIsSearchOpen((prev) => !prev)}
        onPrint={handlePrint}
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
