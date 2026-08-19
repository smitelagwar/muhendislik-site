// ============================================================================
// DELETE /api/dokumantasyon/trash/folders/[id] — KLASÖRÜ KALICI SİLME
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import { permanentDeleteFolder } from "@/lib/dokumantasyon/folders";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);

    const { id } = await params;
    const result = await permanentDeleteFolder(id);

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    console.error("Klasör kalıcı silme hatası:", err);
    return NextResponse.json(
      { error: "Klasör kalıcı olarak silinirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
