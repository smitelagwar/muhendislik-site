import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export const SHARE_SECURITY_HEADERS: Record<string, string> = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

export function createRequestCorrelationId(): string {
  return randomUUID();
}

export function shareResponseHeaders(
  requestCorrelationId: string,
  extra: HeadersInit = {},
): Headers {
  const headers = new Headers(SHARE_SECURITY_HEADERS);
  headers.set("X-Request-Correlation-Id", requestCorrelationId);
  new Headers(extra).forEach((value, key) => headers.set(key, value));
  return headers;
}

export function shareJsonResponse(
  body: Record<string, unknown>,
  status: number,
  requestCorrelationId: string,
  extraHeaders: HeadersInit = {},
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: shareResponseHeaders(requestCorrelationId, extraHeaders),
  });
}

export function shareErrorResponse(
  code: string,
  message: string,
  status: number,
  requestCorrelationId: string,
  extraHeaders: HeadersInit = {},
): NextResponse {
  return shareJsonResponse({ code, message, requestCorrelationId }, status, requestCorrelationId, extraHeaders);
}

export function shareMethodNotAllowed(
  allow: string,
  requestCorrelationId: string,
  head = false,
): Response {
  const headers = shareResponseHeaders(requestCorrelationId, { Allow: allow });
  if (head) {
    headers.set("Content-Type", "application/json; charset=utf-8");
    return new Response(null, { status: 405, headers });
  }
  return shareErrorResponse("METHOD_NOT_ALLOWED", "Bu HTTP yöntemi desteklenmiyor.", 405, requestCorrelationId, { Allow: allow });
}

export function shareOptionsResponse(allow: string, requestCorrelationId: string): Response {
  return new Response(null, {
    status: 204,
    headers: shareResponseHeaders(requestCorrelationId, { Allow: allow }),
  });
}

/** Logs only a fixed category, duration and correlation id; never an Error or request value. */
export function logShareRequestFailure(
  requestCorrelationId: string,
  category: "runtime" | "service" | "render" | "storage" | "unexpected",
  startedAt: number,
): void {
  console.error("belge_share_request_failed", {
    category,
    durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
    requestCorrelationId,
  });
}
