// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF THUMBNAIL SIDEBAR (VIRTUALIZED / LAZY 100+ PAGES)
// ============================================================================

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, FileText, ChevronRight } from "lucide-react";

interface PdfThumbnailSidebarProps {
  pdfDoc: any;
  numPages: number;
  currentPage: number;
  isOpen: boolean;
  onSelectPage: (pageNum: number) => void;
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

export function PdfThumbnailSidebar({
  pdfDoc,
  numPages,
  currentPage,
  isOpen,
  onSelectPage,
  onClose,
}: PdfThumbnailSidebarProps) {
  if (!isOpen) return null;

  return (
    <aside className="relative z-20 flex min-h-0 w-56 shrink-0 flex-col overflow-hidden border-r border-border bg-card/95 backdrop-blur-md select-none">
      <div className="flex h-11 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-bold text-foreground">Sayfalar ({numPages})</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 space-y-2">
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
    </aside>
  );
}
