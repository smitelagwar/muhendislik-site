// ============================================================================
// POST /api/dokumantasyon/folders — YENİ KLASÖR OLUŞTURMA
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import { createFolderSchema } from "@/lib/dokumantasyon/validation";
import { createFolder } from "@/lib/dokumantasyon/folders";

export async function POST(request: Request) {
  try {
    await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);

    const body = await request.json().catch(() => ({}));
    const parseResult = createFolderSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Geçersiz veri." },
        { status: 400 }
      );
    }

    const { name, parentId } = parseResult.data;
    const folder = await createFolder(name, parentId || null);

    return NextResponse.json({ success: true, folder });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    console.error("Klasör oluşturma hatası:", err);
    return NextResponse.json(
      { error: "Klasör oluşturulurken bir hata oluştu." },
      { status: 500 }
    );
  }
}
