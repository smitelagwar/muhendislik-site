// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — VIRTUAL SCROLL & ANCHOR PRESERVATION ENGINE
// ============================================================================

import {
  DRIVE_LIST_ROW_HEIGHT,
  DRIVE_GRID_ROW_HEIGHT,
  GridMetrics,
} from "./drive-metrics";

export interface VirtualScrollState {
  scrollTop: number;
  containerHeight: number;
}

/**
 * Resize srasnda grnmn rastgele zplamasn nleyen
 * matematiksel Anchor-Preserving Scroll Top hesaplayc.
 */
export function calculateAnchorScrollTop({
  oldScrollTop,
  oldMetrics,
  newMetrics,
}: {
  oldScrollTop: number;
  oldMetrics: { columnCount: number; rowHeight: number };
  newMetrics: { columnCount: number; rowHeight: number };
}): number {
  if (oldMetrics.columnCount <= 0 || newMetrics.columnCount <= 0) return oldScrollTop;

  // Eski grnmde en stte grnen ilk enin global indeksi
  const oldTopRow = Math.floor(oldScrollTop / oldMetrics.rowHeight);
  const anchorItemIndex = oldTopRow * oldMetrics.columnCount;

  // Yeni kolon saysnda bu enin yer alaca yeni satr
  const newTopRow = Math.floor(anchorItemIndex / newMetrics.columnCount);

  // Kalan piksel pay (row ii kayma)
  const rowOffsetRatio = (oldScrollTop % oldMetrics.rowHeight) / oldMetrics.rowHeight;
  const newRowOffset = Math.round(rowOffsetRatio * newMetrics.rowHeight);

  return Math.max(0, newTopRow * newMetrics.rowHeight + newRowOffset);
}

/**
 * Scroll pozisyonunu saklama anahtar: folder + filter + view
 */
export function getScrollPersistenceKey(
  folderId: string | null | undefined,
  filter: string = "all",
  viewMode: string = "grid"
): string {
  const safeFolder = folderId || "root";
  const safeFilter = filter || "all";
  const safeView = viewMode || "grid";
  return `dok_scroll_${safeFolder}_${safeFilter}_${safeView}`;
}

const memoryScrollCache = new Map<string, number>();

export function saveScrollPosition(key: string, scrollTop: number): void {
  memoryScrollCache.set(key, scrollTop);
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem(key, String(scrollTop));
    }
  } catch {
    // sessionStorage eriim hatas durumunda sessiz kal (memory fallback alr)
  }
}

export function restoreScrollPosition(key: string): number {
  if (memoryScrollCache.has(key)) {
    return memoryScrollCache.get(key) || 0;
  }
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const val = window.sessionStorage.getItem(key);
      if (val !== null) {
        const num = parseFloat(val);
        if (!isNaN(num)) return num;
      }
    }
  } catch {
    // fallback
  }
  return 0;
}

/**
 * Sanallatrlm sanal pencere aral hesaplayc (DOM Budget iin: mounted nodes < 250)
 */
export function calculateVirtualWindow({
  itemCount,
  itemHeight,
  scrollTop,
  containerHeight,
  overscan = 5,
}: {
  itemCount: number;
  itemHeight: number;
  scrollTop: number;
  containerHeight: number;
  overscan?: number;
}): {
  startIndex: number;
  endIndex: number;
  virtualCount: number;
  totalHeight: number;
  offsetY: number;
} {
  const totalHeight = itemCount * itemHeight;
  if (itemCount === 0 || containerHeight <= 0) {
    return { startIndex: 0, endIndex: 0, virtualCount: 0, totalHeight: 0, offsetY: 0 };
  }

  const rawStart = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const rawEnd = rawStart + visibleCount;

  const startIndex = Math.max(0, rawStart - overscan);
  const endIndex = Math.min(itemCount - 1, rawEnd + overscan);
  const virtualCount = Math.max(0, endIndex - startIndex + 1);
  const offsetY = startIndex * itemHeight;

  return {
    startIndex,
    endIndex,
    virtualCount,
    totalHeight,
    offsetY,
  };
}
