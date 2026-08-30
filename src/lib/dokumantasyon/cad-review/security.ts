import type { CadPoint2d } from "./schema";

/**
 * Validates that a number is finite, not NaN, not Infinity.
 */
export function isSafeNumber(val: unknown): val is number {
  return typeof val === "number" && Number.isFinite(val) && !Number.isNaN(val);
}

/**
 * Validates that a 2D point contains valid finite numeric coordinates within safe bounds.
 */
export function isSafePoint2d(pt: unknown, maxCoord = 1e9): pt is CadPoint2d {
  if (!pt || typeof pt !== "object") return false;
  const p = pt as { x?: unknown; y?: unknown };
  return (
    isSafeNumber(p.x) &&
    isSafeNumber(p.y) &&
    Math.abs(p.x) <= maxCoord &&
    Math.abs(p.y) <= maxCoord
  );
}

/**
 * Sanitizes user-entered review text (titles, comments, labels) to prevent basic XSS injections in DOM contexts.
 */
export function sanitizeReviewText(input: string): string {
  if (!input) return "";
  return input
    .replace(/[<>]/g, "") // Strip HTML tag angle brackets
    .trim();
}

/**
 * Sanitizes an export file base name to remove illegal path and shell characters.
 */
export function sanitizeExportFileName(fileName: string, fallback = "cad_review"): string {
  if (!fileName) return fallback;
  const clean = fileName
    .replace(/\.\./g, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/^[._]+/, "")
    .trim();
  return clean || fallback;
}