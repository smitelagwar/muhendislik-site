// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF SAYFA GEZİNTİ ÇUBUĞU (VERTICAL MINIMAP / SCRUBBER)
// FAZ G: Absolute Yerleşim, 24px+ Dokunma Alanı, Safe Area, Render Kuyruk Koruması
// ============================================================================

"use client";

import React, { useState, useRef, useEffect } from "react";

interface PdfPageScrubberProps {
  numPages: number;
  currentPage: number;
  onPageChange: (pageNum: number) => void;
  onScrubMove?: (pageNum: number) => void;
  isScrollingParent?: boolean;
}

export function PdfPageScrubber({
  numPages,
  currentPage,
  onPageChange,
  onScrubMove,
  isScrollingParent = false,
}: PdfPageScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoverPage, setHoverPage] = useState<number | null>(null);
  const [isRecentlyActive, setIsRecentlyActive] = useState(false);
  const activeTimerRef = useRef<number | null>(null);

  // Sayfa kaydırıldığında mobilde scrubber'ı kısa süre görünür kıl
  useEffect(() => {
    if (!isScrollingParent) return;

    const showTimer = window.setTimeout(() => {
      setIsRecentlyActive(true);
    }, 0);

    if (activeTimerRef.current !== null) {
      window.clearTimeout(activeTimerRef.current);
    }
    activeTimerRef.current = window.setTimeout(() => {
      setIsRecentlyActive(false);
      activeTimerRef.current = null;
    }, 1500);

    return () => {
      window.clearTimeout(showTimer);
      if (activeTimerRef.current !== null) {
        window.clearTimeout(activeTimerRef.current);
      }
    };
  }, [isScrollingParent]);

  useEffect(() => {
    return () => {
      if (activeTimerRef.current !== null) {
        window.clearTimeout(activeTimerRef.current);
      }
    };
  }, []);

  // 10'dan az sayfa varsa dikey scrubber gösterme (Plandaki kural)
  if (numPages < 10) return null;

  const calculatePageFromClientY = (clientY: number): number => {
    if (!trackRef.current) return currentPage;
    const rect = trackRef.current.getBoundingClientRect();
    const relativeY = Math.min(Math.max(clientY - rect.top, 0), rect.height);
    const fraction = rect.height > 0 ? relativeY / rect.height : 0;
    return Math.min(Math.max(Math.round(fraction * (numPages - 1)) + 1, 1), numPages);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsScrubbing(true);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const page = calculatePageFromClientY(e.clientY);
    setHoverPage(page);
    if (onScrubMove) {
      onScrubMove(page);
    } else {
      onPageChange(page);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const page = calculatePageFromClientY(e.clientY);
    setHoverPage(page);

    if (isScrubbing) {
      if (onScrubMove) {
        onScrubMove(page);
      } else {
        onPageChange(page);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
    const finalPage = calculatePageFromClientY(e.clientY);
    setIsScrubbing(false);
    setHoverPage(null);
    onPageChange(finalPage);
  };

  // İlerleme yüzdesi (0 - 100)
  const displayPage = hoverPage ?? currentPage;
  const currentFraction = numPages > 1 ? (displayPage - 1) / (numPages - 1) : 0;
  const activePercent = Math.min(Math.max(currentFraction * 100, 0), 100);

  // Görünürlük durumu: Hover esnasında, sürüklemede veya mobilde kaydırma anında belirgin
  const isVisible = isScrubbing || isRecentlyActive;

  return (
    <div
      data-testid="pdf-page-scrubber"
      className={`absolute right-[max(0.375rem,env(safe-area-inset-right))] top-16 bottom-16 z-20 flex items-center justify-center select-none print:hidden pointer-events-auto transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-35 hover:opacity-100"
      }`}
      onPointerLeave={() => {
        if (!isScrubbing) setHoverPage(null);
      }}
    >
      {/* Tooltip (Absolute yerleşim: Viewport'a fixed değil, Scrubber kapsayıcısına göre) */}
      {(hoverPage !== null || isScrubbing) && (
        <div
          data-testid="pdf-scrubber-tooltip"
          className="absolute right-9 z-30 -translate-y-1/2 rounded-lg border border-border/80 bg-zinc-900/95 px-2.5 py-1 font-mono text-[11px] font-bold text-zinc-100 shadow-xl backdrop-blur-md transition-all duration-75 pointer-events-none whitespace-nowrap"
          style={{ top: `${activePercent}%` }}
        >
          Sayfa {displayPage} / {numPages}
        </div>
      )}

      {/* Dokunma Hedefi (Hit Target: >= 24px dokunma genişliği ve touch-action: none) */}
      <div
        ref={trackRef}
        data-testid="pdf-scrubber-track"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: "none" }}
        className="group relative flex h-full w-7 sm:w-8 min-w-[28px] cursor-pointer items-center justify-center py-2"
        title={`Sayfa ${currentPage} / ${numPages}`}
        aria-label="Sayfa hızlı kaydırma çubuğu"
      >
        {/* İnce Görsel Ray (Visual Track) */}
        <div
          className={`relative h-full w-1 sm:w-1.5 rounded-full transition-all duration-200 ${
            isScrubbing
              ? "w-2 bg-zinc-800 shadow-md ring-1 ring-amber-500/50"
              : "bg-zinc-500/25 group-hover:w-1.5 group-hover:bg-zinc-700/50 dark:bg-zinc-600/30"
          }`}
        >
          {/* Dolu İlerleme Hattı */}
          <div
            className="absolute top-0 w-full rounded-full bg-amber-500/40 transition-all"
            style={{ height: `${activePercent}%` }}
          />

          {/* Aktif İmleç (Thumb Indicator) */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-75 ${
              isScrubbing
                ? "h-4 w-4 bg-amber-500 shadow-lg shadow-amber-500/50 scale-110"
                : "h-3 w-3 bg-amber-500/90 shadow-sm group-hover:scale-125"
            }`}
            style={{ top: `${activePercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
