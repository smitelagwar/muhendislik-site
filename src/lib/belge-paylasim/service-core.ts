// ============================================================================
// BELGE PAYLAŞIM — SERVİS ÇEKİRDEĞİ VE İŞ AKIŞLARI
// ============================================================================

import crypto from "crypto";
import { BELGE_SHARE_CONFIG } from "./config";
import { getBelgeBlobStore } from "./blob-store";
import { getBelgePaylasimRepository } from "./repository";
import {
  computePayloadDigest,
  generateDeterministicTokens,
  hashCreatorIp,
  sha256Hex,
} from "./tokens";
import type {
  BelgePaylasimRecord,
  CreateShareReservationParams,
  CreateShareReservationResult,
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

  // 2. Hash ve özet hesaplamaları
  const requestIdHash = sha256Hex(params.clientRequestId.trim());
  const payloadDigest = computePayloadDigest(params.documentId, params.values);
  const creatorIpHash = hashCreatorIp(params.creatorIp);

  // 3. Idempotency kontrolü: Bu requestId daha önce işlendi mi?
  const existing = await repo.findByRequestIdHash(requestIdHash);
  if (existing) {
    // Farklı form içeriği ile aynı requestId gönderildiyse 409 Conflict
    if (existing.payloadDigest !== payloadDigest) {
      throw new BelgeShareServiceError(
        "IDEMPOTENCY_CONFLICT",
        "Aynı clientRequestId için farklı form verisi tespit edildi.",
        409
      );
    }

    // İptal edilmiş bağlantı tekrar aktifleşmez
    if (existing.status === "revoked" || existing.revokedAt != null) {
      throw new BelgeShareServiceError(
        "LINK_REVOKED",
        "Bu istek kimliğiyle oluşturulan bağlantı daha önce iptal edilmiştir.",
        410
      );
    }

    // Süresi dolmuş kayıt tekrar aktifleşmez
    if (existing.status === "purged" || existing.expiresAt.getTime() <= Date.now()) {
      throw new BelgeShareServiceError(
        "LINK_EXPIRED",
        "Bu istek kimliğiyle oluşturulan bağlantının geçerlilik süresi dolmuştur.",
        410
      );
    }

    // Mevcut kayıt zaten hazırsa aynı tokenları hesaplayıp idempotent yanıt dön
    if (existing.status === "ready") {
      const tokens = generateDeterministicTokens(params.clientRequestId.trim());
      return {
        status: "existing_ready",
        record: existing,
        tokens,
        url: `/b/${tokens.viewToken}`,
        manageToken: tokens.manageToken,
        expiresAt: existing.expiresAt.toISOString(),
      };
    }

    // İşlem hala devam ediyorsa
    if (existing.status === "pending") {
      throw new BelgeShareServiceError(
        "OPERATION_IN_FLIGHT",
        "Bu bağlantı oluşturma işlemi devam ediyor. Lütfen birazdan tekrar deneyin.",
        409
      );
    }
  }

  // 4. Atomik kota denetimi
  const quota = await repo.checkAndAcquireQuota(creatorIpHash);
  if (!quota.allowed) {
    throw new BelgeShareServiceError(
      "QUOTA_EXCEEDED",
      quota.reason || "Kota aşıldı.",
      429
    );
  }

  // 5. Deterministik token üretimi
  const tokens = generateDeterministicTokens(params.clientRequestId.trim());
  const randomBlobId = crypto.randomUUID();
  const blobPathname = `${BELGE_SHARE_CONFIG.BLOB_PATH_PREFIX}${randomBlobId}.pdf`;
  const expiresAt = new Date(Date.now() + BELGE_SHARE_CONFIG.EXPIRATION_MS);

  // 6. DB'de pending rezervasyon kaydı aç
  const newRecord = await repo.createPendingReservation({
    requestIdHash,
    payloadDigest,
    tokenHash: tokens.viewTokenHash,
    manageTokenHash: tokens.manageTokenHash,
    documentId: params.documentId,
    blobPathname,
    creatorIpHash,
    expiresAt,
  });

  return {
    status: "new",
    record: newRecord,
    tokens,
    url: `/b/${tokens.viewToken}`,
    manageToken: tokens.manageToken,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * PDF üretimi tamamlanıp Blob'a yüklendikten sonra kaydı 'ready' durumuna getirir.
 */
export async function finalizeShareReservation(
  recordId: string,
  sizeBytes: number,
  pdfSha256: string
): Promise<void> {
  const repo = getBelgePaylasimRepository();
  await repo.finalizeReady(recordId, sizeBytes, pdfSha256);
}

/**
 * Başarısız durumlarda kaydı işaretler.
 */
export async function failShareReservation(
  recordId: string,
  errorCode: string
): Promise<void> {
  const repo = getBelgePaylasimRepository();
  await repo.markFailed(recordId, errorCode);
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
  if (!cleanToken) return { status: "not_found" };

  const repo = getBelgePaylasimRepository();
  const tokenHash = sha256Hex(cleanToken);

  const record = await repo.findByTokenHash(tokenHash);
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
