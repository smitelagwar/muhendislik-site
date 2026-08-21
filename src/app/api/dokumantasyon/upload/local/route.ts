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
import { DOKUMANTASYON_CONFIG } from "@/lib/dokumantasyon/config";
import { safeFileNameSchema } from "@/lib/dokumantasyon/validation";
import { validateFileContent } from "@/lib/dokumantasyon/file-validation";

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

    const safeName = safeFileNameSchema.safeParse(file.name);
    if (!safeName.success) {
      return NextResponse.json({ error: safeName.error.issues[0]?.message || "Geçersiz dosya adı." }, { status: 400 });
    }
    if (file.size <= 0 || file.size > DOKUMANTASYON_CONFIG.MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Geçersiz veya çok büyük dosya." }, { status: 400 });
    }
    const extension = path.extname(safeName.data).toLowerCase();
    if (!(DOKUMANTASYON_CONFIG.ALLOWED_EXTENSIONS as readonly string[]).includes(extension)) {
      return NextResponse.json({ error: "Desteklenmeyen dosya türü." }, { status: 400 });
    }
    const fileNameOnDisk = path.basename(pathname);
    const canonicalPathname = `dok_storage/${fileNameOnDisk}`;
    // Eski yerel test istemcileri yalnız basename gönderiyordu. Onu canonical
    // namespace'e alırken traversal veya alt dizin kabul edilmez.
    if (
      !/^[A-Za-z0-9._-]+$/.test(fileNameOnDisk) ||
      (pathname !== fileNameOnDisk && pathname !== canonicalPathname)
    ) {
      return NextResponse.json({ error: "Geçersiz yükleme yolu." }, { status: 400 });
    }

    const storageDir = getLocalStorageDir();
    const targetFilePath = path.join(storageDir, fileNameOnDisk);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const validation = validateFileContent(buffer.subarray(0, 512), safeName.data);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.errorMessage || "Dosya imzası doğrulanamadı." }, { status: 400 });
    }
    fs.writeFileSync(targetFilePath, buffer);

    const localUrl = `local:${fileNameOnDisk}`;

    // Veritabanı veya yerel kayıt oluştur
    const createdFile = await createFile({
      displayName: safeName.data,
      folderId: folderId && folderId !== "null" ? folderId : null,
      blobUrl: localUrl,
      blobPathname: canonicalPathname,
      sizeBytes: file.size,
      mimeType: validation.detectedMime || "application/octet-stream",
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
