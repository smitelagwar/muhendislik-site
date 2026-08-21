// ============================================================================
// GET /api/dokumantasyon/folders/tree — AKTİF KLASÖR HİYERARŞİSİ
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { getActiveFolders } from "@/lib/dokumantasyon/folders";
import { assertDurableDokumantasyonRuntime, DokRuntimeConfigError } from "@/lib/dokumantasyon/runtime-mode";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDokumantasyonAdmin();
    assertDurableDokumantasyonRuntime(false);
    const folders = await getActiveFolders();
    return NextResponse.json({ folders }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    if (error instanceof DokRuntimeConfigError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 503 });
    }
    console.error("Klasör ağacı yüklenemedi:", error);
    return NextResponse.json({ error: "Klasör ağacı yüklenemedi." }, { status: 500 });
  }
}
