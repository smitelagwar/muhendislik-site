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
      data-testid="belge-studio-preview-toolbar"
      data-multipage={hasPageNavigation}
      className={`absolute top-2 right-2 z-20 flex flex-wrap items-center gap-1 rounded-full border border-border/80 bg-background/90 px-1.5 py-1 shadow-md backdrop-blur-md transition-opacity duration-150 select-none ${
        isInteracting ? "opacity-40 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Çok sayfalı belge ise sayfa gezgini (‹ 1/2 ›) */}
      {hasPageNavigation && page && (
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => page.onChange(Math.max(1, page.current - 1))}
            disabled={disabled || page.current <= 1}
            aria-label="Önceki sayfa"
            title="Önceki sayfa"
            className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/80 hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
          >
            <BelgePrevPageIcon className="h-3.5 w-3.5" />
          </button>
          <span
            aria-live="polite"
            aria-atomic="true"
            className="min-w-[28px] text-center font-mono text-[11px] font-semibold text-foreground whitespace-nowrap px-0.5"
          >
            {page.current} / {page.total}
          </span>
          <button
            type="button"
            onClick={() => page.onChange(Math.min(page.total, page.current + 1))}
            disabled={disabled || page.current >= page.total}
            aria-label="Sonraki sayfa"
            title="Sonraki sayfa"
            className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/80 hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
          >
            <BelgeNextPageIcon className="h-3.5 w-3.5" />
          </button>
          <span className="mx-0.5 h-3.5 w-px bg-border/80" aria-hidden="true" />
        </div>
      )}

      {/* Yakınlaştırma kontrolleri [− %100 + ⤢] */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onZoomChange(clampBelgeZoom(zoomLevel - BELGE_ZOOM_STEP))}
          disabled={disabled || zoomLevel <= MIN_BELGE_ZOOM}
          aria-label="Uzaklaştır"
          title="Uzaklaştır"
          className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/80 hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
        >
          <BelgeZoomOutIcon className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onFit}
          disabled={disabled}
          title="Sayfayı sığdır (%100)"
          aria-label={`Yakınlaştırma yüzde ${displayedZoom}, sığdırmak için tıklayın`}
          data-testid="belge-studio-zoom-level"
          className="min-w-[34px] px-1 text-center font-mono text-[11px] font-bold tabular-nums text-foreground hover:text-amber-500 cursor-pointer transition-colors"
        >
          %{displayedZoom}
        </button>

        <button
          type="button"
          onClick={() => onZoomChange(clampBelgeZoom(zoomLevel + BELGE_ZOOM_STEP))}
          disabled={disabled || zoomLevel >= MAX_BELGE_ZOOM}
          aria-label="Yakınlaştır"
          title="Yakınlaştır"
          className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/80 hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
        >
          <BelgeZoomInIcon className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onFit}
          disabled={disabled}
          aria-label="Sayfayı Sığdır"
          title="Sayfayı Sığdır"
          className="flex h-7 w-7 items-center justify-center rounded-full text-foreground/80 hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
        >
          <BelgeFitPageIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
