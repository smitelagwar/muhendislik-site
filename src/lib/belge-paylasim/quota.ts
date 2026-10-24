import type { BelgePaylasimDailyQuotaSnapshot } from "./types";

export type BelgeShareQuotaFailureCode =
  | "DAILY_BROWSER_QUOTA_EXCEEDED"
  | "BROWSER_QUOTA_RESERVED"
  | "GLOBAL_DAILY_CAPACITY_REACHED"
  | "STORAGE_CAPACITY_UNAVAILABLE";

export class BelgeShareQuotaError extends Error {
  readonly statusCode: number;
  readonly retryAfterSeconds?: number;

  constructor(
    public readonly code: BelgeShareQuotaFailureCode,
    public readonly quota?: BelgePaylasimDailyQuotaSnapshot,
  ) {
    const messages: Record<BelgeShareQuotaFailureCode, string> = {
      DAILY_BROWSER_QUOTA_EXCEEDED: "Bugün için 50 başarılı bağlantı hakkınız doldu.",
      BROWSER_QUOTA_RESERVED: "Günlük bağlantı hakkınız süren bir işlem için ayrılmış. İşlem tamamlanınca yeniden deneyin.",
      GLOBAL_DAILY_CAPACITY_REACHED: "Paylaşım sistemi günlük üretim kapasitesine ulaştı.",
      STORAGE_CAPACITY_UNAVAILABLE: "Paylaşım depolama kapasitesi şu anda uygun değil.",
    };
    super(messages[code]);
    this.name = "BelgeShareQuotaError";
    this.statusCode = code === "DAILY_BROWSER_QUOTA_EXCEEDED" ? 429
      : code === "BROWSER_QUOTA_RESERVED" ? 409 : 503;
    if (quota && this.statusCode === 429) {
      this.retryAfterSeconds = Math.max(1, Math.ceil((quota.resetAt.getTime() - quota.serverNow.getTime()) / 1000));
    }
  }
}

export function makeQuotaFailure(
  code: BelgeShareQuotaFailureCode,
  quota: BelgePaylasimDailyQuotaSnapshot,
): BelgeShareQuotaError {
  return new BelgeShareQuotaError(code, quota);
}
