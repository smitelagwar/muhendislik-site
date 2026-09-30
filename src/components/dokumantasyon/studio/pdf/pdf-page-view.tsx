// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF PAGE VIEW (CANVAS + TEXT LAYER + SEARCH HIGHLIGHT)
// ============================================================================

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { normalizeTurkishText } from "@/lib/dokumantasyon/studio/pdf/pdf-search";
import { loadSecurePdfJs } from "@/lib/dokumantasyon/studio/pdf/pdfjs-loader";

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
}

const MAX_DEVICE_PIXEL_RATIO = 2.5;
const MAX_CANVAS_PIXELS = 16_000_000;

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
}: PdfPageViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerContainerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const textLayerInstanceRef = useRef<any>(null);

  const [page, setPage] = useState<any>(null);
  const [viewport, setViewport] = useState<any>(null);
  const [annotations, setAnnotations] = useState<any[]>([]);
  // Faz 5: 10 sayfalık hafıza penceresi (off-screen sayfalarda canvas'ı serbest bırak)
  const [isVisible, setIsVisible] = useState<boolean>(pageNumber <= 2);
  const isVisibleRef = useRef<boolean>(pageNumber <= 2);

  // 1. IntersectionObserver — 10 Sayfalık Bellek Penceresi (~5 sayfa yukarı, ~5 sayfa aşağı)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const inView = entry.isIntersecting;
        isVisibleRef.current = inView;
        setIsVisible(inView);

        if (inView) {
          onPageVisible?.(pageNumber);
        } else {
          // Sayfa pencere dışına çıktığında GPU ve canvas belleğini serbest bırak
          if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              canvas.width = 1;
              canvas.height = 1;
            }
          }
          if (textLayerContainerRef.current) {
            textLayerContainerRef.current.innerHTML = "";
          }
        }
      },
      {
        rootMargin: "1500px 0px 1500px 0px", // ~5 sayfa yukarı + ~5 sayfa aşağı = 10 sayfa pencere
        threshold: 0.01,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNumber, onPageVisible]);

  const effectiveRenderedScale = renderedScale ?? scale;

  // 2. PDF Sayfasını ve Temel Viewport'unu Al
  useEffect(() => {
    let active = true;
    if (!pdfDoc) return;

    pdfDoc.getPage(pageNumber).then((p: any) => {
      if (!active) return;
      setPage(p);
      const vp = p.getViewport({ scale: effectiveRenderedScale, rotation });
      setViewport(vp);

      p.getAnnotations({ intent: "display" }).then((items: any[]) => {
        if (active) setAnnotations(items || []);
      }).catch(() => {
        if (active) setAnnotations([]);
      });
    });

    return () => {
      active = false;
    };
  }, [pdfDoc, pageNumber, effectiveRenderedScale, rotation]);

  // 3. Canvas Render
  useEffect(() => {
    if (!page || !viewport || !canvasRef.current || !isVisible) return;

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const requestedDpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
    const requestedPixels = viewport.width * viewport.height * requestedDpr * requestedDpr;
    const dpr = requestedPixels > MAX_CANVAS_PIXELS
      ? requestedDpr * Math.sqrt(MAX_CANVAS_PIXELS / requestedPixels)
      : requestedDpr;
    canvas.width = Math.max(1, Math.floor(viewport.width * dpr));
    canvas.height = Math.max(1, Math.floor(viewport.height * dpr));
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined;

    const renderContext = {
      canvasContext: ctx,
      transform,
      viewport,
    };

    const task = page.render(renderContext);
    renderTaskRef.current = task;

    task.promise
      .then(() => {
        if (renderTaskRef.current === task) renderTaskRef.current = null;
      })
      .catch((err: any) => {
        if (renderTaskRef.current === task) renderTaskRef.current = null;
        if (err?.name !== "RenderingCancelledException") {
          console.warn(`Sayfa ${pageNumber} render hatası:`, err);
        }
      });

    return () => {
      task.cancel();
      if (renderTaskRef.current === task) renderTaskRef.current = null;
    };
  }, [page, viewport, isVisible, pageNumber]);

  // 4. Arama Vurgusu Uygulama Yardımcısı (DOM Text Node Splitting)
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
      let startIdx = 0;
      const matchesInSpan: { start: number; end: number }[] = [];

      while (startIdx < normalizedText.length) {
        const found = normalizedText.indexOf(normalizedQuery, startIdx);
        if (found === -1) break;

        matchesInSpan.push({
          start: found,
          end: found + normalizedQuery.length,
        });
        startIdx = found + normalizedQuery.length;
      }

      if (matchesInSpan.length === 0) return;

      const fragment = document.createDocumentFragment();
      let lastIndex = 0;

      matchesInSpan.forEach((m) => {
        if (m.start > lastIndex) {
          fragment.appendChild(
            document.createTextNode(originalText.substring(lastIndex, m.start))
          );
        }

        // <mark className="pdf-search-mark"> eşleşme vurgusu
        const mark = document.createElement("mark");
        const isCurrent = isCurrentMatchPage && matchCounter === activeMatchIndexInPage;
        mark.className = isCurrent
          ? "pdf-search-mark pdf-search-mark-active"
          : "pdf-search-mark";
        mark.dataset.matchIndex = String(matchCounter);
        mark.textContent = originalText.substring(m.start, m.end);

        fragment.appendChild(mark);

        if (isCurrent) {
          setTimeout(() => {
            mark.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
          }, 30);
        }

        matchCounter++;
        lastIndex = m.end;
      });

      if (lastIndex < originalText.length) {
        fragment.appendChild(
          document.createTextNode(originalText.substring(lastIndex))
        );
      }

      span.textContent = "";
      span.appendChild(fragment);
    });
  }, [searchQuery, isCurrentMatchPage, activeMatchIndexInPage]);

  // 5. Resmi PDF.js TextLayer Render & Arama Eşlemesi
  useEffect(() => {
    if (!page || !viewport || !textLayerContainerRef.current || !isVisible) return;

    let active = true;
    const container = textLayerContainerRef.current;

    async function renderTextLayer() {
      try {
        const pdfjs = await loadSecurePdfJs();
        if (!active || !pdfjs || !textLayerContainerRef.current) return;

        if (textLayerInstanceRef.current) {
          try {
            textLayerInstanceRef.current.cancel();
          } catch {}
          textLayerInstanceRef.current = null;
        }

        container.innerHTML = "";

        const textContent = await page.getTextContent();
        if (!active) return;

        const textLayer = new pdfjs.TextLayer({
          textContentSource: textContent,
          container: container,
          viewport: viewport,
        });

        textLayerInstanceRef.current = textLayer;
        await textLayer.render();

        if (active) {
          applySearchHighlights();
        }
      } catch (err: any) {
        if (err?.name !== "AbortException" && err?.message !== "TextLayer task cancelled.") {
          console.warn(`Sayfa ${pageNumber} text layer hatası:`, err);
        }
      }
    }

    renderTextLayer();

    return () => {
      active = false;
      if (textLayerInstanceRef.current) {
        try {
          textLayerInstanceRef.current.cancel();
        } catch {}
        textLayerInstanceRef.current = null;
      }
    };
  }, [page, viewport, isVisible, pageNumber, applySearchHighlights]);

  // Arama sorgusu veya aktif eşleşme değiştiğinde sadece highlight'ları güncelle
  useEffect(() => {
    if (!isVisible || !textLayerContainerRef.current) return;
    applySearchHighlights();
  }, [searchQuery, isCurrentMatchPage, activeMatchIndexInPage, isVisible, applySearchHighlights]);

  // Temel ölçüler (scale 1.0 için)
  const baseWidth = viewport ? viewport.width / effectiveRenderedScale : 600;
  const baseHeight = viewport ? viewport.height / effectiveRenderedScale : 800;

  // Canlı layout ölçüleri (scroll container geometrisi ve sayfa çerçevesi için)
  const currentWidth = Math.floor(baseWidth * scale);
  const currentHeight = Math.floor(baseHeight * scale);

  // Render edilmiş tuval ölçüleri
  const renderedWidth = viewport ? Math.floor(viewport.width) : currentWidth;
  const renderedHeight = viewport ? Math.floor(viewport.height) : currentHeight;

  // Zoom esnasında GPU donanım hızlandırmalı CSS transform ara ölçekleme oranı
  const visualRatio = renderedWidth > 0 ? currentWidth / renderedWidth : 1;
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
      {/* 1. Canvas Katmanı */}
      <canvas
        ref={canvasRef}
        data-testid={`pdf-page-canvas-${pageNumber}`}
        className="absolute inset-0 block origin-top-left"
        style={{
          width: `${renderedWidth}px`,
          height: `${renderedHeight}px`,
          transform: hasVisualTransform ? `scale(${visualRatio})` : undefined,
          transformOrigin: "0 0",
        }}
      />

      {/* 2. Resmi PDF.js Text Layer (Canvas ile Piksel Piksel Tam Eşleşen Metin Katmanı) */}
      <div
        ref={textLayerContainerRef}
        className={`pdf-text-layer select-text cursor-text origin-top-left ${
          isHandTool ? "pointer-events-none" : "pointer-events-auto"
        }`}
        style={{
          width: `${renderedWidth}px`,
          height: `${renderedHeight}px`,
          transform: hasVisualTransform ? `scale(${visualRatio})` : undefined,
          transformOrigin: "0 0",
        }}
      />

      {/* 3. Linkler Katmanı */}
      <div
        className="absolute inset-0 pointer-events-none origin-top-left"
        style={{
          width: `${renderedWidth}px`,
          height: `${renderedHeight}px`,
          transform: hasVisualTransform ? `scale(${visualRatio})` : undefined,
          transformOrigin: "0 0",
        }}
      >
        {annotations.map((annotation, index) => {
          if (annotation.subtype !== "Link" || !annotation.rect || !viewport) return null;
          const [x1, y1] = viewport.convertToViewportPoint(annotation.rect[0], annotation.rect[1]);
          const [x2, y2] = viewport.convertToViewportPoint(annotation.rect[2], annotation.rect[3]);
          const left = Math.min(x1, x2);
          const top = Math.min(y1, y2);
          const annotationWidth = Math.abs(x2 - x1);
          const annotationHeight = Math.abs(y2 - y1);
          const href = typeof annotation.url === "string" ? annotation.url : null;

          if (!href || annotationWidth < 1 || annotationHeight < 1) return null;

          return (
            <a
              key={`${annotation.id || index}-${href}`}
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="absolute z-10 pointer-events-auto rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              style={{ left, top, width: annotationWidth, height: annotationHeight }}
              aria-label={annotation.title || "PDF bağlantısını aç"}
            />
          );
        })}
      </div>

      {/* Sayfa Numarası Rozeti */}
      <div className="absolute bottom-2 right-2 rounded bg-zinc-900/60 px-1.5 py-0.5 text-[9px] font-mono font-bold text-zinc-300 backdrop-blur-xs pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
        Sayfa {pageNumber}
      </div>
    </div>
  );
}
