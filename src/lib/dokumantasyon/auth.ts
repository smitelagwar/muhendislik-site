// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — ADMIN OTURUMU VE AUTH YARDIMCILARI
// ============================================================================

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { DOKUMANTASYON_CONFIG } from "./config";
import { DokSessionPayload } from "./types";
import { dummyCompare, verifyPassword } from "./security";

/**
 * JWT imzalama anahtarını Uint8Array olarak döndürür
 */
export function getJwtSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      throw new Error("SESSION_SECRET ortam değişkeni tanımlanmamış. Güvenlik gereği varsayılan secret ile başlatılamaz.");
    }
    return new TextEncoder().encode("dev_dokumantasyon_session_key_min_32_chars_2026");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Güncel admin oturum versiyonunu döndürür
 */
export function getCurrentSessionVersion(): number {
  const v = Number(process.env.ADMIN_SESSION_VERSION);
  return !isNaN(v) && v > 0 ? v : 1;
}

/**
 * Admin için yeni bir JWT oturum token'ı imzalar
 */
export async function createDokumantasyonSessionToken(username: string): Promise<string> {
  const secret = getJwtSecret();
  const sessionVersion = getCurrentSessionVersion();
  const jti = crypto.randomUUID();

  return new SignJWT({
    username,
    sessionVersion,
  })
    .setProtectedHeader({ alg: DOKUMANTASYON_CONFIG.SESSION_ALGORITHM })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${DOKUMANTASYON_CONFIG.SESSION_MAX_AGE_SECONDS}s`)
    .sign(secret);
}

/**
 * JWT oturum token'ını doğrular ve versiyon kontrolü yapar
 */
export async function verifyDokumantasyonSessionToken(
  token: string
): Promise<DokSessionPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [DOKUMANTASYON_CONFIG.SESSION_ALGORITHM],
    });

    const username = payload.username as string;
    const sessionVersion = payload.sessionVersion as number;
    const currentVersion = getCurrentSessionVersion();

    // Oturum versiyonu eski ise oturumu reddet
    if (sessionVersion !== currentVersion) {
      return null;
    }

    return {
      username,
      sessionVersion,
      jti: (payload.jti as string) || "",
      iat: (payload.iat as number) || 0,
      exp: (payload.exp as number) || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Oturum çerezini (cookie) güvenli parametrelerle ayarlar
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  cookieStore.set(DOKUMANTASYON_CONFIG.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
    maxAge: DOKUMANTASYON_CONFIG.SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Oturum çerezini temizler (logout)
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DOKUMANTASYON_CONFIG.SESSION_COOKIE_NAME);
}

/**
 * Mevcut istekteki admin oturumunu doğrular
 */
export async function getDokumantasyonSession(): Promise<DokSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(DOKUMANTASYON_CONFIG.SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyDokumantasyonSessionToken(token);
}

/**
 * Admin oturumunu zorunlu kılar; yoksa hata fırlatır
 */
export async function requireDokumantasyonAdmin(): Promise<DokSessionPayload> {
  const session = await getDokumantasyonSession();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

/**
 * Kullanıcı adı ve şifreyi doğrular (timing saldırısına dayanıklı)
 */
export async function validateAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const expectedUsername = process.env.ADMIN_USERNAME || "admin";
  const expectedHash =
    process.env.ADMIN_PASSWORD_HASH ||
    "$2b$10$TxzKJSpWjjhIwB8honXpuOGcE4VQdEEsN2WGFadTRG1GdvqiCrRfO"; // bcrypt hash of "admin"

  // Kullanıcı adı karşılaştırması
  const usernameMatches =
    username.trim().toLowerCase() === expectedUsername.trim().toLowerCase();

  if (!usernameMatches) {
    await dummyCompare(password);
    return false;
  }

  // Şifre karşılaştırması
  return verifyPassword(password, expectedHash);
}
