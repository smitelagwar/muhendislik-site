"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileDown,
  FileEdit,
  FileText,
  Loader2,
  Maximize2,
  Paperclip,
  Phone,
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
  INSAAT_RUHSATI_DEFAULT_DATA,
  InsaatRuhsatiData,
  downloadFilledInsaatRuhsatiPdf,
  generateInsaatRuhsatiPdf,
} from "@/lib/pdf-engine";

interface InsaatRuhsatiStudioProps {
  initialData?: Partial<InsaatRuhsatiData>;
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

export function InsaatRuhsatiStudio({
  initialData,
  onClose,
  isModal = false,
}: InsaatRuhsatiStudioProps) {
  const [formData, setFormData] = useState<InsaatRuhsatiData>(() => ({
    ...INSAAT_RUHSATI_DEFAULT_DATA,
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
  const handleFieldChange = (key: keyof InsaatRuhsatiData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Local per-field reset handler
  const handleLocalFieldReset = (key: keyof InsaatRuhsatiData) => {
    setFormData((prev) => ({
      ...prev,
      [key]: INSAAT_RUHSATI_DEFAULT_DATA[key],
    }));
  };

  // Global reset to original PDF default values (Sıfırla)
  const handleResetToPdfDefaults = () => {
    setFormData({ ...INSAAT_RUHSATI_DEFAULT_DATA });
  };

  // Clear all fields (Temizle)
  const handleClearAll = () => {
    setFormData({
      tarih: "",
      belediye_adi: "",
      mudurluk_adi: "",
      konu_baslik: "",
      ana_metin: "",
      ad_soyad: "",
      unvan: "",
      imza_alani: "(İmza)",
      adres_etiket: "ADRES :",
      adres_deger: "",
      tel_etiket: "TEL :",
      tel_deger: "",
      tc_etiket: "T.C. NO :",
      tc_deger: "",
      ekler_etiket: "EKLER :",
      ekler_deger: "",
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
        const bytes = await generateInsaatRuhsatiPdf(formData);
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
            cMapUrl: "/vendor/pdfjs/cmaps/",
            cMapPacked: true,
          });
          const pdf = await loadingTask.promise;
          cachedPdfDocRef.current = pdf;

          await renderPdfPage(pdf, zoomLevelRef.current);
        }

        setSyncStatus("synced");
        setIsGenerating(false);
      } catch (err) {
        console.error("Error generating PDF:", err);
        setSyncStatus("error");
        setIsGenerating(false);
      }
    }, 180);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [formData, renderPdfPage]);

  // Instant Zoom Handler (Re-renders cached PDF document without re-compiling PDF)
  const handleZoomChange = useCallback(
    (newZoom: number) => {
      const clampedZoom = Math.min(250, Math.max(50, newZoom));
      setZoomLevel(clampedZoom);
      zoomLevelRef.current = clampedZoom;
      if (cachedPdfDocRef.current) {
        renderPdfPage(cachedPdfDocRef.current, clampedZoom);
      }
    },
    [renderPdfPage]
  );

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      if (cachedPdfDocRef.current) {
        renderPdfPage(cachedPdfDocRef.current, zoomLevelRef.current);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [renderPdfPage]);

  // Ctrl + Wheel Zoom Handler
  const handlePreviewWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 10 : -10;
        handleZoomChange(zoomLevelRef.current + delta);
      }
    },
    [handleZoomChange]
  );

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      }
    };
  }, []);

  // Download Handler
  const handleDownloadFilled = async () => {
    try {
      setIsDownloading(true);
      await downloadFilledInsaatRuhsatiPdf(formData);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Download Blank Form Handler
  const handleDownloadBlank = async () => {
    try {
      setIsDownloading(true);
      const emptyData: InsaatRuhsatiData = {
        tarih: "",
        belediye_adi: "",
        mudurluk_adi: "",
        konu_baslik: "KONU: Yapı (İnşaat) Ruhsatı Başvurusu",
        ana_metin: "",
        ad_soyad: "",
        unvan: "Yapı Sahibi",
        imza_alani: "(İmza)",
        adres_etiket: "ADRES :",
        adres_deger: "",
        tel_etiket: "TEL :",
        tel_deger: "",
        tc_etiket: "T.C. NO :",
        tc_deger: "",
        ekler_etiket: "EKLER :",
        ekler_deger: "",
      };
      await downloadFilledInsaatRuhsatiPdf(emptyData, "BOS_INSAAT_RUHSATI_DILEKCESI.pdf");
    } catch (err) {
      console.error("Blank download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Print Handler
  const handlePrint = () => {
    if (!blobUrl) return;
    const printWindow = window.open(blobUrl, "_blank");
    if (printWindow) {
      printWindow.focus();
    }
  };

  return (
    <div
      className={`flex flex-col bg-background text-foreground ${
        isModal
          ? "h-full w-full overflow-hidden"
          : "h-screen w-full overflow-hidden"
      }`}
    >
      {/* Top Header & Action Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-[var(--site-surface)] px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {onClose ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Kapat"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : (
            <a
              href="/belgeler"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              title="Belgelere Geri Dön"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
          )}
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Building2 className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-sm font-bold leading-none text-foreground sm:text-base">
                İnşaat Ruhsatı Dilekçesi Stüdyosu
              </h1>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Yapı Ruhsatı Başvuru & İdareye Talep Dilekçesi
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Sync indicator */}
          <div className="hidden items-center gap-1.5 rounded-full border border-border bg-background/80 px-2.5 py-1 text-[11px] sm:inline-flex">
            {syncStatus === "updating" ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-amber-600 dark:text-amber-400" />
                <span className="text-muted-foreground">Güncelleniyor...</span>
              </>
            ) : syncStatus === "synced" ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-muted-foreground">Canlı Önizleme Hazır</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-red-600 dark:bg-red-400" />
                <span className="text-red-600 dark:text-red-400">Hata</span>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadBlank}
            disabled={isDownloading}
            className="hidden h-8 gap-1.5 border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-secondary md:inline-flex"
            title="Boş Form Şablonunu İndir"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span>Boş Form</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={!blobUrl || isGenerating}
            className="hidden h-8 gap-1.5 border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-secondary sm:inline-flex"
            title="Yazdır"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Yazdır</span>
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadFilled}
            disabled={isDownloading || isGenerating}
            className="h-8 gap-1.5 bg-foreground px-3.5 text-xs font-bold text-background transition hover:bg-foreground/90 focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            {isDownloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileDown className="h-3.5 w-3.5" />
            )}
            <span>PDF İndir</span>
          </Button>

          {isModal && onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="flex h-10 shrink-0 border-b border-border bg-muted/40 lg:hidden">
        <button
          type="button"
          onClick={() => setActiveTabMobile("form")}
          className={`flex-1 text-xs font-bold transition-colors ${
            activeTabMobile === "form"
              ? "border-b-2 border-amber-600 bg-background text-foreground dark:border-amber-400"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <FileEdit className="h-3.5 w-3.5" />
            Formu Doldur ({filledFieldCount})
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTabMobile("preview")}
          className={`flex-1 text-xs font-bold transition-colors ${
            activeTabMobile === "preview"
              ? "border-b-2 border-amber-600 bg-background text-foreground dark:border-amber-400"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            Canlı PDF Önizleme
          </span>
        </button>
      </div>

      {/* Main Workspace (Split Grid) */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[480px_1fr] xl:grid-cols-[520px_1fr]">
        {/* LEFT COLUMN: Input Form Controls */}
        <section
          className={`flex flex-col border-r border-border bg-background ${
            activeTabMobile === "form" ? "flex" : "hidden lg:flex"
          } h-full overflow-hidden`}
        >
          {/* Form Header Toolbar */}
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-[var(--site-surface)] px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-violet-500" />
              <span className="text-xs font-bold text-foreground">
                Dilekçe Bilgileri
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                {filledFieldCount}/10 alan
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetToPdfDefaults}
                className="h-7 gap-1 px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                title="Şablon Varsayılanlarına Sıfırla"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Sıfırla</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-7 gap-1 px-2 text-[11px] font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                title="Tüm Alanları Temizle"
              >
                <Trash2 className="h-3 w-3" />
                <span>Temizle</span>
              </Button>
            </div>
          </div>

          {/* Form Input Fields (Scrollable) */}
          <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
            {/* 1. Tarih & Muhatap İdare */}
            <div className="space-y-3 rounded-xl border border-border bg-[var(--site-surface)] p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <h2 className="text-xs font-bold tracking-wider text-foreground uppercase">
                    1. Muhatap İdare & Tarih
                  </h2>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <div className="mb-1 flex items-center justify-between">
                    <label
                      htmlFor="belediye_adi"
                      className="text-xs font-semibold text-foreground"
                    >
                      İlgili Belediye / İdare <span className="text-red-500">*</span>
                    </label>
                    {formData.belediye_adi !== INSAAT_RUHSATI_DEFAULT_DATA.belediye_adi && (
                      <button
                        type="button"
                        onClick={() => handleLocalFieldReset("belediye_adi")}
                        className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                        title="Bu alanı varsayılana sıfırla"
                      >
                        <Undo2 className="h-2.5 w-2.5" />
                        Sıfırla
                      </button>
                    )}
                  </div>
                  <input
                    id="belediye_adi"
                    type="text"
                    value={formData.belediye_adi || ""}
                    onChange={(e) => handleFieldChange("belediye_adi", e.target.value)}
                    placeholder="Örn: AKDAĞMADENİ BELEDİYESİ"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label
                      htmlFor="mudurluk_adi"
                      className="text-xs font-semibold text-foreground"
                    >
                      İlgili Birim / Müdürlük
                    </label>
                    {formData.mudurluk_adi !== INSAAT_RUHSATI_DEFAULT_DATA.mudurluk_adi && (
                      <button
                        type="button"
                        onClick={() => handleLocalFieldReset("mudurluk_adi")}
                        className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                        title="Bu alanı varsayılana sıfırla"
                      >
                        <Undo2 className="h-2.5 w-2.5" />
                        Sıfırla
                      </button>
                    )}
                  </div>
                  <input
                    id="mudurluk_adi"
                    type="text"
                    value={formData.mudurluk_adi || ""}
                    onChange={(e) => handleFieldChange("mudurluk_adi", e.target.value)}
                    placeholder="Örn: İmar ve Şehircilik Müdürlüğüne"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label
                      htmlFor="tarih"
                      className="text-xs font-semibold text-foreground"
                    >
                      Dilekçe Tarihi
                    </label>
                    {formData.tarih !== INSAAT_RUHSATI_DEFAULT_DATA.tarih && (
                      <button
                        type="button"
                        onClick={() => handleLocalFieldReset("tarih")}
                        className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                        title="Bu alanı varsayılana sıfırla"
                      >
                        <Undo2 className="h-2.5 w-2.5" />
                        Sıfırla
                      </button>
                    )}
                  </div>
                  <input
                    id="tarih"
                    type="text"
                    value={formData.tarih || ""}
                    onChange={(e) => handleFieldChange("tarih", e.target.value)}
                    placeholder="Örn: 08.12.2023"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="mb-1 flex items-center justify-between">
                    <label
                      htmlFor="konu_baslik"
                      className="text-xs font-semibold text-foreground"
                    >
                      Konu Başlığı
                    </label>
                    {formData.konu_baslik !== INSAAT_RUHSATI_DEFAULT_DATA.konu_baslik && (
                      <button
                        type="button"
                        onClick={() => handleLocalFieldReset("konu_baslik")}
                        className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                        title="Bu alanı varsayılana sıfırla"
                      >
                        <Undo2 className="h-2.5 w-2.5" />
                        Sıfırla
                      </button>
                    )}
                  </div>
                  <input
                    id="konu_baslik"
                    type="text"
                    value={formData.konu_baslik || ""}
                    onChange={(e) => handleFieldChange("konu_baslik", e.target.value)}
                    placeholder="Örn: KONU: Yapı (İnşaat) Ruhsatı Başvurusu"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Talep ve Parsel Bilgileri Metni */}
            <div className="space-y-3 rounded-xl border border-border bg-[var(--site-surface)] p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <h2 className="text-xs font-bold tracking-wider text-foreground uppercase">
                    2. Talep Metni & Parsel Bilgileri
                  </h2>
                </div>
                {formData.ana_metin !== INSAAT_RUHSATI_DEFAULT_DATA.ana_metin && (
                  <button
                    type="button"
                    onClick={() => handleLocalFieldReset("ana_metin")}
                    className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                    title="Bu alanı varsayılana sıfırla"
                  >
                    <Undo2 className="h-2.5 w-2.5" />
                    Sıfırla
                  </button>
                )}
              </div>

              <div>
                <label
                  htmlFor="ana_metin"
                  className="mb-1 block text-xs font-semibold text-foreground"
                >
                  Dilekçe Gövde & Parsel Açıklama Metni
                </label>
                <textarea
                  id="ana_metin"
                  rows={4}
                  value={formData.ana_metin || ""}
                  onChange={(e) => handleFieldChange("ana_metin", e.target.value)}
                  placeholder="İlçenin ... Mahallesi ... ada, ... parselime yeni inşaat yapmak istiyorum..."
                  className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium leading-relaxed text-foreground transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Mahalle, ada, parsel ve talep detaylarınızı serbestçe düzenleyebilirsiniz.
                </p>
              </div>
            </div>

            {/* 3. Başvuru Sahibi / İmza Bloğu */}
            <div className="space-y-3 rounded-xl border border-border bg-[var(--site-surface)] p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <h2 className="text-xs font-bold tracking-wider text-foreground uppercase">
                    3. Başvuru Sahibi & İmza
                  </h2>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label
                      htmlFor="ad_soyad"
                      className="text-xs font-semibold text-foreground"
                    >
                      Adı Soyadı <span className="text-red-500">*</span>
                    </label>
                    {formData.ad_soyad !== INSAAT_RUHSATI_DEFAULT_DATA.ad_soyad && (
                      <button
                        type="button"
                        onClick={() => handleLocalFieldReset("ad_soyad")}
                        className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                        title="Bu alanı varsayılana sıfırla"
                      >
                        <Undo2 className="h-2.5 w-2.5" />
                        Sıfırla
                      </button>
                    )}
                  </div>
                  <input
                    id="ad_soyad"
                    type="text"
                    value={formData.ad_soyad || ""}
                    onChange={(e) => handleFieldChange("ad_soyad", e.target.value)}
                    placeholder="Örn: Eda AKÇA"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label
                      htmlFor="unvan"
                      className="text-xs font-semibold text-foreground"
                    >
                      Sıfatı / Unvanı
                    </label>
                    {formData.unvan !== INSAAT_RUHSATI_DEFAULT_DATA.unvan && (
                      <button
                        type="button"
                        onClick={() => handleLocalFieldReset("unvan")}
                        className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                        title="Bu alanı varsayılana sıfırla"
                      >
                        <Undo2 className="h-2.5 w-2.5" />
                        Sıfırla
                      </button>
                    )}
                  </div>
                  <input
                    id="unvan"
                    type="text"
                    value={formData.unvan || ""}
                    onChange={(e) => handleFieldChange("unvan", e.target.value)}
                    placeholder="Örn: Yapı Sahibi / Arsa Sahibi / Vekili"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* 4. İletişim & Tebligat Bilgileri */}
            <div className="space-y-3 rounded-xl border border-border bg-[var(--site-surface)] p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <h2 className="text-xs font-bold tracking-wider text-foreground uppercase">
                    4. İletişim & Tebligat Adresi
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label
                      htmlFor="adres_deger"
                      className="text-xs font-semibold text-foreground"
                    >
                      Tebligat Adresi
                    </label>
                    {formData.adres_deger !== INSAAT_RUHSATI_DEFAULT_DATA.adres_deger && (
                      <button
                        type="button"
                        onClick={() => handleLocalFieldReset("adres_deger")}
                        className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                        title="Bu alanı varsayılana sıfırla"
                      >
                        <Undo2 className="h-2.5 w-2.5" />
                        Sıfırla
                      </button>
                    )}
                  </div>
                  <textarea
                    id="adres_deger"
                    rows={2}
                    value={formData.adres_deger || ""}
                    onChange={(e) => handleFieldChange("adres_deger", e.target.value)}
                    placeholder="Örn: Tunahan Mah. Üç Şehitler Cad. 12/C blok no:29 Etimesgut / ANKARA"
                    className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium leading-relaxed text-foreground transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label
                        htmlFor="tel_deger"
                        className="text-xs font-semibold text-foreground"
                      >
                        İletişim Telefonu
                      </label>
                      {formData.tel_deger !== INSAAT_RUHSATI_DEFAULT_DATA.tel_deger && (
                        <button
                          type="button"
                          onClick={() => handleLocalFieldReset("tel_deger")}
                          className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                          title="Bu alanı varsayılana sıfırla"
                        >
                          <Undo2 className="h-2.5 w-2.5" />
                          Sıfırla
                        </button>
                      )}
                    </div>
                    <input
                      id="tel_deger"
                      type="text"
                      value={formData.tel_deger || ""}
                      onChange={(e) => handleFieldChange("tel_deger", e.target.value)}
                      placeholder="Örn: 0532 397 92 34"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label
                        htmlFor="tc_deger"
                        className="text-xs font-semibold text-foreground"
                      >
                        T.C. Kimlik / Vergi No <span className="text-[10px] font-normal text-muted-foreground">(İsteğe Bağlı)</span>
                      </label>
                      {formData.tc_deger !== INSAAT_RUHSATI_DEFAULT_DATA.tc_deger && (
                        <button
                          type="button"
                          onClick={() => handleLocalFieldReset("tc_deger")}
                          className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                          title="Bu alanı varsayılana sıfırla"
                        >
                          <Undo2 className="h-2.5 w-2.5" />
                          Sıfırla
                        </button>
                      )}
                    </div>
                    <input
                      id="tc_deger"
                      type="text"
                      value={formData.tc_deger || ""}
                      onChange={(e) => handleFieldChange("tc_deger", e.target.value)}
                      placeholder="Örn: 12345678901"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Ekler (Evrak Listesi) */}
            <div className="space-y-3 rounded-xl border border-border bg-[var(--site-surface)] p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <h2 className="text-xs font-bold tracking-wider text-foreground uppercase">
                    5. Ekler (Eklenen Evraklar)
                  </h2>
                </div>
                {formData.ekler_deger !== INSAAT_RUHSATI_DEFAULT_DATA.ekler_deger && (
                  <button
                    type="button"
                    onClick={() => handleLocalFieldReset("ekler_deger")}
                    className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                    title="Bu alanı varsayılana sıfırla"
                  >
                    <Undo2 className="h-2.5 w-2.5" />
                    Sıfırla
                  </button>
                )}
              </div>

              <div>
                <label
                  htmlFor="ekler_deger"
                  className="mb-1 block text-xs font-semibold text-foreground"
                >
                  Eklenen Belgeler Listesi
                </label>
                <textarea
                  id="ekler_deger"
                  rows={3}
                  value={formData.ekler_deger || ""}
                  onChange={(e) => handleFieldChange("ekler_deger", e.target.value)}
                  placeholder="1. Tapu Senedi Örneği&#10;2. İmar Durum Belgesi (Çap)&#10;3. Aplikasyon Krokisi..."
                  className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium leading-relaxed text-foreground transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Interactive Real-Time Canvas PDF Preview */}
        <section
          className={`relative flex flex-col bg-zinc-900/90 dark:bg-black/95 ${
            activeTabMobile === "preview" ? "flex" : "hidden lg:flex"
          } h-full overflow-hidden`}
        >
          {/* Toolbar on top of preview */}
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-300">
                A4 Sayfa Önizleme
              </span>
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                Sayfa 1/1
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleZoomChange(zoomLevel - 15)}
                className="inline-flex h-7 w-7 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
                title="Uzaklaştır"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleZoomChange(100)}
                className="h-7 px-2 font-mono text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
                title="Sığdır (%100)"
              >
                %{zoomLevel}
              </button>
              <button
                type="button"
                onClick={() => handleZoomChange(zoomLevel + 15)}
                className="inline-flex h-7 w-7 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
                title="Yakınlaştır"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas Viewport Container */}
          <div
            ref={previewContainerRef}
            onWheel={handlePreviewWheel}
            className="relative flex flex-1 items-center justify-center overflow-auto p-4 sm:p-6"
          >
            {isGenerating && !hasRenderedOnce && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/80 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                <p className="text-xs font-semibold text-zinc-300">
                  PDF Şablonu Derleniyor...
                </p>
              </div>
            )}

            {/* Canvas Page */}
            <div className="flex items-center justify-center shadow-2xl transition-transform duration-75">
              <canvas
                ref={canvasRef}
                className="rounded bg-white shadow-2xl"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  display: "block",
                }}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
