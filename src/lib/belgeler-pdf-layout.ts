import type { Font } from "@pdf-lib/fontkit";
import type { PDFOperator } from "pdf-lib";
import type { BelgeDocumentId, PdfFieldProfile } from "./belgeler-pdf-profiles";

export interface PdfBounds { x: number; y: number; width: number; height: number }
export interface PdfWidgetLayout {
  rect: PdfBounds;
  fontSize: number;
  baselines: number[];
  glyphBounds: PdfBounds | null;
  overflow: boolean;
  lineCount: number;
}
export interface PdfFieldLayout {
  documentId: BelgeDocumentId;
  fieldKey: string;
  value: string;
  nominalFontSize: number;
  fontSize: number;
  lineCount: number;
  overflow: boolean;
  widgets: PdfWidgetLayout[];
}
export type PdfFieldLayouts = Record<string, PdfFieldLayout>;
export interface BelgePdfResult { bytes: Uint8Array; layouts: PdfFieldLayouts }

/** Ölçüm, görünüm sağlayıcısının gerçekten çizdiği Tf/Tm/Tj işlemlerinden alınır. */
export function measurePdfAppearance(
  operations: PDFOperator[], metrics: Font, rect: PdfBounds, inset: number,
): PdfWidgetLayout {
  let size = 0;
  let x = 0;
  let y = 0;
  let left = Infinity;
  let bottom = Infinity;
  let right = -Infinity;
  let top = -Infinity;
  const baselines: number[] = [];
  for (const operation of operations) {
    const command = operation.toString();
    if (command.endsWith(" Tf")) size = Number(command.split(" ")[1]);
    if (command.endsWith(" Tm")) {
      const values = command.split(" ").map(Number);
      x = values[4]; y = values[5];
    }
    const encoded = command.match(/^<([\da-fA-F]+)> Tj$/)?.[1];
    if (!encoded) continue;
    baselines.push(rect.y + y);
    let pen = x;
    for (const id of encoded.match(/.{4}/g) ?? []) {
      const glyph = metrics.getGlyph(parseInt(id, 16));
      const scale = size / metrics.unitsPerEm;
      const box = glyph.bbox;
      if ([box.minX, box.maxX, box.minY, box.maxY].every(Number.isFinite)) {
        left = Math.min(left, pen + box.minX * scale);
        right = Math.max(right, pen + box.maxX * scale);
        bottom = Math.min(bottom, y + box.minY * scale);
        top = Math.max(top, y + box.maxY * scale);
      }
      pen += glyph.advanceWidth * scale;
    }
  }
  const glyphBounds = Number.isFinite(left)
    ? { x: rect.x + left, y: rect.y + bottom, width: right - left, height: top - bottom }
    : null;
  // Font kontur yuvarlaması: 300 DPI'da onda bir pikselden küçük fark.
  const tolerance = 0.025;
  return {
    rect, fontSize: size, baselines, glyphBounds, lineCount: baselines.length,
    overflow: Boolean(glyphBounds && (left < inset - tolerance || bottom < inset - tolerance ||
      right > rect.width - inset + tolerance || top > rect.height - inset + tolerance)),
  };
}

export function validatePdfFieldLayout(layout: PdfFieldLayout, profile: PdfFieldProfile, nominal = false): string[] {
  const failures: string[] = [];
  if (!Number.isFinite(layout.fontSize) || layout.fontSize <= 0) failures.push("invalid-font-size");
  if (layout.value.trim() && (!layout.lineCount || !layout.widgets.some((widget) => widget.glyphBounds))) failures.push("missing-drawn-text");
  if (layout.overflow) failures.push("clipped-glyphs");
  if (nominal && layout.value.trim()) {
    if (Math.abs(layout.fontSize - profile.size) > 0.01) failures.push("unexpected-font-reduction");
    if (Math.abs((layout.widgets[0]?.baselines[0] ?? Infinity) - profile.baseline) > 0.25) failures.push("misaligned-baseline");
  }
  return failures;
}
