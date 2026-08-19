// ============================================================================
// GET /api/dokumantasyon/files/[id]/access — ADMIN DOSYA ERİŞİM VE SIGNED URL
// ============================================================================

import { NextResponse } from "next/server";
import { getAdminFileAccess } from "@/lib/dokumantasyon/file-access";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Dosya kimliği belirtilmedi." }, { status: 400 });
    }

    const access = await getAdminFileAccess(id);

    return NextResponse.json(
      {
        success: true,
        ...access,
      },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
      }
      if (err.message === "NOT_FOUND") {
        return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
      }
    }

    console.error("Dosya erişim belirteci hatası:", err);
    return NextResponse.json(
      { error: "Dosya erişim bağlantısı üretilemedi." },
      { status: 500 }
    );
  }
}
