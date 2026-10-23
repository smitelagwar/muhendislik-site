/**
 * Belge Stüdyosu — Akıllı Bölüm Tercihleri Depolama Motoru (ASAMA_05)
 *
 * Kurallar:
 * 1. Belge başına kapalı bölüm ID'leri (collapsed section IDs) bağımsız bir anahtarda tutulur.
 * 2. İlk ziyarette tüm bölümler AÇIKTIR (collapsed listesi boştur).
 * 3. Tercih kaydı taslak verisini tetiklemez (taslakla tamamen bağımsızdır).
 * 4. Bozuk/geçersiz depolama verisinde sessizce tüm bölümler açık (all-open) fallback uygulanır.
 */

import { getSectionPreferencesKey, type BelgeDocumentId } from "./belge-ux-config";
import type { StorageLike } from "./belge-draft-storage";

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
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    const safeSet = new Set<string>();
    for (const item of parsed) {
      if (typeof item === "string" && item.trim().length > 0) {
        safeSet.add(item.trim());
      }
    }
    return safeSet;
  } catch {
    return new Set();
  }
}

/**
 * Belge için kapalı bölüm ID'leri kümesini kaydeder.
 */
export function saveCollapsedSections(
  storage: StorageLike | null | undefined,
  documentId: BelgeDocumentId,
  collapsedIds: Set<string> | readonly string[]
): void {
  if (!storage) return;

  const key = getSectionPreferencesKey(documentId);
  try {
    const array = Array.from(collapsedIds);
    storage.setItem(key, JSON.stringify(array));
  } catch {
    // Depolama hatası (kota/erişim) sessizce yutulur; UI işleyişi kesintiye uğramaz
  }
}
