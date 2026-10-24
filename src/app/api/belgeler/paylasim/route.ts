// ============================================================================
// POST /api/belgeler/paylasim — GÜVENLİ SALT-OKUNUR PDF PAYLAŞIM BAĞLANTISI OLUŞTURMA
// ============================================================================

import { BELGE_SHARE_CONFIG, BelgeShareRuntimeError } from "@/lib/belge-paylasim/config";
import { BelgeShareQuotaError, type BelgeShareQuotaFailureCode } from "@/lib/belge-paylasim/quota";
import { getBelgeBlobStore } from "@/lib/belge-paylasim/blob-store";
import { getBelgePaylasimRepository } from "@/lib/belge-paylasim/repository";
import { sha256Hex } from "@/lib/belge-paylasim/tokens";
import {
  BelgeShareServiceError,
  createShareReservation,
  failShareReservation,
  finalizeShareReservation,
  getShareOperationStatus,
} from "@/lib/belge-paylasim/service-core";
import {
  RequestValidationError,
  validateSameOrigin,
  validateShareCreateRequest,
} from "@/lib/belge-paylasim/request-validation";
import { getBrowserIdentity } from "@/lib/belge-paylasim/browser-identity";
import { isValidReplayProof } from "@/lib/belge-paylasim/tokens";
import {
  renderFlattenedPdf,
  ServerPdfRenderError,
} from "@/lib/belge-paylasim/server-pdf";
import {
  createRequestCorrelationId,
  logShareRequestFailure,
  shareErrorResponse,
  shareJsonResponse,
  shareMethodNotAllowed,
  shareOptionsResponse,
} from "@/lib/belge-paylasim/http";
import { buildBelgeShareUrl, PublicSiteOriginError } from "@/lib/site-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const requestCorrelationId = createRequestCorrelationId();
  const startedAt = performance.now();
  try {
    // Cross-site istek reddi kimlik kontrolünden önce yapılır; create POST cookie üretmez.
    validateSameOrigin(request);
    const identity = getBrowserIdentity(request);
    if (!identity) {
      return shareErrorResponse("BROWSER_ID_REQUIRED", "Paylaşım oluşturmadan önce tarayıcı kimliğini doğrulayın.", 428, requestCorrelationId);
    }

    // 1. İstek parametrelerini, same-origin durumunu ve alan allowlist'ini doğrula
    const validatedInput = await validateShareCreateRequest(request);
    const replayProof = request.headers.get("x-belge-share-replay-proof");
    if (!isValidReplayProof(replayProof)) {
      return shareErrorResponse("REPLAY_PROOF_REQUIRED", "İşlem güvenli tekrar kanıtı taşımıyor.", 400, requestCorrelationId);
    }

    // 2. DB'de rezervasyon veya var olan hazır kaydı sorgula (idempotent kontrol + kota)
    const reservation = await createShareReservation({
      clientRequestId: validatedInput.clientRequestId,
      documentId: validatedInput.documentId,
      values: validatedInput.values,
      creatorIp: validatedInput.creatorIp,
      ownerHash: identity.ownerHash,
      environmentKey: identity.environmentKey,
      replayProof,
    });

    if (reservation.status === "in_flight") {
      return shareJsonResponse(
        { status: "pending", requestId: validatedInput.clientRequestId },
        202,
        requestCorrelationId,
        { "Retry-After": "2" },
      );
    }

    // 2a. Daha önce bu clientRequestId ile hazır bir bağlantı zaten üretilmişse idempotent dön
    if (reservation.status === "existing_ready" && reservation.record && reservation.tokens) {
      return shareJsonResponse(
        {
          status: "ready",
          url: buildBelgeShareUrl(reservation.tokens.viewToken),
          viewToken: reservation.tokens.viewToken,
          manageToken: reservation.tokens.manageToken,
          expiresAt: reservation.expiresAt,
          documentId: reservation.record.documentId,
        },
        200,
        requestCorrelationId,
      );
    }

    if (!reservation.record || !reservation.tokens) {
      throw new BelgeShareServiceError("RESERVATION_FAILED", "Rezervasyon kaydı açılamadı.", 500);
    }

    const { record, tokens } = reservation;
    let uploadState: "not_started" | "unknown" | "present" = "not_started";
    let uploadedBytes: number | undefined;

    try {
      // 3. Sunucuda PDF şablonuna bas ve form alanlarını tamamen düzleştir (flatten: true)
      const rendered = await renderFlattenedPdf(
        validatedInput.documentId,
        validatedInput.values
      );

      // 4. Özel depolamaya (Private Vercel Blob) yükle
      const blobStore = getBelgeBlobStore();
      uploadState = "unknown";
      const uploaded = await blobStore.put(record.blobPathname, rendered.pdfBytes);
      uploadState = "present";
      uploadedBytes = uploaded.sizeBytes;

      // 5. Veritabanındaki rezervasyonu 'ready' durumuna getir
      const finalized = await finalizeShareReservation(
        record.id,
        rendered.sizeBytes,
        rendered.pdfSha256,
        record.attemptId ?? undefined,
        record.attemptVersion,
      );
      if (!finalized) {
        const recovered = await getShareOperationStatus({
          clientRequestId: validatedInput.clientRequestId,
          ownerHash: identity.ownerHash,
          replayProof,
        });
        if (recovered.status === "ready") {
          return shareJsonResponse(
            {
              status: "ready",
              url: buildBelgeShareUrl(recovered.tokens.viewToken),
              viewToken: recovered.tokens.viewToken,
              manageToken: recovered.tokens.manageToken,
              expiresAt: recovered.record.expiresAt.toISOString(),
              documentId: recovered.record.documentId,
            },
            200,
            requestCorrelationId,
          );
        }
        try {
          await blobStore.del(record.blobPathname);
          if (record.environmentKey) await getBelgePaylasimRepository().markBlobDeleted(record.environmentKey, record.blobPathname);
        } catch {
          // The obligation remains charged until a later cleanup confirms deletion.
        }
        const failedRecord = await getBelgePaylasimRepository().findByRequestIdHash(sha256Hex(validatedInput.clientRequestId));
        const quotaFailureCode = failedRecord?.lastPurgeErrorCode as BelgeShareQuotaFailureCode | undefined;
        if (quotaFailureCode && [
          "DAILY_BROWSER_QUOTA_EXCEEDED", "BROWSER_QUOTA_RESERVED",
          "GLOBAL_DAILY_CAPACITY_REACHED", "STORAGE_CAPACITY_UNAVAILABLE",
        ].includes(quotaFailureCode)) {
          const quota = await getBelgePaylasimRepository().getDailyQuota(identity.environmentKey, identity.ownerHash);
          throw new BelgeShareQuotaError(quotaFailureCode, quota);
        }
        return shareJsonResponse(
          { status: "pending", requestId: validatedInput.clientRequestId },
          202,
          requestCorrelationId,
          { "Retry-After": "2" },
        );
      }

      // 6. Başarılı 201 yanıtını dön
      return shareJsonResponse(
        {
          status: "ready",
          url: buildBelgeShareUrl(tokens.viewToken),
          viewToken: tokens.viewToken,
          manageToken: tokens.manageToken,
          expiresAt: reservation.expiresAt,
          documentId: record.documentId,
        },
        201,
        requestCorrelationId,
      );
    } catch (innerError) {
      // PDF veya Blob yükleme aşamasında hata oluşursa rezervasyonu failed olarak işaretle
      const errorCode =
        innerError instanceof ServerPdfRenderError
          ? innerError.code
          : "RENDER_OR_UPLOAD_FAILED";
      await failShareReservation(
        record.id, errorCode, record.attemptId ?? undefined, record.attemptVersion, uploadState, uploadedBytes,
      ).catch(() => false);
      const recovered = await getShareOperationStatus({
        clientRequestId: validatedInput.clientRequestId,
        ownerHash: identity.ownerHash,
        replayProof,
      }).catch(() => ({ status: "not_found" as const }));
      if (recovered.status === "ready") {
        return shareJsonResponse(
          {
            status: "ready",
            url: buildBelgeShareUrl(recovered.tokens.viewToken),
            viewToken: recovered.tokens.viewToken,
            manageToken: recovered.tokens.manageToken,
            expiresAt: recovered.record.expiresAt.toISOString(),
            documentId: recovered.record.documentId,
          },
          200,
          requestCorrelationId,
        );
      }
      if (uploadState === "present") {
        try {
          await getBelgeBlobStore().del(record.blobPathname);
          if (record.environmentKey) await getBelgePaylasimRepository().markBlobDeleted(record.environmentKey, record.blobPathname);
        } catch {
          // Keep the physical-byte obligation for cleanup/reconciliation.
        }
      }
      throw innerError;
    }
  } catch (error) {
    if (error instanceof BelgeShareRuntimeError) {
      logShareRequestFailure(requestCorrelationId, "runtime", startedAt);
      return shareErrorResponse(error.code, error.message, error.statusCode, requestCorrelationId);
    }

    if (error instanceof RequestValidationError) {
      return shareErrorResponse(error.code, error.message, error.statusCode, requestCorrelationId);
    }

    if (error instanceof BelgeShareQuotaError) {
      const extra: Record<string, string> = {};
      if (error.retryAfterSeconds) extra["Retry-After"] = String(error.retryAfterSeconds);
      const quotaFields = error.quota ? {
        used: error.quota.usedLinks,
        reserved: error.quota.reservedLinks,
        remaining: Math.max(0, BELGE_SHARE_CONFIG.DAILY_BROWSER_LINK_LIMIT - error.quota.usedLinks - error.quota.reservedLinks),
        quotaDay: error.quota.quotaDay,
        serverNow: error.quota.serverNow.toISOString(),
        resetAt: error.quota.resetAt.toISOString(),
      } : {};
      return shareJsonResponse(
        {
          code: error.code,
          message: error.message,
          requestCorrelationId,
          ...quotaFields,
        },
        error.statusCode,
        requestCorrelationId,
        extra,
      );
    }

    if (error instanceof BelgeShareServiceError) {
      if (error.statusCode >= 500) logShareRequestFailure(requestCorrelationId, "service", startedAt);
      return shareErrorResponse(error.code, error.message, error.statusCode, requestCorrelationId);
    }

    if (error instanceof ServerPdfRenderError) {
      logShareRequestFailure(requestCorrelationId, "render", startedAt);
      return shareErrorResponse(error.code, error.message, error.statusCode, requestCorrelationId);
    }

    if (error instanceof PublicSiteOriginError) {
      logShareRequestFailure(requestCorrelationId, "runtime", startedAt);
      return shareErrorResponse("CANONICAL_ORIGIN_UNAVAILABLE", "Belge paylaşım adresi şu anda kullanılamıyor.", 503, requestCorrelationId);
    }

    logShareRequestFailure(requestCorrelationId, "unexpected", startedAt);
    return shareErrorResponse("INTERNAL_SERVER_ERROR", "Paylaşım bağlantısı oluşturulurken bir hata meydana geldi.", 500, requestCorrelationId);
  }
}

export function GET() {
  return shareMethodNotAllowed("POST, OPTIONS", createRequestCorrelationId());
}

export function PUT() {
  return shareMethodNotAllowed("POST, OPTIONS", createRequestCorrelationId());
}

export function PATCH() {
  return shareMethodNotAllowed("POST, OPTIONS", createRequestCorrelationId());
}

export function DELETE() {
  return shareMethodNotAllowed("POST, OPTIONS", createRequestCorrelationId());
}

export function HEAD() {
  return shareMethodNotAllowed("POST, OPTIONS", createRequestCorrelationId(), true);
}

export function OPTIONS() {
  return shareOptionsResponse("POST, OPTIONS", createRequestCorrelationId());
}
