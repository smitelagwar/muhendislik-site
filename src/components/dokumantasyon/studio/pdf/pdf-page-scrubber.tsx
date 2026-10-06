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
  onContinuousScrubEnd?: (
    pageNum: number,
    startPosition: { page: number; scrollTop: number }
  ) => void;
  scrollElementRef: RefObject<HTMLDivElement | null>;
  ready: boolean;
}

export function PdfPageScrubber({
  numPages,
  currentPage,
  onPageChange,
  onScrubMove,
  onContinuousScrubEnd,
  scrollElementRef,
  ready,
}: PdfPageScrubberProps) {
  const usesContinuousScroll = numPages < 100;
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const pageControlRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const isScrubbingRef = useRef(false);
  const [hoverPage, setHoverPage] = useState<number | null>(null);
  const lastScrubbedPageRef = useRef<number | null>(null);
  const lastPointerYRef = useRef<number | null>(null);
  const pendingScrollFractionRef = useRef<number | null>(null);
  const continuousScrollFrameRef = useRef<number | null>(null);
  const continuousScrubStartRef = useRef<{ page: number; scrollTop: number }>({
    page: currentPage,
    scrollTop: 0,
  });
  const [isRecentlyActive, setIsRecentlyActive] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPointerOver, setIsPointerOver] = useState(false);
  const [isPageControlHovered, setIsPageControlHovered] = useState(false);
  const [pageJumpOpen, setPageJumpOpen] = useState(false);
  const [pageDraft, setPageDraft] = useState(String(currentPage));
  const activeTimerRef = useRef<number | null>(null);

  const updateContinuousIndicator = (fraction: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const y = `${Math.min(Math.max(fraction, 0), 1) * rail.clientHeight}px`;
    thumbRef.current?.style.setProperty("translate", `0 ${y}`);
    pageControlRef.current?.style.setProperty("translate", `0 ${y}`);
  };

  const getScrollFraction = (scrollElement: HTMLDivElement) => {
    const maxScrollTop = Math.max(scrollElement.scrollHeight - scrollElement.clientHeight, 0);
    return maxScrollTop > 0 ? scrollElement.scrollTop / maxScrollTop : 0;
  };

  const scrollToFraction = (fraction: number) => {
    const scrollElement = scrollElementRef.current;
    const clampedFraction = Math.min(Math.max(fraction, 0), 1);
    if (scrollElement) {
      const maxScrollTop = Math.max(scrollElement.scrollHeight - scrollElement.clientHeight, 0);
      scrollElement.scrollTop = clampedFraction * maxScrollTop;
    }
    updateContinuousIndicator(clampedFraction);
  };

  const flushContinuousScroll = (clientY?: number) => {
    if (clientY !== undefined) {
      pendingScrollFractionRef.current = calculateFractionFromClientY(clientY);
    }
    if (continuousScrollFrameRef.current !== null) {
      window.cancelAnimationFrame(continuousScrollFrameRef.current);
      continuousScrollFrameRef.current = null;
    }
    const fraction = pendingScrollFractionRef.current;
    pendingScrollFractionRef.current = null;
    if (fraction !== null) scrollToFraction(fraction);
  };

  const queueContinuousScroll = (clientY: number) => {
    pendingScrollFractionRef.current = calculateFractionFromClientY(clientY);
    if (continuousScrollFrameRef.current !== null) return;
    continuousScrollFrameRef.current = window.requestAnimationFrame(() => {
      continuousScrollFrameRef.current = null;
      const fraction = pendingScrollFractionRef.current;
      pendingScrollFractionRef.current = null;
      if (fraction !== null) scrollToFraction(fraction);
    });
  };

  const getPageAtViewportCenter = () => {
    const scrollElement = scrollElementRef.current;
    if (!scrollElement) return currentPage;

    const viewport = scrollElement.getBoundingClientRect();
    const centerY = viewport.top + scrollElement.clientHeight / 2;
    const pages = scrollElement.querySelectorAll<HTMLElement>("[data-page-number]");
    let closestPage = currentPage;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const page of pages) {
      const rect = page.getBoundingClientRect();
      if (centerY >= rect.top && centerY <= rect.bottom) {
        return Number(page.dataset.pageNumber) || currentPage;
      }
      const distance = centerY < rect.top ? rect.top - centerY : centerY - rect.bottom;
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPage = Number(page.dataset.pageNumber) || currentPage;
      }
    }

    return closestPage;
  };

  // Kaydırma sırasında tutacağı ve geçerli sayfa rozetini görünür tut.
  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (!usesContinuousScroll) {
      thumbRef.current?.style.removeProperty("translate");
      pageControlRef.current?.style.removeProperty("translate");
    }
    if (!ready || !scrollElement) return;
    if (usesContinuousScroll) updateContinuousIndicator(getScrollFraction(scrollElement));
    const handleScroll = () => {
      setIsRecentlyActive(true);
      if (usesContinuousScroll) updateContinuousIndicator(getScrollFraction(scrollElement));
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
  }, [ready, scrollElementRef, usesContinuousScroll]);

  useEffect(() => {
    return () => {
      if (activeTimerRef.current !== null) {
        window.clearTimeout(activeTimerRef.current);
      }
      if (continuousScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(continuousScrollFrameRef.current);
      }
    };
  }, []);

  // Tek sayfada gezinti gerekmediği için kontrol yalnızca çok sayfalı PDF'lerde görünür.
  if (numPages < 2) return null;

  const calculateFractionFromClientY = (clientY: number): number => {
    if (!railRef.current) return 0;
    const rect = railRef.current.getBoundingClientRect();
    const relativeY = Math.min(Math.max(clientY - rect.top, 0), rect.height);
    return rect.height > 0 ? relativeY / rect.height : 0;
  };

  const calculatePageFromFraction = (fraction: number): number => {
    return Math.min(Math.max(Math.round(fraction * (numPages - 1)) + 1, 1), numPages);
  };

  const calculatePageFromClientY = (clientY: number): number => {
    return calculatePageFromFraction(calculateFractionFromClientY(clientY));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !e.isPrimary) return;
    e.preventDefault();
    e.stopPropagation();
    const scrollElement = scrollElementRef.current;
    continuousScrubStartRef.current = {
      page: currentPage,
      scrollTop: scrollElement?.scrollTop ?? 0,
    };
    isScrubbingRef.current = true;
    setIsScrubbing(true);

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    lastPointerYRef.current = e.clientY;
    if (usesContinuousScroll) flushContinuousScroll(e.clientY);
    const page = calculatePageFromClientY(e.clientY);
    lastScrubbedPageRef.current = page;
    if (!usesContinuousScroll) {
      setHoverPage(page);
      if (onScrubMove) {
        onScrubMove(page);
      } else {
        onPageChange(page);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    if (isScrubbingRef.current && usesContinuousScroll) {
      lastPointerYRef.current = e.clientY;
      queueContinuousScroll(e.clientY);
      return;
    }
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
    lastPointerYRef.current = e.clientY;
    if (usesContinuousScroll) flushContinuousScroll(e.clientY);
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
    if (usesContinuousScroll) {
      onContinuousScrubEnd?.(getPageAtViewportCenter(), continuousScrubStartRef.current);
    } else {
      onPageChange(finalPage);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRef.current) return;
    if (usesContinuousScroll) flushContinuousScroll(lastPointerYRef.current ?? undefined);
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
    if (usesContinuousScroll) {
      onContinuousScrubEnd?.(getPageAtViewportCenter(), continuousScrubStartRef.current);
    } else {
      onPageChange(finalPage);
    }
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
      trackRef.current?.focus();
    } else {
      setPageDraft(String(currentPage));
    }
  };

  // İlerleme yüzdesi (0 - 100)
  const displayPage = usesContinuousScroll ? currentPage : hoverPage ?? currentPage;
  const currentFraction = numPages > 1 ? (displayPage - 1) / (numPages - 1) : 0;
  const activePercent = Math.min(Math.max(currentFraction * 100, 0), 100);
  const tickCount = numPages <= 24 ? numPages : 11;
  const tickPages = Array.from({ length: tickCount }, (_, index) =>
    Math.round((index / (tickCount - 1)) * (numPages - 1)) + 1
  );

  // Görünürlük durumu: etkileşim sırasında belirgin, boşta iken hafifçe görünür.
  const isVisible = isScrubbing || isRecentlyActive || isFocused || isPointerOver || isPageControlHovered || pageJumpOpen;

  return (
    <div
      data-testid="pdf-page-scrubber"
      data-continuous-scroll={usesContinuousScroll}
      data-no-tap
      onPointerEnter={() => setIsPointerOver(true)}
      onPointerLeave={() => {
        setIsPointerOver(false);
        if (!isScrubbingRef.current && !isFocused) setHoverPage(null);
      }}
      className={`group pointer-events-none absolute left-[max(0.375rem,env(safe-area-inset-left))] top-1/2 z-20 flex h-[min(42dvh,22.5rem)] min-h-48 w-12 max-h-[22.5rem] -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700/75 bg-zinc-950/75 shadow-lg shadow-black/20 backdrop-blur-md select-none print:hidden transition-[opacity,background-color] duration-200 hover:bg-zinc-900/90 ${
        isVisible ? "opacity-100" : "opacity-70"
      }`}
    >
      {/* Tam uzunluktaki hit alanı kısa rayı sarar; her tıklama ve sürükleme yine tüm sayfa aralığına eşlenir. */}
      <div
        ref={trackRef}
        data-testid="pdf-scrubber-track"
        data-page-count={numPages}
        data-tick-count={tickCount}
        data-scroll-mode={usesContinuousScroll ? "continuous" : "page"}
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
        className="pointer-events-auto absolute inset-0 z-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        title={pdfViewerStrings.pagePosition(currentPage, numPages)}
      />
      <div
        className="pointer-events-none absolute inset-x-2 top-3 bottom-3 z-10"
        data-testid="pdf-scrubber-rail"
        ref={railRef}
      >
        <div aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 rounded-full bg-zinc-600/75" />
        {tickPages.map((page) => {
          const fraction = (page - 1) / (numPages - 1);
          const isSelected = page === displayPage;
          return (
            <span
              key={page}
              data-testid="pdf-scrubber-tick"
              data-page={page}
              aria-hidden="true"
              className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[width,background-color] duration-100 ${
                isSelected
                  ? "h-0.5 w-3 bg-amber-400 shadow-sm shadow-amber-500/60"
                  : "h-px w-2 bg-zinc-400/80 group-hover:bg-zinc-200"
              }`}
              style={{ top: `${fraction * 100}%` }}
            />
          );
        })}
        <span
          ref={thumbRef}
          data-testid="pdf-scrubber-thumb"
          aria-hidden="true"
          className="absolute left-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-950 bg-amber-400 shadow-[0_0_0_2px_rgba(251,191,36,0.35)]"
          style={{ top: usesContinuousScroll ? "0%" : `${activePercent}%` }}
        />
        {(isVisible || usesContinuousScroll) && (
          <div
            ref={pageControlRef}
            className="pointer-events-auto absolute left-[calc(100%+0.5rem)] z-20 -translate-y-1/2"
            onPointerEnter={() => setIsPageControlHovered(true)}
            onPointerLeave={() => setIsPageControlHovered(false)}
            style={{ top: usesContinuousScroll ? "0%" : `${activePercent}%` }}
          >
            {pageJumpOpen ? (
              <form
                onSubmit={commitPageJump}
                onPointerDown={(event) => event.stopPropagation()}
                className="flex items-center gap-1 rounded-xl border border-zinc-700 bg-zinc-950/95 p-1.5 shadow-xl backdrop-blur-md"
              >
                <input
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  aria-label={pdfViewerStrings.pageJump}
                  value={pageDraft}
                  onChange={(event) => setPageDraft(event.target.value.replace(/\D/g, ""))}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.preventDefault();
                      setPageJumpOpen(false);
                      trackRef.current?.focus();
                    }
                  }}
                  className="h-8 w-12 rounded-lg border border-zinc-700 bg-zinc-900 text-center font-mono text-xs text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                />
                <span className="pr-1 text-[11px] text-zinc-300">/ {numPages}</span>
              </form>
            ) : (
              <button
                type="button"
                data-no-tap
                data-testid="pdf-scrubber-page-button"
                aria-label={pdfViewerStrings.pageJumpAction(displayPage, numPages)}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => {
                  setPageDraft(String(currentPage));
                  setPageJumpOpen(true);
                }}
                className="whitespace-nowrap rounded-full border border-zinc-700/70 bg-zinc-950/75 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-zinc-100/90 shadow-lg backdrop-blur-md hover:border-amber-400/70"
              >
                {pdfViewerStrings.pagePosition(displayPage, numPages)}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
