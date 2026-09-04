// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — VIRTUAL MARQUEE GEOMETRY ENGINE
// ============================================================================

import {
  DRIVE_LIST_ROW_HEIGHT,
  DRIVE_LIST_ROW_GAP,
  DRIVE_MARQUEE_EDGE_SCROLL_ZONE,
  DRIVE_MARQUEE_MAX_SCROLL_SPEED,
  GridMetrics,
} from "./drive-metrics";

export type Rect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export function getBoundingBox(x1: number, y1: number, x2: number, y2: number): Rect {
  return {
    left: Math.min(x1, x2),
    right: Math.max(x1, x2),
    top: Math.min(y1, y2),
    bottom: Math.max(y1, y2),
  };
}

export function intersects(a: Rect, b: Rect): boolean {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

export function hitTestList(
  marquee: Rect,
  visibleOrderedIds: string[],
  rowHeight = DRIVE_LIST_ROW_HEIGHT,
  rowGap = DRIVE_LIST_ROW_GAP,
  paddingTop = 0,
  containerWidth = 10000
): string[] {
  if (visibleOrderedIds.length === 0) return [];
  const stride = rowHeight + rowGap;
  const firstRow = Math.max(0, Math.floor((marquee.top - paddingTop) / stride));
  const lastRow = Math.min(
    visibleOrderedIds.length - 1,
    Math.floor((marquee.bottom - paddingTop) / stride)
  );

  if (firstRow > lastRow || firstRow >= visibleOrderedIds.length) return [];

  const selectedIds: string[] = [];
  for (let r = firstRow; r <= lastRow; r++) {
    const rowTop = paddingTop + r * stride;
    const rowBottom = rowTop + rowHeight;
    const rowRect: Rect = {
      left: 0,
      right: containerWidth,
      top: rowTop,
      bottom: rowBottom,
    };
    if (intersects(marquee, rowRect)) {
      selectedIds.push(visibleOrderedIds[r]);
    }
  }
  return selectedIds;
}

export function hitTestGrid(
  marquee: Rect,
  visibleOrderedIds: string[],
  metrics: GridMetrics,
  paddingTop = 0,
  paddingLeft = 0
): string[] {
  if (visibleOrderedIds.length === 0 || metrics.columnCount <= 0) return [];
  const { columnCount, cellWidth, rowHeight, gapX, gapY } = metrics;
  const strideY = rowHeight + gapY;
  const strideX = cellWidth + gapX;

  const firstRow = Math.max(0, Math.floor((marquee.top - paddingTop) / strideY));
  const totalRows = Math.ceil(visibleOrderedIds.length / columnCount);
  const lastRow = Math.min(
    totalRows - 1,
    Math.floor((marquee.bottom - paddingTop) / strideY)
  );

  if (firstRow > lastRow || firstRow >= totalRows) return [];

  const firstCol = Math.max(0, Math.floor((marquee.left - paddingLeft) / strideX));
  const lastCol = Math.min(
    columnCount - 1,
    Math.floor((marquee.right - paddingLeft) / strideX)
  );

  if (firstCol > lastCol || firstCol >= columnCount) return [];

  const selectedIds: string[] = [];
  for (let r = firstRow; r <= lastRow; r++) {
    for (let c = firstCol; c <= lastCol; c++) {
      const idx = r * columnCount + c;
      if (idx >= visibleOrderedIds.length) break;

      const cellLeft = paddingLeft + c * strideX;
      const cellRight = cellLeft + cellWidth;
      const cellTop = paddingTop + r * strideY;
      const cellBottom = cellTop + rowHeight;

      const cellRect: Rect = {
        left: cellLeft,
        right: cellRight,
        top: cellTop,
        bottom: cellBottom,
      };

      if (intersects(marquee, cellRect)) {
        selectedIds.push(visibleOrderedIds[idx]);
      }
    }
  }
  return selectedIds;
}

export function calculateAutoScrollDelta(
  clientPointY: number,
  containerRectTop: number,
  containerRectBottom: number,
  zone = DRIVE_MARQUEE_EDGE_SCROLL_ZONE,
  maxSpeed = DRIVE_MARQUEE_MAX_SCROLL_SPEED
): number {
  const distFromTop = clientPointY - containerRectTop;
  if (distFromTop < zone) {
    const factor = Math.min(1, Math.max(0, (zone - distFromTop) / zone));
    return -Math.round(factor * maxSpeed);
  }

  const distFromBottom = containerRectBottom - clientPointY;
  if (distFromBottom < zone) {
    const factor = Math.min(1, Math.max(0, (zone - distFromBottom) / zone));
    return Math.round(factor * maxSpeed);
  }

  return 0;
}
