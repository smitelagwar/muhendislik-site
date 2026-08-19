// ============================================================================
// POST /api/dokumantasyon/files/[id]/restore — DOSYA GERİ YÜKLEME
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import { restoreFile } from "@/lib/dokumantasyon/files";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);

    const { id } = await params;
    await restoreFile(id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    console.error("Dosya geri yükleme hatası:", err);
    return NextResponse.json(
      { error: "Dosya geri yüklenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
