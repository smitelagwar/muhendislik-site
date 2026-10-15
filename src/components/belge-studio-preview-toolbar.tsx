import { ExternalLink, FileText, ZoomIn, ZoomOut } from "lucide-react";
import { BELGE_STUDIO_PREVIEW_TOOLBAR_CLASS } from "@/lib/belge-studio-layout";

type BelgeStudioPreviewToolbarProps = {
  zoomLevel: number;
  onZoomChange: (zoomLevel: number) => void;
  pdfUrl: string | null;
  page?: {
    current: number;
    total: number;
    onChange: (page: number) => void;
  };
};

export function BelgeStudioPreviewToolbar({
  zoomLevel,
  onZoomChange,
  pdfUrl,
  page,
}: BelgeStudioPreviewToolbarProps) {
  const hasPageNavigation = page !== undefined && page.total > 1;

  return (
    <div
      role="toolbar"
      aria-label="PDF önizleme araçları"
      data-testid="belge-studio-preview-toolbar"
      className={BELGE_STUDIO_PREVIEW_TOOLBAR_CLASS}
    >
      <div className="hidden min-w-0 items-center gap-1.5 lg:order-1 lg:flex">
        <FileText className="h-3.5 w-3.5 shrink-0 text-amber-500" />
        <span className="truncate text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Canlı Belge Önizlemesi
        </span>
      </div>

      {hasPageNavigation && (
        <div className="col-start-1 row-start-1 flex h-11 min-w-0 items-center justify-center gap-1 lg:order-2 lg:h-auto">
          <button
            type="button"
            onClick={() => page.onChange(Math.max(1, page.current - 1))}
            disabled={page.current <= 1}
            aria-label="Önceki sayfa"
            title="Önceki sayfa"
            className="flex h-11 min-w-11 items-center justify-center gap-1 rounded-md border border-border bg-background px-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-40 lg:px-2"
          >
            <span aria-hidden="true">‹</span>
            <span className="hidden xl:inline">Önceki</span>
          </button>
          <span
            aria-live="polite"
            aria-atomic="true"
            className="min-w-10 px-1 text-center font-mono text-[11px] font-semibold text-foreground"
          >
            {page.current} / {page.total}
          </span>
          <button
            type="button"
            onClick={() => page.onChange(Math.min(page.total, page.current + 1))}
            disabled={page.current >= page.total}
            aria-label="Sonraki sayfa"
            title="Sonraki sayfa"
            className="flex h-11 min-w-11 items-center justify-center gap-1 rounded-md border border-border bg-background px-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-40 lg:px-2"
          >
            <span className="hidden xl:inline">Sonraki</span>
            <span aria-hidden="true">›</span>
          </button>
        </div>
      )}

      <button
        type="button"
        aria-label="Sığdır"
        onClick={() => onZoomChange(100)}
        title="Sayfayı önizleme alanına sığdır (%100)"
        className={`${hasPageNavigation ? "col-start-2" : "col-start-1"} row-start-1 flex h-11 min-w-11 items-center justify-center rounded-md border px-1.5 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 lg:order-3 lg:h-11 lg:px-2 ${
          zoomLevel === 100
            ? "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400"
            : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
        }`}
      >
        Sığdır
      </button>

      <div className="col-span-2 row-start-2 flex h-11 items-center justify-center gap-1 lg:order-4 lg:col-span-1 lg:row-auto lg:h-auto">
        <div className="flex h-11 items-center gap-0.5">
          <button
            type="button"
            aria-label="Uzaklaştır"
            onClick={() => onZoomChange(Math.max(50, zoomLevel - 25))}
            title="Uzaklaştır"
            className="flex h-11 min-w-11 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span
            aria-live="polite"
            aria-atomic="true"
            className="min-w-12 px-1 text-center font-mono text-[11px] font-semibold text-muted-foreground"
          >
            %{zoomLevel}
          </span>
          <button
            type="button"
            aria-label="Yakınlaştır"
            onClick={() => onZoomChange(Math.min(250, zoomLevel + 25))}
            title="Yakınlaştır"
            className="flex h-11 min-w-11 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        {pdfUrl && (
          <a
            href={pdfUrl}
            aria-label="PDF'yi yeni sekmede aç"
            target="_blank"
            rel="noopener noreferrer"
            title="PDF'yi yeni sekmede aç"
            className="ml-1 flex h-11 min-w-11 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 lg:w-auto lg:px-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden xl:inline xl:pl-1 text-[10px] font-semibold">
              Yeni Sekmede Aç
            </span>
          </a>
        )}
      </div>
    </div>
  );
}
