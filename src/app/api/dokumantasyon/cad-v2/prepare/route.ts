// ============================================================================
// POST /api/dokumantasyon/cad-v2/prepare — CAD V2 HAZIRLAMA İSTEĞİ (G11)
// ============================================================================
// Sözleşme: motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md, 31_SOZLESME_TAMAMLAMALARI.md
// Gereksinimler: R18, R19, R20, R27, R43 | Alt kabul: C07, C10

import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { getFile } from "@/lib/dokumantasyon/files";
import { getLocalStorageDir } from "@/lib/dokumantasyon/local-store";
import { CadV2DurableService } from "@/lib/cad-v2/service/cad-v2-durable-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireDokumantasyonAdmin();

    const body = await request.json().catch(() => ({}));
    const { fileId, expectedSourceVersionKey, clientRequestId } = body;

    if (!fileId || typeof fileId !== "string") {
      return NextResponse.json(
        { error: "Geçersiz dosya kimliği (fileId).", code: "INVALID_FILE_ID" },
        { status: 400, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    if (!clientRequestId || typeof clientRequestId !== "string") {
      return NextResponse.json(
        { error: "clientRequestId (UUID) zorunludur.", code: "INVALID_CLIENT_REQUEST_ID" },
        { status: 400, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const file = await getFile(fileId);
    if (!file || file.deleted_at) {
      return NextResponse.json(
        { error: "Dosya bulunamadı.", code: "FILE_NOT_FOUND" },
        { status: 404, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const ext = file.extension?.toLowerCase();
    if (ext !== ".dwg" && ext !== ".dxf") {
      return NextResponse.json(
        { error: "Bu servis yalnızca 2D DWG ve DXF dosyaları içindir.", code: "UNSUPPORTED_FORMAT" },
        { status: 400, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const actualRevisionKey = `${file.id}_${file.updated_at || file.current_version_number || "1"}`;
    const legacyRevisionKey = `${file.id}:${file.current_version_number || 1}:${file.updated_at || file.created_at}:${file.size_bytes}`;
    const isRevisionMatch =
      !expectedSourceVersionKey ||
      expectedSourceVersionKey === actualRevisionKey ||
      expectedSourceVersionKey === legacyRevisionKey ||
      expectedSourceVersionKey.startsWith(`${file.id}_`) ||
      expectedSourceVersionKey.startsWith(`${file.id}:`);

    if (!isRevisionMatch) {
      return NextResponse.json(
        {
          code: "SOURCE_REVISION_CHANGED",
          message: "Dosya revizyonu değişti.",
          retryable: true,
          actualSourceVersionKey: actualRevisionKey,
        },
        { status: 409, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    // Dosya baytlarını oku (yerel depolamadan veya Blob storage'dan)
    let buffer: Buffer | undefined;
    if (file.blob_url?.startsWith("local:")) {
      const fileNameOnDisk = file.blob_url.replace("local:", "");
      const diskPath = path.join(getLocalStorageDir(), fileNameOnDisk);
      if (fs.existsSync(diskPath)) {
        buffer = fs.readFileSync(diskPath);
      }
    } else if (file.blob_pathname || file.blob_url) {
      try {
        const { get } = await import("@vercel/blob");
        const { hasBlobAccessConfiguration, getBlobCommandOptions } = await import("@/lib/dokumantasyon/runtime-mode");
        if (hasBlobAccessConfiguration()) {
          const getResult = await get(file.blob_pathname || file.blob_url, {
            access: "private",
            ...getBlobCommandOptions(),
          });
          if (getResult && (getResult as any).blob) {
            const blobObj = await (getResult as any).blob();
            buffer = Buffer.from(await blobObj.arrayBuffer());
          }
        }
      } catch (e) {
        console.warn("[CAD-V2 Prepare] Blob read fallback failed:", e);
      }

      if (!buffer && file.blob_url?.startsWith("http")) {
        try {
          const httpRes = await fetch(file.blob_url);
          if (httpRes.ok) {
            buffer = Buffer.from(await httpRes.arrayBuffer());
          }
        } catch (fetchErr) {
          console.warn("[CAD-V2 Prepare] Direct HTTP fetch failed:", fetchErr);
        }
      }
    }

    const service = CadV2DurableService.getInstance();
    const result = await service.prepare({
      fileId,
      expectedSourceVersionKey: actualRevisionKey,
      clientRequestId,
      sourceBuffer: buffer,
      fileName: file.display_name,
    });

    const statusCode = result.status === "ready" ? 200 : 202;
    return NextResponse.json(result, {
      status: statusCode,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: err?.message || "Sunucu hatası." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
