// ============================================================================
// BELGE PAYLAŞIM — TİP TANIMLARI
// ============================================================================

export type BelgePaylasimStatus = "pending" | "ready" | "revoked" | "purged" | "failed";
export type BelgeShareEnvironment = "local" | "development" | "preview" | "production";
export type BelgePaylasimQuotaAccountingStatus = "reserved" | "used" | "released";
export type BelgePaylasimBlobByteState =
  | "reserved"
  | "committed"
  | "deletion_pending"
  | "unknown"
  | "deleted";

/** V3 günlük sayaç satırı; owner alanı yalnız sunucuda üretilmiş hash taşır. */
export interface BelgePaylasimDailyQuota {
  environmentKey: BelgeShareEnvironment;
  ownerHash: string;
  quotaDay: string;
  reservedLinks: number;
  usedLinks: number;
  reservedBytes: number;
  committedBytes: number;
  deletionPendingBytes: number;
  unknownUploadBytes: number;
}

/** Kota hazırlık endpoint'inin anonim tarayıcıya gösterebildiği iki sayaç. */
export interface BelgePaylasimDailyQuotaCounts {
  usedLinks: number;
  reservedLinks: number;
}

export interface BelgePaylasimDailyQuotaSnapshot extends BelgePaylasimDailyQuotaCounts {
  quotaDay: string;
  serverNow: Date;
  resetAt: Date;
}

/** Tombstone GC'den bağımsız fiziksel Blob silme/byte yükümlülüğü. */
export interface BelgePaylasimBlobObligation {
  id: string;
  shareId: string | null;
  attemptId: string | null;
  environmentKey: BelgeShareEnvironment;
  ownerHash: string | null;
  quotaDay: string | null;
  blobPathname: string;
  byteState: BelgePaylasimBlobByteState;
  liableBytes: number;
  actualBytes: number | null;
  purgeReason: string | null;
  attemptCount: number;
  nextAttemptAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type BelgePaylasimDocumentId =
  | "beton-dokum-tutanagi"
  | "santiye-sefi-taahhutnamesi"
  | "santiye-sefi-istifa-dilekcesi"
  | "insaat-ruhsati-dilekcesi"
  | "santiye-sefi-sozlesmesi";

export interface BelgePaylasimRecord {
  id: string;
  requestIdHash: string;
  payloadDigest: string;
  tokenHash: string;
  manageTokenHash: string;
  documentId: BelgePaylasimDocumentId;
  blobPathname: string;
  sizeBytes: number | null;
  pdfSha256: string | null;
  status: BelgePaylasimStatus;
  creatorIpHash: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  purgedAt: Date | null;
  purgeAttempts: number;
  lastPurgeErrorCode: string | null;
  leaseUntil: Date | null;
  ownerHash?: string | null;
  ownerVersion?: number | null;
  requestVersion?: number | null;
  proofHash?: string | null;
  proofVersion?: number | null;
  tokenVersion?: number | null;
  tokenKeyVersion?: number | null;
  reservationNonce?: Uint8Array | null;
  environmentKey?: BelgeShareEnvironment | null;
  attemptId?: string | null;
  attemptVersion?: number;
  readyAt?: Date | null;
  quotaDay?: string | null;
  quotaAccountingStatus?: BelgePaylasimQuotaAccountingStatus | null;
  purgeReason?: string | null;
}

/** Kalıcı cron kilidi ve yetim tarama checkpoint'i. */
export interface BelgePaylasimCleanupRun {
  acquired: boolean;
  ownerId: string;
  leaseVersion: number;
  leaseUntil: Date | null;
  blobCursor: string | null;
  blobScanStartedAt: Date | null;
  lastSuccessfulAt: Date | null;
  lastOutcome: "success" | "partial" | "failed" | null;
}

/** Fiziksel silme kuyruğunda fencing ile sahiplenilen tek Blob borcu. */
export interface BelgePaylasimCleanupBlobClaim {
  id: string;
  shareId: string | null;
  environmentKey: BelgeShareEnvironment;
  blobPathname: string;
  byteState: BelgePaylasimBlobByteState;
  liableBytes: number;
  actualBytes: number | null;
  ownerId: string;
  leaseVersion: number;
  runLeaseVersion: number;
}

/** Kullanıcı verisi içermeyen, cron yanıtına uygun toplu gözlemlenebilirlik. */
export interface BelgePaylasimCleanupMetrics {
  pendingDeleteCount: number;
  dueDeleteCount: number;
  leasedDeleteCount: number;
  failedDeleteCount: number;
  pendingDeleteBytes: number;
  oldestPendingDeleteAt: Date | null;
  lastSuccessfulAt: Date | null;
  lastOutcome: "success" | "partial" | "failed" | null;
  liableBytes: number;
}

export interface PendingReservationInput {
  requestIdHash: string;
  payloadDigest: string;
  tokenHash: string;
  manageTokenHash: string;
  documentId: BelgePaylasimDocumentId;
  blobPathname: string;
  creatorIpHash: string;
  expiresAt: Date;
  ownerHash?: string | null;
  ownerVersion?: number | null;
  requestVersion?: number | null;
  proofHash?: string | null;
  proofVersion?: number | null;
  tokenVersion?: number | null;
  tokenKeyVersion?: number | null;
  reservationNonce?: Uint8Array | null;
  environmentKey?: BelgeShareEnvironment | null;
  attemptId?: string | null;
  attemptVersion?: number;
  leaseUntil?: Date | null;
}

export interface ReservationAttemptInput extends PendingReservationInput {
  ownerHash: string;
  ownerVersion: number;
  requestVersion: number;
  proofHash: string;
  proofVersion: number;
  tokenVersion: number;
  tokenKeyVersion: number;
  reservationNonce: Uint8Array;
  environmentKey: BelgeShareEnvironment;
  attemptId: string;
  attemptVersion: number;
  leaseUntil: Date;
}

export interface CreateReservationResult {
  record: BelgePaylasimRecord;
  created: boolean;
}

export interface BelgeShareTokens {
  viewToken: string;
  manageToken: string;
  viewTokenHash: string;
  manageTokenHash: string;
}

export interface CreateShareReservationParams {
  clientRequestId: string;
  documentId: BelgePaylasimDocumentId;
  values: Record<string, string>;
  creatorIp: string;
  ownerHash?: string;
  environmentKey?: BelgeShareEnvironment;
  replayProof?: string;
}

export interface CreateShareReservationResult {
  status: "new" | "retry" | "in_flight" | "existing_ready" | "conflict";
  record?: BelgePaylasimRecord;
  tokens?: BelgeShareTokens;
  url?: string;
  manageToken?: string;
  expiresAt?: string;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  retryAfterSeconds?: number;
}
