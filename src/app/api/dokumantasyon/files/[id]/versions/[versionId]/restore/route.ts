// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — DOSYA VERSİYON GERİ YÜKLEME API ENDPOINT'İ
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { restoreFileVersion } from "@/lib/dokumantasyon/versions";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const session = await requireDokumantasyonAdmin();

    const { id: fileId, versionId } = await params;
    if (!fileId || !versionId) {
      return NextResponse.json({ success: false, error: "Geçersiz parametreler." }, { status: 400 });
    }

    const restoredVersion = await restoreFileVersion({
      fileId,
      versionId,
      username: session.username || "admin",
    });

    return NextResponse.json({ success: true, version: restoredVersion });
  } catch (err: unknown) {
    console.error("Versiyon geri yükleme hatası:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Sunucu hatası." },
      { status: 500 }
    );
  }
}
