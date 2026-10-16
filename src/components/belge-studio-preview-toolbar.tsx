import { ChevronLeft, ChevronRight, ExternalLink, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { BELGE_ZOOM_STEP, MAX_BELGE_ZOOM, MIN_BELGE_ZOOM, clampBelgeZoom } from "@/lib/belge-studio-zoom";
import { BELGE_STUDIO_PREVIEW_TOOLBAR_CLASS } from "@/lib/belge-studio-layout";

type BelgeStudioPreviewToolbarProps = {
  zoomLevel: number;
  onZoomChange: (zoomLevel: number) => void;
  onFit: () => void;
  pdfUrl: string | null;
  page?: { current: number; total: number; onChange: (page: number) => void };
  disabled?: boolean;
};

export function BelgeStudioPreviewToolbar({ zoomLevel, onZoomChange, onFit, pdfUrl, page, disabled = false }: BelgeStudioPreviewToolbarProps) {
  const hasPageNavigation = page !== undefined && page.total > 1;
  const displayedZoom = Math.round(zoomLevel);

  return (
    <div role="toolbar" aria-label="PDF önizleme araçları" data-testid="belge-studio-preview-toolbar" data-multipage={hasPageNavigation} className={BELGE_STUDIO_PREVIEW_TOOLBAR_CLASS}>
      {hasPageNavigation && (
        <div className="belge-preview-navigation flex items-center gap-1" role="group" aria-label="PDF sayfaları">
          <button type="button" onClick={() => page.onChange(Math.max(1, page.current - 1))} disabled={disabled || page.current <= 1} aria-label="Önceki sayfa" title="Önceki sayfa" className="preview-tool-button">
            <ChevronLeft className="h-[16px] w-[16px]" />
          </button>
          <span aria-live="polite" aria-atomic="true" className="min-w-[40px] text-center font-mono text-xs font-semibold text-foreground">{page.current} / {page.total}</span>
          <button type="button" onClick={() => page.onChange(Math.min(page.total, page.current + 1))} disabled={disabled || page.current >= page.total} aria-label="Sonraki sayfa" title="Sonraki sayfa" className="preview-tool-button">
            <ChevronRight className="h-[16px] w-[16px]" />
          </button>
        </div>
      )}
      <div className="belge-preview-zoom flex items-center justify-center gap-1" role="group" aria-label="PDF yakınlaştırma">
        <button type="button" aria-label="Uzaklaştır" onClick={() => onZoomChange(clampBelgeZoom(zoomLevel - BELGE_ZOOM_STEP))} disabled={disabled || zoomLevel <= MIN_BELGE_ZOOM} title="Uzaklaştır (Ctrl / Cmd ve eksi)" className="preview-tool-button"><ZoomOut className="h-[16px] w-[16px]" /></button>
        <span aria-live="off" aria-label={`Yakınlaştırma yüzde ${displayedZoom}`} data-testid="belge-studio-zoom-level" className="min-w-[48px] text-center font-mono text-xs font-semibold tabular-nums text-foreground">%{displayedZoom}</span>
        <button type="button" aria-label="Yakınlaştır" onClick={() => onZoomChange(clampBelgeZoom(zoomLevel + BELGE_ZOOM_STEP))} disabled={disabled || zoomLevel >= MAX_BELGE_ZOOM} title="Yakınlaştır (Ctrl / Cmd ve artı)" className="preview-tool-button"><ZoomIn className="h-[16px] w-[16px]" /></button>
      </div>
      <div className="belge-preview-utilities flex items-center justify-end gap-1" role="group" aria-label="PDF görünümü">
        <button type="button" aria-label="Sığdır" onClick={onFit} disabled={disabled} title="Tüm sayfayı sığdır (Ctrl / Cmd ve 0)" className="preview-tool-button"><Maximize2 className="h-[16px] w-[16px]" /><span className="hidden sm:inline">Sığdır</span></button>
        <a href={pdfUrl ?? undefined} role="link" aria-label="PDF'yi yeni sekmede aç" target="_blank" rel="noopener noreferrer" title="PDF'yi yeni sekmede aç" className={`preview-tool-button ${disabled || !pdfUrl ? "pointer-events-none opacity-45" : ""}`} aria-disabled={disabled || !pdfUrl} tabIndex={disabled || !pdfUrl ? -1 : undefined}><ExternalLink className="h-[16px] w-[16px]" /></a>
      </div>
    </div>
  );
}
