// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF SAYFA GEZİNTİ ÇUBUĞU (VERTICAL MINIMAP / SCRUBBER)
// FAZ G: Absolute Yerleşim, 24px+ Dokunma Alanı, Safe Area, Render Kuyruk Koruması
// ============================================================================

"use client";

import React, { useState, useRef, useEffect, type RefObject } from "react";
import { pdfViewerStrings } from "./strings";

interface PdfPageScrubberProps {
  numPages: number;
  currentPage: number;
  onPageChange: (pageNum: number) => void;
  onScrubMove?: (pageNum: number) => void;
  scrollElementRef: RefObject<HTMLDivElement | null>;
  ready: boolean;
}

export function PdfPageScrubber({
  numPages,
  currentPage,
  onPageChange,
  onScrubMove,
  scrollElementRef,
  ready,
}: PdfPageScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const isScrubbingRef = useRef(false);
  const [hoverPage, setHoverPage] = useState<number | null>(null);
  const lastScrubbedPageRef = useRef<number | null>(null);
  const [isRecentlyActive, setIsRecentlyActive] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [pageJumpOpen, setPageJumpOpen] = useState(false);
  const [pageDraft, setPageDraft] = useState(String(currentPage));
  const activeTimerRef = useRef<number | null>(null);

  // Kaydırma sırasında tutacağı ve geçerli sayfa rozetini görünür tut.
  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (!ready || !scrollElement) return;
    const handleScroll = () => {
      setIsRecentlyActive(true);
      if (activeTimerRef.current !== null) window.clearTimeout(activeTimerRef.current);
      activeTimerRef.current = window.setTimeout(() => {
        setIsRecentlyActive(false);
        activeTimerRef.current = null;
      }, 1200);
    };
    scrollElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
      if (activeTimerRef.current !== null) {
        window.clearTimeout(activeTimerRef.current);
        activeTimerRef.current = null;
      }
    };
  }, [ready, scrollElementRef]);

  useEffect(() => {
    return () => {
      if (activeTimerRef.current !== null) {
        window.clearTimeout(activeTimerRef.current);
      }
    };
  }, []);

  // Tek sayfada gezinti gerekmediği için kontrol yalnızca çok sayfalı PDF'lerde görünür.
  if (numPages < 2) return null;

  const calculatePageFromClientY = (clientY: number): number => {
    if (!trackRef.current) return currentPage;
    const rect = trackRef.current.getBoundingClientRect();
    const relativeY = Math.min(Math.max(clientY - rect.top, 0), rect.height);
    const fraction = rect.height > 0 ? relativeY / rect.height : 0;
    return Math.min(Math.max(Math.round(fraction * (numPages - 1)) + 1, 1), numPages);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !e.isPrimary) return;
    e.preventDefault();
    e.stopPropagation();
    isScrubbingRef.current = true;
    setIsScrubbing(true);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    const page = calculatePageFromClientY(e.clientY);
    lastScrubbedPageRef.current = page;
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
    setHoverPage((previous) => previous === page ? previous : page);

    if (isScrubbingRef.current && lastScrubbedPageRef.current !== page) {
      lastScrubbedPageRef.current = page;
      if (onScrubMove) {
        onScrubMove(page);
      } else {
        onPageChange(page);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRef.current) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
    const finalPage = calculatePageFromClientY(e.clientY);
    isScrubbingRef.current = false;
    lastScrubbedPageRef.current = finalPage;
    setIsScrubbing(false);
    setHoverPage(null);
    onPageChange(finalPage);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRef.current) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
    // Pointer iptalinde tarayıcı koordinatı 0,0 gönderebilir. Görüntülenen son sayfayı tamamla.
    const finalPage = lastScrubbedPageRef.current ?? currentPage;
    isScrubbingRef.current = false;
    setIsScrubbing(false);
    setHoverPage(null);
    onPageChange(finalPage);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const page = hoverPage ?? currentPage;
    let targetPage: number | null = null;

    switch (e.key) {
      case "ArrowUp":
        targetPage = page - 1;
        break;
      case "ArrowDown":
        targetPage = page + 1;
        break;
      case "PageUp":
        targetPage = page - 10;
        break;
      case "PageDown":
        targetPage = page + 10;
        break;
      case "Home":
        targetPage = 1;
        break;
      case "End":
        targetPage = numPages;
        break;
      default:
        return;
    }

    e.preventDefault();
    e.stopPropagation();
    const nextPage = Math.min(Math.max(targetPage, 1), numPages);
    setHoverPage(nextPage);
    onPageChange(nextPage);
  };

  const commitPageJump = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requested = Number.parseInt(pageDraft, 10);
    if (Number.isFinite(requested) && requested >= 1 && requested <= numPages) {
      onPageChange(requested);
      setPageJumpOpen(false);
    } else {
      setPageDraft(String(currentPage));
    }
  };

  // İlerleme yüzdesi (0 - 100)
  const displayPage = hoverPage ?? currentPage;
  const currentFraction = numPages > 1 ? (displayPage - 1) / (numPages - 1) : 0;
  const activePercent = Math.min(Math.max(currentFraction * 100, 0), 100);

  // Görünürlük durumu: Hover esnasında, sürüklemede veya mobilde kaydırma anında belirgin
  const isVisible = isScrubbing || isRecentlyActive || isFocused;

  return (
    <div
      data-testid="pdf-page-scrubber"
      data-no-tap
      className={`absolute right-[max(0.375rem,env(safe-area-inset-right))] top-16 bottom-16 z-20 flex items-center justify-center select-none print:hidden pointer-events-auto transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-35 hover:opacity-100"
      }`}
      onPointerLeave={() => {
        if (!isScrubbingRef.current && !isFocused) setHoverPage(null);
      }}
    >
      {/* Tooltip (Absolute yerleşim: Viewport'a fixed değil, Scrubber kapsayıcısına göre) */}
      {(hoverPage !== null || isScrubbing || isFocused) && (
        <div
          data-testid="pdf-scrubber-tooltip"
          className="absolute right-9 z-30 -translate-y-1/2 rounded-lg border border-border/80 bg-zinc-900/95 px-2.5 py-1 font-mono text-[11px] font-bold text-zinc-100 shadow-xl backdrop-blur-md transition-all duration-75 pointer-events-none whitespace-nowrap"
          style={{ top: `${activePercent}%` }}
        >
          {pdfViewerStrings.pagePosition(displayPage, numPages)}
        </div>
      )}

      {(isVisible || pageJumpOpen) && (
        <div className="absolute bottom-0 right-9 z-30 flex flex-col items-end gap-1.5" data-no-tap>
          {pageJumpOpen && (
            <form onSubmit={commitPageJump} className="flex items-center gap-1 rounded-xl border border-border bg-card p-1.5 shadow-xl">
              <input
                autoFocus
                type="text"
                inputMode="numeric"
                aria-label={pdfViewerStrings.pageJump}
                value={pageDraft}
                onChange={(event) => setPageDraft(event.target.value.replace(/\D/g, ""))}
                onKeyDown={(event) => { if (event.key === "Escape") setPageJumpOpen(false); }}
                className="h-9 w-14 rounded-lg border border-input bg-background text-center font-mono text-xs"
              />
              <span className="pr-1 text-[11px] text-muted-foreground">/ {numPages}</span>
            </form>
          )}
          <button
            type="button"
            data-no-tap
            aria-label={pdfViewerStrings.pageJumpAction(displayPage, numPages)}
            onClick={() => {
              setPageDraft(String(currentPage));
              setPageJumpOpen((open) => !open);
            }}
            className="rounded-full border border-border/70 bg-card/95 px-3 py-1.5 font-mono text-[11px] font-semibold text-foreground shadow-lg backdrop-blur"
          >
            {displayPage} / {numPages}
          </button>
        </div>
      )}

      {/* Sayfa başına bir çizgi; geniş hit area çizgiler arasında da en yakın sayfayı seçer. */}
      <div
        ref={trackRef}
        data-testid="pdf-scrubber-track"
        data-page-count={numPages}
        data-scrubbing={isScrubbing}
        data-no-tap
        role="slider"
        tabIndex={0}
        aria-label={pdfViewerStrings.pageScrubber}
        aria-orientation="vertical"
        aria-valuemin={1}
        aria-valuemax={numPages}
        aria-valuenow={displayPage}
        aria-valuetext={pdfViewerStrings.pagePosition(displayPage, numPages)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handlePointerCancel}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          setHoverPage(null);
        }}
        style={{ touchAction: "none" }}
        className="group relative flex h-full w-7 min-w-[28px] cursor-pointer items-center justify-center rounded-sm py-2 outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:w-8"
        title={pdfViewerStrings.pagePosition(currentPage, numPages)}
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {Array.from({ length: numPages }, (_, index) => {
            const page = index + 1;
            const isSelected = page === displayPage;
            const isMajor = page % 10 === 0;
            return (
              <span
                key={page}
                data-testid="pdf-scrubber-tick"
                data-page={page}
                className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[width,background-color] duration-100 ${
                  isSelected
                    ? "h-0.5 w-4 bg-amber-500 shadow-sm shadow-amber-500/60"
                    : isMajor
                      ? "h-px w-3 bg-zinc-400/80 group-hover:bg-zinc-300"
                      : "h-px w-2 bg-zinc-500/60 group-hover:bg-zinc-400/90"
                }`}
                style={{ top: `${(index / (numPages - 1)) * 100}%` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
