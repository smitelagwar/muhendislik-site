"use client";

import { PDFJS_CMAPS, PDFJS_FONTS } from "@/lib/pdfjs-paths";
import { type KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useMemo, useRef, useState  } from "react";
import {
  Building2,
  Eye,
  FileDown,
  FileEdit,
  FileSignature,
  Loader2,
  Printer,
  RotateCcw,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BelgeStudioPreviewToolbar } from "@/components/belge-studio-preview-toolbar";
import { loadBrowserPdfJs } from "@/lib/pdfjs-client";
import { printPdfFromBlobUrl } from "@/lib/belge-studio-pdf-actions";
import {
  countFilledEditableFields,
  DOCUMENT_EDITABLE_FIELDS,
} from "@/lib/document-field-contracts";
import {
  BELGE_STUDIO_FORM_SCROLL_CLASS,
  BELGE_STUDIO_MAIN_SPLIT_CLASS,
  BELGE_STUDIO_MOBILE_ACTIONS_CLASS,
  BELGE_STUDIO_MOBILE_TABLIST_CLASS,
  BELGE_STUDIO_MOBILE_TAB_CLASS,
  BELGE_STUDIO_PREVIEW_CANVAS_CLASS,
  BELGE_STUDIO_PREVIEW_PANEL_CLASS,
} from "@/lib/belge-studio-layout";
import { useBelgeStudioMobileViewport } from "@/hooks/use-belge-studio-mobile-viewport";
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
  const mobileTabIds = {
    formTab: "taahhutname-mobile-tab-form",
    previewTab: "taahhutname-mobile-tab-preview",
    formPanel: "taahhutname-mobile-panel-form",
    previewPanel: "taahhutname-mobile-panel-preview",
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
  const filledFieldCount = useMemo(
    () =>
      countFilledEditableFields(
        formData,
        DOCUMENT_EDITABLE_FIELDS["santiye-sefi-taahhutnamesi"]
      ),
    [formData]
  );

  // Render already loaded PDF Page onto Canvas at the requested zoom level (Instant 60fps)
  const renderPdfPage = useCallback(async (pdf: any, zoom: number) => {
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

      const page = await pdf.getPage(1);
      if (renderRequestId !== renderRequestRef.current) return;

      const unscaledViewport = page.getViewport({ scale: 1.0 });

      const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
      const availableHeight = Math.max(1, container.clientHeight - (isMobile ? 8 : 12));
      const availableWidth = Math.max(1, container.clientWidth - (isMobile ? 8 : 12));

      const fitScaleByHeight = availableHeight / unscaledViewport.height;
      const fitScaleByWidth = availableWidth / unscaledViewport.width;
      const baseFitScale = Math.min(fitScaleByHeight, fitScaleByWidth);

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
        const bytes = await generateTaahhutnamePdf(formData);
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
            cMapUrl: PDFJS_CMAPS,
            standardFontDataUrl: PDFJS_FONTS,
            cMapPacked: true,
          });

          const pdf = await loadingTask.promise;
          if (generationRequestId !== generationRequestRef.current) {
            void loadingTask.destroy();
            return;
          }

          const previousPdf = cachedPdfDocRef.current;
          cachedPdfDocRef.current = pdf;
          await renderPdfPage(pdf, zoomLevelRef.current);
          if (previousPdf && previousPdf !== pdf) {
            void previousPdf.loadingTask.destroy();
          }
        }

        if (generationRequestId !== generationRequestRef.current) return;

        if (previewAnnouncementStateRef.current !== "ready") {
          previewAnnouncementStateRef.current = "ready";
          setPreviewStatusMessage("PDF önizlemesi hazır.");
        }
        setSyncStatus("synced");
        setIsGenerating(false);
      } catch (error) {
        if (generationRequestId !== generationRequestRef.current) return;

        console.error("PDF generation failure:", error);
        if (previewAnnouncementStateRef.current !== "error") {
          previewAnnouncementStateRef.current = "error";
          setPreviewStatusMessage("PDF önizlemesi oluşturulamadı.");
        }
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

  // Gizli mobil önizleme paneli görünür olduğunda canvas'ı yeniden çiz.
  useEffect(() => {
    if (activeTabMobile === "preview" && cachedPdfDocRef.current) {
      const timer = window.setTimeout(() => {
        if (cachedPdfDocRef.current) {
          renderPdfPage(cachedPdfDocRef.current, zoomLevelRef.current);
        }
      }, 50);

      return () => window.clearTimeout(timer);
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
      if (cachedPdf?.loadingTask) {
        void cachedPdf.loadingTask.destroy();
      }

      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
    };
  }, []);

  // Handle direct download
  const handleDownload = async () => {
    if (downloadInFlightRef.current) return;
    downloadInFlightRef.current = true;

    try {
      setIsDownloading(true);
      await downloadFilledTaahhutnamePdf(formData);
    } catch (err) {
      console.error("Download error:", err);
      alert("PDF indirilirken bir sorun oluştu.");
    } finally {
      downloadInFlightRef.current = false;
      setIsDownloading(false);
    }
  };

  // Download empty form
  // Print only the generated PDF; never fall back to printing the HTML page.
  const handlePrint = () => {
    printPdfFromBlobUrl({
      blobUrl,
      isReady: syncStatus === "synced",
    });
  };

// Helper for field headers with local reset buttons
  const getFieldId = (fieldKey: keyof TaahhutnameData) =>
    `taahhutname-${String(fieldKey)}`;

  const renderFieldHeader = (
    fieldKey: keyof TaahhutnameData,
    label: string,
    tag?: string
  ) => {
    const isModified = formData[fieldKey] !== TAAHHUTNAME_DEFAULT_DATA[fieldKey];

    return (
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <label htmlFor={getFieldId(fieldKey)} className="text-[11px] font-semibold leading-tight text-foreground/90">
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


  return (
    <div
      ref={studioRootRef}
      data-studio-locked={isModal ? undefined : "true"}
      className={`flex flex-col bg-background text-foreground w-full max-w-full min-w-0 h-full overflow-hidden ${
        isModal
          ? "max-h-[96vh] rounded-2xl border border-border shadow-2xl"
          : "rounded-none border-0 bg-transparent shadow-none backdrop-blur-none"
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
              <FileSignature className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                Şantiye Şefi Taahhütnamesi
              </h2>
              <p className="text-[10px] text-muted-foreground hidden sm:block">
                Görev Üstlenme & Yasal Sorumluluk Formu
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
        className={BELGE_STUDIO_MOBILE_TABLIST_CLASS}
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
          <FileEdit className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span className="min-w-0 truncate">Form Alanları</span>
          <span className="shrink-0 rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-mono text-amber-800 dark:text-amber-300">
            {filledFieldCount}/{DOCUMENT_EDITABLE_FIELDS["santiye-sefi-taahhutnamesi"].length}
          </span>
        </button>

        <button
          id={mobileTabIds.previewTab}
          type="button"
          role="tab"
          aria-selected={activeTabMobile === "preview"}
          aria-controls={mobileTabIds.previewPanel}
          aria-label={syncStatus === "updating" ? "Canlı PDF önizlemesi, hazırlanıyor" : "Canlı PDF önizlemesi, hazır"}
          tabIndex={activeTabMobile === "preview" ? 0 : -1}
          onKeyDown={(event) => handleMobileTabKeyDown(event, "preview")}
          onClick={() => setActiveTabMobile("preview")}
          className={`${BELGE_STUDIO_MOBILE_TAB_CLASS} ${
            activeTabMobile === "preview"
              ? "bg-background text-foreground shadow-xs ring-1 ring-border"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          }`}
        >
          <Eye className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span className="truncate">PDF Önizle</span>
          {syncStatus === "updating" ? (
            <Loader2 aria-hidden="true" className="h-3 w-3 shrink-0 animate-spin text-amber-500" />
          ) : (
            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      {/* Main Split Layout: Left Form & Right Live PDF (Maximized height, zero outer scroll) */}
      <div className={BELGE_STUDIO_MAIN_SPLIT_CLASS}>
        {/* Left Column: Form Inputs & Action Buttons (Independent vertical scroll inside form) */}
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
                id={getFieldId("santiye_sefi_ad_soyad")}
                autoComplete="name"
                value={formData.santiye_sefi_ad_soyad || ""}
                onChange={(e) => handleFieldChange("santiye_sefi_ad_soyad", e.target.value)}
                placeholder="Örn: Hüseyin GÜNAYDIN"
                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
            </div>

            {/* Unvan & Oda Sicil */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                {renderFieldHeader("unvan", "Meslek / Unvan")}
                <input
                  type="text"
                  id={getFieldId("unvan")}
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
                  id={getFieldId("oda_sicil_no")}
                  inputMode="numeric"
                  value={formData.oda_sicil_no || ""}
                  onChange={(e) => handleFieldChange("oda_sicil_no", e.target.value)}
                  placeholder="12345"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* TC No & Telefon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                {renderFieldHeader("tc_kimlik_no", "T.C. Kimlik No")}
                <input
                  type="text"
                  maxLength={11}
                  id={getFieldId("tc_kimlik_no")}
                  inputMode="numeric"
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
                  id={getFieldId("telefon")}
                  inputMode="tel"
                  autoComplete="tel"
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
                id={getFieldId("adres")}
                autoComplete="street-address"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                {renderFieldHeader("ilgili_idare", "İlgili İdare (Belediye)")}
                <input
                  type="text"
                  id={getFieldId("ilgili_idare")}
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
                  id={getFieldId("il_ilce")}
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
                id={getFieldId("pafta_ada_parsel")}
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
                id={getFieldId("yapi_adresi")}
                value={formData.yapi_adresi || ""}
                onChange={(e) => handleFieldChange("yapi_adresi", e.target.value)}
                placeholder="Örnek Mah. Yapı Cad. No:10 Çankaya / ANKARA"
                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
            </div>

            {/* Yapı Sahibi & Adresi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                {renderFieldHeader("yapi_sahibi", "Yapı Sahibi")}
                <input
                  type="text"
                  id={getFieldId("yapi_sahibi")}
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
                  id={getFieldId("yapi_sahibi_adresi")}
                  value={formData.yapi_sahibi_adresi || ""}
                  onChange={(e) => handleFieldChange("yapi_sahibi_adresi", e.target.value)}
                  placeholder="Çankaya / ANKARA"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Tarih & İmza Unvanı */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                {renderFieldHeader("tarih", "Taahhüt Tarihi")}
                <input
                  type="text"
                  id={getFieldId("tarih")}
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
                  id={getFieldId("unvan_imza")}
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
                className="h-8 px-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                title="Tüm alanları orijinal varsayılanlara sıfırla"
              >
                <RotateCcw className="h-3 w-3 mr-1 shrink-0" />
                <span>Sıfırla</span>
              </Button>

              <Button
                type="button"
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
                href="/belgeler/santiye-sefi-taahhutnamesi.pdf"
                download="SANTIYE_SEFI_TAAHHUTNAMESI_BOS.pdf"
                className="inline-flex items-center justify-center h-8 rounded-md border border-border bg-background px-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                title="Doldurulmamış boş şablonu indir"
              >
                <FileDown className="h-3 w-3 mr-1 shrink-0" />
                <span>Boş Form</span>
              </a>

              <Button
                type="button"
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
              <span>Doldurulmuş PDF&apos;i İndir</span>
            </Button>
          </div>
        </div>

        {/* Right Column: Live PDF Canvas Preview (Fitted 100% inside view, zero window scroll) */}
        <div
          id={mobileTabIds.previewPanel}
          role="tabpanel"
          aria-labelledby={mobileTabIds.previewTab}
          className={`${BELGE_STUDIO_PREVIEW_PANEL_CLASS} ${
            activeTabMobile === "preview" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Canvas Toolbar */}
          <BelgeStudioPreviewToolbar
            zoomLevel={zoomLevel}
            onZoomChange={setZoomLevel}
            pdfUrl={blobUrl}
          />

          {/* Canvas Viewport Container: Maximized vertical area, local internal scroll when zoomed */}
          <div
            ref={previewContainerRef}
            onKeyDown={handlePreviewKeyDown}
            role="region"
            tabIndex={0}
            aria-label="PDF önizleme alanı"
            className={`${BELGE_STUDIO_PREVIEW_CANVAS_CLASS} ${
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
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar (Persistent across Form and Preview tabs) */}
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
