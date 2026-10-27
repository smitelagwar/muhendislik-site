"use client";

import { useEffect, useRef, useState } from "react";
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
  BelgeFormEditIcon,
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
  BETON_DOKUM_DEFAULT_DATA,
  BetonDokumData,
  downloadFilledBetonDokumPdf,
  BELGE_DOCUMENT_GENERATORS,
  prewarmBelgeDocument,
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
  const [activeTabMobile, setActiveTabMobile] = useState<"form" | "preview">("preview");
  const [previewResult, setPreviewResult] = useState<{ revision: number; status: BelgePreviewStatus }>({ revision: 0, status: "loading" });
  const [toolbarTarget, setToolbarTarget] = useState<HTMLDivElement | null>(null);
  const studioRootRef = useRef<HTMLDivElement | null>(null);
  const downloadInFlightRef = useRef(false);
  const document = useBelgeStudioDocument(formData, BELGE_DOCUMENT_GENERATORS["beton-dokum-tutanagi"]);
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
    documentId: "beton-dokum-tutanagi",
    studioRootRef,
  });

  const sectionsApi = useBelgeStudioSections({
    studioRootRef,
    documentId: "beton-dokum-tutanagi",
    formData: formData as unknown as Record<string, unknown>,
  });

  const shareApi = useBelgeShare({
    documentId: "beton-dokum-tutanagi",
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

  useEffect(() => {
    prewarmBelgeDocument("beton-dokum-tutanagi");
  }, []);

  const draft = useBelgeAutoDraft({
    documentId: "beton-dokum-tutanagi",
    formData,
    setFormData,
    initialData: BETON_DOKUM_DEFAULT_DATA,
    setUndoData,
  });

  // Field change handler
  const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof BetonDokumData, boolean>>>({});
  const markFieldTouched = (key: keyof BetonDokumData) => {
    setTouchedFields((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const handleFieldChange = (key: keyof BetonDokumData, value: string) => {
    draft.markFormMutated();
    setUndoData(null);
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Local per-field reset handler: restores ONLY this specific field to original default
  const handleLocalFieldReset = (key: keyof BetonDokumData) => {
    handleFieldChange(key, BETON_DOKUM_DEFAULT_DATA[key] ?? "");
  };

  // Global reset to original PDF default values (Sıfırla - V3 onaysız ve anında kalıcı)
  const handleResetToPdfDefaults = () => {
    clearFieldFocusSelection();
    setUndoData({ ...formData });
    draft.replaceAndPersist({ ...BETON_DOKUM_DEFAULT_DATA }, "reset");
  };

  // Clear all fields (Temizle - V3 onaysız ve anında kalıcı)
  const handleClearAll = () => {
    clearFieldFocusSelection();
    setUndoData({ ...formData });
    draft.replaceAndPersist(
      {
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
        title="Beton Döküm Tutanağı"
        subtitle="Şantiye Beton Döküm & Kalite Kontrol Formu"
        icon={<BelgeFormEditIcon className="h-4 w-4" />}
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
          id="beton-dokum-mobile-panel-form"
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
          <BelgePdfLayoutWarnings documentId="beton-dokum-tutanagi" layouts={layouts} excludedFields={["tarih", "yer"]} />

          <BelgeStudioSectionMasterControls sectionsApi={sectionsApi} />

          {/* 1. Belge & Kayıt (Tutanak Alt Başlığı, Tarih & YİBF) */}
          <BelgeStudioSection
            section={sectionsApi.sections[0]}
            isOpen={sectionsApi.isSectionOpen(sectionsApi.sections[0].id)}
            onToggle={() => sectionsApi.toggleSection(sectionsApi.sections[0].id)}
            filledCount={sectionsApi.getSectionFilledCount(sectionsApi.sections[0].id)}
          >
            <div>
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

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                {renderFieldHeader("Tarih", "tarih")}
                <input
                  type="text"
                  id={getFieldId("tarih")}
                  value={formData.tarih || ""}
                  onChange={(e) => handleFieldChange("tarih", e.target.value)}
                  onBlur={() => markFieldTouched("tarih")}
                  placeholder="10.08.2026"
                  aria-describedby="beton-dokum-tarih-guidance"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
                <BelgeFieldGuidanceView
                  id="beton-dokum-tarih-guidance"
                  guidance={evaluateFieldGuidance("beton-dokum-tutanagi", "tarih", formData.tarih, {
                    layout: layouts?.tarih,
                    isTouched: touchedFields.tarih,
                  })}
                />
              </div>

              <div
                className={`rounded-lg transition-colors ${(formData.yibf || "").trim().length > 7
                  ? "border border-red-500/60 bg-red-500/[0.04] p-1.5 dark:bg-red-950/20"
                  : ""
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
                      <BelgeResetIcon className="h-2.5 w-2.5" />
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
          </BelgeStudioSection>

          {/* 2. Şantiye Yeri */}
          <BelgeStudioSection
            section={sectionsApi.sections[1]}
            isOpen={sectionsApi.isSectionOpen(sectionsApi.sections[1].id)}
            onToggle={() => sectionsApi.toggleSection(sectionsApi.sections[1].id)}
            filledCount={sectionsApi.getSectionFilledCount(sectionsApi.sections[1].id)}
          >
            {renderFieldHeader("Şantiye Yeri", "yer", "(İl/İlçe/Mahalle/Ada/Parsel)")}
            <textarea
              rows={2}
              id={getFieldId("yer")}
              value={formData.yer || ""}
              onChange={(e) => handleFieldChange("yer", e.target.value)}
              onBlur={() => markFieldTouched("yer")}
              placeholder="ANKARA İli ÇANKAYA İlçesi Örnek Mahallesi 1234 ada 56 parsel"
              aria-describedby="beton-dokum-yer-guidance"
              className="w-full rounded-md border border-border bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 resize-none"
            />
            <BelgeFieldGuidanceView
              id="beton-dokum-yer-guidance"
              guidance={evaluateFieldGuidance("beton-dokum-tutanagi", "yer", formData.yer, {
                    layout: layouts?.yer,
                isTouched: true,
              })}
            />
          </BelgeStudioSection>

          {/* 3. Olay Açıklaması & Gözlem */}
          <BelgeStudioSection
            section={sectionsApi.sections[2]}
            isOpen={sectionsApi.isSectionOpen(sectionsApi.sections[2].id)}
            onToggle={() => sectionsApi.toggleSection(sectionsApi.sections[2].id)}
            filledCount={sectionsApi.getSectionFilledCount(sectionsApi.sections[2].id)}
          >
            <div>
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

            <div>
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
          </BelgeStudioSection>

          {/* 4. İmzacı Taraflar (4 Taraf) */}
          <BelgeStudioSection
            section={sectionsApi.sections[3]}
            isOpen={sectionsApi.isSectionOpen(sectionsApi.sections[3].id)}
            onToggle={() => sectionsApi.toggleSection(sectionsApi.sections[3].id)}
            filledCount={sectionsApi.getSectionFilledCount(sectionsApi.sections[3].id)}
          >
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
          </BelgeStudioSection>

          </div>
          </div>
        </div>

        <div
          id="beton-dokum-mobile-panel-preview"
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
            editing={{
              documentId: "beton-dokum-tutanagi",
              values: formData as unknown as Record<string, string>,
              onCommit: (field, value) => handleFieldChange(field as keyof BetonDokumData, value),
            }}
            formView={formView}
            fieldFocus={fieldFocus}
            onClearFieldFocus={clearFieldFocusSelection}
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
        documentId="beton-dokum-tutanagi"
        templateFilename="BETON_DOKUM_TUTANAGI_BOS_SABLON.pdf"
        formView={formView}
        readability={readability}
      />
        <BelgeShareDialog share={shareApi} documentTitle="Beton Döküm Tutanağı" />
      </div>
    </BelgeStudioMobileProvider>
  );
}
