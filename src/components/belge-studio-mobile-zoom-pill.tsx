"use client";

import {
  BelgeFitPageIcon,
  BelgeNextPageIcon,
  BelgePrevPageIcon,
  BelgeZoomInIcon,
  BelgeZoomOutIcon,
} from "@/components/belge-studio-icons";
import {
  BELGE_ZOOM_STEP,
  MAX_BELGE_ZOOM,
  MIN_BELGE_ZOOM,
  clampBelgeZoom,
} from "@/lib/belge-studio-zoom";

export interface BelgeStudioMobileZoomPillProps {
  zoomLevel: number;
  onZoomChange: (zoomLevel: number) => void;
  onFit: () => void;
  page?: { current: number; total: number; onChange: (page: number) => void };
  disabled?: boolean;
  isInteracting?: boolean;
}

export function BelgeStudioMobileZoomPill({
  zoomLevel,
  onZoomChange,
  onFit,
  page,
  disabled = false,
  isInteracting = false,
}: BelgeStudioMobileZoomPillProps) {
  const hasPageNavigation = Boolean(page && page.total > 1);
  const displayedZoom = Math.round(zoomLevel);

  return (
    <div
      role="toolbar"
      aria-label="Mobil PDF yakınlaştırma ve sayfa kontrolleri"
      data-testid="belge-studio-mobile-zoom-pill"
      data-multipage={hasPageNavigation}
      className={`absolute top-2 right-2 z-20 flex flex-nowrap items-center gap-0.5 rounded-full border border-border/80 bg-background/95 px-1 py-0.5 shadow-md max-h-[38px] transition-opacity duration-150 select-none ${
        isInteracting ? "opacity-35" : "opacity-90 hover:opacity-100"
      }`}
    >
      {/* Çok sayfalı belge ise sayfa gezgini (‹ 1/2 ›) */}
      {hasPageNavigation && page && (
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => page.onChange(Math.max(1, page.current - 1))}
            disabled={disabled || page.current <= 1}
            aria-label="Önceki sayfa"
            title="Önceki sayfa"
            className="relative flex h-7 w-7 items-center justify-center rounded-full text-foreground/80 hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40 cursor-pointer before:absolute before:-inset-2 before:content-['']"
          >
            <BelgePrevPageIcon className="h-3.5 w-3.5 shrink-0" />
          </button>
          <span
            aria-live="polite"
            aria-atomic="true"
            className="min-w-[24px] text-center font-mono text-[11px] font-semibold text-foreground whitespace-nowrap px-0.5 select-none"
          >
            {page.current} / {page.total}
          </span>
          <button
            type="button"
            onClick={() => page.onChange(Math.min(page.total, page.current + 1))}
            disabled={disabled || page.current >= page.total}
            aria-label="Sonraki sayfa"
            title="Sonraki sayfa"
            className="relative flex h-7 w-7 items-center justify-center rounded-full text-foreground/80 hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40 cursor-pointer before:absolute before:-inset-2 before:content-['']"
          >
            <BelgeNextPageIcon className="h-3.5 w-3.5 shrink-0" />
          </button>
          <span className="mx-0.5 h-3.5 w-px bg-border/80 shrink-0" aria-hidden="true" />
        </div>
      )}

      {/* Yakınlaştırma kontrolleri [− %100 + ⤢] */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={() => onZoomChange(clampBelgeZoom(zoomLevel - BELGE_ZOOM_STEP))}
          disabled={disabled || zoomLevel <= MIN_BELGE_ZOOM}
          aria-label="Uzaklaştır"
          title="Uzaklaştır"
          className="relative flex h-7 w-7 items-center justify-center rounded-full text-foreground/80 hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40 cursor-pointer before:absolute before:-inset-2 before:content-['']"
        >
          <BelgeZoomOutIcon className="h-3.5 w-3.5 shrink-0" />
        </button>

        <span
          data-testid="belge-studio-zoom-level"
          aria-label={`Yakınlaştırma yüzde ${displayedZoom}`}
          className="min-w-[32px] px-0.5 text-center font-mono text-[11px] font-bold tabular-nums text-foreground select-none"
        >
          %{displayedZoom}
        </span>

        <button
          type="button"
          onClick={() => onZoomChange(clampBelgeZoom(zoomLevel + BELGE_ZOOM_STEP))}
          disabled={disabled || zoomLevel >= MAX_BELGE_ZOOM}
          aria-label="Yakınlaştır"
          title="Yakınlaştır"
          className="relative flex h-7 w-7 items-center justify-center rounded-full text-foreground/80 hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40 cursor-pointer before:absolute before:-inset-2 before:content-['']"
        >
          <BelgeZoomInIcon className="h-3.5 w-3.5 shrink-0" />
        </button>

        <button
          type="button"
          onClick={onFit}
          disabled={disabled}
          aria-label="Sayfayı Sığdır"
          title="Sayfayı Sığdır (%100)"
          className="relative flex h-7 w-7 items-center justify-center rounded-full text-foreground/80 hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40 cursor-pointer before:absolute before:-inset-2 before:content-['']"
        >
          <BelgeFitPageIcon className="h-3.5 w-3.5 shrink-0" />
        </button>
      </div>
    </div>
  );
}
