import {
  DOCUMENT_EDITABLE_FIELDS,
} from "./document-field-contracts";
import {
  mapPdfAnnotationsToInlineFields,
  type BelgeDocumentId,
  type RawPdfAnnotation,
  type ViewportLike,
} from "./belge-studio-inline-field-map";

/**
 * Normalized 2D CSS-space rectangle (0..1) relative to the PDF page dimensions.
 * `left` and `width` are expressed as a fraction of page width.
 * `top` and `height` are expressed as a fraction of page height.
 */
export type FieldFocusRect = {
  fieldKey: string;
  pageNumber: number;
  left: number; // 0..1
  top: number; // 0..1
  width: number; // 0..1
  height: number; // 0..1
};

export type FieldFocusGeometry = {
  rects: Record<string, FieldFocusRect>;
  diagnostics: string[];
};

/**
 * Minimal page interface compatible with Mozilla PDF.js `PDFPageProxy`.
 */
export interface PdfPageLike {
  getViewport(options: { scale: number }): ViewportLike;
  getAnnotations(options: { intent: string }): Promise<RawPdfAnnotation[]>;
}

/**
 * Minimal document interface compatible with Mozilla PDF.js `PDFDocumentProxy`.
 */
export interface PdfDocumentLike {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfPageLike>;
}

/**
 * Canonical form input DOM ID prefixes per studio component.
 * Guaranteed to match each studio's `getFieldId` implementation.
 */
export const DOCUMENT_STUDIO_PREFIXES: Record<BelgeDocumentId, string> = {
  "beton-dokum-tutanagi": "beton-dokum-",
  "insaat-ruhsati-dilekcesi": "insaat-ruhsati-",
  "santiye-sefi-istifa-dilekcesi": "istifa-",
  "santiye-sefi-sozlesmesi": "sozlesme-",
  "santiye-sefi-taahhutnamesi": "taahhutname-",
};

/**
 * Builds a fast O(1) lookup map from form element DOM ID to verified editable field key.
 *
 * Example:
 * `buildFieldIdMap('beton-dokum-tutanagi', 'beton-dokum-')`
 * yields:
 * `{ 'beton-dokum-yer': 'yer', 'beton-dokum-tarih': 'tarih', ... }`
 */
export function buildFieldIdMap(
  documentId: BelgeDocumentId,
  prefix: string
): Record<string, string> {
  const fields = DOCUMENT_EDITABLE_FIELDS[documentId] ?? [];
  const map: Record<string, string> = {};
  for (const fieldKey of fields) {
    map[`${prefix}${fieldKey}`] = fieldKey;
  }
  return map;
}

/**
 * Resolves a focused DOM element to its verified document editable field key.
 *
 * Strict safety rules:
 * - Accepts only `INPUT`, `TEXTAREA`, and `SELECT` elements.
 * - Returns `null` for `BUTTON`, `A`, containers, or non-form interactive elements.
 * - Returns `null` for unknown IDs or PDF-only labels not present in the allowlist.
 */
export function resolveFocusedFieldKey(
  idMap: Record<string, string>,
  target: unknown
): string | null {
  if (!target || typeof target !== "object") return null;

  const el = target as { id?: unknown; tagName?: unknown };
  if (typeof el.tagName !== "string" || typeof el.id !== "string") {
    return null;
  }

  const tagName = el.tagName.toUpperCase();
  if (tagName !== "INPUT" && tagName !== "TEXTAREA" && tagName !== "SELECT") {
    return null;
  }

  const id = el.id.trim();
  if (!id) return null;

  return idMap[id] ?? null;
}

/**
 * Returns the DOM element ID for a given field key and studio prefix.
 */
export function getFieldDomId(prefix: string, fieldKey: string): string {
  return `${prefix}${fieldKey}`;
}

/**
 * State object representing the active focus selection in a studio.
 */
export type FieldFocusSelection = {
  documentId: BelgeDocumentId;
  fieldKey: string | null;
  lastFocusedFieldKey: string | null;
  focusEventId: number;
};

export type FocusState = {
  fieldKey: string | null;
  lastFocusedFieldKey: string | null;
  focusEventId: number;
};

export type FocusAction =
  | { type: "FOCUS"; fieldKey: string }
  | { type: "BLUR_TIMEOUT" }
  | { type: "CLEAR_SELECTION" }
  | { type: "SET_FIELD"; fieldKey: string | null }
  | { type: "DOCUMENT_CHANGE"; documentId: BelgeDocumentId };

export const INITIAL_FOCUS_STATE: FocusState = {
  fieldKey: null,
  lastFocusedFieldKey: null,
  focusEventId: 0,
};

/**
 * Pure reducer function for field focus state management.
 * Enforces strict transition rules:
 * - Monotonic `focusEventId` increments ONLY when focus shifts to a new/different fieldKey.
 * - Repeated keystrokes or re-clicks in the same field do NOT increment `focusEventId`.
 * - `BLUR_TIMEOUT` clears `fieldKey` but preserves `lastFocusedFieldKey` for mobile preview tab flash.
 * - `CLEAR_SELECTION` (Esc, Reset, Clear) wipes both `fieldKey` and `lastFocusedFieldKey`.
 * - `DOCUMENT_CHANGE` resets state to clean baseline.
 */
export function reduceFieldFocus(state: FocusState, action: FocusAction): FocusState {
  switch (action.type) {
    case "FOCUS": {
      if (action.fieldKey === state.fieldKey) {
        return state;
      }
      return {
        fieldKey: action.fieldKey,
        lastFocusedFieldKey: action.fieldKey,
        focusEventId: state.focusEventId + 1,
      };
    }
    case "SET_FIELD": {
      if (action.fieldKey === state.fieldKey) {
        return state;
      }
      if (!action.fieldKey) {
        return {
          ...state,
          fieldKey: null,
        };
      }
      return {
        fieldKey: action.fieldKey,
        lastFocusedFieldKey: action.fieldKey,
        focusEventId: state.focusEventId + 1,
      };
    }
    case "BLUR_TIMEOUT": {
      if (state.fieldKey === null) {
        return state;
      }
      return {
        ...state,
        fieldKey: null,
      };
    }
    case "CLEAR_SELECTION": {
      if (state.fieldKey === null && state.lastFocusedFieldKey === null) {
        return state;
      }
      return {
        ...state,
        fieldKey: null,
        lastFocusedFieldKey: null,
      };
    }
    case "DOCUMENT_CHANGE": {
      return {
        fieldKey: null,
        lastFocusedFieldKey: null,
        focusEventId: 0,
      };
    }
    default:
      return state;
  }
}

/**
 * Checks whether an event target belongs to the preview toolbar, canvas navigation,
 * or preview controls where field focus highlight should be retained.
 */
export function isBelgePreviewControl(target: unknown): boolean {
  if (!target || typeof target !== "object") return false;
  const el = target as {
    closest?: (selector: string) => unknown;
    getAttribute?: (name: string) => string | null;
  };
  if (typeof el.closest !== "function") return false;

  return Boolean(
    el.closest(
      '[data-testid="belge-studio-preview-toolbar"], [data-testid="belge-studio-preview-canvas"], [role="toolbar"], .belge-preview-navigation, .belge-preview-toolbar, [data-belge-preview-control="true"]'
    )
  );
}

/**
 * Asynchronously extracts and normalizes interactive field bounding boxes (0..1)
 * across all pages of a PDF document for field-focus highlights.
 *
 * Guaranteed contracts:
 * 1. Uses canonical `scale: 1` viewport per page for resolution-independent geometry.
 * 2. Filters raw annotations through `mapPdfAnnotationsToInlineFields` to enforce
 *    strict widget subtype, editable allowlist, and exclusion of PDF-only labels.
 * 3. Normalizes coordinates relative to viewport: left/width by viewport.width,
 *    top/height by viewport.height.
 * 4. Validates finite positive numbers and 0..1 bounds.
 * 5. Detects duplicate field keys across pages or within pages; if ambiguous, drops
 *    from `rects` and flags as diagnostic instead of guessing or picking the first one.
 */
export async function extractFieldFocusRects(
  pdf: PdfDocumentLike | null | undefined,
  documentId: BelgeDocumentId
): Promise<FieldFocusGeometry> {
  const diagnostics: string[] = [];
  const rects: Record<string, FieldFocusRect> = {};

  if (!pdf || typeof pdf.numPages !== "number" || pdf.numPages <= 0) {
    diagnostics.push("[extractFieldFocusRects] Geçersiz veya boş PDF belgesi");
    return { rects, diagnostics };
  }

  const editableList = DOCUMENT_EDITABLE_FIELDS[documentId];
  if (!editableList) {
    diagnostics.push(`[extractFieldFocusRects] Bilinmeyen belge kimliği: '${documentId}'`);
    return { rects, diagnostics };
  }

  const seenFields = new Map<string, FieldFocusRect>();
  const duplicateKeys = new Set<string>();

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    let page: PdfPageLike;
    try {
      page = await pdf.getPage(pageNumber);
    } catch (err) {
      diagnostics.push(
        `[extractFieldFocusRects] Sayfa ${pageNumber} yüklenemedi: ${err instanceof Error ? err.message : String(err)}`
      );
      continue;
    }

    let viewport: ViewportLike;
    try {
      viewport = page.getViewport({ scale: 1 });
    } catch (err) {
      diagnostics.push(
        `[extractFieldFocusRects] Sayfa ${pageNumber} viewport alınamadı: ${err instanceof Error ? err.message : String(err)}`
      );
      continue;
    }

    if (!viewport || viewport.width <= 0 || viewport.height <= 0) {
      diagnostics.push(`[extractFieldFocusRects] Sayfa ${pageNumber} geçersiz viewport boyutları`);
      continue;
    }

    let rawAnnotations: RawPdfAnnotation[] = [];
    try {
      rawAnnotations = (await page.getAnnotations({ intent: "display" })) ?? [];
    } catch (err) {
      diagnostics.push(
        `[extractFieldFocusRects] Sayfa ${pageNumber} annotasyonları okunamadı: ${err instanceof Error ? err.message : String(err)}`
      );
      continue;
    }

    const mapResult = mapPdfAnnotationsToInlineFields({
      documentId,
      pageNumber,
      annotations: rawAnnotations,
      viewport,
    });

    for (const diag of mapResult.diagnostics) {
      diagnostics.push(
        `[mapPdfAnnotations:${diag.code}] Sayfa ${diag.pageNumber}: ${diag.reason}`
      );
    }

    for (const field of mapResult.fields) {
      const { fieldKey, viewportRect } = field;

      if (seenFields.has(fieldKey)) {
        duplicateKeys.add(fieldKey);
        diagnostics.push(
          `[extractFieldFocusRects] Çakışan alan: '${fieldKey}' birden fazla sayfada veya konumda bulundu`
        );
        continue;
      }

      const left = viewportRect.left / viewport.width;
      const top = viewportRect.top / viewport.height;
      const width = viewportRect.width / viewport.width;
      const height = viewportRect.height / viewport.height;

      const isFiniteCoord =
        Number.isFinite(left) &&
        Number.isFinite(top) &&
        Number.isFinite(width) &&
        Number.isFinite(height);

      const isPositive = width > 0 && height > 0;
      // Allow slight 2% tolerance for sub-pixel boundary rounding
      const isInBounds =
        left >= -0.02 &&
        top >= -0.02 &&
        left + width <= 1.02 &&
        top + height <= 1.02;

      if (!isFiniteCoord || !isPositive || !isInBounds) {
        diagnostics.push(
          `[extractFieldFocusRects] Alan '${fieldKey}' sınır dışı veya geçersiz normalize koordinat: [${left}, ${top}, ${width}, ${height}]`
        );
        continue;
      }

      const normalizedRect: FieldFocusRect = {
        fieldKey,
        pageNumber,
        left: Number(Math.max(0, Math.min(1, left)).toFixed(6)),
        top: Number(Math.max(0, Math.min(1, top)).toFixed(6)),
        width: Number(Math.max(0, Math.min(1, width)).toFixed(6)),
        height: Number(Math.max(0, Math.min(1, height)).toFixed(6)),
      };

      seenFields.set(fieldKey, normalizedRect);
    }
  }

  for (const [key, rect] of seenFields) {
    if (!duplicateKeys.has(key)) {
      rects[key] = rect;
    }
  }

  return { rects, diagnostics };
}
