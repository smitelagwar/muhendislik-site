"use client";

// ============================================================================
// CAD RUNTIME IN-MEMORY SESSION SOURCE CACHE
// Memory-safe, stale-safe, bounded in-RAM source bytes cache (Zero persistent storage)
// ============================================================================

export interface CadSessionCacheEntry {
  cacheKey: string;
  sourceBytes: ArrayBuffer;
  byteLength: number;
  lastUsedAt: number;
}

export interface CadSessionCacheStats {
  entryCount: number;
  totalBytes: number;
  maxEntries: number;
  maxTotalBytes: number;
  maxSingleFileBytes: number;
}

// Bounded Budget Policy
export const CAD_SESSION_CACHE_MAX_ENTRIES = 3;
export const CAD_SESSION_CACHE_MAX_TOTAL_BYTES = 40 * 1024 * 1024; // 40 MB
export const CAD_SESSION_CACHE_MAX_SINGLE_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

const sessionCache = new Map<string, CadSessionCacheEntry>();

function cleanUrlPath(rawUrl: string): string {
  try {
    const url = new URL(rawUrl, "http://localhost");
    return url.pathname;
  } catch {
    return rawUrl.split("?")[0] || rawUrl;
  }
}

export function buildCadSessionCacheKey(options: {
  fileId?: string;
  sourceVersionKey?: string;
  accessUrl: string;
}): string | null {
  if (options.fileId && options.sourceVersionKey) {
    return `${options.fileId}:${options.sourceVersionKey}`;
  }
  if (options.fileId) {
    return `${options.fileId}:${cleanUrlPath(options.accessUrl)}`;
  }
  if (options.sourceVersionKey) {
    return options.sourceVersionKey;
  }
  return null;
}

function evictToFit(requiredBytes: number): void {
  // 1. Evict by count
  while (sessionCache.size >= CAD_SESSION_CACHE_MAX_ENTRIES) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [key, entry] of sessionCache.entries()) {
      if (entry.lastUsedAt < oldestTime) {
        oldestTime = entry.lastUsedAt;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      sessionCache.delete(oldestKey);
    } else {
      break;
    }
  }

  // 2. Evict by total bytes
  let currentTotalBytes = 0;
  for (const entry of sessionCache.values()) {
    currentTotalBytes += entry.byteLength;
  }

  while (currentTotalBytes + requiredBytes > CAD_SESSION_CACHE_MAX_TOTAL_BYTES && sessionCache.size > 0) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [key, entry] of sessionCache.entries()) {
      if (entry.lastUsedAt < oldestTime) {
        oldestTime = entry.lastUsedAt;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      const entry = sessionCache.get(oldestKey);
      if (entry) {
        currentTotalBytes -= entry.byteLength;
      }
      sessionCache.delete(oldestKey);
    } else {
      break;
    }
  }
}

export function getCachedCadSource(cacheKey: string): ArrayBuffer | null {
  if (!cacheKey) return null;
  const entry = sessionCache.get(cacheKey);
  if (!entry) return null;

  // Verify that buffer wasn't detached by external worker transfer
  if (entry.sourceBytes.byteLength === 0 && entry.byteLength > 0) {
    sessionCache.delete(cacheKey);
    return null;
  }

  entry.lastUsedAt = Date.now();
  // Return an isolated slice(0) copy so engine/worker cannot detach or mutate cached buffer
  return entry.sourceBytes.slice(0);
}

export function putCachedCadSource(cacheKey: string, sourceBytes: ArrayBuffer): void {
  if (!cacheKey) return;
  const byteLength = sourceBytes.byteLength;

  // Single-file-too-large: bypass cache if above single file limit
  if (byteLength === 0 || byteLength > CAD_SESSION_CACHE_MAX_SINGLE_FILE_BYTES) {
    return;
  }

  evictToFit(byteLength);

  // Store an isolated copy so external operations don't mutate our cached reference
  sessionCache.set(cacheKey, {
    cacheKey,
    sourceBytes: sourceBytes.slice(0),
    byteLength,
    lastUsedAt: Date.now(),
  });
}

export function evictCachedCadSource(cacheKey: string): void {
  if (cacheKey) {
    sessionCache.delete(cacheKey);
  }
}

export function clearCadSessionCache(): void {
  sessionCache.clear();
}

export function getCadSessionCacheStats(): CadSessionCacheStats {
  let totalBytes = 0;
  for (const entry of sessionCache.values()) {
    totalBytes += entry.byteLength;
  }
  return {
    entryCount: sessionCache.size,
    totalBytes,
    maxEntries: CAD_SESSION_CACHE_MAX_ENTRIES,
    maxTotalBytes: CAD_SESSION_CACHE_MAX_TOTAL_BYTES,
    maxSingleFileBytes: CAD_SESSION_CACHE_MAX_SINGLE_FILE_BYTES,
  };
}

if (typeof window !== "undefined") {
  (window as unknown as { __cadSessionCacheStats?: typeof getCadSessionCacheStats }).__cadSessionCacheStats =
    getCadSessionCacheStats;
  (window as unknown as { __clearCadSessionCache?: typeof clearCadSessionCache }).__clearCadSessionCache =
    clearCadSessionCache;
}
