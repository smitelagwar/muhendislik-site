"use client";

import { useState } from "react";
import { Download, FileCode, FileText, Image as ImageIcon, Layers, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CadReviewDocument } from "@/lib/dokumantasyon/cad-review/schema";
import { exportReviewToJson, type CadExportFilters } from "@/lib/dokumantasyon/cad-review/export-json";
import { exportReviewToDxf } from "@/lib/dokumantasyon/cad-review/export-dxf";
import { captureReviewPngBlob, downloadFileBlob } from "@/lib/dokumantasyon/cad-review/export-image";

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

export function CadExportDialog({
  open,
  onClose,
  document,
  sourceFileName,
  originalFileUrl,
  getCanvasElement,
  getSvgOverlayElement,
}: CadExportDialogProps) {
  const [format, setFormat] = useState<CadExportFormat>("json");
  const [filters, setFilters] = useState<CadExportFilters>({
    includeMeasurements: true,
    includeComments: true,
    includeMarkup: true,
    includeSketches: true,
    includeResolved: true,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const baseName = sourceFileName.replace(/\.[^/.]+$/, "");
  const timeStamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMsg(null);

    try {
      if (format === "json") {
        const jsonStr = exportReviewToJson(document, filters);
        const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
        downloadFileBlob(blob, `${baseName}_review_${timeStamp}.json`);
      } else if (format === "dxf") {
        const dxfStr = exportReviewToDxf(document, filters);
        const blob = new Blob([dxfStr], { type: "application/dxf;charset=utf-8" });
        downloadFileBlob(blob, `${baseName}_review_${timeStamp}.dxf`);
      } else if (format === "png" || format === "pdf") {
        const canvas = getCanvasElement?.();
        if (!canvas) {
          throw new Error("CAD canvas görseli alınamadı.");
        }
        const svg = getSvgOverlayElement?.();
        const blob = await captureReviewPngBlob(canvas, svg, 2);
        downloadFileBlob(blob, `${baseName}_review_${timeStamp}.${format === "pdf" ? "pdf" : "png"}`);
      } else if (format === "original") {
        if (originalFileUrl) {
          const a = window.document.createElement("a");
          a.href = originalFileUrl;
          a.download = sourceFileName;
          window.document.body.appendChild(a);
          a.click();
          window.document.body.removeChild(a);
        } else {
          throw new Error("Orijinal dosya bağlantısı bulunamadı.");
        }
      }

      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Dışa aktarma sırasında bir hata oluştu.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      data-cad-export-dialog="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-background/95 p-5 shadow-2xl backdrop-blur">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h2 id="export-dialog-title" className="text-base font-semibold text-foreground">
            CAD İncelemesini Dışa Aktar
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Format Options */}
        <div className="mt-4 space-y-3">
          <label className="text-xs font-semibold text-muted-foreground">Çıktı Formatı</label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={format === "json" ? "secondary" : "outline"}
              className="h-14 flex-col gap-1 text-xs font-medium"
              onClick={() => setFormat("json")}
            >
              <FileCode className="h-4 w-4 text-blue-500" />
              Review JSON
            </Button>
            <Button
              type="button"
              variant={format === "dxf" ? "secondary" : "outline"}
              className="h-14 flex-col gap-1 text-xs font-medium"
              onClick={() => setFormat("dxf")}
            >
              <Layers className="h-4 w-4 text-emerald-500" />
              Review-Only DXF
            </Button>
            <Button
              type="button"
              variant={format === "png" ? "secondary" : "outline"}
              className="h-14 flex-col gap-1 text-xs font-medium"
              onClick={() => setFormat("png")}
            >
              <ImageIcon className="h-4 w-4 text-amber-500" />
              Görsel (PNG)
            </Button>
            <Button
              type="button"
              variant={format === "pdf" ? "secondary" : "outline"}
              className="h-14 flex-col gap-1 text-xs font-medium"
              onClick={() => setFormat("pdf")}
            >
              <FileText className="h-4 w-4 text-purple-500" />
              Belge (PDF)
            </Button>
          </div>
        </div>

        {/* Filter Checkboxes */}
        {format !== "original" && (
          <div className="mt-4 space-y-2 border-t border-border/40 pt-3">
            <label className="text-xs font-semibold text-muted-foreground">Dahil Edilecek Katmanlar</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.includeMeasurements}
                  onChange={(e) => setFilters({ ...filters, includeMeasurements: e.target.checked })}
                  className="rounded border-border text-primary"
                />
                Ölçümler
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.includeComments}
                  onChange={(e) => setFilters({ ...filters, includeComments: e.target.checked })}
                  className="rounded border-border text-primary"
                />
                Yorum Pinleri
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.includeMarkup}
                  onChange={(e) => setFilters({ ...filters, includeMarkup: e.target.checked })}
                  className="rounded border-border text-primary"
                />
                Şekil & Callout
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.includeSketches}
                  onChange={(e) => setFilters({ ...filters, includeSketches: e.target.checked })}
                  className="rounded border-border text-primary"
                />
                Serbest El Eskiz
              </label>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="mt-3 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
            {errorMsg}
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-border/60 pt-3">
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
          >
            {isExporting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Dışa Aktarılıyor...
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                İndir
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}