"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { AlertCircle, Check, Edit3, Loader2, RefreshCw } from "lucide-react";
import { PDFJS_CMAPS, PDFJS_FONTS, PDFJS_ICCS, PDFJS_WASM } from "@/lib/pdfjs-paths";
import { getSharedBrowserPdfWorker, loadBrowserPdfJs, type BrowserPdfJs } from "@/lib/pdfjs-client";
import { BelgeStudioPreviewToolbar, type BelgeStudioPdfFocusApi } from "@/components/belge-studio-preview-toolbar";
import type { BelgeStudioFormViewControls } from "@/hooks/use-belge-studio-form-view";
import { BELGE_STUDIO_PREVIEW_CANVAS_CLASS, BELGE_STUDIO_PREVIEW_PANEL_CLASS } from "@/lib/belge-studio-layout";
import { clampBelgeZoom, getBelgePreviewRasterScale, getBelgeZoomAnchorScroll } from "@/lib/belge-studio-zoom";
import {
  mapPdfAnnotationsToInlineFields,
  type BelgeDocumentId,
  type InlineFieldDescriptor,
  type RawPdfAnnotation,
} from "@/lib/belge-studio-inline-field-map";
import {
  extractFieldFocusRects,
  type FieldFocusRect,
  type FieldFocusSelection,
} from "@/lib/belge-field-focus";
import { BelgeStudioFieldFocusLayer } from "@/components/belge-studio-field-focus-layer";
import { DOCUMENT_EDITABLE_FIELDS } from "@/lib/document-field-contracts";
import { BelgeStudioInlineEditLayer } from "@/components/belge-studio-inline-edit-layer";
import type { BelgeDocumentSnapshot } from "@/hooks/use-belge-studio-document";
import { BelgeInlineEditSheet, type BelgeInlineSheetNavTarget } from "@/components/belge-inline-edit-sheet";
import { useBelgeInlineMobileMode } from "@/hooks/use-belge-inline-mobile-mode";
import { useBelgeStudioMobileContext } from "@/components/belge-studio-mobile-context";
import { BelgeStudioMobileZoomPill } from "@/components/belge-studio-mobile-zoom-pill";
import {
  BELGE_INLINE_TAP_MAX_MOVE,
  BELGE_INLINE_TAP_MAX_MS,
  findInlineFieldAtPoint,
  getInlineFieldRevealDelta,
  orderInlineFields,
} from "@/lib/belge-inline-mobile";

type LoadingTask = ReturnType<BrowserPdfJs["getDocument"]>;
type PdfDocument = Awaited<LoadingTask["promise"]>;
type PdfPage = Awaited<ReturnType<PdfDocument["getPage"]>>;
type PdfRenderTask = ReturnType<PdfPage["render"]>;
export type BelgePreviewStatus = "loading" | "rendering" | "ready" | "error";

type RenderedToken = {
  revision: number;
  pageNumber: number;
  zoom: number;
  requestId: number;
};

export type BelgeStudioInlineEditingConfig = {
  documentId: BelgeDocumentId;
  values?: Record<string, string>;
  onCommit?: (field: string, value: string) => void;
};

export type BelgeStudioPdfPreviewProps = {
  snapshot: BelgeDocumentSnapshot | null;
  generationPending: boolean;
  generationError?: string | null;
  onStatusChange: (revision: number, status: BelgePreviewStatus, error?: string) => void;
  onRetry: () => void;
  editing?: BelgeStudioInlineEditingConfig;
  activeTabMobile?: "form" | "preview";
  formView?: BelgeStudioFormViewControls;
  fieldFocus?: FieldFocusSelection;
  onClearFieldFocus?: () => void;
  pdfFocus?: BelgeStudioPdfFocusApi;
  toolbarTarget?: HTMLElement | null;
};

type Point = { x: number; y: number };
type Pointer = { id: number; point: Point };

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function BelgeStudioPdfPreview({
  snapshot,
  generationPending,
  generationError = null,
  onStatusChange,
  onRetry,
  editing,
  activeTabMobile,
  formView,
  fieldFocus,
  onClearFieldFocus,
  pdfFocus,
  toolbarTarget,
}: BelgeStudioPdfPreviewProps) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [localStatus, setLocalStatus] = useState<BelgePreviewStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [gestureEndVersion, setGestureEndVersion] = useState(0);
  const [isInlineEditingActive, setIsInlineEditingActive] = useState(false);
  const [inlineFields, setInlineFields] = useState<InlineFieldDescriptor[]>([]);
  const [inlineSelectedField, setInlineSelectedField] = useState<InlineFieldDescriptor | null>(null);
  const [renderedToken, setRenderedToken] = useState<RenderedToken | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const isMobileMode = useBelgeInlineMobileMode();
  const [navFields, setNavFields] = useState<InlineFieldDescriptor[]>([]);
  const [sheetTop, setSheetTop] = useState<number | null>(null);
  const [sheetAttention, setSheetAttention] = useState(0);
  const [coach, setCoach] = useState<string | null>(null);

  const [displayedPage, setDisplayedPage] = useState<number | null>(null);
  const [fieldFocusRects, setFieldFocusRects] = useState<Record<string, FieldFocusRect> | null>(null);
  const [mobileHighlightKey, setMobileHighlightKey] = useState<string | null>(null);
  const mobileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMobileFlashedEventIdRef = useRef<number>(0);
  const suppressedFocusEventIdRef = useRef<number>(0);
  const geometryCacheRef = useRef<Record<string, FieldFocusRect> | null>(null);
  const geometryInFlightRef = useRef<{ pdf: PdfDocument; promise: Promise<void> } | null>(null);
  const fieldFocusDocIdRef = useRef<string | null>(null);
  const fieldFocusRef = useRef(fieldFocus);
  fieldFocusRef.current = fieldFocus;
  const pendingRevealRectRef = useRef<{
    rect: FieldFocusRect;
    documentId: BelgeDocumentId;
    focusEventId: number;
    clearEventId: number;
  } | null>(null);
  const lastRevealedEventIdRef = useRef<number>(0);
  const performRevealRef = useRef<(rect: FieldFocusRect) => void>(() => {});

  const containerRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadingTaskRef = useRef<LoadingTask | null>(null);
  const documentRef = useRef<PdfDocument | null>(null);
  const renderTaskRef = useRef<PdfRenderTask | null>(null);
  const renderRequestRef = useRef(0);
  const layoutRetryRafRef = useRef<number | null>(null);
  const lastContainerSizeRef = useRef({ width: 0, height: 0 });
  const zoomRef = useRef(zoomLevel);
  const pageRef = useRef(currentPage);
  const isInlineEditingActiveRef = useRef(isInlineEditingActive);
  isInlineEditingActiveRef.current = isInlineEditingActive;
  const editingRef = useRef(editing);
  editingRef.current = editing;
  const renderedSizeRef = useRef({ width: 0, height: 0, zoom: 100 });
  const pointersRef = useRef<Pointer[]>([]);
  const panStartRef = useRef<{ point: Point; left: number; top: number; startTime: number } | null>(null);
  const pinchStartRef = useRef<{
    distance: number;
    zoom: number;
    relativeX: number;
    relativeY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);
  const pinchingRef = useRef(false);
  const everMultitouchRef = useRef(false);
  const pendingAnchorRef = useRef<{
    relativeX: number;
    relativeY: number;
    pointerX: number;
    pointerY: number;
  } | null>(null);
  const statusHandlerRef = useRef(onStatusChange);
  statusHandlerRef.current = onStatusChange;
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const renderedRevisionRef = useRef<number | null>(null);
  const renderedTokenRef = useRef<RenderedToken | null>(null);
  renderedTokenRef.current = renderedToken;
  const lastRenderedContainerSizeRef = useRef({ width: 0, height: 0 });
  const sheetDirtyRef = useRef(false);
  // Alt sayfa açıkken fit ölçüsü dondurulur; klavye kabı küçültse de sayfa yeniden ölçeklenmez.
  const layoutFreezeRef = useRef<{ width: number; height: number } | null>(null);
  const pendingLayoutRef = useRef(false);
  const panMovedRef = useRef(false);
  const hotspotGeometryValidRef = useRef(false);
  zoomRef.current = zoomLevel;
  pageRef.current = currentPage;

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const geometryFailureCountRef = useRef(0);

  const extractGeometry = useCallback(async (pdf: PdfDocument, docId: BelgeDocumentId): Promise<void> => {
    const isCurrent = () => isMountedRef.current && documentRef.current === pdf &&
      (fieldFocusRef.current?.documentId ?? editingRef.current?.documentId) === docId;
    if (!isCurrent()) return;

    // Belge kimliğini başarısız ilk denemede de kaydet; deneme bütçesi revizyonla yenilenmez.
    if (fieldFocusDocIdRef.current !== docId) {
      fieldFocusDocIdRef.current = docId;
      geometryCacheRef.current = null;
      geometryFailureCountRef.current = 0;
      setFieldFocusRects(null);
    }
    if (geometryCacheRef.current) {
      setFieldFocusRects(geometryCacheRef.current);
      return;
    }

    const pending = geometryInFlightRef.current;
    if (pending?.pdf === pdf) {
      await pending.promise;
      return;
    }
    // Yeni PDF eski ve iptal edilmiş bir annotation isteğinin bitmesini beklemez.
    // Eski işlemin isCurrent/finally kontrolleri güncel sonucu korur.
    if (geometryFailureCountRef.current >= 2) return;

    const promise = (async () => {
      // İlk geçici hatada kullanıcıdan yeniden yazmasını beklemeden bir kez daha dene.
      while (isCurrent() && geometryFailureCountRef.current < 2) {
        try {
          const geo = await extractFieldFocusRects(pdf, docId);
          if (!isCurrent()) return;
          const complete = DOCUMENT_EDITABLE_FIELDS[docId].every((key) => Boolean(geo.rects[key]));
          setFieldFocusRects(Object.keys(geo.rects).length ? geo.rects : null);
          if (complete) {
            geometryCacheRef.current = geo.rects;
            return;
          }
        } catch (error) {
          if (!isCurrent()) return;
          console.warn("PDF alan odak geometrisi çıkarılamadı:", error);
        }
        geometryFailureCountRef.current += 1;
      }
    })().finally(() => {
      if (geometryInFlightRef.current?.promise === promise) geometryInFlightRef.current = null;
    });
    geometryInFlightRef.current = { pdf, promise };
    await promise;
  }, []);

  const extractGeometryRef = useRef(extractGeometry);
  extractGeometryRef.current = extractGeometry;

  useEffect(() => {
    const pdf = documentRef.current;
    const docId = fieldFocus?.documentId;
    if (fieldFocusDocIdRef.current && fieldFocusDocIdRef.current !== docId) {
      geometryCacheRef.current = null;
      setFieldFocusRects(null);
    }
    if (pdf && docId) {
      void extractGeometry(pdf, docId);
    }
  }, [fieldFocus?.documentId, extractGeometry]);

  useEffect(() => {
    return () => {
      geometryCacheRef.current = null;
      fieldFocusDocIdRef.current = null;
    };
  }, []);

  const report = useCallback((status: BelgePreviewStatus, error?: string) => {
    setLocalStatus(status);
    setErrorMessage(error ?? "");
    const currentSnapshot = snapshotRef.current;
    if (currentSnapshot) statusHandlerRef.current(currentSnapshot.revision, status, error);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    lastContainerSizeRef.current = {
      width: container.clientWidth,
      height: container.clientHeight,
    };
    const observer = new ResizeObserver(() => {
      if (layoutFreezeRef.current) {
        pendingLayoutRef.current = true;
        return;
      }
      const nextWidth = container.clientWidth;
      const nextHeight = container.clientHeight;
      const prev = lastContainerSizeRef.current;
      if (Math.abs(nextWidth - prev.width) < 1 && Math.abs(nextHeight - prev.height) < 1) {
        return;
      }
      lastContainerSizeRef.current = { width: nextWidth, height: nextHeight };
      setLayoutVersion((version) => version + 1);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (layoutFreezeRef.current) {
        pendingLayoutRef.current = true;
        return;
      }
      setLayoutVersion((version) => version + 1);
    };
    // Yön değişiminde dondurma bırakılır; yeni ekran ölçüsü hemen uygulanır.
    const handleOrientation = () => {
      layoutFreezeRef.current = null;
      pendingLayoutRef.current = false;
      setLayoutVersion((version) => version + 1);
    };
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleOrientation, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientation);
    };
  }, []);

  const applyZoomAnchor = useCallback(() => {
    const anchor = pendingAnchorRef.current;
    const container = containerRef.current;
    const frame = frameRef.current;
    if (!anchor || !container || !frame) return;
    const containerRect = container.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    const viewportLeft = containerRect.left + container.clientLeft;
    const viewportTop = containerRect.top + container.clientTop;
    const next = getBelgeZoomAnchorScroll({
      frameLeft: frameRect.left - viewportLeft + container.scrollLeft,
      frameTop: frameRect.top - viewportTop + container.scrollTop,
      nextWidth: frameRect.width,
      nextHeight: frameRect.height,
      relativeX: anchor.relativeX,
      relativeY: anchor.relativeY,
      pointerX: anchor.pointerX - viewportLeft,
      pointerY: anchor.pointerY - viewportTop,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
    });
    container.scrollLeft = next.scrollLeft;
    container.scrollTop = next.scrollTop;
  }, []);

  const renderPage = useCallback(async (layoutRetryCount = 0) => {
    if (layoutRetryRafRef.current !== null) {
      cancelAnimationFrame(layoutRetryRafRef.current);
      layoutRetryRafRef.current = null;
    }

    const pdf = documentRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const frame = frameRef.current;
    if (!pdf || !canvas || !container || !frame) return;
    if (container.clientWidth < 1 || container.clientHeight < 1) {
      if (layoutRetryCount < 60) {
        layoutRetryRafRef.current = requestAnimationFrame(() => {
          layoutRetryRafRef.current = null;
          void renderPage(layoutRetryCount + 1);
        });
      }
      return;
    }

    const requestId = ++renderRequestRef.current;
    const renderZoom = zoomRef.current;
    const renderPageNumber = pageRef.current;
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // Önceki çizim kapanmış olabilir.
      }
      renderTaskRef.current = null;
    }
    const isFirstRenderOfRevision =
      renderedRevisionRef.current !== snapshotRef.current?.revision;
    if (isFirstRenderOfRevision) {
      report("rendering");
    }

    const bufferCanvas = document.createElement("canvas");
    try {
      const page = await pdf.getPage(renderPageNumber);
      if (
        requestId !== renderRequestRef.current ||
        pinchingRef.current ||
        zoomRef.current !== renderZoom ||
        pageRef.current !== renderPageNumber
      ) {
        return;
      }
      const unscaled = page.getViewport({ scale: 1 });
      const frozenSize = layoutFreezeRef.current;
      const containerWidth = frozenSize ? frozenSize.width : container.clientWidth;
      const containerHeight = frozenSize ? frozenSize.height : container.clientHeight;
      const availableWidth = Math.max(1, containerWidth - 16);
      const availableHeight = Math.max(1, containerHeight - 16);
      const fitScale = Math.min(availableWidth / unscaled.width, availableHeight / unscaled.height);
      const effectiveScale = fitScale * (renderZoom / 100);
      const viewport = page.getViewport({ scale: effectiveScale });
      const rasterScale = getBelgePreviewRasterScale(
        viewport.width,
        viewport.height,
        window.devicePixelRatio || 1
      );

      const bitmapWidth = Math.max(1, Math.floor(viewport.width * rasterScale));
      const bitmapHeight = Math.max(1, Math.floor(viewport.height * rasterScale));
      const cssWidth = Math.ceil(viewport.width);
      const cssHeight = Math.ceil(viewport.height);

      if (renderedSizeRef.current.width === 0) {
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;
        frame.style.width = `${cssWidth}px`;
        frame.style.height = `${cssHeight}px`;
        renderedSizeRef.current = {
          width: cssWidth,
          height: cssHeight,
          zoom: renderZoom,
        };
      }

      bufferCanvas.width = bitmapWidth;
      bufferCanvas.height = bitmapHeight;
      const bufferContext = bufferCanvas.getContext("2d");
      if (!bufferContext) throw new Error("PDF çizim alanı başlatılamadı.");

      const transform =
        rasterScale !== 1 ? [rasterScale, 0, 0, rasterScale, 0, 0] : undefined;

      const renderTask = page.render({
        canvas: bufferCanvas,
        canvasContext: bufferContext,
        transform,
        viewport,
      });
      renderTaskRef.current = renderTask;
      await renderTask.promise;
      if (
        requestId !== renderRequestRef.current ||
        pinchingRef.current ||
        zoomRef.current !== renderZoom ||
        pageRef.current !== renderPageNumber
      ) {
        return;
      }
      renderTaskRef.current = null;

      canvas.width = bitmapWidth;
      canvas.height = bitmapHeight;
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      canvas.style.transform = "none";
      frame.style.width = `${cssWidth}px`;
      frame.style.height = `${cssHeight}px`;
      renderedSizeRef.current = {
        width: cssWidth,
        height: cssHeight,
        zoom: renderZoom,
      };
      lastRenderedContainerSizeRef.current = {
        width: containerWidth,
        height: containerHeight,
      };
      const visibleContext = canvas.getContext("2d");
      if (!visibleContext) throw new Error("PDF çizim alanı başlatılamadı.");
      visibleContext.drawImage(bufferCanvas, 0, 0);
      canvas.style.opacity = "1";
      setDisplayedPage(renderPageNumber);

      if (
        pendingRevealRectRef.current &&
        pendingRevealRectRef.current.rect.pageNumber === renderPageNumber
      ) {
        const pending = pendingRevealRectRef.current;
        pendingRevealRectRef.current = null;
        requestAnimationFrame(() => {
          const selection = fieldFocusRef.current;
          if (requestId !== renderRequestRef.current || isInlineEditingActiveRef.current ||
            selection?.documentId !== pending.documentId || selection.focusEventId !== pending.focusEventId ||
            (selection.clearEventId ?? 0) !== pending.clearEventId || selection.fieldKey !== pending.rect.fieldKey) return;
          performRevealRef.current(pending.rect);
        });
      }

      const anchor = pendingAnchorRef.current;
      if (anchor) {
        requestAnimationFrame(() => {
          if (requestId !== renderRequestRef.current) return;
          applyZoomAnchor();
          pendingAnchorRef.current = null;
        });
      }

      let mappedFields: InlineFieldDescriptor[] = [];
      const currentEditing = editingRef.current;
      if (currentEditing && isInlineEditingActiveRef.current) {
        try {
          const rawAnns = (await page.getAnnotations({ intent: "display" })) as RawPdfAnnotation[];
          if (requestId === renderRequestRef.current) {
            const mapped = mapPdfAnnotationsToInlineFields({
              documentId: currentEditing.documentId,
              pageNumber: renderPageNumber,
              annotations: rawAnns,
              viewport,
            });
            mappedFields = mapped.fields;
          }
        } catch (annError) {
          console.warn("PDF alan haritası okunamadı:", annError);
        }
      }
      if (
        requestId !== renderRequestRef.current ||
        pinchingRef.current ||
        zoomRef.current !== renderZoom ||
        pageRef.current !== renderPageNumber
      ) {
        return;
      }
      setInlineFields(mappedFields);
      if (mappedFields.length > 0) setNavFields(orderInlineFields(mappedFields));
      renderedRevisionRef.current = snapshotRef.current?.revision ?? null;
      const nextToken: RenderedToken = {
        revision: snapshotRef.current?.revision ?? 0,
        pageNumber: renderPageNumber,
        zoom: renderZoom,
        requestId,
      };
      renderedTokenRef.current = nextToken;
      setRenderedToken(nextToken);
      report("ready");
    } catch (error) {
      const cancelled =
        error instanceof Error &&
        (error.name === "RenderingCancelledException" || error.name === "AbortException");
      if (requestId !== renderRequestRef.current || cancelled) return;
      const message = error instanceof Error ? error.message : "PDF sayfası çizilemedi.";
      report("error", `PDF önizlemesi çizilemedi. ${message}`);
      console.error("PDF canvas çizim hatası:", error);
    } finally {
      bufferCanvas.width = 0;
      bufferCanvas.height = 0;
    }
  }, [report, applyZoomAnchor]);

  useEffect(() => {
    if (activeTabMobile !== "preview" || !documentRef.current || pinchingRef.current) return;
    if (renderTaskRef.current !== null) return;
    const container = containerRef.current;
    const token = renderedTokenRef.current;
    const lastSize = lastRenderedContainerSizeRef.current;
    const alreadyRendered =
      token !== null &&
      token.revision === snapshotRef.current?.revision &&
      token.pageNumber === pageRef.current &&
      token.zoom === zoomRef.current &&
      renderedSizeRef.current.width > 0 &&
      container !== null &&
      Math.abs(container.clientWidth - lastSize.width) < 2 &&
      Math.abs(container.clientHeight - lastSize.height) < 2;
    if (!alreadyRendered) {
      void renderPage();
    }
  }, [activeTabMobile, renderPage]);

  useEffect(() => {
    renderedRevisionRef.current = null;
    renderedTokenRef.current = null;
    setRenderedToken(null);
    setInlineFields([]);
    if (!snapshot) {
      documentRef.current = null;
      setPageCount(0);
      setCurrentPage(1);
      setLocalStatus("loading");
      return;
    }

    let disposed = false;
    let previewTimeout: ReturnType<typeof setTimeout> | null = null;
    const bytes = snapshot.bytes.slice();
    setPageCount(0);
    setLocalStatus("loading");
    setErrorMessage("");
    statusHandlerRef.current(snapshot.revision, "loading");

    const timeoutPromise = new Promise<never>((_, reject) => {
      previewTimeout = setTimeout(
        () => reject(new Error("PDF önizlemesi zaman aşımına uğradı.")),
        40_000
      );
    });

    void (async () => {
      try {
        const loadOperation = (async () => {
          const pdfjs = await loadBrowserPdfJs();
          if (!pdfjs) throw new Error("Yerel PDF görüntüleyicisi yüklenemedi.");
          if (disposed) return null;

          const worker = await getSharedBrowserPdfWorker(pdfjs);
          if (disposed) return null;

          const docParams: Parameters<BrowserPdfJs["getDocument"]>[0] & { isEvalSupported?: boolean } = {
            data: bytes,
            cMapUrl: PDFJS_CMAPS,
            standardFontDataUrl: PDFJS_FONTS,
            wasmUrl: PDFJS_WASM,
            iccUrl: PDFJS_ICCS,
            cMapPacked: true,
            isEvalSupported: false,
          };
          if (worker) {
            (docParams as { worker?: unknown }).worker = worker;
          }

          const loadingTask = pdfjs.getDocument(docParams);
          loadingTaskRef.current = loadingTask;
          const pdf = await loadingTask.promise;
          return { pdf, loadingTask };
        })();

        const result = await Promise.race([loadOperation, timeoutPromise]);
        if (!result || disposed) {
          if (result?.loadingTask) void result.loadingTask.destroy();
          return;
        }
        documentRef.current = result.pdf;
        const targetDocId = fieldFocusRef.current?.documentId ?? editingRef.current?.documentId;
        if (targetDocId) {
          void extractGeometryRef.current(result.pdf, targetDocId);
        }
        const nextPage = Math.min(Math.max(1, pageRef.current), result.pdf.numPages);
        pageRef.current = nextPage;
        setCurrentPage(nextPage);
        setPageCount(result.pdf.numPages);
        if (!pinchingRef.current) {
          void renderPage();
        }
      } catch (error) {
        if (disposed) return;
        const message = error instanceof Error ? error.message : "PDF açılamadı.";
        report("error", `PDF önizlemesi yüklenemedi. ${message}`);
        console.error("PDF önizlemesi yüklenemedi:", error);
      } finally {
        if (previewTimeout) {
          clearTimeout(previewTimeout);
          previewTimeout = null;
        }
      }
    })();

    return () => {
      disposed = true;
      if (previewTimeout) {
        clearTimeout(previewTimeout);
        previewTimeout = null;
      }
      if (layoutRetryRafRef.current !== null) {
        cancelAnimationFrame(layoutRetryRafRef.current);
        layoutRetryRafRef.current = null;
      }
      renderRequestRef.current += 1;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // Önceki çizim kapanmış olabilir.
        }
        renderTaskRef.current = null;
      }
      const loadingTask = loadingTaskRef.current;
      loadingTaskRef.current = null;
      documentRef.current = null;
      if (loadingTask) void loadingTask.destroy();
    };
  }, [snapshot, loadAttempt, report, renderPage]);

  useEffect(() => {
    if (!documentRef.current || pinchingRef.current) return;
    const timer = window.setTimeout(() => void renderPage(), 90);
    return () => window.clearTimeout(timer);
  }, [renderPage, zoomLevel, currentPage, layoutVersion, gestureEndVersion, isInlineEditingActive]);

  const isMobileSheetOpen = Boolean(editing) && isMobileMode && isInlineEditingActive && inlineSelectedField !== null;

  const requestSheetDismiss = useCallback(() => {
    if (sheetDirtyRef.current) {
      setSheetAttention((count) => count + 1);
      return;
    }
    sheetDirtyRef.current = false;
    setInlineSelectedField(null);
  }, []);

  const handleSheetClose = useCallback(() => {
    sheetDirtyRef.current = false;
    setInlineSelectedField(null);
  }, []);

  const handleSheetDirtyChange = useCallback((dirty: boolean) => {
    sheetDirtyRef.current = dirty;
  }, []);

  const handleSheetCommit = useCallback((fieldKey: string, value: string) => {
    editingRef.current?.onCommit?.(fieldKey, value);
  }, []);

  // Fit ölçüsünü alt sayfa açılırken (klavye açılmadan önce, senkron) dondur.
  useLayoutEffect(() => {
    if (!isMobileSheetOpen) return;
    const container = containerRef.current;
    if (container && !layoutFreezeRef.current) {
      layoutFreezeRef.current = { width: container.clientWidth, height: container.clientHeight };
    }
    return () => {
      layoutFreezeRef.current = null;
      container?.style.removeProperty("--belge-inline-sheet-overlap");
      if (pendingLayoutRef.current) {
        pendingLayoutRef.current = false;
        window.requestAnimationFrame(() => setLayoutVersion((version) => version + 1));
      }
    };
  }, [isMobileSheetOpen]);

  // Mobil form sekmesine geçişte alt sayfa kapanır.
  useEffect(() => {
    if (activeTabMobile !== "form") return;
    sheetDirtyRef.current = false;
    setInlineSelectedField(null);
  }, [activeTabMobile]);

  // İpucu 4 sn sonra kendiliğinden kaybolur.
  useEffect(() => {
    if (!coach) return;
    const timer = window.setTimeout(() => setCoach(null), 4000);
    return () => window.clearTimeout(timer);
  }, [coach]);

  const setZoomAroundPoint = useCallback((nextZoom: number, point: Point) => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    const surface = surfaceRef.current;
    if (!container || !canvas || !frame || !surface) {
      setZoomLevel(clampBelgeZoom(nextZoom));
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const relativeX = Math.max(0, Math.min(1, (point.x - rect.left) / Math.max(1, rect.width)));
    const relativeY = Math.max(0, Math.min(1, (point.y - rect.top) / Math.max(1, rect.height)));
    const clampedZoom = clampBelgeZoom(nextZoom);
    if (clampedZoom === zoomRef.current) return;
    const size = renderedSizeRef.current;
    // Canvas son raster ölçeğinde kalır; ardışık tekerlek olayları bu ölçeğe göre hesaplanır.
    const ratio = clampedZoom / Math.max(1, size.zoom);
    const nextWidth = size.width * ratio;
    const nextHeight = size.height * ratio;
    frame.style.width = `${nextWidth}px`;
    frame.style.height = `${nextHeight}px`;
    canvas.style.transformOrigin = "top left";
    canvas.style.transform = `scale(${nextWidth / Math.max(1, size.width)})`;
    pendingAnchorRef.current = {
      relativeX,
      relativeY,
      pointerX: point.x,
      pointerY: point.y,
    };
    zoomRef.current = clampedZoom;
    setRenderedToken(null);
    applyZoomAnchor();
    setZoomLevel(clampedZoom);
  }, [applyZoomAnchor]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey) || container.getClientRects().length === 0 || getComputedStyle(container).visibility === "hidden") return;
      // React wheel olayları pasiftir; tarayıcı zoom'unu yalnız bu yüzeyde iptal et.
      event.preventDefault();
      event.stopPropagation();
      if (!documentRef.current || event.deltaY === 0) return;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? container.clientHeight : 1;
      const delta = Math.max(-300, Math.min(300, event.deltaY * unit));
      setZoomAroundPoint(zoomRef.current * Math.exp(-delta * 0.002), { x: event.clientX, y: event.clientY });
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [setZoomAroundPoint]);

  const getContainerPoint = (event: ReactPointerEvent<HTMLDivElement>): Point => ({
    x: event.clientX,
    y: event.clientY,
  });

  const handleTouchTap = (point: Point) => {
    if (!editingRef.current || !isInlineEditingActiveRef.current) return;
    if (!hotspotGeometryValidRef.current) return;
    const frame = frameRef.current;
    if (!frame) return;
    const sheetOpen = isMobileMode && inlineSelectedField !== null;
    const frameRect = frame.getBoundingClientRect();
    const hit = findInlineFieldAtPoint(inlineFields, point.x - frameRect.left, point.y - frameRect.top);
    if (hit) {
      if (sheetOpen && inlineSelectedField?.fieldKey === hit.fieldKey) return;
      if (sheetOpen && sheetDirtyRef.current) {
        setSheetAttention((count) => count + 1);
        return;
      }
      sheetDirtyRef.current = false;
      setCoach(null);
      // Senkron commit: editör input'u bu dokunma olayı içinde odaklanır (iOS klavyesi).
      flushSync(() => setInlineSelectedField(hit));
      return;
    }
    if (sheetOpen) requestSheetDismiss();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch" || !snapshot || !documentRef.current) return;
    if (!(event.target instanceof Node) || !event.currentTarget.contains(event.target)) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('[data-testid="belge-inline-edit-popover"]')) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getContainerPoint(event);
    const pointers = [...pointersRef.current.filter((pointer) => pointer.id !== event.pointerId), { id: event.pointerId, point }];
    pointersRef.current = pointers;
    if (pointers.length >= 2) {
      everMultitouchRef.current = true;
    }
    if (pointers.length === 1) {
      pendingAnchorRef.current = null;
      panMovedRef.current = false;
      panStartRef.current = {
        point,
        left: event.currentTarget.scrollLeft,
        top: event.currentTarget.scrollTop,
        startTime: Date.now(),
      };
      pinchStartRef.current = null;
      pinchingRef.current = false;
      return;
    }

    setIsInteracting(true);
    // Mobil alt sayfa pinch sırasında açık kalır; masaüstü popover kapanır.
    if (!isMobileMode) setInlineSelectedField(null);
    renderRequestRef.current += 1;
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // Önceki çizim kapanmış olabilir.
      }
      renderTaskRef.current = null;
    }
    const [first, second] = pointers;
    const center = midpoint(first.point, second.point);
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const size = renderedSizeRef.current;
    const startWidth = canvasRect && canvasRect.width > 0 ? canvasRect.width : size.width;
    const startHeight = canvasRect && canvasRect.height > 0 ? canvasRect.height : size.height;
    pinchStartRef.current = {
      distance: Math.max(1, distance(first.point, second.point)),
      zoom: zoomRef.current,
      relativeX: canvasRect ? Math.max(0, Math.min(1, (center.x - canvasRect.left) / Math.max(1, canvasRect.width))) : 0.5,
      relativeY: canvasRect ? Math.max(0, Math.min(1, (center.y - canvasRect.top) / Math.max(1, canvasRect.height))) : 0.5,
      startWidth,
      startHeight,
    };
    pinchingRef.current = true;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch" || !snapshot || !documentRef.current) return;
    if (!pointersRef.current.some((pointer) => pointer.id === event.pointerId)) return;
    const pointers = pointersRef.current.map((pointer) =>
      pointer.id === event.pointerId ? { ...pointer, point: getContainerPoint(event) } : pointer
    );
    pointersRef.current = pointers;

    if (pointers.length >= 2 && pinchStartRef.current) {
      event.preventDefault();
      const [first, second] = pointers;
      const start = pinchStartRef.current;
      const center = midpoint(first.point, second.point);
      const nextZoom = clampBelgeZoom(start.zoom * (distance(first.point, second.point) / start.distance));
      const ratio = nextZoom / start.zoom;
      const frame = frameRef.current;
      const canvas = canvasRef.current;
      const baseWidth = renderedSizeRef.current.width > 0 ? renderedSizeRef.current.width : start.startWidth;
      if (frame && canvas) {
        frame.style.width = `${start.startWidth * ratio}px`;
        frame.style.height = `${start.startHeight * ratio}px`;
        canvas.style.transformOrigin = "top left";
        canvas.style.transform = `scale(${(start.startWidth * ratio) / Math.max(1, baseWidth)})`;
        pendingAnchorRef.current = {
          relativeX: start.relativeX,
          relativeY: start.relativeY,
          pointerX: center.x,
          pointerY: center.y,
        };
        applyZoomAnchor();
      }
      if (nextZoom !== zoomRef.current) {
        renderedTokenRef.current = null;
        setRenderedToken(null);
      }
      zoomRef.current = nextZoom;
      setZoomLevel(nextZoom);
      return;
    }

    if (pointers.length === 1 && panStartRef.current) {
      const start = panStartRef.current;
      const dx = event.clientX - start.point.x;
      const dy = event.clientY - start.point.y;
      if (!panMovedRef.current) {
        if (Math.hypot(dx, dy) <= BELGE_INLINE_TAP_MAX_MOVE) return;
        panMovedRef.current = true;
        setIsInteracting(true);
      }
      const element = event.currentTarget;
      const canPan = element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1;
      if (!canPan) return;
      event.preventDefault();
      element.scrollLeft = start.left - dx;
      element.scrollTop = start.top - dy;
    }
  };

  const finishPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.some((pointer) => pointer.id === event.pointerId)) return;
    const endingPoint = getContainerPoint(event);
    const prevPointers = pointersRef.current;
    pointersRef.current = pointersRef.current.filter((pointer) => pointer.id !== event.pointerId);
    if (pointersRef.current.length < 2) pinchStartRef.current = null;
    if (pointersRef.current.length === 0) {
      const panStart = panStartRef.current;
      panStartRef.current = null;
      const wasMultitouch = everMultitouchRef.current;
      everMultitouchRef.current = false;
      const moved = panMovedRef.current;
      panMovedRef.current = false;
      setIsInteracting(false);
      if (pinchingRef.current) {
        pinchingRef.current = false;
        setGestureEndVersion((version) => version + 1);
        void renderPage();
        return;
      }
      const isTap =
        event.type === "pointerup" &&
        !wasMultitouch &&
        !moved &&
        panStart !== null &&
        prevPointers.length === 1 &&
        Date.now() - panStart.startTime < BELGE_INLINE_TAP_MAX_MS;
      if (isTap) handleTouchTap(endingPoint);
      return;
    }
    if (pinchingRef.current) {
      // Kalan parmak yeni bir tek parmak kaydırma başlangıcı olur; dokunuş sayılmaz.
      const remaining = pointersRef.current[0];
      panStartRef.current = {
        point: remaining.point,
        left: event.currentTarget.scrollLeft,
        top: event.currentTarget.scrollTop,
        startTime: Date.now(),
      };
      panMovedRef.current = true;
      pinchingRef.current = false;
      setGestureEndVersion((version) => version + 1);
      void renderPage();
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Node) || !event.currentTarget.contains(event.target)) return;
    if (!(event.ctrlKey || event.metaKey)) return;
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      handleToolbarZoom(clampBelgeZoom(zoomRef.current + 25));
    } else if (event.key === "-") {
      event.preventDefault();
      handleToolbarZoom(clampBelgeZoom(zoomRef.current - 25));
    } else if (event.key === "0") {
      event.preventDefault();
      handleFit();
    }
  };

  const handlePreviewRetry = () => {
    if (generationError || !snapshot) {
      onRetry();
      return;
    }
    if (localStatus === "error") {
      renderedRevisionRef.current = null;
      setLoadAttempt((attempt) => attempt + 1);
    }
  };

  const handleFit = () => {
    if (!isMobileMode) setInlineSelectedField(null);
    // Zaten %100 ise zoom effect'i tekrar çalışmaz; geçerli token'ı silme.
    if (zoomRef.current !== 100) setRenderedToken(null);
    pendingAnchorRef.current = null;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    const rendered = renderedSizeRef.current;
    if (container) {
      container.scrollTo({ left: 0, top: 0, behavior: "auto" });
    }
    const ratio = 100 / Math.max(1, rendered.zoom);
    if (canvas) canvas.style.transform = ratio === 1 ? "none" : `scale(${ratio})`;
    if (frame && rendered.width > 0 && rendered.height > 0) {
      frame.style.width = `${rendered.width * ratio}px`;
      frame.style.height = `${rendered.height * ratio}px`;
    }
    zoomRef.current = 100;
    setZoomLevel(100);
  };

  const handleToolbarZoom = (value: number) => {
    if (!isMobileMode) setInlineSelectedField(null);
    setRenderedToken(null);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      setZoomLevel(value);
      return;
    }
    setZoomAroundPoint(value, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  const userManualPageChoiceRef = useRef<{ page: number; eventId: number } | null>(null);

  const handlePageChange = (page: number, isUserInteraction = true) => {
    if (isUserInteraction) {
      pendingRevealRectRef.current = null;
      userManualPageChoiceRef.current = {
        page,
        eventId: fieldFocus?.focusEventId ?? 0,
      };
    }
    if (isMobileMode && inlineSelectedField !== null && sheetDirtyRef.current) {
      setSheetAttention((count) => count + 1);
      return;
    }
    sheetDirtyRef.current = false;
    setInlineSelectedField(null);
    setRenderedToken(null);
    setInlineFields([]);
    setNavFields([]);
    const container = containerRef.current;
    if (container) container.scrollTo({ left: 0, top: 0, behavior: "auto" });
    pendingAnchorRef.current = null;
    pageRef.current = page;
    setCurrentPage(page);
  };

  const handlePageChangeRef = useRef(handlePageChange);
  handlePageChangeRef.current = handlePageChange;

  const showLoading = generationPending || localStatus === "loading" || localStatus === "rendering";
  const visibleError = localStatus === "error" || generationError !== null;

  const isOverlayTokenValid = Boolean(
    renderedToken &&
      snapshot &&
      renderedToken.revision === snapshot.revision &&
      renderedToken.pageNumber === currentPage &&
      renderedToken.zoom === zoomLevel
  );

  const canvasTransform = canvasRef.current?.style.transform;
  const canvasTransformNone =
    !canvasTransform || canvasTransform === "none" || canvasTransform === "scale(1)";

  const hotspotGeometryValid = Boolean(
    editing &&
      isInlineEditingActive &&
      !visibleError &&
      !generationPending &&
      localStatus === "ready" &&
      isOverlayTokenValid &&
      inlineFields.length > 0 &&
      canvasTransformNone
  );
  hotspotGeometryValidRef.current = hotspotGeometryValid;

  const isHotspotsInteractive = hotspotGeometryValid && !isInteracting;

  const shouldRenderOverlayLayer = Boolean(
    editing &&
      isInlineEditingActive &&
      !visibleError &&
      (isHotspotsInteractive || inlineSelectedField !== null)
  );

  const liveSelectedField = inlineSelectedField
    ? navFields.find(
        (field) => field.fieldKey === inlineSelectedField.fieldKey && field.pageNumber === inlineSelectedField.pageNumber
      ) ?? inlineSelectedField
    : null;
  const selectedNavIndex = liveSelectedField
    ? navFields.findIndex((field) => field.fieldKey === liveSelectedField.fieldKey)
    : -1;
  const prevNavField = selectedNavIndex > 0 ? navFields[selectedNavIndex - 1] : null;
  const nextNavField =
    selectedNavIndex >= 0 && selectedNavIndex < navFields.length - 1 ? navFields[selectedNavIndex + 1] : null;
  const prevTarget: BelgeInlineSheetNavTarget = prevNavField
    ? { kind: "field", label: prevNavField.label }
    : currentPage > 1
      ? { kind: "page", pageNumber: currentPage - 1 }
      : null;
  const nextTarget: BelgeInlineSheetNavTarget = nextNavField
    ? { kind: "field", label: nextNavField.label }
    : currentPage < pageCount
      ? { kind: "page", pageNumber: currentPage + 1 }
      : null;

  const selectedTop = liveSelectedField?.viewportRect.top ?? null;
  const selectedBottom = liveSelectedField?.viewportRect.bottom ?? null;
  const selectedLeft = liveSelectedField?.viewportRect.left ?? null;
  const selectedRight = liveSelectedField?.viewportRect.right ?? null;

  const showSelectedHighlight = isMobileSheetOpen && liveSelectedField !== null && !isInteracting && canvasTransformNone;

  const isFocusSuppressed =
    isInlineEditingActive ||
    (fieldFocus?.focusEventId ?? 0) <= suppressedFocusEventIdRef.current;

  const activeFieldKey = useMemo(() => {
    if (isFocusSuppressed) return null;
    if (isMobileMode) {
      if (activeTabMobile === "form") return null;
      if (!fieldFocus?.fieldKey && !fieldFocus?.lastFocusedFieldKey) return null;
      return mobileHighlightKey;
    }
    return fieldFocus?.fieldKey ?? null;
  }, [
    isFocusSuppressed,
    isMobileMode,
    activeTabMobile,
    fieldFocus?.fieldKey,
    fieldFocus?.lastFocusedFieldKey,
    mobileHighlightKey,
  ]);

  const activeFocusRect =
    activeFieldKey && fieldFocusRects ? fieldFocusRects[activeFieldKey] ?? null : null;

  const isFocusHighlightVisible = Boolean(
    !isInlineEditingActive &&
      !generationPending &&
      !visibleError &&
      activeFocusRect &&
      isOverlayTokenValid &&
      localStatus === "ready" &&
      displayedPage !== null &&
      activeFocusRect.pageNumber === displayedPage &&
      !pinchingRef.current &&
      canvasTransformNone
  );

  const performReveal = useCallback((rect: FieldFocusRect) => {
    const container = containerRef.current;
    const frame = frameRef.current;
    if (!container || !frame) return;

    const containerRect = container.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();

    const fieldLeft = frameRect.left + rect.left * frameRect.width;
    const fieldTop = frameRect.top + rect.top * frameRect.height;
    const fieldRight = fieldLeft + rect.width * frameRect.width;
    const fieldBottom = fieldTop + rect.height * frameRect.height;

    const { dx, dy } = getInlineFieldRevealDelta({
      field: {
        left: fieldLeft,
        top: fieldTop,
        right: fieldRight,
        bottom: fieldBottom,
      },
      visible: {
        left: containerRect.left,
        top: containerRect.top,
        right: containerRect.right,
        bottom: containerRect.bottom,
      },
      margin: 24,
    });

    if (dx === 0 && dy === 0) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    container.scrollBy({ left: dx, top: dy, behavior: reduceMotion ? "auto" : "smooth" });
  }, []);

  performRevealRef.current = performReveal;
  const focusDocumentId = fieldFocus?.documentId;

  useEffect(() => {
    if (isMobileMode) return;
    const focusEventId = fieldFocus?.focusEventId;
    if (!focusEventId || !focusDocumentId || !activeFocusRect || isFocusSuppressed) {
      pendingRevealRectRef.current = null;
      return;
    }
    if (focusEventId === lastRevealedEventIdRef.current) {
      return;
    }

    const targetPage = activeFocusRect.pageNumber;
    const pending = {
      rect: activeFocusRect,
      documentId: focusDocumentId,
      focusEventId,
      clearEventId: fieldFocus?.clearEventId ?? 0,
    };
    if (targetPage !== pageRef.current) {
      lastRevealedEventIdRef.current = focusEventId;
      pendingRevealRectRef.current = pending;
      handlePageChangeRef.current(targetPage, false);
      return;
    }

    if (displayedPage === targetPage && localStatus === "ready") {
      lastRevealedEventIdRef.current = focusEventId;
      pendingRevealRectRef.current = null;
      performReveal(activeFocusRect);
    } else {
      lastRevealedEventIdRef.current = focusEventId;
      pendingRevealRectRef.current = pending;
    }
  }, [
    fieldFocus?.focusEventId,
    focusDocumentId,
    fieldFocus?.clearEventId,
    activeFocusRect,
    isFocusSuppressed,
    displayedPage,
    localStatus,
    performReveal,
    isMobileMode,
  ]);

  const lastClearedEventIdRef = useRef<number>(0);
  const currentClearEventId = fieldFocus?.clearEventId ?? 0;
  const isSelectionCleared = Boolean(
    fieldFocus &&
    fieldFocus.fieldKey === null &&
    fieldFocus.lastFocusedFieldKey === null
  );

  useEffect(() => {
    if (currentClearEventId > lastClearedEventIdRef.current || isSelectionCleared) {
      lastClearedEventIdRef.current = currentClearEventId;
      if (mobileTimerRef.current) {
        clearTimeout(mobileTimerRef.current);
        mobileTimerRef.current = null;
      }
      setMobileHighlightKey(null);
      pendingRevealRectRef.current = null;
      lastMobileFlashedEventIdRef.current = 0;
      userManualPageChoiceRef.current = null;
    }
  }, [currentClearEventId, isSelectionCleared]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onClearFieldFocus) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClearFieldFocus();
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClearFieldFocus]);

  // Mobil sekme geçişi: Kullanıcı önizleme sekmesine geçtiğinde son odaklanan alan için 2.5s vurgu ve reveal
  useEffect(() => {
    if (!isMobileMode) return;

    if (activeTabMobile === "form") {
      if (mobileTimerRef.current) {
        clearTimeout(mobileTimerRef.current);
        mobileTimerRef.current = null;
      }
      setMobileHighlightKey(null);
      return;
    }

    if (activeTabMobile === "preview") {
      const focusEventId = fieldFocus?.focusEventId ?? 0;
      if (
        focusEventId === 0 ||
        focusEventId <= suppressedFocusEventIdRef.current ||
        focusEventId === lastMobileFlashedEventIdRef.current
      ) {
        return;
      }

      // If selection was explicitly cleared (e.g. Esc, Reset), do not start flash
      if (!fieldFocus?.fieldKey && !fieldFocus?.lastFocusedFieldKey) {
        return;
      }

      const targetKey = fieldFocus?.lastFocusedFieldKey ?? fieldFocus?.fieldKey;
      if (!targetKey || !fieldFocusRects) {
        return;
      }

      const targetRect = fieldFocusRects[targetKey];
      if (!targetRect) {
        return;
      }

      // Kullanıcı önizleme araç çubuğundan belirli bir sayfayı manuel seçmişse
      // ve o seçim geçerli odak olayı sırasında yapılmışsa, kullanıcının seçtiği sayfayı koru
      const manualChoice = userManualPageChoiceRef.current;
      if (
        manualChoice !== null &&
        manualChoice.eventId === focusEventId &&
        manualChoice.page === pageRef.current &&
        targetRect.pageNumber !== pageRef.current
      ) {
        return;
      }
      // Yeni bir odak olayı gelmişse eski manuel sayfa tercihini geçersiz kıl
      if (manualChoice !== null && manualChoice.eventId !== focusEventId) {
        userManualPageChoiceRef.current = null;
      }

      if (targetRect.pageNumber !== pageRef.current) {
        handlePageChangeRef.current(targetRect.pageNumber, false);
        return;
      }

      // Güvenli ve tek başlangıç yolu:
      // Hedef sayfa çizilmiş, localStatus 'ready' olmuş, generation veya render yüklemesi bitmiş
      // ve tuval kullanıcıya görünür olduğunda 2500ms sayacını başlat
      const isCanvasReadyAndVisible =
        isOverlayTokenValid &&
        displayedPage === targetRect.pageNumber &&
        localStatus === "ready" &&
        !showLoading &&
        !visibleError;

      if (isCanvasReadyAndVisible) {
        lastMobileFlashedEventIdRef.current = focusEventId;
        performReveal(targetRect);
        setMobileHighlightKey(targetKey);
        if (mobileTimerRef.current) {
          clearTimeout(mobileTimerRef.current);
        }
        mobileTimerRef.current = setTimeout(() => {
          setMobileHighlightKey(null);
          mobileTimerRef.current = null;
        }, 2500);
      }
    }
  }, [
    isMobileMode,
    activeTabMobile,
    fieldFocus?.focusEventId,
    fieldFocus?.lastFocusedFieldKey,
    fieldFocus?.fieldKey,
    fieldFocus?.clearEventId,
    fieldFocusRects,
    displayedPage,
    localStatus,
    showLoading,
    visibleError,
    performReveal,
    isOverlayTokenValid,
  ]);

  useEffect(() => {
    return () => {
      pendingRevealRectRef.current = null;
      lastRevealedEventIdRef.current = 0;
      if (mobileTimerRef.current) {
        clearTimeout(mobileTimerRef.current);
        mobileTimerRef.current = null;
      }
      lastMobileFlashedEventIdRef.current = 0;
      suppressedFocusEventIdRef.current = 0;
      userManualPageChoiceRef.current = null;
      setMobileHighlightKey(null);
    };
  }, [fieldFocus?.documentId]);
  const showEmptyFieldsStatus =
    isMobileMode &&
    Boolean(editing) &&
    isInlineEditingActive &&
    !isMobileSheetOpen &&
    !coach &&
    !visibleError &&
    !generationPending &&
    localStatus === "ready" &&
    isOverlayTokenValid &&
    inlineFields.length === 0;

  const handleSheetNavigate = (direction: -1 | 1) => {
    const targetField = direction === 1 ? nextNavField : prevNavField;
    sheetDirtyRef.current = false;
    if (targetField) {
      setInlineSelectedField(targetField);
      return;
    }
    const targetPage = currentPage + direction;
    if (targetPage < 1 || targetPage > pageCount) return;
    handlePageChange(targetPage);
    setCoach(`${targetPage}. sayfa: düzenlemek için bir alana dokunun.`);
  };

  // Fare/klavye ile hotspot seçimi de aynı kirli taslak korumasından geçer.
  const handleLayerSelectField = (field: InlineFieldDescriptor | null) => {
    if (
      field &&
      isMobileMode &&
      inlineSelectedField !== null &&
      inlineSelectedField.fieldKey !== field.fieldKey &&
      sheetDirtyRef.current
    ) {
      setSheetAttention((count) => count + 1);
      return;
    }
    if (field) setCoach(null);
    if (!field) sheetDirtyRef.current = false;
    setInlineSelectedField(field);
  };

  const setInlineEditing = useCallback((next: boolean) => {
    setIsInlineEditingActive(next);
    suppressedFocusEventIdRef.current = fieldFocusRef.current?.focusEventId ?? 0;
    setMobileHighlightKey(null);
    if (mobileTimerRef.current) {
      clearTimeout(mobileTimerRef.current);
      mobileTimerRef.current = null;
    }
    pendingRevealRectRef.current = null;
    if (!next) {
      sheetDirtyRef.current = false;
      setInlineSelectedField(null);
      setRenderedToken(null);
      setInlineFields([]);
      setNavFields([]);
      setCoach(null);
      return;
    }
    if (isMobileMode) setCoach("Turuncu çerçeveli alanlara dokunarak düzenleyin.");
  }, [isMobileMode]);

  const handleToggleInlineEditing = useCallback(() => {
    setInlineEditing(!isInlineEditingActive);
  }, [isInlineEditingActive, setInlineEditing]);

  const { registerPreviewBridge } = useBelgeStudioMobileContext();

  useEffect(() => {
    registerPreviewBridge({
      pdfUrl: generationPending ? null : snapshot?.blobUrl ?? null,
      pdfReady: Boolean(snapshot && !generationPending && !visibleError),
      inlineEdit: {
        active: isInlineEditingActive,
        setActive: setInlineEditing,
      },
    });
  }, [
    registerPreviewBridge,
    generationPending,
    snapshot?.blobUrl,
    snapshot,
    visibleError,
    isInlineEditingActive,
    setInlineEditing,
  ]);

  useEffect(() => {
    if (!isMobileSheetOpen || sheetTop === null || selectedTop === null || selectedBottom === null || selectedLeft === null || selectedRight === null) {
      return;
    }
    const container = containerRef.current;
    const frame = frameRef.current;
    if (!container || !frame) return;
    const raf = window.requestAnimationFrame(() => {
      const containerRect = container.getBoundingClientRect();
      const overlap = Math.max(0, Math.round(containerRect.bottom - sheetTop));
      container.style.setProperty("--belge-inline-sheet-overlap", `${overlap}px`);
      const frameRect = frame.getBoundingClientRect();
      const { dx, dy } = getInlineFieldRevealDelta({
        field: {
          top: frameRect.top + selectedTop,
          bottom: frameRect.top + selectedBottom,
          left: frameRect.left + selectedLeft,
          right: frameRect.left + selectedRight,
        },
        visible: {
          top: containerRect.top,
          bottom: Math.min(containerRect.bottom, sheetTop),
          left: containerRect.left,
          right: containerRect.right,
        },
      });
      if (dx === 0 && dy === 0) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      container.scrollBy({ left: dx, top: dy, behavior: reduceMotion ? "auto" : "smooth" });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [isMobileSheetOpen, sheetTop, selectedTop, selectedBottom, selectedLeft, selectedRight, renderedToken]);

  const toolbar = (
    <BelgeStudioPreviewToolbar
      zoomLevel={zoomLevel}
      onZoomChange={handleToolbarZoom}
      onFit={handleFit}
      pdfUrl={generationPending ? null : snapshot?.blobUrl ?? null}
      page={{ current: currentPage, total: pageCount, onChange: handlePageChange }}
      disabled={!snapshot || generationPending || visibleError}
      formView={formView}
      pdfFocus={pdfFocus}
    />
  );

  return (
    <section className={`${BELGE_STUDIO_PREVIEW_PANEL_CLASS} relative`} aria-label="PDF canlı önizlemesi">
      {isMobileMode ? (
        <BelgeStudioMobileZoomPill
          zoomLevel={zoomLevel}
          onZoomChange={handleToolbarZoom}
          onFit={handleFit}
          page={{ current: currentPage, total: pageCount, onChange: handlePageChange }}
          disabled={!snapshot || generationPending || visibleError}
          isInteracting={isInteracting}
        />
      ) : toolbarTarget ? (
        createPortal(toolbar, toolbarTarget)
      ) : toolbarTarget === undefined ? (
        toolbar
      ) : null}
      {editing && !isMobileSheetOpen && (
        <div className="absolute bottom-3 right-3 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={handleToggleInlineEditing}
            data-testid="belge-inline-edit-toggle"
            aria-pressed={isInlineEditingActive}
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold shadow-md backdrop-blur transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer active:scale-95 ${
              isInlineEditingActive
                ? "border-amber-500 bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/40 hover:bg-amber-500/30"
                : "border-border bg-background/95 text-foreground hover:bg-accent/80"
            }`}
          >
            {isInlineEditingActive ? (
              <>
                <Check className="h-4 w-4 text-amber-500" />
                <span>{isMobileMode ? "Düzenlemeyi Bitir" : "PDF Düzenlemeyi Kapat"}</span>
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4 text-amber-500" />
                <span>PDF Üzerinde Düzenle</span>
              </>
            )}
          </button>
        </div>
      )}
      <div
        ref={containerRef}
        tabIndex={0}
        role="region"
        aria-label="PDF sayfası; Ctrl veya Cmd ve fare tekerleğiyle ya da iki parmakla yakınlaştırın"
        title="Ctrl / Cmd + fare tekerleği: PDF yakınlaştırma. Normal kaydırma: sayfa içinde gezinme."
        aria-busy={showLoading}
        data-testid="belge-studio-preview-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
        onLostPointerCapture={finishPointer}
        onKeyDown={handleKeyDown}
        className={`${BELGE_STUDIO_PREVIEW_CANVAS_CLASS} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500`}
        style={{ touchAction: "none" }}
      >
        {snapshot && (
          <div ref={surfaceRef} className="belge-preview-surface">
            <div ref={frameRef} className="belge-preview-frame relative">
              <canvas
                ref={canvasRef}
                className="block rounded-md bg-white shadow-2xl"
                style={{ opacity: 0 }}
                aria-label={`PDF sayfa ${currentPage}`}
              />
              <BelgeStudioFieldFocusLayer
                rect={activeFocusRect}
                visible={isFocusHighlightVisible}
              />
              {shouldRenderOverlayLayer && (
                <BelgeStudioInlineEditLayer
                  documentId={editing?.documentId}
                  fields={inlineFields}
                  visible={isHotspotsInteractive}
                  values={editing?.values}
                  layouts={generationPending ? undefined : snapshot?.layouts}
                  onCommit={editing?.onCommit}
                  frameWidth={renderedSizeRef.current.width || 600}
                  frameHeight={renderedSizeRef.current.height || 842}
                  selectedField={inlineSelectedField}
                  onSelectField={handleLayerSelectField}
                  editorMode={isMobileMode ? "none" : "popover"}
                  touchOptimized={isMobileMode}
                />
              )}
              {showSelectedHighlight && liveSelectedField && (
                <div
                  aria-hidden="true"
                  data-testid="belge-inline-selected-highlight"
                  className="pointer-events-none absolute z-[6] rounded-[3px] bg-amber-400/20 ring-2 ring-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.25)]"
                  style={{
                    left: `${liveSelectedField.viewportRect.left - 2}px`,
                    top: `${liveSelectedField.viewportRect.top - 2}px`,
                    width: `${liveSelectedField.viewportRect.width + 4}px`,
                    height: `${liveSelectedField.viewportRect.height + 4}px`,
                  }}
                />
              )}
            </div>
          </div>
        )}
        {!snapshot && !visibleError && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-sm text-muted-foreground">
            PDF oluşturuluyor.
          </div>
        )}
        {showLoading && (
          <div className="pointer-events-none absolute inset-x-0 top-2 z-10 mx-auto flex w-fit items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-1.5 text-xs text-muted-foreground shadow">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {generationPending ? "Belge güncelleniyor…" : "Önizleme hazırlanıyor…"}
          </div>
        )}
        {visibleError && (
          <div role="alert" className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/95 p-5 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="max-w-sm text-sm text-foreground">{generationError || errorMessage || "PDF önizlemesi oluşturulamadı."}</p>
            <button type="button" onClick={handlePreviewRetry} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-4 text-sm font-semibold text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
              <RefreshCw className="h-4 w-4" />
              Tekrar dene
            </button>
          </div>
        )}
      </div>
      {coach && isMobileMode && isInlineEditingActive && !isMobileSheetOpen && (
        <div
          role="status"
          data-testid="belge-inline-coach"
          className="pointer-events-none absolute inset-x-3 bottom-[4.25rem] z-20 mx-auto w-fit max-w-[calc(100%-1.5rem)] rounded-full border border-amber-500/40 bg-background/95 px-3 py-1.5 text-center text-xs font-medium text-foreground shadow-md backdrop-blur"
        >
          {coach}
        </div>
      )}
      {showEmptyFieldsStatus && (
        <div
          role="status"
          data-testid="belge-inline-empty"
          className="pointer-events-none absolute inset-x-3 bottom-[4.25rem] z-20 mx-auto w-fit max-w-[calc(100%-1.5rem)] rounded-full border border-border bg-background/95 px-3 py-1.5 text-center text-xs font-medium text-muted-foreground shadow-md backdrop-blur"
        >
          Bu sayfada düzenlenebilir alan yok.
        </div>
      )}
      {isMobileSheetOpen && liveSelectedField && editing && (
        <BelgeInlineEditSheet
          documentId={editing.documentId}
          field={liveSelectedField}
          position={{
            index: Math.max(0, selectedNavIndex),
            total: Math.max(1, navFields.length),
            pageNumber: currentPage,
            pageCount,
          }}
          prevTarget={prevTarget}
          nextTarget={nextTarget}
          currentValue={editing.values?.[liveSelectedField.fieldKey] ?? ""}
          layout={generationPending ? undefined : snapshot?.layouts?.[liveSelectedField.fieldKey]}
          attentionToken={sheetAttention}
          onCommit={handleSheetCommit}
          onNavigate={handleSheetNavigate}
          onClose={handleSheetClose}
          onRequestDismiss={requestSheetDismiss}
          onDirtyChange={handleSheetDirtyChange}
          onSheetTopChange={setSheetTop}
        />
      )}
    </section>
  );
}
