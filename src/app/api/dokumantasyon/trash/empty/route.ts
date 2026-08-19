// ============================================================================
// POST /api/dokumantasyon/trash/empty — ÇÖP KUTUSUNU BOŞALTMA
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import { emptyTrash } from "@/lib/dokumantasyon/trash";

export async function POST(request: Request) {
  try {
    await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);

    const result = await emptyTrash();

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    console.error("Çöp kutusu boşaltma hatası:", err);
    return NextResponse.json(
      { error: "Çöp kutusu boşaltılırken bir hata oluştu." },
      { status: 500 }
    );
  }
}
