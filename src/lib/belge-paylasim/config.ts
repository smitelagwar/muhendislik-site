// ============================================================================
// BELGE PAYLAŞIM — SİSTEM VE GÜVENLİK YAPILANDIRMASI
// ============================================================================

export const BELGE_SHARE_CONFIG = {
  /** Süre: Tam 90 gün (90 x 24 saat) */
  EXPIRATION_DAYS: 90,
  EXPIRATION_MS: 90 * 24 * 60 * 60 * 1000,

  /** İstek gövdesi sınırları */
  MAX_JSON_BODY_BYTES: 64 * 1024, // 64 KiB
  MAX_PDF_SIZE_BYTES: 3 * 1024 * 1024, // 3 MiB

  /** IP bazlı kota sınırları */
  IP_RATE_LIMIT_15MIN: 3, // 15 dakikada en çok 3 bağlantı
  IP_RATE_LIMIT_24H: 10,  // 24 saatte en çok 10 bağlantı
  IP_MAX_ACTIVE_LINKS: 20, // Bir IP'nin aynı anda en çok 20 aktif bağlantısı olabilir

  /** Küresel bütçe sınırları */
  GLOBAL_DAILY_LIMIT: 200, // Günde tüm sitede en çok 200 bağlantı
  GLOBAL_MAX_ACTIVE_BLOB_BYTES: 1024 * 1024 * 1024, // 1 GiB toplam aktif depolama bütçesi

  /** Blob depolama yolu öneki (izole prefix) */
  BLOB_PATH_PREFIX: "belge_paylasim/",

  /** Cron temizlik lease süresi (ms) */
  CRON_LEASE_DURATION_MS: 5 * 60 * 1000, // 5 dakika

  /** İzin verilen belge kimlikleri */
  SUPPORTED_DOCUMENTS: [
    "beton-dokum-tutanagi",
    "santiye-sefi-taahhutnamesi",
    "santiye-sefi-istifa-dilekcesi",
    "insaat-ruhsati-dilekcesi",
    "santiye-sefi-sozlesmesi",
  ] as const,
} as const;

/**
 * Sunucu tarafında deterministik HMAC token üretimi için gizli anahtarı döner.
 * Production'da BELGE_SHARE_SECRET tanımlı değilse fail-closed davranır.
 */
export function getBelgeShareSecret(): string {
  const envSecret = process.env.BELGE_SHARE_SECRET;
  if (envSecret && envSecret.trim().length >= 32) {
    return envSecret.trim();
  }

  const isProduction =
    process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

  if (isProduction) {
    throw new Error(
      "GÜVENLİK HATASI: Production ortamında en az 32 karakterlik BELGE_SHARE_SECRET ortam değişkeni tanımlı olmalıdır."
    );
  }

  // Yerel geliştirme ve izole birim testleri için sabit test anahtarı
  return "dev-local-belge-share-secret-key-32-bytes-minimum-length!";
}
