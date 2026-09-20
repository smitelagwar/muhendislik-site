// ============================================================================
// DELETE /api/dokumantasyon/cad-v2/view-sessions/[viewSessionId] (G11)
// ============================================================================
// Sözleşme: motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md, 31_SOZLESME_TAMAMLAMALARI.md
// Gereksinimler: R27 | Alt kabul: C08, C09

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { CadV2DurableService } from "@/lib/cad-v2/service/cad-v2-durable-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ viewSessionId: string }>;
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireDokumantasyonAdmin();

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
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: err?.message || "Sunucu hatası." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
