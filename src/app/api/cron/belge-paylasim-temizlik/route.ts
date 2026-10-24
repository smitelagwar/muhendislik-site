// ============================================================================
// BELGE PAYLAŞIM — GÜNLÜK OTOMATİK TEMİZLİK CRON ROTASI
// ============================================================================

import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { BelgeShareRuntimeError } from "@/lib/belge-paylasim/config";
import { executeBelgePaylasimCleanup } from "@/lib/belge-paylasim/cleanup";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request, expectedSecret: string): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.slice(7).trim();
  const tokenBuffer = Buffer.from(token, "utf8");
  const secretBuffer = Buffer.from(expectedSecret, "utf8");

  if (tokenBuffer.length !== secretBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(tokenBuffer, secretBuffer);
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim() || null;

  // Fail-closed: Secret tanımlı değilse asla yetki verme (401)
  if (!cronSecret) {
    return NextResponse.json(
      { error: "Yetkisiz erişim: CRON_SECRET ortam değişkeni yapılandırılmamış." },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, private",
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Yetki doğrulama: Authorization: Bearer <CRON_SECRET>
  if (!isAuthorized(request, cronSecret)) {
    return NextResponse.json(
      { error: "Yetkisiz erişim: Geçersiz yetkilendirme anahtarı." },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, private",
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    const stats = await executeBelgePaylasimCleanup();
    const status = stats.success ? 200 : stats.alreadyRunning ? 409 : 503;

    return NextResponse.json(
      {
        success: stats.success,
        outcome: stats.outcome,
        message: stats.success
          ? "Belge paylaşım temizliği tamamlandı."
          : stats.alreadyRunning
            ? "Başka bir temizlik çalışması sürüyor. Sonraki cron kalıcı checkpoint'ten devam eder."
            : "Temizlik kısmi kaldı veya hata aldı; güvenli checkpoint ve retry kuyruğu korundu.",
        stats,
      },
      {
        status,
        headers: {
          "Cache-Control": "no-store, private",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    if (error instanceof BelgeShareRuntimeError) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message },
        {
          status: error.statusCode,
          headers: { "Cache-Control": "no-store, private", "Content-Type": "application/json" },
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        outcome: "failed",
        error: "CLEANUP_FAILED",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, private",
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: "Yalnızca GET yöntemi desteklenir." },
    { status: 405, headers: { Allow: "GET", "Cache-Control": "no-store, private" } }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Yalnızca GET yöntemi desteklenir." },
    { status: 405, headers: { Allow: "GET", "Cache-Control": "no-store, private" } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Yalnızca GET yöntemi desteklenir." },
    { status: 405, headers: { Allow: "GET", "Cache-Control": "no-store, private" } }
  );
}
