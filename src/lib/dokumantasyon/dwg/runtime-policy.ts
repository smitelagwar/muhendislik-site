export const DWG_BROWSER_SOURCE_HARD_LIMIT_BYTES = 4 * 1024 * 1024;
export const DWG_BROWSER_DXF_HARD_LIMIT_BYTES = 64 * 1024 * 1024;
export const DWG_BROWSER_INITIAL_DXF_BUFFER_BYTES = 4 * 1024 * 1024;

export const DWG_BROWSER_CACHE_FETCH_TIMEOUT_MS = 5_000;
export const DWG_BROWSER_SOURCE_FETCH_TIMEOUT_MS = 15_000;
export const DWG_BROWSER_WORKER_TIMEOUT_MS = 25_000;

// Stage 5/8 orchestration deadlines. Engines are always bounded, but a cold
// browser parse of a real CAD sheet is strongly size-dependent. Keep the fast
// 35s budget for ordinary office files while giving measured medium/large
// drawings enough time to reach a terminal upstream result instead of forcing
// a needless fallback/error solely because of file size.
export const CAD_UPSTREAM_TOTAL_TIMEOUT_MS = 35_000;
export const CAD_UPSTREAM_MEDIUM_TIMEOUT_MS = 120_000;
export const CAD_UPSTREAM_LARGE_TIMEOUT_MS = 180_000;
export const CAD_UPSTREAM_MEDIUM_FILE_BYTES = 8 * 1024 * 1024;
export const CAD_UPSTREAM_LARGE_FILE_BYTES = 32 * 1024 * 1024;

export const DWG_APS_TRANSLATION_TIMEOUT_MS = 180_000;
export const DWG_APS_STATUS_REQUEST_TIMEOUT_MS = 15_000;
export const DWG_APS_VIEWER_LOAD_TIMEOUT_MS = 45_000;

export function resolveCadUpstreamTimeoutMs(sizeBytes: number): number {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return CAD_UPSTREAM_TOTAL_TIMEOUT_MS;
  if (sizeBytes > CAD_UPSTREAM_LARGE_FILE_BYTES) return CAD_UPSTREAM_LARGE_TIMEOUT_MS;
  if (sizeBytes > CAD_UPSTREAM_MEDIUM_FILE_BYTES) return CAD_UPSTREAM_MEDIUM_TIMEOUT_MS;
  if (sizeBytes >= 2 * 1024 * 1024) return 90_000;
  return CAD_UPSTREAM_TOTAL_TIMEOUT_MS;
}

export function parsePositiveContentLength(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.floor(parsed);
}

export function isWithinByteLimit(bytes: number, limit: number): boolean {
  return Number.isFinite(bytes) && bytes > 0 && bytes <= limit;
}
