export const DWG_BROWSER_SOURCE_HARD_LIMIT_BYTES = 4 * 1024 * 1024;
export const DWG_BROWSER_DXF_HARD_LIMIT_BYTES = 64 * 1024 * 1024;
export const DWG_BROWSER_INITIAL_DXF_BUFFER_BYTES = 4 * 1024 * 1024;

export const DWG_BROWSER_CACHE_FETCH_TIMEOUT_MS = 5_000;
export const DWG_BROWSER_SOURCE_FETCH_TIMEOUT_MS = 15_000;
export const DWG_BROWSER_WORKER_TIMEOUT_MS = 25_000;

export function parsePositiveContentLength(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.floor(parsed);
}

export function isWithinByteLimit(bytes: number, limit: number): boolean {
  return Number.isFinite(bytes) && bytes > 0 && bytes <= limit;
}
