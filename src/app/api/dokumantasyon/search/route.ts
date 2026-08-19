// ============================================================================
// GET /api/dokumantasyon/search — DOSYA VE KLASÖR ARAMA
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { searchItems } from "@/lib/dokumantasyon/search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireDokumantasyonAdmin();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const results = await searchItems(query);

    return NextResponse.json(
      { success: true, ...results },
      {
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    console.error("Arama hatası:", err);
    return NextResponse.json(
      { error: "Arama yapılırken bir hata oluştu." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
