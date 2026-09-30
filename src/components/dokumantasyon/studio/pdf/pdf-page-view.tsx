// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF PAGE VIEW (CANVAS + TEXT LAYER + SEARCH HIGHLIGHT)
// ============================================================================

"use client";

import React, { useState, useEffect, useRef } from "react";
import { normalizeTurkishText } from "@/lib/dokumantasyon/studio/pdf/pdf-search";

interface TextItem {
  str: string;
  dir?: string;
  width: number;
  height: number;
  transform: number[];
  fontName?: string;
  hasEOL?: boolean;
}

interface PdfPageViewProps {
  pdfDoc: any;
  pageNumber: number;
  scale: number;
  rotation: number;
  isHandTool: boolean;
  searchQuery?: string;
  isCurrentMatchPage?: boolean;
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
  onPageVisible,
  renderedScale,
}: PdfPageViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  const [page, setPage] = useState<any>(null);
  const [viewport, setViewport] = useState<any>(null);
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState<boolean>(pageNumber <= 2);

  // 1. IntersectionObserver — Yalnızca Ekrana Yaklaşan Sayfaları Render Et
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsVisible(true);
          onPageVisible?.(pageNumber);
        } else {
          // Çok uzaktaysa belleği korumak için görünürlüğü kapatabilir
        }
      },
      {
        rootMargin: "600px 0px 600px 0px", // 600px öncesinden önceden yükle
        threshold: 0.1,
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

      // Text Layer için metin içeriğini al
      p.getTextContent().then((tc: any) => {
        if (!active) return;
        setTextItems(tc.items || []);
      }).catch(() => {});

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

  // Arama vurgulama metni üretimi
  const renderHighlightedText = (text: string) => {
    if (!searchQuery.trim()) return text;

    const normQuery = normalizeTurkishText(searchQuery);
    const normText = normalizeTurkishText(text);
    const matchIdx = normText.indexOf(normQuery);

    if (matchIdx === -1) return text;

    const before = text.substring(0, matchIdx);
    const match = text.substring(matchIdx, matchIdx + searchQuery.length);
    const after = text.substring(matchIdx + searchQuery.length);

    return (
      <>
        {before}
        <mark className="bg-amber-400/70 text-transparent rounded-xs shadow-xs">
          {match}
        </mark>
        {after}
      </>
    );
  };

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
      {/* 1. Canvas Katmanı (GPU composited CSS transform during zoom, razor sharp when rendered) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block origin-top-left"
        style={{
          width: `${renderedWidth}px`,
          height: `${renderedHeight}px`,
          transform: hasVisualTransform ? `scale(${visualRatio})` : undefined,
          transformOrigin: "0 0",
        }}
      />

      {/* 2. Doğal Metin Katmanı (HTML Text Layer & Arama Vurgusu) */}
      <div
        className={`absolute inset-0 overflow-hidden leading-none select-text origin-top-left ${
          isHandTool ? "pointer-events-none" : "pointer-events-auto"
        }`}
        style={{
          width: `${renderedWidth}px`,
          height: `${renderedHeight}px`,
          transform: hasVisualTransform ? `scale(${visualRatio})` : undefined,
          transformOrigin: "0 0",
        }}
      >
        {textItems.map((item, idx) => {
          if (!viewport || !item.transform) return null;

          // PDF.js koordinat dönüşümü (effectiveRenderedScale'e göre)
          const tx = item.transform;
          const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]) * effectiveRenderedScale;
          const [x, y] = viewport.convertToViewportPoint(tx[4], tx[5]);

          return (
            <span
              key={idx}
              className="absolute whitespace-pre text-transparent origin-top-left cursor-text"
              style={{
                left: `${x}px`,
                top: `${y - fontHeight}px`,
                fontSize: `${fontHeight}px`,
                fontFamily: "sans-serif",
                lineHeight: 1,
              }}
            >
              {renderHighlightedText(item.str)}
            </span>
          );
        })}
      </div>

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
