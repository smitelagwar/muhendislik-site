// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — ÇALIŞMA ZAMANI VE KALICILIK MODU (RUNTIME MODE)
// ============================================================================

export class DokRuntimeConfigError extends Error {
  public code: string;
  public statusCode: number;

  constructor(code: "DATABASE_NOT_CONFIGURED" | "BLOB_NOT_CONFIGURED" | "LOCAL_STORAGE_FORBIDDEN", message?: string) {
    const defaultMessages = {
      DATABASE_NOT_CONFIGURED: "Dökümantasyon kalıcı veritabanı (Neon Postgres) yapılandırılmamış.",
      BLOB_NOT_CONFIGURED: "Dökümantasyon kalıcı dosya depolama (Vercel Private Blob) yapılandırılmamış.",
      LOCAL_STORAGE_FORBIDDEN: "Vercel üretim ortamında yerel dosya depolama ve /tmp kullanımı yasaktır.",
    };

    super(message || defaultMessages[code]);
    this.name = "DokRuntimeConfigError";
    this.code = code;
    this.statusCode = 503;
  }
}

/**
 * Vercel Serverless/Edge çalışma zamanında olup olmadığımızı belirler
 */
export function isVercelDeployment(): boolean {
  return Boolean(process.env.VERCEL);
}

/**
 * Yalnızca yerel ortamda açıkça izin verilmişse yerel depolamaya (JSON DB / .data/) izin verir.
 * Vercel üzerinde hiçbir koşulda true dönemez!
 */
export function isExplicitLocalDokMode(): boolean {
  if (process.env.VERCEL) {
    return false;
  }
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DOK_ALLOW_LOCAL_STORAGE === "true"
  );
}

export function getDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
  if (process.env.POSTGRES_PRISMA_URL) return process.env.POSTGRES_PRISMA_URL;
  if (process.env.POSTGRES_URL_NON_POOLING) return process.env.POSTGRES_URL_NON_POOLING;
  if (process.env.NEON_DATABASE_URL) return process.env.NEON_DATABASE_URL;
  if (process.env.STORAGE_POSTGRES_URL) return process.env.STORAGE_POSTGRES_URL;
  if (process.env.VERCEL_POSTGRES_URL) return process.env.VERCEL_POSTGRES_URL;

  // Dinamik prefixli veya Marketplace değişkenleri (örn: NEON_BRONZE_ENGINE_URL, vb.)
  for (const [key, value] of Object.entries(process.env)) {
    if (!value || typeof value !== "string") continue;
    if (
      key.includes("DATABASE_URL") ||
      key.includes("POSTGRES_URL") ||
      key.includes("NEON_URL") ||
      (key.startsWith("POSTGRES_") && key.endsWith("_URL"))
    ) {
      return value;
    }
  }

  if (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE) {
    return `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}/${process.env.PGDATABASE}?sslmode=require`;
  }

  return undefined;
}

export function hasDatabaseUrl(): boolean {
  return Boolean(getDatabaseUrl());
}

export function getBlobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  if (process.env.VERCEL_BLOB_READ_WRITE_TOKEN) return process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
  if (process.env.STORAGE_BLOB_READ_WRITE_TOKEN) return process.env.STORAGE_BLOB_READ_WRITE_TOKEN;

  for (const [key, value] of Object.entries(process.env)) {
    if (!value || typeof value !== "string") continue;
    if (key.includes("BLOB_READ_WRITE_TOKEN") || key.includes("BLOB_TOKEN")) {
      return value;
    }
  }

  return undefined;
}

/**
 * Vercel'in Blob OIDC entegrasyonu store kimliğini bu değişkene bağlar.
 * Production'da uzun ömürlü read/write token yerine bu kimlik + Vercel'in
 * function'a otomatik verdiği kısa ömürlü OIDC token kullanılır.
 */
export function getBlobStoreId(): string | undefined {
  const storeId = process.env.BLOB_STORE_ID?.trim();
  return storeId || undefined;
}

/** Vercel üzerinde OIDC Blob erişimi için yeterli yapılandırma var mı? */
export function hasBlobOidcConfiguration(): boolean {
  return isVercelDeployment() && Boolean(getBlobStoreId());
}

/**
 * @vercel/blob SDK komutlarına geçirilecek kimlik bilgileri.
 * Vercel'de OIDC her zaman önceliklidir; legacy token yalnızca Vercel dışı
 * geliştirme/CLI senaryoları için geriye dönük uyumluluk sağlar.
 */
export function getBlobCommandOptions(): { storeId?: string; token?: string } {
  const storeId = getBlobStoreId();
  if (isVercelDeployment() && storeId) {
    return { storeId };
  }

  const token = getBlobToken();
  return token ? { token } : {};
}

/** Blob'a erişmek için OIDC veya (yalnız Vercel dışında) legacy token mevcut mu? */
export function hasBlobAccessConfiguration(): boolean {
  // Vercel Production/Preview'de legacy token bir kaçış yolu değildir.
  // OIDC store bağlantısı yoksa sistem fail-closed kalır.
  if (isVercelDeployment()) {
    return hasBlobOidcConfiguration();
  }
  return Boolean(getBlobToken());
}

export function hasBlobToken(): boolean {
  // Eski çağıranlar için ad korunur; OIDC store yapılandırması da Blob-ready'dir.
  return hasBlobAccessConfiguration();
}

/**
 * Kalıcı depolama gerektiren route veya fonksiyonlarda fail-closed çalışma zamanı denetimi yapar
 */
export function assertDurableDokumantasyonRuntime(requireBlob: boolean = false): void {
  if (isExplicitLocalDokMode()) {
    return;
  }

  if (!hasDatabaseUrl()) {
    throw new DokRuntimeConfigError("DATABASE_NOT_CONFIGURED");
  }

  if (requireBlob && !hasBlobAccessConfiguration()) {
    throw new DokRuntimeConfigError("BLOB_NOT_CONFIGURED");
  }
}
