"use client";

import { useEffect, useRef, useState } from "react";
import {
  Building2,
  FilePenLine,
  FileText,
  Loader2,
  UserCheck,
  X,
} from "lucide-react";
import { printPdfFromBlobUrl } from "@/lib/belge-studio-pdf-actions";
import {
  BELGE_STUDIO_FORM_SCROLL_CLASS,
  BELGE_STUDIO_MAIN_SPLIT_CLASS,
} from "@/lib/belge-studio-layout";
import { useBelgeStudioMobileViewport } from "@/hooks/use-belge-studio-mobile-viewport";
import { useBelgeStudioFormView } from "@/hooks/use-belge-studio-form-view";
import { useBelgeStudioDocument } from "@/hooks/use-belge-studio-document";
import { BelgeStudioPdfPreview, type BelgePreviewStatus } from "@/components/belge-studio-pdf-preview";
import { BelgeStudioActions } from "@/components/belge-studio-actions";
import { BelgePdfLayoutWarnings } from "@/components/belge-pdf-layout-warnings";
import { BelgeFieldGuidanceView, evaluateFieldGuidance } from "@/components/belge-field-guidance";
import {
  BelgeFormEditIcon,
  BelgeResetIcon,
} from "@/components/belge-studio-icons";
import {
  ISTIFA_DILEKCESI_DEFAULT_DATA,
  IstifaDilekcesiData,
  downloadFilledIstifaDilekcesiPdf,
  BELGE_DOCUMENT_GENERATORS,
  prewarmBelgeDocument,
} from "@/lib/pdf-engine";

interface IstifaStudioProps {
  initialData?: Partial<IstifaDilekcesiData>;
  onClose?: () => void;
  isModal?: boolean;
}

export function IstifaStudio({
  initialData,
  onClose,
  isModal = false,
}: IstifaStudioProps) {
  const [formData, setFormData] = useState<IstifaDilekcesiData>(() => ({
    ...ISTIFA_DILEKCESI_DEFAULT_DATA,
    ...initialData,
  }));

  const [undoData, setUndoData] = useState<IstifaDilekcesiData | null>(null);

  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [activeTabMobile, setActiveTabMobile] = useState<"form" | "preview">("preview");
  const [previewResult, setPreviewResult] = useState<{ revision: number; status: BelgePreviewStatus }>({ revision: 0, status: "loading" });
  const studioRootRef = useRef<HTMLDivElement | null>(null);
  const downloadInFlightRef = useRef(false);
  const document = useBelgeStudioDocument(formData, BELGE_DOCUMENT_GENERATORS["santiye-sefi-istifa-dilekcesi"]);
  const snapshot = document.snapshot;
  const layouts = document.status === "ready" ? snapshot?.layouts : undefined;
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
  const formView = useBelgeStudioFormView({ isModal });

  useEffect(() => {
    prewarmBelgeDocument("santiye-sefi-istifa-dilekcesi");
  }, []);

  // Field change handler
  const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof IstifaDilekcesiData, boolean>>>({});
  const markFieldTouched = (key: keyof IstifaDilekcesiData) => {
    setTouchedFields((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const handleFieldChange = (key: keyof IstifaDilekcesiData, value: string) => {
    setUndoData(null);
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Local per-field reset handler: restores ONLY this specific field to original default
  const handleLocalFieldReset = (key: keyof IstifaDilekcesiData) => {
    handleFieldChange(key, ISTIFA_DILEKCESI_DEFAULT_DATA[key] ?? "");
  };

  // Global reset to original PDF default values (Sıfırla)
  const handleResetToPdfDefaults = () => {
    setUndoData({ ...formData });
    setFormData({ ...ISTIFA_DILEKCESI_DEFAULT_DATA });
  };

  // Clear all fields (Temizle)
  const handleClearAll = () => {
    setUndoData({ ...formData });
    setFormData({
      hitap_1: "",
      hitap_2: "",
      ana_paragraf: "",
      sonuc_cumlesi: "",
      tarih: "",
      unvan: "",
      ad_soyad: "",
      adres_etiket: "ADRES :",
      adres_deger: "",
      tc_etiket: "T.C. :",
      tc_deger: "",
      iletisim_etiket: "İletişim :",
      iletisim_deger: "",
    });
  };

  const handleUndo = () => {
    if (!undoData) return;
    setFormData(undoData);
    setUndoData(null);
  };


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
      await downloadFilledIstifaDilekcesiPdf(formData, undefined, currentSnapshot.bytes);
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
  const getFieldId = (fieldKey: keyof IstifaDilekcesiData) =>
    `istifa-${String(fieldKey)}`;

  const renderFieldHeader = (
    fieldKey: keyof IstifaDilekcesiData,
    label: string,
    tag?: string
  ) => {
    const isModified = formData[fieldKey] !== ISTIFA_DILEKCESI_DEFAULT_DATA[fieldKey];

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
              <FilePenLine className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                Şantiye Şefi İstifa Dilekçesi
              </h2>
              <p className="text-[10px] text-muted-foreground hidden sm:block">
                Resmî Görevden Ayrılma & İdareye Bildirim Dilekçesi
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
      {/* Main Split Layout: Left Form & Right Live PDF (Maximized height, zero outer scroll) */}
      <div className={BELGE_STUDIO_MAIN_SPLIT_CLASS}>
        {/* Left Column: Form Inputs & Action Buttons (Independent vertical scroll inside form) */}
        <div
          ref={formView.scrollContainerRef}
          id="istifa-mobile-panel-form"
          role="region"
          aria-label="Belge form alanları"
          data-testid="belge-studio-form-scroll"
          className={`${BELGE_STUDIO_FORM_SCROLL_CLASS} ${
            activeTabMobile === "form" ? "block" : "hidden lg:block"
          }`}
        >
          <div {...formView.contentWrapperProps}>
          <BelgePdfLayoutWarnings documentId="santiye-sefi-istifa-dilekcesi" layouts={layouts} excludedFields={["tarih", "tc_deger", "iletisim_deger", "adres_deger"]} />
          {/* Top Title & Sync Status (Desktop compact inline) */}
          <div className="hidden lg:flex items-center justify-between pb-1 border-b border-border/60">
            <div className="flex items-center gap-1.5">
              <BelgeFormEditIcon className="h-3.5 w-3.5 text-amber-500" />
              <h2 className="text-xs font-bold text-foreground">
                Şantiye Şefi İstifa Dilekçesi
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

          {/* Section: Hitap ve İdare Bilgileri */}
          <div className="rounded-lg border border-border/70 bg-card/60 p-2 sm:p-2.5 space-y-2">
            <div className="flex items-center justify-between border-b border-border/40 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3 text-amber-500" />
                1. İdare ve Kurum Hitabı
              </span>
            </div>

            {/* Hitap 1 & Hitap 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                {renderFieldHeader("hitap_1", "Hitap Başlığı")}
                <input
                  type="text"
                  id={getFieldId("hitap_1")}
                  value={formData.hitap_1 || ""}
                  onChange={(e) => handleFieldChange("hitap_1", e.target.value)}
                  placeholder="BELEDİYE BAŞKANLIĞINA"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs font-bold text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div>
                {renderFieldHeader("hitap_2", "İlçe / Şehir")}
                <input
                  type="text"
                  id={getFieldId("hitap_2")}
                  value={formData.hitap_2 || ""}
                  onChange={(e) => handleFieldChange("hitap_2", e.target.value)}
                  placeholder="ÇANKAYA"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs font-bold text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>
          </div>

          {/* Section: Dilekçe Metni & Talep */}
          <div className="rounded-lg border border-border/70 bg-card/60 p-2 sm:p-2.5 space-y-2">
            <div className="flex items-center justify-between border-b border-border/40 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3 text-amber-500" />
                2. Dilekçe ve Ayrılma Metni
              </span>
            </div>

            {/* Ana Paragraf */}
            <div>
              {renderFieldHeader("ana_paragraf", "İstifa & Proje Açıklaması")}
              <textarea
                rows={4}
                id={getFieldId("ana_paragraf")}
                value={formData.ana_paragraf || ""}
                onChange={(e) => handleFieldChange("ana_paragraf", e.target.value)}
                placeholder="Arsa sahibi ... adına kayıtlı ... ada ... parselde bulunan inşaatta üstlenmiş olduğum şantiye şefliği görevimden..."
                className="w-full rounded-md border border-border bg-background p-2 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 resize-y font-normal"
              />
            </div>

            {/* Sonuç Cümlesi */}
            <div>
              {renderFieldHeader("sonuc_cumlesi", "Sonuç & Talep Cümlesi")}
              <input
                type="text"
                id={getFieldId("sonuc_cumlesi")}
                value={formData.sonuc_cumlesi || ""}
                onChange={(e) => handleFieldChange("sonuc_cumlesi", e.target.value)}
                placeholder="İstifa ettiğimi bildirir, gereğinin yapılmasını dilerim."
                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs font-normal text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Section: Şantiye Şefi & İletişim Bilgileri */}
          <div className="rounded-lg border border-border/70 bg-card/60 p-2 sm:p-2.5 space-y-2">
            <div className="flex items-center justify-between border-b border-border/40 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-amber-500" />
                3. Şantiye Şefi ve İletişim Bilgileri
              </span>
            </div>

            {/* Tarih, unvan & ad soyad */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="min-w-0">
                {renderFieldHeader("tarih", "Dilekçe Tarihi")}
                <input
                  type="text"
                  id={getFieldId("tarih")}
                  value={formData.tarih || ""}
                  onChange={(e) => handleFieldChange("tarih", e.target.value)}
                  onBlur={() => markFieldTouched("tarih")}
                  placeholder="29.12.2025"
                  aria-describedby="istifa-tarih-guidance"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
                <BelgeFieldGuidanceView
                  id="istifa-tarih-guidance"
                  guidance={evaluateFieldGuidance("santiye-sefi-istifa-dilekcesi", "tarih", formData.tarih, {
                    layout: layouts?.tarih,
                    isTouched: touchedFields.tarih,
                  })}
                />
              </div>

              <div className="min-w-0">
                {renderFieldHeader("unvan", "Mesleki Unvan")}
                <input
                  type="text"
                  id={getFieldId("unvan")}
                  value={formData.unvan || ""}
                  onChange={(e) => handleFieldChange("unvan", e.target.value)}
                  placeholder="İNŞAAT MÜHENDİSİ"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div className="min-w-0">
                {renderFieldHeader("ad_soyad", "Şantiye Şefi Ad Soyad")}
                <input
                  type="text"
                  id={getFieldId("ad_soyad")}
                  autoComplete="name"
                  value={formData.ad_soyad || ""}
                  onChange={(e) => handleFieldChange("ad_soyad", e.target.value)}
                  placeholder="HÜSEYİN GÜNAYDIN"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs font-semibold text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* TC No & İletişim */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="min-w-0">
                {renderFieldHeader("tc_deger", "T.C. Kimlik Numarası")}
                <input
                  type="text"
                  id={getFieldId("tc_deger")}
                  inputMode="numeric"
                  value={formData.tc_deger || ""}
                  onChange={(e) => handleFieldChange("tc_deger", e.target.value)}
                  onBlur={() => markFieldTouched("tc_deger")}
                  placeholder="11111111110"
                  aria-describedby="istifa-tc_deger-guidance"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
                <BelgeFieldGuidanceView
                  id="istifa-tc_deger-guidance"
                  guidance={evaluateFieldGuidance("santiye-sefi-istifa-dilekcesi", "tc_deger", formData.tc_deger, {
                    layout: layouts?.tc_deger,
                    isTouched: touchedFields.tc_deger,
                  })}
                />
              </div>

              <div className="min-w-0">
                {renderFieldHeader("iletisim_deger", "İletişim Telefonu")}
                <input
                  type="text"
                  id={getFieldId("iletisim_deger")}
                  inputMode="tel"
                  autoComplete="tel"
                  value={formData.iletisim_deger || ""}
                  onChange={(e) => handleFieldChange("iletisim_deger", e.target.value)}
                  onBlur={() => markFieldTouched("iletisim_deger")}
                  placeholder="0566 666 66 66"
                  aria-describedby="istifa-iletisim_deger-guidance"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
                <BelgeFieldGuidanceView
                  id="istifa-iletisim_deger-guidance"
                  guidance={evaluateFieldGuidance("santiye-sefi-istifa-dilekcesi", "iletisim_deger", formData.iletisim_deger, {
                    layout: layouts?.iletisim_deger,
                    isTouched: touchedFields.iletisim_deger,
                  })}
                />
              </div>
            </div>

            {/* Tebligat Adresi */}
            <div>
              {renderFieldHeader("adres_deger", "Tebligat Adresi")}
              <input
                type="text"
                id={getFieldId("adres_deger")}
                autoComplete="street-address"
                value={formData.adres_deger || ""}
                onChange={(e) => handleFieldChange("adres_deger", e.target.value)}
                onBlur={() => markFieldTouched("adres_deger")}
                placeholder="Örnek Mah. İnşaat Cad. No:12/4 Çankaya / ANKARA"
                aria-describedby="istifa-adres_deger-guidance"
                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
              <BelgeFieldGuidanceView
                id="istifa-adres_deger-guidance"
                guidance={evaluateFieldGuidance("santiye-sefi-istifa-dilekcesi", "adres_deger", formData.adres_deger, {
                    layout: layouts?.adres_deger,
                  isTouched: true,
                })}
              />
            </div>
          </div>

          </div>
        </div>

        <div
          id="istifa-mobile-panel-preview"
          role="region"
          aria-label="PDF önizleme paneli"
          className={`flex flex-1 min-h-0 min-w-0 ${activeTabMobile === "preview" ? "" : "absolute inset-0 invisible pointer-events-none lg:static lg:visible lg:pointer-events-auto"}`}
        >
          <BelgeStudioPdfPreview
            snapshot={snapshot}
            generationPending={document.status === "generating"}
            generationError={document.status === "error" ? document.error : null}
            onStatusChange={(revision, status) => setPreviewResult({ revision, status })}
            onRetry={document.retry}
            activeTabMobile={activeTabMobile}
            editing={{
              documentId: "santiye-sefi-istifa-dilekcesi",
              values: formData as unknown as Record<string, string>,
              onCommit: (field, value) => handleFieldChange(field as keyof IstifaDilekcesiData, value),
            }}
            formView={formView}
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
        documentId="santiye-sefi-istifa-dilekcesi"
        templateFilename="SANTIYE_SEFI_ISTIFA_DILEKCESI_BOS.pdf"
        formView={formView}
      />
    </div>
  );
}
