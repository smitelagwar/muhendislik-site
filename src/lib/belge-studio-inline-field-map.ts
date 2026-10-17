import {
  DOCUMENT_EDITABLE_FIELDS,
  DOCUMENT_PDF_ONLY_FIELDS,
} from "./document-field-contracts";
import { DOCUMENTS } from "./documents-data";

export type BelgeDocumentId = keyof typeof DOCUMENT_EDITABLE_FIELDS;

/**
 * Raw annotation structure as returned by Mozilla PDF.js `page.getAnnotations({ intent: "display" })`.
 */
export interface RawPdfAnnotation {
  id?: string;
  fieldName?: string;
  fieldType?: string;
  subtype?: string;
  rect?: number[];
  readOnly?: boolean;
  multiLine?: boolean;
  maxLen?: number | null;
  textAlignment?: number;
  [key: string]: unknown;
}

/**
 * Minimal viewport interface required for CSS coordinate conversion.
 * Compatible with PDF.js `PageViewport`.
 */
export interface ViewportLike {
  width: number;
  height: number;
  scale?: number;
  rotation?: number;
  convertToViewportPoint?: (x: number, y: number) => [number, number] | number[] | readonly number[];
  convertToViewportRectangle?: (rect: number[]) => [number, number, number, number] | number[] | readonly number[];
}

/**
 * Normalized 2D CSS pixel rectangle relative to the preview frame / canvas.
 */
export interface InlineFieldViewportRect {
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

/**
 * Fully verified descriptor for an interactive inline field on the PDF preview.
 */
export interface InlineFieldDescriptor {
  fieldKey: string;
  documentId: BelgeDocumentId;
  pageNumber: number;
  pdfRect: [number, number, number, number];
  viewportRect: InlineFieldViewportRect;
  readOnly: boolean;
  multiline: boolean;
  label: string;
  placeholder?: string;
}

export type InlineFieldDiagnosticCode =
  | "MISSING_FIELD_NAME"
  | "NON_WIDGET_SUBTYPE"
  | "NON_TX_FIELD_TYPE"
  | "PDF_ONLY_LABEL"
  | "NOT_IN_ALLOWLIST"
  | "INVALID_RECT"
  | "NON_FINITE_COORDINATES"
  | "ZERO_OR_NEGATIVE_AREA"
  | "OUT_OF_BOUNDS"
  | "DUPLICATE_FIELD";

export interface InlineFieldDiagnostic {
  code: InlineFieldDiagnosticCode;
  reason: string;
  fieldName?: string;
  pageNumber: number;
  annotationId?: string;
  rect?: number[];
}

export interface InlineFieldMapResult {
  documentId: BelgeDocumentId;
  pageNumber: number;
  fields: InlineFieldDescriptor[];
  diagnostics: InlineFieldDiagnostic[];
}

/**
 * Pre-indexed labels and field configs from `DOCUMENTS` metadata for fast O(1) lookup.
 */
const FIELD_METADATA_MAP: Record<
  string,
  Record<string, { label: string; placeholder?: string; type?: "text" | "textarea" | "date" }>
> = {};

for (const doc of DOCUMENTS) {
  const map: Record<string, { label: string; placeholder?: string; type?: "text" | "textarea" | "date" }> = {};
  for (const field of doc.fields) {
    map[field.key] = {
      label: field.label,
      placeholder: field.placeholder,
      type: field.type,
    };
  }
  FIELD_METADATA_MAP[doc.id] = map;
}

/**
 * Convert a PDF-space rectangle [x1, y1, x2, y2] to a CSS-space normalized viewport rectangle.
 * Handles both `convertToViewportRectangle` and `convertToViewportPoint` mechanisms of PDF.js.
 */
export function convertPdfRectToViewportRect(
  viewport: ViewportLike,
  rect: readonly number[]
): InlineFieldViewportRect | null {
  if (!rect || !Array.isArray(rect) || rect.length < 4) {
    return null;
  }

  const [x1, y1, x2, y2] = rect;
  if (
    !Number.isFinite(x1) ||
    !Number.isFinite(y1) ||
    !Number.isFinite(x2) ||
    !Number.isFinite(y2)
  ) {
    return null;
  }

  let minX: number;
  let minY: number;
  let maxX: number;
  let maxY: number;

  if (typeof viewport.convertToViewportRectangle === "function") {
    const vr = viewport.convertToViewportRectangle([x1, y1, x2, y2]);
    minX = Math.min(vr[0], vr[2]);
    minY = Math.min(vr[1], vr[3]);
    maxX = Math.max(vr[0], vr[2]);
    maxY = Math.max(vr[1], vr[3]);
  } else if (typeof viewport.convertToViewportPoint === "function") {
    const p1 = viewport.convertToViewportPoint(x1, y1);
    const p2 = viewport.convertToViewportPoint(x2, y2);
    minX = Math.min(p1[0], p2[0]);
    minY = Math.min(p1[1], p2[1]);
    maxX = Math.max(p1[0], p2[0]);
    maxY = Math.max(p1[1], p2[1]);
  } else {
    return null;
  }

  const width = maxX - minX;
  const height = maxY - minY;

  if (width <= 0 || height <= 0 || !Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }

  return {
    left: Number(minX.toFixed(2)),
    top: Number(minY.toFixed(2)),
    width: Number(width.toFixed(2)),
    height: Number(height.toFixed(2)),
    right: Number(maxX.toFixed(2)),
    bottom: Number(maxY.toFixed(2)),
  };
}

/**
 * Pure mapping and validation function.
 * Takes raw annotations from PDF.js, filters against the strict allowlist, validates geometry,
 * and converts PDF coordinates into CSS pixel layout rectangles.
 */
export function mapPdfAnnotationsToInlineFields(params: {
  documentId: BelgeDocumentId;
  pageNumber: number;
  annotations: readonly RawPdfAnnotation[];
  viewport: ViewportLike;
}): InlineFieldMapResult {
  const { documentId, pageNumber, annotations, viewport } = params;

  const editableList = DOCUMENT_EDITABLE_FIELDS[documentId];
  if (!editableList) {
    return {
      documentId,
      pageNumber,
      fields: [],
      diagnostics: [
        {
          code: "NOT_IN_ALLOWLIST",
          reason: `Geçersiz belge kimliği: '${documentId}'`,
          pageNumber,
        },
      ],
    };
  }

  const editableSet = new Set<string>(editableList);
  const pdfOnlyList = DOCUMENT_PDF_ONLY_FIELDS[documentId];
  const pdfOnlySet = new Set<string>(pdfOnlyList || []);
  const docMeta = FIELD_METADATA_MAP[documentId] || {};

  const fields: InlineFieldDescriptor[] = [];
  const diagnostics: InlineFieldDiagnostic[] = [];
  const seenKeys = new Set<string>();

  for (const ann of annotations) {
    const rawName = ann.fieldName;
    const name = typeof rawName === "string" ? rawName.trim() : "";
    const subtype = ann.subtype;
    const annId = ann.id;
    const rect = ann.rect;

    // 1. Strict Widget subtype check (reject FreeText, Link, etc.)
    if (subtype !== "Widget") {
      diagnostics.push({
        code: "NON_WIDGET_SUBTYPE",
        reason: `'${name || annId || "isimsiz"}' alanı Widget alt tipinde değil (subtype: ${subtype || "tanımsız"})`,
        fieldName: name || undefined,
        pageNumber,
        annotationId: annId,
        rect,
      });
      continue;
    }

    // 2. Missing field name check
    if (!name) {
      diagnostics.push({
        code: "MISSING_FIELD_NAME",
        reason: `Widget annotasyonunun alan adı bulunamadı`,
        pageNumber,
        annotationId: annId,
        rect,
      });
      continue;
    }

    // 3. Reject PDF-only label fields (e.g. istifa labels)
    if (pdfOnlySet.has(name)) {
      diagnostics.push({
        code: "PDF_ONLY_LABEL",
        reason: `'${name}' alanı salt PDF etiketi olduğu için düzenlenemez`,
        fieldName: name,
        pageNumber,
        annotationId: annId,
        rect,
      });
      continue;
    }

    // 4. Strict allowlist check
    if (!editableSet.has(name)) {
      diagnostics.push({
        code: "NOT_IN_ALLOWLIST",
        reason: `'${name}' alanı ${documentId} için izin verilen alanlar listesinde değil`,
        fieldName: name,
        pageNumber,
        annotationId: annId,
        rect,
      });
      continue;
    }

    // 5. Duplicate field check on the same page
    if (seenKeys.has(name)) {
      diagnostics.push({
        code: "DUPLICATE_FIELD",
        reason: `'${name}' alanı bu sayfada birden fazla kez tanımlanmış`,
        fieldName: name,
        pageNumber,
        annotationId: annId,
        rect,
      });
      continue;
    }

    // 6. Geometry validity check
    if (!rect || !Array.isArray(rect) || rect.length < 4) {
      diagnostics.push({
        code: "INVALID_RECT",
        reason: `'${name}' alanı için geçerli bir rect dizisi bulunamadı`,
        fieldName: name,
        pageNumber,
        annotationId: annId,
        rect,
      });
      continue;
    }

    const viewportRect = convertPdfRectToViewportRect(viewport, rect);
    if (!viewportRect) {
      diagnostics.push({
        code: "ZERO_OR_NEGATIVE_AREA",
        reason: `'${name}' alanı için hesaplanan koordinat veya alan geçersiz`,
        fieldName: name,
        pageNumber,
        annotationId: annId,
        rect,
      });
      continue;
    }

    // 7. Bounds check (completely outside the viewport area)
    if (
      viewportRect.right < 0 ||
      viewportRect.left > viewport.width ||
      viewportRect.bottom < 0 ||
      viewportRect.top > viewport.height
    ) {
      diagnostics.push({
        code: "OUT_OF_BOUNDS",
        reason: `'${name}' alanı tamamen viewport sınırları dışında`,
        fieldName: name,
        pageNumber,
        annotationId: annId,
        rect,
      });
      continue;
    }

    seenKeys.add(name);
    const fieldMeta = docMeta[name];
    const isMultiline =
      ann.multiLine === true ||
      fieldMeta?.type === "textarea";

    fields.push({
      fieldKey: name,
      documentId,
      pageNumber,
      pdfRect: [rect[0], rect[1], rect[2], rect[3]],
      viewportRect,
      readOnly: !!ann.readOnly,
      multiline: isMultiline,
      label: fieldMeta?.label || name,
      placeholder: fieldMeta?.placeholder,
    });
  }

  return {
    documentId,
    pageNumber,
    fields,
    diagnostics,
  };
}
