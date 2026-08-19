// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — VERİTABANI TABANLI RATE LIMITING (WITH FALLBACK)
// ============================================================================

import { getDb } from "./db";
import { hashIpFingerprint } from "./security";

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds: number;
}

// DB erişilemediğinde veya yerel geliştirmede bellek içi fallback haritası
const inMemoryAttempts = new Map<
  string,
  { count: number; oldestAttempt: number }
>();

function checkInMemoryRateLimit(
  subjectHash: string,
  maxAttempts: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const entry = inMemoryAttempts.get(subjectHash);

  if (!entry) {
    return { allowed: true, remainingAttempts: maxAttempts, retryAfterSeconds: 0 };
  }

  const elapsedSeconds = Math.floor((now - entry.oldestAttempt) / 1000);

  // Pencere süresi geçmişse sıfırla
  if (elapsedSeconds >= windowSeconds) {
    inMemoryAttempts.delete(subjectHash);
    return { allowed: true, remainingAttempts: maxAttempts, retryAfterSeconds: 0 };
  }

  const remaining = Math.max(0, maxAttempts - entry.count);

  if (entry.count >= maxAttempts) {
    const retryAfter = Math.max(1, windowSeconds - elapsedSeconds);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds: retryAfter,
    };
  }

  return {
    allowed: true,
    remainingAttempts: remaining,
    retryAfterSeconds: 0,
  };
}

/**
 * Belirtilen scope ve IP için rate limit durumunu kontrol eder
 */
export async function checkRateLimit(
  scope: string,
  ip: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const subjectHash = hashIpFingerprint(ip, scope);

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return checkInMemoryRateLimit(subjectHash, maxAttempts, windowSeconds);
    }

    const sql = getDb();
    const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();

    // Son penceredeki başarısız denemeleri say
    const rows = await sql`
      SELECT COUNT(*)::int AS count, MIN(created_at) AS oldest_attempt
      FROM dok_auth_attempts
      WHERE scope = ${scope}
        AND subject_hash = ${subjectHash}
        AND success = FALSE
        AND created_at >= ${windowStart};
    `;

    const failedCount = rows[0]?.count ?? 0;
    const remaining = Math.max(0, maxAttempts - failedCount);

    if (failedCount >= maxAttempts) {
      const oldest = rows[0]?.oldest_attempt
        ? new Date(rows[0].oldest_attempt).getTime()
        : Date.now();
      const elapsedSeconds = Math.floor((Date.now() - oldest) / 1000);
      const retryAfter = Math.max(1, windowSeconds - elapsedSeconds);

      return {
        allowed: false,
        remainingAttempts: 0,
        retryAfterSeconds: retryAfter,
      };
    }

    return {
      allowed: true,
      remainingAttempts: remaining,
      retryAfterSeconds: 0,
    };
  } catch {
    // DB hatası durumunda bellek içi fallback devreye girer (kullanıcı kilitlenmez)
    return checkInMemoryRateLimit(subjectHash, maxAttempts, windowSeconds);
  }
}

/**
 * Giriş veya şifre denemesini kaydeder
 */
export async function recordAuthAttempt(
  scope: string,
  ip: string,
  success: boolean
): Promise<void> {
  const subjectHash = hashIpFingerprint(ip, scope);

  // Bellek içi haritayı güncelle
  if (success) {
    inMemoryAttempts.delete(subjectHash);
  } else {
    const now = Date.now();
    const entry = inMemoryAttempts.get(subjectHash);
    if (!entry) {
      inMemoryAttempts.set(subjectHash, { count: 1, oldestAttempt: now });
    } else {
      entry.count += 1;
    }
  }

  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return;

    const sql = getDb();

    await sql`
      INSERT INTO dok_auth_attempts (scope, subject_hash, success)
      VALUES (${scope}, ${subjectHash}, ${success});
    `;

    // Başarılı girişte eski başarısız denemeleri temizle
    if (success) {
      await sql`
        DELETE FROM dok_auth_attempts
        WHERE scope = ${scope} AND subject_hash = ${subjectHash};
      `;
    }
  } catch {
    // Hata sessizce yakalanır
  }
}
