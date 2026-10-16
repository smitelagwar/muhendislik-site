"use client";

import { type KeyboardEvent as ReactKeyboardEvent, useMemo, useRef, useState } from "react";
import {
  Eye,
  FileEdit,
  Loader2,
  RotateCcw,
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

export function BetonDokumStudio({
  initialData,
  onClose,
  isModal = false,
}: BetonDokumStudioProps) {
  const [formData, setFormData] = useState<BetonDokumData>(() => ({
    ...BETON_DOKUM_DEFAULT_DATA,
    ...initialData,
  }));

  const [undoData, setUndoData] = useState<BetonDokumData | null>(null);

  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [activeTabMobile, setActiveTabMobile] = useState<"form" | "preview">("form");
  const mobileTabIds = {
    formTab: "beton-dokum-mobile-tab-form",
    previewTab: "beton-dokum-mobile-tab-preview",
    formPanel: "beton-dokum-mobile-panel-form",
    previewPanel: "beton-dokum-mobile-panel-preview",
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
  const document = useBelgeStudioDocument(formData, generateBetonDokumPdf);
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
  const handleFieldChange = (key: keyof BetonDokumData, value: string) => {
    setUndoData(null);
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
    setUndoData({ ...formData });
    setFormData({ ...BETON_DOKUM_DEFAULT_DATA });
  };

  // Clear all fields (Temizle)
  const handleClearAll = () => {
    setUndoData({ ...formData });
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
        DOCUMENT_EDITABLE_FIELDS["beton-dokum-tutanagi"]
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
      await downloadFilledBetonDokumPdf(formData, undefined, currentSnapshot.bytes);
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

// Helper component for label with per-field reset button
  const getFieldId = (fieldKey: keyof BetonDokumData) =>
    `beton-dokum-${String(fieldKey)}`;

  const renderFieldHeader = (
    label: string,
    fieldKey: keyof BetonDokumData,
    badge?: string
  ) => {
    const isModified = formData[fieldKey] !== BETON_DOKUM_DEFAULT_DATA[fieldKey];

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

        {/* Local Reset Button (Only appears when field is modified) */}
        {isModified && (
          <button
            type="button"
            onClick={() => handleLocalFieldReset(fieldKey)}
            className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-all shrink-0"
            aria-label={`"${label}" alanını varsayılana sıfırla`} title={`"${label}" alanını varsayılana sıfırla`}
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
      className={`flex flex-col bg-background text-foreground w-full max-w-full min-w-0 h-full overflow-hidden ${isModal
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
              <FileEdit className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                Beton Döküm Tutanağı
              </h2>
              <p className="text-[10px] text-muted-foreground hidden sm:block">
                Şantiye Beton Döküm & Kalite Kontrol Formu
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
          className={`${BELGE_STUDIO_MOBILE_TAB_CLASS} ${activeTabMobile === "form"
            ? "bg-background text-foreground shadow-xs ring-1 ring-border"
            : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            }`}
        >
          <FileEdit className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span className="min-w-0 truncate">Form Alanları</span>
          <span className="shrink-0 rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-mono text-amber-800 dark:text-amber-300">
            {filledFieldCount}/{DOCUMENT_EDITABLE_FIELDS["beton-dokum-tutanagi"].length}
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
          className={`${BELGE_STUDIO_MOBILE_TAB_CLASS} ${activeTabMobile === "preview"
            ? "bg-background text-foreground shadow-xs ring-1 ring-border"
            : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            }`}
        >
          <Eye className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span className="truncate">PDF Önizle</span>
          {syncStatus === "updating" ? (
            <Loader2 aria-hidden="true" className="h-3 w-3 shrink-0 animate-spin text-amber-500" />
          ) : (
            <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${syncStatus === "error" ? "bg-rose-500" : "bg-emerald-500"}`} />
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
          className={`${BELGE_STUDIO_FORM_SCROLL_CLASS} ${activeTabMobile === "form" ? "block" : "hidden lg:block"
            }`}
        >
          <p role="note" className="mx-2 mt-1 rounded-md border border-amber-500/20 bg-amber-500/5 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground">Başlangıç alanları örnek veridir. Belgeyi indirmeden önce tüm bilgileri kontrol edin.</p>
          <BelgeFieldLengthWarnings
            values={formData}
            baselineValues={BETON_DOKUM_DEFAULT_DATA}
            limits={{
              tutanak_alt_baslik: { label: "Tutanak alt başlığı", maximum: 58 },
              yer: { label: "Döküm yeri", maximum: 110 },
              olay_aciklamasi: { label: "Olay açıklaması", maximum: 380 },
              gozlem_notlar: { label: "Gözlem ve notlar", maximum: 300 },
              laboratuvar: { label: "Laboratuvar", maximum: 48 },
              muteahhit: { label: "Müteahhit", maximum: 48 },
              santiye_sefi: { label: "Şantiye şefi", maximum: 48 },
              yapi_denetim: { label: "Yapı denetim kuruluşu", maximum: 48 },
            }}
          />
          {/* Top Title & Sync Status (Desktop compact inline) */}
          <div className={`${isModal ? "hidden lg:flex" : "flex"} items-center justify-between gap-2 pb-1 border-b border-border/60`}>
            <div className="flex items-center gap-1.5">
              <FileEdit className="h-3.5 w-3.5 text-amber-500" />
              {isModal ? (
                <h2 className="text-xs font-bold text-foreground">Beton Döküm Tutanağı</h2>
              ) : (
                <h2 className="text-xs font-bold text-foreground">Beton Döküm Tutanağı</h2>
              )}
            </div>
            {syncStatus === "updating" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
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

          {/* 1. Tutanak Alt Başlığı */}
          <div className="rounded-lg border border-border/80 bg-card/60 p-2">
            {renderFieldHeader("Tutanak Alt Başlığı", "tutanak_alt_baslik")}
            <input
              type="text"
              id={getFieldId("tutanak_alt_baslik")}
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
                id={getFieldId("tarih")}
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
                  <label
                    htmlFor={getFieldId("yibf")}
                    className="text-[11px] font-bold leading-tight text-foreground"
                  >
                    YİBF No
                  </label>
                  {(formData.yibf || "").trim().length > 7 ? (
                    <span
                      id="beton-dokum-yibf-help"
                      className="text-[10px] font-semibold text-red-600 dark:text-red-400"
                    >
                      (YİBF No normalde 7 haneli olmalıdır, kontrol ediniz)
                    </span>
                  ) : (
                    <span
                      id="beton-dokum-yibf-help"
                      className="text-[9px] font-mono text-muted-foreground/80"
                    >
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
                id={getFieldId("yibf")}
                aria-describedby="beton-dokum-yibf-help"
                value={formData.yibf || ""}
                onChange={(e) => handleFieldChange("yibf", e.target.value)}
                placeholder="1234567"
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
              id={getFieldId("yer")}
              value={formData.yer || ""}
              onChange={(e) => handleFieldChange("yer", e.target.value)}
              placeholder="ANKARA İli ÇANKAYA İlçesi Örnek Mahallesi 1234 ada 56 parsel"
              className="w-full rounded-md border border-border bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 resize-none"
            />
          </div>

          {/* 5. Olay Açıklaması */}
          <div className="rounded-lg border border-border/80 bg-card/60 p-2">
            {renderFieldHeader("Olay Açıklaması", "olay_aciklamasi")}
            <textarea
              rows={3}
              id={getFieldId("olay_aciklamasi")}
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
              id={getFieldId("gozlem_notlar")}
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
                  id={getFieldId("laboratuvar")}
                  value={formData.laboratuvar || ""}
                  onChange={(e) => handleFieldChange("laboratuvar", e.target.value)}
                  placeholder="XYZ BETON LABORATUVARI A.Ş."
                  className="h-7.5 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div>
                {renderFieldHeader("2. Müteahhit", "muteahhit")}
                <input
                  type="text"
                  id={getFieldId("muteahhit")}
                  value={formData.muteahhit || ""}
                  onChange={(e) => handleFieldChange("muteahhit", e.target.value)}
                  placeholder="ABC İNŞAAT TAAHHÜT LTD. ŞTİ."
                  className="h-7.5 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div>
                {renderFieldHeader("3. Şantiye Şefi", "santiye_sefi")}
                <input
                  type="text"
                  id={getFieldId("santiye_sefi")}
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
                  id={getFieldId("yapi_denetim")}
                  value={formData.yapi_denetim || ""}
                  onChange={(e) => handleFieldChange("yapi_denetim", e.target.value)}
                  placeholder="GÜVEN YAPI DENETİM LTD. ŞTİ."
                  className="h-7.5 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>
          </div>

        </div>

        <div
          id={mobileTabIds.previewPanel}
          role="tabpanel"
          aria-labelledby={mobileTabIds.previewTab}
          className={`flex-1 min-h-0 min-w-0 ${activeTabMobile === "preview" ? "flex" : "absolute inset-0 invisible pointer-events-none lg:static lg:visible lg:pointer-events-auto lg:flex"}`}
        >
          <BelgeStudioPdfPreview
            snapshot={snapshot}
            generationPending={document.status === "generating"}
            generationError={document.status === "error" ? document.error : null}
            onStatusChange={(revision, status) => setPreviewResult({ revision, status })}
            onRetry={document.retry}
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
        templateUrl="/belgeler/beton-dokum-tutanagi.pdf"
        templateFilename="BETON_DOKUM_TUTANAGI_BOS_SABLON.pdf"
      />
    </div>
  );
}
