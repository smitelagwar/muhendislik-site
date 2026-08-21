// ============================================================================
// POST /api/dokumantasyon/upload/finalize — YÜKLEME SONRASI DB KAYDINI TAMAMLAMA
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import { createFileRecord } from "@/lib/dokumantasyon/files";
import { del, get } from "@vercel/blob";
import path from "path";
import { getBlobCommandOptions, hasBlobAccessConfiguration, isExplicitLocalDokMode, DokRuntimeConfigError } from "@/lib/dokumantasyon/runtime-mode";
import { safeFileNameSchema } from "@/lib/dokumantasyon/validation";

export async function POST(request: Request) {
  let blobPathnameToDeleteOnError: string | null = null;
  let verifiedIntentId: string | null = null;

  try {
    const session = await requireDokumantasyonAdmin();
    assertSameOriginForMutation(request);

    const body = await request.json().catch(() => ({}));
    const {
      blobUrl,
      blobPathname,
      displayName,
      sizeBytes,
      mimeType,
      folderId,
      intentToken,
    } = body;

    if (!blobPathname || !displayName || !sizeBytes || typeof blobPathname !== "string" || !blobPathname.startsWith("dok_storage/")) {
      return NextResponse.json(
        { error: "Eksik dosya yükleme parametreleri." },
        { status: 400 }
      );
    }

    const safeDisplayName = safeFileNameSchema.safeParse(displayName);
    if (!safeDisplayName.success) {
      return NextResponse.json({ error: safeDisplayName.error.issues[0]?.message || "Geçersiz dosya adı." }, { status: 400 });
    }

    blobPathnameToDeleteOnError = blobPathname;
    const ext = path.extname(safeDisplayName.data).toLowerCase();
    const isLocal = isExplicitLocalDokMode();

    // 1. Upload Intent Doğrulaması (Kalıcı üretim ortamında zorunlu)
    if (!isLocal && !intentToken) {
      return NextResponse.json(
        { error: "Kalıcı yükleme için geçerli bir upload intent belirteci (intentToken) zorunludur." },
        { status: 400 }
      );
    }

    if (intentToken) {
      const { verifyUploadIntentToken } = await import("@/lib/dokumantasyon/upload-intent");
      const verifiedIntent = await verifyUploadIntentToken(intentToken);
      if (
        !verifiedIntent ||
        verifiedIntent.pathname !== blobPathname ||
        verifiedIntent.filename !== safeDisplayName.data ||
        Number(verifiedIntent.sizeBytes) !== Number(sizeBytes) ||
        (verifiedIntent.folderId || null) !== (folderId || null) ||
        (session?.username && verifiedIntent.username !== session.username)
      ) {
        return NextResponse.json(
          { error: "Geçersiz, tahrif edilmiş veya uyuşmayan yükleme belirteci (Upload Intent)." },
          { status: 400 }
        );
      }
      verifiedIntentId = verifiedIntent.intentId;
    }

    // 2. Post-Upload Dosya Başlığı (Magic Byte) Doğrulaması & Canonical URL Çözümleme
    let headerBuffer: Buffer | Uint8Array | null = null;
    let canonicalBlobUrl = blobUrl || `blob:${blobPathname}`;

    if (blobUrl?.startsWith("local:") || (isLocal && !hasBlobAccessConfiguration())) {
      const fileNameOnDisk = (blobUrl || blobPathname).replace("local:", "");
      const { getLocalStorageDir } = await import("@/lib/dokumantasyon/local-store");
      const fs = await import("fs");
      const diskPath = path.join(getLocalStorageDir(), fileNameOnDisk);

      if (fs.existsSync(diskPath)) {
        const fd = fs.openSync(diskPath, "r");
        const buf = Buffer.alloc(Math.min(512, Number(sizeBytes)));
        fs.readSync(fd, buf, 0, buf.length, 0);
        fs.closeSync(fd);
        headerBuffer = buf;
      }
      canonicalBlobUrl = `local:${fileNameOnDisk}`;
    } else {
      // Vercel Private Blob: Resmi SDK get() ile güvenli (SSRF-free) stream okuma
      if (!hasBlobAccessConfiguration()) {
        throw new DokRuntimeConfigError("BLOB_NOT_CONFIGURED");
      }

      try {
        const blobGetResult = await get(blobPathname, {
          access: "private",
          ...getBlobCommandOptions(),
          useCache: false,
        });

        if (!blobGetResult || !blobGetResult.stream) {
          return NextResponse.json(
            { error: "Yüklenen dosya kalıcı depolama alanında bulunamadı." },
            { status: 404 }
          );
        }

        canonicalBlobUrl = blobGetResult.blob.url;

        // İlk 512 baytı stream'den oku
        const reader = blobGetResult.stream.getReader();
        const { value } = await reader.read();
        if (value) {
          headerBuffer = value.subarray(0, 512);
        }
        reader.cancel().catch(() => {});
      } catch (getErr) {
        console.warn("Private blob doğrulama uyarısı:", getErr);
        return NextResponse.json(
          { error: "Yüklenen dosya depolama alanında doğrulanamadı; metadata kaydı oluşturulmadı." },
          { status: 502 }
        );
      }
    }

    let finalMimeType = mimeType || "application/octet-stream";

    if (headerBuffer && headerBuffer.length > 0) {
      const { validateFileContent } = await import("@/lib/dokumantasyon/file-validation");
      const validation = validateFileContent(headerBuffer, safeDisplayName.data);

      if (!validation.isValid) {
        // Geçersiz imza: Güvenlik gereği Blob depolamasından derhal temizle
        if (blobPathnameToDeleteOnError && !blobPathnameToDeleteOnError.startsWith("local:")) {
          if (hasBlobAccessConfiguration()) {
            try {
              await del(blobPathnameToDeleteOnError, getBlobCommandOptions());
            } catch {}
          }
        }
        return NextResponse.json(
          { error: validation.errorMessage || "Dosya biçimi ve içeriği uyuşmuyor." },
          { status: 400 }
        );
      }

      if (validation.detectedMime) {
        finalMimeType = validation.detectedMime;
      }
    }

    // 3. Veritabanı kaydını oluştur
    const file = await createFileRecord({
      folder_id: folderId || null,
      display_name: safeDisplayName.data,
      blob_pathname: blobPathname,
      blob_url: canonicalBlobUrl,
      size_bytes: Number(sizeBytes),
      mime_type: finalMimeType,
      extension: ext,
    });

    if (intentToken) {
      const { markUploadIntentFinalized } = await import("@/lib/dokumantasyon/upload-intent");
      if (verifiedIntentId) await markUploadIntentFinalized(verifiedIntentId, file.id);
    }

    return NextResponse.json({ success: true, file });
  } catch (err: unknown) {
    if (blobPathnameToDeleteOnError && !blobPathnameToDeleteOnError.startsWith("local:")) {
      if (hasBlobAccessConfiguration()) {
        try {
          await del(blobPathnameToDeleteOnError, getBlobCommandOptions());
        } catch {}
      }
    }

    if (err instanceof DokRuntimeConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
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
