// ============================================================================
// POST /api/dokumantasyon/bulk/restore — ÇÖPTEN TOPLU GERİ YÜKLEME
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import { bulkRestoreSchema } from "@/lib/dokumantasyon/validation";
import { restoreFile } from "@/lib/dokumantasyon/files";
import { restoreFolder } from "@/lib/dokumantasyon/folders";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);

    const body = await request.json().catch(() => ({}));
    const parseResult = bulkRestoreSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Geçersiz veri." },
        { status: 400 }
      );
    }

    const { items } = parseResult.data;
    const succeeded: string[] = [];
    const failed: Array<{ id: string; type: "file" | "folder"; code: string; message: string }> = [];

    for (const item of items) {
      try {
        if (item.type === "file") {
          await restoreFile(item.id);
        } else {
          await restoreFolder(item.id);
        }
        succeeded.push(item.id);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Öğe geri yüklenemedi.";
        failed.push({
          id: item.id,
          type: item.type,
          code: "RESTORE_ERROR",
          message,
        });
      }
    }

    return NextResponse.json({ succeeded, failed });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Toplu geri yükleme sırasında hata oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
