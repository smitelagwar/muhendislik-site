// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF PAGE VIEW (FAZ C: ÇİFT TAMPON, KUYRUK, PENCERELEME)
// ============================================================================

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { normalizeTurkishText } from "@/lib/dokumantasyon/studio/pdf/pdf-search";
import { loadSecurePdfJs } from "@/lib/dokumantasyon/studio/pdf/pdfjs-loader";
import { pdfRenderQueue } from "@/lib/dokumantasyon/studio/pdf/pdf-render-queue";

interface PdfPageViewProps {
  pdfDoc: any;
  pageNumber: number;
  scale: number;
  rotation: number;
  isHandTool: boolean;
  searchQuery?: string;
  isCurrentMatchPage?: boolean;
  activeMatchIndexInPage?: number;
  onPageVisible?: (pageNumber: number) => void;
  renderedScale?: number;
  isWithinWindow?: boolean; // Faz C: [görünür - 5, görünür + 5] penceresi
  initialDimensions?: { width: number; height: number };
  onDimensionsMeasured?: (pageNumber: number, width: number, height: number) => void;
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
  searchQuery = "",
  isCurrentMatchPage = false,
  activeMatchIndexInPage = -1,
  onPageVisible,
  renderedScale,
  isWithinWindow = true,
  initialDimensions,
  onDimensionsMeasured,
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

    setIsPageRendered(false);
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

  // 4. Arama Vurgusu Uygulama Yardımcısı
  const applySearchHighlights = useCallback(() => {
    const container = textLayerContainerRef.current;
    if (!container) return;

    // Önceki tüm mark elemanlarını temizle
    const existingMarks = container.querySelectorAll("mark.pdf-search-mark");
    existingMarks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
        parent.normalize();
      }
    });

    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    const normalizedQuery = normalizeTurkishText(trimmedQuery);
    if (!normalizedQuery) return;

    let matchCounter = 0;
    const spans = container.querySelectorAll("span");

    spans.forEach((span) => {
      const originalText = span.textContent || "";
      if (!originalText) return;

      const normalizedText = normalizeTurkishText(originalText);
      let searchIdx = normalizedText.indexOf(normalizedQuery);

      if (searchIdx === -1) return;

      const fragment = document.createDocumentFragment();
      let lastIdx = 0;

      while (searchIdx !== -1) {
        if (searchIdx > lastIdx) {
          fragment.appendChild(
            document.createTextNode(originalText.slice(lastIdx, searchIdx))
          );
        }

        const mark = document.createElement("mark");
        const isCurrent = isCurrentMatchPage && matchCounter === activeMatchIndexInPage;
        mark.className = isCurrent
          ? "pdf-search-mark pdf-search-mark-active bg-amber-400 text-zinc-950 font-bold rounded-xs px-0.5 ring-2 ring-amber-600 shadow-sm animate-pulse"
          : "pdf-search-mark bg-amber-200/80 text-zinc-900 rounded-xs px-0.5";
        mark.textContent = originalText.slice(
          searchIdx,
          searchIdx + trimmedQuery.length
        );
        fragment.appendChild(mark);

        matchCounter++;
        lastIdx = searchIdx + trimmedQuery.length;
        searchIdx = normalizedText.indexOf(normalizedQuery, lastIdx);
      }

      if (lastIdx < originalText.length) {
        fragment.appendChild(
          document.createTextNode(originalText.slice(lastIdx))
        );
      }

      span.textContent = "";
      span.appendChild(fragment);
    });
  }, [searchQuery, isCurrentMatchPage, activeMatchIndexInPage]);

  // 5. Resmi PDF.js TextLayer Render & Arama Eşlemesi (Faz D)
  useEffect(() => {
    if (!page || !viewport || !textLayerContainerRef.current || !isWithinWindow || !isPageRendered) return;

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
        applySearchHighlights();
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
            applySearchHighlights();
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
  }, [page, viewport, isWithinWindow, isPageRendered, pageNumber, effectiveRenderedScale, applySearchHighlights]);

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

  // Arama sorgusu veya aktif eşleşme değiştiğinde sadece highlight'ları güncelle
  useEffect(() => {
    if (!isWithinWindow || !textLayerContainerRef.current) return;
    applySearchHighlights();
  }, [searchQuery, isCurrentMatchPage, activeMatchIndexInPage, isWithinWindow, applySearchHighlights]);

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
      className={`relative mx-auto my-3 overflow-hidden transition-shadow bg-white shadow-xl rounded-sm ${
        isCurrentMatchPage ? "ring-2 ring-amber-500 shadow-amber-500/20" : ""
      }`}
      style={{
        width: `${currentWidth}px`,
        height: `${currentHeight}px`,
      }}
    >
      {/* 0. Yer Tutucu İskelet (Placeholder) */}
      {!isPageRendered && (
        <div
          data-testid={`pdf-page-placeholder-${pageNumber}`}
          className="absolute inset-0 flex items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
          style={{ zIndex: PDF_LAYER_Z_INDEX.PLACEHOLDER }}
        >
          <span className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-600">
            Sayfa {pageNumber}
          </span>
        </div>
      )}

      {/* 1. Canvas Katmanı (Çift Tamponlu) */}
      <canvas
        ref={canvasRef}
        data-testid={`pdf-page-canvas-${pageNumber}`}
        className={`absolute inset-0 block origin-top-left ${
          isPageRendered ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{
          zIndex: PDF_LAYER_Z_INDEX.CANVAS,
          width: `${renderedWidth}px`,
          height: `${renderedHeight}px`,
          transform: hasVisualTransform ? `scale(${visualRatio})` : undefined,
          transformOrigin: "0 0",
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

      {/* 3. Linkler ve Ek Açıklamalar Katmanı */}
      <div
        className="absolute inset-0 pointer-events-none origin-top-left"
        style={{
          zIndex: PDF_LAYER_Z_INDEX.ANNOTATION_LAYER,
          width: `${renderedWidth}px`,
          height: `${renderedHeight}px`,
          transform: hasVisualTransform ? `scale(${visualRatio})` : undefined,
          transformOrigin: "0 0",
        }}
      >
        {annotations
          .filter((a) => a.subtype === "Link" && a.rect)
          .map((annotation, idx) => {
            const [x1, y1, x2, y2] = annotation.rect;
            const left = Math.min(x1, x2) * effectiveRenderedScale;
            const top = (viewport?.rawDims?.pageHeight ? viewport.rawDims.pageHeight - Math.max(y1, y2) : Math.min(y1, y2)) * effectiveRenderedScale;
            const annotationWidth = Math.abs(x2 - x1) * effectiveRenderedScale;
            const annotationHeight = Math.abs(y2 - y1) * effectiveRenderedScale;

            const href = annotation.url || (annotation.dest ? `#page=${annotation.dest}` : undefined);
            if (!href) return null;

            return (
              <a
                key={idx}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="absolute pointer-events-auto rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                style={{ left, top, width: annotationWidth, height: annotationHeight }}
                aria-label={annotation.title || "PDF bağlantısını aç"}
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
