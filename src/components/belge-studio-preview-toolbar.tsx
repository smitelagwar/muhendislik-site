"use client";

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
import type { BelgeStudioFormViewControls } from "@/hooks/use-belge-studio-form-view";
import {
  BelgeFitPageIcon,
  BelgeFitWidthIcon,
  BelgeMoreIcon,
  BelgeNextPageIcon,
  BelgePrevPageIcon,
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
  onFitWidth?: () => void;
  fitMode?: "page" | "width" | "custom";
  pdfUrl: string | null;
  page?: { current: number; total: number; onChange: (page: number) => void };
  disabled?: boolean;
  /** @deprecated V3 sözleşmesinde Form Görünümü footer action bar'da yer alır */
  formView?: BelgeStudioFormViewControls;
  pdfFocus?: BelgeStudioPdfFocusApi;
};

/**
 * Belge Stüdyosu — PDF Önizleme Araç Çubuğu
 *
 * Kurallar:
 * 1. 3 kolonlu CSS Grid (`minmax(0, 1fr) max-content minmax(0, 1fr)`).
 * 2. Orta kolon (`.belge-preview-center`): [− % +] zoom grubu ve onun sağında ayrı grup olarak `Sığdır` / `Genişliğe Sığdır` butonlarını barındırır.
 * 3. `Yeni Sekme` ve `PDF'ye Odaklan` kaldırılmıştır.
 * 4. Mobilde/dar ekranda taşma (More) menüsü sağ kolonda yer alır.
 */
export function BelgeStudioPreviewToolbar({
  zoomLevel,
  onZoomChange,
  onFit,
  onFitWidth,
  fitMode,
  page,
  disabled = false,
}: BelgeStudioPreviewToolbarProps) {
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
      {/* Sol Kolon: Sayfa Gezinme veya Boş Alan (Grid Track 1 - minmax(0, 1fr)) */}
      <div className="belge-preview-left flex items-center justify-start min-w-0">
        {hasPageNavigation && (
          <div
            className="belge-preview-navigation flex items-center gap-[2px] sm:gap-[4px]"
            role="group"
            aria-label="PDF sayfaları"
          >
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
              className="min-w-[36px] sm:min-w-[40px] text-center font-mono text-[11px] sm:text-[12px] font-semibold text-foreground whitespace-nowrap"
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
      </div>

      {/* Orta Kolon: Zoom [− % +] ve sağında ayrı grup olarak Sığdır / Genişliğe Sığdır (Grid Track 2 - max-content) */}
      <div className="belge-preview-center flex items-center justify-center gap-2 sm:gap-3 min-w-0">
        <div
          className={`belge-preview-zoom ${hasPageNavigation ? "hidden sm:flex" : "flex"} items-center justify-center gap-[3px] sm:gap-[4px]`}
          role="group"
          aria-label="PDF yakınlaştırma"
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
        </div>

        {/* Zoom grubunun sağında ayrı Sığdır / Genişliğe Sığdır grubu (Masaüstü) */}
        <div
          className="hidden lg:block h-6 w-px bg-border/80 shrink-0"
          aria-hidden="true"
        />
        <div
          className="belge-preview-fit hidden lg:flex items-center gap-[3px] sm:gap-[4px]"
          role="group"
          aria-label="PDF sığdırma"
        >
          <button
            type="button"
            aria-label="Sığdır"
            aria-pressed={fitMode === "page" && displayedZoom === 100}
            onClick={onFit}
            disabled={disabled}
            title="Tüm sayfayı sığdır (Ctrl / Cmd ve 0)"
            className={`preview-tool-button preview-tool-button-stacked ${fitMode === "page" && displayedZoom === 100 ? "preview-tool-button-active" : ""}`}
            data-testid="belge-preview-fit-page-btn"
          >
            <BelgeFitPageIcon className="preview-tool-icon h-[22px] w-[22px] shrink-0" />
            <span className="preview-tool-label">Sığdır</span>
          </button>
          {onFitWidth && (
            <button
              type="button"
              aria-label="Genişliğe sığdır"
              aria-pressed={fitMode === "width"}
              onClick={onFitWidth}
              disabled={disabled}
              title="Genişliğe sığdır (Ctrl / Cmd ve 9)"
              className={`preview-tool-button preview-tool-button-stacked ${fitMode === "width" ? "preview-tool-button-active" : ""}`}
              data-testid="belge-preview-fit-width-btn"
            >
              <BelgeFitWidthIcon className="preview-tool-icon h-[22px] w-[22px] shrink-0" />
              <span className="preview-tool-label">Genişliğe Sığdır</span>
            </button>
          )}
        </div>
      </div>

      {/* Sağ Kolon: Mobilde / Dar Ekranda Taşma (More) Menüsü (Grid Track 3 - minmax(0, 1fr)) */}
      <div className="belge-preview-right flex items-center justify-end gap-[3px] sm:gap-[4px] min-w-0">
        {/* Mobilde / Dar Ekranda Taşma (More) Menüsü */}
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

              {/* Sığdır */}
              <DropdownMenuItem
                onSelect={onFit}
                disabled={disabled}
                className="min-h-11 gap-2 rounded-lg cursor-pointer"
              >
                <BelgeFitPageIcon className="h-4 w-4" />
                Sayfayı Sığdır
              </DropdownMenuItem>

              {/* Genişliğe Sığdır */}
              {onFitWidth && (
                <DropdownMenuItem
                  onSelect={onFitWidth}
                  disabled={disabled}
                  className="belge-tablet-landscape-only min-h-11 gap-2 rounded-lg cursor-pointer"
                  data-testid="belge-preview-mobile-fit-width-item"
                >
                  <BelgeFitWidthIcon className="h-4 w-4" />
                  Genişliğe Sığdır
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
