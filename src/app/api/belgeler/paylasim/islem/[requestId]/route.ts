import { BelgeShareRuntimeError } from "@/lib/belge-paylasim/config";
import { getBrowserIdentity } from "@/lib/belge-paylasim/browser-identity";
import { getShareOperationStatus } from "@/lib/belge-paylasim/service-core";
import { RequestValidationError, validateSameOrigin } from "@/lib/belge-paylasim/request-validation";
import { isValidReplayProof } from "@/lib/belge-paylasim/tokens";
import { buildBelgeShareUrl, PublicSiteOriginError } from "@/lib/site-config";
import {
  createRequestCorrelationId,
  logShareRequestFailure,
  shareErrorResponse,
  shareJsonResponse,
  shareMethodNotAllowed,
  shareOptionsResponse,
} from "@/lib/belge-paylasim/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOW = "GET, OPTIONS";

interface RouteParams {
  params: Promise<{ requestId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const requestCorrelationId = createRequestCorrelationId();
  const startedAt = performance.now();
  try {
    // Browser same-origin GET requests may legitimately omit Origin.
    // Still reject cross-site Fetch Metadata, an explicit null/foreign Origin,
    // and any Host/URL mismatch. Mutating endpoints remain strict.
    validateSameOrigin(request, { allowMissingOrigin: true });
    const { requestId } = await params;
    const identity = getBrowserIdentity(request);
    const replayProof = request.headers.get("x-belge-share-replay-proof");
    if (!identity || !isValidReplayProof(replayProof)) {
      return shareErrorResponse("OPERATION_NOT_FOUND", "İşlem bulunamadı.", 404, requestCorrelationId);
    }

    const operation = await getShareOperationStatus({
      clientRequestId: requestId,
      ownerHash: identity.ownerHash,
      replayProof,
    });
    if (operation.status === "not_found") {
      return shareErrorResponse("OPERATION_NOT_FOUND", "İşlem bulunamadı.", 404, requestCorrelationId);
    }
    if (operation.status === "pending") {
      return shareJsonResponse({ status: "pending", requestId }, 202, requestCorrelationId, { "Retry-After": "2" });
    }
    if (operation.status === "failed") {
      return shareErrorResponse("CREATE_FAILED", "Bağlantı oluşturulamadı. Güvenli biçimde yeniden deneyin.", 409, requestCorrelationId);
    }
    if (operation.status === "terminal") {
      return shareErrorResponse("OPERATION_EXPIRED", "İşlem artık kullanılamıyor.", 410, requestCorrelationId);
    }

    return shareJsonResponse({
      status: "ready",
      url: buildBelgeShareUrl(operation.tokens.viewToken),
      viewToken: operation.tokens.viewToken,
      manageToken: operation.tokens.manageToken,
      expiresAt: operation.record.expiresAt.toISOString(),
      documentId: operation.record.documentId,
    }, 200, requestCorrelationId);
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return shareErrorResponse(error.code, error.message, error.statusCode, requestCorrelationId);
    }
    if (error instanceof BelgeShareRuntimeError) {
      logShareRequestFailure(requestCorrelationId, "runtime", startedAt);
      return shareErrorResponse(error.code, error.message, error.statusCode, requestCorrelationId);
    }
    if (error instanceof PublicSiteOriginError) {
      logShareRequestFailure(requestCorrelationId, "runtime", startedAt);
      return shareErrorResponse("CANONICAL_ORIGIN_UNAVAILABLE", "Belge paylaşım adresi şu anda kullanılamıyor.", 503, requestCorrelationId);
    }
    logShareRequestFailure(requestCorrelationId, "unexpected", startedAt);
    return shareErrorResponse("INTERNAL_SERVER_ERROR", "İşlem durumu alınırken bir sunucu hatası oluştu.", 500, requestCorrelationId);
  }
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

export function DELETE() {
  return shareMethodNotAllowed(ALLOW, createRequestCorrelationId());
}

export function HEAD() {
  return shareMethodNotAllowed(ALLOW, createRequestCorrelationId(), true);
}

export function OPTIONS() {
  return shareOptionsResponse(ALLOW, createRequestCorrelationId());
}
