/**
 * AutoCAD Font Parite Feature Flag Konfigürasyonu (Aşama 2)
 *
 * Varsayılan: OFF (NEXT_PUBLIC_CAD_AUTOCAD_FONT_PARITY_V1 !== "1")
 * - Flag OFF iken mevcut üretim mapping yolu (tüm CAD fontlarının Arial'a zorlanması) korunur.
 * - Flag ON iken gerçek CAD font registry yolu, deterministik awaited preload ve exact diagnostics çalışır.
 */

export const CAD_AUTOCAD_FONT_PARITY_V1 =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_CAD_AUTOCAD_FONT_PARITY_V1 === "1";
