// ============================================================================
// BELGE PAYLAŞIM — RETENTION, PURGE VE DEPOLAMA TEMİZLİK MOTORU
// ============================================================================

import { BELGE_SHARE_CONFIG } from "./config";
import { getBelgeBlobStore, type BelgeBlobStore } from "./blob-store";
import { getBelgePaylasimRepository, type BelgePaylasimRepository } from "./repository";

export interface PurgeExecutionStats {
  processedCount: number;
  purgedCount: number;
  errorCount: number;
  stalePendingCount: number;
  orphanBlobCount: number;
  tombstonePurgedCount: number;
  durationMs: number;
  errors: Array<{ id?: string; pathname?: string; error: string }>;
}

export interface CleanupOptions {
  batchLimit?: number;
  leaseDurationMs?: number;
  orphanGraceHours?: number;
  tombstoneRetentionDays?: number;
  repository?: BelgePaylasimRepository;
  blobStore?: BelgeBlobStore;
}

function extractErrorCode(err: unknown): string {
  if (err && typeof err === "object" && "code" in err && (err as { code: unknown }).code != null) {
    return String((err as { code: unknown }).code);
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "PURGE_BLOB_DELETE_ERROR";
}

/**
 * Belge paylaşım depolama ve veritabanı temizleme motoru.
 * Süresi dolan (90 gün) veya iptal edilen bağlantıların Blob nesnelerini siler,
 * yetim (orphan) nesneleri 24 saatlik koruma süresi sonrasında temizler,
 * ve 30 günlük mezar taşı süreleri dolan kayıtları GC ile veritabanından kaldırır.
 */
export async function executeBelgePaylasimCleanup(
  options?: CleanupOptions
): Promise<PurgeExecutionStats> {
  const startTime = Date.now();
  const batchLimit = options?.batchLimit ?? 50;
  const leaseDurationMs = options?.leaseDurationMs ?? BELGE_SHARE_CONFIG.CRON_LEASE_DURATION_MS;
  const orphanGraceHours = options?.orphanGraceHours ?? 24;
  const tombstoneRetentionDays = options?.tombstoneRetentionDays ?? 30;

  const repo = options?.repository ?? getBelgePaylasimRepository();
  const blobStore = options?.blobStore ?? getBelgeBlobStore();

  const stats: PurgeExecutionStats = {
    processedCount: 0,
    purgedCount: 0,
    errorCount: 0,
    stalePendingCount: 0,
    orphanBlobCount: 0,
    tombstonePurgedCount: 0,
    durationMs: 0,
    errors: [],
  };

  const now = new Date();
  const staleThreshold = new Date(now.getTime() - orphanGraceHours * 60 * 60 * 1000);
  const tombstoneThreshold = new Date(now.getTime() - tombstoneRetentionDays * 24 * 60 * 60 * 1000);

  // --------------------------------------------------------------------------
  // 1. ADIM: Süresi Dolan veya İptal Edilen Kayıtların Fiziksel Temizliği (Batch Lease)
  // --------------------------------------------------------------------------
  try {
    const expiredCandidates = await repo.claimExpiredForPurge(batchLimit, leaseDurationMs);

    for (const record of expiredCandidates) {
      stats.processedCount++;
      try {
        // Blob fiziksel silme (idempotent: nesne zaten yoksa da başarılı sayılır)
        await blobStore.del(record.blobPathname);
        // Veritabanında purged durumuna geçir
        await repo.markPurged(record.id);
        stats.purgedCount++;
      } catch (err) {
        const errorCode = extractErrorCode(err);
        await repo.recordPurgeError(record.id, errorCode);
        stats.errorCount++;
        stats.errors.push({ id: record.id, pathname: record.blobPathname, error: errorCode });
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "CLAIM_EXPIRED_ERROR";
    stats.errorCount++;
    stats.errors.push({ error: `claimExpiredForPurge hatası: ${errorMsg}` });
  }

  // --------------------------------------------------------------------------
  // 2. ADIM: Takılı Kalan 'pending' Rezervasyonları Uzlaştırma (24 saat grace)
  // --------------------------------------------------------------------------
  try {
    const stalePendings = await repo.claimStalePendingForPurge(staleThreshold, batchLimit);

    for (const record of stalePendings) {
      try {
        if (record.blobPathname) {
          await blobStore.del(record.blobPathname);
        }
        await repo.markPurged(record.id);
        stats.stalePendingCount++;
      } catch (err) {
        const errorCode = err instanceof Error ? err.message : "STALE_PENDING_ERROR";
        await repo.recordPurgeError(record.id, errorCode);
        stats.errorCount++;
        stats.errors.push({ id: record.id, pathname: record.blobPathname, error: errorCode });
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "STALE_PENDING_CHECK_ERROR";
    stats.errorCount++;
    stats.errors.push({ error: `claimStalePendingForPurge hatası: ${errorMsg}` });
  }

  // --------------------------------------------------------------------------
  // 3. ADIM: Yalnızca 'belge_paylasim/' Önekli Yetim (Orphan) Blob'ları Temizleme
  // --------------------------------------------------------------------------
  try {
    if (typeof blobStore.list === "function") {
      const listResult = await blobStore.list(BELGE_SHARE_CONFIG.BLOB_PATH_PREFIX, {
        limit: batchLimit,
      });

      for (const blob of listResult.blobs) {
        // Güvenlik: Dokümantasyon veya diğer öneklere kesinlikle dokunulmaz
        if (!blob.pathname.startsWith(BELGE_SHARE_CONFIG.BLOB_PATH_PREFIX)) {
          continue;
        }

        // Grace period: Yalnızca 24 saatten eski nesneler kontrol edilir
        if (blob.uploadedAt.getTime() <= staleThreshold.getTime()) {
          const isRegistered = await repo.hasRecordWithBlobPathname(blob.pathname);
          if (!isRegistered) {
            try {
              await blobStore.del(blob.pathname);
              stats.orphanBlobCount++;
            } catch (err) {
              const errorCode = err instanceof Error ? err.message : "ORPHAN_BLOB_DELETE_ERROR";
              stats.errorCount++;
              stats.errors.push({ pathname: blob.pathname, error: errorCode });
            }
          }
        }
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "ORPHAN_SCAN_ERROR";
    stats.errorCount++;
    stats.errors.push({ error: `orphan scan hatası: ${errorMsg}` });
  }

  // --------------------------------------------------------------------------
  // 4. ADIM: Mezar Taşı (Tombstone) Temizliği (30 gün retention GC)
  // --------------------------------------------------------------------------
  try {
    const tombstoneCount = await repo.purgeOldTombstones(tombstoneThreshold, batchLimit);
    stats.tombstonePurgedCount = tombstoneCount;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "TOMBSTONE_GC_ERROR";
    stats.errorCount++;
    stats.errors.push({ error: `purgeOldTombstones hatası: ${errorMsg}` });
  }

  stats.durationMs = Date.now() - startTime;
  return stats;
}
