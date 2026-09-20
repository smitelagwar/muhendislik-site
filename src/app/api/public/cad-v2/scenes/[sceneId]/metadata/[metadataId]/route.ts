// ============================================================================
// GET /api/public/cad-v2/scenes/[sceneId]/metadata/[metadataId] (G14, B21)
// ============================================================================
// Sözleşme: motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md
// Cache-Control: private, no-store

import { NextResponse } from "next/server";
import { verifyPublicShareAccess } from "@/lib/cad-v2/service/public-auth";
import { CadV2DurableService } from "@/lib/cad-v2/service/cad-v2-durable-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ sceneId: string; metadataId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { sceneId, metadataId } = await params;
    const url = new URL(request.url);
    const shareToken = request.headers.get("x-share-token") || url.searchParams.get("shareToken") || "";

    const auth = await verifyPublicShareAccess(shareToken);
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error || "Erişim reddedildi.", code: "ACCESS_DENIED" },
        { status: auth.statusCode || 403, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const service = CadV2DurableService.getInstance();
    const fileId = service.getFileIdForScene(sceneId);
    if (fileId && auth.fileIds && !auth.fileIds.includes(fileId)) {
      return NextResponse.json(
        { error: "Bu sahneye ait dosya paylaşıma dahil değil.", code: "ACCESS_DENIED" },
        { status: 403, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const metadata = await service.getSceneMetadata(sceneId, metadataId);
    if (!metadata) {
      return NextResponse.json(
        { code: "METADATA_NOT_FOUND", message: "Metadata bulunamadı." },
        { status: 404, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    return NextResponse.json(metadata, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: err?.message || "Sunucu hatası." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
