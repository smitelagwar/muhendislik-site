// ============================================================================
// GET /api/dokumantasyon/cad-v2/scenes/[sceneId]/indexes/[indexId] (G11, B21)
// ============================================================================
// Sözleşme: motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md
// Cache-Control: private, no-store

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { CadV2DurableService } from "@/lib/cad-v2/service/cad-v2-durable-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sceneId: string; indexId: string }> }
) {
  try {
    await requireDokumantasyonAdmin();
    const { sceneId, indexId } = await params;

    if (!sceneId || !indexId) {
      return NextResponse.json(
        { code: "INVALID_PARAMETERS", message: "sceneId ve indexId zorunludur." },
        { status: 400, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const service = CadV2DurableService.getInstance();
    const indexData = await service.getSceneIndex(sceneId, indexId);

    if (!indexData) {
      return NextResponse.json(
        { code: "INDEX_NOT_FOUND", message: "İndeks sayfası bulunamadı." },
        { status: 404, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    return NextResponse.json(indexData, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: err.message || "Sunucu hatası" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
