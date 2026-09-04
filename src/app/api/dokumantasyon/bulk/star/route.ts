// ============================================================================
// POST /api/dokumantasyon/bulk/star — TOPLU YILDIZ EKLEME / ÇIKARMA
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import { bulkStarSchema } from "@/lib/dokumantasyon/validation";
import { setFileStarred } from "@/lib/dokumantasyon/files";
import { setFolderStarred } from "@/lib/dokumantasyon/folders";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);

    const body = await request.json().catch(() => ({}));
    const parseResult = bulkStarSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Geçersiz veri." },
        { status: 400 }
      );
    }

    const { items, starred } = parseResult.data;
    const succeeded: string[] = [];
    const failed: Array<{ id: string; type: "file" | "folder"; code: string; message: string }> = [];

    for (const item of items) {
      try {
        if (item.type === "file") {
          await setFileStarred(item.id, starred);
        } else {
          await setFolderStarred(item.id, starred);
        }
        succeeded.push(item.id);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Yıldız durumu güncellenemedi.";
        failed.push({
          id: item.id,
          type: item.type,
          code: "STAR_ERROR",
          message,
        });
      }
    }

    return NextResponse.json({ succeeded, failed });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Toplu yıldız güncelleme sırasında hata oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
