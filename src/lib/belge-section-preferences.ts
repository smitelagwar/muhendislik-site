/**
 * Belge Stüdyosu — Akıllı Bölüm Tercihleri Depolama Motoru (ASAMA_05 & D04)
 *
 * Kurallar:
 * 1. Belge başına kapalı bölüm ID'leri (closed section IDs) bağımsız bir anahtarda tutulur.
 * 2. Şema: { version: 1, closedSectionIds: string[] } (F13 gereksinimi).
 * 3. Geriye dönük uyumluluk: Eski düz dizi formatı (legacy raw array) güvenle okunur ve migrate edilir.
 * 4. İzinli Bölüm Denetimi (Allowlist): Yalnızca ilgili belgeye ait geçerli bölüm ID'leri kabul edilir (S04 çözümü).
 * 5. İlk ziyarette tüm bölümler AÇIKTIR (closedSectionIds listesi boştur).
 * 6. Bozuk/geçersiz depolama verisinde sessizce tüm bölümler açık (all-open) fallback uygulanır.
 */

import { getSectionPreferencesKey, type BelgeDocumentId } from "./belge-ux-config";
import type { StorageLike } from "./belge-draft-storage";
import { BELGE_STUDIO_SECTIONS } from "./belge-studio-sections";

export interface BelgeSectionPreferencesEnvelope {
  version: 1;
  closedSectionIds: string[];
}

/**
 * Belge için kapalı bölüm ID'leri kümesini okur.
 */
export function loadCollapsedSections(
  storage: StorageLike | null | undefined,
  documentId: BelgeDocumentId
): Set<string> {
  if (!storage) return new Set();

  const key = getSectionPreferencesKey(documentId);
  try {
    const raw = storage.getItem(key);
    if (!raw || raw.trim().length === 0) {
      return new Set();
    }
    const parsed = JSON.parse(raw);
    const validSections = BELGE_STUDIO_SECTIONS[documentId];
    const validSectionIds = new Set(validSections ? validSections.map((s) => s.id) : []);

    let candidateIds: unknown[] = [];

    // Hem eski sürümsüz dizi formatını hem de version: 1 zarf formatını destekle
    if (Array.isArray(parsed)) {
      candidateIds = parsed;
    } else if (
      parsed &&
      typeof parsed === "object" &&
      parsed.version === 1 &&
      Array.isArray(parsed.closedSectionIds)
    ) {
      candidateIds = parsed.closedSectionIds;
    } else {
      return new Set();
    }

    const safeSet = new Set<string>();
    for (const item of candidateIds) {
      if (typeof item === "string" && item.trim().length > 0) {
        const trimmed = item.trim();
        if (validSectionIds.has(trimmed)) {
          safeSet.add(trimmed);
        }
      }
    }
    return safeSet;
  } catch {
    return new Set();
  }
}

/**
 * Belge için kapalı bölüm ID'leri kümesini { version: 1, closedSectionIds: [...] } olarak kaydeder.
 */
export function saveCollapsedSections(
  storage: StorageLike | null | undefined,
  documentId: BelgeDocumentId,
  collapsedIds: Set<string> | readonly string[]
): void {
  if (!storage) return;

  const key = getSectionPreferencesKey(documentId);
  try {
    const validSections = BELGE_STUDIO_SECTIONS[documentId];
    const validSectionIds = new Set(validSections ? validSections.map((s) => s.id) : []);

    const safeIds: string[] = [];
    for (const id of collapsedIds) {
      if (typeof id === "string") {
        const trimmed = id.trim();
        if (validSectionIds.has(trimmed) && !safeIds.includes(trimmed)) {
          safeIds.push(trimmed);
        }
      }
    }

    const envelope: BelgeSectionPreferencesEnvelope = {
      version: 1,
      closedSectionIds: safeIds,
    };
    storage.setItem(key, JSON.stringify(envelope));
  } catch {
    // Depolama hatası (kota/erişim) sessizce yutulur; UI işleyişi kesintiye uğramaz
  }
}
