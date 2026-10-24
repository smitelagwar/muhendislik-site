// ============================================================================
// BELGE PAYLAŞIM — SİSTEM VE GÜVENLİK YAPILANDIRMASI
// ============================================================================

export const BELGE_SHARE_CONFIG = {
  /** Süre: Tam 90 gün (90 x 24 saat) */
  EXPIRATION_DAYS: 90,
  EXPIRATION_MS: 90 * 24 * 60 * 60 * 1000,
  /** Create attempt fencing lease; render/upload never hold a SQL lock. */
  ATTEMPT_LEASE_DURATION_MS: 2 * 60 * 1000,

  /** İstek gövdesi sınırları */
  MAX_JSON_BODY_BYTES: 64 * 1024, // 64 KiB
  MAX_PDF_SIZE_BYTES: 3 * 1024 * 1024, // 3 MiB

  /** Tarayıcı başına günlük başarılı yeni link hakkı */
  DAILY_BROWSER_LINK_LIMIT: 50,

  /**
   * Yerel varsayımlar; üretim bu iki kapasiteyi açıkça yapılandırmalıdır.
   * 200/gün ve 1 GiB eski değerleri körlemesine üretim kapasitesi sayılmaz.
   */
  LOCAL_GLOBAL_DAILY_LIMIT: 200,
  LOCAL_GLOBAL_MAX_STORAGE_BYTES: 1024 * 1024 * 1024,

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

export type BelgeShareRuntimeErrorCode =
  | "DATABASE_NOT_CONFIGURED"
  | "DATABASE_UNAVAILABLE"
  | "BLOB_NOT_CONFIGURED"
  | "SCHEMA_NOT_READY"
  | "SHARE_SECRET_NOT_CONFIGURED"
  | "TOKEN_KEY_VERSION_UNAVAILABLE"
  | "QUOTA_CAPACITY_CONFIG_NOT_CONFIGURED"
  | "TEST_ADAPTER_FORBIDDEN";

/** Kalıcı paylaşım altyapısı hazır olmadığında istemciye güvenli 503 taşır. */
export class BelgeShareRuntimeError extends Error {
  public readonly statusCode = 503;

  constructor(public readonly code: BelgeShareRuntimeErrorCode) {
    const messages: Record<BelgeShareRuntimeErrorCode, string> = {
      DATABASE_NOT_CONFIGURED: "Belge paylaşım veritabanı yapılandırılmamış.",
      DATABASE_UNAVAILABLE: "Belge paylaşım veritabanına şu anda ulaşılamıyor.",
      BLOB_NOT_CONFIGURED: "Belge paylaşım dosya deposu yapılandırılmamış.",
      SCHEMA_NOT_READY: "Belge paylaşım altyapısı henüz hazır değil.",
      SHARE_SECRET_NOT_CONFIGURED: "Production ortamında en az 32 karakterlik BELGE_SHARE_SECRET tanımlanmalıdır.",
      TOKEN_KEY_VERSION_UNAVAILABLE: "Paylaşım bağlantısının anahtar sürümü bu sunucuda kullanılamıyor.",
      QUOTA_CAPACITY_CONFIG_NOT_CONFIGURED: "Paylaşım kapasite sınırları yapılandırılmamış.",
      TEST_ADAPTER_FORBIDDEN: "Bellek içi test deposu bu çalışma ortamında kullanılamaz.",
    };

    super(messages[code]);
    this.name = "BelgeShareRuntimeError";
  }
}

export interface BelgeShareQuotaConfig {
  globalDailyLimit: number;
  globalMaxStorageBytes: number;
}

function positiveSafeInteger(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

/** Production kota bütçeleri açıkça girilir; yerelde yalnız belgelenmiş test varsayımları kullanılır. */
export function getBelgeShareQuotaConfig(): BelgeShareQuotaConfig {
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const dailyRaw = process.env.BELGE_SHARE_GLOBAL_DAILY_LIMIT;
  const bytesRaw = process.env.BELGE_SHARE_GLOBAL_MAX_STORAGE_BYTES;
  const globalDailyLimit = dailyRaw === undefined && !isProduction
    ? BELGE_SHARE_CONFIG.LOCAL_GLOBAL_DAILY_LIMIT
    : positiveSafeInteger(dailyRaw);
  const globalMaxStorageBytes = bytesRaw === undefined && !isProduction
    ? BELGE_SHARE_CONFIG.LOCAL_GLOBAL_MAX_STORAGE_BYTES
    : positiveSafeInteger(bytesRaw);

  if (globalDailyLimit === null || globalMaxStorageBytes === null) {
    throw new BelgeShareRuntimeError("QUOTA_CAPACITY_CONFIG_NOT_CONFIGURED");
  }
  return { globalDailyLimit, globalMaxStorageBytes };
}

/** Yeni token üretiminde kullanılan anahtar sürümü; otomatik secret rotasyonu yapmaz. */
export function getBelgeShareTokenKeyVersion(): number {
  const configured = process.env.BELGE_SHARE_TOKEN_KEY_VERSION;
  if (!configured) return 1;
  const version = Number(configured);
  if (!Number.isSafeInteger(version) || version < 1 || version > 32767) {
    throw new BelgeShareRuntimeError("TOKEN_KEY_VERSION_UNAVAILABLE");
  }
  return version;
}

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
    throw new BelgeShareRuntimeError("SHARE_SECRET_NOT_CONFIGURED");
  }

  // Yerel geliştirme ve izole birim testleri için sabit test anahtarı
  return "dev-local-belge-share-secret-key-32-bytes-minimum-length!";
}
