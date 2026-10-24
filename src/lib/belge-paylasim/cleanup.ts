// ============================================================================
// BELGE PAYLAŞIM — SINIRLI, DEVAM EDEBİLEN FİZİKSEL TEMİZLİK MOTORU
// ============================================================================

import { randomUUID } from "node:crypto";
import { getBelgeShareEnvironmentKey } from "./browser-identity";
import { getBelgeBlobStore, type BelgeBlobStore, type BlobItemSummary } from "./blob-store";
import { BELGE_SHARE_CONFIG, getBelgeShareQuotaConfig } from "./config";
import { getBelgePaylasimRepository, type BelgePaylasimRepository } from "./repository";

export interface PurgeExecutionStats {
  success: boolean;
  outcome: "success" | "partial" | "failed";
  alreadyRunning: boolean;
  processedCount: number;
  purgedCount: number;
  errorCount: number;
  stalePendingCount: number;
  orphanBlobCount: number;
  tombstonePurgedCount: number;
  listPageCount: number;
  durationMs: number;
  partial: boolean;
  errors: Array<{ code: string }>;
  metrics?: {
    pendingDeleteCount: number;
    dueDeleteCount: number;
    leasedDeleteCount: number;
    failedDeleteCount: number;
    pendingDeleteBytes: number;
    oldestPendingDeleteAt: string | null;
    lastSuccessfulAt: string | null;
    lastOutcome: string | null;
    liableBytes: number;
    capacityLimitBytes: number | null;
    capacityUtilizationPercent: number | null;
  };
}

export interface CleanupOptions {
  batchLimit?: number;
  pageSize?: number;
  leaseDurationMs?: number;
  orphanGraceHours?: number;
  tombstoneRetentionDays?: number;
  maxDurationMs?: number;
  listTimeoutMs?: number;
  deleteTimeoutMs?: number;
  ownerId?: string;
  environmentKey?: "local" | "development" | "preview" | "production";
  repository?: BelgePaylasimRepository;
  blobStore?: BelgeBlobStore;
}

class CleanupOperationTimeout extends Error {
  readonly code = "BLOB_OPERATION_TIMEOUT";
}

function errorCode(error: unknown): string {
  if (error instanceof CleanupOperationTimeout) return error.code;
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" && /^[A-Z0-9_]{1,64}$/.test(code)) return code;
  }
  return "BLOB_OPERATION_FAILED";
}

function isSafeSharePath(pathname: string): boolean {
  const prefix = BELGE_SHARE_CONFIG.BLOB_PATH_PREFIX;
  if (!pathname.startsWith(prefix) || pathname.includes("\\") || /[\u0000-\u001f\u007f]/.test(pathname)) return false;
  const segments = pathname.slice(prefix.length).split("/");
  return segments.length > 0 && segments.every((segment) => segment.length > 0 && segment !== "." && segment !== "..");
}

async function withTimeout<T>(
  timeoutMs: number,
  operation: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new CleanupOperationTimeout());
    }, Math.max(1, timeoutMs));
  });
  try {
    return await Promise.race([Promise.resolve().then(() => operation(controller.signal)), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function toMetricSummary(
  metrics: Awaited<ReturnType<BelgePaylasimRepository["getCleanupMetrics"]>>,
  capacityLimitBytes: number | null,
) {
  return {
    pendingDeleteCount: metrics.pendingDeleteCount,
    dueDeleteCount: metrics.dueDeleteCount,
    leasedDeleteCount: metrics.leasedDeleteCount,
    failedDeleteCount: metrics.failedDeleteCount,
    pendingDeleteBytes: metrics.pendingDeleteBytes,
    oldestPendingDeleteAt: metrics.oldestPendingDeleteAt?.toISOString() ?? null,
    lastSuccessfulAt: metrics.lastSuccessfulAt?.toISOString() ?? null,
    lastOutcome: metrics.lastOutcome,
    liableBytes: metrics.liableBytes,
    capacityLimitBytes,
    capacityUtilizationPercent: capacityLimitBytes
      ? Number(((metrics.liableBytes / capacityLimitBytes) * 100).toFixed(2))
      : null,
  };
}

/**
 * Tek kiracılı cron lease'iyle sayfalı Blob taraması yapar. Liste taraması
 * tamamlanmadan Blob silinmez; cursor geçersizleşirse güvenli biçimde baştan
 * taranabilir. Her silme, fencing sahibiyle DB'de doğrulanmadan byte borcu kapanmaz.
 */
export async function executeBelgePaylasimCleanup(options?: CleanupOptions): Promise<PurgeExecutionStats> {
  const startedAt = Date.now();
  const deadline = startedAt + Math.max(1, options?.maxDurationMs ?? 45_000);
  const batchLimit = Math.max(1, Math.min(1000, options?.batchLimit ?? 100));
  const pageSize = Math.max(1, Math.min(1000, options?.pageSize ?? 100));
  const leaseDurationMs = Math.max(30_000, options?.leaseDurationMs ?? 90_000);
  const orphanGraceHours = Math.max(24, options?.orphanGraceHours ?? 24);
  const orphanGraceMs = orphanGraceHours * 60 * 60 * 1000;
  const tombstoneRetentionDays = Math.max(30, options?.tombstoneRetentionDays ?? 30);
  const environmentKey = options?.environmentKey ?? getBelgeShareEnvironmentKey();
  const ownerId = options?.ownerId ?? randomUUID();
  const repo = options?.repository ?? getBelgePaylasimRepository();
  const blobStore = options?.blobStore ?? getBelgeBlobStore();
  let capacityLimitBytes: number | null = null;
  try {
    capacityLimitBytes = getBelgeShareQuotaConfig().globalMaxStorageBytes;
  } catch {
    // Yapılandırma eksikliğinde temizliğin kendisi çalışmaya devam eder; kapasite oranı bilinmiyor kalır.
  }
  const stats: PurgeExecutionStats = {
    success: false,
    outcome: "partial",
    alreadyRunning: false,
    processedCount: 0,
    purgedCount: 0,
    errorCount: 0,
    stalePendingCount: 0,
    orphanBlobCount: 0,
    tombstonePurgedCount: 0,
    listPageCount: 0,
    durationMs: 0,
    partial: false,
    errors: [],
  };
  const recordError = (code: string) => {
    stats.errorCount += 1;
    if (stats.errors.length < 20) stats.errors.push({ code });
  };

  let leaseVersion = 0;
  let ownsRun = false;
  let scanComplete = false;
  let unresolvedClaim = false;
  try {
    const run = await repo.claimCleanupRun(ownerId, leaseDurationMs);
    leaseVersion = run.leaseVersion;
    ownsRun = run.acquired;
    if (!ownsRun) {
      stats.alreadyRunning = true;
      stats.partial = true;
      stats.outcome = "partial";
      stats.metrics = toMetricSummary(await repo.getCleanupMetrics(environmentKey), capacityLimitBytes);
      return stats;
    }

    let cursor = run.blobCursor;
    const scanStartedAt = run.blobScanStartedAt ?? new Date();
    let cursorResetCount = 0;

    // Süresi dolmuş üretim lease'lerini kapatır; yetim Blob'lar için 24 saatlik borç korunur.
    while (Date.now() < deadline) {
      const reclaimed = await repo.reclaimStalePendingAttempts(
        ownerId, leaseVersion, new Date(Date.now() - orphanGraceMs), batchLimit, orphanGraceMs,
      );
      stats.stalePendingCount += reclaimed;
      if (reclaimed < batchLimit) break;
    }

    // Tam liste taraması bitmeden fiziksel silme yapılmaz; böylece silinen ilk sayfa
    // sonraki sayfaların cursor konumunu kaydırıp yetimleri aç bırakmaz.
    while (Date.now() < deadline) {
      let page;
      try {
        page = await withTimeout(options?.listTimeoutMs ?? 8_000, (signal) =>
          blobStore.list(BELGE_SHARE_CONFIG.BLOB_PATH_PREFIX, { cursor: cursor ?? undefined, limit: pageSize, signal }),
        );
      } catch (error) {
        if (cursor && cursorResetCount === 0) {
          cursorResetCount += 1;
          cursor = null;
          if (!await repo.saveCleanupCheckpoint(ownerId, leaseVersion, null, scanStartedAt, leaseDurationMs)) {
            ownsRun = false;
            stats.partial = true;
            break;
          }
          continue;
        }
        recordError(errorCode(error));
        stats.partial = true;
        break;
      }

      stats.listPageCount += 1;
      const eligibleOrphans: BlobItemSummary[] = [];
      const staleBefore = Date.now() - orphanGraceMs;
      for (const blob of page.blobs) {
        if (!isSafeSharePath(blob.pathname) || blob.uploadedAt.getTime() > staleBefore) continue;
        eligibleOrphans.push(blob);
      }
      try {
        stats.orphanBlobCount += await repo.registerOrphanObligations(
          ownerId,
          leaseVersion,
          environmentKey,
          eligibleOrphans.map(({ pathname, sizeBytes }) => ({ pathname, sizeBytes })),
        );
      } catch (error) {
        recordError(errorCode(error));
        stats.partial = true;
        break;
      }

      if (page.hasMore && (!page.cursor || page.cursor === cursor)) {
        recordError("BLOB_CURSOR_NO_PROGRESS");
        stats.partial = true;
        break;
      }
      const nextCursor = page.hasMore ? page.cursor ?? null : null;
      const nextScanStartedAt = page.hasMore ? scanStartedAt : null;
      if (!await repo.saveCleanupCheckpoint(ownerId, leaseVersion, nextCursor, nextScanStartedAt, leaseDurationMs)) {
        ownsRun = false;
        stats.partial = true;
        break;
      }
      cursor = nextCursor;
      if (!page.hasMore) {
        scanComplete = true;
        break;
      }
    }

    if (!scanComplete && Date.now() >= deadline) stats.partial = true;

    if (ownsRun && scanComplete && Date.now() < deadline) {
      const tombstoneThreshold = new Date(Date.now() - tombstoneRetentionDays * 24 * 60 * 60 * 1000);
      while (Date.now() < deadline) {
        const claims = await repo.claimDueCleanupBlobs(environmentKey, ownerId, leaseVersion, batchLimit, leaseDurationMs);
        if (claims.length === 0) break;
        for (const claim of claims) {
          if (Date.now() >= deadline) {
            unresolvedClaim = true;
            stats.partial = true;
            break;
          }
          if (claim.environmentKey !== environmentKey || !isSafeSharePath(claim.blobPathname)) {
            const recorded = await repo.failCleanupBlob(claim, "BLOB_PATH_OR_ENVIRONMENT_REFUSED");
            if (recorded) recordError("BLOB_PATH_OR_ENVIRONMENT_REFUSED");
            else unresolvedClaim = true;
            continue;
          }
          stats.processedCount += 1;
          try {
            await withTimeout(options?.deleteTimeoutMs ?? 8_000, (signal) => blobStore.del(claim.blobPathname, { signal }));
            if (await repo.completeCleanupBlob(claim)) stats.purgedCount += 1;
            else {
              unresolvedClaim = true;
              recordError("CLEANUP_LEASE_LOST_AFTER_DELETE");
            }
          } catch (error) {
            const code = errorCode(error);
            if (await repo.failCleanupBlob(claim, code)) recordError(code);
            else {
              unresolvedClaim = true;
              recordError("CLEANUP_LEASE_LOST_AFTER_DELETE_ERROR");
            }
          }
        }
        if (unresolvedClaim || stats.partial || claims.length < batchLimit) break;
      }

      while (!unresolvedClaim && !stats.partial && Date.now() < deadline) {
        const purged = await repo.purgeCleanupTombstones(ownerId, leaseVersion, tombstoneThreshold, batchLimit);
        stats.tombstonePurgedCount += purged;
        if (purged < batchLimit) break;
      }
    }

    if (Date.now() >= deadline) stats.partial = true;
    if (scanComplete && ownsRun) {
      const postProcessMetrics = await repo.getCleanupMetrics(environmentKey);
      if (postProcessMetrics.dueDeleteCount > 0) stats.partial = true;
    }
    const complete = scanComplete && !stats.partial && !unresolvedClaim && stats.errorCount === 0;
    stats.outcome = complete ? "success" : stats.errorCount > 0 ? "failed" : "partial";
    stats.success = complete;
    if (ownsRun) {
      const released = await repo.finishCleanupRun(ownerId, leaseVersion, stats.outcome);
      if (!released) {
        stats.success = false;
        stats.outcome = "partial";
        stats.partial = true;
        recordError("CLEANUP_RUN_LEASE_LOST");
      }
    }
    stats.metrics = toMetricSummary(await repo.getCleanupMetrics(environmentKey), capacityLimitBytes);
    return stats;
  } catch (error) {
    recordError(errorCode(error));
    stats.outcome = "failed";
    stats.success = false;
    stats.partial = true;
    if (ownsRun) await repo.finishCleanupRun(ownerId, leaseVersion, "failed").catch(() => false);
    try {
      stats.metrics = toMetricSummary(await repo.getCleanupMetrics(environmentKey), capacityLimitBytes);
    } catch {
      // Tanılama deposu erişilemiyorsa güvenli genel yanıt yeterlidir.
    }
    return stats;
  } finally {
    stats.durationMs = Date.now() - startedAt;
  }
}
