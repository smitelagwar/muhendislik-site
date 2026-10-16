"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { BELGE_ZOOM_STEP, MAX_BELGE_ZOOM, MIN_BELGE_ZOOM, clampBelgeZoom } from "@/lib/belge-studio-zoom";
import { BELGE_STUDIO_PREVIEW_TOOLBAR_CLASS } from "@/lib/belge-studio-layout";
import {
  BelgeFitPageIcon,
  BelgeMoonIcon,
  BelgeNextPageIcon,
  BelgeOpenExternalIcon,
  BelgePrevPageIcon,
  BelgeSunIcon,
  BelgeZoomInIcon,
  BelgeZoomOutIcon,
} from "@/components/belge-studio-icons";

type BelgeStudioPreviewToolbarProps = {
  zoomLevel: number;
  onZoomChange: (zoomLevel: number) => void;
  onFit: () => void;
  pdfUrl: string | null;
  page?: { current: number; total: number; onChange: (page: number) => void };
  disabled?: boolean;
};

export function BelgeStudioPreviewToolbar({
  zoomLevel,
  onZoomChange,
  onFit,
  pdfUrl,
  page,
  disabled = false,
}: BelgeStudioPreviewToolbarProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const handleToggleTheme = () => {
    const currentlyDark = mounted
      ? resolvedTheme === "dark"
      : typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    setTheme(currentlyDark ? "light" : "dark");
  };

  const hasPageNavigation = page !== undefined && page.total > 1;
  const displayedZoom = Math.round(zoomLevel);

  return (
    <div
      role="toolbar"
      aria-label="PDF önizleme araçları"
      data-testid="belge-studio-preview-toolbar"
      data-multipage={hasPageNavigation}
      className={BELGE_STUDIO_PREVIEW_TOOLBAR_CLASS}
    >
      {hasPageNavigation && (
        <div className="belge-preview-navigation flex items-center gap-[4px]" role="group" aria-label="PDF sayfaları">
          <button
            type="button"
            onClick={() => page.onChange(Math.max(1, page.current - 1))}
            disabled={disabled || page.current <= 1}
            aria-label="Önceki sayfa"
            title="Önceki sayfa"
            className="preview-tool-button"
          >
            <BelgePrevPageIcon className="h-[17px] w-[17px]" />
          </button>
          <span
            aria-live="polite"
            aria-atomic="true"
            className="min-w-[40px] text-center font-mono text-[12px] font-semibold text-foreground"
          >
            {page.current} / {page.total}
          </span>
          <button
            type="button"
            onClick={() => page.onChange(Math.min(page.total, page.current + 1))}
            disabled={disabled || page.current >= page.total}
            aria-label="Sonraki sayfa"
            title="Sonraki sayfa"
            className="preview-tool-button"
          >
            <BelgeNextPageIcon className="h-[17px] w-[17px]" />
          </button>
        </div>
      )}

      <div
        className="belge-preview-zoom flex items-center justify-center gap-[4px]"
        role="group"
        aria-label="PDF yakınlaştırma ve görünüm"
      >
        <button
          type="button"
          aria-label="Uzaklaştır"
          onClick={() => onZoomChange(clampBelgeZoom(zoomLevel - BELGE_ZOOM_STEP))}
          disabled={disabled || zoomLevel <= MIN_BELGE_ZOOM}
          title="Uzaklaştır (Ctrl / Cmd ve eksi)"
          className="preview-tool-button"
        >
          <BelgeZoomOutIcon className="h-[17px] w-[17px]" />
        </button>
        <span
          aria-live="off"
          aria-label={`Yakınlaştırma yüzde ${displayedZoom}`}
          data-testid="belge-studio-zoom-level"
          className="min-w-[44px] text-center font-mono text-[12px] font-semibold tabular-nums text-foreground"
        >
          %{displayedZoom}
        </span>
        <button
          type="button"
          aria-label="Yakınlaştır"
          onClick={() => onZoomChange(clampBelgeZoom(zoomLevel + BELGE_ZOOM_STEP))}
          disabled={disabled || zoomLevel >= MAX_BELGE_ZOOM}
          title="Yakınlaştır (Ctrl / Cmd ve artı)"
          className="preview-tool-button"
        >
          <BelgeZoomInIcon className="h-[17px] w-[17px]" />
        </button>
        <span aria-hidden="true" className="mx-[2px] hidden h-5 w-px bg-border/80 sm:inline-block" />
        <button
          type="button"
          aria-label="Sığdır"
          onClick={onFit}
          disabled={disabled}
          title="Tüm sayfayı sığdır (Ctrl / Cmd ve 0)"
          className="preview-tool-button"
        >
          <BelgeFitPageIcon className="h-[17px] w-[17px]" />
          <span className="hidden sm:inline">Sığdır</span>
        </button>
        <a
          href={pdfUrl ?? undefined}
          role="link"
          aria-label="PDF'yi yeni sekmede aç"
          target="_blank"
          rel="noopener noreferrer"
          title="PDF'yi yeni sekmede aç"
          className={`preview-tool-button ${disabled || !pdfUrl ? "pointer-events-none opacity-45" : ""}`}
          aria-disabled={disabled || !pdfUrl}
          tabIndex={disabled || !pdfUrl ? -1 : undefined}
        >
          <BelgeOpenExternalIcon className="h-[17px] w-[17px]" />
        </a>
      </div>

      <div className="belge-preview-utilities hidden items-center justify-end gap-[4px] lg:flex" role="group" aria-label="Tema görünümü">
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          aria-label="Koyu tema"
          data-testid="belge-theme-toggle"
          onClick={handleToggleTheme}
          title={isDark ? "Aydınlık temaya geç" : "Koyu temaya geç"}
          className="preview-tool-button preview-theme-switch"
        >
          <span
            className={`h-6 w-6 items-center justify-center rounded-[5px] transition-all ${
              !isDark
                ? "inline-flex bg-amber-500/20 text-amber-600 shadow-2xs dark:text-amber-400"
                : "hidden sm:inline-flex text-muted-foreground/70"
            }`}
          >
            <BelgeSunIcon className="h-[15px] w-[15px]" />
          </span>
          <span
            className={`h-6 w-6 items-center justify-center rounded-[5px] transition-all ${
              isDark
                ? "inline-flex bg-amber-500/20 text-amber-400 shadow-2xs"
                : "hidden sm:inline-flex text-muted-foreground/70"
            }`}
          >
            <BelgeMoonIcon className="h-[15px] w-[15px]" />
          </span>
        </button>
      </div>
    </div>
  );
}
