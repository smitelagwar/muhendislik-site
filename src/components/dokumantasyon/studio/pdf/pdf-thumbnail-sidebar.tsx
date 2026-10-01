// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF NAVIGATION SIDEBAR (FAZ G)
// Küçük Resimler (Thumbnails) & İçindekiler / Yer İmleri (Outline Tree)
// ============================================================================

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  ChevronRight,
  ChevronDown,
  X,
  Bookmark,
  LayoutGrid,
} from "lucide-react";
import { OutlineItemNode } from "@/lib/dokumantasyon/studio/pdf/pdf-navigation";

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
  const containerRef = useRef<HTMLDivElement>(null);
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
    <div
      ref={containerRef}
      onClick={onClick}
      data-testid={`pdf-thumbnail-${pageNumber}`}
      className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl cursor-pointer transition-all ${
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
    </div>
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
        className="flex items-center gap-1 py-1 px-1.5 rounded-lg hover:bg-secondary/70 transition-colors text-xs text-foreground/90 group"
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            aria-label={isExpanded ? "Daralt" : "Genişlet"}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-background/80 hover:text-foreground transition-colors"
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
          className="flex-1 text-left truncate font-medium text-xs hover:text-amber-500 transition-colors py-0.5"
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
  // Panel kapalıyken hiçbir iş yapmaz, DOM üretmez (Performans bütçesi kuralı)
  if (!isOpen) return null;

  const hasOutline = Boolean(outline && outline.length > 0);
  const currentTab = hasOutline ? activeTab : "thumbnails";

  return (
    <aside
      data-testid="pdf-navigation-sidebar"
      className="relative z-20 flex min-h-0 w-64 shrink-0 flex-col overflow-hidden border-r border-border bg-card/95 backdrop-blur-md select-none"
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
              <span>Sayfalar</span>
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
              <span>İçindekiler</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-bold text-foreground">Sayfalar ({numPages})</span>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0"
          aria-label="Kenar çubuğunu kapat"
          title="Kapat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Sekme İçerikleri */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
        {currentTab === "thumbnails" ? (
          <div className="space-y-2">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
              <ThumbnailItem
                key={pageNum}
                pdfDoc={pdfDoc}
                pageNumber={pageNum}
                isActive={pageNum === currentPage}
                onClick={() => onSelectPage(pageNum)}
              />
            ))}
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
                Bu dokümanda içindekiler bulunmuyor.
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
