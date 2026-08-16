"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Building2,
  Eye,
  FileDown,
  FileEdit,
  FileText,
  Loader2,
  RotateCcw,
  Trash2,
  UserCheck,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SOZLESME_DEFAULT_DATA,
  SozlesmeData,
  downloadFilledSozlesmePdf,
  generateSozlesmePdf,
} from "@/lib/pdf-engine";

interface SozlesmeStudioProps {
  initialData?: Partial<SozlesmeData>;
  onClose?: () => void;
  isModal?: boolean;
}

// Safely load PDF.js in browser
async function loadBrowserPdfJs(): Promise<any> {
  if (typeof window === "undefined") return null;
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib;

  return new Promise((resolve, reject) => {
    const existing = document.getElementById("pdfjs-dist-script");
    if (existing) {
      const check = setInterval(() => {
        if ((window as any).pdfjsLib) {
          clearInterval(check);
          resolve((window as any).pdfjsLib);
        }
      }, 50);
      return;
    }

    const script = document.createElement("script");
    script.id = "pdfjs-dist-script";
    script.src = "/vendor/pdfjs/pdf.min.js";
    script.onload = () => {
      const pdfjs = (window as any).pdfjsLib;
      if (pdfjs) {
        pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.js";
        resolve(pdfjs);
      } else {
        reject(new Error("pdfjsLib not available"));
      }
    };
    script.onerror = () => {
      const cdnScript = document.createElement("script");
      cdnScript.src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      cdnScript.onload = () => {
        const cdnPdfjs = (window as any).pdfjsLib;
        if (cdnPdfjs) {
          cdnPdfjs.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          resolve(cdnPdfjs);
        } else {
          reject(new Error("CDN pdfjs failed"));
        }
      };
      cdnScript.onerror = reject;
      document.head.appendChild(cdnScript);
    };
    document.head.appendChild(script);
  });
}

export function SozlesmeStudio({
  initialData,
  onClose,
  isModal = false,
}: SozlesmeStudioProps) {
  const [formData, setFormData] = useState<SozlesmeData>(() => ({
    ...SOZLESME_DEFAULT_DATA,
    ...initialData,
  }));

  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeTabMobile, setActiveTabMobile] = useState<"form" | "preview">("form");
  const [hasRenderedOnce, setHasRenderedOnce] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const [totalPages, setTotalPages] = useState(2);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const pdfDocRef = useRef<any>(null);
  const lastDataRef = useRef<string>("");
  const renderDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFieldChange = useCallback(
    (field: keyof SozlesmeData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleResetToPdfDefaults = useCallback(() => {
    setFormData({ ...SOZLESME_DEFAULT_DATA });
    lastDataRef.current = "";
  }, []);

  const handleClearAll = useCallback(() => {
    setFormData(
      Object.fromEntries(
        Object.keys(SOZLESME_DEFAULT_DATA).map((k) => [k, ""])
      ) as SozlesmeData
    );
    lastDataRef.current = "";
  }, []);

  const handleLocalFieldReset = useCallback((field: keyof SozlesmeData) => {
    setFormData((prev) => ({
      ...prev,
      [field]: SOZLESME_DEFAULT_DATA[field] ?? "",
    }));
  }, []);

  // ── PDF Rendering ──────────────────────────────────────────────────────────

  const renderPage = useCallback(
    async (pdfDoc: any, pageNum: number) => {
      if (!canvasRef.current || !previewContainerRef.current) return;

      const container = previewContainerRef.current;
      const containerW = container.clientWidth || 380;
      const containerH = container.clientHeight || 540;

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });

      const scaleW = containerW / viewport.width;
      const scaleH = containerH / viewport.height;
      const baseScale = Math.min(scaleW, scaleH) * 0.97;
      const scale = baseScale * (zoomLevel / 100);

      const scaledVp = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch { /* ignore */ }
        renderTaskRef.current = null;
      }

      canvas.width = scaledVp.width;
      canvas.height = scaledVp.height;

      const renderTask = page.render({ canvasContext: ctx, viewport: scaledVp });
      renderTaskRef.current = renderTask;
      await renderTask.promise;
      renderTaskRef.current = null;
      setHasRenderedOnce(true);
    },
    [zoomLevel]
  );

  const renderPdf = useCallback(async () => {
    const dataStr = JSON.stringify(formData) + previewPage;
    if (dataStr === lastDataRef.current) return;
    lastDataRef.current = dataStr;

    setIsGenerating(true);
    try {
      const [pdfBytes, pdfjsLib] = await Promise.all([
        generateSozlesmePdf(formData),
        loadBrowserPdfJs(),
      ]);
      if (!pdfjsLib) return;

      const pdfDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
      pdfDocRef.current = pdfDoc;
      setTotalPages(pdfDoc.numPages);
      await renderPage(pdfDoc, previewPage);
    } catch (err) {
      console.error("PDF render error:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [formData, previewPage, renderPage]);

  // Debounced render on data change
  useEffect(() => {
    if (renderDebounceRef.current) clearTimeout(renderDebounceRef.current);
    renderDebounceRef.current = setTimeout(() => {
      renderPdf();
    }, 350);
    return () => {
      if (renderDebounceRef.current) clearTimeout(renderDebounceRef.current);
    };
  }, [renderPdf]);

  // Re-render when mobile tab switches to preview
  useEffect(() => {
    if (activeTabMobile === "preview") {
      const t = setTimeout(() => {
        lastDataRef.current = "";
        renderPdf();
      }, 60);
      return () => clearTimeout(t);
    }
  }, [activeTabMobile, renderPdf]);

  // Re-render on zoom change
  useEffect(() => {
    if (!pdfDocRef.current) return;
    renderPage(pdfDocRef.current, previewPage);
  }, [zoomLevel, previewPage, renderPage]);

  const handleDownload = useCallback(async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadFilledSozlesmePdf(formData);
    } finally {
      setIsDownloading(false);
    }
  }, [formData, isDownloading]);

  // ── Field header with reset button ────────────────────────────────────────
  const renderFieldHeader = (
    fieldKey: keyof SozlesmeData,
    label: string,
    note?: string
  ) => {
    const isDirty = formData[fieldKey] !== SOZLESME_DEFAULT_DATA[fieldKey];
    return (
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <label className="text-[11px] font-bold text-foreground truncate">{label}</label>
          {note && (
            <span className="text-[9px] font-mono text-muted-foreground/80">{note}</span>
          )}
        </div>
        {isDirty && (
          <button
            type="button"
            onClick={() => handleLocalFieldReset(fieldKey)}
            className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-all shrink-0"
            title={`"${label}" alanını varsayılana sıfırla`}
          >
            <RotateCcw className="h-2.5 w-2.5" />
            <span>Sıfırla</span>
          </button>
        )}
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full h-full min-h-0 overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 shrink-0 bg-background/90 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[13px] font-bold leading-tight text-foreground truncate">
              Şantiye Şefi Hizmet Sözleşmesi
            </h2>
            <p className="text-[10px] text-muted-foreground hidden sm:block">
              2 sayfalı hizmet akdi — düzenle ve indir
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mobile tab toggle */}
          <div className="flex lg:hidden rounded-lg border border-border overflow-hidden text-[10px] font-semibold">
            <button
              onClick={() => setActiveTabMobile("form")}
              className={`px-2.5 py-1.5 transition-colors ${activeTabMobile === "form" ? "bg-amber-500 text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              Form
            </button>
            <button
              onClick={() => setActiveTabMobile("preview")}
              className={`px-2.5 py-1.5 transition-colors ${activeTabMobile === "preview" ? "bg-amber-500 text-white" : "text-muted-foreground hover:text-foreground"}`}
            >
              Önizle
            </button>
          </div>
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Split body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── LEFT: Form panel ── */}
        <div className={`flex-col min-h-0 overflow-y-auto border-r border-border/50 bg-background/60 ${activeTabMobile === "form" ? "flex" : "hidden lg:flex"} lg:w-[340px] xl:w-[380px] w-full`}>
          <div className="flex flex-col gap-2 p-2 sm:p-2.5">

            {/* Section 1: Taraflar */}
            <div className="rounded-lg border border-border/70 bg-card/60 p-2 sm:p-2.5 space-y-2">
              <div className="flex items-center justify-between border-b border-border/40 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <UserCheck className="h-3 w-3 text-amber-500" />
                  1. Taraflar
                </span>
              </div>

              <div>
                {renderFieldHeader("muteahhit_unvan", "Yapı Müteahhidi Unvanı")}
                <input
                  type="text"
                  value={formData.muteahhit_unvan || ""}
                  onChange={(e) => handleFieldChange("muteahhit_unvan", e.target.value)}
                  placeholder="ABC İNŞAAT"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div>
                {renderFieldHeader("santiye_sefi_ad", "Şantiye Şefi Adı Soyadı")}
                <input
                  type="text"
                  value={formData.santiye_sefi_ad || ""}
                  onChange={(e) => handleFieldChange("santiye_sefi_ad", e.target.value)}
                  placeholder="HÜSEYİN GÜNAYDIN"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Section 2: İşyeri */}
            <div className="rounded-lg border border-border/70 bg-card/60 p-2 sm:p-2.5 space-y-2">
              <div className="flex items-center justify-between border-b border-border/40 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-amber-500" />
                  2. İşyeri
                </span>
              </div>

              <div>
                {renderFieldHeader("is_yeri", "İşyeri Adresi", "(İl, İlçe, Mahalle, Ada, Parsel)")}
                <textarea
                  rows={3}
                  value={formData.is_yeri || ""}
                  onChange={(e) => handleFieldChange("is_yeri", e.target.value)}
                  placeholder="YOZGAT ili, AKDAĞMADENİ ilçesi, İSTANBULLUOĞLU MAHALLESİ, 368 ada, 2 parsel"
                  className="w-full rounded-md border border-border bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 resize-none"
                />
              </div>
            </div>

            {/* Section 3: Ücret ve Sözleşme */}
            <div className="rounded-lg border border-border/70 bg-card/60 p-2 sm:p-2.5 space-y-2">
              <div className="flex items-center justify-between border-b border-border/40 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3 text-amber-500" />
                  3. Ücret ve Sözleşme
                </span>
              </div>

              <div>
                {renderFieldHeader("ucret", "Aylık Brüt Ücret (Madde 5)")}
                <input
                  type="text"
                  value={formData.ucret || ""}
                  onChange={(e) => handleFieldChange("ucret", e.target.value)}
                  placeholder="40.000,00 TL"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  {renderFieldHeader("sozlesme_tarihi", "Sözleşme Tarihi (Madde 8)")}
                  <input
                    type="text"
                    value={formData.sozlesme_tarihi || ""}
                    onChange={(e) => handleFieldChange("sozlesme_tarihi", e.target.value)}
                    placeholder="01.05.2026"
                    className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  {renderFieldHeader("sozlesme_nushalari", "Nüsha Sayısı")}
                  <input
                    type="text"
                    value={formData.sozlesme_nushalari || ""}
                    onChange={(e) => handleFieldChange("sozlesme_nushalari", e.target.value)}
                    placeholder="2"
                    className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: İmza Alanları */}
            <div className="rounded-lg border border-border/70 bg-card/60 p-2 sm:p-2.5 space-y-2">
              <div className="flex items-center justify-between border-b border-border/40 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <UserCheck className="h-3 w-3 text-amber-500" />
                  4. İmza Alanları
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  {renderFieldHeader("santiye_sefi_imza_adi", "Şantiye Şefi Adı (İmza)")}
                  <input
                    type="text"
                    value={formData.santiye_sefi_imza_adi || ""}
                    onChange={(e) => handleFieldChange("santiye_sefi_imza_adi", e.target.value)}
                    placeholder="Hüseyin GÜNAYDIN"
                    className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  {renderFieldHeader("muteahhit_imza_unvan", "Müteahhit Unvanı (İmza)")}
                  <input
                    type="text"
                    value={formData.muteahhit_imza_unvan || ""}
                    onChange={(e) => handleFieldChange("muteahhit_imza_unvan", e.target.value)}
                    placeholder="ABC İNŞAAT"
                    className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-1 space-y-2 border-t border-border/60">
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetToPdfDefaults}
                  className="h-8 px-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3 mr-1 shrink-0" />
                  Varsayılana Dön
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-8 px-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="h-3 w-3 mr-1 shrink-0" />
                  Tümünü Temizle
                </Button>
              </div>

              {/* Desktop download */}
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="hidden lg:flex w-full h-9 gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                PDF İndir
              </Button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: PDF Preview panel ── */}
        <div className={`flex-col flex-1 min-h-0 overflow-hidden ${activeTabMobile === "preview" ? "flex" : "hidden lg:flex"}`}>
          {/* Preview toolbar */}
          <div className="flex items-center justify-between gap-2 border-b border-border/50 bg-background/50 px-3 py-1.5 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground">
                Canlı PDF Önizleme
              </span>
              {isGenerating && (
                <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
              )}
            </div>
            {/* Page navigation for 2-page doc */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPreviewPage(Math.max(1, previewPage - 1))}
                disabled={previewPage <= 1}
                className="rounded px-2 py-0.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
              >
                ‹ Önceki
              </button>
              <span className="text-[10px] font-mono text-muted-foreground px-1">
                {previewPage} / {totalPages}
              </span>
              <button
                onClick={() => setPreviewPage(Math.min(totalPages, previewPage + 1))}
                disabled={previewPage >= totalPages}
                className="rounded px-2 py-0.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
              >
                Sonraki ›
              </button>
            </div>
            {/* Zoom controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10px] font-mono text-muted-foreground w-9 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}
                className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas container */}
          <div
            ref={previewContainerRef}
            className={`relative flex-1 min-h-0 w-full overflow-auto bg-zinc-850 dark:bg-zinc-900 rounded-xl p-1.5 shadow-inner ${zoomLevel > 100 ? "block" : "flex items-center justify-center overflow-hidden"}`}
          >
            {isGenerating && !hasRenderedOnce && (
              <div className="sticky inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-zinc-300 bg-zinc-900/80 backdrop-blur-xs z-10 min-h-[260px]">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                <p className="text-xs font-semibold">Sözleşme PDF Derleniyor...</p>
              </div>
            )}
            <canvas
              ref={canvasRef}
              className={`bg-white rounded-md shadow-2xl transition-all block shrink-0 ${zoomLevel > 100 ? "mx-auto my-2" : "max-h-full max-w-full mx-auto my-auto"}`}
            />
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="flex lg:hidden items-center justify-between gap-2 border-t border-border bg-background/95 backdrop-blur-md px-3 py-2 shrink-0 shadow-lg z-20">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setActiveTabMobile(activeTabMobile === "form" ? "preview" : "form")}
          className="flex-1 h-9 gap-1.5 text-xs font-semibold"
        >
          {activeTabMobile === "form" ? (
            <>
              <Eye className="h-3.5 w-3.5 text-amber-500" />
              <span>Canlı PDF Önizle</span>
            </>
          ) : (
            <>
              <FileEdit className="h-3.5 w-3.5 text-amber-500" />
              <span>Formu Düzenle</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex-1 h-9 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md dark:bg-amber-500 dark:text-zinc-950"
        >
          {isDownloading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileDown className="h-3.5 w-3.5" />
          )}
          <span>PDF İndir</span>
        </Button>
      </div>
    </div>
  );
}
