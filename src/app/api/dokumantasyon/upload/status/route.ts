// ============================================================================
// GET /api/dokumantasyon/upload/status — METADATA DOĞRULAMA DURUMU
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { getFileByBlobPathname } from "@/lib/dokumantasyon/files";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireDokumantasyonAdmin();
    const pathname = new URL(request.url).searchParams.get("pathname");

    if (!pathname || !pathname.startsWith("dok_storage/")) {
      return NextResponse.json({ error: "Geçersiz yükleme yolu." }, { status: 400 });
    }

    const file = await getFileByBlobPathname(pathname);
    return NextResponse.json(
      { finalized: Boolean(file), file: file ? { id: file.id } : null },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    console.error("Upload metadata durum kontrolü hatası:", err);
    return NextResponse.json({ error: "Yükleme kaydı doğrulanamadı." }, { status: 500 });
  }
}
