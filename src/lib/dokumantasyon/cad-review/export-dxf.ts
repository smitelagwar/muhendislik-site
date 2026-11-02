// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — CAD REVIEW DXF EXPORT ENGINE
// AutoCAD AC1015 (AutoCAD 2000+) Uyumlu DXF R15 Dışa Aktarım Motoru
// ============================================================================

import type { CadPoint2d, CadReviewDocument, CadReviewItem } from "./schema";
import { filterReviewItems, type CadExportFilters } from "./export-json";
import { formatCadDistance, formatCadArea, type CadSourceUnitContext } from "./units";

/**
 * Escapes text for DXF entity strings.
 */
function dxfText(str: string): string {
  return str.replace(/\r\n/g, "\\P").replace(/\n/g, "\\P").replace(/\r/g, "\\P");
}

/**
 * Converts a hex color string (e.g. #ef4444) to a 24-bit TrueColor integer for DXF group code 420.
 */
export function hexToTrueColor(hex?: string): number {
  if (!hex) return 0;
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return isNaN(num) ? 0 : num;
}

/**
 * Maps common hex colors to standard AutoCAD Color Index (ACI 1-7).
 */
export function hexToAci(hex?: string): number {
  if (!hex) return 7;
  const clean = hex.replace("#", "").toLowerCase();
  if (clean.startsWith("ef44") || clean.startsWith("ff3b") || clean.startsWith("dc26") || clean.startsWith("f871")) return 1; // Red
  if (clean.startsWith("f59e") || clean.startsWith("eab3") || clean.startsWith("ca8a") || clean.startsWith("f973")) return 2; // Yellow/Orange
  if (clean.startsWith("1���q�^