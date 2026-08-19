// ============================================================================
// POST /api/dokumantasyon/upload/token — CLIENT UPLOAD TOKEN OLUŞTURMA
// ============================================================================

import { NextResponse } from "next/server";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import { DOKUMANTASYON_CONFIG } from "@/lib/dokumantasyon/config";
import path from "path";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const session = await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);

    const body = await request.json().catch(() => ({}));
    const { filename, size, mimeType, folderId } = body;

    if (!filename || typeof filename !== "string") {
      return NextResponse.json({ error: "Dosya adı belirtilmedi." }, { status: 400 });
    }

    const sizeNum = Number(size);
    if (isNaN(sizeNum) || sizeNum <= 0) {
      return NextResponse.json({ error: "Geçersiz dosya boyutu." }, { status: 400 });
    }

    // 1. Boyut Sınırı Kontrolü
    if (sizeNum > DOKUMANTASYON_CONFIG.MAX_FILE_SIZE_BYTES) {
      const maxMb = Math.round(DOKUMANTASYON_CONFIG.MAX_FILE_SIZE_BYTES / (1024 * 1024));
      return NextResponse.json(
        { error: `Dosya boyutu maksimum sınırı (${maxMb} MB) aşıyor.` },
        { status: 400 }
      );
    }

    // 2. Uzantı Kontrolü
    const ext = path.extname(filename).toLowerCase();
    const isAllowedExt = (DOKUMANTASYON_CONFIG.ALLOWED_EXTENSIONS as readonly string[]).includes(ext);

    if (!isAllowedExt) {
      return NextResponse.json(
        { error: `Desteklenmeyen dosya türü (${ext}). İzin verilenler: ${DOKUMANTASYON_CONFIG.ALLOWED_EXTENSIONS.join(", ")}` },
        { status: 400 }
      );
    }

    // 3. Opaque / Rastgele Storage Path Oluşturma (Path traversal ve URL sızıntı engeli)
    const randomId = crypto.randomUUID();
    const sanitizedExt = ext.replace(/[^a-z0-9.]/gi, "");
    const storagePathname = `dok_storage/${randomId}${sanitizedExt}`;

    const { createUploadIntentToken } = await import("@/lib/dokumantasyon/upload-intent");
    const intentToken = await createUploadIntentToken({
      intentId: randomId,
      pathname: storagePathname,
      filename,
      sizeBytes: sizeNum,
      folderId: folderId || null,
      username: session?.username || "admin",
    });

    const { isExplicitLocalDokMode, getBlobToken } = await import("@/lib/dokumantasyon/runtime-mode");
    const blobRwToken = getBlobToken();
    if (!blobRwToken) {
      if (isExplicitLocalDokMode()) {
        // Yalnızca açık yerel geliştirme modunda çalışır
        return NextResponse.json({
          isLocalMode: true,
          pathname: storagePathname,
          folderId: folderId || null,
          intentToken,
        });
      }
      return NextResponse.json(
        { error: "Dökümantasyon kalıcı depolama (Vercel Blob) yapılandırılmamış." },
        { status: 503 }
      );
    }

    // 4. Client Upload Token Üretimi (Vercel Private Blob)
    const clientToken = await generateClientTokenFromReadWriteToken({
      token: blobRwToken,
      pathname: storagePathname,
      maximumSizeInBytes: Math.min(sizeNum, DOKUMANTASYON_CONFIG.MAX_FILE_SIZE_BYTES),
      validUntil: Date.now() + 30 * 60 * 1000, // 30 dakika geçerli
    });

    return NextResponse.json({
      clientToken,
      pathname: storagePathname,
      folderId: folderId || null,
      intentToken,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    console.error("Upload token oluşturma hatası:", err);
    return NextResponse.json(
      { error: "Upload token oluşturulurken bir hata oluştu." },
      { status: 500 }
    );
  }
}
