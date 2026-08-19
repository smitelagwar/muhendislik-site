// ============================================================================
// DELETE /api/dokumantasyon/trash/files/[id] — DOSYAYI KALICI SİLME
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import { permanentDeleteFile } from "@/lib/dokumantasyon/files";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);

    const { id } = await params;
    await permanentDeleteFile(id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    console.error("Dosya kalıcı silme hatası:", err);
    return NextResponse.json(
      { error: "Dosya kalıcı olarak silinirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
