// ============================================================================
// GET /api/belgeler/paylasim/[token]/pdf — YETKİLİ VE SALT-OKUNUR PDF AKIŞI
// ============================================================================

import { NextResponse } from "next/server";
import { BelgeShareRuntimeError } from "@/lib/belge-paylasim/config";
import { getBelgeBlobStore } from "@/lib/belge-paylasim/blob-store";
import { createRequestCorrelationId, logShareRequestFailure, shareErrorResponse, shareMethodNotAllowed, shareOptionsResponse, shareResponseHeaders } from "@/lib/belge-paylasim/http";
import { getShareByViewToken } from "@/lib/belge-paylasim/service-core";
import { isValidShareToken } from "@/lib/belge-paylasim/tokens";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOW = "GET, HEAD, OPTIONS";
const PDF_HEADERS = {
  "Content-Type": "application/pdf",
  "Content-Disposition": 'inline; filename="paylasilan-belge.pdf"',
};

interface RouteParams {
  params: Promise<{ token: string }>;
}

async function resolveReadyShare(
  params: RouteParams,
  requestCorrelationId: string,
): Promise<{ record: Extract<Awaited<ReturnType<typeof getShareByViewToken>>, { status: "ok" }>['record'] } | Response> {
  const { token } = await params.params;
  if (!isValidShareToken(token)) {
    return shareErrorResponse("INVALID_TOKEN", "Geçersiz bağlantı belirteci.", 400, requestCorrelationId);
  }

  const result = await getShareByViewToken(token);
  if (result.status === "not_found") {
    return shareErrorResponse("NOT_FOUND", "Belge bağlantısı bulunamadı.", 404, requestCorrelationId);
  }
  if (result.status === "revoked") {
    return shareErrorResponse("LINK_REVOKED", "Bu paylaşım bağlantısı iptal edilmiştir.", 410, requestCorrelationId);
  }
  if (result.status === "expired") {
    return shareErrorResponse("LINK_EXPIRED", "Bu paylaşım bağlantısının geçerlilik süresi dolmuştur.", 410, requestCorrelationId);
  }
  if (result.status === "not_ready") {
    return shareErrorResponse("LINK_NOT_READY", "Belge hazırlanıyor, lütfen birazdan tekrar deneyin.", 425, requestCorrelationId, { "Retry-After": "2" });
  }
  return { record: result.record };
}

function isErrorResponse(value: unknown): value is Response {
  return value instanceof Response;
}

function getPdfHeaders(requestCorrelationId: string, sizeBytes?: number): Headers {
  const headers = shareResponseHeaders(requestCorrelationId, PDF_HEADERS);
  if (sizeBytes !== undefined) headers.set("Content-Length", String(sizeBytes));
  return headers;
}

export async function GET(_request: Request, params: RouteParams) {
  const requestCorrelationId = createRequestCorrelationId();
  const startedAt = performance.now();
  try {
    const resolved = await resolveReadyShare(params, requestCorrelationId);
    if (isErrorResponse(resolved)) return resolved;

    const blobResponse = await getBelgeBlobStore().get(resolved.record.blobPathname);
    if (!blobResponse?.ok || !blobResponse.body) {
      return shareErrorResponse("PDF_STORAGE_UNAVAILABLE", "Belge dosyası şu anda alınamıyor.", 502, requestCorrelationId);
    }

    return new NextResponse(blobResponse.body, {
      status: 200,
      headers: getPdfHeaders(requestCorrelationId, resolved.record.sizeBytes ?? undefined),
    });
  } catch (error) {
    if (error instanceof BelgeShareRuntimeError) {
      logShareRequestFailure(requestCorrelationId, "runtime", startedAt);
      return shareErrorResponse(error.code, error.message, error.statusCode, requestCorrelationId);
    }
    logShareRequestFailure(requestCorrelationId, "storage", startedAt);
    return shareErrorResponse("PDF_STORAGE_UNAVAILABLE", "Belge dosyası şu anda alınamıyor.", 502, requestCorrelationId);
  }
}

/** Metadata and lifecycle check only; HEAD must never open or stream the Blob. */
export async function HEAD(_request: Request, params: RouteParams) {
  const requestCorrelationId = createRequestCorrelationId();
  const startedAt = performance.now();
  try {
    const resolved = await resolveReadyShare(params, requestCorrelationId);
    if (isErrorResponse(resolved)) {
      return new Response(null, {
        status: resolved.status,
        headers: resolved.headers,
      });
    }
    return new Response(null, {
      status: 200,
      headers: getPdfHeaders(requestCorrelationId, resolved.record.sizeBytes ?? undefined),
    });
  } catch (error) {
    if (error instanceof BelgeShareRuntimeError) {
      logShareRequestFailure(requestCorrelationId, "runtime", startedAt);
      const response = shareErrorResponse(error.code, error.message, error.statusCode, requestCorrelationId);
      return new Response(null, { status: response.status, headers: response.headers });
    }
    logShareRequestFailure(requestCorrelationId, "service", startedAt);
    const response = shareErrorResponse("DATABASE_UNAVAILABLE", "Belge bağlantısı şu anda doğrulanamıyor.", 503, requestCorrelationId);
    return new Response(null, { status: response.status, headers: response.headers });
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

export function OPTIONS() {
  return shareOptionsResponse(ALLOW, createRequestCorrelationId());
}
