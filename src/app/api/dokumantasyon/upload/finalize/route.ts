// ============================================================================
// POST /api/dokumantasyon/upload/finalize — YÜKLEME SONRASI DB KAYDINI TAMAMLAMA
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import { createFileRecord } from "@/lib/dokumantasyon/files";
import { del } from "@vercel/blob";
import path from "path";

export async function POST(request: Request) {
  let blobUrlToDeleteOnError: string | null = null;

  try {
    await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);

    const body = await request.json().catch(() => ({}));
    const {
      blobUrl,
      blobPathname,
      displayName,
      sizeBytes,
      mimeType,
      folderId,
    } = body;

    if (!blobUrl || !blobPathname || !displayName || !sizeBytes) {
      return NextResponse.json(
        { error: "Eksik dosya yükleme parametreleri." },
        { status: 400 }
      );
    }

    blobUrlToDeleteOnError = blobUrl;
    const ext = path.extname(displayName).toLowerCase();

    // 1. Veritabanı kaydını oluştur
    const file = await createFileRecord({
      folder_id: folderId || null,
      display_name: displayName.trim(),
      blob_pathname: blobPathname,
      blob_url: blobUrl,
      size_bytes: Number(sizeBytes),
      mime_type: mimeType || "application/octet-stream",
      extension: ext,
    });

    return NextResponse.json({ success: true, file });
  } catch (err: unknown) {
    // 2. Compensation / Cleanup: DB kaydı başarısız olursa Blob'u temizle
    if (blobUrlToDeleteOnError) {
      try {
        console.warn("Upload finalize DB hatası -> Blob compensation temizliği yapılıyor:", blobUrlToDeleteOnError);
        await del(blobUrlToDeleteOnError);
      } catch (cleanupErr) {
        console.error("Blob cleanup hatası:", cleanupErr);
      }
    }

    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    console.error("Upload finalize hatası:", err);
    return NextResponse.json(
      { error: "Dosya kaydı tamamlanırken bir hata oluştu." },
      { status: 500 }
    );
  }
}
