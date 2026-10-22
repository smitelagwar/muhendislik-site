"use client";

import type { FieldFocusRect } from "@/lib/belge-field-focus";

export type BelgeStudioFieldFocusLayerProps = {
  rect: FieldFocusRect | null;
  visible: boolean;
};

/**
 * Passive, accessible overlay highlighting the active AcroForm widget on the PDF preview.
 *
 * Guarantees:
 * - Positioned via percentages (left, top, width, height) relative to `.belge-preview-frame`.
 * - `pointer-events: none` ensures no interference with pan, zoom, pinch or hotspot interactions.
 * - `aria-hidden="true"` prevents redundant announcements since form input labels already speak.
 * - `z-index: 5` places it safely below the inline-edit layer (`z-index: 10`) and mobile sheets.
 */
export function BelgeStudioFieldFocusLayer({
  rect,
  visible,
}: BelgeStudioFieldFocusLayerProps) {
  if (!visible || !rect) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5] overflow-visible"
      aria-hidden="true"
      data-testid="belge-field-focus-layer"
    >
      <div
        data-testid="belge-field-focus-highlight"
        data-field-key={rect.fieldKey}
        data-page={rect.pageNumber}
        className="belge-field-focus-highlight pointer-events-none absolute rounded-[3px] transition-[left,top,width,height] duration-150 ease-out"
        style={{
          left: `${(rect.left * 100).toFixed(4)}%`,
          top: `${(rect.top * 100).toFixed(4)}%`,
          width: `${(rect.width * 100).toFixed(4)}%`,
          height: `${(rect.height * 100).toFixed(4)}%`,
        }}
      />
    </div>
  );
}
