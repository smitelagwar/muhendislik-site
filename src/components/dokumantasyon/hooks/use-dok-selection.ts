// ============================================================================
// DOKÜMANTASYON — EXPLORER SEÇİM STATE'İ
// ============================================================================

"use client";

import { useCallback, useState } from "react";

/**
 * File Manager'daki seçim state'ini tek sahipte tutar. Ağ mutation'ları
 * bileşende kalır; hook yalnız immutable seçim geçişleri üretir.
 */
export function useDokSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectedId = useCallback((id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const replaceSelection = useCallback((ids: Iterable<string>) => {
    setSelectedIds(new Set(ids));
  }, []);

  return { selectedIds, setSelectedIds, toggleSelectedId, replaceSelection };
}
