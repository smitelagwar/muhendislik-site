import { PDFDocument } from "pdf-lib";
import { getDocumentPdfProfiles, DOCUMENT_PDF_PROFILES, normalizePdfFieldValue, type BelgeDocumentId } from "./belgeler-pdf-profiles";
import type { PdfFieldLayout } from "./belgeler-pdf-layout";

export type ReadabilityRisk = "none" | "possible" | "serious" | "unknown";
export interface FieldReadabilityAssessment {
  documentId: BelgeDocumentId; fieldKey: string; charCount: number; isMultiline: boolean;
  nominalWidthPt: number; estimatedFontSizePt: number | null; risk: ReadabilityRisk;
  code: string; message: string | null;
}
// Geometri için ayrı, eskimeye açık bir envanter tutulmaz.
export const CRITICAL_READABILITY_GEOMETRIES = Object.fromEntries(
  Object.entries(DOCUMENT_PDF_PROFILES).flatMap(([id, profiles]) => Object.entries(profiles).map(([key, p]) => [
    `${id}:${key}`, { widthPt: p.rect.width, heightPt: p.rect.height, isMultiline: p.multiline, nominalFontSize: p.size },
  ]))
);

/** Tahmin üretmez. Yalnız aynı değerin gerçek görünüm ölçümünü değerlendirir. */
export function assessFieldReadability(
  documentId: BelgeDocumentId, fieldKey: string, rawValue: string, layout?: PdfFieldLayout,
): FieldReadabilityAssessment {
  const profile = getDocumentPdfProfiles(documentId)[fieldKey];
  const empty = !rawValue.trim() || rawValue.trim() === "-";
  const measured = layout && layout.documentId === documentId && layout.fieldKey === fieldKey && layout.value === normalizePdfFieldValue(rawValue, profile?.multiline ?? false);
  const result: FieldReadabilityAssessment = {
    documentId, fieldKey, charCount: rawValue.trim().length, isMultiline: profile?.multiline ?? false,
    nominalWidthPt: profile?.rect.width ?? 0, estimatedFontSizePt: measured ? layout.fontSize : null,
    risk: empty ? "none" : "unknown", code: empty ? "readability-empty" : "readability-awaiting-layout", message: null,
  };
  if (empty || !measured) return result;
  const serious = layout.overflow || layout.fontSize < 7;
  const possible = layout.fontSize < layout.nominalFontSize * 0.8;
  return {
    ...result, risk: serious ? "serious" : possible ? "possible" : "none",
    code: serious ? "readability-critical-reduction" : possible ? "readability-small-font" : "readability-ok",
    message: serious
      ? `PDF'de yazı ${layout.fontSize.toFixed(2)} puntoya küçüldü; basımda okunması zorlaşacaktır. Metni kısaltmanız önerilir.`
      : possible ? `PDF'de yazı ${layout.fontSize.toFixed(2)} puntoya küçüldü (normal: ${layout.nominalFontSize} punto).` : null,
  };
}

/**
 * Üretilmiş gerçek bir PDF ikili tamponunu doğrudan analiz eden test yardımcısı.
 * Çıktıdaki gerçek AcroForm Default Appearance (DA), font boyutu ve metin bütünlüğünü doğrular.
 */
export async function inspectPdfFieldAppearance(
  pdfBytes: Uint8Array,
  fieldKey: string
): Promise<{
  fieldName: string;
  storedValue: string | null;
  storedLength: number;
  defaultAppearance: string | null;
  appearanceFontSizePt: number | null;
  isMultiline: boolean;
  rect: { width: number; height: number };
}> {
  const doc = await PDFDocument.load(pdfBytes);
  const form = doc.getForm();
  const field = form.getTextField(fieldKey);
  const widgets = field.acroField.getWidgets();
  const firstWidget = widgets[0];
  const rectangle = firstWidget ? firstWidget.getRectangle() : { width: 0, height: 0 };
  const da = field.acroField.getDefaultAppearance() ?? firstWidget?.getDefaultAppearance() ?? null;

  let fontSize: number | null = null;
  if (da) {
    const match = da.match(/(?:^|\s)(\d+(?:\.\d+)?)\s+Tf\b/);
    if (match) {
      fontSize = parseFloat(match[1]);
    }
  }

  const storedValue = field.getText() ?? null;

  return {
    fieldName: fieldKey,
    storedValue,
    storedLength: storedValue?.length ?? 0,
    defaultAppearance: da,
    appearanceFontSizePt: fontSize,
    isMultiline: field.isMultiline(),
    rect: {
      width: Number(rectangle.width.toFixed(2)),
      height: Number(rectangle.height.toFixed(2)),
    },
  };
}
