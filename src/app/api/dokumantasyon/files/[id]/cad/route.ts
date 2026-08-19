// ============================================================================
// GET /api/dokumantasyon/files/[id]/cad — CAD ÖNİZLEME VE APS DURUM ENDPOINT'İ
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { getFile } from "@/lib/dokumantasyon/files";
import { resolveCadPreviewStatus } from "@/lib/dokumantasyon/cad-aps";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    await requireDokumantasyonAdmin();

    const { id } = await params;
    const file = await getFile(id);

    if (!file || file.deleted_at) {
      return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
    }

    if (file.extension !== ".dwg" && file.extension !== ".dxf") {
      return NextResponse.json(
        { error: "Bu dosya bir CAD formatı değildir." },
        { status: 400 }
      );
    }

    const cadStatus = await resolveCadPreviewStatus(file.id, file.extension);

    return NextResponse.json(
      {
        success: true,
        file: {
          id: file.id,
          display_name: file.display_name,
          extension: file.extension,
          size_bytes: Number(file.size_bytes),
        },
        ...cadStatus,
      },
      {
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    console.error("CAD önizleme durum hatası:", err);
    return NextResponse.json(
      { error: "CAD önizleme durumu alınırken bir hata oluştu." },
      { status: 500 }
    );
  }
}
