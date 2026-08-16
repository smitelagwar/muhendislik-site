"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
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

interface PdfViewport {
  width: number;
  height: number;
}

interface PdfRenderTask {
  promise: Promise<void>;
  cancel: () => void;
}

interface PdfPageProxy {
  getViewport: (options: { scale: number }) => PdfViewport;
  render: (options: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewport;
  }) => PdfRenderTask;
}

interface PdfDocumentProxy {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageProxy>;
  destroy: () => Promise<void>;
}

interface PdfJsLibrary {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (options: { data: Uint8Array }) => { promise: Promise<PdfDocumentProxy> };
}

declare global {
  interface Window {
    pdfjsLib?: PdfJsLibrary;
  }
}

// Safely load PDF.js in browser
async function loadBrowserPdfJs(): Promise<PdfJsLibrary | null> {
  if (typeof window === "undefined") return null;
  if (window.pdfjsLib) return window.pdfjsLib;

  return new Promise<PdfJsLibrary>((resolve, reject) => {
    const existing = document.getElementById("pdfjs-dist-script");
    if (existing) {
      const check = setInterval(() => {
        if (window.pdfjsLib) {
          clearInterval(check);
          resolve(window.pdfjsLib);
        }
      }, 50);
      return;
    }

    const script = document.createElement("script");
    script.id = "pdfjs-dist-script";
    script.src = "/vendor/pdfjs/pdf.min.js";
    script.onload = () => {
      const pdfjs = window.pdfjsLib;
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
        const cdnPdfjs = window.pdfjsLib;
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
  const [renderError, setRenderError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<PdfRenderTask | null>(null);
  const pdfDocRef = useRef<PdfDocumentProxy | null>(null);
  const lastDataRef = useRef<string>("");
  const renderDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFieldChange = useCallback(
    (field: keyof SozlesmeData, value: string) => {
      setFormData((prev) => {
        const next = { ...prev, [field]: value };
        if (
          field === "santiye_sefi_ad" &&
          prev.santiye_sefi_imza_adi?.toLocaleUpperCase("tr-TR") ===
            prev.santiye_sefi_ad?.toLocaleUpperCase("tr-TR")
        ) {
          next.santiye_sefi_imza_adi = value;
        }
        if (
          field === "muteahhit_unvan" &&
          prev.muteahhit_imza_unvan === prev.muteahhit_unvan
        ) {
          next.muteahhit_imza_unvan = value;
        }
        return next;
      });
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
    async (pdfDoc: PdfDocumentProxy, pageNum: number) => {
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
      try {
        await renderTask.promise;
      } catch (error: unknown) {
        if (!(error instanceof Error) || error.name !== "RenderingCancelledException") throw error;
      }
      renderTaskRef.current = null;
      setHasRenderedOnce(true);
    },
    [zoomLevel]
  );

  const renderPdf = useCallback(async () => {
    const dataStr = JSON.stringify(formData);
    if (dataStr === lastDataRef.current) return;
    lastDataRef.current = dataStr;

    setIsGenerating(true);
    setRenderError(null);
    try {
      const [pdfBytes, pdfjsLib] = await Promise.all([
        generateSozlesmePdf(formData),
        loadBrowserPdfJs(),
      ]);
      if (!pdfjsLib) return;

      const pdfDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
      const previousPdf = pdfDocRef.current;
      pdfDocRef.current = pdfDoc;
      setTotalPages(pdfDoc.numPages);
      await renderPage(pdfDoc, previewPage);
      if (previousPdf && previousPdf !== pdfDoc) {
        void previousPdf.destroy().catch(() => undefined);
      }
    } catch (err) {
      console.error("PDF render error:", err);
      lastDataRef.current = "";
      setRenderError("Önizleme oluşturulamadı. Alanları kontrol edip yeniden deneyin.");
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
        if (pdfDocRef.current) renderPage(pdfDocRef.current, previewPage);
        else renderPdf();
      }, 60);
      return () => clearTimeout(t);
    }
  }, [activeTabMobile, previewPage, renderPage, renderPdf]);

  // Re-render on zoom change
  useEffect(() => {
    if (!pdfDocRef.current) return;
    renderPage(pdfDocRef.current, previewPage);
  }, [zoomLevel, previewPage, renderPage]);

  // Panel boyutu değiştiğinde önbellekteki PDF'i yeni alana tekrar sığdır.
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    let animationFrame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        if (pdfDocRef.current) {
          void renderPage(pdfDocRef.current, previewPage);
        }
      });
    });
    observer.observe(container);
    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, [previewPage, renderPage]);

  // PDF alanındayken Ctrl/Cmd + tekerlek yalnızca önizlemeyi yakınlaştırır.
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      event.stopPropagation();
      setZoomLevel((current) =>
        Math.min(200, Math.max(50, current + (event.deltaY < 0 ? 10 : -10)))
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setZoomLevel((current) => Math.min(200, current + 10));
      } else if (event.key === "-") {
        event.preventDefault();
        setZoomLevel((current) => Math.max(50, current - 10));
      } else if (event.key === "0") {
        event.preventDefault();
        setZoomLevel(100);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      container.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Tam sayfa stüdyosunda yalnızca form ve PDF panelleri kaydırılabilir.
  useEffect(() => {
    if (isModal) return;
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    const previousHtmlOverflow = htmlElement.style.overflow;
    const previousBodyOverflow = bodyElement.style.overflow;

    htmlElement.style.overflow = "hidden";
    bodyElement.style.overflow = "hidden";
    return () => {
      htmlElement.style.overflow = previousHtmlOverflow;
      bodyElement.style.overflow = previousBodyOverflow;
    };
  }, [isModal]);

  useEffect(() => {
    return () => {
      renderTaskRef.current?.cancel?.();
      void pdfDocRef.current?.destroy?.().catch?.(() => undefined);
    };
  }, []);

  const handleDownload = useCallback(async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadFilledSozlesmePdf(formData);
    } catch (error) {
      console.error("PDF download error:", error);
      window.alert("PDF indirilirken bir sorun oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsDownloading(false);
    }
  }, [formData, isDownloading]);

  const yibfInvalid = Boolean(
    formData.yibf && formData.yibf !== "-" && !/^\d{7}$/.test(formData.yibf)
  );
  const dateInvalid = Boolean(
    formData.sozlesme_tarihi && !/^\d{2}\.\d{2}\.\d{4}$/.test(formData.sozlesme_tarihi)
  );

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
    <div
      data-studio-locked="true"
      className="flex flex-col w-full h-full min-h-0 overflow-hidden bg-background"
    >
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
        <div className={`flex-col min-h-0 overflow-y-auto overscroll-contain border-r border-border/50 bg-background/60 ${activeTabMobile === "form" ? "flex" : "hidden lg:flex"} lg:w-[340px] xl:w-[380px] w-full`}>
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
                  maxLength={36}
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
                  maxLength={35}
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  {renderFieldHeader("il", "İl")}
                  <input
                    type="text"
                    maxLength={18}
                    value={formData.il || ""}
                    onChange={(e) => handleFieldChange("il", e.target.value)}
                    placeholder="YOZGAT"
                    className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-center text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  {renderFieldHeader("ilce", "İlçe")}
                  <input
                    type="text"
                    maxLength={22}
                    value={formData.ilce || ""}
                    onChange={(e) => handleFieldChange("ilce", e.target.value)}
                    placeholder="AKDAĞMADENİ"
                    className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-center text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div>
                {renderFieldHeader("adres", "Açık Adres")}
                <input
                  type="text"
                  maxLength={48}
                  value={formData.adres || ""}
                  onChange={(e) => handleFieldChange("adres", e.target.value)}
                  placeholder="-"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-[2fr_1fr_1fr] gap-2">
                <div>
                  {renderFieldHeader("mahalle", "Mahalle")}
                  <input
                    type="text"
                    maxLength={32}
                    value={formData.mahalle || ""}
                    onChange={(e) => handleFieldChange("mahalle", e.target.value)}
                    placeholder="EMEK MAHALLESİ"
                    className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  {renderFieldHeader("ada", "Ada")}
                  <input
                    type="text"
                    maxLength={8}
                    value={formData.ada || ""}
                    onChange={(e) => handleFieldChange("ada", e.target.value)}
                    placeholder="666"
                    className="h-8 w-full rounded-md border border-border bg-background px-2 text-center text-xs font-mono text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  {renderFieldHeader("parsel", "Parsel")}
                  <input
                    type="text"
                    maxLength={8}
                    value={formData.parsel || ""}
                    onChange={(e) => handleFieldChange("parsel", e.target.value)}
                    placeholder="66"
                    className="h-8 w-full rounded-md border border-border bg-background px-2 text-center text-xs font-mono text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[2fr_1fr] gap-2">
                <div>
                  {renderFieldHeader("yibf", "YİBF No")}
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={7}
                    value={formData.yibf || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleFieldChange("yibf", value === "-" ? "-" : value.replace(/\D/g, ""));
                    }}
                    placeholder="-"
                    aria-invalid={yibfInvalid}
                    className={`h-8 w-full rounded-md border bg-background px-2 text-center text-xs font-mono text-foreground focus:outline-none focus:ring-1 ${yibfInvalid ? "border-red-500 focus:ring-red-500/20" : "border-border focus:border-amber-500 focus:ring-amber-500/20"}`}
                  />
                </div>
                <div>
                  {renderFieldHeader("pafta", "Pafta")}
                  <input
                    type="text"
                    maxLength={12}
                    value={formData.pafta || ""}
                    onChange={(e) => handleFieldChange("pafta", e.target.value)}
                    placeholder="-"
                    className="h-8 w-full rounded-md border border-border bg-background px-2 text-center text-xs font-mono text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              </div>
              {yibfInvalid && <p className="text-[9px] leading-tight text-red-500">YİBF 7 rakam olmalı.</p>}
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
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-center text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div>
                {renderFieldHeader("sozlesme_tarihi", "Sözleşme Tarihi (Madde 8)")}
                <input
                  type="text"
                  value={formData.sozlesme_tarihi || ""}
                  onChange={(e) => handleFieldChange("sozlesme_tarihi", e.target.value)}
                  placeholder="01.05.2026"
                  aria-invalid={dateInvalid}
                  className={`h-8 w-full rounded-md border bg-background px-2.5 text-center text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 ${dateInvalid ? "border-red-500 focus:ring-red-500/20" : "border-border focus:border-amber-500 focus:ring-amber-500/20"}`}
                />
                {dateInvalid && <p className="mt-1 text-[9px] text-red-500">GG.AA.YYYY biçimini kullanın.</p>}
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
                    maxLength={35}
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
                    maxLength={36}
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
              {isGenerating ? (
                <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
              ) : renderError ? (
                <AlertCircle className="h-3 w-3 text-red-500" aria-label="Önizleme hatası" />
              ) : hasRenderedOnce ? (
                <CheckCircle2 className="h-3 w-3 text-emerald-500" aria-label="Önizleme güncel" />
              ) : null}
              {renderError && (
                <span className="hidden xl:inline text-[9px] text-red-500">{renderError}</span>
              )}
            </div>
            {/* Page navigation for 2-page doc */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPreviewPage((page) => Math.max(1, page - 1))}
                disabled={previewPage <= 1}
                aria-label="Önceki PDF sayfası"
                className="rounded px-2 py-0.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
              >
                ‹ Önceki
              </button>
              <span className="text-[10px] font-mono text-muted-foreground px-1">
                {previewPage} / {totalPages}
              </span>
              <button
                onClick={() => setPreviewPage((page) => Math.min(totalPages, page + 1))}
                disabled={previewPage >= totalPages}
                aria-label="Sonraki PDF sayfası"
                className="rounded px-2 py-0.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
              >
                Sonraki ›
              </button>
            </div>
            {/* Zoom controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                aria-label="Önizlemeyi küçült"
                className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10px] font-mono text-muted-foreground w-9 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}
                aria-label="Önizlemeyi büyüt"
                className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas container */}
          <div
            ref={previewContainerRef}
            className={`relative flex-1 min-h-0 w-full overflow-auto overscroll-contain bg-zinc-850 dark:bg-zinc-900 rounded-xl p-1.5 shadow-inner ${zoomLevel > 100 ? "block" : "flex items-center justify-center overflow-hidden"}`}
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
