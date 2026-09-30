// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF SAYFA GEZİNTİ ÇUBUĞU (VERTICAL MINIMAP / SCRUBBER)
// ============================================================================

"use client";

import React, { useState, useRef, useCallback } from "react";

interface PdfPageScrubberProps {
  numPages: number;
  currentPage: number;
  onPageChange: (pageNum: number) => void;
}

export function PdfPageScrubber({
  numPages,
  currentPage,
  onPageChange,
}: PdfPageScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoverPage, setHoverPage] = useState<number | null>(null);
  const [tooltipY, setTooltipY] = useState(0);

  // 10'dan az sayfa varsa dikey scrubber gösterme
  if (numPages < 10) return null;

  const calculatePageFromClientY = (clientY: number): number => {
    if (!trackRef.current) return currentPage;
    const rect = trackRef.current.getBoundingClientRect();
    const relativeY = Math.min(Math.max(clientY - rect.top, 0), rect.height);
    const fraction = relativeY / rect.height;
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
    setTooltipY(e.clientY);
    onPageChange(page);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const relativeY = Math.min(Math.max(e.clientY - rect.top, 0), rect.height);
    setTooltipY(rect.top + relativeY);

    const page = calculatePageFromClientY(e.clientY);
    setHoverPage(page);

    if (isScrubbing) {
      onPageChange(page);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsScrubbing(false);
    setHoverPage(null);
  };

  // İlerleme yüzdesi (0 - 100)
  const currentFraction = numPages > 1 ? (currentPage - 1) / (numPages - 1) : 0;
  const activePercent = Math.min(Math.max(currentFraction * 100, 0), 100);

  return (
    <div
      className="absolute right-2 top-20 bottom-16 z-20 flex items-center justify-center select-none print:hidden pointer-events-auto"
      onPointerLeave={() => {
        if (!isScrubbing) setHoverPage(null);
      }}
    >
      {/* Tooltip (Fare Gezdirme veya Sürükleme Anında) */}
      {hoverPage !== null && (
        <div
          className="fixed right-10 z-30 -translate-y-1/2 rounded-lg border border-border/80 bg-zinc-900/95 px-2.5 py-1 font-mono text-[11px] font-bold text-zinc-100 shadow-xl backdrop-blur-md transition-transform pointer-events-none"
          style={{ top: `${tooltipY}px` }}
        >
          Sayfa {hoverPage} / {numPages}
        </div>
      )}

      {/* Kaydırma Rayı (Track) */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`group relative h-full w-2.5 sm:w-3 cursor-pointer rounded-full transition-all duration-200 ${
          isScrubbing
            ? "w-4 bg-zinc-800/80 shadow-md ring-1 ring-amber-500/50"
            : "bg-zinc-500/20 hover:w-3.5 hover:bg-zinc-700/40"
        }`}
        title={`Sayfa ${currentPage} / ${numPages}`}
        aria-label="Sayfa hızlı kaydırma çubuğu"
      >
        {/* Dolu İlerleme Hattı */}
        <div
          className="absolute top-0 w-full rounded-full bg-amber-500/30 transition-all"
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
  );
}
