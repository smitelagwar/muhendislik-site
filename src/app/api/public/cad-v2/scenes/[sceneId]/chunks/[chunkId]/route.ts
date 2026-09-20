// ============================================================================
// GET /api/public/cad-v2/scenes/[sceneId]/chunks/[chunkId] (G14)
// ============================================================================
// Sözleşme: motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md, 19_GEMINI_ADIM_ADIM_UYGULAMA.md (G14)

import { NextResponse } from "next/server";
import { verifyPublicShareAccess } from "@/lib/cad-v2/service/public-auth";
import { CadV2DurableService } from "@/lib/cad-v2/service/cad-v2-durable-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ sceneId: string; chunkId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { sceneId, chunkId } = await params;
    const url = new URL(request.url);
    const shareToken = request.headers.get("x-share-token") || url.searchParams.get("shareToken") || "";

    const auth = await verifyPublicShareAccess(shareToken);
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error || "Erişim reddedildi.", code: "ACCESS_DENIED" },
        { status: auth.statusCode || 403, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    if (!sceneId || !chunkId) {
      return NextResponse.json(
        { error: "Geçersiz parametreler.", code: "INVALID_PARAMETERS" },
        { status: 400, headers: { "Cache-Control": "private, no-store" } }
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
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: err?.message || "Sunucu hatası." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
