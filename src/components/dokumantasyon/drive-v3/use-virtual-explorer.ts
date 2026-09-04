// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — TANSTACK VIRTUAL EXPLORER HOOK
// ============================================================================

"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  DRIVE_LIST_ROW_HEIGHT,
  DRIVE_GRID_ROW_HEIGHT,
  calculateGridMetrics,
  GridMetrics,
} from "./drive-metrics";
import {
  calculateAnchorScrollTop,
  getScrollPersistenceKey,
  saveScrollPosition,
  restoreScrollPosition,
} from "./virtual-scroll";

export interface UseVirtualExplorerProps<T> {
  items: T[];
  viewMode: "list" | "grid";
  folderId?: string | null;
  filter?: string;
  overscan?: number;
}

export function useVirtualExplorer<T>({
  items,
  viewMode,
  folderId,
  filter,
  overscan = 5,
}: UseVirtualExplorerProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1200);

  // Grid Metrics (JS columnCount == CSS columnCount)
  const gridMetrics = useMemo<GridMetrics>(() => {
    return calculateGridMetrics(containerWidth, 220, 16, 16, DRIVE_GRID_ROW_HEIGHT);
  }, [containerWidth]);

  const previousMetricsRef = useRef<GridMetrics>(gridMetrics);

  // ResizeObserver for Container Width & Anchor Preservation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = Math.round(entry.contentRect.width);
        if (newWidth > 0 && Math.abs(newWidth - containerWidth) >= 4) {
          const newMetrics = calculateGridMetrics(newWidth, 220, 16, 16, DRIVE_GRID_ROW_HEIGHT);
          const oldMetrics = previousMetricsRef.current;

          if (viewMode === "grid" && oldMetrics.columnCount !== newMetrics.columnCount) {
            const currentScrollTop = container.scrollTop;
            const newScrollTop = calculateAnchorScrollTop({
              oldScrollTop: currentScrollTop,
              oldMetrics: { columnCount: oldMetrics.columnCount, rowHeight: DRIVE_GRID_ROW_HEIGHT },
              newMetrics: { columnCount: newMetrics.columnCount, rowHeight: DRIVE_GRID_ROW_HEIGHT },
            });
            container.scrollTop = newScrollTop;
          }

          previousMetricsRef.current = newMetrics;
          setContainerWidth(newWidth);
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [containerWidth, viewMode]);

  // Scroll Restoration Key
  const persistenceKey = useMemo(() => {
    return getScrollPersistenceKey(folderId, filter, viewMode);
  }, [folderId, filter, viewMode]);

  // Restore Scroll on Mount or Folder/View Change
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const savedOffset = restoreScrollPosition(persistenceKey);
    if (savedOffset > 0) {
      container.scrollTop = savedOffset;
    }
  }, [persistenceKey]);

  // Save Scroll Position on Scroll
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    saveScrollPosition(persistenceKey, container.scrollTop);
  }, [persistenceKey]);

  // List Virtualizer (1 row = 1 item)
  const listVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => DRIVE_LIST_ROW_HEIGHT,
    overscan: overscan * 2,
    getItemKey: (index) => {
      const item = items[index] as { id?: string } | undefined;
      return item?.id ?? index;
    },
  });

  // Grid Virtualizer (1 row = columnCount items)
  const gridRowCount = useMemo(() => {
    return Math.ceil(items.length / Math.max(1, gridMetrics.columnCount));
  }, [items.length, gridMetrics.columnCount]);

  const gridVirtualizer = useVirtualizer({
    count: gridRowCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => DRIVE_GRID_ROW_HEIGHT,
    overscan,
    getItemKey: (rowIndex) => `grid-row-${rowIndex}`,
  });

  return {
    containerRef,
    containerWidth,
    gridMetrics,
    handleScroll,
    listVirtualizer,
    gridVirtualizer,
    gridRowCount,
  };
}
