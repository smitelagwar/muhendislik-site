"use client";

import React, { useEffect, useRef, useState } from "react";
import { loadSecurePdfJs } from "@/lib/dokumantasyon/studio/pdf/pdfjs-loader";
import { PdfHighlightLayer } from "../pdf-highlight-layer";
import { isSafePdfUrl } from "@/lib/dokumantasyon/studio/pdf/pdf-navigation";
import { convertPdfRectToViewport } from "../pdf-page-view";
import { pdfViewerStrings } from "../strings";
import type { SearchMatch, SearchOpts } from "@/lib/dokumantasyon/studio/pdf/pdf-search-engine";
import type { MappingRule } from "@/lib/dokumantasyon/studio/pdf/pdf-text-repair";

export interface PdfPageOverlaysProps {
  page: any;
  pageNumber: number;
  viewport: any;
  renderScale: number;
  searchMatches?: SearchMatch[];
  searchOpts?: SearchOpts;
  searchQuery?: string;
  isCurrentMatchPage?: boolean;
  activeMatchIndexInPage?: number;
  repairRules?: MappingRule[];
  onNavigateDestination?: (dest: unknown) => void;
  isHandTool?: boolean;
}

export function PdfPageOverlays({
  page,
  pageNumber,
  viewport,
  renderScale,
  searchMatches,
  searchOpts,
  searchQuery = "",
  isCurrentMatchPage = false,
  activeMatchIndexInPage = -1,
  repairRules = [],
  onNavigateDestination,
  isHandTool = false,
}: PdfPageOverlaysProps) {
  const textLayerContainerRef = useRef<HTMLDivElement>(null);
  const textLayerInstanceRef = useRef<any>(null);
  const [annotations, setAnnotations] = useState<any[]>([]);

  // 1. Ek Açıklamalar (Annotation / Linkler)
  useEffect(() => {
    if (!page) return;
    let active = true;

    page
      .getAnnotations({ intent: "display" })
      .then((items: any[]) => {
        if (active) setAnnotations(items || []);
      })
      .catch(() => {
        if (active) setAnnotations([]);
      });

    return () => {
      active = false;
    };
  }, [page]);

  // 2. Resmi TextLayer
  useEffect(() => {
    if (!page || !viewport || !textLayerContainerRef.current) return;

    let active = true;
    const container = textLayerContainerRef.current;

    container.style.setProperty("--scale-factor", `${renderScale}`);
    container.style.setProperty("--total-scale-factor", `${renderScale}`);
    container.style.setProperty("--scale-round-x", "1px");
    container.style.setProperty("--scale-round-y", "1px");
    container.style.setProperty("--min-font-size", "1");

    if (textLayerInstanceRef.current?.update) {
      try {
        textLayerInstanceRef.current.update({ viewport });
        return;
      } catch (err) {
        console.warn(`TextLayer update hatası (sayfa ${pageNumber}):`, err);
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
  }, [page, viewport, pageNumber, renderScale]);

  // 3. Seçim davranışı için .selecting sınıfı
  useEffect(() => {
    const container = textLayerContainerRef.current;
    if (!container) return;

    const onPointerDown = () => container.classList.add("selecting");
    const onPointerUp = () => container.classList.remove("selecting");

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  const renderedWidth = viewport ? viewport.width : 0;
  const renderedHeight = viewport ? viewport.height : 0;

  return (
    <div
      className="overlays pointer-events-none absolute inset-0 origin-top-left"
      data-gen-scale={renderScale}
      style={{
        width: `${renderedWidth}px`,
        height: `${renderedHeight}px`,
      }}
    >
      {/* 2. Resmi PDF.js Text Layer */}
      <div
        ref={textLayerContainerRef}
        className={`pdf-text-layer textLayer select-text cursor-text origin-top-left ${
          isHandTool ? "pointer-events-none" : "pointer-events-auto"
        }`}
        style={{
          zIndex: 4,
          position: "absolute",
          inset: 0,
          width: `${renderedWidth}px`,
          height: `${renderedHeight}px`,
          transformOrigin: "0 0",
        }}
      />

      {/* 2.5. Vurgu Overlay Katmanı */}
      <PdfHighlightLayer
        pageNumber={pageNumber}
        matches={searchMatches || []}
        activeMatchIndexInPage={isCurrentMatchPage ? activeMatchIndexInPage : -1}
        containerRef={textLayerContainerRef}
        isPageRendered={true}
        query={searchQuery}
        searchOpts={searchOpts}
        repairRules={repairRules}
        renderedWidth={renderedWidth}
        renderedHeight={renderedHeight}
        visualRatio={1}
        hasVisualTransform={false}
      />

      {/* 3. Linkler ve Ek Açıklamalar Katmanı */}
      <div
        data-testid={`pdf-annotation-layer-${pageNumber}`}
        className="absolute inset-0 pointer-events-none origin-top-left"
        style={{
          zIndex: 6,
          width: `${renderedWidth}px`,
          height: `${renderedHeight}px`,
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
    </div>
  );
}
