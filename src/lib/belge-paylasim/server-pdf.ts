// ============================================================================
// BELGE PAYLAŞIM — SUNUCU TARAFI PDF OLUŞTURMA VE DÜZLEŞTİRME (FLATTEN)
// ============================================================================

import crypto from "crypto";
import {
  generateBetonDokumPdf,
  generateInsaatRuhsatiPdf,
  generateIstifaDilekcesiPdf,
  generateSozlesmePdf,
  generateTaahhutnamePdf,
  type BetonDokumData,
  type InsaatRuhsatiData,
  type IstifaDilekcesiData,
  type SozlesmeData,
  type TaahhutnameData,
} from "../pdf-engine";
import { BELGE_SHARE_CONFIG } from "./config";
import type { BelgePaylasimDocumentId } from "./types";

export interface RenderedServerPdf {
  pdfBytes: Uint8Array;
  sizeBytes: number;
  pdfSha256: string;
}

export class ServerPdfRenderError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = "ServerPdfRenderError";
  }
}

/**
 * Sunucu ortamında form verisini PDF şablonuna basar ve AcroForm alanlarını tamamen kaldırarak (flatten: true)
 * salt-okunur, değiştirilemez bir PDF üretir.
 */
export async function renderFlattenedPdf(
  documentId: BelgePaylasimDocumentId,
  values: Record<string, string>
): Promise<RenderedServerPdf> {
  let pdfBytes: Uint8Array;

  try {
    switch (documentId) {
      case "beton-dokum-tutanagi":
        pdfBytes = await generateBetonDokumPdf(values as unknown as BetonDokumData, { flatten: true });
        break;
      case "santiye-sefi-taahhutnamesi":
        pdfBytes = await generateTaahhutnamePdf(values as unknown as TaahhutnameData, { flatten: true });
        break;
      case "santiye-sefi-istifa-dilekcesi":
        pdfBytes = await generateIstifaDilekcesiPdf(values as unknown as IstifaDilekcesiData, { flatten: true });
        break;
      case "insaat-ruhsati-dilekcesi":
        pdfBytes = await generateInsaatRuhsatiPdf(values as unknown as InsaatRuhsatiData, { flatten: true });
        break;
      case "santiye-sefi-sozlesmesi":
        pdfBytes = await generateSozlesmePdf(values as unknown as SozlesmeData, { flatten: true });
        break;
      default:
        throw new ServerPdfRenderError(
          "UNSUPPORTED_DOCUMENT",
          `Desteklenmeyen belge türü: ${documentId}`,
          400
        );
    }
  } catch (err) {
    if (err instanceof ServerPdfRenderError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    throw new ServerPdfRenderError(
      "PDF_RENDER_FAILED",
      `Sunucuda PDF oluşturma işlemi başarısız oldu: ${msg}`,
      500
    );
  }

  const sizeBytes = pdfBytes.byteLength;

  // 1. PDF üst bilgi doğrulaması
  if (sizeBytes < 100) {
    throw new ServerPdfRenderError(
      "PDF_TOO_SMALL",
      "Oluşturulan PDF verisi bozuk veya çok küçük.",
      500
    );
  }

  const header = Buffer.from(pdfBytes.slice(0, 5)).toString("utf-8");
  if (!header.startsWith("%PDF-")) {
    throw new ServerPdfRenderError(
      "INVALID_PDF_HEADER",
      "Üretilen dosya geçerli bir PDF üst bilgisi taşımıyor.",
      500
    );
  }

  // 2. Boyut tavan kontrolü (azami 3 MiB)
  if (sizeBytes > BELGE_SHARE_CONFIG.MAX_PDF_SIZE_BYTES) {
    throw new ServerPdfRenderError(
      "PDF_SIZE_EXCEEDED",
      `Üretilen PDF boyutu azami ${BELGE_SHARE_CONFIG.MAX_PDF_SIZE_BYTES / (1024 * 1024)} MiB tavanını aştı.`,
      413
    );
  }

  // 3. SHA-256 bütünlük özeti
  const pdfSha256 = crypto.createHash("sha256").update(Buffer.from(pdfBytes)).digest("hex");

  return {
    pdfBytes,
    sizeBytes,
    pdfSha256,
  };
}
