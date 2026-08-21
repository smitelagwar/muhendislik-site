// ============================================================================
// POST /api/dokumantasyon/stars/migrate — ESKİ LOCALSTORAGE YILDIZLARINI TAŞIR
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import { legacyStarMigrationSchema } from "@/lib/dokumantasyon/validation";
import { migrateLegacyStarredIds } from "@/lib/dokumantasyon/files";

export async function POST(request: Request) {
  try {
    await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);
    const parsed = legacyStarMigrationSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Geçersiz yıldız verisi." }, { status: 400 });
    }
    const migrated = await migrateLegacyStarredIds(parsed.data.ids);
    return NextResponse.json({ success: true, migrated });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    console.error("Yıldızlı öğe taşıma hatası:", error);
    return NextResponse.json({ error: "Yıldızlı öğeler taşınamadı." }, { status: 500 });
  }
}
