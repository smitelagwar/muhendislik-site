// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — MOBİL UI YARDIMCI MODÜLLERİ
// ============================================================================
// A7: createLongPressController kaldırıldı. Mobil seçim artık açık Seç modu
// üzerinden yapılıyor (A3). Aşağıdaki yardımcılar test ve UI contract için korundu.

/**
 * Mobil Viewport Boyutları Sözleşmesi (Test Matrisi)
 */
export const MOBILE_VIEWPORT_PRESETS = [
  { name: "iPhone SE", width: 320, height: 568, orientation: "portrait" },
  { name: "iPhone SE (Landscape)", width: 568, height: 320, orientation: "landscape" },
  { name: "Galaxy S20", width: 360, height: 800, orientation: "portrait" },
  { name: "iPhone 13/14/15", width: 390, height: 844, orientation: "portrait" },
  { name: "Pixel 7", width: 412, height: 915, orientation: "portrait" },
  { name: "iPad Mini", width: 768, height: 1024, orientation: "portrait" },
  { name: "iPad Pro 10.5 (Landscape)", width: 1024, height: 768, orientation: "landscape" },
] as const;

/**
 * Dokunmatik Hedef Alanı Kontrolü (Proje standardı: 44x44 CSS px)
 */
export function isSufficientTouchTarget(widthPx: number, heightPx: number): boolean {
  return widthPx >= 44 && heightPx >= 44;
}
