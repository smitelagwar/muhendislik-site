// ============================================================================
// PATCH & DELETE /api/dokumantasyon/files/[id] — DOSYA GÜNCELLEME VE SİLME
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import { updateFileSchema } from "@/lib/dokumantasyon/validation";
import { renameFile, moveFile, setFileStarred, trashFile } from "@/lib/dokumantasyon/files";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parseResult = updateFileSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "Geçersiz veri." },
        { status: 400 }
      );
    }

    const { displayName, folderId, starred } = parseResult.data;
    let updatedFile;

    if (displayName !== undefined && displayName !== null) {
      updatedFile = await renameFile(id, displayName);
    }

    if (folderId !== undefined) {
      updatedFile = await moveFile(id, folderId || null);
    }

    if (starred !== undefined) {
      updatedFile = await setFileStarred(id, starred);
    }

    return NextResponse.json({ success: true, file: updatedFile });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Dosya güncellenirken bir hata oluştu.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);

    const { id } = await params;
    await trashFile(id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    console.error("Dosya silme hatası:", err);
    return NextResponse.json(
      { error: "Dosya silinirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
