// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — KONFİGÜRASYON VE SABİTLER
// ============================================================================

export const DOKUMANTASYON_CONFIG = {
  // Session ayarları
  SESSION_COOKIE_NAME: "dokumantasyon_session",
  SESSION_MAX_AGE_SECONDS: 60 * 60 * 24 * 7, // 7 Gün
  SESSION_ALGORITHM: "HS256",

  // Share grant cookie (şifreli linkler için)
  SHARE_GRANT_COOKIE_PREFIX: "dok_share_grant_",
  SHARE_GRANT_MAX_AGE_SECONDS: 60 * 60 * 12, // 12 Saat

  // Dosya Boyutu Sınırları
  DEFAULT_MAX_FILE_SIZE_MB: 100,
  get MAX_FILE_SIZE_BYTES(): number {
    const envMb = Number(process.env.DOK_MAX_FILE_SIZE_MB);
    const mb = !isNaN(envMb) && envMb > 0 ? envMb : this.DEFAULT_MAX_FILE_SIZE_MB;
    return mb * 1024 * 1024;
  },

  // İzin Verilen Dosya Uzantıları ve MIME Türleri
  ALLOWED_EXTENSIONS: [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".zip",
    ".dwg",
    ".dxf",
  ] as const,

  // MIME type eşleştirmeleri
  MIME_TYPE_MAP: {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    zip: "application/zip",
    dwg: "application/acad",
    dxf: "application/dxf",
  } as Record<string, string>,

  // Rate Limiting Kuralları
  RATE_LIMIT: {
    LOGIN_WINDOW_SECONDS: 15 * 60, // 15 dakika
    LOGIN_MAX_FAILED_ATTEMPTS: 5,
    SHARE_UNLOCK_WINDOW_SECONDS: 15 * 60, // 15 dakika
    SHARE_UNLOCK_MAX_FAILED_ATTEMPTS: 8,
  },

  // Süre Seçenekleri (Saniye cinsinden)
  SHARE_DURATIONS: {
    "1_DAY": 24 * 60 * 60,
    "3_DAYS": 3 * 24 * 60 * 60,
    "1_WEEK": 7 * 24 * 60 * 60,
    "1_MONTH": 30 * 24 * 60 * 60,
  } as const,
} as const;
