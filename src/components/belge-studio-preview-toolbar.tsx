"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BELGE_ZOOM_STEP, MAX_BELGE_ZOOM, MIN_BELGE_ZOOM, clampBelgeZoom } from "@/lib/belge-studio-zoom";
import { BELGE_STUDIO_PREVIEW_TOOLBAR_CLASS } from "@/lib/belge-studio-layout";
import { BELGE_UX_FLAGS } from "@/lib/belge-ux-config";
import { BelgeStudioFormViewMenu } from "@/components/belge-studio-form-view-menu";
import type { BelgeStudioFormViewControls } from "@/hooks/use-belge-studio-form-view";
import {
  BelgeFitPageIcon,
  BelgeMoonIcon,
  BelgeMoreIcon,
  BelgeNextPageIcon,
  BelgeOpenExternalIcon,
  BelgePdfFocusEnterIcon,
  BelgePdfFocusExitIcon,
  BelgePrevPageIcon,
  BelgeSunIcon,
  BelgeZoomInIcon,
  BelgeZoomOutIcon,
} from "@/components/belge-studio-icons";

export type BelgeStudioPdfFocusApi = {
  isPdfFocus: boolean;
  onTogglePdfFocus: () => void;
};

type BelgeStudioPreviewToolbarProps = {
  zoomLevel: number;
  onZoomChange: (zoomLevel: number) => void;
  onFit: () => void;
  pdfUrl: string | null;
  page?: { current: number; total: number; onChange: (page: number) => void };
  disabled?: boolean;
  formView?: BelgeStudioFormViewControls;
  pdfFocus?: BelgeStudioPdfFocusApi;
};

export function BelgeStudioPreviewToolbar({
  zoomLevel,
  onZoomChange,
  onFit,
  pdfUrl,
  page,
  disabled = false,
  formView,
  pdfFocus,
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
        <div className="belge-preview-navigation hidden sm:flex items-center gap-[3px] sm:gap-[4px]" role="group" aria-label="PDF sayfaları">
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
        className="belge-preview-zoom hidden sm:flex items-center justify-center gap-[3px] sm:gap-[4px]"
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
          className="min-w-[38px] sm:min-w-[44px] text-center font-mono text-[11px] sm:text-[12px] font-semibold tabular-nums text-foreground"
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
        <span aria-hidden="true" className="mx-[2px] hidden h-5 w-px bg-border/80 md:inline-block" />
        <button
          type="button"
          aria-label="Sığdır"
          onClick={onFit}
          disabled={disabled}
          title="Tüm sayfayı sığdır (Ctrl / Cmd ve 0)"
          className="preview-tool-button hidden md:inline-flex"
        >
          <BelgeFitPageIcon className="h-[17px] w-[17px]" />
          <span className="hidden lg:inline">Sığdır</span>
        </button>
        <a
          href={pdfUrl ?? undefined}
          role="link"
          aria-label="PDF'yi yeni sekmede aç"
          target="_blank"
          rel="noopener noreferrer"
          title="PDF'yi yeni sekmede aç"
          className={`preview-tool-button hidden lg:inline-flex ${disabled || !pdfUrl ? "pointer-events-none opacity-45" : ""}`}
          aria-disabled={disabled || !pdfUrl}
          tabIndex={disabled || !pdfUrl ? -1 : undefined}
        >
          <BelgeOpenExternalIcon className="h-[17px] w-[17px]" />
        </a>
      </div>

      {/* Overflow Menüsü: lg altındaki ekranlarda tüm ek görünüm araçlarını güvenle sunar */}
      <div className="belge-preview-more flex shrink-0 lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="preview-tool-button"
              data-testid="belge-studio-more-view-options"
              aria-label="Görünüm ve PDF seçenekleri"
              title="Görünüm seçenekleri"
              disabled={disabled}
            >
              <BelgeMoreIcon className="h-[17px] w-[17px]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            align="end"
            sideOffset={8}
            className="min-w-56 rounded-xl border-border bg-popover p-1.5 shadow-xl text-xs"
            data-testid="belge-studio-more-view-menu"
          >
            <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground flex items-center justify-between">
              <span>PDF Görünümü</span>
              <span className="font-mono font-semibold text-foreground">%{displayedZoom}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Mobilde Yakınlaştırma Kontrolleri */}
            <div className="flex items-center justify-between px-2 py-1.5 text-xs sm:hidden">
              <span className="text-muted-foreground">Yakınlaştırma</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={disabled || zoomLevel <= MIN_BELGE_ZOOM}
                  onClick={() => onZoomChange(clampBelgeZoom(zoomLevel - BELGE_ZOOM_STEP))}
                  className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-border p-1 hover:bg-secondary disabled:opacity-40"
                  aria-label="Uzaklaştır"
                >
                  <BelgeZoomOutIcon className="h-3.5 w-3.5" />
                </button>
                <span className="font-mono font-semibold px-1 text-center min-w-[38px]">
                  %{displayedZoom}
                </span>
                <button
                  type="button"
                  disabled={disabled || zoomLevel >= MAX_BELGE_ZOOM}
                  onClick={() => onZoomChange(clampBelgeZoom(zoomLevel + BELGE_ZOOM_STEP))}
                  className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-border p-1 hover:bg-secondary disabled:opacity-40"
                  aria-label="Yakınlaştır"
                >
                  <BelgeZoomInIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <DropdownMenuSeparator className="sm:hidden" />

            {/* Çok sayfalı gezinme (Mobilde açılır menü içinden de tam erişilebilir) */}
            {hasPageNavigation && (
              <>
                <div className="flex items-center justify-between px-2 py-1.5 text-xs">
                  <span className="text-muted-foreground">Sayfa {page.current} / {page.total}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={disabled || page.current <= 1}
                      onClick={() => page.onChange(Math.max(1, page.current - 1))}
                      className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-border p-1 hover:bg-secondary disabled:opacity-40"
                      aria-label="Önceki sayfa"
                    >
                      <BelgePrevPageIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={disabled || page.current >= page.total}
                      onClick={() => page.onChange(Math.min(page.total, page.current + 1))}
                      className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-border p-1 hover:bg-secondary disabled:opacity-40"
                      aria-label="Sonraki sayfa"
                    >
                      <BelgeNextPageIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Sığdır */}
            <DropdownMenuItem
              onSelect={onFit}
              disabled={disabled}
              className="min-h-11 gap-2 rounded-lg cursor-pointer"
            >
              <BelgeFitPageIcon className="h-4 w-4" />
              Sayfayı Sığdır (%100)
            </DropdownMenuItem>

            {/* Yeni Sekmede Aç */}
            {disabled || !pdfUrl ? (
              <DropdownMenuItem disabled className="min-h-11 gap-2 rounded-lg">
                <BelgeOpenExternalIcon className="h-4 w-4" />
                PDF&apos;yi yeni sekmede aç
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem asChild className="min-h-11 gap-2 rounded-lg cursor-pointer">
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                  <BelgeOpenExternalIcon className="h-4 w-4" />
                  PDF&apos;yi yeni sekmede aç
                </a>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {/* Tema Değiştir */}
            <DropdownMenuItem
              onSelect={handleToggleTheme}
              className="min-h-11 gap-2 rounded-lg cursor-pointer"
            >
              {isDark ? (
                <>
                  <BelgeSunIcon className="h-4 w-4 text-amber-500" />
                  Aydınlık Temaya Geç
                </>
              ) : (
                <>
                  <BelgeMoonIcon className="h-4 w-4 text-amber-500" />
                  Koyu Temaya Geç
                </>
              )}
            </DropdownMenuItem>

            {/* Form Görünüm Seçeneği (Varsa) */}
            {formView && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="px-2 py-1 text-[11px] text-muted-foreground">
                  Form Düzeni ({formView.density === "compact" ? "Kompakt" : "Normal"})
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={formView.onToggleCompact}
                  className="min-h-11 gap-2 rounded-lg cursor-pointer"
                >
                  <span>{formView.density === "compact" ? "Normal Form Düzeni" : "Kompakt Form Düzeni"}</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="belge-preview-utilities hidden items-center justify-end gap-[4px] lg:flex" role="group" aria-label="Form görünümü ve tema">
        {pdfFocus && BELGE_UX_FLAGS.FOCUS_MODE && (
          <button
            type="button"
            data-testid="belge-pdf-focus-toggle"
            aria-pressed={pdfFocus.isPdfFocus}
            aria-label={pdfFocus.isPdfFocus ? "Formu Göster" : "PDF'ye Odaklan"}
            title={pdfFocus.isPdfFocus ? "Formu Göster" : "PDF'ye Odaklan"}
            onClick={pdfFocus.onTogglePdfFocus}
            className={`preview-tool-button ${pdfFocus.isPdfFocus ? "preview-tool-button-active" : ""}`}
          >
            {pdfFocus.isPdfFocus ? (
              <BelgePdfFocusExitIcon className="h-[17px] w-[17px]" />
            ) : (
              <BelgePdfFocusEnterIcon className="h-[17px] w-[17px]" />
            )}
            <span className="hidden sm:inline">
              {pdfFocus.isPdfFocus ? "Formu Göster" : "PDF'ye Odaklan"}
            </span>
          </button>
        )}
        {formView && (
          <BelgeStudioFormViewMenu
            mode={formView.mode}
            manualScale={formView.manualScale}
            density={formView.density}
            appliedScale={formView.appliedScale}
            fitStatus={formView.fitStatus}
            onChooseScale={formView.onChooseScale}
            onToggleCompact={formView.onToggleCompact}
            onFit={formView.onFit}
            onReset={formView.onReset}
            disabled={disabled}
          />
        )}
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
