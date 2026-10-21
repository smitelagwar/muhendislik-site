"use client";

import { useEffect, useRef, useState } from "react";
import {
  Building2,
  FileSignature,
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
  TAAHHUTNAME_DEFAULT_DATA,
  TaahhutnameData,
  downloadFilledTaahhutnamePdf,
  BELGE_DOCUMENT_GENERATORS,
  prewarmBelgeDocument,
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

  const [undoData, setUndoData] = useState<TaahhutnameData | null>(null);

  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [activeTabMobile, setActiveTabMobile] = useState<"form" | "preview">("preview");
  const [previewResult, setPreviewResult] = useState<{ revision: number; status: BelgePreviewStatus }>({ revision: 0, status: "loading" });
  const studioRootRef = useRef<HTMLDivElement | null>(null);
  const downloadInFlightRef = useRef(false);
  const document = useBelgeStudioDocument(formData, BELGE_DOCUMENT_GENERATORS["santiye-sefi-taahhutnamesi"]);
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

  useEffect(() => {
    prewarmBelgeDocument("santiye-sefi-taahhutnamesi");
  }, []);

  // Field change handler
  const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof TaahhutnameData, boolean>>>({});
  const markFieldTouched = (key: keyof TaahhutnameData) => {
    setTouchedFields((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const handleFieldChange = (key: keyof TaahhutnameData, value: string) => {
    setUndoData(null);
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
    handleFieldChange(key, TAAHHUTNAME_DEFAULT_DATA[key] ?? "");
  };

  // Global reset to original PDF default values (Sıfırla)
  const handleResetToPdfDefaults = () => {
    setUndoData({ ...formData });
    setFormData({ ...TAAHHUTNAME_DEFAULT_DATA });
  };

  // Clear all fields (Temizle)
  const handleClearAll = () => {
    setUndoData({ ...formData });
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
      await downloadFilledTaahhutnamePdf(formData, undefined, currentSnapshot.bytes);
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
          id="taahhutname-mobile-panel-form"
          role="region"
          aria-label="Belge form alanları"
          data-testid="belge-studio-form-scroll"
          className={`${BELGE_STUDIO_FORM_SCROLL_CLASS} ${
            activeTabMobile === "form" ? "block" : "hidden lg:block"
          }`}
        >
          <BelgePdfLayoutWarnings documentId="santiye-sefi-taahhutnamesi" layouts={layouts} excludedFields={["tc_kimlik_no", "telefon", "adres", "yapi_adresi", "yapi_sahibi_adresi", "tarih"]} />
          {/* Top Title & Sync Status (Desktop compact inline) */}
          <div className="hidden lg:flex items-center justify-between pb-1 border-b border-border/60">
            <div className="flex items-center gap-1.5">
              <BelgeFormEditIcon className="h-3.5 w-3.5 text-amber-500" />
              <h2 className="text-xs font-bold text-foreground">
                Şantiye Şefi Taahhütnamesi
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
                  id={getFieldId("tc_kimlik_no")}
                  inputMode="numeric"
                  value={formData.tc_kimlik_no || ""}
                  onChange={(e) => handleFieldChange("tc_kimlik_no", e.target.value)}
                  onBlur={() => markFieldTouched("tc_kimlik_no")}
                  placeholder="11111111110"
                  aria-describedby="taahhut-tc_kimlik_no-guidance"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
                <BelgeFieldGuidanceView
                  id="taahhut-tc_kimlik_no-guidance"
                  guidance={evaluateFieldGuidance("santiye-sefi-taahhutnamesi", "tc_kimlik_no", formData.tc_kimlik_no, {
                    layout: layouts?.tc_kimlik_no,
                    isTouched: touchedFields.tc_kimlik_no,
                  })}
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
                  onBlur={() => markFieldTouched("telefon")}
                  placeholder="0566 666 66 66"
                  aria-describedby="taahhut-telefon-guidance"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
                <BelgeFieldGuidanceView
                  id="taahhut-telefon-guidance"
                  guidance={evaluateFieldGuidance("santiye-sefi-taahhutnamesi", "telefon", formData.telefon, {
                    layout: layouts?.telefon,
                    isTouched: touchedFields.telefon,
                  })}
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
                onBlur={() => markFieldTouched("adres")}
                placeholder="Örnek Mah. Mühendisler Cad. No:1/A Çankaya / ANKARA"
                aria-describedby="taahhut-adres-guidance"
                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
              <BelgeFieldGuidanceView
                id="taahhut-adres-guidance"
                guidance={evaluateFieldGuidance("santiye-sefi-taahhutnamesi", "adres", formData.adres, {
                    layout: layouts?.adres,
                  isTouched: true,
                })}
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
                onBlur={() => markFieldTouched("yapi_adresi")}
                placeholder="Örnek Mah. Yapı Cad. No:10 Çankaya / ANKARA"
                aria-describedby="taahhut-yapi_adresi-guidance"
                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
              <BelgeFieldGuidanceView
                id="taahhut-yapi_adresi-guidance"
                guidance={evaluateFieldGuidance("santiye-sefi-taahhutnamesi", "yapi_adresi", formData.yapi_adresi, {
                    layout: layouts?.yapi_adresi,
                  isTouched: true,
                })}
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
                  onBlur={() => markFieldTouched("yapi_sahibi_adresi")}
                  placeholder="Çankaya / ANKARA"
                  aria-describedby="taahhut-yapi_sahibi_adresi-guidance"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
                <BelgeFieldGuidanceView
                  id="taahhut-yapi_sahibi_adresi-guidance"
                  guidance={evaluateFieldGuidance("santiye-sefi-taahhutnamesi", "yapi_sahibi_adresi", formData.yapi_sahibi_adresi, {
                    layout: layouts?.yapi_sahibi_adresi,
                    isTouched: true,
                  })}
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
                  onBlur={() => markFieldTouched("tarih")}
                  placeholder="16.08.2026"
                  aria-describedby="taahhut-tarih-guidance"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
                <BelgeFieldGuidanceView
                  id="taahhut-tarih-guidance"
                  guidance={evaluateFieldGuidance("santiye-sefi-taahhutnamesi", "tarih", formData.tarih, {
                    layout: layouts?.tarih,
                    isTouched: touchedFields.tarih,
                  })}
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

        </div>

        <div
          id="taahhutname-mobile-panel-preview"
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
              documentId: "santiye-sefi-taahhutnamesi",
              values: formData as unknown as Record<string, string>,
              onCommit: (field, value) => handleFieldChange(field as keyof TaahhutnameData, value),
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
        documentId="santiye-sefi-taahhutnamesi"
        templateFilename="SANTIYE_SEFI_TAAHHUTNAMESI_BOS.pdf"
      />
    </div>
  );
}
