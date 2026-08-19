// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — DOSYA VERSİYON YÖNETİMİ API ENDPOINT'İ
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireDokumantasyonAdmin } from "@/lib/dokumantasyon/auth";
import { getFileVersions, createNewFileVersion } from "@/lib/dokumantasyon/versions";

export const dynamic = "force-dynamic";

/**
 * GET: Dosyanın tüm versiyon geçmişini döndürür
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireDokumantasyonAdmin();

    const { id: fileId } = await params;
    if (!fileId) {
      return NextResponse.json({ success: false, error: "Geçersiz dosya ID." }, { status: 400 });
    }

    const versions = await getFileVersions(fileId);
    return NextResponse.json({ success: true, versions });
  } catch (err: unknown) {
    console.error("Versiyon listeleme hatası:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Sunucu hatası." },
      { status: 500 }
    );
  }
}

/**
 * POST: Dosya için yeni bir versiyon kaydeder (True-Content-Edit / Versioned Save)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireDokumantasyonAdmin();

    const { id: fileId } = await params;
    if (!fileId) {
      return NextResponse.json({ success: false, error: "Geçersiz dosya ID." }, { status: 400 });
    }

    const contentType = req.headers.get("content-type") || "";

    let contentBuffer: Buffer;
    let comment = "Stüdyo düzenlemesi";
    let mimeType: string | undefined;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      if (typeof body.content !== "string") {
        return NextResponse.json(
          { success: false, error: "İçerik (content) string olmalıdır." },
          { status: 400 }
        );
      }
      contentBuffer = Buffer.from(body.content, "utf-8");
      if (body.comment) comment = body.comment;
      if (body.mimeType) mimeType = body.mimeType;
    } else {
      const arrayBuf = await req.arrayBuffer();
      contentBuffer = Buffer.from(arrayBuf);
      const headerComment = req.headers.get("x-version-comment");
      if (headerComment) comment = decodeURIComponent(headerComment);
      mimeType = contentType;
    }

    const newVersion = await createNewFileVersion({
      fileId,
      contentBuffer,
      mimeType,
      comment,
      username: session.username || "admin",
    });

    return NextResponse.json({ success: true, version: newVersion }, { status: 201 });
  } catch (err: unknown) {
    console.error("Versiyon kaydetme hatası:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Sunucu hatası." },
      { status: 500 }
    );
  }
}
