// ============================================================================
// GET /api/belgeler/paylasim/[token]/pdf — YETKİLİ VE SALT-OKUNUR PDF AKIŞI
// ============================================================================

import { NextResponse } from "next/server";
import { getBelgeBlobStore } from "@/lib/belge-paylasim/blob-store";
import { getShareByViewToken } from "@/lib/belge-paylasim/service-core";

export const dynamic = "force-dynamic";

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Type": "application/pdf",
  "Content-Disposition": 'inline; filename="paylasilan-belge.pdf"',
  "Cache-Control": "private, no-store, no-cache, must-revalidate",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { token: viewToken } = await params;

    if (!viewToken || !viewToken.trim()) {
      return new NextResponse("Geçersiz bağlantı belirteci.", {
        status: 400,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // 1. viewToken kontrolü ve yaşam döngüsü doğrulaması
    const shareResult = await getShareByViewToken(viewToken.trim());

    if (shareResult.status === "not_found") {
      return new NextResponse("Belge bağlantısı bulunamadı.", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    if (shareResult.status === "revoked" || shareResult.status === "expired") {
      return new NextResponse(
        shareResult.status === "revoked"
          ? "Bu paylaşım bağlantısı oluşturan kişi tarafından iptal edilmiştir."
          : "Bu paylaşım bağlantısının 90 günlük geçerlilik süresi dolmuştur.",
        {
          status: 410,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "private, no-store, no-cache, must-revalidate",
            "X-Robots-Tag": "noindex, nofollow, noarchive",
          },
        }
      );
    }

    if (shareResult.status === "not_ready") {
      return new NextResponse("Belge hazırlanıyor, lütfen birazdan tekrar deneyin.", {
        status: 425,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const { record } = shareResult;

    // 2. Private Blob deposundan PDF verisini getir
    const blobStore = getBelgeBlobStore();
    const blobResponse = await blobStore.get(record.blobPathname);

    if (!blobResponse || !blobResponse.body) {
      return new NextResponse("Belge dosyası depolama alanından alınamadı.", {
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const responseHeaders = new Headers(SECURITY_HEADERS);
    if (record.sizeBytes) {
      responseHeaders.set("Content-Length", String(record.sizeBytes));
    }

    return new NextResponse(blobResponse.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("PDF akışı sunulurken hata oluştu:", err);
    return new NextResponse("Belge yüklenirken bir sunucu hatası meydana geldi.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

export async function HEAD(request: Request, { params }: RouteParams) {
  const getResponse = await GET(request, { params });
  return new NextResponse(null, {
    status: getResponse.status,
    headers: getResponse.headers,
  });
}

export async function POST() {
  return new NextResponse(null, { status: 405, headers: { Allow: "GET, HEAD" } });
}

export async function DELETE() {
  return new NextResponse(null, { status: 405, headers: { Allow: "GET, HEAD" } });
}
