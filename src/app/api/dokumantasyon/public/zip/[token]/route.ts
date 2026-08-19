// ============================================================================
// GET /api/dokumantasyon/public/zip/[token] — TÜMÜNÜ ZIP OLARAK İNDİRME
// ============================================================================

import { NextResponse } from "next/server";
import {
  getPublicShareInfo,
  verifyShareAccessJwt,
  incrementShareDownload,
} from "@/lib/dokumantasyon/public-share";
import { getFile } from "@/lib/dokumantasyon/files";
import { cookies } from "next/headers";
import JSZip from "jszip";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;
    const shareInfo = await getPublicShareInfo(token);

    if (shareInfo.status !== "ok" || !shareInfo.link || !shareInfo.items) {
      const statusCode = shareInfo.status === "revoked" || shareInfo.status === "expired" ? 410 : 400;
      return new NextResponse(
        shareInfo.errorMessage || "Geçersiz veya süresi dolmuş bağlantı.",
        { status: statusCode }
      );
    }

    const link = shareInfo.link;

    // Şifre Koruması Kontrolü
    if (link.password_hash) {
      const cookieStore = await cookies();
      const cookieJwt = cookieStore.get(`dok_share_${link.id}`)?.value;
      const authHeader = request.headers.get("authorization")?.replace("Bearer ", "");
      const url = new URL(request.url);
      const queryAuth = url.searchParams.get("auth") || undefined;

      const tokenToCheck = queryAuth || authHeader || cookieJwt;
      const isAuthorized = await verifyShareAccessJwt(tokenToCheck, link.id);

      if (!isAuthorized) {
        return new NextResponse("Bu arşiv için şifre doğrulaması gereklidir.", {
          status: 401,
        });
      }
    }

    const zip = new JSZip();
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const fetchHeaders: HeadersInit = {};
    if (blobToken) {
      fetchHeaders["Authorization"] = `Bearer ${blobToken}`;
    }

    // Dosyaları ZIP içine ekle
    for (const item of shareInfo.items) {
      const file = await getFile(item.file_id);
      if (!file || file.deleted_at) continue;

      try {
        const zipPath = item.relative_path || item.snapshot_name;

        if (file.blob_url?.startsWith("local:")) {
          const fileNameOnDisk = file.blob_url.replace("local:", "");
          const { getLocalStorageDir } = await import("@/lib/dokumantasyon/local-store");
          const path = await import("path");
          const fs = await import("fs");
          const diskPath = path.default.join(getLocalStorageDir(), fileNameOnDisk);

          if (fs.default.existsSync(diskPath)) {
            const buffer = fs.default.readFileSync(diskPath);
            zip.file(zipPath, buffer);
          }
        } else {
          const blobRes = await fetch(file.blob_url, { headers: fetchHeaders });
          if (blobRes.ok) {
            const arrayBuffer = await blobRes.arrayBuffer();
            zip.file(zipPath, arrayBuffer);
          }
        }
      } catch (e) {
        console.error(`ZIP'e dosya eklenirken hata: ${item.snapshot_name}`, e);
      }
    }

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    // İndirme sayacını artır
    await incrementShareDownload(link.id);

    const safeTitle = (link.title || "arsiv")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .replace(/_+/g, "_");
    const zipFilename = `${safeTitle}.zip`;

    const responseHeaders = new Headers();
    responseHeaders.set(
      "Content-Disposition",
      `attachment; filename="${zipFilename}"; filename*=UTF-8''${encodeURIComponent(zipFilename)}`
    );
    responseHeaders.set("Content-Type", "application/zip");
    responseHeaders.set("Content-Length", String(zipBuffer.length));
    responseHeaders.set("Cache-Control", "private, no-cache, no-store, must-revalidate");

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("ZIP oluşturma hatası:", err);
    return new NextResponse("Arşiv oluşturulurken bir hata oluştu.", {
      status: 500,
    });
  }
}
