"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, FileText, RefreshCw } from "lucide-react";
import { ShareViewerLoadError, ShareViewerSession } from "@/lib/belge-paylasim/viewer-session";
import { clampShareViewerScale, formatShareViewerExpiry, SHARE_VIEWER_MIN_SCALE, SHARE_VIEWER_MAX_SCALE,
  type ShareViewerFit } from "@/lib/belge-paylasim/viewer-geometry";

interface BelgeShareViewerProps {
  viewToken: string;
  documentTitle?: string;
  initialExpiresAt?: string;
}

const buttonClass = "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background px-2 text-foreground hover:bg-muted disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";

export function BelgeShareViewer({ viewToken, documentTitle = "Paylaşılan PDF Belgesi", initialExpiresAt }: BelgeShareViewerProps) {
  const [retry, setRetry] = useState(0);
  const [renderRetry, setRenderRetry] = useState(0);
  const [loaded, setLoaded] = useState<{ token: string; session: ShareViewerSession } | null>(null);
  const session = loaded?.token === viewToken ? loaded.session : null;
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [zoom, setZoom] = useState<{ fit: ShareViewerFit; scale: number }>({ fit: "width", scale: 1 });
  const [actualScale, setActualScale] = useState(1);
  const [size, setSize] = useState({ width: 0, height: 0, dpr: 1 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<ShareViewerLoadError["status"] | null>(null);
  const [renderResult, setRenderResult] = useState<{ session: ShareViewerSession; page: number; size: typeof size; zoom: typeof zoom; retry: number; failed: boolean } | null>(null);
  const currentRender = renderResult?.session === session && renderResult?.page === page && renderResult?.size === size && renderResult?.zoom === zoom && renderResult?.retry === renderRetry;
  const drawing = !currentRender;
  const renderError = Boolean(currentRender && renderResult?.failed);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const disposalRef = useRef<Promise<void>>(Promise.resolve());
  const actualScaleRef = useRef(1);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ distance: number; scale: number; x: number; y: number } | null>(null);
  const anchor = useRef<{ x: number; y: number; clientX: number; clientY: number } | null>(null);
  const expires = formatShareViewerExpiry(initialExpiresAt);

  useEffect(() => {
    let active = true;
    const next = new ShareViewerSession();
    const priorDisposal = disposalRef.current;
    void (async () => {
      await priorDisposal;
      if (!active) return;
      setLoading(true);
      setLoadError(null);
      setLoaded(null);
      setPage(1);
      setZoom({ fit: "width", scale: 1 });
      const count = await next.open(`/api/belgeler/paylasim/${encodeURIComponent(viewToken)}/pdf`);
      if (!active) return;
      setPageCount(count);
      setLoaded({ token: viewToken, session: next });
      setLoading(false);
    })().catch((error) => {
      if (!active) return;
      disposalRef.current = next.dispose().catch(() => undefined);
      setLoadError(error instanceof ShareViewerLoadError ? error.status : "error");
      setLoading(false);
    });
    return () => {
      active = false;
      disposalRef.current = next.dispose().catch(() => undefined);
    };
  }, [viewToken, retry]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const read = () => setSize((old) => {
      const next = { width: container.clientWidth, height: container.clientHeight, dpr: window.devicePixelRatio || 1 };
      return old.width === next.width && old.height === next.height && old.dpr === next.dpr ? old : next;
    });
    const observer = new ResizeObserver(read);
    observer.observe(container);
    let resolution: MediaQueryList;
    const onResolution = () => {
      resolution?.removeEventListener("change", onResolution);
      read();
      resolution = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      resolution.addEventListener("change", onResolution);
    };
    onResolution();
    window.addEventListener("resize", read);
    return () => { observer.disconnect(); resolution?.removeEventListener("change", onResolution); window.removeEventListener("resize", read); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!session || !canvas || size.width <= 0 || size.height <= 0) return;
    let active = true;
    void session.render(canvas, page, size, zoom.fit, zoom.scale, size.dpr).then((layout) => {
      if (!active || !layout) return;
      actualScaleRef.current = layout.scale;
      setActualScale(layout.scale);
      setRenderResult({ session, page, size, zoom, retry: renderRetry, failed: false });
      const viewport = containerRef.current;
      const point = anchor.current;
      if (viewport && point) {
        const bounds = canvas.getBoundingClientRect();
        const viewBounds = viewport.getBoundingClientRect();
        viewport.scrollLeft += bounds.left + point.x * layout.width - (viewBounds.left + point.clientX);
        viewport.scrollTop += bounds.top + point.y * layout.height - (viewBounds.top + point.clientY);
        anchor.current = null;
      }
    }).catch(() => {
      if (active) setRenderResult({ session, page, size, zoom, retry: renderRetry, failed: true });
    });
    return () => { active = false; session.cancelRender(); };
  }, [session, page, size, zoom, renderRetry]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && ["p", "s"].includes(event.key.toLowerCase())) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("keydown", handleKey, { capture: true });
    return () => window.removeEventListener("keydown", handleKey, { capture: true });
  }, []);

  const changeZoom = useCallback((delta: number) => {
    setZoom((old) => ({ fit: "manual", scale: clampShareViewerScale((old.fit === "manual" ? old.scale : actualScaleRef.current) + delta) }));
  }, []);

  function resetFit(fit: "width" | "page") {
    anchor.current = null;
    setZoom({ fit, scale: actualScaleRef.current });
    containerRef.current?.scrollTo(0, 0);
  }

  function pointerDown(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse" || !session || loadError || renderError || drawing) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.current.values()];
    if (points.length === 2 && canvasRef.current) {
      const bounds = canvasRef.current.getBoundingClientRect();
      const center = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
      gesture.current = { distance: Math.max(1, Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)),
        scale: actualScaleRef.current, x: (center.x - bounds.left) / bounds.width, y: (center.y - bounds.top) / bounds.height };
    }
  }

  function pointerMove(event: React.PointerEvent<HTMLElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.current.values()];
    if (points.length === 2 && gesture.current) {
      const base = gesture.current;
      const rect = event.currentTarget.getBoundingClientRect();
      anchor.current = { x: base.x, y: base.y, clientX: (points[0].x + points[1].x) / 2 - rect.left,
        clientY: (points[0].y + points[1].y) / 2 - rect.top };
      setZoom({ fit: "manual", scale: clampShareViewerScale(base.scale * Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) / base.distance) });
    } else if (points.length === 1) {
      event.currentTarget.scrollLeft -= event.clientX - previous.x;
      event.currentTarget.scrollTop -= event.clientY - previous.y;
    }
  }

  function pointerEnd(event: React.PointerEvent<HTMLElement>) {
    pointers.current.delete(event.pointerId);
    gesture.current = null;
  }

  const titles = { expired: "Bağlantının Süresi Doldu", revoked: "Bağlantı İptal Edildi", not_found: "Belge Bulunamadı", error: "Belge Yüklenemedi" };
  return (
    <div data-testid="share-viewer" className="flex h-dvh w-full min-w-0 flex-col bg-muted text-foreground antialiased">
      <header className="shrink-0 border-b border-border bg-card px-2 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <FileText aria-hidden="true" className="h-5 w-5 shrink-0 text-amber-500" />
          <h1 className="min-w-0 truncate text-sm font-semibold">{documentTitle}</h1>
          <span className="shrink-0 rounded bg-muted px-2 py-1 text-xs">Salt Okunur</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{expires ? <>Son geçerlilik: <time dateTime={initialExpiresAt}>{expires}</time></> : "Son geçerlilik bilgisi alınamadı."}</p>
        <div role="group" aria-label="Belge görüntüleme kontrolleri" className="mt-2 flex flex-wrap items-center gap-1">
          {pageCount > 1 && <>
            <button className={buttonClass} aria-label="Önceki Sayfa" disabled={loading || page <= 1} onClick={() => { anchor.current = null; setPage((n) => n - 1); }}><ChevronLeft aria-hidden="true" className="h-4 w-4" /></button>
            <span data-testid="viewer-page" className="px-1 text-xs" aria-live="polite">{page} / {pageCount}</span>
            <button className={buttonClass} aria-label="Sonraki Sayfa" disabled={loading || page >= pageCount} onClick={() => { anchor.current = null; setPage((n) => n + 1); }}><ChevronRight aria-hidden="true" className="h-4 w-4" /></button>
          </>}
          <button className={buttonClass} aria-label="Uzaklaştır" disabled={!session || actualScale <= SHARE_VIEWER_MIN_SCALE} onClick={() => changeZoom(-0.15)}><ZoomOut aria-hidden="true" className="h-4 w-4" /></button>
          <output data-testid="viewer-zoom" aria-label="Yakınlaştırma oranı" className="min-w-11 text-center text-xs tabular-nums">{Math.round(actualScale * 100)}%</output>
          <button className={buttonClass} aria-label="Yakınlaştır" disabled={!session || actualScale >= SHARE_VIEWER_MAX_SCALE} onClick={() => changeZoom(0.15)}><ZoomIn aria-hidden="true" className="h-4 w-4" /></button>
          <button className={buttonClass + " gap-1 text-xs"} disabled={!session} aria-label="Genişliğe Sığdır" onClick={() => resetFit("width")}><Maximize2 aria-hidden="true" className="h-4 w-4" />Genişlik</button>
          <button className={buttonClass + " text-xs"} disabled={!session} aria-label="Sayfaya Sığdır" onClick={() => resetFit("page")}>Sayfa</button>
        </div>
      </header>
      <p className="sr-only">PDF sayfaları görsel olarak sunulur; belge metni bu görüntüleyicide ekran okuyucuyla okunamaz. Belgenin erişilebilir bir kopyası için oluşturan kişiyle iletişime geçin.</p>
      <main ref={containerRef} data-testid="viewer-viewport" tabIndex={0} aria-label="PDF görüntüleme alanı; dokunarak yakınlaştırıp kaydırabilirsiniz"
        className="relative min-h-0 flex-1 overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500"
        style={{ touchAction: "none", overscrollBehavior: "contain" }}
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd}
        onKeyDown={(event) => {
          if (event.key === "+" || event.key === "=") { event.preventDefault(); changeZoom(0.15); }
          if (event.key === "-") { event.preventDefault(); changeZoom(-0.15); }
          if (event.key === "0") { event.preventDefault(); resetFit("width"); }
        }}>
        {loadError ? <div className="mx-auto max-w-md p-6 text-center" role="alert">
          <h2 className="text-lg font-semibold">{titles[loadError]}</h2>
          <p className="my-3 text-sm">{loadError === "expired" ? "Bağlantının son geçerlilik tarihi geçti. Yeni bağlantı için belgeyi oluşturan kişiyle iletişime geçin."
            : loadError === "revoked" ? "Bu paylaşım bağlantısı oluşturan kişi tarafından iptal edildi."
            : loadError === "not_found" ? "Bu belge bağlantısı geçerli değil veya silinmiş."
            : "Belge açılamadı. Bağlantınızı kontrol edip yeniden deneyin."}</p>
          {loadError === "error" && <button className={buttonClass + " gap-2"} onClick={() => setRetry((n) => n + 1)}><RefreshCw aria-hidden="true" className="h-4 w-4" />Yeniden Dene</button>}
        </div> : <>
          <div data-testid="viewer-canvas-stage" style={{ width: "max-content", minWidth: "100%", minHeight: "100%", boxSizing: "border-box", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: 16 }}>
            <canvas ref={canvasRef} data-testid="viewer-canvas" role="img" aria-label={`${documentTitle}, sayfa ${page}`}
              style={{ display: "block", flexShrink: 0, maxWidth: "none", visibility: loading || drawing || renderError ? "hidden" : "visible" }}
              className="bg-white shadow-xl" />
          </div>
          {(loading || drawing) && !renderError && <div role="status" className="pointer-events-none absolute inset-0 flex items-start justify-center gap-2 p-8 text-sm"><RefreshCw aria-hidden="true" className="h-5 w-5 motion-safe:animate-spin" />Belge yükleniyor…</div>}
          {renderError && <div role="alert" className="absolute inset-x-0 top-0 mx-auto max-w-md bg-card p-6 text-center text-sm">
            <p className="mb-3">Sayfa çizilemedi. Yeniden deneyin.</p>
            <button className={buttonClass} onClick={() => setRenderRetry((n) => n + 1)}>Sayfayı Yeniden Dene</button>
          </div>}
        </>}
      </main>
      <div className="sr-only" aria-live="polite">{!loading && !drawing && !loadError && !renderError ? `Sayfa ${page} / ${pageCount} hazır.` : ""}</div>
    </div>
  );
}
