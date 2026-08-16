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
  TAAHHUTNAME_DEFAULT_DATA,
  TaahhutnameData,
  downloadFilledTaahhutnamePdf,
  generateTaahhutnamePdf,
} from "@/lib/pdf-engine";

interface TaahhutnameStudioProps {
  initialData?: Partial<TaahhutnameData>;
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

export function TaahhutnameStudio({
  initialData,
  onClose,
  isModal = false,
}: TaahhutnameStudioProps) {
  const [formData, setFormData] = useState<TaahhutnameData>(() => ({
    ...TAAHHUTNAME_DEFAULT_DATA,
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
  const handleFieldChange = (key: keyof TaahhutnameData, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      // Keep unvan and unvan_imza synchronized if unvan is changed
      if (key === "unvan" && prev.unvan === prev.unvan_imza) {
        updated.unvan_imza = value;
      }
      return updated;
    });
  };

  // Local per-field reset handler: restores ONLY this specific field to original default
  const handleLocalFieldReset = (key: keyof TaahhutnameData) => {
    setFormData((prev) => ({
      ...prev,
      [key]: TAAHHUTNAME_DEFAULT_DATA[key],
    }));
  };

  // Global reset to original PDF default values (Sıfırla)
  const handleResetToPdfDefaults = () => {
    setFormData({ ...TAAHHUTNAME_DEFAULT_DATA });
  };

  // Clear all fields (Temizle)
  const handleClearAll = () => {
    setFormData({
      oda_sicil_no: "",
      tc_kimlik_no: "",
      unvan: "",
      adres: "",
      telefon: "",
      il_ilce: "",
      ilgili_idare: "",
      pafta_ada_parsel: "",
      yapi_adresi: "",
      yapi_sahibi: "",
      yapi_sahibi_adresi: "",
      tarih: "",
      santiye_sefi_ad_soyad: "",
      unvan_imza: "",
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
        const bytes = await generateTaahhutnamePdf(formData);
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

  // Container resize observer (redraws page instantly on window resize)
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
      if (resizeTimer) clearTimeout(resizeTimer);
      observer.disconnect();
    };
  }, [renderPdfPage]);

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

  // Handle direct download
  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadFilledTaahhutnamePdf(formData);
    } catch (err) {
      console.error("Download error:", err);
      alert("PDF indirilirken bir sorun oluştu.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Download empty form
  const handleDownloadBlank = () => {
    const link = document.createElement("a");
    link.href = "/belgeler/santiye-sefi-taahhutnamesi.pdf";
    link.download = "SANTIYE_SEFI_TAAHHUTNAMESI_BOS.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print form
  const handlePrint = () => {
    if (!blobUrl) return;
    const printWindow = window.open(blobUrl, "_blank");
    if (printWindow) {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  // Helper for field headers with local reset buttons
  const renderFieldHeader = (
    fieldKey: keyof TaahhutnameData,
    label: string,
    tag?: string
  ) => {
    const isModified = formData[fieldKey] !== TAAHHUTNAME_DEFAULT_DATA[fieldKey];

    return (
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <label className="text-[11px] font-semibold text-foreground/90 truncate">
            {label}
          </label>
          {tag && (
            <span className="rounded bg-muted px-1.5 py-0.2 text-[9px] font-medium text-muted-foreground shrink-0">
              {tag}
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
      className={`flex flex-col bg-background text-foreground w-full h-full overflow-hidden ${
        isModal
          ? "max-h-[96vh] rounded-2xl border border-border shadow-2xl"
          : "rounded-xl sm:rounded-2xl border border-border bg-card/40 shadow-xl backdrop-blur-md"
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
            {filledFieldCount}/14
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

      {/* Main Split Layout: Left Form & Right Live PDF (Maximized height, zero outer scroll) */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Left Column: Form Inputs & Action Buttons (Independent vertical scroll inside form) */}
        <div
          className={`w-full lg:w-[410px] xl:w-[450px] shrink-0 h-full overflow-y-auto p-2.5 sm:p-3.5 space-y-2.5 ${
            activeTabMobile === "form" ? "block" : "hidden lg:block"
          }`}
        >
          {/* Top Title & Sync Status (Desktop compact inline) */}
          <div className="hidden lg:flex items-center justify-between pb-1 border-b border-border/60">
            <div className="flex items-center gap-1.5">
              <FileEdit className="h-3.5 w-3.5 text-amber-500" />
              <h2 className="text-xs font-bold text-foreground">
                Şantiye Şefi Taahhütnamesi
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

          {/* Section: Şantiye Şefi Kimlik ve Oda Bilgileri */}
          <div className="rounded-lg border border-border/70 bg-card/60 p-2 sm:p-2.5 space-y-2">
            <div className="flex items-center justify-between border-b border-border/40 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-amber-500" />
                1. Şantiye Şefi Bilgileri
              </span>
            </div>

            {/* Ad Soyad */}
            <div>
              {renderFieldHeader("santiye_sefi_ad_soyad", "Şantiye Şefi Adı Soyadı")}
              <input
                type="text"
                value={formData.santiye_sefi_ad_soyad || ""}
                onChange={(e) => handleFieldChange("santiye_sefi_ad_soyad", e.target.value)}
                placeholder="Örn: Hüseyin GÜNAYDIN"
                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
            </div>

            {/* Unvan & Oda Sicil */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                {renderFieldHeader("unvan", "Meslek / Unvan")}
                <input
                  type="text"
                  value={formData.unvan || ""}
                  onChange={(e) => handleFieldChange("unvan", e.target.value)}
                  placeholder="İNŞAAT MÜHENDİSİ"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div>
                {renderFieldHeader("oda_sicil_no", "Oda Sicil No")}
                <input
                  type="text"
                  value={formData.oda_sicil_no || ""}
                  onChange={(e) => handleFieldChange("oda_sicil_no", e.target.value)}
                  placeholder="12345"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* TC No & Telefon */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                {renderFieldHeader("tc_kimlik_no", "T.C. Kimlik No")}
                <input
                  type="text"
                  maxLength={11}
                  value={formData.tc_kimlik_no || ""}
                  onChange={(e) => handleFieldChange("tc_kimlik_no", e.target.value)}
                  placeholder="11111111110"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div>
                {renderFieldHeader("telefon", "İletişim Telefonu")}
                <input
                  type="text"
                  value={formData.telefon || ""}
                  onChange={(e) => handleFieldChange("telefon", e.target.value)}
                  placeholder="0566 666 66 66"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Tebligat Adresi */}
            <div>
              {renderFieldHeader("adres", "Tebligat Adresi")}
              <input
                type="text"
                value={formData.adres || ""}
                onChange={(e) => handleFieldChange("adres", e.target.value)}
                placeholder="Örnek Mah. Mühendisler Cad. No:1/A Çankaya / ANKARA"
                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Section: Yapı ve Ruhsat Bilgileri */}
          <div className="rounded-lg border border-border/70 bg-card/60 p-2 sm:p-2.5 space-y-2">
            <div className="flex items-center justify-between border-b border-border/40 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3 text-amber-500" />
                2. Yapı ve İdare Bilgileri
              </span>
            </div>

            {/* İlgili İdare & İl/İlçe */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                {renderFieldHeader("ilgili_idare", "İlgili İdare (Belediye)")}
                <input
                  type="text"
                  value={formData.ilgili_idare || ""}
                  onChange={(e) => handleFieldChange("ilgili_idare", e.target.value)}
                  placeholder="ÇANKAYA BELEDİYESİ"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div>
                {renderFieldHeader("il_ilce", "İl / İlçe")}
                <input
                  type="text"
                  value={formData.il_ilce || ""}
                  onChange={(e) => handleFieldChange("il_ilce", e.target.value)}
                  placeholder="ANKARA / ÇANKAYA"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Pafta / Ada / Parsel */}
            <div>
              {renderFieldHeader("pafta_ada_parsel", "Tapu Kaydı (Pafta / Ada / Parsel)")}
              <input
                type="text"
                value={formData.pafta_ada_parsel || ""}
                onChange={(e) => handleFieldChange("pafta_ada_parsel", e.target.value)}
                placeholder="Pafta: 12, Ada: 345, Parsel: 6"
                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
            </div>

            {/* Yapı Adresi */}
            <div>
              {renderFieldHeader("yapi_adresi", "Yapı Adresi")}
              <input
                type="text"
                value={formData.yapi_adresi || ""}
                onChange={(e) => handleFieldChange("yapi_adresi", e.target.value)}
                placeholder="Örnek Mah. Yapı Cad. No:10 Çankaya / ANKARA"
                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
            </div>

            {/* Yapı Sahibi & Adresi */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                {renderFieldHeader("yapi_sahibi", "Yapı Sahibi")}
                <input
                  type="text"
                  value={formData.yapi_sahibi || ""}
                  onChange={(e) => handleFieldChange("yapi_sahibi", e.target.value)}
                  placeholder="ABC YAPI İNŞAAT LTD. ŞTİ."
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div>
                {renderFieldHeader("yapi_sahibi_adresi", "Yapı Sahibi Adresi")}
                <input
                  type="text"
                  value={formData.yapi_sahibi_adresi || ""}
                  onChange={(e) => handleFieldChange("yapi_sahibi_adresi", e.target.value)}
                  placeholder="Çankaya / ANKARA"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Tarih & İmza Unvanı */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                {renderFieldHeader("tarih", "Taahhüt Tarihi")}
                <input
                  type="text"
                  value={formData.tarih || ""}
                  onChange={(e) => handleFieldChange("tarih", e.target.value)}
                  placeholder="16.08.2026"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div>
                {renderFieldHeader("unvan_imza", "İmza Alanı Unvanı")}
                <input
                  type="text"
                  value={formData.unvan_imza || ""}
                  onChange={(e) => handleFieldChange("unvan_imza", e.target.value)}
                  placeholder="İNŞAAT MÜHENDİSİ"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>
          </div>

          {/* Form Actions & Controls */}
          <div className="pt-1 space-y-2">
            <div className="grid grid-cols-4 gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetToPdfDefaults}
                className="h-8 px-1 text-[11px] gap-1 font-semibold text-muted-foreground hover:text-foreground"
                title="Resmi örnek değerleri yükle"
              >
                <Undo2 className="h-3 w-3 text-amber-500" />
                <span>Sıfırla</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="h-8 px-1 text-[11px] gap-1 font-semibold text-muted-foreground hover:text-foreground"
                title="Tüm kutuları boşalt"
              >
                <Trash2 className="h-3 w-3 text-rose-500" />
                <span>Temizle</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadBlank}
                className="h-8 px-1 text-[11px] gap-1 font-semibold text-muted-foreground hover:text-foreground"
                title="Resmi boş PDF şablonunu indir"
              >
                <FileDown className="h-3 w-3" />
                <span>Boş Form</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-8 px-1 text-[11px] gap-1 font-semibold text-muted-foreground hover:text-foreground"
                title="Doğrudan yazdır"
              >
                <Printer className="h-3 w-3" />
                <span>Yazdır</span>
              </Button>
            </div>

            {/* Prominent Direct Download Button */}
            <Button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full h-9 gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs shadow-md shadow-amber-600/20 active:scale-[0.99] dark:from-amber-500 dark:to-amber-600 dark:text-zinc-950"
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileDown className="h-3.5 w-3.5" />
              )}
              <span>Doldurulmuş PDF'i İndir</span>
            </Button>
          </div>
        </div>

        {/* Right Column: Live PDF Canvas Preview (Fitted 100% inside view, zero window scroll) */}
        <div
          className={`flex-1 min-h-0 flex flex-col p-2 sm:p-3 overflow-hidden bg-muted/20 ${
            activeTabMobile === "preview" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Canvas Toolbar */}
          <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-amber-500" />
                <span>Canlı Belge Önizlemesi</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] text-muted-foreground/80 font-mono">
                (Otomatik Tam Sayfa Sığdırma)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Reset Zoom / Fit Button */}
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition-all border ${
                  zoomLevel === 100
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
                title="Varsayılan tam sayfa sığdırma ölçeğine dön"
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
            className={`relative flex-1 min-h-0 w-full overflow-auto bg-zinc-850 dark:bg-zinc-900 rounded-xl p-1.5 shadow-inner ${
              zoomLevel > 100 ? "block" : "flex items-center justify-center overflow-hidden"
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
              className={`bg-white rounded-md shadow-2xl transition-all block shrink-0 ${
                zoomLevel > 100
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
