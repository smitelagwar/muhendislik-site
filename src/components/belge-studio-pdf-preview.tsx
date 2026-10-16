"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { PDFJS_CMAPS, PDFJS_FONTS } from "@/lib/pdfjs-paths";
import { loadBrowserPdfJs, type BrowserPdfJs } from "@/lib/pdfjs-client";
import { BelgeStudioPreviewToolbar } from "@/components/belge-studio-preview-toolbar";
import { BELGE_STUDIO_PREVIEW_CANVAS_CLASS, BELGE_STUDIO_PREVIEW_PANEL_CLASS } from "@/lib/belge-studio-layout";
import { clampBelgeZoom, getBelgePreviewRasterScale, getBelgeZoomAnchorScroll } from "@/lib/belge-studio-zoom";
import type { BelgeDocumentSnapshot } from "@/hooks/use-belge-studio-document";

type LoadingTask = ReturnType<BrowserPdfJs["getDocument"]>;
type PdfDocument = Awaited<LoadingTask["promise"]>;
type PdfPage = Awaited<ReturnType<PdfDocument["getPage"]>>;
type PdfRenderTask = ReturnType<PdfPage["render"]>;
export type BelgePreviewStatus = "loading" | "rendering" | "ready" | "error";

type BelgeStudioPdfPreviewProps = {
  snapshot: BelgeDocumentSnapshot | null;
  generationPending: boolean;
  generationError?: string | null;
  onStatusChange: (revision: number, status: BelgePreviewStatus, error?: string) => void;
  onRetry: () => void;
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
}: BelgeStudioPdfPreviewProps) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [localStatus, setLocalStatus] = useState<BelgePreviewStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [gestureEndVersion, setGestureEndVersion] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadingTaskRef = useRef<LoadingTask | null>(null);
  const documentRef = useRef<PdfDocument | null>(null);
  const renderTaskRef = useRef<PdfRenderTask | null>(null);
  const renderRequestRef = useRef(0);
  const zoomRef = useRef(zoomLevel);
  const pageRef = useRef(currentPage);
  const renderedSizeRef = useRef({ width: 0, height: 0, zoom: 100 });
  const pointersRef = useRef<Pointer[]>([]);
  const panStartRef = useRef<{ point: Point; left: number; top: number } | null>(null);
  const pinchStartRef = useRef<{
    distance: number;
    zoom: number;
    relativeX: number;
    relativeY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);
  const pinchingRef = useRef(false);
  const pendingAnchorRef = useRef<{
    relativeX: number;
    relativeY: number;
    pointerX: number;
    pointerY: number;
  } | null>(null);
  const statusHandlerRef = useRef(onStatusChange);
  statusHandlerRef.current = onStatusChange;
  zoomRef.current = zoomLevel;
  pageRef.current = currentPage;

  const report = useCallback((status: BelgePreviewStatus, error?: string) => {
    setLocalStatus(status);
    setErrorMessage(error ?? "");
    if (snapshot) statusHandlerRef.current(snapshot.revision, status, error);
  }, [snapshot]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setLayoutVersion((version) => version + 1));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!snapshot) {
      documentRef.current = null;
      setPageCount(0);
      setCurrentPage(1);
      setLocalStatus("loading");
      return;
    }

    let disposed = false;
    const bytes = snapshot.bytes.slice();
    setPageCount(0);
    setLocalStatus("loading");
    setErrorMessage("");
    statusHandlerRef.current(snapshot.revision, "loading");

    void (async () => {
      try {
        const pdfjs = await loadBrowserPdfJs();
        if (!pdfjs) throw new Error("Yerel PDF görüntüleyicisi yüklenemedi.");
        if (disposed) return;

        const loadingTask = pdfjs.getDocument({
          data: bytes,
          cMapUrl: PDFJS_CMAPS,
          standardFontDataUrl: PDFJS_FONTS,
          cMapPacked: true,
        });
        loadingTaskRef.current = loadingTask;
        const pdf = await loadingTask.promise;
        if (disposed) {
          void loadingTask.destroy();
          return;
        }
        documentRef.current = pdf;
        const nextPage = Math.min(Math.max(1, pageRef.current), pdf.numPages);
        pageRef.current = nextPage;
        setCurrentPage(nextPage);
        setPageCount(pdf.numPages);
      } catch (error) {
        if (disposed) return;
        const message = error instanceof Error ? error.message : "PDF açılamadı.";
        report("error", `PDF önizlemesi yüklenemedi. ${message}`);
        console.error("PDF önizlemesi yüklenemedi:", error);
      }
    })();

    return () => {
      disposed = true;
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
  }, [snapshot, loadAttempt, report]);

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

  const renderPage = useCallback(async () => {
    const pdf = documentRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const frame = frameRef.current;
    if (!pdf || !canvas || !container || !frame) return;
    if (container.clientWidth < 1 || container.clientHeight < 1) return;

    const requestId = ++renderRequestRef.current;
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // Önceki çizim kapanmış olabilir.
      }
      renderTaskRef.current = null;
    }
    report("rendering");

    try {
      const page = await pdf.getPage(pageRef.current);
      if (requestId !== renderRequestRef.current) return;
      const unscaled = page.getViewport({ scale: 1 });
      const availableWidth = Math.max(1, container.clientWidth - 16);
      const availableHeight = Math.max(1, container.clientHeight - 16);
      const fitScale = Math.min(availableWidth / unscaled.width, availableHeight / unscaled.height);
      const effectiveScale = fitScale * (zoomRef.current / 100);
      const viewport = page.getViewport({ scale: effectiveScale });
      const rasterScale = getBelgePreviewRasterScale(
        viewport.width,
        viewport.height,
        window.devicePixelRatio || 1
      );

      canvas.width = Math.max(1, Math.floor(viewport.width * rasterScale));
      canvas.height = Math.max(1, Math.floor(viewport.height * rasterScale));
      canvas.style.width = `${Math.ceil(viewport.width)}px`;
      canvas.style.height = `${Math.ceil(viewport.height)}px`;
      canvas.style.transform = "none";
      frame.style.width = `${Math.ceil(viewport.width)}px`;
      frame.style.height = `${Math.ceil(viewport.height)}px`;
      renderedSizeRef.current = {
        width: Math.ceil(viewport.width),
        height: Math.ceil(viewport.height),
        zoom: zoomRef.current,
      };

      const context = canvas.getContext("2d");
      if (!context) throw new Error("PDF çizim alanı başlatılamadı.");
      context.setTransform(rasterScale, 0, 0, rasterScale, 0, 0);
      const renderTask = page.render({ canvas, canvasContext: context, viewport });
      renderTaskRef.current = renderTask;
      await renderTask.promise;
      if (requestId !== renderRequestRef.current) return;
      renderTaskRef.current = null;
      canvas.style.opacity = "1";

      const anchor = pendingAnchorRef.current;
      if (anchor) {
        requestAnimationFrame(() => {
          if (requestId !== renderRequestRef.current) return;
          applyZoomAnchor();
          pendingAnchorRef.current = null;
        });
      }
      report("ready");
    } catch (error) {
      const cancelled =
        error instanceof Error &&
        (error.name === "RenderingCancelledException" || error.name === "AbortException");
      if (requestId !== renderRequestRef.current || cancelled) return;
      const message = error instanceof Error ? error.message : "PDF sayfası çizilemedi.";
      report("error", `PDF önizlemesi çizilemedi. ${message}`);
      console.error("PDF canvas çizim hatası:", error);
    }
  }, [report, applyZoomAnchor]);

  useEffect(() => {
    if (!documentRef.current || pinchingRef.current) return;
    const timer = window.setTimeout(() => void renderPage(), 140);
    return () => window.clearTimeout(timer);
  }, [renderPage, zoomLevel, currentPage, pageCount, layoutVersion, gestureEndVersion, snapshot?.revision]);

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

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getContainerPoint(event);
    const pointers = [...pointersRef.current.filter((pointer) => pointer.id !== event.pointerId), { id: event.pointerId, point }];
    pointersRef.current = pointers;
    if (pointers.length === 1) {
      panStartRef.current = {
        point,
        left: event.currentTarget.scrollLeft,
        top: event.currentTarget.scrollTop,
      };
      pinchStartRef.current = null;
      pinchingRef.current = false;
      return;
    }

    const [first, second] = pointers;
    const center = midpoint(first.point, second.point);
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const size = renderedSizeRef.current;
    pinchStartRef.current = {
      distance: Math.max(1, distance(first.point, second.point)),
      zoom: zoomRef.current,
      relativeX: canvasRect ? Math.max(0, Math.min(1, (center.x - canvasRect.left) / Math.max(1, canvasRect.width))) : 0.5,
      relativeY: canvasRect ? Math.max(0, Math.min(1, (center.y - canvasRect.top) / Math.max(1, canvasRect.height))) : 0.5,
      startWidth: canvasRect?.width ?? size.width,
      startHeight: canvasRect?.height ?? size.height,
    };
    pinchingRef.current = true;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return;
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
      if (frame && canvas) {
        frame.style.width = `${start.startWidth * ratio}px`;
        frame.style.height = `${start.startHeight * ratio}px`;
        canvas.style.transformOrigin = "top left";
        canvas.style.transform = `scale(${(start.startWidth * ratio) / Math.max(1, renderedSizeRef.current.width)})`;
        pendingAnchorRef.current = {
          relativeX: start.relativeX,
          relativeY: start.relativeY,
          pointerX: center.x,
          pointerY: center.y,
        };
        applyZoomAnchor();
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
    pointersRef.current = pointersRef.current.filter((pointer) => pointer.id !== event.pointerId);
    if (pointersRef.current.length < 2) pinchStartRef.current = null;
    if (pointersRef.current.length === 0) {
      panStartRef.current = null;
      if (pinchingRef.current) {
        pinchingRef.current = false;
        setGestureEndVersion((version) => version + 1);
      }
    } else if (pinchingRef.current) {
      // Kalan parmak yeni bir tek parmak kaydırma başlangıcı olur.
      const remaining = pointersRef.current[0];
      panStartRef.current = {
        point: remaining.point,
        left: event.currentTarget.scrollLeft,
        top: event.currentTarget.scrollTop,
      };
      pinchingRef.current = false;
      setGestureEndVersion((version) => version + 1);
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
    if (localStatus === "error" && snapshot) {
      setLoadAttempt((attempt) => attempt + 1);
      return;
    }
    onRetry();
  };

  const handleFit = () => {
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
    const container = containerRef.current;
    if (container) container.scrollTo({ left: 0, top: 0, behavior: "auto" });
    pendingAnchorRef.current = null;
    setCurrentPage(page);
  };

  const showLoading = generationPending || localStatus === "loading" || localStatus === "rendering";
  const visibleError = localStatus === "error" || generationError !== null;

  return (
    <section className={BELGE_STUDIO_PREVIEW_PANEL_CLASS} aria-label="PDF canlı önizlemesi">
      <BelgeStudioPreviewToolbar
        zoomLevel={zoomLevel}
        onZoomChange={handleToolbarZoom}
        onFit={handleFit}
        pdfUrl={generationPending ? null : snapshot?.blobUrl ?? null}
        page={{ current: currentPage, total: pageCount, onChange: handlePageChange }}
        disabled={!snapshot || generationPending || visibleError}
      />
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
            <div ref={frameRef} className="belge-preview-frame">
              <canvas
                ref={canvasRef}
                className="block rounded-md bg-white shadow-2xl"
                style={{ opacity: 0 }}
                aria-label={`PDF sayfa ${currentPage}`}
              />
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
