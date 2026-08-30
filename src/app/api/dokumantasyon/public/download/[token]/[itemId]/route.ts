// ============================================================================
// GET /api/dokumantasyon/public/download/[token]/[itemId] — TEKİL DOSYA İNDİRME / ÖNİZLEME
// ============================================================================

import { NextResponse } from "next/server";
import {
  getPublicShareInfo,
  verifyShareAccessJwt,
  incrementShareDownload,
} from "@/lib/dokumantasyon/public-share";
import { getFile } from "@/lib/dokumantasyon/files";
import { cookies } from "next/headers";
import { getBlobCommandOptions, hasBlobAccessConfiguration, hasDatabaseUrl } from "@/lib/dokumantasyon/runtime-mode";
import { getDb } from "@/lib/dokumantasyon/db";
import { readLocalDb, getLocalStorageDir } from "@/lib/dokumantasyon/local-store";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ token: string; itemId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { token, itemId } = await params;
    const url = new URL(request.url);
    const isInline = url.searchParams.get("inline") === "1" || url.searchParams.get("preview") === "1";

    const shareInfo = await getPublicShareInfo(token);

    if (shareInfo.status !== "ok" || !shareInfo.link || !shareInfo.items) {
      const statusCode = shareInfo.status === "revoked" || shareInfo.status === "expired" ? 410 : 400;
      return new NextResponse(
        shareInfo.errorMessage || "Geçersiz veya süresi dolmuş bağlantı.",
        { status: statusCode }
      );
    }

    const link = shareInfo.link;

    // 1. Şifre Koruması Kontrolü
    if (link.password_hash) {
      const cookieStore = await cookies();
      const cookieJwt = cookieStore.get(`dok_share_${link.id}`)?.value;
      const authHeader = request.headers.get("authorization")?.replace("Bearer ", "");
      const queryAuth = url.searchParams.get("auth") || undefined;

      const tokenToCheck = queryAuth || authHeader || cookieJwt;
      const isAuthorized = await verifyShareAccessJwt(tokenToCheck, link.id);

      if (!isAuthorized) {
        return new NextResponse("Bu dosya için şifre doğrulaması gereklidir.", {
          status: 401,
        });
      }
    }

    // 2. Snapshot Öğesini Bul
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

    // 3. İndirme Sayacını Artır (Önizlemede sayaç düşülmez)
    if (!isInline) {
      const isAllowed = await incrementShareDownload(link.id);
      if (!isAllowed) {
        return new NextResponse("İndirme limiti aşıldı veya bağlantı geçerli değil.", {
          status: 403,
        });
      }
    }

    // 4. Snapshot Versiyonu Tespiti
    let targetBlobPathname = file.blob_pathname;
    let targetBlobUrl = file.blob_url;

    if (item.file_version_id) {
      if (!hasDatabaseUrl()) {
        const db = readLocalDb();
        const ver = db.file_versions?.find((v) => v.id === item.file_version_id);
        if (ver) {
          targetBlobPathname = ver.blob_pathname;
          targetBlobUrl = ver.blob_url;
        }
      } else {
        const sql = getDb();
        const verRows = await sql`
          SELECT blob_pathname, blob_url FROM dok_file_versions WHERE id = ${item.file_version_id} LIMIT 1;
        `;
        if (verRows.length > 0) {
          targetBlobPathname = verRows[0].blob_pathname;
          targetBlobUrl = verRows[0].blob_url;
        }
      }
    }

    let fileBuffer: Buffer | ArrayBuffer | Uint8Array | ReadableStream<Uint8Array>;

    if (targetBlobUrl?.startsWith("local:")) {
      const fileNameOnDisk = targetBlobPathname.startsWith("dok_storage/")
        ? targetBlobPathname.replace("dok_storage/", "")
        : targetBlobUrl.replace("local:", "");
      const path = await import("path");
      const fs = await import("fs");
      const diskPath = path.default.join(getLocalStorageDir(), fileNameOnDisk);

      if (!fs.default.existsSync(diskPath)) {
        return new NextResponse("Dosya depolama alanında bulunamadı.", { status: 404 });
      }

      fileBuffer = fs.default.readFileSync(diskPath);
    } else {
      // Vercel Private Blob: Resmi SDK get() ile güvenli okuma
      const { get } = await import("@vercel/blob");
      if (!hasBlobAccessConfiguration()) {
        return new NextResponse("Depolama yapılandırması eksik.", { status: 503 });
      }

      const getResult = await get(targetBlobPathname, {
        access: "private",
        ...getBlobCommandOptions(),
      });

      if (!getResult || !getResult.stream) {
        return new NextResponse("Dosya depolama alanından alınamadı.", {
          status: 502,
        });
      }

      fileBuffer = getResult.stream;
    }

    const dispositionType = isInline ? "inline" : "attachment";
    const encodedFilename = encodeURIComponent(item.snapshot_name);

    const responseHeaders = new Headers();
    responseHeaders.set(
      "Content-Disposition",
      `${dispositionType}; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
    );
    responseHeaders.set("Content-Type", item.snapshot_mime_type || "application/octet-stream");
    responseHeaders.set("Content-Length", String(item.snapshot_size_bytes));
    responseHeaders.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
    responseHeaders.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    responseHeaders.set("Referrer-Policy", "no-referrer");
    responseHeaders.set("X-Content-Type-Options", "nosniff");

    return new NextResponse(fileBuffer as unknown as BodyInit, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("Dosya indirme / önizleme hatası:", err);
    return new NextResponse("Dosya işlenirken bir hata oluştu.", {
      status: 500,
    });
  }
}
