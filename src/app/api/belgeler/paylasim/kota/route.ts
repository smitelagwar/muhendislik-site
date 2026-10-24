import { NextResponse } from "next/server";
import { BelgeShareRuntimeError } from "@/lib/belge-paylasim/config";
import {
  bootstrapBrowserIdentity,
  getBrowserIdentity,
  serializeBrowserIdentityCookie,
} from "@/lib/belge-paylasim/browser-identity";
import { getBelgePaylasimRepository } from "@/lib/belge-paylasim/repository";
import { RequestValidationError, validateSameOrigin } from "@/lib/belge-paylasim/request-validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SECURITY_HEADERS: Record<string, string> = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

export async function POST(request: Request) {
  try {
    validateSameOrigin(request);
    const now = new Date();
    const bootstrap = bootstrapBrowserIdentity(request, now);
    const headers = new Headers(SECURITY_HEADERS);
    if (bootstrap.cookieValue && bootstrap.expiresAt) {
      headers.set("Set-Cookie", serializeBrowserIdentityCookie(bootstrap.cookieValue, bootstrap.expiresAt, request, now));
    }
    return NextResponse.json(
      { status: `cookie_${bootstrap.status}` },
      { status: 200, headers }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: Request) {
  try {
    validateSameOrigin(request, { allowMissingOrigin: true });
    const now = new Date();
    const identity = getBrowserIdentity(request, now);
    if (!identity) {
      return NextResponse.json(
        { error: "BROWSER_ID_REQUIRED", message: "Tarayıcı kimliği doğrulanmadı; yeniden deneyin." },
        { status: 428, headers: SECURITY_HEADERS }
      );
    }

    // Repository SELECT'i zorunludur. Olmayan bucket yalnız SELECT sonucu boşsa sıfırdır.
    const quota = await getBelgePaylasimRepository().getDailyQuota(
      identity.environmentKey,
      identity.ownerHash
    );
    if (
      !Number.isSafeInteger(quota.usedLinks) || quota.usedLinks < 0 ||
      !Number.isSafeInteger(quota.reservedLinks) || quota.reservedLinks < 0 ||
      !Number.isFinite(quota.serverNow.getTime()) || !Number.isFinite(quota.resetAt.getTime()) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(quota.quotaDay)
    ) {
      return NextResponse.json(
        { error: "QUOTA_STATE_UNAVAILABLE", message: "Günlük kota bilgisi şu anda okunamıyor." },
        { status: 503, headers: SECURITY_HEADERS }
      );
    }
    return NextResponse.json(
      {
        status: "ready",
        quota: {
          limit: 50,
          used: quota.usedLinks,
          reserved: quota.reservedLinks,
          remaining: Math.max(0, 50 - quota.usedLinks - quota.reservedLinks),
          quotaDay: quota.quotaDay,
          serverNow: quota.serverNow.toISOString(),
          resetAt: quota.resetAt.toISOString(),
          timeZone: "Europe/Istanbul",
        },
      },
      { status: 200, headers: SECURITY_HEADERS }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

function errorResponse(error: unknown): Response {
  if (error instanceof BelgeShareRuntimeError) {
    return NextResponse.json(
      { error: error.code, message: error.message },
      { status: error.statusCode, headers: SECURITY_HEADERS }
    );
  }
  if (error instanceof RequestValidationError) {
    return NextResponse.json(
      { error: error.code, message: error.message },
      { status: error.statusCode, headers: SECURITY_HEADERS }
    );
  }
  return NextResponse.json(
    { error: "QUOTA_STATE_UNAVAILABLE", message: "Günlük kota bilgisi şu anda okunamıyor." },
    { status: 503, headers: SECURITY_HEADERS }
  );
}
