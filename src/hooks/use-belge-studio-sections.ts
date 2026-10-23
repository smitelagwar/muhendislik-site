/**
 * Belge Stüdyosu — Akıllı Bölüm (Akordeon) Durum ve Tercih Kancası (ASAMA_05 & D04)
 *
 * Sorumluluklar:
 * 1. Bölümlerin açık/kapalı durumunu yönetir.
 * 2. Aktif/son dokunulan bölümü izler; ana kapatma eyleminde aktif bölüm açık kalır (F12).
 * 3. Kapanacak bölüm içindeki odağı DOM unmount/hide öncesinde güvenle başlığa taşır (F12 pre-hide focus).
 * 4. State updater'ları saf (pure) tutar; depolama ve odak yan etkileri updater dışındadır.
 * 5. revealField geçici görünürlük sağlar; kullanıcının kalıcı tercihlerini ezmez (F13).
 * 6. n/toplam dolu alan sayacını anlık hesaplar.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BELGE_UX_FLAGS, type BelgeDocumentId } from "@/lib/belge-ux-config";
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
  studioRootRef?: React.RefObject<HTMLDivElement | null>;
  formData: Record<string, unknown>;
  storageOverride?: StorageLike;
  enabled?: boolean;
}

export interface UseBelgeStudioSectionsReturn {
  sections: readonly BelgeStudioSectionDefinition[];
  isSectionOpen: (sectionId: string) => boolean;
  toggleSection: (sectionId: string) => void;
  openAll: () => void;
  closeAll: () => void;
  closeOthers: (sectionId?: string) => void;
  revealField: (fieldKey: string) => void;
  setActiveSection: (sectionId: string) => void;
  activeSectionId: string | null;
  getSectionFilledCount: (sectionId: string) => { filled: number; total: number };
  allOpen: boolean;
}

export function useBelgeStudioSections({
  documentId,
  studioRootRef,
  formData,
  storageOverride,
  enabled = BELGE_UX_FLAGS.ACCORDION,
}: UseBelgeStudioSectionsOptions): UseBelgeStudioSectionsReturn {
  const sections = useMemo(() => getSectionsForDocument(documentId), [documentId]);

  const resolveStorage = useCallback((): StorageLike | null => {
    if (storageOverride) return storageOverride;
    return getSafeBrowserStorage("device");
  }, [storageOverride]);

  // SSR varsayılanı: tüm bölümler açık (boş küme)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => new Set());
  // F13: Geçici reveal ile açılan bölümler (manuel depolama tercihini ezmez)
  const [temporarilyRevealedSections, setTemporarilyRevealedSections] = useState<Set<string>>(() => new Set());

  // F12: Aktif / son dokunulan bölümü izle
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const isLoadedRef = useRef(false);

  // Kayıtlı tercihleri microtask içinde yükle (hydration mismatch ve sync setState önlenir)
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const storage = resolveStorage();
      const stored = loadCollapsedSections(storage, documentId);
      if (stored.size > 0) {
        setCollapsedSections(stored);
      }
      isLoadedRef.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, [documentId, resolveStorage]);

  // Tercih değişikliklerini depoya kaydet (State updater dışı güvenli yan etki)
  useEffect(() => {
    if (!isLoadedRef.current) return;
    const storage = resolveStorage();
    saveCollapsedSections(storage, documentId, collapsedSections);
  }, [collapsedSections, documentId, resolveStorage]);

  const isSectionOpen = useCallback(
    (sectionId: string): boolean => {
      if (!enabled) return true;
      if (temporarilyRevealedSections.has(sectionId)) return true;
      return !collapsedSections.has(sectionId);
    },
    [collapsedSections, enabled, temporarilyRevealedSections]
  );

  const toggleSection = useCallback(
    (sectionId: string) => {
      if (!enabled) return;
      setActiveSectionId(sectionId);

      const isCurrentlyOpen =
        temporarilyRevealedSections.has(sectionId) || !collapsedSections.has(sectionId);

      // F12 Pre-hide focus: Eğer kapatılan bölüm içinde odaklanmış bir input varsa, odağı önce başlığa taşı
      if (isCurrentlyOpen && typeof document !== "undefined" && document.activeElement) {
        const contentEl = (studioRootRef?.current ?? document).querySelector(`[data-testid="belge-section-content-${sectionId}"]`);
        if (contentEl && contentEl.contains(document.activeElement)) {
          const headerBtn = (studioRootRef?.current ?? document).querySelector<HTMLElement>(`[data-testid="belge-section-toggle-${sectionId}"]`);
          headerBtn?.focus();
        }
      }

      if (temporarilyRevealedSections.has(sectionId)) {
        setTemporarilyRevealedSections((prev) => {
          const next = new Set(prev);
          next.delete(sectionId);
          return next;
        });
      }

      setCollapsedSections((prev) => {
        const next = new Set(prev);
        if (isCurrentlyOpen) {
          next.add(sectionId);
        } else {
          next.delete(sectionId);
        }
        return next;
      });
    },
    [collapsedSections, enabled, studioRootRef, temporarilyRevealedSections]
  );

  const openAll = useCallback(() => {
    setTemporarilyRevealedSections(new Set());
    setCollapsedSections(new Set());
  }, []);

  const closeAll = useCallback(() => {
    setTemporarilyRevealedSections(new Set());
    setCollapsedSections(new Set(sections.map((s) => s.id)));
  }, [sections]);

  // F12: Aktif / son dokunulan bölümü açık tut, diğerlerini kapat (0 açık bölüm engellenir)
  const closeOthers = useCallback(
    (targetSectionId?: string) => {
      if (!enabled) return;
      const keepOpenId = targetSectionId ?? activeSectionId ?? sections[0]?.id;
      if (!keepOpenId) return;

      // Pre-hide focus: Kapatılacak herhangi bir bölüm içinde odak varsa başlığa taşı
      if (typeof document !== "undefined" && document.activeElement) {
        for (const sec of sections) {
          if (sec.id !== keepOpenId) {
            const contentEl = (studioRootRef?.current ?? document).querySelector(`[data-testid="belge-section-content-${sec.id}"]`);
            if (contentEl && contentEl.contains(document.activeElement)) {
              const headerBtn = (studioRootRef?.current ?? document).querySelector<HTMLElement>(`[data-testid="belge-section-toggle-${sec.id}"]`);
              headerBtn?.focus();
              break;
            }
          }
        }
      }

      setTemporarilyRevealedSections(new Set());
      setCollapsedSections(() => {
        const next = new Set<string>();
        for (const sec of sections) {
          if (sec.id !== keepOpenId) {
            next.add(sec.id);
          }
        }
        return next;
      });
    },
    [activeSectionId, enabled, sections, studioRootRef]
  );

  // F13: revealField geçici açar; kalıcı localStorage tercihlerini ezmez
  const revealField = useCallback(
    (fieldKey: string) => {
      const targetSec = findSectionForField(documentId, fieldKey);
      if (!targetSec) return;

      setActiveSectionId(targetSec.id);

      if (!collapsedSections.has(targetSec.id)) return;

      setTemporarilyRevealedSections((prev) => {
        if (prev.has(targetSec.id)) return prev;
        const next = new Set(prev);
        next.add(targetSec.id);
        return next;
      });
    },
    [collapsedSections, documentId]
  );

  const getSectionFilledCount = useCallback(
    (sectionId: string): { filled: number; total: number } => {
      const sec = sections.find((s) => s.id === sectionId);
      if (!sec) return { filled: 0, total: 0 };
      return calculateSectionFilledCount(sec, formData);
    },
    [formData, sections]
  );

  const allOpen = useMemo(() => {
    if (!enabled) return true;
    return sections.every((sec) => isSectionOpen(sec.id));
  }, [enabled, isSectionOpen, sections]);

  return {
    sections,
    isSectionOpen,
    toggleSection,
    openAll,
    closeAll,
    closeOthers,
    revealField,
    setActiveSection: setActiveSectionId,
    activeSectionId,
    getSectionFilledCount,
    allOpen,
  };
}
