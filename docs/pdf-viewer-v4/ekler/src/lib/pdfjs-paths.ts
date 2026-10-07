// OTOMATİK ÜRETİLDİ: scripts/sync-pdfjs-vendor.mjs. Elle düzenleme; sürüm yükseltmek için script'i çalıştır.
// Tek doğruluk kaynağı: pdf.js dosyalarının URL'leri. Sürüm klasörde olduğu için "immutable" önbellek güvenlidir.
export const PDFJS_VERSION = "6.3.289";
export const PDFJS_BASE = `/vendor/pdfjs/v${PDFJS_VERSION}`;
export const PDFJS_MAIN = `${PDFJS_BASE}/pdf.min.mjs`;
export const PDFJS_POLYFILLS = `${PDFJS_BASE}/compat-polyfills.mjs`;
export const PDFJS_WORKER = `${PDFJS_BASE}/worker-entry.mjs`;
export const PDFJS_CMAPS = `${PDFJS_BASE}/cmaps/`;
export const PDFJS_FONTS = `${PDFJS_BASE}/standard_fonts/`;
export const PDFJS_WASM = `${PDFJS_BASE}/wasm/`;
export const PDFJS_ICCS = `${PDFJS_BASE}/iccs/`;
