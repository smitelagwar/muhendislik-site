"use client";

import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Dice5,
} from "lucide-react";
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
  INSAAT_RUHSATI_DEFAULT_DATA,
  InsaatRuhsatiData,
  downloadFilledInsaatRuhsatiPdf,
  BELGE_DOCUMENT_GENERATORS,
  prewarmBelgeDocument,
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
  const [activeTabMobile, setActiveTabMobile] = useState<"form" | "preview">("preview");
  const [previewResult, setPreviewResult] = useState<{ revision: number; status: BelgePreviewStatus }>({ revision: 0, status: "loading" });
  const [toolbarTarget, setToolbarTarget] = useState<HTMLDivElement | null>(null);
  const studioRootRef = useRef<HTMLDivElement | null>(null);
  const downloadInFlightRef = useRef(false);
  const document = useBelgeStudioDocument(formData, BELGE_DOCUMENT_GENERATORS["insaat-ruhsati-dilekcesi"]);
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
    documentId: "insaat-ruhsati-dilekcesi",
    studioRootRef,
  });

  const sectionsApi = useBelgeStudioSections({
    studioRootRef,
    documentId: "insaat-ruhsati-dilekcesi",
    formData: formData as unknown as Record<string, unknown>,
  });

  const shareApi = useBelgeShare({
    documentId: "insaat-ruhsati-dilekcesi",
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
    documentId: "insaat-ruhsati-dilekcesi",
    formData,
    setFormData,
    initialData: initialData ?? INSAAT_RUHSATI_DEFAULT_DATA,
    setUndoData,
  });

  useEffect(() => {
    prewarmBelgeDocument("insaat-ruhsati-dilekcesi");
  }, []);

  // Field change handler
  const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof InsaatRuhsatiData, boolean>>>({});
  const markFieldTouched = (key: keyof InsaatRuhsatiData) => {
    setTouchedFields((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const handleFieldChange = (key: keyof InsaatRuhsatiData, value: string) => {
    draft.markFormMutated();
    setUndoData(null);
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Local per-field reset handler
  const handleLocalFieldReset = (key: keyof InsaatRuhsatiData) => {
    handleFieldChange(key, INSAAT_RUHSATI_DEFAULT_DATA[key] ?? "");
  };

  // Global reset to original PDF default values (Sıfırla - V3 onaysız ve anında kalıcı)
  const handleResetToPdfDefaults = () => {
    clearFieldFocusSelection();
    setUndoData({ ...formData });
    draft.replaceAndPersist({ ...INSAAT_RUHSATI_DEFAULT_DATA }, "reset");
  };

  // Randomize button handler (F06 onay korumalı)
  const handleRandomize = () => {
    const hasValues = Object.values(formData).some((v) => typeof v === "string" && v.trim() !== "");
    if (
      hasValues &&
      typeof window !== "undefined" &&
      !window.confirm("Form alanları örnek rastgele verilerle doldurulacaktır. Mevcut verileriniz değişecektir. Onaylıyor musunuz?")
    ) {
      return;
    }
    clearFieldFocusSelection();
    draft.markFormMutated();
    setUndoData(null);
    const randomIndex = Math.floor(Math.random() * RANDOM_SAMPLES.length);
    const sample = RANDOM_SAMPLES[randomIndex];
    setFormData({ ...sample });
  };

  // Clear all fields (Temizle - V3 onaysız ve anında kalıcı)
  const handleClearAll = () => {
    clearFieldFocusSelection();
    setUndoData({ ...formData });
    draft.replaceAndPersist(
      {
        tarih: "",
        belediye_adi: "",
        mudurluk_adi: "",
        ana_metin: "",
        ad_soyad: "",
        unvan: "",
        adres: "",
        tel: "",
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


  const extraActionNode = (
    <button
      type="button"
      onClick={handleRandomize}
      aria-label="Örnek Veri ile Doldur"
      className="inline-flex min-h-[44px] sm:min-h-[32px] items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-500/20 dark:text-amber-300 transition-all cursor-pointer"
      title="Rastgele örnek bilgileri doldur"
    >
      <Dice5 className="h-3.5 w-3.5" />
      <span>Örnek Veri</span>
    </button>
  );

  return (
    <BelgeStudioMobileProvider initialExtraActions={extraActionNode}>
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
          title="İnşaat Ruhsatı Dilekçesi"
          subtitle="Yapı Ruhsatı Başvuru & İdareye Talep Dilekçesi"
          icon={<Building2 className="h-4 w-4" />}
          isModal={isModal}
          onClose={onClose}
          draftApi={draft}
          syncStatus={syncStatus}
          toolbarSlotRef={setToolbarTarget}
          extraActions={extraActionNode}
        />

      {/* Draft Notification Banner (Consent / Recovery / Conflict / Error) */}
      <BelgeStudioDraftControls draftApi={draft} />

      {/* Main Split Layout: Left Form & Right Live PDF */}
      <div className={BELGE_STUDIO_MAIN_SPLIT_CLASS}>
        {/* Left Column: Form Inputs & Action Buttons */}
        <div
          ref={scrollContainerRef}
          id="insaat-ruhsati-mobile-panel-form"
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
          <BelgePdfLayoutWarnings documentId="insaat-ruhsati-dilekcesi" layouts={layouts} excludedFields={["tarih", "adres", "tel"]} />

          <BelgeStudioSectionMasterControls sectionsApi={sectionsApi} />

          {/* 1. Tarih & İlgili İdare */}
          <BelgeStudioSection
            section={sectionsApi.sections[0]}
            isOpen={sectionsApi.isSectionOpen(sectionsApi.sections[0].id)}
            onToggle={() => sectionsApi.toggleSection(sectionsApi.sections[0].id)}
            filledCount={sectionsApi.getSectionFilledCount(sectionsApi.sections[0].id)}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                {renderFieldHeader("Dilekçe Tarihi", "tarih")}
                <input
                  type="text"
                  id={getFieldId("tarih")}
                  value={formData.tarih || ""}
                  onChange={(e) => handleFieldChange("tarih", e.target.value)}
                  onBlur={() => markFieldTouched("tarih")}
                  placeholder="08.12.2023"
                  aria-describedby="insaat-ruhsati-tarih-guidance"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                />
                <BelgeFieldGuidanceView
                  id="insaat-ruhsati-tarih-guidance"
                  guidance={evaluateFieldGuidance("insaat-ruhsati-dilekcesi", "tarih", formData.tarih, {
                    layout: layouts?.tarih,
                    isTouched: touchedFields.tarih,
                  })}
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
          </BelgeStudioSection>

          {/* 2. Talep ve Parsel Bilgileri Metni */}
          <BelgeStudioSection
            section={sectionsApi.sections[1]}
            isOpen={sectionsApi.isSectionOpen(sectionsApi.sections[1].id)}
            onToggle={() => sectionsApi.toggleSection(sectionsApi.sections[1].id)}
            filledCount={sectionsApi.getSectionFilledCount(sectionsApi.sections[1].id)}
          >
            {renderFieldHeader("Talep ve Parsel Bilgileri Metni", "ana_metin")}
            <textarea
              rows={3}
              id={getFieldId("ana_metin")}
              value={formData.ana_metin || ""}
              onChange={(e) => handleFieldChange("ana_metin", e.target.value)}
              placeholder="İlçenin Örnek Mahallesi 1234 ada, 56 numaralı parselime yeni inşaat yapmak istiyorum..."
              className="w-full rounded-md border border-border bg-background p-2 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 resize-none"
            />
          </BelgeStudioSection>

          {/* 3. Dilekçe Sahibi */}
          <BelgeStudioSection
            section={sectionsApi.sections[2]}
            isOpen={sectionsApi.isSectionOpen(sectionsApi.sections[2].id)}
            onToggle={() => sectionsApi.toggleSection(sectionsApi.sections[2].id)}
            filledCount={sectionsApi.getSectionFilledCount(sectionsApi.sections[2].id)}
          >
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
          </BelgeStudioSection>

          {/* 4. İletişim ve Adres */}
          <BelgeStudioSection
            section={sectionsApi.sections[3]}
            isOpen={sectionsApi.isSectionOpen(sectionsApi.sections[3].id)}
            onToggle={() => sectionsApi.toggleSection(sectionsApi.sections[3].id)}
            filledCount={sectionsApi.getSectionFilledCount(sectionsApi.sections[3].id)}
          >
            <div>
              {renderFieldHeader("Adres Bilgisi", "adres")}
              <textarea
                rows={2}
                id={getFieldId("adres")}
                autoComplete="street-address"
                value={formData.adres || ""}
                onChange={(e) => handleFieldChange("adres", e.target.value)}
                onBlur={() => markFieldTouched("adres")}
                placeholder="Adres: Örnek Mah. Mühendisler Cad. No:24/6 Çankaya / ANKARA"
                aria-describedby="insaat-ruhsati-adres-guidance"
                className="w-full rounded-md border border-border bg-background p-2 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20 resize-none"
              />
              <BelgeFieldGuidanceView
                id="insaat-ruhsati-adres-guidance"
                guidance={evaluateFieldGuidance("insaat-ruhsati-dilekcesi", "adres", formData.adres, {
                    layout: layouts?.adres,
                  isTouched: true,
                })}
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
                onBlur={() => markFieldTouched("tel")}
                placeholder="Tel: 0566 666 66 66"
                aria-describedby="insaat-ruhsati-tel-guidance"
                className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
              />
              <BelgeFieldGuidanceView
                id="insaat-ruhsati-tel-guidance"
                guidance={evaluateFieldGuidance("insaat-ruhsati-dilekcesi", "tel", formData.tel, {
                    layout: layouts?.tel,
                  isTouched: touchedFields.tel,
                })}
              />
            </div>
          </BelgeStudioSection>

          </div>
          </div>
        </div>

        <div
          id="insaat-ruhsati-mobile-panel-preview"
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
              documentId: "insaat-ruhsati-dilekcesi",
              values: formData as unknown as Record<string, string>,
              onCommit: (field, value) => handleFieldChange(field as keyof InsaatRuhsatiData, value),
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
        documentId="insaat-ruhsati-dilekcesi"
        templateFilename="INSAAT_RUHSATI_DILEKCESI_BOS.pdf"
        formView={formView}
        readability={readability}
      />
        <BelgeShareDialog share={shareApi} documentTitle="İnşaat Ruhsatı Dilekçesi" />
      </div>
    </BelgeStudioMobileProvider>
  );
}
