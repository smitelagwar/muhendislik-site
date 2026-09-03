/**
 * AutoCAD Font Parite Feature Flag Konfigürasyonu
 *
 * Varsayılan: ON (aktif)
 * - NEXT_PUBLIC_CAD_AUTOCAD_FONT_PARITY_V1 !== "0" iken tüm ortamlarda (Vercel ve yerel)
 *   gerçek CAD font registry yolu, deterministik awaited preload ve exact diagnostics çalışır.
 * - Acil durumda veya test amacıyla NEXT_PUBLIC_CAD_AUTOCAD_FONT_PARITY_V1="0" verilerek
 *   anında eski fallback yoluna dönülebilir (kill switch).
 */

export const CAD_AUTOCAD_FONT_PARITY_V1 =
  typeof process === "undefined" ||
  process.env.NEXT_PUBLIC_CAD_AUTOCAD_FONT_PARITY_V1 !== "0";
