// ============================================================================
// GET /api/dokumantasyon/trash — ÇÖP KUTUSU LİSTESİ
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { getTrashItems } from "@/lib/dokumantasyon/trash";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDokumantasyonAdmin();

    const items = await getTrashItems();

    return NextResponse.json(
      { items },
      {
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    console.error("Çöp kutusu listeleme hatası:", err);
    return NextResponse.json(
      { error: "Çöp kutusu listelenirken bir hata oluştu." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
