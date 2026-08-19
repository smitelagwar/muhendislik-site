// ============================================================================
// POST /api/dokumantasyon/giris — ADMIN GİRİŞ ENDPOINT
// ============================================================================

import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/dokumantasyon/validation";
import {
  validateAdminCredentials,
  createDokumantasyonSessionToken,
  setSessionCookie,
} from "@/lib/dokumantasyon/auth";
import { DokAuthConfigError, validateDokAuthConfig } from "@/lib/dokumantasyon/auth-config";
import { checkRateLimit, recordAuthAttempt } from "@/lib/dokumantasyon/rate-limit";
import { extractClientIp } from "@/lib/dokumantasyon/security";
import { DOKUMANTASYON_CONFIG } from "@/lib/dokumantasyon/config";

export async function POST(request: Request) {
  try {
    const authConfig = await validateDokAuthConfig();
    const ip = extractClientIp(request);

    // 1. Rate limit kontrolü
    const rateLimit = await checkRateLimit(
      "admin_login",
      ip,
      DOKUMANTASYON_CONFIG.RATE_LIMIT.LOGIN_MAX_FAILED_ATTEMPTS,
      DOKUMANTASYON_CONFIG.RATE_LIMIT.LOGIN_WINDOW_SECONDS
    );

    if (!rateLimit.allowed) {
      const minutes = Math.ceil(rateLimit.retryAfterSeconds / 60);
      return NextResponse.json(
        {
          error: `Çok fazla hatalı giriş denemesi. Lütfen ${minutes} dakika sonra tekrar deneyin.`,
          retryAfter: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
            "Cache-Control": "private, no-store",
          },
        }
      );
    }

    // 2. İstek gövdesi doğrulama
    const body = await request.json().catch(() => ({}));
    const parseResult = loginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Kullanıcı adı veya şifre hatalı." },
        { status: 400, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const { username, password } = parseResult.data;

    // 3. Kimlik doğrulama
    const isValid = await validateAdminCredentials(username, password, authConfig);

    if (!isValid) {
      await recordAuthAttempt("admin_login", ip, false);
      return NextResponse.json(
        { error: "Kullanıcı adı veya şifre hatalı." },
        { status: 401, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    // 4. Başarılı giriş
    await recordAuthAttempt("admin_login", ip, true);
    const token = await createDokumantasyonSessionToken(username);
    await setSessionCookie(token);

    return NextResponse.json(
      {
        success: true,
        user: { username },
      },
      {
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch (err) {
    if (err instanceof DokAuthConfigError) {
      console.error(err.code);
      return NextResponse.json(
        { error: "Yönetici giriş sistemi geçici olarak hazır değil. Lütfen daha sonra tekrar deneyin." },
        { status: 503, headers: { "Cache-Control": "private, no-store" } }
      );
    }
    console.error("Giriş API hatası:", err);
    return NextResponse.json(
      { error: "Giriş işlemi sırasında bir hata oluştu." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
