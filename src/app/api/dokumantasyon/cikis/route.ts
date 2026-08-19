// ============================================================================
// POST /api/dokumantasyon/cikis — ADMIN ÇIKIŞ ENDPOINT
// ============================================================================

import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/dokumantasyon/auth";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";

export async function POST(request: Request) {
  try {
    assertSameOriginForMutation(request);
    await clearSessionCookie();

    return NextResponse.json(
      { success: true },
      {
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch (err) {
    console.error("Çıkış API hatası:", err);
    return NextResponse.json(
      { error: "Çıkış işlemi sırasında bir hata oluştu." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
