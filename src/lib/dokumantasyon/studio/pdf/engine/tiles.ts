// ============================================================================
// PDF v4 MOTOR — SAF PARÇA (TILE) PLANLAYICI (Plan 03 P3.1.2)
// ----------------------------------------------------------------------------
// Sayfa boyutundan bağımsız sabit çizim bütçesi.
// Çözünürlükten asla taviz verilmez; bütçe aşılırsa sayfa parçalara bölünür.
// ============================================================================

export const OUT_CAP = 3; // piksel/css-px üst sınırı
export const TILE_PX = { mobile: 512, desktop: 768 }; // bitmap piksel boyutu
export const GUTTER = 2; // kenar dikiş farkını önleyen taşma payı
export const WHOLE_MAX_PX = { mobile: 4_000_000, desktop: 12_000_000 }; // tek canvas piksel sınırı

export type Mode = "whole" | "tiles";

export function outputScaleFor(dpr: number): number {
  return Math.min(Math.max(dpr || 1, 1), OUT_CAP);
}

export function chooseMode(cssW: number, cssH: number, o: number, wholeMax: number): Mode {
  return cssW * o * cssH * o <= wholeMax ? "whole" : "tiles";
}

export interface TileRect {
  col: number;
  row: number;
  x: number; // bitmap px (sayfa bitmap uzayı)
  y: number;
  w: number;
  h: number;
  cssX: number; // render ölçeğinde css px
  cssY: number;
  cssW: number;
  cssH: number;
  key: string; // `${col}:${row}`
}

export function gridSize(
  cssW: number,
  cssH: number,
  o: number,
  tile: number
): { cols: number; rows: number } {
  const bw = Math.ceil(cssW * o);
  const bh = Math.ceil(cssH * o);
  return {
    cols: Math.max(1, Math.ceil(bw / tile)),
    rows: Math.max(1, Math.ceil(bh / tile)),
  };
}

export function tileRect(
  col: number,
  row: number,
  cssW: number,
  cssH: number,
  o: number,
  tile: number
): TileRect {
  const bw = Math.ceil(cssW * o);
  const bh = Math.ceil(cssH * o);
  const x = col * tile;
  const y = row * tile;
  const w = Math.min(tile, Math.max(0, bw - x));
  const h = Math.min(tile, Math.max(0, bh - y));
  return {
    col,
    row,
    x,
    y,
    w,
    h,
    cssX: x / o,
    cssY: y / o,
    cssW: w / o,
    cssH: h / o,
    key: `${col}:${row}`,
  };
}

const dist = (t: TileRect, cx: number, cy: number) =>
  Math.hypot(t.cssX + t.cssW / 2 - cx, t.cssY + t.cssH / 2 - cy);

/**
 * Sayfa-yerel css dikdörtgenini (render ölçeğinde) kesen parçalar; margin: css px.
 * Merkeze yakın parçalar öncelikli olarak sıralanır.
 */
export function tilesForRect(
  cssW: number,
  cssH: number,
  o: number,
  tile: number,
  rect: { x: number; y: number; w: number; h: number },
  margin: number
): TileRect[] {
  const { cols, rows } = gridSize(cssW, cssH, o, tile);
  const t = tile / o;
  const c0 = Math.max(0, Math.floor((rect.x - margin) / t));
  const c1 = Math.min(cols - 1, Math.floor((rect.x + rect.w + margin) / t));
  const r0 = Math.max(0, Math.floor((rect.y - margin) / t));
  const r1 = Math.min(rows - 1, Math.floor((rect.y + rect.h + margin) / t));

  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const out: TileRect[] = [];

  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      out.push(tileRect(c, r, cssW, cssH, o, tile));
    }
  }

  return out.sort((a, b) => dist(a, cx, cy) - dist(b, cx, cy));
}
