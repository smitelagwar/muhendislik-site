// ============================================================================
// GET /api/dokumantasyon/auth/session — SESSION KONTROL ENDPOINT
// ============================================================================

import { NextResponse } from "next/server";
import { getDokumantasyonSession } from "@/lib/dokumantasyon/auth";

export async function GET() {
  try {
    const session = await getDokumantasyonSession();

    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { headers: { "Cache-Control": "private, no-store" } }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          username: session.username,
        },
      },
      {
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch (err) {
    console.error("Session kontrol hatası:", err);
    return NextResponse.json(
      { authenticated: false },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
