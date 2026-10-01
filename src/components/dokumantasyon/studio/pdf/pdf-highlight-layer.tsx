// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF HIGHLIGHT OVERLAY LAYER (FAZ E)
// ============================================================================

"use client";

import React, { useEffect, useRef } from "react";
import { SearchMatch, SearchOpts, foldTurkish } from "@/lib/dokumantasyon/studio/pdf/pdf-search-engine";
import { MappingRule, repairExtractedText } from "@/lib/dokumantasyon/studio/pdf/pdf-text-repair";
import { PDF_LAYER_Z_INDEX } from "./pdf-page-view";

export interface HighlightRect {
  key: string;
  leftRatio: number;
  topRatio: number;
  widthRatio: number;
  heightRatio: number;
  isActive: boolean;
  pageNumber: number;
  matchIndexInPage: number;
}

interface PdfHighlightLayerProps {
  pageNumber: number;
  matches?: SearchMatch[];
  activeMatchIndexInPage: number; // -1 ise bu sayfada aktif eşleşme yok
  containerRef: React.RefObject<HTMLDivElement | null>;
  isPageRendered: boolean;
  query?: string;
  searchOpts?: SearchOpts;
  repairRules?: MappingRule[];
  renderedWidth?: number;
  renderedHeight?: number;
  visualRatio?: number;
  hasVisualTransform?: boolean;
}

export function PdfHighlightLayer({
  pageNumber,
  matches,
  activeMatchIndexInPage,
  containerRef,
  isPageRendered,
  query,
  searchOpts,
  repairRules,
  renderedWidth,
  renderedHeight,
  visualRatio,
  hasVisualTransform,
}: PdfHighlightLayerProps) {
  const highlightLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = highlightLayerRef.current;
    if (!layer) return;

    if (!matches || matches.length === 0 || !containerRef.current || !isPageRendered) {
      layer.innerHTML = "";
      return;
    }

    const container = containerRef.current;
    const cRect = container.getBoundingClientRect();
    if (cRect.width <= 0 || cRect.height <= 0) {
      layer.innerHTML = "";
      return;
    }

    // TreeWalker ile TextLayer içindeki tüm saf metin düğümlerini topla
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const textNodes: { node: Text; start: number; end: number }[] = [];
    let layerText = "";

    let currentNode = walker.nextNode();
    while (currentNode) {
      const node = currentNode as Text;
      if (!node.parentElement?.classList.contains("endOfContent")) {
        const val = node.nodeValue || "";
        if (val.length > 0) {
          const start = layerText.length;
          layerText += val;
          const end = layerText.length;
          textNodes.push({ node, start, end });
        }
      }
      currentNode = walker.nextNode();
    }

    if (textNodes.length === 0 || !layerText) {
      layer.innerHTML = "";
      return;
    }

    const computedRects: HighlightRect[] = [];
    const effectiveQuery = (query || "").trim();

    if (effectiveQuery) {
      const effectiveLayerText = repairRules && repairRules.length > 0
        ? repairExtractedText(layerText, repairRules)
        : layerText;

      // 1. Birincil ve en hassas yöntem: Türkçe normalizasyonlu layerText taraması
      const { folded: foldedLayer, toOrig } = foldTurkish(effectiveLayerText, {
        diacritics: searchOpts?.matchDiacritics ?? false,
        caseSensitive: searchOpts?.caseSensitive ?? false,
      });
      const { folded: foldedQuery } = foldTurkish(effectiveQuery, {
        diacritics: searchOpts?.matchDiacritics ?? false,
        caseSensitive: searchOpts?.caseSensitive ?? false,
      });

      if (foldedQuery && foldedLayer) {
        const qLen = foldedQuery.length;
        let matchIdx = 0;
        let startSearch = 0;

        const isWordBoundary = (idx: number, len: number) => {
          if (!searchOpts?.wholeWord) return true;
          const prev = idx > 0 ? foldedLayer[idx - 1] : " ";
          const next = idx + len < foldedLayer.length ? foldedLayer[idx + len] : " ";
          const isWordChar = (c: string) => /[a-z0-9_ğüşıöç]/i.test(c);
          return !isWordChar(prev) && !isWordChar(next);
        };

        while (startSearch < foldedLayer.length) {
          const foundIdx = foldedLayer.indexOf(foldedQuery, startSearch);
          if (foundIdx === -1) break;

          if (isWordBoundary(foundIdx, qLen)) {
            const origStart = toOrig[foundIdx];
            const origEnd = toOrig[foundIdx + qLen - 1] + 1;
            const isActive = matchIdx === activeMatchIndexInPage;

            for (const tn of textNodes) {
              if (tn.end > origStart && tn.start < origEnd) {
                const nodeStart = Math.max(0, origStart - tn.start);
                const nodeEnd = Math.min(tn.node.length, origEnd - tn.start);

                if (nodeEnd > nodeStart) {
                  try {
                    const range = document.createRange();
                    range.setStart(tn.node, nodeStart);
                    range.setEnd(tn.node, nodeEnd);

                    const clientRects = range.getClientRects();
                    for (let rIdx = 0; rIdx < clientRects.length; rIdx++) {
                      const cr = clientRects[rIdx];
                      if (cr.width > 0 && cr.height > 0) {
                        const leftRatio = (cr.left - cRect.left) / cRect.width;
                        const topRatio = (cr.top - cRect.top) / cRect.height;
                        const widthRatio = cr.width / cRect.width;
                        const heightRatio = cr.height / cRect.height;

                        computedRects.push({
                          key: `${pageNumber}-${matchIdx}-${tn.start}-${rIdx}`,
                          leftRatio: Math.max(0, leftRatio),
                          topRatio: Math.max(0, topRatio),
                          widthRatio: Math.min(1, widthRatio),
                          heightRatio: Math.min(1, heightRatio),
                          isActive,
                          pageNumber,
                          matchIndexInPage: matchIdx,
                        });
                      }
                    }
                  } catch {}
                }
              }
            }

            matchIdx++;
          }

          startSearch = foundIdx + qLen;
        }
      }
    }

    // DOM'a doğrudan yansıt (React re-render döngüsünü tetiklemeden sıfır maliyet)
    layer.innerHTML = computedRects
      .map(
        (r) =>
          `<mark data-match-active="${r.isActive ? "true" : "false"}" class="absolute pointer-events-none transition-colors duration-150 rounded-xs ${
            r.isActive ? "pdf-search-mark pdf-search-mark-active z-10" : "pdf-search-mark z-0"
          }" style="left:${(r.leftRatio * 100).toFixed(3)}%;top:${(r.topRatio * 100).toFixed(3)}%;width:${(r.widthRatio * 100).toFixed(3)}%;height:${(r.heightRatio * 100).toFixed(3)}%;"></mark>`
      )
      .join("");
  }, [
    matches,
    activeMatchIndexInPage,
    containerRef,
    isPageRendered,
    pageNumber,
    query,
    searchOpts,
    repairRules,
  ]);

  return (
    <div
      ref={highlightLayerRef}
      className="pdf-highlight-layer absolute inset-0 pointer-events-none overflow-hidden select-none"
      style={{
        zIndex: PDF_LAYER_Z_INDEX.HIGHLIGHT_OVERLAY,
        width: renderedWidth ? `${renderedWidth}px` : undefined,
        height: renderedHeight ? `${renderedHeight}px` : undefined,
        transform: hasVisualTransform && visualRatio ? `scale(${visualRatio})` : undefined,
        transformOrigin: "0 0",
      }}
      aria-hidden="true"
    />
  );
}
