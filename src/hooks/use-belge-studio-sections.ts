/**
 * Belge Stüdyosu — Akıllı Bölüm (Akordeon) Durum ve Tercih Kancası (ASAMA_05)
 *
 * Sorumluluklar:
 * 1. Bölümlerin açık/kapalı durumunu yönetir.
 * 2. Kullanıcı tercihlerini localStorage'a senkronize eder.
 * 3. revealField ile PDF alan odaklanmasında kapalı bölümü otomatik açar.
 * 4. Aktif input kapatılırsa odağı başlık butonuna taşıyarak klavye erişilebilirliğini korur.
 * 5. n/toplam dolu alan sayacını anlık hesaplar.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BelgeDocumentId } from "@/lib/belge-ux-config";
import { getSafeBrowserStorage, type StorageLike } from "@/lib/belge-draft-storage";
import {
  calculateSectionFilledCount,
  findSectionForField,
  getSectionsForDocument,
  type BelgeStudioSectionDefinition,
} from "@/lib/belge-studio-sections";
import {
  loadCollapsedSections,
  saveCollapsedSections,
} from "@/lib/belge-section-preferences";

export interface UseBelgeStudioSectionsOptions {
  documentId: BelgeDocumentId;
  formData: Record<string, unknown>;
  storageOverride?: StorageLike;
}

export interface UseBelgeStudioSectionsReturn {
  sections: readonly BelgeStudioSectionDefinition[];
  isSectionOpen: (sectionId: string) => boolean;
  toggleSection: (sectionId: string) => void;
  openAll: () => void;
  closeAll: () => void;
  closeOthers: (sectionId: string) => void;
  revealField: (fieldKey: string) => void;
  getSectionFilledCount: (sectionId: string) => { filled: number; total: number };
  allOpen: boolean;
}

export function useBelgeStudioSections({
  documentId,
  formData,
  storageOverride,
}: UseBelgeStudioSectionsOptions): UseBelgeStudioSectionsReturn {
  const sections = useMemo(() => getSectionsForDocument(documentId), [documentId]);

  const resolveStorage = useCallback((): StorageLike | null => {
    if (storageOverride) return storageOverride;
    return getSafeBrowserStorage("device");
  }, [storageOverride]);

  // SSR varsayılanı: tüm bölümler açık (boş küme)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => new Set());

  // SSR uyumluluğu: microtask içinde kayıtlı tercihleri yükle (hydration mismatch ve sync setState önlenir)
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const storage = resolveStorage();
      const stored = loadCollapsedSections(storage, documentId);
      if (stored.size > 0) {
        setCollapsedSections(stored);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [documentId, resolveStorage]);

  const isSectionOpen = useCallback(
    (sectionId: string): boolean => {
      return !collapsedSections.has(sectionId);
    },
    [collapsedSections]
  );

  const toggleSection = useCallback(
    (sectionId: string) => {
      setCollapsedSections((prev) => {
        const next = new Set(prev);
        const willClose = !next.has(sectionId);

        if (willClose) {
          // Eğer kapatılan bölüm içinde odaklanmış bir input varsa, odağı başlığa taşı
          if (typeof document !== "undefined") {
            const contentEl = document.getElementById(`section-content-${sectionId}`);
            if (contentEl && contentEl.contains(document.activeElement)) {
              const headerBtn = document.getElementById(`section-header-${sectionId}`);
              headerBtn?.focus();
            }
          }
          next.add(sectionId);
        } else {
          next.delete(sectionId);
        }

        const storage = resolveStorage();
        saveCollapsedSections(storage, documentId, next);
        return next;
      });
    },
    [documentId, resolveStorage]
  );

  const openAll = useCallback(() => {
    setCollapsedSections(() => {
      const next = new Set<string>();
      const storage = resolveStorage();
      saveCollapsedSections(storage, documentId, next);
      return next;
    });
  }, [documentId, resolveStorage]);

  const closeAll = useCallback(() => {
    setCollapsedSections(() => {
      const next = new Set<string>(sections.map((s) => s.id));
      const storage = resolveStorage();
      saveCollapsedSections(storage, documentId, next);
      return next;
    });
  }, [documentId, resolveStorage, sections]);

  const closeOthers = useCallback(
    (sectionId: string) => {
      setCollapsedSections(() => {
        const next = new Set<string>();
        for (const sec of sections) {
          if (sec.id !== sectionId) {
            next.add(sec.id);
          }
        }
        const storage = resolveStorage();
        saveCollapsedSections(storage, documentId, next);
        return next;
      });
    },
    [documentId, resolveStorage, sections]
  );

  const revealField = useCallback(
    (fieldKey: string) => {
      const targetSec = findSectionForField(documentId, fieldKey);
      if (!targetSec) return;

      setCollapsedSections((prev) => {
        if (!prev.has(targetSec.id)) return prev;
        const next = new Set(prev);
        next.delete(targetSec.id);
        const storage = resolveStorage();
        saveCollapsedSections(storage, documentId, next);
        return next;
      });
    },
    [documentId, resolveStorage]
  );

  const getSectionFilledCount = useCallback(
    (sectionId: string): { filled: number; total: number } => {
      const sec = sections.find((s) => s.id === sectionId);
      if (!sec) return { filled: 0, total: 0 };
      return calculateSectionFilledCount(sec, formData);
    },
    [formData, sections]
  );

  const allOpen = collapsedSections.size === 0;

  return {
    sections,
    isSectionOpen,
    toggleSection,
    openAll,
    closeAll,
    closeOthers,
    revealField,
    getSectionFilledCount,
    allOpen,
  };
}
