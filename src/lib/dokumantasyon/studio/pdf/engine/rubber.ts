// ============================================================================
// PDF v4 MOTOR — LASTİK PAYI DİRENCİ (Plan 04 B5)
// ----------------------------------------------------------------------------
// Sınır dışında direnç: aşım log uzayında sönümlenir, en çok %20 (maxOver) aşar.
// ============================================================================

/**
 * Ölçek min..max sınırlarını aştığında yumuşak direnç (rubber-banding) uygular.
 * [min, max] aralığında girdi aynen döner.
 * Dışarıda logaritmik sönümleme ile en fazla max * exp(maxOver) veya min * exp(-maxOver) olur.
 */
export function rubber(s: number, min: number, max: number, maxOver = 0.2): number {
  if (min > max) {
    const tmp = min;
    min = max;
    max = tmp;
  }
  if (s >= min && s <= max) return s;
  const edge = s < min ? min : max;
  if (edge <= 0 || s <= 0) return Math.max(0.01, s);

  const over = Math.log(s / edge); // <0 altında, >0 üstte
  const damped = Math.sign(over) * maxOver * (1 - Math.exp(-Math.abs(over) / maxOver));
  return edge * Math.exp(damped);
}
