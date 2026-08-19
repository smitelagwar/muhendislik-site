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
const INTENT_TTL_SECONDS = 30 * 60; // 30 dakika geçerli

/**
 * Upload başlatıldığında sunucu imzalı güvenli bir Upload Intent Token üretir ve DB'ye kaydeder
 */
export async function createUploadIntentToken(payload: UploadIntentPayload): Promise<string> {
  const secret = getJwtSecret();

  const token = await new SignJWT({
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

  // DB'de intent yaşam döngüsünü kaydet
  const { hasDatabaseUrl } = await import("./runtime-mode");
  if (hasDatabaseUrl()) {
    try {
      const { getDb } = await import("./db");
      const sql = getDb();
      const expiresAt = new Date(Date.now() + INTENT_TTL_SECONDS * 1000).toISOString();
      await sql`
        INSERT INTO dok_upload_intents (
          id, pathname, expected_filename, expected_size_bytes, folder_id, username, status, expires_at
        ) VALUES (
          ${payload.intentId}, ${payload.pathname}, ${payload.filename}, ${payload.sizeBytes},
          ${payload.folderId}, ${payload.username}, 'issued', ${expiresAt}
        )
        ON CONFLICT (pathname) DO NOTHING;
      `;
    } catch (e) {
      console.warn("DB intent kaydetme uyarısı:", e);
    }
  }

  return token;
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

/**
 * Intent durumunu finalize olarak işaretler
 */
export async function markUploadIntentFinalized(intentId: string, fileId?: string): Promise<void> {
  const { hasDatabaseUrl } = await import("./runtime-mode");
  if (hasDatabaseUrl()) {
    try {
      const { getDb } = await import("./db");
      const sql = getDb();
      await sql`
        UPDATE dok_upload_intents
        SET status = 'finalized', finalized_at = NOW(), file_id = ${fileId || null}
        WHERE id = ${intentId};
      `;
    } catch {}
  }
}

/**
 * Intent durumunu failed olarak işaretler
 */
export async function markUploadIntentFailed(intentId: string, errorCode: string): Promise<void> {
  const { hasDatabaseUrl } = await import("./runtime-mode");
  if (hasDatabaseUrl()) {
    try {
      const { getDb } = await import("./db");
      const sql = getDb();
      await sql`
        UPDATE dok_upload_intents
        SET status = 'failed', last_error_code = ${errorCode}
        WHERE id = ${intentId};
      `;
    } catch {}
  }
}
