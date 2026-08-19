// ============================================================================
// GET /api/dokumantasyon/public/download/[token]/[itemId] — TEKİL DOSYA İNDİRME
// ============================================================================

import { NextResponse } from "next/server";
import {
  getPublicShareInfo,
  verifyShareAccessJwt,
  incrementShareDownload,
} from "@/lib/dokumantasyon/public-share";
import { getFile } from "@/lib/dokumantasyon/files";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ token: string; itemId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { token, itemId } = await params;
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
        return new NextResponse("Bu dosya için şifre doğrulaması gereklidir.", {
          status: 401,
        });
      }
    }

    // Snapshot öğesini bul (Hem share_item.id hem file_id ile eşleşmeyi destekler)
    const item = shareInfo.items.find((i) => i.id === itemId || i.file_id === itemId);
    if (!item) {
      return new NextResponse("Dosya bu paylaşım paketinde bulunamadı.", {
        status: 404,
      });
    }

    const file = await getFile(item.file_id);
    if (!file || file.deleted_at) {
      return new NextResponse("Dosya sunucuda bulunamadı veya silinmiş.", {
        status: 404,
      });
    }

    // İndirme sayacını artır
    await incrementShareDownload(link.id);

    let fileBuffer: Buffer | ArrayBuffer | Uint8Array | ReadableStream<Uint8Array>;

    if (file.blob_url?.startsWith("local:")) {
      const fileNameOnDisk = file.blob_url.replace("local:", "");
      const { getLocalStorageDir } = await import("@/lib/dokumantasyon/local-store");
      const path = await import("path");
      const fs = await import("fs");
      const diskPath = path.default.join(getLocalStorageDir(), fileNameOnDisk);

      if (!fs.default.existsSync(diskPath)) {
        return new NextResponse("Dosya depolama alanında bulunamadı.", { status: 404 });
      }

      fileBuffer = fs.default.readFileSync(diskPath);
    } else {
      // Private Blob dosyasını oku
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
      const fetchHeaders: HeadersInit = {};
      if (blobToken) {
        fetchHeaders["Authorization"] = `Bearer ${blobToken}`;
      }

      const blobResponse = await fetch(file.blob_url, {
        headers: fetchHeaders,
      });

      if (!blobResponse.ok || !blobResponse.body) {
        return new NextResponse("Dosya depolama alanından alınamadı.", {
          status: 502,
        });
      }

      fileBuffer = blobResponse.body;
    }

    const responseHeaders = new Headers();
    responseHeaders.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(item.snapshot_name)}"; filename*=UTF-8''${encodeURIComponent(item.snapshot_name)}`
    );
    responseHeaders.set("Content-Type", item.snapshot_mime_type || "application/octet-stream");
    responseHeaders.set("Content-Length", String(item.snapshot_size_bytes));
    responseHeaders.set("Cache-Control", "private, no-cache, no-store, must-revalidate");

    return new NextResponse(fileBuffer as any, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("Dosya indirme hatası:", err);
    return new NextResponse("Dosya indirilirken bir hata oluştu.", {
      status: 500,
    });
  }
}
