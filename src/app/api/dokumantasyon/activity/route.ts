// ============================================================================
// GET /api/dokumantasyon/activity — SON ANLAMLI YÖNETİM OLAYLARI
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { getRecentDokActivity } from "@/lib/dokumantasyon/activity";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDokumantasyonAdmin();
    const events = await getRecentDokActivity();
    return NextResponse.json({ events }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    console.error("Etkinlik kaydı okunamadı:", error);
    return NextResponse.json({ error: "Etkinlik kaydı okunamadı." }, { status: 500 });
  }
}
