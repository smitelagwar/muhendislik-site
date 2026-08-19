// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — GÜVENLİK VE KRİPTOGRAFİ YARDIMCILARI
// ============================================================================

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getDokAuthRuntimeConfig } from "./auth-config";

const DUMMY_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"; // bcrypt hash of random text

/**
 * Şifreyi bcrypt ile güvenli biçimde hashler
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verilen şifre ile hash'i karşılaştırır
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Kullanıcı adı yanlış olduğunda dahi timing analizini engellemek için sahte karşılaştırma yapar
 */
export async function dummyCompare(password: string): Promise<void> {
  try {
    await bcrypt.compare(password, DUMMY_HASH);
  } catch {
    // ignore
  }
}

/**
 * 32 byte (256-bit) kriptografik rastgele base64url token üretir
 */
export function generateRawToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Ham share token'ı SHA-256 ile hashler (DB'de arama yapmak için kullanılır)
 */
export function hashShareToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * IP adresi ve işlem alanını HMAC-SHA256 ile hashler (düz IP saklanmaz)
 */
export function hashIpFingerprint(ip: string, scope: string): string {
  const effectiveSalt = getDokAuthRuntimeConfig().rateLimitSalt;
  const normalizedIp = ip.trim().toLowerCase();
  return crypto.createHmac("sha256", effectiveSalt).update(`${scope}:${normalizedIp}`).digest("hex");
}

/**
 * Client IP adresini güvenli biçimde çıkarır
 */
export function extractClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "127.0.0.1";
}

/**
 * POST / PATCH / DELETE vb. mutating isteklerde Same-Origin kontrolü yapar
 */
export function assertSameOriginForMutation(request: Request): void {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host") || request.headers.get("x-forwarded-host");

  // Origin başlığı varsa kontrol et
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (host && originUrl.host !== host) {
        throw new Error("CSRF / Cross-Origin istek engellendi (Origin uyuşmazlığı)");
      }
      return;
    } catch {
      throw new Error("Geçersiz Origin başlığı");
    }
  }

  // Origin yoksa referer başlığını kontrol et
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (host && refererUrl.host !== host) {
        throw new Error("CSRF / Cross-Origin istek engellendi (Referer uyuşmazlığı)");
      }
      return;
    } catch {
      throw new Error("Geçersiz Referer başlığı");
    }
  }

  // Test veya direct server-to-server durumları için host mevcutsa izin ver
}

/**
 * Aktif linklerin admin tarafından tekrar kopyalanabilmesi için AES-256-GCM ile token şifreler
 */
export function encryptToken(rawToken: string): string | null {
  const keyHex =
    process.env.SHARE_TOKEN_ENCRYPTION_KEY ||
    "super_secure_key_for_testing_shares_2026_aes_gcm";

  try {
    const key = crypto.createHash("sha256").update(keyHex).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    
    let encrypted = cipher.update(rawToken, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error("Token şifreleme hatası:", err);
    return null;
  }
}

/**
 * AES-256-GCM ile şifrelenmiş token'ı çözer
 */
export function decryptToken(encryptedPayload: string): string | null {
  const keyHex =
    process.env.SHARE_TOKEN_ENCRYPTION_KEY ||
    "super_secure_key_for_testing_shares_2026_aes_gcm";

  if (!encryptedPayload) {
    return null;
  }

  try {
    const parts = encryptedPayload.split(":");
    if (parts.length !== 3) return null;

    const [ivHex, authTagHex, encryptedText] = parts;
    const key = crypto.createHash("sha256").update(keyHex).digest();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    console.error("Token çözme hatası:", err);
    return null;
  }
}
