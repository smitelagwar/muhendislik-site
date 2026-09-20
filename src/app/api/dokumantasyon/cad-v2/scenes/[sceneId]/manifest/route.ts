// ============================================================================
// GET /api/dokumantasyon/cad-v2/scenes/[sceneId]/manifest (G11)
// ============================================================================
// Sözleşme: motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md, 31_SOZLESME_TAMAMLAMALARI.md
// Gereksinimler: R17, R19, R20 | Alt kabul: C01

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { CadV2DurableService } from "@/lib/cad-v2/service/cad-v2-durable-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ sceneId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireDokumantasyonAdmin();

    const { sceneId } = await params;
    if (!sceneId) {
      return NextResponse.json(
        { error: "Geçersiz sahne kimliği.", code: "INVALID_SCENE_ID" },
        { status: 400, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const service = CadV2DurableService.getInstance();
    const manifest = service.getManifest(sceneId);

    if (!manifest) {
      return NextResponse.json(
        { error: "Sahne manifesti bulunamadı.", code: "SCENE_NOT_FOUND" },
        { status: 404, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    return NextResponse.json(manifest, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
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
