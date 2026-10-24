// ============================================================================
// BELGE PAYLAŞIM — KRİPTOGRAFİ VE DETERMINİSTİK TOKEN ÇEKİRDEĞİ
// ============================================================================

import crypto from "crypto";
import { getBelgeShareSecret, getBelgeShareTokenKeyVersion } from "./config";
import type { BelgeShareTokens } from "./types";

/**
 * Bir string'i SHA-256 ile hashler (DB token ve requestId hash lookup'ları için).
 */
export function sha256Hex(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * clientRequestId üzerinden domain-separated deterministik token çifti üretir:
 * - viewToken: Alıcının /b/[token] adresine erişimi (256-bit entropi)
 * - manageToken: Yalnız oluşturanın iptal yetkisi (256-bit entropi)
 *
 * Veritabanında ASLA ham token saklanmaz; yalnız SHA-256 hash'leri tutulur.
 */
export function generateDeterministicTokens(
  clientRequestId: string,
  secretOverride?: string
): BelgeShareTokens {
  const secret = secretOverride ?? getBelgeShareSecret();
  const cleanRequestId = clientRequestId.trim();
  if (!cleanRequestId) {
    throw new Error("clientRequestId boş olamaz.");
  }

  // Domain-separated HMAC-SHA256 (RFC 2104)
  const viewToken = crypto
    .createHmac("sha256", secret)
    .update(`view:v1:${cleanRequestId}`)
    .digest("base64url");

  const manageToken = crypto
    .createHmac("sha256", secret)
    .update(`manage:v1:${cleanRequestId}`)
    .digest("base64url");

  const viewTokenHash = sha256Hex(viewToken);
  const manageTokenHash = sha256Hex(manageToken);

  return {
    viewToken,
    manageToken,
    viewTokenHash,
    manageTokenHash,
  };
}

/** New V3 tokens are bound to a durable random reservation nonce and key version. */
export function generateReservationTokens(
  clientRequestId: string,
  reservationNonce: Uint8Array,
  keyVersion: number,
  secretOverride?: string,
): BelgeShareTokens {
  const cleanRequestId = clientRequestId.trim();
  if (!cleanRequestId) throw new Error("clientRequestId boş olamaz.");
  if (!(reservationNonce instanceof Uint8Array) || reservationNonce.byteLength !== 32) {
    throw new Error("reservation nonce tam 32 bayt olmalıdır.");
  }
  if (!Number.isSafeInteger(keyVersion) || keyVersion < 1 || keyVersion !== getBelgeShareTokenKeyVersion()) {
    throw new Error("TOKEN_KEY_VERSION_UNAVAILABLE");
  }

  const secret = secretOverride ?? getBelgeShareSecret();
  const nonce = Buffer.from(reservationNonce);
  const derive = (purpose: "view" | "manage") => crypto
    .createHmac("sha256", secret)
    .update(`belge-share-token:v2:key-${keyVersion}:${purpose}:`, "utf8")
    .update(cleanRequestId, "utf8")
    .update("\0", "utf8")
    .update(nonce)
    .digest("base64url");
  const viewToken = derive("view");
  const manageToken = derive("manage");
  return {
    viewToken,
    manageToken,
    viewTokenHash: sha256Hex(viewToken),
    manageTokenHash: sha256Hex(manageToken),
  };
}

export function isValidReplayProof(proof: string | null | undefined): proof is string {
  if (!proof || !/^[A-Za-z0-9_-]{43}$/.test(proof)) return false;
  const bytes = Buffer.from(proof, "base64url");
  return bytes.byteLength === 32 && bytes.toString("base64url") === proof;
}

/** Shared view/manage tokens are canonical base64url encodings of 256-bit values. */
export function isValidShareToken(token: string | null | undefined): token is string {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return false;
  const bytes = Buffer.from(token, "base64url");
  return bytes.byteLength === 32 && bytes.toString("base64url") === token;
}

export function isValidClientRequestId(requestId: string | null | undefined): requestId is string {
  if (!requestId || !/^[A-Za-z0-9_-]{43}$/.test(requestId)) return false;
  const bytes = Buffer.from(requestId, "base64url");
  return bytes.byteLength === 32 && bytes.toString("base64url") === requestId;
}

/** Replay proofs are stored as a scoped HMAC, never as the raw browser secret. */
export function computeReplayProofHash(
  ownerHash: string,
  requestIdHash: string,
  proof: string,
  secretOverride?: string,
): string {
  const secret = secretOverride ?? getBelgeShareSecret();
  return crypto
    .createHmac("sha256", secret)
    .update("belge-share-replay-proof:v1\0", "utf8")
    .update(ownerHash, "utf8")
    .update("\0", "utf8")
    .update(requestIdHash, "utf8")
    .update("\0", "utf8")
    .update(proof, "utf8")
    .digest("hex");
}

/**
 * Form alanlarını deterministik ve kanonik sıralamayla HMAC-SHA256 ile özetler.
 * Aynı requestId ile farklı form verisi gönderilirse 409 Conflict tespiti sağlar.
 */
export function computePayloadDigest(
  documentId: string,
  values: Record<string, string>,
  secretOverride?: string
): string {
  const secret = secretOverride ?? getBelgeShareSecret();

  // Anahtarları alfabetik sıralayarak kanonik JSON oluştur
  const sortedKeys = Object.keys(values).sort();
  const canonicalEntries = sortedKeys.map((key) => [key, String(values[key] ?? "")]);
  const canonicalString = JSON.stringify({
    documentId,
    values: Object.fromEntries(canonicalEntries),
  });

  return crypto
    .createHmac("sha256", secret)
    .update(`payload:v1:${canonicalString}`)
    .digest("hex");
}

/**
 * Client IP adresini tuzlanmış HMAC ile takma adlı (pseudonymous) hale getirir.
 * Düz IP adresi veritabanında asla saklanmaz.
 */
export function hashCreatorIp(ip: string, secretOverride?: string): string {
  const secret = secretOverride ?? getBelgeShareSecret();
  const normalized = ip.trim().toLowerCase();
  return crypto
    .createHmac("sha256", secret)
    .update(`ip:v1:${normalized}`)
    .digest("hex");
}

/**
 * İki hash değerini zamanlama saldırılarına (timing attack) karşı sabit süreli karşılaştırır.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
