// ============================================================================
// POST /api/dokumantasyon/public/verify-password — ŞİFRE DOĞRULAMA
// ============================================================================

import { NextResponse } from "next/server";
import { getPublicShareInfo, createShareAccessJwt } from "@/lib/dokumantasyon/public-share";
import { verifyPassword } from "@/lib/dokumantasyon/security";
import { checkRateLimit } from "@/lib/dokumantasyon/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const isAllowed = await checkRateLimit(ip, "public_share_auth", 10, 15 * 60);
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Çok fazla deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawToken = body.rawToken || body.token;
    const password = body.password;

    if (!rawToken || !password) {
      return NextResponse.json(
        { error: "Bağlantı tokenı ve şifre gereklidir." },
        { status: 400 }
      );
    }

    const shareInfo = await getPublicShareInfo(rawToken);
    if (shareInfo.status !== "ok" || !shareInfo.link) {
      return NextResponse.json(
        { error: shareInfo.errorMessage || "Geçersiz veya süresi dolmuş bağlantı." },
        { status: 400 }
      );
    }

    if (!shareInfo.link.password_hash) {
      const accessJwt = await createShareAccessJwt(shareInfo.link.id);
      return NextResponse.json({ success: true, accessToken: accessJwt });
    }

    const isValid = await verifyPassword(password, shareInfo.link.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: "Girilen şifre hatalı." }, { status: 401 });
    }

    const accessJwt = await createShareAccessJwt(shareInfo.link.id);

    const response = NextResponse.json({ success: true, accessToken: accessJwt });
    response.cookies.set(`dok_share_${shareInfo.link.id}`, accessJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 6 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Şifre doğrulama hatası:", err);
    return NextResponse.json(
      { error: "Şifre doğrulanırken bir hata oluştu." },
      { status: 500 }
    );
  }
}
