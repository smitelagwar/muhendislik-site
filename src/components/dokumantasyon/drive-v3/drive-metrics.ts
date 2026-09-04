// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — GEOMETRY & METRICS SÖZLEŞMESİ
// ============================================================================

export const DRIVE_LIST_ROW_HEIGHT = 56;
export const DRIVE_LIST_ROW_GAP = 0;

export const DRIVE_GRID_GAP_X = 12;
export const DRIVE_GRID_GAP_Y = 12;
export const DRIVE_GRID_ROW_HEIGHT = 180;
export const DRIVE_GRID_MIN_CARD_WIDTH = 168;

export const DRIVE_MARQUEE_START_THRESHOLD = 6;
export const DRIVE_MARQUEE_EDGE_SCROLL_ZONE = 36;
export const DRIVE_MARQUEE_MAX_SCROLL_SPEED = 18;

export type GridMetrics = {
  width: number;
  columnCount: number;
  cellWidth: number;
  rowHeight: number;
  gapX: number;
  gapY: number;
};

export function calculateGridMetrics(
  containerWidth: number,
  minCardWidth = DRIVE_GRID_MIN_CARD_WIDTH,
  gapX = DRIVE_GRID_GAP_X,
  gapY = DRIVE_GRID_GAP_Y,
  rowHeight = DRIVE_GRID_ROW_HEIGHT
): GridMetrics {
  const safeWidth = Math.max(1, containerWidth);
  const columnCount = Math.max(
    1,
    Math.floor((safeWidth + gapX) / (minCardWidth + gapX))
  );
  const totalGaps = (columnCount - 1) * gapX;
  const cellWidth = Math.max(
    minCardWidth,
    (safeWidth - totalGaps) / columnCount
  );

  return {
    width: safeWidth,
    columnCount,
    cellWidth,
    rowHeight,
    gapX,
    gapY,
  };
}
