// ============================================================================
// BELGE PAYLAŞIM — SERVİS ÇEKİRDEĞİ VE İŞ AKIŞLARI
// ============================================================================

import crypto from "crypto";
import { BELGE_SHARE_CONFIG, BelgeShareRuntimeError, getBelgeShareTokenKeyVersion } from "./config";
import { getBelgeBlobStore } from "./blob-store";
import { getBelgePaylasimRepository } from "./repository";
import {
  computeReplayProofHash,
  computePayloadDigest,
  generateReservationTokens,
  hashCreatorIp,
  isValidReplayProof,
  sha256Hex,
  constantTimeCompare,
  isValidShareToken,
  isValidClientRequestId,
} from "./tokens";
import type {
  BelgePaylasimRecord,
  CreateShareReservationParams,
  CreateShareReservationResult,
  BelgeShareTokens,
} from "./types";

export class BelgeShareServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "BelgeShareServiceError";
  }
}

/**
 * Paylaşım rezervasyonu oluşturur veya idempotent olarak mevcut hazır kaydı döner.
 */
export async function createShareReservation(
  params: CreateShareReservationParams
): Promise<CreateShareReservationResult> {
  const repo = getBelgePaylasimRepository();

  // 1. Doküman tipi doğrulaması
  if (!BELGE_SHARE_CONFIG.SUPPORTED_DOCUMENTS.includes(params.documentId)) {
    throw new BelgeShareServiceError(
      "UNSUPPORTED_DOCUMENT",
      `Desteklenmeyen belge türü: ${params.documentId}`,
      400
    );
  }

  const clientRequestId = params.clientRequestId.trim();
  const requestIdHash = sha256Hex(clientRequestId);
  const payloadDigest = computePayloadDigest(params.documentId, params.values);
  const creatorIpHash = hashCreatorIp(params.creatorIp);
  const testIdentity = process.env.NODE_ENV === "test";
  const ownerHash = params.ownerHash ?? (testIdentity ? "0".repeat(64) : "");
  const environmentKey = params.environmentKey ?? (testIdentity ? "local" : undefined);
  const replayProof = params.replayProof ?? (testIdentity ? "A".repeat(43) : "");
  if (!ownerHash || !environmentKey || !isValidReplayProof(replayProof)) {
    throw new BelgeShareServiceError("REPLAY_PROOF_REQUIRED", "İstek güvenli tekrar kanıtı taşımıyor.", 400);
  }
  const proofHash = computeReplayProofHash(ownerHash, requestIdHash, replayProof);
  let existing: BelgePaylasimRecord | null;
  try {
    existing = await repo.findByRequestIdHash(requestIdHash);
  } catch (error) {
    if (error instanceof BelgeShareRuntimeError) throw error;
    throw new BelgeShareRuntimeError("DATABASE_UNAVAILABLE");
  }
  if (existing) {
    const reused = await resumeExistingReservation({
      record: existing,
      clientRequestId,
      ownerHash,
      proofHash,
      payloadDigest,
      creatorIpHash,
    });
    if (reused) return reused;
  }

  // Legacy rows have no browser owner/replay proof. Never reconstruct or return
  // their management token from the old requestId-only derivation.
  const tokenKeyVersion = getBelgeShareTokenKeyVersion();
  const reservationNonce = crypto.randomBytes(32);
  const tokens = generateReservationTokens(clientRequestId, reservationNonce, tokenKeyVersion);
  const attemptId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + BELGE_SHARE_CONFIG.EXPIRATION_MS);
  const leaseUntil = new Date(now.getTime() + BELGE_SHARE_CONFIG.ATTEMPT_LEASE_DURATION_MS);
  const blobPathname = `${BELGE_SHARE_CONFIG.BLOB_PATH_PREFIX}${attemptId}.pdf`;

  const reserved = await repo.createOrGetReservation({
    requestIdHash,
    payloadDigest,
    tokenHash: tokens.viewTokenHash,
    manageTokenHash: tokens.manageTokenHash,
    documentId: params.documentId,
    blobPathname,
    creatorIpHash,
    expiresAt,
    ownerHash,
    ownerVersion: 1,
    requestVersion: 1,
    proofHash,
    proofVersion: 1,
    tokenVersion: 2,
    tokenKeyVersion,
    reservationNonce,
    environmentKey,
    attemptId,
    attemptVersion: 1,
    leaseUntil,
  });
  if (!reserved.created) {
    const raced = await resumeExistingReservation({
      record: reserved.record, clientRequestId, ownerHash, proofHash, payloadDigest, creatorIpHash,
    });
    if (raced) return raced;
    throw new BelgeShareServiceError("REPLAY_NOT_FOUND", "İşlem bulunamadı.", 404);
  }

  return {
    status: "new",
    record: reserved.record,
    tokens,
    url: `/b/${tokens.viewToken}`,
    manageToken: tokens.manageToken,
    expiresAt: expiresAt.toISOString(),
  };
}

interface ResumeReservationParams {
  record: BelgePaylasimRecord;
  clientRequestId: string;
  ownerHash: string;
  proofHash: string;
  payloadDigest: string;
  creatorIpHash: string;
}

function tokensForRecord(record: BelgePaylasimRecord, clientRequestId: string): BelgeShareTokens {
  if (
    record.tokenVersion !== 2 || !record.tokenKeyVersion || !record.reservationNonce ||
    record.reservationNonce.byteLength !== 32
  ) {
    throw new BelgeShareRuntimeError("TOKEN_KEY_VERSION_UNAVAILABLE");
  }
  try {
    return generateReservationTokens(clientRequestId, record.reservationNonce, record.tokenKeyVersion);
  } catch {
    throw new BelgeShareRuntimeError("TOKEN_KEY_VERSION_UNAVAILABLE");
  }
}

async function resumeExistingReservation(
  params: ResumeReservationParams,
): Promise<CreateShareReservationResult | null> {
  const { record } = params;
  if (!record.ownerHash || !record.proofHash || record.ownerVersion !== 1 || record.proofVersion !== 1) {
    throw new BelgeShareServiceError(
      "LEGACY_REPLAY_UNAVAILABLE",
      "Eski paylaşım bu tarayıcıyla güvenli biçimde geri bulunamıyor. Eski yönetim anahtarı korunmalıdır.",
      409,
    );
  }
  if (
    !constantTimeCompare(record.ownerHash, params.ownerHash) ||
    !constantTimeCompare(record.proofHash, params.proofHash)
  ) {
    throw new BelgeShareServiceError("REPLAY_NOT_FOUND", "İşlem bulunamadı.", 404);
  }
  if (record.payloadDigest !== params.payloadDigest) {
    throw new BelgeShareServiceError(
      "IDEMPOTENCY_CONFLICT",
      "Bu istek kimliği farklı içerikle daha önce kullanılmış.",
      409,
    );
  }
  if (record.status === "revoked" || record.revokedAt) {
    throw new BelgeShareServiceError("LINK_REVOKED", "Bu işlem artık kullanılamıyor.", 410);
  }
  if (record.status === "purged" || record.expiresAt.getTime() <= Date.now()) {
    throw new BelgeShareServiceError("LINK_EXPIRED", "Bu işlem artık kullanılamıyor.", 410);
  }
  if (record.status === "ready") {
    const tokens = tokensForRecord(record, params.clientRequestId);
    return {
      status: "existing_ready",
      record,
      tokens,
      url: `/b/${tokens.viewToken}`,
      manageToken: tokens.manageToken,
      expiresAt: record.expiresAt.toISOString(),
    };
  }
  if (record.status === "pending" && record.leaseUntil && record.leaseUntil.getTime() > Date.now()) {
    return { status: "in_flight", record };
  }
  if (record.status !== "failed" && record.status !== "pending") {
    throw new BelgeShareServiceError("LINK_EXPIRED", "Bu işlem artık kullanılamıyor.", 410);
  }

  const attemptId = crypto.randomUUID();
  const leaseUntil = new Date(Date.now() + BELGE_SHARE_CONFIG.ATTEMPT_LEASE_DURATION_MS);
  const blobPathname = `${BELGE_SHARE_CONFIG.BLOB_PATH_PREFIX}${attemptId}.pdf`;
  const retry = await getBelgePaylasimRepository().beginRetryAttempt(record.id, attemptId, blobPathname, leaseUntil);
  if (retry) {
    const tokens = tokensForRecord(retry, params.clientRequestId);
    return {
      status: "retry",
      record: retry,
      tokens,
      url: `/b/${tokens.viewToken}`,
      manageToken: tokens.manageToken,
      expiresAt: retry.expiresAt.toISOString(),
    };
  }

  // A concurrent retry/takeover won. Re-read the state and return only the
  // safe operation status; the winner alone may render and write its Blob.
  const latest = await getBelgePaylasimRepository().findByRequestIdHash(record.requestIdHash);
  if (latest && latest.status === "ready") {
    const tokens = tokensForRecord(latest, params.clientRequestId);
    return {
      status: "existing_ready", record: latest, tokens,
      url: `/b/${tokens.viewToken}`, manageToken: tokens.manageToken,
      expiresAt: latest.expiresAt.toISOString(),
    };
  }
  return { status: "in_flight", record: latest ?? record };
}

export type ShareOperationStatus =
  | { status: "not_found" }
  | { status: "pending" }
  | { status: "failed" }
  | { status: "terminal" }
  | { status: "ready"; record: BelgePaylasimRecord; tokens: BelgeShareTokens };

/** Proof-authenticated recovery endpoint lookup; form data is never persisted or returned. */
export async function getShareOperationStatus(params: {
  clientRequestId: string;
  ownerHash: string | null;
  replayProof: string | null;
}): Promise<ShareOperationStatus> {
  if (!params.ownerHash || !isValidReplayProof(params.replayProof)) return { status: "not_found" };
  const clientRequestId = params.clientRequestId.trim();
  if (!isValidClientRequestId(clientRequestId)) return { status: "not_found" };
  const requestIdHash = sha256Hex(clientRequestId);
  // Operational status is used during recovery after lost HTTP replies.
  // A database outage is retryable, never proof that an operation is missing.
  let record: BelgePaylasimRecord | null;
  try {
    record = await getBelgePaylasimRepository().findByRequestIdHash(requestIdHash);
  } catch (error) {
    if (error instanceof BelgeShareRuntimeError) throw error;
    throw new BelgeShareRuntimeError("DATABASE_UNAVAILABLE");
  }
  if (!record || !record.ownerHash || !record.proofHash || record.ownerVersion !== 1 || record.proofVersion !== 1) {
    return { status: "not_found" };
  }
  const proofHash = computeReplayProofHash(params.ownerHash, requestIdHash, params.replayProof);
  if (!constantTimeCompare(record.ownerHash, params.ownerHash) || !constantTimeCompare(record.proofHash, proofHash)) {
    return { status: "not_found" };
  }
  if (record.status === "revoked" || record.status === "purged" || record.revokedAt || record.expiresAt.getTime() <= Date.now()) {
    return { status: "terminal" };
  }
  if (record.status === "pending") return { status: "pending" };
  if (record.status === "failed") return { status: "failed" };
  if (record.status !== "ready") return { status: "terminal" };
  return { status: "ready", record, tokens: tokensForRecord(record, clientRequestId) };
}

/**
 * PDF üretimi tamamlanıp Blob'a yüklendikten sonra kaydı 'ready' durumuna getirir.
 */
export async function finalizeShareReservation(
  recordId: string,
  sizeBytes: number,
  pdfSha256: string,
  attemptId?: string,
  attemptVersion?: number,
): Promise<boolean> {
  const repo = getBelgePaylasimRepository();
  return repo.finalizeReady(recordId, sizeBytes, pdfSha256, attemptId, attemptVersion);
}

/**
 * Başarısız durumlarda kaydı işaretler.
 */
export async function failShareReservation(
  recordId: string,
  errorCode: string,
  attemptId?: string,
  attemptVersion?: number,
  uploadState: "not_started" | "unknown" | "present" = "unknown",
  actualBytes?: number,
): Promise<boolean> {
  const repo = getBelgePaylasimRepository();
  return repo.markFailed(recordId, errorCode, attemptId, attemptVersion, uploadState, actualBytes);
}

/**
 * Yönetim token'ı ile bağlantıyı iptal eder.
 * Önce veritabanında revoked yapılır (anında 410), ardından Blob silinir.
 */
export async function revokeShareByManageToken(manageToken: string): Promise<BelgePaylasimRecord> {
  const cleanToken = manageToken.trim();
  if (!cleanToken) {
    throw new BelgeShareServiceError("INVALID_MANAGE_TOKEN", "Yönetim anahtarı boş olamaz.", 400);
  }

  const repo = getBelgePaylasimRepository();
  const manageTokenHash = sha256Hex(cleanToken);

  const record = await repo.findByManageTokenHash(manageTokenHash);
  if (!record) {
    throw new BelgeShareServiceError("NOT_FOUND", "İptal edilecek bağlantı bulunamadı.", 404);
  }

  if (record.status === "revoked") {
    return record;
  }

  // 1. Önce DB'de erişimi kapat
  await repo.revokeLink(record.id);

  // 2. Ardından depodan silmeyi dene (başarısız olsa dahi DB kapalı kaldığı için güvenli, cron tekrar dener)
  try {
    const blobStore = getBelgeBlobStore();
    await blobStore.del(record.blobPathname);
    await repo.markPurged(record.id);
  } catch {
    await repo.recordPurgeError(record.id, "DELETE_ON_REVOKE_FAILED");
  }

  return {
    ...record,
    status: "revoked",
    revokedAt: new Date(),
  };
}

export type GetShareResult =
  | { status: "ok"; record: BelgePaylasimRecord }
  | { status: "expired"; record: BelgePaylasimRecord }
  | { status: "revoked"; record: BelgePaylasimRecord }
  | { status: "not_found" }
  | { status: "not_ready"; record: BelgePaylasimRecord };

/**
 * Alıcı token'ı ile bağlantıyı sorgular.
 */
export async function getShareByViewToken(viewToken: string): Promise<GetShareResult> {
  const cleanToken = viewToken.trim();
  if (!isValidShareToken(cleanToken)) return { status: "not_found" };

  const tokenHash = sha256Hex(cleanToken);
  let record: BelgePaylasimRecord | null;
  try {
    record = await getBelgePaylasimRepository().findByTokenHash(tokenHash);
  } catch (error) {
    if (error instanceof BelgeShareRuntimeError) throw error;
    throw new BelgeShareRuntimeError("DATABASE_UNAVAILABLE");
  }
  if (!record) return { status: "not_found" };

  const now = Date.now();
  if (record.status === "revoked" || record.revokedAt != null) {
    return { status: "revoked", record };
  }

  if (record.status === "purged" || record.expiresAt.getTime() <= now) {
    return { status: "expired", record };
  }

  if (record.status !== "ready") {
    return { status: "not_ready", record };
  }

  return { status: "ok", record };
}
