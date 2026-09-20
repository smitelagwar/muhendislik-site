// ============================================================================
// GET /api/dokumantasyon/cad-v2/scenes/[sceneId]/chunks/[chunkId] (G11)
// ============================================================================
// Sözleşme: motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md, 31_SOZLESME_TAMAMLAMALARI.md
// Gereksinimler: R17, R21 | Alt kabul: C03, C04

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { CadV2DurableService } from "@/lib/cad-v2/service/cad-v2-durable-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ sceneId: string; chunkId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireDokumantasyonAdmin();

    const { sceneId, chunkId } = await params;
    if (!sceneId || !chunkId) {
      return NextResponse.json(
        { error: "Geçersiz parametreler.", code: "INVALID_PARAMETERS" },
        { status: 400, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const service = CadV2DurableService.getInstance();
    const chunkBytes = await service.getChunkAsync(sceneId, chunkId);

    if (!chunkBytes) {
      return NextResponse.json(
        { error: "Parça (chunk) bulunamadı.", code: "CHUNK_NOT_FOUND" },
        { status: 404, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    return new Response(Buffer.from(chunkBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(chunkBytes.byteLength),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: err?.message || "Sunucu hatası." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
