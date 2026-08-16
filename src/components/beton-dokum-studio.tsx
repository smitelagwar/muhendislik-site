"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  Calendar,
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

  // Field change handler
  const handleFieldChange = (key: keyof BetonDokumData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Reset to original PDF default values (Sıfırla)
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

  // Render PDF onto Canvas fitting the entire page (height & width) into view
  const renderPdfToCanvas = useCallback(
    async (pdfBytes: Uint8Array, zoom: number) => {
      const canvas = canvasRef.current;
      const container = previewContainerRef.current;
      if (!canvas || !container) return;

      try {
        const pdfjs = await loadBrowserPdfJs();
        if (!pdfjs) return;

        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // ignore
          }
        }

        const loadingTask = pdfjs.getDocument({
          data: pdfBytes,
          cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        // Native unscaled A4 viewport (595.28 x 841.89 pt)
        const unscaledViewport = page.getViewport({ scale: 1.0 });

        // Available dimensions inside container (with tight margin for max size)
        const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
        const availableHeight = Math.max(260, container.clientHeight - (isMobile ? 12 : 16));
        const availableWidth = Math.max(260, container.clientWidth - (isMobile ? 12 : 16));

        // Calculate fit scale: entire page fits vertically & horizontally at zoom 100%
        let baseFitScale: number;
        if (isMobile) {
          baseFitScale = availableWidth / unscaledViewport.width;
        } else {
          const fitScaleByHeight = availableHeight / unscaledViewport.height;
          const fitScaleByWidth = availableWidth / unscaledViewport.width;
          baseFitScale = Math.min(fitScaleByHeight, fitScaleByWidth);
        }

        const effectiveScale = baseFitScale * (zoom / 100);

        // High resolution multiplier for crystal-clear text
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
        setSyncStatus("synced");
        setHasRenderedOnce(true);
      } catch (err: any) {
        if (err?.name === "RenderingCancelledException") return;
        console.error("Canvas render error:", err);
        setSyncStatus("error");
      }
    },
    []
  );

  // Debounced PDF Generation
  const updatePdfPreview = useCallback(
    async (dataToRender: BetonDokumData, zoom: number) => {
      setSyncStatus("updating");
      setIsGenerating(true);

      try {
        const pdfBytes = await generateBetonDokumPdf(dataToRender, { flatten: false });
        latestPdfBytesRef.current = pdfBytes;

        const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
        const newUrl = URL.createObjectURL(blob);
        if (activeBlobUrlRef.current) {
          URL.revokeObjectURL(activeBlobUrlRef.current);
        }
        activeBlobUrlRef.current = newUrl;
        setBlobUrl(newUrl);

        await renderPdfToCanvas(pdfBytes, zoom);
      } catch (err) {
        console.error("PDF preview error:", err);
        setSyncStatus("error");
      } finally {
        setIsGenerating(false);
      }
    },
    [renderPdfToCanvas]
  );

  // Watch formData & zoomLevel
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setSyncStatus("updating");
    debounceTimerRef.current = setTimeout(() => {
      updatePdfPreview(formData, zoomLevel);
    }, 240);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData, zoomLevel, updatePdfPreview]);

  // Window / container resize observer to keep canvas perfectly fitted
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    let resizeTimer: NodeJS.Timeout | null = null;
    const observer = new ResizeObserver(() => {
      if (latestPdfBytesRef.current) {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (latestPdfBytesRef.current) {
            renderPdfToCanvas(latestPdfBytesRef.current, zoomLevel);
          }
        }, 100);
      }
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, [zoomLevel, renderPdfToCanvas]);

  // Re-render canvas when switching to preview tab on mobile
  useEffect(() => {
    if (activeTabMobile === "preview" && latestPdfBytesRef.current) {
      setTimeout(() => {
        if (latestPdfBytesRef.current) {
          renderPdfToCanvas(latestPdfBytesRef.current, zoomLevel);
        }
      }, 50);
    }
  }, [activeTabMobile, zoomLevel, renderPdfToCanvas]);

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

  return (
    <div
      className={`flex flex-col bg-background text-foreground w-full ${
        isModal
          ? "h-full max-h-[96vh] overflow-hidden rounded-2xl border border-border shadow-2xl"
          : "h-[calc(100vh-68px)] min-h-[580px] max-h-[100vh] rounded-xl sm:rounded-2xl border border-border bg-card/40 shadow-xl backdrop-blur-md overflow-hidden"
      }`}
    >
      {/* Mobile Segmented Tab Switcher (Visible only on Mobile/Tablet) */}
      <div className="flex lg:hidden border-b border-border bg-muted/50 p-1.5 shrink-0 gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTabMobile("form")}
          className={`flex-1 py-1.5 px-3 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTabMobile === "form"
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
          className={`flex-1 py-1.5 px-3 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTabMobile === "preview"
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

      {/* Main Split Layout: Left Form (with action buttons at bottom) & Right Full Live PDF (Maximized height) */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Left Column: Form Inputs & Action Buttons (Independent vertical scroll inside form) */}
        <div
          className={`w-full lg:w-[410px] xl:w-[450px] shrink-0 h-full overflow-y-auto p-3 sm:p-3.5 space-y-2.5 ${
            activeTabMobile === "form" ? "block" : "hidden lg:block"
          }`}
        >
          {/* Top Title & Sync Status (Desktop compact inline) */}
          <div className="hidden lg:flex items-center justify-between pb-1 border-b border-border/60">
            <div className="flex items-center gap-1.5">
              <FileEdit className="h-4 w-4 text-amber-500" />
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

          {/* Tutanak Alt Başlığı */}
          <div className="rounded-lg border border-border/80 bg-card/60 p-2 space-y-1">
            <label className="block text-[11px] font-bold text-foreground">
              Tutanak Alt Başlığı
            </label>
            <input
              type="text"
              value={formData.tutanak_alt_baslik || ""}
              onChange={(e) => handleFieldChange("tutanak_alt_baslik", e.target.value)}
              placeholder="Beton Dökümü Sistem Onay Sorunu"
              className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
            />
          </div>

          {/* Tarih & YİBF */}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-border/80 bg-card/60 p-2 space-y-1">
              <label className="block text-[11px] font-bold text-foreground">
                Tarih
              </label>
              <input
                type="text"
                value={formData.tarih || ""}
                onChange={(e) => handleFieldChange("tarih", e.target.value)}
                placeholder="10.08.2026"
                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
            </div>

            <div className="rounded-lg border border-border/80 bg-card/60 p-2 space-y-1">
              <label className="block text-[11px] font-bold text-foreground">
                YİBF No
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.yibf || ""}
                onChange={(e) => handleFieldChange("yibf", e.target.value)}
                placeholder="1234567"
                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs font-mono font-semibold text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Şantiye Yeri */}
          <div className="rounded-lg border border-border/80 bg-card/60 p-2 space-y-1">
            <label className="block text-[11px] font-bold text-foreground">
              Şantiye Yeri (İl, İlçe, Mahalle, Ada, Parsel)
            </label>
            <textarea
              rows={2}
              value={formData.yer || ""}
              onChange={(e) => handleFieldChange("yer", e.target.value)}
              placeholder="YOZGAT İli AKDAĞMADENİ İlçesi İSTANBULLUOĞLU Mahallesi 666 ada 6 parsel"
              className="w-full rounded-md border border-border bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 resize-none"
            />
          </div>

          {/* Olay Açıklaması */}
          <div className="rounded-lg border border-border/80 bg-card/60 p-2 space-y-1">
            <label className="block text-[11px] font-bold text-foreground">
              Olay Açıklaması
            </label>
            <textarea
              rows={3}
              value={formData.olay_aciklamasi || ""}
              onChange={(e) => handleFieldChange("olay_aciklamasi", e.target.value)}
              placeholder="Yukarıda belirtilen şantiye adresinde gerçekleştirilen beton dökümü sırasında..."
              className="w-full rounded-md border border-border bg-background p-2 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 resize-none"
            />
          </div>

          {/* Gözlem ve Notlar */}
          <div className="rounded-lg border border-border/80 bg-card/60 p-2 space-y-1">
            <label className="block text-[11px] font-bold text-foreground">
              Gözlem ve Notlar
            </label>
            <textarea
              rows={2}
              value={formData.gozlem_notlar || ""}
              onChange={(e) => handleFieldChange("gozlem_notlar", e.target.value)}
              placeholder="Beton dökümü gerçekleştirilmiştir..."
              className="w-full rounded-md border border-border bg-background p-2 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 resize-none"
            />
          </div>

          {/* İmzacı Taraflar (4 Taraf - Compact 2x2 Grid) */}
          <div className="rounded-lg border border-border/80 bg-card/60 p-2 space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              İmzacı Taraflar
            </h3>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-semibold text-foreground mb-0.5">
                  1. Laboratuvar
                </label>
                <input
                  type="text"
                  value={formData.laboratuvar || ""}
                  onChange={(e) => handleFieldChange("laboratuvar", e.target.value)}
                  placeholder="MEREN BETON LAB. LTD. ŞTİ"
                  className="h-7.5 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-foreground mb-0.5">
                  2. Müteahhit
                </label>
                <input
                  type="text"
                  value={formData.muteahhit || ""}
                  onChange={(e) => handleFieldChange("muteahhit", e.target.value)}
                  placeholder="ABC İNŞAAT"
                  className="h-7.5 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-foreground mb-0.5">
                  3. Şantiye Şefi
                </label>
                <input
                  type="text"
                  value={formData.santiye_sefi || ""}
                  onChange={(e) => handleFieldChange("santiye_sefi", e.target.value)}
                  placeholder="İnş. Müh. Hüseyin GÜNAYDIN"
                  className="h-7.5 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-foreground mb-0.5">
                  4. Yapı Denetim
                </label>
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

          {/* Action Buttons Panel (Positioned right below İmzacı Taraflar) */}
          <div className="pt-2 space-y-2 border-t border-border/60">
            {/* Secondary Action Row: Sıfırla, Temizle, Boş Form, Yazdır */}
            <div className="grid grid-cols-4 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetToPdfDefaults}
                className="h-8 px-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                title="Orijinal PDF varsayılanlarını yükle"
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
                title="Doldurulmamış boş formu indir"
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
          className={`flex-1 h-full min-w-0 flex flex-col justify-between bg-zinc-900/10 dark:bg-zinc-950/40 p-2 sm:p-2.5 overflow-hidden ${
            activeTabMobile === "preview" ? "block" : "hidden lg:flex"
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
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
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
                  onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
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

          {/* Canvas Viewport Container: Maximized vertical area, 100% viewport locked */}
          <div
            ref={previewContainerRef}
            className="relative flex-1 min-h-0 w-full overflow-hidden flex items-center justify-center bg-zinc-850 dark:bg-zinc-900 rounded-xl p-1.5 shadow-inner"
          >
            {isGenerating && !hasRenderedOnce && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-zinc-300 bg-zinc-900/80 backdrop-blur-xs z-10">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                <p className="text-xs font-semibold">Resmi PDF Derleniyor...</p>
              </div>
            )}

            {/* Auto-Fitted Full A4 Canvas */}
            <canvas
              ref={canvasRef}
              className="bg-white rounded-md shadow-2xl transition-all block max-h-full max-w-full shrink-0 mx-auto my-auto"
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
