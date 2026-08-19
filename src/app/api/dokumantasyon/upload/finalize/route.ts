// ============================================================================
// POST /api/dokumantasyon/upload/finalize — YÜKLEME SONRASI DB KAYDINI TAMAMLAMA
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { assertSameOriginForMutation } from "@/lib/dokumantasyon/security";
import { createFileRecord } from "@/lib/dokumantasyon/files";
import { del } from "@vercel/blob";
import path from "path";
import { getBlobToken } from "@/lib/dokumantasyon/runtime-mode";

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
      intentToken,
    } = body;

    if (!blobUrl || !blobPathname || !displayName || !sizeBytes) {
      return NextResponse.json(
        { error: "Eksik dosya yükleme parametreleri." },
        { status: 400 }
      );
    }

    blobUrlToDeleteOnError = blobUrl;
    const ext = path.extname(displayName).toLowerCase();

    // 1. Upload Intent Doğrulaması (Kalıcı üretim ortamında zorunlu)
    const { isExplicitLocalDokMode } = await import("@/lib/dokumantasyon/runtime-mode");
    const isLocal = isExplicitLocalDokMode();

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
        verifiedIntent.filename !== displayName.trim() ||
        Number(verifiedIntent.sizeBytes) !== Number(sizeBytes)
      ) {
        return NextResponse.json(
          { error: "Geçersiz, tahrif edilmiş veya uyuşmayan yükleme belirteci (Upload Intent)." },
          { status: 400 }
        );
      }
    }

    // 2. Post-Upload Dosya Başlığı (Magic Byte) Doğrulaması
    let headerBuffer: Buffer | Uint8Array | null = null;

    if (blobUrl.startsWith("local:")) {
      const fileNameOnDisk = blobUrl.replace("local:", "");
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
    } else {
      // Vercel Private Blob dosyasının ilk 512 baytını oku
      const blobToken = getBlobToken();
      const fetchHeaders: HeadersInit = { Range: "bytes=0-511" };
      if (blobToken) {
        fetchHeaders["Authorization"] = `Bearer ${blobToken}`;
      }

      try {
        const headRes = await fetch(blobUrl, { headers: fetchHeaders });
        if (headRes.ok) {
          const ab = await headRes.arrayBuffer();
          headerBuffer = new Uint8Array(ab);
        }
      } catch (headErr) {
        console.warn("Post-upload header fetch uyarısı:", headErr);
      }
    }

    let finalMimeType = mimeType || "application/octet-stream";

    if (headerBuffer && headerBuffer.length > 0) {
      const { validateFileContent } = await import("@/lib/dokumantasyon/file-validation");
      const validation = validateFileContent(headerBuffer, displayName);

      if (!validation.isValid) {
        // Geçersiz imza: Güvenlik gereği Blob depolamasından derhal temizle
        if (blobUrlToDeleteOnError && !blobUrlToDeleteOnError.startsWith("local:")) {
          try {
            await del(blobUrlToDeleteOnError);
          } catch {}
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
      display_name: displayName.trim(),
      blob_pathname: blobPathname,
      blob_url: blobUrl,
      size_bytes: Number(sizeBytes),
      mime_type: finalMimeType,
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
