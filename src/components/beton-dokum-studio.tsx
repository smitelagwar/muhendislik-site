"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileDown,
  FileEdit,
  FileText,
  Loader2,
  Maximize2,
  Printer,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Undo2,
  UserCheck,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BETON_DOKUM_DEFAULT_DATA,
  BetonDokumData,
  downloadFilledBetonDokumPdf,
  generateBetonDokumPdf,
} from "@/lib/pdf-engine";

interface BetonDokumStudioProps {
  initialData?: Partial<BetonDokumData>;
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

export function BetonDokumStudio({
  initialData,
  onClose,
  isModal = false,
}: BetonDokumStudioProps) {
  const [formData, setFormData] = useState<BetonDokumData>(() => ({
    ...BETON_DOKUM_DEFAULT_DATA,
    ...initialData,
  }));

  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [activeTabMobile, setActiveTabMobile] = useState<"form" | "preview">("form");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [syncStatus, setSyncStatus] = useState<"synced" | "updating" | "error">("updating");
  const [hasRenderedOnce, setHasRenderedOnce] = useState<boolean>(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);
  const latestPdfBytesRef = useRef<Uint8Array | null>(null);
  const cachedPdfDocRef = useRef<any>(null);
  const zoomLevelRef = useRef<number>(zoomLevel);
  zoomLevelRef.current = zoomLevel;

  // Field change handler
  const handleFieldChange = (key: keyof BetonDokumData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Local per-field reset handler: restores ONLY this specific field to original default
  const handleLocalFieldReset = (key: keyof BetonDokumData) => {
    setFormData((prev) => ({
      ...prev,
      [key]: BETON_DOKUM_DEFAULT_DATA[key],
    }));
  };

  // Global reset to original PDF default values (Sıfırla)
  const handleResetToPdfDefaults = () => {
    setFormData({ ...BETON_DOKUM_DEFAULT_DATA });
  };

  // Clear all fields (Temizle)
  const handleClearAll = () => {
    setFormData({
      tutanak_alt_baslik: "",
      tarih: "",
      yer: "",
      yibf: "",
      olay_aciklamasi: "",
      gozlem_notlar: "",
      laboratuvar: "",
      muteahhit: "",
      santiye_sefi: "",
      yapi_denetim: "",
    });
  };

  // Count filled fields
  const filledFieldCount = useMemo(() => {
    return Object.values(formData).filter((v) => (v || "").trim().length > 0).length;
  }, [formData]);

  // Render already loaded PDF Page onto Canvas at the requested zoom level (Instant 60fps)
  const renderPdfPage = useCallback(async (pdf: any, zoom: number) => {
    const canvas = canvasRef.current;
    const container = previewContainerRef.current;
    if (!canvas || !container || !pdf) return;

    try {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }

      const page = await pdf.getPage(1);
      const unscaledViewport = page.getViewport({ scale: 1.0 });

      const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
      const availableHeight = Math.max(220, container.clientHeight - (isMobile ? 8 : 12));
      const availableWidth = Math.max(220, container.clientWidth - (isMobile ? 8 : 12));

      let baseFitScale: number;
      if (isMobile) {
        baseFitScale = availableWidth / unscaledViewport.width;
      } else {
        const fitScaleByHeight = availableHeight / unscaledViewport.height;
        const fitScaleByWidth = availableWidth / unscaledViewport.width;
        baseFitScale = Math.min(fitScaleByHeight, fitScaleByWidth);
      }

      const effectiveScale = baseFitScale * (zoom / 100);
      const pixelRatio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const viewport = page.getViewport({ scale: effectiveScale });

      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);

      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;

      await renderTask.promise;
      setHasRenderedOnce(true);
    } catch (err: any) {
      if (err?.name === "RenderingCancelledException") return;
      console.error("Canvas render error:", err);
    }
  }, []);

  // Debounced PDF Generation (Triggers ONLY when formData changes)
  useEffect(() => {
    setSyncStatus("updating");
    setIsGenerating(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const bytes = await generateBetonDokumPdf(formData);
        const storedBytes = new Uint8Array(bytes.byteLength);
        storedBytes.set(bytes);
        latestPdfBytesRef.current = storedBytes;

        if (activeBlobUrlRef.current) {
          URL.revokeObjectURL(activeBlobUrlRef.current);
        }
        const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        activeBlobUrlRef.current = url;
        setBlobUrl(url);

        const pdfjs = await loadBrowserPdfJs();
        if (pdfjs) {
          const clonedBytes = new Uint8Array(storedBytes.byteLength);
          clonedBytes.set(storedBytes);

          const loadingTask = pdfjs.getDocument({
            data: clonedBytes,
            cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
            cMapPacked: true,
          });

          const pdf = await loadingTask.promise;
          cachedPdfDocRef.current = pdf;

          await renderPdfPage(pdf, zoomLevelRef.current);
        }

        setSyncStatus("synced");
        setIsGenerating(false);
      } catch (error) {
        console.error("PDF generation failure:", error);
        setSyncStatus("error");
        setIsGenerating(false);
      }
    }, 150);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData, renderPdfPage]);

  // Instant Redraw when zoomLevel changes (NO PDF recompilation, NO sync status change)
  useEffect(() => {
    if (cachedPdfDocRef.current) {
      renderPdfPage(cachedPdfDocRef.current, zoomLevel);
    }
  }, [zoomLevel, renderPdfPage]);

  // Window / container resize observer to keep canvas perfectly fitted
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    let resizeTimer: NodeJS.Timeout | null = null;
    const observer = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (cachedPdfDocRef.current) {
          renderPdfPage(cachedPdfDocRef.current, zoomLevelRef.current);
        }
      }, 50);
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, [renderPdfPage]);

  // Re-render canvas when switching to preview tab on mobile
  useEffect(() => {
    if (activeTabMobile === "preview" && cachedPdfDocRef.current) {
      setTimeout(() => {
        if (cachedPdfDocRef.current) {
          renderPdfPage(cachedPdfDocRef.current, zoomLevelRef.current);
        }
      }, 50);
    }
  }, [activeTabMobile, renderPdfPage]);

  // Ctrl + Mouse Wheel (or Trackpad Pinch) Zoom & Keyboard Zoom (+ / - / 0)
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        if (e.deltaY < 0) {
          // Wheel up -> Zoom In
          setZoomLevel((prev) => Math.min(250, prev + 25));
        } else if (e.deltaY > 0) {
          // Wheel down -> Zoom Out
          setZoomLevel((prev) => Math.max(50, prev - 25));
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        setZoomLevel((prev) => Math.min(250, prev + 25));
      } else if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        setZoomLevel((prev) => Math.max(50, prev - 25));
      } else if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
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

  useEffect(() => {
    return () => {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      }
    };
  }, []);

  // Download filled PDF
  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadFilledBetonDokumPdf(formData);
    } catch (err) {
      console.error("Download error:", err);
      alert("PDF indirilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Direct print
  const handlePrint = async () => {
    try {
      if (blobUrl) {
        const printWindow = window.open(blobUrl);
        if (printWindow) {
          printWindow.focus();
          return;
        }
      }
      window.print();
    } catch {
      window.print();
    }
  };

  // Helper component for label with per-field reset button
  const renderFieldHeader = (
    label: string,
    fieldKey: keyof BetonDokumData,
    badge?: string
  ) => {
    const isModified = formData[fieldKey] !== BETON_DOKUM_DEFAULT_DATA[fieldKey];

    return (
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <label className="text-[11px] font-bold text-foreground truncate">
            {label}
          </label>
          {badge && (
            <span className="text-[9px] font-mono text-muted-foreground/80">
              {badge}
            </span>
          )}
        </div>

        {/* Local Reset Button (Only appears when field is modified) */}
        {isModified && (
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

  // Lock window/body scroll when studio is active in full page mode
  useEffect(() => {
    if (isModal) return;
    if (typeof window !== "undefined") {
      const htmlEl = document.documentElement;
      const bodyEl = document.body;

      const prevHtmlOverflow = htmlEl.style.overflow;
      const prevBodyOverflow = bodyEl.style.overflow;

      htmlEl.style.overflow = "hidden";
      bodyEl.style.overflow = "hidden";

      return () => {
        htmlEl.style.overflow = prevHtmlOverflow;
        bodyEl.style.overflow = prevBodyOverflow;
      };
    }
  }, [isModal]);

  return (
    <div
      data-studio-locked="true"
      className={`flex flex-col bg-background text-foreground w-full h-full overflow-hidden ${isModal
        ? "max-h-[96vh] rounded-2xl border border-border shadow-2xl"
        : "rounded-xl sm:rounded-2xl border border-border bg-card/40 shadow-xl backdrop-blur-md"
        }`}
    >
      {/* Mobile Segmented Tab Switcher (Visible only on Mobile/Tablet) */}
      <div className="flex lg:hidden border-b border-border bg-muted/50 p-1.5 shrink-0 gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTabMobile("form")}
          className={`flex-1 py-1.5 px-3 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTabMobile === "form"
            ? "bg-background text-foreground shadow-xs ring-1 ring-border"
            : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            }`}
        >
          <FileEdit className="h-3.5 w-3.5 text-amber-500" />
          <span>Form Alanları</span>
          <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-mono text-amber-800 dark:text-amber-300">
            {filledFieldCount}/10
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabMobile("preview")}
          className={`flex-1 py-1.5 px-3 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTabMobile === "preview"
            ? "bg-background text-foreground shadow-xs ring-1 ring-border"
            : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            }`}
        >
          <Eye className="h-3.5 w-3.5 text-amber-500" />
          <span>Canlı PDF Önizle</span>
          {syncStatus === "updating" ? (
            <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      {/* Main Split Layout: Left Form & Right Live PDF (Maximized height, zero outer scroll) */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Left Column: Form Inputs & Action Buttons (Independent vertical scroll inside form) */}
        <div
          className={`w-full lg:w-[410px] xl:w-[450px] shrink-0 h-full overflow-y-auto p-2.5 sm:p-3.5 space-y-2.5 ${activeTabMobile === "form" ? "block" : "hidden lg:block"
            }`}
        >
          {/* Top Title & Sync Status (Desktop compact inline) */}
          <div className="hidden lg:flex items-center justify-between pb-1 border-b border-border/60">
            <div className="flex items-center gap-1.5">
              <FileEdit className="h-3.5 w-3.5 text-amber-500" />
              <h2 className="text-xs font-bold text-foreground">
                Beton Döküm Tutanağı (AcroForm)
              </h2>
            </div>
            {syncStatus === "updating" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                <span>Derleniyor</span>
              </span>
            )}
            {syncStatus === "synced" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                <span>Canlı Senkron</span>
              </span>
            )}
          </div>

          {/* 1. Tutanak Alt Başlığı */}
          <div className="rounded-lg border border-border/80 bg-card/60 p-2">
            {renderFieldHeader("Tutanak Alt Başlığı", "tutanak_alt_baslik")}
            <input
              type="text"
              value={formData.tutanak_alt_baslik || ""}
              onChange={(e) => handleFieldChange("tutanak_alt_baslik", e.target.value)}
              placeholder="Beton Dökümü Sistem Onay Sorunu"
              className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
            />
          </div>

          {/* 2. Tarih & 3. YİBF */}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-border/80 bg-card/60 p-2">
              {renderFieldHeader("Tarih", "tarih")}
              <input
                type="text"
                value={formData.tarih || ""}
                onChange={(e) => handleFieldChange("tarih", e.target.value)}
                placeholder="10.08.2026"
                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
            </div>

            <div
              className={`rounded-lg border p-2 transition-colors ${(formData.yibf || "").trim().length > 7
                ? "border-red-500/60 bg-red-500/[0.04] dark:bg-red-950/20"
                : "border-border/80 bg-card/60"
                }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                  <label className="text-[11px] font-bold text-foreground truncate">
                    YİBF No
                  </label>
                  {(formData.yibf || "").trim().length > 7 ? (
                    <span className="text-[10px] font-semibold text-red-600 dark:text-red-400">
                      (YİBF No normalde 7 haneli olmalıdır, kontrol ediniz)
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-muted-foreground/80">
                      (7 Hane)
                    </span>
                  )}
                </div>

                {formData.yibf !== BETON_DOKUM_DEFAULT_DATA.yibf && (
                  <button
                    type="button"
                    onClick={() => handleLocalFieldReset("yibf")}
                    className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-all shrink-0"
                    title='"YİBF No" alanını varsayılana sıfırla'
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    <span>Sıfırla</span>
                  </button>
                )}
              </div>

              <input
                type="text"
                inputMode="numeric"
                value={formData.yibf || ""}
                onChange={(e) => handleFieldChange("yibf", e.target.value)}
                placeholder="2560855"
                className={`h-8 w-full rounded-md border px-2.5 text-xs font-mono font-semibold transition-colors placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 ${(formData.yibf || "").trim().length > 7
                  ? "border-red-500 text-red-600 dark:text-red-400 focus:border-red-500 focus:ring-red-500/20"
                  : "border-border bg-background text-foreground focus:border-amber-500 focus:ring-amber-500/20"
                  }`}
              />
            </div>
          </div>

          {/* 4. Şantiye Yeri */}
          <div className="rounded-lg border border-border/80 bg-card/60 p-2">
            {renderFieldHeader("Şantiye Yeri", "yer", "(İl/İlçe/Mahalle/Ada/Parsel)")}
            <textarea
              rows={2}
              value={formData.yer || ""}
              onChange={(e) => handleFieldChange("yer", e.target.value)}
              placeholder="YOZGAT İli AKDAĞMADENİ İlçesi İSTANBULLUOĞLU Mahallesi 666 ada 6 parsel"
              className="w-full rounded-md border border-border bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 resize-none"
            />
          </div>

          {/* 5. Olay Açıklaması */}
          <div className="rounded-lg border border-border/80 bg-card/60 p-2">
            {renderFieldHeader("Olay Açıklaması", "olay_aciklamasi")}
            <textarea
              rows={3}
              value={formData.olay_aciklamasi || ""}
              onChange={(e) => handleFieldChange("olay_aciklamasi", e.target.value)}
              placeholder="Yukarıda belirtilen şantiye adresinde gerçekleştirilen beton dökümü sırasında..."
              className="w-full rounded-md border border-border bg-background p-2 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 resize-none"
            />
          </div>

          {/* 6. Gözlem ve Notlar */}
          <div className="rounded-lg border border-border/80 bg-card/60 p-2">
            {renderFieldHeader("Gözlem ve Notlar", "gozlem_notlar")}
            <textarea
              rows={2}
              value={formData.gozlem_notlar || ""}
              onChange={(e) => handleFieldChange("gozlem_notlar", e.target.value)}
              placeholder="Beton dökümü gerçekleştirilmiştir..."
              className="w-full rounded-md border border-border bg-background p-2 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 resize-none"
            />
          </div>

          {/* 7-10. İmzacı Taraflar (4 Taraf) */}
          <div className="rounded-lg border border-border/80 bg-card/60 p-2 space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              İmzacı Taraflar
            </h3>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                {renderFieldHeader("1. Laboratuvar", "laboratuvar")}
                <input
                  type="text"
                  value={formData.laboratuvar || ""}
                  onChange={(e) => handleFieldChange("laboratuvar", e.target.value)}
                  placeholder="MEREN BETON LAB. LTD. ŞTİ"
                  className="h-7.5 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div>
                {renderFieldHeader("2. Müteahhit", "muteahhit")}
                <input
                  type="text"
                  value={formData.muteahhit || ""}
                  onChange={(e) => handleFieldChange("muteahhit", e.target.value)}
                  placeholder="ABC İNŞAAT"
                  className="h-7.5 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div>
                {renderFieldHeader("3. Şantiye Şefi", "santiye_sefi")}
                <input
                  type="text"
                  value={formData.santiye_sefi || ""}
                  onChange={(e) => handleFieldChange("santiye_sefi", e.target.value)}
                  placeholder="İnş. Müh. Hüseyin GÜNAYDIN"
                  className="h-7.5 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div>
                {renderFieldHeader("4. Yapı Denetim", "yapi_denetim")}
                <input
                  type="text"
                  value={formData.yapi_denetim || ""}
                  onChange={(e) => handleFieldChange("yapi_denetim", e.target.value)}
                  placeholder="XYZ YAPI DENETİM LTD. ŞTİ."
                  className="h-7.5 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons Panel (Right below İmzacı Taraflar) */}
          <div className="pt-2 space-y-2 border-t border-border/60">
            {/* Secondary Action Row: Sıfırla, Temizle, Boş Form, Yazdır */}
            <div className="grid grid-cols-4 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetToPdfDefaults}
                className="h-8 px-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                title="Tüm alanları orijinal PDF varsayılanlarına sıfırla"
              >
                <RotateCcw className="h-3 w-3 mr-1 shrink-0" />
                <span>Sıfırla</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="h-8 px-1 text-[11px] font-semibold text-muted-foreground hover:text-rose-600 hover:border-rose-500/40"
                title="Tüm alanları temizle"
              >
                <Trash2 className="h-3 w-3 mr-1 shrink-0" />
                <span>Temizle</span>
              </Button>

              <a
                href="/belgeler/beton-dokum-tutanagi.pdf"
                download="BETON_DOKUM_TUTANAGI_BOS_SABLON.pdf"
                className="inline-flex items-center justify-center h-8 rounded-md border border-border bg-background px-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                title="Doldurulmamış boş şablonu indir"
              >
                <Download className="h-3 w-3 mr-1 shrink-0" />
                <span>Boş Form</span>
              </a>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-8 px-1 text-[11px] font-semibold"
                title="Yazdır"
              >
                <Printer className="h-3 w-3 mr-1 shrink-0" />
                <span>Yazdır</span>
              </Button>
            </div>

            {/* Primary Action Button: Doldurulmuş PDF'i İndir */}
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full h-10 gap-2 bg-amber-600 text-xs font-bold text-white shadow-md transition-all hover:bg-amber-700 active:scale-[0.98] dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              <span>Doldurulmuş PDF'i İndir</span>
            </Button>
          </div>
        </div>

        {/* Right Column: Full-Height Live PDF Canvas Panel (Starts right at top, fits 100% viewport) */}
        <div
          className={`flex-1 h-full min-w-0 flex flex-col justify-between bg-zinc-900/10 dark:bg-zinc-950/40 p-2 sm:p-2.5 overflow-hidden ${activeTabMobile === "preview" ? "block" : "hidden lg:flex"
            }`}
        >
          {/* Top Mini Control Bar (Zoom, Fit, Open) */}
          <div className="flex items-center justify-between mb-1 px-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Canlı Belge Önizlemesi
              </span>
              <span className="hidden sm:inline-flex items-center text-[10px] text-muted-foreground/80">
                (Otomatik Tam Sayfa Sığdırma)
              </span>
            </div>

            {/* Zoom & View Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                title="Genişliğe ve yüksekliğe tam sığdır (%100)"
              >
                Sığdır
              </button>

              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                  className="rounded-md border border-border bg-background p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  title="Uzaklaştır"
                >
                  <ZoomOut className="h-3 w-3" />
                </button>
                <span className="text-[10px] font-mono font-semibold px-1 text-muted-foreground min-w-[36px] text-center">
                  %{zoomLevel}
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(250, z + 25))}
                  className="rounded-md border border-border bg-background p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  title="Yakınlaştır"
                >
                  <ZoomIn className="h-3 w-3" />
                </button>
              </div>

              {blobUrl && (
                <a
                  href={blobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                  title="Yeni sekmede tam ekran aç"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span className="hidden sm:inline">Tam Ekran</span>
                </a>
              )}
            </div>
          </div>

          {/* Canvas Viewport Container: Maximized vertical area, local internal scroll when zoomed */}
          <div
            ref={previewContainerRef}
            className={`relative flex-1 min-h-0 w-full overflow-auto bg-zinc-850 dark:bg-zinc-900 rounded-xl p-1.5 shadow-inner ${zoomLevel > 100 ? "block" : "flex items-center justify-center overflow-hidden"
              }`}
          >
            {isGenerating && !hasRenderedOnce && (
              <div className="sticky inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-zinc-300 bg-zinc-900/80 backdrop-blur-xs z-10 min-h-[260px]">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                <p className="text-xs font-semibold">Resmi PDF Derleniyor...</p>
              </div>
            )}

            {/* Auto-Fitted Full A4 Canvas (centered, scrollable when zoomed in) */}
            <canvas
              ref={canvasRef}
              className={`bg-white rounded-md shadow-2xl transition-all block shrink-0 ${zoomLevel > 100
                ? "mx-auto my-2"
                : "max-h-full max-w-full mx-auto my-auto"
                }`}
            />
          </div>

          {/* Mobile Preview Bottom Bar */}
          <div className="flex lg:hidden items-center gap-2 pt-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTabMobile("form")}
              className="flex-1 h-9 gap-1.5 text-xs font-semibold"
            >
              <FileEdit className="h-3.5 w-3.5 text-amber-500" />
              <span>Formu Düzenle</span>
            </Button>

            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 h-9 gap-1.5 bg-amber-600 text-xs font-bold text-white dark:bg-amber-500 dark:text-zinc-950"
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileDown className="h-3.5 w-3.5" />
              )}
              <span>İndir</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
