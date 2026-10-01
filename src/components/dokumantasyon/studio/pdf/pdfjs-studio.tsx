// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PROFESSIONAL PDF.JS STUDIO VIEWER CORE
// ============================================================================

"use client";

import React, { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSecurePdfLoadingTask } from "@/lib/dokumantasyon/studio/pdf/pdfjs-loader";
import {
  SearchProgress,
  SearchMatch,
  SearchOpts,
  searchPdfDocumentIncremental,
} from "@/lib/dokumantasyon/studio/pdf/pdf-search-engine";
import {
  getPdfReadingPosition,
  savePdfReadingPosition,
  getPdfSettings,
  setPdfSettings,
  PdfViewerSettings,
} from "@/lib/dokumantasyon/studio/pdf/pdf-reading-position";
import { PdfPageView } from "./pdf-page-view";
import { PdfThumbnailSidebar } from "./pdf-thumbnail-sidebar";
import { PdfSearchBar } from "./pdf-search-bar";
import { PdfSearchResultsPanel } from "./pdf-search-results-panel";
import { PdfPageScrubber } from "./pdf-page-scrubber";
import { PdfViewerToolbar } from "./pdf-viewer-toolbar";
import { PdfPasswordModal } from "./pdf-password-modal";
import { PdfShortcutsModal } from "./pdf-shortcuts-modal";
import { pdfRenderQueue } from "@/lib/dokumantasyon/studio/pdf/pdf-render-queue";
import { usePdfGestures, clampPdfScale, MIN_PDF_SCALE, MAX_PDF_SCALE } from "@/lib/dokumantasyon/studio/pdf/pdf-gesture-engine";
import {
  OutlineItemNode,
  NavigationHistoryEntry,
  resolvePdfDestination,
  pushNavigationHistory,
} from "@/lib/dokumantasyon/studio/pdf/pdf-navigation";

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

const MIN_SCALE = MIN_PDF_SCALE;
const MAX_SCALE = MAX_PDF_SCALE;
const PAGE_WINDOW_N = 5; // Faz C: Bellek penceresi [görünür - 5, görünür + 5]

function clampScale(scale: number) {
  return clampPdfScale(scale, MIN_SCALE, MAX_SCALE);
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

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<ZoomState>({ mode: "fit-width", scale: 1.2 });
  const [renderedScale, setRenderedScale] = useState<number>(1.2);
  const [isQueueIdle, setIsQueueIdle] = useState<boolean>(true);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    return pdfRenderQueue.subscribe((idle) => {
      setIsQueueIdle(idle);
    });
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"corrupt" | "missing" | "password" | "network" | null>(null);
  const [loadProgress, setLoadProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [isRefreshingAccess, setIsRefreshingAccess] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [passwordReason, setPasswordReason] = useState<number | null>(null);
  const passwordCallbackRef = useRef<((password: string) => void) | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const preservedStateRef = useRef<{ page: number; scrollRatio: number; scale: number } | null>(null);
  const currentPageRef = useRef<number>(1);
  const isResizingRef = useRef<boolean>(false);

  // Pan / Hand Tool Durumu
  const [isHandTool, setIsHandTool] = useState<boolean>(false);

  // Kenar Çubuğu ve Arama Snippet Paneli
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [sidebarTab, setSidebarTab] = useState<"thumbnails" | "outline">("thumbnails");
  const [outline, setOutline] = useState<OutlineItemNode[] | null>(null);
  const [pageLabels, setPageLabels] = useState<(string | null | undefined)[] | null>(null);
  const [navHistory, setNavHistory] = useState<NavigationHistoryEntry[]>([]);
  const [isScrubbingParent, setIsScrubbingParent] = useState<boolean>(false);
  const isScrubbingRef = useRef<boolean>(false);
  const [isSnippetPanelOpen, setIsSnippetPanelOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);

  // Arama Durumu (Faz E)
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchOpts, setSearchOpts] = useState<SearchOpts>({
    caseSensitive: false,
    matchDiacritics: false,
    wholeWord: false,
  });
  const [searchResult, setSearchResult] = useState<SearchProgress>({
    query: "",
    totalMatches: 0,
    matches: [],
    pageMatchCounts: {},
    scannedPages: 0,
    totalPages: 0,
    isComplete: false,
    isScannedPdf: false,
    overflow: false,
  });
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const searchAbortRef = useRef<AbortController | null>(null);

  // Faz E: Sayfa numarasına göre gruplanmış eşleşmeler (O(1) erişim)
  const matchesByPage = useMemo(() => {
    const map = new Map<number, SearchMatch[]>();
    for (const m of searchResult.matches) {
      let arr = map.get(m.pageNumber);
      if (!arr) {
        arr = [];
        map.set(m.pageNumber, arr);
      }
      arr.push(m);
    }
    return map;
  }, [searchResult.matches]);
  const [firstPageSize, setFirstPageSize] = useState<{ width: number; height: number } | null>(null);
  const [pageDimensions, setPageDimensions] = useState<Record<number, { width: number; height: number }>>({});
  const scale = zoom.scale;

  // Faz H: Okuma Konumu ve Ayarlar (Settings & Reading Position)
  const [settings, setSettings] = useState<PdfViewerSettings>(() => getPdfSettings());
  const [nightMode, setNightMode] = useState<boolean>(() => getPdfSettings().nightMode);
  const saveDebounceTimerRef = useRef<number | null>(null);

  const currentFileVersion = useMemo(() => {
    return `${versionNo ?? 1}-${sizeBytes ?? 0}-${createdAt ?? ""}`;
  }, [versionNo, sizeBytes, createdAt]);

  const isReducedMotion = useMemo(() => {
    if (settings.reduceMotion === "on") return true;
    if (settings.reduceMotion === "off") return false;
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  }, [settings.reduceMotion]);

  const performSave = useCallback(() => {
    if (!fileId) return;
    const container = scrollContainerRef.current;
    const activePage = currentPageRef.current;
    const pageEl = document.getElementById(`pdf-page-${activePage}`);
    let offsetRatio = 0;
    if (container && pageEl && pageEl.clientHeight > 0) {
      const relativeTop = container.scrollTop - pageEl.offsetTop + 16;
      offsetRatio = Math.min(Math.max(relativeTop / pageEl.clientHeight, 0), 1);
    }
    savePdfReadingPosition(fileId, {
      page: activePage,
      offsetRatio,
      scaleMode: zoomRef.current.mode,
      scale: zoomRef.current.scale,
      fileVersion: currentFileVersion,
    });
  }, [fileId, currentFileVersion]);

  const triggerDebouncedSave = useCallback(() => {
    if (saveDebounceTimerRef.current !== null) {
      window.clearTimeout(saveDebounceTimerRef.current);
    }
    saveDebounceTimerRef.current = window.setTimeout(() => {
      saveDebounceTimerRef.current = null;
      performSave();
    }, 500);
  }, [performSave]);

  useEffect(() => {
    const handleFlushSave = () => {
      if (saveDebounceTimerRef.current !== null) {
        window.clearTimeout(saveDebounceTimerRef.current);
        saveDebounceTimerRef.current = null;
      }
      performSave();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleFlushSave();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handleFlushSave);
    window.addEventListener("beforeunload", handleFlushSave);

    return () => {
      handleFlushSave();
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleFlushSave);
      window.removeEventListener("beforeunload", handleFlushSave);
    };
  }, [performSave]);

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
    if (isReducedMotion) {
      const targetScale = targetScaleRef.current;
      updateZoomState({ mode: "custom", scale: targetScale });
      activeAnchorRef.current = null;
      scheduleRenderedScaleCommit(targetScale);
      return;
    }

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
  }, [isReducedMotion, scheduleRenderedScaleCommit, updateZoomState]);

  const getFitScale = useCallback((mode: Extract<ZoomMode, "fit-width" | "fit-page">) => {
    const container = scrollContainerRef.current;
    const currentSize = pageDimensions[currentPageRef.current] || firstPageSize;
    if (!container || !currentSize) return null;

    const isQuarterTurn = rotation % 180 !== 0;
    const pageWidth = isQuarterTurn ? currentSize.height : currentSize.width;
    const pageHeight = isQuarterTurn ? currentSize.width : currentSize.height;
    const horizontalPadding = container.clientWidth < 640 ? 32 : 64;
    const verticalPadding = container.clientHeight < 640 ? 32 : 64;
    const availableWidth = Math.max(container.clientWidth - horizontalPadding, 1);
    const availableHeight = Math.max(container.clientHeight - verticalPadding, 1);
    const targetScale = mode === "fit-width"
      ? availableWidth / pageWidth
      : Math.min(availableWidth / pageWidth, availableHeight / pageHeight);

    return Number(clampScale(targetScale).toFixed(2));
  }, [firstPageSize, pageDimensions, rotation]);

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
    updateZoomState({ mode: "custom", scale: zoomRef.current.scale });
    targetScaleRef.current = nextTarget;
    activeAnchorRef.current = anchor || (container ? {
      viewportX: container.clientWidth / 2,
      viewportY: container.clientHeight / 2,
    } : null);
    startSmoothZoomAnimation();
  }, [startSmoothZoomAnimation, updateZoomState]);

  const handleZoomIn = useCallback(() => {
    const container = scrollContainerRef.current;
    const currentTarget =
      zoomAnimFrameRef.current !== null
        ? targetScaleRef.current
        : zoomRef.current.scale;
    const nextTarget = clampScale(Number((currentTarget * 1.25).toFixed(2)));
    updateZoomState({ mode: "custom", scale: zoomRef.current.scale });
    targetScaleRef.current = nextTarget;
    activeAnchorRef.current = container ? {
      viewportX: container.clientWidth / 2,
      viewportY: container.clientHeight / 2,
    } : null;
    startSmoothZoomAnimation();
  }, [startSmoothZoomAnimation, updateZoomState]);

  const handleZoomOut = useCallback(() => {
    const container = scrollContainerRef.current;
    const currentTarget =
      zoomAnimFrameRef.current !== null
        ? targetScaleRef.current
        : zoomRef.current.scale;
    const nextTarget = clampScale(Number((currentTarget / 1.25).toFixed(2)));
    updateZoomState({ mode: "custom", scale: zoomRef.current.scale });
    targetScaleRef.current = nextTarget;
    activeAnchorRef.current = container ? {
      viewportX: container.clientWidth / 2,
      viewportY: container.clientHeight / 2,
    } : null;
    startSmoothZoomAnimation();
  }, [startSmoothZoomAnimation, updateZoomState]);

  const setActualSize = useCallback(() => {
    const container = scrollContainerRef.current;
    updateZoomState({ mode: "custom", scale: zoomRef.current.scale });
    targetScaleRef.current = 1;
    activeAnchorRef.current = container ? {
      viewportX: container.clientWidth / 2,
      viewportY: container.clientHeight / 2,
    } : null;
    startSmoothZoomAnimation();
  }, [startSmoothZoomAnimation, updateZoomState]);

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

  // Sayfa boyutu React ve PDF.js tarafından commit edildikten sonra imleç altındaki belge noktasını koru
  useLayoutEffect(() => {
    const prevScale = lastCommittedScaleRef.current;
    lastCommittedScaleRef.current = scale;

    const activeAnchor = activeAnchorRef.current;
    const container = scrollContainerRef.current;
    if (!container || prevScale <= 0 || prevScale === scale) return;

    if (activeAnchor) {
      const logicalX = (container.scrollLeft + activeAnchor.viewportX) / prevScale;
      const logicalY = (container.scrollTop + activeAnchor.viewportY) / prevScale;
      container.scrollLeft = Math.max(logicalX * scale - activeAnchor.viewportX, 0);
      container.scrollTop = Math.max(logicalY * scale - activeAnchor.viewportY, 0);
    } else {
      container.scrollTop = Math.round(container.scrollTop * (scale / prevScale));
      container.scrollLeft = Math.round(container.scrollLeft * (scale / prevScale));
      if (preservedStateRef.current && container.scrollHeight > 0) {
        preservedStateRef.current.scrollRatio = container.scrollTop / container.scrollHeight;
      }
    }
  }, [scale]);

  const handlePasswordSubmit = useCallback((password: string) => {
    if (passwordCallbackRef.current) {
      const cb = passwordCallbackRef.current;
      passwordCallbackRef.current = null;
      cb(password);
    }
  }, []);

  const handlePasswordCancel = useCallback(() => {
    if (passwordCallbackRef.current) {
      const cb = passwordCallbackRef.current;
      passwordCallbackRef.current = null;
      try {
        cb("");
      } catch {}
    }
    setIsPasswordModalOpen(false);
    setErrorType("password");
    setError("Bu belge parola korumalıdır. Açmak için lütfen geçerli bir parola girin.");
    setLoading(false);
  }, []);

  const handleRetry = useCallback(() => {
    retryCountRef.current = 0;
    setError(null);
    setErrorType(null);
    setLoading(true);
    setReloadKey((prev) => prev + 1);
  }, []);

  // 1. PDF Dokümanını Yükle, Otomatik Retry ve Yaşam Döngüsü (Faz B)
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setErrorType(null);
    setLoadProgress(null);

    async function init() {
      try {
        const task = await createSecurePdfLoadingTask(accessUrl, {
          onProgress: ({ loaded, total }) => {
            if (isMounted) {
              setLoadProgress({ loaded, total });
            }
          },
          onPassword: (callback, reason) => {
            if (!isMounted) return;
            passwordCallbackRef.current = callback;
            setPasswordReason(reason);
            setIsPasswordModalOpen(true);
            setLoading(false);
          },
        });
        loadingTaskRef.current = task;

        const doc = await task.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        retryCountRef.current = 0; // Başarılı yüklemede retry sıfırla
        setIsPasswordModalOpen(false);
        setPasswordReason(null);
        setErrorType(null);
        setError(null);

        setPageDimensions({});
        pdfRenderQueue.clear();

        try {
          const firstPage = await doc.getPage(1);
          const vp = firstPage.getViewport({ scale: 1.0, rotation: firstPage.rotate || 0 });
          setFirstPageSize({ width: vp.width || 595, height: vp.height || 842 });
        } catch {
          setFirstPageSize({ width: 595, height: 842 });
        }

        // Faz G: Outline (İçindekiler) ve Page Labels yükleme
        try {
          const outlineData = await doc.getOutline();
          if (isMounted) {
            setOutline(outlineData && outlineData.length > 0 ? (outlineData as OutlineItemNode[]) : null);
          }
        } catch {
          if (isMounted) setOutline(null);
        }

        try {
          const labels = await doc.getPageLabels();
          if (isMounted) {
            setPageLabels(labels && labels.length > 0 ? labels : null);
          }
        } catch {
          if (isMounted) setPageLabels(null);
        }

        // Faz B & Faz H: URL (#page=...) > Kayıtlı Konum > İlk Sayfa Önceliği
        let urlHashPage: number | null = null;
        if (typeof window !== "undefined" && window.location.hash) {
          const match = window.location.hash.match(/#page=(\d+)/i);
          if (match) {
            const parsed = parseInt(match[1], 10);
            if (!isNaN(parsed) && parsed >= 1 && parsed <= doc.numPages) {
              urlHashPage = parsed;
            }
          }
        }

        const savedRecord = fileId ? getPdfReadingPosition(fileId, currentFileVersion) : null;
        const targetPage = urlHashPage ?? (savedRecord?.page ? Math.min(Math.max(savedRecord.page, 1), doc.numPages) : 1);
        const targetOffsetRatio = urlHashPage ? 0 : (savedRecord?.offsetRatio ?? 0);

        setCurrentPage(targetPage);
        currentPageRef.current = targetPage;

        // Sayfa boyutları ve ilk yerleşim hesaplandıktan sonra iki aşamalı mikro-düzeltme (Faz H)
        if (urlHashPage !== null || targetPage > 1 || targetOffsetRatio > 0) {
          const restorePosition = (attempt = 1) => {
            if (!isMounted) return;
            const pageEl = document.getElementById(`pdf-page-${targetPage}`);
            const container = scrollContainerRef.current;
            if (pageEl && container) {
              const pageTop = pageEl.offsetTop;
              const offsetInPage = targetOffsetRatio > 0 ? targetOffsetRatio * pageEl.clientHeight : 0;
              container.scrollTo({
                top: Math.max(pageTop + offsetInPage - 16, 0),
                behavior: "auto",
              });
              if (attempt === 1) {
                setTimeout(() => restorePosition(2), 150);
              }
            } else if (attempt < 4) {
              setTimeout(() => restorePosition(attempt + 1), 100);
            }
          };
          setTimeout(() => restorePosition(1), 80);
        }

        setLoading(false);
      } catch (err: unknown) {
        if (!isMounted) return;
        if ((err as { name?: string })?.name === "AbortException") return;

        const errName = (err as { name?: string })?.name || "";
        const errMessage = err instanceof Error ? err.message : "";
        const httpStatus = typeof (err as { status?: unknown })?.status === "number"
          ? (err as { status: number }).status
          : null;
        const isExpiredAccess = httpStatus === 401 || httpStatus === 403 || /(?:401|403|unauthorized|forbidden)/i.test(errMessage);

        // Faz B: Hata Sınıflandırması
        // 1. Bozuk / Geçersiz PDF: retry yok, doğrudan hata ekranı + indir butonu
        if (errName === "InvalidPDFException" || /invalid pdf/i.test(errMessage)) {
          setErrorType("corrupt");
          setError("PDF dosyası bozuk veya geçersiz bir formatta.");
          setLoading(false);
          return;
        }

        // 2. Eksik / Bulunamayan PDF (404): retry yok
        if (httpStatus === 404 || errName === "MissingPDFException" || /missing pdf|not found/i.test(errMessage)) {
          setErrorType("missing");
          setError("PDF dosyası sunucuda veya depolama alanında bulunamadı.");
          setLoading(false);
          return;
        }

        // 3. Parola İptal Edildi veya Hata:
        if (errName === "PasswordException") {
          setErrorType("password");
          setError("Bu belge parola korumalıdır. Açmak için lütfen geçerli bir parola girin.");
          setLoading(false);
          return;
        }

        // 4. Süresi dolmuş URL (401/403): Üstel geri çekilme ile 3 kez otomatik yenileme
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
              setErrorType("network");
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

        // 5. Ağ veya diğer beklenmeyen hatalar:
        console.error("PDF yükleme hatası:", err);
        setErrorType("network");
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
  }, [accessUrl, onAccessExpired, fileId, reloadKey, currentFileVersion]);

  const applyFitModeRef = useRef(applyFitMode);
  applyFitModeRef.current = applyFitMode;

  // Ekran boyutu değiştiğinde veya yön döndürüldüğünde (orientation change)
  // ara scroll olaylarının kayıtlı okuma oranını (scrollRatio) ezmesini engelle
  useEffect(() => {
    const handleBeforeResize = () => {
      isResizingRef.current = true;
      const container = scrollContainerRef.current;
      if (container && container.scrollHeight > 0) {
        const ratio = container.scrollTop / container.scrollHeight;
        if (ratio > 0) {
          if (preservedStateRef.current) {
            preservedStateRef.current.scrollRatio = ratio;
          } else {
            preservedStateRef.current = {
              page: currentPageRef.current,
              scrollRatio: ratio,
              scale: zoomRef.current.scale,
            };
          }
        }
      }
    };
    window.addEventListener("resize", handleBeforeResize, { capture: true });
    window.addEventListener("orientationchange", handleBeforeResize, { capture: true });
    return () => {
      window.removeEventListener("resize", handleBeforeResize, { capture: true });
      window.removeEventListener("orientationchange", handleBeforeResize, { capture: true });
    };
  }, []);

  // Scroll viewport mount edildikten sonra aktif fit modunu koru
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (loading || !container || !firstPageSize) return;

    const updateFitMode = () => {
      const mode = zoomRef.current.mode;
      const currentScrollRatio =
        container.scrollHeight > 0 ? container.scrollTop / container.scrollHeight : 0;
      const savedRatio =
        preservedStateRef.current?.scrollRatio && preservedStateRef.current.scrollRatio > 0
          ? preservedStateRef.current.scrollRatio
          : currentScrollRatio;

      isResizingRef.current = true;
      if (preservedStateRef.current) {
        preservedStateRef.current.scrollRatio = savedRatio;
      } else {
        preservedStateRef.current = {
          page: currentPageRef.current,
          scrollRatio: savedRatio,
          scale: zoomRef.current.scale,
        };
      }

      if (mode === "fit-width" || mode === "fit-page") {
        applyFitModeRef.current(mode);
      }

      setTimeout(() => {
        isResizingRef.current = false;
      }, 100);
    };

    const frame = window.requestAnimationFrame(updateFitMode);
    const observer = new ResizeObserver(updateFitMode);
    observer.observe(container);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [firstPageSize, loading, rotation]);

  // 2. Sayfaya Kaydırma (Scroll to Page) ve Konum Kaydetme (Faz H)
  const scrollToPage = useCallback((pageNum: number) => {
    if (pageNum < 1 || pageNum > numPages) return;
    setCurrentPage(pageNum);
    currentPageRef.current = pageNum;

    triggerDebouncedSave();

    const pageEl = document.getElementById(`pdf-page-${pageNum}`);
    const container = scrollContainerRef.current;
    if (pageEl && container) {
      container.scrollTo({
        top: Math.max(pageEl.offsetTop - 16, 0),
        behavior: isReducedMotion ? "auto" : "smooth",
      });
      if (container.scrollHeight > 0) {
        preservedStateRef.current = {
          page: pageNum,
          scrollRatio: container.scrollTop / container.scrollHeight,
          scale: zoomRef.current.scale,
        };
      }
    }
  }, [numPages, isReducedMotion, triggerDebouncedSave]);

  // Faz H: URL (#page=...) dinamik hash değişikliklerini izle
  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window === "undefined") return;
      const match = window.location.hash.match(/#page=(\d+)/i);
      if (match) {
        const p = parseInt(match[1], 10);
        if (!isNaN(p) && p >= 1 && p <= numPages) {
          scrollToPage(p);
        }
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [numPages, scrollToPage]);

  // Faz G: Gezinme Geçmişi (History) ve Hedefe Atlama (Destination Jump)
  const handleNavigateDestination = useCallback(
    async (dest: any) => {
      if (!pdfDoc) return;
      const container = scrollContainerRef.current;
      if (container) {
        setNavHistory((prev) =>
          pushNavigationHistory(prev, {
            page: currentPageRef.current,
            scrollTop: container.scrollTop,
          })
        );
      }

      const targetPage = await resolvePdfDestination(pdfDoc, dest);
      if (targetPage !== null && targetPage >= 1 && targetPage <= numPages) {
        pdfRenderQueue.setCurrentPage(targetPage);
        scrollToPage(targetPage);
      }
    },
    [pdfDoc, numPages, scrollToPage]
  );

  const handleNavigateBack = useCallback(() => {
    setNavHistory((prev) => {
      if (prev.length === 0) return prev;
      const nextHistory = [...prev];
      const target = nextHistory.pop()!;
      const container = scrollContainerRef.current;
      if (container) {
        currentPageRef.current = target.page;
        setCurrentPage(target.page);
        pdfRenderQueue.setCurrentPage(target.page);
        container.scrollTo({
          top: target.scrollTop,
          behavior: "smooth",
        });
      }
      return nextHistory;
    });
  }, []);

  const handleSelectOutlineItem = useCallback(
    (item: OutlineItemNode) => {
      if (item.dest) {
        handleNavigateDestination(item.dest);
      }
    },
    [handleNavigateDestination]
  );

  const handleToggleOutline = useCallback(() => {
    if (isSidebarOpen && sidebarTab === "outline") {
      setIsSidebarOpen(false);
    } else {
      setSidebarTab("outline");
      setIsSidebarOpen(true);
      setIsSnippetPanelOpen(false);
    }
  }, [isSidebarOpen, sidebarTab]);

  const handleToggleSidebar = useCallback(() => {
    if (isSidebarOpen && sidebarTab === "thumbnails") {
      setIsSidebarOpen(false);
    } else {
      setSidebarTab("thumbnails");
      setIsSidebarOpen(true);
      setIsSnippetPanelOpen(false);
    }
  }, [isSidebarOpen, sidebarTab]);

  // Faz G: Scrubber Render Kuyruğu Koruması
  // Sürükleme esnasında sadece viewport kaydırılır; ağır renderlar sadece bırakınca tetiklenir
  const handleScrubMove = useCallback((targetPage: number) => {
    isScrubbingRef.current = true;
    const pageEl = document.getElementById(`pdf-page-${targetPage}`);
    const container = scrollContainerRef.current;
    if (pageEl && container) {
      container.scrollTo({
        top: Math.max(pageEl.offsetTop - 16, 0),
        behavior: "auto",
      });
    }
  }, []);

  const handleScrubEnd = useCallback(
    (finalPage: number) => {
      isScrubbingRef.current = false;
      const container = scrollContainerRef.current;
      if (container && Math.abs(finalPage - currentPageRef.current) >= 10) {
        setNavHistory((prev) =>
          pushNavigationHistory(prev, {
            page: currentPageRef.current,
            scrollTop: container.scrollTop,
          })
        );
      }
      pdfRenderQueue.setCurrentPage(finalPage);
      scrollToPage(finalPage);
    },
    [scrollToPage]
  );

  // Sayfa görünür olduğunda okuma konumunu güncelle (Faz H)
  const handlePageVisible = useCallback((visiblePage: number) => {
    setCurrentPage(visiblePage);
    currentPageRef.current = visiblePage;
    const container = scrollContainerRef.current;
    if (container && container.scrollHeight > 0 && !isResizingRef.current) {
      preservedStateRef.current = {
        page: visiblePage,
        scrollRatio: container.scrollTop / container.scrollHeight,
        scale: zoomRef.current.scale,
      };
    }
    triggerDebouncedSave();
  }, [triggerDebouncedSave]);

  // Faz C: Render kuyruğu önceliğini görünür sayfaya göre güncelle
  useEffect(() => {
    pdfRenderQueue.setCurrentPage(currentPage);
  }, [currentPage]);

  useEffect(() => {
    return () => {
      pdfRenderQueue.clear();
    };
  }, []);

  // Faz C: Scroll Anchoring ve dinamik sayfa ölçümü
  const handleDimensionsMeasured = useCallback(
    (measuredPageNum: number, width: number, height: number) => {
      setPageDimensions((prev) => {
        const existing = prev[measuredPageNum];
        if (existing && existing.width === width && existing.height === height) {
          return prev;
        }

        // Scroll Anchoring: Eğer ölçülen sayfa şu anki aktif sayfanın yukarısındaysa,
        // yükseklik farkı kadar scroll'u kaydır ki görünüm zıplamasın!
        if (existing && measuredPageNum < currentPageRef.current) {
          const deltaH = height - existing.height;
          if (Math.abs(deltaH) > 1) {
            const container = scrollContainerRef.current;
            if (container) {
              container.scrollTop += deltaH * zoomRef.current.scale;
            }
          }
        }

        return {
          ...prev,
          [measuredPageNum]: { width, height },
        };
      });
    },
    []
  );

  // 3. Arama İşlevi (Faz E: Artımlı Dilimleme, İptal, Türkçe Katlama ve Öncelikli Gezinme)
  useEffect(() => {
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
      searchAbortRef.current = null;
    }

    if (!pdfDoc || !searchQuery.trim() || !isSearchOpen || searchQuery.trim().length < 2) {
      setSearchResult({
        query: "",
        totalMatches: 0,
        matches: [],
        pageMatchCounts: {},
        scannedPages: 0,
        totalPages: numPages,
        isComplete: false,
        isScannedPdf: false,
        overflow: false,
      });
      setCurrentMatchIndex(0);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    searchAbortRef.current = controller;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        let firstMatchNavigated = false;
        await searchPdfDocumentIncremental(
          pdfDoc,
          searchQuery,
          currentPageRef.current,
          searchOpts,
          controller.signal,
          (progress) => {
            if (controller.signal.aborted) return;
            setSearchResult(progress);
            if (!firstMatchNavigated && progress.matches.length > 0) {
              firstMatchNavigated = true;
              setCurrentMatchIndex(0);
              const first = progress.matches[0];
              pdfRenderQueue.setCurrentPage(first.pageNumber);
              scrollToPage(first.pageNumber);
            }
          }
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [pdfDoc, searchQuery, isSearchOpen, searchOpts, numPages, scrollToPage]);

  const handleNextMatch = () => {
    if (searchResult.totalMatches === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchResult.totalMatches;
    setCurrentMatchIndex(nextIdx);
    const targetPage = searchResult.matches[nextIdx].pageNumber;
    pdfRenderQueue.setCurrentPage(targetPage);
    scrollToPage(targetPage);
  };

  const handlePrevMatch = () => {
    if (searchResult.totalMatches === 0) return;
    const prevIdx =
      (currentMatchIndex - 1 + searchResult.totalMatches) % searchResult.totalMatches;
    setCurrentMatchIndex(prevIdx);
    const targetPage = searchResult.matches[prevIdx].pageNumber;
    pdfRenderQueue.setCurrentPage(targetPage);
    scrollToPage(targetPage);
  };


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

  // 5. Yazdır / İndir (Faz H) — Orijinal PDF URL'sini gizli iframe ile yazdır
  const handlePrint = useCallback(() => {
    try {
      let printFrame = document.getElementById("pdf-print-iframe") as HTMLIFrameElement | null;
      if (!printFrame) {
        printFrame = document.createElement("iframe");
        printFrame.id = "pdf-print-iframe";
        printFrame.style.position = "fixed";
        printFrame.style.right = "0";
        printFrame.style.bottom = "0";
        printFrame.style.width = "0";
        printFrame.style.height = "0";
        printFrame.style.border = "0";
        printFrame.style.visibility = "hidden";
        document.body.appendChild(printFrame);
      }
      printFrame.onload = () => {
        try {
          printFrame?.contentWindow?.focus();
          printFrame?.contentWindow?.print();
        } catch {
          window.print();
        }
      };
      printFrame.src = accessUrl;
    } catch {
      window.print();
    }
  }, [accessUrl]);

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
        handleZoomIn();
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        handleZoomIn();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        handleZoomOut();
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key === "-") {
        e.preventDefault();
        handleZoomOut();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        applyFitMode("fit-page");
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key === "0") {
        e.preventDefault();
        applyFitMode("fit-page");
      } else if ((e.ctrlKey || e.metaKey) && e.key === "1") {
        e.preventDefault();
        setActualSize();
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key === "1") {
        e.preventDefault();
        setActualSize();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "2") {
        e.preventDefault();
        applyFitMode("fit-width");
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key === "2") {
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
        scrollToPage(Math.max(currentPageRef.current - 1, 1));
      } else if (e.key === "PageDown") {
        e.preventDefault();
        scrollToPage(Math.min(currentPageRef.current + 1, numPages));
      } else if (e.key === "ArrowLeft" && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        scrollToPage(Math.max(currentPageRef.current - 1, 1));
      } else if (e.key === "ArrowRight" && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        scrollToPage(Math.min(currentPageRef.current + 1, numPages));
      } else if (e.key === "Home") {
        e.preventDefault();
        scrollToPage(1);
      } else if (e.key === "End") {
        e.preventDefault();
        scrollToPage(numPages);
      } else if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        if (isShortcutsModalOpen) {
          e.preventDefault();
          setIsShortcutsModalOpen(false);
          setTimeout(() => {
            const trigger =
              document.querySelector<HTMLElement>('[data-testid="pdf-shortcuts-btn"]') ||
              document.querySelector<HTMLElement>('[data-testid="pdf-viewer-more-menu-trigger"]');
            trigger?.focus();
          }, 0);
        } else if (isSearchOpen) {
          e.preventDefault();
          e.stopPropagation();
          setIsSearchOpen(false);
          setIsSnippetPanelOpen(false);
          setTimeout(() => {
            const searchBtn = document.querySelector<HTMLElement>('button[data-command-id="pdf.search.open"]');
            searchBtn?.focus();
          }, 0);
        } else if (isSidebarOpen) {
          e.preventDefault();
          setIsSidebarOpen(false);
          setTimeout(() => {
            const sidebarBtn = document.querySelector<HTMLElement>('button[data-command-id="pdf.sidebar.toggle"]');
            sidebarBtn?.focus();
          }, 0);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    adjustCustomZoom,
    applyFitMode,
    currentPage,
    handleZoomIn,
    handleZoomOut,
    numPages,
    scrollToPage,
    setActualSize,
    isSearchOpen,
    isSidebarOpen,
    isShortcutsModalOpen,
    handleDownloadAction,
    handlePrint,
    onShare,
  ]);

  const handleFitWidth = () => {
    applyFitMode("fit-width");
  };

  const handleFitPage = () => {
    applyFitMode("fit-page");
  };

  // Faz H: Ayarlar Menüsü Aksiyonları
  const handleToggleNightMode = useCallback(() => {
    setNightMode((prev) => {
      const next = !prev;
      setPdfSettings({ nightMode: next });
      setSettings((s) => ({ ...s, nightMode: next }));
      return next;
    });
  }, []);

  const handleToggleRememberPosition = useCallback(() => {
    setSettings((prev) => {
      const next = !prev.rememberPosition;
      setPdfSettings({ rememberPosition: next });
      return { ...prev, rememberPosition: next };
    });
  }, []);

  const handleChangeDefaultViewMode = useCallback(
    (mode: "fit-width" | "fit-page") => {
      setSettings((prev) => {
        setPdfSettings({ defaultViewMode: mode });
        return { ...prev, defaultViewMode: mode };
      });
      applyFitMode(mode);
    },
    [applyFitMode]
  );

  const handleChangeReduceMotion = useCallback((mode: "system" | "on" | "off") => {
    setSettings((prev) => {
      setPdfSettings({ reduceMotion: mode });
      return { ...prev, reduceMotion: mode };
    });
  }, []);

  // 6. Pan / El Aracı ve Dokunmatik Pinch-to-Zoom (Faz F — Unified Gesture Core)
  const {
    isDragging,
    handleDoubleClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  } = usePdfGestures({
    containerRef: scrollContainerRef,
    isHandTool,
    scale: zoom.scale,
    onScaleChange: (newScale, anchor) => {
      if (zoomAnimFrameRef.current !== null) {
        window.cancelAnimationFrame(zoomAnimFrameRef.current);
        zoomAnimFrameRef.current = null;
      }
      targetScaleRef.current = newScale;
      if (anchor && scrollContainerRef.current) {
        const rect = scrollContainerRef.current.getBoundingClientRect();
        activeAnchorRef.current = {
          viewportX: anchor.clientX - rect.left,
          viewportY: anchor.clientY - rect.top,
        };
      }
      updateZoomState({ mode: "custom", scale: newScale });
      scheduleRenderedScaleCommit(newScale);
    },
    onCommitScale: (committedScale) => {
      scheduleRenderedScaleCommit(committedScale);
    },
    onSmartZoom: handleSmartZoom,
    disabled: loading || !pdfDoc,
  });

  const currentMatch = searchResult.matches[currentMatchIndex];
  const viewerState: "idle" | "loading" | "rendering" = loading
    ? "loading"
    : !isQueueIdle || debouncedRenderTimerRef.current !== null
    ? "rendering"
    : "idle";

  return (
    <div
      data-zoom-mode={zoom.mode}
      data-pdf-viewer-state={viewerState}
      className={cn(
        "flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden bg-background text-foreground select-none",
        isReducedMotion && "reduce-motion"
      )}
    >
      {/* 1. PDF Studio Toolbar */}
      <PdfViewerToolbar
        numPages={numPages}
        currentPage={currentPage}
        scale={scale}
        zoomMode={zoom.mode}
        isSidebarOpen={isSidebarOpen}
        isHandTool={isHandTool}
        isSearchOpen={isSearchOpen}
        onToggleSidebar={handleToggleSidebar}
        pageLabels={pageLabels}
        hasOutline={Boolean(outline && outline.length > 0)}
        onToggleOutline={handleToggleOutline}
        canNavigateBack={navHistory.length > 0}
        onNavigateBack={handleNavigateBack}
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
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        nightMode={nightMode}
        onToggleNightMode={handleToggleNightMode}
        defaultViewMode={settings.defaultViewMode}
        onChangeDefaultViewMode={handleChangeDefaultViewMode}
        reduceMotion={settings.reduceMotion}
        onChangeReduceMotion={handleChangeReduceMotion}
        rememberPosition={settings.rememberPosition}
        onToggleRememberPosition={handleToggleRememberPosition}
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
        isScannedPdf={searchResult.isScannedPdf}
        overflow={searchResult.overflow}
        searchOpts={searchOpts}
        onSearchOptsChange={setSearchOpts}
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
        {/* Sol Kenar Çubuğu (Thumbnails & Outline) */}
        <PdfThumbnailSidebar
          pdfDoc={pdfDoc}
          numPages={numPages}
          currentPage={currentPage}
          isOpen={isSidebarOpen && !isSnippetPanelOpen}
          activeTab={sidebarTab}
          onTabChange={setSidebarTab}
          outline={outline}
          onSelectPage={scrollToPage}
          onSelectOutlineItem={handleSelectOutlineItem}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Sol Kenar Arama Snippet Listesi Paneli (Faz 2 & Faz E) */}
        <PdfSearchResultsPanel
          isOpen={isSearchOpen && isSnippetPanelOpen}
          searchResult={searchResult}
          currentMatchIndex={currentMatchIndex}
          onSelectMatch={(globalIdx) => {
            setCurrentMatchIndex(globalIdx);
            const targetPage = searchResult.matches[globalIdx].pageNumber;
            const container = scrollContainerRef.current;
            if (container && targetPage !== currentPageRef.current) {
              setNavHistory((prev) =>
                pushNavigationHistory(prev, {
                  page: currentPageRef.current,
                  scrollTop: container.scrollTop,
                })
              );
            }
            pdfRenderQueue.setCurrentPage(targetPage);
            scrollToPage(targetPage);
          }}
          onClose={() => setIsSnippetPanelOpen(false)}
        />

        {/* Yükleniyor ve İlerleme Çubuğu (Faz B) */}
        {loading && (
          <div data-testid="pdf-viewer-status" role="status" className="flex flex-1 flex-col items-center justify-center py-20 text-zinc-400">
            <Loader2 className="h-9 w-9 animate-spin text-amber-500 mb-3" />
            <span className="text-sm font-medium text-zinc-300">
              {isRefreshingAccess
                ? "PDF erişim bağlantısı yenileniyor..."
                : loadProgress && loadProgress.total > 0
                ? `PDF dokümanı yükleniyor (%${Math.min(Math.round((loadProgress.loaded / loadProgress.total) * 100), 100)})...`
                : "PDF dokümanı ve katmanlar hazırlanıyor..."}
            </span>
            {loadProgress && loadProgress.total > 0 && (
              <div className="w-56 h-1.5 bg-zinc-800 rounded-full mt-3 overflow-hidden border border-zinc-700/40">
                <div
                  className="bg-amber-500 h-full transition-all duration-150 rounded-full"
                  style={{ width: `${Math.min(Math.round((loadProgress.loaded / loadProgress.total) * 100), 100)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Hata Ekranı ve İyileştirme Aksiyonları (Faz B) */}
        {error && (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="mx-auto max-w-md rounded-2xl border border-red-500/30 bg-red-950/30 p-6 text-center text-red-400 shadow-2xl backdrop-blur-md">
              <AlertCircle className="mx-auto h-9 w-9 text-red-500 mb-2" />
              <h3 className="text-sm font-bold text-red-200">
                {errorType === "corrupt"
                  ? "Bozuk veya Geçersiz Dosya"
                  : errorType === "missing"
                  ? "Dosya Bulunamadı"
                  : errorType === "password"
                  ? "Parola Korumalı Belge"
                  : "PDF Yükleme Hatası"}
              </h3>
              <p className="mt-1 text-xs text-zinc-400">{error}</p>

              <div className="mt-4 flex items-center justify-center gap-2">
                {errorType === "corrupt" && onDownload && (
                  <button
                    type="button"
                    onClick={onDownload}
                    data-testid="pdf-download-corrupt-btn"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-800 border border-zinc-700 px-3.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                  >
                    Dosyayı İndir
                  </button>
                )}
                {errorType === "password" && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setLoading(true);
                      setReloadKey((prev) => prev + 1);
                    }}
                    data-testid="pdf-reopen-password-btn"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-400 transition-colors"
                  >
                    Parola Gir
                  </button>
                )}
                {errorType === "network" && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    data-testid="pdf-retry-btn"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-800 border border-zinc-700 px-3.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                  >
                    Yeniden Dene
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sürekli Dikey Kaydırma (Continuous Vertical Scroll Workspace) */}
        {!loading && !error && pdfDoc && (
          <div className="relative flex-1 min-h-0 min-w-0 flex overflow-hidden">
            {/* Dikey Sayfa Gezinti Çubuğu (Minimap / Scrubber) (Faz 9 & Faz G) */}
            <PdfPageScrubber
              numPages={numPages}
              currentPage={currentPage}
              onPageChange={handleScrubEnd}
              onScrubMove={handleScrubMove}
              isScrollingParent={isScrubbingParent}
            />

            <div
              ref={scrollContainerRef}
              data-testid="pdf-scroll-viewport"
              tabIndex={0}
              onDoubleClick={handleDoubleClick}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onScroll={() => {
                if (isResizingRef.current) return;
                setIsScrubbingParent(true);
                const c = scrollContainerRef.current;
                if (c && c.scrollHeight > 0) {
                  preservedStateRef.current = {
                    page: currentPageRef.current,
                    scrollRatio: c.scrollTop / c.scrollHeight,
                    scale: zoomRef.current.scale,
                  };
                }
                triggerDebouncedSave();
              }}
              className={`min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain [scrollbar-gutter:stable] ${
                nightMode ? "bg-zinc-950" : "bg-muted/50 dark:bg-zinc-900/60"
              } p-4 sm:p-8 [touch-action:pan-x_pan-y] ${
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
                    isWithinWindow={Math.abs(pageNum - currentPage) <= PAGE_WINDOW_N}
                    initialDimensions={pageDimensions[pageNum] || firstPageSize || undefined}
                    onDimensionsMeasured={handleDimensionsMeasured}
                    searchMatches={isSearchOpen ? matchesByPage.get(pageNum) : undefined}
                    searchOpts={searchOpts}
                    onNavigateDestination={handleNavigateDestination}
                    nightMode={nightMode}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Parola İletişim Kutusu (Modal) (Faz B) */}
        <PdfPasswordModal
          isOpen={isPasswordModalOpen}
          reason={passwordReason}
          onSubmit={handlePasswordSubmit}
          onCancel={handlePasswordCancel}
        />

        {/* Klavye Kısayolları Modalı (Faz F) */}
        <PdfShortcutsModal
          isOpen={isShortcutsModalOpen}
          onClose={() => setIsShortcutsModalOpen(false)}
        />
      </div>
    </div>
  );
}
