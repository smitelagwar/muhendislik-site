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
import { computePageGeometry, DEFAULT_PIXEL_BUDGET } from "@/lib/dokumantasyon/studio/pdf/pdf-geometry";
import { MappingRule } from "@/lib/dokumantasyon/studio/pdf/pdf-text-repair";
import { pdfViewerStrings } from "./strings";

const isCoarsePointer = () => typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches;
const getSafePixelBudget = () => (isCoarsePointer() ? 6_000_000 : DEFAULT_PIXEL_BUDGET);

interface PdfPageViewProps {
  pdfDoc: any;
  pageNumber: number;
  scale: number;
  rotation: number;
  isHandTool: boolean;
  searchQuery?: string;
  searchOpts?: SearchOpts;
  repairRules?: MappingRule[];
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

/**
 * PDF koordinat sistemindeki [x1, y1, x2, y2] dikdörtgenini
 * viewport ekran koordinatlarına (left, top, width, height) dönüştürür.
 * Y-ekseni tersliği, sayfa rotasyonu ve viewBox ofsetini tam olarak hesaba katar.
 */
export function convertPdfRectToViewport(
  viewport: any,
  rect: [number, number, number, number] | number[]
): { left: number; top: number; width: number; height: number } {
  if (!viewport || !rect || rect.length < 4) {
    return { left: 0, top: 0, width: 0, height: 0 };
  }

  // 1. pdfjs-dist PageViewport API: convertToViewportPoint (resmi ve rotasyon/offset duyarlı)
  if (typeof viewport.convertToViewportPoint === "function") {
    const p1 = viewport.convertToViewportPoint(rect[0], rect[1]);
    const p2 = viewport.convertToViewportPoint(rect[2], rect[3]);
    const left = Math.min(p1[0], p2[0]);
    const top = Math.min(p1[1], p2[1]);
    const width = Math.abs(p2[0] - p1[0]);
    const height = Math.abs(p2[1] - p1[1]);
    return { left, top, width, height };
  }

  // 2. Eski pdfjs-dist API: convertToViewportRectangle
  if (typeof viewport.convertToViewportRectangle === "function") {
    const vRect = viewport.convertToViewportRectangle(rect);
    const left = Math.min(vRect[0], vRect[2]);
    const top = Math.min(vRect[1], vRect[3]);
    const width = Math.abs(vRect[2] - vRect[0]);
    const height = Math.abs(vRect[3] - vRect[1]);
    return { left, top, width, height };
  }

  // 3. Fallback: Manuel Y-ekseni ters çevirme
  const scale = typeof viewport.scale === "number" ? viewport.scale : 1;
  const vpHeight = typeof viewport.height === "number" ? viewport.height : 842;
  const left = Math.min(rect[0], rect[2]) * scale;
  const bottom = Math.min(rect[1], rect[3]) * scale;
  const width = Math.abs(rect[2] - rect[0]) * scale;
  const height = Math.abs(rect[3] - rect[1]) * scale;
  const top = Math.max(0, vpHeight - bottom - height);
  return { left, top, width, height };
}

export function PdfPageView({
  pdfDoc,
  pageNumber,
  scale,
  rotation,
  isHandTool,
  searchQuery,
  searchOpts,
  repairRules,
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

  // Faz C & Faz R2: Çift Tampon ve Tek Doğruluk Kaynaklı Boyutlar
  const lastRenderedJobKeyRef = useRef<string>("");
  const [renderedDimensions, setRenderedDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isPageRendered, setIsPageRendered] = useState<boolean>(false);
  const effectivePageRendered = isWithinWindow && isPageRendered && renderedDimensions !== null;

  // Katman düşünce canvas belleğini hemen serbest bırak (Safari sızıntısını önler)
  useEffect(() => () => {
    const c = canvasRef.current;
    if (c) {
      c.width = 0;
      c.height = 0;
    }
  }, []);

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
        // Üst bileşen kullanıcı rotasyonunu ayrıca uygular; burada intrinsic ölçüyü bildir.
        const unscaledVp = p.getViewport({ scale: 1, rotation: p.rotate || 0 });
        if (unscaledVp.width && unscaledVp.height) {
          onDimensionsMeasured?.(
            pageNumber,
            Math.floor(unscaledVp.width),
            Math.floor(unscaledVp.height)
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

    // Canvas'ı 0x0 piksele küçült ve Safari belleğini hemen serbest bırak
    const c = canvasRef.current;
    if (c) {
      c.width = 0;
      c.height = 0;
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

    // Canvas dışındaki React durumu da boşalt; mikrogörev, pencereleme efektinde senkron render üretmez.
    if (renderedDimensions !== null) {
      queueMicrotask(() => setRenderedDimensions(null));
    }

    // Sayfa pencere dışına çıkıp canvas temizlendiğinde render durumunu sıfırla
    // Böylece kullanıcı sayfaya geri döndüğünde tekrar eksiksiz çizilir (boş sayfa kalmaz)
    lastRenderedJobKeyRef.current = "";
  }, [isWithinWindow, page, pageNumber, renderedDimensions]);

  // 3. Çift Tamponlu Canvas Render ve Kuyruk Yönetimi (Faz C + Faz R2)
  useEffect(() => {
    if (!page || !viewport || !isWithinWindow) return;

    const visibleCanvas = canvasRef.current;
    if (!visibleCanvas) return;

    const finalRotation = ((page.rotate || 0) + (rotation || 0)) % 360;
    const currentJobKey = `${pageNumber}-${effectiveRenderedScale}-${finalRotation}`;

    // Zaten bu ölçek ve açıda başarıyla render edilmişse gereksiz tekrar çizimi engelle
    if (lastRenderedJobKeyRef.current === currentJobKey && isPageRendered) {
      return;
    }

    const unscaledVp = page.getViewport({ scale: 1, rotation: finalRotation });
    const baseW = unscaledVp.width || initialDimensions?.width || 595.275;
    const baseH = unscaledVp.height || initialDimensions?.height || 841.889;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    // Tek doğruluk kaynağı ile render geometrisi
    const renderGeom = computePageGeometry({
      pageWidthPt: baseW,
      pageHeightPt: baseH,
      scale: effectiveRenderedScale,
      dpr,
      maxPixelBudget: getSafePixelBudget(),
    });

    const renderViewport = page.getViewport({
      scale: effectiveRenderedScale,
      rotation: finalRotation,
    });

    // Çift Tampon: Her render işlemi için izole bir arka plan tampon canvas'ı oluştur
    const bufferCanvas = document.createElement("canvas");
    bufferCanvas.width = renderGeom.bitmapWidth;
    bufferCanvas.height = renderGeom.bitmapHeight;

    const bufferCtx = bufferCanvas.getContext("2d");
    if (!bufferCtx) return;

    const transform = renderGeom.outputScale !== 1
      ? [renderGeom.outputScale, 0, 0, renderGeom.outputScale, 0, 0]
      : undefined;

    const cancelEnqueue = pdfRenderQueue.enqueue(
      `page-${pageNumber}`,
      pageNumber,
      () => {
        return page.render({
          canvasContext: bufferCtx,
          transform,
          viewport: renderViewport,
        });
      },
      () => {
        // Çizim arka tamponda tamamlandı!
        // Şimdi tek bir senkron adımda görünür canvas'a aktar (sıfır beyaz flaş!)
        if (visibleCanvas && bufferCanvas) {
          // ASSUMPTION: Synchronously reset interim CSS transform to prevent double-scaling jump when new render completes
          visibleCanvas.style.transform = "";
          visibleCanvas.width = renderGeom.bitmapWidth;
          visibleCanvas.height = renderGeom.bitmapHeight;
          visibleCanvas.style.width = `${renderGeom.cssWidth}px`;
          visibleCanvas.style.height = `${renderGeom.cssHeight}px`;
          const visibleCtx = visibleCanvas.getContext("2d");
          visibleCtx?.drawImage(bufferCanvas, 0, 0);

          // Arka plan tamponunu boşaltarak belleği koru (Safari bellek serbest bırakma)
          bufferCanvas.width = 0;
          bufferCanvas.height = 0;
        }

        lastRenderedJobKeyRef.current = currentJobKey;
        setRenderedDimensions({ width: renderGeom.cssWidth, height: renderGeom.cssHeight });
        setIsPageRendered(true);
      },
      (err) => {
        console.warn(`Sayfa ${pageNumber} render hatası:`, err);
      }
    );

    return () => {
      cancelEnqueue();
    };
  }, [page, viewport, isWithinWindow, pageNumber, effectiveRenderedScale, rotation]);

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

  // Sayfa Boyutlandırma Geometrisi — Tek Doğruluk Kaynağı (Faz R2)
  const finalRotation = page ? ((page.rotate || 0) + (rotation || 0)) % 360 : (rotation || 0) % 360;
  let baseWidthPt = initialDimensions?.width || 595.275;
  let baseHeightPt = initialDimensions?.height || 841.889;

  if (page) {
    const unscaledVp = page.getViewport({ scale: 1, rotation: finalRotation });
    baseWidthPt = unscaledVp.width;
    baseHeightPt = unscaledVp.height;
  }

  const currentDpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  // Hedef kapsayıcı boyutu (Single source of truth)
  const containerGeom = computePageGeometry({
    pageWidthPt: baseWidthPt,
    pageHeightPt: baseHeightPt,
    scale,
    dpr: currentDpr,
    maxPixelBudget: getSafePixelBudget(),
  });
  const currentWidth = containerGeom.cssWidth;
  const currentHeight = containerGeom.cssHeight;

  // Halihazırda tuvale çizilmiş olan boyutlar
  const renderedWidth = renderedDimensions?.width || currentWidth;
  const renderedHeight = renderedDimensions?.height || currentHeight;

  // Zoom esnasında GPU donanım hızlandırmalı CSS transform ara ölçekleme oranı
  // renderedWidth * visualRatio === currentWidth olmak zorundadır. Çifte ölçekleme ve taşma imkansızdır.
  const visualRatio = renderedWidth > 0 ? currentWidth / renderedWidth : 1;
  const hasVisualTransform = Math.abs(visualRatio - 1) > 0.001;

  return (
    <div
      ref={containerRef}
      id={`pdf-page-${pageNumber}`}
      data-testid={`pdf-page-${pageNumber}`}
      data-page={pageNumber}
      data-page-number={pageNumber}
      data-page-state={effectivePageRendered ? "rendered" : "rendering"}
      data-render-scale={effectiveRenderedScale}
      className={`relative m-0 overflow-hidden transition-shadow ${
        nightMode ? "bg-zinc-950 shadow-black/60 shadow-xl" : "bg-white shadow-xl"
      } rounded-sm ${
        isCurrentMatchPage ? "ring-2 ring-amber-500 shadow-amber-500/20" : ""
      }`}
      style={{
        width: `${currentWidth}px`,
        height: `${currentHeight}px`,
        contain: "layout paint",
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
        repairRules={repairRules}
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
        {effectivePageRendered &&
          viewport &&
          annotations
            .filter((a) => a.subtype === "Link" && a.rect)
            .map((annotation, idx) => {
              let left = 0;
              let top = 0;
              let annotationWidth = 0;
              let annotationHeight = 0;

              try {
                const geom = convertPdfRectToViewport(viewport, annotation.rect);
                left = geom.left;
                top = geom.top;
                annotationWidth = geom.width;
                annotationHeight = geom.height;
              } catch {
                return null;
              }

              if (annotationWidth <= 0 || annotationHeight <= 0) return null;

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
                    aria-label={annotation.title || pdfViewerStrings.pageLink}
                    title={annotation.title || pdfViewerStrings.pageLinkTitle}
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
                  aria-label={annotation.title || pdfViewerStrings.externalLink(rawUrl)}
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
