// ============================================================================
// DELETE /api/belgeler/paylasim/[token] — GÜVENLİ PAYLAŞIM BAĞLANTISINI İPTAL ETME
// ============================================================================

import { NextResponse } from "next/server";
import { getBelgePaylasimRepository } from "@/lib/belge-paylasim/repository";
import {
  BelgeShareServiceError,
  revokeShareByManageToken,
} from "@/lib/belge-paylasim/service-core";
import { constantTimeCompare, sha256Hex } from "@/lib/belge-paylasim/tokens";

export const dynamic = "force-dynamic";

const SECURITY_HEADERS: Record<string, string> = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { token: viewToken } = await params;

    if (!viewToken || !viewToken.trim()) {
      return NextResponse.json(
        { error: "INVALID_TOKEN", message: "Geçersiz veya boş bağlantı belirteci." },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    // 1. Yönetim anahtarı başlığını kontrol et
    const manageToken =
      request.headers.get("x-manage-token") ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      "";

    if (!manageToken.trim()) {
      return NextResponse.json(
        {
          error: "MISSING_MANAGE_TOKEN",
          message: "Bağlantıyı iptal etmek için yönetim anahtarı (x-manage-token) zorunludur.",
        },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    // 2. viewToken ile kaydı bul
    const repo = getBelgePaylasimRepository();
    const tokenHash = sha256Hex(viewToken.trim());
    const record = await repo.findByTokenHash(tokenHash);

    if (!record) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "İptal edilecek bağlantı bulunamadı." },
        { status: 404, headers: SECURITY_HEADERS }
      );
    }

    // 3. Yönetim anahtarının bu kayda ait olduğunu sabit süreli (constant-time) doğrula
    const candidateManageTokenHash = sha256Hex(manageToken.trim());
    if (!constantTimeCompare(record.manageTokenHash, candidateManageTokenHash)) {
      return NextResponse.json(
        {
          error: "FORBIDDEN",
          message: "Bu bağlantıyı iptal etme yetkiniz bulunmamaktadır.",
        },
        { status: 403, headers: SECURITY_HEADERS }
      );
    }

    // 4. Bağlantı zaten iptal edilmişse idempotent 200 dön
    if (record.status === "revoked" || record.revokedAt) {
      return NextResponse.json(
        {
          status: "revoked",
          revokedAt: record.revokedAt ? record.revokedAt.toISOString() : new Date().toISOString(),
        },
        { status: 200, headers: SECURITY_HEADERS }
      );
    }

    // 5. İptal işlemini çekirdek servisle yürüt (Önce DB'de revoked -> ardından Blob del)
    const revokedRecord = await revokeShareByManageToken(manageToken.trim());

    return NextResponse.json(
      {
        status: "revoked",
        revokedAt: revokedRecord.revokedAt ? revokedRecord.revokedAt.toISOString() : new Date().toISOString(),
      },
      { status: 200, headers: SECURITY_HEADERS }
    );
  } catch (error) {
    if (error instanceof BelgeShareServiceError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode, headers: SECURITY_HEADERS }
      );
    }

    console.error("Bağlantı iptal edilirken beklenmeyen hata:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Bağlantı iptal edilirken bir sunucu hatası oluştu.",
      },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}

export async function GET() {
  return new NextResponse(null, {
    status: 405,
    headers: { Allow: "DELETE", ...SECURITY_HEADERS },
  });
}
