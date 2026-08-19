// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — YÜKLEME NİYETİ (UPLOAD INTENT) İMZALAMA VE DOĞRULAMA
// ============================================================================

import { SignJWT, jwtVerify } from "jose";
import { getJwtSecret } from "./auth";

export interface UploadIntentPayload {
  intentId: string;
  pathname: string;
  filename: string;
  sizeBytes: number;
  folderId: string | null;
  username: string;
}

const INTENT_AUDIENCE = "dokumantasyon_upload_intent";
const INTENT_ISSUER = "muhendis_mimar_portali";
const INTENT_TTL_SECONDS = 15 * 60; // 15 dakika geçerli

/**
 * Upload başlatıldığında sunucu imzalı güvenli bir Upload Intent Token üretir
 */
export async function createUploadIntentToken(payload: UploadIntentPayload): Promise<string> {
  const secret = getJwtSecret();

  return new SignJWT({
    intentId: payload.intentId,
    pathname: payload.pathname,
    filename: payload.filename,
    sizeBytes: payload.sizeBytes,
    folderId: payload.folderId,
    username: payload.username,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer(INTENT_ISSUER)
    .setAudience(INTENT_AUDIENCE)
    .setExpirationTime(`${INTENT_TTL_SECONDS}s`)
    .sign(secret);
}

/**
 * Finalize aşamasında istemcinin sunduğu Upload Intent Token'ı doğrular
 */
export async function verifyUploadIntentToken(tokenString: string): Promise<UploadIntentPayload | null> {
  try {
    if (!tokenString || typeof tokenString !== "string") {
      return null;
    }

    const secret = getJwtSecret();
    const { payload } = await jwtVerify(tokenString, secret, {
      issuer: INTENT_ISSUER,
      audience: INTENT_AUDIENCE,
    });

    if (
      !payload.intentId ||
      !payload.pathname ||
      !payload.filename ||
      typeof payload.sizeBytes !== "number"
    ) {
      return null;
    }

    return {
      intentId: payload.intentId as string,
      pathname: payload.pathname as string,
      filename: payload.filename as string,
      sizeBytes: payload.sizeBytes as number,
      folderId: (payload.folderId as string) || null,
      username: (payload.username as string) || "admin",
    };
  } catch {
    return null;
  }
}
