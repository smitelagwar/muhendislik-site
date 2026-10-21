import { getErrorMessage } from "@/lib/cad-v2/error-utils";
// ============================================================================
// POST /api/public/cad-v2/view-sessions/[viewSessionId]/heartbeat (G14)
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

export async function POST(request: Request, { params }: RouteParams) {
  try {
    if (!isSameOriginPublicMutation(request)) {
      return NextResponse.json(
        { error: "Kaynak origin kabul edilmedi.", code: "ORIGIN_NOT_ALLOWED" },
        { status: 403, headers: { "Cache-Control": "private, no-store" } }
      );
    }
    const { viewSessionId } = await params;
    const shareToken = request.headers.get("x-share-token") || "";

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
        { code: "VIEW_SESSION_EXPIRED", message: "Oturum süresi doldu veya bulunamadı." },
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
    const result = await service.heartbeatViewSessionAsync(viewSessionId);

    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err: unknown) {
    if (getErrorMessage(err)?.includes("VIEW_SESSION_EXPIRED")) {
      return NextResponse.json(
        { code: "VIEW_SESSION_EXPIRED", message: "Oturum süresi doldu veya bulunamadı." },
        { status: 410, headers: { "Cache-Control": "private, no-store" } }
      );
    }
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: getErrorMessage(err) || "Sunucu hatası." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
