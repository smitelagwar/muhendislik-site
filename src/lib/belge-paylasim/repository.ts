// ============================================================================
// BELGE PAYLAŞIM — VERİTABANI ERİŞİM VE DEPO ADAPTÖRÜ
// ============================================================================

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { getDatabaseUrl, hasDatabaseUrl } from "@/lib/dokumantasyon/runtime-mode";
import {
  BelgeShareRuntimeError,
  BELGE_SHARE_CONFIG,
  getBelgeShareQuotaConfig,
  type BelgeShareQuotaConfig,
} from "./config";
import { getIstanbulQuotaWindow } from "./browser-identity";
import { BelgeShareQuotaError, type BelgeShareQuotaFailureCode } from "./quota";
import type {
  BelgePaylasimDocumentId,
  BelgePaylasimDailyQuotaCounts,
  BelgePaylasimDailyQuotaSnapshot,
  BelgeShareEnvironment,
  BelgePaylasimRecord,
  BelgePaylasimCleanupRun,
  BelgePaylasimCleanupBlobClaim,
  BelgePaylasimCleanupMetrics,
  BelgePaylasimBlobByteState,
  BelgePaylasimStatus,
  PendingReservationInput,
  ReservationAttemptInput,
  CreateReservationResult,
} from "./types";

export interface BelgePaylasimRepository {
  findByRequestIdHash(requestIdHash: string): Promise<BelgePaylasimRecord | null>;
  findByTokenHash(tokenHash: string): Promise<BelgePaylasimRecord | null>;
  findByManageTokenHash(manageTokenHash: string): Promise<BelgePaylasimRecord | null>;
  createPendingReservation(input: PendingReservationInput): Promise<BelgePaylasimRecord>;
  createOrGetReservation(input: ReservationAttemptInput): Promise<CreateReservationResult>;
  beginRetryAttempt(id: string, attemptId: string, blobPathname: string, leaseUntil: Date): Promise<BelgePaylasimRecord | null>;
  finalizeReady(id: string, sizeBytes: number, pdfSha256: string, attemptId?: string, attemptVersion?: number): Promise<boolean>;
  markFailed(
    id: string,
    errorCode: string,
    attemptId?: string,
    attemptVersion?: number,
    uploadState?: "not_started" | "unknown" | "present",
    actualBytes?: number,
  ): Promise<boolean>;
  revokeLink(id: string): Promise<void>;
  getDailyQuota(
    environmentKey: BelgeShareEnvironment,
    ownerHash: string
  ): Promise<BelgePaylasimDailyQuotaSnapshot>;
  markBlobDeleted(environmentKey: BelgeShareEnvironment, pathname: string): Promise<void>;
  getActiveStats(): Promise<{ activeCount: number; totalActiveBytes: number }>;
  claimExpiredForPurge(limit: number, leaseDurationMs: number): Promise<BelgePaylasimRecord[]>;
  claimStalePendingForPurge(olderThan: Date, limit: number): Promise<BelgePaylasimRecord[]>;
  hasRecordWithBlobPathname(pathname: string): Promise<boolean>;
  purgeOldTombstones(olderThan: Date, limit: number): Promise<number>;
  markPurged(id: string): Promise<void>;
  recordPurgeError(id: string, errorCode: string): Promise<void>;
  claimCleanupRun(ownerId: string, leaseDurationMs: number): Promise<BelgePaylasimCleanupRun>;
  saveCleanupCheckpoint(
    ownerId: string,
    leaseVersion: number,
    blobCursor: string | null,
    blobScanStartedAt: Date | null,
    leaseDurationMs: number,
  ): Promise<boolean>;
  finishCleanupRun(ownerId: string, leaseVersion: number, outcome: "success" | "partial" | "failed"): Promise<boolean>;
  reclaimStalePendingAttempts(
    ownerId: string, runLeaseVersion: number, olderThan: Date, limit: number, orphanGraceMs: number,
  ): Promise<number>;
  registerOrphanObligations(
    ownerId: string,
    runLeaseVersion: number,
    environmentKey: BelgeShareEnvironment,
    candidates: readonly { pathname: string; sizeBytes: number }[],
  ): Promise<number>;
  claimDueCleanupBlobs(
    environmentKey: BelgeShareEnvironment,
    ownerId: string,
    runLeaseVersion: number,
    limit: number,
    leaseDurationMs: number,
  ): Promise<BelgePaylasimCleanupBlobClaim[]>;
  completeCleanupBlob(claim: BelgePaylasimCleanupBlobClaim): Promise<boolean>;
  failCleanupBlob(claim: BelgePaylasimCleanupBlobClaim, errorCode: string): Promise<boolean>;
  purgeCleanupTombstones(ownerId: string, runLeaseVersion: number, olderThan: Date, limit: number): Promise<number>;
  getCleanupMetrics(environmentKey: BelgeShareEnvironment): Promise<BelgePaylasimCleanupMetrics>;
}

const REQUIRED_BELGE_SHARE_SCHEMA_VERSION = 9;

interface MemoryDailyQuota extends BelgePaylasimDailyQuotaCounts {
  reservedBytes: number;
  committedBytes: number;
  deletionPendingBytes: number;
  unknownUploadBytes: number;
}

interface MemoryBlobObligation {
  id: string;
  shareId: string | null;
  attemptId: string | null;
  environmentKey: BelgeShareEnvironment;
  ownerHash: string | null;
  quotaDay: string | null;
  pathname: string;
  byteState: BelgePaylasimBlobByteState;
  liableBytes: number;
  actualBytes: number | null;
  createdAt: Date;
  cleanupRequestedAt: Date | null;
  attemptCount: number;
  nextAttemptAt: Date | null;
  purgeReason: string | null;
  cleanupOwnerId: string | null;
  cleanupLeaseVersion: number;
  cleanupLeaseUntil: Date | null;
}

/** Migration hazır değilse tek bir read-only sorguyla kontrollü altyapı hatası üretir. */
export async function assertBelgeShareSchemaReady(
  readVersion: (statement: string) => Promise<readonly Record<string, unknown>[]>
): Promise<void> {
  let rows: readonly Record<string, unknown>[];
  try {
    rows = await readVersion(
      "SELECT schema_version FROM belge_paylasim_schema_version WHERE singleton = TRUE LIMIT 1"
    );
  } catch {
    throw new BelgeShareRuntimeError("SCHEMA_NOT_READY");
  }

  const version = Number(rows[0]?.schema_version);
  if (!Number.isSafeInteger(version) || version < REQUIRED_BELGE_SHARE_SCHEMA_VERSION) {
    throw new BelgeShareRuntimeError("SCHEMA_NOT_READY");
  }
}

/**
 * Testler ve yerel geliştirme için bellek içi repository.
 */
export class MemoryBelgePaylasimRepository implements BelgePaylasimRepository {
  private readonly records = new Map<string, BelgePaylasimRecord>();
  private readonly dailyQuotas = new Map<string, MemoryDailyQuota>();
  private readonly blobObligations = new Map<string, MemoryBlobObligation>();
  private quotaConfig: BelgeShareQuotaConfig;
  private clock: () => Date;
  private nextMemoryId = 0;
  private cleanupRun: {
    ownerId: string;
    leaseVersion: number;
    leaseUntil: Date;
    blobCursor: string | null;
    blobScanStartedAt: Date | null;
    lastSuccessfulAt: Date | null;
    lastOutcome: "success" | "partial" | "failed" | null;
  } | null = null;

  constructor(options?: { quotaConfig?: BelgeShareQuotaConfig; clock?: () => Date }) {
    this.quotaConfig = options?.quotaConfig ?? {
      globalDailyLimit: BELGE_SHARE_CONFIG.LOCAL_GLOBAL_DAILY_LIMIT,
      globalMaxStorageBytes: BELGE_SHARE_CONFIG.LOCAL_GLOBAL_MAX_STORAGE_BYTES,
    };
    this.clock = options?.clock ?? (() => new Date());
  }

  private now(): Date { return this.clock(); }

  setLimitsForTest(config: BelgeShareQuotaConfig): void { this.quotaConfig = { ...config }; }

  setClockForTest(clock: () => Date): void { this.clock = clock; }

  private dailyQuotaKey(environmentKey: BelgeShareEnvironment, ownerHash: string, quotaDay: string): string {
    return `${environmentKey}:${ownerHash}:${quotaDay}`;
  }

  private getDailyBucket(environmentKey: BelgeShareEnvironment, ownerHash: string, quotaDay: string): MemoryDailyQuota {
    const key = this.dailyQuotaKey(environmentKey, ownerHash, quotaDay);
    let row = this.dailyQuotas.get(key);
    if (!row) {
      row = { usedLinks: 0, reservedLinks: 0, reservedBytes: 0, committedBytes: 0, deletionPendingBytes: 0, unknownUploadBytes: 0 };
      this.dailyQuotas.set(key, row);
    }
    return row;
  }

  private quotaSnapshot(environmentKey: BelgeShareEnvironment, ownerHash: string): BelgePaylasimDailyQuotaSnapshot {
    const now = this.now();
    const window = getIstanbulQuotaWindow(now);
    const bucket = this.dailyQuotas.get(this.dailyQuotaKey(environmentKey, ownerHash, window.quotaDay));
    return {
      usedLinks: bucket?.usedLinks ?? 0,
      reservedLinks: bucket?.reservedLinks ?? 0,
      quotaDay: window.quotaDay,
      serverNow: now,
      resetAt: window.resetAt,
    };
  }

  private throwQuotaFailure(code: BelgeShareQuotaFailureCode, environmentKey: BelgeShareEnvironment, ownerHash: string): never {
    throw new BelgeShareQuotaError(code, this.quotaSnapshot(environmentKey, ownerHash));
  }

  private getGlobalDailyCount(environmentKey: BelgeShareEnvironment, quotaDay: string): number {
    let total = 0;
    for (const [key, row] of this.dailyQuotas) {
      if (key.startsWith(`${environmentKey}:`) && key.endsWith(`:${quotaDay}`)) total += row.usedLinks + row.reservedLinks;
    }
    return total;
  }

  private getLiableBytes(): number {
    let total = 0;
    for (const obligation of this.blobObligations.values()) {
      if (obligation.byteState !== "deleted") total += obligation.liableBytes;
    }
    return total;
  }

  private setObligationState(
    obligation: MemoryBlobObligation,
    state: BelgePaylasimBlobByteState,
    liableBytes: number,
    actualBytes: number | null = obligation.actualBytes,
  ): void {
    if (obligation.ownerHash && obligation.quotaDay) {
      const bucket = this.getDailyBucket(obligation.environmentKey, obligation.ownerHash, obligation.quotaDay);
      const column = (value: BelgePaylasimBlobByteState): keyof Pick<MemoryDailyQuota,
        "reservedBytes" | "committedBytes" | "deletionPendingBytes" | "unknownUploadBytes"> | null => {
        if (value === "reserved") return "reservedBytes";
        if (value === "committed") return "committedBytes";
        if (value === "deletion_pending") return "deletionPendingBytes";
        if (value === "unknown") return "unknownUploadBytes";
        return null;
      };
      const oldColumn = column(obligation.byteState);
      const newColumn = column(state);
      if (oldColumn) bucket[oldColumn] = Math.max(0, bucket[oldColumn] - obligation.liableBytes);
      if (newColumn) bucket[newColumn] += liableBytes;
    }
    const wasPendingCleanup = obligation.byteState === "deletion_pending" || obligation.byteState === "unknown";
    const isPendingCleanup = state === "deletion_pending" || state === "unknown";
    if (isPendingCleanup && !wasPendingCleanup) obligation.cleanupRequestedAt = this.now();
    if (state === "deleted") obligation.cleanupRequestedAt = null;
    obligation.byteState = state;
    obligation.liableBytes = liableBytes;
    obligation.actualBytes = actualBytes;
  }

  async getDailyQuota(
    environmentKey: BelgeShareEnvironment,
    ownerHash: string
  ): Promise<BelgePaylasimDailyQuotaSnapshot> {
    return this.quotaSnapshot(environmentKey, ownerHash);
  }

  setDailyQuotaForTest(
    environmentKey: BelgeShareEnvironment,
    ownerHash: string,
    quotaDay: string,
    counts: BelgePaylasimDailyQuotaCounts
  ): void {
    this.dailyQuotas.set(this.dailyQuotaKey(environmentKey, ownerHash, quotaDay), {
      ...counts,
      reservedBytes: 0,
      committedBytes: 0,
      deletionPendingBytes: 0,
      unknownUploadBytes: 0,
    });
  }

  async findByRequestIdHash(requestIdHash: string): Promise<BelgePaylasimRecord | null> {
    for (const record of this.records.values()) {
      if (record.requestIdHash === requestIdHash) {
        return { ...record };
      }
    }
    return null;
  }

  async findByTokenHash(tokenHash: string): Promise<BelgePaylasimRecord | null> {
    for (const record of this.records.values()) {
      if (record.tokenHash === tokenHash) {
        return { ...record };
      }
    }
    return null;
  }

  async findByManageTokenHash(manageTokenHash: string): Promise<BelgePaylasimRecord | null> {
    for (const record of this.records.values()) {
      if (record.manageTokenHash === manageTokenHash) {
        return { ...record };
      }
    }
    return null;
  }

  private insertRecord(input: PendingReservationInput): BelgePaylasimRecord {
    // Unique constraint kontrolleri
    for (const record of this.records.values()) {
      if (record.requestIdHash === input.requestIdHash) {
        throw new Error("UNIQUE constraint violation: request_id_hash");
      }
      if (record.tokenHash === input.tokenHash) {
        throw new Error("UNIQUE constraint violation: token_hash");
      }
      if (record.manageTokenHash === input.manageTokenHash) {
        throw new Error("UNIQUE constraint violation: manage_token_hash");
      }
      if (record.blobPathname === input.blobPathname) {
        throw new Error("UNIQUE constraint violation: blob_pathname");
      }
    }

    const id = `mem-${this.now().getTime()}-${++this.nextMemoryId}`;
    const now = this.now();
    const newRecord: BelgePaylasimRecord = {
      id,
      requestIdHash: input.requestIdHash,
      payloadDigest: input.payloadDigest,
      tokenHash: input.tokenHash,
      manageTokenHash: input.manageTokenHash,
      documentId: input.documentId,
      blobPathname: input.blobPathname,
      sizeBytes: null,
      pdfSha256: null,
      status: "pending",
      creatorIpHash: input.creatorIpHash,
      createdAt: now,
      expiresAt: input.expiresAt,
      revokedAt: null,
      purgedAt: null,
      purgeAttempts: 0,
      lastPurgeErrorCode: null,
      leaseUntil: input.leaseUntil ?? null,
      ownerHash: input.ownerHash ?? null,
      ownerVersion: input.ownerVersion ?? null,
      requestVersion: input.requestVersion ?? null,
      proofHash: input.proofHash ?? null,
      proofVersion: input.proofVersion ?? null,
      tokenVersion: input.tokenVersion ?? null,
      tokenKeyVersion: input.tokenKeyVersion ?? null,
      reservationNonce: input.reservationNonce?.slice() ?? null,
      environmentKey: input.environmentKey ?? null,
      attemptId: input.attemptId ?? null,
      attemptVersion: input.attemptVersion ?? 0,
      readyAt: null,
      quotaDay: null,
      quotaAccountingStatus: null,
      purgeReason: null,
    };

    this.records.set(id, newRecord);
    return { ...newRecord };
  }

  async createPendingReservation(input: PendingReservationInput): Promise<BelgePaylasimRecord> {
    return this.insertRecord(input);
  }

  async createOrGetReservation(input: ReservationAttemptInput): Promise<CreateReservationResult> {
    for (const existing of this.records.values()) {
      if (existing.requestIdHash === input.requestIdHash) {
        return { record: { ...existing, reservationNonce: existing.reservationNonce?.slice() ?? null }, created: false };
      }
    }
    const now = this.now();
    const window = getIstanbulQuotaWindow(now);
    const bucket = this.getDailyBucket(input.environmentKey, input.ownerHash, window.quotaDay);
    if (bucket.usedLinks >= BELGE_SHARE_CONFIG.DAILY_BROWSER_LINK_LIMIT) {
      this.throwQuotaFailure("DAILY_BROWSER_QUOTA_EXCEEDED", input.environmentKey, input.ownerHash);
    }
    if (bucket.usedLinks + bucket.reservedLinks >= BELGE_SHARE_CONFIG.DAILY_BROWSER_LINK_LIMIT) {
      this.throwQuotaFailure("BROWSER_QUOTA_RESERVED", input.environmentKey, input.ownerHash);
    }
    if (this.getGlobalDailyCount(input.environmentKey, window.quotaDay) >= this.quotaConfig.globalDailyLimit) {
      this.throwQuotaFailure("GLOBAL_DAILY_CAPACITY_REACHED", input.environmentKey, input.ownerHash);
    }
    if (this.getLiableBytes() + BELGE_SHARE_CONFIG.MAX_PDF_SIZE_BYTES > this.quotaConfig.globalMaxStorageBytes) {
      this.throwQuotaFailure("STORAGE_CAPACITY_UNAVAILABLE", input.environmentKey, input.ownerHash);
    }

    const record = this.insertRecord(input);
    record.quotaDay = window.quotaDay;
    record.quotaAccountingStatus = "reserved";
    this.records.set(record.id, record);
    bucket.reservedLinks += 1;
    bucket.reservedBytes += BELGE_SHARE_CONFIG.MAX_PDF_SIZE_BYTES;
    this.blobObligations.set(`${input.environmentKey}:${input.blobPathname}`, {
      id: `mem-blob-${++this.nextMemoryId}`,
      shareId: record.id,
      attemptId: input.attemptId,
      environmentKey: input.environmentKey,
      ownerHash: input.ownerHash,
      quotaDay: window.quotaDay,
      pathname: input.blobPathname,
      byteState: "reserved",
      liableBytes: BELGE_SHARE_CONFIG.MAX_PDF_SIZE_BYTES,
      actualBytes: null,
      createdAt: this.now(),
      cleanupRequestedAt: null,
      attemptCount: 0,
      nextAttemptAt: null,
      purgeReason: null,
      cleanupOwnerId: null,
      cleanupLeaseVersion: 0,
      cleanupLeaseUntil: null,
    });
    return { record: { ...record }, created: true };
  }

  async beginRetryAttempt(
    id: string,
    attemptId: string,
    blobPathname: string,
    leaseUntil: Date,
  ): Promise<BelgePaylasimRecord | null> {
    const record = this.records.get(id);
    const now = this.now().getTime();
    if (!record || record.revokedAt || record.status === "revoked" || record.status === "purged" || record.expiresAt.getTime() <= now) {
      return null;
    }
    const canRetryFailed = record.status === "failed";
    const canTakeOverExpired = record.status === "pending" && (record.leaseUntil?.getTime() ?? 0) <= now;
    if (!canRetryFailed && !canTakeOverExpired) return null;

    if (record.ownerHash && record.environmentKey) {
      if (record.quotaAccountingStatus === "reserved") {
        const oldBucket = record.quotaDay
          ? this.getDailyBucket(record.environmentKey, record.ownerHash, record.quotaDay)
          : null;
        if (oldBucket) oldBucket.reservedLinks = Math.max(0, oldBucket.reservedLinks - 1);
        const oldObligation = this.blobObligations.get(`${record.environmentKey}:${record.blobPathname}`);
        if (oldObligation && oldObligation.byteState !== "deleted") {
          this.setObligationState(oldObligation, "unknown", Math.max(oldObligation.liableBytes, BELGE_SHARE_CONFIG.MAX_PDF_SIZE_BYTES));
        }
        record.status = "failed";
        record.quotaAccountingStatus = "released";
        record.leaseUntil = null;
        record.lastPurgeErrorCode = "ATTEMPT_LEASE_EXPIRED";
      }

      const window = getIstanbulQuotaWindow(this.now());
      const bucket = this.getDailyBucket(record.environmentKey, record.ownerHash, window.quotaDay);
      if (bucket.usedLinks >= BELGE_SHARE_CONFIG.DAILY_BROWSER_LINK_LIMIT) {
        this.throwQuotaFailure("DAILY_BROWSER_QUOTA_EXCEEDED", record.environmentKey, record.ownerHash);
      }
      if (bucket.usedLinks + bucket.reservedLinks >= BELGE_SHARE_CONFIG.DAILY_BROWSER_LINK_LIMIT) {
        this.throwQuotaFailure("BROWSER_QUOTA_RESERVED", record.environmentKey, record.ownerHash);
      }
      if (this.getGlobalDailyCount(record.environmentKey, window.quotaDay) >= this.quotaConfig.globalDailyLimit) {
        this.throwQuotaFailure("GLOBAL_DAILY_CAPACITY_REACHED", record.environmentKey, record.ownerHash);
      }
      if (this.getLiableBytes() + BELGE_SHARE_CONFIG.MAX_PDF_SIZE_BYTES > this.quotaConfig.globalMaxStorageBytes) {
        this.throwQuotaFailure("STORAGE_CAPACITY_UNAVAILABLE", record.environmentKey, record.ownerHash);
      }
      bucket.reservedLinks += 1;
      bucket.reservedBytes += BELGE_SHARE_CONFIG.MAX_PDF_SIZE_BYTES;
      record.quotaDay = window.quotaDay;
      record.quotaAccountingStatus = "reserved";
      this.blobObligations.set(`${record.environmentKey}:${blobPathname}`, {
        id: `mem-blob-${++this.nextMemoryId}`,
        shareId: record.id,
        attemptId,
        environmentKey: record.environmentKey,
        ownerHash: record.ownerHash,
        quotaDay: window.quotaDay,
        pathname: blobPathname,
        byteState: "reserved",
        liableBytes: BELGE_SHARE_CONFIG.MAX_PDF_SIZE_BYTES,
        actualBytes: null,
        createdAt: this.now(),
        cleanupRequestedAt: null,
        attemptCount: 0,
        nextAttemptAt: null,
        purgeReason: null,
        cleanupOwnerId: null,
        cleanupLeaseVersion: 0,
        cleanupLeaseUntil: null,
      });
    }
    record.status = "pending";
    record.attemptId = attemptId;
    record.attemptVersion = (record.attemptVersion ?? 0) + 1;
    record.blobPathname = blobPathname;
    record.leaseUntil = leaseUntil;
    record.lastPurgeErrorCode = null;
    return { ...record, reservationNonce: record.reservationNonce?.slice() ?? null };
  }

  async finalizeReady(
    id: string,
    sizeBytes: number,
    pdfSha256: string,
    attemptId?: string,
    attemptVersion?: number,
  ): Promise<boolean> {
    const record = this.records.get(id);
    if (!record || record.status !== "pending" || record.revokedAt) return false;
    if (attemptId !== undefined || attemptVersion !== undefined) {
      if (
        !attemptId || attemptVersion === undefined || record.attemptId !== attemptId ||
        record.attemptVersion !== attemptVersion || !record.leaseUntil || record.leaseUntil.getTime() <= this.now().getTime()
      ) return false;
    } else if (record.attemptId !== null) {
      return false;
    }

    const now = this.now();
    const actualBytes = Math.max(0, Math.floor(sizeBytes));
    if (record.quotaAccountingStatus === "reserved" && record.ownerHash && record.environmentKey && record.quotaDay) {
      const oldBucket = this.getDailyBucket(record.environmentKey, record.ownerHash, record.quotaDay);
      const currentDay = getIstanbulQuotaWindow(now).quotaDay;
      const currentBucket = this.getDailyBucket(record.environmentKey, record.ownerHash, currentDay);
      const obligation = this.blobObligations.get(`${record.environmentKey}:${record.blobPathname}`);
      if (!obligation || obligation.byteState !== "reserved") return false;
      let failureCode: BelgeShareQuotaFailureCode | "PDF_SIZE_EXCEEDS_RESERVED_BYTES" | null = null;
      if (currentDay !== record.quotaDay) {
        if (currentBucket.usedLinks >= BELGE_SHARE_CONFIG.DAILY_BROWSER_LINK_LIMIT) failureCode = "DAILY_BROWSER_QUOTA_EXCEEDED";
        else if (currentBucket.usedLinks + currentBucket.reservedLinks >= BELGE_SHARE_CONFIG.DAILY_BROWSER_LINK_LIMIT) failureCode = "BROWSER_QUOTA_RESERVED";
        else if (this.getGlobalDailyCount(record.environmentKey, currentDay) >= this.quotaConfig.globalDailyLimit) failureCode = "GLOBAL_DAILY_CAPACITY_REACHED";
      }
      const reservedLiability = obligation.liableBytes;
      if (!failureCode && this.getLiableBytes() - reservedLiability + actualBytes > this.quotaConfig.globalMaxStorageBytes) {
        failureCode = "STORAGE_CAPACITY_UNAVAILABLE";
      }
      if (!failureCode && actualBytes > BELGE_SHARE_CONFIG.MAX_PDF_SIZE_BYTES) failureCode = "PDF_SIZE_EXCEEDS_RESERVED_BYTES";

      oldBucket.reservedLinks = Math.max(0, oldBucket.reservedLinks - 1);
      if (failureCode) {
        this.setObligationState(obligation, "deletion_pending", Math.max(actualBytes, 1), actualBytes);
        record.status = "failed";
        record.quotaAccountingStatus = "released";
        record.lastPurgeErrorCode = failureCode;
        record.leaseUntil = null;
        return false;
      }

      currentBucket.usedLinks += 1;
      if (currentDay !== record.quotaDay) {
        this.setObligationState(obligation, "deleted", 0, actualBytes);
        obligation.quotaDay = currentDay;
      }
      this.setObligationState(obligation, "committed", actualBytes, actualBytes);
      record.quotaDay = currentDay;
      record.quotaAccountingStatus = "used";
      record.status = "ready";
      record.sizeBytes = actualBytes;
      record.pdfSha256 = pdfSha256;
      record.readyAt = now;
      record.expiresAt = new Date(now.getTime() + BELGE_SHARE_CONFIG.EXPIRATION_MS);
      record.leaseUntil = null;
      return true;
    }
    record.status = "ready";
    record.sizeBytes = actualBytes;
    record.pdfSha256 = pdfSha256;
    record.readyAt = now;
    record.leaseUntil = null;
    return true;
  }

  async markFailed(
    id: string,
    errorCode: string,
    attemptId?: string,
    attemptVersion?: number,
    uploadState: "not_started" | "unknown" | "present" = "unknown",
    actualBytes?: number,
  ): Promise<boolean> {
    const record = this.records.get(id);
    if (!record || record.status !== "pending" || record.revokedAt) return false;
    if (attemptId !== undefined || attemptVersion !== undefined) {
      if (
        !attemptId || attemptVersion === undefined || record.attemptId !== attemptId ||
        record.attemptVersion !== attemptVersion || !record.leaseUntil || record.leaseUntil.getTime() <= this.now().getTime()
      ) return false;
    } else if (record.attemptId !== null) {
      return false;
    }
    const obligation = record.environmentKey
      ? this.blobObligations.get(`${record.environmentKey}:${record.blobPathname}`)
      : undefined;
    if (obligation && obligation.byteState !== "deleted") {
      if (uploadState === "not_started") {
        this.setObligationState(obligation, "deleted", 0, 0);
      } else if (uploadState === "present") {
        this.setObligationState(obligation, "deletion_pending", Math.max(0, actualBytes ?? obligation.liableBytes), actualBytes ?? null);
        obligation.nextAttemptAt = this.now();
      } else {
        this.setObligationState(obligation, "unknown", Math.max(obligation.liableBytes, actualBytes ?? 0), actualBytes ?? null);
        obligation.nextAttemptAt = new Date(this.now().getTime() + 24 * 60 * 60 * 1000);
      }
    }
    if (record.quotaAccountingStatus === "reserved" && record.ownerHash && record.environmentKey && record.quotaDay) {
      const bucket = this.getDailyBucket(record.environmentKey, record.ownerHash, record.quotaDay);
      bucket.reservedLinks = Math.max(0, bucket.reservedLinks - 1);
      record.quotaAccountingStatus = "released";
    }
    record.status = "failed";
    record.lastPurgeErrorCode = errorCode;
    record.leaseUntil = null;
    return true;
  }

  async revokeLink(id: string): Promise<void> {
    const record = this.records.get(id);
    if (!record) throw new Error(`Kayıt bulunamadı: ${id}`);
    if (record.quotaAccountingStatus === "reserved" && record.ownerHash && record.environmentKey && record.quotaDay) {
      const bucket = this.getDailyBucket(record.environmentKey, record.ownerHash, record.quotaDay);
      bucket.reservedLinks = Math.max(0, bucket.reservedLinks - 1);
      record.quotaAccountingStatus = "released";
    }
    if (record.environmentKey) {
      const obligation = this.blobObligations.get(`${record.environmentKey}:${record.blobPathname}`);
      if (obligation && obligation.byteState !== "deleted") {
        const nextState = obligation.byteState === "reserved" ? "unknown" : "deletion_pending";
        this.setObligationState(obligation, nextState, obligation.liableBytes);
        obligation.nextAttemptAt = nextState === "unknown"
          ? new Date(this.now().getTime() + 24 * 60 * 60 * 1000)
          : this.now();
      }
    }
    record.status = "revoked";
    record.revokedAt = this.now();
  }

  async getActiveStats(): Promise<{ activeCount: number; totalActiveBytes: number }> {
    const now = this.now().getTime();
    let activeCount = 0;
    for (const r of this.records.values()) {
      if (r.status === "ready" && r.expiresAt.getTime() > now && !r.revokedAt) {
        activeCount++;
      }
    }
    return { activeCount, totalActiveBytes: this.getLiableBytes() };
  }

  async claimExpiredForPurge(limit: number, leaseDurationMs: number): Promise<BelgePaylasimRecord[]> {
    const now = this.now().getTime();
    const candidates: BelgePaylasimRecord[] = [];

    for (const r of this.records.values()) {
      const isExpired = r.expiresAt.getTime() <= now;
      const isRevoked = r.status === "revoked";
      const isEligible = (isExpired || isRevoked) && r.status !== "purged";
      const isLeaseFree = !r.leaseUntil || r.leaseUntil.getTime() <= now;

      if (isEligible && isLeaseFree) {
        r.leaseUntil = new Date(now + leaseDurationMs);
        candidates.push({ ...r });
        if (candidates.length >= limit) break;
      }
    }

    return candidates;
  }

  async markPurged(id: string): Promise<void> {
    const record = this.records.get(id);
    if (!record) return;
    if (record.quotaAccountingStatus === "reserved" && record.ownerHash && record.environmentKey && record.quotaDay) {
      const bucket = this.getDailyBucket(record.environmentKey, record.ownerHash, record.quotaDay);
      bucket.reservedLinks = Math.max(0, bucket.reservedLinks - 1);
      record.quotaAccountingStatus = "released";
    }
    if (record.environmentKey) {
      const obligation = this.blobObligations.get(`${record.environmentKey}:${record.blobPathname}`);
      if (obligation && obligation.byteState !== "deleted") this.setObligationState(obligation, "deleted", 0, obligation.actualBytes);
    }
    record.status = "purged";
    record.purgedAt = this.now();
    record.leaseUntil = null;
  }

  async recordPurgeError(id: string, errorCode: string): Promise<void> {
    const record = this.records.get(id);
    if (!record) return;
    record.purgeAttempts++;
    record.lastPurgeErrorCode = errorCode;
    record.leaseUntil = null;
    if (record.quotaAccountingStatus === "reserved" && record.ownerHash && record.environmentKey && record.quotaDay) {
      const bucket = this.getDailyBucket(record.environmentKey, record.ownerHash, record.quotaDay);
      bucket.reservedLinks = Math.max(0, bucket.reservedLinks - 1);
      record.quotaAccountingStatus = "released";
    }
    if (record.environmentKey) {
      const obligation = this.blobObligations.get(`${record.environmentKey}:${record.blobPathname}`);
      if (obligation && obligation.byteState !== "deleted") {
        this.setObligationState(obligation, "deletion_pending", Math.max(obligation.liableBytes, record.sizeBytes ?? 0));
      }
    }
  }

  async markBlobDeleted(environmentKey: BelgeShareEnvironment, pathname: string): Promise<void> {
    const obligation = this.blobObligations.get(`${environmentKey}:${pathname}`);
    if (obligation && obligation.byteState !== "deleted") {
      this.setObligationState(obligation, "deleted", 0, obligation.actualBytes);
    }
  }

  async claimStalePendingForPurge(olderThan: Date, limit: number): Promise<BelgePaylasimRecord[]> {
    const candidates: BelgePaylasimRecord[] = [];
    for (const r of this.records.values()) {
      if (r.status === "pending" && r.createdAt.getTime() <= olderThan.getTime()) {
        candidates.push({ ...r });
        if (candidates.length >= limit) break;
      }
    }
    return candidates;
  }

  async hasRecordWithBlobPathname(pathname: string): Promise<boolean> {
    for (const r of this.records.values()) {
      if (r.blobPathname === pathname) return true;
    }
    return false;
  }

  async purgeOldTombstones(olderThan: Date, limit: number): Promise<number> {
    let count = 0;
    for (const [id, r] of Array.from(this.records.entries())) {
      if (r.status === "purged" && r.purgedAt && r.purgedAt.getTime() <= olderThan.getTime()) {
        this.records.delete(id);
        count++;
        if (count >= limit) break;
      }
    }
    return count;
  }

  async claimCleanupRun(ownerId: string, leaseDurationMs: number): Promise<BelgePaylasimCleanupRun> {
    const now = this.now();
    if (this.cleanupRun && this.cleanupRun.leaseUntil.getTime() > now.getTime() && this.cleanupRun.ownerId !== ownerId) {
      return { ...this.cleanupRun, acquired: false, ownerId };
    }
    if (!this.cleanupRun || this.cleanupRun.ownerId !== ownerId || this.cleanupRun.leaseUntil.getTime() <= now.getTime()) {
      this.cleanupRun = {
        ownerId,
        leaseVersion: (this.cleanupRun?.leaseVersion ?? 0) + 1,
        leaseUntil: new Date(now.getTime() + leaseDurationMs),
        blobCursor: this.cleanupRun?.blobCursor ?? null,
        blobScanStartedAt: this.cleanupRun?.blobScanStartedAt ?? now,
        lastSuccessfulAt: this.cleanupRun?.lastSuccessfulAt ?? null,
        lastOutcome: this.cleanupRun?.lastOutcome ?? null,
      };
    } else {
      this.cleanupRun.leaseUntil = new Date(now.getTime() + leaseDurationMs);
    }
    return { ...this.cleanupRun, acquired: true };
  }

  async saveCleanupCheckpoint(
    ownerId: string,
    leaseVersion: number,
    blobCursor: string | null,
    blobScanStartedAt: Date | null,
    leaseDurationMs: number,
  ): Promise<boolean> {
    const run = this.cleanupRun;
    const now = this.now();
    if (!run || run.ownerId !== ownerId || run.leaseVersion !== leaseVersion || run.leaseUntil.getTime() <= now.getTime()) return false;
    run.blobCursor = blobCursor;
    run.blobScanStartedAt = blobScanStartedAt;
    run.leaseUntil = new Date(now.getTime() + leaseDurationMs);
    return true;
  }

  async finishCleanupRun(
    ownerId: string,
    leaseVersion: number,
    outcome: "success" | "partial" | "failed",
  ): Promise<boolean> {
    const run = this.cleanupRun;
    const now = this.now();
    if (!run || run.ownerId !== ownerId || run.leaseVersion !== leaseVersion || run.leaseUntil.getTime() <= now.getTime()) return false;
    run.lastOutcome = outcome;
    if (outcome === "success") run.lastSuccessfulAt = now;
    run.leaseUntil = new Date(0);
    return true;
  }

  async reclaimStalePendingAttempts(
    ownerId: string,
    runLeaseVersion: number,
    olderThan: Date,
    limit: number,
    orphanGraceMs: number,
  ): Promise<number> {
    if (!this.ownsCleanupRun(ownerId, runLeaseVersion)) return 0;
    const now = this.now();
    let reclaimed = 0;
    for (const record of this.records.values()) {
      const leaseExpired = !record.leaseUntil || record.leaseUntil.getTime() <= now.getTime();
      const missingLeaseIsOld = !record.leaseUntil && record.createdAt.getTime() <= olderThan.getTime();
      if (record.status !== "pending" || !leaseExpired || (record.leaseUntil === null && !missingLeaseIsOld)) continue;
      if (record.quotaAccountingStatus === "reserved" && record.ownerHash && record.environmentKey && record.quotaDay) {
        const bucket = this.getDailyBucket(record.environmentKey, record.ownerHash, record.quotaDay);
        bucket.reservedLinks = Math.max(0, bucket.reservedLinks - 1);
        record.quotaAccountingStatus = "released";
      }
      const obligation = record.environmentKey
        ? this.blobObligations.get(`${record.environmentKey}:${record.blobPathname}`)
        : undefined;
      if (obligation && obligation.byteState === "reserved") {
        this.setObligationState(obligation, "unknown", Math.max(obligation.liableBytes, BELGE_SHARE_CONFIG.MAX_PDF_SIZE_BYTES));
        obligation.nextAttemptAt = new Date(now.getTime() + orphanGraceMs);
      }
      record.status = "failed";
      record.lastPurgeErrorCode = "ATTEMPT_LEASE_EXPIRED";
      record.leaseUntil = null;
      reclaimed += 1;
      if (reclaimed >= limit) break;
    }
    return reclaimed;
  }

  async registerOrphanObligations(
    ownerId: string,
    runLeaseVersion: number,
    environmentKey: BelgeShareEnvironment,
    candidates: readonly { pathname: string; sizeBytes: number }[],
  ): Promise<number> {
    if (!this.ownsCleanupRun(ownerId, runLeaseVersion)) return 0;
    const now = this.now();
    let registered = 0;
    for (const { pathname, sizeBytes } of candidates) {
      if (!pathname.startsWith(BELGE_SHARE_CONFIG.BLOB_PATH_PREFIX) || pathname.includes("..") || pathname.includes("\\") ||
        !Number.isSafeInteger(sizeBytes) || sizeBytes < 0) continue;
      const liveRecord = Array.from(this.records.values()).find((record) =>
        record.blobPathname === pathname &&
        ((record.status === "ready" && !record.revokedAt && record.expiresAt.getTime() > now.getTime()) ||
          (record.status === "pending" && (record.leaseUntil?.getTime() ?? 0) > now.getTime()))
      );
      if (liveRecord) continue;
      const key = `${environmentKey}:${pathname}`;
      const existing = this.blobObligations.get(key);
      if (existing && existing.byteState !== "deleted") continue;
      if (existing) {
        this.setObligationState(existing, "deletion_pending", sizeBytes, sizeBytes);
        existing.nextAttemptAt = now;
        existing.purgeReason = "ORPHAN_RECONCILIATION";
        existing.cleanupOwnerId = null;
        existing.cleanupLeaseUntil = null;
      } else {
        this.blobObligations.set(key, {
          id: `mem-blob-${++this.nextMemoryId}`,
          shareId: null,
          attemptId: null,
          environmentKey,
          ownerHash: null,
          quotaDay: null,
          pathname,
          byteState: "deletion_pending",
          liableBytes: sizeBytes,
          actualBytes: sizeBytes,
          createdAt: now,
          cleanupRequestedAt: now,
          attemptCount: 0,
          nextAttemptAt: now,
          purgeReason: "ORPHAN_RECONCILIATION",
          cleanupOwnerId: null,
          cleanupLeaseVersion: 0,
          cleanupLeaseUntil: null,
        });
      }
      registered += 1;
    }
    return registered;
  }

  async claimDueCleanupBlobs(
    environmentKey: BelgeShareEnvironment,
    ownerId: string,
    runLeaseVersion: number,
    limit: number,
    leaseDurationMs: number,
  ): Promise<BelgePaylasimCleanupBlobClaim[]> {
    if (!this.ownsCleanupRun(ownerId, runLeaseVersion)) return [];
    const now = this.now();
    const claims: BelgePaylasimCleanupBlobClaim[] = [];
    for (const obligation of this.blobObligations.values()) {
      if (obligation.environmentKey !== environmentKey || obligation.byteState === "deleted" || obligation.byteState === "reserved") continue;
      const record = obligation.shareId ? this.records.get(obligation.shareId) : undefined;
      const isDueStatus = obligation.byteState === "deletion_pending" || obligation.byteState === "unknown";
      const isExpiredCommit = obligation.byteState === "committed" && Boolean(record &&
        (record.status === "revoked" || record.revokedAt || record.expiresAt.getTime() <= now.getTime()));
      const dueAt = obligation.nextAttemptAt ?? (obligation.byteState === "unknown"
        ? new Date(obligation.createdAt.getTime() + 24 * 60 * 60 * 1000)
        : now);
      const leaseFree = !obligation.cleanupLeaseUntil || obligation.cleanupLeaseUntil.getTime() <= now.getTime();
      const activeWriter = record?.status === "pending" && record.blobPathname === obligation.pathname &&
        (record.leaseUntil?.getTime() ?? 0) > now.getTime();
      if ((!isDueStatus && !isExpiredCommit) || dueAt.getTime() > now.getTime() || !leaseFree || activeWriter) continue;
      obligation.cleanupOwnerId = ownerId;
      obligation.cleanupLeaseVersion += 1;
      obligation.cleanupLeaseUntil = new Date(now.getTime() + leaseDurationMs);
      claims.push({
        id: obligation.id, shareId: obligation.shareId, environmentKey, blobPathname: obligation.pathname,
        byteState: obligation.byteState, liableBytes: obligation.liableBytes, actualBytes: obligation.actualBytes,
        ownerId, leaseVersion: obligation.cleanupLeaseVersion, runLeaseVersion,
      });
      if (claims.length >= limit) break;
    }
    return claims;
  }

  async completeCleanupBlob(claim: BelgePaylasimCleanupBlobClaim): Promise<boolean> {
    const obligation = Array.from(this.blobObligations.values()).find((row) => row.id === claim.id);
    const now = this.now();
    if (!this.ownsCleanupRun(claim.ownerId, claim.runLeaseVersion)) return false;
    if (!obligation || obligation.cleanupOwnerId !== claim.ownerId || obligation.cleanupLeaseVersion !== claim.leaseVersion ||
      !obligation.cleanupLeaseUntil || obligation.cleanupLeaseUntil.getTime() <= now.getTime()) return false;
    this.setObligationState(obligation, "deleted", 0, obligation.actualBytes);
    obligation.nextAttemptAt = null;
    obligation.cleanupOwnerId = null;
    obligation.cleanupLeaseUntil = null;
    const record = obligation.shareId ? this.records.get(obligation.shareId) : undefined;
    if (record && (record.status === "revoked" || record.revokedAt || record.expiresAt.getTime() <= now.getTime())) {
      record.status = "purged";
      record.purgedAt = now;
    }
    return true;
  }

  async failCleanupBlob(claim: BelgePaylasimCleanupBlobClaim, errorCode: string): Promise<boolean> {
    const obligation = Array.from(this.blobObligations.values()).find((row) => row.id === claim.id);
    const now = this.now();
    if (!this.ownsCleanupRun(claim.ownerId, claim.runLeaseVersion)) return false;
    if (!obligation || obligation.cleanupOwnerId !== claim.ownerId || obligation.cleanupLeaseVersion !== claim.leaseVersion ||
      !obligation.cleanupLeaseUntil || obligation.cleanupLeaseUntil.getTime() <= now.getTime()) return false;
    obligation.attemptCount += 1;
    const retryMs = Math.min(24 * 60 * 60 * 1000, 60_000 * (2 ** Math.min(obligation.attemptCount - 1, 10)));
    this.setObligationState(obligation, "deletion_pending", Math.max(obligation.liableBytes, obligation.actualBytes ?? 0));
    obligation.nextAttemptAt = new Date(now.getTime() + retryMs);
    obligation.purgeReason = errorCode;
    obligation.cleanupOwnerId = null;
    obligation.cleanupLeaseUntil = null;
    const record = obligation.shareId ? this.records.get(obligation.shareId) : undefined;
    if (record) {
      record.purgeAttempts += 1;
      record.lastPurgeErrorCode = errorCode;
    }
    return true;
  }

  async getCleanupMetrics(environmentKey: BelgeShareEnvironment): Promise<BelgePaylasimCleanupMetrics> {
    const now = this.now();
    const rows = Array.from(this.blobObligations.values()).filter((obligation) => obligation.environmentKey === environmentKey &&
      (obligation.byteState === "deletion_pending" || obligation.byteState === "unknown" ||
        (obligation.byteState === "committed" && Array.from(this.records.values()).some((record) =>
          record.blobPathname === obligation.pathname && (record.status === "revoked" || record.revokedAt || record.expiresAt.getTime() <= now.getTime())))));
    const dueRows = rows.filter((obligation) => {
      const record = obligation.shareId ? this.records.get(obligation.shareId) : undefined;
      const dueAt = obligation.nextAttemptAt ?? (obligation.byteState === "unknown"
        ? new Date(obligation.createdAt.getTime() + 24 * 60 * 60 * 1000)
        : now);
      const activeWriter = record?.status === "pending" && record.blobPathname === obligation.pathname &&
        (record.leaseUntil?.getTime() ?? 0) > now.getTime();
      return dueAt.getTime() <= now.getTime() && !activeWriter;
    });
    const pendingAges = rows.map((obligation) => {
      if (obligation.byteState === "committed") {
        const record = obligation.shareId ? this.records.get(obligation.shareId) : undefined;
        return record?.revokedAt ?? record?.expiresAt ?? obligation.cleanupRequestedAt ?? obligation.createdAt;
      }
      return obligation.cleanupRequestedAt ?? obligation.createdAt;
    });
    const run = this.cleanupRun;
    return {
      pendingDeleteCount: rows.length,
      dueDeleteCount: dueRows.length,
      leasedDeleteCount: dueRows.filter((row) => (row.cleanupLeaseUntil?.getTime() ?? 0) > now.getTime()).length,
      failedDeleteCount: rows.filter((row) => row.attemptCount > 0).length,
      pendingDeleteBytes: rows.reduce((sum, row) => sum + row.liableBytes, 0),
      oldestPendingDeleteAt: pendingAges.length ? new Date(Math.min(...pendingAges.map((date) => date.getTime()))) : null,
      lastSuccessfulAt: run?.lastSuccessfulAt ?? null,
      lastOutcome: run?.lastOutcome ?? null,
      liableBytes: this.getLiableBytes(),
    };
  }

  async purgeCleanupTombstones(
    ownerId: string,
    runLeaseVersion: number,
    olderThan: Date,
    limit: number,
  ): Promise<number> {
    if (!this.ownsCleanupRun(ownerId, runLeaseVersion)) return 0;
    return this.purgeOldTombstones(olderThan, limit);
  }

  private ownsCleanupRun(ownerId: string, leaseVersion: number): boolean {
    return Boolean(this.cleanupRun && this.cleanupRun.ownerId === ownerId && this.cleanupRun.leaseVersion === leaseVersion &&
      this.cleanupRun.leaseUntil.getTime() > this.now().getTime());
  }

  clear(): void {
    this.records.clear();
  }

  updateExpiresAtForTest(id: string, expiresAt: Date): void {
    const record = this.records.get(id);
    if (record) {
      record.expiresAt = expiresAt;
    }
  }

  expireAttemptLeaseForTest(id: string, leaseUntil = new Date(Date.now() - 1)): void {
    const record = this.records.get(id);
    if (record) record.leaseUntil = leaseUntil;
  }

  extendAttemptLeaseForTest(id: string, leaseUntil: Date): void {
    const record = this.records.get(id);
    if (record) record.leaseUntil = leaseUntil;
  }

  getAllRecordsForTest(): BelgePaylasimRecord[] {
    return Array.from(this.records.values());
  }
}

/**
 * Neon Serverless PostgreSQL repository adaptörü (Production).
 */
export class NeonBelgePaylasimRepository implements BelgePaylasimRepository {
  private readonly sql: NeonQueryFunction<false, false>;
  private schemaReadyPromise: Promise<void> | null = null;
  private readonly quotaConfigOverride?: BelgeShareQuotaConfig;

  constructor(dbUrl = getDatabaseUrl(), queryClient?: NeonQueryFunction<false, false>, quotaConfigOverride?: BelgeShareQuotaConfig) {
    if (!dbUrl && !queryClient) {
      throw new BelgeShareRuntimeError("DATABASE_NOT_CONFIGURED");
    }
    this.sql = queryClient ?? neon(dbUrl!);
    this.quotaConfigOverride = quotaConfigOverride;
  }

  private getQuotaConfig(): BelgeShareQuotaConfig {
    return this.quotaConfigOverride ?? getBelgeShareQuotaConfig();
  }

  private throwQuotaFailureFromRow(row: Record<string, unknown>): never {
    const code = String(row.outcome) as BelgeShareQuotaFailureCode;
    const quota = {
      usedLinks: Number(row.used_links ?? 0),
      reservedLinks: Number(row.reserved_links ?? 0),
      quotaDay: String(row.quota_day).slice(0, 10),
      serverNow: row.server_now instanceof Date ? row.server_now : new Date(String(row.server_now)),
      resetAt: row.reset_at instanceof Date ? row.reset_at : new Date(String(row.reset_at)),
    };
    throw new BelgeShareQuotaError(code, quota);
  }

  private recordFromJson(value: unknown): BelgePaylasimRecord | null {
    if (!value) return null;
    const row = typeof value === "string" ? JSON.parse(value) as Record<string, unknown> : value as Record<string, unknown>;
    return this.mapRow(row);
  }

  private async ensureSchemaReady(): Promise<void> {
    if (this.schemaReadyPromise) return this.schemaReadyPromise;
    this.schemaReadyPromise = assertBelgeShareSchemaReady((statement) =>
      this.sql.query(statement)
    ).catch((error: unknown) => {
      this.schemaReadyPromise = null;
      throw error;
    });
    return this.schemaReadyPromise;
  }

  private mapRow(row: Record<string, unknown>): BelgePaylasimRecord {
    return {
      id: String(row.id),
      requestIdHash: String(row.request_id_hash),
      payloadDigest: String(row.payload_digest),
      tokenHash: String(row.token_hash),
      manageTokenHash: String(row.manage_token_hash),
      documentId: row.document_id as BelgePaylasimDocumentId,
      blobPathname: String(row.blob_pathname),
      sizeBytes: row.size_bytes != null ? Number(row.size_bytes) : null,
      pdfSha256: row.pdf_sha256 != null ? String(row.pdf_sha256) : null,
      status: row.status as BelgePaylasimStatus,
      creatorIpHash: String(row.creator_ip_hash),
      createdAt: new Date(String(row.created_at)),
      expiresAt: new Date(String(row.expires_at)),
      revokedAt: row.revoked_at ? new Date(String(row.revoked_at)) : null,
      purgedAt: row.purged_at ? new Date(String(row.purged_at)) : null,
      purgeAttempts: Number(row.purge_attempts || 0),
      lastPurgeErrorCode: row.last_purge_error_code ? String(row.last_purge_error_code) : null,
      leaseUntil: row.lease_until ? new Date(String(row.lease_until)) : null,
      ownerHash: row.owner_hash ? String(row.owner_hash) : null,
      ownerVersion: row.owner_version != null ? Number(row.owner_version) : null,
      requestVersion: row.request_version != null ? Number(row.request_version) : null,
      proofHash: row.proof_hash ? String(row.proof_hash) : null,
      proofVersion: row.proof_version != null ? Number(row.proof_version) : null,
      tokenVersion: row.token_version != null ? Number(row.token_version) : null,
      tokenKeyVersion: row.token_key_version != null ? Number(row.token_key_version) : null,
      reservationNonce: row.reservation_nonce instanceof Uint8Array ? new Uint8Array(row.reservation_nonce) : null,
      environmentKey: row.environment_key ? String(row.environment_key) as BelgePaylasimRecord["environmentKey"] : null,
      attemptId: row.attempt_id ? String(row.attempt_id) : null,
      attemptVersion: Number(row.attempt_version || 0),
      readyAt: row.ready_at ? new Date(String(row.ready_at)) : null,
      quotaDay: row.quota_day ? String(row.quota_day).slice(0, 10) : null,
      quotaAccountingStatus: row.quota_accounting_status
        ? String(row.quota_accounting_status) as BelgePaylasimRecord["quotaAccountingStatus"]
        : null,
      purgeReason: row.purge_reason ? String(row.purge_reason) : null,
    };
  }

  async findByRequestIdHash(requestIdHash: string): Promise<BelgePaylasimRecord | null> {
    await this.ensureSchemaReady();
    const rows = await this.sql`
      SELECT * FROM belge_paylasim_links WHERE request_id_hash = ${requestIdHash} LIMIT 1;
    `;
    return rows[0] ? this.mapRow(rows[0] as Record<string, unknown>) : null;
  }

  async findByTokenHash(tokenHash: string): Promise<BelgePaylasimRecord | null> {
    await this.ensureSchemaReady();
    const rows = await this.sql`
      SELECT * FROM belge_paylasim_links WHERE token_hash = ${tokenHash} LIMIT 1;
    `;
    return rows[0] ? this.mapRow(rows[0] as Record<string, unknown>) : null;
  }

  async findByManageTokenHash(manageTokenHash: string): Promise<BelgePaylasimRecord | null> {
    await this.ensureSchemaReady();
    const rows = await this.sql`
      SELECT * FROM belge_paylasim_links WHERE manage_token_hash = ${manageTokenHash} LIMIT 1;
    `;
    return rows[0] ? this.mapRow(rows[0] as Record<string, unknown>) : null;
  }

  async createPendingReservation(input: PendingReservationInput): Promise<BelgePaylasimRecord> {
    await this.ensureSchemaReady();
    const rows = await this.sql`
      INSERT INTO belge_paylasim_links (
        request_id_hash,
        payload_digest,
        token_hash,
        manage_token_hash,
        document_id,
        blob_pathname,
        status,
        creator_ip_hash,
        expires_at
      ) VALUES (
        ${input.requestIdHash},
        ${input.payloadDigest},
        ${input.tokenHash},
        ${input.manageTokenHash},
        ${input.documentId},
        ${input.blobPathname},
        'pending',
        ${input.creatorIpHash},
        ${input.expiresAt.toISOString()}
      )
      RETURNING *;
    `;

    if (!rows[0]) throw new Error("Pending rezervasyon oluşturulamadı.");
    return this.mapRow(rows[0] as Record<string, unknown>);
  }

  async createOrGetReservation(input: ReservationAttemptInput): Promise<CreateReservationResult> {
    await this.ensureSchemaReady();
    const limits = this.getQuotaConfig();
    const rows = await this.sql`
      SELECT * FROM belge_paylasim_reserve_v3(
        ${input.requestIdHash}, ${input.payloadDigest}, ${input.tokenHash}, ${input.manageTokenHash},
        ${input.documentId}, ${input.blobPathname}, ${input.creatorIpHash}, ${input.expiresAt.toISOString()},
        ${input.ownerHash}, ${input.ownerVersion}, ${input.requestVersion}, ${input.proofHash}, ${input.proofVersion},
        ${input.tokenVersion}, ${input.tokenKeyVersion}, ${Buffer.from(input.reservationNonce)}, ${input.environmentKey},
        ${input.attemptId}::uuid, ${BELGE_SHARE_CONFIG.MAX_PDF_SIZE_BYTES},
        ${BELGE_SHARE_CONFIG.DAILY_BROWSER_LINK_LIMIT}, ${limits.globalDailyLimit}, ${limits.globalMaxStorageBytes}
      );
    `;
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) throw new Error("Atomik paylaşım rezervasyonu sonuç döndürmedi.");
    if (String(row.outcome) !== "created" && String(row.outcome) !== "existing") this.throwQuotaFailureFromRow(row);
    const record = this.recordFromJson(row.record_json);
    if (!record) throw new Error("Atomik paylaşım rezervasyonu kayıt döndürmedi.");
    return { record, created: String(row.outcome) === "created" };
  }

  async beginRetryAttempt(
    id: string,
    attemptId: string,
    blobPathname: string,
    _leaseUntil: Date,
  ): Promise<BelgePaylasimRecord | null> {
    await this.ensureSchemaReady();
    const limits = this.getQuotaConfig();
    const rows = await this.sql`
      SELECT * FROM belge_paylasim_retry_v3(
        ${id}::uuid, ${attemptId}::uuid, ${blobPathname}, ${BELGE_SHARE_CONFIG.MAX_PDF_SIZE_BYTES},
        ${BELGE_SHARE_CONFIG.DAILY_BROWSER_LINK_LIMIT}, ${limits.globalDailyLimit}, ${limits.globalMaxStorageBytes}
      );
    `;
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) throw new Error("Atomik paylaşım tekrar rezervasyonu sonuç döndürmedi.");
    if (String(row.outcome) !== "retry" && String(row.outcome) !== "not_available") this.throwQuotaFailureFromRow(row);
    return String(row.outcome) === "retry" ? this.recordFromJson(row.record_json) : null;
  }

  async finalizeReady(
    id: string,
    sizeBytes: number,
    pdfSha256: string,
    attemptId?: string,
    attemptVersion?: number,
  ): Promise<boolean> {
    await this.ensureSchemaReady();
    const limits = this.getQuotaConfig();
    const rows = await this.sql`
      SELECT * FROM belge_paylasim_finalize_v3(
        ${id}::uuid, ${sizeBytes}, ${pdfSha256}, ${attemptId ?? null}::uuid, ${attemptVersion ?? null},
        ${BELGE_SHARE_CONFIG.MAX_PDF_SIZE_BYTES}, ${BELGE_SHARE_CONFIG.DAILY_BROWSER_LINK_LIMIT},
        ${limits.globalDailyLimit}, ${limits.globalMaxStorageBytes}, ${BELGE_SHARE_CONFIG.EXPIRATION_DAYS}
      );
    `;
    return Boolean((rows[0] as Record<string, unknown> | undefined)?.finalized);
  }

  async markFailed(
    id: string,
    errorCode: string,
    attemptId?: string,
    attemptVersion?: number,
    uploadState: "not_started" | "unknown" | "present" = "unknown",
    actualBytes?: number,
  ): Promise<boolean> {
    await this.ensureSchemaReady();
    const rows = attemptId !== undefined && attemptVersion !== undefined
      ? await this.sql`SELECT belge_paylasim_fail_v3(${id}::uuid, ${errorCode}, ${attemptId}::uuid, ${attemptVersion}, ${uploadState}, ${actualBytes ?? null}) AS changed;`
      : await this.sql`SELECT belge_paylasim_fail_v3(${id}::uuid, ${errorCode}, NULL::uuid, NULL::bigint, ${uploadState}, ${actualBytes ?? null}) AS changed;`;
    return Boolean((rows[0] as Record<string, unknown> | undefined)?.changed);
  }

  async revokeLink(id: string): Promise<void> {
    await this.ensureSchemaReady();
    await this.sql`SELECT belge_paylasim_retry_revoke_v3(${id}::uuid);`;
  }

  async markBlobDeleted(environmentKey: BelgeShareEnvironment, pathname: string): Promise<void> {
    await this.ensureSchemaReady();
    await this.sql`SELECT belge_paylasim_mark_blob_deleted_v3(${environmentKey}, ${pathname});`;
  }

  async getDailyQuota(
    environmentKey: BelgeShareEnvironment,
    ownerHash: string
  ): Promise<BelgePaylasimDailyQuotaSnapshot> {
    await this.ensureSchemaReady();
    const rows = await this.sql`
      WITH clock AS (
        SELECT
          NOW() AS server_now,
          (NOW() AT TIME ZONE 'Europe/Istanbul')::date AS quota_day
      )
      SELECT
        clock.quota_day::text AS quota_day,
        clock.server_now,
        ((clock.quota_day + 1)::timestamp AT TIME ZONE 'Europe/Istanbul') AS reset_at,
        COALESCE(quota.used_links, 0) AS used_links,
        COALESCE(quota.reserved_links, 0) AS reserved_links
      FROM clock
      LEFT JOIN belge_paylasim_daily_quotas AS quota
        ON quota.environment_key = ${environmentKey}
        AND quota.owner_hash = ${ownerHash}
        AND quota.quota_day = clock.quota_day;
    `;
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) throw new BelgeShareRuntimeError("SCHEMA_NOT_READY");
    return {
      usedLinks: Number(row.used_links),
      reservedLinks: Number(row.reserved_links),
      quotaDay: String(row.quota_day).slice(0, 10),
      serverNow: row.server_now instanceof Date ? row.server_now : new Date(String(row.server_now)),
      resetAt: row.reset_at instanceof Date ? row.reset_at : new Date(String(row.reset_at)),
    };
  }

  async getActiveStats(): Promise<{ activeCount: number; totalActiveBytes: number }> {
    await this.ensureSchemaReady();
    const rows = await this.sql`
      SELECT
        (SELECT COUNT(*) FROM belge_paylasim_links WHERE status = 'ready' AND expires_at > NOW() AND revoked_at IS NULL) AS active_count,
        COALESCE((SELECT SUM(liable_bytes) FROM belge_paylasim_blob_obligations WHERE byte_state <> 'deleted'), 0) AS total_active_bytes;
    `;
    const row = rows[0] as Record<string, string | number>;
    return {
      activeCount: Number(row?.active_count || 0),
      totalActiveBytes: Number(row?.total_active_bytes || 0),
    };
  }

  async claimExpiredForPurge(limit: number, leaseDurationMs: number): Promise<BelgePaylasimRecord[]> {
    await this.ensureSchemaReady();
    const leaseIntervalSeconds = Math.max(1, Math.floor(leaseDurationMs / 1000));
    const rows = await this.sql`
      WITH candidates AS (
        SELECT id
        FROM belge_paylasim_links
        WHERE (expires_at <= NOW() OR status = 'revoked')
          AND status != 'purged'
          AND (lease_until IS NULL OR lease_until < NOW())
        ORDER BY expires_at ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE belge_paylasim_links l
      SET lease_until = NOW() + (${leaseIntervalSeconds} * INTERVAL '1 second')
      FROM candidates c
      WHERE l.id = c.id
      RETURNING l.*;
    `;

    return rows.map((r) => this.mapRow(r as Record<string, unknown>));
  }

  async markPurged(id: string): Promise<void> {
    await this.ensureSchemaReady();
    await this.sql`SELECT belge_paylasim_mark_purged_v3(${id}::uuid);`;
  }

  async recordPurgeError(id: string, errorCode: string): Promise<void> {
    await this.ensureSchemaReady();
    await this.sql`SELECT belge_paylasim_record_purge_error_v3(${id}::uuid, ${errorCode});`;
  }

  async claimStalePendingForPurge(olderThan: Date, limit: number): Promise<BelgePaylasimRecord[]> {
    await this.ensureSchemaReady();
    const rows = await this.sql`
      SELECT *
      FROM belge_paylasim_links
      WHERE status = 'pending' AND created_at <= ${olderThan.toISOString()}
      ORDER BY created_at ASC
      LIMIT ${limit};
    `;
    return rows.map((r) => this.mapRow(r as Record<string, unknown>));
  }

  async hasRecordWithBlobPathname(pathname: string): Promise<boolean> {
    await this.ensureSchemaReady();
    const rows = await this.sql`
      SELECT 1 FROM belge_paylasim_links WHERE blob_pathname = ${pathname} LIMIT 1;
    `;
    return rows.length > 0;
  }

  async purgeOldTombstones(olderThan: Date, limit: number): Promise<number> {
    await this.ensureSchemaReady();
    const rows = await this.sql`
      WITH to_delete AS (
        SELECT id FROM belge_paylasim_links
        WHERE status = 'purged' AND purged_at <= ${olderThan.toISOString()}
        LIMIT ${limit}
      )
      DELETE FROM belge_paylasim_links
      WHERE id IN (SELECT id FROM to_delete)
      RETURNING id;
    `;
    return rows.length;
  }

  async claimCleanupRun(ownerId: string, leaseDurationMs: number): Promise<BelgePaylasimCleanupRun> {
    await this.ensureSchemaReady();
    const leaseSeconds = Math.max(5, Math.ceil(leaseDurationMs / 1000));
    const rows = await this.sql`
      SELECT * FROM belge_paylasim_cleanup_acquire_v3(${ownerId}::uuid, ${leaseSeconds});
    `;
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) throw new Error("Temizlik lease sonucu alınamadı.");
    return {
      acquired: Boolean(row.acquired),
      ownerId,
      leaseVersion: Number(row.lease_version),
      leaseUntil: row.lease_until ? new Date(String(row.lease_until)) : null,
      blobCursor: row.blob_cursor ? String(row.blob_cursor) : null,
      blobScanStartedAt: row.blob_scan_started_at ? new Date(String(row.blob_scan_started_at)) : null,
      lastSuccessfulAt: row.last_successful_at ? new Date(String(row.last_successful_at)) : null,
      lastOutcome: row.last_outcome ? String(row.last_outcome) as BelgePaylasimCleanupRun["lastOutcome"] : null,
    };
  }

  async saveCleanupCheckpoint(
    ownerId: string,
    leaseVersion: number,
    blobCursor: string | null,
    blobScanStartedAt: Date | null,
    leaseDurationMs: number,
  ): Promise<boolean> {
    await this.ensureSchemaReady();
    const leaseSeconds = Math.max(5, Math.ceil(leaseDurationMs / 1000));
    const rows = await this.sql`
      SELECT belge_paylasim_cleanup_checkpoint_v3(
        ${ownerId}::uuid, ${leaseVersion}::bigint, ${blobCursor}, ${blobScanStartedAt?.toISOString() ?? null}::timestamptz, ${leaseSeconds}
      ) AS saved;
    `;
    return Boolean((rows[0] as Record<string, unknown> | undefined)?.saved);
  }

  async finishCleanupRun(
    ownerId: string,
    leaseVersion: number,
    outcome: "success" | "partial" | "failed",
  ): Promise<boolean> {
    await this.ensureSchemaReady();
    const rows = await this.sql`
      SELECT belge_paylasim_cleanup_finish_v3(${ownerId}::uuid, ${leaseVersion}::bigint, ${outcome}) AS finished;
    `;
    return Boolean((rows[0] as Record<string, unknown> | undefined)?.finished);
  }

  async reclaimStalePendingAttempts(
    ownerId: string,
    runLeaseVersion: number,
    olderThan: Date,
    limit: number,
    orphanGraceMs: number,
  ): Promise<number> {
    await this.ensureSchemaReady();
    const graceSeconds = Math.max(0, Math.ceil(orphanGraceMs / 1000));
    const rows = await this.sql`
      SELECT belge_paylasim_cleanup_reclaim_pending_v3(
        ${ownerId}::uuid, ${runLeaseVersion}::bigint, ${olderThan.toISOString()}::timestamptz,
        ${limit}, ${graceSeconds}, ${BELGE_SHARE_CONFIG.MAX_PDF_SIZE_BYTES}
      ) AS reclaimed;
    `;
    return Number((rows[0] as Record<string, unknown> | undefined)?.reclaimed ?? 0);
  }

  async registerOrphanObligations(
    ownerId: string,
    runLeaseVersion: number,
    environmentKey: BelgeShareEnvironment,
    candidates: readonly { pathname: string; sizeBytes: number }[],
  ): Promise<number> {
    await this.ensureSchemaReady();
    const rows = await this.sql`
      SELECT belge_paylasim_cleanup_register_orphans_v3(
        ${ownerId}::uuid, ${runLeaseVersion}::bigint, ${environmentKey}, ${JSON.stringify(candidates.map((candidate) => ({
          pathname: candidate.pathname,
          size_bytes: Math.max(0, Math.trunc(candidate.sizeBytes)),
        })))}::jsonb, ${BELGE_SHARE_CONFIG.BLOB_PATH_PREFIX}
      ) AS registered_count;
    `;
    return Number((rows[0] as Record<string, unknown> | undefined)?.registered_count ?? 0);
  }

  async claimDueCleanupBlobs(
    environmentKey: BelgeShareEnvironment,
    ownerId: string,
    runLeaseVersion: number,
    limit: number,
    leaseDurationMs: number,
  ): Promise<BelgePaylasimCleanupBlobClaim[]> {
    await this.ensureSchemaReady();
    const leaseSeconds = Math.max(5, Math.ceil(leaseDurationMs / 1000));
    const rows = await this.sql`
      SELECT * FROM belge_paylasim_cleanup_claim_blobs_v3(
        ${environmentKey}, ${ownerId}::uuid, ${runLeaseVersion}::bigint, ${limit}, ${leaseSeconds}
      );
    `;
    return rows.map((value) => {
      const row = value as Record<string, unknown>;
      return {
        id: String(row.id),
        shareId: row.share_id ? String(row.share_id) : null,
        environmentKey: String(row.environment_key) as BelgeShareEnvironment,
        blobPathname: String(row.blob_pathname),
        byteState: String(row.byte_state) as BelgePaylasimCleanupBlobClaim["byteState"],
        liableBytes: Number(row.liable_bytes),
        actualBytes: row.actual_bytes == null ? null : Number(row.actual_bytes),
        ownerId,
        leaseVersion: Number(row.cleanup_lease_version),
        runLeaseVersion,
      };
    });
  }

  async completeCleanupBlob(claim: BelgePaylasimCleanupBlobClaim): Promise<boolean> {
    await this.ensureSchemaReady();
    const rows = await this.sql`
      SELECT belge_paylasim_cleanup_complete_blob_v3(
        ${claim.id}::uuid, ${claim.environmentKey}, ${claim.blobPathname}, ${claim.ownerId}::uuid,
        ${claim.leaseVersion}::bigint, ${claim.runLeaseVersion}::bigint
      ) AS completed;
    `;
    return Boolean((rows[0] as Record<string, unknown> | undefined)?.completed);
  }

  async failCleanupBlob(claim: BelgePaylasimCleanupBlobClaim, errorCode: string): Promise<boolean> {
    await this.ensureSchemaReady();
    const safeCode = /^[A-Z0-9_]{1,64}$/.test(errorCode) ? errorCode : "BLOB_DELETE_FAILED";
    const rows = await this.sql`
      SELECT belge_paylasim_cleanup_fail_blob_v3(
        ${claim.id}::uuid, ${claim.ownerId}::uuid, ${claim.leaseVersion}::bigint,
        ${claim.runLeaseVersion}::bigint, ${safeCode}
      ) AS recorded;
    `;
    return Boolean((rows[0] as Record<string, unknown> | undefined)?.recorded);
  }

  async getCleanupMetrics(environmentKey: BelgeShareEnvironment): Promise<BelgePaylasimCleanupMetrics> {
    await this.ensureSchemaReady();
    const rows = await this.sql`SELECT * FROM belge_paylasim_cleanup_metrics_v3(${environmentKey});`;
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) throw new Error("Temizlik metriği alınamadı.");
    return {
      pendingDeleteCount: Number(row.pending_delete_count ?? 0),
      dueDeleteCount: Number(row.due_delete_count ?? 0),
      leasedDeleteCount: Number(row.leased_delete_count ?? 0),
      failedDeleteCount: Number(row.failed_delete_count ?? 0),
      pendingDeleteBytes: Number(row.pending_delete_bytes ?? 0),
      oldestPendingDeleteAt: row.oldest_pending_delete_at ? new Date(String(row.oldest_pending_delete_at)) : null,
      lastSuccessfulAt: row.last_successful_at ? new Date(String(row.last_successful_at)) : null,
      lastOutcome: row.last_outcome ? String(row.last_outcome) as BelgePaylasimCleanupMetrics["lastOutcome"] : null,
      liableBytes: Number(row.liable_bytes ?? 0),
    };
  }

  async purgeCleanupTombstones(
    ownerId: string,
    runLeaseVersion: number,
    olderThan: Date,
    limit: number,
  ): Promise<number> {
    await this.ensureSchemaReady();
    const rows = await this.sql`
      SELECT belge_paylasim_cleanup_purge_tombstones_v3(
        ${ownerId}::uuid, ${runLeaseVersion}::bigint, ${olderThan.toISOString()}::timestamptz, ${limit}
      ) AS purged_count;
    `;
    return Number((rows[0] as Record<string, unknown> | undefined)?.purged_count ?? 0);
  }
}

let activeRepository: BelgePaylasimRepository | null = null;

export function getBelgePaylasimRepository(): BelgePaylasimRepository {
  if (activeRepository) return activeRepository;

  if (!hasDatabaseUrl()) {
    throw new BelgeShareRuntimeError("DATABASE_NOT_CONFIGURED");
  }
  activeRepository = new NeonBelgePaylasimRepository();
  return activeRepository;
}

export function setBelgePaylasimRepositoryForTest(repo: BelgePaylasimRepository | null): void {
  if (repo && (process.env.NODE_ENV === "production" || process.env.VERCEL)) {
    throw new BelgeShareRuntimeError("TEST_ADAPTER_FORBIDDEN");
  }
  activeRepository = repo;
}
