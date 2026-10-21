import { getErrorMessage } from "@/lib/cad-v2/error-utils";
// ============================================================================
// DELETE /api/public/cad-v2/view-sessions/[viewSessionId] (G14)
// ============================================================================
// Sözleşme: motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md, 19_GEMINI_ADIM_ADIM_UYGULAMA.md (G14)

import { NextResponse } from "next/server";
import { isSameOriginPublicMutation, verifyPublicShareAccess } from "@/lib/cad-v2/service/public-auth";
import { CadV2DurableService } from "@/lib/cad-v2/service/cad-v2-durable-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ viewSessionId: string }>;
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    if (!isSameOriginPublicMutation(request)) {
      return NextResponse.json(
        { error: "Kaynak origin kabul edilmedi.", code: "ORIGIN_NOT_ALLOWED" },
        { status: 403, headers: { "Cache-Control": "private, no-store" } }
      );
    }
    const { viewSessionId } = await params;
    if (!viewSessionId) {
      return NextResponse.json(
        { error: "Geçersiz oturum kimliği.", code: "INVALID_SESSION_ID" },
        { status: 400, headers: { "Cache-Control": "private, no-store" } }
      );
    }

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
    const session = await service.getViewSessionAsync(viewSessionId);
    if (!session) {
      return NextResponse.json(
        { error: "Oturum süresi doldu veya bulunamadı.", code: "VIEW_SESSION_EXPIRED" },
        { status: 410, headers: { "Cache-Control": "private, no-store" } }
      );
    }
    if (
      !auth.linkId || session.shareLinkId !== auth.linkId ||
      !auth.fileIds?.includes(session.fileId)
    ) {
      return NextResponse.json(
        { error: "Bu görüntüleme oturumu paylaşıma ait değil.", code: "ACCESS_DENIED" },
        { status: 403, headers: { "Cache-Control": "private, no-store" } }
      );
    }
    if (!(await service.deleteViewSessionAsync(viewSessionId))) {
      return NextResponse.json(
        { error: "Oturum süresi doldu veya bulunamadı.", code: "VIEW_SESSION_EXPIRED" },
        { status: 410, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    return new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: getErrorMessage(err) || "Sunucu hatası." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
