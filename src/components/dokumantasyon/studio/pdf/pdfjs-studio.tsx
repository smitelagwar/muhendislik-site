// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PROFESSIONAL PDF.JS STUDIO VIEWER CORE
// ============================================================================

"use client";

import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { createSecurePdfLoadingTask } from "@/lib/dokumantasyon/studio/pdf/pdfjs-loader";
import { searchInPdfDocument, PdfSearchResult } from "@/lib/dokumantasyon/studio/pdf/pdf-search";
import { getPdfReadingPosition, savePdfReadingPosition } from "@/lib/dokumantasyon/studio/pdf/pdf-reading-position";
import { PdfPageView } from "./pdf-page-view";
import { PdfThumbnailSidebar } from "./pdf-thumbnail-sidebar";
import { PdfSearchBar } from "./pdf-search-bar";
import { PdfSearchResultsPanel } from "./pdf-search-results-panel";
import { PdfPageScrubber } from "./pdf-page-scrubber";
import { PdfViewerToolbar } from "./pdf-viewer-toolbar";

interface PdfJsStudioProps {
  accessUrl: string;
  displayName: string;
  onAccessExpired?: () => Promise<unknown>;
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
  const pdfDocRef = useRef<any>(null);
  const retryCountRef = useRef<number>(0);
  const zoomRef = useRef<ZoomState>({ mode: "fit-width", scale: 1.2 });
  const lastCommittedScaleRef = useRef<number>(1.2);
  const dragOriginRef = useRef({ x: 0, y: 0 });
  const activePointerIdRef = useRef<number | null>(null);

  // Çoklu Dokunma (Touch Pinch-to-Zoom) ve Çift Tıklama Takibi
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1.2);
  const lastTouchTapRef = useRef<{ time: number; x: number; y: number } | null>(null);

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

  // Kenar Çubuğu ve Arama Snippet Paneli
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSnippetPanelOpen, setIsSnippetPanelOpen] = useState<boolean>(false);

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

  // Çift Tıklama / Çift Dokunma ile Akıllı Zoom (Faz 4)
  const handleSmartZoom = useCallback((point: { clientX: number; clientY: number }) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const fitScale = getFitScale("fit-width") ?? 1.2;
    const isNearFit = Math.abs(zoomRef.current.scale - fitScale) < 0.08 || zoomRef.current.mode === "fit-width";

    const rect = container.getBoundingClientRect();
    const anchor: ZoomAnchor = {
      viewportX: point.clientX - rect.left,
      viewportY: point.clientY - rect.top,
    };
    activeAnchorRef.current = anchor;

    if (isNearFit) {
      // Genişliğe sığdırılmışsa tıklanan noktayı odaklayıp %150'ye zoom yap
      targetScaleRef.current = 1.5;
      startSmoothZoomAnimation();
    } else {
      // Zaten zoomlanmışsa tek hamlede genişliğe sığdır moduna dön
      applyFitMode("fit-width");
    }
  }, [getFitScale, applyFitMode, startSmoothZoomAnimation]);

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    handleSmartZoom({ clientX: e.clientX, clientY: e.clientY });
  };

  // Sayfa boyutu React ve PDF.js tarafından commit edildikten sonra imleç altındaki belge noktasını koru
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

  // 1. PDF Dokümanını Yükle, Otomatik Retry ve Yaşam Döngüsü (Faz 8, Faz 10)
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
        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setCurrentPage(1);
        retryCountRef.current = 0; // Başarılı yüklemede retry sıfırla

        try {
          const firstPage = await doc.getPage(1);
          const vp = firstPage.getViewport({ scale: 1.0 });
          setFirstPageSize({ width: vp.width || 595, height: vp.height || 842 });
        } catch {
          setFirstPageSize({ width: 595, height: 842 });
        }

        // Faz 10: Son okunan konumu geri yükle
        if (fileId) {
          const savedPage = getPdfReadingPosition(fileId);
          if (savedPage && savedPage > 1 && savedPage <= doc.numPages) {
            setTimeout(() => {
              if (isMounted) {
                const pageEl = document.getElementById(`pdf-page-${savedPage}`);
                const container = scrollContainerRef.current;
                if (pageEl && container) {
                  setCurrentPage(savedPage);
                  container.scrollTo({
                    top: Math.max(pageEl.offsetTop - 16, 0),
                    behavior: "smooth",
                  });
                }
              }
            }, 150);
          }
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

        // Faz 8: Üstel geri çekilme (exponential backoff) ile 3 kez otomatik yenileme
        if (isExpiredAccess && onAccessExpired && retryCountRef.current < 3) {
          retryCountRef.current += 1;
          setIsRefreshingAccess(true);
          const backoffDelay = Math.pow(2, retryCountRef.current - 1) * 1000;
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          try {
            await onAccessExpired();
            return;
          } catch (refreshError) {
            console.warn(`PDF access URL refresh failed (attempt ${retryCountRef.current}):`, refreshError);
            if (retryCountRef.current >= 3) {
              setError("PDF erişim bağlantısı yenilenemedi. Lütfen sayfayı yenileyin.");
            }
          } finally {
            if (isMounted) {
              setIsRefreshingAccess(false);
              if (retryCountRef.current >= 3) setLoading(false);
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
        loadingTaskRef.current = null;
      }
      if (pdfDocRef.current) {
        try {
          pdfDocRef.current.destroy?.();
        } catch {}
        pdfDocRef.current = null;
      }
    };
  }, [accessUrl, onAccessExpired, fileId]);

  // Scroll viewport mount edildikten sonra aktif fit modunu koru
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

  // 2. Sayfaya Kaydırma (Scroll to Page) ve Konum Kaydetme (Faz 10)
  const scrollToPage = useCallback((pageNum: number) => {
    if (pageNum < 1 || pageNum > numPages) return;
    setCurrentPage(pageNum);

    if (fileId) {
      savePdfReadingPosition(fileId, pageNum);
    }

    const pageEl = document.getElementById(`pdf-page-${pageNum}`);
    const container = scrollContainerRef.current;
    if (pageEl && container) {
      container.scrollTo({
        top: Math.max(pageEl.offsetTop - 16, 0),
        behavior: "smooth",
      });
    }
  }, [numPages, fileId]);

  // Sayfa görünür olduğunda okuma konumunu güncelle
  const handlePageVisible = useCallback((visiblePage: number) => {
    setCurrentPage(visiblePage);
    if (fileId) {
      savePdfReadingPosition(fileId, visiblePage);
    }
  }, [fileId]);

  // 3. Arama İşlevi (Faz 2 Snippet Panel Entegrasyonu)
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

  // 4. Ctrl + Wheel / trackpad pinch: yalnızca gerçek PDF viewport'unda zoom
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
        setIsSnippetPanelOpen(false);
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
          setIsSnippetPanelOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [adjustCustomZoom, applyFitMode, currentPage, numPages, scrollToPage, setActualSize, isSearchOpen, handleDownloadAction, onShare]);

  const handleFitWidth = () => {
    applyFitMode("fit-width");
  };

  const handleFitPage = () => {
    applyFitMode("fit-page");
  };

  const handlePrint = () => {
    window.print();
  };

  // 6. Pan / El Aracı ve Dokunmatik Pinch-to-Zoom (Faz 3 & Faz 4)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (e.pointerType === "touch") {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // İki parmak algılandı: Pinch gesture başlat
      if (activePointersRef.current.size === 2) {
        setIsDragging(false);
        activePointerIdRef.current = null;
        const pointers = Array.from(activePointersRef.current.values());
        pinchStartDistRef.current = Math.hypot(
          pointers[0].x - pointers[1].x,
          pointers[0].y - pointers[1].y
        );
        pinchStartScaleRef.current = zoomRef.current.scale;
        return;
      }
    }

    if (!isHandTool) return;

    if (zoomAnimFrameRef.current !== null) {
      window.cancelAnimationFrame(zoomAnimFrameRef.current);
      zoomAnimFrameRef.current = null;
    }
    activeAnchorRef.current = null;
    activePointerIdRef.current = e.pointerId;
    try {
      container.setPointerCapture(e.pointerId);
    } catch {}
    setIsDragging(true);
    dragOriginRef.current = {
      x: e.clientX + container.scrollLeft,
      y: e.clientY + container.scrollTop,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Dokunmatik Pinch Zoom (İki Parmak)
    if (e.pointerType === "touch" && activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointersRef.current.size === 2 && pinchStartDistRef.current) {
        const pointers = Array.from(activePointersRef.current.values());
        const currentDist = Math.hypot(
          pointers[0].x - pointers[1].x,
          pointers[0].y - pointers[1].y
        );
        if (currentDist > 5 && pinchStartDistRef.current > 5) {
          const ratio = currentDist / pinchStartDistRef.current;
          const rect = container.getBoundingClientRect();
          const midpoint = {
            viewportX: (pointers[0].x + pointers[1].x) / 2 - rect.left,
            viewportY: (pointers[0].y + pointers[1].y) / 2 - rect.top,
          };
          activeAnchorRef.current = midpoint;
          targetScaleRef.current = clampScale(pinchStartScaleRef.current * ratio);
          startSmoothZoomAnimation();
        }
        return;
      }
    }

    // El Aracı Tek Parmak / Fareyle Kaydırma
    if (!isHandTool || activePointerIdRef.current !== e.pointerId) return;
    container.scrollLeft = dragOriginRef.current.x - e.clientX;
    container.scrollTop = dragOriginRef.current.y - e.clientY;
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") {
      activePointersRef.current.delete(e.pointerId);
      if (activePointersRef.current.size < 2 && pinchStartDistRef.current !== null) {
        pinchStartDistRef.current = null;
        scheduleRenderedScaleCommit(targetScaleRef.current);
      }

      // Dokunmatik Çift Dokunma (Double Tap Smart Zoom)
      if (activePointersRef.current.size === 0 && !isDragging) {
        const now = performance.now();
        const prevTap = lastTouchTapRef.current;
        if (
          prevTap &&
          now - prevTap.time <= 350 &&
          Math.hypot(e.clientX - prevTap.x, e.clientY - prevTap.y) <= 24
        ) {
          lastTouchTapRef.current = null;
          handleSmartZoom({ clientX: e.clientX, clientY: e.clientY });
          return;
        }
        lastTouchTapRef.current = { time: now, x: e.clientX, y: e.clientY };
      }
    }

    if (activePointerIdRef.current !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
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
        onToggleSidebar={() => {
          setIsSidebarOpen((prev) => !prev);
          setIsSnippetPanelOpen(false);
        }}
        onPageChange={scrollToPage}
        onSetHandTool={setIsHandTool}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoom100={setActualSize}
        onFitWidth={handleFitWidth}
        onFitPage={handleFitPage}
        onRotateView={() => setRotation((r) => (r + 90) % 360)}
        onToggleSearch={() => {
          setIsSearchOpen((prev) => !prev);
          if (isSearchOpen) setIsSnippetPanelOpen(false);
        }}
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
        isSnippetPanelOpen={isSnippetPanelOpen}
        onQueryChange={setSearchQuery}
        onNextMatch={handleNextMatch}
        onPrevMatch={handlePrevMatch}
        onToggleSnippetPanel={() => setIsSnippetPanelOpen((prev) => !prev)}
        onClose={() => {
          setIsSearchOpen(false);
          setIsSnippetPanelOpen(false);
        }}
      />

      {/* 3. Ana Çalışma Alanı (Kenar Çubukları + Dikey Kaydırma Sayfaları) */}
      <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {/* Sol Kenar Çubuğu (Thumbnails) */}
        <PdfThumbnailSidebar
          pdfDoc={pdfDoc}
          numPages={numPages}
          currentPage={currentPage}
          isOpen={isSidebarOpen && !isSnippetPanelOpen}
          onSelectPage={scrollToPage}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Sol Kenar Arama Snippet Listesi Paneli (Faz 2) */}
        <PdfSearchResultsPanel
          isOpen={isSearchOpen && isSnippetPanelOpen}
          searchResult={searchResult}
          currentMatchIndex={currentMatchIndex}
          onSelectMatch={(globalIdx) => {
            setCurrentMatchIndex(globalIdx);
            scrollToPage(searchResult.matches[globalIdx].pageNumber);
          }}
          onClose={() => setIsSnippetPanelOpen(false)}
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
          <div className="relative flex-1 min-h-0 min-w-0 flex overflow-hidden">
            {/* Dikey Sayfa Gezinti Çubuğu (Minimap / Scrubber) (Faz 9) */}
            <PdfPageScrubber
              numPages={numPages}
              currentPage={currentPage}
              onPageChange={scrollToPage}
            />

            <div
              ref={scrollContainerRef}
              data-testid="pdf-scroll-viewport"
              onDoubleClick={handleDoubleClick}
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
                    activeMatchIndexInPage={currentMatch?.pageNumber === pageNum ? currentMatch.matchIndexInPage : -1}
                    onPageVisible={handlePageVisible}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
