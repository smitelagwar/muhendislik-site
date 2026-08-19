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

/**
 * Kalıcı depolama gerektiren route veya fonksiyonlarda fail-closed çalışma zamanı denetimi yapar
 */
export function assertDurableDokumantasyonRuntime(requireBlob: boolean = false): void {
  if (isExplicitLocalDokMode()) {
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new DokRuntimeConfigError("DATABASE_NOT_CONFIGURED");
  }

  if (requireBlob && !process.env.BLOB_READ_WRITE_TOKEN) {
    throw new DokRuntimeConfigError("BLOB_NOT_CONFIGURED");
  }
}
