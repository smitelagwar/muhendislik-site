// ============================================================================
// GET /api/dokumantasyon/files/[id]/stream — YEREL AKIŞ VE RANGE ENDPOINT'İ
// ============================================================================

import { NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { getFile } from "@/lib/dokumantasyon/files";
import { getLocalStorageDir } from "@/lib/dokumantasyon/local-store";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    await requireDokumantasyonAdmin();

    const { id } = await params;
    const file = await getFile(id);

    if (!file || file.deleted_at) {
      return new NextResponse("Dosya bulunamadı.", { status: 404 });
    }

    if (!file.blob_url?.startsWith("local:")) {
      return new NextResponse("Bu dosya yerel depolama alanında bulunmuyor.", { status: 400 });
    }

    const fileNameOnDisk = file.blob_url.replace("local:", "");
    const diskPath = path.join(getLocalStorageDir(), fileNameOnDisk);

    if (!fs.existsSync(diskPath)) {
      return new NextResponse("Dosya diskte bulunamadı.", { status: 404 });
    }

    const stat = fs.statSync(diskPath);
    const fileSize = stat.size;
    const rangeHeader = request.headers.get("range");

    const mimeType = file.mime_type || "application/octet-stream";

    // 1. Range İstekleri (206 Partial Content) — PDF.js ve Medya Oynatıcılar İçin
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        return new NextResponse("İstenen aralık dosya boyutunu aşıyor.", {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(diskPath, { start, end });
      const webStream = new ReadableStream({
        start(controller) {
          fileStream.on("data", (chunk) => controller.enqueue(chunk));
          fileStream.on("end", () => controller.close());
          fileStream.on("error", (err) => controller.error(err));
        },
      });

      return new NextResponse(webStream as unknown as BodyInit, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": mimeType,
          "Content-Disposition": `inline; filename="${encodeURIComponent(file.display_name)}"`,
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      });
    }

    // 2. Tam Dosya Yanıtı (200 OK)
    const fileBuffer = fs.readFileSync(diskPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Length": String(fileSize),
        "Content-Type": mimeType,
        "Accept-Ranges": "bytes",
        "Content-Disposition": `inline; filename="${encodeURIComponent(file.display_name)}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return new NextResponse("Yetkisiz erişim.", { status: 401 });
    }
    console.error("Dosya akış hatası:", err);
    return new NextResponse("Dosya akışı sırasında hata oluştu.", { status: 500 });
  }
}
