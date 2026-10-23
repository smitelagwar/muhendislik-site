// ============================================================================
// POST /api/belgeler/paylasim — GÜVENLİ SALT-OKUNUR PDF PAYLAŞIM BAĞLANTISI OLUŞTURMA
// ============================================================================

import { NextResponse } from "next/server";
import { getBelgeBlobStore } from "@/lib/belge-paylasim/blob-store";
import {
  BelgeShareServiceError,
  createShareReservation,
  failShareReservation,
  finalizeShareReservation,
} from "@/lib/belge-paylasim/service-core";
import {
  RequestValidationError,
  validateShareCreateRequest,
} from "@/lib/belge-paylasim/request-validation";
import {
  renderFlattenedPdf,
  ServerPdfRenderError,
} from "@/lib/belge-paylasim/server-pdf";

export const dynamic = "force-dynamic";

const SECURITY_HEADERS: Record<string, string> = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

export async function POST(request: Request) {
  try {
    // 1. İstek parametrelerini, same-origin durumunu ve alan allowlist'ini doğrula
    const validatedInput = await validateShareCreateRequest(request);

    // 2. DB'de rezervasyon veya var olan hazır kaydı sorgula (idempotent kontrol + kota)
    const reservation = await createShareReservation({
      clientRequestId: validatedInput.clientRequestId,
      documentId: validatedInput.documentId,
      values: validatedInput.values,
      creatorIp: validatedInput.creatorIp,
    });

    // 2a. Daha önce bu clientRequestId ile hazır bir bağlantı zaten üretilmişse idempotent dön
    if (reservation.status === "existing_ready" && reservation.record && reservation.tokens) {
      return NextResponse.json(
        {
          status: "ready",
          url: reservation.url,
          viewToken: reservation.tokens.viewToken,
          manageToken: reservation.tokens.manageToken,
          expiresAt: reservation.expiresAt,
          documentId: reservation.record.documentId,
        },
        {
          status: 200,
          headers: SECURITY_HEADERS,
        }
      );
    }

    if (!reservation.record || !reservation.tokens) {
      throw new BelgeShareServiceError("RESERVATION_FAILED", "Rezervasyon kaydı açılamadı.", 500);
    }

    const { record, tokens } = reservation;

    try {
      // 3. Sunucuda PDF şablonuna bas ve form alanlarını tamamen düzleştir (flatten: true)
      const rendered = await renderFlattenedPdf(
        validatedInput.documentId,
        validatedInput.values
      );

      // 4. Özel depolamaya (Private Vercel Blob) yükle
      const blobStore = getBelgeBlobStore();
      await blobStore.put(record.blobPathname, rendered.pdfBytes);

      // 5. Veritabanındaki rezervasyonu 'ready' durumuna getir
      await finalizeShareReservation(record.id, rendered.sizeBytes, rendered.pdfSha256);

      // 6. Başarılı 201 yanıtını dön
      return NextResponse.json(
        {
          status: "ready",
          url: reservation.url,
          viewToken: tokens.viewToken,
          manageToken: tokens.manageToken,
          expiresAt: reservation.expiresAt,
          documentId: record.documentId,
        },
        {
          status: 201,
          headers: SECURITY_HEADERS,
        }
      );
    } catch (innerError) {
      // PDF veya Blob yükleme aşamasında hata oluşursa rezervasyonu failed olarak işaretle
      const errorCode =
        innerError instanceof ServerPdfRenderError
          ? innerError.code
          : "RENDER_OR_UPLOAD_FAILED";
      await failShareReservation(record.id, errorCode).catch(() => {});
      throw innerError;
    }
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode, headers: SECURITY_HEADERS }
      );
    }

    if (error instanceof BelgeShareServiceError) {
      const headers = { ...SECURITY_HEADERS };
      if (error.statusCode === 429) {
        headers["Retry-After"] = "900"; // 15 dakika
      }
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode, headers }
      );
    }

    if (error instanceof ServerPdfRenderError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode, headers: SECURITY_HEADERS }
      );
    }

    console.error("Belge paylaşım oluşturma beklenmeyen hata:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Paylaşım bağlantısı oluşturulurken bir hata meydana geldi.",
      },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}

export async function GET() {
  return new NextResponse(null, {
    status: 405,
    headers: { Allow: "POST", ...SECURITY_HEADERS },
  });
}
