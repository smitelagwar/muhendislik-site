// ============================================================================
// POST /api/dokumantasyon/upload/local — YEREL GELİŞTİRME DOSYA YÜKLEME
// ============================================================================

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import { createFile } from "@/lib/dokumantasyon/files";
import { getLocalStorageDir } from "@/lib/dokumantasyon/local-store";
import { isExplicitLocalDokMode } from "@/lib/dokumantasyon/runtime-mode";

export async function POST(request: Request) {
  try {
    if (!isExplicitLocalDokMode()) {
      return NextResponse.json(
        { error: "Vercel üretim ortamında yerel dosya yükleme yasaktır. Kalıcı Vercel Blob gereklidir." },
        { status: 403 }
      );
    }

    await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const pathname = (formData.get("pathname") as string) || `dok_storage/${crypto.randomUUID()}`;
    const folderId = (formData.get("folderId") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 400 });
    }

    const storageDir = getLocalStorageDir();
    const fileNameOnDisk = path.basename(pathname);
    const targetFilePath = path.join(storageDir, fileNameOnDisk);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(targetFilePath, buffer);

    const localUrl = `local:${fileNameOnDisk}`;

    // Veritabanı veya yerel kayıt oluştur
    const createdFile = await createFile({
      displayName: file.name,
      folderId: folderId && folderId !== "null" ? folderId : null,
      blobUrl: localUrl,
      blobPathname: pathname,
      sizeBytes: file.size,
      mimeType: file.type || "application/octet-stream",
    });

    return NextResponse.json({
      success: true,
      file: createdFile,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    console.error("Yerel dosya yükleme hatası:", err);
    return NextResponse.json(
      { error: "Yerel dosya yüklenirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
