"use client";

import { type KeyboardEvent as ReactKeyboardEvent, useMemo, useRef, useState } from "react";
import {
  Building2,
  Dice5,
  Loader2,
  MapPin,
  User,
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
  BelgeFormEditIcon,
  BelgePreviewEyeIcon,
  BelgeResetIcon,
} from "@/components/belge-studio-icons";
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

// Random Sample Presets for civil engineering & construction users
const RANDOM_SAMPLES: Array<InsaatRuhsatiData> = [
  {
    tarih: "08.12.2023",
    belediye_adi: "ÇANKAYA BELEDİYESİ",
    mudurluk_adi: "İmar ve Şehircilik Müdürlüğüne",
    ana_metin:
      "           İlçenin Örnek Mahallesi 1234 ada, 56 numaralı parselime yeni inşaat yapmak istiyorum, Yapı ruhsatının düzenlenerek tarafıma verilmesini arz ederim.",
    ad_soyad: "Hüseyin GÜNAYDIN",
    unvan: "Yapı Sahibi",
    adres: "Adres: Örnek Mah. Mühendisler Cad. No:24/6\nÇankaya / ANKARA",
    tel: "Tel: 0566 666 66 66",
  },
  {
    tarih: "16.08.2026",
    belediye_adi: "KADIKÖY BELEDİYESİ",
    mudurluk_adi: "İmar ve Şehircilik Müdürlüğüne",
    ana_metin:
      "           İlçenin Fenerbahçe Mahallesi 1045 ada, 18 numaralı parselime yeni konut inşaatı yapmak istiyorum, Yapı ruhsatının düzenlenerek tarafıma verilmesini arz ederim.",
    ad_soyad: "İnş. Müh. Hüseyin GÜNAYDIN",
    unvan: "Yapı Sahibi",
    adres: "Adres: Fenerbahçe Mah. Lale Sokak No:14/2\nKadıköy / İSTANBUL",
    tel: "Tel: 0566 666 66 66",
  },
  {
    tarih: "16.08.2026",
    belediye_adi: "ÇANKAYA BELEDİYESİ",
    mudurluk_adi: "İmar ve Şehircilik Müdürlüğüne",
    ana_metin:
      "           İlçenin Çayyolu Mahallesi 728 ada, 6 numaralı parselime yeni yapı inşaatı yapmak istiyorum, Yapı ruhsatı belgesinin tarafıma tanzim edilerek verilmesini arz ederim.",
    ad_soyad: "Hüseyin GÜNAYDIN",
    unvan: "Yapı Sahibi",
    adres: "Adres: Ümitköy Mah. 2432. Cadde Park Sitesi B Blok No:8\nÇankaya / ANKARA",
    tel: "Tel: 0566 666 66 66",
  },
  {
    tarih: "16.08.2026",
    belediye_adi: "NİLÜFER BELEDİYESİ",
    mudurluk_adi: "İmar ve Şehircilik Müdürlüğüne",
    ana_metin:
      "           İlçenin Görükle Mahallesi 412 ada, 9 numaralı parselime yeni ticari + konut inşaatı yapmak istiyorum, Yapı ruhsatının düzenlenerek tarafıma verilmesini arz ederim.",
    ad_soyad: "Hüseyin GÜNAYDIN",
    unvan: "Yapı Sahibi",
    adres: "Adres: Odunluk Mah. Akademi Cad. Plaza 16 Kat:4\nNilüfer / BURSA",
    tel: "Tel: 0566 666 66 66",
  },
];

export function InsaatRuhsatiStudio({
  initialData,
  onClose,
  isModal = false,
}: InsaatRuhsatiStudioProps) {
  const [formData, setFormData] = useState<InsaatRuhsatiData>(() => ({
    ...INSAAT_RUHSATI_DEFAULT_DATA,
    ...initialData,
  }));

  const [undoData, setUndoData] = useState<InsaatRuhsatiData | null>(null);

  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [activeTabMobile, setActiveTabMobile] = useState<"form" | "preview">("form");
  const mobileTabIds = {
    formTab: "insaat-ruhsati-mobile-tab-form",
    previewTab: "insaat-ruhsati-mobile-tab-preview",
    formPanel: "insaat-ruhsati-mobile-panel-form",
    previewPanel: "insaat-ruhsati-mobile-panel-preview",
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
  const document = useBelgeStudioDocument(formData, generateInsaatRuhsatiPdf);
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
  const handleFieldChange = (key: keyof InsaatRuhsatiData, value: string) => {
    setUndoData(null);
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
    setUndoData({ ...formData });
    setFormData({ ...INSAAT_RUHSATI_DEFAULT_DATA });
  };

  // Randomize button handler
  const handleRandomize = () => {
    const randomIndex = Math.floor(Math.random() * RANDOM_SAMPLES.length);
    const sample = RANDOM_SAMPLES[randomIndex];
    setFormData({ ...sample });
  };

  // Clear all fields (Temizle)
  const handleClearAll = () => {
    setUndoData({ ...formData });
    setFormData({
      tarih: "",
      belediye_adi: "",
      mudurluk_adi: "",
      ana_metin: "",
      ad_soyad: "",
      unvan: "",
      adres: "",
      tel: "",
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
        DOCUMENT_EDITABLE_FIELDS["insaat-ruhsati-dilekcesi"]
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
      await downloadFilledInsaatRuhsatiPdf(formData, undefined, currentSnapshot.bytes);
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
  const getFieldId = (fieldKey: keyof InsaatRuhsatiData) =>
    `insaat-ruhsati-${String(fieldKey)}`;

  const renderFieldHeader = (
    label: string,
    fieldKey: keyof InsaatRuhsatiData,
    badge?: string
  ) => {
    const isModified = formData[fieldKey] !== INSAAT_RUHSATI_DEFAULT_DATA[fieldKey];

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
              <Building2 className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                İnşaat Ruhsatı Dilekçesi
              </h2>
              <p className="text-[10px] text-muted-foreground hidden sm:block">
                Yapı Ruhsatı Başvuru & İdareye Talep Dilekçesi
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
          className={`${BELGE_STUDIO_MOBILE_TAB_CLASS} ${
            activeTabMobile === "form"
              ? "bg-background text-foreground shadow-xs ring-1 ring-amber-500/45 dark:bg-zinc-950 dark:ring-amber-500/50"
              : "text-muted-foreground hover:text-foreground hover:bg-background/40"
          }`}
        >
          <BelgeFormEditIcon className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span className="min-w-0 truncate">Form Alanları</span>
          <span className="shrink-0 rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-mono text-amber-800 dark:text-amber-300">
            {filledFieldCount}/{DOCUMENT_EDITABLE_FIELDS["insaat-ruhsati-dilekcesi"].length}
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
            baselineValues={INSAAT_RUHSATI_DEFAULT_DATA}
            limits={{
              belediye_adi: { label: "Belediye adı", maximum: 48 },
              mudurluk_adi: { label: "Müdürlük adı", maximum: 56 },
              ana_metin: { label: "Başvuru metni", maximum: 360 },
              ad_soyad: { label: "Ad soyad", maximum: 38 },
              unvan: { label: "Unvan", maximum: 30 },
              adres: { label: "Adres", maximum: 120 },
              tel: { label: "Telefon", maximum: 36 },
            }}
          />
          {/* Top Title & Sync Status (Desktop compact inline) */}
          <div className="hidden lg:flex items-center justify-between pb-1 border-b border-border/60">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-amber-500" />
              <h2 className="text-xs font-bold text-foreground">
                İnşaat Ruhsatı Dilekçesi
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRandomize}
                className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 hover:bg-amber-500/20 dark:text-amber-300 transition-all"
                title="Rastgele örnek bilgileri doldur"
              >
                <Dice5 className="h-3 w-3" />
                <span>Örnek Veri</span>
              </button>
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
          </div>

          {/* 1. Tarih & İlgili İdare */}
          <div className="rounded-lg border border-border/80 bg-card/60 p-2 space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3 text-amber-500" />
              1. İdare ve Tarih Bilgisi
            </h3>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                {renderFieldHeader("Dilekçe Tarihi", "tarih")}
                <input
                  type="text"
                  id={getFieldId("tarih")}
                  value={formData.tarih || ""}
                  onChange={(e) => handleFieldChange("tarih", e.target.value)}
                  placeholder="08.12.2023"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div>
                {renderFieldHeader("İlgili Belediye / İdare", "belediye_adi")}
                <input
                  type="text"
                  id={getFieldId("belediye_adi")}
                  value={formData.belediye_adi || ""}
                  onChange={(e) => handleFieldChange("belediye_adi", e.target.value)}
                  placeholder="ÇANKAYA BELEDİYESİ"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div>
              {renderFieldHeader("İlgili Birim / Müdürlük", "mudurluk_adi")}
              <input
                type="text"
                id={getFieldId("mudurluk_adi")}
                value={formData.mudurluk_adi || ""}
                onChange={(e) => handleFieldChange("mudurluk_adi", e.target.value)}
                placeholder="İmar ve Şehircilik Müdürlüğüne"
                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* 2. Talep ve Parsel Bilgileri Metni */}
          <div className="rounded-lg border border-border/80 bg-card/60 p-2">
            {renderFieldHeader("Talep ve Parsel Bilgileri Metni", "ana_metin")}
            <textarea
              rows={3}
              id={getFieldId("ana_metin")}
              value={formData.ana_metin || ""}
              onChange={(e) => handleFieldChange("ana_metin", e.target.value)}
              placeholder="İlçenin Örnek Mahallesi 1234 ada, 56 numaralı parselime yeni inşaat yapmak istiyorum..."
              className="w-full rounded-md border border-border bg-background p-2 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 resize-none"
            />
          </div>

          {/* 3. Dilekçe Sahibi */}
          <div className="rounded-lg border border-border/80 bg-card/60 p-2 space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3 text-amber-500" />
              2. Dilekçe Sahibi
            </h3>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                {renderFieldHeader("Adı Soyadı", "ad_soyad")}
                <input
                  type="text"
                  id={getFieldId("ad_soyad")}
                  autoComplete="name"
                  value={formData.ad_soyad || ""}
                  onChange={(e) => handleFieldChange("ad_soyad", e.target.value)}
                  placeholder="Hüseyin GÜNAYDIN"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div>
                {renderFieldHeader("Sıfat / Unvan", "unvan")}
                <input
                  type="text"
                  id={getFieldId("unvan")}
                  value={formData.unvan || ""}
                  onChange={(e) => handleFieldChange("unvan", e.target.value)}
                  placeholder="Yapı Sahibi"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>
          </div>

          {/* 4. İletişim ve Adres */}
          <div className="rounded-lg border border-border/80 bg-card/60 p-2 space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3 text-amber-500" />
              3. İletişim ve Tebligat Adresi
            </h3>

            <div>
              {renderFieldHeader("Adres Bilgisi", "adres")}
              <textarea
                rows={2}
                id={getFieldId("adres")}
                autoComplete="street-address"
                value={formData.adres || ""}
                onChange={(e) => handleFieldChange("adres", e.target.value)}
                placeholder="Adres: Örnek Mah. Mühendisler Cad. No:24/6 Çankaya / ANKARA"
                className="w-full rounded-md border border-border bg-background p-2 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 resize-none"
              />
            </div>

            <div>
              {renderFieldHeader("Telefon Numarası", "tel")}
              <input
                type="text"
                id={getFieldId("tel")}
                inputMode="tel"
                autoComplete="tel"
                value={formData.tel || ""}
                onChange={(e) => handleFieldChange("tel", e.target.value)}
                placeholder="Tel: 0566 666 66 66"
                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
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
        templateUrl="/belgeler/insaat-ruhsati-dilekcesi.pdf"
        templateFilename="INSAAT_RUHSATI_DILEKCESI_BOS.pdf"
      />
    </div>
  );
}
