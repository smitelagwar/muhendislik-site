// ============================================================================
// BELGE PAYLAŞIM — SUNUCU TARAFI PDF OLUŞTURMA VE DÜZLEŞTİRME (FLATTEN)
// ============================================================================

import crypto from "crypto";
import { PDFDict, PDFDocument, PDFName } from "pdf-lib";
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
 * form alanları kaldırılmış bir PDF üretir. Kopyalama veya düzenlemeye karşı DRM sağlamaz.
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
          "Desteklenmeyen belge türü.",
          400
        );
    }
  } catch (err) {
    if (err instanceof ServerPdfRenderError) throw err;
    throw new ServerPdfRenderError(
      "PDF_RENDER_FAILED",
      "PDF oluşturulamadı. Lütfen daha sonra yeniden deneyin.",
      500
    );
  }

  return validateFlattenedPdf(documentId, pdfBytes);
}

/** Validate the actual saved document before the caller can start a Blob PUT. */
export async function validateFlattenedPdf(
  documentId: BelgePaylasimDocumentId,
  pdfBytes: Uint8Array,
): Promise<RenderedServerPdf> {
  const sizeBytes = pdfBytes.byteLength;

  // 1. PDF üst bilgi doğrulaması
  if (sizeBytes < 100) {
    throw new ServerPdfRenderError(
      "PDF_TOO_SMALL",
      "PDF oluşturulamadı. Lütfen daha sonra yeniden deneyin.",
      500
    );
  }

  const header = Buffer.from(pdfBytes.slice(0, 5)).toString("utf-8");
  if (!header.startsWith("%PDF-")) {
    throw new ServerPdfRenderError(
      "INVALID_PDF_HEADER",
      "PDF oluşturulamadı. Lütfen daha sonra yeniden deneyin.",
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

  try {
    const document = await PDFDocument.load(pdfBytes, { updateMetadata: false, throwOnInvalidObject: true });
    const expectedPages = documentId === "santiye-sefi-sozlesmesi" ? 2 : 1;
    if (document.getPageCount() !== expectedPages) {
      throw new ServerPdfRenderError("INVALID_PDF_PAGE_COUNT", "Belge sayfa sayısı doğrulanamadı.");
    }
    const hasWidgets = document.getPages().some((page) => page.node.Annots()?.asArray().some((reference) => {
      const annotation = document.context.lookup(reference, PDFDict);
      return annotation.get(PDFName.of("Subtype")) === PDFName.of("Widget");
    }));
    if (document.catalog.has(PDFName.of("AcroForm")) || hasWidgets) {
      throw new ServerPdfRenderError("PDF_FORM_REMAINS", "Belge salt-okunur biçimde oluşturulamadı.");
    }
  } catch (error) {
    if (error instanceof ServerPdfRenderError) throw error;
    throw new ServerPdfRenderError("INVALID_PDF_DOCUMENT", "PDF içeriği doğrulanamadı.");
  }

  // SHA-256 bütünlük özeti yalnız parse/shape kontrolünden sonra üretilir.
  const pdfSha256 = crypto.createHash("sha256").update(Buffer.from(pdfBytes)).digest("hex");

  return {
    pdfBytes,
    sizeBytes,
    pdfSha256,
  };
}
