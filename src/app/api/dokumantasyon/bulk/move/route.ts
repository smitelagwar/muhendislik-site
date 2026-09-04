// ============================================================================
// POST /api/dokumantasyon/bulk/move — TOPLU ÖĞE TAŞIMA
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import { bulkMoveSchema } from "@/lib/dokumantasyon/validation";
import { moveFile } from "@/lib/dokumantasyon/files";
import { moveFolder } from "@/lib/dokumantasyon/folders";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);

    const body = await request.json().catch(() => ({}));
    const parseResult = bulkMoveSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Geçersiz veri." },
        { status: 400 }
      );
    }

    const { items, targetFolderId } = parseResult.data;
    const succeeded: string[] = [];
    const failed: Array<{ id: string; type: "file" | "folder"; code: string; message: string }> = [];

    for (const item of items) {
      try {
        if (item.type === "file") {
          await moveFile(item.id, targetFolderId);
        } else {
          await moveFolder(item.id, targetFolderId);
        }
        succeeded.push(item.id);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Öğe taşınamadı.";
        const isCycle = message.includes("alt klasörünün içine taşınamaz") || message.includes("kendi içine");
        failed.push({
          id: item.id,
          type: item.type,
          code: isCycle ? "CIRCULAR_MOVE" : "MOVE_ERROR",
          message,
        });
      }
    }

    return NextResponse.json({ succeeded, failed });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Toplu taşıma sırasında hata oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
