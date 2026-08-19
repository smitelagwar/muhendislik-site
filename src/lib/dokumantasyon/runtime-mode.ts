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

export function hasBlobToken(): boolean {
  return Boolean(getBlobToken());
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

  if (requireBlob && !hasBlobToken()) {
    throw new DokRuntimeConfigError("BLOB_NOT_CONFIGURED");
  }
}
