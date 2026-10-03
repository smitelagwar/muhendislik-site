// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PROFESSIONAL PDF.JS STUDIO VIEWER CORE
// ============================================================================

"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSecurePdfLoadingTask } from "@/lib/dokumantasyon/studio/pdf/pdfjs-loader";
import {
  globalPageIndexCache,
  SearchProgress,
  SearchMatch,
  SearchOpts,
  searchPdfDocumentIncremental,
} from "@/lib/dokumantasyon/studio/pdf/pdf-search-engine";
import {
  MappingRule,
  repairExtractedText,
  detectBrokenMappingFromDoc,
} from "@/lib/dokumantasyon/studio/pdf/pdf-text-repair";
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
import { pdfViewerStrings } from "./strings";
import { pdfRenderQueue } from "@/lib/dokumantasyon/studio/pdf/pdf-render-queue";
import {
  usePdfGestures,
  useZoomGestures,
  clampPdfScale,
  MIN_PDF_SCALE,
  getNextAcrobatZoomIn,
  getNextAcrobatZoomOut,
} from "@/lib/dokumantasyon/studio/pdf/pdf-gesture-engine";
import {
  computePdfFitScale,
  getMaxPdfScale,
  PDF_PAGE_GAP,
  PDF_PAGE_PADDING,
  rotatePdfPageSize,
  zoomToPdfScale,
} from "@/lib/dokumantasyon/studio/pdf/pdf-zoom-math";
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

const MIN_SCALE = MIN_PDF_SCALE;
const PAGE_WINDOW_N = 5; // Faz C: Bellek penceresi [görünür - 5, görünür + 5]

function clampScale(scale: number, max = getMaxPdfScale()) {
  return clampPdfScale(scale, MIN_SCALE, max);
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
  const viewerRootRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const loadingTaskRef = useRef<any>(null);
  const pdfDocRef = useRef<any>(null);
  const retryCountRef = useRef<number>(0);
  const zoomRef = useRef<ZoomState>({ mode: "fit-width", scale: 1.2 });
  const lastContainerWidthRef = useRef<number>(0);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<ZoomState>({ mode: "fit-width", scale: 1.2 });
  const [renderedScale, setRenderedScale] = useState<number>(1.2);
  const [isQueueIdle, setIsQueueIdle] = useState<boolean>(true);
  const [rotation, setRotation] = useState<number>(0);
  const rotationRef = useRef<number>(0);
  rotationRef.current = rotation;
  const [spaceDown, setSpaceDown] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [isChromeHidden, setIsChromeHidden] = useState(false);
  const [toolbarHeight, setToolbarHeight] = useState(56);
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
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
  const isHandToolEffective = isHandTool || spaceDown;

  // Kenar Çubuğu ve Arama Snippet Paneli
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [sidebarTab, setSidebarTab] = useState<"thumbnails" | "outline">("thumbnails");
  const [outline, setOutline] = useState<OutlineItemNode[] | null>(null);
  const [pageLabels, setPageLabels] = useState<(string | null | undefined)[] | null>(null);
  const [navHistory, setNavHistory] = useState<NavigationHistoryEntry[]>([]);
  const [navForwardHistory, setNavForwardHistory] = useState<NavigationHistoryEntry[]>([]);
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

  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    const update = () => setIsCoarsePointer(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 719px)");
    const update = () => setIsMobileLayout(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const update = () => setNativeFullscreen(document.fullscreenElement === viewerRootRef.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;
    const update = () => setToolbarHeight(Math.ceil(toolbar.getBoundingClientRect().height));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(toolbar);
    return () => observer.disconnect();
  }, []);

  // Desktop keyboard shortcuts work as soon as the opened PDF is ready; keep mobile focus untouched.
  useEffect(() => {
    if (!pdfDoc || loading || isMobileLayout) return;
    const frame = window.requestAnimationFrame(() => {
      viewerRootRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pdfDoc, loading, isMobileLayout]);

  // Faz R3: Bozuk Harf Eşleme Onarımı (CMap Repair)
  const [autoRepairText, setAutoRepairText] = useState<boolean>(() => getPdfSettings().autoRepairText);
  const [textRepairRules, setTextRepairRules] = useState<MappingRule[]>([]);

  const handleToggleAutoRepairText = useCallback(() => {
    setAutoRepairText((prev) => {
      const next = !prev;
      setSettings((s) => ({ ...s, autoRepairText: next }));
      setPdfSettings({ autoRepairText: next });
      globalPageIndexCache.clear();
      return next;
    });
  }, []);

  useEffect(() => {
    if (!pdfDoc) {
      setTextRepairRules([]);
      return;
    }
    let active = true;
    detectBrokenMappingFromDoc(pdfDoc).then((rules) => {
      if (active) {
        setTextRepairRules(rules);
        if (rules.length > 0) {
          globalPageIndexCache.clear();
        }
      }
    });
    return () => {
      active = false;
    };
  }, [pdfDoc]);

  // Faz R3: Seçim kopyalama olayını dinle ve bozuk ToUnicode karakterlerini (Ĝ -> i) 1:1 onar
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      if (!autoRepairText || textRepairRules.length === 0) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

      const container = scrollContainerRef.current;
      if (!container) return;

      const anchorNode = selection.anchorNode;
      const focusNode = selection.focusNode;
      const isInside =
        (anchorNode && container.contains(anchorNode)) ||
        (focusNode && container.contains(focusNode));
      if (!isInside) return;

      const rawText = selection.toString();
      if (!rawText) return;

      const repaired = repairExtractedText(rawText, textRepairRules);
      if (repaired && repaired !== rawText) {
        e.clipboardData?.setData("text/plain", repaired);
        e.preventDefault();
      }
    };

    window.addEventListener("copy", handleCopy);
    return () => window.removeEventListener("copy", handleCopy);
  }, [autoRepairText, textRepairRules]);

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
      rotation: rotationRef.current as 0 | 90 | 180 | 270,
      sidebarOpen: isSidebarOpen,
      sidebarTab,
      handTool: isHandTool,
      nightMode,
      fileVersion: currentFileVersion,
    });
  }, [fileId, currentFileVersion, isHandTool, isSidebarOpen, nightMode, sidebarTab]);

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
    if (loading || !pdfDoc) return;
    triggerDebouncedSave();
  }, [pdfDoc, loading, zoom, rotation, isSidebarOpen, sidebarTab, isHandTool, nightMode, triggerDebouncedSave]);

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

  const updateZoomState = useCallback((nextZoom: ZoomState) => {
    zoomRef.current = nextZoom;
    setZoom(nextZoom);
  }, []);

  const getFitScale = useCallback((mode: Extract<ZoomMode, "fit-width" | "fit-page">) => {
    const container = scrollContainerRef.current;
    const currentSize = pageDimensions[currentPageRef.current] || firstPageSize;
    if (!container || !currentSize) return null;

    const pageSize = rotatePdfPageSize(currentSize, rotation);
    const targetScale = computePdfFitScale({
      mode,
      containerWidth: container.clientWidth,
      containerHeight: container.clientHeight,
      pageWidth: pageSize.width,
      pageHeight: pageSize.height,
      topInset: isMobileLayout ? toolbarHeight : 0,
    });

    return clampScale(targetScale);
  }, [firstPageSize, isMobileLayout, pageDimensions, rotation, toolbarHeight]);

  const zoomToRef = useRef<((n: number, o?: any) => void) | null>(null);
  const handleSmartZoomRef = useRef<
    ((point: { clientX: number; clientY: number }, target?: EventTarget | null) => void) | null
  >(null);
  const handleViewerTap = useCallback((_: number, __: number, target: EventTarget | null) => {
    if (!isCoarsePointer || isSearchOpen) return;
    if ((target as Element | null)?.closest?.("a, button, input, select, [data-no-tap]")) return;
    if (typeof window !== "undefined" && window.getSelection()?.isCollapsed === false) return;
    setIsChromeHidden((hidden) => !hidden);
  }, [isCoarsePointer, isSearchOpen]);

  const applyFitMode = useCallback(
    (mode: Extract<ZoomMode, "fit-width" | "fit-page">, animate = false) => {
      const targetScale = getFitScale(mode);
      if (targetScale === null) return;

      targetScaleRef.current = targetScale;
      if (Math.abs(zoomRef.current.scale - targetScale) < 1e-4) {
        updateZoomState({ mode, scale: targetScale });
        setRenderedScale(targetScale);
        return;
      }
      if (animate && zoomToRef.current) {
        zoomToRef.current(targetScale, { animate: true, mode });
      } else {
        if (zoomToRef.current) {
          zoomToRef.current(targetScale, { animate: false, mode });
        } else {
          updateZoomState({ mode, scale: targetScale });
          setRenderedScale(targetScale);
        }
      }
    },
    [getFitScale, updateZoomState]
  );

  // Donanım Hızlandırmalı CSS Transform Zoom & Pinch Jestleri ve Odak Korumalı Zoom API'si (v2 + v3 Acrobat)
  const zoomTo = useZoomGestures(scrollContainerRef, contentRef, {
    scale: zoom.scale,
    min: MIN_SCALE,
    max: getMaxPdfScale(),
    onCommit: (nextScale, mode, hasQueuedZoom) => {
      if (!hasQueuedZoom) targetScaleRef.current = nextScale;
      const nextMode = mode ?? "custom";
      updateZoomState({ mode: nextMode, scale: nextScale });
      setRenderedScale(nextScale);
    },
    onDoubleTap: (clientX, clientY, target) => {
      handleSmartZoomRef.current?.({ clientX, clientY }, target);
    },
    onTap: handleViewerTap,
    disabled: loading || !pdfDoc,
  });
  zoomToRef.current = zoomTo;

  const handleZoomIn = useCallback(() => {
    const currentTarget = targetScaleRef.current;
    const nextTarget = getNextAcrobatZoomIn(currentTarget);
    targetScaleRef.current = nextTarget;
    zoomTo(nextTarget, { animate: true, mode: "custom" });
  }, [zoomTo]);

  const handleZoomOut = useCallback(() => {
    const currentTarget = targetScaleRef.current;
    const nextTarget = getNextAcrobatZoomOut(currentTarget);
    targetScaleRef.current = nextTarget;
    zoomTo(nextTarget, { animate: true, mode: "custom" });
  }, [zoomTo]);

  const setActualSize = useCallback(() => {
    const actualScale = zoomToPdfScale(1);
    targetScaleRef.current = actualScale;
    if (Math.abs(zoomRef.current.scale - actualScale) < 1e-4) {
      updateZoomState({ mode: "actual-size", scale: actualScale });
      setRenderedScale(actualScale);
      return;
    }
    zoomTo(actualScale, { animate: true, mode: "actual-size" });
  }, [updateZoomState, zoomTo]);

  const handlePresetZoom = useCallback((targetScale: number) => {
    targetScaleRef.current = targetScale;
    if (Math.abs(zoomRef.current.scale - targetScale) < 1e-4) {
      updateZoomState({ mode: "custom", scale: targetScale });
      setRenderedScale(targetScale);
      return;
    }
    zoomTo(targetScale, { animate: true, mode: "custom" });
  }, [updateZoomState, zoomTo]);

  // Çift Tıklama / Çift Dokunma ile Akıllı Zoom (Faz 4 & v3 Acrobat)
  const handleSmartZoom = useCallback(
    (point: { clientX: number; clientY: number }, target?: EventTarget | null) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      if (typeof window !== "undefined") {
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
          return;
        }
      }
      if ((target as Element | null)?.closest?.("a, button, input, select, [data-no-tap]")) {
        return;
      }

      const fitScale = getFitScale("fit-width") ?? 1.2;
      const isZoomedIn = targetScaleRef.current > fitScale * 1.15;

      if (isZoomedIn) {
        // Zaten zoomlanmışsa odaklı animasyonla genişliğe sığdır moduna dön
        targetScaleRef.current = fitScale;
        zoomTo(fitScale, { x: point.clientX, y: point.clientY, animate: true, mode: "fit-width" });
      } else {
        // Dokunulan / tıklanan noktaya odaklanarak 2.2x akıllı zoom yap
        const targetZoom = clampScale(Number((fitScale * 2.2).toFixed(2)));
        targetScaleRef.current = targetZoom;
        zoomTo(targetZoom, { x: point.clientX, y: point.clientY, animate: true, mode: "custom" });
      }
    },
    [getFitScale, zoomTo]
  );
  handleSmartZoomRef.current = handleSmartZoom;

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
    setError(pdfViewerStrings.passwordError);
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
        setNavHistory([]);
        setNavForwardHistory([]);
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
        const restoredMode: ZoomMode = savedRecord?.scaleMode ?? getPdfSettings().defaultViewMode;
        const restoredScale = restoredMode === "actual-size"
          ? zoomToPdfScale(1)
          : restoredMode === "custom" && savedRecord?.scale
          ? clampScale(savedRecord.scale)
          : savedRecord?.scale ?? zoomRef.current.scale;
        targetScaleRef.current = restoredScale;
        updateZoomState({ mode: restoredMode, scale: restoredScale });
        setRenderedScale(restoredScale);
        setRotation(savedRecord?.rotation ?? 0);
        setIsSidebarOpen(savedRecord?.sidebarOpen ?? false);
        setSidebarTab(savedRecord?.sidebarTab ?? "thumbnails");
        setIsHandTool(savedRecord?.handTool ?? false);
        setNightMode(savedRecord?.nightMode ?? getPdfSettings().nightMode);
        setIsChromeHidden(false);
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
          setError(pdfViewerStrings.corruptPdf);
          setLoading(false);
          return;
        }

        // 2. Eksik / Bulunamayan PDF (404): retry yok
        if (httpStatus === 404 || errName === "MissingPDFException" || /missing pdf|not found/i.test(errMessage)) {
          setErrorType("missing");
          setError(pdfViewerStrings.missingPdf);
          setLoading(false);
          return;
        }

        // 3. Parola İptal Edildi veya Hata:
        if (errName === "PasswordException") {
          setErrorType("password");
          setError(pdfViewerStrings.passwordError);
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
              setError(pdfViewerStrings.accessRefreshError);
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
            : pdfViewerStrings.genericLoadError
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
  }, [accessUrl, onAccessExpired, fileId, reloadKey, currentFileVersion, updateZoomState]);

  const applyFitModeRef = useRef(applyFitMode);
  applyFitModeRef.current = applyFitMode;

  // Fit modunda etkin sayfanın boyutuna uyum sağla (karışık A4/A3 paftalar).
  const activePageSize = pageDimensions[currentPage] || firstPageSize;
  useEffect(() => {
    if (loading || !pdfDoc || !activePageSize) return;
    const mode = zoomRef.current.mode;
    if (mode !== "fit-width" && mode !== "fit-page") return;
    const frame = window.requestAnimationFrame(() => {
      if (zoomRef.current.mode === mode) applyFitModeRef.current(mode);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activePageSize?.width, activePageSize?.height, currentPage, isMobileLayout, loading, pdfDoc, rotation, toolbarHeight]);

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

  // Scroll viewport mount edildikten sonra aktif fit modunu koru (v2: genişlik >= 2px, debounce 150ms, data-zooming koruması)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (loading || !container || !firstPageSize) return;

    let resizeTimer: number | null = null;
    const updateFitMode = () => {
      if (container.hasAttribute("data-zooming")) return;
      const currentWidth = container.clientWidth;
      if (lastContainerWidthRef.current > 0 && Math.abs(currentWidth - lastContainerWidthRef.current) < 2) {
        return; // Dikey yükseklik değişimini (mobil adres çubuğu vb.) yok say, zoom sıfırlanmasın
      }
      lastContainerWidthRef.current = currentWidth;

      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }
      resizeTimer = window.setTimeout(() => {
        resizeTimer = null;
        if (container.hasAttribute("data-zooming")) return;
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
      }, 150);
    };

    const frame = window.requestAnimationFrame(() => {
      lastContainerWidthRef.current = container.clientWidth;
      const mode = zoomRef.current.mode;
      if (mode === "fit-width" || mode === "fit-page") {
        applyFitModeRef.current(mode);
      }
    });
    const observer = new ResizeObserver(updateFitMode);
    observer.observe(container);

    return () => {
      window.cancelAnimationFrame(frame);
      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }
      observer.disconnect();
    };
  }, [firstPageSize, isMobileLayout, loading, rotation, toolbarHeight]);

  // 2. Sayfaya Kaydırma (Scroll to Page) ve Konum Kaydetme (Faz H)
  const scrollToPage = useCallback((pageNum: number) => {
    if (pageNum < 1 || pageNum > numPages) return;
    setNavForwardHistory([]);
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
        setNavForwardHistory([]);
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
    const target = navHistory[navHistory.length - 1];
    const container = scrollContainerRef.current;
    if (!target || !container) return;
    setNavHistory((prev) => prev.slice(0, -1));
    setNavForwardHistory((prev) =>
      pushNavigationHistory(prev, { page: currentPageRef.current, scrollTop: container.scrollTop })
    );
    currentPageRef.current = target.page;
    setCurrentPage(target.page);
    pdfRenderQueue.setCurrentPage(target.page);
    container.scrollTo({ top: target.scrollTop, behavior: "smooth" });
  }, [navHistory]);

  const handleNavigateForward = useCallback(() => {
    const target = navForwardHistory[navForwardHistory.length - 1];
    const container = scrollContainerRef.current;
    if (!target || !container) return;
    setNavForwardHistory((prev) => prev.slice(0, -1));
    setNavHistory((prev) =>
      pushNavigationHistory(prev, { page: currentPageRef.current, scrollTop: container.scrollTop })
    );
    currentPageRef.current = target.page;
    setCurrentPage(target.page);
    pdfRenderQueue.setCurrentPage(target.page);
    container.scrollTo({ top: target.scrollTop, behavior: "smooth" });
  }, [navForwardHistory]);

  const handleSidebarSelectPage = useCallback((page: number) => {
    const container = scrollContainerRef.current;
    if (container) {
      setNavHistory((prev) => pushNavigationHistory(prev, {
        page: currentPageRef.current,
        scrollTop: container.scrollTop,
      }));
      setNavForwardHistory([]);
    }
    scrollToPage(page);
    if (isCoarsePointer) setIsSidebarOpen(false);
  }, [isCoarsePointer, scrollToPage]);

  const handleSelectOutlineItem = useCallback(
    (item: OutlineItemNode) => {
      if (item.dest) {
        handleNavigateDestination(item.dest);
        if (isCoarsePointer) setIsSidebarOpen(false);
      }
    },
    [handleNavigateDestination, isCoarsePointer]
  );

  const handleToggleOutline = useCallback(() => {
    if (isSidebarOpen && sidebarTab === "outline") {
      setIsSidebarOpen(false);
    } else {
      setSidebarTab("outline");
      setIsSidebarOpen(true);
      setIsChromeHidden(false);
      setIsSnippetPanelOpen(false);
    }
  }, [isSidebarOpen, sidebarTab]);

  const handleToggleSidebar = useCallback(() => {
    if (isSidebarOpen && sidebarTab === "thumbnails") {
      setIsSidebarOpen(false);
    } else {
      setSidebarTab("thumbnails");
      setIsSidebarOpen(true);
      setIsChromeHidden(false);
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

  const handleContinuousScrubEnd = useCallback(
    (requestedPage: number, startPosition: { page: number; scrollTop: number }) => {
      isScrubbingRef.current = false;
      const container = scrollContainerRef.current;
      const finalPage = Math.min(Math.max(Math.round(requestedPage), 1), numPages);

      if (container && Math.abs(finalPage - startPosition.page) >= 10) {
        setNavHistory((prev) =>
          pushNavigationHistory(prev, {
            page: startPosition.page,
            scrollTop: startPosition.scrollTop,
          })
        );
      }
      setNavForwardHistory([]);
      setCurrentPage(finalPage);
      currentPageRef.current = finalPage;
      pdfRenderQueue.setCurrentPage(finalPage);

      if (container && container.scrollHeight > 0) {
        preservedStateRef.current = {
          page: finalPage,
          scrollRatio: container.scrollTop / container.scrollHeight,
          scale: zoomRef.current.scale,
        };
      }
      triggerDebouncedSave();
    },
    [numPages, triggerDebouncedSave]
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
          const previousHeight = rotatePdfPageSize(existing, rotationRef.current).height;
          const nextHeight = rotatePdfPageSize({ width, height }, rotationRef.current).height;
          const deltaH = nextHeight - previousHeight;
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
          },
          globalPageIndexCache,
          autoRepairText ? textRepairRules : undefined
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
  }, [pdfDoc, searchQuery, isSearchOpen, searchOpts, numPages, scrollToPage, autoRepairText, textRepairRules]);

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

  const handleToggleViewerFullscreen = useCallback(() => {
    if (onToggleFullscreen) {
      onToggleFullscreen();
      return;
    }
    const root = viewerRootRef.current;
    if (document.fullscreenElement === root) {
      void document.exitFullscreen().catch(() => setPseudoFullscreen(false));
      return;
    }
    if (pseudoFullscreen) {
      setPseudoFullscreen(false);
      return;
    }
    if (root?.requestFullscreen) {
      void root.requestFullscreen().catch(() => setPseudoFullscreen(true));
    } else {
      setPseudoFullscreen(true);
    }
  }, [onToggleFullscreen, pseudoFullscreen]);

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

  // Kısayollar yalnızca PDF stüdyosu odaktayken çalışır; sayfa kaydırma tuşları tarayıcıya bırakılır.
  useEffect(() => {
    const root = viewerRootRef.current;
    if (!root) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement !== document.body && activeElement !== root && !root.contains(activeElement)) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      const editable = !!target?.closest("input, textarea, select, [contenteditable='true']");
      const interactive = !!target?.closest("button, a, input, textarea, select, [contenteditable='true']");
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (e.code === "Space" && !mod && !e.altKey && !editable && !interactive) {
        e.preventDefault();
        setSpaceDown(true);
        return;
      }
      if (editable && !mod && e.key !== "Escape") return;

      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        handleNavigateBack();
      } else if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        handleNavigateForward();
      } else if (mod && key === "f") {
        e.preventDefault();
        setIsSearchOpen(true);
        setIsChromeHidden(false);
        requestAnimationFrame(() => root.querySelector<HTMLInputElement>("[data-testid='pdf-search-bar'] input")?.focus());
      } else if (mod && key === "g") {
        e.preventDefault();
        if (e.shiftKey) handlePrevMatch();
        else handleNextMatch();
      } else if (e.key === "F4") {
        e.preventDefault();
        handleToggleSidebar();
      } else if (mod && e.shiftKey && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        setRotation((r) => (r + 90) % 360);
      } else if (mod && e.shiftKey && e.key === "-") {
        e.preventDefault();
        setRotation((r) => (r + 270) % 360);
      } else if (mod && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        handleZoomIn();
      } else if (mod && e.key === "-") {
        e.preventDefault();
        handleZoomOut();
      } else if (mod && e.key === "0") {
        e.preventDefault();
        applyFitMode("fit-page", true);
      } else if (mod && e.key === "1") {
        e.preventDefault();
        setActualSize();
      } else if (mod && e.key === "2") {
        e.preventDefault();
        applyFitMode("fit-width", true);
      } else if (mod && key === "l") {
        e.preventDefault();
        handleToggleViewerFullscreen();
      } else if (mod && key === "r") {
        e.preventDefault();
        setRotation((r) => (r + 90) % 360);
      } else if (mod && key === "p") {
        e.preventDefault();
        handlePrint();
      } else if (mod && key === "b") {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
        setIsSnippetPanelOpen(false);
      } else if (mod && !e.shiftKey && key === "d") {
        e.preventDefault();
        handleDownloadAction();
      } else if (mod && e.shiftKey && key === "s" && onShare) {
        e.preventDefault();
        onShare();
      } else if (!mod && !e.altKey && !interactive && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        handleZoomIn();
      } else if (!mod && !e.altKey && !interactive && e.key === "-") {
        e.preventDefault();
        handleZoomOut();
      } else if (!mod && !e.altKey && !interactive && key === "h") {
        e.preventDefault();
        setIsHandTool(true);
      } else if (!mod && !e.altKey && !interactive && key === "v") {
        e.preventDefault();
        setIsHandTool(false);
      } else if (!mod && !e.altKey && !interactive && e.key === "ArrowLeft") {
        const scroll = scrollContainerRef.current;
        if (scroll && scroll.scrollWidth <= scroll.clientWidth + 1) {
          e.preventDefault();
          scrollToPage(Math.max(currentPageRef.current - 1, 1));
        }
      } else if (!mod && !e.altKey && !interactive && e.key === "ArrowRight") {
        const scroll = scrollContainerRef.current;
        if (scroll && scroll.scrollWidth <= scroll.clientWidth + 1) {
          e.preventDefault();
          scrollToPage(Math.min(currentPageRef.current + 1, numPages));
        }
      } else if (!mod && !e.altKey && !interactive && e.key === "Home") {
        e.preventDefault();
        scrollToPage(1);
      } else if (!mod && !e.altKey && !interactive && e.key === "End") {
        e.preventDefault();
        scrollToPage(numPages);
      } else if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        if (isShortcutsModalOpen) {
          e.preventDefault();
          setIsShortcutsModalOpen(false);
        } else if (isSearchOpen) {
          e.preventDefault();
          setIsSearchOpen(false);
          setIsSnippetPanelOpen(false);
        } else if (isSidebarOpen) {
          e.preventDefault();
          setIsSidebarOpen(false);
        } else if (isHandTool) {
          e.preventDefault();
          setIsHandTool(false);
        } else if (pseudoFullscreen) {
          e.preventDefault();
          setPseudoFullscreen(false);
        } else {
          setIsChromeHidden(false);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceDown(false);
    };
    const handleWindowBlur = () => setSpaceDown(false);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [
    applyFitMode,
    handleDownloadAction,
    handleNavigateBack,
    handleNavigateForward,
    handleNextMatch,
    handlePrevMatch,
    handlePrint,
    handleToggleSidebar,
    handleToggleViewerFullscreen,
    handleZoomIn,
    handleZoomOut,
    isHandTool,
    isSearchOpen,
    isShortcutsModalOpen,
    isSidebarOpen,
    numPages,
    onShare,
    pseudoFullscreen,
    scrollToPage,
    setActualSize,
  ]);

  const handleFitWidth = () => {
    applyFitMode("fit-width", true);
  };

  const handleFitPage = () => {
    applyFitMode("fit-page", true);
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
    isHandTool: isHandToolEffective,
    scale: zoom.scale,
    onSmartZoom: handleSmartZoom,
    disabled: loading || !pdfDoc,
  });



  const currentMatch = searchResult.matches[currentMatchIndex];
  const viewerState: "idle" | "loading" | "rendering" = loading
    ? "loading"
    : !isQueueIdle
    ? "rendering"
    : "idle";

  return (
    <div
      ref={viewerRootRef}
      tabIndex={0}
      data-zoom-mode={zoom.mode}
      data-tool={isHandToolEffective ? "hand" : "select"}
      data-night={nightMode || undefined}
      data-pseudo-fs={pseudoFullscreen || undefined}
      data-pdf-viewer-state={viewerState}
      aria-label={pdfViewerStrings.viewer}
      onPointerDownCapture={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("button, a, input, textarea, select, [contenteditable='true']")) return;
        viewerRootRef.current?.focus({ preventScroll: true });
      }}
      className={cn(
        "relative flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden bg-background text-foreground select-none",
        isReducedMotion && "reduce-motion",
        pseudoFullscreen && "fixed inset-0 z-[9999] h-[100dvh]"
      )}
    >
      {/* 1. PDF Studio Toolbar */}
      <div ref={toolbarRef} className={cn(
        "z-30 shrink-0 transition-transform duration-200",
        isMobileLayout ? "absolute inset-x-0 top-0" : "relative",
        isMobileLayout && isChromeHidden && "-translate-y-full pointer-events-none"
      )}>
      <PdfViewerToolbar
        numPages={numPages}
        currentPage={currentPage}
        scale={scale}
        zoomMode={zoom.mode}
        isSidebarOpen={isSidebarOpen}
        isHandTool={isHandToolEffective}
        isSearchOpen={isSearchOpen}
        onToggleSidebar={handleToggleSidebar}
        pageLabels={pageLabels}
        hasOutline={Boolean(outline && outline.length > 0)}
        onToggleOutline={handleToggleOutline}
        canNavigateBack={navHistory.length > 0}
        onNavigateBack={handleNavigateBack}
        canNavigateForward={navForwardHistory.length > 0}
        onNavigateForward={handleNavigateForward}
        onPageChange={scrollToPage}
        onSetHandTool={setIsHandTool}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoom100={setActualSize}
        onFitWidth={handleFitWidth}
        onFitPage={handleFitPage}
        onZoomSelect={handlePresetZoom}
        onRotateView={() => setRotation((r) => (r + 90) % 360)}
        onToggleSearch={() => {
          setIsSearchOpen((prev) => !prev);
          setIsChromeHidden(false);
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
        isTextRepaired={autoRepairText && textRepairRules.length > 0}
        autoRepairText={autoRepairText}
        onToggleAutoRepairText={handleToggleAutoRepairText}
        displayName={displayName}
        sizeBytes={sizeBytes}
        extension={extension}
        versionNo={versionNo}
        createdAt={createdAt}
        isFullscreen={isFullscreen || pseudoFullscreen || nativeFullscreen}
        onToggleFullscreen={handleToggleViewerFullscreen}
        onBack={onBack}
        onShare={onShare}
        onDownload={handleDownloadAction}
        onRename={onRename}
        onDelete={onDelete}
      />
      </div>

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
          onSelectPage={handleSidebarSelectPage}
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
                ? pdfViewerStrings.refreshingAccess
                : loadProgress && loadProgress.total > 0
                ? pdfViewerStrings.loadingPdfPercent(Math.min(Math.round((loadProgress.loaded / loadProgress.total) * 100), 100))
                : pdfViewerStrings.preparingPdf}
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
                  ? pdfViewerStrings.corruptTitle
                  : errorType === "missing"
                  ? pdfViewerStrings.missingTitle
                  : errorType === "password"
                  ? pdfViewerStrings.passwordProtectedTitle
                  : pdfViewerStrings.loadErrorTitle}
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
                    {pdfViewerStrings.downloadFile}
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
                    {pdfViewerStrings.enterPasswordButton}
                  </button>
                )}
                {errorType === "network" && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    data-testid="pdf-retry-btn"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-800 border border-zinc-700 px-3.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                  >
                    {pdfViewerStrings.retryButton}
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
              onContinuousScrubEnd={handleContinuousScrubEnd}
              scrollElementRef={scrollContainerRef}
              ready={!loading && !!pdfDoc}
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
              className={`pdf-scroll min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain [scrollbar-gutter:stable] ${
                nightMode ? "bg-zinc-950" : "bg-muted/50 dark:bg-zinc-900/60"
              } [touch-action:pan-x_pan-y] ${
                isHandToolEffective
                  ? isDragging
                    ? "cursor-grabbing touch-none"
                    : "cursor-grab touch-none"
                  : "cursor-default"
              }`}
              style={isMobileLayout ? { paddingTop: `${toolbarHeight + PDF_PAGE_PADDING}px` } : undefined}
            >
              <div
                ref={contentRef}
                className="pdf-content flex min-w-full w-max flex-col items-center"
                style={{ gap: `${PDF_PAGE_GAP}px`, padding: `${PDF_PAGE_PADDING}px` }}
              >
                {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                  <PdfPageView
                    key={pageNum}
                    pdfDoc={pdfDoc}
                    pageNumber={pageNum}
                    scale={scale}
                    renderedScale={renderedScale}
                    rotation={rotation}
                    isHandTool={isHandToolEffective}
                    repairRules={autoRepairText ? textRepairRules : undefined}
                    searchQuery={isSearchOpen ? searchQuery : ""}
                    isCurrentMatchPage={currentMatch?.pageNumber === pageNum}
                    activeMatchIndexInPage={currentMatch?.pageNumber === pageNum ? currentMatch.matchIndexInPage : -1}
                    onPageVisible={handlePageVisible}
                    isWithinWindow={Math.abs(pageNum - currentPage) <= PAGE_WINDOW_N}
                    initialDimensions={
                      (pageDimensions[pageNum] || firstPageSize)
                        ? rotatePdfPageSize(pageDimensions[pageNum] || firstPageSize!, rotation)
                        : undefined
                    }
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
