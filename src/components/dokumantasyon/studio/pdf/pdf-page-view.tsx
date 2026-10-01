// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF PAGE VIEW (FAZ C: ÇİFT TAMPON, KUYRUK, PENCERELEME)
// ============================================================================

"use client";

import React, { useState, useEffect, useRef } from "react";
import { SearchMatch, SearchOpts } from "@/lib/dokumantasyon/studio/pdf/pdf-search-engine";
import { loadSecurePdfJs } from "@/lib/dokumantasyon/studio/pdf/pdfjs-loader";
import { pdfRenderQueue } from "@/lib/dokumantasyon/studio/pdf/pdf-render-queue";
import { isSafePdfUrl } from "@/lib/dokumantasyon/studio/pdf/pdf-navigation";
import { PdfHighlightLayer } from "./pdf-highlight-layer";

interface PdfPageViewProps {
  pdfDoc: any;
  pageNumber: number;
  scale: number;
  rotation: number;
  isHandTool: boolean;
  searchQuery?: string;
  searchOpts?: SearchOpts;
  isCurrentMatchPage?: boolean;
  activeMatchIndexInPage?: number;
  onPageVisible?: (pageNumber: number) => void;
  renderedScale?: number;
  isWithinWindow?: boolean; // Faz C: [görünür - 5, görünür + 5] penceresi
  initialDimensions?: { width: number; height: number };
  onDimensionsMeasured?: (pageNumber: number, width: number, height: number) => void;
  searchMatches?: SearchMatch[]; // Faz E
  onNavigateDestination?: (dest: any) => void; // Faz G: PDF içi bağlantılara atlama
  nightMode?: boolean; // Faz H: Gece Modu
}

export const PDF_LAYER_Z_INDEX = {
  PLACEHOLDER: 0,
  CANVAS: 1,
  TEXT_LAYER: 2,
  HIGHLIGHT_OVERLAY: 3,
  ANNOTATION_LAYER: 4,
  BADGE: 5,
} as const;

export function PdfPageView({
  pdfDoc,
  pageNumber,
  scale,
  rotation,
  isHandTool,
  searchQuery,
  searchOpts,
  isCurrentMatchPage = false,
  activeMatchIndexInPage = -1,
  onPageVisible,
  renderedScale,
  isWithinWindow = true,
  initialDimensions,
  onDimensionsMeasured,
  searchMatches,
  onNavigateDestination,
  nightMode = false,
}: PdfPageViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerContainerRef = useRef<HTMLDivElement>(null);
  const textLayerInstanceRef = useRef<any>(null);

  const [page, setPage] = useState<any>(null);
  const [viewport, setViewport] = useState<any>(null);
  const [annotations, setAnnotations] = useState<any[]>([]);

  // Faz C: Çift Tampon (Double Buffering) Durumu
  const [lastRenderedScale, setLastRenderedScale] = useState<number>(renderedScale ?? scale);
  const [isPageRendered, setIsPageRendered] = useState<boolean>(false);
  const effectivePageRendered = isWithinWindow && isPageRendered;

  // IntersectionObserver: Görünür olduğunda ana bileşene bildir
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          onPageVisible?.(pageNumber);
        }
      },
      {
        rootMargin: "0px",
        threshold: 0.2,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNumber, onPageVisible]);

  const effectiveRenderedScale = renderedScale ?? scale;

  // 1. PDF Sayfasını ve İntrinsik Döndürme Dahil Viewport'unu Al (Faz C Düzeltmesi)
  useEffect(() => {
    let active = true;
    if (!pdfDoc) return;

    pdfDoc
      .getPage(pageNumber)
      .then((p: any) => {
        if (!active) return;
        setPage(p);

        // Faz C: Sayfanın kendi intrinsik döndürmesi (p.rotate) ile kullanıcı döndürmesini birleştir
        const finalRotation = ((p.rotate || 0) + (rotation || 0)) % 360;
        const vp = p.getViewport({ scale: effectiveRenderedScale, rotation: finalRotation });
        setViewport(vp);

        // Scroll Anchoring için ölçülen boyutları üst bileşene bildir
        if (vp.width && vp.height) {
          onDimensionsMeasured?.(
            pageNumber,
            Math.floor(vp.width / effectiveRenderedScale),
            Math.floor(vp.height / effectiveRenderedScale)
          );
        }

        p.getAnnotations({ intent: "display" })
          .then((items: any[]) => {
            if (active) setAnnotations(items || []);
          })
          .catch(() => {
            if (active) setAnnotations([]);
          });
      })
      .catch((err: unknown) => {
        console.warn(`Sayfa ${pageNumber} alınamadı:`, err);
      });

    return () => {
      active = false;
    };
  }, [pdfDoc, pageNumber, effectiveRenderedScale, rotation, onDimensionsMeasured]);

  // 2. Pencere Dışı Bellek Boşaltma (Windowing Cleanup) (Faz C)
  useEffect(() => {
    if (isWithinWindow) return;

    // Pencere dışına çıktı: kuyruk görevini iptal et
    pdfRenderQueue.cancel(`page-${pageNumber}`);

    // Canvas'ı 1x1 piksele küçült ve temizle
    const c = canvasRef.current;
    if (c) {
      c.width = 1;
      c.height = 1;
      const ctx = c.getContext("2d");
      ctx?.clearRect(0, 0, 1, 1);
    }

    // TextLayer DOM'unu boşalt
    if (textLayerContainerRef.current) {
      textLayerContainerRef.current.innerHTML = "";
    }
    if (textLayerInstanceRef.current) {
      try {
        textLayerInstanceRef.current.cancel();
      } catch {}
      textLayerInstanceRef.current = null;
    }

    // PDF.js sayfa önbelleğini serbest bırak
    if (page?.cleanup) {
      try {
        page.cleanup();
      } catch {}
    }
  }, [isWithinWindow, page, pageNumber]);

  // 3. Çift Tamponlu Canvas Render ve Kuyruk Yönetimi (Faz C)
  useEffect(() => {
    if (!page || !viewport || !isWithinWindow) return;

    const visibleCanvas = canvasRef.current;
    if (!visibleCanvas) return;

    // Mimari Karar 7: Piksel Bütçesi ve devicePixelRatio tavanı
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
    const MAX_CANVAS_PIXELS = isMobile ? 16_000_000 : 32_000_000;
    const dprCap = isMobile ? Math.min(window.devicePixelRatio || 1, 2) : Math.min(window.devicePixelRatio || 1, 2);

    let outputScale = dprCap;
    const totalPixels = viewport.width * viewport.height * outputScale * outputScale;
    if (totalPixels > MAX_CANVAS_PIXELS) {
      outputScale = Math.sqrt(MAX_CANVAS_PIXELS / (viewport.width * viewport.height));
    }

    const renderWidthPx = Math.max(1, Math.floor(viewport.width * outputScale));
    const renderHeightPx = Math.max(1, Math.floor(viewport.height * outputScale));
    const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

    // Çift Tampon: Her render işlemi için izole bir arka plan tampon canvas'ı oluştur
    // Bu sayede önceki iptal edilen görevlerle canvas çakışması (PDF.js concurrency error) %100 önlenir
    const bufferCanvas = document.createElement("canvas");
    bufferCanvas.width = renderWidthPx;
    bufferCanvas.height = renderHeightPx;

    const bufferCtx = bufferCanvas.getContext("2d");
    if (!bufferCtx) return;

    const cancelEnqueue = pdfRenderQueue.enqueue(
      `page-${pageNumber}`,
      pageNumber,
      () => {
        return page.render({
          canvasContext: bufferCtx,
          transform,
          viewport,
        });
      },
      () => {
        // Çizim arka tamponda tamamlandı!
        // Şimdi tek bir senkron adımda görünür canvas'a aktar (sıfır beyaz flaş!)
        if (visibleCanvas && bufferCanvas) {
          visibleCanvas.width = renderWidthPx;
          visibleCanvas.height = renderHeightPx;
          visibleCanvas.style.width = `${Math.floor(viewport.width)}px`;
          visibleCanvas.style.height = `${Math.floor(viewport.height)}px`;
          const visibleCtx = visibleCanvas.getContext("2d");
          visibleCtx?.drawImage(bufferCanvas, 0, 0);

          // Arka plan tamponunu boşaltarak belleği koru
          bufferCanvas.width = 1;
          bufferCanvas.height = 1;
        }

        setLastRenderedScale(effectiveRenderedScale);
        setIsPageRendered(true);
      },
      (err) => {
        console.warn(`Sayfa ${pageNumber} render hatası:`, err);
      }
    );

    return () => {
      cancelEnqueue();
    };
  }, [page, viewport, isWithinWindow, pageNumber, effectiveRenderedScale]);

  // 5. Resmi PDF.js TextLayer Render (Faz D & E: Saf DOM, TextLayer spanları bozulmaz)
  useEffect(() => {
    if (!page || !viewport || !textLayerContainerRef.current || !isWithinWindow) return;

    let active = true;
    const container = textLayerContainerRef.current;

    // Faz D: Resmi CSS değişkenlerini ata
    container.style.setProperty("--scale-factor", `${effectiveRenderedScale}`);
    container.style.setProperty("--total-scale-factor", `${effectiveRenderedScale}`);
    container.style.setProperty("--scale-round-x", "1px");
    container.style.setProperty("--scale-round-y", "1px");
    container.style.setProperty("--min-font-size", "1");

    // Faz D: Eğer textLayer daha önce render edildiyse, DOM'u silmeden güncelle (update)
    if (textLayerInstanceRef.current?.update) {
      try {
        textLayerInstanceRef.current.update({ viewport });
        return;
      } catch (err) {
        console.warn(`TextLayer update hatası (sayfa ${pageNumber}), yeniden çiziliyor:`, err);
      }
    }

    container.innerHTML = "";

    loadSecurePdfJs().then((pdfjs) => {
      if (!active || !container || !pdfjs) return;

      try {
        const textLayer = new pdfjs.TextLayer({
          textContentSource: page.streamTextContent(),
          container,
          viewport,
        });

        textLayerInstanceRef.current = textLayer;

        textLayer
          .render()
          .then(() => {
            if (!active) return;
            // Faz D: Boşluğa sürüklemede seçimin sayfa sonuna sıçramaması için .endOfContent div'i ekle
            if (!container.querySelector(".endOfContent")) {
              const endDiv = document.createElement("div");
              endDiv.className = "endOfContent";
              container.appendChild(endDiv);
            }
          })
          .catch((err: unknown) => {
            const errName = (err as { name?: string } | null | undefined)?.name;
            if (errName !== "RenderingCancelledException" && errName !== "AbortException") {
              console.warn(`TextLayer sayfa ${pageNumber} hatası:`, err);
            }
          });
      } catch (err) {
        console.warn(`TextLayer başlatılamadı (sayfa ${pageNumber}):`, err);
      }
    });

    return () => {
      active = false;
      if (textLayerInstanceRef.current) {
        try {
          textLayerInstanceRef.current.cancel();
        } catch {}
        textLayerInstanceRef.current = null;
      }
    };
  }, [page, viewport, isWithinWindow, pageNumber, effectiveRenderedScale]);

  // Faz D: Seçim davranışı için .selecting sınıfı yönetimi
  useEffect(() => {
    const container = textLayerContainerRef.current;
    if (!container) return;

    const onPointerDown = () => {
      container.classList.add("selecting");
    };
    const onPointerUp = () => {
      container.classList.remove("selecting");
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  // Sayfa Boyutlandırma Geometrisi
  const baseWidth = viewport
    ? viewport.width / effectiveRenderedScale
    : initialDimensions?.width || 595;
  const baseHeight = viewport
    ? viewport.height / effectiveRenderedScale
    : initialDimensions?.height || 842;

  const currentWidth = Math.floor(baseWidth * scale);
  const currentHeight = Math.floor(baseHeight * scale);

  const renderedWidth = viewport ? Math.floor(viewport.width) : currentWidth;
  const renderedHeight = viewport ? Math.floor(viewport.height) : currentHeight;

  // Zoom esnasında GPU donanım hızlandırmalı CSS transform ara ölçekleme oranı
  const visualRatio = lastRenderedScale > 0 ? scale / lastRenderedScale : 1;
  const hasVisualTransform = Math.abs(visualRatio - 1) > 0.001;

  return (
    <div
      ref={containerRef}
      id={`pdf-page-${pageNumber}`}
      data-page-number={pageNumber}
      className={`relative mx-auto my-3 overflow-hidden transition-shadow ${
        nightMode ? "bg-zinc-950 shadow-black/60 shadow-xl" : "bg-white shadow-xl"
      } rounded-sm ${
        isCurrentMatchPage ? "ring-2 ring-amber-500 shadow-amber-500/20" : ""
      }`}
      style={{
        width: `${currentWidth}px`,
        height: `${currentHeight}px`,
      }}
    >
      {/* 0. Yer Tutucu İskelet (Placeholder) */}
      {!effectivePageRendered && (
        <div
          data-testid={`pdf-page-placeholder-${pageNumber}`}
          className={`absolute inset-0 flex items-center justify-center ${
            nightMode
              ? "bg-zinc-950 border-zinc-800"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
          } border`}
          style={{ zIndex: PDF_LAYER_Z_INDEX.PLACEHOLDER }}
        >
          <span
            className={`text-xs font-mono font-medium ${
              nightMode ? "text-zinc-600" : "text-zinc-400 dark:text-zinc-600"
            }`}
          >
            Sayfa {pageNumber}
          </span>
        </div>
      )}

      {/* 1. Canvas Katmanı (Çift Tamponlu) */}
      <canvas
        ref={canvasRef}
        data-testid={`pdf-page-canvas-${pageNumber}`}
        className={`absolute inset-0 block origin-top-left ${
          effectivePageRendered ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{
          zIndex: PDF_LAYER_Z_INDEX.CANVAS,
          width: `${renderedWidth}px`,
          height: `${renderedHeight}px`,
          transform: hasVisualTransform ? `scale(${visualRatio})` : undefined,
          transformOrigin: "0 0",
          filter: nightMode ? "invert(1) hue-rotate(180deg)" : undefined,
        }}
      />

      {/* 2. Resmi PDF.js Text Layer */}
      <div
        ref={textLayerContainerRef}
        className={`pdf-text-layer textLayer select-text cursor-text origin-top-left ${
          isHandTool ? "pointer-events-none" : "pointer-events-auto"
        }`}
        style={{
          zIndex: PDF_LAYER_Z_INDEX.TEXT_LAYER,
          position: "absolute",
          inset: 0,
          width: `${renderedWidth}px`,
          height: `${renderedHeight}px`,
          transform: hasVisualTransform ? `scale(${visualRatio})` : undefined,
          transformOrigin: "0 0",
        }}
      />

      {/* 2.5. Vurgu Overlay Katmanı (Faz E: TextLayer DOM'unu bozmadan bağımsız render) */}
      <PdfHighlightLayer
        pageNumber={pageNumber}
        matches={searchMatches || []}
        activeMatchIndexInPage={isCurrentMatchPage ? activeMatchIndexInPage : -1}
        containerRef={textLayerContainerRef}
        isPageRendered={effectivePageRendered}
        query={searchQuery}
        searchOpts={searchOpts}
        renderedWidth={renderedWidth}
        renderedHeight={renderedHeight}
        visualRatio={visualRatio}
        hasVisualTransform={hasVisualTransform}
      />

      {/* 3. Linkler ve Ek Açıklamalar Katmanı (Faz G: İç/Dış Bağlantılar) */}
      <div
        data-testid={`pdf-annotation-layer-${pageNumber}`}
        className="absolute inset-0 pointer-events-none origin-top-left"
        style={{
          zIndex: PDF_LAYER_Z_INDEX.ANNOTATION_LAYER,
          width: `${renderedWidth}px`,
          height: `${renderedHeight}px`,
          transform: hasVisualTransform ? `scale(${visualRatio})` : undefined,
          transformOrigin: "0 0",
        }}
      >
        {viewport &&
          annotations
            .filter((a) => a.subtype === "Link" && a.rect)
            .map((annotation, idx) => {
              let left = 0;
              let top = 0;
              let annotationWidth = 0;
              let annotationHeight = 0;

              try {
                if (typeof viewport.convertToViewportRectangle === "function") {
                  const vRect = viewport.convertToViewportRectangle(annotation.rect);
                  left = Math.min(vRect[0], vRect[2]);
                  top = Math.min(vRect[1], vRect[3]);
                  annotationWidth = Math.abs(vRect[2] - vRect[0]);
                  annotationHeight = Math.abs(vRect[3] - vRect[1]);
                } else {
                  const [x1, y1, x2, y2] = annotation.rect;
                  left = Math.min(x1, x2) * effectiveRenderedScale;
                  top = Math.min(y1, y2) * effectiveRenderedScale;
                  annotationWidth = Math.abs(x2 - x1) * effectiveRenderedScale;
                  annotationHeight = Math.abs(y2 - y1) * effectiveRenderedScale;
                }
              } catch {
                return null;
              }

              const isInternal = Boolean(annotation.dest);
              const rawUrl = annotation.url || "";
              const isExternal = Boolean(rawUrl && isSafePdfUrl(rawUrl));

              if (!isInternal && !isExternal) return null;

              if (isInternal) {
                return (
                  <button
                    key={idx}
                    type="button"
                    data-testid={`pdf-link-internal-${pageNumber}-${idx}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onNavigateDestination?.(annotation.dest);
                    }}
                    className="absolute pointer-events-auto rounded-xs outline-none bg-amber-500/10 hover:bg-amber-500/25 focus-visible:ring-2 focus-visible:ring-amber-500 transition-colors cursor-pointer border border-transparent hover:border-amber-500/40"
                    style={{ left, top, width: annotationWidth, height: annotationHeight }}
                    aria-label={annotation.title || "PDF içi bağlantıya git"}
                    title={annotation.title || "Sayfa bağlantısı"}
                  />
                );
              }

              return (
                <a
                  key={idx}
                  href={rawUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`pdf-link-external-${pageNumber}-${idx}`}
                  className="absolute pointer-events-auto rounded-xs outline-none bg-blue-500/10 hover:bg-blue-500/25 focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors cursor-pointer border border-transparent hover:border-blue-500/40"
                  style={{ left, top, width: annotationWidth, height: annotationHeight }}
                  aria-label={annotation.title || `Harici bağlantıyı aç: ${rawUrl}`}
                  title={rawUrl}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                />
              );
            })}
      </div>

      {/* Sayfa Numarası Rozeti */}
      <div
        className="absolute bottom-2 right-2 rounded bg-zinc-900/60 px-1.5 py-0.5 text-[9px] font-mono font-bold text-zinc-300 backdrop-blur-xs pointer-events-none opacity-0 hover:opacity-100 transition-opacity"
        style={{ zIndex: PDF_LAYER_Z_INDEX.BADGE }}
      >
        Sayfa {pageNumber}
      </div>
    </div>
  );
}
