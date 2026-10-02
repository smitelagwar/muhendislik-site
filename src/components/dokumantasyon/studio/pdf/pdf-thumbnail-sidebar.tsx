// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF NAVIGATION SIDEBAR (FAZ G)
// Küçük Resimler (Thumbnails) & İçindekiler / Yer İmleri (Outline Tree)
// ============================================================================

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  FileText,
  ChevronRight,
  ChevronDown,
  X,
  Bookmark,
  LayoutGrid,
} from "lucide-react";
import { OutlineItemNode } from "@/lib/dokumantasyon/studio/pdf/pdf-navigation";
import { pdfViewerStrings } from "./strings";

interface PdfThumbnailSidebarProps {
  pdfDoc: any;
  numPages: number;
  currentPage: number;
  isOpen: boolean;
  activeTab?: "thumbnails" | "outline";
  onTabChange?: (tab: "thumbnails" | "outline") => void;
  outline?: OutlineItemNode[] | null;
  onSelectPage: (pageNum: number) => void;
  onSelectOutlineItem?: (item: OutlineItemNode) => void;
  onClose: () => void;
}

function ThumbnailItem({
  pdfDoc,
  pageNumber,
  isActive,
  onClick,
}: {
  pdfDoc: any;
  pageNumber: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLButtonElement>(null);
  const [rendered, setRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || rendered || !pdfDoc || !canvasRef.current) return;

    let active = true;
    pdfDoc.getPage(pageNumber).then(async (page: any) => {
      if (!active || !canvasRef.current) return;

      const viewport = page.getViewport({ scale: 0.25 });
      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      try {
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (active) setRendered(true);
      } catch {
        // İptal edilen render
      }
    });

    return () => {
      active = false;
    };
  }, [isVisible, rendered, pdfDoc, pageNumber]);

  return (
    <button
      type="button"
      ref={containerRef}
      onClick={onClick}
      data-testid={`pdf-thumbnail-${pageNumber}`}
      aria-label={pdfViewerStrings.pageNumber(pageNumber)}
      aria-current={isActive ? "page" : undefined}
      className={`group flex w-full flex-col items-center gap-1.5 p-2 rounded-xl cursor-pointer transition-all ${
        isActive
          ? "bg-amber-500/15 border-2 border-amber-500 shadow-md shadow-amber-500/10"
          : "border-2 border-transparent hover:bg-muted"
      }`}
    >
      <div className="relative flex min-h-[100px] w-full items-center justify-center overflow-hidden rounded border border-border bg-muted">
        <canvas ref={canvasRef} className="block mx-auto max-w-full" />
        {!rendered && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <FileText className="h-6 w-6 opacity-30" />
          </div>
        )}
      </div>
      <span
        className={`text-[11px] font-mono font-medium ${
          isActive ? "font-bold text-amber-500" : "text-muted-foreground group-hover:text-foreground"
        }`}
      >
        Sayfa {pageNumber}
      </span>
    </button>
  );
}

function OutlineTreeNode({
  item,
  depth = 0,
  onSelect,
}: {
  item: OutlineItemNode;
  depth?: number;
  onSelect: (item: OutlineItemNode) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = Boolean(item.items && item.items.length > 0);

  return (
    <div className="flex flex-col select-none">
      <div
          className="flex min-h-10 items-center gap-1 py-1 px-1.5 rounded-lg hover:bg-secondary/70 transition-colors text-xs text-foreground/90 group"
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            aria-label={isExpanded ? pdfViewerStrings.collapse : pdfViewerStrings.expand}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-background/80 hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        <button
          type="button"
          onClick={() => onSelect(item)}
          data-testid="pdf-outline-item"
          className="flex min-h-9 flex-1 items-center text-left truncate font-medium text-xs hover:text-amber-500 transition-colors py-0.5"
          title={item.title}
        >
          {item.title}
        </button>
      </div>

      {hasChildren && isExpanded && item.items && (
        <div className="flex flex-col">
          {item.items.map((child, idx) => (
            <OutlineTreeNode
              key={idx}
              item={child}
              depth={depth + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PdfThumbnailSidebar({
  pdfDoc,
  numPages,
  currentPage,
  isOpen,
  activeTab = "thumbnails",
  onTabChange,
  outline,
  onSelectPage,
  onSelectOutlineItem,
  onClose,
}: PdfThumbnailSidebarProps) {
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);
  const thumbnailVirtualizer = useVirtualizer({
    count: numPages,
    getScrollElement: () => thumbnailScrollRef.current,
    estimateSize: () => 160,
    overscan: 4,
  });
  const hasOutline = Boolean(outline && outline.length > 0);
  const currentTab = hasOutline ? activeTab : "thumbnails";

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      const trigger = document.querySelector<HTMLElement>('button[data-command-id="pdf.sidebar.toggle"]');
      trigger?.focus();
    }, 0);
  }, [onClose]);

  useEffect(() => {
    if (isOpen && currentTab === "thumbnails" && currentPage > 0) {
      thumbnailVirtualizer.scrollToIndex(currentPage - 1, { align: "auto" });
    }
  }, [currentPage, currentTab, isOpen, thumbnailVirtualizer]);

  // Panel kapalıyken hiçbir iş yapmaz, DOM üretmez (Performans bütçesi kuralı)
  if (!isOpen) return null;

  return (
    <>
    <button
      type="button"
      aria-label={pdfViewerStrings.closeSidebar}
      onClick={handleClose}
      className="fixed inset-0 z-[59] bg-black/45 backdrop-blur-[1px] min-[720px]:hidden"
    />
    <aside
      data-testid="pdf-navigation-sidebar"
      onKeyDownCapture={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          handleClose();
        }
      }}
      className="relative z-20 flex min-h-0 w-56 shrink-0 flex-col overflow-hidden border-r border-border bg-card/95 backdrop-blur-md select-none max-[719px]:fixed max-[719px]:inset-y-0 max-[719px]:left-0 max-[719px]:z-[60] max-[719px]:w-[min(85vw,320px)] max-[719px]:shadow-2xl"
    >
      {/* Üst Başlık & Sekme Seçici */}
      <div className="flex h-12 items-center justify-between border-b border-border px-3 gap-2">
        {hasOutline ? (
          <div className="flex items-center gap-1 rounded-lg bg-secondary/60 p-0.5 border border-border/50 text-[11px] font-semibold">
            <button
              type="button"
              data-testid="pdf-sidebar-tab-thumbnails"
              onClick={() => onTabChange?.("thumbnails")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                currentTab === "thumbnails"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>{pdfViewerStrings.pages}</span>
            </button>
            <button
              type="button"
              data-testid="pdf-sidebar-tab-outline"
              onClick={() => onTabChange?.("outline")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                currentTab === "outline"
                  ? "bg-background text-foreground shadow-xs text-amber-500 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span>{pdfViewerStrings.outline}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-bold text-foreground">{pdfViewerStrings.pageList(numPages)}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0"
          aria-label={pdfViewerStrings.closeSidebar}
          title={pdfViewerStrings.close}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Sekme İçerikleri */}
      <div ref={thumbnailScrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
        {currentTab === "thumbnails" ? (
          <div className="relative w-full" style={{ height: `${thumbnailVirtualizer.getTotalSize()}px` }}>
            {thumbnailVirtualizer.getVirtualItems().map((virtualRow) => {
              const pageNum = virtualRow.index + 1;
              return (
              <div
                key={virtualRow.key}
                ref={thumbnailVirtualizer.measureElement}
                data-index={virtualRow.index}
                className="absolute left-0 top-0 w-full pb-2"
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
              <ThumbnailItem
                pdfDoc={pdfDoc}
                pageNumber={pageNum}
                isActive={pageNum === currentPage}
                onClick={() => onSelectPage(pageNum)}
              />
              </div>
            );})}
          </div>
        ) : (
          <div className="py-1 space-y-0.5" data-testid="pdf-outline-tree">
            {outline && outline.length > 0 ? (
              outline.map((item, idx) => (
                <OutlineTreeNode
                  key={idx}
                  item={item}
                  depth={0}
                  onSelect={(selected) => onSelectOutlineItem?.(selected)}
                />
              ))
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground">
              {pdfViewerStrings.outlineEmpty}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
