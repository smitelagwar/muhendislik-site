export const DXF_BROWSER_SOURCE_FETCH_TIMEOUT_MS = 45_000;
export const DXF_BROWSER_VIEWER_LOAD_TIMEOUT_MS = 90_000;
export const DXF_BROWSER_SOURCE_HARD_LIMIT_BYTES = 256 * 1024 * 1024;

export function parseDxfContentLength(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isSafeInteger(parsed)) return null;
  return parsed;
}

export function isWithinDxfByteLimit(bytes: number, limit: number = DXF_BROWSER_SOURCE_HARD_LIMIT_BYTES): boolean {
  return Number.isFinite(bytes) && bytes > 0 && bytes <= limit;
}
