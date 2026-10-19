"use client";

import { useEffect, useRef, useState } from "react";
import type { BelgeDocumentId, InlineFieldDescriptor } from "@/lib/belge-studio-inline-field-map";
import type { PdfFieldLayout } from "@/lib/belgeler-pdf-layout";
import { evaluateFieldGuidance } from "@/components/belge-field-guidance";

export const BELGE_INLINE_CONFLICT_MESSAGE =
  "Sol formda bu alan güncellendi; yeni değerin üzerine yazılmadı. Taslağınızı kopyalayabilir, güncel değeri yükleyebilir veya vazgeçebilirsiniz.";

type UseBelgeInlineDraftParams = {
  documentId?: BelgeDocumentId;
  field: InlineFieldDescriptor;
  currentValue: string;
  layout?: PdfFieldLayout;
  onCommit: (value: string) => void;
  onCancel: () => void;
};

export function useBelgeInlineDraft({ documentId, field, currentValue, layout, onCommit, onCancel }: UseBelgeInlineDraftParams) {
  // Açılış değeri bir kez dondurulur; yalnız "Güncel Değeri Yükle" ile yenilenir.
  const [openingValue, setOpeningValue] = useState(currentValue);
  const [draft, setDraft] = useState(currentValue);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const isCommittingRef = useRef(false);
  const copiedTimerRef = useRef<number | null>(null);
  const [draftLayout, setDraftLayout] = useState<{ draft: string; layout: PdfFieldLayout } | null>(null);
  const measuredLayout = draft === currentValue ? layout : draftLayout?.draft === draft ? draftLayout.layout : undefined;

  // Taslak kendi başına ölçülür; ana form, önizleme ve geri alma kaydı değişmez.
  useEffect(() => {
    if (!documentId || (draft === currentValue && layout)) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void import("@/lib/pdf-engine")
        .then(({ measureBelgeDraft }) => measureBelgeDraft(documentId, field.fieldKey, draft))
        .then((result) => { if (!cancelled) setDraftLayout({ draft, layout: result }); })
        .catch(() => { /* Ölçüm yokken eski veya tahmini bir punto gösterilmez. */ });
    }, 200);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [documentId, field.fieldKey, draft, currentValue, layout]);

  useEffect(() => () => {
    if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current);
  }, []);

  const guidance = documentId
    ? evaluateFieldGuidance(documentId, field.fieldKey, draft, { isBlurOrSubmitted: true, layout: measuredLayout })
    : null;
  const guidanceId = `inline-guidance-${field.fieldKey}`;
  const isDirty = draft !== openingValue;

  /** Çakışma/salt-okunur denetiminden geçerse tek sefer commit eder ve true döner. */
  const tryCommit = (): boolean => {
    if (isCommittingRef.current) return false;
    if (currentValue !== openingValue) {
      setConflictError(BELGE_INLINE_CONFLICT_MESSAGE);
      return false;
    }
    if (field.readOnly) {
      onCancel();
      return false;
    }
    isCommittingRef.current = true;
    onCommit(draft);
    return true;
  };

  const handleLoadCurrentValue = () => {
    setOpeningValue(currentValue);
    setDraft(currentValue);
    setConflictError(null);
  };

  const handleCopyDraft = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(draft);
        setCopiedNotification(true);
        if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current);
        copiedTimerRef.current = window.setTimeout(() => setCopiedNotification(false), 2000);
      }
    } catch {
      // Pano erişimi yoksa sessizce geçilir.
    }
  };

  return {
    draft,
    setDraft,
    openingValue,
    isDirty,
    conflictError,
    copiedNotification,
    guidance,
    guidanceId,
    tryCommit,
    handleLoadCurrentValue,
    handleCopyDraft,
  };
}
