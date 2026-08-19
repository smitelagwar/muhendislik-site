// ============================================================================
// POST /api/dokumantasyon/shares/[id]/revoke — PAYLAŞIM LİNKİNİ İPTAL ETME
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import { revokeShareLink } from "@/lib/dokumantasyon/shares";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);

    const { id } = await params;
    await revokeShareLink(id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    console.error("Link iptal hatası:", err);
    return NextResponse.json(
      { error: "Link iptal edilirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
