"use client";

import { type KeyboardEvent as ReactKeyboardEvent, useCallback, useMemo, useRef, useState } from "react";
import {
  Building2,
  FileCheck2,
  FileText,
  Loader2,
  UserCheck,
  X,
} from "lucide-react";
import { printPdfFromBlobUrl } from "@/lib/belge-studio-pdf-actions";
import {
  countFilledEditableFields,
  DOCUMENT_EDITABLE_FIELDS,
} from "@/lib/document-field-contracts";
import {
  BELGE_STUDIO_FORM_SCROLL_CLASS,
  BELGE_STUDIO_MAIN_SPLIT_CLASS,
  BELGE_STUDIO_MOBILE_TABLIST_CLASS,
  BELGE_STUDIO_MOBILE_TAB_CLASS,
} from "@/lib/belge-studio-layout";
import { useBelgeStudioMobileViewport } from "@/hooks/use-belge-studio-mobile-viewport";
import { useBelgeStudioDocument } from "@/hooks/use-belge-studio-document";
import { BelgeStudioPdfPreview, type BelgePreviewStatus } from "@/components/belge-studio-pdf-preview";
import { BelgeStudioActions } from "@/components/belge-studio-actions";
import { BelgeFieldLengthWarnings } from "@/components/belge-field-length-warnings";
import { BelgeFieldGuidanceView, evaluateFieldGuidance } from "@/components/belge-field-guidance";
import {
  BelgeFormEditIcon,
  BelgePreviewEyeIcon,
  BelgeResetIcon,
} from "@/components/belge-studio-icons";
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

export function SozlesmeStudio({
  initialData,
  onClose,
  isModal = false,
}: SozlesmeStudioProps) {
  const [formData, setFormData] = useState<SozlesmeData>(() => ({
    ...SOZLESME_DEFAULT_DATA,
    ...initialData,
  }));

  const [undoData, setUndoData] = useState<SozlesmeData | null>(null);

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
  const [previewResult, setPreviewResult] = useState<{ revision: number; status: BelgePreviewStatus }>({ revision: 0, status: "loading" });
  const studioRootRef = useRef<HTMLDivElement | null>(null);
  const downloadInFlightRef = useRef(false);
  const document = useBelgeStudioDocument(formData, generateSozlesmePdf);
  const snapshot = document.snapshot;
  const blobUrl = snapshot?.blobUrl ?? null;
  const previewIsCurrent = Boolean(snapshot && previewResult.revision === snapshot.revision);
  const previewError = previewIsCurrent && previewResult.status === "error";
  const syncStatus: "synced" | "updating" | "error" =
    document.status === "error" || previewError
      ? "error"
      : document.status === "ready" && previewIsCurrent && previewResult.status === "ready"
        ? "synced"
        : "updating";
  const previewStatusMessage =
    syncStatus === "error"
      ? "PDF önizlemesi oluşturulamadı."
      : syncStatus === "synced"
        ? "PDF önizlemesi hazır."
        : "PDF önizlemesi hazırlanıyor.";

  useBelgeStudioMobileViewport(studioRootRef, !isModal);

  // Field change handler
  const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof SozlesmeData, boolean>>>({});
  const markFieldTouched = (key: keyof SozlesmeData) => {
    setTouchedFields((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const handleFieldChange = useCallback(
    (field: keyof SozlesmeData, value: string) => {
      setUndoData(null);
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
    handleFieldChange(field, SOZLESME_DEFAULT_DATA[field] ?? "");
  }, [handleFieldChange]);

  // Global reset to original PDF default values (Sıfırla)
  const handleResetToPdfDefaults = useCallback(() => {
    setUndoData({ ...formData });
    setFormData({ ...SOZLESME_DEFAULT_DATA });
  }, [formData]);

  // Clear all fields (Temizle)
  const handleClearAll = useCallback(() => {
    setUndoData({ ...formData });
    setFormData(
      Object.fromEntries(
        Object.keys(SOZLESME_DEFAULT_DATA).map((k) => [k, ""])
      ) as SozlesmeData
    );
  }, [formData]);

  const handleUndo = () => {
    if (!undoData) return;
    setFormData(undoData);
    setUndoData(null);
  };

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

    const handleDownload = async () => {
    if (downloadInFlightRef.current) return;
    const currentSnapshot = document.snapshot;
    if (document.status !== "ready" || !currentSnapshot) {
      window.alert("PDF henüz hazır değil. Önizleme hazır olduğunda tekrar deneyin.");
      return;
    }
    downloadInFlightRef.current = true;
    try {
      setIsDownloading(true);
      await downloadFilledSozlesmePdf(formData, undefined, currentSnapshot.bytes);
    } catch (error) {
      console.error("PDF indirme hatası:", error);
      window.alert("PDF indirilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      downloadInFlightRef.current = false;
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    printPdfFromBlobUrl({
      blobUrl,
      isReady: document.status === "ready" && Boolean(snapshot),
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
            aria-label={`"${label}" alanını varsayılana sıfırla`} title={`"${label}" alanını varsayılana sıfırla`}
          >
            <BelgeResetIcon className="h-2.5 w-2.5" />
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
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="hidden sm:inline">Derleniyor...</span>
              </span>
            )}
            {syncStatus === "synced" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full animate-pulse bg-emerald-500" />
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
              ? "bg-background text-foreground shadow-xs ring-1 ring-amber-500/45 dark:bg-zinc-950 dark:ring-amber-500/50"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          }`}
        >
          <BelgeFormEditIcon className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span className="min-w-0 truncate">Form Alanları</span>
          <span className="shrink-0 rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-mono text-amber-800 dark:text-amber-300">
            {filledFieldCount}/{DOCUMENT_EDITABLE_FIELDS["santiye-sefi-sozlesmesi"].length}
          </span>
        </button>

        <button
          id={mobileTabIds.previewTab}
          type="button"
          role="tab"
          aria-selected={activeTabMobile === "preview"}
          aria-controls={mobileTabIds.previewPanel}
          aria-label={syncStatus === "error" ? "Canlı PDF önizlemesi, hata oluştu" : syncStatus === "updating" ? "Canlı PDF önizlemesi, hazırlanıyor" : "Canlı PDF önizlemesi, hazır"}
          tabIndex={activeTabMobile === "preview" ? 0 : -1}
          onKeyDown={(event) => handleMobileTabKeyDown(event, "preview")}
          onClick={() => setActiveTabMobile("preview")}
          className={`${BELGE_STUDIO_MOBILE_TAB_CLASS} ${
            activeTabMobile === "preview"
              ? "bg-background text-foreground shadow-xs ring-1 ring-amber-500/45 dark:bg-zinc-950 dark:ring-amber-500/50"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          }`}
        >
          <BelgePreviewEyeIcon className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span className="truncate">PDF Önizle</span>
          {syncStatus === "updating" ? (
            <Loader2 aria-hidden="true" className="h-3 w-3 shrink-0 animate-spin text-amber-500" />
          ) : (
            <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${syncStatus === "error" ? "bg-rose-500" : "bg-emerald-500"}`} />
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
          <BelgeFieldLengthWarnings
            values={formData}
            baselineValues={SOZLESME_DEFAULT_DATA}
            excludedFields={["adres", "yibf", "ucret", "sozlesme_tarihi"]}
            limits={{
              muteahhit_unvan: { label: "Yapı Müteahhidi Unvanı", maximum: 36 },
              santiye_sefi_ad: { label: "Şantiye Şefi Adı Soyadı", maximum: 35 },
              il: { label: "İl", maximum: 18 },
              ilce: { label: "İlçe", maximum: 22 },
              adres: { label: "Açık Adres", maximum: 48 },
              yibf: { label: "YİBF No", maximum: 32 },
              pafta: { label: "Pafta", maximum: 8 },
              mahalle: { label: "Mahalle", maximum: 8 },
              ada: { label: "Ada", maximum: 7 },
              parsel: { label: "Parsel", maximum: 12 },
              ucret: { label: "Aylık Brüt Ücret", maximum: 35 },
              sozlesme_tarihi: { label: "Sözleşme Tarihi", maximum: 36 },
            }}
          />
          {/* Top Title & Sync Status (Desktop compact inline) */}
          <div className="hidden lg:flex items-center justify-between pb-1 border-b border-border/60">
            <div className="flex items-center gap-1.5">
              <FileCheck2 className="h-3.5 w-3.5 text-amber-500" />
              <h2 className="text-xs font-bold text-foreground">
                Şantiye Şefi Hizmet Sözleşmesi
              </h2>
            </div>
            {syncStatus === "updating" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                <span>Derleniyor</span>
              </span>
            )}
            {syncStatus === "synced" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-1 w-1 rounded-full animate-pulse bg-emerald-500" />
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
                id={getFieldId("adres")}
                value={formData.adres || ""}
                onChange={(e) => handleFieldChange("adres", e.target.value)}
                onBlur={() => markFieldTouched("adres")}
                placeholder="-"
                aria-describedby="sozlesme-adres-guidance"
                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
              <BelgeFieldGuidanceView
                id="sozlesme-adres-guidance"
                guidance={evaluateFieldGuidance("santiye-sefi-sozlesmesi", "adres", formData.adres, {
                  isTouched: true,
                })}
              />
            </div>

            <div className="grid grid-cols-[2fr_1fr_1fr] gap-2">
              <div>
                {renderFieldHeader("Mahalle", "mahalle")}
                <input
                  type="text"
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
                      <BelgeResetIcon className="h-2.5 w-2.5" />
                      <span>Sıfırla</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                                    id={getFieldId("yibf")}
                  inputMode="numeric"
                  aria-describedby="sozlesme-yibf-help"
                  value={formData.yibf || ""}
                  onChange={(e) => handleFieldChange("yibf", e.target.value)}
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
                  onBlur={() => markFieldTouched("ucret")}
                  placeholder="40.000,00 TL"
                  aria-describedby="sozlesme-ucret-guidance"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-center text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
                <BelgeFieldGuidanceView
                  id="sozlesme-ucret-guidance"
                  guidance={evaluateFieldGuidance("santiye-sefi-sozlesmesi", "ucret", formData.ucret, {
                    isTouched: touchedFields.ucret,
                  })}
                />
              </div>

              <div>
                {renderFieldHeader("Sözleşme Tarihi", "sozlesme_tarihi", "(Madde 8)")}
                <input
                  type="text"
                  id={getFieldId("sozlesme_tarihi")}
                  value={formData.sozlesme_tarihi || ""}
                  onChange={(e) => handleFieldChange("sozlesme_tarihi", e.target.value)}
                  onBlur={() => markFieldTouched("sozlesme_tarihi")}
                  placeholder="01.05.2026"
                  aria-describedby="sozlesme-sozlesme_tarihi-guidance"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-center text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
                <BelgeFieldGuidanceView
                  id="sozlesme-sozlesme_tarihi-guidance"
                  guidance={evaluateFieldGuidance("santiye-sefi-sozlesmesi", "sozlesme_tarihi", formData.sozlesme_tarihi, {
                    isTouched: touchedFields.sozlesme_tarihi,
                  })}
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
                                    id={getFieldId("muteahhit_imza_unvan")}
                  value={formData.muteahhit_imza_unvan || ""}
                  onChange={(e) => handleFieldChange("muteahhit_imza_unvan", e.target.value)}
                  placeholder="ABC İNŞAAT"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>
          </div>

        </div>

        <div
          id={mobileTabIds.previewPanel}
          role="tabpanel"
          aria-labelledby={mobileTabIds.previewTab}
          className={`flex flex-1 min-h-0 min-w-0 ${activeTabMobile === "preview" ? "" : "absolute inset-0 invisible pointer-events-none lg:static lg:visible lg:pointer-events-auto"}`}
        >
          <BelgeStudioPdfPreview
            snapshot={snapshot}
            generationPending={document.status === "generating"}
            generationError={document.status === "error" ? document.error : null}
            onStatusChange={(revision, status) => setPreviewResult({ revision, status })}
            onRetry={document.retry}
            editing={{
              documentId: "santiye-sefi-sozlesmesi",
              values: formData as unknown as Record<string, string>,
              onCommit: (field, value) => handleFieldChange(field as keyof SozlesmeData, value),
            }}
          />
        </div>
      </div>

      <BelgeStudioActions
        activeTab={activeTabMobile}
        onToggleTab={() => setActiveTabMobile(activeTabMobile === "form" ? "preview" : "form")}
        onReset={handleResetToPdfDefaults}
        onClear={handleClearAll}
        onUndo={handleUndo}
        canUndo={Boolean(undoData)}
        onPrint={handlePrint}
        onDownload={handleDownload}
        ready={document.status === "ready"}
        downloading={isDownloading}
        templateUrl="/belgeler/santiye-sefi-sozlesmesi.pdf"
        templateFilename="SANTIYE_SEFI_SOZLESMESI_BOS.pdf"
      />
    </div>
  );
}
