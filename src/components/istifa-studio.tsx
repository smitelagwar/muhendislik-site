"use client";

import { useEffect, useRef, useState } from "react";
import { FilePenLine } from "lucide-react";
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
  const [toolbarTarget, setToolbarTarget] = useState<HTMLDivElement | null>(null);
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
    documentId: "santiye-sefi-istifa-dilekcesi",
    studioRootRef,
  });

  const sectionsApi = useBelgeStudioSections({
    studioRootRef,
    documentId: "santiye-sefi-istifa-dilekcesi",
    formData: formData as unknown as Record<string, unknown>,
  });

  const shareApi = useBelgeShare({
    documentId: "santiye-sefi-istifa-dilekcesi",
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
    documentId: "santiye-sefi-istifa-dilekcesi",
    formData,
    setFormData,
    initialData: initialData ?? ISTIFA_DILEKCESI_DEFAULT_DATA,
    setUndoData,
  });

  useEffect(() => {
    prewarmBelgeDocument("santiye-sefi-istifa-dilekcesi");
  }, []);

  // Field change handler
  const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof IstifaDilekcesiData, boolean>>>({});
  const markFieldTouched = (key: keyof IstifaDilekcesiData) => {
    setTouchedFields((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const handleFieldChange = (key: keyof IstifaDilekcesiData, value: string) => {
    draft.markFormMutated();
    setUndoData(null);
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Local per-field reset handler: restores ONLY this specific field to original default
  const handleLocalFieldReset = (key: keyof IstifaDilekcesiData) => {
    handleFieldChange(key, ISTIFA_DILEKCESI_DEFAULT_DATA[key] ?? "");
  };

  // Global reset to original PDF default values (Sıfırla - V3 onaysız ve anında kalıcı)
  const handleResetToPdfDefaults = () => {
    clearFieldFocusSelection();
    setUndoData({ ...formData });
    draft.replaceAndPersist({ ...ISTIFA_DILEKCESI_DEFAULT_DATA }, "reset");
  };

  // Clear all fields (Temizle - V3 onaysız ve anında kalıcı)
  const handleClearAll = () => {
    clearFieldFocusSelection();
    setUndoData({ ...formData });
    draft.replaceAndPersist(
      {
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
    <BelgeStudioMobileProvider>
      <div
        ref={studioRootRef}
        data-studio-locked={isModal ? undefined : "true"}
        data-belge-readability-root=""
        data-belge-readability-active={readability.settings.uiScale !== 100 || readability.settings.textScale !== 100 || readability.settings.highContrast || readability.settings.comfortableReading || readability.settings.largeTargets ? "true" : undefined}
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
        title="Şantiye Şefi İstifa Dilekçesi"
        subtitle="Resmî Görevden Ayrılma & İdareye Bildirim Dilekçesi"
        icon={<FilePenLine className="h-4 w-4" />}
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
          id="istifa-mobile-panel-form"
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
          <BelgePdfLayoutWarnings documentId="santiye-sefi-istifa-dilekcesi" layouts={layouts} excludedFields={["tarih", "tc_deger", "iletisim_deger", "adres_deger"]} />

          <BelgeStudioSectionMasterControls sectionsApi={sectionsApi} />

          {/* Section: Hitap ve İdare Bilgileri */}
          <BelgeStudioSection
            section={sectionsApi.sections[0]}
            isOpen={sectionsApi.isSectionOpen(sectionsApi.sections[0].id)}
            onToggle={() => sectionsApi.toggleSection(sectionsApi.sections[0].id)}
            filledCount={sectionsApi.getSectionFilledCount(sectionsApi.sections[0].id)}
          >
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
          </BelgeStudioSection>

          {/* Section: Dilekçe Metni & Talep */}
          <BelgeStudioSection
            section={sectionsApi.sections[1]}
            isOpen={sectionsApi.isSectionOpen(sectionsApi.sections[1].id)}
            onToggle={() => sectionsApi.toggleSection(sectionsApi.sections[1].id)}
            filledCount={sectionsApi.getSectionFilledCount(sectionsApi.sections[1].id)}
          >
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
          </BelgeStudioSection>

          {/* Section: Şantiye Şefi & İletişim Bilgileri */}
          <BelgeStudioSection
            section={sectionsApi.sections[2]}
            isOpen={sectionsApi.isSectionOpen(sectionsApi.sections[2].id)}
            onToggle={() => sectionsApi.toggleSection(sectionsApi.sections[2].id)}
            filledCount={sectionsApi.getSectionFilledCount(sectionsApi.sections[2].id)}
          >
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
          </BelgeStudioSection>

          </div>
          </div>
        </div>

        <div
          id="istifa-mobile-panel-preview"
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
              documentId: "santiye-sefi-istifa-dilekcesi",
              values: formData as unknown as Record<string, string>,
              onCommit: (field, value) => handleFieldChange(field as keyof IstifaDilekcesiData, value),
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
        documentId="santiye-sefi-istifa-dilekcesi"
        templateFilename="SANTIYE_SEFI_ISTIFA_DILEKCESI_BOS.pdf"
        formView={formView}
        readability={readability}
      />
        <BelgeShareDialog share={shareApi} documentTitle="Şantiye Şefi İstifa Dilekçesi" />
      </div>
    </BelgeStudioMobileProvider>
  );
}
