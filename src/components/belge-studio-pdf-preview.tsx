"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { AlertCircle, Edit3, Loader2, RefreshCw } from "lucide-react";
import { PDFJS_CMAPS, PDFJS_FONTS, PDFJS_ICCS, PDFJS_WASM } from "@/lib/pdfjs-paths";
import { getSharedBrowserPdfWorker, loadBrowserPdfJs, type BrowserPdfJs } from "@/lib/pdfjs-client";
import { BelgeStudioPreviewToolbar } from "@/components/belge-studio-preview-toolbar";
import { BELGE_STUDIO_PREVIEW_CANVAS_CLASS, BELGE_STUDIO_PREVIEW_PANEL_CLASS } from "@/lib/belge-studio-layout";
import { clampBelgeZoom, getBelgePreviewRasterScale, getBelgeZoomAnchorScroll } from "@/lib/belge-studio-zoom";
import {
  mapPdfAnnotationsToInlineFields,
  type BelgeDocumentId,
  type InlineFieldDescriptor,
  type RawPdfAnnotation,
} from "@/lib/belge-studio-inline-field-map";
import { BelgeStudioInlineEditLayer } from "@/components/belge-studio-inline-edit-layer";
import type { BelgeDocumentSnapshot } from "@/hooks/use-belge-studio-document";

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

type BelgeStudioPdfPreviewProps = {
  snapshot: BelgeDocumentSnapshot | null;
  generationPending: boolean;
  generationError?: string | null;
  onStatusChange: (revision: number, status: BelgePreviewStatus, error?: string) => void;
  onRetry: () => void;
  editing?: BelgeStudioInlineEditingConfig;
  activeTabMobile?: "form" | "preview";
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
  const renderedTokenRef = useRef<RenderedToken | null>(null);
  renderedTokenRef.current = renderedToken;
  const lastRenderedContainerSizeRef = useRef({ width: 0, height: 0 });
  zoomRef.current = zoomLevel;
  pageRef.current = currentPage;

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
    const handleResize = () => setLayoutVersion((version) => version + 1);
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
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
    report("rendering");

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
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
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
    report("rendering");
    applyZoomAnchor();
    setZoomLevel(clampedZoom);
  }, [applyZoomAnchor, report]);

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

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch" || !snapshot || !documentRef.current) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('[data-testid="belge-inline-edit-popover"]')) {
      return;
    }
    event.preventDefault();
    setIsInteracting(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getContainerPoint(event);
    const pointers = [...pointersRef.current.filter((pointer) => pointer.id !== event.pointerId), { id: event.pointerId, point }];
    pointersRef.current = pointers;
    if (pointers.length >= 2) {
      everMultitouchRef.current = true;
    }
    if (pointers.length === 1) {
      pendingAnchorRef.current = null;
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

    setInlineSelectedField(null);
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
        report("rendering");
      }
      zoomRef.current = nextZoom;
      setZoomLevel(nextZoom);
      return;
    }

    if (pointers.length === 1 && panStartRef.current && zoomRef.current > 100) {
      event.preventDefault();
      const start = panStartRef.current;
      event.currentTarget.scrollLeft = start.left - (event.clientX - start.point.x);
      event.currentTarget.scrollTop = start.top - (event.clientY - start.point.y);
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
      setIsInteracting(false);
      const wasMultitouch = everMultitouchRef.current;
      everMultitouchRef.current = false;
      if (pinchingRef.current) {
        pinchingRef.current = false;
        setGestureEndVersion((version) => version + 1);
        void renderPage();
      } else if (
        !wasMultitouch &&
        panStart &&
        prevPointers.length === 1 &&
        isInlineEditingActiveRef.current &&
        inlineFields.length > 0
      ) {
        // ASAMA_06: ON modda mobil kısa-tap tespiti:
        // Yalnız 1 temas, hareket eşiği ≤8 CSS px, pinch değilse ve süre < 500ms ise widget hit-test yap
        const dx = endingPoint.x - panStart.point.x;
        const dy = endingPoint.y - panStart.point.y;
        const dist = Math.hypot(dx, dy);
        const elapsed = panStart.startTime ? Date.now() - panStart.startTime : 0;
        if (dist <= 8 && elapsed < 500) {
          const frame = frameRef.current;
          if (frame) {
            const frameRect = frame.getBoundingClientRect();
            const tapX = endingPoint.x - frameRect.left;
            const tapY = endingPoint.y - frameRect.top;
            const tappedField = inlineFields.find(
              (f) =>
                tapX >= f.viewportRect.left &&
                tapX <= f.viewportRect.right &&
                tapY >= f.viewportRect.top &&
                tapY <= f.viewportRect.bottom
            );
            if (tappedField && !tappedField.readOnly) {
              setInlineSelectedField(tappedField);
            }
          }
        }
      }
    } else if (pinchingRef.current) {
      // Kalan parmak yeni bir tek parmak kaydırma başlangıcı olur.
      const remaining = pointersRef.current[0];
      panStartRef.current = {
        point: remaining.point,
        left: event.currentTarget.scrollLeft,
        top: event.currentTarget.scrollTop,
        startTime: Date.now(),
      };
      pinchingRef.current = false;
      setGestureEndVersion((version) => version + 1);
      void renderPage();
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
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
      setLoadAttempt((attempt) => attempt + 1);
    }
  };

  const handleFit = () => {
    setInlineSelectedField(null);
    setRenderedToken(null);
    pendingAnchorRef.current = null;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const frame = frameRef.current;
    const rendered = renderedSizeRef.current;
    if (container) {
      container.scrollTo({ left: 0, top: 0, behavior: "auto" });
    }
    const ratio = 100 / Math.max(1, rendered.zoom);
    if (canvas) canvas.style.transform = `scale(${ratio})`;
    if (frame && rendered.width > 0 && rendered.height > 0) {
      frame.style.width = `${rendered.width * ratio}px`;
      frame.style.height = `${rendered.height * ratio}px`;
    }
    zoomRef.current = 100;
    setZoomLevel(100);
  };

  const handleToolbarZoom = (value: number) => {
    setInlineSelectedField(null);
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

  const handlePageChange = (page: number) => {
    setInlineSelectedField(null);
    setRenderedToken(null);
    setInlineFields([]);
    const container = containerRef.current;
    if (container) container.scrollTo({ left: 0, top: 0, behavior: "auto" });
    pendingAnchorRef.current = null;
    pageRef.current = page;
    setCurrentPage(page);
  };

  const showLoading = generationPending || localStatus === "loading" || localStatus === "rendering";
  const visibleError = localStatus === "error" || generationError !== null;

  const isOverlayTokenValid = Boolean(
    renderedToken &&
      snapshot &&
      renderedToken.revision === snapshot.revision &&
      renderedToken.pageNumber === currentPage &&
      renderedToken.zoom === zoomLevel
  );

  const isHotspotsInteractive = Boolean(
    editing &&
      isInlineEditingActive &&
      !visibleError &&
      !generationPending &&
      localStatus === "ready" &&
      isOverlayTokenValid &&
      inlineFields.length > 0 &&
      !isInteracting &&
      (!canvasRef.current?.style.transform || canvasRef.current.style.transform === "none")
  );

  const shouldRenderOverlayLayer = Boolean(
    editing &&
      isInlineEditingActive &&
      !visibleError &&
      (isHotspotsInteractive || inlineSelectedField !== null)
  );

  return (
    <section className={`${BELGE_STUDIO_PREVIEW_PANEL_CLASS} relative`} aria-label="PDF canlı önizlemesi">
      <BelgeStudioPreviewToolbar
        zoomLevel={zoomLevel}
        onZoomChange={handleToolbarZoom}
        onFit={handleFit}
        pdfUrl={generationPending ? null : snapshot?.blobUrl ?? null}
        page={{ current: currentPage, total: pageCount, onChange: handlePageChange }}
        disabled={!snapshot || generationPending || visibleError}
      />
      {editing && (
        <div className="absolute bottom-3 right-3 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={() =>
              setIsInlineEditingActive((prev) => {
                const next = !prev;
                if (!next) {
                  setInlineSelectedField(null);
                  setRenderedToken(null);
                  setInlineFields([]);
                }
                return next;
              })
            }
            data-testid="belge-inline-edit-toggle"
            aria-pressed={isInlineEditingActive}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold shadow-md backdrop-blur transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer ${
              isInlineEditingActive
                ? "border-amber-500 bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 ring-1 ring-amber-500/40"
                : "border-border bg-background/95 text-foreground hover:bg-accent/80"
            }`}
          >
            <Edit3 className="h-4 w-4 text-amber-500" />
            <span>{isInlineEditingActive ? "PDF Düzenlemeyi Kapat" : "PDF Üzerinde Düzenle"}</span>
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
                  onSelectField={setInlineSelectedField}
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
    </section>
  );
}
