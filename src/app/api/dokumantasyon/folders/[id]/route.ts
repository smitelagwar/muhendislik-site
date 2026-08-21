// ============================================================================
// PATCH & DELETE /api/dokumantasyon/folders/[id] — KLASÖR GÜNCELLEME VE SİLME
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import { updateFolderSchema } from "@/lib/dokumantasyon/validation";
import { renameFolder, moveFolder, setFolderStarred, trashFolder } from "@/lib/dokumantasyon/folders";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parseResult = updateFolderSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Geçersiz veri." },
        { status: 400 }
      );
    }

    const { name, parentId, starred } = parseResult.data;
    let updatedFolder;

    if (name !== undefined && name !== null) {
      updatedFolder = await renameFolder(id, name);
    }

    if (parentId !== undefined) {
      updatedFolder = await moveFolder(id, parentId || null);
    }

    if (starred !== undefined) {
      updatedFolder = await setFolderStarred(id, starred);
    }

    return NextResponse.json({ success: true, folder: updatedFolder });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Klasör güncellenirken bir hata oluştu.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);

    const { id } = await params;
    const result = await trashFolder(id);

    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    console.error("Klasör silme hatası:", err);
    return NextResponse.json(
      { error: "Klasör silinirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
