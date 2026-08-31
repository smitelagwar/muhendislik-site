"use client";

import { useEffect, useRef, useState } from "react";
import {
  Download,
  FileCode,
  FileText,
  Image as ImageIcon,
  Layers,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CadReviewDocument } from "@/lib/dokumantasyon/cad-review/schema";
import { exportReviewToJson } from "@/lib/dokumantasyon/cad-review/export-json";
import { exportReviewToDxf } from "@/lib/dokumantasyon/cad-review/export-dxf";
import {
  DEFAULT_CAD_EXPORT_FILTERS,
  assertReviewDxfStructure,
  normalizeReviewDxfInsunits,
  reviewDxfFileName,
  reviewJsonFileName,
  reviewPdfFileName,
  viewportPngFileName,
  type CadExportFilters,
} from "@/lib/dokumantasyon/cad-review/export-contract";
import {
  captureReviewPngBlob,
  downloadFileBlob,
  exportCanvasToPdfBlob,
} from "@/lib/dokumantasyon/cad-review/export-image";
import { resolveCadSourceUnitContext } from "@/lib/dokumantasyon/cad-review/units";

export type CadExportFormat = "json" | "dxf" | "png" | "pdf" | "original";

export interface CadExportDialogProps {
  open: boolean;
  onClose: () => void;
  document: CadReviewDocument;
  sourceFileName: string;
  originalFileUrl?: string;
  getCanvasElement?: () => HTMLCanvasElement | null;
  getSvgOverlayElement?: () => SVGElement | null;
}

function resolveReviewOverlay(
  canvas: HTMLCanvasElement,
  explicitResolver?: () => SVGElement | null
): SVGElement | null {
  const explicit = explicitResolver?.();
  if (explicit) return explicit;
  const host = canvas.closest("[data-cad-upstream-host='true']");
  return host?.querySelector<SVGElement>("svg[data-cad-review-overlay='true']") ?? null;
}

type ToggleFilterKey = "includeMeasurements" | "includeComments" | "includeShapes" | "includeSketches";

function formatDescription(format: CadExportFormat): string {
  if (format === "dxf") return "Yalnız Review Layer öğeleri; kaynak CAD geometrisi eklenmez.";
  if (format === "original") return "Kaynak DXF/DWG dosyası değiştirilmeden indirilir.";
  if (format === "png") return "Geçerli görünüm, ekranda görünen CAD ve Review Layer ile yakalanır.";
  if (format === "pdf") return "Geçerli görünüm gerçek bir PDF inceleme sayfasına yerleştirilir.";
  return "Review Layer verisinin düzenlenebilir JSON yedeği.";
}

export function CadExportDialog({
  open,
  onClose,
  document,
  sourceFileName,
  originalFileUrl,
  getCanvasElement,
  getSvgOverlayElement,
}: CadExportDialogProps) {
  const [format, setFormat] = useState<CadExportFormat>("dxf");
  const [filters, setFilters] = useState<CadExportFilters>({ ...DEFAULT_CAD_EXPORT_FILTERS });
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isExporting) {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isExporting, onClose]);

  if (!open) return null;

  const updateFilter = (key: ToggleFilterKey, checked: boolean) => {
    setFilters((current) => ({ ...current, [key]: checked }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMsg(null);

    try {
      if (format === "json") {
        const jsonStr = exportReviewToJson(document, filters);
        const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
        downloadFileBlob(blob, reviewJsonFileName(sourceFileName));
      } else if (format === "dxf") {
        const rawDxf = exportReviewToDxf(document, filters);
        const sourceContext = resolveCadSourceUnitContext(getCanvasElement?.() ?? null);
        const dxfStr = normalizeReviewDxfInsunits(rawDxf, sourceContext.sourceUnit);
        assertReviewDxfStructure(dxfStr);
        const blob = new Blob([dxfStr], { type: "application/dxf;charset=utf-8" });
        downloadFileBlob(blob, reviewDxfFileName(sourceFileName));
      } else if (format === "png" || format === "pdf") {
        const canvas = getCanvasElement?.();
        if (!canvas) {
          throw new Error("CAD canvas görseli alınamadı.");
        }
        const svg = resolveReviewOverlay(canvas, getSvgOverlayElement);
        if (format === "png") {
          const blob = await captureReviewPngBlob(canvas, svg, 2);
          downloadFileBlob(blob, viewportPngFileName(sourceFileName));
        } else {
          const blob = await exportCanvasToPdfBlob(canvas, svg);
          downloadFileBlob(blob, reviewPdfFileName(sourceFileName));
        }
      } else if (format === "original") {
        if (!originalFileUrl) {
          throw new Error("Orijinal dosya bağlantısı bulunamadı.");
        }
        const a = window.document.createElement("a");
        a.href = originalFileUrl;
        a.download = sourceFileName;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
      }

      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Dışa aktarma sırasında bir hata oluştu.");
    } finally {
      setIsExporting(false);
    }
  };

  const dataFiltersVisible = format === "dxf" || format === "json";
  const confirmLabel =
    format === "dxf"
      ? "İşaretlemeleri DXF Olarak İndir"
      : format === "original"
        ? "Orijinal CAD Dosyasını İndir"
        : format === "png"
          ? "PNG İndir"
          : format === "pdf"
            ? "PDF İndir"
            : "Review JSON İndir";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-2 backdrop-blur-xs sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      aria-describedby="export-dialog-description"
      data-cad-export-dialog="true"
    >
      <div className="max-h-[calc(100dvh_-_16px)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-border/80 bg-background/95 p-3 shadow-2xl backdrop-blur sm:max-h-[calc(100dvh_-_32px)] sm:p-5">
        <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <h2 id="export-dialog-title" className="text-base font-semibold text-foreground">
              Dışa Aktarma Merkezi
            </h2>
            <p id="export-dialog-description" className="mt-1 text-xs text-muted-foreground">
              Çıktı türünü içeriğine göre seçin. Review-only DXF kaynak CAD geometrisini içermez.
            </p>
          </div>
          <Button
            ref={closeButtonRef}
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 text-muted-foreground hover:text-foreground sm:h-8 sm:w-8"
            onClick={onClose}
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          <span className="text-xs font-semibold text-muted-foreground">Çıktı Türü</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant={format === "dxf" ? "secondary" : "outline"}
              className="h-auto min-h-16 justify-start gap-3 px-3 py-2 text-left"
              onClick={() => setFormat("dxf")}
              aria-pressed={format === "dxf"}
              data-testid="cad-export-format-dxf"
            >
              <Layers className="h-4 w-4 shrink-0 text-emerald-500" />
              <span className="flex min-w-0 flex-col items-start">
                <span className="text-xs font-semibold">İşaretlemeleri DXF Olarak İndir</span>
                <span className="text-[10px] font-normal text-muted-foreground">Ölçüm, yorum, şekil ve eskiz katmanları</span>
              </span>
            </Button>
            {originalFileUrl ? (
              <Button
                type="button"
                variant={format === "original" ? "secondary" : "outline"}
                className="h-auto min-h-16 justify-start gap-3 px-3 py-2 text-left"
                onClick={() => setFormat("original")}
                aria-pressed={format === "original"}
                data-testid="cad-export-format-original"
              >
                <Download className="h-4 w-4 shrink-0" />
                <span className="flex min-w-0 flex-col items-start">
                  <span className="text-xs font-semibold">Orijinal CAD Dosyasını İndir</span>
                  <span className="text-[10px] font-normal text-muted-foreground">Kaynak DXF/DWG aynen</span>
                </span>
              </Button>
            ) : null}
            <Button
              type="button"
              variant={format === "png" ? "secondary" : "outline"}
              className="h-auto min-h-16 justify-start gap-3 px-3 py-2 text-left"
              onClick={() => setFormat("png")}
              aria-pressed={format === "png"}
              data-testid="cad-export-format-png"
            >
              <ImageIcon className="h-4 w-4 shrink-0 text-amber-500" />
              <span className="flex min-w-0 flex-col items-start">
                <span className="text-xs font-semibold">PNG · Geçerli Görünüm</span>
                <span className="text-[10px] font-normal text-muted-foreground">CAD + görünür Review Layer</span>
              </span>
            </Button>
            <Button
              type="button"
              variant={format === "pdf" ? "secondary" : "outline"}
              className="h-auto min-h-16 justify-start gap-3 px-3 py-2 text-left"
              onClick={() => setFormat("pdf")}
              aria-pressed={format === "pdf"}
              data-testid="cad-export-format-pdf"
            >
              <FileText className="h-4 w-4 shrink-0 text-purple-500" />
              <span className="flex min-w-0 flex-col items-start">
                <span className="text-xs font-semibold">PDF · İnceleme Sayfası</span>
                <span className="text-[10px] font-normal text-muted-foreground">Geçerli görünüm, A4 PDF</span>
              </span>
            </Button>
            <Button
              type="button"
              variant={format === "json" ? "secondary" : "outline"}
              className="h-auto min-h-16 justify-start gap-3 px-3 py-2 text-left sm:col-span-2"
              onClick={() => setFormat("json")}
              aria-pressed={format === "json"}
              data-testid="cad-export-format-json"
            >
              <FileCode className="h-4 w-4 shrink-0 text-blue-500" />
              <span className="flex min-w-0 flex-col items-start">
                <span className="text-xs font-semibold">Review JSON</span>
                <span className="text-[10px] font-normal text-muted-foreground">Review Layer veri yedeği</span>
              </span>
            </Button>
          </div>
          <p className="rounded-md bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground" data-testid="cad-export-format-description">
            {formatDescription(format)}
          </p>
        </div>

        {dataFiltersVisible ? (
          <div className="mt-4 space-y-2 border-t border-border/40 pt-3" data-testid="cad-export-filters">
            <span className="text-xs font-semibold text-muted-foreground">Dahil Et</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.includeMeasurements ?? true}
                  onChange={(event) => updateFilter("includeMeasurements", event.target.checked)}
                  className="rounded border-border text-primary"
                />
                Ölçümler
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.includeComments ?? true}
                  onChange={(event) => updateFilter("includeComments", event.target.checked)}
                  className="rounded border-border text-primary"
                />
                Yorumlar
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.includeShapes ?? true}
                  onChange={(event) => updateFilter("includeShapes", event.target.checked)}
                  className="rounded border-border text-primary"
                />
                Şekiller
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.includeSketches ?? true}
                  onChange={(event) => updateFilter("includeSketches", event.target.checked)}
                  className="rounded border-border text-primary"
                />
                Serbest çizimler
              </label>
            </div>
          </div>
        ) : (
          <p className="mt-4 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
            Bu çıktı geçerli görünümü yakalar; Review Layer filtreleri yalnız DXF ve JSON veri çıktılarında uygulanır.
          </p>
        )}

        {errorMsg ? (
          <div className="mt-3 rounded-md bg-destructive/10 p-2 text-xs text-destructive" role="alert">
            {errorMsg}
          </div>
        ) : null}

        <div className="sticky -bottom-3 mt-5 flex items-center justify-end gap-2 border-t border-border/60 bg-background/95 pb-1 pt-3 sm:-bottom-5">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isExporting}>
            İptal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="gap-1.5"
            data-cad-export-confirm="true"
            data-testid="cad-export-confirm"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Dışa Aktarılıyor...
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                {confirmLabel}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
