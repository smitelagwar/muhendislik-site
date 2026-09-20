// ============================================================================
// DELETE /api/public/cad-v2/view-sessions/[viewSessionId] (G14)
// ============================================================================
// Sözleşme: motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md, 19_GEMINI_ADIM_ADIM_UYGULAMA.md (G14)

import { NextResponse } from "next/server";
import { CadV2DurableService } from "@/lib/cad-v2/service/cad-v2-durable-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ viewSessionId: string }>;
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { viewSessionId } = await params;
    if (!viewSessionId) {
      return NextResponse.json(
        { error: "Geçersiz oturum kimliği.", code: "INVALID_SESSION_ID" },
        { status: 400, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const service = CadV2DurableService.getInstance();
    service.deleteViewSession(viewSessionId);

    return new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: err?.message || "Sunucu hatası." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
