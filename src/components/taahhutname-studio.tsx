"use client";

import { useEffect, useRef, useState } from "react";
import { FileSignature } from "lucide-react";
import { printPdfFromBlobUrl } from "@/lib/belge-studio-pdf-actions";
import {
  BELGE_STUDIO_FORM_SCROLL_CLASS,
  BELGE_STUDIO_MAIN_SPLIT_CLASS,
} from "@/lib/belge-studio-layout";
import { useBelgeStudioMobileViewport } from "@/hooks/use-belge-studio-mobile-viewport";
import { useBelgeStudioFormView } from "@/hooks/use-belge-studio-form-view";
import { useBelgeStudioReadability } from "@/hooks/use-belge-studio-readability";
import { useBelgeStudioPdfFocus } from "@/hooks/use-belge-studio-pdf-focus";
import { useBelgeFieldFocus } from "@/hooks/use-belge-field-focus";
import { useBelgeStudioDocument } from "@/hooks/use-belge-studio-document";
import { BelgeStudioPdfPreview, type BelgePreviewStatus } from "@/components/belge-studio-pdf-preview";
import { BelgeStudioActions } from "@/components/belge-studio-actions";
import { useBelgeShare } from "@/hooks/use-belge-share";
import { BelgeShareDialog } from "@/components/belge-paylasim/belge-share-dialog";
import { BelgePdfLayoutWarnings } from "@/components/belge-pdf-layout-warnings";
import { BelgeFieldGuidanceView, evaluateFieldGuidance } from "@/components/belge-field-guidance";
import {
  BelgeResetIcon,
} from "@/components/belge-studio-icons";
import { useBelgeAutoDraft } from "@/hooks/use-belge-auto-draft";
import {
  BelgeStudioDraftControls,
} from "@/components/belge-studio-draft-controls";
import { BelgeStudioUnifiedHeader } from "@/components/belge-studio-unified-header";
import { BelgeStudioMobileProvider } from "@/components/belge-studio-mobile-context";
import { useBelgeStudioSections } from "@/hooks/use-belge-studio-sections";
import {
  BelgeStudioSection,
  BelgeStudioSectionMasterControls,
} from "@/components/belge-studio-section";
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
  const [toolbarTarget, setToolbarTarget] = useState<HTMLDivElement | null>(null);
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
  const readability = useBelgeStudioReadability();
  const { scrollContainerRef, contentWrapperRef, contentWrapperProps, ...formView } = useBelgeStudioFormView({ isModal });
  void contentWrapperRef;
  const pdfFocus = useBelgeStudioPdfFocus({
    scrollContainerRef: scrollContainerRef,
    isModal,
  });
  const {
    selection: fieldFocus,
    containerProps: formFocusContainerProps,
    clearSelection: clearFieldFocusSelection,
  } = useBelgeFieldFocus({
    documentId: "santiye-sefi-taahhutnamesi",
    studioRootRef,
  });

  const sectionsApi = useBelgeStudioSections({
    studioRootRef,
    documentId: "santiye-sefi-taahhutnamesi",
    formData: formData as unknown as Record<string, unknown>,
  });

  const shareApi = useBelgeShare({
    documentId: "santiye-sefi-taahhutnamesi",
    getSnapshotValues: () => formData as unknown as Record<string, string>,
    isReady: document.status === "ready" && previewIsCurrent && previewResult.status === "ready",
    snapshotRevision: document.status === "ready" && previewIsCurrent && previewResult.status === "ready"
      ? snapshot?.revision ?? null
      : null,
  });

  // Odaklanan alan kapalı bir bölüme aitse o bölümü otomatik genişlet (yalnızca yeni odak event'inde tetiklenir)
  const lastRevealedFocusEventIdRef = useRef<number>(0);
  const { revealField } = sectionsApi;
  useEffect(() => {
    if (
      fieldFocus?.focusEventId &&
      fieldFocus.focusEventId !== lastRevealedFocusEventIdRef.current &&
      fieldFocus.fieldKey
    ) {
      lastRevealedFocusEventIdRef.current = fieldFocus.focusEventId;
      revealField(fieldFocus.fieldKey);
    }
  }, [fieldFocus?.focusEventId, fieldFocus?.fieldKey, revealField]);

  const draft = useBelgeAutoDraft({
    documentId: "santiye-sefi-taahhutnamesi",
    formData,
    setFormData,
    initialData: initialData ?? TAAHHUTNAME_DEFAULT_DATA,
    setUndoData,
  });

  useEffect(() => {
    prewarmBelgeDocument("santiye-sefi-taahhutnamesi");
  }, []);

  // Field change handler
  const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof TaahhutnameData, boolean>>>({});
  const markFieldTouched = (key: keyof TaahhutnameData) => {
    setTouchedFields((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const handleFieldChange = (key: keyof TaahhutnameData, value: string) => {
    draft.markFormMutated();
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

  // Global reset to original PDF default values (Sıfırla - V3 onaysız ve anında kalıcı)
  const handleResetToPdfDefaults = () => {
    clearFieldFocusSelection();
    setUndoData({ ...formData });
    draft.replaceAndPersist({ ...TAAHHUTNAME_DEFAULT_DATA }, "reset");
  };

  // Clear all fields (Temizle - V3 onaysız ve anında kalıcı)
  const handleClearAll = () => {
    clearFieldFocusSelection();
    setUndoData({ ...formData });
    draft.replaceAndPersist(
      {
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
      },
      "clear"
    );
  };

  const handleUndo = () => {
    if (!undoData) return;
    const previous = undoData;
    setUndoData(null);
    draft.replaceAndPersist(previous, "undo");
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
    <BelgeStudioMobileProvider>
      <div
        ref={studioRootRef}
        data-studio-locked={isModal ? undefined : "true"}
        data-belge-readability-root=""
        data-belge-ui-large={readability.settings.uiScale >= 150 || readability.settings.textScale >= 150 ? "true" : undefined}
        data-belge-high-contrast={readability.settings.highContrast ? "true" : undefined}
        data-belge-comfortable={readability.settings.comfortableReading ? "true" : undefined}
        data-belge-large-targets={readability.settings.largeTargets ? "true" : undefined}
        style={readability.rootStyle}
        className={`flex flex-col bg-background text-foreground w-full max-w-full min-w-0 h-full overflow-hidden ${
          isModal
          ? "max-h-[96vh] rounded-2xl border border-border shadow-2xl"
          : "rounded-none border-0 bg-transparent shadow-none backdrop-blur-none"
      }`}
    >
      <span role="status" aria-live="polite" className="sr-only">
        {previewStatusMessage}
      </span>

      {/* Top Header Bar: Unified across modal and standard page views, desktop and mobile */}
      <BelgeStudioUnifiedHeader
        title="Şantiye Şefi Taahhütnamesi"
        subtitle="Görev Üstlenme & Yasal Sorumluluk Formu"
        icon={<FileSignature className="h-4 w-4" />}
        isModal={isModal}
        onClose={onClose}
        draftApi={draft}
        syncStatus={syncStatus}
        toolbarSlotRef={setToolbarTarget}
      />
      {/* Draft Notification Banner (Consent / Recovery / Conflict / Error) */}
      <BelgeStudioDraftControls draftApi={draft} />

      {/* Main Split Layout: Left Form & Right Live PDF (Maximized height, zero outer scroll) */}
      <div className={BELGE_STUDIO_MAIN_SPLIT_CLASS}>
        {/* Left Column: Form Inputs & Action Buttons (Independent vertical scroll inside form) */}
        <div
          ref={scrollContainerRef}
          id="taahhutname-mobile-panel-form"
          role="region"
          aria-label="Belge form alanları"
          data-testid="belge-studio-form-scroll"
          className={`${BELGE_STUDIO_FORM_SCROLL_CLASS} ${
            pdfFocus.isPdfFocus
              ? "hidden"
              : activeTabMobile === "form"
                ? "block"
                : "hidden lg:block"
          }`}
          {...formFocusContainerProps}
        >
          <div className="belge-readability-form-content">
          <div {...contentWrapperProps}>
          <BelgePdfLayoutWarnings documentId="santiye-sefi-taahhutnamesi" layouts={layouts} excludedFields={["tc_kimlik_no", "telefon", "adres", "yapi_adresi", "yapi_sahibi_adresi", "tarih"]} />

          <BelgeStudioSectionMasterControls sectionsApi={sectionsApi} />

          {/* Section: Şantiye Şefi Kimlik ve Oda Bilgileri */}
          <BelgeStudioSection
            section={sectionsApi.sections[0]}
            isOpen={sectionsApi.isSectionOpen(sectionsApi.sections[0].id)}
            onToggle={() => sectionsApi.toggleSection(sectionsApi.sections[0].id)}
            filledCount={sectionsApi.getSectionFilledCount(sectionsApi.sections[0].id)}
          >
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
          </BelgeStudioSection>

          {/* Section: Yapı ve Ruhsat Bilgileri */}
          <BelgeStudioSection
            section={sectionsApi.sections[1]}
            isOpen={sectionsApi.isSectionOpen(sectionsApi.sections[1].id)}
            onToggle={() => sectionsApi.toggleSection(sectionsApi.sections[1].id)}
            filledCount={sectionsApi.getSectionFilledCount(sectionsApi.sections[1].id)}
          >
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
          </BelgeStudioSection>

          {/* Section: Tarih ve İmza */}
          <BelgeStudioSection
            section={sectionsApi.sections[2]}
            isOpen={sectionsApi.isSectionOpen(sectionsApi.sections[2].id)}
            onToggle={() => sectionsApi.toggleSection(sectionsApi.sections[2].id)}
            filledCount={sectionsApi.getSectionFilledCount(sectionsApi.sections[2].id)}
          >
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
          </BelgeStudioSection>

          </div>
          </div>
        </div>

        <div
          id="taahhutname-mobile-panel-preview"
          role="region"
          aria-label="PDF önizleme paneli"
          className={`flex flex-1 min-h-0 min-w-0 ${
            pdfFocus.isPdfFocus
              ? "w-full"
              : activeTabMobile === "preview"
                ? ""
                : "absolute inset-0 invisible pointer-events-none lg:static lg:visible lg:pointer-events-auto"
          }`}
        >
          <BelgeStudioPdfPreview
            snapshot={snapshot}
            generationPending={document.status === "generating"}
            generationError={document.status === "error" ? document.error : null}
            onStatusChange={(revision, status) => setPreviewResult({ revision, status })}
            onRetry={document.retry}
            activeTabMobile={activeTabMobile}
            fieldFocus={fieldFocus}
            onClearFieldFocus={clearFieldFocusSelection}
            editing={{
              documentId: "santiye-sefi-taahhutnamesi",
              values: formData as unknown as Record<string, string>,
              onCommit: (field, value) => handleFieldChange(field as keyof TaahhutnameData, value),
            }}
            formView={formView}
            pdfFocus={pdfFocus}
            toolbarTarget={toolbarTarget}
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
        onShare={shareApi.openShareDialog}
        onDownload={handleDownload}
        ready={document.status === "ready"}
        downloading={isDownloading}
        documentId="santiye-sefi-taahhutnamesi"
        templateFilename="SANTIYE_SEFI_TAAHHUTNAMESI_BOS.pdf"
        formView={formView}
        readability={readability}
      />
        <BelgeShareDialog share={shareApi} documentTitle="Şantiye Şefi Taahhütnamesi" />
      </div>
    </BelgeStudioMobileProvider>
  );
}
