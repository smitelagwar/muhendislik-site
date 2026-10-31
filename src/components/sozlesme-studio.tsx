"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileCheck2 } from "lucide-react";
import { printPdfFromBlobUrl } from "@/lib/belge-studio-pdf-actions";
import {
  BELGE_STUDIO_FORM_SCROLL_CLASS,
  BELGE_STUDIO_MAIN_SPLIT_CLASS,
} from "@/lib/belge-studio-layout";
import { useBelgeStudioMobileViewport } from "@/hooks/use-belge-studio-mobile-viewport";
import { useBelgeStudioDocument } from "@/hooks/use-belge-studio-document";
import { useBelgeStudioFormView } from "@/hooks/use-belge-studio-form-view";
import { useBelgeStudioReadability } from "@/hooks/use-belge-studio-readability";
import { useBelgeStudioPdfFocus } from "@/hooks/use-belge-studio-pdf-focus";
import { useBelgeFieldFocus } from "@/hooks/use-belge-field-focus";
import { BelgeStudioPdfPreview, type BelgePreviewStatus } from "@/components/belge-studio-pdf-preview";
import { BelgeStudioActions } from "@/components/belge-studio-actions";
import { useBelgeShare } from "@/hooks/use-belge-share";
import { BelgeShareDialog } from "@/components/belge-paylasim/belge-share-dialog";
import { BelgePdfLayoutWarnings } from "@/components/belge-pdf-layout-warnings";
import { BelgeFieldGuidanceView, evaluateFieldGuidance } from "@/components/belge-field-guidance";
import {
  BelgePdfFocusExitIcon,
  BelgeResetIcon,
} from "@/components/belge-studio-icons";
import { useBelgeAutoDraft } from "@/hooks/use-belge-auto-draft";
import { useBelgeStudioAccount, type BelgeStudioIdentity } from "@/hooks/use-belge-account-studio";
import { resolveBelgeBaseData } from "@/lib/belge-hesap/resolve-base-data";
import { BelgeProfileSampleNotice } from "@/components/belge-hesap/sample-notice";
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
import { useBelgeStudioResizer } from "@/hooks/use-belge-studio-resizer";
import { BelgeStudioResizer } from "@/components/belge-studio-resizer";
import { maskDate } from "@/lib/belge-input-mask";
import {
  SOZLESME_DEFAULT_DATA,
  SozlesmeData,
  downloadFilledSozlesmePdf,
  BELGE_DOCUMENT_GENERATORS,
  prewarmBelgeDocument,
} from "@/lib/pdf-engine";

interface SozlesmeStudioProps {
  initialData?: Partial<SozlesmeData>;
  onClose?: () => void;
  isModal?: boolean;
}

export function SozlesmeStudio(props: SozlesmeStudioProps) {
  const account = useBelgeStudioAccount();
  if (!account.ready) {
    return <div role="status" className="flex h-full w-full items-center justify-center bg-background text-sm text-muted-foreground">Belge bilgileri yükleniyor...</div>;
  }
  const identityKey = account.scope.kind === "account" ? account.scope.accountId : "guest";
  return <SozlesmeStudioInner key={identityKey} {...props} {...account} />;
}

function SozlesmeStudioInner({
  initialData,
  onClose,
  isModal = false,
  profile,
  scope,
  warning,
  skipGuestRestore,
}: SozlesmeStudioProps & BelgeStudioIdentity) {
  const baseData = useMemo<SozlesmeData>(
    () => ({ ...SOZLESME_DEFAULT_DATA, ...resolveBelgeBaseData("santiye-sefi-sozlesmesi", profile).data, ...initialData }),
    [profile, initialData],
  );
  const [formData, setFormData] = useState<SozlesmeData>(() => ({ ...baseData }));

  const [undoData, setUndoData] = useState<SozlesmeData | null>(null);

  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [activeTabMobile, setActiveTabMobile] = useState<"form" | "preview">("preview");
  const [previewResult, setPreviewResult] = useState<{ revision: number; status: BelgePreviewStatus }>({ revision: 0, status: "loading" });
  const [toolbarTarget, setToolbarTarget] = useState<HTMLDivElement | null>(null);
  const studioRootRef = useRef<HTMLDivElement | null>(null);
  const downloadInFlightRef = useRef(false);
  const document = useBelgeStudioDocument(formData, BELGE_DOCUMENT_GENERATORS["santiye-sefi-sozlesmesi"]);
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
  const resizer = useBelgeStudioResizer();
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
    documentId: "santiye-sefi-sozlesmesi",
    studioRootRef,
  });

  const sectionsApi = useBelgeStudioSections({
    studioRootRef,
    documentId: "santiye-sefi-sozlesmesi",
    formData: formData as unknown as Record<string, unknown>,
  });

  const shareApi = useBelgeShare({
    documentId: "santiye-sefi-sozlesmesi",
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
    documentId: "santiye-sefi-sozlesmesi",
    formData,
    setFormData,
    initialData: baseData,
    scope,
    skipRestore: skipGuestRestore,
    setUndoData,
  });

  useEffect(() => {
    prewarmBelgeDocument("santiye-sefi-sozlesmesi");
  }, []);

  // Field change handler
  const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof SozlesmeData, boolean>>>({});
  const markFieldTouched = (key: keyof SozlesmeData) => {
    setTouchedFields((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const handleFieldChange = useCallback(
    (field: keyof SozlesmeData, value: string) => {
      draft.markFieldEdited(field);
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
    [draft]
  );

  // Local per-field reset handler
  const handleLocalFieldReset = useCallback((field: keyof SozlesmeData) => {
    handleFieldChange(field, baseData[field] ?? "");
    draft.clearManualField(field);
  }, [handleFieldChange]);

  // Global reset to original PDF default values (Sıfırla - V3 onaysız ve anında kalıcı)
  const handleResetToPdfDefaults = useCallback(() => {
    clearFieldFocusSelection();
    setUndoData({ ...formData });
    draft.replaceAndPersist({ ...baseData }, "reset");
  }, [clearFieldFocusSelection, draft, formData]);

  // Clear all fields (Temizle - V3 onaysız ve anında kalıcı)
  const handleClearAll = useCallback(() => {
    clearFieldFocusSelection();
    setUndoData({ ...formData });
    const cleared = Object.fromEntries(
      Object.keys(SOZLESME_DEFAULT_DATA).map((k) => [k, ""])
    ) as SozlesmeData;
    draft.replaceAndPersist(cleared, "clear");
  }, [clearFieldFocusSelection, draft, formData]);

  const handleUndo = useCallback(() => {
    if (!undoData) return;
    const previous = undoData;
    setUndoData(null);
    draft.replaceAndPersist(previous, "undo");
  }, [draft, undoData]);


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
    const isModified = formData[fieldKey] !== baseData[fieldKey];

    return (
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <label htmlFor={getFieldId(fieldKey)} className="text-[11px] font-bold leading-tight text-foreground truncate" title={label}>
            {label}
          </label>
          {badge && (
            <span className="text-[9px] font-mono text-muted-foreground/80 shrink-0">
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
    <BelgeStudioMobileProvider>
      <div
        ref={studioRootRef}
        data-studio-locked={isModal ? undefined : "true"}
        data-belge-readability-root=""
        data-belge-panel-view={activeTabMobile}
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
        title="Şantiye Şefi Hizmet Sözleşmesi"
        subtitle="Müteahhit ↔ Şantiye Şefi 2 Sayfalı Hizmet Akdi"
        icon={<FileCheck2 className="h-4 w-4" />}
        isModal={isModal}
        onClose={onClose}
        draftApi={draft}
        syncStatus={syncStatus}
        toolbarSlotRef={setToolbarTarget}
      />

      {/* Draft Notification Banner (Consent / Recovery / Conflict / Error) */}
      <BelgeStudioDraftControls draftApi={draft} />
      <BelgeProfileSampleNotice documentId="santiye-sefi-sozlesmesi" profile={profile} warning={warning} values={formData} />

      {/* Main Split Layout: Left Form & Right Live PDF */}
      <div className={BELGE_STUDIO_MAIN_SPLIT_CLASS}>
        {/* Left Column: Form Inputs & Action Buttons */}
        <div
          ref={scrollContainerRef}
          id="sozlesme-mobile-panel-form"
          role="region"
          aria-label="Belge form alanları"
          data-testid="belge-studio-form-scroll"
          className={`${BELGE_STUDIO_FORM_SCROLL_CLASS} ${
            pdfFocus.isPdfFocus
              ? "hidden lg:block lg:overflow-hidden lg:pointer-events-none lg:opacity-0"
              : activeTabMobile === "form"
                ? "block"
                : "hidden lg:block"
          }`}
          style={{
            width: resizer.isDesktop
              ? pdfFocus.isPdfFocus
                ? "0px"
                : `${resizer.panelWidth}px`
              : undefined,
            minWidth: resizer.isDesktop
              ? pdfFocus.isPdfFocus
                ? "0px"
                : `${resizer.panelWidth}px`
              : undefined,
            maxWidth: resizer.isDesktop
              ? pdfFocus.isPdfFocus
                ? "0px"
                : `${resizer.panelWidth}px`
              : undefined,
            borderRightWidth: resizer.isDesktop && pdfFocus.isPdfFocus ? "0px" : undefined,
            transition:
              resizer.isDesktop && !resizer.isDragging
                ? "width 280ms cubic-bezier(0.4,0,0.2,1), min-width 280ms cubic-bezier(0.4,0,0.2,1), max-width 280ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease"
                : "none",
          }}
          {...formFocusContainerProps}
        >
          <div
            className="belge-readability-form-content w-full max-w-full"
            style={{
              zoom: resizer.isDesktop && resizer.derivedZoom !== 1 ? resizer.derivedZoom : undefined,
            }}
          >
          <div {...contentWrapperProps}>
          <BelgePdfLayoutWarnings documentId="santiye-sefi-sozlesmesi" layouts={layouts} excludedFields={["adres", "ucret", "sozlesme_tarihi"]} />

          <BelgeStudioSectionMasterControls
            sectionsApi={sectionsApi}
            onTogglePdfFocus={pdfFocus.onTogglePdfFocus}
          />

          {/* Section 1: Taraflar */}
          <BelgeStudioSection
            section={sectionsApi.sections[0]}
            isOpen={sectionsApi.isSectionOpen(sectionsApi.sections[0].id)}
            onToggle={() => sectionsApi.toggleSection(sectionsApi.sections[0].id)}
            filledCount={sectionsApi.getSectionFilledCount(sectionsApi.sections[0].id)}
          >
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
          </BelgeStudioSection>

          {/* Section 2: İşyeri Bilgileri */}
          <BelgeStudioSection
            section={sectionsApi.sections[1]}
            isOpen={sectionsApi.isSectionOpen(sectionsApi.sections[1].id)}
            onToggle={() => sectionsApi.toggleSection(sectionsApi.sections[1].id)}
            filledCount={sectionsApi.getSectionFilledCount(sectionsApi.sections[1].id)}
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="min-w-0">
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
              <div className="min-w-0">
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
                    layout: layouts?.adres,
                  isTouched: true,
                })}
              />
            </div>

            <div className="grid grid-cols-[2fr_1fr_1fr] gap-2">
              <div className="min-w-0">
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
              <div className="min-w-0">
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
              <div className="min-w-0">
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
                className={`min-w-0 rounded-lg border p-1.5 transition-colors ${
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
                  {formData.yibf !== baseData.yibf && (
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

              <div className="min-w-0">
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
          </BelgeStudioSection>

          {/* Section 3: Ücret ve Sözleşme */}
          <BelgeStudioSection
            section={sectionsApi.sections[2]}
            isOpen={sectionsApi.isSectionOpen(sectionsApi.sections[2].id)}
            onToggle={() => sectionsApi.toggleSection(sectionsApi.sections[2].id)}
            filledCount={sectionsApi.getSectionFilledCount(sectionsApi.sections[2].id)}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="min-w-0">
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
                    layout: layouts?.ucret,
                    isTouched: touchedFields.ucret,
                  })}
                />
              </div>

              <div className="min-w-0">
                {renderFieldHeader("Sözleşme Tarihi", "sozlesme_tarihi", "(Madde 8)")}
                <input
                  type="text"
                  id={getFieldId("sozlesme_tarihi")}
                  value={formData.sozlesme_tarihi || ""}
                  onChange={(e) => handleFieldChange("sozlesme_tarihi", maskDate(e.target.value))}
                  onBlur={() => markFieldTouched("sozlesme_tarihi")}
                  placeholder="01.05.2026"
                  aria-describedby="sozlesme-sozlesme_tarihi-guidance"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-center text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
                <BelgeFieldGuidanceView
                  id="sozlesme-sozlesme_tarihi-guidance"
                  guidance={evaluateFieldGuidance("santiye-sefi-sozlesmesi", "sozlesme_tarihi", formData.sozlesme_tarihi, {
                    layout: layouts?.sozlesme_tarihi,
                    isTouched: touchedFields.sozlesme_tarihi,
                  })}
                />
              </div>
            </div>
          </BelgeStudioSection>

          {/* Section 4: İmza Alanları */}
          <BelgeStudioSection
            section={sectionsApi.sections[3]}
            isOpen={sectionsApi.isSectionOpen(sectionsApi.sections[3].id)}
            onToggle={() => sectionsApi.toggleSection(sectionsApi.sections[3].id)}
            filledCount={sectionsApi.getSectionFilledCount(sectionsApi.sections[3].id)}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="min-w-0">
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
              <div className="min-w-0">
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
          </BelgeStudioSection>

          </div>
          </div>
        </div>

        {/* Masaüstü Sürüklenebilir Panel Ayırıcı */}
        {!pdfFocus.isPdfFocus && <BelgeStudioResizer resizer={resizer} />}

        <div
          id="sozlesme-mobile-panel-preview"
          role="region"
          aria-label="PDF önizleme paneli"
          className={`relative flex flex-1 min-h-0 min-w-0 ${
            pdfFocus.isPdfFocus
              ? "w-full"
              : activeTabMobile === "preview"
                ? ""
                : "absolute inset-0 invisible pointer-events-none lg:static lg:visible lg:pointer-events-auto"
          }`}
        >
          {/* Masaüstünde form kapalıyken formu geri açan zarif buton */}
          {pdfFocus.isPdfFocus && (
            <button
              type="button"
              onClick={pdfFocus.onTogglePdfFocus}
              data-testid="belge-panel-expand-floating-btn"
              className="hidden lg:inline-flex absolute left-3 top-3 z-30 items-center gap-1.5 rounded-lg border border-border/80 bg-background/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-lg backdrop-blur hover:bg-secondary hover:text-amber-600 transition-all cursor-pointer animate-in fade-in slide-in-from-left-2 duration-200"
              title="Formu tekrar göster"
            >
              <BelgePdfFocusExitIcon className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Formu Göster</span>
            </button>
          )}
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
              documentId: "santiye-sefi-sozlesmesi",
              values: formData as unknown as Record<string, string>,
              onCommit: (field, value) => handleFieldChange(field as keyof SozlesmeData, value),
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
        documentId="santiye-sefi-sozlesmesi"
        templateFilename="SANTIYE_SEFI_SOZLESMESI_BOS.pdf"
        formView={formView}
        readability={readability}
      />
        <BelgeShareDialog share={shareApi} documentTitle="Şantiye Şefi Hizmet Sözleşmesi" />
      </div>
    </BelgeStudioMobileProvider>
  );
}
