"use client";

import { type KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useMemo, useRef, useState  } from "react";
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileCheck2,
  FileDown,
  FileEdit,
  FileText,
  Loader2,
  Printer,
  RotateCcw,
  Trash2,
  UserCheck,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { printPdfFromBlobUrl } from "@/lib/belge-studio-pdf-actions";
import {
  countFilledEditableFields,
  DOCUMENT_EDITABLE_FIELDS,
} from "@/lib/document-field-contracts";
import {
  BELGE_STUDIO_FORM_SCROLL_CLASS,
  BELGE_STUDIO_MAIN_SPLIT_CLASS,
  BELGE_STUDIO_MOBILE_ACTIONS_CLASS,
  BELGE_STUDIO_MOBILE_TAB_CLASS,
} from "@/lib/belge-studio-layout";
import { useBelgeStudioMobileViewport } from "@/hooks/use-belge-studio-mobile-viewport";
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

  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [activeTabMobile, setActiveTabMobile] = useState<"form" | "preview">("form");
  const mobileTabIds = {
    formTab: "sozlesme-mobile-tab-form",
    previewTab: "sozlesme-mobile-tab-preview",
    formPanel: "sozlesme-mobile-panel-form",
    previewPanel: "sozlesme-mobile-panel-preview",
  } as const;

  const handleMobileTabKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    currentTab: "form" | "preview"
  ) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    const nextTab = currentTab === "form" ? "preview" : "form";
    setActiveTabMobile(nextTab);

    const tabList = event.currentTarget.closest('[role="tablist"]');
    const nextTabId =
      nextTab === "form" ? mobileTabIds.formTab : mobileTabIds.previewTab;

    window.requestAnimationFrame(() => {
      tabList
        ?.querySelector<HTMLButtonElement>(`#${nextTabId}`)
        ?.focus();
    });
  };
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [syncStatus, setSyncStatus] = useState<"synced" | "updating" | "error">("updating");
  const [hasRenderedOnce, setHasRenderedOnce] = useState<boolean>(false);
  const [previewStatusMessage, setPreviewStatusMessage] = useState(
    "PDF önizlemesi hazırlanıyor."
  );
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState<number>(1);
  const totalPages = 2;

  const studioRootRef = useRef<HTMLDivElement | null>(null);
  const downloadInFlightRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const generationRequestRef = useRef<number>(0);
  const previewAnnouncementStateRef = useRef<"loading" | "ready" | "error">("loading");
  const renderRequestRef = useRef<number>(0);
  const activeBlobUrlRef = useRef<string | null>(null);
  const latestPdfBytesRef = useRef<Uint8Array | null>(null);
  const cachedPdfDocRef = useRef<any>(null);
  const zoomLevelRef = useRef<number>(zoomLevel);
  zoomLevelRef.current = zoomLevel;

  useBelgeStudioMobileViewport(studioRootRef, !isModal);
  const previewPageRef = useRef<number>(previewPage);
  previewPageRef.current = previewPage;

  // Field change handler
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

  // Local per-field reset handler
  const handleLocalFieldReset = useCallback((field: keyof SozlesmeData) => {
    setFormData((prev) => ({
      ...prev,
      [field]: SOZLESME_DEFAULT_DATA[field] ?? "",
    }));
  }, []);

  // Global reset to original PDF default values (Sıfırla)
  const handleResetToPdfDefaults = useCallback(() => {
    setFormData({ ...SOZLESME_DEFAULT_DATA });
  }, []);

  // Clear all fields (Temizle)
  const handleClearAll = useCallback(() => {
    setFormData(
      Object.fromEntries(
        Object.keys(SOZLESME_DEFAULT_DATA).map((k) => [k, ""])
      ) as SozlesmeData
    );
  }, []);

  // Count filled fields
  const filledFieldCount = useMemo(
    () =>
      countFilledEditableFields(
        formData,
        DOCUMENT_EDITABLE_FIELDS["santiye-sefi-sozlesmesi"],
        ["-"]
      ),
    [formData]
  );

  // Render already loaded PDF Page onto Canvas at the requested zoom level and pageNum (Instant 60fps)
  const renderPdfPage = useCallback(async (pdf: any, zoom: number, pageNum: number = 1) => {
    const canvas = canvasRef.current;
    const container = previewContainerRef.current;
    if (!canvas || !container || !pdf) return;

    const renderRequestId = ++renderRequestRef.current;

    try {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }

      const page = await pdf.getPage(pageNum);
      if (renderRequestId !== renderRequestRef.current) return;

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
      if (renderRequestId !== renderRequestRef.current) return;

      if (renderTaskRef.current === renderTask) {
        renderTaskRef.current = null;
      }
      setHasRenderedOnce(true);
    } catch (err: any) {
      if (
        renderRequestId !== renderRequestRef.current ||
        err?.name === "RenderingCancelledException"
      ) return;
      console.error("Canvas render error:", err);
    }
  }, []);

  // Debounced PDF Generation (Triggers ONLY when formData changes)
  useEffect(() => {
    const generationRequestId = ++generationRequestRef.current;

    setSyncStatus("updating");
    setIsGenerating(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const bytes = await generateSozlesmePdf(formData);
        if (generationRequestId !== generationRequestRef.current) return;
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
        if (generationRequestId !== generationRequestRef.current) return;

        if (pdfjs) {
          const clonedBytes = new Uint8Array(storedBytes.byteLength);
          clonedBytes.set(storedBytes);

          const loadingTask = pdfjs.getDocument({
            data: clonedBytes,
            cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
            cMapPacked: true,
            isEvalSupported: false,
          });
          const pdf = await loadingTask.promise;
          if (generationRequestId !== generationRequestRef.current) {
            if (typeof pdf?.destroy === "function") {
              void pdf.destroy();
            }
            return;
          }

          cachedPdfDocRef.current = pdf;

          await renderPdfPage(pdf, zoomLevelRef.current, previewPageRef.current);
        }

        if (generationRequestId !== generationRequestRef.current) return;

        if (previewAnnouncementStateRef.current !== "ready") {
          previewAnnouncementStateRef.current = "ready";
          setPreviewStatusMessage("PDF önizlemesi hazır.");
        }
        setSyncStatus("synced");
        setIsGenerating(false);
      } catch (err) {
        if (generationRequestId !== generationRequestRef.current) return;

        console.error("Error generating PDF:", err);
        if (previewAnnouncementStateRef.current !== "error") {
          previewAnnouncementStateRef.current = "error";
          setPreviewStatusMessage("PDF önizlemesi oluşturulamadı.");
        }
        setSyncStatus("error");
        setIsGenerating(false);
      }
    }, 150);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [formData, renderPdfPage]);

  // Instant Redraw when zoomLevel or previewPage changes
  useEffect(() => {
    if (cachedPdfDocRef.current) {
      renderPdfPage(cachedPdfDocRef.current, zoomLevel, previewPage);
    }
  }, [zoomLevel, previewPage, renderPdfPage]);

  // Window / container resize observer to keep canvas perfectly fitted
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    let resizeTimer: NodeJS.Timeout | null = null;
    const observer = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (cachedPdfDocRef.current) {
          renderPdfPage(cachedPdfDocRef.current, zoomLevelRef.current, previewPageRef.current);
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
      const timer = setTimeout(() => {
        if (cachedPdfDocRef.current) {
          renderPdfPage(cachedPdfDocRef.current, zoomLevelRef.current, previewPageRef.current);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTabMobile, renderPdfPage]);

  // Ctrl/Cmd + Wheel and keyboard PDF zoom — scoped only to the focused preview.
  const handlePreviewKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!(event.ctrlKey || event.metaKey)) return;

    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.matches("input, textarea, select, [contenteditable='true']") ||
        target.closest("[contenteditable='true']") !== null)
    ) {
      return;
    }

    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      event.stopPropagation();
      setZoomLevel((prev) => Math.min(250, prev + 25));
    } else if (event.key === "-") {
      event.preventDefault();
      event.stopPropagation();
      setZoomLevel((prev) => Math.max(50, prev - 25));
    } else if (event.key === "0") {
      event.preventDefault();
      event.stopPropagation();
      setZoomLevel(100);
    }
  };

  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const isPreviewVisible = () =>
      container.getClientRects().length > 0 &&
      window.getComputedStyle(container).visibility !== "hidden";

    const handleWheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey) || !isPreviewVisible()) return;

      event.preventDefault();
      event.stopPropagation();

      if (event.deltaY < 0) {
        setZoomLevel((prev) => Math.min(250, prev + 25));
      } else if (event.deltaY > 0) {
        setZoomLevel((prev) => Math.max(50, prev - 25));
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Bileşen kapanırken geçici PDF kaynaklarını temizle
  useEffect(() => {
    return () => {
      generationRequestRef.current += 1;
      renderRequestRef.current += 1;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // Render işlemi zaten tamamlanmış olabilir.
        }
        renderTaskRef.current = null;
      }

      const cachedPdf = cachedPdfDocRef.current;
      cachedPdfDocRef.current = null;
      if (cachedPdf && typeof cachedPdf.destroy === "function") {
        void cachedPdf.destroy();
      }

      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
    };
  }, []);

  // Download filled PDF
  const handleDownload = async () => {
    if (downloadInFlightRef.current) return;
    downloadInFlightRef.current = true;

    try {
      setIsDownloading(true);
      await downloadFilledSozlesmePdf(formData);
    } catch (err) {
      console.error("Download failed:", err);
      alert("PDF indirilirken bir sorun oluştu.");
    } finally {
      downloadInFlightRef.current = false;
      setIsDownloading(false);
    }
  };

  // Print only the generated PDF; never fall back to printing the HTML page.
  const handlePrint = () => {
    printPdfFromBlobUrl({
      blobUrl,
      isReady: syncStatus === "synced",
    });
  };

// Helper for field headers with local reset buttons
  const getFieldId = (fieldKey: keyof SozlesmeData) =>
    `sozlesme-${String(fieldKey)}`;

  const renderFieldHeader = (
    label: string,
    fieldKey: keyof SozlesmeData,
    badge?: string
  ) => {
    const isModified = formData[fieldKey] !== SOZLESME_DEFAULT_DATA[fieldKey];

    return (
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <label htmlFor={getFieldId(fieldKey)} className="text-[11px] font-bold leading-tight text-foreground">
            {label}
          </label>
          {badge && (
            <span className="text-[9px] font-mono text-muted-foreground/80">
              {badge}
            </span>
          )}
        </div>

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


  const yibfInvalid = Boolean(
    formData.yibf &&
    formData.yibf !== "-" &&
    formData.yibf.replace(/\D/g, "").length > 0 &&
    formData.yibf.replace(/\D/g, "").length !== 7
  );

  return (
    <div
      ref={studioRootRef}
      data-studio-locked={isModal ? undefined : "true"}
      className={`flex flex-col bg-background text-foreground w-full max-w-full min-w-0 h-full overflow-hidden ${
        isModal
          ? "max-h-[96vh] rounded-2xl border border-border shadow-2xl"
          : "rounded-xl sm:rounded-2xl border border-border bg-card/40 shadow-xl backdrop-blur-md"
      }`}
    >
      <span role="status" aria-live="polite" className="sr-only">
        {previewStatusMessage}
      </span>

      {/* Modal Top Header (Visible in quick preview modal) */}
      {isModal && (
        <div className="flex items-center justify-between border-b border-border bg-background/90 px-3.5 py-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FileCheck2 className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                Şantiye Şefi Hizmet Sözleşmesi
              </h2>
              <p className="text-[10px] text-muted-foreground hidden sm:block">
                Müteahhit ↔ Şantiye Şefi 2 Sayfalı Hizmet Akdi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {syncStatus === "updating" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="hidden sm:inline">Derleniyor...</span>
              </span>
            )}
            {syncStatus === "synced" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Canlı Önizleme Hazır</span>
              </span>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                aria-label="Pencereyi Kapat"
                title="Kapat"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Segmented Tab Switcher (Visible only on Mobile/Tablet) */}
      <div
        role="tablist"
        aria-label="Belge stüdyosu görünümü"
        className="flex lg:hidden border-b border-border bg-muted/50 p-1.5 shrink-0 gap-1.5"
      >
        <button
          id={mobileTabIds.formTab}
          type="button"
          role="tab"
          aria-selected={activeTabMobile === "form"}
          aria-controls={mobileTabIds.formPanel}
          tabIndex={activeTabMobile === "form" ? 0 : -1}
          onKeyDown={(event) => handleMobileTabKeyDown(event, "form")}
          onClick={() => setActiveTabMobile("form")}
          className={`${BELGE_STUDIO_MOBILE_TAB_CLASS} ${
            activeTabMobile === "form"
              ? "bg-background text-foreground shadow-xs ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          }`}
        >
          <FileEdit className="h-3.5 w-3.5 text-amber-500" />
          <span>Form Alanları</span>
          <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-mono text-amber-800 dark:text-amber-300">
            {filledFieldCount}/{DOCUMENT_EDITABLE_FIELDS["santiye-sefi-sozlesmesi"].length}
          </span>
        </button>

        <button
          id={mobileTabIds.previewTab}
          type="button"
          role="tab"
          aria-selected={activeTabMobile === "preview"}
          aria-controls={mobileTabIds.previewPanel}
          tabIndex={activeTabMobile === "preview" ? 0 : -1}
          onKeyDown={(event) => handleMobileTabKeyDown(event, "preview")}
          onClick={() => setActiveTabMobile("preview")}
          className={`${BELGE_STUDIO_MOBILE_TAB_CLASS} ${
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

      {/* Main Split Layout: Left Form & Right Live PDF */}
      <div className={BELGE_STUDIO_MAIN_SPLIT_CLASS}>
        {/* Left Column: Form Inputs & Action Buttons */}
        <div
          id={mobileTabIds.formPanel}
          role="tabpanel"
          aria-labelledby={mobileTabIds.formTab}
          data-testid="belge-studio-form-scroll"
          className={`${BELGE_STUDIO_FORM_SCROLL_CLASS} ${
            activeTabMobile === "form" ? "block" : "hidden lg:block"
          }`}
        >
          {/* Top Title & Sync Status (Desktop compact inline) */}
          <div className="hidden lg:flex items-center justify-between pb-1 border-b border-border/60">
            <div className="flex items-center gap-1.5">
              <FileCheck2 className="h-3.5 w-3.5 text-amber-500" />
              <h2 className="text-xs font-bold text-foreground">
                Şantiye Şefi Hizmet Sözleşmesi
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

          {/* Section 1: Taraflar */}
          <div className="rounded-lg border border-border/80 bg-card/60 p-2 space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <UserCheck className="h-3 w-3 text-amber-500" />
              1. Taraflar
            </h3>

            <div>
              {renderFieldHeader("Yapı Müteahhidi Unvanı", "muteahhit_unvan")}
              <input
                type="text"
                maxLength={36}
                id={getFieldId("muteahhit_unvan")}
                value={formData.muteahhit_unvan || ""}
                onChange={(e) => handleFieldChange("muteahhit_unvan", e.target.value)}
                placeholder="ABC İNŞAAT"
                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
            </div>

            <div>
              {renderFieldHeader("Şantiye Şefi Adı Soyadı", "santiye_sefi_ad")}
              <input
                type="text"
                maxLength={35}
                id={getFieldId("santiye_sefi_ad")}
                autoComplete="name"
                value={formData.santiye_sefi_ad || ""}
                onChange={(e) => handleFieldChange("santiye_sefi_ad", e.target.value)}
                placeholder="HÜSEYİN GÜNAYDIN"
                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Section 2: İşyeri Bilgileri */}
          <div className="rounded-lg border border-border/80 bg-card/60 p-2 space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3 text-amber-500" />
              2. İşyeri Bilgileri (Madde 2)
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <div>
                {renderFieldHeader("İl", "il")}
                <input
                  type="text"
                  maxLength={18}
                  id={getFieldId("il")}
                  value={formData.il || ""}
                  onChange={(e) => handleFieldChange("il", e.target.value)}
                  placeholder="YOZGAT"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-center text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
              <div>
                {renderFieldHeader("İlçe", "ilce")}
                <input
                  type="text"
                  maxLength={22}
                  id={getFieldId("ilce")}
                  value={formData.ilce || ""}
                  onChange={(e) => handleFieldChange("ilce", e.target.value)}
                  placeholder="AKDAĞMADENİ"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-center text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div>
              {renderFieldHeader("Açık Adres", "adres")}
              <input
                type="text"
                maxLength={48}
                id={getFieldId("adres")}
                value={formData.adres || ""}
                onChange={(e) => handleFieldChange("adres", e.target.value)}
                placeholder="-"
                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
            </div>

            <div className="grid grid-cols-[2fr_1fr_1fr] gap-2">
              <div>
                {renderFieldHeader("Mahalle", "mahalle")}
                <input
                  type="text"
                  maxLength={32}
                  id={getFieldId("mahalle")}
                  value={formData.mahalle || ""}
                  onChange={(e) => handleFieldChange("mahalle", e.target.value)}
                  placeholder="EMEK MAHALLESİ"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
              <div>
                {renderFieldHeader("Ada", "ada")}
                <input
                  type="text"
                  maxLength={8}
                  id={getFieldId("ada")}
                  inputMode="numeric"
                  value={formData.ada || ""}
                  onChange={(e) => handleFieldChange("ada", e.target.value)}
                  placeholder="666"
                  className="h-8 w-full rounded-md border border-border bg-background px-2 text-center text-xs font-mono text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
              <div>
                {renderFieldHeader("Parsel", "parsel")}
                <input
                  type="text"
                  maxLength={8}
                  id={getFieldId("parsel")}
                  inputMode="numeric"
                  value={formData.parsel || ""}
                  onChange={(e) => handleFieldChange("parsel", e.target.value)}
                  placeholder="66"
                  className="h-8 w-full rounded-md border border-border bg-background px-2 text-center text-xs font-mono text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-[2fr_1fr] gap-2">
              <div
                className={`rounded-lg border p-1.5 transition-colors ${
                  yibfInvalid
                    ? "border-red-500/60 bg-red-500/[0.04] dark:bg-red-950/20"
                    : "border-border/80 bg-card/60"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <label
                      htmlFor={getFieldId("yibf")}
                      className="text-[11px] font-bold leading-tight text-foreground"
                    >
                      YİBF No
                    </label>
                    {yibfInvalid ? (
                      <span
                        id="sozlesme-yibf-help"
                        className="text-[10px] font-semibold text-red-600 dark:text-red-400"
                      >
                        (7 Hane olmalı)
                      </span>
                    ) : (
                      <span
                        id="sozlesme-yibf-help"
                        className="text-[9px] font-mono text-muted-foreground/80"
                      >
                        (7 Hane veya -)
                      </span>
                    )}
                  </div>
                  {formData.yibf !== SOZLESME_DEFAULT_DATA.yibf && (
                    <button
                      type="button"
                      onClick={() => handleLocalFieldReset("yibf")}
                      className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-all shrink-0"
                      title="YİBF alanını varsayılana sıfırla"
                    >
                      <RotateCcw className="h-2.5 w-2.5" />
                      <span>Sıfırla</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={7}
                  id={getFieldId("yibf")}
                  inputMode="numeric"
                  aria-describedby="sozlesme-yibf-help"
                  value={formData.yibf || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFieldChange("yibf", value === "-" ? "-" : value.replace(/\D/g, ""));
                  }}
                  placeholder="-"
                  className={`h-8 w-full rounded-md border px-2 text-center text-xs font-mono font-semibold transition-colors placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 ${
                    yibfInvalid
                      ? "border-red-500 text-red-600 dark:text-red-400 focus:border-red-500 focus:ring-red-500/20"
                      : "border-border bg-background text-foreground focus:border-amber-500 focus:ring-amber-500/20"
                  }`}
                />
              </div>

              <div>
                {renderFieldHeader("Pafta", "pafta")}
                <input
                  type="text"
                  maxLength={12}
                  id={getFieldId("pafta")}
                  value={formData.pafta || ""}
                  onChange={(e) => handleFieldChange("pafta", e.target.value)}
                  placeholder="-"
                  className="h-8 w-full rounded-md border border-border bg-background px-2 text-center text-xs font-mono text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Ücret ve Sözleşme */}
          <div className="rounded-lg border border-border/80 bg-card/60 p-2 space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3 text-amber-500" />
              3. Ücret ve Sözleşme Tarihi
            </h3>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                {renderFieldHeader("Aylık Brüt Ücret", "ucret", "(Madde 5)")}
                <input
                  type="text"
                  id={getFieldId("ucret")}
                  value={formData.ucret || ""}
                  onChange={(e) => handleFieldChange("ucret", e.target.value)}
                  placeholder="40.000,00 TL"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-center text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div>
                {renderFieldHeader("Sözleşme Tarihi", "sozlesme_tarihi", "(Madde 8)")}
                <input
                  type="text"
                  id={getFieldId("sozlesme_tarihi")}
                  value={formData.sozlesme_tarihi || ""}
                  onChange={(e) => handleFieldChange("sozlesme_tarihi", e.target.value)}
                  placeholder="01.05.2026"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-center text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>
          </div>

          {/* Section 4: İmza Alanları */}
          <div className="rounded-lg border border-border/80 bg-card/60 p-2 space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <UserCheck className="h-3 w-3 text-amber-500" />
              4. İmza Alanları
            </h3>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                {renderFieldHeader("Şantiye Şefi (İmza)", "santiye_sefi_imza_adi")}
                <input
                  type="text"
                  maxLength={35}
                  id={getFieldId("santiye_sefi_imza_adi")}
                  value={formData.santiye_sefi_imza_adi || ""}
                  onChange={(e) => handleFieldChange("santiye_sefi_imza_adi", e.target.value)}
                  placeholder="Hüseyin GÜNAYDIN"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
              <div>
                {renderFieldHeader("Müteahhit (İmza)", "muteahhit_imza_unvan")}
                <input
                  type="text"
                  maxLength={36}
                  id={getFieldId("muteahhit_imza_unvan")}
                  value={formData.muteahhit_imza_unvan || ""}
                  onChange={(e) => handleFieldChange("muteahhit_imza_unvan", e.target.value)}
                  placeholder="ABC İNŞAAT"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons Panel */}
          <div className="pt-2 space-y-2 border-t border-border/60">
            {/* Secondary Action Row */}
            <div className="grid grid-cols-4 gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetToPdfDefaults}
                className="h-8 px-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                title="Tüm alanları orijinal varsayılanlara sıfırla"
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
                href="/belgeler/santiye-sefi-sozlesmesi.pdf"
                download="SANTIYE_SEFI_SOZLESMESI_BOS.pdf"
                className="inline-flex items-center justify-center h-8 rounded-md border border-border bg-background px-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                title="Doldurulmamış boş şablonu indir"
              >
                <FileDown className="h-3 w-3 mr-1 shrink-0" />
                <span>Boş Form</span>
              </a>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                aria-label="Yazdır"
                className="h-8 px-1 text-[11px] font-semibold"
                title="Yazdır"
              >
                <Printer className="h-3 w-3 mr-1 shrink-0" />
                <span>Yazdır</span>
              </Button>
            </div>

            {/* Primary Action Button */}
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
              <span>Doldurulmuş PDF&apos;i İndir (2 Sayfa)</span>
            </Button>
          </div>
        </div>

        {/* Right Column: Full-Height Live PDF Canvas Panel */}
        <div
          id={mobileTabIds.previewPanel}
          role="tabpanel"
          aria-labelledby={mobileTabIds.previewTab}
          className={`flex-1 min-h-0 min-w-0 flex flex-col justify-between bg-zinc-900/10 dark:bg-zinc-950/40 p-2 sm:p-2.5 overflow-hidden ${
            activeTabMobile === "preview" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Top Mini Control Bar (Zoom, Fit, Open, Multi-Page Switcher) */}
          <div
            role="toolbar"
            aria-label="PDF önizleme araçları"
            data-testid="belge-studio-preview-toolbar"
            className="flex items-center justify-between mb-1 px-1 shrink-0"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-amber-500" />
                <span>Canlı Belge Önizlemesi</span>
              </span>
              <span className="hidden sm:inline-flex items-center text-[10px] text-muted-foreground/80 font-mono">
                (Otomatik Tam Sayfa Sığdırma)
              </span>
            </div>

            {/* Page Navigation Switcher (1 / 2) */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPreviewPage((page) => Math.max(1, page - 1))}
                disabled={previewPage <= 1}
                aria-label="Önceki sayfa"
                className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40 transition-colors"
              >
                ‹ Önceki
              </button>
              <span className="text-[10px] font-mono font-semibold text-foreground px-1">
                {previewPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPreviewPage((page) => Math.min(totalPages, page + 1))}
                disabled={previewPage >= totalPages}
                aria-label="Sonraki sayfa"
                className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40 transition-colors"
              >
                Sonraki ›
              </button>
            </div>

            {/* Zoom & View Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Sığdır"
                onClick={() => setZoomLevel(100)}
                className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold transition-all ${
                  zoomLevel === 100
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                title="Genişliğe ve yüksekliğe tam sığdır (%100)"
              >
                Sığdır
              </button>

              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  aria-label="Uzaklaştır"
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
                  aria-label="Yakınlaştır"
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
                  aria-label="PDF'yi yeni sekmede aç"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                  title="PDF'yi yeni sekmede aç"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span className="hidden sm:inline">Yeni Sekmede Aç</span>
                </a>
              )}
            </div>
          </div>

          {/* Canvas Viewport Container */}
          <div
            ref={previewContainerRef}
            onKeyDown={handlePreviewKeyDown}
            role="region"
            tabIndex={0}
            aria-label="PDF önizleme alanı"
            className={`relative flex-1 min-h-0 w-full overflow-auto bg-zinc-850 dark:bg-zinc-900 rounded-xl p-1.5 shadow-inner ${
              zoomLevel > 100 ? "block" : "flex items-center justify-center overflow-hidden"
            }`}
          >
            {isGenerating && !hasRenderedOnce && (
              <div className="sticky inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-zinc-300 bg-zinc-900/80 backdrop-blur-xs z-10 min-h-[260px]">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                <p className="text-xs font-semibold">Sözleşme PDF Derleniyor...</p>
              </div>
            )}

            <canvas
              ref={canvasRef}
              className={`bg-white rounded-md shadow-2xl transition-all block shrink-0 ${
                zoomLevel > 100
                  ? "mx-auto my-2"
                  : "max-h-full max-w-full mx-auto my-auto"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div
        data-testid="belge-studio-mobile-actions"
        className={BELGE_STUDIO_MOBILE_ACTIONS_CLASS}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setActiveTabMobile(activeTabMobile === "form" ? "preview" : "form")}
          className="flex-1 min-w-0 min-h-11 h-auto py-2 gap-1.5 text-xs font-semibold whitespace-normal leading-tight"
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
          className="flex-1 min-w-0 min-h-11 h-auto py-2 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs leading-tight whitespace-normal shadow-md dark:bg-amber-500 dark:text-zinc-950"
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
