// ============================================================================
// BELGELER PAYLAŞIM — CANONICAL DOKÜMAN BAŞLIKLARI VE GÜVENLİ DOSYA ADI SÖZLEŞMESİ
// ============================================================================

import type { BelgePaylasimDocumentId } from "./types";

export interface BelgeDocumentDescriptor {
  readonly id: BelgePaylasimDocumentId;
  readonly title: string;
  readonly downloadFilename: string;
}

export const BELGE_DOCUMENT_DESCRIPTORS: Record<BelgePaylasimDocumentId, BelgeDocumentDescriptor> = {
  "beton-dokum-tutanagi": {
    id: "beton-dokum-tutanagi",
    title: "Beton Döküm Tutanağı",
    downloadFilename: "Beton-Dokum-Tutanagi.pdf",
  },
  "santiye-sefi-taahhutnamesi": {
    id: "santiye-sefi-taahhutnamesi",
    title: "Şantiye Şefi İşe Başlama Taahhütnamesi",
    downloadFilename: "Santiye-Sefi-Taahhutnamesi.pdf",
  },
  "santiye-sefi-istifa-dilekcesi": {
    id: "santiye-sefi-istifa-dilekcesi",
    title: "Şantiye Şefliği İstifa Dilekçesi",
    downloadFilename: "Santiye-Sefi-Istifa-Dilekcesi.pdf",
  },
  "insaat-ruhsati-dilekcesi": {
    id: "insaat-ruhsati-dilekcesi",
    title: "İnşaat Ruhsatı Başvuru Dilekçesi",
    downloadFilename: "Insaat-Ruhsati-Dilekcesi.pdf",
  },
  "santiye-sefi-sozlesmesi": {
    id: "santiye-sefi-sozlesmesi",
    title: "Şantiye Şefliği Hizmet Sözleşmesi",
    downloadFilename: "Santiye-Sefi-Sozlesmesi.pdf",
  },
};

export const DEFAULT_BELGE_TITLE = "Paylaşılan PDF Belgesi";
export const DEFAULT_BELGE_INLINE_FILENAME = "paylasilan-belge.pdf";
export const DEFAULT_BELGE_DOWNLOAD_FILENAME = "Paylasilan-Belge.pdf";

export function isKnownBelgeDocumentId(id: string): id is BelgePaylasimDocumentId {
  return Object.prototype.hasOwnProperty.call(BELGE_DOCUMENT_DESCRIPTORS, id);
}

export function getBelgeDocumentTitle(documentId?: string | null): string {
  if (documentId && isKnownBelgeDocumentId(documentId)) {
    return BELGE_DOCUMENT_DESCRIPTORS[documentId].title;
  }
  return DEFAULT_BELGE_TITLE;
}

export function getBelgeDownloadFilename(documentId?: string | null): string {
  if (documentId && isKnownBelgeDocumentId(documentId)) {
    return BELGE_DOCUMENT_DESCRIPTORS[documentId].downloadFilename;
  }
  return DEFAULT_BELGE_DOWNLOAD_FILENAME;
}

/**
 * Dosya adındaki tüm ASCII-dışı, CR/LF, tırnak ve tehlikeli karakterleri temizler.
 * Kesinlikle tek bir `.pdf` uzantısı ile sonlandırır.
 */
export function sanitizePdfFilename(filename: string): string {
  const stripped = filename
    .replace(/\.\.+/g, "")
    .replace(/[\r\n\t"]/g, "")
    .replace(/[\\/]/g, "-")
    .trim();
  const withoutExt = stripped.replace(/\.pdf$/i, "");
  const safeAscii = withoutExt.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  return `${safeAscii || "Paylasilan-Belge"}.pdf`;
}

/**
 * HTTP Content-Disposition başlığı üretir:
 * - inline: 'inline; filename="paylasilan-belge.pdf"' (geriye uyumlu standart)
 * - attachment: 'attachment; filename="...pdf"' (güvenli allowlist dosya adı)
 */
export function getBelgeContentDisposition(
  documentId?: string | null,
  mode: "inline" | "attachment" = "inline"
): string {
  if (mode === "attachment") {
    const raw = getBelgeDownloadFilename(documentId);
    return `attachment; filename="${sanitizePdfFilename(raw)}"`;
  }
  return `inline; filename="${DEFAULT_BELGE_INLINE_FILENAME}"`;
}
