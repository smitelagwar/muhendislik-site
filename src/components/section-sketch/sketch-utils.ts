// Enkesit krokie koordinat ve ölçek hesaplama yardımcıları

import type { SvgPoint } from "./sketch-types";

/**
 * Gerçek dünya değerini (herhangi birim) SVG piksel koordinatına dönüştürür.
 * @param value     Gerçek ölçü
 * @param worldSize Gerçek toplam boyut (aynı birimde)
 * @param svgSize   SVG piksel boyutu
 */
export function worldToSvg(value: number, worldSize: number, svgSize: number): number {
  return (value / worldSize) * svgSize;
}

/**
 * Verilen donatı alanı (mm²) için önerilen çubuk sayısını hesaplar.
 * Hesapta 14 mm çap (As_bar ≈ 153.9 mm²) baz alınır.
 */
export function suggestBarCount(asMm2: number): number {
  const baseDiameterMm = 14;
  const barArea = (Math.PI * baseDiameterMm * baseDiameterMm) / 4;
  return Math.max(2, Math.ceil(asMm2 / barArea));
}

/**
 * Tek sıra çubuk için x koordinatlarını hesaplar.
 * Çubuklar, kullanılabilir genişliğe eşit aralıklı yerleştirilir.
 */
export function singleRowBarPositions(
  count: number,
  startX: number,
  availableWidth: number,
): number[] {
  if (count <= 0) return [];
  if (count === 1) return [startX + availableWidth / 2];

  const positions: number[] = [];
  const step = availableWidth / (count - 1);
  for (let i = 0; i < count; i++) {
    positions.push(startX + i * step);
  }
  return positions;
}

/**
 * Kolon boyuna donatı adedini enkesit alanından tahmin eder.
 * TS 500 min %1 oranı baz alınarak yaklaşık değer üretilir.
 * Sonuç 4 ile 12 arasına sınırlandırılır ve çift sayıya yuvarlanır.
 */
export function estimateColumnBarCount(shortEdgeCm: number, longEdgeCm: number): number {
  const areaCm2 = shortEdgeCm * longEdgeCm;
  // Yaklaşık: her 50 cm² için 1 donatı
  const raw = Math.round(areaCm2 / 50);
  const clamped = Math.max(4, Math.min(12, raw));
  // Çift sayıya yuvarla (simetrik yerleşim için)
  return clamped % 2 === 0 ? clamped : clamped + 1;
}

/**
 * Mimari ölçü kesmesi (Architectural Tick) noktalarını döndürür.
 * Statik projelerde ok yerine 45 derecelik kısa çizgiler kullanılır.
 */
export function archTick(tip: SvgPoint, direction: "horizontal" | "vertical", size = 6): string {
  const d = size / 2;
  // 45 derecelik slash
  return `M ${tip.x - d} ${tip.y + d} L ${tip.x + d} ${tip.y - d}`;
}

/**
 * TBDY 2018 standartlarında 135 derecelik etriye kancası çizer.
 * x,y: etriyenin sol üst köşesi
 * size: kanca uzunluğu
 */
export function stirrupHook135(x: number, y: number, size = 12): string {
  // İki kısa çizgiyi 135 derece içeri bükük şekilde çizeriz
  return `M ${x + size} ${y} L ${x} ${y} L ${x} ${y + size} M ${x} ${y} L ${x + size*0.8} ${y + size*0.8}`;
}

/**
 * Çubuk düzeninin kaç sıra olacağını belirler.
 * 7'den fazla çubuk varsa çift sıra önerilir.
 */
export function getRowLayout(count: number): { rowCount: number; firstRow: number; secondRow: number } {
  if (count <= 7) {
    return { rowCount: 1, firstRow: count, secondRow: 0 };
  }
  const secondRow = Math.floor(count / 2);
  const firstRow = count - secondRow;
  return { rowCount: 2, firstRow, secondRow };
}
