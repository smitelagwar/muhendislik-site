// ============================================================================
// DELETE /api/belgeler/paylasim/[token] — GÜVENLİ PAYLAŞIM BAĞLANTISINI İPTAL ETME
// ============================================================================

import { BelgeShareRuntimeError } from "@/lib/belge-paylasim/config";
import { getBelgePaylasimRepository } from "@/lib/belge-paylasim/repository";
import { BelgeShareServiceError, revokeShareByManageToken } from "@/lib/belge-paylasim/service-core";
import {
  createRequestCorrelationId,
  logShareRequestFailure,
  shareErrorResponse,
  shareJsonResponse,
  shareMethodNotAllowed,
  shareOptionsResponse,
} from "@/lib/belge-paylasim/http";
import { constantTimeCompare, isValidShareToken, sha256Hex } from "@/lib/belge-paylasim/tokens";
import { validateSameOrigin } from "@/lib/belge-paylasim/request-validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOW = "DELETE, OPTIONS";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const requestCorrelationId = createRequestCorrelationId();
  const startedAt = performance.now();
  try {
    validateSameOrigin(request);
    const { token: viewToken } = await params;
    if (!isValidShareToken(viewToken)) {
      return shareErrorResponse("INVALID_TOKEN", "Geçersiz bağlantı belirteci.", 400, requestCorrelationId);
    }

    const authorization = request.headers.get("authorization");
    const manageToken = request.headers.get("x-manage-token") ??
      (authorization?.match(/^Bearer ([A-Za-z0-9_-]+)$/i)?.[1] ?? "");
    if (!manageToken) {
      return shareErrorResponse("MISSING_MANAGE_TOKEN", "Bağlantıyı iptal etmek için yönetim anahtarı zorunludur.", 400, requestCorrelationId);
    }
    if (!isValidShareToken(manageToken)) {
      return shareErrorResponse("INVALID_MANAGE_TOKEN", "Geçerli bir yönetim anahtarı zorunludur.", 400, requestCorrelationId);
    }

    const repository = getBelgePaylasimRepository();
    const record = await repository.findByTokenHash(sha256Hex(viewToken));
    if (!record) {
      return shareErrorResponse("NOT_FOUND", "İptal edilecek bağlantı bulunamadı.", 404, requestCorrelationId);
    }

    const candidateManageTokenHash = sha256Hex(manageToken);
    if (!constantTimeCompare(record.manageTokenHash, candidateManageTokenHash)) {
      return shareErrorResponse("FORBIDDEN", "Bu bağlantıyı iptal etme yetkiniz bulunmamaktadır.", 403, requestCorrelationId);
    }

    if (record.status === "revoked" || record.revokedAt) {
      return shareJsonResponse({
        status: "revoked",
        revokedAt: record.revokedAt?.toISOString() ?? new Date().toISOString(),
      }, 200, requestCorrelationId);
    }

    const revokedRecord = await revokeShareByManageToken(manageToken);
    return shareJsonResponse({
      status: "revoked",
      revokedAt: revokedRecord.revokedAt?.toISOString() ?? new Date().toISOString(),
    }, 200, requestCorrelationId);
  } catch (error) {
    if (error instanceof BelgeShareRuntimeError) {
      logShareRequestFailure(requestCorrelationId, "runtime", startedAt);
      return shareErrorResponse(error.code, error.message, error.statusCode, requestCorrelationId);
    }
    if (error instanceof BelgeShareServiceError) {
      if (error.statusCode >= 500) logShareRequestFailure(requestCorrelationId, "service", startedAt);
      return shareErrorResponse(error.code, error.message, error.statusCode, requestCorrelationId);
    }
    logShareRequestFailure(requestCorrelationId, "unexpected", startedAt);
    return shareErrorResponse("INTERNAL_SERVER_ERROR", "Bağlantı iptal edilirken bir sunucu hatası oluştu.", 500, requestCorrelationId);
  }
}

export function GET() {
  return shareMethodNotAllowed(ALLOW, createRequestCorrelationId());
}

export function POST() {
  return shareMethodNotAllowed(ALLOW, createRequestCorrelationId());
}

export function PUT() {
  return shareMethodNotAllowed(ALLOW, createRequestCorrelationId());
}

export function PATCH() {
  return shareMethodNotAllowed(ALLOW, createRequestCorrelationId());
}

export function HEAD() {
  return shareMethodNotAllowed(ALLOW, createRequestCorrelationId(), true);
}

export function OPTIONS() {
  return shareOptionsResponse(ALLOW, createRequestCorrelationId());
}
