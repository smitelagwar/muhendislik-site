// ============================================================================
// POST /api/dokumantasyon/upload/intent — PRESIGNED YÜKLEME NİYETİ OLUŞTURMA
// ============================================================================

import crypto from "crypto";
import path from "path";
import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { DOKUMANTASYON_CONFIG } from "@/lib/dokumantasyon/config";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import {
  DokRuntimeConfigError,
  hasBlobAccessConfiguration,
  isExplicitLocalDokMode,
} from "@/lib/dokumantasyon/runtime-mode";
import { createUploadIntentToken } from "@/lib/dokumantasyon/upload-intent";

export async function POST(request: Request) {
  try {
    const session = await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);

    const { filename, size, mimeType, folderId } = await request.json().catch(() => ({}));
    if (!filename || typeof filename !== "string") {
      return NextResponse.json({ error: "Dosya adı belirtilmedi." }, { status: 400 });
    }

    const sizeNum = Number(size);
    if (!Number.isFinite(sizeNum) || sizeNum <= 0) {
      return NextResponse.json({ error: "Geçersiz dosya boyutu." }, { status: 400 });
    }
    if (sizeNum > DOKUMANTASYON_CONFIG.MAX_FILE_SIZE_BYTES) {
      const maxMb = Math.round(DOKUMANTASYON_CONFIG.MAX_FILE_SIZE_BYTES / (1024 * 1024));
      return NextResponse.json({ error: `Dosya boyutu maksimum sınırı (${maxMb} MB) aşıyor.` }, { status: 400 });
    }

    const ext = path.extname(filename).toLowerCase();
    if (!(DOKUMANTASYON_CONFIG.ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
      return NextResponse.json({ error: `Desteklenmeyen dosya türü (${ext}).` }, { status: 400 });
    }

    const expectedMimeType = DOKUMANTASYON_CONFIG.MIME_TYPE_MAP[ext.slice(1)] || "application/octet-stream";
    if (mimeType && typeof mimeType === "string" && mimeType !== "application/octet-stream" && mimeType !== expectedMimeType) {
      return NextResponse.json({ error: "Dosya uzantısı ve MIME türü uyuşmuyor." }, { status: 400 });
    }

    const intentId = crypto.randomUUID();
    const pathname = `dok_storage/${intentId}${ext.replace(/[^a-z0-9.]/gi, "")}`;
    const intentToken = await createUploadIntentToken({
      intentId,
      pathname,
      filename,
      sizeBytes: sizeNum,
      folderId: folderId || null,
      username: session.username,
    });

    if (isExplicitLocalDokMode() && !hasBlobAccessConfiguration()) {
      return NextResponse.json({ isLocalMode: true, pathname, folderId: folderId || null, intentToken });
    }

    if (!hasBlobAccessConfiguration()) {
      throw new DokRuntimeConfigError("BLOB_NOT_CONFIGURED");
    }

    return NextResponse.json({
      pathname,
      folderId: folderId || null,
      intentToken,
      // İstemci bu URL'yi doğrudan uploadPresigned() API'sine verir.
      handleUploadUrl: "/api/dokumantasyon/upload/token",
      mimeType: expectedMimeType,
    });
  } catch (err: unknown) {
    if (err instanceof DokRuntimeConfigError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 503 });
    }
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    console.error("Upload intent oluşturma hatası:", err);
    return NextResponse.json({ error: "Yükleme başlatılırken bir hata oluştu." }, { status: 500 });
  }
}
